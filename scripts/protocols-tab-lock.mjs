// Protocols-tab preservation lock (multi-state).
//
// The existing Example Protocols lock (snapshot-example-protocols.mjs) covers
// the default, empty-Encounter render of #tabpanel-protocols. This lock covers
// the complete Protocols surface the user sees: the IVT-held status banner,
// the bedside quick reference, the "Linked to Encounter" line and the protected
// protocols, under synthetic Encounter states (tests/fixtures/protocols-tab-fixtures.mjs)
// with a fixed clock, time zone and locale. For each fixture and sub-tab it
// records, in DOM order:
//   * every text node (disclosures and accordions expanded first);
//   * title / aria-label / alt / placeholder attributes (tooltips, labels);
//   * structure: headings, links with destinations, tables, images;
//   * the text of every drug/agent modal reachable from the panel.
// The corpus is compared exactly with tests/snapshots/protocols-tab/.
//
// Usage:
//   node scripts/protocols-tab-lock.mjs                 # check (exit 1 on drift)
//   node scripts/protocols-tab-lock.mjs --only=<id>     # check one fixture
//   node scripts/protocols-tab-lock.mjs --update        # rewrite baselines (review the git diff)
//
// --update is legitimate only for an owner-approved Protocols change. A
// presentation-only change must pass this lock unchanged.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { PROTOCOL_TAB_FIXTURES, FIXED_NOW_ISO, TIMEZONE, LOCALE } from '../tests/fixtures/protocols-tab-fixtures.mjs';

const PORT = Number(process.env.STROKE_PROTOCOL_LOCK_PORT || 4186);
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const SNAPSHOT_DIR = path.join(process.cwd(), 'tests', 'snapshots', 'protocols-tab');
const SUBTABS = ['ischemic', 'ich'];
const update = process.argv.includes('--update');
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
const debug = process.env.STROKE_LOCK_DEBUG ? (...parts) => console.log('[debug]', ...parts) : () => {};

// STROKE_PROTOCOL_LOCK_ROOT serves another built tree (for example a `git archive` of a release).
const SITE_ROOT = path.resolve(process.env.STROKE_PROTOCOL_LOCK_ROOT || process.cwd());

function startServer() {
  const server = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: SITE_ROOT, stdio: 'ignore' });
  // An occupied port makes the server exit at once; report that instead of timing out.
  server.on('exit', code => { if (code) { console.error(`Static server exited (${code}); is port ${PORT} in use? Set STROKE_PROTOCOL_LOCK_PORT.`); process.exit(1); } });
  return () => { server.removeAllListeners('exit'); if (!server.killed) server.kill('SIGTERM'); };
}

