import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 4173;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;
const LIVE_URL = 'https://rkalani1.github.io/stroke/';
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];
const REQUIRED_TABS = ['Dashboard', 'Encounter', 'Library', 'Settings'];
const REQUIRED_DIAGNOSIS = [
  /Ischemic Stroke or TIA/i,
  /Intracranial Hemorrhage/i,
  /SAH/i,
  /CVT/i,
  /Stroke Mimic\/Other/i
];
const DIAGNOSIS_SWITCH_ASSERTIONS = [
  { label: 'Ischemic Stroke or TIA', activeClass: 'bg-blue-500', expectTNK: true },
  { label: 'Intracranial Hemorrhage', activeClass: 'bg-red-500', expectTNK: false },
  { label: 'SAH', activeClass: 'bg-purple-500', expectTNK: false },
  { label: 'CVT', activeClass: 'bg-indigo-500', expectTNK: false },
  { label: 'Stroke Mimic/Other', activeClass: 'bg-amber-500', expectTNK: false }
];

const DEFAULT_RUN_DURATION_THRESHOLD_MS = 45000;
const DEFAULT_SECTION_DURATION_THRESHOLD_MS = 15000;
const DEFAULT_LATENCY_PROFILES = {
  flat: {},
  adaptive: {
    runThresholdByTargetViewport: {
      'local/desktop': 40000,
      'local/tablet': 43000,
      'local/mobile': 46000,
      'live/desktop': 42000,
      'live/tablet': 45000,
      'live/mobile': 50000
    },
    sectionThresholdBySection: {
      'encounter-workflow': 22000,
      'library-workflow': 18000,
      'pediatric-workflow': 20000
    }
  }
};
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const localOnly = args.has('--local-only');
const enforceLatencyThresholds = args.has('--enforce-latency-thresholds');
const outDir = path.join(process.cwd(), 'output', 'playwright');
const reportFile = path.join(outDir, 'qa-smoke-report.json');
const latencyHistoryFile = path.join(process.cwd(), 'docs', 'qa-latency-history.json');

function parsePositiveIntArg(flag, fallback) {
  const index = rawArgs.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number.parseInt(rawArgs[index + 1] || '', 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid value for ${flag}. Provide a positive integer in milliseconds.`);
  }
  return value;
}

function parseStringArg(flag, fallback) {
  const index = rawArgs.indexOf(flag);
  if (index === -1) return fallback;
  const value = String(rawArgs[index + 1] || '').trim();
  if (!value) throw new Error(`Invalid value for ${flag}. Provide a non-empty string value.`);
  return value;
}

function parseOptionalStringArg(flag) {
  const index = rawArgs.indexOf(flag);
  if (index === -1) return null;
  const value = String(rawArgs[index + 1] || '').trim();
  if (!value) throw new Error(`Invalid value for ${flag}. Provide a non-empty string value.`);
  return value;
}

function normalizeThresholdMap(rawMap, fieldLabel) {
  if (rawMap == null) return {};
  if (typeof rawMap !== 'object' || Array.isArray(rawMap)) {
    throw new Error(`${fieldLabel} must be an object mapping keys to positive millisecond values.`);
  }
  const normalized = {};
  for (const [key, value] of Object.entries(rawMap)) {
    const trimmedKey = String(key || '').trim();
    if (!trimmedKey) {
      throw new Error(`${fieldLabel} contains an empty key.`);
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      throw new Error(`${fieldLabel}.${trimmedKey} must be a positive numeric millisecond value.`);
    }
    normalized[trimmedKey] = Math.round(numeric);
  }
  return normalized;
}

function normalizeLatencyProfile(profileName, rawProfile) {
  if (rawProfile == null) rawProfile = {};
  if (typeof rawProfile !== 'object' || Array.isArray(rawProfile)) {
    throw new Error(`Latency profile "${profileName}" must be an object.`);
  }
  return {
    runThresholdByTargetViewport: normalizeThresholdMap(
      rawProfile.runThresholdByTargetViewport,
      `profiles.${profileName}.runThresholdByTargetViewport`
    ),
    sectionThresholdBySection: normalizeThresholdMap(
      rawProfile.sectionThresholdBySection,
      `profiles.${profileName}.sectionThresholdBySection`
    ),
    sectionThresholdByTargetViewportSection: normalizeThresholdMap(
      rawProfile.sectionThresholdByTargetViewportSection,
      `profiles.${profileName}.sectionThresholdByTargetViewportSection`
    )
  };
}

function loadLatencyProfiles(fileArg) {
  const defaults = Object.fromEntries(
    Object.entries(DEFAULT_LATENCY_PROFILES).map(([name, profile]) => [name, normalizeLatencyProfile(name, profile)])
  );
  if (!fileArg) {
    return { profiles: defaults, sourcePath: null };
  }

  const resolvedPath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  let parsed;
  try {
    const raw = fsSync.readFileSync(resolvedPath, 'utf8');
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read latency profile file "${resolvedPath}": ${error?.message || String(error)}`);
  }

  const profileObject =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.profiles && typeof parsed.profiles === 'object'
      ? parsed.profiles
      : parsed;
  if (!profileObject || typeof profileObject !== 'object' || Array.isArray(profileObject)) {
    throw new Error(`Latency profile file "${resolvedPath}" must contain an object or { "profiles": { ... } }.`);
  }

  const merged = { ...defaults };
  for (const [name, rawProfile] of Object.entries(profileObject)) {
    const profileName = String(name || '').trim();
    if (!profileName) throw new Error(`Latency profile file "${resolvedPath}" contains an empty profile name.`);
    merged[profileName] = normalizeLatencyProfile(profileName, rawProfile);
  }
  return { profiles: merged, sourcePath: resolvedPath };
}

