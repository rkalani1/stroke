// Round-3 verification fixes, 2026-10-22 (unit: shell-search). Search findings first (one shared
// normalizer and alias table for Evidence, global search and the Calculators filter; short-term
// matching; exact-alias ranking; bottom lines), then the Evidence counts, and the shell in Chromium
// (offline wording, first-session offline reference, search index failure, focus visibility).
// Expected values come from the alias definitions, the archived source types, WCAG 2.4.3/2.4.7/
// 2.4.11/4.1.3 and the stated behaviour, not from the implementation's output.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { normalizeSearch, searchReference, bottomLine, recommendationGroups, recommendationLabels, referenceText } from '../src/reference-search.js';
import { buildSearchIndex, searchIndex, groupResults } from '../src/quick-search-index.js';
import { ENCOUNTER_TOOLS, matchesCalculatorSearch } from '../src/calculator-utilities.js';
import { SEARCH_TRIALS } from '../src/components/QuickSearch.jsx';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const envelope = JSON.parse(read('data/clinical-reference.json'));
const data = envelope.data;
const index = buildSearchIndex({ ...data, trials: [] });
const ids = query => searchIndex(index, query, Infinity).map(record => record.id);
const evidenceIds = (records, query) => searchReference(records, query).map(record => record.id);
const calculators = [...ENCOUNTER_TOOLS, ...data.calculators];
const calculatorIds = query => calculators.filter(item => matchesCalculatorSearch(item, query)).map(item => item.id);

describe('one search normalizer and alias table', () => {
  it.each([
    ['AFib', 'atrial fibrillation'], ['A-fib', 'atrial fibrillation'], ['a fib', 'atrial fibrillation'], ['AF', 'atrial fibrillation'],
    ['rt-PA', 'alteplase'], ['t-PA', 'alteplase'], ['tPA', 'alteplase'], ['TNKase', 'tenecteplase'],
    ['DOACs', 'direct oral anticoagulant'], ['direct oral anticoagulants', 'direct oral anticoagulant'], ['NOAC', 'direct oral anticoagulant'],
    ['LVO', 'large vessel occlusion'], ['EVT', 'thrombectomy'], ['IVT', 'thrombolysis'],
    ['obstructive sleep apnea', 'sleep apnea'], ['sleep apnoea', 'sleep apnea'], ['OSA', 'sleep apnea'],
    ['ABC/2', 'abc2'], ['abc 2', 'abc2'], ['CHA₂DS₂', 'cha2ds2'], ['ABCD²', 'abcd2']
  ])('reads %s as %s', (query, expected) => {
    expect(normalizeSearch(query)).toBe(expected);
  });
  it('rewrites whole words only', () => {
    expect(normalizeSearch('after safe afibbed')).toBe('after safe afibbed');
    expect(normalizeSearch('fibromuscular dysplasia')).toBe('fibromuscular dysplasia');
    expect(normalizeSearch('obstructive hydrocephalus')).toBe('obstructive hydrocephalus');
  });
});

