// src/evidence/eligibilityTables.js
//
// Structured data for the native <EligibilityTables/> reference view in the
// Trials tab. Ported from the standalone stroke-eligibility-tables-embed
// copy-paste reference document — the iframe it backed was replaced by a
// native React render.
//
// 6 phase-grouped tables: ischemic × {acute, inpatient, outpatient} and
// ICH × {acute, inpatient, outpatient}. Each table lists the trials active in
// that clinical window. Content is a first-pass ClinicalTrials.gov check, NOT a
// complete eligibility protocol — see COMPLIANCE_BANNER in EligibilityTables.jsx.
//
// Self-contained reference dataset. Overlaps with src/evidence/screenerTrials.js
// (same acronyms / NCTs) but does not contradict it. ESUS-MRI and MOCHA carry an
// explicit `unverified` flag — no ClinicalTrials.gov record was identified.
//
// Institution-clean: NO institutional identifiers. The v7 copy-as-HTML hexes
// (teal #0C7C8C header, gold #B07D24 accent) live in EligibilityTables.jsx — the
// source embed's institutional brand theme was intentionally dropped.

const CTGOV = (nct) => `https://clinicaltrials.gov/study/${nct}`;

// status: 'enrolling' | 'soon' | 'unverified'
// unverified: true marks trials with no ClinicalTrials.gov record (ESUS-MRI, MOCHA).

export const PHASE_LABELS = {
  acute: 'Acute (Onset ≤ 24 Hours)',
  inpatient: 'Inpatient (Admission to Day 30)',
  outpatient: 'Outpatient (Day 14 to Month 6)'
};

export const CATEGORY_LABELS = {
  ischemic: 'Ischemic Stroke',
  ich: 'Intracranial Hemorrhage (ICH)'
};

const UNVERIFIED_SUMMARY =
  'No ClinicalTrials.gov record identified in exact-title/acronym search; verify approved local source before use.';

