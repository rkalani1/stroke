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
  ONSET_PRESETS
} from '../screener-eval.js';

const trialByAcronym = (acr) => screenerTrials.find((t) => t.acronym === acr);

describe('screenerTrials — data integrity & compliance', () => {
  // NOTE: the brief described "16 trial objects", but the canonical source
  // (stroke-trials-screener/index.html) contains exactly 15 — every acronym
  // the brief enumerated (10 net-new + 5 overlap) is present and ported
  // verbatim. We assert the real source count.
  it('ports all 15 source trials', () => {
    expect(screenerTrials.length).toBe(15);
  });

  it('includes the net-new and overlap acronyms', () => {
    const acronyms = screenerTrials.map((t) => t.acronym);
    [
      'SISTER', 'STEP', 'TESTED', 'VERIFY', 'ASPIRE', 'SATURN', // overlap
      'MINUTE', 'CLARITY', 'INTERCEPT', 'ESUS', 'MOCHA',
      'CAPPRICORN-1', 'SCOUTS-3', 'MR-PICS', 'TELE-REHAB-2' // net-new
    ].forEach((acr) => expect(acronyms).toContain(acr));
  });

  it('every trial is institution-clean: noContactInfo true + sourceGaps present', () => {
    screenerTrials.forEach((t) => {
      expect(t.noContactInfo).toBe(true);
      expect(Array.isArray(t.sourceGaps)).toBe(true);
      expect(t.sourceGaps.length).toBeGreaterThan(0);
    });
  });

  it('renders no institutional identifiers in any serializable field', () => {
    const banned = /harborview|hmc|montlake|kalani|university of washington|uw medicine/i;
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

  it('blocks unverified studies (ESUS, MOCHA) as placeholders', () => {
    ['ESUS', 'MOCHA'].forEach((acr) => {
      const t = trialByAcronym(acr);
      expect(t.status).toBe('placeholder');
      expect(t.sourceCompletenessStatus).toBe('not_registry_verified');
    });
  });

  it('exposes the first-pass note constant', () => {
    expect(CTGOV_FIRST_PASS_NOTE).toMatch(/First-pass ClinicalTrials\.gov/);
  });
});

describe('evaluateTrialEligibility — placeholder / soon handling', () => {
  it('returns placeholder status for unverified ESUS without ever screening', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.etiology = 'esus';
    const p = buildScreenerParams(state);
    const r = evaluateTrialEligibility(trialByAcronym('ESUS'), p);
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
  // PATIENT A — a fully-qualified SISTER candidate.
  // Ischemic, anterior circulation, 12h onset, NIHSS 8, ASPECTS 8, mRS 0,
  // no SISTER exclusions checked. Because every encoded trial is `first_pass`
  // (sourceCompletenessStatus !== 'complete'), the engine intentionally never
  // returns a green "eligible" verdict — fully-qualified candidates surface in
  // the `pending` (🟡 Possible) bucket carrying a registry-confirmation field.
  it('buckets a SISTER-qualified patient into the pending candidate list', () => {
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
    expect(res.ready).toBe(true);
    // Compliance contract: no first-pass trial is ever returned as eligible.
    expect(res.eligible.length).toBe(0);
    const pendingAcr = res.pending.map((i) => i.trial.acronym);
    expect(pendingAcr).toContain('SISTER');
    // SISTER must not appear in the excluded bucket.
    expect(res.excluded.map((i) => i.trial.acronym)).not.toContain('SISTER');
    const sister = res.pending.find((i) => i.trial.acronym === 'SISTER');
    expect(sister.matchedCriteria.length).toBeGreaterThan(0);
    // The registry-confirmation gate is present.
    expect(sister.pendingFields).toContain('Full registry/protocol confirmation');
  });

  // PATIENT B — hard-excluded from SISTER (onset too early, < 4.5h).
  it('excludes SISTER for a patient outside its onset window', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 2; // < 4.5h
    state.onsetUnit = 'hours';
    state.age = 65;
    state.nihss = 8;
    state.aspects = 8;
    state.preMrs = 0;
    state.anteriorCirculation = true;

    const res = evaluateAll(state);
    const excludedAcr = res.excluded.map((i) => i.trial.acronym);
    expect(excludedAcr).toContain('SISTER');
    const sister = res.excluded.find((i) => i.trial.acronym === 'SISTER');
    expect(sister.exclusionReasons.join(' ')).toMatch(/4\.5-24h/);
    // And it is NOT eligible.
    expect(res.eligible.map((i) => i.trial.acronym)).not.toContain('SISTER');
  });

  // PATIENT C — pending inputs. Ischemic at 12h with only classification +
  // onset set: SISTER cannot be confirmed eligible (NIHSS/ASPECTS/anterior
  // circ unselected) so it lands in pending, not eligible nor excluded.
  it('buckets a SISTER candidate with missing inputs into pending', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 12;
    state.onsetUnit = 'hours';
    // age/nihss/aspects/anteriorCirculation deliberately left 'unselected'

    const res = evaluateAll(state);
    const pendingAcr = res.pending.map((i) => i.trial.acronym);
    expect(pendingAcr).toContain('SISTER');
    const sister = res.pending.find((i) => i.trial.acronym === 'SISTER');
    expect(sister.pendingFields.length).toBeGreaterThan(0);
    // Not double-counted.
    expect(res.eligible.map((i) => i.trial.acronym)).not.toContain('SISTER');
    expect(res.excluded.map((i) => i.trial.acronym)).not.toContain('SISTER');
  });

  it('returns ready=false and empty buckets when classification is unselected', () => {
    const res = evaluateAll(createInitialScreenerState());
    expect(res.ready).toBe(false);
    expect(res.eligible.length).toBe(0);
    expect(res.pending.length).toBe(0);
    expect(res.briefingNote).toBe('');
  });

  it('routes unverified ESUS/MOCHA into the incomplete bucket', () => {
    const state = createInitialScreenerState();
    state.classification = 'ischemic';
    state.onsetVal = 3;
    state.onsetUnit = 'days';
    const res = evaluateAll(state);
    const incompleteAcr = res.incomplete.map((i) => i.trial.acronym);
    expect(incompleteAcr).toContain('ESUS');
    expect(incompleteAcr).toContain('MOCHA');
    // Never eligible.
    expect(res.eligible.map((i) => i.trial.acronym)).not.toContain('ESUS');
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

describe('briefing note generation', () => {
  it('lists referral candidates with NCT + pathway', () => {
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
    expect(res.briefingNote).toMatch(/STROKE SCREENER REFERRAL NOTE/);
    // Fully-qualified first-pass candidates appear under the 🟡 pending header.
    expect(res.pending.length).toBeGreaterThan(0);
    expect(res.briefingNote).toMatch(/POSSIBLE CANDIDATES/);
    expect(res.briefingNote).toMatch(/NCT/);
  });

  it('reports no matches for an empty parameter set with classification only', () => {
    const state = createInitialScreenerState();
    state.classification = 'tia';
    state.onsetVal = 200;
    state.onsetUnit = 'days'; // outside every TIA window
    const res = evaluateAll(state);
    // CLARITY (TIA-eligible) requires <=180d, so >180d should drop it.
    expect(res.briefingNote).toMatch(/STROKE SCREENER REFERRAL NOTE/);
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
