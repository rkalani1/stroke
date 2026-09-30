import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HintsSimulator } from './simulators/HintsSimulator.jsx';
import { PupillometrySimulator } from './simulators/PupillometrySimulator.jsx';
import { SubTabs as V7SubTabs } from './design/primitives.jsx';
import { LandmarkTrialsCard } from './teaching.jsx';
import { InteractiveImageLightbox, VisualAssetFigure } from './components.jsx';
import {
  completedTrials as evidenceCompletedTrials,
  recommendations as evidenceRecommendations,
  topics as evidenceTopics,
  resolveClaimsWithCitations,
  filterCompletedTrials,
  citationLink,
  topicLabel,
  activeTrials as evidenceActiveTrials,
  resolveCitations,
  VERIFICATION_STATUS_LABELS,
  CERTAINTY_LABELS,
  EVIDENCE_TYPE_LABELS
} from './evidence/index.js';

import { GUIDELINE_LIBRARY, GUIDELINE_LIBRARY_INDEX } from './guideline-library.js';

// =====================================================================
// ERROR BOUNDARY FOR SIMULATORS
// =====================================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Simulator ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-crit-300 bg-crit-50 text-crit-900 rounded-lg dark:bg-crit-950 dark:text-crit-300 dark:border-crit-800">
          <h3 className="font-bold text-sm">Failed to load simulator</h3>
          <p className="text-xs mt-1">An error occurred while rendering this interactive tool.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// =====================================================================
// GUIDELINE LIBRARY & SEARCH HELPERS
// =====================================================================

const GUIDELINE_CLASS_COLORS = {
  I: 'bg-ok-600 text-white',
  IIa: 'bg-cobalt-500 text-white dark:bg-cobalt-700',
  IIb: 'bg-warn-700 text-white',
  III: 'bg-crit-600 text-white',
  Statement: 'bg-slate-500 text-white'
};

const guidelineQuickActions = [
  { id: 'tnk', label: 'TNK dosing', regex: /\b(tnk|tenecteplase)\b/i, target: { tab: 'encounter' } },
  { id: 'evt', label: 'EVT criteria', regex: /\b(evt|thrombectomy|endovascular)\b/i, target: { tab: 'management', subTab: 'ischemic' } },
  { id: 'ich', label: 'ICH protocol', regex: /\b(ich|intracerebral hemorrhage)\b/i, target: { tab: 'management', subTab: 'ich' } },
  { id: 'nihss', label: 'NIHSS', regex: /\bnihss\b/i, target: { tab: 'encounter' } },
  { id: 'aspects', label: 'ASPECTS', regex: /\baspects\b/i, target: { tab: 'encounter' } },
  { id: 'gcs', label: 'GCS', regex: /\b(gcs|glasgow)\b/i, target: { tab: 'research', subTab: 'calculators' } },
  { id: 'abcd2', label: 'ABCD²', regex: /\babcd2\b/i, target: { tab: 'research', subTab: 'calculators' } },
  { id: 'chads', label: 'CHA₂DS₂-VASc', regex: /\b(cha2ds2|chads)\b/i, target: { tab: 'research', subTab: 'calculators' } },
  { id: 'hasbled', label: 'HAS-BLED', regex: /\bhas[- ]?bled\b/i, target: { tab: 'research', subTab: 'calculators' } },
  { id: 'doac', label: 'DOAC timing', regex: /\b(apixaban|rivaroxaban|dabigatran|edoxaban|doac)\b/i, target: { tab: 'management', subTab: 'ischemic' } }
];

const getGuidelineQuickActions = (text) => {
  if (!text) return [];
  const actions = [];
  guidelineQuickActions.forEach((action) => {
    if (action.regex.test(text)) actions.push(action);
  });
  return actions;
};

const fuzzyScore = (query, target) => {
  if (!query || !target) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 100;
  let score = 0;
  if (t.startsWith(q)) score += 40;
  if (t.includes(q)) score += 25;
  let ti = 0;
  for (let qi = 0; qi < q.length; qi += 1) {
    const idx = t.indexOf(q[qi], ti);
    if (idx === -1) continue;
    score += idx === ti ? 4 : 1;
    ti = idx + 1;
  }
  return score;
};

const rankText = (query, parts = []) => {
  return parts.reduce((sum, part) => sum + fuzzyScore(query, part), 0);
};

const emailDocument = (title, url) => {
  const fullUrl = window.location.origin + window.location.pathname + url;
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(fullUrl);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

// =====================================================================
// DATA & SCHEMAS
// =====================================================================

const PLACEHOLDERS = {
  CONFIRM_CSC_METRIC_OWNER: "Stroke Program Manager / CSC Operations Lead (your program)",
  CONFIRM_FINAL_REQUIRED_FIELDS: "Your stroke quality committee approved fields",
  CONFIRM_FINAL_STROKE_CENTER_REPORTING_FIELDS: "Joint Commission/GWTG Stroke Core Measures",
  CONFIRM_WHICH_ITEMS_ARE_PUBLIC_SAFE: "Local compliance & privacy review",
  CONFIRM_HERNIATION_PHONE: "Neuro ICU Attending Pager / Code Pager (your call chain)",
  CONFIRM_NCC_CALL_CHAIN: "Neurocritical Care Fellow -> Neurocritical Care Attending",
  CONFIRM_NSGY_CALL_CHAIN: "Neurosurgery Resident on-call -> Attending",
  CONFIRM_LOCAL_OSMOTHERAPY_PROTOCOL: "Local osmotic therapy standardized order set (your protocol)",
  CONFIRM_ED_DISCHARGE_ROUTING: "Attending of Record for ED Stroke alert / ED attending",
  CONFIRM_NON_NEURO_ADMISSION_ROUTING: "Stroke Attending co-signature if consult; Primary Team attending if admitting",
  CONFIRM_WEEKEND_HOLIDAY_ROUTING: "On-call Stroke Attending",
  CONFIRM_MORNING_REPORT_ROUTING: "Service attending of the day",
  CONFIRM_FINAL_ATTENDING_LABELS: "Neurology attending staff (your service)",
  CONFIRM_EPIC_BUILD_OWNER: "Neuroscience IT clinical analyst (your EMR team)",
  CONFIRM_NEUROSCIENCE_IT_APPROVAL: "Local EMR governance committee",
  CONFIRM_TEMPLATE_FINAL_TEXT: "Local standardized stroke SmartPhrases (your build)",
  CONFIRM_GO_LIVE_DATE: "TBD 2026",
  CONFIRM_TRIAL_CONTACT: "Stroke Research Coordinator on-call",
  CONFIRM_TRIAL_STATUS: "Active / Recruiting",
  CONFIRM_PUBLIC_TELENEUROLOGY_TEXT: "Approved public teleneurology disclaimer text",
  CONFIRM_PED_STROKE_ACTIVATION: "Local pediatric stroke alert protocol (your children's center)",
  CONFIRM_PED_IMAGING_PROTOCOL: "Local STAT pediatric brain MRI protocol",
  CONFIRM_PED_NEURO_CALL_CHAIN: "Pediatric Neurology Fellow / Attending (your center)",
  CONFIRM_FINAL_INR_THRESHOLD: "INR > 1.4 vs > 1.6 (guidelines vs your local policy)",
  CONFIRM_ICH_BP_TARGETS: "Example institutional acute ICH SBP target: 130-140 mmHg (per AHA/ASA 2022 / your local protocol)",
  CONFIRM_STABILITY_SCAN_TIMING: "Repeat Head CT in 6 hours or with acute change",
  CONFIRM_NSGY_SURGICAL_TRIAGE_TEXT: "Example surgical triage algorithm for lobar & cerebellar ICH (your protocol)",
  CONFIRM_DVT_PPX_TIMING_AIS: "Pharmacologic prophylaxis starting 24h post-onset",
  CONFIRM_DVT_PPX_TIMING_POST_IVT: "LMWH/UFH strictly held for 24h after IV thrombolysis",
  CONFIRM_DVT_PPX_TIMING_ICH: "UFH/LMWH starting 24-48h post-onset if stability scan confirmed",
  CONFIRM_DVT_PPX_AFTER_EVD: "Hold pharmacologic DVT ppx for 24h post-EVD placement",
  CONFIRM_PUPILLOMETRY_EMR_INTEGRATION_STATUS: "Flowsheet integration pending IT implementation",
  CONFIRM_LOCAL_PUPILLOMETRY_USE_CASES: "High-risk TBI, severe stroke, or elevated ICP monitoring",
  CONFIRM_POLICY_FINAL_TEXT: "Example IVT / EVT standard administration guidelines (your protocol)",
  CONFIRM_APOP_2026_LANGUAGE: "2026 acute stroke protocol updates (your local revision)",
  CONFIRM_SAFETY_PAUSE_PARTICIPANTS: "Neurology, ED clinician, and the primary/administering RN (or the anesthesia provider giving the drug)",
  CONFIRM_TELESTROKE_PATHWAY_SOURCE: "Example telestroke operations manual (your network)",
  CONFIRM_PUBLIC_SAFE_ROUTING_TEXT: "Tele-consult routing logic (your network)",
};

const EDUCATION_MODULES = [
  {
    id: 'select-seizure-risk',
    title: 'SeLECT Post-Stroke Seizure Risk',
    purpose: 'SeLECT score for predicting 1-year and 5-year risk of late post-stroke seizures and epilepsy after ischemic stroke.',
    actions: 'select score post stroke seizure epilepsy risk galovic cortical involvement early seizure large-artery atherosclerosis toast mca territory asm antiseizure',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-24',
    references: [
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. Prediction of late seizures after ischaemic stroke with a novel prognostic model (the SeLECT score): a multivariable prediction model development and validation study. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
    ]
  },
  {
    id: 'toast-classification',
    title: 'TOAST Stroke Classification',
    purpose: 'Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.',
    actions: 'toast criteria etiology large artery lacune small vessel cardioembolic undetermined cryptogenic esus workup factor xia inhibitor asundexian milvexian pacific-stroke axiomatic-ssp oceanic-stroke librexia-stroke',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-22',
    references: [
      { label: 'Original Study', citation: 'Adams HP Jr, et al. TOAST. Stroke. 1993;24:35-41.', pmid: '7678184' },
      { label: 'AHA/ASA Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'OCEANIC-STROKE Trial', citation: 'Sharma M, et al. Asundexian for Secondary Stroke Prevention. N Engl J Med. 2026;394(15):1467-1479.', pmid: '41985132' },
      { label: 'PACIFIC-Stroke Trial', citation: 'Shoamanesh A, et al. Factor XIa inhibition with asundexian after acute non-cardioembolic ischaemic stroke (PACIFIC-Stroke): a phase 2b trial. Lancet. 2022;400(10357):997-1007.', pmid: '36063821' },
      { label: 'AXIOMATIC-SSP Trial', citation: 'Sharma M, et al. Safety and efficacy of factor XIa inhibition with milvexian for secondary stroke prevention (AXIOMATIC-SSP): a phase 2 dose-finding trial. Lancet Neurol. 2024;23(1):46-59.', pmid: '38101902' }
    ]
  },
  {
    id: 'dapt-regimens',
    title: 'DAPT for Non-Cardioembolic Ischemic Stroke',
    purpose: 'Guideline-directed Dual Antiplatelet Therapy (DAPT) for secondary non-cardioembolic stroke prevention.',
    actions: 'dapt antiplatelet aspirin clopidogrel plavix ticagrelor brilinta point chance chance-2 thales sammpris cyp2c19 genotype resistance',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'POINT Trial', citation: 'Johnston SC et al. N Engl J Med. 2018;379:215-225.', pmid: '29766750' },
      { label: 'CHANCE Trial', citation: 'Wang Y et al. N Engl J Med. 2013;369:11-19.', pmid: '23803136' },
      { label: 'CHANCE-2 Trial', citation: 'Wang Y et al. N Engl J Med. 2021;385:2520-2530.', pmid: '34708996' },
      { label: 'INSPIRES Trial', citation: 'Gao Y et al. N Engl J Med. 2023;389:2413-2424.', pmid: '38157499' },
      { label: 'THALES Trial', citation: 'Johnston SC et al. N Engl J Med. 2020;383:207-217.', pmid: '32668111' },
      { label: 'SAMMPRIS Trial', citation: 'Chimowitz MI et al. N Engl J Med. 2011;365:993-1003.', pmid: '21899409' }
    ]
  },
  {
    id: 'malignant-infarction',
    title: 'Malignant Infarction & Decompression',
    purpose: 'Decompressive hemicraniectomy selection criteria, evidence, and supportive ICU care for malignant MCA syndrome.',
    actions: 'malignant mca cerebral edema brain swelling hemicraniectomy dhc destiny decimal hamlet timing criteria outcome mrs prognosis',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'DECIMAL Trial', citation: 'Vahedi K et al. Stroke. 2007;38:2506-2517.', pmid: '17690311' },
      { label: 'DESTINY Trial', citation: 'Jüttler E et al. Stroke. 2007;38:2518-2525.', pmid: '17690310' },
      { label: 'HAMLET Trial', citation: 'Hofmeijer J et al. Lancet Neurol. 2009;8:326-333.', pmid: '19269254' },
      { label: 'DESTINY II Trial', citation: 'Jüttler E et al. N Engl J Med. 2014;370:1091-1100.', pmid: '24645942' },
      { label: 'AHA Guidelines', citation: 'Wijdicks EF et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. Stroke. 2014;45:1222-1238.', pmid: '24481970' }
    ]
  },
  {
    id: 'afib-anticoag-timing',
    title: 'AFib Anticoagulation Restart Timing',
    purpose: 'Randomized evidence on DOAC initiation after AF-related ischemic stroke, with trial-specific eligibility, hemorrhagic transformation and current-label dosing context.',
    actions: 'afib atrial fibrillation doac restart anticoagulation timing elan optimas timing start catalyst meta-analysis apixaban rivaroxaban dabigatran edoxaban',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'ELAN Trial', citation: 'Fischer U et al. N Engl J Med. 2023;388:2411-2421.', pmid: '37222476' },
      { label: 'OPTIMAS Trial', citation: 'Werring DJ et al. Optimal timing of anticoagulation after acute ischaemic stroke with atrial fibrillation (OPTIMAS). Lancet. 2024. DOI 10.1016/S0140-6736(24)02197-4.', pmid: '39491870' },
      { label: 'CATALYST Meta-Analysis', citation: 'Dehbi HM, et al. Collaboration on the optimal timing of anticoagulation after ischaemic stroke and atrial fibrillation: a systematic review and prospective individual participant data meta-analysis of randomised controlled trials (CATALYST). Lancet. 2025;406(10498):43-51.', pmid: '40570866' },
      { label: 'AFib Guidelines', citation: 'Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. Circulation. 2024;149:e1-e156.', pmid: '38033089' }
    ]
  },
  {
    id: 'herniation-icp',
    title: 'Intracranial Hypertension & Herniation - Stroke',
    purpose: 'Concept reference on cerebral edema, herniation and escalation assessment. Drug recipes, the osmotherapy calculator and device simulation are unavailable.',
    actions: 'icp herniation cerebral edema brain swelling osmotherapy mannitol hypertonic saline hts evd midline shift reference',
    categories: ['icu'],
    lastReviewed: '2026-05-31',
    references: [
      { label: 'AHA/ASA Guidelines', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026;57(8):e316-e436.', pmid: '41582814' },
      { label: 'Cerebral Edema Recommendations', citation: 'Wijdicks EF, et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. Stroke. 2014;45:1222–1238.', pmid: '24481970' },
      { label: 'NCS Guidelines', citation: 'Cook AM, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. Neurocrit Care. 2020;32:647–666.', pmid: '32227294' }
    ]
  },
  {
    id: 'evd-maintenance',
    title: 'External Ventricular Drain',
    purpose: 'Concept reference on EVD measurement context, device-specific safety and individualized management. Operational steps, downloadable procedural sheet and simulation are unavailable.',
    actions: 'evd external ventricular drain ventriculostomy leveling drainage csf overdrainage underdrainage waveform reference',
    categories: ['icu'],
    lastReviewed: '2026-06-03',
    references: [
      { label: 'NCS Consensus Statement', citation: 'Fried HI, et al. The Insertion and Management of External Ventricular Drains. Neurocrit Care. 2016;24:61-81.', pmid: '26738503' }
    ]
  },
  {
    id: 'hints-simulator',
    title: 'HINTS+ Vestibular Simulator',
    purpose: 'Selected HINTS+ eye-movement demonstrations for trained examiners assessing an appropriate acute vestibular syndrome. The inaccurate positive-skew animation is unavailable.',
    actions: 'hints vestibular nystagmus skew eye movement vertigo hearing loss avs nystagmus simulator interactive',
    categories: ['simulators'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'Kattah Study', citation: 'Kattah JC, et al. HINTS to diagnose stroke in the acute vestibular syndrome: three-step bedside oculomotor examination more sensitive than early MRI diffusion-weighted imaging. Stroke. 2009;40(11):3504-3510.', pmid: '19762709' },
      { label: 'AHA/ASA Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026;57(8):e316-e436.', pmid: '41582814' }
    ]
  },
  {
    id: 'pupillometry',
    title: 'Pupillometry & NPi Evidence',
    purpose: 'Observational pupillometry evidence and its limits, including ORANGE and ischemic-stroke cohorts. Simulation and automatic patient-specific interpretation are unavailable.',
    actions: 'pupillometry npi pupil size constriction velocity latency icp shift anisocoria pupillometer evidence orange du',
    categories: ['icu'],
    lastReviewed: '2026-09-06',
    references: [
      { label: 'ORANGE Cohort', citation: 'Oddo M, et al. The Neurological Pupil index for outcome prognostication in people with acute brain injury (ORANGE): a prospective, observational, multicentre cohort study. Lancet Neurol. 2023;22(10):925-933.', pmid: '37652068' },
      { label: 'NPi vs ICP (ORANGE Secondary)', citation: 'Petrosino M, et al. Neurological Pupil Index and Intracranial Hypertension in Patients With Acute Brain Injury: A Secondary Analysis of the ORANGE Study. JAMA Neurol. 2025;82(2):176-184.', pmid: '39652324' },
      { label: 'Pupillometry & ICP in ICH', citation: 'Giede-Jeppe A, et al. Automated Pupillometry Identifies Absence of Intracranial Pressure Elevation in Intracerebral Hemorrhage Patients. Neurocrit Care. 2021;35(1):210-220.', pmid: '33367973' }
    ]
  },
  {
    id: 'stk-core-measures',
    title: 'Stroke Core Measures',
    purpose: 'Reference guide for Joint Commission / GWTG stroke core measures and Comprehensive Stroke Center (CSC) quality metrics.',
    actions: 'quality core measures joint commission gwtg stk-1 stk-2 stk-3 stk-4 stk-5 stk-6 stk-8 stk-10 cstk csc metrics compliance program',
    categories: ['quality', 'pocket-card', 'printable'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'Joint Commission', citation: 'Specifications Manual for Joint Commission National Quality Measures.', pmid: null },
      { label: 'AHA/ASA 2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
    ]
  },
  {
    id: 'cervical-dissection',
    title: 'Cervical Artery Dissection',
    purpose: 'Clinical presentation, diagnostic workup, medical management (extracranial vs. intracranial), and landmark trial evidence (CADISS, TREAT-CAD, STOP-CAD, and 2024 IPD meta-analysis) for cervical artery dissection.',
    actions: 'carotid vertebral dissection horner syndrome treat-cad cadiss stop-cad antiplatelet anticoagulation pseudoaneurysm pain ipsilateral headache neck yaghi kaufmann',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-06-09',
    references: [
      { label: 'CADISS Trial', citation: 'CADISS Trial Investigators. Lancet Neurol. 2015;14(4):361-367.', pmid: '25684164' },
      { label: 'TREAT-CAD Trial', citation: 'Engelter ST, et al. Lancet Neurol. 2021;20(5):341-350.', pmid: '33765420' },
      { label: 'STOP-CAD Study', citation: 'Yaghi S, et al. Antithrombotic Treatment for Stroke Prevention in Cervical Artery Dissection: The STOP-CAD Study. Stroke. 2024;55(4):908-918.', pmid: '38335240' },
      { label: 'IPD Meta-Analysis', citation: 'Kaufmann JE, et al. JAMA Neurol. 2024;81(6):630-637.', pmid: '38739383' },
      { label: 'AHA/ASA 2021 Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'AHA Statement 2024', citation: 'Yaghi S, et al. Treatment and Outcomes of Cervical Artery Dissection in Adults: A Scientific Statement From the American Heart Association. Stroke. 2024;55(3):e91-e106.', pmid: '38299330' },
      { label: 'ESO Guideline 2021', citation: 'Debette S, et al. ESO guideline for the management of extracranial and intracranial artery dissection. Eur Stroke J. 2021;6(3):XXXIX-LXXXVIII.', pmid: '34746432' }
    ]
  },
  {
    id: 'fibromuscular-dysplasia',
    title: 'Fibromuscular Dysplasia & Cervical Artery Dissection',
    purpose: 'Pathophysiology, angiographic classification (multifocal string-of-beads vs. focal), brain-to-pelvis vascular screening, and cervical artery dissection trials (CADISS, TREAT-CAD, STOP-CAD, Kaufmann IPD).',
    actions: 'fmd fibromuscular dysplasia beading string of beads stenosis renal aneurysm carotid vertebral dissection screening vascular consensus cadiss treat-cad stop-cad kaufmann horner',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'FMD Scientific Statement', citation: 'Olin JW, et al. Fibromuscular dysplasia: state of the science and critical unanswered questions: a scientific statement from the American Heart Association. Circulation. 2014;129(9):1048-1078.', pmid: '24548843' },
      { label: 'First International Consensus', citation: 'Gornik HL, et al. First International Consensus on the Diagnosis and Management of Fibromuscular Dysplasia. Vasc Med. 2019;24(2):164-189.', pmid: '30648921' },
      { label: 'CADISS Trial', citation: 'CADISS Trial Investigators. Antiplatelet treatment compared with anticoagulation treatment for cervical artery dissection (CADISS): a randomised trial. Lancet Neurol. 2015;14(4):361-367.', pmid: '25684164' },
      { label: 'TREAT-CAD Trial', citation: 'Engelter ST, et al. Aspirin versus anticoagulation in cervical artery dissection (TREAT-CAD): an open-label, randomised, non-inferiority trial. Lancet Neurol. 2021;20(5):341-350.', pmid: '33765420' },
      { label: 'STOP-CAD Study', citation: 'Yaghi S, et al. Antithrombotic Treatment for Stroke Prevention in Cervical Artery Dissection: The STOP-CAD Study. Stroke. 2024;55(4):908-918.', pmid: '38335240' },
      { label: 'Kaufmann IPD Meta-analysis', citation: 'Kaufmann JE, et al. Antithrombotic Treatment for Cervical Artery Dissection: A Systematic Review and Individual Patient Data Meta-Analysis. JAMA Neurol. 2024;81(6):630-637.', pmid: '38739383' }
    ]
  },
  {
    id: 'brain-death',
    title: 'Brain Death / BD-DNC',
    purpose: 'Consensus guidelines for the determination of Brain Death / Death by Neurologic Criteria (BD/DNC) in adult and pediatric patients.',
    actions: 'brain death neurologic death aan sccm guidelines apnea test checklist reflexes pupillary corneal calorics ancillary dsa tcd eeg cta',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-06-09',
    references: [
      { label: 'Consensus Guideline', citation: 'Greer DM, et al. Pediatric and Adult Brain Death/Death by Neurologic Criteria Consensus Guideline. Neurology. 2023;101(24):1112-1132.', pmid: '37821233' },
      { label: 'AAN 2010 Guideline (prior; updated by 2023 BD/DNC consensus guideline)', citation: 'Wijdicks EF, et al. Evidence-based guideline update: determining brain death in adults: report of the Quality Standards Subcommittee of the American Academy of Neurology. Neurology. 2010;74(23):1911-1918.', pmid: '20530327' }
    ]
  },
  {
    id: 'stroke-prognosis',
    title: 'Stroke Prognosis & Clinical Scores',
    purpose: 'Clinical prognostic models for acute stroke: ASTRAL and PLAN scores for ischemic stroke, and the ICH Score for spontaneous intracerebral hemorrhage.',
    actions: 'prognosis outcomes astral plan ich score rankin mrs mortality dependency stratification prediction scale bedside',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'ASTRAL Score', citation: 'Ntaios G, et al. An integer-based score to predict functional outcome in acute ischemic stroke: the ASTRAL score. Neurology. 2012;78(24):1916-1922.', pmid: '22649218' },
      { label: 'Neuroprognostication Guidance', citation: 'Guidelines for Neuroprognostication in Critically ill Adults with Acute Ischemic Stroke. Neurocrit Care. 2026;44:745-769.', pmid: '41942818' },
      { label: 'PLAN Score', citation: 'O\'Donnell MJ, et al. The PLAN score: a bedside prediction rule for death and severe disability following acute ischemic stroke. Arch Intern Med. 2012;172(20):1548-1556.', pmid: '23147454' },
      { label: 'ICH Score', citation: 'Hemphill JC 3rd, et al. Stroke. 2001;32(4):891-897.', pmid: '11283388' },
      { label: 'mRS Scale', citation: 'van Swieten JC, et al. Stroke. 1988;19(5):604-607.', pmid: '3363593' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'FASTEST Trial', citation: 'Broderick JP, et al. Recombinant factor VIIa versus placebo for spontaneous intracerebral haemorrhage within 2 h (FASTEST). Lancet. 2026;407(10530):773-783.', pmid: '41653933' }
    ]
  },
  {
    id: 'antiepileptic-drugs',
    title: 'Antiepileptic Drugs & Post-Stroke Seizures',
    purpose: 'Clinical classification of post-stroke seizures, guideline-directed management, comparison of first-line and second-line antiseizure medications (ASMs), and post-stroke epilepsy risk stratification with the SeLECT score.',
    actions: 'antiepileptic drugs antiseizure medications asm aed keppra levetiracetam lamotrigine lamictal lacosamide vimpat valproic acid depakote phenytoin dilantin select score ischemia score post-stroke epilepsy seizure prophylaxis',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'AHA/ASA 2026 Stroke Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'AHA/ASA 2023 aSAH Guideline', citation: 'Hoh BL, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54(7):e314-e370.', pmid: '37212182' },
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. Prediction of late seizures after ischaemic stroke with a novel prognostic model (the SeLECT score): a multivariable prediction model development and validation study. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
    ]
  },
  {
    id: 'cerebral-venous-sinus-thrombosis',
    title: 'Cerebral Venous Sinus Thrombosis (CVST)',
    purpose: 'Presentation, risk factors, venography-based diagnosis, anticoagulation despite venous hemorrhage, DOAC transition, and prognosis for cerebral venous and dural sinus thrombosis.',
    actions: 'cvst cvt cerebral venous sinus thrombosis dural sagittal transverse sigmoid straight sinus vein of galen venous infarct hemorrhagic transformation d-dimer ctv mrv anticoagulation lmwh dabigatran doac iscvt re-spect action-cvt to-act thrombectomy papilledema intracranial hypertension',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'ISCVT', citation: 'Ferro JM, et al. Prognosis of cerebral vein and dural sinus thrombosis: results of the ISCVT. Stroke. 2004;35(3):664-670.', pmid: '14976332' },
      { label: 'RE-SPECT CVT', citation: 'Ferro JM, et al. Safety and Efficacy of Dabigatran Etexilate vs Dose-Adjusted Warfarin in Cerebral Venous Thrombosis. JAMA Neurol. 2019;76(12):1457-1465.', pmid: '31479105' },
      { label: 'ACTION-CVT', citation: 'Yaghi S, et al. Direct Oral Anticoagulants Versus Warfarin in the Treatment of Cerebral Venous Thrombosis (ACTION-CVT). Stroke. 2022;53(3):728-738.', pmid: '35143325' },
      { label: 'TO-ACT', citation: 'Coutinho JM, et al. Effect of Endovascular Treatment With Medical Management vs Standard Care on Severe Cerebral Venous Thrombosis (TO-ACT). JAMA Neurol. 2020;77(8):966-973.', pmid: '32421159' },
      { label: 'AHA Scientific Statement 2024', citation: 'Saposnik G, et al. Diagnosis and Management of Cerebral Venous Thrombosis: A Scientific Statement From the American Heart Association. Stroke. 2024;55(3):e77-e90.', pmid: '38284265' },
      { label: 'AHA/ASA Statement 2011 (updated by 2024 AHA statement)', citation: 'Saposnik G, et al. Diagnosis and management of cerebral venous thrombosis: a statement for healthcare professionals from the AHA/ASA. Stroke. 2011;42(4):1158-1192.', pmid: '21293023' }
    ]
  },
  {
    id: 'large-core-thrombectomy',
    title: 'Large-Core Thrombectomy',
    purpose: 'Endovascular thrombectomy for large ischemic core (low ASPECTS or large core volume) — the six 2022–2024 RCTs, functional-outcome benefit, and the hemorrhage trade-off (more any intracranial hemorrhage and numerically higher sICH in most individual trials, but no significant sICH difference in the 2026 ATLAS IPD meta-analysis).',
    actions: 'large core thrombectomy evt endovascular aspects 3-5 low aspects core volume salvageable penumbra select2 angel-aspect tension laste tesla rescue-japan limit symptomatic hemorrhage mrs shift 2026 aha asa guideline reperfusion',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'SELECT2', citation: 'Sarraj A, et al. Trial of Endovascular Thrombectomy for Large Ischemic Strokes (SELECT2). N Engl J Med. 2023;388(14):1259-1271.', pmid: '36762865' },
      { label: 'ANGEL-ASPECT', citation: 'Huo X, et al. Trial of Endovascular Therapy for Acute Ischemic Stroke with Large Infarct (ANGEL-ASPECT). N Engl J Med. 2023;388(14):1272-1283.', pmid: '36762852' },
      { label: 'TENSION', citation: 'Bendszus M, et al. Endovascular thrombectomy for acute ischaemic stroke with established large infarct (TENSION). Lancet. 2023;402(10414):1753-1763.', pmid: '37837989' },
      { label: 'LASTE', citation: 'Costalat V, et al. Trial of Thrombectomy for Stroke with a Large Infarct of Unrestricted Size (LASTE). N Engl J Med. 2024;390(18):1677-1689.', pmid: '38718358' },
      { label: 'TESLA', citation: 'Yoo AJ, et al. Thrombectomy for Stroke With Large Infarct on Noncontrast CT: The TESLA Randomized Clinical Trial. JAMA. 2024;332(16):1355-1366.', pmid: '39374319' },
      { label: 'RESCUE-Japan LIMIT', citation: 'Yoshimura S, et al. Endovascular Therapy for Acute Stroke with a Large Ischemic Region. N Engl J Med. 2022;386(14):1303-1313.', pmid: '35138767' },
      { label: '2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'ATLAS IPD Meta-analysis', citation: 'Sarraj A, et al. Endovascular thrombectomy for patients with large-core ischaemic stroke presenting up to 24 h after onset (ATLAS): a systematic review and individual patient data meta-analysis with central imaging adjudication. Lancet. 2026;407(10543):2015-2026.', pmid: '42107392' }
    ]
  },
  {
    id: 'basilar-artery-occlusion',
    title: 'Basilar Artery Occlusion',
    purpose: 'Protean brainstem presentation, the ATTENTION/BAOCHE evidence arc for endovascular therapy, imaging selection (pc-ASPECTS, perfusion/collaterals), and pitfalls for basilar artery occlusion.',
    actions: 'basilar artery occlusion bao vertebrobasilar posterior circulation brainstem pons locked-in coma crossed deficit herald tia attention baoche basics best pc-aspects perforator evt thrombectomy time window',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'ATTENTION', citation: 'Tao C, et al. Trial of Endovascular Treatment of Acute Basilar-Artery Occlusion (ATTENTION). N Engl J Med. 2022;387(15):1361-1372.', pmid: '36239644' },
      { label: 'BAOCHE', citation: 'Jovin TG, et al. Trial of Thrombectomy 6 to 24 Hours after Stroke Due to Basilar-Artery Occlusion (BAOCHE). N Engl J Med. 2022;387(15):1373-1384.', pmid: '36239645' },
      { label: 'BASICS', citation: 'Langezaal LCM, et al. Endovascular Therapy for Stroke Due to Basilar-Artery Occlusion (BASICS). N Engl J Med. 2021;384(20):1910-1920.', pmid: '34010530' },
      { label: 'BEST', citation: 'Liu X, et al. Endovascular treatment versus standard medical treatment for vertebrobasilar artery occlusion (BEST). Lancet Neurol. 2020;19(2):115-122.', pmid: '31831388' }
    ]
  },
  {
    id: 'carotid-stenosis-management',
    title: 'Carotid Stenosis: Revascularization vs Medical Therapy',
    purpose: 'Symptomatic vs asymptomatic carotid stenosis, NASCET measurement, CEA vs CAS (CREST), the CREST-2 asymptomatic results, and intensive medical therapy as the common foundation.',
    actions: 'carotid stenosis nascet cea carotid endarterectomy cas stenting revascularization symptomatic asymptomatic crest crest-2 acst-2 intensive medical therapy imm plaque bifurcation ldl antiplatelet',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'CREST-2', citation: 'Brott TG, et al. Medical Management and Revascularization for Asymptomatic Carotid Stenosis (CREST-2). N Engl J Med. 2026;394(3):219-231.', pmid: '41269206' },
      { label: 'CREST', citation: 'Brott TG, et al. Stenting versus Endarterectomy for Treatment of Carotid-Artery Stenosis (CREST). N Engl J Med. 2010;363(1):11-23.', pmid: '20505173' },
      { label: 'ACST-2', citation: 'Halliday A, et al. Second asymptomatic carotid surgery trial (ACST-2): stenting vs endarterectomy. Lancet. 2021;398(10305):1065-1073.', pmid: '34469763' },
      { label: 'NASCET', citation: 'North American Symptomatic Carotid Endarterectomy Trial Collaborators. Beneficial effect of carotid endarterectomy in symptomatic patients with high-grade stenosis. N Engl J Med. 1991;325(7):445-453.', pmid: '1852179' }
    ]
  },
  {
    id: 'brainstem-stroke-syndromes',
    title: 'Brainstem Stroke Syndromes Atlas',
    purpose: 'The crossed-deficit localization rule and the classic brainstem stroke syndromes (Wallenberg, Dejerine, Millard-Gubler, Foville, one-and-a-half, Weber, Benedikt, Claude) by level, vessel, and deficit.',
    actions: 'brainstem syndrome wallenberg lateral medullary dejerine medial medullary millard-gubler foville one-and-a-half weber benedikt claude crossed deficit cranial nerve midbrain pons medulla pica aica locked-in tatu localization',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'Arterial territories — brainstem/cerebellum', citation: 'Tatu L, et al. Arterial territories of human brain: brainstem and cerebellum. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' },
      { label: 'Arterial territories — cerebral hemispheres', citation: 'Tatu L, et al. Arterial territories of the human brain: cerebral hemispheres. Neurology. 1998;50(6):1699-1708.', pmid: '9633714' }
    ]
  },
  {
    id: 'vascular-territory-atlas',
    title: 'Cerebral Vascular Territory & Watershed Atlas',
    purpose: 'Anterior (ACA/MCA/lenticulostriate/anterior-choroidal) and posterior (PCA/PICA/AICA/SCA/basilar-perforator) territories with their clinical signatures, plus cortical and internal watershed patterns and mechanisms.',
    actions: 'vascular territory atlas aca mca pca lenticulostriate anterior choroidal pica aica sca basilar perforator watershed borderzone cortical internal wedge rosary hemodynamic hypoperfusion hemianopia neglect aphasia lacunar tatu circle of willis',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'Arterial territories — cerebral hemispheres', citation: 'Tatu L, et al. Arterial territories of the human brain: cerebral hemispheres. Neurology. 1998;50(6):1699-1708.', pmid: '9633714' },
      { label: 'Arterial territories — brainstem/cerebellum', citation: 'Tatu L, et al. Arterial territories of human brain: brainstem and cerebellum. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' }
    ]
  },
  {
    id: 'anticoagulation-reversal',
    title: 'Anticoagulation Reversal in Acute Hemorrhage',
    purpose: 'Agent-specific reversal for intracranial hemorrhage, the FDA andexanet safety update and US sales cessation, PCC-based factor Xa reversal, and the distinct thrombolysis-associated hemorrhage pathway, with parallel BP and neurosurgical assessment.',
    actions: 'anticoagulation reversal ich hemorrhage warfarin vka 4f-pcc pcc vitamin k dabigatran idarucizumab factor xa apixaban rivaroxaban edoxaban andexanet annexa-4 annexa-i FDA discontinued withdrawal unavailable reverse-ad patch platelet desmopressin thrombolysis alteplase tenecteplase sich fibrinolytic coagulopathy cryoprecipitate fibrinogen tranexamic acid aminocaproic yaghi bp control neurosurgery',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-09-06',
    references: [
      { label: 'ANNEXA-4', citation: 'Connolly SJ, et al. Full Study Report of Andexanet Alfa for Bleeding Associated with Factor Xa Inhibitors. N Engl J Med. 2019;380(14):1326-1335.', pmid: '30730782' },
      { label: 'ANNEXA-I', citation: 'Connolly SJ, et al. Andexanet for Factor Xa Inhibitor–Associated Acute Intracerebral Hemorrhage. N Engl J Med. 2024;390(19):1745-1755.', pmid: '38749032' },
      { label: 'RE-VERSE AD', citation: 'Pollack CV, et al. Idarucizumab for Dabigatran Reversal — Full Cohort Analysis. N Engl J Med. 2017;377(5):431-441.', pmid: '28693366' },
      { label: 'Thrombolysis-sICH Statement (AHA/ASA)', citation: 'Yaghi S, et al. Treatment and Outcome of Hemorrhagic Transformation After Intravenous Alteplase in Acute Ischemic Stroke: A Scientific Statement From the AHA/ASA. Stroke. 2017;48(12):e343-e361.', pmid: '29097489' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'NCS/SCCM Reversal Guideline', citation: 'Frontera JA, et al. Guideline for Reversal of Antithrombotics in Intracranial Hemorrhage. Neurocrit Care. 2016;24(1):6-46.', pmid: '26714677' }
    ]
  },
  {
    id: 'rcvs',
    title: 'Reversible Cerebral Vasoconstriction Syndrome (RCVS)',
    purpose: 'Recurrent thunderclap headache, triggers, reversible segmental vasoconstriction, the RCVS² score to distinguish RCVS from PACNS, and management (calcium-channel blockers, avoid steroids).',
    actions: 'rcvs reversible cerebral vasoconstriction syndrome thunderclap headache string of beads segmental postpartum cannabis ssri triptan trigger convexity sah pres watershed rcvs2 score pacns vasculitis nimodipine verapamil steroids ducros singhal',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'RCVS² score', citation: 'Rocha EA, et al. RCVS2 score and diagnostic approach for reversible cerebral vasoconstriction syndrome. Neurology. 2019;92(7):e639-e647.', pmid: '30635475' },
      { label: 'Ducros cohort', citation: 'Ducros A, et al. The clinical and radiological spectrum of reversible cerebral vasoconstriction syndrome (67 patients). Brain. 2007;130(Pt 12):3091-3101.', pmid: '18025032' },
      { label: 'Singhal series', citation: 'Singhal AB, et al. Reversible cerebral vasoconstriction syndromes: analysis of 139 cases. Arch Neurol. 2011;68(8):1005-1012.', pmid: '21482916' }
    ]
  },
  {
    id: 'vessel-wall-mri',
    title: 'High-Resolution Vessel Wall MRI (VW-MRI) Differential',
    purpose: 'High-resolution black-blood vessel wall MRI differential matrix for intracranial arteriopathies — distinguishing ICAD, Primary CNS Vasculitis (PACNS), RCVS, Arterial Dissection, and Moyamoya disease via wall morphology, enhancement patterns, and remodeling.',
    actions: 'vessel wall mri vw-mri high resolution black blood icad pacns cns vasculitis rcvs dissection moyamoya wall thickening eccentric concentric enhancement remodeling t1 space dante msde contrast',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'ASNR VW-MRI Consensus', citation: 'Mandell DM, et al. Intracranial Vessel Wall MRI: Principles and Expert Consensus Recommendations of the American Society of Neuroradiology. AJNR Am J Neuroradiol. 2017;38(2):218-229.', pmid: '27469212' },
      { label: 'Arteriopathy Characteristics', citation: 'Vranic JE, Hartman JB, Mossa-Basha M. High-Resolution Magnetic Resonance Vessel Wall Imaging for the Evaluation of Intracranial Vascular Pathology. Neuroimaging Clin N Am. 2021;31(2):223-233.', pmid: '33902876' },
      { label: 'High-Res Diagnostic Patterns', citation: 'Obusez EC, et al. High-resolution MRI vessel wall imaging: spatial and temporal patterns of reversible cerebral vasoconstriction syndrome and central nervous system vasculitis. AJNR Am J Neuroradiol. 2014;35(8):1527-1532.', pmid: '24722305' },
      { label: 'PACNS vs RCVS Differentiation', citation: 'Mattay RR, et al. Current Clinical Applications of Intracranial Vessel Wall MR Imaging. Semin Ultrasound CT MR. 2021;42(5):463-473.', pmid: '34537115' }
    ]
  },
  {
    id: 'cryptogenic-stroke-esus',
    title: 'Cryptogenic Stroke & ESUS Diagnostic Evaluation',
    purpose: 'Embolic Stroke of Undetermined Source (ESUS) definition, empirical DOAC failure in unselected ESUS (NAVIGATE ESUS, RE-SPECT ESUS), biomarker-defined atrial cardiopathy trial analysis (ARCADIA), insertable cardiac monitor (ICM) yields (CRYSTAL AF, STROKE-AF), and stepwise diagnostic algorithm.',
    actions: 'cryptogenic stroke esus embolic stroke undetermined source crystal af stroke-af navigate esus re-spect esus arcadia atrial cardiopathy ptfv1 nt-probnp left atrial index icm loop recorder telemetry tee aortic arch atheroma bubble study',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'ESUS Construct', citation: 'Hart RG, et al. Embolic strokes of undetermined source: the case for a new clinical construct. Lancet Neurol. 2014;13(4):429-438.', pmid: '24646875' },
      { label: 'CRYSTAL AF Trial', citation: 'Sanna T, et al. Cryptogenic stroke and underlying atrial fibrillation (CRYSTAL AF). N Engl J Med. 2014;370(26):2478-2486.', pmid: '24963567' },
      { label: 'STROKE-AF Trial', citation: 'Bernstein RA, et al. Effect of Long-term Continuous Cardiac Monitoring vs Usual Care on Detection of Atrial Fibrillation in Patients With Stroke Attributed to Large- or Small-Vessel Disease: The STROKE-AF Randomized Clinical Trial. JAMA. 2021;325(21):2169-2177.', pmid: '34061145' },
      { label: 'NAVIGATE ESUS Trial', citation: 'Hart RG, et al. Rivaroxaban for Stroke Prevention after Embolic Stroke of Undetermined Source (NAVIGATE ESUS). N Engl J Med. 2018;378(23):2191-2201.', pmid: '29766772' },
      { label: 'RE-SPECT ESUS Trial', citation: 'Diener HC, et al. Dabigatran for Prevention of Stroke after Embolic Stroke of Undetermined Source (RE-SPECT ESUS). N Engl J Med. 2019;380(20):1906-1917.', pmid: '31091372' },
      { label: 'ARCADIA Trial', citation: 'Kamel H, et al. Apixaban to Prevent Recurrence after Cryptogenic Stroke in Patients with Atrial Cardiopathy (ARCADIA). JAMA. 2024;331(7):573-581.', pmid: '38324415' },
      { label: 'NOAH-AFNET 6 Trial', citation: 'Kirchhof P, et al. Anticoagulation with Edoxaban in Patients with Atrial High-Rate Episodes (NOAH-AFNET 6). N Engl J Med. 2023;389(13):1167-1179.', pmid: '37622677' },
      { label: 'LOOP Study', citation: 'Svendsen JH, et al. Implantable loop recorder detection of atrial fibrillation to prevent stroke (The LOOP Study). Lancet. 2021;398(10310):1507-1516.', pmid: '34469766' }
    ]
  },
  {
    id: 'pfo-closure',
    title: 'PFO Closure for Cryptogenic Stroke',
    purpose: 'Who benefits from patent foramen ovale closure after a nonlacunar stroke of undetermined cause — the four randomized trials that showed benefit (CLOSE, RESPECT long-term, REDUCE, DEFENSE-PFO; the earlier CLOSURE I and PC trials were neutral), candidate selection with the RoPE score and PASCAL classification, the closure-vs-antiplatelet-vs-anticoagulation decision per the 2021 AHA/ASA and 2024 ESO guidelines, and the device-associated atrial fibrillation trade-off.',
    actions: 'pfo patent foramen ovale closure cryptogenic stroke esus paradoxical embolism close respect reduce defense-pfo rope score pascal classification atrial septal aneurysm large shunt right-to-left shunt antiplatelet anticoagulation device atrial fibrillation transcatheter occluder amplatzer gore cardioform age 18-60 nonlacunar undetermined cause aha asa 2021 eso 2024 tee bubble study',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-22',
    references: [
      { label: 'CLOSE Trial', citation: 'Mas JL, et al. Patent Foramen Ovale Closure or Anticoagulation vs. Antiplatelets after Stroke (CLOSE). N Engl J Med. 2017;377(11):1011-1021.', pmid: '28902593' },
      { label: 'RESPECT Long-Term', citation: 'Saver JL, et al. Long-Term Outcomes of Patent Foramen Ovale Closure or Medical Therapy after Stroke (RESPECT). N Engl J Med. 2017;377(11):1022-1032.', pmid: '28902590' },
      { label: 'REDUCE Trial', citation: 'Søndergaard L, et al. Patent Foramen Ovale Closure or Antiplatelet Therapy for Cryptogenic Stroke (REDUCE). N Engl J Med. 2017;377(11):1033-1042.', pmid: '28902580' },
      { label: 'DEFENSE-PFO Trial', citation: 'Lee PH, et al. Cryptogenic Stroke and High-Risk Patent Foramen Ovale: The DEFENSE-PFO Trial. J Am Coll Cardiol. 2018;71(20):2335-2342.', pmid: '29544871' },
      { label: 'RoPE Score', citation: 'Kent DM, et al. An index to identify stroke-related vs incidental patent foramen ovale in cryptogenic stroke (RoPE Study). Neurology. 2013;81(7):619-625.', pmid: '23864310' },
      { label: 'PASCAL Classification', citation: 'Kent DM, et al. Heterogeneity of Treatment Effects in an Analysis of Pooled Individual Patient Data From Randomized Trials of Device Closure of Patent Foramen Ovale After Stroke (PASCAL). JAMA. 2021;326(22):2277-2286.', pmid: '34905030' },
      { label: 'AHA/ASA 2021 Secondary Prevention', citation: 'Kleindorfer DO, et al. 2021 Guideline for the Prevention of Stroke in Patients With Stroke and TIA. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'ESO PFO Guideline 2024', citation: 'Caso V, et al. European Stroke Organisation (ESO) Guidelines on the diagnosis and management of patent foramen ovale (PFO) after stroke. Eur Stroke J. 2024;9(4):800-834.', pmid: '38752755' }
    ]
  },
  {
    id: 'cadasil-carasil',
    title: 'Genetic Cerebral Small Vessel Vasculopathies (CADASIL, CARASIL, Fabry, MELAS, COL4A1)',
    purpose: 'Molecular genetics, neuroimaging hallmarks (anterior temporal pole & external capsule hyperintensities, pulvinar sign), clinical phenotypes, and management pitfalls for monogenic stroke syndromes.',
    actions: 'cadasil carasil fabry melas col4a1 col4a2 notch3 htra1 gla mt-tl1 small vessel vasculopathy temporal pole o sullivan pulvinar sign l-arginine porencephaly migraine subcortical dementia',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'CADASIL Review', citation: 'Chabriat H, et al. CADASIL. Lancet Neurol. 2009;8(7):643-653.', pmid: '19539236' },
      { label: 'CARASIL Landmark', citation: 'Hara K, et al. Association of HTRA1 mutations and familial ischemic cerebral small-vessel disease. N Engl J Med. 2009;360(17):1729-1739.', pmid: '19387015' },
      { label: 'Fabry Disease Guidelines', citation: 'Ortiz A, et al. Fabry disease revisited: Management and treatment recommendations for adult patients. Mol Genet Metab. 2018;123(4):416-427.', pmid: '29530533' },
      { label: 'MELAS Management', citation: 'Koenig MK, et al. Recommendations for the Management of Strokelike Episodes in Patients With Mitochondrial Encephalomyopathy, Lactic Acidosis, and Strokelike Episodes. JAMA Neurol. 2016;73(5):591-594.', pmid: '26954033' },
      { label: 'COL4A1 Mutations', citation: 'Gould DB, et al. Mutations in Col4a1 cause perinatal cerebral hemorrhage and porencephaly. Science. 2005;308(5725):1167-1171.', pmid: '15905400' },
      { label: 'EAN Monogenic cSVD Consensus', citation: 'Mancuso M, et al. Monogenic cerebral small-vessel diseases: diagnosis and therapy. Consensus recommendations of the European Academy of Neurology. Eur J Neurol. 2020;27(6):909-927.', pmid: '32196841' }
    ]
  },
  {
    id: 'moyamoya-disease',
    title: 'Moyamoya Disease & Moyamoya Syndrome: Medical & Surgical Revascularization',
    purpose: 'Suzuki angiographic staging (1–6), direct STA-MCA bypass vs indirect EDAS/EMS, landmark JAM randomized trial for hemorrhagic Moyamoya, and strict perioperative hemodynamic/normocarbia protocols.',
    actions: 'moyamoya disease syndrome suzuki staging 1-6 sta-mca direct bypass edas ems indirect revascularization jam trial hemorrhagic puff of smoke ivy sign hyperventilation crying rnf213 sickle cell down syndrome',
    categories: ['pocket-card', 'printable', 'pediatrics'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'JAM Trial Landmark', citation: 'Miyamoto S, et al. Effects of extracranial-intracranial bypass for patients with hemorrhagic moyamoya disease: results of the Japan Adult Moyamoya Trial. Stroke. 2014;45(5):1415-1421.', pmid: '24668203' },
      { label: 'Suzuki Staging Classic', citation: 'Suzuki J, et al. Cerebrovascular \'moyamoya\' disease: Disease showing abnormal net-like vessels in base of brain. Arch Neurol. 1969;20(3):288-299.', pmid: '5775283' },
      { label: 'JSS Moyamoya Guidelines', citation: 'Research Committee on the Pathology and Treatment of Spontaneous Occlusion of the Circle of Willis. Guidelines for diagnosis and treatment of moyamoya disease (spontaneous occlusion of the circle of Willis). Neurol Med Chir (Tokyo). 2012;52(5):245-266.', pmid: '22870528' },
      { label: 'Scott & Smith Review', citation: 'Scott RM, et al. Moyamoya disease and moyamoya syndrome. N Engl J Med. 2009;360(12):1226-1237.', pmid: '19297575' },
      { label: 'ESO Moyamoya Guidelines', citation: 'Bersano A, et al. European Stroke Organisation (ESO) Guidelines on Moyamoya angiopathy Endorsed by Vascular European Reference Network (VASCERN). Eur Stroke J. 2023;8(1):55-84.', pmid: '37021176' }
    ]
  },
  {
    id: 'cancer-associated-stroke',
    title: 'Cancer-Associated Stroke, Hypercoagulability & Marantic Endocarditis (NBTE)',
    purpose: 'Pathophysiology of cancer-mediated hypercoagulability, 3-territory sign on DWI, markedly elevated D-dimer (no single validated cutoff; e.g., >3 µg/mL in the Schwarzbach DWI-phenotype cohort), non-bacterial thrombotic endocarditis (NBTE), and LMWH vs DOAC management.',
    actions: 'cancer stroke active malignancy hypercoagulability marantic endocarditis nbte non-bacterial thrombotic 3-territory sign d-dimer mucin adenocarcinoma teach lmwh dalteparin enoxaparin doac tee vegetations',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: '2026 Cancer Stroke Statement', citation: 'Navi BB, et al. Classification and Management of Ischemic Stroke in Patients With Active Cancer. Stroke. 2026.', pmid: '41623113' },
      { label: 'TEACH Trial (LMWH Pilot)', citation: 'Navi BB, et al. Enoxaparin vs Aspirin in Patients With Cancer and Ischemic Stroke: The TEACH Pilot Randomized Clinical Trial. JAMA Neurol. 2018;75(3):379-381.', pmid: '29309496' },
      { label: 'NBTE Landmark Review', citation: 'Eiken PW, et al. Surgical pathology of nonbacterial thrombotic endocarditis in 30 patients, 1985-2000. Mayo Clin Proc. 2001;76(12):1204-1212.', pmid: '11761501' },
      { label: 'Cancer Stroke Risk Study', citation: 'Navi BB, et al. Risk of Arterial Thromboembolism in Patients With Cancer. J Am Coll Cardiol. 2017;70(8):926-938.', pmid: '28818202' },
      { label: 'Cancer Stroke DWI Phenotype', citation: 'Schwarzbach CJ, et al. DWI Lesion Patterns in Cancer-Related Stroke - Specifying the Phenotype. Cerebrovasc Dis Extra. 2015;5(3):139-145.', pmid: '26648971' }
    ]
  },
  {
    id: 'dmvo-mevo-management',
    title: 'Distal Medium Vessel Occlusions (DMVO/MeVO)',
    purpose: 'Evaluation, anatomical classification (M2/M3, A2/A3, P2/P3), trial evidence (DISTAL, ESCAPE-MeVO), disabling deficit thresholds, microcatheter techniques, and perforation risk management.',
    actions: 'dmvo mevo distal medium vessel occlusion distal escape-mevo choice choice-2 m2 m3 a2 a3 p2 p3 microcatheter mini-stentriever intra-arterial alteplase disabling deficit eloquent cortex perforation risk',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'DISTAL Trial', citation: 'Psychogios M, et al. Endovascular Treatment for Stroke Due to Occlusion of Medium or Distal Vessels (DISTAL). N Engl J Med. 2025;392(14):1374-1384.', pmid: '39908430' },
      { label: 'DISTAL 12-Month', citation: 'Fischer U, et al. Endovascular treatment for medium or distal vessel occlusion stroke (DISTAL): 12-month outcomes. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
      { label: 'ESCAPE-MeVO Trial', citation: 'Goyal M, et al. Endovascular Treatment of Stroke Due to Medium-Vessel Occlusion (ESCAPE-MeVO). N Engl J Med. 2025;392(14):1385-1395.', pmid: '39908448' },
      { label: 'CHOICE Trial', citation: 'Renú A, et al. Effect of Intra-arterial Alteplase vs Placebo Following Successful Thrombectomy on Functional Outcomes (CHOICE). JAMA. 2022;327(9):826-835.', pmid: '35143603' },
      { label: 'CHOICE-2 Trial', citation: 'Renú A, et al. Adjunctive Intra-Arterial Alteplase After Successful Thrombectomy for Acute Ischemic Stroke (CHOICE-2). JAMA. 2026.', pmid: '42096239' },
      { label: 'TEMPO-2 Trial', citation: 'Coutts SB, et al. Tenecteplase versus standard of care for minor ischaemic stroke with proven occlusion (TEMPO-2). Lancet. 2024;403(10444):2597-2605.', pmid: '38768626' },
      { label: 'AHA/ASA 2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
    ]
  },
  {
    id: 'ich-blood-pressure',
    title: 'Acute ICH Blood Pressure & Expansion Mitigation',
    purpose: 'Population-specific ICH blood-pressure evidence, INTERACT3 bundle limitations, expansion-mitigation trials and surgical assessment. Infusion titration requires a complete monitored prescription.',
    actions: 'ich intracerebral hemorrhage blood pressure sbp 140 expansion interact-2 interact-3 atach-2 enrich trident fastest switch minimally invasive surgery hematoma nicardipine clevidipine care bundle',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'INTERACT-2', citation: 'Anderson CS, et al. Rapid blood-pressure lowering in patients with acute intracerebral hemorrhage (INTERACT2). N Engl J Med. 2013;368(25):2355-2365.', pmid: '23713578' },
      { label: 'ATACH-2', citation: 'Qureshi AI, et al. Intensive Blood-Pressure Lowering in Patients with Acute Cerebral Hemorrhage (ATACH-2). N Engl J Med. 2016;375(11):1033-1043.', pmid: '27276234' },
      { label: 'INTERACT3', citation: 'Ma L, et al. The third Intensive Care Bundle with Blood Pressure Reduction in Acute Cerebral Haemorrhage Trial (INTERACT3): an international, stepped wedge cluster randomised controlled trial. Lancet. 2023;402(10395):27-40.', pmid: '37245517' },
      { label: 'ENRICH Trial', citation: 'Pradilla G, et al. Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH). N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
      { label: 'TRIDENT Trial', citation: 'Anderson CS, et al. Three Low-Dose Antihypertensive Agents in a Single Pill after Intracerebral Hemorrhage (TRIDENT). N Engl J Med. 2026;394(16):1571-1582.', pmid: '42019018' },
      { label: 'FASTEST Trial', citation: 'Broderick JP, et al. Recombinant factor VIIa versus placebo for spontaneous intracerebral haemorrhage within 2 h of symptom onset (FASTEST): a multicentre, double-blind, randomised, placebo-controlled, phase 3 trial. Lancet. 2026;407(10530):773-783.', pmid: '41653933' },
      { label: 'SWITCH Trial', citation: 'Beck J, et al. Decompressive craniectomy plus best medical treatment versus best medical treatment alone for spontaneous severe deep supratentorial intracerebral haemorrhage (SWITCH): a randomised controlled clinical trial. Lancet. 2024;403(10442):2395-2404.', pmid: '38761811' },
      { label: '2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'INTERACT4 Trial', citation: 'Li G, et al. Intensive Ambulance-Delivered Blood-Pressure Reduction in Hyperacute Stroke (INTERACT4). N Engl J Med. 2024;390(20):1862-1872.', pmid: '38752650' },
      { label: 'TICH-2 Trial', citation: 'Sprigg N, et al. Tranexamic acid for hyperacute primary IntraCerebral Haemorrhage (TICH-2). Lancet. 2018;391(10135):2107-2115.', pmid: '29778325' }
    ]
  },
  {
    id: 'metabolic-stroke-prevention',
    title: 'Metabolic & Vascular Risk Modulation',
    purpose: 'Comprehensive metabolic and vascular risk modulation in stroke prevention — GLP-1 receptor agonists (SELECT, FLOW, SUSTAIN-6), SGLT2 inhibitors, blood pressure lowering (SPRINT and RESPECT intensive targets; TRIDENT low-dose triple pill after ICH), MASH/obesity management, and the secondary prevention ABCDE bundle.',
    actions: 'metabolic glp-1 glp-1 receptor agonists semaglutide tirzepatide sglt2 inhibitors select flow sustain-6 sprint trident respect abcde bundle secondary prevention ldl obesity diabetes mash blood pressure targets',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'SELECT Trial', citation: 'Lincoff AM, et al. Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT). N Engl J Med. 2023;389(24):2221-2232.', pmid: '37952131' },
      { label: 'FLOW Trial', citation: 'Perkovic V, et al. Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes (FLOW). N Engl J Med. 2024;391(2):109-121.', pmid: '38785209' },
      { label: 'SUSTAIN-6 Trial', citation: 'Marso SP, et al. Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes (SUSTAIN-6). N Engl J Med. 2016;375(19):1834-1844.', pmid: '27633186' },
      { label: 'SPRINT Trial', citation: 'Wright JT Jr, et al. A Randomized Trial of Intensive versus Standard Blood-Pressure Control (SPRINT). N Engl J Med. 2015;373(22):2103-2116.', pmid: '26551272' },
      { label: 'TRIDENT Trial', citation: 'Anderson CS, et al. Three Low-Dose Antihypertensive Agents in a Single Pill after Intracerebral Hemorrhage (TRIDENT). N Engl J Med. 2026;394(16):1571-1582.', pmid: '42019018' },
      { label: 'RESPECT Trial', citation: 'Kitagawa K, et al. Effect of Standard vs Intensive Blood Pressure Control on the Risk of Recurrent Stroke: A Randomized Clinical Trial and Meta-analysis (RESPECT). JAMA Neurol. 2019;76(11):1309-1318.', pmid: '31355878' },
      { label: 'SPRINT MIND', citation: 'Williamson JD, et al. Effect of Intensive vs Standard Blood Pressure Control on Probable Dementia: A Randomized Clinical Trial (SPRINT MIND). JAMA. 2019;321(6):553-561.', pmid: '30688979' }
    ]
  },
  {
    id: 'device-detected-subclinical-af',
    title: 'Device-Detected & Subclinical AF',
    purpose: 'Whether to anticoagulate an atrial high-rate episode found on a pacemaker, ICD, CRT device or insertable cardiac monitor: duration bands, mandatory electrogram adjudication, NOAH-AFNET 6 vs ARTESiA, the pooled meta-analysis, and absolute-risk framing.',
    actions: 'device detected atrial fibrillation subclinical af scaf ahre atrial high rate episode pacemaker icd crt insertable cardiac monitor loop recorder icm noah-afnet 6 edoxaban artesia apixaban assert loop trial duration burden 6 minutes 24 hours electrogram adjudication anticoagulation nnt nnh chads vasc cryptogenic',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'NOAH-AFNET 6 Trial', citation: 'Kirchhof P, et al. Anticoagulation with Edoxaban in Patients with Atrial High-Rate Episodes. N Engl J Med. 2023;389(13):1167-1179.', pmid: '37622677' },
      { label: 'ARTESiA Trial', citation: 'Healey JS, et al. Apixaban for Stroke Prevention in Subclinical Atrial Fibrillation. N Engl J Med. 2024;390(2):107-117.', pmid: '37952132' },
      { label: 'NOAH/ARTESiA Meta-Analysis', citation: 'McIntyre WF, et al. Direct Oral Anticoagulants for Stroke Prevention in Patients With Device-Detected Atrial Fibrillation: A Study-Level Meta-Analysis of the NOAH-AFNET 6 and ARTESiA Trials. Circulation. 2024;149(13):981-988.', pmid: '37952187' },
      { label: 'ARTESiA Prior Stroke/TIA Subgroup', citation: 'Shoamanesh A, et al. Apixaban versus aspirin for stroke prevention in people with subclinical atrial fibrillation and a history of stroke or transient ischaemic attack: subgroup analysis of the ARTESiA randomised controlled trial. Lancet Neurol. 2025;24(2):140-151.', pmid: '39862882' },
      { label: 'LOOP Study', citation: 'Svendsen JH, et al. Implantable loop recorder detection of atrial fibrillation to prevent stroke (The LOOP Study): a randomised controlled trial. Lancet. 2021;398(10310):1507-1516.', pmid: '34469766' },
      { label: 'ASSERT Trial', citation: 'Healey JS, et al. Subclinical atrial fibrillation and the risk of stroke. N Engl J Med. 2012;366(2):120-129.', pmid: '22236222' },
      { label: 'ASSERT Duration Analysis', citation: 'Van Gelder IC, et al. Duration of device-detected subclinical atrial fibrillation and occurrence of stroke in ASSERT. Eur Heart J. 2017;38(17):1339-1344.', pmid: '28329139' }
    ]
  },
  {
    id: 'ich-surgical-decision-making',
    title: 'ICH Surgical Decision-Making',
    purpose: 'Trial-specific evidence for hematoma evacuation, selected minimally invasive surgery, decompression and urgent cerebellar-ICH assessment; observational associations and prognosis limits are explicit.',
    actions: 'ich intracerebral hemorrhage surgery surgical decision evacuation craniotomy stich stich ii mistie iii enrich clear iii switch minimally invasive parafascicular mips stereotactic catheter alteplase intraventricular ivh evd external ventricular drain hydrocephalus cerebellar posterior fossa suboccipital decompression upward herniation decompressive craniectomy basal ganglia thalamic lobar hematoma volume end of treatment 15 ml goals of care trial eligibility',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'STICH', citation: 'Mendelow AD, et al. Early surgery versus initial conservative treatment in patients with spontaneous supratentorial intracerebral haematomas (STICH): a randomised trial. Lancet. 2005;365(9457):387-397.', pmid: '15680453' },
      { label: 'STICH II', citation: 'Mendelow AD, et al. Early surgery versus initial conservative treatment in patients with spontaneous supratentorial lobar intracerebral haematomas (STICH II): a randomised trial. Lancet. 2013;382(9890):397-408.', pmid: '23726393' },
      { label: 'MISTIE III', citation: 'Hanley DF, et al. Efficacy and safety of minimally invasive surgery with thrombolysis in intracerebral haemorrhage evacuation (MISTIE III): a randomised, controlled, open-label, blinded endpoint phase 3 trial. Lancet. 2019;393(10175):1021-1032.', pmid: '30739747' },
      { label: 'ENRICH Trial', citation: 'Pradilla G, et al. Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH). N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
      { label: 'CLEAR III', citation: 'Hanley DF, et al. Thrombolytic removal of intraventricular haemorrhage in treatment of severe stroke: results of the randomised, multicentre, multiregion, placebo-controlled CLEAR III trial. Lancet. 2017;389(10069):603-611.', pmid: '28081952' },
      { label: 'SWITCH Trial', citation: 'Beck J, et al. Decompressive craniectomy plus best medical treatment versus best medical treatment alone for spontaneous severe deep supratentorial intracerebral haemorrhage (SWITCH): a randomised controlled clinical trial. Lancet. 2024;403(10442):2395-2404.', pmid: '38761811' },
      { label: 'Cerebellar ICH Meta-analysis', citation: 'Kuramatsu JB, et al. Association of Surgical Hematoma Evacuation vs Conservative Treatment With Functional Outcome in Patients With Cerebellar Intracerebral Hemorrhage. JAMA. 2019;322(14):1392-1403.', pmid: '31593272' }
    ]
  },
  {
    id: 'evt-periprocedural-care',
    title: 'EVT Technique & Post-Thrombectomy Care',
    purpose: 'Anesthesia, procedural evidence and individualized post-EVT care, including the distinction between an active BP target, spontaneous pressure and newer selected-strategy evidence.',
    actions: 'evt thrombectomy periprocedural post thrombectomy care post evt blood pressure enchanted2 enchanted2mt optimal-bp bp-target best-ii post reperfusion sbp target floor ceiling 180/105 mtici tici 2b anesthesia general anesthesia conscious sedation procedural sedation siesta goliath gass induction hypotension stent retriever contact aspiration aster aster2 compass combined technique first pass effect fpe pass count futile recanalization balloon guide catheter bgc protect-mt angel-reboot bailout angioplasty stenting rescue bt tirofiban glycoprotein iib iiia icad emboli new territory vessel perforation post evt subarachnoid contrast staining dual energy ct femoral radial access handoff neuro icu',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'ENCHANTED2/MT Trial', citation: 'Yang P, et al. Intensive blood pressure control after endovascular thrombectomy for acute ischaemic stroke (ENCHANTED2/MT): a multicentre, open-label, blinded-endpoint, randomised controlled trial. Lancet. 2022;400(10363):1585-1596.', pmid: '36341753' },
      { label: 'OPTIMAL-BP Trial', citation: 'Nam HS, et al. Intensive vs Conventional Blood Pressure Lowering After Endovascular Thrombectomy in Acute Ischemic Stroke: The OPTIMAL-BP Randomized Clinical Trial. JAMA. 2023;330(9):832-842.', pmid: '37668619' },
      { label: 'BEST-II Trial', citation: 'Mistry EA, et al. Blood Pressure Management After Endovascular Therapy for Acute Ischemic Stroke: The BEST-II Randomized Clinical Trial. JAMA. 2023;330(9):821-831.', pmid: '37668620' },
      { label: 'BP-TARGET Trial', citation: 'Mazighi M, et al. Safety and efficacy of intensive blood pressure lowering after successful endovascular therapy in acute ischaemic stroke (BP-TARGET): a multicentre, open-label, randomised controlled trial. Lancet Neurol. 2021;20(4):265-274.', pmid: '33647246' },
      { label: 'PROTECT-MT Trial', citation: 'Liu J, et al. Balloon guide catheters for endovascular thrombectomy in patients with acute ischaemic stroke due to large-vessel occlusion in China (PROTECT-MT): a multicentre, open-label, blinded-endpoint, randomised controlled trial. Lancet. 2024;404(10468):2165-2174.', pmid: '39579782' },
      { label: 'ANGEL-REBOOT Trial', citation: 'Gao F, et al. Bailout intracranial angioplasty or stenting following thrombectomy for acute large vessel occlusion in China (ANGEL-REBOOT): a multicentre, open-label, blinded-endpoint, randomised controlled trial. Lancet Neurol. 2024;23(8):797-806.', pmid: '38914085' },
      { label: 'GA vs Sedation IPD Meta-Analysis', citation: 'Schönenberger S, et al. Association of General Anesthesia vs Procedural Sedation With Functional Outcome Among Patients With Acute Ischemic Stroke Undergoing Thrombectomy: A Systematic Review and Meta-analysis. JAMA. 2019;322(13):1283-1293.', pmid: '31573636' }
    ]
  },
  {
    id: 'intracranial-atherosclerosis',
    title: 'Intracranial Atherosclerotic Disease',
    purpose: 'Mechanism-first diagnosis and treatment of symptomatic intracranial atherosclerotic stenosis — artery-to-artery embolism, branch atheromatous perforator occlusion and hemodynamic borderzone failure; the SAMMPRIS aggressive medical bundle; and why stenting (SAMMPRIS, CASSISS), bypass for symptomatic atherosclerotic ICA/MCA occlusive disease (CMOSS, COSS, EC/IC 1985) and bailout angioplasty (ANGEL-REBOOT) all failed their primary endpoints.',
    actions: 'intracranial atherosclerosis icad icas stenosis wasid sammpris cassiss cmoss coss ec-ic bypass angel-reboot wingspan stenting dapt aspirin clopidogrel warfarin branch atheromatous perforator borderzone hemodynamic vessel wall imaging intraplaque hemorrhage rescue stenting mca basilar',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'WASID Trial', citation: 'Chimowitz MI, et al. Comparison of Warfarin and Aspirin for Symptomatic Intracranial Arterial Stenosis (WASID). N Engl J Med. 2005;352(13):1305-1316.', pmid: '15800226' },
      { label: 'WASID High-Risk Phenotype', citation: 'Kasner SE, et al. Predictors of ischemic stroke in the territory of a symptomatic intracranial arterial stenosis. Circulation. 2006;113(4):555-563.', pmid: '16432056' },
      { label: 'WASID Blood Pressure Analysis', citation: 'Turan TN, et al. Relationship between blood pressure and stroke recurrence in patients with intracranial arterial stenosis. Circulation. 2007;115(23):2969-2975.', pmid: '17515467' },
      { label: 'SAMMPRIS Trial', citation: 'Chimowitz MI, et al. Stenting versus Aggressive Medical Therapy for Intracranial Arterial Stenosis (SAMMPRIS). N Engl J Med. 2011;365(11):993-1003.', pmid: '21899409' },
      { label: 'SAMMPRIS Final Results', citation: 'Derdeyn CP, et al. Aggressive medical treatment with or without stenting in high-risk patients with intracranial artery stenosis (SAMMPRIS): the final results of a randomised trial. Lancet. 2014;383(9914):333-341.', pmid: '24168957' },
      { label: 'CASSISS Trial', citation: 'Gao P, et al. Effect of Stenting Plus Medical Therapy vs Medical Therapy Alone on Risk of Stroke and Death in Patients With Symptomatic Intracranial Stenosis (CASSISS). JAMA. 2022;328(6):534-542.', pmid: '35943472' },
      { label: 'CMOSS Trial', citation: 'Ma Y, et al. Extracranial-Intracranial Bypass and Risk of Stroke and Death in Patients With Symptomatic Artery Occlusion (CMOSS). JAMA. 2023;330(8):704-714.', pmid: '37606672' }
    ]
  },
  {
    id: 'unruptured-intracranial-aneurysm',
    title: 'Unruptured Intracranial Aneurysm: Rupture Risk vs Treatment Risk',
    purpose: 'Counseling an incidental unruptured intracranial aneurysm: separating symptomatic from truly incidental presentations, quantifying 5-year rupture risk with PHASES (and its limits), the ISUIA and UCAS Japan natural-history data, ELAPSS growth prediction, the procedural-risk side of the ledger (endovascular vs neurosurgical), and a surveillance protocol with scripts for the two hard conversations.',
    actions: 'unruptured intracranial aneurysm uia incidental incidentaloma phases score isuia ucas japan elapss growth daughter sac irregular contour five year rupture risk annual rupture rate surveillance interval tof mra cta dsa clipping coiling flow diversion flow diverter pipeline premier web-it intrasaccular dual antiplatelet uiats treatment risk procedural morbidity case fatality algra adpkd polycystic kidney family history screening first-degree relatives smoking hypertension third nerve palsy sentinel headache posterior communicating counseling script second aneurysm',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'PHASES Score', citation: 'Greving JP, et al. Development of the PHASES score for prediction of risk of rupture of intracranial aneurysms: a pooled analysis of six prospective cohort studies. Lancet Neurol. 2014;13(1):59-66.', pmid: '24290159' },
      { label: 'ISUIA', citation: 'Wiebers DO, et al. Unruptured intracranial aneurysms: natural history, clinical outcome, and risks of surgical and endovascular treatment. Lancet. 2003;362(9378):103-110.', pmid: '12867109' },
      { label: 'UCAS Japan', citation: 'Morita A, et al. The natural course of unruptured cerebral aneurysms in a Japanese cohort. N Engl J Med. 2012;366(26):2474-2482.', pmid: '22738097' },
      { label: 'ELAPSS Score', citation: 'Backes D, et al. ELAPSS score for prediction of risk of growth of unruptured intracranial aneurysms. Neurology. 2017;88(17):1600-1606.', pmid: '28363976' },
      { label: 'Growth and Rupture', citation: 'Villablanca JP, et al. Natural history of asymptomatic unruptured cerebral aneurysms evaluated at CT angiography: growth and rupture incidence and correlation with epidemiologic risk factors. Radiology. 2013;269(1):258-265.', pmid: '23821755' },
      { label: 'Treatment Risk Meta-analysis', citation: 'Algra AM, et al. Procedural Clinical Complications, Case-Fatality Risks, and Risk Factors in Endovascular and Neurosurgical Treatment of Unruptured Intracranial Aneurysms: A Systematic Review and Meta-analysis. JAMA Neurol. 2019;76(3):282-293.', pmid: '30592482' },
      { label: 'AHA/ASA 2015 UIA Guideline', citation: 'Thompson BG, et al. Guidelines for the Management of Patients With Unruptured Intracranial Aneurysms: A Guideline for Healthcare Professionals From the American Heart Association/American Stroke Association. Stroke. 2015;46(8):2368-2400.', pmid: '26089327' }
    ]
  },
  {
    id: 'prehospital-triage-systems',
    title: 'Prehospital Triage & Stroke Systems of Care',
    purpose: 'Deciding where the ambulance goes and how patients move between hospitals — mothership vs drip-and-ship and how to compute a local crossover, the neutral RACECAT result with its intracerebral hemorrhage harm signal, TRIAGE-STROKE, mobile stroke units (BEST-MSU, B_PROUD), why INTERACT4 does not support undifferentiated prehospital blood-pressure lowering, prehospital LVO scales (RACE, LAMS, C-STAT, FAST-ED), and door-in-door-out as the governing interfacility transfer metric.',
    actions: 'prehospital triage stroke systems of care ems routing mothership drip-and-ship bypass racecat triage-stroke best-msu mobile stroke unit b_proud interact4 ambulance blood pressure lvo scale race lams c-stat cpsss fast-ed door-in-door-out dido interfacility transfer prenotification telestroke stroke center certification thrombectomy capable comprehensive primary acute stroke ready',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'RACECAT', citation: 'Pérez de la Ossa N, et al. Effect of Direct Transportation to Thrombectomy-Capable Center vs Local Stroke Center on Neurological Outcomes in Patients With Suspected Large-Vessel Occlusion Stroke in Nonurban Areas (RACECAT). JAMA. 2022;327(18):1782-1794.', pmid: '35510397' },
      { label: 'RACECAT ICH Substudy', citation: 'Ramos-Pachón A, et al. Effect of Bypassing the Closest Stroke Center in Patients with Intracerebral Hemorrhage: A Secondary Analysis of the RACECAT Randomized Clinical Trial. JAMA Neurol. 2023;80(10):1028-1036.', pmid: '37603325' },
      { label: 'BEST-MSU', citation: 'Grotta JC, et al. Prospective, Multicenter, Controlled Trial of Mobile Stroke Units (BEST-MSU). N Engl J Med. 2021;385(11):971-981.', pmid: '34496173' },
      { label: 'B_PROUD', citation: 'Ebinger M, et al. Association Between Dispatch of Mobile Stroke Units and Functional Outcomes Among Patients With Acute Ischemic Stroke in Berlin (B_PROUD). JAMA. 2021;325(5):454-466.', pmid: '33528537' },
      { label: 'INTERACT4', citation: 'Li G, et al. Intensive Ambulance-Delivered Blood-Pressure Reduction in Hyperacute Stroke (INTERACT4). N Engl J Med. 2024;390(20):1862-1872.', pmid: '38752650' },
      { label: 'TRIAGE-STROKE', citation: 'Behrndtz A, et al. Transport Strategy in Patients With Suspected Acute Large Vessel Occlusion Stroke: TRIAGE-STROKE, a Randomized Clinical Trial. Stroke. 2023;54(11):2714-2723.', pmid: '37800374' },
      { label: 'Door-In-Door-Out (GWTG-Stroke)', citation: 'Stamm B, et al. Door-in-Door-out Times for Interhospital Transfer of Patients With Stroke. JAMA. 2023;330(7):636-649.', pmid: '37581671' }
    ]
  },
  {
    id: 'severe-stroke-critical-care',
    title: 'Neurocritical Care of Severe Stroke',
    purpose: 'Supportive and systemic levers in severe stroke: fever and targeted normothermia, airway and tracheostomy timing, edema pharmacotherapy, glucose, dysphagia and nutrition, VTE prophylaxis, and mobilization dose.',
    actions: 'severe stroke neurocritical care icu supportive care fever normothermia intrepid temperature management tracheostomy setpoint2 airway extubation weaning glibenclamide charm cerebral edema glucose shine hyperglycemia insulin dysphagia swallow screen aspiration pneumonia food trial peg nasogastric feeding vte prophylaxis clots 3 intermittent pneumatic compression early mobilization avert stroke unit care delirium sedation hyponatremia stunned myocardium cauti',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'INTREPID Trial', citation: 'Greer DM, et al. Fever Prevention in Patients With Acute Vascular Brain Injury: The INTREPID Randomized Clinical Trial. JAMA. 2024;332(18):1525-1534.', pmid: '39320879' },
      { label: 'SETPOINT2 Trial', citation: 'Bösel J, et al. Effect of Early vs Standard Approach to Tracheostomy on Functional Outcome at 6 Months Among Patients With Severe Stroke Receiving Mechanical Ventilation. JAMA. 2022;327(19):1899-1909.', pmid: '35506515' },
      { label: 'CHARM Trial', citation: 'Sheth KN, et al. Intravenous glibenclamide for cerebral oedema after large hemispheric stroke (CHARM): a phase 3, double-blind, placebo-controlled, randomised trial. Lancet Neurol. 2024;23(12):1205-1213.', pmid: '39577921' },
      { label: 'SHINE Trial', citation: 'Johnston KC, et al. Intensive vs Standard Treatment of Hyperglycemia and Functional Outcome in Patients With Acute Ischemic Stroke: The SHINE Randomized Clinical Trial. JAMA. 2019;322(4):326-335.', pmid: '31334795' },
      { label: 'CLOTS 3 Trial', citation: 'Dennis M, et al. Effectiveness of intermittent pneumatic compression in reduction of risk of deep vein thrombosis in patients who have had a stroke (CLOTS 3). Lancet. 2013;382(9891):516-524.', pmid: '23727163' },
      { label: 'AVERT Trial', citation: 'AVERT Trial Collaboration Group. Efficacy and safety of very early mobilisation within 24 h of stroke onset (AVERT): a randomised controlled trial. Lancet. 2015;386(9988):46-55.', pmid: '25892679' },
      { label: 'Stroke Unit Care', citation: 'Langhorne P, Ramachandra S. Organised inpatient (stroke unit) care for stroke: network meta-analysis. Cochrane Database Syst Rev. 2020;4:CD000197.', pmid: '32324916' }
    ]
  },
  {
    id: 'post-stroke-recovery',
    title: 'Post-Stroke Recovery, Cognition & Mood',
    purpose: 'Owns the recovery phase — prognosis and the sensitive window (CPASS, PREP2, AVERT), the rehabilitation setting and dose decision (LEAPS, ICARE, EXCITE), the settled negative fluoxetine question (FOCUS, AFFINITY, EFFECTS) versus the positive paired vagus nerve stimulation trial (VNS-REHAB), aphasia therapy intensity, and screening for post-stroke cognitive impairment, depression, fatigue and spasticity.',
    actions: 'recovery rehabilitation rehab setting irf snf home health outpatient dose intensity sensitive window critical period cpass prep2 avert leaps icare excite constraint induced movement therapy fluoxetine focus affinity effects ssri vns-rehab vagus nerve stimulation fugl-meyer aphasia speech language therapy big cactus post-stroke cognitive impairment psci moca delirium driving return to work depression phq-9 escitalopram pseudobulbar affect fatigue spasticity botulinum hemiplegic shoulder 90-day follow-up',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-15',
    references: [
      { label: 'FOCUS Trial', citation: 'FOCUS Trial Collaboration. Effects of fluoxetine on functional outcomes after acute stroke (FOCUS): a pragmatic, double-blind, randomised, controlled trial. Lancet. 2019;393(10168):265-274.', pmid: '30528472' },
      { label: 'AFFINITY Trial', citation: 'AFFINITY Trial Collaboration. Safety and efficacy of fluoxetine on functional outcome after acute stroke (AFFINITY): a randomised, double-blind, placebo-controlled trial. Lancet Neurol. 2020;19(8):651-660.', pmid: '32702334' },
      { label: 'EFFECTS Trial', citation: 'EFFECTS Trial Collaboration. Safety and efficacy of fluoxetine on functional recovery after acute stroke (EFFECTS): a randomised, double-blind, placebo-controlled trial. Lancet Neurol. 2020;19(8):661-669.', pmid: '32702335' },
      { label: 'VNS-REHAB Trial', citation: 'Dawson J, et al. Vagus nerve stimulation paired with rehabilitation for upper limb motor function after ischaemic stroke (VNS-REHAB): a randomised, blinded, pivotal, device trial. Lancet. 2021;397(10284):1545-1553.', pmid: '33894832' },
      { label: 'AVERT Trial', citation: 'AVERT Trial Collaboration. Efficacy and safety of very early mobilisation within 24 h of stroke onset (AVERT): a randomised controlled trial. Lancet. 2015;386(9988):46-55.', pmid: '25892679' },
      { label: 'CPASS Trial', citation: 'Dromerick AW, et al. Critical Period After Stroke Study (CPASS): A phase II clinical trial testing an optimal time for motor recovery after stroke in humans. Proc Natl Acad Sci U S A. 2021;118(39):e2026676118.', pmid: '34544853' },
      { label: 'AHA/ASA PSCI Statement', citation: 'El Husseini N, et al. Cognitive Impairment After Ischemic and Hemorrhagic Stroke: A Scientific Statement From the American Heart Association/American Stroke Association. Stroke. 2023;54(6):e272-e291.', pmid: '37125534' }
    ]
  }
];

export const EDUCATION_PRACTICE_CASES = [
  {
    id: 'onset', title: 'Recent discovery is not known onset',
    scenario: 'A person was last known well before sleep and was found with aphasia 30 minutes ago. No advanced imaging or other eligibility information is available.',
    options: ['Use discovery as onset and declare routine IV thrombolysis eligibility.', 'Preserve unknown onset and urgently assess an appropriate imaging-based pathway.', 'Exclude every reperfusion treatment because onset is unknown.'],
    answer: 1,
    feedback: ['Discovery does not establish symptom onset or last known well.', 'Correct. Record last known well and discovery separately. The available facts are insufficient to determine treatment eligibility; selected unknown-onset patients can qualify through a supported imaging-based pathway.', 'Unknown onset alone does not exclude every imaging-selected reperfusion option.'],
    changes: 'The imaging pattern, vessel findings, contraindications, functional deficit and treatment timing may change eligibility.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/41582814/', sourceLabel: 'AHA/ASA 2026 AIS guideline'
  },
  {
    id: 'severity', title: 'A partial examination is not a completed NIHSS',
    scenario: 'Only consciousness and motor items have been assessed. Language, visual fields, neglect and several other NIHSS items remain untested.',
    options: ['Count the missing items as zero.', 'Call the stroke nondisabling because the subtotal is low.', 'Keep the examination incomplete and assess the missing domains and functional impact.'],
    answer: 2,
    feedback: ['Untested items are not normal findings; use the formal scoring instructions.', 'A subtotal cannot establish severity, and a low total does not by itself mean nondisabling symptoms.', 'Correct. Preserve the incomplete state and assess the observed deficit’s effect on the person’s activities.'],
    changes: 'Completed findings, baseline function and a clearly disabling deficit can change treatment assessment.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/41582814/', sourceLabel: 'AHA/ASA 2026 AIS guideline'
  },
  {
    id: 'evt-bp', title: 'Observed BP versus an active treatment target',
    scenario: 'After successful anterior-circulation EVT, SBP is spontaneously 132 mmHg. No perfusion examination, reperfusion grade or other hemodynamic context is provided.',
    options: ['Start a vasopressor solely to exceed 140 mmHg.', 'Treat 132 as a universal goal and actively lower all higher readings.', 'There is insufficient information for a BP order; distinguish spontaneous pressure from active intensive lowering.'],
    answer: 2,
    feedback: ['The evidence against active intensive lowering does not create a universal vasopressor floor.', 'An observed value is not a universal treatment target. Population, reperfusion, stenosis and competing conditions matter.', 'Correct. Assess perfusion and the clinical trajectory, correct clinically relevant hypotension, and individualize the order. HOPE tested a selected reperfusion-guided strategy rather than each target independently.'],
    changes: 'Reperfusion grade, residual stenosis, hemorrhage, examination and systemic emergencies can change the order.',
    source: 'https://jamanetwork.com/journals/jamaneurology/fullarticle/2850074', sourceLabel: 'HOPE 2026 primary report'
  },
  {
    id: 'ahre', title: 'A device alert is not an automatic prescription',
    scenario: 'An implanted device reports a 10-minute atrial high-rate episode. Stored electrograms and stroke/bleeding risks have not been reviewed.',
    options: ['Start a DOAC for every alert longer than five minutes.', 'Confirm the episode and assess duration, clinical AF, stroke risk, bleeding risk and preferences.', 'Treat every episode shorter than 24 hours as harmless.'],
    answer: 1,
    feedback: ['The guideline combines episode duration with stroke risk and shared decision-making; it is not an automatic duration-only rule.', 'Correct. First confirm what the device recorded. Anticoagulation may be reasonable in selected higher-risk patients, with a different evidence base from clinical AF.', 'A nonsignificant comparison in one duration subgroup does not prove absence of risk.'],
    changes: 'Confirmed clinical AF, longer episodes, stroke-risk factors or high hemorrhage risk can alter the discussion.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/38033089/', sourceLabel: '2023 ACC/AHA/ACCP/HRS AF guideline'
  },
  {
    id: 'cerebellar', title: 'Size alone does not settle cerebellar ICH surgery',
    scenario: 'Two patients have a relatively small cerebellar hemorrhage. One is stable without hydrocephalus; the other deteriorates with obstructive hydrocephalus.',
    options: ['Use a small volume to exclude urgent surgery in both.', 'The deterioration and hydrocephalus require urgent neurosurgical assessment despite small volume.', 'A ventricular drain always replaces evacuation.'],
    answer: 1,
    feedback: ['Clinical deterioration, brainstem compression and obstructive hydrocephalus are separate urgent indications; volume is not the only criterion.', 'Correct. The second presentation changes urgency. Immediate surgical removal with or without EVD is recommended in the guideline’s indicated cerebellar-ICH settings.', 'EVD is not a universal substitute for posterior-fossa evacuation, and procedural decisions require neurosurgical assessment.'],
    changes: 'Imaging, consciousness, brainstem compression, hematoma size, goals and the treating team’s assessment determine management.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/35579034/', sourceLabel: 'AHA/ASA 2022 spontaneous ICH guideline'
  },
  {
    id: 'seizure', title: 'Seizure treatment versus prophylaxis',
    scenario: 'A patient with ischemic stroke has no witnessed or electrographic seizure. Another has a confirmed ongoing seizure.',
    options: ['Give routine antiseizure prophylaxis to every stroke patient.', 'Treat a confirmed seizure; do not equate this with routine prophylaxis in a patient without seizures.', 'A seizure is only important after the first week.'],
    answer: 1,
    feedback: ['Routine prophylaxis after ischemic stroke is not recommended. ICH and aSAH guidance must be read in their own populations.', 'Correct. Confirmed seizures need clinical treatment. Altered consciousness may justify EEG evaluation; neither timing alone nor a risk score creates a universal prophylaxis order.', 'Acute seizures can require urgent treatment; the early/late distinction serves a different prognostic and diagnostic purpose.'],
    changes: 'Electrographic findings, ongoing status, hemorrhage type, recurrence and drug interactions alter care.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/41582814/', sourceLabel: 'AHA/ASA 2026 AIS guideline'
  },
  {
    id: 'prognosis', title: 'A cohort estimate is not an individual ceiling',
    scenario: 'A family asks whether a historical stroke score or the need for tracheostomy proves their relative can never regain independent function.',
    options: ['Use the score or tracheostomy as a fixed ceiling on recovery.', 'Give an interpolated percentage even when the mapping is unvalidated.', 'Explain the cohort, endpoint, horizon and uncertainty, then use a longitudinal multimodal assessment.'],
    answer: 2,
    feedback: ['Neither establishes an individual recovery ceiling. Preferences, prior function, trajectory and treatment-limitation bias matter.', 'A plausible-looking interpolation is not a validated prediction; unavailable output should remain unavailable.', 'Correct. SETPOINT2 compared early with a standard tracheostomy strategy in selected ventilated patients; its endpoint does not imply that every survivor has mRS 4–5.'],
    changes: 'Serial findings, reversible confounders, prior function and the person’s goals change counseling; no single score decides withdrawal of support.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/35506515/', sourceLabel: 'SETPOINT2 primary randomized trial'
  }
];

export function EvidencePracticeCases() {
  const [answers, setAnswers] = useState({});
  return (
    <details className="rounded-xl border border-line bg-card p-4 education-practice-cases">
      <summary className="cursor-pointer min-h-[44px] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-600">Practice applying evidence · seven synthetic cases</summary>
      <p className="text-sm text-ink-2 my-3">These short cases teach applicability and uncertainty. They do not provide patient-specific treatment orders.</p>
      <div className="space-y-4">
        {EDUCATION_PRACTICE_CASES.map((item) => (
          <fieldset key={item.id} className="rounded-lg border border-line p-4">
            <legend className="font-semibold text-ink px-1">{item.title}</legend>
            <p className="text-sm text-ink-2 mb-3">{item.scenario}</p>
            <div className="space-y-2">
              {item.options.map((option, index) => (
                <label key={option} className="flex items-start gap-3 min-h-[44px] rounded-lg border border-line p-3 cursor-pointer text-sm text-ink-2">
                  <input type="radio" name={`practice-${item.id}`} value={index} checked={answers[item.id] === index} onChange={() => setAnswers((old) => ({ ...old, [item.id]: index }))} className="mt-1" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div aria-live="polite" className="text-sm text-ink-2 mt-3">
              {answers[item.id] !== undefined && <p><strong>{answers[item.id] === item.answer ? 'Supported answer. ' : 'Reconsider. '}</strong>{item.feedback[answers[item.id]]}</p>}
            </div>
            <details className="mt-2 text-sm text-ink-2">
              <summary className="cursor-pointer min-h-[44px] font-semibold">What could change the answer?</summary>
              <p>{item.changes}</p>
              <a href={item.source} target="_blank" rel="noopener noreferrer" className="underline">{item.sourceLabel}</a>
            </details>
          </fieldset>
        ))}
      </div>
    </details>
  );
}

// Deep-link keys that are category views rather than module ids. Deep-link
// audiences map onto the module tags actually in use: modules carry a
// 'quality' tag (not 'nursing'), so the nurse-education deep link filters the
// dashboard to the Quality Metrics category.
const CATEGORY_DEEP_LINKS = {
  'pocket-cards': 'pocket-card',
  'icu': 'icu',
  'simulators': 'simulators',
  'nursing': 'quality',
  'onboarding': 'all'
};

// =====================================================================
// MAIN EDUCATION MODULE EXPORT
// =====================================================================
export default function Education({ activeSubTab, onSubTabChange, onBack, copyToClipboard, addToast, navigateTo, isTraineeMode = true, workflowContext = null, contextHiddenIds = null }) {
  const subTab = activeSubTab;
  const onNavigate = onSubTabChange || (() => {});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'infographic'
  const detailHeadingRef = useRef(null);
  const libraryHeadingRef = useRef(null);
  const moduleButtonsRef = useRef(new Map());
  const originModuleIdRef = useRef(null);
  const previousSubTabRef = useRef(null);

  useEffect(() => {
    const isModule = EDUCATION_MODULES.some((module) => module.id === subTab);
    const wasModule = EDUCATION_MODULES.some((module) => module.id === previousSubTabRef.current);
    if (isModule) {
      detailHeadingRef.current?.focus();
    } else if (wasModule) {
      const origin = moduleButtonsRef.current.get(originModuleIdRef.current);
      (origin || libraryHeadingRef.current)?.focus();
    }
    previousSubTabRef.current = subTab;
  }, [subTab]);

  // Reset viewMode when switching sub-tabs
  useEffect(() => {
    setViewMode('dashboard');
  }, [subTab]);

  useEffect(() => {
    if (activeSubTab) {
      const targetKey = CATEGORY_DEEP_LINKS[activeSubTab];
      if (targetKey) {
        setSelectedCategory(targetKey);
        onNavigate(null);
      }
    }
  }, [activeSubTab, onNavigate]);

  // Only categories that actually match modules get a chip; dead chips
  // ('epic', 'trials', 'needs-review') matched zero modules and were removed.
  const categories = [
    { key: "all", label: "All Modules" },
    { key: "simulators", label: "Interactive Simulators" },
    { key: "pocket-card", label: "Pocket Cards" },
    { key: "printable", label: "Printable / Infographics" },
    { key: "icu", label: "Neuro ICU / NCC" },
    { key: "quality", label: "Quality Metrics" },
    { key: "pediatrics", label: "Pediatrics" },
  ];

  const filteredModules = useMemo(() => {
    return EDUCATION_MODULES.filter(m => {
      // Workflow-context filter: hide only modules the active context (from the
      // /content data layer) explicitly excludes. Empty/absent set hides nothing.
      if (contextHiddenIds && contextHiddenIds.has(m.id)) return false;
      if (selectedCategory !== "all" && !m.categories.includes(selectedCategory)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return m.title.toLowerCase().includes(q) ||
               m.purpose.toLowerCase().includes(q) ||
               m.actions.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, search, contextHiddenIds]);

  // Unknown deep-link (a subTab that is neither a module id nor a category
  // key): fall back to the dashboard with a visible note instead of silently
  // showing an unexplained view.
  const moduleNotFound = Boolean(
    subTab &&
    !CATEGORY_DEEP_LINKS[subTab] &&
    !EDUCATION_MODULES.some(m => m.id === subTab)
  );

  // Render individual full detail view
  if (subTab) {
    const activeModule = EDUCATION_MODULES.find(m => m.id === subTab);
    if (activeModule) {
      return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate(null)}
            className="no-print inline-flex items-center gap-2 text-sm text-cobalt-700 hover:text-cobalt-900 font-semibold mb-2 min-h-[44px] dark:text-cobalt-300"
            aria-label="Back to Educational Resources dashboard"
          >
            <i aria-hidden="true" data-lucide="arrow-right" className="w-4 h-4 rotate-180"></i>
            Back to Educational Resources
          </button>

          <div className="bg-card border border-line rounded-lg shadow-sm overflow-hidden p-6 space-y-6">
            <header className="border-b border-line pb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase text-mute tracking-wider mb-1">Clinical Cards 2026</p>
                <h1 ref={detailHeadingRef} tabIndex={-1} className="font-serif text-2xl text-ink font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-600">{activeModule.title}</h1>
              </div>
            </header>

            {/* Custom Content for each SubModule */}
            <section id="resource-view-content" className="space-y-6 text-sm text-ink-2">
              {renderSubModuleContent(activeModule.id, viewMode, onNavigate, copyToClipboard, addToast)}
            </section>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="education-library space-y-6 max-w-6xl mx-auto">
      <header className="education-library-header bg-card border border-line rounded-lg p-6 space-y-2">
        <p className="font-mono text-xs uppercase text-mute tracking-wider">Teaching library · {EDUCATION_MODULES.length} modules</p>
        <h1 ref={libraryHeadingRef} tabIndex={-1} className="font-serif text-2xl text-ink font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-600">Educational Resources</h1>
        <p className="text-sm text-ink-2 max-w-2xl">
          Source-linked stroke teaching and clinical reference, with study limitations and treatment context.
        </p>
      </header>

      {moduleNotFound && (
        <div className="bg-card border border-line rounded-lg p-4">
          <p className="text-sm text-ink-2">
            Module <span className="font-mono">{subTab}</span> was not found — showing all modules instead.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="education-module-search" className="text-sm font-semibold text-ink">Find a topic</label>
        <input id="education-module-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, scores or trials" className="w-full min-h-[44px] rounded-lg border border-line bg-card px-3 text-ink focus-visible:ring-2 focus-visible:ring-cobalt-600" />
        <p role="status" className="text-xs text-mute">{filteredModules.length} matching modules</p>
      </div>
      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter education modules by category">
        {categories.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors min-h-[36px] ${
                active
                  ? 'bg-cobalt-600 text-white border-cobalt-600'
                  : 'bg-slate-100 hover:bg-cobalt-100 text-slate-700 hover:text-cobalt-700 border-line hover:border-cobalt-300 dark:bg-paper-2 dark:hover:bg-cobalt-800 dark:text-ink-2 dark:hover:text-cobalt-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <EvidencePracticeCases />

      {/* Modules Dashboard Grid */}
      <section className="education-module-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Education modules">
        {filteredModules.map(m => (
          <button
            type="button"
            aria-label={`Open ${m.title}`}
            key={m.id}
            ref={(node) => { if (node) moduleButtonsRef.current.set(m.id, node); else moduleButtonsRef.current.delete(m.id); }}
            onClick={() => {
              if (m.external && m.url) {
                window.open(m.url, '_blank', 'noopener,noreferrer');
              } else {
                originModuleIdRef.current = m.id;
                onNavigate(m.id);
              }
            }}
            className="education-module-button v7-card cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-all bg-card min-h-[220px] text-left w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt-600"
          >
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-base text-ink">{m.title}</h2>
              <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">{m.purpose}</p>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">Open →</span>
            </div>
          </button>
        ))}
        {filteredModules.length === 0 && (
          <div className="col-span-full bg-card border border-line rounded-lg p-10 text-center">
            <p className="text-sm text-mute">Bedside teaching cards and curricula will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// =====================================================================
// SCALED CARD WRAPPER FOR RESPONSIVE DISPLAY (NO SCROLLING)
// =====================================================================
function ScaledCardWrapper({ children, isLandscape }) {
  const containerRef = React.useRef(null);
  const [scale, setScale] = useState(1);
  const [readingView, setReadingView] = useState(true);
  const origWidth = isLandscape ? 1275 : 825;
  const origHeight = isLandscape ? 825 : 1275;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement.getBoundingClientRect().width;
        const availableWidth = Math.max(280, parentWidth - 32);
        const s = availableWidth / origWidth;
        setScale(Math.min(1, s));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [origWidth]);

  return (
    <div className={`education-card-reader${readingView ? ' education-card-readable' : ''}`}>
      <div className="education-reader-toolbar flex flex-wrap items-center gap-2 mb-3 print:hidden" role="group" aria-label="Teaching card display">
        <button type="button" aria-pressed={!readingView} onClick={() => setReadingView(false)} className="min-h-[44px] px-3 rounded-lg border border-line text-sm font-semibold focus-visible:ring-2 focus-visible:ring-teal-500">Fit card</button>
        <button type="button" aria-pressed={readingView} onClick={() => setReadingView(true)} className="min-h-[44px] px-3 rounded-lg border border-line text-sm font-semibold focus-visible:ring-2 focus-visible:ring-teal-500">Reading view</button>
        <span className="text-xs text-mute">Reading view enlarges text and reflows columns.</span>
      </div>
      <style>{`
        @media screen {
          .education-card-readable .bedside-card-view,
          .education-card-readable .card-wrapper,
          .education-card-readable .landscape-card,
          .education-card-readable .card-container,
          .education-card-readable .card-content,
          .education-card-reader.education-card-readable .bedside-card-view.screen-layout .landscape-card,
          .education-card-reader.education-card-readable .bedside-card-view.screen-layout .landscape-card .card-container {
            width: 100% !important; max-width: 100% !important;
            height: auto !important; min-height: 0 !important;
            min-width: 0 !important; overflow: visible !important;
          }
          .education-card-reader.education-card-readable .bedside-card-view .card-container { padding: 16px !important; }
          .education-card-readable .card-content :is(div, p, li, ul, ol, td, th, span, a, label) {
            font-size: 15px !important; line-height: 1.55 !important;
          }
          .education-card-readable .card-content strong { font-size: inherit !important; }
          .education-card-readable .card-content h1 { font-size: 24px !important; }
          .education-card-readable .card-content :is(h2, h3, h4) { font-size: 18px !important; line-height: 1.35 !important; }
          .education-card-readable :is([style*="grid-template-columns"], .toast-grid, .checklist-grid) { grid-template-columns: minmax(0, 1fr) !important; }
          .education-card-readable .card-content table {
            display: table; max-width: 100%; width: 100%;
            font-size: 14px !important; -webkit-overflow-scrolling: touch;
          }
          .education-card-readable .card-content :is(th, td) { min-width: 120px; padding: 8px !important; }
          .education-card-readable .clinical-scroll-region { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .education-card-readable .clinical-scroll-region:focus-visible { outline: 3px solid var(--teal); outline-offset: 3px; }
          .education-card-readable .card-content img { max-width: 100%; height: auto; }
          .education-card-readable .card-content .ref-citation { overflow-wrap: anywhere; margin-top: 16px !important; }
        }
      `}</style>
    <div
      ref={containerRef}
      className="education-reader-content"
      style={{
        width: '100%',
        height: readingView ? 'auto' : `${origHeight * scale}px`,
        overflow: readingView ? 'visible' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <div
        style={{
          transform: readingView ? 'none' : `scale(${scale})`,
          transformOrigin: 'top center',
          width: readingView ? '100%' : `${origWidth}px`,
          height: readingView ? 'auto' : `${origHeight}px`,
          flexShrink: 0
        }}
      >
        {children}
      </div>
    </div>
    </div>
  );
}

const PdfActionBar = ({ title, subtitle, pdfPath, pdfName, iconColorClass = "text-cobalt-600 dark:text-cobalt-400", children }) => {
  const [showPdf, setShowPdf] = useState(false);

  const isHttp = window.location.protocol.startsWith('http');
  const buildVersion = '6.9.24';

  // Extract clean path and cache-busted path. When no pdfPath is provided the
  // module has no downloadable PDF on disk — render the header and card only,
  // with no Preview/Download/Email actions (they would otherwise point at the
  // app page itself and 404-shaped dead ends).
  const hasPdf = Boolean(pdfPath);
  const cleanPath = pdfPath ? pdfPath.split('?')[0] : '';
  const resolvedPath = isHttp ? `${cleanPath}?v=${buildVersion}` : cleanPath;

  const emailDoc = () => {
    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/' + cleanPath;
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(fullUrl);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Action Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700/60 gap-3 no-print">
        <div className="flex items-center gap-2">
          <i aria-hidden="true" data-lucide="file-output" className={`w-5 h-5 ${iconColorClass}`}></i>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {hasPdf && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPdf(!showPdf)}
              className="px-3.5 py-1.5 bg-cobalt-600 text-white rounded-lg text-xs font-semibold hover:bg-cobalt-700 transition-colors flex items-center gap-1.5"
            >
              <i aria-hidden="true" data-lucide="eye" className="w-3.5 h-3.5"></i>
              {showPdf ? "Hide PDF Preview" : "Preview PDF"}
            </button>
            <a
              href={resolvedPath}
              download={pdfName}
              className="px-3.5 py-1.5 border border-line bg-white text-ink rounded-lg text-xs font-semibold hover:border-cobalt-300 hover:bg-cobalt-50 transition-colors flex items-center gap-1.5 dark:bg-card dark:hover:bg-cobalt-900"
            >
              <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
              Download
            </a>
            <button
              onClick={emailDoc}
              className="px-3.5 py-1.5 border border-line bg-white text-ink rounded-lg text-xs font-semibold hover:border-cobalt-300 hover:bg-cobalt-50 transition-colors flex items-center gap-1.5 dark:bg-card dark:hover:bg-cobalt-900"
            >
              <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
              Email
            </button>
          </div>
        )}
      </div>

      {hasPdf && showPdf && (
        <div className="border border-slate-200 dark:border-line rounded-xl overflow-hidden bg-white dark:bg-card shadow-md h-[800px] no-print">
          <iframe
            src={resolvedPath}
            className="w-full h-full border-none"
            title={`${title} PDF`}
          />
        </div>
      )}

      {children}
    </div>
  );
};

const ToastClassificationView = () => {
  return (
    <PdfActionBar
      title="Stroke Classification"
      subtitle="TOAST Subtype Reference Guide"
      pdfPath="documents/references/TOAST Stroke Classification.pdf"
      pdfName="TOAST Stroke Classification.pdf"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <ToastClassificationCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

const DaptRegimensView = () => {
  return (
    <PdfActionBar
      title="DAPT for Non-Cardioembolic Ischemic Stroke"
      subtitle="DAPT Guidelines Reference Card"
      pdfPath="documents/references/DAPT Guidelines.pdf"
      pdfName="DAPT Guidelines.pdf"
      iconColorClass="text-teal-600 dark:text-teal-400"
    >
      <ScaledCardWrapper isLandscape={true}>
        <BedsidePocketCardsStyles />
        <DaptRegimensCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

const MalignantInfarctionView = () => {
  return (
    <PdfActionBar
      title="Malignant Infarction"
      subtitle="Decompressive Hemicraniectomy Pocket Card"
      pdfPath="documents/references/Malignant Infarction.pdf"
      pdfName="Malignant Infarction.pdf"
      iconColorClass="text-crit-600 dark:text-crit-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <MalignantInfarctionCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

const AfibAnticoagTimingView = () => {
  return (
    <PdfActionBar
      title="AFib Anticoagulation Restart Timing"
      subtitle="DOAC Restart Protocol Reference Guide"
      pdfPath="documents/references/AFib DOAC Start Timing.pdf"
      pdfName="AFib DOAC Start Timing.pdf"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={true}>
        <BedsidePocketCardsStyles />
        <AfibAnticoagTimingCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

const EvdMaintenanceView = () => <EVDInfographic />;

const IcpManagementView = () => <ICPInfographic />;

// =====================================================================
// RENDER HELPERS FOR DETAILED MODULE VIEWS
// =====================================================================
function renderSubModuleContent(moduleId, viewMode, onNavigate, copyToClipboard, addToast) {
  switch (moduleId) {
    case 'toast-classification':
      return <ToastClassificationView />;
    case 'dapt-regimens':
      return <DaptRegimensView />;
    case 'malignant-infarction':
      return <MalignantInfarctionView />;
    case 'afib-anticoag-timing':
      return <AfibAnticoagTimingView />;
    case 'herniation-icp':
      return <IcpManagementView />;
    case 'evd-maintenance':
      return <EvdMaintenanceView />;
    case 'hints-simulator':
      return (
        <ErrorBoundary>
          <div className="bg-card border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-ink mb-4">HINTS+ Vestibular Exam Simulator</h2>
            <HintsSimulator />
          </div>
        </ErrorBoundary>
      );
    case 'pupillometry':
      return (
        <ErrorBoundary>
          <div className="bg-card border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-ink mb-4">Pupillometry &amp; NPi Evidence</h2>
            <p className="text-sm text-ink-2 mb-3">ORANGE and its secondary analysis describe associations in acute brain injury, not a stand-alone ICP rule or individual prognosis.</p>
            <PupillometrySimulator />
          </div>
        </ErrorBoundary>
      );
    case 'neuro-exams-simulator':
      return <p>This bedside examination tool is unavailable pending clinical review.</p>;
    case 'select-seizure-risk':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <SelectSeizureRiskCard />
        </ScaledCardWrapper>
      );
    case 'stk-core-measures':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <StkCoreMeasuresCard />
        </ScaledCardWrapper>
      );
    case 'cervical-dissection':
      return <CervicalDissectionView />;
    case 'fibromuscular-dysplasia':
      return <FibromuscularDysplasiaView />;
    case 'brain-death':
      return <BrainDeathView />;
    case 'stroke-prognosis':
      return <StrokePrognosisView />;
    case 'antiepileptic-drugs':
      return <AntiepilepticDrugsView />;
    case 'cerebral-venous-sinus-thrombosis':
      return <CvstView />;
    case 'large-core-thrombectomy':
      return <LargeCoreThrombectomyView />;
    case 'basilar-artery-occlusion':
      return <BasilarArteryOcclusionView />;
    case 'carotid-stenosis-management':
      return <CarotidStenosisView />;
    case 'brainstem-stroke-syndromes':
      return <BrainstemSyndromesView />;
    case 'vascular-territory-atlas':
      return <VascularTerritoryAtlasView />;
    case 'anticoagulation-reversal':
      return <AnticoagulationReversalView />;
    case 'rcvs':
      return <RcvsView />;
    case 'vessel-wall-mri':
      return <VesselWallMriView />;
    case 'cryptogenic-stroke-esus':
      return <CryptogenicStrokeEsusView />;
    case 'pfo-closure':
      return <PfoClosureView />;
    case 'cadasil-carasil':
      return <CadasilCarasilView />;
    case 'moyamoya-disease':
      return <MoyamoyaDiseaseView />;
    case 'cancer-associated-stroke':
      return <CancerAssociatedStrokeView />;
    case 'dmvo-mevo-management':
      return <DmvoMevoManagementView />;
    case 'ich-blood-pressure':
      return <IchBloodPressureView />;
    case 'metabolic-stroke-prevention':
      return <MetabolicStrokePreventionView />;
    case 'device-detected-subclinical-af':
      return <DeviceDetectedSubclinicalAfView />;
    case 'ich-surgical-decision-making':
      return <IchSurgicalDecisionMakingView />;
    case 'evt-periprocedural-care':
      return <EvtPeriproceduralCareView />;
    case 'intracranial-atherosclerosis':
      return <IntracranialAtherosclerosisView />;
    case 'unruptured-intracranial-aneurysm':
      return <UnrupturedIntracranialAneurysmView />;
    case 'prehospital-triage-systems':
      return <PrehospitalTriageSystemsView />;
    case 'severe-stroke-critical-care':
      return <SevereStrokeCriticalCareView />;
    case 'post-stroke-recovery':
      return <PostStrokeRecoveryView />;
    default:
      return <p className="text-xs">Module content not found.</p>;
  }
}


export const DeviceDetectedSubclinicalAfView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <DeviceDetectedSubclinicalAfCard />
  </ScaledCardWrapper>
);

export function DeviceDetectedSubclinicalAfCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Confirm the stored rhythm before treatment. The 2023 AF guideline distinguishes episodes below 5 minutes, 5 minutes to 24 hours, and at least 24 hours; anticoagulation depends on both duration and stroke risk, with shared decision-making. ARTESiA and NOAH trial entry criteria are not universal treatment thresholds. Bleeding risk and patient preferences remain central.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-device-detected-subclinical-af">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Device-Detected &amp; Subclinical Atrial Fibrillation</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              AHRE on Pacemaker / ICD / ICM &bull; NOAH-AFNET 6 &bull; ARTESiA &bull; Pooled Meta-Analysis &bull; ASSERT Duration Bands &bull; LOOP
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Definitions, duration bands, electrogram adjudication (purple) */}
            <CardSection color="purple" title="1. Definitions, Burden Bands &amp; Mandatory Electrogram Adjudication">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Three Terms That Are Not Synonyms</strong>
                  <br />&bull; <strong>AHRE (atrial high-rate episode):</strong> the device&apos;s own counter &mdash; an atrial rate above a programmed threshold for a minimum duration. ASSERT used <strong>&gt;190 bpm for &gt;6 min</strong> (PMID: 22236222).
                  <br />&bull; <strong>Subclinical AF:</strong> an AHRE whose stored electrogram is confirmed as true atrial fibrillation/flutter in a patient with <strong>no AF on any surface ECG</strong>.
                  <br />&bull; <strong>Clinical AF:</strong> documented on ECG or telemetry. Standard CHA&#8322;DS&#8322;-VASc anticoagulation rules apply &mdash; this card does not.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Burden, Not Mere Presence, Is the Driver</strong>
                  <br />&bull; <strong>ASSERT (NEJM 2012; PMID: 22236222):</strong> in 2580 pacemaker/ICD patients &ge;65 y with hypertension, SCAF by 3 months occurred in 261 (10.1%) and carried ischemic stroke/systemic embolism <strong>HR 2.49 (95% CI 1.28&ndash;4.85)</strong>; population attributable risk only 13%.
                  <br />&bull; <strong>ASSERT duration analysis (PMID: 28329139):</strong> episodes longer than 24 hours were associated with stroke/systemic embolism (adjusted HR 3.24; 95% CI 1.51–6.95). The 6-minute-to-24-hour group did not differ significantly from no SCAF; this does not establish absence of risk.
                  <br />&bull; Record longest single episode, total daily burden, and % time in AHRE &mdash; not a yes/no flag.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Adjudicate the Electrogram Before You Act</strong>
                  <br />&bull; A counter alone is <strong>not</strong> a diagnosis. Pull the stored EGM and read it with electrophysiology before any anticoagulation decision.
                  <br />&bull; <strong>Common false positives:</strong> far-field R-wave oversensing &bull; lead noise, fracture or loose set-screw &bull; myopotential/EMI artifact &bull; repetitive non-sustained atrial runs or frequent PACs &bull; sinus tachycardia crossing the rate cut-off. Atrial undersensing can instead undercount true burden.
                  <br />&bull; Insertable cardiac monitors are the most artifact-prone; a rejected episode should be documented as rejected.
                </div>
              </div>
            </CardSection>

            {/* §2 Randomized evidence (teal) */}
            <CardSection color="teal" title="2. Randomized Evidence: NOAH-AFNET 6, ARTESiA, Their Pooled Analysis &amp; LOOP">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '128px' }}>Trial / Comparison</th>
                    <th style={{ width: '158px' }}>Population &amp; Design</th>
                    <th style={{ width: '175px' }}>Efficacy Result (as reported)</th>
                    <th>Safety / Bleeding</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>NOAH-AFNET 6</strong><br />(NEJM 2023;389(13):1167-1179; PMID: 37622677)<br /><em>Edoxaban vs placebo</em></td>
                    <td>2536 patients (1270 edoxaban / 1266 placebo), age &ge;65 y with AHRE &ge;6 min and &ge;1 additional stroke risk factor. Mean age 78 y; median AHRE duration 2.8 h. <strong>Terminated early</strong> at median 21 months for safety plus informal futility.</td>
                    <td><strong>NEGATIVE / NEUTRAL.</strong> Primary composite of CV death, stroke or systemic embolism 3.2 vs 4.0 %/patient-yr, <strong>HR 0.81 (95% CI 0.60&ndash;1.08), P=0.15</strong>. Stroke incidence was roughly <strong>1%/patient-yr in BOTH arms</strong>. ECG-documented AF emerged in 18.2% (8.7%/patient-yr).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>Excess harm.</strong> Death from any cause or major bleeding 5.9 vs 4.5 %/patient-yr, <strong>HR 1.31 (1.02&ndash;1.67), P=0.03</strong>.</span></td>
                  </tr>
                  <tr>
                    <td><strong>ARTESiA</strong><br />(NEJM 2024;390(2):107-117; PMID: 37952132)<br /><em>Apixaban vs aspirin 81 mg</em></td>
                    <td>4012 patients with device-detected SCAF lasting <strong>6 min to 24 h</strong> and CHA&#8322;DS&#8322;-VASc &ge;3. Mean age 76.8 &plusmn; 7.6 y, mean CHA&#8322;DS&#8322;-VASc 3.9 &plusmn; 1.1, mean follow-up 3.5 &plusmn; 1.8 y. Drug stopped and OAC started if SCAF exceeded 24 h or clinical AF appeared.</td>
                    <td><strong>POSITIVE for stroke.</strong> Stroke or systemic embolism 0.78 vs 1.24 %/patient-yr (55 vs 86 events), <strong>HR 0.63 (95% CI 0.45&ndash;0.88), P=0.007</strong> (intention-to-treat).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>Excess major bleeding</strong> (on-treatment): 1.71 vs 0.94 %/patient-yr, <strong>HR 1.80 (1.26&ndash;2.57), P=0.001</strong>. Fatal bleeding was numerically similar: 5 apixaban vs 8 aspirin.</span></td>
                  </tr>
                  <tr>
                    <td><strong>Study-level meta-analysis</strong><br />(Circulation 2024;149(13):981-988; PMID: 37952187)<br /><em>Both trials, 6548 patients</em></td>
                    <td>Prespecified systematic review and random-effects meta-analysis of the only two randomized trials of oral anticoagulation for device-detected AF, GRADE-rated.</td>
                    <td><strong>Ischemic stroke RR 0.68 (95% CI 0.50&ndash;0.92), I&sup2;=0%, high-quality evidence.</strong> Composite of CV death, all-cause stroke, peripheral embolism, MI or PE RR 0.85 (0.73&ndash;0.99). <strong>No reduction in CV death (RR 0.95; 0.76&ndash;1.17) or all-cause mortality (RR 1.08; 0.96&ndash;1.21).</strong></td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>Major bleeding RR 1.62 (1.05&ndash;2.50)</strong>, I&sup2;=61%, high-quality evidence.</span></td>
                  </tr>
                  <tr>
                    <td><strong>LOOP</strong><br />(Lancet 2021;398(10310):1507-1516; PMID: 34469766)<br /><em>ICM screening vs usual care</em></td>
                    <td>6004 people aged 70&ndash;90 y with &ge;1 stroke risk factor and no known AF, randomized 1:3 to implantable loop recorder vs usual care; anticoagulation recommended for episodes &ge;6 min. Median follow-up 64.5 months.</td>
                    <td><strong>NEGATIVE.</strong> AF detected in 31.8% vs 12.2% (HR 3.17; 2.81&ndash;3.59) and OAC started in 29.7% vs 13.1% (HR 2.72; 2.41&ndash;3.08), yet stroke or systemic arterial embolism was 4.5% vs 5.6%, <strong>HR 0.80 (95% CI 0.61&ndash;1.05), P=0.11</strong>.</td>
                    <td>Major bleeding 4.3% vs 3.5%, HR 1.26 (0.95&ndash;1.69), P=0.11. <span style={{ color: 'var(--red-deep)' }}>This screening strategy increased detection without a statistically significant reduction in stroke/systemic embolism; the confidence interval does not establish equivalence.</span></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Absolute risk framing (amber) */}
            <CardSection color="amber" title="3. Absolute Rates and Their Limits">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.2fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Do the Arithmetic Out Loud (ARTESiA)</strong>
                  <br />&bull; Stroke/SE fell by <strong>0.46 percentage points per patient-year</strong> (1.24 &minus; 0.78) &rarr; roughly <strong>1 event avoided per 217 patient-years</strong> of apixaban.
                  <br />&bull; Major bleeding rose by <strong>0.77 percentage points per patient-year</strong> (1.71 &minus; 0.94) &rarr; roughly <strong>1 extra major bleed per 130 patient-years</strong>.
                  <br />&bull; These rate differences describe distinct outcomes and analysis populations. They are not a validated net-benefit score; consider the severity of ischemic and bleeding events and individual preferences.
                  <br />&bull; Caveat when quoting these: efficacy was intention-to-treat, safety was on-treatment.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>The Baseline Risk Is Simply Low</strong>
                  <br />&bull; Annualized stroke in device-detected AF ran near <strong>1%/patient-yr in both NOAH-AFNET 6 arms</strong> and 1.24%/patient-yr on aspirin in ARTESiA &mdash; far below the untreated rates that justify reflex anticoagulation in clinical AF.
                  <br />&bull; When baseline risk is that low, even a genuine 32% relative reduction (pooled RR 0.68) buys very little absolute benefit, while bleeding risk scales with age and comorbidity rather than with AF burden.
                  <br />&bull; No mortality signal in either direction: pooled CV death RR 0.95, all-cause death RR 1.08.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Why the Two Trials Only Look Contradictory</strong>
                  <br />&bull; <strong>Different comparators:</strong> NOAH-AFNET 6 tested edoxaban against <em>placebo</em>; ARTESiA tested apixaban against <em>aspirin</em>.
                  <br />&bull; <strong>Different endpoints:</strong> NOAH&apos;s primary outcome bundled CV death with stroke and systemic embolism, whereas ARTESiA&apos;s primary outcome was stroke/SE alone.
                  <br />&bull; <strong>Different burden bands:</strong> NOAH admitted any AHRE &ge;6 min (median 2.8 h, no upper cap); ARTESiA capped episodes at 24 h.
                  <br />&bull; <strong>Pooled stroke outcome:</strong> ischemic-stroke heterogeneity was I²=0%. Overlapping confidence intervals for different primary composites are not an agreement test. NOAH’s early termination limits precision.
                </div>
              </div>
            </CardSection>

            {/* §4 The two contexts that do not interchange (red) */}
            <CardSection color="red" title="4. Two Clinical Situations the Trials Do NOT Interchange">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>A. Incidental Finding (Primary Prevention)</strong>
                  <br />&bull; AHRE found on a routine device check in a patient who has never had a stroke &mdash; the bulk of both trial populations.
                  <br />&bull; ARTESiA subgroup without prior stroke/TIA (n=3666): 0.74 vs 1.07 %/yr, <strong>HR 0.69 (0.48&ndash;1.00)</strong>, absolute risk difference only <strong>1% (0&ndash;3) over 3.5 years</strong> (PMID: 39862882).
                  <br />&bull; Address modifiable vascular risks and reassess rhythm. For confirmed AHRE without prior clinical AF, the 2023 guideline says anticoagulation is reasonable for episodes ≥24 hours with CHA₂DS₂-VASc ≥2 (Class 2a), and may be reasonable for 5 minutes–24 hours with score ≥3 (Class 2b), through shared decision-making. Episodes under 5 minutes alone do not warrant anticoagulation.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>B. Prior Stroke or TIA Subgroup</strong>
                  <br />&bull; ARTESiA studied a prespecified history-of-stroke/TIA subgroup. Device-detected AF during a new stroke evaluation does not by itself prove the stroke mechanism or match that subgroup.
                  <br />&bull; ARTESiA prespecified subgroup with prior stroke/TIA (n=346, 8.6%): apixaban 1.20 vs aspirin 3.14 %/yr, <strong>HR 0.40 (95% CI 0.17&ndash;0.95)</strong>, absolute risk difference <strong>7% (95% CI 2&ndash;12) over 3.5 years</strong>, against a 3% (&minus;1 to 8) absolute increase in major bleeding (Lancet Neurol 2025; PMID: 39862882).
                  <br />&bull; This subgroup had a larger absolute stroke/embolism difference, with imprecise bleeding estimates. It informs discussion but does not establish a universal treatment rule or prove that benefit is limited to this group.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>C. Hemorrhage Risk and Applicability</strong>
                  <br />&bull; <strong>Prior ICH, lobar microbleeds, cortical superficial siderosis and probable CAA</strong> require individualized hemorrhage-risk assessment. These heterogeneous findings do not imply the same net treatment effect in every patient.
                  <br />&bull; Other flags: prior major GI bleed, advanced CKD, recurrent falls with frailty, unavoidable antiplatelet co-therapy.
                  <br />&bull; LAAO evidence and guideline indications principally concern clinical AF. Benefit is not established for AHRE alone; do not substitute LAAO or aspirin automatically when anticoagulation is unsuitable.
                </div>
              </div>
            </CardSection>

            {/* §5 Bedside algorithm and documentation (teal) */}
            <CardSection color="teal" title="5. Assessment and Shared Decision-Making">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Interrogate &amp; Adjudicate</strong>
                  <br />&bull; <strong>1. Interrogate</strong> the pacemaker, ICD, CRT device or ICM. Capture: longest single episode, total burden (hours/day and % of time), date of first episode, and whether burden is rising.
                  <br />&bull; <strong>2. Adjudicate</strong> the stored electrograms with electrophysiology. Reject noise, far-field R-wave oversensing, PAC runs and sinus tachycardia. Only confirmed atrial fibrillation/flutter advances.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Decide, Document, Re-check</strong>
                  <br />&bull; <strong>5. Shared decision:</strong> quote both absolute numbers (roughly 1 stroke avoided per 217 patient-years vs 1 extra major bleed per 130). If anticoagulation is chosen, confirm the indication, kidney function, interactions and current product-label dosing.
                  <br />&bull; <strong>Reassess</strong> confirmed rhythm, episode duration, stroke risk, bleeding risk, and patient preferences when the clinical situation changes. An episode-duration threshold alone is not an anticoagulation instruction.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'NOAH-AFNET 6', cite: 'Kirchhof P et al. N Engl J Med. 2023;389(13):1167-1179.', pmid: '37622677' },
              { label: 'ARTESiA', cite: 'Healey JS et al. N Engl J Med. 2024;390(2):107-117.', pmid: '37952132' },
              { label: 'Pooled Meta-Analysis', cite: 'McIntyre WF et al. Circulation. 2024;149(13):981-988.', pmid: '37952187' },
              { label: 'ARTESiA Prior Stroke/TIA', cite: 'Shoamanesh A et al. Lancet Neurol. 2025;24(2):140-151.', pmid: '39862882' },
              { label: 'LOOP Study', cite: 'Svendsen JH et al. Lancet. 2021;398(10310):1507-1516.', pmid: '34469766' },
              { label: 'ASSERT Duration', cite: 'Van Gelder IC et al. Eur Heart J. 2017;38(17):1339-1344.', pmid: '28329139' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const IchSurgicalDecisionMakingView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <IchSurgicalDecisionMakingCard />
  </ScaledCardWrapper>
);

export function IchSurgicalDecisionMakingCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Urgent neurosurgical assessment takes priority for deterioration, brainstem compression, obstructive hydrocephalus or selected cerebellar hemorrhage. Trial criteria differ by location, volume, clinical severity, timing and technique. ENRICH, MISTIE and SWITCH do not establish a universal operation rule or a ceiling on recovery. Stabilization and reversal proceed in parallel with surgical decisions.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-ich-surgical-decision-making">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>ICH Surgical Decision-Making</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              STICH &amp; STICH II &bull; MISTIE III &bull; ENRICH &bull; CLEAR III &bull; SWITCH &bull; Posterior-Fossa Rules &bull; Who Benefits, Who Does Not
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 The negative-trial spine that defines current equipoise (red) */}
            <CardSection color="red" title="1. The Negative-Trial Spine &mdash; Why Open Craniotomy Is Not Routine">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>STICH (Lancet 2005; PMID: 15680453)</strong>
                  <br />&bull; <strong>Design:</strong> 1033 patients, 83 centres in 27 countries. Early craniotomy (evacuation within 24 h of randomisation) vs initial conservative treatment, with later evacuation permitted if judged necessary.
                  <br />&bull; <strong>Primary outcome</strong> (prognosis-based dichotomised extended Glasgow Outcome Scale at 6 months): favourable in 122/468 (26%) surgical vs 118/496 (24%) conservative &mdash; <strong style={{ color: 'var(--red-deep)' }}>OR 0.89 (95% CI 0.66&ndash;1.19), p=0.414</strong>; absolute benefit 2.3% (&minus;3.2 to 7.7).
                  <br />&bull; STICH did not show a statistically significant overall benefit from early surgery. Interpret its confidence interval and population rather than treating a nonsignificant result as proof of no possible effect.
                </div>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>STICH II (Lancet 2013; PMID: 23726393)</strong>
                  <br />&bull; <strong>Design:</strong> 601 patients, 78 centres in 27 countries &mdash; the best-case anatomy: conscious patients, <strong>superficial lobar</strong> ICH of 10&ndash;100 mL, <strong>no IVH</strong>, within 48 h of ictus, surgery within 12 h of randomisation.
                  <br />&bull; <strong>Primary outcome:</strong> unfavourable in 174/297 (59%) surgical vs 178/286 (62%) conservative &mdash; <strong style={{ color: 'var(--red-deep)' }}>OR 0.86 (95% CI 0.62&ndash;1.20), p=0.367</strong>; absolute difference 3.7% (95% CI &minus;4.3 to 11.6). Not significant. The authors framed it as safe, with at most a small possible survival advantage &mdash; never a functional win.
                  <br />&bull; Routine open evacuation is not established for every supratentorial ICH. Tissue disruption is a proposed explanation for differences between techniques, not a proven mechanism of trial failure. Conservative-arm crossover also means that rescue surgery remained an option.
                </div>
              </div>
            </CardSection>

            {/* §2 Minimally invasive evacuation & the surgical-dose concept (teal) */}
            <CardSection color="teal" title="2. Minimally Invasive Evacuation &mdash; ENRICH (Positive) vs MISTIE III (Neutral), and the Surgical Dose">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '118px' }}>Trial / Technique</th>
                    <th style={{ width: '155px' }}>Eligibility &amp; Design</th>
                    <th style={{ width: '175px' }}>Primary Result (stated in its true direction)</th>
                    <th>Bedside Translation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>ENRICH</strong><br />(NEJM 2024; PMID: 38598795)<br />Minimally invasive parafascicular surgery with a trans-sulcal tubular retractor</td>
                    <td>n=300. Lobar or <strong>anterior</strong> basal ganglia ICH, <strong>30&ndash;80 mL</strong>, randomised <strong>within 24 h of last known well</strong> vs guideline-based medical management. Bayesian adaptive design: after 175 enrolments an adaptation rule triggered and <strong>only lobar patients were enrolled thereafter</strong> (final cohort 69.3% lobar, 30.7% basal ganglia).</td>
                    <td>Mean utility-weighted mRS at 180 d <strong>0.458 vs 0.374</strong>; difference <strong style={{ color: '#166534' }}>0.084 (95% Bayesian credible interval 0.005&ndash;0.163)</strong>, posterior probability of superiority <strong>0.981</strong> against a prespecified threshold of 0.975.<br /><strong>Lobar:</strong> 0.127 (0.035&ndash;0.219). <strong>Anterior basal ganglia:</strong> &minus;0.013 (&minus;0.147 to 0.116) &mdash; <strong style={{ color: 'var(--red-deep)' }}>no benefit demonstrated</strong>.<br />Death by 30 d 9.3% vs 18.0%. Postoperative rebleeding with deterioration in 5 patients (3.3%).</td>
                    <td>ENRICH’s positive primary result was attributable to its selected lobar stratum. The smaller anterior basal ganglia estimate did not demonstrate benefit; thalamic and posterior basal ganglia hemorrhages were not enrolled. These findings do not represent all techniques, populations or surgical indications.</td>
                  </tr>
                  <tr>
                    <td><strong>MISTIE III</strong><br />(Lancet 2019; PMID: 30739747)<br />Stereotactic catheter aspiration plus alteplase 1.0 mg q8h, up to 9 doses</td>
                    <td>n=506 randomised / 499 modified ITT, 78 hospitals. Spontaneous supratentorial ICH <strong>&ge;30 mL</strong> with a documented stability CT before instrumentation. Explicit surgical goal: reduce the clot to <strong>&le;15 mL</strong>.</td>
                    <td>mRS 0&ndash;3 at <strong>365 days</strong>: <strong>45% vs 41%</strong>; <strong style={{ color: 'var(--red-deep)' }}>adjusted risk difference 4% (95% CI &minus;4 to 12), p=0.33 &mdash; NEUTRAL</strong>.<br />Mortality: 7 d 1% vs 4% (p=0.02); 30 d 9% vs 15% (p=0.07). Symptomatic bleeding 2% vs 1% (p=0.33); brain bacterial infection 1% vs 0% (p=0.16).</td>
                    <td>Never quote MISTIE III as a positive trial. Its lasting contribution is the <strong>dose idea</strong>: within the surgical arm (n=242), reaching <strong>&le;15 mL end-of-treatment volume or &ge;70% reduction</strong> tracked with mRS 0&ndash;3, whereas lower mortality was associated with <strong>&le;30 mL or &gt;53% reduction</strong> (PMID: 30891610). Misses clustered with irregular clots, protocol deviations, catheter problems and low site volume.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Intraventricular hemorrhage, the EVD, and hydrocephalus (purple) */}
            <CardSection color="purple" title="3. Intraventricular Blood, the EVD, and Obstructive Hydrocephalus">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>CLEAR III (Lancet 2017; PMID: 28081952)</strong>
                  <br />&bull; <strong>Design:</strong> 500 patients who already had a <strong>routinely placed EVD</strong>, stable parenchymal ICH <strong>&lt;30 mL</strong>, and IVH obstructing the 3rd or 4th ventricle. Up to 12 doses of alteplase 1 mg q8h through the EVD vs 0.9% saline.
                  <br />&bull; <strong>Primary outcome (mRS &le;3 at 180 d):</strong> 48% vs 45% &mdash; <strong style={{ color: 'var(--red-deep)' }}>RR 1.06 (95% CI 0.88&ndash;1.28), p=0.554 &mdash; NEUTRAL</strong> (adjusted RR 1.08, 0.90&ndash;1.29, p=0.420).
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The Trade You Are Actually Offering</strong>
                  <br />&bull; <strong>Fewer deaths:</strong> 180-day case fatality 18% vs 29% &mdash; HR 0.60 (95% CI 0.41&ndash;0.86), p=0.006.
                  <br />&bull; <strong>More severe survivors:</strong> mRS 5 in 17% vs 9% &mdash; RR 1.99 (95% CI 1.22&ndash;3.26), p=0.007. Group outcome distributions cannot identify which individual deaths were prevented or prescribe an individual recovery ceiling.
                  <br />&bull; <strong>Safety favoured alteplase:</strong> ventriculitis 7% vs 12% (RR 0.55, 0.31&ndash;0.97, p=0.048); serious adverse events 46% vs 60% (RR 0.76, 0.64&ndash;0.90, p=0.002); symptomatic bleeding 2% vs 2%.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What to Do Tonight</strong>
                  <br />&bull; <strong>Ventricular drainage</strong> is indicated when hydrocephalus contributes to impaired consciousness. CLEAR III participants already had an EVD before randomization; its adjunct-lytic findings do not replace the drainage indication.
                  <br />&bull; In selected patients requiring EVD with primary IVH or IVH extending from an ICH under 30 mL and GCS above 3, the AHA guideline considers EVD plus thrombolytic reasonable to reduce mortality; functional benefit remains uncertain. This is a specialist treatment decision, not restricted to an obstructed catheter.
                  <br />&bull; EVD weaning and any repeat imaging require the treating neurosurgical team’s assessment and approved device-specific procedure; this reference provides no independent clamp or weaning rule.
                </div>
              </div>
            </CardSection>

            {/* §4 Posterior fossa rules and decompressive craniectomy (amber) */}
            <CardSection color="amber" title="4. Posterior Fossa and Decompressive Craniectomy: Distinct Evidence">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Cerebellar ICH &mdash; a Class 1 surgical recommendation (to reduce mortality)</strong>
                  <br />&bull; <strong>Trigger to operate</strong> (2022 AHA/ASA ICH guideline; PMID: 35579034): neurological deterioration, brainstem compression and/or hydrocephalus from ventricular obstruction, or cerebellar ICH volume &ge;15 mL &rarr; <strong>immediate surgical removal of the hemorrhage (&plusmn; EVD)</strong>, to reduce mortality. This recommendation is supported by nonrandomized evidence; it is distinct from the randomized SWITCH population.
                  <br />&bull; <strong>EVD alone may be insufficient</strong> when posterior fossa mass effect or compressed basal cisterns threaten perfusion; upward herniation is a potential concern. Obtain urgent neurosurgical assessment for evacuation with or without EVD rather than applying a universal drainage/OR sequence.
                  <br />&bull; <strong>The honest data</strong> (Kuramatsu, JAMA 2019; PMID: 31593272): individual-participant meta-analysis of 4 observational cohorts, 578 cerebellar ICH, propensity-matched 152 vs 152. Evacuation was <strong style={{ color: 'var(--red-deep)' }}>not</strong> associated with better mRS 0&ndash;3 at 3 months (30.9% vs 35.5%; adjusted OR 0.94, 95% CI 0.81&ndash;1.09, p=0.43) but was associated with survival (78.3% vs 61.2%; adjusted OR 1.25, 1.07&ndash;1.45, p=0.005; 12-month survival 71.7% vs 57.2%). <strong>Volume cuts both ways:</strong> at <strong>&le;12 cm&sup3;</strong> surgery was associated with a <em>lower</em> chance of favourable outcome (30.6% vs 62.3%, p=0.003); at <strong>&ge;15 cm&sup3;</strong> with greater survival (74.5% vs 45.1%, p&lt;0.001). Small volume and preserved alertness do not override deterioration, brainstem compression or obstructive hydrocephalus.
                </div>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>SWITCH (Lancet 2024; PMID: 38761811) &mdash; craniectomy for deep ICH</strong>
                  <br />&bull; <strong>Design:</strong> 42 centres in 9 countries. Age 18&ndash;75 with severe basal ganglia or thalamic ICH; decompressive craniectomy plus best medical treatment vs best medical treatment alone. 201 randomised, 197 analysed. Median age 61 (IQR 51&ndash;68), median haematoma volume <strong>57 mL</strong> (IQR 44&ndash;74). <strong>Stopped early for lack of funding.</strong>
                  <br />&bull; <strong>Primary outcome (mRS 5&ndash;6 at 180 d):</strong> 42 (44%) of 95 in the craniectomy arm vs 55 (58%) in the medical arm &mdash; <strong style={{ color: 'var(--amber-deep)' }}>adjusted RR 0.77 (95% CI 0.59&ndash;1.01), adjusted risk difference &minus;13% (95% CI &minus;26 to 0), p=0.057 &mdash; did not reach significance</strong>. Per-protocol 47% vs 60% (aRR 0.76, 0.58&ndash;1.00). Serious adverse events 41% vs 44%. The investigators called this <em>weak evidence</em>; severe disability was common among survivors in both arms, but it was not a universal outcome.
                  <br />&bull; <strong>Discuss the full range of outcomes.</strong> Deep ICH does not imply that both the internal capsule and thalamus are destroyed, or that every survivor has a best possible mRS of 4–5. Explain the selected study populations, uncertainty about functional benefit and the patient’s previously expressed values.
                </div>
              </div>
            </CardSection>

            {/* §5 Integrated bedside decision table, sequencing, and family language (teal) */}
            <CardSection color="teal" title="5. Integrated Decision Table, Sequencing, and How to Say &ldquo;No Benefit Demonstrated&rdquo; Without Saying &ldquo;Never Operate&rdquo;">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 4px 0', fontSize: '6.4pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '104px' }}>Location</th>
                    <th style={{ width: '112px' }}>Volume / GCS trigger</th>
                    <th style={{ width: '138px' }}>Operation</th>
                    <th style={{ width: '96px' }}>Evidence grade</th>
                    <th>Caveats, age &amp; anticoagulation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Cerebellar</strong></td>
                    <td>Any fall in GCS, brainstem compression, hydrocephalus from 4th-ventricle obstruction, or volume &ge;15 mL (each a 2022 AHA/ASA COR 1 indication for immediate surgical removal &plusmn; EVD, to reduce mortality)</td>
                    <td>Urgent surgical evacuation with or without EVD according to the neurosurgical assessment; timing of drainage depends on the individual situation.</td>
                    <td>Guideline COR 1 (to reduce mortality) for deterioration / brainstem compression / hydrocephalus from ventricular obstruction / volume &ge;15 mL (PMID: 35579034); the supporting volume data are observational (PMID: 31593272)</td>
                    <td>Volume alone is not a safe observation rule. Assess neurological deterioration, brainstem compression and hydrocephalus regardless of an apparently small hematoma; arrange reversal and neurosurgical care in parallel.</td>
                  </tr>
                  <tr>
                    <td><strong>Lobar supratentorial</strong></td>
                    <td>Selected lobar ICH in ENRICH: 30–80 mL and treatment within 24 hours, with additional clinical, imaging and premorbid eligibility criteria.</td>
                    <td>The studied minimally invasive parafascicular approach at experienced centers; trial selection is not an automatic operative instruction.</td>
                    <td><span style={{ color: '#166534' }}>RCT-positive (ENRICH, PMID: 38598795)</span></td>
                    <td>Requires a trained team with tubular-retractor capability. STICH II studied open surgery with different volume, timing and IVH criteria; cross-trial comparisons do not isolate technique effects. Rebleed with deterioration 3.3%.</td>
                  </tr>
                  <tr>
                    <td><strong>Anterior basal ganglia</strong></td>
                    <td>30&ndash;80 mL</td>
                    <td>Routine evacuation benefit was not demonstrated in ENRICH’s selected anterior basal ganglia stratum. This does not exclude rescue surgery or other carefully selected surgical strategies.</td>
                    <td>RCT-neutral within the ENRICH stratum</td>
                    <td>Estimate is imprecise because adaptive enrolment closed this stratum early. &ldquo;Not shown to help&rdquo; is not the same as &ldquo;proven harmful.&rdquo;</td>
                  </tr>
                  <tr>
                    <td><strong>Selected severe deep ICH</strong></td>
                    <td>SWITCH studied selected stable deep ICH of 30–100 mL, age 18–75, GCS 8–13 and NIHSS 10–30. Randomization occurred within 66 hours of onset and surgery within 6 hours of randomization. Herniation was not a required enrollment criterion. Its median 57 mL is not an eligibility threshold.</td>
                    <td>Decompressive craniectomy without evacuation</td>
                    <td>Primary endpoint missed (p=0.057); trial stopped early</td>
                    <td>SWITCH provides imprecise evidence about death or severe dependence. Discuss the range of possible outcomes and the patient’s values; do not assign a universal mRS 4–5 ceiling. Patients older than 75 were not studied.</td>
                  </tr>
                  <tr>
                    <td><strong>IVH &plusmn; hydrocephalus</strong></td>
                    <td>Hydrocephalus contributing to reduced consciousness; third/fourth-ventricle clot casting describes a trial population, not every drainage indication.</td>
                    <td>EVD first; intraventricular alteplase optional, not standard</td>
                    <td>RCT-neutral on function (CLEAR III, PMID: 28081952)</td>
                    <td>Lower death (HR 0.60) but more mRS 5 (RR 1.99). Parenchymal ICH must be &lt;30 mL and stable to mirror trial conditions.</td>
                  </tr>
                </tbody>
              </table></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)' }}>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Sequencing &mdash; nothing waits for the surgeon</strong>
                  <br />&bull; <strong>Prompt reversal:</strong> assess clinically relevant anticoagulant exposure and reverse when indicated. Resuscitation, reversal and emergency neurosurgical planning proceed in parallel; do not delay necessary rescue treatment for a blanket sequencing rule.
                  <br />&bull; <strong>Bundled care:</strong> INTERACT3 reported improved six-month ordinal mRS in its published analysis (common OR 0.86; 95% CI 0.76–0.97). Apply BP treatment according to ICH severity and cerebral perfusion; a universal preoperative SBP below 140 is not established. INR correction targets apply to warfarin, not every anticoagulant.
                  <br />&bull; <strong>Stability imaging:</strong> MISTIE III required documented hematoma stability for that procedure. This criterion does not justify delaying emergency cerebellar evacuation or rescue surgery when otherwise indicated.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Fellow&rsquo;s trial-eligibility drill &amp; script</strong>
                  <br />&bull; Compare the patient with the full eligibility criteria and technique of the relevant study. Being outside ENRICH or MISTIE does not mean being outside all surgical evidence or emergency indications.
                  <br />&bull; <strong>Counseling:</strong> distinguish evidence for survival, disability distributions and functional recovery. Explain what the relevant study did and did not establish, and integrate premorbid status, trajectory and the patient’s values.
                  <br />&bull; Then name the exception you <em>are</em> offering, if any: mass-effect rescue, an obstructed fourth ventricle, or enrolment in an open trial.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.4pt' }} refs={[
              { label: 'STICH', cite: 'Mendelow AD et al. Lancet. 2005;365(9457):387-397.', pmid: '15680453' },
              { label: 'STICH II', cite: 'Mendelow AD et al. Lancet. 2013;382(9890):397-408.', pmid: '23726393' },
              { label: 'MISTIE III', cite: 'Hanley DF et al. Lancet. 2019;393(10175):1021-1032.', pmid: '30739747' },
              { label: 'MISTIE III surgical performance', cite: 'Awad IA et al. Neurosurgery. 2019;84(6):1157-1168.', pmid: '30891610' },
              { label: 'ENRICH', cite: 'Pradilla G et al. N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
              { label: 'CLEAR III', cite: 'Hanley DF et al. Lancet. 2017;389(10069):603-611.', pmid: '28081952' },
              { label: 'SWITCH', cite: 'Beck J et al. Lancet. 2024;403(10442):2395-2404.', pmid: '38761811' },
              { label: 'Cerebellar ICH meta-analysis', cite: 'Kuramatsu JB et al. JAMA. 2019;322(14):1392-1403.', pmid: '31593272' },
              { label: '2022 AHA/ASA ICH Guideline', cite: 'Greenberg SM et al. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const EvtPeriproceduralCareView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <EvtPeriproceduralCareCard />
  </ScaledCardWrapper>
);

export function EvtPeriproceduralCareCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Avoid hypotension and individualize blood pressure after EVT. Harm from assigned intensive lowering does not establish a mandatory 140 mmHg floor or a need to raise spontaneously lower pressure. New neurological deterioration warrants prompt assessment and imaging; do not wait for a four-point NIHSS change. Anesthesia and device strategy require patient and procedural context.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-evt-periprocedural-care">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>EVT Technique &amp; Post-Thrombectomy Care</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Anesthesia &bull; Device Strategy &bull; Bailout &bull; Post-Reperfusion BP &bull; The First 24 Hours &bull; Angio-Suite Handoff
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Post-reperfusion blood pressure (red) */}
            <CardSection color="red" title="1. Post-Reperfusion Blood Pressure &mdash; The Single Most Common Post-EVT Order-Set Error">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>ENCHANTED2/MT &mdash; Intensive Lowering Is Harmful</strong>
                  <br />&bull; <strong>Design (Lancet 2022; PMID: 36341753):</strong> 821 patients at 44 Chinese centres with SBP &ge;140 mmHg persisting after successful EVT reperfusion; SBP target &lt;120 vs 140&ndash;180 mmHg, achieved within 1 h and held 72 h.
                  <br />&bull; <strong>Result &mdash; NEGATIVE for intensive:</strong> greater likelihood of poor 90-d functional outcome (common OR <strong>1.37; 95% CI 1.07&ndash;1.76</strong>). Stopped early for efficacy and safety concerns.
                  <br />&bull; More early neurological deterioration (cOR 1.53; 1.18&ndash;1.97) and major disability at 90 d (OR 2.07; 1.47&ndash;2.93). <strong>No difference in sICH</strong> &mdash; hypoperfusion is a possible mechanism, but this comparison does not prove the mechanism of harm.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>OPTIMAL-BP &mdash; Even &lt;140 mmHg Is Harmful</strong>
                  <br />&bull; <strong>Design (JAMA 2023; PMID: 37668619):</strong> 306 patients at 19 Korean centres with mTICI &ge;2b; SBP &lt;140 vs 140&ndash;180 mmHg for 24 h. Halted early by the DSMB for safety.
                  <br />&bull; <strong>Result &mdash; NEGATIVE for intensive:</strong> functional independence (mRS 0&ndash;2) at 3 months <strong>39.4% vs 54.4%</strong>; risk difference &minus;15.1% (95% CI &minus;26.2% to &minus;3.9%); adjusted OR 0.56 (0.33&ndash;0.96), P=.03.
                  <br />&bull; sICH 9.0% vs 8.1% (adj OR 1.10; 0.48&ndash;2.53) and stroke-related death 7.7% vs 5.4% &mdash; again, no bleeding signal to justify the tighter target.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Additional BP Trials and Design Limits</strong>
                  <br />&bull; <strong>BP-TARGET (Lancet Neurol 2021; PMID: 33647246):</strong> 324 patients, SBP 100&ndash;129 vs 130&ndash;185 mmHg &times; 24 h. Radiographic intraparenchymal haemorrhage 42% vs 43% (adj OR 0.96; 0.60&ndash;1.51; p=0.84) &mdash; <strong>tighter BP did not reduce bleeding.</strong>
                  <br />&bull; <strong>BEST-II (JAMA 2023; PMID: 37668620):</strong> 120 patients, SBP &lt;140 vs &lt;160 vs &le;180 mmHg. Futility boundaries were not crossed, but the predicted probability that a future trial of a lower target would succeed was only <strong>25% (&lt;140) and 14% (&lt;160)</strong>.
                </div>
              </div>

              <div style={{ marginTop: '6px', borderLeft: '4px solid var(--red)', background: 'var(--red-soft)', padding: '5px 8px', borderRadius: '4px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink)' }}>
                <strong style={{ color: 'var(--red-deep)' }}>Individualize the BP order.</strong> The 2026 AIS guideline advises against actively targeting SBP below 140 mmHg during the first 72 hours after successful anterior-circulation EVT in the specified population without another BP indication. The usual post-EVT ceiling is ≤180/105 mmHg; these findings do not require vasopressors for every spontaneous SBP below 140. Correct hypotension, assess other emergencies and avoid abrupt reductions.
                <br /><strong>Newer evidence — HOPE (2026):</strong> A selected 440-patient trial tested a 72-hour strategy of 140–160 mmHg for mTICI 2b and 100–140 for mTICI 2c/3 versus a ceiling below 180. Favorable outcome was more frequent with the strategy, but only 43 participants had mTICI 2b; ASPECTS was ≥6 and residual ≥50% stenosis was excluded. The trial stopped early for funding. This tests the complete strategy, not each target independently, and does not establish a universal 140-mmHg floor. <a href="https://jamanetwork.com/journals/jamaneurology/fullarticle/2850074" target="_blank" rel="noopener noreferrer">HOPE primary report</a>. Exact event-count inconsistencies in the report remain unresolved.
                <br /><strong style={{ color: 'var(--red-deep)' }}>INCOMPLETE REPERFUSION (mTICI 0&ndash;2a) IS A DIFFERENT PROBLEM.</strong> ENCHANTED2/MT and OPTIMAL-BP both <em>required</em> successful reperfusion, so their harm signal does not transfer. With persistent occlusion the distal territory remains collateral-dependent and pressure-passive; no RCT defines a target here. Individualise, keep the &le;180/105 ceiling, and do not extrapolate either direction as if it were evidence.
              </div>
            </CardSection>

            {/* §2 Anesthesia (purple) */}
            <CardSection color="purple" title="2. Anesthesia: Airway, Hemodynamics and Procedural Context">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '150px' }}>Trial (all GA vs sedation)</th>
                    <th style={{ width: '95px' }}>Population</th>
                    <th style={{ width: '210px' }}>Primary Endpoint &amp; Result</th>
                    <th>Bedside Implication</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>SIESTA</strong><br />JAMA 2016<br />PMID: 27785516</td>
                    <td>Single-centre, n=150 (73 GA / 77 CS), NIHSS &gt;10, anterior circulation</td>
                    <td><strong>NEUTRAL.</strong> 24-h NIHSS improvement: between-group mean difference &minus;0.4 (95% CI &minus;3.4 to 2.7; P=.82). 41 of 47 secondary outcomes showed no difference.</td>
                    <td>GA cost: hypothermia 32.9% vs 9.1%, delayed extubation 49.3% vs 6.5%, pneumonia 13.7% vs 3.9%. GA benefit: no substantial patient movement (0% vs 9.1%).</td>
                  </tr>
                  <tr>
                    <td><strong>GOLIATH</strong><br />JAMA Neurol 2018<br />PMID: 29340574</td>
                    <td>Single-centre, n=128 (65 GA / 63 CS), &lt;6 h from onset</td>
                    <td><strong>PRIMARY ENDPOINT NEGATIVE.</strong> Infarct growth 8.2 vs 19.4 mL (P=.10 &mdash; not significant). Secondary: successful reperfusion 76.9% vs 60.3% (P=.04); mRS shift OR 1.91 (1.03&ndash;3.56).</td>
                    <td>6.3% of sedation patients converted to GA intra-procedurally. Plan airway management with the procedural team; this is a clinical planning principle, not a randomized timing result.</td>
                  </tr>
                  <tr>
                    <td><strong>GASS</strong><br />Anesthesiology 2022<br />PMID: 35226737</td>
                    <td>Multicentre France, 351 randomised / 345 analysed, <strong>BP protocolised in both arms</strong></td>
                    <td><strong>NEUTRAL.</strong> mRS &le;2 at 3 months 36% (sedation) vs 40% (GA); relative risk 0.91 (95% CI 0.69&ndash;1.19), P=0.474.</td>
                    <td>GA added 19 min onset-to-puncture but onset-to-recanalisation was unchanged; recanalisation success 85% vs 75% (P=0.021). The comparison does not establish equivalence or exclude clinically important differences.</td>
                  </tr>
                  <tr>
                    <td><strong>IPD meta-analysis</strong><br />JAMA 2019<br />PMID: 31573636</td>
                    <td>368 patients pooled from the 3 single-centre RCTs (183 GA / 185 sedation)</td>
                    <td><strong>FAVOURS GA:</strong> 3-month mRS common OR 1.58 (95% CI 1.09&ndash;2.29), P=.02. Authors caution the trials were single-centre and disability was primary in only one.</td>
                    <td><strong>The signal to act on:</strong> hypotension (SBP fall &gt;20% from baseline) 80.8% vs 53.1% (OR 4.26; 2.55&ndash;7.09) and BP variability 79.7% vs 62.3% (OR 2.42; 1.49&ndash;3.93).</td>
                  </tr>
                </tbody>
              </table></div>
              <div style={{ marginTop: '4px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--purple-deep)' }}>Anesthesia planning:</strong> avoid and correct hypotension while accounting for the presenting pressure, reperfusion status and other indications. A 20% relative fall was used as a monitored event in some trials, not a universally validated treatment threshold. Choose airway and anesthetic strategy jointly from airway protection, cooperation, aspiration risk and procedural needs.
              </div>
            </CardSection>

            {/* §3 Device strategy and pass counts (teal) */}
            <CardSection color="teal" title="3. Device Strategy, First-Pass Effect &amp; Knowing When to Stop">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Aspiration vs Stent Retriever: Trial Comparisons</strong>
                  <br />&bull; <strong>ASTER (JAMA 2017; PMID: 28763550):</strong> 381 patients, 8 French centres. Final mTICI 2b/3 <strong>85.4% vs 83.1%</strong> (OR 1.20; 95% CI 0.68&ndash;2.10; P=.53). No difference in 24-h NIHSS, 90-d mRS or adverse events.
                  <br />&bull; <strong>COMPASS (Lancet 2019; PMID: 30860055):</strong> 270 patients, non-inferiority design. mRS 0&ndash;2 at 90 d <strong>52% vs 50%</strong> (p=0.0014 for non-inferiority, margin 0.15). ICH 36% vs 34%; mortality 22% in both arms.
                  <br />&bull; ASTER did not demonstrate superiority for first-line aspiration; COMPASS met its prespecified noninferiority margin. Technique choice also depends on anatomy, equipment, operator expertise and the populations studied; these results do not prove universal equivalence.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Combined Aspiration + Stent Retriever</strong>
                  <br />&bull; <strong>ASTER2 (JAMA 2021; PMID: 34581737):</strong> 408 randomised, 405 analysed. Primary endpoint (final eTICI 2c/3) <strong>64.5% vs 57.9%</strong>; risk difference 6.6% (95% CI &minus;3.0% to 16.2%); adj OR 1.33 (0.88&ndash;1.99), <strong>P=.17 &mdash; not significant</strong>. 12 of 14 secondary endpoints were also neutral.
                  <br />&bull; The combined technique <em>did</em> outperform after the assigned first intervention alone (eTICI 2b50/2c/3 86.2% vs 72.3%; adj OR 2.54; 1.51&ndash;4.28) The initial-intervention result differs from the end-of-procedure endpoint; rescue use does not establish a causal explanation for that difference.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>First Pass, Pass Count &amp; Futile Recanalisation</strong>
                  <br />&bull; <strong>First-pass effect (Stroke 2018; PMID: 29459390):</strong> NASA registry, 354 patients; complete recanalisation on one pass in <strong>25.1%</strong>, with mRS 0&ndash;2 61.3% vs 35.3% (OR 1.7; 95% CI 1.1&ndash;2.7; P=.013) and median revascularisation time 34 vs 60 min.
                  <br />&bull; <strong>Caveat:</strong> this is a registry <em>association</em>, useful as a QI benchmark &mdash; it does not license any device claim (see PROTECT-MT, &sect;4).
                  <br />&bull; <strong>Stopping or changing technique:</strong> no universal maximum pass count is established. The operator must reassess remaining benefit, anatomy, device constraints and procedural harm throughout the procedure.
                </div>
              </div>
            </CardSection>

            {/* §4 Three reversals (amber) */}
            <CardSection color="amber" title="4. Three Randomized Reversals: Balloon Guides, Bailout Angioplasty &amp; Rescue Antiplatelets">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>PROTECT-MT &mdash; Balloon Guide Catheters Were Worse</strong>
                  <br />&bull; <strong>Design (Lancet 2024; PMID: 39579782):</strong> 329 patients at 28 Chinese hospitals, balloon guide vs conventional guide catheter for anterior-circulation EVT within 24 h. <strong>Terminated early for safety.</strong>
                  <br />&bull; <strong>Result &mdash; HARM:</strong> worse 90-d mRS with the balloon guide (adjusted common OR <strong>0.66; 95% CI 0.45&ndash;0.98; p=0.037</strong>). All-cause 90-d mortality numerically higher, 24% vs 16%. No significant difference in ICH, sICH or other serious adverse events.
                  <br />&bull; <strong>Registry denominator:</strong> balloon-guide use was 64.0% among patients with first-pass effect versus 34.7% among those without it in the NASA cohort. These are not first-pass success rates with versus without a guide. Observational associations and randomized device-strategy outcomes require separate interpretation.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>ANGEL-REBOOT &mdash; Bailout Angioplasty/Stenting Did Not Help</strong>
                  <br />&bull; <strong>Design (Lancet Neurol 2024; PMID: 38914085):</strong> 348 patients at 36 Chinese hospitals with eTICI 0&ndash;2a <em>or</em> residual stenosis &gt;70% after thrombectomy; bailout angioplasty or stenting vs standard therapy.
                  <br />&bull; <strong>Result &mdash; NEUTRAL primary, worse safety:</strong> 90-d mRS common OR <strong>0.86 (95% CI 0.59&ndash;1.24), p=0.41</strong>; sICH 5% vs 1%; parenchymal haematoma type 2 3% vs 0%; procedure-related arterial dissection <strong>14% vs 3%</strong>. Mortality 11% vs 10%.
                  <br />&bull; <strong>Caveat the authors raise:</strong> tirofiban was given to 334/348 (96%) in both arms, off-label, limiting generalisability.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>The Antiplatelet Loading Dilemma</strong>
                  <br />&bull; <strong>RESCUE BT (JAMA 2022; PMID: 35943471):</strong> 948 patients, 55 centres; IV tirofiban vs placebo before EVT. 90-d mRS adjusted common OR <strong>1.08 (95% CI 0.86&ndash;1.36) &mdash; no benefit</strong>; sICH 9.7% vs 6.4% (difference 3.3%; 95% CI &minus;0.2% to 6.8%).
                  <br />&bull; <strong>Where this leaves ICAD-related occlusion:</strong> evidence differs by agent, regimen, timing and population. ATTRACTION (2026) found benefit from its studied intra-arterial plus intravenous tirofiban strategy after successful anterior-LVO reperfusion, with numerically more symptomatic hemorrhage; that result does not by itself establish routine ICAD-specific use without a stent. Stent-related antiplatelet requirements and bleeding risks require an individualized plan documented by the treating neurointerventional team. <a href="https://pubmed.ncbi.nlm.nih.gov/42341797/" target="_blank" rel="noopener noreferrer">ATTRACTION primary report</a>.
                </div>
              </div>
            </CardSection>

            {/* §5 First 24 hours and handoff (red) */}
            <CardSection color="red" title="5. The First 24 Hours: Complications, Re-Imaging Triggers &amp; the Angio-Suite Handoff Script">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Periprocedural Complications to Hunt For</strong>
                  <br />&bull; <strong>Access site:</strong> femoral haematoma, retroperitoneal bleed (unexplained hypotension/tachycardia + flank pain), pseudoaneurysm; radial access shifts the risk to forearm haematoma and radial occlusion. Use the procedural team’s access-site and distal-perfusion monitoring plan; this reference does not establish a universal monitoring cadence.
                  <br />&bull; <strong>Post-EVT subarachnoid blood:</strong> evaluate promptly in its clinical and procedural context. Isolated sulcal blood can differ from symptomatic SAH or coexisting parenchymal hemorrhage; sulcal location alone does not establish a benign course.
                  <br />&bull; <strong>Embolisation to new territory:</strong> a deficit that does not match the treated vascular territory &mdash; re-image rather than attribute it to sedation.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Imaging, Staining vs Blood, and the Order Set</strong>
                  <br />&bull; <strong>Imaging:</strong> obtain urgent assessment and imaging for any new neurological deterioration or concerning headache/vomiting. After IV thrombolysis, follow the 24-hour imaging and antithrombotic precautions; emergent stenting and other antithrombotic indications require a specific procedural plan. Do not use a ≥4-point NIHSS change as the threshold to investigate.
                  <br />&bull; <strong>Contrast staining vs haemorrhage:</strong> dual-energy CT separates the two. In a single-centre retrospective series of 39 post-EVT patients (PMID: 35960327), parenchymal hyperdensity appeared in 17/39 (44%) and was read as haemorrhage in 9 (53%), pure contrast staining in 8 (47%) and a mixture in 6 (35%); DECT sensitivity 90%, specificity 100%, accuracy 95%, with inter-reader &kappa; 1.00 vs 0.51 for standard mixed images. Small and retrospective &mdash; a tie-breaker, not a licence to withhold repeat imaging.
                  <br />&bull; <strong>Ongoing care:</strong> document individualized BP targets, avoid hypoglycemia and excessive glucose lowering, treat hyperthermia, and screen swallowing before oral intake. The familiar q15-minute, q30-minute and hourly schedule is post-thrombolysis monitoring guidance, not a uniquely tested EVT regimen.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Handoff Script &mdash; Angio Suite to Neuro-ICU</strong>
                  <br />This suggested communication checklist is not a validated completeness rule. Adapt it to the procedure and ensure the receiving team can clarify the plan:
                  <br />&bull; <strong>1.</strong> Final <strong>mTICI/eTICI grade</strong> and which vessel remains occluded.
                  <br />&bull; <strong>2.</strong> Number of passes and technique used.
                  <br />&bull; <strong>3.</strong> <strong>Stent deployed? Yes/No</strong> &mdash; and if yes, which antiplatelet, what dose, at what time.
                  <br />&bull; <strong>4.</strong> Anesthesia type and the <strong>lowest intraprocedural SBP</strong>.
                  <br />&bull; <strong>5.</strong> Document BP goals and escalation criteria appropriate to reperfusion, symptoms and competing indications; avoid an automatic 140 mmHg lower boundary.
                  <br />&bull; <strong>6.</strong> Access site, closure device, sheath status.
                  <br />&bull; <strong>7.</strong> Any perforation, dissection, embolisation to new territory, or contrast staining seen on the flat-panel run.
                  <br />&bull; <strong>8.</strong> Contrast volume and renal function.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'ENCHANTED2/MT', cite: 'Yang P et al. Lancet. 2022;400(10363):1585-1596.', pmid: '36341753' },
              { label: 'OPTIMAL-BP', cite: 'Nam HS et al. JAMA. 2023;330(9):832-842.', pmid: '37668619' },
              { label: 'BEST-II', cite: 'Mistry EA et al. JAMA. 2023;330(9):821-831.', pmid: '37668620' },
              { label: 'PROTECT-MT', cite: 'Liu J et al. Lancet. 2024;404(10468):2165-2174.', pmid: '39579782' },
              { label: 'ANGEL-REBOOT', cite: 'Gao F et al. Lancet Neurol. 2024;23(8):797-806.', pmid: '38914085' },
              { label: 'GA vs Sedation IPD Meta-Analysis', cite: 'Schönenberger S et al. JAMA. 2019;322(13):1283-1293.', pmid: '31573636' },
              { label: 'AHA/ASA 2026 AIS Guideline', cite: 'Prabhakaran S et al. Stroke. 2026;57(8):e316-e436.', pmid: '41582814' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const IntracranialAtherosclerosisView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <IntracranialAtherosclerosisCard />
  </ScaledCardWrapper>
);

export function IntracranialAtherosclerosisCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Identify whether stenosis is symptomatic and whether embolic, perforator or hemodynamic mechanisms are plausible. Intensive medical prevention is central; a 90-day DAPT regimen applies to selected recent severe symptomatic stenosis, not every plaque. Acute low-flow symptoms require individualized BP decisions. Routine intracranial stenting has not established superiority over medical care.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-intracranial-atherosclerosis">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Intracranial Atherosclerotic Disease</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Mechanism-First Management &bull; WASID &bull; SAMMPRIS &bull; CASSISS &bull; BASIS &bull; CMOSS &bull; COSS &bull; ANGEL-REBOOT
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Mechanism first (teal) */}
            <CardSection color="teal" title="1. Mechanism First &mdash; Name It Before You Write the Orders">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '7px', fontSize: '6.9pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Artery-to-Artery Embolism</strong>
                  <br />&bull; <strong>Tell:</strong> multiple scattered cortical/subcortical DWI lesions in one territory downstream of the plaque.
                  <br />&bull; <strong>Prevention:</strong> 90-day aspirin–clopidogrel treatment is for selected recent severe symptomatic 70–99% stenosis with acceptable bleeding/hemorrhagic-transformation risk. Individualize acute BP management; long-term risk-factor treatment does not justify abrupt lowering in a flow-compromised patient.
                </div>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.4pt' }}>Branch Atheromatous Disease</strong>
                  <br />&bull; <strong>Tell:</strong> a single deep infarct extending to the surface of the parent artery (MCA M1, basilar) &mdash; plaque covers the perforator ostium.
                  <br />&bull; <strong>Changes:</strong> early fluctuation may occur. Perforator injury is a concern with stenting; this phenotype alone does not quantify an individual procedural risk.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.4pt' }}>Hemodynamic Borderzone Failure</strong>
                  <br />&bull; <strong>Tell:</strong> internal borderzone &quot;rosary bead&quot; infarcts; limb-shaking TIA; deficits reproduced by sitting up or by a BP dip.
                  <br />&bull; <strong>Low-flow symptoms:</strong> individualize BP target and tempo using the acute stroke context, perfusion and competing indications. Other mechanisms can also require cautious treatment.
                </div>
                <div style={{ border: '1.5px dashed var(--rule)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Mixed Mechanisms May Coexist</strong>
                  <br />&bull; Mixed mechanism was the single most common subtype (32.7%) in 217 symptomatic ICAD patients phenotyped with vessel-wall MRI plus perfusion (PMID 40375586).
                  <br />&bull; Assess coexisting mechanisms and individual treatment indications. A mechanism label alone does not prescribe combined antithrombotics or a BP regimen.
                </div>
              </div>
            </CardSection>

            {/* §2 Trial ledger (purple) */}
            <CardSection color="purple" title="2. The Randomized Ledger &mdash; Antithrombotics and Stenting">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.4pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '128px' }}>Trial</th>
                    <th style={{ width: '150px' }}>Population &amp; Comparison</th>
                    <th>Result &mdash; Stated in the Direction the Trial Found</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>WASID</strong><br />NEJM 2005;352:1305<br />PMID: 15800226</td>
                    <td>569 pts with TIA/stroke from 50&ndash;99% intracranial stenosis. Warfarin (INR 2.0&ndash;3.0) vs aspirin 1300 mg/d.</td>
                    <td><strong style={{ color: 'var(--red-deep)' }}>Neutral for efficacy, harmful for safety.</strong> Primary endpoint 21.8% warfarin vs 22.1% aspirin (HR for aspirin vs warfarin 1.04; 95% CI 0.73&ndash;1.48; p=0.83). Warfarin: death 9.7% vs 4.3% (p=0.02), major hemorrhage 8.3% vs 3.2% (p=0.01). Enrollment stopped for safety. <strong>Aspirin, not warfarin.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>WASID High-Risk Phenotype</strong><br />Circulation 2006;113:555<br />PMID: 16432056</td>
                    <td>Same cohort, mean follow-up 1.8 y. Prespecified search for the group worth randomizing to stenting.</td>
                    <td>106/569 (19.0%) had recurrent ischemic stroke; 77 (73%) were in the stenotic artery&rsquo;s territory. Risk highest with stenosis <strong>&ge;70%</strong> (HR 2.03; 95% CI 1.29&ndash;3.22; p=0.0025) and enrollment <strong>&le;17 days</strong> after the qualifying event (HR 1.69; 95% CI 1.06&ndash;2.72; p=0.028). <strong>These findings informed subsequent severe symptomatic-stenosis prevention trials; they do not describe every later bypass or rescue study.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>SAMMPRIS</strong><br />NEJM 2011;365:993 (PMID: 21899409)<br />Lancet 2014;383:333 (PMID: 24168957)</td>
                    <td>451 pts, 70&ndash;99% stenosis, TIA/nondisabling stroke within 30 d. Aggressive medical management &plusmn; Wingspan PTAS.</td>
                    <td><strong style={{ color: 'var(--red-deep)' }}>Stenting was worse.</strong> 30-day stroke or death 14.7% PTAS vs 5.8% medical (p=0.002); 1-year primary endpoint 20.0% vs 12.2% (p=0.009); enrollment halted. Final results at median 32.4 mo: 52/224 (23%) PTAS vs 34/227 (15%) medical (p=0.0252); any stroke 26% vs 19% (p=0.0468); major hemorrhage 13% vs 4% (p=0.0009). <strong>The winning arm was the whole bundle, not DAPT alone.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>CASSISS</strong><br />JAMA 2022;328:534<br />PMID: 35943472</td>
                    <td>358 eligible pts at 8 experienced Chinese centers; 70&ndash;99% stenosis, non-perforator territory, enrolled <strong>beyond 3 weeks</strong> from the last symptom. Stenting + medical vs medical.</td>
                    <td><strong>Neutral &mdash; no benefit from stenting.</strong> 30-day stroke/death or subsequent qualifying-territory stroke through one year: 8.0% (14/176) vs 7.2% (13/181); HR 1.10 (95% CI 0.52&ndash;2.35); p=0.82. Territory stroke at 3 y 11.3% vs 11.2%; HR 1.00 (0.53&ndash;1.90). 3-y mortality 4.4% vs 1.3% (HR 3.75; 0.77&ndash;18.13; p=0.08). <strong>Better operators and cooler timing did not rescue stenting.</strong></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 The bundle (amber) */}
            <CardSection color="amber" title="3. The Orders You Actually Write &mdash; the SAMMPRIS Aggressive Medical Bundle">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Antithrombotics</strong>
                  <br />&bull; <strong>Aspirin 325 mg daily + clopidogrel 75 mg daily for 90 days</strong>, then aspirin alone &mdash; the exact regimen of the SAMMPRIS medical arm (PMID: 21899409). CASSISS used the identical 90-day DAPT window before dropping to a single agent.
                  <br />&bull; <strong>Do not choose warfarin solely for atherosclerotic ICAD</strong>; separate indications such as a mechanical valve require their own assessment (WASID, PMID: 15800226). No anticoagulant has yet outperformed antiplatelet therapy here; CAPTIVA (NCT05047172, active-not-recruiting) is testing ticagrelor against clopidogrel, each added to aspirin (PMID: 39862061). Its <strong>low-dose rivaroxaban (2.5 mg BID) arm was terminated by the NIH DSMB</strong> at the first-stage analysis in January 2026 (announced February 10, 2026) for increased safety events plus futility vs clopidogrel + aspirin; the ticagrelor and clopidogrel arms continue.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Blood Pressure &mdash; and the Real Caveat</strong>
                  <br />&bull; <strong>SAMMPRIS protocol target: SBP &lt;140 mmHg (&lt;130 mmHg in diabetics)</strong> alongside LDL &lt;70 mg/dL &mdash; these two were the trial&rsquo;s designated primary risk factors. Long-term goals follow the AHA/ASA 2021 secondary prevention guideline (PMID: 34024117).
                  <br />&bull; <strong>Permissive hypertension is not supported:</strong> in 567 WASID patients, higher mean SBP and DBP were associated with <em>more</em> ischemic stroke, including stroke in the stenotic territory (PMID: 17515467).
                  <br />&bull; <strong>Target and tempo both matter:</strong> stable long-term BP associations do not validate automatic lowering during acute borderzone symptoms or documented low flow. Hemodynamic impairment and large pressure reductions may identify vulnerable patients; there is no single replacement target established for all of them.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Lipids, Glucose, Behavior</strong>
                  <br />&bull; <strong>LDL &lt;70 mg/dL</strong> (SAMMPRIS primary target; rosuvastatin was supplied in-trial). Escalate with ezetimibe &plusmn; PCSK9 inhibitor rather than accepting a near-miss.
                  <br />&bull; Secondary targets managed by protocol: diabetes, non-HDL cholesterol, smoking cessation, weight, and exercise.
                  <br />&bull; <strong>Physical activity was the strongest predictor of a good outcome</strong> in the medical arm (OR 0.6; 95% CI 0.4&ndash;0.8; PMID: 28003500). Prescribe it like a drug.
                </div>
              </div>
            </CardSection>

            {/* §4 Bypass and acute rescue (red) */}
            <CardSection color="red" title="4. Beyond the Stent &mdash; Bypass and Acute Rescue (Both Negative on Their Primary Endpoints)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.33', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>CMOSS &mdash; Modern EC-IC Bypass</strong>
                  <br />&bull; 324 pts with symptomatic atherosclerotic ICA or MCA occlusion and CT-perfusion hemodynamic insufficiency, 13 Chinese centers (JAMA 2023;330:704; PMID: 37606672).
                  <br />&bull; <strong style={{ color: 'var(--red-deep)' }}>Negative on the primary endpoint:</strong> 30-day stroke/death or 2-year ipsilateral stroke 8.6% (13/151) surgical vs 12.3% (19/155) medical; HR 0.71 (95% CI 0.33&ndash;1.54); p=0.39. All 9 secondary endpoints neutral.
                  <br />&bull; The trade is front-loaded: 30-day stroke or death 6.2% surgical vs 1.8% medical, against 2.0% vs 10.3% late ipsilateral stroke.
                </div>
                <div style={{ border: '1.5px solid var(--slate)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.6pt' }}>The Older Bypass Literature Agrees</strong>
                  <br />&bull; <strong>COSS (JAMA 2011;306:1983; PMID: 22068990):</strong> 195 pts with symptomatic ICA occlusion and PET-verified elevated oxygen extraction fraction. <strong>Stopped for futility</strong> &mdash; 2-year primary endpoint 21.0% surgical vs 22.7% nonsurgical (p=0.78); 30-day ipsilateral stroke 14.4% vs 2.0%.
                  <br />&bull; <strong>EC/IC Bypass Study (NEJM 1985;313:1191; PMID: 2865674):</strong> 1377 pts; despite 96% graft patency, stroke occurred <em>more</em> frequently and earlier after surgery. Severe MCA stenosis and persistent symptoms after ICA occlusion fared worse.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Acute Rescue After Thrombectomy</strong>
                  <br />&bull; <strong>ANGEL-REBOOT (Lancet Neurol 2024;23:797; PMID: 38914085):</strong> 348 pts with eTICI 0&ndash;2a or &gt;70% residual stenosis after thrombectomy, randomized to bailout angioplasty/stenting vs standard care.
                  <br />&bull; <strong style={{ color: 'var(--red-deep)' }}>Negative at 90 days:</strong> common OR 0.86 (95% CI 0.59&ndash;1.24; p=0.41), with more symptomatic ICH (8/175 [5%] vs 1/169 [1%]), more PH2 (6/175 [3%] vs 0), and more procedural dissection (24/176 [14%] vs 5/172 [3%]).
                  <br />&bull; 1-year follow-up favored bailout (generalized OR 1.34; 95% CI 1.05&ndash;1.73; p=0.02; PMID: 41122847) &mdash; a later secondary timepoint that does <strong>not</strong> overturn the neutral 90-day primary. Treat rescue stenting as case-by-case, not routine.
                </div>
              </div>
            </CardSection>

            {/* §5 Imaging and the residual role for intervention (teal) */}
            <CardSection color="teal" title="5. Imaging That Changes Management &amp; Where Intervention Is Still Discussed">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>High-Resolution Vessel-Wall MRI</strong>
                  <br />&bull; Vessel-wall MRI can assist a differential that includes atherosclerosis, vasculitis, dissection and RCVS. Enhancement patterns overlap and should not be interpreted as a definitive etiologic classifier.
                  <br />&bull; In 388 ICAD stroke patients, intraplaque hemorrhage (HR 2.55; 95% CI 1.47&ndash;4.40) and plaque enhancement ratio (HR 1.62; 95% CI 1.11&ndash;2.38) predicted recurrence (PMID: 41891365).
                  <br />&bull; <span style={{ color: 'var(--ink-mute)' }}>Observational, single-center &mdash; a &quot;high-risk plaque&quot; buys prognostic weight and urgency, not an indication to stent.</span>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Perfusion &amp; Quantitative Flow</strong>
                  <br />&bull; Perfusion imaging and quantitative flow measurements can inform hemodynamic assessment, but embolic and low-flow mechanisms may coexist. Techniques and validated populations differ.
                  <br />&bull; In the same multiparametric cohort, a hypoperfusion mechanism carried the highest recurrence risk (HR 3.97; 95% CI 1.43&ndash;11.03; PMID: 40375586).
                  <br />&bull; Note the sobering counterpoint: CMOSS selected on CTP hemodynamic insufficiency and COSS on PET oxygen extraction &mdash; and neither revascularization trial was positive.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>The Narrow Residual Role for Intervention</strong>
                  <br />&bull; Routine stenting is not first-line prevention for symptomatic intracranial stenosis. Recurrent events or suspected flow failure warrant expert review of mechanism, medical treatment and the distinct evidence for balloon angioplasty, stenting or rescue intervention.
                  <br />&bull; <strong>One randomized trial <em>is</em> positive &mdash; BASIS</strong> (JAMA 2024;332:1059; PMID: 39235816): submaximal balloon angioplasty + aggressive medical management vs medical alone, 501 pts; primary endpoint 4.4% vs 13.5%; HR 0.32 (95% CI 0.16&ndash;0.63); p&lt;0.001 &mdash; but open-label, all-Chinese sites, 17.4% procedural complications, 14.5% dissection, and a primary composite that also counted revascularization of the qualifying artery (1.2% vs 8.3%). <strong>No stenting trial has ever been positive.</strong>
                  <br />&bull; <strong>Counseling:</strong> quote trial risks with the procedure, population, timing and confidence intervals. A pooled or historical trial event rate is not an individualized modern procedural forecast.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.4pt' }} refs={[
              { label: 'WASID', cite: 'Chimowitz MI et al. N Engl J Med. 2005;352(13):1305-1316.', pmid: '15800226' },
              { label: 'WASID High-Risk Phenotype', cite: 'Kasner SE et al. Circulation. 2006;113(4):555-563.', pmid: '16432056' },
              { label: 'WASID Blood Pressure', cite: 'Turan TN et al. Circulation. 2007;115(23):2969-2975.', pmid: '17515467' },
              { label: 'SAMMPRIS', cite: 'Chimowitz MI et al. N Engl J Med. 2011;365(11):993-1003.', pmid: '21899409' },
              { label: 'SAMMPRIS Final', cite: 'Derdeyn CP et al. Lancet. 2014;383(9914):333-341.', pmid: '24168957' },
              { label: 'SAMMPRIS Risk Factor Control', cite: 'Turan TN et al. Neurology. 2017;88(4):379-385.', pmid: '28003500' },
              { label: 'CASSISS', cite: 'Gao P et al. JAMA. 2022;328(6):534-542.', pmid: '35943472' },
              { label: 'BASIS', cite: 'Sun X et al. JAMA. 2024;332(13):1059-1069.', pmid: '39235816' },
              { label: 'CMOSS', cite: 'Ma Y et al. JAMA. 2023;330(8):704-714.', pmid: '37606672' },
              { label: 'COSS', cite: 'Powers WJ et al. JAMA. 2011;306(18):1983-1992.', pmid: '22068990' },
              { label: 'ANGEL-REBOOT', cite: 'Gao F et al. Lancet Neurol. 2024;23(8):797-806.', pmid: '38914085' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const UnrupturedIntracranialAneurysmView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <UnrupturedIntracranialAneurysmCard />
  </ScaledCardWrapper>
);

export function UnrupturedIntracranialAneurysmCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Suspected SAH or a new third-nerve palsy requires urgent evaluation. For an otherwise unruptured aneurysm, compare estimated rupture risk with treatment risk, life expectancy, anatomy and patient preferences. Scores and pooled procedural rates support discussion but are not personalized guarantees. Surveillance intervals and repair technique require specialist judgment.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-unruptured-intracranial-aneurysm">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Unruptured Intracranial Aneurysm</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Counseling the Incidentaloma &bull; PHASES &bull; ISUIA &bull; UCAS Japan &bull; ELAPSS &bull; Treatment-Risk Ledger &bull; Surveillance
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Triage before any calculation (red) */}
            <CardSection color="red" title="1. Triage Before You Calculate &mdash; Incidental Is a Diagnosis, Not an Assumption">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Symptomatic &rarr; Different Pathway Entirely</strong>
                  <br />&bull; <strong>New third-nerve palsy with a dilated pupil</strong> is expansion or sentinel bleeding of a PCom (or superior cerebellar) aneurysm until angiography says otherwise &mdash; secure it, do not surveil it.
                  <br />&bull; <strong>Thunderclap headache or suspected SAH:</strong> use an urgent diagnostic pathway. CT-positive SAH does not require LP to confirm it; selected patients presenting within six hours without a new neurological deficit may be evaluated with high-quality CT alone under the applicable guideline. Other situations may require additional testing.
                  <br />&bull; Risk models derived for unruptured aneurysms do not replace urgent evaluation of a new symptomatic presentation. Do not assign a reassuring individual forecast from PHASES alone in this setting.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Who Has One, and Who to Look For</strong>
                  <br />&bull; Pooled prevalence <strong>3.2% (95% CI 1.9&ndash;5.2)</strong> in adults without comorbidity, mean age 50 &mdash; 68 studies, 1450 aneurysms in 94,912 patients (PMID: 21641282).
                  <br />&bull; Prevalence ratios: <strong>ADPKD 6.9 (3.5&ndash;14)</strong>, family history of aneurysm or SAH <strong>3.4 (1.9&ndash;5.9)</strong>, women vs men 1.61 (1.02&ndash;2.54), rising to 2.2 (1.3&ndash;3.6) in cohorts with mean age above 50.
                  <br />&bull; Screening decisions depend on the specific inherited disorder, family history and available guidance; a broad connective-tissue or arteriopathy label is not a universal screening indication. See <em>Fibromuscular Dysplasia &amp; Cervical Artery Dissection</em> for condition-specific context.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Familial Screening &mdash; Yield and Its Limits</strong>
                  <br />&bull; With <strong>&ge;2 first-degree relatives</strong> affected by aSAH, aneurysms were found in <strong>51/458 (11%, 95% CI 9&ndash;14)</strong> at first screen, 21/261 (8%) at second, 7/128 (5%) at third, 3/63 (5%) at fourth (PMID: 24618352).
                  <br />&bull; <strong>De novo aneurysms formed after two negative screens</strong> in 5/188 (3%) &mdash; and one patient ruptured a de novo aneurysm 3 years after a negative screen. Serial screening can detect new aneurysms; this observational yield study does not by itself prove a reduction in rupture risk.
                  <br />&bull; Predictors of a positive first screen: smoking OR 2.7 (1.2&ndash;5.9), prior aneurysm OR 3.9 (1.2&ndash;12.7), familial aneurysm history OR 3.5 (1.6&ndash;8.1).
                </div>
              </div>
            </CardSection>

            {/* §2 PHASES (purple) */}
            <CardSection color="purple" title="2. PHASES &mdash; The Six Components and the 5-Year Absolute Risk They Generate" subtitle="Greving JP et al. Lancet Neurol 2014 &bull; pooled individual data, 8382 patients, 230 ruptures over 29,166 person-years &bull; PMID 24290159">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '92px' }}>Component</th>
                    <th style={{ width: '210px' }}>What Is Recorded</th>
                    <th>Direction and Magnitude as Published</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>P</strong> &mdash; Population</td>
                    <td>North America / Europe other than Finland (reference), Japan, or Finland.</td>
                    <td>Finnish patients carried a <strong>3.6-fold</strong> and Japanese patients a <strong>2.8-fold</strong> higher rupture risk than the reference population. Because UIA prevalence is comparable across these countries (PMID: 21641282), the geographic term is a rupture-propensity multiplier, not a detection artifact.</td>
                  </tr>
                  <tr>
                    <td><strong>H</strong> &mdash; Hypertension<br /><strong>A</strong> &mdash; Age</td>
                    <td>Hypertension present or absent; age dichotomized at <strong>70 years</strong>.</td>
                    <td>Age and hypertension contribute to the PHASES model. Age also affects life expectancy and some procedural risks, but does not automatically determine observation versus repair.</td>
                  </tr>
                  <tr>
                    <td><strong>S</strong> &mdash; Size</td>
                    <td>Maximum diameter banded as <strong>&lt;7.0, 7.0&ndash;9.9, 10.0&ndash;19.9, and &ge;20 mm</strong>.</td>
                    <td>Size is an important predictor; the illustrative low- and high-risk profiles below differ in several variables, not size alone.</td>
                  </tr>
                  <tr>
                    <td><strong>E</strong> &mdash; Earlier SAH<br /><strong>S</strong> &mdash; Site</td>
                    <td>Prior SAH from a <em>different</em> aneurysm; site as ICA, MCA, or ACA / PCom / posterior circulation.</td>
                    <td>Prior SAH raises risk for the remaining aneurysm. Site risk rises ICA &rarr; MCA &rarr; ACA, PCom, and posterior circulation.</td>
                  </tr>
                  <tr>
                    <td style={{ background: 'var(--purple-soft)' }}><strong>Output</strong></td>
                    <td style={{ background: 'var(--purple-soft)' }}>5-year absolute rupture risk read off the published PHASES chart.</td>
                    <td style={{ background: 'var(--purple-soft)' }}>Pooled observed risk was <strong>1.4% at one year (95% CI 1.1&ndash;1.6)</strong> and <strong>3.4% at 5 years (2.9&ndash;4.0)</strong>. In North American / European populations the estimate ranged from <strong>0.25%</strong> (age &lt;70, no vascular risk factors, small &lt;7 mm ICA aneurysm) to <strong>more than 15%</strong> (age &ge;70, hypertension, earlier SAH, giant &gt;20 mm posterior-circulation aneurysm).</td>
                  </tr>
                </tbody>
              </table></div>
              <div style={{ marginTop: '5px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)', borderLeft: '3px solid var(--red)', paddingLeft: '7px' }}>
                <strong style={{ color: 'var(--red-deep)' }}>Two limitations to say out loud before you quote the number.</strong> (1) <strong>PHASES estimates rupture risk only.</strong> It contains no term for procedural morbidity, so it can never by itself justify treating &mdash; the treat-versus-observe decision needs both columns of &sect;4. (2) <strong>It performs poorly in multiple aneurysms.</strong> In 701 patients with 1673 aneurysms, patient-level discrimination using the largest aneurysm&rsquo;s PHASES score gave an AUC of only <strong>0.572</strong>, falling to 0.450 once a patient had 4 or more aneurysms (PMID: 33631473). The <strong>UIATS</strong> Delphi consensus (69 specialists, 29 factors; PMID: 26276380) is a structured way to capture what PHASES omits &mdash; but it is expert agreement, not an outcome-validated predictor.
              </div>
            </CardSection>

            {/* §3 Natural history evidence (amber) */}
            <CardSection color="amber" title="3. Natural History &mdash; ISUIA, UCAS Japan, and What Growth Adds">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.4pt' }}>
                <thead>
                  <tr style={{ background: 'var(--amber)' }}>
                    <th style={{ width: '118px' }}>Study</th>
                    <th style={{ width: '148px' }}>Design</th>
                    <th>Result &mdash; as the Study Reported It</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>ISUIA</strong><br />Lancet 2003;362:103<br />PMID: 12867109</td>
                    <td>4060 patients across the USA, Canada and Europe: 1692 no repair, 1917 open surgery, 451 endovascular.</td>
                    <td><strong>5-year cumulative rupture, no prior SAH, ICA / ACom-ACA / MCA:</strong> 0% (&lt;7 mm), 2.6% (7&ndash;12 mm), 14.5% (13&ndash;24 mm), 40% (&ge;25 mm). <strong>Posterior circulation and PCom:</strong> 2.5%, 14.5%, 18.4%, 50% for the same bands. The authors&rsquo; own conclusion is the point of the paper: <strong style={{ color: 'var(--red-deep)' }}>these rates were often equalled or exceeded by the risks of surgical or endovascular repair of comparable lesions.</strong> Age strongly predicted surgical outcome.</td>
                  </tr>
                  <tr>
                    <td><strong>UCAS Japan</strong><br />N Engl J Med 2012;366:2474<br />PMID: 22738097</td>
                    <td>5720 patients (mean age 62.5, 68% women) with 6697 saccular aneurysms &ge;3 mm; 91% incidental; mean size 5.7 &plusmn; 3.6 mm; 11,660 aneurysm-years.</td>
                    <td>111 ruptures &mdash; <strong>annual rupture rate 0.95% (95% CI 0.79&ndash;1.15)</strong>. HR vs 3&ndash;4 mm: 5&ndash;6 mm <strong>1.13 (0.58&ndash;2.22, not significant)</strong>; 7&ndash;9 mm 3.35 (1.87&ndash;6.00); 10&ndash;24 mm 9.09 (5.25&ndash;15.74); &ge;25 mm 76.26 (32.76&ndash;177.54). vs MCA: <strong>ACom 2.02 (1.13&ndash;3.58)</strong>, <strong>PCom 1.90 (1.12&ndash;3.21)</strong>. <strong>Daughter sac 1.63 (1.08&ndash;2.48)</strong> &mdash; the morphology term PHASES omits.</td>
                  </tr>
                  <tr>
                    <td><strong>ELAPSS</strong><br />Neurology 2017;88:1600<br />PMID: 28363976</td>
                    <td>Pooled data from 10 cohorts: 1507 patients, 1909 aneurysms with follow-up imaging. Outcome is <em>growth</em>, not rupture.</td>
                    <td>Growth in 267 aneurysms (14%) over 5782 patient-years. Predictors: <strong>E</strong>arlier SAH, <strong>L</strong>ocation, <strong>A</strong>ge &gt;60, <strong>P</strong>opulation, <strong>S</strong>ize, <strong>S</strong>hape. 3-year growth risk spans <strong>&lt;5% to &gt;42%</strong>; 5-year <strong>&lt;9% to &gt;60%</strong>. Use it to set the imaging interval, not the treatment decision.</td>
                  </tr>
                  <tr>
                    <td><strong>Growth &rarr; rupture</strong><br />Radiology 2013;269:258<br />PMID: 23821755</td>
                    <td>165 patients, 258 aneurysms followed with serial CTA, mean 2.24 years.</td>
                    <td>46/258 (18%) grew. Rupture occurred in 4/228 (1.8%) intradural aneurysms, mean size 6.2 mm. <strong>Rupture per patient-year: 2.4% (95% CI 0.5&ndash;7.12) with growth vs 0.2% (0.006&ndash;1.22) without (p=0.034)</strong> &mdash; roughly 12-fold (p&lt;0.002). Smoking and initial size independently predicted growth. <strong>Documented growth is the single most actionable surveillance finding.</strong></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §4 The treatment side of the ledger (teal) */}
            <CardSection color="teal" title="4. The Other Half of the Ledger &mdash; What Repair Actually Costs">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Pooled Procedural Risk &mdash; Not an Individual Forecast</strong>
                  <br />&bull; Meta-analysis of <strong>114 studies, 106,433 patients, 108,263 aneurysms</strong> (JAMA Neurol 2019; PMID: 30592482).
                  <br />&bull; <strong>Endovascular (74 studies):</strong> 30-day clinical complications <strong>4.96% (95% CI 4.00&ndash;6.12)</strong>; case fatality <strong>0.30% (0.20&ndash;0.40)</strong>.
                  <br />&bull; <strong>Neurosurgical (54 studies):</strong> complications <strong>8.34% (6.25&ndash;11.10)</strong>; case fatality <strong>0.10% (0.00&ndash;0.20)</strong>.
                  <br />&bull; Endovascular risk multipliers: wide neck &gt;4 mm or dome-to-neck &lt;1.5 (OR 1.71; full-text definition, correcting the abstract’s inconsistent inequality), posterior circulation (OR 1.42), stent-assisted coiling (OR 1.82), stenting (OR 3.43; 1.45&ndash;8.09).
                  <br />&bull; Surgical risk multipliers: posterior location (OR 7.25; 3.70&ndash;14.20), anticoagulant use (OR 6.36), smoking (OR 1.95), age (OR 1.02 per year).
                </div>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.5pt' }}>Modality &mdash; and the Antiplatelet Obligation</strong>
                  <br />&bull; <strong>Flow diversion (PREMIER; PMID: 31308197):</strong> single-arm, 141 patients with unruptured wide-necked ICA/VA aneurysms &le;12 mm (mean 5.0 &plusmn; 1.92 mm; 84.4% &lt;7 mm). Complete occlusion without significant stenosis or retreatment at 1 year in <strong>106/138 (76.8%)</strong>; major morbidity and mortality <strong>2.1%</strong>.
                  <br />&bull; <strong>Read that population carefully</strong> &mdash; most target lesions were &lt;7 mm, exactly the band ISUIA and PHASES place at the lowest natural-history risk. Single-arm, no comparator.
                  <br />&bull; <strong>A flow diverter commits the patient to dual antiplatelet therapy</strong> before and for months after implantation, with platelet-function testing where available. That obligation is itself a reason to decline treatment in a faller, a patient needing near-term surgery, or one who cannot adhere.
                  <br />&bull; <strong>Intrasaccular device (WEB-IT; PMID: 30992395):</strong> 150 patients with wide-neck bifurcation aneurysms; one primary safety event (0.7%). <strong>Complete occlusion at 12 months only 53.8% (77/143)</strong>, adequate occlusion 84.6% &mdash; safe, but state the occlusion rate honestly.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Durability &mdash; and Where the Data Come From</strong>
                  <br />&bull; The durability comparison everyone quotes is <strong>ISAT, which enrolled ruptured aneurysms</strong> (PMID: 25465111): 1644 UK patients followed 10.0&ndash;18.5 years. Alive at 10 years 674/809 (83%) coiled vs 657/835 (79%) clipped, OR 1.35 (1.06&ndash;1.73); alive and independent OR 1.34 (1.07&ndash;1.67). 33 recurrent SAH beyond 1 year, 17 from the target aneurysm &mdash; rebleeding was more likely after coiling, but small.
                  <br />&bull; <strong>Extrapolating ISAT to elective repair of an unruptured aneurysm is an assumption, not evidence.</strong> No adequately powered randomized trial compares clipping, coiling, and observation in unruptured aneurysms.
                  <br />&bull; Choice of clipping, coiling or another technique depends on anatomy, patient factors, expertise and comparative risks. Observational pooled comparisons do not establish universal superiority of one modality; discuss retreatment and durability as well as immediate harms.
                </div>
              </div>
            </CardSection>

            {/* §5 Surveillance, modifiers, and the two conversations (amber) */}
            <CardSection color="amber" title="5. Surveillance, the Modifiers the Scores Miss, and the Two Hard Conversations">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.4pt' }}>Individualized Surveillance Planning</strong>
                  <br />&bull; <strong>Modality:</strong> select MRA or CTA according to the aneurysm, prior treatment, image quality and contraindications. DSA is reserved for selected diagnostic or treatment-planning questions.
                  <br />&bull; <strong>Measurement:</strong> compare reproducible studies and account for measurement error before declaring growth; apparent enlargement is not automatically either artifact or biology.
                  <br />&bull; <strong>Interval:</strong> individualize surveillance frequency and duration through shared decision-making. Growth estimates may inform the discussion, but no fixed calendar applies to everyone. Documented growth warrants renewed treatment-risk assessment.
                  <br />&bull; <strong>Duration of follow-up:</strong> periodically reassess whether surveillance would change management, considering life expectancy, treatment options, preferences and uncertainty. Do not use a single comparison of procedural risk with a five-year rupture estimate as an automatic stopping rule.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Modifiers the Scores Do Not Capture</strong>
                  <br />&bull; <strong>Irregular contour or daughter sac</strong> &mdash; HR 1.63 (1.08&ndash;2.48) in UCAS Japan (PMID: 22738097); it is in ELAPSS as &ldquo;shape&rdquo; but absent from PHASES.
                  <br />&bull; <strong>Documented interval growth</strong> is associated with higher rupture risk; interpret it alongside morphology, size, site and patient factors (PMID: 23821755).
                  <br />&bull; <strong>&ge;2 first-degree relatives with aSAH</strong> &mdash; screen the family and weight the individual&rsquo;s risk upward (PMID: 24618352).
                  <br />&bull; <strong>Active smoking and hypertension</strong> &mdash; OR 3.0 (2.0&ndash;4.5) and 2.9 (1.9&ndash;4.6) for harboring an aneurysm; jointly OR 8.3 (4.5&ndash;15.2), more than additive (PMID: 23422088).
                  <br />&bull; <strong>ADPKD</strong> (prevalence ratio 6.9), and the connective-tissue / FMD context &mdash; cross-reference <em>Fibromuscular Dysplasia &amp; Cervical Artery Dissection</em>.
                  <br />&bull; <span style={{ color: 'var(--ink-mute)' }}>Formal recommendations on presentation, screening, imaging and treatment outcomes: AHA/ASA 2015 UIA guideline (PMID: 26089327).</span>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.4pt' }}>Scripts for the Two Hard Conversations</strong>
                  <br />&bull; <strong>Shared decision:</strong> use the patient’s estimated rupture risk over a defined horizon and the team’s applicable treatment-risk estimate. Discuss uncertainty, the different severity of possible outcomes, life expectancy and preferences. Address smoking and BP, and document an individualized surveillance or treatment plan.
                  <br />&bull; <strong>&ldquo;We found a second aneurysm.&rdquo;</strong> Explain that multiple aneurysms can occur and require assessment of each lesion and the patient’s overall risk; neither simply doubling nor holding the risk unchanged is a validated individual calculation. Be candid that the models are weakest here: PHASES applied to the largest aneurysm discriminated at AUC 0.572 in 701 multiple-aneurysm patients, and worse with 4 or more (PMID: 33631473). Manage each aneurysm on its own size, site and shape; a prior SAH from one raises the risk of the others (the &ldquo;E&rdquo; of PHASES). Escalate to a multidisciplinary neurovascular discussion rather than a single-number verdict.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.4pt' }} refs={[
              { label: 'PHASES', cite: 'Greving JP et al. Lancet Neurol. 2014;13(1):59-66.', pmid: '24290159' },
              { label: 'ISUIA', cite: 'Wiebers DO et al. Lancet. 2003;362(9378):103-110.', pmid: '12867109' },
              { label: 'UCAS Japan', cite: 'Morita A et al. N Engl J Med. 2012;366(26):2474-2482.', pmid: '22738097' },
              { label: 'ELAPSS', cite: 'Backes D et al. Neurology. 2017;88(17):1600-1606.', pmid: '28363976' },
              { label: 'Treatment Risk Meta-analysis', cite: 'Algra AM et al. JAMA Neurol. 2019;76(3):282-293.', pmid: '30592482' },
              { label: 'Growth and Rupture', cite: 'Villablanca JP et al. Radiology. 2013;269(1):258-265.', pmid: '23821755' },
              { label: 'Familial Screening', cite: 'Bor ASE et al. Lancet Neurol. 2014;13(4):385-392.', pmid: '24618352' },
              { label: 'AHA/ASA 2015 UIA Guideline', cite: 'Thompson BG et al. Stroke. 2015;46(8):2368-2400.', pmid: '26089327' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const PrehospitalTriageSystemsView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <PrehospitalTriageSystemsCard />
  </ScaledCardWrapper>
);

export function PrehospitalTriageSystemsCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Choose regional routing from the complete time pathway, local capabilities and diagnostic mix. LVO scales do not exclude hemorrhage, mimics or smaller strokes, and their sensitivity and specificity may change across settings. A neutral routing trial does not prove that all subtype effects cancel; avoid routine undifferentiated BP lowering while recognizing other emergency indications.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-prehospital-triage-systems">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Prehospital Triage &amp; Stroke Systems of Care</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              RACECAT &bull; TRIAGE-STROKE &bull; BEST-MSU &bull; B_PROUD &bull; INTERACT4 &bull; RACE / LAMS / C-STAT / FAST-ED &bull; Door-In-Door-Out
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Routing rule construction (teal) */}
            <CardSection color="teal" title="1. Mothership vs Drip-and-Ship &mdash; Build the Rule From Local Numbers, Not Someone Else&#39;s Trial">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What Bypass Actually Buys and Costs</strong>
                  <br />&bull; <strong>Buys EVT access:</strong> in RACECAT, direct transport raised thrombectomy delivery from 39.4% to 48.8% (OR 1.46; 95% CI 1.13&ndash;1.89).
                  <br />&bull; <strong>Costs lysis:</strong> the same bypass cut IV thrombolysis from 60.4% to 47.5% (OR 0.59; 95% CI 0.45&ndash;0.76).
                  <br />&bull; The primary functional outcome did not differ significantly: 90-day mRS adjusted common OR 1.03 (95% CI 0.82&ndash;1.29) &mdash; a genuinely neutral trial, not a positive one.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The Five Inputs to Your Local Crossover</strong>
                  <br />&bull; <strong>1. LVO probability</strong> = scale PPV at <em>your</em> LVO prevalence, not the derivation cohort&#39;s.
                  <br />&bull; <strong>2. Incremental transport time</strong> to the EVT centre (drive time, not map distance; day vs night).
                  <br />&bull; <strong>3. IVT delay:</strong> compare total onset-to-treatment pathways, including transport, hospital processing and transfer effects; door-to-needle differences alone are insufficient.
                  <br />&bull; <strong>4. EVT-centre capacity</strong> &mdash; door-to-puncture, angio-suite availability, false-positive absorption.
                  <br />&bull; <strong>5. Non-ischemic fraction</strong> among scale-positives (ICH + mimic), whose optimal destination depends on capabilities and subtype-specific evidence.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Why an LVO Scale Cannot Govern Routing Alone</strong>
                  <br />&bull; Of the 1401 RACE&gt;4 patients enrolled in RACECAT, <strong>302 (22%) had ICH</strong> and <strong>106 (8%) were stroke mimics</strong>. A scale reads <em>severity</em>, not <em>pathology</em> &mdash; roughly one field-positive in three is routed by a rule built for a disease they do not have.
                  <br />&bull; RACECAT enrolled non-urban Catalonia and required an <em>estimated arrival at the EVT centre within 7 h of last-known-well</em> (protocol PMID 31142219) &mdash; an entry criterion, not a 7 h transport radius. Do not transplant its result to dense urban networks or to very long transport regions without local modelling.
                </div>
              </div>
            </CardSection>

            {/* §2 Randomized routing evidence (purple) */}
            <CardSection color="purple" title="2. Randomized Evidence on Where the Ambulance Goes">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '128px' }}>Trial &amp; Design</th>
                    <th style={{ width: '150px' }}>Population &amp; Comparison</th>
                    <th style={{ width: '175px' }}>Primary Result (state it plainly)</th>
                    <th>Bedside Implication</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>RACECAT</strong><br />Cluster-RCT within a cohort<br />JAMA 2022; PMID 35510397</td>
                    <td>1401 suspected LVO (RACE &gt;4) in non-urban Catalonia; direct to thrombectomy-capable centre (n=688) vs nearest local stroke centre (n=713). 949 formed the ischemic target population.</td>
                    <td><span style={{ color: 'var(--ink)' }}><strong>NEUTRAL.</strong> Median mRS 3 vs 3; adjusted common OR <strong>1.03 (95% CI 0.82&ndash;1.29)</strong>. Enrolment halted for <strong>futility</strong> at the second interim analysis. 90-day mortality 27.3% vs 27.2% (aHR 0.97; 0.79&ndash;1.18).</span></td>
                    <td>Bypass is not a default. In a region resembling RACECAT&#39;s geography the trial showed no average difference &mdash; absence of demonstrated benefit, not proven equivalence (no non-inferiority margin was tested).</td>
                  </tr>
                  <tr>
                    <td><strong>RACECAT ICH substudy</strong><br />Prespecified secondary<br />JAMA Neurol 2023; PMID 37603325</td>
                    <td>302 patients whose final diagnosis was ICH (137 bypassed to an EVT-capable centre vs 165 to the nearest centre); median RACE 7 (IQR 6&ndash;8).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>HARM from bypass.</strong> 90-day mRS shift adjusted common OR <strong>0.63 (95% CI 0.41&ndash;0.96)</strong> favouring the local centre. Mortality 48.9% vs 37.6% (aHR 1.40; 0.99&ndash;1.99). Complications during initial transport 22.6% vs 5.6% (aOR 5.29; 2.38&ndash;11.73); pneumonia 35.8% vs 17.6%.</span></td>
                    <td>The selected ICH substudy raises concern about bypass in that regional pathway. It does not prove benefit for every LVO patient or harm in every nonischemic presentation.</td>
                  </tr>
                  <tr>
                    <td><strong>TRIAGE-STROKE</strong><br />Multicentre RCT, assessor-blinded<br />Stroke 2023; PMID 37800374</td>
                    <td>171 enrolled (104 ischemic) in Denmark, IVT-eligible with suspected LVO &lt;4 h: nearest primary stroke centre (prioritise IVT) vs direct comprehensive centre (prioritise EVT). Halted before full recruitment.</td>
                    <td><span style={{ color: 'var(--ink)' }}><strong>NO significant difference</strong> &mdash; 90-day mRS shift OR <strong>1.42 (95% CI 0.72&ndash;2.82; p=0.31)</strong>; the trial was underpowered. Onset-to-groin was <strong>35 min shorter</strong> with direct CSC (p=0.007); onset-to-needle was <strong>30 min shorter</strong> with PSC-first (p=0.012).</span></td>
                    <td>Use the reported time differences as sensitivity scenarios, not fixed local routing-model inputs; measure the actual transport, IVT and transfer pathways in the region.</td>
                  </tr>
                  <tr>
                    <td><strong>RACECAT vascular-imaging post hoc</strong><br />J Neurointerv Surg 2024; PMID 37068936</td>
                    <td>467 patients allocated to a local stroke centre; CTA/MRA acquired at the local centre in 277 (59%), of whom 198 (71%) had an LVO.</td>
                    <td><span style={{ color: '#166534' }}>Vascular imaging at the local centre did <strong>not</strong> lengthen door-in-door-out (78 vs 76 min; p=0.6), reduced transfers as EVT candidates (58% vs 74%; p=0.004), raised the EVT rate among those transferred (69% vs 55%; p=0.016) and shortened door-to-puncture at the EVT centre (41 vs 54 min; p&lt;0.001).</span></td>
                    <td>CTA can help select appropriate transfers. RACECAT’s post-hoc comparison did not show longer door-in-door-out time, but it did not randomize imaging sequence; obtain appropriate imaging without avoidable treatment or transfer delay.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Ambulance interventions requiring a diagnosis (red) */}
            <CardSection color="red" title="3. Ambulance Interventions That Require a Diagnosis First &mdash; INTERACT4 and the Mobile Stroke Unit Answer">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>INTERACT4: Do Not Lower BP Before You Know the Diagnosis</strong>
                  <br />&bull; <strong>Design (NEJM 2024; PMID 38752650):</strong> 2404 patients in China with suspected stroke causing a motor deficit and SBP &ge;150 mmHg, randomised <em>in the ambulance</em> within 2 h of onset (median 61 min) to target SBP 130&ndash;140 vs usual care. Mean SBP on hospital arrival 159 vs 170 mmHg.
                  <br />&bull; <strong>Overall: NEUTRAL</strong> &mdash; common OR 1.00 (95% CI 0.87&ndash;1.15), serious adverse events similar.
                  <br />&bull; <strong>Opposite signs by subtype:</strong> hemorrhagic stroke <strong>benefited</strong> (cOR 0.75; 95% CI 0.60&ndash;0.92) while cerebral ischemia was <strong>harmed</strong> (cOR 1.30; 95% CI 1.06&ndash;1.60). 46.5% of the 2240 imaged patients had hemorrhagic stroke. <span style={{ color: 'var(--red-deep)' }}>The ambulance cannot tell the two apart, so undifferentiated BP lowering risks harming patients whose stroke proves ischemic &mdash; avoid routine subtype-agnostic stroke BP lowering before imaging; other hypertensive emergencies may require treatment.</span>
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>BEST-MSU: Bringing the Scanner to the Patient</strong>
                  <br />&bull; <strong>Design (NEJM 2021; PMID 34496173):</strong> prospective multicentre <em>alternating-week</em> controlled trial (not randomised) of MSU vs standard EMS within 4.5 h; 1515 enrolled, 1047 tPA-eligible (617 MSU, 430 EMS).
                  <br />&bull; <strong>Primary:</strong> utility-weighted mRS &ge;0.91 at 90 days &mdash; mean uw-mRS 0.72 vs 0.66, <strong>adjusted OR 2.43 (95% CI 1.75&ndash;3.36; p&lt;0.001)</strong>. mRS 0&ndash;1 in 55.0% vs 44.4%.
                  <br />&bull; <strong>Process:</strong> median onset-to-tPA <strong>72 vs 108 min</strong>; tPA delivered to <strong>97.1% vs 79.5%</strong> of eligible patients. 90-day mortality 8.9% vs 11.9%.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>B_PROUD &amp; the Conditions for an MSU Programme</strong>
                  <br />&bull; <strong>B_PROUD (JAMA 2021; PMID 33528537):</strong> Berlin, prospective <em>non-randomised</em> controlled study; MSU + conventional ambulance (n=749) vs conventional alone (n=794). Median 3-month mRS 1 (IQR 0&ndash;3) vs 2 (IQR 0&ndash;3), <strong>common OR for worse mRS 0.71 (95% CI 0.58&ndash;0.86; p&lt;0.001)</strong>; co-primary 3-tier disability cOR 0.73 (0.54&ndash;0.99; p=0.04).
                  <br />&bull; <strong>Viability (PMID 36484406):</strong> a Markov model built on B_PROUD and BEST-MSU estimated <strong>0.591 QALY gained per dispatch</strong> and cost-effectiveness up to a mean <strong>US$43,067 per patient</strong>, with long-term disability costs and the stroke-mimic rate as the dominant drivers. The model&#39;s own conclusion was cost-effectiveness in <em>urban</em> North American settings; it did not model dispatch volume or deadhead time.
                </div>
              </div>
            </CardSection>

            {/* §4 Prehospital LVO scales (amber) */}
            <CardSection color="amber" title="4. Prehospital LVO Scales &mdash; Cut-points, Test Characteristics, and the False-Positive Load They Impose">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--amber)' }}>
                    <th style={{ width: '112px' }}>Scale &amp; Cut-point</th>
                    <th style={{ width: '140px' }}>Items Scored</th>
                    <th style={{ width: '178px' }}>Validation Cohort &amp; Performance</th>
                    <th>Triage Consequence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>RACE &ge;5</strong><br />(0&ndash;9)<br />Stroke 2014; PMID 24281224</td>
                    <td>Facial palsy (0&ndash;2), arm motor (0&ndash;2), leg motor (0&ndash;2), gaze (0&ndash;1), aphasia or agnosia (0&ndash;2).</td>
                    <td>Prospective <strong>field</strong> validation by EMTs, n=357, LVO in 76 (21%); AUC 0.82. At &ge;5: <strong>sens 0.85, spec 0.68, PPV 0.42, NPV 0.94</strong>.</td>
                    <td>High sensitivity, low PPV &mdash; the routing rule used in RACECAT. Expect &gt;half of bypassed patients to have no LVO.</td>
                  </tr>
                  <tr>
                    <td><strong>LAMS &ge;4</strong><br />(0&ndash;5)<br />Stroke 2008; PMID 18556587</td>
                    <td>Facial droop (0&ndash;1), arm drift (0&ndash;2), grip strength (0&ndash;2). A brief motor-item scale; relative teaching speed is not established here.</td>
                    <td>n=119 anterior-circulation strokes assessed in the <strong>ED</strong> (not the field); persisting large-vessel occlusion in 62%; c-statistic 0.854. At &ge;4: <strong>sens 0.81, spec 0.89</strong>, accuracy 0.85, LR+ 7.36, LR&minus; 0.21.</td>
                    <td>Validated where LVO prevalence was 62%; the apparent PPV will not survive transfer to an unselected field population.</td>
                  </tr>
                  <tr>
                    <td><strong>C-STAT / CPSSS &ge;2</strong><br />(0&ndash;4)<br />Stroke 2015; PMID 25899242</td>
                    <td>Conjugate gaze (2 pts), arm weakness (1 pt), abnormal level of consciousness on commands and questions (1 pt).</td>
                    <td>Derived in the NINDS tPA trials, validated in IMS III. For <strong>NIHSS &ge;15</strong>: AUC 0.83, sens 92%, spec 51%. For <strong>LVO</strong> (222 of 303): AUC only <strong>0.67</strong>, sens 83%, spec 40%, LR+ 1.4.</td>
                    <td>Reads stroke <em>severity</em> better than it reads occlusion. A positive C-STAT barely shifts LVO odds.</td>
                  </tr>
                  <tr>
                    <td><strong>FAST-ED &ge;4</strong><br />(0&ndash;9)<br />Stroke 2016; PMID 27364531</td>
                    <td>Facial palsy, arm weakness, speech changes, eye deviation, denial/neglect &mdash; NIHSS items with the highest LVO yield.</td>
                    <td>STOPStroke cohort, n=727, LVO in 240 (33%); AUC 0.81 vs NIHSS 0.80 (p=0.28), RACE 0.77 (p=0.02), CPSS 0.75 (p=0.002). At &ge;4: <strong>sens 0.60, spec 0.89, PPV 0.72, NPV 0.82</strong>.</td>
                    <td>Specificity-weighted: fewer false positives at the EVT centre, but four in ten LVOs are missed at the cut-point.</td>
                  </tr>
                </tbody>
              </table></div>
              <div style={{ fontSize: '6.8pt', lineHeight: '1.32', color: 'var(--ink-soft)', marginTop: '4px', borderTop: '1px dashed var(--rule)', paddingTop: '3px' }}>
                <strong style={{ color: 'var(--amber-deep)' }}>External validity:</strong> sensitivity and specificity can change with patient spectrum, raters and setting; PPV also depends strongly on prevalence. Use local validation and the full diagnostic mix when modeling routing. RACECAT’s ICH substudy is a regional caution, not a universal prediction for every scale-positive patient.
              </div>
            </CardSection>

            {/* §5 Transfer, DIDO, telestroke, certification (purple) */}
            <CardSection color="purple" title="5. Interfacility Transfer, Door-In-Door-Out, Telestroke &amp; Certification Tiers">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Door-In-Door-Out Is One Key Transfer Metric</strong>
                  <br />&bull; <strong>Benchmark vs reality (JAMA 2023; PMID 37581671):</strong> guidelines call for DIDO <strong>&le;120 min</strong>; across 108,913 transfers from 1925 GWTG hospitals the median was <strong>174 min (IQR 116&ndash;276)</strong> and only <strong>27.3%</strong> met the target.
                  <br />&bull; <strong>Shortens DIDO:</strong> EMS prenotification &minus;20.1 min (95% CI &minus;22.1 to &minus;18.1); NIHSS &gt;12 vs 0&ndash;1 &minus;66.7 min; EVT-eligible ischemic vs hemorrhagic &minus;16.8 min.
                  <br />&bull; <strong>Lengthens DIDO &mdash; equity signal:</strong> age &ge;80 +14.9 min, female sex +5.2 min, non-Hispanic Black +8.2 min, Hispanic ethnicity +5.4 min vs non-Hispanic White. Audit your own DIDO by race, sex and age.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Where Drip-and-Ship Actually Loses Its Time</strong>
                  <br />&bull; <strong>Process autopsy (Ann Emerg Med 2021; PMID 34598828):</strong> 191 transfers from 3 Chicago primary stroke centres, median DIDO <strong>148.5 min (IQR 106&ndash;208)</strong>. Biggest blocks: CT-to-CTA 22 min, transfer-centre contact to ambulance request 20 min, ambulance request to arrival 20.5 min, ambulance on site 26 min.
                  <br />&bull; <strong>Fixable levers:</strong> giving alteplase &minus;29 min; the sending centre requesting the ambulance itself &minus;20 min. <strong>Costly:</strong> CTA performed at the primary stroke centre +39 min; walk-in arrival +53 min; intubation +23 min.
                  <br />&bull; Different observational cohorts reported different CTA/transfer delays. This does not prove that the entire difference was a workflow defect; improve imaging and transfer coordination using measured local data.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Telestroke, Certification Tiers &amp; What Is Still Investigational</strong>
                  <br />&bull; <strong>Telestroke as a routing instrument:</strong> use it to make the transfer decision, not merely to authorise lysis &mdash; image share, vessel status and destination should be settled on the same call. Availability alone does not fix flow: telestroke covered 84.2% of the Chicago cohort yet median DIDO was still 148.5 min.
                  <br />&bull; <strong>Destination capability:</strong> certification names alone do not establish current capacity or transfer speed. Verify the local system’s available thrombolysis, EVT, neurosurgical and neurocritical services and use its approved destination pathway; capabilities and requirements vary by jurisdiction and certifying body.
                  <br />&bull; <strong>Diagnostic limits:</strong> trial findings depend on the diagnostic information and resources available in the studied system. Do not assume an unvalidated field test can reliably distinguish hemorrhage from ischemia, or infer that every region has the same prehospital imaging capability. See the 2026 AHA/ASA acute ischemic stroke guideline (PMID 41582814) for current prehospital and systems-of-care recommendations.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'RACECAT', cite: 'Pérez de la Ossa N et al. JAMA. 2022;327(18):1782-1794.', pmid: '35510397' },
              { label: 'RACECAT ICH Substudy', cite: 'Ramos-Pachón A et al. JAMA Neurol. 2023;80(10):1028-1036.', pmid: '37603325' },
              { label: 'BEST-MSU', cite: 'Grotta JC et al. N Engl J Med. 2021;385(11):971-981.', pmid: '34496173' },
              { label: 'B_PROUD', cite: 'Ebinger M et al. JAMA. 2021;325(5):454-466.', pmid: '33528537' },
              { label: 'INTERACT4', cite: 'Li G et al. N Engl J Med. 2024;390(20):1862-1872.', pmid: '38752650' },
              { label: 'TRIAGE-STROKE', cite: 'Behrndtz A et al. Stroke. 2023;54(11):2714-2723.', pmid: '37800374' },
              { label: 'Door-In-Door-Out (GWTG)', cite: 'Stamm B et al. JAMA. 2023;330(7):636-649.', pmid: '37581671' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const SevereStrokeCriticalCareView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <SevereStrokeCriticalCareCard />
  </ScaledCardWrapper>
);

export function SevereStrokeCriticalCareCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Supportive care is individualized by stroke type, airway, swallowing, edema and clinical trajectory. Discuss decompression early when indicated rather than waiting for a fixed ICU day. Tracheostomy timing trials do not define an individual recovery ceiling. Treat hyperthermia and its cause; distinguish fever-burden reduction from improved functional outcome.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-severe-stroke-critical-care">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Neurocritical Care of Severe Stroke</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Fever &bull; Airway &amp; Tracheostomy &bull; Edema Pharmacotherapy &bull; Glucose &bull; Dysphagia &bull; VTE &bull; Mobilization &mdash; INTREPID, SETPOINT2, CHARM, SHINE, CLOTS 3, AVERT
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Fever & targeted normothermia (red) */}
            <CardSection color="red" title="1. Fever &amp; Targeted Normothermia &mdash; Treat the Cause, Not the Number">
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>INTREPID: Fever Burden Fell, Outcome Did Not</strong>
                  <br />&bull; <strong>Design (JAMA 2024;332:1525&ndash;1534; PMID: 39320879):</strong> 686 critically ill patients enrolled at 43 ICUs in 7 countries (677 analysed &mdash; 254 ischemic stroke, 223 ICH, 200 SAH). Automated surface device targeting <strong>37.0&deg;C for 14 days</strong> (n=339) vs tiered treatment triggered at &ge;38&deg;C (n=338).
                  <br />&bull; <strong>Primary (fever burden):</strong> 0.37 vs 0.73 &deg;C-hour/day; difference <strong>&minus;0.35 (95% CI &minus;0.51 to &minus;0.20; P&lt;.001)</strong> &mdash; the device worked.
                  <br />&bull; <strong>Functional outcome (negative):</strong> 3-month mRS shift <strong>OR 1.09 (95% CI 0.81&ndash;1.46; P=.54)</strong>; median mRS 4 in both arms. Enrollment stopped early for futility of this endpoint.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Reading the Trial Honestly</strong>
                  <br />&bull; Separation in fever burden was driven by the hemorrhagic strata &mdash; ICH &minus;0.50 (95% CI &minus;0.78 to &minus;0.22) and SAH &minus;0.52 (95% CI &minus;0.81 to &minus;0.23) &mdash; while <strong>ischemic stroke barely separated at &minus;0.10 (95% CI &minus;0.35 to 0.15)</strong>.
                  <br />&bull; Major adverse events were numerically higher with device normothermia (<strong>82.2% vs 75.9%</strong>), with similar infection rates (33.8% vs 34.5%).
                  <br />&bull; <strong>Interpretation:</strong> INTREPID compared fever-management strategies; it does not establish that established fever should be left untreated. Evaluate its cause and manage temperature in the clinical context.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What To Actually Do</strong>
                  <br />&bull; <strong>Temperature:</strong> identify and treat hyperthermia and its cause. AIS guidance addresses temperatures above 37.5°C; a trial comparator’s 38°C trigger is not a universal AIS/ICH/SAH threshold. Preventive device-based normothermia has not established functional benefit in every normothermic patient.
                  <br />&bull; <strong>Every fever gets a workup:</strong> aspiration pneumonia, CAUTI, line infection, DVT, drug fever, and &mdash; in SAH/IVH &mdash; chemical/central fever as a diagnosis of exclusion.
                  <br />&bull; Shivering can increase metabolic demand and interfere with cooling. Use an individualized monitored strategy; this reference does not prescribe a drug sequence.
                  <br />&bull; <strong>Prophylactic antibiotics do not help:</strong> PASS randomized 2550 patients (2538 analysed) to ceftriaxone 2 g &times;4 days vs stroke-unit care alone &mdash; 3-month mRS adjusted common OR 0.95 (95% CI 0.82&ndash;1.09; p=0.46) (PMID: 25612858).
                </div>
              </div>
            </CardSection>

            {/* §2 Airway & tracheostomy (purple) */}
            <CardSection color="purple" title="2. Airway, Ventilation &amp; the Tracheostomy Conversation (SETPOINT2)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>SETPOINT2: Early Trach Did Not Win</strong>
                  <br />&bull; <strong>Design (JAMA 2022;327:1899&ndash;1909; PMID: 35506515):</strong> 382 ventilated patients with severe ischemic or hemorrhagic stroke at 26 US and German neuro-ICUs; early tracheostomy <strong>&le;5 days of intubation</strong> (n=188) vs continued weaning with standard tracheostomy from day 10 (n=194).
                  <br />&bull; <strong>Delivered:</strong> 95.2% of the early arm were tracheostomized at a median of 4 days (IQR 3&ndash;4); only 67% of the control arm ever were, at a median of 11 days (IQR 10&ndash;12).
                  <br />&bull; <strong>Primary (6-month mRS 0&ndash;4 vs 5&ndash;6):</strong> 43.5% vs 47.1%; difference &minus;3.6% (95% CI &minus;14.3% to 7.2%); <strong>adjusted OR 0.93 (95% CI 0.60&ndash;1.42; P=.73)</strong>.
                  <br />&bull; The confidence interval is wide &mdash; this is a null result, <strong>not</strong> proof of equivalence, and it does not license routine early tracheostomy.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Timing &amp; Technique at the Bedside</strong>
                  <br />&bull; Assess respiratory readiness, airway protection, cough, secretions and neurological trajectory; GCS alone is insufficient. A cuff-leak test is suggested for otherwise extubation-ready adults at high risk of post-extubation stridor, not as a universal requirement (<a href="https://www.thoracic.org/statements/resources/cc/weaning-rehab-protocols-CLT.pdf" target="_blank" rel="noopener noreferrer">ATS/CHEST guideline</a>; conditional, very low certainty).
                  <br />&bull; Discuss goals, likely burdens and acceptable outcomes early and revisit them during failed weaning; no universal day 5–7 mandate is established. SETPOINT2 tested timing strategies, not when a family conversation should begin.
                  <br />&bull; A SETPOINT2 post-hoc matched comparison reported more infections and later decannulation with surgical versus dilational tracheostomy (PMID: 38291277). Technique was not randomized and selection reasons were not collected; these findings do not establish a universal default or equivalence in recovery.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Prognostic Guardrails</strong>
                  <br />&bull; Beware the <strong>self-fulfilling prophecy</strong>: early withdrawal of life-sustaining therapy can bias severe-stroke outcome estimates; do not treat an arbitrary time threshold as permission for a deterministic prognosis.
                  <br />&bull; <strong>Sedation:</strong> use individualized targets that account for neurological examination, ventilation, seizures and ICP. Light sedation may be achieved with protocolized titration or an appropriate interruption strategy; daily interruption is not mandatory for every patient.
                  <br />&bull; Re-visit goals of care at each inflection &mdash; edema peak, failed extubation, PEG decision.
                </div>
              </div>
            </CardSection>

            {/* §3 Edema pharmacotherapy & glucose (teal) */}
            <CardSection color="teal" title="3. Cerebral Edema Pharmacotherapy &amp; Glucose &mdash; What The Randomized Evidence Actually Shows">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '120px' }}>Trial / Evidence</th>
                    <th style={{ width: '165px' }}>Population &amp; Intervention</th>
                    <th style={{ width: '185px' }}>Result (effect estimate with 95% CI)</th>
                    <th>Bedside Takeaway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CHARM</strong><br />Lancet Neurol 2024;23:1205&ndash;1213<br />PMID: 39577921</td>
                    <td>Phase 3, double-blind, 143 centres / 21 countries. Ages 18&ndash;85 with ASPECTS 1&ndash;5 or core 80&ndash;300 mL; IV glibenclamide 8.6 mg over 72 h started &lt;10 h from onset. 535 randomized; mITT = 431 aged 18&ndash;70.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>NEGATIVE.</strong> 90-day mRS shift common OR <strong>1.17 (95% CI 0.80&ndash;1.71; p=0.42)</strong>. Mortality 32% (70/217) glibenclamide vs 29% (61/214) placebo; HR 1.20 (0.85&ndash;1.70; p=0.30). Hypoglycemia 6% vs 2%.</span> Stopped early by the sponsor for slow COVID-era enrollment, so it is also underpowered.</td>
                    <td>IV glibenclamide has not established functional benefit for malignant edema. Osmotherapy may temporize ICP or edema while urgent definitive treatment is assessed; it is not a substitute for indicated decompression.</td>
                  </tr>
                  <tr>
                    <td><strong>Sulfonylureas &mdash; Cochrane</strong><br />Cochrane Database Syst Rev 2025;3:CD014802<br />PMID: 40066941</td>
                    <td>2 RCTs (GAMES-RP n=86 and CHARM n=535), 621 participants total, both at overall high risk of bias.</td>
                    <td>mRS 0&ndash;4 at 90 days <strong>RR 1.08 (95% CI 0.89&ndash;1.32; P=0.43)</strong>; death <strong>RR 0.78 (0.36&ndash;1.69; P=0.53)</strong> &mdash; both low certainty. Hypoglycemia <strong>RR 4.66 (1.59&ndash;13.67; P=0.005)</strong>, moderate certainty.</td>
                    <td>The pooled evidence does not establish clinical benefit and identifies hypoglycemia risk. Retain the reported confidence intervals and certainty limits.</td>
                  </tr>
                  <tr>
                    <td><strong>SHINE</strong><br />JAMA 2019;322:326&ndash;335<br />PMID: 31334795</td>
                    <td>1151 hyperglycemic patients within 12 h of ischemic stroke at 63 US sites. IV insulin to 80&ndash;130 mg/dL (n=581) vs SC sliding scale to 80&ndash;179 mg/dL (n=570) for up to 72 h. Achieved means 118 vs 179 mg/dL.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>NEUTRAL, stopped for futility.</strong> Favorable 90-day outcome (baseline NIHSS 3–7: mRS 0; NIHSS 8–14: mRS 0–1; NIHSS 15–22: mRS 0–2) occurred in 20.5% vs 21.6%; adjusted <strong>RR 0.97 (95% CI 0.87&ndash;1.08; P=.55)</strong>.</span> Severe hypoglycemia occurred <strong>only</strong> in the intensive arm (15/581, 2.6%; risk difference 2.58%, 95% CI 1.29&ndash;3.87).</td>
                    <td>Use a moderate target (commonly <strong>140&ndash;180 mg/dL</strong>) with a hard hypoglycemia floor. Point-of-care glucose is mandatory before thrombolysis and with any unexplained deficit.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §4 Dysphagia, nutrition, pneumonia (amber) */}
            <CardSection color="amber" title="4. Dysphagia Screening, Nutrition Route &amp; Aspiration-Pneumonia Prevention">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Screen Before Anything By Mouth</strong>
                  <br />&bull; <strong>NPO &mdash; including oral medication and water &mdash; until a validated bedside swallow screen is passed.</strong> Dysphagia screening is an explicit target of the 2026 AHA/ASA acute ischemic stroke guideline (PMID: 41582814).
                  <br />&bull; Failed screen &rarr; formal SLP evaluation; instrumental study (FEES or videofluoroscopy) when the screen and the clinical picture disagree, or before advancing a high-risk diet.
                  <br />&bull; Bundle the mechanics: upright positioning for feeds, oral care protocols, and re-screening after extubation &mdash; a passed screen on day 1 does not carry to day 5.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>FOOD Trials: NG Early, PEG Late</strong>
                  <br />&bull; <strong>Early vs avoid (Lancet 2005;365:764&ndash;772; PMID: 15733717):</strong> 859 dysphagic patients. Early tube feeding gave an absolute reduction in death of <strong>5.8% (95% CI &minus;0.8 to 12.5; p=0.09)</strong> but only 1.2% (&minus;4.2 to 6.6; p=0.7) for death-or-poor-outcome &mdash; i.e. more survivors, many of them dependent.
                  <br />&bull; <strong>PEG vs NG (n=321):</strong> PEG was associated with an absolute <strong>increase</strong> in death or poor outcome of <strong>7.8% (95% CI 0.0 to 15.5; p=0.05)</strong>.
                  <br />&bull; <strong>Feeding:</strong> start appropriate enteral nutrition early. Consider PEG when inability to swallow safely is expected to persist beyond 2–3 weeks, accounting for trajectory and goals. Discuss options early rather than imposing a day-14 waiting rule.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Drugs Do Not Substitute For Nursing</strong>
                  <br />&bull; <strong>Prophylactic metoclopramide is not established:</strong> in a PRECIOUS <em>post hoc</em> analysis of 329 stroke patients with an NG tube, metoclopramide did not reduce first-week pneumonia (41.0% vs 35.8%; adjusted OR <strong>1.35, 95% CI 0.79&ndash;2.30</strong>) or improve 90-day mRS (aOR 1.07, 0.71&ndash;1.61) (PMID: 39129650).
                  <br />&bull; Prophylactic antibiotics are likewise ineffective (PASS, PMID: 25612858) &mdash; treat documented infection, do not pre-treat the risk.
                  <br />&bull; Use appropriate swallow screening, oral care, feeding position, individualized mobilization and indication-based line/catheter management. These components have different evidence and are not one validated all-purpose bundle.
                </div>
              </div>
            </CardSection>

            {/* §5 VTE, mobilization, systemic complications (slate) */}
            <CardSection color="slate" title="5. VTE Prophylaxis, Mobilization Dose &amp; The Systemic Complications That Drive Mortality">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>VTE: Sleeves Now, Heparin On A Schedule</strong>
                  <br />&bull; <strong>IPC for immobile patients without contraindications, with skin surveillance.</strong> CLOTS 3 (Lancet 2013;382:516&ndash;524; PMID: 23727163) randomized 2876 immobile stroke patients: proximal DVT within 30 days <strong>8.5% (122/1438) vs 12.1% (174/1438)</strong>, absolute risk reduction <strong>3.6% (95% CI 1.4&ndash;5.8)</strong>; adjusted OR 0.65 (0.51&ndash;0.84; p=0.001). Skin breaks were more common with IPC (3% vs 1%; p=0.002) &mdash; inspect legs daily.
                  <br />&bull; <strong>Graduated compression stockings alone are not a substitute</strong> and are not recommended for this indication.
                  <br />&bull; <strong>Pharmacologic start times (institutional convention, not trial-derived):</strong> ischemic stroke &mdash; prophylactic LMWH/UFH once bleeding risk is assessed, and after thrombolysis defer until the 24-hour follow-up CT is clean; ICH &mdash; hold until the hematoma is documented stable on repeat imaging, typically day 1&ndash;2 (AHA/ASA ICH guideline, PMID: 35579034); post-craniotomy or hemicraniectomy &mdash; per the operating surgeon, usually 24&ndash;48 h post-op. <strong>IPC covers the entire interval.</strong>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Mobilization: Early Yes, High-Dose No</strong>
                  <br />&bull; <strong>AVERT (Lancet 2015;386:46&ndash;55; PMID: 25892679)</strong> randomized 2104 patients at 56 stroke units to a frequent, higher-dose very early mobilization protocol vs usual care. Favourable 3-month outcome (mRS 0&ndash;2) was <strong>lower</strong> with the intensive protocol: 46% vs 50%, <strong>adjusted OR 0.73 (95% CI 0.59&ndash;0.90; p=0.004)</strong>. Deaths 8% vs 7% (OR 1.34, 0.93&ndash;1.93; p=0.113), and <strong>no</strong> reduction in immobility-related complications.
                  <br />&bull; Read it as a <em>dose</em> signal, not a prohibition: usual care already mobilized 59% within 24 h. Individualize mobilization to clinical stability and tolerance; avoid the studied high-dose, very-early strategy. The trial does not establish one schedule for every infarct or reperfusion state.
                  <br />&bull; Consider a multicomponent approach to cognition, sleep, mobility, hearing and vision. The PADIS recommendation is conditional with low-certainty evidence; each component is not independently proven to prevent delirium.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Systemic Complications &amp; The Unit Itself</strong>
                  <br />&bull; <strong>Infection:</strong> assess infection when clinically indicated and review urinary-catheter need daily. Remove it when no appropriate indication remains; acute retention can itself justify an indwelling catheter, and intermittent catheterization depends on the bladder-management plan.
                  <br />&bull; <strong>Cardiac:</strong> troponin elevation, repolarization abnormalities, arrhythmia and neurogenic stunned myocardium (Takotsubo-pattern) are common after severe stroke &mdash; especially insular infarcts and SAH. Obtain ECG and troponin; echocardiography if the pattern is unexplained. Do not reflexively anticoagulate a demand-ischemia troponin.
                  <br />&bull; <strong>Hyponatremia:</strong> assess serum and urine studies, medications, renal/endocrine causes and volume status. Bedside volume assessment alone cannot reliably distinguish SIAD from cerebral salt wasting. Fluid choice depends on the cause, symptoms and cerebral edema risk.
                  <br />&bull; <strong>Organized stroke-unit care:</strong> a review of 29 trials (5902 participants) found lower odds of poor outcome (OR 0.77, 95% CI 0.69–0.87) and death (OR 0.76, 0.66–0.88) at scheduled follow-up, typically around one year (PMID: 32324916). These data do not rank its effect against every other intervention.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'INTREPID Trial', cite: 'Greer DM et al. Fever Prevention in Patients With Acute Vascular Brain Injury. JAMA. 2024;332(18):1525-1534.', pmid: '39320879' },
              { label: 'SETPOINT2 Trial', cite: 'Bösel J et al. Effect of Early vs Standard Approach to Tracheostomy on Functional Outcome at 6 Months Among Patients With Severe Stroke Receiving Mechanical Ventilation. JAMA. 2022;327(19):1899-1909.', pmid: '35506515' },
              { label: 'CHARM Trial', cite: 'Sheth KN et al. Intravenous glibenclamide for cerebral oedema after large hemispheric stroke (CHARM). Lancet Neurol. 2024;23(12):1205-1213.', pmid: '39577921' },
              { label: 'SHINE Trial', cite: 'Johnston KC et al. Intensive vs Standard Treatment of Hyperglycemia and Functional Outcome in Patients With Acute Ischemic Stroke. JAMA. 2019;322(4):326-335.', pmid: '31334795' },
              { label: 'CLOTS 3 Trial', cite: 'Dennis M et al. Effectiveness of intermittent pneumatic compression in reduction of risk of deep vein thrombosis in patients who have had a stroke (CLOTS 3). Lancet. 2013;382(9891):516-524.', pmid: '23727163' },
              { label: 'AVERT Trial', cite: 'AVERT Trial Collaboration Group. Efficacy and safety of very early mobilisation within 24 h of stroke onset (AVERT). Lancet. 2015;386(9988):46-55.', pmid: '25892679' },
              { label: 'Stroke Unit Care', cite: 'Langhorne P, Ramachandra S. Organised inpatient (stroke unit) care for stroke: network meta-analysis. Cochrane Database Syst Rev. 2020;4:CD000197.', pmid: '32324916' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


export const PostStrokeRecoveryView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <PostStrokeRecoveryCard />
  </ScaledCardWrapper>
);

export function PostStrokeRecoveryCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Select rehabilitation setting and intensity from medical needs, ability to participate, expected benefit, available support and preferences. Begin adapted cognitive and communication assessment early enough to inform discharge safety, while repeating tests affected by delirium or other confounders. Treatment effects are specific to the studied program and population.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-post-stroke-recovery">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Post-Stroke Recovery, Cognition &amp; Mood</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Rehab Dose &amp; Setting (AVERT, CPASS, LEAPS, ICARE) &bull; FOCUS/AFFINITY/EFFECTS &bull; VNS-REHAB &bull; Aphasia &bull; PSCI &bull; Mood &amp; Fatigue
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Recovery biology, prognosis, and the critical window (teal) */}
            <CardSection color="teal" title="1. Recovery Biology, Prognosis &amp; the Critical Window &mdash; Setting Expectations at Discharge">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Proportional Recovery &amp; Its Limits</strong>
                  <br />&bull; <strong>What it says:</strong> proportional-recovery models describe patterns in selected cohorts. Their statistical interpretation and transportability are debated; a fixed fraction of recovery is not established for an individual.
                  <br />&bull; <strong>What it does not say:</strong> a cohort model is not a ceiling on rehabilitation or a prediction for one patient, particularly with severe initial impairment or absent motor evoked potentials.
                  <br />&bull; <strong>Bedside phrasing:</strong> &ldquo;Most of the impairment recovery happens in the first 3 months; function keeps improving for a year or more with practice.&rdquo; Do not promise a percentage.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>PREP2: A Biomarker Algorithm, Not a Guess</strong>
                  <br />&bull; <strong>Derivation (Ann Clin Transl Neurol 2017; PMID: 29159193):</strong> 207 patients recruited within 3 days; sequential SAFE score (shoulder abduction + finger extension) &rarr; age &rarr; presence of upper-limb MEP on TMS &rarr; NIHSS or MRI lesion load.
                  <br />&bull; <strong>Accuracy:</strong> correct upper-limb outcome category at 3 months in <strong>75%</strong> of patients; TMS needed in only about a third.
                  <br />&bull; <strong>Durability (PMID: 31268414):</strong> baseline predictions still correct at 2 years in 69/86 (80%); category stable 3 mo &rarr; 2 y in 71/86 (83%).
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Timing: A Window, Not a Race</strong>
                  <br />&bull; <strong>CPASS (PNAS 2021; PMID: 34544853):</strong> phase II, 20 extra hours of task-specific therapy. ARAT gain at 1 y vs controls &mdash; subacute (2&ndash;3 mo) <strong>+6.87 &plusmn; 2.63, p=0.009</strong>; acute (&le;30 d) +5.25 &plusmn; 2.59, p=0.043; chronic (&ge;6 mo) +2.41 &plusmn; 2.25, p=0.29 (not significant).
                  <br />&bull; <strong>AVERT (Lancet 2015; PMID: 25892679):</strong> 2,104 patients. High-dose out-of-bed mobilisation within 24 h <em>reduced</em> the odds of mRS 0&ndash;2 at 3 months (46% vs 50%; adjusted OR 0.73, 95% CI 0.59&ndash;0.90, p=0.004). Mobilise early but in short, frequent, low-dose sessions.
                </div>
              </div>
            </CardSection>

            {/* §2 Setting, dose, and modality (purple) */}
            <CardSection color="purple" title="2. Rehabilitation Setting, Dose &amp; Modality &mdash; What the Intensity Actually Buys">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '132px' }}>Decision / Trial</th>
                    <th style={{ width: '168px' }}>Design &amp; Population</th>
                    <th style={{ width: '172px' }}>Result (as reported)</th>
                    <th>Bedside Translation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Setting decision</strong><br /><em>IRF vs SNF vs home health vs outpatient</em></td>
                    <td>Driven by therapy tolerance, number of disciplines needed, medical complexity, home safety and caregiver availability &mdash; not by stroke severity alone.</td>
                    <td><strong>IRF:</strong> requires expected benefit and capacity for intensive interdisciplinary rehabilitation; CMS generally uses three hours/day on five days/week, or a documented 15-hour/seven-day alternative. <strong>SNF, home health and outpatient care:</strong> select from medical needs, participation, safety, support and coverage criteria; a fixed one-to-two-hour SNF rule is not universal.</td>
                    <td><span style={{ color: '#166534' }}>Reassess tolerance and participation as the clinical state changes; a failed early assessment does not establish a fixed recovery limit. Document the disciplines and support required.</span></td>
                  </tr>
                  <tr>
                    <td><strong>LEAPS</strong><br />(NEJM 2011; PMID: 21612471)<br /><em>Body-weight&ndash;supported treadmill training</em></td>
                    <td>408 patients 2 months post-stroke randomised to early locomotor training (2 mo), late locomotor training (6 mo), or a physical-therapist-managed <strong>home exercise program</strong>; 36 sessions of 90 min each.</td>
                    <td><strong>Neutral.</strong> 52.0% overall improved functional walking at 1 y. Early locomotor training vs home exercise adjusted OR 0.83 (95% CI 0.50&ndash;1.39); late vs home OR 1.19 (0.72&ndash;1.99). Among severely impaired patients, multiple falls were more common with early locomotor training (p=0.02).</td>
                    <td>The tested treadmill program was not superior to the trial’s structured therapist-supervised home program. This does not establish equivalence among every rehabilitation program or device; select treatment from functional goals and access.</td>
                  </tr>
                  <tr>
                    <td><strong>ICARE</strong><br />(JAMA 2016; PMID: 26864411)<br /><em>Structured task-oriented training</em></td>
                    <td>361 patients (mean 46 days post-stroke) with moderate upper-limb impairment: Accelerated Skill Acquisition Program vs dose-equivalent usual occupational therapy vs monitoring-only usual care.</td>
                    <td><strong>Neutral.</strong> No significant between-group difference in 12-month change in log Wolf Motor Function Test time (ASAP vs dose-equivalent OT 0.14, 95% CI &minus;0.05 to 0.33, p=0.16; ASAP vs usual care &minus;0.01, 95% CI &minus;0.22 to 0.21, p=0.94).</td>
                    <td><span style={{ color: '#8E1E1E' }}>Branded therapy protocols did not beat good usual care at these doses. Argue for <em>more repetitions and earlier access</em>, not for a proprietary program name.</span></td>
                  </tr>
                  <tr>
                    <td><strong>EXCITE</strong><br />(JAMA 2006; PMID: 17077374)<br /><em>Constraint-induced movement therapy</em></td>
                    <td>222 patients 3&ndash;9 months after first stroke with preserved wrist and finger extension: 2-week CIMT (mitt on the less-affected hand plus shaping) vs usual and customary care.</td>
                    <td><strong>Positive.</strong> Wolf Motor Function Test performance time fell 52% vs 26% (between-group difference 34%, 95% CI 12&ndash;51%, p&lt;0.001); Motor Activity Log amount-of-use difference 0.43 (95% CI 0.05&ndash;0.80, p&lt;0.001), sustained at 12 months.</td>
                    <td><span style={{ color: '#166534' }}>Requires <strong>some</strong> active wrist/finger extension &mdash; screen for it before referring. Not a therapy for a flaccid arm.</span></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Drugs and devices for recovery (red) */}
            <CardSection color="red" title="3. Drugs &amp; Devices for Recovery &mdash; Fluoxetine Does Not Work; Paired VNS Does">
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.25fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>FOCUS &mdash; The Definitive Negative Trial</strong>
                  <br />&bull; <strong>Design (Lancet 2019; PMID: 30528472):</strong> 3,127 patients randomised 2&ndash;15 days after stroke to fluoxetine 20 mg daily or placebo for 6 months at 103 UK hospitals.
                  <br />&bull; <strong>Primary outcome (mRS at 6 mo): NO benefit</strong> &mdash; common OR 0.951 (95% CI 0.839&ndash;1.079), p=0.439.
                  <br />&bull; <strong>Fewer new depression diagnoses:</strong> 13.43% vs 17.21% (difference 3.78%, 95% CI 1.26&ndash;6.30, p=0.0033).
                  <br />&bull; <strong>More bone fractures:</strong> 2.88% vs 1.47% (difference 1.41%, 95% CI 0.38&ndash;2.43, p=0.0070).
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>AFFINITY &amp; EFFECTS &mdash; Replicated, Twice</strong>
                  <br />&bull; <strong>AFFINITY (Lancet Neurol 2020; PMID: 32702334):</strong> 1,280 patients in Australia, New Zealand and Vietnam. mRS adjusted common OR 0.94 (95% CI 0.76&ndash;1.15), p=0.53. <strong>More falls</strong> (3% vs 1%, p=0.018), <strong>fractures</strong> (3% vs 1%, p=0.014) and <strong>seizures</strong> (2% vs &lt;1%, p=0.038).
                  <br />&bull; <strong>EFFECTS (Lancet Neurol 2020; PMID: 32702335):</strong> 1,500 patients in Sweden. mRS adjusted common OR 0.94 (95% CI 0.78&ndash;1.13), p=0.42. New depression 7% vs 11% (p=0.015) but more fractures (4% vs 2%, p=0.0058) and hyponatraemia (1% vs &lt;1%, p=0.0038).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>VNS-REHAB &mdash; Paired VNS in Selected Chronic Ischemic Stroke</strong>
                  <br />&bull; <strong>Design (Lancet 2021; PMID: 33894832):</strong> pivotal, triple-blind, sham-controlled; 108 patients (53 VNS / 55 sham) at least <strong>9 months</strong> after ischaemic stroke with moderate-to-severe arm weakness (baseline FMA-UE 20&ndash;50). All were implanted; 6 weeks of in-clinic therapy (18 sessions) then home exercise.
                  <br />&bull; <strong>Primary outcome:</strong> FMA-UE change +5.0 (SD 4.4) vs +2.4 (3.8); between-group difference <strong>2.6 (95% CI 1.0&ndash;4.2), p=0.0014</strong>.
                  <br />&bull; <strong>Response at 90 days:</strong> 47% vs 24%; difference 24% (6&ndash;41), p=0.0098, as reported in the main paper. The abstract’s intervention numerator and percentage are internally inconsistent; that numerator is not reproduced here. One surgery-related serious adverse event (vocal cord paresis, control group).
                </div>
              </div>
              <div style={{ marginTop: '6px', border: '1.5px dashed var(--red)', borderRadius: '5px', padding: '5px 7px', background: 'var(--red-soft)', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink)' }}>
                <strong style={{ color: 'var(--red-deep)' }}>Answer the two questions separately.</strong> &nbsp;<strong>&ldquo;Should I start an SSRI to promote recovery?&rdquo; &rarr; No.</strong> Three large trials (n=5,907 combined) all found no functional benefit and consistent harm signals (fractures in all three; falls and seizures in AFFINITY; hyponatraemia in EFFECTS). &nbsp;<strong>&ldquo;Should I treat diagnosed post-stroke depression?&rdquo; &rarr; Yes</strong> &mdash; that is a separate indication with its own risk&ndash;benefit calculus, and an SSRI remains a reasonable first-line agent for a patient who meets criteria. &nbsp;<strong>VNS candidacy:</strong> ischaemic stroke &ge;9 months out, FMA-UE 20&ndash;50, able to attend intensive paired therapy and accept an implant &mdash; <em>not</em> studied in haemorrhagic stroke, flaccid arms, or the acute/subacute phase.
              </div>
            </CardSection>

            {/* §4 Aphasia and post-stroke cognitive impairment (amber) */}
            <CardSection color="amber" title="4. Aphasia Therapy &amp; Post-Stroke Cognitive Impairment &mdash; Dose, Instruments &amp; the Driving Conversation">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Aphasia: Program, Intensity and Tolerability</strong>
                  <br />&bull; <strong>Breitenstein (Lancet 2017; PMID: 28256356):</strong> 156 analysed patients &le;70 y with chronic aphasia (&ge;6 months). Three weeks of intensive speech and language therapy at <strong>&ge;10 h/week</strong> improved everyday verbal communication (Amsterdam-Nijmegen A-scale +2.61, 95% CI 1.49&ndash;3.72) vs &minus;0.03 with deferral; Cohen&rsquo;s d 0.58, p=0.0004.
                  <br />&bull; <strong>Big CACTUS (Lancet Neurol 2019; PMID: 31397288):</strong> 278 patients, self-managed computerised word-finding therapy. Naming improved <strong>+16.2% (95% CI 12.7&ndash;19.6), p&lt;0.0001</strong> &mdash; but <strong>functional conversation did not</strong> (TOMs difference &minus;0.03, 95% CI &minus;0.21 to 0.14, p=0.709).
                  <br />&bull; <strong>Counselling:</strong> gains continue well beyond 6&ndash;12 months with dose; drilled words do not automatically transfer to conversation, so pair app-based practice with conversation partner training.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Post-Stroke Cognitive Impairment (PSCI)</strong>
                  <br />&bull; <strong>Scale (AHA/ASA statement, Stroke 2023; PMID: 37125534):</strong> PSCI is common, especially in the first year, and ranges from mild to severe; <strong>up to one-third of stroke survivors develop dementia within 5 years</strong>. Some early impairment is reversible.
                  <br />&bull; <strong>Cognition:</strong> delirium, aphasia, neglect and sedating drugs can affect testing. Use adapted early assessment to inform discharge safety and support needs; repeat formal testing under more reliable conditions rather than deferring all cognitive assessment until follow-up.
                  <br />&bull; <strong>Instrument choice:</strong> MoCA over MMSE for executive and visuospatial vascular profiles; use aphasia-adapted or non-verbal batteries when language is impaired, and always record the modality used so serial scores are comparable.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Driving &amp; Return to Work</strong>
                  <br />&bull; Address driving <em>before</em> discharge and document it. Hemianopia, neglect, impaired executive function, and seizure all bear on fitness independently of motor recovery.
                  <br />&bull; A normal MoCA does not clear a driver &mdash; refer for formal occupational-therapy driving evaluation or on-road testing where available, and know your jurisdiction&rsquo;s reporting rules.
                  <br />&bull; Return to work is a staged conversation: fatigue and cognitive load usually limit the return more than weakness does. Plan graded hours and written cognitive accommodations.
                </div>
              </div>
            </CardSection>

            {/* §5 Mood, fatigue, spasticity, and the 90-day structure (purple) */}
            <CardSection color="purple" title="5. Mood, Fatigue, Spasticity, Shoulder &amp; the 90-Day Follow-Up Structure">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Depression, Emotional Lability &amp; PBA</strong>
                  <br />&bull; <strong>Frequency (Int J Stroke 2014; PMID: 25117911):</strong> pooled 61 studies, 25,488 people &mdash; depression in <strong>31% (95% CI 28&ndash;35%)</strong>; 25% (16&ndash;33%) between 1 and 5 years and 23% (14&ndash;31%) at 5 years.
                  <br />&bull; <strong>Prevention (JAMA 2008; PMID: 18505948):</strong> in 176 non-depressed patients, escitalopram beat placebo (conservative intention-to-treat 23.1% vs 34.5%; adjusted HR 2.2, 95% CI 1.2&ndash;3.9, p=0.007), while problem-solving therapy did not (HR 1.1, 0.8&ndash;1.5, p=0.51). Weigh against the fracture and hyponatraemia signals from FOCUS/AFFINITY/EFFECTS &mdash; screen and treat rather than blanket-prophylax.
                  <br />&bull; <strong>PBA:</strong> stereotyped, mood-incongruent crying or laughing. Dextromethorphan&ndash;quinidine reduced PBA episode rate by about half in a 326-patient randomised trial (Ann Neurol 2010; PMID: 20839238), though that trial enrolled ALS and MS &mdash; not stroke. Check QT and CYP2D6 interactions.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Fatigue, Spasticity &amp; Shoulder</strong>
                  <br />&bull; <strong>Fatigue (Int J Stroke 2016; PMID: 27703065):</strong> pooled prevalence <strong>50% (95% CI 43&ndash;57%)</strong> across 22 studies (n=3,491) using the Fatigue Severity Scale; the wide between-study spread was not explained by depression status or time since stroke. Screen it separately from mood; treat sleep apnoea, anaemia, sedating drugs and deconditioning before calling it idiopathic.
                  <br />&bull; <strong>Spasticity:</strong> pooled analysis of 7 randomised trials (544 patients; Mov Disord 2011; PMID: 20960474) showed a saturating dose&ndash;response for onabotulinumtoxinA &mdash; roughly 22.5 U (flexor carpi radialis) and 18.4 U (flexor carpi ulnaris) for a mean 1-point Ashworth reduction. Pair injections with stretching and splinting; toxin without therapy wastes the window.
                  <br />&bull; <strong>Hemiplegic shoulder:</strong> prevent subluxation and contracture from day 1 &mdash; positioning, supported transfers, no pulling on the flaccid arm, no overhead pulleys.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Example Follow-Up Topics — Individualize Timing</strong>
                  <br />&bull; <strong>Guideline anchor (AHA/ASA, Stroke 2016; PMID: 27145936):</strong> organised, coordinated interdisciplinary rehabilitation with adequate resources, dose and duration is an essential component of stroke care, not a discretionary add-on. The 2016 guideline has since been replaced by the 2026 AHA/ASA Guideline for Adult Stroke Rehabilitation and Recovery (Stroke 2026; PMID: 42657476); check current recommendations there.
                  <br />&bull; <strong>Early follow-up:</strong> reconcile the medications actually indicated and prescribed, confirm access and tolerability, and assess mood and urgent concerns. The medication combination is mechanism- and patient-specific.
                  <br />&bull; <strong>Ongoing reassessment:</strong> review individualized BP/lipid goals, spasticity, shoulder pain, falls, continence and rehabilitation access according to clinical need.
                  <br />&bull; <strong>Recovery and workup:</strong> assess cognition, mood, fatigue, driving/work readiness and unresolved etiologic questions at an appropriate time. Do not defer urgent concerns to a scheduled three-month visit; rhythm monitoring depends on the indication.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'FOCUS Trial', cite: 'FOCUS Trial Collaboration. Lancet. 2019;393(10168):265-274.', pmid: '30528472' },
              { label: 'AFFINITY Trial', cite: 'AFFINITY Trial Collaboration. Lancet Neurol. 2020;19(8):651-660.', pmid: '32702334' },
              { label: 'EFFECTS Trial', cite: 'EFFECTS Trial Collaboration. Lancet Neurol. 2020;19(8):661-669.', pmid: '32702335' },
              { label: 'VNS-REHAB', cite: 'Dawson J et al. Lancet. 2021;397(10284):1545-1553.', pmid: '33894832' },
              { label: 'AVERT', cite: 'AVERT Trial Collaboration. Lancet. 2015;386(9988):46-55.', pmid: '25892679' },
              { label: 'CPASS', cite: 'Dromerick AW et al. Proc Natl Acad Sci U S A. 2021;118(39):e2026676118.', pmid: '34544853' },
              { label: 'PSCI Statement', cite: 'El Husseini N et al. Stroke. 2023;54(6):e272-e291.', pmid: '37125534' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


/* Bedside clinical pocket cards scoped styling */
export const BedsidePocketCardsStyles = () => (
  <style>{`
    .bedside-card-view {
      --ink:         #1a1b20;
      --ink-soft:    #3c3d47;
      --ink-mute:    #636472;
      --rule:        #e0dde4;
      --rule-soft:   #f0eef3;
      --fill:        #f3f1f6;
      --fill-soft:   #f8f7fa;
      --paper:       #ffffff;

      --purple:      #5B3B9C;
      --purple-deep: #3A2368;
      --purple-soft: #f1edfa;
      --purple-glow: rgba(91, 59, 156, 0.15);

      --teal:        #18849E;
      --teal-soft:   #e6f4f7;
      --teal-deep:   #0F586B;
      --teal-glow:   rgba(24, 132, 158, 0.15);

      --red:         #C62E2E;
      --red-soft:    #fcebeb;
      --red-deep:    #8E1E1E;
      --red-glow:    rgba(198, 46, 46, 0.15);

      --amber:       #D9860B;
      --amber-soft:  #fdf3e4;
      --amber-deep:  #945B06;
      --amber-glow:  rgba(217, 134, 11, 0.15);

      --slate:       #4A5A6D;
      --slate-deep:  #33404F;
      --slate-soft:  #f0f2f5;
    }

    .card-wrapper-scroll {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      justify-content: center;
      padding: 10px 0;
    }

    .bedside-card-view .card-container {
      width: 825px;
      height: 1275px;
      padding: 20px 25px 20px 25px !important;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow-y: auto;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--rule-soft);
      border-radius: 8px;
    }

    .bedside-card-view .card-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      position: relative;
      z-index: 10;
      color: var(--ink);
      font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .bedside-card-view h1 {
      font-family: "Outfit", sans-serif;
      font-size: 21pt;
      font-weight: 800;
      margin: 0 0 14px 0;
      line-height: 1.2;
      text-align: center;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
      padding-bottom: 8px;
    }
    .bedside-card-view h1::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, var(--teal), var(--purple));
      border-radius: 4px;
    }

    .bedside-card-view h3 {
      font-family: "Outfit", sans-serif;
      font-size: 12.2pt;
      font-weight: 600;
      margin: 8px 0 4px 0;
    }

    .bedside-card-view strong {
      font-weight: 600;
      color: var(--ink);
    }

    /* TOAST Subtype Grids */
    .toast-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
      text-align: left;
    }
    .toast-card {
      border: 1px solid var(--rule-soft);
      border-radius: 8px;
      padding: 12px 14px;
      background: var(--fill-soft);
    }
    .toast-card.primary {
      border-left: 4px solid var(--purple);
      background: linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%);
    }
    .toast-card.secondary {
      border-left: 4px solid var(--teal);
      background: linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%);
    }
    .toast-card.alert-orange {
      border-left: 4px solid var(--amber);
      background: linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%);
    }
    .toast-card.alert-red {
      border-left: 4px solid var(--red);
      background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
    }
    .toast-card.neutral {
      border-left: 4px solid var(--slate);
      background: linear-gradient(135deg, var(--slate-soft) 0%, #ffffff 100%);
    }
    .toast-card.primary h3 { color: var(--purple-deep); }
    .toast-card.secondary h3 { color: var(--teal-deep); }
    .toast-card.alert-orange h3 { color: var(--amber-deep); }
    .toast-card.alert-red h3 { color: var(--red-deep); }
    .toast-card.neutral h3 { color: var(--slate); }

    .toast-card-list {
      margin: 4px 0 0 0;
      padding-left: 14px;
      font-size: 9.2pt;
      line-height: 1.45;
      color: var(--ink-soft);
      list-style-type: disc;
    }
    .toast-card-list li {
      margin-bottom: 4px;
    }

    /* Diagnostic workup checklist */
    .checklist-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
      margin-top: 4px;
      color: var(--ink-soft);
      line-height: 1.45;
      font-size: 7.8pt;
      text-align: left;
    }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .checklist-dot {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1.5px solid var(--purple);
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--purple);
      font-size: 9px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .ref-citation {
      margin-top: 15px;
      padding: 10px 12px;
      background: linear-gradient(135deg, var(--fill-soft) 0%, #ffffff 100%);
      border-left: 4px solid var(--purple);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      font-size: 8.5pt;
      line-height: 1.35;
      color: var(--ink-mute);
      text-align: left;
    }
    .ref-citation a {
      color: var(--teal-deep);
      text-decoration: underline;
      font-weight: 600;
    }

    /* DAPT Regimens layout */
    .dapt-pearls-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 15px;
      margin-bottom: 25px;
      text-align: left;
    }
    .dapt-pearl-card {
      border-radius: 8px;
      padding: 8px 10px;
    }
    .dapt-pearl-card.purple {
      border: 1px solid var(--purple-soft);
      border-left: 4px solid var(--purple);
      background: linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%);
    }
    .dapt-pearl-card.red {
      border: 1px solid var(--red-soft);
      border-left: 4px solid var(--red);
      background: linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%);
    }

    table.card-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 10px 0 16px 0;
      font-size: 8.5pt;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--rule-soft);
      background: var(--paper);
      text-align: left;
    }
    table.card-table thead th {
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 8.0pt;
      text-align: left;
      padding: 8px 10px;
    }
    table.card-table tbody td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--rule-soft);
      vertical-align: top;
      line-height: 1.4;
    }
    table.card-table tbody tr:last-child td {
      border-bottom: none;
    }
    table.card-table tbody tr:nth-child(even) td {
      background: var(--fill-soft);
    }
    table.card-table tbody tr {
      transition: background 0.15s ease;
    }
    table.card-table tbody tr:hover {
      background: rgba(91, 59, 156, 0.04);
    }

    /* SVG Diagram Card Container */
    .svg-diagram-card {
      width: 100%;
      border-radius: 10px;
      border: 1.5px solid var(--rule-soft);
      background: linear-gradient(180deg, var(--fill-soft) 0%, #ffffff 100%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.03);
      padding: 8px;
      margin-bottom: 10px;
      box-sizing: border-box;
    }

    /* Badge Pills for Risk Levels & Scores */
    .badge-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 7.5pt;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.02em;
    }
    .badge-pill-cobalt { background: var(--teal-soft); color: var(--teal-deep); border: 1px solid rgba(24,132,158,0.3); }
    .badge-pill-crit   { background: var(--red-soft); color: var(--red-deep); border: 1px solid rgba(198,46,46,0.3); }
    .badge-pill-warn   { background: var(--amber-soft); color: var(--amber-deep); border: 1px solid rgba(217,134,11,0.3); }
    .badge-pill-ok     { background: #e8f5e9; color: #1b5e20; border: 1px solid rgba(46,125,50,0.3); }
    .badge-pill-purple { background: var(--purple-soft); color: var(--purple-deep); border: 1px solid rgba(91,59,156,0.3); }

    /* Outcome chart for Malignant MCA counseling */
    .outcome-chart-container {
      background: white;
      border: 1px solid var(--rule-soft);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      text-align: left;
    }
    .outcome-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .outcome-row:last-child {
      margin-bottom: 4px;
    }
    .outcome-label {
      width: 155px;
      font-size: 9.0pt;
      font-weight: 700;
      color: var(--ink-soft);
      line-height: 1.2;
    }
    .stacked-bar-container {
      flex: 1;
      height: 24px;
      display: flex;
      border-radius: 4px;
      overflow: hidden;
      background: #f1f2f6;
    }
    .bar-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: "IBM Plex Mono", monospace;
      font-size: 8.5pt;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .bar-mrs-03 { background: #2E7D32; }
    .bar-mrs-4  { background: #F57C00; }
    .bar-mrs-5  { background: #E64A19; }
    .bar-mrs-6  { background: #212121; }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px 20px;
      margin-top: 10px;
      font-size: 8.0pt;
      color: var(--ink-soft);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* Stepwise ICP Pathway styles */
    .step-pathway {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 2px;
      text-align: left;
    }
    .step-node {
      border: 1px solid var(--rule-soft);
      border-radius: 6px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .step-header {
      display: flex;
      align-items: center;
      padding: 4px 10px;
      color: white;
      font-family: "Outfit", sans-serif;
    }
    .step-header.step-0 { background: linear-gradient(90deg, var(--slate) 0%, #56697d 100%); }
    .step-header.step-1 { background: linear-gradient(90deg, var(--teal-deep) 0%, var(--teal) 100%); }
    .step-header.step-2 { background: linear-gradient(90deg, var(--amber-deep) 0%, var(--amber) 100%); }
    .step-header.step-3 { background: linear-gradient(90deg, var(--red-deep) 0%, var(--red) 100%); }

    .step-num {
      font-size: 7.5pt;
      font-weight: 800;
      background: rgba(255,255,255,0.25);
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 8px;
      letter-spacing: 0.05em;
    }
    .step-title {
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 0.03em;
    }

    .step-arrow {
      text-align: center;
      font-size: 7.2pt;
      font-weight: 700;
      color: var(--red-deep);
      padding: 1px 0;
      line-height: 1;
      font-family: "Outfit", sans-serif;
      letter-spacing: 0.02em;
    }

    /* Screen Layout (removes rotate for desktop/tablet display) */
    .bedside-card-view.screen-layout .landscape-card {
      width: 1275px;
      height: 825px;
      display: flex;
      justify-content: center;
    }
    .bedside-card-view.screen-layout .landscape-card .card-container {
      width: 100%;
      height: 100%;
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      border-radius: 8px;
      border: 1px solid var(--rule-soft);
      padding: 20px 25px !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }
  `}</style>
);


export function ToastClassificationCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_01_toast">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '4px'}}>TOAST Stroke Classification</h1>
    <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
      Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.
    </p>

    <div className="toast-grid">

      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
        <div className="toast-card primary">
          <h3>1. Large-Artery Atherosclerosis (LAA)</h3>
          <ul className="toast-card-list">
            <li><strong>Clinical:</strong> Cortical signs (aphasia, neglect, gaze deviation) or brainstem/cerebellar syndrome.</li>
            <li><strong>Imaging:</strong> Cortical or subcortical/cerebellar/brainstem infarct matching the vascular territory.</li>
            <li><strong>Vascular:</strong> <strong>&gt; 50% stenosis</strong> or occlusion of the relevant major extracranial (carotid, vertebral) or intracranial artery.</li>
            <li><strong>Exclusion:</strong> Must exclude a high-risk cardioembolic source.</li>
          </ul>
        </div>

        <div className="toast-card secondary">
          <h3>2. Small-Vessel Occlusion (SVO / Lacune)</h3>
          <ul className="toast-card-list">
            <li><strong>Clinical:</strong> Classic lacunar syndrome (pure motor, pure sensory, sensorimotor, ataxic hemiparesis, clumsy hand) <strong>WITHOUT</strong> cortical signs.</li>
            <li><strong>Imaging:</strong> Normal scan or subcortical/brainstem lesion <strong>&lt; 1.5 cm</strong> in diameter.</li>
            <li><strong>Vascular/Cardiac:</strong> Relevant artery must lack &gt;50% stenosis, and patient must lack high-risk cardioembolic sources.</li>
          </ul>
        </div>

        <div className="toast-card neutral">
          <h3>4. Other Determined Etiology (ODE)</h3>
          <ul className="toast-card-list">
            <li><strong>Clinical/Imaging:</strong> Infarction of any size with diagnostic proof of a rare/specific underlying mechanism:</li>
            <li>Arterial dissection (e.g. carotid or vertebral dissection)</li>
            <li>CNS vasculitis or systemic vasculopathy</li>
            <li>RCVS (Reversible Cerebral Vasoconstriction Syndrome)</li>
            <li>Moya-Moya disease, CADASIL, or Fibromuscular Dysplasia</li>
            <li>Prothrombotic/hypercoagulable state (APLS, cancer, DIC)</li>
          </ul>
        </div>
      </div>


      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
        <div className="toast-card alert-red" style={{paddingBottom: '6px'}}>
          <h3>3. Cardioembolism (CE)</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '8.2pt', lineHeight: '1.3', color: 'var(--ink-soft)', marginTop: '2px'}}>
            <div>
              <strong style={{color: 'var(--red-deep)', display: 'block', fontSize: '7.5pt', marginBottom: '2px'}}>HIGH-RISK SOURCES:</strong>
              • Mechanical prosthetic valve<br/>
              • Mitral stenosis w/ AFib<br/>
              • Atrial fibrillation<br/>
              • Left atrial / LAA thrombus<br/>
              • Sick sinus syndrome<br/>
              • Recent MI (&lt; 4 weeks)<br/>
              • LVEF &lt; 28% or LV thrombus<br/>
              • Infective endocarditis
            </div>
            <div>
              <strong style={{color: 'var(--amber-deep)', display: 'block', fontSize: '7.5pt', marginBottom: '2px'}}>MEDIUM-RISK SOURCES:</strong>
              • Mitral valve prolapse<br/>
              • Mitral ring calcification<br/>
              • Mitral stenosis w/o AFib<br/>
              • Left atrial turbulence/smoke<br/>
              • PFO w/ atrial septal aneurysm<br/>
              • Atrial flutter (isolated)<br/>
              • Bioprosthetic heart valve<br/>
              • Nonbacterial endocarditis
            </div>
          </div>
        </div>

        <div className="toast-card alert-orange">
          <h3>5. Undetermined Etiology (UDE)</h3>
          <ul className="toast-card-list">
            <li><strong>Two or more potential causes:</strong> e.g. 60% carotid stenosis AND atrial fibrillation (unable to assign single primary cause).</li>
            <li><strong>Incomplete evaluation:</strong> Imaging or cardiac workup pending/incomplete.</li>
            <li><strong>Cryptogenic:</strong> no cause identified after an appropriate evaluation. ESUS is a narrower nonlacunar-infarct category with defined vascular, cardiac and other-cause exclusions; the terms are not interchangeable.</li>
          </ul>
        </div>
      </div>
    </div>


    <div style={{marginTop: '12px', marginBottom: '12px'}}>
      <h3 style={{fontSize: '9.5pt', color: 'var(--purple-deep)', fontWeight: '700', marginBottom: '6px'}}>Etiologic Evaluation: Tailor to the Clinical Question</h3>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '8.5pt'}}>
        <div className="checklist-item">
          <div className="checklist-dot">✓</div>
          <div><strong>Parenchymal:</strong> MRI Brain (DWI/ADC) preferred, or CT Head.</div>
        </div>
        <div className="checklist-item">
          <div className="checklist-dot">✓</div>
          <div><strong>Vascular:</strong> CTA or MRA Head & Neck (or Carotid Duplex + TCD).</div>
        </div>
        <div className="checklist-item">
          <div className="checklist-dot">✓</div>
          <div><strong>Rhythm:</strong> EKG + Continuous Telemetry ≥ 24h (or loop recorder).</div>
        </div>
        <div className="checklist-item">
          <div className="checklist-dot">✓</div>
          <div><strong>Cardiac:</strong> select TTE, TEE and shunt testing according to the suspected mechanism and whether results would change management.</div>
        </div>
      </div>
    </div>


    <div style={{borderLeft: '4px solid var(--teal)', background: 'var(--teal-soft)', padding: '10px 14px', borderRadius: '6px', fontSize: '8.6pt', lineHeight: '1.45', color: 'var(--ink-soft)', marginBottom: '14px'}}>
      <strong style={{color: 'var(--teal-deep)', textTransform: 'uppercase', fontSize: '8.6pt', letterSpacing: '0.04em', display: 'block', marginBottom: '3px'}}>Why Subtype Matters — 2026 Secondary Prevention</strong>
      Prevention depends on the <strong>specific mechanism</strong>. AF-related stroke often warrants anticoagulation; infective endocarditis and prosthetic valves require distinct management and drug selection. Noncardioembolic stroke generally uses antiplatelet therapy, with short-course DAPT only in eligible settings. ESUS alone is not an indication for empiric DOAC therapy.
      <br /><br />
      <strong style={{color: 'var(--purple-deep)'}}>The factor XIa inhibitor class (new for 2026):</strong> these oral agents aim to uncouple antithrombotic efficacy from bleeding risk. Both phase-2 stroke trials were neutral — <strong>PACIFIC-Stroke</strong> (asundexian) and <strong>AXIOMATIC-SSP</strong> (milvexian, a covert-infarct-heavy composite). <strong>OCEANIC-STROKE</strong> (phase 3) was then the first positive trial of the class: adding oral <strong>asundexian</strong> to antiplatelet therapy in non-cardioembolic stroke/high-risk TIA cut recurrent ischemic stroke (HR 0.74) with no significant excess of major bleeding. The milvexian phase-3 <strong>LIBREXIA-STROKE</strong> is ongoing. Note the class does NOT replace guideline anticoagulation for AF (OCEANIC-AF stopped early for inferiority to apixaban).
    </div>

    <div className="ref-citation" style={{marginTop: '15px', padding: '10px 12px', fontSize: '8.8pt'}}>
      <strong>Original Study:</strong> Adams HP Jr, et al. TOAST. <em>Stroke</em>. 1993;24:35-41. <a href="https://pubmed.ncbi.nlm.nih.gov/7678184/" target="_blank">PMID: 7678184</a>.<br/>
      <strong>AHA/ASA Guideline:</strong> Kleindorfer DO, et al. 2021 Stroke Prevention. <em>Stroke</em>. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a>.<br/>
      <strong>Factor XIa class:</strong> OCEANIC-STROKE (Sharma M, et al. <em>N Engl J Med</em>. 2026;394:1467-1479. <a href="https://pubmed.ncbi.nlm.nih.gov/41985132/" target="_blank">PMID: 41985132</a>) &bull; PACIFIC-Stroke (Shoamanesh A, et al. <em>Lancet</em>. 2022;400:997-1007. <a href="https://pubmed.ncbi.nlm.nih.gov/36063821/" target="_blank">PMID: 36063821</a>) &bull; AXIOMATIC-SSP (Sharma M, et al. <em>Lancet Neurol</em>. 2024;23:46-59. <a href="https://pubmed.ncbi.nlm.nih.gov/38101902/" target="_blank">PMID: 38101902</a>).
    </div>
  </div>
</div>
</div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}


export function DaptRegimensCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_03_dapt_regimens landscape-card">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '8px'}}>DAPT for Non-Cardioembolic Ischemic Stroke</h1>

    <p className="education-evidence-limit">CHANCE assessed its primary outcome at 90 days; day 21 marked the end of combination aspirin–clopidogrel treatment. Trial regimens and individual eligibility are summarized below.</p>


    <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{fontSize: '9.0pt', margin: '0 0 10px 0', width: '100%', borderCollapse: 'collapse'}}>
      <thead>
        <tr style={{background: 'linear-gradient(135deg, var(--purple-deep) 0%, var(--purple) 100%)', color: 'white'}}>
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '22%'}}>Trial</th>
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '22%'}}>Target Population</th>
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '22%'}}>Loading Dose (Day 1)</th>
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '20%'}}>DAPT Duration</th>
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '14%'}}>Post-DAPT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', fontWeight: '700'}}>
            POINT Trial
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            NIHSS ≤3 or ABCD² ≥4. <strong>Within 12 hours</strong> of onset.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 600 mg</strong> +<br/>Aspirin 50–325 mg (162 mg/day × 5 days recommended)
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 50&ndash;325mg qD for <strong>90 days</strong> (as randomized)
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            After the randomized comparison: individualize ongoing single-antiplatelet therapy. A fixed aspirin 81 mg regimen is not established by this trial.
          </td>
        </tr>
        <tr>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', fontWeight: '700'}}>
            CHANCE / INSPIRES
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>CHANCE:</strong> NIHSS≤3, ABCD²≥4 within 24h.<br/>
            <strong>INSPIRES:</strong> selected mild stroke/high-risk TIA with presumed atherosclerotic origin within 72 hours; qualifying imaging included culprit ≥50% stenosis or multiple acute infarcts including unstable nonstenotic plaque. Clinical eligibility differed for ≤24 versus 24–72 hours; use the original criteria.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 300 mg</strong> +<br/>Aspirin 75–300 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 75-100mg for <strong>21 days</strong>
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            Clopidogrel 75mg (to Day 90)
          </td>
        </tr>
        <tr style={{background: 'var(--purple-soft)'}}>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', fontWeight: '700', color: 'var(--purple-deep)'}}>
            CHANCE-2 Trial
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            CYP2C19 LOF carrier (*2/*3) + Minor stroke/TIA. <strong>Within 24h</strong>.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 180 mg</strong> +<br/>Aspirin 75–300 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 90mg BID</strong> +<br/>Aspirin 75-100mg for <strong>21 days</strong>
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            Ticagrelor 90mg BID (to Day 90)
          </td>
        </tr>
        <tr>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', fontWeight: '700'}}>
            THALES Trial
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            NIHSS ≤5 ischemic stroke, or TIA with ABCD² ≥6 or ipsilateral ≥50% stenosis, within 24 hours; apply the trial’s other eligibility and bleeding exclusions.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 180 mg</strong> +<br/>Aspirin 300–325 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 90mg BID</strong> +<br/>Aspirin 75-100mg for <strong>30 days</strong>
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            After the randomized comparison: individualize ongoing single-antiplatelet therapy. A fixed aspirin 81 mg regimen is not established by this trial.
          </td>
        </tr>
        <tr style={{background: 'var(--teal-soft)'}}>
          <td style={{padding: '4px 6px', fontWeight: '700', color: 'var(--teal-deep)'}}>
            SAMMPRIS Trial
          </td>
          <td style={{padding: '4px 6px'}}>
            Severe symptomatic atherosclerotic stenosis (70-99%) of a major intracranial artery.
          </td>
          <td style={{padding: '4px 6px'}}>
            <strong>Aspirin 325 mg</strong> +<br/><strong>Clopidogrel 75 mg</strong> (no load)
          </td>
          <td style={{padding: '4px 6px'}}>
            <strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin for <strong>90 days</strong>
          </td>
          <td style={{padding: '4px 6px'}}>
            Aspirin
          </td>
        </tr>
      </tbody>
    </table></div>

    <div className="dapt-pearls-grid">

      <div className="dapt-pearl-card purple">
        <strong style={{color: 'var(--purple-deep)', fontSize: '8.5pt', display: 'block', marginBottom: '4px'}}>CYP2C19 Genotyping & Clopidogrel Resistance</strong>
        <p style={{fontSize: '7.8pt', color: 'var(--ink-soft)', margin: '0', lineHeight: '1.45'}}>
          • CYP2C19 LOF alleles reduce clopidogrel activation. When rapid genotype results are available, LOF status can guide ticagrelor-vs-clopidogrel selection; CHANCE-2 evidence applies to LOF carriers rather than mandating universal testing.
        </p>
      </div>


      <div className="dapt-pearl-card red">
        <strong style={{color: 'var(--red-deep)', fontSize: '8.5pt', display: 'block', marginBottom: '4px'}}>Safety</strong>
        <p style={{fontSize: '7.6pt', color: 'var(--ink-soft)', margin: '0', lineHeight: '1.45'}}>
          • <strong>Duration — 21 vs 90 days</strong>: Minor stroke (NIHSS &le;3) / high-risk TIA (ABCD&sup2; &ge;4) &rarr; <strong>21 days</strong> ASA + clopidogrel (POINT/CHANCE), then single antiplatelet — benefit is concentrated in the first 21 days while bleeding exposure continues after the early ischemic benefit declines. Severe symptomatic intracranial atherosclerotic stenosis (70–99%) &rarr; <strong>90 days</strong> ASA + clopidogrel (SAMMPRIS) plus intensive risk-factor control. THALES ASA + ticagrelor is a <strong>30-day</strong> regimen for NIHSS &le;5 / high-risk TIA. Short-course DAPT is endorsed by the 2021 secondary-prevention guideline and the 2026 AHA/ASA AIS guideline.
          <br/>• <strong>Post-Lytic / EVT Policy</strong>: After IV thrombolysis (tenecteplase or alteplase), avoid antithrombotics for the first 24h until follow-up imaging excludes hemorrhage. EVT alone is not a blanket DAPT contraindication; stenting/angioplasty plans and hemorrhage risk drive the decision.
        </p>
      </div>
    </div>


    <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
      <strong>POINT:</strong> Johnston SC et al. <em>N Engl J Med</em>. 2018;379:215-225. <a href="https://pubmed.ncbi.nlm.nih.gov/29766750/" target="_blank">PMID: 29766750</a> | <strong>CHANCE:</strong> Wang Y et al. <em>N Engl J Med</em>. 2013;369:11-19. <a href="https://pubmed.ncbi.nlm.nih.gov/23803136/" target="_blank">PMID: 23803136</a><br/>
      <strong>CHANCE-2:</strong> Wang Y et al. <em>N Engl J Med</em>. 2021;385:2520-2530. <a href="https://pubmed.ncbi.nlm.nih.gov/34708996/" target="_blank">PMID: 34708996</a> | <strong>INSPIRES:</strong> Gao Y et al. <em>N Engl J Med</em>. 2023;389:2413-2424. <a href="https://pubmed.ncbi.nlm.nih.gov/38157499/" target="_blank">PMID: 38157499</a><br/>
      <strong>THALES:</strong> Johnston SC et al. <em>N Engl J Med</em>. 2020;383:207-217. <a href="https://pubmed.ncbi.nlm.nih.gov/32668111/" target="_blank">PMID: 32668111</a> | <strong>SAMMPRIS:</strong> Chimowitz MI et al. <em>N Engl J Med</em>. 2011;365:993-1003. <a href="https://pubmed.ncbi.nlm.nih.gov/21899409/" target="_blank">PMID: 21899409</a>
    </div>
  </div>
</div>
</div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}


export function MalignantInfarctionCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_04_malignant_mca">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Malignant Infarction</h1>
    <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
      Decompressive hemicraniectomy selection criteria, evidence, and supportive ICU care.
    </p>


    <p className="education-key-points rounded-lg border border-line p-3">Monitor for deterioration and involve neurosurgery early. The evidence for decompression within 48 hours is a treatment window in selected patients, not a claim that edema always peaks at 24–48 hours. Dangerous swelling can occur early or later, often over days 3–5.</p>


    <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)', marginBottom: '12px', boxShadow: '0 4px 12px var(--red-glow)'}}>
      <strong style={{color: 'var(--red-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>1. Surgical Assessment and Prognostic Markers</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '8.0pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
        <div>
          <strong>Clinical Deficit Severity:</strong>
          <br/>• Assess clinical deterioration, consciousness, infarct extent, age, premorbid function and goals with neurosurgery. A fixed hemisphere-specific NIHSS cutoff does not define universal eligibility.
          <br/>• <strong>Timing:</strong> the strongest trial evidence concerns selected patients treated within 48 hours; evaluate early rather than waiting for a numeric gate.
        </div>
        <div>
          <strong>Imaging and predictive cohort markers (not standalone surgical eligibility):</strong>
          <br/>• Infarction of <strong>≥ 50%</strong> of the MCA territory (CT/MRI)
          <br/>• DWI core volume <strong>&gt; 82 mL</strong> within 6 hours predicts a malignant course (prognostic cohort threshold: specificity 0.98, sensitivity 0.52)
          <br/>• DWI core volume <strong>&gt; 145 mL</strong> within 14 hours
          <br/>• Midline shift or mass effect on repeat imaging
          <br/>• <strong>Operative planning:</strong> decompression technique and extent require a neurosurgical plan; no standalone bone-flap recipe is prescribed here.
        </div>
      </div>
    </div>


    <div className="outcome-chart-container">
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>2. Surgical Outcomes & Evidence (By Age Group)</strong>


      <div className="education-key-points rounded-lg border border-line p-3">
        <strong>Age 18–60 years: pooled DECIMAL/DESTINY/HAMLET, one-year outcomes</strong>
        <p>Survival was 78% with surgery versus 29% with medical care; mRS ≤3 was 43% versus 21%, and mRS ≤4 was 75% versus 24%. These are group outcomes from selected trial participants, not individual forecasts.</p>
        <p>The separate mRS 4 and 5 plot segments are unavailable because their apparent derivation from rounded aggregates was not independently verified against the original figure.</p>
      </div>

      <div className="outcome-row" style={{marginTop: '6px'}}>
        <div className="outcome-label">
          <strong>Age ≥ 61 Years</strong> (DESTINY II; 6-month outcomes)<br/>
          <span style={{fontSize: '6.5pt', fontWeight: 'normal', color: 'var(--ink-mute)'}}>Surgery (33% Mort) vs Med (70% Mort)</span>
        </div>
        <div className="stacked-bar-container">
          <div className="bar-segment bar-mrs-03" style={{width: '7%'}}>7%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '32%'}}>32%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '28%'}}>28%</div>
          <div className="bar-segment bar-mrs-6" style={{width: '33%'}}>33%</div>
        </div>
      </div>

      <div className="outcome-row">
        <div className="outcome-label" style={{opacity: '0.7', fontWeight: 'normal', fontSize: '7.2pt'}}>
          Age ≥ 61 Medical Control
        </div>
        <div className="stacked-bar-container" style={{opacity: '0.7'}}>
          <div className="bar-segment bar-mrs-03" style={{width: '3%'}}>3%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '15%'}}>15%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '13%'}}>13%</div>
          <div className="bar-segment bar-mrs-6" style={{width: '70%'}}>70%</div>
        </div>
      </div>


      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-dot bar-mrs-03"></div>
          <div>mRS 0–2: Functional independence; mRS 3: walks unassisted but needs some help</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-4"></div>
          <div>mRS 4: Moderately severe; unable to walk or attend bodily needs unassisted</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-5"></div>
          <div>mRS 5: Severe disability; bedridden / constant care</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-6"></div>
          <div>mRS 6: Death</div>
        </div>
      </div>

      <div style={{fontSize: '7pt', lineHeight: '1.25', marginTop: '4px', color: 'var(--ink-soft)', textAlign: 'center', borderTop: '1px dashed var(--rule)', paddingTop: '3px'}}>
        • <strong>Age 18–60:</strong> pooled one-year NNT approximately 2 for survival and 4 for mRS ≤3. <strong>Age ≥61:</strong> DESTINY II improved survival without mRS 5–6 at six months; the mRS ≤3 comparison was not statistically significant. Displayed percentages are rounded; these are different study populations and follow-up horizons.
      </div>
    </div>


    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '12px 14px', background: 'white', marginBottom: '20px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>3. Supportive ICU Care & Medical Management</strong>
      <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.8pt', lineHeight: '1.35', color: 'var(--ink)'}}>
        <tbody>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', width: '22%', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Positioning</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Elevate HOB 30 degrees; maintain straight head/neck alignment to maximize venous outflow.</td>
          </tr>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Fluids</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Maintain euvolemia with isotonic fluids. <strong>Avoid hypotonic fluids</strong> (e.g. D5W, 0.45% NS) that can worsen edema; balanced crystalloids such as LR should follow local neuro-ICU protocol.</td>
          </tr>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Osmotherapy</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Consider <strong>targeted PRN</strong> hyperosmolar agents (HTS 3% or Mannitol) for acute decline or severe mass effect. <em>Prophylactic osmotherapy is not recommended.</em></td>
          </tr>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Metabolic</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Assess and treat fever and ventilation abnormalities in clinical context. Avoid inappropriate hypocapnia; brief rescue hyperventilation for herniation is distinct from routine ventilation. Use a complete monitored treatment plan.</td>
          </tr>
          <tr>
            <td style={{fontWeight: '700', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Steroids</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}><strong style={{color: 'var(--red)'}}>Class III (Harmful)</strong>: Corticosteroids are NOT recommended for reducing cerebral edema in acute ischemic stroke.</td>
          </tr>
        </tbody>
      </table></div>
    </div>


    <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
      <strong>DECIMAL:</strong> Vahedi K et al. <em>Stroke</em>. 2007;38:2506-2517. <a href="https://pubmed.ncbi.nlm.nih.gov/17690311/" target="_blank">PMID: 17690311</a> | <strong>DESTINY:</strong> Jüttler E et al. <em>Stroke</em>. 2007;38:2518-2525. <a href="https://pubmed.ncbi.nlm.nih.gov/17690310/" target="_blank">PMID: 17690310</a><br/>
      <strong>HAMLET:</strong> Hofmeijer J et al. <em>Lancet Neurol</em>. 2009;8:326-333. <a href="https://pubmed.ncbi.nlm.nih.gov/19269254/" target="_blank">PMID: 19269254</a> | <strong>DESTINY II:</strong> Jüttler E et al. <em>N Engl J Med</em>. 2014;370:1091-1100. <a href="https://pubmed.ncbi.nlm.nih.gov/24645942/" target="_blank">PMID: 24645942</a><br/>
      <strong>AHA Guidelines:</strong> Wijdicks EF et al. <em>Stroke</em>. 2014;45:1222-1238. <a href="https://pubmed.ncbi.nlm.nih.gov/24481970/" target="_blank">PMID: 24481970</a>
    </div>
  </div>
</div>
</div>
    </div>
  );
}


export function AfibAnticoagTimingCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_05_afib_anticoag_timing landscape-card">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '12px'}}>AFib Anticoagulation Restart Timing After Acute Ischemic Stroke</h1>


    <div style={{borderLeft: '4px solid var(--teal)', background: 'var(--teal-soft)', padding: '6px 10px', borderRadius: '6px', fontSize: '7.8pt', marginBottom: '4px', lineHeight: '1.45', boxShadow: '0 2px 8px var(--teal-glow)'}}>
      <strong style={{color: 'var(--teal-deep)', textTransform: 'uppercase', fontSize: '7.2pt', letterSpacing: '0.05em', display: 'block', marginBottom: '1px'}}>Clinical Efficacy & Safety</strong>
      RCT and individual-patient meta-analysis data support early DOAC initiation in carefully selected AFib-related ischemic stroke patients, especially mild-to-moderate infarcts without high-risk hemorrhagic transformation. Early treatment has not shown excess symptomatic intracranial hemorrhage (sICH) versus delayed treatment and may reduce recurrent ischemic stroke; DOACs are preferred over warfarin for most nonvalvular AF patients when anticoagulation is indicated.
    </div>


    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '6px 8px', background: 'var(--fill-soft)', marginBottom: '4px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '9.0pt', display: 'block', marginBottom: '4px'}}>1. Stroke Severity Classification (ELAN Imaging Criteria)</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '8.8pt', lineHeight: '1.45'}}>
        <div style={{border: '1px solid rgba(24,132,158,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--teal-deep)', display: 'block'}}>Minor / Small Infarct</strong>
          • Ischemic infarct <strong>≤1.5 cm</strong> on brain imaging; ELAN did not enroll tissue-negative TIA. NIHSS can guide bedside risk but is not the ELAN definition.
        </div>
        <div style={{border: '1px solid rgba(217,134,11,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--amber-deep)', display: 'block'}}>Moderate Infarct</strong>
          • Cortical superficial-branch lesion, internal border-zone lesion, or deep-branch lesion <strong>&gt; 1.5 cm</strong>.
        </div>
        <div style={{border: '1px solid rgba(198,46,46,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--red-deep)', display: 'block'}}>Major / Large Infarct</strong>
          • Complete vascular territory, ≥2 moderate lesions, large multilobar infarct, or brainstem/cerebellar lesion <strong>&gt;1.5 cm</strong>; apply the protocol’s multiple-lesion rules.
        </div>
      </div>
    </div>


    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2"><strong>Key clinical boundaries</strong><p>There is no validated combined day-by-severity schedule or mandatory day-specific rescan rule in this card. ELAN compared early treatment within 48 hours for minor/moderate infarcts and on days 6–7 for major infarcts with later treatment on days 3–4, 6–7 and 12–14, respectively. OPTIMAS compared initiation within 4 days with days 7–14. CATALYST pooled early (≤4 days) versus later (≥5 days) strategies. Use each trial’s eligibility and hemorrhagic-transformation exclusions, the evolving clinical and imaging findings, and shared clinical judgment; severe hemorrhagic transformation is not assigned a start day here.</p></aside>


    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '12px 14px', background: 'white', marginBottom: '20px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '9.2pt', display: 'block', marginBottom: '4px'}}>2. Bedside DOAC Dosing & Adjustment Guide</strong>
      <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.6pt', lineHeight: '1.45', color: 'var(--ink)'}}>
        <thead>
          <tr style={{borderBottom: '1.5px solid var(--rule-soft)', background: 'var(--fill-soft)', color: 'var(--purple-deep)', fontWeight: '700'}}>
            <th style={{padding: '6px 8px', textAlign: 'left', width: '22%'}}>Drug</th>
            <th style={{padding: '6px 8px', textAlign: 'left', width: '28%'}}>Standard Dose</th>
            <th style={{padding: '6px 8px', textAlign: 'left', width: '50%'}}>Dose Reduction Criteria</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 6px', color: 'var(--purple-deep)'}}>Apixaban (Eliquis)</td>
            <td style={{padding: '6px 8px'}}>5 mg BID</td>
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>Reduce to 2.5 mg BID</strong> if ≥ 2 criteria are met:
              <br/>• Age ≥ 80 years | • Weight ≤ 60 kg | • Serum creatinine ≥ 1.5 mg/dL
            </td>
          </tr>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 6px', color: 'var(--purple-deep)'}}>Rivaroxaban (Xarelto)</td>
            <td style={{padding: '6px 8px'}}>20 mg daily with the evening meal if CrCl &gt;50 mL/min</td>
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>15 mg daily with the evening meal</strong> if CrCl is 15–50 mL/min.
              <br/><strong>CrCl &lt;15 or dialysis:</strong> specialist assessment; no automatic dose or hold rule here. NVAF dialysis labeling relies on pharmacokinetics; equivalent stroke prevention and bleeding outcomes are unknown.
            </td>
          </tr>
          <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
            <td style={{fontWeight: '700', padding: '4px 6px', color: 'var(--purple-deep)'}}>Dabigatran (Pradaxa)</td>
            <td style={{padding: '6px 8px'}}>150 mg BID</td>
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>Reduce to 75 mg BID</strong> if CrCl is 15–30 mL/min.
              <br/><span style={{color: 'var(--red)'}}>Avoid if CrCl &lt; 15 mL/min</span>.
            </td>
          </tr>
          <tr>
            <td style={{fontWeight: '700', padding: '4px 6px', color: 'var(--purple-deep)'}}>Edoxaban (Savaysa)</td>
            <td style={{padding: '6px 8px'}}>60 mg daily</td>
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>Reduce to 30 mg daily</strong> if CrCl is 15–50 mL/min (US NVAF label).
              <br/><span style={{color: 'var(--red)'}}>Avoid if CrCl &gt;95 or &lt;15 mL/min</span>. Weight ≤60 kg alone is a US VTE, not NVAF, dose-reduction criterion.
            </td>
          </tr>
        </tbody>
      </table></div>
    </div>


    <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.45'}}>
      <strong>ELAN Trial:</strong> Fischer U et al. <em>N Engl J Med</em>. 2023;388:2411-2421. <a href="https://pubmed.ncbi.nlm.nih.gov/37222476/" target="_blank">PMID: 37222476</a><br/>
      <strong>CATALYST Meta-Analysis:</strong> Dehbi HM et al. <a href="https://pubmed.ncbi.nlm.nih.gov/40570866/" target="_blank"><em>Lancet</em> 2025; PMID: 40570866</a>. Pooled data (n=5,441) from <a href="https://pubmed.ncbi.nlm.nih.gov/37222476/" target="_blank">ELAN (PMID: 37222476)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/39491870/" target="_blank">OPTIMAS (<em>Lancet</em> 2024; PMID: 39491870)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/36065821/" target="_blank">TIMING (<em>Circulation</em> 2022; PMID: 36065821)</a>, and <a href="https://pubmed.ncbi.nlm.nih.gov/40163159/" target="_blank">START (<em>JAMA Neurol</em> 2025; PMID: 40163159)</a>. Early DOAC (≤4 days) vs later (≥5 days) initiation showed no excess sICH (0.4% vs 0.4%) and fewer recurrent ischemic events in pooled data.<br/>
      <strong>US dosing labels:</strong> <a href="https://www.janssenlabels.com/package-insert/product-monograph/prescribing-information/XARELTO-pi.pdf" target="_blank" rel="noopener noreferrer">Xarelto §§2.1, 8.6 (NVAF)</a>; <a href="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=e77d3400-56ad-11e3-949a-0800200c9a66" target="_blank" rel="noopener noreferrer">Savaysa §2.1 (NVAF)</a>; check each current label for interactions and renal dosing.<br/>
      <strong>AFib Guidelines:</strong> Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. <em>Circulation</em>. 2024;149:e1-e156. <a href="https://pubmed.ncbi.nlm.nih.gov/38033089/" target="_blank">PMID: 38033089</a>
    </div>
  </div>
</div>
</div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

export const ImageLightbox = InteractiveImageLightbox;





// =====================================================================
// EVD QUICK REFERENCE CARD (STATIC / PRINT-PREPARED)
// =====================================================================
export const EVDInfographic = () => (
  <section className="education-reference-card space-y-4 rounded-xl border border-line bg-card p-5 text-ink-2" aria-label="External ventricular drain reference">
    <h2 className="font-serif text-xl font-bold text-ink">External ventricular drain: concepts and safety</h2>
    <p>An EVD can divert cerebrospinal fluid and, in an appropriate measurement configuration, monitor intracranial pressure. In ICH or IVH, ventricular drainage reduces mortality when hydrocephalus contributes to decreased consciousness.</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>The prescribed drainage height is a hydrostatic threshold referenced to an anatomical level; it is not the same as the patient’s measured ICP. Drainage height is commonly expressed in cm H₂O, while ICP is commonly reported in mmHg.</li>
      <li>Repositioning can change the reference relationship. Incorrect leveling, obstruction or disconnection can cause harmful underdrainage or overdrainage. Follow the specific device, neurosurgical order and trained-team procedure.</li>
      <li>Neurological deterioration, a new drainage pattern, loss of expected waveform or suspected infection warrants prompt bedside assessment. A generic flow model cannot distinguish these causes.</li>
      <li>Weaning strategy and timing depend on the underlying disorder and clinical course. A fixed daily height increment or GCS cutoff is not a universal rule.</li>
    </ul>
    <p className="education-evidence-limit rounded-lg border border-line p-3">Device-specific stopcock positions, clamp/flush instructions, drainage-volume rules and the unvalidated flow simulation are unavailable. Use an approved procedural checklist with the treating team; this reference does not authorize drain manipulation.</p>
    <div className="education-source-list text-sm"><strong>Primary references: </strong><a href="https://pubmed.ncbi.nlm.nih.gov/26738503/" target="_blank" rel="noopener noreferrer">NCS EVD consensus (Fried et al.)</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/35579034/" target="_blank" rel="noopener noreferrer">AHA/ASA 2022 ICH guideline</a></div>
  </section>
);

export const ICPInfographic = () => (
  <section className="education-reference-card space-y-4 rounded-xl border border-line bg-card p-5 text-ink-2" aria-label="Intracranial pressure and herniation reference">
    <h2 className="font-serif text-xl font-bold text-ink">Intracranial pressure, edema and herniation</h2>
    <p>Rapid neurological decline or signs concerning for herniation require immediate assessment, neurocritical care and neurosurgical involvement. Resuscitation, diagnostic imaging and indicated temporizing treatment proceed in parallel; do not wait for a complete classic triad.</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>Interpret pupil changes, motor responses and consciousness together with prior findings, medications, systemic physiology and imaging. One pupil measurement or waveform feature does not establish herniation or its location.</li>
      <li>Where ICP is measured, cerebral perfusion pressure is approximated by MAP minus ICP, using compatible units and reference levels. The appropriate target depends on the disease and patient; traumatic-brain-injury thresholds are not automatically stroke targets.</li>
      <li>Hyperosmolar therapy may reduce ICP or cerebral edema in selected situations, but evidence for improved neurological outcome is limited. Choice, concentration, access, dose, repeat treatment and laboratory monitoring require a complete clinical order.</li>
      <li>Brief hyperventilation can be a bridge for acute herniation while definitive treatment is organized. Prophylactic or prolonged hypocapnia can compromise cerebral blood flow.</li>
      <li>Early evaluation for decompression matters in malignant hemispheric infarction and deteriorating cerebellar stroke. Cerebellar ICH has separate urgent evacuation indications. Ventricular drainage is considered when hydrocephalus contributes to impaired consciousness.</li>
      <li>Corticosteroids are not a treatment for cytotoxic edema from ischemic stroke or spontaneous ICH.</li>
    </ul>
    <p className="education-evidence-limit rounded-lg border border-line p-3">The unvalidated ICP simulator and abbreviated osmotherapy, sedation and procedural recipes are unavailable. This is a concept reference, not a stand-alone emergency algorithm.</p>
    <div className="education-source-list text-sm"><strong>Primary references: </strong><a href="https://pubmed.ncbi.nlm.nih.gov/32227294/" target="_blank" rel="noopener noreferrer">NCS cerebral edema guideline</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/24481970/" target="_blank" rel="noopener noreferrer">AHA swelling statement</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/35579034/" target="_blank" rel="noopener noreferrer">AHA/ASA ICH guideline</a></div>
  </section>
);

export function StkCoreMeasuresCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Stroke Core Measures Reference</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            Joint Commission / GWTG Quality Measures &amp; Comprehensive Stroke Center (CSC) Metrics.
          </p>

          <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table">
            <thead>
              <tr style={{background: 'var(--purple)'}}>
                <th style={{width: '90px'}}>Measure</th>
                <th>Core Quality Metric Description</th>
                <th style={{width: '180px'}}>Clinical Target &amp; Timing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>STK-1</strong></td>
                <td>Venous Thromboembolism (VTE) Prophylaxis</td>
                <td>VTE prophylaxis by day of or day after admission, or a documented reason not given.</td>
              </tr>
              <tr>
                <td><strong>STK-2</strong></td>
                <td>Discharged on Antithrombotic Therapy</td>
                <td>Appropriate antithrombotic therapy at discharge for the eligible ischemic-stroke denominator, accounting for documented exclusions; aspirin, clopidogrel, warfarin and DOACs are examples, not an exhaustive or interchangeable list.</td>
              </tr>
              <tr>
                <td><strong>STK-3</strong></td>
                <td>Anticoagulation for Atrial Fibrillation</td>
                <td>DOAC or warfarin prescribed at discharge for patients with AFib/A-flutter.</td>
              </tr>
              <tr>
                <td><strong>STK-4</strong></td>
                <td>Thrombolytic Therapy (IVT)</td>
                <td>Eligible AIS arriving within two hours of last known well and treated at this hospital within three hours, applying the current measure exclusions and data definitions. The thrombolytic inclusion list includes <strong>alteplase and tenecteplase</strong>; a legacy measure title does not make TNK a numerator failure.</td>
              </tr>
              <tr>
                <td><strong>STK-5</strong></td>
                <td>Antithrombotic by Hospital Day 2</td>
                <td>Antithrombotic therapy started or continued by hospital day 2.</td>
              </tr>
              <tr>
                <td><strong>STK-6</strong></td>
                <td>Discharged on Statin Therapy</td>
                <td>Statin medication prescribed at discharge for eligible ischemic stroke patients.</td>
              </tr>
              <tr>
                <td><strong>STK-8</strong></td>
                <td>Stroke Education Provided</td>
                <td>Document education for the patient or caregiver on five domains: warning signs, activation of emergency services, risk factors, discharge medications and follow-up after discharge.</td>
              </tr>
              <tr>
                <td><strong>STK-10</strong></td>
                <td>Assessed for Rehabilitation</td>
                <td>Apply the full rehabilitation-assessment definition: qualified assessment, services, referral/transfer or a valid documented reason can qualify; it is not restricted to PT/OT/PM&amp;R.</td>
              </tr>
              <tr>
                <td><strong>CSTK-01</strong></td>
                <td>NIHSS Score Performed</td>
                <td>Document NIHSS before recanalization intervention; for patients without recanalization, apply the measure’s within-12-hour requirement and exclusions.</td>
              </tr>
              <tr>
                <td><strong>CSTK-03</strong></td>
                <td>Severity Measurement Performed &mdash; SAH and ICH Patients</td>
                <td>CSTK-03a uses Hunt and Hess for aSAH; CSTK-03b uses ICH Score for ICH. Document before intervention, or within six hours when no intervention occurs, according to the applicable specification.</td>
              </tr>
            </tbody>
          </table></div>

          <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
            <strong>Quality reference:</strong> use the Joint Commission manual for the discharge period: 2026A covered January–June; 2026B covers July–December 2026. These teaching summaries do not replace numerator, denominator, timing and exclusion specifications.
          </div>
        </div>
      </div>
    </div>
  );
}

const StrokePrognosisView = () => {
  const [mobileView, setMobileView] = useState('calculator'); // 'calculator' or 'pocket-card'

  return (
    <PdfActionBar
      title="Stroke Prognosis & Clinical Scores"
      subtitle="Stroke Prognosis Reference Guide"
      pdfPath="documents/references/Stroke Prognosis.pdf"
      pdfName="Stroke Prognosis.pdf"
      iconColorClass="text-ok-600 dark:text-ok-400"
    >
      {/* Mobile Selector Tab */}
      <div className="flex justify-center mb-4 lg:hidden no-print">
        <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setMobileView('calculator')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              mobileView === 'calculator'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Bedside Calculator
          </button>
          <button
            onClick={() => setMobileView('pocket-card')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              mobileView === 'pocket-card'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Pocket Card Reference
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calculator Column */}
        <div className={`col-span-1 lg:col-span-7 no-print ${mobileView === 'calculator' ? 'block' : 'hidden lg:block'}`}>
          <StrokePrognosisCalculator />
        </div>

        {/* Pocket Card Column */}
        <div className={`col-span-1 lg:col-span-5 ${mobileView === 'pocket-card' ? 'block' : 'hidden lg:block'}`}>
          <ScaledCardWrapper isLandscape={false}>
            <BedsidePocketCardsStyles />
            <StrokePrognosisCard />
          </ScaledCardWrapper>
        </div>
      </div>
    </PdfActionBar>
  );
};

function BinaryToggle({ label, desc, value, onChange, colorClass = "bg-purple" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-b-0">
      <div className="space-y-0.5 max-w-[70%]">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
        {desc && <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          value ? colorClass : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function calculateAstralScore({ age, nihss, timeDelay, visualDefect, glucose, glucoseUnit, locImpaired }) {
  if (glucose === '' || glucose === null || glucose === undefined || !Number.isFinite(Number(glucose)) || Number(glucose) <= 0) return null;
  const agePoints = Math.floor(age / 5);
  const nihssPoints = Number(nihss) || 0;
  const timePoints = timeDelay ? 2 : 0;
  const visualPoints = visualDefect ? 2 : 0;
  const glucoseVal = Number(glucose) || 0;
  const glucoseMmol = glucoseUnit === 'mgdl' ? (glucoseVal / 18.0) : glucoseVal;
  const glucosePoints = (glucoseMmol < 3.7 || glucoseMmol > 7.3) ? 1 : 0;
  const locPoints = locImpaired ? 3 : 0;
  return agePoints + nihssPoints + timePoints + visualPoints + glucosePoints + locPoints;
}

export function getAstralRisk() {
  return null;
}

export function calculatePlanScore({ dependence, cancer, chf, afib, locReduced, age, legWeakness, armWeakness, aphasiaNeglect }) {
  const preDepPoints = dependence ? 1.5 : 0;
  const cancerPoints = cancer ? 1.5 : 0;
  const chfPoints = chf ? 1.0 : 0;
  const afibPoints = afib ? 1.0 : 0;
  const locPoints = locReduced ? 5.0 : 0;
  const agePoints = Math.min(10, Math.floor(age / 10));
  const legPoints = legWeakness ? 2.0 : 0;
  const armPoints = armWeakness ? 2.0 : 0;
  const aphasiaPoints = aphasiaNeglect ? 1.0 : 0;
  return preDepPoints + cancerPoints + chfPoints + afibPoints + locPoints + agePoints + legPoints + armPoints + aphasiaPoints;
}

export function getPlanRisk() {
  return { mortality: null, depMortality: null, available: false };
}

export function calculateIchScore({ gcsCategory, age80, volume30, ivh, infratentorial }) {
  const gcsPoints = Number(gcsCategory) || 0;
  const agePoints = age80 ? 1 : 0;
  const volumePoints = volume30 ? 1 : 0;
  const ivhPoints = ivh ? 1 : 0;
  const infraPoints = infratentorial ? 1 : 0;
  return gcsPoints + agePoints + volumePoints + ivhPoints + infraPoints;
}

export function getIchRisk(score) {
  switch (score) {
    case 0: return "0%";
    case 1: return "13%";
    case 2: return "26%";
    case 3: return "72%";
    case 4: return "97%";
    case 5: return "100%";
    default: return "Not estimated";
  }
}


function AstralCalculatorTab() {
  const [astralAge, setAstralAge] = useState(65);
  const [astralNihss, setAstralNihss] = useState(10);
  const [astralTimeDelay, setAstralTimeDelay] = useState(false);
  const [astralVisualDefect, setAstralVisualDefect] = useState(false);
  const [astralGlucose, setAstralGlucose] = useState(6.0);
  const [astralGlucoseUnit, setAstralGlucoseUnit] = useState('mmol');
  const [astralLocImpaired, setAstralLocImpaired] = useState(false);

  const astralAgePoints = Math.floor(astralAge / 5);
  const astralNihssPoints = Number(astralNihss) || 0;
  const glucoseValid = astralGlucose !== '' && Number.isFinite(Number(astralGlucose)) && Number(astralGlucose) > 0;
  const glucoseVal = Number(astralGlucose);
  const glucoseMmol = astralGlucoseUnit === 'mgdl' ? (glucoseVal / 18.0) : glucoseVal;
  const astralGlucosePoints = glucoseValid ? ((glucoseMmol < 3.7 || glucoseMmol > 7.3) ? 1 : 0) : null;

  const astralTotal = calculateAstralScore({
    age: astralAge,
    nihss: astralNihss,
    timeDelay: astralTimeDelay,
    visualDefect: astralVisualDefect,
    glucose: astralGlucose,
    glucoseUnit: astralGlucoseUnit,
    locImpaired: astralLocImpaired
  });

  const resetAstral = () => {
    setAstralAge(65);
    setAstralNihss(10);
    setAstralTimeDelay(false);
    setAstralVisualDefect(false);
    setAstralGlucose(6.0);
    setAstralGlucoseUnit('mmol');
    setAstralLocImpaired(false);
  };

  return (
<div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-cobalt-700 dark:text-cobalt-400">ASTRAL Variables</h4>

            {/* Age Slider */}
            <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Patient Age</span>
                <span className="text-xs font-bold text-cobalt-700 dark:text-cobalt-300 bg-cobalt-50 dark:bg-cobalt-950/40 px-2 py-0.5 rounded">
                  {astralAge} yrs ({astralAgePoints} pt{astralAgePoints !== 1 ? 's' : ''})
                </span>
              </div>
              <input
                type="range" min="18" max="100" value={astralAge} aria-label="Patient age in years"
                onChange={(e) => setAstralAge(Number(e.target.value))}
                className="w-full accent-purple-600 h-2 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* NIHSS Slider */}
            <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">NIHSS score on admission</span>
                <span className="text-xs font-bold text-cobalt-700 dark:text-cobalt-300 bg-cobalt-50 dark:bg-cobalt-950/40 px-2 py-0.5 rounded">
                  {astralNihss} ({astralNihssPoints} pt{astralNihssPoints !== 1 ? 's' : ''})
                </span>
              </div>
              <input
                type="range" min="0" max="42" value={astralNihss} aria-label="NIHSS score"
                onChange={(e) => setAstralNihss(Number(e.target.value))}
                className="w-full accent-purple-600 h-2 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* Glucose input */}
            <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Acute Glucose level</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" step="0.1" value={astralGlucose}
                    aria-label={`Acute Glucose level (${astralGlucoseUnit === 'mgdl' ? 'mg/dL' : 'mmol/L'})`}
                    onChange={(e) => setAstralGlucose(e.target.value)}
                    className="w-16 px-1.5 py-0.5 text-xs text-right font-semibold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cobalt-600"
                  />
                  <div className="inline-flex rounded bg-slate-100 dark:bg-slate-800 p-0.5 text-[9px] font-bold">
                    <button
                      onClick={() => {
                        if (astralGlucoseUnit === 'mgdl') {
                          if (glucoseValid) setAstralGlucose(parseFloat((Number(astralGlucose) / 18.0).toFixed(1)));
                          setAstralGlucoseUnit('mmol');
                        }
                      }}
                      className={`px-1 rounded ${astralGlucoseUnit === 'mmol' ? 'bg-cobalt-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      mmol
                    </button>
                    <button
                      onClick={() => {
                        if (astralGlucoseUnit === 'mmol') {
                          if (glucoseValid) setAstralGlucose(Math.round(Number(astralGlucose) * 18.0));
                          setAstralGlucoseUnit('mgdl');
                        }
                      }}
                      className={`px-1 rounded ${astralGlucoseUnit === 'mgdl' ? 'bg-cobalt-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      mg/dL
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 dark:text-slate-400">Abnormal if &lt;3.7 or &gt;7.3 mmol/L</span>
                <span className={`font-semibold ${astralGlucosePoints > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {!glucoseValid ? 'Enter a valid glucose' : astralGlucosePoints > 0 ? 'Abnormal (+1 pt)' : 'Normal (+0 pts)'}
                </span>
              </div>
            </div>

            {/* Visual field toggle */}
            <BinaryToggle
              label="Visual Field Defect"
              desc="New visual field defect present on admission examination"
              value={astralVisualDefect}
              onChange={setAstralVisualDefect}
              colorClass="bg-cobalt-600"
            />

            {/* Time delay toggle */}
            <BinaryToggle
              label="Time to Admission > 3 Hours"
              desc="Time from symptom onset (or last-known-well) to admission is > 3 hours"
              value={astralTimeDelay}
              onChange={setAstralTimeDelay}
              colorClass="bg-cobalt-600"
            />

            {/* LOC toggle */}
            <BinaryToggle
              label="Impaired Level of Consciousness"
              desc="Reduced LOC on admission (NIHSS item 1a > 0)"
              value={astralLocImpaired}
              onChange={setAstralLocImpaired}
              colorClass="bg-cobalt-600"
            />

            {/* Score only; probability mapping is withheld. */}
            <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/50 p-4 dark:border-cobalt-900/60 dark:bg-cobalt-950/20">
              <span className="text-xs font-bold text-cobalt-700 dark:text-cobalt-400">ASTRAL Score</span>
              <p className="text-2xl font-black text-cobalt-900 dark:text-white">{astralTotal === null ? 'Incomplete' : `${astralTotal} points`}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Outcome percentages are unavailable pending validation. This historical score is not a reliable basis for counseling critically ill patients or limiting treatment.</p>
            </div>

            <button
              onClick={resetAstral}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              Reset Inputs
            </button>
          </div>
  );
}

function PlanCalculatorTab() {
  const [planDependence, setPlanDependence] = useState(false);
  const [planCancer, setPlanCancer] = useState(false);
  const [planChf, setPlanChf] = useState(false);
  const [planAfib, setPlanAfib] = useState(false);
  const [planLocReduced, setPlanLocReduced] = useState(false);
  const [planAge, setPlanAge] = useState(65);
  const [planLegWeakness, setPlanLegWeakness] = useState(false);
  const [planArmWeakness, setPlanArmWeakness] = useState(false);
  const [planAphasiaNeglect, setPlanAphasiaNeglect] = useState(false);

  const planAgePoints = Math.min(10, Math.floor(planAge / 10));
  const planTotal = calculatePlanScore({
    dependence: planDependence,
    cancer: planCancer,
    chf: planChf,
    afib: planAfib,
    locReduced: planLocReduced,
    age: planAge,
    legWeakness: planLegWeakness,
    armWeakness: planArmWeakness,
    aphasiaNeglect: planAphasiaNeglect
  });

  const resetPlan = () => {
    setPlanDependence(false);
    setPlanCancer(false);
    setPlanChf(false);
    setPlanAfib(false);
    setPlanLocReduced(false);
    setPlanAge(65);
    setPlanLegWeakness(false);
    setPlanArmWeakness(false);
    setPlanAphasiaNeglect(false);
  };

  return (
<div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">PLAN Variables</h4>

            {/* Age Slider */}
            <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Patient Age</span>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                  {planAge} yrs ({planAgePoints} pt{planAgePoints !== 1 ? 's' : ''})
                </span>
              </div>
              <input
                type="range" min="18" max="100" value={planAge} aria-label="Patient age in years"
                onChange={(e) => setPlanAge(Number(e.target.value))}
                className="w-full accent-teal-700 h-2 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-700"
              />
            </div>

            {/* dependence toggle */}
            <BinaryToggle
              label="Preadmission Dependence"
              desc="Requires assistance with basic Activities of Daily Living (ADLs) baseline"
              value={planDependence}
              onChange={setPlanDependence}
              colorClass="bg-teal-700"
            />

            {/* cancer toggle */}
            <BinaryToggle
              label="Cancer"
              desc="Original PLAN cancer variable; confirm the original definition rather than inferring it from treatment status alone"
              value={planCancer}
              onChange={setPlanCancer}
              colorClass="bg-teal-700"
            />

            {/* chf toggle */}
            <BinaryToggle
              label="Congestive Heart Failure"
              desc="Preadmission history of CHF"
              value={planChf}
              onChange={setPlanChf}
              colorClass="bg-teal-700"
            />

            {/* afib toggle */}
            <BinaryToggle
              label="Atrial Fibrillation"
              desc="Preadmission history of Afib"
              value={planAfib}
              onChange={setPlanAfib}
              colorClass="bg-teal-700"
            />

            {/* loc reduced toggle */}
            <BinaryToggle
              label="Reduced Level of Consciousness"
              desc="Drowsy, stuporous, or comatose at onset/admission"
              value={planLocReduced}
              onChange={setPlanLocReduced}
              colorClass="bg-teal-700"
            />

            {/* leg weakness toggle */}
            <BinaryToggle
              label="Significant/Total Leg Weakness"
              desc="Use the original Canadian Neurological Scale operational definition; this abbreviated label does not define a new motor cutoff"
              value={planLegWeakness}
              onChange={setPlanLegWeakness}
              colorClass="bg-teal-700"
            />

            {/* arm weakness toggle */}
            <BinaryToggle
              label="Significant/Total Arm Weakness"
              desc="Use the original Canadian Neurological Scale operational definition; this abbreviated label does not define a new motor cutoff"
              value={planArmWeakness}
              onChange={setPlanArmWeakness}
              colorClass="bg-teal-700"
            />

            {/* aphasia/neglect toggle */}
            <BinaryToggle
              label="Aphasia or Neglect"
              desc="Language comprehension/production deficit or hemispatial neglect"
              value={planAphasiaNeglect}
              onChange={setPlanAphasiaNeglect}
              colorClass="bg-teal-700"
            />

            {/* Score retained; outcome estimates are withheld pending validation. */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/20">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">PLAN Score</span>
              <p className="text-2xl font-black text-teal-900 dark:text-white">{planTotal} pts</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Outcome percentages are unavailable pending validation against the original study. Do not use this score alone to limit treatment.</p>
            </div>

            <button
              onClick={resetPlan}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              Reset Inputs
            </button>
          </div>
  );
}

function IchCalculatorTab() {
  const [ichGcsCategory, setIchGcsCategory] = useState(0); // 0 = GCS 13-15, 1 = 5-12, 2 = 3-4
  const [ichAge80, setIchAge80] = useState(false);
  const [ichVolume30, setIchVolume30] = useState(false);
  const [ichIvh, setIchIvh] = useState(false);
  const [ichInfratentorial, setIchInfratentorial] = useState(false);

  const ichTotal = calculateIchScore({
    gcsCategory: ichGcsCategory,
    age80: ichAge80,
    volume30: ichVolume30,
    ivh: ichIvh,
    infratentorial: ichInfratentorial
  });
  const ichRisk = getIchRisk(ichTotal);

  const resetIch = () => {
    setIchGcsCategory(0);
    setIchAge80(false);
    setIchVolume30(false);
    setIchIvh(false);
    setIchInfratentorial(false);
  };

  return (
<div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-crit-700 dark:text-crit-400">ICH Variables</h4>

            {/* GCS Category */}
            <div className="space-y-2 py-1.5 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Glasgow Coma Scale (GCS)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIchGcsCategory(0)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 0
                      ? 'bg-crit-50 text-crit-700 border-crit-500 dark:bg-crit-950/40 dark:border-crit-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  13–15 (0 pts)
                </button>
                <button
                  onClick={() => setIchGcsCategory(1)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 1
                      ? 'bg-crit-50 text-crit-700 border-crit-500 dark:bg-crit-950/40 dark:border-crit-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  5–12 (1 pt)
                </button>
                <button
                  onClick={() => setIchGcsCategory(2)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 2
                      ? 'bg-crit-50 text-crit-700 border-crit-500 dark:bg-crit-950/40 dark:border-crit-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  3–4 (2 pts)
                </button>
              </div>
            </div>

            {/* Age >= 80 toggle */}
            <BinaryToggle
              label="Age ≥ 80 Years"
              desc="Patient age is 80 years or older"
              value={ichAge80}
              onChange={setIchAge80}
              colorClass="bg-crit-700"
            />

            {/* ICH Volume >= 30 toggle */}
            <BinaryToggle
              label="ICH Volume ≥ 30 mL"
              desc="Intracerebral hemorrhage volume estimated at 30 mL or larger"
              value={ichVolume30}
              onChange={setIchVolume30}
              colorClass="bg-crit-700"
            />

            {/* IVH toggle */}
            <BinaryToggle
              label="Intraventricular Hemorrhage (IVH)"
              desc="Hemorrhage extension into the ventricles present"
              value={ichIvh}
              onChange={setIchIvh}
              colorClass="bg-crit-700"
            />

            {/* Infratentorial toggle */}
            <BinaryToggle
              label="Infratentorial Origin"
              desc="Brainstem or cerebellar origin of hemorrhage (vs. supratentorial)"
              value={ichInfratentorial}
              onChange={setIchInfratentorial}
              colorClass="bg-crit-700"
            />

            {/* Results */}
            <div className="rounded-xl border border-crit-200 bg-crit-50/50 p-4 dark:border-crit-900/60 dark:bg-crit-950/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wide font-bold text-crit-700 dark:text-crit-400">ICH Score Result</span>
                  <h4 className="text-2xl font-black text-crit-900 dark:text-white">{ichTotal} <span className="text-sm font-normal text-slate-500 dark:text-mute">points</span></h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-crit-700 dark:text-crit-400">30d Mortality Risk</span>
                  <h4 className="text-2xl font-black text-crit-900 dark:text-white">{ichRisk}</h4>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-crit-700 transition-all duration-300"
                    style={{ width: `${(ichTotal / 6) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                • <strong>Historical cohort estimate</strong>: {ichRisk}. This is not an individual prognosis; no percentage is assigned here to score 6.
                <br/>• <strong>Clinical Context</strong>: AHA/ASA guidelines emphasize that the ICH Score is a communication aid and must <strong>never</strong> be used as the sole basis for withholding care or making early DNR decisions. In patients without prior documented treatment limitations, postponing new DNAR orders or withdrawal of support until at least the second full hospital day is reasonable; this is not an automatic point for prognostic certainty or withdrawal.
              </p>
            </div>

            <button
              onClick={resetIch}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              Reset Inputs
            </button>
          </div>
  );
}

export function StrokePrognosisCalculator() {
  const [activeTab, setActiveTab] = useState('astral'); // 'astral', 'plan', 'ich'

  return (
    <div className="bg-white border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm overflow-hidden dark:bg-card">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Historical Score Explorer</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Pre-filled teaching examples; verify the original model definitions before using a score.</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold">teaching reference</span>
      </div>

      {/* Tabs Selector */}
      <div className="p-3">
        <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
          <button
            onClick={() => setActiveTab('astral')}
            aria-pressed={activeTab === 'astral'}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'astral'
                ? 'bg-cobalt-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ASTRAL
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            aria-pressed={activeTab === 'plan'}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'plan'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            PLAN
          </button>
          <button
            onClick={() => setActiveTab('ich')}
            aria-pressed={activeTab === 'ich'}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'ich'
                ? 'bg-crit-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ICH Score
          </button>
        </div>
      </div>

      {/* Calculator Inputs Panel */}
      <div className="px-4 pb-4 space-y-4">
        <div className={activeTab === 'astral' ? 'block' : 'hidden'}><AstralCalculatorTab /></div>
        <div className={activeTab === 'plan' ? 'block' : 'hidden'}><PlanCalculatorTab /></div>
        <div className={activeTab === 'ich' ? 'block' : 'hidden'}><IchCalculatorTab /></div>
      </div>
    </div>
  );
}


export function StrokePrognosisCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-stroke-prognosis">
        <div className="card-container" style={{boxSizing: 'border-box', height: '1275px'}}>
          <div className="card-content" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Stroke Prognosis &amp; Clinical Scores</h1>
            <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
              Clinical prediction scales for ischemic and hemorrhagic stroke outcomes.
            </p>

            <svg viewBox="0 0 735 80" role="img" focusable="false" aria-label="Stroke prognosis score comparison: ASTRAL, PLAN, ICH Score and modified Rankin Scale outcome bands" style={{width: '100%', height: '80px', marginBottom: '8px'}}>
              <rect x="0" y="0" width="735" height="80" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>

              <rect x="267" y="10" width="200" height="25" rx="12.5" fill="var(--purple-deep)" />
              <text x="367" y="22.5" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle" dominantBaseline="central">STROKE PROGNOSIS SCALES</text>

              <path d="M 367 35 L 367 48 M 180 48 L 555 48 M 180 48 L 180 60 M 555 48 L 555 60" stroke="var(--purple)" strokeWidth="1.5" fill="none" />

              <polygon points="180,63 177,57 183,57" fill="var(--purple)" />
              <rect x="80" y="63" width="200" height="20" rx="4" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1"/>
              <text x="180" y="73" fill="var(--purple-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Ischemic Stroke: ASTRAL &amp; PLAN</text>

              <polygon points="555,63 552,57 558,57" fill="var(--purple)" />
              <rect x="455" y="63" width="200" height="20" rx="4" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1"/>
              <text x="555" y="73" fill="var(--red-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Hemorrhagic Stroke: ICH Score</text>
            </svg>

            {/* Grid for ASTRAL and PLAN scores */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px'}}>
              {/* ASTRAL Score Card */}
              <div className="toast-card primary" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--purple-deep)', marginBottom: '3px'}}>ASTRAL Score (Acute Ischemic Stroke)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>Predicts 90-day poor functional outcome (mRS &gt; 2)</p>
                <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--rule-soft)', fontSize: '7.2pt', fontWeight: 'bold'}}>
                      <th style={{textAlign: 'left', padding: '2px 0'}}>Predictor Variable</th>
                      <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>A</strong>ge</td><td style={{textAlign: 'right'}}>1 pt per 5 years</td></tr>
                    <tr><td><strong>S</strong>everity (NIHSS)</td><td style={{textAlign: 'right'}}>1 pt per NIHSS pt</td></tr>
                    <tr><td><strong>T</strong>ime to admission &gt;3h</td><td style={{textAlign: 'right'}}>2 pts</td></tr>
                    <tr><td><strong>R</strong>ange of visual fields (defect)</td><td style={{textAlign: 'right'}}>2 pts</td></tr>
                    <tr><td><strong>A</strong>cute glucose (&lt;3.7 or &gt;7.3 mmol/L)</td><td style={{textAlign: 'right'}}>1 pt</td></tr>
                    <tr><td><strong>L</strong>evel of consciousness (impaired)</td><td style={{textAlign: 'right'}}>3 pts</td></tr>
                  </tbody>
                </table></div>
                <p style={{fontSize: '7.5pt'}}>Probability estimates are withheld pending validation. ASTRAL should not guide counseling of critically ill patients or treatment limitations.</p>
              </div>

              {/* PLAN Score Card */}
              <div className="toast-card secondary" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '3px'}}>PLAN Score (Acute Ischemic Stroke)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>Original outcomes: 30-day mortality and death/severe dependency at discharge</p>
                <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--rule-soft)', fontSize: '7.2pt', fontWeight: 'bold'}}>
                      <th style={{textAlign: 'left', padding: '2px 0'}}>Predictor Domain &amp; Variables</th>
                      <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>P</strong>readmission dependence / Cancer</td><td style={{textAlign: 'right'}}>1.5 pts each</td></tr>
                    <tr><td><strong>P</strong>readmission CHF / Atrial Fibrillation</td><td style={{textAlign: 'right'}}>1.0 pt each</td></tr>
                    <tr><td><strong>L</strong>evel of consciousness (reduced)</td><td style={{textAlign: 'right'}}>5.0 pts</td></tr>
                    <tr><td><strong>A</strong>ge (decades)</td><td style={{textAlign: 'right'}}>1 pt per decade (max 10)</td></tr>
                    <tr><td><strong>N</strong>eurologic: Leg / Arm weakness</td><td style={{textAlign: 'right'}}>2 pts each</td></tr>
                    <tr><td><strong>N</strong>eurologic: Aphasia or Neglect</td><td style={{textAlign: 'right'}}>1.0 pt</td></tr>
                  </tbody>
                </table></div>
<p style={{fontSize: '7.5pt'}}>Outcome percentages are withheld pending validation against the original cohort.</p>
              </div>
            </div>

            {/* Bottom section: ICH Score and mRS Scale */}
            <div style={{display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: '12px', marginBottom: '12px'}}>
              {/* ICH Score Card */}
              <div className="toast-card alert-red" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '3px'}}>ICH Score (Intracerebral Hemorrhage)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>Predicts 30-day mortality in spontaneous ICH</p>
                <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--rule-soft)', fontSize: '7.2pt', fontWeight: 'bold'}}>
                      <th style={{textAlign: 'left', padding: '2px 0'}}>Predictor Component</th>
                      <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>GCS Score:</strong> 3–4 (2 pts) | 5–12 (1 pt) | 13–15 (0 pts)</td><td style={{textAlign: 'right'}}>0–2 pts</td></tr>
                    <tr><td><strong>Age:</strong> &ge; 80 years</td><td style={{textAlign: 'right'}}>1 pt</td></tr>
                    <tr><td><strong>ICH Volume:</strong> &ge; 30 mL</td><td style={{textAlign: 'right'}}>1 pt</td></tr>
                    <tr><td><strong>Intraventricular Hemorrhage (IVH):</strong> Present</td><td style={{textAlign: 'right'}}>1 pt</td></tr>
                    <tr><td><strong>Infratentorial Origin of Hemorrhage</strong></td><td style={{textAlign: 'right'}}>1 pt</td></tr>
                  </tbody>
                </table></div>
                <strong style={{color: 'var(--red-deep)', display: 'block', marginTop: '6px', fontSize: '7.8pt'}}>Score vs. 30-Day Mortality Risk:</strong>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px', textAlign: 'center', fontSize: '7.2pt', marginTop: '3px'}}>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>0</strong><br/><span className="badge-pill badge-pill-ok">0%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>1</strong><br/><span className="badge-pill badge-pill-ok">13%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>2</strong><br/><span className="badge-pill badge-pill-warn">26%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>3</strong><br/><span className="badge-pill badge-pill-crit">72%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>4</strong><br/><span className="badge-pill badge-pill-crit">97%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>5</strong><br/><span className="badge-pill badge-pill-crit">100%</span></div>
                </div>
                <p style={{marginTop: '4px', fontSize: '7.2pt'}}>Historical cohort rates, not individual predictions. No percentage is assigned here to score 6; do not extrapolate a certain fatal outcome.</p>
              </div>

              {/* Modified Rankin Scale (mRS) Card */}
              <div className="toast-card neutral" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--slate)', marginBottom: '3px'}}>Modified Rankin Scale (mRS)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>The gold standard for assessing global functional recovery</p>
                <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.4pt'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--rule-soft)', fontWeight: 'bold'}}>
                      <th style={{width: '35px', textAlign: 'center', padding: '2px 0'}}>Grade</th>
                      <th style={{textAlign: 'left', padding: '2px 0'}}>Clinical Description of Recovery State</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#2e7d32'}}>0</td><td>No symptoms at all.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#2e7d32'}}>1</td><td>No significant disability despite symptoms; able to carry out all usual duties.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#2e7d32'}}>2</td><td>Slight disability; unable to carry out all previous activities but <strong>independent</strong>.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#f57c00'}}>3</td><td>Moderate disability; requires some help but <strong>able to walk unassisted</strong>.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#e64a19'}}>4</td><td>Moderately severe; <strong>unable to walk or attend to bodily needs</strong> without assistance.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#c62828'}}>5</td><td>Severe disability; bedridden, incontinent, requiring constant nursing care.</td></tr>
                    <tr><td style={{textAlign: 'center', fontWeight: 'bold', color: '#212121'}}>6</td><td>Dead.</td></tr>
                  </tbody>
                </table></div>
              </div>
            </div>

            {/* Warning / Disclaimers Box */}
            <div style={{border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '8px 12px', background: 'var(--purple-soft)', marginTop: 'auto', marginBottom: '8px'}}>
              <strong style={{color: 'var(--purple-deep)', fontSize: '9.0pt', display: 'block', marginBottom: '2px'}}>Prognostication Principles &amp; Limitations</strong>
              <div style={{fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                • <strong>Not for Care Limitations</strong>: These clinical scores serve to quantify severity, improve inter-provider communication, and assist in counseling. They <strong>MUST NOT</strong> be used in isolation as the sole basis for withholding reperfusion therapies, surgical decompression, or withdrawing life-sustaining treatment (avoiding the self-fulfilling prophecy of poor outcome).
                <br/>• <strong>Dynamic Evaluation</strong>: Clinical trajectory over the first 24–72 hours is often more predictive of final recovery than any single point-in-time calculation upon hospital admission.
                <br/>• <strong>Acute ICH — Hemostatic Therapy</strong>: The ICH Score is prognostic, not a treatment target. Early intensive blood-pressure lowering and hematoma-directed care remain the evidence-based acute levers (2022 AHA/ASA ICH guideline). Recombinant factor VIIa (rFVIIa) given within 2h slowed hematoma growth but did <strong>not</strong> improve 180-day function and increased thromboembolic events (FASTEST, 2026; PMID 41653933) — <strong>not</strong> recommended for routine use.
              </div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.2pt', lineHeight: '1.25'}}>
              <strong>Neuroprognostication:</strong> 2026 NCS/DGNI guidance, <a href="https://pubmed.ncbi.nlm.nih.gov/41942818/" target="_blank" rel="noopener noreferrer">PMID: 41942818</a><br/>
              <strong>ASTRAL Score:</strong> Ntaios G, et al. <em>Neurology</em>. 2012;78(24):1916-22. <a href="https://pubmed.ncbi.nlm.nih.gov/22649218/" target="_blank" rel="noopener noreferrer">PMID: 22649218</a><br/>
              <strong>PLAN Score:</strong> O'Donnell MJ, et al. <em>Arch Intern Med</em>. 2012;172(20):1548-56. <a href="https://pubmed.ncbi.nlm.nih.gov/23147454/" target="_blank" rel="noopener noreferrer">PMID: 23147454</a><br/>
              <strong>ICH Score:</strong> Hemphill JC 3rd, et al. <em>Stroke</em>. 2001;32:891-7. <a href="https://pubmed.ncbi.nlm.nih.gov/11283388/" target="_blank" rel="noopener noreferrer">PMID: 11283388</a><br/>
              <strong>mRS Scale:</strong> van Swieten JC, et al. <em>Stroke</em>. 1988;19:604-7. <a href="https://pubmed.ncbi.nlm.nih.gov/3363593/" target="_blank" rel="noopener noreferrer">PMID: 3363593</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CervicalDissectionView = () => {
  return (
    <PdfActionBar
      title="Cervical Artery Dissection"
      pdfPath="documents/references/Cervical Artery Dissection.pdf"
      pdfName="Cervical Artery Dissection.pdf"
      iconColorClass="text-blue-600 dark:text-blue-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <CervicalDissectionCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function CervicalDissectionCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [svgHover, setSvgHover] = useState(false);
  const [pngHover, setPngHover] = useState(false);

  const renderSVG = () => (
    <svg viewBox="0 0 735 110" role="img" focusable="false" aria-label="Cervical artery dissection: intimal tear and false lumen anatomy, imaging signs, and antithrombotic decision" style={{width: '100%', height: '100%'}}>
      <rect x="0" y="0" width="735" height="110" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      <path d="M 20 25 L 430 25 M 20 85 L 430 85" stroke="#4A5A6D" strokeWidth="3" strokeLinecap="round" />
      <path d="M 20 33 L 150 33" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <path d="M 20 77 L 430 77" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <path d="M 150 33 L 160 48" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 160 48 C 220 72, 320 72, 380 33" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <path d="M 160 48 C 220 72, 320 72, 380 33 L 380 25 L 160 25 Z" fill="var(--red-soft)" opacity="0.8" />
      <path d="M 180 25 C 220 45, 320 45, 360 25" fill="var(--red)" opacity="0.25" />
      <path d="M 380 33 L 430 33" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <path d="M 100 55 Q 140 55, 160 40" fill="none" stroke="var(--red)" strokeWidth="2.2" markerEnd="url(#arrow-red)" />
      <path d="M 165 32 Q 190 28, 220 28" fill="none" stroke="var(--red)" strokeWidth="2.2" markerEnd="url(#arrow-red)" />
      <path d="M 240 68 L 300 68" stroke="var(--amber)" strokeWidth="1.8" fill="none" markerEnd="url(#arrow-amber)" />
      <rect x="380" y="55" width="45" height="22" rx="3" fill="var(--purple)" opacity="0.85" stroke="var(--purple-deep)" strokeWidth="1" />
      <line x1="384" y1="77" x2="392" y2="55" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
      <line x1="392" y1="77" x2="400" y2="55" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
      <line x1="400" y1="77" x2="408" y2="55" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
      <text x="75" y="58" fill="var(--teal-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">TRUE LUMEN</text>
      <text x="145" y="16" fill="var(--red-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Intimal Tear</text>
      <text x="270" y="38" fill="var(--red-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">FALSE LUMEN (Intramural Hematoma)</text>
      <text x="270" y="60" fill="var(--amber-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Stenosis / Compression</text>
      <text x="402" y="48" fill="var(--purple-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Thrombus</text>
      <line x1="470" y1="10" x2="470" y2="100" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="530" cy="55" r="28" fill="none" stroke="#4A5A6D" strokeWidth="2.5" />
      <circle cx="530" cy="55" r="24" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="530" cy="55" r="23" fill="var(--teal-soft)" opacity="0.6" />
      <text x="530" y="58" fill="var(--teal-deep)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">NORMAL ICA</text>
      <text x="530" y="96" fill="var(--ink-soft)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Sympathetic Plexus (Cervical)</text>
      <circle cx="530" cy="23" r="1.5" fill="var(--amber)" />
      <circle cx="545" cy="27" r="1.5" fill="var(--amber)" />
      <circle cx="555" cy="40" r="1.5" fill="var(--amber)" />
      <circle cx="557" cy="55" r="1.5" fill="var(--amber)" />
      <circle cx="555" cy="70" r="1.5" fill="var(--amber)" />
      <circle cx="545" cy="83" r="1.5" fill="var(--amber)" />
      <circle cx="530" cy="87" r="1.5" fill="var(--amber)" />
      <circle cx="650" cy="55" r="28" fill="none" stroke="#4A5A6D" strokeWidth="2.5" />
      <path d="M 622 55 A 28 28 0 0 1 678 55 C 670 65, 630 65, 622 55 Z" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
      <path d="M 622 55 C 630 65, 670 65, 678 55 A 28 28 0 0 1 622 55 Z" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
      <ellipse cx="650" cy="70" rx="18" ry="8" fill="var(--teal-soft)" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="650" cy="23" r="1.5" fill="var(--amber)" opacity="0.3" />
      <circle cx="665" cy="27" r="1.5" fill="var(--amber)" opacity="0.3" />
      <circle cx="675" cy="40" r="1.5" fill="var(--amber)" opacity="0.3" />
      <text x="650" y="44" fill="var(--red-deep)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Hematoma</text>
      <text x="650" y="73" fill="var(--teal-deep)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">True Lumen</text>
      <text x="650" y="96" fill="var(--ink-soft)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Cervical ICA Dissection</text>
      <defs>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--red)" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--amber)" />
        </marker>
      </defs>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cervical-dissection">
        <div className="card-container" style={{boxSizing: 'border-box'}}>
          <div className="card-content">
            <h1 style={{textAlign: 'center', marginBottom: '8px'}}>Cervical Artery Dissection</h1>

            {/* Diagrams Banner - Stacked Vertically (No Toggling, Optimally Seen on Page) */}
            {/* Anatomy & Dissection SVG */}
            <div
              style={{
                width: '100%',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--fill-soft)',
                borderRadius: '8px',
                border: '1.5px solid var(--rule-soft)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                marginBottom: '8px',
                padding: '6px'
              }}
              title="Anatomy Diagram"
            >
              {renderSVG()}
            </div>

            {/* Stroke Mechanisms Illustration */}
            <div
              style={{
                width: '100%',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--fill-soft)',
                borderRadius: '8px',
                border: '1.5px solid var(--rule-soft)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                marginBottom: '8px'
              }}
              title="Stroke Mechanisms"
            >
              <button
                type="button"
                aria-label="Open cervical artery dissection stroke mechanisms image"
                style={{ border: 0, padding: 0, background: 'transparent' }}
                className="relative group cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current overflow-hidden rounded-md flex justify-center items-center w-full h-full"
                onClick={() => setLightboxImage({ src: 'assets/dissection_stroke_mechanisms.png', alt: 'Cervical Artery Dissection Stroke Mechanisms', title: 'Stroke Mechanisms in Cervical Artery Dissection' })}
              >
                <img
                  src="assets/dissection_stroke_mechanisms.png"
                  loading="lazy"
                  decoding="async"
                  alt="Cervical Artery Dissection Stroke Mechanisms"
                  style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}}
                  className="transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                  <span className="text-[11px] text-white font-semibold bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                  </span>
                </span>
              </button>
            </div>

            <div style={{border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%)', marginBottom: '8px'}}>
              <strong style={{color: 'var(--purple-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>1. Clinical Presentation &amp; Pathophysiology</strong>
              <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '12px', fontSize: '7.8pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                <div>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Ipsilateral Pain &amp; Onset</strong>
                  <br/>• <strong>Carotid (ICA)</strong>: Frontotemporal/retro-orbital/facial pain (jaw angle).
                  <br/>• <strong>Vertebral (VA)</strong>: Severe occipital or posterior neck pain.
                  <br/>• <strong>Onset</strong>: Precedes stroke/TIA by hours to days (median 4 days).
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Anhidrosis-Sparing Horner's</strong>
                  <br/>• <strong>Signs</strong>: Ptosis/miosis (28–58% of ICA) <strong>without</strong> anhidrosis.
                  <br/>• <strong>Mechanism</strong>: Sweat fibers follow ECA plexus; pupil/eyelid fibers follow ICA.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Neurological Deficits</strong>
                  <br/>• <strong>CN Palsies</strong>: CN IX–XII palsies (8–16%) from local ICA compression.
                  <br/>• <strong>VA Territory</strong>: Wallenberg syndrome, cerebellar ataxia, PICA/AICA strokes.
                </div>
              </div>
            </div>

            {/* Section 2 & 3 Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '8px', marginBottom: '8px'}}>
              {/* Section 2: Diagnostic Workup */}
              <div style={{border: '1.5px solid var(--teal)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--teal-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>2. Diagnostic Workup</strong>
                <ul style={{margin: '0', paddingLeft: '12px', fontSize: '7.8pt', lineHeight: '1.4', color: 'var(--ink-soft)'}}>
                  <li><strong>CTA Head/Neck</strong>: Shows string sign, dissection flap, pseudoaneurysm, or occlusion.</li>
                  <li><strong>MRI Neck (T1 Fat-Sat)</strong>: Crescentic mural signal can support intramural hematoma; timing, artifacts and mimics affect interpretation.</li>
                  <li><strong>DSA</strong>: Reserve for diagnostic doubt or stenting.</li>
                  <li><strong>Screening</strong>: Assess for FMD/connective tissue disease, especially if spontaneous/recurrent.</li>
                </ul>
              </div>

              {/* Section 3: Medical Management */}
              <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--red-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>3. Medical Management: Extracranial vs. Intracranial Dissection</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                  <div>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Extracranial Dissection</strong>
                    <br/>• <strong>Antithrombotics</strong>: Continue antiplatelet or anticoagulant therapy for at least 3 months (2026 AHA/ASA AIS guideline, Class 2a); the 2024 AHA scientific statement suggests at least 3–6 months, individualized.
                    <br/>• <strong>Antithrombotic choice:</strong> individualize antiplatelet versus anticoagulant therapy for extracranial dissection. ESO expert consensus considers a few weeks of DAPT for selected TIA/minor stroke; this is not a universal 21–90-day regimen, and DOAC evidence is less direct than the randomized VKA comparisons.
                    <br/>• <strong>STOP-CAD</strong>: In occlusive dissection, observational data associate anticoagulation with lower ischemic stroke risk (aHR 0.40); if anticoagulation is chosen, switching to antiplatelet therapy before 180 days seems reasonable to limit major bleeding (not tested in an RCT).
                    <br/>• <strong>IV Thrombolysis</strong>: Reasonable within 4.5 hours in otherwise-eligible patients (Class 2a, LOE C-LD).
                  </div>
                  <div style={{borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px'}}>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Intracranial &amp; Pseudoaneurysms</strong>
                    <br/>• <strong>SAH</strong>: Lack external elastic lamina &amp; thin adventitia; rupture risk.
                    <br/>• <strong>Anticoagulation</strong>: Avoid anticoagulation when SAH is present; intracranial dissection with SAH warrants early endovascular or surgical intervention (ESO 2021). For ischemic presentations without SAH, single antiplatelet therapy is commonly preferred.
                    <br/>• <strong>IVT Caution</strong>: IVT is reasonable in otherwise-eligible extracranial CeAD, but the risks and benefits of IVT in cases with intracranial extension are not well established (AHA 2024 scientific statement, ungraded).
                    <br/>• <strong>Intervention:</strong> seek multidisciplinary assessment for exceptional recurrent ischemia despite medical treatment or other complications. Stenosis severity alone is not a routine intracranial-dissection stenting indication; SAH requires a distinct urgent pathway.
                  </div>
                  <div style={{gridColumn: '1 / -1', borderTop: '1px dashed var(--red)', paddingTop: '6.5px', marginTop: '4px', fontSize: '7.4pt'}}>
                    • <strong>Recurrence &amp; Activity</strong>: Long-term CeAD recurrence is low (~1%/yr). Avoid high-risk neck activities (chiropractic neck manipulation, rollercoasters, extreme hyperextension/rotation) for secondary prevention.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Landmark Trials */}
            <div style={{border: '1.5px solid var(--amber)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%)', marginBottom: '6px'}}>
              <strong style={{color: 'var(--amber-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>4. Landmark Trial &amp; Cohort Evidence</strong>
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.0pt', lineHeight: '1.2', color: 'var(--ink)'}}>
                <thead>
                  <tr style={{borderBottom: '1.5px solid var(--amber)', color: 'var(--amber-deep)', fontWeight: '700'}}>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '12%'}}>Study / Year</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '20%'}}>Population &amp; Design</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '25%'}}>Interventions Compared</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '43%'}}>Key Outcomes &amp; Clinical Nuance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>CADISS</strong><br/>2015</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 250. Extracranial CeAD. RCT.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Antiplatelet vs. Anticoagulant for 3 months.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Primary Composite (Ipsilateral stroke or death at 3m)</strong>: 2.0% vs. 1.0% (p = 0.63). Established clinical equipoise.
                    </td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>TREAT-CAD</strong><br/>2021</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 194 (PP = 173). Extracranial. RCT.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Aspirin 300mg daily vs. VKA for 3 months.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Primary Composite (stroke, major hemorrhage, or death to 90d; new ischemic/hemorrhagic MRI lesion at 14d)</strong>: 23% vs. 15% (Non-inferiority NOT met). Ischemic stroke: 8.0% vs. 0%.
                    </td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>Kaufmann IPD</strong><br/>2024</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 444. IPD meta-analysis of CADISS + TREAT-CAD.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Antiplatelet vs. Anticoagulant x 90d.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Primary Composite (Ischemic stroke, major bleeding, or death at 90d)</strong>: 1.4% anticoagulation vs. 4.4% antiplatelet; OR 0.33 (95% CI 0.08-1.05), P = .06 (not significant).
                      <br/>• <strong>Ischemic Stroke alone</strong>: Significant reduction with anticoagulation (0.5% vs. 4.0%; OR 0.14, p = 0.01), with a non-significant increase in major bleeding (0.9% vs. 0%).
                    </td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>STOP-CAD</strong><br/>2024</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 3,636. Multicenter observational cohort registry.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Antiplatelet vs. Anticoagulation.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Temporal Risk</strong>: 87% of recurrent strokes occurred in the first 30 days.
                      <br/>• <strong>Occlusion Benefit</strong>: In an interaction analysis, occlusive dissection was associated with lower ischemic stroke risk on anticoagulation (adjusted HR 0.40, 95% CI 0.18–0.88); overall, anticoagulation was associated with a nonsignificantly lower stroke risk by day 30 (adjusted HR 0.71, 95% CI 0.45–1.12).
                      <br/>• <strong>Transition Strategy</strong>: Authors' interpretation: if anticoagulation is chosen, switching to antiplatelet therapy before 180 days seems reasonable, because anticoagulation was associated with more major hemorrhage by day 180 (adjusted HR 5.56, 95% CI 1.53–20.13) but not by day 30 (adjusted HR 1.39, 95% CI 0.35–5.45). A fixed day-30 switch was not tested.
                    </td>
                  </tr>
                </tbody>
              </table></div>
            </div>

            {/* Citations footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '4px 8px', fontSize: '7.3pt', lineHeight: '1.2'}}>
              <strong>CADISS:</strong> <em>Lancet Neurol</em>. 2015;14(4):361-7. <a href="https://pubmed.ncbi.nlm.nih.gov/25684164/" target="_blank">PMID: 25684164</a> | <strong>TREAT-CAD:</strong> <em>Lancet Neurol</em>. 2021;20(5):341-350. <a href="https://pubmed.ncbi.nlm.nih.gov/33765420/" target="_blank">PMID: 33765420</a><br/>
              <strong>Kaufmann IPD:</strong> <em>JAMA Neurol</em>. 2024;81(6):630-637. <a href="https://pubmed.ncbi.nlm.nih.gov/38739383/" target="_blank">PMID: 38739383</a> | <strong>STOP-CAD:</strong> <em>Stroke</em>. 2024;55(4):908-918. <a href="https://pubmed.ncbi.nlm.nih.gov/38335240/" target="_blank">PMID: 38335240</a> | <strong>AHA/ASA:</strong> <em>Stroke</em>. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a> | <strong>AHA Statement 2024:</strong> <em>Stroke</em>. 2024;55(3):e91-e106. <a href="https://pubmed.ncbi.nlm.nih.gov/38299330/" target="_blank">PMID: 38299330</a> | <strong>ESO Guideline 2021:</strong> <em>Eur Stroke J</em>. 2021;6(3):XXXIX-LXXXVIII. <a href="https://pubmed.ncbi.nlm.nih.gov/34746432/" target="_blank">PMID: 34746432</a>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

const FibromuscularDysplasiaView = () => {
  return (
    <PdfActionBar
      title="Fibromuscular Dysplasia & Stroke"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <FibromuscularDysplasiaCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function FibromuscularDysplasiaCard() {
  const [lightboxImage, setLightboxImage] = useState(null);

  const renderSVG = () => (
    <svg viewBox="0 0 735 120" role="img" focusable="false" aria-label="Fibromuscular dysplasia: string-of-beads arterial morphology, affected vascular beds, and screening extent" style={{width: '100%', height: '100%'}}>
      <rect x="0" y="0" width="735" height="120" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>

      {/* --- NORMAL ARTERY --- */}
      <text x="110" y="20" fill="var(--ink-soft)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">NORMAL ARTERY</text>
      <path d="M 20 45 L 200 45 M 20 75 L 200 75" stroke="#4A5A6D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 20 48 L 200 48" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 20 72 L 200 72" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 20 48 L 200 48 L 200 72 L 20 72 Z" fill="var(--teal-soft)" opacity="0.15" />
      <text x="110" y="63" fill="var(--teal-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Illustrative lumen</text>

      <line x1="225" y1="10" x2="225" y2="110" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* --- MULTIFOCAL FMD --- */}
      <text x="367" y="20" fill="var(--purple-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MULTIFOCAL FMD (STRING-OF-BEADS)</text>
      {/* Beaded top wall */}
      <path d="M 250 45 C 265 35, 275 50, 290 35 C 305 50, 315 35, 330 50 C 345 35, 355 50, 370 35 C 385 50, 395 35, 410 50 C 425 35, 435 50, 450 35 C 465 50, 475 35, 490 45" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Beaded bottom wall */}
      <path d="M 250 75 C 265 85, 275 70, 290 85 C 305 70, 315 85, 330 70 C 345 85, 355 70, 370 85 C 385 70, 395 85, 410 70 C 425 85, 435 70, 450 85 C 465 70, 475 85, 490 75" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Inner flow shading */}
      <path d="M 250 45 C 265 35, 275 50, 290 35 C 305 50, 315 35, 330 50 C 345 35, 355 50, 370 35 C 385 50, 395 35, 410 50 C 425 35, 435 50, 450 35 C 465 50, 475 35, 490 45 L 490 75 C 475 85, 465 70, 450 85 C 435 70, 425 85, 410 70 C 395 85, 385 70, 370 85 C 355 70, 345 85, 330 70 C 315 85, 305 70, 290 85 C 275 70, 265 85, 250 75 Z" fill="var(--purple-soft)" opacity="0.3" />

      <text x="370" y="63" fill="var(--purple-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Alternating Stenosis &amp; Dilatation</text>
      <text x="370" y="103" fill="var(--ink-mute)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Multifocal angiographic pattern</text>

      <line x1="515" y1="10" x2="515" y2="110" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* --- FOCAL FMD --- */}
      <text x="625" y="20" fill="var(--red-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">FOCAL FMD</text>
      {/* Concentric / Tubular Stenosis */}
      <path d="M 540 45 L 590 45 L 610 57 L 640 57 L 660 45 L 710 45" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 540 75 L 590 75 L 610 63 L 640 63 L 660 75 L 710 75" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Shading */}
      <path d="M 540 45 L 590 45 L 610 57 L 640 57 L 660 45 L 710 45 L 710 75 L 660 75 L 640 63 L 610 63 L 590 75 L 540 75 Z" fill="var(--red-soft)" opacity="0.2" />

      <text x="625" y="63" fill="var(--red-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Tubular Narrowing</text>
      <text x="625" y="103" fill="var(--ink-mute)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Focal angiographic pattern</text>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-fibromuscular-dysplasia">
        <div className="card-container" style={{boxSizing: 'border-box'}}>
          <div className="card-content">
            <h1 style={{textAlign: 'center', marginBottom: '8px'}}>Fibromuscular Dysplasia (FMD)</h1>

            {/* SVG Diagram Banner */}
            <div
              style={{
                width: '100%',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--fill-soft)',
                borderRadius: '8px',
                border: '1.5px solid var(--rule-soft)',
                overflow: 'hidden',
                boxSizing: 'border-box',
                marginBottom: '8px',
                padding: '6px'
              }}
              title="Vascular Classification of FMD"
            >
              {renderSVG()}
            </div>

            <p className="education-evidence-limit">FMD can affect multiple arterial beds. The former generated mechanism image is unavailable; use the text and linked consensus source below.</p>

            {/* Section 1: Pathophysiology, Presentation &amp; Screening */}
            <div style={{border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%)', marginBottom: '8px'}}>
              <strong style={{color: 'var(--purple-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>1. Pathophysiology, Presentation &amp; Screening</strong>
              <div style={{display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.8fr', gap: '12px', fontSize: '7.8pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                <div>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Pathology &amp; Demographics</strong>
                  <br/>• <strong>Non-atherosclerotic, non-inflammatory</strong> vascular disease causing stenosis, dissection, aneurysm, or occlusion.
                  <br/>• <strong>Females</strong> account for <strong>80–90%</strong> of cases; typical onset age ranges between <strong>30–60 years</strong>.
                  <br/>• Cerebrovascular FMD is as common as renal FMD: among imaged beds, <strong>internal carotid (ICA)</strong> ~74%, <strong>renal</strong> ~70%, <strong>vertebral</strong> ~36%.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Clinical Presentation</strong>
                  <br/>• <strong>Pulsatile Tinnitus</strong>: "Whooshing" or beating sound in sync with heartbeat (reported in about 22–27% of patients with FMD).
                  <br/>• Neck pain, headache, carotid bruits, or lightheadedness.
                  <br/>• Neurological deficits due to <strong>cervical dissection (CeAD)</strong>, distal embolization, or hemodynamic insufficiency.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Systemic Screening</strong>
                  <br/>• <strong>Brain-to-Pelvis Screen</strong>: Mandatory <strong>one-time</strong> cross-sectional vascular imaging (CTA or MRA) of all arterial beds from head to pelvis.
                  <br/>• <strong>Aneurysms</strong>: Aneurysm at any site in ~17–22% of US Registry patients; intracranial aneurysm ~7% overall (13% of women in the US Registry), hence the one-time brain-to-pelvis screen.
                </div>
              </div>
            </div>

            {/* Section 2: Diagnosis &amp; Management Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', marginBottom: '8px'}}>
              {/* Section 2A: Diagnosis */}
              <div style={{border: '1.5px solid var(--teal)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--teal-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>2. Diagnostic Evaluation</strong>
                <ul style={{margin: '0', paddingLeft: '12px', fontSize: '7.8pt', lineHeight: '1.4', color: 'var(--ink-soft)'}}>
                  <li><strong>First Line (Cranial)</strong>: High-resolution <strong>CTA</strong> or <strong>MRA Head &amp; Neck</strong> to assess for beading, web-like stenoses, aneurysms, or dissections.</li>
                  <li><strong>Dissection Screening</strong>: Neck MRI with <strong>T1 fat-saturation</strong> to identify intramural hematoma.</li>
                  <li><strong>Duplex Ultrasound</strong>: Useful for proximal carotid surveillance; however, it cannot image distal cervical/intracranial FMD.</li>
                  <li><strong>Catheter angiography:</strong> generally reserved for intervention or selected diagnostic uncertainty when the result would alter management.</li>
                </ul>
              </div>

              {/* Section 2B: Management */}
              <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--red-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>3. Medical &amp; Endovascular Management</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                  <div>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Pharmacotherapy &amp; Counseling</strong>
                    <br/>• <strong>Antiplatelet Therapy</strong>: Single antiplatelet therapy (typically low-dose aspirin 75–100 mg daily) is reasonable, absent contraindication, for symptomatic and asymptomatic cerebrovascular FMD to potentially prevent thromboembolic complications (2019 International Consensus, expert-consensus based; no trial evidence).
                    <br/>• <strong>BP:</strong> individualize treatment for renovascular hypertension. ACE inhibitors or ARBs may be useful; monitor renal function and potassium, especially with bilateral renal artery disease.
                    <br/>• <strong>Activity:</strong> avoid high-risk cervical manipulation. Discuss contact sports, heavy lifting, traction and other activities individually, considering prior dissection and the affected arterial beds.
                  </div>
                  <div style={{borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px'}}>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Procedural Interventions</strong>
                    <br/>• <strong>Revascularization:</strong> consider only selected symptomatic or hemodynamically significant cases after specialist review; an isolated stenosis percentage is not an automatic indication.
                    <br/>• <strong>Angioplasty (PTA)</strong>: Percutaneous angioplasty <strong>WITHOUT stenting</strong> is the primary intervention for renal FMD, with stents reserved for bailout (e.g., flow-limiting dissection) or aneurysm treatment. For cervical FMD, evidence is limited: after FMD-related cervical dissection, stenting may be considered for recurrent ischemic events despite antithrombotic therapy, while dissecting aneurysms or residual post-dissection stenosis rarely require endovascular treatment.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Registry &amp; Cohort Data Table */}
            <div style={{border: '1.5px solid var(--amber)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%)', marginBottom: '6px'}}>
              <strong style={{color: 'var(--amber-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>4. Landmark Registry &amp; Cohort Insights</strong>
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.0pt', lineHeight: '1.25', color: 'var(--ink)'}}>
                <thead>
                  <tr style={{borderBottom: '1.5px solid var(--amber)', color: 'var(--amber-deep)', fontWeight: '700'}}>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '20%'}}>Registry / Cohort</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '25%'}}>Design &amp; Population</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '25%'}}>Vascular Distribution</th>
                    <th style={{padding: '2px 0', textAlign: 'left', width: '30%'}}>Key Clinical Findings &amp; Outcomes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{fontWeight: '700', padding: '2px 0', verticalAlign: 'top'}}><strong>US Registry for FMD</strong><br/>(Olin et al., 2012)</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>N = 447 patients across 9 US centers. Prospective observational registry.</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>• Carotid: 74.3%<br/>• Renal: 69.7%<br/>• Vertebral: 36.5%<br/>• Multivessel: 57.2%</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Demographics</strong>: 91% female, mean age at diagnosis 51.9 years (SD 13.4; range 5–83).
                      <br/>• <strong>Events at Diagnosis</strong>: TIA or stroke (19.2%), arterial dissection at any site (19.7%), aneurysm at any site (17%).
                      <br/>• <strong>Delay</strong>: Average of <strong>4.8 years</strong> from first symptom to diagnosis.
                    </td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: '700', padding: '2px 0', verticalAlign: 'top'}}><strong>FEIRI Registry</strong><br/>(Pappaccogli et al., 2021)</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>N = 1,022 patients from 22 countries; 82% women; age at diagnosis 46 ± 16 y.</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>• Multifocal FMD: 72%<br/>• Multivessel: 57%<br/>• Hypertensive: 86%<br/>• Caucasian: 88%</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Subtype Differences</strong>: Versus multifocal FMD, focal FMD patients were younger, more often men, with less multivessel disease but more revascularization.
                      <br/>• <strong>Aneurysms/Dissections</strong>: Aneurysm predicted by multivessel and multifocal FMD; dissection predicted by age at diagnosis, male sex, stroke, and multivessel FMD.
                    </td>
                  </tr>
                </tbody>
              </table></div>
            </div>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'FMD Scientific Statement', cite: 'Olin JW et al. Circulation. 2014;129(9):1048-1078.', pmid: '24548843' },
              { label: 'First International Consensus', cite: 'Gornik HL et al. Vasc Med. 2019;24(2):164-189.', pmid: '30648921' },
              { label: 'US Registry for FMD', cite: 'Olin JW et al. Circulation. 2012;125(25):3182-3190.', pmid: '22615343' },
              { label: 'FEIRI Registry', cite: 'Pappaccogli M et al. Cardiovasc Res. 2021;117(3):950-959.', pmid: '32282921' },
              { label: 'TREAT-CAD Trial', cite: 'Engelter ST et al. Lancet Neurol. 2021;20(5):341-350.', pmid: '33765420' },
              { label: 'STOP-CAD Study', cite: 'Yaghi S et al. Stroke. 2024;55(4):908-918.', pmid: '38335240' },
              { label: 'Kaufmann IPD Meta-analysis', cite: 'Kaufmann JE et al. JAMA Neurol. 2024;81(6):630-637.', pmid: '38739383' },
            ]} />
          </div>
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

const BrainDeathView = () => {
  return (
    <PdfActionBar
      title="Brain Death Determination"
      subtitle="BD/DNC Consensus Guidelines Reference Card"
      pdfPath="documents/references/Brain Death Guidelines.pdf"
      pdfName="Brain Death Guidelines.pdf"
      iconColorClass="text-crit-600 dark:text-crit-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <BrainDeathCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function BrainDeathCard() {
  const [lightboxImage, setLightboxImage] = useState(null);

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-brain-death">
        <div className="card-container" style={{boxSizing: 'border-box', height: '1275px'}}>
          <div className="card-content" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Brain Death Determination (BD/DNC)</h1>
            <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
              AAN/AAP/CNS/SCCM 2023 Pediatric &amp; Adult Consensus Guideline Reference.
            </p>

            {/* SVG Visual Pathway */}
            <svg viewBox="0 0 735 90" role="img" focusable="false" aria-label="Brain death determination: prerequisites, clinical examination sequence, apnea testing, and ancillary studies" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
              <rect x="0" y="0" width="735" height="90" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>

              {/* Step 1 */}
              <rect x="15" y="15" width="145" height="60" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
              <text x="87.5" y="32" fill="var(--teal-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">1. PREREQUISITES</text>
              <text x="87.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Permanent Coma</text>
              <text x="87.5" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Temp ≥36°C | Hemodyn OK</text>

              {/* Arrow 1 */}
              <path d="M 160 45 L 190 45" stroke="var(--purple)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-bd)" />

              {/* Step 2 */}
              <rect x="190" y="15" width="145" height="60" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.5" />
              <text x="262.5" y="32" fill="var(--purple-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">2. CLINICAL EXAM</text>
              <text x="262.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">No Brain-Mediated Response</text>
              <text x="262.5" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Absent Brainstem Reflexes</text>

              {/* Arrow 2 */}
              <path d="M 335 45 L 365 45" stroke="var(--purple)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-bd)" />

              {/* Step 3 */}
              <rect x="365" y="15" width="145" height="60" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="437.5" y="32" fill="var(--amber-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">3. APNEA TESTING</text>
              <text x="437.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Absence of Resp Drive</text>
              <text x="437.5" y="60" fill="var(--ink-soft)" fontSize="5pt" fontFamily="IBM Plex Sans" textAnchor="middle">PaCO2 ≥60, Δ≥20; pH &lt;7.30</text>

              {/* Arrow 3 */}
              <path d="M 510 45 L 540 45" stroke="var(--purple)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-bd)" />

              {/* Step 4 */}
              <rect x="540" y="15" width="180" height="60" rx="6" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="630" y="32" fill="var(--red-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">4. ANCILLARY TESTING</text>
              <text x="630" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Only if exam or apnea test</text>
              <text x="630" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">cannot be completed/concluded</text>

              <defs>
                <marker id="arrow-bd" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--purple)" />
                </marker>
              </defs>
            </svg>

            {/* Historical image omitted: its PaCO2 OR threshold predates 2023. */}
            {/* Grid for Prerequisites & Exam */}
            <div className="toast-grid" style={{marginBottom: '10px'}}>
              {/* Column 1: Prerequisites & Stability */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card primary" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--purple-deep)', marginBottom: '3px'}}>1. Prerequisites &amp; Stability</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Etiology:</strong> Catastrophic, permanent brain injury with a known cause and concordant imaging. Primary posterior fossa injury requires imaging evidence of catastrophic supratentorial injury.</li>
                    <li><strong>Age/observation:</strong> Do not evaluate below 37 weeks corrected gestational age. Under 24 months: wait ≥48 h after acute injury; age ≥24 months after hypoxic-ischemic injury: ≥24 h. Other injuries/interventions require sufficient observation for permanence.</li>
                    <li><strong>Core Temp:</strong> <strong>&ge; 36.0°C (96.8°F)</strong>. Warm if hypothermic.</li>
                    <li><strong>Hemodynamics:</strong>
                      <br/>• Adults: SBP <strong>&ge; 100 mmHg</strong> <strong>and</strong> MAP <strong>&ge; 75 mmHg</strong> (2023 AAN/AAP/CNS/SCCM)
                      <br/>• Children: <strong>SBP and MAP ≥5th percentile for age</strong>; use the guideline age table. Individualize for a substantially different known chronic baseline.
                    </li>
                    <li><strong>Exclusions:</strong> Exclude intoxication and CNS depressants using levels when available; if unavailable, allow ≥5 half-lives, longer with impaired clearance, obesity, or hypothermia. Pentobarbital must be &lt;5 μg/mL or undetectable. Exclude paralysis with train-of-four or preserved deep tendon reflexes.</li>
                    <li><strong>Metabolic:</strong> Correct severe endocrine or electrolyte derangements.</li>
                  </ul>
                </div>

                <div className="toast-card secondary" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '3px'}}>2. Neurological Examination</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Coma:</strong> Complete absence of arousal. No motor responses to pain (spinal reflexes like triple flexion allowed).</li>
                    <li><strong>Pupils:</strong> No response to bright light in either eye; a fixed pupil diameter is not a criterion.</li>
                    <li><strong>Corneal Reflex:</strong> No blink to cotton swab contact.</li>
                    <li><strong>Ocular reflex testing:</strong> follow the complete current BD/DNC checklist. Oculocephalic testing requires cervical-spine and skull-base integrity; do not perform a head-turn maneuver when these are uncertain.</li>
                    <li><strong>Oculovestibular testing:</strong> use the full approved technique, including ear/skull-base safety, head position, irrigation duration and bilateral timing. Procedural mini-instructions are intentionally omitted here; consult the 2023 guideline supplemental checklist and correction.</li>
                    <li><strong>Gag &amp; Cough:</strong> Absent gag (pharyngeal stim) and cough (tracheal suction catheter stim).</li>
                    <li><strong>Facial Motor:</strong> No grimace to TMJ or supraorbital pressure.</li>
                    <li><strong>Infants &lt;6 months:</strong> No sucking or rooting reflex.</li>
                  </ul>
                </div>
              </div>

              {/* Column 2: Apnea Testing & Ancillary Testing */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card alert-orange" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--amber-deep)', marginBottom: '3px'}}>3. Apnea Testing Protocol</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Preparation:</strong> Correct hypoxemia, hypotension and hypovolemia. Preoxygenate with 100% O2 ≥10 min to PaO2 &gt;200 mmHg; obtain baseline ABG. Without chronic hypercarbia, PaCO2 35–45 and pH 7.35–7.45.</li>
                    <li><strong>Oxygenation:</strong> Stop mandatory breaths and provide 100% O2 by ventilator CPAP or a flow-inflating bag with functioning PEEP valve. Adult tracheal oxygen-insufflation technique differs; follow the full guideline and local checklist.</li>
                    <li><strong>Chronic hypercarbia:</strong> Start at the known chronic baseline PaCO2. If suspected but baseline unknown, use the estimated baseline and require ancillary testing even if apnea criteria are reached.</li>
                    <li><strong>ECMO:</strong> Use the specialist protocol in recommendation 26, including cannula-specific ABG sampling. For VA ECMO, both patient and postoxygenator PaCO2/pH must meet criteria.</li>
                    <li><strong>Observation/target:</strong> No spontaneous breaths; ABG at 8–10 min. PaCO2 <strong>≥60 mmHg AND ≥20 above baseline</strong> (known chronic baseline if hypercarbic), and <strong>pH &lt;7.30</strong>. Unmet targets require guideline-directed continuation/repeat or ancillary testing.</li>
                  </ul>
                  <div style={{marginTop: '4px', borderTop: '1px dashed rgba(217,134,11,0.3)', paddingTop: '4px', fontSize: '7.6pt', color: 'var(--red-deep)', lineHeight: '1.3'}}>
                    <strong>Abort:</strong> Any spontaneous breath means BD/DNC criteria are not met. Also stop for:
                    <br/>• Adult SBP &lt;100 or MAP &lt;75; child SBP or MAP &lt;5th percentile despite support.
                    <br/>• Progressive oxygen-saturation decline below 85%.
                    <br/>• Arrhythmia with hemodynamic instability.
                    <br/>If instability makes abortion imminent, obtain an ABG before reconnecting when feasible; do not delay rescue.
                  </div>
                </div>

                <div className="toast-card alert-red" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '3px'}}>4. Ancillary Testing Guidelines</h3>
                  <p style={{fontSize: '7.6pt', color: 'var(--ink-soft)', marginBottom: '4px', lineHeight: '1.3'}}>
                    Use for an incomplete/uninterpretable exam or apnea test, or specified situations such as uncorrectable metabolic confounders. Complete all assessable elements. <strong>Do not bypass hypothermia, high sedative levels, or any brain-mediated activity with an ancillary test.</strong>
                  </p>
                  <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '8px', fontSize: '7.6pt', lineHeight: '1.3'}}>
                    <div>
                      <strong style={{color: 'var(--teal-deep)', fontSize: '7.6pt', textTransform: 'uppercase', display: 'block', marginBottom: '2px'}}>Accepted Tests</strong>
                      • <strong>Conventional 4-Vessel DSA:</strong> Confirms absence of intracerebral blood flow.<br/>
                      • <strong>Radionuclide Perfusion:</strong> SPECT or planar radionuclide angiography using guideline-appropriate tracers.<br/>
                      • <strong>TCD:</strong> (Transcranial Doppler) <strong>Adults only</strong>; must show oscillating flow or spikes.
                    </div>
                    <div>
                      <strong style={{color: 'var(--red-deep)', fontSize: '7.6pt', textTransform: 'uppercase', display: 'block', marginBottom: '2px'}}>Unacceptable Tests</strong>
                      <span style={{color: 'var(--red-deep)', fontWeight: '600'}}>• EEG: NO LONGER ACCEPTED</span> (cannot evaluate brainstem).<br/>
                      <span style={{color: 'var(--red-deep)', fontWeight: '600'}}>• CTA: NOT ACCEPTABLE</span> (insufficient validation).<br/>
                      • MRI/MRA: Not accepted.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Alert Box */}
            <div style={{borderLeft: '4px solid var(--purple)', background: 'var(--purple-soft)', padding: '10px 12px', borderRadius: '6px', fontSize: '9.2pt', marginBottom: '12px'}}>
              <strong style={{color: 'var(--purple-deep)', textTransform: 'uppercase', fontSize: '8.8pt', letterSpacing: '0.05em', display: 'block', marginBottom: '3px'}}>BD/DNC Documentation &amp; Repeat Exam Requirements</strong>
              <div className="checklist-grid" style={{fontSize: '7.8pt', gap: '4px 10px'}}>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Adults:</strong> Minimum one examination and one apnea test after the final examination; follow local policy and applicable law.</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Pediatrics:</strong> Two independent exams at least 12 hours apart, each followed by an apnea test (2023 guideline).</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Rewarming Period:</strong> If core temperature was ≤35.5°C, wait ≥24 hours after rewarming to ≥36°C before evaluation.</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Time of Death:</strong> When final apnea-test ABG results are reported meeting both PaCO2 and pH criteria, with the clinical criteria met. If ancillary testing is required, use the time the attending documents a result consistent with BD/DNC.</div>
                </div>
              </div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '8px 10px', fontSize: '8.2pt', lineHeight: '1.3'}}>
              <strong>Consensus Guideline:</strong> Greer DM, et al. Pediatric and Adult Brain Death/Death by Neurologic Criteria Consensus Guideline. <em>Neurology</em>. 2023;101(24):1112-1132. <a href="https://pubmed.ncbi.nlm.nih.gov/37821233/" target="_blank">PMID: 37821233</a>.<br/>
              <strong>AAN 2010 Guideline (prior; updated by 2023 BD/DNC consensus guideline):</strong> Wijdicks EF, et al. Evidence-based guideline update: determining brain death in adults. <em>Neurology</em>. 2010;74(23):1911-1918. <a href="https://pubmed.ncbi.nlm.nih.gov/20530327/" target="_blank">PMID: 20530327</a>. (Found insufficient evidence on newer ancillary tests; the Section 4 accept/reject criteria follow the 2023 consensus guideline.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AntiepilepticDrugsView = () => {
  return (
    <PdfActionBar
      title="Antiepileptic Drugs &amp; Post-Stroke Seizures"
      subtitle="Antiseizure Medication (ASM) Selection &amp; Reference Card"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <AntiepilepticDrugsCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function AntiepilepticDrugsCard() {
  const [lightboxImage, setLightboxImage] = useState(null);

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-antiepileptic-drugs">
        <div className="card-container" style={{boxSizing: 'border-box', height: '1275px'}}>
          <div className="card-content" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Antiseizure Medications (ASMs) &amp; Stroke</h1>
            <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
              AHA/ASA 2026 Acute Stroke &amp; 2022 ICH Guidelines Reference Card.
            </p>

            {/* SVG Visual Pathway */}
            <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2"><strong>Key clinical boundaries</strong><p>Treat confirmed seizures in clinical context. Routine prophylaxis is not a default after ischemic stroke or ICH. In aSAH, the 2026 NCS guideline supports individualized prophylaxis and duration with conditional recommendations. Drug choice and monitoring depend on seizure versus status epilepticus, renal/hepatic function and interactions; this card is not a dosing order.</p></aside>

            {/* Grid for Seizure Classification & Risk Scores */}
            <div className="toast-grid" style={{marginBottom: '10px'}}>
              {/* Column 1: Classification & Prophylaxis */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card primary" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--purple-deep)', marginBottom: '3px'}}>1. Seizure Classification &amp; Prophylaxis</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.6pt', lineHeight: '1.35'}}>
                    <li><strong>Early Seizure (Acute Symptomatic):</strong> Occurs <strong>&le; 7 days</strong> of stroke. Caused by local tissue injury, excitotoxicity. Recurrence risk differs from that after a remote unprovoked seizure and depends on seizure type and the underlying lesion; no single early-versus-late percentage applies to every patient. Early seizure contributes 3 points in the original SeLECT model. Routine prophylaxis is <strong>NOT recommended</strong>.</li>
                    <li><strong>Remote unprovoked seizure:</strong> a seizure more than seven days after stroke may support post-stroke epilepsy when attributable to the remote lesion and after other acute causes are excluded. Timing alone does not mandate indefinite treatment; discuss recurrence risk and treatment with the clinical team.</li>
                    <li><strong>AHA/ASA Prophylaxis Guidelines:</strong>
                      <br/>• <strong>AIS &amp; ICH:</strong> Routine ASM prophylaxis is <strong>not recommended</strong> (Class III).
                      <br/>• <strong>aSAH:</strong> Routine prophylaxis is <strong>not beneficial</strong> (Class III); however, prophylactic ASM <em>may</em> be reasonable with high-seizure-risk features (ruptured MCA aneurysm, high-grade SAH, ICH, hydrocephalus, or cortical infarction) (Class IIb, 2023 AHA/ASA); the 2026 NCS guideline conditionally allows ASM or no ASM and, if used, a short (&le;3 days) or long (&gt;3 days) course.
                    </li>
                    <li><strong>After an acute symptomatic seizure:</strong> treat the event and individualize the subsequent regimen. A brief seizure, recurrent seizures and status epilepticus carry different recurrence risks; EEG, cortical injury and clinical course inform duration. A universal early taper or lifelong-treatment rule is inappropriate.</li>
                  </ul>
                </div>

                <div className="toast-card secondary" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '3px'}}>2. Continuous EEG (cEEG) Indications</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.6pt', lineHeight: '1.35'}}>
                    <li><strong>ICH &amp; aSAH:</strong> cEEG (&ge;24h) is reasonable for unexplained or fluctuating mental status, or clinical suspicion of seizures (Class IIa).</li>
                    <li><strong>AIS:</strong> Indicated for fluctuating neuro deficits not explained by perfusion, or suspicion of non-convulsive status epilepticus.</li>
                  </ul>
                </div>
              </div>

              {/* Column 2: Risk Stratification Scores */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card neutral" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--slate)', marginBottom: '3px'}}>3. SeLECT Prognostic Score</h3>
                  <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', fontSize: '7.2pt', borderCollapse: 'collapse', marginBottom: '4px', lineHeight: '1.2'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                        <th style={{textAlign: 'left', padding: '2px 0'}}>Clinical Variable</th>
                        <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>Se</strong> - Severity (NIHSS: &ge;11 = 2, 4-10 = 1, 0-3 = 0)</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>0–2</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>L</strong> - Large-artery atherosclerosis</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>1</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>E</strong> - Early seizures (&le; 7 days)</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>3</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>C</strong> - Cortical lesion involvement</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>2</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>T</strong> - Territory of MCA involvement</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>1</strong></td>
                      </tr>
                    </tbody>
                  </table></div>
                  <div style={{fontSize: '7.2pt', borderTop: '1px dashed rgba(74,90,109,0.3)', paddingTop: '4px', lineHeight: '1.2'}}>
                    <strong>Interpretation:</strong> Score 0 (1.3% risk at 5yr), intermediate scores carry progressively higher risk, Score 9 (83% risk at 5yr).
                  </div>
                </div>
              </div>
            </div>

            {/* Antiseizure Medications (ASMs) Selection Table */}
            <div className="toast-card alert-red" style={{padding: '8px 10px', display: 'flex', flexDirection: 'column', flexGrow: 1}}>
              <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '4px', textAlign: 'center'}}>4. Clinical ASM Comparison Matrix</h3>
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table style={{width: '100%', fontSize: '7.4pt', borderCollapse: 'collapse', textAlign: 'left', lineHeight: '1.3'}}>
                <thead>
                  <tr style={{borderBottom: '1.5px solid var(--rule)', color: 'var(--ink)'}}>
                    <th style={{padding: '4px', width: '15%'}}>ASM (Brand)</th>
                    <th style={{padding: '4px', width: '22%'}}>Prescribing context</th>
                    <th style={{padding: '4px', width: '15%'}}>Clearance</th>
                    <th style={{padding: '4px', width: '25%'}}>Drug Interactions</th>
                    <th style={{padding: '4px', width: '23%'}}>Key Adverse Effects</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Levetiracetam</strong><br/>(Keppra)</td>
                    <td style={{padding: '4px'}}>Use the complete indication-specific regimen, including administration, monitoring and organ-function adjustment.</td>
                    <td style={{padding: '4px'}}>Renal excretion<br/><span style={{color: 'var(--red)'}}>(Adjust for GFR)</span></td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}>Limited CYP metabolism; review renal dosing, adverse effects and the complete interaction profile.</td>
                    <td style={{padding: '4px'}}>Irritability, agitation ("Kepprage"), somnolence.</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Lamotrigine</strong><br/>(Lamictal)</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>No acute load (PO only)</span><br/>Use the indication- and interaction-specific prescribing schedule.</td>
                    <td style={{padding: '4px'}}>Hepatic glucuronidation</td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}>Review the indication, comedications and current prescribing information; limited interactions do not establish universal safety.</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>SJS/TEN severe rash</span> (linked to rapid titration).</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Lacosamide</strong><br/>(Vimpat)</td>
                    <td style={{padding: '4px'}}>Use the complete indication-specific regimen, including administration, monitoring and organ-function adjustment.</td>
                    <td style={{padding: '4px'}}>Renal &amp; Hepatic</td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}>Review the indication, comedications and current prescribing information; limited interactions do not establish universal safety.</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>PR prolongation</span>, AV block (ECG baseline!), dizziness.</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Valproic Acid</strong><br/>(Depakote)</td>
                    <td style={{padding: '4px'}}>Use the complete indication-specific regimen, including administration, monitoring and organ-function adjustment.</td>
                    <td style={{padding: '4px'}}>Hepatic metabolism</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>Enzyme Inhibitor:</span> Increases levels of other drugs.</td>
                    <td style={{padding: '4px'}}>Thrombocytopenia, hyperammonemia, hepatotoxicity.</td>
                  </tr>
                  <tr>
                    <td style={{padding: '4px'}}><strong>Phenytoin</strong><br/>(Dilantin)</td>
                    <td style={{padding: '4px'}}>Use the complete indication-specific regimen, including administration, monitoring and organ-function adjustment.</td>
                    <td style={{padding: '4px'}}>Hepatic metabolism<br/>(Saturable kinetics)</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>Strong CYP Inducer:</span> Can reduce exposure to susceptible drugs, including some anticoagulants and statins; check the exact combination and current label.</td>
                    <td style={{padding: '4px'}}>Ataxia and chronic dental/bone effects; IV use also carries serious cardiovascular risk and requires continuous monitoring under the full prescribing protocol.</td>
                  </tr>
                </tbody>
              </table></div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px 0 10px', fontSize: '8.2pt', lineHeight: '1.25', borderTop: '1px solid var(--rule-soft)'}}>
              <strong>AIS Guidelines:</strong> Prabhakaran S et al. Stroke. 2026. <a href="https://pubmed.ncbi.nlm.nih.gov/41582814/" target="_blank">PMID: 41582814</a>. | <strong>ICH Guidelines:</strong> Greenberg SM et al. Stroke. 2022. <a href="https://pubmed.ncbi.nlm.nih.gov/35579034/" target="_blank">PMID: 35579034</a>.<br/>
              <strong>SeLECT Score:</strong> Galovic M et al. Lancet Neurol. 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29413315/" target="_blank">PMID: 29413315</a>.
            </div>
          </div>
        </div>
      </div>
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}



// =====================================================================
// SHARED HELPERS — 2026 NEUROVASCULAR TEACHING CARD SET
// (color-coded bordered sections + citation footer, reused across the
//  static pocket cards below so they render identically to the
//  FibromuscularDysplasia / BrainDeath gold-standard templates)
// =====================================================================
const CARD_SECTION_COLORS = {
  purple: { base: 'var(--purple)', deep: 'var(--purple-deep)', soft: 'var(--purple-soft)' },
  teal:   { base: 'var(--teal)',   deep: 'var(--teal-deep)',   soft: 'var(--teal-soft)' },
  red:    { base: 'var(--red)',    deep: 'var(--red-deep)',    soft: 'var(--red-soft)' },
  amber:  { base: 'var(--amber)',  deep: 'var(--amber-deep)',  soft: 'var(--amber-soft)' },
  slate:  { base: 'var(--slate)',  deep: 'var(--slate-deep)',  soft: 'var(--slate-soft)' },
};

function CardSection({ color = 'purple', title, subtitle, children, style }) {
  const c = CARD_SECTION_COLORS[color] || CARD_SECTION_COLORS.purple;
  return (
    <div style={{ border: `1.5px solid ${c.base}`, borderRadius: '8px', padding: '8px 10px', background: `linear-gradient(135deg, ${c.soft} 0%, #ffffff 100%)`, marginBottom: '8px', ...style }}>
      <strong style={{ color: c.deep, fontSize: '9.5pt', display: 'block', marginBottom: subtitle ? '1px' : '4px' }}>{title}</strong>
      {subtitle && <div style={{ color: 'var(--ink-mute)', fontSize: '7pt', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{subtitle}</div>}
      {children}
    </div>
  );
}

const pubmedUrl = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

function CardRefFooter({ refs, style }) {
  return (
    <div className="ref-citation education-source-list" style={{ marginTop: 'auto', padding: '6px 10px', fontSize: '7.4pt', lineHeight: '1.3', ...style }}>
      {refs.map((r, i) => (
        <span key={`${r.pmid}-${i}`}>
          <strong>{r.label}:</strong> {r.cite}{' '}
          <a href={pubmedUrl(r.pmid)} target="_blank" rel="noopener noreferrer">PMID: {r.pmid}</a>
          {i < refs.length - 1 ? <br /> : null}
        </span>
      ))}
    </div>
  );
}

// =====================================================================
// MODULE — Cerebral Venous Sinus Thrombosis (CVST)
// =====================================================================
const CvstView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <CvstCard />
  </ScaledCardWrapper>
);

export function CvstCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cerebral-venous-sinus-thrombosis">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Cerebral Venous Sinus Thrombosis</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Dural sinus &amp; deep venous system thrombosis &mdash; diagnosis, anticoagulation, and outcome.
            </p>

            {/* Hero SVG: dural venous sinus map + venous-infarct inset */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 455 170" role="img" focusable="false" aria-label="Dural Venous Sinus Sagittal Map and Deep Venous System Diagram" style={{ width: '100%', height: 'auto' }}>
                {/* ---- Left: sagittal dural sinus map ---- */}
                <text x="245" y="16" fill="var(--ink-soft)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">DURAL SINUS SCHEMATIC (SAGITTAL)</text>
                {/* faint head silhouette, occiput to the right */}
                <path d="M 70 120 C 55 60, 120 24, 250 24 C 360 24, 430 55, 430 100 C 430 130, 400 150, 360 150 L 350 150 C 350 138, 345 132, 335 132 L 120 132 C 92 132, 74 128, 70 120 Z" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                {/* Superior sagittal sinus (SSS) — over the convexity to the torcula */}
                <path d="M 96 116 C 78 66, 140 40, 250 38 C 340 37, 402 62, 408 104" stroke="var(--teal)" strokeWidth="6" fill="none" strokeLinecap="round" />
                <text x="210" y="54" fill="var(--teal-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Superior sagittal sinus</text>
                {/* Deep venous system: internal cerebral veins → vein of Galen */}
                <path d="M 180 96 L 250 100" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="258" cy="101" r="4" fill="var(--purple)" />
                <text x="176" y="90" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Internal cerebral vv.</text>
                <text x="286" y="95" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Vein of Galen</text>
                {/* Straight sinus: vein of Galen → torcula */}
                <path d="M 262 102 L 404 108" stroke="var(--purple)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <text x="330" y="99" fill="var(--purple-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Straight sinus</text>
                {/* Torcula (confluence of sinuses) */}
                <circle cx="408" cy="106" r="6" fill="var(--teal-deep)" />
                <text x="417" y="99" fill="var(--ink-mute)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="start">Torcula</text>
                {/* Transverse → sigmoid sinus (THROMBOSED segment, red) */}
                <path d="M 408 108 C 400 128, 378 138, 356 140" stroke="var(--red)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="2 4" />
                {/* clot bulge */}
                <ellipse cx="384" cy="132" rx="11" ry="7" fill="var(--red)" opacity="0.85" transform="rotate(28 384 132)" />
                <text x="384" y="160" fill="var(--red-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Thrombosed transverse / sigmoid sinus</text>

              </svg>
            </div>

            {/* §1 Presentation & risk factors (purple) */}
            <CardSection color="purple" title="1. Presentation & Risk Factors">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.9fr', gap: '12px', fontSize: '7.7pt', lineHeight: '1.38', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '8pt' }}>Clinical syndromes</strong>
                  <br />&bull; <strong>Isolated intracranial hypertension</strong>: headache &plusmn; papilledema, VI-nerve palsy.
                  <br />&bull; <strong>Focal deficits / seizures</strong> from venous infarction.
                  <br />&bull; <strong>Encephalopathy</strong> (deep venous system).
                  <br />&bull; Headache is the most common symptom (~90%) and can be the <em>only</em> symptom.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '8pt' }}>Risk factors (~85% have ≥1)</strong>
                  <br />&bull; <strong>Prothrombotic</strong>: pregnancy / puerperium, estrogen / OCP, inherited thrombophilia, malignancy, APS.
                  <br />&bull; <strong>Local</strong>: sinusitis, mastoiditis, meningitis, trauma, LP.
                  <br />&bull; <strong>Systemic</strong>: dehydration, IBD, nephrotic syndrome.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '8pt' }}>Pitfall</strong>
                  <br />A <strong>normal D-dimer does NOT exclude CVST</strong>, especially with isolated headache or a subacute course. <strong>Image if suspected.</strong>
                </div>
              </div>
            </CardSection>

            {/* §2 Diagnosis (teal) */}
            <CardSection color="teal" title="2. Diagnosis">
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                <li><strong>First-line imaging</strong>: CT venography (CTV) or MR venography (MRV).</li>
                <li>Non-contrast CT signs (cord sign, dense triangle) are <strong>insensitive</strong>; the <strong>empty-delta sign</strong> appears on post-contrast CT. MRI T2*/SWI shows thrombus + parenchymal change.</li>
                <li><strong>Trigger venous imaging</strong> when an infarct crosses arterial boundaries, is hemorrhagic, or is bilateral parasagittal / thalamic.</li>
              </ul>
            </CardSection>

            {/* §3 Acute management (red) */}
            <CardSection color="red" title="3. Acute Management">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.38', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '8pt' }}>Anticoagulate — even with venous hemorrhage</strong>
                  <br />&bull; Therapeutic <strong>LMWH</strong> (or UFH) is first-line; hemorrhage from venous congestion is <strong>not a contraindication</strong> (ISCVT).
                  <br />&bull; <strong>Oral treatment:</strong> choose the agent and duration from recurrence risk, provoking factors, pregnancy/breastfeeding, APS, kidney function and the acute heparin phase. RE-SPECT CVT was a small exploratory randomized comparison; ACTION-CVT’s lower major-bleeding association with DOACs was observational. Neither proves universal equivalence or a fixed duration for all patients.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '8pt' }}>Endovascular / surgical</strong>
                  <br />&bull; <strong>Thrombectomy is NOT routine</strong> — TO-ACT stopped for futility; reserve for deterioration despite anticoagulation (individualized).
                  <br />&bull; <strong>Decompressive craniectomy</strong> is life-saving for large venous infarct with impending herniation.
                  <br />&bull; Treat seizures and assess raised intracranial pressure. Lumbar puncture requires herniation-risk and anticoagulation safety assessment; mass effect is not a reason to use a merely smaller puncture.
                </div>
              </div>
            </CardSection>

            {/* §4 Prognosis (amber) */}
            <CardSection color="amber" title="4. Prognosis" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--amber-deep)' }}>ISCVT:</strong> approximately 13% dead or dependent at median 16-month follow-up; this is a cohort estimate, not a matched comparison with arterial stroke.
                <br /><strong style={{ color: 'var(--amber-deep)' }}>Predictors of poor outcome:</strong> coma / altered mental status, deep venous system thrombosis, intracranial hemorrhage, malignancy, CNS infection, male sex, older age.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'ISCVT', cite: 'Ferro JM et al. Stroke. 2004;35(3):664-670.', pmid: '14976332' },
              { label: 'RE-SPECT CVT', cite: 'Ferro JM et al. JAMA Neurol. 2019;76(12):1457-1465.', pmid: '31479105' },
              { label: 'ACTION-CVT', cite: 'Yaghi S et al. Stroke. 2022;53(3):728-738.', pmid: '35143325' },
              { label: 'TO-ACT', cite: 'Coutinho JM et al. JAMA Neurol. 2020;77(8):966-973.', pmid: '32421159' },
              { label: 'AHA Scientific Statement 2024', cite: 'Saposnik G et al. Stroke. 2024;55(3):e77-e90.', pmid: '38284265' },
              { label: 'AHA/ASA Statement 2011', cite: 'Saposnik G et al. Stroke. 2011;42(4):1158-1192.', pmid: '21293023' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Large-Core Thrombectomy
// =====================================================================
const LargeCoreThrombectomyView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <LargeCoreThrombectomyCard />
  </ScaledCardWrapper>
);

export function LargeCoreThrombectomyCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  const trials = [
    { t: 'RESCUE-Japan LIMIT', pop: 'ASPECTS 3–5', res: 'mRS 0–3: 31% vs 13% with EVT' },
    { t: 'SELECT2', pop: 'ASPECTS 3–5 or core ≥50 mL', res: 'mRS 0–2: 20% vs 7%; positive mRS shift' },
    { t: 'ANGEL-ASPECT', pop: 'ASPECTS 3–5 or core 70–100 mL', res: 'mRS 0–2: 30% vs 12%; positive mRS shift' },
    { t: 'TENSION', pop: 'ASPECTS 3–5', res: 'mRS 0–3 higher with EVT; positive shift' },
    { t: 'LASTE', pop: 'ASPECTS 0–5 (incl. <3)', res: 'EVT benefit on the mRS distribution' },
    { t: 'TESLA', pop: 'ASPECTS 2–5', res: 'Utility-weighted mRS favored EVT (posterior probability 0.96) but did NOT reach the pre-set 0.975 Bayesian threshold' },
  ];
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-large-core-thrombectomy">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Large-Core Thrombectomy</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              EVT for large ischemic core (low ASPECTS / large core volume) &mdash; the 2022&ndash;2024 evidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
              <p className="education-evidence-limit">Perfusion estimates describe predicted core and potentially salvageable tissue; they do not independently establish EVT eligibility. DAWN and DEFUSE 3 used distinct clinical, occlusion, imaging and time-window criteria.</p>
              <p className="education-evidence-limit">ASPECTS subtracts one point for each affected region on noncontrast CT. Use validated imaging examples and formal training; this card does not provide an image-reading substitute.</p>
            </div>

            {/* §1 The question (purple) */}
            <CardSection color="purple" title="1. The Question">
              <div style={{ fontSize: '7.9pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                Historically EVT required a <strong>small core (ASPECTS ≥6)</strong>. Six 2022&ndash;2024 RCTs tested EVT for a <strong>large ischemic core</strong> (low ASPECTS or large core volume). All pointed toward a functional-outcome benefit — five met their primary endpoint; <strong>TESLA missed its Bayesian threshold but trended favorably</strong>. The ATLAS IPD meta-analysis pooling all six (PMID: 42107392) found <strong>no significant sICH excess vs medical management (1.1% vs 1.0%)</strong>.
              </div>
            </CardSection>

            {/* §2 The trials (teal) */}
            <CardSection color="teal" title="2. The Trials (2022–2024)">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7.4pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '120px' }}>Trial</th>
                    <th style={{ width: '160px' }}>Population</th>
                    <th>Key result</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((r) => (
                    <tr key={r.t}>
                      <td><strong>{r.t}</strong></td>
                      <td>{r.pop}</td>
                      <td>{r.res}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Bottom line & caveats (red) */}
            <CardSection color="red" title="3. Bottom Line & Caveats" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li>EVT is now recommended for <strong>selected large-core patients</strong> (meeting the applicable clinical, occlusion, ASPECTS/core, age and time-window criteria; perfusion mismatch was not mandatory in every trial) — reflected in the 2026 AHA/ASA AIS guideline. Benefit is mainly a <strong>shift toward less disability</strong>; independence (mRS 0–2) also increases but is reached by a minority (e.g., 20% vs 7% in SELECT2).</li>
                <li>ATLAS also showed a <strong>mortality benefit with EVT</strong> (aRR 0.82; 95% CI 0.70–0.97; p=0.022) and <strong>no significant sICH excess</strong> vs medical management (1.1% vs 1.0%).</li>
                <li>ATLAS (Sarraj, Lancet 2026;407:2015-26; PMID: 42107392) — an IPD meta-analysis of six trials (RESCUE-Japan LIMIT, ANGEL-ASPECT, SELECT2, TENSION, TESLA, LASTE) — found benefit <strong>consistent across ASPECTS/core strata</strong> EXCEPT estimated core <strong>≥150 mL presenting beyond 6 h</strong>, where evidence is limited (wide CIs; point estimates still favored EVT) — <strong>individualize</strong> there.</li>
              </ul>
            </CardSection>

            <CardRefFooter style={{ fontSize: '7pt' }} refs={[
              { label: 'SELECT2', cite: 'Sarraj A et al. N Engl J Med. 2023;388(14):1259-1271.', pmid: '36762865' },
              { label: 'ANGEL-ASPECT', cite: 'Huo X et al. N Engl J Med. 2023;388(14):1272-1283.', pmid: '36762852' },
              { label: 'TENSION', cite: 'Bendszus M et al. Lancet. 2023;402(10414):1753-1763.', pmid: '37837989' },
              { label: 'LASTE', cite: 'Costalat V et al. N Engl J Med. 2024;390(18):1677-1689.', pmid: '38718358' },
              { label: 'TESLA', cite: 'Yoo AJ et al. JAMA. 2024;332(16):1355-1366.', pmid: '39374319' },
              { label: 'RESCUE-Japan LIMIT', cite: 'Yoshimura S et al. N Engl J Med. 2022;386(14):1303-1313.', pmid: '35138767' },
              { label: '2026 AIS Guideline', cite: 'Prabhakaran S et al. Stroke. 2026.', pmid: '41582814' },
              { label: 'ATLAS IPD Meta-analysis', cite: 'Sarraj A et al. Lancet. 2026;407(10543):2015-2026.', pmid: '42107392' },
            ]} />
          </div>
        </div>
      </div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

// =====================================================================
// MODULE — Basilar Artery Occlusion
// =====================================================================
const BasilarArteryOcclusionView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <BasilarArteryOcclusionCard />
  </ScaledCardWrapper>
);

export function BasilarArteryOcclusionCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  const hx = (h) => 500 + h * 8.75; // timeline hour → x
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-basilar-artery-occlusion">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Basilar Artery Occlusion</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              A time-critical posterior-circulation emergency &mdash; recognition, evidence, and selection.
            </p>

            <p className="education-evidence-limit">Occlusion site is one element of EVT selection. Apply the specific clinical, imaging, disability and time criteria for anterior circulation, dominant proximal M2 and basilar occlusion; a 24-hour eligibility window is not a procedural deadline.</p>

            {/* §1 Why it's different (purple) */}
            <CardSection color="purple" title="1. Why It's Different">
              <div style={{ fontSize: '7.9pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                BAO can cause death or severe disability. Historical outcome estimates vary by population, treatment era and endpoint and should not be used as an individual prognosis. Presentation is <strong>protean</strong>: fluctuating or progressive brainstem signs, crossed deficits, coma, "locked-in," and gaze/oculomotor abnormalities. Prodromal symptoms can occur, but their absence does not exclude BAO. Keep a <strong>low threshold for CTA</strong> in unexplained coma or posterior-circulation signs.
              </div>
            </CardSection>

            {/* §2 The evidence arc (teal) */}
            <CardSection color="teal" title="2. The Evidence Arc">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 6px 0', fontSize: '7.4pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '92px' }}>Trial</th>
                    <th style={{ width: '150px' }}>Population / window</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><strong>BEST</strong></td><td>Terminated, heavy crossover</td><td>Neutral overall &mdash; confounded by crossover</td></tr>
                  <tr><td><strong>BASICS</strong></td><td>≤6 h</td><td>No significant overall benefit &mdash; underpowered (slow enrollment, wide CI)</td></tr>
                  <tr><td><strong>ATTENTION</strong></td><td>NIHSS ≥10, ≤12 h</td><td><strong>mRS 0–3: 46% EVT vs 23%</strong> medical</td></tr>
                  <tr><td><strong>BAOCHE</strong></td><td>6–24 h</td><td><strong>mRS 0–3: 46% EVT vs 24%</strong> &mdash; extends the window</td></tr>
                </tbody>
              </table></div>
              <div style={{ fontSize: '7.5pt', color: 'var(--ink-soft)', lineHeight: '1.35' }}>
                The 2026 guideline recommends EVT for selected BAO within 24 hours with baseline mRS 0–1, NIHSS ≥10 and pc-ASPECTS ≥6; milder presentations and other populations retain uncertainty. IV thrombolysis requires its own eligibility assessment.
              </div>
            </CardSection>

            {/* §3 Selection & pitfalls (red) */}
            <CardSection color="red" title="3. Selection & Pitfalls" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li>Assess pc-ASPECTS, clinical severity and established brainstem injury together. Extensive injury predicts worse outcomes but does not, by itself, establish individual futility; perfusion and collateral findings are not interchangeable validated selection rules.</li>
                <li><strong>Time-to-treatment still matters</strong>; selected anterior and posterior circulation populations both have evidence extending to 24 hours; do not infer a universally longer biological tolerance in the posterior circulation.</li>
                <li><strong>Combine with IVT</strong> when eligible (≤4.5 h). TRACE-5: IV TNK ≤24 h (pc-ASPECTS ≥6, EVT at discretion) improved mRS 0–1/return to baseline vs standard care; adding TNK before EVT at 4.5–24 h at an EVT-capable centre did not help (ATTENTION LATE).</li>
              </ul>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'ATTENTION', cite: 'Tao C et al. N Engl J Med. 2022;387(15):1361-1372.', pmid: '36239644' },
              { label: 'BAOCHE', cite: 'Jovin TG et al. N Engl J Med. 2022;387(15):1373-1384.', pmid: '36239645' },
              { label: 'BASICS', cite: 'Langezaal LCM et al. N Engl J Med. 2021;384(20):1910-1920.', pmid: '34010530' },
              { label: 'BEST', cite: 'Liu X et al. Lancet Neurol. 2020;19(2):115-122.', pmid: '31831388' },
              { label: 'TRACE-5', cite: 'Xiong Y et al. Lancet. 2026;407(10530):763-772.', pmid: '41655588' },
              { label: 'ATTENTION LATE', cite: 'Li R et al. JAMA. 2026.', pmid: '42776543' },
            ]} />
          </div>
        </div>
      </div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}



// =====================================================================
// MODULE — Carotid Stenosis: Revascularization vs Medical Therapy
// =====================================================================
const CarotidStenosisView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <CarotidStenosisCard />
  </ScaledCardWrapper>
);

export function CarotidStenosisCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-carotid-stenosis-management">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Carotid Stenosis</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Revascularization vs medical therapy &mdash; NASCET, CREST, and CREST-2.
            </p>

            {/* Hero SVG: carotid bifurcation + NASCET | decision fork */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 180" role="img" focusable="false" aria-label="Carotid stenosis: symptomatic versus asymptomatic thresholds, revascularization options, and timing windows" style={{ width: '100%', height: 'auto' }}>
                {/* Panel 1 — carotid bifurcation with plaque + NASCET */}
                <text x="120" y="13" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CAROTID PLAQUE &amp; NASCET</text>
                {/* CCA + ICA vessel */}
                <path d="M 78 168 L 78 112 C 70 104 64 96 66 84 L 68 28 L 90 28 L 88 84 C 90 96 98 104 102 112 L 102 168 Z" fill="var(--red-soft)" stroke="var(--slate)" strokeWidth="1.3" />
                {/* ECA branch */}
                <path d="M 96 110 L 120 34 L 132 36 L 106 112 Z" fill="var(--red-soft)" stroke="var(--slate)" strokeWidth="1.2" />
                {/* plaque narrowing ICA */}
                <path d="M 66 52 C 78 60 78 74 68 80 L 66 80 Z" fill="var(--amber)" stroke="var(--amber-deep)" strokeWidth="0.8" />
                <path d="M 90 52 C 78 60 78 74 88 80 L 90 80 Z" fill="var(--amber)" stroke="var(--amber-deep)" strokeWidth="0.8" />
                {/* measurement leaders */}
                <line x1="78" y1="66" x2="150" y2="66" stroke="var(--red-deep)" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="153" y="68" fill="var(--red-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="start">① residual lumen</text>
                <line x1="78" y1="36" x2="150" y2="36" stroke="var(--teal-deep)" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="153" y="38" fill="var(--teal-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="start">② distal ICA</text>
                <text x="54" y="150" fill="var(--slate)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">CCA</text>
                <text x="120" y="52" fill="var(--slate)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">ECA</text>
                <rect x="120" y="92" width="150" height="24" rx="4" fill="#ffffff" stroke="var(--rule)" strokeWidth="1" />
                <text x="195" y="102" fill="var(--ink-soft)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">NASCET % =</text>
                <text x="195" y="112" fill="var(--ink-soft)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">(1 − ① ÷ ②) × 100</text>

                <line x1="300" y1="12" x2="300" y2="168" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel 2 — decision fork */}
                <text x="520" y="13" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MANAGEMENT DECISION</text>
                <rect x="455" y="22" width="130" height="24" rx="6" fill="var(--slate-soft)" stroke="var(--slate)" strokeWidth="1.3" />
                <text x="520" y="37" fill="var(--slate)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Carotid stenosis</text>
                <path d="M 490 46 L 420 62" stroke="var(--ink-mute)" strokeWidth="1.1" fill="none" />
                <path d="M 550 46 L 632 62" stroke="var(--ink-mute)" strokeWidth="1.1" fill="none" />
                {/* symptomatic */}
                <rect x="330" y="62" width="185" height="28" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.3" />
                <text x="422" y="73" fill="var(--purple-deep)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">SYMPTOMATIC</text>
                <text x="422" y="84" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">recent TIA / stroke, ipsilateral</text>
                <rect x="330" y="96" width="185" height="26" rx="5" fill="#ffffff" stroke="var(--purple)" strokeWidth="1" />
                <text x="422" y="106" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Severe symptomatic stenosis: assess CEA eligibility</text>
                <text x="422" y="116" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">Early CEA; CAS in selected cases</text>
                <rect x="330" y="128" width="185" height="24" rx="5" fill="#ffffff" stroke="var(--rule)" strokeWidth="1" />
                <text x="422" y="143" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">50–69%: individualized · &lt;50%: none</text>
                {/* asymptomatic */}
                <rect x="540" y="62" width="185" height="28" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.3" />
                <text x="632" y="73" fill="var(--teal-deep)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ASYMPTOMATIC</text>
                <text x="632" y="84" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">≥70%, no recent event</text>
                <rect x="540" y="96" width="185" height="56" rx="5" fill="#ffffff" stroke="var(--teal)" strokeWidth="1" />
                <text x="632" y="108" fill="var(--teal-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Intensive medical mgmt (IMM)</text>
                <text x="632" y="119" fill="var(--teal-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">is the foundation</text>
                <text x="632" y="132" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">Add CEA / CAS selectively</text>
                <text x="632" y="143" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">(CREST-2, shared decision)</text>
              </svg>
            </div>

            {/* §1 Symptomatic disease (purple) */}
            <CardSection color="purple" title="1. Symptomatic Disease">
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>NASCET 70–99%:</strong> CEA gave a large benefit — <strong>~17% absolute reduction</strong> in ipsilateral stroke at 2 years (<strong>NNT ~6</strong>).</li>
                <li><strong>50–69%:</strong> moderate benefit &mdash; 5-y ipsilateral stroke 15.7% surgical vs 22.2% medical, <strong>ARR 6.5%</strong>, NNT 15 (NASCET, PMID 9811916); greater in men and with hemispheric symptoms. <strong>&lt;50%:</strong> no benefit.</li>
                <li>For appropriate patients with recent nondisabling ipsilateral symptoms and treatable stenosis, CEA is ideally performed within two weeks. Complete occlusion, near-occlusion, large/disabling infarction, procedural risk and other contraindications require distinct assessment; this is not a universal immediate-CAS rule.</li>
              </ul>
            </CardSection>

            {/* §2 CEA vs CAS (teal) */}
            <CardSection color="teal" title="2. CEA vs CAS">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '7.5pt', lineHeight: '1.38', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '8pt' }}>CREST</strong>
                  <br />Primary composite similar for CEA vs CAS; <strong>periprocedural stroke higher with CAS</strong>, <strong>periprocedural MI higher with CEA</strong>. Age interaction (~70 crossover: younger did relatively better with CAS, older with CEA).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '8pt' }}>ACST-2 (asymptomatic)</strong>
                  <br />CAS and CEA yielded <strong>similar</strong> rates of serious procedural complications and non-procedural stroke.
                </div>
              </div>
            </CardSection>

            {/* §3 Asymptomatic — CREST-2 (red) */}
            <CardSection color="red" title="3. Asymptomatic — CREST-2 (2025)">
              <div style={{ fontSize: '7.5pt', lineHeight: '1.38', color: 'var(--ink-soft)' }}>
                Two parallel RCTs, ≥70% asymptomatic stenosis, on modern intensive medical management (IMM). <strong>4-year primary composite (stroke/death through day 44 from randomization, then ipsilateral ischemic stroke):</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '4px 0 3px 0' }}>
                  <div style={{ border: '1px solid var(--red)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                    <strong style={{ color: 'var(--red-deep)' }}>Stenting</strong> (n=1245): <strong>2.8%</strong> stenting+IMM vs <strong>6.0%</strong> IMM alone (P=0.02)
                  </div>
                  <div style={{ border: '1px solid var(--slate)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                    <strong style={{ color: 'var(--slate)' }}>Endarterectomy</strong> (n=1240): <strong>3.7%</strong> CEA+IMM vs <strong>5.3%</strong> IMM alone (P=0.24, NS)
                  </div>
                </div>
                Event rates on contemporary IMM are low; adding stenting reduced events, CEA did not reach significance. <strong>IMM is the foundation for all</strong>; asymptomatic revascularization is selective and shared-decision-based.
              </div>
            </CardSection>

            {/* §4 Intensive medical therapy (amber) */}
            <CardSection color="amber" title="4. Intensive Medical Therapy" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong>High-intensity statin (standard post-stroke LDL target &lt;70 mg/dL; &lt;55 mg/dL for very-high-risk atherosclerotic disease), antiplatelet, BP control, diabetes / lifestyle, smoking cessation</strong> — the common denominator across every arm.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'CREST-2', cite: 'Brott TG et al. N Engl J Med. 2026;394(3):219-231.', pmid: '41269206' },
              { label: 'CREST', cite: 'Brott TG et al. N Engl J Med. 2010;363(1):11-23.', pmid: '20505173' },
              { label: 'ACST-2', cite: 'Halliday A et al. Lancet. 2021;398(10305):1065-1073.', pmid: '34469763' },
              { label: 'NASCET', cite: 'NASCET Collaborators. N Engl J Med. 1991;325(7):445-453.', pmid: '1852179' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Brainstem Stroke Syndromes Atlas
// =====================================================================
const BrainstemSyndromesView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <BrainstemSyndromesCard />
  </ScaledCardWrapper>
);

export function BrainstemSyndromesCard() {
  const rows = [
    { s: 'Wallenberg (lateral medullary)', v: 'PICA / vertebral', d: 'Ipsi facial pain-temp loss (V), Horner, ataxia, dysphagia/hoarseness (IX/X); contra body pain-temp loss (spinothalamic). Corticospinal tract spared → no hemiparesis.', lvl: 'medulla' },
    { s: 'Dejerine (medial medullary)', v: 'Anterior spinal / vertebral', d: 'Contra arm/leg weakness (pyramid, face spared), contra proprioception loss (medial lemniscus), ipsi tongue weakness (XII).', lvl: 'medulla' },
    { s: 'Millard-Gubler (ventral pons)', v: 'Basilar perforators', d: 'Ipsi VI + VII palsy; contra hemiparesis.', lvl: 'pons' },
    { s: 'Foville (dorsal pons)', v: 'Basilar perforators', d: 'Ipsi horizontal gaze palsy + VII; contra hemiparesis.', lvl: 'pons' },
    { s: 'One-and-a-half (dorsal pons)', v: 'PPRF + MLF', d: 'Ipsi conjugate gaze palsy + INO — the remaining horizontal movement is contralateral eye abduction; vertical movements may be preserved.', lvl: 'pons' },
    { s: 'Weber (ventral midbrain)', v: 'PCA / basilar perforators', d: 'Ipsi CN III palsy; contra hemiparesis.', lvl: 'midbrain' },
    { s: 'Benedikt (midbrain tegmentum)', v: 'PCA perforators', d: 'Ipsi CN III; contra tremor / involuntary movements (red nucleus).', lvl: 'midbrain' },
    { s: 'Claude (midbrain)', v: 'PCA perforators', d: 'Ipsi CN III; contra ataxia (superior cerebellar peduncle).', lvl: 'midbrain' },
  ];
  const lvlColor = { midbrain: 'var(--purple)', pons: 'var(--teal)', medulla: 'var(--amber)' };
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-brainstem-stroke-syndromes">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Brainstem Stroke Syndromes</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              The crossed-deficit rule &mdash; ipsilateral cranial nerve + contralateral long tract.
            </p>

            {/* Hero SVG: sagittal levels + axial cross-sections + rule legend */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 165" role="img" focusable="false" aria-label="Brainstem levels with cranial nerve correlates, medial versus lateral axial cross-sections, and the crossed-deficit localization rule" style={{ width: '100%', height: 'auto' }}>
                {/* Sagittal brainstem with CN levels */}
                <text x="78" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LEVEL → CN</text>
                <rect x="54" y="22" width="48" height="34" rx="7" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.4" />
                <text x="78" y="36" fill="var(--purple-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Midbrain</text>
                <text x="78" y="47" fill="var(--purple-deep)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">III</text>
                <path d="M 48 56 C 44 74 44 84 50 100 L 106 100 C 112 84 112 74 108 56 Z" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.4" />
                <text x="78" y="74" fill="var(--teal-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Pons</text>
                <text x="78" y="86" fill="var(--teal-deep)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">VI · VII</text>
                <path d="M 58 100 L 98 100 L 92 146 L 64 146 Z" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.4" />
                <text x="78" y="120" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Medulla</text>
                <text x="78" y="132" fill="var(--amber-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">IX–XII</text>

                <line x1="130" y1="12" x2="130" y2="152" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Axial cross-sections: medial vs lateral */}
                <text x="290" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">AXIAL — MEDIAL vs LATERAL</text>
                {[
                  { cx: 195, col: 'var(--purple)', soft: 'var(--purple-soft)', lab: 'Midbrain' },
                  { cx: 295, col: 'var(--teal)', soft: 'var(--teal-soft)', lab: 'Pons' },
                  { cx: 395, col: 'var(--amber)', soft: 'var(--amber-soft)', lab: 'Medulla' },
                ].map((a) => (
                  <g key={a.lab}>
                    <ellipse cx={a.cx} cy="66" rx="42" ry="30" fill="#ffffff" stroke={a.col} strokeWidth="1.4" />
                    {/* medial column */}
                    <rect x={a.cx - 12} y="40" width="24" height="52" rx="4" fill={a.soft} stroke={a.col} strokeWidth="0.8" />
                    {/* ventral basilar dot */}
                    <circle cx={a.cx} cy="94" r="4" fill="var(--red)" />
                    <text x={a.cx} y="68" fill={a.col} fontSize="4.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">med</text>
                    <text x={a.cx - 30} y="68" fill="var(--ink-mute)" fontSize="4.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">lat</text>
                    <text x={a.cx + 30} y="68" fill="var(--ink-mute)" fontSize="4.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">lat</text>
                    <text x={a.cx} y="112" fill="var(--ink-soft)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">{a.lab}</text>
                  </g>
                ))}
                <text x="290" y="128" fill="var(--ink-mute)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Medial = long tracts + medial CNs (III, VI, XII) · Lateral = spinothalamic, Horner, cerebellar + lateral CNs</text>

                <line x1="452" y1="12" x2="452" y2="152" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Rule legend */}
                <rect x="464" y="24" width="262" height="118" rx="8" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.3" />
                <text x="476" y="42" fill="var(--purple-deep)" fontSize="6.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">THE CROSSED-DEFICIT RULE</text>
                <text x="476" y="62" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">Ipsilateral cranial-nerve signs</text>
                <text x="476" y="74" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">+ contralateral long-tract signs</text>
                <text x="476" y="86" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">= brainstem localization.</text>
                <text x="476" y="104" fill="var(--teal-deep)" fontSize="6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">The involved CN identifies</text>
                <text x="476" y="116" fill="var(--teal-deep)" fontSize="6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">the level (III / VI-VII / IX-XII).</text>
                <text x="476" y="132" fill="var(--ink-mute)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="start">Territory anatomy per Tatu (1996).</text>
              </svg>
            </div>

            {/* §1 Localization rule (purple) */}
            <CardSection color="purple" title="1. The Localization Rule">
              <div style={{ fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                A <strong>crossed deficit</strong> — ipsilateral cranial-nerve signs + contralateral long-tract (motor/sensory) signs — localizes to the brainstem. The involved CN identifies the level. <strong>Medial</strong> lesions hit long tracts (corticospinal, medial lemniscus) + medial CNs (III, VI, XII); <strong>lateral</strong> lesions hit spinothalamic, sympathetic, cerebellar peduncles + lateral CNs (V, VII, VIII, IX, X).
              </div>
            </CardSection>

            {/* §2 Classic syndromes (teal, table) */}
            <CardSection color="teal" title="2. Classic Syndromes">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.9pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '150px' }}>Syndrome</th>
                    <th style={{ width: '112px' }}>Level / vessel</th>
                    <th>Deficits</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.s}>
                      <td><strong style={{ color: lvlColor[r.lvl] }}>{r.s}</strong></td>
                      <td>{r.v}</td>
                      <td>{r.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Pearls (amber) */}
            <CardSection color="amber" title="3. Pearls" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>Vertigo:</strong> posterior-circulation stroke can present with prominent vestibular symptoms. HINTS+ applies to an appropriate continuous acute vestibular syndrome with nystagmus and a trained examiner, not every isolated or episodic dizzy presentation.</li>
                <li><strong>Locked-in syndrome</strong> = ventral pontine (basilar): preserved vertical gaze / blink, quadriplegia, anarthria.</li>
              </ul>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'Tatu — brainstem / cerebellum', cite: 'Tatu L et al. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' },
              { label: 'Tatu — cerebral hemispheres', cite: 'Tatu L et al. Neurology. 1998;50(6):1699-1708.', pmid: '9633714' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Cerebral Vascular Territory & Watershed Atlas
// =====================================================================
const VascularTerritoryAtlasView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <VascularTerritoryAtlasCard />
  </ScaledCardWrapper>
);

export function VascularTerritoryAtlasCard() {
  // Axial territory "pie": center + elliptical sectors (anterior = top).
  const cx = 138, cy = 86, rx = 104, ry = 58;
  const P = (deg) => {
    const t = (deg * Math.PI) / 180;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  };
  const wedge = (a, b) => {
    const pts = [`${cx},${cy}`];
    for (let d = a; d <= b; d += 6) { const [x, y] = P(d); pts.push(`${x.toFixed(1)},${y.toFixed(1)}`); }
    const [x, y] = P(b); pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    return pts.join(' ');
  };
  const ant = [
    { t: 'ACA', s: 'Contra leg > arm weakness, abulia, transcortical aphasia, grasp', c: 'purple' },
    { t: 'MCA', s: 'Contra face/arm > leg weakness + sensory loss, gaze toward lesion, hemianopia; dominant → aphasia, non-dominant → neglect', c: 'teal' },
    { t: 'Lenticulostriate', s: 'Pure lacunar syndromes (pure motor, sensorimotor) — deep MCA perforators', c: 'purple' },
    { t: 'Anterior choroidal', s: 'Possible contralateral weakness, sensory loss and/or hemianopia; the full triad is not required and reflects capsular and visual-pathway involvement', c: 'red' },
  ];
  const post = [
    { t: 'PCA', s: 'Homonymous hemianopia (macular sparing), alexia without agraphia (dominant), memory loss; thalamic/midbrain variants', c: 'amber' },
    { t: 'PICA', s: 'Lateral medulla + inferior cerebellum → Wallenberg', c: 'amber' },
    { t: 'AICA', s: 'Lateral pons + labyrinth → vertigo, ipsi deafness / facial palsy, ataxia', c: 'teal' },
    { t: 'SCA', s: 'Superior cerebellum → ataxia, dysarthria', c: 'teal' },
    { t: 'Basilar perforators', s: 'Pons → crossed syndromes, locked-in', c: 'red' },
  ];
  const cc = { purple: 'var(--purple-deep)', teal: 'var(--teal-deep)', amber: 'var(--amber-deep)', red: 'var(--red-deep)' };
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-vascular-territory-atlas">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Vascular Territory &amp; Watershed Atlas</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Territories, clinical signatures, and the borderzone patterns.
            </p>

            {/* Hero SVG: axial territory pie | watershed patterns | circle of Willis */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2"><strong>Key clinical boundaries</strong><p>Territory patterns are schematic and variable. Use source-validated imaging anatomy for exact localization; the former axial sectors and disconnected circle-of-Willis inset are unavailable. The clinical pattern tables below are localization aids, not proof of an arterial lesion.</p></aside>
            </div>

            {/* §1 Anterior circulation (purple, table) */}
            <CardSection color="purple" title="1. Anterior Circulation">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '120px' }}>Territory</th>
                    <th>Clinical signature</th>
                  </tr>
                </thead>
                <tbody>
                  {ant.map((r) => (
                    <tr key={r.t}><td><strong style={{ color: cc[r.c] }}>{r.t}</strong></td><td>{r.s}</td></tr>
                  ))}
                </tbody>
              </table></div>
            </CardSection>

            {/* §2 Posterior circulation (teal, table) */}
            <CardSection color="teal" title="2. Posterior Circulation">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '120px' }}>Territory</th>
                    <th>Clinical signature</th>
                  </tr>
                </thead>
                <tbody>
                  {post.map((r) => (
                    <tr key={r.t}><td><strong style={{ color: cc[r.c] }}>{r.t}</strong></td><td>{r.s}</td></tr>
                  ))}
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Watershed / borderzone (red) */}
            <CardSection color="red" title="3. Watershed / Borderzone" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong>Cortical (ACA-MCA &amp; MCA-PCA):</strong> wedge-shaped. <strong>Internal (deep white matter):</strong> rosary / "chain" pattern. Mechanism is <strong>hemodynamic</strong> (proximal stenosis/occlusion + hypotension) or <strong>shower emboli</strong> — flags a search for large-artery disease or a hypoperfusion event rather than a single embolus.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'Tatu — cerebral hemispheres', cite: 'Tatu L et al. Neurology. 1998;50(6):1699-1708.', pmid: '9633714' },
              { label: 'Tatu — brainstem / cerebellum', cite: 'Tatu L et al. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Anticoagulation Reversal in Acute Hemorrhage
// =====================================================================
const AnticoagulationReversalView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <AnticoagulationReversalCard />
  </ScaledCardWrapper>
);

export function AnticoagulationReversalCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-anticoagulation-reversal">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Anticoagulation Reversal in Acute Hemorrhage</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Stop the implicated anticoagulant and arrange urgent reversal alongside stabilization, BP management and neurosurgical evaluation.
            </p>

            <p className="education-evidence-limit">Reversal, stabilization, BP assessment and neurosurgical evaluation proceed urgently in parallel. The former composite image is unavailable because its drug and dosing instructions were outdated or overgeneralized.</p>

            {/* §1 Identify agent & last dose (purple) */}
            <CardSection color="purple" title="1. Identify the Agent & Last Dose">
              <div style={{ fontSize: '7.8pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                Establish <strong>drug, dose, time of last intake, indication, and renal function</strong>. Send baseline coags (INR/PTT; anti-Xa where available), but <strong>do not delay reversal</strong> for a hemorrhagic ICH while awaiting levels.
              </div>
            </CardSection>

            {/* §2 Agent-specific reversal (teal, table) */}
            <CardSection color="teal" title="2. Agent-Specific Reversal">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '112px' }}>Agent</th>
                    <th style={{ width: '132px' }}>Reversal</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Warfarin (VKA)</strong></td>
                    <td><strong>4F-PCC plus IV vitamin K</strong> for clinically relevant VKA-associated ICH. Select PCC dose from INR, weight and the complete product protocol, including maximum doses; mildly elevated INR requires separate consideration.</td>
                    <td>PCC is preferred over FFP for rapid reversal in the indicated setting. Check the complete current reversal pathway for INR goals, dosing, reassessment and monitoring; this card supplies no independent INR stop rule.</td>
                  </tr>
                  <tr>
                    <td><strong>Dabigatran</strong> (DTI)</td>
                    <td><strong>Idarucizumab 5 g IV</strong></td>
                    <td>RE-VERSE AD: rapid, near-complete reversal. Dialysis may be considered in selected circumstances such as unavailable antidote or impaired drug clearance; it is not a routine adjunct for every patient.</td>
                  </tr>
                  <tr>
                    <td><strong>Factor Xa inhibitors</strong> (apixaban, rivaroxaban, edoxaban)</td>
                    <td><strong>4F-PCC</strong> according to the approved local reversal pathway, exposure assessment, and pharmacy guidance</td>
                    <td><strong>Andexanet is unavailable in the US.</strong> ANNEXA-4 was single-arm. <strong>ANNEXA-I</strong> improved hemostasis but increased thrombosis, including ischemic stroke; the FDA subsequently concluded that serious risks outweigh benefits.</td>
                  </tr>
                  <tr>
                    <td><strong>Antiplatelets</strong></td>
                    <td>Platelet transfusion <strong>not</strong> recommended (PATCH)</td>
                    <td>Aspirin-treated patients needing emergency neurosurgery are a separate consideration. Desmopressin benefit remains uncertain.</td>
                  </tr>
                </tbody>
              </table></div>
              <div style={{ marginTop: '6px', border: '1px solid var(--teal)', borderRadius: '6px', padding: '5px 8px', background: '#ffffff', fontSize: '7pt', lineHeight: '1.38', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--teal-deep)' }}>FDA safety update — December 18, 2025:</strong> Andexxa was no longer manufactured for or sold in the US after December 22, 2025. This card therefore provides no andexanet regimen. <a href="https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/update-safety-andexxa" target="_blank" rel="noopener noreferrer">Read the FDA communication.</a>
              </div>
            </CardSection>

            {/* §3 Parallel steps & BP targets (red) */}
            <CardSection color="red" title="3. Parallel Steps & BP Targets" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>BP (AHA/ASA 2022):</strong> In mild-to-moderate spontaneous ICH presenting with SBP 150–220, a target of <strong>140 mmHg with maintenance at 130–150</strong> may be reasonable; avoid lowering below 130. Large/severe ICH and surgical candidates require individualized management.</li>
                <li><strong>Neurosurgery consult:</strong> Urgent for cerebellar ICH with brainstem compression / hydrocephalus, large lobar ICH with mass effect, or intraventricular hemorrhage with EVD need.</li>
                <li><strong>Hold all antithrombotics:</strong> Re-evaluate resumption timeline based on indication (AFib vs mechanical valve) and ICH expansion stability.</li>
              </ul>
            </CardSection>

            {/* §4 Thrombolysis-associated sICH — a different coagulopathy (amber) */}
            <CardSection color="amber" title="4. Thrombolysis-Associated sICH (alteplase / tenecteplase)" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.5pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                Thrombolysis-associated symptomatic hemorrhage requires urgent evaluation of bleeding, thrombolytic exposure and laboratory findings. This summary does not assume a fixed fibrinogen/PT/aPTT pattern or provide an independent cryoprecipitate/antifibrinolytic sequence. Use the complete current hemorrhage-response pathway with the treating team. The 2017 AHA/ASA statement discusses these treatments using limited evidence; this abbreviated reference is not a complete reversal order. This app&rsquo;s ICH reversal protocol operationalizes cryoprecipitate + tranexamic acid with a fibrinogen action threshold.
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '7.2pt' }} refs={[
              { label: 'ANNEXA-4', cite: 'Connolly SJ et al. N Engl J Med. 2019;380(14):1326-1335.', pmid: '30730782' },
              { label: 'ANNEXA-I', cite: 'Connolly SJ et al. N Engl J Med. 2024;390(19):1745-1755.', pmid: '38749032' },
              { label: 'RE-VERSE AD', cite: 'Pollack CV et al. N Engl J Med. 2017;377(5):431-441.', pmid: '28693366' },
              { label: 'Thrombolysis-sICH Statement (AHA/ASA)', cite: 'Yaghi S et al. Stroke. 2017;48(12):e343-e361.', pmid: '29097489' },
              { label: 'AHA/ASA 2022 ICH Guideline', cite: 'Greenberg SM et al. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
              { label: 'NCS/SCCM Reversal Guideline', cite: 'Frontera JA et al. Neurocrit Care. 2016;24(1):6-46.', pmid: '26714677' },
            ]} />
          </div>
        </div>
      </div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}


// =====================================================================
// MODULE — Reversible Cerebral Vasoconstriction Syndrome (RCVS)
// =====================================================================
const RcvsView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <RcvsCard />
  </ScaledCardWrapper>
);

export function RcvsCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-rcvs">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Reversible Cerebral Vasoconstriction Syndrome</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Recurrent thunderclap headache + reversible segmental vasoconstriction (RCVS).
            </p>

            {/* Hero SVG: string-of-beads reversing + RCVS vs PACNS */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Reversible cerebral vasoconstriction syndrome: angiographic course and comparison with PACNS" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A — before/after */}
                <text x="168" y="13" fill="var(--ink-soft)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">SEGMENTAL VASOCONSTRICTION — REVERSIBLE</text>
                <path d="M 30 42 C 52 32 66 52 90 36 C 114 52 128 32 152 48 C 176 32 190 52 214 36 C 238 52 252 34 300 44" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 30 62 C 52 72 66 52 90 68 C 114 52 128 72 152 56 C 176 72 190 52 214 68 C 238 52 252 70 300 60" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <text x="165" y="86" fill="var(--purple-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Acute: "string of beads"</text>
                <path d="M 165 92 L 165 104" stroke="var(--teal-deep)" strokeWidth="1.4" markerEnd="url(#rcvs-arrow)" />
                <defs>
                  <marker id="rcvs-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 2 L 8 5 L 0 8 z" fill="var(--teal-deep)" /></marker>
                </defs>
                <text x="240" y="101" fill="var(--teal-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">reverses ≤12 weeks</text>
                <line x1="30" y1="120" x2="300" y2="120" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" />
                <line x1="30" y1="136" x2="300" y2="136" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" />
                <text x="165" y="156" fill="var(--teal-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">≤12 weeks: normalized caliber</text>

                <line x1="342" y1="12" x2="342" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B — RCVS vs PACNS */}
                <text x="538" y="13" fill="var(--ink-soft)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">RCVS vs PACNS</text>
                <rect x="360" y="24" width="172" height="126" rx="8" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.4" />
                <text x="446" y="40" fill="var(--purple-deep)" fontSize="7.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">RCVS</text>
                {['Thunderclap onset', 'Vasoconstrictive trigger', 'Reverses ≤12 weeks', 'CCB; AVOID steroids'].map((t, i) => (
                  <text key={t} x="372" y={58 + i * 18} fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">• {t}</text>
                ))}
                <rect x="544" y="24" width="180" height="126" rx="8" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.4" />
                <text x="634" y="40" fill="var(--red-deep)" fontSize="7.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PACNS</text>
                {['Often subacute course', 'Exclude mimics', 'MRI patterns overlap', 'Expert diagnostic workup'].map((t, i) => (
                  <text key={t} x="556" y={58 + i * 18} fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">• {t}</text>
                ))}
              </svg>
            </div>

            {/* §1 Presentation (purple) */}
            <CardSection color="purple" title="1. Presentation">
              <div style={{ fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong>Recurrent thunderclap headaches</strong> over 1&ndash;3 weeks are the hallmark. <strong>Triggers:</strong> postpartum; vasoactive substances (cannabis, SSRIs/SNRIs, sympathomimetics, nasal decongestants, triptans, ergots); blood products / immunoglobulin; exertion, Valsalva, sexual activity, bathing. <strong>Female predominance.</strong>
              </div>
            </CardSection>

            {/* §2 Diagnosis (teal) */}
            <CardSection color="teal" title="2. Diagnosis">
              <div style={{ fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                Multifocal <strong>segmental vasoconstriction of medium-caliber arteries</strong> that <strong>reverses within ~12 weeks</strong>. Early angiography can be <strong>normal</strong> (dynamic) — repeat at 1&ndash;3 weeks. Complications by phase: <strong>convexity (non-aneurysmal) SAH</strong> and PRES early; <strong>ischemic stroke</strong> (often watershed) later; occasionally ICH.
              </div>
            </CardSection>

            <CardSection color="red" title="3. RCVS²: Evidence and Application Limits">
              <p>The original derivation and validation study examined thunderclap headache, intracranial carotid involvement, a vasoconstrictive trigger, sex and subarachnoid hemorrhage to distinguish RCVS from selected non-RCVS arteriopathies.</p>
              <p>The point table and automatic diagnostic cutoffs are unavailable here because the complete original table has not been independently verified. The study’s diagnostic performance does not establish a stand-alone rule for every thunderclap headache presentation; use the full diagnostic workup and original report.</p>
            </CardSection>

            {/* §4 Management (amber) */}
            <CardSection color="amber" title="4. Management" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                Remove triggers; <strong>calcium-channel blockers</strong> (nimodipine / verapamil) for headache control (do not clearly prevent stroke); <strong>avoid glucocorticoids</strong> (associated with worse outcomes); do NOT start empiric immunosuppression (contrast with PACNS). Course is usually <strong>monophasic with good prognosis</strong>.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'RCVS² score', cite: 'Rocha EA et al. Neurology. 2019;92(7):e639-e647.', pmid: '30635475' },
              { label: 'Ducros cohort', cite: 'Ducros A et al. Brain. 2007;130(Pt 12):3091-3101.', pmid: '18025032' },
              { label: 'Singhal series', cite: 'Singhal AB et al. Arch Neurol. 2011;68(8):1005-1012.', pmid: '21482916' },
              { label: 'Glucocorticoid-associated worsening', cite: 'Singhal AB, Topcuoglu MA. Neurology. 2017;88(3):228-236.', pmid: '27940651' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}



// =====================================================================
// DOMAIN 4: Diagnostic Algorithms, Neuroimaging Pearls & Cryptogenic Stroke
// =====================================================================



// =====================================================================
// MODULE — High-Resolution Vessel Wall MRI (VW-MRI) Differential
// =====================================================================
const VesselWallMriView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <VesselWallMriCard />
  </ScaledCardWrapper>
);

export function VesselWallMriCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-vessel-wall-mri">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>High-Resolution Vessel Wall MRI (VW-MRI) Differential</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              3.0T Black-Blood Imaging &bull; ICAD vs PACNS Vasculitis vs RCVS vs Arterial Dissection vs Moyamoya Disease
            </p>

            {/* Hero SVG: 5 Cross-Section Vessel Wall Illustrations */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2"><strong>Key clinical boundaries</strong><p>Vessel-wall MRI is an adjunct to luminal imaging and clinical assessment. Concentric or eccentric enhancement, wall thickening and outer-diameter changes overlap across disorders. Imaging or abnormal CSF alone does not diagnose PACNS or authorize immunosuppression; exclude infection and other mimics through multidisciplinary assessment.</p></aside>
            </div>

            {/* §1 Technical Principles & Sequence Optimization (purple) */}
            <CardSection color="purple" title="1. Technical Principles &amp; Pulse Sequences (3.0T Black-Blood)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>3D Isotropic Submillimeter</strong>
                  <br />&bull; Use a neuroradiology-designed high-resolution vessel-wall acquisition appropriate to the scanner and clinical question; a universal field strength or voxel size is not prescribed here.
                  <br />&bull; Multiplanar reconstruction (axial, coronal, sagittal, oblique) perpendicular to vessel long axis.
                </div>
                <div style={{ border: '1px solid var(--teal)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Black-Blood Flow Suppression</strong>
                  <br />&bull; <strong>DANTE</strong> (Delay Alternating with Nutation for Tailored Excitation) or <strong>MSDE</strong> (Motion-Sensitized Driven Equilibrium).
                  <br />&bull; Flow/CSF suppression aims to reduce artifacts but does not guarantee their elimination; slow flow can mimic wall disease.
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Contrast Timing &amp; T1 Pre/Post</strong>
                  <br />&bull; Compare pre- and post-contrast T1 images when assessing intrinsic T1 signal and enhancement.
                  <br />&bull; Acquisition timing is sequence- and scanner-specific; use the validated imaging protocol rather than a universal contrast-delay instruction.
                </div>
              </div>
            </CardSection>

            {/* §2 Comprehensive 5-Arteriopathy Diagnostic Matrix (teal) */}
            <CardSection color="teal" title="2. Comprehensive 5-Arteriopathy Diagnostic Matrix">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '85px' }}>Arteriopathy</th>
                    <th style={{ width: '120px' }}>Wall Thickening Pattern</th>
                    <th style={{ width: '125px' }}>Enhancement Pattern</th>
                    <th style={{ width: '110px' }}>Vascular Remodeling</th>
                    <th>Characteristic Signal &amp; Ancillary Biomarkers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>ICAD</strong></td>
                    <td><strong>Eccentric, focal, asymmetric</strong> plaque along one hemicircumference.</td>
                    <td><strong>Heterogeneous</strong>; concentrated at plaque shoulder or fibrous cap; persistent.</td>
                    <td><strong>Positive outward</strong> (early) or negative inward (advanced stenotic).</td>
                    <td><strong>Intraplaque Hemorrhage (IPH):</strong> High T1 signal on pre-contrast T1-SPACE; associated with higher recurrent stroke risk in observational vessel-wall MRI cohorts.</td>
                  </tr>
                  <tr>
                    <td><strong>PACNS (Vasculitis)</strong></td>
                    <td>Concentric smooth thickening can occur in PACNS, but the pattern is not universal or disease-specific.</td>
                    <td>Enhancement may be concentric, eccentric or absent; intensity and persistence vary.</td>
                    <td>Minimal outward remodeling; luminal narrowing across multiple branches.</td>
                    <td>CSF may show pleocytosis or elevated protein, but neither abnormal CSF nor response to immunosuppression establishes PACNS. Interpret with the clinical, vascular and, when appropriate, pathological evaluation.</td>
                  </tr>
                  <tr>
                    <td><strong>RCVS</strong></td>
                    <td><strong>Absent or minimal</strong> uniform band (dynamic vasoconstriction).</td>
                    <td><strong>Non-enhancing</strong> or faint, diffuse, transient enhancement.</td>
                    <td>Do not use a categorical remodeling rule to establish or exclude RCVS; interpret wall and luminal findings with the clinical course.</td>
                    <td>RCVS typically reverses substantially within about 12 weeks. Glucocorticoid-associated worsening is supported by observational evidence; exact normalization at a fixed date is not required in every case.</td>
                  </tr>
                  <tr>
                    <td><strong>Dissection</strong></td>
                    <td><strong>Eccentric, crescentic</strong> wall thickening (intramural hematoma).</td>
                    <td>Enhancement of <strong>intimal flap and adventitia</strong>; delayed outer wall enhancement.</td>
                    <td>Vessel enlargement, dissecting pseudoaneurysm, or string sign.</td>
                    <td><strong>Double lumen &amp; Intimal Flap:</strong> High T1 signal crescent (methemoglobin); antithrombotic decisions require distinction between extracranial and intracranial dissection and assessment for SAH.</td>
                  </tr>
                  <tr>
                    <td><strong>Moyamoya</strong></td>
                    <td><strong>Concentric wall thickening with marked shrinkage</strong> of outer vessel diameter.</td>
                    <td>Enhancement alone does not establish or exclude moyamoya, or prove the presence or absence of inflammation.</td>
                    <td><strong>Marked negative remodeling</strong> (constrictive shrinkage of terminal ICA/MCA).</td>
                    <td><strong>Ivy Sign on FLAIR:</strong> Slow leptomeningeal collateral flow; basal lenticulostriate "puff of smoke" network; STA-MCA bypass.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Critical Diagnostic Decision Pathways & Pitfalls (red) */}
            <CardSection color="red" title="3. Critical Diagnostic Decision Pathways &amp; Management">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>PACNS vs RCVS Differentiation</strong>
                  <br />&bull; <strong>RCVS:</strong> the clinical course and vascular findings must fit; neither a score nor nonenhancing vessel wall is diagnostic alone. Calcium-channel blockers are used for symptoms without proven stroke-prevention benefit; avoid glucocorticoids unless another established indication requires them.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--red)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Dissection: Extracranial vs Intracranial</strong>
                  <br />&bull; <strong>Extracranial dissection:</strong> individualize antiplatelet versus anticoagulant therapy. CADISS allowed several antiplatelet regimens, including DAPT; TREAT-CAD did not establish aspirin noninferiority to VKA. STOP-CAD’s occlusive-dissection finding is observational, not a treatment mandate.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--red)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Moyamoya Surgical Revascularization</strong>
                  <br />&bull; Direct STA-MCA bypass or indirect EDAS (encephaloduroarteriosynangiosis).
                  <br />&bull; Maintain strict normocapnia and avoid hypotension during perioperative management (hyperventilation causes severe cerebral vasoconstriction).
                </div>
              </div>
            </CardSection>

            {/* §4 Tiered Bedside & Interventional Pearls (slate) */}
            <CardSection color="slate" title="4. Tiered Bedside &amp; Academic Pearls">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Trainee / Order Entry Focus</strong>
                  <br />&bull; Discuss the clinical question and acquisition with neuroradiology. Scanner, sequence, contrast and safety requirements are specific to the imaging service; this is not a universal order template.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Fellow / Differential Focus</strong>
                  <br />&bull; Look for the "Plaque Shoulder Sign" in ICAD: Enhancement is asymmetric and localized to the fibrous cap adjacent to the lumen.
                  <br />&bull; Multivessel enhancement can inform the differential diagnosis, but the number of vascular beds is not a validated PACNS diagnostic threshold.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Attending / Advanced Physics</strong>
                  <br />&bull; Outer-diameter shrinkage can support moyamoya, while other wall patterns may suggest atherosclerosis or vasculitis. These are overlapping patterns, not a categorical diagnostic separation.
                  <br />&bull; High T1 plaque signal (IPH) represents methemoglobin from neovascular intraplaque leakiness.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'ASNR VW-MRI Consensus', cite: 'Mandell DM et al. AJNR Am J Neuroradiol. 2017;38(2):218-229.', pmid: '27469212' },
              { label: 'Arteriopathy Characteristics', cite: 'Vranic JE et al. Neuroimaging Clin N Am. 2021;31(2):223-233.', pmid: '33902876' },
              { label: 'High-Res Diagnostic Patterns', cite: 'Obusez EC et al. AJNR Am J Neuroradiol. 2014;35(8):1527-1532.', pmid: '24722305' },
              { label: 'PACNS vs RCVS Differentiation', cite: 'Mattay RR et al. Semin Ultrasound CT MR. 2021;42(5):463-473.', pmid: '34537115' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Cryptogenic Stroke & ESUS Diagnostic Evaluation
// =====================================================================
const CryptogenicStrokeEsusView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <CryptogenicStrokeEsusCard />
  </ScaledCardWrapper>
);

export function CryptogenicStrokeEsusCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cryptogenic-stroke-esus">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Cryptogenic Stroke &amp; ESUS Diagnostic Evaluation</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              ESUS Construct &bull; Empirical DOAC Trials Failure &bull; ARCADIA Atrial Cardiopathy &bull; CRYSTAL AF &amp; STROKE-AF Monitoring
            </p>

            {/* Hero SVG: ESUS Multi-Territory Pattern, Trial Neutrality & ICM Yield Timeline */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2"><strong>Key clinical boundaries</strong><p>ESUS is a nonlacunar ischemic-stroke construct requiring a defined evaluation and exclusion of relevant arterial stenosis, major-risk cardiac sources and other causes. A single ECG or multiple-territory pattern is insufficient. NAVIGATE ESUS, RE-SPECT ESUS and ARCADIA did not establish routine empirical anticoagulation; detection of AF requires confirmation and indication-specific assessment.</p></aside>
            </div>

            {/* §1 ESUS Construct & Diagnostic Requirements (purple) */}
            <CardSection color="purple" title="1. ESUS Construct &amp; Diagnostic Requirements (Hart 2014)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Diagnostic Criteria (Hart 2014)</strong>
                  <br />&bull; <strong>Non-lacunar infarct:</strong> use the original modality-specific definition. CT and diffusion-MRI criteria should not be collapsed into one universal diameter threshold.
                  <br />&bull; <strong>No &ge;50% luminal stenosis</strong> in extracranial/intracranial upstream arteries.
                  <br />&bull; <strong>No major cardioembolic source</strong> (AF, LV thrombus, mechanical valve, EF &lt;30%, acute MI &lt;4 weeks, vegetation).
                  <br />&bull; <strong>No other specific cause</strong> (dissection, vasculitis, vasospasm, hypercoagulability).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Standard Diagnostic Workup Bundle</strong>
                  <br />&bull; Brain CT or MRI confirming non-lacunar stroke.
                  <br />&bull; CTA / MRA / Duplex of cervical and intracranial arteries.
                  <br />&bull; 12-lead ECG + continuous inpatient telemetry &ge;24–48 hours.
                  <br />&bull; Echocardiography as part of the etiologic evaluation; target bubble study or TEE to a plausible shunt or cardiac mechanism and potential management impact.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Paradigm Shift in ESUS</strong>
                  <br />&bull; ESUS is a <strong>heterogeneous clinical construct</strong>, NOT a single disease entity.
                  <br />&bull; Etiologies include: occult paroxysmal AF, non-stenotic vulnerable plaque (arch, cervical, or intracranial), paradoxical embolism via PFO, subclinical cardiopathy, and occult malignancy.
                </div>
              </div>
            </CardSection>

            {/* §2 Empirical DOAC Failure & Atrial Cardiopathy Trials (teal) */}
            <CardSection color="teal" title="2. Landmark Empirical DOAC &amp; Atrial Cardiopathy Trials">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '105px' }}>Landmark Trial</th>
                    <th style={{ width: '135px' }}>Population &amp; Regimen</th>
                    <th style={{ width: '130px' }}>Primary Efficacy Outcome</th>
                    <th>Safety &amp; Practice-Changing Takeaway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>NAVIGATE ESUS</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2018 &bull; n=7213</span></td>
                    <td>Selected ESUS patients aged ≥50, with additional risk criteria at age 50–59.<br /><strong>Rivaroxaban 15 mg daily versus aspirin 100 mg daily</strong> (trial regimens).</td>
                    <td>Stroke or systemic embolism: <strong>5.1%/yr vs 4.8%/yr</strong> (HR 1.07, 95% CI 0.87–1.33, p=0.52).</td>
                    <td><strong>Major Bleeding: 1.8%/yr vs 0.7%/yr (HR 2.72, p&lt;0.001).</strong> Trial stopped early for futility and excess bleeding harm. DOACs not indicated for empiric ESUS.</td>
                  </tr>
                  <tr>
                    <td><strong>RE-SPECT ESUS</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2019 &bull; n=5390</span></td>
                    <td>ESUS &ge;60 yo (or &ge;18 with risk factor)<br /><strong>Dabigatran 150/110 mg BID vs Aspirin 100 mg</strong></td>
                    <td>Recurrent stroke: <strong>4.1%/yr vs 4.8%/yr</strong> (HR 0.85, 95% CI 0.69–1.03, p=0.10).</td>
                    <td>Major bleeding: 1.7%/year versus 1.4%/year. The trial did not meet superiority. Exploratory age/dose subgroup findings, including patients ≥75, do not establish a routine anticoagulation indication.</td>
                  </tr>
                  <tr>
                    <td><strong>ARCADIA</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>JAMA 2024 &bull; n=1015</span></td>
                    <td>Cryptogenic stroke with atrial cardiopathy: PTFV1 &gt;5000 μV·ms, NT-proBNP &gt;250 pg/mL, or indexed left-atrial diameter ≥3.0 cm/m².<br /><strong>Apixaban 5 mg twice daily (2.5 mg when indicated) versus aspirin 81 mg daily.</strong></td>
                    <td>Recurrent stroke: <strong>4.4%/yr vs 4.4%/yr</strong> (HR 1.00, 95% CI 0.64–1.55, p=0.99).</td>
                    <td>sICH: <strong>0 (apixaban) vs 7 patients (aspirin, 1.1%/yr)</strong>; other major hemorrhage 0.7%/yr vs 0.8%/yr (HR 1.02, 95% CI 0.29–3.52). <strong>Biomarker-defined atrial cardiopathy DOES NOT justify anticoagulation</strong> without documented rhythm proof of atrial fibrillation.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Cardiac Monitoring & Diagnostic Yield (amber) */}
            <CardSection color="amber" title="3. Insertable Cardiac Monitors (ICM) &amp; Arrhythmia Detection Yield">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>CRYSTAL AF (NEJM 2014)</strong>
                  <br />&bull; ICM vs Conventional follow-up in cryptogenic stroke (n=441).
                  <br />&bull; <strong>AF Detection:</strong> 8.9% vs 1.4% at 6m (HR 6.4); 12.4% vs 2.0% at 12m (HR 7.3); <strong>30.0% vs 3.0% at 36m (HR 8.8, p&lt;0.001)</strong>.
                  <br />&bull; NNT = 4 at 36 months to detect occult paroxysmal AF.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>STROKE-AF (JAMA 2021; 3-y results JAMA Neurol 2023)</strong>
                  <br />&bull; ICM in stroke attributed to large-artery atherosclerosis or small vessel disease (n=492).
                  <br />&bull; <strong>AF Detection:</strong> 12.1% vs 1.8% at 12m (HR 7.4); <strong>21.7% vs 2.4% at 36m (HR 10.0, p&lt;0.001)</strong>.
                  <br />&bull; AF was detected during follow-up even after strokes assigned to large- or small-vessel disease. Detection alone does not establish that AF caused the index stroke or that the monitoring strategy improves outcomes.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Clinical Monitoring Strategy</strong>
                  <br />&bull; <strong>Step 1:</strong> Inpatient continuous telemetry &ge;24–48h.
                  <br />&bull; <strong>Step 2:</strong> 14–30 day external adhesive cardiac patch monitor (EMBRACE trial: 16.1% vs 3.2% with 24-h Holter; AF &ge;30 s within 90 days using a 30-day event-triggered recorder).
                  <br />&bull; <strong>Longer monitoring:</strong> consider an implantable monitor when the diagnostic yield could change management, after the initial evaluation and discussion of burden, alternatives and preferences. Cryptogenic classification, HAVOC score or atrial size alone does not mandate implantation.
                </div>
              </div>
            </CardSection>

            {/* §4 Stepwise Diagnostic Pathway & Bedside Pearls (slate) */}
            <CardSection color="slate" title="4. Cryptogenic Stroke: Selecting Further Investigations">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Baseline Evaluation in Clinical Context</strong>
                  <br />&bull; CTA/MRA head &amp; neck + Brain MRI DWI.
                  <br />&bull; TTE with agitated saline bubble study.
                  <br />&bull; Telemetry &ge;24–48h; HbA1c, fasting lipids, troponin, CBC/coags.
                  <br />&bull; Choose antiplatelet and lipid-lowering therapy according to the established mechanism, atherosclerotic risk, contraindications and tolerability. ESUS alone does not prescribe one fixed drug combination.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Selected Cardiac Investigations</strong>
                  <br />&bull; <strong>TEE:</strong> consider when the suspected cardiac/aortic mechanism and likely management consequence justify it. It may identify aortic disease, LAA thrombus or interatrial abnormalities; it is not a mandatory next step for every patient.
                  <br />&bull; <strong>Cardiac Monitoring:</strong> 30-day patch or insertable cardiac monitor (ICM).
                  <br />&bull; Calculate RoPE score if PFO present.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Specialized Investigation When Indicated</strong>
                  <br />&bull; <strong>Vessel-wall MRI:</strong> consider for a specific unresolved arterial question. Findings require expert interpretation with luminal and brain imaging; this summary does not mandate one field strength or establish causality from enhancement alone.
                  <br />&bull; Pursue malignancy or thrombophilia evaluation when clinical clues justify it. D-dimer and body CT are not a universal ESUS panel; confirm relevant antiphospholipid antibodies at least 12 weeks apart when indicated.
                  <br />&bull; Genetic evaluation should follow phenotype, age and family history rather than routine testing for every unexplained stroke.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'ESUS Construct', cite: 'Hart RG et al. Lancet Neurol. 2014;13(4):429-438.', pmid: '24646875' },
              { label: 'CRYSTAL AF Trial', cite: 'Sanna T et al. N Engl J Med. 2014;370(26):2478-2486.', pmid: '24963567' },
              { label: 'STROKE-AF Trial', cite: 'Bernstein RA et al. JAMA. 2021;325(21):2169-2177.', pmid: '34061145' },
              { label: 'NAVIGATE ESUS Trial', cite: 'Hart RG et al. N Engl J Med. 2018;378(23):2191-2201.', pmid: '29766772' },
              { label: 'RE-SPECT ESUS Trial', cite: 'Diener HC et al. N Engl J Med. 2019;380(20):1906-1917.', pmid: '31091372' },
              { label: 'ARCADIA Trial', cite: 'Kamel H et al. JAMA. 2024;331(7):573-581.', pmid: '38324415' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


// =====================================================================
// MODULE — PFO Closure for Cryptogenic Stroke
// =====================================================================
const PfoClosureView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <PfoClosureCard />
  </ScaledCardWrapper>
);

export function PfoClosureCard() {
  const trials = [
    { name: 'CLOSE', meta: 'NEJM 2017 • n=663', pop: 'ASA or large shunt; age 16–60', comp: 'Closure + antiplatelet vs antiplatelet alone', result: '0 vs 14 strokes — HR 0.03 (95% CI 0–0.26), P<0.001' },
    { name: 'RESPECT (long-term)', meta: 'NEJM 2017 • n=980', pop: 'Any PFO; age 18–60; median 5.9 y', comp: 'Closure vs medical therapy', result: 'Recurrent ischemic stroke HR 0.55 (0.31–0.999), P=0.046' },
    { name: 'REDUCE', meta: 'NEJM 2017 • n=664', pop: '81% moderate/large shunt', comp: 'Closure + antiplatelet vs antiplatelet alone', result: 'Clinical stroke 1.4% vs 5.4% — HR 0.23 (0.09–0.62), P=0.002' },
    { name: 'DEFENSE-PFO', meta: 'JACC 2018 • n=120', pop: 'High-risk PFO (ASA, hypermobility, or ≥2 mm)', comp: 'Closure vs medical therapy', result: 'Primary endpoint 0% vs 12.9% (2 y), P=0.013' },
  ];
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-pfo-closure">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>PFO Closure for Cryptogenic Stroke</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              Paradoxical Embolism &bull; RoPE &amp; PASCAL Selection &bull; CLOSE / RESPECT / REDUCE / DEFENSE-PFO &bull; Device AF Trade-Off
            </p>

            {/* Hero SVG: paradoxical embolism, PASCAL benefit gradient, device AF trade-off */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 172" role="img" focusable="false" aria-label="Patent foramen ovale paradoxical embolism, PASCAL causal-likelihood benefit gradient, and device-associated atrial fibrillation trade-off" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A — paradoxical embolism through PFO */}
                <text x="118" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PARADOXICAL EMBOLISM</text>
                {/* Right atrium */}
                <path d="M 40 40 C 20 60 22 108 50 128 C 70 140 96 138 104 118 L 104 44 C 96 30 58 28 40 40 Z" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.4" />
                <text x="60" y="150" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">RA (venous clot)</text>
                {/* Left atrium */}
                <path d="M 196 40 C 216 60 214 108 186 128 C 166 140 140 138 132 118 L 132 44 C 140 30 178 28 196 40 Z" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.4" />
                <text x="176" y="150" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LA &rarr; systemic</text>
                {/* Interatrial septum with PFO flap/tunnel */}
                <line x1="118" y1="46" x2="118" y2="82" stroke="var(--ink-mute)" strokeWidth="3" strokeLinecap="round" />
                <line x1="118" y1="98" x2="118" y2="126" stroke="var(--ink-mute)" strokeWidth="3" strokeLinecap="round" />
                <text x="118" y="40" fill="var(--ink-mute)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">PFO tunnel</text>
                {/* Venous clot crossing R to L */}
                <circle cx="78" cy="90" r="7" fill="var(--purple-deep)" />
                <path d="M 88 90 L 150 90" stroke="var(--red-deep)" strokeWidth="2" markerEnd="url(#pfo-arrow)" />
                <circle cx="150" cy="90" r="7" fill="var(--red-deep)" />
                <defs>
                  <marker id="pfo-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 2 L 8 5 L 0 8 z" fill="var(--red-deep)" /></marker>
                </defs>
                <text x="118" y="108" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">R&rarr;L shunt on Valsalva</text>

                <line x1="238" y1="12" x2="238" y2="158" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B — PASCAL causal-likelihood benefit gradient */}
                <text x="360" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PASCAL BENEFIT GRADIENT (closure vs medical)</text>
                <text x="256" y="30" fill="var(--ink-mute)" fontSize="5pt" fontFamily="IBM Plex Sans" textAnchor="start">RoPE + high-risk anatomy (ASA / large shunt) &rarr;</text>
                {/* Unlikely */}
                <rect x="250" y="40" width="76" height="104" rx="5" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.2" />
                <text x="288" y="54" fill="var(--red-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">UNLIKELY</text>
                <text x="288" y="92" fill="var(--red-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HR 1.14</text>
                <text x="288" y="104" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">(0.53–2.46)</text>
                <text x="288" y="126" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">2-y ARR −0.7%</text>
                <text x="288" y="138" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">no benefit</text>
                {/* Possible */}
                <rect x="330" y="40" width="76" height="104" rx="5" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.2" />
                <text x="368" y="54" fill="var(--amber-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">POSSIBLE</text>
                <text x="368" y="92" fill="var(--amber-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HR 0.38</text>
                <text x="368" y="104" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">(0.22–0.65)</text>
                <text x="368" y="126" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">2-y ARR 2.1%</text>
                {/* Probable */}
                <rect x="410" y="40" width="76" height="104" rx="5" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.2" />
                <text x="448" y="54" fill="var(--teal-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PROBABLE</text>
                <text x="448" y="92" fill="var(--teal-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HR 0.10</text>
                <text x="448" y="104" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">(0.03–0.35)</text>
                <text x="448" y="126" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">2-y ARR 2.1%</text>
                <text x="448" y="138" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">close</text>
                <text x="368" y="156" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">PASCAL pooled IPD, 6 RCTs, n=3740</text>

                <line x1="500" y1="12" x2="500" y2="158" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel C — device AF trade-off */}
                <text x="618" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">DEVICE-ASSOCIATED AF</text>
                <rect x="512" y="24" width="212" height="134" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                {/* CLOSE bar pair */}
                <text x="534" y="40" fill="var(--ink-soft)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">CLOSE: 4.6% vs 0.9% (P=0.02)</text>
                <rect x="534" y="44" width="120" height="9" rx="2" fill="var(--amber)" />
                <rect x="534" y="44" width="24" height="9" rx="2" fill="var(--ink-mute)" opacity="0.5" />
                {/* REDUCE bar */}
                <text x="534" y="72" fill="var(--ink-soft)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">REDUCE: 6.6% after closure</text>
                <rect x="534" y="76" width="170" height="9" rx="2" fill="var(--amber-deep)" />
                {/* PASCAL AF excess by group */}
                <text x="534" y="104" fill="var(--ink-soft)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">PASCAL device-AF excess (&gt;day 45):</text>
                <text x="534" y="116" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">unlikely +4.41% &bull; possible +1.53%</text>
                <text x="534" y="126" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">probable +0.65%</text>
                <text x="534" y="146" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="start">These estimates concern AF occurring</text>
                <text x="534" y="154" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="start">after day 45; distinguish early AF.</text>
              </svg>
            </div>

            {/* §1 The clinical question & who qualifies (purple) */}
            <CardSection color="purple" title="1. The Clinical Question &amp; Who Qualifies">
              <div style={{ fontSize: '7.7pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                A PFO is present in about a quarter of adults, so finding one does not establish causation; attribution depends on the stroke phenotype and competing mechanisms. The mechanism when it IS causal is <strong>paradoxical embolism</strong> — a venous clot crossing the right-to-left shunt (accentuated by Valsalva). The strongest randomized closure evidence concerns selected patients <strong>age 18&ndash;60</strong> with a <strong>nonlacunar ischemic stroke of undetermined cause after a thorough evaluation</strong> for competing arterial, cardiac and other mechanisms. Selected older patients may be considered individually; SCAI recommendations for age 60 and above are conditional with very-low-certainty evidence, not a categorical prohibition. <strong>High-risk anatomy</strong> = an <strong>atrial septal aneurysm (ASA)</strong> or a <strong>large right-to-left shunt</strong>; confirm the PFO and grade the shunt on transesophageal echocardiography with an agitated-saline bubble study.
              </div>
            </CardSection>

            {/* §2 Selecting candidates: RoPE & PASCAL (teal) */}
            <CardSection color="teal" title="2. Selecting Candidates — RoPE Score &amp; PASCAL Classification">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '7.4pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.8pt' }}>RoPE Score (Risk of Paradoxical Embolism)</strong>
                  <br />&bull; 10-point index: points for <strong>younger age</strong> and a <strong>cortical infarct</strong>, and for the <strong>absence</strong> of hypertension, diabetes, smoking, and prior stroke/TIA.
                  <br />&bull; A <strong>higher RoPE</strong> means the PFO is more likely stroke-related: PFO-attributable fraction rises from ~0% (score 0&ndash;3) to ~90% (score 9&ndash;10).
                  <br />&bull; Paradox: high-RoPE patients also have the <strong>lowest</strong> recurrence on medical therapy (historical 2-year stroke-or-TIA recurrence ~20% in the lowest stratum vs ~2% in the highest).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.8pt' }}>PASCAL Classification</strong>
                  <br />&bull; Combines the <strong>RoPE score</strong> with <strong>high-risk anatomy</strong> (ASA or large shunt) to grade causal likelihood: <strong>unlikely / possible / probable</strong>.
                  <br />&bull; In pooled data from all 6 RCTs (n=3740) the treatment effect tracks the class: closure HR <strong>1.14</strong> (unlikely), <strong>0.38</strong> (possible), <strong>0.10</strong> (probable).
                  <br />&bull; Benefit is concentrated in <strong>possible/probable</strong>; the <strong>unlikely</strong> group had no demonstrated stroke reduction, with imprecise estimates, and a larger device-associated AF excess.
                </div>
              </div>
            </CardSection>

            {/* §3 The four positive randomized trials (red table) */}
            <CardSection color="red" title="3. The Four Positive Randomized Trials">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.8pt' }}>
                <thead>
                  <tr style={{ background: 'var(--red)' }}>
                    <th style={{ width: '96px' }}>Trial</th>
                    <th style={{ width: '150px' }}>Population</th>
                    <th style={{ width: '150px' }}>Comparison</th>
                    <th>Primary Result</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t) => (
                    <tr key={t.name}>
                      <td><strong>{t.name}</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>{t.meta}</span></td>
                      <td>{t.pop}</td>
                      <td>{t.comp}</td>
                      <td>{t.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div style={{ fontSize: '7pt', lineHeight: '1.35', color: 'var(--ink-soft)', marginTop: '5px' }}>
                All four favored closure; CLOSE and DEFENSE-PFO <strong>selected</strong> high-risk anatomy and REDUCE was enriched for moderate/large shunts (81%), whereas RESPECT enrolled any PFO (benefit emerged on extended follow-up). The earlier CLOSURE I and PC trials (the other 2 of the 6 closure-vs-medical-therapy RCTs) were neutral. CLOSE also randomized an anticoagulation arm but was underpowered for the closure-vs-anticoagulation comparison.
              </div>
            </CardSection>

            {/* §4 Closure vs antiplatelet vs anticoagulation + device AF (amber) */}
            <CardSection color="amber" title="4. Closure vs Antiplatelet vs Anticoagulation &amp; the Device-AF Trade-Off" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.5pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong>2021 AHA/ASA</strong>: for age 18&ndash;60 with a nonlacunar stroke of undetermined cause and a PFO with high-risk features, <strong>transcatheter closure + long-term antiplatelet</strong> is reasonable (<strong>COR 2a, LOE B-R</strong>); without high-risk features the benefit is not well established (<strong>COR 2b, LOE C-LD</strong>). The <strong>2024 ESO</strong> guideline concurs — high-quality evidence supports closure + antiplatelet in selected patients 18&ndash;60, using the <strong>PASCAL</strong> classification to select (those with both a large shunt AND an ASA benefit most), and <strong>suggests against long-term anticoagulation</strong> unless indicated for another reason. A separate lifelong anticoagulation indication does not automatically preclude closure. SCAI conditionally suggests closure plus lifelong anticoagulation in selected PFO-associated stroke with lifelong DVT/PE indications, with very low certainty; use shared specialist decision-making. <strong>Device-associated AF</strong> is the main trade-off (CLOSE 4.6% vs 0.9%; REDUCE 6.6% after closure) — it is mostly <strong>early/periprocedural and often transient</strong>, and per PASCAL the excess is largest in the "unlikely" group who least benefit; counsel patients and monitor after closure.
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.6pt' }} refs={[
              { label: 'CLOSE', cite: 'Mas JL et al. N Engl J Med. 2017;377(11):1011-1021.', pmid: '28902593' },
              { label: 'RESPECT (long-term)', cite: 'Saver JL et al. N Engl J Med. 2017;377(11):1022-1032.', pmid: '28902590' },
              { label: 'REDUCE', cite: 'Søndergaard L et al. N Engl J Med. 2017;377(11):1033-1042.', pmid: '28902580' },
              { label: 'DEFENSE-PFO', cite: 'Lee PH et al. J Am Coll Cardiol. 2018;71(20):2335-2342.', pmid: '29544871' },
              { label: 'RoPE Score', cite: 'Kent DM et al. Neurology. 2013;81(7):619-625.', pmid: '23864310' },
              { label: 'PASCAL Classification', cite: 'Kent DM et al. JAMA. 2021;326(22):2277-2286.', pmid: '34905030' },
              { label: 'AHA/ASA 2021 Secondary Prevention', cite: 'Kleindorfer DO et al. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
              { label: 'ESO PFO Guideline 2024', cite: 'Caso V et al. Eur Stroke J. 2024;9(4):800-834.', pmid: '38752755' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}


// =====================================================================
// DOMAIN 5: CADASIL, CARASIL & GENETIC SMALL VESSEL VASCULOPATHIES
// =====================================================================
export const CadasilCarasilView = () => {
  return (
    <PdfActionBar
      title="Genetic Small Vessel Vasculopathies (CADASIL, CARASIL, Fabry, MELAS, COL4A1)"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <CadasilCarasilCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function CadasilCarasilCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Inherited small-vessel disorders have overlapping phenotypes. Imaging patterns support a differential but do not replace phenotype-informed genetic assessment. Mitochondrial stroke-like episodes are not equivalent to arterial occlusion; seizure and metabolic assessment are central, and routine arginine efficacy remains uncertain. Reperfusion and medication decisions require disease-specific context.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cadasil-carasil">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Genetic Cerebral Small Vessel Vasculopathies</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              CADASIL (NOTCH3) &bull; CARASIL (HTRA1) &bull; Fabry Disease (GLA) &bull; MELAS (m.3243A&gt;G) &bull; COL4A1/COL4A2 SVD
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 CADASIL & CARASIL Comparative Matrix (purple) */}
            <CardSection color="purple" title="1. CADASIL vs CARASIL Comparative Diagnostic Matrix">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '85px' }}>Disorder &amp; Gene</th>
                    <th style={{ width: '75px' }}>Inheritance &amp; Age</th>
                    <th style={{ width: '150px' }}>Clinical Hallmark Triad</th>
                    <th style={{ width: '165px' }}>Neuroimaging Signature (MRI / SWI)</th>
                    <th>Diagnostic Confirmation &amp; Pitfalls</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CADASIL</strong><br /><span style={{ color: 'var(--purple-deep)' }}>NOTCH3 (19p13)</span></td>
                    <td><strong>Autosomal Dominant</strong><br />Onset: 20s–50s</td>
                    <td>1. <strong>Migraine with aura</strong> (onset ~30y)<br />2. <strong>Recurrent subcortical lacunar strokes</strong> (hypertension can coexist; onset often in mid-adulthood)<br />3. <strong>Subcortical dementia &amp; mood/apathy</strong></td>
                    <td>&bull; <strong>Anterior temporal lobe pole</strong> hyperintensity: a typical marker whose diagnostic performance depends on the comparator population; overlapping patterns occur in other inherited and sporadic small-vessel disease<br />&bull; <strong>External capsule</strong> &amp; corpus callosum WMH<br />&bull; Deep cerebral microbleeds on SWI</td>
                    <td><strong>Genetic testing:</strong> NOTCH3 exons 2–24 (EGFR repeats). Skin biopsy: Granular osmiophilic material (GOM).<br /><span style={{ color: 'var(--red-deep)' }}><strong>Migraine:</strong> triptans appear sufficiently safe for abortive therapy (2023 AHA statement; no RCT data), but US labeling contraindicates triptans after stroke/TIA; use caution with ergots. Reperfusion requires individualized assessment: safety and efficacy of thrombolysis in CADASIL remain uncertain, and AHA and EAN recommendations differ. Assess the mechanism, occlusion, bleeding burden and available options; the genetic diagnosis alone does not supply a universal treatment rule.</span></td>
                  </tr>
                  <tr>
                    <td><strong>CARASIL</strong><br /><span style={{ color: 'var(--amber-deep)' }}>HTRA1 (10q26)</span></td>
                    <td><strong>Autosomal Recessive</strong><br />Onset: Teens–30s</td>
                    <td>1. <strong>Premature alopecia</strong> (teens/20s)<br />2. <strong>Severe lumbar spondylosis</strong> &amp; disc herniations (20s)<br />3. <strong>Progressive subcortical leukoaraiosis</strong> &amp; pseudobulbar palsy</td>
                    <td>&bull; Diffuse confluent leukoencephalopathy<br />&bull; <strong>Pontine arcuate sign</strong> (hyperintense rim)<br />&bull; Multiple subcortical lacunar infarcts<br />&bull; Anterior temporal involvement can occur; its presence or absence is not diagnostic</td>
                    <td><strong>Genetic testing:</strong> Homozygous / compound heterozygous loss-of-function HTRA1 mutations.<br />Treatment is supportive: strict normotension, physical therapy. Avoid empiric anticoagulation.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §2 Fabry Disease & MELAS Precision Management (teal) */}
            <CardSection color="teal" title="2. Fabry Disease &amp; MELAS Precision Diagnostics &amp; Targeted Therapeutics">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Fabry Disease (Anderson-Fabry) &mdash; GLA Gene (Xq22)</strong>
                  <br />&bull; <strong>Pathophysiology:</strong> Alpha-galactosidase A deficiency &rarr; progressive globotriaosylceramide (Gb3/lyso-Gb3) accumulation in vascular endothelial and smooth muscle cells.
                  <br />&bull; <strong>Systemic Phenotype:</strong> Burning neuropathic acroparesthesias (triggered by heat/fever), angiokeratomas (bathing suit area), hypohidrosis, hypertrophic cardiomyopathy, renal failure.
                  <br />&bull; <strong>Stroke Presentation:</strong> Early-onset cryptogenic ischemic stroke/TIA (30s–40s) in both hemizygous males and heterozygous females; vertebrobasilar predilection.
                  <br />&bull; <strong>Fabry imaging:</strong> white-matter abnormalities and arterial changes may occur. The pulvinar T1 sign is uncommon and not a sensitive screening hallmark: it occurred in 4 of 133 patients in one primary cohort.
                  <br />&bull; <strong>Targeted Therapy:</strong> <strong>Enzyme Replacement Therapy (ERT)</strong> with Agalsidase beta (1 mg/kg IV q2w) or Agalsidase alfa; oral chaperone <strong>Migalastat</strong> for amenable mutations; antiplatelet and renin–angiotensin therapy only for their individual vascular or organ-specific indications.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>MELAS &mdash; Mitochondrial DNA MT-TL1 (m.3243A&gt;G)</strong>
                  <br />&bull; <strong>MELAS:</strong> stroke-like episodes involve neuronal, metabolic and seizure-related mechanisms. They should not be reduced to nitric-oxide depletion or assumed to represent a conventional arterial infarct.
                  <br />&bull; <strong>Clinical Phenotype:</strong> Stroke-like episodes (classically before age 40, but possible at any age; cortical blindness, aphasia, hemiparesis), focal motor/generalized seizures, lactic acidosis, short stature, sensorineural hearing loss, diabetes mellitus.
                  <br />&bull; <strong>Neuroimaging:</strong> <strong>Cortical stroke-like lesions crossing vascular arterial territories</strong> (parieto-occipital predilection); high T2/FLAIR and cortical swelling; MRS shows <strong>inverted doublet lactate peak at 1.3 ppm</strong>.
                </div>
              </div>
            </CardSection>

            {/* §3 COL4A1/COL4A2 Porencephaly & Hemorrhagic SVD (amber) */}
            <CardSection color="amber" title="3. COL4A1 / COL4A2 Vasculopathy &amp; Monogenic Hemorrhagic Risk">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Molecular Genetics &amp; Basement Membrane</strong>
                  <br />&bull; Autosomal dominant mutations in <strong>COL4A1 or COL4A2</strong> (chromosome 13q34) encoding type IV collagen alpha-1/alpha-2 chains.
                  <br />&bull; Disrupts basement membrane structural integrity, making cerebral microvessels and systemic capillaries exquisitely brittle.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Clinical &amp; Systemic Phenotype</strong>
                  <br />&bull; <strong>Brain:</strong> Congenital porencephaly, infantile hemiparesis, recurrent macro-ICH after minor head trauma, intracranial aneurysms.
                  <br />&bull; <strong>Eyes &amp; Muscles:</strong> Retinal arteriolar tortuosity, congenital cataracts, muscle cramps with elevated serum CK.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Bedside Management Guardrails</strong>
                  <br />&bull; <strong>Strict Trauma Avoidance:</strong> Avoid contact sports, chiropractic therapy, and high-impact activities.
                  <br />&bull; <strong>COL4A1/2-related small-vessel disease:</strong> EAN consensus advises against antithrombotics and IV thrombolysis in the hemorrhage-prone phenotype. This is consensus guidance with limited evidence; competing indications and distinct phenotypes require specialist assessment.
                  <br />&bull; <strong>Blood pressure:</strong> manage vascular risk with individualized guideline-based targets; avoid interpreting “aggressive” control as an unspecified very low pressure goal.
                </div>
              </div>
            </CardSection>

            {/* §4 Genetic Testing Panel Workflow & Diagnostic Pearls (slate) */}
            <CardSection color="slate" title="4. Diagnostic Algorithm &amp; Genetic Counseling Workflow">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>When to Suspect Monogenic SVD</strong>
                  <br />&bull; Early-onset stroke (&lt;50 years) without conventional cardiovascular risk factors.
                  <br />&bull; Disproportionate leukoaraiosis or microbleed burden relative to age.
                  <br />&bull; Positive family history of premature stroke, dementia, or early migraine with aura.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Next-Generation Sequencing Panels</strong>
                  <br />&bull; Select genetic testing with genetics expertise, guided by phenotype, family history and laboratory coverage. Example genes include <em>NOTCH3, HTRA1, GLA, COL4A1, COL4A2, TREX1, APP and CST3</em>; this is not a comprehensive panel.
                  <br />&bull; For suspected mitochondrial disease, choose genetic testing and tissue sampling with a specialist; heteroplasmy varies by tissue and a negative blood test may be insufficient.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Genetic Counseling &amp; Family Screening</strong>
                  <br />&bull; Pre-test and post-test genetic counseling is mandatory for autosomal dominant diseases with adult onset (CADASIL, COL4A1).
                  <br />&bull; Cascade predictive testing for at-risk first-degree relatives should be accompanied by psychological support.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'CADASIL Review', cite: 'Chabriat H et al. Lancet Neurol. 2009;8(7):643-653.', pmid: '19539236' },
              { label: 'CARASIL Landmark', cite: 'Hara K et al. N Engl J Med. 2009;360(17):1729-1739.', pmid: '19387015' },
              { label: 'Fabry Guidelines', cite: 'Ortiz A et al. Mol Genet Metab. 2018;123(4):416-427.', pmid: '29530533' },
              { label: 'MELAS Management', cite: 'Koenig MK et al. JAMA Neurol. 2016;73(5):591-594.', pmid: '26954033' },
              { label: 'COL4A1 Genetics', cite: 'Gould DB et al. Science. 2005;308(5725):1167-1171.', pmid: '15905400' },
              { label: 'EAN Monogenic cSVD Consensus', cite: 'Mancuso M et al. Eur J Neurol. 2020;27(6):909-927.', pmid: '32196841' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// DOMAIN 5: MOYAMOYA DISEASE & SURGICAL REVASCULARIZATION
// =====================================================================
export const MoyamoyaDiseaseView = () => {
  return (
    <PdfActionBar
      title="Moyamoya Disease & Moyamoya Syndrome: Medical & Surgical Revascularization"
      iconColorClass="text-teal-600 dark:text-teal-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <MoyamoyaDiseaseCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function MoyamoyaDiseaseCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Moyamoya may be unilateral or bilateral. Hemodynamic testing and angiographic stage inform assessment but do not, by themselves, mandate urgent surgery. Direct, indirect and combined revascularization are distinct strategies. Perioperative BP, ventilation and fluid management require an individualized specialist plan rather than universal numeric targets.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-moyamoya-disease">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Moyamoya Disease &amp; Moyamoya Syndrome</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Suzuki Angiographic Staging 1–6 &bull; Direct STA-MCA Bypass vs Indirect EDAS &bull; JAM Randomized Trial &bull; Perioperative Protocols
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Suzuki Angiographic Staging & Neuroimaging Pearls (purple) */}
            <CardSection color="purple" title="1. Suzuki Angiographic Classification &amp; Neuroimaging Hallmarks">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--purple)' }}>
                    <th style={{ width: '90px' }}>Suzuki Stage</th>
                    <th style={{ width: '130px' }}>Intracranial Angiographic Anatomy</th>
                    <th style={{ width: '160px' }}>Collateral Vessel Architecture</th>
                    <th>Clinical &amp; Advanced Neuroimaging Signatures</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Stage 1 &amp; 2</strong><br />(Narrowing / Initiation)</td>
                    <td>Stenosis of terminal ICA bifurcation; dilation of proximal ACA and MCA main branches.</td>
                    <td>Initial appearance of fragile, hazy basal moyamoya collateral networks at the skull base.</td>
                    <td>&bull; <strong>Ivy Sign on FLAIR:</strong> Prominent linear leptomeningeal high signal representing slow retrograde pial collateral flow.<br />&bull; Pediatric presentation: Transient hemiparesis or speech arrest precipitated by crying/hyperventilation.</td>
                  </tr>
                  <tr>
                    <td><strong>Stage 3 &amp; 4</strong><br />(Intensify / Minimize)</td>
                    <td>Severe occlusion of ACA and MCA trunks; dense, florid basal &quot;puff of smoke&quot; moyamoya vessels.</td>
                    <td>Basal collaterals begin to regress in Stage 4 as transdural external carotid (ECA) vault collaterals emerge.</td>
                    <td>&bull; <strong>Brush Sign on SWI:</strong> Engorged, dark subependymal/medullary veins due to oxygen extraction reserve.<br />&bull; <strong>Adult Presentation:</strong> Intraventricular or basal ganglia macro-ICH due to rupture of fragile microaneurysms.</td>
                  </tr>
                  <tr>
                    <td><strong>Stage 5 &amp; 6</strong><br />(Reduction / Disappearance)</td>
                    <td>Advanced narrowing or occlusion with regression of basal collaterals; unilateral disease is also recognized.</td>
                    <td>External-carotid and posterior-circulation collateral contributions vary; angiographic stage alone does not quantify reserve.</td>
                    <td>Perfusion and reserve testing can inform an individualized revascularization assessment. A Suzuki stage or an acetazolamide response alone is not a universal urgent-bypass instruction.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §2 Surgical Revascularization & JAM Trial Evidence (teal) */}
            <CardSection color="teal" title="2. Surgical Revascularization Modalities &amp; Landmark JAM Trial Evidence">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.2fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.5pt' }}>Direct STA-MCA Bypass</strong>
                  <br />&bull; End-to-side microvascular anastomosis of the frontal/parietal branch of the Superficial Temporal Artery (STA) to a recipient M4 cortical MCA branch.
                  <br />&bull; <strong>Advantages:</strong> Provides <em>immediate</em> hemodynamic augmentation; may alter collateral hemodynamics; it does not guarantee prevention of recurrent hemorrhage.
                  <br />&bull; <strong>Target Population:</strong> JAM randomized <em>hemorrhagic</em> adult moyamoya only. <span style={{ color: 'var(--red-deep)' }}>No completed randomized trial supports revascularization in adult <em>non-hemorrhagic</em> (ischemic) moyamoya</span> &mdash; practice there rests on observational series and physiologic rationale.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.5pt' }}>Indirect Synangiosis (EDAS / EMS)</strong>
                  <br />&bull; Encephalo-duro-arterio-synangiosis (EDAS) or Encephalo-myo-synangiosis (EMS): suturing vascularized galea, dural flap, or temporalis muscle to pial surface.
                  <br />&bull; <strong>Mechanism:</strong> Relies on spontaneous neoangiogenesis over 3–6 months.
                  <br />&bull; <strong>Target Population:</strong> Selection of indirect or combined revascularization requires specialist assessment.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Landmark JAM Trial (Stroke 2014)</strong>
                  <br />&bull; Multicenter RCT of 80 adults (42 surgical, 38 nonsurgical) with hemorrhagic Moyamoya randomized to bilateral direct EC-IC bypass vs conservative care.
                  <br />&bull; <strong>Primary Endpoint (all adverse events):</strong> <strong>14.3%</strong> surgical vs <strong>34.2%</strong> nonsurgical (3.2%/y vs 8.2%/y; P=0.048; HR 0.391, 95% CI 0.148–1.029).
                  <br />&bull; <strong>Secondary Endpoint (rebleeding):</strong> <strong>11.9%</strong> vs <strong>31.6%</strong> (2.7%/y vs 7.6%/y; P=0.042; HR 0.355, 95% CI 0.125–1.009). Kaplan-Meier differences were significant, but the hazard ratios were statistically marginal.
                </div>
              </div>
            </CardSection>

            {/* §3 Moyamoya Disease vs Moyamoya Syndrome Etiologies (amber) */}
            <CardSection color="amber" title="3. Moyamoya Disease (Idiopathic / RNF213) vs Moyamoya Syndrome (Secondary)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Idiopathic Moyamoya Disease</strong>
                  <br />&bull; Strong association with the <strong>RNF213</strong> p.R4810K founder variant in East Asian ancestry. Carrier frequency among cases differs markedly by population (highest in Japanese and Korean cohorts, substantially lower in Chinese cohorts); no single pooled figure applies.
                  <br />&bull; Bimodal age distribution: Peak 1 in childhood (5–10 years); Peak 2 in adults (35–45 years).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Moyamoya Syndrome (Secondary Causes)</strong>
                  <br />&bull; <strong>Sickle Cell Disease (HbSS):</strong> Chronic endothelial damage and large-vessel occlusion.
                  <br />&bull; <strong>Trisomy 21 (Down Syndrome):</strong> Recognized association (magnitude not established from a cited cohort); screen with MRA for new focal deficits.
                  <br />&bull; <strong>Neurofibromatosis Type 1 (NF1):</strong> Neurofibromin deficiency causing neurovascular dysplasia.
                  <br />&bull; <strong>Cranial Irradiation:</strong> Post-radiotherapy for pediatric medulloblastoma, optic glioma, craniopharyngioma.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Long-Term Medical Regimen</strong>
                  <br />&bull; Antiplatelet therapy may be considered in selected nonhemorrhagic disease. The evidence is largely observational or consensus based and does not prove universal prevention of microthrombosis or bypass failure.
                  <br />&bull; <span style={{ color: 'var(--red-deep)' }}><strong>Anticoagulation:</strong> Moyamoya alone is not a universal anticoagulation prohibition. A separate indication requires specialist assessment of ischemic and hemorrhagic risk; evidence for treating moyamoya itself with anticoagulation is insufficient.</span>
                </div>
              </div>
            </CardSection>

            {/* §4 Critical Perioperative Anesthetic & Critical Care Protocols (slate) */}
            <CardSection color="slate" title="4. Perioperative Anesthetic Guardrails &amp; Hyperperfusion Management">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>Hyperventilation &amp; Hypocapnia Hazard</strong>
                  <br />&bull; Cerebral vessels in Moyamoya are hypersensitive to CO2.
                  <br />&bull; Avoid inappropriate hypocapnia: vasoconstriction may impair perfusion in vulnerable territories. PaCO₂ below a single threshold does not invariably produce watershed stroke.
                  <br />&bull; <strong>Ventilation:</strong> Avoid inappropriate hypocapnia and individualize ventilation with the anesthesia team. End-tidal and arterial CO₂ are not interchangeable. Treat pain and distress without compromising ventilation or perfusion.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Hydration &amp; Hemodynamic Targets</strong>
                  <br />&bull; <strong>Volume status:</strong> Aim for individualized euvolemia. Fluid type and rate depend on examination, losses, cardiac and renal function, and the perioperative plan; this card does not prescribe a fixed maintenance multiplier.
                  <br />&bull; Avoid hypotension and set patient-specific hemodynamic goals with the treating team; a universal MAP augmentation target is not established.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Postoperative Hyperperfusion Syndrome</strong>
                  <br />&bull; High-flow direct bypass into chronically ischemic cortical territory with impaired autoregulation.
                  <br />&bull; <strong>Symptoms:</strong> Severe unilateral headache, new focal deficits, seizures, subcortical ICH (days 2–7).
                  <br />&bull; <strong>Management:</strong> New symptoms require urgent assessment for hyperperfusion, ischemia, hemorrhage, and seizures. Individualize blood-pressure management; a fixed lowering target may endanger an underperfused territory.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'JAM Trial Landmark', cite: 'Miyamoto S et al. Stroke. 2014;45(5):1415-1421.', pmid: '24668203' },
              { label: 'Suzuki Staging Classic', cite: 'Suzuki J & Takaku A. Arch Neurol. 1969;20(3):288-299.', pmid: '5775283' },
              { label: 'JSS Moyamoya Guidelines', cite: 'Research Committee on the Pathology and Treatment of Spontaneous Occlusion of the Circle of Willis. Neurol Med Chir (Tokyo). 2012;52(5):245-266.', pmid: '22870528' },
              { label: 'Scott & Smith Review', cite: 'Scott RM & Smith ER. N Engl J Med. 2009;360(12):1226-1237.', pmid: '19297575' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}



// =====================================================================
// DOMAIN 5: CANCER-ASSOCIATED STROKE & MARANTIC ENDOCARDITIS (NBTE)
// =====================================================================
export const CancerAssociatedStrokeView = () => {
  return (
    <PdfActionBar
      title="Cancer-Associated Stroke, Hypercoagulability & Marantic Endocarditis (NBTE)"
      iconColorClass="text-crit-600 dark:text-crit-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <CancerAssociatedStrokeCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function CancerAssociatedStrokeCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Cancer-associated stroke can have several competing mechanisms. Multiple-territory infarcts and elevated D-dimer can inform the assessment but do not diagnose NBTE or cancer-mediated thrombosis by themselves. Echo selection and antithrombotic treatment require the clinical context; the former numerical diagnostic gates, echo sensitivity claims and enoxaparin mini-order are unavailable.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cancer-associated-stroke">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Cancer-Associated Stroke &amp; Marantic Endocarditis (NBTE)</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Cancer-related and conventional mechanisms &bull; Multiterritory imaging &bull; Laboratory limitations &bull; NBTE assessment
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Tumor Pathophysiology & Procoagulants (purple) */}
            <CardSection color="purple" title="1. Tumor Biology &amp; Procoagulant Hypercoagulability Pathways">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>High-Risk Tumor Phenotypes</strong>
                  <br />&bull; <strong>Adenocarcinoma examples:</strong> lung adenocarcinoma, pancreatic, colorectal, gastric, ovarian and breast primaries. SCLC is a neuroendocrine carcinoma, and not all NSCLC is adenocarcinoma. Risk varies by histology, disease activity and other factors.
                  <br />&bull; <strong>Hematologic Malignancies:</strong> Multiple myeloma, AML/APL, lymphoproliferative disorders.
                  <br />&bull; Stroke risk is highest in the first 3–6 months following cancer diagnosis and in metastatic/active disease.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Direct Procoagulant Molecules</strong>
                  <br />&bull; <strong>Aberrant Mucin:</strong> Secreted by adenocarcinomas; interacts directly with P-selectin and L-selectin to trigger reciprocal platelet-leukocyte aggregation.
                  <br />&bull; <strong>Tissue Factor (TF):</strong> Tumor microparticles express active TF, initiating the extrinsic coagulation cascade.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Immune &amp; Platelet Activation</strong>
                  <br />&bull; <strong>Neutrophil Extracellular Traps (NETs):</strong> Tumor-stimulated NETosis provides a dense scaffold for fibrin mesh deposition.
                  <br />&bull; <strong>Cancer Procoagulant:</strong> Direct factor X activating cysteine protease secreted by malignant cells.
                </div>
              </div>
            </CardSection>

            {/* §2 Neuroimaging & Biomarker Diagnostic Signatures (teal) */}
            <CardSection color="teal" title="2. Diagnostic Signatures: The 3-Territory Sign &amp; Biomarkers">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '110px' }}>Diagnostic Feature</th>
                    <th style={{ width: '180px' }}>Imaging &amp; Laboratory Characteristics</th>
                    <th>Clinical Interpretation &amp; Diagnostic Utility</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>The &quot;Three-Territory Sign&quot; on DWI</strong></td>
                    <td>Simultaneous acute diffusion-restricted ischemic lesions scattered across <strong>bilateral anterior (left &amp; right MCA/ACA) and posterior (PCA/cerebellar)</strong> vascular distributions.</td>
                    <td>Multiple-territory lesions can support a systemic embolic or coagulopathic hypothesis but are not specific for cancer. The cited 84% involved at least two territories in a selected 32-patient cohort, not the prevalence of the three-territory sign. This pattern does not independently exclude competing atherosclerotic disease.</td>
                  </tr>
                  <tr>
                    <td><strong>Markedly Elevated D-Dimer</strong></td>
                    <td>D-dimer can be elevated in cancer-associated hypercoagulability but is nonspecific and assay dependent. No standalone diagnostic cutoff is supplied here.</td>
                    <td>The selected Schwarzbach 2015 cohort reported mean D-dimer 15.4 ± 10.8 µg/mL. This is a cohort description, not a diagnostic threshold, and does not exclude VTE or other causes.</td>
                  </tr>
                  <tr>
                    <td><strong>Low-Grade Consumptive Coagulopathy</strong></td>
                    <td>Consumptive coagulopathy requires clinical assessment and serial platelet count, coagulation studies, fibrinogen, and fibrin-related markers. A single numeric constellation does not establish DIC.</td>
                    <td>Interpret serial results with a validated DIC framework and hematology input when appropriate; thrombosis and bleeding can coexist.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Non-Bacterial Thrombotic Endocarditis (NBTE) Management (amber) */}
            <CardSection color="amber" title="3. Non-Bacterial Thrombotic Endocarditis (NBTE / Marantic Endocarditis)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Pathology &amp; Valve Distribution</strong>
                  <br />&bull; Sterile nodular vegetations composed of dense platelet-fibrin thrombi deposited along the coaptation lines of cardiac valves (<strong>Mitral &gt; Aortic</strong>).
                  <br />&bull; Sterile platelet-fibrin vegetations are characteristic, but clinical evaluation must exclude infective and other valve disease.
                  <br />&bull; Blood cultures are part of the evaluation; negative cultures alone do not distinguish NBTE from culture-negative infective endocarditis.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Echocardiography Modality Choice</strong>
                  <br />&bull; <strong>Transthoracic Echo (TTE):</strong> May miss small NBTE vegetations; diagnostic performance depends on the lesion and study conditions.
                  <br />&bull; <strong>Transesophageal Echo (TEE):</strong> Consider TEE when suspected NBTE remains clinically relevant despite a nondiagnostic TTE and the result would change care. No universal cancer-stroke mandate or portable sensitivity estimate is established here.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>First-Line Pharmacotherapy</strong>
                  <br />&bull; <strong>Therapeutic LMWH:</strong> The choice and dose require a full prescription review, including renal function, weight, platelet count, bleeding risk, and indication. The TEACH pilot RCT (enoxaparin vs aspirin; PMID 29309496) assessed feasibility only, and supporting trial data for therapeutic anticoagulation in NBTE are lacking.
                  <br />&bull; Heparin inhibits thrombin and factor Xa through antithrombin; it is not a direct thrombin inhibitor. Proposed selectin–mucin effects do not establish a universal clinical treatment advantage.
                </div>
              </div>
            </CardSection>

            {/* §4 Anticoagulation Selection & Acute Reperfusion (slate) */}
            <CardSection color="slate" title="4. Antithrombotic Selection (LMWH vs DOACs) &amp; Acute Reperfusion">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>LMWH vs DOAC Selection</strong>
                  <br />&bull; <strong>Match treatment to mechanism:</strong> NBTE, AF, VTE, overt DIC and otherwise cryptogenic stroke are distinct indications. Choose antithrombotic therapy with the stroke, oncology and hematology teams; bleeding, platelet count, kidney function, active mucosal lesions and drug interactions matter.
                  <br />&bull; Evidence for cancer-associated arterial stroke should not be inferred automatically from cancer-associated VTE trials or the presence of a stable solid tumor.
                  <br />&bull; For cryptogenic (possible cancer-related) stroke, equipoise exists between anticoagulant and antiplatelet therapy; neither has been shown superior (TEACH pilot RCT; ARCADIA cancer subgroup post hoc analysis).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Endovascular Thrombectomy (EVT)</strong>
                  <br />&bull; <strong>Effective for LVO in Cancer:</strong> Recanalization (TICI 2b/3) and sICH rates are similar to non-cancer patients, but mortality is higher and functional independence lower; decide individually, weighing goals of care and cancer prognosis.
                  <br />&bull; Clot histology often demonstrates high platelet-fibrin and leukocyte content (white clots).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>IV Thrombolysis Precautions</strong>
                  <br />&bull; Review imaging for brain metastases; if present, IVT is generally advised against (especially with hemorrhage-prone histologies such as melanoma, RCC, choriocarcinoma, thyroid). Cancer itself is not a contraindication.
                  <br />&bull; Platelet threshold: Must be &ge;100,000/&micro;L.
                  <br />&bull; Assess suspected coagulopathy using the complete current IV thrombolysis eligibility guidance and drug label, including anticoagulant exposure and laboratory context. This summary supplies no independent fibrinogen eligibility threshold.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: '2026 Cancer Stroke Statement', cite: 'Navi BB et al. Stroke. 2026.', pmid: '41623113' },
              { label: 'TEACH Trial (LMWH Pilot)', cite: 'Navi BB et al. JAMA Neurol. 2018;75(3):379-381.', pmid: '29309496' },
              { label: 'NBTE Surgical Pathology Series (n=30)', cite: 'Eiken PW et al. Mayo Clin Proc. 2001;76(12):1204-1212.', pmid: '11761501' },
              { label: 'Cancer Stroke Risk Study', cite: 'Navi BB et al. J Am Coll Cardiol. 2017;70(8):926-938.', pmid: '28818202' },
              { label: 'Cancer Stroke DWI Phenotype', cite: 'Schwarzbach CJ et al. Cerebrovasc Dis Extra. 2015;5(3):139-145.', pmid: '26648971' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}



// =====================================================================
// DOMAIN 1: DISTAL MEDIUM VESSEL OCCLUSIONS (DMVO / MeVO)
// =====================================================================
export const DmvoMevoManagementView = () => {
  return (
    <PdfActionBar
      title="Distal Medium Vessel Occlusions (DMVO / MeVO) Management"
      iconColorClass="text-cobalt-600 dark:text-cobalt-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <DmvoMevoManagementCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function DmvoMevoManagementCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Separate IV thrombolysis eligibility from EVT selection. The 2025 medium/distal occlusion trials did not support routine EVT across their enrolled populations. A dominant proximal M2 exception has specific guideline criteria; disabling symptoms or vessel caliber alone do not establish benefit. Newer selected-population trials should not be generalized to every A2, M3 or P2 occlusion.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-dmvo-mevo-management">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Distal Medium Vessel Occlusions (DMVO / MeVO)</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              DISTAL &bull; ESCAPE-MeVO &bull; CHOICE-2 &bull; 2026 AHA AIS Guideline &bull; M2/M3, A2/A3, P2/P3 Selection Algorithm
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Anatomical Classification & Caliber (purple) */}
            <CardSection color="purple" title="1. Anatomical Patterns and Their Limits">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Middle Cerebral Artery (MCA)</strong>
                  <br />&bull; <strong>M2 (Sylvian/Insular):</strong> Dominant and codominant branches vary in caliber and supplied territory; branch dominance is not defined by one diameter range.
                  <br />&bull; <strong>M3 (Opercular):</strong> Opercular branches; individual caliber and branching vary.
                  <br />&bull; <strong>M4 (Cortical):</strong> Cortical surface branches; no universal submillimeter treatment boundary is defined here.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Anterior &amp; Posterior Branches (ACA/PCA)</strong>
                  <br />&bull; <strong>ACA A2/A3 segments:</strong> associated branch territories may include medial frontal and leg motor regions; segment and named branch are not interchangeable.
                  <br />&bull; <strong>PCA P2/P3 segments:</strong> deficits depend on the affected branches and can include visual, language or memory impairment; these are possible patterns, not required findings.
                  <br />&bull; Smaller, more tortuous vessels can increase technical difficulty. A single diameter cutoff does not establish a validated perforation-risk estimate or treatment rule.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Epidemiology &amp; Burden</strong>
                  <br />&bull; Reported frequency depends on the vessel definition, imaging and population; no single prevalence range is used here.
                  <br />&bull; Disability at 90 days is not necessarily permanent. A low initial NIHSS does not exclude important functional impairment.
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark Randomized Trials (teal) */}
            <CardSection color="teal" title="2. Landmark RCT Evidence (DISTAL, ESCAPE-MeVO, DISCOUNT, ORIENTAL-MeVO, CHOICE-2)">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '130px' }}>Trial / Study</th>
                    <th style={{ width: '150px' }}>Population &amp; Inclusion</th>
                    <th style={{ width: '180px' }}>Primary Efficacy Endpoint</th>
                    <th>Safety / Hemorrhage &amp; Takeaway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>DISTAL Trial</strong><br />(NEJM 2025; PMID: 39908430)</td>
                    <td>Isolated MeVO (non-dominant/co-dominant M2, M3/M4, A1–A3, P1–P3) within 24h (6–24-hour enrollment required imaging evidence of salvageable tissue); n=543 (median age 77, median NIHSS 6, IVT in 65.4%) randomized to EVT + best medical treatment vs best medical treatment alone.</td>
                    <td><strong>Neutral:</strong> No difference in 90-day mRS distribution (common OR for improvement 0.90; 95% CI 0.67–1.22; P=0.50). All-cause mortality 15.5% vs 14.0%.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH numerically higher with EVT:</strong> 5.9% vs 2.6% (best medical treatment). 12-month outcomes remained neutral (Lancet Neurol 2026; PMID: 42105785). Routine unselected EVT is not supported.</span></td>
                  </tr>
                  <tr>
                    <td><strong>ESCAPE-MeVO</strong><br />(NEJM 2025; PMID: 39908448)</td>
                    <td>MeVO within 12h of last-known-well with favorable baseline non-invasive brain imaging; n=530 enrolled across five countries.</td>
                    <td><strong>Neutral:</strong> 90-day mRS 0–1 in 106/255 (41.6%) with EVT vs 118/274 (43.1%) with usual care (adjusted rate ratio 0.95; 95% CI 0.79–1.15; P=0.61).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH:</strong> 5.4% in EVT group vs 2.2% in control group. 90-day mortality 13.3% vs 8.4% (adjusted HR 1.82; 95% CI 1.06–3.12). Unselected thrombectomy in minor/moderate MeVO stroke carries procedural risk without net benefit.</span></td>
                  </tr>
                  <tr>
                    <td><strong>CHOICE &amp; CHOICE-2</strong><br />(JAMA 2022 / 2026; PMIDs: 35143603, 42096239)</td>
                    <td>Adjunctive intra-arterial (IA) Alteplase 0.225 mg/kg after thrombectomy within 24h with eTICI 2b50–3: CHOICE max 22.5 mg over 15–30 min; CHOICE-2 max 20 mg over 15 min.</td>
                    <td><strong>CHOICE</strong> (phase 2b, stopped early; authors call findings preliminary): mRS 0–1 59.0% vs 40.4% (adjusted risk difference 18.4%; 95% CI 0.3%–36.4%; P=.047). <strong>CHOICE-2:</strong> mRS 0–1 57.5% vs 42.5% (aRD 15.0%; 95% CI 5.7%–24.3%; P=.002), but 90-day mortality 12.1% vs 6.4% (aRD 5.9%; P=.03).</td>
                    <td><span style={{ color: '#166534' }}>sICH: CHOICE 0% vs 3.8%; CHOICE-2 1.4% vs 0.5% (aOR 3.10; 95% CI 0.32–30.0; P=.33). Downstream thrombus clearance is a proposed mechanism; perfusion findings do not directly prove that mechanism in every patient.</span> <span style={{ color: 'var(--red-deep)' }}><strong>Note:</strong> CHOICE-2 enrolled <strong>LVO patients with successful EVT — NOT MeVO</strong> — so it does not inform MeVO EVT decisions, and its higher 90-day mortality warrants caution.</span></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Disabling Deficit Evaluation & Patient Selection (amber) */}
            <CardSection color="amber" title="3. Disabling Deficit Evaluation &amp; Patient Selection Pathway">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The "Low NIHSS Disabling" Paradox</strong>
                  <br />&bull; <strong>NIHSS Limitation:</strong> A low NIHSS can coexist with a disabling deficit; assess function rather than assigning a universal score range to MeVO.
                  <br />&bull; <strong>Disabling Criteria:</strong>
                  <br />&nbsp;&nbsp;&ndash; Complete expressive or receptive aphasia (M2/M3 superior/inferior).
                  <br />&nbsp;&nbsp;&ndash; Complete homonymous hemianopia (P2/P3 or M2 optic radiation).
                  <br />&nbsp;&nbsp;&ndash; Severe isolated hand weakness / plegia ("hand knob" cortical branch).
                  <br />&nbsp;&nbsp;&ndash; Severe spatial neglect / anosognosia.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>2026 AHA/ASA AIS Guideline Recommendation</strong>
                  <br />&bull; <strong>IV thrombolysis:</strong> eligible disabling ischemic stroke within the guideline window is a distinct decision from EVT. TNK stroke dosing is 0.25 mg/kg, maximum 25 mg, with full eligibility and contraindication checks. TEMPO-2 enrolled NIHSS 0–5 with intracranial occlusion and included some disabling deficits; it did not establish routine benefit in its minor-stroke population and should not be labeled exclusively nondisabling.
                  <br />&bull; <strong>Endovascular Thrombectomy:</strong> EVT for <strong>nondominant/codominant M2, distal MCA, ACA, or PCA</strong> occlusion is <strong>not recommended</strong> (Class III: No Benefit, LOE A). EVT for a <strong>dominant proximal M2</strong> occlusion within 6h (prestroke mRS 0–1, NIHSS &ge;6, ASPECTS &ge;6) is reasonable, though benefits are uncertain (Class IIa, LOE B-NR). Later 2026 RCTs were mixed (ORIENTAL-MeVO positive in NIHSS &ge;6 within 24h; DISCOUNT stopped for futility with more sICH) and do not by themselves revise these recommendations.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Collateral &amp; Perfusion Imaging</strong>
                  <br />&bull; <strong>Perfusion imaging:</strong> estimates of core and hypoperfusion depend on acquisition, processing and clinical context. No universal 10–15 mL core threshold establishes MeVO EVT eligibility.
                  <br />&bull; <strong>Leptomeningeal Collaterals:</strong> Robust pial collaterals buy time; poor collaterals predict rapid core expansion.
                </div>
              </div>
            </CardSection>

            <CardSection color="slate" title="4. Procedural Safety and Evidence Limits">
              <p>Distal-vessel intervention requires specialist selection, device-specific instructions and an experienced neurointerventional team. The former generic device sizes, pass cap, intra-arterial vasodilator doses and perforation-rescue sequence are unavailable because they were not substantiated as a complete safe cross-device guide.</p>
              <p>Trial eligibility and technical success are distinct from evidence of clinical benefit; an isolated vessel caliber or perfusion number is not an indication to intervene.</p>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'DISTAL Trial', cite: 'Psychogios M et al. N Engl J Med. 2025;392(14):1374-1384.', pmid: '39908430' },
              { label: 'DISTAL 12-Month', cite: 'Fischer U et al. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
              { label: 'ESCAPE-MeVO Trial', cite: 'Goyal M et al. N Engl J Med. 2025;392(14):1385-1395.', pmid: '39908448' },
              { label: 'CHOICE Trial', cite: 'Renú A et al. JAMA. 2022;327(9):826-835.', pmid: '35143603' },
              { label: 'CHOICE-2 Trial', cite: 'Renú A et al. JAMA. 2026.', pmid: '42096239' },
              { label: 'TEMPO-2 Trial', cite: 'Coutts SB et al. Lancet. 2024;403(10444):2597-2605.', pmid: '38768626' },
              { label: 'AHA/ASA 2026 AIS Guideline', cite: 'Prabhakaran S et al. Stroke. 2026.', pmid: '41582814' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}



// =====================================================================
// DOMAIN 2: ACUTE ICH BLOOD PRESSURE & EXPANSION MITIGATION
// =====================================================================
export const IchBloodPressureView = () => {
  return (
    <PdfActionBar
      title="Acute ICH Expansion Mitigation & Blood Pressure Management"
      iconColorClass="text-crit-600 dark:text-crit-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <IchBloodPressureCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function IchBloodPressureCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>For mild-to-moderate spontaneous ICH with presenting SBP 150–220 mmHg, the AHA guideline supports a target near 140 with maintenance around 130–150 when appropriate. Large or severe ICH, surgery and compromised cerebral perfusion require individualization. INTERACT3 studied a bundled intervention; its results do not isolate the effect of each component.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-ich-blood-pressure">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Acute ICH Blood Pressure &amp; Expansion Mitigation</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              INTERACT-2/3 &bull; ATACH-2 &bull; ENRICH &bull; TRIDENT &bull; SWITCH &bull; 2022 AHA/ASA ICH Guidelines &bull; SBP 140 Target (range 130–150)
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Hyperacute Blood Pressure Protocol (purple) */}
            <CardSection color="purple" title="1. Hyperacute Blood Pressure Protocol &amp; The Renal Safety Floor">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Target Blood Pressure Window</strong>
                  <br />&bull; <strong>Primary Target (Class IIb, LOE B-R):</strong> SBP <strong>140 mmHg</strong>, maintained in the <strong>130–150 mmHg</strong> range, reached smoothly within <strong>1 hour</strong>. Scope: mild-to-moderate ICH presenting with SBP 150&ndash;220 mmHg. <span style={{ color: 'var(--red-deep)' }}>Lowering to SBP &lt;130 mmHg is Class III: Harm.</span>
                  <br />&bull; Maintain smooth, sustained SBP control in the <strong>130–150 mmHg</strong> range, avoiding peaks, large variability, and SBP &lt;130 mmHg.
                  <br />&bull; Use frequent, reliable BP measurements and monitoring appropriate to the drug, acuity and clinical trajectory; arterial monitoring is a clinical decision rather than a universal requirement in every case.
                  <br />&bull; <strong style={{ color: 'var(--red-deep)' }}>Prehospital caveat:</strong> this target applies <strong>after CT confirms ICH</strong>. In undifferentiated suspected stroke, <strong>INTERACT4</strong> (NEJM 2024) found ambulance BP lowering <strong>helped hemorrhagic stroke (cOR 0.75)</strong> but <strong>harmed cerebral ischemia (cOR 1.30)</strong> &mdash; routine empiric stroke-specific lowering before imaging is not supported. Separate compelling indications, such as another hypertensive emergency, require their own assessment and treatment.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>ATACH-2 Safety Floor (Avoid SBP &lt;130)</strong>
                  <br />&bull; In ATACH-2 (PMID: 27276234), ultra-intensive lowering (SBP 110–139 mmHg) showed <strong>no functional benefit</strong> and significantly increased <strong>renal adverse events (9.0% vs 4.0%; p=0.002)</strong>.
                  <br />&bull; Avoid abrupt or excessive lowering and reassess cerebral, coronary and renal perfusion. This summary does not establish universal hourly-drop or diastolic stop thresholds.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Antihypertensive Prescribing Context</strong>
                  <p>Use an appropriately titratable agent with a complete monitored prescription. Choice, starting dose, increments, interval, maximum exposure and contraindications depend on the drug and patient.</p>
                  <p>The abbreviated nicardipine, clevidipine and labetalol recipes are unavailable. Clevidipine's rapid initial titration must not be repeated indefinitely near the target; follow current prescribing information and local monitored practice.</p>
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark Clinical Trials (teal) */}
            <CardSection color="teal" title="2. Landmark Clinical Trials (INTERACT-2/3, ATACH-2, TRIDENT, FASTEST)">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '120px' }}>Trial</th>
                    <th style={{ width: '160px' }}>Intervention / Protocol</th>
                    <th style={{ width: '180px' }}>Key Findings &amp; Outcomes</th>
                    <th>Clinical Guideline Takeaway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>INTERACT-2</strong><br />(NEJM 2013; PMID: 23713578)</td>
                    <td>Intensive SBP &lt;140 mmHg within 1h vs standard &lt;180 mmHg in acute ICH &lt;6h; n=2,839.</td>
                    <td>Primary outcome (mRS 3–6 at 90 days) neutral: 52.0% vs 55.6% (OR 0.87; 95% CI 0.75–1.01; p=0.06). Prespecified ordinal analysis favoured intensive treatment (OR 0.87; 95% CI 0.77–1.00; p=0.04). No excess adverse events.</td>
                    <td><span style={{ color: '#166534' }}>Established the safety of an SBP &lt;140 mmHg target in hyperacute ICH, with a favourable ordinal signal on function.</span></td>
                  </tr>
                  <tr>
                    <td><strong>INTERACT3</strong><br />(Lancet 2023; PMID: 37245517)</td>
                    <td>INTERACT3: 7036 patients in a stepped-wedge bundle trial. Targets included SBP under 140 within an hour of starting treatment, glucose 6.1–7.8 mmol/L without diabetes or 7.8–10 mmol/L with diabetes, temperature under 37.5°C and VKA INR correction; targets were maintained for seven days or earlier discharge/death.</td>
                    <td><strong>Favourable ordinal shift in mRS at 6 months:</strong> common OR 0.86 (95% CI 0.76–0.97; p=0.015); fewer serious adverse events (16.0% vs 20.1%; p=0.0098).</td>
                    <td>The published calendar-time analysis favored the bundle. The original trial-period model was neutral; the post-unmasking model change limits interpretation, and the trial does not isolate individual bundle components.</td>
                  </tr>
                  <tr>
                    <td><strong>TRIDENT Trial</strong><br />(NEJM 2026; PMID: 42019018)</td>
                    <td>Fixed-dose telmisartan/amlodipine/indapamide vs placebo in clinically stable prior-ICH participants with baseline SBP 130–160 mmHg. Randomization followed a two-week active triple-pill run-in; results should not be assumed to apply to every patient starting these drugs.</td>
                    <td>Sustained ~11 mmHg SBP difference (mean 127 vs 138 mmHg on follow-up); recurrent stroke 4.6% vs 7.4% (HR 0.61; 95% CI 0.41–0.92; p=0.02). Early discontinuation for adverse events 13.6% vs 6.0%, most often a &ge;20% creatinine rise.</td>
                    <td><span style={{ color: '#166534' }}>Adding a low-dose triple pill to standard care after ICH (baseline SBP 130–160 mmHg) lowered follow-up SBP (127 vs 138 mmHg) and recurrent stroke; the 2022 AHA/ASA guideline considers long-term BP lowering to 130/80 mmHg reasonable (Class 2a), with individual tolerability and clinical context.</span></td>
                  </tr>
                  <tr>
                    <td><strong>FASTEST Trial</strong><br />(Lancet 2026; PMID: 41653933)</td>
                    <td>Ultra-early recombinant Factor VIIa (rFVIIa) within 2 hours of spontaneous ICH onset.</td>
                    <td><strong>Stopped for futility.</strong> No functional benefit at 180d (adjusted common OR 1.09; 95% CI 0.79–1.51; p=0.61) despite reduced hematoma growth (&minus;3.7 mL); life-threatening thromboembolic events 15 (&lt;5%) vs 4 (1%), RR 3.41 (95% CI 1.14–10.15; p=0.020).</td>
                    <td>rFVIIa has not established routine functional benefit in spontaneous ICH. Further selection strategies are research questions, not an established prescribing pathway.</td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Surgical Evacuation & Minimally Invasive Surgery (amber) */}
            <CardSection color="amber" title="3. Surgical Evacuation, Minimally Invasive Surgery (ENRICH) &amp; Craniectomy (SWITCH)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>ENRICH Trial: MIPS for Lobar ICH</strong>
                  <br />&bull; <strong>Design (NEJM 2024; PMID: 38598795):</strong> Early Minimally Invasive Parafascicular Surgery (MIPS) within 24h vs medical management for selected lobar or anterior basal ganglia ICH (volume 30–80 mL); enrollment later continued only in the lobar stratum.
                  <br />&bull; <strong>Overall Result:</strong> 180-day utility-weighted mRS <strong>0.458 vs 0.374</strong> (difference 0.084; 95% CrI 0.005&ndash;0.163; posterior probability of superiority 0.981); 30-day mortality 9.3% vs 18.0%.
                  <br />&bull; <strong>Effect Driven by Lobar ICH:</strong> lobar difference 0.127 (95% CrI 0.035&ndash;0.219); anterior basal ganglia neutral (&minus;0.013; 95% CrI &minus;0.147 to 0.116).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>SWITCH Trial: Decompressive Surgery</strong>
                  <br />&bull; <strong>SWITCH:</strong> decompressive craniectomy plus medical care versus medical care alone in selected stable deep supratentorial ICH, age 18–75, volume 30–100 mL, GCS 8–13 and NIHSS 10–30; randomization within 66 hours and surgery within 6 hours of randomization. Deteriorating GCS was not a required trial criterion.
                  <br />&bull; <strong>Result:</strong> Primary outcome was mRS 5&ndash;6 at 180 days: 44% (42/95) with decompressive craniectomy vs 58% (55/95) with best medical treatment &mdash; adjusted RR 0.77 (95% CI 0.59&ndash;1.01), adjusted risk difference &minus;13% (95% CI &minus;26 to 0), <strong>p=0.057, not statistically significant</strong>. Stopped early for lack of funding; the authors describe this as weak evidence. Severe disability was common among survivors in both arms, but it was not a universal outcome.
                  <br />&bull; May be considered to reduce mortality (2022 AHA/ASA COR 2b) in supratentorial ICH with coma, a large hematoma with significant midline shift, or ICP refractory to medical management; benefit for functional outcome is uncertain, and SWITCH provides only weak evidence.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Cerebellar Hemorrhage Rules</strong>
                  <br />&bull; <strong>Immediate Suboccipital Decompression (COR 1):</strong> For cerebellar ICH with <strong>neurological deterioration, brainstem compression, and/or obstructive hydrocephalus</strong>. Diameter &gt;3 cm is a traditional risk marker prompting close monitoring and early neurosurgical involvement, not itself the guideline criterion. The 2022 AHA/ASA COR 1 recommendation also lists cerebellar ICH <strong>volume &ge;15 mL</strong> as an indication for immediate evacuation (&plusmn; EVD) to reduce mortality. In Kuramatsu (JAMA 2019; PMID 31593272), evacuation was associated with better survival at &ge;15 mL but worse functional outcome at &le;12 mL, and not with better functional outcome overall.
                  <br />&bull; Selected cerebellar ICH with deterioration, brainstem compression, obstructive hydrocephalus or volume ≥15 mL warrants urgent evacuation assessment, with or without EVD. EVD-alone concerns depend on posterior fossa anatomy and perfusion; a universal craniectomy mandate for all hydrocephalus is inappropriate.
                </div>
              </div>
            </CardSection>

            {/* §4 Expansion Predictors & Neurocritical Management (slate) */}
            <CardSection color="slate" title="4. Expansion Imaging Predictors &amp; Neurocritical Care Bundle">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Imaging Markers of Expansion</strong>
                  <br />&bull; <strong>CTA Spot Sign:</strong> Contrast extravasation into the hematoma. PREDICT reported sensitivity 51%, specificity 85%, PPV 61%, NPV 78% &mdash; a <strong>negative spot sign does NOT exclude expansion</strong>.
                  <br />&bull; <strong>Non-Contrast CT Signs:</strong> hematoma heterogeneity signs are proposed expansion-risk markers; they do not by themselves prove active bleeding in an individual patient.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Anticoagulation Reversal Speed</strong>
                  <br />&bull; <strong>Warfarin:</strong> 4F-PCC plus IV vitamin K when indicated; use the complete INR- and weight-based regimen, including maximum dose and repeat laboratory assessment.
                  <br />&bull; <strong>Factor Xa inhibitors:</strong> 4F-PCC per the approved local reversal pathway. Andexanet US sales ended in December 2025 after the FDA safety update.
                  <br />&bull; <strong>Dabigatran:</strong> Idarucizumab 5 g IV when indicated; arrange reversal urgently. A universal 60-minute treatment target is not established by the drug label or the cited trial.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Neurocritical Care Guardrails</strong>
                  <br />&bull; Positioning and head elevation require individual assessment of cerebral perfusion, airway/aspiration risk and other clinical constraints; this summary sets no universal angle.
                  <br />&bull; <strong>Seizures:</strong> Treat clinical seizures; continuous EEG for unexplained stupor. Prophylactic ASMs not routinely recommended.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'INTERACT-2', cite: 'Anderson CS et al. N Engl J Med. 2013;368(25):2355-2365.', pmid: '23713578' },
              { label: 'ATACH-2', cite: 'Qureshi AI et al. N Engl J Med. 2016;375(11):1033-1043.', pmid: '27276234' },
              { label: 'INTERACT3', cite: 'Ma L et al. Lancet. 2023;402(10395):27-40.', pmid: '37245517' },
              { label: 'INTERACT4', cite: 'Li G et al. N Engl J Med. 2024;390(20):1862-1872.', pmid: '38752650' },
              { label: 'ENRICH Trial', cite: 'Pradilla G et al. N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
              { label: 'TRIDENT Trial', cite: 'Anderson CS et al. N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
              { label: 'FASTEST Trial', cite: 'Broderick JP et al. Lancet. 2026;407(10530):773-783.', pmid: '41653933' },
              { label: 'SWITCH Trial', cite: 'Beck J et al. Lancet. 2024;403(10442):2395-2404.', pmid: '38761811' },
              { label: '2022 ICH Guideline', cite: 'Greenberg SM et al. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}



// =====================================================================
// DOMAIN 3: METABOLIC & VASCULAR RISK MODULATION
// =====================================================================
export const MetabolicStrokePreventionView = () => {
  return (
    <PdfActionBar
      title="Metabolic & Vascular Risk Modulation in Stroke Prevention"
      iconColorClass="text-teal-600 dark:text-teal-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <MetabolicStrokePreventionCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function MetabolicStrokePreventionCard() {
  const renderSVG = () => (
    <aside className="education-key-points rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-label="Key clinical boundaries">
      <strong>Key clinical boundaries</strong>
      <p>Use indication-specific antithrombotic treatment and individualized blood pressure, lipid, glycemic and weight-management goals. Treatment benefits differ by drug, dose, population and endpoint. A positive cardiovascular or weight-loss trial is not automatically a secondary-stroke-prevention indication for every patient.</p>
    </aside>
  );
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-metabolic-stroke-prevention">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Metabolic &amp; Vascular Risk Modulation</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              GLP-1 RA (SELECT, FLOW, SUSTAIN-6) &bull; SGLT2i &bull; SPRINT &bull; TRIDENT &bull; Secondary Prevention ABCDE Protocol
            </p>

            <div className="education-summary" style={{ marginBottom: '12px' }}>
              {renderSVG()}
            </div>

            {/* §1 Incretin Therapies: GLP-1 RA & Dual GIP/GLP-1 Agonists (purple) */}
            <CardSection color="purple" title="1. Modern Incretin Therapies (GLP-1 Receptor Agonists &amp; GIP/GLP-1 Co-Agonists)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>SELECT Trial: Obesity Without Diabetes</strong>
                  <br />&bull; <strong>Design (NEJM 2023; PMID: 37952131):</strong> Semaglutide 2.4 mg SC weekly vs placebo in 17,604 non-diabetic patients with preexisting CVD and BMI &ge;27.
                  <br />&bull; <strong>Primary Outcome:</strong> <strong>20% reduction in MACE</strong> (HR 0.80; 95% CI 0.72–0.90; p&lt;0.001) &mdash; nonfatal stroke was one component of this composite, not a confirmatory endpoint, so no stroke-specific reduction was established.
                  <br />&bull; <strong>Weight Loss:</strong> Mean 9.4% weight loss at 104 weeks (10.2% at week 208), with concurrent drops in hs-CRP (&minus;37%) and blood pressure.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>FLOW &amp; SUSTAIN-6 Trials (Type 2 Diabetes)</strong>
                  <br />&bull; <strong>FLOW (NEJM 2024; PMID: 38785209):</strong> Semaglutide 1.0 mg in T2D + CKD reduced kidney disease progression and cardiovascular death by <strong>24% (HR 0.76)</strong>.
                  <br />&bull; <strong>SUSTAIN-6 (NEJM 2016; PMID: 27633186):</strong> Demonstrated a <strong>39% relative reduction in nonfatal stroke (1.6% vs 2.7%; HR 0.61, 95% CI 0.38–0.99; p=0.04)</strong> in T2D patients with high CV risk.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Tirzepatide &amp; Next-Gen Incretins</strong>
                  <br />&bull; <strong>Tirzepatide:</strong> SURMOUNT-1 reported mean weight loss of 20.9% with 15 mg at 72 weeks in its obesity population; effects differed by dose and study. Do not generalize that magnitude to every GIP/GLP-1 drug or every patient.
                  <br />&bull; Retatrutide (Triple GGG) in Phase 3 trials.
                </div>
              </div>
            </CardSection>

            {/* §2 SGLT2 Inhibitors & Cardiorenal Synergy (teal) */}
            <CardSection color="teal" title="2. SGLT2 Inhibitors &amp; Renocardiovascular Multi-Organ Protection">
              <div className="clinical-scroll-region" role="region" aria-label="Clinical comparison table; scroll horizontally if needed" tabIndex={0}><table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '130px' }}>Drug Class / Agent</th>
                    <th style={{ width: '160px' }}>Cardiorenal Mechanisms</th>
                    <th style={{ width: '170px' }}>Landmark Trial Evidence</th>
                    <th>Stroke Prevention &amp; Clinical Synergy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>SGLT2 Inhibitors</strong><br />(Empagliflozin, Dapagliflozin)</td>
                    <td>SGLT2 inhibition reduces renal glucose and sodium reabsorption. Blood-pressure and other physiological effects vary with the agent and population; the named trials define the clinical outcome evidence.</td>
                    <td><strong>EMPA-REG, DAPA-CKD, DELIVER:</strong> 35% relative reduction in heart failure hospitalization (EMPA-REG), kidney composite HR 0.56 (DAPA-CKD), and worsening heart failure HR 0.79 in HFmrEF/HFpEF (DELIVER).</td>
                    <td>Use agent-specific cardiovascular and renal indications. Mechanistic hypotheses do not establish prevention of subclinical AF or a universal benefit from combining drug classes.</td>
                  </tr>
                  <tr>
                    <td><strong>Intensive BP Lowering</strong><br />(SPRINT &amp; RESPECT)</td>
                    <td>Intensive systolic blood pressure control target &lt;120 mmHg vs &lt;140 mmHg.</td>
                    <td><strong>SPRINT (NEJM 2015; PMID: 26551272):</strong> 25% reduction in primary composite CV events; 43% reduction in CV death &mdash; but <em>excluded prior stroke</em>, so the secondary-prevention target is extrapolated.<br /><strong>RESPECT (JAMA Neurol 2019; PMID: 31355878):</strong> In prior-stroke patients HR 0.73 (95% CI 0.49–1.11, NS); its updated meta-analysis supports &lt;130/80 mmHg (RR 0.78; 95% CI 0.64–0.96; NNT 67).</td>
                    <td><span style={{ color: '#166534' }}>Do not extrapolate the SPRINT target to symptomatic intracranial atherosclerosis.</span></td>
                  </tr>
                </tbody>
              </table></div>
            </CardSection>

            {/* §3 Secondary Stroke Prevention ABCDE Bundle (amber) */}
            <CardSection color="amber" title="3. Comprehensive Secondary Stroke Prevention ABCDE Protocol">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>A &amp; B: Antithrombotics &amp; Blood Pressure</strong>
                  <br />&bull; <strong>Antithrombotics:</strong> use short-course DAPT only in eligible noncardioembolic settings; the 90-day SAMMPRIS regimen concerned severe symptomatic 70–99% intracranial stenosis. Cardiac mechanisms require specific treatment: a DOAC is not appropriate for every cardioembolic source, including mechanical valves.
                  <br />&bull; <strong>B (Blood Pressure):</strong> Individualize the BP target to stroke mechanism and tolerability. TRIDENT (<em>post-ICH</em>, baseline SBP 130–160): low-dose triple pill cut recurrent stroke 4.6% vs 7.4% (HR 0.61); 13.6% vs 6.0% stopped for adverse events, most often a &ge;20% creatinine rise.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>C &amp; D: Cholesterol &amp; Diabetes/Diet</strong>
                  <br />&bull; <strong>C (Cholesterol):</strong> Standard post-stroke target <strong>LDL &lt;70 mg/dL</strong> for atherosclerotic stroke/TIA (TST; PMID: 31738483); intensify to <strong>&lt;55 mg/dL</strong> for very-high-risk atherosclerotic disease (Atorvastatin 80 mg + Ezetimibe 10 mg &plusmn; Evolocumab / Alirocumab PCSK9i).
                  <br />&bull; <strong>After lobar ICH the statin decision is unresolved</strong> (amyloid-angiopathy rebleed risk vs cardiovascular benefit). The ongoing <strong>SATURN</strong> trial (NCT03936361) randomizes statin continuation vs discontinuation after lobar ICH and tests whether APOE genotype should guide it &mdash; await results before generalizing.
                  <br />&bull; <strong>Diabetes and diet:</strong> individualize glycemic goals, minimizing hypoglycemia. GLP-1 and SGLT2 therapies have agent-specific cardiovascular, renal and metabolic indications; neither combined treatment nor HbA1c below 7% is mandatory for everyone. A Mediterranean-style dietary pattern is a reasonable prevention component.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>E: Exercise &amp; Lifestyle Guardrails</strong>
                  <br />&bull; <strong>Exercise:</strong> At least 150 minutes/week of moderate-intensity aerobic physical activity.
                  <br />&bull; <strong>Weight and sleep:</strong> set sustainable individualized goals and assess for sleep apnea when appropriate. BMI 27 kg/m² was an eligibility threshold in SELECT, not a universal post-stroke weight target; STOP-BANG is a screening tool rather than a mandatory diagnostic pathway.
                </div>
              </div>
            </CardSection>

            {/* §4 MASH & Hepatic-Metabolic Axis (slate) */}
            <CardSection color="slate" title="4. Metabolic Dysfunction-Associated Steatohepatitis (MASH) &amp; Clinical Pearls">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>The Liver-Brain Axis (MASLD / MASH)</strong>
                  <br />&bull; Metabolic liver disease often coexists with vascular risk factors. Observational associations do not by themselves prove that steatosis or fibrosis causes stroke through a specific ApoB pathway.
                  <br />&bull; Semaglutide’s 2025 accelerated MASH indication is specific to the labeled population and based on histological endpoints. Do not infer proven long-term liver outcomes or a class-wide fibrosis benefit for every GLP-1 agent.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Home BP Telemonitoring &amp; Compliance</strong>
                  <br />&bull; Use validated automated oscillometric upper-arm cuffs with smartphone sync.
                  <br />&bull; Use a consistent home-measurement technique and an individualized treatment target. A universal home SBP below 125 mmHg is not established for every post-stroke phenotype.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Smoking Cessation &amp; Alcohol</strong>
                  <br />&bull; Support smoking cessation with behavioral treatment and an appropriate medication option. Selection among nicotine replacement, varenicline or bupropion requires contraindication and interaction review; bupropion is unsuitable in seizure disorders.
                  <br />&bull; Reduce harmful alcohol use and discuss individual exposure and risk; this card does not define one universal drinks-per-day safety threshold.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'SELECT Trial', cite: 'Lincoff AM et al. N Engl J Med. 2023;389(24):2221-2232.', pmid: '37952131' },
              { label: 'FLOW Trial', cite: 'Perkovic V et al. N Engl J Med. 2024;391(2):109-121.', pmid: '38785209' },
              { label: 'SUSTAIN-6 Trial', cite: 'Marso SP et al. N Engl J Med. 2016;375(19):1834-1844.', pmid: '27633186' },
              { label: 'SPRINT Trial', cite: 'Wright JT Jr et al. N Engl J Med. 2015;373(22):2103-2116.', pmid: '26551272' },
              { label: 'TRIDENT Trial', cite: 'Anderson CS et al. N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
              { label: 'RESPECT Trial', cite: 'Kitagawa K et al. JAMA Neurol. 2019;76(11):1309-1318.', pmid: '31355878' },
              { label: 'TST Trial', cite: 'Amarenco P et al. N Engl J Med. 2020;382(1):9.', pmid: '31738483' },
              { label: 'SPRINT MIND', cite: 'Williamson JD et al. JAMA. 2019;321(6):553-561.', pmid: '30688979' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// __NV_MODULES_END__  (new neurovascular module components are inserted above this line)


export function SelectSeizureRiskCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>SeLECT Post-Stroke Seizure &amp; Epilepsy Risk Score</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            Galovic M et al. Lancet Neurol 2018 Reference Card (PMID 29413315)
          </p>

          <div className="toast-grid" style={{marginBottom: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card primary">
                <h3>1. SeLECT Score Criteria (0 to 9 Points)</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Severity (NIHSS):</strong> 0-3 (0 pts), 4-10 (1 pt), &ge;11 (2 pts).</li>
                  <li><strong>Large-artery atherosclerosis (TOAST aetiology):</strong> Yes (1 pt).</li>
                  <li><strong>Early seizure (&le;7 days):</strong> Yes (3 pts).</li>
                  <li><strong>Cortical involvement:</strong> Yes (2 pts).</li>
                  <li><strong>Territory:</strong> Middle cerebral artery (MCA) territory (1 pt).</li>
                </ul>
              </div>
              <div className="toast-card neutral">
                <h3>2. 1-Year &amp; 5-Year Post-Stroke Epilepsy Risk</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Historical cohort estimates:</strong> Score 0: 0.7% at 1 year and 1.3% at 5 years. Score 9: 63% at 1 year and 83% at 5 years (Galovic et al., 2018).</li>
                  <li>Intermediate percentages are withheld pending verification against the final published model. Cohort estimates do not determine an individual outcome or justify preventive ASM by themselves.</li>
                </ul>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card alert-orange">
                <h3>3. Prophylaxis &amp; ASM Guidance</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>No Primary Prophylaxis:</strong> AHA/ASA guidelines do NOT recommend routine primary prophylactic antiseizure medication (ASM) after ischemic stroke.</li>
                  <li><strong>Remote unprovoked seizure:</strong> when attributable to the old stroke and after other acute causes are excluded, recurrence risk may meet an epilepsy definition. Drug choice and duration require individual assessment; the seven-day boundary alone is not a prescription.</li>
                </ul>
              </div>
              <div className="toast-card alert-red">
                <h3>4. Drug Selection Considerations</h3>
                <p style={{fontSize: '8.2pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                  Review drug-specific interactions, renal/hepatic function and the indication. Strong enzyme-inducing ASMs can reduce exposure to some DOACs; antiplatelet interactions differ by agent. No preferred ASM is universally interaction-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lightboxImage && (
        <InteractiveImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          title={lightboxImage.title}
          fallbackSvgSrc={lightboxImage.fallbackSvgSrc}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

