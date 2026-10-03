// src/evidence/screenerTrials.js
//
// Canonical study profiles used by the bedside Trial Screener
// (src/components/TrialScreener.jsx), the criteria tables and the study
// database, and evaluated by the pure engine in src/evidence/screener-eval.js.
//
// COMPLIANCE: every object is institution-clean — zero identifiers, every
// trial carries `noContactInfo: true`, pathways are generic ("Consult Stroke
// Research Coordinator …"), and `localActivationStatus` is never asserted.
// Profiles flagged `referenceOnly` (criteria-table/Database references) and
// profiles that are not enrolling are never offered as screening candidates.

import trialsData from './screenerTrials.json' with { type: 'json' };

export const CTGOV_FIRST_PASS_NOTE =
  'First-pass ClinicalTrials.gov summary: not all registry criteria, protocol details, local activation requirements, or consent rules are encoded in this screening summary.';

export const screenerTrials = trialsData;

export default screenerTrials;
