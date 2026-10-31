// Regression specs for the 2026-10-17 Trials review. Expected values come from
// the ClinicalTrials.gov records read on 2026-10-17 (quoted in the comments) and
// from the screener's own definitions (tri-state, live LKW anchor), not from the
// implementation output.
import { describe, expect, it } from 'vitest';
import { newEncounter } from '../../workspace-state.js';
import { screenerTrials } from '../screenerTrials.js';
import {
  buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility,
  EXCLUSION_ITEMS, toConfirm, relevantNotMet, potentialMatches, insufficientInformation,
  registryCheckLabel, registryCheckAgeDays, registryCheckAgeText, enrollmentLabel
} from '../screener-eval.js';
import { screenerPrefillFromEncounter, applyEncounterPrefill, answerFacts } from '../screener-prefill.js';
import { trialClassifications } from '../../components/TrialScreener.jsx';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const S = patch => ({ ...createInitialScreenerState(), ...patch });
const evaluate = (acronym, patch, nowMs = null) => evaluateTrialEligibility(trial(acronym), buildScreenerParams(S(patch), nowMs));
const find = (results, acronym) => ['eligible', 'pending', 'soon', 'excluded', 'closed'].map(k => [k, results[k].find(i => i.trial.acronym === acronym)]).find(([, item]) => item) || ['absent', null];
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };
const HOUR = 3600000;
const NOW = new Date('2026-10-17T12:00:00').getTime();
const fresh = () => createInitialScreenerState();

describe('Encounter onset is anchored to the LKW instant (TA-F1)', () => {
  const ich = encounter({ diagnosisCategory: 'ich', age: '60', lkwDate: '2026-10-17', lkwTime: '11:00' });

  it('re-evaluates FASTEST-2 (≤120 min from LKW) as time passes instead of freezing the import', () => {
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(ich, NOW), fresh());
    expect(state.onsetAnchorMs).toBe(new Date('2026-10-17T11:00:00').getTime());
    const [atImport] = find(evaluateAll(state, screenerTrials, NOW), 'FASTEST-2');
    expect(atImport).toBe('pending'); // 1 h ≤ 2 h
    const later = evaluateAll(state, screenerTrials, NOW + 2 * HOUR); // 3 h from LKW
    const [group, item] = find(later, 'FASTEST-2');
    expect(group).toBe('excluded');
    expect(item.exclusionReasons).toContain('Beyond 120 minutes from onset/LKW');
    expect(later.briefingNote).toContain('Inputs: Hemorrhage (ICH) · LKW 3.0 h (Encounter LKW 11:00, as of 14:00)');
  });

  it('moves SISTER (4.5–24 h) from before-window to a candidate once its window opens', () => {
    const isch = encounter({ diagnosisCategory: 'ischemic', lkwDate: '2026-10-17', lkwTime: '09:00' });
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(isch, NOW), fresh());
    const [g1, at3h] = find(evaluateAll(state, screenerTrials, NOW), 'SISTER');
    expect(g1).toBe('soon');
    expect(at3h.beforeWindow).toBe(true);
    expect(find(evaluateAll(state, screenerTrials, NOW + 2 * HOUR), 'SISTER')[0]).toBe('pending'); // 5 h
  });

  it('keeps a manual onset fixed and falls back to the import snapshot without a clock', () => {
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(ich, NOW), fresh());
    expect(buildScreenerParams(state).onsetHours).toBe(1);
    const manual = { ...state, onsetVal: '5', onsetUnit: 'hours', onsetRangeHours: null, onsetAnchorMs: null };
    expect(buildScreenerParams(manual, NOW + 10 * HOUR).onsetHours).toBe(5);
    // A device clock behind the LKW instant never yields negative elapsed time.
    expect(buildScreenerParams(state, NOW - 5 * HOUR).onsetHours).toBe(1);
  });
});

