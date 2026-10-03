// src/evidence/__tests__/screener-eval.test.js
//
// Unit specs for the native Trial Screener dual-eval engine. Run with
// `npm run test:unit`. Pure functions only — no DOM, no React.

import { describe, it, expect } from 'vitest';
import { screenerTrials, CTGOV_FIRST_PASS_NOTE } from '../screenerTrials.js';
import {
  createInitialScreenerState,
  buildScreenerParams,
  evaluateTrialEligibility,
  evaluateAll,
  patientTimeCategory,
  getTimeSortingScore,
  EXCLUSION_ITEMS,
  ONSET_PRESETS,
  GENERIC_CONFIRMATION
} from '../screener-eval.js';

const sentinel = (...parts) => parts.join('_');
const trialByAcronym = (acr) => screenerTrials.find((t) => t.acronym === acr);

describe('screenerTrials — data integrity & compliance', () => {
  // 2026-10-03 registry audit: the two unregistered placeholders (ESUS, MOCHA)
  // were removed; FASTEST Part 2 and SISTER were added as screenable profiles;
  // PICASSO (recruiting) and CAPTIVA (active, not recruiting) moved from
  // table-only rows into reference-only profiles so Database can find them.
  it('stores 16 study profiles: 14 screenable plus 2 reference-only', () => {
    expect(screenerTrials.length).toBe(16);
    expect(screenerTrials.filter(t => t.referenceOnly).map(t => t.acronym).sort()).toEqual(['CAPTIVA', 'PICASSO']);
  });

  it('includes the expected acronyms and no unregistered placeholders', () => {
    const acronyms = screenerTrials.map((t) => t.acronym);
    [
      'STEP', 'TESTED', 'VERIFY', 'ASPIRE', 'SATURN', 'MINUTE', 'CLARITY', 'INTERCEPT',
      'CAPPRICORN-1', 'SCOUTS-3', 'MR-PICS', 'TELE-REHAB-2', 'FASTEST-2', 'SISTER', 'PICASSO', 'CAPTIVA'
    ].forEach((acr) => expect(acronyms).toContain(acr));
    expect(acronyms).not.toContain('ESUS');
    expect(acronyms).not.toContain('MOCHA');
    expect(screenerTrials.filter(t => t.status === 'placeholder')).toEqual([]);
  });

  it('every trial is institution-clean: noContactInfo true + sourceGaps present', () => {
    screenerTrials.forEach((t) => {
      expect(t.noContactInfo).toBe(true);
      expect(Array.isArray(t.sourceGaps)).toBe(true);
      expect(t.sourceGaps.length).toBeGreaterThan(0);
    });
  });

  it('renders no institutional identifiers in any serializable field', () => {
    const banned = new RegExp([
      sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL')
    ].join('|'), 'i');
    screenerTrials.forEach((t) => {
      const flat = [
        t.acronym,
        t.exactFullStudyName,
        t.conciseBedsideSummary,
        t.pathway,
        ...(t.exactInclusionCriteria || []),
        ...(t.exactExclusionCriteria || []),
        ...(t.sourceGaps || [])
      ].join(' \n ');
      expect(flat).not.toMatch(banned);
    });
  });

  it('gives every profile a primary registry identity, phase and study type', () => {
    screenerTrials.forEach((t) => {
      expect(t.externalMetadata.nct).toMatch(/^NCT\d{8}$/);
      expect(t.externalMetadata.registryUrl).toBe(`https://clinicaltrials.gov/study/${t.externalMetadata.nct}`);
      expect(['NA', 'PHASE2', 'PHASE3']).toContain(t.externalMetadata.phase);
      expect(['INTERVENTIONAL', 'OBSERVATIONAL']).toContain(t.externalMetadata.studyType);
      expect(t.externalMetadata.localActivationStatus).toBe('not_assessed');
    });
  });

  it('exposes the first-pass note constant', () => {
    expect(CTGOV_FIRST_PASS_NOTE).toMatch(/First-pass ClinicalTrials\.gov/);
  });
});

describe('evaluateTrialEligibility — placeholder / soon handling', () => {
  it('still returns placeholder status for an unverified profile without screening it', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    const p = buildScreenerParams(state);
    const r = evaluateTrialEligibility({ acronym: 'UNVERIFIED', status: 'placeholder', eligibility: { criteria: [{ field: 'classification', operator: '==', value: 'ischemic' }] } }, p);
    expect(r.status).toBe('placeholder');
    expect(r.exclusionReasons[0]).toMatch(/Incomplete study profile/);
  });

  it('marks NOT_YET_RECRUITING trials (CLARITY) as soon, never eligible', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 30;
    state.onsetUnit = 'days';
    state.age = 60;
    state.singleAntiplateletSoc = true;
    const p = buildScreenerParams(state);
    const r = evaluateTrialEligibility(trialByAcronym('CLARITY'), p);
    expect(r.status).toBe('soon');
  });
});

