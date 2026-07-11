// Example Protocols content lock.
//
// The Example Protocols tab (#/protocols/ich|ischemic|sah|tia|cvt|calculators)
// carries a HARD constraint: its clinical text, values, thresholds, algorithms,
// and wording must not change during refactoring. This script renders the built
// app (app.js at repo root — the same artifact GitHub Pages serves), extracts
// every visible text node under #tabpanel-protocols for each subtab, and
// compares the normalized corpus against checked-in baselines in
// tests/snapshots/example-protocols/.
//
// Usage:
//   node scripts/snapshot-example-protocols.mjs           # check (CI gate; exit 1 on drift)
//   node scripts/snapshot-example-protocols.mjs --update  # rewrite baselines (requires human diff review)
//
// Re-baselining policy: `--update` is only legitimate for reviewed clinical
// content changes or for approved structural moves (relocating shared
// calculators/citations, rendering improvements). The git diff of the baseline
// files IS the review surface — every changed line is a wording change a human
// must approve.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4185;
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const SUBTABS = ['ich', 'ischemic', 'sah', 'tia', 'cvt', 'calculators'];
const SNAPSHOT_DIR = path.join(process.cwd(), 'tests', 'snapshots', 'example-protocols');
const update = process.argv.includes('--update');

// Launch Chromium robustly. CI runs `npx playwright install chromium`, so the
// default resolution works there. Locally, the pinned build may be missing while
// a newer complete build sits in the cache; fall back to that, or to an explicit
// STROKE_CHROMIUM_PATH override, rather than forcing a network install.
async function launchChromium() {
  const attempts = [];
  const envPath = process.env.STROKE_CHROMIUM_PATH;
  if (envPath) attempts.push({ executablePath: envPath });
  attempts.push({ channel: 'chromium' });
  attempts.push({});

  const cacheRoot = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  try {
    for (const dir of fsSync.readdirSync(cacheRoot)) {
      if (!dir.startsWith('chromium-')) continue;
      if (!fsSync.existsSync(path.join(cacheRoot, dir, 'INSTALLATION_COMPLETE'))) continue;
      const exe = path.join(
        cacheRoot, dir, 'chrome-mac-arm64',
        'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'
      );
      if (fsSync.existsSync(exe)) attempts.push({ executablePath: exe });
    }
  } catch {
    // cache dir absent (e.g. Linux CI) — the default/channel attempts cover it
  }

  let lastErr = null;
  for (const opts of attempts) {
    try {
      return await chromium.launch(opts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Could not launch Chromium for snapshot capture');
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
  return { stop };
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 405) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Local server did not become reachable at ${url}`);
}

// Collect every text node under the protocols tabpanel, one normalized line
// per node. Accordion/details content that is mounted-but-hidden is included
// (the lock covers wording, not visibility). aria-expanded toggles are clicked
// open first so lazily-mounted disclosure content is captured too.
async function extractPanelText(page) {
  // Best-effort expansion of collapsed disclosures inside the panel only.
  for (let pass = 0; pass < 5; pass += 1) {
    const expanded = await page.evaluate(() => {
      const panel = document.querySelector('#tabpanel-protocols');
      if (!panel) return 0;
      let clicks = 0;
      for (const el of panel.querySelectorAll('[aria-expanded="false"]')) {
        el.click();
        clicks += 1;
        if (clicks >= 40) break;
      }
      for (const d of panel.querySelectorAll('details:not([open])')) {
        d.open = true;
        clicks += 1;
      }
      return clicks;
    });
    if (!expanded) break;
    await page.waitForTimeout(200);
  }

  return page.evaluate(() => {
    const panel = document.querySelector('#tabpanel-protocols');
    if (!panel) return null;
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    const lines = [];
    while (walker.nextNode()) {
      const raw = walker.currentNode.textContent || '';
      const normalized = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
      if (normalized) lines.push(normalized);
    }
    return lines;
  });
}

// Drug/agent detail modals (protocolDetailMap) mount only on click. Their
// triggers are the underlined inline buttons inside the panel. Click each,
// capture the dialog text, Escape, continue. Buttons that open no dialog are
// skipped. Deterministic DOM order keeps the corpus stable.
async function extractModalTexts(page) {
  const count = await page.evaluate(() => {
    const panel = document.querySelector('#tabpanel-protocols');
    if (!panel) return 0;
    const triggers = [...panel.querySelectorAll('button')].filter((b) =>
      (b.className || '').includes('underline')
    );
    triggers.forEach((b, i) => b.setAttribute('data-snapshot-trigger', String(i)));
    return triggers.length;
  });

  const sections = [];
  for (let i = 0; i < count; i += 1) {
    const trigger = page.locator(`[data-snapshot-trigger="${i}"]`);
    let label = '';
    try {
      label = ((await trigger.textContent()) || '').normalize('NFC').replace(/\s+/g, ' ').trim();
      await trigger.click({ timeout: 2000 });
    } catch {
      continue;
    }
    await page.waitForTimeout(150);
    const modalLines = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dialog) return null;
      const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
      const lines = [];
      while (walker.nextNode()) {
        const normalized = (walker.currentNode.textContent || '').normalize('NFC').replace(/\s+/g, ' ').trim();
        if (normalized) lines.push(normalized);
      }
      return lines;
    });
    if (modalLines && modalLines.length > 0) {
      sections.push(`--- modal via "${label}" ---`, ...modalLines);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  }
  return sections;
}

async function captureSubtab(browser, subtab) {
  // Fresh context per subtab: the app persists state to localStorage, so
  // clicks made while capturing one subtab must not leak into the next.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}#/protocols/${subtab}`, { waitUntil: 'load' });
    await page.waitForSelector('#tabpanel-protocols', { timeout: 15000 });
    // Direct hash deep-loads resolve the subtab on mount; give React a beat to settle.
    await page.waitForTimeout(600);
    const lines = await extractPanelText(page);
    if (!lines) throw new Error(`#tabpanel-protocols not found for subtab "${subtab}"`);
    if (lines.length < 20) {
      throw new Error(
        `Suspiciously little content for subtab "${subtab}" (${lines.length} text nodes) — extraction or routing is broken; refusing to treat this as a valid capture.`
      );
    }
    const modalSections = await extractModalTexts(page);
    return [...lines, ...modalSections].join('\n') + '\n';
  } finally {
    await context.close();
  }
}

