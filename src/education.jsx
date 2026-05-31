import React, { useState, useMemo, useEffect } from 'react';
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
const EDUCATION_BANNER_TEXT = "Generic educational reference only — synthetic demonstration content, not official institutional policy and not endorsed by any named institution. Example call chains, role labels, and policy targets are illustrative; verify and replace them with your own current local protocols at the bedside.";

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
    id: "csc-quality",
    title: "CSC Quality Metrics & Epic Guide",
    purpose: "Ensure resident documentation complies with Comprehensive Stroke Center (CSC) certification requirements, Joint Commission guidelines, and safe transitions.",
    actions: "Assess and checklist patient compliance targets for core STK metrics from admission to discharge.",
    categories: ["pocket-card", "epic", "quality"],
    lastReviewed: "2026-05-20",
    status: "Needs Local Review",
    citations: "Joint Commission Stroke Core Measures (STK-1 to STK-10); CMS QualityNet.",
    references: [
      {
        label: "Joint Commission Manual",
        citation: "The Joint Commission. Specifications Manual for National Hospital Inpatient Quality Measures. 2026.",
        url: "https://manual.jointcommission.org"
      },
      {
        label: "GWTG-Stroke Core Measures",
        citation: "AHA/ASA. Get With The Guidelines-Stroke Measure Specifications. 2025.",
        url: "https://qualitynet.cms.gov"
      }
    ],
    placeholders: ["CONFIRM_CSC_METRIC_OWNER", "CONFIRM_FINAL_REQUIRED_FIELDS", "CONFIRM_FINAL_STROKE_CENTER_REPORTING_FIELDS", "CONFIRM_WHICH_ITEMS_ARE_PUBLIC_SAFE"]
  },
  {
    id: "evd-icp",
    title: "EVD / ICP & Herniation Bedside Guide",
    purpose: "Understand EVD leveling, zeroing, ICP monitoring, waveform interpretation, and acute rescue steps for intracranial hypertension.",
    actions: "Calibrate pressure drains, inspect wave compliance, and simulate bedside rescue workflows for herniation.",
    categories: ["pocket-card", "icu", "printable", "simulators"],
    lastReviewed: "2026-05-15",
    status: "Needs Specialist Review",
    citations: "Neurocritical Care Society Consensus Guidelines; Brain Trauma Foundation Guidelines.",
    references: [
      {
        label: "AHA/ASA Guidelines",
        citation: "Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. Stroke. 2026. DOI: 10.1161/STR.0000000000000513.",
        pmid: "41582814"
      },
      {
        label: "Cerebral Edema",
        citation: "Wijdicks EF, et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. Stroke. 2014;45:1222-1238.",
        pmid: "24481970"
      },
      {
        label: "NCS Guidelines",
        citation: "Cook AM, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. Neurocrit Care. 2020;32:647-666.",
        pmid: "32227294"
      }
    ],
    placeholders: ["CONFIRM_HERNIATION_PHONE", "CONFIRM_NCC_CALL_CHAIN", "CONFIRM_NSGY_CALL_CHAIN", "CONFIRM_LOCAL_OSMOTHERAPY_PROTOCOL"]
  },
  {
    id: "note-routing",
    title: "Stroke Note Routing Card",
    purpose: "Provide a quick, logic-based roadmap for residents to direct note routing and co-signatures to the correct attending physician.",
    actions: "Query the routing tree based on setting, time, and scenario to find signature codes and attending roles.",
    categories: ["pocket-card", "printable"],
    lastReviewed: "2026-05-18",
    status: "Needs Admin Review",
    citations: "Residency compliance & billing guidelines (your program).",
    references: [
      {
        label: "UW Medicine Compliance",
        citation: "University of Washington Neurology Residency Compliance & Billing Guidelines. 2026."
      },
      {
        label: "CMS Regulations",
        citation: "Centers for Medicare & Medicaid Services (CMS). Guidelines for Teaching Physicians, Interns, and Residents. 2025."
      }
    ],
    placeholders: ["CONFIRM_ED_DISCHARGE_ROUTING", "CONFIRM_NON_NEURO_ADMISSION_ROUTING", "CONFIRM_WEEKEND_HOLIDAY_ROUTING", "CONFIRM_MORNING_REPORT_ROUTING", "CONFIRM_FINAL_ATTENDING_LABELS"]
  },
  {
    id: "epic-templates",
    title: "Epic Stroke Note SmartPhrases Guide",
    purpose: "Guide residents on structured template composition to capture billing requirements and quality metrics automatically.",
    actions: "Toggle clinical milestones to generate, preview, and copy standardized SmartPhrase notes.",
    categories: ["epic"],
    lastReviewed: "2026-05-12",
    status: "Needs IT Review",
    citations: "Local neurosciences EMR templates committee (your build).",
    references: [
      {
        label: "EMR Guidelines",
        citation: "UW Medicine Clinical Documentation Standards Committee. Evaluation and Management (E/M) Guidelines. 2025."
      }
    ],
    placeholders: ["CONFIRM_EPIC_BUILD_OWNER", "CONFIRM_NEUROSCIENCE_IT_APPROVAL", "CONFIRM_TEMPLATE_FINAL_TEXT", "CONFIRM_GO_LIVE_DATE"]
  },
  {
    id: "ctp",
    title: "Simplified CTP Metrics Resident Card",
    purpose: "Bedside interpretation guidelines for Computed Tomography Perfusion (CTP) to determine late-window IVT and EVT eligibility.",
    actions: "Calculate core vs penumbra volumes, mismatch ratio, and check DEFUSE-3/DAWN late-window eligibility.",
    categories: ["pocket-card", "printable"],
    lastReviewed: "2026-05-24",
    status: "Clinical Reference",
    citations: "DAWN Trial (NEJM 2018); DEFUSE 3 Trial (NEJM 2018); AHA/ASA Stroke Guidelines.",
    references: [
      {
        label: "DAWN Trial",
        citation: "Nogueira RG, et al. Thrombectomy 6 to 24 Hours after Stroke with a Mismatch between Deficit and Infarct. N Engl J Med. 2018;378(1):11-21.",
        pmid: "29129157"
      },
      {
        label: "DEFUSE 3 Trial",
        citation: "Albers GW, et al. Thrombectomy for Stroke at 6 to 16 Hours with Selection by Perfusion Imaging. N Engl J Med. 2018;378(8):708-718.",
        pmid: "29364767"
      },
      {
        label: "AHA/ASA Guidelines",
        citation: "Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. Stroke. 2026. DOI: 10.1161/STR.0000000000000513.",
        pmid: "41582814"
      }
    ],
    placeholders: []
  },
  {
    id: "trials",
    title: "Stroke Trials Bedside Reference",
    purpose: "Quick-reference directory of active and key landmark clinical trials for resident screening and patient enrollment.",
    actions: "Screen acute features interactively against SELECT2, ELAN, and ENRICH eligibility protocols.",
    categories: ["trials", "printable"],
    lastReviewed: "2026-05-28",
    status: "Recruiting / Active",
    citations: "National ClinicalTrials.gov Registry.",
    references: [
      {
        label: "SELECT2 Trial",
        citation: "Sarraj A, et al. Trial of Endovascular Thrombectomy for Large Ischemic Strokes. N Engl J Med. 2023;388:1259-1271.",
        pmid: "36762865"
      },
      {
        label: "ELAN Trial",
        citation: "Fischer U, et al. Early versus Late Anticoagulation in Stroke with Atrial Fibrillation. N Engl J Med. 2023;388:2411-2421.",
        pmid: "37222476"
      },
      {
        label: "ENRICH Trial",
        citation: "Pradilla G, et al. Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage. N Engl J Med. 2024;390:1277-1289.",
        pmid: "38598795"
      }
    ],
    placeholders: ["CONFIRM_TRIAL_CONTACT", "CONFIRM_TRIAL_STATUS", "CONFIRM_PUBLIC_TELENEUROLOGY_TEXT"]
  },
  {
    id: "pediatric-stroke",
    title: "Pediatric Stroke & PedNIHSS Card",
    purpose: "Outline the key clinical differences, risk profiles, diagnostic pathways, and call chains for acute pediatric stroke.",
    actions: "Score the PedNIHSS scale, check childhood stroke etiologies, and triage pathways.",
    categories: ["pediatrics"],
    lastReviewed: "2026-05-10",
    status: "Needs Pediatric Review",
    citations: "AHA/ASA Management of Stroke in Infants and Children Guidelines.",
    references: [
      {
        label: "Pediatric Stroke Guideline",
        citation: "Ferriero DM, et al. Management of Stroke in Infants and Children: A Scientific Statement From the American Heart Association/American Stroke Association. Stroke. 2019;50(3):e51-e96.",
        pmid: "30686116"
      },
      {
        label: "PedNIHSS Study",
        citation: "Ichord RN, et al. Reliability of the pediatric National Institutes of Health Stroke Scale (PedNIHSS) in pediatric stroke. Stroke. 2011;42(3):682-688.",
        pmid: "21257827"
      }
    ],
    placeholders: ["CONFIRM_PED_STROKE_ACTIVATION", "CONFIRM_PED_IMAGING_PROTOCOL", "CONFIRM_PED_NEURO_CALL_CHAIN"]
  },
  {
    id: "aspects",
    title: "ASPECTS & PC-ASPECTS Scoring Guide",
    purpose: "Review brain regions and scoring instructions for Alberta Stroke Program Early CT Score in anterior and posterior circulation strokes.",
    actions: "Interactively select affected MCA or Posterior Circulation regions to calculate ASPECTS deficit scores.",
    categories: ["pocket-card", "printable"],
    lastReviewed: "2026-05-22",
    status: "Clinical Reference",
    citations: "Barber et al., Lancet 2000 (ASPECTS); Puetz et al., AJNR 2008 (PC-ASPECTS).",
    references: [
      {
        label: "ASPECTS Study",
        citation: "Barber PA, et al. Validity and reliability of a quantitative computed tomography score in predicting outcome of hyperacute stroke: the ASPECTS study. Lancet. 2000;355(9216):1670-1674.",
        pmid: "10829616"
      },
      {
        label: "PC-ASPECTS Study",
        citation: "Puetz V, et al. Reliability and clinical guidance of posterior circulation ASPECTS. AJNR Am J Neuroradiol. 2008;29(8):1511-1518.",
        pmid: "18524884"
      }
    ],
    placeholders: []
  },
  {
    id: "ich-triage-reversal",
    title: "ICH Triage & Reversal Protocols",
    purpose: "Bedside guidelines for spontaneous Intracerebral Hemorrhage triage, antiplatelet/anticoagulant reversal, and neurosurgical consults.",
    actions: "Input exposures and patient weight to calculate reversal dosing (PCC, Vitamin K) and BP targets.",
    categories: ["pocket-card", "icu"],
    lastReviewed: "2026-05-29",
    status: "Needs Policy Update",
    citations: "AHA/ASA Intracerebral Hemorrhage Guidelines (2022); PATCH Trial (Lancet 2016); ANNEXA-I Trial (NEJM 2024).",
    references: [
      {
        label: "AHA/ASA ICH Guideline",
        citation: "Greenberg SM, et al. 2022 Guideline for the Management of Patients with Spontaneous Intracerebral Hemorrhage. Stroke. 2022.",
        pmid: "35579034"
      },
      {
        label: "PATCH Trial",
        citation: "Baharoglu MI, et al. Platelet transfusion versus standard care after acute stroke due to spontaneous intracerebral haemorrhage associated with antiplatelet therapy (PATCH). Lancet. 2016;387(10038):2605-2613.",
        pmid: "27178009"
      },
      {
        label: "ANNEXA-I Trial",
        citation: "Connolly SJ, et al. Andexanet for Factor Xa Inhibitor-Associated Acute Intracerebral Hemorrhage. N Engl J Med. 2024.",
        pmid: "38749032"
      }
    ],
    placeholders: ["CONFIRM_FINAL_INR_THRESHOLD", "CONFIRM_ICH_BP_TARGETS", "CONFIRM_STABILITY_SCAN_TIMING", "CONFIRM_NSGY_SURGICAL_TRIAGE_TEXT"]
  },
  {
    id: "dvt-prophylaxis",
    title: "Post-Stroke DVT Prophylaxis Card",
    purpose: "Standardize timing and choice of mechanical and pharmacologic VTE prophylaxis after ischemic or hemorrhagic strokes.",
    actions: "Generate mechanical and LMWH/UFH prophylaxis schedules adjusted for thrombolytics or procedures.",
    categories: ["pocket-card", "quality"],
    lastReviewed: "2026-05-14",
    status: "Needs Quality Review",
    citations: "AHA/ASA Prevention of DVT in Stroke Guidelines; GWTG Measure Specifications.",
    references: [
      {
        label: "ACCP Guidelines",
        citation: "Lansberg MG, et al. Antithrombotic and Thrombolytic Therapy for Ischemic Stroke: Antithrombotic Therapy and Prevention of Thrombosis, 9th ed: American College of Chest Physicians Evidence-Based Clinical Practice Guidelines. Chest. 2012;141(2 Suppl):e601S-e636S.",
        pmid: "22383780"
      },
      {
        label: "CLOTS 3 Trial",
        citation: "Dennis M, et al. Effectiveness of intermittent pneumatic compression in reduction of risk of deep vein thrombosis in patients who have had a recent stroke (CLOTS 3). Lancet. 2013;382(9891):516-524.",
        pmid: "23727163"
      }
    ],
    placeholders: ["CONFIRM_DVT_PPX_TIMING_AIS", "CONFIRM_DVT_PPX_TIMING_POST_IVT", "CONFIRM_DVT_PPX_TIMING_ICH", "CONFIRM_DVT_PPX_AFTER_EVD"]
  },
  {
    id: "pupillometry",
    title: "Clinical Pupillometry & NPi Bedside Guide",
    purpose: "Bedside primer on the use and interpretation of the Neurological Pupil Index (NPi) for monitoring patients at risk of herniation.",
    actions: "Observe interactive pupillary constriction velocities, pupil sizes, and critical herniation parameters.",
    categories: ["icu", "printable", "simulators"],
    lastReviewed: "2026-05-11",
    status: "Needs ICU Review",
    citations: "Neurocritical Care Society Recommendations on Pupillometry; Oddo et al., Intensive Care Med 2018.",
    references: [
      {
        label: "NPi Clinical Statement",
        citation: "Chesnut R, et al. The role of quantitative pupillometry in neurocritical care. Neurocrit Care. 2020.",
        pmid: "32095213"
      },
      {
        label: "NPi ICU Validation",
        citation: "Oddo M, et al. Quantitative pupillometry in the intensive care unit. Intensive Care Med. 2018;44(12):2113-2122.",
        pmid: "30136117"
      }
    ],
    placeholders: ["CONFIRM_PUPILLOMETRY_EMR_INTEGRATION_STATUS", "CONFIRM_LOCAL_PUPILLOMETRY_USE_CASES"]
  },
  {
    id: "policy-safety-pause",
    title: "Acute Stroke Safety Pause Card",
    purpose: "Step-by-step protocol for the multidisciplinary time-out performed in the CT scanner before administering IV thrombolytics.",
    actions: "Verify safety pause checklists and compute weight-based Tenecteplase or Alteplase doses.",
    categories: ["pocket-card", "quality"],
    lastReviewed: "2026-05-25",
    status: "Needs Nursing Review",
    citations: "Institutional thrombolysis policy (see your local protocol); AHA/ASA AIS Guidelines.",
    references: [
      {
        label: "AHA/ASA AIS Guidelines",
        citation: "Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. Stroke. 2026. DOI: 10.1161/STR.0000000000000513.",
        pmid: "41582814"
      },
      {
        label: "Door-to-Needle Study",
        citation: "Meretoja A, et al. Stroke thrombolysis: decreasing delays. Stroke. 2012;43(11):3004-3010.",
        pmid: "22933734"
      }
    ],
    placeholders: ["CONFIRM_POLICY_FINAL_TEXT", "CONFIRM_APOP_2026_LANGUAGE", "CONFIRM_SAFETY_PAUSE_PARTICIPANTS"]
  },
  {
    id: "hospital-roadmap",
    title: "Senior Resident Hospital Course Roadmap",
    purpose: "Provide a day-by-day checklist for senior residents managing the clinical workup and discharge planning of stroke inpatients.",
    actions: "Track daily metrics, diagnostics, and counseling checks to gauge patient discharge readiness.",
    categories: ["quality"],
    lastReviewed: "2026-05-08",
    status: "Needs Program Review",
    citations: "Residency stroke curriculum (your program).",
    references: [
      {
        label: "ACGME Curriculum",
        citation: "Accreditation Council for Graduate Medical Education (ACGME) Program Requirements for Graduate Medical Education in Neurology. 2025."
      },
      {
        label: "GWTG Measures",
        citation: "Get With The Guidelines-Stroke Core Measures Manual. 2026."
      }
    ],
    placeholders: []
  },
  {
    id: "telestroke-routing",
    title: "Telestroke Workflow Quick Reference",
    purpose: "Scaffold guidance for routing calls and telestroke documentation for rural or remote hub-and-spoke referrals.",
    actions: "Test hub-spoke alerts, run hardware connectivity checks, and compose notes safely.",
    categories: ["epic"],
    lastReviewed: "2026-05-02",
    status: "Needs Admin Review",
    citations: "Example telestroke operations manual (your network).",
    references: [
      {
        label: "AHA Telestroke Statement",
        citation: "Schwamm LH, et al. Recommendations for the Implementation of Telemedicine in Acute Stroke Care: A Scientific Statement From the American Heart Association. Stroke. 2009;40(7):2635-2660.",
        pmid: "19423856"
      },
      {
        label: "Brain Attack Coalition",
        citation: "Schwamm LH, et al. Recommendations for the establishment of primary stroke centers: a consensus statement from the Brain Attack Coalition. Stroke. 2011.",
        pmid: "21836092"
      }
    ],
    placeholders: ["CONFIRM_TRIAL_CONTACT", "CONFIRM_TRIAL_STATUS", "CONFIRM_PUBLIC_TELENEUROLOGY_TEXT"]
  },
  {
    id: "hints-simulator",
    title: "HINTS+ Eye-Movement Simulator & Guide",
    purpose: "Vestibular exam training tool to differentiate central stroke from peripheral acute vestibular syndrome using Head Impulse, Nystagmus, Test of Skew, plus hearing assessment.",
    actions: "Examine simulated eye movements for saccades, direction nystagmus, vertical skew, and hearing loss.",
    categories: ["pocket-card", "printable", "simulators"],
    lastReviewed: "2026-05-25",
    status: "Clinical Reference",
    citations: "Kattah et al., Stroke 2009 (HINTS); Newman-Toker et al., Acad Emerg Med 2013 (HINTS+).",
    references: [
      {
        label: "HINTS Landmark",
        citation: "Kattah JC, et al. HINTS to diagnose stroke in the acute vestibular syndrome: three-step bedside oculomotor examination more sensitive than early MRI diffusion-weighted imaging. Stroke. 2009;40(11):3504-3510.",
        pmid: "19762656"
      },
      {
        label: "HINTS+ Study",
        citation: "Newman-Toker DE, et al. HINTS plus hearing loss identifies stroke in acute vestibular syndrome. Acad Emerg Med. 2013;20(10):986-996.",
        pmid: "24127701"
      }
    ],
    placeholders: []
  },
  {
    id: "neuro-exams-simulator",
    title: "Bedside Neuro-Exams & Diagnostic Tools",
    purpose: "Interactive bedside classifiers for differentiating acute confusional states (delirium) from fluent/non-fluent aphasia, alongside structured coma examination protocols.",
    actions: "Run systematic GCS, CAM-ICU, and speech diagnostics on virtual clinical presentations.",
    categories: ["pocket-card", "icu", "simulators"],
    lastReviewed: "2026-05-25",
    status: "Clinical Reference",
    citations: "CAM-ICU / GCS / NIHSS exam specifications.",
    references: [
      {
        label: "CAM-ICU Study",
        citation: "Ely EW, et al. Evaluation of delirium in critically ill patients: validation of the Confusion Assessment Method for the Intensive Care Unit (CAM-ICU). Crit Care Med. 2001;29(7):1370-1379.",
        pmid: "11445762"
      },
      {
        label: "GCS Landmark",
        citation: "Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. Lancet. 1974;2(7872):81-84.",
        pmid: "4136544"
      },
      {
        label: "NIHSS Study",
        citation: "Lyden P, et al. Improved reliability of the NIH Stroke Scale using video training. Stroke. 1994;25(11):2220-2226.",
        pmid: "7974945"
      }
    ],
    placeholders: []
  },
  {
    id: "reference-library",
    title: "Guideline & Reference Library",
    purpose: "Access landmark stroke trials, guideline recommendations, HINTS exam protocols, CVT parameters, neuroprognostication, clinical pearls, pitfalls, and follow-up protocols.",
    actions: "Search and filter completed trials, guidelines index, clinical pearls, and admission order checklists.",
    categories: ["pocket-card", "printable", "trials"],
    lastReviewed: "2026-05-30",
    status: "Clinical Reference",
    citations: "AHA/ASA guidelines and Landmark Stroke Trials.",
    references: [
      {
        label: "Landmark Stroke Trials",
        citation: "Major clinical trials in acute stroke management, secondary prevention, and vascular neurosurgery."
      }
    ],
    placeholders: []
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
              <div className="flex flex-col items-end justify-center text-right">
                <span className="font-mono text-[10px] text-mute">Last Reviewed: {activeModule.lastReviewed}</span>
              </div>
            </header>

            {/* View Mode Switcher */}
            <div className="flex border-b border-line" role="tablist" aria-label="Resource view modes">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[44px] ${viewMode === 'dashboard' ? 'border-cobalt-600 text-cobalt-600 dark:border-cobalt-400 dark:text-cobalt-400 font-bold' : 'border-transparent text-mute hover:text-ink'}`}
                role="tab"
                aria-selected={viewMode === 'dashboard'}
                aria-controls="resource-view-content"
                id="tab-view-dashboard"
              >
                Interactive Platform
              </button>
              <button
                onClick={() => setViewMode('infographic')}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[44px] ${viewMode === 'infographic' ? 'border-cobalt-600 text-cobalt-600 dark:border-cobalt-400 dark:text-cobalt-400 font-bold' : 'border-transparent text-mute hover:text-ink'}`}
                role="tab"
                aria-selected={viewMode === 'infographic'}
                aria-controls="resource-view-content"
                id="tab-view-infographic"
              >
                Visual Infographic
              </button>
            </div>


            {/* Custom Content for each SubModule based on view mode */}
            <main id="resource-view-content" className="space-y-6 text-sm text-ink-2">
              {renderSubModuleContent(activeModule.id, viewMode, onNavigate, copyToClipboard, addToast)}
            </main>

            <footer className="border-t border-line pt-4 text-xs space-y-3">
              <div>
                <span className="font-bold text-ink uppercase tracking-wider text-[10px] block mb-1.5">Evidence &amp; Reference Guidelines</span>
                {activeModule.references && activeModule.references.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1.5 text-ink-2">
                    {activeModule.references.map((ref, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <strong className="text-ink font-semibold">{ref.label}:</strong> {ref.citation}{' '}
                        {ref.pmid ? (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cobalt-700 hover:text-cobalt-900 font-semibold underline dark:text-cobalt-300"
                          >
                            PMID: {ref.pmid}
                          </a>
                        ) : ref.url ? (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cobalt-700 hover:text-cobalt-900 font-semibold underline dark:text-cobalt-300"
                          >
                            Link
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-mute">{activeModule.citations}</p>
                )}
              </div>
            </footer>
          </div>
        </div>
      );
    }
  }

  // Render main dashboard grid list
  return (
    <div id="tabpanel-education" role="tabpanel" aria-labelledby="tab-education" className="space-y-6 max-w-6xl mx-auto v7-reveal">
      <header className="bg-card border border-line rounded-lg p-6 space-y-2">
        <p className="font-mono uppercase text-eyebrow text-mute mb-1">Rotation Artifacts</p>
        <h1 className="font-serif text-2xl text-ink font-bold">Educational Resources</h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          Interactive clinical simulators, decision tools, note-routing wizards, and visual infographics compiled for neurology bedside education.
        </p>

      </header>

      {/* Filter and Search controls */}
      <section className="bg-card border border-line rounded-lg p-4 space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-[240px] self-start">
            <input
              type="search"
              placeholder="Search cards by topic, clinical keyword, or guidelines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="v6-input pl-10"
              aria-label="Search education cards"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none">
              <i data-lucide="search" className="w-4 h-4" aria-hidden="true"></i>
            </span>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-mute font-mono uppercase">Filter:</span>
            {categories.map(c => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`v7-chip ${selectedCategory === c.key ? 'bg-cobalt-700 text-white border-cobalt-700' : 'bg-transparent text-slate-700 border-line hover:border-slate-400 dark:text-ink-2'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Dashboard Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(m => (
          <article
            key={m.id}
            onClick={() => onNavigate(m.id)}
            className="v7-card cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-all bg-card min-h-[220px]"
          >
            <div className="space-y-3">
              <div className="flex justify-end items-start gap-2">
                <span className="text-[10px] font-mono text-mute">{m.lastReviewed}</span>
              </div>
              <h2 className="font-serif font-bold text-base text-ink">{m.title}</h2>
              <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">{m.purpose}</p>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">Open Resource →</span>
            </div>
          </article>
        ))}
        {filteredModules.length === 0 && (
          <div className="col-span-full bg-card border border-line rounded-lg p-10 text-center">
            <p className="text-sm text-mute">No cards match the search query or filter tags.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// =====================================================================
// RENDER HELPERS FOR DETAILED MODULE VIEWS
// =====================================================================
function renderSubModuleContent(moduleId, viewMode, onNavigate, copyToClipboard, addToast) {
  switch (moduleId) {
    case "csc-quality":
      return viewMode === 'dashboard' ? (
        <CscQualityDashboard />
      ) : (
        <CscQualityInfographic />
      );

    case "evd-icp":
      return viewMode === 'dashboard' ? (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-critical p-3">
            <h3 className="font-bold text-xs uppercase mb-1">🛑 Safety Notice — EVD Orders</h3>
            <p className="text-xs">Never change EVD drain height, clamp orders, or flush an EVD independently. All EVD manipulations must be explicitly authorized by Neurosurgery or Neurocritical Care.</p>
          </div>
          <ErrorBoundary>
            <EvdIcpSimulator />
          </ErrorBoundary>
        </div>
      ) : (
        <EvdIcpInfographic />
      );

    case "note-routing":
      return viewMode === 'dashboard' ? (
        <NoteRoutingDashboard />
      ) : (
        <NoteRoutingInfographic />
      );

    case "epic-templates":
      return viewMode === 'dashboard' ? (
        <EpicTemplatesDashboard copyToClipboard={copyToClipboard} addToast={addToast} />
      ) : (
        <EpicTemplatesInfographic />
      );

    case "ctp":
      return viewMode === 'dashboard' ? (
        <CtpCalculatorDashboard />
      ) : (
        <CtpCalculatorInfographic />
      );

    case "trials":
      return viewMode === 'dashboard' ? (
        <TrialsScreenerDashboard />
      ) : (
        <TrialsScreenerInfographic />
      );

    case "pediatric-stroke":
      return viewMode === 'dashboard' ? (
        <PediatricStrokeDashboard />
      ) : (
        <PediatricStrokeInfographic />
      );

    case "aspects":
      return viewMode === 'dashboard' ? (
        <AspectsDashboard />
      ) : (
        <AspectsInfographic />
      );

    case "ich-triage-reversal":
      return viewMode === 'dashboard' ? (
        <IchReversalDashboard />
      ) : (
        <IchReversalInfographic />
      );

    case "dvt-prophylaxis":
      return viewMode === 'dashboard' ? (
        <DvtProphylaxisDashboard />
      ) : (
        <DvtProphylaxisInfographic />
      );

    case "pupillometry":
      return viewMode === 'dashboard' ? (
        <div className="space-y-6">
          <ErrorBoundary>
            <PupillometrySimulator />
          </ErrorBoundary>
        </div>
      ) : (
        <PupillometryInfographic />
      );

    case "policy-safety-pause":
      return viewMode === 'dashboard' ? (
        <SafetyPauseDashboard />
      ) : (
        <SafetyPauseInfographic />
      );

    case "hospital-roadmap":
      return viewMode === 'dashboard' ? (
        <HospitalRoadmapDashboard />
      ) : (
        <HospitalRoadmapInfographic />
      );

    case "telestroke-routing":
      return viewMode === 'dashboard' ? (
        <TelestrokeRoutingDashboard />
      ) : (
        <TelestrokeRoutingInfographic />
      );

    case "hints-simulator":
      return viewMode === 'dashboard' ? (
        <div className="space-y-6">
          <ErrorBoundary>
            <HintsSimulator />
          </ErrorBoundary>
        </div>
      ) : (
        <HintsInfographic />
      );

    case "neuro-exams-simulator":
      return viewMode === 'dashboard' ? (
        <div className="space-y-6">
          <ErrorBoundary>
            <NeuroExamsTool />
          </ErrorBoundary>
        </div>
      ) : (
        <NeuroExamsInfographic />
      );

    case "reference-library":
      return viewMode === 'dashboard' ? (
        <ReferenceLibraryDashboard isTraineeMode={isTraineeMode} navigateTo={navigateTo} />
      ) : (
        <ReferenceLibraryInfographic />
      );

    default:
      return <p className="text-xs">Module content not found.</p>;
  }
}

// =====================================================================
// SUB-WIDGET COMPONENTS (DASHBOARDS & INFOGRAPHICS)
// =====================================================================

// --- 1. CSC QUALITY METRICS ---
function CscQualityDashboard() {
  const [tab, setTab] = useState('admission');
  const [checks, setChecks] = useState({
    lkw: true, nihss: true, lytics: false, evt: false, dysphagia: false,
    antithrombotic: false, afib: false, statin: false, edu: false, rehab: false
  });

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const score = useMemo(() => {
    const activeChecks = tab === 'admission' 
      ? ['lkw', 'nihss', 'lytics', 'evt', 'dysphagia']
      : ['antithrombotic', 'afib', 'statin', 'edu', 'rehab'];
    const passed = activeChecks.filter(k => checks[k]).length;
    return Math.round((passed / activeChecks.length) * 100);
  }, [tab, checks]);

  return (
    <div className="space-y-4">
      <div className="flex border-b border-line bg-paper p-1 rounded-md max-w-xs">
        <button
          onClick={() => setTab('admission')}
          className={`flex-1 px-3 py-1 text-xs font-semibold rounded ${tab === 'admission' ? 'bg-white shadow-sm text-ink dark:bg-card' : 'text-mute'}`}
        >
          Admission Checks
        </button>
        <button
          onClick={() => setTab('discharge')}
          className={`flex-1 px-3 py-1 text-xs font-semibold rounded ${tab === 'discharge' ? 'bg-white shadow-sm text-ink dark:bg-card' : 'text-mute'}`}
        >
          Discharge Checks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3">
          <h3 className="font-bold text-sm text-ink uppercase tracking-wider">
            {tab === 'admission' ? "Admission Quality Targets" : "Discharge Quality Targets"}
          </h3>
          <p className="text-2xs text-mute">Check off completed clinical documentation to verify measure compliance.</p>
          
          <div className="space-y-2">
            {tab === 'admission' ? (
              <>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.lkw} onChange={() => toggleCheck('lkw')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">LKW Time Documented:</strong> Exact date/time LKW and discovery time. Mandatory for STK-4.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.nihss} onChange={() => toggleCheck('nihss')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">Baseline NIHSS:</strong> Full NIHSS completed on arrival and signed.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.lytics} onChange={() => toggleCheck('lytics')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">Thrombolytic Status (STK-4):</strong> Administered time OR rationale for withholding documented.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.evt} onChange={() => toggleCheck('evt')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">EVT Selection Rationale:</strong> Groin puncture time documented, or why EVT is held (large core, low NIHSS, distal).
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.dysphagia} onChange={() => toggleCheck('dysphagia')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">Dysphagia Screen:</strong> Screened and signed <em>prior</em> to any oral intake.
                  </div>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.antithrombotic} onChange={() => toggleCheck('antithrombotic')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">End-of-Day-2 Antithrombotic (STK-2):</strong> Aspirin, clopidogrel, or anticoagulation given by Day 2.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.afib} onChange={() => toggleCheck('afib')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">AF Anticoagulation at Discharge (STK-3):</strong> DOAC or warfarin prescribed for AFib/AFlutter.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.statin} onChange={() => toggleCheck('statin')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">High-Intensity Statin (STK-6):</strong> Prescribed Atorvastatin 80mg or Rosuvastatin 40mg.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.edu} onChange={() => toggleCheck('edu')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">Stroke Education Material (STK-8):</strong> Warning signs, risk factors, emergency system, meds.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.rehab} onChange={() => toggleCheck('rehab')} className="mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-ink">Rehab Assessment (STK-10):</strong> Physical Medicine & Rehab or PT/OT assessed for discharge needs.
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper flex flex-col justify-between items-center text-center">
          <div className="space-y-2 w-full">
            <h4 className="text-xs font-semibold text-mute uppercase">Measure Compliance</h4>
            <div className="relative flex items-center justify-center h-28 w-28 mx-auto mt-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="var(--line)" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="var(--cobalt)" strokeWidth="8" fill="transparent"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * score) / 100}
                  className="transition-all duration-500" />
              </svg>
              <span className="absolute text-2xl font-bold font-mono text-ink">{score}%</span>
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-ink-2">
            {score === 100 ? (
              <span className="text-ok">✓ All quality measures met for this phase!</span>
            ) : (
              <span className="text-caution">⚠️ Actions pending check off.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CscQualityInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Comprehensive Stroke Center (CSC) Compliance Pipeline</h2>
        <p className="text-xs text-mute">Chronological flow of required Joint Commission stroke core measures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        <div className="p-4 border border-line bg-card rounded-md space-y-2 relative">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-cobalt-700 bg-cobalt-100 rounded px-1.5 dark:text-cobalt-300 dark:bg-cobalt-950">Phase 1</div>
          <h3 className="font-bold text-xs text-ink uppercase">Emergency / Arrival</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>LKW Documentation:</b> Strict onset/discovery time</li>
            <li><b>NIHSS Baseline:</b> Essential arrival severity</li>
            <li><b>Dysphagia Screen:</b> Prior to any PO intake</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2 relative">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-cobalt-700 bg-cobalt-100 rounded px-1.5 dark:text-cobalt-300 dark:bg-cobalt-950">Phase 2</div>
          <h3 className="font-bold text-xs text-ink uppercase">Hyperacute Reperfusion</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>STK-4 (Thrombolytics):</b> Needle time or contraindication</li>
            <li><b>EVT Groin Puncture:</b> Large-core/LVO timing checklist</li>
            <li><b>Safety pause time-out:</b> Interdisciplinary checklist</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2 relative">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-cobalt-700 bg-cobalt-100 rounded px-1.5 dark:text-cobalt-300 dark:bg-cobalt-950">Phase 3</div>
          <h3 className="font-bold text-xs text-ink uppercase">Stroke Unit Wards</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>STK-1 (VTE Prophylaxis):</b> Started by end of Day 2</li>
            <li><b>STK-2 (Antithrombotic):</b> Antiplatelets by Day 2</li>
            <li><b>Telemetry AF screening:</b> Ongoing cardiac monitor</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2 relative">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-cobalt-700 bg-cobalt-100 rounded px-1.5 dark:text-cobalt-300 dark:bg-cobalt-950">Phase 4</div>
          <h3 className="font-bold text-xs text-ink uppercase">Discharge Readiness</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>STK-3 (AF Anticoagulation):</b> Oral anticoagulant</li>
            <li><b>STK-6 (Statin):</b> High-intensity statin rx</li>
            <li><b>STK-8 (Education):</b> FAST signs warnings</li>
            <li><b>STK-10 (Rehab):</b> PM&R / PT assessment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- 2. EVD / ICP INFOGRAPHIC (Simulator handles Dashboard) ---
function EvdIcpInfographic() {
  const ArrowDown = () => (
    <div className="flex justify-center py-0.5">
      <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );

  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      {/* Title */}
      <div className="text-center space-y-1 pb-4 border-b border-line">
        <h2 className="font-serif text-xl text-ink font-bold tracking-tight text-indigo-950 dark:text-indigo-300">
          Intracranial Hypertension &amp; Herniation due to Stroke
        </h2>
        <p className="text-xs text-mute">Bedside Clinical Guidance &amp; Escalation Algorithm</p>
      </div>

      {/* Row 1: Impending Herniation Signs */}
      <section className="border border-rose-300 bg-rose-50/10 dark:bg-rose-950/10 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-xs text-rose-800 dark:text-rose-400 uppercase tracking-wide flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-600"></span>
          1. Bedside &amp; Radiographic Signs of Impending Herniation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="space-y-0.5">
            <strong className="text-ink">• LOC Decline:</strong>
            <span className="text-ink-2"> GCS decrease of &ge;2 points, stupor, progressive coma.</span>
          </div>
          <div className="space-y-0.5">
            <strong className="text-ink">• Pupils:</strong>
            <span className="text-ink-2"> New pupillary asymmetry or loss of reactivity.</span>
          </div>
          <div className="space-y-0.5">
            <strong className="text-ink">• Motor Deficits:</strong>
            <span className="text-ink-2"> New hemiparesis/plegia, extensor/flexor posturing.</span>
          </div>
          <div className="space-y-0.5">
            <strong className="text-ink">• Imaging Markers:</strong>
            <span className="text-ink-2"> Midline shift, cistern effacement, hydrocephalus.</span>
          </div>
          <div className="space-y-0.5">
            <strong className="text-ink">• Cushing's Triad (Late):</strong>
            <span className="text-ink-2"> Systolic HTN, bradycardia, irregular breathing.</span>
          </div>
          <div className="space-y-0.5">
            <strong className="text-ink">• Symptoms:</strong>
            <span className="text-ink-2"> Worsening headache, projectile vomiting.</span>
          </div>
        </div>
      </section>

      {/* Row 2: EVD Calibrations & Waveform diagnostics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EVD Calibrations */}
        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cobalt-600"></span>
            EVD Calibrations &amp; Leveling
          </h3>
          <div className="text-2xs space-y-2 text-ink-2">
            <div>
              <strong className="text-ink block">Zeroing Level:</strong>
              Reference point is the external auditory meatus (EAM/Tragus), corresponding to the Foramen of Monro.
            </div>
            <div>
              <strong className="text-ink block">Pressure Conversion:</strong>
              1 mmHg = 1.36 cm H2O. Standard EVD drains are set in cm H2O (e.g. +10 cm H2O = 7.4 mmHg).
            </div>
            <div>
              <strong className="text-ink block">Zeroing frequency:</strong>
              Re-level and zero after any patient repositioning or bed movement. Ensure lines are non-kinked.
            </div>
          </div>
        </div>

        {/* ICP Waveforms */}
        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600"></span>
            ICP Waveform Morphologies
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-slate-50 border border-line rounded p-2 flex flex-col justify-center items-center relative dark:bg-card">
              <svg className="w-full h-12" viewBox="0 0 100 30">
                <path d="M5 25 Q15 5 25 12 T45 22 T65 24 T85 25" fill="none" stroke="#2C7A52" strokeWidth="1.5" />
                <text x="23" y="10" fontSize="3.5" className="fill-ink font-bold">P1</text>
                <text x="43" y="18" fontSize="3.5" className="fill-ink">P2</text>
                <text x="63" y="22" fontSize="3.5" className="fill-ink">P3</text>
              </svg>
              <div className="text-[8px] text-mute font-mono mt-1 text-center font-bold">Normal: P1 &gt; P2 &gt; P3</div>
            </div>
            <div className="h-20 bg-slate-50 border border-line rounded p-2 flex flex-col justify-center items-center relative dark:bg-card">
              <svg className="w-full h-12" viewBox="0 0 100 30">
                <path d="M5 25 Q15 15 25 15 T45 5 T65 18 T85 25" fill="none" stroke="#DC3F3A" strokeWidth="1.5" />
                <text x="23" y="14" fontSize="3.5" className="fill-ink">P1</text>
                <text x="43" y="8" fontSize="3.5" className="fill-rose-600 font-bold dark:fill-rose-400">P2</text>
                <text x="63" y="16" fontSize="3.5" className="fill-ink">P3</text>
              </svg>
              <div className="text-[8px] text-rose-600 font-mono mt-1 text-center font-bold dark:text-rose-400">Non-compliant: P2 &gt; P1</div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 3: Stepwise Escalation Protocol */}
      <section className="space-y-3">
        <h3 className="font-bold text-xs text-indigo-950 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
          2. Stepwise ICP &amp; Herniation Protocol (Escalation Pathway)
        </h3>

        {/* STEP 0 */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-card">
          <div className="bg-slate-700 text-white px-3 py-1.5 text-xs font-bold font-mono">
            STEP 0 · BASELINE NEUROPROTECTION (Prophylaxis)
          </div>
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-2xs text-ink-2">
            <div><strong className="text-ink">• Position:</strong> HOB 30° + midline head/neck position.</div>
            <div><strong className="text-ink">• Perfusion:</strong> Avoid hypotension; maintain stroke BP goals.</div>
            <div><strong className="text-ink">• Fever:</strong> Treat T &ge;38°C (scheduled acetaminophen).</div>
            <div><strong className="text-ink">• Metabolic:</strong> Glucose 140–180; euvolemia (Isotonic saline).</div>
            <div><strong className="text-ink">• Airway/O2:</strong> SpO2 &ge;94%; propofol &plusmn; fentanyl if intubated.</div>
            <div><strong className="text-ink">• Ventilation:</strong> PaCO2 35–45. <em className="text-mute">(Edema peaks days 3–5)</em>.</div>
          </div>
        </div>

        <ArrowDown />

        {/* TRIGGER */}
        <div className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/60 rounded-md p-2.5 text-center">
          <span className="font-bold text-indigo-950 dark:text-indigo-300 text-xs tracking-wide">
            TRIGGER: GCS decline &ge;2, pupillary asymmetry/reactivity loss, OR sustained monitored ICP &gt;22 mmHg
          </span>
        </div>

        <ArrowDown />

        {/* STEP 1 */}
        <div className="border border-teal-200 dark:border-teal-900 rounded-lg overflow-hidden bg-card">
          <div className="bg-teal-700 text-white px-3 py-1.5 text-xs font-bold font-mono">
            STEP 1 · TARGETED OSMOTHERAPY (First-Line Medical)
          </div>
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs text-ink-2">
            <div><strong className="text-ink">• Consults:</strong> STAT Neuro ICU and Neurosurgery.</div>
            <div><strong className="text-ink">• 3% HTS:</strong> 250–500 mL IV bolus over 20 min (large-bore PIV OK).</div>
            <div><strong className="text-ink">• Imaging:</strong> Urgent non-contrast head CT.</div>
            <div><strong className="text-ink">• 20% Mannitol:</strong> 0.5–1.0 g/kg IV bolus (In-line filter).</div>
          </div>
        </div>

        <ArrowDown />

        {/* TRANSITION 1 */}
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60 rounded-md p-2 text-center text-2xs font-semibold text-amber-800 dark:text-amber-400">
          If refractory to first-line therapy or acute herniation suspected
        </div>

        <ArrowDown />

        {/* STEP 2 */}
        <div className="border border-amber-400 dark:border-amber-700 rounded-lg overflow-hidden bg-card">
          <div className="bg-amber-600 text-white px-3 py-1.5 text-xs font-bold font-mono">
            STEP 2 · REFRACTORY RESCUE &amp; BRIDGING (Invasive)
          </div>
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs text-ink-2">
            <div><strong className="text-ink">• 23.4% HTS:</strong> 30 mL IV over 10 min (<span className="font-semibold text-red-500">Central line only</span>).</div>
            <div><strong className="text-ink">• EVD:</strong> For obstructive hydrocephalus/IVH.</div>
            <div><strong className="text-ink">• Hyperventilation:</strong> PaCO2 30–35 (caution: vasoconstriction).</div>
            <div><strong className="text-ink">• Cerebellar Warning:</strong> Drain conservatively; risk of upward herniation.</div>
          </div>
        </div>

        <ArrowDown />

        {/* TRANSITION 2 */}
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-md p-2 text-center text-2xs font-semibold text-slate-700 dark:text-slate-300">
          If candidate for definitive surgical decompression
        </div>

        <ArrowDown />

        {/* STEP 3 */}
        <div className="border border-red-300 dark:border-red-900 rounded-lg overflow-hidden bg-card">
          <div className="bg-red-800 text-white px-3 py-1.5 text-xs font-bold font-mono">
            STEP 3 · EMERGENCY SURGICAL DECOMPRESSION
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-2xs text-ink-2">
            <div>
              <strong className="block text-slate-900 dark:text-ink mb-1">• Supratentorial Infarction/ICH:</strong>
              Proceed to Decompressive Hemicraniectomy (DHC).
            </div>
            <div>
              <strong className="block text-slate-900 dark:text-ink mb-1">• Infratentorial (Cerebellar):</strong>
              Suboccipital Decompression + dural expansion.
            </div>
          </div>
        </div>
      </section>

      {/* Row 4: Osmotherapy Comparison Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* HTS Card */}
        <div className="border border-blue-200 dark:border-blue-900 rounded-lg p-4 bg-card space-y-2.5">
          <h4 className="font-bold text-xs text-blue-800 dark:text-blue-400 uppercase tracking-wide">
            Hypertonic Saline (HTS 3% / 23.4%)
          </h4>
          <ul className="space-y-1.5 text-2xs text-ink-2 list-none">
            <li>
              <span className="font-semibold text-ink">• 3% HTS:</span> 250–500 mL IV over 20 min (Peripheral large-bore OK).
            </li>
            <li>
              <span className="font-semibold text-ink">• 23.4% HTS:</span> 30 mL IV over 10 min (<span className="text-red-500 font-bold">Central line only!</span>).
            </li>
            <li>
              <span className="font-semibold text-ink">• Monitoring:</span> Na, Cl, renal panel q4–6h. Avoid Na &gt;155–160.
            </li>
            <li>
              <span className="font-semibold text-ink">• Advantage:</span> Supports euvolemia, avoids hypotension/diuresis.
            </li>
          </ul>
        </div>

        {/* Mannitol Card */}
        <div className="border border-amber-200 dark:border-amber-900 rounded-lg p-4 bg-card space-y-2.5">
          <h4 className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wide">
            Mannitol (20% Solution)
          </h4>
          <ul className="space-y-1.5 text-2xs text-ink-2 list-none">
            <li>
              <span className="font-semibold text-ink">• Dosing:</span> 0.5–1.0 g/kg IV bolus (In-line 0.22-micron filter required).
            </li>
            <li>
              <span className="font-semibold text-ink">• Monitoring:</span> Serum Osm, Osmolar Gap (Measured &minus; Calc Osm) q6h.
            </li>
            <li>
              <span className="font-semibold text-ink">• Hold Criteria:</span> Caution if gap &ge;20, high risk if gap &gt;55 or AKI/anuria.
            </li>
            <li>
              <span className="font-semibold text-ink">• Disadvantage:</span> Osmotic diuresis (hypovolemia/hypotension), rebound ICP.
            </li>
          </ul>
        </div>
      </section>

      {/* Row 5: Steroids Callout Warning */}
      <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/50 rounded-lg p-3 flex items-start gap-2.5">
        <span className="text-rose-600 dark:text-rose-400 text-base font-bold select-none leading-none mt-0.5">⚠️</span>
        <p className="text-2xs font-semibold text-rose-950 dark:text-rose-300">
          Corticosteroids are not indicated for cytotoxic edema in stroke and increase infection risk.
        </p>
      </div>

      {/* Row 6: Embedded references (Infographic format layout) */}
      <div className="border-t border-line pt-4 space-y-2">
        <span className="font-mono text-[9px] text-mute block uppercase tracking-wider">Infographic Guidelines References</span>
        <ul className="list-disc pl-4 text-[9px] text-mute space-y-1">
          <li>
            <strong>AHA/ASA Guidelines:</strong> Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. <em>Stroke</em>. 2026. DOI: 10.1161/STR.0000000000000513.{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/41582814" target="_blank" rel="noopener noreferrer" className="text-cobalt-700 hover:text-cobalt-900 font-semibold underline dark:text-cobalt-300">PMID: 41582814</a>
          </li>
          <li>
            <strong>Cerebral Edema:</strong> Wijdicks EF, et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. <em>Stroke</em>. 2014;45:1222-1238.{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/24481970" target="_blank" rel="noopener noreferrer" className="text-cobalt-700 hover:text-cobalt-900 font-semibold underline dark:text-cobalt-300">PMID: 24481970</a>
          </li>
          <li>
            <strong>NCS Guidelines:</strong> Cook AM, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. <em>Neurocrit Care</em>. 2020;32:647-666.{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/32227294" target="_blank" rel="noopener noreferrer" className="text-cobalt-700 hover:text-cobalt-900 font-semibold underline dark:text-cobalt-300">PMID: 32227294</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

// --- 3. NOTE ROUTING CARD ---
function NoteRoutingDashboard() {
  const [setting, setSetting] = useState('ed');
  const [time, setTime] = useState('weekday');
  const [scenario, setScenario] = useState('admission');

  const result = useMemo(() => {
    if (setting === 'ed') {
      if (scenario === 'discharge') {
        return {
          attending: "On-call Stroke Attending",
          phrase: "Forward H&P + discharge routing to the Stroke Attending on-call pager.",
          code: "Epic Routing: ON-CALL STROKE ATTENDING (select from pool)",
          action: "Ensure TIA or stroke diagnosis is documented and patient education checklist is printed."
        };
      } else {
        return {
          attending: "Admitting Stroke Attending of the Day",
          phrase: "Route admission H&P to the scheduled Stroke Attending on service.",
          code: "Epic Routing: STROKE ATTENDING ON-CALL (matching call schedule)",
          action: "Route admit orders. Forward co-signature request to the scheduled attending of the day."
        };
      }
    } else if (setting === 'wards') {
      if (scenario === 'discharge') {
        return {
          attending: "Discharging Stroke Attending",
          phrase: "Route discharge summary to the attending rounding on the discharging day.",
          code: "Epic Routing: Rounding Stroke Attending",
          action: "Verify high-intensity statin, anticoagulation details, and follow-up clinic date are signed."
        };
      } else {
        return {
          attending: "Rounding Stroke Attending of the Day",
          phrase: "Route progress notes to the attending conducting rounds.",
          code: "Epic Routing: Rounding Stroke Attending",
          action: "Forward progress note for daily signature by 11:00 AM."
        };
      }
    } else {
      // Consult
      if (time === 'weekday') {
        return {
          attending: "Stroke Consult Attending of the Day",
          phrase: "Route consult note to the designated consult attending.",
          code: "Epic Routing: STROKE CONSULT ATTENDING (scheduled day pool)",
          action: "Page/alert consult attending after writing recommendations."
        };
      } else {
        return {
          attending: "Weekend/Holiday Stroke Attending on-call",
          phrase: "Route consult note to the weekend attending on-call.",
          code: "Epic Routing: ON-CALL STROKE ATTENDING",
          action: "Page attending for verbal discuss prior to filing note."
        };
      }
    }
  }, [setting, time, scenario]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase">Routing Wizard</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Clinical Setting:</label>
              <select value={setting} onChange={(e) => setSetting(e.target.value)} className="v6-input">
                <option value="ed">Emergency Department (ED)</option>
                <option value="wards">Stroke Inpatient Wards</option>
                <option value="consult">Consultation Service</option>
              </select>
            </div>

            {setting === 'consult' && (
              <div>
                <label className="block font-semibold mb-1">Day / Time:</label>
                <select value={time} onChange={(e) => setTime(e.target.value)} className="v6-input">
                  <option value="weekday">Weekday (08:00 - 17:00)</option>
                  <option value="weekend">Weekend / Holiday / Night</option>
                </select>
              </div>
            )}

            {setting !== 'consult' && (
              <div>
                <label className="block font-semibold mb-1">Scenario:</label>
                <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="v6-input">
                  <option value="admission">Admission H&amp;P / Progress Note</option>
                  <option value="discharge">Discharge Encounter / Summary</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider text-cobalt-700 dark:text-cobalt-300">
            Designated Attending &amp; Note Target
          </h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-2xs text-mute block uppercase font-mono">Routing Attending:</span>
              <strong className="text-base text-ink">{result.attending}</strong>
            </div>
            <div className="bg-card p-3 border border-line rounded font-mono text-2xs">
              {result.code}
            </div>
            <div className="text-ink-2 leading-relaxed">
              <strong className="block text-ink text-2xs uppercase">Required Actions:</strong>
              {result.action}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteRoutingInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Stroke Note Co-Signature &amp; Routing Pathway</h2>
        <p className="text-xs text-mute">Billing and compliance logic mapping for residents on service.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-card space-y-2">
          <div className="h-6 w-6 rounded-full bg-cobalt-100 text-cobalt-900 flex items-center justify-center font-bold text-xs dark:bg-cobalt-950 dark:text-cobalt-300">ED</div>
          <h3 className="font-bold text-xs text-ink">Emergency Dept</h3>
          <div className="text-2xs space-y-1 text-ink-2">
            <div><b>Admission:</b> Forward admit H&amp;P and orders to scheduled Stroke Attending of the day.</div>
            <div><b>Discharge:</b> Forward discharge routing to Stroke Attending on-call.</div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-card space-y-2">
          <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-xs dark:bg-teal-950 dark:text-teal-300">WD</div>
          <h3 className="font-bold text-xs text-ink">Wards Inpatients</h3>
          <div className="text-2xs space-y-1 text-ink-2">
            <div><b>Progress Notes:</b> Route daily progress notes to the attending rounding on service.</div>
            <div><b>Discharge:</b> Send final discharge summary to discharging attending.</div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-card space-y-2">
          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-xs dark:bg-indigo-950 dark:text-indigo-300">CS</div>
          <h3 className="font-bold text-xs text-ink">Consults</h3>
          <div className="text-2xs space-y-1 text-ink-2">
            <div><b>Weekdays:</b> Route consult notes to the Consult Attending of the day.</div>
            <div><b>Weekends/Nights:</b> Route consult notes to on-call Stroke Attending pool.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 4. EPIC NOTE TEMPLATES ---
function EpicTemplatesDashboard({ copyToClipboard, addToast }) {
  const [type, setType] = useState('ischemic');
  const [name, setName] = useState('Jane Doe');
  const [nihss, setNihss] = useState('14');
  const [lkw, setLkw] = useState('14:30');
  const [bpTarget, setBpTarget] = useState('SBP < 180');

  const templateText = useMemo(() => {
    if (type === 'ischemic') {
      return `.ISTIAADMIT\n` +
             `PATIENT: ${name}\n` +
             `BASELINE NIHSS: ${nihss}\n` +
             `LAST KNOWN WELL: ${lkw}\n` +
             `THROMBOLYSIS WINDOW: Eligible, Tenecteplase 0.25mg/kg given.\n` +
             `POST-LYTIC WORKUP:\n` +
             `- Blood Pressure Parameter: ${bpTarget} x 24 hours\n` +
             `- NPO pending dysphagia screening\n` +
             `- Repeat Head CT in 24 hours prior to initiating dual antiplatelets.`;
    } else {
      return `.IPHADMIT\n` +
             `PATIENT: ${name}\n` +
             `HEMATOMA LOCATION: Deep Basal Ganglia\n` +
             `BASELINE GCS: 11 | Calculated ICH Score: 2\n` +
             `ANTICOAGULANT EXPOSURE: Warfarin (INR 3.2)\n` +
             `REVERSAL: Kcentra (4-factor PCC) 50 U/kg + Vitamin K 10mg IV administered.\n` +
             `ACUTE HEMODYNAMIC TARGETS:\n` +
             `- Blood Pressure Parameter: ${bpTarget} (SBP target 130-140 mmHg)\n` +
             `- Repeat non-contrast Head CT in 6 hours for stability scan.`;
    }
  }, [type, name, nihss, lkw, bpTarget]);

  const handleCopy = () => {
    if (copyToClipboard) {
      copyToClipboard(templateText);
    } else {
      navigator.clipboard.writeText(templateText);
      if (addToast) addToast("Template copied to clipboard!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">SmartPhrase Builder</h3>
          
          <div>
            <label className="block font-semibold mb-1">Encounter Type:</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="v6-input">
              <option value="ischemic">Ischemic Stroke Admit</option>
              <option value="hemorrhagic">Hemorrhagic Stroke (ICH)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Patient Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="v6-input" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">NIHSS / GCS:</label>
              <input type="text" value={nihss} onChange={(e) => setNihss(e.target.value)} className="v6-input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">LKW / Onset:</label>
              <input type="text" value={lkw} onChange={(e) => setLkw(e.target.value)} className="v6-input" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">BP Target Parameter:</label>
            <select value={bpTarget} onChange={(e) => setBpTarget(e.target.value)} className="v6-input">
              <option value="SBP < 180">SBP &lt; 180 mmHg (Post-lytic)</option>
              <option value="SBP < 220">SBP &lt; 220 mmHg (Permissive hyper)</option>
              <option value="SBP 130-140">SBP 130-140 mmHg (ICH Target)</option>
            </select>
          </div>

          <button onClick={handleCopy} className="v6-btn w-full mt-2 font-semibold">
            Copy SmartPhrase Note
          </button>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 flex flex-col justify-between space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider flex items-center justify-between">
            <span>EMR Note Preview</span>
            <span className="text-[10px] font-mono text-mute">SmartPhrase: {type === 'ischemic' ? '.ISTIAADMIT' : '.IPHADMIT'}</span>
          </h3>
          <pre className="flex-1 bg-card border border-line rounded p-3 text-2xs font-mono text-ink-2 overflow-auto whitespace-pre-wrap">
            {templateText}
          </pre>
        </div>
      </div>
    </div>
  );
}

function EpicTemplatesInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Epic Stroke Documentation Architecture</h2>
        <p className="text-xs text-mute">Ensuring EMR notes map directly to Joint Commission core measures.</p>
      </div>

      <div className="border border-line rounded-md bg-card p-4 space-y-3 shadow-inner">
        <div className="flex items-center gap-2 border-b border-line pb-2">
          <span className="h-3 w-3 rounded-full bg-red-400"></span>
          <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
          <span className="h-3 w-3 rounded-full bg-green-400"></span>
          <span className="text-2xs font-mono text-mute ml-2">SmartPhrase Editor v12.4</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-ink">🔑 Key Quality Links (Do Not Delete)</h4>
            <div className="space-y-1 text-2xs text-ink-2 bg-paper p-2 border border-line rounded">
              <div><code>LKW Date/Time:</code> Maps directly to STK-4 / Lytic window.</div>
              <div><code>Arrival NIHSS:</code> Baseline severity classification.</div>
              <div><code>Dysphagia Screen:</code> Triggers nursing swallow pass/fail record.</div>
              <div><code>Discharge Statin:</code> Auto-recommends STK-6 statin orders.</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-ink">❌ Common Documentation Errors</h4>
            <div className="space-y-1 text-2xs text-ink-2 bg-paper p-2 border border-line rounded">
              <div>- Leaving <b>Time of Symptoms Discovery</b> blank.</div>
              <div>- Conflicting LKW times in H&amp;P and nursing flowsheets.</div>
              <div>- document discharge statin as "withheld" without choosing a specific reason (myopathy, etc.).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. CTP METRICS CALCULATOR ---
function CtpCalculatorDashboard() {
  const [core, setCore] = useState(20);
  const [penumbra, setPenumbra] = useState(80);
  const [age, setAge] = useState(72);
  const [nihss, setNihss] = useState(12);

  const mismatchVol = useMemo(() => Math.max(0, penumbra - core), [core, penumbra]);
  const mismatchRatio = useMemo(() => {
    if (core === 0) return 99.9;
    return Math.round((penumbra / core) * 10) / 10;
  }, [core, penumbra]);

  const defuse3 = useMemo(() => {
    return core < 70 && mismatchRatio >= 1.8 && mismatchVol >= 15;
  }, [core, mismatchRatio, mismatchVol]);

  const dawn = useMemo(() => {
    if (nihss < 10) return false;
    if (age >= 80) {
      return core < 21;
    } else {
      if (nihss >= 20) {
        return core < 51;
      } else {
        return core < 31;
      }
    }
  }, [age, nihss, core]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-4 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Perfusion Input Sliders</h3>
          
          <div>
            <label className="block font-semibold mb-1">Ischemic Core (CBF &lt; 30%): {core} mL</label>
            <input type="range" min="0" max="100" value={core} onChange={(e) => setCore(parseInt(e.target.value))} className="w-full cursor-pointer accent-cobalt-600" />
          </div>

          <div>
            <label className="block font-semibold mb-1">Penumbra (Tmax &gt; 6s): {penumbra} mL</label>
            <input type="range" min="0" max="150" value={penumbra} onChange={(e) => setPenumbra(parseInt(e.target.value))} className="w-full cursor-pointer accent-cobalt-600" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Patient Age:</label>
              <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} className="v6-input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">NIHSS Score:</label>
              <input type="number" value={nihss} onChange={(e) => setNihss(parseInt(e.target.value) || 0)} className="v6-input" />
            </div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Perfusion Mismatch Diagnostics</h3>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 border border-line bg-card rounded">
              <span className="text-2xs text-mute block uppercase">Mismatch Volume:</span>
              <strong className="text-lg font-mono text-ink">{mismatchVol} mL</strong>
            </div>
            <div className="p-3 border border-line bg-card rounded">
              <span className="text-2xs text-mute block uppercase">Mismatch Ratio:</span>
              <strong className="text-lg font-mono text-ink">{mismatchRatio}x</strong>
            </div>
            <div className="p-3 border border-line bg-card rounded">
              <span className="text-2xs text-mute block uppercase">Ischemic Core Vol:</span>
              <strong className="text-lg font-mono text-ink">{core} mL</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 border rounded ${defuse3 ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-slate-50 border-line text-mute dark:bg-card'}`}>
              <h4 className="font-bold text-xs uppercase mb-1">DEFUSE-3 Late-Window (6-16h)</h4>
              <p className="text-2xs">Requires Core &lt; 70mL, Mismatch Ratio &gt;= 1.8x, and Mismatch Vol &gt;= 15mL.</p>
              <strong className="block mt-2 text-xs">{defuse3 ? "✓ Eligible for EVT" : "✗ Ineligible"}</strong>
            </div>

            <div className={`p-4 border rounded ${dawn ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-slate-50 border-line text-mute dark:bg-card'}`}>
              <h4 className="font-bold text-xs uppercase mb-1">DAWN Late-Window (6-24h)</h4>
              <p className="text-2xs">Age/NIHSS adjusted tissue criteria mismatch targets.</p>
              <strong className="block mt-2 text-xs">{dawn ? "✓ Eligible for EVT" : "✗ Ineligible"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtpCalculatorInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Computed Tomography Perfusion (CTP) Reference Map</h2>
        <p className="text-xs text-mute">Visualizing core versus salvageable penumbra tissue mismatch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="border border-line rounded p-4 bg-card space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase text-center">Tissue Classification</h3>
          <div className="flex justify-around items-center">
            <div className="text-center p-3 border border-red-200 bg-red-50 rounded dark:bg-red-950 dark:border-red-900">
              <span className="block font-bold text-red-700 dark:text-red-300">Ischemic Core</span>
              <span className="font-mono text-2xs text-red-600 dark:text-red-400">CBF &lt; 30%</span>
              <span className="block text-3xs text-mute mt-1">Already infarcted</span>
            </div>
            <div className="text-xl font-bold text-mute">vs</div>
            <div className="text-center p-3 border border-green-200 bg-green-50 rounded dark:bg-green-950 dark:border-green-900">
              <span className="block font-bold text-green-700 dark:text-green-300">At-Risk Penumbra</span>
              <span className="font-mono text-2xs text-green-600 dark:text-green-400">Tmax &gt; 6s</span>
              <span className="block text-3xs text-mute mt-1">Salvageable tissue</span>
            </div>
          </div>
          <div className="text-2xs text-ink-2 text-center font-mono">
            Mismatch Volume = Penumbra Volume - Core Volume
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-ink uppercase">Clinical Guidelines</h3>
          <p className="text-2xs text-ink-2 leading-relaxed">
            In late-window anterior circulation LVO (6-24 hours), automated software maps (RAPID, etc.) help triage patients. If mismatch targets from DEFUSE-3 or DAWN are met, mechanical thrombectomy is class 1A recommended.
          </p>
          <div className="bg-card border border-line rounded p-3 text-2xs text-caution font-semibold">
            ⚠️ Pitfall warning: Motion artifacts and low cardiac index can artificially inflate CBF/Tmax mismatch volumes.
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 6. STROKE TRIALS SCREENER ---
function TrialsScreenerDashboard() {
  const [params, setParams] = useState({
    onset: 8, aspects: 4, core: 60, afib: true, bleedType: 'lobar', bleedVol: 40
  });

  const updateParam = (key, val) => setParams(prev => ({ ...prev, [key]: val }));

  const matchTrials = useMemo(() => {
    return {
      select2: params.onset <= 24 && params.aspects <= 5 && params.core >= 50,
      elan: params.afib,
      enrich: params.bleedType === 'lobar' && params.bleedVol >= 30 && params.bleedVol <= 80
    };
  }, [params]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Clinical Features Screener</h3>
          
          <div>
            <label className="block font-semibold mb-1">Time from onset: {params.onset} hours</label>
            <input type="range" min="1" max="30" value={params.onset} onChange={(e) => updateParam('onset', parseInt(e.target.value))} className="w-full cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">ASPECTS score:</label>
              <input type="number" min="0" max="10" value={params.aspects} onChange={(e) => updateParam('aspects', parseInt(e.target.value) || 0)} className="v6-input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Core Vol (mL):</label>
              <input type="number" min="0" value={params.core} onChange={(e) => updateParam('core', parseInt(e.target.value) || 0)} className="v6-input" />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={params.afib} onChange={(e) => updateParam('afib', e.target.checked)} />
              Atrial Fibrillation present
            </label>
          </div>

          <div className="border-t border-line pt-2 mt-2 space-y-2">
            <span className="font-bold block text-2xs uppercase text-mute">Hemorrhagic parameters:</span>
            <div>
              <label className="block font-semibold mb-1">Bleed Location:</label>
              <select value={params.bleedType} onChange={(e) => updateParam('bleedType', e.target.value)} className="v6-input">
                <option value="lobar">Lobar Spontaneous ICH</option>
                <option value="deep">Deep Basal Ganglia ICH</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Bleed Volume: {params.bleedVol} mL</label>
              <input type="number" value={params.bleedVol} onChange={(e) => updateParam('bleedVol', parseInt(e.target.value) || 0)} className="v6-input" />
            </div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Bedside Trial Eligibility Status</h3>
          <p className="text-2xs text-mute">Screener matching using inclusion/exclusion trial parameters.</p>

          <div className="space-y-3">
            <div className={`p-3 border rounded flex justify-between items-center ${matchTrials.select2 ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-slate-50 border-line text-mute dark:bg-card'}`}>
              <div>
                <h4 className="font-bold text-xs">SELECT2 &amp; ANGEL-ASPECT (Large Core EVT)</h4>
                <p className="text-2xs">For large core ischemic stroke (ASPECTS 3-5 or core &gt;= 50 mL).</p>
              </div>
              <span className="font-bold text-xs">{matchTrials.select2 ? "Eligible" : "Not Matching"}</span>
            </div>

            <div className={`p-3 border rounded flex justify-between items-center ${matchTrials.elan ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-slate-50 border-line text-mute dark:bg-card'}`}>
              <div>
                <h4 className="font-bold text-xs">ELAN &amp; OPTIMAS (Early DOAC Initiation)</h4>
                <p className="text-2xs">Early DOAC start in ischemic stroke with atrial fibrillation.</p>
              </div>
              <span className="font-bold text-xs">{matchTrials.elan ? "Eligible" : "Not Matching"}</span>
            </div>

            <div className={`p-3 border rounded flex justify-between items-center ${matchTrials.enrich ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-slate-50 border-line text-mute dark:bg-card'}`}>
              <div>
                <h4 className="font-bold text-xs">ENRICH (ICH para-fascicular MIPS Evacuation)</h4>
                <p className="text-2xs">Lobar ICH 30-80 mL for minimally invasive surgical evacuation.</p>
              </div>
              <span className="font-bold text-xs">{matchTrials.enrich ? "Eligible" : "Not Matching"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialsScreenerInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Landmark Stroke Trials Bedside Takeaways</h2>
        <p className="text-xs text-mute">Quick summary of landmark evidence impacting daily clinical guidelines.</p>
      </div>

      <div className="overflow-x-auto border border-line rounded focus-visible:outline-none" tabIndex={0}>
        <table className="w-full text-xs text-left bg-card">
          <thead className="bg-paper border-b border-line text-ink font-semibold">
            <tr>
              <th className="p-3">Trial Group</th>
              <th className="p-3">Population</th>
              <th className="p-3">Key Takeaway</th>
              <th className="p-3">Clinical Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink-2">
            <tr>
              <td className="p-3 font-semibold">Large Core EVT (SELECT2 / ANGEL-ASPECT)</td>
              <td className="p-3">ASPECTS 3-5 or core &gt;= 50 mL</td>
              <td className="p-3">EVT significantly improved functional independence (mRS 0-2).</td>
              <td className="p-3">Do not exclude large cores from EVT windows automatically.</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Early DOAC (ELAN / OPTIMAS)</td>
              <td className="p-3">Ischemic stroke + Atrial Fibrillation</td>
              <td className="p-3">Early start (within 48h for minor/moderate) is safe.</td>
              <td className="p-3">Avoid holding DOACs for 14 days routinely. Start early if stable.</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">ICH Evacuation (ENRICH / SWITCH)</td>
              <td className="p-3">Spontaneous lobar ICH 30-80 mL</td>
              <td className="p-3">Para-fascicular MIPS evacuation improved functional outcomes.</td>
              <td className="p-3">Consult neurosurgery emergently for lobar hematomas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 7. PEDIATRIC STROKE / PEDNIHSS ---
function PediatricStrokeDashboard() {
  const [pedScores, setPedScores] = useState({
    loc: 0, gaze: 0, visual: 0, facial: 0, motorArm: 0, motorLeg: 0, ataxia: 0, sensory: 0, language: 0, dysarthria: 0, inattention: 0
  });

  const updateScore = (key, val) => setPedScores(prev => ({ ...prev, [key]: val }));

  const totalPedNihss = useMemo(() => {
    return Object.values(pedScores).reduce((a, b) => a + b, 0);
  }, [pedScores]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs col-span-2">
          <h3 className="font-bold text-xs text-ink uppercase">Pediatric NIHSS (PedNIHSS) Scorer</h3>
          <p className="text-2xs text-mute">Adjusted scoring domains for pediatric clinical presentation.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 border border-line rounded bg-card">
            <div>
              <label className="block font-semibold mb-1">1. Level of Consciousness:</label>
              <select value={pedScores.loc} onChange={(e) => updateScore('loc', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - Alert / Responds to parent</option>
                <option value="1">1 - Sluggish / Slumberous</option>
                <option value="2">2 - Stuporous / Pain response only</option>
                <option value="3">3 - Comatose / Flaccid</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">2. Horizontal Gaze (facial track):</label>
              <select value={pedScores.gaze} onChange={(e) => updateScore('gaze', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - Normal tracking</option>
                <option value="1">1 - Partial gaze palsy</option>
                <option value="2">2 - Forced deviation</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">3. Visual Fields (attention):</label>
              <select value={pedScores.visual} onChange={(e) => updateScore('visual', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - No visual deficit</option>
                <option value="1">1 - Partial hemianopia</option>
                <option value="2">2 - Complete hemianopia</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">4. Facial Palsy (crying symmetry):</label>
              <select value={pedScores.facial} onChange={(e) => updateScore('facial', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - Normal/symmetric crying</option>
                <option value="1">1 - Minor asymmetry</option>
                <option value="2">2 - Partial paralysis</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">5. Motor Arm (withdrawal/drift):</label>
              <select value={pedScores.motorArm} onChange={(e) => updateScore('motorArm', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - No drift / normal reach</option>
                <option value="1">1 - Mild drift / drift before 10s</option>
                <option value="2">2 - Some effort against gravity</option>
                <option value="3">3 - Flaccid / No reach</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">6. Motor Leg (kicking symmetry):</label>
              <select value={pedScores.motorLeg} onChange={(e) => updateScore('motorLeg', parseInt(e.target.value))} className="v6-input">
                <option value="0">0 - Normal kicking</option>
                <option value="1">1 - Drift / drift before 5s</option>
                <option value="2">2 - Lift against gravity only</option>
                <option value="3">3 - Flaccid / No movement</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper flex flex-col justify-between items-center text-center">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-mute uppercase">PedNIHSS Total</h4>
            <div className="text-4xl font-mono font-bold text-cobalt-700 dark:text-cobalt-300 mt-2">
              {totalPedNihss}
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-ink-2 space-y-1 text-left w-full border-t border-line pt-2">
            <strong className="block text-2xs uppercase text-mute">Triage Action:</strong>
            {totalPedNihss >= 6 ? (
              <span className="text-critical">⚠️ High Severity: Suspect emergent LVO. Activate pediatric stroke alert and order STAT MRI/MRA.</span>
            ) : (
              <span className="text-ink">Suspect pediatric stroke. Consult Pediatric Neurology team.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PediatricStrokeInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Acute Pediatric Stroke Pathway Blueprint</h2>
        <p className="text-xs text-mute">Bedside diagnostic flow and key etiologies for pediatric patients (age &lt; 18).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">1. Immediate Diagnostic Workup</h3>
          <ul className="text-2xs space-y-1.5 text-ink-2 list-disc list-inside">
            <li><b>STAT Brain MRI/MRA:</b> Gold standard to differentiate mimics.</li>
            <li><b>CT Angiography (CTA):</b> Secondary option if MRI is unavailable.</li>
            <li><b>Lab Panels:</b> Sickle cell screen, clotting parameters, hypercoagulable panel.</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">2. Top Pediatric Etiologies</h3>
          <ul className="text-2xs space-y-1.5 text-ink-2 list-disc list-inside">
            <li><b>Focal Cerebral Arteriopathy (FCA):</b> Post-infectious vessel narrowing.</li>
            <li><b>Moyamoya Angiopathy:</b> Progressively stenotic carotid terminals.</li>
            <li><b>Congenital Heart Disease:</b> Embolic source from shunts/valves.</li>
            <li><b>Sickle Cell Disease:</b> High risk of microvascular occlusion.</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase text-critical">3. Urgent Call Protocol</h3>
          <p className="text-2xs text-ink-2 leading-relaxed">
            Immediately page the <b>Pediatric Neurology Fellow/Attending on-call</b>. Do not administer thrombolytics or anticoagulants without direct Pediatric Neurology clearance.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- 8. ASPECTS SCORER ---
function AspectsDashboard() {
  const [circ, setCirc] = useState('mca');
  const [regions, setRegions] = useState({
    c: true, i: true, ic: true, l: true, m1: true, m2: true, m3: true, m4: true, m5: true, m6: true,
    pons: true, midbrain: true, thalL: true, thalR: true, occL: true, occR: true, cbL: true, cbR: true
  });

  const toggleRegion = (key) => setRegions(prev => ({ ...prev, [key]: !prev[key] }));

  const score = useMemo(() => {
    if (circ === 'mca') {
      const keys = ['c', 'i', 'ic', 'l', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6'];
      return keys.filter(k => regions[k]).length;
    } else {
      let pcVal = 10;
      if (!regions.pons) pcVal -= 2;
      if (!regions.midbrain) pcVal -= 2;
      if (!regions.thalL) pcVal -= 1;
      if (!regions.thalR) pcVal -= 1;
      if (!regions.occL) pcVal -= 1;
      if (!regions.occR) pcVal -= 1;
      if (!regions.cbL) pcVal -= 1;
      if (!regions.cbR) pcVal -= 1;
      return Math.max(0, pcVal);
    }
  }, [circ, regions]);

  return (
    <div className="space-y-4">
      <div className="flex border-b border-line bg-paper p-1 rounded-md max-w-xs">
        <button
          onClick={() => setCirc('mca')}
          className={`flex-1 px-3 py-1 text-xs font-semibold rounded ${circ === 'mca' ? 'bg-white shadow-sm text-ink dark:bg-card' : 'text-mute'}`}
        >
          MCA ASPECTS
        </button>
        <button
          onClick={() => setCirc('pc')}
          className={`flex-1 px-3 py-1 text-xs font-semibold rounded ${circ === 'pc' ? 'bg-white shadow-sm text-ink dark:bg-card' : 'text-mute'}`}
        >
          Posterior Circ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase">Interactive Region Selector</h3>
          <p className="text-2xs text-mute">Click a region to toggle acute ischemic changes (grey-white loss or hypodensity).</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {circ === 'mca' ? (
              <>
                <button onClick={() => toggleRegion('c')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.c ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Caudate (C): {regions.c ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('i')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.i ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Insula (I): {regions.i ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('ic')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.ic ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Internal Capsule: {regions.ic ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('l')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.l ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Lentiform (L): {regions.l ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m1')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m1 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M1 (Anterior MCA): {regions.m1 ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m2')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m2 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M2 (Lateral MCA): {regions.m2 ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m3')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m3 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M3 (Posterior MCA): {regions.m3 ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m4')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m4 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M4 (Superior M1): {regions.m4 ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m5')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m5 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M5 (Superior M2): {regions.m5 ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('m6')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.m6 ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  M6 (Superior M3): {regions.m6 ? "Intact" : "Ischemia"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => toggleRegion('pons')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.pons ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Pons (-2 pt): {regions.pons ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('midbrain')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.midbrain ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  Midbrain (-2 pt): {regions.midbrain ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('thalL')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.thalL ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  L Thalamus (-1 pt): {regions.thalL ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('thalR')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.thalR ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  R Thalamus (-1 pt): {regions.thalR ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('occL')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.occL ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  L Occipital (-1 pt): {regions.occL ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('occR')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.occR ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  R Occipital (-1 pt): {regions.occR ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('cbL')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.cbL ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  L Cerebellar (-1 pt): {regions.cbL ? "Intact" : "Ischemia"}
                </button>
                <button onClick={() => toggleRegion('cbR')} className={`p-2 rounded text-left border text-2xs transition-colors ${regions.cbR ? 'bg-slate-50 border-line text-ink dark:bg-card' : 'bg-red-100 border-red-300 text-red-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900'}`}>
                  R Cerebellar (-1 pt): {regions.cbR ? "Intact" : "Ischemia"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper flex flex-col justify-between items-center text-center">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-mute uppercase">{circ === 'mca' ? 'MCA ASPECTS' : 'PC-ASPECTS'}</h4>
            <div className="text-4xl font-mono font-bold text-cobalt-700 dark:text-cobalt-300 mt-2">
              {score} / 10
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-ink-2 space-y-1 text-left w-full border-t border-line pt-2">
            <strong className="block text-2xs uppercase text-mute">Clinical Guide:</strong>
            {score >= 6 ? (
              <span className="text-ok">✓ ASPECTS &gt;= 6 indicates favorable tissue profile for EVT. Class 1A recommendation in standard windows.</span>
            ) : (
              <span className="text-critical">⚠️ ASPECTS &lt; 6 indicates large-core infarction. Higher risk of symptomatic hemorrhage and lower benefit from EVT. Refer to SELECT2 trial guidelines.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AspectsInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">ASPECTS Axial Slice Topography</h2>
        <p className="text-xs text-mute">Anatomy of the 10 MCA cortical and deep brain regions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase text-center">Level 1: Ganglionic (Basal Ganglia Slice)</h3>
          <div className="h-44 bg-slate-50 border border-line rounded flex items-center justify-center dark:bg-paper-2">
            {/* Axial Slice Schematic */}
            <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="var(--line)" strokeWidth="1.5" />
              {/* Internal Structures */}
              <path d="M40 30 Q45 50 40 70" fill="none" stroke="var(--line)" strokeWidth="1" />
              <text x="32" y="42" fontSize="6" className="fill-ink font-bold">C</text>
              <text x="32" y="58" fontSize="6" className="fill-ink font-bold">L</text>
              <text x="44" y="50" fontSize="5" className="fill-ink font-bold">IC</text>
              <text x="20" y="50" fontSize="6" className="fill-ink font-bold">I</text>
              {/* Cortical */}
              <text x="60" y="32" fontSize="5" className="fill-ink">M1</text>
              <text x="72" y="50" fontSize="5" className="fill-ink">M2</text>
              <text x="60" y="68" fontSize="5" className="fill-ink">M3</text>
            </svg>
          </div>
          <div className="text-3xs text-mute text-center font-mono">
            C: Caudate | I: Insula | IC: Internal Capsule | L: Lentiform
          </div>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase text-center">Level 2: Supraganglionic (Coronal Slice)</h3>
          <div className="h-44 bg-slate-50 border border-line rounded flex items-center justify-center dark:bg-paper-2">
            <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="var(--line)" strokeWidth="1.5" />
              {/* Cortical */}
              <text x="60" y="30" fontSize="5" className="fill-ink">M4</text>
              <text x="72" y="50" fontSize="5" className="fill-ink">M5</text>
              <text x="60" y="70" fontSize="5" className="fill-ink">M6</text>
            </svg>
          </div>
          <div className="text-3xs text-mute text-center font-mono">
            M4: Anterior superior MCA | M5: Lateral superior | M6: Posterior superior
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 9. ICH REVERSAL PROTOCOLS ---
function IchReversalDashboard() {
  const [drug, setDrug] = useState('warfarin');
  const [weight, setWeight] = useState(80);
  const [inr, setInr] = useState(2.8);

  const dose = useMemo(() => {
    const w = parseFloat(weight) || 0;
    if (drug === 'warfarin') {
      let pccDose = 25;
      if (inr >= 4 && inr <= 6) pccDose = 35;
      if (inr > 6) pccDose = 50;
      return {
        agent: "Kcentra (4-factor PCC)",
        amount: `${pccDose * w} units IV bolus`,
        other: "Co-administer Vitamin K 10mg IV (slow infusion over 20-30 mins to prevent anaphylaxis)."
      };
    } else if (drug === 'doac') {
      return {
        agent: "Andexanet Alfa (or 4-factor PCC if unavailable)",
        amount: `PCC 50 units/kg * ${w} kg = ${50 * w} units IV bolus`,
        other: "Target SBP target 130-140 mmHg immediately."
      };
    } else if (drug === 'heparin') {
      return {
        agent: "Protamine Sulfate",
        amount: `1 mg per 100 units of UFH (max 50 mg)`,
        other: "Adjust dose based on time elapsed since heparin was infused."
      };
    } else {
      return {
        agent: "Antiplatelets (Aspirin/Plavix)",
        amount: "No routine platelet transfusion",
        other: "PATCH trial showed routine platelets increase mortality. Transfuse only for severe thrombocytopenia or emergency neurosurgical procedure."
      };
    }
  }, [drug, weight, inr]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Exposure Details</h3>
          
          <div>
            <label className="block font-semibold mb-1">Exposure Anticoagulant:</label>
            <select value={drug} onChange={(e) => setDrug(e.target.value)} className="v6-input">
              <option value="warfarin">Warfarin (VKA)</option>
              <option value="doac">Factor Xa (Apixaban / Rivaroxaban)</option>
              <option value="heparin">Heparin (UFH / LMWH)</option>
              <option value="antiplatelet">Antiplatelets (Aspirin / Clopidogrel)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Patient Weight (kg):</label>
            <input type="number" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} className="v6-input" />
          </div>

          {drug === 'warfarin' && (
            <div>
              <label className="block font-semibold mb-1">Baseline INR:</label>
              <input type="number" step="0.1" value={inr} onChange={(e) => setInr(parseFloat(e.target.value) || 0)} className="v6-input" />
            </div>
          )}
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider text-critical">
            Emergency Reversal Protocol Dose
          </h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-2xs text-mute block uppercase">Reversal Agent:</span>
              <strong className="text-base text-ink">{dose.agent}</strong>
            </div>
            <div>
              <span className="text-2xs text-mute block uppercase">Calculated Dosage:</span>
              <strong className="text-lg font-mono text-cobalt-700 dark:text-cobalt-300">{dose.amount}</strong>
            </div>
            <div className="bg-card p-3 border border-line rounded text-2xs text-ink-2 leading-relaxed">
              <strong className="block text-ink mb-1 text-3xs uppercase text-mute">Co-interventions &amp; Target BP:</strong>
              {dose.other}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IchReversalInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Acute Spontaneous ICH Triage Flowsheet</h2>
        <p className="text-xs text-mute">hyperacute management algorithm for intracerebral hemorrhage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <div className="text-xs font-bold text-cobalt-700 uppercase dark:text-cobalt-300">1. Confirm &amp; Assess</div>
          <p className="text-3xs text-ink-2 mt-1">Non-contrast CT to verify ICH. Check baseline GCS and compute ICH Score.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <div className="text-xs font-bold text-teal-700 uppercase dark:text-teal-300">2. Anticoagulant Reversal</div>
          <p className="text-3xs text-ink-2 mt-1">Give 4-factor PCC for warfarin or DOAC. Avoid platelets for antiplatelets.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <div className="text-xs font-bold text-indigo-700 uppercase dark:text-indigo-300">3. BP Management</div>
          <p className="text-3xs text-ink-2 mt-1">Titrate IV labetalol or nicardipine. Target SBP 130-140 mmHg (AHA 2022).</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <div className="text-xs font-bold text-red-700 uppercase dark:text-red-300">4. Surg Triage &amp; Scan</div>
          <p className="text-3xs text-ink-2 mt-1">Consult NSGY for cerebellar &gt;3cm or IVH hydrocephalus. Repeat CT in 6h.</p>
        </div>
      </div>
    </div>
  );
}

// --- 10. DVT PROPHYLAXIS CARD ---
function DvtProphylaxisDashboard() {
  const [strokeType, setStrokeType] = useState('nonLytic');

  const schedule = useMemo(() => {
    switch (strokeType) {
      case 'nonLytic':
        return {
          title: "Ischemic Stroke (No Thrombolysis)",
          mech: "Apply sequential compression devices (SCDs) immediately on admission. Keep on 24h/day.",
          pharm: "Start LMWH (Enoxaparin 40mg SC daily) or UFH (5000 units SC q8h) starting Day 2 (within 24-48h of admission)."
        };
      case 'lytic':
        return {
          title: "Ischemic Stroke (Post-IV Thrombolysis)",
          mech: "Apply SCDs immediately on arrival in the ER or CT scanner.",
          pharm: "Strictly HOLD pharmacologic prophylaxis for 24 hours. Perform repeat head CT at 24 hours; if sICH is ruled out, initiate Enoxaparin or UFH."
        };
      case 'ich':
        return {
          title: "Spontaneous Intracerebral Hemorrhage (ICH)",
          mech: "Apply SCDs immediately on admission.",
          pharm: "Initiate Enoxaparin or UFH at 24-48 hours post-onset ONLY IF repeat head CT (stability scan) at 6 hours confirms no hematoma expansion."
        };
      default:
        // EVD
        return {
          title: "Post-EVD Procedure",
          mech: "Apply SCDs immediately.",
          pharm: "Strictly HOLD pharmacologic prophylaxis for 24 hours post-procedure. Initiate only after Neurosurgery clearance and stable head imaging."
        };
    }
  }, [strokeType]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Select Scenario</h3>
          <select value={strokeType} onChange={(e) => setStrokeType(e.target.value)} className="v6-input">
            <option value="nonLytic">Ischemic Stroke (No Lytic)</option>
            <option value="lytic">Ischemic Stroke (Post-Lytic)</option>
            <option value="ich">Hemorrhagic Stroke (ICH)</option>
            <option value="evd">Post-EVD Procedure</option>
          </select>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-4">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider text-cobalt-700 dark:text-cobalt-300">
            VTE Prophylaxis Timeline: {schedule.title}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 border border-line bg-card rounded space-y-1">
              <strong className="block text-ink text-2xs uppercase text-mute">Mechanical SCDs:</strong>
              <p className="text-ink-2">{schedule.mech}</p>
            </div>
            <div className="p-3 border border-line bg-card rounded space-y-1">
              <strong className="block text-ink text-2xs uppercase text-mute">Pharmacological (LMWH/UFH):</strong>
              <p className="text-ink-2">{schedule.pharm}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DvtProphylaxisInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Post-Stroke VTE Prophylaxis Timing Matrix</h2>
        <p className="text-xs text-mute">Standardized guidelines for mechanical and pharmacologic prophylaxis.</p>
      </div>

      <div className="overflow-x-auto border border-line rounded focus-visible:outline-none" tabIndex={0}>
        <table className="w-full text-xs text-left bg-card">
          <thead className="bg-paper border-b border-line text-ink font-semibold">
            <tr>
              <th className="p-3">Stroke Type</th>
              <th className="p-3">Mechanical SCDs</th>
              <th className="p-3">Pharmacologic Heparin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink-2">
            <tr>
              <td className="p-3 font-semibold">Ischemic (No lytic)</td>
              <td className="p-3 text-ok font-semibold">Immediate start</td>
              <td className="p-3">Start Day 2 (within 24-48 hours)</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Ischemic (Post-lytic)</td>
              <td className="p-3 text-ok font-semibold">Immediate start</td>
              <td className="p-3 text-critical font-semibold">HOLD 24 hours. Start after 24-hour CT.</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Hemorrhagic (ICH)</td>
              <td className="p-3 text-ok font-semibold">Immediate start</td>
              <td className="p-3">Start 24-48 hours if stability CT confirmed.</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">Post-EVD Placement</td>
              <td className="p-3 text-ok font-semibold">Immediate start</td>
              <td className="p-3 text-critical font-semibold">HOLD 24 hours. Start after NSGY clearance.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 11. PUPILLOMETRY INFOGRAPHIC (Simulator handles Dashboard) ---
function PupillometryInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">NPi Pupillometry Bedside Scale</h2>
        <p className="text-xs text-mute">Pupil reactivity index metrics for monitoring brainstem herniation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-line bg-card rounded-md space-y-2 text-center">
          <div className="text-lg font-mono font-bold text-ok">3.0 - 5.0</div>
          <h3 className="font-bold text-xs text-ink uppercase">Normal Reactivity</h3>
          <p className="text-3xs text-ink-2">Pupil constricts rapidly in response to light stimulation. Normal cerebral compliance.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2 text-center">
          <div className="text-lg font-mono font-bold text-caution">1.0 - 2.9</div>
          <h3 className="font-bold text-xs text-ink uppercase">Abnormal / Sluggish</h3>
          <p className="text-3xs text-ink-2">Pupil response is slow or sluggish. Early indicator of elevated intracranial pressure.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2 text-center">
          <div className="text-lg font-mono font-bold text-critical">0.0 - 0.9</div>
          <h3 className="font-bold text-xs text-ink uppercase">Non-Reactive / Blown</h3>
          <p className="text-3xs text-ink-2">Critical brainstem compression or oculomotor nerve dysfunction. Trigger herniation rescue protocol.</p>
        </div>
      </div>
    </div>
  );
}

// --- 12. SAFETY PAUSE & TNK DOSER ---
function SafetyPauseDashboard() {
  const [weight, setWeight] = useState(80);
  const [checkedItems, setCheckedItems] = useState({
    id: false, onset: false, ct: false, contra: false, bp: false
  });

  const toggleCheck = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));

  const tnkDose = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const calc = 0.25 * w;
    return Math.min(25, Math.round(calc * 100) / 100);
  }, [weight]);

  const tpaDose = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const total = Math.min(90, Math.round(0.9 * w * 100) / 100);
    const bolus = Math.round(total * 0.1 * 100) / 100;
    const infusion = Math.round((total - bolus) * 100) / 100;
    return { total, bolus, infusion };
  }, [weight]);

  const allPassed = Object.values(checkedItems).every(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs col-span-2">
          <h3 className="font-bold text-xs text-ink uppercase">Pre-Thrombolytic Safety Checks</h3>
          <p className="text-2xs text-mute">Perform with bedside nurse and pharmacist present in the scanner.</p>

          <div className="space-y-2">
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
              <input type="checkbox" checked={checkedItems.id} onChange={() => toggleCheck('id')} />
              <div className="text-xs">
                <strong className="text-ink">Patient ID Confirmed:</strong> Verify 2 identifiers (name, DOB) matching lytic order.
              </div>
            </label>
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
              <input type="checkbox" checked={checkedItems.onset} onChange={() => toggleCheck('onset')} />
              <div className="text-xs">
                <strong className="text-ink">Window Confirmed:</strong> Onset or LKW is strictly within 4.5 hours.
              </div>
            </label>
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
              <input type="checkbox" checked={checkedItems.ct} onChange={() => toggleCheck('ct')} />
              <div className="text-xs">
                <strong className="text-ink">Hemorrhage Ruled Out:</strong> Head CT read shows no intracranial hemorrhage.
              </div>
            </label>
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
              <input type="checkbox" checked={checkedItems.contra} onChange={() => toggleCheck('contra')} />
              <div className="text-xs">
                <strong className="text-ink">Contraindications Screened:</strong> No active bleed, platelet &lt;100k, DOAC within 48h with elevated levels.
              </div>
            </label>
            <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
              <input type="checkbox" checked={checkedItems.bp} onChange={() => toggleCheck('bp')} />
              <div className="text-xs">
                <strong className="text-ink">Blood Pressure Target:</strong> SBP &lt; 185 and DBP &lt; 110 mmHg.
              </div>
            </label>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper flex flex-col justify-between space-y-4">
          <div className="space-y-3 text-xs w-full">
            <h4 className="font-bold text-xs uppercase text-ink">Weight-Based Dose</h4>
            <div>
              <label className="block font-semibold mb-1">Patient Weight (kg):</label>
              <input type="number" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} className="v6-input" />
            </div>

            <div className="bg-card p-3 border border-line rounded space-y-3">
              <div>
                <span className="text-3xs text-mute block uppercase">Tenecteplase (TNK) Dose:</span>
                <strong className="text-base font-mono text-ink">{tnkDose} mg IV bolus</strong>
                <span className="text-[10px] text-mute block">0.25 mg/kg (max 25 mg) over 5-10s</span>
              </div>
              <div className="border-t border-line pt-2">
                <span className="text-3xs text-mute block uppercase">Alteplase (tPA) Dose:</span>
                <strong className="text-xs font-mono text-ink">Total: {tpaDose.total} mg</strong>
                <span className="text-[10px] text-mute block">Bolus: {tpaDose.bolus} mg | Infusion: {tpaDose.infusion} mg</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            {allPassed ? (
              <span className="text-xs font-semibold text-ok block bg-ok-100 border border-ok rounded p-2 dark:bg-ok-950 dark:text-ok-300">
                ✓ Safety pause complete. Authorized to spike lytic bag.
              </span>
            ) : (
              <span className="text-xs font-semibold text-caution block bg-caution-soft border border-caution rounded p-2">
                ⚠️ Complete safety checks first.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetyPauseInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Scanner Safety Pause &amp; Time-Out Blueprint</h2>
        <p className="text-xs text-mute">Multidisciplinary checks performed at the CT console prior to thrombolysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <div className="text-xs font-bold text-cobalt-700 uppercase dark:text-cobalt-300">🧑‍⚕️ Bedside Nurse</div>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li>Verify 2 patient identifiers</li>
            <li>Confirm large bore IV patency</li>
            <li>Cycle BP cuffs (ensure &lt; 185/110)</li>
            <li>Draw up correct TNK/tPA bolus dose</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <div className="text-xs font-bold text-teal-700 uppercase dark:text-teal-300">🧠 Stroke Fellow</div>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li>Confirm LKW/onset &lt; 4.5h</li>
            <li>Verify head CT excludes bleed</li>
            <li>Complete contraindications checklist</li>
            <li>Obtain final treatment consent</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <div className="text-xs font-bold text-indigo-700 uppercase dark:text-indigo-300">💊 Pharmacist</div>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li>Double-check weight calculation</li>
            <li>Confirm bolus vs infusion doses</li>
            <li>Spike bag at scanner console</li>
            <li>Verify drug interactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- 13. HOSPITAL ROADMAP ---
function HospitalRoadmapDashboard() {
  const [day, setDay] = useState(0);
  const [checks, setChecks] = useState({
    tele: false, bp: false, swallow: false,
    mri: false, echo: false, therapy: false,
    rehab: false, lipid: false, education: false
  });

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const activeChecks = useMemo(() => {
    if (day === 0) return ['tele', 'bp', 'swallow'];
    if (day === 1) return ['mri', 'echo', 'therapy'];
    return ['rehab', 'lipid', 'education'];
  }, [day]);

  const score = useMemo(() => {
    const passed = activeChecks.filter(k => checks[k]).length;
    return Math.round((passed / activeChecks.length) * 100);
  }, [activeChecks, checks]);

  return (
    <div className="space-y-4">
      <div className="flex border-b border-line bg-paper p-1 rounded-md max-w-xs">
        {['Day 0', 'Day 1', 'Day 2+'].map((d, idx) => (
          <button
            key={d}
            onClick={() => setDay(idx)}
            className={`flex-1 px-3 py-1 text-xs font-semibold rounded ${day === idx ? 'bg-white shadow-sm text-ink dark:bg-card' : 'text-mute'}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase">
            {day === 0 ? "Day 0 Checklist: Stabilization" : day === 1 ? "Day 1 Checklist: Secondary Workup" : "Day 2+ Checklist: Disposition Planning"}
          </h3>

          <div className="space-y-2">
            {day === 0 ? (
              <>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.tele} onChange={() => toggleCheck('tele')} />
                  <div className="text-xs">
                    <strong className="text-ink">Telemetry Bed:</strong> Confirm cardiac monitor is ordered and connected on the stroke floor or ICU.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.bp} onChange={() => toggleCheck('bp')} />
                  <div className="text-xs">
                    <strong className="text-ink">BP Parameters Established:</strong> Confirm SBP &lt; 180 (post-lytics) or permissive targets are ordered.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.swallow} onChange={() => toggleCheck('swallow')} />
                  <div className="text-xs">
                    <strong className="text-ink">Dysphagia Assessment:</strong> Nurse swallow screen signed; NPO maintained if screen failed.
                  </div>
                </label>
              </>
            ) : day === 1 ? (
              <>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.mri} onChange={() => toggleCheck('mri')} />
                  <div className="text-xs">
                    <strong className="text-ink">Brain MRI/MRA:</strong> Verify scan is completed and reviewed for infarct size.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.echo} onChange={() => toggleCheck('echo')} />
                  <div className="text-xs">
                    <strong className="text-ink">Echocardiogram:</strong> Verify echo ordered to rule out cardioembolic source (PFO, thrombus).
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.therapy} onChange={() => toggleCheck('therapy')} />
                  <div className="text-xs">
                    <strong className="text-ink">Therapy Evaluations:</strong> PT/OT consults placed and baseline functional evaluations completed.
                  </div>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.rehab} onChange={() => toggleCheck('rehab')} />
                  <div className="text-xs">
                    <strong className="text-ink">Rehab Consult:</strong> Assessment by PM&amp;R for acute inpatient rehab (AIR) vs subacute placement.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.lipid} onChange={() => toggleCheck('lipid')} />
                  <div className="text-xs">
                    <strong className="text-ink">Lipid optimization:</strong> Fasting lipid panel reviewed; High-intensity Atorvastatin 80mg started.
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-overlay cursor-pointer select-none">
                  <input type="checkbox" checked={checks.education} onChange={() => toggleCheck('education')} />
                  <div className="text-xs">
                    <strong className="text-ink">Discharge Counseling:</strong> Review warning signs, medications adherence, and clinic follow-up date.
                  </div>
                </label>
              </>
            )}
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper flex flex-col justify-between items-center text-center">
          <div className="space-y-2 w-full">
            <h4 className="text-xs font-semibold text-mute uppercase">Discharge Readiness</h4>
            <div className="relative flex items-center justify-center h-28 w-28 mx-auto mt-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="var(--line)" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="var(--cobalt)" strokeWidth="8" fill="transparent"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * score) / 100}
                  className="transition-all duration-500" />
              </svg>
              <span className="absolute text-2xl font-bold font-mono text-ink">{score}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HospitalRoadmapInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Stroke Ward Hospital Course Timeline</h2>
        <p className="text-xs text-mute">Bedside resident workflow checklist for daily inpatient rounds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">Day 0: Hyperacute</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>Telemetry monitor:</b> Establish telemetry.</li>
            <li><b>BP control:</b> Set SBP target &lt; 180 (lytics) or &lt; 220 (non-lytics).</li>
            <li><b>Swallow screen:</b> NPO until swallow pass.</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">Day 1: Diagnostics</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>Infarct review:</b> Brain MRI/MRA review.</li>
            <li><b>Lipids:</b> Fasting lipid panel.</li>
            <li><b>Echocardiogram:</b> Rule out PFO / apical thrombus.</li>
            <li><b>PT/OT evaluations:</b> Physical &amp; Occupational therapy.</li>
          </ul>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase font-semibold text-cobalt-700 dark:text-cobalt-300">Day 2+: Disposition</h3>
          <ul className="text-2xs space-y-1 text-ink-2 list-disc list-inside">
            <li><b>Discharge meds:</b> High-intensity statin, AF DOAC.</li>
            <li><b>Rehab placement:</b> Assess AIR vs SNF vs Home.</li>
            <li><b>FAST counseling:</b> Teach stroke warnings signs.</li>
            <li><b>Follow-up clinic:</b> Set stroke follow-up appointment.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- 14. TELESTROKE ROUTING ---
function TelestrokeRoutingDashboard() {
  const [site, setSite] = useState('spokeA');
  const [hardware, setHardware] = useState('offline');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 bg-paper space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Triage Panel</h3>
          
          <div>
            <label className="block font-semibold mb-1">Referral Spoke Site:</label>
            <select value={site} onChange={(e) => setSite(e.target.value)} className="v6-input">
              <option value="spokeA">Spoke A: Valley Community Hospital</option>
              <option value="spokeB">Spoke B: Ridge Crest Regional</option>
              <option value="spokeC">Spoke C: Mercy Health Clinic</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Camera Connection:</label>
            <div className="flex gap-2">
              <button onClick={() => setHardware('online')} className={`flex-1 py-1 rounded text-2xs font-semibold border ${hardware === 'online' ? 'bg-ok-100 border-ok text-ok-900 dark:bg-ok-950 dark:text-ok-300' : 'bg-transparent border-line'}`}>
                Online
              </button>
              <button onClick={() => setHardware('offline')} className={`flex-1 py-1 rounded text-2xs font-semibold border ${hardware === 'offline' ? 'bg-critical-soft border-critical text-critical' : 'bg-transparent border-line'}`}>
                Offline
              </button>
            </div>
          </div>
        </div>

        <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3 text-xs">
          <h3 className="font-bold text-xs text-ink uppercase">Telestroke Call routing &amp; Setup</h3>
          
          <div className="bg-card p-3 border border-line rounded space-y-2">
            <div>
              <span className="text-3xs text-mute block uppercase">Triage status:</span>
              <strong className="text-xs text-ink">{site === 'spokeA' ? "Spoke A active for telestroke alert." : "Spoke site selected."}</strong>
            </div>
            <div>
              <span className="text-3xs text-mute block uppercase">Telemetry Connection:</span>
              <strong className={`text-xs ${hardware === 'online' ? 'text-ok' : 'text-critical'}`}>
                {hardware === 'online' ? "✓ Tele-health camera feed established. Ready for remote NIHSS exam." : "✗ Connection offline. Dial spoke hub direct line or phone regional operator."}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TelestrokeRoutingInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Telestroke Referral and Transport Network</h2>
        <p className="text-xs text-mute">Triage pathways for acute remote stroke consults.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <h3 className="font-bold text-xs text-ink">1. Remote Spoke Site</h3>
          <p className="text-3xs text-ink-2 leading-relaxed">
            Local clinic triggers acute stroke alert. Nurse performs bedside vitals. Stroke center notified via regional central pager.
          </p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <h3 className="font-bold text-xs text-ink">2. Tele-health Consultation</h3>
          <p className="text-3xs text-ink-2 leading-relaxed">
            Remote camera connection established. Stroke fellow conducts virtual NIHSS. Reads head CT remotely to confirm lytic eligibility.
          </p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1 text-center">
          <h3 className="font-bold text-xs text-ink">3. Transport Logistics</h3>
          <p className="text-3xs text-ink-2 leading-relaxed">
            Drip-and-ship: spike lytic bolus at spoke site and arrange STAT helicopter or critical transport to primary Stroke Center for EVT.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- 15. HINTS+ INFOGRAPHIC (Simulator handles Dashboard) ---
function HintsInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">HINTS+ Bedside Diagnostic Blueprint</h2>
        <p className="text-xs text-mute">Differentiating central posterior circulation stroke from peripheral vestibular neuritis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 border border-line bg-card rounded-md space-y-1">
          <h3 className="font-bold text-xs text-ink">Head Impulse</h3>
          <p className="text-3xs text-ink-2"><b>Central:</b> Normal / Negative (eyes stay locked on target).</p>
          <p className="text-3xs text-ink-2"><b>Peripheral:</b> Corrective catch-up saccade observed.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1">
          <h3 className="font-bold text-xs text-ink">Nystagmus</h3>
          <p className="text-3xs text-ink-2"><b>Central:</b> Direction-changing (horizontal shifts gaze direction).</p>
          <p className="text-3xs text-ink-2"><b>Peripheral:</b> Direction-fixed horizontal nystagmus.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1">
          <h3 className="font-bold text-xs text-ink">Test of Skew</h3>
          <p className="text-3xs text-ink-2"><b>Central:</b> Skew deviation present (vertical alignment shift).</p>
          <p className="text-3xs text-ink-2"><b>Peripheral:</b> No vertical skew deviation.</p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-1">
          <h3 className="font-bold text-xs text-ink">Hearing (+)</h3>
          <p className="text-3xs text-ink-2"><b>Central:</b> New unilateral hearing loss observed.</p>
          <p className="text-3xs text-ink-2"><b>Peripheral:</b> Hearing intact.</p>
        </div>
      </div>

      <div className="bg-card border border-line rounded p-4 text-xs text-center text-critical font-bold uppercase tracking-wider">
        ⚠️ Stroke Alert: Any SINGLE Central Sign Indicates a Posterior Circulation Stroke (Infarkt).
      </div>
    </div>
  );
}

// --- 16. NEURO EXAMS INFOGRAPHIC (Simulator handles Dashboard) ---
function NeuroExamsInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Bedside Neuro-Exam Classifier Matrix</h2>
        <p className="text-xs text-mute">Diagnostic steps for aphasia, delirium screening, and coma exams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">1. Aphasia Classifier</h3>
          <p className="text-2xs text-ink-2 leading-normal">
            Verify fluency (Broca's: non-fluent, Wernicke's: fluent), comprehension (impaired in Wernicke's), and repetition (impaired in Conduction aphasia).
          </p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase">2. Delirium screening (CAM-ICU)</h3>
          <p className="text-2xs text-ink-2 leading-normal">
            Assess acute onset fluctuant course, inattention (squeeze hand on letter 'A'), altered level of consciousness (RASS), and disorganized thinking.
          </p>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase text-critical">3. Structured Coma Exam</h3>
          <p className="text-2xs text-ink-2 leading-normal">
            Assess brainstem reflexes: Pupillary reaction, Corneal reflex, Oculocephalic (doll's eyes), Vestibulocochlear (cold calorics), Cough/Gag reflexes.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- 17. REFERENCE LIBRARY ---
function ReferenceLibraryDashboard({ isTraineeMode, navigateTo }) {
  const [evidenceFilter, setEvidenceFilter] = useState('');
  const [atlasFilters, setAtlasFilters] = useState({ topic: '', certainty: '', evidenceType: '', verificationStatus: '', query: '' });
  const [atlasExpandAll, setAtlasExpandAll] = useState(false);
  const [guidelineLibraryQuery, setGuidelineLibraryQuery] = useState('');
  const [guidelineLibraryGuideline, setGuidelineLibraryGuideline] = useState('');
  const [guidelineLibrarySection, setGuidelineLibrarySection] = useState('');
  const [guidelineLibraryClass, setGuidelineLibraryClass] = useState('');

  const guidelineLibraryGuidelineOptions = useMemo(() => {
    return GUIDELINE_LIBRARY_INDEX.map((guideline) => ({
      id: guideline.id,
      label: guideline.shortTitle || guideline.title
    }));
  }, []);

  const guidelineLibrarySectionOptions = useMemo(() => {
    const sections = new Set();
    const guidelines = guidelineLibraryGuideline
      ? GUIDELINE_LIBRARY_INDEX.filter((guideline) => guideline.id === guidelineLibraryGuideline)
      : GUIDELINE_LIBRARY_INDEX;
    guidelines.forEach((guideline) => {
      guideline.recommendations.forEach((rec) => {
        if (rec.section) sections.add(rec.section);
      });
    });
    return Array.from(sections).sort();
  }, [guidelineLibraryGuideline]);

  const guidelineLibraryClassOptions = useMemo(() => {
    const classSet = new Set();
    GUIDELINE_LIBRARY_INDEX.forEach((guideline) => {
      guideline.recommendations.forEach((rec) => {
        classSet.add(rec.classOfRec || 'Statement');
      });
    });
    const preferredOrder = ['I', 'IIa', 'IIb', 'III', 'Statement'];
    const ordered = preferredOrder.filter((item) => classSet.has(item));
    const remaining = Array.from(classSet).filter((item) => !preferredOrder.includes(item)).sort();
    return [...ordered, ...remaining];
  }, []);

  const filteredGuidelineLibrary = useMemo(() => {
    const query = guidelineLibraryQuery.trim().toLowerCase();
    const classPriority = { I: 0, IIa: 1, IIb: 2, III: 3, Statement: 4 };
    const getRecScore = (rec, guideline) => {
      if (!query) return 0;
      return rankText(query, [rec.text, rec.section, guideline.title, guideline.shortTitle || '']);
    };

    return GUIDELINE_LIBRARY_INDEX
      .filter((guideline) => !guidelineLibraryGuideline || guideline.id === guidelineLibraryGuideline)
      .map((guideline) => {
        const filteredRecs = guideline.recommendations
          .map((rec) => ({ ...rec, _score: getRecScore(rec, guideline) }))
          .filter((rec) => {
            if (guidelineLibrarySection && rec.section !== guidelineLibrarySection) return false;
            const recClass = rec.classOfRec || 'Statement';
            if (guidelineLibraryClass && recClass !== guidelineLibraryClass) return false;
            if (query && rec._score <= 0) return false;
            return true;
          })
          .sort((a, b) => {
            const classA = a.classOfRec || 'Statement';
            const classB = b.classOfRec || 'Statement';
            const rankA = classPriority[classA] ?? 5;
            const rankB = classPriority[classB] ?? 5;
            if (rankA !== rankB) return rankA - rankB;
            return (b._score || 0) - (a._score || 0);
          });
        return { ...guideline, recommendations: filteredRecs };
      })
      .filter((guideline) => guideline.recommendations.length > 0);
  }, [guidelineLibraryQuery, guidelineLibraryGuideline, guidelineLibrarySection, guidelineLibraryClass]);

  const guidelineLibraryResultsCount = useMemo(() => {
    return filteredGuidelineLibrary.reduce((sum, guideline) => sum + guideline.recommendations.length, 0);
  }, [filteredGuidelineLibrary]);

  const evidenceSectionMatches = (sectionTitle, documentTitles) => {
    if (!evidenceFilter) return true;
    const filter = evidenceFilter.toLowerCase();
    if (sectionTitle.toLowerCase().includes(filter)) return true;
    return documentTitles.some(title => title.toLowerCase().includes(filter));
  };

  const atlasToneClass = (tone) => {
    switch (tone) {
      case 'emerald': return 'bg-ok-100 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800';
      case 'sky': return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-800';
      case 'amber': return 'bg-warn-100 text-warn-900 border-warn-200 dark:bg-warn-950 dark:text-warn-300 dark:border-warn-800';
      case 'rose': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800';
      case 'indigo': return 'bg-cobalt-100 text-cobalt-800 border-cobalt-200 dark:bg-cobalt-900 dark:text-cobalt-300 dark:border-cobalt-700';
      case 'slate': return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-paper-2 dark:text-ink dark:border-line';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:border-line';
    }
  };

  const atlasPill = (label, tone) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${atlasToneClass(tone)}`}>{label}</span>
  );

  const renderAtlasCard = (trial, opts = {}) => {
    const { keyPrefix = 'atlas', showRelatedActive = true } = opts;
    const certaintyMeta = (CERTAINTY_LABELS && CERTAINTY_LABELS[trial.certainty]) || { label: trial.certainty, tone: 'slate' };
    const evTypeMeta = (EVIDENCE_TYPE_LABELS && EVIDENCE_TYPE_LABELS[trial.evidenceType]) || { label: trial.evidenceType, tone: 'slate' };
    const verifMeta = (VERIFICATION_STATUS_LABELS && VERIFICATION_STATUS_LABELS[trial.verificationStatus]) || { label: trial.verificationStatus, tone: 'slate' };
    const cits = resolveCitations(trial.citationIds || []);
    const relatedActive = showRelatedActive ? (trial.relatedActiveTrialIds || []).map((id) => evidenceActiveTrials.find((a) => a.id === id)).filter(Boolean) : [];
    const primaryCit = cits[0];
    const journalAndYear = primaryCit ? `${primaryCit.journal}${primaryCit.year ? ` ${primaryCit.year}` : ''}` : '';
    return (
      <details
        key={`${keyPrefix}-${trial.id}`}
        id={`atlas-${trial.id}`}
        open={atlasExpandAll}
        className="border border-line bg-white rounded-lg overflow-hidden hover:border-cobalt-300 transition-colors dark:bg-card mb-2"
      >
        <summary className="cursor-pointer p-4 hover:bg-slate-50 select-none dark:hover:bg-paper-2">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${atlasToneClass(evTypeMeta.tone)}`}>
                  {evTypeMeta.label}
                </span>
                {journalAndYear && (
                  <span className="font-semibold text-slate-600 dark:text-mute">
                    {journalAndYear}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-ink leading-snug mt-1.5 text-pretty">
                {trial.fullName}
              </h3>
            </div>
          </div>
        </summary>
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-sm text-slate-700 space-y-3 dark:text-ink-2">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {trial.shortName && (
              <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-2xs font-mono font-bold text-ink-2">
                Acronym: {trial.shortName}
              </span>
            )}
            {atlasPill(topicLabel(trial.topic) || trial.topic, 'slate')}
            {atlasPill(certaintyMeta.label, certaintyMeta.tone)}
            {atlasPill(verifMeta.label, verifMeta.tone)}
            {trial.lastReviewed && atlasPill(`Reviewed ${trial.lastReviewed}`, 'slate')}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Population</div>
            <p>n={trial.population.n || '—'} · {trial.population.ageRange || 'age n/a'} · NIHSS {trial.population.nihssRange || 'n/a'} · {trial.population.timeWindow || 'window n/a'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Intervention</div>
              <p>{trial.intervention || '—'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Comparator</div>
              <p>{trial.comparator || '—'}</p>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Primary endpoint</div>
            <p>{trial.primaryEndpoint?.definition || '—'} @ {trial.primaryEndpoint?.timepoint || '—'}</p>
            <p className="text-slate-900 dark:text-ink">{trial.primaryEndpoint?.result || '—'}{trial.primaryEndpoint?.effectSize ? ` (${trial.primaryEndpoint.effectSize}${trial.primaryEndpoint.confidenceInterval ? `, ${trial.primaryEndpoint.confidenceInterval}` : ''}${trial.primaryEndpoint.pValue ? `, ${trial.primaryEndpoint.pValue}` : ''})` : ''}</p>
          </div>
          {(trial.safetyFindings?.sich || trial.safetyFindings?.mortality || trial.safetyFindings?.other) && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Safety</div>
              <p>sICH: {trial.safetyFindings.sich || 'n/a'} · Mortality: {trial.safetyFindings.mortality || 'n/a'}{trial.safetyFindings.other ? ` · ${trial.safetyFindings.other}` : ''}</p>
            </div>
          )}
          {trial.imagingCriteria && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Imaging selection</div>
              <p>{trial.imagingCriteria}</p>
            </div>
          )}
          {trial.applicabilityNotes && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Applicability</div>
              <p>{trial.applicabilityNotes}</p>
            </div>
          )}
          {trial.limitations && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Limitations</div>
              <p>{trial.limitations}</p>
            </div>
          )}
          {trial.practiceImpact && (
            <div className="bg-slate-50 border border-line rounded p-2 dark:bg-paper-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Practice impact</div>
              <p>{trial.practiceImpact}</p>
            </div>
          )}
          {cits.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-mute">Citations</div>
              <ul className="list-disc list-inside space-y-0.5">
                {cits.map((c) => {
                  const showTitle = c.title.toLowerCase().trim() !== trial.fullName.toLowerCase().trim();
                  return (
                    <li key={c.id} className="text-xs">
                      {showTitle && <span className="text-slate-700 dark:text-ink-2">{c.title} </span>}
                      <span className="text-slate-500 dark:text-mute">
                        {showTitle ? '— ' : ''}{c.authors ? `${c.authors} ` : ''}{c.journal}{c.year ? ` ${c.year}` : ''}
                      </span>
                      {citationLink(c) && (
                        <> · <a href={citationLink(c)} target="_blank" rel="noopener noreferrer" className="text-cobalt-700 underline hover:underline dark:text-cobalt-300">{c.pmid ? `PMID ${c.pmid}` : (c.doi ? `DOI ${c.doi}` : 'link')}</a></>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {relatedActive.length > 0 && (
            <div className="bg-cobalt-50 border border-cobalt-200 rounded p-2 dark:bg-cobalt-900 dark:border-cobalt-700">
              <div className="text-xs font-semibold text-cobalt-800 uppercase tracking-wide dark:text-cobalt-300">Related active trials</div>
              <p className="text-xs text-cobalt-900 dark:text-cobalt-300">{relatedActive.map((a) => a.shortName).join(' · ')}</p>
            </div>
          )}
        </div>
      </details>
    );
  };

  return (
    <div id="mgmt-tabpanel-references" className="space-y-6">
      {/* Evidence Filter */}
      <div className="bg-white border border-line rounded-lg p-4 dark:bg-card">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter evidence documents..."
            value={evidenceFilter}
            onChange={(e) => setEvidenceFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 dark:border-strong bg-white dark:bg-card text-ink"
            aria-label="Filter evidence documents"
          />
          <span className="absolute left-3 top-2.5 text-slate-600 dark:text-mute pointer-events-none">
            <i aria-hidden="true" data-lucide="search" className="w-5 h-5"></i>
          </span>
          {evidenceFilter && (
            <button
              type="button"
              onClick={() => setEvidenceFilter('')}
              className="absolute right-3 top-1 text-slate-600 hover:text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center dark:text-mute dark:hover:text-ink"
              aria-label="Clear filter"
            >
              <i aria-hidden="true" data-lucide="x" className="w-5 h-5"></i>
            </button>
          )}
        </div>
        {evidenceFilter && (
          <p className="text-sm text-slate-600 mt-2 dark:text-ink-2">
            Filtering by: <span className="font-semibold">{evidenceFilter}</span>
          </p>
        )}
      </div>

      {/* References TOC */}
      <div className="flex flex-wrap gap-1.5">
        {[
          ['ref-trials', 'Major Stroke Trials'],
          ['ref-evidence-recs', 'Guideline Recommendations'],
          ['ref-hints', 'HINTS Exam'],
          ['ref-cvt', 'CVT'],
          ['ref-prognosis', 'Prognosis'],
          ...(isTraineeMode ? [['ref-pearls', 'Clinical Pearls'], ['ref-pitfalls', 'Pitfalls']] : []),
          ['ref-imaging', 'Imaging F/U'],
          ['ref-mimics', 'Mimics DDx'],
          ['ref-chameleons', 'Chameleons'],
          ['ref-spinalcord', 'Spinal Cord'],
          ['ref-ctp', 'CTP Guide'],
          ['ref-orders', 'Admission Orders'],
          ['ref-guidelines', 'Guidelines'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => { const el = document.getElementById(id); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-cobalt-100 text-slate-700 hover:text-cobalt-700 rounded-full border border-line hover:border-cobalt-300 transition-colors min-h-[36px] dark:bg-paper-2 dark:hover:bg-cobalt-800 dark:text-ink-2 dark:hover:text-cobalt-300">{label}</button>
        ))}
      </div>

      {/* Major Stroke Trials */}
      <details id="ref-trials" className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700" open>
        <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
          <i aria-hidden="true" data-lucide="book-open" className="w-4 h-4 text-cobalt-600 dark:text-cobalt-300"></i>
          Major Stroke Trials
        </summary>
        <div className="p-4 space-y-4">
          <LandmarkTrialsCard />

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Search trials, citations, interventions…"
                value={atlasFilters.query}
                onChange={(e) => setAtlasFilters((f) => ({ ...f, query: e.target.value }))}
                className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cobalt-500 dark:border-strong bg-white dark:bg-card text-ink"
                aria-label="Search completed trials"
              />
              <select
                value={atlasFilters.topic}
                onChange={(e) => setAtlasFilters((f) => ({ ...f, topic: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cobalt-500 dark:border-strong bg-white dark:bg-card text-ink"
                aria-label="Filter by topic"
              >
                <option value="">All topics</option>
                {evidenceTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <select
                value={atlasFilters.certainty}
                onChange={(e) => setAtlasFilters((f) => ({ ...f, certainty: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cobalt-500 dark:border-strong bg-white dark:bg-card text-ink"
                aria-label="Filter by certainty"
              >
                <option value="">Any certainty</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
                <option value="very-low">Very low</option>
              </select>
              <select
                value={atlasFilters.evidenceType}
                onChange={(e) => setAtlasFilters((f) => ({ ...f, evidenceType: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cobalt-500 dark:border-strong bg-white dark:bg-card text-ink"
                aria-label="Filter by evidence type"
              >
                <option value="">Any evidence type</option>
                <option value="rct">RCT</option>
                <option value="meta-analysis">Meta-analysis</option>
                <option value="observational">Observational</option>
                <option value="guideline">Guideline</option>
                <option value="consensus">Consensus</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAtlasFilters({ topic: '', certainty: '', evidenceType: '', verificationStatus: '', query: '' })}
                className="text-xs text-slate-600 hover:text-slate-900 underline dark:text-ink-2 dark:hover:text-ink"
              >Clear filters</button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAtlasExpandAll(true)}
                  className="px-3 py-1.5 rounded-lg border border-cobalt-200 bg-cobalt-50 text-cobalt-700 text-xs font-semibold hover:bg-cobalt-100 dark:border-cobalt-700 dark:bg-cobalt-900 dark:text-cobalt-300 dark:hover:bg-cobalt-800"
                >Expand all</button>
                <button
                  type="button"
                  onClick={() => setAtlasExpandAll(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 dark:border-strong dark:bg-card dark:text-ink-2 dark:hover:bg-paper-2"
                >Collapse all</button>
              </div>
            </div>

            {(() => {
              const filtered = filterCompletedTrials(atlasFilters);
              if (filtered.length === 0) {
                return (
                  <p className="text-sm text-slate-600 italic px-4 py-3 border border-dashed border-slate-300 rounded-lg dark:text-ink-2 dark:border-strong">
                    No trials match these filters. <button type="button" onClick={() => setAtlasFilters({ topic: '', certainty: '', evidenceType: '', verificationStatus: '', query: '' })} className="text-cobalt-700 underline dark:text-cobalt-300">Clear filters</button>.
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-mute">{filtered.length} of {evidenceCompletedTrials.length} trials</p>
                  {filtered.map((tr) => renderAtlasCard(tr))}
                </div>
              );
            })()}
          </div>
        </div>
      </details>

      {/* Guideline Recommendations */}
      <details id="ref-evidence-recs" className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
        <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
          <i aria-hidden="true" data-lucide="badge-check" className="w-4 h-4 text-cobalt-600 dark:text-cobalt-300"></i>
          Guideline Recommendations ({evidenceRecommendations.length})
          <span className="ml-auto text-[11px] font-normal text-slate-600 italic dark:text-mute">Why this recommendation? — claim chain to primary sources</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {evidenceRecommendations.map((r) => {
            const claimsExpanded = resolveClaimsWithCitations(r.supportingClaimIds || []);
            const corTone = r.classOfRecommendation === 'I' ? 'emerald' : r.classOfRecommendation === 'IIa' ? 'sky' : r.classOfRecommendation === 'IIb' ? 'amber' : 'rose';
            return (
              <details key={r.id} id={`rec-${r.id}`} className="border border-line rounded bg-white dark:bg-card">
                <summary className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50 flex items-start gap-2 dark:hover:bg-paper-2">
                  <span className="flex-shrink-0 mt-0.5 flex flex-wrap gap-1">
                    {atlasPill(`Class ${r.classOfRecommendation}`, corTone)}
                    {atlasPill(`LOE ${r.levelOfEvidence}`, 'slate')}
                  </span>
                  <span className="text-slate-800 flex-1 dark:text-ink">{r.text}</span>
                </summary>
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 text-sm space-y-2">
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {atlasPill(topicLabel(r.topic) || r.topic, 'slate')}
                    {atlasPill(`Setting: ${r.setting}`, 'slate')}
                    {r.lastReviewed && atlasPill(`Reviewed ${r.lastReviewed}`, 'slate')}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide dark:text-mute">Source</div>
                    <p className="text-slate-700 dark:text-ink-2">{r.guidelineSource}</p>
                  </div>
                  {claimsExpanded.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide dark:text-mute">Why this recommendation?</div>
                      <ul className="space-y-1.5 mt-1">
                        {claimsExpanded.map((cl) => (
                          <li key={cl.id} className="bg-slate-50 border border-line rounded p-2 dark:bg-paper-2">
                            <p className="text-xs text-slate-800 italic dark:text-ink">{cl.statement}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 dark:text-mute">Certainty: <span className="font-semibold">{cl.certainty}</span>{cl.conflictNotes ? ` · Conflict: ${cl.conflictNotes}` : ''}</p>
                            {cl.citationRecords && cl.citationRecords.length > 0 && (
                              <ul className="mt-1 list-disc list-inside text-[11px] text-slate-700 dark:text-ink-2">
                                {cl.citationRecords.map((c) => (
                                  <li key={c.id}>
                                    {c.title} ({c.journal}{c.year ? ` ${c.year}` : ''})
                                    {citationLink(c) && (
                                      <> · <a href={citationLink(c)} target="_blank" rel="noopener noreferrer" className="text-cobalt-700 underline hover:underline dark:text-cobalt-300">{c.pmid ? `PMID ${c.pmid}` : (c.doi ? `DOI ${c.doi}` : 'link')}</a></>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.caveats && r.caveats.length > 0 && (
                    <div className="bg-warn-50 border border-warn-200 rounded p-2 dark:bg-warn-950 dark:border-warn-800">
                      <div className="text-xs font-semibold text-warn-900 uppercase tracking-wide dark:text-warn-300">Caveats</div>
                      <ul className="mt-1 list-disc list-inside text-xs text-warn-900 dark:text-warn-300">
                        {r.caveats.map((cv, i) => <li key={i}>{cv}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </details>

      {/* HINTS Exam Protocol */}
      <details id="ref-hints" className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
        <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
          <i aria-hidden="true" data-lucide="eye" className="w-4 h-4 text-cobalt-600 dark:text-cobalt-300"></i>
          HINTS Exam — Acute Vestibular Syndrome
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">For acute continuous vertigo with nystagmus, head-motion intolerance, nausea/vomiting, gait unsteadiness lasting &gt;24h. Sensitivity 96.8%, specificity 98.5% for central cause (Kattah et al., 2009).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h2 className="font-bold text-cobalt-900 text-sm mb-1 dark:text-cobalt-300">H — Head Impulse</h2>
              <p className="text-xs text-slate-700 dark:text-ink-2">Rapid passive head rotation → observe for corrective saccade.</p>
              <p className="text-xs text-cobalt-700 mt-1 font-medium dark:text-cobalt-300">Normal (no saccade) = DANGEROUS → suggests central lesion</p>
              <p className="text-xs text-ok-700 dark:text-ok-300">Abnormal (catch-up saccade) = peripheral (vestibular neuritis)</p>
            </div>
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h3 className="font-bold text-cobalt-900 text-sm mb-1 dark:text-cobalt-300">N — Nystagmus</h3>
              <p className="text-xs text-slate-700 dark:text-ink-2">Observe nystagmus direction in primary gaze and with gaze changes.</p>
              <p className="text-xs text-cobalt-700 mt-1 font-medium dark:text-cobalt-300">Direction-changing or vertical = DANGEROUS → central</p>
              <p className="text-xs text-ok-700 dark:text-ok-300">Unidirectional horizontal = peripheral</p>
            </div>
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h3 className="font-bold text-cobalt-900 text-sm mb-1 dark:text-cobalt-300">TS — Test of Skew</h3>
              <p className="text-xs text-slate-700 dark:text-ink-2">Alternating cover test — observe for vertical eye correction.</p>
              <p className="text-xs text-cobalt-700 mt-1 font-medium dark:text-cobalt-300">Skew deviation present = DANGEROUS → central</p>
              <p className="text-xs text-ok-700 dark:text-ok-300">No skew = peripheral</p>
            </div>
          </div>
          <div className="bg-crit-50 border border-crit-200 rounded-lg p-2 dark:bg-crit-950 dark:border-crit-800">
            <p className="text-xs font-semibold text-crit-800 dark:text-crit-300">Any ONE dangerous sign → treat as central (stroke) until proven otherwise. Obtain urgent MRI DWI.</p>
          </div>
          <p className="text-xs text-slate-600 dark:text-mute">Kattah JC et al. Stroke. 2009;40:3504-3510. Newman-Toker DE et al. Stroke. 2008;39:3070-3074.</p>
        </div>
      </details>

      {/* CVT Monitoring Parameters */}
      <details id="ref-cvt" className="bg-white border border-teal-200 rounded-lg dark:bg-card dark:border-teal-800">
        <summary className="cursor-pointer p-4 font-semibold text-teal-800 hover:bg-teal-50 rounded-lg flex items-center gap-2 dark:text-teal-300">
          CVT Monitoring Parameters
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2 dark:bg-teal-950 dark:border-teal-800">
              <h4 className="font-bold text-teal-900 text-sm dark:text-teal-300">Imaging Follow-Up</h4>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>• MRI/MRV at 3-6 months to assess recanalization</li>
                <li>• Repeat if clinical worsening or new symptoms</li>
                <li>• CTV acceptable if MRI contraindicated</li>
                <li>• Consider D-dimer trending if elevated at diagnosis</li>
              </ul>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2 dark:bg-teal-950 dark:border-teal-800">
              <h4 className="font-bold text-teal-900 text-sm dark:text-teal-300">ICP Monitoring</h4>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>• Fundoscopy at baseline and follow-up</li>
                <li>• Visual acuity + visual fields baseline</li>
                <li>• LP opening pressure if pseudotumor cerebri suspected (&gt;25 cmH₂O)</li>
                <li>• Acetazolamide 250-500 mg BID for persistent elevated ICP</li>
              </ul>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2 dark:bg-teal-950 dark:border-teal-800">
              <h4 className="font-bold text-teal-900 text-sm dark:text-teal-300">Thrombophilia Workup</h4>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>• Factor V Leiden, Prothrombin G20210A</li>
                <li>• Protein C, Protein S, Antithrombin III</li>
                <li>• Antiphospholipid antibodies (lupus anticoagulant, anticardiolipin, anti-β2GP1)</li>
                <li>• JAK2 V617F if polycythemia suspected</li>
                <li>• Defer testing during acute anticoagulation (false positives)</li>
              </ul>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2 dark:bg-teal-950 dark:border-teal-800">
              <h4 className="font-bold text-teal-900 text-sm dark:text-teal-300">Seizure Management</h4>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>• No routine prophylaxis recommended (AHA/ASA)</li>
                <li>• Treat acute seizures with levetiracetam 500-1000 mg IV</li>
                <li>• Duration: 3-6 months if acute symptomatic seizure</li>
                <li>• EEG if altered consciousness or status epilepticus suspected</li>
              </ul>
            </div>
          </div>
        </div>
      </details>

      {/* Neuroprognostication Framework */}
      <details id="ref-prognosis" className="bg-white border border-rose-200 rounded-lg dark:bg-card dark:border-rose-800">
        <summary className="cursor-pointer p-4 font-semibold text-rose-800 hover:bg-rose-50 rounded-lg flex items-center gap-2 dark:text-rose-300">
          Neuroprognostication &amp; Goals of Care
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-crit-50 border border-crit-200 rounded-lg p-2 dark:bg-crit-950 dark:border-crit-800">
            <p className="text-xs font-bold text-crit-800 dark:text-crit-300">AHA/ASA 2022: New DNR orders should be postponed until at least the second full day of inpatient stay (Class IIa, LOE C-LD). Early care limitations are a strong independent predictor of mortality — the "self-fulfilling prophecy."</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 dark:bg-rose-950 dark:border-rose-800">
              <h4 className="font-bold text-rose-900 text-sm mb-2 dark:text-rose-300">ICH Prognostication</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>ICH Score:</strong> Validated for 30-day mortality (see Calculators tab). NOT validated for long-term functional outcomes.</li>
                <li><strong>FUNC Score:</strong> Predicts 90-day functional independence — use for positive framing with families.</li>
                <li><strong>Volume trajectory matters:</strong> Repeat CT at 6h. Stable or shrinking volume = better prognosis.</li>
                <li><strong>Location matters:</strong> Lobar and deep small (&lt;30 mL) have best outcomes. Brainstem and large deep (&gt;60 mL) have worst.</li>
                <li className="text-warn-700 dark:text-warn-300"><strong>Caution:</strong> ICH Score was derived from populations with high rates of early DNR — it overestimates mortality when aggressive care is provided.</li>
              </ul>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 dark:bg-rose-950 dark:border-rose-800">
              <h4 className="font-bold text-rose-900 text-sm mb-2 dark:text-rose-300">Severe AIS Prognostication</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Early NIHSS does NOT predict long-term outcome</strong> after successful reperfusion. Dramatic early improvement is common.</li>
                <li><strong>ASPECTS ≥6 with successful recanalization:</strong> ~50% achieve functional independence (mRS 0-2) even with initial NIHSS &gt;20.</li>
                <li><strong>Malignant MCA infarction:</strong> Hemicraniectomy within 48h (age &lt;60) — NNT 2 for survival, NNT 4 for mRS 0-3 (DECIMAL/DESTINY/HAMLET).</li>
                <li><strong>Basilar artery occlusion:</strong> Outcomes improving with EVT (ATTENTION/BAOCHE) — do not assume futility.</li>
                <li className="text-ok-700 dark:text-ok-300"><strong>Framework:</strong> "We are early. The brain needs time. Let us give aggressive medical care for 72 hours, then reassess together."</li>
              </ul>
            </div>
          </div>
          <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
            <h4 className="font-bold text-cobalt-800 text-sm mb-2 dark:text-cobalt-300">Talking to Families</h4>
            <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
              <li>• Use "best case / realistic case / worst case" framework rather than single prediction</li>
              <li>• Avoid "devastating" or "catastrophic" — use measurable descriptors (size, location, function)</li>
              <li>• Ask: "What would [patient name] consider an acceptable quality of life?"</li>
              <li>• Discuss what we WILL do (aggressive medical care, monitoring, rehab), not just what went wrong</li>
              <li>• Revisit at planned intervals (24h, 72h, 1 week) — avoid repeated ad hoc updates that increase family anxiety</li>
              <li>• Document the conversation: who was present, what was discussed, family's questions, plan</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Clinical Pearls for Trainees */}
      {isTraineeMode && (
      <details id="ref-pearls" className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
        <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
          Clinical Pearls for Trainees
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">Acute Assessment Pearls</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Time is brain:</strong> ~1.9 million neurons lost per minute in untreated LVO. Every minute of delay = 1 day less of disability-free life.</li>
                <li><strong>NIHSS 0 does not mean no stroke:</strong> Posterior circulation strokes (vertigo, diplopia, ataxia, dysarthria) can score 0. Always consider the clinical picture.</li>
                <li><strong>Always check glucose before TNK:</strong> Hypoglycemia is a treatable mimic. BG &lt;60 should be corrected first.</li>
                <li><strong>Blood pressure:</strong> Do NOT lower BP aggressively in AIS unless giving lytics. Permissive hypertension (SBP &lt;220) is appropriate.</li>
                <li><strong>CT negative ≠ no stroke:</strong> CT sensitivity for ischemic stroke in first 6h is only ~25%. A normal CT DOES NOT rule out AIS.</li>
                <li><strong>ASPECTS:</strong> Count the regions INVOLVED (not spared). Subtract from 10. ASPECTS 10 = normal CT.</li>
              </ul>
            </div>
            <div className="bg-ok-50 border border-ok-200 rounded-lg p-3 dark:bg-ok-950 dark:border-ok-800">
              <h4 className="font-bold text-ok-900 text-sm mb-2 dark:text-ok-300">Treatment Pearls</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>TNK vs alteplase:</strong> TNK 0.25 mg/kg (max 25 mg) single bolus is now preferred for AIS. No infusion needed. Easier logistics.</li>
                <li><strong>Don't delay TNK for perfusion imaging:</strong> If within 4.5h and no contraindications, give TNK. Perfusion imaging is for extending the window, not for gatekeeping.</li>
                <li><strong>DAPT timing:</strong> For minor stroke (NIHSS ≤3), start DAPT within 24h. Loading doses: ASA 325 + clopidogrel 300. Continue x 21 days (CHANCE/POINT).</li>
                <li><strong>Statin timing:</strong> Start high-intensity statin (atorvastatin 80 mg) in facility. Don't wait for fasting lipids.</li>
                <li><strong>AF detection:</strong> If stroke is cryptogenic after routine workup, extended cardiac monitoring (≥14 days) finds AF in ~12-16% of patients.</li>
                <li><strong>Anticoagulation after stroke + AF:</strong> ELAN trial: early DOAC (&lt;48h for minor, day 3-4 for moderate, day 6-7 for severe) is non-inferior and safe.</li>
              </ul>
            </div>
            <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
              <h4 className="font-bold text-warn-900 text-sm mb-2 dark:text-warn-300">ICH Pearls</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>BP control matters most in first 2h:</strong> Target SBP &lt;140 mmHg within 2h (INTERACT2, Class IIa). Avoid SBP &lt;130 (ATACH-2 showed no benefit of intensive SBP 110-139 vs 140-179, with trend toward renal harm). Nicardipine drip preferred for smooth control.</li>
                <li><strong>Anticoagulant reversal:</strong> This is the MOST time-sensitive intervention in ICH. Give PCC/idarucizumab BEFORE the CT in known anticoagulated patients.</li>
                <li><strong>Spot sign on CTA:</strong> Contrast extravasation predicts hematoma expansion. If present → more aggressive BP control and close monitoring.</li>
                <li><strong>IVH worsens prognosis:</strong> Consider EVD if hydrocephalus develops. Intraventricular alteplase (CLEAR III) reduces mortality but doesn't improve functional outcome.</li>
                <li><strong>When to restart anticoagulation:</strong> For AF + ICH, generally restart DOAC at 4-8 weeks (individualized). Lobar ICH = higher rebleed risk than deep.</li>
              </ul>
            </div>
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">Disposition Pearls</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Stroke unit care matters:</strong> Admission to a dedicated stroke unit reduces mortality and disability regardless of stroke type (NNT 18 for death or dependency). Cochrane 2020.</li>
                <li><strong>Early mobilization:</strong> Avoid bedrest beyond 24h unless post-TNK. AVERT trial: very early (&lt;24h) aggressive mobilization may be harmful; gradual is better.</li>
                <li><strong>Swallow screen before anything PO:</strong> Aspiration pneumonia is the #1 preventable complication. Formal SLP eval if bedside screen abnormal.</li>
                <li><strong>DVT prophylaxis:</strong> SCDs on admission for all. SQ heparin after 24h post-TNK (or 48h post-ICH). IPC + anticoagulation is better than IPC alone.</li>
                <li><strong>Fever is bad:</strong> Target normothermia. Every 1°C rise in temperature in the first 72h worsens outcomes. Workup infection aggressively.</li>
              </ul>
            </div>
          </div>
        </div>
      </details>
      )}

      {/* Trainee Pitfalls — Common Mistakes */}
      {isTraineeMode && (
      <details id="ref-pitfalls" className="bg-white border border-crit-200 rounded-lg dark:bg-card dark:border-crit-800">
        <summary className="cursor-pointer p-4 font-semibold text-crit-800 hover:bg-crit-50 rounded-lg flex items-center gap-2 dark:text-crit-300">
          <i aria-hidden="true" data-lucide="triangle-alert" className="w-4 h-4 text-crit-600 dark:text-crit-300"></i>
          Common Trainee Pitfalls
        </summary>
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-slate-600 mb-2 dark:text-ink-2">Scenario-based Q&amp;A for common mistakes during stroke consultations.</p>
          {[
            {
              q: 'Patient got TNK and now has trace blood on urine dip. Should I reverse?',
              a: 'No. Microscopic hematuria is not an indication to reverse thrombolysis. Only gross hematuria, active bleeding requiring transfusion, or symptomatic intracranial hemorrhage warrants reversal. Continue monitoring.',
              ref: 'AHA/ASA 2019 Acute Ischemic Stroke Guidelines'
            },
            {
              q: 'Patient has ICH Score of 4. Family wants to know prognosis. Should we recommend comfort care?',
              a: 'No. The ICH Score predicts 30-day MORTALITY, not functional outcome, and was derived from cohorts with high rates of early DNR/withdrawal. AHA recommends postponing DNR at least 24h (Class IIa). Use FUNC Score for functional prognosis and provide aggressive care for at least 72 hours before prognosticating.',
              ref: 'AHA/ASA ICH 2022; Hemphill 2001; Rost 2008'
            },
            {
              q: 'Patient has cerebral venous thrombosis with hemorrhagic venous infarction. Should I hold anticoagulation?',
              a: 'No. Anticoagulate even with hemorrhage. CVT-associated hemorrhage is caused by venous congestion, and anticoagulation treats the underlying cause. AHA/ASA recommends initial anticoagulation with heparin even in presence of ICH (Class IIa, LOE B).',
              ref: 'AHA/ASA CVT 2024; ESO 2017'
            },
            {
              q: 'Patient has NIHSS 3 but CTA shows M1 occlusion. Do they need EVT?',
              a: 'Likely yes. Low NIHSS does not exclude LVO benefit. MR CLEAN-LATE and ESCAPE showed benefit even with lower NIHSS in LVO. Early neurological deterioration occurs in up to 30% of untreated LVO patients with initially low NIHSS. Discuss with neurointerventionalist.',
              ref: 'AHA/ASA 2026; MR CLEAN-LATE 2023'
            },
            {
              q: 'Patient had a seizure at stroke onset. Is TNK contraindicated?',
              a: 'No. Seizure at onset is no longer an absolute contraindication if residual deficits are clearly attributable to stroke (not postictal). If doubt exists, CT/CTA can help. The key concern is misdiagnosing Todd paralysis as stroke — do a thorough exam.',
              ref: 'AHA/ASA 2019; ACT-FAST 2022'
            },
            {
              q: 'Should I start prophylactic anti-seizure medication in this ICH patient?',
              a: 'No. Routine prophylactic AEDs are NOT recommended for ICH (Class III: No Benefit). Only treat clinical or electrographic seizures. If the patient has altered mental status disproportionate to the lesion, order continuous EEG — non-convulsive seizures occur in up to 28% of ICH patients.',
              ref: 'AHA/ASA ICH 2022'
            },
            {
              q: 'Patient is on clopidogrel and taking omeprazole. Is this a concern?',
              a: 'Yes. Omeprazole and esomeprazole are strong CYP2C19 inhibitors that significantly reduce clopidogrel active metabolite. Switch to pantoprazole (weak CYP2C19 inhibitor) or consider H2 blocker. This interaction does NOT apply to DOACs or aspirin.',
              ref: 'FDA Safety Communication 2009; COGENT trial 2010'
            },
            {
              q: 'Patient had TNK 3 hours ago, now new hemianopia. HT or new ischemia?',
              a: 'Get STAT CT head. HT typically presents with headache, nausea, BP elevation, and decreased consciousness. New focal deficit without consciousness change suggests re-occlusion or new territory ischemia. If CT shows no hemorrhage, consider repeat CTA to assess vessel patency — may need rescue EVT.',
              ref: 'Clinical reasoning; AHA/ASA 2019'
            },
            {
              q: 'Should I use phenytoin for post-stroke seizures?',
              a: 'Avoid if possible. Phenytoin has drug interactions with DOACs/statins, causes hypotension, and has worse cognitive outcomes. First-line: Levetiracetam 1000-1500 mg IV load, then 500-1000 mg BID. Alternative: Lacosamide 200 mg IV load.',
              ref: 'AHA/ASA 2022; Clinical consensus'
            },
            {
              q: 'Patient is 62 with malignant MCA infarction. Is hemicraniectomy indicated?',
              a: 'Discuss with the patient/family and neurosurgery. DESTINY II showed survival benefit in age >60 BUT higher rate of severe disability (mRS 4-5). NNT 2 for survival, but most survivors have moderate-severe disability. This requires a goals-of-care conversation — some patients/families value survival, others prioritize independence.',
              ref: 'DESTINY II (Juttler 2014); DECIMAL/DESTINY/HAMLET pooled analysis'
            }
          ].map((item, idx) => (
            <details key={idx} className="bg-crit-50 border border-crit-100 rounded-lg dark:bg-crit-950 mb-2">
              <summary className="cursor-pointer p-2 text-sm font-medium text-crit-900 hover:bg-crit-100 rounded-lg dark:text-crit-300 dark:hover:bg-crit-900">{item.q}</summary>
              <div className="px-3 pb-2">
                <p className="text-xs text-slate-700 mt-1 dark:text-ink-2">{item.a}</p>
                <p className="text-xs text-slate-500 mt-1 italic dark:text-mute">Ref: {item.ref}</p>
              </div>
            </details>
          ))}
        </div>
      </details>
      )}

      {/* Imaging Follow-Up Protocols */}
      <details id="ref-imaging" className="bg-white border border-cyan-200 rounded-lg dark:bg-card">
        <summary className="cursor-pointer p-4 font-semibold text-cyan-800 hover:bg-cyan-50 rounded-lg flex items-center gap-2 dark:text-cyan-300">
          <i aria-hidden="true" data-lucide="scan" className="w-4 h-4 text-cyan-600 dark:text-cyan-300"></i>
          Imaging Follow-Up Protocols by Diagnosis
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">Ensures no imaging gets missed during admission or at discharge. Protocol-driven imaging reduces diagnostic errors.</p>
          <div className="space-y-2">
            <details className="bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700" open>
              <summary className="cursor-pointer p-2 text-sm font-semibold text-cobalt-800 dark:text-cobalt-300">AIS (Post-TNK)</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>24h:</strong> NCHCT — screen for hemorrhagic transformation (required before starting antithrombotics)</p>
                <p><strong>24-48h:</strong> MRI DWI/FLAIR if not done — confirm infarct extent, detect silent infarcts</p>
                <p><strong>If neuro decline:</strong> STAT NCHCT +/- CTA (reocclusion vs HT vs edema)</p>
                <p><strong>Discharge:</strong> Ensure CTA/MRA head and neck completed. If not → outpatient within 1 week.</p>
                <p><strong>Outpatient (3-6 months):</strong> If carotid/vertebral stenosis → repeat CTA/MRA to assess progression</p>
              </div>
            </details>
            <details className="bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-cobalt-800 dark:text-cobalt-300">AIS (Post-EVT)</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>Immediately post-procedure:</strong> Flat-panel CT in angio suite (contrast extravasation vs staining)</p>
                <p><strong>24h:</strong> NCHCT +/- CTA — assess for HT, confirm reperfusion, evaluate stent/device patency</p>
                <p><strong>If neuro decline:</strong> STAT NCHCT + CTA (reocclusion, HT, edema, vasospasm)</p>
                <p><strong>48-72h:</strong> MRI DWI if available — final infarct volume for prognostication</p>
                <p><strong>If stent placed:</strong> CTA at 3-6 months for in-stent stenosis surveillance</p>
              </div>
            </details>
            <details className="bg-crit-50 border border-crit-200 rounded-lg dark:bg-crit-950 dark:border-crit-800">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-crit-800 dark:text-crit-300">ICH</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>6h:</strong> Repeat NCHCT — assess for hematoma expansion (≥33% or ≥6 mL = significant)</p>
                <p><strong>24h:</strong> Repeat NCHCT if stable; CTA if no etiology identified (AVM, aneurysm, tumor)</p>
                <p><strong>If neuro decline:</strong> STAT NCHCT (expansion, hydrocephalus, new hemorrhage)</p>
                <p><strong>If young/no HTN/lobar:</strong> MRI with GRE/SWI and contrast — evaluate for underlying lesion, amyloid angiopathy (microbleeds)</p>
                <p><strong>Before DVT prophylaxis:</strong> Confirm stable hematoma on repeat imaging</p>
                <p><strong>Outpatient (3 months):</strong> MRI brain if not done inpatient; consider conventional angiogram if high suspicion for vascular malformation</p>
              </div>
            </details>
            <details className="bg-warn-50 border border-warn-200 rounded-lg dark:bg-warn-950 dark:border-warn-800">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-warn-800 dark:text-warn-300">SAH</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>Day 0:</strong> CTA head/neck to identify aneurysm source. If CTA negative → conventional angiogram.</p>
                <p><strong>Day 3-14 (vasospasm window):</strong> Daily TCDs. CTA/CTP if TCD velocities &gt;200 cm/s or clinical decline.</p>
                <p><strong>If neuro decline:</strong> STAT NCHCT (rebleed, hydrocephalus, infarction) + CTA/CTP (vasospasm)</p>
                <p><strong>Post-coiling:</strong> Follow-up conventional angiogram or MRA at 6 months, 18 months, 3 years</p>
                <p><strong>Post-clipping:</strong> CTA at 6-12 months to confirm clip positioning and rule out residual aneurysm</p>
                <p><strong>Perimesencephalic SAH (CTA neg):</strong> Repeat conventional angiogram in 1-2 weeks if initial was negative</p>
              </div>
            </details>
            <details className="bg-pink-50 border border-pink-200 rounded-lg dark:bg-pink-950 dark:border-pink-800">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-pink-800 dark:text-pink-300">Cervical Artery Dissection</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>Acute:</strong> CTA neck (or MRI/MRA with fat-sat) to confirm dissection</p>
                <p><strong>3-6 months:</strong> Repeat CTA or MRA neck — assess healing, recanalization</p>
                <p><strong>If recanalized:</strong> May simplify antithrombotic regimen</p>
                <p><strong>If persistent stenosis/occlusion:</strong> Continue antithrombotics, repeat at 12 months</p>
                <p><strong>If FMD suspected:</strong> CTA from aortic arch to circle of Willis + renal arteries screening</p>
              </div>
            </details>
            <details className="bg-teal-50 border border-teal-200 rounded-lg dark:bg-teal-950 dark:border-teal-800">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-teal-800 dark:text-teal-300">CVT (Cerebral Venous Thrombosis)</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>Acute:</strong> MRI/MRV brain (or CTV if MRI contraindicated)</p>
                <p><strong>3-6 months:</strong> Repeat MRI/MRV — assess recanalization</p>
                <p><strong>If worsening:</strong> Repeat MRI/MRV urgently; consider conventional venography + endovascular intervention</p>
                <p><strong>If persistent headache:</strong> LP opening pressure to evaluate for pseudotumor cerebri</p>
                <p><strong>If recanalized:</strong> May consider stopping anticoagulation (if provoked; indefinite if unprovoked or thrombophilia)</p>
              </div>
            </details>
            <details className="bg-slate-50 border border-line rounded-lg dark:bg-paper-2">
              <summary className="cursor-pointer p-2 text-sm font-semibold text-slate-800 dark:text-ink">Cryptogenic Stroke Workup</summary>
              <div className="px-3 pb-2 text-xs space-y-1">
                <p><strong>Inpatient:</strong> MRI DWI, CTA/MRA head and neck, TTE with bubble study, continuous telemetry ≥24h</p>
                <p><strong>If TTE negative + high suspicion:</strong> TEE (PFO, LAA thrombus, aortic arch atheroma)</p>
                <p><strong>Extended monitoring:</strong> 14-30 day ambulatory cardiac monitor (ICM if recurrent or high-risk)</p>
                <p><strong>If age &lt;60:</strong> Consider vessel wall MRI (vasculitis, reversible vasoconstriction, dissection), hypercoagulability workup</p>
                <p><strong>If ESUS confirmed:</strong> Antiplatelet therapy (not anticoagulation) per NAVIGATE ESUS/RE-SPECT ESUS. Extended monitoring is key to finding AF.</p>
              </div>
            </details>
          </div>
        </div>
      </details>

      {/* Code Stroke Activation Criteria */}
      <details id="ref-code-stroke" className="bg-white border border-crit-200 rounded-lg dark:bg-card dark:border-crit-800">
        <summary className="cursor-pointer p-4 font-semibold text-crit-800 hover:bg-crit-50 rounded-lg flex items-center gap-2 dark:text-crit-300">
          <i aria-hidden="true" data-lucide="siren" className="w-4 h-4 text-crit-600 dark:text-crit-300"></i>
          Code Stroke Activation Criteria
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
            <h4 className="font-bold text-crit-900 text-sm mb-2 dark:text-crit-300">ACTIVATE Code Stroke When ALL Present</h4>
            <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
              <li><strong>1. Acute focal neurological deficit</strong> — facial droop, arm/leg weakness, speech difficulty, visual field cut, neglect, ataxia, diplopia, dysarthria</li>
              <li><strong>2. Last known well (LKW) within 24 hours</strong> — or unknown onset (wake-up strokes may be eligible for intervention)</li>
              <li><strong>3. Age typically ≥18</strong> — pediatric stroke protocols differ; involve pediatric neurology early</li>
              <li><strong>4. No immediately obvious alternative</strong> — check glucose before activation if possible (BG &lt;60 mg/dL can mimic stroke)</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
              <h4 className="font-bold text-warn-900 text-sm mb-2 dark:text-warn-300">LVO Alert Criteria (Upgrade)</h4>
              <p className="text-xs text-slate-600 mb-2 dark:text-ink-2">Upgrade to LVO alert for potential emergent thrombectomy when:</p>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>NIHSS ≥6 (or RACE ≥5, LAMS ≥4)</li>
                <li>Cortical signs: gaze deviation, neglect, aphasia, hemianopia</li>
                <li>Acute basilar symptoms: bilateral motor, LOC, locked-in presentation</li>
                <li>LKW within 24 hours (late-window EVT per DAWN/DEFUSE-3)</li>
              </ul>
            </div>
            <div className="bg-ok-50 border border-ok-200 rounded-lg p-3 dark:bg-ok-950 dark:border-ok-800">
              <h4 className="font-bold text-ok-900 text-sm mb-2 dark:text-ok-300">De-escalation Criteria</h4>
              <p className="text-xs text-slate-600 mb-2 dark:text-ink-2">Consider standing down code when:</p>
              <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
                <li>NIHSS 0 with complete symptom resolution AND LKW &gt;4.5h (TIA pathway)</li>
                <li>Hypoglycemia (BG &lt;60) with deficits resolving after glucose correction</li>
                <li>Confirmed active seizure with improving postictal deficit</li>
                <li>Known chronic/stable deficits confirmed identical to prior baseline</li>
                <li>Onset clearly &gt;24 hours with no mismatch imaging indication</li>
              </ul>
            </div>
          </div>
          <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
            <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">When NOT to Activate</h4>
            <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
              <li>Isolated dizziness without other posterior fossa signs (unless HINTS exam is central pattern)</li>
              <li>Isolated headache without focal deficits (unless thunderclap → SAH protocol)</li>
              <li>Chronic stable neurological deficits with no acute change</li>
              <li>Symptoms clearly explained by non-stroke diagnosis already established</li>
            </ul>
            <p className="text-xs text-crit-700 font-semibold mt-2 dark:text-crit-300">When in doubt, ACTIVATE. It is always safer to stand down a code stroke than to miss a treatable stroke.</p>
          </div>
          <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
            <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">Rapid LVO Screen: RACE Scale (Pre-CTA)</h4>
            <p className="text-xs text-slate-600 mb-2 dark:text-ink-2">Rapid Arterial oCclusion Evaluation — for use by EMS or spoke ED before CTA is available. Score ≥5 suggests LVO (sensitivity ~85%, specificity ~68%). (Perez de la Ossa N et al., Stroke 2014)</p>
            <div className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
              <p><strong>Facial palsy:</strong> 0 = absent, 1 = mild, 2 = moderate-severe</p>
              <p><strong>Arm motor:</strong> 0 = normal, 1 = mild weakness, 2 = moderate-severe/plegia</p>
              <p><strong>Leg motor:</strong> 0 = normal, 1 = mild weakness, 2 = moderate-severe/plegia</p>
              <p><strong>Head/gaze deviation:</strong> 0 = absent, 1 = present</p>
              <p><strong>Aphasia (L) or Agnosia (R):</strong> 0 = absent, 1 = mild, 2 = moderate-severe</p>
              <p className="font-semibold mt-1">Total: 0-9. Score ≥5 → activate LVO alert, prioritize CTA, notify neurointerventional team.</p>
            </div>
          </div>
        </div>
      </details>

      {/* Stroke Mimic DDx Tool */}
      <details id="ref-mimics" className="bg-white border border-orange-200 rounded-lg dark:bg-card dark:border-orange-800">
        <summary className="cursor-pointer p-4 font-semibold text-orange-800 hover:bg-orange-50 rounded-lg flex items-center gap-2 dark:text-orange-300">
          <i aria-hidden="true" data-lucide="shield-alert" className="w-4 h-4 text-orange-600 dark:text-orange-300"></i>
          Stroke Mimic Differential Diagnosis
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">Up to 25-30% of suspected strokes are mimics. Key features favoring mimic: age &lt;50, no vascular risk factors, seizure at onset, normal NIHSS, symptoms not conforming to vascular territory.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 dark:bg-orange-950 dark:border-orange-800">
              <h4 className="font-bold text-orange-900 text-sm mb-2 dark:text-orange-300">Common Mimics</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Seizure/Todd paralysis:</strong> Witnessed seizure activity, postictal state, gradual resolution. EEG if uncertain.</li>
                <li><strong>Migraine with aura:</strong> Positive symptoms (scintillations, spreading paresthesias), headache history, gradual march over 20-60 min.</li>
                <li><strong>Hypoglycemia:</strong> BG &lt;60 mg/dL, focal deficits resolve with glucose correction. Always check BG first.</li>
                <li><strong>Conversion disorder (FND):</strong> Inconsistent exam, give-way weakness, non-anatomic sensory loss. Often young patients. <strong>Hoover sign:</strong> Place hand under the "weak" heel; ask patient to lift the <em>good</em> leg against resistance — involuntary downward pressure on the paretic side = positive (functional weakness). Absent hip extension = true weakness.</li>
                <li><strong>Peripheral vertigo:</strong> HINTS exam peripheral pattern, no focal deficits. See HINTS section above.</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 dark:bg-orange-950 dark:border-orange-800">
              <h4 className="font-bold text-orange-900 text-sm mb-2 dark:text-orange-300">Less Common Mimics</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Hypertensive encephalopathy/PRES:</strong> Severely elevated BP, visual changes, seizures, posterior edema on MRI.</li>
                <li><strong>Bell palsy:</strong> Isolated facial weakness (upper AND lower face), no limb weakness, ear pain.</li>
                <li><strong>Hemiplegic migraine:</strong> Family history, prior episodes, fully reversible motor aura. Diagnosis of exclusion.</li>
                <li><strong>CNS infection:</strong> Fever, meningismus, CSF pleocytosis. Consider HSV encephalitis if temporal lobe symptoms.</li>
                <li><strong>Brain tumor:</strong> Subacute onset, progressive symptoms, seizures. CT/MRI diagnostic.</li>
                <li><strong>Toxic/metabolic:</strong> Hepatic encephalopathy, uremia, hypo/hypernatremia, drug intoxication (lithium, phenytoin).</li>
                <li><strong>Demyelinating disease:</strong> Young patient, optic neuritis, prior episodes, MRI white matter lesions.</li>
              </ul>
            </div>
          </div>
          <div className="bg-crit-50 border border-crit-200 rounded-lg p-2 dark:bg-crit-950 dark:border-crit-800">
            <p className="text-xs font-semibold text-crit-800 dark:text-crit-300">If in doubt, treat as stroke. TNK is relatively safe; missing a true stroke is far worse than treating a mimic. False-negative rate of CT is high in the first 6-12 hours.</p>
          </div>
          <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-2 dark:bg-cobalt-900 dark:border-cobalt-700">
            <p className="text-xs text-cobalt-800 dark:text-cobalt-300"><strong>FABS Score (mimic predictor):</strong> Facial palsy absent (+1), AF history absent (+1), BP at presentation SBP &lt;150 (+1), Seizure at onset (+1). Score ≥3 → consider mimic. (Ali SF et al., Stroke 2014)</p>
          </div>
        </div>
      </details>

      {/* Spinal Cord Stroke */}
      <details id="ref-spinalcord" className="bg-white border border-cobalt-200 rounded-lg dark:bg-card dark:border-cobalt-700">
        <summary className="cursor-pointer p-4 font-semibold text-cobalt-800 hover:bg-cobalt-50 rounded-lg flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-cobalt-900">
          Spinal Cord Stroke
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">Rare (~1% of all strokes) but devastating. Most commonly anterior spinal artery territory. Often missed initially. Key etiologies: aortic surgery/dissection, atherosclerosis, systemic hypotension, fibrocartilaginous embolism.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">Clinical Syndromes</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Anterior spinal artery (most common):</strong> Bilateral motor loss below the level, loss of pain/temperature (spinothalamic), bowel/bladder dysfunction. <em>Preserved</em> proprioception and vibration (posterior columns spared).</li>
                <li><strong>Posterior spinal artery (rare):</strong> Loss of proprioception, vibration, fine touch. Motor relatively preserved. Sensory ataxia.</li>
                <li><strong>Central cord syndrome:</strong> Cape-like dissociated sensory loss, upper &gt; lower extremity weakness.</li>
                <li><strong>Brown-Séquard (unilateral):</strong> Ipsilateral motor + proprioception loss, contralateral pain/temperature loss. Uncommon in ischemia; consider sulcal artery occlusion.</li>
              </ul>
            </div>
            <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3 dark:bg-cobalt-900 dark:border-cobalt-700">
              <h4 className="font-bold text-cobalt-900 text-sm mb-2 dark:text-cobalt-300">Workup &amp; Management</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>MRI spine with DWI:</strong> Gold standard. DWI detects ischemia within hours. Sagittal &quot;pencil-like&quot; or axial &quot;owl-eye&quot; pattern.</li>
                <li><strong>CT aortography:</strong> Essential to exclude aortic dissection or post-surgical complications.</li>
                <li><strong>BP augmentation:</strong> MAP target ≥85-90 mmHg. Avoid hypotension.</li>
                <li><strong>CSF drainage:</strong> Post-aortic surgery: target CSF pressure &lt;10-15 cmH2O. Place lumbar drain early if deteriorating.</li>
                <li><strong>Antithrombotics:</strong> Antiplatelet therapy (extrapolated from cerebral ischemic stroke). Anticoagulation if embolic source.</li>
                <li><strong>Exclude mimics:</strong> Transverse myelitis, epidural abscess/hematoma, GBS, MS, compressive myelopathy.</li>
              </ul>
            </div>
          </div>
          <div className="bg-warn-50 border border-warn-200 rounded-lg p-2 dark:bg-warn-950 dark:border-warn-800">
            <p className="text-xs text-warn-800 dark:text-warn-300"><strong>Red flags:</strong> Acute bilateral leg weakness with dissociated sensory loss + recent aortic procedure or known aortic disease. Fibrocartilaginous embolism: young patient, onset during Valsalva/exertion, disc disease on MRI.</p>
          </div>
        </div>
      </details>

      {/* CTP Interpretation Guide */}
      <details id="ref-ctp" className="bg-white border border-cyan-200 rounded-lg dark:bg-card">
        <summary className="cursor-pointer p-4 font-semibold text-cyan-800 hover:bg-cyan-50 rounded-lg flex items-center gap-2 dark:text-cyan-300">
          <i aria-hidden="true" data-lucide="scan" className="w-4 h-4 text-cyan-600 dark:text-cyan-300"></i>
          CT Perfusion (CTP) Interpretation Guide
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">CTP maps tissue perfusion to identify ischemic core and salvageable penumbra. Key to EVT decisions in extended windows (6-24h). Most centers use RAPID automated software.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 dark:bg-cyan-950">
              <h4 className="font-bold text-cyan-900 text-sm mb-2 dark:text-cyan-300">Perfusion Maps</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>CBV (Cerebral Blood Volume):</strong> Reduced in irreversibly infarcted tissue. Low CBV = dead tissue.</li>
                <li><strong>CBF (Cerebral Blood Flow):</strong> Reduced in hypoperfused tissue. rCBF &lt;30% defines ischemic core in RAPID.</li>
                <li><strong>MTT (Mean Transit Time):</strong> Prolonged in ischemic tissue. MTT = CBV/CBF. High sensitivity but low specificity.</li>
                <li><strong>Tmax (Time to Maximum):</strong> Delay in contrast arrival. <strong>Tmax &gt;6s</strong> defines critically hypoperfused tissue (penumbra + core). Primary RAPID output.</li>
              </ul>
            </div>
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 dark:bg-cyan-950">
              <h4 className="font-bold text-cyan-900 text-sm mb-2 dark:text-cyan-300">Trial Criteria</h4>
              <div className="bg-white border rounded p-2 mb-2 dark:bg-card">
                <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">DEFUSE-3 (6-16h):</p>
                <ul className="text-xs text-slate-700 space-y-0.5 ml-2 dark:text-ink-2">
                  <li>Core (rCBF &lt;30%): &lt;70 mL</li>
                  <li>Tmax &gt;6s volume: 15-180 mL</li>
                  <li>Mismatch ratio: ≥1.8</li>
                  <li>Mismatch volume: ≥15 mL</li>
                </ul>
              </div>
              <div className="bg-white border rounded p-2 dark:bg-card">
                <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">DAWN (6-24h):</p>
                <ul className="text-xs text-slate-700 space-y-0.5 ml-2 dark:text-ink-2">
                  <li>Group A: ≥80 yr, NIHSS ≥10, core &lt;21 mL</li>
                  <li>Group B: &lt;80 yr, NIHSS ≥10, core &lt;31 mL</li>
                  <li>Group C: &lt;80 yr, NIHSS ≥20, core 31-51 mL</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-warn-50 border border-warn-200 rounded-lg p-3 dark:bg-warn-950 dark:border-warn-800">
            <h4 className="font-bold text-warn-800 text-xs mb-1 dark:text-warn-300">CTP Pitfalls</h4>
            <ul className="text-xs text-slate-700 space-y-1 dark:text-ink-2">
              <li><strong>Crossed cerebellar diaschisis:</strong> Contralateral cerebellar hypoperfusion from supratentorial stroke — not true cerebellar ischemia.</li>
              <li><strong>Chronic carotid stenosis:</strong> Ipsilateral Tmax delay without acute stroke. Correlate with DWI and clinical timing.</li>
              <li><strong>Low cardiac output:</strong> Global bilateral delay. All Tmax values elevated — not a focal lesion.</li>
              <li><strong>Posterior fossa:</strong> Limited scanner coverage may miss posterior circulation on some 64-slice scanners.</li>
              <li><strong>Core overestimation (&lt;90 min):</strong> RAPID may overestimate core in hyperacute phase. If clinical-imaging mismatch, proceed with treatment.</li>
              <li><strong>Motion artifact:</strong> Patient movement degrades maps. Repeat if maps are clearly artifactual.</li>
            </ul>
          </div>
          <details className="bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700">
            <summary className="cursor-pointer p-2 text-xs font-semibold text-cobalt-800 hover:bg-cobalt-100 rounded-lg dark:text-cobalt-300 dark:hover:bg-cobalt-800">Collateral Assessment Scoring</summary>
            <div className="p-2 text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
              <p>Good collaterals independently predict better EVT outcomes and can support candidacy when CTP is unavailable or equivocal.</p>
              <p><strong>ASITN/SIR Collateral Flow Grading (0-4):</strong> 0 = no collaterals; 1 = slow collaterals to &lt;50% of MCA; 2 = slow to 100% of MCA; 3 = rapid to &lt;100% of MCA; 4 = complete and rapid. Grade 3-4 = good collaterals.</p>
              <p><strong>Tan Score (Multiphase CTA, 0-3):</strong> Used in ESCAPE trial. 0 = no filling in any phase; 1 = filling in some phases; 2 = delayed filling in late phases; 3 = normal pial arterial filling. Score 2-3 = good collaterals.</p>
              <p><strong>Single-phase CTA:</strong> Compare pial vessel opacification in affected vs unaffected hemisphere. &gt;50% filling on CTA = favorable collaterals.</p>
            </div>
          </details>
        </div>
      </details>

      {/* Stroke Chameleons — True Strokes Mimicking Non-Stroke Diagnoses */}
      <details id="ref-chameleons" className="bg-white border border-crit-200 rounded-lg dark:bg-card dark:border-crit-800">
        <summary className="cursor-pointer p-4 font-semibold text-crit-800 hover:bg-crit-50 rounded-lg flex items-center gap-2 dark:text-crit-300">
          <i aria-hidden="true" data-lucide="eye-off" className="w-4 h-4 text-crit-600 dark:text-crit-300"></i>
          Stroke Chameleons — Missed Stroke Presentations
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-ink-2">Stroke chameleons are true strokes that present as non-stroke diagnoses and are therefore missed. More dangerous than mimics because they represent missed treatment opportunities. (Richoz B et al., Eur Stroke J 2020)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
              <h4 className="font-bold text-crit-900 text-sm mb-2 dark:text-crit-300">Common Chameleons</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Isolated vertigo/dizziness:</strong> PICA/AICA/vertebral artery stroke. Use HINTS exam — dangerous pattern (normal HIT, direction-changing nystagmus, skew deviation) has higher sensitivity than MRI in first 48h.</li>
                <li><strong>Acute confusional state:</strong> Right PCA territory, thalamic, or top-of-basilar infarcts can present as delirium without obvious motor deficits. Check visual fields.</li>
                <li><strong>Isolated headache:</strong> Vertebral/carotid dissection, CVT, or sentinel SAH. Always consider if headache is thunderclap, positional, or associated with neck pain.</li>
                <li><strong>Acute psychiatric symptoms:</strong> Right non-dominant hemisphere strokes can present with acute agitation, mania, or psychosis without hemiparesis.</li>
                <li><strong>Isolated nausea/vomiting:</strong> Lateral medullary (Wallenberg) syndrome. Check for Horner syndrome, crossed sensory findings, gait ataxia.</li>
              </ul>
            </div>
            <div className="bg-crit-50 border border-crit-200 rounded-lg p-3 dark:bg-crit-950 dark:border-crit-800">
              <h4 className="font-bold text-crit-900 text-sm mb-2 dark:text-crit-300">Less Common Chameleons</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 dark:text-ink-2">
                <li><strong>Movement disorder onset:</strong> Hemichorea-hemiballismus from contralateral basal ganglia (subthalamic nucleus) infarction. Can present subacutely.</li>
                <li><strong>Bilateral weakness mimicking GBS:</strong> Bilateral pontine infarct can cause bilateral motor deficits. Check for facial weakness, eye movement abnormalities.</li>
                <li><strong>Alien hand syndrome:</strong> ACA territory or corpus callosum infarction. Involuntary purposeful hand movements.</li>
                <li><strong>Monocular vision loss:</strong> Retinal artery occlusion IS a stroke (AHA/ASA 2021). Same workup as cerebral ischemia; CRAO has ~25% risk of subsequent cerebral event.</li>
              </ul>
            </div>
          </div>
          <div className="bg-warn-50 border border-warn-200 rounded-lg p-2 dark:bg-warn-950 dark:border-warn-800">
            <p className="text-xs text-warn-800 dark:text-warn-300"><strong>Key principle:</strong> If vascular risk factors are present and the differential includes stroke, obtain urgent vascular imaging (CTA head/neck) and DWI MRI. NIHSS of 0 does NOT exclude stroke — the scale is heavily weighted toward anterior circulation and misses many posterior and right-hemisphere presentations.</p>
          </div>
        </div>
      </details>

      {/* Admission Order Checklists */}
      <details id="ref-orders" className="bg-white border border-ok-200 rounded-lg dark:bg-card dark:border-ok-800">
        <summary className="cursor-pointer p-4 font-semibold text-ok-800 hover:bg-ok-50 rounded-lg flex items-center gap-2 dark:text-ok-300">
          Admission Order Checklists
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <details className="bg-cobalt-50 border border-cobalt-200 rounded-lg dark:bg-cobalt-900 dark:border-cobalt-700" open>
            <summary className="cursor-pointer p-3 font-semibold text-cobalt-800 text-sm dark:text-cobalt-300">AIS (Acute Ischemic Stroke) Orders</summary>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-cobalt-700 mb-1 dark:text-cobalt-300">Monitoring</p>
                  <p>Neuro checks q1h x 24h (post-TNK: q15min x 2h, q30min x 6h, q1h x 16h)</p>
                  <p>Cardiac telemetry continuous</p>
                  <p>VS q1h (BP, HR, O2 sat)</p>
                  <p>Fingerstick glucose q6h</p>
                  <p>NPO until swallow eval</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-cobalt-700 mb-1 dark:text-cobalt-300">Activity & Safety</p>
                  <p>Bedrest with HOB 30° x 24h (if post-TNK)</p>
                  <p>DVT prophylaxis: SCDs (hold heparin x 24h post-TNK)</p>
                  <p>IV NS at 75 mL/hr (avoid D5W)</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-cobalt-700 mb-1 dark:text-cobalt-300">Medications</p>
                  <p>ASA 325 mg load (hold 24h post-TNK), then 81 mg daily</p>
                  <p>Atorvastatin 80 mg daily</p>
                  <p>Fever: Acetaminophen temp &gt;37.8°C; target normothermia</p>
                  <p>Insulin protocol: target BG 140-180 mg/dL</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-cobalt-700 mb-1 dark:text-cobalt-300">Labs & Consults</p>
                  <p>CBC, CMP, PT/INR, PTT, fasting lipid, HbA1c, Troponin x 2</p>
                  <p>CT head 24h post-TNK, MRI brain, TTE</p>
                  <p>PT/OT/Speech within 24h</p>
                </div>
              </div>
            </div>
          </details>

          <details className="bg-crit-50 border border-crit-200 rounded-lg dark:bg-crit-950 dark:border-crit-800">
            <summary className="cursor-pointer p-3 font-semibold text-crit-800 text-sm dark:text-crit-300">ICH (Intracerebral Hemorrhage) Orders</summary>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-crit-700 mb-1 dark:text-crit-300">Monitoring</p>
                  <p>ICU admission, Neuro checks q1h, Arterial line, VS q1h</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-crit-700 mb-1 dark:text-crit-300">BP & Medications</p>
                  <p>Target SBP &lt;140 mmHg (nicardipine drip), Reversal agents if on AC, hold antithrombotics, SCDs (delay heparin 24-48h)</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-crit-700 mb-1 dark:text-crit-300">Labs & Imaging</p>
                  <p>STAT CBC, CMP, PT/INR, PTT, fibrinogen, Type & screen, CT head at 6h, CTA head/neck</p>
                </div>
              </div>
            </div>
          </details>

          <details className="bg-warn-50 border border-warn-200 rounded-lg dark:bg-warn-950 dark:border-warn-800">
            <summary className="cursor-pointer p-3 font-semibold text-warn-800 text-sm dark:text-warn-300">SAH (Subarachnoid Hemorrhage) Orders</summary>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-warn-700 mb-1 dark:text-warn-300">Monitoring</p>
                  <p>Neuro ICU, Neuro checks q1h, Arterial/central line, daily TCDs starting day 3</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-warn-700 mb-1 dark:text-warn-300">Meds & Consults</p>
                  <p>Nimodipine 60 mg PO q4h x 21 days, SBP &lt;160, NSGY secure aneurysm &lt;24h, SCDs</p>
                </div>
              </div>
            </div>
          </details>

          <details className="bg-teal-50 border border-teal-200 rounded-lg dark:bg-teal-950 dark:border-teal-800">
            <summary className="cursor-pointer p-3 font-semibold text-teal-800 text-sm dark:text-teal-300">TIA (Transient Ischemic Attack) Orders</summary>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-teal-700 mb-1 dark:text-teal-300">Workup & Treatment</p>
                  <p>MRI within 24h, CTA head/neck, TTE, telemetry, DAPT if minor/high-risk (CHANCE/POINT) x 21 days</p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </details>

      {/* Detailed Document PDF lists */}
      <div className="space-y-4">
        {/* Aneurysms */}
        {evidenceSectionMatches('Aneurysms & Vascular Malformations', ['Unruptured Cerebral Aneurysms']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Aneurysms &amp; Vascular Malformations Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-ink">Unruptured Cerebral Aneurysms</h3>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/aneurysms/Unruptured Cerebral Aneurysms.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/aneurysms/Unruptured Cerebral Aneurysms.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Unruptured Cerebral Aneurysms', 'documents/aneurysms/Unruptured Cerebral Aneurysms.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Antiplatelet */}
        {evidenceSectionMatches('Antiplatelet Therapy', ['DAPT Minor Stroke-TIA Trials', 'DAPT After Ischemic Stroke-TIA', 'Other Antithrombotics']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Antiplatelet Therapy Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">DAPT Minor Stroke-TIA Trials</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('DAPT Minor Stroke-TIA Trials', 'documents/antiplatelet/DAPT Minor Stroke-TIA Trials.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">DAPT After Ischemic Stroke-TIA</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">Infographic - Match Patient to Trial</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('DAPT After Ischemic Stroke-TIA', 'documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Other Antithrombotics</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document — Cilostazol &amp; Factor XIa Inhibition Trials</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/antiplatelet/Other Antithrombotics for Secondary Stroke Prevention.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/antiplatelet/Other Antithrombotics for Secondary Stroke Prevention.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Other Antithrombotics', 'documents/antiplatelet/Other Antithrombotics for Secondary Stroke Prevention.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* CSVD */}
        {evidenceSectionMatches('Cerebral Small Vessel Disease', ['Lacunar Stroke']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Cerebral Small Vessel Disease Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Lacunar Stroke</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/csvd/Lacunar Stroke 7.13.22.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/csvd/Lacunar Stroke 7.13.22.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Lacunar Stroke', 'documents/csvd/Lacunar Stroke 7.13.22.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* EBM */}
        {evidenceSectionMatches('EBM', ['Interpretation of Clinical Trials', 'CEBM Oxford Resources']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Critical Appraisal Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Interpretation of Clinical Trials</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/ebm/Interpretation of Clinical Trials.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/ebm/Interpretation of Clinical Trials.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Interpretation of Clinical Trials', 'documents/ebm/Interpretation of Clinical Trials.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex items-center gap-3 flex-1">
                  <i aria-hidden="true" data-lucide="external-link" className="w-6 h-6 text-cobalt-600 dark:text-cobalt-300"></i>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-ink">CEBM Oxford Resources</h4>
                    <p className="text-xs text-slate-600 dark:text-mute">Centre for Evidence-Based Medicine - University of Oxford</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.cebm.ox.ac.uk/resources" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors flex items-center gap-1">
                    <i aria-hidden="true" data-lucide="external-link" className="w-4 h-4"></i>
                    Visit
                  </a>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* EVT */}
        {evidenceSectionMatches('EVT', ['Large Core Anterior Circulation LVO EVT Trials', 'Basilar Artery Occlusion EVT Trials', 'MeVO & Distal Vessel Occlusion EVT Trials']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Endovascular Therapy Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Large Core Anterior Circulation LVO EVT Trials</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Large Core Anterior Circulation LVO EVT Trials', 'documents/evt/Large Core Anterior Circulation LVO EVT Trials.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Basilar Artery Occlusion EVT Trials</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/evt/Basilar Artery Occlusion EVT Trials.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/evt/Basilar Artery Occlusion EVT Trials.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Basilar Artery Occlusion EVT Trials', 'documents/evt/Basilar Artery Occlusion EVT Trials.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">MeVO &amp; Distal Vessel Occlusion EVT Trials</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('MeVO & Distal Vessel Occlusion EVT Trials', 'documents/evt/MeVO & Distal Vessel Occlusion EVT Trials.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Risk Factors */}
        {evidenceSectionMatches('Risk Factors', ['Timing of Anticoagulation after AF-Related Stroke', 'Atrial Fibrillation & Secondary Stroke Prevention', 'AFib Stroke EPI519', 'Diabetes and stroke', 'Lipids and Cerebrovascular Disease']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Risk Factors Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-4 p-4 pt-0">
              <div className="border-l-4 border-cobalt-500 pl-4">
                <h4 className="text-base font-semibold text-cobalt-800 mb-3 dark:text-cobalt-300">Atrial Fibrillation</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-slate-900 dark:text-ink">Timing of Anticoagulation after AF-Related Stroke</h5>
                      <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href="documents/afib/AC timing after AF-related Stroke.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                      <a href="documents/afib/AC timing after AF-related Stroke.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                      <button onClick={() => emailDocument('AC timing after AF-related Stroke', 'documents/afib/AC timing after AF-related Stroke.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-slate-900 dark:text-ink">Atrial Fibrillation &amp; Secondary Stroke Prevention</h5>
                      <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href="documents/afib/AF & secondary stroke prevention July 2024.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                      <a href="documents/afib/AF & secondary stroke prevention July 2024.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                      <button onClick={() => emailDocument('AF & secondary stroke prevention July 2024', 'documents/afib/AF & secondary stroke prevention July 2024.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Diabetes and stroke</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/epidemiology/Diabetes and stroke.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/epidemiology/Diabetes and stroke.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Diabetes and stroke', 'documents/epidemiology/Diabetes and stroke.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Lipids and Cerebrovascular Disease</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/epidemiology/Lipids and Cerebrovascular Disease.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/epidemiology/Lipids and Cerebrovascular Disease.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Lipids and Cerebrovascular Disease', 'documents/epidemiology/Lipids and Cerebrovascular Disease.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Thrombolytic */}
        {evidenceSectionMatches('Thrombolytic Therapy', ['Thrombolytic Therapy AIS 4.5-24h RCTs', 'WAKE-UP Trial']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Thrombolytic Therapy Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Thrombolytic Therapy AIS 4.5-24h RCTs</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/thrombolytic/Thrombolytic Therapy AIS 4.5-24h RCTs.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/thrombolytic/Thrombolytic Therapy AIS 4.5-24h RCTs.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Thrombolytic Therapy AIS 4.5-24h RCTs', 'documents/thrombolytic/Thrombolytic Therapy AIS 4.5-24h RCTs.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Exam */}
        {evidenceSectionMatches('Exam', ['Differentiating Acute Confusional State (Delirium) from Aphasia', 'Coma Exam']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Exam Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Differentiating Acute Confusional State (Delirium) from Aphasia</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Differentiating Acute Confusional State (Delirium) from Aphasia', 'documents/exam/Differentiating Acute Confusional State (Delirium) from Aphasia.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Coma Exam</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/exam/coma exam.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/exam/coma exam.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('coma exam', 'documents/exam/coma exam.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Large Artery Disease */}
        {evidenceSectionMatches('Large Artery Disease', ['Symptomatic Cervical Carotid Artery Stenosis', 'CREST-2 Trial']) && (
          <details className="bg-white border border-line rounded-lg dark:bg-card">
            <summary className="cursor-pointer p-4 font-semibold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center justify-between text-lg dark:text-ink dark:hover:bg-paper-2">
              <span>Large Artery Disease Documents</span>
              <i aria-hidden="true" data-lucide="chevron-down" className="w-5 h-5"></i>
            </summary>
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">Symptomatic Cervical Carotid Artery Stenosis</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('Symptomatic Cervical Carotid Artery Stenosis', 'documents/lad/Symptomatic Cervical Carotid Artery Stenosis.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-line hover:bg-slate-100 transition-colors dark:bg-paper-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-ink">CREST-2 Trial (December 2025)</h4>
                  <p className="text-xs text-slate-600 dark:text-mute">PDF Document</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="documents/lad/CREST-2 Trial - Dec 2025.pdf" target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-cobalt-600 text-white rounded-lg text-xs font-medium hover:bg-cobalt-700 transition-colors">View</a>
                  <a href="documents/lad/CREST-2 Trial - Dec 2025.pdf" download className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">Download</a>
                  <button onClick={() => emailDocument('CREST-2 Trial (December 2025)', 'documents/lad/CREST-2 Trial - Dec 2025.pdf')} className="px-3 py-2 bg-orange-700 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors">Email</button>
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function ReferenceLibraryInfographic() {
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">Clinical Guideline &amp; Landmark Trial Blueprint</h2>
        <p className="text-xs text-mute">Bedside high-yield cheat sheet for stroke guidelines, acute trials, and diagnostic checkpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Thrombolysis & Thrombectomy */}
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-cobalt-700 uppercase tracking-wider dark:text-cobalt-300">1. Reperfusion Milestones</h3>
          <ul className="text-2xs text-ink-2 space-y-1 leading-normal list-disc pl-3">
            <li><b>IV Thrombolysis:</b> TNK 0.25 mg/kg (max 25mg) bolus preferred over alteplase within 4.5h of onset.</li>
            <li><b>Late Window EVT (6-24h):</b> DAWN (clinical-core mismatch) and DEFUSE-3 (perfusion mismatch: core &lt;70mL, Tmax&gt;6s volume &gt;15mL, mismatch ratio ≥1.8).</li>
            <li><b>Permissive Hypertension:</b> SBP &lt;220 mmHg prior to thrombolysis (or &lt;180 mmHg for 24h post-lytics).</li>
          </ul>
        </div>

        {/* Section 2: ICH Care */}
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-crit-700 uppercase tracking-wider dark:text-crit-300">2. Acute ICH Blueprint</h3>
          <ul className="text-2xs text-ink-2 space-y-1 leading-normal list-disc pl-3">
            <li><b>BP Target:</b> SBP &lt;140 mmHg within 2 hours of onset. Avoid dropping SBP &lt;130 mmHg due to renal risk.</li>
            <li><b>Anticoagulant Reversal:</b> Time-critical! Order PCC (4-factor Kcentra) or Idarucizumab (for dabigatran) immediately before CT scan if on known AC.</li>
            <li><b>Seizure Prophylaxis:</b> Contraindicated (Class III: Harm). Only treat active clinical or EEG confirmed seizures.</li>
          </ul>
        </div>

        {/* Section 3: Posterior Fossa & HINTS */}
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ink uppercase tracking-wider">3. HINTS+ Vertigo Triad</h3>
          <ul className="text-2xs text-ink-2 space-y-1 leading-normal list-disc pl-3">
            <li><b>Head Impulse Test:</b> Normal (no corrective saccade) suggests central stroke lesion.</li>
            <li><b>Nystagmus:</b> Direction-changing horizontal or vertical nystagmus suggests central stroke.</li>
            <li><b>Test of Skew:</b> Vertical alignment shift on cover test indicates central stroke.</li>
            <li><b>Hearing loss:</b> New unilateral hearing loss confirms central HINTS plus criteria.</li>
          </ul>
        </div>

        {/* Section 4: Secondary Prevention DAPT */}
        <div className="p-4 border border-line bg-card rounded-md space-y-2">
          <h3 className="font-bold text-xs text-ok-700 uppercase tracking-wider dark:text-ok-300">4. Secondary DAPT Regimens</h3>
          <ul className="text-2xs text-ink-2 space-y-1 leading-normal list-disc pl-3">
            <li><b>Minor Stroke (NIHSS ≤3) / High-Risk TIA:</b> Clopidogrel 300mg + ASA 325mg load, followed by clopidogrel 75mg + ASA 81mg daily for 21 days (CHANCE/POINT).</li>
            <li><b>High-Intensity Statin:</b> Atorvastatin 80mg daily initiated in facility for all atherosclerotic strokes.</li>
            <li><b>AFib DOAC Timing:</b> Initiated early (day 1-7 depending on size of infarct) per ELAN trial.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

