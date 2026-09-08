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
  getClaim,
  getAllClaimIds,
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

  it('getActiveTrialByLegacyKey retrieves active trial by legacy key and differs from regular ID lookup', () => {
    const trialByLegacyKey = getActiveTrialByLegacyKey('STEP');
    const trialById = getActiveTrial('step-evt');

    expect(trialByLegacyKey).not.toBeNull();
    expect(trialByLegacyKey).toBe(trialById);
    expect(trialByLegacyKey.legacyMatcherKey).toBe('STEP');
    expect(trialByLegacyKey.id).toBe('step-evt');

    // Searching regular ID with getActiveTrialByLegacyKey returns null
    expect(getActiveTrialByLegacyKey('step-evt')).toBeNull();

    // Searching legacy key with getActiveTrial returns null
    expect(getActiveTrial('STEP')).toBeNull();

    // Non-matching inputs, empty string, wrong case, null, undefined return null
    expect(getActiveTrialByLegacyKey('NON_EXISTENT_KEY')).toBeNull();
    expect(getActiveTrialByLegacyKey('step')).toBeNull();
    expect(getActiveTrialByLegacyKey('')).toBeNull();
    expect(getActiveTrialByLegacyKey(null)).toBeNull();
    expect(getActiveTrialByLegacyKey(undefined)).toBeNull();
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

  it('getClaim retrieves claim by valid ID and returns null for unknown or invalid IDs', () => {
    const validClaim = getClaim('cl-tnk-noninferior-alteplase');
    expect(validClaim).toBeTruthy();
    expect(validClaim.id).toBe('cl-tnk-noninferior-alteplase');
    expect(validClaim.topic).toBe('tnk-vs-alteplase');

    expect(getClaim('unknown-claim-id')).toBeNull();
    expect(getClaim('')).toBeNull();
    expect(getClaim(null)).toBeNull();
    expect(getClaim(undefined)).toBeNull();
  });

  it('getAllClaimIds returns a Set containing all claim IDs', () => {
    const ids = getAllClaimIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(claims.length);
    for (const claim of claims) {
      expect(ids.has(claim.id)).toBe(true);
    }
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

  it('getClaim returns claim for valid ID and null for invalid or missing ID', () => {
    const validClaim = getClaim('cl-tnk-noninferior-alteplase');
    expect(validClaim).toBeTruthy();
    expect(validClaim.id).toBe('cl-tnk-noninferior-alteplase');
    expect(validClaim.statement).toBeDefined();

    expect(getClaim('non-existent-claim-id')).toBeNull();
    expect(getClaim('')).toBeNull();
    expect(getClaim(undefined)).toBeNull();
    expect(getClaim(null)).toBeNull();
  });

  it('getAllClaimIds returns a Set containing all seed claim IDs', () => {
    const claimIds = getAllClaimIds();
    expect(claimIds).toBeInstanceOf(Set);
    expect(claimIds.size).toBeGreaterThan(0);
    expect(claimIds.has('cl-tnk-noninferior-alteplase')).toBe(true);
    expect(claimIds.has('cl-evt-large-core')).toBe(true);
    expect(claimIds.size).toBe(claims.length);
  });
});

describe('Schema validators', () => {
  describe('validateCompletedTrial', () => {
    const makeValidTrial = () => schema.makeCompletedTrial({
      id: 'valid-trial-id',
      shortName: 'Trial Short',
      fullName: 'Trial Full Name',
      topic: 'acute-ischemic-stroke',
      certainty: 'high',
      evidenceType: 'rct',
      verificationStatus: 'verified-rct',
      primaryEndpoint: { result: 'Positive result' },
      lastReviewed: '2026-01-15'
    });

    it('accepts a fully valid completed trial with zero errors and warnings', () => {
      const trial = makeValidTrial();
      const { errors, warnings } = schema.validateCompletedTrial(trial);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('rejects non-kebab-case or empty trial ID', () => {
      const badId = { ...makeValidTrial(), id: 'Invalid_ID_Format' };
      const emptyId = { ...makeValidTrial(), id: '' };

      const res1 = schema.validateCompletedTrial(badId);
      expect(res1.errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);

      const res2 = schema.validateCompletedTrial(emptyId);
      expect(res2.errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    });

    it('rejects missing required string fields (shortName, fullName, topic)', () => {
      const noShortName = { ...makeValidTrial(), shortName: '' };
      const noFullName = { ...makeValidTrial(), fullName: '' };
      const noTopic = { ...makeValidTrial(), topic: '' };

      expect(schema.validateCompletedTrial(noShortName).errors.some((e) => /shortName required/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(noFullName).errors.some((e) => /fullName required/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(noTopic).errors.some((e) => /topic required/.test(e))).toBe(true);
    });

    it('rejects invalid enumeration values for certainty, evidenceType, and verificationStatus', () => {
      const badCertainty = { ...makeValidTrial(), certainty: 'ultra-high' };
      const badEvidenceType = { ...makeValidTrial(), evidenceType: 'anecdote' };
      const badVerificationStatus = { ...makeValidTrial(), verificationStatus: 'verified-by-trust' };

      expect(schema.validateCompletedTrial(badCertainty).errors.some((e) => /certainty invalid/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(badEvidenceType).errors.some((e) => /evidenceType invalid/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(badVerificationStatus).errors.some((e) => /verificationStatus invalid/.test(e))).toBe(true);
    });

    it('rejects missing primary endpoint result on completed trial', () => {
      const bad = schema.makeCompletedTrial({ id: 'fake', shortName: 'X', fullName: 'X' });
      const { errors } = schema.validateCompletedTrial(bad);
      expect(errors.some((e) => /primaryEndpoint\.result/.test(e))).toBe(true);
    });

    it('requires verificationNotes when verificationStatus is todo-verify', () => {
      const missingNotes = {
        ...makeValidTrial(),
        verificationStatus: 'todo-verify',
        verificationNotes: ''
      };
      const withNotes = {
        ...makeValidTrial(),
        verificationStatus: 'todo-verify',
        verificationNotes: 'Verification pending secondary audit'
      };

      const resMissing = schema.validateCompletedTrial(missingNotes);
      expect(resMissing.errors.some((e) => /verificationStatus=todo-verify requires verificationNotes/.test(e))).toBe(true);

      const resWith = schema.validateCompletedTrial(withNotes);
      expect(resWith.errors.some((e) => /verificationNotes/.test(e))).toBe(false);
    });

    it('validates lastReviewed format and warns on stale evidence older than 24 months', () => {
      const invalidDate = { ...makeValidTrial(), lastReviewed: '2026/01/15' };
      const staleDate = { ...makeValidTrial(), lastReviewed: '2018-01-01' };

      const resInvalid = schema.validateCompletedTrial(invalidDate);
      expect(resInvalid.errors.some((e) => /lastReviewed must be ISO date YYYY-MM-DD/.test(e))).toBe(true);

      const resStale = schema.validateCompletedTrial(staleDate);
      expect(resStale.errors.length).toBe(0);
      expect(resStale.warnings.some((w) => /stale-evidence/.test(w))).toBe(true);
    });

    it('validates promotedDate ISO date format when present', () => {
      const invalidPromoted = { ...makeValidTrial(), promotedDate: 'invalid-date' };
      const validPromoted = { ...makeValidTrial(), promotedDate: '2026-02-01' };

      const resInvalid = schema.validateCompletedTrial(invalidPromoted);
      expect(resInvalid.errors.some((e) => /promotedDate must be ISO date YYYY-MM-DD/.test(e))).toBe(true);

      const resValid = schema.validateCompletedTrial(validPromoted);
      expect(resValid.errors).toEqual([]);
    });

    it('validates foreign-key references against ctx.knownCitationIds and ctx.knownActiveTrialIds', () => {
      const trial = {
        ...makeValidTrial(),
        citationIds: ['cit-valid', 'cit-unknown'],
        relatedActiveTrialIds: ['act-valid', 'act-unknown']
      };

      const ctx = {
        knownCitationIds: new Set(['cit-valid']),
        knownActiveTrialIds: new Set(['act-valid'])
      };

      const { errors } = schema.validateCompletedTrial(trial, ctx);
      expect(errors.some((e) => /citationIds references unknown citation 'cit-unknown'/.test(e))).toBe(true);
      expect(errors.some((e) => /relatedActiveTrialIds references unknown active trial 'act-unknown'/.test(e))).toBe(true);

      const validCtx = {
        knownCitationIds: new Set(['cit-valid', 'cit-unknown']),
        knownActiveTrialIds: new Set(['act-valid', 'act-unknown'])
      };
      expect(schema.validateCompletedTrial(trial, validCtx).errors).toEqual([]);
    });
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

  it('makeClaim initializes claim with safe defaults', () => {
    const claim = schema.makeClaim();
    expect(claim).toEqual({
      id: '',
      statement: '',
      topic: '',
      citationIds: [],
      certainty: 'moderate',
      conflictNotes: '',
      lastReviewed: ''
    });
  });

  it('makeClaim constructs claim with provided fields and handles certainty fallbacks', () => {
    const input = {
      id: 'cl-test-claim',
      statement: 'Test claim statement.',
      topic: 'test-topic',
      citationIds: ['cit-1', 'cit-2'],
      certainty: 'high',
      conflictNotes: 'No conflicts observed.',
      lastReviewed: '2026-05-01'
    };
    const claim = schema.makeClaim(input);
    expect(claim).toEqual(input);

    expect(schema.makeClaim({ certainty: 'low' }).certainty).toBe('low');
    expect(schema.makeClaim({ certainty: 'very-low' }).certainty).toBe('very-low');
    expect(schema.makeClaim({ certainty: 'invalid-certainty' }).certainty).toBe('moderate');
    expect(schema.makeClaim({ certainty: null }).certainty).toBe('moderate');
  });

  it('makeClaim defensively clones array inputs', () => {
    const citationIds = ['cit-1', 'cit-2'];
    const claim = schema.makeClaim({ citationIds });
    citationIds.push('cit-3');
    expect(claim.citationIds).toEqual(['cit-1', 'cit-2']);
  });

  it('validateClaim validates claim structural integrity and citation references', () => {
    const validClaim = schema.makeClaim({
      id: 'cl-valid-claim',
      statement: 'Valid claim statement',
      topic: 'test-topic',
      citationIds: ['cit-1'],
      certainty: 'high'
    });
    const validRes = schema.validateClaim(validClaim, { knownCitationIds: new Set(['cit-1']) });
    expect(validRes.errors.length).toBe(0);

    const badIdClaim = schema.makeClaim({ id: 'Invalid ID', statement: 'Statement' });
    const badIdRes = schema.validateClaim(badIdClaim);
    expect(badIdRes.errors.some((e) => /id must be kebab-case/i.test(e))).toBe(true);

    const noStatementClaim = schema.makeClaim({ id: 'valid-id', statement: '' });
    const noStatementRes = schema.validateClaim(noStatementClaim);
    expect(noStatementRes.errors.some((e) => /statement required/i.test(e))).toBe(true);

    const badCertaintyClaim = { ...validClaim, certainty: 'super-high' };
    const badCertaintyRes = schema.validateClaim(badCertaintyClaim);
    expect(badCertaintyRes.errors.some((e) => /certainty invalid/i.test(e))).toBe(true);

    const unknownCitClaim = schema.makeClaim({
      id: 'cl-unknown-cit',
      statement: 'Statement',
      citationIds: ['cit-missing']
    });
    const unknownCitRes = schema.validateClaim(unknownCitClaim, { knownCitationIds: new Set(['cit-1']) });
    expect(unknownCitRes.errors.some((e) => /citationIds references unknown citation 'cit-missing'/i.test(e))).toBe(true);
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

describe('makeGuideline factory', () => {
  it('constructs a guideline with default safe values when given empty or no input', () => {
    const g = schema.makeGuideline();
    expect(g).toEqual({
      id: '',
      name: '',
      organization: '',
      year: 0,
      topic: '',
      url: '',
      citationId: '',
      verificationStatus: 'verified-guideline',
      lastReviewed: '',
      verificationNotes: ''
    });
  });

  it('populates all fields correctly when provided valid input', () => {
    const input = {
      id: 'aha-asa-2019-ais',
      name: '2019 AHA/ASA Early Management of Acute Ischemic Stroke Guidelines',
      organization: 'AHA/ASA',
      year: 2019,
      topic: 'ais-early-mgmt',
      url: 'https://example.org/guideline',
      citationId: 'cit-aha-2019',
      verificationStatus: 'verified-pubmed',
      lastReviewed: '2026-01-15',
      verificationNotes: 'Verified via PubMed PMID 31643129'
    };
    const g = schema.makeGuideline(input);
    expect(g).toEqual(input);
  });

  it('coerces non-finite year inputs to default 0', () => {
    expect(schema.makeGuideline({ year: '2024' }).year).toBe(0);
    expect(schema.makeGuideline({ year: NaN }).year).toBe(0);
    expect(schema.makeGuideline({ year: Infinity }).year).toBe(0);
    expect(schema.makeGuideline({ year: null }).year).toBe(0);
    expect(schema.makeGuideline({ year: 2024 }).year).toBe(2024);
  });

  it('defaults verificationStatus to verified-guideline for invalid or missing status values', () => {
    expect(schema.makeGuideline({ verificationStatus: 'invalid-status' }).verificationStatus).toBe('verified-guideline');
    expect(schema.makeGuideline({ verificationStatus: null }).verificationStatus).toBe('verified-guideline');
    expect(schema.makeGuideline({ verificationStatus: 'todo-verify' }).verificationStatus).toBe('todo-verify');
    expect(schema.makeGuideline({ verificationStatus: 'verified-doi' }).verificationStatus).toBe('verified-doi');
  });

  it('safely handles non-string inputs for string fields', () => {
    const g = schema.makeGuideline({
      id: 123,
      name: null,
      organization: undefined,
      topic: {},
      url: [],
      citationId: true,
      lastReviewed: 20260101,
      verificationNotes: false
    });
    expect(g.id).toBe('');
    expect(g.name).toBe('');
    expect(g.organization).toBe('');
    expect(g.topic).toBe('');
    expect(g.url).toBe('');
    expect(g.citationId).toBe('');
    expect(g.lastReviewed).toBe('');
    expect(g.verificationNotes).toBe('');
  });
});

describe('makeRecommendation factory', () => {
  it('creates a recommendation with default properties when called with no input', () => {
    const rec = schema.makeRecommendation();
    expect(rec).toEqual({
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
  });

  it('populates custom valid properties correctly', () => {
    const input = {
      id: 'rec-pfo-closure',
      topic: 'pfo-closure',
      setting: 'outpatient',
      text: 'Perform PFO closure in patients <60 years with cryptogenic stroke.',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: '2021 AHA/ASA Ischemic Stroke Guidelines',
      supportingClaimIds: ['cl-pfo-benefit'],
      caveats: ['Requires multidisciplinary evaluation.'],
      lastReviewed: '2026-05-01',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Source verified against guideline PDF.'
    };
    const rec = schema.makeRecommendation(input);
    expect(rec).toEqual(input);
  });

  it('falls back to default enum values for invalid inputs', () => {
    const rec = schema.makeRecommendation({
      setting: 'intensive-care',
      classOfRecommendation: 'IV',
      levelOfEvidence: 'E',
      verificationStatus: 'unapproved'
    });
    expect(rec.setting).toBe('all');
    expect(rec.classOfRecommendation).toBe('IIa');
    expect(rec.levelOfEvidence).toBe('B-R');
    expect(rec.verificationStatus).toBe('todo-verify');
  });

  it('defensively clones array inputs and handles invalid non-array/non-string fields', () => {
    const claimIds = ['cl-1', 'cl-2'];
    const caveats = ['caveat-1'];
    const rec = schema.makeRecommendation({
      id: 123,
      text: null,
      supportingClaimIds: claimIds,
      caveats: caveats
    });

    expect(rec.id).toBe('');
    expect(rec.text).toBe('');

    // Assert defensive cloning
    expect(rec.supportingClaimIds).toEqual(['cl-1', 'cl-2']);
    expect(rec.supportingClaimIds).not.toBe(claimIds);
    expect(rec.caveats).toEqual(['caveat-1']);
    expect(rec.caveats).not.toBe(caveats);

    // Mutating original input should not affect rec
    claimIds.push('cl-3');
    expect(rec.supportingClaimIds).toEqual(['cl-1', 'cl-2']);

    // Non-array inputs for array fields fall back to empty array
    const recInvalidArrays = schema.makeRecommendation({
      supportingClaimIds: 'invalid',
      caveats: 456
    });
    expect(recInvalidArrays.supportingClaimIds).toEqual([]);
    expect(recInvalidArrays.caveats).toEqual([]);
  });
});

describe('makeTopic factory', () => {
  it('creates topic with defaults when called with no input or empty object', () => {
    const defaultTopic = schema.makeTopic();
    expect(defaultTopic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });

    const emptyObjTopic = schema.makeTopic({});
    expect(emptyObjTopic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });
  });

  it('populates provided fields correctly', () => {
    const topic = schema.makeTopic({
      id: 'ich-bp-management',
      label: 'ICH blood pressure management',
      parentId: 'ich',
      notes: 'Target SBP < 140'
    });
    expect(topic).toEqual({
      id: 'ich-bp-management',
      label: 'ICH blood pressure management',
      parentId: 'ich',
      notes: 'Target SBP < 140'
    });
  });

  it('falls back to default string values when non-string values are provided', () => {
    const topic = schema.makeTopic({
      id: 12345,
      label: null,
      parentId: undefined,
      notes: ['invalid', 'array']
    });
    expect(topic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });
  });
});

describe('makeTopic in schema.js', () => {
  it('makeTopic produces expected object with defaults and custom fields', () => {
    const defaultTopic = schema.makeTopic();
    expect(defaultTopic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });

    const customTopic = schema.makeTopic({
      id: 'extended-window-ivt',
      label: 'Extended-window IV thrombolysis',
      parentId: 'acute-ischemic-stroke',
      notes: 'Includes WAKE-UP and EXTEND evidence'
    });
    expect(customTopic).toEqual({
      id: 'extended-window-ivt',
      label: 'Extended-window IV thrombolysis',
      parentId: 'acute-ischemic-stroke',
      notes: 'Includes WAKE-UP and EXTEND evidence'
    });

    const nonStringInputTopic = schema.makeTopic({
      id: 123,
      label: null,
      parentId: undefined,
      notes: {}
    });
    expect(nonStringInputTopic).toEqual({
      id: '',
      label: '',
      parentId: '',
      notes: ''
    });
  });
});

describe('makeClaim & validateClaim', () => {
  it('creates a claim with defaults when given empty input', () => {
    const claim = schema.makeClaim();
    expect(claim).toEqual({
      id: '',
      statement: '',
      topic: '',
      citationIds: [],
      certainty: 'moderate',
      conflictNotes: '',
      lastReviewed: ''
    });
  });

  it('creates a claim with provided custom values', () => {
    const input = {
      id: 'cl-test-claim',
      statement: 'Test statement for claim',
      topic: 'test-topic',
      citationIds: ['cit-1', 'cit-2'],
      certainty: 'high',
      conflictNotes: 'No conflicts observed',
      lastReviewed: '2026-05-01'
    };
    const claim = schema.makeClaim(input);
    expect(claim).toEqual(input);
    // Ensure citationIds is cloned properly
    expect(claim.citationIds).not.toBe(input.citationIds);
  });

  it('falls back to default certainty when given an invalid certainty value', () => {
    const claim = schema.makeClaim({ certainty: 'invalid-certainty' });
    expect(claim.certainty).toBe('moderate');
  });

  it('handles non-array citationIds and non-string inputs gracefully', () => {
    const claim = schema.makeClaim({
      id: 123,
      statement: null,
      citationIds: 'not-an-array'
    });
    expect(claim.id).toBe('');
    expect(claim.statement).toBe('');
    expect(claim.citationIds).toEqual([]);
  });

  it('validates a correct claim', () => {
    const claim = schema.makeClaim({
      id: 'cl-valid-claim',
      statement: 'Valid claim statement',
      certainty: 'high',
      citationIds: ['cit-1']
    });
    const { errors, warnings } = schema.validateClaim(claim, { knownCitationIds: new Set(['cit-1']) });
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('returns validation errors for invalid claim fields and unknown citations', () => {
    const badClaim = {
      id: 'Invalid ID',
      statement: '',
      certainty: 'ultra-high',
      citationIds: ['unknown-cit']
    };
    const { errors } = schema.validateClaim(badClaim, { knownCitationIds: new Set(['known-cit']) });
    expect(errors.some((e) => /id must be kebab-case/i.test(e))).toBe(true);
    expect(errors.some((e) => /statement required/i.test(e))).toBe(true);
    expect(errors.some((e) => /certainty invalid/i.test(e))).toBe(true);
    expect(errors.some((e) => /citationIds references unknown citation 'unknown-cit'/i.test(e))).toBe(true);
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


describe('makeGuideline factory function', () => {
  it('returns default guideline object when called with no arguments or empty input', () => {
    const defaultGuideline = schema.makeGuideline();
    expect(defaultGuideline).toEqual({
      id: '',
      name: '',
      organization: '',
      year: 0,
      topic: '',
      url: '',
      citationId: '',
      verificationStatus: 'verified-guideline',
      lastReviewed: '',
      verificationNotes: ''
    });

    expect(schema.makeGuideline({})).toEqual(defaultGuideline);
  });

  it('populates provided valid fields correctly', () => {
    const input = {
      id: 'gl-aha-ais-2026',
      name: 'Early Management of Acute Ischemic Stroke',
      organization: 'AHA/ASA',
      year: 2026,
      topic: 'acute-ischemic-stroke',
      url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000513',
      citationId: 'cit-aha-ais-2026',
      verificationStatus: 'verified-guideline',
      lastReviewed: '2026-04-25',
      verificationNotes: 'Verified against official AHA/ASA published statement'
    };

    const result = schema.makeGuideline(input);
    expect(result).toEqual(input);
  });

  it('coerces non-finite year inputs to default 0', () => {
    expect(schema.makeGuideline({ year: '2026' }).year).toBe(0);
    expect(schema.makeGuideline({ year: NaN }).year).toBe(0);
    expect(schema.makeGuideline({ year: Infinity }).year).toBe(0);
    expect(schema.makeGuideline({ year: null }).year).toBe(0);
    expect(schema.makeGuideline({ year: undefined }).year).toBe(0);
    expect(schema.makeGuideline({ year: 2026 }).year).toBe(2026);
    expect(schema.makeGuideline({ year: 0 }).year).toBe(0);
  });

  it('safely coerces non-string input properties to empty strings', () => {
    const badTypes = {
      id: 123,
      name: null,
      organization: undefined,
      topic: ['stroke'],
      url: { link: 'http://example.com' },
      citationId: true,
      lastReviewed: 20260425,
      verificationNotes: false
    };

    const result = schema.makeGuideline(badTypes);
    expect(result.id).toBe('');
    expect(result.name).toBe('');
    expect(result.organization).toBe('');
    expect(result.topic).toBe('');
    expect(result.url).toBe('');
    expect(result.citationId).toBe('');
    expect(result.lastReviewed).toBe('');
    expect(result.verificationNotes).toBe('');
  });

  it('validates verificationStatus and falls back to verified-guideline when invalid', () => {
    for (const validStatus of schema.VERIFICATION_VALUES) {
      expect(schema.makeGuideline({ verificationStatus: validStatus }).verificationStatus).toBe(validStatus);
    }

    expect(schema.makeGuideline({ verificationStatus: 'invalid-status-string' }).verificationStatus).toBe('verified-guideline');
    expect(schema.makeGuideline({ verificationStatus: null }).verificationStatus).toBe('verified-guideline');
  });

  it('produces output that satisfies validateGuideline schema when valid inputs are given', () => {
    const guideline = schema.makeGuideline({
      id: 'gl-test-2026',
      name: 'Test Guideline Title',
      organization: 'Test Medical Society',
      year: 2026,
      topic: 'test-topic',
      citationId: 'cit-test'
    });

    const validation = schema.validateGuideline(guideline, { knownCitationIds: new Set(['cit-test']) });
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
  });
});

describe('makeGuideline factory', () => {
    it('creates guideline with safe default values when empty or called without parameters', () => {
      const g = schema.makeGuideline();
      expect(g).toEqual({
        id: '',
        name: '',
        organization: '',
        year: 0,
        topic: '',
        url: '',
        citationId: '',
        verificationStatus: 'verified-guideline',
        lastReviewed: '',
        verificationNotes: ''
      });
    });

    it('populates fields correctly when valid input is provided', () => {
      const input = {
        id: 'aha-asa-2019',
        name: '2019 AHA/ASA Ischemic Stroke Guidelines',
        organization: 'AHA/ASA',
        year: 2019,
        topic: 'ais-management',
        url: 'https://example.org/guidelines',
        citationId: 'cit-aha-2019',
        verificationStatus: 'verified-guideline',
        lastReviewed: '2026-01-15',
        verificationNotes: 'Verified against official AHA publication'
      };
      const g = schema.makeGuideline(input);
      expect(g).toEqual(input);
    });

    it('validates year is finite number and falls back to 0 otherwise', () => {
      expect(schema.makeGuideline({ year: 2024 }).year).toBe(2024);
      expect(schema.makeGuideline({ year: '2024' }).year).toBe(0);
      expect(schema.makeGuideline({ year: NaN }).year).toBe(0);
      expect(schema.makeGuideline({ year: Infinity }).year).toBe(0);
      expect(schema.makeGuideline({ year: null }).year).toBe(0);
    });

    it('validates verificationStatus against VERIFICATION_VALUES and defaults to verified-guideline', () => {
      expect(schema.makeGuideline({ verificationStatus: 'todo-verify' }).verificationStatus).toBe('todo-verify');
      expect(schema.makeGuideline({ verificationStatus: 'verified-pubmed' }).verificationStatus).toBe('verified-pubmed');
      expect(schema.makeGuideline({ verificationStatus: 'invalid-status' }).verificationStatus).toBe('verified-guideline');
      expect(schema.makeGuideline({ verificationStatus: null }).verificationStatus).toBe('verified-guideline');
    });

    it('safely handles non-string inputs for string properties', () => {
      const g = schema.makeGuideline({
        id: 123,
        name: null,
        organization: undefined,
        topic: ['topic'],
        url: { link: 'url' },
        citationId: true
      });
      expect(g.id).toBe('');
      expect(g.name).toBe('');
      expect(g.organization).toBe('');
      expect(g.topic).toBe('');
      expect(g.url).toBe('');
      expect(g.citationId).toBe('');
    });
  });


describe('validateCompletedTrial', () => {
    const makeValidTrial = () => schema.makeCompletedTrial({
      id: 'valid-trial-id',
      shortName: 'Trial Short',
      fullName: 'Trial Full Name',
      topic: 'acute-ischemic-stroke',
      certainty: 'high',
      evidenceType: 'rct',
      verificationStatus: 'verified-rct',
      primaryEndpoint: { result: 'Positive result' },
      lastReviewed: '2026-01-15'
    });

    it('accepts a fully valid completed trial with zero errors and warnings', () => {
      const trial = makeValidTrial();
      const { errors, warnings } = schema.validateCompletedTrial(trial);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('rejects non-kebab-case or empty trial ID', () => {
      const badId = { ...makeValidTrial(), id: 'Invalid_ID_Format' };
      const emptyId = { ...makeValidTrial(), id: '' };

      const res1 = schema.validateCompletedTrial(badId);
      expect(res1.errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);

      const res2 = schema.validateCompletedTrial(emptyId);
      expect(res2.errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    });

    it('rejects missing required string fields (shortName, fullName, topic)', () => {
      const noShortName = { ...makeValidTrial(), shortName: '' };
      const noFullName = { ...makeValidTrial(), fullName: '' };
      const noTopic = { ...makeValidTrial(), topic: '' };

      expect(schema.validateCompletedTrial(noShortName).errors.some((e) => /shortName required/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(noFullName).errors.some((e) => /fullName required/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(noTopic).errors.some((e) => /topic required/.test(e))).toBe(true);
    });

    it('rejects invalid enumeration values for certainty, evidenceType, and verificationStatus', () => {
      const badCertainty = { ...makeValidTrial(), certainty: 'ultra-high' };
      const badEvidenceType = { ...makeValidTrial(), evidenceType: 'anecdote' };
      const badVerificationStatus = { ...makeValidTrial(), verificationStatus: 'verified-by-trust' };

      expect(schema.validateCompletedTrial(badCertainty).errors.some((e) => /certainty invalid/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(badEvidenceType).errors.some((e) => /evidenceType invalid/.test(e))).toBe(true);
      expect(schema.validateCompletedTrial(badVerificationStatus).errors.some((e) => /verificationStatus invalid/.test(e))).toBe(true);
    });

    it('rejects missing primary endpoint result on completed trial', () => {
      const bad = schema.makeCompletedTrial({ id: 'fake', shortName: 'X', fullName: 'X' });
      const { errors } = schema.validateCompletedTrial(bad);
      expect(errors.some((e) => /primaryEndpoint\.result/.test(e))).toBe(true);
    });

    it('requires verificationNotes when verificationStatus is todo-verify', () => {
      const missingNotes = {
        ...makeValidTrial(),
        verificationStatus: 'todo-verify',
        verificationNotes: ''
      };
      const withNotes = {
        ...makeValidTrial(),
        verificationStatus: 'todo-verify',
        verificationNotes: 'Verification pending secondary audit'
      };

      const resMissing = schema.validateCompletedTrial(missingNotes);
      expect(resMissing.errors.some((e) => /verificationStatus=todo-verify requires verificationNotes/.test(e))).toBe(true);

      const resWith = schema.validateCompletedTrial(withNotes);
      expect(resWith.errors.some((e) => /verificationNotes/.test(e))).toBe(false);
    });

    it('validates lastReviewed format and warns on stale evidence older than 24 months', () => {
      const invalidDate = { ...makeValidTrial(), lastReviewed: '2026/01/15' };
      const staleDate = { ...makeValidTrial(), lastReviewed: '2018-01-01' };

      const resInvalid = schema.validateCompletedTrial(invalidDate);
      expect(resInvalid.errors.some((e) => /lastReviewed must be ISO date YYYY-MM-DD/.test(e))).toBe(true);

      const resStale = schema.validateCompletedTrial(staleDate);
      expect(resStale.errors.length).toBe(0);
      expect(resStale.warnings.some((w) => /stale-evidence/.test(w))).toBe(true);
    });

    it('validates promotedDate ISO date format when present', () => {
      const invalidPromoted = { ...makeValidTrial(), promotedDate: 'invalid-date' };
      const validPromoted = { ...makeValidTrial(), promotedDate: '2026-02-01' };

      const resInvalid = schema.validateCompletedTrial(invalidPromoted);
      expect(resInvalid.errors.some((e) => /promotedDate must be ISO date YYYY-MM-DD/.test(e))).toBe(true);

      const resValid = schema.validateCompletedTrial(validPromoted);
      expect(resValid.errors).toEqual([]);
    });

    it('validates foreign-key references against ctx.knownCitationIds and ctx.knownActiveTrialIds', () => {
      const trial = {
        ...makeValidTrial(),
        citationIds: ['cit-valid', 'cit-unknown'],
        relatedActiveTrialIds: ['act-valid', 'act-unknown']
      };

      const ctx = {
        knownCitationIds: new Set(['cit-valid']),
        knownActiveTrialIds: new Set(['act-valid'])
      };

      const { errors } = schema.validateCompletedTrial(trial, ctx);
      expect(errors.some((e) => /citationIds references unknown citation 'cit-unknown'/.test(e))).toBe(true);
      expect(errors.some((e) => /relatedActiveTrialIds references unknown active trial 'act-unknown'/.test(e))).toBe(true);

      const validCtx = {
        knownCitationIds: new Set(['cit-valid', 'cit-unknown']),
        knownActiveTrialIds: new Set(['act-valid', 'act-unknown'])
      };
      expect(schema.validateCompletedTrial(trial, validCtx).errors).toEqual([]);
    });
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

describe('validateActiveTrial', () => {
    const validTrialInput = {
      id: 'step-evt',
      shortName: 'STEP',
      fullName: 'Stroke Trial for Endovascular Treatment',
      topic: 'evt-late-window',
      status: 'recruiting',
      nctId: 'NCT12345678',
      matcherCriteria: [{ field: 'nihss', operator: '>=', value: 6 }],
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov',
      relatedCompletedTrialIds: ['wake-up']
    };

    it('accepts a valid active trial record', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      const { errors, warnings } = schema.validateActiveTrial(trial, {
        knownCompletedTrialIds: new Set(['wake-up'])
      });
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('validates id format (kebab-case required)', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      trial.id = 'Invalid_ID';
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    });

    it('validates required fields: shortName, fullName, topic', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      trial.shortName = '';
      trial.fullName = '';
      trial.topic = '';
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /shortName required/.test(e))).toBe(true);
      expect(errors.some((e) => /fullName required/.test(e))).toBe(true);
      expect(errors.some((e) => /topic required/.test(e))).toBe(true);
    });

    it('validates status and verificationStatus values', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      trial.status = 'invalid-status';
      trial.verificationStatus = 'invalid-verification';
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /status invalid/.test(e))).toBe(true);
      expect(errors.some((e) => /verificationStatus invalid/.test(e))).toBe(true);
    });

    it('validates nctId format when present', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      trial.nctId = 'INVALID-NCT';
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /fails NCT pattern/.test(e))).toBe(true);
    });

    it('rejects active trial with missing or empty matcherCriteria', () => {
      const trial = schema.makeActiveTrial(validTrialInput);
      trial.matcherCriteria = [];
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /at least one matcherCriteria entry required/.test(e))).toBe(true);
    });

    it('requires verificationNotes when verificationStatus is todo-verify', () => {
      const trial = schema.makeActiveTrial({
        ...validTrialInput,
        verificationStatus: 'todo-verify',
        verificationNotes: ''
      });
      const { errors } = schema.validateActiveTrial(trial);
      expect(errors.some((e) => /verificationStatus=todo-verify requires verificationNotes/.test(e))).toBe(true);
    });

    it('validates lastReviewed date format and reports staleness warning (> 24 months)', () => {
      const trialInvalidDate = schema.makeActiveTrial(validTrialInput);
      trialInvalidDate.lastReviewed = 'not-an-iso-date';
      const { errors: errorsFormat } = schema.validateActiveTrial(trialInvalidDate);
      expect(errorsFormat.some((e) => /lastReviewed must be ISO date/.test(e))).toBe(true);

      const trialStale = schema.makeActiveTrial(validTrialInput);
      trialStale.lastReviewed = '2020-01-01';
      const { warnings: warningsStale } = schema.validateActiveTrial(trialStale);
      expect(warningsStale.some((w) => /stale-evidence/.test(w))).toBe(true);
    });

    it('validates relatedCompletedTrialIds against known completed trial IDs in context', () => {
      const trial = schema.makeActiveTrial({
        ...validTrialInput,
        relatedCompletedTrialIds: ['unknown-trial-id']
      });
      const { errors } = schema.validateActiveTrial(trial, {
        knownCompletedTrialIds: new Set(['wake-up', 'extend'])
      });
      expect(errors.some((e) => /references unknown completed trial 'unknown-trial-id'/.test(e))).toBe(true);
    });
  });

describe('validateCitation', () => {
    it('accepts a valid citation object', () => {
      const c = schema.makeCitation({
        id: 'valid-citation-id',
        title: 'Valid Citation Title',
        verificationStatus: 'verified-pubmed',
        pmid: '12345678',
        doi: '10.1016/j.stroke.2020.01.001'
      });
      const { errors, warnings } = schema.validateCitation(c);
      expect(errors).toEqual([]);
      expect(warnings).toEqual([]);
    });

    it('rejects missing or non-kebab-case id', () => {
      const badId = schema.makeCitation({ id: 'Invalid ID Name', title: 'Title' });
      const { errors: badIdErrors } = schema.validateCitation(badId);
      expect(badIdErrors.some((e) => e.includes('id must be kebab-case'))).toBe(true);

      const noId = { title: 'Title', verificationStatus: 'verified-pubmed' };
      const { errors: noIdErrors } = schema.validateCitation(noId);
      expect(noIdErrors.some((e) => e.includes('citations/<unset>: id must be kebab-case'))).toBe(true);
    });

    it('rejects missing title', () => {
      const c = schema.makeCitation({ id: 'valid-id', title: '', verificationStatus: 'verified-pubmed' });
      const { errors } = schema.validateCitation(c);
      expect(errors.some((e) => e.includes('title required'))).toBe(true);
    });

    it('rejects invalid verificationStatus', () => {
      const c = { id: 'valid-id', title: 'Title', verificationStatus: 'not-a-valid-status' };
      const { errors } = schema.validateCitation(c);
      expect(errors.some((e) => e.includes('verificationStatus invalid'))).toBe(true);
    });

    it('requires verificationNotes when verificationStatus is todo-verify', () => {
      const withoutNotes = schema.makeCitation({
        id: 'valid-id',
        title: 'Title',
        verificationStatus: 'todo-verify',
        verificationNotes: ''
      });
      const { errors: errsWithoutNotes } = schema.validateCitation(withoutNotes);
      expect(errsWithoutNotes.some((e) => e.includes('requires verificationNotes'))).toBe(true);

      const withNotes = schema.makeCitation({
        id: 'valid-id',
        title: 'Title',
        verificationStatus: 'todo-verify',
        verificationNotes: 'Pending verification against pubmed'
      });
      const { errors: errsWithNotes } = schema.validateCitation(withNotes);
      expect(errsWithNotes.length).toBe(0);
    });

    it('validates PMID format', () => {
      const badPmid = schema.makeCitation({ id: 'valid-id', title: 'Title', pmid: '123', verificationStatus: 'verified-pubmed' });
      const { errors: badErrors } = schema.validateCitation(badPmid);
      expect(badErrors.some((e) => e.includes('pmid \'123\' fails 7-9 digit pattern'))).toBe(true);

      const goodPmid = schema.makeCitation({ id: 'valid-id', title: 'Title', pmid: '12345678', verificationStatus: 'verified-pubmed' });
      const { errors: goodErrors } = schema.validateCitation(goodPmid);
      expect(goodErrors.length).toBe(0);
    });

    it('validates DOI format', () => {
      const badDoi = schema.makeCitation({ id: 'valid-id', title: 'Title', doi: 'invalid-doi', verificationStatus: 'verified-doi' });
      const { errors: badErrors } = schema.validateCitation(badDoi);
      expect(badErrors.some((e) => e.includes('doi \'invalid-doi\' fails DOI pattern'))).toBe(true);

      const goodDoi = schema.makeCitation({ id: 'valid-id', title: 'Title', doi: '10.1056/NEJMoa1706442', verificationStatus: 'verified-doi' });
      const { errors: goodErrors } = schema.validateCitation(goodDoi);
      expect(goodErrors.length).toBe(0);
    });
  });

describe('Schema factory functions — makeActiveTrial', () => {
  it('throws an error when status is missing or invalid', () => {
    expect(() => schema.makeActiveTrial({})).toThrowError(
      /makeActiveTrial: unknown status 'undefined' for trial '<unset>'/
    );
    expect(() => schema.makeActiveTrial({ id: 'my-trial', status: 'invalid-status' })).toThrowError(
      /makeActiveTrial: unknown status 'invalid-status' for trial 'my-trial'/
    );
  });

  it('constructs an ActiveTrial record with valid minimal input and defaults', () => {
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

  it('populates provided fields and valid verificationStatus', () => {
    const input = {
      id: 'step-evt',
      shortName: 'STEP-EVT',
      fullName: 'Study of Thrombectomy for Endovascular Procedural outcomes',
      nctId: 'NCT01234567',
      phase: 'Phase 3',
      status: 'recruiting',
      topic: 'evt-late-window',
      briefDescription: 'Brief summary',
      rationale: 'Clinical rationale',
      inclusionCriteria: ['Age 18-80'],
      exclusionCriteria: ['mRS > 2'],
      keyTakeaways: ['Key takeaway 1'],
      lookingFor: ['Target population'],
      category: 'Interventional',
      relatedCompletedTrialIds: ['select2'],
      link: 'https://clinicaltrials.gov/study/NCT01234567',
      lastReviewed: '2026-04-25',
      verificationStatus: 'verified-clinicaltrials-gov',
      verificationNotes: 'Verified against ClinicalTrials.gov record',
      legacyMatcherKey: 'STEP'
    };

    const trial = schema.makeActiveTrial(input);
    expect(trial.id).toBe('step-evt');
    expect(trial.shortName).toBe('STEP-EVT');
    expect(trial.fullName).toBe('Study of Thrombectomy for Endovascular Procedural outcomes');
    expect(trial.nctId).toBe('NCT01234567');
    expect(trial.status).toBe('recruiting');
    expect(trial.verificationStatus).toBe('verified-clinicaltrials-gov');
    expect(trial.legacyMatcherKey).toBe('STEP');
  });

  it('correctly maps matcherCriteria and matcherExclusions with default fallback values', () => {
    const trial = schema.makeActiveTrial({
      status: 'enrolling-by-invitation',
      matcherCriteria: [
        { field: 'nihss', operator: '>=', value: 6, label: 'NIHSS 6+' },
        { field: 'age', operator: '<=', value: 80 }
      ],
      matcherExclusions: [
        { id: 'ex-1', field: 'priorICH', label: 'Prior ICH' },
        { id: 'ex-2', field: 'mRS', operator: '>', value: 2, label: 'Pre-stroke mRS > 2' },
        { id: 'ex-3', field: 'pregnant', operator: '==', value: false, label: 'Not pregnant' }
      ]
    });

    expect(trial.matcherCriteria).toEqual([
      { field: 'nihss', operator: '>=', value: 6, label: 'NIHSS 6+' },
      { field: 'age', operator: '<=', value: 80, label: '' }
    ]);

    expect(trial.matcherExclusions).toEqual([
      { id: 'ex-1', field: 'priorICH', operator: '==', value: true, label: 'Prior ICH' },
      { id: 'ex-2', field: 'mRS', operator: '>', value: 2, label: 'Pre-stroke mRS > 2' },
      { id: 'ex-3', field: 'pregnant', operator: '==', value: false, label: 'Not pregnant' }
    ]);
  });

  it('falls back to todo-verify when given an unknown verificationStatus', () => {
    const trial = schema.makeActiveTrial({
      status: 'active-not-recruiting',
      verificationStatus: 'unknown-status'
    });
    expect(trial.verificationStatus).toBe('todo-verify');
  });

  it('defensively clones array inputs so external mutations do not contaminate returned trial', () => {
    const incArray = ['Age >= 18'];
    const trial = schema.makeActiveTrial({
      status: 'recruiting',
      inclusionCriteria: incArray
    });

    incArray.push('Mutated element');
    expect(trial.inclusionCriteria).toEqual(['Age >= 18']);
  });
});

describe('schema — makeRecommendation factory', () => {
  it('generates expected default properties when called with empty or no input', () => {
    const rec1 = schema.makeRecommendation();
    const rec2 = schema.makeRecommendation({});

    const expectedDefaults = {
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
    };

    expect(rec1).toEqual(expectedDefaults);
    expect(rec2).toEqual(expectedDefaults);
  });

  it('populates custom valid values when provided', () => {
    const input = {
      id: 'rec-aha-2026-bp',
      topic: 'bp-management',
      setting: 'inpatient',
      text: 'Maintain SBP < 140 mmHg in acute ICH.',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA/ASA 2026 Guidelines',
      supportingClaimIds: ['cl-bp-lowering-ich'],
      caveats: ['Monitor for hypotension'],
      lastReviewed: '2026-05-01',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified against published AHA guidelines.'
    };

    const rec = schema.makeRecommendation(input);
    expect(rec).toEqual(input);
  });

  it('falls back to safe defaults when provided invalid enum or non-string/non-array values', () => {
    const rec = schema.makeRecommendation({
      id: 12345,
      topic: null,
      setting: 'ICU-only-invalid',
      text: { invalid: 'object' },
      classOfRecommendation: 'Class-INVALID',
      levelOfEvidence: 'Level-Z',
      guidelineSource: undefined,
      supportingClaimIds: 'not-an-array',
      caveats: null,
      lastReviewed: 20260501,
      verificationStatus: 'invalid-status',
      verificationNotes: true
    });

    expect(rec.id).toBe('');
    expect(rec.topic).toBe('');
    expect(rec.setting).toBe('all');
    expect(rec.text).toBe('');
    expect(rec.classOfRecommendation).toBe('IIa');
    expect(rec.levelOfEvidence).toBe('B-R');
    expect(rec.guidelineSource).toBe('');
    expect(rec.supportingClaimIds).toEqual([]);
    expect(rec.caveats).toEqual([]);
    expect(rec.lastReviewed).toBe('');
    expect(rec.verificationStatus).toBe('todo-verify');
    expect(rec.verificationNotes).toBe('');
  });

  it('clones input arrays so external mutations do not pollute recommendation state', () => {
    const claimIds = ['cl-1', 'cl-2'];
    const caveats = ['caveat-1'];

    const rec = schema.makeRecommendation({
      supportingClaimIds: claimIds,
      caveats: caveats
    });

    // Mutate input arrays
    claimIds.push('cl-mutated');
    caveats.push('caveat-mutated');

    expect(rec.supportingClaimIds).toEqual(['cl-1', 'cl-2']);
    expect(rec.caveats).toEqual(['caveat-1']);

    // Mutate output arrays
    rec.supportingClaimIds.push('cl-output-mutated');
    expect(claimIds).toEqual(['cl-1', 'cl-2', 'cl-mutated']);
  });

  it('integrates cleanly with validateRecommendation for valid and default outputs', () => {
    const defaultRec = schema.makeRecommendation();
    const { errors: defaultErrors } = schema.validateRecommendation(defaultRec);
    expect(defaultErrors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    expect(defaultErrors.some((e) => /text required/.test(e))).toBe(true);
    expect(defaultErrors.some((e) => /lastReviewed/.test(e))).toBe(true);

    const validRec = schema.makeRecommendation({
      id: 'rec-test-valid',
      topic: 'bp-management',
      setting: 'inpatient',
      text: 'Target SBP < 140 mmHg',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA 2026',
      supportingClaimIds: ['cl-bp-1'],
      lastReviewed: '2026-05-01',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified'
    });

    const { errors, warnings } = schema.validateRecommendation(validRec, {
      knownClaimIds: new Set(['cl-bp-1']),
      claimById: new Map([['cl-bp-1', { id: 'cl-bp-1', topic: 'bp-management' }]])
    });

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });
});

describe('schema — makeRecommendation factory', () => {
  it('generates expected default properties when called with empty or no input', () => {
    const rec1 = schema.makeRecommendation();
    const rec2 = schema.makeRecommendation({});

    const expectedDefaults = {
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
    };

    expect(rec1).toEqual(expectedDefaults);
    expect(rec2).toEqual(expectedDefaults);
  });

  it('populates custom valid values when provided', () => {
    const input = {
      id: 'rec-aha-2026-bp',
      topic: 'bp-management',
      setting: 'inpatient',
      text: 'Maintain SBP < 140 mmHg in acute ICH.',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA/ASA 2026 Guidelines',
      supportingClaimIds: ['cl-bp-lowering-ich'],
      caveats: ['Monitor for hypotension'],
      lastReviewed: '2026-05-01',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified against published AHA guidelines.'
    };

    const rec = schema.makeRecommendation(input);
    expect(rec).toEqual(input);
  });

  it('falls back to safe defaults when provided invalid enum or non-string/non-array values', () => {
    const rec = schema.makeRecommendation({
      id: 12345,
      topic: null,
      setting: 'ICU-only-invalid',
      text: { invalid: 'object' },
      classOfRecommendation: 'Class-INVALID',
      levelOfEvidence: 'Level-Z',
      guidelineSource: undefined,
      supportingClaimIds: 'not-an-array',
      caveats: null,
      lastReviewed: 20260501,
      verificationStatus: 'invalid-status',
      verificationNotes: true
    });

    expect(rec.id).toBe('');
    expect(rec.topic).toBe('');
    expect(rec.setting).toBe('all');
    expect(rec.text).toBe('');
    expect(rec.classOfRecommendation).toBe('IIa');
    expect(rec.levelOfEvidence).toBe('B-R');
    expect(rec.guidelineSource).toBe('');
    expect(rec.supportingClaimIds).toEqual([]);
    expect(rec.caveats).toEqual([]);
    expect(rec.lastReviewed).toBe('');
    expect(rec.verificationStatus).toBe('todo-verify');
    expect(rec.verificationNotes).toBe('');
  });

  it('clones input arrays so external mutations do not pollute recommendation state', () => {
    const claimIds = ['cl-1', 'cl-2'];
    const caveats = ['caveat-1'];

    const rec = schema.makeRecommendation({
      supportingClaimIds: claimIds,
      caveats: caveats
    });

    // Mutate input arrays
    claimIds.push('cl-mutated');
    caveats.push('caveat-mutated');

    expect(rec.supportingClaimIds).toEqual(['cl-1', 'cl-2']);
    expect(rec.caveats).toEqual(['caveat-1']);

    // Mutate output arrays
    rec.supportingClaimIds.push('cl-output-mutated');
    expect(claimIds).toEqual(['cl-1', 'cl-2', 'cl-mutated']);
  });

  it('integrates cleanly with validateRecommendation for valid and default outputs', () => {
    const defaultRec = schema.makeRecommendation();
    const { errors: defaultErrors } = schema.validateRecommendation(defaultRec);
    expect(defaultErrors.some((e) => /id must be kebab-case/.test(e))).toBe(true);
    expect(defaultErrors.some((e) => /text required/.test(e))).toBe(true);
    expect(defaultErrors.some((e) => /lastReviewed/.test(e))).toBe(true);

    const validRec = schema.makeRecommendation({
      id: 'rec-test-valid',
      topic: 'bp-management',
      setting: 'inpatient',
      text: 'Target SBP < 140 mmHg',
      classOfRecommendation: 'I',
      levelOfEvidence: 'A',
      guidelineSource: 'AHA 2026',
      supportingClaimIds: ['cl-bp-1'],
      lastReviewed: '2026-05-01',
      verificationStatus: 'verified-guideline',
      verificationNotes: 'Verified'
    });

    const { errors, warnings } = schema.validateRecommendation(validRec, {
      knownClaimIds: new Set(['cl-bp-1']),
      claimById: new Map([['cl-bp-1', { id: 'cl-bp-1', topic: 'bp-management' }]])
    });

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
