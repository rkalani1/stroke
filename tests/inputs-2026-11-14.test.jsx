// Number-entry review 2026-11-14 (audit a11y-02, logic-01, ux-09, a11y-06 Encounter part), synthetic data only.
// An out-of-range entry is named beside its field exactly when the Encounter does not use it: the expected
// answers come from the generated note, the dose/renal/volume arithmetic and the worksheet scoring functions,
// never from the hint code. Then the hints, aria-invalid and the live regions in Chromium.
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import Encounter from '../src/Encounter.jsx';
import SupplementaryCalculators from '../src/components/SupplementaryCalculators.jsx';
import { caseSummary } from '../src/components/CaseBar.jsx';
import { ENTRY_RANGES, entryIssue, weightInKg, weightLimit } from '../src/encounter-inputs.js';
import { formatElapsed } from '../src/clinical/encounter-time.js';
import { calculatorEntryIssue, calculatorProgress } from '../src/calculator-utilities.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { supplementaryResult, updateSupplementaryField } from '../src/supplementary-calculators.js';
import { screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { newEncounter, buildSummary, encounterVolume } from '../src/workspace-state.js';
import { calculateCrClReviewed, calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed } from '../src/calculators.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => { const s = newEncounter(); return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, dapt: { ...s.dapt, ...patch.dapt }, volume: { ...s.volume, ...patch.volume } }; };
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const flagged = value => typeof value === 'string';
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const inputTag = (html, label) => html.match(new RegExp(`<input[^>]*aria-label="${escape(label)}"[^>]*>`))?.[0] || '';
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
// The hint a field's aria-describedby points to, or null.
const hintFor = (html, label) => { const id = attr(inputTag(html, label), 'aria-describedby'); return id ? html.match(new RegExp(`<small id="${escape(id)}" class="field-error">([^<]*)</small>`))?.[1] ?? null : null; };
const acute = { diagnosisCategory: 'ischemic' };

describe('the hint appears exactly when the note does not use the entry', () => {
  // [range key, note field, probes, how the note shows an entry it does not use]
  const lab = (key, probes) => [key, key, probes, (note, v) => note.includes(`[${v} invalid`) || note.includes(`[${v} °F implausible`)];
  const cases = [
    ['age', 'age', ['-1', '-0.5', '0', '0.4', '17', '120', '120.01', '250', '1e2'], (note, v) => note.includes(`[age ${v} invalid`)],
    lab('glucose', ['0', '-3', '0.5', '1', '2000', '2000.5', '3000']),
    lab('heartRate', ['0', '0.5', '300', '301']),
    lab('spO2', ['0', '1', '100', '100.5']),
    lab('temperature', ['0', '37', '79.9', '80', '115', '115.1']),
    lab('plateletCount', ['-1', '0', '80', '2500']),
    lab('pt', ['0', '0.5', '300', '301']),
    lab('inr', ['0', '0.05', '20', '20.1']),
    lab('ptt', ['0', '0.5', '300', '301']),
    lab('creatinine', ['0', '0.05', '30', '30.1']),
    ['coreVolume', 'coreVolume', ['-1', '0', '70'], note => note.includes('Core: invalid measurement')],
    ['penumbraVolume', 'penumbraVolume', ['-1', '0', '120'], note => note.includes('Total hypoperfused volume: invalid measurement')]
  ];
  it.each(cases)('%s', (key, field, probes, unused) => {
    for (const value of probes) {
      const note = buildSummary(make({ note: { ...acute, [field]: value } }), now);
      expect(flagged(entryIssue(value, ENTRY_RANGES[key])), `${key} ${value}`).toBe(unused(note, value));
    }
  });
  it('blood pressure, checked per field against the note', () => {
    for (const sbp of ['0', '0.5', '1', '400', '401', '500']) expect(flagged(entryIssue(sbp, ENTRY_RANGES.sbp)), sbp).toBe(buildSummary(make({ note: { ...acute, presentingBP: `${sbp}/1` } }), now).includes(`[BP ${sbp}/1 invalid`));
    for (const dbp of ['0', '0.5', '1', '300', '301', '350']) expect(flagged(entryIssue(dbp, ENTRY_RANGES.dbp)), dbp).toBe(buildSummary(make({ note: { ...acute, presentingBP: `400/${dbp}` } }), now).includes(`[BP 400/${dbp} invalid`));
  });
  it('weight, as stored in kilograms, against the note, the dose arithmetic and the case bar', () => {
    for (const kg of ['-1', '0', '0.0001', '29', '350', '350.000945', '900']) {
      const state = make({ note: { ...acute, weight: kg } }), unused = flagged(entryIssue(kg, [0, 350, 1]));
      expect(buildSummary(state, now).includes('(Wt: [invalid'), kg).toBe(unused);
      expect(calculateTNKDoseReviewed(kg, 'guideline') === null, kg).toBe(unused);
      expect(calculateAlteplaseDoseReviewed(kg) === null, kg).toBe(unused);
      expect(caseSummary(state, now).weight === '', kg).toBe(unused);
    }
  });
  it('the administered dose, once the administration is recorded', () => {
    for (const dose of ['0', '0.1', '25', '100', '100.5']) {
      const note = buildSummary(make({ note: acute, drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00', administeredDose: dose } }), now);
      expect(flagged(entryIssue(dose, ENTRY_RANGES.administeredDose)), dose).toBe(note.includes(`[administered dose ${dose} invalid`));
    }
  });
  it('the reviewed ABCD² in an acute TIA', () => {
    for (const score of ['-1', '0', '2.5', '7', '8']) {
      const note = buildSummary(make({ note: { diagnosisCategory: 'tia' }, dapt: { abcd2: score } }), now);
      expect(flagged(entryIssue(score, ENTRY_RANGES.abcd2)), score).toBe(note.includes(`[ABCD² ${score} invalid`));
    }
  });
  it('height against the renal calculation, and the ABC/2 inputs against the volume', () => {
    for (const height of ['-5', '0', '0.5', '120', '300', '300.5']) expect(flagged(entryIssue(height, ENTRY_RANGES.heightCm)), height).toBe(calculateCrClReviewed('70', '80', 'M', '1', height) === null);
    const volume = { a: '4', b: '3', thicknessMm: '5', numSlices: '4' };
    for (const key of ['a', 'b', 'thicknessMm']) for (const value of ['-1', '0', '0.1', '4']) expect(flagged(entryIssue(value, ENTRY_RANGES[key])), `${key} ${value}`).toBe(encounterVolume({ ...volume, [key]: value }) === null);
    for (const value of ['0', '1', '2.5', '3']) expect(flagged(entryIssue(value, ENTRY_RANGES.numSlices)), value).toBe(encounterVolume({ ...volume, numSlices: value }) === null);
  });
  it('never flags an empty field', () => {
    for (const key of Object.keys(ENTRY_RANGES)) for (const value of ['', '  ', undefined, null]) expect(entryIssue(value, ENTRY_RANGES[key])).toBeUndefined();
  });
});

describe('Encounter fields name the entry the note does not use', () => {
  it('shows the range under the field, linked and marked invalid, and marks a used entry valid', () => {
    const html = render(make({ note: { ...acute, age: '250', glucose: '0', heartRate: '0', presentingBP: '500/90' } }));
    expect(hintFor(html, 'Age (years)')).toBe('Out of range: enter 0 to 120.');
    expect(attr(inputTag(html, 'Age (years)'), 'aria-invalid')).toBe('true');
    expect(hintFor(html, 'Glucose (mg/dL)')).toBe('Out of range: enter above 0, up to 2000.');
    expect(hintFor(html, 'Heart rate (beats/min)')).toBe('Out of range: enter above 0, up to 300.');
    expect(hintFor(html, 'Systolic BP (mmHg)')).toBe('Out of range: enter 1 to 400.');
    expect(attr(inputTag(html, 'Diastolic BP (mmHg)'), 'aria-invalid')).toBe('false');
    // A pediatric age is used by the note although adult screens reject it; glucose 0.5 is used although the
    // input's min is 1 (Chromium would otherwise report it invalid).
    const used = render(make({ note: { ...acute, age: '10', glucose: '0.5' } }));
    for (const label of ['Age (years)', 'Glucose (mg/dL)']) {
      expect(attr(inputTag(used, label), 'aria-invalid'), label).toBe('false');
      expect(hintFor(used, label), label).toBeNull();
    }
    const empty = render(make({ note: acute }));
    expect(empty).not.toContain('field-error');
    expect(attr(inputTag(empty, 'Age (years)'), 'aria-invalid')).toBeUndefined();
  });
  it('names an out-of-range weight in its unit and in the dose result', () => {
    const kg = render(make({ note: { ...acute, weight: '900' }, drug: 'TNK' }));
    expect(attr(inputTag(kg, 'Weight (kg)'), 'aria-describedby')).toBe('input-weight-error');
    expect(attr(inputTag(kg, 'Weight (kg)'), 'aria-invalid')).toBe('true');
    expect(kg).toContain('<small id="input-weight-error" class="field-error">Out of range: enter above 0, up to 350.</small>');
    expect(kg).toContain('No dose calculated: the weight entered (900 kg) is out of range.');
    // Weight must be above 0 although the input's min is 0.
    expect(render(make({ note: { ...acute, weight: '0' }, drug: 'Alteplase' }))).toContain('No dose calculated: the weight entered (0 kg) is out of range.');
    const lb = render(make({ note: { ...acute, weight: weightInKg('2000', 'lb') }, weightUnit: 'lb', weightEntry: '2000', drug: 'TNK' }));
    expect(lb).toContain('Out of range: enter above 0, up to 771.61.');
    expect(lb).toContain('No dose calculated: the weight entered (2000 lb) is out of range.');
    expect(render(make({ note: acute }))).toContain('Select a drug and enter weight.');
    const valid = render(make({ note: { ...acute, weight: '350' }, drug: 'TNK' }));
    expect(valid).not.toContain('input-weight-error');
    expect(valid).toContain('TNK 25 mg');
  });
  it('caps the pound field at the largest 0.01 lb entry the 350 kg dose limit accepts (logic-01)', () => {
    expect(weightLimit('lb')).toBe(771.61);
    expect(calculateTNKDoseReviewed(weightInKg('771.61', 'lb'), 'guideline')).not.toBeNull();
    expect(calculateTNKDoseReviewed(weightInKg('771.62', 'lb'), 'guideline')).toBeNull();
    const html = render(make({ note: { ...acute, weight: '350' }, weightUnit: 'lb' }));
    const tag = inputTag(html, 'Weight (lb)');
    expect(attr(tag, 'max')).toBe('771.61');
    // 350 kg displays as 771.62 lb; the stored kilograms are used, so the field is not reported invalid.
    expect(attr(tag, 'value')).toBe('771.62');
    expect(attr(tag, 'aria-invalid')).toBe('false');
    expect(attr(inputTag(render(make({ note: acute })), 'Weight (kg)'), 'max')).toBe('350');
  });
  it('leaves the generated note as it was', () => {
    const note = buildSummary(make({ note: { ...acute, age: '250', weight: '900', presentingBP: '500/90', glucose: '0' } }), now);
    for (const flag of ['[age 250 invalid; correct before interpretation]', '(Wt: [invalid; correct before interpretation])', '[BP 500/90 invalid; correct before interpretation]', '[0 invalid; correct before interpretation]']) expect(note).toContain(flag);
    expect(note).not.toContain('Out of range');
  });
});

describe('worksheet number fields name the entry the score does not use', () => {
  const S = () => ({ context: 'acute', note: { diagnosisCategory: 'tia', age: '59', sex: 'M', weight: '80', heightCm: '175' }, gcs: {}, dapt: {}, supplementary: {} });
  const fill = (state, id, values) => Object.entries(values).reduce((next, [key, value]) => updateSupplementaryField(next, id, key, value), state);
  const complete = {
    abcd2: { tiaConfirmed: true, initialSystolic: '400', initialDiastolic: '1', clinicalFeatures: 'other', duration: 'under10', diabetes: false },
    phases: { unrupturedSaccular: true, population: 'northAmericaEurope', hypertension: false, sizeMm: '5', earlierSAH: false, site: 'ica' },
    nascet: { side: 'left', minimumDiameterMm: '0.1', distalDiameterMm: '8', patentExtracranialICA: true, nearOcclusion: false },
    'stop-bang': { sb_snoring: false, sb_tired: false, sb_observed: false, sb_pressure: false, neckCm: '38' }
  };
  const probes = { initialSystolic: ['0', '0.5', '2', '400', '401', '4001'], initialDiastolic: ['0', '1', '300', '301'], sizeMm: ['-5', '0', '0.1', '200', '200.1'], minimumDiameterMm: ['-5', '0', '0.1', '8'], distalDiameterMm: ['-5', '0', '8'], neckCm: ['9', '10', '100', '100.5', '1001'] };
  const numeric = calculatorDefinitions.flatMap(definition => (definition.fields || []).filter(field => field.type === 'number').map(field => [definition.id, field.key, field]));
  it('covers every number field of every worksheet', () => expect(numeric.map(([id, key]) => `${id}.${key}`).sort()).toEqual(['abcd2.initialDiastolic', 'abcd2.initialSystolic', 'nascet.distalDiameterMm', 'nascet.minimumDiameterMm', 'phases.sizeMm', 'stop-bang.neckCm']));
  it.each(numeric)('%s %s', (id, key, field) => {
    expect(supplementaryResult(fill(S(), id, complete[id]), id), 'the complete worksheet scores').not.toBeNull();
    for (const value of probes[key]) expect(flagged(calculatorEntryIssue(field, value)), `${key} ${value}`).toBe(supplementaryResult(fill(S(), id, { ...complete[id], [key]: value }), id) === null);
  });
  const definition = id => calculatorDefinitions.find(item => item.id === id);
  it('names the field in the result status instead of counting it as answered', () => {
    expect(calculatorProgress(fill(S(), 'abcd2', { initialSystolic: '4001' }), definition('abcd2')).status).toBe('First BP after TIA: systolic (mmHg) out of range · 5 items unanswered');
    expect(calculatorProgress(fill(S(), 'abcd2', { ...complete.abcd2, initialSystolic: '4001' }), definition('abcd2')).status).toBe('First BP after TIA: systolic (mmHg) out of range');
    expect(calculatorProgress(fill(S(), 'stop-bang', { ...complete['stop-bang'], neckCm: '1001' }), definition('stop-bang')).status).toBe('Measured neck circumference (cm) out of range');
    expect(calculatorProgress(fill(S(), 'nascet', { ...complete.nascet, minimumDiameterMm: '-5' }), definition('nascet')).status).toBe('Minimum residual lumen diameter (mm) out of range');
    expect(calculatorProgress(fill(S(), 'abcd2', { ...complete.abcd2, initialSystolic: '139', initialDiastolic: '150' }), definition('abcd2')).status).toBe('Not scored: the first systolic BP must exceed the diastolic.');
    expect(calculatorProgress({ ...fill(S(), 'stop-bang', complete['stop-bang']), note: { ...S().note, weight: '900' } }, definition('stop-bang')).status).toBe('Not scored: Encounter weight must be above 0 and at most 350 kg.');
    expect(calculatorProgress({ ...fill(S(), 'stop-bang', complete['stop-bang']), note: { ...S().note, heightCm: '40' } }, definition('stop-bang')).status).toBe('Not scored: Encounter height must be 50 to 250 cm.');
  });
  it('shows the hint in the label block, linked and marked invalid', () => {
    const html = renderToStaticMarkup(<SupplementaryCalculators state={fill(S(), 'abcd2', { initialSystolic: '4001', initialDiastolic: '90' })} update={() => {}} tool="abcd2" definitions={calculatorDefinitions} />);
    expect(hintFor(html, 'First BP after TIA: systolic (mmHg)')).toBe('Out of range: enter 1 to 400.');
    expect(attr(inputTag(html, 'First BP after TIA: systolic (mmHg)'), 'aria-invalid')).toBe('true');
    expect(html).toMatch(/<span>First BP after TIA: systolic \(mmHg\)<small id="[^"]+" class="field-error">/);
    expect(attr(inputTag(html, 'First BP after TIA: diastolic (mmHg)'), 'aria-invalid')).toBeUndefined();
    expect(hintFor(html, 'First BP after TIA: diastolic (mmHg)')).toBeNull();
  });
});

describe('one elapsed-time format (ux-09)', () => {
  it('formats whole minutes, then hours with two-digit minutes, then days', () => {
    expect([0, 0.9, 30, 59.99, 60, 95, 125, 2879, 2880, 3024, -5].map(formatElapsed)).toEqual(['0 min', '0 min', '30 min', '59 min', '1 h 00 min', '1 h 35 min', '2 h 05 min', '47 h 59 min', '2.0 d', '2.1 d', '0 min']);
  });
  it.each([['10:25', '1 h 35 min'], ['11:30', '30 min']])('the case bar, the Encounter LKW result and the Trials banner agree (LKW %s)', (lkwTime, text) => {
    const state = make({ note: { diagnosisCategory: 'ich', lkwDate: '2026-10-01', lkwTime } });
    expect(caseSummary(state, now).elapsed).toBe(text);
    expect(render(state)).toContain(`LKW: ${text} elapsed. Remaining time is on the case bar.`);
    expect(screenerPrefillFromEncounter(state, now).summary).toContain(`LKW ${text}`);
  });
});

// ── In Chromium: the app shell built from source, as in tests/encounter-2026-10-21.test.jsx ──
const root = fileURLToPath(new URL('../', import.meta.url));
const ORIGIN = 'http://stroke.test/';
let browser, files, context, page, css, reference;
beforeAll(async () => {
  // The committed tailwind.css is regenerated at integration; the current shell sources (plain CSS) follow it.
  css = ['tailwind.css', 'src/design/tokens.css', 'src/design/shell.css'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  reference = fs.readFileSync(path.join(root, 'data/clinical-reference.json'), 'utf8');
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.inputs-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.inputs-test'), file.path).split(path.sep).join('/'), file.text]));
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });
async function open(hash = '#/encounter') {
  context = await browser.newContext({ serviceWorkers: 'block', timezoneId: 'America/Los_Angeles', locale: 'en-US', viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.route(`${ORIGIN}**`, route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="tailwind.css"></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (relative === 'tailwind.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (relative.startsWith('data/clinical-reference.json')) return route.fulfill({ contentType: 'application/json', body: reference });
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.clock.setFixedTime(new Date('2026-10-21T10:00:00-07:00'));
  await page.goto(`${ORIGIN}${hash}`);
}
const field = label => page.locator('#tabpanel-encounter').getByLabel(label, { exact: true }).first();
// What a screen reader gets: the accessibility tree's invalid state and description for one element.
async function accessible(selector) {
  const cdp = await context.newCDPSession(page);
  const { root: doc } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector });
  const [node] = (await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes;
  return { invalid: node.properties?.find(property => property.name === 'invalid')?.value?.value === 'true', description: node.description?.value || '' };
}

describe('number entries in the running Encounter', { timeout: 60000 }, () => {
  it('names an out-of-range entry as it is typed and clears it when corrected', async () => {
    await open();
    await page.locator('#input-age').waitFor();
    await page.fill('#input-age', '250');
    expect(await accessible('#input-age')).toEqual({ invalid: true, description: 'Out of range: enter 0 to 120.' });
    expect(await page.locator('#context .field-error').innerText()).toBe('Out of range: enter 0 to 120.');
    await page.fill('#input-age', '25');
    expect(await accessible('#input-age')).toEqual({ invalid: false, description: '' });
    expect(await page.locator('#context .field-error').count()).toBe(0);
    // Glucose 0.5 is used by the note although the input's min is 1: Chromium alone would report it invalid.
    await page.fill('#input-glucose', '0.5');
    expect(await accessible('#input-glucose')).toEqual({ invalid: false, description: '' });
    await page.fill('#input-glucose', '0');
    expect(await accessible('#input-glucose')).toEqual({ invalid: true, description: 'Out of range: enter above 0, up to 2000.' });
  });
  it('checks pounds against the 350 kg limit and names the weight in the dose result', async () => {
    await open();
    await field('Working diagnosis').selectOption('ischemic');
    await field('Selected IV thrombolytic').selectOption('TNK');
    await page.locator('.unit-toggle label', { hasText: 'lb' }).click();
    await page.fill('#input-weight', '771.62');
    expect(await page.locator('#input-weight-error').innerText()).toBe('Out of range: enter above 0, up to 771.61.');
    expect(await accessible('#input-weight')).toEqual({ invalid: true, description: 'Out of range: enter above 0, up to 771.61.' });
    expect(await page.locator('#calc-alteplase').innerText()).toBe('No dose calculated: the weight entered (771.62 lb) is out of range.');
    await page.fill('#input-weight', '771.61');
    expect(await page.locator('#input-weight-error').count()).toBe(0);
    expect(await page.locator('#calc-alteplase').innerText()).toMatch(/^TNK 25 mg/);
    // The hint sits under the input and its unit toggle, which stays level with the input.
    await page.fill('#input-weight', '-1');
    const [input, toggle, hint] = await Promise.all(['#input-weight', '.unit-toggle', '#input-weight-error'].map(selector => page.locator(selector).boundingBox()));
    expect(Math.abs(input.y + input.height - (toggle.y + toggle.height))).toBeLessThan(12);
    expect(hint.y).toBeGreaterThanOrEqual(input.y + input.height);
  });
  it('keeps each caution\'s status region mounted, so only its text changes (a11y-06)', async () => {
    await open();
    await field('Working diagnosis').selectOption('ischemic');
    await page.locator('#tabpanel-encounter').getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
    const mark = () => page.evaluate(() => document.querySelectorAll('#tabpanel-encounter [role="status"]').forEach(node => node.setAttribute('data-mounted-before', '')));
    const regionExisted = text => page.locator('#tabpanel-encounter').getByText(text).first().evaluate(node => node.closest('[role="status"]')?.hasAttribute('data-mounted-before') ?? false);
    await mark();
    await page.fill('#input-sbp', '230'); await page.fill('#input-dbp', '130');
    await page.fill('#input-glucose', '30');
    await field('Selected IV thrombolytic').selectOption('TNK'); await page.fill('#input-weight', '8');
    for (const text of ['Not below 185/110 (pre-IVT)', 'Glucose outside 50–400 mg/dL', 'Dose calculation: Weight below 30 kg', 'Inputs changed since the preview.']) expect(await regionExisted(text), text).toBe(true);
    await page.fill('#input-sbp', '120'); await page.fill('#input-dbp', '130');
    expect(await regionExisted('Check BP order'), 'Check BP order').toBe(true);
    // The caution texts are not live regions of their own (no nested status regions).
    expect(await page.locator('#tabpanel-encounter [role="status"] [role="status"]').count()).toBe(0);
    await field('Working diagnosis').selectOption('ich');
    await mark();
    for (const [label, value] of [['A: largest diameter (cm)', '4'], ['B: perpendicular diameter (cm)', '3'], ['Slice thickness (mm)', '1'], ['Number of hematoma slices', '2']]) await field(label).fill(value);
    expect(await regionExisted('The ICH score volume point is unconfirmed'), 'ABC/2 thickness').toBe(true);
    await field('Slice thickness (mm)').fill('10'); await field('Number of hematoma slices').fill('3');
    expect(await regionExisted('Surgical triggers'), 'neurosurgery').toBe(true);
  });
  it('names an out-of-range worksheet entry and states it in the result', async () => {
    await open('#/tools/abcd2');
    const systolic = page.getByLabel('First BP after TIA: systolic (mmHg)', { exact: true });
    await systolic.fill('4001');
    expect(await accessible('#calc-abcd2 input[aria-label="First BP after TIA: systolic (mmHg)"]')).toEqual({ invalid: true, description: 'Out of range: enter 1 to 400.' });
    expect(await page.locator('#calc-abcd2').getByRole('status').innerText()).toContain('First BP after TIA: systolic (mmHg) out of range · 5 items unanswered');
    await systolic.fill('140');
    expect(await accessible('#calc-abcd2 input[aria-label="First BP after TIA: systolic (mmHg)"]')).toEqual({ invalid: false, description: '' });
  });
});
