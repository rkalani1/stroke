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
//
// `check`, `matchedCriteriaText`, and `pendingCriteriaText` are kept as pure
// functions (public-clean, no DOM, no identifiers). They receive the resolved
// params object `p` built by the engine.

export const CTGOV_FIRST_PASS_NOTE =
  'First-pass ClinicalTrials.gov summary: not all registry criteria, protocol details, local activation requirements, or consent rules are encoded in this public demo.';

export const screenerTrials = [
  {
    acronym: 'SISTER',
    exactFullStudyName: 'Strategy for Improving Stroke Treatment Response',
    sourceHypothesisText:
      'A Phase-2, prospective, randomized, placebo-controlled, blinded, dose finding trial that aims to determine the safety and preliminary efficacy of TS23, a monoclonal antibody against the alpha-2 antiplasmin (a2-AP), in acute ischemic stroke.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov also requires favorable perfusion mismatch/core imaging and study drug within 120 minutes of qualifying perfusion imaging.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '4.5 – 24 hours',
    externalMetadata: {
      nct: 'NCT05948566',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05948566',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Evaluates TS23 mAb (anti-alpha-2-antiplasmin) in AIS presenting within 4.5-24h without thrombolysis or EVT clot engagement.',
    pathway: 'Consult Stroke Research Coordinator / On-Call Stroke Fellow',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Anterior circulation acute ischemic stroke',
      'Onset within 4.5-24 hours',
      'NIHSS ≥ 4',
      'ASPECTS 6 or more on CT or ASPECTS 7 or more on MRI',
      'Favorable perfusion imaging mismatch/core profile'
    ],
    exactExclusionCriteria: [
      'Received thrombolysis',
      'Received EVT with clot engagement',
      'Known stroke in past 90 days',
      'Pre stroke MRS > 2'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (!p.anteriorCirculation) errors.push('Requires anterior circulation stroke');
      if (p.onsetHours < 4.5 || p.onsetHours > 24) errors.push('LKW-to-treatment window not 4.5-24h');
      if (p.nihss < 4) errors.push('NIHSS < 4');
      if (p.aspects < 6) errors.push('CT ASPECTS < 6');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');
      if (p.exThrombolysis) errors.push('Excludes prior thrombolysis');
      if (p.exEvt) errors.push('Excludes prior EVT clot engagement');
      if (p.exStroke90d) errors.push('Excludes stroke in past 90 days');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.anteriorCirculation === true ? 'Anterior circulation confirmed' : '',
        p.onsetHours >= 4.5 && p.onsetHours <= 24 ? 'LKW-to-treatment in 4.5-24h window' : '',
        p.nihss >= 4 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 4)' : '',
        p.aspects >= 6 ? 'ASPECTS is ' + p.aspects + ' (meets ≥ 6)' : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm stroke is in the anterior circulation (anterior circulation stroke is required)',
        !p.exThrombolysis ? 'Confirm no prior thrombolysis administered' : '',
        !p.exEvt ? 'Confirm no prior EVT with clot engagement' : '',
        !p.exStroke90d ? 'Confirm no stroke in the past 90 days' : '',
        'Confirm favorable CT/MR perfusion mismatch/core criteria and study-drug timing per protocol'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'STEP',
    exactFullStudyName: 'StrokeNet Thrombectomy Endovascular Platform',
    sourceHypothesisText:
      'STEP is a Randomized, Multifactorial, Adaptive, Registry-leveraged, Platform trial that seeks to optimize the care of patients with acute ischemic stroke (AIS) due to large or medium vessel occlusions (LVOs and MVOs). The currently open domain looks to expand indication for EVT.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires presentation to the enrolling hospital within 24 hours and arterial puncture within 2 hours of qualifying imaging; this demo does not encode every STEP domain exclusion.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '⚡ EVT Window (≤ 24 hours)',
    externalMetadata: {
      nct: 'NCT06289985',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06289985',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Optimizes endovascular therapy for low NIHSS LVOs or non-dominant MVOs. Excludes dominant M2 branch.',
    pathway:
      'Consult Stroke Research Coordinator / On-Call Stroke Fellow or Endovascular Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Age 18 years or older and pre-stroke mRS 0-2',
      'Presentation to enrolling hospital within 24 hours and arterial puncture within 2 hours of qualifying imaging',
      'Branch 1: LVO patients with mild deficits/low NIHSS; NIHSS 0-5 and complete occlusion of the intracranial ICA or M1 MCA',
      'Branch 2: MVO/DMVO patients with non-dominant/co-dominant M2 or M3 occlusions; NIHSS ≥ 8'
    ],
    exactExclusionCriteria: [
      'CT ASPECT score <6',
      'Acute occlusions in multiple vascular territories',
      'Tandem occlusions'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.aspects < 6) errors.push('CT ASPECTS < 6 / MRI ASPECTS < 7');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');

      const isB1 = p.vessel === 'ica_m1' && p.nihss <= 5;
      const isB2 = p.vessel === 'm2_m3_nd' && p.nihss >= 8;

      if (!isB1 && !isB2) {
        errors.push(
          'Does not meet Branch 1 (NIHSS 0-5 + ICA/M1) or Branch 2 (NIHSS ≥ 8 + non-dominant/co-dominant M2/M3)'
        );
      }
      if (p.vessel === 'dominant_m2') errors.push('Excludes dominant M2 occlusion');
      if (p.vessel === 'dominant_m3') errors.push('Excludes dominant M3 occlusion');
      if (p.exMultipleTerritories) errors.push('Excludes acute occlusions in multiple vascular territories');
      if (p.exTandem) errors.push('Excludes tandem occlusions');
      return errors;
    },
    matchedCriteriaText: (p) => {
      const isB1 = p.vessel === 'ica_m1' && p.nihss !== 'unselected' && p.nihss <= 5;
      const isB2 = p.vessel === 'm2_m3_nd' && p.nihss !== 'unselected' && p.nihss >= 8;
      let branchMatchText = '';
      if (isB1) branchMatchText = 'Meets Branch 1 (Low NIHSS LVO: NIHSS 0-5 + ICA/M1)';
      else if (isB2) branchMatchText = 'Meets Branch 2 (Severe MVO: NIHSS ≥ 8 + non-dominant M2/M3)';

      return [
        'Ischemic Stroke classification selected',
        p.aspects !== 'unselected' && p.aspects >= 6
          ? 'ASPECTS is ' + p.aspects + ' (meets CT ≥ 6 threshold)'
          : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : '',
        branchMatchText
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exTandem ? 'Confirm no tandem occlusions' : '',
        !p.exMultipleTerritories ? 'Confirm no acute occlusions in multiple territories' : '',
        'Confirm vessel anatomy on CTA/MRA (no dominant M2/M3 branch)',
        'Confirm enrolling-hospital presentation and arterial puncture timing per STEP protocol'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'TESTED',
    exactFullStudyName:
      'Treatment with Endovascular Intervention for Stroke Patients with Existing Disability',
    sourceHypothesisText:
      'A prospective, observational study for persons with a pre-stroke mRS 3-4 experiencing an LVO-AIS, comparing the effectiveness of EVT to MMM.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'Assessment of pre-stroke disability during hospitalization and investigator determination that disability is not temporary are not encoded in this demo.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: 'Presentation ≤ 24 hours',
    externalMetadata: {
      nct: 'NCT05911568',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05911568',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Cohort study comparing EVT to Medical Management in LVO-AIS with pre-stroke mRS 3-4.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke presenting within 24 hours of onset',
      'Caused by occlusion of ICA, M1, or dominant M2',
      'mRS 3-4 for at least 3 months prior to stroke onset',
      'Presenting CT ASPECTS ≥ 3 or MRI ASPECTS ≥ 4',
      'NIHSS ≥ 6'
    ],
    exactExclusionCriteria: [
      'Terminal illness at time of stroke',
      'Assessment of pre-stroke functional status cannot be performed during the hospital stay',
      'Pre-stroke disability deemed temporary by the investigator'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.vessel !== 'ica_m1' && p.vessel !== 'dominant_m2')
        errors.push('Requires ICA, M1, or dominant M2 occlusion');
      if (p.preMrs !== 3 && p.preMrs !== 4) errors.push('Pre-stroke mRS must be exactly 3 or 4');
      if (p.nihss < 6) errors.push('NIHSS < 6');
      if (p.aspects < 3) errors.push('CT ASPECTS < 3 / MRI ASPECTS < 4');
      if (!p.presentedWithin24h) errors.push('Did not present within 24h of onset');
      if (p.exTerminalIllness) errors.push('Excludes terminal illness');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.vessel === 'ica_m1' || p.vessel === 'dominant_m2' ? 'Vessel is ' + p.vessel : '',
        p.preMrs === 3 || p.preMrs === 4 ? 'Pre-stroke mRS is ' + p.preMrs : '',
        p.nihss >= 6 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 6)' : '',
        p.aspects >= 3 ? 'ASPECTS is ' + p.aspects + ' (meets CT ≥ 3 threshold)' : '',
        p.presentedWithin24h === true ? 'Presented to study hospital within 24h of LKW' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient arrived at the facility within 24 hours of stroke onset (presented within 24h)',
        !p.exTerminalIllness ? 'Confirm no terminal illness' : '',
        'Confirm pre-stroke disability has been stable for at least 3 months',
        'Confirm pre-stroke functional status can be assessed during hospitalization and is not temporary'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'MINUTE',
    exactFullStudyName: 'Minimally Invasive Neuroendoscopic Ultra-Early Targeted ICH Evacuation',
    sourceHypothesisText:
      'A prospective, multi-center, randomized, controlled, blinded assessor, adaptive enrichment design, clinical trial to evaluate the utility of early/ultra-early SCUBA evacuation in patients with BGH and LKW-to-randomization time ≤ 16 hours.',
    status: 'soon',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov overall status as of 2026-05-28: NOT_YET_RECRUITING; listed study start date 2026-05-15.',
      'CT.gov also requires CTA/MRA without vascular lesion, expected surgery start <120 minutes from randomization, coagulation/lab review, goals-of-care consent, and other exclusions not fully encoded here.'
    ],
    timeCategory: 'hyperacute',
    enrollmentWindowText: '≤ 16 hours',
    externalMetadata: {
      nct: 'NCT07260916',
      registryUrl: 'https://clinicaltrials.gov/study/NCT07260916',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Ultra-early SCUBA endoscopic evacuation of basal ganglia hemorrhages (volume ≥ 20mL) within 16h.',
    pathway: 'Consult Stroke Research Coordinator / On-Call Neurosurgery Service',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Basal Ganglia hemorrhage ≥ 20mL',
      'Within 16 hours of last known well',
      'NIHSS ≥ 6',
      'Pre-ICH mRS 0-2',
      'Age 18-80 years',
      'CTA or MRA performed without an underlying vascular lesion',
      'Treating physician anticipates surgery can start <120 minutes from randomization'
    ],
    exactExclusionCriteria: [
      'Suspected secondary cause for ICH',
      'Infratentorial or thalamic hemorrhage',
      'Midbrain extension/involvement',
      'GCS score < 7 at presentation'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ich') errors.push('Requires ICH');
      if (p.ichLocation !== 'bg') errors.push('Requires deep Basal Ganglia location');
      if (p.volume !== 'bg_large') errors.push('Requires hematoma volume ≥ 20 mL');
      if (p.onsetHours > 16) errors.push('LKW-to-randomization > 16 hours');
      if (p.nihss < 6) errors.push('NIHSS < 6');
      if (p.gcs < 7) errors.push('GCS < 7');
      if (p.preMrs > 2) errors.push('Pre-ICH mRS > 2');
      if (p.age < 18 || p.age > 80) errors.push('Age must be 18-80 years');
      if (p.exSecondaryIch) errors.push('Excludes suspected secondary cause');
      if (p.exMidbrain) errors.push('Excludes midbrain extension');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'ICH classification selected',
        p.ichLocation === 'bg' ? 'Basal Ganglia location confirmed' : '',
        p.volume === 'bg_large' ? 'Volume ≥ 20mL confirmed' : '',
        p.onsetHours <= 16 ? 'LKW-to-randomization is ≤ 16h' : '',
        p.nihss >= 6 ? 'NIHSS is ' + p.nihss + ' (meets ≥ 6)' : '',
        p.gcs >= 7 ? 'GCS is ' + p.gcs + ' (meets ≥ 7)' : '',
        p.preMrs <= 2 ? 'Pre-ICH mRS is ' + p.preMrs + ' (meets ≤ 2)' : '',
        p.age >= 18 && p.age <= 80 ? 'Age is ' + p.age + ' (meets 18-80)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exSecondaryIch ? 'Confirm no secondary cause (AVM, aneurysm, tumor, SAH)' : '',
        !p.exMidbrain ? 'Confirm no midbrain extension/involvement' : '',
        'Confirm CTA/MRA shows no underlying vascular lesion, coagulation criteria are met, and surgical timing/goals-of-care criteria are satisfied'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'CLARITY',
    exactFullStudyName: 'Cilostazol for Prevention of Recurrent Stroke',
    sourceHypothesisText:
      'A Phase 3 randomized trial evaluating cilostazol for prevention of recurrent stroke in patients with stroke or TIA within 180 days who are taking aspirin or clopidogrel, but not both.',
    status: 'soon',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov overall status as of 2026-05-28: NOT_YET_RECRUITING; listed study start date 2026-08.',
      "Public CT.gov eligibility text for NCT07174414 does not state the older draft's stroke-subtype or TIA risk-score thresholds; those criteria are not used in this demo."
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 180 days',
    externalMetadata: {
      nct: 'NCT07174414',
      registryUrl: 'https://clinicaltrials.gov/study/NCT07174414',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Phase 3 trial of cilostazol in stroke or TIA within 180 days while taking aspirin or clopidogrel, but not both.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Stroke or TIA within 180 days',
      'Age ≥ 40 years',
      'Currently taking aspirin or clopidogrel, but not both'
    ],
    exactExclusionCriteria: [
      'Spontaneous brain hemorrhage within the last 2 years',
      'Moderate to severe heart failure',
      'Life expectancy < 6 months'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'tia') {
        errors.push('Requires Ischemic Stroke or TIA');
      }
      if (p.onsetDays > 180) errors.push('Stroke/TIA occurred > 180 days ago');
      if (p.age < 40) errors.push('Age < 40');
      if (!p.singleAntiplateletSoc) {
        errors.push('Requires standard-of-care single antiplatelet (Aspirin or Clopidogrel)');
      }
      if (p.exBrainBleed2y) errors.push('Excludes spontaneous brain hemorrhage within the last 2 years');
      if (p.exCongestiveHeartFailure)
        errors.push('Excludes moderate-to-severe heart failure / congestive heart failure');
      return errors;
    },
    matchedCriteriaText: (p) => {
      const isWithinOnset = p.onsetDays !== 'unselected' && p.onsetDays <= 180;
      let explanation = '';
      if ((p.classification === 'ischemic' || p.classification === 'tia') && isWithinOnset) {
        explanation = 'Matches the CT.gov event-window criterion: stroke or TIA within 180 days';
      }

      return [
        explanation,
        p.age !== 'unselected' && p.age >= 40 ? 'Age is ' + p.age + ' (meets ≥ 40)' : '',
        p.singleAntiplateletSoc === true ? 'Taking single antiplatelet (aspirin/clopidogrel)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        p.classification === 'unselected' ? 'Confirm event type is Ischemic Stroke or TIA' : '',
        p.singleAntiplateletSoc === 'unselected'
          ? 'Confirm patient is on aspirin or clopidogrel, but not both'
          : '',
        !p.exBrainBleed2y ? 'Confirm no spontaneous brain bleed in the past 2 years' : '',
        !p.exCongestiveHeartFailure ? 'Confirm no moderate/severe congestive heart failure' : '',
        'Wait for trial enrollment to officially open'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'INTERCEPT',
    exactFullStudyName:
      'Carotid Implants for PreveNtion of STrokE ReCurrEnce from Large Vessel Occlusion in Atrial Fibrillation Patients Treated with Oral Anticoagulation',
    sourceHypothesisText:
      'To assess the efficacy and safety of bilateral carotid filters as an adjunct to OAC in AF patients who suffered an ischemic stroke in the previous year.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires one of three OAC-at-index timing groups, planned VKA/DOAC use for the trial duration, SAPT plus OAC tolerability, and detailed bilateral carotid anatomy criteria not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 365 days',
    externalMetadata: {
      nct: 'NCT05723926',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05723926',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Bilateral carotid filters in patients with clinical AF and an ischemic stroke with positive neuroimaging within 52 weeks; planned OAC is required.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Documented history of clinical atrial fibrillation',
      'Ischemic stroke with positive neuroimaging within 52 weeks, in one of the CT.gov-defined OAC timing groups',
      'Planned VKA or DOAC use for the duration of the trial',
      'Able to tolerate single antiplatelet therapy plus OAC for 6 months',
      'Bilateral ultrasound or angiogram demonstrating protocol-defined carotid anatomy'
    ],
    exactExclusionCriteria: [
      'history of ICH',
      'Contraindication to additional single antiplatelet therapy for 6 months from randomization',
      '≥50% stenosis, or high-risk plaque of the common carotid, subclavian, vertebral, or intracranial arteries that has not been treated with a revascularization procedure'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic')
        errors.push('Requires ischemic stroke with positive neuroimaging (does not match TIA alone)');
      if (p.onsetDays > 365) errors.push('Stroke onset > 365 days ago');
      if (!p.afibHistory) errors.push('Requires clinical atrial fibrillation history');
      if (p.exPriorIchHistory) errors.push('Excludes history of ICH');
      if (p.exSaptContraindication) errors.push('Excludes patients with SAPT contraindication');
      if (p.exCarotidStenosis50)
        errors.push('Excludes carotid/vertebral/subclavian/intracranial stenosis ≥50%');
      if (p.exPregnancy) errors.push('Excludes pregnancy');
      if (p.exLifeExpectancy2y) errors.push('Excludes life expectancy < 2 years');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.onsetDays <= 365 ? 'Onset within past year' : '',
        p.afibHistory === true ? 'AFib history confirmed' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exPriorIchHistory ? 'Confirm no history of spontaneous ICH' : '',
        !p.exSaptContraindication
          ? 'Confirm patient can tolerate 6 months of add-on single antiplatelet'
          : '',
        !p.exCarotidStenosis50
          ? 'Confirm no untreated carotid/vertebral/intracranial stenosis ≥50%'
          : '',
        'Confirm CT.gov OAC timing group, planned VKA/DOAC duration, and bilateral carotid anatomy requirements'
      ].filter(Boolean);
    }
  },
  {
    acronym: 'ESUS',
    exactFullStudyName:
      'Qualitative model-based ESUS reclassification using cardiac and cerebral vessel wall MRI',
    sourceHypothesisText:
      'Use of a cardiac vessel wall MRI along with cerebellar vessel wall imaging can help to reclassify ESUS ischemic stroke patients into either cardioembolic or large artery atherosclerosis etiology using a qualitative model.',
    status: 'placeholder',
    sourceCompletenessStatus: 'not_registry_verified',
    sourceGaps: [
      'No matching ClinicalTrials.gov record was found from exact acronym/title searches on 2026-05-28; this local study cannot be registry-verified on the public demo without an NCT or approved source document.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 180 days',
    externalMetadata: { nct: '', registryUrl: '', verificationDate: '2026-05-28' },
    conciseBedsideSummary:
      'Local study summary is not ClinicalTrials.gov-verified; do not use this public demo to screen or refer until an approved source/NCT is attached.',
    pathway: 'Registry/source verification required before use',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke of ESUS, cardioembolic, or large artery atherosclerosis etiology',
      'able to get the scan within 6 months of stroke onset'
    ],
    exactExclusionCriteria: [
      'age less than 35',
      'eGFR < 35',
      'contraindication to MRI with gadolinium contrast',
      'surgery within 30 days prior to stroke onset'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.etiology !== 'esus' && p.etiology !== 'cardioembolic' && p.etiology !== 'laa') {
        errors.push('Etiology must be ESUS, cardioembolic, or LAA');
      }
      if (p.onsetDays > 180) errors.push('Scan cannot be completed within 6 months of onset');
      if (p.age < 35) errors.push('Age < 35');
      if (p.exEgfr35) errors.push('eGFR < 35');
      if (p.exMriContraindication) errors.push('Excludes MRI/gadolinium contraindications');
      if (p.exRecentSurgery30d) errors.push('Excludes surgery within 30 days prior to stroke onset');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.etiology === 'esus' || p.etiology === 'cardioembolic' || p.etiology === 'laa'
          ? 'Etiology matches: ' +
            p.etiology.toUpperCase() +
            ' (Trial accepts ESUS, Cardioembolic, or LAA to study reclassification)'
          : '',
        p.onsetDays <= 180 ? 'Scan feasible within 6 months of onset' : '',
        p.age >= 35 ? 'Age is ' + p.age + ' (meets ≥ 35)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exEgfr35 ? 'Confirm eGFR is ≥ 35 ml/min/1.73m²' : '',
        !p.exMriContraindication ? 'Confirm no MRI or gadolinium contrast contraindications' : '',
        !p.exRecentSurgery30d ? 'Confirm no surgery within 30 days prior to stroke onset' : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'MOCHA',
    exactFullStudyName:
      'Automated Intracranial Vessel Wall Analysis Pipeline for Multi-contrast Multi-platform Applications',
    sourceHypothesisText:
      'Use of intracranial vessel wall imaging along with other clinical findings can be used to identify etiology of ESUS patients using a qualitative model.',
    status: 'placeholder',
    sourceCompletenessStatus: 'not_registry_verified',
    sourceGaps: [
      'No matching ClinicalTrials.gov record was found from exact acronym/title searches on 2026-05-28; this local study cannot be registry-verified on the public demo without an NCT or approved source document.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '≤ 120 days',
    externalMetadata: { nct: '', registryUrl: '', verificationDate: '2026-05-28' },
    conciseBedsideSummary:
      'Local study summary is not ClinicalTrials.gov-verified; do not use this public demo to screen or refer until an approved source/NCT is attached.',
    pathway: 'Registry/source verification required before use',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Acute ischemic stroke of ESUS etiology',
      'able to receive the scan within 4 months of stroke onset'
    ],
    exactExclusionCriteria: [
      'Age less than 35',
      'eGFR < 35',
      'contraindication to MRI with gadolinium contrast',
      'history of bilateral carotid artery revascularization'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.etiology !== 'esus') errors.push('Requires ESUS etiology');
      if (p.onsetDays > 120) errors.push('Scan cannot be completed within 4 months of onset');
      if (p.age < 35) errors.push('Age < 35');
      if (p.exEgfr35) errors.push('eGFR < 35');
      if (p.exMriContraindication) errors.push('Excludes MRI/gadolinium contraindications');
      if (p.exBilateralCarotidRevasc)
        errors.push('Excludes history of bilateral carotid artery revascularization');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.etiology === 'esus' ? 'ESUS etiology confirmed' : '',
        p.onsetDays <= 120 ? 'Scan feasible within 4 months of onset' : '',
        p.age >= 35 ? 'Age is ' + p.age + ' (meets ≥ 35)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exEgfr35 ? 'Confirm eGFR is ≥ 35 ml/min/1.73m²' : '',
        !p.exMriContraindication ? 'Confirm no MRI or gadolinium contrast contraindications' : '',
        !p.exBilateralCarotidRevasc
          ? 'Confirm no history of bilateral carotid endarterectomy or stenting'
          : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'ASPIRE',
    exactFullStudyName:
      'Anticoagulation in Intracerebral Hemorrhage (ICH) Survivors for Stroke Prevention and Recovery',
    sourceHypothesisText:
      'A prospective, randomized, double blind clinical trial to determine if apixaban is superior to aspirin for prevention of the composite outcome of any stroke (hemorrhagic or ischemic) or death from any cause in patients with recent ICH and AF.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov includes renal, hepatic, hematologic, pregnancy, blood pressure, allergy, competing-trial, and AVM-security exclusions not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '14 – 180 days',
    externalMetadata: {
      nct: 'NCT03907046',
      registryUrl: 'https://clinicaltrials.gov/study/NCT03907046',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Apixaban vs Aspirin in patients with recent ICH (randomized 14-180 days post-onset) and non-valvular AFib.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology Service',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Intracerebral hemorrhage (ICH), including primary intraventricular hemorrhage, confirmed by brain CT or MRI',
      'non-valvular Afib',
      'can be randomized within 14-180 days of stroke onset'
    ],
    exactExclusionCriteria: [
      'Suspected secondary cause for ICH',
      'prior ICH within 12 months of index stroke',
      'clear indication for anticoagulation or antiplatelet therapy'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ich') errors.push('Requires ICH');
      if (!p.afibHistory) errors.push('Requires clinical atrial fibrillation history');
      if (p.onsetDays < 14 || p.onsetDays > 180) errors.push('LKW-to-randomization not 14-180 days');
      if (p.exSecondaryIch) errors.push('Excludes suspected secondary cause');
      if (p.exPriorIch12m) errors.push('Excludes prior ICH within 12 months');
      if (p.exClearAnticoagulationIndication)
        errors.push('Excludes patients with clear indication for OAC');
      if (p.exClearAntiplateletIndication)
        errors.push('Excludes patients with clear indication for antiplatelet');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'ICH classification selected',
        p.afibHistory === true ? 'AFib history confirmed' : '',
        p.onsetDays >= 14 && p.onsetDays <= 180 ? 'Onset within 14-180 days window' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        !p.exSecondaryIch ? 'Confirm no secondary cause (AVM, aneurysm, tumor, SAH)' : '',
        !p.exPriorIch12m ? 'Confirm no other ICH in past 12 months' : '',
        !p.exClearAnticoagulationIndication
          ? 'Confirm no mandatory indication for anticoagulation (e.g. mechanical valve, DVT/PE)'
          : '',
        !p.exClearAntiplateletIndication
          ? 'Confirm no mandatory indication for antiplatelets (e.g. recent coronary stent)'
          : ''
      ].filter(Boolean);
    }
  },

  {
    acronym: 'CAPPRICORN-1',
    exactFullStudyName: 'A Study to Investigate the Efficacy, Safety, and Tolerability of ALN-APP in Patients with CAA',
    sourceHypothesisText:
      'A randomized, double-blind, placebo-controlled, phase 2 trial to assess the safety and efficacy of intrathecally injected ALN-APP for treatment of patients with Cerebral Amyloid Angiopathy.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'This demo cannot distinguish sporadic CAA age >=50 from Dutch-type CAA age >=30 with E693Q APP mutation, and it does not encode ALT/AST, recent investigational agent, or amyloid-antibody exclusions.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: 'Chronic',
    externalMetadata: {
      nct: 'NCT06393712',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06393712',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Intrathecal ALN-APP in sporadic probable CAA or Dutch-type CAA; prior clinical ICH is not required by the public CT.gov inclusion criteria.',
    pathway: 'Consult Stroke Research Coordinator / Stroke Neurology',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Sporadic CAA: age ≥ 50 years and probable CAA per Boston Criteria Version 2.0',
      'Dutch-type CAA: age ≥ 30 years and known E693Q amyloid precursor protein (APP) mutation'
    ],
    exactExclusionCriteria: [
      "Moderate or severe Alzheimer's disease or significant cognitive impairment",
      'Previous clinical ICH with onset < 90 days before anticipated randomization',
      'ALT or AST > 3x upper limit of normal',
      'eGFR < 30 ml/min/1.73m²'
    ],
    check: (p) => {
      const errors = [];
      if (p.age < 30)
        errors.push('Age < 30 (requires ≥ 50 for sporadic CAA or ≥ 30 for Dutch-type CAA)');
      if (p.classification === 'ich' && p.onsetDays < 90)
        errors.push('Prior clinical ICH onset < 90 days before anticipated randomization');
      if (p.exSevereAphasiaCognitive)
        errors.push("Excludes moderate-to-severe cognitive impairment / Alzheimer's");
      if (p.exEgfr30) errors.push('eGFR < 30');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        p.age >= 30 ? 'Age is ' + p.age + ' (meets criteria)' : '',
        p.classification !== 'ich' || p.onsetDays >= 90
          ? 'No clinical ICH within 90 days identified in entered fields'
          : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm sporadic probable CAA by Boston Criteria Version 2.0 or Dutch-type CAA with known E693Q APP mutation',
        'Confirm no prior clinical ICH with onset < 90 days before randomization',
        !p.exSevereAphasiaCognitive
          ? "Confirm no moderate/severe cognitive impairment or Alzheimer's"
          : '',
        !p.exEgfr30 ? 'Confirm eGFR is ≥ 30 ml/min/1.73m²' : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'SCOUTS-3',
    exactFullStudyName: 'Stroke and CPAP Outcome Study 3',
    sourceHypothesisText:
      'Among stroke survivors with OSA undergoing inpatient rehabilitation, an intensive multimodal CPAP support intervention will improve CPAP adherence during rehabilitation and through 3 months post-randomization compared with standard support, potentially enhancing stroke recovery and reducing recurrent events.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires CT/MRI proof of acute ischemic infarction or intraparenchymal hemorrhage within 30 days and includes oxygen, aspiration-risk, sedative, surgery, and anticipated rehab length-of-stay exclusions not fully encoded here.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: '≤ 30 days',
    externalMetadata: {
      nct: 'NCT06722755',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06722755',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Among stroke survivors with OSA undergoing inpatient rehabilitation, intensive CPAP support compared with standard support.',
    pathway: 'EPIC Chat Stroke Rehab Team / Stroke Research Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Age >= 18',
      'Acute ischemic stroke or ICH within past 30 days',
      'Head CT or brain MRI demonstrating acute ischemic infarction or intraparenchymal hemorrhage within 30 days',
      'On or moving to inpatient rehabilitation with anticipated length of stay at least 5 nights',
      'Spanish or English speaking'
    ],
    exactExclusionCriteria: [
      'incarcerated',
      'pregnant',
      'mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min',
      'CPAP use within 14 days pre-CVA',
      'CVA related to tumor, vascular malformation, or SAH'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'ich') {
        errors.push('Requires Ischemic Stroke or ICH');
      }
      if (p.age < 18) errors.push('Age < 18');
      if (p.onsetDays > 30) errors.push('Stroke occurred > 30 days ago');
      if (p.rehab !== 'yes') {
        errors.push('Must have inpatient rehabilitation placement and expected length of stay ≥ 5 nights');
      }
      if (p.language !== 'english' && p.language !== 'spanish') {
        errors.push('Must be English or Spanish speaking');
      }
      if (p.exIncarcerated) errors.push('Excludes incarcerated patients');
      if (p.exPregnancy) errors.push('Excludes pregnant patients');
      if (p.exTrach)
        errors.push('Excludes mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min');
      if (p.exCpapUse14d) errors.push('Excludes prior CPAP use within 14 days pre-CVA');
      if (p.exSecondaryIchOrSah)
        errors.push('Excludes stroke related to tumor, vascular malformation, or SAH');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke or ICH classification selected',
        p.age >= 18 ? 'Age is ' + p.age + ' (meets ≥ 18)' : '',
        p.onsetDays <= 30 ? 'Onset within 30 days window' : '',
        p.rehab === 'yes' ? 'Inpatient rehabilitation placement confirmed' : '',
        p.language === 'english' || p.language === 'spanish' ? 'Language is English or Spanish' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient speaks English or Spanish',
        'Confirm inpatient rehabilitation placement and anticipated length of stay at least 5 nights',
        !p.exIncarcerated ? 'Confirm no prisoner/incarcerated status' : '',
        !p.exPregnancy ? 'Confirm not pregnant' : '',
        !p.exTrach
          ? 'Confirm no mechanical ventilation, tracheostomy, or supplemental oxygen > 4 L/min'
          : '',
        !p.exCpapUse14d ? 'Confirm no prior CPAP use within 14 days pre-stroke' : '',
        !p.exSecondaryIchOrSah
          ? 'Confirm stroke was not caused by tumor, vascular malformation, or SAH'
          : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'VERIFY',
    exactFullStudyName:
      'Validation of Early Prognostic Data for Recovery Outcome after Stroke for Future, Higher Yield Trials',
    sourceHypothesisText:
      'Patients have different UE outcomes depending on corticomotor system (CMS) function, measured as motor evoked potential (MEP) status with TMS, and on CMS structure, measured as acute lesion load with MRI. VERIFY will create the first multicenter, large-scale, prospective dataset of clinical, TMS, and MRI measures in the acute stroke time window.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires SAFE score <=8 within 48-96 hours, Day 90 in-person availability, and MRI/TMS contraindication screening not fully encoded here.'
    ],
    timeCategory: 'acute_subacute',
    enrollmentWindowText: '24 – 96 hours',
    externalMetadata: {
      nct: 'NCT05338697',
      registryUrl: 'https://clinicaltrials.gov/study/NCT05338697',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'TMS and MRI predictors of upper extremity recovery. Requires consent within 24-96h of LNW.',
    pathway: 'Consult Rehab Research Coordinator / Inpatient Rehab Team',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Unilaterally symptomatic acute ischemic stroke',
      'Motor deficits in the affected upper extremity with SAFE score ≤ 8 within 48-96 hours',
      'able to consent for themselves',
      'able to consent within 24-96 hours of LNW',
      'English or Spanish speaking'
    ],
    exactExclusionCriteria: [
      'Upper extremity condition that limited use prior to the enrolling stroke',
      'legally blind',
      'dense sensory loss of NIHSS=2',
      'symptomatic stroke within 30 days prior to enrolling event',
      'seizure since stroke onset',
      'MRI or TMS contraindication'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (!p.unilateralSymptomatic) errors.push('Requires unilateral symptomatic AIS');
      if (!p.exUeWeakness) errors.push('Requires upper extremity motor weakness');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.onsetHours < 24 || p.onsetHours > 96) errors.push('LKW-to-consent window not 24-96h');
      if (p.language !== 'english' && p.language !== 'spanish') {
        errors.push('Must be English or Spanish speaking');
      }
      if (p.exPriorUeCondition) errors.push('Excludes prior UE condition limiting use');
      if (p.exLegallyBlind) errors.push('Excludes legally blind patients');
      if (p.exDenseSensoryLoss) errors.push('Excludes dense sensory loss (NIHSS sensory=2)');
      if (p.exRecentStroke30d) errors.push('Excludes symptomatic stroke within 30 days prior');
      if (p.exSeizures) errors.push('Excludes seizure since stroke onset');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.unilateralSymptomatic === true ? 'Unilateral symptomatic AIS confirmed' : '',
        p.exUeWeakness === true ? 'Upper extremity motor deficit confirmed' : '',
        p.self_consent === true ? 'Patient able to self-consent' : '',
        p.onsetHours >= 24 && p.onsetHours <= 96 ? 'LKW-to-consent is in 24-96h window' : '',
        p.language === 'english' || p.language === 'spanish' ? 'Language is English or Spanish' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm unilateral symptomatic AIS',
        'Confirm patient speaks English or Spanish',
        'Confirm patient is able to self-consent',
        !p.exPriorUeCondition ? 'Confirm no prior upper extremity condition limiting use' : '',
        !p.exLegallyBlind ? 'Confirm not legally blind' : '',
        !p.exDenseSensoryLoss ? 'Confirm NIHSS sensory score is < 2 (not dense sensory loss)' : '',
        !p.exRecentStroke30d ? 'Confirm no symptomatic stroke in prior 30 days' : '',
        !p.exSeizures ? 'Confirm no seizures since stroke onset' : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'MR-PICS',
    exactFullStudyName: 'Motor Recovery through Plasticity-Inducing Cortical Stimulation',
    sourceHypothesisText:
      'To assess the safe use of the CorTec Brain Interchange for use in providing cortical stimulation for stroke rehabilitation studies and establishing the technical feasibility of delivering plasticity-inducing stimulation within stroke patients. We hope to use this preliminary safety and feasibility data to inform a potential future study to collect preliminary efficacy data regarding the use of stimulation-induced neuroplasticity to improve stroke rehabilitation motor functional outcomes',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires UEFM 25-45, at least 30% corticospinal pathway preservation on MRI, observable motor output to TMS, and additional surgical/device safety screening not fully encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '> 6 months',
    externalMetadata: {
      nct: 'NCT06506279',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06506279',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      'Invasive cortical stimulation in chronic stroke patients (stroke > 6 months prior, post-stroke mRS 3-4, available for 54 weeks).',
    pathway: 'Consult Rehab Research Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'History of ischemic cortical stroke at least 6 months prior',
      'ages 22-75',
      'Post-stroke mRS 3-4',
      'UEFM score 25-45 with upper limb impairment',
      'Minimum 30% corticospinal pathway preservation on MRI and observable upper-limb motor output to TMS',
      'available for duration of study period (54 weeks) for in person visits'
    ],
    exactExclusionCriteria: [
      'On anticoagulation',
      'history of DVT or pulmonary emboli',
      'history of seizure',
      'history of spontaneous ICH',
      'unable to consent for themselves'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic') errors.push('Requires Ischemic Stroke');
      if (p.onsetMonths < 6) errors.push('Requires chronic phase > 6 months post-stroke');
      if (p.age < 22 || p.age > 75) errors.push('Requires age 22-75');
      if (p.preMrs !== 3 && p.preMrs !== 4) errors.push('Current (post-stroke) mRS must be 3 or 4');
      if (!p.exUeWeakness) errors.push('Requires moderate unilateral upper extremity weakness');
      if (!p.availability_54w) errors.push('Requires availability for 54 weeks of visits');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.exAnticoagulation) errors.push('Excludes patients taking anticoagulants');
      if (p.exHistoryDvtPe) errors.push('Excludes history of DVT or pulmonary emboli');
      if (p.exSeizures) errors.push('Excludes history of seizures/epilepsy');
      if (p.exPriorIchHistory) errors.push('Excludes history of spontaneous ICH');
      if (p.exPregnancy) errors.push('Excludes pregnancy');
      if (p.exSevereSpasticity) errors.push('Excludes severe spasticity in target arm');
      if (p.exArmInjury) errors.push('Excludes arm fracture or orthopedic injury');
      if (p.exSevereAphasiaCognitive) errors.push('Excludes severe aphasia or cognitive impairment');
      if (p.exSevereClaustrophobia) errors.push('Excludes severe claustrophobia');
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke classification selected',
        p.onsetMonths >= 6 ? 'Stroke occurred > 6 months ago' : '',
        p.age >= 22 && p.age <= 75 ? 'Age is ' + p.age + ' (meets 22-75)' : '',
        p.preMrs === 3 || p.preMrs === 4 ? 'Current mRS is ' + p.preMrs : '',
        p.exUeWeakness === true ? 'Unilateral upper extremity weakness confirmed' : '',
        p.availability_54w === true ? 'Available for 54-week in-person visits' : '',
        p.self_consent === true ? 'Patient able to self-consent' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient is able to self-consent',
        'Confirm availability for 54 weeks of in-person follow-up visits',
        'Confirm UEFM 25-45, corticospinal pathway preservation, and TMS motor output requirements',
        !p.exAnticoagulation ? 'Confirm not on anticoagulants (DOAC/warfarin/heparin)' : '',
        !p.exHistoryDvtPe ? 'Confirm no history of DVT or pulmonary emboli' : '',
        !p.exSeizures ? 'Confirm no history of seizures or epilepsy' : '',
        !p.exPriorIchHistory ? 'Confirm no history of spontaneous ICH' : ''
      ].filter(Boolean);
    }
  },
  {
    acronym: 'TELE-REHAB-2',
    exactFullStudyName: 'Telerehabilitation in the home after stroke',
    sourceHypothesisText:
      'Adding a 6-week course of intensive Telerehabilitation to usual care after stroke results in superior functional outcomes compared to usual care alone.',
    status: 'enrolling',
    sourceCompletenessStatus: 'first_pass',
    sourceGaps: [
      CTGOV_FIRST_PASS_NOTE,
      'CT.gov requires ARAT 18-44, Box & Block affected arm >=1 block/60 seconds, ability to perform 3 exercise examples, and self-signed consent/behavioral contract; not all are encoded here.'
    ],
    timeCategory: 'subacute_chronic',
    enrollmentWindowText: '90 – 150 days',
    externalMetadata: {
      nct: 'NCT06682429',
      registryUrl: 'https://clinicaltrials.gov/study/NCT06682429',
      verificationDate: '2026-05-28'
    },
    conciseBedsideSummary:
      '6-week course of intensive home telerehabilitation in patients 90-150 days post-ischemic or hemorrhagic stroke.',
    pathway: 'Consult Rehab Coordinator',
    noContactInfo: true,
    exactInclusionCriteria: [
      'Ischemic stroke or ICH between 90-150 days prior to randomization',
      'age 18-80',
      'Action Research Arm Test score 18-44 at baseline',
      'Box & Block Test affected arm score ≥1 block in 60 seconds',
      'Able to perform all 3 rehabilitation exercise test examples',
      'Informed consent and behavioral contract signed by the subject; no surrogate consent'
    ],
    exactExclusionCriteria: [
      'mRS prior to stroke of >2',
      'a new stroke has occurred since index stroke',
      'a separate stroke occurred within 30 days prior to index stroke',
      'life expectancy < 9months',
      'botulinum toxin to the paretic arm received in the prior 3 months or expected by the 8-month visit'
    ],
    check: (p) => {
      const errors = [];
      if (p.classification !== 'ischemic' && p.classification !== 'ich') {
        errors.push('Requires Ischemic Stroke or ICH');
      }
      if (p.onsetDays < 90 || p.onsetDays > 150) errors.push('LKW-to-randomization not 90-150 days');
      if (p.age < 18 || p.age > 80) errors.push('Requires age 18-80');
      if (!p.exUeWeakness) errors.push('Requires moderate upper extremity weakness');
      if (!p.self_consent) errors.push('Patient must be able to self-consent');
      if (p.preMrs > 2) errors.push('Pre-stroke mRS > 2');
      if (p.exRecurrentStroke) errors.push('Excludes recurrent stroke since index stroke');
      if (p.exRecentStroke30d) errors.push('Excludes separate stroke within 30 days prior');
      if (p.exLifeExpectancy9m) errors.push('Excludes life expectancy < 9 months');
      if (p.exBotoxVns3m)
        errors.push(
          'Excludes botulinum toxin to the paretic arm within 3 months, or expected by the 8-month visit'
        );
      return errors;
    },
    matchedCriteriaText: (p) => {
      return [
        'Ischemic Stroke or ICH classification selected',
        p.onsetDays >= 90 && p.onsetDays <= 150 ? 'Onset within 90-150 days window' : '',
        p.age >= 18 && p.age <= 80 ? 'Age is ' + p.age + ' (meets 18-80)' : '',
        p.exUeWeakness === true ? 'Upper extremity weakness confirmed' : '',
        p.self_consent === true ? 'Patient able to self-consent' : '',
        p.preMrs <= 2 ? 'Pre-stroke mRS is ' + p.preMrs + ' (meets ≤ 2)' : ''
      ].filter(Boolean);
    },
    pendingCriteriaText: (p) => {
      return [
        'Confirm patient is able to self-consent',
        !p.exRecurrentStroke ? 'Confirm no recurrent stroke since the index stroke' : '',
        !p.exRecentStroke30d
          ? 'Confirm no separate stroke within 30 days prior to the index stroke'
          : '',
        !p.exLifeExpectancy9m ? 'Confirm life expectancy is ≥ 9 months' : '',
        !p.exBotoxVns3m
          ? 'Confirm no botulinum toxin to the paretic arm in prior 3 months or expected by the 8-month visit'
          : ''
      ].filter(Boolean);
    }
  }
];

export default screenerTrials;
