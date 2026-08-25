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
  getAllActiveTrialIds,
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

  describe('getActiveTrialByLegacyKey', () => {
    it('retrieves active trials by legacyMatcherKey and matches getActiveTrial by ID', () => {
      for (const trial of activeTrials) {
        if (trial.legacyMatcherKey) {
          const fetchedByLegacyKey = getActiveTrialByLegacyKey(trial.legacyMatcherKey);
          const fetchedById = getActiveTrial(trial.id);
          expect(fetchedByLegacyKey).toBe(fetchedById);
          expect(fetchedByLegacyKey.id).toBe(trial.id);
          expect(fetchedByLegacyKey.legacyMatcherKey).toBe(trial.legacyMatcherKey);
        }
      }
    });

    it('distinguishes between legacyMatcherKey and primary ID', () => {
      // 'STEP' is the legacyMatcherKey while 'step-evt' is the primary ID
      const byLegacyKey = getActiveTrialByLegacyKey('STEP');
      const byPrimaryIdAsLegacyKey = getActiveTrialByLegacyKey('step-evt');
      const byPrimaryId = getActiveTrial('step-evt');

      expect(byLegacyKey).toBe(byPrimaryId);
      expect(byPrimaryIdAsLegacyKey).toBeNull();
    });

    it('returns null for unknown, non-existent, or invalid keys', () => {
      expect(getActiveTrialByLegacyKey('NON_EXISTENT_KEY')).toBeNull();
      expect(getActiveTrialByLegacyKey('')).toBeNull();
      expect(getActiveTrialByLegacyKey(null)).toBeNull();
      expect(getActiveTrialByLegacyKey(undefined)).toBeNull();
      expect(getActiveTrialByLegacyKey('step')).toBeNull(); // case-sensitive match
    });
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
  it('getActiveTrial returns active trial by id or null if not found', () => {
    const trial = getActiveTrial('step-evt');
    expect(trial).toBeTruthy();
    expect(trial.id).toBe('step-evt');
    expect(trial.shortName).toBe('STEP-EVT');

    expect(getActiveTrial('non-existent-trial-id')).toBeNull();
    expect(getActiveTrial(null)).toBeNull();
    expect(getActiveTrial(undefined)).toBeNull();
  });

  it('getActiveTrialByLegacyKey returns active trial by legacy key or null if not found', () => {
    const trial = getActiveTrialByLegacyKey('STEP');
    expect(trial).toBeTruthy();
    expect(trial.id).toBe('step-evt');

    expect(getActiveTrialByLegacyKey('NON_EXISTENT_KEY')).toBeNull();
    expect(getActiveTrialByLegacyKey(null)).toBeNull();
    expect(getActiveTrialByLegacyKey(undefined)).toBeNull();
  });

  it('getAllActiveTrialIds returns a Set of all active trial IDs', () => {
    const idsSet = getAllActiveTrialIds();
    expect(idsSet).toBeInstanceOf(Set);
    expect(idsSet.size).toBe(activeTrials.length);
    for (const trial of activeTrials) {
      expect(idsSet.has(trial.id)).toBe(true);
    }
  });

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

describe('Schema factories — makeCompletedTrial', () => {
  it('returns default object shape when called with no input or empty object', () => {
    const trial = schema.makeCompletedTrial();
    expect(trial).toEqual({
      id: '',
      shortName: '',
      fullName: '',
      topic: '',
      diseaseArea: [],
      population: {
        n: 0,
        ageRange: '',
        nihssRange: '',
        timeWindow: '',
        keyInclusion: [],
        keyExclusion: []
      },
      intervention: '',
      comparator: '',
      primaryEndpoint: {
        definition: '',
        timepoint: '',
        result: '',
        effectSize: '',
        confidenceInterval: '',
        pValue: ''
      },
      secondaryEndpoints: [],
      safetyFindings: {
        sich: '',
        mortality: '',
        other: ''
      },
      imagingCriteria: '',
      applicabilityNotes: '',
      limitations: '',
      certainty: 'moderate',
      evidenceType: 'rct',
      citationIds: [],
      relatedActiveTrialIds: [],
      practiceImpact: '',
      lastReviewed: '',
      promotedDate: '',
      verificationStatus: 'todo-verify',
      verificationNotes: ''
    });
  });

  it('populates fields correctly from input object and maps secondary endpoints', () => {
    const input = {
      id: 'wake-up',
      shortName: 'WAKE-UP',
      fullName: 'WAKE-UP Trial',
      topic: 'extended-window-ivt',
      diseaseArea: ['stroke', 'ivt'],
      population: {
        n: 503,
        ageRange: '18-80',
        nihssRange: '0-25',
        timeWindow: 'unknown onset',
        keyInclusion: ['MRI mismatch'],
        keyExclusion: ['hemorrhage']
      },
      intervention: 'Alteplase 0.9 mg/kg',
      comparator: 'Placebo',
      primaryEndpoint: {
        definition: 'mRS 0-1 at 90 days',
        timepoint: '90 days',
        result: '53.3% vs 41.8%',
        effectSize: 'OR 1.61',
        confidenceInterval: '1.01-2.56',
        pValue: '0.04'
      },
      secondaryEndpoints: [
        { name: 'mRS 0-2', result: '65% vs 52%' },
        { name: undefined, result: null }
      ],
      safetyFindings: {
        sich: '2.0% vs 0.4%',
        mortality: '4.1% vs 1.2%',
        other: 'No other major findings'
      },
      imagingCriteria: 'DWI-FLAIR mismatch',
      applicabilityNotes: 'Applicable in MRI centers',
      limitations: 'Small sample size',
      certainty: 'high',
      evidenceType: 'rct',
      citationIds: ['cit-wakeup-2018'],
      relatedActiveTrialIds: ['at-1'],
      practiceImpact: 'Changed clinical practice',
      lastReviewed: '2024-01-01',
      promotedDate: '2024-01-15',
      verificationStatus: 'verified-pubmed',
      verificationNotes: 'Verified via PubMed'
    };

    const trial = schema.makeCompletedTrial(input);
    expect(trial.id).toBe('wake-up');
    expect(trial.shortName).toBe('WAKE-UP');
    expect(trial.fullName).toBe('WAKE-UP Trial');
    expect(trial.population.n).toBe(503);
    expect(trial.population.keyInclusion).toEqual(['MRI mismatch']);
    expect(trial.primaryEndpoint.result).toBe('53.3% vs 41.8%');
    expect(trial.secondaryEndpoints).toEqual([
      { name: 'mRS 0-2', result: '65% vs 52%' },
      { name: '', result: '' }
    ]);
    expect(trial.certainty).toBe('high');
    expect(trial.verificationStatus).toBe('verified-pubmed');
    expect(trial.promotedDate).toBe('2024-01-15');
  });

  it('handles invalid or unrecognised enum values and defaults appropriately', () => {
    const trial = schema.makeCompletedTrial({
      certainty: 'invalid-certainty',
      evidenceType: 'invalid-type',
      verificationStatus: 'invalid-status',
      population: { n: 'not-a-number' },
      lastReviewed: '2025-05-01'
    });

    expect(trial.certainty).toBe('moderate');
    expect(trial.evidenceType).toBe('rct');
    expect(trial.verificationStatus).toBe('todo-verify');
    expect(trial.population.n).toBe(0);
    // promotedDate defaults to lastReviewed when omitted or non-string
    expect(trial.promotedDate).toBe('2025-05-01');
  });
});

describe('Schema validators', () => {
  it('rejects missing primary endpoint result on completed trial', () => {
    const bad = schema.makeCompletedTrial({ id: 'fake', shortName: 'X', fullName: 'X' });
    const { errors } = schema.validateCompletedTrial(bad);
    expect(errors.some((e) => /primaryEndpoint\.result/.test(e))).toBe(true);
  });

  it('accepts a valid active trial', () => {
    const trial = schema.makeActiveTrial({
      id: 'valid-trial',
      shortName: 'Valid',
      fullName: 'Valid Active Trial',
      topic: 'acute-ischemic-stroke',
      status: 'recruiting',
      nctId: 'NCT12345678',
      matcherCriteria: [{ field: 'nihss', operator: '>=', value: 6 }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov',
      relatedCompletedTrialIds: ['wake-up']
    });
    const { errors, warnings } = schema.validateActiveTrial(trial, {
      knownCompletedTrialIds: new Set(['wake-up'])
    });
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('rejects active trial with invalid ID or missing required text fields', () => {
    const trial = {
      id: 'Invalid_ID!',
      shortName: '',
      fullName: '',
      topic: '',
      status: 'recruiting',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov'
    };
    const { errors } = schema.validateActiveTrial(trial);
    expect(errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    expect(errors.some((e) => /shortName required/.test(e))).toBe(true);
    expect(errors.some((e) => /fullName required/.test(e))).toBe(true);
    expect(errors.some((e) => /topic required/.test(e))).toBe(true);
  });

  it('rejects active trial with invalid status or verificationStatus', () => {
    const trial = {
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'invalid-status',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'invalid-verification'
    };
    const { errors } = schema.validateActiveTrial(trial);
    expect(errors.some((e) => /status invalid/.test(e))).toBe(true);
    expect(errors.some((e) => /verificationStatus invalid/.test(e))).toBe(true);
  });

  it('rejects active trial with malformed nctId', () => {
    const trial = schema.makeActiveTrial({
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'recruiting',
      nctId: '12345678',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov'
    });
    const { errors } = schema.validateActiveTrial(trial);
    expect(errors.some((e) => /fails NCT pattern/.test(e))).toBe(true);
  });

  it('rejects active trial without matcher criteria', () => {
    const bad = schema.makeActiveTrial({ id: 'fake', shortName: 'X', fullName: 'X', topic: 't', status: 'recruiting', lastReviewed: '2026-04-25', verificationStatus: 'verified-clinicaltrials-gov' });
    const { errors } = schema.validateActiveTrial(bad);
    expect(errors.some((e) => /matcherCriteria/.test(e))).toBe(true);
  });

  it('requires verificationNotes when verificationStatus is todo-verify', () => {
    const trial = schema.makeActiveTrial({
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'recruiting',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'todo-verify',
      verificationNotes: ''
    });
    const { errors } = schema.validateActiveTrial(trial);
    expect(errors.some((e) => /requires verificationNotes/.test(e))).toBe(true);
  });

  it('validates lastReviewed date format and reports stale-evidence warnings', () => {
    const invalidDateTrial = schema.makeActiveTrial({
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'recruiting',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026/04/25',
      verificationStatus: 'verified-clinicaltrials-gov'
    });
    const { errors: err1 } = schema.validateActiveTrial(invalidDateTrial);
    expect(err1.some((e) => /lastReviewed must be ISO date/.test(e))).toBe(true);

    const staleTrial = schema.makeActiveTrial({
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'recruiting',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2020-01-01',
      verificationStatus: 'verified-clinicaltrials-gov'
    });
    const { warnings } = schema.validateActiveTrial(staleTrial);
    expect(warnings.some((w) => /stale-evidence/.test(w))).toBe(true);
  });

  it('rejects active trial referencing unknown related completed trial', () => {
    const trial = schema.makeActiveTrial({
      id: 'active-test',
      shortName: 'Test',
      fullName: 'Test Trial',
      topic: 'stroke',
      status: 'recruiting',
      matcherCriteria: [{ field: 'nihss' }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov',
      relatedCompletedTrialIds: ['unknown-completed-trial']
    });
    const { errors } = schema.validateActiveTrial(trial, {
      knownCompletedTrialIds: new Set(['wake-up'])
    });
    expect(errors.some((e) => /relatedCompletedTrialIds references unknown completed trial/.test(e))).toBe(true);
  });

  it('warns on Class I recommendation without supporting claims', () => {
    const r = schema.makeRecommendation({
      id: 'fake-rec', text: 'something', classOfRecommendation: 'I', levelOfEvidence: 'A',
      lastReviewed: '2026-04-25', verificationStatus: 'verified-guideline'
    });
    const { warnings } = schema.validateRecommendation(r);
    expect(warnings.some((w) => /Class I/.test(w))).toBe(true);
  });

  describe('validateCitation', () => {
    it('accepts a fully valid citation', () => {
      const valid = schema.makeCitation({
        id: 'cit-valid-2026',
        title: 'Thrombolysis with Alteplase at 3 to 4.5 Hours',
        verificationStatus: 'verified-pubmed',
        pmid: '19776407',
        doi: '10.1056/NEJMoa0804656'
      });
      const { errors, warnings } = schema.validateCitation(valid);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('rejects missing or non-kebab-case id', () => {
      const badId = schema.makeCitation({
        id: 'Invalid_ID_Format!',
        title: 'Test Title',
        verificationStatus: 'verified-pubmed'
      });
      const { errors } = schema.validateCitation(badId);
      expect(errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);

      const missingId = schema.makeCitation({
        id: '',
        title: 'Test Title',
        verificationStatus: 'verified-pubmed'
      });
      const { errors: missingErrors } = schema.validateCitation(missingId);
      expect(missingErrors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    });

    it('rejects missing title', () => {
      const missingTitle = schema.makeCitation({
        id: 'cit-test',
        title: '',
        verificationStatus: 'verified-pubmed'
      });
      const { errors } = schema.validateCitation(missingTitle);
      expect(errors.some((e) => /title required/.test(e))).toBe(true);
    });

    it('rejects invalid verificationStatus', () => {
      const invalidStatus = {
        id: 'cit-test',
        title: 'Test Title',
        verificationStatus: 'not-a-real-status'
      };
      const { errors } = schema.validateCitation(invalidStatus);
      expect(errors.some((e) => /verificationStatus invalid/.test(e))).toBe(true);
    });

    it('requires verificationNotes when verificationStatus is todo-verify', () => {
      const todoWithoutNotes = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        verificationStatus: 'todo-verify',
        verificationNotes: ''
      });
      const { errors: err1 } = schema.validateCitation(todoWithoutNotes);
      expect(err1.some((e) => /requires verificationNotes/.test(e))).toBe(true);

      const todoWithNotes = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        verificationStatus: 'todo-verify',
        verificationNotes: 'Pending review against PubMed'
      });
      const { errors: err2 } = schema.validateCitation(todoWithNotes);
      expect(err2.some((e) => /requires verificationNotes/.test(e))).toBe(false);
      expect(err2.length).toBe(0);
    });

    it('validates PMID format when present', () => {
      const malformedPmid = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        pmid: '123',
        verificationStatus: 'verified-pubmed'
      });
      const { errors: err1 } = schema.validateCitation(malformedPmid);
      expect(err1.some((e) => /pmid '123' fails 7-9 digit pattern/.test(e))).toBe(true);

      const validPmid = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        pmid: '12345678',
        verificationStatus: 'verified-pubmed'
      });
      const { errors: err2 } = schema.validateCitation(validPmid);
      expect(err2.length).toBe(0);
    });

    it('validates DOI format when present', () => {
      const malformedDoi = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        doi: 'invalid-doi-string',
        verificationStatus: 'verified-doi'
      });
      const { errors: err1 } = schema.validateCitation(malformedDoi);
      expect(err1.some((e) => /doi 'invalid-doi-string' fails DOI pattern/.test(e))).toBe(true);

      const validDoi = schema.makeCitation({
        id: 'cit-test',
        title: 'Test Title',
        doi: '10.1016/j.stroke.2020.01.001',
        verificationStatus: 'verified-doi'
      });
      const { errors: err2 } = schema.validateCitation(validDoi);
      expect(err2.length).toBe(0);
    });
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

  describe('makeCitation factory', () => {
    it('returns default schema structure when called with no arguments or empty object', () => {
      const defaultCit = schema.makeCitation();
      expect(defaultCit).toEqual({
        id: '',
        type: 'journal-article',
        authors: '',
        title: '',
        journal: '',
        year: 0,
        volume: '',
        pages: '',
        pmid: '',
        doi: '',
        url: '',
        verificationStatus: schema.TODO_VERIFY_STATUS,
        verificationNotes: ''
      });
    });

    it('constructs complete citation when given valid input properties', () => {
      const input = {
        id: 'cit-test-2024',
        type: 'guideline-document',
        authors: 'Smith J et al.',
        title: 'Stroke Management Guidelines',
        journal: 'Stroke Journal',
        year: 2024,
        volume: '55',
        pages: '100-110',
        pmid: '12345678',
        doi: '10.1161/STROKEAHA.123.000000',
        url: 'https://example.com/cit-test',
        verificationStatus: 'verified-pubmed',
        verificationNotes: 'Verified via PubMed API'
      };

      const cit = schema.makeCitation(input);
      expect(cit).toEqual(input);
    });

    it('handles invalid or non-finite year inputs by falling back to 0', () => {
      expect(schema.makeCitation({ year: '2024' }).year).toBe(0);
      expect(schema.makeCitation({ year: NaN }).year).toBe(0);
      expect(schema.makeCitation({ year: Infinity }).year).toBe(0);
      expect(schema.makeCitation({ year: null }).year).toBe(0);
      expect(schema.makeCitation({ year: undefined }).year).toBe(0);
      expect(schema.makeCitation({ year: 2025 }).year).toBe(2025);
    });

    it('falls back to TODO_VERIFY_STATUS when verificationStatus is invalid or omitted', () => {
      expect(schema.makeCitation({ verificationStatus: 'invalid-status' }).verificationStatus).toBe(schema.TODO_VERIFY_STATUS);
      expect(schema.makeCitation({ verificationStatus: null }).verificationStatus).toBe(schema.TODO_VERIFY_STATUS);
    });

    it('coerces non-string string fields to fallback empty strings or defaults', () => {
      const cit = schema.makeCitation({
        id: 123,
        type: 456,
        authors: null,
        title: undefined,
        journal: [],
        volume: {},
        pages: true,
        pmid: 999,
        doi: false,
        url: null,
        verificationNotes: 123
      });

      expect(cit.id).toBe('');
      expect(cit.type).toBe('journal-article');
      expect(cit.authors).toBe('');
      expect(cit.title).toBe('');
      expect(cit.journal).toBe('');
      expect(cit.volume).toBe('');
      expect(cit.pages).toBe('');
      expect(cit.pmid).toBe('');
      expect(cit.doi).toBe('');
      expect(cit.url).toBe('');
      expect(cit.verificationNotes).toBe('');
    });
  });
});

describe('Topic factory — makeTopic', () => {
  it('returns default empty string properties when called with no arguments or empty object', () => {
    const topicDefault = schema.makeTopic();
    expect(topicDefault).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });

    const topicEmpty = schema.makeTopic({});
    expect(topicEmpty).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });
  });

  it('constructs a topic record with provided valid string inputs', () => {
    const input = {
      id: 'extended-window-ivt',
      label: 'Extended-window IV Thrombolysis',
      parentId: 'acute-ischemic-stroke',
      notes: 'Covers IVT up to 9h or wake-up stroke with imaging mismatch.'
    };
    const topic = schema.makeTopic(input);
    expect(topic).toEqual(input);
  });

  it('falls back to empty strings when non-string inputs are provided', () => {
    const topic = schema.makeTopic({
      id: 123,
      label: null,
      parentId: undefined,
      notes: ['note1', 'note2']
    });
    expect(topic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });
  });
});

