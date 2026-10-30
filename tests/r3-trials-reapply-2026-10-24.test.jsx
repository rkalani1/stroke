// Third independent verification of the Trials Encounter import (r3-trials §9, 2026-10-24): the verifier's
// exact reproductions. Each runs first on the screener functions, with edits made the way TrialScreener's
// controls make them, and the UI-dependent ones again in a browser on the real controls.
// Expected values follow the import rule (the user's latest explicit answer is weighed against the
// Encounter on every import; a conflict leaves an exclusion present and any other answer unknown until the
// user answers it; an edit writes only its own facts) and the registry criteria quoted below, read for
// §2 and §8.3: NCT07260916 (MINUTE) exclusion 6 "Concurrent use of direct oral anticoagulants or low
// molecular weight heparin at ICH onset"; NCT07227246 (FASTEST-2) exclusion 2 "oral anticoagulant use
// (vitamin K antagonists or novel oral anticoagulants) within the past 7 days"; NCT05948566 (SISTER)
// exclusion 21 "Received Factor Xa inhibitors (such as Fondaparinux, apixaban or rivaroxaban) within the
// past 48 hours"; NCT03907046 (ASPIRE) "Non-valvular AF (defined as atrial fibrillation or atrial flutter),
// documented by electrocardiography or a physician-confirmed history of prior AF".
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { newEncounter } from '../src/workspace-state.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { buildScreenerParams, conflictNote, createInitialScreenerState, evaluateAll, potentialMatches, refinerItems, withClassification } from '../src/evidence/screener-eval.js';
import { answerFacts, applyAnticoagulant, applyEncounterPrefill, importChanged, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';

const HOUR = 3600000;
const now = new Date(2026, 9, 22, 12).getTime();
const fresh = () => createInitialScreenerState();
const pad = n => String(n).padStart(2, '0');
const lkwAt = ms => { const d = new Date(ms); return { lkwDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, lkwTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; };
const localIso = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };
const reapply = (state, e) => applyEncounterPrefill(state, screenerPrefillFromEncounter(e, now), fresh());
const HEAD = 'Encounter and screener entries differed: ';
const TAIL = '. Exclusions are set to present, other answers to unknown; confirm them.';
// Where a study lands: [group, completeness or exclusion reasons].
function where(state, acronym) {
  const r = evaluateAll(state, screenerTrials, now);
  const pending = r.pending.find(i => i.trial.acronym === acronym), excluded = r.excluded.find(i => i.trial.acronym === acronym);
  return pending ? ['pending', pending.completeness] : excluded ? ['excluded', excluded.exclusionReasons] : ['absent'];
}
const view = state => ({ anticoagulant: state.anticoagulant, takingOac: state.takingOac, afibHistory: state.afibHistory, afOrFlutterHistory: state.afOrFlutterHistory, exclusions: state.exclusions, note: conflictNote(state, now) });

// ICH at 1 h with every MINUTE and FASTEST-2 fact answered and anticoagulant "None" (the verifier's p2/p3 screen).
const ichScreen = () => applyAnticoagulant(answerFacts(withClassification(fresh(), 'ich'), { age: 60, nihss: 10, gcs: 12, preMrs: 0, ichLocation: 'bg', ichVolume: 25, exclusions: { exSecondaryIch: false, exBrainstemIch: false, exMidbrain: false, exPregnancy: false } }), 'none');
const ich = lastDOACType => encounter({ diagnosisCategory: 'ich', ...lkwAt(now - HOUR), lastDOACType });
const MINUTE_OUT = ['excluded', ['Concurrent DOAC or LMWH at ICH onset']];
const FASTEST_OUT = ['excluded', ['Oral anticoagulant (VKA or DOAC) within 7 days']];

describe('an answer that writes the value a conflict left is kept on reapply (verifier finding 1)', () => {
  it('MINUTE: None, Encounter LMWH, user DOAC, Encounter cleared, reapply: DOAC/LMWH at onset stays present', () => {
    let state = reapply(ichScreen(), ich('lmwh'));
    expect([state.anticoagulant, state.exclusions.exDoacLmwhAtOnset]).toEqual(['unselected', true]);
    expect(conflictNote(state, now)).toBe(`${HEAD}anticoagulant at onset; DOAC or LMWH at ICH onset${TAIL}`);
    state = applyAnticoagulant(state, 'doac');
    // Both sides now say present: the user's DOAC answer settles both conflicts.
    expect(conflictNote(state, now)).toBe('');
    state = reapply(state, ich(''));
    expect([state.anticoagulant, state.exclusions.exDoacLmwhAtOnset, state.exclusions.exOacWithin7d]).toEqual(['doac', true, true]);
    expect(where(state, 'MINUTE')).toEqual(MINUTE_OUT);
    const r = evaluateAll(state, screenerTrials, now);
    expect(potentialMatches(r).map(i => i.trial.acronym)).not.toContain('MINUTE');
    expect(r.briefingNote).toContain('anticoagulant at onset: DOAC');
    expect(r.briefingNote).toContain('DOAC or LMWH at ICH onset: present');
    expect(r.briefingNote).not.toMatch(/ICH onset: absent|POTENTIAL MATCH \(\d+\)[^\n]*\n- MINUTE/);
    // The same entries imported for the first time give the same screen.
    expect(view(state)).toEqual(view(reapply(applyAnticoagulant(ichScreen(), 'doac'), ich(''))));
  });

  it.each([
    ['cleared', '', { anticoagulant: 'vka', takingOac: true, note: '' }],
    ['"none"', 'none', { anticoagulant: 'unselected', takingOac: 'unselected', note: `${HEAD}anticoagulant at onset; Oral anticoagulant (VKA or DOAC) within 7 days${TAIL}` }]
  ])('FASTEST-2: None, Encounter apixaban, user Warfarin/VKA, Encounter anticoagulant %s, reapply: OAC within 7 days stays present', (label, type, expected) => {
    const answered = applyAnticoagulant(reapply(ichScreen(), ich('apixaban')), 'vka');
    expect(conflictNote(answered, now)).toBe('');
    const state = reapply(answered, ich(type));
    expect({ anticoagulant: state.anticoagulant, takingOac: state.takingOac, note: conflictNote(state, now) }).toEqual(expected);
    expect(state.exclusions.exOacWithin7d).toBe(true);
    expect(where(state, 'FASTEST-2')).toEqual(FASTEST_OUT);
    const note = evaluateAll(state, screenerTrials, now).briefingNote;
    expect(note).toMatch(/\n- FASTEST-2: Oral anticoagulant \(VKA or DOAC\) within 7 days\n/);
    expect(note).not.toContain('within 7 days: absent');
    expect(view(state)).toEqual(view(reapply(applyAnticoagulant(ichScreen(), 'vka'), ich(type))));
  });

  it('refiner: DOAC/LMWH at onset Absent then Present after the conflict, Encounter cleared, reapply: Present is kept', () => {
    let state = reapply(ichScreen(), ich('lmwh'));
    state = answerFacts(state, { exclusions: { exDoacLmwhAtOnset: false } });
    state = answerFacts(state, { exclusions: { exDoacLmwhAtOnset: true } });
    expect(conflictNote(state, now)).toBe(`${HEAD}anticoagulant at onset${TAIL}`);
    state = reapply(state, ich(''));
    expect(state.exclusions.exDoacLmwhAtOnset).toBe(true);
    expect(where(state, 'MINUTE')).toEqual(MINUTE_OUT);
  });

  it('anticoagulant Unknown after the conflict: a reapply never brings back the earlier "None"', () => {
    let state = reapply(ichScreen(), ich('apixaban'));
    state = applyAnticoagulant(state, 'unselected');
    expect(conflictNote(state, now)).toBe('');
    expect(where(state, 'MINUTE')).toEqual(['pending', 'insufficient-information']);
    const cleared = reapply(state, ich(''));
    expect([cleared.anticoagulant, cleared.takingOac, cleared.exclusions.exDoacLmwhAtOnset, cleared.exclusions.exOacWithin7d]).toEqual(['unselected', 'unselected', undefined, undefined]);
    expect(where(cleared, 'MINUTE')).toEqual(['pending', 'insufficient-information']);
    expect(evaluateAll(cleared, screenerTrials, now).briefingNote).not.toContain('anticoagulant at onset: none');
    // With the Encounter still documenting apixaban, its value is the only one entered.
    const again = reapply(state, ich('apixaban'));
    expect([again.anticoagulant, again.exclusions.exDoacLmwhAtOnset, conflictNote(again, now)]).toEqual(['doac', true, '']);
    expect(where(again, 'MINUTE')).toEqual(MINUTE_OUT);
  });
});

describe('answering AF documented does not settle the conflict over AF or flutter (verifier finding 2)', () => {
  const af = age => encounter({ diagnosisCategory: 'ich', age, ...lkwAt(now - 30 * 24 * HOUR) }, { details: { afDetected: 'yes' } });
  const aspireScreen = () => answerFacts(withClassification(fresh(), 'ich'), { afOrFlutterHistory: false, exclusions: { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false } });
  const FLUTTER_NOTE = `${HEAD}atrial fibrillation or flutter${TAIL}`;

  it.each([['the same Encounter', '72'], ['an unrelated Encounter edit (age 72 → 73)', '73']])('AF/flutter No, Encounter AF, user AF documented Yes, reapply with %s: AF/flutter stays unknown and listed', (label, age) => {
    let state = reapply(aspireScreen(), af('72'));
    expect([state.afibHistory, state.afOrFlutterHistory]).toEqual(['unselected', 'unselected']);
    expect(conflictNote(state, now)).toBe(`${HEAD}documented clinical atrial fibrillation; atrial fibrillation or flutter${TAIL}`);
    state = answerFacts(state, { afibHistory: true });
    expect(conflictNote(state, now)).toBe(FLUTTER_NOTE);
    for (let i = 0; i < 3; i += 1) {
      state = reapply(state, af(age));
      expect([state.afibHistory, state.afOrFlutterHistory, conflictNote(state, now)]).toEqual([true, 'unselected', FLUTTER_NOTE]);
      expect(where(state, 'ASPIRE')).toEqual(['pending', 'insufficient-information']);
      const note = evaluateAll(state, screenerTrials, now).briefingNote;
      expect(note).toContain(`\n${FLUTTER_NOTE}\n`);
      expect(note).not.toContain('Requires documented non-valvular atrial fibrillation or flutter');
    }
    // Answering AF or flutter itself settles it.
    expect(where(answerFacts(state, { afOrFlutterHistory: true }), 'ASPIRE')).toEqual(['pending', 'potential-match']);
  });
});

describe('the OAC control writes only its own fact (verifier finding 3)', () => {
  it('Xa inhibitor ≤ 48 h Absent, Encounter apixaban 10 h ago, user "On oral anticoagulant" Yes: the exclusion stays present and listed', () => {
    const screen = answerFacts(withClassification(fresh(), 'ischemic'), { nihss: 10, aspects: 8, preMrs: 0, exclusions: { exXaDtiWithin48h: false, exIvtGivenOrPlanned: false, exPregnancy: false } });
    const e = encounter({ diagnosisCategory: 'ischemic', age: '70', ...lkwAt(now - 8 * HOUR), lastDOACType: 'apixaban', lastDOACDose: localIso(now - 10 * HOUR) });
    const XA_NOTE = `${HEAD}Factor Xa inhibitor or direct thrombin inhibitor within 48 h${TAIL}`;
    const SISTER_OUT = ['excluded', ['Factor Xa inhibitor or direct thrombin inhibitor within 48 h']];
    let state = reapply(screen, e);
    expect([state.exclusions.exXaDtiWithin48h, conflictNote(state, now), where(state, 'SISTER')]).toEqual([true, XA_NOTE, SISTER_OUT]);
    for (const answer of [true, false, 'unselected']) {
      const edited = answerFacts(state, { takingOac: answer });
      expect([edited.takingOac, edited.exclusions.exXaDtiWithin48h, where(edited, 'SISTER')]).toEqual([answer, true, SISTER_OUT]);
      expect(conflictNote(edited, now)).toBe(XA_NOTE);
    }
    state = reapply(answerFacts(state, { takingOac: true }), e);
    expect([state.takingOac, state.exclusions.exXaDtiWithin48h, conflictNote(state, now)]).toEqual([true, true, XA_NOTE]);
  });
});

describe('choosing a classification ends the import and keeps only the user\'s own answers', () => {
  const AF_NOTE = `${HEAD}documented clinical atrial fibrillation${TAIL}`;
  it('a fact in conflict stays unknown and listed, and the next import weighs the user\'s answer again', () => {
    const e = afDetected => encounter({ diagnosisCategory: 'ich', age: '72', ...lkwAt(now - 30 * 24 * HOUR) }, { details: { afDetected } });
    const imported = reapply(answerFacts(withClassification(fresh(), 'ich'), { afibHistory: false }), e('yes'));
    expect([imported.afibHistory, imported.age]).toEqual(['unselected', 72]);
    const restarted = withClassification(imported, 'ich');
    expect([restarted.afibHistory, restarted.age, conflictNote(restarted, null)]).toEqual(['unselected', 'unselected', AF_NOTE]);
    // The import has ended: no source, so nothing on the screen is called stale.
    expect(importChanged(restarted, screenerPrefillFromEncounter(e(''), now))).toBe(false);
    const again = reapply(restarted, e('yes'));
    expect([again.afibHistory, conflictNote(again, now)]).toEqual(['unselected', AF_NOTE]);
    // The user's "No" is kept for that weighing: with the Encounter AF cleared, it is the only answer entered.
    expect([reapply(restarted, e('')).afibHistory, conflictNote(reapply(restarted, e('')), now)]).toEqual([false, '']);
    // Answering the fact after the click settles the conflict, as any edit does.
    expect([answerFacts(restarted, { afibHistory: false }).afibHistory, conflictNote(answerFacts(restarted, { afibHistory: false }), null)]).toEqual([false, '']);
  });

  // Third verifier, round 4 (r1-reclassify, browser-r1): TIA, age 70, LKW 3 days, Encounter "no AF documented".
  it.each(['tia', 'ischemic'])('AF documented Yes against the Encounter\'s "no AF", then %s chosen: AF stays unknown and listed, and INTERCEPT never becomes a potential match on it', to => {
    const e = encounter({ diagnosisCategory: 'tia', age: '70', ...lkwAt(now - 72 * HOUR) }, { details: { afDetected: 'no' } });
    let state = reapply(answerFacts(withClassification(fresh(), 'tia'), { afibHistory: true }), e);
    expect([state.afibHistory, state.imported.conflicts, conflictNote(state, now)]).toEqual(['unselected', { afibHistory: true }, AF_NOTE]);
    state = withClassification(state, to);
    expect([state.afibHistory, conflictNote(state, null)]).toEqual(['unselected', AF_NOTE]);
    // The user re-enters the facts the click restarted: age 70, onset "24h – 7d", every refiner item Absent.
    state = answerFacts(state, { age: '70' });
    state = answerFacts(state, { onsetVal: 3, onsetUnit: 'days', onsetRangeHours: [24, 168], onsetAnchorMs: null });
    state = answerFacts(state, { exclusions: Object.fromEntries(refinerItems(state, null).map(item => [item.id, false])) });
    expect([state.afibHistory, conflictNote(state, null)]).toEqual(['unselected', AF_NOTE]);
    const r = evaluateAll(state, screenerTrials, null);
    expect(potentialMatches(r).map(i => i.trial.acronym)).not.toContain('INTERCEPT');
    expect(r.briefingNote.split('\n')).toContain(AF_NOTE);
    expect(r.briefingNote).not.toMatch(/^Inputs: .*atrial fibrillation/m);
    expect(r.briefingNote).toContain('Confirm documented clinical atrial fibrillation');
    // Control: once the user answers AF documented, the same screen is a potential match, so AF was the only gate.
    expect(potentialMatches(evaluateAll(answerFacts(state, { afibHistory: true }), screenerTrials, null)).map(i => i.trial.acronym)).toContain('INTERCEPT');
  });

  it('AF or flutter No against an Encounter AF, ICH chosen again: both stay unknown and listed, and AF or flutter is not derived', () => {
    const e = encounter({ diagnosisCategory: 'ich', age: '72', ...lkwAt(now - 30 * 24 * HOUR) }, { details: { afDetected: 'yes' } });
    const imported = reapply(answerFacts(withClassification(fresh(), 'ich'), { afOrFlutterHistory: false, exclusions: { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false } }), e);
    let state = withClassification(imported, 'ich');
    expect([state.afibHistory, state.afOrFlutterHistory, conflictNote(state, null)]).toEqual(['unselected', 'unselected', `${HEAD}documented clinical atrial fibrillation; atrial fibrillation or flutter${TAIL}`]);
    state = answerFacts(state, { afibHistory: true, exclusions: { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false } });
    expect(buildScreenerParams(state, null).afOrFlutterHistory).toBe('unselected');
    expect(conflictNote(state, null)).toBe(`${HEAD}atrial fibrillation or flutter${TAIL}`);
    expect(where(state, 'ASPIRE')).toEqual(['pending', 'insufficient-information']);
    // On an ischemic screen AF or flutter is hidden and returns to unknown, so only AF stays listed.
    const ischemic = withClassification(imported, 'ischemic');
    expect([ischemic.afOrFlutterHistory, Object.keys(ischemic.imported.conflicts), conflictNote(ischemic, null)]).toEqual(['unselected', ['afibHistory'], AF_NOTE]);
  });

  it('a conflict over an answer the click restarts ends with it', () => {
    const e = encounter({ diagnosisCategory: 'ich', ...lkwAt(now - HOUR), lastDOACType: 'apixaban' });
    const imported = reapply(ichScreen(), e);
    expect(Object.keys(imported.imported.conflicts)).toEqual(expect.arrayContaining(['anticoagulant', 'exDoacLmwhAtOnset', 'exOacWithin7d']));
    const restarted = withClassification(imported, 'ich');
    expect([restarted.anticoagulant, restarted.exclusions, restarted.imported, conflictNote(restarted, null)]).toEqual(['unselected', {}, null, '']);
  });
});

describe('an entry equal to the Encounter\'s value stays the user\'s answer', () => {
  it('pre-stroke mRS 0 entered, Encounter mRS 0, Encounter later cleared: the entry stays', () => {
    const e = premorbidMRS => encounter({ diagnosisCategory: 'ich', ...lkwAt(now - HOUR), premorbidMRS });
    const state = reapply(reapply(answerFacts(withClassification(fresh(), 'ich'), { preMrs: 0 }), e('0')), e(''));
    expect(state.preMrs).toBe(0);
    // A value only the Encounter supplied still returns to unknown (TA-F2).
    expect(reapply(reapply(withClassification(fresh(), 'ich'), e('0')), e('')).preMrs).toBe('unselected');
  });
});

describe('the same reproductions on the real controls in a browser', () => {
  let browser, page, script, css, errors;
  beforeAll(async () => {
    css = await readFile(new URL('../tailwind.css', import.meta.url), 'utf8');
    const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
      resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import Trials from './src/Trials.jsx';
        import { newEncounter } from './src/workspace-state.js';
        window.newEncounter = newEncounter;
        function Harness() {
          const [encounter, setEncounter] = useState(null);
          window.setEncounter = setEncounter;
          return <Trials sub="screener" onNavigate={() => {}} active encounter={encounter} now={Date.now()} />;
        }
        createRoot(document.getElementById('root')).render(<Harness />);
      ` } });
    script = result.outputFiles[0].text;
    browser = await chromium.launch();
  });
  afterAll(async () => { await browser?.close(); });
  const open = async () => {
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(10000);
    errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date(2026, 9, 22, 12) });
    await page.setContent('<div id="root"></div>');
    await page.addStyleTag({ content: css });
    await page.evaluate(() => { window.copies = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copies.push(text); } } }); });
    await page.addScriptTag({ content: script });
    await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
  };
  const setEncounter = (note, rest = {}) => page.evaluate(([n, r]) => { const s = window.newEncounter(); Object.assign(s.note, n); Object.assign(s, r); window.setEncounter(s); }, [note, rest]);
  const banner = () => page.getByRole('region', { name: 'Encounter facts' });
  const useFacts = () => banner().getByRole('button', { name: /^(Use these facts|Applied ✓ · reapply|Reapply Encounter facts)$/ }).click();
  const select = (label, value) => page.getByLabel(label, { exact: true }).selectOption(value);
  const value = label => page.getByLabel(label, { exact: true }).inputValue();
  const open$ = summary => page.locator('summary', { hasText: summary }).click();
  const card = acronym => page.locator(`#trial-results article[data-trial="${acronym}"]`);
  const status = () => banner().getByRole('status').innerText();
  const copied = async () => { const n = await page.evaluate(() => window.copies.length); await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click(); await page.waitForFunction(count => window.copies.length > count, n); return page.evaluate(() => window.copies.at(-1)); };
  const ichFacts = async () => {
    await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
    await page.getByLabel('Age (y)', { exact: true }).fill('60');
    await page.getByLabel('NIHSS', { exact: true }).fill('10');
    await select('GCS', '12'); await select('Pre-stroke mRS', '0'); await select('ICH location', 'bg');
    await page.getByLabel('Volume (mL)', { exact: true }).fill('25');
    await select('Anticoagulant at onset', 'none');
    await open$('Optional exclusion review');
    for (const label of ['Suspected secondary cause for ICH (AVM, aneurysm, tumor, SAH, trauma, coagulopathy)', 'Midbrain extension or infratentorial/thalamic location', 'Brainstem hemorrhage (cerebellar is not brainstem)', 'Pregnancy']) await select(label, 'false');
  };

  it('MINUTE: the DOAC answer keeps DOAC/LMWH at onset present after the Encounter clears its LMWH (finding 1)', async () => {
    await open();
    try {
      const lkw = { diagnosisCategory: 'ich', lkwDate: '2026-10-22', lkwTime: '11:00' };
      await setEncounter({ ...lkw, lastDOACType: 'lmwh' });
      await ichFacts();
      await useFacts();
      expect(await value('DOAC or LMWH at ICH onset')).toBe('true');
      expect(await status()).toContain(`${HEAD}anticoagulant at onset; DOAC or LMWH at ICH onset${TAIL}`);
      await select('Anticoagulant at onset', 'doac');
      expect(await status()).not.toContain(HEAD);
      await setEncounter({ ...lkw, lastDOACType: '' });
      await useFacts();
      expect([await value('Anticoagulant at onset'), await value('DOAC or LMWH at ICH onset')]).toEqual(['doac', 'true']);
      expect(await card('MINUTE').count()).toBe(0);
      const note = await copied();
      expect(note).toContain('DOAC or LMWH at ICH onset: present');
      expect(note).toMatch(/\n- MINUTE: Concurrent DOAC or LMWH at ICH onset\n/);
      expect(note).not.toMatch(/POTENTIAL MATCH \(\d+\)[^\n]*\n- MINUTE/);
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('refiner Absent then Present after the conflict survives the reapply, and a refiner reset is kept too (finding 1)', async () => {
    await open();
    try {
      const lkw = { diagnosisCategory: 'ich', lkwDate: '2026-10-22', lkwTime: '11:00' };
      await setEncounter({ ...lkw, lastDOACType: 'lmwh' });
      await ichFacts();
      await useFacts();
      await select('DOAC or LMWH at ICH onset', 'false');
      await select('DOAC or LMWH at ICH onset', 'true');
      await setEncounter({ ...lkw, lastDOACType: '' });
      await useFacts();
      expect(await value('DOAC or LMWH at ICH onset')).toBe('true');
      expect(await card('MINUTE').count()).toBe(0);
      // "Reset exclusions to unknown" is an answer too: a reapply does not bring the entries back.
      await page.getByRole('button', { name: 'Reset exclusions to unknown', exact: true }).click();
      await useFacts();
      expect([await value('DOAC or LMWH at ICH onset'), await value('Pregnancy')]).toEqual(['', '']);
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('ASPIRE stays insufficient information after AF documented = Yes and a reapply (finding 2)', async () => {
    await open();
    try {
      await setEncounter({ diagnosisCategory: 'ich', age: '72', lkwDate: '2026-09-22', lkwTime: '12:00' }, { details: { afDetected: 'yes' } });
      await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
      await open$('Study-specific facts');
      await select('Non-valvular AF or atrial flutter', 'false');
      await useFacts();
      await open$('Optional exclusion review');
      for (const label of ['Earlier ICH within the 12 months before the index ICH', 'Separate mandatory anticoagulation indication (e.g., DVT/PE)', 'Clear baseline indication for antiplatelet therapy']) await select(label, 'false');
      await select('Atrial fibrillation documented', 'true');
      await useFacts();
      expect([await value('Atrial fibrillation documented'), await value('Non-valvular AF or atrial flutter')]).toEqual(['true', '']);
      expect(await card('ASPIRE').getAttribute('data-completeness')).toBe('insufficient-information');
      expect(await status()).toContain(`${HEAD}atrial fibrillation or flutter${TAIL}`);
      const note = await copied();
      expect(note).toContain(`${HEAD}atrial fibrillation or flutter${TAIL}`);
      expect(note).not.toContain('ASPIRE: Requires documented non-valvular atrial fibrillation or flutter');
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('"On oral anticoagulant" = Yes leaves the conflicting Xa inhibitor ≤ 48 h present (finding 3)', async () => {
    await open();
    try {
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70', lkwDate: '2026-10-22', lkwTime: '04:00', lastDOACType: 'apixaban', lastDOACDose: '2026-10-22T02:00' });
      await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      await page.getByLabel('NIHSS', { exact: true }).fill('10');
      await select('ASPECTS', '8'); await select('Pre-stroke mRS', '0');
      await open$('Optional exclusion review');
      for (const label of ['Factor Xa inhibitor or direct thrombin inhibitor within 48 h', 'IV thrombolysis given or planned', 'Pregnancy']) await select(label, 'false');
      await useFacts();
      expect(await value('Factor Xa inhibitor or direct thrombin inhibitor within 48 h')).toBe('true');
      await select('On oral anticoagulant at index stroke', 'true');
      expect(await value('Factor Xa inhibitor or direct thrombin inhibitor within 48 h')).toBe('true');
      expect(await status()).toContain(`${HEAD}Factor Xa inhibitor or direct thrombin inhibitor within 48 h${TAIL}`);
      expect(await card('SISTER').count()).toBe(0);
      expect(await copied()).toMatch(/\n- SISTER: Factor Xa inhibitor or direct thrombin inhibitor within 48 h\n/);
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('a classification click does not settle a standing AF conflict: INTERCEPT stays insufficient information (round 4)', async () => {
    await open();
    try {
      const AF_NOTE = `${HEAD}documented clinical atrial fibrillation${TAIL}`;
      await setEncounter({ diagnosisCategory: 'tia', age: '70', lkwDate: '2026-10-19', lkwTime: '12:00' }, { details: { afDetected: 'no' } });
      await page.getByRole('button', { name: 'TIA', exact: true }).click();
      await select('Atrial fibrillation documented', 'true');
      await useFacts();
      const refiner = 'details:has(summary:has-text("Optional exclusion review")) select';
      const allAbsent = async () => { for (const label of await page.locator(refiner).evaluateAll(els => els.map(el => el.getAttribute('aria-label')))) await select(label, 'false'); };
      await open$('Optional exclusion review');
      await allAbsent();
      expect([await value('Atrial fibrillation documented'), await card('INTERCEPT').getAttribute('data-completeness')]).toEqual(['', 'insufficient-information']);
      for (const name of ['TIA', 'Ischemic stroke']) {
        await page.getByRole('button', { name, exact: true }).click();
        expect(await value('Atrial fibrillation documented'), name).toBe('');
        expect(await status(), name).toBe(AF_NOTE);
      }
      await page.getByRole('button', { name: 'TIA', exact: true }).click();
      await page.getByLabel('Age (y)', { exact: true }).fill('70');
      await page.getByRole('button', { name: /^24h – 7d/ }).click();
      if (!(await page.locator('details:has(summary:has-text("Optional exclusion review"))').evaluate(d => d.open))) await open$('Optional exclusion review');
      await allAbsent();
      expect([await value('Atrial fibrillation documented'), await status(), await card('INTERCEPT').getAttribute('data-completeness')]).toEqual(['', AF_NOTE, 'insufficient-information']);
      const note = await copied();
      expect(note.split('\n')).toContain(AF_NOTE);
      expect(note).not.toMatch(/^Inputs: .*atrial fibrillation/m);
      expect(note).toMatch(/^POTENTIAL MATCH \(0\)/m);
      // Answering AF documented settles the conflict, and only then is INTERCEPT a potential match.
      await select('Atrial fibrillation documented', 'true');
      expect([await status(), await card('INTERCEPT').getAttribute('data-completeness')]).toEqual(['', 'potential-match']);
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);
});
