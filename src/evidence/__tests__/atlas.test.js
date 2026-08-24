// src/evidence/__tests__/atlas.test.js
//
// Vitest specs for the Evidence Atlas data layer. Run with `npm run test:unit`.
// These do *not* exercise the running React app — that is covered by qa-smoke.

import { describe, it, expect } from 'vitest';
import {
  activeTrials,
  completedTrials,
  citations,
  recommendations,
  claims,
  topics,
  getActiveTrial,
  getActiveTrialByLegacyKey,
  getCompletedTrial,
  getCitation,
  filterCompletedTrials,
  filterActiveTrials,
  resolveCompletedTrials,
  resolveActiveTrials,
  resolveCitations,
  resolveClaimsWithCitations,
  relatedEvidenceFor,
  schema
} from '../index.js';

describe('Evidence Atlas — data layer', () => {
  it('seeds the active trials', () => {
    // Floor, not an exact count: the registry is expected to grow. 9 is the
    // current roster, so this still fails if a seeded trial goes missing.
    expect(activeTrials.length).toBeGreaterThanOrEqual(9);
    expect(getActiveTrial('step-evt')).toBeTruthy();
    expect(getActiveTrial('aspire')).toBeTruthy();
  });

  it('seeds the major landmark completed trials', () => {
    const ids = new Set(completedTrials.map((t) => t.id));
    for (const expected of [
      'wake-up', 'extend', 'epithet', 'ecass4-extend', 'timeless', 'twist', 'trace-iii',
      'select2', 'angel-aspect', 'rescue-japan-limit', 'tension', 'dawn', 'defuse-3',
      'act', 'trace-2', 'original',
      'interact3', 'annexa-i', 'enrich',
      'chance', 'point', 'thales', 'inspires', 'chance-2',
      'elan', 'timing',
      'averroes', 'artesia',
      'choice', 'theia', 'enchanted2-mt'
    ]) {
      expect(ids.has(expected), `expected completed trial '${expected}'`).toBe(true);
    }
  });

  it('every legacy matcher key resolves to an active trial', () => {
    for (const key of ['STEP', 'PICASSO', 'TESTED', 'VERIFY', 'MOST', 'CAPTIVA', 'RHAPSODY', 'SATURN', 'ASPIRE']) {
      expect(getActiveTrialByLegacyKey(key), `legacy key ${key}`).toBeTruthy();
    }
  });

  it('all foreign-key references resolve', () => {
    const citIds = new Set(citations.map((c) => c.id));
    const ctIds = new Set(completedTrials.map((c) => c.id));
    const atIds = new Set(activeTrials.map((c) => c.id));
    const claimIds = new Set(claims.map((c) => c.id));
    for (const t of completedTrials) {
      for (const c of t.citationIds) expect(citIds.has(c), `${t.id}→${c}`).toBe(true);
      for (const a of t.relatedActiveTrialIds) expect(atIds.has(a), `${t.id}↔${a}`).toBe(true);
    }
    for (const a of activeTrials) {
      for (const c of a.relatedCompletedTrialIds) expect(ctIds.has(c), `${a.id}↔${c}`).toBe(true);
    }
    for (const r of recommendations) {
      for (const c of r.supportingClaimIds) expect(claimIds.has(c), `${r.id}→${c}`).toBe(true);
    }
    for (const c of claims) {
      for (const cit of c.citationIds) expect(citIds.has(cit), `${c.id}→${cit}`).toBe(true);
    }
  });

  it('PMID/DOI/NCT identifiers match structural patterns', () => {
    for (const c of citations) {
      if (c.pmid) expect(c.pmid).toMatch(schema.PMID_PATTERN);
      if (c.doi) expect(c.doi).toMatch(schema.DOI_PATTERN);
    }
    for (const t of activeTrials) {
      if (t.nctId) expect(t.nctId).toMatch(schema.NCT_PATTERN);
    }
  });

  it('Class I recommendations cite at least one supporting claim', () => {
    for (const r of recommendations.filter((r) => r.classOfRecommendation === 'I')) {
      expect(r.supportingClaimIds.length, `${r.id} (Class I)`).toBeGreaterThan(0);
    }
  });

  it('topic registry covers every record topic', () => {
    const topicIds = new Set(topics.map((t) => t.id));
    for (const list of [completedTrials, activeTrials, recommendations, claims]) {
      for (const r of list) {
        if (r.topic) {
          expect(topicIds.has(r.topic), `topic '${r.topic}' for ${r.id}`).toBe(true);
        }
      }
    }
  });
});

