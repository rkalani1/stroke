// Encounter review 2026-10-21 in Chromium: the app shell built from source and served from a
// synthetic origin with a fixed clock, time zone and locale. Covers clipboard outcomes (granted,
// denied, missing, superseded), elapsed time across midnight, a repeated hour and a background
// suspension, the idle notice, counter labels for unusable entries, New encounter and locale.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ORIGIN = 'http://stroke.test/';
let browser, files, context, page;

beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.encounter-review-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.encounter-review-test'), file.path).split(path.sep).join('/'), file.text]));
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

// clipboard: 'granted' records the text, 'denied' rejects, 'missing' removes the API, 'slow' resolves after 1.5 s.
async function open({ time = '2026-10-21T10:00:00-07:00', timezoneId = 'America/Los_Angeles', locale = 'en-US', clipboard = 'granted' } = {}) {
  context = await browser.newContext({ serviceWorkers: 'block', timezoneId, locale, viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.addInitScript(mode => {
    window.copied = [];
    const writeText = text => mode === 'denied' ? Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError'))
      : mode === 'slow' ? new Promise(resolve => setTimeout(() => { window.copied.push(text); resolve(); }, 1500))
      : (window.copied.push(text), Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing' ? undefined : { writeText } });
    // Lets a test emulate a background tab; the app reads document.hidden.
    window.tabHidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.tabHidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.tabHidden ? 'hidden' : 'visible' });
  }, clipboard);
  await page.clock.install({ time: new Date(Date.parse(time) - 1000) });
  await page.clock.pauseAt(new Date(time));
  await page.goto(`${ORIGIN}#/encounter`);
  await page.locator('#input-age').waitFor();
}
const field = label => page.locator('#tabpanel-encounter').getByLabel(label, { exact: true }).first();
const status = () => page.locator('.handoff-status').innerText();
const lkwResult = () => page.locator('.lkw-block .workspace-result').innerText();
const caseTime = async () => (await page.locator('.case-bar__time').innerText()).replace(/\s+/g, ' ').trim();
async function ischemic({ lkwDate = '2026-10-21', lkwTime = '09:10' } = {}) {
  await field('Working diagnosis').selectOption('ischemic');
  await page.fill('#input-age', '71');
  await page.fill('#input-weight', '77');
  await field('LKW date (local)').fill(lkwDate);
  await field('LKW time (local)').fill(lkwTime);
}
const setHidden = hidden => page.evaluate(value => { window.tabHidden = value; document.dispatchEvent(new Event('visibilitychange')); }, hidden);

describe('copy feedback is reported for every clipboard outcome', { timeout: 40000 }, () => {
  it('confirms a successful copy in Encounter and in the case bar, and the copied note is current', async () => {
    await open();
    await ischemic();
    await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).click();
    await expect.poll(status).toBe('Pulsara summary copied.');
    expect(await page.locator('.case-bar__copy').innerText()).toBe('Copied ✓');
    const [copied] = await page.evaluate(() => window.copied);
    expect(copied).toMatch(/^71 year old \[sex not documented\] \(Wt: 77kg\)/);
    expect(copied).toBe(await page.locator('[data-generated-note]').inputValue());
    // On another surface the case bar's own status region announces the outcome.
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
    await page.locator('.case-bar__copy').click();
    await expect.poll(() => page.locator('.case-bar__actions [role="status"]').innerText()).toBe('Pulsara summary copied.');
  });

  for (const clipboard of ['denied', 'missing']) {
    it(`announces a ${clipboard} clipboard and selects the full note for manual copy`, async () => {
      await open({ clipboard });
      await ischemic();
      await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).click();
      await expect.poll(status).toBe('Clipboard unavailable. Select the read-only summary and copy it manually.');
      expect(await page.locator('.case-bar__copy').innerText()).not.toContain('Copied');
      const selection = () => page.evaluate(() => { const note = document.querySelector('[data-generated-note]'); return { focused: document.activeElement === note, selected: note.selectionEnd - note.selectionStart, length: note.value.length }; });
      await expect.poll(async () => { const { focused, selected, length } = await selection(); return focused && selected === length && length > 0; }).toBe(true);
      // From another surface, the case bar returns to Encounter with the note selected.
      await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
      await page.locator('.case-bar__copy').click();
      await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/encounter');
      // The hand-off to Encounter focuses on the next animation frame; the paused clock must advance.
      await page.clock.runFor(100);
      await expect.poll(async () => (await selection()).focused).toBe(true);
      expect(await status()).toBe('Clipboard unavailable. Select the read-only summary and copy it manually.');
    });
  }

  it('reports a copy superseded by an edit instead of success', async () => {
    await open({ clipboard: 'slow' });
    await ischemic();
    await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).click();
    await page.fill('#input-age', '72');
    await page.clock.runFor(2000);
    await expect.poll(status).toBe('Inputs changed while copying; the clipboard may hold an earlier version. Copy again to include the latest entries.');
  });
});

