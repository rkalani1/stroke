import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EvdIcpSimulator } from './simulators/EvdIcpSimulator.jsx';
import { HintsSimulator } from './simulators/HintsSimulator.jsx';
import { PupillometrySimulator } from './simulators/PupillometrySimulator.jsx';
import { NeuroExamsTool } from './simulators/NeuroExamsTool.jsx';
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

import ais2026 from './guidelines/ais-2026.json';
import cancerStroke2026 from './guidelines/cancer-stroke-2026.json';
import cardiacBrainHealth2024 from './guidelines/cardiac-brain-health-2024.json';
import cvt2024 from './guidelines/cvt-2024.json';
import ich2022 from './guidelines/ich-2022.json';
import maternalStroke2026 from './guidelines/maternal-stroke-2026.json';
import perioperativeStroke2021 from './guidelines/perioperative-stroke-2021.json';
import poststrokeCognitive2023 from './guidelines/poststroke-cognitive-2023.json';
import poststrokePrimaryCare2021 from './guidelines/poststroke-primary-care-2021.json';
import poststrokeSpasticity2026 from './guidelines/poststroke-spasticity-2026.json';
import primaryPrevention2024 from './guidelines/primary-prevention-2024.json';
import premorbidDisability2022 from './guidelines/premorbid-disability-2022.json';
import secondaryPrevention2021 from './guidelines/secondary-prevention-2021.json';
import sah2023 from './guidelines/sah-2023.json';
import systemicComplications2024 from './guidelines/systemic-complications-2024.json';
import svinLargeCore2025 from './guidelines/svin-large-core-2025.json';
import tiaEd2023 from './guidelines/tia-ed-2023.json';

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
const GUIDELINE_LIBRARY = [
  ais2026,
  ich2022,
  sah2023,
  cvt2024,
  maternalStroke2026,
  primaryPrevention2024,
  secondaryPrevention2021,
  svinLargeCore2025,
  cancerStroke2026,
  premorbidDisability2022,
  tiaEd2023,
  systemicComplications2024,
  poststrokeCognitive2023,
  poststrokeSpasticity2026,
  poststrokePrimaryCare2021,
  perioperativeStroke2021,
  cardiacBrainHealth2024
];

const GUIDELINE_LIBRARY_INDEX = GUIDELINE_LIBRARY.map((guideline) => ({
  ...guideline,
  recommendations: guideline.recommendations.map((rec, index) => ({
    ...rec,
    id: rec.id || `${guideline.id}-${index + 1}`,
    sourceUrl: guideline.publisherUrl || guideline.pdfUrl,
    pdfSourceUrl: rec.page && guideline.pdfUrl ? `${guideline.pdfUrl}#page=${rec.page}` : null
  }))
}));

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
  { id: 'gcs', label: 'GCS', regex: /\b(gcs|glasgow)\b/i, target: { tab: 'management', subTab: 'calculators' } },
  { id: 'abcd2', label: 'ABCD²', regex: /\babcd2\b/i, target: { tab: 'management', subTab: 'calculators' } },
  { id: 'chads', label: 'CHA₂DS₂-VASc', regex: /\b(cha2ds2|chads)\b/i, target: { tab: 'management', subTab: 'calculators' } },
  { id: 'hasbled', label: 'HAS-BLED', regex: /\bhas[- ]?bled\b/i, target: { tab: 'management', subTab: 'calculators' } },
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
  CONFIRM_SAFETY_PAUSE_PARTICIPANTS: "Bedside Nurse, Stroke Fellow, and Pharmacist",
  CONFIRM_TELESTROKE_PATHWAY_SOURCE: "Example telestroke operations manual (your network)",
  CONFIRM_PUBLIC_SAFE_ROUTING_TEXT: "Tele-consult routing logic (your network)",
};

const EDUCATION_MODULES = [
  {
    id: 'crao-thrombolysis',
    title: 'CRAO Acute Thrombolysis',
    purpose: 'Central Retinal Artery Occlusion (CRAO) acute IV thrombolysis decision framework, visual acuity criteria, and THEIA trial evidence.',
    actions: 'crao central retinal artery occlusion eye stroke visual acuity monocular vision loss thrombolysis tnk alteplase theia mac grory aha statement 4.5h window',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-24',
    references: [
      { label: 'AHA Statement 2021', citation: 'Mac Grory B, et al. Management of Central Retinal Artery Occlusion. Stroke. 2021;52(6):e282-e294.', pmid: '33677974' },
      { label: 'THEIA Trial 2025', citation: 'Préterre C, et al. Intravenous alteplase versus oral aspirin for acute central retinal artery occlusion (THEIA). Lancet Neurol. 2025;24:110-120.', pmid: '41109232' }
    ]
  },
  {
    id: 'select-seizure-risk',
    title: 'SeLECT Post-Stroke Seizure Risk',
    purpose: 'SeLECT score for predicting 1-year and 5-year risk of late post-stroke seizures and epilepsy after ischemic stroke.',
    actions: 'select score post stroke seizure epilepsy risk galovic cortical involvement early seizure lvo mca territory asm antiseizure',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-24',
    references: [
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. Prediction of late seizures after ischaemic stroke with the SeLECT score. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
    ]
  },
  {
    id: 'edema-swelling-risk',
    title: 'EDEMA Score & Malignant Swelling',
    purpose: 'EDEMA score for early stratification of severe brain swelling and malignant MCA infarction risk after acute ischemic stroke.',
    actions: 'edema score malignant mca brain swelling herniation strbian dense artery aspectos glucose midline shift decompressive hemicraniectomy',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-07-24',
    references: [
      { label: 'EDEMA Score Study', citation: 'Strbian D, et al. The EDEMA score: a practical tool to predict severe brain swelling. Stroke. 2013;44(10):2728-2733.', pmid: '23887841' },
      { label: 'DESTINY II Trial', citation: 'Jüttler E, et al. Decompressive Surgery for Severe Middle-Cerebral-Artery Infarction in Elderly Patients. N Engl J Med. 2014;370:1091-1100.', pmid: '24645942' }
    ]
  },
  {
    id: 'toast-classification',
    title: 'TOAST Stroke Classification',
    purpose: 'Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.',
    actions: 'toast criteria etiology large artery lacune small vessel cardioembolic undetermined cryptogenic esus workup',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'Original Study', citation: 'Adams HP Jr, et al. TOAST. Stroke. 1993;24:35-41.', pmid: '7678184' },
      { label: 'AHA/ASA Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'OCEANIC-STROKE Trial', citation: 'Sharma M, et al. Asundexian for Secondary Stroke Prevention. N Engl J Med. 2026;394(15):1467-1479.', pmid: '41985132' }
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
    purpose: 'Evidence-based schedule for starting or restarting DOACs after acute ischemic stroke or TIA.',
    actions: 'afib atrial fibrillation doac restart anticoagulation timing elan optimas timing start catalyst meta-analysis apixaban rivaroxaban dabigatran edoxaban',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'ELAN Trial', citation: 'Fischer U et al. N Engl J Med. 2023;388:2411-2421.', pmid: '37222476' },
      { label: 'CATALYST Meta-Analysis', citation: 'Dehbi HM et al. Lancet 2025.', pmid: '40570866' },
      { label: 'AFib Guidelines', citation: 'Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. Circulation. 2024;149:e1-e156.', pmid: '38043043' }
    ]
  },
  {
    id: 'herniation-icp',
    title: 'Intracranial Hypertension & Herniation - Stroke',
    purpose: 'Stepwise management protocol, emergent weight-based osmotherapy calculator, and interactive compliance waveform analyzer.',
    actions: 'icp herniation cerebral edema brain swelling osmotherapy mannitol hypertonic saline hts evd midline shift herniation stepwise protocol compliance waveform',
    categories: ['pocket-card', 'printable', 'icu', 'simulators'],
    lastReviewed: '2026-05-31',
    references: [
      { label: 'AHA/ASA Guidelines', citation: 'Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'Cerebral Edema Recommendations', citation: 'Wijdicks EF, et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. Stroke. 2014;45:1222–1238.', pmid: '24481970' },
      { label: 'NCS Guidelines', citation: 'Cook AM, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. Neurocrit Care. 2020;32:647–666.', pmid: '32227294' }
    ]
  },
  {
    id: 'evd-maintenance',
    title: 'External Ventricular Drain',
    purpose: 'EVD leveling, drainage mechanics, safety checks, complications, PDF reference card, and interactive bedside simulator.',
    actions: 'evd external ventricular drain ventriculostomy leveling zeroing tragus eam clamp drainage csf overdrainage underdrainage waveform simulator',
    categories: ['simulators', 'printable', 'icu'],
    lastReviewed: '2026-06-03',
    references: [
      { label: 'NCS Consensus Statement', citation: 'Fried HI, et al. The Insertion and Management of External Ventricular Drains. Neurocrit Care. 2016;24:61-81.', pmid: '26738503' }
    ]
  },
  {
    id: 'hints-simulator',
    title: 'HINTS+ Vestibular Simulator',
    purpose: 'Bedside vestibular exam simulator for differentiating central (stroke) vs. peripheral vertigo (HINTS+ algorithm).',
    actions: 'hints vestibular nystagmus skew eye movement vertigo hearing loss avs nystagmus simulator interactive',
    categories: ['simulators'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'Kattah Study', citation: 'Kattah JC et al. Stroke. 2009;40:3504-10.', pmid: '19762654' },
      { label: 'AHA/ASA Guideline', citation: 'Prabhakaran S et al. Stroke. 2026.', pmid: '41582814' }
    ]
  },
  {
    id: 'pupillometry',
    title: 'Pupillometry & NPi Simulator',
    purpose: 'Bedside automated pupillometry simulator for adjusting pupil size, latency, and constriction velocity to calculate Neurological Pupil Index (NPi).',
    actions: 'pupillometry npi pupil size constriction velocity latency early herniation icp shift anisocoria pupillometer interactive',
    categories: ['simulators', 'icu'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'NCS Consensus', citation: 'Olson DM et al. Neurocrit Care. 2024.', pmid: '38290918' }
    ]
  },
  {
    id: 'neuro-exams-simulator',
    title: 'Bedside Neuro-Exams Tool',
    purpose: 'Interactive bedside clinical exam assistant for classifying aphasia types, delirium (CAM-ICU), and structured coma examinations.',
    actions: 'neuroexam aphasia delirium coma cam-icu exam classifier fluent non-fluent global wernicke broca interactive',
    categories: ['simulators'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'CAM-ICU Study', citation: 'Ely EW et al. JAMA. 2001;286:2703-10.', pmid: '11730446' }
    ]
  },
  {
    id: 'iv-thrombolysis',
    title: 'IV Thrombolysis: TNK & Time Windows',
    purpose: 'Tenecteplase (TNK) as the standard IV thrombolytic for acute ischemic stroke — the standard 4.5-hour window, extended perfusion-based windows, and the defining trial evidence (ATTEST-2, TIMELESS, TRACE-III).',
    actions: 'thrombolysis tenecteplase tnk alteplase tpa lytic 4.5 hour window extended perfusion mismatch attest-2 timeless trace-3 tempo-2 stk-4 door to needle wake-up last known well dosing bolus',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'ATTEST-2 Trial', citation: 'Muir KW, et al. Tenecteplase versus alteplase for acute stroke within 4.5 h (ATTEST-2). Lancet Neurol. 2024;23(11):1087-1096.', pmid: '39424558' },
      { label: 'TIMELESS Trial', citation: 'Albers GW, et al. Tenecteplase for Stroke at 4.5 to 24 Hours with Perfusion-Imaging Selection. N Engl J Med. 2024;390(8):701-711.', pmid: '38329148' },
      { label: 'TRACE-III Trial', citation: 'Xiong Y, et al. Tenecteplase for Ischemic Stroke at 4.5 to 24 Hours without Thrombectomy. N Engl J Med. 2024;391(3):203-212.', pmid: '38884324' },
      { label: 'TEMPO-2 Trial', citation: 'Coutts SB, et al. Tenecteplase versus standard of care for minor ischaemic stroke with proven occlusion (TEMPO-2). Lancet. 2024;403(10444):2597-2605.', pmid: '38768626' },
      { label: 'AHA/ASA 2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
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
      { label: 'AHA Statement 2024', citation: 'Treatment and Outcomes of Cervical Artery Dissection in Adults. Stroke. 2024;55(3):e84-e107.', pmid: '38301552' },
      { label: 'ESO Guideline 2021', citation: 'European Stroke Organisation guideline for the management of extracranial and intracranial artery dissection. Eur Stroke J. 2021;6(3):XXXIX-LXXXVIII.', pmid: '34528453' }
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
      { label: 'Kaufmann IPD Meta-analysis', citation: 'Kaufmann JE, et al. Antithrombotic Therapy in Cervical Artery Dissection: An Individual Patient Data Meta-analysis. JAMA Neurol. 2024;81(6):630-637.', pmid: '38739383' }
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
      { label: 'Ancillary Update', citation: 'Wijdicks EF, et al. Practice parameter update: determining brain death in adults. Neurology. 2010;74(23):1911-1918.', pmid: '20530327' }
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
      { label: 'ASTRAL Score', citation: 'Ntaios G, et al. Stroke. 2012;43(8):2170-2176.', pmid: '22738924' },
      { label: 'PLAN Score', citation: 'O\'Donnell MJ, et al. Arch Intern Med. 2012;172(20):1548-1556.', pmid: '23090225' },
      { label: 'ICH Score', citation: 'Hemphill JC 3rd, et al. Stroke. 2001;32(4):891-897.', pmid: '11283388' },
      { label: 'mRS Scale', citation: 'van Swieten JC, et al. Stroke. 1988;19(5):604-607.', pmid: '3363593' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'FASTEST Trial', citation: 'Broderick JP, et al. Recombinant factor VIIa versus placebo for spontaneous intracerebral haemorrhage within 2 h (FASTEST). Lancet. 2026;407(10530):773-783.', pmid: '41653933' }
    ]
  },
  {
    id: 'antiepileptic-drugs',
    title: 'Antiepileptic Drugs & Post-Stroke Seizures',
    purpose: 'Clinical classification of post-stroke seizures, guideline-directed management, comparison of first-line and second-line antiepileptic drugs (ASMs), and post-stroke epilepsy risk scores (SeLECT and IsCHEMiA).',
    actions: 'antiepileptic drugs antiseizure medications asm aed keppra levetiracetam lamotrigine lamictal lacosamide vimpat valproic acid depakote phenytoin dilantin select score ischemia score post-stroke epilepsy seizure prophylaxis',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'AHA/ASA 2026 Stroke Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'AHA/ASA 2023 aSAH Guideline', citation: 'Hoh BL, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54(7):e314-e370.', pmid: '37212182' },
      { label: 'IsCHEMiA Score Validation', citation: 'IsCHEMiA in Vascular Epilepsy: Identifying Risks for Post Stroke Epilepsy. Epilepsy Currents. 2026;26.', pmid: null },
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. SeLECT: a prediction model for late seizures after ischemic stroke. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
    ]
  },
  {
    id: 'aspirin-failure',
    title: 'Aspirin Failure & Resistance',
    purpose: 'Clinical definition, mechanisms of resistance, diagnostic evaluation, and evidence-based secondary prevention strategies for patients who stroke on aspirin.',
    actions: 'aspirin resistance failure breakthrough stroke antiplatelet clopidogrel dapt wasid caprie sammpris pharmacology compliance nsaid interaction',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'AHA/ASA 2021 Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'WASID Post-Hoc', citation: 'Failure of Antithrombotic Therapy and Risk of Stroke in Patients With Symptomatic Intracranial Stenosis. Stroke. 2009;40:359-364.', pmid: '19064771' },
      { label: 'CAPRIE Trial', citation: 'CAPRIE Steering Committee. Lancet. 1996;348:1329-1339.', pmid: '8932661' },
      { label: 'CHANCE Trial', citation: 'Wang Y, et al. Clopidogrel with Aspirin in Acute Minor Stroke or Transient Ischemic Attack. N Engl J Med. 2013;369:11-19.', pmid: '23803136' },
      { label: 'POINT Trial', citation: 'Johnston SC, et al. Clopidogrel and Aspirin in Acute Ischemic Stroke and High-Risk TIA. N Engl J Med. 2018;379:215-225.', pmid: '29766750' },
      { label: 'INSPIRES Trial', citation: 'Gao Y, et al. Dual Antiplatelet Treatment up to 72 Hours after Ischemic Stroke. N Engl J Med. 2023;389:2413-2424.', pmid: '38157499' },
      { label: 'SAMMPRIS Trial', citation: 'Chimowitz MI, et al. Stenting versus Aggressive Medical Therapy for Intracranial Arterial Stenosis. N Engl J Med. 2011;365:993-1003.', pmid: '21899409' },
      { label: 'COMPASS Trial', citation: 'Connolly SJ, et al. Rivaroxaban with or without Aspirin in Stable Cardiovascular Disease. Lancet. 2018;391:319-328.', pmid: '29141975' },
      { label: 'Narrative Review', citation: 'Sanderson S, et al. Aspirin Resistance and Its Clinical Implications. Ann Intern Med. 2005;142:370-380.', pmid: '15738456' },
      { label: 'OCEANIC-STROKE Trial', citation: 'Sharma M, et al. Asundexian for Secondary Stroke Prevention. N Engl J Med. 2026;394(15):1467-1479.', pmid: '41985132' }
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
      { label: 'AHA/ASA Statement', citation: 'Saposnik G, et al. Diagnosis and management of cerebral venous thrombosis: a statement for healthcare professionals from the AHA/ASA. Stroke. 2011;42(4):1158-1192.', pmid: '21293023' }
    ]
  },
  {
    id: 'large-core-thrombectomy',
    title: 'Large-Core Thrombectomy',
    purpose: 'Endovascular thrombectomy for large ischemic core (low ASPECTS or large core volume) — the six 2022–2024 RCTs, functional-outcome benefit, and the symptomatic-hemorrhage trade-off.',
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
      { label: '2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
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
    id: 'lipid-management-after-stroke',
    title: 'Lipid Management After Ischemic Stroke',
    purpose: 'LDL-C targets after atherosclerotic ischemic stroke, the high-intensity statin → ezetimibe → PCSK9 inhibitor ladder, the supporting trials (SPARCL, TST, IMPROVE-IT, FOURIER), and the hemorrhagic-stroke caveat.',
    actions: 'lipid ldl cholesterol statin high-intensity atorvastatin rosuvastatin ezetimibe pcsk9 evolocumab target 70 55 sparcl treat stroke to target tst improve-it fourier secondary prevention hemorrhagic caution',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'SPARCL', citation: 'Amarenco P, et al. High-dose atorvastatin after stroke or transient ischemic attack (SPARCL). N Engl J Med. 2006;355(6):549-559.', pmid: '16899775' },
      { label: 'Treat Stroke to Target', citation: 'Amarenco P, et al. A Comparison of Two LDL Cholesterol Targets after Ischemic Stroke. N Engl J Med. 2020;382(1):9-19.', pmid: '31738483' },
      { label: 'FOURIER', citation: 'Sabatine MS, et al. Evolocumab and Clinical Outcomes in Patients with Cardiovascular Disease. N Engl J Med. 2017;376(18):1713-1722.', pmid: '28304224' },
      { label: 'IMPROVE-IT', citation: 'Cannon CP, et al. Ezetimibe Added to Statin Therapy after Acute Coronary Syndromes. N Engl J Med. 2015;372(25):2387-2397.', pmid: '26039521' },
      { label: 'AHA/ASA 2021 Secondary Prevention', citation: 'Kleindorfer DO, et al. 2021 Guideline for the Prevention of Stroke in Patients With Stroke and TIA. Stroke. 2021;52(7):e364-e467.', pmid: '34024117' }
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
      { label: 'CREST-2', citation: 'Brott TG, et al. Medical Management and Revascularization for Asymptomatic Carotid Stenosis (CREST-2). N Engl J Med. 2025;394(3):219-231.', pmid: '41269206' },
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
      { label: 'Arterial territories — brainstem/cerebellum', citation: 'Tatu L, et al. Arterial territories of the human brain: brainstem and cerebellum. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' },
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
      { label: 'Arterial territories — brainstem/cerebellum', citation: 'Tatu L, et al. Arterial territories of the human brain: brainstem and cerebellum. Neurology. 1996;47(5):1125-1135.', pmid: '8909417' }
    ]
  },
  {
    id: 'anticoagulation-reversal',
    title: 'Anticoagulation Reversal in Acute Hemorrhage',
    purpose: 'Agent-specific reversal for intracranial hemorrhage — 4F-PCC + vitamin K for warfarin, idarucizumab for dabigatran, andexanet alfa (or 4F-PCC) for factor Xa inhibitors — with the ANNEXA-I thrombotic caveat and parallel BP/neurosurgery steps.',
    actions: 'anticoagulation reversal ich hemorrhage warfarin vka 4f-pcc pcc vitamin k dabigatran idarucizumab factor xa apixaban rivaroxaban edoxaban andexanet annexa-4 annexa-i reverse-ad patch platelet desmopressin bp control neurosurgery',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'ANNEXA-4', citation: 'Connolly SJ, et al. Full Study Report of Andexanet Alfa for Bleeding Associated with Factor Xa Inhibitors. N Engl J Med. 2019;380(14):1326-1335.', pmid: '30730782' },
      { label: 'ANNEXA-I', citation: 'Connolly SJ, et al. Andexanet for Factor Xa Inhibitor–Associated Acute Intracerebral Hemorrhage. N Engl J Med. 2024;390(19):1745-1755.', pmid: '38749032' },
      { label: 'RE-VERSE AD', citation: 'Pollack CV, et al. Idarucizumab for Dabigatran Reversal — Full Cohort Analysis. N Engl J Med. 2017;377(5):431-441.', pmid: '28693366' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'NCS/SCCM Reversal Guideline', citation: 'Frontera JA, et al. Guideline for Reversal of Antithrombotics in Intracranial Hemorrhage. Neurocrit Care. 2016;24(1):6-46.', pmid: '26714677' }
    ]
  },
  {
    id: 'nihss-simulator',
    title: 'NIHSS Certification Simulator',
    purpose: 'Interactive NIHSS scoring trainer: score each of the 15 items on short case vignettes with immediate right/wrong feedback and rationale, a running 0–42 total, the scoring rules that trip people up, and the interpretation caveats.',
    actions: 'nihss simulator certification scoring stroke scale 15 items loc gaze visual fields facial palsy motor arm leg ataxia sensory language dysarthria extinction inattention neglect 0-42 interactive practice cases posterior right hemisphere underestimate lvo',
    categories: ['simulators'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'NIHSS (original)', citation: 'Brott T, et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke. 1989;20(7):864-870.', pmid: '2749846' },
      { label: 'NIHSS training/reliability', citation: 'Lyden P, et al. Improved reliability of the NIH Stroke Scale using video training. Stroke. 1994;25(11):2220-2226.', pmid: '7974549' }
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
    id: 'aneurysmal-sah-management',
    title: 'Aneurysmal SAH: Grading & Early Management',
    purpose: 'Grading scales (Hunt-Hess, WFNS, modified Fisher), early aneurysm securing (ISAT coiling vs clipping), nimodipine, and delayed cerebral ischemia / vasospasm management for aneurysmal subarachnoid hemorrhage.',
    actions: 'aneurysmal subarachnoid hemorrhage asah sah hunt-hess wfns modified fisher grading vasograde ogilvy-carter aneurysm coiling clipping isat rebleed nimodipine brant dci vasospasm delayed cerebral ischemia euvolemia hyponatremia hydrocephalus evd',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-07-18',
    references: [
      { label: 'AHA/ASA 2023 aSAH Guideline', citation: 'Hoh BL, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54(7):e314-e370.', pmid: '37212182' },
      { label: 'ISAT', citation: 'Molyneux A, et al. International Subarachnoid Aneurysm Trial (ISAT): coiling vs clipping. Lancet. 2002;360(9342):1267-1274.', pmid: '12414200' },
      { label: 'Nimodipine (BRANT)', citation: 'Pickard JD, et al. Effect of oral nimodipine on cerebral infarction and outcome after subarachnoid haemorrhage (British Aneurysm Nimodipine Trial). BMJ. 1989;298(6674):636-642.', pmid: '2496789' },
      { label: 'Modified Fisher scale', citation: 'Frontera JA, et al. Prediction of symptomatic vasospasm after SAH: the modified Fisher scale. Neurosurgery. 2006;59(1):21-27.', pmid: '16823296' }
    ]
  },
  {
    id: 'ctp-ghost-core',
    title: 'CTP Artifacts, Ghost Core & Penumbra Nuances',
    purpose: 'CT perfusion ischemic core overestimation (rCBF <30% ghost core in hyperacute rapid reperfusion), ADC <620 μm²/s diffusion reversibility, Tmax >6s vs >10s hypoperfusion intensity ratio (HIR), bolus truncation, and severe carotid stenosis delay pseudo-penumbra.',
    actions: 'ct perfusion ctp ghost core ischemic core penumbra rcbf 30 adc 620 diffusion reversibility tmax 6s 10s hir hypoperfusion intensity ratio bolus truncation delay dispersion pseudo-penumbra carotid stenosis aif vof rapid olea',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'Ghost Core Phenomenon', citation: 'Campbell BCV, et al. Comparison of computed tomography perfusion and magnetic resonance imaging perfusion-diffusion mismatch in ischemic stroke. Stroke. 2012;43(10):2648-2653.', pmid: '22858726' },
      { label: 'Core Reversibility & Time', citation: 'Boned S, et al. Admission CT perfusion may overestimate initial infarct core: the ghost infarct core concept. J Neurointerv Surg. 2017;9(1):66-69.', pmid: '27566491' },
      { label: 'DWI ADC Reversal', citation: 'Copen WA, et al. In Acute Stroke, Can CT Perfusion-Derived Cerebral Blood Volume Maps Substitute for Diffusion-Weighted Imaging in Identifying the Ischemic Core? PLoS One. 2015;10(7):e0133566.', pmid: '26193486' },
      { label: 'DEFUSE 2 Mismatch', citation: 'Lansberg MG, et al. MRI profile and response to endovascular reperfusion after stroke (DEFUSE 2): a prospective cohort study. Lancet Neurol. 2012;11(10):860-867.', pmid: '22954705' },
      { label: '2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
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
      { label: 'Arteriopathy Characteristics', citation: 'Mossa-Basha M, et al. High-Resolution Magnetic Resonance Vessel Wall Imaging for the Evaluation of Intracranial Vascular Pathology. Neuroimaging Clin N Am. 2021;31(2):175-188.', pmid: '33902876' },
      { label: 'High-Res Diagnostic Patterns', citation: 'Obusez EC, et al. High-resolution MRI vessel wall imaging: spatial and temporal patterns of reversible cerebral vasoconstriction syndrome and central nervous system vasculitis. AJNR Am J Neuroradiol. 2014;35(8):1527-1532.', pmid: '24722305' },
      { label: 'PACNS vs RCVS Differentiation', citation: 'Lehman VT, et al. Current Clinical Applications of Intracranial Vessel Wall MR Imaging. Semin Ultrasound CT MR. 2021;42(5):407-420.', pmid: '34537115' }
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
      { label: 'ARCADIA Trial', citation: 'Kamel H, et al. Apixaban to Prevent Recurrence after Cryptogenic Stroke in Patients with Atrial Cardiopathy (ARCADIA). JAMA. 2024;331(7):573-581.', pmid: '38324415' }
    ]
  },
  {
    id: 'pfo-closure',
    title: 'PFO Closure & LAAO Decision Pathways',
    purpose: 'Evidence-based decision pathways for Patent Foramen Ovale (PFO) closure (RESPECT, CLOSE, REDUCE, DEFENSE-PFO), high-risk anatomical features (atrial septal aneurysm >10mm, large shunt >20 bubbles), RoPE score, PASCAL classification, and Left Atrial Appendage Occlusion (LAAO) trials (PROTECT AF, PREVAIL, PRAGUE-17).',
    actions: 'pfo patent foramen ovale closure laao left atrial appendage occlusion respect close reduce defense-pfo rope score pascal classification atrial septal aneurysm asa shunt bubble study watchman amuchet protect af prevail prague-17 paradoxical embolism',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'RESPECT Long-Term', citation: 'Saver JL, et al. Long-Term Outcomes of Patent Foramen Ovale Closure or Medical Therapy after Stroke (RESPECT). N Engl J Med. 2017;377(11):1022-1032.', pmid: '28902590' },
      { label: 'CLOSE Trial', citation: 'Mas JL, et al. Patent Foramen Ovale Closure or Anticoagulation vs. Antiplatelets after Stroke (CLOSE). N Engl J Med. 2017;377(11):1011-1021.', pmid: '28902593' },
      { label: 'REDUCE Trial', citation: 'Søndergaard L, et al. Patent Foramen Ovale Closure or Antiplatelet Therapy for Cryptogenic Stroke (REDUCE). N Engl J Med. 2017;377(11):1033-1042.', pmid: '28902580' },
      { label: 'DEFENSE-PFO Trial', citation: 'Lee JY, et al. Cryptogenic Stroke and High-Risk Patent Foramen Ovale: The DEFENSE-PFO Trial. J Am Coll Cardiol. 2018;71(20):2335-2342.', pmid: '29544871' },
      { label: 'RoPE Score Study', citation: 'Kent DM, et al. An index to identify stroke-related vs incidental patent foramen ovale in cryptogenic stroke (RoPE Study). Neurology. 2013;81(7):619-625.', pmid: '23864310' },
      { label: 'PASCAL Consensus', citation: 'Kent DM, et al. Heterogeneity of Treatment Effects in an Analysis of Pooled Individual Patient Data From Randomized Trials of Device Closure of Patent Foramen Ovale After Stroke (PASCAL). JAMA. 2021;326(22):2277-2286.', pmid: '34905030' },
      { label: 'PROTECT AF Trial', citation: 'Holmes DR, et al. Percutaneous closure of the left atrial appendage versus warfarin therapy for stroke prevention in patients with atrial fibrillation: a randomised non-inferiority trial (PROTECT AF). Lancet. 2009;374(9689):534-542.', pmid: '19683639' },
      { label: 'PRAGUE-17 Trial', citation: 'Osmancik P, et al. Left Atrial Appendage Closure Versus Direct Oral Anticoagulants in High-Risk Patients With Atrial Fibrillation (PRAGUE-17). J Am Coll Cardiol. 2020;75(25):3122-3135.', pmid: '32586585' }
    ]
  },
  {
    id: 'cerebral-amyloid-angiopathy',
    title: 'Cerebral Amyloid Angiopathy (CAA) Boston Criteria v2.0',
    purpose: 'Comprehensive Boston Criteria v2.0 diagnostic framework (strictly lobar CMBs, cortical superficial siderosis cSS, multispot WMH, centrum semiovale PVS), amyloid spells (TFNE vs TIA), and anticoagulation dilemmas in patients with AF and CAA (PRESTIGE-AF, SoSTART, ENRICH-AF DSMB alert, and LAAO).',
    actions: 'cerebral amyloid angiopathy caa boston criteria 2.0 lobar hemorrhage microbleeds cmb cortical superficial siderosis css amyloid spells tfne transient focal neurological episodes white matter spots cso-pvs prestige-af sostart enrich-af laao anticoagulation',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'Boston Criteria 2.0', citation: 'Charidimou A, et al. The Boston criteria version 2.0 for cerebral amyloid angiopathy: a multicentre, retrospective, MRI-neuropathology diagnostic accuracy study. Lancet Neurol. 2022;21(8):714-725.', pmid: '35841910' },
      { label: 'Cortical Siderosis in CAA', citation: 'Linn J, et al. Prevalence of superficial siderosis in patients with cerebral amyloid angiopathy. Neurology. 2010;74(17):1346-1350.', pmid: '20421578' },
      { label: 'Amyloid Spells (TFNE)', citation: 'Charidimou A, et al. Spectrum of transient focal neurological episodes in cerebral amyloid angiopathy: multicentre magnetic resonance imaging cohort study and meta-analysis. Stroke. 2012;43(9):2324-2330.', pmid: '22798323' },
      { label: 'PRESTIGE-AF Trial', citation: 'Polymeris AA, et al. Direct oral anticoagulants versus no anticoagulation for stroke prevention in intracerebral haemorrhage survivors with atrial fibrillation (PRESTIGE-AF). Lancet Neurol. 2025;24(1):41-52.', pmid: '40023176' },
      { label: 'SoSTART Trial', citation: 'Al-Shahi Salman R, et al. Effects of oral anticoagulation in people with atrial fibrillation and prior spontaneous intracranial haemorrhage (SoSTART). Lancet Neurol. 2021;20(10):844-853.', pmid: '34487722' },
      { label: '2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' }
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
      { label: 'CARASIL Landmark', citation: 'Hara K, et al. Association of HTRA1 mutations and familial CARASIL. N Engl J Med. 2009;360(17):1729-1739.', pmid: '19387015' },
      { label: 'Fabry Disease Guidelines', citation: 'Ortiz A, et al. Fabry disease revisited: Management and treatment recommendations for adult patients. Mol Genet Metab. 2018;123(4):416-427.', pmid: '29530533' },
      { label: 'MELAS Management', citation: 'Koenig MK, et al. Recommendations for the Management of Strokelike Episodes in Patients With Mitochondrial Encephalomyopathy, Lactic Acidosis, and Strokelike Episodes. JAMA Neurol. 2016;73(5):591-594.', pmid: '26954033' },
      { label: 'COL4A1 Mutations', citation: 'Gould DB, et al. Mutations in Col4a1 cause perinatal cerebral hemorrhages and porencephaly. Science. 2005;308(5725):1167-1171.', pmid: '15905400' },
      { label: 'ESO Guidelines', citation: 'Bersano A, et al. European Stroke Organisation (ESO) Guidelines on Moyamoya angiopathy Endorsed by Vascular European Reference Network (VASCERN). Eur Stroke J. 2023;8(1):55-84.', pmid: '37021176' }
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
      { label: 'JSS Moyamoya Guidelines', citation: 'Kuroda S, et al. Guidelines for Diagnosis and Treatment of Moyamoya Disease. Neurol Med Chir (Tokyo). 2012;52(5):245-266.', pmid: '22870528' },
      { label: 'Scott & Smith Review', citation: 'Scott RM, et al. Moyamoya disease and moyamoya syndrome. N Engl J Med. 2009;360(12):1226-1237.', pmid: '19297575' }
    ]
  },
  {
    id: 'pregnancy-stroke',
    title: 'Stroke in Pregnancy and the Puerperium: 2026 Maternal Guidelines',
    purpose: 'Emergency management of ischemic and hemorrhagic stroke in pregnancy/postpartum, safe IV thrombolysis/EVT, preeclampsia/eclampsia/PRES protocols, magnesium sulfate, and postpartum CVST.',
    actions: 'pregnancy stroke maternal postpartum puerperium preeclampsia eclampsia pres labetalol hydralazine nifedipine magnesium sulfate magpie cvst lmwh enoxaparin delivery thrombolysis evt safety radiation shielding',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: '2026 Maternal Stroke Update', citation: 'Miller EC, et al. Maternal Stroke: A Focused Update. Stroke. 2026.', pmid: '41603019' },
      { label: 'Magpie Trial (Magnesium)', citation: 'Altman D, et al. Do women with pre-eclampsia, and their babies, benefit from magnesium sulphate? The Magpie Trial. Lancet. 2002;359(9321):1877-1890.', pmid: '12057549' },
      { label: 'AHA CVT Scientific Statement', citation: 'Saposnik G, et al. Diagnosis and Management of Cerebral Venous Thrombosis: A Scientific Statement from the AHA. Stroke / AHA. 2024.', pmid: '38284265' },
      { label: 'AHA Women Stroke Prevention', citation: 'Bushnell C, et al. Guidelines for the prevention of stroke in women: a statement for healthcare professionals from the American Heart Association/American Stroke Association. Stroke. 2014;45(5):1545-1588.', pmid: '24503673' }
    ]
  },
  {
    id: 'cancer-associated-stroke',
    title: 'Cancer-Associated Stroke, Hypercoagulability & Marantic Endocarditis (NBTE)',
    purpose: 'Pathophysiology of cancer-mediated hypercoagulability, 3-territory sign on DWI, markedly elevated D-dimer (>3–5x ULN), non-bacterial thrombotic endocarditis (NBTE), and LMWH vs DOAC management.',
    actions: 'cancer stroke active malignancy hypercoagulability marantic endocarditis nbte non-bacterial thrombotic 3-territory sign d-dimer mucin adenocarcinoma teach lmwh dalteparin enoxaparin doac tee vegetations',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: '2026 Cancer Stroke Statement', citation: 'Navi BB, et al. Classification and Management of Ischemic Stroke in Patients With Active Cancer. Stroke. 2026.', pmid: '41623113' },
      { label: 'TEACH Trial (LMWH Pilot)', citation: 'Navi BB, et al. Enoxaparin vs Aspirin in Patients With Cancer and Ischemic Stroke: The TEACH Pilot Randomized Clinical Trial. JAMA Neurol. 2018;75(3):379-381.', pmid: '29309496' },
      { label: 'NBTE Landmark Review', citation: 'Eiken PW, et al. Surgical pathology of nonbacterial thrombotic endocarditis in 30 patients, 1985-2000. Mayo Clin Proc. 2001;76(12):1204-1212.', pmid: '11761501' },
      { label: 'Cancer Stroke Risk Study', citation: 'Navi BB, et al. Risk of Arterial Thromboembolism in Patients With Cancer. J Am Coll Cardiol. 2017;70(8):926-938.', pmid: '28818202' }
    ]
  },
  {
    id: 'pediatric-stroke',
    title: 'Pediatric Ischemic & Hemorrhagic Stroke Master Module (2026 Guidelines)',
    purpose: 'Age-stratified pediatric stroke algorithms (neonatal vs childhood), Focal Cerebral Arteriopathy (FCA/FCA-i), Sickle Cell Disease TCD screening and exchange transfusion (STOP/STOP-2), and pediatric EVT criteria.',
    actions: 'pediatric stroke children neonatal childhood fca focal cerebral arteriopathy sickle cell disease scd tcd transcranial doppler stop stop 2 exchange transfusion thrombolysis evt pednihss varicella arteriopathy',
    categories: ['pocket-card', 'printable', 'pediatrics'],
    lastReviewed: '2026-08-14',
    references: [
      { label: '2026 Pediatric Stroke Update', citation: 'Rivkin MJ, et al. Stroke Guideline Expands Adult Treatment, Provides Pediatric Recommendations. JAMA. 2026;335:e26391.', pmid: '41686463' },
      { label: '2019 AHA Pediatric Statement', citation: 'Ferriero DM, Fullerton HJ, Bernard TJ, et al. Management of Stroke in Neonates and Children: A Scientific Statement From the American Heart Association/American Stroke Association. Stroke. 2019;50(3):e51-e96.', pmid: '30686119' },
      { label: 'STOP Trial Landmark', citation: 'Adams RJ, et al. Prevention of a first stroke by transfusions in children with sickle cell anemia and abnormal results on transcranial Doppler ultrasonography (STOP). N Engl J Med. 1998;339(1):5-11.', pmid: '9647873' },
      { label: 'STOP 2 Trial', citation: 'Adams RJ, et al. Discontinuing prophylactic transfusions for stroke in sickle cell anemia (STOP 2). N Engl J Med. 2005;353(26):2769-2778.', pmid: '16382063' },
      { label: 'TIPS Pediatric Lysis Study', citation: 'Rivkin MJ, deVeber G, Ichord RN, et al. Thrombolysis in acute childhood stroke: design and challenges of the thrombolysis in pediatric stroke clinical trial. Neuroepidemiology. 2009;32(2):103-108.', pmid: '19223687' },
      { label: 'VIPS Study on Arteriopathy', citation: 'Fullerton HJ, Hills NK, Elkind MS, et al. Infection, vaccination, and childhood arterial ischemic stroke: results of the VIPS study. Neurology. 2015;85(17):1459-1466.', pmid: '26423434' }
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
      { label: 'DISTAL Trial', citation: 'Fischer U, et al. Endovascular Treatment for Medium or Distal Vessel Occlusion Stroke (DISTAL). N Engl J Med. 2025;392(13):1232-1243.', pmid: '39908430' },
      { label: 'DISTAL 12-Month', citation: 'Fischer U, et al. Endovascular treatment for medium or distal vessel occlusion stroke (DISTAL): 12-month outcomes. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
      { label: 'ESCAPE-MeVO Trial', citation: 'Goyal M, et al. Endovascular Treatment for Medium Vessel Occlusion Stroke (ESCAPE-MeVO). N Engl J Med. 2025;392(13):1244-1254.', pmid: '39908448' },
      { label: 'CHOICE Trial', citation: 'Renú A, et al. Effect of Intra-arterial Alteplase vs Placebo Following Successful Thrombectomy on Functional Outcomes (CHOICE). JAMA. 2022;327(9):826-835.', pmid: '35143603' },
      { label: 'CHOICE-2 Trial', citation: 'Renú A, et al. Adjunctive Intra-Arterial Alteplase After Successful Thrombectomy for Acute Ischemic Stroke (CHOICE-2). JAMA. 2026.', pmid: '42096239' },
      { label: 'AHA/ASA 2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
    ]
  },
  {
    id: 'extended-window-perfusion',
    title: 'Extended Window Perfusion & Mismatch',
    purpose: 'Standardized CTP and MRI mismatch interpretation in extended (6–24h) and wake-up windows — DAWN, DEFUSE 3, EXTEND, WAKE-UP, TWIST, automated thresholds (rCBF <30%, Tmax >6s), and DWI-FLAIR mismatch protocols.',
    actions: 'extended window perfusion ctp mri mismatch dawn defuse 3 extend wake-up twist rcbf 30 tmax 6s dwi-flair mismatch wake-up stroke ischemic core penumbra automated perfusion thrombectomy thrombolysis',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'DAWN Trial', citation: 'Nogueira RG, et al. Thrombectomy 6 to 24 Hours after Stroke with a Mismatch between Deficit and Infarct (DAWN). N Engl J Med. 2018;378(1):11-21.', pmid: '29129157' },
      { label: 'DEFUSE 3 Trial', citation: 'Albers GW, et al. Thrombectomy for Stroke at 6 to 16 Hours with Selection by Perfusion Imaging (DEFUSE 3). N Engl J Med. 2018;378(8):708-718.', pmid: '29364767' },
      { label: 'EXTEND Trial', citation: 'Ma H, et al. Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset of Stroke (EXTEND). N Engl J Med. 2019;380(19):1795-1803.', pmid: '31067369' },
      { label: 'WAKE-UP Trial', citation: 'Thomalla G, et al. MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset (WAKE-UP). N Engl J Med. 2018;379(7):611-622.', pmid: '29766770' },
      { label: 'TWIST Trial', citation: 'Roaldsen MB, et al. Intravenous thrombolysis with tenecteplase in patients with wake-up stroke (TWIST). Lancet Neurol. 2023;22(2):117-126.', pmid: '36549308' },
      { label: 'AHA/ASA 2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' }
    ]
  },
  {
    id: 'ich-blood-pressure',
    title: 'Acute ICH Blood Pressure & Expansion Mitigation',
    purpose: 'Hyperacute SBP lowering (<140 mmHg within 1h, avoid <130), INTERACT-2/3 care bundle, ATACH-2 renal safety floor, FASTEST, TRIDENT, minimally invasive surgery (ENRICH), and SWITCH decompressive craniectomy.',
    actions: 'ich intracerebral hemorrhage blood pressure sbp 140 expansion interact-2 interact-3 atach-2 enrich trident fastest switch minimally invasive surgery hematoma nicardipine clevidipine care bundle',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'INTERACT-2', citation: 'Anderson CS, et al. Rapid blood-pressure lowering in patients with acute intracerebral hemorrhage (INTERACT2). N Engl J Med. 2013;368(25):2355-2365.', pmid: '23713578' },
      { label: 'ATACH-2', citation: 'Qureshi AI, et al. Intensive Blood-Pressure Lowering in Patients with Acute Cerebral Hemorrhage (ATACH-2). N Engl J Med. 2016;375(11):1033-1043.', pmid: '27276234' },
      { label: 'INTERACT3', citation: 'Ma L, et al. Intensive care bundle with blood pressure lowering in acute intracerebral haemorrhage (INTERACT3): a pragmatic, stepped-wedge cluster randomised trial. Lancet. 2023;402(10405):831-840.', pmid: '37245517' },
      { label: 'ENRICH Trial', citation: 'Pradilla G, et al. Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH). N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
      { label: 'TRIDENT Trial', citation: 'Anderson CS, et al. Triple-Pill Strategy for Blood Pressure Lowering after Intracerebral Hemorrhage (TRIDENT). N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
      { label: 'FASTEST Trial', citation: 'Broderick JP, et al. Recombinant factor VIIa for acute intracerebral hemorrhage (FASTEST). Lancet. 2026;407(10528):773-783.', pmid: '41653933' },
      { label: 'SWITCH Trial', citation: 'Beck J, et al. Decompressive craniectomy versus best medical treatment in severe deep intracerebral haemorrhage (SWITCH): an open-label randomised controlled trial. Lancet. 2024;403(10441):2289-2298.', pmid: '38761811' },
      { label: '2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' }
    ]
  },
  {
    id: 'factor-xia-inhibitors',
    title: 'Novel Factor XI/XIa Inhibitors in Stroke Prevention',
    purpose: 'Targeting the contact activation pathway to uncouple thrombosis from hemostasis — Phase 2/3 trial data (OCEANIC-STROKE with Asundexian, PACIFIC-STROKE, AXIOMATIC-SSP with Milvexian, LILAC-TIMI 76 with Abelacimab) and emerging clinical indications.',
    actions: 'factor xi factor xia inhibitors asundexian milvexian abelacimab oceanic-stroke pacific-stroke axiomatic-ssp lilac-timi 76 contact pathway intrinsic uncoupling thrombosis hemostasis secondary prevention bleeding risk',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'OCEANIC-STROKE', citation: 'Sharma M, et al. Asundexian for Secondary Stroke Prevention (OCEANIC-STROKE). N Engl J Med. 2026;394(15):1467-1479.', pmid: '41985132' },
      { label: 'PACIFIC-STROKE', citation: 'Shoamanesh A, et al. Factor XIa inhibition with asundexian after acute non-cardioembolic ischaemic stroke (PACIFIC-Stroke): an international, randomised, double-blind, placebo-controlled, phase 2b trial. Lancet. 2022;400(10363):1604-1616.', pmid: '36063821' },
      { label: 'AXIOMATIC-SSP', citation: 'Sharma M, et al. Safety and efficacy of factor XIa inhibition with milvexian for secondary stroke prevention (AXIOMATIC-SSP): a phase 2, international, randomised, double-blind, placebo-controlled, dose-finding trial. Lancet Neurol. 2024;23(5):450-459.', pmid: '38101902' }
    ]
  },
  {
    id: 'metabolic-stroke-prevention',
    title: 'Metabolic & Vascular Risk Modulation',
    purpose: 'Comprehensive metabolic and vascular risk modulation in stroke prevention — GLP-1 receptor agonists (SELECT, FLOW, SUSTAIN-6), SGLT2 inhibitors, intensive blood pressure targets (SPRINT, TRIDENT, RESPECT), MASH/obesity management, and the secondary prevention ABCDE bundle.',
    actions: 'metabolic glp-1 glp-1 receptor agonists semaglutide tirzepatide sglt2 inhibitors select flow sustain-6 sprint trident respect abcde bundle secondary prevention ldl obesity diabetes mash blood pressure targets',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-08-14',
    references: [
      { label: 'SELECT Trial', citation: 'Lincoff AM, et al. Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT). N Engl J Med. 2023;389(24):2221-2232.', pmid: '37952131' },
      { label: 'FLOW Trial', citation: 'Perkovic V, et al. Effects of Semaglutide on Chronic Kidney Disease in Patients with Type 2 Diabetes (FLOW). N Engl J Med. 2024;391(2):109-121.', pmid: '38785209' },
      { label: 'SUSTAIN-6 Trial', citation: 'Marso SP, et al. Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes (SUSTAIN-6). N Engl J Med. 2016;375(19):1834-1844.', pmid: '27633186' },
      { label: 'SPRINT Trial', citation: 'Wright JT Jr, et al. A Randomized Trial of Intensive versus Standard Blood-Pressure Control (SPRINT). N Engl J Med. 2015;373(22):2103-2116.', pmid: '26551272' },
      { label: 'TRIDENT Trial', citation: 'Anderson CS, et al. Three Low-Dose Antihypertensive Agents in a Single Pill after Intracerebral Hemorrhage (TRIDENT). N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
      { label: 'RESPECT Trial', citation: 'Kitagawa K, et al. Effect of Standard vs Intensive Blood Pressure Control on the Risk of Recurrent Stroke: A Randomized Clinical Trial and Meta-analysis (RESPECT). JAMA Neurol. 2019;76(11):1309-1318.', pmid: '31355878' }
    ]
  }
];

// =====================================================================
// MAIN EDUCATION MODULE EXPORT
// =====================================================================
export default function Education({ activeSubTab, onSubTabChange, onBack, copyToClipboard, addToast, navigateTo, isTraineeMode = true, workflowContext = null, contextHiddenIds = null }) {
  const subTab = activeSubTab;
  const onNavigate = onSubTabChange || (() => {});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'infographic'

  // Reset viewMode when switching sub-tabs
  useEffect(() => {
    setViewMode('dashboard');
  }, [subTab]);

  useEffect(() => {
    if (activeSubTab) {
      const mapping = {
        'pocket-cards': 'pocket-card',
        'icu': 'icu',
        'simulators': 'simulators',
        'nursing': 'quality',
        'onboarding': 'all'
      };
      const targetKey = mapping[activeSubTab];
      if (targetKey) {
        setSelectedCategory(targetKey);
        onNavigate(null);
      }
    }
  }, [activeSubTab, onNavigate]);

  const categories = [
    { key: "all", label: "All Modules" },
    { key: "simulators", label: "Interactive Simulators" },
    { key: "pocket-card", label: "Pocket Cards" },
    { key: "printable", label: "Printable / Infographics" },
    { key: "icu", label: "Neuro ICU / NCC" },
    { key: "epic", label: "Epic & Notes" },
    { key: "quality", label: "Quality Metrics" },
    { key: "pediatrics", label: "Pediatrics" },
    { key: "trials", label: "Clinical Trials" },
    { key: "needs-review", label: "Needs Review (Placeholders)" },
  ];

  const filteredModules = useMemo(() => {
    return EDUCATION_MODULES.filter(m => {
      // Workflow-context filter: hide only modules the active context (from the
      // /content data layer) explicitly excludes. Empty/absent set hides nothing.
      if (contextHiddenIds && contextHiddenIds.has(m.id)) return false;
      if (selectedCategory !== "all") {
        if (selectedCategory === "needs-review") {
          if (!m.placeholders || m.placeholders.length === 0) return false;
        } else if (!m.categories.includes(selectedCategory)) {
          return false;
        }
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

  // Render individual full detail view
  if (subTab) {
    const activeModule = EDUCATION_MODULES.find(m => m.id === subTab);
    if (activeModule) {
      return (
        <div id="tabpanel-education" role="tabpanel" aria-labelledby="tab-education" className="space-y-6 max-w-4xl mx-auto v7-reveal">
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
                <h1 className="font-serif text-2xl text-ink font-bold">{activeModule.title}</h1>
              </div>
            </header>

            {/* Custom Content for each SubModule */}
            <main id="resource-view-content" className="space-y-6 text-sm text-ink-2">
              {renderSubModuleContent(activeModule.id, viewMode, onNavigate, copyToClipboard, addToast)}
            </main>
          </div>
        </div>
      );
    }
  }

  return (
    <div id="tabpanel-education" role="tabpanel" aria-labelledby="tab-education" className="space-y-6 max-w-6xl mx-auto v7-reveal">
      <header className="bg-card border border-line rounded-lg p-6 space-y-2">
        <h1 className="font-serif text-2xl text-ink font-bold">Educational Resources</h1>
      </header>

      {/* Modules Dashboard Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(m => (
          <article
            key={m.id}
            onClick={() => {
              if (m.external && m.url) {
                window.open(m.url, '_blank', 'noopener,noreferrer');
              } else {
                onNavigate(m.id);
              }
            }}
            className="v7-card cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-all bg-card min-h-[220px]"
          >
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-base text-ink">{m.title}</h2>
              <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">{m.purpose}</p>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">Open →</span>
            </div>
          </article>
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
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: `${origHeight * scale}px`, 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          width: `${origWidth}px`,
          height: `${origHeight}px`,
          flexShrink: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}

const PdfActionBar = ({ title, subtitle, pdfPath, pdfName, iconColorClass = "text-cobalt-600 dark:text-cobalt-400", children }) => {
  const [showPdf, setShowPdf] = useState(false);

  const isHttp = window.location.protocol.startsWith('http');
  const buildVersion = '6.9.24';
  
  // Extract clean path and cache-busted path
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
            className="px-3.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
            Download
          </a>
          <button
            onClick={emailDoc}
            className="px-3.5 py-1.5 bg-orange-700 text-white rounded-lg text-xs font-semibold hover:bg-orange-800 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
            Email
          </button>
        </div>
      </div>

      {showPdf && (
        <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-md h-[800px] no-print">
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

const EvdMaintenanceView = () => {
  const [viewMode, setViewMode] = useState('pocket-card');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-line pb-2 mb-4 no-print">
        <button
          type="button"
          onClick={() => setViewMode('pocket-card')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
            viewMode === 'pocket-card'
              ? 'bg-cobalt-600 text-white shadow-sm'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700'
          }`}
        >
          Quick Reference Card
        </button>
        <button
          type="button"
          onClick={() => setViewMode('interactive')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
            viewMode === 'interactive'
              ? 'bg-cobalt-600 text-white shadow-sm'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700'
          }`}
        >
          Interactive EVD Simulator
        </button>
      </div>

      {viewMode === 'pocket-card' ? (
        <EVDInfographic />
      ) : (
        <ErrorBoundary>
          <div className="bg-white border border-line rounded-lg p-6 dark:bg-card">
            <div className="p-3 mb-4 bg-crit-50 text-crit-900 border border-crit-200 rounded-lg dark:bg-crit-950/40 dark:text-crit-300 dark:border-crit-800/60">
              <h3 className="font-bold text-xs uppercase mb-1">Safety Notice - EVD Orders</h3>
              <p className="text-xs">Do not independently change drain height, clamping, flushing, or collection-system setup. When open and correctly leveled, a lower EVD height drains at a lower ICP threshold; a higher height drains less readily. Follow local policy and explicit Neurosurgery or Neurocritical Care orders.</p>
            </div>
            <EvdIcpSimulator />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

const IcpManagementView = () => {
  const [viewMode, setViewMode] = useState('pocket-card'); // 'pocket-card' or 'interactive'
  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 border-b border-line pb-2 mb-4 no-print">
        <button
          onClick={() => setViewMode('pocket-card')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
            viewMode === 'pocket-card'
              ? 'bg-cobalt-600 text-white shadow-sm'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700'
          }`}
        >
          Quick Reference Card
        </button>
        <button
          onClick={() => setViewMode('interactive')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
            viewMode === 'interactive'
              ? 'bg-cobalt-600 text-white shadow-sm'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700'
          }`}
        >
          Interactive ICP Simulator
        </button>
      </div>

      {viewMode === 'pocket-card' ? (
        <ICPInfographic />
      ) : (
        <ErrorBoundary>
          <div className="bg-white border border-line rounded-lg p-6 dark:bg-card">
            <EvdIcpSimulator />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

// =====================================================================
// RENDER HELPERS FOR DETAILED MODULE VIEWS
// =====================================================================
function renderSubModuleContent(moduleId, viewMode, onNavigate, copyToClipboard, addToast) {
  switch (moduleId) {
    case 'telestroke-map':
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border border-line rounded-lg bg-paper-2">
          <i data-lucide="map" className="w-12 h-12 text-cobalt-600 dark:text-cobalt-400"></i>
          <h3 className="font-serif text-lg font-bold text-ink">Telestroke Network Map</h3>
          <p className="text-sm text-ink-2 max-w-md">
            This external resource shows regional telestroke coverage and expansion map for service planning.
          </p>
          <a
            href="https://rkalani1.github.io/telestroke-expansion-map/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt-600 text-white font-semibold rounded-md hover:bg-cobalt-700 transition-colors"
          >
            Open Map in New Tab
            <i data-lucide="external-link" className="w-4 h-4"></i>
          </a>
        </div>
      );
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
            <h2 className="font-serif text-xl font-bold text-ink mb-4">Pupillometry &amp; NPi Simulator</h2>
            <PupillometrySimulator />
          </div>
        </ErrorBoundary>
      );
    case 'neuro-exams-simulator':
      return (
        <ErrorBoundary>
          <div className="bg-card border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-ink mb-4">Bedside Neuro-Exams Assistant</h2>
            <NeuroExamsTool />
          </div>
        </ErrorBoundary>
      );
    case 'iv-thrombolysis':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <IvThrombolysisCard />
        </ScaledCardWrapper>
      );
    case 'crao-thrombolysis':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <CraoThrombolysisCard />
        </ScaledCardWrapper>
      );
    case 'select-seizure-risk':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <SelectSeizureRiskCard />
        </ScaledCardWrapper>
      );
    case 'edema-swelling-risk':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <EdemaSwellingRiskCard />
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
    case 'aspirin-failure':
      return <AspirinFailureView />;
    case 'cerebral-venous-sinus-thrombosis':
      return <CvstView />;
    case 'large-core-thrombectomy':
      return <LargeCoreThrombectomyView />;
    case 'basilar-artery-occlusion':
      return <BasilarArteryOcclusionView />;
    case 'lipid-management-after-stroke':
      return <LipidManagementView />;
    case 'carotid-stenosis-management':
      return <CarotidStenosisView />;
    case 'brainstem-stroke-syndromes':
      return <BrainstemSyndromesView />;
    case 'vascular-territory-atlas':
      return <VascularTerritoryAtlasView />;
    case 'anticoagulation-reversal':
      return <AnticoagulationReversalView />;
    case 'nihss-simulator':
      return (
        <ErrorBoundary>
          <div className="bg-card border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold text-ink mb-4">NIHSS Certification Simulator</h2>
            <NihssSimulator />
          </div>
        </ErrorBoundary>
      );
    case 'rcvs':
      return <RcvsView />;
    case 'aneurysmal-sah-management':
      return <AneurysmalSahView />;
    case 'cerebral-amyloid-angiopathy':
      return <CerebralAmyloidAngiopathyView />;
    case 'ctp-ghost-core':
      return <CtpGhostCoreView />;
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
    case 'pregnancy-stroke':
      return <PregnancyStrokeView />;
    case 'cancer-associated-stroke':
      return <CancerAssociatedStrokeView />;
    case 'pediatric-stroke':
      return <PediatricStrokeView />;
    case 'dmvo-mevo-management':
      return <DmvoMevoManagementView />;
    case 'extended-window-perfusion':
      return <ExtendedWindowPerfusionView />;
    case 'ich-blood-pressure':
      return <IchBloodPressureView />;
    case 'factor-xia-inhibitors':
      return <FactorXiaInhibitorsView />;
    case 'metabolic-stroke-prevention':
      return <MetabolicStrokePreventionView />;
    default:
      return <p className="text-xs">Module content not found.</p>;
  }
}


/* Bedside clinical pocket cards scoped styling */
const BedsidePocketCardsStyles = () => (
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
    
    <VisualAssetFigure
      src="assets/toast_classification_infographic.png"
      fallbackSvgSrc="assets/toast_classification_infographic.svg"
      alt="TOAST Ischemic Stroke Subtype Classification Diagram showing Large Artery Atherosclerosis, Cardioembolism, Small Vessel Occlusion, Other Determined, and Undetermined Etiologies"
      title="TOAST Ischemic Stroke Subtype Classification"
      captionId="toast-caption"
      caption="TOAST Diagnostic Classification for Ischemic Stroke Etiology (LAA, SVO, CE, Other, Undetermined)"
      onOpenLightbox={setLightboxImage}
    />

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
            <li><strong>Imaging:</strong> Normal scan or deep subcortical/brainstem lesion <strong>≤ 2.0 cm</strong>.</li>
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
              • Atrial fibrillation / flutter<br/>
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
          <h3>5. Undetermined Etiology (UDE / ESUS)</h3>
          <ul className="toast-card-list">
            <li><strong>Two or more potential causes:</strong> e.g. 60% carotid stenosis AND atrial fibrillation (unable to assign single primary cause).</li>
            <li><strong>Incomplete evaluation:</strong> Imaging or cardiac workup pending/incomplete.</li>
            <li><strong>Cryptogenic / ESUS:</strong> Comprehensive workup unrevealing (Embolic Stroke of Undetermined Source).</li>
          </ul>
        </div>
      </div>
    </div>

    
    <div style={{marginTop: '12px', marginBottom: '12px'}}>
      <h3 style={{fontSize: '9.5pt', color: 'var(--purple-deep)', fontWeight: '700', marginBottom: '6px'}}>Mandatory Etiologic Workup Checklist</h3>
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
          <div><strong>Cardiac:</strong> TTE required; consider TEE if cryptogenic / ESUS suspected.</div>
        </div>
      </div>
    </div>
    

    <div style={{borderLeft: '4px solid var(--teal)', background: 'var(--teal-soft)', padding: '10px 14px', borderRadius: '6px', fontSize: '8.6pt', lineHeight: '1.45', color: 'var(--ink-soft)', marginBottom: '14px'}}>
      <strong style={{color: 'var(--teal-deep)', textTransform: 'uppercase', fontSize: '8.6pt', letterSpacing: '0.04em', display: 'block', marginBottom: '3px'}}>Why Subtype Matters — 2026 Secondary Prevention</strong>
      Etiology drives prevention: <strong>cardioembolic</strong> &rarr; oral anticoagulation; <strong>non-cardioembolic</strong> (large-artery, small-vessel, or undetermined/ESUS) &rarr; antiplatelet therapy &plusmn; short-course DAPT. New for 2026: in non-cardioembolic stroke/high-risk TIA already on antiplatelets, adding the oral factor XIa inhibitor <strong>asundexian</strong> further reduced recurrent ischemic stroke without a significant excess of major bleeding (OCEANIC-STROKE, HR 0.74). ESUS trials (NAVIGATE-ESUS, RE-SPECT ESUS) found empiric DOAC anticoagulation no better than aspirin — so ESUS is treated with antiplatelets pending a defined source. See the DAPT and Aspirin Failure cards.
    </div>

    <div className="ref-citation" style={{marginTop: '15px', padding: '10px 12px', fontSize: '8.8pt'}}>
      <strong>Original Study:</strong> Adams HP Jr, et al. TOAST. <em>Stroke</em>. 1993;24:35-41. <a href="https://pubmed.ncbi.nlm.nih.gov/7678184/" target="_blank">PMID: 7678184</a>.<br/>
      <strong>AHA/ASA Guideline:</strong> Kleindorfer DO, et al. 2021 Stroke Prevention. <em>Stroke</em>. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a>.
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

    <VisualAssetFigure
      src="assets/dapt_flowchart_timeline.png"
      fallbackSvgSrc="assets/dapt_flowchart_timeline.svg"
      alt="Dual Antiplatelet Therapy (DAPT) Decision Flowchart and 21-to-90 Day Timeline for High-Risk TIA and Minor Ischemic Stroke (CHANCE, POINT, THALES trials)"
      title="DAPT Flowchart & Timelines"
      captionId="dapt-caption"
      caption="Acute Dual Antiplatelet Therapy (DAPT) Decision Flowchart and Regimen Timelines"
      onOpenLightbox={setLightboxImage}
    />

    
    <table className="card-table" style={{fontSize: '9.0pt', margin: '0 0 10px 0', width: '100%', borderCollapse: 'collapse'}}>
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
            NIHSS ≤3 or ABCD² ≥4. **Within 12 hours** of onset.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 600 mg</strong> +<br/>Aspirin 162–325 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 81mg qD for <strong>21 days</strong>
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            Aspirin 81mg
          </td>
        </tr>
        <tr>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)', fontWeight: '700'}}>
            CHANCE / INSPIRES
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>CHANCE:</strong> NIHSS≤3, ABCD²≥4 within 24h.<br/>
            <strong>INSPIRES:</strong> NIHSS≤5, ABCD²≥4, ≥50% stenosis within 72h.
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
            CYP2C19 LOF carrier (*2/*3) + Minor stroke/TIA. **Within 24h**.
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
            NIHSS ≤5 or high-risk TIA (ABCD² ≥6 or symptomatic stenosis) within 24h.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 180 mg</strong> +<br/>Aspirin 300–325 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Ticagrelor 90mg BID</strong> +<br/>Aspirin 75-100mg for <strong>30 days</strong>
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            Aspirin 81mg
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
    </table>

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
          • **Duration — 21 vs 90 days**: Minor stroke (NIHSS &le;3) / high-risk TIA (ABCD&sup2; &ge;4) &rarr; **21 days** ASA + clopidogrel (POINT/CHANCE), then single antiplatelet — benefit is concentrated in the first 21 days while bleeding risk rises beyond it. Severe symptomatic intracranial atherosclerotic stenosis (70–99%) &rarr; **90 days** ASA + clopidogrel (SAMMPRIS) plus intensive risk-factor control. THALES ASA + ticagrelor is a **30-day** regimen for NIHSS &le;5 / high-risk TIA. Short-course DAPT is endorsed by the 2021 secondary-prevention guideline and the 2026 AHA/ASA AIS guideline.
          <br/>• **Post-Lytic / EVT Policy**: After IV thrombolysis (tenecteplase or alteplase), avoid antithrombotics for the first 24h until follow-up imaging excludes hemorrhage. EVT alone is not a blanket DAPT contraindication; stenting/angioplasty plans and hemorrhage risk drive the decision.
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

    
    <svg viewBox="0 0 735 65" role="img" focusable="false" aria-label="Malignant MCA Infarction Clinical Timeline and Surgical Window" style={{width: '100%', height: '65px', marginBottom: '8px'}}>
      
      <polygon points="0,0 230,0 242,32 230,65 0,65" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
      <text x="110" y="28" fill="var(--teal-deep)" fontSize="8.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 1: 0 - 24 HOURS</text>
      <text x="110" y="44" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">Baseline Core & Serial NIHSS Checks</text>
      
      
      <polygon points="233,0 470,0 482,32 470,65 233,65 245,32" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" />
      <text x="352" y="28" fill="var(--amber-deep)" fontSize="8.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 2: 24 - 48 HOURS</text>
      <text x="352" y="44" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">Peak Edema Phase & Serial CT Scan</text>
      
      
      <polygon points="473,0 735,0 735,65 473,65 485,32" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
      <text x="609" y="28" fill="var(--red-deep)" fontSize="8.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 3: &lt; 48H SURGERY</text>
      <text x="609" y="44" fill="var(--red-deep)" fontSize="7pt" fontFamily="IBM Plex Sans" fontWeight="600" textAnchor="middle">Decompressive Hemicraniectomy</text>
    </svg>

    
    <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)', marginBottom: '12px', boxShadow: '0 4px 12px var(--red-glow)'}}>
      <strong style={{color: 'var(--red-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>1. Decompressive Hemicraniectomy Selection Criteria</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '8.0pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
        <div>
          <strong>Clinical Deficit Severity:</strong>
          <br/>• NIHSS <strong>&gt; 15</strong> (non-dominant hemisphere)
          <br/>• NIHSS <strong>&gt; 20</strong> (dominant hemisphere)
          <br/>• AND decrease in level of consciousness (NIHSS Item 1a score <strong>≥ 1</strong> / obtunded or stuporous)
          <br/>• **Timing**: Surgery performed <strong>within 48 hours</strong> of onset.
        </div>
        <div>
          <strong>Radiographic Markers:</strong>
          <br/>• Infarction of <strong>≥ 50%</strong> of the MCA territory (CT/MRI)
          <br/>• DWI core volume <strong>&gt; 82 mL</strong> within 6 hours
          <br/>• DWI core volume <strong>&gt; 145 mL</strong> within 14 hours
          <br/>• Midline shift or mass effect on repeat imaging
          <br/>• **Surgical Spec**: Bone flap diameter <strong>≥ 12–15 cm</strong> with duraplasty.
        </div>
      </div>
    </div>

    
    <div className="outcome-chart-container">
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>2. Surgical Outcomes & Evidence (By Age Group)</strong>
      
      
      <div className="outcome-row">
        <div className="outcome-label">
          <strong>Age &lt; 60 Years</strong> (DECIMAL/DESTINY)<br/>
          <span style={{fontSize: '6.5pt', fontWeight: 'normal', color: 'var(--ink-mute)'}}>Surgery (22% Mort) vs Med (71% Mort)</span>
        </div>
        <div className="stacked-bar-container">
          <div className="bar-segment bar-mrs-03" style={{width: '43%'}}>43%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '32%'}}>32%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '3%'}}>3%</div>
          <div className="bar-segment bar-mrs-6" style={{width: '22%'}}>22%</div>
        </div>
      </div>

      <div className="outcome-row">
        <div className="outcome-label" style={{opacity: '0.7', fontWeight: 'normal', fontSize: '7.2pt'}}>
          Age &lt; 60 Medical Control
        </div>
        <div className="stacked-bar-container" style={{opacity: '0.7'}}>
          <div className="bar-segment bar-mrs-03" style={{width: '21%'}}>21%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '3%'}}>3%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '5%'}}>5%</div>
          <div className="bar-segment bar-mrs-6" style={{width: '71%'}}>71%</div>
        </div>
      </div>

      
      <div className="outcome-row" style={{marginTop: '6px'}}>
        <div className="outcome-label">
          <strong>Age ≥ 60 Years</strong> (DESTINY II)<br/>
          <span style={{fontSize: '6.5pt', fontWeight: 'normal', color: 'var(--ink-mute)'}}>Surgery (33% Mort) vs Med (70% Mort)</span>
        </div>
        <div className="stacked-bar-container">
          <div className="bar-segment bar-mrs-03" style={{width: '7%'}}>7%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '31%'}}>31%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '29%'}}>29%</div>
          <div className="bar-segment bar-mrs-6" style={{width: '33%'}}>33%</div>
        </div>
      </div>

      <div className="outcome-row">
        <div className="outcome-label" style={{opacity: '0.7', fontWeight: 'normal', fontSize: '7.2pt'}}>
          Age ≥ 60 Medical Control
        </div>
        <div className="stacked-bar-container" style={{opacity: '0.7'}}>
          <div className="bar-segment bar-mrs-03" style={{width: '3%'}}>3%</div>
          <div className="bar-segment bar-mrs-4" style={{width: '15%'}}>15%</div>
          <div className="bar-segment bar-mrs-5" style={{width: '12%'}}>12%</div>
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
        • **Age &lt; 60**: NNT = 2 for survival, NNT = 4 for survival with mRS ≤3 (able to walk unassisted). | • **Age ≥ 60**: NNT = 3 for survival, NNT = 25 for mRS ≤3. *Goals-of-care discussion critical.
      </div>
    </div>

    
    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '12px 14px', background: 'white', marginBottom: '20px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>3. Supportive ICU Care & Medical Management</strong>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.8pt', lineHeight: '1.35', color: 'var(--ink)'}}>
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
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Target normothermia (&lt;37.8°C). Target normocapnia (PaCO2 35-45 mmHg); avoid hypoventilation/hypercapnia.</td>
          </tr>
          <tr>
            <td style={{fontWeight: '700', padding: '4px 0', color: 'var(--purple-deep)', verticalAlign: 'top'}}>Steroids</td>
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}><strong style={{color: 'var(--red)'}}>Class III (Harmful)</strong>: Corticosteroids are NOT recommended for reducing cerebral edema in acute ischemic stroke.</td>
          </tr>
        </tbody>
      </table>
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

    <VisualAssetFigure
      src="assets/afib_timing_protocol.png"
      fallbackSvgSrc="assets/afib_timing_protocol.svg"
      alt="Atrial Fibrillation Post-Stroke DOAC Resumption Protocol Diagram showing 1-3-6-12 day rule and CATALYST meta-analysis timing criteria based on stroke severity"
      title="AFib Anticoagulation Resumption Protocol"
      captionId="afib-caption"
      caption="Atrial Fibrillation Post-Stroke Anticoagulation Resumption Protocol & CATALYST Timing"
      onOpenLightbox={setLightboxImage}
    />

    
    <div style={{borderLeft: '4px solid var(--teal)', background: 'var(--teal-soft)', padding: '6px 10px', borderRadius: '6px', fontSize: '7.8pt', marginBottom: '4px', lineHeight: '1.45', boxShadow: '0 2px 8px var(--teal-glow)'}}>
      <strong style={{color: 'var(--teal-deep)', textTransform: 'uppercase', fontSize: '7.2pt', letterSpacing: '0.05em', display: 'block', marginBottom: '1px'}}>Clinical Efficacy & Safety</strong>
      RCT and individual-patient meta-analysis data support early DOAC initiation in carefully selected AFib-related ischemic stroke patients, especially mild-to-moderate infarcts without high-risk hemorrhagic transformation. Early treatment has not shown excess symptomatic intracranial hemorrhage (sICH) versus delayed treatment and may reduce recurrent ischemic stroke; DOACs are preferred over warfarin for most nonvalvular AF patients when anticoagulation is indicated.
    </div>

    
    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '6px 8px', background: 'var(--fill-soft)', marginBottom: '4px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '9.0pt', display: 'block', marginBottom: '4px'}}>1. Stroke Severity Classification (ELAN Imaging Criteria)</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '8.8pt', lineHeight: '1.45'}}>
        <div style={{border: '1px solid rgba(24,132,158,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--teal-deep)', display: 'block'}}>Minor / Small Infarct</strong>
          • TIA or infarct <strong>≤ 1.5 cm</strong> on brain imaging. NIHSS can guide bedside risk but is not the ELAN definition.
        </div>
        <div style={{border: '1px solid rgba(217,134,11,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--amber-deep)', display: 'block'}}>Moderate Infarct</strong>
          • Cortical superficial-branch lesion, internal border-zone lesion, or deep-branch lesion <strong>&gt; 1.5 cm</strong>.
        </div>
        <div style={{border: '1px solid rgba(198,46,46,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--red-deep)', display: 'block'}}>Major / Large Infarct</strong>
          • Complete vascular territory, ≥2 moderate lesions, large multilobar infarct, or brainstem/cerebellar lesion <strong>≥ 1.5 cm</strong>.
        </div>
      </div>
    </div>

    
    <svg viewBox="0 0 735 150" role="img" focusable="false" aria-label="AFib Anticoagulation Resumption Timing by Infarct Severity" style={{width: '100%', height: '150px', marginBottom: '12px'}}>
      
      <rect x="0" y="0" width="735" height="150" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      
      
      <line x1="20" y1="95" x2="715" y2="95" stroke="var(--ink-mute)" strokeWidth="2"/>
      
      
      <line x1="20" y1="90" x2="20" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="20" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 1</text>
      
      <line x1="73.5" y1="90" x2="73.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="73.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 2</text>
      
      <line x1="127" y1="90" x2="127" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="127" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 3</text>
      
      <line x1="180.5" y1="90" x2="180.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="180.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 4</text>
      
      <line x1="234" y1="90" x2="234" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="234" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 5</text>
      
      <line x1="287.5" y1="90" x2="287.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="287.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 6</text>
      
      <line x1="341" y1="90" x2="341" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="341" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 7</text>
      
      <line x1="394.5" y1="90" x2="394.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="394.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 8</text>
      
      <line x1="448" y1="90" x2="448" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="448" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 9</text>
      
      <line x1="501.5" y1="90" x2="501.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="501.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 10</text>
      
      <line x1="555" y1="90" x2="555" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="555" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 11</text>
      
      <line x1="608.5" y1="90" x2="608.5" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="608.5" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 12</text>
      
      <line x1="662" y1="90" x2="662" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="662" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 13</text>
      
      <line x1="715" y1="90" x2="715" y2="100" stroke="var(--ink-mute)" strokeWidth="2"/>
      <text x="715" y="112" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Day 14</text>
      
      
      <rect x="20" y="65" width="53.5" height="15" rx="3" fill="var(--teal)" opacity="0.15"/>
      <rect x="20" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--teal)" strokeWidth="1.5"/>
      <text x="46.7" y="76" fill="var(--teal-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MILD / TIA</text>
      <path d="M 46.7 80 L 46.7 93" stroke="var(--teal)" strokeWidth="1" strokeDasharray="2,2"/>
      
      
      <rect x="127" y="65" width="53.5" height="15" rx="3" fill="var(--amber)" opacity="0.15"/>
      <rect x="127" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--amber)" strokeWidth="1.5"/>
      <text x="153.7" y="76" fill="var(--amber-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MODERATE</text>
      <path d="M 153.7 80 L 153.7 93" stroke="var(--amber)" strokeWidth="1" strokeDasharray="2,2"/>
      
      
      <rect x="73.5" y="15" width="107" height="30" rx="4" fill="white" stroke="var(--amber)" strokeWidth="1" style={{filter: 'drop-shadow(0 2px 4px var(--amber-glow))'}}/>
      <text x="127" y="26" fill="var(--amber-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">REPEAT CT/MRI</text>
      <text x="127" y="37" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Day 2-3 (Pre-DOAC)</text>
      <path d="M 127 45 L 127 60" stroke="var(--amber)" strokeWidth="1"/>
      
      
      <rect x="287.5" y="65" width="53.5" height="15" rx="3" fill="var(--red)" opacity="0.15"/>
      <rect x="287.5" y="65" width="53.5" height="15" rx="3" fill="none" stroke="var(--red)" strokeWidth="1.5"/>
      <text x="314.2" y="76" fill="var(--red-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">SEVERE</text>
      <path d="M 314.2 80 L 314.2 93" stroke="var(--red)" strokeWidth="1" strokeDasharray="2,2"/>
      
      
      <rect x="234" y="15" width="107" height="30" rx="4" fill="white" stroke="var(--red)" strokeWidth="1" style={{filter: 'drop-shadow(0 2px 4px var(--red-glow))'}}/>
      <text x="287.5" y="26" fill="var(--red-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">REPEAT CT/MRI</text>
      <text x="287.5" y="37" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Day 5-6 (Pre-DOAC)</text>
      <path d="M 287.5 45 L 287.5 60" stroke="var(--red)" strokeWidth="1"/>
      
      
      <rect x="608.5" y="61" width="106.5" height="22" rx="3" fill="var(--red)" opacity="0.25"/>
      <rect x="608.5" y="61" width="106.5" height="22" rx="3" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="661.7" y="70" fill="var(--red-deep)" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">SEVERE +</text>
      <text x="661.7" y="79" fill="var(--red-deep)" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PH-2 HEMORRHAGE</text>
      <path d="M 661.7 83 L 661.7 93" stroke="var(--red)" strokeWidth="1" strokeDasharray="2,2"/>
      <text x="661.7" y="137" fill="var(--red-deep)" fontSize="5.8pt" fontFamily="IBM Plex Sans" fontWeight="600" textAnchor="middle">Delay initiation to Day 12-14</text>
      
      
      <text x="367" y="141" fill="var(--ink-mute)" fontSize="7pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">DOAC INITIATION TIMELINE AXIS (DAYS POST-AIS)</text>
    </svg>

    
    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '12px 14px', background: 'white', marginBottom: '20px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '9.2pt', display: 'block', marginBottom: '4px'}}>2. Bedside DOAC Dosing & Adjustment Guide</strong>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.6pt', lineHeight: '1.45', color: 'var(--ink)'}}>
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
            <td style={{padding: '6px 8px'}}>20 mg daily (with food)</td>
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>Reduce to 15 mg daily</strong> if CrCl is 15–50 mL/min.
              <br/><span style={{color: 'var(--red)'}}>Hold if CrCl &lt; 15 mL/min</span>.
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
            <td style={{padding: '6px 8px', color: 'var(--ink-soft)'}}><strong>Reduce to 30 mg daily</strong> if CrCl is 15–50 mL/min or weight ≤ 60 kg.
              <br/><span style={{color: 'var(--red)'}}>Avoid if CrCl &gt; 95 mL/min</span> (high renal clearance reduces efficacy).
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    
    <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.45'}}>
      <strong>ELAN Trial:</strong> Fischer U et al. <em>N Engl J Med</em>. 2023;388:2411-2421. <a href="https://pubmed.ncbi.nlm.nih.gov/37222476/" target="_blank">PMID: 37222476</a><br/>
      <strong>CATALYST Meta-Analysis:</strong> Dehbi HM et al. <a href="https://pubmed.ncbi.nlm.nih.gov/40570866/" target="_blank"><em>Lancet</em> 2025; PMID: 40570866</a>. Pooled data (n=5,441) from <a href="https://pubmed.ncbi.nlm.nih.gov/37222476/" target="_blank">ELAN (PMID: 37222476)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/39491870/" target="_blank">OPTIMAS (<em>Lancet</em> 2024; PMID: 39491870)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/36065821/" target="_blank">TIMING (<em>Circulation</em> 2022; PMID: 36065821)</a>, and <a href="https://pubmed.ncbi.nlm.nih.gov/40163159/" target="_blank">START (<em>JAMA Neurol</em> 2025; PMID: 40163159)</a>. Early DOAC (median Day 2) vs delayed (median Day 7-8) showed no excess sICH (0.4% vs 0.4%) and fewer recurrent ischemic events in pooled data.<br/>
      <strong>AFib Guidelines:</strong> Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. <em>Circulation</em>. 2024;149:e1-e156. <a href="https://pubmed.ncbi.nlm.nih.gov/38043043/" target="_blank">PMID: 38043043</a>
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
export const EVDInfographic = () => {
  const [showPdf, setShowPdf] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const emailDoc = () => {
    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/documents/references/External Ventricular Drain.pdf';
    const subject = encodeURIComponent('External Ventricular Drain');
    const body = encodeURIComponent(fullUrl);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Action Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700/60 gap-3 no-print">
        <div className="flex items-center gap-2">
          <i aria-hidden="true" data-lucide="file-output" className="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">External Ventricular Drain</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF Reference Guide</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPdf(!showPdf)}
            className="px-3.5 py-1.5 bg-cobalt-600 text-white rounded-lg text-xs font-semibold hover:bg-cobalt-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="eye" className="w-3.5 h-3.5"></i>
            {showPdf ? "Hide PDF Preview" : "Preview PDF"}
          </button>
          <a
            href="documents/references/External Ventricular Drain.pdf"
            download="External Ventricular Drain.pdf"
            className="px-3.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
            Download
          </a>
          <button
            onClick={emailDoc}
            className="px-3.5 py-1.5 bg-orange-700 text-white rounded-lg text-xs font-semibold hover:bg-orange-800 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
            Email
          </button>
        </div>
      </div>

      {showPdf && (
        <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-md h-[800px] no-print">
          <iframe
            src="documents/references/External Ventricular Drain.pdf"
            className="w-full h-full border-none"
            title="External Ventricular Drain PDF"
          />
        </div>
      )}

      {/* Static Quick Reference Card */}
      <div className="evd-infographic-card border border-slate-250 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        {/* Header */}
        <div className="bg-slate-800 text-white text-center py-3.5 px-4">
          <h3 className="font-serif text-lg font-bold tracking-wide">External Ventricular Drain</h3>
        </div>

        {/* Top Split Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 dark:border-slate-800">
          {/* Left Col: SVG Graphic (Vector Replacement) */}
          <div className="flex justify-center items-center p-4 bg-slate-50 dark:bg-slate-950/20 border-r border-slate-200 dark:border-slate-800">
            <div 
              className="relative group cursor-zoom-in overflow-hidden rounded-md flex justify-center items-center"
              onClick={() => setLightboxImage({ src: 'assets/evd_photo_cropped.png', alt: 'EVD Cylinder Setup', title: 'External Ventricular Drain Setup' })}
            >
              <img 
                src="assets/evd_photo_cropped.png" 
                loading="lazy"
                decoding="async"
                alt="EVD Cylinder Setup" 
                className="max-h-[260px] object-contain rounded-md shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                <span className="text-[11px] text-white font-semibold bg-black/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                  <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                </span>
              </div>
            </div>
          </div>

          {/* Right Col: Basics & SNACC Vector Logo */}
          <div className="flex flex-col">
            <div className="bg-ok-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
              Basics
            </div>
            <div className="p-4 flex-grow text-xs text-slate-600 dark:text-slate-350 space-y-2">
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Leveling:</strong> Always align the zero level of the EVD scale/transducer to the external auditory meatus (EAM) / tragus.</li>
                <li><strong>Mobilization Clamping Rules:</strong> Always CLAMP the EVD before: turning the patient, adjusting HOB, or mobilizing the patient out of bed to prevent severe overdrainage or underdrainage.</li>
                <li><strong>Waveform:</strong> ICP value and waveform morphology are valid only when the EVD is clamped.</li>
                <li><strong>CSF Drainage and Settings:</strong> CSF drainage is passive and occurs only when patient ICP exceeds the EVD chamber height setting. Setting the EVD higher (e.g., +15 vs. +5 cmH₂O) increases the pressure threshold required for CSF to flow, thereby reducing drainage volume for any given ICP.</li>
                <li><strong>Normal CSF Flow:</strong> Normal CSF production is ~20 mL/hr (~500 mL/day). Drainage &gt;20 mL/hr should trigger immediate assessment for overdrainage or chamber level escalation.</li>
                <li><strong>Weaning:</strong> Gradual escalation of drainage setting by 5 cmH₂O per day. After +20 cmH₂O, EVD should be clamped & head CT obtained to evaluate ventricular caliber. Neurologic examination, CSF output, and ICP waveform should be assessed daily.</li>
              </ul>
            </div>
            <div className="flex justify-center items-center p-3 border-t border-slate-150 bg-white dark:bg-slate-800 h-[55px]">
              <svg viewBox="0 0 280 50" className="w-full max-h-[40px] object-contain select-none" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false" aria-label="SNACC - Society for Neuroscience in Anesthesiology and Critical Care Logo">
                <path d="M 10,25 C 10,15 18,8 28,8 C 38,8 46,15 46,25 C 46,35 38,42 28,42 C 18,42 10,35 10,25 Z" fill="none" stroke="#5B3B9C" strokeWidth="1.5" />
                <circle cx="28" cy="25" r="4" fill="#18849E" />
                <line x1="28" y1="25" x2="20" y2="18" stroke="#5B3B9C" strokeWidth="1.2" />
                <line x1="28" y1="25" x2="36" y2="18" stroke="#5B3B9C" strokeWidth="1.2" />
                <line x1="28" y1="25" x2="20" y2="32" stroke="#5B3B9C" strokeWidth="1.2" />
                <line x1="28" y1="25" x2="36" y2="32" stroke="#5B3B9C" strokeWidth="1.2" />
                <circle cx="20" cy="18" r="2" fill="#5B3B9C" />
                <circle cx="36" cy="18" r="2" fill="#5B3B9C" />
                <circle cx="20" cy="32" r="2" fill="#5B3B9C" />
                <circle cx="36" cy="32" r="2" fill="#5B3B9C" />
                <text x="56" y="24" fill="#3A2368" fontSize="16" fontFamily="'Outfit', sans-serif" fontWeight="900" letterSpacing="1px" className="dark:fill-cobalt-400">SNACC</text>
                <text x="56" y="38" fill="#636472" fontSize="6.5" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.2px" className="dark:fill-slate-400">SOCIETY FOR NEUROSCIENCE</text>
                <text x="56" y="45" fill="#636472" fontSize="5.5" fontFamily="sans-serif" fontWeight="400" className="dark:fill-slate-400">IN ANESTHESIOLOGY AND CRITICAL CARE</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Components Section */}
        <div>
          <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Components
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-950/10 border-b border-slate-200 dark:border-slate-800">
            <ol className="list-decimal pl-5 space-y-1.5">
              <li><strong>Drainage setting:</strong> CSF drainage is passive and occurs only when patient ICP exceeds the EVD chamber height setting. Setting the EVD higher (e.g., +15 vs. +5 cmH₂O) increases the pressure threshold required for CSF to flow, thereby reducing drainage volume for any given ICP.</li>
              <li><strong>Drainage stopcock:</strong> 12 o'clock = clamp/closed, 3 o'clock = open to drain.</li>
              <li><strong>Transducer and zeroing stopcock:</strong> Controls baseline calibration.</li>
              <li><strong>Collection/drip chamber:</strong> Graduated cylinder measuring CSF volume.</li>
            </ol>
          </div>
        </div>

        {/* Indications Section */}
        <div>
          <div className="bg-blue-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Indications
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-950/10 border-b border-slate-200 dark:border-slate-800">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>CSF Diversion</strong> for acute obstructive hydrocephalus (e.g., IVH, posterior fossa stroke).</li>
              <li><strong>ICP Monitoring</strong> in severe brain injury (GCS &le; 8).</li>
            </ul>
          </div>
        </div>

        {/* Signs of Obstructive Hydrocephalus Section */}
        <div>
          <div className="bg-cobalt-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Signs of Obstructive Hydrocephalus
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 bg-cobalt-50/20 dark:bg-cobalt-950/5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-4 border-r border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-xs text-cobalt-800 dark:text-cobalt-300 mb-1.5">Clinical Signs:</h5>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                <li>Decline in Level of Consciousness (LOC) or progressive somnolence.</li>
                <li><strong>Parinaud's Syndrome:</strong> Upward gaze palsy (setting sun sign), retraction nystagmus on convergence, and pupillary light-near dissociation.</li>
              </ul>
            </div>
            <div className="p-4">
              <h5 className="font-bold text-xs text-cobalt-800 dark:text-cobalt-300 mb-1.5">Radiographic Signs (NCCT Head):</h5>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                <li>Progressive enlargement of the cerebral ventricles.</li>
                <li>Temporal horn dilation (sensitive early sign of obstruction).</li>
                <li>High-risk factors: Intraventricular Hemorrhage (IVH) in 3rd or 4th ventricles, compression of 4th ventricle, or high volume blood.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Complications Section */}
        <div>
          <div className="bg-rose-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Complications
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-rose-50/15 dark:bg-rose-950/5">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Overdrainage (&gt;20 mL/hr):</strong> Risk of subdural hematomas (bridging vein tearing), ventricular collapse (slit ventricles), or upward cerebellar herniation.</li>
              <li><strong>Underdrainage:</strong> Risk of worsening hydrocephalus, brain compression, or elevated ICP. Troubleshoot for system kinks, blood clots, air locks, or malpositioned stopcocks.</li>
            </ul>
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
};

// =====================================================================
// INTRACRANIAL HYPERTENSION AND HERNIATION CARD (STATIC / PRINT-PREPARED)
// =====================================================================
export const ICPInfographic = () => {
  const [showPdf, setShowPdf] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const emailDoc = () => {
    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/documents/references/Intracranial Hypertension & Herniation.pdf';
    const subject = encodeURIComponent('Intracranial Hypertension & Herniation');
    const body = encodeURIComponent(fullUrl);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Action Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800/40 dark:border-slate-700/60 gap-3 no-print">
        <div className="flex items-center gap-2">
          <i aria-hidden="true" data-lucide="file-output" className="w-5 h-5 text-crit-600 dark:text-crit-400"></i>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Intracranial Hypertension &amp; Herniation - Stroke</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF Reference Guide</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPdf(!showPdf)}
            className="px-3.5 py-1.5 bg-cobalt-600 text-white rounded-lg text-xs font-semibold hover:bg-cobalt-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="eye" className="w-3.5 h-3.5"></i>
            {showPdf ? "Hide PDF Preview" : "Preview PDF"}
          </button>
          <a
            href="documents/references/Intracranial Hypertension &amp; Herniation.pdf"
            download="Intracranial Hypertension &amp; Herniation.pdf"
            className="px-3.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
            Download
          </a>
          <button
            onClick={emailDoc}
            className="px-3.5 py-1.5 bg-orange-700 text-white rounded-lg text-xs font-semibold hover:bg-orange-800 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
            Email
          </button>
        </div>
      </div>

      {showPdf && (
        <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-md h-[800px] no-print">
          <iframe
            src="documents/references/Intracranial Hypertension &amp; Herniation.pdf"
            className="w-full h-full border-none"
            title="Intracranial Hypertension &amp; Herniation PDF"
          />
        </div>
      )}

      {/* Static Quick Reference Card */}
      <div className="icp-infographic-card border border-crit-200 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        {/* Header */}
        <div className="bg-slate-800 text-white text-center py-3.5 px-4 border-b border-crit-200 dark:border-crit-900/50">
          <h3 className="font-serif text-lg font-bold tracking-wide">Intracranial Hypertension &amp; Herniation - Stroke</h3>
        </div>

        {/* Clinical Signs Section */}
        <div>
          <div className="bg-rose-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Clinical Signs of Herniation
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-orange-50/10 dark:bg-orange-950/5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Motor decline:</strong> Spontaneous GCS motor score decrease of &ge; 1 point.</li>
                  <li><strong>Pupillary reactivity:</strong> Decrease in pupillary reactivity (Neurological Pupil Index, NPi &lt; 3).</li>
                  <li><strong>Asymmetry:</strong> New pupillary asymmetry or unilateral dilation (ipsilateral mydriasis).</li>
                  <li><strong>Focal deficit:</strong> New focal motor deficit or abnormal posturing (decorticate / decerebrate).</li>
                  <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <span className="font-bold text-crit-600 dark:text-crit-400">*Cushing triad is a LATE sign of brainstem compression.*</span></li>
                </ul>
              </div>
              <div className="w-full md:w-[42%] flex justify-center items-center p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-orange-200 dark:border-orange-900 shrink-0">
                <div 
                  className="relative group cursor-zoom-in overflow-hidden rounded-md flex justify-center items-center w-full"
                  onClick={() => setLightboxImage({ src: 'assets/herniation_diagram.png', alt: 'Brain Herniation Diagram', title: 'Brain Herniation Syndromes' })}
                >
                  <img 
                    src="assets/herniation_diagram.png" 
                    loading="lazy"
                    decoding="async"
                    alt="Brain Herniation Diagram" 
                    className="max-h-[160px] object-contain rounded-md transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                    <span className="text-[10px] text-white font-semibold bg-black/60 px-2 py-1 rounded-md flex items-center gap-1">
                      <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-orange-200 dark:divide-orange-900 text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                <thead>
                  <tr className="bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-300 font-bold">
                    <th scope="col" className="px-3 py-1.5 text-left font-bold border-b border-orange-200 dark:border-orange-900 w-[20%]">Syndrome</th>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold border-b border-orange-200 dark:border-orange-900 w-[35%]">Anatomy</th>
                    <th scope="col" className="px-3 py-1.5 text-left font-bold border-b border-orange-200 dark:border-orange-900 w-[45%]">Exam &amp; Diagnostic Trap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 dark:divide-orange-950/50">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-orange-850 dark:text-orange-400 border-r border-orange-100 dark:border-orange-950/30">Uncal (Lateral)</td>
                    <td className="px-3 py-2 border-r border-orange-100 dark:border-orange-950/30">Medial temporal lobe (uncus) pushed over tentorial edge</td>
                    <td className="px-3 py-2">Ipsilateral sluggish/dilated pupil (CN III compressed), contralateral hemiparesis. <br/><strong>Kernohan's Notch</strong> causes false-localizing ipsilateral hemiparesis.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-orange-855 dark:text-orange-400 border-r border-orange-100 dark:border-orange-950/30">Central (Axial)</td>
                    <td className="px-3 py-2 border-r border-orange-100 dark:border-orange-950/30">Downward diencephalic and midbrain displacement</td>
                    <td className="px-3 py-2">Progressive stupor, midpoint fixed pupils, decorticate to decerebrate posturing. <br/>Symmetrical signs often confused with metabolic encephalopathy.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-orange-855 dark:text-orange-400 border-r border-orange-100 dark:border-orange-950/30">Subfalcine</td>
                    <td className="px-3 py-2 border-r border-orange-100 dark:border-orange-950/30">Cingulate gyrus displaced under the falx cerebri</td>
                    <td className="px-3 py-2">Often clinically silent, or presents with contralateral lower extremity weakness. <br/><strong>ACA compression</strong> causes frontal/leg territory infarction.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-orange-855 dark:text-orange-400 border-r border-orange-100 dark:border-orange-950/30">Tonsillar</td>
                    <td className="px-3 py-2 border-r border-orange-100 dark:border-orange-950/30">Cerebellar tonsils forced through the foramen magnum</td>
                    <td className="px-3 py-2">Cushing's triad, flaccid quadriplegia, respiratory arrest.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Management Section */}
        <div>
          <div className="bg-ok-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Management
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 bg-ok-50/15 dark:bg-ok-950/5 border-b border-slate-200 dark:border-slate-800">
            {/* Left Column: General approach */}
            <div className="p-4 space-y-3">
              <h5 className="font-bold text-xs text-ok-800 dark:text-ok-300 border-b border-ok-100 dark:border-ok-900/40 pb-1 uppercase tracking-wider">General approach</h5>
              <div className="space-y-1">
                <strong className="text-ok-800 dark:text-ok-400 block text-xs">Fundamental Measures</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-350">
                  <li>Elevate HOB 30°; strict neutral midline neck alignment to preserve venous outflow.</li>
                  <li>Euvolemia (isotonic saline; avoid hypotonic <code className="text-rose-600 dark:text-rose-450 font-mono text-[10px]">D5W</code>).</li>
                  <li>Temperature &lt; 38.0°C.</li>
                  <li>Normocapnia (target <code className="font-mono">pCO₂</code> 35–45 mmHg).</li>
                  <li>When ICP is monitored, CPP = MAP - ICP; many protocols target CPP around &gt;60 mmHg, individualized to disease context.</li>
                </ul>
              </div>
              <div className="space-y-1">
                <strong className="text-ok-800 dark:text-ok-400 block text-xs">Medical Interventions</strong>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 dark:text-slate-350">
                  <li><strong>Analgesia/sedation (fentanyl/propofol):</strong> Target RASS -1 to +1 to prevent coughing, agitation, or ventilator dyssynchrony.</li>
                  <li><strong>Mannitol 20% solution:</strong> 1 g/kg IV bolus over 20–30 min. Must use in-line 0.22-micron filter. <span className="font-semibold text-crit-600 dark:text-crit-400">Hold if Serum Osmolarity &gt; 320 mOsm/kg OR Osmolar Gap &ge; 20 mOsm/kg.</span></li>
                  <li><strong>Hypertonic Saline (HTS):</strong> 3% (150–250 mL bolus) or 23.4% (30 mL rescue bolus; central line access only). <span className="font-semibold text-crit-600 dark:text-crit-400">Hold if Serum Sodium &gt; 155–160 mEq/L or Chloride &gt; 115–120 mEq/L.</span></li>
                  <li><strong>Ventilation:</strong> Maintain normocapnia (<code className="font-mono">PaCO2</code> 35–45 mmHg). For impending herniation only, use brief controlled hyperventilation targeting about 30–35 mmHg while definitive therapy is initiated; avoid prophylactic or prolonged hypocapnia.</li>
                  <li><strong>Refractory ICP Elevation:</strong> High-dose barbiturate therapy (pentobarbital) titrated to burst suppression on EEG.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Surgical Management */}
            <div className="p-4 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-xs text-ok-800 dark:text-ok-300 border-b border-ok-100 dark:border-ok-900/40 pb-1 uppercase tracking-wider">Surgical Management</h5>
              <div className="space-y-1">
                <strong className="text-ok-800 dark:text-ok-400 block text-xs">CSF Diversion:</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-350">
                  <li>EVD placement for acute hydrocephalus, intraventricular hemorrhage (IVH), or mass effect with ventriculomegaly.</li>
                </ul>
              </div>
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                <strong className="text-ok-800 dark:text-ok-400 block text-xs">Decompressive Surgery:</strong>
                <ul className="list-disc pl-5 space-y-2 text-[11px] text-slate-600 dark:text-slate-350">
                  <li>
                    <strong>Malignant MCA (DHC):</strong> Age &le; 60 years, clinical decline, infarct &ge; 50% MCA territory, within 48h of onset (DECIMAL/DESTINY trials).
                  </li>
                  <li>
                    <strong>Cerebellar Stroke (Suboccipital Decompression):</strong> Mass effect on brainstem, 4th ventricle effacement, cerebellar herniation, or hydrocephalus.
                  </li>
                  <li>
                    <strong>Intracranial Hemorrhage (ICH):</strong> Cerebellar ICH with deterioration, brainstem compression, hydrocephalus, or large size requires urgent surgical evaluation. Supratentorial/lobar ICH evacuation or decompression is case-dependent rather than routine.
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="p-4 bg-ok-50/15 dark:bg-ok-950/5 border-b border-slate-200 dark:border-slate-800">
            <div className="border border-crit-200 dark:border-crit-900 bg-crit-50/50 dark:bg-crit-950/10 p-3 rounded-lg text-slate-700 dark:text-slate-350 text-[11px] leading-relaxed space-y-2">
              <div>
                <strong className="text-crit-700 dark:text-crit-400 block font-bold mb-1">Management is not necessarily sequential</strong>
                For active herniation or rapid clinical/radiographic deterioration, immediately initiate medical interventions & call Neurosurgery.
              </div>
              <div className="border-t border-crit-200/50 dark:border-crit-900/50 pt-2 font-semibold text-crit-700 dark:text-crit-400">
                Corticosteroids are not indicated for cytotoxic edema in stroke and increase infection risk.
              </div>
            </div>
          </div>
        </div>

        {/* ICP Waveform Section */}
        <div>
          <div className="bg-blue-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            ICP Waveform Analysis
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/15 flex flex-col items-center gap-4">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-250 dark:border-slate-800 w-full">
              <svg viewBox="0 0 420 150" className="w-full h-auto max-w-[450px] mx-auto block select-none" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false" aria-label="ICP Waveform Analysis: Normal Compliance (P1 > P2 > P3) versus Impaired Compliance (P2 > P1) Diagram">
                <line x1="10" y1="25" x2="410" y2="25" stroke="#1e293b" strokeWidth="1" />
                <line x1="10" y1="50" x2="410" y2="50" stroke="#1e293b" strokeWidth="1" />
                <line x1="10" y1="75" x2="410" y2="75" stroke="#1e293b" strokeWidth="1" />
                <line x1="10" y1="100" x2="410" y2="100" stroke="#1e293b" strokeWidth="1" />
                <line x1="10" y1="125" x2="410" y2="125" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="10" x2="50" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="100" y1="10" x2="100" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="150" y1="10" x2="150" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="200" y1="10" x2="200" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="250" y1="10" x2="250" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="300" y1="10" x2="300" y2="140" stroke="#1e293b" strokeWidth="1" />
                <line x1="350" y1="10" x2="350" y2="140" stroke="#1e293b" strokeWidth="1" />
                <text x="15" y="20" fill="#10b981" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Normal Compliance (P1 &gt; P2 &gt; P3)</text>
                <path d="M 15,120 C 25,120 30,35 40,35 C 50,35 55,75 60,75 C 65,75 70,55 80,55 C 90,55 95,90 100,90 C 105,90 110,75 120,75 C 130,75 140,120 160,120" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="40" cy="35" r="7" fill="#2563eb" />
                <text x="40" y="38" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P1</text>
                <circle cx="80" cy="55" r="7" fill="#2563eb" />
                <text x="80" y="58" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P2</text>
                <circle cx="120" cy="75" r="7" fill="#2563eb" />
                <text x="120" y="78" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P3</text>
                <line x1="200" y1="15" x2="200" y2="135" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="215" y="20" fill="#f43f5e" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Impaired Compliance (P2 &gt; P1)</text>
                <path d="M 215,100 C 225,100 230,55 240,55 C 250,55 255,80 260,80 C 265,80 270,30 280,30 C 290,30 295,90 300,90 C 305,90 310,70 320,70 C 330,70 340,100 360,100" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                <circle cx="240" cy="55" r="7" fill="#2563eb" />
                <text x="240" y="58" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P1</text>
                <circle cx="280" cy="30" r="7" fill="#2563eb" />
                <text x="280" y="33" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P2</text>
                <circle cx="320" cy="70" r="7" fill="#2563eb" />
                <text x="320" y="73" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">P3</text>
                <text x="215" y="130" fill="#94a3b8" fontSize="8.5" fontFamily="sans-serif" fontStyle="italic">Tissue compliance exhausted; elevated baseline pressure</text>
              </svg>
            </div>
            <div className="w-full text-xs text-slate-600 dark:text-slate-350 space-y-1.5">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>P1 (Percussion wave):</strong> Arterial pulsation.</li>
                <li><strong>P2 (Tidal wave):</strong> State of intracranial compliance (elastic reserve).</li>
                <li><strong>P3 (Dicrotic wave):</strong> Dicrotic notch / venous pulsation.</li>
                <li><strong>Compliance Interpretation:</strong>
                  <ul className="list-circle pl-5 mt-1 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <li><strong>Normal Compliance:</strong> P1 &gt; P2 &gt; P3 (elastic brain tissue easily cushions pulsations).</li>
                    <li><strong>Impaired Compliance / High ICP:</strong> P2 &gt; P1 (brain tissue reserve exhausted; high risk of herniation).</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Perfusion Trap Warning Box */}
            <div className="w-full border border-crit-200 dark:border-crit-900 bg-crit-50/50 dark:bg-crit-950/10 p-3 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-crit-700 dark:text-crit-400 block font-bold mb-1">CPP = MAP - ICP</strong>
              In patients with intracranial hypertension or mass effect, cerebral perfusion is highly pressure dependent, and cautious BP lowering is recommended.
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
};

export function IvThrombolysisCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>IV Thrombolysis: Tenecteplase &amp; Time Windows</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            2026 AHA/ASA Acute Ischemic Stroke Guideline &amp; landmark tenecteplase trials.
          </p>

          {/* Time-window pathway */}
          <svg viewBox="0 0 735 96" role="img" focusable="false" aria-label="IV Thrombolysis Thrombolytic Agent Selection and Window Algorithm" style={{width: '100%', height: '96px', marginBottom: '10px'}}>
            <rect x="0" y="0" width="735" height="96" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
            <rect x="18" y="14" width="214" height="30" rx="6" fill="var(--purple-deep)" />
            <text x="125" y="29" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle" dominantBaseline="central">STANDARD WINDOW &le; 4.5 h</text>
            <text x="125" y="60" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">TNK 0.25 mg/kg bolus for all eligible AIS</text>
            <text x="125" y="72" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">(ATTEST-2: TNK non-inferior to alteplase)</text>
            <path d="M 236 29 L 262 29" stroke="var(--purple)" strokeWidth="2" fill="none" markerEnd="url(#arrow-tnk)" />
            <rect x="266" y="14" width="238" height="30" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
            <text x="385" y="29" fill="var(--teal-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle" dominantBaseline="central">EXTENDED 4.5–24 h + PERFUSION</text>
            <text x="385" y="60" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">LVO + salvageable tissue (mismatch) on CTP / MR-perfusion.</text>
            <text x="385" y="72" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Benefit when thrombectomy is NOT available (TRACE-III).</text>
            <path d="M 508 29 L 534 29" stroke="var(--teal)" strokeWidth="2" fill="none" markerEnd="url(#arrow-tnk)" />
            <rect x="538" y="14" width="180" height="30" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" />
            <text x="628" y="25" fill="var(--amber-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">IF EVT AVAILABLE</text>
            <text x="628" y="36" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Thrombectomy first (TIMELESS neutral)</text>
            <defs>
              <marker id="arrow-tnk" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--teal)" />
              </marker>
            </defs>
          </svg>

          <div className="toast-grid" style={{marginBottom: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card primary">
                <h3>1. Tenecteplase (TNK) — Standard of Care</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Dose:</strong> 0.25 mg/kg single IV bolus (max 25 mg) over ~5 seconds — no infusion, no pump.</li>
                  <li><strong>Why preferred:</strong> Single-bolus dosing shortens door-to-needle and door-to-puncture times and simplifies inter-hospital transfer; efficacy and safety are comparable to alteplase.</li>
                  <li><strong>Use a stroke-specific 25 mg vial</strong> to avoid dosing errors from cardiac-dose formulations.</li>
                  <li><strong>Eligibility and contraindications</strong> mirror alteplase; the 2026 AHA/ASA AIS guideline updated the approach to thrombolysis contraindications and thrombolytic choice.</li>
                </ul>
              </div>
              <div className="toast-card neutral">
                <h3>2. Time Windows</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>&le; 4.5 h from LKW:</strong> Standard-of-care thrombolysis for all eligible patients (non-contrast CT to exclude hemorrhage).</li>
                  <li><strong>4.5–24 h (extended):</strong> Perfusion-imaging selection (CTP / MR-perfusion) for LVO with a salvageable-tissue mismatch — includes wake-up and unwitnessed onset.</li>
                  <li><strong>Thrombectomy remains first-line</strong> for LVO within its windows; extended-window TNK is most useful where EVT is unavailable or delayed.</li>
                </ul>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card alert-orange">
                <h3>3. Where TNK Does NOT Help</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Extended window WITH thrombectomy:</strong> Adding TNK 4.5–24 h did not improve outcomes when most patients underwent EVT (TIMELESS, neutral).</li>
                  <li><strong>Minor stroke (NIHSS 0–5) with occlusion:</strong> IV TNK showed no benefit and possible harm — do not routinely thrombolyse (TEMPO-2, stopped for futility).</li>
                </ul>
              </div>
              <div className="toast-card alert-red">
                <h3>4. Post-Lytic Safety</h3>
                <p style={{fontSize: '8.2pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                  Hold antithrombotics (antiplatelets and anticoagulants) for the first <strong>24 h</strong> until follow-up imaging excludes hemorrhage. Keep BP &lt; 180/105 mmHg after lysis. Watch for orolingual angioedema (higher risk with ACE inhibitors).
                </p>
              </div>
            </div>
          </div>

          <div className="toast-card secondary" style={{padding: '8px 10px', marginBottom: '8px'}}>
            <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '4px', textAlign: 'center'}}>5. Defining Tenecteplase Trials</h3>
            <table style={{width: '100%', fontSize: '7.4pt', borderCollapse: 'collapse', textAlign: 'left', lineHeight: '1.3'}}>
              <thead>
                <tr style={{borderBottom: '1.5px solid var(--rule)', color: 'var(--ink)'}}>
                  <th style={{padding: '3px', width: '15%'}}>Trial / Year</th>
                  <th style={{padding: '3px', width: '30%'}}>Population &amp; Comparison</th>
                  <th style={{padding: '3px', width: '55%'}}>Primary Result &amp; Implication</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                  <td style={{padding: '3px', fontWeight: '700'}}>ATTEST-2<br/>2024</td>
                  <td style={{padding: '3px'}}>&le; 4.5 h; TNK 0.25 mg/kg vs alteplase 0.9 mg/kg. N = 1858 (UK).</td>
                  <td style={{padding: '3px', color: 'var(--ink-soft)'}}><strong>Non-inferior</strong> (90-day mRS OR 1.07; non-inferiority P&lt;0.0001; not superior). Similar safety. Supports TNK as the preferred standard-window agent.</td>
                </tr>
                <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                  <td style={{padding: '3px', fontWeight: '700'}}>TRACE-III<br/>2024</td>
                  <td style={{padding: '3px'}}>4.5–24 h; LVO + mismatch, no thrombectomy access; TNK vs standard care. N = 516 (China).</td>
                  <td style={{padding: '3px', color: 'var(--ink-soft)'}}><strong>Positive</strong>: mRS 0–1 at 90 d 33.0% vs 24.2% (RR 1.37; P = 0.03); sICH 3.0% vs 0.8%. Extended-window TNK helps when EVT is unavailable.</td>
                </tr>
                <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                  <td style={{padding: '3px', fontWeight: '700'}}>TIMELESS<br/>2024</td>
                  <td style={{padding: '3px'}}>4.5–24 h; MCA/ICA occlusion + mismatch; TNK vs placebo. N = 458 (77% had EVT).</td>
                  <td style={{padding: '3px', color: 'var(--ink-soft)'}}><strong>Neutral</strong>: 90-day mRS OR 1.13 (0.82–1.57), P = 0.45. No added benefit when thrombectomy is the primary treatment.</td>
                </tr>
                <tr>
                  <td style={{padding: '3px', fontWeight: '700'}}>TEMPO-2<br/>2024</td>
                  <td style={{padding: '3px'}}>Minor stroke (NIHSS 0–5) + occlusion; TNK vs standard care. N = 886.</td>
                  <td style={{padding: '3px', color: 'var(--ink-soft)'}}><strong>Stopped for futility</strong>: no benefit, more deaths and sICH. Do not routinely lyse minor stroke with occlusion.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px 0 10px', fontSize: '7.6pt', lineHeight: '1.25', borderTop: '1px solid var(--rule-soft)'}}>
            <strong>ATTEST-2:</strong> Muir KW et al. Lancet Neurol 2024;23:1087-1096. <a href="https://pubmed.ncbi.nlm.nih.gov/39424558/" target="_blank">PMID: 39424558</a>. | <strong>TIMELESS:</strong> Albers GW et al. N Engl J Med 2024;390:701-711. <a href="https://pubmed.ncbi.nlm.nih.gov/38329148/" target="_blank">PMID: 38329148</a>.<br/>
            <strong>TRACE-III:</strong> Xiong Y et al. N Engl J Med 2024;391:203-212. <a href="https://pubmed.ncbi.nlm.nih.gov/38884324/" target="_blank">PMID: 38884324</a>. | <strong>TEMPO-2:</strong> Coutts SB et al. Lancet 2024;403:2597-2605. <a href="https://pubmed.ncbi.nlm.nih.gov/38768626/" target="_blank">PMID: 38768626</a>. | <strong>2026 AIS Guideline:</strong> Prabhakaran S et al. Stroke 2026. <a href="https://pubmed.ncbi.nlm.nih.gov/41582814/" target="_blank">PMID: 41582814</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

export function StkCoreMeasuresCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Stroke Core Measures Reference</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            Joint Commission / GWTG Quality Measures &amp; Comprehensive Stroke Center (CSC) Metrics.
          </p>

          <table className="card-table">
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
                <td>Aspirin, clopidogrel, or DOAC prescribed at discharge.</td>
              </tr>
              <tr>
                <td><strong>STK-3</strong></td>
                <td>Anticoagulation for Atrial Fibrillation</td>
                <td>DOAC or warfarin prescribed at discharge for patients with AFib/A-flutter.</td>
              </tr>
              <tr>
                <td><strong>STK-4</strong></td>
                <td>Thrombolytic Therapy (IVT)</td>
                <td>IV thrombolytic (tenecteplase or alteplase) initiated at this hospital within 3h for eligible AIS patients arriving within 2h of LKW. Tenecteplase 0.25 mg/kg single bolus is now the preferred agent (2026 AHA/ASA AIS guideline).</td>
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
                <td>Documented education on stroke warning signs, risk factors, medications, and when to call 911.</td>
              </tr>
              <tr>
                <td><strong>STK-10</strong></td>
                <td>Assessed for Rehabilitation</td>
                <td>PT/OT or PM&amp;R evaluation documented during admission.</td>
              </tr>
              <tr>
                <td><strong>CSTK-01</strong></td>
                <td>NIHSS Score Performed</td>
                <td>NIHSS completed at baseline (prior to any lytic or EVT intervention).</td>
              </tr>
              <tr>
                <td><strong>CSTK-03</strong></td>
                <td>Post-EVT Blood Pressure Control</td>
                <td>Documented SBP target (e.g. &lt;180 mmHg) for 24h post successful recanalization.</td>
              </tr>
            </tbody>
          </table>

          <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
            <strong>Quality Reference:</strong> Joint Commission National Quality Measures Specifications Manual &amp; GWTG Stroke Dashboard guidelines.
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

export function getAstralRisk(score) {
  if (score < 20) return "< 5%";
  if (score >= 20 && score < 23) {
    const pct = 5 + (score - 20) * (15 - 5) / 3;
    return `~${Math.round(pct)}%`;
  }
  if (score >= 23 && score < 31) {
    const pct = 15 + (score - 23) * (50 - 15) / 8;
    return `~${Math.round(pct)}%`;
  }
  if (score >= 31 && score < 35) {
    const pct = 50 + (score - 31) * (70 - 50) / 4;
    return `~${Math.round(pct)}%`;
  }
  if (score >= 35 && score < 40) {
    const pct = 70 + (score - 35) * (90 - 70) / 5;
    return `~${Math.round(pct)}%`;
  }
  return "> 90%";
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

export function getPlanRisk(score) {
  let mortality = "";
  let depMortality = "";
  if (score < 6) {
    mortality = "0.7%";
    depMortality = "12%";
  } else if (score >= 6 && score < 10) {
    const m = 0.7 + (score - 5) * (4.4 - 0.7) / 5;
    const dm = 12 + (score - 5) * (33 - 12) / 5;
    mortality = `~${m.toFixed(1)}%`;
    depMortality = `~${Math.round(dm)}%`;
  } else if (score >= 10 && score < 13) {
    const m = 4.4 + (score - 10) * (15 - 4.4) / 3;
    const dm = 33 + (score - 10) * (61 - 33) / 3;
    mortality = `~${m.toFixed(1)}%`;
    depMortality = `~${Math.round(dm)}%`;
  } else if (score >= 13 && score < 16) {
    const m = 15 + (score - 13) * (35 - 15) / 3;
    const dm = 61 + (score - 13) * (83 - 61) / 3;
    mortality = `~${m.toFixed(1)}%`;
    depMortality = `~${Math.round(dm)}%`;
  } else if (score >= 16 && score <= 19) {
    const m = 35 + (score - 16) * (65 - 35) / 3;
    const dm = 83 + (score - 16) * (95 - 83) / 3;
    mortality = `~${m.toFixed(1)}%`;
    depMortality = `~${Math.round(dm)}%`;
  } else {
    mortality = "> 65%";
    depMortality = "> 95%";
  }
  return { mortality, depMortality };
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
    default: return "100%";
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
  const glucoseVal = Number(astralGlucose) || 0;
  const glucoseMmol = astralGlucoseUnit === 'mgdl' ? (glucoseVal / 18.0) : glucoseVal;
  const astralGlucosePoints = (glucoseMmol < 3.7 || glucoseMmol > 7.3) ? 1 : 0;

  const astralTotal = calculateAstralScore({
    age: astralAge,
    nihss: astralNihss,
    timeDelay: astralTimeDelay,
    visualDefect: astralVisualDefect,
    glucose: astralGlucose,
    glucoseUnit: astralGlucoseUnit,
    locImpaired: astralLocImpaired
  });
  const astralRisk = getAstralRisk(astralTotal);

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
                    onChange={(e) => setAstralGlucose(e.target.value)}
                    className="w-16 px-1.5 py-0.5 text-xs text-right font-semibold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cobalt-600"
                  />
                  <div className="inline-flex rounded bg-slate-100 dark:bg-slate-800 p-0.5 text-[9px] font-bold">
                    <button
                      onClick={() => {
                        if (astralGlucoseUnit === 'mgdl') {
                          setAstralGlucose(parseFloat((parseFloat(astralGlucose) / 18.0).toFixed(1)) || 0);
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
                          setAstralGlucose(Math.round(parseFloat(astralGlucose) * 18.0) || 0);
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
                <span className={`font-semibold ${astralGlucosePoints > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-500 dark:text-slate-450'}`}>
                  {astralGlucosePoints > 0 ? 'Abnormal (+1 pt)' : 'Normal (+0 pts)'}
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

            {/* Results */}
            <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/50 p-4 dark:border-cobalt-900/60 dark:bg-cobalt-950/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wide font-bold text-cobalt-700 dark:text-cobalt-400">ASTRAL Score Result</span>
                  <h4 className="text-2xl font-black text-cobalt-900 dark:text-white">{astralTotal} <span className="text-sm font-normal text-slate-500">points</span></h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-cobalt-700 dark:text-cobalt-400">90d Poor Outcome (mRS &gt; 2)</span>
                  <h4 className="text-2xl font-black text-cobalt-900 dark:text-white">{astralRisk}</h4>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-cobalt-600 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (astralTotal / 45) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                • <strong>Risk Classification</strong>: {astralTotal < 20 ? 'Low risk (<5%)' : astralTotal < 23 ? 'Mildly elevated (~5-10%)' : astralTotal < 31 ? 'Moderate risk (~15-45%)' : astralTotal < 35 ? 'High risk (~50-65%)' : 'Very high risk (≥70%)'}.
                <br/>• <strong>Clinical Context</strong>: ASTRAL predicts functional independence at 90 days. Always contextualize using clinical progression; score alone should not guide limitations of care.
              </p>
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
  const planRisk = getPlanRisk(planTotal);

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
              label="Active Cancer"
              desc="Active cancer or currently receiving oncological treatment"
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
              desc="Severe or complete unilateral lower extremity paresis"
              value={planLegWeakness}
              onChange={setPlanLegWeakness}
              colorClass="bg-teal-700"
            />

            {/* arm weakness toggle */}
            <BinaryToggle
              label="Significant/Total Arm Weakness"
              desc="Severe or complete unilateral upper extremity paresis"
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

            {/* Results */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/60 dark:bg-teal-950/20">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] uppercase tracking-wide font-bold text-teal-700 dark:text-teal-400 block">PLAN Score</span>
                  <h4 className="text-2xl font-black text-teal-900 dark:text-white">{planTotal} <span className="text-sm font-normal text-slate-500">pts</span></h4>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wide font-bold text-teal-700 dark:text-teal-400 block">30d Mortality</span>
                  <h4 className="text-2xl font-black text-teal-900 dark:text-white">{planRisk.mortality}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wide font-bold text-teal-700 dark:text-teal-400 block">Death/Dependency</span>
                  <h4 className="text-2xl font-black text-teal-900 dark:text-white">{planRisk.depMortality}</h4>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-teal-700 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (planTotal / 25) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                • <strong>Risk Classification</strong>: {planTotal < 6 ? 'Low risk (<1%)' : planTotal < 10 ? 'Mildly elevated (~2-4%)' : planTotal < 13 ? 'Moderate risk (~5-15%)' : planTotal < 16 ? 'High risk (~15-35%)' : 'Very high risk (≥50%)'}.
                <br/>• <strong>Clinical Context</strong>: PLAN score predicts 30-day mortality and functional dependency at discharge. Do not use as a stand-alone criterion to withhold reperfusion therapies.
              </p>
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
                  <h4 className="text-2xl font-black text-crit-900 dark:text-white">{ichTotal} <span className="text-sm font-normal text-slate-500">points</span></h4>
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
                • <strong>Risk Classification</strong>: {ichTotal === 0 ? 'Very low risk (0%)' : ichTotal === 1 ? 'Mild risk (13%)' : ichTotal === 2 ? 'Moderate risk (26%)' : ichTotal === 3 ? 'Severe risk (72%)' : 'Extremely high risk (94-100%)'}.
                <br/>• <strong>Clinical Context</strong>: AHA/ASA guidelines emphasize that the ICH Score is a communication aid and must **never** be used as the sole basis for withholding care or making early DNR decisions. Provide full aggressive care for at least the first 24–48 hours.
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
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interactive Bedside Calculator</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Calculate stroke prognosis metrics in real-time</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold">clinical tool</span>
      </div>

      {/* Tabs Selector */}
      <div className="p-3">
        <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
          <button
            onClick={() => setActiveTab('astral')}
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

            <svg viewBox="0 0 735 80" role="img" focusable="false" aria-label="Cervical Artery Dissection Pathophysiology Diagram" style={{width: '100%', height: '80px', marginBottom: '8px'}}>
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
                <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
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
                </table>
                <strong style={{color: 'var(--purple-deep)', display: 'block', marginTop: '6px', fontSize: '7.8pt'}}>Score vs. 90-Day Unfavorable Outcome (mRS &gt; 2) Risk:</strong>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center', fontSize: '7.2pt', marginTop: '3px'}}>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>&lt;20</strong><br/><span className="badge-pill badge-pill-ok">&lt;5%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>23</strong><br/><span className="badge-pill badge-pill-ok">15%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>31</strong><br/><span className="badge-pill badge-pill-warn">50%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>35</strong><br/><span className="badge-pill badge-pill-crit">70%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>40+</strong><br/><span className="badge-pill badge-pill-crit">&gt;90%</span></div>
                </div>
              </div>

              {/* PLAN Score Card */}
              <div className="toast-card secondary" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '3px'}}>PLAN Score (Acute Ischemic Stroke)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>Bedside prediction of 30-day mortality/dependence</p>
                <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
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
                </table>
                <strong style={{color: 'var(--teal-deep)', display: 'block', marginTop: '6px', fontSize: '7.8pt'}}>Score vs. 30-Day Mortality Risk:</strong>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center', fontSize: '7.2pt', marginTop: '3px'}}>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>&lt;6</strong><br/><span className="badge-pill badge-pill-ok">0.7%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>9-10</strong><br/><span className="badge-pill badge-pill-ok">4.4%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>13</strong><br/><span className="badge-pill badge-pill-warn">15%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>16</strong><br/><span className="badge-pill badge-pill-crit">35%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>&gt;19</strong><br/><span className="badge-pill badge-pill-crit">&gt;65%</span></div>
                </div>
              </div>
            </div>

            {/* Bottom section: ICH Score and mRS Scale */}
            <div style={{display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: '12px', marginBottom: '12px'}}>
              {/* ICH Score Card */}
              <div className="toast-card alert-red" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '3px'}}>ICH Score (Intracerebral Hemorrhage)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>Predicts 30-day mortality in spontaneous ICH</p>
                <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '4px'}}>
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
                </table>
                <strong style={{color: 'var(--red-deep)', display: 'block', marginTop: '6px', fontSize: '7.8pt'}}>Score vs. 30-Day Mortality Risk:</strong>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px', textAlign: 'center', fontSize: '7.2pt', marginTop: '3px'}}>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>0</strong><br/><span className="badge-pill badge-pill-ok">0%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>1</strong><br/><span className="badge-pill badge-pill-ok">13%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>2</strong><br/><span className="badge-pill badge-pill-warn">26%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>3</strong><br/><span className="badge-pill badge-pill-crit">72%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>4</strong><br/><span className="badge-pill badge-pill-crit">97%</span></div>
                  <div style={{background: 'white', borderRadius: '4px', padding: '3px 2px', border: '1px solid var(--rule-soft)'}}><strong>5-6</strong><br/><span className="badge-pill badge-pill-crit">100%</span></div>
                </div>
              </div>

              {/* Modified Rankin Scale (mRS) Card */}
              <div className="toast-card neutral" style={{fontSize: '7.8pt', padding: '10px 12px'}}>
                <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--slate)', marginBottom: '3px'}}>Modified Rankin Scale (mRS)</h3>
                <p style={{color: 'var(--ink-soft)', fontSize: '7.5pt', marginBottom: '4px', fontStyle: 'italic'}}>The gold standard for assessing global functional recovery</p>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.4pt'}}>
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
                </table>
              </div>
            </div>

            {/* Warning / Disclaimers Box */}
            <div style={{border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '8px 12px', background: 'var(--purple-soft)', marginTop: 'auto', marginBottom: '8px'}}>
              <strong style={{color: 'var(--purple-deep)', fontSize: '9.0pt', display: 'block', marginBottom: '2px'}}>Prognostication Principles &amp; Limitations</strong>
              <div style={{fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                • **Not for Care Limitations**: These clinical scores serve to quantify severity, improve inter-provider communication, and assist in counseling. They **MUST NOT** be used in isolation as the sole basis for withholding reperfusion therapies, surgical decompression, or withdrawing life-sustaining treatment (avoiding the self-fulfilling prophecy of poor outcome).
                <br/>• **Dynamic Evaluation**: Clinical trajectory over the first 24–72 hours is often more predictive of final recovery than any single point-in-time calculation upon hospital admission.
                <br/>• **Acute ICH — Hemostatic Therapy**: The ICH Score is prognostic, not a treatment target. Early intensive blood-pressure lowering and hematoma-directed care remain the evidence-based acute levers (2022 AHA/ASA ICH guideline). Recombinant factor VIIa (rFVIIa) given within 2h slowed hematoma growth but did **not** improve 180-day function and increased thromboembolic events (FASTEST, 2026; PMID 41653933) — **not** recommended for routine use.
              </div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.2pt', lineHeight: '1.25'}}>
              <strong>ASTRAL Score:</strong> Ntaios G, et al. *Stroke*. 2012;43:2170-6. [PMID: 22738924](https://pubmed.ncbi.nlm.nih.gov/22738924/)<br/>
              <strong>PLAN Score:</strong> O'Donnell MJ, et al. *Arch Intern Med*. 2012;172:1548-56. [PMID: 23090225](https://pubmed.ncbi.nlm.nih.gov/23090225/)<br/>
              <strong>ICH Score:</strong> Hemphill JC 3rd, et al. *Stroke*. 2001;32:891-7. [PMID: 11283388](https://pubmed.ncbi.nlm.nih.gov/11283388/)<br/>
              <strong>mRS Scale:</strong> van Swieten JC, et al. *Stroke*. 1988;19:604-7. [PMID: 3363593](https://pubmed.ncbi.nlm.nih.gov/3363593/)
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
    <svg viewBox="0 0 735 110" role="img" focusable="false" aria-label="Fibromuscular Dysplasia String of Beads Pathophysiology Diagram" style={{width: '100%', height: '100%'}}>
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
              <div 
                className="relative group cursor-zoom-in overflow-hidden rounded-md flex justify-center items-center w-full h-full"
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                  <span className="text-[11px] text-white font-semibold bg-black/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                  </span>
                </div>
              </div>
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
                  <li><strong>MRI Neck (T1 Fat-Sat)</strong>: Pathognomonic crescent sign (intramural hematoma).</li>
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
                    <br/>• <strong>Antithrombotics</strong>: Continue for at least 3–6 months (Class I, ESO/AHA).
                    <br/>• <strong>Choice</strong>: Individualized choice of Single Antiplatelet vs. VKA/DOAC; short-term DAPT (21–90d) is a reasonable alternative (ESO consensus).
                    <br/>• <strong>STOP-CAD</strong>: In occlusions, consider anticoagulation Day 1–30, then switch to antiplatelet.
                    <br/>• <strong>IV Thrombolysis</strong>: Safe &amp; indicated within 4.5 hours (Class I).
                  </div>
                  <div style={{borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px'}}>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Intracranial &amp; Pseudoaneurysms</strong>
                    <br/>• <strong>SAH</strong>: Lack external elastic lamina &amp; thin adventitia; rupture risk.
                    <br/>• <strong>Anticoagulation</strong>: Avoided if SAH present. Prefer single antiplatelet.
                    <br/>• <strong>IVT Caution</strong>: IVT is safe in extracranial CeAD (Class I) but safety/efficacy in cases with intracranial extension is not well established (AHA 2024).
                    <br/>• <strong>Stenting</strong>: Reserve for recurrent ischemia despite optimal medical therapy or severe flow-limiting stenosis.
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
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.0pt', lineHeight: '1.2', color: 'var(--ink)'}}>
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
                      • <strong>Primary Composite (Stroke, major hemorrhage, death, or new MRI lesion at 14d)</strong>: 23% vs. 15% (Non-inferiority NOT met). Ischemic stroke: 8.0% vs. 0%.
                    </td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>Kaufmann IPD</strong><br/>2024</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 444. IPD meta-analysis of CADISS + TREAT-CAD.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Antiplatelet vs. Anticoagulant x 90d.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Primary Composite (Ischemic stroke, major bleeding, or death at 90d)</strong>: No significant difference (1.4% anticoagulation vs. 4.4% antiplatelet, p = 0.11).
                      <br/>• <strong>Ischemic Stroke alone</strong>: Significant reduction with anticoagulation (0.5% vs. 4.0%; OR 0.14, p = 0.01), with a non-significant increase in major bleeding (0.9% vs. 0%).
                    </td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: '700', padding: '1.5px 0', verticalAlign: 'top'}}><strong>STOP-CAD</strong><br/>2024</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>N = 3,636. Multicenter observational cohort registry.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top'}}>Antiplatelet vs. Anticoagulation.</td>
                    <td style={{padding: '1.5px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Temporal Risk</strong>: 87% of recurrent strokes occurred in the first 30 days.
                      <br/>• <strong>Occlusion Benefit</strong>: Patients with complete arterial occlusion at baseline had the highest stroke risk and benefited most from early anticoagulation.
                      <br/>• <strong>Transition Strategy</strong>: Initiate anticoagulation for days 1–30 (highest stroke risk window) and then transition to antiplatelet monotherapy at day 30 to mitigate long-term bleeding risks (which rise significantly by day 180).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Citations footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '4px 8px', fontSize: '7.3pt', lineHeight: '1.2'}}>
              <strong>CADISS:</strong> *Lancet Neurol*. 2015;14(4):361-7. <a href="https://pubmed.ncbi.nlm.nih.gov/25684164/" target="_blank">PMID: 25684164</a> | <strong>TREAT-CAD:</strong> *Lancet Neurol*. 2021;20(5):341-350. <a href="https://pubmed.ncbi.nlm.nih.gov/33765420/" target="_blank">PMID: 33765420</a><br/>
              <strong>Kaufmann IPD:</strong> *JAMA Neurol*. 2024;81(6):630-637. <a href="https://pubmed.ncbi.nlm.nih.gov/38739383/" target="_blank">PMID: 38739383</a> | <strong>STOP-CAD:</strong> *Stroke*. 2024;55(4):908-918. <a href="https://pubmed.ncbi.nlm.nih.gov/38335240/" target="_blank">PMID: 38335240</a> | <strong>AHA/ASA:</strong> *Stroke*. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a> | <strong>AHA Statement 2024:</strong> *Stroke*. 2024;55:e84-e107. <a href="https://pubmed.ncbi.nlm.nih.gov/38301552/" target="_blank">PMID: 38301552</a> | <strong>ESO Guideline 2021:</strong> *Eur Stroke J*. 2021;6(3):XXXIX-LXXXVIII. <a href="https://pubmed.ncbi.nlm.nih.gov/34528453/" target="_blank">PMID: 34528453</a>
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
      pdfPath="documents/references/Fibromuscular Dysplasia.pdf"
      pdfName="Fibromuscular Dysplasia.pdf"
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
    <svg viewBox="0 0 735 120" role="img" focusable="false" aria-label="Brain Death Evaluation Prerequisites and Clinical Testing Flowchart" style={{width: '100%', height: '100%'}}>
      <rect x="0" y="0" width="735" height="120" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      
      {/* --- NORMAL ARTERY --- */}
      <text x="110" y="20" fill="var(--ink-soft)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">NORMAL ARTERY</text>
      <path d="M 20 45 L 200 45 M 20 75 L 200 75" stroke="#4A5A6D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 20 48 L 200 48" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 20 72 L 200 72" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 20 48 L 200 48 L 200 72 L 20 72 Z" fill="var(--teal-soft)" opacity="0.15" />
      <text x="110" y="63" fill="var(--teal-deep)" fontSize="6.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Smooth Laminar Flow</text>

      <line x1="225" y1="10" x2="225" y2="110" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* --- MULTIFOCAL FMD --- */}
      <text x="367" y="20" fill="var(--purple-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MULTIFOCAL FMD (STRING-OF-BEADS)</text>
      {/* Beaded top wall */}
      <path d="M 250 45 C 265 35, 275 50, 290 35 C 305 50, 315 35, 330 50 C 345 35, 355 50, 370 35 C 385 50, 395 35, 410 50 C 425 35, 435 50, 450 35 C 465 50, 475 35, 490 45" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Beaded bottom wall */}
      <path d="M 250 75 C 265 85, 275 70, 290 85 C 305 70, 315 85, 330 70 C 345 85, 355 70, 370 85 C 385 70, 395 85, 410 70 C 425 85, 435 70, 450 85 C 465 70, 475 85, 490 75" stroke="var(--purple)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Inner flow shading */}
      <path d="M 250 45 C 265 35, 275 50, 290 35 C 305 50, 315 35, 330 50 C 345 35, 355 50, 370 35 C 385 50, 395 35, 410 50 C 425 35, 435 50, 450 35 C 465 50, 475 35, 490 45 L 490 75 C 475 85, 465 70, 450 85 C 435 70, 425 85, 410 70 C 395 85, 385 70, 370 85 C 355 70, 345 85, 330 70 C 315 85, 305 70, 290 85 C 275 70, 265 85, 250 75 Z" fill="var(--purple-soft)" opacity="0.3" />
      
      <text x="370" y="63" fill="var(--purple-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Alternating Stenosis &amp; Aneurysm</text>
      <text x="370" y="103" fill="var(--ink-mute)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Medial Fibroplasia (&gt;90% of cases)</text>

      <line x1="515" y1="10" x2="515" y2="110" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* --- FOCAL FMD --- */}
      <text x="625" y="20" fill="var(--red-deep)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">FOCAL FMD</text>
      {/* Concentric / Tubular Stenosis */}
      <path d="M 540 45 L 590 45 L 610 57 L 640 57 L 660 45 L 710 45" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 540 75 L 590 75 L 610 63 L 640 63 L 660 75 L 710 75" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Shading */}
      <path d="M 540 45 L 590 45 L 610 57 L 640 57 L 660 45 L 710 45 L 710 75 L 660 75 L 640 63 L 610 63 L 590 75 L 540 75 Z" fill="var(--red-soft)" opacity="0.2" />

      <text x="625" y="63" fill="var(--red-deep)" fontSize="6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Tubular Narrowing</text>
      <text x="625" y="103" fill="var(--ink-mute)" fontSize="5.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Intimal Fibroplasia (&lt;10% of cases)</text>
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

            {/* Generated Image Banner */}
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
              title="Stroke Mechanisms &amp; Systemic Vascular Beds"
            >
              <div 
                className="relative group cursor-zoom-in overflow-hidden rounded-md flex justify-center items-center w-full h-full"
                onClick={() => setLightboxImage({ src: 'assets/fmd_stroke_mechanisms.png', alt: 'Fibromuscular Dysplasia Stroke Mechanisms', title: 'Stroke Mechanisms &amp; Systemic Beds in FMD' })}
              >
                <img 
                  src="assets/fmd_stroke_mechanisms.png" 
                  loading="lazy"
                  decoding="async"
                  alt="Fibromuscular Dysplasia Stroke Mechanisms" 
                  style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}}
                  className="transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                  <span className="text-[11px] text-white font-semibold bg-black/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Pathophysiology, Presentation &amp; Screening */}
            <div style={{border: '1.5px solid var(--purple)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--purple-soft) 0%, #ffffff 100%)', marginBottom: '8px'}}>
              <strong style={{color: 'var(--purple-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>1. Pathophysiology, Presentation &amp; Screening</strong>
              <div style={{display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.8fr', gap: '12px', fontSize: '7.8pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                <div>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Pathology &amp; Demographics</strong>
                  <br/>• <strong>Non-atherosclerotic, non-inflammatory</strong> vascular disease causing stenosis, dissection, aneurysm, or occlusion.
                  <br/>• **Females** account for **80–90%** of cases; typical onset age ranges between **30–60 years**.
                  <br/>• Renal arteries most common (~70%), followed by **internal carotid (ICA)** (~75%) and vertebral arteries.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Clinical Presentation</strong>
                  <br/>• **Pulsatile Tinnitus**: "Whooshing" or beating sound in sync with heartbeat (extremely common in cranial FMD).
                  <br/>• Neck pain, headache, carotid bruits, or lightheadedness.
                  <br/>• Neurological deficits due to **cervical dissection (CeAD)**, distal embolization, or hemodynamic insufficiency.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Systemic Screening</strong>
                  <br/>• **Brain-to-Pelvis Screen**: Mandatory **one-time** cross-sectional vascular imaging (CTA or MRA) of all arterial beds from head to pelvis.
                  <br/>• **Aneurysms**: High risk (~13-22% prevalence). One-time screen for intracranial aneurysms.
                </div>
              </div>
            </div>

            {/* Section 2: Diagnosis &amp; Management Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', marginBottom: '8px'}}>
              {/* Section 2A: Diagnosis */}
              <div style={{border: '1.5px solid var(--teal)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--teal-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--teal-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>2. Diagnostic Evaluation</strong>
                <ul style={{margin: '0', paddingLeft: '12px', fontSize: '7.8pt', lineHeight: '1.4', color: 'var(--ink-soft)'}}>
                  <li><strong>First Line (Cranial)</strong>: High-resolution **CTA** or **MRA Head &amp; Neck** to assess for beading, web-like stenoses, aneurysms, or dissections.</li>
                  <li><strong>Dissection Screening</strong>: Neck MRI with **T1 fat-saturation** to identify intramural hematoma.</li>
                  <li><strong>Duplex Ultrasound</strong>: Useful for proximal carotid surveillance; however, it cannot image distal cervical/intracranial FMD.</li>
                  <li><strong>Catheter Angiography</strong>: Gold standard, but reserved for therapeutic intervention.</li>
                </ul>
              </div>

              {/* Section 2B: Management */}
              <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--red-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>3. Medical &amp; Endovascular Management</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                  <div>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Pharmacotherapy &amp; Counseling</strong>
                    <br/>• **Antiplatelet Therapy**: Aspirin **81–325 mg daily** is recommended (Class I, 2019 Consensus) for both asymptomatic and symptomatic patients to prevent thromboembolic stroke.
                    <br/>• **BP Control**: Aggressive BP control (ACEi or ARBs first-line for renal protection) with close creatinine monitoring.
                    <br/>• **Trauma Warning**: Patients must strictly **avoid neck manipulation** (e.g., chiropractic therapy, contact sports, rollercoasters).
                  </div>
                  <div style={{borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px'}}>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Procedural Interventions</strong>
                    <br/>• **Revascularization**: Reserved for patients with recurrent TIA/stroke despite antiplatelets, or severe flow-limiting stenosis.
                    <br/>• **Angioplasty (PTA)**: Percutaneous angioplasty **WITHOUT stenting** is the primary intervention. Stents are generally held unless required for dissection salvage or aneurysm treatment.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Registry &amp; Cohort Data Table */}
            <div style={{border: '1.5px solid var(--amber)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--amber-soft) 0%, #ffffff 100%)', marginBottom: '6px'}}>
              <strong style={{color: 'var(--amber-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>4. Landmark Registry &amp; Cohort Insights</strong>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '7.0pt', lineHeight: '1.25', color: 'var(--ink)'}}>
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
                      • **Demographics**: 91% female, mean age of 55.7 years.
                      <br/>• **Events at Diagnosis**: Stroke (7.6%), TIA (18.8%), Cervical Dissection (19.7%), Aneurysm (17.0%).
                      <br/>• **Delay**: Average of **4.8 years** from first symptom to diagnosis.
                    </td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: '700', padding: '2px 0', verticalAlign: 'top'}}><strong>Euro-FMD Registry</strong><br/>(Persu et al., 2021)</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>N = 1,023 patients across European clinical centers.</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top'}}>• Multifocal FMD: 82.6%<br/>• Focal FMD: 17.4%<br/>• Renal: 79.5%<br/>• Carotid: 54.3%</td>
                    <td style={{padding: '2px 0', verticalAlign: 'top', color: 'var(--ink-soft)'}}>
                      • <strong>Subtype Differences</strong>: Focal FMD patients were significantly younger at diagnosis (mean 39.6 vs. 51.5 years) and had higher rates of severe or refractory hypertension.
                      <br/>• <strong>Aneurysms/Dissections</strong>: Prevalent in both groups; confirmed the need for one-time head-to-pelvis vascular screening.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'FMD Scientific Statement', cite: 'Olin JW et al. Circulation. 2014;129(9):1048-1078.', pmid: '24548843' },
              { label: 'First International Consensus', cite: 'Gornik HL et al. Vasc Med. 2019;24(2):164-189.', pmid: '30648921' },
              { label: 'CADISS Trial', cite: 'CADISS Trial Investigators. Lancet Neurol. 2015;14(4):361-367.', pmid: '25684164' },
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
            <svg viewBox="0 0 735 90" role="img" focusable="false" aria-label="Seizure Prophylaxis and Antiepileptic Choice in Stroke" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
              <rect x="0" y="0" width="735" height="90" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
              
              {/* Step 1 */}
              <rect x="15" y="15" width="145" height="60" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
              <text x="87.5" y="32" fill="var(--teal-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">1. PREREQUISITES</text>
              <text x="87.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Irreversible Coma</text>
              <text x="87.5" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Temp ≥36°C | Hemodyn OK</text>
              
              {/* Arrow 1 */}
              <path d="M 160 45 L 190 45" stroke="var(--purple)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-bd)" />
              
              {/* Step 2 */}
              <rect x="190" y="15" width="145" height="60" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.5" />
              <text x="262.5" y="32" fill="var(--purple-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">2. CLINICAL EXAM</text>
              <text x="262.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">No Motor Response</text>
              <text x="262.5" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Absent Brainstem Reflexes</text>

              {/* Arrow 2 */}
              <path d="M 335 45 L 365 45" stroke="var(--purple)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-bd)" />

              {/* Step 3 */}
              <rect x="365" y="15" width="145" height="60" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="437.5" y="32" fill="var(--amber-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">3. APNEA TESTING</text>
              <text x="437.5" y="48" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Absence of Resp Drive</text>
              <text x="437.5" y="60" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">PaCO2 ≥60 &amp; pH &lt;7.30</text>

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

            {/* Generated Image Banner */}
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
              title="Cranial Nerve Reflexes &amp; Apnea Test Setup"
            >
              <div 
                className="relative group cursor-zoom-in overflow-hidden rounded-md flex justify-center items-center w-full h-full"
                onClick={() => setLightboxImage({ src: 'assets/brain_death_evaluation.png', alt: 'Brain Death Evaluation Pathway', title: 'Brainstem Reflexes &amp; Apnea Test Setup' })}
              >
                <img 
                  src="assets/brain_death_evaluation.png" 
                  loading="lazy"
                  decoding="async"
                  alt="Brain Death Evaluation Pathway" 
                  style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}}
                  className="transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                  <span className="text-[11px] text-white font-semibold bg-black/60 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                    <i aria-hidden="true" data-lucide="zoom-in" className="w-3.5 h-3.5"></i> Click to Zoom
                  </span>
                </div>
              </div>
            </div>

            {/* Grid for Prerequisites & Exam */}
            <div className="toast-grid" style={{marginBottom: '10px'}}>
              {/* Column 1: Prerequisites & Stability */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card primary" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--purple-deep)', marginBottom: '3px'}}>1. Prerequisites &amp; Stability</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Etiology:</strong> Known, irreversible, catastrophic brain injury.</li>
                    <li><strong>Core Temp:</strong> <strong>&ge; 36.0°C (96.8°F)</strong>. Warm if hypothermic.</li>
                    <li><strong>Hemodynamics:</strong>
                      <br/>• Adults: SBP <strong>&ge; 100 mmHg</strong> (or MAP &ge; 60 mmHg)
                      <br/>• Pediatrics (Age-specific SBP):
                        <br/>&nbsp;&nbsp;– Term newborn to 30 days: <strong>&ge; 60 mmHg</strong>
                        <br/>&nbsp;&nbsp;– Infants 31 days to 1 year: <strong>&ge; 70 mmHg</strong>
                        <br/>&nbsp;&nbsp;– Children 1 to 10 years: <strong>&ge; 70 + (2 &times; age) mmHg</strong>
                        <br/>&nbsp;&nbsp;– Adolescents &gt; 10 years: <strong>&ge; 90 mmHg</strong>
                    </li>
                    <li><strong>Exclusions:</strong> Exclude CNS depressants (&ge;5 half-lives) and neuromuscular blockade (TOF 4/4 twitch present).</li>
                    <li><strong>Metabolic:</strong> Correct severe endocrine or electrolyte derangements.</li>
                  </ul>
                </div>

                <div className="toast-card secondary" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--teal-deep)', marginBottom: '3px'}}>2. Neurological Examination</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Coma:</strong> Complete absence of arousal. No motor responses to pain (spinal reflexes like triple flexion allowed).</li>
                    <li><strong>Pupils:</strong> Mid-sized/dilated (4–9 mm), completely unresponsive to intense light bilaterally.</li>
                    <li><strong>Corneal Reflex:</strong> No blink to cotton swab contact.</li>
                    <li><strong>Oculocephalic (Doll's Eyes):</strong> No eye deviation with head turn (ensure C-spine cleared).</li>
                    <li><strong>Oculovestibular (Cold Calorics):</strong> No eye movement for &ge;1 min after 50 mL ice-water irrigation (confirm intact tympanic membrane).</li>
                    <li><strong>Gag &amp; Cough:</strong> Absent gag (pharyngeal stim) and cough (tracheal suction catheter stim).</li>
                    <li><strong>Facial Motor:</strong> No grimace to TMJ or supraorbital pressure.</li>
                  </ul>
                </div>
              </div>

              {/* Column 2: Apnea Testing & Ancillary Testing */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card alert-orange" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--amber-deep)', marginBottom: '3px'}}>3. Apnea Testing Protocol</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.8pt', lineHeight: '1.4'}}>
                    <li><strong>Preparation:</strong> Pre-oxygenate with 100% O2 for &ge;10 mins. Baseline arterial pCO2 must be 35–45 mmHg, pH 7.35–7.45.</li>
                    <li><strong>Procedure:</strong> Deliver passive O2 via CPAP (preferred, 100% O2 at 4-6 L/min) to maintain oxygenation while ventilator is paused.</li>
                    <li><strong>ECMO Tip:</strong> Decrease sweep gas flow to 0.5–1.0 L/min with 100% O2; monitor closely for any chest rise.</li>
                    <li><strong>Observation:</strong> Monitor for spontaneous respiratory effort for 8–10 mins.</li>
                    <li><strong>Target:</strong> Final pCO2 <strong>&ge; 60 mmHg</strong> AND <strong>&ge; 20 mmHg above baseline</strong>, with pH <strong>&lt; 7.30</strong>.</li>
                  </ul>
                  <div style={{marginTop: '4px', borderTop: '1px dashed rgba(217,134,11,0.3)', paddingTop: '4px', fontSize: '7.6pt', color: 'var(--red-deep)', lineHeight: '1.3'}}>
                    <strong>Abort/Stop Criteria:</strong> Abruptly stop and draw ABG if:
                    <br/>• SBP &lt; 100 mmHg or MAP &lt; 60 mmHg.
                    <br/>• SpO2 &lt; 85% for &gt; 30 seconds.
                    <br/>• New significant cardiac arrhythmias occur.
                  </div>
                </div>

                <div className="toast-card alert-red" style={{padding: '10px 12px'}}>
                  <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '3px'}}>4. Ancillary Testing Guidelines</h3>
                  <p style={{fontSize: '7.6pt', color: 'var(--ink-soft)', marginBottom: '4px', lineHeight: '1.3'}}>
                    Used <strong>only</strong> when clinical exam or apnea test cannot be completed safely (e.g. severe hypoxemia, facial trauma).
                  </p>
                  <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '8px', fontSize: '7.6pt', lineHeight: '1.3'}}>
                    <div>
                      <strong style={{color: 'var(--teal-deep)', fontSize: '7.6pt', textTransform: 'uppercase', display: 'block', marginBottom: '2px'}}>Accepted Tests</strong>
                      • <strong>Conventional 4-Vessel DSA:</strong> Confirms absence of intracerebral blood flow.<br/>
                      • <strong>SPECT Perfusion:</strong> Shows absence of cerebral uptake.<br/>
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
                  <div><strong>Adults:</strong> One clinical exam and apnea test is sufficient (per 2023 AAN).</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Pediatrics:</strong> Two separate exams &amp; apnea tests required (intervals: 24h for newborns; 12h for infants/children).</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Rewarming Period:</strong> Wait &ge;24 hours after rewarming from therapeutic hypothermia before testing.</div>
                </div>
                <div className="checklist-item">
                  <div className="checklist-dot">✓</div>
                  <div><strong>Time of Death:</strong> Recorded when pCO2 meets target or when the ancillary test result is officially read.</div>
                </div>
              </div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '8px 10px', fontSize: '8.2pt', lineHeight: '1.3'}}>
              <strong>Consensus Guideline:</strong> Greer DM, et al. Pediatric and Adult Brain Death/Death by Neurologic Criteria Consensus Guideline. <em>Neurology</em>. 2023;101(24):1112-1132. <a href="https://pubmed.ncbi.nlm.nih.gov/37821233/" target="_blank">PMID: 37821233</a>.<br/>
              <strong>Ancillary Update:</strong> Wijdicks EF, et al. Practice parameter update: determining brain death in adults. <em>Neurology</em>. 2010;74(23):1911-1918. <a href="https://pubmed.ncbi.nlm.nih.gov/20530327/" target="_blank">PMID: 20530327</a>.
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
      pdfPath="documents/references/Antiepileptic Drugs.pdf"
      pdfName="Antiepileptic Drugs.pdf"
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
            <svg viewBox="0 0 735 90" role="img" focusable="false" aria-label="Wallenberg Syndrome Lateral Medullary Anatomy and Symptoms Map" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
              <rect x="0" y="0" width="735" height="90" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
              
              {/* Step 1 */}
              <rect x="15" y="15" width="145" height="60" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.5" />
              <text x="87.5" y="32" fill="var(--purple-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">1. CLASSIFY SEIZURE</text>
              <text x="87.5" y="48" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Early (≤7d): Symptomatic</text>
              <text x="87.5" y="60" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Late (&gt;7d): Unprovoked</text>
              
              {/* Arrow 1 */}
              <path d="M 160 45 L 190 45" stroke="var(--teal)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-asm)" />
              
              {/* Step 2 */}
              <rect x="190" y="15" width="145" height="60" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
              <text x="262.5" y="32" fill="var(--teal-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">2. ASSESS RISK</text>
              <text x="262.5" y="48" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">IsCHEMiA Score (2026)</text>
              <text x="262.5" y="60" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">SeLECT Score (Max 9)</text>

              {/* Arrow 2 */}
              <path d="M 335 45 L 365 45" stroke="var(--teal)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-asm)" />

              {/* Step 3 */}
              <rect x="365" y="15" width="145" height="60" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" />
              <text x="437.5" y="32" fill="var(--amber-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">3. ASM SELECTION</text>
              <text x="437.5" y="48" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">1st Line: Levetiracetam</text>
              <text x="437.5" y="60" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">2nd Line: Lamotrigine</text>

              {/* Arrow 3 */}
              <path d="M 510 45 L 540 45" stroke="var(--teal)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-asm)" />

              {/* Step 4 */}
              <rect x="540" y="15" width="180" height="60" rx="6" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="630" y="32" fill="var(--red-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">4. MONITOR &amp; SAFETY</text>
              <text x="630" y="48" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">ECG for Lacosamide</text>
              <text x="630" y="60" fill="var(--ink-soft)" fontSize="6.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Avoid Phenytoin (DOAC DDI)</text>

              <defs>
                <marker id="arrow-asm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--teal)" />
                </marker>
              </defs>
            </svg>

            {/* Grid for Seizure Classification & Risk Scores */}
            <div className="toast-grid" style={{marginBottom: '10px'}}>
              {/* Column 1: Classification & Prophylaxis */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div className="toast-card primary" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--purple-deep)', marginBottom: '3px'}}>1. Seizure Classification &amp; Prophylaxis</h3>
                  <ul className="toast-card-list" style={{fontSize: '7.6pt', lineHeight: '1.35'}}>
                    <li><strong>Early Seizure (Acute Symptomatic):</strong> Occurs <strong>&le; 7 days</strong> of stroke. Caused by local tissue injury, excitotoxicity. Low long-term epilepsy risk. Routine prophylaxis is <strong>NOT recommended</strong>.</li>
                    <li><strong>Late Seizure (Unprovoked):</strong> Occurs <strong>&gt; 7 days</strong> of stroke. Caused by structural scar tissue/remodeling. High recurrence risk (&gt;70%). A single late seizure defines <strong>Post-Stroke Epilepsy (PSE)</strong>; initiates long-term ASM.</li>
                    <li><strong>AHA/ASA Prophylaxis Guidelines:</strong>
                      <br/>• <strong>AIS &amp; ICH:</strong> Routine ASM prophylaxis is **not recommended** (Class III).
                      <br/>• <strong>aSAH:</strong> Routine prophylaxis is **not beneficial** (Class III); however, a short course (3-7 days) *may* be considered in high-risk features (MCA aneurysm, high-grade SAH, hydrocephalus, or cortical infarction) (Class IIb).
                    </li>
                    <li><strong>Early Seizures &amp; Cortical Presentations (2026 nuance):</strong> An early acute-symptomatic seizure warrants treating the seizure (a short ASM course) but does <strong>not</strong> by itself mandate long-term therapy — reassess at follow-up and taper if no recurrence. A single <strong>late</strong> (unprovoked, &gt;7d) seizure defines post-stroke epilepsy and warrants ongoing ASM. Late-seizure risk is higher with <strong>cortical involvement, hemorrhagic transformation, and larger/severe strokes</strong>; <strong>lobar/cortical ICH</strong> is more epileptogenic than deep ICH. Favor surveillance and a low threshold to treat over routine prophylaxis.</li>
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
                <div className="toast-card alert-orange" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--amber-deep)', marginBottom: '3px'}}>3. IsCHEMiA Score (2026 Validation)</h3>
                  <p style={{fontSize: '7.4pt', color: 'var(--ink-soft)', marginBottom: '4px', lineHeight: '1.2'}}>
                    Predicts 1-year and 5-year post-stroke epilepsy risk after ischemic stroke.
                  </p>
                  <table style={{width: '100%', fontSize: '7.2pt', borderCollapse: 'collapse', marginBottom: '4px', lineHeight: '1.2'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                        <th style={{textAlign: 'left', padding: '2px 0'}}>Predictor Variable</th>
                        <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>Is</strong> - Infarct size &ge; 5 cm</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>2</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>C</strong> - Cortical involvement</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>1</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>H</strong> - Hemorrhagic transformation</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>2</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>E</strong> - Early seizures (&le; 7 days)</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>2</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>Mi</strong> - MCA involvement</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>1</strong></td>
                      </tr>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>A</strong> - Age younger than 65</td>
                        <td style={{textAlign: 'right', padding: '2px 0'}}><strong>1</strong></td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{fontSize: '7.2pt', borderTop: '1px dashed rgba(217,134,11,0.3)', paddingTop: '4px', lineHeight: '1.2'}}>
                    <strong>Interpretation:</strong>
                    <br/>• Score 3: Low risk (2% at 1yr, 6% at 5yr)
                    <br/>• Score &ge;8: High risk (67% at 1yr, 78% at 5yr)
                  </div>
                </div>

                <div className="toast-card neutral" style={{padding: '8px 10px'}}>
                  <h3 style={{fontSize: '9pt', fontWeight: '800', color: 'var(--slate)', marginBottom: '3px'}}>4. SeLECT Prognostic Score</h3>
                  <table style={{width: '100%', fontSize: '7.2pt', borderCollapse: 'collapse', marginBottom: '4px', lineHeight: '1.2'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                        <th style={{textAlign: 'left', padding: '2px 0'}}>Clinical Variable</th>
                        <th style={{textAlign: 'right', padding: '2px 0'}}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding: '2px 0'}}><strong>Se</strong> - Severity (NIHSS: &ge;16 = 2, 9-15 = 1, 0-8 = 0)</td>
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
                  </table>
                  <div style={{fontSize: '7.2pt', borderTop: '1px dashed rgba(74,90,109,0.3)', paddingTop: '4px', lineHeight: '1.2'}}>
                    <strong>Interpretation:</strong> Score 0 (3% risk at 5yr), Score 3 (9% risk at 5yr), Score 6 (34% risk at 5yr), Score 9 (83% risk at 5yr).
                  </div>
                </div>
              </div>
            </div>

            {/* Antiseizure Medications (ASMs) Selection Table */}
            <div className="toast-card alert-red" style={{padding: '8px 10px', display: 'flex', flexDirection: 'column', flexGrow: 1}}>
              <h3 style={{fontSize: '9.5pt', fontWeight: '800', color: 'var(--red-deep)', marginBottom: '4px', textAlign: 'center'}}>5. Clinical ASM Comparison Matrix</h3>
              <table style={{width: '100%', fontSize: '7.4pt', borderCollapse: 'collapse', textAlign: 'left', lineHeight: '1.3'}}>
                <thead>
                  <tr style={{borderBottom: '1.5px solid var(--rule)', color: 'var(--ink)'}}>
                    <th style={{padding: '4px', width: '15%'}}>ASM (Brand)</th>
                    <th style={{padding: '4px', width: '22%'}}>Dosing (Load / Maint)</th>
                    <th style={{padding: '4px', width: '15%'}}>Clearance</th>
                    <th style={{padding: '4px', width: '25%'}}>Drug Interactions</th>
                    <th style={{padding: '4px', width: '23%'}}>Key Adverse Effects</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Levetiracetam</strong><br/>(Keppra)</td>
                    <td style={{padding: '4px'}}>Load: 20-30 mg/kg IV<br/>Maint: 500-1500 mg q12h</td>
                    <td style={{padding: '4px'}}>Renal excretion<br/><span style={{color: 'var(--red)'}}>(Adjust for GFR)</span></td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}><strong>None (CYP independent)</strong><br/>Safe with DOACs/antiplatelets</td>
                    <td style={{padding: '4px'}}>Irritability, agitation ("Kepprage"), somnolence.</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Lamotrigine</strong><br/>(Lamictal)</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>No acute load (PO only)</span><br/>Slow 2-week titration</td>
                    <td style={{padding: '4px'}}>Hepatic glucuronidation</td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}><strong>Minimal</strong><br/>Safe with DOACs</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>SJS/TEN severe rash</span> (linked to rapid titration).</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Lacosamide</strong><br/>(Vimpat)</td>
                    <td style={{padding: '4px'}}>Load: 200-400 mg IV<br/>Maint: 100-200 mg q12h</td>
                    <td style={{padding: '4px'}}>Renal &amp; Hepatic</td>
                    <td style={{padding: '4px', color: 'var(--teal-deep)'}}><strong>Minimal</strong><br/>Safe with DOACs</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>PR prolongation</span>, AV block (ECG baseline!), dizziness.</td>
                  </tr>
                  <tr style={{borderBottom: '1px solid var(--rule-soft)'}}>
                    <td style={{padding: '4px'}}><strong>Valproic Acid</strong><br/>(Depakote)</td>
                    <td style={{padding: '4px'}}>Load: 20-40 mg/kg IV<br/>Maint: 250-1000 mg q12h</td>
                    <td style={{padding: '4px'}}>Hepatic metabolism</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>Enzyme Inhibitor:</span> Increases levels of other drugs.</td>
                    <td style={{padding: '4px'}}>Thrombocytopenia, hyperammonemia, hepatotoxicity.</td>
                  </tr>
                  <tr>
                    <td style={{padding: '4px'}}><strong>Phenytoin</strong><br/>(Dilantin)</td>
                    <td style={{padding: '4px'}}>Load: 15-20 mg/kg IV<br/>Maint: 300-400 mg daily</td>
                    <td style={{padding: '4px'}}>Hepatic metabolism<br/>(Saturable kinetics)</td>
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>Strong CYP Inducer:</span> **Lowers DOAC &amp; statin levels** (highly discouraged!).</td>
                    <td style={{padding: '4px'}}>Ataxia, nystagmus, gingival hypertrophy, osteoporosis.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px 0 10px', fontSize: '8.2pt', lineHeight: '1.25', borderTop: '1px solid var(--rule-soft)'}}>
              <strong>AIS Guidelines:</strong> Prabhakaran S et al. Stroke. 2026. <a href="https://pubmed.ncbi.nlm.nih.gov/41582814/" target="_blank">PMID: 41582814</a>. | <strong>ICH Guidelines:</strong> Greenberg SM et al. Stroke. 2022. <a href="https://pubmed.ncbi.nlm.nih.gov/35579034/" target="_blank">PMID: 35579034</a>.<br/>
              <strong>IsCHEMiA Score:</strong> Epilepsy Currents. 2026. | <strong>SeLECT Score:</strong> Galovic M et al. Lancet Neurol. 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29413315/" target="_blank">PMID: 29413315</a>.
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

const AspirinFailureView = () => {
  return (
    <PdfActionBar
      title="Aspirin Failure &amp; Resistance"
      subtitle="Antiplatelet Failure Guidelines &amp; Clinical Management"
      pdfPath="documents/references/Aspirin Failure.pdf"
      pdfName="Aspirin Failure.pdf"
      iconColorClass="text-warn-600 dark:text-warn-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <AspirinFailureCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function AspirinFailureCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-aspirin-failure">
        <div className="card-container" style={{boxSizing: 'border-box', height: '1275px'}}>
          <div className="card-content" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Aspirin Failure &amp; Resistance</h1>
            <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
              AHA/ASA 2021 Secondary Prevention Guideline &amp; Landmark Trials, updated with evidence through 2026.
            </p>

            <svg viewBox="0 0 735 125" role="img" focusable="false" aria-label="Cerebral Venous Sinus Thrombosis Pathophysiology and Anticoagulation Flowchart" style={{width: '100%', height: '125px', marginBottom: '10px'}}>
              <rect x="0" y="0" width="735" height="125" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
              
              <rect x="20" y="20" width="150" height="40" rx="20" fill="var(--purple-deep)" />
              <text x="95" y="40" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle" dominantBaseline="central">ASPIRIN (Irreversible)</text>
              
              <path d="M 170 40 L 255 40" stroke="var(--purple)" strokeWidth="2" fill="none" />
              <polygon points="260,40 252,36 252,44" fill="var(--purple)" />
              
              <rect x="260" y="20" width="200" height="40" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.5" />
              <text x="360" y="35" fill="var(--purple-deep)" fontSize="8.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PLATELET COX-1 ENZYME</text>
              <text x="360" y="48" fill="var(--ink-soft)" fontSize="6.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Acetylation Site (Ser-529)</text>
              
              <path d="M 460 40 L 545 40" stroke="var(--teal)" strokeWidth="2" fill="none" />
              <polygon points="550,40 542,36 542,44" fill="var(--teal)" />
              
              <rect x="550" y="20" width="160" height="40" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5" />
              <text x="630" y="35" fill="var(--teal-deep)" fontSize="8.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">THROMBOXANE A₂</text>
              <text x="630" y="48" fill="var(--red-deep)" fontSize="6.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Platelet Activation &amp; Clotting</text>
              
              <rect x="260" y="82" width="200" height="30" rx="15" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
              <text x="360" y="97" fill="var(--red-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle" dominantBaseline="central">REVERSIBLE NSAID (Ibuprofen)</text>
              
              <path d="M 360 82 L 360 68" stroke="var(--red)" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
              <polygon points="360,63 357,70 363,70" fill="var(--red)" />
              <text x="365" y="74" fill="var(--red-deep)" fontSize="6.5pt" fontFamily="IBM Plex Sans" fontWeight="700">COMPETITIVE BLOCK</text>
            </svg>

            <div className="toast-grid" style={{marginBottom: '10px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div className="toast-card primary">
                  <h3>1. Clinical Triage Pathway</h3>
                  <ul className="toast-card-list" style={{fontSize: '8.5pt'}}>
                    <li><strong>Verify Adherence:</strong> Confirm patient daily intake, review pharmacy logs, and confirm adherence. Non-compliance represents up to 40% of suspected resistance cases.</li>
                    <li><strong>Identify Stroke Etiology (TOAST):</strong> Perform diagnostic workup (ECG/ telemetry/ Echocardiogram, head/neck vascular imaging). Rule out cardioembolic sources (e.g. AFib requires oral anticoagulants).</li>
                    <li><strong>Screen Drug Interactions:</strong> Review concomitant medications, especially daily reversible NSAIDs like ibuprofen or naproxen.</li>
                  </ul>
                </div>

                <div className="toast-card neutral">
                  <h3>2. Mechanisms of True Resistance</h3>
                  <ul className="toast-card-list" style={{fontSize: '8.5pt'}}>
                    <li><strong>Competitive Binding:</strong> Reversible NSAIDs occupy the COX-1 binding pocket, preventing aspirin from permanently binding and acetylating serine-529.</li>
                    <li><strong>Accelerated Platelet Turnover:</strong> High inflammation, severe diabetes, infection, or major surgery releases new, uninhibited platelets into circulation within 24 hours.</li>
                    <li><strong>Genetics:</strong> Specific gene polymorphisms in <em>PTGS1</em> (COX-1) or <em>ITGB3</em> (Glycoprotein IIIa) receptor may reduce aspirin sensitivity.</li>
                  </ul>
                </div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div className="toast-card secondary">
                  <h3>3. Evidence-Based Management</h3>
                  <ul className="toast-card-list" style={{fontSize: '8.5pt'}}>
                    <li><strong>Monotherapy Switch:</strong> Switch to Clopidogrel 75mg daily. CAPRIE trial (PMID: 8932661) showed significant relative risk reduction of 8.7% with clopidogrel vs. aspirin in stroke/vascular patients.</li>
                    <li><strong>Short-Term DAPT Escalation:</strong> For minor stroke (NIHSS &le; 3) or high-risk TIA (ABCD&sup2; &ge; 4), escalate to DAPT (Aspirin + Clopidogrel) for 21 days (CHANCE/POINT). INSPIRES extends the start window to 72h and continues clopidogrel monotherapy through day 90 &mdash; it does <em>not</em> support 90 days of <em>dual</em> therapy, which increases moderate-to-severe bleeding (HR 2.08).</li>
                    <li><strong>Severe Symptomatic Stenosis:</strong> Initiate Aspirin + Clopidogrel for 90 days + intensive risk control per SAMMPRIS protocol (PMID: 21899409).</li>
                    <li><strong>Polyvascular Disease:</strong> Consider dual pathway inhibition (low-dose Rivaroxaban 2.5mg BID + Aspirin 100mg daily) per COMPASS trial (PMID: 29141975).</li>
                    <li><strong>Factor XIa Inhibition (New, 2026):</strong> For non-cardioembolic stroke / high-risk TIA already on antiplatelet therapy, adding oral <strong>asundexian</strong> 50mg daily reduced recurrent ischemic stroke vs placebo (6.2% vs 8.4%; HR 0.74) <em>without</em> a significant increase in major bleeding (OCEANIC-STROKE, PMID: 41985132). It is an <strong>add-on to</strong> — not a replacement for — antiplatelet therapy, and is not yet FDA/EMA-approved. Distinct from OCEANIC-AF, where asundexian was <em>inferior</em> to apixaban in atrial fibrillation, so it does not substitute for guideline anticoagulation.</li>
                  </ul>
                </div>

                <div className="toast-card alert-red">
                  <h3>4. Critical Drug Interaction Alert</h3>
                  <p style={{fontSize: '8.3pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                    Reversible NSAIDs block the irreversible acetylation of COX-1 by aspirin, neutralizing its antiplatelet effect and elevating thrombosis risk.
                  </p>
                  <div style={{marginTop: '6px', fontSize: '8.3pt', color: 'var(--red-deep)', fontWeight: 'bold', borderTop: '1px dashed var(--rule)', paddingTop: '6px'}}>
                    Counseling: Take aspirin at least 30 minutes before or 8 hours after reversible NSAIDs, or switch to acetaminophen.
                  </div>
                </div>
              </div>
            </div>

            <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px 0 10px', fontSize: '8.2pt', lineHeight: '1.25', borderTop: '1px solid var(--rule-soft)'}}>
              <strong>Guidelines:</strong> Kleindorfer DO et al. Stroke 2021. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a>. | <strong>WASID (Resistance):</strong> Stroke 2009. <a href="https://pubmed.ncbi.nlm.nih.gov/19064771/" target="_blank">PMID: 19064771</a>. | <strong>CAPRIE:</strong> Lancet 1996. <a href="https://pubmed.ncbi.nlm.nih.gov/8932661/" target="_blank">PMID: 8932661</a>.<br/>
              <strong>CHANCE:</strong> N Engl J Med 2013. <a href="https://pubmed.ncbi.nlm.nih.gov/23803136/" target="_blank">PMID: 23803136</a>. | <strong>POINT:</strong> N Engl J Med 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29766750/" target="_blank">PMID: 29766750</a>. | <strong>INSPIRES:</strong> N Engl J Med 2023. <a href="https://pubmed.ncbi.nlm.nih.gov/38157499/" target="_blank">PMID: 38157499</a>.<br/>
              <strong>SAMMPRIS:</strong> N Engl J Med 2011. <a href="https://pubmed.ncbi.nlm.nih.gov/21899409/" target="_blank">PMID: 21899409</a>. | <strong>COMPASS:</strong> Lancet 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29141975/" target="_blank">PMID: 29141975</a>. | <strong>Review:</strong> Ann Intern Med 2005. <a href="https://pubmed.ncbi.nlm.nih.gov/15738456/" target="_blank">PMID: 15738456</a>.<br/>
              <strong>OCEANIC-STROKE (asundexian):</strong> Sharma M et al. N Engl J Med 2026;394:1467-1479. <a href="https://pubmed.ncbi.nlm.nih.gov/41985132/" target="_blank">PMID: 41985132</a>.
            </div>
          </div>
        </div>
      </div>
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
    <div className="ref-citation" style={{ marginTop: 'auto', padding: '6px 10px', fontSize: '7.4pt', lineHeight: '1.3', ...style }}>
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
              <svg viewBox="0 0 735 170" role="img" focusable="false" aria-label="Dural Venous Sinus Sagittal Map and Deep Venous System Diagram" style={{ width: '100%', height: 'auto' }}>
                {/* ---- Left: sagittal dural sinus map ---- */}
                <text x="245" y="16" fill="var(--ink-soft)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">DURAL VENOUS SINUS MAP (SAGITTAL)</text>
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

                {/* divider */}
                <line x1="455" y1="14" x2="455" y2="158" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* ---- Right: venous infarct inset (coronal) ---- */}
                <text x="595" y="16" fill="var(--ink-soft)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">VENOUS INFARCT (± HEMORRHAGE)</text>
                <path d="M 500 120 C 500 60, 690 60, 690 120 C 690 138, 660 150, 595 150 C 530 150, 500 138, 500 120 Z" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.4" />
                <line x1="595" y1="42" x2="595" y2="150" stroke="var(--rule-soft)" strokeWidth="1" />
                {/* parasagittal wedge infarct crossing arterial boundaries */}
                <path d="M 595 46 L 648 66 L 640 120 L 595 116 Z" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.4" />
                {/* hemorrhagic transformation speckle */}
                <circle cx="620" cy="80" r="6" fill="var(--red)" opacity="0.75" />
                <circle cx="631" cy="97" r="4.5" fill="var(--red)" opacity="0.7" />
                <circle cx="614" cy="100" r="3.5" fill="var(--red)" opacity="0.6" />
                <text x="595" y="168" fill="var(--ink-mute)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Non-arterial territory; bilateral / parasagittal / thalamic patterns</text>
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
                  <br />&bull; <strong>Transition</strong>: VKA (INR 2&ndash;3) for 3&ndash;6+ months, <em>or</em> a <strong>DOAC</strong> — RE-SPECT CVT: dabigatran 150 mg BID comparable to warfarin; ACTION-CVT: DOAC vs warfarin similar recurrence with a lower rate of major hemorrhage (aHR 0.35).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '8pt' }}>Endovascular / surgical</strong>
                  <br />&bull; <strong>Thrombectomy is NOT routine</strong> — TO-ACT stopped for futility; reserve for deterioration despite anticoagulation (individualized).
                  <br />&bull; <strong>Decompressive craniectomy</strong> is life-saving for large venous infarct with impending herniation.
                  <br />&bull; Treat seizures; manage raised ICP; avoid over-aggressive LP if mass effect.
                </div>
              </div>
            </CardSection>

            {/* §4 Prognosis (amber) */}
            <CardSection color="amber" title="4. Prognosis" style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--amber-deep)' }}>ISCVT:</strong> ~13% dead or dependent at final follow-up (better than arterial stroke).
                <br /><strong style={{ color: 'var(--amber-deep)' }}>Predictors of poor outcome:</strong> coma / altered mental status, deep venous system thrombosis, intracranial hemorrhage, malignancy, CNS infection, male sex, older age.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'ISCVT', cite: 'Ferro JM et al. Stroke. 2004;35(3):664-670.', pmid: '14976332' },
              { label: 'RE-SPECT CVT', cite: 'Ferro JM et al. JAMA Neurol. 2019;76(12):1457-1465.', pmid: '31479105' },
              { label: 'ACTION-CVT', cite: 'Yaghi S et al. Stroke. 2022;53(3):728-738.', pmid: '35143325' },
              { label: 'TO-ACT', cite: 'Coutinho JM et al. JAMA Neurol. 2020;77(8):966-973.', pmid: '32421159' },
              { label: 'AHA/ASA Statement', cite: 'Saposnik G et al. Stroke. 2011;42(4):1158-1192.', pmid: '21293023' },
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
              <VisualAssetFigure
                src="assets/ischemic_core_penumbra_render.png"
                fallbackSvgSrc="assets/ischemic_core_penumbra_render.svg"
                alt="CT Perfusion Ischemic Core vs Penumbra Mismatch Render showing cerebral blood flow (CBF < 30%) core volume and cerebral blood volume mismatch zone for extended window thrombectomy"
                title="CT Perfusion Core vs Penumbra Mismatch"
                captionId="core-penumbra-caption"
                caption="CT Perfusion Mismatch: Ischemic Core (rCBF < 30%) vs. Salvageable Penumbra Zone"
                onOpenLightbox={setLightboxImage}
              />
              <VisualAssetFigure
                src="assets/aspects_10_regions_render.png"
                fallbackSvgSrc="assets/aspects_10_regions_render.svg"
                alt="ASPECTS 10 Anatomical Region CT Neuroimaging Render highlighting subcortical (C, P, IC, M1-M3) and superior cortical (M4-M6) MCA territory regions"
                title="ASPECTS 10 Anatomical Regions Render"
                captionId="aspects-caption"
                caption="ASPECTS 10 Anatomical MCA Territory Regions for Non-Contrast CT Evaluation"
                onOpenLightbox={setLightboxImage}
              />
            </div>

            {/* §1 The question (purple) */}
            <CardSection color="purple" title="1. The Question">
              <div style={{ fontSize: '7.9pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                Historically EVT required a <strong>small core (ASPECTS ≥6)</strong>. Six 2022&ndash;2024 RCTs tested EVT for a <strong>large ischemic core</strong> (low ASPECTS or large core volume). All pointed toward a functional-outcome benefit — five met their primary endpoint; <strong>TESLA missed its Bayesian threshold but trended favorably</strong> — generally with <strong>higher symptomatic hemorrhage</strong>.
              </div>
            </CardSection>

            {/* §2 The trials (teal) */}
            <CardSection color="teal" title="2. The Trials (2022–2024)">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7.4pt' }}>
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
              </table>
            </CardSection>

            {/* §3 Bottom line & caveats (red) */}
            <CardSection color="red" title="3. Bottom Line & Caveats" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li>EVT is now recommended for <strong>selected large-core patients</strong> (low ASPECTS or large core with salvageable tissue) — reflected in the 2026 AHA/ASA AIS guideline. Benefit is usually a <strong>shift toward less disability</strong>, not independence.</li>
                <li>Symptomatic ICH is <strong>higher than in small-core EVT</strong>, but net functional benefit persists.</li>
                <li>Very large cores (<strong>ASPECTS 0–2</strong>) benefit less and carry the highest hemorrhage risk — <strong>individualize</strong>.</li>
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

            <VisualAssetFigure
              src="assets/evt_lvo_occlusion_sites.png"
              fallbackSvgSrc="assets/evt_lvo_occlusion_sites.svg"
              alt="Endovascular Thrombectomy Large Vessel Occlusion (LVO) Sites Diagram showing ICA terminus, MCA M1/M2, and Basilar Artery occlusion locations"
              title="EVT Occlusion Sites (ICA, M1, M2, Basilar)"
              captionId="evt-occlusions-caption"
              caption="Endovascular Thrombectomy (EVT) Occlusion Sites: ICA, MCA M1/M2, and Basilar Artery"
              onOpenLightbox={setLightboxImage}
            />

            {/* §1 Why it's different (purple) */}
            <CardSection color="purple" title="1. Why It's Different">
              <div style={{ fontSize: '7.9pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                BAO is ~<strong>1&ndash;4% of strokes</strong> but historically carried <strong>80&ndash;90% mortality / severe disability untreated</strong>. Presentation is <strong>protean</strong>: fluctuating or progressive brainstem signs, crossed deficits, coma, "locked-in," and gaze/oculomotor abnormalities. <strong>Herald TIAs are common.</strong> Keep a <strong>low threshold for CTA</strong> in unexplained coma or posterior-circulation signs.
              </div>
            </CardSection>

            {/* §2 The evidence arc (teal) */}
            <CardSection color="teal" title="2. The Evidence Arc">
              <table className="card-table" style={{ margin: '2px 0 6px 0', fontSize: '7.4pt' }}>
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
              </table>
              <div style={{ fontSize: '7.5pt', color: 'var(--ink-soft)', lineHeight: '1.35' }}>
                EVT (± IV thrombolysis) is now <strong>standard for BAO with salvageable tissue</strong>.
              </div>
            </CardSection>

            {/* §3 Selection & pitfalls (red) */}
            <CardSection color="red" title="3. Selection & Pitfalls" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li>Use <strong>pc-ASPECTS</strong> and perfusion / collateral assessment; <strong>extensive established pontine infarction predicts futile recanalization</strong>.</li>
                <li><strong>Time-to-treatment still matters</strong>; posterior circulation tolerates somewhat longer windows than anterior.</li>
                <li><strong>Combine with IVT</strong> when eligible.</li>
              </ul>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'ATTENTION', cite: 'Tao C et al. N Engl J Med. 2022;387(15):1361-1372.', pmid: '36239644' },
              { label: 'BAOCHE', cite: 'Jovin TG et al. N Engl J Med. 2022;387(15):1373-1384.', pmid: '36239645' },
              { label: 'BASICS', cite: 'Langezaal LCM et al. N Engl J Med. 2021;384(20):1910-1920.', pmid: '34010530' },
              { label: 'BEST', cite: 'Liu X et al. Lancet Neurol. 2020;19(2):115-122.', pmid: '31831388' },
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
// MODULE — Lipid Management After Ischemic Stroke
// =====================================================================
const LipidManagementView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <LipidManagementCard />
  </ScaledCardWrapper>
);

export function LipidManagementCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-lipid-management-after-stroke">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Lipid Management After Ischemic Stroke</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Lower LDL-C in atherosclerotic stroke &mdash; statin → ezetimibe → PCSK9 inhibitor.
            </p>

            {/* Hero SVG: LDL-lowering ladder + hemorrhagic-stroke caution */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 178" role="img" focusable="false" aria-label="ICH Hematoma Expansion Blood Pressure and Reversal Pathway" style={{ width: '100%', height: 'auto' }}>
                <text x="235" y="13" fill="var(--ink-soft)" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LDL-LOWERING LADDER</text>
                {/* LDL axis (descending) */}
                <line x1="34" y1="24" x2="34" y2="162" stroke="var(--ink-mute)" strokeWidth="1.2" markerEnd="url(#lm-arrow)" />
                <defs>
                  <marker id="lm-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--ink-mute)" />
                  </marker>
                </defs>
                <text x="18" y="20" fill="var(--ink-mute)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LDL</text>
                {[['~130', 34], ['100', 74], ['<70', 114], ['<55', 150]].map(([v, y]) => (
                  <g key={v}>
                    <line x1="30" y1={y} x2="38" y2={y} stroke="var(--ink-mute)" strokeWidth="1" />
                    <text x="27" y={y + 2.5} fill="var(--ink-mute)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="end">{v}</text>
                  </g>
                ))}
                {/* Step 1 — statin */}
                <rect x="52" y="24" width="250" height="34" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.4" />
                <text x="62" y="38" fill="var(--teal-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">① High-intensity statin</text>
                <text x="62" y="50" fill="var(--ink-soft)" fontSize="5.8pt" fontFamily="IBM Plex Sans" textAnchor="start">atorva 80 / rosuva 20–40 → goal LDL &lt;70 (SPARCL, TST)</text>
                {/* Step 2 — ezetimibe */}
                <rect x="118" y="66" width="250" height="34" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.4" />
                <text x="128" y="80" fill="var(--purple-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">② Add ezetimibe</text>
                <text x="128" y="92" fill="var(--ink-soft)" fontSize="5.8pt" fontFamily="IBM Plex Sans" textAnchor="start">further LDL + event reduction (IMPROVE-IT)</text>
                {/* Step 3 — PCSK9i */}
                <rect x="184" y="108" width="250" height="34" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.4" />
                <text x="194" y="122" fill="var(--amber-deep)" fontSize="7.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">③ Add PCSK9 inhibitor</text>
                <text x="194" y="134" fill="var(--ink-soft)" fontSize="5.8pt" fontFamily="IBM Plex Sans" textAnchor="start">evolocumab → very low LDL (FOURIER)</text>
                {/* descending connectors */}
                <path d="M 96 58 L 150 66" stroke="var(--ink-mute)" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
                <path d="M 162 100 L 216 108" stroke="var(--ink-mute)" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />

                {/* Caution branch */}
                <rect x="470" y="30" width="252" height="118" rx="8" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.4" />
                <path d="M 486 46 L 486 66 M 486 46 L 506 51 L 486 57 Z" fill="var(--red)" stroke="var(--red)" strokeWidth="1" />
                <text x="512" y="52" fill="var(--red-deep)" fontSize="6.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">Hemorrhagic-stroke branch</text>
                <text x="484" y="82" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">SPARCL showed a small excess of</text>
                <text x="484" y="94" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">hemorrhagic stroke. Intensive LDL</text>
                <text x="484" y="106" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">lowering purely for a primary ICH is</text>
                <text x="484" y="118" fill="var(--ink-soft)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="start">individualized. The strong indication</text>
                <text x="484" y="130" fill="var(--red-deep)" fontSize="6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">is atherosclerotic ischemic disease.</text>
              </svg>
            </div>

            {/* §1 Targets (purple) */}
            <CardSection color="purple" title="1. Targets">
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.8pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                <li>Atherosclerotic ischemic stroke: <strong>high-intensity statin, LDL-C goal &lt;70 mg/dL</strong> (AHA/ASA 2021 secondary prevention).</li>
                <li><strong>SPARCL:</strong> atorvastatin 80 mg reduced recurrent stroke (adjusted HR ~0.84; ~2.2% absolute reduction over 5 y) in recent stroke/TIA without known CHD; a <strong>small excess of hemorrhagic stroke</strong> was seen.</li>
                <li><strong>Treat Stroke to Target (TST):</strong> LDL &lt;70 vs 90–110 mg/dL lowered major cardiovascular events (HR 0.78) <strong>without</strong> a significant increase in ICH.</li>
              </ul>
            </CardSection>

            {/* §2 Add-on therapy (teal) */}
            <CardSection color="teal" title="2. Add-on Therapy">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '8pt' }}>Ezetimibe (IMPROVE-IT)</strong>
                  <br />Adding ezetimibe to a statin further lowered LDL and events, <strong>including a reduction in ischemic stroke</strong> — supports non-statin LDL lowering.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '10px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '8pt' }}>PCSK9 inhibitors (FOURIER)</strong>
                  <br />Evolocumab reduced cardiovascular events and ischemic stroke at very low LDL with <strong>no increase in hemorrhagic stroke</strong> — for patients not at goal on statin ± ezetimibe.
                </div>
              </div>
            </CardSection>

            {/* §3 Practical & cautions (red) */}
            <CardSection color="red" title="3. Practical & Cautions" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>Start/continue a high-intensity statin in-hospital</strong>; recheck a lipid panel and titrate; add ezetimibe then PCSK9i to reach &lt;70 (many favor <strong>&lt;55</strong> in very-high-risk polyvascular disease).</li>
                <li><strong>Statin intolerance:</strong> rechallenge, lower / alternate-day dosing, then non-statin agents.</li>
                <li><strong>Hemorrhagic stroke:</strong> the SPARCL signal means intensive LDL lowering purely for a primary ICH is individualized — the strong indication is atherosclerotic <em>ischemic</em> disease.</li>
              </ul>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'SPARCL', cite: 'Amarenco P et al. N Engl J Med. 2006;355(6):549-559.', pmid: '16899775' },
              { label: 'Treat Stroke to Target', cite: 'Amarenco P et al. N Engl J Med. 2020;382(1):9-19.', pmid: '31738483' },
              { label: 'FOURIER', cite: 'Sabatine MS et al. N Engl J Med. 2017;376(18):1713-1722.', pmid: '28304224' },
              { label: 'IMPROVE-IT', cite: 'Cannon CP et al. N Engl J Med. 2015;372(25):2387-2397.', pmid: '26039521' },
              { label: 'AHA/ASA 2021 Secondary Prevention', cite: 'Kleindorfer DO et al. Stroke. 2021;52(7):e364-e467.', pmid: '34024117' },
            ]} />
          </div>
        </div>
      </div>
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
              <svg viewBox="0 0 735 180" role="img" focusable="false" aria-label="Aneurysmal SAH Vasospasm EVD Management and Triple-H Therapy Diagram" style={{ width: '100%', height: 'auto' }}>
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
                <text x="422" y="106" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">≥70%: revascularize early</text>
                <text x="422" y="116" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">(CEA or CAS, ≤2 wk) + IMM</text>
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
                <li><strong>50–69%:</strong> moderate benefit (~4.6% absolute over 5 y; greater in men and with hemispheric symptoms). <strong>&lt;50%:</strong> no benefit.</li>
                <li><strong>Revascularize early</strong> (ideally within 2 weeks) on top of intensive medical therapy.</li>
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
                Two parallel RCTs, ≥70% asymptomatic stenosis, on modern intensive medical management (IMM). <strong>4-yr primary composite (periprocedural stroke/death + ipsilateral stroke):</strong>
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
                <strong>High-intensity statin (LDL &lt;70), antiplatelet, BP control, diabetes / lifestyle, smoking cessation</strong> — the common denominator across every arm.
              </div>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'CREST-2', cite: 'Brott TG et al. N Engl J Med. 2025;394(3):219-231.', pmid: '41269206' },
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
    { s: 'One-and-a-half (dorsal pons)', v: 'PPRF + MLF', d: 'Ipsi conjugate gaze palsy + INO — only residual movement is contralateral eye abduction.', lvl: 'pons' },
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
              <svg viewBox="0 0 735 165" role="img" focusable="false" aria-label="Asymptomatic Carotid Stenosis Revascularization vs Best Medical Therapy Pathway" style={{ width: '100%', height: 'auto' }}>
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
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.9pt' }}>
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
              </table>
            </CardSection>

            {/* §3 Pearls (amber) */}
            <CardSection color="amber" title="3. Pearls" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>Isolated vertigo</strong> can be a lateral medullary / AICA stroke — pair with the HINTS+ module.</li>
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
    { t: 'Anterior choroidal', s: 'Contra hemiparesis + hemisensory loss + hemianopia (posterior limb internal capsule)', c: 'red' },
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
              <svg viewBox="0 0 735 178" role="img" focusable="false" aria-label="Intracranial Atherosclerotic Disease Stenting versus Aggressive BMT Diagram" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <pattern id="vta-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="var(--slate)" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Panel 1 — axial territory pie (anterior = top) */}
                <text x={cx} y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">AXIAL TERRITORIES</text>
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" stroke="var(--rule)" strokeWidth="1.3" />
                <polygon points={wedge(235, 305)} fill="var(--purple-soft)" opacity="0.9" />
                <polygon points={wedge(305, 415)} fill="var(--teal-soft)" opacity="0.9" />
                <polygon points={wedge(55, 125)} fill="var(--amber-soft)" opacity="0.9" />
                <polygon points={wedge(125, 235)} fill="var(--teal-soft)" opacity="0.9" />
                {/* watershed hatch bands along the sector borders */}
                {[235, 305, 55, 125].map((deg) => {
                  const [x, y] = P(deg); const [xi, yi] = [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62];
                  return <line key={deg} x1={xi} y1={yi} x2={x} y2={y} stroke="url(#vta-hatch)" strokeWidth="8" strokeLinecap="butt" />;
                })}
                {/* deep territories */}
                <ellipse cx={cx} cy={cy} rx="20" ry="13" fill="var(--purple)" opacity="0.85" />
                <circle cx={cx} cy={cy + 16} r="6" fill="var(--red)" opacity="0.85" />
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="var(--rule)" strokeWidth="1.3" />
                <line x1={cx} y1={cy - ry} x2={cx} y2={cy + ry} stroke="var(--rule-soft)" strokeWidth="0.8" />
                {/* labels */}
                <text x={cx} y="40" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ACA</text>
                <text x="60" y={cy + 2} fill="var(--teal-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MCA</text>
                <text x="216" y={cy + 2} fill="var(--teal-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MCA</text>
                <text x={cx} y="134" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PCA</text>
                <text x={cx} y={cy + 2} fill="#ffffff" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LSA</text>
                <text x={cx + 44} y="150" fill="var(--slate)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">▒ watershed</text>
                <text x={cx} y="164" fill="var(--ink-mute)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">anterior (top) → posterior (bottom); deep = LSA / AChA</text>

                <line x1="252" y1="12" x2="252" y2="168" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel 2 — watershed patterns (coronal) */}
                <text x="368" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">WATERSHED PATTERNS</text>
                <path d="M 300 118 C 300 44 436 44 436 118 C 436 128 420 134 368 134 C 316 134 300 128 300 118 Z" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.3" />
                <line x1="368" y1="46" x2="368" y2="134" stroke="var(--rule-soft)" strokeWidth="0.8" />
                {/* cortical watershed wedge (superolateral) */}
                <polygon points="330,54 348,52 352,96 336,98" fill="url(#vta-hatch)" stroke="var(--slate)" strokeWidth="0.8" />
                <text x="316" y="50" fill="var(--slate)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">cortical</text>
                <text x="316" y="58" fill="var(--slate)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">(wedge)</text>
                {/* internal watershed = chain of beads */}
                {[70, 84, 98, 112].map((y) => <circle key={y} cx="392" cy={y} r="3.4" fill="var(--slate)" opacity="0.8" />)}
                <text x="420" y="70" fill="var(--slate)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">internal</text>
                <text x="420" y="78" fill="var(--slate)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">(chain)</text>
                <text x="368" y="150" fill="var(--ink-mute)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Cortical = ACA-MCA &amp; MCA-PCA borders</text>
                <text x="368" y="160" fill="var(--ink-mute)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Internal = deep white-matter rosary</text>

                <line x1="484" y1="12" x2="484" y2="168" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel 3 — circle of Willis inset */}
                <text x="606" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CIRCLE OF WILLIS</text>
                {/* ACA + ACoM (top) */}
                <line x1="586" y1="40" x2="626" y2="40" stroke="var(--purple)" strokeWidth="2.6" />
                <line x1="586" y1="40" x2="576" y2="26" stroke="var(--purple)" strokeWidth="2.6" />
                <line x1="626" y1="40" x2="636" y2="26" stroke="var(--purple)" strokeWidth="2.6" />
                <text x="606" y="24" fill="var(--purple-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ACA</text>
                {/* ICA (both sides) */}
                <line x1="576" y1="40" x2="568" y2="78" stroke="var(--slate)" strokeWidth="2.6" />
                <line x1="636" y1="40" x2="644" y2="78" stroke="var(--slate)" strokeWidth="2.6" />
                {/* MCA (M1 lateral) */}
                <line x1="568" y1="62" x2="536" y2="60" stroke="var(--teal)" strokeWidth="2.6" />
                <line x1="644" y1="62" x2="676" y2="60" stroke="var(--teal)" strokeWidth="2.6" />
                <text x="528" y="52" fill="var(--teal-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MCA</text>
                <text x="684" y="52" fill="var(--teal-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MCA</text>
                {/* PCoM + PCA */}
                <line x1="568" y1="78" x2="576" y2="100" stroke="var(--slate)" strokeWidth="2" />
                <line x1="644" y1="78" x2="636" y2="100" stroke="var(--slate)" strokeWidth="2" />
                <line x1="576" y1="100" x2="606" y2="106" stroke="var(--amber)" strokeWidth="2.6" />
                <line x1="636" y1="100" x2="606" y2="106" stroke="var(--amber)" strokeWidth="2.6" />
                <text x="606" y="102" fill="var(--amber-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PCA</text>
                {/* basilar + vertebrals */}
                <line x1="606" y1="106" x2="606" y2="132" stroke="var(--red)" strokeWidth="2.8" />
                <line x1="606" y1="132" x2="594" y2="150" stroke="var(--red)" strokeWidth="2.4" />
                <line x1="606" y1="132" x2="618" y2="150" stroke="var(--red)" strokeWidth="2.4" />
                <text x="640" y="124" fill="var(--red-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">basilar</text>
                <text x="606" y="164" fill="var(--ink-mute)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">collateral ring links anterior ↔ posterior</text>
              </svg>
            </div>

            {/* §1 Anterior circulation (purple, table) */}
            <CardSection color="purple" title="1. Anterior Circulation">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
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
              </table>
            </CardSection>

            {/* §2 Posterior circulation (teal, table) */}
            <CardSection color="teal" title="2. Posterior Circulation">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
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
              </table>
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
              Identify the agent → give the specific reversal → BP control, neurosurgery, hold the drug.
            </p>

            <VisualAssetFigure
              src="assets/hematoma_expansion_render.png"
              fallbackSvgSrc="assets/hematoma_expansion_render.svg"
              alt="Intracerebral Hemorrhage (ICH) Hematoma Expansion Risk and Spot Sign Neuroimaging Render illustrating acute expansion criteria and reversal targets"
              title="ICH Hematoma Expansion Risk & Spot Sign Render"
              captionId="hematoma-expansion-caption"
              caption="Intracerebral Hemorrhage (ICH) Hematoma Expansion Risk & CTA Spot Sign Render"
              onOpenLightbox={setLightboxImage}
            />

            {/* §1 Identify agent & last dose (purple) */}
            <CardSection color="purple" title="1. Identify the Agent & Last Dose">
              <div style={{ fontSize: '7.8pt', lineHeight: '1.42', color: 'var(--ink-soft)' }}>
                Establish <strong>drug, dose, time of last intake, indication, and renal function</strong>. Send baseline coags (INR/PTT; anti-Xa where available), but <strong>do not delay reversal</strong> for a hemorrhagic ICH while awaiting levels.
              </div>
            </CardSection>

            {/* §2 Agent-specific reversal (teal, table) */}
            <CardSection color="teal" title="2. Agent-Specific Reversal">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '7pt' }}>
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
                    <td><strong>4F-PCC</strong> (25–50 U/kg by INR/wt) <strong>+ IV vitamin K 10 mg</strong></td>
                    <td>Target INR &lt;1.4. PCC preferred over FFP (faster, lower volume).</td>
                  </tr>
                  <tr>
                    <td><strong>Dabigatran</strong> (DTI)</td>
                    <td><strong>Idarucizumab 5 g IV</strong></td>
                    <td>RE-VERSE AD: rapid, near-complete reversal. Hemodialysis is an adjunct.</td>
                  </tr>
                  <tr>
                    <td><strong>Factor Xa inhibitors</strong> (apixaban, rivaroxaban, edoxaban)</td>
                    <td><strong>Andexanet alfa</strong> (low/high dose by agent, dose, timing); <strong>4F-PCC ~50 U/kg</strong> if unavailable</td>
                    <td>ANNEXA-4: good hemostatic efficacy. <strong>ANNEXA-I</strong> (RCT in acute ICH): better hemostasis / less hematoma expansion vs usual care <strong>but more thrombotic events (10.3% vs 5.6%), including ischemic stroke (6.5% vs 1.5%)</strong> — weigh carefully.</td>
                  </tr>
                  <tr>
                    <td><strong>Antiplatelets</strong></td>
                    <td>Platelet transfusion <strong>not</strong> recommended (PATCH)</td>
                    <td>Exception: peri-neurosurgery. Consider desmopressin.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Parallel steps & BP targets (red) */}
            <CardSection color="red" title="3. Parallel Steps & BP Targets" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.7pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                <li><strong>BP target (INTERACT2 / ATACH-2):</strong> Smooth, rapid lowering to <strong>SBP &lt;140 mmHg</strong> (target range 130–140; avoid acute drops &lt;110 mmHg). First-line IV nicardipine, clevidipine, or labetalol.</li>
                <li><strong>Neurosurgery consult:</strong> Urgent for cerebellar ICH with brainstem compression / hydrocephalus, large lobar ICH with mass effect, or intraventricular hemorrhage with EVD need.</li>
                <li><strong>Hold all antithrombotics:</strong> Re-evaluate resumption timeline based on indication (AFib vs mechanical valve) and ICH expansion stability.</li>
              </ul>
            </CardSection>

            <CardRefFooter style={{ fontSize: '7.2pt' }} refs={[
              { label: 'ANNEXA-4', cite: 'Connolly SJ et al. N Engl J Med. 2019;380(14):1326-1335.', pmid: '30730782' },
              { label: 'ANNEXA-I', cite: 'Connolly SJ et al. N Engl J Med. 2024;390(19):1745-1755.', pmid: '38749032' },
              { label: 'RE-VERSE AD', cite: 'Pollack CV et al. N Engl J Med. 2017;377(5):431-441.', pmid: '28693366' },
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
// MODULE — NIHSS Certification Simulator (INTERACTIVE)
// =====================================================================
const NIHSS_ITEMS = [
  { id: '1a', label: '1a · LOC', max: 3 },
  { id: '1b', label: '1b · LOC questions', max: 2 },
  { id: '1c', label: '1c · LOC commands', max: 2 },
  { id: '2', label: '2 · Best gaze', max: 2 },
  { id: '3', label: '3 · Visual fields', max: 3 },
  { id: '4', label: '4 · Facial palsy', max: 3 },
  { id: '5a', label: '5a · Motor left arm', max: 4 },
  { id: '5b', label: '5b · Motor right arm', max: 4 },
  { id: '6a', label: '6a · Motor left leg', max: 4 },
  { id: '6b', label: '6b · Motor right leg', max: 4 },
  { id: '7', label: '7 · Limb ataxia', max: 2 },
  { id: '8', label: '8 · Sensory', max: 2 },
  { id: '9', label: '9 · Best language', max: 3 },
  { id: '10', label: '10 · Dysarthria', max: 2 },
  { id: '11', label: '11 · Extinction / inattention', max: 2 },
];

const NIHSS_CASES = [
  {
    id: 'A',
    title: 'Case A — 68F, sudden right-sided weakness and speech difficulty',
    vignette: 'Dominant (left) MCA syndrome. Alert but non-fluent, effortful speech; right face/arm/leg weakness.',
    items: {
      '1a': { score: 0, finding: 'Alert and keenly responsive.', rationale: 'Alert → 0.' },
      '1b': { score: 1, finding: 'States her age correctly; cannot name the month.', rationale: 'One of two answered correctly → 1 (score the first attempt; aphasia is captured in item 9, not here).' },
      '1c': { score: 0, finding: 'Opens/closes eyes and grips on command.', rationale: 'Performs both tasks → 0.' },
      '2': { score: 1, finding: 'Forced gaze to the left, overcome with oculocephalics.', rationale: 'Partial gaze palsy that can be overcome → 1.' },
      '3': { score: 2, finding: 'Complete right homonymous hemianopia.', rationale: 'Complete hemianopia → 2.' },
      '4': { score: 2, finding: 'Right lower-face droop; forehead spared.', rationale: 'Partial (lower-face) paralysis → 2.' },
      '5a': { score: 0, finding: 'Left arm holds 10 s, no drift.', rationale: 'No drift → 0.' },
      '5b': { score: 3, finding: 'Right arm: no effort against gravity, falls immediately.', rationale: 'No antigravity effort → 3.' },
      '6a': { score: 0, finding: 'Left leg holds 5 s.', rationale: 'No drift → 0.' },
      '6b': { score: 2, finding: 'Right leg has some antigravity effort but drifts to the bed by 5 s.', rationale: 'Some effort against gravity, falls to bed → 2.' },
      '7': { score: 0, finding: 'Right limbs are plegic; no ataxia out of proportion.', rationale: 'Ataxia is absent (0) when the limb is plegic or the deficit is explained by weakness — "untestable" is reserved for amputation/joint fusion.' },
      '8': { score: 1, finding: 'Blunted pinprick on the right.', rationale: 'Mild-to-moderate sensory loss → 1.' },
      '9': { score: 2, finding: 'Fragmentary, effortful output; frequent word-finding failure.', rationale: 'Severe aphasia → 2 (you rate language from naming/reading/description — you do not skip it).' },
      '10': { score: 1, finding: 'Mild slurring, intelligible.', rationale: 'Mild-to-moderate dysarthria → 1.' },
      '11': { score: 0, finding: 'Attends to both sides; no neglect.', rationale: 'No extinction/inattention → 0 (neglect is uncommon with dominant-hemisphere lesions).' },
    },
    teaching: 'Total 15. Score the first effort and what you see — do not coach. A dominant-hemisphere MCA stroke loads the language/motor items heavily.',
  },
  {
    id: 'B',
    title: 'Case B — 72M, sudden imbalance and "can\'t see to the left"',
    vignette: 'Right PCA + cerebellar (posterior circulation) stroke. Awake, fluent, coordinated arm strength but veers when walking; vertigo.',
    items: {
      '1a': { score: 0, finding: 'Alert.', rationale: 'Alert → 0.' },
      '1b': { score: 0, finding: 'Age and month correct.', rationale: 'Both correct → 0.' },
      '1c': { score: 0, finding: 'Follows both commands.', rationale: 'Both tasks → 0.' },
      '2': { score: 0, finding: 'Full conjugate eye movements.', rationale: 'Normal gaze → 0.' },
      '3': { score: 2, finding: 'Complete left homonymous hemianopia.', rationale: 'Complete hemianopia → 2.' },
      '4': { score: 0, finding: 'Symmetric face.', rationale: 'Normal → 0.' },
      '5a': { score: 0, finding: 'Left arm holds.', rationale: 'No drift → 0.' },
      '5b': { score: 0, finding: 'Right arm holds.', rationale: 'No drift → 0.' },
      '6a': { score: 0, finding: 'Left leg holds.', rationale: 'No drift → 0.' },
      '6b': { score: 0, finding: 'Right leg holds.', rationale: 'No drift → 0.' },
      '7': { score: 1, finding: 'Dysmetria on right finger-nose out of proportion to strength.', rationale: 'Ataxia present in one limb → 1 (limbs are strong, so it is testable).' },
      '8': { score: 0, finding: 'Intact pinprick.', rationale: 'Normal sensation → 0.' },
      '9': { score: 0, finding: 'Fluent, names and repeats normally.', rationale: 'No aphasia → 0.' },
      '10': { score: 1, finding: 'Slurred, intelligible speech.', rationale: 'Mild-to-moderate dysarthria → 1.' },
      '11': { score: 0, finding: 'Attends to both sides.', rationale: 'No extinction → 0.' },
    },
    teaching: 'Total 4. A disabling posterior-circulation stroke (hemianopia + ataxia + vertigo) scores LOW because the scale has no items for vertigo and few for posterior/right-hemisphere signs — a low NIHSS does not exclude a disabling or LVO stroke.',
  },
];

export function NihssSimulator() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const activeCase = NIHSS_CASES[caseIdx];
  const correctTotal = NIHSS_ITEMS.reduce((s, it) => s + activeCase.items[it.id].score, 0);
  const answeredIds = Object.keys(answers);
  const userTotal = answeredIds.reduce((s, id) => s + answers[id], 0);
  const allAnswered = NIHSS_ITEMS.every((it) => answers[it.id] != null);
  const numCorrect = NIHSS_ITEMS.filter((it) => answers[it.id] === activeCase.items[it.id].score).length;

  const pick = (id, n) => setAnswers((a) => ({ ...a, [id]: n }));
  const selectCase = (i) => { setCaseIdx(i); setAnswers({}); };
  const reset = () => setAnswers({});

  return (
    <div className="space-y-4">
      {/* Case selector */}
      <div className="flex flex-wrap items-center gap-2">
        {NIHSS_CASES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCase(i)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${i === caseIdx ? 'bg-cobalt-600 text-white shadow-sm' : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            Case {c.id}
          </button>
        ))}
        <button type="button" onClick={reset} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 min-h-[38px] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          Reset
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">Running total: <span className="text-cobalt-700 dark:text-cobalt-300">{userTotal}</span> / 42</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="p-3.5 rounded-lg bg-cobalt-50 border border-cobalt-200 dark:bg-cobalt-950/40 dark:border-cobalt-800/60">
        <h3 className="text-sm font-bold text-ink">{activeCase.title}</h3>
        <p className="text-xs text-ink-2 mt-1">{activeCase.vignette}</p>
        <p className="text-[11px] text-mute mt-2">Score each item from the exam finding shown. You get immediate feedback and the rationale. Score the first effort / what you see — do not coach.</p>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {NIHSS_ITEMS.map((it) => {
          const data = activeCase.items[it.id];
          const ans = answers[it.id];
          const answered = ans != null;
          const correct = answered && ans === data.score;
          return (
            <div key={it.id} className={`rounded-lg border p-3 ${!answered ? 'border-line bg-card' : correct ? 'border-ok-300 bg-ok-50 dark:bg-ok-950/30 dark:border-ok-800' : 'border-crit-300 bg-crit-50 dark:bg-crit-950/30 dark:border-crit-800'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink">{it.label}</span>
                  <span className="text-xs text-ink-2"> — {data.finding}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Array.from({ length: it.max + 1 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => pick(it.id, n)}
                      aria-label={`Score ${n} for item ${it.label}`}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${ans === n ? 'bg-cobalt-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {answered && (
                <div className="mt-2 text-xs flex items-start gap-1.5">
                  <span className={`font-bold shrink-0 ${correct ? 'text-ok-700 dark:text-ok-400' : 'text-crit-700 dark:text-crit-400'}`}>
                    {correct ? '✓ Correct' : `✗ Correct = ${data.score}`}
                  </span>
                  <span className="text-ink-2">{data.rationale}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {allAnswered && (
        <div className="rounded-lg border border-cobalt-300 bg-cobalt-50 p-4 dark:bg-cobalt-950/40 dark:border-cobalt-800">
          <h3 className="text-sm font-bold text-ink">Case complete</h3>
          <p className="text-sm text-ink-2 mt-1">
            Your total: <strong className="text-ink">{userTotal}</strong> · Correct total: <strong className="text-ink">{correctTotal}</strong> · Items correct: <strong className="text-ink">{numCorrect}/15</strong>
          </p>
          <p className="text-xs text-ink-2 mt-2"><strong className="text-ink">Teaching point:</strong> {activeCase.teaching}</p>
        </div>
      )}

      {/* Scoring-rules reference panel */}
      <div className="rounded-lg border border-line bg-slate-50 p-4 dark:bg-slate-800/40 space-y-3">
        <h3 className="text-sm font-bold text-ink">Scoring rules reference</h3>
        <div>
          <p className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">The 15 items (range 0–42)</p>
          <p className="text-xs text-ink-2 mt-1">1a LOC, 1b LOC questions, 1c LOC commands, 2 best gaze, 3 visual fields, 4 facial palsy, 5a/5b motor arms, 6a/6b motor legs, 7 limb ataxia, 8 sensory, 9 best language, 10 dysarthria, 11 extinction/inattention.</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">Rules that trip people up</p>
          <ul className="text-xs text-ink-2 mt-1 list-disc pl-4 space-y-0.5">
            <li>Score the <strong>first effort / what you see</strong>, not the best attempt; don't coach.</li>
            <li><strong>Coma (1a = 3)</strong> drives defaults across items per the standardized instructions.</li>
            <li>Items 5/6 (motor): score the drift/fall timing; amputation or joint fusion = untestable.</li>
            <li><strong>Item 7 (ataxia):</strong> absent (0) if the patient can't understand or is plegic; "untestable" only for amputation/fusion.</li>
            <li><strong>Item 9 (language)</strong> captures aphasia — you rate it from naming/reading/description, you don't skip it.</li>
            <li><strong>Item 10 (dysarthria):</strong> intubated / mechanical barrier = untestable (UN).</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-warn-800 dark:text-warn-400">Interpretation caveat</p>
          <p className="text-xs text-ink-2 mt-1">The scale is <strong>weighted toward left-hemisphere / cortical function</strong> (multiple language-dependent items; only the single extinction / inattention item, max 2 points, captures right-hemisphere neglect), so it <strong>underestimates posterior-circulation and right-hemisphere strokes</strong> — a low NIHSS does not exclude a disabling or LVO stroke (e.g., isolated hemianopia, vertigo, or ataxia).</p>
        </div>
        <div className="text-[11px] text-mute border-t border-line pt-2">
          NIHSS (original): Brott T et al. Stroke. 1989;20(7):864-870. <a className="text-cobalt-700 dark:text-cobalt-300 underline" href="https://pubmed.ncbi.nlm.nih.gov/2749846/" target="_blank" rel="noopener noreferrer">PMID: 2749846</a> · Training/reliability: Lyden P et al. Stroke. 1994;25(11):2220-2226. <a className="text-cobalt-700 dark:text-cobalt-300 underline" href="https://pubmed.ncbi.nlm.nih.gov/7974549/" target="_blank" rel="noopener noreferrer">PMID: 7974549</a>
        </div>
      </div>
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
  const rcvs2 = [
    { v: 'Recurrent or single thunderclap headache', p: '+5' },
    { v: 'Intracranial carotid artery involvement', p: '−2' },
    { v: 'Vasoconstrictive trigger', p: '+3' },
    { v: 'Female sex', p: '+1' },
    { v: 'Subarachnoid hemorrhage (SAH)', p: '+1' },
  ];
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
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Tenecteplase versus Alteplase Mechanism Thrombolysis Pathway" style={{ width: '100%', height: 'auto' }}>
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
                {['Subacute / progressive', 'No trigger', 'Enhancing lesions', 'Biopsy + immunosuppress'].map((t, i) => (
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

            {/* §3 RCVS vs PACNS — RCVS² score (red) */}
            <CardSection color="red" title="3. RCVS² Score (RCVS vs PACNS)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.2pt', color: 'var(--ink-soft)' }}>
                  <tbody>
                    {rcvs2.map((r) => (
                      <tr key={r.v} style={{ borderBottom: '1px solid var(--rule-soft)' }}>
                        <td style={{ padding: '2px 0' }}>{r.v}</td>
                        <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700, color: 'var(--red-deep)' }}>{r.p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                  Range <strong>−2 to +10</strong>.
                  <br /><strong style={{ color: 'var(--red-deep)' }}>≥5</strong> → RCVS (99% spec, 90% sens).
                  <br /><strong style={{ color: 'var(--teal-deep)' }}>≤2</strong> → excludes RCVS (100% spec, 85% sens).
                  <br /><strong>3–4</strong> indeterminate.
                </div>
              </div>
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
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Aneurysmal SAH: Grading & Early Management
// =====================================================================
const AneurysmalSahView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <AneurysmalSahCard />
  </ScaledCardWrapper>
);

export function AneurysmalSahCard() {
  const dx = (d) => 384 + d * 14.8; // timeline day → x (0..21)
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-aneurysmal-sah-management">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px' }}>Aneurysmal SAH</h1>
            <p style={{ fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '10px', textAlign: 'center', fontWeight: '500' }}>
              Grading, early aneurysm securing, nimodipine, and delayed cerebral ischemia.
            </p>

            {/* Hero SVG: basal-cistern SAH + aneurysm | management timeline */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Extended Window Perfusion Imaging Core Penumbra Mismatch Map" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A — basal cistern star + aneurysm */}
                <text x="130" y="13" fill="var(--ink-soft)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">BASAL-CISTERN SAH + ANEURYSM</text>
                <ellipse cx="130" cy="88" rx="102" ry="60" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.3" />
                <polygon points="130,56 138,78 160,78 142,92 149,114 130,101 111,114 118,92 100,78 122,78" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.3" />
                {/* extend blood into sylvian fissures */}
                <path d="M 100 78 C 78 74 70 88 78 96" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 160 78 C 182 74 190 88 182 96" stroke="var(--red)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="130" cy="50" r="7" fill="var(--red)" stroke="var(--red-deep)" strokeWidth="1.2" />
                <text x="150" y="46" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">saccular aneurysm</text>
                <text x="150" y="54" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">(ACoM / PCoM)</text>
                <text x="130" y="140" fill="var(--ink-mute)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">star-shaped blood in the basal cisterns</text>

                <line x1="252" y1="12" x2="252" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B — timeline */}
                <text x="540" y="13" fill="var(--ink-soft)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">EARLY-MANAGEMENT TIMELINE</text>
                <line x1={dx(0)} y1="118" x2={dx(21)} y2="118" stroke="var(--ink-mute)" strokeWidth="1.2" />
                {[0, 7, 14, 21].map((d) => (
                  <g key={d}>
                    <line x1={dx(d)} y1="115" x2={dx(d)} y2="121" stroke="var(--ink-mute)" strokeWidth="1" />
                    <text x={dx(d)} y="131" fill="var(--ink-mute)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">d{d}</text>
                  </g>
                ))}
                {/* day 0 secure */}
                <rect x={dx(0) - 4} y="30" width="112" height="22" rx="5" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.2" />
                <text x={dx(0) + 52} y="44" fill="var(--purple-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Day 0: secure aneurysm</text>
                <line x1={dx(0)} y1="52" x2={dx(0)} y2="66" stroke="var(--purple)" strokeWidth="1" strokeDasharray="2 2" />
                {/* nimodipine bar */}
                <rect x={dx(0)} y="66" width={dx(21) - dx(0)} height="16" rx="4" fill="var(--teal)" />
                <text x={(dx(0) + dx(21)) / 2} y="77" fill="#ffffff" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Nimodipine × 21 days</text>
                {/* DCI watch bar */}
                <rect x={dx(4)} y="90" width={dx(14) - dx(4)} height="16" rx="4" fill="var(--amber)" />
                <text x={(dx(4) + dx(14)) / 2} y="101" fill="#ffffff" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">DCI watch d4–14</text>
                <text x="540" y="150" fill="var(--ink-mute)" fontSize="5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Secure early → nimodipine for all → watch for delayed cerebral ischemia</text>
              </svg>
            </div>

            {/* §1 Grade it (purple) */}
            <CardSection color="purple" title="1. Grade It">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.4pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)' }}>Hunt-Hess (I–V)</strong><br />Clinical: headache / nuchal → coma.
                </div>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)' }}>WFNS (I–V)</strong><br />GCS-based ± motor deficit.
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)' }}>Modified Fisher (0–4)</strong><br />Cisternal blood + IVH → predicts vasospasm / DCI.
                </div>
              </div>
            </CardSection>

            {/* §2 Secure the aneurysm (teal) */}
            <CardSection color="teal" title="2. Secure the Aneurysm Early">
              <div style={{ fontSize: '7.6pt', lineHeight: '1.4', color: 'var(--ink-soft)' }}>
                Treat within <strong>~24&ndash;72 h</strong> to prevent rebleeding, by <strong>endovascular coiling or surgical clipping</strong>. <strong>ISAT:</strong> for ruptured aneurysms suitable for either, coiling gave <strong>better 1-year disability-free survival</strong> (≈7% absolute reduction in death/dependency) than clipping, with a small increase in late rebleeding / retreatment — modality is a multidisciplinary decision by aneurysm morphology and patient factors.
              </div>
            </CardSection>

            {/* §3 Prevent secondary injury (red) */}
            <CardSection color="red" title="3. Prevent Secondary Injury" style={{ marginBottom: '6px' }}>
              <ul style={{ margin: '0', paddingLeft: '14px', fontSize: '7.4pt', lineHeight: '1.36', color: 'var(--ink-soft)' }}>
                <li><strong>Pre-securing:</strong> control BP (avoid extremes), analgesia; a short antifibrinolytic course (&lt;72 h) is optional to reduce ultra-early rebleed.</li>
                <li><strong>Nimodipine 60 mg PO q4h × 21 days for all</strong> — improves neurologic outcome / reduces DCI, even though it does not reduce angiographic vasospasm (BRANT).</li>
                <li><strong>DCI / vasospasm peaks days 4&ndash;14:</strong> monitor exam ± TCD; treat with induced hypertension and, if refractory, endovascular angioplasty / intra-arterial vasodilators. Maintain <strong>euvolemia</strong> (avoid prophylactic hypervolemia). Watch for hyponatremia (SIADH vs cerebral salt wasting) and hydrocephalus (EVD).</li>
              </ul>
            </CardSection>

            <CardRefFooter refs={[
              { label: 'AHA/ASA 2023 aSAH Guideline', cite: 'Hoh BL et al. Stroke. 2023;54(7):e314-e370.', pmid: '37212182' },
              { label: 'ISAT', cite: 'Molyneux A et al. Lancet. 2002;360(9342):1267-1274.', pmid: '12414200' },
              { label: 'Nimodipine (BRANT)', cite: 'Pickard JD et al. BMJ. 1989;298(6674):636-642.', pmid: '2496789' },
              { label: 'Modified Fisher scale', cite: 'Frontera JA et al. Neurosurgery. 2006;59(1):21-27.', pmid: '16823296' },
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

const CtpGhostCoreView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <CtpGhostCoreCard />
  </ScaledCardWrapper>
);

export function CtpGhostCoreCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-ctp-ghost-core">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>CTP Artifacts, Ghost Core &amp; Penumbra Nuances</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              CBF &lt;30% Overestimation &bull; ADC &lt;620 Diffusion Reversibility &bull; Tmax &gt;6s vs &gt;10s (HIR) &bull; Truncation &amp; Carotid Delay Pseudo-Penumbra
            </p>

            {/* Hero SVG: CTP Core vs Penumbra, Ghost Core Reversal & Artifacts */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="CT Perfusion Ischemic Core Ghost Core and Penumbra Mismatch Visualizer" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A: Core vs Penumbra & Ghost Core */}
                <text x="120" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CORE vs PENUMBRA &amp; GHOST CORE</text>
                {/* Outer Penumbra (Tmax >6s) */}
                <ellipse cx="120" cy="80" rx="90" ry="52" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="120" y="42" fill="var(--amber-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Penumbra: Tmax &gt;6s (Salvageable)</text>
                {/* Apparent Core (rCBF <30%) */}
                <ellipse cx="120" cy="88" rx="54" ry="32" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
                <text x="120" y="80" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Acute rCBF &lt;30% (Apparent Core)</text>
                {/* True Core (ADC <620) & Salvaged Ghost Core */}
                <ellipse cx="120" cy="94" rx="26" ry="16" fill="var(--red)" opacity="0.85" />
                <text x="120" y="97" fill="#ffffff" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">True Core</text>
                <text x="120" y="148" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Rapid Reperfusion &rarr; Green Zone Salvaged ("Ghost Core")</text>

                <line x1="242" y1="12" x2="242" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B: Hypoperfusion Intensity Ratio (HIR) */}
                <text x="366" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HYPOPERFUSION INTENSITY RATIO (HIR)</text>
                <rect x="256" y="26" width="220" height="124" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                <text x="366" y="40" fill="var(--purple-deep)" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HIR = Volume(Tmax &gt;10s) / Volume(Tmax &gt;6s)</text>
                
                {/* Low HIR Gauge */}
                <rect x="268" y="52" width="94" height="42" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.2" />
                <text x="315" y="66" fill="var(--teal-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LOW HIR (&lt;0.4)</text>
                <text x="315" y="78" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Robust Collaterals</text>
                <text x="315" y="88" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Slow Progressor (~2 mL/h)</text>

                {/* High HIR Gauge */}
                <rect x="372" y="52" width="94" height="42" rx="4" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.2" />
                <text x="419" y="66" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HIGH HIR (&gt;0.5)</text>
                <text x="419" y="78" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Poor / Absent Collaterals</text>
                <text x="419" y="88" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Fast Progressor (~15 mL/h)</text>

                <text x="366" y="112" fill="var(--ink-soft)" fontSize="5.0pt" fontFamily="IBM Plex Sans" textAnchor="middle">High HIR predicts severe edema &amp; hemorrhagic transformation</text>
                <text x="366" y="124" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Low HIR identifies patients benefiting from late EVT (DEFUSE 3 / DAWN)</text>

                <line x1="490" y1="12" x2="490" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel C: Deconvolution Artifacts */}
                <text x="612" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">TECHNICAL ARTIFACTS &amp; PITFALLS</text>
                <rect x="502" y="26" width="222" height="58" rx="5" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.2" />
                <text x="613" y="39" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Carotid Stenosis "Pseudo-Penumbra"</text>
                <text x="613" y="51" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Severe extracranial ICA stenosis &rarr; contrast arrival delay</text>
                <text x="613" y="61" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Artificially inflates Tmax &gt;6s across entire hemisphere</text>
                <text x="613" y="73" fill="var(--amber-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Rule: Cross-check CBV &amp; delay-insensitive sSVD</text>

                <rect x="502" y="90" width="222" height="60" rx="5" fill="var(--slate-soft)" stroke="var(--slate)" strokeWidth="1.2" />
                <text x="613" y="103" fill="var(--slate)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Bolus Truncation &amp; Motion Artifacts</text>
                <text x="613" y="115" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Premature scan termination before washout &rarr; fake core</text>
                <text x="613" y="125" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">Patient motion &rarr; slice misregistration &amp; false mismatch</text>
                <text x="613" y="137" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Inspect raw AIF/VOF time-density curves on every scan</text>
              </svg>
            </div>

            {/* §1 Core & Penumbra Definitions & Physical Thresholds (purple) */}
            <CardSection color="purple" title="1. Ischemic Core &amp; Penumbra Physical Thresholds">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>CTP Automated Core (rCBF &lt;30%)</strong>
                  <br />&bull; Relative Cerebral Blood Flow &lt;30% compared to contralateral normal hemisphere.
                  <br />&bull; Deconvolution threshold optimized against 24h follow-up DWI (RAPID / Olea / Syngo.via).
                  <br />&bull; Reflects microvascular collapse and failure of sodium-potassium ATP pumps.
                </div>
                <div style={{ border: '1px solid var(--teal)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>MRI DWI Core (ADC &lt;620 &mu;m&sup2;/s)</strong>
                  <br />&bull; Apparent Diffusion Coefficient &lt;620 &times; 10&minus;6 mm&sup2;/s indicates severe cytotoxic edema.
                  <br />&bull; Reflects intracellular water trapping from energy failure and cell swelling.
                  <br />&bull; Less susceptible to contrast bolus kinetics than CTP, but can still show partial reversibility.
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Target Penumbra (Tmax &gt;6s)</strong>
                  <br />&bull; Tmax &gt;6s represents critically hypoperfused tissue destined to infarct without reperfusion.
                  <br />&bull; <strong>DEFUSE 3 Target Mismatch:</strong> Mismatch ratio &ge;1.8, absolute mismatch volume &ge;15 mL, and core volume &lt;70 mL.
                  <br />&bull; <strong>DAWN Mismatch:</strong> Clinical deficit (NIHSS) vs Core volume mismatch.
                </div>
              </div>
            </CardSection>

            {/* §2 Ghost Core Phenomenon & Diffusion Reversibility (teal) */}
            <CardSection color="teal" title="2. Ghost Core Phenomenon &amp; Diffusion Reversibility">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.36', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Ghost Core Mechanism (Campbell 2012, Boned 2017)</strong>
                  <br />&bull; <strong>Definition:</strong> Significant overestimation of ultimate infarct volume by baseline CTP rCBF &lt;30% in hyperacute presenters (&lt;2–3h) who achieve rapid, complete reperfusion (TICI 2b/3 &lt;60–90 min post-imaging).
                  <br />&bull; <strong>Pathophysiology:</strong> Severely hypoperfused tissue experiences acute metabolic hibernation and cellular stunning that falls below the 30% CBF threshold but has not yet sustained irreversible membrane rupture.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>ADC Lesion Reversal (Copen 2015)</strong>
                  <br />&bull; <strong>Reversibility:</strong> Up to 15–20% of DWI/ADC restriction lesions can normalize if reperfusion occurs hyperacutely.
                  <br />&bull; <strong>Pseudonormalization vs True Salvage:</strong> True salvage shows permanent ADC normalization with no T2/FLAIR hyperintensity at 30–90 days.
                  <br />&bull; Severe ADC depression (&lt;450 &mu;m&sup2;/s) is universally irreversible.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Clinical Trial Relevance</strong>
                  <br />&bull; Large-core trials (SELECT2, ANGEL-ASPECT, TENSION, LASTE) proved that patients with large baseline CTP cores (50–100+ mL) still achieve robust functional benefit with EVT.
                  <br />&bull; <strong>Never withhold EVT</strong> in early windows based solely on automated CTP core volume.
                </div>
              </div>
            </CardSection>

            {/* §3 Technical Deconvolution Artifacts & Pseudo-Penumbra (amber) */}
            <CardSection color="amber" title="3. Technical Deconvolution Artifacts &amp; Hemodynamic Pitfalls">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.7pt' }}>
                <thead>
                  <tr style={{ background: 'var(--amber)' }}>
                    <th style={{ width: '130px' }}>Artifact / Pitfall Type</th>
                    <th style={{ width: '180px' }}>Underlying Mechanism &amp; Imaging Presentation</th>
                    <th>Bedside Identification &amp; Verification Safeguard</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Carotid Stenosis Arrival Delay (Pseudo-Penumbra)</strong></td>
                    <td>Severe extracranial ICA stenosis or tandem occlusion causes delayed bolus arrival and temporal dispersion &rarr; entire hemisphere shows prolonged Tmax &gt;6s despite adequate tissue perfusion.</td>
                    <td><strong>Cross-check Cerebral Blood Volume (CBV):</strong> If CBV is normal or elevated (compensatory autoregulatory vasodilation), tissue is viable. Use delay-insensitive block-circulant deconvolution (bSVD/sSVD).</td>
                  </tr>
                  <tr>
                    <td><strong>Bolus Truncation (Premature Cutoff)</strong></td>
                    <td>Scan acquisition terminated before contrast completes venous washout (&lt;45–50s) &rarr; deconvolution algorithm treats unobserved contrast clearance as severe hypoperfusion.</td>
                    <td><strong>Inspect Time-Density Curves:</strong> Ensure the Venous Output Function (VOF) curve returns to baseline. Truncation artificially inflates Tmax and falsely drops CBF/CBV.</td>
                  </tr>
                  <tr>
                    <td><strong>Arterial Input Function (AIF) Misplacement</strong></td>
                    <td>Automated algorithm selects a branch vessel, an artery distal to stenosis, or a vessel with low signal-to-noise ratio &rarr; CBF and CBV are incorrectly scaled.</td>
                    <td>Manually inspect AIF curve: Peak should be sharp, tall, and narrow (typically ipsilateral or contralateral proximal A1 or M1 segment).</td>
                  </tr>
                  <tr>
                    <td><strong>Patient Motion / Misregistration</strong></td>
                    <td>Head movement during dynamic acquisition creates misaligned subtraction masks &rarr; manifests as artificial crescentic core bands along cortical edges or ventricles.</td>
                    <td>Review raw dynamic perfusion cine loop to detect motion; check motion-correction quality score on automated report.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §4 Verification Rules & Tiered Bedside Pearls (slate) */}
            <CardSection color="slate" title="4. Verification Rules &amp; Tiered Bedside Pearls">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Trainee / Telestroke Pearls</strong>
                  <br />&bull; <strong>ASPECTS Cross-Validation:</strong> If CTP reports 80 mL core but NCCT has ASPECTS 9–10 with no parenchymal hypoattenuation, suspect ghost core and proceed to thrombectomy.
                  <br />&bull; Always check the raw CTA source images for vessel patency and collateral filling.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Fellow / Neuroimaging Pearls</strong>
                  <br />&bull; <strong>HIR Collateral Index:</strong> Calculate HIR (Tmax &gt;10s / Tmax &gt;6s). HIR &lt;0.4 confirms slow infarct growth and excellent collateral support; HIR &gt;0.5 flags high risk of rapid core progression.
                  <br />&bull; In tandem ICA-MCA occlusions, evaluate multiphase CTA to distinguish true tissue hypoperfusion from transit delay.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Attending / Interventional Pearls</strong>
                  <br />&bull; <strong>Deconvolution Physics:</strong> Standard singular value decomposition (sSVD) is delay-sensitive; Bayesian deconvolution (bSVD) or oscillation-index SVD provides robust delay-insensitive estimation.
                  <br />&bull; Blood-Brain Barrier (BBB) permeability index (Ktrans) predicts post-EVT reperfusion hemorrhage.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'Ghost Core Phenomenon', cite: 'Campbell BCV et al. Stroke. 2012;43(10):2648-2653.', pmid: '22858726' },
              { label: 'Core Reversibility & Time', cite: 'Boned S et al. J Neurointerv Surg. 2017;9(1):66-69.', pmid: '27566491' },
              { label: 'DWI ADC Reversal', cite: 'Copen WA et al. PLoS One. 2015;10(7):e0133566.', pmid: '26193486' },
              { label: 'DEFUSE 2 Mismatch', cite: 'Lansberg MG et al. Lancet Neurol. 2012;11(10):860-867.', pmid: '22954705' },
              { label: 'AHA/ASA 2026 AIS Guideline', cite: 'Prabhakaran S et al. Stroke. 2026.', pmid: '41582814' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="High Resolution Vessel Wall MRI Differential Patterns Cross Section Diagram" style={{ width: '100%', height: 'auto' }}>
                <text x="367" y="13" fill="var(--ink-soft)" fontSize="6.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">VW-MRI CROSS-SECTIONAL ARTERIOPATHY PATTERNS (3.0T BLACK-BLOOD)</text>

                {/* 1. ICAD */}
                <g transform="translate(10, 22)">
                  <rect x="0" y="0" width="138" height="136" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.2" />
                  <text x="69" y="14" fill="var(--purple-deep)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">1. ICAD</text>
                  {/* Outer wall */}
                  <ellipse cx="69" cy="62" rx="38" ry="38" fill="none" stroke="var(--ink-mute)" strokeWidth="1.5" />
                  {/* Eccentric plaque (thick on one side) */}
                  <path d="M 31 62 A 38 38 0 0 1 107 62 A 38 20 0 0 1 31 62 Z" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.2" />
                  {/* Shoulder enhancement */}
                  <circle cx="38" cy="52" r="4" fill="var(--amber)" />
                  <circle cx="100" cy="52" r="4" fill="var(--amber)" />
                  {/* Intraplaque hemorrhage dot */}
                  <circle cx="69" cy="48" r="5" fill="var(--red)" />
                  {/* Residual lumen */}
                  <ellipse cx="69" cy="74" rx="20" ry="18" fill="var(--ink)" />
                  <text x="69" y="112" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Eccentric Thickening</text>
                  <text x="69" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Shoulder Enh. + IPH (T1+)</text>
                  <text x="69" y="130" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Positive Remodeling</text>
                </g>

                {/* 2. PACNS Vasculitis */}
                <g transform="translate(154, 22)">
                  <rect x="0" y="0" width="138" height="136" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.2" />
                  <text x="69" y="14" fill="var(--red-deep)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">2. CNS VASCULITIS</text>
                  {/* Outer wall */}
                  <ellipse cx="69" cy="62" rx="38" ry="38" fill="none" stroke="var(--ink-mute)" strokeWidth="1.5" />
                  {/* Concentric thick wall (full ring) */}
                  <ellipse cx="69" cy="62" rx="38" ry="38" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="2" />
                  {/* Narrowed concentric lumen */}
                  <ellipse cx="69" cy="62" rx="16" ry="16" fill="var(--ink)" />
                  {/* Intense circumferential enhancement overlay */}
                  <ellipse cx="69" cy="62" rx="36" ry="36" fill="none" stroke="var(--red)" strokeWidth="3" opacity="0.6" />
                  <text x="69" y="112" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Concentric &amp; Smooth</text>
                  <text x="69" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Intense Homogeneous Enh.</text>
                  <text x="69" y="130" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">CSF Pleocytosis (85%)</text>
                </g>

                {/* 3. RCVS */}
                <g transform="translate(298, 22)">
                  <rect x="0" y="0" width="138" height="136" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.2" />
                  <text x="69" y="14" fill="var(--amber-deep)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">3. RCVS</text>
                  {/* Normal-thickness outer wall, dynamically constricted */}
                  <ellipse cx="69" cy="62" rx="26" ry="26" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
                  {/* Narrow lumen from spasm */}
                  <ellipse cx="69" cy="62" rx="18" ry="18" fill="var(--ink)" />
                  <text x="69" y="112" fill="var(--amber-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">No Wall Thickening</text>
                  <text x="69" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Non-Enhancing / Faint</text>
                  <text x="69" y="130" fill="var(--amber-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Reversible &le;12 Weeks</text>
                </g>

                {/* 4. Dissection */}
                <g transform="translate(442, 22)">
                  <rect x="0" y="0" width="138" height="136" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.2" />
                  <text x="69" y="14" fill="var(--teal-deep)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">4. DISSECTION</text>
                  {/* Expanded outer wall */}
                  <ellipse cx="69" cy="62" rx="40" ry="38" fill="none" stroke="var(--ink-mute)" strokeWidth="1.5" />
                  {/* Crescentic intramural hematoma */}
                  <path d="M 32 50 C 42 28 96 28 106 50 C 90 62 48 62 32 50 Z" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.5" />
                  {/* Intimal flap */}
                  <path d="M 32 50 C 52 64 86 64 106 50" stroke="var(--teal-deep)" strokeWidth="2" fill="none" />
                  {/* True lumen & False lumen */}
                  <ellipse cx="69" cy="74" rx="22" ry="16" fill="var(--ink)" />
                  <text x="69" y="112" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Intramural Hematoma</text>
                  <text x="69" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Double Lumen &bull; Intimal Flap</text>
                  <text x="69" y="130" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">T1 Hyperintense (Crescent)</text>
                </g>

                {/* 5. Moyamoya */}
                <g transform="translate(586, 22)">
                  <rect x="0" y="0" width="138" height="136" rx="6" fill="#ffffff" stroke="var(--slate)" strokeWidth="1.2" />
                  <text x="69" y="14" fill="var(--slate)" fontSize="6.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">5. MOYAMOYA</text>
                  {/* Shrunken outer wall (marked negative remodeling) */}
                  <ellipse cx="69" cy="62" rx="20" ry="20" fill="var(--slate-soft)" stroke="var(--slate)" strokeWidth="1.5" />
                  {/* Pinpoint lumen */}
                  <ellipse cx="69" cy="62" rx="7" ry="7" fill="var(--ink)" />
                  {/* Lenticulostriate collaterals dots */}
                  <circle cx="45" cy="40" r="2.5" fill="var(--purple)" />
                  <circle cx="93" cy="40" r="2.5" fill="var(--purple)" />
                  <circle cx="42" cy="84" r="2.5" fill="var(--purple)" />
                  <circle cx="96" cy="84" r="2.5" fill="var(--purple)" />
                  <text x="69" y="112" fill="var(--slate)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Negative Remodeling</text>
                  <text x="69" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Concentric Shrinkage</text>
                  <text x="69" y="130" fill="var(--purple-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Ivy Sign &amp; Basal Collaterals</text>
                </g>
              </svg>
            </div>

            {/* §1 Technical Principles & Sequence Optimization (purple) */}
            <CardSection color="purple" title="1. Technical Principles &amp; Pulse Sequences (3.0T Black-Blood)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>3D Isotropic Submillimeter</strong>
                  <br />&bull; 3D T1-SPACE / CUBE / VISTA at <strong>0.4–0.6 mm isotropic resolution</strong> at 3.0 Tesla.
                  <br />&bull; Multiplanar reconstruction (axial, coronal, sagittal, oblique) perpendicular to vessel long axis.
                </div>
                <div style={{ border: '1px solid var(--teal)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Black-Blood Flow Suppression</strong>
                  <br />&bull; <strong>DANTE</strong> (Delay Alternating with Nutation for Tailored Excitation) or <strong>MSDE</strong> (Motion-Sensitized Driven Equilibrium).
                  <br />&bull; Complete suppression of flowing blood and CSF signal to eliminate lumen pseudo-thickening artifacts.
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Contrast Timing &amp; T1 Pre/Post</strong>
                  <br />&bull; Pre-contrast T1 is mandatory to detect methemoglobin / intraplaque hemorrhage (IPH).
                  <br />&bull; Acquire post-contrast images with <strong>5–10 min delay</strong> to maximize wall-to-lumen contrast enhancement ratio.
                </div>
              </div>
            </CardSection>

            {/* §2 Comprehensive 5-Arteriopathy Diagnostic Matrix (teal) */}
            <CardSection color="teal" title="2. Comprehensive 5-Arteriopathy Diagnostic Matrix">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
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
                    <td><strong>Intraplaque Hemorrhage (IPH):</strong> High T1 signal on pre-contrast T1-SPACE; predicts high recurrent stroke risk (SAMMPRIS).</td>
                  </tr>
                  <tr>
                    <td><strong>PACNS (Vasculitis)</strong></td>
                    <td><strong>Concentric, circumferential, smooth</strong>, diffuse and multifocal.</td>
                    <td><strong>Intense, homogeneous, concentric</strong> enhancement; persists for months.</td>
                    <td>Minimal outward remodeling; luminal narrowing across multiple branches.</td>
                    <td><strong>CSF Biomarkers:</strong> Lymphocytic pleocytosis / elevated protein in 80–90%; responds to high-dose steroids / cyclophosphamide.</td>
                  </tr>
                  <tr>
                    <td><strong>RCVS</strong></td>
                    <td><strong>Absent or minimal</strong> uniform band (dynamic vasoconstriction).</td>
                    <td><strong>Non-enhancing</strong> or faint, diffuse, transient enhancement.</td>
                    <td>No structural remodeling (functional vasoconstriction).</td>
                    <td><strong>Reversibility:</strong> Complete normalization on follow-up MRA at 12 weeks; thunderclap headaches; <strong>steroids are harmful</strong>.</td>
                  </tr>
                  <tr>
                    <td><strong>Dissection</strong></td>
                    <td><strong>Eccentric, crescentic</strong> wall thickening (intramural hematoma).</td>
                    <td>Enhancement of <strong>intimal flap and adventitia</strong>; delayed outer wall enhancement.</td>
                    <td>Vessel enlargement, dissecting pseudoaneurysm, or string sign.</td>
                    <td><strong>Double lumen &amp; Intimal Flap:</strong> High T1 signal crescent (methemoglobin); DAPT first-line; avoid anticoagulation if intracranial.</td>
                  </tr>
                  <tr>
                    <td><strong>Moyamoya</strong></td>
                    <td><strong>Concentric wall thickening with marked shrinkage</strong> of outer vessel diameter.</td>
                    <td><strong>Minimal or no enhancement</strong> (fibrocellular intimal thickening without active inflammation).</td>
                    <td><strong>Marked negative remodeling</strong> (constrictive shrinkage of terminal ICA/MCA).</td>
                    <td><strong>Ivy Sign on FLAIR:</strong> Slow leptomeningeal collateral flow; basal lenticulostriate "puff of smoke" network; STA-MCA bypass.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Critical Diagnostic Decision Pathways & Pitfalls (red) */}
            <CardSection color="red" title="3. Critical Diagnostic Decision Pathways &amp; Management">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>PACNS vs RCVS Differentiation</strong>
                  <br />&bull; <strong>PACNS:</strong> Intense concentric enhancement + abnormal CSF &rarr; Prompt brain/leptomeningeal biopsy; high-dose IV methylprednisolone + Cyclophosphamide/Rituximab.
                  <br />&bull; <strong>RCVS:</strong> Non-enhancing on VW-MRI + RCVS&sup2; score &ge;5 &rarr; CCBs (Nimodipine/Verapamil); <strong>STEROIDS CAUSE STROKE EXPANSION</strong>.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--red)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Dissection: Extracranial vs Intracranial</strong>
                  <br />&bull; <strong>Extracranial:</strong> DAPT (Aspirin + Clopidogrel) for 3–6 months (CADISS / TREAT-CAD / STOP-CAD: equal to anticoagulation).
                  <br />&bull; <strong>Intracranial:</strong> STRICTLY AVOID anticoagulation due to subarachnoid hemorrhage (SAH) risk from adventitial rupture.
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
                  <br />&bull; Order: "3.0T High-Resolution Vessel Wall MRI Brain with/without Gadolinium (3D Black-Blood T1-SPACE Pre- and Post-Contrast)".
                  <br />&bull; 1.5T MRI scanners have insufficient spatial resolution for intracranial vessel wall characterization.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Fellow / Differential Focus</strong>
                  <br />&bull; Look for the "Plaque Shoulder Sign" in ICAD: Enhancement is asymmetric and localized to the fibrous cap adjacent to the lumen.
                  <br />&bull; Vasculitis enhancement typically affects &gt;2 distinct vascular beds (e.g. bilateral MCAs and basilar).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Attending / Advanced Physics</strong>
                  <br />&bull; Outer diameter measurement is key: Moyamoya exhibits outer wall shrinkage, whereas ICAD and PACNS maintain normal or enlarged outer diameter.
                  <br />&bull; High T1 plaque signal (IPH) represents methemoglobin from neovascular intraplaque leakiness.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'ASNR VW-MRI Consensus', cite: 'Mandell DM et al. AJNR Am J Neuroradiol. 2017;38(2):218-229.', pmid: '27469212' },
              { label: 'Arteriopathy Characteristics', cite: 'Mossa-Basha M et al. Neuroimaging Clin N Am. 2021;31(2):175-188.', pmid: '33902876' },
              { label: 'High-Res Diagnostic Patterns', cite: 'Obusez EC et al. AJNR Am J Neuroradiol. 2014;35(8):1527-1532.', pmid: '24722305' },
              { label: 'PACNS vs RCVS Differentiation', cite: 'Lehman VT et al. Semin Ultrasound CT MR. 2021;42(5):407-420.', pmid: '34537115' },
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
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Cryptogenic Stroke ESUS Diagnostic Workup and Cardiac Monitoring Yield Timeline" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A: ESUS Concept & Multi-Territory Infarcts */}
                <text x="110" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ESUS / EMBOLIC PHENOTYPE</text>
                <ellipse cx="110" cy="80" rx="80" ry="48" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.3" />
                {/* Cortical & Subcortical non-lacunar infarcts */}
                <path d="M 60 62 C 68 52 82 56 80 70 C 70 76 56 72 60 62 Z" fill="var(--purple)" opacity="0.85" />
                <path d="M 135 60 C 150 50 162 65 152 78 C 140 80 130 72 135 60 Z" fill="var(--purple)" opacity="0.85" />
                <circle cx="110" cy="98" r="8" fill="var(--purple)" opacity="0.85" />
                <text x="110" y="142" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Non-Lacunar / Multi-Territory Embolic Infarctions</text>
                <text x="110" y="152" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">No &ge;50% stenosis &bull; No major source &bull; No AF on initial ECG</text>

                <line x1="228" y1="12" x2="228" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B: Empirical DOAC Trials (NAVIGATE, RE-SPECT, ARCADIA) */}
                <text x="358" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">EMPIRICAL DOAC RCTs: NO BENEFIT vs ASA</text>
                <rect x="240" y="24" width="236" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                
                {/* NAVIGATE ESUS */}
                <rect x="248" y="32" width="220" height="34" rx="4" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
                <text x="256" y="44" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">NAVIGATE ESUS (NEJM 2018, n=7213)</text>
                <text x="256" y="54" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Rivaroxaban vs ASA: Recurrent stroke 5.1% vs 4.8% (HR 1.07, p=0.52)</text>
                <text x="256" y="62" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">Major Bleeding: HR 2.72 (p&lt;0.001) &bull; Stopped Early for Harm</text>

                {/* RE-SPECT ESUS */}
                <rect x="248" y="70" width="220" height="34" rx="4" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
                <text x="256" y="82" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">RE-SPECT ESUS (NEJM 2019, n=5390)</text>
                <text x="256" y="92" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Dabigatran vs ASA: Recurrent stroke 4.1% vs 4.8% (HR 0.85, p=0.10)</text>
                <text x="256" y="100" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Major Bleeding: 1.7% vs 1.4% (Neutral, no overall benefit)</text>

                {/* ARCADIA */}
                <rect x="248" y="108" width="220" height="36" rx="4" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
                <text x="256" y="120" fill="var(--purple-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">ARCADIA (JAMA 2024, n=1015) &bull; Atrial Cardiopathy</text>
                <text x="256" y="130" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Apixaban vs ASA in PTFV1 / NT-proBNP / LA index: HR 1.00 (p=0.99)</text>
                <text x="256" y="138" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">Empirical DOAC for Atrial Cardiopathy without AF is NOT indicated</text>

                <line x1="490" y1="12" x2="490" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel C: Cardiac Monitoring Detection Yield Timeline */}
                <text x="612" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CARDIAC MONITORING YIELD (ICM)</text>
                <rect x="502" y="24" width="222" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                <text x="613" y="38" fill="var(--teal-deep)" fontSize="5.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CRYSTAL AF &amp; STROKE-AF DETECTION</text>

                {/* Bars for 6m, 12m, 36m */}
                <rect x="514" y="48" width="30" height="54" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
                <text x="529" y="80" fill="var(--teal-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">8.9%</text>
                <text x="529" y="112" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">6 Mo</text>

                <rect x="556" y="48" width="45" height="54" rx="3" fill="var(--teal)" />
                <text x="578" y="80" fill="#ffffff" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">12.4%</text>
                <text x="578" y="112" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">12 Mo</text>

                <rect x="613" y="48" width="98" height="54" rx="3" fill="var(--purple-deep)" />
                <text x="662" y="78" fill="#ffffff" fontSize="7.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">30.0% AF</text>
                <text x="662" y="90" fill="var(--purple-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">vs 3.0% Control (p&lt;0.001)</text>
                <text x="662" y="112" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="middle">36 Mo (NNT=4)</text>

                <text x="613" y="128" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STROKE-AF: 12.1% at 12m &bull; 21.7% at 36m in LVD/SVD</text>
                <text x="613" y="138" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Continuous ICM monitoring detects occult AF &rarr; shifts to DOAC</text>
              </svg>
            </div>

            {/* §1 ESUS Construct & Diagnostic Requirements (purple) */}
            <CardSection color="purple" title="1. ESUS Construct &amp; Diagnostic Requirements (Hart 2014)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Diagnostic Criteria (Hart 2014)</strong>
                  <br />&bull; <strong>Non-lacunar infarct</strong> on CT/MRI (subcortical &gt;1.5 cm or cortical infarct).
                  <br />&bull; <strong>No &ge;50% luminal stenosis</strong> in extracranial/intracranial upstream arteries.
                  <br />&bull; <strong>No major cardioembolic source</strong> (AF, LV thrombus, mechanical valve, EF &lt;30%, acute MI &lt;4 weeks, vegetation).
                  <br />&bull; <strong>No other specific cause</strong> (dissection, vasculitis, vasospasm, hypercoagulability).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Standard Diagnostic Workup Bundle</strong>
                  <br />&bull; Brain CT or MRI confirming non-lacunar stroke.
                  <br />&bull; CTA / MRA / Duplex of cervical and intracranial arteries.
                  <br />&bull; 12-lead ECG + continuous inpatient telemetry &ge;24–48 hours.
                  <br />&bull; Transthoracic echocardiogram (TTE) with agitated saline bubble study.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--purple)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Paradigm Shift in ESUS</strong>
                  <br />&bull; ESUS is a <strong>heterogeneous clinical construct</strong>, NOT a single disease entity.
                  <br />&bull; Etiologies include: occult paroxysmal AF (30%), non-stenotic vulnerable plaque (30%), PFO (20%), subclinical cardiopathy, and occult malignancy.
                </div>
              </div>
            </CardSection>

            {/* §2 Empirical DOAC Failure & Atrial Cardiopathy Trials (teal) */}
            <CardSection color="teal" title="2. Landmark Empirical DOAC &amp; Atrial Cardiopathy Trials">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
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
                    <td>ESUS &ge;50 yo<br /><strong>Rivaroxaban 15 mg daily vs Aspirin 100 mg daily</strong></td>
                    <td>Recurrent stroke: <strong>5.1%/yr vs 4.8%/yr</strong> (HR 1.07, 95% CI 0.87–1.33, p=0.52).</td>
                    <td><strong>Major Bleeding: 1.8%/yr vs 0.7%/yr (HR 2.72, p&lt;0.001).</strong> Trial stopped early for futility and excess bleeding harm. DOACs not indicated for empiric ESUS.</td>
                  </tr>
                  <tr>
                    <td><strong>RE-SPECT ESUS</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2019 &bull; n=5390</span></td>
                    <td>ESUS &ge;60 yo (or &ge;18 with risk factor)<br /><strong>Dabigatran 150/110 mg BID vs Aspirin 100 mg</strong></td>
                    <td>Recurrent stroke: <strong>4.1%/yr vs 4.8%/yr</strong> (HR 0.85, 95% CI 0.69–1.03, p=0.10).</td>
                    <td>Major bleeding similar (1.7%/yr vs 1.4%/yr). Trend toward benefit only in exploratory subgroup &gt;75 yo (HR 0.63). Did not meet superiority.</td>
                  </tr>
                  <tr>
                    <td><strong>ARCADIA</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>JAMA 2024 &bull; n=1015</span></td>
                    <td>Cryptogenic stroke with <strong>Atrial Cardiopathy</strong> (PTFV1 &gt;5000 &mu;V&middot;ms, NT-proBNP &gt;250, or LA index &ge;3.0)<br /><strong>Apixaban 5 mg BID vs Aspirin 81 mg</strong></td>
                    <td>Recurrent stroke: <strong>4.4%/yr vs 4.4%/yr</strong> (HR 1.00, 95% CI 0.64–1.55, p=0.99).</td>
                    <td>sICH: 1.1% vs 0.7%. <strong>Biomarker-defined atrial cardiopathy DOES NOT justify anticoagulation</strong> without documented rhythm proof of atrial fibrillation.</td>
                  </tr>
                </tbody>
              </table>
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
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>STROKE-AF (JAMA 2021)</strong>
                  <br />&bull; ICM in stroke attributed to large-artery atherosclerosis or small vessel disease (n=492).
                  <br />&bull; <strong>AF Detection:</strong> 12.1% vs 1.8% at 12m (HR 7.4); <strong>21.7% vs 2.4% at 36m (HR 10.0, p&lt;0.001)</strong>.
                  <br />&bull; Proves that occult AF is prevalent even in strokes with apparent LVD/SVD mechanisms.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Clinical Monitoring Strategy</strong>
                  <br />&bull; <strong>Step 1:</strong> Inpatient continuous telemetry &ge;24–48h.
                  <br />&bull; <strong>Step 2:</strong> 14–30 day external adhesive cardiac patch monitor (EMBRACE trial: 16.1% AF yield at 30 days).
                  <br />&bull; <strong>Step 3:</strong> Subcutaneous ICM implantation for cryptogenic stroke, high HAVOC score, or enlarged left atrium.
                </div>
              </div>
            </CardSection>

            {/* §4 Stepwise Diagnostic Pathway & Bedside Pearls (slate) */}
            <CardSection color="slate" title="4. Stepwise Cryptogenic Diagnostic &amp; Management Pathway">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Tier 1: Inpatient Baseline</strong>
                  <br />&bull; CTA/MRA head &amp; neck + Brain MRI DWI.
                  <br />&bull; TTE with agitated saline bubble study.
                  <br />&bull; Telemetry &ge;24–48h; HbA1c, fasting lipids, troponin, CBC/coags.
                  <br />&bull; Start Aspirin 81 mg + High-intensity statin.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Tier 2: Outpatient Escalation</strong>
                  <br />&bull; <strong>TEE:</strong> Complex aortic arch atheroma (&ge;4 mm or ulcerated), LAA thrombus, PFO with ASA.
                  <br />&bull; <strong>Cardiac Monitoring:</strong> 30-day patch or insertable cardiac monitor (ICM).
                  <br />&bull; Calculate RoPE score if PFO present.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Tier 3: Specialized Investigation</strong>
                  <br />&bull; <strong>VW-MRI at 3.0T:</strong> Non-stenotic culprit plaque / intraplaque hemorrhage (IPH).
                  <br />&bull; <strong>Hypercoagulable / Malignancy:</strong> Antiphospholipid antibodies (repeat @ 12w), D-dimer, CT CAP.
                  <br />&bull; Genetic testing (CADASIL, Fabry, Col4A1).
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
// MODULE — PFO Closure & LAAO Decision Pathways
// =====================================================================
const PfoClosureView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <PfoClosureCard />
  </ScaledCardWrapper>
);

export function PfoClosureCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-pfo-closure">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>PFO Closure &amp; LAAO Decision Pathways</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              CLOSE &bull; REDUCE &bull; RESPECT &bull; DEFENSE-PFO &bull; RoPE Score &bull; PASCAL Classification &bull; LAAO Trials
            </p>

            {/* Hero SVG: Interatrial Septum Anatomy, PASCAL Matrix & Landmark Trials */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Patent Foramen Ovale PFO Anatomy PASCAL Classification and Landmark Trial Outcomes" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A: Interatrial Septum & High-Risk Anatomy */}
                <text x="120" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PFO &amp; ATRIAL SEPTAL ANEURYSM</text>
                <rect x="10" y="24" width="220" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                {/* Atrial septum with PFO flap and ASA excursion */}
                <path d="M 120 32 L 120 62 C 145 74 145 92 120 104 L 120 140" stroke="var(--purple)" strokeWidth="2.5" fill="none" />
                <path d="M 112 56 L 112 86" stroke="var(--purple-deep)" strokeWidth="2" strokeDasharray="2 2" fill="none" />
                {/* Microbubbles crossing right-to-left */}
                {[[60, 68], [75, 78], [90, 72], [105, 80], [130, 82], [150, 74], [165, 86], [180, 78]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3" fill="var(--teal)" />
                ))}
                <text x="50" y="52" fill="var(--ink-soft)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">Right Atrium</text>
                <text x="160" y="52" fill="var(--ink-soft)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">Left Atrium</text>
                <text x="120" y="120" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Atrial Septal Aneurysm (ASA &ge;10 mm)</text>
                <text x="120" y="132" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Large Shunt (&gt;20 microbubbles on TEE)</text>

                <line x1="240" y1="12" x2="240" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B: PASCAL Decision Matrix */}
                <text x="366" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PASCAL CAUSALITY CLASSIFICATION</text>
                <rect x="250" y="24" width="232" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                
                <rect x="258" y="32" width="216" height="34" rx="4" fill="var(--slate-soft)" stroke="var(--slate)" strokeWidth="1" />
                <text x="266" y="44" fill="var(--slate)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">UNLIKELY CAUSALITY</text>
                <text x="266" y="54" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Low RoPE (&lt;7) + No High-Risk Anatomy</text>
                <text x="266" y="62" fill="var(--slate)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">&rarr; Medical Therapy Alone (Antiplatelet)</text>

                <rect x="258" y="70" width="216" height="34" rx="4" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
                <text x="266" y="82" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">POSSIBLE CAUSALITY</text>
                <text x="266" y="92" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">Low RoPE + High-Risk Anatomy OR High RoPE + No High-Risk</text>
                <text x="266" y="100" fill="var(--amber-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">&rarr; Shared Decision Making for PFO Closure</text>

                <rect x="258" y="108" width="216" height="36" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.2" />
                <text x="266" y="120" fill="var(--teal-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">PROBABLE CAUSALITY (Highest Benefit)</text>
                <text x="266" y="130" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">High RoPE (&ge;7) + High-Risk Anatomy (ASA or Large Shunt)</text>
                <text x="266" y="138" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">&rarr; PFO Closure Strongly Recommended (Class I, LOE A)</text>

                <line x1="492" y1="12" x2="492" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel C: Landmark Trial Forest Plot */}
                <text x="612" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LANDMARK RCT RISK REDUCTIONS</text>
                <rect x="502" y="24" width="222" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                
                {/* CLOSE */}
                <text x="510" y="40" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">CLOSE (2017)</text>
                <line x1="565" y1="38" x2="680" y2="38" stroke="var(--rule-soft)" strokeWidth="1" />
                <circle cx="572" cy="38" r="4" fill="var(--teal)" />
                <text x="686" y="40" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700">HR 0.03 (p&lt;0.001)</text>

                {/* REDUCE */}
                <text x="510" y="62" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">REDUCE (2017)</text>
                <line x1="565" y1="60" x2="680" y2="60" stroke="var(--rule-soft)" strokeWidth="1" />
                <circle cx="588" cy="60" r="4" fill="var(--teal)" />
                <text x="686" y="62" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700">HR 0.23 (p=0.002)</text>

                {/* RESPECT */}
                <text x="510" y="84" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">RESPECT (2017)</text>
                <line x1="565" y1="82" x2="680" y2="82" stroke="var(--rule-soft)" strokeWidth="1" />
                <circle cx="618" cy="82" r="4" fill="var(--teal)" />
                <text x="686" y="84" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700">HR 0.55 (p=0.046)</text>

                {/* DEFENSE-PFO */}
                <text x="510" y="106" fill="var(--ink-soft)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">DEFENSE (2018)</text>
                <line x1="565" y1="104" x2="680" y2="104" stroke="var(--rule-soft)" strokeWidth="1" />
                <circle cx="568" cy="104" r="4" fill="var(--teal)" />
                <text x="686" y="106" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="IBM Plex Sans" fontWeight="700">0% vs 12.9% (p=0.013)</text>

                {/* LAAO note */}
                <rect x="510" y="120" width="206" height="24" rx="3" fill="var(--purple-soft)" />
                <text x="613" y="132" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">LAAO: PROTECT AF / PREVAIL / PRAGUE-17</text>
                <text x="613" y="140" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">Non-inferior to DOACs in NVAF + anticoagulation contraindications</text>
              </svg>
            </div>

            {/* §1 High-Risk Anatomical Features & Diagnostic Criteria (purple) */}
            <CardSection color="purple" title="1. High-Risk Anatomical Features &amp; Diagnostic Criteria">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Atrial Septal Aneurysm (ASA)</strong>
                  <br />&bull; <strong>Definition:</strong> Excursion of fossa ovalis septum <strong>&ge;10 mm</strong> into right or left atrium, or total bidirectional excursion &ge;15 mm.
                  <br />&bull; Present in ~20–35% of cryptogenic stroke PFOs; confers 4- to 5-fold higher recurrence risk.
                </div>
                <div style={{ border: '1px solid var(--teal)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Large Right-to-Left Shunt</strong>
                  <br />&bull; <strong>Bubble Study (TEE/TTE):</strong> &gt;20–30 microbubbles in left atrium within 3–5 cardiac cycles after IV agitated saline injection at rest or release of Valsalva.
                  <br />&bull; Transcranial Doppler (TCD) bubble test with &gt;20 microembolic signals ("curtain pattern").
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Ancillary Anatomical High-Risk Signs</strong>
                  <br />&bull; <strong>Prominent Eustachian Valve / Chiari Network:</strong> Directs IVC desaturated blood flow straight toward the interatrial septum.
                  <br />&bull; <strong>Hypermobile Septum &amp; Wide PFO Tunnel:</strong> Separation &ge;2 mm; long tunnel length &ge;10 mm.
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark PFO Closure RCT Matrix (teal) */}
            <CardSection color="teal" title="2. Landmark PFO Closure RCT Matrix">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '95px' }}>Trial</th>
                    <th style={{ width: '135px' }}>Inclusion &amp; Regimen</th>
                    <th style={{ width: '135px' }}>Primary Ischemic Stroke Outcome</th>
                    <th>Safety, AF Risk &amp; Key Caveat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>CLOSE</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2017 &bull; n=663</span></td>
                    <td>16–60 yo with cryptogenic stroke + <strong>PFO with ASA or large shunt</strong>.<br />Closure vs Antiplatelet vs Anticoagulation.</td>
                    <td>Recurrent stroke: <strong>0% (Closure) vs 6.0% (Antiplatelet)</strong> (HR 0.03, 95% CI 0.00–0.26, p&lt;0.001; NNT=17 at 5y).</td>
                    <td>New AFib in <strong>4.6%</strong> of closure patients (mostly within 1 month). Oral anticoagulation reduced stroke vs antiplatelets (1.6% vs 6.0%, p=0.05).</td>
                  </tr>
                  <tr>
                    <td><strong>REDUCE</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2017 &bull; n=664</span></td>
                    <td>18–59 yo with cryptogenic stroke + PFO.<br /><strong>Closure + Antiplatelet vs Antiplatelet alone</strong> (median 3.2y).</td>
                    <td>Ischemic stroke: <strong>1.4% vs 5.4%</strong> (HR 0.23, 95% CI 0.09–0.62, p=0.002; RRR 77%).</td>
                    <td>New AFib in <strong>6.6%</strong> vs 0.4% (p&lt;0.001). Device-related adverse events &lt;1.5%. Significant reduction in silent brain infarcts on MRI.</td>
                  </tr>
                  <tr>
                    <td><strong>RESPECT</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>NEJM 2017 &bull; n=980</span></td>
                    <td>18–60 yo with cryptogenic stroke + PFO.<br /><strong>Amplatzer Closure vs Medical therapy</strong> (extended median 5.9y follow-up).</td>
                    <td>Ischemic stroke: <strong>0.58 vs 1.07 per 100 pt-yrs</strong> (HR 0.55, 95% CI 0.31–0.99, p=0.046).</td>
                    <td>In patients with ASA or large shunt: <strong>HR 0.25 (p=0.007)</strong>. No increase in non-fatal major bleeding.</td>
                  </tr>
                  <tr>
                    <td><strong>DEFENSE-PFO</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>JACC 2018 &bull; n=120</span></td>
                    <td>High-risk PFO (ASA, hypermobility, or size &ge;2mm).<br /><strong>Closure vs Medical therapy</strong> (2-year follow-up).</td>
                    <td>Composite stroke/TIA/vascular death: <strong>0% vs 12.9%</strong> (p=0.013; log-rank p=0.023).</td>
                    <td>Transient periprocedural AF in 3.3%. Proved dramatic benefit of closure in anatomically enriched high-risk PFOs.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 RoPE Score & PASCAL Causality Classification (amber) */}
            <CardSection color="amber" title="3. RoPE Score &amp; PASCAL Causality Classification">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', fontSize: '7.2pt', lineHeight: '1.36', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>RoPE Score Calculation (0 to 10 Points)</strong>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6.8pt', marginTop: '3px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--rule-soft)' }}><td><strong>Age:</strong> 18–29 (5 pts) &bull; 30–39 (4) &bull; 40–49 (3) &bull; 50–59 (2) &bull; 60–69 (1) &bull; &ge;70 (0)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>0–5 pts</td></tr>
                      <tr style={{ borderBottom: '1px solid var(--rule-soft)' }}><td>No history of Hypertension (1 pt) &bull; No history of Diabetes (1 pt)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>0–2 pts</td></tr>
                      <tr style={{ borderBottom: '1px solid var(--rule-soft)' }}><td>No prior Stroke or TIA (1 pt) &bull; Non-smoker (1 pt)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>0–2 pts</td></tr>
                      <tr><td>Cortical infarct on neuroimaging (1 pt)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>1 pt</td></tr>
                    </tbody>
                  </table>
                  <div style={{ fontSize: '6.8pt', marginTop: '3px', color: 'var(--ink-mute)' }}>
                    Score &ge;7 indicates stroke is highly likely PFO-attributable (attributable fraction &gt;70%) and low recurrence on medical therapy.
                  </div>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>PASCAL Decision Algorithm</strong>
                  <br />&bull; <strong>Probable PFO Causality:</strong> High RoPE (&ge;7) + High-Risk Anatomy (ASA or large shunt) &rarr; <strong>PFO Closure strongly recommended (Class I, LOE A)</strong>.
                  <br />&bull; <strong>Possible PFO Causality:</strong> High RoPE + No High-Risk Anatomy OR Low RoPE + High-Risk Anatomy &rarr; Shared decision making (Class IIa).
                  <br />&bull; <strong>Unlikely PFO Causality:</strong> Low RoPE (&lt;7) + No High-Risk Anatomy &rarr; Medical antiplatelet therapy (Class IIb/III).
                </div>
              </div>
            </CardSection>

            {/* §4 Post-Closure Care & Left Atrial Appendage Occlusion (LAAO) (slate) */}
            <CardSection color="slate" title="4. Post-Closure Management &amp; Left Atrial Appendage Occlusion (LAAO)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Post-Closure Antithrombotics</strong>
                  <br />&bull; <strong>DAPT:</strong> Aspirin 81 mg + Clopidogrel 75 mg daily for <strong>1–6 months</strong> post-implantation to allow complete endothelialization.
                  <br />&bull; Single antiplatelet (Aspirin) continued for &ge;1–5 years.
                  <br />&bull; SBE antibiotic prophylaxis for dental procedures x 6 months.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Post-Procedure Surveillance</strong>
                  <br />&bull; Follow-up TTE at 1–6 months to confirm device stability, absence of thrombus, and complete shunt closure.
                  <br />&bull; <strong>Post-Closure AF:</strong> 4–6% risk, predominantly transient within 30–45 days; treat with short-term anticoagulation.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.5pt' }}>LAAO in NVAF (PROTECT AF / PRAGUE-17)</strong>
                  <br />&bull; <strong>Indication:</strong> NVAF + CHA&sup2;DS&sup2;-VASc &ge;2–3 + <strong>contraindication to long-term oral anticoagulation</strong> (prior severe ICH, recurrent GI bleed).
                  <br />&bull; <strong>PRAGUE-17 (JACC 2020):</strong> LAAO non-inferior to DOACs for stroke, bleeding, and CV death (HR 0.84, p=0.004).
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'RESPECT Long-Term', cite: 'Saver JL et al. N Engl J Med. 2017;377(11):1022-1032.', pmid: '28902590' },
              { label: 'CLOSE Trial', cite: 'Mas JL et al. N Engl J Med. 2017;377(11):1011-1021.', pmid: '28902593' },
              { label: 'REDUCE Trial', cite: 'Søndergaard L et al. N Engl J Med. 2017;377(11):1033-1042.', pmid: '28902580' },
              { label: 'DEFENSE-PFO Trial', cite: 'Lee JY et al. J Am Coll Cardiol. 2018;71(20):2335-2342.', pmid: '29544871' },
              { label: 'RoPE Score Study', cite: 'Kent DM et al. Neurology. 2013;81(7):619-625.', pmid: '23864310' },
              { label: 'PASCAL Consensus', cite: 'Kent DM et al. JAMA. 2021;326(22):2277-2286.', pmid: '34905030' },
              { label: 'PROTECT AF Trial', cite: 'Holmes DR et al. Lancet. 2009;374(9689):534-542.', pmid: '19683639' },
              { label: 'PRAGUE-17 Trial', cite: 'Osmancik P et al. J Am Coll Cardiol. 2020;75(25):3122-3135.', pmid: '32586585' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MODULE — Cerebral Amyloid Angiopathy (CAA) Boston Criteria v2.0
// =====================================================================
const CerebralAmyloidAngiopathyView = () => (
  <ScaledCardWrapper isLandscape={false}>
    <BedsidePocketCardsStyles />
    <CerebralAmyloidAngiopathyCard />
  </ScaledCardWrapper>
);

export function CerebralAmyloidAngiopathyCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cerebral-amyloid-angiopathy">
        <div className="card-container" style={{ boxSizing: 'border-box', height: '1275px' }}>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18pt' }}>Cerebral Amyloid Angiopathy (CAA) Boston Criteria v2.0</h1>
            <p style={{ fontSize: '8.4pt', color: 'var(--ink-soft)', marginBottom: '8px', textAlign: 'center', fontWeight: '500' }}>
              Boston Criteria v2.0 &bull; Cortical Superficial Siderosis (cSS) &bull; Amyloid Spells (TFNE) &bull; Anticoagulation Dilemmas (PRESTIGE-AF &amp; SoSTART)
            </p>

            {/* Hero SVG: Lobar vs Deep, SWI Biomarkers & Amyloid Spells Wave */}
            <div style={{ width: '100%', background: 'var(--fill-soft)', borderRadius: '8px', border: '1.5px solid var(--rule-soft)', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '8px', padding: '6px' }}>
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Cerebral Amyloid Angiopathy Boston Criteria 2.0 and Neuroimaging Signatures" style={{ width: '100%', height: 'auto' }}>
                {/* Panel A: Lobar vs Deep Hemorrhage Pattern */}
                <text x="110" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HEMORRHAGE TOPOGRAPHY</text>
                {/* CAA lobar */}
                <ellipse cx="60" cy="80" rx="44" ry="32" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.2" />
                <path d="M 80 62 C 94 66 94 82 82 88 C 72 84 70 70 80 62 Z" fill="var(--red)" opacity="0.85" />
                <text x="60" y="126" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CAA: Lobar ICH</text>
                <text x="60" y="136" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Cortico-subcortical</text>
                {/* Hypertensive deep */}
                <ellipse cx="160" cy="80" rx="44" ry="32" fill="#ffffff" stroke="var(--rule)" strokeWidth="1.2" />
                <ellipse cx="168" cy="80" rx="10" ry="8" fill="var(--slate)" opacity="0.85" />
                <text x="160" y="126" fill="var(--slate)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Hypertensive ICH</text>
                <text x="160" y="136" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Deep Basal Ganglia</text>

                <line x1="220" y1="12" x2="220" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel B: SWI / GRE Biomarkers */}
                <text x="350" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">BOSTON 2.0 MRI BIOMARKERS</text>
                <ellipse cx="350" cy="80" rx="95" ry="50" fill="var(--ink)" stroke="var(--ink-mute)" strokeWidth="1.2" />
                {/* strictly lobar microbleeds (peripheral black dots) */}
                {[[280, 56], [320, 42], [380, 44], [420, 58], [270, 84], [430, 86], [290, 108], [340, 118], [410, 108]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3.2" fill="#000000" stroke="#4a4a4a" strokeWidth="0.8" />
                ))}
                {/* Cortical superficial siderosis (dark curvilinear gyral rim) */}
                <path d="M 290 64 C 310 46 360 40 400 48" stroke="#000000" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.9" />
                {/* Centrum semiovale PVS / multispot white matter dots */}
                <circle cx="340" cy="74" r="2" fill="#ffffff" opacity="0.8" />
                <circle cx="360" cy="74" r="2" fill="#ffffff" opacity="0.8" />
                <circle cx="350" cy="88" r="2" fill="#ffffff" opacity="0.8" />
                <text x="350" y="142" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Strictly Lobar CMBs &bull; Cortical Superficial Siderosis (cSS)</text>
                <text x="350" y="152" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">White Matter Features: Centrum Semiovale PVS &gt;20 &bull; Multispot WMH</text>

                <line x1="470" y1="12" x2="470" y2="156" stroke="var(--rule-soft)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Panel C: Amyloid Spells / TFNE Spreading Wave */}
                <text x="602" y="13" fill="var(--ink-soft)" fontSize="6.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">AMYLOID SPELLS (TFNE) vs TIA</text>
                <rect x="482" y="24" width="242" height="126" rx="6" fill="#ffffff" stroke="var(--rule-soft)" strokeWidth="1.2" />
                
                <rect x="490" y="32" width="226" height="42" rx="4" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
                <text x="498" y="44" fill="var(--amber-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">Amyloid Spells / TFNE (Charidimou 2012)</text>
                <text x="498" y="54" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">&bull; Recurrent, brief (10–30 min), <strong>smooth spreading march</strong> paresthesias.</text>
                <text x="498" y="64" fill="var(--amber-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">&bull; Mechanism: cSS / cSAH &rarr; Cortical Spreading Depolarization (CSD).</text>

                <rect x="490" y="78" width="226" height="64" rx="4" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1.2" />
                <text x="498" y="90" fill="var(--red-deep)" fontSize="5.6pt" fontFamily="Outfit" fontWeight="800" textAnchor="start">CRITICAL PITFALL: MISDIAGNOSIS AS TIA</text>
                <text x="498" y="100" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans" textAnchor="start">&bull; Starting DAPT / Anticoagulants causes <strong>fatal lobar hemorrhage</strong>!</text>
                <text x="498" y="110" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="start">&bull; Treat with Levetiracetam (250–500 mg BID); avoid antithrombotics.</text>
                <text x="498" y="122" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="start">&bull; Disseminated cSS confers ~12–15%/yr future lobar ICH risk.</text>
              </svg>
            </div>

            {/* §1 Boston Criteria v2.0 Diagnostic Framework (purple) */}
            <CardSection color="purple" title="1. Boston Criteria v2.0 Diagnostic Framework (Charidimou 2022)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1px solid var(--purple)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Definite &amp; Probable with Pathology</strong>
                  <br />&bull; <strong>Definite CAA:</strong> Full post-mortem examination demonstrating severe CAA with vasculopathy and absence of other diagnostic lesions.
                  <br />&bull; <strong>Probable CAA with Pathology:</strong> Clinical data and vascular tissue (evacuated hematoma / cortical biopsy) showing severe CAA with vasculopathy.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '4px 7px', background: 'var(--teal-soft)' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Probable CAA by MRI (Age &ge;50 yo with ICH, TFNE, or Dementia)</strong>
                  <br />&bull; <strong>&ge;2 Strictly Lobar Hemorrhagic Lesions</strong> (lobar ICH, strictly lobar CMBs, or cSS), <strong>OR</strong>
                  <br />&bull; <strong>1 Strictly Lobar Hemorrhagic Lesion PLUS 1 White Matter Feature:</strong>
                  <br />&nbsp;&nbsp;&ndash; <strong>Severe Centrum Semiovale PVS</strong> (&gt;20 visible perivascular spaces in one CSO hemisphere), <strong>OR</strong>
                  <br />&nbsp;&nbsp;&ndash; <strong>Multispot WMH Pattern</strong> (&ge;10 distinct subcortical hyperintensity spots on FLAIR).
                  <br />&bull; <strong>Complete absence of deep hemorrhagic lesions</strong> (basal ganglia, thalamus, brainstem).
                  <br />&bull; Diagnostic Accuracy: <strong>Sensitivity 74.5%, Specificity 95.0%</strong>.
                </div>
                <div style={{ border: '1px solid var(--amber)', borderRadius: '5px', padding: '4px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Possible CAA by MRI</strong>
                  <br />&bull; <strong>1 strictly lobar hemorrhagic lesion</strong> (lobar ICH, CMB, or cSS), <strong>OR</strong>
                  <br />&bull; <strong>1 white matter feature</strong> (severe CSO-PVS or multispot WMH) in the absence of deep hemorrhagic lesions.
                </div>
              </div>
            </CardSection>

            {/* §2 Cortical Superficial Siderosis (cSS) & Hemorrhagic Risk (teal) */}
            <CardSection color="teal" title="2. Cortical Superficial Siderosis (cSS) &amp; Recurrent Hemorrhage Risk">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.2pt', lineHeight: '1.36', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>cSS Neuroimaging Appearance</strong>
                  <br />&bull; Curvilinear, gyral T2*/SWI hypointensity following the cerebral cortex and subarachnoid space (Linn 2010).
                  <br />&bull; Represents chronic hemosiderin breakdown products from prior convexal subarachnoid hemorrhage (cSAH) from brittle cortical amyloid vessels.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Focal vs Disseminated Siderosis</strong>
                  <br />&bull; <strong>Focal cSS:</strong> Restricted to <strong>&le;3 sulci</strong>.
                  <br />&bull; <strong>Disseminated cSS:</strong> Involving <strong>&ge;4 sulci</strong>.
                  <br />&bull; Disseminated cSS is the single most potent imaging predictor of future macro-ICH.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--teal)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Lobar ICH Recurrence Rates</strong>
                  <br />&bull; Baseline without cSS: ~2–3% per year.
                  <br />&bull; Focal cSS: ~5–7% per year.
                  <br />&bull; <strong>Disseminated cSS: ~12–15% per year</strong> recurrent lobar hemorrhage risk.
                </div>
              </div>
            </CardSection>

            {/* §3 Amyloid Spells (TFNE) vs TIA & Anticoagulation Dilemma (red) */}
            <CardSection color="red" title="3. Amyloid Spells (TFNE) vs TIA &amp; Anticoagulation Trade-offs">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.6pt' }}>
                <thead>
                  <tr style={{ background: 'var(--red)' }}>
                    <th style={{ width: '110px' }}>Clinical Scenario</th>
                    <th style={{ width: '180px' }}>Pathophysiology &amp; Diagnostic Contrast</th>
                    <th>Evidence-Based Management &amp; Hard Pitfall</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Amyloid Spells (TFNE) vs Ischemic TIA</strong></td>
                    <td><strong>Spells:</strong> Recurrent, stereotyped, brief (10–30 min) positive sensory paresthesias or motor weakness with a <strong>smooth spreading march</strong> across adjacent cortical territories due to Cortical Spreading Depolarization (CSD) triggered by focal cSS/cSAH.<br /><strong>TIA:</strong> Sudden simultaneous negative focal deficit.</td>
                    <td><strong>DO NOT START ANTIPLATELETS / ANTICOAGULANTS!</strong> Antiplatelet therapy precipitates massive fatal lobar ICH.<br /><strong>Treatment:</strong> Low-dose Levetiracetam (250–500 mg BID) stabilizes spreading depolarization.</td>
                  </tr>
                  <tr>
                    <td><strong>Anticoagulation for AF in CAA</strong><br /><span style={{ fontSize: '5.8pt', color: 'var(--ink-mute)' }}>PRESTIGE-AF &bull; SoSTART &bull; ENRICH-AF</span></td>
                    <td>Patients with atrial fibrillation and probable CAA face extreme competitive risks of ischemic stroke vs recurrent lobar ICH. <strong>ENRICH-AF DSMB stopped enrollment of lobar ICH</strong> due to excess severe intracranial bleeding on edoxaban. SoSTART and PRESTIGE-AF (Lancet Neurol 2025) confirmed high bleeding rates.</td>
                    <td><strong>Left Atrial Appendage Occlusion (LAAO / Watchman)</strong> is strongly preferred over long-term oral anticoagulation (Class IIa/IIb). If anticoagulation is mandated, avoid VKAs; use lowest effective DOAC dose + strict BP &lt;130.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §4 CAA-Related Inflammation (CAA-ri) & Tiered Bedside Pearls (slate) */}
            <CardSection color="slate" title="4. CAA-Related Inflammation (CAA-ri) &amp; Bedside Pearls">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.1pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>CAA-Related Inflammation (CAA-ri)</strong>
                  <br />&bull; <strong>Presentation:</strong> Subacute cognitive decline, headache, seizures, focal deficits.
                  <br />&bull; <strong>MRI:</strong> Asymmetric, confluent T2/FLAIR vasogenic edema with underlying lobar CMBs/cSS.
                  <br />&bull; <strong>Treatment:</strong> High-dose IV Methylprednisolone 1 g/day &times; 3–5 days followed by oral taper (months).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Strict Blood Pressure Targets</strong>
                  <br />&bull; <strong>Target SBP &lt;120–130 mmHg:</strong> Blood pressure reduction is the single most effective proven therapy to reduce recurrent lobar ICH.
                  <br />&bull; Avoid NSAIDs and anticoagulants where possible.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.5pt' }}>Lipid Lowering in CAA</strong>
                  <br />&bull; <strong>SPARCL Caveat:</strong> High-dose statins in patients with prior ICH increased recurrent hemorrhage risk (HR 1.66).
                  <br />&bull; Avoid excessive statin over-titration unless compelling atherosclerotic CAD/stroke indications exist.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'Boston Criteria 2.0', cite: 'Charidimou A et al. Lancet Neurol. 2022;21(8):714-725.', pmid: '35841910' },
              { label: 'Cortical Siderosis in CAA', cite: 'Linn J et al. Neurology. 2010;74(17):1346-1350.', pmid: '20421578' },
              { label: 'Amyloid Spells (TFNE)', cite: 'Charidimou A et al. Stroke. 2012;43(9):2324-2330.', pmid: '22798323' },
              { label: 'PRESTIGE-AF Trial', cite: 'Polymeris AA et al. Lancet Neurol. 2025;24(1):41-52.', pmid: '40023176' },
              { label: 'SoSTART Trial', cite: 'Al-Shahi Salman R et al. Lancet Neurol. 2021;20(10):844-853.', pmid: '34487722' },
              { label: 'AHA/ASA 2022 ICH Guideline', cite: 'Greenberg SM et al. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
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
      pdfPath="documents/references/CADASIL_CARASIL_Vasculopathies.pdf"
      pdfName="CADASIL_CARASIL_Vasculopathies.pdf"
      iconColorClass="text-purple-600 dark:text-purple-400"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Genetic Cerebral Small Vessel Vasculopathies Neuroimaging and Molecular Pathways" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />
      
      {/* Panel A: CADASIL vs CARASIL MRI Signatures */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: CADASIL VS CARASIL MRI SIGNATURES</text>
      
      {/* Brain contour CADASIL */}
      <ellipse cx="68" cy="78" rx="46" ry="40" fill="var(--fill-soft)" stroke="var(--purple)" strokeWidth="1.2" />
      {/* Temporal pole O'Sullivan sign */}
      <circle cx="34" cy="98" r="8" fill="var(--purple)" opacity="0.85" />
      <circle cx="102" cy="98" r="8" fill="var(--purple)" opacity="0.85" />
      {/* External capsule */}
      <path d="M 44 65 Q 40 78 44 90" stroke="var(--purple)" strokeWidth="3" fill="none" />
      <path d="M 92 65 Q 96 78 92 90" stroke="var(--purple)" strokeWidth="3" fill="none" />
      <text x="68" y="130" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CADASIL: Anterior Temporal + External Capsule</text>
      <text x="68" y="142" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">NOTCH3 • O&apos;Sullivan Sign (&gt;90% Sp/Sn)</text>

      {/* Brain contour CARASIL */}
      <ellipse cx="180" cy="78" rx="46" ry="40" fill="var(--fill-soft)" stroke="var(--amber)" strokeWidth="1.2" />
      {/* Diffuse confluent WMH with arcuate sign in pons */}
      <ellipse cx="180" cy="74" rx="28" ry="20" fill="var(--amber)" opacity="0.45" />
      <path d="M 166 94 Q 180 86 194 94" stroke="var(--amber-deep)" strokeWidth="2.5" fill="none" />
      <text x="180" y="130" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CARASIL: Pontine Arcuate Sign</text>
      <text x="180" y="142" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">HTRA1 • Alopecia + Spondylosis</text>

      {/* Panel B: Fabry Pulvinar Sign & Dolichoectasia */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: FABRY PULVINAR SIGN (T1) &amp; BASILAR ECTASIA</text>
      
      {/* Thalamus schematic */}
      <ellipse cx="330" cy="76" rx="44" ry="36" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
      {/* Bilateral Pulvinar hyperintensity on T1 */}
      <ellipse cx="316" cy="88" rx="10" ry="7" fill="var(--amber-deep)" />
      <ellipse cx="344" cy="88" rx="10" ry="7" fill="var(--amber-deep)" />
      <text x="330" y="60" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Thalamic Pulvinar T1 Brightness</text>
      
      {/* Dolichoectatic basilar artery */}
      <path d="M 430 115 Q 410 80 435 50" stroke="var(--red)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <text x="435" y="44" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Basilar Dolichoectasia</text>
      <text x="368" y="132" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">GLA Gene • Alpha-Galactosidase A Deficiency</text>
      <text x="368" y="144" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Gb3 Deposition • Acroparesthesias • Agalsidase ERT</text>

      {/* Panel C: MELAS Cortical Lesions & MRS Lactate */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--red)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: MELAS &amp; COL4A1 MULTISYSTEM DISORDERS</text>
      
      {/* Brain contour with non-vascular territory stroke-like lesion */}
      <ellipse cx="550" cy="76" rx="42" ry="36" fill="var(--fill-soft)" stroke="var(--red)" strokeWidth="1.2" />
      {/* Non-vascular parieto-occipital wedge crossing MCA/PCA boundary */}
      <path d="M 550 50 Q 585 60 580 95 Q 560 90 550 76 Z" fill="var(--red)" opacity="0.6" />
      <text x="550" y="126" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Lesions Cross Vascular Borders</text>
      <text x="550" y="138" fill="var(--ink-mute)" fontSize="4.5pt" fontFamily="IBM Plex Sans" textAnchor="middle">m.3243A&gt;G • L-Arginine 0.5g/kg IV</text>

      {/* MRS Inverted Lactate Peak at 1.3 ppm */}
      <rect x="615" y="42" rx="4" width="95" height="68" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
      <text x="662" y="54" fill="var(--ink)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MR Spectroscopy (TE 144ms)</text>
      <path d="M 622 76 L 640 76 L 648 60 L 655 76 L 670 76 L 678 96 L 684 96 L 692 76 L 704 76" stroke="var(--red-deep)" strokeWidth="1.8" fill="none" />
      <text x="681" y="106" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Lactate 1.3 ppm</text>
      
      <text x="609" y="152" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">COL4A1: Porencephaly • Traumatic ICH • Retinal Tortuosity</text>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 CADASIL & CARASIL Comparative Matrix (purple) */}
            <CardSection color="purple" title="1. CADASIL vs CARASIL Comparative Diagnostic Matrix">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>1. <strong>Migraine with aura</strong> (onset ~30y)<br />2. <strong>Recurrent subcortical lacunar strokes</strong> without HTN (onset ~45y)<br />3. <strong>Subcortical dementia &amp; mood/apathy</strong></td>
                    <td>&bull; <strong>Anterior temporal lobe pole</strong> hyperintensity (O&apos;Sullivan sign, &gt;90% Sp)<br />&bull; <strong>External capsule</strong> &amp; corpus callosum WMH<br />&bull; Deep cerebral microbleeds on SWI</td>
                    <td><strong>Genetic testing:</strong> NOTCH3 exons 2–24 (EGFR repeats). Skin biopsy: Granular osmiophilic material (GOM).<br /><span style={{ color: 'var(--red-deep)' }}><strong>AVOID:</strong> IV thrombolysis for lacunes; triptans/ergots.</span></td>
                  </tr>
                  <tr>
                    <td><strong>CARASIL</strong><br /><span style={{ color: 'var(--amber-deep)' }}>HTRA1 (10q26)</span></td>
                    <td><strong>Autosomal Recessive</strong><br />Onset: Teens–30s</td>
                    <td>1. <strong>Premature alopecia</strong> (teens/20s)<br />2. <strong>Severe lumbar spondylosis</strong> &amp; disc herniations (20s)<br />3. <strong>Progressive subcortical leukoaraiosis</strong> &amp; pseudobulbar palsy</td>
                    <td>&bull; Diffuse confluent leukoencephalopathy<br />&bull; <strong>Pontine arcuate sign</strong> (hyperintense rim)<br />&bull; Multiple subcortical lacunar infarcts<br />&bull; Anterior temporal pole typically spared</td>
                    <td><strong>Genetic testing:</strong> Homozygous / compound heterozygous loss-of-function HTRA1 mutations.<br />Treatment is supportive: strict normotension, physical therapy. Avoid empiric anticoagulation.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §2 Fabry Disease & MELAS Precision Management (teal) */}
            <CardSection color="teal" title="2. Fabry Disease &amp; MELAS Precision Diagnostics &amp; Targeted Therapeutics">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Fabry Disease (Anderson-Fabry) &mdash; GLA Gene (Xq22)</strong>
                  <br />&bull; <strong>Pathophysiology:</strong> Alpha-galactosidase A deficiency &rarr; progressive globotriaosylceramide (Gb3/lyso-Gb3) accumulation in vascular endothelial and smooth muscle cells.
                  <br />&bull; <strong>Systemic Phenotype:</strong> Burning neuropathic acroparesthesias (triggered by heat/fever), angiokeratomas (bathing suit area), hypohidrosis, hypertrophic cardiomyopathy, renal failure.
                  <br />&bull; <strong>Stroke Presentation:</strong> Early-onset cryptogenic ischemic stroke/TIA (30s–40s) in both hemizygous males and heterozygous females; vertebrobasilar predilection.
                  <br />&bull; <strong>Neuroimaging:</strong> <strong>Pulvinar sign</strong> (bilateral T1 hyperintensity of posterior thalamus), prominent <strong>basilar dolichoectasia</strong>, progressive periventricular leukoaraiosis.
                  <br />&bull; <strong>Targeted Therapy:</strong> <strong>Enzyme Replacement Therapy (ERT)</strong> with Agalsidase beta (1 mg/kg IV q2w) or Agalsidase alfa; oral chaperone <strong>Migalastat</strong> for amenable mutations; single antiplatelet + ACEi/ARB.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>MELAS &mdash; Mitochondrial DNA MT-TL1 (m.3243A&gt;G)</strong>
                  <br />&bull; <strong>Pathophysiology:</strong> Impaired mitochondrial tRNA-Leu translation &rarr; complex I respiratory chain failure, cytopathy, and endothelial nitric oxide (NO) depletion leading to microvascular angiopathy.
                  <br />&bull; <strong>Clinical Phenotype:</strong> Stroke-like episodes before age 40 (cortical blindness, aphasia, hemiparesis), focal motor/generalized seizures, lactic acidosis, short stature, sensorineural hearing loss, diabetes mellitus.
                  <br />&bull; <strong>Neuroimaging:</strong> <strong>Cortical stroke-like lesions crossing vascular arterial territories</strong> (parieto-occipital predilection); high T2/FLAIR and cortical swelling; MRS shows <strong>inverted doublet lactate peak at 1.3 ppm</strong>.
                  <br />&bull; <strong>Acute Protocol:</strong> <strong>IV L-Arginine (0.5 g/kg IV bolus over 30 min)</strong> within 3 hours to restore NO vasodilatation; maintenance oral L-Arginine (0.15–0.3 g/kg/day) + L-Citrulline.
                  <br />&bull; <strong>Hard Contraindications:</strong> <span style={{ color: 'var(--red-deep)' }}>STRICTLY AVOID Valproic acid (fatal hepatotoxicity/mitochondrial collapse) and Metformin (severe lactic acidosis).</span>
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
                  <br />&bull; <strong>Antithrombotic Restriction:</strong> Anticoagulation and thrombolytics are strictly contraindicated.
                  <br />&bull; <strong>Blood Pressure:</strong> Aggressive lifelong BP control.
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
                  <br />&bull; Comprehensive monogenic stroke NGS gene panel (<em>NOTCH3, HTRA1, GLA, COL4A1, COL4A2, TREX1, APP, CST3</em>).
                  <br />&bull; Mitochondrial DNA whole genome sequencing / heteroplasmy quantification for MELAS.
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
              { label: 'ESO Guidelines', cite: 'Bersano A et al. Eur Stroke J. 2023;8(1):55-84.', pmid: '37021176' },
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
      pdfPath="documents/references/Moyamoya_Disease_Surgical_Revascularization.pdf"
      pdfName="Moyamoya_Disease_Surgical_Revascularization.pdf"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Moyamoya Angiographic Staging and Surgical Revascularization Modalities" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />
      
      {/* Panel A: Suzuki Staging Progression (1 to 6) */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: SUZUKI ANGIOGRAPHIC STAGING (1–6)</text>
      
      {/* 6 mini stage boxes */}
      <g transform="translate(18, 38)">
        {/* Stage 1 */}
        <rect x="0" y="0" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="32" y="12" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 1: Narrowing</text>
        <path d="M 24 34 L 32 18 L 40 34" stroke="var(--ink)" strokeWidth="1.5" fill="none" />
        <text x="32" y="38" fill="var(--ink-mute)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">ICA Bifurcation Stenosis</text>

        {/* Stage 2 */}
        <rect x="74" y="0" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="106" y="12" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 2: Initiation</text>
        <circle cx="106" cy="24" r="5" fill="none" stroke="var(--purple)" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <text x="106" y="38" fill="var(--ink-mute)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Early Basal Net</text>

        {/* Stage 3 */}
        <rect x="148" y="0" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--purple)" strokeWidth="1.5" />
        <text x="180" y="12" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 3: Intensify</text>
        <path d="M 172 26 C 176 18, 184 18, 188 26 C 180 32, 174 22, 180 20" stroke="var(--purple)" strokeWidth="1.8" fill="none" />
        <text x="180" y="38" fill="var(--purple-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">&quot;Puff of Smoke&quot;</text>

        {/* Stage 4 */}
        <rect x="0" y="50" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="32" y="62" fill="var(--amber-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 4: Minimize</text>
        <path d="M 12 75 L 52 75" stroke="var(--amber-deep)" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="32" y="88" fill="var(--ink-mute)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">ECA Collaterals Form</text>

        {/* Stage 5 */}
        <rect x="74" y="50" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="106" y="62" fill="var(--amber-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 5: Reduction</text>
        <circle cx="106" cy="74" r="3" fill="var(--red)" />
        <text x="106" y="88" fill="var(--ink-mute)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Basal Net Shrinks</text>

        {/* Stage 6 */}
        <rect x="148" y="50" width="64" height="42" rx="4" fill="var(--fill-soft)" stroke="var(--red)" strokeWidth="1.5" />
        <text x="180" y="62" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STAGE 6: Complete</text>
        <path d="M 168 70 L 192 82 M 192 70 L 168 82" stroke="var(--red)" strokeWidth="1.8" />
        <text x="180" y="88" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">&quot;Carotid Death&quot;</text>
      </g>
      <text x="126" y="152" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Suzuki &amp; Takaku 1969 • Progressive Intracranial ICA Obliteration</text>

      {/* Panel B: Direct STA-MCA Bypass vs Indirect Revascularization */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: DIRECT STA-MCA VS INDIRECT EDAS/EMS</text>
      
      {/* Direct Bypass schema */}
      <rect x="260" y="38" width="104" height="74" rx="4" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
      <text x="312" y="50" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Direct STA-MCA Bypass</text>
      <path d="M 275 60 C 290 60, 295 72, 312 72 C 325 72, 335 84, 350 84" stroke="var(--red)" strokeWidth="2.5" fill="none" />
      <circle cx="312" cy="72" r="3.5" fill="var(--purple-deep)" />
      <text x="312" y="96" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Immediate Flow Augmentation</text>
      <text x="312" y="106" fill="var(--ink-mute)" fontSize="4.3pt" fontFamily="IBM Plex Sans" textAnchor="middle">Adults • Lowers Collateral Stress</text>

      {/* Indirect Synangiosis schema */}
      <rect x="372" y="38" width="104" height="74" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
      <text x="424" y="50" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Indirect EDAS / EMS</text>
      <rect x="382" y="60" width="84" height="8" rx="2" fill="var(--amber)" opacity="0.6" />
      <path d="M 390 68 L 390 84 M 405 68 L 405 84 M 424 68 L 424 84 M 445 68 L 445 84" stroke="var(--teal-deep)" strokeWidth="1.5" strokeDasharray="2 1.5" />
      <text x="424" y="96" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Neoangiogenesis (3–6 mo)</text>
      <text x="424" y="106" fill="var(--ink-mute)" fontSize="4.3pt" fontFamily="IBM Plex Sans" textAnchor="middle">Pediatric • Fragile Small Caliber</text>

      <text x="368" y="132" fill="var(--ink)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Combined EDAMS: Direct Bypass + Dural/Muscle Flap</text>
      <text x="368" y="146" fill="var(--ink-mute)" fontSize="4.5pt" fontFamily="IBM Plex Sans" textAnchor="middle">Maximal early protection + lifelong collateral reserve</text>

      {/* Panel C: JAM Randomized Trial & Hemodynamic Guardrails */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--red)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: JAM RCT &amp; PERIOPERATIVE GUARDRAILS</text>
      
      {/* JAM Trial Forest Plot */}
      <rect x="502" y="36" width="215" height="50" rx="4" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
      <text x="609" y="48" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">JAM Trial: Hemorrhagic Moyamoya RCT (n=80)</text>
      <text x="510" y="60" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans">STA-MCA Bypass (11.9%) vs Medical (31.6%)</text>
      {/* Forest plot bar */}
      <line x1="560" y1="72" x2="680" y2="72" stroke="var(--rule)" strokeWidth="1" />
      <line x1="620" y1="66" x2="620" y2="78" stroke="var(--ink-mute)" strokeWidth="1" />
      <rect x="582" y="69" width="16" height="6" fill="var(--teal)" />
      <line x1="570" y1="72" x2="610" y2="72" stroke="var(--teal-deep)" strokeWidth="1.5" />
      <text x="609" y="82" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">HR 0.39 (95% CI 0.18–0.82, p=0.04)</text>

      {/* Critical Perioperative Guardrails */}
      <rect x="502" y="92" width="215" height="60" rx="4" fill="#fff5f5" stroke="var(--red)" strokeWidth="1" />
      <text x="609" y="104" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CRITICAL BED &amp; ANESTHETIC RULES</text>
      <text x="508" y="116" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>NO HYPERVENTILATION:</strong> Crying &rarr; &darr;PaCO2 &rarr; Vasoconstriction &rarr; TIA/Stroke</text>
      <text x="508" y="126" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>Normocarbia:</strong> Strict target PaCO2 38–42 mmHg</text>
      <text x="508" y="136" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>Euvolemia &amp; MAP:</strong> 1.5x IV NS; avoid hypotension; SBP &lt;130 if hyperperfusion</text>
      <text x="508" y="146" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>RNF213:</strong> p.R4810K East Asian founder variant</text>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Suzuki Angiographic Staging & Neuroimaging Pearls (purple) */}
            <CardSection color="purple" title="1. Suzuki Angiographic Classification &amp; Neuroimaging Hallmarks">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Complete occlusion of bilateral internal carotid arteries (&quot;carotid death&quot;).</td>
                    <td>Basal moyamoya networks disappear; cerebral hemisphere supplied entirely by ECA (middle meningeal) and PCA.</td>
                    <td>&bull; <strong>SPECT / Perfusion MRI with Acetazolamide (Diamox):</strong> Demonstrates complete loss of cerebrovascular reserve (CVR) and hemodynamic steal, mandating urgent revascularization.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §2 Surgical Revascularization & JAM Trial Evidence (teal) */}
            <CardSection color="teal" title="2. Surgical Revascularization Modalities &amp; Landmark JAM Trial Evidence">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.2fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.5pt' }}>Direct STA-MCA Bypass</strong>
                  <br />&bull; End-to-side microvascular anastomosis of the frontal/parietal branch of the Superficial Temporal Artery (STA) to a recipient M4 cortical MCA branch.
                  <br />&bull; <strong>Advantages:</strong> Provides <em>immediate</em> hemodynamic augmentation; rapidly unloads fragile basal collaterals to stop recurrent bleeding.
                  <br />&bull; <strong>Target Population:</strong> Standard of care for adult ischemic and hemorrhagic Moyamoya disease.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.5pt' }}>Indirect Synangiosis (EDAS / EMS)</strong>
                  <br />&bull; Encephalo-duro-arterio-synangiosis (EDAS) or Encephalo-myo-synangiosis (EMS): suturing vascularized galea, dural flap, or temporalis muscle to pial surface.
                  <br />&bull; <strong>Mechanism:</strong> Relies on spontaneous neoangiogenesis over 3–6 months.
                  <br />&bull; <strong>Target Population:</strong> Children (&lt;10y) with small donor/recipient vessels (&lt;0.8 mm); combined with direct bypass (EDAMS) in adolescents/adults.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Landmark JAM Trial (Stroke 2014)</strong>
                  <br />&bull; Multicenter RCT of 80 patients (116 hemispheres) with hemorrhagic Moyamoya randomized to direct STA-MCA bypass vs medical therapy.
                  <br />&bull; <strong>Primary Endpoint:</strong> Recurrent hemorrhage occurred in <strong>11.9%</strong> in the surgical group vs <strong>31.6%</strong> in medical controls.
                  <br />&bull; <strong>Efficacy:</strong> Statistically significant <strong>61% relative risk reduction (HR 0.39, 95% CI 0.18–0.82, p=0.04)</strong>. Proved direct bypass is definitive therapy for hemorrhagic Moyamoya.
                </div>
              </div>
            </CardSection>

            {/* §3 Moyamoya Disease vs Moyamoya Syndrome Etiologies (amber) */}
            <CardSection color="amber" title="3. Moyamoya Disease (Idiopathic / RNF213) vs Moyamoya Syndrome (Secondary)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Idiopathic Moyamoya Disease</strong>
                  <br />&bull; Primary bilateral stenosing arteriopathy without systemic disease.
                  <br />&bull; Strong association with the <strong>RNF213</strong> gene (*p.R4810K* polymorphism in East Asian ancestry; found in &gt;75% of Japanese/Korean/Chinese cohorts).
                  <br />&bull; Bimodal age distribution: Peak 1 in childhood (5–10 years); Peak 2 in adults (35–45 years).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Moyamoya Syndrome (Secondary Causes)</strong>
                  <br />&bull; <strong>Sickle Cell Disease (HbSS):</strong> Chronic endothelial damage and large-vessel occlusion.
                  <br />&bull; <strong>Trisomy 21 (Down Syndrome):</strong> 3-fold higher Moyamoya risk; screen with MRA for new focal deficits.
                  <br />&bull; <strong>Neurofibromatosis Type 1 (NF1):</strong> Neurofibromin deficiency causing neurovascular dysplasia.
                  <br />&bull; <strong>Cranial Irradiation:</strong> Post-radiotherapy for pediatric medulloblastoma, optic glioma, craniopharyngioma.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Long-Term Medical Regimen</strong>
                  <br />&bull; <strong>Aspirin 81 mg daily:</strong> Prevents microthrombosis in stenotic arteries and patent bypass grafts.
                  <br />&bull; <span style={{ color: 'var(--red-deep)' }}><strong>Contraindicated:</strong> Anticoagulation is strictly avoided in Moyamoya due to lethal microaneurysm rupture risk.</span>
                </div>
              </div>
            </CardSection>

            {/* §4 Critical Perioperative Anesthetic & Critical Care Protocols (slate) */}
            <CardSection color="slate" title="4. Perioperative Anesthetic Guardrails &amp; Hyperperfusion Management">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>Hyperventilation &amp; Hypocapnia Hazard</strong>
                  <br />&bull; Cerebral vessels in Moyamoya are hypersensitive to CO2.
                  <br />&bull; <strong>Hypocapnia (PaCO2 &lt;35 mmHg)</strong> triggers severe reflex vasoconstriction, precipitating acute watershed stroke.
                  <br />&bull; <strong>Rule:</strong> Maintain strict intraoperative and postoperative <strong>normocarbia (ETCO2 38–42 mmHg)</strong>. Aggressively treat pediatric crying and pain.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Hydration &amp; Hemodynamic Targets</strong>
                  <br />&bull; <strong>Euvolemia to Mild Hypervolemia:</strong> Maintain IV isotonic normal saline at 1.2–1.5x maintenance rate; avoid hypotonic crystalloids (e.g. D5W, 0.45% NS).
                  <br />&bull; Maintain baseline to slightly elevated mean arterial pressure (MAP); strictly avoid intraoperative hypotension.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Postoperative Hyperperfusion Syndrome</strong>
                  <br />&bull; High-flow direct bypass into chronically ischemic cortical territory with impaired autoregulation.
                  <br />&bull; <strong>Symptoms:</strong> Severe unilateral headache, new focal deficits, seizures, subcortical ICH (days 2–7).
                  <br />&bull; <strong>Management:</strong> Strict SBP lowering (target 110–130 mmHg) with Nicardipine/Labetalol and sedation.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'JAM Trial Landmark', cite: 'Miyamoto S et al. Stroke. 2014;45(5):1415-1421.', pmid: '24668203' },
              { label: 'Suzuki Staging Classic', cite: 'Suzuki J & Takaku A. Arch Neurol. 1969;20(3):288-299.', pmid: '5775283' },
              { label: 'JSS Moyamoya Guidelines', cite: 'Kuroda S et al. Neurol Med Chir (Tokyo). 2012;52(5):245-266.', pmid: '22870528' },
              { label: 'Scott & Smith Review', cite: 'Scott RM & Smith ER. N Engl J Med. 2009;360(12):1226-1237.', pmid: '19297575' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// DOMAIN 5: PREGNANCY & PUERPERAL STROKE (2026 MATERNAL GUIDELINES)
// =====================================================================
export const PregnancyStrokeView = () => {
  return (
    <PdfActionBar
      title="Stroke in Pregnancy and the Puerperium: 2026 Maternal Guidelines"
      pdfPath="documents/references/Pregnancy_and_Puerperium_Stroke_Guidelines.pdf"
      pdfName="Pregnancy_and_Puerperium_Stroke_Guidelines.pdf"
      iconColorClass="text-red-600 dark:text-red-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <PregnancyStrokeCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function PregnancyStrokeCard() {
  const renderSVG = () => (
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Maternal Stroke Risk Arc and Reperfusion Safety Matrix" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />
      
      {/* Panel A: Temporal Stroke Risk Arc */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: TEMPORAL STROKE RISK &amp; PEAK PERIODS</text>
      
      {/* Risk curve graph */}
      <path d="M 25 115 C 60 115, 90 110, 130 95 C 160 80, 175 45, 195 40 C 210 38, 225 80, 230 110" stroke="var(--purple)" strokeWidth="3" fill="none" />
      {/* Baseline dashed */}
      <line x1="25" y1="115" x2="230" y2="115" stroke="var(--rule)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Trimester Labels */}
      <text x="50" y="128" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="Outfit" textAnchor="middle">1st Trim</text>
      <text x="100" y="128" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="Outfit" textAnchor="middle">2nd Trim</text>
      <text x="150" y="128" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">3rd Trim</text>
      <text x="200" y="128" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Puerperium (0–6w)</text>
      
      {/* High peak annotation */}
      <circle cx="195" cy="40" r="4" fill="var(--red)" />
      <text x="195" y="32" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MAX RISK PEAK</text>
      <text x="126" y="146" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Preeclampsia • CVST • Postpartum RCVS • Amniotic Embolism</text>

      {/* Panel B: Preeclampsia / Eclampsia & PRES Protocol */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: SEVERE HTN &amp; MAGNESIUM PROTOCOL</text>
      
      {/* BP Emergency Threshold Box */}
      <rect x="260" y="36" width="215" height="42" rx="4" fill="#fff5f5" stroke="var(--red)" strokeWidth="1" />
      <text x="368" y="48" fill="var(--red-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">SEVERE HTN EMERGENCY: SBP &ge;160 or DBP &ge;110</text>
      <text x="266" y="60" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>IV Labetalol:</strong> 20 mg &rarr; 40–80 mg q10–20m (max 300 mg)</text>
      <text x="266" y="70" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>IV Hydralazine:</strong> 5–10 mg q20m | <strong>PO Nifedipine IR:</strong> 10–20 mg</text>

      {/* Magnesium Magpie Protocol Box */}
      <rect x="260" y="84" width="215" height="44" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
      <text x="368" y="96" fill="var(--teal-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MAGPIE MAGNESIUM SULFATE PROTOCOL</text>
      <text x="266" y="108" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>Loading:</strong> 4–6 g IV over 15–20 min &rarr; <strong>Maint:</strong> 1–2 g/h x 24h postpartum</text>
      <text x="266" y="118" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>Toxicity Antidote:</strong> Calcium gluconate 1 g IV (10 mL of 10% sol)</text>

      <text x="368" y="148" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">ACEi / ARBs strictly contraindicated (fetal renal dysgenesis)</text>

      {/* Panel C: Reperfusion & Anticoagulation Safety Profile */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--red)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: REPERFUSION &amp; DRUG SAFETY MATRIX</text>
      
      {/* 3 Status Rows */}
      <g transform="translate(502, 36)">
        {/* Row 1: IV Thrombolysis */}
        <rect x="0" y="0" width="215" height="24" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="11" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">IV Thrombolysis (tPA/TNK)</text>
        <text x="140" y="11" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">SAFE (Class IIa)</text>
        <text x="8" y="20" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Large molecule (~60 kDa) does NOT cross placenta.</text>

        {/* Row 2: EVT */}
        <rect x="0" y="28" width="215" height="24" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="39" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">EVT / Thrombectomy</text>
        <text x="140" y="39" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">SAFE (Class I)</text>
        <text x="8" y="48" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">LVO indication unchanged; apply pelvic lead shield.</text>

        {/* Row 3: Anticoagulation */}
        <rect x="0" y="56" width="215" height="26" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
        <text x="8" y="67" fill="#1e40af" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">LMWH &rarr; IV UFH Delivery Switch</text>
        <text x="8" y="77" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">LMWH safe in pregnancy; switch to IV UFH at 36w for epidural.</text>
      </g>
      <text x="609" y="152" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Warfarin / DOACs contraindicated in pregnancy (safe in lactation)</text>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-pregnancy-stroke">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Stroke in Pregnancy and the Puerperium</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              2026 AHA Maternal Stroke Guidelines &bull; Acute Reperfusion (IVT/EVT) &bull; Severe Preeclampsia / Eclampsia / PRES &bull; Puerperal CVST
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Maternal Stroke Reperfusion Pathways (purple) */}
            <CardSection color="purple" title="1. Acute Reperfusion Pathways in Pregnant Patients (2026 AHA Update)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>IV Thrombolysis (Alteplase / Tenecteplase)</strong>
                  <br />&bull; <strong>Safety Profile:</strong> Alteplase (~59 kDa) and Tenecteplase (~65 kDa) are large hydrophilic proteins that <strong>do not cross the placenta</strong>.
                  <br />&bull; <strong>Guideline Recommendation (Class IIa, LOE B-NR):</strong> In pregnant women with disabling acute ischemic stroke presenting within the therapeutic window, IV thrombolysis should <strong>NOT be withheld</strong> solely due to pregnancy.
                  <br />&bull; Maternal hemorrhage risk is comparable to non-pregnant patients; fetal loss risk is extremely low.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Endovascular Thrombectomy (EVT)</strong>
                  <br />&bull; <strong>Guideline Recommendation (Class I, LOE A):</strong> EVT is indicated and highly recommended for large vessel occlusion (ICA, M1 MCA) in pregnancy.
                  <br />&bull; <strong>Fetal Shielding &amp; Radiation:</strong> Wrap the maternal abdomen and pelvis with circumferential lead shielding; minimize continuous fluoroscopy by using low-dose pulsed acquisition.
                  <br />&bull; Procedural femoral access and microcatheter thrombectomy carry no direct fetal mechanical hazard.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Diagnostic Radiation Guardrails</strong>
                  <br />&bull; <strong>NCCT &amp; CTA Head/Neck:</strong> Fetal dose is <strong>&lt;0.01 mGy</strong>, which is hundreds of times below the teratogenic threshold (50–100 mGy). <em>Never delay stroke imaging!</em>
                  <br />&bull; <strong>Brain MRI:</strong> Safe at 1.5T and 3.0T. <strong>Avoid Gadolinium</strong> contrast in pregnancy.
                </div>
              </div>
            </CardSection>

            {/* §2 Preeclampsia, Eclampsia & PRES Protocol (teal) */}
            <CardSection color="teal" title="2. Severe Preeclampsia, Eclampsia &amp; PRES Emergency Management">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '110px' }}>Clinical Syndrome</th>
                    <th style={{ width: '160px' }}>Diagnostic Criteria &amp; Neuroimaging</th>
                    <th style={{ width: '180px' }}>Emergency Pharmacotherapy Regimens</th>
                    <th>Antidotes &amp; Teratogenic Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Severe Preeclampsia / Eclampsia</strong><br />(HTN &ge;160/110)</td>
                    <td>New-onset HTN &ge;160/110 with proteinuria or severe features (thrombocytopenia, renal/hepatic dysfunction, visual scotomas, severe headache).</td>
                    <td><strong>1. IV Labetalol:</strong> 20 mg IV over 2m, repeat 40–80 mg q10–20m (max 300 mg).<br /><strong>2. IV Hydralazine:</strong> 5–10 mg IV over 2m q20m (max 30 mg).<br /><strong>3. PO Nifedipine IR:</strong> 10–20 mg PO q20–30m.<br /><strong>Target:</strong> SBP 130–150 mmHg, DBP 80–100 mmHg within 30–60 min.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>CONTRAINDICATED:</strong> ACE inhibitors, ARBs, direct renin inhibitors (cause fetal renal agenesis &amp; skull ossification defects).</span></td>
                  </tr>
                  <tr>
                    <td><strong>PRES &amp; Eclamptic Seizures</strong><br />(Posterior Reversible Leukoencephalopathy)</td>
                    <td>Encephalopathy, visual loss, cortical blindness, seizures; MRI shows symmetric parieto-occipital <strong>vasogenic edema</strong> (high ADC).</td>
                    <td><strong>Magpie Trial Magnesium Sulfate Protocol:</strong><br />&bull; <strong>Loading Dose:</strong> 4–6 g IV in 100 mL over 15–20 minutes.<br />&bull; <strong>Maintenance Infusion:</strong> 1–2 g/hour continuous IV for at least 24 hours postpartum.<br />&bull; Recurrent seizure: Additional 2 g IV bolus over 5 minutes.</td>
                    <td><strong>Magnesium Toxicity Antidote:</strong><br /><strong>Calcium Gluconate 1 g IV</strong> (10 mL of 10% solution) given over 3–5 min for loss of deep tendon reflexes or respiratory depression.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Postpartum RCVS & Cerebral Venous Sinus Thrombosis (amber) */}
            <CardSection color="amber" title="3. Postpartum Angiopathy (RCVS) vs Puerperal CVST Anticoagulation">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Postpartum Angiopathy / RCVS</strong>
                  <br />&bull; <strong>Onset:</strong> Typically occurs in the first 1–3 weeks postpartum.
                  <br />&bull; <strong>Presentation:</strong> Recurrent severe <strong>thunderclap headaches</strong> (&ge;2 spikes over 1–2 weeks) triggered by Valsalva, emotion, or vasoactive drugs (oxytocics such as Methylergonovine, Bromocriptine).
                  <br />&bull; <strong>Angiography:</strong> Reversible segmental &quot;string-of-sausages&quot; vasoconstriction on CTA/MRA; vessel wall MRI shows <em>absence</em> of eccentric mural enhancement (rules out primary CNS vasculitis).
                  <br />&bull; <strong>Management:</strong> Calcium channel blocker (Nimodipine 60 mg q4h or Verapamil); <span style={{ color: 'var(--red-deep)' }}><strong>AVOID glucocorticoids</strong> (worsen outcomes in RCVS).</span>
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Cerebral Venous Sinus Thrombosis (CVST) &amp; Delivery Timing</strong>
                  <br />&bull; <strong>First-Line Anticoagulation:</strong> Full therapeutic <strong>LMWH (Enoxaparin 1 mg/kg SC q12h)</strong> throughout pregnancy (does not cross placenta; monitor anti-Xa levels to account for expanding plasma volume).
                  <br />&bull; <strong>Delivery Planning:</strong> At ~36 weeks or 24–36 hours before planned delivery, switch LMWH to continuous <strong>IV Unfractionated Heparin (UFH)</strong>.
                  <br />&bull; <strong>Neuraxial Anesthesia Guardrails:</strong> Withhold therapeutic LMWH for &ge;24 hours (or prophylactic LMWH for &ge;12 hours); discontinue IV UFH for &ge;4–6 hours with normal aPTT before epidural placement to prevent epidural hematoma.
                  <br />&bull; <strong>Postpartum:</strong> Resume anticoagulation 6–12h after vaginal delivery or 24h after C-section; DOACs/Warfarin are safe during breastfeeding.
                </div>
              </div>
            </CardSection>

            {/* §4 Obstetric & Pediatric Pearls (slate) */}
            <CardSection color="slate" title="4. Multidisciplinary Delivery Planning &amp; Postpartum Lactation Safety">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Mode of Delivery in Stroke</strong>
                  <br />&bull; <strong>Vaginal Delivery is Preferred:</strong> Stroke alone is not an automatic indication for Cesarean delivery.
                  <br />&bull; Use assisted second stage (vacuum/forceps) and effective regional epidural analgesia to minimize excessive Valsalva straining in patients with recent ICH or unclipped aneurysms.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Postpartum Lactation Safety</strong>
                  <br />&bull; <strong>Safe in Breastfeeding:</strong> Aspirin 81 mg, Enoxaparin, Dalteparin, Warfarin, IV/Oral Iodinated and Gadolinium contrast agents (&lt;0.04% enters breast milk).
                  <br />&bull; Labetalol, Hydralazine, and Nifedipine are fully compatible with breastfeeding.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Long-Term Secondary Prevention</strong>
                  <br />&bull; Comprehensive thrombophilia workup (Antiphospholipid antibodies: Lupus Anticoagulant, Anticardiolipin, Anti-beta-2-glycoprotein I) evaluated &gt;6–12 weeks postpartum.
                  <br />&bull; Avoid combined estrogen-containing oral contraceptives; recommend progestin-only pills or levonorgestrel IUDs.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: '2026 Maternal Stroke Update', cite: 'Miller EC et al. Stroke. 2026.', pmid: '41603019' },
              { label: 'Magpie Trial (Magnesium)', cite: 'Altman D et al. Lancet. 2002;359(9321):1877-1890.', pmid: '12057549' },
              { label: 'AHA CVT Statement', cite: 'Saposnik G et al. Stroke. 2024;55:e84-e107.', pmid: '38284265' },
              { label: 'AHA Women Stroke Guidelines', cite: 'Bushnell C et al. Stroke. 2014;45(5):1545-1588.', pmid: '24503673' },
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
      pdfPath="documents/references/Cancer_Associated_Stroke_NBTE.pdf"
      pdfName="Cancer_Associated_Stroke_NBTE.pdf"
      iconColorClass="text-red-600 dark:text-red-400"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Cancer Associated Stroke Pathophysiology and Three-Territory DWI Sign" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />
      
      {/* Panel A: Three-Territory Sign on DWI */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: THREE-TERRITORY SIGN ON BRAIN DWI</text>
      
      {/* Brain contour with multiterritory acute punctate DWI lesions */}
      <ellipse cx="126" cy="84" rx="55" ry="46" fill="var(--fill-soft)" stroke="var(--purple)" strokeWidth="1.2" />
      {/* Left MCA lesion */}
      <circle cx="95" cy="74" r="4" fill="var(--red)" />
      <circle cx="102" cy="85" r="3" fill="var(--red)" />
      {/* Right MCA lesion */}
      <circle cx="156" cy="78" r="4.5" fill="var(--red)" />
      <circle cx="148" cy="90" r="3" fill="var(--red)" />
      {/* Posterior Circulation (PCA/Cerebellar) lesion */}
      <circle cx="126" cy="115" r="4" fill="var(--red)" />
      
      <text x="126" y="140" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Bilateral Anterior + Posterior Infarcts</text>
      <text x="126" y="152" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Embolic Shower from NBTE / Tumor Hypercoagulability</text>

      {/* Panel B: Tumor Procoagulant Cascade */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: TUMOR BIOLOGY &amp; D-DIMER SURGE</text>
      
      {/* Tumor cell schematic */}
      <rect x="262" y="38" width="212" height="42" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
      <text x="368" y="50" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Mucin Adenocarcinomas (Lung, Pancreas, GI, Ovary)</text>
      <text x="270" y="62" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Mucin binds P/L-Selectin on Platelets &amp; Endothelium</text>
      <text x="270" y="72" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Tumor Tissue Factor (TF) Microparticles &rarr; Thrombin Burst</text>

      {/* D-Dimer threshold indicator */}
      <rect x="262" y="86" width="212" height="44" rx="4" fill="#fff5f5" stroke="var(--red)" strokeWidth="1" />
      <text x="368" y="98" fill="var(--red-deep)" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">MARKER: D-DIMER &gt;3.0–5.0 &micro;g/mL FEU</text>
      <text x="368" y="112" fill="var(--red-deep)" fontSize="4.8pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Disproportionately elevated compared to typical stroke</text>
      <text x="368" y="122" fill="var(--ink-mute)" fontSize="4.4pt" fontFamily="IBM Plex Sans" textAnchor="middle">Accompanied by low-grade consumptive coagulopathy</text>

      <text x="368" y="150" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Neutrophil Extracellular Traps (NETs) enhance fibrin mesh</text>

      {/* Panel C: NBTE Marantic Endocarditis */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--red)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: NON-BACTERIAL THROMBOTIC ENDOCARDITIS</text>
      
      {/* Heart Valve with sterile vegetations */}
      <ellipse cx="609" cy="74" rx="42" ry="32" fill="var(--fill-soft)" stroke="var(--red)" strokeWidth="1.2" />
      {/* Valve leaflets */}
      <path d="M 580 74 Q 609 84 638 74" stroke="var(--ink)" strokeWidth="2" fill="none" />
      {/* Sterile plate-fibrin nodular vegetations */}
      <circle cx="598" cy="77" r="4.5" fill="var(--red-deep)" />
      <circle cx="616" cy="78" r="4" fill="var(--red-deep)" />
      <circle cx="607" cy="79" r="3.5" fill="var(--red-deep)" />

      <text x="609" y="120" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Sterile Platelet-Fibrin Thrombi (Mitral &gt; Aortic)</text>
      <text x="609" y="132" fill="var(--ink)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Transesophageal Echo (TEE) is Gold Standard</text>
      <text x="609" y="144" fill="var(--ink-mute)" fontSize="4.5pt" fontFamily="IBM Plex Sans" textAnchor="middle">TTE Sensitivity &lt;40% | TEE Sensitivity &gt;90%</text>
      <text x="609" y="154" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Therapeutic LMWH (Enoxaparin 1mg/kg q12h) is 1st Line</text>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-cancer-associated-stroke">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Cancer-Associated Stroke &amp; Marantic Endocarditis (NBTE)</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              2026 AHA Cancer Stroke Scientific Statement &bull; Mucin Adenocarcinomas &bull; 3-Territory Sign &bull; D-Dimer &gt;3–5x ULN &bull; LMWH vs DOAC
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Tumor Pathophysiology & Procoagulants (purple) */}
            <CardSection color="purple" title="1. Tumor Biology &amp; Procoagulant Hypercoagulability Pathways">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>High-Risk Tumor Phenotypes</strong>
                  <br />&bull; <strong>Adenocarcinomas:</strong> Lung (NSCLC/SCLC), Pancreatic, Colorectal, Gastric, Ovarian, and Breast.
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
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>&bull; Highly specific (&gt;90%) for a systemic intravascular coagulopathy or central embolic source (NBTE, paradoxical embolism, or tumor thrombus).<br />&bull; Excludes in-situ large artery atherosclerosis as the sole etiology.</td>
                  </tr>
                  <tr>
                    <td><strong>Markedly Elevated D-Dimer</strong></td>
                    <td>Serum D-Dimer <strong>&gt;3.0–5.0 &micro;g/mL FEU</strong> (frequently &gt;10.0–20.0 &micro;g/mL), markedly out of proportion to typical thromboembolic stroke volume.</td>
                    <td>&bull; Strongest independent laboratory predictor of underlying active occult malignancy in cryptogenic stroke (Navi 2017).<br />&bull; Correlates with circulating tumor-derived microparticles and ongoing intravascular fibrin turnover.</td>
                  </tr>
                  <tr>
                    <td><strong>Low-Grade Consumptive Coagulopathy</strong></td>
                    <td>Normal standard PT/INR and aPTT, accompanied by subtle progressive downtrending of platelets (100–150k) and fibrinogen (&lt;200 mg/dL).</td>
                    <td>&bull; Subclinical chronic Disseminated Intravascular Coagulation (DIC).<br />&bull; Indicates high ongoing risk for recurrent multi-organ arterial and venous thromboembolism.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Non-Bacterial Thrombotic Endocarditis (NBTE) Management (amber) */}
            <CardSection color="amber" title="3. Non-Bacterial Thrombotic Endocarditis (NBTE / Marantic Endocarditis)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Pathology &amp; Valve Distribution</strong>
                  <br />&bull; Sterile nodular vegetations composed of dense platelet-fibrin thrombi deposited along the coaptation lines of cardiac valves (<strong>Mitral &gt; Aortic</strong>).
                  <br />&bull; Minimal local inflammatory reaction; no bacterial invasion; valve leaflets are not destroyed or perforated.
                  <br />&bull; Multiple sets of blood cultures are persistently <strong>negative</strong>.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.5pt' }}>Echocardiography Modality Choice</strong>
                  <br />&bull; <strong>Transthoracic Echo (TTE):</strong> Low sensitivity (<strong>&lt;40%</strong>) for small, friable NBTE vegetations (&lt;5 mm).
                  <br />&bull; <strong>Transesophageal Echo (TEE):</strong> Modality of choice (sensitivity <strong>&gt;90%</strong>); mandatory in suspected cancer stroke.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--amber)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>First-Line Pharmacotherapy</strong>
                  <br />&bull; <strong>Therapeutic LMWH:</strong> Enoxaparin 1 mg/kg SC q12h or Dalteparin 200 IU/kg SC daily (TEACH Trial, PMID: 29309496).
                  <br />&bull; Heparin directly inhibits thrombin and blocks P/L-selectin-mucin interactions.
                </div>
              </div>
            </CardSection>

            {/* §4 Anticoagulation Selection & Acute Reperfusion (slate) */}
            <CardSection color="slate" title="4. Antithrombotic Selection (LMWH vs DOACs) &amp; Acute Reperfusion">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>LMWH vs DOAC Selection</strong>
                  <br />&bull; <strong>LMWH is Preferred:</strong> For mucinous adenocarcinomas, NBTE, and patients with active gastrointestinal mucosal lesions or drug-drug interactions with antineoplastics.
                  <br />&bull; <strong>DOACs (Apixaban, Rivaroxaban):</strong> Reasonable alternatives for stable solid tumors with low bleeding risk.
                  <br />&bull; Aspirin alone is insufficient to prevent recurrent arterial thrombosis.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Endovascular Thrombectomy (EVT)</strong>
                  <br />&bull; <strong>Effective for LVO in Cancer:</strong> Successful recanalization rates (TICI 2b/3) and safety profile in cancer patients are comparable to non-cancer patients.
                  <br />&bull; Clot histology often demonstrates high platelet-fibrin and leukocyte content (white clots).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>IV Thrombolysis Precautions</strong>
                  <br />&bull; Exclude hemorrhagic brain metastases (melanoma, RCC, choriocarcinoma, thyroid).
                  <br />&bull; Platelet threshold: Must be &ge;100,000/&micro;L.
                  <br />&bull; Exclude systemic consumptive coagulopathy (INR &gt;1.7, aPTT &gt;40s, or low fibrinogen &lt;150).
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: '2026 Cancer Stroke Statement', cite: 'Navi BB et al. Stroke. 2026.', pmid: '41623113' },
              { label: 'TEACH Trial (LMWH Pilot)', cite: 'Navi BB et al. JAMA Neurol. 2018;75(3):379-381.', pmid: '29309496' },
              { label: 'NBTE Landmark Review', cite: 'Eiken PW et al. Mayo Clin Proc. 2001;76(12):1204-1212.', pmid: '11761501' },
              { label: 'Cancer Stroke Risk Study', cite: 'Navi BB et al. J Am Coll Cardiol. 2017;70(8):926-938.', pmid: '28818202' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// DOMAIN 5: PEDIATRIC STROKE MASTER MODULE (2026 GUIDELINES)
// =====================================================================
export const PediatricStrokeView = () => {
  return (
    <PdfActionBar
      title="Pediatric Ischemic & Hemorrhagic Stroke Master Module (2026 Guidelines)"
      pdfPath="documents/references/Pediatric_Stroke_Master_Module.pdf"
      pdfName="Pediatric_Stroke_Master_Module.pdf"
      iconColorClass="text-purple-600 dark:text-purple-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <PediatricStrokeCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function PediatricStrokeCard() {
  const renderSVG = () => (
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Pediatric Stroke Etiology Distribution and Sickle Cell Disease TCD Stratification" style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />
      
      {/* Panel A: Pediatric Stroke Etiology Distribution */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: CHILDHOOD STROKE ETIOLOGY SPECTRUM</text>
      
      {/* 3 stacked distribution bars */}
      <g transform="translate(18, 38)">
        {/* Arteriopathy (>50%) */}
        <rect x="0" y="0" width="215" height="26" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="12" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">1. Arteriopathies (&gt;50% of AIS)</text>
        <text x="8" y="21" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">FCA/FCA-i (Post-Varicella) • Moyamoya • Dissection</text>

        {/* Cardiac (~30%) */}
        <rect x="0" y="32" width="215" height="26" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="44" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">2. Congenital &amp; Acquired Heart Disease (~30%)</text>
        <text x="8" y="53" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Single Ventricle / Cyanotic CHD • Cardiac Surgery / ECMO</text>

        {/* Hematologic (~15%) */}
        <rect x="0" y="64" width="215" height="26" rx="3" fill="#fff5f5" stroke="var(--red)" strokeWidth="1" />
        <text x="8" y="76" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">3. Hematologic &amp; Genetic (~15%)</text>
        <text x="8" y="85" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Sickle Cell Anemia (HbSS) • Antiphospholipid • Prothrombotic</text>
      </g>
      <text x="126" y="148" fill="var(--ink-mute)" fontSize="4.6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Neonatal Stroke (0–28d): Focal Seizures &bull; Maternal-Placental Factors</text>

      {/* Panel B: Sickle Cell Disease TCD Velocity & STOP Trials */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: SICKLE CELL TCD SCREENING (STOP TRIALS)</text>
      
      {/* TCD Speedometer / Risk zones */}
      <g transform="translate(260, 36)">
        {/* Normal zone */}
        <rect x="0" y="0" width="68" height="42" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="34" y="12" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">NORMAL</text>
        <text x="34" y="24" fill="#166534" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">&lt;170 cm/s</text>
        <text x="34" y="36" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Annual TCD</text>

        {/* Conditional zone */}
        <rect x="74" y="0" width="68" height="42" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
        <text x="108" y="12" fill="#92400e" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">CONDITIONAL</text>
        <text x="108" y="24" fill="#92400e" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">170–199 cm/s</text>
        <text x="108" y="36" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans" textAnchor="middle">Repeat in 3–6m</text>

        {/* Abnormal zone */}
        <rect x="148" y="0" width="67" height="42" rx="3" fill="#fff5f5" stroke="var(--red)" strokeWidth="1.5" />
        <text x="181" y="12" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ABNORMAL</text>
        <text x="181" y="24" fill="var(--red-deep)" fontSize="6.0pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">&ge;200 cm/s</text>
        <text x="181" y="36" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">&gt;90% Stroke &darr;</text>
      </g>

      {/* STOP 1 & 2 Trial Summary Box */}
      <rect x="260" y="84" width="215" height="44" rx="4" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
      <text x="368" y="96" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">STOP TRIAL: Transfusion for TAMMV &ge;200 cm/s</text>
      <text x="266" y="108" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Chronic transfusion (target HbS &lt;30%) cuts primary stroke &gt;90%.</text>
      <text x="266" y="118" fill="var(--ink-soft)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; <strong>STOP-2:</strong> Discontinuing transfusion causes high stroke recurrence.</text>

      <text x="368" y="148" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Acute Stroke: STAT Exchange Transfusion (target HbS &lt;30%, Hb ~10)</text>

      {/* Panel C: Acute Reperfusion Pathway in Children */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--red)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: 2026 PEDIATRIC REPERFUSION PATHWAY</text>
      
      {/* 3 Step Protocol Boxes */}
      <g transform="translate(502, 36)">
        {/* Step 1 */}
        <rect x="0" y="0" width="215" height="24" rx="3" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--ink)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">1. Urgent MRI + MRA Head/Neck</text>
        <text x="8" y="20" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">DWI/ADC confirmation + PedNIHSS severity assessment</text>

        {/* Step 2 */}
        <rect x="0" y="28" width="215" height="26" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
        <text x="8" y="39" fill="#1e40af" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">2. IV Alteplase (0.9 mg/kg, max 90mg)</text>
        <text x="8" y="49" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Children &ge;2 yo with disabling deficit &lt;4.5h under stroke team</text>

        {/* Step 3 */}
        <rect x="0" y="58" width="215" height="28" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="69" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">3. Endovascular Thrombectomy (EVT)</text>
        <text x="8" y="79" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">LVO in children with 3–4 mm mini-stentrievers &amp; 3MAX/4MAX</text>
      </g>
      <text x="609" y="152" fill="var(--purple-deep)" fontSize="4.6pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">FCA: Prednisone 1 mg/kg/day x 1–3m + Aspirin (VIPS study)</text>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-pediatric-stroke">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Pediatric Ischemic &amp; Hemorrhagic Stroke</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              2026 AHA Pediatric Stroke Focused Update &bull; Focal Cerebral Arteriopathy (FCA) &bull; Sickle Cell Disease TCD &bull; Pediatric EVT
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Age Stratification & Arteriopathies (purple) */}
            <CardSection color="purple" title="1. Age Stratification &amp; Childhood Arteriopathies (FCA / Moyamoya)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Neonatal Stroke (0–28 Days)</strong>
                  <br />&bull; <strong>Presentation:</strong> Often manifests as focal clonic seizures, apnea, encephalopathy, or hypotonia (hemiparesis rare initially).
                  <br />&bull; <strong>Etiology:</strong> Maternal-placental thrombosis, chorioamnionitis, perinatal prothrombotic state.
                  <br />&bull; <strong>Antithrombotic:</strong> Anticoagulation is generally withheld unless recurrent thromboembolism or cardiac source is documented.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Focal Cerebral Arteriopathy (FCA / FCA-i)</strong>
                  <br />&bull; <strong>Pathophysiology:</strong> Unilateral, focal stenosis/irregularity of the distal ICA terminus and proximal MCA/ACA.
                  <br />&bull; <strong>Post-Infectious Link:</strong> Strongly associated with preceding Varicella Zoster virus (VZV) or acute URI in the prior 6–12 months (VIPS Study, PMID: 26423434).
                  <br />&bull; <strong>Treatment:</strong> **Oral Prednisone (1 mg/kg/day for 1–3 months)** with a gradual taper to arrest inflammatory vessel progression, combined with **Aspirin (1–5 mg/kg/day)**.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Other Pediatric Arteriopathies</strong>
                  <br />&bull; <strong>Moyamoya Syndrome:</strong> Screen in Down Syndrome, Sickle Cell Disease, Neurofibromatosis Type 1.
                  <br />&bull; <strong>Arterial Dissection:</strong> Frequently triggered by minor neck trauma, trampoline use, sports collisions.
                  <br />&bull; Treat with LMWH or Aspirin for 3–6 months.
                </div>
              </div>
            </CardSection>

            {/* §2 Sickle Cell Disease Stroke Protocols (teal) */}
            <CardSection color="teal" title="2. Sickle Cell Disease (SCD) Primary Prevention &amp; Acute Emergency Protocols">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '130px' }}>Clinical Scenario</th>
                    <th style={{ width: '160px' }}>Diagnostic / TCD Thresholds</th>
                    <th style={{ width: '170px' }}>Evidence-Based Intervention (STOP Trials)</th>
                    <th>Critical Hazards &amp; Target Guardrails</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Primary Stroke Prevention</strong><br />(TCD Screening in HbSS)</td>
                    <td>Annual Transcranial Doppler (TCD) from <strong>age 2 to 16 years</strong>.<br />&bull; Normal: &lt;170 cm/s<br />&bull; Conditional: 170–199 cm/s (re-check in 3–6m)<br />&bull; <strong>Abnormal: &ge;200 cm/s</strong> (TAMMV)</td>
                    <td><strong>STOP Trial Protocol (NEJM 1998):</strong><br />TAMMV &ge;200 cm/s confers ~10%/yr stroke risk. Initiate <strong>chronic monthly transfusion therapy</strong> to maintain HbS &lt;30%.<br />&bull; Achieves <strong>&gt;90% relative risk reduction</strong> in primary stroke.</td>
                    <td><strong>STOP-2 Trial (NEJM 2005):</strong><br /><span style={{ color: 'var(--red-deep)' }}>Discontinuing transfusion after TCD normalizes causes rapid relapse to high risk and stroke. Transfusion must continue indefinitely or transition to Hydroxyurea / Bone Marrow Transplant / Gene Therapy.</span></td>
                  </tr>
                  <tr>
                    <td><strong>Acute Ischemic Stroke in SCD</strong><br />(Emergency Protocol)</td>
                    <td>Acute focal neurological deficit in a child with SCD; urgent Brain MRI with DWI/FLAIR and MRA Head/Neck.</td>
                    <td><strong>STAT EMERGENT EXCHANGE TRANSFUSION</strong><br />(Manual or Automated Erythrocytapheresis):<br />&bull; <strong>Primary Target:</strong> Rapidly reduce <strong>HbS to &lt;30%</strong>.<br />&bull; <strong>Total Hb Target:</strong> Elevate total Hb to <strong>10.0–11.0 g/dL</strong>.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>HYPERVISCOSITY WARNING:</strong> Never administer simple blood transfusions without phlebotomy if baseline Hb &gt;8.5 g/dL, as rapid viscosity elevation triggers catastrophic stroke extension!</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Pediatric Reperfusion & EVT Criteria (amber) */}
            <CardSection color="amber" title="3. Pediatric Acute Reperfusion: Thrombolysis (IVT) &amp; Mechanical Thrombectomy (EVT)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Intravenous Thrombolysis (IV Alteplase)</strong>
                  <br />&bull; <strong>Dosing:</strong> 0.9 mg/kg (max 90 mg; 10% bolus over 1 min, remainder over 60 min).
                  <br />&bull; <strong>Inclusion Criteria:</strong> Children &ge;2 years of age with confirmed arterial ischemic stroke on MRI DWI, disabling deficit (PedNIHSS &ge;4–6), presentation &lt;4.5 hours from onset, and absence of hemorrhage or arteriopathy with high rupture risk (TIPS Study, PMID: 19223687).
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Endovascular Thrombectomy (EVT)</strong>
                  <br />&bull; <strong>Indication (2026 Guidelines):</strong> Recommended for children with anterior circulation large vessel occlusion (ICA terminus, M1 MCA) with salvageable tissue at specialized pediatric stroke centers.
                  <br />&bull; <strong>Technical Device Caliber:</strong> Microcatheter (0.013–0.017&quot;) and mini-stentrievers (3 mm &times; 20 mm or 4 mm &times; 20 mm) or small-caliber aspiration catheters (3MAX / 4MAX) matched to child vessel anatomy.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Diagnostic Imaging Priority</strong>
                  <br />&bull; <strong>MRI Head with DWI/ADC &amp; MRA Head/Neck</strong> is the primary diagnostic imaging modality of choice.
                  <br />&bull; Rapid &quot;Fast-Brain MRI&quot; sequences (5–7 minutes) avoid general anesthesia/sedation in many young children.
                </div>
              </div>
            </CardSection>

            {/* §4 Antithrombotic Selection & Pediatric Dosing (slate) */}
            <CardSection color="slate" title="4. Antithrombotic Regimens &amp; Pediatric Dosing Guide">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Aspirin Antiplatelet Dosing</strong>
                  <br />&bull; <strong>Dose:</strong> <strong>1–5 mg/kg/day</strong> PO (maximum 81–100 mg daily).
                  <br />&bull; First-line for acute ischemic stroke without cardiac source or dissection; continued for secondary prevention for at least 1–2 years.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Therapeutic LMWH (Enoxaparin)</strong>
                  <br />&bull; <strong>Infants &lt;2 months:</strong> 1.5 mg/kg SC q12h.
                  <br />&bull; <strong>Children &gt;2 months:</strong> 1.0 mg/kg SC q12h.
                  <br />&bull; <strong>Monitoring:</strong> Check anti-Xa level 4 hours post-dose (target <strong>0.5–1.0 IU/mL</strong>). Indicated for dissection and cardioembolic stroke.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Rehabilitation &amp; Recovery</strong>
                  <br />&bull; High neuroplasticity in children promotes functional motor/language recovery.
                  <br />&bull; Screen for post-stroke fatigue, executive dysfunction, and epilepsy.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: '2026 Pediatric Update', cite: 'Rivkin MJ et al. JAMA. 2026;335:e26391.', pmid: '41686463' },
              { label: '2019 AHA Pediatric Guidelines', cite: 'Ferriero DM et al. Stroke. 2019;50(3):e51-e96.', pmid: '30686119' },
              { label: 'STOP Trial Landmark', cite: 'Adams RJ et al. N Engl J Med. 1998;339(1):5-11.', pmid: '9647873' },
              { label: 'STOP 2 Trial', cite: 'Adams RJ et al. N Engl J Med. 2005;353(26):2769-2778.', pmid: '16382063' },
              { label: 'TIPS Pediatric Lysis', cite: 'Rivkin MJ et al. Neuroepidemiology. 2009;32(2):103-108.', pmid: '19223687' },
              { label: 'VIPS Arteriopathy Study', cite: 'Fullerton HJ et al. Neurology. 2015;85(17):1459-1466.', pmid: '26423434' },
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
      pdfPath="documents/references/DMVO_MeVO_Management.pdf"
      pdfName="DMVO_MeVO_Management.pdf"
      iconColorClass="text-purple-600 dark:text-purple-400"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Distal Medium Vessel Occlusions Anatomy, Trials, and Decision Algorithm" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Anatomical MeVO Distribution */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: ANATOMICAL MeVO CLASSIFICATION</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="13" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Middle Cerebral Artery (MCA)</text>
        <text x="8" y="23" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; M2: Insular / Sylvian segments (primary division)</text>
        <text x="8" y="31" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; M3: Opercular branches | M4: Cortical terminal branches</text>

        <rect x="0" y="38" width="222" height="34" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="51" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Anterior Cerebral Artery (ACA)</text>
        <text x="8" y="61" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; A2: Post-communicating / vertical infracallosal</text>
        <text x="8" y="69" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; A3: Pericallosal &amp; Callosomarginal | A4/A5: Cortical</text>

        <rect x="0" y="76" width="222" height="38" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="89" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Posterior Cerebral Artery (PCA)</text>
        <text x="8" y="99" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; P2: Ambient / quadrigeminal cisternal segment</text>
        <text x="8" y="107" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; P3: Calcarine &amp; Parieto-occipital | P4: Cortical branches</text>
      </g>

      {/* Panel B: Landmark RCT Summary */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: LANDMARK RCT EVIDENCE (2025–2026)</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="36" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="12" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DISTAL Trial (NEJM 2025; PMID 39908430)</text>
        <text x="6" y="22" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">mRS 0–2: 45.4% EVT vs 48.6% Med (aOR 0.88; p=0.43)</text>
        <text x="6" y="31" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">sICH: 5.8% EVT vs 1.6% Med (p=0.04) &bull; 12m neutral (Lancet 2026)</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="52" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">ESCAPE-MeVO Trial (NEJM 2025; PMID 39908448)</text>
        <text x="6" y="62" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">mRS 0–2: 41.7% EVT vs 43.1% Med (aOR 0.94)</text>
        <text x="6" y="70" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">sICH: 5.4% EVT vs 2.1% Med &bull; Neutral functional effect</text>

        <rect x="0" y="78" width="222" height="36" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="90" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">CHOICE &amp; CHOICE-2 (JAMA 2022 / 2026)</text>
        <text x="6" y="100" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Adjunctive IA Alteplase (0.225 mg/kg) post-successful EVT</text>
        <text x="6" y="109" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Improves mRS 0–1 microvascular reperfusion without &uarr; sICH</text>
      </g>

      {/* Panel C: Clinical Selection Matrix */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: BEDSIDE SELECTION ALGORITHM</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="28" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="12" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">1. Disabling Deficit Threshold</text>
        <text x="8" y="22" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Severe aphasia, dense hemianopia, hand weakness (even if NIHSS &lt;6)</text>

        <rect x="0" y="32" width="221" height="28" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="44" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">2. Anatomical &amp; Caliber Gate (&ge;1.5 mm)</text>
        <text x="8" y="54" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Dominant M2/A2/P2 &bull; Small tortuous vessels (&lt;1.5mm) carry high perforation risk</text>

        <rect x="0" y="64" width="221" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="76" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">3. Tailored Endovascular Tooling</text>
        <text x="8" y="86" fill="var(--ink-soft)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Low-profile 0.013–0.017" microcatheter, 3mm mini-stentriever, 3MAX aspiration</text>
        <text x="8" y="94" fill="var(--purple-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">AHA 2026: Medical lysis first-line; EVT for highly selected disabling refractory cases</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Anatomical Classification & Caliber (purple) */}
            <CardSection color="purple" title="1. Anatomical Classification &amp; Vascular Caliber Guardrails">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Middle Cerebral Artery (MCA)</strong>
                  <br />&bull; <strong>M2 (Sylvian/Insular):</strong> Dominant vs co-dominant trunk (&ge;1.5–2.0 mm). High eloquence: motor/sensory stripe, Broca/Wernicke cortex.
                  <br />&bull; <strong>M3 (Opercular):</strong> Branches within opercular clefts (1.0–1.5 mm).
                  <br />&bull; <strong>M4 (Cortical):</strong> Terminal surface branches (&lt;1.0 mm).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Anterior &amp; Posterior Branches (ACA/PCA)</strong>
                  <br />&bull; <strong>A2/A3 (Pericallosal/Callosomarginal):</strong> Supplies supplementary motor area, leg motor cortex, abulia/mutism territory.
                  <br />&bull; <strong>P2/P3 (Calcarine/Parieto-occipital):</strong> Visual cortex supply; triggers homonymous hemianopia, alexia without agraphia, memory loss.
                  <br />&bull; <strong>Vessel Diameter Rule:</strong> Vessels &lt;1.5 mm diameter have higher wall shear stress and &gt;3x wire perforation risk.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Epidemiology &amp; Burden</strong>
                  <br />&bull; MeVOs account for <strong>25% to 40%</strong> of all acute ischemic strokes.
                  <br />&bull; Up to <strong>30–40%</strong> of patients untreated or under-treated remain permanently disabled at 90 days despite low initial NIHSS.
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark Randomized Trials (teal) */}
            <CardSection color="teal" title="2. Landmark RCT Evidence (DISTAL, ESCAPE-MeVO, CHOICE-2)">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Acute stroke with MeVO (M2/M3, A2/A3, P2/P3) within 24h; n=543 randomized to EVT vs best medical management.</td>
                    <td><strong>Neutral:</strong> 90-day mRS 0–2 was 45.4% in EVT vs 48.6% in control (adjusted OR 0.88; 95% CI 0.63–1.22; p=0.43).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH higher with EVT:</strong> 5.8% vs 1.6% (p=0.04). 12-month outcomes remained neutral (Lancet Neurol 2026; PMID: 42105785). Routine unselected EVT is not supported.</span></td>
                  </tr>
                  <tr>
                    <td><strong>ESCAPE-MeVO</strong><br />(NEJM 2025; PMID: 39908448)</td>
                    <td>MeVO (M2/M3, A2/A3, P2/P3) within 12h of onset with disabling deficit; n=529 randomized.</td>
                    <td><strong>Neutral:</strong> 90-day mRS 0–2 was 41.7% with EVT vs 43.1% with medical care (adjusted OR 0.94; 95% CI 0.68–1.32).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH:</strong> 5.4% in EVT group vs 2.1% in control group. Unselected thrombectomy in minor/moderate MeVO stroke carries procedural risk without net benefit.</span></td>
                  </tr>
                  <tr>
                    <td><strong>CHOICE &amp; CHOICE-2</strong><br />(JAMA 2022 / 2026; PMIDs: 35143603, 42096239)</td>
                    <td>Adjunctive intra-arterial (IA) Alteplase (0.225 mg/kg, max 22.5 mg) infused over 15–30 min after successful recanalization (eTICI 2b–3).</td>
                    <td><strong>Positive:</strong> Significantly improved 90-day mRS 0–1 (adjusted risk difference +18.4%; aOR 1.91).</td>
                    <td><span style={{ color: '#166534' }}>No increase in symptomatic ICH (0% vs 1.7%). Clears downstream distal microvascular microthrombi and improves microcirculatory reperfusion.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Disabling Deficit Evaluation & Patient Selection (amber) */}
            <CardSection color="amber" title="3. Disabling Deficit Evaluation &amp; Patient Selection Pathway">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The "Low NIHSS Disabling" Paradox</strong>
                  <br />&bull; <strong>NIHSS Limitation:</strong> MeVO strokes often score low (NIHSS 2–5) but carry profound life-altering functional disability.
                  <br />&bull; <strong>Disabling Criteria:</strong>
                  <br />&nbsp;&nbsp;&ndash; Complete expressive or receptive aphasia (M2/M3 superior/inferior).
                  <br />&nbsp;&nbsp;&ndash; Complete homonymous hemianopia (P2/P3 or M2 optic radiation).
                  <br />&nbsp;&nbsp;&ndash; Severe isolated hand weakness / plegia ("hand knob" cortical branch).
                  <br />&nbsp;&nbsp;&ndash; Severe spatial neglect / anosognosia.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>2026 AHA/ASA AIS Guideline Recommendation</strong>
                  <br />&bull; <strong>IV Thrombolysis (TNK 0.25 mg/kg):</strong> First-line standard of care for all eligible patients within 4.5h window (Class I, LOE A).
                  <br />&bull; <strong>Endovascular Thrombectomy:</strong> EVT in MeVO is <strong>not indicated for routine/mild unselected cases</strong> (Class IIb/III), but reasonable in <strong>highly selected patients</strong> with proximal dominant branches (&ge;1.5–2.0 mm), large perfusion mismatch, severe disabling deficits, and failing/ineligible for IV thrombolysis.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Collateral &amp; Perfusion Imaging</strong>
                  <br />&bull; <strong>CTP/MRI Mismatch:</strong> Look for large ischemic penumbra (Tmax &gt;6s) with minimal core (rCBF &lt;30% &lt;10–15 mL).
                  <br />&bull; <strong>Leptomeningeal Collaterals:</strong> Robust pial collaterals buy time; poor collaterals predict rapid core expansion.
                </div>
              </div>
            </CardSection>

            {/* §4 Endovascular Micro-Techniques & Perforation Guardrails (slate) */}
            <CardSection color="slate" title="4. Endovascular Micro-Techniques &amp; Perforation Risk Guardrails">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Microcatheter &amp; Device Sizing</strong>
                  <br />&bull; Use low-profile <strong>0.013&quot; to 0.017&quot;</strong> microcatheters.
                  <br />&bull; Deploy mini-stentrievers (<strong>3 mm &times; 20 mm or 2 mm &times; 15 mm</strong>) or low-caliber direct aspiration (<strong>3MAX / 4MAX</strong>).
                  <br />&bull; Avoid oversized (&gt;4 mm) stentrievers in &lt;2 mm vessels due to vessel avulsion risk.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Technical Maneuvers &amp; Safety</strong>
                  <br />&bull; <strong>Gentle Traction:</strong> Minimize passes (&le;2–3 passes maximum).
                  <br />&bull; <strong>Trackability:</strong> Do not force microguidewires past sharp bifurcations; avoid blind forward pushing.
                  <br />&bull; <strong>Vasospasm Prophylaxis:</strong> IA Verapamil (1–2 mg) or Nimodipine for procedure-induced spasm.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>Perforation Emergency Protocol</strong>
                  <br />&bull; Immediate microcatheter balloon occlusion or gentle aspiration.
                  <br />&bull; STAT protamine reversal if heparinized.
                  <br />&bull; Prepare for emergent microcoil embolization if active extravasation persists.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'DISTAL Trial', cite: 'Fischer U et al. N Engl J Med. 2025;392(13):1232-1243.', pmid: '39908430' },
              { label: 'DISTAL 12-Month', cite: 'Fischer U et al. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
              { label: 'ESCAPE-MeVO Trial', cite: 'Goyal M et al. N Engl J Med. 2025;392(13):1244-1254.', pmid: '39908448' },
              { label: 'CHOICE Trial', cite: 'Renú A et al. JAMA. 2022;327(9):826-835.', pmid: '35143603' },
              { label: 'CHOICE-2 Trial', cite: 'Renú A et al. JAMA. 2026.', pmid: '42096239' },
              { label: 'AHA/ASA 2026 AIS Guideline', cite: 'Prabhakaran S et al. Stroke. 2026.', pmid: '41582814' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// DOMAIN 1: EXTENDED WINDOW PERFUSION & MISMATCH
// =====================================================================
export const ExtendedWindowPerfusionView = () => {
  return (
    <PdfActionBar
      title="Extended Window Perfusion & Mismatch Interpretation"
      pdfPath="documents/references/Extended_Window_Perfusion_Mismatch.pdf"
      pdfName="Extended_Window_Perfusion_Mismatch.pdf"
      iconColorClass="text-purple-600 dark:text-purple-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <ExtendedWindowPerfusionCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function ExtendedWindowPerfusionCard() {
  const renderSVG = () => (
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Extended Window Perfusion Imaging, Mismatch Parameters, and Landmark Trials" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Automated Perfusion Map */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: AUTOMATED PERFUSION THRESHOLDS</text>

      {/* Perfusion Brain Graphic */}
      <ellipse cx="65" cy="88" rx="42" ry="46" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1.2" />
      {/* Penumbra area */}
      <ellipse cx="72" cy="85" rx="26" ry="30" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.2" />
      {/* Ischemic core area */}
      <circle cx="70" cy="84" r="12" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.2" />

      <g transform="translate(118, 36)">
        <rect x="0" y="0" width="118" height="32" rx="3" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" />
        <text x="6" y="11" fill="#b91c1c" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">Ischemic Core Volume</text>
        <text x="6" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">rCBF &lt;30% (CTP) or</text>
        <text x="6" y="28" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ADC &lt;620 &mu;m&sup2;/s (DWI)</text>

        <rect x="0" y="36" width="118" height="32" rx="3" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
        <text x="6" y="47" fill="#15803d" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">Hypoperfused Penumbra</text>
        <text x="6" y="56" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Tmax &gt;6.0 seconds</text>
        <text x="6" y="64" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Salvageable tissue zone</text>

        <rect x="0" y="72" width="118" height="42" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="83" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">Mismatch Criteria</text>
        <text x="6" y="93" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Volume: Penumbra - Core &ge;15mL</text>
        <text x="6" y="102" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Ratio: Penumbra / Core &ge;1.8</text>
        <text x="6" y="110" fill="var(--ink-soft)" fontSize="4.0pt" fontFamily="IBM Plex Sans">&bull; Max Core Volume: &lt;70 mL</text>
      </g>

      {/* Panel B: Landmark Extended Window Trials */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: EXTENDED WINDOW TRIALS (6–24H)</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="11" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DAWN Trial (6–24h EVT; PMID 29129157)</text>
        <text x="6" y="21" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Clinical-Core Mismatch (NIHSS vs Core &lt;21–51 mL)</text>
        <text x="6" y="29" fill="#166534" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">mRS 0–2: 49% EVT vs 13% Med (NNT = 2.8)</text>

        <rect x="0" y="38" width="222" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="49" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DEFUSE 3 Trial (6–16h EVT; PMID 29364767)</text>
        <text x="6" y="59" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Perfusion Mismatch (Core &lt;70mL, Ratio &ge;1.8, Vol &ge;15mL)</text>
        <text x="6" y="67" fill="#166534" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">mRS 0–2: 45% EVT vs 17% Med (NNT = 3.6)</text>

        <rect x="0" y="76" width="222" height="38" rx="3" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
        <text x="6" y="87" fill="#7e22ce" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">EXTEND &amp; WAKE-UP (Lysis; PMIDs 31067369, 29766770)</text>
        <text x="6" y="97" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">IV Alteplase in 4.5–9h (EXTEND) or DWI+/FLAIR- (WAKE-UP)</text>
        <text x="6" y="106" fill="#15803d" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">Significant shift to functional independence (mRS 0–1)</text>
      </g>

      {/* Panel C: DWI-FLAIR Mismatch Clock */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: DWI-FLAIR MISMATCH CLOCK</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="50" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="13" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DWI Positive (+) &amp; FLAIR Negative (&ndash;)</text>
        <text x="8" y="24" fill="var(--ink)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Indicates stroke onset &lt;4.5 hours ago (&sim;90% specificity)</text>
        <text x="8" y="34" fill="var(--ink)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Eligible for IV Thrombolysis (WAKE-UP protocol)</text>
        <text x="8" y="44" fill="#15803d" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; mRS 0–1: 53.3% Lysis vs 41.8% Placebo (aOR 1.61)</text>

        <rect x="0" y="56" width="221" height="42" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
        <text x="8" y="69" fill="#9f1239" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DWI Positive (+) &amp; FLAIR Positive (+)</text>
        <text x="8" y="80" fill="var(--ink)" fontSize="4.6pt" fontFamily="IBM Plex Sans">&bull; Indicates completed tissue infarction &gt;4.5 hours old</text>
        <text x="8" y="90" fill="var(--red-deep)" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Ineligible for standard IVT; proceed to CTP / EVT pathway</text>
      </g>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-extended-window-perfusion">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Extended Window Perfusion &amp; Mismatch</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              DAWN (6–24h) &bull; DEFUSE 3 (6–16h) &bull; EXTEND (4.5–9h) &bull; WAKE-UP &bull; 2026 AHA AIS Guideline &bull; CTP &amp; MRI Protocols
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Automated Perfusion Thresholds & Parameters (purple) */}
            <CardSection color="purple" title="1. Automated Perfusion Imaging Parameters &amp; Thresholds">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Ischemic Core Thresholds</strong>
                  <br />&bull; <strong>CT Perfusion (CTP):</strong> Relative Cerebral Blood Flow <strong>rCBF &lt;30%</strong> compared to contralateral normal hemisphere.
                  <br />&bull; <strong>Diffusion MRI:</strong> Apparent Diffusion Coefficient <strong>ADC &lt;620 &times; 10⁻⁶ mm&sup2;/s</strong> on DWI.
                  <br />&bull; Core volume &lt;70 mL (or &lt;50 mL for DAWN criteria).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Hypoperfusion &amp; Penumbra Zones</strong>
                  <br />&bull; <strong>Penumbra:</strong> Time-to-maximum delay <strong>Tmax &gt;6.0 seconds</strong> represents critically hypoperfused tissue at risk of infarction.
                  <br />&bull; <strong>Mismatch Volume:</strong> Absolute difference = <strong>(Tmax &gt;6s volume) &minus; (Core volume) &ge; 15 mL</strong>.
                  <br />&bull; <strong>Mismatch Ratio:</strong> <strong>(Tmax &gt;6s volume) / (Core volume) &ge; 1.8</strong>.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Hypoperfusion Intensity Ratio (HIR)</strong>
                  <br />&bull; <strong>HIR = (Tmax &gt;10s volume) / (Tmax &gt;6s volume)</strong>.
                  <br />&bull; <strong>HIR &lt;0.4:</strong> Favorable collaterals, slow core growth, high salvage potential.
                  <br />&bull; <strong>HIR &gt;0.5:</strong> Poor collaterals, rapid infarct growth ("fast progressor").
                </div>
              </div>
            </CardSection>

            {/* §2 Extended Window Thrombectomy Trials (teal) */}
            <CardSection color="teal" title="2. Extended Window Endovascular Thrombectomy RCTs (6–24 Hours)">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '130px' }}>Trial / Criteria</th>
                    <th style={{ width: '160px' }}>Time Window &amp; Selection Criteria</th>
                    <th style={{ width: '170px' }}>Primary Functional Endpoint</th>
                    <th>Clinical Impact &amp; 2026 Guidelines</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>DAWN Trial</strong><br />(NEJM 2018; PMID: 29129157)</td>
                    <td><strong>6 to 24 hours</strong> from last known well (LKW). Clinical-core mismatch:<br />&bull; Group A: Age &ge;80, NIHSS &ge;10, Core &lt;21 mL<br />&bull; Group B: Age &lt;80, NIHSS &ge;10, Core &lt;31 mL<br />&bull; Group C: Age &lt;80, NIHSS &ge;20, Core 31–50 mL</td>
                    <td><strong>Massive benefit:</strong> 90-day mRS 0–2 was <strong>49% in EVT group vs 13% in control</strong> (36% absolute increase; NNT = 2.8). Utility-weighted mRS 5.5 vs 3.4.</td>
                    <td><span style={{ color: '#166534' }}><strong>Class I, LOE A:</strong> EVT is recommended up to 24h for anterior circulation LVO (ICA terminus / M1) meeting DAWN criteria. Symptomatic ICH was low (6% vs 3%).</span></td>
                  </tr>
                  <tr>
                    <td><strong>DEFUSE 3 Trial</strong><br />(NEJM 2018; PMID: 29364767)</td>
                    <td><strong>6 to 16 hours</strong> from LKW. Automated perfusion mismatch on CTP or MRI:<br />&bull; Ischemic Core &lt;70 mL<br />&bull; Mismatch Ratio &ge;1.8<br />&bull; Mismatch Volume &ge;15 mL</td>
                    <td><strong>High efficacy:</strong> 90-day mRS 0–2 was <strong>45% with EVT vs 17% with medical care</strong> (28% absolute increase; NNT = 3.6). Mortality 14% vs 26% (p=0.05).</td>
                    <td><span style={{ color: '#166534' }}><strong>Class I, LOE A:</strong> Confirms that automated perfusion software reliably identifies late-presenting patients who benefit substantially from EVT up to 16h.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Extended Window Thrombolysis (amber) */}
            <CardSection color="amber" title="3. Extended Window &amp; Wake-Up Thrombolysis (EXTEND, WAKE-UP, TWIST)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>EXTEND Trial (4.5–9.0 Hours &amp; Wake-Up)</strong>
                  <br />&bull; <strong>Protocol:</strong> IV Alteplase (0.9 mg/kg) in patients presenting 4.5–9.0h from onset or with wake-up stroke selected by automated CTP/MRI mismatch (Core &lt;70 mL, Ratio &ge;1.2, Volume &ge;10 mL).
                  <br />&bull; <strong>Result (PMID: 31067369):</strong> Excellent functional outcome (mRS 0–1) achieved in <strong>35.4% vs 29.5%</strong> (adjusted RR 1.44; 95% CI 1.01–2.06; p=0.04).
                  <br />&bull; sICH was 6.2% vs 0.9%; net functional benefit preserved.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>WAKE-UP Trial (MRI-Guided Thrombolysis)</strong>
                  <br />&bull; <strong>Protocol:</strong> Patients with unknown onset / wake-up stroke and <strong>DWI-positive / FLAIR-negative mismatch</strong> on MRI (indicating lesion age &lt;4.5 hours).
                  <br />&bull; <strong>Result (PMID: 29766770):</strong> Favorable outcome (mRS 0–1) at 90 days in <strong>53.3% with Alteplase vs 41.8% with placebo</strong> (adjusted OR 1.61; p=0.02).
                  <br />&bull; 2026 Guideline: Class I recommendation for IV thrombolysis in DWI-FLAIR mismatch wake-up stroke.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>TWIST Negative Control Trial</strong>
                  <br />&bull; <strong>Protocol (PMID: 36549308):</strong> IV Tenecteplase (0.25 mg/kg) in wake-up stroke selected by <strong>Non-Contrast CT alone</strong> (without CTP/MRI).
                  <br />&bull; <strong>Result:</strong> Neutral (mRS 0–1: 44% vs 46%).
                  <br />&bull; <strong>Key Lesson:</strong> Advanced perfusion/MRI selection is <strong>mandatory</strong> for extended window thrombolysis.
                </div>
              </div>
            </CardSection>

            {/* §4 Diagnostic Artifacts & Pitfalls (slate) */}
            <CardSection color="slate" title="4. Diagnostic Pitfalls, Artifacts &amp; Clinical Caveats">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Ghost Core &amp; Early Hyperacute Scans</strong>
                  <br />&bull; In very early scans (&lt;2–3h), severely oligemic tissue with intact membrane function can display rCBF &lt;30% that recovers fully upon immediate reperfusion ("ghost core").
                  <br />&bull; Do not exclude patients from EVT solely based on early large core if time from onset is very short.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Extracranial Stenosis &amp; Delay-Dispersion</strong>
                  <br />&bull; Severe cervical ICA stenosis or tandem occlusion causes contrast arrival delay, artificially inflating Tmax &gt;6s ("pseudo-penumbra").
                  <br />&bull; Cross-reference with CTA and cerebral blood volume (CBV) maps to avoid overestimating salvageable tissue.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Contrast Bolus Truncation</strong>
                  <br />&bull; Insufficient scan acquisition duration (&lt;45–50 seconds) cuts off venous outflow curve, falsely elevating Tmax.
                  <br />&bull; Verify Arterial Input Function (AIF) and Venous Output Function (VOF) curves on raw perfusion slices.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'DAWN Trial', cite: 'Nogueira RG et al. N Engl J Med. 2018;378(1):11-21.', pmid: '29129157' },
              { label: 'DEFUSE 3 Trial', cite: 'Albers GW et al. N Engl J Med. 2018;378(8):708-718.', pmid: '29364767' },
              { label: 'EXTEND Trial', cite: 'Ma H et al. N Engl J Med. 2019;380(19):1795-1803.', pmid: '31067369' },
              { label: 'WAKE-UP Trial', cite: 'Thomalla G et al. N Engl J Med. 2018;379(7):611-622.', pmid: '29766770' },
              { label: 'TWIST Trial', cite: 'Roaldsen MB et al. Lancet Neurol. 2023;22(2):117-126.', pmid: '36549308' },
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
      pdfPath="documents/references/ICH_Blood_Pressure_Expansion.pdf"
      pdfName="ICH_Blood_Pressure_Expansion.pdf"
      iconColorClass="text-red-600 dark:text-red-400"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Acute Intracerebral Hemorrhage Blood Pressure Protocol, INTERACT-3 Care Bundle, and Surgical Criteria" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: SBP Target & Safety Window */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--red)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: HYPERACUTE SBP TARGET ZONE</text>

      <g transform="translate(15, 36)">
        {/* Warning Zone >140 */}
        <rect x="0" y="0" width="222" height="32" rx="3" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" />
        <text x="8" y="12" fill="#b91c1c" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SBP &gt;140–150 mmHg (High Risk)</text>
        <text x="8" y="22" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Drives active hematoma expansion (&gt;33% vol increase in 1st 6h)</text>

        {/* Optimal Green Zone 130-139 */}
        <rect x="0" y="36" width="222" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
        <text x="8" y="49" fill="#166534" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">TARGET: SBP 130–139 mmHg within 1 Hour</text>
        <text x="8" y="59" fill="var(--ink)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; Rapid, smooth IV titration (Nicardipine / Clevidipine)</text>
        <text x="8" y="68" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Minimizes expansion without hypoperfusion (INTERACT-2/3)</text>

        {/* Danger Zone <130 */}
        <rect x="0" y="78" width="222" height="34" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
        <text x="8" y="90" fill="#b45309" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SAFETY FLOOR: SBP &lt;130 mmHg (ATACH-2 Harm)</text>
        <text x="8" y="100" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Excess Acute Kidney Injury (9.0% vs 4.0%) &bull; Avoid precipitous drops</text>
      </g>

      {/* Panel B: INTERACT-3 Care Bundle */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: INTERACT-3 FOUR-PILLAR CARE BUNDLE</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="108" height="52" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="12" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">1. Rapid BP Control</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Target SBP &lt;140</text>
        <text x="6" y="32" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Reach target &lt;1h</text>
        <text x="6" y="42" fill="var(--ink-soft)" fontSize="4.0pt" fontFamily="IBM Plex Sans">Maintain &ge;24–48h</text>

        <rect x="114" y="0" width="108" height="52" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="12" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">2. Glucose Control</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Target 108–180 mg/dL</text>
        <text x="6" y="32" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">(6.0–10.0 mmol/L)</text>
        <text x="6" y="42" fill="var(--ink-soft)" fontSize="4.0pt" fontFamily="IBM Plex Sans">Avoid hypoglycemia</text>

        <rect x="0" y="58" width="108" height="54" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="70" fill="var(--amber-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">3. Normothermia</text>
        <text x="6" y="80" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Core temp &lt;37.5&deg;C</text>
        <text x="6" y="90" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Antipyretics / cooling</text>
        <text x="6" y="100" fill="var(--ink-soft)" fontSize="4.0pt" fontFamily="IBM Plex Sans">Prevents edema flare</text>

        <rect x="114" y="58" width="108" height="54" rx="3" fill="#fff5f5" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="70" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">4. Rapid Reversal</text>
        <text x="6" y="80" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">4F-PCC + Vit K (VKA)</text>
        <text x="6" y="90" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Andexanet / Praxbind</text>
        <text x="6" y="100" fill="var(--red-deep)" fontSize="4.0pt" fontFamily="IBM Plex Sans" fontWeight="700">Door-to-needle &lt;60m</text>
      </g>

      {/* Panel C: Surgical Stratification */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--teal)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: SURGICAL EVACUATION TRIALS</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="34" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="11" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">ENRICH Trial (NEJM 2024; PMID 38598795)</text>
        <text x="6" y="21" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Early MIPS (Trans-sulcal parafascicular surgery &le;24h)</text>
        <text x="6" y="29" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Lobar ICH (30–80mL): superior 180d utility mRS (0.458 vs 0.374)</text>

        <rect x="0" y="38" width="221" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="49" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SWITCH Trial (Lancet 2024; PMID 38761811)</text>
        <text x="6" y="59" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Decompressive craniectomy in severe deep basal ganglia ICH</text>
        <text x="6" y="67" fill="#166534" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Reduced mortality without increasing severe vegetative disability</text>

        <rect x="0" y="76" width="221" height="36" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
        <text x="6" y="87" fill="#b45309" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">TRIDENT (NEJM 2026; PMID 42019018)</text>
        <text x="6" y="97" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Triple fixed-dose pill post-ICH: sustained long-term BP lowering</text>
        <text x="6" y="106" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Significant reduction in recurrent stroke &amp; major vascular events</text>
      </g>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-ich-blood-pressure">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Acute ICH Blood Pressure &amp; Expansion Mitigation</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              INTERACT-2/3 &bull; ATACH-2 &bull; ENRICH &bull; TRIDENT &bull; SWITCH &bull; 2022 AHA/ASA ICH Guidelines &bull; SBP 130–139 Target
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Hyperacute Blood Pressure Protocol (purple) */}
            <CardSection color="purple" title="1. Hyperacute Blood Pressure Protocol &amp; The Renal Safety Floor">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Target Blood Pressure Window</strong>
                  <br />&bull; <strong>Primary Target:</strong> SBP <strong>130–139 mmHg</strong> reached rapidly within <strong>1 hour</strong> of admission.
                  <br />&bull; Maintain continuous SBP &lt;140 mmHg for at least the initial <strong>24 to 48 hours</strong>.
                  <br />&bull; Continuous arterial line monitoring is strongly recommended for smooth titration.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>ATACH-2 Safety Floor (Avoid SBP &lt;130)</strong>
                  <br />&bull; In ATACH-2 (PMID: 27276234), ultra-intensive lowering (SBP 110–139 mmHg) showed <strong>no functional benefit</strong> and significantly increased <strong>renal adverse events (9.0% vs 4.0%; p=0.002)</strong>.
                  <br />&bull; Avoid precipitous drops (&gt;60 mmHg/h drop) or diastolic BP &lt;70 mmHg to prevent coronary/renal hypoperfusion.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Preferred Antihypertensive Agents</strong>
                  <br />&bull; <strong>Nicardipine IV:</strong> 5 mg/h, titrate by 2.5 mg/h q5–15m (max 15 mg/h).
                  <br />&bull; <strong>Clevidipine IV:</strong> 1–2 mg/h, double q90s (max 32 mg/h).
                  <br />&bull; <strong>Labetalol IV:</strong> 10–20 mg boluses q10m (max 300 mg/day).
                  <br />&bull; <strong>Avoid:</strong> Nitroprusside &amp; Hydralazine (elevate ICP).
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark Clinical Trials (teal) */}
            <CardSection color="teal" title="2. Landmark Clinical Trials (INTERACT-2/3, ATACH-2, TRIDENT, FASTEST)">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Favorable ordinal shift in 90-day modified Rankin scale (odds ratio 0.87; 95% CI 0.77–1.00; p=0.04). No excess adverse events.</td>
                    <td><span style={{ color: '#166534' }}>Established the safety and clinical benefit of SBP &lt;140 mmHg target in hyperacute ICH.</span></td>
                  </tr>
                  <tr>
                    <td><strong>INTERACT3</strong><br />(Lancet 2023; PMID: 37245517)</td>
                    <td>Pragmatic stepped-wedge cluster trial (n=7,036) testing a 4-pillar care bundle: BP &lt;140, glucose &lt;180, temp &lt;37.5&deg;C, anticoagulant reversal.</td>
                    <td><strong>Significantly reduced poor outcome:</strong> 90-day mRS 3–6 was 47% in bundle group vs 53% in usual care (adjusted OR 0.86; p=0.007).</td>
                    <td><span style={{ color: '#166534' }}>Structured multi-target bundle implementation delivers substantial real-world clinical recovery.</span></td>
                  </tr>
                  <tr>
                    <td><strong>TRIDENT Trial</strong><br />(NEJM 2026; PMID: 42019018)</td>
                    <td>Fixed-dose triple combination pill (Telmisartan + Amlodipine + Indapamide) vs placebo for long-term BP lowering after ICH.</td>
                    <td>Achieved robust 8–10 mmHg sustained SBP reduction; significantly lowered recurrent stroke and major adverse cardiovascular events.</td>
                    <td><span style={{ color: '#166534' }}>Long-term secondary prevention requires aggressive combination therapy to maintain SBP &lt;130.</span></td>
                  </tr>
                  <tr>
                    <td><strong>FASTEST Trial</strong><br />(Lancet 2026; PMID: 41653933)</td>
                    <td>Ultra-early recombinant Factor VIIa (rFVIIa) within 2 hours of spontaneous ICH onset.</td>
                    <td>Reduced hematoma expansion, but carried an increased risk of arterial thromboembolic complications (myocardial infarction / cerebral ischemia).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}>rFVIIa is not recommended for unselected spontaneous ICH; strict patient selection required.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Surgical Evacuation & Minimally Invasive Surgery (amber) */}
            <CardSection color="amber" title="3. Surgical Evacuation, Minimally Invasive Surgery (ENRICH) &amp; Craniectomy (SWITCH)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>ENRICH Trial: MIPS for Lobar ICH</strong>
                  <br />&bull; <strong>Design (NEJM 2024; PMID: 38598795):</strong> Early Minimally Invasive Parafascicular Surgery (MIPS) within 24h vs medical management for supratentorial ICH (volume 30–80 mL).
                  <br />&bull; <strong>Lobar Subgroup Success:</strong> Superior 180-day utility-weighted mRS (<strong>0.458 vs 0.374; p=0.002</strong>) and lower 30-day mortality (9.3% vs 18.0%).
                  <br />&bull; <strong>Basal Ganglia Subgroup:</strong> Neutral; MIPS did not confer significant functional benefit in deep ganglionic hemorrhage.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>SWITCH Trial: Decompressive Surgery</strong>
                  <br />&bull; <strong>Design (Lancet 2024; PMID: 38761811):</strong> Hemicraniectomy (&ge;12 cm bone flap) + best medical care vs medical care alone in deep supratentorial ICH with deteriorating GCS.
                  <br />&bull; <strong>Result:</strong> Reduced 180-day mortality from 44% to 18% without increasing vegetative dependency.
                  <br />&bull; Indicated as a life-saving rescue maneuver for progressive herniation.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Cerebellar Hemorrhage Rules</strong>
                  <br />&bull; <strong>Emergent Suboccipital Craniectomy:</strong> Mandatory for cerebellar ICH <strong>&gt;3 cm diameter</strong>, brainstem compression, or 4th ventricle obstruction causing acute hydrocephalus (Class I, LOE B).
                  <br />&bull; Place EVD for hydrocephalus, but craniectomy must accompany EVD to prevent upward herniation.
                </div>
              </div>
            </CardSection>

            {/* §4 Expansion Predictors & Neurocritical Management (slate) */}
            <CardSection color="slate" title="4. Expansion Imaging Predictors &amp; Neurocritical Care Bundle">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Imaging Markers of Expansion</strong>
                  <br />&bull; <strong>CTA Spot Sign:</strong> Contrast extravasation into hematoma; &gt;70% sensitivity for rapid expansion.
                  <br />&bull; <strong>Non-Contrast CT Signs:</strong> Black hole sign, blend sign, swirl sign, hypodense island sign (active bleeding).
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Anticoagulation Reversal Speed</strong>
                  <br />&bull; <strong>Warfarin:</strong> 4F-PCC (25–50 IU/kg) + Vitamin K 10 mg IV.
                  <br />&bull; <strong>Factor Xa Inhibitors:</strong> Andexanet alfa or 4F-PCC (50 IU/kg).
                  <br />&bull; <strong>Dabigatran:</strong> Idarucizumab 5 g IV. Door-to-needle target &lt;60 min.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Neurocritical Care Guardrails</strong>
                  <br />&bull; Head of bed &gt;30&deg;, neutral neck alignment.
                  <br />&bull; <strong>Seizures:</strong> Treat clinical seizures; continuous EEG for unexplained stupor. Prophylactic ASMs not routinely recommended.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'INTERACT-2', cite: 'Anderson CS et al. N Engl J Med. 2013;368(25):2355-2365.', pmid: '23713578' },
              { label: 'ATACH-2', cite: 'Qureshi AI et al. N Engl J Med. 2016;375(11):1033-1043.', pmid: '27276234' },
              { label: 'INTERACT3', cite: 'Ma L et al. Lancet. 2023;402(10405):831-840.', pmid: '37245517' },
              { label: 'ENRICH Trial', cite: 'Pradilla G et al. N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
              { label: 'TRIDENT Trial', cite: 'Anderson CS et al. N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
              { label: 'FASTEST Trial', cite: 'Broderick JP et al. Lancet. 2026;407(10528):773-783.', pmid: '41653933' },
              { label: 'SWITCH Trial', cite: 'Beck J et al. Lancet. 2024;403(10441):2289-2298.', pmid: '38761811' },
              { label: '2022 ICH Guideline', cite: 'Greenberg SM et al. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// DOMAIN 3: NOVEL FACTOR XI/XIA INHIBITORS
// =====================================================================
export const FactorXiaInhibitorsView = () => {
  return (
    <PdfActionBar
      title="Novel Factor XI/XIa Inhibitors in Stroke Prevention"
      pdfPath="documents/references/Factor_XIa_Inhibitors.pdf"
      pdfName="Factor_XIa_Inhibitors.pdf"
      iconColorClass="text-purple-600 dark:text-purple-400"
    >
      <ScaledCardWrapper isLandscape={false}>
        <BedsidePocketCardsStyles />
        <FactorXiaInhibitorsCard />
      </ScaledCardWrapper>
    </PdfActionBar>
  );
};

export function FactorXiaInhibitorsCard() {
  const renderSVG = () => (
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Factor XI and XIa Inhibitor Mechanism, Coagulation Uncoupling, and Phase 2/3 Trials" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Uncoupling Thrombosis from Hemostasis */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: UNCOUPLING THROMBOSIS &amp; HEMOSTASIS</text>

      <g transform="translate(15, 36)">
        {/* Intrinsic Pathway (Pathological Thrombosis) */}
        <rect x="0" y="0" width="222" height="52" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="12" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Intrinsic / Contact Activation Pathway (Thrombosis)</text>
        <text x="8" y="23" fill="var(--ink)" fontSize="4.4pt" fontFamily="IBM Plex Sans">FXIIa &rarr; <tspan fontWeight="800" fill="var(--red-deep)">Factor XI / XIa (TARGET)</tspan> &rarr; FIXa &rarr; Thrombin Burst</text>
        <text x="8" y="34" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">&bull; Drives pathological intraluminal thrombus growth &amp; propagation</text>
        <text x="8" y="44" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Inhibiting FXIa blocks occlusive thrombosis without bleeding!</text>

        {/* Extrinsic Pathway (Physiological Hemostasis) */}
        <rect x="0" y="58" width="222" height="54" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="70" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Extrinsic Pathway (Physiologic Hemostasis - INTACT)</text>
        <text x="8" y="81" fill="var(--ink)" fontSize="4.4pt" fontFamily="IBM Plex Sans">Tissue Factor (TF) + Factor VIIa &rarr; Factor Xa &rarr; Initial Fibrin</text>
        <text x="8" y="92" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">&bull; Primary hemostatic seal at vascular injury sites remains active</text>
        <text x="8" y="102" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Preserves baseline mucosal &amp; intracranial bleeding protection</text>
      </g>

      {/* Panel B: Landmark Clinical Trials */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: LANDMARK PHASE 2/3 TRIAL DATA</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="36" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="12" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">OCEANIC-STROKE (NEJM 2026; PMID 41985132)</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Asundexian (50mg daily) + Standard Antiplatelet in AIS</text>
        <text x="6" y="31" fill="#166534" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Reduced recurrence in athero subgroups; no major bleeding increase</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="52" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">PACIFIC-STROKE (Lancet 2022; PMID 36063821)</text>
        <text x="6" y="62" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Asundexian Phase 2: &gt;90% FXIa inhibition with flat bleeding</text>
        <text x="6" y="70" fill="var(--teal-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Low ISTH major bleeding rates indistinguishable from placebo</text>

        <rect x="0" y="78" width="222" height="36" rx="3" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
        <text x="6" y="90" fill="#7e22ce" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">AXIOMATIC-SSP (Lancet Neurol 2024; PMID 38101902)</text>
        <text x="6" y="100" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Milvexian (25–100mg BID) + DAPT: dose-dependent ischemic</text>
        <text x="6" y="109" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">stroke reduction without doubling severe hemorrhage risk</text>
      </g>

      {/* Panel C: Clinical Indications */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: CLINICAL NICHES &amp; DRUG AGENTS</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="34" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="12" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">1. Add-on to Antiplatelet Therapy</text>
        <text x="8" y="22" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">High-risk ICAD, carotid stenosis, recurrent stroke on DAPT</text>
        <text x="8" y="30" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Avoids excess hemorrhage seen when combining DOAC + DAPT</text>

        <rect x="0" y="38" width="221" height="34" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="50" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">2. Severe CKD / End-Stage Renal Disease</text>
        <text x="8" y="60" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Hemodialysis patients where DOACs/Warfarin carry extreme bleeding</text>
        <text x="8" y="68" fill="var(--purple-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">FXIa inhibitors offer hepatic/biliary clearance paths</text>

        <rect x="0" y="76" width="221" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="88" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">3. Drug Agent Formulations</text>
        <text x="8" y="98" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Oral Small Molecules: Asundexian, Milvexian (daily/BID PO)</text>
        <text x="8" y="108" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Monoclonal Antibodies: Abelacimab (monthly SC injection)</text>
      </g>
    </svg>
  );

  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-factor-xia-inhibitors">
        <div className="card-container" style={{ boxSizing: 'border-box' }}>
          <div className="card-content">
            <h1 style={{ textAlign: 'center', marginBottom: '2px' }}>Novel Factor XI/XIa Inhibitors in Stroke Prevention</h1>
            <p style={{ fontSize: '7.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '600' }}>
              Targeting Contact Activation &bull; OCEANIC-STROKE (Asundexian) &bull; PACIFIC-STROKE &bull; AXIOMATIC-SSP (Milvexian) &bull; Abelacimab
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Mechanism of Action: Uncoupling Thrombosis from Hemostasis (purple) */}
            <CardSection color="purple" title="1. Mechanism of Action: Uncoupling Thrombosis from Physiological Hemostasis">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>The Contact Activation Amplifier</strong>
                  <br />&bull; <strong>Factor XI / XIa</strong> operates as the master amplifier of intrinsic coagulation. It is activated by Factor XIIa or feedback from thrombin.
                  <br />&bull; FXIa activation propagates Factor IX &rarr; Factor X activation, driving massive thrombin bursts inside pathological occlusive intraluminal thrombi.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Preservation of Tissue Hemostasis</strong>
                  <br />&bull; In contrast to Factor Xa and Thrombin inhibitors (DOACs), FXIa inhibition does <strong>not</strong> suppress the Extrinsic Tissue Factor (TF/VIIa) pathway.
                  <br />&bull; Initial platelet-fibrin plug formation at sites of vascular trauma remains intact, preventing major gastrointestinal and intracranial hemorrhage.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Genetic Proof-of-Concept</strong>
                  <br />&bull; Humans with congenital Factor XI deficiency (Hemophilia C) have a <strong>significantly reduced incidence of ischemic stroke</strong> and VTE.
                  <br />&bull; They rarely suffer spontaneous major hemorrhages, confirming a wide therapeutic safety margin.
                </div>
              </div>
            </CardSection>

            {/* §2 Landmark Clinical Trials (teal) */}
            <CardSection color="teal" title="2. Landmark Clinical Trials: Asundexian, Milvexian &amp; Abelacimab">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
                <thead>
                  <tr style={{ background: 'var(--teal)' }}>
                    <th style={{ width: '130px' }}>Trial / Agent</th>
                    <th style={{ width: '160px' }}>Design &amp; Study Population</th>
                    <th style={{ width: '170px' }}>Efficacy / Ischemic Outcomes</th>
                    <th>Safety &amp; Bleeding Profile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>OCEANIC-STROKE</strong><br />(NEJM 2026; PMID: 41985132)<br /><em>Asundexian (Oral Small Molecule)</em></td>
                    <td>Phase 3 multinational RCT evaluating <strong>Asundexian 50 mg daily</strong> vs placebo on top of standard-of-care antiplatelet therapy in non-cardioembolic acute ischemic stroke.</td>
                    <td>Demonstrated significant reduction in recurrent ischemic stroke in patients with atherosclerotic disease (carotid/intracranial plaque) and high-risk plaque features.</td>
                    <td><span style={{ color: '#166534' }}><strong>Near-baseline bleeding:</strong> No statistically significant increase in ISTH major bleeding or intracranial hemorrhage compared to antiplatelet monotherapy/DAPT alone.</span></td>
                  </tr>
                  <tr>
                    <td><strong>PACIFIC-STROKE</strong><br />(Lancet 2022; PMID: 36063821)<br /><em>Asundexian Phase 2</em></td>
                    <td>Dose-ranging Phase 2b trial (10 mg, 20 mg, 50 mg daily vs placebo) in 1,808 patients with acute non-cardioembolic ischemic stroke within 48 hours.</td>
                    <td>Dose-dependent FXIa activity suppression (<strong>&gt;90% inhibition with 50 mg</strong>). Post-hoc analysis showed marked reduction in recurrent ischemic stroke in atherosclerotic stroke subgroup (HR 0.36).</td>
                    <td><span style={{ color: '#166534' }}>ISTH major or clinically relevant non-major bleeding was comparable across all dose tiers (2.5%–4.3% vs 3.3% placebo).</span></td>
                  </tr>
                  <tr>
                    <td><strong>AXIOMATIC-SSP</strong><br />(Lancet Neurol 2024; PMID: 38101902)<br /><em>Milvexian (Oral Small Molecule)</em></td>
                    <td>Phase 2b trial testing Milvexian (25, 50, 100 mg BID or daily) + background DAPT (Aspirin + Clopidogrel) for 21 days in 2,366 patients with acute minor stroke or high-risk TIA.</td>
                    <td>Achieved dose-dependent reduction in clinical ischemic stroke recurrence, with highest efficacy at 25–100 mg BID tiers.</td>
                    <td><span style={{ color: '#166534' }}>Bleeding was flat across all doses; no increase in fatal bleeding or symptomatic intracranial hemorrhage compared to DAPT alone.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Clinical Niches & Emerging Indications (amber) */}
            <CardSection color="amber" title="3. Target Clinical Populations &amp; Unmet Needs in Vascular Neurology">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>1. Add-On to Antiplatelets (Solving the DAPT Dilemma)</strong>
                  <br />&bull; Historically, adding oral anticoagulants (Warfarin/DOACs) to antiplatelets doubled major bleeding (APPRAISE-2, COMPASS).
                  <br />&bull; FXIa inhibitors can be safely combined with Aspirin or DAPT in high-risk intracranial atherosclerosis (ICAD) and progressive stroke.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>2. Severe Renal Impairment &amp; ESRD on Dialysis</strong>
                  <br />&bull; DOACs have unpredictable renal clearance and high bleeding in ESRD.
                  <br />&bull; FXIa small molecules and monoclonal antibodies offer hepatic/non-renal clearance profiles without drug accumulation.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>3. High Bleeding-Risk Patients</strong>
                  <br />&bull; Patients with prior lobar ICH, Cerebral Amyloid Angiopathy (CAA), or extensive cerebral microbleeds where DOACs carry prohibitive hemorrhagic risk.
                </div>
              </div>
            </CardSection>

            {/* §4 Drug Class Comparison & Pharmacology (slate) */}
            <CardSection color="slate" title="4. Pharmacology, Dosing Classes &amp; Future Clinical Pipeline">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Oral Small Molecule Inhibitors</strong>
                  <br />&bull; <strong>Asundexian:</strong> Direct, reversible oral FXIa inhibitor; 50 mg PO once daily.
                  <br />&bull; <strong>Milvexian:</strong> Direct competitive FXIa inhibitor; 25–100 mg PO twice daily. Rapid onset &lt;2–4 hours.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Monoclonal Antibodies &amp; ASOs</strong>
                  <br />&bull; <strong>Abelacimab:</strong> Dual FXI/FXIa monoclonal antibody; monthly subcutaneous injection offering &gt;99% continuous FXI suppression.
                  <br />&bull; <strong>Fesomersen (FXI-ASO):</strong> Antisense oligonucleotide reducing hepatic FXI synthesis.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Laboratory Monitoring &amp; Reversal</strong>
                  <br />&bull; FXIa inhibitors prolong <strong>aPTT</strong> (dose-dependent pharmacodynamic marker) without altering PT/INR.
                  <br />&bull; Reversal in catastrophic trauma: 4F-PCC, recombinant activated Factor VII (rFVIIa), or tranexamic acid.
                </div>
              </div>
            </CardSection>

            <CardRefFooter style={{ fontSize: '6.7pt' }} refs={[
              { label: 'OCEANIC-STROKE', cite: 'Sharma M et al. N Engl J Med. 2026;394(15):1467-1479.', pmid: '41985132' },
              { label: 'PACIFIC-STROKE', cite: 'Shoamanesh A et al. Lancet. 2022;400(10363):1604-1616.', pmid: '36063821' },
              { label: 'AXIOMATIC-SSP', cite: 'Sharma M et al. Lancet Neurol. 2024;23(5):450-459.', pmid: '38101902' },
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
      pdfPath="documents/references/Metabolic_Stroke_Prevention.pdf"
      pdfName="Metabolic_Stroke_Prevention.pdf"
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Metabolic Risk Modulation, Incretin Therapies, Blood Pressure Targets, and ABCDE Prevention Bundle" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Multi-Organ Metabolic Protection */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: INCRETIN &amp; SGLT2i ORGAN PROTECTION</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Cerebrovascular &amp; Endothelium</text>
        <text x="8" y="21" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Reduces vascular cell adhesion molecule (VCAM-1) &amp; plaque inflammation</text>
        <text x="8" y="30" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">&bull; Enhances endothelial nitric oxide (eNOS) &amp; blood-brain barrier integrity</text>

        <rect x="0" y="38" width="222" height="34" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="49" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Cardiovascular &amp; Metabolic</text>
        <text x="8" y="59" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; &gt;9–20% sustained body weight loss &bull; Reduces visceral adiposity</text>
        <text x="8" y="68" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">&bull; Improves glycemic control, HbA1c, and epicardial adipose inflammation</text>

        <rect x="0" y="76" width="222" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="87" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Renal &amp; Hemodynamic</text>
        <text x="8" y="97" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; SGLT2i + GLP-1 RA slows CKD progression (FLOW Trial HR 0.76)</text>
        <text x="8" y="106" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Sustained SBP reduction of 3–5 mmHg &amp; natriuresis</text>
      </g>

      {/* Panel B: Landmark RCT Effect Sizes */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: LANDMARK RCT EVIDENCE</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="36" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="12" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SELECT Trial (NEJM 2023; PMID 37952131)</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Semaglutide 2.4mg in non-diabetic obesity with CVD</text>
        <text x="6" y="31" fill="#166534" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">20% MACE Reduction (HR 0.80; p&lt;0.001) &bull; -9.4% body weight</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="52" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">FLOW Trial (NEJM 2024; PMID 38785209)</text>
        <text x="6" y="62" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Semaglutide in T2D + CKD: 24% reduction in major kidney</text>
        <text x="6" y="70" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">events &amp; CV death (HR 0.76; 95% CI 0.66–0.88)</text>

        <rect x="0" y="78" width="222" height="36" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
        <text x="6" y="90" fill="#b45309" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SPRINT &amp; TRIDENT (PMIDs 26551272, 42019018)</text>
        <text x="6" y="100" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Intensive SBP &lt;120/130 targets &bull; Fixed triple-pill strategy</text>
        <text x="6" y="109" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Reduces recurrent stroke, cognitive decline &amp; vascular mortality</text>
      </g>

      {/* Panel C: Secondary Prevention ABCDE Bundle */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: ABCDE SECONDARY PREVENTION BUNDLE</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="22" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="15" fill="var(--purple-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800">A: Antiplatelet / DOAC + Atrial Cardiopathy Screening</text>

        <rect x="0" y="24" width="221" height="22" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="39" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800">B: Blood Pressure Target &lt;130/80 mmHg (&lt;120 if tolerated)</text>

        <rect x="0" y="48" width="221" height="22" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="8" y="63" fill="#1d4ed8" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800">C: Cholesterol (LDL &lt;55 mg/dL: Statin + Ezetimibe &plusmn; PCSK9i)</text>

        <rect x="0" y="72" width="221" height="22" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="87" fill="var(--amber-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800">D: Diabetes &amp; Incretins (GLP-1 RA / SGLT2i + Med Diet)</text>

        <rect x="0" y="96" width="221" height="22" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="111" fill="#166534" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800">E: Exercise (150 min/wk) &amp; Weight Management (BMI &lt;27)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Incretin Therapies: GLP-1 RA & Dual GIP/GLP-1 Agonists (purple) */}
            <CardSection color="purple" title="1. Modern Incretin Therapies (GLP-1 Receptor Agonists &amp; GIP/GLP-1 Co-Agonists)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>SELECT Trial: Obesity Without Diabetes</strong>
                  <br />&bull; <strong>Design (NEJM 2023; PMID: 37952131):</strong> Semaglutide 2.4 mg SC weekly vs placebo in 17,604 non-diabetic patients with preexisting CVD and BMI &ge;27.
                  <br />&bull; <strong>Primary Outcome:</strong> <strong>20% reduction in MACE</strong> (HR 0.80; 95% CI 0.72–0.90; p&lt;0.001) and significant reduction in non-fatal stroke.
                  <br />&bull; <strong>Weight Loss:</strong> Mean 9.4% weight loss sustained at 4 years, with concurrent drops in hs-CRP (&minus;37%) and blood pressure.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>FLOW &amp; SUSTAIN-6 Trials (Type 2 Diabetes)</strong>
                  <br />&bull; <strong>FLOW (NEJM 2024; PMID: 38785209):</strong> Semaglutide 1.0 mg in T2D + CKD reduced kidney disease progression and cardiovascular death by <strong>24% (HR 0.76)</strong>.
                  <br />&bull; <strong>SUSTAIN-6 (NEJM 2016; PMID: 27633186):</strong> Demonstrated a <strong>39% relative reduction in ischemic stroke (HR 0.61; p=0.04)</strong> in T2D patients with high CV risk.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Tirzepatide &amp; Next-Gen Incretins</strong>
                  <br />&bull; <strong>Dual GIP/GLP-1 RA:</strong> Tirzepatide (SURMOUNT / SURPASS) achieves &gt;20% body weight reduction, profound visceral adipose clearance, and robust insulin sensitization.
                  <br />&bull; Retatrutide (Triple GGG) in Phase 3 trials.
                </div>
              </div>
            </CardSection>

            {/* §2 SGLT2 Inhibitors & Cardiorenal Synergy (teal) */}
            <CardSection color="teal" title="2. SGLT2 Inhibitors &amp; Renocardiovascular Multi-Organ Protection">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Inhibits renal tubular glucose and sodium reabsorption &rarr; osmotic diuresis, SBP drop 3–5 mmHg, tubuloglomerular feedback normalization, reduction in arterial stiffness.</td>
                    <td><strong>EMPA-REG, DAPA-CKD, DELIVER:</strong> &gt;30% reduction in heart failure hospitalization and &gt;25% reduction in chronic kidney disease progression.</td>
                    <td><span style={{ color: '#166534' }}>Mitigates atrial stretch and subclinical AF triggers; powerful synergistic cardiorenal protection when combined with GLP-1 RA.</span></td>
                  </tr>
                  <tr>
                    <td><strong>Intensive BP Lowering</strong><br />(SPRINT &amp; RESPECT)</td>
                    <td>Intensive systolic blood pressure control target &lt;120 mmHg vs &lt;140 mmHg.</td>
                    <td><strong>SPRINT (NEJM 2015; PMID: 26551272):</strong> 25% reduction in primary composite CV events; 43% reduction in CV death.<br /><strong>RESPECT (JAMA Neurol 2019; PMID: 31355878):</strong> Lowered recurrent stroke in small vessel disease.</td>
                    <td><span style={{ color: '#166534' }}>Recommended target for high-risk patients with lacunar stroke and intracranial atherosclerosis if tolerated without orthostasis.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Secondary Stroke Prevention ABCDE Bundle (amber) */}
            <CardSection color="amber" title="3. Comprehensive Secondary Stroke Prevention ABCDE Protocol">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>A &amp; B: Antithrombotics &amp; Blood Pressure</strong>
                  <br />&bull; <strong>A (Antithrombotics):</strong> High-risk non-cardioembolic: DAPT for 21d (CHANCE/POINT) or 90d for ICAD (SAMMPRIS). Cardioembolic: DOAC.
                  <br />&bull; <strong>B (Blood Pressure):</strong> SBP &lt;130/80 mmHg (&lt;120 mmHg in selected SVD). TRIDENT fixed-dose triple-pill strategy.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>C &amp; D: Cholesterol &amp; Diabetes/Diet</strong>
                  <br />&bull; <strong>C (Cholesterol):</strong> Target <strong>LDL &lt;55 mg/dL</strong> (Atorvastatin 80 mg + Ezetimibe 10 mg &plusmn; Evolocumab / Alirocumab PCSK9i).
                  <br />&bull; <strong>D (Diabetes/Diet):</strong> HbA1c &lt;7.0% using GLP-1 RA + SGLT2i. High-adherence Mediterranean diet (PREDIMED).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>E: Exercise &amp; Lifestyle Guardrails</strong>
                  <br />&bull; <strong>Exercise:</strong> At least 150 minutes/week of moderate-intensity aerobic physical activity.
                  <br />&bull; <strong>Weight &amp; Sleep:</strong> Target BMI &lt;27 kg/m&sup2; or waist circumference &lt;88cm (W) / &lt;102cm (M). Mandatory screening for obstructive sleep apnea (STOP-BANG).
                </div>
              </div>
            </CardSection>

            {/* §4 MASH & Hepatic-Metabolic Axis (slate) */}
            <CardSection color="slate" title="4. Metabolic Dysfunction-Associated Steatohepatitis (MASH) &amp; Clinical Pearls">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>The Liver-Brain Axis (MASLD / MASH)</strong>
                  <br />&bull; Hepatic steatosis and fibrosis independently increase systemic atherogenic dyslipidemia, elevated ApoB, and stroke risk.
                  <br />&bull; GLP-1 RAs resolve steatohepatitis and reduce liver fibrosis scores.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Home BP Telemonitoring &amp; Compliance</strong>
                  <br />&bull; Use validated automated oscillometric upper-arm cuffs with smartphone sync.
                  <br />&bull; Morning and evening paired measurements; target home SBP &lt;125 mmHg.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Smoking Cessation &amp; Alcohol</strong>
                  <br />&bull; Complete cessation of combustible cigarettes; varenicline / bupropion first-line.
                  <br />&bull; Eliminate heavy alcohol intake (&gt;2 drinks/day triggers hemorrhagic transformation and hypertension).
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
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// __NV_MODULES_END__  (new neurovascular module components are inserted above this line)

export function CraoThrombolysisCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>Central Retinal Artery Occlusion (CRAO): Acute IV Thrombolysis</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            AHA 2021 Scientific Statement &amp; 2025 THEIA Trial Reference Card
          </p>

          <VisualAssetFigure
            src="assets/crao_emergency_workflow.png"
            fallbackSvgSrc="assets/crao_emergency_workflow.svg"
            alt="Central Retinal Artery Occlusion (CRAO) Emergency Thrombolysis Protocol and Ophthalmic Evaluation Workflow within 4.5 Hour Window"
            title="CRAO Emergency Thrombolysis Workflow"
            captionId="crao-caption"
            caption="Emergency Central Retinal Artery Occlusion (CRAO) Thrombolysis Protocol & Diagnostic Workflow"
            onOpenLightbox={setLightboxImage}
          />

          <div className="toast-grid" style={{marginBottom: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card primary">
                <h3>1. CRAO as an Ocular Emergency</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Pathophysiology:</strong> Embolic or thrombotic occlusion of the central retinal artery causing acute inner retinal ischemia ("eye stroke").</li>
                  <li><strong>Time Window:</strong> Irreversible retinal damage occurs within 240 minutes. IV thrombolysis should be initiated within <strong>4.5 hours</strong> of symptom onset.</li>
                  <li><strong>Visual Threshold:</strong> Severe vision loss (count fingers, hand motion, light perception, or visual acuity &le; 20/200).</li>
                </ul>
              </div>
              <div className="toast-card neutral">
                <h3>2. Evidence Base (AHA 2021 &amp; THEIA 2025)</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>AHA Statement 2021 (PMID 33677974):</strong> Recommends acute IV thrombolysis in eligible CRAO presenting &le;4.5h without retinal hemorrhage.</li>
                  <li><strong>THEIA Trial 2025 (PMID 41109232):</strong> Randomized clinical trial showing IV alteplase significantly improved visual recovery (&gt;3 lines improvement) compared to oral aspirin (OR 3.1) when treated within 4.5h.</li>
                </ul>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card alert-orange">
                <h3>3. Key Contraindications &amp; Workup</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Fundoscopy / OCT:</strong> Exclude active retinal hemorrhage, retinal vein occlusion, or optic disc drusen.</li>
                  <li><strong>Standard Lytic Checks:</strong> Recent major bleeding, severe hypertension (SBP &gt;185 or DBP &gt;110), active anticoagulation (INR &gt;1.7 or DOAC within 24h), recent surgery/trauma.</li>
                </ul>
              </div>
              <div className="toast-card alert-red">
                <h3>4. Etiology &amp; Secondary Prevention</h3>
                <p style={{fontSize: '8.2pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                  CRAO is a vascular stroke equivalent. Perform urgent carotid artery imaging (CTA/duplex) for ipsilateral stenosis, ECG/telemetry for paroxysmal AF, and transthoracic echocardiogram. Initiate standard secondary prevention (antiplatelet + high-intensity statin + BP control).
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

          <VisualAssetFigure
            src="assets/select_score_chart.png"
            fallbackSvgSrc="assets/select_score_chart.svg"
            alt="SeLECT Score Nomogram and Risk Stratification Chart for Post-Stroke Seizure Risk Assessment"
            title="SeLECT Score Seizure Risk Chart"
            captionId="select-caption"
            caption="SeLECT Score Risk Stratification Chart for Post-Stroke Seizure Prediction"
            onOpenLightbox={setLightboxImage}
          />

          <div className="toast-grid" style={{marginBottom: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card primary">
                <h3>1. SeLECT Score Criteria (0 to 9 Points)</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Severity (NIHSS):</strong> 0-3 (0 pts), 4-10 (1 pt), &ge;11 (2 pts).</li>
                  <li><strong>Large-artery atherosclerosis (LVO):</strong> Yes (1 pt).</li>
                  <li><strong>Early seizure (&le;7 days):</strong> Yes (3 pts).</li>
                  <li><strong>Cortical involvement:</strong> Yes (2 pts).</li>
                  <li><strong>Territory:</strong> Middle cerebral artery (MCA) territory (1 pt).</li>
                </ul>
              </div>
              <div className="toast-card neutral">
                <h3>2. 1-Year &amp; 5-Year Post-Stroke Epilepsy Risk</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Score 0-1:</strong> 1y risk 0.7-1.2%, 5y risk 1.3-2.4% (Low).</li>
                  <li><strong>Score 2-3:</strong> 1y risk 2.1-3.7%, 5y risk 4.2-7.3% (Moderate).</li>
                  <li><strong>Score 4-5:</strong> 1y risk 6.4-10.9%, 5y risk 12.4-20.3% (High).</li>
                  <li><strong>Score 6-9:</strong> 1y risk 17.9-56.0%, 5y risk 31.6-76.2% (Very High).</li>
                </ul>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card alert-orange">
                <h3>3. Prophylaxis &amp; ASM Guidance</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>No Primary Prophylaxis:</strong> AHA/ASA guidelines do NOT recommend routine primary prophylactic antiseizure medication (ASM) after ischemic stroke.</li>
                  <li><strong>Unprovoked Seizure (&gt;7d):</strong> Meets criteria for Post-Stroke Epilepsy; initiate long-term ASM (Levetiracetam or Lamotrigine).</li>
                </ul>
              </div>
              <div className="toast-card alert-red">
                <h3>4. Drug Selection Considerations</h3>
                <p style={{fontSize: '8.2pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                  Prefer non-enzyme-inducing ASMs (Levetiracetam, Lamotrigine, Lacosamide). Avoid strong CYP3A4/P-gp enzyme-inducing ASMs (Phenytoin, Carbamazepine) in patients receiving DOACs or DAPT due to severe drug interactions.
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

export function EdemaSwellingRiskCard() {
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-container" style={{boxSizing: 'border-box'}}>
        <div className="card-content">
          <h1 style={{textAlign: 'center', marginBottom: '4px'}}>EDEMA Score: Malignant MCA Brain Swelling Risk</h1>
          <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
            Strbian D et al. Stroke 2013 Reference Card (PMID 22405327)
          </p>

          <VisualAssetFigure
            src="assets/edema_swelling_risk.png"
            fallbackSvgSrc="assets/edema_swelling_risk.svg"
            alt="EDEMA Score Risk Stratification Chart for Malignant Cerebral Edema and Swelling Risk in Large Hemisphere Infarction"
            title="EDEMA Score Malignant Swelling Chart"
            captionId="edema-caption"
            caption="EDEMA Score Risk Stratification Chart for Malignant Cerebral Swelling"
            onOpenLightbox={setLightboxImage}
          />

          <div className="toast-grid" style={{marginBottom: '10px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card primary">
                <h3>1. EDEMA Score Criteria (0 to 9 Points)</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>E - Early Infarct signs:</strong> ASPECTS &lt;7 or &gt;1/3 MCA territory (2 pts).</li>
                  <li><strong>D - Dense artery sign:</strong> Hyperdense MCA or basilar sign (1 pt).</li>
                  <li><strong>E - Elevated blood glucose:</strong> Baseline glucose &gt;162 mg/dL / &gt;9 mmol/L (1 pt).</li>
                  <li><strong>M - Mass effect / midline shift:</strong> Sulcal effacement (1 pt) or Midline shift (2 pts).</li>
                  <li><strong>A - Admission NIHSS:</strong> NIHSS 12-19 (1 pt), &ge;20 (2 pts).</li>
                  <li><strong>H - History of Hypertension:</strong> Documented HTN (1 pt).</li>
                </ul>
              </div>
              <div className="toast-card neutral">
                <h3>2. Malignant Swelling Risk Stratification</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Score 0-2 (Low Risk):</strong> &lt;10% risk of severe swelling. Standard neuro-ICU care.</li>
                  <li><strong>Score 3-5 (Moderate Risk):</strong> 20-40% risk of severe brain swelling. Serial CT at 24h or upon deterioration.</li>
                  <li><strong>Score 6-9 (High Risk):</strong> &gt;60-80% risk of malignant MCA syndrome and fatal herniation. Immediate neurosurgery consult.</li>
                </ul>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="toast-card alert-orange">
                <h3>3. Neuro-ICU Medical Management</h3>
                <ul className="toast-card-list" style={{fontSize: '8.3pt'}}>
                  <li><strong>Osmotherapy:</strong> 3% Hypertonic Saline (250 mL IV bolus or 1 mL/kg/h) or Mannitol 0.5-1.0 g/kg for acute ICP spikes.</li>
                  <li><strong>Hemodynamics &amp; Fluids:</strong> Maintain euvolemia with 0.9% NS; target SBP &lt;140 mmHg (&lt;180 post-EVT). Avoid hypotonic fluids and corticosteroids (Class III, Harm).</li>
                </ul>
              </div>
              <div className="toast-card alert-red">
                <h3>4. Surgical Decompression (DHC)</h3>
                <p style={{fontSize: '8.2pt', lineHeight: '1.4', color: 'var(--ink-soft)', marginTop: '4px'}}>
                  Decompressive hemicraniectomy (&ge;12 cm bone flap) within 48h of onset reduces 12-month mortality from 71% to 22% in patients age &le;60 (DECIMAL, DESTINY, HAMLET pooled analysis) and age &gt;60 (DESTINY II).
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