describe('evaluateAll — bucketing on representative patients', () => {
  // PATIENT A — a fully-qualified SCOUTS-3 candidate.
  // Ischemic, 12h onset, age 65, inpatient rehab placement confirmed,
  // English-speaking, no SCOUTS-3 exclusions checked. Because every encoded
  // trial is `first_pass` (sourceCompletenessStatus !== 'complete'), the engine
  // intentionally never returns a green "eligible" verdict — fully-qualified
  // candidates surface in the `pending` (🟡 Possible) bucket carrying a
  // registry-confirmation field.
  it('buckets a SCOUTS-3-qualified patient into the pending candidate list', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 12;
    state.onsetUnit = 'hours';
    state.age = 65;
    state.nihss = 8;
    state.preMrs = 0;
    state.rehab = true;
    state.language = true;

    const res = evaluateAll(state);
    expect(res.ready).toBe(true);
    // Compliance contract: no first-pass trial is ever returned as eligible.
    expect(res.eligible.length).toBe(0);
    const pendingAcr = res.pending.map((i) => i.trial.acronym);
    expect(pendingAcr).toContain('SCOUTS-3');
    // SCOUTS-3 must not appear in the excluded bucket.
    expect(res.excluded.map((i) => i.trial.acronym)).not.toContain('SCOUTS-3');
    const scouts = res.pending.find((i) => i.trial.acronym === 'SCOUTS-3');
    expect(scouts.matchedCriteria.length).toBeGreaterThan(0);
    // Every hard criterion is met, so the registry gate is the only thing left.
    expect(scouts.pendingFields).toContain('Full registry/protocol confirmation');
    expect(scouts.pendingCriteria.some(s => /pregnan/i.test(s))).toBe(true);
  });

  // PATIENT B — hard-excluded from SCOUTS-3 (onset too late, > 30d).
  it('excludes SCOUTS-3 for a patient outside its onset window', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 60; // > 30d
    state.onsetUnit = 'days';
    state.age = 65;
    state.nihss = 8;
    state.preMrs = 0;
    state.rehab = true;
    state.language = true;

    const res = evaluateAll(state);
    const excludedAcr = res.excluded.map((i) => i.trial.acronym);
    expect(excludedAcr).toContain('SCOUTS-3');
    const scouts = res.excluded.find((i) => i.trial.acronym === 'SCOUTS-3');
    expect(scouts.exclusionReasons.join(' ')).toMatch(/> 30 days ago/);
    // And it is NOT eligible.
    expect(res.eligible.map((i) => i.trial.acronym)).not.toContain('SCOUTS-3');
  });

  // PATIENT C — pending inputs. Ischemic at 12h with only classification +
  // onset set: SCOUTS-3 cannot be confirmed eligible (age / rehab placement /
  // language unselected) so it lands in pending, not eligible nor excluded.
  it('buckets a SCOUTS-3 candidate with missing inputs into pending', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 12;
    state.onsetUnit = 'hours';
    // age/rehab/language deliberately left 'unselected'

    const res = evaluateAll(state);
    const pendingAcr = res.pending.map((i) => i.trial.acronym);
    expect(pendingAcr).toContain('SCOUTS-3');
    const scouts = res.pending.find((i) => i.trial.acronym === 'SCOUTS-3');
    expect(scouts.pendingFields).toEqual(
      expect.arrayContaining(['Age', 'Rehab unit placement', 'Language spoken'])
    );
    // Not double-counted.
    expect(res.eligible.map((i) => i.trial.acronym)).not.toContain('SCOUTS-3');
    expect(res.excluded.map((i) => i.trial.acronym)).not.toContain('SCOUTS-3');
  });

  it('returns ready=false and empty buckets when classification is unselected', () => {
    const res = evaluateAll(createInitialScreenerState());
    expect(res.ready).toBe(false);
    expect(res.eligible.length).toBe(0);
    expect(res.pending.length).toBe(0);
    expect(res.briefingNote).toBe('');
  });

  it('never screens reference-only profiles and keeps closed profiles out of candidates', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 3;
    state.onsetUnit = 'days';
    const res = evaluateAll(state);
    const all = ['eligible', 'pending', 'soon', 'excluded', 'closed', 'incomplete'].flatMap(k => res[k].map(i => i.trial.acronym));
    expect(all).not.toContain('PICASSO');
    expect(all).not.toContain('CAPTIVA');
    expect(res.closed.map(i => i.trial.acronym)).toEqual(['CAPPRICORN-1']);
    expect([...res.eligible, ...res.pending].map(i => i.trial.acronym)).not.toContain('CAPPRICORN-1');
  });
});

