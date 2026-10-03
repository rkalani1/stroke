import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { calculateCrCl, calculateCrClReviewed, calculateTNKDoseReviewed, calculateICHVolumeReviewed } from '../src/calculators.js';
import { computeLKWCountdown, evaluateLargeCoreEVT } from '../src/calculators-extended.js';

const invalidNumbers = [undefined, null, '', ' ', NaN, Infinity, -Infinity, '80kg', true, {}, '0x50'];

describe('reviewed clinical numbers and legacy boundary', () => {
  it.each(invalidNumbers)('rejects invalid CrCl weight %s', value => {
    expect(calculateCrClReviewed(70, value, 'M', 1)).toBeNull();
  });
  it('requires adult age, valid renal inputs and valid optional height', () => {
    for (const age of [-1, 0, 17, 121, Infinity]) expect(calculateCrClReviewed(age, 80, 'M', 1)).toBeNull();
    for (const cr of [0, -1, Infinity, '1mg']) expect(calculateCrClReviewed(70, 80, 'M', cr)).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1, Infinity)).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1).value).toBe(77.8);
    expect(calculateCrClReviewed(70, 80, 'M', 10).label).not.toMatch(/consider dialysis/);
  });
  it('rejects nonfinite ABC/2 and states the correct unit multiplier', () => {
    for (const dimension of invalidNumbers) expect(calculateICHVolumeReviewed({ lengthCm: dimension, widthCm: 3, slicesCm: 5 })).toBeNull();
    expect(calculateICHVolumeReviewed({ lengthCm: 4, widthCm: 3, slicesCm: 5 }).volume).toBe(30);
    const result = calculateICHVolumeReviewed({ lengthCm: 50, widthCm: 3, slicesCm: 5 });
    expect(result.unitWarning).toContain('one dimension inflates ABC/2 tenfold');
    expect(result.unitWarning).toContain('all three inflates it 1000-fold');
  });
  it('uses unrounded CrCl categories near decision boundaries without a dialysis assertion', () => {
    const borderline = calculateCrClReviewed(70, 80, 'M', 5.19);
    expect(borderline.value).toBe(15);
    expect(borderline.rawValue).toBeLessThan(15);
    expect(borderline.label).not.toMatch(/dialysis/i);
    const below30 = calculateCrClReviewed(68, 75, 'M', 75 / 29.95);
    expect(below30.value).toBe(30);
    expect(below30.rawValue).toBeCloseTo(29.95, 10);
    expect(below30.label).toBe('Severe (<30)');
    expect(calculateCrClReviewed(68, 75, 'M', 2.5).label).toBe('Moderate (30-49)');
  });
});

describe('TNK dose authority and boundaries', () => {
  it.each([[59.9, 15], [60, 17.5], [69.9, 17.5], [70, 20], [79.9, 20], [80, 22.5], [89.9, 22.5], [90, 25], [150, 25]])('uses FDA weight bands at %s kg', (weight, dose) => {
    const result = calculateTNKDoseReviewed(weight, 'fda-label');
    expect(Number(result.calculatedDose)).toBe(dose);
    expect(parseFloat(result.volume)).toBe(dose / 5);
    expect(result.authorityLabel).toContain('weight bands');
    expect(result.sourceUrl).toContain('dailymed');
  });
  it('uses exact guideline mg/kg without silently rounding the dose', () => {
    const result = calculateTNKDoseReviewed(70.4);
    expect(Number(result.calculatedDose)).toBe(17.6);
    expect(parseFloat(result.volume)).toBe(3.52);
    expect(result.authorityLabel).toContain('0.25 mg/kg');
    expect(result.roundingNote).toMatch(/no additional syringe rounding/i);
    expect(calculateTNKDoseReviewed(100).calculatedDose).toBe('25');
    expect(calculateTNKDoseReviewed(150).calculatedDose).toBe('25');
  });
  it.each([...invalidNumbers, 0, -1, 351])('rejects invalid TNK weight %s', weight => expect(calculateTNKDoseReviewed(weight)).toBeNull());
  it('rejects an unrecognized dosing authority', () => expect(calculateTNKDoseReviewed(70, 'unknown')).toBeNull());
});

