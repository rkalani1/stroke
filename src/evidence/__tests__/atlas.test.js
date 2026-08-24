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
