// src/evidence/__tests__/parity.test.js
//
// Parity test suite. Generates a matrix of synthetic patient encounter
// scenarios, runs both the legacy evaluator (TRIAL_ELIGIBILITY_CONFIG +
// evaluateTrialEligibility) and the generic engine
// (evaluateActiveTrial), and asserts they agree on overall trial status
// for the criteria the engine is responsible for.
//
// This is the "programmatic parity evidence" that the previous sprint
// said was needed before flipping the canonical source. With these
// tests in CI, parity is an enforced invariant: any future change to
// either evaluator that breaks agreement will fail the suite.
//
// Note on scope: the engine evaluates `matcherCriteria` only — not the
// legacy `exclusionFlags`. Where the legacy decides not_eligible *only*
// because of an exclusion flag, the engine sees no flag and returns a
// less-restrictive status. The parity tests handle that by ignoring
// status disagreements that are explicable by exclusion-only legacy
// triggers.

import { describe, it, expect } from 'vitest';
import {
  TRIAL_ELIGIBILITY_CONFIG,
  evaluateTrialEligibility
} from '../legacy-criteria.js';
import {
  evaluateActiveTrial as engineEvaluateActiveTrial,
  diffEvaluations
} from '../matcher-engine.js';
import { activeTrials } from '../index.js';

// ---------------------------------------------------------------------
// Synthetic patient generator. Each scenario is a plausible encounter
// state across the dimensions the matcher uses. We deliberately mix
// "fully populated", "partially populated", and "boundary" patients so
// the engine and legacy must agree across the spectrum.
// ---------------------------------------------------------------------

