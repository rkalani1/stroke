// Six former phase groups, projected from the canonical screening profiles.
// Full stored criteria are shared with Database; only table-only studies are separate.
import { screenerTrials } from './screenerTrials.js';
export const PHASE_LABELS = {"acute": "Acute (Onset ≤ 24 Hours)", "inpatient": "Inpatient (Admission to Day 30)", "outpatient": "Outpatient (Day 14 Onward)"};
export const CATEGORY_LABELS = {"ischemic": "Ischemic Stroke", "ich": "Intracerebral Hemorrhage (ICH)"};
const tableOnly = {
  "PICASSO": {
    "acronym": "PICASSO",
    "nct": "NCT05611242",
    "status": "enrolling",
    "href": "https://clinicaltrials.gov/study/NCT05611242",
    "summary": "Acute carotid stenting versus non-stenting carotid angioplasty/aspiration, with intracranial treatment as applicable; confirm conflicting registry intracranial-occlusion wording.",
    "eligibility": [
      "Age 18–79, AIS within 16 h of LKW, NIHSS ≥ 4, pre-stroke mRS ≤ 2",
      "ASPECTS ≥ 7; if EVT starts >6–16 h from onset, also CTP core < 50 mL (rCBF < 30%) or DWI core < 25 mL",
      "Tandem lesion on CTA: extracranial ICA stenosis 70–100% + intracranial ICA-T / M1 / proximal M2",
      "Ineligible for IV thrombolysis or failed IV thrombolysis"
    ],
    "exclusions": [
      "Contraindication to antiplatelets, thrombolytics, or contrast; refractory BP > 185/110 mm Hg despite medication",
      "INR > 1.7, PTT > 3× normal, or platelets < 100,000/µL",
      "Intracranial hemorrhage, midline shift or mass effect on CT; acute bilateral strokes; carotid stenosis from dissection or vasculitis"
    ]
  },
  "CAPTIVA": {
    "acronym": "CAPTIVA",
    "nct": "NCT05047172",
    "status": "closed",
    "href": "https://clinicaltrials.gov/study/NCT05047172",
    "summary": "Ticagrelor+ASA vs clopidogrel+ASA in symptomatic 70–99% intracranial atherosclerosis. Closed to new enrollment (active-not-recruiting); the low-dose rivaroxaban (2.5 mg BID) arm was terminated in January 2026 (DSMB: safety events plus futility).",
    "eligibility": [
      "Age ≥ 30 (30–49 needs additional atherosclerotic risk criteria), ischemic stroke (infarct on imaging or symptoms ≥ 24 h) attributed to ICAS (70–99% stenosis or MRA flow gap)",
      "Within 30 days of qualifying event, mRS ≤ 4 at consent"
    ],
    "exclusions": [
      "Cardioembolic source (AF, valve)",
      "On full-dose anticoagulation"
    ]
  }
};
const groups = [
  {
    "id": "ischemic-acute",
    "category": "ischemic",
    "phase": "acute",
    "title": "Ischemic Stroke — Acute (Onset ≤ 24 Hours)",
    "trials": [
      "STEP",
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
      "ESUS-MRI",
      "MOCHA",
      "INTERCEPT",
      "CAPTIVA"
    ]
  },
  {
    "id": "ischemic-outpatient",
    "category": "ischemic",
    "phase": "outpatient",
    "title": "Ischemic Stroke — Outpatient (Day 14 to Month 6)",
    "trials": [
      "CLARITY",
      "ESUS-MRI",
      "MOCHA",
      "TELE-REHAB-2",
      "MR-PICS",
      "INTERCEPT"
    ]
  },
  {
    "id": "ich-acute",
    "category": "ich",
    "phase": "acute",
    "title": "Intracranial Hemorrhage (ICH) — Acute (Onset ≤ 24 Hours)",
    "trials": [
      "MINUTE",
      "SATURN"
    ]
  },
  {
    "id": "ich-inpatient",
    "category": "ich",
    "phase": "inpatient",
    "title": "Intracranial Hemorrhage (ICH) — Inpatient (Admission to Day 30)",
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
    "title": "Intracranial Hemorrhage (ICH) — Outpatient (Day 14 to Month 6)",
    "trials": [
      "ASPIRE",
      "TELE-REHAB-2",
      "CAPPRICORN-1"
    ]
  }
];

const profileByAcronym = new Map(screenerTrials.map(trial => [trial.acronym, trial]));
const referenceTrial = acronym => {
  if (tableOnly[acronym]) return { ...tableOnly[acronym], sourceDate: null };
  const profile = profileByAcronym.get(acronym === 'ESUS-MRI' ? 'ESUS' : acronym);
  if (!profile) throw new Error(`Missing trial reference profile: ${acronym}`);
  return {
    acronym, nct: profile.externalMetadata.nct || '', href: profile.externalMetadata.registryUrl || '',
    status: profile.status === 'placeholder' ? 'unverified' : profile.status,
    unverified: profile.status === 'placeholder', summary: profile.conciseBedsideSummary,
    eligibility: profile.exactInclusionCriteria, exclusions: profile.exactExclusionCriteria,
    sourceDate: profile.externalMetadata.verificationDate || null,
    sourceGaps: profile.sourceGaps
  };
};
export const eligibilityTables = groups.map(group => ({ ...group, trials: group.trials.map(referenceTrial) }));
export const ELIGIBILITY_COMPLIANCE_NOTE = 'These tables summarize dated first-pass ClinicalTrials.gov checks; they are not complete eligibility protocols. Confirm the current registry record, approved local study materials and local activation before referral.';
export default eligibilityTables;
