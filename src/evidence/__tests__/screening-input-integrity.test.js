import { describe, it, expect } from 'vitest';
import { evaluateCriterion, evaluateActiveTrial, resolveField } from '../matcher-engine.js';
import { activeTrials } from '../activeTrials.js';
import { screenerTrials } from '../screenerTrials.js';
import { buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility, ONSET_PRESETS } from '../screener-eval.js';
const step = activeTrials.find(t => t.id === 'step-evt');
const saturn = screenerTrials.find(t => t.acronym === 'SATURN');
const af = { field: 'pmh', operator: 'present', value: ['afib', 'atrial fibrillation'] };

describe('partial screening preserves source uncertainty', () => {
  it.each([' ', [], {}, 'false', 0, 1])('does not coerce a malformed boolean exclusion: %j', value => {
    expect(evaluateCriterion({ field: 'pregnancy', operator: 'truthy' }, { pregnancy: value })).toBe('unknown');
    expect(evaluateCriterion({ field: 'pregnancy', operator: '==', value: true }, { pregnancy: value })).toBe('unknown');
  });
  it.each(['Hypertension and diabetes', 'Possible atrial fibrillation', 'Cannot exclude atrial fibrillation', 'Family history of atrial fibrillation', 'No atrial fibrillation. Atrial fibrillation on ECG.', 'No atrial fibrillation but atrial fibrillation on ECG.'])('does not turn incomplete or conflicting prose into a clinical fact: %s', pmh => {
    expect(evaluateCriterion(af, { telestrokeNote: { pmh } })).toBe('unknown');
  });
  it.each([[], [''], [' '], [null]])('rejects a malformed free-text criterion without looping: %j', value => {
    expect(evaluateCriterion({ ...af, value }, { telestrokeNote: { pmh: 'Known atrial fibrillation' } })).toBe('unknown');
  });
  it('distinguishes affirmative documentation from explicit absence on either side of the term', () => {
    expect(evaluateCriterion(af, { telestrokeNote: { pmh: 'Known atrial fibrillation' } })).toBe('met');
    expect(evaluateCriterion(af, { telestrokeNote: { pmh: 'No atrial fibrillation' } })).toBe('not_met');
    expect(evaluateCriterion(af, { telestrokeNote: { pmh: 'Atrial fibrillation ruled out' } })).toBe('not_met');
    expect(evaluateCriterion(af, { telestrokeNote: { pmh: 'Not atrial fibrillation' } })).toBe('not_met');
  });
  it.each(['Atrial fibrillation?', 'Query atrial fibrillation', 'Atrial fibrillation not confirmed', 'Atrial fibrillation unlikely'])('does not promote unresolved prose: %s', pmh => {
    expect(evaluateCriterion(af, { telestrokeNote: { pmh } })).toBe('unknown');
  });
  it('does not equate the combined ischemic/TIA Encounter category with a qualifying acute infarct', () => {
    const criterion = activeTrials.find(t => t.id === 'picasso').matcherCriteria.find(c => c.field === 'acuteIschemicStroke');
    expect(evaluateCriterion(criterion, { telestrokeNote: { diagnosisCategory: 'ischemic' } })).toBe('unknown');
    expect(evaluateCriterion(criterion, { telestrokeNote: { diagnosisCategory: 'ich' } })).toBe('not_met');
    expect(evaluateCriterion(criterion, { acuteIschemicStroke: true, telestrokeNote: { diagnosisCategory: 'ischemic' } })).toBe('met');
  });
  it.each(['M3', { vessel: 'M3' }, ['None', 'M3'], [null]])('requires an unambiguous structured vessel list: %j', vesselOcclusion => {
    expect(resolveField('domainMatch', { telestrokeNote: { nihss: 8, vesselOcclusion } })).toBeNull();
  });
  it.each([-1, 43, 99, 8.5])('rejects impossible or fractional NIHSS in the STEP domain: %s', nihss => {
    expect(resolveField('domainMatch', { telestrokeNote: { nihss, vesselOcclusion: ['M3'] } })).toBeNull();
    expect(evaluateCriterion({ field: 'nihss', operator: '>=', value: 6 }, { telestrokeNote: { nihss } })).toBe('unknown');
  });
  it('preserves real zero scores and fractional elapsed time', () => {
    expect(evaluateCriterion({ field: 'nihss', operator: '<=', value: 5 }, { telestrokeNote: { nihss: 0 } })).toBe('met');
    expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '<=', value: 4.5 }, { hoursFromLKW: 4.6 })).toBe('not_met');
    expect(evaluateCriterion({ field: 'hoursFromLKW', operator: '<=', value: 4.5 }, { hoursFromLKW: -1 })).toBe('unknown');
  });
  it('does not choose one of conflicting M2 dominance observations', () => {
    expect(resolveField('domainMatch', { culpritM2Dominance: 'dominant', telestrokeNote: { nihss: 8, vesselOcclusion: ['M2'], culpritM2Dominance: 'non-dominant' } })).toBeNull();
  });
  it('keeps conflicting structured observations unknown', () => {
    expect(resolveField('upperExtremityWeakness', { upperExtremityWeakness: true, telestrokeNote: { upperExtremityWeakness: false } })).toBeNull();
    expect(resolveField('mriAspectsScore', { mriAspectsScore: 6, telestrokeNote: { mriAspectsScore: 9 } })).toBeNull();
    expect(resolveField('mriAspectsScore', { mriAspectsScore: 6, telestrokeNote: { mriAspectsScore: '6' } })).toBe(6);
    expect(resolveField('acuteIschemicStroke', { acuteIschemicStroke: true, telestrokeNote: { acuteIschemicStroke: false } })).toBeNull();
    expect(resolveField('acuteIschemicStroke', { acuteIschemicStroke: true, telestrokeNote: { diagnosisCategory: 'ich' } })).toBeNull();
  });
  it('does not reuse CT ASPECTS merely because MRI is available', () => {
    const d = { aspectsScore: 6, telestrokeNote: { age: 60, nihss: 4, premorbidMRS: 0, vesselOcclusion: ['M1'], wakeUpStrokeWorkflow: { mriAvailable: true } }, hoursFromLKW: 4 };
    const r = evaluateActiveTrial(step, d);
    expect(r.exclusions.some(x => x.id === 'lowAspectsMri')).toBe(false);
    expect(r.unknownExclusions.some(x => x.id === 'lowAspectsMri')).toBe(true);
    expect(evaluateActiveTrial(step, { ...d, mriAspectsScore: 6 }).exclusions.some(x => x.id === 'lowAspectsMri')).toBe(true);
    expect(evaluateActiveTrial(step, { ...d, mriAspectsScore: 7 }).exclusions.some(x => x.id === 'lowAspectsMri')).toBe(false);
  });
  it('does not infer VERIFY upper-limb weakness from arm pain or leg weakness', () => {
    const criterion = activeTrials.find(t => t.id === 'verify').matcherCriteria.find(c => c.field === 'upperExtremityWeakness');
    for (const symptoms of ['Arm pain', 'Leg weakness', 'No arm weakness']) {
      expect(evaluateCriterion(criterion, { telestrokeNote: { symptoms } })).toBe('unknown');
    }
    expect(evaluateCriterion(criterion, { upperExtremityWeakness: true })).toBe('met');
    expect(evaluateCriterion(criterion, { upperExtremityWeakness: false })).toBe('not_met');
  });
  it('requires documented M2 dominance for TESTED', () => {
    const criterion = activeTrials.find(t => t.id === 'tested').matcherCriteria.find(c => c.field === 'testedVessel');
    const data = { telestrokeNote: { vesselOcclusion: ['M2'] } };
    expect(evaluateCriterion(criterion, data)).toBe('unknown');
    expect(evaluateCriterion(criterion, { ...data, culpritM2Dominance: 'dominant' })).toBe('met');
    expect(evaluateCriterion(criterion, { ...data, culpritM2Dominance: 'non-dominant' })).toBe('not_met');
    expect(evaluateCriterion(criterion, { telestrokeNote: { vesselOcclusion: ['M1'] } })).toBe('met');
  });
  it('does not mistake nonlobar ICH for lobar by substring matching', () => {
    const criterion = activeTrials.find(t => t.id === 'saturn').matcherCriteria.find(c => c.field === 'ichLocation');
    expect(evaluateCriterion(criterion, { ichLocation: 'nonlobar' })).toBe('not_met');
    expect(evaluateCriterion(criterion, { ichLocation: 'lobar' })).toBe('met');
    expect(evaluateCriterion(criterion, {})).toBe('unknown');
  });
  it.each([' ', [], {}, 'false'])('keeps a malformed required statin observation pending: %j', statin => {
    const p = buildScreenerParams({ ...createInitialScreenerState(), classification: 'ich', age: 70, onsetVal: 24, onsetUnit: 'hours', ichLocation: 'lobar', statin });
    const r = evaluateTrialEligibility(saturn, p);
    expect(r.status).toBe('pending');
    expect(r.pendingFields).toContain('statin');
    expect(r.exclusionReasons).not.toContain('Requires patient to be taking a statin at onset');
    expect(evaluateTrialEligibility(saturn, { ...p, statin: false }).status).toBe('excluded');
  });
  it('keeps invalid categorical inputs unknown instead of excluding the patient', () => {
    const p = buildScreenerParams({ ...createInitialScreenerState(), classification: 'ich', age: 70, onsetVal: 24, onsetUnit: 'hours', ichLocation: 'garbage', statin: true });
    const r = evaluateTrialEligibility(saturn, p);
    expect(r.status).toBe('pending');
    expect(r.pendingFields).toContain('ichLocation');
    expect(evaluateTrialEligibility(saturn, { ...p, ichLocation: 'bg' }).status).toBe('excluded');
  });
  it.each([[24, 4], [-1, 24], ['0', 24], [0, Infinity], [0], [100, 200]])('does not use malformed or contradictory onset ranges: %j', onsetRangeHours => {
    const state = { ...createInitialScreenerState(), classification: 'ischemic', onsetVal: 2, onsetUnit: 'hours', onsetRangeHours };
    const r = evaluateAll(state);
    expect(r.params.onsetHours).toBeNull();
    expect(r.timeCategory).toBe('unknown');
    expect(r.briefingNote).toContain('Onset window: Not recorded');
  });
  it.each([' ', 'invalid', [], {}])('does not screen an unknown classification: %j', classification => {
    const r = evaluateAll({ ...createInitialScreenerState(), classification });
    expect(r.ready).toBe(false);
    expect(r.briefingNote).toBe('');
  });
  it('retains Spanish as documented rather than replacing it with an unknown value', () => {
    expect(buildScreenerParams({ ...createInitialScreenerState(), language: 'spanish' }).language).toBe('spanish');
  });
  it('never certifies eligibility across all UI classification/time presets', () => {
    for (const classification of ['ischemic', 'tia', 'ich']) for (const preset of ONSET_PRESETS) {
      const r = evaluateAll({ ...createInitialScreenerState(), classification, onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours });
      expect(r.eligible).toEqual([]);
      expect(r.closed.every(x => x.status === 'closed')).toBe(true);
    }
  });
});
