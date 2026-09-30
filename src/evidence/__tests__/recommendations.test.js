import { describe, it, expect } from 'vitest';
import { recommendations, getRecommendation, getAllRecommendationIds } from '../recommendations.js';
import { CLASS_VALUES, LOE_VALUES, SETTING_VALUES, VERIFICATION_VALUES, makeRecommendation, validateRecommendation } from '../schema.js';

describe('recommendations', () => {
  it('is an array of recommendation objects', () => {
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('each recommendation has required fields from makeRecommendation schema', () => {
    for (const rec of recommendations) {
      expect(typeof rec.id).toBe('string');
      expect(rec.id.length).toBeGreaterThan(0);

      expect(typeof rec.topic).toBe('string');
      expect(typeof rec.text).toBe('string');
      expect(typeof rec.guidelineSource).toBe('string');

      expect(SETTING_VALUES).toContain(rec.setting);
      if (rec.gradingSystem === 'AHA') {
        expect(CLASS_VALUES).toContain(rec.classOfRecommendation);
        expect(LOE_VALUES).toContain(rec.levelOfEvidence);
      } else {
        expect(rec.classOfRecommendation).toBeNull();
        expect(rec.levelOfEvidence).toBeNull();
        expect(rec.nativeStrength).toBeTruthy();
        expect(rec.sourceUrl).toMatch(/^https:\/\//);
      }

      expect(Array.isArray(rec.supportingClaimIds)).toBe(true);
      expect(Array.isArray(rec.caveats)).toBe(true);

      expect(typeof rec.lastReviewed).toBe('string');
      expect(rec.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD

      expect(VERIFICATION_VALUES).toContain(rec.verificationStatus);
    }
  });
});

describe('getRecommendation', () => {
  it('returns the correct recommendation object by ID', () => {
    const firstId = recommendations[0].id;
    const rec = getRecommendation(firstId);
    expect(rec).toBe(recommendations[0]);
  });

  it('returns null for an unknown ID', () => {
    const rec = getRecommendation('unknown-id-12345');
    expect(rec).toBeNull();
  });
});

describe('getAllRecommendationIds', () => {
  it('returns a Set containing all recommendation IDs', () => {
    const idsSet = getAllRecommendationIds();
    expect(idsSet).toBeInstanceOf(Set);
    expect(idsSet.size).toBe(recommendations.length);
    expect(idsSet.size).toBeGreaterThan(0);

    const expectedIds = recommendations.map((r) => r.id);
    expect(Array.from(idsSet)).toEqual(expectedIds);

    for (const rec of recommendations) {
      expect(typeof rec.id).toBe('string');
      expect(idsSet.has(rec.id)).toBe(true);
    }

    for (const id of idsSet) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(getRecommendation(id)).not.toBeNull();
    }
  });
});


describe('native recommendation grading', () => {
  const base = { id: 'native-test', text: 'Source recommendation', lastReviewed: '2026-09-30', verificationStatus: 'verified-guideline' };
  it('preserves AHA defaults and explicit grades', () => {
    expect(makeRecommendation(base)).toMatchObject({ gradingSystem: 'AHA', classOfRecommendation: 'IIa', levelOfEvidence: 'B-R' });
    expect(makeRecommendation({ ...base, classOfRecommendation: 'I', levelOfEvidence: 'A' })).toMatchObject({ classOfRecommendation: 'I', levelOfEvidence: 'A' });
  });
  it('retains native GRADE without manufacturing an AHA badge', () => {
    const rec = makeRecommendation({ ...base, gradingSystem: 'GRADE', nativeStrength: 'Conditional', nativeCertainty: 'Moderate', sourceUrl: 'https://link.springer.com/article/10.1007/s12028-026-02601-4' });
    expect(rec).toMatchObject({ classOfRecommendation: null, levelOfEvidence: null, nativeStrength: 'Conditional', nativeCertainty: 'Moderate' });
    expect(validateRecommendation(rec).errors).toEqual([]);
    expect(validateRecommendation({ ...rec, classOfRecommendation: 'IIa' }).errors.join(' ')).toContain('must not carry AHA');
    expect(validateRecommendation({ ...rec, sourceUrl: '' }).errors.join(' ')).toContain('sourceUrl required');
  });
});
