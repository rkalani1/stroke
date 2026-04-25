// src/evidence/recommendations.js
// Guideline-grade recommendations referenced by Management drawers. Each
// recommendation has supportingClaimIds; the validator warns if a Class I
// recommendation is unsupported.

import { makeRecommendation } from './schema.js';

const lr = '2026-04-25';

export const recommendations = [
  makeRecommendation({
    id: 'rec-ich-bp-target',
    topic: 'ich-bp-management',
    setting: 'inpatient',
    text: 'In acute spontaneous ICH presenting within 6 h with SBP 150-220 mmHg, lowering systolic BP to a target of 140 mmHg using a smooth, sustained protocol within a care bundle is reasonable to improve functional outcome.',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    guidelineSource: 'AHA/ASA 2022 ICH Guideline; INTERACT3 (2023)',
    supportingClaimIds: ['cl-ich-bp-bundle'],
    caveats: [
      'Avoid abrupt large drops in BP (>60 mmHg) which may worsen outcomes.',
      'In patients with SBP >220 mmHg, the safety of aggressive lowering to 140 is less certain; use clinical judgment and continuous monitoring.',
      'Target is BP control as part of a bundle (BP + glucose + temperature + reversal); do not pursue BP target in isolation.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-ich-anticoag-reversal-fxa',
    topic: 'ich-anticoag-reversal',
    setting: 'inpatient',
    text: 'In factor Xa inhibitor-associated ICH within 15 hours of last dose, andexanet alfa is reasonable to achieve hemostatic efficacy when available; 4F-PCC is an alternative when andexanet is unavailable or contraindicated. Monitor for thrombotic complications.',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    guidelineSource: 'AHA/ASA 2022 ICH Guideline; ANNEXA-I (2024)',
    supportingClaimIds: ['cl-ich-andexanet-fxa'],
    caveats: [
      'ANNEXA-I demonstrated higher hemostatic efficacy with andexanet but more thrombotic complications vs usual care.',
      'Andexanet alfa is not indicated for edoxaban; for edoxaban, 4F-PCC remains primary.',
      'Reversal should not delay neurosurgical evaluation.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-ich-anticoag-reversal-warfarin',
    topic: 'ich-anticoag-reversal',
    setting: 'inpatient',
    text: 'In warfarin-associated ICH, give vitamin K 10 mg IV plus 4F-PCC dosed by INR/weight to rapidly reverse anticoagulation; FFP is an inferior alternative.',
    classOfRecommendation: 'I',
    levelOfEvidence: 'B-NR',
    guidelineSource: 'AHA/ASA 2022 ICH Guideline',
    supportingClaimIds: ['cl-ich-bp-bundle'],
    caveats: [
      'Vitamin K is required for sustained reversal; PCC alone is short-acting.',
      'FFP carries volume-overload risk and slower correction.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-late-window-ivt',
    topic: 'extended-window-ivt',
    setting: 'inpatient',
    text: 'In patients presenting 4.5-9 h from LKW or with wake-up stroke, IV thrombolysis (alteplase or tenecteplase 0.25 mg/kg) selected by perfusion or DWI-FLAIR mismatch is reasonable when EVT is not indicated or available.',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    guidelineSource: 'AHA/ASA 2026 AIS Guideline; ESO 2023',
    supportingClaimIds: ['cl-late-window-ivt-non-lvo', 'cl-tnk-late-window-non-lvo'],
    caveats: [
      'Imaging-based selection is required; unselected late-window thrombolysis is not supported (TWIST).',
      'Time from LKW remains a key safety determinant; TIMELESS extended TNK to 24 h with mismatch selection but the overall primary endpoint did not reach significance.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-tnk-first-line',
    topic: 'tnk-vs-alteplase',
    setting: 'inpatient',
    text: 'Tenecteplase 0.25 mg/kg (max 25 mg) is a reasonable alternative to alteplase 0.9 mg/kg for IV thrombolysis in eligible AIS within 4.5 h, particularly for patients with anticipated EVT.',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    guidelineSource: 'ESO 2023; AHA/ASA 2026',
    supportingClaimIds: ['cl-tnk-noninferior-alteplase'],
    caveats: [
      'Use TNK 0.25 mg/kg only; the 0.4 mg/kg dose was not non-inferior in EXTEND-IA TNK part 2.',
      'Local protocols may continue to favor alteplase; both are acceptable.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-evt-large-core',
    topic: 'evt-large-core',
    setting: 'inpatient',
    text: 'In patients with anterior-circulation LVO and ASPECTS 3-5 (or core 50-100 mL) within 24 h of LKW, EVT is recommended to improve functional outcome.',
    classOfRecommendation: 'I',
    levelOfEvidence: 'A',
    guidelineSource: 'AHA/ASA 2026 AIS Guideline',
    supportingClaimIds: ['cl-evt-large-core'],
    caveats: [
      'Pre-stroke mRS, life expectancy, and goals of care still inform shared decision-making.',
      'ASPECTS <3 was not adequately enrolled in the seminal RCTs and is a Class IIb area.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-dapt-minor-stroke',
    topic: 'dapt-minor-stroke',
    setting: 'inpatient',
    text: 'In patients with minor non-cardioembolic ischemic stroke (NIHSS ≤3 or ≤5 with disabling deficit) or high-risk TIA (ABCD² ≥4 or DWI+), dual antiplatelet therapy (aspirin plus clopidogrel for 21 days, or aspirin plus ticagrelor for 30 days) started within 24 h is recommended to reduce recurrent ischemic stroke at 90 days.',
    classOfRecommendation: 'I',
    levelOfEvidence: 'A',
    guidelineSource: 'AHA/ASA 2021 Secondary Prevention; CHANCE / POINT / THALES / INSPIRES',
    supportingClaimIds: ['cl-dapt-minor-stroke'],
    caveats: [
      'Bleeding risk increases with duration; do not extend DAPT beyond 21-30 days for this indication.',
      'INSPIRES extended the window to 72 h in eligible mild stroke / high-risk TIA.',
      'For CYP2C19 loss-of-function carriers, ticagrelor (CHANCE-2) is preferred over clopidogrel.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-af-early-anticoag',
    topic: 'af-anticoag-timing',
    setting: 'inpatient',
    text: 'In patients with AIS and atrial fibrillation, initiating DOAC anticoagulation within 4 days for minor stroke and 6-7 days for moderate-major stroke (per ELAN) is reasonable; severe stroke or hemorrhagic transformation risk warrants longer delay.',
    classOfRecommendation: 'IIa',
    levelOfEvidence: 'B-R',
    guidelineSource: 'AHA/ASA 2021 Secondary Prevention; ELAN (2023); TIMING (2022)',
    supportingClaimIds: ['cl-af-early-anticoag'],
    caveats: [
      'Confirm absence of significant hemorrhagic transformation on follow-up imaging before starting in moderate-large stroke.',
      'Trial timing is non-inferior, not always superior; individualize.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  }),

  makeRecommendation({
    id: 'rec-evt-late-window',
    topic: 'evt-late-window',
    setting: 'inpatient',
    text: 'In patients with anterior-circulation LVO presenting 6-24 h from LKW, EVT is recommended for those meeting DAWN or DEFUSE-3 imaging-selection criteria.',
    classOfRecommendation: 'I',
    levelOfEvidence: 'A',
    guidelineSource: 'AHA/ASA 2026 AIS Guideline; DAWN; DEFUSE-3',
    supportingClaimIds: ['cl-evt-late-window'],
    caveats: [
      'Outside trial-selection criteria, EVT is reasonable on a case-by-case basis with shared decision-making.'
    ],
    lastReviewed: lr,
    verificationStatus: 'verified-guideline'
  })
];

const byId = new Map(recommendations.map((r) => [r.id, r]));

export function getRecommendation(id) {
  return byId.get(id) || null;
}

export function getAllRecommendationIds() {
  return new Set(byId.keys());
}
