import { describe, test, expect } from 'vitest';
import {
  evaluateCRAOTreatment,
  calculateSeLECTScore,
  calculateEDEMAScore
} from '../src/calculators-extended.js';

describe('Empirical Stress Testing — evaluateCRAOTreatment', () => {
  test('Baseline valid eligible CRAO patient', () => {
    const result = evaluateCRAOTreatment({
      onsetHours: 2.5,
      visualAcuity: 'hand-motion',
      fundusHemorrhage: false,
      ivtContraindicated: false,
      age: 62
    });
    expect(result).not.toBeNull();
    expect(result.eligible).toBe(true);
    expect(result.contraindications).toHaveLength(0);
  });

  test('Onset hours boundary conditions and extreme values', () => {
    // 0h: boundary start
    expect(evaluateCRAOTreatment({ onsetHours: 0, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false, age: 50 }).eligible).toBe(true);
    
    // 4.5h: exact upper limit
    expect(evaluateCRAOTreatment({ onsetHours: 4.5, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false, age: 50 }).eligible).toBe(true);
    
    // 4.5001h: just above window
    const resultOver = evaluateCRAOTreatment({ onsetHours: 4.5001, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false, age: 50 });
    expect(resultOver.eligible).toBe(false);
    expect(resultOver.contraindications).toContain('Onset 4.5001h exceeds 4.5h window');

    // Negative onset hours (-1h)
    const resultNeg = evaluateCRAOTreatment({ onsetHours: -1, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false, age: 50 });
    expect(resultNeg.eligible).toBe(false);
    expect(resultNeg.contraindications).toContain('Onset -1h exceeds 4.5h window');

    // Invalid / missing onset hours
    expect(evaluateCRAOTreatment({ onsetHours: 'invalid' })).toBeNull();
    expect(evaluateCRAOTreatment({ onsetHours: null })).toBeNull();
    expect(evaluateCRAOTreatment({ onsetHours: undefined })).toBeNull();
    expect(evaluateCRAOTreatment({})).toBeNull();
    expect(evaluateCRAOTreatment()).toBeNull();
  });

  test('Age boundary conditions', () => {
    // Age 18 (boundary ok)
    expect(evaluateCRAOTreatment({ onsetHours: 2, age: 18, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false }).eligible).toBe(true);
    
    // Age 17.9 (underage)
    const resPed = evaluateCRAOTreatment({ onsetHours: 2, age: 17.9, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false });
    expect(resPed.eligible).toBe(false);
    expect(resPed.contraindications).toContain('Age 17.9 < 18 years');

    // Age 0 / Negative age
    const resZeroAge = evaluateCRAOTreatment({ onsetHours: 2, age: 0, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false });
    expect(resZeroAge.eligible).toBe(false);

    // Omitted age defaults to 18
    expect(evaluateCRAOTreatment({ onsetHours: 2, visualAcuity: true, fundusHemorrhage: false, ivtContraindicated: false }).age).toBe(18);
  });

  test('Remediated: Visual acuity string matching accepts severe acuity worse than 20/200', () => {
    const baseParams = { onsetHours: 2, fundusHemorrhage: false, ivtContraindicated: false, age: 50 };

    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: 'count-fingers' }).eligible).toBe(true);
    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: 'hand-motion' }).eligible).toBe(true);
    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: 'light-perception' }).eligible).toBe(true);
    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: 'no-light-perception' }).eligible).toBe(true);
    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: '20/200' }).eligible).toBe(true);
    expect(evaluateCRAOTreatment({ ...baseParams, visualAcuity: '20/400' }).eligible).toBe(true);
    
    // 20/800, 20/500, 20/1000 — severe vision loss worse than 20/200 correctly evaluates visualAcuityOk = true!
    const res20800 = evaluateCRAOTreatment({ ...baseParams, visualAcuity: '20/800' });
    const res20500 = evaluateCRAOTreatment({ ...baseParams, visualAcuity: '20/500' });
    const res201000 = evaluateCRAOTreatment({ ...baseParams, visualAcuity: '20/1000' });

    expect(res20800.visualAcuityOk).toBe(true);
    expect(res20500.visualAcuityOk).toBe(true);
    expect(res201000.visualAcuityOk).toBe(true);
  });

  test('Strict boolean checks for fundusHemorrhage and ivtContraindicated', () => {
    const baseParams = { onsetHours: 2, visualAcuity: true, age: 50 };

    // Missing fundusHemorrhage (undefined) -> defaults noHemorrhage to false
    const resNoHemParam = evaluateCRAOTreatment({ ...baseParams, ivtContraindicated: false });
    expect(resNoHemParam.eligible).toBe(false);
    expect(resNoHemParam.noHemorrhage).toBe(false);

    // Missing ivtContraindicated (undefined) -> defaults noContraindication to false
    const resNoIVTParam = evaluateCRAOTreatment({ ...baseParams, fundusHemorrhage: false });
    expect(resNoIVTParam.eligible).toBe(false);
    expect(resNoIVTParam.noContraindications).toBe(false);

    // Passed as strings or truthy/falsy non-booleans
    expect(evaluateCRAOTreatment({ ...baseParams, fundusHemorrhage: 0, ivtContraindicated: false }).eligible).toBe(false);
    expect(evaluateCRAOTreatment({ ...baseParams, fundusHemorrhage: 'false', ivtContraindicated: false }).eligible).toBe(false);
  });
});