describe('global search uses the Evidence aliases', () => {
  it.each([
    ['rt-PA dose', 'alteplase dose'], ['t-PA', 'alteplase'], ['DOAC reversal', 'direct oral anticoagulant reversal'],
    ['DOACs', 'direct oral anticoagulants'], ['LVO', 'large vessel occlusion'], ['TNK', 'tenecteplase'], ['AFib', 'atrial fibrillation'],
    ['OSA', 'obstructive sleep apnea'], ['sleep apnoea', 'sleep apnea']
  ])('%s and %s return the same results', (abbreviation, spelled) => {
    const results = ids(abbreviation);
    expect(results.length).toBeGreaterThan(0);
    expect(results).toEqual(ids(spelled));
  });
  it('finds the relevant tools for the spelled-out forms', () => {
    expect(ids('rt-PA dose')).toEqual(expect.arrayContaining(['tool:tnk', 'protocol:qr-dose']));
    expect(ids('rt-PA dose')).not.toContain('study:trident');
    expect(ids('direct oral anticoagulant reversal')).toContain('protocol:qr-reversal');
    expect(ids('large vessel occlusion')).toContain('protocol:evt');
    expect(ids('obstructive sleep apnea')).toContain('calc:stop-bang');
  });
  it('ranks the exact ABC/2 alias above the ABCD² title prefix, so Enter opens ICH volume', () => {
    for (const query of ['ABC/2', 'abc 2', 'abc2']) {
      const results = searchIndex(index, query, Infinity);
      expect(results[0].id, query).toBe('tool:ich-volume');
      const [, lead] = groupResults(results)[0];
      expect(lead[0].href).toBe('#/encounter/ich-volume');
    }
    expect(ids('ABCD2')[0]).toBe('calc:abcd2');
  });
  it('ranks an exact name or alias above records matched only through word prefixes', () => {
    // Each prefix-only record matches every term, at word starts of its title, and would win on score.
    const synthetic = buildSearchIndex({ calculators: [
      { id: 'prefix-only', name: 'Zetaline omegas scales worksheet', category: 'Synthetic' },
      { id: 'exact-alias', name: 'Synthetic omega tool', category: 'Synthetic', aliases: 'Zeta omega scale' },
      { id: 'short-prefix', name: 'XYQZ worksheet', category: 'Synthetic' },
      { id: 'short-alias', name: 'Synthetic tool', category: 'Synthetic', aliases: 'XYQ' }
    ] });
    for (const [query, expected, other] of [['zeta omega scale', 'calc:exact-alias', 'calc:prefix-only'], ['XYQ', 'calc:short-alias', 'calc:short-prefix']]) {
      const results = searchIndex(synthetic, query, Infinity);
      expect(results.map(record => record.id), query).toEqual([expected, other]);
      expect(groupResults(results)[0][1][0].id, query).toBe(expected);
    }
  });
  it('keeps navigation first for exact matches, but never over a better match', () => {
    const lead = query => groupResults(searchIndex(index, query, Infinity))[0][1][0].id;
    // Navigation records that hold the query as whole words still lead (the protocol-first design).
    expect(lead('large vessel occlusion')).toBe('protocol:evt');
    expect(lead('LVO')).toBe('protocol:evt');
    expect(lead('intracerebral hemorrhage')).toBe('nav:Protocols · Intracerebral hemorrhage');
    expect(lead('ICH score')).toBe('tool:ich-score');
    expect(lead('NIHSS')).toBe('tool:nihss');
    // A navigation record matched only inside words ("tension" in hypertension, "extend" in
    // extended) or by scattered words ("direct" from DOAC, "thrombectomy" from EVT) does not.
    expect(lead('TENSION')).not.toBe('protocol:bp');
    expect(lead('EXTEND')).toBe('study:extend');
    expect(lead('DIRECT-MT')).toBe('study:direct-mt');
    expect(lead('TRACE-2')).toBe('study:trace-2');
  });
  it('Calculators and Evidence give the same honest message when the reference cannot load (lead follow-up)', () => {
    for (const file of ['src/Tools.jsx', 'src/Reference.jsx']) expect(read(file)).toContain('this browser has no offline copy of this version. If offline, reconnect, then retry; Encounter entries stay in this session.');
  });
  it('opens the post-treatment card for "after" phrases and keeps in-word abbreviations findable (lead follow-up)', () => {
    const lead = query => groupResults(searchIndex(index, query, Infinity))[0][1][0].id;
    // 'after' is a filler word, so "after thrombolysis" tied the contraindications card on 'thrombolysis' alone.
    expect(normalizeSearch('after tPA')).toBe('post alteplase');
    expect(lead('after thrombolysis')).toBe('protocol:qr-sich');
    expect(lead('after EVT')).toBe('protocol:post-evt');
    // Protocol keywords carry the abbreviations clinicians type.
    expect(lead('BAO')).toBe('protocol:posterior');
    expect(['protocol:bp', 'protocol:qr-bp']).toContain(lead('SBP'));
    // Word-start matching would miss NT-proBNP (ARCADIA), HMCAS and tDCS; the prefixed aliases keep them.
    expect(evidenceIds([...data.topics, ...data.studies], 'BNP')).toContain('arcadia');
    expect(evidenceIds([...data.topics, ...data.studies], 'MCA')).toEqual(expect.arrayContaining(['acute-reperfusion', 'large-core-evt']));
    expect(evidenceIds([...data.topics, ...data.studies], 'DCS')).toContain('aphasia');
  });
  it('keeps the protocol first when a study or topic only holds the query among its words, not as its name', () => {
    // Shipped data plus the Trials database records, as the search dialog builds them. Each protocol
    // matches every word whole; INTERACT2, ENCHANTED2/MT, HOPE, RESCUE-Japan LIMIT and the reversal
    // topic hold the words as a phrase and rank first, but none is named by the query.
    const screened = buildSearchIndex({ ...data, trials: SEARCH_TRIALS });
    const lead = query => groupResults(searchIndex(screened, query, Infinity))[0][1][0].id;
    expect(searchIndex(screened, 'ICH blood pressure', 1)[0].id).toBe('study:interact2');
    for (const [query, expected] of [
      ['ICH blood pressure', 'protocol:qr-bp'], ['ICH reversal', 'protocol:qr-reversal'], ['post EVT BP', 'protocol:qr-bp'],
      ['EVT BP', 'protocol:qr-bp'], ['blood pressure post EVT', 'protocol:post-evt'], ['ASPECTS EVT', 'protocol:evt'],
      ['IVT hemorrhage', 'protocol:post-lytic'], ['extended window IVT', 'protocol:ivt-card'],
      // Filler words aside, the MeVO protocol holds the topic's whole name among its keywords.
      ['Medium and distal vessel occlusion', 'protocol:mevo']
    ]) expect(lead(query), query).toBe(expected);
    // A record whose title is the query, or begins with it, still leads.
    expect(lead('DIRECT-MT')).toBe('study:direct-mt');
    expect(lead('CT perfusion')).toBe('topic:ct-perfusion');
    expect(lead('EXTEND')).toBe('study:extend');
  });
  it('lets a named record lead over a protocol, but not a record that holds the query elsewhere in its title or keywords', () => {
    // Both synthetic studies outrank the BP card, which holds ICH and blood pressure apart.
    const lead = study => groupResults(searchIndex(buildSearchIndex({ studies: [study] }), 'ICH blood pressure', Infinity))[0][1][0].id;
    expect(lead({ id: 'keyword-phrase', title: 'ZETA-1 — acute ICH blood pressure lowering', keywords: ['ICH blood pressure'] })).toBe('protocol:qr-bp');
    expect(lead({ id: 'named', title: 'ICH blood pressure registry', keywords: [] })).toBe('study:named');
  });
  it('matches short letter-only terms at word starts, so TIA skips "initiation" and AF skips "after"', () => {
    const synthetic = buildSearchIndex({ topics: [
      { id: 'inside-words', title: 'Initiation', category: 'Synthetic', keywords: ['potential'], summary: 'Started after a safe interval.' },
      { id: 'whole-words', title: 'Follow-up', category: 'Synthetic', keywords: ['TIA'], summary: 'AF detected on monitoring.' }
    ] });
    const topics = query => searchIndex(synthetic, query).filter(record => record.group === 'Evidence').map(record => record.id);
    expect(topics('TIA')).toEqual(['topic:whole-words']);
    expect(topics('AF')).toEqual(['topic:whole-words']);
    // Identifiers with digits and longer terms still match inside words ("TR-2", type-ahead).
    expect(ids('tr2')).toEqual([]);
    expect(searchIndex(buildSearchIndex({ trials: [{ acronym: 'TELE-REHAB-2', keywords: 'TR-2' }] }), 'tr2').map(record => record.id)).toContain('trial:TELE-REHAB-2');
    expect(ids('thromb').length).toBeGreaterThan(0);
  });
});