describe('re-importing Encounter facts clears what the Encounter no longer supports (TA-F2)', () => {
  const first = encounter({ diagnosisCategory: 'ich', age: '60', premorbidMRS: '0', lkwDate: '2026-10-17', lkwTime: '11:00', lastDOACType: 'apixaban' }, { gcs: { eye: '4', verbal: '5', motor: '6' }, volume: { a: '4', b: '3', thicknessMm: '5', numSlices: '8' } });
  const corrected = encounter({ diagnosisCategory: 'ich', age: '60', premorbidMRS: '0', lkwUnknown: true });

  it('returns stale onset, GCS, volume and anticoagulant facts to unknown', () => {
    const once = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(first, NOW), fresh());
    expect(once).toMatchObject({ gcs: 15, ichVolume: 24, anticoagulant: 'doac', takingOac: true, exclusions: { exDoacLmwhAtOnset: true, exOacWithin7d: true } });
    const twice = applyEncounterPrefill(once, screenerPrefillFromEncounter(corrected, NOW), fresh());
    expect(twice).toMatchObject({ classification: 'ich', age: 60, preMrs: 0, onsetVal: null, onsetAnchorMs: null, gcs: 'unselected', ichVolume: 'unselected', anticoagulant: 'unselected', takingOac: 'unselected' });
    expect(twice.exclusions).toEqual({});
    const r = evaluateAll(twice, screenerTrials, NOW);
    for (const acronym of ['MINUTE', 'FASTEST-2']) {
      const [group, item] = find(r, acronym);
      expect(group).toBe('pending');
      expect(item.exclusionReasons).toEqual([]);
    }
    expect(r.briefingNote).toContain('Inputs: Hemorrhage (ICH) · LKW unknown · age 60 · pre-mRS 0\n');
  });

  it('keeps values the user changed after the import', () => {
    const once = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(first, NOW), fresh());
    // A user edit is recorded by answerFacts, the screener's edit path (r3-trials §9).
    const edited = answerFacts(once, { gcs: 9, exclusions: { exPregnancy: false } });
    const twice = applyEncounterPrefill(edited, screenerPrefillFromEncounter(corrected, NOW), fresh());
    expect(twice.gcs).toBe(9);
    expect(twice.exclusions).toEqual({ exPregnancy: false });
  });
});

describe('tri-state: potential match / insufficient information / does not meet documented criteria (TA-F3)', () => {
  it('a study with unknown modeled facts is insufficient information, never a match', () => {
    const r = evaluateAll(S({ classification: 'ich' }));
    const [, minute] = find(r, 'MINUTE');
    expect(minute.completeness).toBe('insufficient-information');
    // MINUTE models 8 criteria and 4 exclusions; only the classification is known.
    expect(minute.unknownModeledCount).toBe(11);
    expect(potentialMatches(r)).toEqual([]);
    expect(r.eligible).toEqual([]);
  });

  it('only a study with every modeled FASTEST-2 criterion and exclusion answered is a potential match', () => {
    const state = S({ classification: 'ich', age: 70, onsetVal: 1, onsetUnit: 'hours', gcs: 14, preMrs: 0, ichVolume: 20, ichLocation: 'lobar', exclusions: { exOacWithin7d: false, exSecondaryIch: false, exBrainstemIch: false, exPregnancy: false } });
    const r = evaluateAll(state);
    expect(potentialMatches(r).map(i => i.trial.acronym)).toEqual(['FASTEST-2']);
    expect(insufficientInformation(r).map(i => i.trial.acronym)).not.toContain('FASTEST-2');
    expect(r.eligible).toEqual([]);
    expect(r.briefingNote).toContain('POTENTIAL MATCH (1) — every modeled criterion met; not a definitive match\n- FASTEST-2 (NCT07227246)');
    // Unmodeled registry items still remain to confirm.
    expect(toConfirm(find(r, 'FASTEST-2')[1]).join(' ')).toMatch(/spot sign/);
  });

  it('partial Encounter data alone never produces a potential match', () => {
    const lkw = { lkwDate: '2026-10-17', lkwTime: '11:30' };
    const cases = [
      encounter({ diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '0', vesselOcclusion: ['M1'], lastDOACType: 'none', ...lkw }, { nihssSource: 'reported', reportedNihss: '3', aspects: '9', details: { afDetected: 'yes' } }),
      encounter({ diagnosisCategory: 'ich', age: '70', premorbidMRS: '0', lastDOACType: 'none', ...lkw }, { gcs: { eye: '4', verbal: '5', motor: '6' }, volume: { a: '4', b: '3', thicknessMm: '5', numSlices: '8' }, details: { afDetected: 'no' } }),
      encounter({ diagnosisCategory: 'tia', age: '70', lastDOACType: 'warfarin', ...lkw }, { details: { afDetected: 'yes' } })
    ];
    for (const e of cases) {
      const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, NOW), fresh());
      const r = evaluateAll(state, screenerTrials, NOW);
      expect(potentialMatches(r), e.note.diagnosisCategory).toEqual([]);
    }
  });

  it('labels registry status as overall registry status, not local availability', () => {
    expect(enrollmentLabel(trial('STEP'))).toBe('Recruiting (registry)');
    expect(enrollmentLabel({ ...trial('CLARITY'), status: 'soon' })).toBe('Not yet recruiting (registry)');
    // CLARITY is marked recruiting (maintainer's report, 2026-10-31) while its registry record still reads NOT_YET_RECRUITING.
    expect(enrollmentLabel(trial('CLARITY'))).toBe('Recruiting (registry not yet updated)');
    expect(evaluateAll(S({ classification: 'ich' })).briefingNote.split('\n')[1]).toBe('Statuses are overall registry statuses at that check; local site activation is not confirmed.');
    const note = evaluateAll(S({ classification: 'ischemic' })).briefingNote;
    expect(note.split('\n')[1]).toBe('Statuses are overall registry statuses at that check, except where marked "registry not yet updated"; local site activation is not confirmed.');
  });
});

