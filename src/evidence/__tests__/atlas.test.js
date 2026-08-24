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
});
