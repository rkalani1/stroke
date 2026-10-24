// Second independent verification of the round-3 Trials fixes (14 items), repaired 2026-10-22.
// Registry expectations quote the ClinicalTrials.gov records re-read on 2026-10-22 through the
// registry API (full eligibility text): STEP NCT06289985, SISTER NCT05948566, VERIFY NCT05338697,
// TELE-REHAB-2 NCT06682429. The STEP 30-h limit is an app screening limit, not registry text.
// Import and display expectations follow the screener's own rules (tri-state, unknown stays
// unknown, the copied summary matches the screen). None are copied from implementation output.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { newEncounter, nihssWithBulkZero } from '../src/workspace-state.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import {
  buildScreenerParams, conflictNote, createInitialScreenerState, evaluateAll, evaluateTrialEligibility, EXCLUSION_ITEMS, insufficientInformation,
  ONSET_PRESETS, potentialMatches, refinerItems, STALE_UNMODELED_NOTE, toConfirm, withClassification
} from '../src/evidence/screener-eval.js';
import { applyAnticoagulant, applyEncounterPrefill, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const S = patch => ({ ...createInitialScreenerState(), ...patch });
const fresh = () => createInitialScreenerState();
const evaluate = (acronym, patch) => evaluateTrialEligibility(trial(acronym), buildScreenerParams(S(patch)));
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };
const pad = n => String(n).padStart(2, '0');
const lkwAt = ms => { const d = new Date(ms); return { lkwDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, lkwTime: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; };
const localIso = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const preset = name => { const p = ONSET_PRESETS.find(b => b.name === name); return { onsetVal: p.val, onsetUnit: p.unit, onsetRangeHours: p.rangeHours }; };
const find = (r, acronym) => [...r.eligible, ...r.pending, ...r.soon, ...r.excluded].find(i => i.trial.acronym === acronym);
const item = id => EXCLUSION_ITEMS.find(entry => entry.id === id);
const HOUR = 3600000;
const now = new Date(2026, 9, 22, 12).getTime();
const CONFLICT_HEAD = 'Encounter and screener entries differed: ';
const CONFLICT_TAIL = '. Exclusions are set to present, other answers to unknown; confirm them.';

// NCT06289985: platform inclusion 1 "Suspected diagnosis acute ischemic stroke"; EVT domain inclusion 3
// "Presentation to enrolling hospital within 24 hours of last known well/stroke onset", inclusion 4 "Able to
// initiate arterial puncture within 2 hours from qualifying CTA/MRA or CTP/MRP imaging" (imaging repeated when
// more than 120 minutes pass before randomization); domain exclusion 1.4 "Intracranial occlusion suspected to be
// chronic". The registry states no randomization deadline, so the app stops screening STEP 30 h after LKW.
describe('STEP: the presentation pathway ends at the app\'s 30-h acute screening limit (rv-behavior#0, rv-registry#0)', () => {
  const facts = { classification: 'ischemic', age: 66, nihss: 2, vessel: 'ica_m1', aspects: 9, preMrs: 0,
    exclusions: { exMultipleTerritories: false, exTandem: false, exSeizureAtOnset: false, exSuspectedIcad: false, exPregnancy: false, exIncarcerated: false } };
  const at = (timing, presentedWithin24h) => S({ ...facts, ...timing, presentedWithin24h });
  const LIMIT = /^Beyond the app's 30-h acute screening limit \(not registry text; registry: presentation ≤ 24 h, puncture ≤ 2 h from qualifying imaging\)$/;
  const LIMIT_PENDING = 'Confirm LKW is within the app\'s 30-h acute screening limit';

  it('30 h with presentation ≤ 24 h recorded is a potential match that still asks puncture timing and a chronic occlusion', () => {
    const r = evaluateAll(at({ onsetVal: 30 }, true));
    const step = find(r, 'STEP');
    expect([step.status, step.completeness]).toEqual(['pending', 'potential-match']);
    expect(step.matchedCriteria).toContain('Presented to the enrolling hospital ≤ 24 h from LKW');
    expect(toConfirm(step)).toContain('Confirm arterial puncture can start ≤ 2 h from qualifying CTA/MRA or CTP/MRP imaging and the occlusion is not suspected to be chronic');
    expect(r.briefingNote).toContain('window Presentation ≤ 24 hours (app screens ≤ 30 h)');
  });

  it.each([
    ['30.5 h, presented ≤ 24 h', { onsetVal: 30.5 }, true],
    ['72 h, presented ≤ 24 h', { onsetVal: 72 }, true],
    ['72 h, presentation unknown', { onsetVal: 72 }, 'unselected'],
    ['20 days, presented ≤ 24 h', { onsetVal: 20, onsetUnit: 'days' }, true],
    ['"30 – 180d" preset, presented ≤ 24 h', preset('30 – 180d'), true],
    ['"30 – 180d" preset, presentation unknown', preset('30 – 180d'), 'unselected'],
    ['"> 6mo" preset, presented ≤ 24 h', preset('> 6mo'), true]
  ])('%s: not met for the app limit, never a candidate, and STEP\'s acute questions are no longer asked', (label, timing, presented) => {
    const state = at(timing, presented);
    const r = evaluateAll(state);
    const step = find(r, 'STEP');
    expect(step.status).toBe('excluded');
    expect(step.exclusionReasons).toHaveLength(1);
    expect(step.exclusionReasons[0]).toMatch(LIMIT);
    expect([...potentialMatches(r), ...insufficientInformation(r)].map(i => i.trial.acronym)).not.toContain('STEP');
    expect(refinerItems(state).map(i => i.id)).not.toContain('exTandem');
    expect(r.briefingNote).toMatch(/\n- STEP: Beyond the app's 30-h acute screening limit/);
    expect(r.briefingNote.split('DOES NOT MEET')[0]).not.toContain('STEP (NCT06289985)');
  });

  it('the "24h – 7d" preset may still be within 30 h: unknown with presentation recorded (never a potential match), not met with "No"', () => {
    const step = find(evaluateAll(at(preset('24h – 7d'), true)), 'STEP');
    expect([step.status, step.completeness]).toEqual(['pending', 'insufficient-information']);
    expect(toConfirm(step)).toContain(LIMIT_PENDING);
    const no = find(evaluateAll(at(preset('24h – 7d'), false)), 'STEP');
    expect(no.status).toBe('excluded');
    expect(no.exclusionReasons).toEqual(['Did not present to the enrolling hospital within 24 h of LKW']);
  });

  it('an unknown LKW leaves the limit to confirm even when presentation is recorded', () => {
    const step = evaluate('STEP', { ...facts, presentedWithin24h: true });
    expect([step.status, step.completeness]).toEqual(['pending', 'insufficient-information']);
    expect(toConfirm(step)).toContain(LIMIT_PENDING);
  });

  it('labels the limit as the app\'s, and keeps the registry summary free of it', () => {
    const step = trial('STEP');
    expect(step.eligibility.criteria.filter(c => c.field === 'onsetHours')).toEqual([expect.objectContaining({ operator: '<=', value: 30 })]);
    expect(step.sourceGaps.join(' ')).toContain('with no stated randomization deadline; the 30-hour screening limit is the app\'s, not the registry\'s');
    expect(step.exactInclusionCriteria.join(' ')).not.toMatch(/30/);
  });
});

describe('an imported documented AF contradicts an entered "No" to AF or flutter (rv-behavior#1)', () => {
  // NCT03907046 (ASPIRE): "Non-valvular AF (defined as atrial fibrillation or atrial flutter), documented by
  // electrocardiography or a physician-confirmed history of prior AF". Documented AF establishes the fact, so
  // it contradicts a "No"; the screener's rule for any conflict is that the answer becomes unknown, so neither
  // AF answer may take the Encounter's value and ASPIRE's AF criterion may not be met until it is answered.
  const ich = encounter({ diagnosisCategory: 'ich', age: '72', ...lkwAt(now - 30 * 24 * HOUR) }, { details: { afDetected: 'yes' } });
  // ASPIRE's three modeled exclusions answered absent, so only the AF answer decides its bucket.
  const answered = { classification: 'ich', exclusions: { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false } };
  const AF_PENDING = 'Confirm non-valvular atrial fibrillation or atrial flutter by ECG or physician-confirmed history';
  const NOTE = `${CONFLICT_HEAD}documented clinical atrial fibrillation; atrial fibrillation or flutter${CONFLICT_TAIL}`;
  const imported = () => applyEncounterPrefill(S({ ...answered, afOrFlutterHistory: false }), screenerPrefillFromEncounter(ich, now), fresh());

  it('leaves both AF answers unknown, lists both, and keeps ASPIRE at insufficient information', () => {
    const state = imported();
    expect([state.afibHistory, state.afOrFlutterHistory]).toEqual(['unselected', 'unselected']);
    expect(buildScreenerParams(state, now).afOrFlutterHistory).toBe('unselected');
    expect(conflictNote(state, now)).toBe(NOTE);
    const r = evaluateAll(state, screenerTrials, now);
    const aspire = find(r, 'ASPIRE');
    expect([aspire.status, aspire.completeness]).toEqual(['pending', 'insufficient-information']);
    expect(aspire.pendingCriteria).toContain(AF_PENDING);
    expect(potentialMatches(r).map(i => i.trial.acronym)).not.toContain('ASPIRE');
    expect(r.briefingNote).toContain(`\n${NOTE}\n`);
    expect(r.briefingNote).not.toMatch(/POTENTIAL MATCH \(\d+\)[^\n]*\n- ASPIRE/);
    expect(r.briefingNote).not.toMatch(/· atrial fibrillation|non-valvular AF or atrial flutter: No/);
  });
  it('does not derive AF or flutter from a confirmed AF while that conflict stands; an answer settles it', () => {
    const confirmedAf = { ...imported(), afibHistory: true };
    expect(conflictNote(confirmedAf, now)).toBe(`${CONFLICT_HEAD}atrial fibrillation or flutter${CONFLICT_TAIL}`);
    expect(find(evaluateAll(confirmedAf, screenerTrials, now), 'ASPIRE').completeness).toBe('insufficient-information');
    const answeredYes = { ...confirmedAf, afOrFlutterHistory: true };
    expect(conflictNote(answeredYes, now)).toBe('');
    expect(find(evaluateAll(answeredYes, screenerTrials, now), 'ASPIRE').completeness).toBe('potential-match');
    // Without an import, a documented AF still establishes the criterion (unchanged rule).
    expect(buildScreenerParams(S({ classification: 'ich', afibHistory: true })).afOrFlutterHistory).toBe(true);
  });
  it('documented absence of AF never contradicts a recorded flutter, and an agreeing answer is no conflict', () => {
    const noAf = encounter({ diagnosisCategory: 'ich', age: '72' }, { details: { afDetected: 'no' } });
    for (const e of [noAf, ich]) {
      const state = applyEncounterPrefill(S({ classification: 'ich', afOrFlutterHistory: true }), screenerPrefillFromEncounter(e, now), fresh());
      expect(state.afOrFlutterHistory).toBe(true);
      expect(state.imported.conflicts).not.toHaveProperty('afOrFlutterHistory');
    }
  });
  it('an Encounter AF the user already entered adds nothing, so their "No" to non-valvular AF or flutter stands', () => {
    // AF entered as documented with "No" to non-valvular AF/flutter (e.g. valvular AF): the Encounter repeats a known fact.
    const state = applyEncounterPrefill(S({ ...answered, afibHistory: true, afOrFlutterHistory: false }), screenerPrefillFromEncounter(ich, now), fresh());
    expect([state.afibHistory, state.afOrFlutterHistory, conflictNote(state, now)]).toEqual([true, false, '']);
    expect(find(evaluateAll(state, screenerTrials, now), 'ASPIRE').exclusionReasons).toContain('Requires documented non-valvular atrial fibrillation or flutter');
  });
});

describe('a reapply never settles a standing conflict in the Encounter\'s favour (rv-behavior#1, probe4)', () => {
  // The rule: a conflict leaves the entry unknown (an exclusion present) until the user answers it. Reapplying
  // the same Encounter must therefore give the same screen and the same note as the first import.
  const reapply = (state, e) => applyEncounterPrefill(state, screenerPrefillFromEncounter(e, now), fresh());
  const af = value => encounter({ diagnosisCategory: 'ich', age: '72', ...lkwAt(now - 30 * 24 * HOUR) }, { details: value === undefined ? {} : { afDetected: value } });
  const aspireAnswered = { exPriorIch12m: false, exClearAnticoagulationIndication: false, exClearAntiplateletIndication: false };
  const sister = encounter({ diagnosisCategory: 'ischemic', age: '70', ...lkwAt(now - 8 * HOUR), lastDOACType: 'apixaban', lastDOACDose: localIso(now - 10 * HOUR) });
  const minute = encounter({ diagnosisCategory: 'ich', age: '65', ...lkwAt(now - 1.5 * HOUR), lastDOACType: 'apixaban', lastDOACDose: localIso(now - 10 * HOUR) });
  const view = state => ({ afibHistory: state.afibHistory, afOrFlutterHistory: state.afOrFlutterHistory, anticoagulant: state.anticoagulant, takingOac: state.takingOac, exclusions: state.exclusions, note: conflictNote(state, now) });

  it.each([
    ['AF documented "No" vs Encounter AF', S({ classification: 'ich', afibHistory: false, exclusions: aspireAnswered }), af('yes'), 'documented clinical atrial fibrillation'],
    ['AF or flutter "No" vs Encounter AF', S({ classification: 'ich', afOrFlutterHistory: false, exclusions: aspireAnswered }), af('yes'), 'documented clinical atrial fibrillation; atrial fibrillation or flutter'],
    ['Xa inhibitor ≤ 48 h "absent" vs an apixaban dose 10 h ago', S({ classification: 'ischemic', exclusions: { exXaDtiWithin48h: false } }), sister, 'Factor Xa inhibitor or direct thrombin inhibitor within 48 h'],
    ['anticoagulant "None" vs Encounter apixaban', applyAnticoagulant(withClassification(fresh(), 'ich'), 'none'), minute, 'anticoagulant at onset; DOAC or LMWH at ICH onset; Oral anticoagulant (VKA or DOAC) within 7 days']
  ])('%s: the second import gives the first import\'s screen and note', (label, manual, e, names) => {
    const first = reapply(manual, e);
    expect(conflictNote(first, now)).toBe(`${CONFLICT_HEAD}${names}${CONFLICT_TAIL}`);
    const second = reapply(first, e);
    expect(view(second)).toEqual(view(first));
    expect(view(reapply(second, e))).toEqual(view(first));
    expect(evaluateAll(second, screenerTrials, now).briefingNote).toContain(`${CONFLICT_HEAD}${names}${CONFLICT_TAIL}`);
  });
  it('ASPIRE stays at insufficient information through any number of reapplies', () => {
    let state = S({ classification: 'ich', afOrFlutterHistory: false, exclusions: aspireAnswered });
    for (let i = 0; i < 3; i += 1) {
      state = reapply(state, af('yes'));
      expect(find(evaluateAll(state, screenerTrials, now), 'ASPIRE').completeness).toBe('insufficient-information');
    }
  });
  it('weighs the user\'s own entry again: an Encounter that now agrees or is silent gives it back, with no note', () => {
    for (const later of [af('no'), af(undefined)]) {
      const state = reapply(reapply(S({ classification: 'ich', afibHistory: false }), af('yes')), later);
      expect([state.afibHistory, conflictNote(state, now)]).toEqual([false, '']);
    }
    // The excluded-present entry returns to the user's "absent" once the Encounter no longer records the dose.
    const first = reapply(S({ classification: 'ischemic', exclusions: { exXaDtiWithin48h: false } }), sister);
    const noDose = encounter({ ...sister.note, lastDOACType: '', lastDOACDose: '' });
    expect(reapply(first, noDose).exclusions.exXaDtiWithin48h).toBe(false);
  });
  it('an answer given after the import is weighed as entered: agreeing settles the conflict', () => {
    const first = reapply(S({ classification: 'ich', afibHistory: false }), af('yes'));
    const settled = reapply({ ...first, afibHistory: true }, af('yes'));
    expect([settled.afibHistory, conflictNote(settled, now)]).toEqual([true, '']);
  });
});

describe('choosing a classification ends the Encounter import (rv-behavior#2)', () => {
  it('returns unchanged imported values to unknown, with the Encounter-only NIHSS provenance', () => {
    // NIHSS 1a scored 1, then "set unentered items to 0": 14 items bulk-filled, total 1.
    const e = nihssWithBulkZero(encounter({ diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '1', ...lkwAt(now - 2 * HOUR) }, { nihss: { consciousness: 'Drowsy (1)' } }));
    const imported = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, now), fresh());
    expect([imported.age, imported.nihss, imported.preMrs, imported.nihssBulkZero]).toEqual([70, 1, 1, 14]);
    const ich = withClassification(imported, 'ich');
    expect([ich.age, ich.nihss, ich.preMrs, ich.nihssBulkZero, ich.nihssUntestable, ich.imported]).toEqual(['unselected', 'unselected', 'unselected', 0, 0, null]);
    // The Encounter later says ICH, NIHSS 9, pre-mRS 3: no superseded imported fact is printed as current.
    expect(evaluateAll(ich, screenerTrials, now).briefingNote).not.toMatch(/age 70|NIHSS 1|pre-mRS 1|bulk entry/);
  });
  it('keeps values the user entered or changed after the import', () => {
    const imported = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '1' }), now), fresh());
    expect(withClassification({ ...imported, age: 71, afibHistory: true }, 'ich')).toMatchObject({ age: 71, afibHistory: true, preMrs: 'unselected' });
    // A screen without an import keeps its entries, as before.
    expect(withClassification(S({ classification: 'ischemic', age: 60, preMrs: 2 }), 'ich')).toMatchObject({ age: 60, preMrs: 2 });
  });
});

