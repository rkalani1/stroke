import { completeCases } from './fixtures/clinical-complete-cases.js';
import { describe, expect, it } from 'vitest';
import { evaluateDAWN, evaluateDEFUSE3, recommendAcuteDAPT, evaluateLargeCoreEVT } from '../src/calculators-extended.js';

describe('September 2026 source and incomplete-input regressions', () => {
  const perfusion = { age: 65, nihss: 12, coreMl: 50, hypoperfusedMl: 150, timeFromLKWh: 10 };
  it('requires the full modeled DAWN and DEFUSE-3 input set', () => {
    expect(evaluateDAWN({ age: 65, nihss: 12, coreMl: 20 })).toBeNull();
    expect(evaluateDEFUSE3({ coreMl: 20, hypoperfusedMl: 90 })).toBeNull();
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: -1 })).toBeNull();
    expect(evaluateDEFUSE3({ ...perfusion, hypoperfusedMl: 49 })).toBeNull();
    expect(evaluateDAWN({ age: 17, nihss: 12, coreMl: 20, timeFromLKWh: 10 }).eligible).toBe(false);
  });
  it('uses strict DEFUSE-3 core and age boundaries, with total hypoperfused volume', () => {
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: 69.9, age: 90 }).eligible).toBe(true);
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: 70 }).meetsCore).toBe(false);
    expect(evaluateDEFUSE3({ ...perfusion, age: 91 }).eligible).toBe(false);
    expect(evaluateDEFUSE3(perfusion).mismatchVolumeMl).toBe(100);
    expect(evaluateDEFUSE3(perfusion).reason).toMatch(/not complete EVT eligibility/);
  });
  it('does not give low-risk TIA a minor-stroke DAPT branch or assume onset time', () => {
    expect(recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, strokeType: 'tia', nihss: 0, abcd2: 2, timeFromOnsetH: 12 }).regimen).toBe('individualized-review');
    expect(recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, strokeType: 'ischemic', nihss: 2 }).regimen).toBe('—');
    expect(recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, strokeType: 'ischemic', nihss: 2, timeFromOnsetH: -1 }).regimen).toBe('—');
  });
  it('requires atherosclerotic features for the INSPIRES extension', () => {
    const patient = { ...completeCases.recommendAcuteDAPT, strokeType: 'ischemic', nihss: 4, timeFromOnsetH: 48 };
    expect(recommendAcuteDAPT(patient).regimen).toBe('individualized-review');
    expect(recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, ...patient, atherosclerotic: true }).rationale).toMatch(/INSPIRES/);
    expect(recommendAcuteDAPT({ ...completeCases.recommendAcuteDAPT, strokeType: 'ischemic', nihss: 2, timeFromOnsetH: 80 }).regimen).toBe('individualized-review');
  });
  it('does not invent a universal large-core upper limit or accept an unknown vessel', () => {
    const patient = { age: 65, nihss: 16, coreMl: 110, aspects: 4, timeFromLKWh: 8, premorbidMRS: 0, lvoLocation: 'M1' };
    expect(evaluateLargeCoreEVT(patient).beyondTrialRange).toBe(false);
    expect(evaluateLargeCoreEVT(patient).rationale).toMatch(/not outside all trial evidence/);
    expect(evaluateLargeCoreEVT({ ...patient, lvoLocation: undefined }).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT({ ...patient, timeFromLKWh: -1 }).eligible).toBe(false);
    expect(evaluateLargeCoreEVT({ ...patient, age: 81, aspects: 1, coreMl: undefined, timeFromLKWh: 5 }).matchingTrials).not.toContain('LASTE');
  });

});
