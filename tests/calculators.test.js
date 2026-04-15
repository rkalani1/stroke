import { describe, it, expect } from 'vitest';
import {
  calculateNIHSS,
  calculatePCAspects,
  calculateGCS,
  calculateICHScore,
  calculateABCD2Score,
  calculateCHADS2VascScore,
  calculateROPEScore,
  calculateHASBLEDScore,
  calculateRCVS2Score,
  calculatePHASESScore,
  getPHASESRisk,
  calculateICHVolume,
  calculateEnoxaparinDose,
  calculateAndexanetDose,
  calculateCrCl,
  calculateTNKDose,
  calculatePCCDose,
  calculateAlteplaseDose,
  calculateDOACStart,
  DOAC_PROTOCOLS
} from '../src/calculators.js';

describe('calculateNIHSS', () => {
  it('sums embedded (n) scores', () => {
    const responses = {
      loc: 'Alert (0)',
      gaze: 'Partial gaze palsy (1)',
      motor: 'No movement (4)'
    };
    expect(calculateNIHSS(responses)).toBe(5);
  });

  it('ignores untestable (UN) items', () => {
    const responses = { loc: 'Alert (0)', motor: 'UN' };
    expect(calculateNIHSS(responses)).toBe(0);
  });

  it('caps total at 42', () => {
    const responses = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`q${i}`, 'severe (4)'])
    );
    expect(calculateNIHSS(responses)).toBe(42);
  });

  it('handles empty object', () => {
    expect(calculateNIHSS({})).toBe(0);
  });
});

describe('calculatePCAspects', () => {
  it('sums points for checked regions only', () => {
    const regions = [
      { checked: true, points: 1 },
      { checked: false, points: 2 },
      { checked: true, points: 2 }
    ];
    expect(calculatePCAspects(regions)).toBe(3);
  });
});

describe('calculateGCS', () => {
  it('returns 15 for full score', () => {
    expect(calculateGCS({ eye: '4', verbal: '5', motor: '6' })).toBe(15);
  });

  it('returns 3 for minimum', () => {
    expect(calculateGCS({ eye: '1', verbal: '1', motor: '1' })).toBe(3);
  });

  it('returns 0 when nothing entered', () => {
    expect(calculateGCS({})).toBe(0);
  });

  it('returns null for partial entry', () => {
    expect(calculateGCS({ eye: '4', verbal: '5' })).toBeNull();
  });

  it('clamps out-of-range values', () => {
    expect(calculateGCS({ eye: '9', verbal: '9', motor: '9' })).toBe(15);
  });
});

describe('calculateICHScore', () => {
  it('GCS 3-4 scores 2', () => {
    expect(calculateICHScore({ gcs: 'gcs34' })).toBe(2);
  });
  it('GCS 5-12 scores 1', () => {
    expect(calculateICHScore({ gcs: 'gcs512' })).toBe(1);
  });
  it('aggregates all positive factors (max = 6)', () => {
    const items = { gcs: 'gcs34', age80: true, volume30: true, ivh: true, infratentorial: true };
    expect(calculateICHScore(items)).toBe(6);
  });
});

describe('calculateABCD2Score', () => {
  it('max score = 7', () => {
    const items = { age60: true, bp: true, unilateralWeakness: true, speechDisturbance: true, duration: 'duration60', diabetes: true };
    expect(calculateABCD2Score(items)).toBe(7);
  });
  it('speech only counts when no weakness', () => {
    const withWeakness = { unilateralWeakness: true, speechDisturbance: true };
    const speechOnly = { speechDisturbance: true };
    expect(calculateABCD2Score(withWeakness)).toBe(2);
    expect(calculateABCD2Score(speechOnly)).toBe(1);
  });
});

describe('calculateCHADS2VascScore', () => {
  it('age75 outranks age65', () => {
    expect(calculateCHADS2VascScore({ age75: true, age65: true })).toBe(2);
  });
  it('max reasonable = 9', () => {
    const items = { chf: true, hypertension: true, age75: true, diabetes: true, strokeTia: true, vascular: true, female: true };
    expect(calculateCHADS2VascScore(items)).toBe(9);
  });
});