describe('the conflict note lists only what the screen shows (rv-behavior#5)', () => {
  // SISTER (NCT05948566) exclusion 21: "Received Factor Xa inhibitors (such as Fondaparinux, apixaban or rivaroxaban)
  // within the past 48 hours"; inclusion 5: study drug 4.5 to 24 hours from LKW. The item serves SISTER only.
  const manual = S({ classification: 'ischemic', exclusions: { exXaDtiWithin48h: false } });
  const importAt = lkwHours => applyEncounterPrefill(manual, screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', ...lkwAt(now - lkwHours * HOUR), lastDOACType: 'apixaban', lastDOACDose: localIso(now - 32 * HOUR) }), now), fresh());
  it('omits an exclusion conflict once its only study is out of window, and lists it while the refiner asks it', () => {
    const late = importAt(30);
    expect(late.exclusions.exXaDtiWithin48h).toBe(true);
    expect(refinerItems(late, now).map(i => i.id)).not.toContain('exXaDtiWithin48h');
    expect(conflictNote(late, now)).toBe('');
    // SISTER stays listed as not met for the recorded exclusion; only the confirm request is withdrawn.
    const note = evaluateAll(late, screenerTrials, now).briefingNote;
    expect(note).not.toContain(CONFLICT_HEAD);
    expect(note).not.toContain('Exclusions recorded');
    expect(conflictNote(importAt(10), now)).toBe(`${CONFLICT_HEAD}Factor Xa inhibitor or direct thrombin inhibitor within 48 h${CONFLICT_TAIL}`);
  });
});

describe('VERIFY and TELE-REHAB-2 read their own earlier-stroke items (rv-registry#1)', () => {
  // NCT05338697 (VERIFY) exclusion 6: "Symptomatic stroke in any location within 30 days prior to index stroke."
  // NCT06682429 (TELE-REHAB-2) exclusion 9: "A new symptomatic stroke has occurred since the index stroke, or a
  // separate stroke occurred within 30 days prior to the index stroke" (no symptomatic qualifier).
  const reads = acronym => trial(acronym).eligibility.exclusions.map(e => e.field);
  it('labels each item with its own registry wording and lets only its study read it', () => {
    expect(item('exVerifyStroke30d')).toMatchObject({ label: 'Symptomatic stroke (any location) within the 30 days before the index stroke', classifications: ['ischemic'], trials: ['VERIFY'] });
    expect(item('exRecentStroke30d')).toMatchObject({ label: 'Separate stroke within the 30 days before the index stroke', trials: ['TELE-REHAB-2'] });
    expect(reads('VERIFY')).toContain('exVerifyStroke30d');
    expect(reads('VERIFY')).not.toContain('exRecentStroke30d');
    expect(reads('TELE-REHAB-2')).toContain('exRecentStroke30d');
    expect(reads('TELE-REHAB-2')).not.toContain('exVerifyStroke30d');
  });
  it('at 48 h, an earlier asymptomatic stroke recorded for TELE-REHAB-2 does not exclude VERIFY', () => {
    // Both studies are active at 48 h: VERIFY inside 24-96 h, TELE-REHAB-2 before its 90-150 day window.
    const state = S({ classification: 'ischemic', onsetVal: 48, age: 60, unilateralSymptomatic: true, ueWeakness: true, self_consent: true, language: 'english',
      exclusions: { exRecentStroke30d: true, exVerifyStroke30d: false } });
    expect(refinerItems(state).map(i => i.id)).toEqual(expect.arrayContaining(['exVerifyStroke30d', 'exRecentStroke30d']));
    const r = evaluateAll(state);
    expect(find(r, 'VERIFY').status).toBe('pending');
    expect(find(r, 'TELE-REHAB-2').exclusionReasons).toContain('Excludes separate stroke within 30 days prior');
    expect(r.briefingNote).toContain('Symptomatic stroke (any location) within the 30 days before the index stroke: absent; Separate stroke within the 30 days before the index stroke: present');
  });
  it('a symptomatic earlier stroke excludes VERIFY; the VERIFY item never changes TELE-REHAB-2 or appears on the ICH screen', () => {
    expect(evaluate('VERIFY', { classification: 'ischemic', onsetVal: 48, exclusions: { exVerifyStroke30d: true } }).exclusionReasons).toContain('Excludes symptomatic stroke within 30 days prior');
    expect(evaluate('TELE-REHAB-2', { classification: 'ischemic', onsetVal: 120, onsetUnit: 'days', exclusions: { exVerifyStroke30d: true } }).status).not.toBe('excluded');
    const ichLabels = refinerItems(S({ classification: 'ich' })).map(i => i.label).join(' ');
    expect(ichLabels).toContain('Separate stroke within the 30 days before the index stroke');
    expect(ichLabels).not.toMatch(/VERIFY|Symptomatic stroke \(any location\)/);
  });
});

describe('SISTER to-confirm wording (rv-registry#2, rv-registry#3)', () => {
  const potential = { classification: 'ischemic', onsetVal: 10, age: 60, nihss: 14, aspects: 8, preMrs: 0, vessel: 'ica_m1', exclusions: { exIvtGivenOrPlanned: false, exXaDtiWithin48h: false, exPregnancy: false } };
  it('keeps the registry\'s distal-migration allowance in the one reperfusion line', () => {
    // Exclusion 1: "Received endovascular treatment with clot engagement." 1a: "Patients who undergo groin puncture
    // but clot engagement is not attempted due to spontaneous distal migration are permitted".
    const r = evaluate('SISTER', potential);
    expect(r.completeness).toBe('potential-match');
    const confirm = toConfirm(r);
    expect(confirm).toContain('Confirm no standard-of-care reperfusion (registry primary objective): no EVT with clot engagement; groin puncture without engagement because of spontaneous distal migration is permitted');
    expect(confirm.filter(line => /clot engagement/.test(line))).toHaveLength(1);
    expect(confirm.join(' ')).not.toMatch(/not a candidate for standard-of-care reperfusion therapy, IVT or EVT/);
  });
  it('the source-gap sentence names exactly what the to-confirm list leaves out', () => {
    // Inclusion 6: "within 120 minutes of qualifying perfusion imaging"; exclusion 15: "Known hereditary or acquired
    // hemorrhagic diathesis, coagulation factor deficiency"; exclusions 4, 24, 25 stay in the full criteria only.
    const confirm = toConfirm(evaluate('SISTER', potential)).join(' ');
    expect(confirm).toMatch(/study drug ≤ 120 min from qualifying perfusion imaging/);
    expect(confirm).toMatch(/hemorrhagic diathesis or coagulation factor deficiency/);
    const full = trial('SISTER').exactExclusionCriteria.join(' ');
    for (const re of [/TS23/, /antibody/, /confounding/, /research drug/]) { expect(confirm).not.toMatch(re); expect(full).toMatch(re); }
    expect(trial('SISTER').sourceGaps).toContain('Perfusion imaging, EVT clot engagement and the remaining CT.gov exclusions are listed for confirmation, not modeled, except prior TS23 or antibody allergy, confounding neurological or psychiatric disease and another research drug protocol (full criteria only).');
  });
});

describe('a stale import for a diagnosis the screener does not model (rv-behavior#3, summary)', () => {
  it('prints the unmodeled caution instead of an instruction to reapply', () => {
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', age: '70', ...lkwAt(now - 3 * HOUR) }), now), fresh());
    const note = evaluateAll(state, screenerTrials, now, { staleImport: STALE_UNMODELED_NOTE }).briefingNote;
    expect(note).toContain(`\n${STALE_UNMODELED_NOTE}\n`);
    expect(note).not.toContain('reapply before relying');
    expect(note).toMatch(/Encounter LKW at import/);
  });
  it('still reports the Encounter LKW, so a changed one is detectable without facts to reapply', () => {
    const sah = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'sah', lkwDate: '2026-10-22', lkwTime: '05:00' }), now);
    expect([sah.patch, sah.lkwAnchorMs]).toEqual([null, new Date(2026, 9, 22, 5).getTime()]);
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'sah' }), now).lkwAnchorMs).toBeNull();
    // A modeled diagnosis reports the same anchor it imports.
    const ischemic = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', lkwDate: '2026-10-22', lkwTime: '09:00' }), now);
    expect([ischemic.lkwAnchorMs, ischemic.patch.onsetAnchorMs]).toEqual([new Date(2026, 9, 22, 9).getTime(), new Date(2026, 9, 22, 9).getTime()]);
  });
});

