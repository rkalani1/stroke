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

describe('worksheet definitions', () => {
  it('mTICI 2b is more than half of the target territory (Zaidat 2013 consensus)', () => {
    expect(MTICI_DESCRIPTORS['2b']).toMatch(/more than half/);
    expect(MTICI_DESCRIPTORS['2b']).not.toMatch(/at least/);
    expect(MTICI_DESCRIPTORS['2a']).toMatch(/less than half/);
  });
  const nascet = (minimumDiameterMm, distalDiameterMm) => calculateReviewedNASCET({ side: 'left', patentExtracranialICA: true, nearOcclusion: false, minimumDiameterMm, distalDiameterMm })?.score;
  it('NASCET display never rounds up across the 50% or 70% bands', () => {
    expect(nascet(1.5016, 5)).toBe(69.9);
    expect(nascet(2.5016, 5)).toBe(49.9);
    expect(nascet(1.5, 5)).toBe(70);
    expect(nascet(2.5, 5)).toBe(50);
    expect(nascet(1.4995, 5)).toBe(70);
    expect(nascet(5, 5)).toBe(0);
    expect(nascet(0.001, 5)).toBe('>99.9');
  });
  const stopBang = (weight, heightCm) => calculateReviewedSTOPBANG({ age: '60', sex: 'M', weight, heightCm, neckCm: '38', sb_snoring: false, sb_tired: false, sb_observed: false, sb_pressure: false });
  const definition = calculatorDefinitions.find(item => item.id === 'stop-bang');
  it('STOP-BANG warns on an inch-like height and never shows BMI 35.0 beside "BMI >35"', () => {
    expect(stopBang('80', '66').heightWarning).toMatch(/confirm centimeters, not inches/);
    expect(stopBang('80', '66').score).toBe(3);
    const justAbove = stopBang('140.16', '200');
    expect(justAbove.bang.bmi).toBe(true);
    expect(calculatorResultParts({}, definition, justAbove).detail).toBe('BMI >35.0 kg/m²');
    const atThreshold = stopBang('140', '200');
    expect(atThreshold.bang.bmi).toBe(false);
    expect(atThreshold.heightWarning).toBeUndefined();
    expect(calculatorResultParts({}, definition, atThreshold).detail).toBe('BMI 35.0 kg/m²');
  });
  it('cites the NASCET method paper and the original mRS report', () => {
    const nascetDefinition = calculatorDefinitions.find(item => item.id === 'nascet');
    expect(nascetDefinition.verificationUrl).toBe('https://pmc.ncbi.nlm.nih.gov/articles/PMC7976065/');
    const mrs = calculatorDefinitions.find(item => item.id === 'mrs-descriptors');
    expect(mrs.sourceUrl).toBe('https://pubmed.ncbi.nlm.nih.gov/3363593/');
    expect(reviewedCalculatorText({ note: { premorbidMRS: '2' } }, mrs)).toContain('van Swieten');
  });
  it('keeps the calculator registry in step with the worksheet definitions', () => {
    const registry = JSON.parse(fs.readFileSync(new URL('../content/calculators/registry.json', import.meta.url), 'utf8'));
    for (const item of calculatorDefinitions) {
      const entry = registry.find(row => row.id === item.id);
      expect(entry, item.id).toBeTruthy();
      for (const key of ['name', 'category', 'fn', 'module', 'route', 'scope', 'limits', 'sourceEndpoint']) expect(entry[key], `${item.id}.${key}`).toEqual(item[key]);
    }
  });
});
