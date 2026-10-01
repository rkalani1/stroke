import { describe, expect, it } from 'vitest';
import * as eager from '../src/evidence-encounter.js';
import * as canonical from '../src/evidence/index.js';
import { readFileSync } from 'node:fs';

describe('Encounter evidence retains canonical clinical behavior', () => {
  it('retains the canonical active records, claims, recommendations, citations and labels', () => {
    for (const name of ['activeTrials', 'recommendations', 'claims', 'citations', 'topics']) expect(eager[name]).toBe(canonical[name]);
    for (const name of ['VERIFICATION_STATUS_LABELS', 'CERTAINTY_LABELS', 'EVIDENCE_TYPE_LABELS', 'ACTIVE_STATUS_LABELS']) expect(eager[name]).toEqual(canonical[name]);
  });
  it('resolves every claim and citation exactly as the atlas does', () => {
    const claims = canonical.claims.map(item => item.id);
    const citations = canonical.citations.map(item => item.id);
    expect(eager.resolveClaimsWithCitations(claims)).toEqual(canonical.resolveClaimsWithCitations(claims));
    expect(eager.resolveCitations(citations)).toEqual(canonical.resolveCitations(citations));
    expect(eager.resolveClaimsWithCitations(['missing', null])).toEqual([]);
    for (const filters of [{}, { query: 'stroke' }, { topic: 'thrombolysis' }, { status: 'recruiting' }]) {
      expect(eager.filterActiveTrials(filters)).toEqual(canonical.filterActiveTrials(filters));
    }
  });
  it('does not import a reference-data barrel or the deferred detail datasets', () => {
    const source = readFileSync(new URL('../src/evidence-encounter.js', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from ['"].*(completedTrials|guideline-library|evidence\/index)/);
  });
});