describe('Trials banner, timing note and database pick in a browser (rv-behavior#3, #4, #8)', () => {
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
          const [encounter, setEncounter] = useState(null), [sub, setSub] = useState('screener');
          window.setEncounter = setEncounter; window.setSub = setSub;
          return <Trials sub={sub} onNavigate={setSub} active encounter={encounter} now={Date.now()} />;
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
  const setEncounter = note => page.evaluate(n => { const s = window.newEncounter(); Object.assign(s.note, n); window.setEncounter(s); }, note);
  const banner = () => page.getByRole('region', { name: 'Encounter facts' });
  const timingNote = () => page.locator('#trial-exact-onset').locator('xpath=ancestor::section[1]').locator('p.mt-2').innerText();
  const copied = async () => { const n = await page.evaluate(() => window.copies.length); await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click(); await page.waitForFunction(count => window.copies.length > count, n); return page.evaluate(() => window.copies.at(-1)); };

  it('an Encounter diagnosis changed to SAH: no reapply instruction, no false "LKW changed", and choosing a classification clears the caution', async () => {
    await open();
    try {
      const lkw = { lkwDate: '2026-10-22', lkwTime: '09:00', age: '70' };
      await setEncounter({ diagnosisCategory: 'ischemic', ...lkw });
      await banner().getByRole('button', { name: 'Use these facts', exact: true }).click();
      await setEncounter({ diagnosisCategory: 'sah', ...lkw });
      await banner().getByText(STALE_UNMODELED_NOTE).waitFor();
      expect(await banner().getByRole('button').count()).toBe(0);
      expect(await banner().innerText()).not.toContain('reapply');
      // The Encounter LKW did not change, so the timing note must not say it did.
      expect(await timingNote()).not.toContain('has since changed');
      const note = await copied();
      expect(note).toContain(STALE_UNMODELED_NOTE);
      expect(note).not.toContain('reapply before relying');
      await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
      expect(await banner().innerText()).not.toContain('Caution');
      expect(await copied()).not.toContain('Caution');
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('an Encounter diagnosis changed to SAH with a new LKW: the timing note says the imported LKW is no longer the Encounter\'s', async () => {
    await open();
    try {
      await setEncounter({ diagnosisCategory: 'ischemic', lkwDate: '2026-10-22', lkwTime: '09:00', age: '70' });
      await banner().getByRole('button', { name: 'Use these facts', exact: true }).click();
      expect(await timingNote()).toBe('Live from the Encounter LKW time; updates as time passes. Editing replaces it.');
      await setEncounter({ diagnosisCategory: 'sah', lkwDate: '2026-10-22', lkwTime: '05:00', age: '70' });
      await banner().getByText(STALE_UNMODELED_NOTE).waitFor();
      expect(await timingNote()).toBe('Counting from the earlier imported LKW; the Encounter LKW has since changed.');
      expect(await timingNote()).not.toMatch(/Live from/);
      // Still counted from the imported 09:00 (3 h at 12:00), and the summary names that LKW as the one at import.
      expect(await page.locator('#trial-exact-onset').inputValue()).toBe('3');
      expect(await copied()).toMatch(/Encounter LKW at import 09:00/);
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('renders the banner status line before the first import, so the applied and conflict text is announced as a change', async () => {
    await open();
    try {
      await setEncounter({ diagnosisCategory: 'ischemic', age: '70' });
      const status = banner().getByRole('status');
      expect(await status.count()).toBe(1);
      expect(await status.innerText()).toBe('');
      await status.evaluate(el => { el.dataset.before = 'yes'; });
      await banner().getByRole('button', { name: 'Use these facts', exact: true }).click();
      expect(await status.innerText()).toMatch(/^Encounter facts applied/);
      expect(await status.getAttribute('data-before')).toBe('yes');
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);

  it('ignores a malformed or off-route ?q= instead of crashing Trials', async () => {
    await open();
    try {
      // A truncated shared link is already in the address bar when the database opens (mount), then arrives again by hashchange.
      await page.evaluate(() => { location.hash = '#/trials/database?q=%'; });
      await page.evaluate(() => window.setSub('database'));
      const search = page.getByLabel('Search the study database by acronym, name or NCT number');
      await search.waitFor();
      expect(await search.inputValue()).toBe('');
      await page.evaluate(() => { location.hash = '#/trials/database?q=%E0%A4%A'; });
      await page.waitForTimeout(100);
      expect(errors).toEqual([]);
      expect(await search.inputValue()).toBe('');
      await page.evaluate(() => { location.hash = '#/trials/database?q=INTERCEPT'; });
      await page.locator('#trials-database-panel article[data-trial="INTERCEPT"]').waitFor();
      // A query on another route is not a database pick.
      await page.evaluate(() => { location.hash = '#/evidence?q=STEP'; });
      await page.waitForTimeout(100);
      expect(await search.inputValue()).toBe('INTERCEPT');
    } finally { await page.close(); }
    expect(errors).toEqual([]);
  }, 30000);
});
