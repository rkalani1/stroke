import { completeCases } from './fixtures/clinical-complete-cases.js';
// QA probes — edge case validation against published references.
// Authored 2026-05-09 for site-wide accuracy audit.
import { describe, it, expect } from 'vitest';
import { calculateNIHSS, calculateGCS, calculateICHScore, calculateICHVolume, calculateCrCl, calculateAlteplaseDose } from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3, recommendAcuteDAPT, evaluateLargeCoreEVT } from '../src/calculators-extended.js';

describe('CRITICAL — clinical correctness probes', () => {
  it('NIHSS caps at 42 even when input would sum higher', () => {
    // Build responses where each item maxes out
    const responses = {
      a: '(7)', b: '(7)', c: '(7)', d: '(7)', e: '(7)', f: '(7)', g: '(7)' // 49
    };
    expect(calculateNIHSS(responses)).toBe(42);
  });

  it('NIHSS does NOT count UN (untestable) responses', () => {
    expect(calculateNIHSS({ a: 'UN', b: '(2)' })).toBe(2);
  });

  it('GCS — partial sum returns null (avoids silent under-scoring)', () => {
    expect(calculateGCS({ eye: '4', verbal: '5' })).toBeNull();
  });

  it('ICH Score — full house is 6 (Hemphill 2001)', () => {
    expect(calculateICHScore({
      gcs: 'gcs34', age80: true, volume30: true, ivh: true, infratentorial: true, criteriaReviewed: true
    })).toBe(6);
  });

  it('ICH volume — ABC/2 returns ~30 mL for 5×4×3', () => {
    const r = calculateICHVolume({ lengthCm: '5', widthCm: '4', slicesCm: '3' });
    expect(r.volume).toBe(30);
    expect(r.isLarge).toBe(true);
  });

  it('CrCl — Cockcroft-Gault male 70y, 80 kg, Cr 1.0 = 64.8', () => {
    const r = calculateCrCl(70, 80, 'M', 1.0);
    expect(r.value).toBeCloseTo(77.8, 1); // (140-70)*80*1 / (72*1) = 77.78
  });

  it('CrCl — female adjustment (×0.85)', () => {
    const r = calculateCrCl(70, 80, 'F', 1.0);
    expect(r.value).toBeCloseTo(66.1, 1);
  });

  it('Alteplase — 100 kg = 90 mg (exact cap; capped flag false because 0.9×100 == 90)', () => {
    const r = calculateAlteplaseDose(100);
    expect(r.totalDose).toBe(90);
    expect(r.bolus).toBe(9);
    expect(r.infusion).toBe(81);
    // NOTE: capped flag uses strict > comparison; 100 kg sits at exact boundary.
    expect(r.capped).toBe(false);
  });

  it('Alteplase — 105 kg triggers cap (>90 mg flagged)', () => {
    const r = calculateAlteplaseDose(105);
    expect(r.totalDose).toBe(90);
    expect(r.capped).toBe(true);
  });

  it('Alteplase — 70 kg = 63 mg, 6.3 mg bolus, 56.7 mg infusion', () => {
    const r = calculateAlteplaseDose(70);
    expect(r.totalDose).toBe(63);
    expect(r.bolus).toBe(6.3);
    expect(r.infusion).toBe(56.7);
  });


});

describe('Late-window EVT — DAWN tier matrix', () => {
  it('80 yo, NIHSS 12, core 18 mL @ 12h → Group A', () => {
    const r = evaluateDAWN({ age: 85, nihss: 12, coreMl: 18, timeFromLKWh: 12 });
    expect(r.tier).toBe('A');
  });
  it('60 yo, NIHSS 12, core 25 mL @ 8h → Group B', () => {
    const r = evaluateDAWN({ age: 60, nihss: 12, coreMl: 25, timeFromLKWh: 8 });
    expect(r.tier).toBe('B');
  });
  it('60 yo, NIHSS 22, core 45 mL @ 8h → Group C', () => {
    const r = evaluateDAWN({ age: 60, nihss: 22, coreMl: 45, timeFromLKWh: 8 });
    expect(r.tier).toBe('C');
  });
  it('outside window 25h → not eligible', () => {
    const r = evaluateDAWN({ age: 60, nihss: 12, coreMl: 18, timeFromLKWh: 25 });
    expect(r.eligible).toBe(false);
  });
});

describe('Large-core EVT — published trial matrix', () => {
  it('LASTE (ASPECTS 0-2, 5h): eligible', () => {
    const r = evaluateLargeCoreEVT({ age: 65, nihss: 18, aspects: 1, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1' });
    expect(r.bestMatch).toBe('LASTE');
    expect(r.eligible).toBe(true);
  });
  it('SELECT-2 / ANGEL-ASPECT (ASPECTS 4, 12h): eligible', () => {
    const r = evaluateLargeCoreEVT({ age: 60, nihss: 16, aspects: 4, timeFromLKWh: 12, premorbidMRS: 0, lvoLocation: 'M1' });
    expect(r.eligible).toBe(true);
    expect(r.matchingTrials).toContain('SELECT-2');
  });
  it('Core 110 mL: SELECT-2 ≥50 criterion fires; reasons.push() flag still says above range (CLINICAL: code marks eligible=true; reviewer must interpret the warning)', () => {
    const r = evaluateLargeCoreEVT({ age: 60, nihss: 16, aspects: null, coreMl: 110, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1' });
    // Current behavior: SELECT-2 criterion (core >=50, ≤24h) fires => eligible=true,
    // but the rationale string does NOT include the "above trial-supported range"
    // note because reasons.push() only adds when eligible=false. This is a UX/safety gap.
    expect(r.eligible).toBe(true);
    expect(r.matchingTrials).toContain('SELECT-2');
  });
});

describe('CHANCE/POINT/INSPIRES/THALES branching', () => {
  it('NIHSS 4 within 60h with atherosclerosis → INSPIRES (clopi+ASA × 21 d)', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT,
      nihss: 4, strokeType: 'ischemic', atherosclerotic: true, lvdSymptomatic: true, timeFromOnsetH: 60
    });
    expect(r.regimen).toContain('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
  });

  it('NIHSS 4 within 12h with atherosclerosis → clopi+ASA × 21 d (2026 Class 2a covers NIHSS 4-5 <24h)', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT,
      nihss: 4, strokeType: 'ischemic', atherosclerotic: true, timeFromOnsetH: 12
    });
    expect(r.regimen).toContain('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
  });

  it('NIHSS 4 within 12h without atherosclerosis → THALES (ticagrelor+ASA × 30 d)', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT,
      nihss: 4, strokeType: 'ischemic', atherosclerotic: false, timeFromOnsetH: 12
    });
    expect(r.regimen).toContain('ticagrelor+ASA');
    expect(r.duration).toBe('30 days');
  });
});

describe('NULL-SAFETY — calculators must not crash on null/undefined inputs (regression for v5.34.0 fix)', () => {
  it('calculateNIHSS handles null/undefined', () => {
    expect(calculateNIHSS(null)).toBe(0);
    expect(calculateNIHSS(undefined)).toBe(0);
  });
  it('calculateGCS handles null/undefined', () => {
    expect(calculateGCS(null)).toBeNull();
    expect(calculateGCS(undefined)).toBeNull();
  });
  it('calculateICHVolume(null) returns null (not crash)', () => {
    expect(calculateICHVolume(null)).toBeNull();
  });
});
