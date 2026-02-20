import fs from 'node:fs/promises';
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

const args = new Set(process.argv.slice(2));
const localOnly = args.has('--local-only');
const outDir = path.join(process.cwd(), 'output', 'playwright');
const reportFile = path.join(outDir, 'qa-smoke-report.json');

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
    viewport: { width: viewport.width, height: viewport.height }
  });
  const page = await context.newPage();
  const issues = [];
  const notes = {};

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

    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const activePlaceholder = await page.evaluate(() => document.activeElement?.getAttribute('placeholder') || null);
    if (!activePlaceholder || !/search/i.test(activePlaceholder)) {
      addIssue(issues, 'keyboard-search', { activePlaceholder });
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

  const screenshotPath = path.join(outDir, `qa-${target.name}-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

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

    const browser = await chromium.launch({ headless: true });
    const runs = [];

    for (const target of targets) {
      for (const viewport of VIEWPORTS) {
        runs.push(await auditView(browser, target, viewport));
      }
    }

    await browser.close();

    const totalIssues = runs.reduce((sum, run) => sum + run.issueCount, 0);
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      localOnly,
      targetCount: targets.length,
      viewportCount: VIEWPORTS.length,
      runCount: runs.length,
      totalIssues
    };

    const report = { summary, runs };
    await fs.writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`QA smoke report: ${path.relative(process.cwd(), reportFile)}`);
    console.log(`Runs: ${summary.runCount} | Issues: ${summary.totalIssues}`);

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