describe('schema — makeRecommendation', () => {
  it('constructs a recommendation with schema defaults when input is empty or omitted', () => {
    const rec1 = schema.makeRecommendation();
    const rec2 = schema.makeRecommendation({});

    expect(rec1).toEqual({
      id: '',
      topic: '',
      setting: 'all',
      text: '',
      classOfRecommendation: 'IIa',
      levelOfEvidence: 'B-R',
      guidelineSource: '',
      supportingClaimIds: [],
      caveats: [],
      lastReviewed: '',
      verificationStatus: 'todo-verify',
      verificationNotes: ''
    });

    expect(rec2).toEqual(rec1);
  });

  it('populates provided valid fields correctly', () => {
    const input = {
      id: 'rec-test-1',
      topic: 'ischemic-stroke',
      setting: 'inpatient',
      text: 'Administer IV thrombolysis within 4.5 hours.',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA/ASA 2019',
      supportingClaimIds: ['cl-1', 'cl-2'],
      caveats: ['Check contraindications'],
      lastReviewed: '2026-01-15',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified against published AHA guidelines.'
    };

    const rec = schema.makeRecommendation(input);

    expect(rec).toEqual({
      id: 'rec-test-1',
      topic: 'ischemic-stroke',
      setting: 'inpatient',
      text: 'Administer IV thrombolysis within 4.5 hours.',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA/ASA 2019',
      supportingClaimIds: ['cl-1', 'cl-2'],
      caveats: ['Check contraindications'],
      lastReviewed: '2026-01-15',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified against published AHA guidelines.'
    });
  });

  it('falls back to default enum values when invalid enum strings are supplied', () => {
    const rec = schema.makeRecommendation({
      setting: 'invalid-setting',
      classOfRecommendation: 'invalid-class',
      levelOfEvidence: 'invalid-loe',
      verificationStatus: 'invalid-status'
    });

    expect(rec.setting).toBe('all');
    expect(rec.classOfRecommendation).toBe('IIa');
    expect(rec.levelOfEvidence).toBe('B-R');
    expect(rec.verificationStatus).toBe('todo-verify');
  });

  it('falls back to default empty strings for non-string input values', () => {
    const rec = schema.makeRecommendation({
      id: 12345,
      topic: null,
      text: undefined,
      guidelineSource: {},
      lastReviewed: false,
      verificationNotes: ['not a string']
    });

    expect(rec.id).toBe('');
    expect(rec.topic).toBe('');
    expect(rec.text).toBe('');
    expect(rec.guidelineSource).toBe('');
    expect(rec.lastReviewed).toBe('');
    expect(rec.verificationNotes).toBe('');
  });

  it('safely handles non-array inputs for array properties and defensively clones array properties', () => {
    const inputClaims = ['cl-1'];
    const inputCaveats = ['caveat-1'];

    const rec = schema.makeRecommendation({
      supportingClaimIds: inputClaims,
      caveats: inputCaveats
    });

    expect(rec.supportingClaimIds).toEqual(['cl-1']);
    expect(rec.caveats).toEqual(['caveat-1']);

    // Assert defensive clone (mutating input arrays does not mutate recommendation object)
    inputClaims.push('cl-2');
    inputCaveats.push('caveat-2');

    expect(rec.supportingClaimIds).toEqual(['cl-1']);
    expect(rec.caveats).toEqual(['caveat-1']);

    // Non-array inputs fall back to empty array []
    const recInvalidArrays = schema.makeRecommendation({
      supportingClaimIds: 'not-an-array',
      caveats: { key: 'value' }
    });

    expect(recInvalidArrays.supportingClaimIds).toEqual([]);
    expect(recInvalidArrays.caveats).toEqual([]);
  });
});