describe('Evidence search', () => {
  it('treats AF, A-fib and AFib as atrial fibrillation', () => {
    const expected = evidenceIds(data.topics, 'atrial fibrillation');
    expect(expected).toEqual(expect.arrayContaining(['af-timing', 'af-prevention']));
    for (const query of ['AF', 'A-fib', 'AFib', 'af']) expect(evidenceIds(data.topics, query), query).toEqual(expected);
    expect(evidenceIds(data.topics, 'A-fib')).not.toContain('fibromuscular-dysplasia');
  });
  it('matches TIA and other short terms only at word starts', () => {
    const records = [
      { id: 'inside-words', title: 'Initiation timing', keywords: [], settings: ['hospital'], sources: [], summary: 'The potential benefit after a safe delay.' },
      { id: 'whole-words', title: 'Follow-up', keywords: [], settings: ['hospital'], sources: [], summary: 'After TIA, AF monitoring.' }
    ];
    expect(evidenceIds(records, 'TIA')).toEqual(['whole-words']);
    expect(evidenceIds(records, 'AF')).toEqual(['whole-words']);
    expect(evidenceIds(records, 'thr')).toEqual([]);
    expect(evidenceIds(records, 'init')).toEqual(['inside-words']);
    // Every shipped topic that matches "TIA" names TIA as a word.
    for (const topic of searchReference(data.topics, 'TIA')) expect(JSON.stringify(topic), topic.id).toMatch(/\bTIAs?\b|transient ischa?emic attack/i);
  });
  it('still finds prefixed abbreviations (sICH, aSAH, SBP/DBP, NCCT) by their base abbreviation', () => {
    // sICH is symptomatic ICH, aSAH aneurysmal SAH, SBP/DBP systolic/diastolic BP, NCCT non-contrast CT.
    for (const [base, prefixed] of [['ICH', /\bsICH\b/], ['SAH', /\baSAH\b/], ['BP', /\b[SD]BP\b/], ['CT', /\bNCCT\b/]]) {
      for (const set of ['topics', 'studies']) {
        const holders = data[set].filter(record => prefixed.test(JSON.stringify(record))).map(record => record.id);
        expect(evidenceIds(data[set], base), `${base} ${set}`).toEqual(expect.arrayContaining(holders));
      }
    }
    expect(data.topics.some(record => /\bsICH\b/.test(JSON.stringify(record)))).toBe(true);
    // The prefixed query stays specific: every "sICH" result names sICH.
    for (const topic of searchReference(data.topics, 'sICH')) expect(JSON.stringify(topic), topic.id).toMatch(/\bsICH\b|symptomatic (?:intracranial|intracerebral) h(?:a)?emorrhage/i);
    expect(normalizeSearch('ACT')).toBe('act');
  });
});

