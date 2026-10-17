// Calculator review 2026-10-17. Expected values come from the source definitions
// (trial registries, Kothari ABC/2, Cockcroft–Gault, the mTICI consensus), not from the code.
import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter, protocolEncounter } from '../src/workspace-state.js';
import { calculateCrClReviewed, abc2ThicknessCaution } from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3, evaluateLargeCoreEVT, recommendAcuteDAPT, daptReviewComplete } from '../src/calculators-extended.js';
import { evaluateVideoTreatment, evaluateWakeUpScreen, wakeUpPremorbidGap } from '../src/encounter-clinical-review.js';
import { MTICI_DESCRIPTORS, calculateReviewedNASCET, calculateReviewedSTOPBANG } from '../src/supplementary-calculators.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { calculatorResultParts, reviewedCalculatorText } from '../src/calculator-utilities.js';
import { completeCases } from './fixtures/clinical-complete-cases.js';

const renderEncounter = patch => {
  const state = newEncounter();
  Object.assign(state, patch.state || {});
  Object.assign(state.note, patch.note || {});
  return renderToStaticMarkup(<Encounter state={state} update={() => {}} now={patch.now ?? Date.parse('2026-10-17T18:00:00Z')} />);
};

describe('Cockcroft–Gault creatinine unit and height plausibility', () => {
  it('prompts for µmol/L above 20 mg/dL without changing the arithmetic', () => {
    const r = calculateCrClReviewed(70, 80, 'M', 88);
    expect(r.unitWarning).toMatch(/µmol\/L/);
    expect(r.unitWarning).toMatch(/88\.4/);
    expect(r.rawValue).toBeCloseTo(5600 / 6336, 12);
    expect(calculateCrClReviewed(70, 80, 'M', 20)).toMatchObject({ unitWarning: null, value: 3.9 });
    expect(calculateCrClReviewed(70, 80, 'M', 20.01).unitWarning).not.toBeNull();
    expect(calculateCrClReviewed(70, 80, 'F', 88).unitWarning).not.toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1)).toMatchObject({ value: 77.8, unitWarning: null });
    expect(calculateCrClReviewed(70, 80, 'M', 88 / 88.4)).toMatchObject({ value: 78.1, unitWarning: null });
  });
  it('flags a height outside 120–230 cm; adjusted weight remains for a plausible height', () => {
    expect(calculateCrClReviewed(70, 80, 'M', 1, 66)).toMatchObject({ value: 77.8, heightWarning: expect.stringMatching(/centimeters, not inches/) });
    expect(calculateCrClReviewed(70, 80, 'M', 1, 119.9).heightWarning).not.toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1, 120).heightWarning).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1, 230).heightWarning).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1, 230.1).heightWarning).not.toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1).heightWarning).toBeNull();
    // Female 170 cm, 100 kg: IBW 45.5 + 2.3 × (66.929 − 60) = 61.44; AdjBW 61.44 + 0.4 × 38.56 = 76.86; 70 × 76.86 × 0.85 / 72 = 63.5.
    expect(calculateCrClReviewed(70, 100, 'F', 1, 170)).toMatchObject({ adjBwValue: 63.5, heightWarning: null });
  });
  it('shows the unit prompt instead of a CrCl in the Encounter', () => {
    const html = renderEncounter({ note: { age: '70', weight: '80', sex: 'M', creatinine: '88' } });
    expect(html).toContain('divide by 88.4');
    expect(html).not.toContain('Cockcroft–Gault 0.9');
    expect(html).not.toContain('Unrounded calculation with actual weight');
    const normal = renderEncounter({ note: { age: '70', weight: '80', sex: 'M', creatinine: '1' } });
    expect(normal).toContain('Cockcroft–Gault 77.8 mL/min');
    expect(normal).not.toContain('divide by 88.4');
  });
  it('omits the adjusted-weight estimate when the height looks like inches', () => {
    const html = renderEncounter({ note: { age: '70', weight: '80', sex: 'M', creatinine: '1', heightCm: '66' } });
    expect(html).toContain('Cockcroft–Gault 77.8 mL/min');
    expect(html).toContain('confirm centimeters, not inches');
    expect(html).not.toContain('adjusted weight');
  });
});

