import { describe, expect, it } from 'vitest';
import { validateGuideline } from '../content/schema.mjs';

const source = {
  id: 'native-source-example', guideline: 'Synthetic grading fixture',
  year: 2026, section: 'example', statement: 'Synthetic source grading test only.',
  PMIDs: [], DOIs: [], lastReviewed: '2026-09-30',
  sourceUrl: 'https://example.org/source',
};

describe('content guideline grading provenance', () => {
  it('preserves an explicit native grade without manufacturing AHA COR/LOE', () => {
    const record = { ...source, gradingSystem: 'GRADE', COR: null, LOE: null,
      nativeStrength: 'Conditional', nativeCertainty: 'Moderate' };
    expect(validateGuideline(record).errors).toEqual([]);
    expect(validateGuideline({ ...record, COR: 'IIa', LOE: 'B-R' }).errors)
      .toEqual(expect.arrayContaining([
        'COR: must be null for non-AHA grading', 'LOE: must be null for non-AHA grading',
      ]));
  });

  it('requires source-native strength and certainty when AHA grades are absent', () => {
    const errors = validateGuideline({ ...source, gradingSystem: 'GRADE', COR: null, LOE: null }).errors;
    expect(errors.some((error) => error.startsWith('nativeStrength:'))).toBe(true);
    expect(errors.some((error) => error.startsWith('nativeCertainty:'))).toBe(true);
  });

  it('keeps the existing AHA validation strict and rejects unknown grading systems', () => {
    expect(validateGuideline({ ...source, COR: 'I', LOE: 'A' }).errors).toEqual([]);
    expect(validateGuideline({ ...source, COR: null, LOE: null }).errors.length).toBeGreaterThan(0);
    expect(validateGuideline({ ...source, gradingSystem: 'invented', COR: null, LOE: null,
      nativeStrength: 'Strong', nativeCertainty: 'High' }).errors)
      .toContain('gradingSystem: must be AHA, GRADE, or consensus');
  });

  it.each(['GRADE', 'consensus'])('requires an HTTPS source even when %s has other citation identifiers', gradingSystem => {
    const record = { ...source, gradingSystem, COR: null, LOE: null,
      nativeStrength: 'Conditional', nativeCertainty: 'Moderate', PMIDs: ['42786382'] };
    for (const sourceUrl of [undefined, null, '', 'http://example.org/source', 'https://', 'javascript:alert(1)']) {
      expect(validateGuideline({ ...record, sourceUrl }).errors)
        .toContain('sourceUrl: HTTPS primary-source URL is required for non-AHA grading');
    }
    expect(validateGuideline(record).errors).toEqual([]);
    // AHA records retain their pre-existing citation alternatives.
    expect(validateGuideline({ ...source, sourceUrl: undefined, PMIDs: ['41582814'], COR: 'I', LOE: 'A' }).errors).toEqual([]);
  });

  it('preserves ungraded consensus without inventing evidence certainty', () => {
    const record = { ...source, gradingSystem: 'consensus', COR: null, LOE: null,
      nativeStrength: 'Expert consensus' };
    expect(validateGuideline(record).errors).toEqual([]);
    expect(validateGuideline({ ...record, nativeCertainty: '' }).errors).toEqual([]);
    expect(validateGuideline({ ...record, nativeCertainty: 3 }).errors)
      .toContain('nativeCertainty: must be a string when supplied');
    expect(validateGuideline({ ...record, COR: 'I' }).errors)
      .toContain('COR: must be null for non-AHA grading');
  });
});
