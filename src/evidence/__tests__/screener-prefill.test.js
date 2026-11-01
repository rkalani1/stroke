import { describe, expect, it } from 'vitest';
import { newEncounter } from '../../workspace-state.js';
import { createInitialScreenerState, evaluateAll } from '../screener-eval.js';
import { screenerPrefillFromEncounter, applyEncounterPrefill, applyAnticoagulant, anticoagulantFacts, NO_MODELED_STUDIES } from '../screener-prefill.js';

const NOW = new Date('2026-10-03T12:00:00').getTime();
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };

describe('screenerPrefillFromEncounter', () => {
  it('maps an acute ischemic encounter to screener facts and a readable summary', () => {
    const s = encounter({ diagnosisCategory: 'ischemic', age: '72', premorbidMRS: '0', lkwDate: '2026-10-03', lkwTime: '08:54', vesselOcclusion: ['M1'] }, { nihssSource: 'reported', reportedNihss: '14', aspects: '8' });
    const r = screenerPrefillFromEncounter(s, NOW);
    expect(r).toMatchObject({ available: true, supported: true, classification: 'ischemic', message: null });
    expect(r.patch).toMatchObject({ classification: 'ischemic', onsetVal: 3.1, onsetUnit: 'hours', onsetRangeHours: null, age: 72, nihss: 14, vessel: 'ica_m1', aspects: 8, preMrs: 0 });
    expect(r.summary).toEqual(['Ischemic', 'LKW 3 h 06 min', '72 y', 'NIHSS 14', 'M1', 'ASPECTS 8', 'pre-mRS 0']);
  });

  it('maps diagnoses directly and reports unmodeled ones without a patch', () => {
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'tia' }), NOW).patch.classification).toBe('tia');
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich' }), NOW).patch.classification).toBe('ich');
    for (const diagnosisCategory of ['sah', 'cvt', 'mimic']) {
      const r = screenerPrefillFromEncounter(encounter({ diagnosisCategory, age: '50' }), NOW);
      expect(r).toMatchObject({ available: true, supported: false, patch: null, message: NO_MODELED_STUDIES });
    }
  });

  it('keeps unknown facts unknown', () => {
    const r = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic' }), NOW);
    expect(r.patch).toEqual({ classification: 'ischemic', exclusions: {} });
    expect(r.summary).toEqual(['Ischemic']);
    const empty = screenerPrefillFromEncounter(newEncounter(), NOW);
    expect(empty.available).toBe(false);
  });

  it('does not treat discovery time as onset and ignores invalid or future LKW', () => {
    const unknownOnset = encounter({ diagnosisCategory: 'ischemic', lkwUnknown: true, discoveryDate: '2026-10-03', discoveryTime: '10:00' });
    expect(screenerPrefillFromEncounter(unknownOnset, NOW).patch.onsetVal).toBeUndefined();
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', lkwDate: '2026-10-03', lkwTime: '13:00' }), NOW).patch.onsetVal).toBeUndefined();
  });

  it('maps vessel segments: M1 → ica_m1, None → none, Basilar/Other → other, ICA alone and M2 stay unknown', () => {
    const vessel = v => screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', vesselOcclusion: v ? [v] : [] }), NOW).patch.vessel;
    // The registries require an intracranial ICA/M1 occlusion; the Encounter ICA chip may be cervical.
    expect(vessel('ICA')).toBeUndefined();
    expect(vessel('M1')).toBe('ica_m1');
    expect(vessel('None')).toBe('none');
    expect(vessel('Basilar')).toBe('other');
    expect(vessel('Other')).toBe('other');
    expect(vessel('M2')).toBeUndefined();
    expect(vessel('')).toBeUndefined();
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', vesselOcclusion: ['M2'] }), NOW).summary).toContain('M2 (dominance not recorded)');
  });

  it('uses reviewed GCS, ABC/2 volume and infratentorial location for ICH only', () => {
    const s = encounter({ diagnosisCategory: 'ich', age: '60' }, { gcs: { eye: '4', verbal: '4', motor: '6' }, volume: { a: '4', b: '3', thicknessMm: '5', numSlices: '8' }, ich: { ivh: false, infratentorial: true } });
    const r = screenerPrefillFromEncounter(s, NOW);
    expect(r.patch).toMatchObject({ classification: 'ich', gcs: 14, ichVolume: 24, ichLocation: 'infratentorial' });
    expect(screenerPrefillFromEncounter({ ...s, gcs: { eye: '4', verbal: 'NT', motor: '6' } }, NOW).patch.gcs).toBeUndefined();
    expect(screenerPrefillFromEncounter({ ...s, volume: { a: '40', b: '3', thicknessMm: '5', numSlices: '8' } }, NOW).patch.ichVolume).toBeUndefined();
    const ischemic = screenerPrefillFromEncounter({ ...s, note: { ...s.note, diagnosisCategory: 'ischemic' } }, NOW).patch;
    expect(ischemic.gcs).toBeUndefined();
    expect(ischemic.ichVolume).toBeUndefined();
  });

  it('maps anticoagulant exposure to OAC and exclusion facts', () => {
    const facts = (lastDOACType, extra = {}) => screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich', lastDOACType, ...extra }), NOW).patch;
    // Only exclusions a listed study reads are mapped (the 7-day OAC and 48-h Xa/DTI items left with
    // FASTEST-2 and SISTER on 2026-11-01), so each exclusion set is compared exactly.
    for (const drug of ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban']) {
      expect(facts(drug)).toMatchObject({ anticoagulant: 'doac', takingOac: true });
      expect(facts(drug).exclusions).toEqual({ exDoacLmwhAtOnset: true });
    }
    expect(facts('warfarin')).toMatchObject({ anticoagulant: 'vka', takingOac: true });
    expect(facts('warfarin').exclusions).toEqual({ exDoacLmwhAtOnset: false });
    expect(facts('lmwh')).toMatchObject({ anticoagulant: 'lmwh' });
    expect(facts('lmwh').exclusions).toEqual({ exDoacLmwhAtOnset: true });
    expect(facts('lmwh').takingOac).toBeUndefined();
    expect(facts('none')).toMatchObject({ anticoagulant: 'none', takingOac: false });
    expect(facts('none').exclusions).toEqual({ exDoacLmwhAtOnset: false });
    expect(facts('')).toEqual({ classification: 'ich', exclusions: {} });
    expect(facts('heparin')).toEqual({ classification: 'ich', exclusions: {} });
  });

  // The dose-interval exclusions (OAC ≤ 7 days, Xa/DTI ≤ 48 h) left with FASTEST-2 and SISTER; a valid
  // last-dose time now only bounds use at onset, and never answers an exclusion as absent.
  it('uses a valid last-dose time only to bound use at onset', () => {
    const at = lastDOACDose => screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', lastDOACType: 'apixaban', lastDOACDose }), NOW);
    const recent = at('2026-10-02T20:00');
    expect(recent.patch).toMatchObject({ anticoagulant: 'doac', takingOac: true });
    expect(recent.patch.exclusions).toEqual({ exDoacLmwhAtOnset: true });
    expect(recent.summary).toContain('on DOAC');
    for (const [dose, text] of [['2026-09-30T08:00', 'DOAC, last dose 76 h before now (use at onset unknown)'], ['2026-09-20T08:00', 'DOAC, last dose >7 d']]) {
      const { patch, summary } = at(dose);
      expect(patch).toMatchObject({ anticoagulant: 'unselected', takingOac: 'unselected' });
      expect(Object.entries(patch.exclusions).filter(([, value]) => value !== undefined)).toEqual([]);
      expect(summary).toContain(text);
    }
  });
});

