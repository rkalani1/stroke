// Design, performance and accessibility review, 2026-10-21 (unit: design).
// Contracts first (fonts, CSS weight, shortcut guard, Evidence bottom lines, offline copy), then the
// shell in Chromium, built from source like tests/app-shell-dom.test.jsx. Expected values come from the
// stated rules (WCAG 2.4.11, the shortcut contract in README "Global search", the precache contract),
// not from the implementation's output.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { opensSearch, isTextEntry } from '../src/design/shortcuts.js';
import { bottomLine, sectionId } from '../src/reference-search.js';
import QuickSearch, { SEARCH_TRIALS } from '../src/components/QuickSearch.jsx';
import { buildSearchIndex, searchIndex, SEARCH_GROUPS } from '../src/quick-search-index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = stripComments(read('src/design/tokens.css'));
const shell = stripComments(read('src/design/shell.css'));
const worker = read('service-worker.js');
const coreAssets = eval(worker.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/)[1]);

describe('self-hosted fonts', () => {
  const faces = [...tokens.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
    family: body.match(/font-family:\s*'([^']+)'/)[1], style: body.match(/font-style:\s*(\w+)/)[1],
    weight: Number(body.match(/font-weight:\s*(\d+)/)[1]), file: body.match(/url\('([^']+)'\)/)[1]
  }));
  it('precaches exactly the declared faces, so an install never downloads a face no text uses', () => {
    const precached = coreAssets.filter(asset => asset.endsWith('.woff2')).map(asset => asset.replace(/^\.\//, '')).sort();
    expect(precached).toEqual(faces.map(face => face.file).sort());
    for (const face of faces) expect(fs.existsSync(path.join(root, face.file)), face.file).toBe(true);
  });
  it('preloads only declared faces', () => {
    const preloads = [...read('index.html').matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"/g)].map(match => match[1]);
    expect(preloads.length).toBeGreaterThan(0);
    for (const href of preloads) expect(faces.map(face => face.file)).toContain(href);
  });
  it('asks the display and mono families only for weights that ship', () => {
    const shipped = family => faces.filter(face => face.family === family && face.style === 'normal').map(face => face.weight);
    const display = shipped('Bricolage Grotesque'), mono = shipped('IBM Plex Mono');
    const shorthands = [...shell.matchAll(/\bfont:\s*(\d{3})\s[^;}]*var\(--(font-display|mono-font)\)/g)];
    expect(shorthands.length).toBeGreaterThan(5);
    for (const [, weight, family] of shorthands) expect(family === 'font-display' ? display : mono, `${family} ${weight}`).toContain(Number(weight));
    // A display-font rule that lowers the weight must also switch family (the empty case-bar value).
    for (const [, rule] of shell.matchAll(/\{([^{}]*font-weight:\s*(?:[1-5]00)[^{}]*)\}/g)) expect(rule).not.toMatch(/var\(--font-display\)/);
  });
});

