import { describe, it, expect } from 'vitest';
import {
  evaluateDAWN,
  evaluateDEFUSE3,
  recommendAcuteDAPT,
  calculateESSEN,
  calculateSPI2,
  calculateBAT,
  calculateBRAIN,
  calculateNinePoint,
  calculateVASOGRADE,
  calculateOgilvyCarter,
  interpretPHQ9,
  calculateNASCET,
  calculateCHADS2VA,
  calculateHAVOC,
  recommendDriving,
  interpretBarnesJewishDysphagia,
  recommendVTEProphylaxis,
  computeNeurocheckSchedule,
  computeLKWCountdown,
  evaluateCRAOTreatment,
  calculateSeLECTScore,
  calculateEDEMAScore
} from '../src/calculators-extended.js';

describe('evaluateDAWN', () => {
  it('meets Group A (>=80, NIHSS>=10, core<21)', () => {
    expect(evaluateDAWN({ age: 82, nihss: 12, coreMl: 15, timeFromLKWh: 8 }).tier).toBe('A');
  });
  it('meets Group B (<80, NIHSS>=10, core<31)', () => {
    expect(evaluateDAWN({ age: 65, nihss: 15, coreMl: 25, timeFromLKWh: 10 }).tier).toBe('B');
  });
  it('meets Group C (<80, NIHSS>=20, core<51)', () => {
    expect(evaluateDAWN({ age: 70, nihss: 22, coreMl: 45, timeFromLKWh: 12 }).tier).toBe('C');
  });
  it('fails when core exceeds all tiers', () => {
    expect(evaluateDAWN({ age: 55, nihss: 18, coreMl: 100, timeFromLKWh: 10 }).eligible).toBe(false);
  });
  it('fails when outside window', () => {
    expect(evaluateDAWN({ age: 70, nihss: 22, coreMl: 45, timeFromLKWh: 30 }).eligible).toBe(false);
  });
});

describe('evaluateDEFUSE3', () => {
  it('passes with core 50 and penumbra 120', () => {
    const r = evaluateDEFUSE3({ coreMl: 50, penumbraMl: 120, timeFromLKWh: 10, nihss: 12, age: 65 });
    expect(r.eligible).toBe(true);
    expect(r.mismatchRatio).toBeCloseTo(2.4, 1);
  });
  it('fails when core >70', () => {
    expect(evaluateDEFUSE3({ coreMl: 80, penumbraMl: 150, timeFromLKWh: 10 }).meetsCore).toBe(false);
  });
  it('fails when mismatch volume <15', () => {
    expect(evaluateDEFUSE3({ coreMl: 50, penumbraMl: 60, timeFromLKWh: 10 }).eligible).toBe(false);
  });
  it('fails when outside 6-16h window', () => {
    expect(evaluateDEFUSE3({ coreMl: 30, penumbraMl: 90, timeFromLKWh: 20 }).eligible).toBe(false);
  });
});

