// src/evidence/activeTrials.js
//
// Active / recruiting trials. Migrated from the inline TRIAL_ELIGIBILITY_CONFIG
// in src/app.jsx so the matcher logic and the Trials tab UI read from a single
// structured source.
//
// matcherCriteria is a *declarative* mirror of the legacy keyCriteria. Live
// matching still happens in src/app.jsx (the encounter form holds state there);
// this file is the source of truth for what each criterion means and how it
// binds to encounter form fields. The legacyMatcherKey field maps each entry
// back to its key in TRIAL_ELIGIBILITY_CONFIG so refactors can find their way
// home.

import { makeActiveTrial } from './schema.js';

const lr = '2026-04-25';

export const activeTrials = [
  makeActiveTrial({
    id: 'sister',
    shortName: 'SISTER',
    fullName: 'Stroke Late Window Reperfusion with TS23 (Trial)',
    nctId: 'NCT05948566',
    phase: 'Phase 2',
    status: 'recruiting',
    topic: 'extended-window-ivt',
    briefDescription: 'TS23 (monoclonal antibody to α2-antiplasmin) for late thrombolysis in acute ischemic stroke patients presenting 4.5-24 h from last known well, with mismatch profile, who are NOT receiving TNK or EVT.',
    rationale: 'Tests whether late-window IV-only reperfusion can extend benefit to patients ineligible for EVT and outside the standard IVT window. Builds on signal from EXTEND/TIMELESS while focusing on the EVT-ineligible niche.',
    inclusionCriteria: [
      'Age ≥18 y',
      'Anterior-circulation AIS, NIHSS ≥4 (4-5 must be disabling)',
      '4.5-24 h from LKW',
      'ASPECTS ≥6 on CT (or ≥7 on MRI)',
      'CTP/PWI mismatch ratio >1.2, mismatch volume >10 mL, core <70 mL',
      'Pre-stroke mRS ≤2'
    ],
    exclusionCriteria: [
      'Receiving TNK or EVT',
      'Prior stroke <90 days',
      'Prior intracranial hemorrhage',
      'On anticoagulation with active drug effect'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'nihss', operator: '>=', value: 6, label: 'NIHSS ≥6 (or 4-5 disabling)' },
      { field: 'hoursFromLKW', operator: 'between', value: [4.5, 24], label: '4.5-24 h from LKW' },
      { field: 'tnkRecommended', operator: '==', value: false, label: 'No IV thrombolysis' },
      { field: 'evtRecommended', operator: '==', value: false, label: 'No EVT planned' },
      { field: 'aspectsScore', operator: '>=', value: 6, label: 'ASPECTS ≥6' },
      { field: 'premorbidMRS', operator: '<=', value: 2, label: 'Pre-stroke mRS ≤2' },
      { field: 'ctpResults', operator: 'present', value: ['mismatch', 'penumbra', 'salvageable'], label: 'CTP mismatch profile' }
    ],
    relatedCompletedTrialIds: ['extend', 'wake-up', 'timeless', 'trace-iii', 'twist'],
    link: 'https://clinicaltrials.gov/study/NCT05948566',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'SISTER'
  }),

  makeActiveTrial({
    id: 'step-evt',
    shortName: 'STEP-EVT',
    fullName: 'Stroke Therapy for Endovascular treatment Platform — Mild and MeVO',
    nctId: 'NCT06289985',
    phase: 'Adaptive Platform',
    status: 'recruiting',
    topic: 'evt-mevo',
    briefDescription: 'NIH StrokeNet adaptive platform optimizing EVT for mild stroke with LVO (NIHSS 0-5 + ICA/M1) and for medium / distal vessel occlusions (M2-M4, A1-A3, P1-P3).',
    rationale: 'ESCAPE-MeVO and DISTAL did not show routine benefit for isolated medium-vessel occlusion; STEP-EVT looks for selection rules that recover benefit in specific subgroups.',
    inclusionCriteria: [
      'Age ≥18 y',
      'AIS ≤24 h from LKW',
      'Pre-stroke mRS ≤2',
      'Low-NIHSS domain: NIHSS 0-5 with ICA or M1 occlusion and disabling symptoms; OR',
      'MeVO domain: M2/M3/M4, A1-A3, or P1-P3 occlusion with appropriate perfusion imaging'
    ],
    exclusionCriteria: [
      'Pregnancy',
      'Hemorrhage on imaging',
      'Large core (ASPECTS <3 or core >100 mL window-dependent)'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'hoursFromLKW', operator: '<=', value: 24, label: 'Within 24 h from LKW' },
      { field: 'premorbidMRS', operator: '<=', value: 2, label: 'Pre-stroke mRS ≤2' },
      { field: 'vesselOcclusion', operator: 'present', value: ['ICA', 'M1', 'M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'], label: 'LVO or MeVO present' },
      { field: 'domainMatch', operator: 'in', value: ['low-nihss-lvo', 'mevo'], label: 'Matches Low-NIHSS or MeVO domain' }
    ],
    relatedCompletedTrialIds: ['dawn', 'defuse-3'],
    link: 'https://clinicaltrials.gov/study/NCT06289985',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'STEP'
  }),

  makeActiveTrial({
    id: 'picasso',
    shortName: 'PICASSO',
    fullName: 'Tandem Lesion Endovascular Trial',
    nctId: 'NCT05611242',
    phase: 'Phase 3',
    status: 'recruiting',
    topic: 'tandem-lesions',
    briefDescription: 'Emergent carotid stenting plus EVT vs EVT alone for tandem extracranial-carotid + intracranial-LVO occlusions.',
    rationale: 'Tandem lesions were excluded from most pivotal EVT trials; the optimal management of the extracranial component is unresolved.',
    inclusionCriteria: [
      'Age 18-79 y',
      'AIS within 16 h of LKW',
      'NIHSS ≥4',
      'Pre-stroke mRS ≤2',
      'ASPECTS ≥7',
      'Tandem lesion on CTA (extracranial ICA stenosis 70-100% + intracranial ICA-T / M1 / proximal M2)'
    ],
    exclusionCriteria: [
      'No tandem on imaging',
      'Beyond 16 h window'
    ],
    matcherCriteria: [
      { field: 'age', operator: 'between', value: [18, 79], label: 'Age 18-79' },
      { field: 'hoursFromLKW', operator: '<=', value: 16, label: 'Within 16 h from LKW' },
      { field: 'nihss', operator: '>=', value: 4, label: 'NIHSS ≥4' },
      { field: 'premorbidMRS', operator: '<=', value: 2, label: 'Pre-stroke mRS 0-2' },
      { field: 'aspectsScore', operator: '>=', value: 7, label: 'ASPECTS ≥7' },
      { field: 'ctaResults', operator: 'present', value: ['tandem'], label: 'Tandem lesion present' }
    ],
    relatedCompletedTrialIds: [],
    link: 'https://clinicaltrials.gov/study/NCT05611242',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'PICASSO'
  }),

  makeActiveTrial({
    id: 'tested',
    shortName: 'TESTED',
    fullName: 'Thrombectomy in Stroke Patients with Pre-existing Disability',
    nctId: 'NCT05911568',
    phase: 'Comparative Effectiveness',
    status: 'recruiting',
    topic: 'evt-late-window',
    briefDescription: 'EVT vs medical therapy in patients with pre-existing disability (mRS 3-4) and acute LVO ischemic stroke.',
    rationale: 'Pivotal EVT RCTs largely excluded mRS 3-4 patients; routine denial of EVT in this population is not evidence-based.',
    inclusionCriteria: [
      'Age ≥18 y',
      'Pre-stroke mRS 3-4 for ≥3 months',
      'AIS due to ICA terminus, M1, or dominant M2 occlusion',
      'Within 24 h of LKW',
      'NIHSS ≥6',
      'ASPECTS ≥3 (CT) or ≥4 (MRI)'
    ],
    exclusionCriteria: [
      'Pre-stroke mRS 0-2 or 5-6',
      'Life expectancy <6 months from non-stroke condition'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'premorbidMRS', operator: 'between', value: [3, 4], label: 'Pre-stroke mRS 3-4' },
      { field: 'nihss', operator: '>=', value: 6, label: 'NIHSS ≥6' },
      { field: 'hoursFromLKW', operator: '<=', value: 24, label: 'Within 24 h from LKW' },
      { field: 'aspectsScore', operator: '>=', value: 3, label: 'ASPECTS ≥3' },
      { field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1', 'M2'], label: 'LVO present' }
    ],
    relatedCompletedTrialIds: ['select2', 'angel-aspect', 'rescue-japan-limit', 'tension'],
    link: 'https://clinicaltrials.gov/study/NCT05911568',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'TESTED'
  }),

  makeActiveTrial({
    id: 'verify',
    shortName: 'VERIFY',
    fullName: 'TMS / MRI Biomarkers for Upper-Extremity Motor Recovery',
    nctId: 'NCT05338697',
    phase: 'Observational',
    status: 'recruiting',
    topic: 'rehabilitation',
    briefDescription: 'Observational use of TMS and MRI biomarkers to predict upper-extremity motor recovery after AIS.',
    rationale: 'Could enable precision rehabilitation by matching therapy intensity to predicted recovery potential.',
    inclusionCriteria: [
      'Age ≥18 y',
      'AIS within 7 days of onset',
      'Upper-extremity weakness (shoulder abduction or finger extension MRC ≤4)'
    ],
    exclusionCriteria: [
      'Contraindications to TMS (implanted electronics, intracranial metal, seizures)',
      'Contraindications to MRI'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'symptoms', operator: 'present', value: ['arm', 'upper', 'hand', 'weakness'], label: 'Upper-extremity weakness' },
      { field: 'premorbidMRS', operator: '<=', value: 2, label: 'Pre-stroke mRS ≤2' }
    ],
    relatedCompletedTrialIds: [],
    link: 'https://clinicaltrials.gov/study/NCT05338697',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'VERIFY'
  }),

  makeActiveTrial({
    id: 'discovery',
    shortName: 'DISCOVERY',
    fullName: 'Cognitive Trajectories After Stroke',
    nctId: 'NCT04916210',
    phase: 'Observational',
    status: 'recruiting',
    topic: 'cognitive-trajectories',
    briefDescription: 'Multi-cohort observational study mapping cognitive trajectories and biomarkers after AIS, ICH, and SAH.',
    rationale: 'Identifies modifiable risk factors for post-stroke cognitive impairment.',
    inclusionCriteria: [
      'Age ≥18 y',
      'AIS, ICH, or SAH within 6 weeks',
      'Able to complete cognitive testing'
    ],
    exclusionCriteria: [
      'Pre-existing dementia'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'diagnosisCategory', operator: 'in', value: ['ischemic', 'ich', 'sah'], label: 'Stroke confirmed' }
    ],
    relatedCompletedTrialIds: [],
    link: 'https://clinicaltrials.gov/study/NCT04916210',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'DISCOVERY'
  }),

  makeActiveTrial({
    id: 'most',
    shortName: 'MOST',
    fullName: 'Multi-arm Optimization of Stroke Thrombolysis',
    nctId: 'NCT05326139',
    phase: 'Adaptive Platform',
    status: 'recruiting',
    topic: 'tnk-vs-alteplase',
    briefDescription: 'Adaptive platform testing TNK 0.40 mg/kg vs standard 0.25 mg/kg, plus nerinetide as neuroprotective adjunct to EVT.',
    rationale: 'EXTEND-IA TNK part 2 did not show non-inferiority of 0.40 vs 0.25 in EVT pathway, but adaptive platform allows multiple device/agent comparisons.',
    inclusionCriteria: [
      'Age ≥18 y',
      'AIS with LVO (ICA/M1)',
      'IVT-eligible',
      'Within 4.5 h of LKW',
      'Pre-stroke mRS 0-1'
    ],
    exclusionCriteria: [
      'Anticoagulation with active drug effect',
      'Hemorrhage on CT'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'nihss', operator: '>=', value: 6, label: 'NIHSS ≥6' },
      { field: 'hoursFromLKW', operator: '<', value: 4.5, label: 'Within 4.5 h from LKW' },
      { field: 'vesselOcclusion', operator: 'in', value: ['ICA', 'M1'], label: 'LVO confirmed (ICA/M1)' },
      { field: 'premorbidMRS', operator: '<=', value: 1, label: 'Pre-stroke mRS 0-1' }
    ],
    relatedCompletedTrialIds: ['act', 'trace-2', 'original'],
    link: 'https://clinicaltrials.gov/study/NCT05326139',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'MOST'
  }),

  makeActiveTrial({
    id: 'captiva',
    shortName: 'CAPTIVA',
    fullName: 'Comparison of Antithrombotic Treatments in Intracranial Atherosclerosis',
    nctId: 'NCT05047172',
    phase: 'Phase 3',
    status: 'recruiting',
    topic: 'icas-prevention',
    briefDescription: 'Three-arm trial of ticagrelor+ASA vs low-dose rivaroxaban+ASA vs clopidogrel+ASA in symptomatic 70-99% intracranial atherosclerosis.',
    rationale: 'Recurrent stroke risk on standard DAPT for symptomatic ICAS is 12-20% at 1 year; alternative regimens are needed.',
    inclusionCriteria: [
      'Age ≥30 y',
      'Ischemic stroke or TIA attributed to ICAS',
      'Within 21 days of qualifying event',
      'Pre-stroke mRS ≤3'
    ],
    exclusionCriteria: [
      'Cardioembolic source (AF, valve)',
      'On full-dose anticoagulation'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 30, label: 'Age ≥30' },
      { field: 'diagnosisCategory', operator: 'in', value: ['ischemic', 'tia'], label: 'Ischemic stroke or TIA' },
      { field: 'ctaResults', operator: 'present', value: ['stenosis', 'intracranial', 'icas', 'atheroscler'], label: 'Intracranial stenosis 70-99%' },
      { field: 'premorbidMRS', operator: '<=', value: 3, label: 'mRS ≤3' }
    ],
    relatedCompletedTrialIds: ['chance', 'point', 'thales'],
    link: 'https://clinicaltrials.gov/study/NCT05047172',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'CAPTIVA'
  }),

  makeActiveTrial({
    id: 'rhapsody',
    shortName: 'RHAPSODY',
    fullName: '3K3A-APC for Neuroprotection in AIS',
    nctId: 'NCT04953325',
    phase: 'Phase 3',
    status: 'recruiting',
    topic: 'acute-ischemic-stroke',
    briefDescription: '3K3A-APC (activated protein C variant) given as adjunctive neuroprotection after IVT and/or EVT in moderate-severe AIS.',
    rationale: 'Phase 2 signal: reduced ICH and improved outcomes when added to standard reperfusion.',
    inclusionCriteria: [
      'Age ≥18 y',
      'NIHSS ≥5',
      'Received IVT and/or EVT',
      'Within 15 h of LKW',
      'Pre-stroke mRS 0-2'
    ],
    exclusionCriteria: [
      'Symptomatic ICH'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'nihss', operator: '>=', value: 5, label: 'NIHSS ≥5' },
      { field: 'reperfusion', operator: '==', value: true, label: 'Received IVT and/or EVT' },
      { field: 'hoursFromLKW', operator: '<=', value: 15, label: 'Within 15 h from LKW' },
      { field: 'premorbidMRS', operator: '<=', value: 2, label: 'Pre-stroke mRS 0-2' }
    ],
    relatedCompletedTrialIds: [],
    link: 'https://clinicaltrials.gov/study/NCT04953325',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'RHAPSODY'
  }),

  makeActiveTrial({
    id: 'saturn',
    shortName: 'SATURN',
    fullName: 'Statins for Intracerebral Hemorrhage',
    nctId: 'NCT03936361',
    phase: 'Phase 3',
    status: 'recruiting',
    topic: 'ich-secondary-prevention',
    briefDescription: 'Continuation vs discontinuation of statins after lobar ICH.',
    rationale: 'Lobar ICH raises concern for amyloid angiopathy; statin association with recurrent ICH risk versus cardiovascular benefit is unresolved.',
    inclusionCriteria: [
      'Age ≥50 y',
      'Spontaneous lobar ICH',
      'On statin for ≥1 month at ICH onset',
      'mRS ≤4 at randomization'
    ],
    exclusionCriteria: [
      'Deep / non-lobar ICH',
      'Recent MI <3 months'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 50, label: 'Age ≥50' },
      { field: 'ichLocation', operator: 'present', value: ['lobar', 'cortical'], label: 'Lobar ICH location' },
      { field: 'onStatin', operator: '==', value: true, label: 'On statin at ICH onset' },
      { field: 'mrsScore', operator: '<=', value: 4, label: 'mRS ≤4' }
    ],
    relatedCompletedTrialIds: ['interact3', 'enrich'],
    link: 'https://clinicaltrials.gov/study/NCT03936361',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'SATURN'
  }),

  makeActiveTrial({
    id: 'aspire',
    shortName: 'ASPIRE',
    fullName: 'Apixaban vs Aspirin Post-ICH in AF',
    nctId: 'NCT03907046',
    phase: 'Phase 3',
    status: 'recruiting',
    topic: 'af-after-ich',
    briefDescription: 'Apixaban vs aspirin for stroke prevention 14-180 days after ICH in atrial fibrillation.',
    rationale: 'After ICH, the trade-off between thromboembolic protection and recurrent ICH risk is unresolved; ASPIRE directly compares apixaban to aspirin.',
    inclusionCriteria: [
      'Age ≥18 y',
      'Spontaneous ICH',
      'Non-valvular AF, CHA₂DS₂-VASc ≥2',
      '14-180 days post-ICH',
      'mRS ≤4'
    ],
    exclusionCriteria: [
      'Mechanical heart valve'
    ],
    matcherCriteria: [
      { field: 'age', operator: '>=', value: 18, label: 'Age ≥18' },
      { field: 'diagnosisCategory', operator: '==', value: 'ich', label: 'ICH confirmed' },
      { field: 'pmh', operator: 'present', value: ['afib', 'atrial fib', 'af ', 'a-fib'], label: 'Atrial fibrillation' },
      { field: 'mrsScore', operator: '<=', value: 4, label: 'mRS ≤4' }
    ],
    relatedCompletedTrialIds: ['averroes', 'artesia'],
    link: 'https://clinicaltrials.gov/study/NCT03907046',
    lastReviewed: lr,
    verificationStatus: 'verified-clinicaltrials-gov',
    legacyMatcherKey: 'ASPIRE'
  })
];

const byId = new Map(activeTrials.map((t) => [t.id, t]));

export function getActiveTrial(id) {
  return byId.get(id) || null;
}

export function getActiveTrialByLegacyKey(key) {
  return activeTrials.find((t) => t.legacyMatcherKey === key) || null;
}

export function getAllActiveTrialIds() {
  return new Set(byId.keys());
}
