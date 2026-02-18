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

function startLocalServer() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
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
  }

  await page.keyboard.press('Control+3');
  await page.waitForTimeout(150);
  const activeAfterCtrl3 = await getActiveTabLabel(page);
  if (!activeAfterCtrl3 || !/Library/i.test(activeAfterCtrl3)) {
    addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+3', activeAfter: activeAfterCtrl3 });
  }

  await page.keyboard.press('Control+4');
  await page.waitForTimeout(150);
  const activeAfterCtrl4 = await getActiveTabLabel(page);
  if (!activeAfterCtrl4 || !/Settings/i.test(activeAfterCtrl4)) {
    addIssue(issues, 'keyboard-tab-nav', { combo: 'Ctrl+4', activeAfter: activeAfterCtrl4 });
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

  const server = startLocalServer();
  const startedAt = new Date().toISOString();

  try {
    await waitForHttp(LOCAL_URL);

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
    server.stop();
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