describe('Calculators filter shares the normalizer', () => {
  it.each([
    ['afib', ['chadsvasc', 'has-bled']], ['a-fib', ['chadsvasc', 'has-bled']], ['AF', ['chadsvasc', 'has-bled']],
    ['obstructive sleep apnea', ['stop-bang']], ['sleep apnoea', ['stop-bang']], ['OSA', ['stop-bang']],
    ['ABC/2', ['ich-volume']], ['CHA₂DS₂', ['chadsvasc']], ['cha2ds2', ['chadsvasc']], ['chadsvasc', ['chadsvasc']], ['stopbang', ['stop-bang']]
  ])('%s finds %j', (query, expected) => {
    expect(calculatorIds(query)).toEqual(expected);
  });
  it('keeps partial abbreviations and the empty query working', () => {
    expect(calculatorIds('tn')).toEqual(['tnk']);
    expect(calculatorIds('')).toHaveLength(calculators.length);
    expect(calculatorIds('unmatched tool')).toEqual([]);
  });
});

describe('bottom lines keep abbreviations whole', () => {
  it.each([
    ['Andexanet was withdrawn from the US market effective Dec. 22, 2025, so use 4F-PCC for factor Xa inhibitor ICH. Next.', 'Andexanet was withdrawn from the US market effective Dec. 22, 2025, so use 4F-PCC for factor Xa inhibitor ICH.'],
    ['Approx. 40% of patients with TIA have DWI lesions, which makes it a stroke. Next.', 'Approx. 40% of patients with TIA have DWI lesions, which makes it a stroke.'],
    ['Seen on Sept. 3 and again on Jan. 9 in clinic. Next.', 'Seen on Sept. 3 and again on Jan. 9 in clinic.'],
    ['See Ref. 12 for the methods. Then dose.', 'See Ref. 12 for the methods.'],
    ['Give IVT within 4.5 h of onset. Then reassess.', 'Give IVT within 4.5 h of onset.'],
    // An all-capital acronym is not an abbreviation, so it still ends the sentence.
    ['Bridging IVT is reasonable before MT. Then image.', 'Bridging IVT is reasonable before MT.'],
    ['Refer to PT. Then review.', 'Refer to PT.'],
    ['Is it a stroke? Image now.', 'Is it a stroke?']
  ])('%s', (text, expected) => {
    expect(bottomLine(text)).toBe(expected);
  });
});

