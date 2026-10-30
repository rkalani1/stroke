// Round-3 verification fixes for the Encounter unit (2026-10-22), rendered: the idle notice in Chromium with a fake
// clock (encounter-ui#2), the worksheet unit cautions in Encounter (calculators#4) and the baseline mRS choices
// (e2e:trials-calculators-search#8; mRS 6 is death in van Swieten 1988, so it is not a pre-stroke state).
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Encounter from '../src/Encounter.jsx';
import EncounterDetails from '../src/components/EncounterDetails.jsx';
import { newEncounter } from '../src/workspace-state.js';
import { supplementarySourceKey } from '../src/supplementary-calculators.js';

describe('Encounter shows the STOP-BANG unit caution the note carries (calculators#4)', () => {
  it('renders the neck caution beside the reviewed score', () => {
    const base = newEncounter();
    const state = { ...base, context: 'follow-up', note: { ...base.note, diagnosisCategory: 'ischemic', age: '55', sex: 'M', weight: '80', heightCm: '175' } };
    // STOP 1 (snoring) + BANG: BMI 26.1 no, age >50 yes, neck 16 cm no, male yes = 3/8 (Chung 2016 item definitions).
    const answers = { sb_snoring: true, sb_tired: false, sb_observed: false, sb_pressure: false, neckCm: '16' };
    state.supplementary = { 'stop-bang': { ...answers, reviewed: true, reviewSourceKey: supplementarySourceKey(state, 'stop-bang') } };
    const html = renderToStaticMarkup(<EncounterDetails section="safety" state={state} update={() => {}} />);
    expect(html).toContain('>3/8</output>');
    expect(html).toContain('data-tone="caution">Neck circumference under 25 cm is unusual for an adult and drives the neck item; confirm centimeters, not inches (16 in ≈ 40.6 cm).</p>');
    state.supplementary['stop-bang'] = { ...answers, neckCm: '38', reviewed: true, reviewSourceKey: supplementarySourceKey(state, 'stop-bang') };
    expect(renderToStaticMarkup(<EncounterDetails section="safety" state={state} update={() => {}} />)).not.toContain('data-tone="caution"');
  });
});

describe('Baseline mRS offers 0–5 only (e2e:trials-calculators-search#8)', () => {
  it('has no "6 · Death" choice', () => {
    const html = renderToStaticMarkup(<Encounter state={newEncounter()} update={() => {}} now={Date.parse('2026-10-22T12:00:00Z')} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
    const select = html.match(/<select[^>]*id="calc-mrs"[^>]*>(.*?)<\/select>/)?.[1] || '';
    expect([...select.matchAll(/value="([^"]*)"/g)].map(match => match[1])).toEqual(['', '0', '1', '2', '3', '4', '5']);
  });
  it('keeps a 6 that arrived from elsewhere (the Protocols EVT card offers 0–6) visible instead of hiding it', () => {
    const base = newEncounter();
    const html = renderToStaticMarkup(<Encounter state={{ ...base, note: { ...base.note, premorbidMRS: '6' } }} update={() => {}} now={Date.parse('2026-10-22T12:00:00Z')} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
    const select = html.match(/<select[^>]*id="calc-mrs"[^>]*>(.*?)<\/select>/)?.[1] || '';
    expect(select).toContain('<option value="6" selected="">6 · Death</option>');
  });
});

const root = fileURLToPath(new URL('../', import.meta.url));
const ORIGIN = 'http://stroke.test/';
let browser, files, context, page;
beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.r3-encounter-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.r3-encounter-test'), file.path).split(path.sep).join('/'), file.text]));
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

async function open(time = '2026-10-22T10:00:00-07:00') {
  context = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'America/Los_Angeles', locale: 'en-US', viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.clock.install({ time: new Date(Date.parse(time) - 1000) });
  await page.clock.pauseAt(new Date(time));
  await page.goto(`${ORIGIN}#/encounter`);
  await page.locator('#input-age').waitFor();
}

describe('idle notice for an encounter without timestamps, tab kept visible (encounter-ui#2)', { timeout: 40000 }, () => {
  it('appears after 2 h with no visibility change, and before the next keystroke', async () => {
    await open();
    await page.locator('#input-diagnosis').selectOption('ich');
    await page.fill('#input-age', '70');
    const idle = page.locator('#tabpanel-encounter .workspace-result', { hasText: 'Last entry' });
    await page.clock.runFor(119 * 60000);
    expect(await idle.count()).toBe(0);
    await page.clock.runFor(61 * 60000);
    expect(await idle.innerText()).toBe('Last entry 3 h 00 min ago. If this is a different patient, use New encounter first.');
    await page.fill('#input-glucose', '120');
    expect(await idle.count()).toBe(0);
  });
  it('an empty encounter shows no notice', async () => {
    await open();
    await page.clock.runFor(180 * 60000);
    expect(await page.locator('#tabpanel-encounter .workspace-result', { hasText: 'Last entry' }).count()).toBe(0);
  });
});
