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
  resolveClaimsWithCitations,
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

  it('resolveCompletedTrials drops dangling references', () => {
    const got = resolveCompletedTrials(['wake-up', 'does-not-exist']);
    expect(got.length).toBe(1);
    expect(got[0].id).toBe('wake-up');
  });

  it('TESTED active trial surfaces late-window EVT context', () => {
    const tested = getActiveTrial('tested');
    expect(tested).toBeTruthy();
    const ctx = resolveCompletedTrials(tested.relatedCompletedTrialIds);
    const ids = ctx.map((c) => c.id);
    expect(ids).toContain('select2');
    expect(ids).toContain('angel-aspect');
    expect(ids).toContain('tension');
  });

  it('resolveClaimsWithCitations expands claim → citation chain', () => {
    const expanded = resolveClaimsWithCitations(['cl-tnk-noninferior-alteplase']);
    expect(expanded.length).toBe(1);
    expect(expanded[0].citationRecords.length).toBeGreaterThan(0);
    expect(expanded[0].citationRecords.map((c) => c.id)).toContain('cit-act-2022');
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

  describe('makeActiveTrial factory', () => {
    it('throws an error when status is missing or invalid', () => {
      expect(() => schema.makeActiveTrial({})).toThrowError(/makeActiveTrial: unknown status 'undefined' for trial '<unset>'/);
      expect(() => schema.makeActiveTrial({ id: 'test-trial', status: 'invalid-status' })).toThrowError(
        /makeActiveTrial: unknown status 'invalid-status' for trial 'test-trial'/
      );
    });

    it('returns default active trial schema when provided valid status and minimal input', () => {
      const trial = schema.makeActiveTrial({ status: 'recruiting' });
      expect(trial).toEqual({
        id: '',
        shortName: '',
        fullName: '',
        nctId: '',
        phase: '',
        status: 'recruiting',
        topic: '',
        briefDescription: '',
        rationale: '',
        inclusionCriteria: [],
        exclusionCriteria: [],
        keyTakeaways: [],
        lookingFor: [],
        category: '',
        matcherCriteria: [],
        matcherExclusions: [],
        relatedCompletedTrialIds: [],
        link: '',
        lastReviewed: '',
        verificationStatus: 'todo-verify',
        verificationNotes: '',
        legacyMatcherKey: ''
      });
    });

    it('correctly maps all input properties and nested arrays/objects', () => {
      const input = {
        id: 'test-id',
        shortName: 'Test Short',
        fullName: 'Test Full Name',
        nctId: 'NCT12345678',
        phase: 'Phase III',
        status: 'active-not-recruiting',
        topic: 'thrombolysis',
        briefDescription: 'Brief description',
        rationale: 'Rationale statement',
        inclusionCriteria: ['Inc 1', 'Inc 2'],
        exclusionCriteria: ['Exc 1'],
        keyTakeaways: ['Takeaway 1'],
        lookingFor: ['Condition 1'],
        category: 'Acute Therapy',
        matcherCriteria: [
          { field: 'age', operator: '>=', value: 18, label: 'Age 18+' }
        ],
        matcherExclusions: [
          { id: 'ex-1', field: 'ich', label: 'Intracranial Hemorrhage' },
          { id: 'ex-2', field: 'sbp', operator: '>', value: 185, label: 'SBP > 185' }
        ],
        relatedCompletedTrialIds: ['completed-1'],
        link: 'https://clinicaltrials.gov',
        lastReviewed: '2026-05-01',
        verificationStatus: 'verified-clinicaltrials-gov',
        verificationNotes: 'Verified against ClinicalTrials.gov API',
        legacyMatcherKey: 'TEST_LEGACY'
      };

      const trial = schema.makeActiveTrial(input);

      expect(trial).toEqual({
        ...input,
        matcherCriteria: [
          { field: 'age', operator: '>=', value: 18, label: 'Age 18+' }
        ],
        matcherExclusions: [
          { id: 'ex-1', field: 'ich', operator: '==', value: true, label: 'Intracranial Hemorrhage' },
          { id: 'ex-2', field: 'sbp', operator: '>', value: 185, label: 'SBP > 185' }
        ]
      });
    });
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