describe('Evidence counts ungraded statements apart from graded recommendations', () => {
  const topic = id => data.topics.find(record => record.id === id);
  it('reads the TIA and CVT cards as ungraded scientific-statement items', () => {
    // Both sources are AHA scientific statements (archived tia-ed-2023 and cvt-2024: classOfRec "Statement", LOE "Ungraded").
    for (const id of ['tia-evaluation', 'cvt']) {
      const recs = topic(id).recommendations;
      expect(recs.every(rec => recommendationLabels(rec).cor === 'Ungraded statement')).toBe(true);
      expect(recommendationGroups(recs)).toEqual({ graded: 0, ungraded: recs.length, heading: 'Ungraded statements' });
      expect(referenceText(topic(id))).toContain('Ungraded statements:\n');
      expect(referenceText(topic(id))).not.toContain('Guideline recommendations');
    }
  });
  it('heads graded-only and mixed lists accordingly', () => {
    const graded = data.topics.find(record => record.recommendations?.length && record.recommendations.every(rec => rec.cor !== 'Statement'));
    expect(recommendationGroups(graded.recommendations)).toEqual({ graded: graded.recommendations.length, ungraded: 0, heading: 'Guideline recommendations' });
    expect(recommendationGroups([{ cor: '1' }, { cor: 'Statement' }, { cor: 'Conditional' }])).toEqual({ graded: 2, ungraded: 1, heading: 'Guideline recommendations and statements' });
  });
});

// ── The shell in Chromium, built from source like tests/design-2026-10-21.test.jsx ──
let browser, files, css, context, page;
// localhost is a secure context (Cache Storage and a service-worker container); every request is routed.
const ORIGIN = 'http://localhost:4314/';
beforeAll(async () => {
  const result = await build({
    absWorkingDir: root, entryPoints: ['src/app.jsx'], bundle: true, format: 'esm', splitting: true, write: false,
    outdir: path.join(root, '.shell-search-test'), chunkNames: 'chunks/[name]-[hash]', target: 'es2020',
    jsxFactory: 'createElement', inject: [path.join(root, 'src/jsx-factory.js')], charset: 'utf8',
    define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }, logLevel: 'silent'
  });
  files = new Map(result.outputFiles.map(file => [path.relative(path.join(root, '.shell-search-test'), file.path).split(path.sep).join('/'), file.text]));
  css = [read('tailwind.css'), read('src/design/tokens.css'), read('src/design/shell.css')].join('\n');
  browser = await chromium.launch();
}, 120000);
afterEach(async () => { await context?.close(); context = null; });
afterAll(async () => { await browser?.close(); });