describe('Encounter anticoagulant "none" contradicted by the medication list (TA-F4)', () => {
  // NCT07227246 exclusion 2: OAC use within the past 7 days; NCT07260916 exclusion 6: DOAC/LMWH at ICH onset.
  it('is not imported, so the OAC prompts stay open', () => {
    const e = encounter({ diagnosisCategory: 'ich', lastDOACType: 'none', medications: 'apixaban 5 mg twice daily' });
    const p = screenerPrefillFromEncounter(e, NOW);
    expect(p.patch.anticoagulant).toBeUndefined();
    expect(p.patch.takingOac).toBeUndefined();
    expect(p.patch.exclusions).toEqual({});
    expect(p.summary.join(' ')).toContain('conflicts with medication list');
    const r = evaluateAll(applyEncounterPrefill(fresh(), p, fresh()));
    expect(toConfirm(find(r, 'FASTEST-2')[1])).toContain('Confirm no VKA or DOAC within 7 days');
    expect(toConfirm(find(r, 'MINUTE')[1])).toContain('Confirm no DOAC or LMWH at ICH onset');
  });
  it('is still imported when the medication list does not mention an anticoagulant', () => {
    const p = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich', lastDOACType: 'none', medications: 'atorvastatin' }), NOW);
    expect(p.patch).toMatchObject({ anticoagulant: 'none', takingOac: false, exclusions: { exDoacLmwhAtOnset: false, exOacWithin7d: false, exXaDtiWithin48h: false } });
  });
});

describe('the copied summary prints only facts the classification shows (TA-F5)', () => {
  it('omits NIHSS, mRS, ASPECTS and vessel for TIA', () => {
    const note = evaluateAll(S({ classification: 'tia', age: 70, nihss: 3, aspects: 9, vessel: 'ica_m1', preMrs: 1 })).briefingNote;
    expect(note).toContain('Inputs: TIA · LKW unknown · age 70\n');
  });
  it('does not import an Encounter NIHSS into the TIA screen', () => {
    const p = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'tia' }, { nihssSource: 'reported', reportedNihss: '2' }), NOW);
    expect(p.patch.nihss).toBeUndefined();
  });
  it('does not import pre-stroke mRS into the TIA screen, which has no control for it', () => {
    const p = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'tia', premorbidMRS: '2' }), NOW);
    expect(p.patch.preMrs).toBeUndefined();
    expect(p.summary.join(' ')).not.toMatch(/pre-mRS/);
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', premorbidMRS: '2' }), NOW).patch.preMrs).toBe(2);
  });
  // An Encounter import sets the ICH-only 'anticoagulant' fact as well as takingOac;
  // for ischemic/TIA the summary must still state the OAC status the screen shows.
  for (const [dx, label] of [['ischemic', 'Ischemic stroke'], ['tia', 'TIA']]) {
    it(`prints the OAC status of an Encounter-imported ${dx} screen`, () => {
      const inputsLine = drug => {
        const e = encounter({ diagnosisCategory: dx, age: '70', lastDOACType: drug }, { details: { afDetected: 'yes' } });
        const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, NOW), fresh());
        return evaluateAll(state, screenerTrials, NOW).briefingNote.split('\n').find(l => l.startsWith('Inputs: '));
      };
      const on = inputsLine('apixaban');
      expect(on).toContain('on OAC at index event');
      expect(on).not.toContain('not on OAC');
      expect(on).not.toContain('anticoagulant at onset');
      expect(on.startsWith('Inputs: ' + label)).toBe(true);
      expect(inputsLine('none')).toContain('not on OAC at index event');
    });
  }
});