describe('Empirical Stress Testing — calculateSeLECTScore', () => {
  test('Baseline minimum and maximum SeLECT score', () => {
    // Min score = 0
    const resMin = calculateSeLECTScore({
      nihss: 0,
      corticalInvolvement: false,
      earlySeizure: false,
      lvoArtery: false,
      middleCerebralTerritory: false
    });
    expect(resMin.score).toBe(0);
    expect(resMin.oneYearRisk).toBe('0.7%');
    expect(resMin.fiveYearRisk).toBe('1.3%');
    expect(resMin.riskTier).toBe('Low');

    // Max score = 9
    const resMax = calculateSeLECTScore({
      nihss: 15, // 2 pts
      corticalInvolvement: true, // 2 pts
      earlySeizure: true, // 3 pts
      lvoArtery: true, // 1 pt
      middleCerebralTerritory: true // 1 pt
    });
    expect(resMax.score).toBe(9);
    expect(resMax.oneYearRisk).toBe('56.0%');
    expect(resMax.fiveYearRisk).toBe('76.2%');
    expect(resMax.riskTier).toBe('Very High');
  });

  test('NIHSS boundary conditions and invalid values', () => {
    expect(calculateSeLECTScore({ nihss: 3 }).breakdown.nihssPoints).toBe(0);
    expect(calculateSeLECTScore({ nihss: 4 }).breakdown.nihssPoints).toBe(1);
    expect(calculateSeLECTScore({ nihss: 10 }).breakdown.nihssPoints).toBe(1);
    expect(calculateSeLECTScore({ nihss: 11 }).breakdown.nihssPoints).toBe(2);
    expect(calculateSeLECTScore({ nihss: 42 }).breakdown.nihssPoints).toBe(2);

    // Negative NIHSS
    const resNeg = calculateSeLECTScore({ nihss: -10 });
    expect(resNeg).not.toBeNull();
    expect(resNeg.breakdown.nihssPoints).toBe(0);

    // Invalid NIHSS
    expect(calculateSeLECTScore({ nihss: 'abc' })).toBeNull();
    expect(calculateSeLECTScore({ nihss: null })).toBeNull();
    expect(calculateSeLECTScore({})).toBeNull();
    expect(calculateSeLECTScore()).toBeNull();
  });

  test('Remediated: Breakdown vs total score consistency on boolean-coerced inputs', () => {
    // Passing string "true" or 1 instead of boolean true
    const resStringTrue = calculateSeLECTScore({
      nihss: 5, // 1 pt
      corticalInvolvement: "true", // 2 pts
      earlySeizure: "true" // 3 pts
    });
    
    // Total score is 6 (1 + 2 + 3)
    expect(resStringTrue.score).toBe(6);
    expect(resStringTrue.breakdown.corticalPoints).toBe(2);
    expect(resStringTrue.breakdown.earlySeizurePoints).toBe(3);

    const breakdownSum = resStringTrue.breakdown.nihssPoints +
      resStringTrue.breakdown.corticalPoints +
      resStringTrue.breakdown.earlySeizurePoints +
      resStringTrue.breakdown.lvoPoints +
      resStringTrue.breakdown.mcaPoints;
    
    expect(breakdownSum).toBe(6);
    expect(resStringTrue.score).toBe(breakdownSum);
  });
});