describe('ABC/2 slice thickness entered in centimeters (Kothari: C = slices × thickness)', () => {
  const v = (a, b, thicknessMm, numSlices) => abc2ThicknessCaution({ a, b, thicknessMm, numSlices });
  it('cautions when C is implausibly small for A × B with a thickness of 1 mm or less', () => {
    expect(v('5', '4', '0.5', '6')).toMatchObject({ cCm: 0.3 });
    expect(v('5', '4', '1', '6')).toMatchObject({ cCm: 0.6 });
    expect(v('5', '4', '0.7', '3').cCm).toBe(0.21);
    expect(v('1', '1', '0.5', '4')).toMatchObject({ cCm: 0.2 });
    for (const args of [['5', '4', '5', '6'], ['5', '4', '0.625', '48'], ['5', '4', '0.5', '60'], ['5', '4', '0.625', '32'], ['5', '4', '', '6'], ['5', '4', '0.5', '1.5']]) expect(v(...args)).toBeNull();
  });
  const ich = volume => renderEncounter({ state: { volume, ich: { ivh: false, infratentorial: false }, gcs: { eye: '3', verbal: '4', motor: '6' } }, note: { diagnosisCategory: 'ich', age: '70' } });
  it('keeps the estimate visible with a non-blocking caution beside volume and score', () => {
    const html = ich({ a: '5', b: '4', thicknessMm: '0.5', numSlices: '6' });
    expect(html).toContain('ABC/2 3 mL: C (slices × thickness) = 0.3 cm');
    expect(html).toContain('ICH score 0/6');
    expect(html).toContain('The ICH score volume point is unconfirmed until the units are checked.');
    const correct = ich({ a: '5', b: '4', thicknessMm: '5', numSlices: '6' });
    expect(correct).toContain('30 mL');
    expect(correct).toContain('ICH score 1/6');
    expect(correct).not.toContain('C (slices × thickness)');
  });
});

describe('Encounter dose plausibility cautions (locked dose arithmetic unchanged)', () => {
  const dose = (weight, age = '70') => renderEncounter({ state: { drug: 'TNK' }, note: { diagnosisCategory: 'ischemic', weight, age } });
  it('cautions below 30 kg and under age 18', () => {
    expect(dose('8')).toContain('Weight below 30 kg is implausible for adult AIS dosing');
    expect(dose('8')).toContain('TNK 2 mg');
    expect(dose('29.9')).toContain('Weight below 30 kg');
    expect(dose('30')).toContain('TNK 7.5 mg');
    expect(dose('30')).not.toContain('Weight below 30 kg');
    expect(dose('60', '17')).toContain('Age under 18: these are adult AIS dose references');
    expect(dose('80')).toContain('TNK 20 mg');
    expect(dose('80')).not.toMatch(/Weight below 30 kg|Age under 18/);
  });
});

describe('WAKE-UP pre-stroke mRS 0–1 (NCT01525290) on a separate Encounter-only path', () => {
  const now = new Date('2026-10-17T12:00:00');
  const mri = mrs => ({ diagnosisCategory: 'ischemic', age: '70', nihss: '8', disablingDeficit: true, ctHemorrhageStatus: 'absent', lkwUnknown: true, discoveryDate: '2026-10-17', discoveryTime: '10:00', presentingBP: '150/85', glucose: '120', lastDOACType: 'none', ivtContraindicationsReviewed: true, premorbidMRS: mrs,
    wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: true } });
  it('returns a gap for mRS above 1 or missing, and none for mRS 0–1', () => {
    for (const mrs of ['0', '1']) expect(wakeUpPremorbidGap(mri(mrs), now)).toBeNull();
    expect(wakeUpPremorbidGap(mri('4'), now)).toContain('pre-stroke mRS 4 is outside the WAKE-UP population (mRS 0–1)');
    for (const mrs of ['', undefined, '1.5', 'x', '7']) expect(wakeUpPremorbidGap(mri(mrs), now)).toContain('pre-stroke mRS is not documented');
    expect(wakeUpPremorbidGap({ ...mri('4'), wakeUpStrokeWorkflow: { mriAvailable: true } }, now)).toBeNull();
  });
  it('leaves the shared screen outputs unchanged', () => {
    for (const mrs of ['0', '4', '']) {
      expect(evaluateWakeUpScreen(mri(mrs), now).wakeUpEligible).toBe(true);
      expect(evaluateVideoTreatment({ note: mri(mrs), clock: null, now }).tnk.reason).toMatch(/^Imaging-selected partial screen met/);
    }
  });
  it('shows the gap on the Encounter imaging-selected line', () => {
    const render = mrs => renderEncounter({ now: now.getTime(), state: { nihssSource: 'reported', reportedNihss: '8' }, note: { ...mri(mrs), nihss: undefined } });
    expect(render('4')).toContain('Imaging-selected IVT: WAKE-UP MRI, recognition-time, age and NIHSS criteria are documented, but pre-stroke mRS 4 is outside');
    expect(render('0')).toContain('Imaging-selected IVT: Partial source screen met');
  });
  it('keeps the Protocols projection identical (IVT-held banner state)', () => {
    const state = mrs => { const s = newEncounter(); Object.assign(s.note, { ...mri(mrs), lkwUnknown: false, lkwDate: '2026-10-17', lkwTime: '04:00', presentingBP: '190/100' }); s.nihssSource = 'reported'; s.reportedNihss = '8'; return s; };
    const projection = mrs => protocolEncounter(state(mrs), now.getTime());
    for (const mrs of ['4', '']) expect(projection(mrs)).toMatchObject({ safetyReviewRequired: true, safetyReviewSeverity: 'critical', safetyReviewReason: 'Correct the recorded BP or severe glucose derangement and reassess persistent deficits before an IVT decision; no eligibility is inferred from this screen.' });
  });
});