describe('registry wording restored in to-confirm prompts', () => {
  it('SISTER keeps the INR ≤ 1.7 prompt after the Xa/DTI question is answered (TA-F6)', () => {
    // NCT05948566 exclusion 15: "oral anticoagulant therapy with International Normalized Ratio (INR) >1.7".
    const answered = toConfirm(evaluate('SISTER', { classification: 'ischemic', onsetVal: 10, age: 60, nihss: 6, aspects: 8, preMrs: 1, exclusions: { exXaDtiWithin48h: false } }));
    expect(answered).toContain('Confirm INR ≤ 1.7 if on warfarin/VKA');
    const unknown = toConfirm(evaluate('SISTER', { classification: 'ischemic', onsetVal: 10, age: 60, nihss: 6, aspects: 8, preMrs: 1 }));
    expect(unknown).not.toContain('Confirm INR ≤ 1.7 if on warfarin/VKA');
    expect(unknown).toContain('Confirm no Xa inhibitor or direct thrombin inhibitor within 48 h (and INR ≤ 1.7 if on VKA)');
  });

  it('the ICA chip alone is not an intracranial ICA/M1 match (TA-F7)', () => {
    // NCT06289985: "Complete occlusion of the intracranial Internal Carotid Artery (ICA) or M1".
    const vessel = v => screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', vesselOcclusion: v }), NOW);
    expect(vessel(['ICA']).patch.vessel).toBeUndefined();
    expect(vessel(['ICA']).summary.join(' ')).toContain('not imported');
    expect(vessel(['ICA', 'M1']).patch.vessel).toBe('ica_m1');
    expect(vessel(['M1']).patch.vessel).toBe('ica_m1');
    const step = evaluate('STEP', { classification: 'ischemic', onsetVal: 3, age: 70, nihss: 3, aspects: 8, preMrs: 0 });
    expect(step.matchedCriteria.join(' ')).not.toMatch(/Branch 1/);
    expect(step.pendingCriteria.some(line => line.startsWith('Confirm one pathway'))).toBe(true);
  });

  it('FASTEST-2 carries the FASTEST Part 1 result and the full registry exclusions (TA-F9)', () => {
    const t = trial('FASTEST-2');
    const gap = t.sourceGaps.find(g => g.includes('NCT03496883'));
    expect(gap).toBeTruthy();
    for (const fact of ['PMID 41653933', 'futility', '1.09', '3.41', '1.14–10.15']) expect(gap).toContain(fact);
    // NCT07227246 exclusions 11 and 22.
    expect(t.exactExclusionCriteria.join(' ')).toMatch(/unfractionated heparin with abnormal PTT/);
    expect(t.exactExclusionCriteria.join(' ')).toMatch(/lactating/);
    const pending = toConfirm(evaluate('FASTEST-2', { classification: 'ich', exclusions: { exPregnancy: false } })).join(' ');
    expect(pending).toMatch(/not lactating/);
    expect(pending).toMatch(/no UFH with abnormal PTT/);
    expect(t.externalMetadata.registryLastUpdatePosted).toBe('2026-08-20');
  });

  it('MINUTE prompts randomization within 2 h of arrival and the full secondary-cause list (TA-F10)', () => {
    // NCT07260916 inclusion 8 and exclusions 1, 10, 11.
    const c = toConfirm(evaluate('MINUTE', { classification: 'ich' })).join(' ');
    expect(c).toMatch(/randomization within 2 hours of arrival/);
    expect(c).toMatch(/hemorrhagic transformation/);
    expect(c).toMatch(/cavernous malformation/);
    expect(c).toMatch(/venous infarct/);
    expect(c).toMatch(/active infection/);
    expect(c).toMatch(/365 days/);
  });

  it('MINUTE keeps its uncovered secondary causes open after the shared answer is Absent (TA-F10)', () => {
    // NCT07260916 exclusion 1: "... vascular malformation (cavernous malformation, arteriovenous malformation, etc.),
    // aneurysm, neoplasm, hemorrhagic transformation of an underlying ischemic infarct; or venous infarct".
    // The shared item covers AVM, aneurysm, tumor, SAH, trauma, coagulopathy only.
    const facts = { classification: 'ich', age: 60, onsetVal: 3, onsetUnit: 'hours', nihss: 10, gcs: 13, preMrs: 0, ichVolume: 30, ichLocation: 'bg' };
    const absent = evaluate('MINUTE', { ...facts, exclusions: { exSecondaryIch: false, exMidbrain: false, exDoacLmwhAtOnset: false, exPregnancy: false } });
    expect(absent.status).toBe('pending');
    const lines = toConfirm(absent);
    expect(lines.filter(l => /venous infarct/.test(l))).toHaveLength(1);
    expect(lines.some(l => /cavernous/.test(l) && /hemorrhagic transformation of an underlying ischemic infarct/.test(l))).toBe(true);
    const present = evaluate('MINUTE', { ...facts, exclusions: { exSecondaryIch: true } });
    expect(present.status).toBe('excluded');
    expect(toConfirm(present).some(l => /venous infarct/.test(l))).toBe(false);
  });

  it('implausible age or volume stays unknown and matched labels show readable values (TA-F12)', () => {
    expect(toConfirm(evaluate('STEP', { classification: 'ischemic', age: 200 }))).toContain('Confirm age ≥ 18');
    expect(toConfirm(evaluate('MINUTE', { classification: 'ich', ichVolume: '1e3' }))).toContain('Confirm hematoma volume ≥20 mL by ABC/2');
    expect(evaluate('MINUTE', { classification: 'ich', ichVolume: '24.0' }).matchedCriteria).toContain('Volume 24 mL (meets ≥20 mL by ABC/2)');
    expect(evaluate('TESTED', { classification: 'ischemic', vessel: 'ica_m1' }).matchedCriteria).toContain('Vessel is intracranial ICA/M1');
  });

  it('SATURN prompts its registry secondary causes and reads its own answer, not the shared one (TO-9, r3 2026-10-22)', () => {
    // NCT03936361 exclusion 1: "... vascular abnormality or tumor, trauma, venous infarction, or hemorrhagic transformation of an ischemic infarct."
    // Since r3-trials SATURN has its own refiner item (exSaturnSecondaryCause): the shared item adds SAH and coagulopathy,
    // which this list does not name, so the shared answer no longer decides SATURN.
    const un = toConfirm(evaluate('SATURN', { classification: 'ich' })).join(' ');
    for (const re of [/vascular abnormality/, /tumor/, /trauma/, /venous infarction/, /hemorrhagic transformation of an ischemic infarct/]) expect(un).toMatch(re);
    expect(trial('SATURN').eligibility.exclusions.find(e => e.field === 'exSaturnSecondaryCause').pendingLabel).not.toMatch(/\bSAH\b/);
    const absent = evaluate('SATURN', { classification: 'ich', exclusions: { exSaturnSecondaryCause: false } });
    expect(absent.status).toBe('pending');
    expect(toConfirm(absent).some(l => /venous infarction/.test(l))).toBe(false);
    const present = evaluate('SATURN', { classification: 'ich', exclusions: { exSaturnSecondaryCause: true } });
    expect(present.status).toBe('excluded');
    expect(evaluate('SATURN', { classification: 'ich', exclusions: { exSecondaryIch: true } }).status).toBe('pending');
  });

  it('SCOUTS-3 asks about the consent-giver language, never the patient language (TO-10)', () => {
    // NCT06722755 inclusion 3: "Person providing consent (patient or legally authorized representative (LAR)) able to be consented in English or Spanish."
    const consent = 'Confirm the consent-giver (patient or legally authorized representative) can be consented in English or Spanish';
    const un = evaluate('SCOUTS-3', { classification: 'ich', onsetVal: 10, onsetUnit: 'days' });
    expect(un.status).toBe('pending');
    expect(toConfirm(un)).toContain(consent);
    expect(toConfirm(un)).not.toContain('Confirm patient speaks English or Spanish');
    const other = evaluate('SCOUTS-3', { classification: 'ischemic', onsetVal: 48, language: 'other' });
    expect(other.status).toBe('pending');
    expect(other.exclusionReasons).toEqual([]);
    // VERIFY (NCT05338697 inclusion 6) requires the participant to be fluent and stays unchanged.
    expect(toConfirm(evaluate('VERIFY', { classification: 'ischemic', onsetVal: 48 }))).toContain('Confirm patient speaks English or Spanish');
    expect(evaluate('VERIFY', { classification: 'ischemic', onsetVal: 48, language: 'other' }).exclusionReasons).toContain('Must be English or Spanish speaking');
  });

  it('INTERCEPT lists its device-specific registry exclusions (TO-11)', () => {
    // NCT05723926 exclusions 1, 4-8, 10-12.
    const r = evaluate('INTERCEPT', { classification: 'ischemic', onsetVal: 10, onsetUnit: 'days', afibHistory: true });
    expect(r.status).toBe('pending');
    const c = toConfirm(r).join(' ');
    for (const re of [/percutaneous left atrial appendage occlusion/, /planned left atrial appendage occlusion/, /nickel or titanium/, /aneurysm ≥6 mm/, /free-floating/, /neck surgery or radiation/, /overt systemic infection/, /another investigational drug or device/, /coagulation disorder/]) expect(c).toMatch(re);
    expect(trial('INTERCEPT').exactExclusionCriteria).not.toContain('Left atrial appendage occlusion device implanted after the most recent ischemic stroke, or planned LAA occlusion');
  });

  it('MR-PICS requires six calendar months and asks about cortical involvement (TO-12)', () => {
    // NCT06506279: "Minimum 6 months post-ischemic cortical stroke". Six calendar months span 181–184 days.
    const at181 = evaluate('MR-PICS', { classification: 'ischemic', onsetVal: 181, onsetUnit: 'days', age: 60 });
    expect(at181.status).toBe('soon');
    expect(at181.beforeWindow).toBe(true);
    expect(evaluate('MR-PICS', { classification: 'ischemic', onsetVal: 184, onsetUnit: 'days', age: 60 }).matchedCriteria).toContain('At least 6 calendar months (≥ 184 days) since the index ischemic stroke');
    expect(toConfirm(evaluate('MR-PICS', { classification: 'ischemic', onsetVal: 8, onsetUnit: 'months', onsetRangeHours: [4320, null] })).join(' ')).toMatch(/6 calendar months/);
    expect(toConfirm(evaluate('MR-PICS', { classification: 'ischemic' })).join(' ')).toMatch(/involved the cortex/);
  });

  it('TELE-REHAB-2 excludes a new symptomatic stroke, as the registry states', () => {
    // NCT06682429 exclusion 9: "A new symptomatic stroke has occurred since the index stroke".
    expect(EXCLUSION_ITEMS.find(i => i.id === 'exRecurrentStroke').label).toBe('New symptomatic stroke since the index stroke');
    expect(trial('TELE-REHAB-2').exactExclusionCriteria).toContain('a new symptomatic stroke has occurred since the index stroke');
  });
});

