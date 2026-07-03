import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EvdIcpSimulator } from './simulators/EvdIcpSimulator.jsx';
import { HintsSimulator } from './simulators/HintsSimulator.jsx';
import { PupillometrySimulator } from './simulators/PupillometrySimulator.jsx';
import { NeuroExamsTool } from './simulators/NeuroExamsTool.jsx';
import { SubTabs as V7SubTabs } from './design/primitives.jsx';
import { LandmarkTrialsCard } from './teaching.jsx';
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
        <div className="p-4 border border-red-300 bg-red-50 text-red-900 rounded-lg dark:bg-red-950 dark:text-red-300 dark:border-red-800">
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
    id: 'toast-classification',
    title: 'TOAST Stroke Classification',
    purpose: 'Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.',
    actions: 'toast criteria etiology large artery lacune small vessel cardioembolic undetermined cryptogenic esus workup',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'Original Study', citation: 'Adams HP Jr, et al. TOAST. Stroke. 1993;24:35-41.', pmid: '7678184' },
      { label: 'AHA/ASA Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' }
    ]
  },
  {
    id: 'dapt-regimens',
    title: 'DAPT for Non-Cardioembolic Ischemic Stroke',
    purpose: 'Guideline-directed Dual Antiplatelet Therapy (DAPT) for secondary non-cardioembolic stroke prevention.',
    actions: 'dapt antiplatelet aspirin clopidogrel plavix ticagrelor brilinta point chance chance-2 thales sammpris cyp2c19 genotype resistance',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-05-30',
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
    id: 'stk-core-measures',
    title: 'Stroke Core Measures',
    purpose: 'Reference guide for Joint Commission / GWTG stroke core measures and Comprehensive Stroke Center (CSC) quality metrics.',
    actions: 'quality core measures joint commission gwtg stk-1 stk-2 stk-3 stk-4 stk-5 stk-6 stk-8 stk-10 cstk csc metrics compliance program',
    categories: ['quality', 'pocket-card', 'printable'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'Joint Commission', citation: 'Specifications Manual for Joint Commission National Quality Measures.', pmid: null }
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
      { label: 'STOP-CAD Study', citation: 'Yaghi S, et al. Stroke. 2024;55(4):908-918.', pmid: '38334460' },
      { label: 'IPD Meta-Analysis', citation: 'Kaufmann JE, et al. JAMA Neurol. 2024;81(6):630-637.', pmid: '38739383' },
      { label: 'AHA/ASA 2021 Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'AHA Statement 2024', citation: 'Treatment and Outcomes of Cervical Artery Dissection in Adults. Stroke. 2024;55(3):e84-e107.', pmid: '38301552' },
      { label: 'ESO Guideline 2021', citation: 'European Stroke Organisation guideline for the management of extracranial and intracranial artery dissection. Eur Stroke J. 2021;6(3):XXXIX-LXXXVIII.', pmid: '34528453' }
    ]
  },
  {
    id: 'fibromuscular-dysplasia',
    title: 'Fibromuscular Dysplasia & Stroke',
    purpose: 'Pathophysiology, angiographic classification (multifocal vs. focal), clinical presentation, brain-to-pelvis screening guidelines, and medical/endovascular management of fibromuscular dysplasia (FMD) in stroke patients.',
    actions: 'fmd fibromuscular dysplasia beading string of beads stenosis renal aneurysm carotid vertebral dissection screening vascular consensus',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-06-09',
    references: [
      { label: 'AHA Scientific Statement', citation: 'Olin JW, et al. Fibromuscular dysplasia: state of the science and critical unanswered questions: a scientific statement from the American Heart Association. Circulation. 2014;129(9):1048-1078.', pmid: '24554781' },
      { label: 'First International Consensus', citation: 'Gornik HL, et al. First International Consensus on the Diagnosis and Management of Fibromuscular Dysplasia. Vasc Med. 2019;24(2):164-189.', pmid: '30642231' },
      { label: 'US Registry for FMD', citation: 'Olin JW, et al. The United States Registry for Fibromuscular Dysplasia: results in the first 447 patients. Circulation. 2012;125(25):3186-3195.', pmid: '22615343' },
      { label: 'European FMD Registry', citation: 'Persu A, et al. International consensus on fibromuscular dysplasia: European/International Fibromuscular Dysplasia Registry. J Hypertens. 2021;39(10):2036-2045.', pmid: '33935216' }
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
      { label: 'Consensus Guideline', citation: 'Greer DM, et al. Pediatric and Adult Brain Death/Death by Neurologic Criteria Consensus Practice Guideline. Neurology. 2023;101(24):1112-1132.', pmid: '37827878' },
      { label: 'Ancillary Update', citation: 'Wijdicks EF, et al. Practice parameter update: determining brain death in adults. Neurology. 2010;74(23):1911-1918.', pmid: '20530327' }
    ]
  },
  {
    id: 'stroke-prognosis',
    title: 'Stroke Prognosis & Clinical Scores',
    purpose: 'Clinical prognostic models for acute stroke: ASTRAL and PLAN scores for ischemic stroke, and the ICH Score for spontaneous intracerebral hemorrhage.',
    actions: 'prognosis outcomes astral plan ich score rankin mrs mortality dependency stratification prediction scale bedside',
    categories: ['pocket-card', 'printable'],
    lastReviewed: '2026-06-09',
    references: [
      { label: 'ASTRAL Score', citation: 'Ntaios G, et al. Stroke. 2012;43(8):2170-2176.', pmid: '22738924' },
      { label: 'PLAN Score', citation: 'O\'Donnell MJ, et al. Arch Intern Med. 2012;172(20):1548-1556.', pmid: '23090225' },
      { label: 'ICH Score', citation: 'Hemphill JC 3rd, et al. Stroke. 2001;32(4):891-897.', pmid: '11283388' },
      { label: 'mRS Scale', citation: 'van Swieten JC, et al. Stroke. 1988;19(5):604-607.', pmid: '3363593' }
    ]
  },
  {
    id: 'antiepileptic-drugs',
    title: 'Antiepileptic Drugs & Post-Stroke Seizures',
    purpose: 'Clinical classification of post-stroke seizures, guideline-directed management, comparison of first-line and second-line antiepileptic drugs (ASMs), and post-stroke epilepsy risk scores (SeLECT and IsCHEMiA).',
    actions: 'antiepileptic drugs antiseizure medications asm aed keppra levetiracetam lamotrigine lamictal lacosamide vimpat valproic acid depakote phenytoin dilantin select score ischemia score post-stroke epilepsy seizure prophylaxis',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-06-13',
    references: [
      { label: 'AHA/ASA 2026 Stroke Guideline', citation: 'Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579047' },
      { label: 'AHA/ASA 2023 aSAH Guideline', citation: 'Hoh BL, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54(7):e314-e370.', pmid: '37219934' },
      { label: 'IsCHEMiA Score Validation', citation: 'IsCHEMiA in Vascular Epilepsy: Identifying Risks for Post Stroke Epilepsy. Epilepsy Currents. 2026;26.', pmid: null },
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. SeLECT: a prediction model for late seizures after ischemic stroke. Lancet Neurol. 2018;17(2):143-152.', pmid: '29329707' }
    ]
  },
  {
    id: 'aspirin-failure',
    title: 'Aspirin Failure & Resistance',
    purpose: 'Clinical definition, mechanisms of resistance, diagnostic evaluation, and evidence-based secondary prevention strategies for patients who stroke on aspirin.',
    actions: 'aspirin resistance failure breakthrough stroke antiplatelet clopidogrel dapt wasid caprie sammpris pharmacology compliance nsaid interaction',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-06-18',
    references: [
      { label: 'AHA/ASA 2021 Guideline', citation: 'Kleindorfer DO, et al. 2021 Stroke Prevention. Stroke. 2021;52:e364-e467.', pmid: '34024117' },
      { label: 'WASID Post-Hoc', citation: 'Failure of Antithrombotic Therapy and Risk of Stroke in Patients With Symptomatic Intracranial Stenosis. Stroke. 2009;40:359-364.', pmid: '19064771' },
      { label: 'CAPRIE Trial', citation: 'CAPRIE Steering Committee. Lancet. 1996;348:1329-1339.', pmid: '8932661' },
      { label: 'CHANCE Trial', citation: 'Wang Y, et al. Clopidogrel with Aspirin in Acute Minor Stroke or Transient Ischemic Attack. N Engl J Med. 2013;369:11-19.', pmid: '23803136' },
      { label: 'POINT Trial', citation: 'Johnston SC, et al. Clopidogrel and Aspirin in Acute Ischemic Stroke and High-Risk TIA. N Engl J Med. 2018;379:215-225.', pmid: '29766750' },
      { label: 'INSPIRES Trial', citation: 'Gao Y, et al. Dual Antiplatelet Therapy for Acute Ischemic Stroke or TIA. N Engl J Med. 2024;390:59-69.', pmid: '38157499' },
      { label: 'SAMMPRIS Trial', citation: 'Chimowitz MI, et al. Stenting versus Aggressive Medical Therapy for Intracranial Arterial Stenosis. N Engl J Med. 2011;365:993-1003.', pmid: '21899409' },
      { label: 'COMPASS Trial', citation: 'Connolly SJ, et al. Rivaroxaban with or without Aspirin in Stable Cardiovascular Disease. Lancet. 2018;391:319-328.', pmid: '29141975' },
      { label: 'Narrative Review', citation: 'Sanderson S, et al. Aspirin Resistance and Its Clinical Implications. Ann Intern Med. 2005;142:370-380.', pmid: '15738456' }
    ]
  }
];