async function waitForHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const res = await fetch(url, { method: 'HEAD' }); if (res.ok) return; } catch { /* not up yet */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Local server did not become reachable at ${url}`);
}

async function launch() {
  const attempts = [process.env.STROKE_CHROMIUM_PATH ? { executablePath: process.env.STROKE_CHROMIUM_PATH } : null, {}, { channel: 'chromium' }].filter(Boolean);
  let last;
  for (const options of attempts) { try { return await chromium.launch(options); } catch (error) { last = error; } }
  throw last;
}

const openEncounterDisclosures = page => page.evaluate(() => { for (const d of document.querySelectorAll('#tabpanel-encounter details:not([open])')) d.open = true; });

async function applyStep(page, [kind, a, b]) {
  await openEncounterDisclosures(page);
  const byLabel = label => page.getByLabel(label, { exact: true }).first();
  if (kind === 'select') await byLabel(a).selectOption(b);
  else if (kind === 'fill') await byLabel(a).fill(b);
  else if (kind === 'weight') await page.locator('#input-weight').fill(a);
  else if (kind === 'unit') await page.locator(`input[name="weight-unit"][value="${a}"]`).check();
  else if (kind === 'check') await page.locator('label.workspace-check', { hasText: a }).locator('input[type="checkbox"]').check();
  else if (kind === 'vessel') await page.locator('fieldset.vessel-chips button', { hasText: new RegExp(`^${a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`) }).click();
  else if (kind === 'nihssReported') { await page.locator('input[name="nihss-source"][value="reported"]').check(); await page.locator('#input-reported-nihss').fill(a); }
  else throw new Error(`Unknown fixture step ${kind}`);
}

// The whole Protocols surface: the #workspace-main child that holds the panel.
const SURFACE = () => document.getElementById('tabpanel-protocols')?.closest('#workspace-main > div') || null;

// Protocols-side interactions (after navigation): ['pbutton', exact text] clicks a
// button in the surface; ['pcheck', label text] ticks a checkbox whose label contains the text.
async function applyProtocolStep(page, [kind, text]) {
  await page.evaluate(surfaceSource => { for (const d of (0, eval)(surfaceSource)()?.querySelectorAll('details:not([open])') || []) d.open = true; }, `(${SURFACE.toString()})`);
  const surface = page.locator('#workspace-main > div:has(#tabpanel-protocols)');
  if (kind === 'pbutton') await surface.getByRole('button', { name: text, exact: true }).first().click();
  else if (kind === 'pcheck') await surface.locator('label', { hasText: text }).locator('input[type="checkbox"]').first().check();
  else throw new Error(`Unknown protocol step ${kind}`);
  await page.waitForTimeout(100);
}

async function expandSurface(page) {
  for (let pass = 0; pass < 6; pass += 1) {
    const clicks = await page.evaluate(surfaceSource => {
      const surface = (0, eval)(surfaceSource)();
      if (!surface) return 0;
      let count = 0;
      for (const el of surface.querySelectorAll('[aria-expanded="false"]')) { el.click(); if (++count >= 60) break; }
      for (const d of surface.querySelectorAll('details:not([open])')) { d.open = true; count += 1; }
      return count;
    }, `(${SURFACE.toString()})`);
    if (!clicks) break;
    await page.waitForTimeout(150);
  }
}

async function surfaceCorpus(page) {
  return page.evaluate(surfaceSource => {
    const surface = (0, eval)(surfaceSource)();
    if (!surface) return null;
    const norm = value => String(value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    const text = [], attrs = [], structure = [], hidden = [];
    const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const value = norm(walker.currentNode.textContent);
      if (!value) continue;
      text.push(value);
      // Presentation changes must not hide protected text: record what is not visibly rendered.
      const parent = walker.currentNode.parentElement;
      if (parent && !parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) hidden.push(value);
    }
    for (const el of surface.querySelectorAll('[title],[aria-label],[alt],[placeholder]')) {
      for (const name of ['title', 'aria-label', 'alt', 'placeholder']) {
        const value = norm(el.getAttribute(name));
        if (value) attrs.push(`${el.tagName.toLowerCase()} ${name}=${value}`);
      }
    }
    for (const el of surface.querySelectorAll('h1,h2,h3,h4,h5,h6,a[href],table,img,iframe')) {
      const tag = el.tagName.toLowerCase();
      if (/^h\d$/.test(tag)) structure.push(`${tag}: ${norm(el.textContent)}`);
      else if (tag === 'a') structure.push(`a: ${norm(el.textContent)} -> ${el.getAttribute('href')}${el.getAttribute('target') ? ` [${el.getAttribute('target')}]` : ''}`);
      else if (tag === 'table') structure.push(`table: ${el.rows.length} rows; header ${[...(el.tHead?.rows[0]?.cells || el.rows[0]?.cells || [])].map(cell => norm(cell.textContent)).join(' | ')}`);
      else structure.push(`${tag}: ${el.getAttribute('src') || ''} ${norm(el.getAttribute('alt'))}`);
    }
    return { text, attrs, structure, hidden };
  }, `(${SURFACE.toString()})`);
}

async function modalCorpus(page) {
  const count = await page.evaluate(surfaceSource => {
    const surface = (0, eval)(surfaceSource)();
    if (!surface) return 0;
    const triggers = [...surface.querySelectorAll('button')].filter(button => (button.className || '').includes('underline'));
    triggers.forEach((button, index) => button.setAttribute('data-tab-lock-trigger', String(index)));
    return triggers.length;
  }, `(${SURFACE.toString()})`);
  const lines = [];
  for (let index = 0; index < count; index += 1) {
    const trigger = page.locator(`[data-tab-lock-trigger="${index}"]`);
    let label = '';
    try { label = ((await trigger.textContent()) || '').replace(/\s+/g, ' ').trim(); await trigger.click({ timeout: 2000 }); } catch { continue; }
    await page.waitForTimeout(120);
    const modal = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dialog) return null;
      const out = [];
      const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const value = (walker.currentNode.textContent || '').normalize('NFC').replace(/\s+/g, ' ').trim(); if (value) out.push(value); }
      for (const a of dialog.querySelectorAll('a[href]')) out.push(`a -> ${a.getAttribute('href')}`);
      return out;
    });
    if (modal?.length) { lines.push(`--- modal via "${label}" ---`, ...modal); await page.keyboard.press('Escape'); await page.waitForTimeout(80); }
  }
  return lines;
}

async function capture(browser, fixture, subtab) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: TIMEZONE, locale: LOCALE, serviceWorkers: 'block' });
  context.setDefaultTimeout(10000);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  try {
    await page.clock.setFixedTime(new Date(FIXED_NOW_ISO));
    await page.goto(`${BASE_URL}#/encounter`, { waitUntil: 'load' });
    await page.waitForSelector('#tabpanel-encounter', { timeout: 15000 });
    for (const step of fixture.steps) { debug(fixture.id, subtab, step.join(' ')); await applyStep(page, step); }
    await page.evaluate(sub => { location.hash = `#/protocols/${sub}`; }, subtab);
    await page.waitForSelector('#tabpanel-protocols', { timeout: 15000 });
    await page.waitForTimeout(600);
    for (const step of fixture.protocolSteps || []) { debug(fixture.id, subtab, step.join(' ')); await applyProtocolStep(page, step); }
    debug('expand'); await expandSurface(page);
    debug('corpus');
    const corpus = await surfaceCorpus(page);
    if (!corpus || corpus.text.length < 40) throw new Error(`${fixture.id}/${subtab}: Protocols surface missing or nearly empty`);
    debug('modals'); const modals = await modalCorpus(page);
    if (errors.length) throw new Error(`${fixture.id}/${subtab}: page errors: ${errors.join('; ')}`);
    return [
      `# fixture ${fixture.id} · #/protocols/${subtab} · ${FIXED_NOW_ISO} ${TIMEZONE} ${LOCALE}`,
      '## text', ...corpus.text, '## attributes', ...corpus.attrs, '## structure', ...corpus.structure, '## not visibly rendered', ...corpus.hidden, '## modals', ...modals
    ].join('\n') + '\n';
  } finally {
    await context.close();
  }
}

