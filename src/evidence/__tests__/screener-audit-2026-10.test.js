// Regression specs for the 2026-10-03 Trials registry audit: preset-band
// endpoints, readable pending questions, and registry criteria that were
// missing from the stored profiles.
import { describe, expect, it } from 'vitest';
import { screenerTrials } from '../screenerTrials.js';
import {
  buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility,
  EXCLUSION_ITEMS, ONSET_PRESETS, pendingText, phaseLabel, toConfirm, relevantNotMet
} from '../screener-eval.js';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const preset = name => ONSET_PRESETS.find(p => p.name === name);
const withPreset = (classification, name, extra = {}) => {
  const p = preset(name);
  return { ...createInitialScreenerState(), classification, onsetVal: p.val, onsetUnit: p.unit, onsetRangeHours: p.rangeHours, ...extra };
};
const evaluate = (acronym, state) => evaluateTrialEligibility(trial(acronym), buildScreenerParams({ ...createInitialScreenerState(), ...state }));
const groupOf = (state, acronym) => {
  const r = evaluateAll(state);
  return ['eligible', 'pending', 'soon', 'excluded', 'closed'].find(k => r[k].some(i => i.trial.acronym === acronym)) || 'absent';
};

describe('preset onset bands that only touch a study limit at an endpoint (H3)', () => {
  it.each([
    ['ischemic', '24h – 7d', 'STEP', /Presentation > 24 hours/],
    ['ischemic', '24h – 7d', 'SISTER', /Outside 4\.5–24 h/],
    ['ich', '24h – 7d', 'MINUTE', /16 hours/],
    ['ich', '7 – 30d', 'SATURN', /> 7 days/],
    ['ich', '> 6mo', 'ASPIRE', /14-180 days/],
    ['ischemic', '30 – 180d', 'TESTED', /30-day/],
    ['ischemic', '30 – 180d', 'SCOUTS-3', /> 30 days ago/],
    ['ich', '30 – 180d', 'SCOUTS-3', /> 30 days ago/],
    ['ischemic', '> 6mo', 'CLARITY', /> 180 days ago/],
    ['ischemic', '> 6mo', 'TELE-REHAB-2', /90-150 days/],
    ['ischemic', '7 – 30d', 'VERIFY', /24-96h/]
  ])('%s %s resolves %s as not met', (classification, band, acronym, reason) => {
    const r = evaluateAll(withPreset(classification, band));
    const item = r.excluded.find(i => i.trial.acronym === acronym);
    expect(item, `${acronym} should be excluded`).toBeTruthy();
    expect(item.exclusionReasons.join(' ')).toMatch(reason);
  });

  it('treats a band that ends where a window starts as before the window, not as a candidate', () => {
    expect(groupOf(withPreset('ischemic', '30 – 180d'), 'MR-PICS')).toBe('soon');
    expect(evaluate('MR-PICS', withPreset('ischemic', '30 – 180d')).beforeWindow).toBe(true);
    expect(groupOf(withPreset('ischemic', '4.5 – 24h'), 'VERIFY')).toBe('soon');
    expect(evaluate('VERIFY', withPreset('ischemic', '4.5 – 24h')).beforeWindow).toBe(true);
    expect(groupOf(withPreset('ischemic', '< 4.5h'), 'SISTER')).toBe('soon');
  });

  it('keeps genuinely overlapping bands unknown instead of resolving them', () => {
    for (const [classification, band, acronym] of [
      ['ich', '7 – 30d', 'ASPIRE'], ['ich', '< 4.5h', 'FASTEST-2'], ['ischemic', '30 – 180d', 'TELE-REHAB-2'],
      ['ischemic', '30 – 180d', 'INTERCEPT'], ['ischemic', '> 6mo', 'INTERCEPT'], ['tia', '30 – 180d', 'CLARITY']
    ]) {
      const r = evaluate(acronym, withPreset(classification, band));
      expect(r.status, `${acronym} ${band}`).not.toBe('excluded');
    }
    expect(evaluate('ASPIRE', withPreset('ich', '7 – 30d')).pendingCriteria.join(' ')).toMatch(/days from LKW 14–180/);
  });

  it('resolves bands fully inside a window as met', () => {
    expect(evaluate('STEP', withPreset('ischemic', '4.5 – 24h')).matchedCriteria).toContain('Within the 24-hour presentation window');
    expect(evaluate('SATURN', withPreset('ich', '24h – 7d')).matchedCriteria).toContain('Onset within 7 days window');
  });

  it('applies the endpoint rule to every operator on a synthetic profile', () => {
    const synthetic = criterion => ({ acronym: 'X', status: 'enrolling', eligibility: { criteria: [criterion], exclusions: [] } });
    const band = (lo, hi, extra = {}) => buildScreenerParams({ ...createInitialScreenerState(), classification: 'ischemic', onsetVal: lo + 1, onsetUnit: 'hours', onsetRangeHours: [lo, hi], ...extra });
    const statusOf = (criterion, params) => evaluateTrialEligibility(synthetic(criterion), params).status;
    expect(statusOf({ field: 'onsetHours', operator: '<=', value: 24, error: 'late' }, band(24, 168))).toBe('excluded');
    expect(statusOf({ field: 'onsetHours', operator: '<', value: 24, error: 'late' }, band(24, 168))).toBe('excluded');
    expect(statusOf({ field: 'onsetHours', operator: '<=', value: 24, error: 'late' }, band(4.5, 24))).toBe('pending');
    expect(statusOf({ field: 'onsetHours', operator: '>=', value: 24, error: 'early' }, band(4.5, 24))).toBe('soon');
    expect(statusOf({ field: 'onsetHours', operator: 'between', value: [24, 96], error: 'out' }, band(96, 168))).toBe('excluded');
    expect(statusOf({ field: 'onsetHours', operator: 'between', value: [24, 96], error: 'out' }, band(0, 4.5))).toBe('soon');
    expect(statusOf({ field: 'onsetHours', operator: '<=', value: 2, error: 'late' }, band(0, 4.5))).toBe('pending');
  });
});

