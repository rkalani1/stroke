import { describe, expect, it } from 'vitest';
import { evaluateWakeUpScreen } from '../src/encounter-clinical-review.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';

const now = new Date('2026-10-01T12:00:00');
const mri = {
  age: '60', nihss: '10', ctHemorrhageStatus: 'absent', lkwUnknown: true,
  discoveryDate: '2026-10-01', discoveryTime: '10:00',
  wakeUpStrokeWorkflow: {
    isWakeUpStroke: true, mriAvailable: true,
    dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true },
    mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: true, ageEligible: false, nihssEligible: false
  }
};
const ctp = {
  ...mri, premorbidMRS: '0', coreVolume: '20', penumbraVolume: '50',
  wakeUpStrokeWorkflow: { ...mri.wakeUpStrokeWorkflow, mriAvailable: false, sleepMidpoint: '2026-10-01T06:00' }
};
const status = note => formatWakeUpScreenForExport(note, now).split('\n')[0];

describe('canonical wake-up screen documentation', () => {
  it('qualifies a met MRI partial screen and uses actual documented age and NIHSS', () => {
    const text = formatWakeUpScreenForExport(mri, now);
    expect(text).toContain('MRI (WAKE-UP): partial source screen met; complete eligibility and drug-specific treatment decision require review.');
    expect(text).toContain('Documented age: 60; NIHSS: 10.');
    expect(text).toContain('DWI-positive lesion: documented.');
    expect(text).toContain('No marked corresponding FLAIR hyperintensity: documented.');
    expect(text).toContain('DWI lesion smaller than one-third MCA territory: yes.');
    expect(text).toContain('Symptom discovery (date/time): 2026-10-01 / 10:00.');
    expect(text).not.toMatch(/WAKE-UP eligible|IV thrombolysis eligible|Age: Eligible|Meets WAKE-UP criteria/);
  });

  it.each([undefined, false, null, 'true', 1])('requires a qualifying MRI extent finding separately from legacy review (%j)', finding => {
    const note = { ...mri, wakeUpStrokeWorkflow: {
      ...mri.wakeUpStrokeWorkflow, mriLesionExtentReviewed: true,
      dwiLesionUnderOneThirdMCA: finding
    } };
    expect(evaluateWakeUpScreen(note, now).wakeUpEligible).toBe(false);
    const text = formatWakeUpScreenForExport(note, now);
    expect(text).toContain('MRI (WAKE-UP): incomplete or not met;');
    expect(text).toContain('MRI lesion extent reviewed: documented.');
    expect(text).toContain(`DWI lesion smaller than one-third MCA territory: ${finding === false ? 'no' : 'not documented'}.`);
  });

  it('never promotes the legacy four checked criteria to eligibility', () => {
    const legacy = { wakeUpStrokeWorkflow: {
      isWakeUpStroke: true, mriAvailable: true, ageEligible: true, nihssEligible: true,
      dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }
    } };
    expect(evaluateWakeUpScreen(legacy, now).wakeUpEligible).toBe(false);
    expect(status(legacy)).toContain('MRI (WAKE-UP): incomplete or not met;');
    expect(formatWakeUpScreenForExport(legacy, now)).toContain('Documented age: not documented or invalid; NIHSS: not documented or invalid.');
  });

  it.each(['14.5', '0'])('retains recorded MRI lesion volume %s without inferring lesion extent review', lesionVolume => {
    const note = { ...mri, wakeUpStrokeWorkflow: {
      ...mri.wakeUpStrokeWorkflow, mriLesionExtentReviewed: false,
      dwi: { positiveForLesion: true, lesionVolume }
    } };
    const text = formatWakeUpScreenForExport(note, now);
    expect(text).toContain(`Recorded MRI lesion volume: ${lesionVolume} mL.`);
    expect(text).toContain('incomplete or not met;');
    expect(text).toContain('MRI lesion extent reviewed: not documented.');
  });

  it.each([
    ['missing age', { age: '' }], ['measured age overrides checked box', { age: '81' }],
    ['missing NIHSS', { nihss: '' }], ['measured NIHSS overrides checked box', { nihss: '26' }],
    ['hemorrhage not excluded', { ctHemorrhageStatus: '' }],
    ['known onset', { lkwUnknown: false }], ['missing discovery date', { discoveryDate: '' }],
    ['missing discovery time', { discoveryTime: '' }], ['expired recognition time', { discoveryTime: '06:00' }],
    ['future recognition time', { discoveryTime: '13:00' }]
  ])('uses the canonical MRI result for %s', (_label, patch) => {
    const note = { ...mri, ...patch, wakeUpStrokeWorkflow: { ...mri.wakeUpStrokeWorkflow, ageEligible: true, nihssEligible: true } };
    expect(evaluateWakeUpScreen(note, now).wakeUpEligible).toBe(false);
    expect(status(note)).toContain('MRI (WAKE-UP): incomplete or not met;');
  });

  it.each([false, undefined, null, 'true'])('does not turn unconfirmed MRI checks (%j) into negative findings', value => {
    const note = { ...mri, wakeUpStrokeWorkflow: {
      ...mri.wakeUpStrokeWorkflow, dwi: { positiveForLesion: value },
      flair: { noMarkedHyperintensity: value }, mriLesionExtentReviewed: value
    } };
    const text = formatWakeUpScreenForExport(note, now);
    expect(text).toContain('incomplete or not met;');
    expect(text).toContain('DWI-positive lesion: not documented.');
    expect(text).toContain('No marked corresponding FLAIR hyperintensity: not documented.');
    expect(text).toContain('MRI lesion extent reviewed: not documented.');
    expect(text).not.toMatch(/DWI: Negative|FLAIR: Hyperintense|DWI negative|FLAIR positive/);
  });

  it('exports CTP source measurements and its own canonical status', () => {
    const text = formatWakeUpScreenForExport(ctp, now);
    expect(text).toContain('CTP (EXTEND): partial source screen met; complete eligibility and drug-specific treatment decision require review.');
    expect(text).toContain('Documented premorbid mRS: 0.');
    expect(text).toContain('Perfusion core: 20 mL; total hypoperfused volume: 50 mL; calculated mismatch volume: 30 mL; mismatch ratio: 2.5.');
    expect(text).toContain('Sleep midpoint: 2026-10-01T06:00.');
    expect(text).not.toContain('DWI-positive lesion');
  });

  it('does not print a nonfinite derived CTP ratio as a recorded measurement', () => {
    const note = { ...ctp, coreVolume: '1e-308', penumbraVolume: '1e308' };
    const text = formatWakeUpScreenForExport(note, now);
    expect(text).toContain('mismatch ratio: not documented or invalid.');
    expect(text).not.toMatch(/Infinity|NaN/);
  });

  it.each([
    ['missing core', { coreVolume: '' }], ['core boundary', { coreVolume: '70', penumbraVolume: '110' }],
    ['missing hypoperfusion', { penumbraVolume: '' }], ['absolute mismatch boundary', { penumbraVolume: '30' }],
    ['ratio boundary', { coreVolume: '60', penumbraVolume: '72' }],
    ['missing mRS', { premorbidMRS: '' }], ['measured mRS overrides checked box', { premorbidMRS: '2' }]
  ])('uses the canonical CTP result for %s', (_label, patch) => {
    const note = { ...ctp, ...patch, wakeUpStrokeWorkflow: { ...ctp.wakeUpStrokeWorkflow, extendCriteria: {
      nihss4to26: true, premorbidMRSLt2: true, ischemicCoreLte70: true, mismatchRatioGte1_2: true, timeWindow4_5to9h: true
    } } };
    expect(evaluateWakeUpScreen(note, now).extendEligible).toBe(false);
    expect(status(note)).toContain('CTP (EXTEND): incomplete or not met;');
  });

  it('requires the selected source result even when the other source screen is met', () => {
    const onlyCtp = { ...ctp, discoveryTime: '', wakeUpStrokeWorkflow: { ...ctp.wakeUpStrokeWorkflow, mriAvailable: true } };
    expect(evaluateWakeUpScreen(onlyCtp, now)).toMatchObject({ wakeUpEligible: false, extendEligible: true });
    expect(status(onlyCtp)).toContain('MRI (WAKE-UP): incomplete or not met;');
    const onlyMri = { ...mri, wakeUpStrokeWorkflow: { ...mri.wakeUpStrokeWorkflow, mriAvailable: false } };
    expect(evaluateWakeUpScreen(onlyMri, now)).toMatchObject({ wakeUpEligible: true, extendEligible: false });
    expect(status(onlyMri)).toContain('CTP (EXTEND): incomplete or not met;');
  });

  it.each([undefined, null, 'true', 'false'])('does not infer a source pathway from %j', mriAvailable => {
    const note = { ...ctp, wakeUpStrokeWorkflow: { ...ctp.wakeUpStrokeWorkflow, mriAvailable } };
    expect(evaluateWakeUpScreen(note, now)).toMatchObject({ wakeUpEligible: true, extendEligible: true });
    expect(status(note)).toContain('pathway not documented: incomplete or not met;');
  });

  it('uses measured values rather than legacy checkbox claims and preserves zero', () => {
    const note = { ...mri, age: '81', nihss: '0', wakeUpStrokeWorkflow: { ...mri.wakeUpStrokeWorkflow, ageEligible: true, nihssEligible: true } };
    expect(formatWakeUpScreenForExport(note, now)).toContain('Documented age: 81; NIHSS: 0.');
    expect(status(note)).toContain('incomplete or not met;');
  });

  it('uses canonical structured perfusion fallback without reviving a deliberately cleared field', () => {
    const { coreVolume, penumbraVolume, ...rest } = ctp;
    const note = { ...rest, ctpStructured: { coreVolume, penumbraVolume } };
    expect(status(note)).toContain('partial source screen met;');
    expect(status({ ...note, coreVolume: '' })).toContain('incomplete or not met;');
  });

  it('reports known-onset CTP timing as entered and leaves its status to the evaluator', () => {
    const note = { ...ctp, lkwUnknown: false, lkwDate: '2026-10-01', lkwTime: '06:00' };
    const text = formatWakeUpScreenForExport(note, now);
    expect(text).toContain('CTP (EXTEND): partial source screen met;');
    expect(text).toContain('Last known well (date/time): 2026-10-01 / 06:00.');
    expect(text).not.toContain('Sleep midpoint:');
  });

  it('is read-only and re-evaluates the clock on each export', () => {
    const note = structuredClone(mri);
    const before = JSON.stringify(note);
    expect(formatWakeUpScreenForExport(note, now)).toContain('partial source screen met;');
    expect(formatWakeUpScreenForExport(note, new Date('2026-10-01T16:00:00'))).toContain('incomplete or not met;');
    expect(JSON.stringify(note)).toBe(before);
  });
});
