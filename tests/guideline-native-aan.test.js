import { describe, expect, it } from 'vitest';
import { GUIDELINE_LIBRARY_INDEX, guidelineGradeLabel, guidelineSearchFields } from '../src/guideline-library.js';

describe('source-native AAN recommendation labels', () => {
  const docs = GUIDELINE_LIBRARY_INDEX.filter(g => g.gradingSystem === 'AAN');

  it('preserves all61 source levels and the separate no-consensus statement', () => {
    expect(docs.map(d => d.id).sort()).toEqual([
      'aan-asm-withdrawal-2021', 'aan-functional-seizures-2025', 'aan-sicas-2022'
    ]);
    const rows = docs.flatMap(d => d.recommendations.map(r => ({ r, d })));
    expect(rows).toHaveLength(62);
    const graded = rows.filter(({ r }) => r.nativeRecommendationLevel);
    expect(graded).toHaveLength(61);
    for (const { r, d } of graded) {
      expect(r.text).toMatch(new RegExp(`\\bLevel ${r.nativeRecommendationLevel}\\b`));
      expect(r.classOfRec).toBe('Statement');
      expect(r.levelOfEvidence).toBe('Ungraded');
      expect(guidelineGradeLabel(r, d)).toBe(`AAN Level ${r.nativeRecommendationLevel}`);
      expect(guidelineSearchFields(r, d)).toContain(`AAN Level ${r.nativeRecommendationLevel}`);
    }
    const ungraded = rows.filter(({ r }) => !r.nativeRecommendationLevel);
    expect(ungraded).toHaveLength(1);
    expect(ungraded[0].r.text).toContain('could not achieve consensus');
    expect(guidelineGradeLabel(ungraded[0].r, ungraded[0].d)).toBe('AAN: no consensus');
  });

  it('does not conflate AAN levels with AHA classes or GRADE certainty', () => {
    expect(guidelineGradeLabel({ classOfRec: 'I', levelOfEvidence: 'A' }, { gradingSystem: 'AHA' })).toBe('I/A');
    expect(guidelineGradeLabel({ classOfRec: 'Conditional', levelOfEvidence: 'Very low certainty' }, { gradingSystem: 'GRADE' })).toBe('Conditional/Very low certainty');
    expect(guidelineGradeLabel({ nativeRecommendationLevel: 'I' }, { gradingSystem: 'AAN' })).toBe('Statement/Ungraded');
    expect(guidelineGradeLabel({ nativeRecommendationLevel: 'A' }, { gradingSystem: 'ungraded' })).toBe('Statement/Ungraded');
  });
});
