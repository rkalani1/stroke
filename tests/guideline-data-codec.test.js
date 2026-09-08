import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { packGuideline } from '../scripts/guideline-data-pack.mjs';
import { unpackGuideline } from '../src/guideline-data-codec.js';

describe('Lossless guideline bundle representation', () => {
  it('round-trips every canonical guideline without dropping content or metadata', () => {
    const directory = new URL('../src/guidelines/', import.meta.url);
    let documents = 0;
    for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.json'))) {
      const original = JSON.parse(fs.readFileSync(new URL(file, directory), 'utf8'));
      if (!Array.isArray(original.recommendations)) continue;
      const encoded = JSON.parse(JSON.stringify(packGuideline(original)));
      expect(unpackGuideline(encoded), file).toEqual(original);
      documents += 1;
    }
    expect(documents).toBeGreaterThan(100);
  });
  it('preserves order, absent fields, nulls, Unicode, extra source fields and distinct row schemas', () => {
    const original = {
      id: 'test', coverage: { status: 'complete', sourceSections: [{ id: '2.1' }] },
      recommendations: [
        { text: '≥50% reduction; β-blocker', page: null, classOfRec: 'I' },
        { id: 'r2', section: '2.1', text: 'Do not omit qualifiers.', sourceRecommendationNumber: 0 },
        { text: '≥50% reduction; β-blocker', page: 12, classOfRec: 'III', additional: { consensus: false } }
      ]
    };
    const copy = unpackGuideline(JSON.parse(JSON.stringify(packGuideline(original))));
    expect(copy).toEqual(original);
    expect(Object.hasOwn(copy.recommendations[1], 'page')).toBe(false);
  });
});