describe('CLARITY follows the 2026-10-15 registry version (TO-1)', () => {
  // NCT07174414 inclusion 2/4/5 and exclusion 1/3/5/9, read 2026-10-17.
  const base = { classification: 'ischemic', onsetVal: 30, onsetUnit: 'days', age: 65 };
  it('excludes atrial fibrillation while INTERCEPT (AF required) stays possible', () => {
    const r = evaluateAll(S({ ...base, afibHistory: true }));
    const [group, item] = find(r, 'CLARITY');
    expect(group).toBe('excluded');
    expect(item.exclusionReasons.join(' ')).toMatch(/atrial fibrillation/);
    expect(find(r, 'INTERCEPT')[0]).toBe('pending');
  });
  it('keeps the valve/LVAD prompt when AF is absent and the full prompt when AF is unknown', () => {
    expect(evaluate('CLARITY', { ...base, afibHistory: false }).pendingCriteria).toContain('Confirm no mechanical heart valve or left ventricular assist device');
    expect(find(evaluateAll(S({ ...base, afibHistory: false })), 'CLARITY')[0]).toBe('pending');
    expect(evaluate('CLARITY', base).pendingCriteria).toContain('Confirm no atrial fibrillation, mechanical heart valve or left ventricular assist device');
  });
  it('asks for ABCD2 ≥ 6 only for TIA', () => {
    expect(evaluate('CLARITY', { ...base, classification: 'tia' }).pendingCriteria.join(' ')).toMatch(/ABCD2 score ≥ 6/);
    expect(evaluate('CLARITY', base).pendingCriteria.join(' ')).not.toMatch(/ABCD2/);
  });
  it('allows single or dual antithrombotic therapy including ticagrelor and drops the inverted rule', () => {
    const t = trial('CLARITY');
    expect(JSON.stringify(t)).not.toMatch(/but not both/);
    expect(t.exactInclusionCriteria.join(' ')).toMatch(/single or dual antithrombotic therapy with aspirin, clopidogrel and\/or ticagrelor/i);
    expect(t.exactExclusionCriteria[0]).toBe('Atrial fibrillation, mechanical heart valve, or left ventricular assist device');
    expect(t.exactExclusionCriteria).toContain('Modified Rankin Scale 5');
    expect(evaluate('CLARITY', base).pendingCriteria).toContain('Confirm single or dual antithrombotic therapy with aspirin, clopidogrel and/or ticagrelor per guidelines');
    // Re-read 2026-10-31 (last update posted 2026-10-26): inclusion 4 and exclusion 1 still read as stored.
    expect(t.externalMetadata.registryLastUpdatePosted).toBe('2026-10-26');
    expect(t.sourceGaps.find(g => g.startsWith('CT.gov eligibility'))).toMatch(/^CT\.gov eligibility \(re-read 2026-10-31; last update posted 2026-10-26; criteria still match the stored wording\)/);
  });
  it('labels the heart-failure and ICH exclusions as the registry does', () => {
    expect(EXCLUSION_ITEMS.find(i => i.id === 'exCongestiveHeartFailure').label).not.toMatch(/moderate|severe/i);
    expect(EXCLUSION_ITEMS.find(i => i.id === 'exBrainBleed2y').label).toMatch(/symptomatic non-traumatic/i);
  });
  it('still reports the 180-day window and never lists CLARITY for ICH', () => {
    expect(evaluateAll(S({ classification: 'tia', onsetVal: 200, onsetUnit: 'days' })).briefingNote).toContain('- CLARITY: Stroke/TIA occurred > 180 days ago');
    const ich = evaluateAll(S({ classification: 'ich', onsetVal: 30, onsetUnit: 'days', afibHistory: true }));
    expect(relevantNotMet(ich.excluded).map(i => i.trial.acronym)).not.toContain('CLARITY');
  });
});