describe('applying a prefill', () => {
  const ich = encounter({ diagnosisCategory: 'ich', age: '60', lkwDate: '2026-10-03', lkwTime: '10:30', lastDOACType: 'apixaban' }, { gcs: { eye: '4', verbal: '4', motor: '6' } });

  it('starts from a clean screen when the classification changes, and screens the result', () => {
    const before = { ...createInitialScreenerState(), classification: 'ischemic', nihss: 3, exclusions: { exTandem: true } };
    const next = applyEncounterPrefill(before, screenerPrefillFromEncounter(ich, NOW), createInitialScreenerState());
    expect(next).toMatchObject({ classification: 'ich', onsetVal: 1.5, age: 60, gcs: 14, nihss: 'unselected', anticoagulant: 'doac', takingOac: true });
    expect(next.exclusions).toEqual({ exDoacLmwhAtOnset: true });
    const results = evaluateAll(next);
    expect(results.excluded.find(i => i.trial.acronym === 'MINUTE').exclusionReasons).toEqual(['Concurrent DOAC or LMWH at ICH onset']);
  });

  it('keeps facts already entered for the same classification unless the Encounter supplies them', () => {
    const before = { ...createInitialScreenerState(), classification: 'ich', ichLocation: 'bg', exclusions: { exPregnancy: false } };
    const next = applyEncounterPrefill(before, screenerPrefillFromEncounter(ich, NOW), createInitialScreenerState());
    expect(next.ichLocation).toBe('bg');
    expect(next.exclusions).toEqual({ exPregnancy: false, exDoacLmwhAtOnset: true });
  });

  it('leaves state untouched for an unmodeled diagnosis', () => {
    const before = createInitialScreenerState();
    expect(applyEncounterPrefill(before, screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'sah' }), NOW), createInitialScreenerState())).toBe(before);
  });

  it('lets the anticoagulant fact be changed back to unknown', () => {
    const doac = applyAnticoagulant({ ...createInitialScreenerState(), exclusions: { exPregnancy: false } }, 'doac');
    expect(doac).toMatchObject({ anticoagulant: 'doac', takingOac: true });
    expect(doac.exclusions).toEqual({ exPregnancy: false, exDoacLmwhAtOnset: true });
    const unknown = applyAnticoagulant(doac, 'unselected');
    expect(unknown).toMatchObject({ anticoagulant: 'unselected', takingOac: 'unselected', exclusions: { exPregnancy: false } });
    expect(Object.keys(unknown.exclusions)).toEqual(['exPregnancy']);
    expect(anticoagulantFacts('vka').exclusions.exDoacLmwhAtOnset).toBe(false);
  });
});