describe('Evidence Atlas — query helpers', () => {
  it('filterCompletedTrials filters by topic', () => {
    const got = filterCompletedTrials({ topic: 'extended-window-ivt' });
    expect(got.length).toBeGreaterThan(0);
    for (const t of got) {
      const inTopic = t.topic === 'extended-window-ivt' || (t.diseaseArea || []).includes('extended-window-ivt');
      expect(inTopic).toBe(true);
    }
  });

  it('filterCompletedTrials searches across short/full name and citation titles', () => {
    expect(filterCompletedTrials({ query: 'tenecteplase' }).length).toBeGreaterThan(0);
    expect(filterCompletedTrials({ query: 'WAKE-UP' }).length).toBeGreaterThan(0);
  });

  it('filterActiveTrials filters by topic and search', () => {
    const late = filterActiveTrials({ topic: 'evt-late-window' });
    expect(late.some((t) => t.id === 'tested')).toBe(true);
    expect(filterActiveTrials({ query: 'tandem' }).some((t) => t.id === 'picasso')).toBe(true);
  });

  describe('resolveCompletedTrials', () => {
    it('returns empty array when given no arguments, null, undefined, or empty array', () => {
      expect(resolveCompletedTrials()).toEqual([]);
      expect(resolveCompletedTrials(undefined)).toEqual([]);
      expect(resolveCompletedTrials(null)).toEqual([]);
      expect(resolveCompletedTrials([])).toEqual([]);
    });

    it('resolves valid completed trial IDs into full records in order', () => {
      const result = resolveCompletedTrials(['wake-up', 'extend']);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('wake-up');
      expect(result[0].shortName).toBe('WAKE-UP');
      expect(result[1].id).toBe('extend');
      expect(result[1].shortName).toBe('EXTEND');
    });

    it('filters out dangling / unresolvable trial IDs', () => {
      const result = resolveCompletedTrials(['wake-up', 'non-existent-trial', 'extend', 'another-bad-id']);
      expect(result.length).toBe(2);
      expect(result.map((t) => t.id)).toEqual(['wake-up', 'extend']);
    });
  });

  describe('resolveActiveTrials', () => {
    it('returns empty array when given no arguments, null, undefined, or empty array', () => {
      expect(resolveActiveTrials()).toEqual([]);
      expect(resolveActiveTrials(undefined)).toEqual([]);
      expect(resolveActiveTrials(null)).toEqual([]);
      expect(resolveActiveTrials([])).toEqual([]);
    });

    it('resolves valid active trial IDs into full records in order', () => {
      const result = resolveActiveTrials(['step-evt', 'aspire']);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('step-evt');
      expect(result[1].id).toBe('aspire');
    });

    it('filters out dangling active trial IDs', () => {
      const result = resolveActiveTrials(['step-evt', 'invalid-active-id', 'aspire']);
      expect(result.length).toBe(2);
      expect(result.map((t) => t.id)).toEqual(['step-evt', 'aspire']);
    });
  });

  describe('resolveCitations', () => {
    it('returns empty array when given no arguments, null, undefined, or empty array', () => {
      expect(resolveCitations()).toEqual([]);
      expect(resolveCitations(undefined)).toEqual([]);
      expect(resolveCitations(null)).toEqual([]);
      expect(resolveCitations([])).toEqual([]);
    });

    it('resolves valid citation IDs into full records', () => {
      const result = resolveCitations(['cit-wake-up-2018', 'cit-extend-2019']);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('cit-wake-up-2018');
      expect(result[1].id).toBe('cit-extend-2019');
    });

    it('filters out non-existent citation IDs', () => {
      const result = resolveCitations(['cit-wake-up-2018', 'fake-cit-id']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('cit-wake-up-2018');
    });
  });

  describe('relatedEvidenceFor', () => {
    it('returns empty array for falsy active trial or active trial without relatedCompletedTrialIds', () => {
      expect(relatedEvidenceFor()).toEqual([]);
      expect(relatedEvidenceFor(null)).toEqual([]);
      expect(relatedEvidenceFor(undefined)).toEqual([]);
      expect(relatedEvidenceFor({})).toEqual([]);
    });

    it('resolves related completed trials for active trial record', () => {
      const tested = getActiveTrial('tested');
      expect(tested).toBeTruthy();
      const ctx = relatedEvidenceFor(tested);
      const ids = ctx.map((c) => c.id);
      expect(ids).toContain('select2');
      expect(ids).toContain('angel-aspect');
      expect(ids).toContain('tension');
    });

    it('filters out dangling references in relatedCompletedTrialIds', () => {
      const mockActive = { relatedCompletedTrialIds: ['wake-up', 'dangling-id'] };
      const ctx = relatedEvidenceFor(mockActive);
      expect(ctx.length).toBe(1);
      expect(ctx[0].id).toBe('wake-up');
    });
  });

  describe('resolveClaimsWithCitations', () => {
    it('returns empty array when given no arguments, null, undefined, or empty array', () => {
      expect(resolveClaimsWithCitations()).toEqual([]);
      expect(resolveClaimsWithCitations(undefined)).toEqual([]);
      expect(resolveClaimsWithCitations(null)).toEqual([]);
      expect(resolveClaimsWithCitations([])).toEqual([]);
    });

    it('expands claim IDs into records with attached citationRecords', () => {
      const expanded = resolveClaimsWithCitations(['cl-tnk-noninferior-alteplase']);
      expect(expanded.length).toBe(1);
      expect(expanded[0].id).toBe('cl-tnk-noninferior-alteplase');
      expect(expanded[0].citationRecords.length).toBeGreaterThan(0);
      expect(expanded[0].citationRecords.map((c) => c.id)).toContain('cit-act-2022');
    });

    it('filters out unknown claim IDs and handles claim without citation IDs', () => {
      const expanded = resolveClaimsWithCitations(['cl-tnk-noninferior-alteplase', 'unknown-claim-id']);
      expect(expanded.length).toBe(1);
      expect(expanded[0].id).toBe('cl-tnk-noninferior-alteplase');
    });
  });
});

describe('Schema validators', () => {
  it('rejects missing primary endpoint result on completed trial', () => {
    const bad = schema.makeCompletedTrial({ id: 'fake', shortName: 'X', fullName: 'X' });
    const { errors } = schema.validateCompletedTrial(bad);
    expect(errors.some((e) => /primaryEndpoint\.result/.test(e))).toBe(true);
  });

  it('rejects active trial without matcher criteria', () => {
    const bad = schema.makeActiveTrial({ id: 'fake', shortName: 'X', fullName: 'X', topic: 't', status: 'recruiting', lastReviewed: '2026-04-25', verificationStatus: 'verified-clinicaltrials-gov' });
    const { errors } = schema.validateActiveTrial(bad);
    expect(errors.some((e) => /matcherCriteria/.test(e))).toBe(true);
  });

  it('warns on Class I recommendation without supporting claims', () => {
    const r = schema.makeRecommendation({
      id: 'fake-rec', text: 'something', classOfRecommendation: 'I', levelOfEvidence: 'A',
      lastReviewed: '2026-04-25', verificationStatus: 'verified-guideline'
    });
    const { warnings } = schema.validateRecommendation(r);
    expect(warnings.some((w) => /Class I/.test(w))).toBe(true);
  });

  it('rejects malformed PMID', () => {
    const c = schema.makeCitation({ id: 'fake-cit', title: 't', pmid: '123', verificationStatus: 'verified-pubmed' });
    const { errors } = schema.validateCitation(c);
    expect(errors.some((e) => /pmid/i.test(e))).toBe(true);
  });

  it('rejects guideline missing required fields', () => {
    const bad = schema.makeGuideline({ id: 'Invalid ID' });
    const { errors } = schema.validateGuideline(bad);
    expect(errors.some((e) => /id must be kebab-case/i.test(e))).toBe(true);
    expect(errors.some((e) => /name required/i.test(e))).toBe(true);
    expect(errors.some((e) => /organization required/i.test(e))).toBe(true);
  });

  it('rejects guideline with unknown citation', () => {
    const g = schema.makeGuideline({ id: 'valid-id', name: 'Name', organization: 'Org', citationId: 'cit-1' });
    const { errors } = schema.validateGuideline(g, { knownCitationIds: new Set(['cit-2']) });
    expect(errors.some((e) => /citationId references unknown citation/i.test(e))).toBe(true);
  });

  it('accepts valid guideline', () => {
    const g = schema.makeGuideline({ id: 'valid-id', name: 'Name', organization: 'Org', citationId: 'cit-2' });
    const { errors, warnings } = schema.validateGuideline(g, { knownCitationIds: new Set(['cit-2']) });
    expect(errors.length).toBe(0);
    expect(warnings.length).toBe(0);
  });
});