// ── Trial definitions, keyed by acronym so the same trial can appear in multiple
//    phase tables without duplicating its summary/eligibility/exclusions text. ──
const TRIALS = {
  SISTER: {
    acronym: 'SISTER',
    nct: 'NCT05948566',
    status: 'enrolling',
    href: CTGOV('NCT05948566'),
    summary:
      'A Phase-2, prospective, randomized, placebo-controlled, blinded, dose-finding trial determining the safety and preliminary efficacy of TS23 (a monoclonal antibody against alpha-2-antiplasmin) in acute ischemic stroke.',
    eligibility: [
      'Anterior circulation acute ischemic stroke',
      'Within 4.5–24 hours of onset',
      'NIHSS ≥ 4',
      'ASPECTS ≥ 6 on CT or ≥ 7 on MRI, with favorable perfusion mismatch/core profile'
    ],
    exclusions: [
      'Received thrombolysis or EVT with clot engagement',
      'Known stroke in past 90 days',
      'Pre-stroke mRS > 2'
    ]
  },
  STEP: {
    acronym: 'STEP',
    nct: 'NCT06289985',
    status: 'enrolling',
    href: CTGOV('NCT06289985'),
    summary:
      'Randomized, multifactorial, adaptive, platform trial optimizing care for AIS due to large- or medium-vessel occlusions (LVOs and MVOs).',
    eligibility: [
      'Age ≥ 18, pre-stroke mRS 0–2, presentation ≤ 24 h, and arterial puncture ≤ 2 h from qualifying imaging',
      'LVO population: complete occlusion of intracranial ICA or M1 MCA, with mild deficits (NIHSS 0–5)',
      'MVO population: non-dominant or co-dominant M2 and M3 MCA occlusions, with NIHSS ≥ 8'
    ],
    exclusions: [
      'CT ASPECTS < 6 or MRI ASPECTS < 7',
      'Acute occlusions in multiple vascular territories or tandem occlusions'
    ]
  },
  VERIFY: {
    acronym: 'VERIFY',
    nct: 'NCT05338697',
    status: 'enrolling',
    href: CTGOV('NCT05338697'),
    summary:
      'Validating CNS structure/function measures (TMS motor evoked potentials and MRI lesion load) to establish early prognostic data for upper-extremity recovery outcomes.',
    eligibility: [
      'Unilateral symptomatic ischemic stroke with SAFE ≤ 8 upper-extremity motor deficit within 48–96 h',
      'Consented within 24–96 hours of LNW'
    ],
    exclusions: [
      'Pre-stroke upper-extremity condition limiting use',
      'Dense sensory loss (NIHSS score = 2) or seizure since onset'
    ]
  },
  TESTED: {
    acronym: 'TESTED',
    nct: 'NCT05911568',
    status: 'enrolling',
    href: CTGOV('NCT05911568'),
    summary:
      'A prospective, observational study for persons with a pre-stroke modified Rankin Scale (mRS) 3–4 experiencing an LVO-AIS, comparing the effectiveness of EVT to medical management.',
    eligibility: [
      'AIS presenting to hospital within 24 hours of onset',
      'Occlusion of ICA, M1, or dominant M2',
      'Pre-stroke mRS 3–4',
      'NIHSS ≥ 6',
      'Presenting CT ASPECTS ≥ 3 or MRI ASPECTS ≥ 4'
    ],
    exclusions: [
      'Terminal illness at time of stroke',
      'Pre-stroke functional status cannot be assessed during hospitalization',
      'Pre-stroke disability deemed temporary by investigator'
    ]
  },
  'SCOUTS-3': {
    acronym: 'SCOUTS-3',
    nct: 'NCT06722755',
    status: 'enrolling',
    href: CTGOV('NCT06722755'),
    summary:
      'Evaluating an intensive CPAP-support intervention to improve adherence and recovery in stroke survivors with obstructive sleep apnea (OSA) undergoing inpatient rehab.',
    eligibility: [
      'CT/MRI acute ischemic infarction within past 30 days',
      'Inpatient rehabilitation expected length of stay at least 5 nights'
    ],
    exclusions: [
      'Pregnancy, incarceration, ventilation/tracheostomy/O₂ > 4 L/min, or CPAP use within 14 days pre-stroke'
    ]
  },
  CLARITY: {
    acronym: 'CLARITY',
    nct: 'NCT07174414',
    status: 'soon',
    href: CTGOV('NCT07174414'),
    summary:
      'Phase 3 trial evaluating cilostazol for prevention of recurrent stroke after stroke or TIA in patients taking aspirin or clopidogrel, but not both.',
    eligibility: [
      'Stroke or TIA within 180 days',
      'Age ≥ 40 years',
      'Currently taking aspirin or clopidogrel, but not both'
    ],
    exclusions: [
      'Spontaneous brain bleed within the last 2 years',
      'Moderate to severe heart failure or life expectancy < 6 months'
    ]
  },
  'ESUS-MRI': {
    acronym: 'ESUS-MRI',
    nct: '',
    status: 'unverified',
    unverified: true,
    href: '',
    summary: UNVERIFIED_SUMMARY,
    eligibility: [
      'Acute ischemic stroke (ESUS, cardioembolic, or large artery)',
      'Scan possible within 6 months of stroke onset'
    ],
    exclusions: [
      'Age < 35 years or eGFR < 35',
      'Contraindication to gadolinium-contrast MRI'
    ]
  },
  MOCHA: {
    acronym: 'MOCHA',
    nct: '',
    status: 'unverified',
    unverified: true,
    href: '',
    summary: UNVERIFIED_SUMMARY,
    eligibility: [
      'Acute ischemic stroke of ESUS etiology',
      'Scan possible within 4 months of stroke onset'
    ],
    exclusions: [
      'Contraindication to MRI or history of bilateral carotid revascularization'
    ]
  },
  INTERCEPT: {
    acronym: 'INTERCEPT',
    nct: 'NCT05723926',
    status: 'enrolling',
    href: CTGOV('NCT05723926'),
    summary:
      'Bilateral carotid-filter study in patients with clinical AF and ischemic stroke with positive neuroimaging within 52 weeks; planned OAC is required.',
    eligibility: [
      'Ischemic stroke occurred within the past year',
      'Documented clinical AF with planned VKA/DOAC for trial duration',
      'Able to tolerate SAPT plus OAC; carotid anatomy meets protocol'
    ],
    exclusions: [
      'History of spontaneous ICH',
      '≥ 50% stenosis of carotid, subclavian, vertebral, or intracranial arteries'
    ]
  },
  'TELE-REHAB-2-IS': {
    acronym: 'TELE-REHAB-2',
    nct: 'NCT06682429',
    status: 'enrolling',
    href: CTGOV('NCT06682429'),
    summary:
      'Home telerehabilitation trial for upper-extremity motor outcomes after radiologically verified ischemic stroke or ICH.',
    eligibility: [
      'Radiologically verified ischemic stroke occurred 90–150 days prior',
      'Age 18–80 with ARAT 18–44, Box & Block affected arm ≥ 1, and self-signed consent/behavioral contract'
    ],
    exclusions: [
      'Pre-stroke mRS > 2',
      'Life expectancy < 9 months or recent botulinum toxin to paretic arm'
    ]
  },
  'MR-PICS': {
    acronym: 'MR-PICS',
    nct: 'NCT06506279',
    status: 'enrolling',
    href: CTGOV('NCT06506279'),
    summary:
      'Feasibility study assessing cortical stimulation via the CorTec Brain Interchange to induce neuroplasticity and improve motor-rehab outcomes.',
    eligibility: [
      'Ischemic cortical stroke occurred > 6 months prior',
      'Age 22–75 years with post-stroke mRS 3–4',
      'UEFM 25–45 with ≥ 30% corticospinal-pathway preservation and observable TMS motor output'
    ],
    exclusions: [
      'On therapeutic anticoagulation or history of seizure',
      'History of deep-vein thrombosis, pulmonary emboli, or spontaneous ICH'
    ]
  },
  MINUTE: {
    acronym: 'MINUTE',
    nct: 'NCT07260916',
    status: 'soon',
    href: CTGOV('NCT07260916'),
    summary:
      'Prospective, randomized trial evaluating the clinical utility of ultra-early SCUBA neuroendoscopic evacuation of basal-ganglia hemorrhages.',
    eligibility: [
      'Age 18–80 with pre-ICH mRS 0–2',
      'Non-traumatic spontaneous basal-ganglia hemorrhage ≥ 20 mL',
      'Randomization ≤ 16 hours from LKW; anticipated surgery start < 120 minutes from randomization',
      'NIHSS ≥ 6; CTA/MRA without underlying vascular lesion'
    ],
    exclusions: [
      'Suspected secondary cause, infratentorial/thalamic hemorrhage, or midbrain extension',
      'INR > 1.4, aPTT > 40 s, DOAC/LMWH use at onset, or platelet count < 100 × 10³/mm³',
      'GCS < 7, active infection, pregnancy, pre-existing DNR/DNI, or severe dementia'
    ]
  },

  'SCOUTS-3-ICH': {
    acronym: 'SCOUTS-3',
    nct: 'NCT06722755',
    status: 'enrolling',
    href: CTGOV('NCT06722755'),
    summary:
      'CPAP-support compliance and recovery assessment in patients with OSA undergoing inpatient rehabilitation.',
    eligibility: [
      'CT/MRI acute intraparenchymal hemorrhage within past 30 days',
      'Inpatient rehabilitation expected length of stay at least 5 nights'
    ],
    exclusions: [
      'Pregnancy, incarceration, ventilation/tracheostomy/O₂ > 4 L/min, or CPAP use within 14 days pre-stroke'
    ]
  },
  ASPIRE: {
    acronym: 'ASPIRE',
    nct: 'NCT03907046',
    status: 'enrolling',
    href: CTGOV('NCT03907046'),
    summary:
      'Evaluating whether apixaban is superior to aspirin for stroke prevention in patients with recent ICH and non-valvular atrial fibrillation.',
    eligibility: [
      'CT/MRI-confirmed ICH, including primary intraventricular hemorrhage',
      'Non-valvular atrial fibrillation (AF)',
      'Randomized within 14–180 days of onset'
    ],
    exclusions: [
      'Suspected secondary cause for ICH',
      'Earlier ICH within 12 months, active infective endocarditis, or clear ongoing indication for anticoagulant/antiplatelet therapy',
      'Creatinine ≥ 2.5 mg/dL, uncontrolled SBP ≥ 180 mm Hg, unsecured AVM, pregnancy, or allergy to aspirin/apixaban'
    ]
  },
  'TELE-REHAB-2-ICH': {
    acronym: 'TELE-REHAB-2',
    nct: 'NCT06682429',
    status: 'enrolling',
    href: CTGOV('NCT06682429'),
    summary:
      'Home telerehabilitation trial for upper-extremity motor outcomes after radiologically verified ischemic stroke or ICH.',
    eligibility: [
      'Radiologically verified ICH occurred 90–150 days prior',
      'Age 18–80 with ARAT 18–44, Box & Block affected arm ≥ 1, and self-signed consent/behavioral contract'
    ],
    exclusions: [
      'Pre-stroke mRS > 2',
      'Life expectancy < 9 months or recent botulinum toxin to paretic arm'
    ]
  },
  'CAPPRICORN-1': {
    acronym: 'CAPPRICORN-1',
    nct: 'NCT06393712',
    status: 'enrolling',
    href: CTGOV('NCT06393712'),
    summary: 'Randomized trial evaluating ALN-APP in patients with cerebral amyloid angiopathy (CAA).',
    eligibility: [
      'Sporadic CAA: age ≥ 50 with probable CAA by Boston Criteria Version 2.0',
      'Dutch-type CAA: age ≥ 30 with known E693Q APP mutation'
    ],
    exclusions: [
      "Moderate/severe Alzheimer's disease or cognitive impairment",
      'Previous clinical ICH with onset < 90 days before randomization',
      'ALT/AST > 3× ULN or eGFR < 30 mL/min/1.73 m²'
    ]
  }
};