const poll = check => expect.poll(check, { timeout: 10000, interval: 50 });
// reference: 'ok' | 'fail' (connection refused) | 'error' (HTTP 503) | a function returning a promise of either.
async function open(hash = '#/encounter', { viewport = { width: 1280, height: 900 }, reference = 'ok', init } = {}) {
  context = await browser.newContext({ serviceWorkers: 'block', viewport });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  if (init) await page.addInitScript(init);
  const state = { reference };
  await page.route(`${ORIGIN}**`, async route => {
    const relative = new URL(route.request().url()).pathname.slice(1);
    if (relative === '' || relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="tailwind.css"></head><body><div id="root"></div><script type="module" src="app.js"></script></body></html>' });
    if (relative === 'tailwind.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (relative.startsWith('data/clinical-reference.json')) {
      const mode = typeof state.reference === 'function' ? await state.reference() : state.reference;
      if (mode === 'fail') return route.abort('connectionrefused');
      if (mode === 'error') return route.fulfill({ status: 503, body: 'Unavailable' });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(envelope) });
    }
    if (files.has(relative)) return route.fulfill({ contentType: 'text/javascript', body: files.get(relative) });
    return route.fulfill({ status: 404, body: 'Not found' });
  });
  await page.goto(`${ORIGIN}${hash}`);
  await page.locator('#tabpanel-encounter').waitFor({ state: 'attached' });
  return state;
}
const showCaseBar = async () => { await page.fill('#input-weight', '70'); await page.locator('.case-bar').waitFor(); };
const go = hash => page.evaluate(value => { location.hash = value; }, hash);

