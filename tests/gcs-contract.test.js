import { describe, expect, it } from 'vitest';
import { calculateGCS } from '../src/calculators.js';
import { reviewedGcs } from '../src/encounter-clinical-review.js';

describe('published GCS contract matches the strict Encounter assessment', () => {
  it('retains all valid eye/verbal/motor score combinations', () => {
    for (let eye=1;eye<=4;eye++) for (let verbal=1;verbal<=5;verbal++) for (let motor=1;motor<=6;motor++) {
      const values={eye,verbal,motor};
      expect(calculateGCS(values)).toBe(eye+verbal+motor);
      expect(calculateGCS(Object.fromEntries(Object.entries(values).map(([key,value])=>[key,String(value)])))).toBe(eye+verbal+motor);
      expect(calculateGCS(values)).toBe(reviewedGcs(values));
    }
  });
  it.each(['', ' ', undefined, null, false, true, 0, -1, 7, 9, 1.5, '4abc', '4/4', '0x4', 'UN', 'NT', NaN, Infinity, -Infinity])('rejects incomplete, untestable, malformed or out-of-range component %s', value => {
    for (const key of ['eye','verbal','motor']) {
      const items={eye:'4',verbal:'5',motor:'6',[key]:value};
      expect(calculateGCS(items)).toBeNull();
      expect(calculateGCS(items)).toBe(reviewedGcs(items));
    }
  });
  it.each([undefined, null, false, true, 15, '456', [], {}])('does not turn a missing or malformed record into a score: %j', input => {
    expect(calculateGCS(input)).toBeNull();
  });
});