describe('registry check dates are truthful per profile (TO-2, TO-3, TO-4)', () => {
  it('states one date only when all listed studies share it, otherwise the range', () => {
    expect(registryCheckLabel([])).toBe('');
    expect(registryCheckLabel(['2026-10-03', null, '2026-10-03'])).toBe('registry checked 2026-10-03');
    expect(registryCheckLabel(['2026-10-17', '2026-10-03'])).toBe('registry checked 2026-10-03 to 2026-10-17');
  });

  it('puts the date range in the copied header when profiles were checked on different days', () => {
    const fixture = screenerTrials.map(t => ({ ...t, externalMetadata: { ...t.externalMetadata, verificationDate: t.acronym === 'CLARITY' ? '2026-10-17' : '2026-10-03' } }));
    const state = S({ classification: 'tia', onsetVal: 30, onsetUnit: 'days', age: 65 });
    const listed = evaluateAll(state, fixture);
    expect([...listed.pending, ...listed.soon].map(i => i.trial.acronym).sort()).toEqual(['CLARITY', 'INTERCEPT']);
    expect(listed.briefingNote.split('\n')[0]).toBe('TRIAL SCREEN — first pass (registry checked 2026-10-03 to 2026-10-17)');
    const uniform = screenerTrials.map(t => ({ ...t, externalMetadata: { ...t.externalMetadata, verificationDate: '2026-10-03' } }));
    expect(evaluateAll(state, uniform).briefingNote.split('\n')[0]).toBe('TRIAL SCREEN — first pass (registry checked 2026-10-03)');
  });

  it('counts the check age in whole local calendar days and never shows a negative age', () => {
    const at = (...parts) => new Date(...parts).getTime();
    expect(registryCheckAgeDays('2026-10-03', at(2026, 9, 17, 12))).toBe(14);
    expect(registryCheckAgeDays('2026-10-03', at(2026, 9, 17, 23, 59))).toBe(14);
    expect(registryCheckAgeDays('2026-10-03', at(2026, 9, 18, 0, 1))).toBe(15);
    expect(registryCheckAgeDays('2026-10-03', at(2026, 10, 2, 12))).toBe(30);
    expect(registryCheckAgeText('2026-10-03', at(2026, 9, 4, 8))).toBe('1 day ago');
    expect(registryCheckAgeText('2026-10-03', at(2026, 9, 3, 0, 0))).toBe('today');
    expect(registryCheckAgeText('2026-10-03', at(2026, 9, 2, 23, 59))).toBe('');
    for (const bad of [null, '', '2026-02-31', '2026-10-3', '2026-10-03T00:00:00Z']) expect(registryCheckAgeDays(bad, at(2026, 9, 17))).toBeNull();
    for (const now of [null, undefined, NaN, '2026-10-17']) expect(registryCheckAgeDays('2026-10-03', now)).toBeNull();
  });

  it('records each profile recheck consistently with its metadata', () => {
    // Exact-day LastUpdatePostDate queries (registry search index), first run on 2026-10-17 and
    // repeated on 2026-10-21: SISTER (2026-10-19), CAPPRICORN-1 and CAPTIVA (2026-10-20) were
    // updated in between; the other 13 dates were re-established unchanged. Repeated on 2026-10-31:
    // CLARITY, TELE-REHAB-2 and CAPTIVA were updated on 2026-10-26; the other 13 dates matched exactly.
    const expected = { STEP: '2025-12-04', SISTER: '2026-10-19', PICASSO: '2026-10-02', TESTED: '2026-09-02', MINUTE: '2026-09-15', 'FASTEST-2': '2026-08-20', CLARITY: '2026-10-26', INTERCEPT: '2026-08-19', ASPIRE: '2026-05-08', SATURN: '2026-04-21', 'CAPPRICORN-1': '2026-10-20', 'SCOUTS-3': '2026-08-13', VERIFY: '2026-08-20', 'MR-PICS': '2026-04-13', 'TELE-REHAB-2': '2026-10-26', CAPTIVA: '2026-10-26' };
    expect(screenerTrials.map(t => t.acronym).sort()).toEqual(Object.keys(expected).sort());
    for (const t of screenerTrials) {
      const m = t.externalMetadata;
      expect(m.registryLastUpdatePosted, t.acronym).toBe(expected[t.acronym]);
      expect(m.registryLastUpdatePosted <= m.verificationDate, t.acronym).toBe(true);
      const sentence = t.sourceGaps.map(g => /^Registry status rechecked (\d{4}-\d{2}-\d{2}): ([A-Z_]+); last update posted (\d{4}-\d{2}-\d{2})/.exec(g)).filter(Boolean);
      expect(sentence, t.acronym).toHaveLength(1);
      expect(sentence[0].slice(1), t.acronym).toEqual([m.verificationDate, m.registryStatus, m.registryLastUpdatePosted]);
    }
    expect(trial('PICASSO').sourceGaps.join(' ')).toMatch(/MT\+CAT with oral antiplatelet/);
  });
});