describe('makeActiveTrial factory', () => {
  it('constructs active trial with default fields when minimal input provided', () => {
    const trial = schema.makeActiveTrial({ status: 'recruiting' });
    expect(trial.id).toBe('');
    expect(trial.shortName).toBe('');
    expect(trial.fullName).toBe('');
    expect(trial.nctId).toBe('');
    expect(trial.phase).toBe('');
    expect(trial.status).toBe('recruiting');
    expect(trial.topic).toBe('');
    expect(trial.briefDescription).toBe('');
    expect(trial.rationale).toBe('');
    expect(trial.inclusionCriteria).toEqual([]);
    expect(trial.exclusionCriteria).toEqual([]);
    expect(trial.keyTakeaways).toEqual([]);
    expect(trial.lookingFor).toEqual([]);
    expect(trial.category).toBe('');
    expect(trial.matcherCriteria).toEqual([]);
    expect(trial.matcherExclusions).toEqual([]);
    expect(trial.relatedCompletedTrialIds).toEqual([]);
    expect(trial.link).toBe('');
    expect(trial.lastReviewed).toBe('');
    expect(trial.verificationStatus).toBe(schema.TODO_VERIFY_STATUS);
    expect(trial.verificationNotes).toBe('');
    expect(trial.legacyMatcherKey).toBe('');
  });

  it('throws descriptive error when status is missing or invalid', () => {
    expect(() => schema.makeActiveTrial({})).toThrow(
      "makeActiveTrial: unknown status 'undefined' for trial '<unset>'"
    );
    expect(() => schema.makeActiveTrial({ id: 'test-trial', status: 'invalid-status' })).toThrow(
      "makeActiveTrial: unknown status 'invalid-status' for trial 'test-trial'"
    );
  });

  it('accepts all valid active trial statuses', () => {
    for (const status of schema.ACTIVE_TRIAL_STATUS_VALUES) {
      const trial = schema.makeActiveTrial({ id: 'trial-1', status });
      expect(trial.status).toBe(status);
    }
  });

  it('correctly maps matcherCriteria and matcherExclusions with default fallbacks', () => {
    const input = {
      id: 'active-trial-1',
      status: 'recruiting',
      matcherCriteria: [
        { field: 'age', operator: '>=', value: 18, label: 'Adults' },
        null
      ],
      matcherExclusions: [
        { id: 'ex-1', field: 'ich', label: 'Intracranial Hemorrhage' },
        { id: 'ex-2', field: 'nihss', operator: '>', value: 25, label: 'Severe stroke' },
        { id: 'ex-3', field: 'pregnancy', operator: '==', value: false, label: 'Not pregnant' }
      ]
    };

    const trial = schema.makeActiveTrial(input);

    expect(trial.matcherCriteria).toEqual([
      { field: 'age', operator: '>=', value: 18, label: 'Adults' },
      { field: '', operator: '', value: undefined, label: '' }
    ]);

    expect(trial.matcherExclusions).toEqual([
      { id: 'ex-1', field: 'ich', operator: '==', value: true, label: 'Intracranial Hemorrhage' },
      { id: 'ex-2', field: 'nihss', operator: '>', value: 25, label: 'Severe stroke' },
      { id: 'ex-3', field: 'pregnancy', operator: '==', value: false, label: 'Not pregnant' }
    ]);
  });

  it('handles verificationStatus validation and defaults', () => {
    const valid = schema.makeActiveTrial({ status: 'recruiting', verificationStatus: 'verified-clinicaltrials-gov' });
    expect(valid.verificationStatus).toBe('verified-clinicaltrials-gov');

    const invalid = schema.makeActiveTrial({ status: 'recruiting', verificationStatus: 'not-a-valid-status' });
    expect(invalid.verificationStatus).toBe(schema.TODO_VERIFY_STATUS);
  });
});