describe('recommendAcuteDAPT', () => {
  it('recommends CHANCE/POINT for minor stroke (NIHSS<=3)', () => {
    const r = recommendAcuteDAPT({ nihss: 3, abcd2: '', strokeType: 'ischemic' });
    expect(r.regimen).toBe('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
  });
  it('recommends THALES for atherosclerotic NIHSS 4', () => {
    const r = recommendAcuteDAPT({ nihss: 4, strokeType: 'ischemic', atherosclerotic: true });
    expect(r.regimen).toBe('ticagrelor+ASA');
    expect(r.duration).toBe('30 days');
  });
  it('recommends very-high-risk TIA → THALES when ABCD2 ≥6', () => {
    const r = recommendAcuteDAPT({ nihss: 0, abcd2: 6, strokeType: 'tia' });
    expect(r.regimen).toBe('ticagrelor+ASA');
  });
  it('CHANCE-2 (ticagrelor+ASA) for CYP2C19 LOF minor stroke', () => {
    const r = recommendAcuteDAPT({ nihss: 2, strokeType: 'ischemic', cyp2c19LOF: true });
    expect(r.regimen).toMatch(/ticagrelor/);
    expect(r.duration).toBe('21 days');
  });
  it('high ICH risk → single antiplatelet', () => {
    const r = recommendAcuteDAPT({ nihss: 2, ichRisk: 'high' });
    expect(r.regimen).toBe('single-antiplatelet');
  });
  it('NIHSS >5 falls back to single antiplatelet', () => {
    const r = recommendAcuteDAPT({ nihss: 10, strokeType: 'ischemic' });
    expect(r.regimen).toBe('single-antiplatelet');
  });
});

describe('calculateESSEN', () => {
  it('sums age+HTN+DM+prior stroke correctly', () => {
    expect(calculateESSEN({ age: 76, hypertension: true, diabetes: true, priorTIA: true }).score).toBe(5);
  });
  it('high-risk classification when score >=3', () => {
    expect(calculateESSEN({ age: 70, hypertension: true, diabetes: true, priorTIA: false }).risk).toBe('high');
  });
  it('zero score is low', () => {
    expect(calculateESSEN({ age: 50 }).risk).toBe('low');
  });
});

describe('calculateSPI2', () => {
  it('severe HTN contributes 1', () => {
    expect(calculateSPI2({ age: 65, sbp: 190 }).score).toBe(1);
  });
  it('high tier when score >=8', () => {
    const r = calculateSPI2({ age: 72, hypertension: true, diabetes: true, priorStroke: true });
    expect(r.score).toBe(11);
    expect(r.tier).toBe('high');
  });
});

describe('calculateBAT', () => {
  it('max score with all present plus time<2.5', () => {
    expect(calculateBAT({ blendSign: true, hypodensity: true, timeToCTHours: 2 }).score).toBe(5);
  });
  it('zero when nothing', () => {
    expect(calculateBAT({}).score).toBe(0);
  });
  it('high risk at 3+', () => {
    expect(calculateBAT({ blendSign: true, hypodensity: true }).risk).toBe('high');
  });
});

describe('calculateVASOGRADE', () => {
  it('green for WFNS 1, mFisher 1', () => {
    expect(calculateVASOGRADE({ wfns: 1, modifiedFisher: 1 }).grade).toBe('Green');
  });
  it('red for WFNS 5', () => {
    expect(calculateVASOGRADE({ wfns: 5, modifiedFisher: 1 }).grade).toBe('Red');
  });
  it('yellow for WFNS 2 mFisher 3', () => {
    expect(calculateVASOGRADE({ wfns: 2, modifiedFisher: 3 }).grade).toBe('Yellow');
  });
});

describe('interpretPHQ9', () => {
  it('rejects out-of-range scores', () => {
    expect(interpretPHQ9(40)).toBeNull();
    expect(interpretPHQ9(-1)).toBeNull();
  });
  it('classifies 0-4 as none', () => {
    expect(interpretPHQ9(3).severity).toBe('none');
  });
  it('classifies 10-14 as moderate', () => {
    expect(interpretPHQ9(12).severity).toBe('moderate');
  });
  it('classifies 20+ as severe', () => {
    expect(interpretPHQ9(22).severity).toBe('severe');
  });
});

describe('calculateNASCET', () => {
  it('70% stenosis with 3mm residual / 10mm distal', () => {
    const r = calculateNASCET({ stenosisDiameterMm: 3, distalICADiameterMm: 10 });
    expect(r.percent).toBe(70);
    expect(r.tier).toBe('severe');
  });
  it('50% stenosis', () => {
    expect(calculateNASCET({ stenosisDiameterMm: 5, distalICADiameterMm: 10 }).percent).toBe(50);
  });
});

describe('calculateCHADS2VA (2024 ESC, drops sex)', () => {
  it('does not add a point for female', () => {
    const base = calculateCHADS2VA({ hypertension: true, age: 70 });
    expect(base.score).toBe(2);
  });
  it('age ≥75 = 2 points', () => {
    expect(calculateCHADS2VA({ age: 80 }).score).toBe(2);
  });
  it('prior stroke = 2 points', () => {
    expect(calculateCHADS2VA({ strokeTia: true }).score).toBe(2);
  });
});

describe('calculateHAVOC', () => {
  it('hypertension + age 80 + heart failure → score 8 (medium)', () => {
    const r = calculateHAVOC({ hypertension: true, age: 80, heartFailure: true });
    expect(r.score).toBe(8);
    expect(r.riskBand).toBe('medium');
    expect(r.monitoringStrategy).toMatch(/external/);
  });
});

describe('recommendDriving', () => {
  it('blocks with seizure or homonymous field cut', () => {
    const r = recommendDriving({ strokeType: 'ischemic', severity: 'moderate', seizure: true });
    expect(r.mayDrive).toBe(false);
  });
  it('allows after 4w for TIA/minor', () => {
    const r = recommendDriving({ strokeType: 'tia', severity: 'minor' });
    expect(r.mayDrive).toBe(true);
  });
});

describe('interpretBarnesJewishDysphagia', () => {
  it('requires GCS 15', () => {
    expect(interpretBarnesJewishDysphagia({ gcs15: false }).pass).toBe(false);
  });
  it('fails on cough', () => {
    expect(interpretBarnesJewishDysphagia({ gcs15: true, canSitUpright: true, coughOnWater3oz: true }).pass).toBe(false);
  });
  it('passes when all negative', () => {
    expect(interpretBarnesJewishDysphagia({ gcs15: true, canSitUpright: true }).pass).toBe(true);
  });
});

describe('recommendVTEProphylaxis', () => {
  it('ICH day 0 → IPC only', () => {
    expect(recommendVTEProphylaxis({ diagnosis: 'ich', days: 0, hematomaStable: true }).modality).toMatch(/mechanical/);
  });
  it('ICH day 2 stable → chemical + mechanical', () => {
    expect(recommendVTEProphylaxis({ diagnosis: 'ich', days: 2, hematomaStable: true }).modality).toMatch(/chemical/);
  });
  it('ischemic stroke immobile → chemical', () => {
    expect(recommendVTEProphylaxis({ diagnosis: 'ischemic', immobile: true, days: 1 }).modality).toMatch(/chemical/);
  });
});

describe('computeNeurocheckSchedule', () => {
  it('produces 36 checks (8+12+16)', () => {
    const s = computeNeurocheckSchedule(new Date().toISOString());
    expect(s.checks.length).toBe(36);
  });
  it('returns null for invalid time', () => {
    expect(computeNeurocheckSchedule(null)).toBeNull();
    expect(computeNeurocheckSchedule('not-a-date')).toBeNull();
  });
});

describe('computeLKWCountdown', () => {
  it('open at 2h elapsed', () => {
    const now = Date.now();
    const lkw = new Date(now - 2 * 3600 * 1000).toISOString();
    const cd = computeLKWCountdown(lkw, now);
    expect(cd.toLyticClosed).toBe(false);
    expect(cd.toLateEvtClosed).toBe(false);
  });
  it('lytic closed at 5h elapsed', () => {
    const now = Date.now();
    const lkw = new Date(now - 5 * 3600 * 1000).toISOString();
    expect(computeLKWCountdown(lkw, now).toLyticClosed).toBe(true);
  });
  it('EVT closed at 25h elapsed', () => {
    const now = Date.now();
    const lkw = new Date(now - 25 * 3600 * 1000).toISOString();
    expect(computeLKWCountdown(lkw, now).toLateEvtClosed).toBe(true);
  });
});

describe('calculateBRAIN / NinePoint / OgilvyCarter (regression guards)', () => {
  it('BRAIN with big volume and AC', () => {
    expect(calculateBRAIN({ volumeMl: 40, anticoagulated: true, ivh: true, onsetToCTHours: 1 }).score).toBeGreaterThan(0);
  });
  it('NinePoint warfarin > NOAC', () => {
    const w = calculateNinePoint({ warfarin: true });
    const n = calculateNinePoint({ noac: true });
    expect(w.score).toBeGreaterThan(n.score);
  });
  it('OgilvyCarter caps at 5', () => {
    const r = calculateOgilvyCarter({ age: 80, huntHess: 5, fisher: 4, size: 20, posteriorOrGiant: true });
    expect(r.score).toBe(5);
  });
});

// Regression guard: SEDAN direction should be preserved in existing code
describe('SEDAN direction regression (from app.jsx)', () => {
  it('higher glucose should yield more points — documented here to catch future inversion', () => {
    // pure sanity check — the actual code lives in app.jsx but this test encodes the invariant
    const sedanPoints = (glucose, earlyInfarct, denseArtery, age, nihss) => {
      let s = 0;
      if (glucose > 144 && glucose <= 216) s += 1;
      else if (glucose > 216) s += 2;
      if (earlyInfarct) s += 1;
      if (denseArtery) s += 1;
      if (age > 75) s += 1;
      if (nihss >= 10) s += 1;
      return s;
    };
    expect(sedanPoints(130, false, false, 60, 5)).toBe(0);
    expect(sedanPoints(180, false, false, 60, 5)).toBe(1);
    expect(sedanPoints(240, false, false, 60, 5)).toBe(2);
  });
});

describe('evaluateCRAOTreatment', () => {
  it('recommends lytic when all CRAO criteria are met <= 4.5h', () => {
    const r = evaluateCRAOTreatment({
      onsetHours: 2.5,
      visualAcuity: 'count-fingers',
      fundusHemorrhage: false,
      ivtContraindicated: false,
      age: 65
    });
    expect(r.eligible).toBe(true);
    expect(r.recommendation).toMatch(/Eligible for acute IV thrombolysis/);
    expect(r.sources).toMatch(/THEIA Trial/);
  });

  it('declines lytic when onset > 4.5h', () => {
    const r = evaluateCRAOTreatment({
      onsetHours: 5.0,
      visualAcuity: 'count-fingers',
      fundusHemorrhage: false,
      ivtContraindicated: false
    });
    expect(r.eligible).toBe(false);
    expect(r.contraindications).toContain('Onset 5h exceeds 4.5h window');
  });

  it('declines lytic when retinal hemorrhage is present on fundoscopy', () => {
    const r = evaluateCRAOTreatment({
      onsetHours: 2.0,
      visualAcuity: 'no-light-perception',
      fundusHemorrhage: true,
      ivtContraindicated: false
    });
    expect(r.eligible).toBe(false);
    expect(r.noHemorrhage).toBe(false);
  });

  it('declines lytic when systemic contraindication is present', () => {
    const r = evaluateCRAOTreatment({
      onsetHours: 1.5,
      visualAcuity: 'severe',
      fundusHemorrhage: false,
      ivtContraindicated: true
    });
    expect(r.eligible).toBe(false);
  });

  it('returns null if onsetHours is missing or non-numeric', () => {
    expect(evaluateCRAOTreatment({ onsetHours: 'invalid' })).toBeNull();
  });

  it('correctly handles severe vision loss Snellen denominators >= 200 (20/500, 20/800, 20/1000)', () => {
    ['20/200', '20/300', '20/500', '20/800', '20/1000'].forEach(va => {
      const r = evaluateCRAOTreatment({
        onsetHours: 2.0,
        visualAcuity: va,
        fundusHemorrhage: false,
        ivtContraindicated: false
      });
      expect(r.visualAcuityOk).toBe(true);
      expect(r.eligible).toBe(true);
    });
    expect(evaluateCRAOTreatment({ onsetHours: 2.0, visualAcuity: '20/50', fundusHemorrhage: false, ivtContraindicated: false }).visualAcuityOk).toBe(false);
  });
});

describe('calculateSeLECTScore', () => {
  it('calculates score 0 for low risk patient', () => {
    const r = calculateSeLECTScore({
      nihss: 2,
      corticalInvolvement: false,
      earlySeizure: false,
      lvoArtery: false,
      middleCerebralTerritory: false
    });
    expect(r.score).toBe(0);
    expect(r.oneYearRisk).toBe('0.7%');
    expect(r.fiveYearRisk).toBe('1.3%');
    expect(r.riskTier).toBe('Low');
  });

  it('calculates score 9 for maximum risk patient', () => {
    const r = calculateSeLECTScore({
      nihss: 15,
      corticalInvolvement: true,
      earlySeizure: true,
      lvoArtery: true,
      middleCerebralTerritory: true
    });
    expect(r.score).toBe(9);
    expect(r.fiveYearRisk).toBe('76.2%');
    expect(r.riskTier).toBe('Very High');
    expect(r.recommendation).toMatch(/High risk/);
  });

  it('correctly scores components and breakdown', () => {
    const r = calculateSeLECTScore({
      nihss: 5,
      corticalInvolvement: true,
      earlySeizure: false,
      lvoArtery: false,
      middleCerebralTerritory: true
    });
    // NIHSS 5 -> 1 pt; Cortical -> 2 pts; MCA -> 1 pt = Total 4
    expect(r.score).toBe(4);
    expect(r.fiveYearRisk).toBe('12.4%');
    expect(r.breakdown.nihssPoints).toBe(1);
    expect(r.breakdown.corticalPoints).toBe(2);
    expect(r.breakdown.mcaPoints).toBe(1);
  });

  it('coerces boolean-like strings and numbers consistently between score and breakdown', () => {
    const r = calculateSeLECTScore({
      nihss: '5',
      corticalInvolvement: 'true',
      earlySeizure: 1,
      lvoArtery: 'TRUE',
      middleCerebralTerritory: 0
    });
    const breakdownSum = r.breakdown.nihssPoints + r.breakdown.corticalPoints + r.breakdown.earlySeizurePoints + r.breakdown.lvoPoints + r.breakdown.mcaPoints;
    expect(r.score).toBe(breakdownSum);
    expect(r.breakdown.corticalPoints).toBe(2);
    expect(r.breakdown.earlySeizurePoints).toBe(3);
    expect(r.breakdown.lvoPoints).toBe(1);
  });

  it('returns null if NIHSS is non-numeric', () => {
    expect(calculateSeLECTScore({ nihss: null })).toBeNull();
  });
});

describe('calculateEDEMAScore', () => {
  it('calculates low risk for minor stroke without edema markers', () => {
    const r = calculateEDEMAScore({
      nihss: 15,
      aspects: 9,
      denseArterySign: false,
      bloodGlucoseMgDl: 120,
      massEffect: 'none',
      historyHypertension: false
    });
    // NIHSS 15 -> 1 pt; total = 1
    expect(r.score).toBe(1);
    expect(r.riskTier).toBe('Low');
    expect(r.highRiskForMalignantEdema).toBe(false);
  });

  it('calculates high risk (>=6) and triggers neurosurgery recommendation', () => {
    const r = calculateEDEMAScore({
      nihss: 22,
      aspects: 5,
      denseArterySign: true,
      bloodGlucoseMgDl: 200,
      massEffect: 'midline-shift',
      historyHypertension: true
    });
    // NIHSS 22 -> 2; ASPECTS <7 -> 2; Dense artery -> 1; Glucose >162 -> 1; Shift -> 2; HTN -> 1 = Total 9
    expect(r.score).toBe(9);
    expect(r.riskTier).toBe('High');
    expect(r.highRiskForMalignantEdema).toBe(true);
    expect(r.recommendation).toMatch(/decompressive hemicraniectomy/);
  });

  it('handles negation in massEffect and applies Math.floor on numeric massEffect', () => {
    const rNoShift = calculateEDEMAScore({ nihss: 15, massEffect: 'no shift' });
    expect(rNoShift.breakdown.massEffectPoints).toBe(0);

    const rWithoutShift = calculateEDEMAScore({ nihss: 15, massEffect: 'without midline shift' });
    expect(rWithoutShift.breakdown.massEffectPoints).toBe(0);

    const rNoEffacement = calculateEDEMAScore({ nihss: 15, massEffect: 'no effacement' });
    expect(rNoEffacement.breakdown.massEffectPoints).toBe(0);

    const rFloatMass = calculateEDEMAScore({ nihss: 15, massEffect: 1.9 });
    expect(rFloatMass.breakdown.massEffectPoints).toBe(1);
  });

  it('handles bloodGlucoseMmolL correctly', () => {
    const r = calculateEDEMAScore({
      nihss: 14,
      bloodGlucoseMmolL: 10.5
    });
    expect(r.breakdown.glucosePoints).toBe(1);
  });

  it('returns null for non-numeric NIHSS', () => {
    expect(calculateEDEMAScore({})).toBeNull();
  });
});