describe('Empirical Stress Testing — calculateEDEMAScore', () => {
  test('Baseline minimum and maximum EDEMA score', () => {
    // Min score = 0
    const resMin = calculateEDEMAScore({
      nihss: 5,
      aspects: 10,
      earlyInfarctSigns: false,
      denseArterySign: false,
      bloodGlucoseMgDl: 100,
      massEffect: 0,
      historyHypertension: false
    });
    expect(resMin.score).toBe(0);
    expect(resMin.riskTier).toBe('Low');
    expect(resMin.estimatedSwellingRisk).toBe('<10%');

    // Max score = 9
    const resMax = calculateEDEMAScore({
      nihss: 22, // 2 pts
      aspects: 5, // 2 pts
      denseArterySign: true, // 1 pt
      bloodGlucoseMgDl: 200, // 1 pt
      massEffect: 2, // 2 pts
      historyHypertension: true // 1 pt
    });
    expect(resMax.score).toBe(9);
    expect(resMax.riskTier).toBe('High');
    expect(resMax.estimatedSwellingRisk).toBe('>60-80%');
  });

  test('NIHSS boundary conditions', () => {
    expect(calculateEDEMAScore({ nihss: 11 }).breakdown.nihssPoints).toBe(0);
    expect(calculateEDEMAScore({ nihss: 12 }).breakdown.nihssPoints).toBe(1);
    expect(calculateEDEMAScore({ nihss: 19 }).breakdown.nihssPoints).toBe(1);
    expect(calculateEDEMAScore({ nihss: 20 }).breakdown.nihssPoints).toBe(2);
  });

  test('ASPECTS score boundary conditions', () => {
    expect(calculateEDEMAScore({ nihss: 10, aspects: 7 }).breakdown.earlyInfarctPoints).toBe(0);
    expect(calculateEDEMAScore({ nihss: 10, aspects: 6 }).breakdown.earlyInfarctPoints).toBe(2);
    expect(calculateEDEMAScore({ nihss: 10, aspects: 0 }).breakdown.earlyInfarctPoints).toBe(2);
    
    // Negative aspects
    expect(calculateEDEMAScore({ nihss: 10, aspects: -5 }).breakdown.earlyInfarctPoints).toBe(2);
  });

  test('Blood Glucose boundary conditions (Mg/dL vs Mmol/L)', () => {
    expect(calculateEDEMAScore({ nihss: 10, bloodGlucoseMgDl: 162 }).breakdown.glucosePoints).toBe(0);
    expect(calculateEDEMAScore({ nihss: 10, bloodGlucoseMgDl: 162.1 }).breakdown.glucosePoints).toBe(1);
    expect(calculateEDEMAScore({ nihss: 10, bloodGlucoseMmolL: 9.0 }).breakdown.glucosePoints).toBe(0);
    expect(calculateEDEMAScore({ nihss: 10, bloodGlucoseMmolL: 9.1 }).breakdown.glucosePoints).toBe(1);
  });

  test('Remediated: Mass Effect string matching handles negated strings correctly', () => {
    expect(calculateEDEMAScore({ nihss: 10, massEffect: 'midline shift' }).breakdown.massEffectPoints).toBe(2);
    expect(calculateEDEMAScore({ nihss: 10, massEffect: 'sulcal effacement' }).breakdown.massEffectPoints).toBe(1);

    const resNoShift = calculateEDEMAScore({ nihss: 10, massEffect: 'no shift' });
    const resWithoutShift = calculateEDEMAScore({ nihss: 10, massEffect: 'without midline shift' });
    const resNoEffacement = calculateEDEMAScore({ nihss: 10, massEffect: 'no effacement' });

    expect(resNoShift.breakdown.massEffectPoints).toBe(0);
    expect(resWithoutShift.breakdown.massEffectPoints).toBe(0);
    expect(resNoEffacement.breakdown.massEffectPoints).toBe(0);
  });

  test('Remediated: Mass Effect numeric float handling applies Math.floor to integer points', () => {
    const resFloat = calculateEDEMAScore({ nihss: 10, massEffect: 1.5 });
    expect(resFloat.score).toBe(1);
    expect(resFloat.breakdown.massEffectPoints).toBe(1);
  });
});