// =====================================================================
// MAIN EDUCATION MODULE EXPORT
// =====================================================================
export default function Education({ activeSubTab, onSubTabChange, onBack, copyToClipboard, addToast, navigateTo, isTraineeMode = true }) {
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
  }, [selectedCategory, search]);

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
      iconColorClass="text-purple-600 dark:text-purple-400"
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
      iconColorClass="text-red-600 dark:text-red-400"
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
      iconColorClass="text-purple-600 dark:text-purple-400"
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
            <div className="p-3 mb-4 bg-red-50 text-red-900 border border-red-200 rounded-lg dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60">
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
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_01_toast">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '4px'}}>TOAST Stroke Classification</h1>
    <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
      Trial of Org 10172 in Acute Stroke Treatment (TOAST) diagnostic criteria for ischemic stroke etiology.
    </p>
    
    
    <svg viewBox="0 0 735 120" style={{width: '100%', height: '120px', marginBottom: '8px'}}>
      
      <rect x="0" y="0" width="735" height="120" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      
      
      <rect x="267" y="10" width="200" height="30" rx="15" fill="var(--purple-deep)" />
      <text x="367" y="25" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle" dominantBaseline="central">ACUTE ISCHEMIC STROKE</text>
      
      
      <path d="M 367 40 L 367 55 M 92 55 L 642 55 M 92 55 L 92 80 M 230 55 L 230 80 M 367 55 L 367 80 M 505 55 L 505 80 M 642 55 L 642 80" stroke="var(--purple)" strokeWidth="2" fill="none" />
      
      
      <polygon points="92,85 88,77 96,77" fill="var(--purple)" />
      <polygon points="230,85 226,77 234,77" fill="var(--purple)" />
      <polygon points="367,85 363,77 371,77" fill="var(--purple)" />
      <polygon points="505,85 501,77 509,77" fill="var(--purple)" />
      <polygon points="642,85 638,77 646,77" fill="var(--purple)" />
      
      
      
      <rect x="32" y="85" width="120" height="25" rx="5" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1"/>
      <text x="92" y="101" fill="var(--purple-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Large Artery (LAA)</text>
      
      
      <rect x="170" y="85" width="120" height="25" rx="5" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1"/>
      <text x="230" y="101" fill="var(--teal-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Small Vessel (SVO)</text>
      
      
      <rect x="307" y="85" width="120" height="25" rx="5" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1"/>
      <text x="367" y="101" fill="var(--red-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Cardioembolic (CE)</text>
      
      
      <rect x="445" y="85" width="120" height="25" rx="5" fill="var(--slate-soft)" stroke="var(--slate)" strokeWidth="1"/>
      <text x="505" y="101" fill="var(--slate)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Other Det. (ODE)</text>
      
      
      <rect x="582" y="85" width="120" height="25" rx="5" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1"/>
      <text x="642" y="101" fill="var(--amber-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Undetermined Etiology</text>
    </svg>

    
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
              <strong style={{color: 'var(--red-deep)', fontSize: '8.2pt', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>High-Risk Sources</strong>
              • Atrial Fibrillation / Flutter<br/>
              • Mechanical prosthetic valve<br/>
              • Left atrial / LAA thrombus<br/>
              • Recent anterior MI (&lt;3 mo)<br/>
              • Dilated cardiomyopathy (EF&lt;30%)<br/>
              • Infective endocarditis<br/>
              • Sick sinus syndrome / LA myxoma
            </div>
            <div>
              <strong style={{color: 'var(--amber-deep)', fontSize: '8.2pt', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>Medium-Risk Sources</strong>
              • PFO + Atrial Septal Aneurysm<br/>
              • Mitral valve prolapse<br/>
              • Mitral annulus calcification<br/>
              • Bioprosthetic heart valve<br/>
              • Calcific aortic stenosis<br/>
              • LV dysfunction (EF 30–40%)<br/>
              • LA spontaneous echo contrast
            </div>
          </div>
        </div>
        
        <div className="toast-card alert-orange">
          <h3>5. Undetermined Etiology</h3>
          <ul className="toast-card-list">
            <li><strong>Due to competing risks:</strong> ≥ 2 potential etiologies found (e.g., active AFib AND ≥50% ipsilateral carotid stenosis).</li>
            <li><strong>Negative evaluation:</strong> Complete diagnostic workup identifies no clear source (Cryptogenic stroke).</li>
            <li><strong>Incomplete evaluation:</strong> Workup is unfinished (e.g., patient discharged/AMA before Echo or vascular imaging).</li>
          </ul>
          <div style={{marginTop: '4px', borderTop: '1px dashed rgba(217,134,11,0.3)', paddingTop: '3px', fontSize: '8.8pt', lineHeight: '1.45', color: 'var(--ink-soft)'}}>
            <strong style={{color: 'var(--amber-deep)'}}>ESUS Criteria (Negative evaluation subset):</strong> non-lacunar stroke, no relevant &gt;50% stenosis, no high-risk cardioembolic source, negative ECG/telemetry ≥24 hours.
          </div>
        </div>
      </div>
    </div>

    
    <div style={{borderLeft: '4px solid var(--purple)', background: 'var(--purple-soft)', padding: '12px 15px', borderRadius: '6px', fontSize: '9.5pt', marginBottom: '20px'}}>
      <strong style={{color: 'var(--purple-deep)', textTransform: 'uppercase', fontSize: '9.2pt', letterSpacing: '0.05em', display: 'block', marginBottom: '3px'}}>Required Diagnostic Workup to Complete TOAST Classification</strong>
      <div className="checklist-grid">
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
    
    
    <div className="ref-citation" style={{marginTop: '15px', padding: '10px 12px', fontSize: '8.8pt'}}>
      <strong>Original Study:</strong> Adams HP Jr, et al. TOAST. <em>Stroke</em>. 1993;24:35-41. <a href="https://pubmed.ncbi.nlm.nih.gov/7678184/" target="_blank">PMID: 7678184</a>.<br/>
      <strong>AHA/ASA Guideline:</strong> Kleindorfer DO, et al. 2021 Stroke Prevention. <em>Stroke</em>. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a>.
    </div>
  </div>
</div>
</div>
    </div>
  );
}


export function DaptRegimensCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_03_dapt_regimens landscape-card">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '8px'}}>DAPT for Non-Cardioembolic Ischemic Stroke</h1>

    
    <svg viewBox="0 0 735 240" style={{width: '100%', height: '210px', marginBottom: '6px'}}>
      
      <rect x="0" y="0" width="735" height="240" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      
      
      <rect x="292" y="10" width="150" height="35" rx="6" fill="var(--purple-deep)" />
      <text x="367" y="23" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">ACUTE STROKE / TIA</text>
      <text x="367" y="36" fill="rgba(255,255,255,0.8)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">Non-Cardioembolic Onset</text>
      
      
      <path d="M 367 45 L 367 60 M 120 60 L 615 60 M 120 60 L 120 75 M 367 60 L 367 75 M 615 60 L 615 75" stroke="var(--purple)" strokeWidth="1.5" fill="none"/>
      
      
      <rect x="35" y="75" width="170" height="40" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5"/>
      <text x="120" y="87" fill="var(--teal-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Symptomatic Intracranial</text>
      <text x="120" y="97" fill="var(--teal-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Atherosclerotic Stenosis</text>
      <text x="120" y="108" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">70-99% Stenosis (SAMMPRIS)</text>
      
      <path d="M 120 115 L 120 140" stroke="var(--teal)" strokeWidth="1.5" fill="none"/>
      <polygon points="120,145 117,137 123,137" fill="var(--teal)" />
      
      <rect x="35" y="145" width="170" height="40" rx="6" fill="white" stroke="var(--teal)" strokeWidth="2" style={{filter: 'drop-shadow(0 2px 4px var(--teal-glow))'}}/>
      <text x="120" y="159" fill="var(--teal-deep)" fontSize="9pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ASA + CLOPIDOGREL</text>
      <text x="120" y="172" fill="var(--red-deep)" fontSize="8pt" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">Duration: 90 Days</text>
      
      
      <rect x="252" y="75" width="230" height="42" rx="6" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1.5"/>
      <text x="367" y="88" fill="var(--purple-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Minor Stroke (NIHSS≤3) / TIA</text>
      <text x="367" y="99" fill="var(--purple-deep)" fontSize="7pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Start Clopidogrel + ASA (Day 1)</text>
      <text x="367" y="110" fill="var(--purple-deep)" fontSize="6.5pt" fontFamily="IBM Plex Mono" fontWeight="600" textAnchor="middle">Send CYP2C19 Genotype on Admission</text>
      
      
      <path d="M 367 117 L 367 127 M 290 127 L 444 127 M 290 127 L 290 145 M 444 127 L 444 145" stroke="var(--purple)" strokeWidth="1.5" fill="none"/>
      
      
      <rect x="215" y="145" width="140" height="42" rx="6" fill="white" stroke="var(--red)" strokeWidth="1.5"/>
      <text x="285" y="157" fill="var(--red-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">LOF Carrier (*2, *3)</text>
      <text x="285" y="169" fill="var(--ink-soft)" fontSize="6.5pt" fontFamily="IBM Plex Sans" textAnchor="middle">Results Return (Days 1–3)</text>
      <text x="285" y="180" fill="var(--red-deep)" fontSize="6.5pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Switch to Ticagrelor</text>
      
      <path d="M 285 187 L 285 203" stroke="var(--red)" strokeWidth="1.5" fill="none"/>
      <polygon points="285,203 282,195 288,195" fill="var(--red)" />
      
      <rect x="215" y="203" width="140" height="32" rx="4" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="2"/>
      <text x="285" y="213" fill="var(--red-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ASA + TICAGRELOR</text>
      <text x="285" y="222" fill="var(--red-deep)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Load 180mg STAT, then BID</text>
      <text x="285" y="231" fill="var(--red-deep)" fontSize="6pt" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">Complete 21d DAPT</text>
      
      
      <rect x="375" y="145" width="140" height="42" rx="6" fill="white" stroke="var(--purple)" strokeWidth="1.5"/>
      <text x="445" y="157" fill="var(--purple-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Normal Metabolizer</text>
      <text x="445" y="169" fill="var(--ink-soft)" fontSize="6.5pt" fontFamily="IBM Plex Sans" textAnchor="middle">Results Return (Days 1–3)</text>
      <text x="445" y="180" fill="var(--purple-deep)" fontSize="6.5pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="middle">Continue Clopidogrel</text>
      
      <path d="M 445 187 L 445 203" stroke="var(--purple)" strokeWidth="1.5" fill="none"/>
      <polygon points="445,203 442,195 448,195" fill="var(--purple)" />
      
      <rect x="375" y="203" width="140" height="32" rx="4" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="2"/>
      <text x="445" y="213" fill="var(--purple-deep)" fontSize="7.5pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ASA + CLOPIDOGREL</text>
      <text x="445" y="222" fill="var(--purple-deep)" fontSize="6pt" fontFamily="IBM Plex Sans" textAnchor="middle">Continue Clopidogrel 75mg qD</text>
      <text x="445" y="231" fill="var(--purple-deep)" fontSize="6pt" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">Complete 21d DAPT</text>
      
      
      <rect x="530" y="75" width="170" height="40" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.5"/>
      <text x="615" y="90" fill="var(--amber-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Mild-Mod Stroke (NIHSS≤5)</text>
      <text x="615" y="102" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">Or High-Risk TIA (THALES)</text>
      
      <path d="M 615 115 L 615 140" stroke="var(--amber)" strokeWidth="1.5" fill="none"/>
      <polygon points="615,145 612,137 618,137" fill="var(--amber)" />
      
      <rect x="530" y="145" width="170" height="40" rx="6" fill="white" stroke="var(--amber)" strokeWidth="2" style={{filter: 'drop-shadow(0 2px 4px var(--amber-glow))'}}/>
      <text x="615" y="159" fill="var(--amber-deep)" fontSize="9pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">ASA + TICAGRELOR</text>
      <text x="615" y="172" fill="var(--red-deep)" fontSize="8pt" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">Duration: 30 Days</text>
    </svg>

    
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
          • **Bleeding vs. Benefit**: For minor stroke/high-risk TIA, most DAPT benefit occurs in the first 21 days; extend longer only for selected trial-matched indications such as severe symptomatic intracranial stenosis.
          <br/>• **Post-Lytic / EVT Policy**: After IV alteplase or TNK, avoid antithrombotics for the first 24h until follow-up imaging excludes hemorrhage. EVT alone is not a blanket DAPT contraindication; stenting/angioplasty plans and hemorrhage risk drive the decision.
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

    
    <svg viewBox="0 0 735 65" style={{width: '100%', height: '65px', marginBottom: '8px'}}>
      
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

    
    <svg viewBox="0 0 735 150" style={{width: '100%', height: '150px', marginBottom: '12px'}}>
      
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
    </div>
  );
}const ImageLightbox = ({ src, alt, title, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-slate-950/95 p-4 no-print backdrop-blur-sm cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button 
        type="button"
        className="absolute top-4 right-4 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors focus:outline-none shadow-md z-[260]"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close image preview"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div 
        className="relative w-full flex justify-center items-center p-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 cursor-default"
        style={{ maxHeight: '88vh', maxWidth: '92vw', display: 'flex', flexDirection: 'column', width: 'auto', height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt={alt} 
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
          className="rounded-lg shadow-inner"
        />
        {title && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-[11px] px-3.5 py-1.5 rounded-full font-medium shadow-md flex items-center gap-1.5 backdrop-blur-sm border border-white/10 select-none">
            <span>{title}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};




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
            <div className="bg-emerald-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
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
              <svg viewBox="0 0 280 50" className="w-full max-h-[40px] object-contain select-none" xmlns="http://www.w3.org/2000/svg">
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
                <text x="56" y="24" fill="#3A2368" fontSize="16" fontFamily="'Outfit', sans-serif" fontWeight="900" letterSpacing="1px" className="dark:fill-purple-400">SNACC</text>
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
          <div className="bg-purple-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Signs of Obstructive Hydrocephalus
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 bg-purple-50/20 dark:bg-purple-950/5 border-b border-slate-200 dark:border-slate-800">
            <div className="p-4 border-r border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-xs text-purple-800 dark:text-purple-300 mb-1.5">Clinical Signs:</h5>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                <li>Decline in Level of Consciousness (LOC) or progressive somnolence.</li>
                <li><strong>Parinaud's Syndrome:</strong> Upward gaze palsy (setting sun sign), retraction nystagmus on convergence, and pupillary light-near dissociation.</li>
              </ul>
            </div>
            <div className="p-4">
              <h5 className="font-bold text-xs text-purple-800 dark:text-purple-300 mb-1.5">Radiographic Signs (NCCT Head):</h5>
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
          <i aria-hidden="true" data-lucide="file-output" className="w-5 h-5 text-red-600 dark:text-red-400"></i>
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
      <div className="icp-infographic-card border border-red-200 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        {/* Header */}
        <div className="bg-slate-800 text-white text-center py-3.5 px-4 border-b border-red-200 dark:border-red-900/50">
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
                  <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <span className="font-bold text-red-600 dark:text-red-400">*Cushing triad is a LATE sign of brainstem compression.*</span></li>
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
          <div className="bg-emerald-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Management
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 bg-emerald-50/15 dark:bg-emerald-950/5 border-b border-slate-200 dark:border-slate-800">
            {/* Left Column: General approach */}
            <div className="p-4 space-y-3">
              <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900/40 pb-1 uppercase tracking-wider">General approach</h5>
              <div className="space-y-1">
                <strong className="text-emerald-800 dark:text-emerald-400 block text-xs">Fundamental Measures</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-350">
                  <li>Elevate HOB 30°; strict neutral midline neck alignment to preserve venous outflow.</li>
                  <li>Euvolemia (isotonic saline; avoid hypotonic <code className="text-rose-600 dark:text-rose-450 font-mono text-[10px]">D5W</code>).</li>
                  <li>Temperature &lt; 38.0°C.</li>
                  <li>Normocapnia (target <code className="font-mono">pCO₂</code> 35–45 mmHg).</li>
                  <li>When ICP is monitored, CPP = MAP - ICP; many protocols target CPP around &gt;60 mmHg, individualized to disease context.</li>
                </ul>
              </div>
              <div className="space-y-1">
                <strong className="text-emerald-800 dark:text-emerald-400 block text-xs">Medical Interventions</strong>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 dark:text-slate-350">
                  <li><strong>Analgesia/sedation (fentanyl/propofol):</strong> Target RASS -1 to +1 to prevent coughing, agitation, or ventilator dyssynchrony.</li>
                  <li><strong>Mannitol 20% solution:</strong> 1 g/kg IV bolus over 20–30 min. Must use in-line 0.22-micron filter. <span className="font-semibold text-red-600 dark:text-red-400">Hold if Serum Osmolarity &gt; 320 mOsm/kg OR Osmolar Gap &ge; 20 mOsm/kg.</span></li>
                  <li><strong>Hypertonic Saline (HTS):</strong> 3% (150–250 mL bolus) or 23.4% (30 mL rescue bolus; central line access only). <span className="font-semibold text-red-600 dark:text-red-400">Hold if Serum Sodium &gt; 155–160 mEq/L or Chloride &gt; 115–120 mEq/L.</span></li>
                  <li><strong>Ventilation:</strong> Maintain normocapnia (<code className="font-mono">PaCO2</code> 35–45 mmHg). For impending herniation only, use brief controlled hyperventilation targeting about 30–35 mmHg while definitive therapy is initiated; avoid prophylactic or prolonged hypocapnia.</li>
                  <li><strong>Refractory ICP Elevation:</strong> High-dose barbiturate therapy (pentobarbital) titrated to burst suppression on EEG.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Surgical Management */}
            <div className="p-4 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900/40 pb-1 uppercase tracking-wider">Surgical Management</h5>
              <div className="space-y-1">
                <strong className="text-emerald-800 dark:text-emerald-400 block text-xs">CSF Diversion:</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-350">
                  <li>EVD placement for acute hydrocephalus, intraventricular hemorrhage (IVH), or mass effect with ventriculomegaly.</li>
                </ul>
              </div>
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                <strong className="text-emerald-800 dark:text-emerald-400 block text-xs">Decompressive Surgery:</strong>
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
          <div className="p-4 bg-emerald-50/15 dark:bg-emerald-950/5 border-b border-slate-200 dark:border-slate-800">
            <div className="border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-lg text-slate-700 dark:text-slate-350 text-[11px] leading-relaxed space-y-2">
              <div>
                <strong className="text-red-700 dark:text-red-400 block font-bold mb-1">Management is not necessarily sequential</strong>
                For active herniation or rapid clinical/radiographic deterioration, immediately initiate medical interventions & call Neurosurgery.
              </div>
              <div className="border-t border-red-200/50 dark:border-red-900/50 pt-2 font-semibold text-red-700 dark:text-red-400">
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
              <svg viewBox="0 0 420 150" className="w-full h-auto max-w-[450px] mx-auto block select-none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="w-full border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-red-700 dark:text-red-400 block font-bold mb-1">CPP = MAP - ICP</strong>
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
                <td>IV alteplase initiated at this hospital within 3h for eligible AIS patients arriving within 2h of LKW.</td>
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
      iconColorClass="text-emerald-600 dark:text-emerald-400"
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
    case 4: return "94%";
    default: return "100%";
  }
}

export function StrokePrognosisCalculator() {
  const [activeTab, setActiveTab] = useState('astral'); // 'astral', 'plan', 'ich'

  // ASTRAL state
  const [astralAge, setAstralAge] = useState(65);
  const [astralNihss, setAstralNihss] = useState(10);
  const [astralTimeDelay, setAstralTimeDelay] = useState(false);
  const [astralVisualDefect, setAstralVisualDefect] = useState(false);
  const [astralGlucose, setAstralGlucose] = useState(6.0);
  const [astralGlucoseUnit, setAstralGlucoseUnit] = useState('mmol');
  const [astralLocImpaired, setAstralLocImpaired] = useState(false);

  // PLAN state
  const [planDependence, setPlanDependence] = useState(false);
  const [planCancer, setPlanCancer] = useState(false);
  const [planChf, setPlanChf] = useState(false);
  const [planAfib, setPlanAfib] = useState(false);
  const [planLocReduced, setPlanLocReduced] = useState(false);
  const [planAge, setPlanAge] = useState(65);
  const [planLegWeakness, setPlanLegWeakness] = useState(false);
  const [planArmWeakness, setPlanArmWeakness] = useState(false);
  const [planAphasiaNeglect, setPlanAphasiaNeglect] = useState(false);

  // ICH state
  const [ichGcsCategory, setIchGcsCategory] = useState(0); // 0 = GCS 13-15, 1 = 5-12, 2 = 3-4
  const [ichAge80, setIchAge80] = useState(false);
  const [ichVolume30, setIchVolume30] = useState(false);
  const [ichIvh, setIchIvh] = useState(false);
  const [ichInfratentorial, setIchInfratentorial] = useState(false);

  // 1. ASTRAL Calculation
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

  // 2. PLAN Calculation
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

  // 3. ICH Calculation
  const ichTotal = calculateIchScore({
    gcsCategory: ichGcsCategory,
    age80: ichAge80,
    volume30: ichVolume30,
    ivh: ichIvh,
    infratentorial: ichInfratentorial
  });
  const ichRisk = getIchRisk(ichTotal);

  const resetAstral = () => {
    setAstralAge(65);
    setAstralNihss(10);
    setAstralTimeDelay(false);
    setAstralVisualDefect(false);
    setAstralGlucose(6.0);
    setAstralGlucoseUnit('mmol');
    setAstralLocImpaired(false);
  };

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

  const resetIch = () => {
    setIchGcsCategory(0);
    setIchAge80(false);
    setIchVolume30(false);
    setIchIvh(false);
    setIchInfratentorial(false);
  };

  return (
    <div className="bg-white border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm overflow-hidden dark:bg-card">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interactive Bedside Calculator</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Calculate stroke prognosis metrics in real-time</p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">clinical tool</span>
      </div>

      {/* Tabs Selector */}
      <div className="p-3">
        <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
          <button
            onClick={() => setActiveTab('astral')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'astral'
                ? 'bg-purple-600 text-white shadow-sm'
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
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            ICH Score
          </button>
        </div>
      </div>

      {/* Calculator Inputs Panel */}
      <div className="px-4 pb-4 space-y-4">
        {/* ASTRAL TAB */}
        {activeTab === 'astral' && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">ASTRAL Variables</h4>
            
            {/* Age Slider */}
            <div className="space-y-1 py-2 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Patient Age</span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
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
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
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
                    className="w-16 px-1.5 py-0.5 text-xs text-right font-semibold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <div className="inline-flex rounded bg-slate-100 dark:bg-slate-800 p-0.5 text-[9px] font-bold">
                    <button
                      onClick={() => {
                        if (astralGlucoseUnit === 'mgdl') {
                          setAstralGlucose(parseFloat((parseFloat(astralGlucose) / 18.0).toFixed(1)) || 0);
                          setAstralGlucoseUnit('mmol');
                        }
                      }}
                      className={`px-1 rounded ${astralGlucoseUnit === 'mmol' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
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
                      className={`px-1 rounded ${astralGlucoseUnit === 'mgdl' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
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
              colorClass="bg-purple-600"
            />

            {/* Time delay toggle */}
            <BinaryToggle
              label="Time to Admission > 3 Hours"
              desc="Time from symptom onset (or last-known-well) to admission is > 3 hours"
              value={astralTimeDelay}
              onChange={setAstralTimeDelay}
              colorClass="bg-purple-600"
            />

            {/* LOC toggle */}
            <BinaryToggle
              label="Impaired Level of Consciousness"
              desc="Reduced LOC on admission (NIHSS item 1a > 0)"
              value={astralLocImpaired}
              onChange={setAstralLocImpaired}
              colorClass="bg-purple-600"
            />

            {/* Results */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wide font-bold text-purple-700 dark:text-purple-400">ASTRAL Score Result</span>
                  <h4 className="text-2xl font-black text-purple-900 dark:text-white">{astralTotal} <span className="text-sm font-normal text-slate-500">points</span></h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-purple-700 dark:text-purple-400">90d Poor Outcome (mRS &gt; 2)</span>
                  <h4 className="text-2xl font-black text-purple-900 dark:text-white">{astralRisk}</h4>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-purple-600 transition-all duration-300" 
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
        )}

        {/* PLAN TAB */}
        {activeTab === 'plan' && (
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
        )}

        {/* ICH TAB */}
        {activeTab === 'ich' && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400">ICH Variables</h4>

            {/* GCS Category */}
            <div className="space-y-2 py-1.5 border-b border-slate-100 dark:border-slate-800/40">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Glasgow Coma Scale (GCS)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIchGcsCategory(0)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 0
                      ? 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:border-red-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  13–15 (0 pts)
                </button>
                <button
                  onClick={() => setIchGcsCategory(1)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 1
                      ? 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:border-red-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  5–12 (1 pt)
                </button>
                <button
                  onClick={() => setIchGcsCategory(2)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    ichGcsCategory === 2
                      ? 'bg-red-50 text-red-700 border-red-500 dark:bg-red-950/40 dark:border-red-800'
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
              colorClass="bg-red-700"
            />

            {/* ICH Volume >= 30 toggle */}
            <BinaryToggle
              label="ICH Volume ≥ 30 mL"
              desc="Intracerebral hemorrhage volume estimated at 30 mL or larger"
              value={ichVolume30}
              onChange={setIchVolume30}
              colorClass="bg-red-700"
            />

            {/* IVH toggle */}
            <BinaryToggle
              label="Intraventricular Hemorrhage (IVH)"
              desc="Hemorrhage extension into the ventricles present"
              value={ichIvh}
              onChange={setIchIvh}
              colorClass="bg-red-700"
            />

            {/* Infratentorial toggle */}
            <BinaryToggle
              label="Infratentorial Origin"
              desc="Brainstem or cerebellar origin of hemorrhage (vs. supratentorial)"
              value={ichInfratentorial}
              onChange={setIchInfratentorial}
              colorClass="bg-red-700"
            />

            {/* Results */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wide font-bold text-red-700 dark:text-red-400">ICH Score Result</span>
                  <h4 className="text-2xl font-black text-red-900 dark:text-white">{ichTotal} <span className="text-sm font-normal text-slate-500">points</span></h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-red-700 dark:text-red-400">30d Mortality Risk</span>
                  <h4 className="text-2xl font-black text-red-900 dark:text-white">{ichRisk}</h4>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-red-700 transition-all duration-300" 
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
        )}
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

            <svg viewBox="0 0 735 80" style={{width: '100%', height: '80px', marginBottom: '8px'}}>
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
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>&lt;20</strong><br/><span style={{color: '#2e7d32'}}>&lt;5%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>23</strong><br/><span style={{color: '#2e7d32'}}>15%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>31</strong><br/><span style={{color: '#f57c00'}}>50%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>35</strong><br/><span style={{color: '#e64a19'}}>70%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>40+</strong><br/><span style={{color: '#c62828'}}>&gt;90%</span></div>
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
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>&lt;6</strong><br/><span style={{color: '#2e7d32'}}>0.7%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>9-10</strong><br/><span style={{color: '#2e7d32'}}>4.4%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>13</strong><br/><span style={{color: '#f57c00'}}>15%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>16</strong><br/><span style={{color: '#e64a19'}}>35%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>&gt;19</strong><br/><span style={{color: '#c62828'}}>&gt;65%</span></div>
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
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>0</strong><br/><span style={{color: '#2e7d32'}}>0%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>1</strong><br/><span style={{color: '#2e7d32'}}>13%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>2</strong><br/><span style={{color: '#f57c00'}}>26%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>3</strong><br/><span style={{color: '#e64a19'}}>72%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>4</strong><br/><span style={{color: '#c62828'}}>94%</span></div>
                  <div style={{background: 'white', borderRadius: '3px', padding: '2px'}}><strong>5-6</strong><br/><span style={{color: '#c62828'}}>100%</span></div>
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
    <svg viewBox="0 0 735 110" style={{width: '100%', height: '100%'}}>
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
              <strong>Kaufmann IPD:</strong> *JAMA Neurol*. 2024;81(6):630-637. <a href="https://pubmed.ncbi.nlm.nih.gov/38739383/" target="_blank">PMID: 38739383</a> | <strong>STOP-CAD:</strong> *Stroke*. 2024;55(4):908-918. <a href="https://pubmed.ncbi.nlm.nih.gov/38334460/" target="_blank">PMID: 38334460</a> | <strong>AHA/ASA:</strong> *Stroke*. 2021;52:e364-e467. <a href="https://pubmed.ncbi.nlm.nih.gov/34024117/" target="_blank">PMID: 34024117</a> | <strong>AHA Statement 2024:</strong> *Stroke*. 2024;55:e84-e107. <a href="https://pubmed.ncbi.nlm.nih.gov/38301552/" target="_blank">PMID: 38301552</a> | <strong>ESO Guideline 2021:</strong> *Eur Stroke J*. 2021;6(3):XXXIX-LXXXVIII. <a href="https://pubmed.ncbi.nlm.nih.gov/34528453/" target="_blank">PMID: 34528453</a>
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
      iconColorClass="text-indigo-600 dark:text-indigo-400"
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
    <svg viewBox="0 0 735 120" style={{width: '100%', height: '100%'}}>
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
                      • **Subtype Differences**: Focal FMD patients were significantly younger at diagnosis (mean 39.6 vs. 51.5 years) and had higher rates of severe or refractory hypertension.
                      <br/>• **Aneurysms/Dissections**: Prevalent in both groups; confirmed the need for one-time head-to-pelvis vascular screening.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Citations footer */}
            <div className="ref-citation" style={{marginTop: 'auto', padding: '4px 8px', fontSize: '7.3pt', lineHeight: '1.2'}}>
              <strong>AHA Scientific Statement (2014):</strong> *Circulation*. 2014;129(9):1048-1078. <a href="https://pubmed.ncbi.nlm.nih.gov/24554781/" target="_blank">PMID: 24554781</a><br/>
              <strong>First International Consensus (2019):</strong> *Vasc Med*. 2019;24(2):164-189. <a href="https://pubmed.ncbi.nlm.nih.gov/30642231/" target="_blank">PMID: 30642231</a><br/>
              <strong>US Registry for FMD (2012):</strong> *Circulation*. 2012;125(25):3186-3195. <a href="https://pubmed.ncbi.nlm.nih.gov/22615343/" target="_blank">PMID: 22615343</a><br/>
              <strong>European FMD Registry (2021):</strong> *J Hypertens*. 2021;39(10):2036-2045. <a href="https://pubmed.ncbi.nlm.nih.gov/33935216/" target="_blank">PMID: 33935216</a>
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

const BrainDeathView = () => {
  return (
    <PdfActionBar
      title="Brain Death Determination"
      subtitle="BD/DNC Consensus Guidelines Reference Card"
      pdfPath="documents/references/Brain Death Guidelines.pdf"
      pdfName="Brain Death Guidelines.pdf"
      iconColorClass="text-red-600 dark:text-red-400"
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
            <svg viewBox="0 0 735 90" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
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
              <strong>Consensus Guideline:</strong> Greer DM, et al. Pediatric and Adult Brain Death/Death by Neurologic Criteria Consensus Practice Guideline. <em>Neurology</em>. 2023;101(24):1112-1132. <a href="https://pubmed.ncbi.nlm.nih.gov/37827878/" target="_blank">PMID: 37827878</a>.<br/>
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
      iconColorClass="text-violet-600 dark:text-violet-400"
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
            <svg viewBox="0 0 735 90" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
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
              <strong>AIS Guidelines:</strong> Prabhakaran S et al. Stroke. 2026. <a href="https://pubmed.ncbi.nlm.nih.gov/41582814/" target="_blank">PMID: 41582814</a>. | <strong>ICH Guidelines:</strong> Greenberg SM et al. Stroke. 2022. <a href="https://pubmed.ncbi.nlm.nih.gov/35579047/" target="_blank">PMID: 35579047</a>.<br/>
              <strong>IsCHEMiA Score:</strong> Epilepsy Currents. 2026. | <strong>SeLECT Score:</strong> Galovic M et al. Lancet Neurol. 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29329707/" target="_blank">PMID: 29329707</a>.
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
      iconColorClass="text-amber-600 dark:text-amber-400"
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
              AHA/ASA 2021 Secondary Prevention Guidelines &amp; Landmark Trial Reference.
            </p>

            <svg viewBox="0 0 735 125" style={{width: '100%', height: '125px', marginBottom: '10px'}}>
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
                    <li><strong>Short-Term DAPT Escalation:</strong> For minor stroke (NIHSS &le; 3) or high-risk TIA (ABCD&sup2; &ge; 4), escalate to DAPT (Aspirin + Clopidogrel) for 21 days (CHANCE/POINT) or up to 90 days (INSPIRES).</li>
                    <li><strong>Severe Symptomatic Stenosis:</strong> Initiate Aspirin + Clopidogrel for 90 days + intensive risk control per SAMMPRIS protocol (PMID: 21899409).</li>
                    <li><strong>Polyvascular Disease:</strong> Consider dual pathway inhibition (low-dose Rivaroxaban 2.5mg BID + Aspirin 100mg daily) per COMPASS trial (PMID: 29141975).</li>
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
              <strong>CHANCE:</strong> N Engl J Med 2013. <a href="https://pubmed.ncbi.nlm.nih.gov/23803136/" target="_blank">PMID: 23803136</a>. | <strong>POINT:</strong> N Engl J Med 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29766750/" target="_blank">PMID: 29766750</a>. | <strong>INSPIRES:</strong> N Engl J Med 2024. <a href="https://pubmed.ncbi.nlm.nih.gov/38157499/" target="_blank">PMID: 38157499</a>.<br/>
              <strong>SAMMPRIS:</strong> N Engl J Med 2011. <a href="https://pubmed.ncbi.nlm.nih.gov/21899409/" target="_blank">PMID: 21899409</a>. | <strong>COMPASS:</strong> Lancet 2018. <a href="https://pubmed.ncbi.nlm.nih.gov/29141975/" target="_blank">PMID: 29141975</a>. | <strong>Review:</strong> Ann Intern Med 2005. <a href="https://pubmed.ncbi.nlm.nih.gov/15738456/" target="_blank">PMID: 15738456</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

