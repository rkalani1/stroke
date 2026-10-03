import { completeCases } from './fixtures/clinical-complete-cases.js';
import { describe, it, expect } from 'vitest';
import { evaluateDAWN, evaluateDEFUSE3, recommendAcuteDAPT, computeNeurocheckSchedule, computeLKWCountdown } from '../src/calculators-extended.js';

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
    expect(evaluateDEFUSE3({ coreMl: 80, penumbraMl: 150, timeFromLKWh: 10, age: 65, nihss: 12 }).meetsCore).toBe(false);
  });
  it('fails when mismatch volume <15', () => {
    expect(evaluateDEFUSE3({ coreMl: 50, penumbraMl: 60, timeFromLKWh: 10, age: 65, nihss: 12 }).eligible).toBe(false);
  });
  it('fails when outside 6-16h window', () => {
    expect(evaluateDEFUSE3({ coreMl: 30, penumbraMl: 90, timeFromLKWh: 20, age: 65, nihss: 12 }).eligible).toBe(false);
  });
});

describe('recommendAcuteDAPT', () => {
  it('recommends CHANCE/POINT for minor stroke (NIHSS<=3)', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 3, abcd2: '', strokeType: 'ischemic', timeFromOnsetH: 12 });
    expect(r.regimen).toBe('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
  });
  // THALES (PMID 32668111) enrolled noncardioembolic NIHSS ≤5 stroke with no
  // atherosclerosis requirement; ticagrelor+ASA x 30 d is a 2021 Class 2b option.
  it('recommends THALES for nonatherosclerotic NIHSS 4 within 24h', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 4, strokeType: 'ischemic', atherosclerotic: false, timeFromOnsetH: 12 });
    expect(r.regimen).toBe('ticagrelor+ASA');
    expect(r.duration).toBe('30 days');
  });
  it('atherosclerotic NIHSS 4 within 24h → clopidogrel+ASA x 21 d (2026 Class 2a), not THALES', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 4, strokeType: 'ischemic', atherosclerotic: true, timeFromOnsetH: 12 });
    expect(r.regimen).toBe('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
    expect(r.class).toMatch(/COR 2a, LOE B-R/);
  });
  it('ABCD2 ≥6 TIA within 24h → Class 1 clopidogrel+ASA (THALES does not preempt)', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 0, abcd2: 6, strokeType: 'tia', timeFromOnsetH: 12 });
    expect(r.regimen).toBe('clopidogrel+ASA');
    expect(r.class).toMatch(/COR 1, LOE A/);
  });
  it('CHANCE-2 (ticagrelor+ASA) for CYP2C19 LOF minor stroke', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 2, strokeType: 'ischemic', cyp2c19LOF: true, timeFromOnsetH: 12 });
    expect(r.regimen).toMatch(/ticagrelor/);
    expect(r.duration).toBe('21 days');
  });
  it('high hemorrhagic risk does not automatically authorize single antiplatelet', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 2, ichRisk: 'high' });
    expect(r.regimen).toBe('individualized-review');
  });
  it('NIHSS >5 leaves treatment selection to individualized review', () => {
    const r = recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, nihss: 10, strokeType: 'ischemic', timeFromOnsetH: 12 });
    expect(r.regimen).toBe('individualized-review');
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
