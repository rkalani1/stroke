// src/evidence/__tests__/matcher.test.js
//
// Regression tests for Phase 7 — matcher field bindings. These guard the
// "Missing data: Age" / "Missing data: pre-stroke mRS" failure mode: the
// matcher must NOT mark age or premorbidMRS as missing when the user has
// populated them on the encounter form.

import { describe, it, expect } from 'vitest';
import {
  tryInt,
  pickEncounterField,
  trialGte,
  trialLte,
  ageOf,
  nihssOf,
  premorbidOf
} from '../matcher-helpers.js';

describe('matcher field-binding helpers', () => {
  describe('tryInt', () => {
    it('parses strings of digits', () => {
      expect(tryInt('55')).toBe(55);
      expect(tryInt('0')).toBe(0);
    });
    it('returns null for empty / null / undefined', () => {
      expect(tryInt('')).toBeNull();
      expect(tryInt(null)).toBeNull();
      expect(tryInt(undefined)).toBeNull();
    });
    it('returns null for non-numeric strings', () => {
      expect(tryInt('abc')).toBeNull();
      expect(tryInt('  ')).toBeNull(); // empty after trim — parseInt returns NaN
    });
    it('preserves numeric inputs (defends against string→number coercion drift)', () => {
      expect(tryInt(0)).toBe(0);
      expect(tryInt(55)).toBe(55);
    });
  });

  describe('pickEncounterField', () => {
    it('returns first non-empty value', () => {
      expect(pickEncounterField('', '55', '99')).toBe('55');
      expect(pickEncounterField(undefined, null, 'abc')).toBe('abc');
    });
    it('preserves "0" string (a valid mRS / NIHSS value)', () => {
      // The legacy `||` pattern would have returned the next arg here, swallowing the 0.
      expect(pickEncounterField('0', 'fallback')).toBe('0');
    });
    it('preserves number 0 (defensive — should not happen in practice but mustn\'t silently fall through)', () => {
      expect(pickEncounterField(0, 'fallback')).toBe(0);
    });
    it('returns undefined when nothing usable', () => {
      expect(pickEncounterField('', null, undefined, '   ')).toBeUndefined();
    });
  });

  describe('canonical accessors', () => {
    it('ageOf reads from telestrokeNote.age first', () => {
      expect(ageOf({ telestrokeNote: { age: '72' }, strokeCodeForm: { age: '99' } })).toBe('72');
    });
    it('ageOf falls back to strokeCodeForm.age when telestrokeNote.age is empty', () => {
      expect(ageOf({ telestrokeNote: { age: '' }, strokeCodeForm: { age: '88' } })).toBe('88');
    });
    it('ageOf returns undefined when both empty', () => {
      expect(ageOf({ telestrokeNote: { age: '' }, strokeCodeForm: { age: '' } })).toBeUndefined();
    });
    it('ageOf handles missing parent objects defensively', () => {
      expect(ageOf({})).toBeUndefined();
      expect(ageOf(null)).toBeUndefined();
      expect(ageOf(undefined)).toBeUndefined();
    });
    it('premorbidOf reads only from telestrokeNote.premorbidMRS (canonical path)', () => {
      expect(premorbidOf({ telestrokeNote: { premorbidMRS: '0' } })).toBe('0');
      expect(premorbidOf({ telestrokeNote: { premorbidMRS: '2' } })).toBe('2');
      expect(premorbidOf({ telestrokeNote: { premorbidMRS: '' } })).toBeUndefined();
    });
    it('nihssOf prefers telestrokeNote.nihss, then strokeCodeForm.nihss, then nihssScore', () => {
      expect(nihssOf({ telestrokeNote: { nihss: '12' }, strokeCodeForm: { nihss: '8' }, nihssScore: 4 })).toBe('12');
      expect(nihssOf({ telestrokeNote: { nihss: '' }, strokeCodeForm: { nihss: '8' }, nihssScore: 4 })).toBe('8');
      expect(nihssOf({ telestrokeNote: { nihss: '' }, strokeCodeForm: { nihss: '' }, nihssScore: 4 })).toBe(4);
    });
  });

  // ===== The Phase 7 regression cases =====
  describe('Phase 7 regression: Age and pre-stroke mRS must not be flagged missing when populated', () => {
    it('SISTER age criterion: telestrokeNote.age = "55" → met (not unknown)', () => {
      const data = { telestrokeNote: { age: '55', premorbidMRS: '1' }, strokeCodeForm: { age: '' } };
      // Mirrors the SISTER criterion's evaluator: trialGte(ageOf(data), 18)
      expect(trialGte(ageOf(data), 18)).toBe(true);
    });
    it('SISTER age criterion: empty form → unknown (null), NOT not_met', () => {
      const data = { telestrokeNote: { age: '', premorbidMRS: '' }, strokeCodeForm: { age: '' } };
      expect(trialGte(ageOf(data), 18)).toBeNull();
    });
    it('SISTER pre-stroke mRS criterion: premorbidMRS = "0" → met', () => {
      const data = { telestrokeNote: { age: '55', premorbidMRS: '0' } };
      expect(trialLte(premorbidOf(data), 2)).toBe(true);
    });
    it('SISTER pre-stroke mRS criterion: premorbidMRS = "3" → not_met (false), not unknown', () => {
      const data = { telestrokeNote: { age: '55', premorbidMRS: '3' } };
      expect(trialLte(premorbidOf(data), 2)).toBe(false);
    });
    it('SISTER pre-stroke mRS criterion: premorbidMRS = "" → unknown', () => {
      const data = { telestrokeNote: { age: '55', premorbidMRS: '' } };
      expect(trialLte(premorbidOf(data), 2)).toBeNull();
    });
    it('TESTED pre-stroke mRS 3-4 criterion: mrs = "3" → met (mid-range)', () => {
      const data = { telestrokeNote: { age: '70', premorbidMRS: '3' } };
      const mrs = tryInt(premorbidOf(data));
      const result = mrs === null ? null : (mrs >= 3 && mrs <= 4);
      expect(result).toBe(true);
    });
    it('TESTED pre-stroke mRS 3-4 criterion: mrs = "" → unknown (NOT false from null comparison)', () => {
      const data = { telestrokeNote: { age: '70', premorbidMRS: '' } };
      const mrs = tryInt(premorbidOf(data));
      const result = mrs === null ? null : (mrs >= 3 && mrs <= 4);
      expect(result).toBeNull();
    });
    it('PICASSO age 18-79 range: age = "55" → met', () => {
      const data = { telestrokeNote: { age: '55' } };
      const age = tryInt(ageOf(data));
      const result = age === null ? null : (age >= 18 && age <= 79);
      expect(result).toBe(true);
    });
    it('PICASSO age 18-79 range: age = "" → unknown (regression: must not return false)', () => {
      const data = { telestrokeNote: { age: '' } };
      const age = tryInt(ageOf(data));
      const result = age === null ? null : (age >= 18 && age <= 79);
      expect(result).toBeNull();
    });
    it('PICASSO age 18-79 range: age = "85" → not_met', () => {
      const data = { telestrokeNote: { age: '85' } };
      const age = tryInt(ageOf(data));
      const result = age === null ? null : (age >= 18 && age <= 79);
      expect(result).toBe(false);
    });
    it('NIHSS criterion handles cases where nihssScore is the only source (e.g., calculator-driven)', () => {
      const data = { telestrokeNote: { nihss: '' }, strokeCodeForm: { nihss: '' }, nihssScore: 8 };
      expect(trialGte(nihssOf(data), 6)).toBe(true);
    });
  });
});
