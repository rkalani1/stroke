// Shell review, 2026-11-14 (unit: shell): eight findings of the 2026-11-07 audit, outside the Protocols tab.
// Filter rows that moved on the first keystroke (ux-08); the wide panes' pinned record and the deep-linked
// index entry (ux-11); short pages that scrolled by the docked nav (ux-13); the retired page (ux-14); live
// regions inserted together with their text (a11y-06); the bare "/" shortcut (a11y-07, with
// tests/design-2026-10-21.test.jsx); the phone "Jump to" select (a11y-09); the search key hints under
// text spacing (a11y-10). Static checks first, then the shell built from source in Chromium like
// tests/design-2026-10-21.test.jsx. Expected values come from the stated rules (WCAG 1.4.12, 2.1.4, 3.2.2,
// 4.1.3; a first keystroke moves nothing; 44 px targets; the dock's 68 px), not from the implementation.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { CalculatorDirectory } from '../src/Tools.jsx';
import { EncounterNavigation } from '../src/components/EncounterOverview.jsx';
import { newEncounter } from '../src/workspace-state.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const shell = read('src/design/shell.css').replace(/\/\*[\s\S]*?\*\//g, '');
const reference = read('data/clinical-reference.json');
const { data } = JSON.parse(reference);

describe('static markup and rules', () => {
  it('renders the Calculators count region empty before any search, with no Clear button yet (a11y-06, ux-08)', () => {
    const html = renderToStaticMarkup(<CalculatorDirectory state={newEncounter()} update={() => {}} definitions={data.calculators} />);
    expect(html).toContain('<div class="workspace-status-row"><p role="status" class="workspace-help"></p></div>');
    expect(html).not.toContain('Clear search');
  });
  it('starts the phone section select at rest on "Choose a section"', () => {
    expect(renderToStaticMarkup(<EncounterNavigation />)).toContain('<option value="" disabled="" selected="">Choose a section</option>');
  });
  it('wraps the search key hints and scopes the short-page height away from Protocols', () => {
    expect(shell).toMatch(/\.quick-search__footer \{ display: flex; flex-wrap: wrap;/);
    // 68 px is the body padding that reserves the docked nav (shell.css, max-width: 768px).
    expect(shell).toMatch(/body \{ padding: 0 0 calc\(68px \+ env\(safe-area-inset-bottom\)\); \}/);
    expect(shell).toContain('html:not([data-surface="protocols"]) .workspace-shell { min-height: calc(100dvh - 68px - env(safe-area-inset-bottom)); }');
  });
});

// ── The shell in Chromium ──
let browser, files, css, context, page;
const ORIGIN = 'http://stroke.test/';
beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.shell-2026-11-14-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.shell-2026-11-14-test'), file.path).split(path.sep).join('/'), file.text]));
  // The committed tailwind.css is regenerated at integration; the current shell sources come last, as in src/styles.css.
  css = [read('tailwind.css'), read('src/design/tokens.css'), read('src/design/shell.css')].join('\n');
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

const poll = check => expect.poll(check, { timeout: 10000, interval: 50 });
async function open(hash, viewport = { width: 1280, height: 800 }) {
  context = await browser.newContext({ serviceWorkers: 'block', viewport, reducedMotion: 'reduce' });
  await context.addInitScript(() => { window.copies = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copies.push(text); } } }); });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="tailwind.css"></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (relative === 'tailwind.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (relative.startsWith('data/clinical-reference.json')) return route.fulfill({ contentType: 'application/json', body: reference });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.goto(`${ORIGIN}${hash}`);
  await page.locator('#tabpanel-encounter').waitFor({ state: 'attached' });
}
const go = hash => page.evaluate(value => { location.hash = value; }, hash);
// Page-coordinate top of the first matching element that is shown.
const pageTop = selector => page.evaluate(selector => [...document.querySelectorAll(selector)].find(node => node.getClientRects().length).getBoundingClientRect().top + scrollY, selector);
// Marks the live regions present now; after an action, the region holding `text` must carry the mark
// (a region inserted together with its text often is not announced).
const markRegions = () => page.evaluate(() => { for (const node of document.querySelectorAll('[role="status"], [aria-live]')) node.dataset.before = 'yes'; });
const regionWith = text => page.evaluate(text => { const node = [...document.querySelectorAll('[role="status"], [aria-live]')].find(region => region.textContent.trim() === text); return node ? node.dataset.before || 'inserted' : 'none'; }, text);
// Presses a pane title by pointer, then by each key, reading the card's open state after each (a toggle
// event, and any handler that reopens the card, runs a task later).
async function stayOpen(card, summary, keys) {
  const states = [];
  for (const press of [() => summary.click(), ...keys.map(key => () => summary.press(key))]) {
    await press();
    await page.waitForTimeout(50);
    states.push(await card.evaluate(node => node.open));
  }
  return states;
}
// The index's current entry lies inside the index box and on screen (1 px for sub-pixel layout).
const currentEntryShown = selector => page.evaluate(selector => {
  const index = document.querySelector(selector), item = index?.querySelector('[aria-current="true"]');
  if (!item) return false;
  const box = index.getBoundingClientRect(), entry = item.getBoundingClientRect();
  return entry.top >= box.top - 1 && entry.bottom <= box.bottom + 1 && entry.top >= -1 && entry.bottom <= innerHeight + 1;
}, selector);