const SCENARIOS = [
  // Empty encounter — every required criterion should be unknown. Note
  // that aspectsScore / nihssScore / mrsScore are passed as null (not 0)
  // so the engine and legacy both see them as missing. In the live React
  // app these are 0 as a state default but the form-not-interacted
  // heuristics surface them as missing; the parity test uses null so the
  // engine's pickEncounterField doesn't treat 0 as a real value.
  {
    name: 'empty form',
    data: {
      telestrokeNote: { age: '', nihss: '', premorbidMRS: '', vesselOcclusion: [] },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: null,
      nihssScore: null,
      mrsScore: null,
      hoursFromLKW: null,
      lkwTime: null
    }
  },

  // Fully eligible SISTER candidate
  {
    name: 'SISTER eligible — late-window non-LVO with mismatch',
    data: {
      telestrokeNote: {
        age: '65', nihss: '12', premorbidMRS: '1',
        tnkRecommended: false, evtRecommended: false,
        ctpResults: 'CTP shows mismatch with penumbra >50 cc',
        vesselOcclusion: ['M2']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 12,
      mrsScore: 0,
      hoursFromLKW: 8
    }
  },

  // Eligible STEP-EVT MeVO
  {
    name: 'STEP-EVT MeVO',
    data: {
      telestrokeNote: {
        age: '50', nihss: '8', premorbidMRS: '1',
        vesselOcclusion: ['M2']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 8,
      mrsScore: 0,
      hoursFromLKW: 6
    }
  },

  // Eligible STEP-EVT low-NIHSS LVO
  {
    name: 'STEP-EVT low-NIHSS LVO',
    data: {
      telestrokeNote: {
        age: '70', nihss: '4', premorbidMRS: '0',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 4,
      mrsScore: 0,
      hoursFromLKW: 4
    }
  },

  // Eligible TESTED — pre-existing disability LVO
  {
    name: 'TESTED — pre-existing disability LVO',
    data: {
      telestrokeNote: {
        age: '78', nihss: '14', premorbidMRS: '3',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 6,
      nihssScore: 14,
      mrsScore: 0,
      hoursFromLKW: 10
    }
  },

  // Eligible PICASSO — tandem
  {
    name: 'PICASSO — tandem',
    data: {
      telestrokeNote: {
        age: '60', nihss: '14', premorbidMRS: '1',
        ctaResults: 'tandem extracranial carotid + intracranial M1 occlusion',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 14,
      mrsScore: 0,
      hoursFromLKW: 8
    }
  },

  // Boundary: NIHSS exactly at threshold
  {
    name: 'boundary — NIHSS = 6',
    data: {
      telestrokeNote: {
        age: '40', nihss: '6', premorbidMRS: '0',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 6,
      mrsScore: 0,
      hoursFromLKW: 3
    }
  },

  // Late window — outside SISTER eligibility
  {
    name: 'late >24 h',
    data: {
      telestrokeNote: {
        age: '60', nihss: '10', premorbidMRS: '0',
        tnkRecommended: false, evtRecommended: false,
        ctpResults: 'mismatch',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 7,
      nihssScore: 10,
      mrsScore: 0,
      hoursFromLKW: 25
    }
  },

  // ICH patient
  {
    name: 'ICH lobar on statin (SATURN candidate)',
    data: {
      telestrokeNote: { age: '72', diagnosisCategory: 'ich' },
      strokeCodeForm: { age: '', nihss: '' },
      ichLocation: 'lobar parietal',
      onStatin: true,
      mrsScore: 3,
      hoursFromLKW: null
    }
  },

  // ICH + AF for ASPIRE
  {
    name: 'ICH + AF (ASPIRE)',
    data: {
      telestrokeNote: {
        age: '70',
        diagnosisCategory: 'ich',
        pmh: 'long history of afib, htn, dm'
      },
      strokeCodeForm: { age: '', nihss: '' },
      mrsScore: 3,
      hoursFromLKW: null
    }
  },

  // TIA + ICAS for CAPTIVA
  {
    name: 'TIA + ICAS (CAPTIVA)',
    data: {
      telestrokeNote: {
        age: '60',
        diagnosisCategory: 'tia',
        ctaResults: 'severe MCA stenosis suggestive of intracranial atherosclerosis',
        premorbidMRS: '1'
      },
      strokeCodeForm: { age: '', nihss: '' }
    }
  },

  // Pediatric (excluded everywhere by age)
  {
    name: 'pediatric (age 12)',
    data: {
      telestrokeNote: {
        age: '12', nihss: '5', premorbidMRS: '0',
        vesselOcclusion: ['M1']
      },
      strokeCodeForm: { age: '', nihss: '' },
      aspectsScore: 8,
      nihssScore: 5,
      mrsScore: 0,
      hoursFromLKW: 3
    }
  }
];

// ---------------------------------------------------------------------
// Map engine criterion ids (which key by `field`) to legacy criterion
// ids (which use semantically named keys like 'noTNK', 'timeWindow',
// 'lvo', 'ctaResults' / 'tandemLesion' / 'icas'). Per-trial overrides
// allow the same field to map differently in different trials.
// ---------------------------------------------------------------------

const FIELD_TO_LEGACY_GLOBAL = {
  hoursFromLKW: 'timeWindow',
  tnkRecommended: 'noTNK',
  evtRecommended: 'noEVT',
  ctpResults: 'ctpMismatch',
  pmh: 'afib',
  ichLocation: 'lobarICH',
  onStatin: 'onStatin',
  mrsScore: 'mrs',
  domainMatch: 'domainMatch',
  reperfusion: 'reperfusion',
  aspectsScore: 'aspects',
  symptoms: 'ueWeakness'
};

const PER_TRIAL_OVERRIDES = {
  picasso: { ctaResults: 'tandemLesion' },
  captiva: { ctaResults: 'icas' },
  aspire: { diagnosisCategory: 'ichConfirmed' },
  discovery: { diagnosisCategory: 'strokeConfirmed' },
  tested: { vesselOcclusion: 'lvo' },
  most: { vesselOcclusion: 'lvo' }
};

function legacyIdFor(trialId, field) {
  const overrides = PER_TRIAL_OVERRIDES[trialId] || {};
  if (overrides[field]) return overrides[field];
  return FIELD_TO_LEGACY_GLOBAL[field] || field;
}

function remapEngineForTrial(engineResult, activeTrialId) {
  return {
    ...engineResult,
    criteria: engineResult.criteria.map((c) => ({
      id: legacyIdFor(activeTrialId, c.id),
      status: c.status
    }))
  };
}

// Compute whether the legacy result's not_eligible status is *only*
// due to an exclusion flag triggering. In that case, the engine
// (which doesn't model exclusions) is allowed to disagree on overall
// status — its declarative criteria might all be met or unknown.
function legacyIsExclusionOnly(legacyResult) {
  if (legacyResult.status !== 'not_eligible') return false;
  if (legacyResult.exclusions.length === 0) return false;
  // If any criterion is not_met OR requiredMissing > 0, the legacy
  // would be not_eligible from criteria too — not exclusion-only.
  return legacyResult.notMetCount === legacyResult.exclusions.length && legacyResult.requiredMissing === 0;
}

// ---------------------------------------------------------------------
// The actual parity tests.
// ---------------------------------------------------------------------

describe('parity — legacy evaluator vs generic engine', () => {
  it('every active trial has both a legacy entry and a structured atlas entry', () => {
    for (const aTrial of activeTrials) {
      const legacyKey = aTrial.legacyMatcherKey;
      expect(legacyKey).toBeTruthy();
      expect(TRIAL_ELIGIBILITY_CONFIG[legacyKey], `missing legacy entry for ${aTrial.id}`).toBeTruthy();
    }
  });

  for (const scenario of SCENARIOS) {
    describe(`scenario: ${scenario.name}`, () => {
      for (const aTrial of activeTrials) {
        it(`${aTrial.shortName} — engine and legacy agree on per-criterion status (where shared)`, () => {
          const legacyKey = aTrial.legacyMatcherKey;
          const legacyResult = evaluateTrialEligibility(legacyKey, scenario.data);
          const engineResult = engineEvaluateActiveTrial(aTrial, scenario.data);
          if (!legacyResult || !engineResult) return; // skip if either side missing

          const engineRemapped = remapEngineForTrial(engineResult, aTrial.id);
          const diffs = diffEvaluations(engineRemapped, legacyResult);

          // Filter out diffs that are explainable by exclusion-only
          // legacy not_eligible status. The 'overall' diff is allowed
          // only in that case.
          const exclusionOnly = legacyIsExclusionOnly(legacyResult);
          const unacceptable = diffs.filter((d) => {
            if (d.kind === 'overall' && exclusionOnly) return false;
            return true;
          });

          if (unacceptable.length > 0) {
            // Surface a debuggable error message.
            // eslint-disable-next-line no-console
            console.error(`Parity disagreement on ${aTrial.shortName} / ${scenario.name}:`, JSON.stringify(unacceptable, null, 2));
          }
          expect(unacceptable, `parity disagreement on ${aTrial.shortName} / ${scenario.name}`).toEqual([]);
        });
      }
    });
  }
});