describe('profile metadata hygiene (TO-5, TO-6, TO-7)', () => {
  it('stores no eligibility-favouring defaults for unknown facts', () => {
    expect(screenerTrials.filter(t => Object.hasOwn(t, 'optimisticDefaults')).map(t => t.acronym)).toEqual([]);
  });
  it('gives every profile a Database classification and files CAPPRICORN-1 under ICH without screening it', () => {
    for (const t of screenerTrials) {
      const values = trialClassifications(t);
      expect(values.length, t.acronym).toBeGreaterThan(0);
      expect(values.every(v => ['ischemic', 'tia', 'ich'].includes(v)), t.acronym).toBe(true);
    }
    expect(trialClassifications(trial('CAPPRICORN-1'))).toEqual(['ich']);
    const r = evaluateAll(S({ classification: 'ich', onsetVal: 200, onsetUnit: 'days' }));
    expect(r.closed.map(i => i.trial.acronym)).toEqual(['CAPPRICORN-1']);
  });
  it('leads every profile\'s source gaps with the shared first-pass note exactly once', async () => {
    const { CTGOV_FIRST_PASS_NOTE } = await import('../screenerTrials.js');
    for (const t of screenerTrials) {
      expect(t.sourceGaps[0], t.acronym).toBe(CTGOV_FIRST_PASS_NOTE);
      expect(t.sourceGaps.filter(g => g === CTGOV_FIRST_PASS_NOTE), t.acronym).toHaveLength(1);
      expect(t.sourceGaps.length, t.acronym).toBeGreaterThan(1);
    }
  });
  it('reports the study count, not the data-key count, in the trials endpoint envelope', async () => {
    // Asserts the generator's envelope logic directly; data/trials.json is a generated output.
    const { trialsEnvelopeCounts } = await import('../../../scripts/generate-agent-assets.mjs');
    const { eligibilityTables } = await import('../eligibilityTables.js');
    const counts = trialsEnvelopeCounts(screenerTrials, eligibilityTables);
    expect(counts).toEqual({ count: 16, studyCount: 16, tableCount: eligibilityTables.length });
    expect(counts.count).not.toBe(4); // studies, tables, scope, statusCurrency
  });
});