describe('time category + onset-window sorting', () => {
  it('maps onset days to the right phase', () => {
    expect(patientTimeCategory(0.5)).toBe('hyperacute');
    expect(patientTimeCategory(10)).toBe('acute_subacute');
    expect(patientTimeCategory(120)).toBe('subacute_chronic');
  });

  it('scores trial/patient category proximity highest on exact match', () => {
    expect(getTimeSortingScore('hyperacute', 'hyperacute')).toBe(3);
    expect(getTimeSortingScore('subacute_chronic', 'hyperacute')).toBe(1);
  });

  it('sorts a result bucket by onset-window proximity (descending score)', () => {
    // Hyperacute patient: hyperacute-category trials should sort ahead of
    // subacute_chronic ones within the same bucket.
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 12;
    state.onsetUnit = 'hours';
    state.age = 65;
    state.nihss = 8;
    state.aspects = 8;
    state.preMrs = 0;
    state.anteriorCirculation = true;
    const res = evaluateAll(state);
    const bucket = res.pending; // first-pass trials surface here
    expect(bucket.length).toBeGreaterThanOrEqual(2);
    const scores = bucket.map((i) =>
      getTimeSortingScore(i.trial.timeCategory, res.timeCategory)
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });
});

describe('screening summary generation', () => {
  it('lists inputs, act-now candidates with NCT, status, phase and pathway, then not-met reasons', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 12;
    state.onsetUnit = 'hours';
    state.age = 65;
    state.nihss = 8;
    state.aspects = 8;
    state.preMrs = 0;
    state.anteriorCirculation = true;
    const res = evaluateAll(state);
    const text = res.briefingNote;
    expect(text).toMatch(/^TRIAL SCREEN — first pass \(registry checked 2026-10-03\)/);
    expect(text).toContain('Inputs: Ischemic stroke · LKW 12.0 h · age 65 · NIHSS 8 · pre-mRS 0 · ASPECTS 8');
    expect(res.pending.length).toBeGreaterThan(0);
    expect(text).toMatch(new RegExp(`ACT NOW — possible candidates \\(${res.pending.length}\\)`));
    expect(text).toMatch(/- SISTER \(NCT05948566\) · Recruiting · Phase 2 · window 4\.5 – 24 hours/);
    expect(text).toContain('Pathway: Consult Stroke Research Coordinator');
    // Studies for another stroke type are omitted; only informative misses remain.
    expect(text).toContain('NOT MET (1)\n- TESTED: Pre-stroke mRS must be exactly 3 or 4');
    expect(text).not.toMatch(/Requires ICH/);
    expect(text).not.toContain(GENERIC_CONFIRMATION);
    expect(text.trim().split('\n').pop()).toBe('First-pass registry screen — confirm full criteria, local activation and consent. Screening does not determine treatment eligibility.');
  });

  it('reports no matches for an empty parameter set with classification only', () => {
    const state = createInitialScreenerState();
    state.classification = 'tia';
    state.onsetVal = 200;
    state.onsetUnit = 'days'; // outside every TIA window
    const res = evaluateAll(state);
    // CLARITY's window ends at 180 days; INTERCEPT stays possible only if the
    // patient was on OAC at the index event (6–52-week group), which is unknown.
    expect(res.briefingNote).toContain('Inputs: TIA · LKW 6.7 mo');
    expect(res.briefingNote).toMatch(/ACT NOW — possible candidates \(1\)\n- INTERCEPT \(NCT05723926\)/);
    expect(res.briefingNote).toContain('Confirm timing group: <6 weeks from index stroke (any OAC status) OR 6–52 weeks if on OAC at the index stroke');
    expect(res.briefingNote).toContain('NOT MET (1)\n- CLARITY: Stroke/TIA occurred > 180 days ago');
  });
});

describe('exported UI metadata', () => {
  it('exposes onset presets and exclusion items', () => {
    expect(ONSET_PRESETS.length).toBe(6);
    expect(EXCLUSION_ITEMS.length).toBeGreaterThan(30);
    EXCLUSION_ITEMS.forEach((it) => {
      expect(it.id).toMatch(/^ex/);
      expect(Array.isArray(it.classifications)).toBe(true);
      expect(Array.isArray(it.trials)).toBe(true);
    });
  });
});