describe('stylesheet weight and style-recalc guards', () => {
  it('builds Tailwind from the content scan alone (no ramp safelist)', () => {
    const config = createRequire(import.meta.url)('../tailwind.config.js');
    expect(config.safelist).toBeUndefined();
  });
  it('never assembles a colour class at runtime, which the content scan could not see', () => {
    const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
    const scanned = ['index.html', ...walk('src').filter(file => file.endsWith('.jsx') || /^src\/(components|design)\/[^/]+\.js$/.test(file))];
    expect(scanned.length).toBeGreaterThan(20);
    // `bg-${tone}`, 'text-' + tone, `border-crit-${step}`, `${hue}-600`: all invisible to Tailwind's scan.
    const dynamic = /\b(?:bg|text|border|ring|fill|stroke|outline|divide)-(?:\$\{|['"`]\s*\+)|-(?:cobalt|crit|warn|ok|info|link|slate)-(?:\$\{|['"`]\s*\+)|\$\{[^}]*\}-(?:50|[1-9]00|950)\b/;
    for (const sample of ['`bg-${tone}`', "'text-' + tone", '`border-crit-${step}`', '`${hue}-600`']) expect(sample).toMatch(dynamic);
    expect('"bg-crit-500 text-ok-700"').not.toMatch(dynamic);
    for (const file of scanned) expect(read(file).match(dynamic)?.[0] ?? null, file).toBeNull();
  });
  it('never keys a root style on :has() (it restyled the whole document on every keystroke)', () => {
    expect(shell).not.toMatch(/(?::root|html)[^{,]*:has\(/);
    expect(tokens).not.toMatch(/:has\(/);
  });
});

describe('focus is never hidden by sticky chrome (WCAG 2.4.11)', () => {
  // The Encounter section nav is 61 px (8 + 44 + 8 + 1 border) under the case bar; the protocol
  // breadcrumb and sub-tabs are 36 px + up to 62 px. Root scroll padding must cover each one.
  const padding = surface => shell.match(new RegExp(`html\\[data-surface="${surface}"\\]\\s*\\{\\s*scroll-padding-top:\\s*calc\\(var\\(--case-bar-h\\)\\s*\\+\\s*(\\d+)px\\)`))?.[1];
  it('pads the Encounter and Protocols scrollports past their sticky bars', () => {
    expect(Number(padding('encounter'))).toBeGreaterThanOrEqual(61);
    expect(Number(padding('protocols'))).toBeGreaterThanOrEqual(36 + 62);
  });
  it('keeps protocol reveal targets where they landed before (8 px + 96 px margin)', () => {
    expect(Number(padding('protocols')) + 0).toBe(8 + 96);
    expect(shell).toMatch(/#tabpanel-protocols :is\(h2, h3, details, \[id\]\) \{ scroll-margin-top: 0; \}/);
    expect(shell).toMatch(/\.quick-reference details\[id\] \{ scroll-margin-top: -96px; \}/);
  });
});

describe('search shortcuts', () => {
  const el = (tagName, extra = {}) => ({ nodeType: 1, tagName, isContentEditable: false, ...extra });
  const key = (k, target = el('BODY'), mods = {}) => ({ key: k, target, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, defaultPrevented: false, isComposing: false, ...mods });
  it('opens with Ctrl+K or ⌘K from the page', () => {
    expect(opensSearch(key('k', el('BODY'), { ctrlKey: true }))).toBe(true);
    expect(opensSearch(key('K', el('BUTTON'), { metaKey: true }), { macLike: true })).toBe(true);
    expect(opensSearch(key('k', el('BODY'), { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(opensSearch(key('k', el('BODY'), { ctrlKey: true, altKey: true }))).toBe(false);
  });
  it('leaves Control+K to a macOS text field, where it deletes to the end of the line', () => {
    expect(opensSearch(key('k', el('INPUT'), { ctrlKey: true }), { macLike: true })).toBe(false);
    expect(opensSearch(key('k', el('INPUT'), { metaKey: true }), { macLike: true })).toBe(true);
    expect(opensSearch(key('k', el('INPUT'), { ctrlKey: true }), { macLike: false })).toBe(true);
  });
  it('never opens on "/" typed into a form control or editable text (BP "172/94", dates)', () => {
    for (const target of [el('INPUT'), el('TEXTAREA'), el('SELECT'), el('DIV', { isContentEditable: true })]) {
      expect(isTextEntry(target)).toBe(true);
      expect(opensSearch(key('/', target))).toBe(false);
    }
    expect(opensSearch(key('/', el('BODY')))).toBe(true);
    expect(opensSearch(key('/', el('A')))).toBe(true);
    expect(opensSearch(key('/', el('BODY'), { ctrlKey: true }))).toBe(false);
  });
  it('ignores keys another handler consumed and IME composition', () => {
    expect(opensSearch(key('/', el('BODY'), { defaultPrevented: true }))).toBe(false);
    expect(opensSearch(key('/', el('BODY'), { isComposing: true }))).toBe(false);
    expect(opensSearch(null)).toBe(false);
  });
  it('indexes navigation, protocol sections, calculators, Evidence topics and studies, trials and external links', () => {
    const data = JSON.parse(read('data/clinical-reference.json')).data;
    const index = buildSearchIndex({ ...data, trials: SEARCH_TRIALS });
    for (const group of SEARCH_GROUPS) expect(index.some(record => record.group === group), group).toBe(true);
    const count = prefix => index.filter(record => record.id.startsWith(prefix)).length;
    expect(count('topic:')).toBe(data.topics.length);
    expect(count('study:')).toBe(data.studies.length);
    expect(count('calc:')).toBe(data.calculators.length);
    expect(count('trial:')).toBe(SEARCH_TRIALS.length);
    // Each entry is found by its own name.
    for (const record of index.filter(item => /^(topic|study|calc|trial|tool|protocol):/.test(item.id))) {
      expect(searchIndex(index, record.title, Infinity).some(hit => hit.id === record.id), record.id).toBe(true);
    }
  });
  it('announces the result count in a region that is always rendered', () => {
    const html = renderToStaticMarkup(<QuickSearch open={false} onClose={() => {}} version="test" trials={[]} />);
    expect(html).toContain('<p class="sr-only" role="status"></p>');
    expect(html).not.toContain('class="quick-search__hint" role="status"');
  });
});

describe('Evidence bottom lines', () => {
  it('cuts at the first sentence end, never inside a decimal, an abbreviation or brackets', () => {
    expect(bottomLine('Give IVT within 4.5 h of onset. Then reassess.')).toBe('Give IVT within 4.5 h of onset.');
    expect(bottomLine('Tenecteplase 0.25 mg/kg (max 25 mg). Alteplase 0.9 mg/kg.')).toBe('Tenecteplase 0.25 mg/kg (max 25 mg).');
    expect(bottomLine('Check the U.S. label before reversal. Then dose.')).toBe('Check the U.S. label before reversal.');
    expect(bottomLine('Composite 2.9 vs. 4.1% at 30 days. CI crosses 0.')).toBe('Composite 2.9 vs. 4.1% at 30 days.');
    expect(bottomLine('Risk fell (see trial A. Results below) in all groups. Next point.')).toBe('Risk fell (see trial A. Results below) in all groups.');
    expect(bottomLine('Is it a stroke? Image now.')).toBe('Is it a stroke?');
  });
  it('returns the whole text when there is one sentence, and nothing for nothing', () => {
    expect(bottomLine('  Treat clinical or EEG-confirmed seizures.  ')).toBe('Treat clinical or EEG-confirmed seizures.');
    expect(bottomLine(undefined)).toBe('');
  });
  it('shows every shipped topic summary from its own opening words', () => {
    const { topics } = JSON.parse(read('data/clinical-reference.json')).data;
    expect(topics.length).toBeGreaterThan(50);
    for (const topic of topics) {
      const line = bottomLine(topic.summary);
      expect(topic.summary.trim().startsWith(line), topic.id).toBe(true);
      expect(line.length, topic.id).toBeGreaterThan(20);
      expect(line === topic.summary.trim() || /[.!?]$/.test(line), topic.id).toBe(true);
    }
    const ids = [...new Set(topics.map(topic => topic.category))].map(sectionId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^evidence-section-[a-z0-9-]+[a-z0-9]$/);
  });
});

describe('offline and install copy', () => {
  it('lists every offline surface and separates links that need internet', () => {
    const offline = read('offline.html');
    for (const surface of ['Encounter', 'protocols', 'Trials', 'Evidence', 'Calculators']) expect(offline).toContain(surface);
    expect(offline).toMatch(/<h2>Needs internet<\/h2><ul>[^]*Telestroke Map[^]*Source links[^]*new app version/);
  });
  it('pre-paints the browser chrome in the theme surface colour, matching what app.js syncs later', () => {
    const toHex = match => `#${match.slice(1, 4).map(v => Number(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    const darkStart = tokens.indexOf('[data-theme="dark"] {');
    const light = toHex(tokens.slice(0, darkStart).match(/--c-surface:\s*(\d+)\s+(\d+)\s+(\d+)/));
    const dark = toHex(tokens.slice(darkStart).match(/--c-surface:\s*(\d+)\s+(\d+)\s+(\d+)/));
    expect(read('index.html')).toContain(`getAttribute('data-theme') === 'dark' ? '${dark}' : '${light}'`);
  });
  it('launches on the app canvas colour, not the retired warm paper', () => {
    const [r, g, b] = tokens.match(/--c-canvas:\s*(\d+)\s+(\d+)\s+(\d+)/).slice(1).map(Number);
    const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    expect(JSON.parse(read('manifest.json')).background_color.toUpperCase()).toBe(hex);
  });
});

// ── The shell in Chromium ──
let browser, files, css, reference, context, page;
const ORIGIN = 'http://stroke.test/';
beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.design-review-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.design-review-test'), file.path).split(path.sep).join('/'), file.text]));
  // The committed tailwind.css is regenerated at integration; append the current shell sources (plain
  // CSS, last in the cascade as in src/styles.css) so these tests see this change's rules either way.
  css = [read('tailwind.css'), read('src/design/tokens.css'), read('src/design/shell.css')].join('\n');
  reference = read('data/clinical-reference.json');
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

// Generous waits: the full suite runs files in parallel, and the search index waits for the reference data.
const poll = check => expect.poll(check, { timeout: 10000, interval: 50 });
const searchFocused = () => page.evaluate(() => Boolean(document.activeElement?.matches('dialog.quick-search[open] input')));

async function open(hash = '#/encounter', viewport = { width: 1280, height: 900 }, origin = ORIGIN) {
  context = await browser.newContext({ serviceWorkers: 'block', viewport });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route(`${origin}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="tailwind.css"></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (relative === 'tailwind.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (relative.startsWith('data/clinical-reference.json')) return route.fulfill({ contentType: 'application/json', body: reference });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.goto(`${origin}${hash}`);
  await page.locator('#tabpanel-encounter').waitFor({ state: 'attached' });
}

// The fraction of a focused control's box that other content covers, from nine sample points.
const focusCoverage = () => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  let covered = 0, byNotice = 0;
  for (const x of [box.left + 2, box.left + box.width / 2, box.right - 2]) for (const y of [box.top + 2, box.top + box.height / 2, box.bottom - 2]) {
    const hit = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight ? document.elementFromPoint(x, y) : null;
    if (hit && (hit === el || el.contains(hit) || hit.contains(el) || [...(el.labels || [])].some(label => label.contains(hit)))) continue;
    covered += 1; if (hit?.closest('aside.workspace-update')) byNotice += 1;
  }
  return { id: el.id || el.tagName, covered, byNotice, inNotice: Boolean(el.closest('aside.workspace-update')) };
});

describe('shell behaviour in Chromium', { timeout: 60000 }, () => {
  it('names the current surface on <html> for the per-surface scroll padding', async () => {
    await open('#/encounter');
    await poll(() => page.evaluate(() => document.documentElement.dataset.surface)).toBe('encounter');
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Protocols' }).click();
    await poll(() => page.evaluate(() => document.documentElement.dataset.surface)).toBe('protocols');
    await page.locator('nav[aria-label="Primary navigation"] a', { hasText: 'Evidence' }).click();
    await poll(() => page.evaluate(() => document.documentElement.dataset.surface)).toBe('evidence');
  });
  it('typing "/" in a field types it; "/" elsewhere and Ctrl+K open search', async () => {
    await open('#/encounter');
    await page.locator('#input-sbp').focus();
    await page.keyboard.type('172/');
    expect(await page.locator('dialog.quick-search[open]').count()).toBe(0);
    await page.locator('#input-sbp').evaluate(node => node.blur());
    await page.keyboard.press('/');
    await poll(searchFocused).toBe(true);
    await page.keyboard.type('alteplase');
    await poll(() => page.locator('dialog.quick-search [role="status"].sr-only').textContent()).toMatch(/^\d+ results?$/);
    await page.keyboard.press('Escape');
    await poll(() => page.locator('dialog.quick-search[open]').count()).toBe(0);
    await page.keyboard.press('Control+k');
    const input = page.locator('dialog.quick-search[open] input');
    await poll(searchFocused).toBe(true);
    // Arrow keys move the active option (aria-activedescendant); Enter opens it.
    await page.keyboard.type('ich score');
    expect(await input.inputValue()).toBe('ich score');
    const options = page.locator('.quick-search__results a[role="option"]');
    await poll(() => options.count()).toBeGreaterThan(1);
    expect(await input.getAttribute('aria-activedescendant')).toBe(await options.nth(0).getAttribute('id'));
    await page.keyboard.press('ArrowDown');
    const second = options.nth(1);
    expect(await input.getAttribute('aria-activedescendant')).toBe(await second.getAttribute('id'));
    expect(await second.getAttribute('aria-selected')).toBe('true');
    const href = await second.getAttribute('href');
    await page.keyboard.press('Enter');
    await poll(() => page.locator('dialog.quick-search[open]').count()).toBe(0);
    if (href.startsWith('#/')) await poll(() => page.evaluate(() => location.hash)).toBe(href);
  });
  it('reopens straight after Esc, empty: neither the old close event nor the old query carries over', async () => {
    await open('#/encounter');
    await page.keyboard.press('/');
    await poll(searchFocused).toBe(true);
    await page.keyboard.type('alteplase');
    // Esc, then Ctrl+K, inside one task (no frame or timer in between): the first dialog's close
    // event is still queued, and the reopened field must already be empty when it takes focus,
    // or a key typed at once lands after the previous query.
    const state = await page.evaluate(async () => {
      const dialog = document.querySelector('dialog.quick-search');
      const settle = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };
      dialog.querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await settle();
      const closedByEsc = !dialog.open;
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
      await settle();
      return { closedByEsc, reopened: dialog.open, value: dialog.querySelector('input').value };
    });
    expect(state).toEqual({ closedByEsc: true, reopened: true, value: '' });
    await page.waitForTimeout(300);
    expect(await page.locator('dialog.quick-search[open]').count()).toBe(1);
  });
  it('shows each collapsed topic with its bottom line and contents, and jumps between sections', async () => {
    await open('#/evidence');
    const data = JSON.parse(reference).data;
    // The topic with the most guideline recommendations, whatever the content agents add.
    const topic = [...data.topics].sort((a, b) => (b.recommendations?.length || 0) - (a.recommendations?.length || 0))[0];
    const card = page.locator(`[data-reference-id="${topic.id}"]`);
    await card.waitFor();
    expect(await card.locator('.reference-bottom-line').textContent()).toBe(bottomLine(topic.summary));
    const recs = topic.recommendations.length;
    expect(await card.locator('.reference-contents').textContent()).toContain(`${recs} guideline recommendation${recs === 1 ? '' : 's'}`);
    // Open, the summary paragraph repeats the sentence, so the preview steps aside (source rule:
    // the generated stylesheet is rebuilt at integration).
    expect(shell).toContain('.reference-card[open] > summary > .reference-bottom-line { display: none; }');
    // Never clamped: a cut clinical sentence can drop its population or "only if" qualifier.
    expect(shell).not.toMatch(/\.reference-bottom-line\s*\{[^}]*(line-clamp|overflow:\s*hidden|text-overflow)/);
    const sections = [...new Set(data.topics.map(item => item.category))];
    const ungrouped = data.studies.some(study => !study.relatedTopic) ? 1 : 0;
    expect(await page.locator('nav[aria-label="Evidence sections"] button').count()).toBe(sections.length + ungrouped);
    const last = sections.at(-1);
    await page.locator('nav[aria-label="Evidence sections"] button', { hasText: last }).click();
    await poll(() => page.evaluate(() => document.activeElement?.id)).toBe(sectionId(last));
    expect(await page.evaluate(() => document.activeElement.getBoundingClientRect().top)).toBeLessThan(200);
  });
  it('shows every collapsed bottom line in full on a phone (no sentence is cut short)', async () => {
    await open('#/evidence', { width: 390, height: 844 });
    await page.locator('.reference-bottom-line').first().waitFor();
    const lines = await page.locator('.reference-bottom-line').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, cut: node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1 })));
    const topics = JSON.parse(reference).data.topics;
    expect(lines.length).toBe(topics.length);
    expect(lines.filter(line => line.cut)).toEqual([]);
    expect(lines.map(line => line.text).sort()).toEqual(topics.map(topic => bottomLine(topic.summary)).sort());
  });
  it('brings a keyboard-focused section button fully into view in the sideways index (820 px)', async () => {
    await open('#/evidence', { width: 820, height: 1180 });
    const buttons = page.locator('nav[aria-label="Evidence sections"] button');
    await buttons.first().waitFor();
    // Below 1024 px the index is one row that scrolls sideways; at 820 px it overflows.
    expect(await page.evaluate(() => { const list = document.querySelector('.reference-index ul'); return list.scrollWidth > list.clientWidth; })).toBe(true);
    await buttons.first().focus();
    const count = await buttons.count();
    for (let i = 1; i < count; i += 1) {
      await page.keyboard.press('Tab');
      const fit = await page.evaluate(() => {
        const button = document.activeElement, list = button.closest('.reference-index ul');
        if (!list) return { label: button.textContent, inside: false };
        const box = button.getBoundingClientRect(), port = list.getBoundingClientRect();
        return { label: button.textContent, inside: box.left >= port.left - 1 && box.right <= port.right + 1 };
      });
      expect(fit.inside, fit.label).toBe(true);
    }
  });
  it('says when it is offline that app content still works and links need internet', async () => {
    await open('#/encounter');
    const status = page.locator('.workspace-offline');
    expect(await status.textContent()).toBe('');
    await context.setOffline(true);
    await poll(() => status.textContent()).toMatch(/Offline · the workspace still works; external and source links need internet/);
    await context.setOffline(false);
    await poll(() => status.textContent()).toBe('');
  });
  it('never moves keyboard focus underneath the floating update notice (WCAG 2.4.11)', async () => {
    // localhost is a secure context, so the page has a service-worker container to hear the
    // worker's "update ready" message (registration itself is blocked in this harness).
    await open('#/encounter', { width: 390, height: 844 }, 'http://localhost:4389/');
    // The announcement region is in place, empty, before any update arrives.
    const live = page.locator('#app-update-status[role="status"]');
    expect(await live.textContent()).toBe('');
    expect(await page.evaluate(() => {
      if (!navigator.serviceWorker) return false;
      navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'sw-update-ready' } }));
      return true;
    })).toBe(true);
    const notice = page.locator('aside.workspace-update');
    await notice.waitFor();
    expect(await live.textContent()).toMatch(/new version is ready.+reloads this page/);
    expect(await live.textContent()).toBe(await notice.locator('p').first().textContent());
    // The scrollport keeps clear at least the band from the notice's top edge to the bottom of the screen.
    const { band, padding, height, published } = await page.evaluate(() => {
      const box = document.querySelector('aside.workspace-update').getBoundingClientRect();
      return { band: innerHeight - box.top, height: box.height, padding: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom), published: document.documentElement.style.getPropertyValue('--update-notice-h') };
    });
    expect(published).toBe(`${Math.ceil(height)}px`);
    expect(padding).toBeGreaterThanOrEqual(band);
    // Walk the whole Encounter form with Tab: no stop may be entirely covered by the notice.
    await page.evaluate(() => { for (const details of document.querySelectorAll('#tabpanel-encounter details:not([open])')) details.open = true; window.scrollTo(0, 0); document.activeElement?.blur(); });
    const hidden = [];
    let stops = 0;
    for (let i = 0; i < 150; i += 1) {
      await page.keyboard.press('Tab');
      const stop = await focusCoverage();
      if (!stop || stop.inNotice) continue;
      stops += 1;
      if (stop.covered === 9 && stop.byNotice > 0) hidden.push(stop.id);
    }
    expect(stops).toBeGreaterThan(100);
    expect(hidden).toEqual([]);
    // Later dismisses the notice and gives the space back.
    await notice.getByRole('button', { name: 'Later' }).click();
    await poll(() => page.evaluate(() => 'updateNotice' in document.documentElement.dataset)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--update-notice-h'))).toBe('');
    expect(await live.textContent()).toBe('');
    // ...and More keeps the deferred update reachable.
    expect(await page.locator('.workspace-utilities > summary').getAttribute('aria-label')).toBe('More utilities, update ready');
  });
});