function firstDivergence(expected, actual) {
  const a = expected.split('\n');
  const b = actual.split('\n');
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i] !== b[i]) {
      return { line: i + 1, expected: a[i] ?? '<missing>', actual: b[i] ?? '<missing>' };
    }
  }
  return null;
}

async function main() {
  const server = startLocalServer();
  let browser = null;
  const failures = [];
  try {
    await waitForHttp(BASE_URL);
    browser = await launchChromium();

    if (update) await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

    for (const subtab of SUBTABS) {
      const corpus = await captureSubtab(browser, subtab);
      const file = path.join(SNAPSHOT_DIR, `${subtab}.txt`);
      if (update) {
        await fs.writeFile(file, corpus, 'utf8');
        console.log(`updated ${path.relative(process.cwd(), file)} (${corpus.split('\n').length - 1} lines)`);
        continue;
      }
      let expected;
      try {
        expected = await fs.readFile(file, 'utf8');
      } catch {
        failures.push(`${subtab}: baseline missing (${file}). Run with --update to create it, then review the diff.`);
        continue;
      }
      if (expected !== corpus) {
        const d = firstDivergence(expected, corpus);
        failures.push(
          `${subtab}: rendered Example Protocols text drifted from baseline at line ${d.line}.\n  baseline: ${JSON.stringify(d.expected).slice(0, 200)}\n  rendered: ${JSON.stringify(d.actual).slice(0, 200)}`
        );
      } else {
        console.log(`ok ${subtab} (${expected.split('\n').length - 1} lines)`);
      }
    }
  } finally {
    if (browser) await browser.close();
    server.stop();
  }

  if (failures.length > 0) {
    console.error('\nEXAMPLE PROTOCOLS CONTENT LOCK FAILED');
    console.error('The #/protocols/* clinical wording must not change. If this change was');
    console.error('intentionally approved, re-baseline with --update and review the git diff');
    console.error('of tests/snapshots/example-protocols/ line by line.\n');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log('\nExample Protocols content lock: PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