function firstDifference(expected, actual) {
  const a = expected.split('\n'), b = actual.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) return { line: i + 1, expected: a[i] ?? '<missing>', actual: b[i] ?? '<missing>' };
  return null;
}

async function main() {
  const stop = startServer();
  let browser;
  const failures = [];
  let checked = 0;
  try {
    await waitForHttp(BASE_URL);
    browser = await launch();
    await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
    const fixtures = PROTOCOL_TAB_FIXTURES.filter(fixture => !only || fixture.id === only);
    if (!fixtures.length) throw new Error(`No fixture named ${only}`);
    // Each capture uses its own browser context, so captures run concurrently.
    const jobs = fixtures.flatMap(fixture => (fixture.subtabs || SUBTABS).map(subtab => ({ fixture, subtab })));
    const concurrency = Math.max(1, Number(process.env.STROKE_PROTOCOL_LOCK_CONCURRENCY || 3));
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const { fixture, subtab } = jobs[next++];
        const file = path.join(SNAPSHOT_DIR, `${fixture.id}.${subtab}.txt`);
        let corpus;
        try { corpus = await capture(browser, fixture, subtab); } catch (error) { failures.push(String(error.message || error)); continue; }
        if (update) { await fs.writeFile(file, corpus, 'utf8'); console.log(`updated ${path.relative(process.cwd(), file)} (${corpus.split('\n').length - 1} lines)`); continue; }
        let expected;
        try { expected = (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n'); } catch { failures.push(`${fixture.id}/${subtab}: baseline missing`); continue; }
        checked += 1;
        if (expected === corpus) console.log(`ok ${fixture.id}/${subtab} (${expected.split('\n').length - 1} lines)`);
        else { const d = firstDifference(expected, corpus); failures.push(`${fixture.id}/${subtab}: drift at line ${d.line}\n  baseline: ${JSON.stringify(d.expected).slice(0, 240)}\n  rendered: ${JSON.stringify(d.actual).slice(0, 240)}`); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
    if (!update && checked !== jobs.length) failures.push(`only ${checked} of ${jobs.length} captures were compared`);
  } finally {
    if (browser) await browser.close();
    stop();
  }
  if (failures.length) {
    console.error('\nPROTOCOLS TAB PRESERVATION LOCK FAILED');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(update ? '\nProtocols tab baselines written; review the git diff line by line.' : `\nProtocols tab preservation lock: PASS (${checked} fixture/sub-tab captures)`);
}

main().catch(error => { console.error(error); process.exit(1); });
