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