describe('measurement and time validation', () => {
  it('rejects future LKW and invalid current time', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(computeLKWCountdown('2026-09-30T12:00:01Z', now)).toBeNull();
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', Infinity)).toBeNull();
    expect(computeLKWCountdown('invalid', now)).toBeNull();
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', now).toLytic).toBe('4:30:00');
    expect(computeLKWCountdown('2026-09-30T07:30:00Z', now).toLyticClosed).toBe(true);
  });
  it.each([true, false, 1, [1], {}, new Date('2026-09-30'), '1', '2026-09-30', '09/30/2026 01:00', '2026-02-31T00:00Z', '2026-02-29T00:00Z', '2026-04-31T00:00Z', '2026-09-30T24:00Z', '2026-09-30T00:60Z', '2026-09-30T00:00:60Z', '2026-09-30T00:00+24:00', '2026-09-30T00:00+00:60'])('rejects malformed or impossible LKW %s', value => {
    expect(computeLKWCountdown(value, Date.parse('2026-10-01T00:00Z'))).toBeNull();
  });
  it('accepts valid ISO offsets, leap days, and datetime-local with optional precision', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(computeLKWCountdown('2026-09-30T13:00:00+02:00', now).elapsedMinutes).toBe(60);
    expect(computeLKWCountdown('2024-02-29T12:00:00.125Z', Date.parse('2024-02-29T12:01:00.125Z')).elapsedMinutes).toBe(1);
    for (const local of ['2026-09-30T10:00', '2026-09-30T10:00:00', '2026-09-30T10:00:00.125']) {
      expect(computeLKWCountdown(local, new Date(local).getTime() + 60000).elapsedMinutes).toBe(1);
    }
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', 1e308)).toBeNull();
  });
});

describe("locked legacy export preservation", () => {

  it("calculateCrCl body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateCrCl = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("a21758efbfc312795158c2f7caf51786cebd071e089fe6550ccee624586a670b");
  });
  it("calculateICHVolume body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateICHVolume = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("13337a2062cc0b6c715b197ba57c7d576fb682abaf2d8046fb6d6e3d96db79e7");
  });


  it("calculateAlteplaseDose body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateAlteplaseDose = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("166cd6df8237f65eb8fa551e597953bd088ea500412cdcb91b677232cd8b8f8a");
  });
});


describe('large-core trial version and subset boundaries', () => {
  const input = { age: 86, nihss: 6, aspects: 4, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1' };
  it('does not apply SELECT2 age85 cap to RESCUE-Japan LIMIT', () => {
    for (const age of [85, 86]) expect(evaluateLargeCoreEVT({ ...input, age }).matchingTrials).toContain('RESCUE-Japan LIMIT');
    expect(evaluateLargeCoreEVT(input).matchingTrials).not.toContain('SELECT-2');
  });
  it('preserves final-publication NIHSS6 and discloses the LASTE modeled subset', () => {
    for (const nihss of [6, 7]) {
      const result = evaluateLargeCoreEVT({ ...input, age: 65, aspects: 1, nihss });
      expect(result.matchingTrials).toContain('LASTE');
      expect(result.modeledSubsets.LASTE).toContain('Only the age <80');
      expect(result.nihssSourceNote).toContain('final LASTE/TESLA publications');
      expect(result.rationale).toContain('does not establish complete trial or EVT eligibility');
    }
  });
  it('rejects partial numeric strings and nonnumeric input in every domain', () => {
    const valid = { ...input, age: 65, coreMl: 80 };
    for (const key of ['age', 'nihss', 'aspects', 'coreMl', 'timeFromLKWh', 'premorbidMRS']) {
      for (const value of ['65abc', '5 days', [10], true, {}, Infinity, '1e999']) {
        expect(evaluateLargeCoreEVT({ ...valid, [key]: value }).status, `${key}: ${String(value)}`).toBe('incomplete');
      }
    }
    for (const lvoLocation of [1, true, ['M1'], {}, null]) expect(evaluateLargeCoreEVT({ ...valid, lvoLocation }).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT(null).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT({ ...valid, aspects: undefined }).status).toBe('partial-screen-met');
    expect(evaluateLargeCoreEVT({ ...valid, coreMl: undefined }).status).toBe('partial-screen-met');
    expect(evaluateLargeCoreEVT({ ...valid, age: '65', nihss: '6', timeFromLKWh: '5' }).status).toBe('partial-screen-met');
  });
});
