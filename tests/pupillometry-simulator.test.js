import { describe, it, expect } from 'vitest';
import {
  interpretPupillometry,
  computeMidlineShift,
  contralateralInitialSize
} from '../src/simulators/PupillometrySimulator.jsx';

/* Default profile = the slider defaults (normal). */
const normal = { npi: 4.5, cv: 1.5, change: 20, diff: 0.0 };

describe('Pupillometry simulator — interpretation cascade (ORDER MATTERS)', () => {
  it('flags NORMAL PROFILE for the default healthy profile', () => {
    const r = interpretPupillometry(normal);
    expect(r.status).toBe('NORMAL PROFILE');
    expect(r.tone).toBe('ok');
    expect(r.riskPercent).toBe(10);
  });

  it('flags HERNIATION CRISIS at NPi ≤ 1.0 (code threshold, not 0.0)', () => {
    expect(interpretPupillometry({ ...normal, npi: 0.5 }).status).toBe('HERNIATION CRISIS (CRITICAL)');
    expect(interpretPupillometry({ ...normal, npi: 1.0 }).status).toBe('HERNIATION CRISIS (CRITICAL)');
    const r = interpretPupillometry({ ...normal, npi: 0.5 });
    expect(r.tone).toBe('crit');
    expect(r.riskPercent).toBe(100);
  });

  it('does NOT call herniation just above 1.0 (1.1 falls to severe via NPi < 2.8)', () => {
    const r = interpretPupillometry({ ...normal, npi: 1.1 });
    expect(r.status).toBe('SEVERE SHIFT ALARM');
  });

  it('flags SEVERE SHIFT ALARM at NPi 2.5 (NPi < 2.8)', () => {
    const r = interpretPupillometry({ ...normal, npi: 2.5 });
    expect(r.status).toBe('SEVERE SHIFT ALARM');
    expect(r.tone).toBe('gold');
    expect(r.riskPercent).toBe(75);
  });

  it('flags SEVERE SHIFT ALARM on inter-eye diff ≥ 0.7 even with normal NPi', () => {
    expect(interpretPupillometry({ ...normal, diff: 0.7 }).status).toBe('SEVERE SHIFT ALARM');
  });

  it('flags SEVERE SHIFT ALARM on CV < 0.5 even with normal NPi', () => {
    expect(interpretPupillometry({ ...normal, cv: 0.4 }).status).toBe('SEVERE SHIFT ALARM');
  });

  it('flags EARLY CLINICAL ALARM at NPi 2.9 (NPi < 3.0 but ≥ 2.8)', () => {
    const r = interpretPupillometry({ ...normal, npi: 2.9 });
    expect(r.status).toBe('EARLY CLINICAL ALARM');
    expect(r.tone).toBe('warn');
    expect(r.riskPercent).toBe(45);
  });

  it('flags EARLY CLINICAL ALARM on CV in [0.5, 0.8) with normal NPi', () => {
    expect(interpretPupillometry({ ...normal, cv: 0.7 }).status).toBe('EARLY CLINICAL ALARM');
  });

  it('flags EARLY CLINICAL ALARM on % constriction < 10 with normal NPi', () => {
    expect(interpretPupillometry({ ...normal, change: 5 }).status).toBe('EARLY CLINICAL ALARM');
  });

  it('herniation wins over severe/early (cascade order)', () => {
    // diff ≥ 0.7 would be severe, but NPi ≤ 1.0 short-circuits first.
    expect(interpretPupillometry({ npi: 0.0, cv: 0.0, change: 0, diff: 2.0 }).status)
      .toBe('HERNIATION CRISIS (CRITICAL)');
  });
});

describe('Pupillometry simulator — midline-shift estimate', () => {
  it('returns zero shift and low probability when symmetric (diff 0)', () => {
    const s = computeMidlineShift(0.0);
    expect(s.ichShift).toBe(0);
    expect(s.strokeShift).toBe(0);
    expect(s.highProbability).toBe(false);
    expect(s.probabilityLabel).toBe('Low probability');
  });

  it('scales ICH (×5.5) and ischemic (×8.0) shift with diff', () => {
    const s = computeMidlineShift(0.8);
    expect(s.ichShift).toBeCloseTo(4.4, 5);    // 0.8 × 5.5
    expect(s.strokeShift).toBeCloseTo(6.4, 5); // 0.8 × 8.0
  });

  it('flags HIGH probability of clinically significant shift at diff ≥ 0.7', () => {
    expect(computeMidlineShift(0.7).highProbability).toBe(true);
    expect(computeMidlineShift(0.7).probabilityLabel).toBe('High probability');
    expect(computeMidlineShift(0.6).highProbability).toBe(false);
  });
});

describe('Pupillometry simulator — contralateral anisocoria', () => {
  it('mirrors the ipsilateral size when symmetric', () => {
    expect(contralateralInitialSize(4.0, 0.0)).toBe(4.0);
  });

  it('shrinks the contralateral baseline by diff × 1.5 mm', () => {
    expect(contralateralInitialSize(4.0, 1.0)).toBe(2.5); // 4.0 − 1.5
  });

  it('floors the contralateral size at 1.5 mm', () => {
    expect(contralateralInitialSize(2.0, 2.0)).toBe(1.5); // would be -1.0 → floored
  });
});
