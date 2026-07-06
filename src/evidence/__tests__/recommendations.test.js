import { describe, it, expect } from 'vitest';
import { recommendations, getRecommendation, getAllRecommendationIds } from '../recommendations.js';
import { CLASS_VALUES, LOE_VALUES, SETTING_VALUES, VERIFICATION_VALUES } from '../schema.js';

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
      expect(CLASS_VALUES).toContain(rec.classOfRecommendation);
      expect(LOE_VALUES).toContain(rec.levelOfEvidence);

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

    for (const rec of recommendations) {
      expect(idsSet.has(rec.id)).toBe(true);
    }
  });
});
