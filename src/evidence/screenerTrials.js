// src/evidence/screenerTrials.js
//
// Native port of the standalone stroke-trials-screener `trials` array.
// 16 synthetic, public-clean trial objects used by the bedside Trial Screener
// (src/components/TrialScreener.jsx) and the dual-eval engine
// (src/evidence/screener-eval.js).
//
// COMPLIANCE: every object is institution-clean — zero identifiers, every
// trial carries `noContactInfo: true`, pathways are generic ("Consult Stroke
// Research Coordinator …"), and the unverified studies (ESUS, MOCHA) are
// flagged `status: 'placeholder'` / `sourceCompletenessStatus:
// 'not_registry_verified'` so the engine blocks them from screening.

import trialsData from './screenerTrials.json' with { type: 'json' };

export const CTGOV_FIRST_PASS_NOTE =
  'First-pass ClinicalTrials.gov summary: not all registry criteria, protocol details, local activation requirements, or consent rules are encoded in this public demo.';

export const screenerTrials = trialsData;

export default screenerTrials;