describe('pending criteria read as questions, never as raw templates (H4)', () => {
  it('never shows a "{value}" template or a matched label for an unknown fact', () => {
    for (const cls of ['ischemic', 'ich', 'tia']) {
      const r = evaluateAll({ ...createInitialScreenerState(), classification: cls });
      for (const item of [...r.pending, ...r.soon]) {
        for (const line of item.pendingCriteria) {
          expect(line, `${item.trial.acronym}: ${line}`).not.toMatch(/\{value\}/);
          expect(line, `${item.trial.acronym}: ${line}`).not.toMatch(/\(meets/);
        }
      }
    }
  });

  it('phrases criteria without a stored pending label from the operator and value', () => {
    expect(pendingText({ field: 'age', operator: '>=', value: 18, matchedLabel: 'Age is {value} (meets ≥ 18)' })).toBe('Confirm age ≥ 18');
    expect(pendingText({ field: 'age', operator: 'between', value: [18, 80] })).toBe('Confirm age 18–80');
    expect(pendingText({ field: 'vessel', operator: 'in', value: ['ica_m1', 'dominant_m2'] })).toBe('Confirm occlusion site is ICA/M1 or dominant M2');
    expect(pendingText({ field: 'preMrs', operator: 'in', value: [3, 4] })).toBe('Confirm pre-stroke mRS is 3 or 4');
    expect(pendingText({ field: 'afibHistory', operator: '==', value: true })).toBe('Confirm documented clinical atrial fibrillation');
    expect(pendingText({ field: 'ichLocation', operator: '==', value: 'bg' })).toBe('Confirm ICH location = basal ganglia');
    expect(pendingText({ pendingLabel: 'Custom question', field: 'age', operator: '>=', value: 18 })).toBe('Custom question');
    expect(pendingText({ operator: 'or', branches: [{ label: 'Meets Branch 1 (A)' }, { label: 'Meets Branch 2 (B)' }] })).toBe('Confirm one pathway: Branch 1 (A) OR Branch 2 (B)');
  });

  it('keeps the generic registry caveat out of per-study confirmation lists', () => {
    const r = evaluate('TESTED', { classification: 'ischemic' });
    expect(r.pendingCriteria).toContain('Full registry/protocol, local activation and consent confirmation required');
    expect(toConfirm(r)).not.toContain('Full registry/protocol, local activation and consent confirmation required');
    expect(toConfirm(r)).toContain('Confirm pre-stroke mRS is 3 or 4');
  });
});

describe('MINUTE anticoagulant and pregnancy exclusions (H2)', () => {
  const base = { classification: 'ich', onsetVal: 3, onsetUnit: 'hours', age: 60, nihss: 12, gcs: 13, preMrs: 0, ichLocation: 'bg', ichVolume: 25 };
  it('excludes concurrent DOAC or LMWH at ICH onset', () => {
    const r = evaluate('MINUTE', { ...base, exclusions: { exDoacLmwhAtOnset: true } });
    expect(r.status).toBe('excluded');
    expect(r.exclusionReasons).toEqual(['Concurrent DOAC or LMWH at ICH onset']);
  });
  it('asks about anticoagulant use and pregnancy while unknown, and clears when absent', () => {
    const unknown = evaluate('MINUTE', base);
    expect(unknown.status).toBe('pending');
    expect(unknown.pendingCriteria).toContain('Confirm no DOAC or LMWH at ICH onset');
    expect(unknown.pendingCriteria.join(' ')).toMatch(/Confirm not pregnant/);
    const absent = evaluate('MINUTE', { ...base, exclusions: { exDoacLmwhAtOnset: false, exPregnancy: false } });
    expect(absent.status).toBe('pending');
    expect(absent.pendingCriteria).not.toContain('Confirm no DOAC or LMWH at ICH onset');
    expect(evaluate('MINUTE', { ...base, exclusions: { exPregnancy: true } }).exclusionReasons).toEqual(['Pregnancy']);
  });
  it('uses the numeric ABC/2 volume threshold', () => {
    expect(evaluate('MINUTE', { ...base, ichVolume: 19.9 }).exclusionReasons).toEqual(['Requires hematoma volume ≥20 mL by ABC/2']);
    expect(evaluate('MINUTE', { ...base, ichVolume: '20' }).matchedCriteria).toContain('Volume 20 mL (meets ≥20 mL by ABC/2)');
    expect(evaluate('MINUTE', { ...base, ichVolume: 'unselected' }).pendingCriteria).toContain('Confirm hematoma volume ≥20 mL by ABC/2');
  });
  it('lists the anticoagulant exclusion separately in the stored registry criteria', () => {
    expect(trial('MINUTE').exactExclusionCriteria).toContain('Concurrent use of DOAC or LMWH at ICH onset');
    expect(EXCLUSION_ITEMS.find(i => i.id === 'exDoacLmwhAtOnset').trials).toEqual(['MINUTE']);
    expect(EXCLUSION_ITEMS.find(i => i.id === 'exPregnancy').trials).toEqual(expect.arrayContaining(['MINUTE', 'STEP', 'VERIFY', 'FASTEST-2', 'SISTER']));
  });
});

describe('INTERCEPT timing groups as an OR criterion (M3)', () => {
  const base = { classification: 'ischemic', afibHistory: true, onsetUnit: 'days' };
  it('accepts <6 weeks regardless of OAC at the index stroke', () => {
    for (const takingOac of [true, false, 'unselected']) {
      const r = evaluate('INTERCEPT', { ...base, onsetVal: 20, takingOac });
      expect(r.status).toBe('pending');
      expect(r.matchedCriteria).toContain('Timing group: index stroke <6 weeks before enrollment (any OAC status)');
    }
  });
  it('accepts 6–52 weeks only when on OAC at the index stroke', () => {
    expect(evaluate('INTERCEPT', { ...base, onsetVal: 100, takingOac: true }).matchedCriteria).toContain('Timing group: index stroke 6–52 weeks before enrollment while on OAC at the index stroke');
    const off = evaluate('INTERCEPT', { ...base, onsetVal: 100, takingOac: false });
    expect(off.status).toBe('excluded');
    expect(off.exclusionReasons.join(' ')).toMatch(/6–52 weeks only if on OAC/);
    const unknown = evaluate('INTERCEPT', { ...base, onsetVal: 100 });
    expect(unknown.status).toBe('pending');
    expect(unknown.pendingCriteria).toContain('Confirm timing group: <6 weeks from index stroke (any OAC status) OR 6–52 weeks if on OAC at the index stroke');
    expect(evaluate('INTERCEPT', { ...base, onsetVal: 400, takingOac: true }).status).toBe('excluded');
  });
  it('allows a TIA classification but requires imaging-positive confirmation', () => {
    const r = evaluate('INTERCEPT', { ...base, classification: 'tia', onsetVal: 10 });
    expect(r.status).toBe('pending');
    expect(toConfirm(r).join(' ')).toMatch(/TIA-classified event .* qualifies only with an imaging-positive infarct/);
    expect(EXCLUSION_ITEMS.filter(i => i.trials.includes('INTERCEPT')).every(i => i.classifications.includes('tia'))).toBe(true);
  });
});

describe('registry criteria added to stored profiles (M1, M2, M4, M5)', () => {
  it('STEP models seizure at onset, suspected ICAD, pregnancy and incarceration', () => {
    const fields = trial('STEP').eligibility.exclusions.map(e => e.field);
    expect(fields).toEqual(expect.arrayContaining(['exSeizureAtOnset', 'exSuspectedIcad', 'exPregnancy', 'exIncarcerated']));
    expect(trial('STEP').exactExclusionCriteria.join(' ')).toMatch(/Seizure at stroke onset.*intracranial atherosclerotic disease/s);
    const state = { classification: 'ischemic', onsetVal: 5, onsetUnit: 'hours', age: 70, nihss: 3, vessel: 'ica_m1', preMrs: 0, aspects: 9 };
    expect(evaluate('STEP', state).status).toBe('pending');
    expect(evaluate('STEP', { ...state, exclusions: { exSuspectedIcad: true } }).status).toBe('excluded');
    expect(evaluate('STEP', { ...state, exclusions: { exSeizureAtOnset: true } }).status).toBe('excluded');
  });
  it('SATURN lists childbearing potential, severe dementia, FH/PCSK9 and planned withdrawal of care', () => {
    const text = trial('SATURN').exactExclusionCriteria.join(' ');
    for (const term of [/childbearing potential/, /severe dementia/, /familial hypercholesterolemia or receiving a PCSK9 inhibitor/, /withdrawal of care/]) expect(text).toMatch(term);
    expect(evaluate('SATURN', { classification: 'ich' }).pendingCriteria.join(' ')).toMatch(/not a woman of childbearing potential.*PCSK9.*withdrawal of care/);
  });
  it('VERIFY excludes pregnancy and lists cerebellar and non-paretic-arm exclusions', () => {
    expect(trial('VERIFY').exactExclusionCriteria).toEqual(expect.arrayContaining(['Pregnancy', 'Isolated cerebellar stroke', 'Unable to abduct the shoulder or extend the fingers of the non-paretic arm on verbal command']));
    expect(evaluate('VERIFY', { classification: 'ischemic', exclusions: { exPregnancy: true } }).exclusionReasons).toContain('Pregnancy');
  });
  it('uses the registry brief title for CAPPRICORN-1 and keeps not-enrolling profiles out of screening', () => {
    expect(trial('CAPPRICORN-1').exactFullStudyName).toBe('A Phase 2 Trial of ALN-APP in Patients With Cerebral Amyloid Angiopathy');
    expect(trial('CAPPRICORN-1').externalMetadata.registryAcronym).toBe('cAPPricorn-1');
    for (const acronym of ['CAPPRICORN-1', 'CAPTIVA']) {
      expect(trial(acronym).status).toBe('closed');
      expect(trial(acronym).externalMetadata.registryStatus).toBe('ACTIVE_NOT_RECRUITING');
      expect(EXCLUSION_ITEMS.some(i => i.trials.includes(acronym))).toBe(false);
    }
  });
  it('does not assert an unsourced CAPTIVA arm termination', () => {
    const text = JSON.stringify(trial('CAPTIVA'));
    expect(text).not.toMatch(/terminat/i);
    expect(text).toMatch(/arm-level changes are not verified/);
  });
  it('labels phase and study type for every profile', () => {
    const labels = Object.fromEntries(screenerTrials.map(t => [t.acronym, phaseLabel(t.externalMetadata)]));
    expect(labels).toMatchObject({ STEP: 'Phase N/A', TESTED: 'Observational', MINUTE: 'Phase N/A', CLARITY: 'Phase 3', INTERCEPT: 'Phase N/A', ASPIRE: 'Phase 3', SATURN: 'Phase 3', 'CAPPRICORN-1': 'Phase 2', 'SCOUTS-3': 'Phase N/A', VERIFY: 'Observational', 'MR-PICS': 'Phase N/A', 'TELE-REHAB-2': 'Phase N/A', PICASSO: 'Phase 3', CAPTIVA: 'Phase 3', 'FASTEST-2': 'Phase 3', SISTER: 'Phase 2' });
    expect(phaseLabel({ phase: 'PHASE2/PHASE3', studyType: 'INTERVENTIONAL' })).toBe('Phase 2/3');
  });
});

describe('new StrokeNet profiles (FASTEST Part 2, SISTER)', () => {
  it('screens FASTEST Part 2 on time, volume, GCS and recent oral anticoagulant', () => {
    const base = { classification: 'ich', onsetVal: 1.5, onsetUnit: 'hours', age: 60, gcs: 13, preMrs: 0, ichVolume: 25 };
    expect(evaluate('FASTEST-2', base).status).toBe('pending');
    expect(evaluate('FASTEST-2', { ...base, onsetVal: 3 }).exclusionReasons).toEqual(['Beyond 120 minutes from onset/LKW']);
    expect(evaluate('FASTEST-2', { ...base, ichVolume: 60 }).exclusionReasons).toEqual(['ICH volume <2 mL or ≥60 mL']);
    expect(evaluate('FASTEST-2', { ...base, gcs: 7 }).exclusionReasons).toEqual(['GCS 3–7']);
    expect(evaluate('FASTEST-2', { ...base, exclusions: { exOacWithin7d: true } }).exclusionReasons).toEqual(['Oral anticoagulant (VKA or DOAC) within 7 days']);
    expect(trial('FASTEST-2').externalMetadata).toMatchObject({ nct: 'NCT07227246', registryStatus: 'RECRUITING', localActivationStatus: 'not_assessed' });
  });
  it('screens SISTER on the 4.5–24 h window, NIHSS, ASPECTS and thrombolysis', () => {
    const base = { classification: 'ischemic', onsetVal: 10, onsetUnit: 'hours', age: 70, nihss: 8, aspects: 8, preMrs: 1 };
    expect(evaluate('SISTER', base).status).toBe('pending');
    expect(evaluate('SISTER', { ...base, onsetVal: 3 }).beforeWindow).toBe(true);
    expect(evaluate('SISTER', { ...base, exclusions: { exIvtGivenOrPlanned: true } }).exclusionReasons).toEqual(['Received or planned IV thrombolysis']);
    expect(evaluate('SISTER', { ...base, nihss: 3 }).exclusionReasons).toEqual(['NIHSS < 4']);
  });
});

describe('exclusion review items and not-met reporting', () => {
  it('maps each item only to screenable profiles that use it', () => {
    for (const item of EXCLUSION_ITEMS) for (const acronym of item.trials) {
      const t = trial(acronym);
      expect(t && !t.referenceOnly && ['enrolling', 'soon'].includes(t.status), `${item.id} → ${acronym}`).toBe(true);
      expect(t.eligibility.exclusions.some(e => e.field === item.id), `${item.id} → ${acronym}`).toBe(true);
    }
    for (const id of ['exEgfr35', 'exMriContraindication', 'exRecentSurgery30d', 'exBilateralCarotidRevasc', 'exCaaCognitiveImpairment', 'exEgfr30']) expect(EXCLUSION_ITEMS.some(i => i.id === id), id).toBe(false);
  });
  it('omits studies for another stroke type from not-met lists', () => {
    const r = evaluateAll({ ...createInitialScreenerState(), classification: 'ich', onsetVal: 2, onsetUnit: 'hours', gcs: 6 });
    expect(r.excluded.some(i => i.trial.acronym === 'STEP')).toBe(true);
    expect(relevantNotMet(r.excluded).map(i => i.trial.acronym).sort()).toEqual(['FASTEST-2', 'MINUTE']);
  });
  it('records explicitly assessed exclusions in the copied summary', () => {
    const r = evaluateAll({ ...createInitialScreenerState(), classification: 'ich', onsetVal: 2, onsetUnit: 'hours', anticoagulant: 'doac', takingOac: true, exclusions: { exDoacLmwhAtOnset: true, exPregnancy: false } });
    expect(r.briefingNote).toContain('Inputs: Hemorrhage (ICH) · LKW 2.0 h · anticoagulant at onset: DOAC');
    expect(r.briefingNote).toContain('Exclusions recorded: DOAC or LMWH at ICH onset: present; Pregnancy: absent');
    expect(r.briefingNote).toContain('- MINUTE: Concurrent DOAC or LMWH at ICH onset');
    const ischemic = evaluateAll({ ...createInitialScreenerState(), classification: 'ischemic', exclusions: { exDoacLmwhAtOnset: false, exTandem: true } });
    expect(ischemic.briefingNote).toContain('Exclusions recorded: Tandem occlusions (cervical + intracranial): present');
    expect(ischemic.briefingNote).not.toContain('ICH onset');
  });
});