const runDurationThresholdMs = parsePositiveIntArg('--run-duration-threshold-ms', DEFAULT_RUN_DURATION_THRESHOLD_MS);
const sectionDurationThresholdMs = parsePositiveIntArg(
  '--section-duration-threshold-ms',
  DEFAULT_SECTION_DURATION_THRESHOLD_MS
);
const latencyProfilesFileArg = parseOptionalStringArg('--latency-profiles-file');
const latencyProfileBundle = loadLatencyProfiles(latencyProfilesFileArg);
const latencyProfiles = latencyProfileBundle.profiles;
const latencyProfilesSourcePath = latencyProfileBundle.sourcePath;
const latencyProfile = parseStringArg('--latency-profile', 'flat');
if (!Object.prototype.hasOwnProperty.call(latencyProfiles, latencyProfile)) {
  throw new Error(
    `Invalid --latency-profile value "${latencyProfile}". Supported: ${Object.keys(latencyProfiles).join(', ')}.`
  );
}
const activeLatencyProfile = latencyProfiles[latencyProfile];

function resolveRunThresholdMs(targetName, viewportName) {
  const key = `${targetName}/${viewportName}`;
  const profileThreshold = activeLatencyProfile?.runThresholdByTargetViewport?.[key];
  if (Number.isFinite(profileThreshold)) {
    return profileThreshold;
  }
  return runDurationThresholdMs;
}

function resolveSectionThresholdMs(targetName, viewportName, sectionName) {
  const scopedKey = `${targetName}/${viewportName}:${sectionName}`;
  const scopedThreshold = activeLatencyProfile?.sectionThresholdByTargetViewportSection?.[scopedKey];
  if (Number.isFinite(scopedThreshold)) {
    return scopedThreshold;
  }
  const sectionThreshold = activeLatencyProfile?.sectionThresholdBySection?.[sectionName];
  if (Number.isFinite(sectionThreshold)) {
    return sectionThreshold;
  }
  return sectionDurationThresholdMs;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) return;
    } catch {
      // Server may still be booting.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function canReach(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function updateLatencyHistory(summary) {
  let history = [];
  try {
    const raw = await fs.readFile(latencyHistoryFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) history = parsed;
  } catch {
    history = [];
  }

  history.push({
    finishedAt: summary.finishedAt,
    localOnly: summary.localOnly,
    latencyProfile: summary.latencyProfile,
    averageRunDurationMs: summary.averageRunDurationMs,
    slowestRun: summary.slowestRun,
    slowRunCount: summary.slowRunCount,
    slowSectionCount: summary.slowSectionCount
  });
  const trimmedHistory = history.slice(-60);
  await fs.mkdir(path.dirname(latencyHistoryFile), { recursive: true });
  await fs.writeFile(latencyHistoryFile, `${JSON.stringify(trimmedHistory, null, 2)}\n`, 'utf8');
  return {
    path: path.relative(process.cwd(), latencyHistoryFile),
    count: trimmedHistory.length
  };
}

