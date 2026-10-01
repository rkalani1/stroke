import { describe, it, expect } from 'vitest';
import { calculateNIHSS, calculateGCS, calculateICHScore, calculateICHVolume, calculateCrCl, calculateAlteplaseDose } from '../src/calculators.js';

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

describe('calculateGCS', () => {
  it('returns 15 for full score', () => {
    expect(calculateGCS({ eye: '4', verbal: '5', motor: '6' })).toBe(15);
  });

  it('returns 3 for minimum', () => {
    expect(calculateGCS({ eye: '1', verbal: '1', motor: '1' })).toBe(3);
  });

  it('returns null when nothing entered', () => {
    expect(calculateGCS({})).toBeNull();
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
    expect(calculateICHScore({ gcs: 'gcs34', criteriaReviewed: true })).toBe(2);
  });
  it('GCS 5-12 scores 1', () => {
    expect(calculateICHScore({ gcs: 'gcs512', criteriaReviewed: true })).toBe(1);
  });
  it('aggregates all positive factors (max = 6)', () => {
    const items = { gcs: 'gcs34', age80: true, volume30: true, ivh: true, infratentorial: true, criteriaReviewed: true };
    expect(calculateICHScore(items)).toBe(6);
  });
  it('returns null until the GCS tier and binary-criteria review are explicit', () => {
    expect(calculateICHScore({})).toBeNull();
    expect(calculateICHScore({ gcs: 'gcs1315' })).toBeNull();
    expect(calculateICHScore({ criteriaReviewed: true })).toBeNull();
    expect(calculateICHScore({ gcs: 'gcs1315', criteriaReviewed: true })).toBe(0);
  });
});

describe('calculateICHVolume (ABC/2)', () => {
  it('computes A*B*C/2', () => {
    const r = calculateICHVolume({ lengthCm: 4, widthCm: 3, slicesCm: 5 });
    expect(r.volume).toBe(30);
    expect(r.isDualConsult).toBe(true);
    expect(r.meetsNonTraumaticIphDualConsultVolume).toBe(true);
    expect(r.isLarge).toBe(true);
  });
  it('separates the >=15 mL early-evaluation trigger from >=30 mL large-hematoma tier', () => {
    const r = calculateICHVolume({ lengthCm: 3, widthCm: 2, slicesCm: 5 });
    expect(r.volume).toBe(15);
    expect(r.isDualConsult).toBe(true);
    expect(r.meetsNonTraumaticIphDualConsultVolume).toBe(true);
    expect(r.isLarge).toBe(false);
  });
  it('returns null for zero dimension', () => {
    expect(calculateICHVolume({ lengthCm: 0, widthCm: 3, slicesCm: 5 })).toBeNull();
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
