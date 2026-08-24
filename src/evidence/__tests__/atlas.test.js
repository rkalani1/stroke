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
