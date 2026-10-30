// The app shell in Chromium, built from source with the production split (lazy chunks) and
// served from a synthetic origin. Covers: a failed lazy download stays contained (SPS-01),
// SAH opens the ICH protocol tab (SPS-06), re-selecting the current tool route reveals it
// (SPS-15), gated section deep links explain themselves (SPS-13), and theme-color follows
// the OS scheme in System mode (SPS-12).
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const ORIGIN = 'http://stroke.test/';
let browser, files, css, reference, context, page;

beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.app-shell-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.app-shell-test'), file.path).split(path.sep).join('/'), file.text]));
  css = await readFile(path.join(root, 'tailwind.css'), 'utf8');
  reference = await readFile(path.join(root, 'data/clinical-reference.json'), 'utf8');
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

// `failing` names lazy chunks (by base name) that answer 404, as after a deploy removed them.
async function open(hash = '#/encounter', { failing = [], colorScheme = 'light' } = {}) {
  context = await browser.newContext({ serviceWorkers: 'block', colorScheme, viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="theme-color" content="#0A6571"><link rel="stylesheet" href="tailwind.css"></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (relative === 'tailwind.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (relative === 'data/clinical-reference.json') return route.fulfill({ contentType: 'application/json', body: reference });
    if (failing.some(name => relative.startsWith(`chunks/${name}-`))) return route.fulfill({ status: 404, body: 'Not found' });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.goto(`${ORIGIN}${hash}`);
  await page.locator('#input-age').waitFor({ state: 'attached' });
}
const stillThere = async () => {
  expect(await page.locator('.workspace-header').count()).toBe(1);
  expect(await page.locator('#input-age').inputValue()).toBe('70');
};

describe('a failed lazy download keeps the encounter', { timeout: 30000 }, () => {
  it('search', async () => {
    await open('#/encounter', { failing: ['QuickSearch'] });
    await page.fill('#input-age', '70');
    await page.locator('.workspace-search').click();
    await expect.poll(() => page.locator('[role="alert"] h1').allTextContents()).toEqual(['Search unavailable']);
    await stillThere();
  });
  it('protocol quick reference', async () => {
    await open('#/encounter', { failing: ['QuickReference'] });
    await page.fill('#input-age', '70');
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
    await expect.poll(() => page.locator('[role="alert"] h1').allTextContents()).toEqual(['Quick reference unavailable']);
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Encounter' }).click();
    await stillThere();
  });
  it('install options', async () => {
    await open('#/encounter', { failing: ['InstallAppButton'] });
    await page.fill('#input-age', '70');
    await page.locator('.workspace-utilities summary').click();
    await expect.poll(() => page.locator('[role="alert"] h1').allTextContents()).toEqual(['Install options unavailable']);
    await stillThere();
  });
  it('renders the same quick reference when the download succeeds', async () => {
    await open('#/protocols/ich');
    await page.locator('#qr-sah').waitFor({ state: 'attached' }); // inside the closed quick reference since 7.8.1
    expect(await page.locator('[role="alert"]').count()).toBe(0);
  });
});

describe('protocol tab for the working diagnosis', { timeout: 30000 }, () => {
  const navHref = () => page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).getAttribute('href');
  it('SAH opens the ICH tab, which carries the SAH first-hour card, like the case bar', async () => {
    await open();
    expect(await navHref()).toBe('#/protocols/ischemic');
    await page.selectOption('#input-diagnosis', 'sah');
    expect(await navHref()).toBe('#/protocols/ich');
    expect(await page.locator('.case-bar a', { hasText: 'Reversal' }).getAttribute('href')).toBe('#/protocols/ich/qr-reversal');
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
    await page.locator('#qr-sah').waitFor({ state: 'attached' }); // inside the closed quick reference since 7.8.1
    expect(await page.title()).toBe('Stroke · ICH protocols');
    await page.locator('.workspace-search').click();
    expect(await page.locator('.quick-search__chips a', { hasText: 'Reversal' }).getAttribute('href')).toBe('#/protocols/ich/qr-reversal');
  });
  it('ischemic and ICH keep their own tabs', async () => {
    await open();
    await page.selectOption('#input-diagnosis', 'ischemic');
    expect(await navHref()).toBe('#/protocols/ischemic');
    await page.selectOption('#input-diagnosis', 'ich');
    expect(await navHref()).toBe('#/protocols/ich');
  });
});

describe('navigation feedback', { timeout: 30000 }, () => {
  it('re-selecting the current Encounter tool from search scrolls to it and focuses it', async () => {
    await open('#/encounter/nihss');
    await page.locator('#calc-nihss').waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#workspace-main').evaluate(node => node.blur());
    await page.locator('.workspace-search').click();
    await page.locator('.quick-search__chips a', { hasText: 'NIHSS' }).click();
    await expect.poll(() => page.locator('#calc-nihss').evaluate(node => node.contains(document.activeElement))).toBe(true);
    expect(await page.locator('#calc-nihss').evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(300);
  });
  it('a gated section deep link says why the section is absent until it applies', async () => {
    await open('#/encounter/section/etiology');
    const notice = page.locator('#workspace-main [role="status"]', { hasText: 'Etiology & diagnostic workup is not shown' });
    await notice.waitFor();
    await page.selectOption('#input-diagnosis', 'ischemic');
    await page.locator('#encounter-details-etiology').waitFor();
    expect(await notice.count()).toBe(0);
  });
});

describe('browser chrome colour', { timeout: 30000 }, () => {
  it('follows an OS scheme change in System mode', async () => {
    await open('#/encounter', { colorScheme: 'light' });
    await page.locator('.workspace-utilities summary').click();
    await page.selectOption('select[aria-label="Theme"]', 'auto');
    const surface = () => page.evaluate(() => `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--c-surface').trim().split(/\s+/).join(',')})`);
    const meta = () => page.locator('meta[name="theme-color"]').getAttribute('content');
    const light = await surface();
    await expect.poll(meta).toBe(light);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');
    const dark = await surface();
    expect(dark).not.toBe(light);
    await expect.poll(meta).toBe(dark);
  });
});