describe('calculateROPEScore', () => {
  it('<30 age gets 5 age points', () => {
    expect(calculateROPEScore({ age: 25 })).toBe(5);
  });
  it('70+ gets no age points', () => {
    expect(calculateROPEScore({ age: 72 })).toBe(0);
  });
  it('combines age + risk factors', () => {
    expect(calculateROPEScore({ age: 35, noHypertension: true, cortical: true })).toBe(6); // 4 + 1 + 1
  });
});

describe('calculateHASBLEDScore', () => {
  it('max = 9', () => {
    const all = { hypertension: true, renalDisease: true, liverDisease: true, stroke: true, bleeding: true, labileINR: true, elderly: true, drugs: true, alcohol: true };
    expect(calculateHASBLEDScore(all)).toBe(9);
  });
});

describe('calculateRCVS2Score', () => {
  it('carotid involvement subtracts but score stays ≥ 0', () => {
    expect(calculateRCVS2Score({ carotidInvolvement: true })).toBe(0);
  });
  it('sums RCVS-favoring features', () => {
    expect(calculateRCVS2Score({ recurrentTCH: true, female: true, sah: true })).toBe(7);
  });
});

describe('calculatePHASESScore / getPHASESRisk', () => {
  it('size ≥20mm dominates', () => {
    expect(calculatePHASESScore({ size: 25 })).toBe(10);
  });
  it('posterior circulation adds 4', () => {
    expect(calculatePHASESScore({ site: 'aca_pcomm_posterior' })).toBe(4);
  });
  it('risk buckets map correctly', () => {
    expect(getPHASESRisk(0).level).toBe('Very low');
    expect(getPHASESRisk(6).level).toBe('Low-Moderate');
    expect(getPHASESRisk(11).level).toBe('High');
  });
});

describe('calculateICHVolume (ABC/2)', () => {
  it('computes A*B*C/2', () => {
    const r = calculateICHVolume({ lengthCm: 4, widthCm: 3, slicesCm: 5 });
    expect(r.volume).toBe(30);
    expect(r.isLarge).toBe(true);
  });
  it('returns null for zero dimension', () => {
    expect(calculateICHVolume({ lengthCm: 0, widthCm: 3, slicesCm: 5 })).toBeNull();
  });
});

describe('calculateTNKDose', () => {
  it('caps at 25 mg for heavy patients', () => {
    const r = calculateTNKDose(120);
    expect(parseFloat(r.calculatedDose)).toBe(25);
    expect(r.isMaxDose).toBe(true);
  });
  it('0.25 mg/kg for 80kg = 20 mg', () => {
    const r = calculateTNKDose(80);
    expect(parseFloat(r.calculatedDose)).toBe(20);
    expect(r.isMaxDose).toBe(false);
  });
  it('rejects invalid weight', () => {
    expect(calculateTNKDose(-10)).toBeNull();
    expect(calculateTNKDose(400)).toBeNull();
    expect(calculateTNKDose('abc')).toBeNull();
  });
});

describe('calculateAlteplaseDose', () => {
  it('0.9 mg/kg capped at 90 mg', () => {
    const r = calculateAlteplaseDose(120);
    expect(r.totalDose).toBe(90);
    expect(r.capped).toBe(true);
    // 10% bolus, 90% infusion
    expect(r.bolus).toBe(9);
    expect(r.infusion).toBe(81);
  });
  it('70kg → 63 mg total', () => {
    const r = calculateAlteplaseDose(70);
    expect(r.totalDose).toBe(63);
    expect(r.capped).toBe(false);
  });
});

describe('calculatePCCDose', () => {
  it('INR <1.3 returns null iuPerKg', () => {
    const r = calculatePCCDose(80, 1.1);
    expect(r.iuPerKg).toBeNull();
    expect(r.ahaDose).toBeNull();
  });
  it('INR 2-3.9 → 25 IU/kg', () => {
    const r = calculatePCCDose(80, 2.5);
    expect(r.iuPerKg).toBe(25);
    expect(r.ahaDose).toBe(2000);
  });
  it('INR >6 → 50 IU/kg, capped at 5000', () => {
    const r = calculatePCCDose(150, 8);
    expect(r.iuPerKg).toBe(50);
    expect(r.ahaDose).toBe(5000);
  });
});