async function fetchAppVersion(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function startLocalServer() {
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const server = spawn(pythonCmd, ['-m', 'http.server', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    if (!server.killed) server.kill('SIGTERM');
  };

  return { stop, process: server };
}

function addIssue(issues, type, details = {}) {
  issues.push({ type, ...details });
}

async function getActiveTabLabel(page) {
  const active = page.locator('button.tab-pill.active').first();
  if ((await active.count()) === 0) return null;
  return (await active.innerText()).trim();
}

async function auditView(browser, target, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(60000);
  const issues = [];
  const notes = {};
  const sectionTimings = [];
  const markSectionStart = (name) => ({ name, startedAtMs: Date.now() });
  const markSectionEnd = (section) => {
    sectionTimings.push({
      section: section.name,
      durationMs: Date.now() - section.startedAtMs
    });
  };
  const runStartedAtMs = Date.now();
  notes.sectionTimings = sectionTimings;
  let postEvtPlanConfigured = false;

  page.on('pageerror', (err) => addIssue(issues, 'pageerror', { message: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') addIssue(issues, 'console-error', { message: msg.text() });
  });
  page.on('requestfailed', (req) => {
    addIssue(issues, 'requestfailed', {
      url: req.url(),
      message: req.failure()?.errorText || 'unknown'
    });
  });

  let section = markSectionStart('bootstrap-render');
  const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!response || response.status() >= 400) {
    addIssue(issues, 'http', { status: response?.status() ?? null });
  }

  await page.waitForTimeout(1000);

  const rootInfo = await page.evaluate(() => {
    const root = document.querySelector('#root');
    const bodyText = (document.body?.innerText || '').trim();
    return {
      rootExists: !!root,
      rootChildren: root ? root.childElementCount : 0,
      textLength: bodyText.length
    };
  });
  notes.rootInfo = rootInfo;

  if (!rootInfo.rootExists || rootInfo.rootChildren < 1 || rootInfo.textLength < 300) {
    addIssue(issues, 'render-risk', { rootInfo });
  }

  const tabButtons = page.locator('button.tab-pill');
  const tabCount = await tabButtons.count();
  const tabLabels = [];
  for (let i = 0; i < tabCount; i += 1) {
    tabLabels.push((await tabButtons.nth(i).innerText()).trim());
  }
  notes.tabLabels = tabLabels;

  for (const requiredTab of REQUIRED_TABS) {
    if (!tabLabels.includes(requiredTab)) {
      addIssue(issues, 'missing-tab', { tab: requiredTab });
    }
  }
  markSectionEnd(section);

  section = markSectionStart('quick-contacts-fab');
  const quickContactsButton = page.getByRole('button', { name: /toggle quick contacts/i }).first();
  if ((await quickContactsButton.count()) === 0) {
    addIssue(issues, 'missing-quick-contacts-fab');
  } else {
    await quickContactsButton.click();
    await page.waitForTimeout(150);
    if ((await page.getByText(/Quick Contacts/i).count()) === 0) {
      addIssue(issues, 'quick-contacts-panel-missing');
    }
    if ((await page.getByText(/Stroke Phone/i).count()) === 0) {
      addIssue(issues, 'quick-contacts-default-missing', { contact: 'Stroke Phone' });
    }
    if ((await page.getByText(/STAT Pharmacy/i).count()) === 0) {
      addIssue(issues, 'quick-contacts-default-missing', { contact: 'STAT Pharmacy' });
    }
    if ((await page.getByText(/HMC Stroke RAD Hotline/i).count()) === 0) {
      addIssue(issues, 'quick-contacts-default-missing', { contact: 'HMC Stroke RAD Hotline' });
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }
  markSectionEnd(section);

  section = markSectionStart('encounter-workflow');
  await page.keyboard.press('Control+2');
  await page.waitForTimeout(150);
  const activeAfterCtrl2 = await getActiveTabLabel(page);
  if (!activeAfterCtrl2 || !/Encounter/i.test(activeAfterCtrl2)) {
    addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+2', activeAfter: activeAfterCtrl2 });
  }

  const encounterTab = page.locator('button.tab-pill:has-text("Encounter")').first();
  if ((await encounterTab.count()) === 0) {
    addIssue(issues, 'missing-tab', { tab: 'Encounter' });
  } else {
    await encounterTab.click();
    await page.waitForTimeout(250);

    for (const label of REQUIRED_DIAGNOSIS) {
      if ((await page.getByText(label).count()) === 0) {
        addIssue(issues, 'missing-diagnosis-option', { label: String(label) });
      }
    }

    if ((await page.getByText(/Trial Eligibility Auto-Matcher/i).count()) === 0) {
      addIssue(issues, 'missing-trial-matcher');
    }

    if ((await page.getByText(/TNK Eligibility Criteria/i).count()) === 0) {
      addIssue(issues, 'missing-thrombolysis-section');
    }

    if ((await page.getByText(/EVT Eligibility Criteria/i).count()) === 0) {
      addIssue(issues, 'missing-evt-section');
    }

    const videoModeButton = page.getByRole('button', { name: /Video Telestroke/i }).first();
    if ((await videoModeButton.count()) > 0) {
      await videoModeButton.click();
      await page.waitForTimeout(150);
    }

    const evtRecommendedCheckbox = page.getByRole('checkbox', { name: /EVT Recommended/i }).first();
    if ((await evtRecommendedCheckbox.count()) > 0) {
      await evtRecommendedCheckbox.check();
      await page.waitForTimeout(100);
    }

    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const activePlaceholder = await page.evaluate(() => document.activeElement?.getAttribute('placeholder') || null);
    if (!activePlaceholder || !/search/i.test(activePlaceholder)) {
      addIssue(issues, 'keyboard-search', { activePlaceholder });
    }

    // Wake-up/extended-window perfusion scenario:
    // support both standard and compact encounter layouts while preserving EXTEND safety checks.
    const ischemicPrimaryButton = page.getByRole('button', { name: /^Ischemic Stroke or TIA$/ }).first();
    if ((await ischemicPrimaryButton.count()) === 0) {
      addIssue(issues, 'missing-diagnosis-button', { label: 'Ischemic Stroke or TIA' });
    } else {
      await ischemicPrimaryButton.click();
      await page.waitForTimeout(150);

      const wakeUpCheckbox = page.getByRole('checkbox', { name: /Wake-up Stroke \/ Unknown LKW/i }).first();
      if ((await wakeUpCheckbox.count()) === 0) {
        addIssue(issues, 'missing-wakeup-workflow');
      } else {
        await wakeUpCheckbox.click();
        await page.waitForTimeout(150);

        // In senior-rapid mode, wake-up selection auto-collapses LKW. Re-open if needed.
        let useCtpButton = page.getByRole('button', { name: /No - Use CTP/i }).first();
        if ((await useCtpButton.count()) === 0) {
          const lkwSection = page.locator('#lkw-section').first();
          if ((await lkwSection.count()) > 0) {
            const lkwEditButton = lkwSection.getByRole('button', { name: /^Edit$/ }).first();
            if ((await lkwEditButton.count()) > 0) {
              await lkwEditButton.click();
              await page.waitForTimeout(150);
            }
          }
          useCtpButton = page.getByRole('button', { name: /No - Use CTP/i }).first();
        }

        if ((await useCtpButton.count()) === 0) {
          addIssue(issues, 'missing-wakeup-ctp-path');
        } else {
          await useCtpButton.click();
          await page.waitForTimeout(150);

          const setScenarioField = async (selectors, value, valueType = 'fill') => {
            for (const selector of selectors) {
              const locator = page.locator(selector).first();
              if ((await locator.count()) === 0) continue;
              if (valueType === 'select') {
                await locator.selectOption(value);
              } else {
                await locator.fill(value);
              }
              return true;
            }
            return false;
          };

          const nihssSet = await setScenarioField(['#input-nihss', '#phone-input-nihss'], '8');
          const premorbidSet = await setScenarioField(
            ['#input-premorbid-mrs', '#phone-input-premorbid-mrs'],
            '1',
            'select'
          );
          const ctpCoreSet = await setScenarioField(['#input-ctp-core'], '30');
          const ctpPenumbraSet = await setScenarioField(['#input-ctp-penumbra'], '90');
          const hasDirectPerfusionInputs = ctpCoreSet && ctpPenumbraSet;
          // Populate key thrombolysis safety fields so note trace includes explicit supportive negatives.
          await setScenarioField(['#input-bp'], '170/90');
          await setScenarioField(['#input-inr'], '1.1');
          await setScenarioField(['#input-platelets'], '180');
          await setScenarioField(['#input-glucose'], '120');
          await setScenarioField(['#input-ct-results', '#phone-input-ct-results'], 'No acute hemorrhage.');

          if (!nihssSet) addIssue(issues, 'missing-wakeup-scenario-input', { field: 'nihss' });
          if (!premorbidSet) addIssue(issues, 'missing-wakeup-scenario-input', { field: 'premorbid-mrs' });

          // Validate note-output traceability before manual EXTEND criteria toggles.
          const copyFullNoteButton = page.getByRole('button', { name: /Copy Full Note/i }).first();
          if ((await copyFullNoteButton.count()) === 0) {
            addIssue(issues, 'missing-copy-full-note-button');
          } else {
            await copyFullNoteButton.scrollIntoViewIfNeeded();
            await copyFullNoteButton.click();
            await page.waitForTimeout(200);
            let clipboardText = '';
            try {
              clipboardText = await page.evaluate(async () => {
                try {
                  return await navigator.clipboard.readText();
                } catch {
                  return '';
                }
              });
            } catch (error) {
              addIssue(issues, 'clipboard-read-failed', { message: error?.message || String(error) });
            }

            if (hasDirectPerfusionInputs) {
              if (!/MEETS EXTEND CRITERIA|Met EXTEND criteria|EXTEND criteria 5\/5.*ELIGIBLE/i.test(clipboardText || '')) {
                addIssue(issues, 'wakeup-note-trace-missing', { expected: 'eligible-trace' });
              }
            } else if (!/WAKE-UP criteria not|EXTEND criteria not|not yet eligible/i.test(clipboardText || '')) {
              addIssue(issues, 'wakeup-note-trace-missing', { expected: 'not-eligible-trace' });
            }
            if (!/Supportive negatives:/i.test(clipboardText || '')) {
              addIssue(issues, 'contraindication-supportive-negatives-missing');
            }
          }

          // Ensure manual EXTEND path remains testable even when compact layout hides direct CTP inputs.
          const extendCriteriaLabels = [
            /NIHSS 4-26/i,
            /Pre-morbid mRS <2/i,
            /Ischemic core ≤70mL/i,
            /Mismatch ratio ≥1.2/i,
            /Time 4.5-9 hours OR wake-up stroke/i
          ];
          let manualCriteriaFound = 0;
          for (const label of extendCriteriaLabels) {
            const criterion = page.getByRole('checkbox', { name: label }).first();
            if ((await criterion.count()) === 0) continue;
            manualCriteriaFound += 1;
            try {
              await criterion.scrollIntoViewIfNeeded();
              const alreadyChecked = await criterion.evaluate((el) => Boolean(el.checked));
              if (!alreadyChecked) {
                await criterion.click({ timeout: 5000 });
              }
            } catch (error) {
              addIssue(issues, 'wakeup-manual-extend-toggle-failed', {
                criterion: String(label),
                message: error?.message || String(error)
              });
            }
          }
          if (manualCriteriaFound < extendCriteriaLabels.length) {
            addIssue(issues, 'missing-wakeup-manual-extend-inputs', {
              expected: extendCriteriaLabels.length,
              found: manualCriteriaFound
            });
          }

          await page.waitForTimeout(250);
          const autoCriteriaAny = (await page.getByText(/Auto criteria (met|not fully met)/i).count()) > 0;
          if (!autoCriteriaAny) {
            addIssue(issues, 'wakeup-auto-extend-state-missing');
          }

          // If direct CTP inputs are available, require auto-perfusion to reach the "met" state.
          if (hasDirectPerfusionInputs) {
            if ((await page.getByText(/Auto criteria met for EXTEND-style perfusion selection/i).count()) === 0) {
              addIssue(issues, 'wakeup-auto-extend-state-missing');
            }
          }

          if ((await page.getByText(/Meets EXTEND criteria - Consider IV thrombolysis/i).count()) === 0) {
            addIssue(issues, 'wakeup-extend-eligibility-missing');
          }
        }
      }
    }

    for (const assertion of DIAGNOSIS_SWITCH_ASSERTIONS) {
      const diagnosisButton = page.getByRole('button', { name: new RegExp(`^${assertion.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
      if ((await diagnosisButton.count()) === 0) {
        addIssue(issues, 'missing-diagnosis-button', { label: assertion.label });
        continue;
      }
      await diagnosisButton.first().click();
      await page.waitForTimeout(150);

      const className = (await diagnosisButton.first().getAttribute('class')) || '';
      const tnkVisible = await page.evaluate(() =>
        [...document.querySelectorAll('label')].some((label) => /TNK Recommended/i.test((label.textContent || '').trim()))
      );
      if (!className.includes(assertion.activeClass)) {
        addIssue(issues, 'diagnosis-style-mismatch', {
          label: assertion.label,
          expectedClass: assertion.activeClass,
          className
        });
      }
      if (tnkVisible !== assertion.expectTNK) {
        addIssue(issues, 'diagnosis-tnk-visibility', {
          label: assertion.label,
          expected: assertion.expectTNK,
          actual: tnkVisible
        });
      }
    }

  }
  markSectionEnd(section);

  section = markSectionStart('library-workflow');
  await page.keyboard.press('Control+3');
  await page.waitForTimeout(150);
  const activeAfterCtrl3 = await getActiveTabLabel(page);
  if (!activeAfterCtrl3 || !/Library/i.test(activeAfterCtrl3)) {
    addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+3', activeAfter: activeAfterCtrl3 });
  } else {
    const protocolsButton = page.getByRole('tab', { name: /Protocols & Tools/i }).first();
    if ((await protocolsButton.count()) > 0) {
      await protocolsButton.click();
      await page.waitForTimeout(200);
    }

    const ischemicButton = page.getByRole('tab', { name: /Ischemic management tab/i }).first();
    if ((await ischemicButton.count()) === 0) {
      addIssue(issues, 'missing-library-subtab', { subtab: 'Ischemic' });
    } else {
      await ischemicButton.click();
      await page.waitForTimeout(200);
      if ((await page.getByText(/Post-EVT BP Guardrail/i).count()) === 0) {
        addIssue(issues, 'missing-post-evt-bp-guardrail');
      }
      if ((await page.getByText(/No routine EVT \(select\/trial only\)/i).count()) === 0) {
        addIssue(issues, 'missing-mevo-updated-wording');
      }

      const guardrailHeading = page.getByRole('heading', { name: /Post-EVT BP Guardrail/i }).first();
      if ((await guardrailHeading.count()) > 0) {
        const guardrailCard = guardrailHeading.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
        const guardrailSelects = guardrailCard.locator('select');
        const guardrailBpInput = guardrailCard.locator('input[type="text"]').first();
        if ((await guardrailSelects.count()) >= 3 && (await guardrailBpInput.count()) > 0) {
          await guardrailSelects.nth(0).selectOption('successful');
          await guardrailBpInput.fill('158/88');
          await guardrailSelects.nth(1).selectOption('nicardipine');
          await guardrailSelects.nth(2).selectOption('guardrail');
          await page.waitForTimeout(150);
          postEvtPlanConfigured = true;
        } else {
          addIssue(issues, 'missing-post-evt-bp-inputs');
        }
      }
    }

    const tiaButton = page.getByRole('tab', { name: /TIA management tab/i }).first();
    if ((await tiaButton.count()) === 0) {
      addIssue(issues, 'missing-library-subtab', { subtab: 'TIA' });
    } else {
      await tiaButton.click();
      await page.waitForTimeout(200);
      if ((await page.getByText(/TIA Disposition Engine/i).count()) === 0) {
        addIssue(issues, 'missing-tia-disposition-engine');
      }
      const enforceTiaDaptMatrix = target.name === 'local' || Boolean(target.enforceLiveParityChecks);
      if (enforceTiaDaptMatrix) {
        if ((await page.getByText(/Phenotype-Based DAPT Quick Matrix/i).count()) === 0) {
          addIssue(issues, 'missing-tia-dapt-phenotype-matrix');
        } else {
          if ((await page.getByText(/CHANCE, POINT/i).count()) === 0) {
            addIssue(issues, 'missing-tia-dapt-matrix-evidence-row', { row: 'CHANCE/POINT' });
          }
          if ((await page.getByText(/INSPIRES/i).count()) === 0) {
            addIssue(issues, 'missing-tia-dapt-matrix-evidence-row', { row: 'INSPIRES' });
          }
        }
      }

      const persistentDeficitCheckbox = page.getByRole('checkbox', { name: /Persistent deficit/i }).first();
      if ((await persistentDeficitCheckbox.count()) === 0) {
        addIssue(issues, 'missing-tia-risk-input', { field: 'Persistent deficit' });
      } else {
        await persistentDeficitCheckbox.check();
        await page.waitForTimeout(150);
        if ((await page.getByText(/Admit \/ high-acuity observation/i).count()) === 0) {
          addIssue(issues, 'tia-disposition-scenario-fail');
        }
        await persistentDeficitCheckbox.uncheck();
      }
    }

    const cvtButton = page.getByRole('tab', { name: /CVT management tab/i }).first();
    if ((await cvtButton.count()) === 0) {
      addIssue(issues, 'missing-library-subtab', { subtab: 'CVT' });
    } else {
      await cvtButton.click();
      await page.waitForTimeout(200);

      const cvtSpecialSummary = page.locator('summary:has-text("CVT in Special Populations")').first();
      if ((await cvtSpecialSummary.count()) === 0) {
        addIssue(issues, 'missing-cvt-special-populations-section');
      } else {
        await cvtSpecialSummary.scrollIntoViewIfNeeded();
        await cvtSpecialSummary.click();
        await page.waitForTimeout(150);
      }

      const apsCheckbox = page.getByRole('checkbox', { name: /APS confirmed/i }).first();
      if ((await apsCheckbox.count()) === 0) {
        addIssue(issues, 'missing-cvt-special-pop-input', { field: 'APS confirmed' });
      } else {
        await apsCheckbox.check();
        await page.waitForTimeout(150);
        if ((await page.getByText(/DOACs are not recommended in APS/i).count()) === 0) {
          addIssue(issues, 'cvt-aps-scenario-fail');
        }
        await apsCheckbox.uncheck();
      }
    }
  }
  markSectionEnd(section);

  section = markSectionStart('settings-workflow');
  await page.keyboard.press('Control+4');
  await page.waitForTimeout(150);
  const activeAfterCtrl4 = await getActiveTabLabel(page);
  if (!activeAfterCtrl4 || !/Settings/i.test(activeAfterCtrl4)) {
    addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+4', activeAfter: activeAfterCtrl4 });
  } else {
    if ((await page.getByText(/Contact Directory/i).count()) === 0) {
      addIssue(issues, 'missing-contact-directory-settings');
    }
    if ((await page.getByRole('button', { name: /Reset UW Defaults/i }).count()) === 0) {
      addIssue(issues, 'missing-contact-directory-reset');
    }

    const requiredContacts = [
      { label: 'Stroke Phone', phone: '206-744-6789' },
      { label: 'STAT Pharmacy', phone: '206-744-2241' },
      { label: 'HMC Stroke RAD Hotline', phone: '206-744-8484' }
    ];
    for (const contact of requiredContacts) {
      const labelPresent = await page.locator(`input[value=\"${contact.label}\"]`).count();
      if (labelPresent === 0) {
        addIssue(issues, 'missing-required-contact-label', { contact: contact.label });
      }
      const phonePresent = await page.locator(`input[value=\"${contact.phone}\"]`).count();
      if (phonePresent === 0) {
        addIssue(issues, 'missing-required-contact-phone', { contact: contact.label, phone: contact.phone });
      }
    }
  }
  markSectionEnd(section);

  section = markSectionStart('post-evt-note-trace');
  if (postEvtPlanConfigured) {
    await page.keyboard.press('Control+2');
    await page.waitForTimeout(150);
    const activeAfterEvtPlanCheck = await getActiveTabLabel(page);
    if (!activeAfterEvtPlanCheck || !/Encounter/i.test(activeAfterEvtPlanCheck)) {
      addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+2', activeAfter: activeAfterEvtPlanCheck });
    } else {
      const ischemicButton = page.getByRole('button', { name: /^Ischemic Stroke or TIA$/ }).first();
      if ((await ischemicButton.count()) > 0) {
        await ischemicButton.click();
        await page.waitForTimeout(100);
      }

      const evtRecommendedCheckbox = page.getByRole('checkbox', { name: /EVT Recommended/i }).first();
      if ((await evtRecommendedCheckbox.count()) > 0) {
        await evtRecommendedCheckbox.check();
        await page.waitForTimeout(100);
      }

      const templateSelect = page.locator('select:has(option[value="signout"])').first();
      if ((await templateSelect.count()) > 0) {
        await templateSelect.selectOption('signout');
        await page.waitForTimeout(100);
      } else {
        addIssue(issues, 'missing-note-template-select-post-evt');
      }

      const copyFullNoteButton = page.getByRole('button', { name: /Copy Full Note/i }).first();
      if ((await copyFullNoteButton.count()) === 0) {
        addIssue(issues, 'missing-copy-full-note-button-post-evt');
      } else {
        await copyFullNoteButton.scrollIntoViewIfNeeded();
        await copyFullNoteButton.click();
        await page.waitForTimeout(200);
        let clipboardText = '';
        try {
          clipboardText = await page.evaluate(async () => {
            try {
              return await navigator.clipboard.readText();
            } catch {
              return '';
            }
          });
        } catch (error) {
          addIssue(issues, 'clipboard-read-failed-post-evt', { message: error?.message || String(error) });
        }

        if (!/BP plan: .*Agent: Nicardipine drip|Plan: .*Agent: Nicardipine drip/i.test(clipboardText || '')) {
          addIssue(issues, 'post-evt-bp-note-plan-missing');
        }
      }
    }
  }
  markSectionEnd(section);

  section = markSectionStart('pediatric-workflow');
  // Pediatric pathway scenario (age <18): ensure safety workflow is visible and note-traceable.
  await page.keyboard.press('Control+2');
  await page.waitForTimeout(200);
  const pediatricDxButton = page.getByRole('button', { name: /^Ischemic Stroke or TIA$/ }).first();
  if ((await pediatricDxButton.count()) === 0) {
    addIssue(issues, 'missing-diagnosis-button', { label: 'Ischemic Stroke or TIA (pediatric scenario)' });
  } else {
    await pediatricDxButton.click();
    await page.waitForTimeout(150);

    let ageFieldSet = false;
    for (const selector of ['#input-age', '#phone-input-age']) {
      const ageInput = page.locator(selector).first();
      if ((await ageInput.count()) === 0) continue;
      await ageInput.fill('12');
      ageFieldSet = true;
      break;
    }
    if (!ageFieldSet) {
      addIssue(issues, 'missing-pediatric-age-input');
    }
    await page.waitForTimeout(200);

    const specialPopSummary = page.locator('summary:has-text("Special Populations & Rehab")').first();
    if ((await specialPopSummary.count()) === 0) {
      addIssue(issues, 'missing-special-populations-section');
    } else {
      await specialPopSummary.scrollIntoViewIfNeeded();
      await specialPopSummary.click();
      await page.waitForTimeout(200);
    }

    if ((await page.getByText(/Pediatric Stroke Rapid Pathway/i).count()) === 0) {
      addIssue(issues, 'missing-pediatric-pathway-card');
    }
    if ((await page.getByText(/PEDIATRIC patient/i).count()) === 0) {
      addIssue(issues, 'missing-pediatric-age-warning');
    }
    if ((await page.getByText(/without documented pediatric neurology consultation/i).count()) === 0) {
      addIssue(issues, 'missing-pediatric-neuro-warning');
    }

    const pediatricChecklistSelectors = [
      /Pediatric neurology consulted/i,
      /Pediatric-capable center contacted/i,
      /Arterial \+ venous imaging completed/i
    ];
    for (const label of pediatricChecklistSelectors) {
      const checkbox = page.getByRole('checkbox', { name: label }).first();
      if ((await checkbox.count()) === 0) {
        addIssue(issues, 'missing-pediatric-checklist-input', { label: String(label) });
        continue;
      }
      await checkbox.check();
    }
    await page.waitForTimeout(150);

    if ((await page.getByText(/Pediatric pathway summary:/i).count()) === 0) {
      addIssue(issues, 'missing-pediatric-pathway-summary');
    }

    const copyFullNoteButton = page.getByRole('button', { name: /Copy Full Note/i }).first();
    if ((await copyFullNoteButton.count()) === 0) {
      addIssue(issues, 'missing-copy-full-note-button-pediatric');
    } else {
      await copyFullNoteButton.scrollIntoViewIfNeeded();
      await copyFullNoteButton.click();
      await page.waitForTimeout(200);
      let clipboardText = '';
      try {
        clipboardText = await page.evaluate(async () => {
          try {
            return await navigator.clipboard.readText();
          } catch {
            return '';
          }
        });
      } catch (error) {
        addIssue(issues, 'clipboard-read-failed-pediatric', { message: error?.message || String(error) });
      }
      if (!/PEDIATRIC STROKE|Pediatric stroke/i.test(clipboardText || '')) {
        addIssue(issues, 'pediatric-note-trace-missing');
      }
    }
  }
  markSectionEnd(section);

  section = markSectionStart('screenshot');
  const screenshotPath = path.join(outDir, `qa-${target.name}-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  markSectionEnd(section);
  notes.runDurationMs = Date.now() - runStartedAtMs;

  await context.close();
  return {
    target: target.name,
    url: target.url,
    viewport: viewport.name,
    issues,
    issueCount: issues.length,
    notes,
    screenshot: path.relative(process.cwd(), screenshotPath)
  };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const targets = [{ name: 'local', url: LOCAL_URL }];
  if (!localOnly) targets.push({ name: 'live', url: LIVE_URL });

  let server = null;
  const startedAt = new Date().toISOString();

  try {
    if (!(await canReach(LOCAL_URL))) {
      server = startLocalServer();
      await waitForHttp(LOCAL_URL);
    }

    const localVersion = await fetchAppVersion(LOCAL_URL);
    const liveVersion = localOnly ? null : await fetchAppVersion(LIVE_URL);
    const liveVersionMatchesLocal = !localOnly && Boolean(localVersion) && Boolean(liveVersion) && localVersion === liveVersion;

    const effectiveTargets = targets.map((target) => {
      if (target.name === 'live') {
        return {
          ...target,
          appVersion: liveVersion,
          enforceLiveParityChecks: liveVersionMatchesLocal
        };
      }
      return {
        ...target,
        appVersion: localVersion,
        enforceLiveParityChecks: true
      };
    });

  const browser = await chromium.launch({ headless: true });
  const runs = [];

  for (const target of effectiveTargets) {
    for (const viewport of VIEWPORTS) {
      try {
        runs.push(await auditView(browser, target, viewport));
      } catch (error) {
        runs.push({
          target: target.name,
          url: target.url,
          viewport: viewport.name,
          issues: [{ type: 'audit-runtime-error', message: error?.message || String(error) }],
          issueCount: 1,
          notes: { fatalStack: error?.stack || String(error) },
          screenshot: null
        });
      }
    }
  }

    await browser.close();

    const totalIssues = runs.reduce((sum, run) => sum + run.issueCount, 0);
    const timedRuns = runs.filter((run) => Number.isFinite(run?.notes?.runDurationMs));
    const totalRunDurationMs = timedRuns.reduce((sum, run) => sum + run.notes.runDurationMs, 0);
    const averageRunDurationMs = timedRuns.length > 0 ? Math.round(totalRunDurationMs / timedRuns.length) : null;
    const slowestRun = timedRuns.reduce((slowest, run) => {
      if (!slowest) {
        return {
          target: run.target,
          viewport: run.viewport,
          durationMs: run.notes.runDurationMs
        };
      }
      if (run.notes.runDurationMs > slowest.durationMs) {
        return {
          target: run.target,
          viewport: run.viewport,
          durationMs: run.notes.runDurationMs
        };
      }
      return slowest;
    }, null);
    const slowRuns = timedRuns
      .map((run) => {
        const thresholdMs = resolveRunThresholdMs(run.target, run.viewport);
        return {
          target: run.target,
          viewport: run.viewport,
          durationMs: run.notes.runDurationMs,
          thresholdMs
        };
      })
      .filter((run) => run.durationMs > run.thresholdMs)
      .sort((left, right) => right.durationMs - left.durationMs);
    const slowSections = timedRuns
      .flatMap((run) => {
        const timings = Array.isArray(run?.notes?.sectionTimings) ? run.notes.sectionTimings : [];
        return timings
          .filter((timing) => Number.isFinite(timing.durationMs))
          .map((timing) => {
            const thresholdMs = resolveSectionThresholdMs(run.target, run.viewport, timing.section);
            return {
              target: run.target,
              viewport: run.viewport,
              section: timing.section,
              durationMs: timing.durationMs,
              thresholdMs
            };
          })
          .filter((timing) => timing.durationMs > timing.thresholdMs);
      })
      .sort((left, right) => right.durationMs - left.durationMs);
    const latencyProfilesSource = latencyProfilesSourcePath ? path.relative(process.cwd(), latencyProfilesSourcePath) : 'built-in';
    const availableLatencyProfiles = Object.keys(latencyProfiles);
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      localOnly,
      targetCount: targets.length,
      viewportCount: VIEWPORTS.length,
      runCount: runs.length,
      totalIssues,
      localAppVersion: localVersion,
      liveAppVersion: liveVersion,
      liveParityChecksEnabled: liveVersionMatchesLocal,
      averageRunDurationMs,
      slowestRun,
      latencyProfile,
      latencyProfilesSource,
      availableLatencyProfiles,
      runDurationThresholdMs,
      sectionDurationThresholdMs,
      enforceLatencyThresholds,
      slowRunCount: slowRuns.length,
      slowSectionCount: slowSections.length,
      slowRuns,
      slowSections
    };
    try {
      const historyInfo = await updateLatencyHistory(summary);
      summary.latencyHistoryPath = historyInfo.path;
      summary.latencyHistoryCount = historyInfo.count;
    } catch (error) {
      summary.latencyHistoryPath = path.relative(process.cwd(), latencyHistoryFile);
      summary.latencyHistoryError = error?.message || String(error);
    }

    const report = { summary, runs };
    await fs.writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`QA smoke report: ${path.relative(process.cwd(), reportFile)}`);
    console.log(`Runs: ${summary.runCount} | Issues: ${summary.totalIssues}`);
    console.log(`Latency profile: ${summary.latencyProfile} (${summary.latencyProfilesSource})`);
    if (summary.slowestRun) {
      console.log(
        `Slowest run: ${summary.slowestRun.target}/${summary.slowestRun.viewport} (${summary.slowestRun.durationMs} ms)`
      );
    }
    if (summary.slowRunCount > 0) {
      console.warn(
        `Slow-run alert: ${summary.slowRunCount} run(s) exceeded configured run threshold(s) (profile: ${summary.latencyProfile}).`
      );
    }
    if (summary.slowSectionCount > 0) {
      console.warn(
        `Slow-section alert: ${summary.slowSectionCount} section(s) exceeded configured section threshold(s) (profile: ${summary.latencyProfile}).`
      );
    }
    if (summary.enforceLatencyThresholds && (summary.slowRunCount > 0 || summary.slowSectionCount > 0)) {
      console.error('Latency threshold enforcement enabled and one or more thresholds were exceeded.');
      process.exit(1);
    }

    if (totalIssues > 0) {
      console.error('Smoke audit detected issues. See report for details.');
      process.exit(1);
    }
  } finally {
    if (server) server.stop();
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
