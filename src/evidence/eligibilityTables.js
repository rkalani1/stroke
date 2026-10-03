// Six phase groups, projected from the canonical study profiles. Full stored
// criteria are shared with Database; reference-only profiles (not screened)
// appear here when recruiting. Profiles that are not enrolling are Database-only.
import { screenerTrials } from './screenerTrials.js';
export const PHASE_LABELS = {"acute": "Acute (Onset ≤ 24 Hours)", "inpatient": "Inpatient (Admission to Day 30)", "outpatient": "Outpatient (Day 14 Onward)"};
export const CATEGORY_LABELS = {"ischemic": "Ischemic Stroke", "ich": "Intracerebral Hemorrhage (ICH)"};
const groups = [
  {
    "id": "ischemic-acute",
    "category": "ischemic",
    "phase": "acute",
    "title": "Ischemic Stroke — Acute (Onset ≤ 24 Hours)",
    "trials": [
      "STEP",
      "SISTER",
      "PICASSO"
    ]
  },
  {
    "id": "ischemic-inpatient",
    "category": "ischemic",
    "phase": "inpatient",
    "title": "Ischemic Stroke — Inpatient (Admission to Day 30)",
    "trials": [
      "VERIFY",
      "TESTED",
      "SCOUTS-3",
      "CLARITY",
      "INTERCEPT"
    ]
  },
  {
    "id": "ischemic-outpatient",
    "category": "ischemic",
    "phase": "outpatient",
    "title": "Ischemic Stroke — Outpatient (Day 14 Onward)",
    "trials": [
      "CLARITY",
      "TELE-REHAB-2",
      "MR-PICS",
      "INTERCEPT"
    ]
  },
  {
    "id": "ich-acute",
    "category": "ich",
    "phase": "acute",
    "title": "Intracerebral Hemorrhage (ICH) — Acute (Onset ≤ 24 Hours)",
    "trials": [
      "FASTEST-2",
      "MINUTE",
      "SATURN"
    ]
  },
  {
    "id": "ich-inpatient",
    "category": "ich",
    "phase": "inpatient",
    "title": "Intracerebral Hemorrhage (ICH) — Inpatient (Admission to Day 30)",
    "trials": [
      "SATURN",
      "SCOUTS-3",
      "ASPIRE"
    ]
  },
  {
    "id": "ich-outpatient",
    "category": "ich",
    "phase": "outpatient",
    "title": "Intracerebral Hemorrhage (ICH) — Outpatient (Day 14 Onward)",
    "trials": [
      "ASPIRE",
      "TELE-REHAB-2"
    ]
  }
];

const profileByAcronym = new Map(screenerTrials.map(trial => [trial.acronym, trial]));
const referenceTrial = acronym => {
  const profile = profileByAcronym.get(acronym);
  if (!profile) throw new Error(`Missing trial reference profile: ${acronym}`);
  if (!['enrolling', 'soon'].includes(profile.status)) throw new Error(`Criteria tables list enrolling profiles only: ${acronym}`);
  return {
    acronym, nct: profile.externalMetadata.nct || '', href: profile.externalMetadata.registryUrl || '',
    status: profile.status, referenceOnly: Boolean(profile.referenceOnly), summary: profile.conciseBedsideSummary,
    eligibility: profile.exactInclusionCriteria, exclusions: profile.exactExclusionCriteria,
    sourceDate: profile.externalMetadata.verificationDate || null,
    phase: profile.externalMetadata.phase || null, studyType: profile.externalMetadata.studyType || null,
    sourceGaps: profile.sourceGaps
  };
};
export const eligibilityTables = groups.map(group => ({ ...group, trials: group.trials.map(referenceTrial) }));
export const ELIGIBILITY_COMPLIANCE_NOTE = 'These tables summarize dated first-pass ClinicalTrials.gov checks; they are not complete eligibility protocols. Confirm the current registry record, approved local study materials and local activation before referral.';
export default eligibilityTables;