describe('makeCitation factory', () => {
  it('returns default citation object when called with no arguments or empty object', () => {
    const defaultCitation = schema.makeCitation();
    expect(defaultCitation).toEqual({
      id: '',
      type: 'journal-article',
      authors: '',
      title: '',
      journal: '',
      year: 0,
      volume: '',
      pages: '',
      pmid: '',
      doi: '',
      url: '',
      verificationStatus: schema.TODO_VERIFY_STATUS,
      verificationNotes: ''
    });
  });

  it('populates fields correctly when provided with custom input', () => {
    const input = {
      id: 'cit-test-2026',
      type: 'book',
      authors: 'Smith J, Doe A',
      title: 'Stroke Management Handbook',
      journal: 'Medical Press',
      year: 2026,
      volume: '12',
      pages: '100-110',
      pmid: '12345678',
      doi: '10.1016/j.stroke.2026.01.001',
      url: 'https://example.com/cit-test-2026',
      verificationStatus: 'verified-pubmed',
      verificationNotes: 'Verified via PubMed API'
    };

    const citation = schema.makeCitation(input);
    expect(citation).toEqual(input);
  });

  it('handles invalid or non-string/non-finite field types gracefully with safe fallbacks', () => {
    const input = {
      id: 123,
      type: null,
      authors: undefined,
      title: {},
      journal: [],
      year: '2026', // non-finite number type
      volume: true,
      pages: false,
      pmid: 999,
      doi: null,
      url: undefined,
      verificationStatus: 'invalid-status',
      verificationNotes: 456
    };

    const citation = schema.makeCitation(input);
    expect(citation).toEqual({
      id: '',
      type: 'journal-article',
      authors: '',
      title: '',
      journal: '',
      year: 0,
      volume: '',
      pages: '',
      pmid: '',
      doi: '',
      url: '',
      verificationStatus: schema.TODO_VERIFY_STATUS,
      verificationNotes: ''
    });
  });

  it('validates citations produced by makeCitation using validateCitation', () => {
    const created = schema.makeCitation({
      id: 'cit-valid-2026',
      title: 'Valid Citation Title',
      pmid: '34567890',
      verificationStatus: 'verified-pubmed'
    });

    const { errors, warnings } = schema.validateCitation(created);
    expect(errors.length).toBe(0);
    expect(warnings.length).toBe(0);
  });
});
