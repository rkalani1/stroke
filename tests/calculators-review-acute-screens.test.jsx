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

const NOT_MET_TAIL = 'This partial screen is not a contraindication to EVT; review the 2026 guideline and complete imaging.';

describe('large-core screen: SELECT2 excluded NCCT ASPECTS 0–2 (NCT03876457)', () => {
  const base = { age: 70, nihss: 15, timeFromLKWh: 10, premorbidMRS: 0, lvoLocation: 'M1' };
  const run = patch => evaluateLargeCoreEVT({ ...base, ...patch });
  it('ASPECTS 0 with core 150 mL at 10 h overlaps no modeled trial', () => {
    const r = run({ aspects: 0, coreMl: 150 });
    expect(r.matchingTrials).toEqual([]);
    expect(r.status).toBe('screen-not-met');
    expect(r.eligible).toBe(false);
    expect(r.rationale).toBe(`No modeled positive-trial branch is met. SELECT2 excluded NCCT ASPECTS 0–2 even with core ≥50 mL. ${NOT_MET_TAIL}`);
    expect(r.rationale).not.toMatch(/overlaps|  /);
  });
  it('ASPECTS 1 with core 80 mL: ANGEL-ASPECT only (ASPECTS <3 with core 70–100 mL); LASTE adds within 6.5 h', () => {
    expect(run({ aspects: 1, coreMl: 80 })).toMatchObject({ matchingTrials: ['ANGEL-ASPECT'], bestMatch: 'ANGEL-ASPECT', status: 'partial-screen-met' });
    expect(run({ aspects: 1, coreMl: 80, timeFromLKWh: 3 }).matchingTrials).toEqual(['LASTE', 'ANGEL-ASPECT']);
  });
  it('ASPECTS 2 with core 60 mL leaves only the neutral TESLA overlap', () => {
    expect(run({ aspects: 2, coreMl: 60 })).toMatchObject({ matchingTrials: ['TESLA'], status: 'screen-not-met', eligible: false });
  });
  it('ASPECTS 3–5, or ASPECTS 6–10 with core ≥50 mL, still match SELECT-2', () => {
    expect(run({ aspects: 3, coreMl: 60 }).matchingTrials).toEqual(['TENSION', 'SELECT-2', 'ANGEL-ASPECT', 'TESLA']);
    expect(run({ aspects: 7, coreMl: 60 }).matchingTrials).toEqual(['SELECT-2']);
    expect(run({ aspects: 7, coreMl: 40 }).matchingTrials).toEqual([]);
    expect(run({ aspects: 4, coreMl: 60 }).rationale).not.toContain('ASPECTS was not entered');
  });
  it('core only (ASPECTS missing) keeps SELECT-2 but says the NCCT exclusion was not checked', () => {
    const r = evaluateLargeCoreEVT({ age: 60, nihss: 16, aspects: null, coreMl: 110, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1' });
    expect(r.matchingTrials).toContain('SELECT-2');
    expect(r.eligible).toBe(true);
    expect(r.rationale).toContain('SELECT2 excluded NCCT ASPECTS 0–2; ASPECTS was not entered.');
  });
  it('punctuates the not-met rationale', () => {
    expect(run({ nihss: 4, aspects: 7, coreMl: 60 }).rationale).toBe(`No modeled positive-trial branch is met. NIHSS 4 <6 (below trial thresholds). ${NOT_MET_TAIL}`);
    expect(run({ aspects: 0 }).rationale).toBe(`No modeled positive-trial branch is met. ${NOT_MET_TAIL}`);
    expect(run({ age: 86, aspects: 0, coreMl: 150 }).rationale).not.toContain('SELECT2');
  });
});

describe('DEFUSE-3 screen applies the NCCT ASPECTS <6 exclusion (NCT02586415)', () => {
  const base = { coreMl: 60, hypoperfusedMl: 150, timeFromLKWh: 10, nihss: 15, age: 70 };
  it('withholds the partial screen for ASPECTS 5 on CT selection and keeps it for ASPECTS 6', () => {
    const r = evaluateDEFUSE3({ ...base, aspects: 5 });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/^NCCT ASPECTS 5 <6/);
    expect(r.reason).toContain('Failure to meet DEFUSE-3 does not exclude EVT');
    expect(evaluateDEFUSE3({ ...base, aspects: 6 }).eligible).toBe(true);
    expect(evaluateDEFUSE3({ ...base, aspects: '6' }).reason).not.toContain('Confirm NCCT ASPECTS');
  });
  it('asks for ASPECTS when it is missing and skips the CT-specific exclusion for MRI selection', () => {
    expect(evaluateDEFUSE3({ ...base, aspects: '' })).toMatchObject({ eligible: true });
    expect(evaluateDEFUSE3(base).reason).toContain('Confirm NCCT ASPECTS ≥6');
    expect(evaluateDEFUSE3({ ...base, aspects: 4, perfusionModality: 'mri' }).eligible).toBe(true);
  });
  it('keeps the registry boundaries: core <70, ratio ≥1.8, mismatch ≥15 mL, 6–16 h, NIHSS ≥6, age 18–90', () => {
    const d = patch => evaluateDEFUSE3({ ...base, aspects: 8, ...patch }).eligible;
    expect(d({ coreMl: 69.9, hypoperfusedMl: 140 })).toBe(true);
    expect(d({ coreMl: 70, hypoperfusedMl: 140 })).toBe(false);
    expect(d({ coreMl: 21, hypoperfusedMl: 37.8 })).toBe(true);
    expect(d({ coreMl: 10, hypoperfusedMl: 24.9 })).toBe(false);
    expect(d({ coreMl: 10, hypoperfusedMl: 25 })).toBe(true);
    expect(d({ timeFromLKWh: 16 })).toBe(true);
    expect(d({ timeFromLKWh: 16.01 })).toBe(false);
    expect(d({ timeFromLKWh: 5.99 })).toBe(false);
    expect(d({ nihss: 5 })).toBe(false);
    expect(d({ age: 90 })).toBe(true);
    expect(d({ age: 91 })).toBe(false);
  });
});

describe('DAWN tiers (NCT02142283: core <21/<31/<51 mL, 6–24 h)', () => {
  const tier = (age, nihss, coreMl, timeFromLKWh) => evaluateDAWN({ age, nihss, coreMl, timeFromLKWh });
  it('applies the strict core limits and the inclusive window', () => {
    expect(tier(80, 10, 20.9, 6).tier).toBe('A');
    expect(tier(80, 10, 21, 6).tier).toBe(null);
    expect(tier(79, 10, 30.9, 24).tier).toBe('B');
    expect(tier(79, 10, 31, 12).tier).toBe(null);
    expect(tier(79, 20, 50.9, 12).tier).toBe('C');
    expect(tier(79, 20, 51, 12).tier).toBe(null);
    expect(tier(79, 10, 10, 5.999).eligible).toBe(false);
    expect(tier(79, 10, 10, 24.001).eligible).toBe(false);
  });
});

describe('acute DAPT elapsed text agrees with the 24 h and 72 h branch edges', () => {
  const dapt = (timeFromOnsetH, nihss = 2) => recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss, strokeType: 'ischemic', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false, ichRisk: 'reviewed', timeFromOnsetH });
  it('floors inside a window and rounds up beyond it', () => {
    expect(dapt(12).rationale).toContain('within 12 h 00 min');
    expect(dapt(23.995).rationale).toContain('within 23 h 59 min');
    expect(dapt(24.004).rationale).toContain('24 h 01 min');
    expect(dapt(72.004).rationale).toContain('(72 h 01 min > 72 h)');
  });
  it('requires an explicit mechanism, genotype and hemorrhage-risk review before a regimen is shown', () => {
    expect(daptReviewComplete({ ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false })).toBe(false);
    expect(daptReviewComplete({ ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false })).toBe(true);
    expect(daptReviewComplete({ ichRisk: '', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false })).toBe(false);
    expect(daptReviewComplete(undefined)).toBe(false);
  });
});