describe('elapsed time in the running app', { timeout: 40000 }, () => {
  it('crosses midnight from the recorded date and flags a same-date future time', async () => {
    await open({ time: '2026-10-21T01:00:00-07:00' });
    await ischemic({ lkwDate: '2026-10-20', lkwTime: '23:30' });
    await field('Baseline mRS').selectOption('0');
    expect(await lkwResult()).toMatch(/^LKW: 90 min elapsed \(1:30\)/);
    expect(await caseTime()).toContain('1:30');
    await field('LKW date (local)').fill('2026-10-21');
    expect(await lkwResult()).toBe('Invalid, future, skipped or ambiguous local time: correct the timestamp or choose its clock occurrence.');
    expect(await caseTime()).toContain('Check time');
    expect((await page.locator('.encounter-next-entry').innerText()).replace(/\s+/g, ' ')).toContain('LKW date and time (check entry)');
  });

  it('asks which occurrence of a repeated hour was meant and measures from the chosen instant', async () => {
    await open({ time: '2026-11-01T03:00:00-08:00' });
    await ischemic({ lkwDate: '2026-11-01', lkwTime: '01:30' });
    expect(await lkwResult()).toMatch(/^Invalid, future, skipped or ambiguous/);
    const chooser = page.getByLabel('LKW clock occurrence');
    expect(await chooser.locator('option').allInnerTexts()).toEqual(['Choose which occurrence was recorded', 'First occurrence (UTC−07:00)', 'Second occurrence (UTC−08:00)']);
    await chooser.selectOption({ index: 1 });
    expect(await lkwResult()).toMatch(/^LKW: 150 min elapsed \(2:30\)/);
    await chooser.selectOption({ index: 2 });
    expect(await lkwResult()).toMatch(/^LKW: 90 min elapsed \(1:30\)/);
  });

  it('jumps to wall time after a background suspension instead of counting ticks', async () => {
    await open();
    await ischemic({ lkwTime: '09:00' });
    expect(await lkwResult()).toMatch(/^LKW: 60 min elapsed/);
    await setHidden(true);
    await page.clock.fastForward(3 * 3600000);
    await setHidden(false);
    expect(await lkwResult()).toMatch(/^LKW: 240 min elapsed \(4:00\) · 4\.5 h in 0:30:00/);
    await page.clock.runFor(60000);
    expect(await lkwResult()).toMatch(/^LKW: 241 min elapsed/);
  });

  it('says how long ago the last entry was after 2 h, and clears the notice on the next entry', async () => {
    await open();
    await ischemic();
    const idle = page.locator('#tabpanel-encounter .workspace-result', { hasText: 'Last entry' });
    // fastForward fires the one-second clock once at the new time, as after a long pause.
    await page.clock.fastForward(119 * 60000);
    expect(await idle.count()).toBe(0);
    await page.clock.fastForward(6 * 60000);
    expect(await idle.innerText()).toBe('Last entry 2 h 05 min ago. If this is a different patient, use New encounter first.');
    expect(await idle.getAttribute('role')).toBe('status');
    await page.fill('#input-glucose', '120');
    expect(await idle.count()).toBe(0);
  });
});

describe('entries that cannot be used are named where they are entered', { timeout: 40000 }, () => {
  it('labels an invalid weight in the counter, focuses it, and names invalid ASPECTS and future procedure times', async () => {
    await open();
    await ischemic();
    await page.fill('#input-weight', '400');
    const next = page.locator('.encounter-next-entry button');
    await field('Baseline mRS').selectOption('0');
    expect((await next.innerText()).replace(/\s+/g, ' ').trim()).toBe('Next: Weight (check entry) →');
    await next.click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('input-weight');
    await page.fill('#calc-aspects', '11');
    expect(await page.locator('#exam .workspace-result', { hasText: 'whole number' }).innerText()).toBe('Reviewed ASPECTS: enter a whole number from 0 to 10; the current entry is not used.');
    await page.evaluate(() => { for (const d of document.querySelectorAll('#tabpanel-encounter details:not([open])')) d.open = true; });
    await field('EVT puncture timestamp (local)').fill('2026-10-21T11:30');
    expect(await page.locator('#handoff .workspace-result', { hasText: 'EVT puncture' }).innerText()).toBe('Check EVT puncture: in the future, invalid or an unresolved repeated hour. The note flags it until corrected.');
  });
});

describe('New encounter and locale', { timeout: 40000 }, () => {
  it('keeps everything when cancelled and clears entries, note, status and case bar when accepted', async () => {
    await open();
    await ischemic();
    await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).click();
    await expect.poll(status).toBe('Pulsara summary copied.');
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'New encounter', exact: true }).click();
    expect(await page.inputValue('#input-age')).toBe('71');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'New encounter', exact: true }).click();
    expect(await page.inputValue('#input-age')).toBe('');
    expect(await field('LKW time (local)').inputValue()).toBe('');
    expect(await page.locator('.case-bar').count()).toBe(0);
    expect(await page.locator('[data-generated-note]').count()).toBe(0);
    expect(await status()).toBe('');
    expect((await page.locator('.encounter-next-entry').innerText()).replace(/\s+/g, ' ')).toContain('10 core entries missing');
  });

  it('writes the same note text under another browser locale', async () => {
    const notes = [];
    for (const locale of ['en-US', 'de-DE']) {
      await open({ locale });
      await ischemic();
      await page.getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
      notes.push(await page.locator('[data-generated-note]').inputValue());
      await context.close(); context = null;
    }
    expect(notes[1]).toBe(notes[0]);
    expect(notes[0]).toContain('Times: local to the documenting device (America/Los_Angeles, PDT)');
  });
});