describe('shell fixes in Chromium', { timeout: 60000 }, () => {
  it.each([[1440, 900], [1024, 900], [390, 844]])('Evidence at %i px: the first keystroke moves nothing; Clear filters joins the count\'s row (ux-08)', async (width, height) => {
    await open('#/evidence', { width, height });
    await page.getByText(`${data.topics.length} topics found.`, { exact: true }).waitFor();
    // The count line, the first status region on the surface.
    const before = await pageTop('.reference-surface [role="status"]');
    await page.getByLabel('Find a clinical question').click();
    await page.keyboard.type('a');
    const clear = page.getByRole('button', { name: 'Clear filters', exact: true });
    await clear.waitFor();
    expect(await pageTop('.reference-surface [role="status"]')).toBe(before);
    expect(await clear.evaluate(node => node.parentElement.contains(document.querySelector('.reference-surface [role="status"]')))).toBe(true);
  });
  it.each([[360, 800], [1280, 800]])('Calculators at %i px: the first keystroke moves nothing, and the count speaks from a region already there (ux-08, a11y-06)', async (width, height) => {
    await open('#/tools', { width, height });
    await page.getByLabel('Find a calculator').waitFor();
    // The first heading below the search (Encounter calculators; "n" still matches NIHSS).
    const before = await pageTop('.tools-surface h2');
    await markRegions();
    await page.getByLabel('Find a calculator').click();
    await page.keyboard.type('n');
    await page.getByRole('button', { name: 'Clear search', exact: true }).waitFor();
    expect(await pageTop('.tools-surface h2')).toBe(before);
    const text = await page.locator('.tools-surface [role="status"]').first().textContent();
    expect(text).toMatch(/^\d+ calculators? found\.$/);
    expect(await regionWith(text)).toBe('yes');
  });

  it('Evidence wide pane: the record is a title that cannot close; a deep link shows its index entry (ux-11)', async () => {
    await open('#/evidence', { width: 1280, height: 800 });
    const card = page.locator('.reading-pane > details.reference-card');
    await card.waitFor();
    const summary = card.locator(':scope > summary');
    expect(await summary.evaluate(node => [getComputedStyle(node, '::after').display, node.tabIndex])).toEqual(['none', -1]);
    expect(await stayOpen(card, summary, ['Enter', 'Space'])).toEqual([true, true, true]);
    // The last topic of the last section is far below the index's first screen.
    const last = await page.locator('.reading-index button').last().getAttribute('data-index-id');
    await go(`#/evidence/${last}`);
    await page.waitForFunction(id => document.activeElement?.closest('[data-reference-id]')?.dataset.referenceId === id, last);
    expect(await page.locator('.reading-index [aria-current="true"]').getAttribute('data-index-id')).toBe(last);
    await poll(() => currentEntryShown('.reading-index')).toBe(true);
  });
  it('Calculators wide pane: the worksheet stays open when its title is pressed; a deep link shows its index entry (ux-11)', async () => {
    await open('#/tools', { width: 1280, height: 800 });
    const card = page.locator('.calc-split details.calc-card');
    await card.waitFor();
    const summary = card.locator(':scope > summary');
    expect(await summary.evaluate(node => [getComputedStyle(node, '::after').display, node.tabIndex])).toEqual(['none', -1]);
    expect(await stayOpen(card, summary, ['Enter', 'Space'])).toEqual([true, true, true]);
    // STOP-BANG is the last worksheet in the index.
    await go('#/tools/stop-bang');
    await page.locator('#calc-stop-bang').waitFor();
    await poll(() => currentEntryShown('.calc-index')).toBe(true);
    expect(await page.locator('.calc-index [aria-current="true"]').textContent()).toBe('STOP-BANG');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#calc-stop-bang')))).toBe(true);
  });

  it.each([[360, 800], [390, 844], [768, 800]])('a short page at %i px does not scroll by the docked nav (ux-13)', async (width, height) => {
    await open('#/education', { width, height });
    await page.locator('main .retirement-message').waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBe(0);
  });
  it('leaves the Protocols surface shell at the full viewport height (ux-13)', async () => {
    await open('#/protocols/ischemic', { width: 390, height: 844 });
    await poll(() => page.evaluate(() => document.documentElement.dataset.surface)).toBe('protocols');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.workspace-shell')).minHeight)).toBe('844px');
  });

  it('names the retired page once, in plain words, with 44 px Search, Encounter and Calculators targets (ux-14)', async () => {
    await open('#/education', { width: 390, height: 844 });
    const section = page.locator('main .retirement-message');
    await section.getByRole('heading', { name: 'Page retired', exact: true }).waitFor();
    await poll(() => page.title()).toBe('Stroke · Page retired');
    expect(await section.innerText()).not.toMatch(/\broute\b|\blean\b|workspace|destination/i);
    const targets = await section.locator('.workspace-inline-links > *').evaluateAll(nodes => nodes.map(node => ({ tag: node.tagName, name: node.textContent, href: node.getAttribute('href'), height: node.getBoundingClientRect().height })));
    expect(targets.map(({ tag, name, href }) => [tag, name, href])).toEqual([['BUTTON', 'Search', null], ['A', 'Encounter', '#/encounter'], ['A', 'Calculators', '#/tools']]);
    for (const target of targets) expect(target.height, target.name).toBeGreaterThanOrEqual(44);
    await section.getByRole('button', { name: 'Search', exact: true }).click();
    await poll(() => page.evaluate(() => Boolean(document.activeElement?.matches('dialog.quick-search[open] input')))).toBe(true);
  });

  it('Evidence: an open card\'s copy outcome speaks from a region already there (a11y-06)', async () => {
    await open('#/evidence', { width: 1024, height: 900 });
    const card = page.locator('.reference-group > details.reference-card').first();
    await card.locator(':scope > summary').click();
    const copy = card.locator(':scope > .reference-body > button', { hasText: /^Copy .* evidence$/ });
    await copy.waitFor();
    await markRegions();
    await copy.click();
    await poll(() => regionWith('Copied with sources and limits.')).toBe('yes');
  });
  it('Trials: each copy outcome speaks from a region already there, kept out of the flow while empty (a11y-06)', async () => {
    await open('#/trials', { width: 1280, height: 900 });
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    await page.getByRole('button', { name: 'Copy screening summary', exact: true }).waitFor();
    await markRegions();
    for (let copy = 0; copy < 2; copy += 1) {
      await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click();
      await poll(() => regionWith('Screening summary copied.')).toBe('yes');
    }
    expect(await page.evaluate(() => window.copies.length)).toBe(2);
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    const region = page.locator('.trials-surface > [role="status"]');
    expect(await region.textContent()).toBe('');
    expect(await region.evaluate(node => getComputedStyle(node).position)).toBe('absolute');
  });
  it('Calculators: the copy outcome speaks from a notice already there, beside the card\'s result status (a11y-06)', async () => {
    await open('#/tools/hunt-hess', { width: 1024, height: 900 });
    const card = page.locator('#calc-hunt-hess');
    await card.locator('select').first().waitFor();
    for (const select of await card.locator('select').all()) await select.selectOption({ index: 1 });
    await markRegions();
    await card.getByRole('button', { name: 'Copy result', exact: true }).click();
    await poll(() => regionWith('Hunt–Hess grade copied.')).toBe('yes');
    // The result line stays the card's one status.
    expect(await card.getByRole('status').count()).toBe(1);
  });

  it('advertises only the Ctrl/⌘K shortcut (a11y-07)', async () => {
    await open('#/encounter', { width: 1280, height: 800 });
    expect(await page.locator('button.workspace-search').getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    await page.locator('details.workspace-utilities > summary').click();
    expect(await page.locator('.utility-shortcuts kbd').allTextContents()).toEqual(['Ctrl', '⌘', 'K']);
  });

  it('the phone "Jump to" select browses with the keyboard and goes only on Enter or a pick (a11y-09, WCAG 3.2.2)', async () => {
    await open('#/encounter', { width: 390, height: 844 });
    const select = page.getByLabel('Jump to encounter section');
    await select.focus();
    const state = () => page.evaluate(() => ({ focus: document.activeElement.id || document.activeElement.getAttribute('aria-label'), y: Math.round(scrollY), value: document.querySelector('.encounter-section-select select').value }));
    const start = await state();
    expect(start).toMatchObject({ focus: 'Jump to encounter section', value: '' });
    await page.keyboard.press('ArrowDown');
    expect(await state()).toEqual({ ...start, value: 'context' });
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
    expect(await state()).toEqual({ ...start, value: 'safety' });
    await page.keyboard.press('End');
    expect(await state()).toEqual({ ...start, value: 'handoff' });
    await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await poll(() => page.evaluate(() => document.activeElement.id)).toBe('exam-title');
    expect(await select.inputValue()).toBe('');
    // A pick from the opened list: Playwright sets the option and fires change with no key, as a click or tap does.
    await select.selectOption('handoff');
    await poll(() => page.evaluate(() => document.activeElement.id)).toBe('handoff-title');
    expect(await select.inputValue()).toBe('');
    // Browsing, then leaving without Enter, goes nowhere and puts the select back at rest.
    await select.focus();
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
    expect(await select.inputValue()).toBe('');
    expect(await page.evaluate(() => document.activeElement.id)).not.toMatch(/-title$/);
  });

  it('keeps the search key hints whole under the text-spacing override at 320 px (a11y-10, WCAG 1.4.12)', async () => {
    await open('#/encounter', { width: 320, height: 640 });
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    await page.locator('button.workspace-search').click();
    await poll(() => page.evaluate(() => Boolean(document.activeElement?.matches('dialog.quick-search[open] input')))).toBe(true);
    await page.keyboard.type('ich');
    await page.locator('.quick-search__results a[role="option"]').first().waitFor();
    const fit = await page.evaluate(() => {
      const dialog = document.querySelector('dialog.quick-search'), footer = dialog.querySelector('.quick-search__footer'), text = document.createRange();
      text.selectNodeContents(footer);
      const outer = dialog.getBoundingClientRect(), inner = text.getBoundingClientRect();
      return { dialog: dialog.scrollWidth <= dialog.clientWidth, footer: footer.scrollWidth <= footer.clientWidth, inside: inner.right <= outer.right && inner.bottom <= outer.bottom, end: footer.textContent.trim().endsWith('close') };
    });
    expect(fit).toEqual({ dialog: true, footer: true, inside: true, end: true });
  });
});
