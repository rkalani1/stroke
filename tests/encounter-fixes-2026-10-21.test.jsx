// Encounter fixes (2026-10-22) in Chromium: the app shell built from source and served from a synthetic origin with
// a fixed clock, zone and locale. New encounter must clear what native inputs display (a partly typed date, time or
// number keeps no state in React) and leave focus on the new Encounter at the top of the page, from Encounter and
// from More on another surface.
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
    outdir: path.join(root, '.encounter-fixes-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.encounter-fixes-test'), file.path).split(path.sep).join('/'), file.text]));
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

async function open(viewport) {
  context = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'America/Los_Angeles', locale: 'en-US', viewport });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.clock.install({ time: new Date('2026-10-21T13:59:59-07:00') });
  await page.clock.pauseAt(new Date('2026-10-21T14:00:00-07:00'));
  await page.goto(`${ORIGIN}#/encounter`);
  await page.locator('#input-age').waitFor();
  page.on('dialog', dialog => dialog.accept());
}
const field = label => page.locator('#tabpanel-encounter').getByLabel(label, { exact: true }).first();
const native = () => page.evaluate(() => ['LKW date (local)', 'LKW time (local)', 'Glucose (mg/dL)'].map(label => { const input = document.querySelector(`#tabpanel-encounter [aria-label="${label}"]`); return { value: input.value, badInput: input.validity.badInput }; }));
const focusAndScroll = () => page.evaluate(() => ({ focus: document.activeElement?.id, scrollY: Math.round(window.scrollY) }));

describe('New encounter', { timeout: 60000 }, () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    it(`clears partly typed native inputs and focuses the new Encounter at the top (${viewport.width} px)`, async () => {
      await open(viewport);
      await field('Working diagnosis').selectOption('ischemic');
      await field('LKW date (local)').click(); await page.keyboard.type('1020');
      await field('LKW time (local)').click(); await page.keyboard.type('11');
      await field('Glucose (mg/dL)').click(); await page.keyboard.type('1e');
      // Partial entries have no value that React could clear, only native state.
      expect(await native()).toEqual([{ value: '', badInput: true }, { value: '', badInput: true }, { value: '', badInput: true }]);
      await page.getByRole('button', { name: 'New encounter', exact: true }).click();
      await page.clock.runFor(100);
      expect(await native()).toEqual([{ value: '', badInput: false }, { value: '', badInput: false }, { value: '', badInput: false }]);
      expect(await focusAndScroll()).toEqual({ focus: 'encounter-title', scrollY: 0 });
      // The next patient's year alone never completes the previous patient's month and day.
      await field('Working diagnosis').selectOption('ischemic');
      await field('LKW date (local)').click(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.type('2026');
      expect(await field('LKW date (local)').inputValue()).toBe('');
    });
  }

  it('from More on Protocols, returns to the Encounter heading at the top with the case bar gone', async () => {
    await open({ width: 390, height: 844 });
    await field('Working diagnosis').selectOption('ischemic');
    await page.fill('#input-age', '68');
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
    await page.locator('#tabpanel-protocols').waitFor();
    await page.locator('details.workspace-utilities > summary').click();
    await page.getByRole('button', { name: 'Start new encounter', exact: true }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/encounter');
    await page.clock.runFor(100);
    await expect.poll(focusAndScroll).toEqual({ focus: 'encounter-title', scrollY: 0 });
    expect(await page.locator('.case-bar').count()).toBe(0);
    expect(await page.inputValue('#input-age')).toBe('');
  });
});
