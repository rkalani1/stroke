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
  VERIFICATION_STATUS_LABELS,
  CERTAINTY_LABELS,
  EVIDENCE_TYPE_LABELS,
  ACTIVE_STATUS_LABELS,
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
});

describe('Evidence Atlas — resolver functions', () => {
  describe('resolveCompletedTrials', () => {
    it('handles default and empty parameters gracefully', () => {
      expect(resolveCompletedTrials()).toEqual([]);
      expect(resolveCompletedTrials(null)).toEqual([]);
      expect(resolveCompletedTrials([])).toEqual([]);
    });

    it('resolves valid completed trial IDs into full records in specified order', () => {
      const result = resolveCompletedTrials(['wake-up', 'extend', 'dawn']);
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('wake-up');
      expect(result[1].id).toBe('extend');
      expect(result[2].id).toBe('dawn');
      expect(result[0]).toHaveProperty('shortName');
      expect(result[0]).toHaveProperty('fullName');
    });

    it('drops unresolvable and dangling references', () => {
      const got = resolveCompletedTrials(['wake-up', 'does-not-exist', 'dawn', 'invalid-id']);
      expect(got.length).toBe(2);
      expect(got.map((t) => t.id)).toEqual(['wake-up', 'dawn']);
    });

    it('preserves order and duplicates when resolving', () => {
      const got = resolveCompletedTrials(['wake-up', 'wake-up']);
      expect(got.length).toBe(2);
      expect(got[0].id).toBe('wake-up');
      expect(got[1].id).toBe('wake-up');
    });

    it('handles non-string or falsy array elements gracefully', () => {
      const got = resolveCompletedTrials([null, undefined, 'wake-up', 123]);
      expect(got.length).toBe(1);
      expect(got[0].id).toBe('wake-up');
    });
  });

  describe('resolveActiveTrials', () => {
    it('handles default and empty parameters gracefully', () => {
      expect(resolveActiveTrials()).toEqual([]);
      expect(resolveActiveTrials(null)).toEqual([]);
      expect(resolveActiveTrials([])).toEqual([]);
    });

    it('resolves valid active trial IDs into full records in specified order', () => {
      const result = resolveActiveTrials(['step-evt', 'aspire']);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('step-evt');
      expect(result[1].id).toBe('aspire');
      expect(result[0]).toHaveProperty('shortName');
    });

    it('drops dangling/unresolvable active trial references', () => {
      const result = resolveActiveTrials(['step-evt', 'non-existent-active']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('step-evt');
    });
  });

  describe('resolveCitations', () => {
    it('handles default and empty parameters gracefully', () => {
      expect(resolveCitations()).toEqual([]);
      expect(resolveCitations(null)).toEqual([]);
      expect(resolveCitations([])).toEqual([]);
    });

    it('resolves valid citation IDs into full records in specified order', () => {
      const result = resolveCitations(['cit-act-2022', 'cit-wake-up-2018']);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('cit-act-2022');
      expect(result[1].id).toBe('cit-wake-up-2018');
      expect(result[0]).toHaveProperty('title');
    });

    it('drops dangling/unresolvable citation references', () => {
      const result = resolveCitations(['cit-act-2022', 'non-existent-citation']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('cit-act-2022');
    });
  });

  describe('resolveClaimsWithCitations', () => {
    it('handles default and empty parameters gracefully', () => {
      expect(resolveClaimsWithCitations()).toEqual([]);
      expect(resolveClaimsWithCitations(null)).toEqual([]);
      expect(resolveClaimsWithCitations([])).toEqual([]);
    });

    it('expands claim → citation chain and maps records', () => {
      const expanded = resolveClaimsWithCitations(['cl-tnk-noninferior-alteplase']);
      expect(expanded.length).toBe(1);
      expect(expanded[0].id).toBe('cl-tnk-noninferior-alteplase');
      expect(Array.isArray(expanded[0].citationRecords)).toBe(true);
      expect(expanded[0].citationRecords.length).toBeGreaterThan(0);
      expect(expanded[0].citationRecords.map((c) => c.id)).toContain('cit-act-2022');
    });

    it('drops unresolvable claims and handles missing citationIds', () => {
      const result = resolveClaimsWithCitations(['cl-tnk-noninferior-alteplase', 'non-existent-claim']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('cl-tnk-noninferior-alteplase');
    });
  });

  describe('relatedEvidenceFor', () => {
    it('returns empty array for null, undefined, or missing active trial', () => {
      expect(relatedEvidenceFor()).toEqual([]);
      expect(relatedEvidenceFor(null)).toEqual([]);
      expect(relatedEvidenceFor({})).toEqual([]);
      expect(relatedEvidenceFor({ relatedCompletedTrialIds: [] })).toEqual([]);
    });

    it('surfaces related completed trials for an active trial', () => {
      const tested = getActiveTrial('tested');
      expect(tested).toBeTruthy();
      const ctx = relatedEvidenceFor(tested);
      const ids = ctx.map((c) => c.id);
      expect(ids).toContain('select2');
      expect(ids).toContain('angel-aspect');
      expect(ids).toContain('tension');
    });

    it('filters out unresolvable completed trial references from active trial', () => {
      const mockActive = {
        id: 'mock-trial',
        relatedCompletedTrialIds: ['wake-up', 'dangling-trial-id']
      };
      const res = relatedEvidenceFor(mockActive);
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('wake-up');
    });
  });
});

describe('Evidence Atlas — status & label constants', () => {
  it('VERIFICATION_STATUS_LABELS maps valid tones and labels', () => {
    expect(VERIFICATION_STATUS_LABELS).toHaveProperty('verified-pubmed');
    for (const [key, val] of Object.entries(VERIFICATION_STATUS_LABELS)) {
      expect(typeof key).toBe('string');
      expect(typeof val.label).toBe('string');
      expect(typeof val.tone).toBe('string');
    }
  });

  it('CERTAINTY_LABELS maps expected levels to labels and tones', () => {
    expect(CERTAINTY_LABELS.high).toEqual({ label: 'High certainty', tone: 'emerald' });
    for (const val of Object.values(CERTAINTY_LABELS)) {
      expect(typeof val.label).toBe('string');
      expect(typeof val.tone).toBe('string');
    }
  });

  it('EVIDENCE_TYPE_LABELS contains standard study designs', () => {
    expect(EVIDENCE_TYPE_LABELS.rct).toEqual({ label: 'RCT', tone: 'sky' });
    for (const val of Object.values(EVIDENCE_TYPE_LABELS)) {
      expect(typeof val.label).toBe('string');
      expect(typeof val.tone).toBe('string');
    }
  });

  it('ACTIVE_STATUS_LABELS covers active trial status states', () => {
    expect(ACTIVE_STATUS_LABELS.recruiting).toEqual({ label: 'Recruiting', tone: 'emerald' });
    for (const val of Object.values(ACTIVE_STATUS_LABELS)) {
      expect(typeof val.label).toBe('string');
      expect(typeof val.tone).toBe('string');
    }
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