describe('calculateCrCl', () => {
  it('Cockcroft-Gault matches hand calc', () => {
    // 70 y/o male, 80 kg, Cr 1.0 → ((140-70)*80)/(72*1) = 77.77
    const r = calculateCrCl(70, 80, 'M', 1.0);
    expect(r.value).toBeCloseTo(77.8, 1);
    expect(r.renalCategory).toBe('mild');
  });
  it('female factor 0.85 applied', () => {
    const r = calculateCrCl(70, 80, 'F', 1.0);
    expect(r.value).toBeCloseTo(66.1, 1);
  });
  it('returns null for invalid inputs', () => {
    expect(calculateCrCl(0, 80, 'M', 1)).toBeNull();
    expect(calculateCrCl(70, 80, 'X', 1)).toBeNull();
    expect(calculateCrCl(70, 80, 'M', 0)).toBeNull();
  });
  it('flags obese and computes AdjBW CrCl', () => {
    // 5'10" = 177.8 cm, 120 kg → BMI ~38
    const r = calculateCrCl(70, 120, 'M', 1.0, 177.8);
    expect(r.isObese).toBe(true);
    expect(r.adjBwValue).toBeGreaterThan(0);
    expect(r.obesityWarning).toMatch(/BMI/);
  });
});

describe('calculateEnoxaparinDose', () => {
  it('returns 1 mg/kg BID for normal renal', () => {
    const r = calculateEnoxaparinDose(80, 80);
    expect(r.dose).toBe(80);
    expect(r.frequency).toBe('BID');
    expect(r.isRenalAdjusted).toBe(false);
  });
  it('CrCl <30 → once-daily renal-adjusted', () => {
    const r = calculateEnoxaparinDose(80, 25);
    expect(r.frequency).toBe('daily');
    expect(r.isRenalAdjusted).toBe(true);
  });
  it('warns when CrCl unknown', () => {
    const r = calculateEnoxaparinDose(80, null);
    expect(r.crClUnknown).toBe(true);
    expect(r.note).toMatch(/CrCl unknown/);
  });
  it('rejects absurd weights', () => {
    expect(calculateEnoxaparinDose(400, 80)).toBeNull();
  });
});

describe('calculateAndexanetDose', () => {
  it('apixaban ≤5mg → low-dose', () => {
    const r = calculateAndexanetDose('apixaban', 2, 5);
    expect(r.regimen).toBe('low-dose');
  });
  it('apixaban >5mg <8h → high-dose', () => {
    const r = calculateAndexanetDose('apixaban', 2, 10);
    expect(r.regimen).toBe('high-dose');
  });
  it('rivaroxaban >10mg <8h → high-dose', () => {
    const r = calculateAndexanetDose('rivaroxaban', 2, 20);
    expect(r.regimen).toBe('high-dose');
  });
  it('any DOAC ≥8h → low-dose', () => {
    expect(calculateAndexanetDose('apixaban', 10, 10).regimen).toBe('low-dose');
    expect(calculateAndexanetDose('rivaroxaban', 10, 20).regimen).toBe('low-dose');
  });
  it('unknown DOAC → N/A', () => {
    const r = calculateAndexanetDose('dabigatran', 2, 150);
    expect(r.regimen).toBe('N/A');
  });
});

describe('calculateDOACStart', () => {
  const onset = '2026-04-01';
  it('minor stroke = +1 day on catalyst', () => {
    const r = calculateDOACStart(4, onset);
    expect(r.severity).toBe('minor');
    expect(r.days).toBe(1);
  });
  it('moderate 8-15 = +3 days', () => {
    const r = calculateDOACStart(10, onset);
    expect(r.severity).toBe('moderate');
    expect(r.days).toBe(3);
  });
  it('severe ≥16 = +6 days on catalyst', () => {
    const r = calculateDOACStart(18, onset);
    expect(r.severity).toBe('severe');
    expect(r.days).toBe(6);
  });
  it('verySevere only used under 1-3-6-12 rule', () => {
    const r1 = calculateDOACStart(22, onset, '1-3-6-12');
    expect(r1.severity).toBe('verySevere');
    expect(r1.days).toBe(12);
    const r2 = calculateDOACStart(22, onset, 'catalyst');
    expect(r2.severity).toBe('severe');
    expect(r2.days).toBe(6);
  });
  it('returns null without onset date', () => {
    expect(calculateDOACStart(5, null)).toBeNull();
  });
  it('known DOAC_PROTOCOLS shape', () => {
    expect(DOAC_PROTOCOLS.catalyst.days.minor).toBe(1);
    expect(DOAC_PROTOCOLS['1-3-6-12'].days.verySevere).toBe(12);
  });
});