/**
 * The 6 phase-grouped eligibility tables. Order within each table mirrors the
 * source reference document. Each entry references shared trial objects.
 */
export const eligibilityTables = [
  {
    id: 'ischemic-acute',
    category: 'ischemic',
    phase: 'acute',
    title: 'Ischemic Stroke — Acute (Onset ≤ 24 Hours)',
    trials: [TRIALS.SISTER, TRIALS.STEP]
  },
  {
    id: 'ischemic-inpatient',
    category: 'ischemic',
    phase: 'inpatient',
    title: 'Ischemic Stroke — Inpatient (Admission to Day 30)',
    trials: [
      TRIALS.VERIFY,
      TRIALS.TESTED,
      TRIALS['SCOUTS-3'],
      TRIALS.CLARITY,
      TRIALS['ESUS-MRI'],
      TRIALS.MOCHA,
      TRIALS.INTERCEPT
    ]
  },
  {
    id: 'ischemic-outpatient',
    category: 'ischemic',
    phase: 'outpatient',
    title: 'Ischemic Stroke — Outpatient (Day 14 to Month 6)',
    trials: [
      TRIALS.CLARITY,
      TRIALS['ESUS-MRI'],
      TRIALS.MOCHA,
      TRIALS['TELE-REHAB-2-IS'],
      TRIALS['MR-PICS'],
      TRIALS.INTERCEPT
    ]
  },
  {
    id: 'ich-acute',
    category: 'ich',
    phase: 'acute',
    title: 'Intracranial Hemorrhage (ICH) — Acute (Onset ≤ 24 Hours)',
    trials: [TRIALS.MINUTE]
  },
  {
    id: 'ich-inpatient',
    category: 'ich',
    phase: 'inpatient',
    title: 'Intracranial Hemorrhage (ICH) — Inpatient (Admission to Day 30)',
    trials: [TRIALS['SCOUTS-3-ICH'], TRIALS.ASPIRE]
  },
  {
    id: 'ich-outpatient',
    category: 'ich',
    phase: 'outpatient',
    title: 'Intracranial Hemorrhage (ICH) — Outpatient (Day 14 to Month 6)',
    trials: [TRIALS.ASPIRE, TRIALS['TELE-REHAB-2-ICH'], TRIALS['CAPPRICORN-1']]
  }
];

export const ELIGIBILITY_COMPLIANCE_NOTE =
  'Synthetic public demo — not for clinical decision-making. These tables summarize first-pass ClinicalTrials.gov checks; they are not complete eligibility protocols. Do not enter real patient identifiers or PHI. Confirm against the full ClinicalTrials.gov record and approved local study materials before clinical action.';

export default eligibilityTables;