describe('shell fixes in Chromium', { timeout: 90000 }, () => {
  it('counts the TIA and CVT statements as ungraded, collapsed and open', async () => {
    await open('#/evidence');
    const tia = page.locator('[data-reference-id="tia-evaluation"]');
    await tia.waitFor();
    expect(await tia.locator('.reference-contents').textContent()).toMatch(/^3 ungraded statements( · |$)/);
    expect(await tia.locator('.reference-contents').textContent()).not.toMatch(/guideline recommendation/);
    await page.locator('[data-reference-id="cvt"] > summary').click();
    const recs = page.locator('[data-reference-id="cvt"] .reference-recs');
    expect(await recs.getAttribute('aria-label')).toBe('Ungraded statements for Cerebral venous thrombosis');
    expect(await recs.locator('h3').textContent()).toBe('Ungraded statements');
    expect(await recs.locator('.reference-chip').allTextContents()).toEqual(['Ungraded statement', 'Ungraded statement', 'Ungraded statement']);
    // A graded topic keeps its wording.
    const graded = data.topics.find(record => record.recommendations?.length && record.recommendations.every(rec => rec.cor !== 'Statement'));
    const n = graded.recommendations.length;
    expect(await page.locator(`[data-reference-id="${graded.id}"] .reference-contents`).textContent()).toMatch(new RegExp(`^${n} guideline recommendations?( · |$)`));
  });

  it('says "the workspace still works" offline only in a tab the service worker controls', async () => {
    // Uncontrolled (service workers blocked: the same state as a first visit or a hard reload).
    await open('#/encounter');
    const banner = page.locator('.workspace-offline');
    expect(await banner.textContent()).toBe('');
    const more = page.locator('.utility-panel p[role="status"]');
    await context.setOffline(true);
    await poll(() => banner.textContent()).toBe(`Offline · ${await more.textContent()}`);
    expect(await banner.textContent()).not.toMatch(/still works/);
    await context.setOffline(false);
    await poll(() => banner.textContent()).toBe('');
    await context.close();
    // Controlled: the precached screens are available, so the workspace does still work.
    await open('#/encounter', { init: () => { if (navigator.serviceWorker) Object.defineProperty(navigator.serviceWorker, 'controller', { get: () => ({ state: 'activated' }) }); } });
    await context.setOffline(true);
    await poll(() => page.locator('.workspace-offline').textContent()).toBe('Offline · the workspace still works; external and source links need internet');
  });

  it('uses the precached reference when the first-visit tab is offline, and says so when there is none', async () => {
    await open('#/encounter', { reference: 'fail' });
    await page.evaluate(async body => { const cache = await caches.open('stroke-cache-v-test'); await cache.put('./data/clinical-reference.json', new Response(body, { headers: { 'Content-Type': 'application/json' } })); }, JSON.stringify(envelope));
    await go('#/evidence');
    await page.locator('[data-reference-id="tia-evaluation"]').waitFor();
    expect(await page.locator('.reference-card').count()).toBeGreaterThanOrEqual(data.topics.length);
    await go('#/tools');
    await page.getByRole('heading', { level: 1, name: 'Calculators', exact: true }).waitFor();
    await page.getByText('STOP-BANG').first().waitFor();
    expect(await page.getByText('Calculators unavailable').count()).toBe(0);
    await context.close();
    // A cached copy of another version is never used.
    await open('#/encounter', { reference: 'fail' });
    await page.evaluate(async body => { const cache = await caches.open('stroke-cache-v-old'); await cache.put('./data/clinical-reference.json', new Response(body)); }, JSON.stringify({ ...envelope, _meta: { ...envelope._meta, appVersion: '0.0.1' } }));
    await go('#/evidence');
    const alert = page.locator('.reference-surface[role="alert"]');
    await alert.waitFor();
    expect(await alert.textContent()).toMatch(/no offline copy of this version.+If offline, reconnect, then retry; Encounter entries stay in this session/);
    expect(await page.locator('.reference-card').count()).toBe(0);
  });

  it('never reports an unavailable or loading Evidence index as "No matches"', async () => {
    const state = await open('#/encounter', { reference: 'error' });
    await page.keyboard.press('Control+k');
    const input = page.locator('dialog.quick-search input');
    await input.waitFor();
    const hint = page.locator('.quick-search__hint');
    const status = page.locator('.quick-search p.sr-only[role="status"]');
    await poll(() => hint.textContent()).toMatch(/^Evidence index unavailable: evidence, studies and calculator worksheets were not searched\./);
    expect(await status.textContent()).toBe('Evidence index unavailable: evidence, studies and calculator worksheets were not searched');
    await input.fill('moyamoya');
    await poll(() => hint.textContent()).toMatch(/^No matches\. Evidence index unavailable: evidence, studies and calculator worksheets were not searched\./);
    expect(await status.textContent()).toBe('No matches; Evidence index unavailable: evidence, studies and calculator worksheets were not searched');
    await input.fill('NIHSS');
    await poll(() => status.textContent()).toMatch(/^\d+ results?; Evidence index unavailable/);
    expect(await hint.textContent()).not.toMatch(/No matches/);
    // Retry recovers without a reload and returns focus to the field.
    state.reference = 'ok';
    await input.fill('moyamoya');
    await page.getByRole('button', { name: 'Retry evidence download' }).click();
    await poll(() => status.textContent()).toMatch(/^\d+ results?$/);
    expect(await page.locator('.quick-search__option').first().textContent()).toMatch(/moyamoya/i);
    expect(await hint.count()).toBe(0);
    expect(await page.evaluate(() => document.activeElement?.matches('dialog.quick-search input'))).toBe(true);
    await context.close();
    // Still loading: say so instead of "No matches".
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    await open('#/encounter', { reference: () => pending.then(() => 'ok') });
    await page.keyboard.press('Control+k');
    await page.locator('dialog.quick-search input').fill('moyamoya');
    await poll(() => page.locator('.quick-search__hint').textContent()).toBe('No matches. Evidence index still loading.');
    expect(await page.locator('.quick-search p.sr-only[role="status"]').textContent()).toBe('No matches; Evidence index still loading');
    release();
    await poll(() => page.locator('.quick-search p.sr-only[role="status"]').textContent()).toMatch(/^\d+ results?$/);
  });

  it('keeps the whole focus outline of the external links clear of the case bar', async () => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) {
      await open('#/encounter', { viewport });
      await showCaseBar();
      for (const name of ['Telestroke Map', 'UpToDate', 'OpenEvidence']) {
        await page.getByRole('link', { name }).focus();
        const geometry = await page.evaluate(() => {
          const link = document.activeElement, box = link.getBoundingClientRect(), style = getComputedStyle(link);
          return { outlineBottom: box.bottom + parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth), outlineWidth: parseFloat(style.outlineWidth), bar: document.querySelector('.case-bar').getBoundingClientRect().top };
        });
        expect(geometry.outlineWidth, `${name} ${viewport.width}`).toBeGreaterThan(0);
        expect(geometry.outlineBottom, `${name} ${viewport.width}`).toBeLessThanOrEqual(geometry.bar);
      }
      await context.close();
    }
  });

  it('brings a Tab-focused Encounter text area fully above the docked nav and the update notice', async () => {
    const check = async (bottomEdge, label) => {
      await page.evaluate(() => { for (const details of document.querySelectorAll('#tabpanel-encounter details:not([open])')) details.open = true; window.scrollTo(0, 0); document.getElementById('input-weight').focus(); });
      let seen = 0;
      const hidden = [];
      for (let i = 0; i < 400 && seen < 12; i += 1) {
        await page.keyboard.press('Tab');
        const stop = await page.evaluate(edge => {
          const el = document.activeElement;
          if (el.tagName !== 'TEXTAREA') return null;
          const box = el.getBoundingClientRect(), limit = edge === 'notice' ? document.querySelector('aside.workspace-update').getBoundingClientRect().top : document.querySelector('.workspace-secondary').getBoundingClientRect().top;
          return { label: el.getAttribute('aria-label'), bottom: box.bottom, top: box.top, limit, bar: document.querySelector('.case-bar').getBoundingClientRect().bottom };
        }, bottomEdge);
        if (!stop) continue;
        seen += 1;
        // The 2 px focus outline sits 3 px outside the field, so 5 px must stay clear.
        if (stop.bottom + 5 > stop.limit || stop.top < stop.bar) hidden.push(stop);
      }
      expect(seen, label).toBeGreaterThanOrEqual(8);
      expect(hidden, label).toEqual([]);
    };
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await open('#/encounter', { viewport });
      await showCaseBar();
      await check('nav', `nav ${viewport.width}`);
      await context.close();
    }
    await open('#/encounter', { viewport: { width: 390, height: 844 } });
    await showCaseBar();
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'sw-update-ready' } })));
    await page.locator('aside.workspace-update').waitFor();
    await check('notice', 'update notice');
    // The frozen Protocols tab keeps its own behaviour: a Tab keyup on its text area scrolls nothing.
    await go('#/protocols/ischemic');
    const field = page.locator('#tabpanel-protocols textarea').first();
    await field.waitFor({ state: 'attached' });
    const moved = await field.evaluate(el => {
      el.closest('details')?.setAttribute('open', '');
      window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - innerHeight + 40));
      const before = window.scrollY;
      el.focus({ preventScroll: true });
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', bubbles: true }));
      return window.scrollY - before;
    });
    expect(moved).toBe(0);
  });

  it('keeps a Tab-focused tall Evidence row title below the case bar on a short screen', async () => {
    for (const viewport of [{ width: 568, height: 320 }, { width: 667, height: 375 }]) {
      await open('#/encounter', { viewport });
      await showCaseBar();
      await go('#/evidence');
      await page.locator('.reference-card > summary').first().waitFor();
      await page.locator('.reference-filters input[type="search"]').focus();
      const hidden = [];
      let rows = 0, tall = 0;
      for (let i = 0; i < 160 && rows < 40; i += 1) {
        await page.keyboard.press('Tab');
        const row = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el.matches('.reference-card > summary')) return null;
          const title = el.firstElementChild.getBoundingClientRect(), root = getComputedStyle(document.documentElement);
          return { title: el.firstElementChild.textContent, top: title.top, bar: document.querySelector('.case-bar').getBoundingClientRect().bottom, tall: el.offsetHeight > innerHeight - parseFloat(root.scrollPaddingTop) - (parseFloat(root.scrollPaddingBottom) || 0) };
        });
        if (!row) continue;
        rows += 1; tall += row.tall;
        if (row.top < row.bar - 0.5) hidden.push(row);
      }
      expect(rows).toBe(40);
      if (viewport.height === 320) expect(tall).toBeGreaterThan(0);
      expect(hidden, `${viewport.width}x${viewport.height}`).toEqual([]);
      await context.close();
    }
  });

  it('moves focus to More, which now holds the update, when the notice is dismissed with Later', async () => {
    await open('#/encounter', { viewport: { width: 390, height: 844 } });
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'sw-update-ready' } })));
    const later = page.locator('aside.workspace-update').getByRole('button', { name: 'Later' });
    await later.focus();
    await page.keyboard.press('Enter');
    await poll(() => page.evaluate(() => document.activeElement?.matches('.workspace-utilities > summary'))).toBe(true);
    expect(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))).toBe('More utilities, update ready');
  });
});
