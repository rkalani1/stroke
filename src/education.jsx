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
import aanAsmWithdrawal2021 from './guidelines/aan-asm-withdrawal-2021.json';
import aanBrainDeathGuidance2025 from './guidelines/aan-brain-death-guidance-2025.json';
import aanConsentAis2022 from './guidelines/aan-consent-ais-2022.json';
import aanDriverLicensure2025 from './guidelines/aan-driver-licensure-2025.json';
import aanFunctionalSeizures2025 from './guidelines/aan-functional-seizures-2025.json';
import aanNeuropalliative2022 from './guidelines/aan-neuropalliative-2022.json';
import ahaAcuteBpManagement2024 from './guidelines/aha-acute-bp-management-2024.json';
import ahaAdultMoyamoyaDisease2023 from './guidelines/aha-adult-moyamoya-disease-2023.json';
import ahaAfGuideline2023 from './guidelines/aha-af-guideline-2023.json';
import ahaAggressiveLdlLowering2023 from './guidelines/aha-aggressive-ldl-lowering-2023.json';
import ahaAntiamyloidImmunotherapy2024 from './guidelines/aha-antiamyloid-immunotherapy-2024.json';
import ahaAtrialFibrillationOccurring2023 from './guidelines/aha-atrial-fibrillation-occurring-2023.json';
import ahaCadasil2023 from './guidelines/aha-cadasil-2023.json';
import ahaCareAisEvtIcu2021 from './guidelines/aha-care-ais-evt-icu-2021.json';
import ahaCareAisPosthyperacute2021 from './guidelines/aha-care-ais-posthyperacute-2021.json';
import ahaCareAisPrehospital2021 from './guidelines/aha-care-ais-prehospital-2021.json';
import ahaCervicalArteryDissection2024 from './guidelines/aha-cervical-artery-dissection-2024.json';
import ahaClinicalPerformanceMeasures2021 from './guidelines/aha-clinical-performance-measures-2021.json';
import ahaCrao2021 from './guidelines/aha-crao-2021.json';
import ahaCreatingVirtualNetworks2025 from './guidelines/aha-creating-virtual-networks-2025.json';
import ahaHypertensionGuideline2025 from './guidelines/aha-hypertension-guideline-2025.json';
import ahaIchPerformanceMeasures2024 from './guidelines/aha-ich-performance-measures-2024.json';
import ahaIdealFoundationalRequirements2023 from './guidelines/aha-ideal-foundational-requirements-2023.json';
import ahaImpactSleepDisorders2024 from './guidelines/aha-impact-sleep-disorders-2024.json';
import ahaImprovingAccessRehabilitation2025 from './guidelines/aha-improving-access-rehabilitation-2025.json';
import ahaInHospitalStroke2022 from './guidelines/aha-in-hospital-stroke-2022.json';
import ahaLvSystolicDysfunction2026 from './guidelines/aha-lv-systolic-dysfunction-2026.json';
import ahaNursingRolePsychosocial2024 from './guidelines/aha-nursing-role-psychosocial-2024.json';
import ahaPalliativeEndLife2024 from './guidelines/aha-palliative-end-life-2024.json';
import ahaPrimaryAgendaBrain2021 from './guidelines/aha-primary-agenda-brain-2021.json';
import ahaRecommendationsRegionalDestination2021 from './guidelines/aha-recommendations-regional-destination-2021.json';
import ahaRuralStrokeCare2024 from './guidelines/aha-rural-stroke-care-2024.json';
import ahaSexGenderEvt2022 from './guidelines/aha-sex-gender-evt-2022.json';
import ahaSocialEnvironmentalDeterminants2026 from './guidelines/aha-social-environmental-determinants-2026.json';
import ahaStandardsPostacuteRehabilitation2025 from './guidelines/aha-standards-postacute-rehabilitation-2025.json';
import ahaTargetedNursingInterventions2025 from './guidelines/aha-targeted-nursing-interventions-2025.json';
import ahaTransitionsOfCare2024 from './guidelines/aha-transitions-of-care-2024.json';
import ahaUseMarijuanaEffect2022 from './guidelines/aha-use-marijuana-effect-2022.json';
import ahaVascularContributionsCognitive2026 from './guidelines/aha-vascular-contributions-cognitive-2026.json';
import esoArteryDissection2021 from './guidelines/eso-artery-dissection-2021.json';
import esoCarotidStenosis2021 from './guidelines/eso-carotid-stenosis-2021.json';
import esoCovertCsvd2021 from './guidelines/eso-covert-csvd-2021.json';
import esoDysphagia2021 from './guidelines/eso-dysphagia-2021.json';
import esoEanPoststrokeCognition2021 from './guidelines/eso-ean-poststroke-cognition-2021.json';
import esoEsmintThrombectomy2022 from './guidelines/eso-esmint-thrombectomy-2022.json';
import esoIntracranialAtherosclerosis2022 from './guidelines/eso-intracranial-atherosclerosis-2022.json';
import esoMobileStrokeUnits2022 from './guidelines/eso-mobile-stroke-units-2022.json';
import esoMoyamoya2023 from './guidelines/eso-moyamoya-2023.json';
import esoSecondaryPrevention2022 from './guidelines/eso-secondary-prevention-2022.json';
import esoShortTermDapt2021 from './guidelines/eso-short-term-dapt-2021.json';
import esoSpaceOccupyingInfarction2021 from './guidelines/eso-space-occupying-infarction-2021.json';
import esoStrokeInWomen2022 from './guidelines/eso-stroke-in-women-2022.json';
import esoSubclinicalAfScreening2022 from './guidelines/eso-subclinical-af-screening-2022.json';
import esoTenecteplase2023 from './guidelines/eso-tenecteplase-2023.json';
import esoTia2021 from './guidelines/eso-tia-2021.json';
import esoUnrupturedAneurysms2022 from './guidelines/eso-unruptured-aneurysms-2022.json';
import svinDsaCollaterals2025 from './guidelines/svin-dsa-collaterals-2025.json';
import svinLabConsensus2025 from './guidelines/svin-lab-consensus-2025.json';
import svinMevoDvoEvt2026 from './guidelines/svin-mevo-dvo-evt-2026.json';
import esoBp2025 from './guidelines/eso-bp-2025.json';
import esoIch2025 from './guidelines/eso-ich-2025.json';
import esoSah2026 from './guidelines/eso-sah-2026.json';
import esoBao2024 from './guidelines/eso-bao-2024.json';
import esoPfo2024 from './guidelines/eso-pfo-2024.json';
import esoLacunar2024 from './guidelines/eso-lacunar-2024.json';
import esoSap2026 from './guidelines/eso-sap-2026.json';
import esoPacns2023 from './guidelines/eso-pacns-2023.json';
import esoAphasiaRehab2025 from './guidelines/eso-aphasia-rehab-2025.json';
import esoMotorRehab2025 from './guidelines/eso-motor-rehab-2025.json';
import esoVisual2025 from './guidelines/eso-visual-2025.json';
import aanSicas2022 from './guidelines/aan-sicas-2022.json';

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
  cardiacBrainHealth2024,
  aanAsmWithdrawal2021,
  aanBrainDeathGuidance2025,
  aanConsentAis2022,
  aanDriverLicensure2025,
  aanFunctionalSeizures2025,
  aanNeuropalliative2022,
  ahaAcuteBpManagement2024,
  ahaAdultMoyamoyaDisease2023,
  ahaAfGuideline2023,
  ahaAggressiveLdlLowering2023,
  ahaAntiamyloidImmunotherapy2024,
  ahaAtrialFibrillationOccurring2023,
  ahaCadasil2023,
  ahaCareAisEvtIcu2021,
  ahaCareAisPosthyperacute2021,
  ahaCareAisPrehospital2021,
  ahaCervicalArteryDissection2024,
  ahaClinicalPerformanceMeasures2021,
  ahaCrao2021,
  ahaCreatingVirtualNetworks2025,
  ahaHypertensionGuideline2025,
  ahaIchPerformanceMeasures2024,
  ahaIdealFoundationalRequirements2023,
  ahaImpactSleepDisorders2024,
  ahaImprovingAccessRehabilitation2025,
  ahaInHospitalStroke2022,
  ahaLvSystolicDysfunction2026,
  ahaNursingRolePsychosocial2024,
  ahaPalliativeEndLife2024,
  ahaPrimaryAgendaBrain2021,
  ahaRecommendationsRegionalDestination2021,
  ahaRuralStrokeCare2024,
  ahaSexGenderEvt2022,
  ahaSocialEnvironmentalDeterminants2026,
  ahaStandardsPostacuteRehabilitation2025,
  ahaTargetedNursingInterventions2025,
  ahaTransitionsOfCare2024,
  ahaUseMarijuanaEffect2022,
  ahaVascularContributionsCognitive2026,
  esoArteryDissection2021,
  esoCarotidStenosis2021,
  esoCovertCsvd2021,
  esoDysphagia2021,
  esoEanPoststrokeCognition2021,
  esoEsmintThrombectomy2022,
  esoIntracranialAtherosclerosis2022,
  esoMobileStrokeUnits2022,
  esoMoyamoya2023,
  esoSecondaryPrevention2022,
  esoShortTermDapt2021,
  esoSpaceOccupyingInfarction2021,
  esoStrokeInWomen2022,
  esoSubclinicalAfScreening2022,
  esoTenecteplase2023,
  esoTia2021,
  esoUnrupturedAneurysms2022,
  svinDsaCollaterals2025,
  svinLabConsensus2025,
  svinMevoDvoEvt2026,
  esoBp2025,
  esoIch2025,
  esoSah2026,
  esoBao2024,
  esoPfo2024,
  esoLacunar2024,
  esoSap2026,
  esoPacns2023,
  esoAphasiaRehab2025,
  esoMotorRehab2025,
  esoVisual2025,
  aanSicas2022
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
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. Prediction of late seizures after ischaemic stroke with the SeLECT score. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
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
      { label: 'SAMMPRIS Trial', citation: 'Chimowitz MI et al. N Engl J Med. 2011;365:993-1003.', pmid: '21899409' },
      { label: 'SPS3 Trial', citation: 'Benavente OR, et al. Effects of clopidogrel added to aspirin in patients with recent lacunar stroke. N Engl J Med. 2012;367(9):817-825.', pmid: '22931315' },
      { label: 'MATCH Trial', citation: 'Diener HC, et al. Aspirin and clopidogrel compared with clopidogrel alone after recent ischaemic stroke or TIA in high-risk patients (MATCH). Lancet. 2004;364(9431):331-337.', pmid: '15276392' },
      { label: 'ARAMIS Trial', citation: 'Chen HS, et al. Dual Antiplatelet Therapy vs Alteplase for Patients With Minor Nondisabling Acute Ischemic Stroke: The ARAMIS Randomized Clinical Trial. JAMA. 2023;329(24):2135-2144.', pmid: '37367978' },
      { label: 'CHANCE-3 (colchicine)', citation: 'Li J, et al. Colchicine in patients with acute ischaemic stroke or transient ischaemic attack (CHANCE-3). BMJ. 2024;385:e079061.', pmid: '38925803' }
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
      { label: 'AFib Guidelines', citation: 'Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. Circulation. 2024;149:e1-e156.', pmid: '38033089' }
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
      { label: 'Kattah Study', citation: 'Kattah JC, et al. HINTS to diagnose stroke in the acute vestibular syndrome: three-step bedside oculomotor examination more sensitive than early MRI diffusion-weighted imaging. Stroke. 2009;40(11):3504-3510.', pmid: '19762709' },
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
      { label: 'ORANGE Cohort', citation: 'Oddo M, et al. The Neurological Pupil index for outcome prognostication in people with acute brain injury (ORANGE): a prospective, observational, multicentre cohort study. Lancet Neurol. 2023;22(10):925-933.', pmid: '37652068' },
      { label: 'NPi vs ICP (ORANGE Secondary)', citation: 'Petrosino M, et al. Neurological Pupil Index and Intracranial Hypertension in Patients With Acute Brain Injury: A Secondary Analysis of the ORANGE Study. JAMA Neurol. 2025;82(2):176-184.', pmid: '39652324' },
      { label: 'Pupillometry & ICP in ICH', citation: 'Giede-Jeppe A, et al. Automated Pupillometry Identifies Absence of Intracranial Pressure Elevation in Intracerebral Hemorrhage Patients. Neurocrit Care. 2021;35(1):210-220.', pmid: '33367973' }
    ]
  },
  {
    id: 'neuro-exams-simulator',
    title: 'Bedside Neuro-Exams Tool',
    purpose: 'Interactive bedside clinical exam assistant for classifying aphasia types, differentiating delirium from aphasia, and structured coma examinations.',
    actions: 'neuroexam aphasia delirium coma exam classifier fluent non-fluent global wernicke broca interactive',
    categories: ['simulators'],
    lastReviewed: '2026-05-30',
    references: [
      { label: 'Aphasia Classification', citation: 'Mesulam MM. Principles of Behavioral and Cognitive Neurology. 2nd ed. Oxford University Press; 2000.', pmid: null },
      { label: 'Coma Examination', citation: 'Posner JB, Saper CB, Schiff ND, Claassen J. Plum and Posner Diagnosis of Stupor and Coma. 5th ed. Oxford University Press; 2019.', pmid: null },
      { label: 'Delirium Attention Criterion (CAM-ICU)', citation: 'Ely EW, et al. Delirium in mechanically ventilated patients: validity and reliability of the confusion assessment method for the intensive care unit (CAM-ICU). JAMA. 2001;286(21):2703-2710.', pmid: '11730446' }
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
      { label: 'AAN 2010 Guideline Update', citation: 'Wijdicks EF, et al. Evidence-based guideline update: determining brain death in adults: report of the Quality Standards Subcommittee of the American Academy of Neurology. Neurology. 2010;74(23):1911-1918.', pmid: '20530327' }
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
    purpose: 'Clinical classification of post-stroke seizures, guideline-directed management, comparison of first-line and second-line antiepileptic drugs (ASMs), and post-stroke epilepsy risk stratification with the SeLECT score.',
    actions: 'antiepileptic drugs antiseizure medications asm aed keppra levetiracetam lamotrigine lamictal lacosamide vimpat valproic acid depakote phenytoin dilantin select score ischemia score post-stroke epilepsy seizure prophylaxis',
    categories: ['pocket-card', 'printable', 'icu'],
    lastReviewed: '2026-07-13',
    references: [
      { label: 'AHA/ASA 2026 Stroke Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'AHA/ASA 2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'AHA/ASA 2023 aSAH Guideline', citation: 'Hoh BL, et al. 2023 Guideline for the Management of Patients With Aneurysmal Subarachnoid Hemorrhage. Stroke. 2023;54(7):e314-e370.', pmid: '37212182' },
      { label: 'SeLECT Score Study', citation: 'Galovic M, et al. SeLECT: a prediction model for late seizures after ischemic stroke. Lancet Neurol. 2018;17(2):143-152.', pmid: '29413315' }
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
      { label: '2026 AIS Guideline', citation: 'Prabhakaran S, et al. 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke. 2026.', pmid: '41582814' },
      { label: 'MR CLEAN-LATE Trial', citation: 'Olthuis SGH, et al. Endovascular treatment versus no endovascular treatment after 6-24 h in patients with ischaemic stroke and collateral flow on CT angiography (MR CLEAN-LATE). Lancet. 2023;401(10385):1371-1380.', pmid: '37003289' },
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
      { label: 'JSS Moyamoya Guidelines', citation: 'Kuroda S, et al. Guidelines for Diagnosis and Treatment of Moyamoya Disease. Neurol Med Chir (Tokyo). 2012;52(5):245-266.', pmid: '22870528' },
      { label: 'Scott & Smith Review', citation: 'Scott RM, et al. Moyamoya disease and moyamoya syndrome. N Engl J Med. 2009;360(12):1226-1237.', pmid: '19297575' },
      { label: 'ESO Moyamoya Guidelines', citation: 'Bersano A, et al. European Stroke Organisation (ESO) Guidelines on Moyamoya angiopathy Endorsed by Vascular European Reference Network (VASCERN). Eur Stroke J. 2023;8(1):55-84.', pmid: '37021176' }
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
      { label: 'DISTAL Trial', citation: 'Fischer U, et al. Endovascular Treatment for Medium or Distal Vessel Occlusion Stroke (DISTAL). N Engl J Med. 2025;392(14):1374-1384.', pmid: '39908430' },
      { label: 'DISTAL 12-Month', citation: 'Fischer U, et al. Endovascular treatment for medium or distal vessel occlusion stroke (DISTAL): 12-month outcomes. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
      { label: 'ESCAPE-MeVO Trial', citation: 'Goyal M, et al. Endovascular Treatment for Medium Vessel Occlusion Stroke (ESCAPE-MeVO). N Engl J Med. 2025;392(14):1385-1395.', pmid: '39908448' },
      { label: 'CHOICE Trial', citation: 'Renú A, et al. Effect of Intra-arterial Alteplase vs Placebo Following Successful Thrombectomy on Functional Outcomes (CHOICE). JAMA. 2022;327(9):826-835.', pmid: '35143603' },
      { label: 'CHOICE-2 Trial', citation: 'Renú A, et al. Adjunctive Intra-Arterial Alteplase After Successful Thrombectomy for Acute Ischemic Stroke (CHOICE-2). JAMA. 2026.', pmid: '42096239' },
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
      { label: 'INTERACT3', citation: 'Ma L, et al. Intensive care bundle with blood pressure lowering in acute intracerebral haemorrhage (INTERACT3): a pragmatic, stepped-wedge cluster randomised trial. Lancet. 2023;402(10395):27-40.', pmid: '37245517' },
      { label: 'ENRICH Trial', citation: 'Pradilla G, et al. Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH). N Engl J Med. 2024;390(14):1277-1289.', pmid: '38598795' },
      { label: 'TRIDENT Trial', citation: 'Anderson CS, et al. Triple-Pill Strategy for Blood Pressure Lowering after Intracerebral Hemorrhage (TRIDENT). N Engl J Med. 2026;394:1571-1582.', pmid: '42019018' },
      { label: 'FASTEST Trial', citation: 'Broderick JP, et al. Recombinant factor VIIa for acute intracerebral hemorrhage (FASTEST). Lancet. 2026;407(10530):773-783.', pmid: '41653933' },
      { label: 'SWITCH Trial', citation: 'Beck J, et al. Decompressive craniectomy versus best medical treatment in severe deep intracerebral haemorrhage (SWITCH): an open-label randomised controlled trial. Lancet. 2024;403(10442):2395-2404.', pmid: '38761811' },
      { label: '2022 ICH Guideline', citation: 'Greenberg SM, et al. 2022 Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage. Stroke. 2022;53(7):e282-e361.', pmid: '35579034' },
      { label: 'INTERACT4 Trial', citation: 'Li G, et al. Intensive Ambulance-Delivered Blood-Pressure Reduction in Hyperacute Stroke (INTERACT4). N Engl J Med. 2024;390(20):1862-1872.', pmid: '38752650' },
      { label: 'TICH-2 Trial', citation: 'Sprigg N, et al. Tranexamic acid for hyperacute primary IntraCerebral Haemorrhage (TICH-2). Lancet. 2018;391(10135):2107-2115.', pmid: '29778325' }
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
    purpose: 'Which spontaneous intracerebral hemorrhage patients benefit from evacuation, by which technique, and when — the negative-trial spine (STICH, STICH II, MISTIE III, CLEAR III), the one positive lobar signal (ENRICH), decompressive craniectomy for deep ICH (SWITCH), the posterior-fossa rules that rest on non-randomized evidence, MISTIE-derived surgical-dose thresholds, and an integrated decision table by location, volume, GCS, age, and anticoagulation.',
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
    purpose: 'Running the thrombectomy and the first 24 hours after it: anesthesia and intraprocedural hemodynamic floors, device strategy and first-pass effect, bailout decisions, the post-reperfusion blood pressure guardrail, and the angio-suite handoff.',
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
    purpose: 'Mechanism-first diagnosis and treatment of symptomatic intracranial atherosclerotic stenosis — artery-to-artery embolism, branch atheromatous perforator occlusion and hemodynamic borderzone failure; the SAMMPRIS aggressive medical bundle; and why stenting (SAMMPRIS, CASSISS), bypass (CMOSS, COSS, EC/IC 1985) and bailout angioplasty (ANGEL-REBOOT) all failed their primary endpoints.',
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
    purpose: 'Deciding where the ambulance goes and how patients move between hospitals — mothership vs drip-and-ship and how to compute a local crossover, the neutral RACECAT result with its intracerebral hemorrhage harm signal, TRIAGE-STROKE, mobile stroke units (BEST-MSU, B_PROUD), why INTERACT4 forbids undifferentiated prehospital blood-pressure lowering, prehospital LVO scales (RACE, LAMS, C-STAT, FAST-ED), and door-in-door-out as the governing interfacility transfer metric.',
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
        <div className="space-y-6 max-w-4xl mx-auto v7-reveal">
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
    <div className="space-y-6 max-w-6xl mx-auto v7-reveal">
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Duration Bands for Device-Detected Atrial Fibrillation, Randomized Trial Results, and Where Absolute Benefit Lies" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Duration bands and nomenclature */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: DURATION BANDS &amp; NOMENCLATURE</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="30" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">BAND 1 &mdash; AHRE &lt; 6 min (very short)</text>
        <text x="8" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Excluded from the ASSERT duration analysis; no RCT enrolled them</text>
        <text x="8" y="27" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Do not anticoagulate &mdash; treat as an artifact-prone signal until adjudicated</text>

        <rect x="0" y="33" width="222" height="35" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="44" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">BAND 2 &mdash; 6 min to 24 h = SUBCLINICAL AF</text>
        <text x="8" y="52" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ASSERT: stroke/SE risk NOT significantly different from no SCAF</text>
        <text x="8" y="59" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">The exact ARTESiA population (n=4012, CHA&#8322;DS&#8322;-VASc &ge;3)</text>
        <text x="8" y="65" fill="var(--purple-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans" fontWeight="700">Anticoagulation here is an individualized trade-off, not a reflex</text>

        <rect x="0" y="71" width="222" height="35" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="8" y="82" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">BAND 3 &mdash; &gt; 24 h (high burden)</text>
        <text x="8" y="91" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ASSERT: adjusted HR 3.24 (95% CI 1.51&ndash;6.95) for stroke/systemic embolism</text>
        <text x="8" y="98" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Prospectively EXCLUDED from ARTESiA &mdash; no dedicated randomized data</text>
        <text x="8" y="104" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans" fontWeight="700">Most clinicians manage this band as clinical-AF territory</text>

        <rect x="0" y="109" width="222" height="15" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="8" y="119" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Clinical AF on ECG/telemetry &rarr; standard CHA&#8322;DS&#8322;-VASc rules apply</text>
      </g>

      {/* Panel B: The randomized evidence */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: THE TWO TRIALS &amp; THE POOLED RESULT</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="38" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="11" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">NOAH-AFNET 6 (NEJM 2023; PMID 37622677)</text>
        <text x="6" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Edoxaban vs placebo, AHRE &ge;6 min, n=2536, stopped early</text>
        <text x="6" y="28" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">NEUTRAL: CV death/stroke/SE HR 0.81 (0.60&ndash;1.08), P=0.15</text>
        <text x="6" y="35" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">HARM: death or major bleeding HR 1.31 (1.02&ndash;1.67), P=0.03</text>

        <rect x="0" y="42" width="222" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="53" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">ARTESiA (NEJM 2024; PMID 37952132)</text>
        <text x="6" y="62" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Apixaban vs aspirin 81 mg, SCAF 6 min to 24 h, n=4012</text>
        <text x="6" y="70" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Stroke/SE HR 0.63 (0.45&ndash;0.88) &bull; 0.78 vs 1.24 %/pt-yr</text>
        <text x="6" y="77" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Major bleed HR 1.80 (1.26&ndash;2.57) &bull; 1.71 vs 0.94 %/pt-yr</text>

        <rect x="0" y="84" width="222" height="40" rx="3" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
        <text x="6" y="95" fill="#7e22ce" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">POOLED META-ANALYSIS (Circulation 2024; PMID 37952187)</text>
        <text x="6" y="104" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Ischemic stroke RR 0.68 (0.50&ndash;0.92), I&sup2;=0%, high-quality GRADE</text>
        <text x="6" y="112" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Major bleeding RR 1.62 (1.05&ndash;2.50), I&sup2;=61%</text>
        <text x="6" y="120" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">No reduction in CV death (0.95) or all-cause death (1.08)</text>
      </g>

      {/* Panel C: Where the absolute benefit lives */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: WHERE THE ABSOLUTE BENEFIT LIVES</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="30" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">PRIOR STROKE / TIA + SCAF (n=346, 8.6% of ARTESiA)</text>
        <text x="8" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Apixaban 1.20 vs aspirin 3.14 %/yr &bull; HR 0.40 (0.17&ndash;0.95)</text>
        <text x="8" y="27" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Absolute risk difference 7% (95% CI 2&ndash;12) over 3.5 years</text>

        <rect x="0" y="33" width="221" height="30" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="8" y="44" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">NO PRIOR STROKE / TIA (n=3666)</text>
        <text x="8" y="53" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">0.74 vs 1.07 %/yr &bull; HR 0.69 (0.48&ndash;1.00)</text>
        <text x="8" y="60" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Absolute risk difference only 1% (0&ndash;3) over 3.5 years</text>

        <rect x="0" y="66" width="221" height="28" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="8" y="76" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">PRIOR ICH / PROBABLE CAA / HIGH BLEED PHENOTYPE</text>
        <text x="8" y="85" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Bleeding excess dominates the ledger &mdash; the calculus flips</text>
        <text x="8" y="91" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans" fontWeight="700">Cross-check the Cerebral Amyloid Angiopathy card first</text>

        <rect x="0" y="97" width="221" height="27" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="107" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DETECTION IS NOT BENEFIT &mdash; LOOP (Lancet 2021)</text>
        <text x="8" y="115" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ICM screening tripled AF detection (HR 3.17) and doubled OAC use,</text>
        <text x="8" y="121" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">but stroke/SE HR 0.80 (0.61&ndash;1.05), P=0.11 &mdash; NOT significant</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
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
                  <br />&bull; <strong>ASSERT duration analysis (Eur Heart J 2017; PMID: 28329139):</strong> only the <strong>&gt;24 h</strong> band was hazardous (adjusted HR 3.24; 1.51&ndash;6.95). Episodes of <strong>6 min to 24 h did not differ significantly from no SCAF at all</strong>.
                  <br />&bull; Record longest single episode, total daily burden, and % time in AHRE &mdash; not a yes/no flag.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Adjudicate the Electrogram Before You Act</strong>
                  <br />&bull; A counter alone is <strong>not</strong> a diagnosis. Pull the stored EGM and read it with electrophysiology before any anticoagulation decision.
                  <br />&bull; <strong>Common false positives:</strong> far-field R-wave oversensing &bull; lead noise, fracture or loose set-screw &bull; myopotential/EMI artifact &bull; repetitive non-sustained atrial runs or frequent PACs &bull; sinus tachycardia crossing the rate cut-off &bull; atrial undersensing that truncates true burden.
                  <br />&bull; Insertable cardiac monitors are the most artifact-prone; a rejected episode should be documented as rejected.
                </div>
              </div>
            </CardSection>

            {/* §2 Randomized evidence (teal) */}
            <CardSection color="teal" title="2. Randomized Evidence: NOAH-AFNET 6, ARTESiA, Their Pooled Analysis &amp; LOOP">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Major bleeding 4.3% vs 3.5%, HR 1.26 (0.95&ndash;1.69), P=0.11. <span style={{ color: 'var(--red-deep)' }}>Screening unselected at-risk elderly is not a stroke-prevention strategy.</span></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Absolute risk framing (amber) */}
            <CardSection color="amber" title="3. Absolute-Risk Framing: Why NNT and NNH Sit Almost on Top of Each Other">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.2fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Do the Arithmetic Out Loud (ARTESiA)</strong>
                  <br />&bull; Stroke/SE fell by <strong>0.46 percentage points per patient-year</strong> (1.24 &minus; 0.78) &rarr; roughly <strong>1 event avoided per 217 patient-years</strong> of apixaban.
                  <br />&bull; Major bleeding rose by <strong>0.77 percentage points per patient-year</strong> (1.71 &minus; 0.94) &rarr; roughly <strong>1 extra major bleed per 130 patient-years</strong>.
                  <br />&bull; So the <strong>count</strong> of extra bleeds exceeds the count of avoided strokes; the case for treatment rests on the differing <em>consequences</em> of the two events, not on their frequency.
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
                  <br />&bull; <strong>Different endpoints:</strong> NOAH&apos;s primary outcome bundled CV death with stroke and systemic embolism, diluting a stroke-specific effect; ARTESiA&apos;s primary outcome was stroke/SE alone.
                  <br />&bull; <strong>Different burden bands:</strong> NOAH admitted any AHRE &ge;6 min (median 2.8 h, no upper cap); ARTESiA capped episodes at 24 h.
                  <br />&bull; <strong>Statistically they agree:</strong> NOAH&apos;s confidence interval (0.60&ndash;1.08) comfortably contains ARTESiA&apos;s point estimate, and the pooled ischemic-stroke analysis showed <strong>I&sup2;=0% heterogeneity</strong>. Early termination left NOAH underpowered, not opposed.
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
                  <br />&bull; Reasonable default: aggressive risk-factor control (BP, OSA, alcohol, weight), repeat interrogation, and anticoagulate only if burden or risk climbs.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>B. Found During a Stroke Work-Up (Secondary Prevention)</strong>
                  <br />&bull; Device-detected AF discovered while working up an embolic-appearing or cryptogenic infarct sits in a much higher absolute-risk stratum.
                  <br />&bull; ARTESiA prespecified subgroup with prior stroke/TIA (n=346, 8.6%): apixaban 1.20 vs aspirin 3.14 %/yr, <strong>HR 0.40 (95% CI 0.17&ndash;0.95)</strong>, absolute risk difference <strong>7% (95% CI 2&ndash;12) over 3.5 years</strong>, against a 3% (&minus;1 to 8) absolute increase in major bleeding (Lancet Neurol 2025; PMID: 39862882).
                  <br />&bull; This is the one group where the ledger clearly favors a DOAC &mdash; but it is a subgroup, not a separate trial.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>C. The Bleeding Phenotype That Flips the Calculus</strong>
                  <br />&bull; <strong>Prior ICH, strictly lobar microbleeds, cortical superficial siderosis, or probable CAA</strong> &mdash; work the Cerebral Amyloid Angiopathy (Boston v2.0) card before committing; at these bleeding rates a 0.46%/yr stroke gain does not survive.
                  <br />&bull; Other flags: prior major GI bleed, advanced CKD, recurrent falls with frailty, unavoidable antiplatelet co-therapy.
                  <br />&bull; If the arrhythmia burden truly warrants stroke prophylaxis but bleeding forbids a DOAC, escalate to a left atrial appendage occlusion discussion rather than defaulting to aspirin, which was the <em>comparator</em> ARTESiA beat &mdash; not a proven alternative.
                </div>
              </div>
            </CardSection>

            {/* §5 Bedside algorithm and documentation (teal) */}
            <CardSection color="teal" title="5. Bedside Algorithm &mdash; Interrogate, Adjudicate, Band, Score, Decide, Document">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Steps 1&ndash;2: Interrogate &amp; Adjudicate</strong>
                  <br />&bull; <strong>1. Interrogate</strong> the pacemaker, ICD, CRT device or ICM. Capture: longest single episode, total burden (hours/day and % of time), date of first episode, and whether burden is rising.
                  <br />&bull; <strong>2. Adjudicate</strong> the stored electrograms with electrophysiology. Reject noise, far-field R-wave oversensing, PAC runs and sinus tachycardia. Only confirmed atrial fibrillation/flutter advances.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Steps 3&ndash;4: Band the Burden, Score the Patient</strong>
                  <br />&bull; <strong>3. Band it:</strong> &lt;6 min (do not treat) &bull; 6 min to 24 h (individualize) &bull; &gt;24 h (manage as clinical-AF territory; note no dedicated RCT).
                  <br />&bull; <strong>4. Score it:</strong> CHA&#8322;DS&#8322;-VASc, the bleeding phenotype above, and the clinical context (incidental vs post-stroke). Check for an ECG that already documents AF &mdash; that ends the debate and mandates standard anticoagulation.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Steps 5&ndash;6: Decide, Document, Re-check</strong>
                  <br />&bull; <strong>5. Shared decision:</strong> quote both absolute numbers (roughly 1 stroke avoided per 217 patient-years vs 1 extra major bleed per 130). If a DOAC is chosen, use a trial-tested regimen &mdash; apixaban 5 mg BID (2.5 mg BID when dose-reduction criteria are met).
                  <br />&bull; <strong>6. Document &amp; re-interrogate</strong> in 3&ndash;6 months. <strong>Convert aspirin to a DOAC</strong> if episodes exceed 24 h, burden climbs, ECG-documented AF appears (18.2% of NOAH patients progressed), or the patient has an interval stroke or TIA.
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Randomized evidence for intracerebral hemorrhage surgery, decision by hematoma location, and surgical dose thresholds" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: What each randomized trial actually showed */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--red)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: WHAT EACH TRIAL ACTUALLY SHOWED</text>
      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="23" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="9" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">STICH 2005 (n=1033) &amp; STICH II 2013 (n=601) &mdash; NEUTRAL</text>
        <text x="6" y="18" fill="var(--ink)" fontSize="4.0pt" fontFamily="IBM Plex Sans">Craniotomy OR 0.89 (0.66&ndash;1.19) p=0.414 &bull; lobar/no-IVH OR 0.86 (0.62&ndash;1.20) p=0.367</text>
        <rect x="0" y="24.8" width="222" height="23" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="33.8" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">MISTIE III 2019 (n=499) &bull; catheter + alteplase &mdash; NEUTRAL</text>
        <text x="6" y="42.8" fill="var(--ink)" fontSize="4.0pt" fontFamily="IBM Plex Sans">mRS 0&ndash;3 at 1 year 45% vs 41%; adjusted RD 4% (95% CI &minus;4 to 12), p=0.33</text>
        <rect x="0" y="49.6" width="222" height="23" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="58.6" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">CLEAR III 2017 (n=500) &bull; intraventricular tPA &mdash; NEUTRAL</text>
        <text x="6" y="67.6" fill="var(--ink)" fontSize="4.0pt" fontFamily="IBM Plex Sans">mRS 0&ndash;3 48% vs 45%; RR 1.06 (0.88&ndash;1.28), p=0.554 &bull; fewer deaths, more mRS 5</text>
        <rect x="0" y="74.4" width="222" height="23" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="83.4" fill="#166534" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">ENRICH 2024 (n=300) &bull; MIPS &lt;24 h &mdash; POSITIVE, lobar only</text>
        <text x="6" y="92.4" fill="var(--ink)" fontSize="4.0pt" fontFamily="IBM Plex Sans">Utility-weighted mRS +0.084 (95% CrI 0.005&ndash;0.163); P(superiority) 0.981</text>
        <rect x="0" y="99.2" width="222" height="23" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="108.2" fill="var(--amber-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">SWITCH 2024 (n=197) &bull; craniectomy &mdash; MISSED, p=0.057</text>
        <text x="6" y="117.2" fill="var(--ink)" fontSize="4.0pt" fontFamily="IBM Plex Sans">mRS 5&ndash;6 44% vs 58%; adjusted RR 0.77 (0.59&ndash;1.01); stopped early, underpowered</text>
      </g>

      {/* Panel B: Decision by hematoma location */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: DECIDE BY LOCATION, NOT VOLUME</text>
      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="29" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="10" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">CEREBELLAR &mdash; operate, do not observe</text>
        <text x="6" y="18.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Deterioration, brainstem compression, or 4th-ventricle obstruction:</text>
        <text x="6" y="26" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">suboccipital decompression now &bull; EVD alone &rarr; upward herniation</text>
        <rect x="0" y="31" width="222" height="29" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="41" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">LOBAR 30&ndash;80 mL &mdash; MIPS within 24 h</text>
        <text x="6" y="49.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Only stratum with a positive RCT signal (ENRICH lobar subgroup:</text>
        <text x="6" y="57" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">uw-mRS difference 0.127, 95% CrI 0.035&ndash;0.219)</text>
        <rect x="0" y="62" width="222" height="29" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="72" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">DEEP / BASAL GANGLIA &mdash; no evacuation benefit</text>
        <text x="6" y="80.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">ENRICH basal ganglia stratum: difference &minus;0.013 (&minus;0.147 to 0.116)</text>
        <text x="6" y="88" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Craniectomy = life-saving gamble only (SWITCH), not restorative</text>
        <rect x="0" y="93" width="222" height="29" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="103" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">IVH + HYDROCEPHALUS &mdash; the EVD is the intervention</text>
        <text x="6" y="111.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Intraventricular alteplase does not improve mRS 0&ndash;3 (CLEAR III);</text>
        <text x="6" y="119" fill="var(--purple-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">lowers 180-day death (HR 0.60) but raises mRS 5 (RR 1.99)</text>
      </g>

      {/* Panel C: Surgery as a dose, plus the pre-op bundle */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--purple)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: SURGERY IS A DOSE, NOT A YES/NO</text>
      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="29" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="10" fill="#166534" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">FUNCTIONAL-BENEFIT THRESHOLD</text>
        <text x="6" y="18.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">End-of-treatment ICH volume &le;15 mL OR &ge;70% volume reduction</text>
        <text x="6" y="26" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">MISTIE III surgical arm, n=242 (Awad, Neurosurgery 2019)</text>
        <rect x="0" y="31" width="221" height="29" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="41" fill="var(--amber-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">MORTALITY-BENEFIT THRESHOLD</text>
        <text x="6" y="49.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">End-of-treatment volume &le;30 mL OR &gt;53% volume reduction &mdash;</text>
        <text x="6" y="57" fill="var(--amber-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">a partial evacuation buys survival, not independence</text>
        <rect x="0" y="62" width="221" height="29" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="72" fill="var(--red-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">WHAT MAKES YOU MISS THE TARGET</text>
        <text x="6" y="80.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Large or irregular clot, hypertension history, protocol deviation,</text>
        <text x="6" y="88" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">catheter manipulation problems, low surgeon and site volume</text>
        <rect x="0" y="93" width="221" height="29" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="103" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">BEFORE THE OR &mdash; THE BUNDLE STILL RUNS</text>
        <text x="6" y="111.5" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">SBP target &lt;140 mmHg, INR &lt;1.5, glucose and temperature control</text>
        <text x="6" y="119" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">within 1 h (INTERACT3: common OR 0.86, 95% CI 0.76&ndash;0.97)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 The negative-trial spine that defines current equipoise (red) */}
            <CardSection color="red" title="1. The Negative-Trial Spine &mdash; Why Open Craniotomy Is Not Routine">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>STICH (Lancet 2005; PMID: 15680453)</strong>
                  <br />&bull; <strong>Design:</strong> 1033 patients, 83 centres in 27 countries. Early craniotomy (evacuation within 24 h of randomisation) vs initial conservative treatment, with later evacuation permitted if judged necessary.
                  <br />&bull; <strong>Primary outcome</strong> (prognosis-based dichotomised extended Glasgow Outcome Scale at 6 months): favourable in 122/468 (26%) surgical vs 118/496 (24%) conservative &mdash; <strong style={{ color: 'var(--red-deep)' }}>OR 0.89 (95% CI 0.66&ndash;1.19), p=0.414</strong>; absolute benefit 2.3% (&minus;3.2 to 7.7).
                  <br />&bull; <strong>Say it plainly:</strong> no overall benefit from early surgery. Not a trend, not an underpowered near-miss &mdash; a flat result across 1033 patients.
                </div>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>STICH II (Lancet 2013; PMID: 23726393)</strong>
                  <br />&bull; <strong>Design:</strong> 601 patients, 78 centres in 27 countries &mdash; the best-case anatomy: conscious patients, <strong>superficial lobar</strong> ICH of 10&ndash;100 mL, <strong>no IVH</strong>, within 48 h of ictus, surgery within 12 h of randomisation.
                  <br />&bull; <strong>Primary outcome:</strong> unfavourable in 174/297 (59%) surgical vs 178/286 (62%) conservative &mdash; <strong style={{ color: 'var(--red-deep)' }}>OR 0.86 (95% CI 0.62&ndash;1.20), p=0.367</strong>; absolute difference 3.7% (95% CI &minus;4.3 to 11.6). Not significant. The authors framed it as safe, with at most a small possible survival advantage &mdash; never a functional win.
                  <br />&bull; <strong>What the two trials bought us:</strong> craniotomy is not the default operation at any supratentorial volume. The likely failure was the <em>approach</em> (transcortical dissection through viable brain), not the <em>goal</em> (mass-effect relief) &mdash; which is why the field pivoted to minimally invasive corridors. Crossover from the conservative arms also means &ldquo;conservative&rdquo; never meant &ldquo;never operate.&rdquo;
                </div>
              </div>
            </CardSection>

            {/* §2 Minimally invasive evacuation & the surgical-dose concept (teal) */}
            <CardSection color="teal" title="2. Minimally Invasive Evacuation &mdash; ENRICH (Positive) vs MISTIE III (Neutral), and the Surgical Dose">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Mean utility-weighted mRS at 180 d <strong>0.458 vs 0.374</strong>; difference <strong style={{ color: '#166534' }}>0.084 (95% Bayesian credible interval 0.005&ndash;0.163)</strong>, posterior probability of superiority <strong>0.981</strong> against a prespecified threshold of 0.975.<br /><strong>Lobar:</strong> 0.127 (0.035&ndash;0.219). <strong>Anterior basal ganglia:</strong> &minus;0.013 (&minus;0.147 to 0.116) &mdash; <strong style={{ color: 'var(--red-deep)' }}>no benefit</strong>.<br />Death by 30 d 9.3% vs 18.0%. Postoperative rebleeding with deterioration in 5 patients (3.3%).</td>
                    <td><span style={{ color: '#166534' }}>The one positive supratentorial evacuation trial &mdash; and its effect lives entirely in the <strong>lobar</strong> stratum.</span> Because enrolment adapted away from deep bleeds, the basal ganglia estimate is small and imprecise: read it as <strong>&ldquo;not shown to help,&rdquo;</strong> and do not extend ENRICH to thalamic or posterior basal ganglia clots, which were never enrolled.</td>
                  </tr>
                  <tr>
                    <td><strong>MISTIE III</strong><br />(Lancet 2019; PMID: 30739747)<br />Stereotactic catheter aspiration plus alteplase 1.0 mg q8h, up to 9 doses</td>
                    <td>n=506 randomised / 499 modified ITT, 78 hospitals. Spontaneous supratentorial ICH <strong>&ge;30 mL</strong> with a documented stability CT before instrumentation. Explicit surgical goal: reduce the clot to <strong>&le;15 mL</strong>.</td>
                    <td>mRS 0&ndash;3 at <strong>365 days</strong>: <strong>45% vs 41%</strong>; <strong style={{ color: 'var(--red-deep)' }}>adjusted risk difference 4% (95% CI &minus;4 to 12), p=0.33 &mdash; NEUTRAL</strong>.<br />Mortality: 7 d 1% vs 4% (p=0.02); 30 d 9% vs 15% (p=0.07). Symptomatic bleeding 2% vs 1% (p=0.33); brain bacterial infection 1% vs 0% (p=0.16).</td>
                    <td>Never quote MISTIE III as a positive trial. Its lasting contribution is the <strong>dose idea</strong>: within the surgical arm (n=242), reaching <strong>&le;15 mL end-of-treatment volume or &ge;70% reduction</strong> tracked with mRS 0&ndash;3, whereas mortality benefit appeared at only <strong>&le;30 mL or &gt;53% reduction</strong> (PMID: 30891610). Misses clustered with irregular clots, protocol deviations, catheter problems and low site volume.</td>
                  </tr>
                </tbody>
              </table>
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
                  <br />&bull; <strong>More severe survivors:</strong> mRS 5 in 17% vs 9% &mdash; RR 1.99 (95% CI 1.22&ndash;3.26), p=0.007. Deaths were converted into bedbound survivors, not into independence.
                  <br />&bull; <strong>Safety favoured alteplase:</strong> ventriculitis 7% vs 12% (RR 0.55, 0.31&ndash;0.97, p=0.048); serious adverse events 46% vs 60% (RR 0.76, 0.64&ndash;0.90, p=0.002); symptomatic bleeding 2% vs 2%.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What to Do Tonight</strong>
                  <br />&bull; <strong>The EVD, not the lytic, is the indicated intervention</strong> for IVH with obstructive hydrocephalus or a falling level of consciousness. Every CLEAR III patient already had one before randomisation.
                  <br />&bull; Reserve intraventricular alteplase for a catheter that will not stay patent or a clot burden that blocks CSF diversion &mdash; and consent it as a <strong>survival-not-function</strong> intervention.
                  <br />&bull; Anticipate the second failure mode: re-obstruction after the drain is clamped. Keep a low threshold to re-image before weaning.
                </div>
              </div>
            </CardSection>

            {/* §4 Posterior fossa rules and decompressive craniectomy (amber) */}
            <CardSection color="amber" title="4. Posterior Fossa &amp; Decompressive Craniectomy &mdash; Where Non-Randomized Evidence Still Rules">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Cerebellar ICH &mdash; the one Class 1 surgical recommendation</strong>
                  <br />&bull; <strong>Trigger to operate</strong> (2022 AHA/ASA ICH guideline; PMID: 35579034): neurological deterioration, brainstem compression, or hydrocephalus from fourth-ventricular obstruction &rarr; <strong>immediate suboccipital decompression</strong>. This has never been randomised and never will be; the recommendation rests on non-randomised data and mechanism.
                  <br />&bull; <strong>Why an EVD alone is a trap:</strong> draining supratentorial CSF across an obstructed fourth ventricle widens the pressure gradient and can drive <strong>upward transtentorial herniation</strong>. If you place one, place it with the OR already booked &mdash; not instead of it.
                  <br />&bull; <strong>The honest data</strong> (Kuramatsu, JAMA 2019; PMID: 31593272): individual-participant meta-analysis of 4 observational cohorts, 578 cerebellar ICH, propensity-matched 152 vs 152. Evacuation was <strong style={{ color: 'var(--red-deep)' }}>not</strong> associated with better mRS 0&ndash;3 at 3 months (30.9% vs 35.5%; adjusted OR 0.94, 95% CI 0.81&ndash;1.09, p=0.43) but was associated with survival (78.3% vs 61.2%; adjusted OR 1.25, 1.07&ndash;1.45, p=0.005; 12-month survival 71.7% vs 57.2%). <strong>Volume cuts both ways:</strong> at <strong>&le;12 cm&sup3;</strong> surgery was associated with a <em>lower</em> chance of favourable outcome (30.6% vs 62.3%, p=0.003); at <strong>&ge;15 cm&sup3;</strong> with greater survival (74.5% vs 45.1%, p&lt;0.001). Small cerebellar clots in an awake patient do not go to the OR.
                </div>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>SWITCH (Lancet 2024; PMID: 38761811) &mdash; craniectomy for deep ICH</strong>
                  <br />&bull; <strong>Design:</strong> 42 centres in 9 countries. Age 18&ndash;75 with severe basal ganglia or thalamic ICH; decompressive craniectomy plus best medical treatment vs best medical treatment alone. 201 randomised, 197 analysed. Median age 61 (IQR 51&ndash;68), median haematoma volume <strong>57 mL</strong> (IQR 44&ndash;74). <strong>Stopped early for lack of funding.</strong>
                  <br />&bull; <strong>Primary outcome (mRS 5&ndash;6 at 180 d):</strong> 42 (44%) of 95 in the craniectomy arm vs 55 (58%) in the medical arm &mdash; <strong style={{ color: 'var(--amber-deep)' }}>adjusted RR 0.77 (95% CI 0.59&ndash;1.01), adjusted risk difference &minus;13% (95% CI &minus;26 to 0), p=0.057 &mdash; did not reach significance</strong>. Per-protocol 47% vs 60% (aRR 0.76, 0.58&ndash;1.00). Serious adverse events 41% vs 44%. The investigators called this <em>weak evidence</em>, and survivors in <strong>both</strong> arms were left severely disabled.
                  <br />&bull; <strong>The consent conversation differs from malignant MCA hemicraniectomy.</strong> There the trade is life for hemiparesis and hemianopia in someone who may still self-report acceptable quality of life; here the deep bleed has already destroyed internal capsule and thalamus, so the realistic best case is survival at mRS 4&ndash;5. Frame it as <strong>&ldquo;we may be able to prevent death; we cannot promise independence&rdquo;</strong> and elicit the patient&rsquo;s previously stated values before booking.
                </div>
              </div>
            </CardSection>

            {/* §5 Integrated bedside decision table, sequencing, and family language (teal) */}
            <CardSection color="teal" title="5. Integrated Decision Table, Sequencing, and How to Say &ldquo;No Benefit Demonstrated&rdquo; Without Saying &ldquo;Never Operate&rdquo;">
              <table className="card-table" style={{ margin: '2px 0 4px 0', fontSize: '6.4pt' }}>
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
                    <td>Any fall in GCS, brainstem compression, or 4th-ventricle obstruction (&ge;15 mL is an observational cutoff, not a guideline trigger)</td>
                    <td>Suboccipital craniectomy with evacuation, &plusmn; EVD placed <em>at the same sitting</em></td>
                    <td>Guideline COR 1 for deterioration / compression / hydrocephalus (PMID: 35579034); volume cutoffs observational only (PMID: 31593272)</td>
                    <td>&le;12 mL and awake &rarr; observe; surgery was associated with <em>worse</em> function at that size. Reverse anticoagulation immediately &mdash; do not wait on the INR before calling the OR.</td>
                  </tr>
                  <tr>
                    <td><strong>Lobar supratentorial</strong></td>
                    <td>30&ndash;80 mL presenting &lt;24 h from last known well</td>
                    <td>Minimally invasive parafascicular evacuation, targeting maximal clot removal</td>
                    <td><span style={{ color: '#166534' }}>RCT-positive (ENRICH, PMID: 38598795)</span></td>
                    <td>Requires a trained team with tubular-retractor capability. Craniotomy for the same anatomy was neutral (STICH II). Rebleed with deterioration 3.3%.</td>
                  </tr>
                  <tr>
                    <td><strong>Anterior basal ganglia</strong></td>
                    <td>30&ndash;80 mL</td>
                    <td>Evacuation not supported; medical bundle plus neurocritical care</td>
                    <td>RCT-neutral within the ENRICH stratum</td>
                    <td>Estimate is imprecise because adaptive enrolment closed this stratum early. &ldquo;Not shown to help&rdquo; is not the same as &ldquo;proven harmful.&rdquo;</td>
                  </tr>
                  <tr>
                    <td><strong>Deep, herniating</strong></td>
                    <td>Large deep ICH (SWITCH median 57 mL), age &le;75, refractory mass effect</td>
                    <td>Decompressive craniectomy without evacuation</td>
                    <td>Primary endpoint missed (p=0.057); trial stopped early</td>
                    <td>Survival-focused only. Age &gt;75 was outside SWITCH. Expect mRS 4&ndash;5 survivorship &mdash; document a goals-of-care conversation before consent.</td>
                  </tr>
                  <tr>
                    <td><strong>IVH &plusmn; hydrocephalus</strong></td>
                    <td>3rd or 4th ventricular casting with declining GCS</td>
                    <td>EVD first; intraventricular alteplase optional, not standard</td>
                    <td>RCT-neutral on function (CLEAR III, PMID: 28081952)</td>
                    <td>Lower death (HR 0.60) but more mRS 5 (RR 1.99). Parenchymal ICH must be &lt;30 mL and stable to mirror trial conditions.</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)' }}>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Sequencing &mdash; nothing waits for the surgeon</strong>
                  <br />&bull; <strong>Reversal is the first move</strong> in every anticoagulated ICH, whether or not an operation follows; a patient who is not corrected cannot safely be evacuated.
                  <br />&bull; Run the INTERACT3 bundle in parallel (PMID: 37245517): SBP target &lt;140 mmHg, INR &lt;1.5, plus glucose and temperature protocols, all started within 1 h &mdash; common OR for poor functional outcome 0.86 (95% CI 0.76&ndash;0.97), p=0.015 across 7036 patients.
                  <br />&bull; Get the stability CT. MISTIE III required documented stability before instrumenting the clot; an expanding hematoma is a reason to re-image, not to rush the corridor.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Fellow&rsquo;s trial-eligibility drill &amp; script</strong>
                  <br />&bull; Ask of every ICH on the list: <em>would this patient have met ENRICH (lobar, 30&ndash;80 mL, &lt;24 h) or MISTIE III (&ge;30 mL, stable) criteria?</em> If neither, you are outside the evidence &mdash; say so out loud on rounds.
                  <br />&bull; <strong>Language that is accurate without being nihilistic:</strong> &ldquo;Randomised trials have not shown that removing a clot in this location improves recovery. That is different from saying surgery can never help &mdash; it means we have no evidence it will, so we would be operating on hope rather than data.&rdquo;
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Post-Thrombectomy Blood Pressure Guardrail, Device and First-Pass Strategy, and Three Randomized Trial Reversals" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Post-Reperfusion BP Guardrail */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--red)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: POST-mTICI 2b/3 BP GUARDRAIL</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" />
        <text x="8" y="12" fill="#b91c1c" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">HARM ZONE: SBP &lt;120 mmHg &times; 72 h</text>
        <text x="8" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ENCHANTED2/MT stopped early &bull; worse 90-d mRS shift</text>
        <text x="8" y="31" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">common OR 1.37 (95% CI 1.07&ndash;1.76) for poor outcome</text>

        <rect x="0" y="38" width="222" height="34" rx="3" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" />
        <text x="8" y="50" fill="#b91c1c" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">HARM ZONE: SBP &lt;140 mmHg &times; 24 h</text>
        <text x="8" y="60" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">OPTIMAL-BP stopped early &bull; mRS 0&ndash;2: 39.4% vs 54.4%</text>
        <text x="8" y="69" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">adj OR 0.56 (0.33&ndash;0.96) &bull; sICH identical (9.0% vs 8.1%)</text>

        <rect x="0" y="76" width="222" height="38" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
        <text x="8" y="88" fill="#166534" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">DEFAULT ORDER: 140&ndash;180 mmHg, ceiling &le;180/105</text>
        <text x="8" y="98" fill="var(--ink)" fontSize="4.4pt" fontFamily="IBM Plex Sans">&bull; Write a FLOOR as well as a ceiling &bull; no target &lt;140</text>
        <text x="8" y="108" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">&bull; Two RCTs halted for harm; none show benefit of tighter control</text>
      </g>

      {/* Panel B: Device Strategy and First-Pass */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: DEVICE STRATEGY &amp; FIRST PASS</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="12" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">First-Pass Effect (NASA registry, n=354)</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">FPE in 25.1% &bull; mRS 0&ndash;2 61.3% vs 35.3% (OR 1.7, 1.1&ndash;2.7)</text>
        <text x="6" y="31" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Observational quality metric &mdash; NOT a randomized effect</text>

        <rect x="0" y="38" width="222" height="34" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="50" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Aspiration vs Stent Retriever: a Tie</text>
        <text x="6" y="60" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">ASTER mTICI 2b/3 85.4% vs 83.1% (OR 1.20, 0.68&ndash;2.10)</text>
        <text x="6" y="69" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">COMPASS mRS 0&ndash;2 52% vs 50% &bull; non-inferior (p=0.0014)</text>

        <rect x="0" y="76" width="222" height="38" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="88" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">Combined Technique (ASTER2): Primary Neutral</text>
        <text x="6" y="98" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Final eTICI 2c/3 64.5% vs 57.9%; adj OR 1.33 (0.88&ndash;1.99), P=.17</text>
        <text x="6" y="108" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Advantage present only after the FIRST assigned intervention</text>
      </g>

      {/* Panel C: Three Randomized Reversals */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: THREE RANDOMIZED REVERSALS</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="34" rx="3" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" />
        <text x="6" y="12" fill="#b91c1c" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">PROTECT-MT: Balloon Guide Catheter WORSE</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">n=329, terminated early &bull; adj common OR 0.66 (0.45&ndash;0.98)</text>
        <text x="6" y="31" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">90-d death 24% vs 16% &bull; sICH not different</text>

        <rect x="0" y="38" width="221" height="34" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="50" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">ANGEL-REBOOT: Bailout Angioplasty/Stent NEUTRAL</text>
        <text x="6" y="60" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">n=348 &bull; common OR 0.86 (0.59&ndash;1.24), p=0.41</text>
        <text x="6" y="69" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">sICH 5% vs 1% &bull; arterial dissection 14% vs 3%</text>

        <rect x="0" y="76" width="221" height="38" rx="3" fill="var(--fill-soft)" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="88" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">RESCUE BT: Pre-EVT IV Tirofiban NEUTRAL</text>
        <text x="6" y="98" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">n=948 &bull; adj common OR 1.08 (0.86&ndash;1.36) for 90-d mRS</text>
        <text x="6" y="108" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">sICH 9.7% vs 6.4% (diff 3.3%, 95% CI &minus;0.2% to 6.8%)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Post-reperfusion blood pressure (red) */}
            <CardSection color="red" title="1. Post-Reperfusion Blood Pressure &mdash; The Single Most Common Post-EVT Order-Set Error">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>ENCHANTED2/MT &mdash; Intensive Lowering Is Harmful</strong>
                  <br />&bull; <strong>Design (Lancet 2022; PMID: 36341753):</strong> 821 patients at 44 Chinese centres with SBP &ge;140 mmHg persisting after successful EVT reperfusion; SBP target &lt;120 vs 140&ndash;180 mmHg, achieved within 1 h and held 72 h.
                  <br />&bull; <strong>Result &mdash; NEGATIVE for intensive:</strong> greater likelihood of poor 90-d functional outcome (common OR <strong>1.37; 95% CI 1.07&ndash;1.76</strong>). Stopped early for efficacy and safety concerns.
                  <br />&bull; More early neurological deterioration (cOR 1.53; 1.18&ndash;1.97) and major disability at 90 d (OR 2.07; 1.47&ndash;2.93). <strong>No difference in sICH</strong> &mdash; the harm is hypoperfusion, not bleeding.
                </div>

                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>OPTIMAL-BP &mdash; Even &lt;140 mmHg Is Harmful</strong>
                  <br />&bull; <strong>Design (JAMA 2023; PMID: 37668619):</strong> 306 patients at 19 Korean centres with mTICI &ge;2b; SBP &lt;140 vs 140&ndash;180 mmHg for 24 h. Halted early by the DSMB for safety.
                  <br />&bull; <strong>Result &mdash; NEGATIVE for intensive:</strong> functional independence (mRS 0&ndash;2) at 3 months <strong>39.4% vs 54.4%</strong>; risk difference &minus;15.1% (95% CI &minus;26.2% to &minus;3.9%); adjusted OR 0.56 (0.33&ndash;0.96), P=.03.
                  <br />&bull; sICH 9.0% vs 8.1% (adj OR 1.10; 0.48&ndash;2.53) and stroke-related death 7.7% vs 5.4% &mdash; again, no bleeding signal to justify the tighter target.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The Two Supporting Neutrals</strong>
                  <br />&bull; <strong>BP-TARGET (Lancet Neurol 2021; PMID: 33647246):</strong> 324 patients, SBP 100&ndash;129 vs 130&ndash;185 mmHg &times; 24 h. Radiographic intraparenchymal haemorrhage 42% vs 43% (adj OR 0.96; 0.60&ndash;1.51; p=0.84) &mdash; <strong>tighter BP did not reduce bleeding.</strong>
                  <br />&bull; <strong>BEST-II (JAMA 2023; PMID: 37668620):</strong> 120 patients, SBP &lt;140 vs &lt;160 vs &le;180 mmHg. Futility boundaries were not crossed, but the predicted probability that a future trial of a lower target would succeed was only <strong>25% (&lt;140) and 14% (&lt;160)</strong>.
                </div>
              </div>

              <div style={{ marginTop: '6px', borderLeft: '4px solid var(--red)', background: 'var(--red-soft)', padding: '5px 8px', borderRadius: '4px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink)' }}>
                <strong style={{ color: 'var(--red-deep)' }}>WRITE THE ORDER LIKE THIS.</strong> After <strong>mTICI &ge;2b</strong>: hold SBP under a hard ceiling of <strong>&le;180/105 mmHg</strong>, and <strong>do not target SBP &lt;140 mmHg</strong> &mdash; the AHA/ASA 2026 AIS guideline designates an intensive target of &lt;140 mmHg for the first 72 h after successful anterior-circulation recanalisation as <strong>Class III (Harm)</strong> (PMID: 41582814). The working <strong>140&ndash;180 mmHg</strong> band that follows from those two bounds is precisely the comparator arm both harm trials used. <strong>Specify a floor, not only a ceiling</strong> &mdash; an order reading &quot;SBP &lt;140&quot; reproduces the OPTIMAL-BP intervention arm. Treat only above the ceiling, use a titratable IV agent, and avoid precipitous drops.
                <br /><strong style={{ color: 'var(--red-deep)' }}>INCOMPLETE REPERFUSION (mTICI 0&ndash;2a) IS A DIFFERENT PROBLEM.</strong> ENCHANTED2/MT and OPTIMAL-BP both <em>required</em> successful reperfusion, so their harm signal does not transfer. With persistent occlusion the distal territory remains collateral-dependent and pressure-passive; no RCT defines a target here. Individualise, keep the &le;180/105 ceiling, and do not extrapolate either direction as if it were evidence.
              </div>
            </CardSection>

            {/* §2 Anesthesia (purple) */}
            <CardSection color="purple" title="2. Anesthesia: The Mediator of Harm Is Induction Hypotension, Not the Airway">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>6.3% of sedation patients converted to GA intra-procedurally. Plan the airway before the groin, not after the patient moves.</td>
                  </tr>
                  <tr>
                    <td><strong>GASS</strong><br />Anesthesiology 2022<br />PMID: 35226737</td>
                    <td>Multicentre France, 351 randomised / 345 analysed, <strong>BP protocolised in both arms</strong></td>
                    <td><strong>NEUTRAL.</strong> mRS &le;2 at 3 months 36% (sedation) vs 40% (GA); relative risk 0.91 (95% CI 0.69&ndash;1.19), P=0.474.</td>
                    <td>GA added 19 min onset-to-puncture but onset-to-recanalisation was unchanged; recanalisation success 85% vs 75% (P=0.021). With BP control enforced, GA carries no penalty.</td>
                  </tr>
                  <tr>
                    <td><strong>IPD meta-analysis</strong><br />JAMA 2019<br />PMID: 31573636</td>
                    <td>368 patients pooled from the 3 single-centre RCTs (183 GA / 185 sedation)</td>
                    <td><strong>FAVOURS GA:</strong> 3-month mRS common OR 1.58 (95% CI 1.09&ndash;2.29), P=.02. Authors caution the trials were single-centre and disability was primary in only one.</td>
                    <td><strong>The signal to act on:</strong> hypotension (SBP fall &gt;20% from baseline) 80.8% vs 53.1% (OR 4.26; 2.55&ndash;7.09) and BP variability 79.7% vs 62.3% (OR 2.42; 1.49&ndash;3.93).</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '4px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--purple-deep)' }}>Hemodynamic floor for the case:</strong> the operational alarm used across these trials is a <strong>&gt;20% fall in SBP from baseline</strong> &mdash; announce it to anesthesia before induction, run a vasopressor drip ready rather than reactive, and keep pre-reperfusion pressure at or near the presenting value (the &quot;do not go low&quot; trials apply only <em>after</em> reperfusion). <strong>Choose GA when</strong> the airway is unprotectable, there is agitation or vomiting, posterior-circulation or basilar occlusion with depressed consciousness, or anticipated long/complex access; <strong>choose sedation when</strong> the patient is cooperative and door-to-groin would be delayed by anesthesia availability. Either choice is defensible; an uncontrolled induction is not.
              </div>
            </CardSection>

            {/* §3 Device strategy and pass counts (teal) */}
            <CardSection color="teal" title="3. Device Strategy, First-Pass Effect &amp; Knowing When to Stop">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Aspiration vs Stent Retriever: Equivalent</strong>
                  <br />&bull; <strong>ASTER (JAMA 2017; PMID: 28763550):</strong> 381 patients, 8 French centres. Final mTICI 2b/3 <strong>85.4% vs 83.1%</strong> (OR 1.20; 95% CI 0.68&ndash;2.10; P=.53). No difference in 24-h NIHSS, 90-d mRS or adverse events.
                  <br />&bull; <strong>COMPASS (Lancet 2019; PMID: 30860055):</strong> 270 patients, non-inferiority design. mRS 0&ndash;2 at 90 d <strong>52% vs 50%</strong> (p=0.0014 for non-inferiority, margin 0.15). ICH 36% vs 34%; mortality 22% in both arms.
                  <br />&bull; <strong>Read:</strong> first-line technique is operator preference and clot/anatomy fit &mdash; not a quality metric.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Combined Aspiration + Stent Retriever</strong>
                  <br />&bull; <strong>ASTER2 (JAMA 2021; PMID: 34581737):</strong> 408 randomised, 405 analysed. Primary endpoint (final eTICI 2c/3) <strong>64.5% vs 57.9%</strong>; risk difference 6.6% (95% CI &minus;3.0% to 16.2%); adj OR 1.33 (0.88&ndash;1.99), <strong>P=.17 &mdash; not significant</strong>. 12 of 14 secondary endpoints were also neutral.
                  <br />&bull; The combined technique <em>did</em> outperform after the assigned first intervention alone (eTICI 2b50/2c/3 86.2% vs 72.3%; adj OR 2.54; 1.51&ndash;4.28) &mdash; i.e. it buys earlier reperfusion, which rescue passes then erase by the end of the case.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>First Pass, Pass Count &amp; Futile Recanalisation</strong>
                  <br />&bull; <strong>First-pass effect (Stroke 2018; PMID: 29459390):</strong> NASA registry, 354 patients; complete recanalisation on one pass in <strong>25.1%</strong>, with mRS 0&ndash;2 61.3% vs 35.3% (OR 1.7; 95% CI 1.1&ndash;2.7; P=.013) and median revascularisation time 34 vs 60 min.
                  <br />&bull; <strong>Caveat:</strong> this is a registry <em>association</em>, useful as a QI benchmark &mdash; it does not license any device claim (see PROTECT-MT, &sect;4).
                  <br />&bull; <strong>Stopping (consensus, not RCT):</strong> no trial defines a maximum pass count. Change the technique rather than repeat it after roughly 3 failed passes, and weigh futile recanalisation &mdash; a perfect angiogram over a completed infarct does not help the patient.
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
                  <br />&bull; <strong>Epistemics lesson:</strong> the registry linking balloon guides to first-pass success (64.0% vs 34.7% in the NASA cohort) was an association with an <em>angiographic surrogate</em>. The randomised test of the same device found worse patient outcomes. Surrogate-driven &quot;best practice&quot; deserves the same scepticism as a drug claim.
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
                  <br />&bull; <strong>Where this leaves ICAD-related occlusion:</strong> if no stent is placed, there is no randomised support for routine glycoprotein IIb/IIIa loading. If a stent <em>is</em> deployed the patient is committed to dual antiplatelet therapy in a freshly infarcted, potentially haemorrhagic brain &mdash; an unavoidable, untested trade-off. Decide before deploying, not after, and document the plan in the operative note.
                </div>
              </div>
            </CardSection>

            {/* §5 First 24 hours and handoff (red) */}
            <CardSection color="red" title="5. The First 24 Hours: Complications, Re-Imaging Triggers &amp; the Angio-Suite Handoff Script">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Periprocedural Complications to Hunt For</strong>
                  <br />&bull; <strong>Access site:</strong> femoral haematoma, retroperitoneal bleed (unexplained hypotension/tachycardia + flank pain), pseudoaneurysm; radial access shifts the risk to forearm haematoma and radial occlusion. Check the site and distal pulses at every neuro check.
                  <br />&bull; <strong>Vessel perforation / post-EVT subarachnoid blood:</strong> suspect with abrupt intraprocedural pressure change, new headache or vomiting; cortical SAH along the treated sulci is common and usually benign, but perforation-related SAH is not.
                  <br />&bull; <strong>Embolisation to new territory:</strong> a deficit that does not match the treated vascular territory &mdash; re-image rather than attribute it to sedation.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Imaging, Staining vs Blood, and the Order Set</strong>
                  <br />&bull; <strong>Routine:</strong> non-contrast CT at ~24 h before starting or restarting antithrombotics; image immediately for any NIHSS worsening &ge;4, new headache, vomiting, or acute hypertension.
                  <br />&bull; <strong>Contrast staining vs haemorrhage:</strong> dual-energy CT separates the two. In a single-centre retrospective series of 39 post-EVT patients (PMID: 35960327), parenchymal hyperdensity appeared in 17/39 (44%) and was read as haemorrhage in 9 (53%), pure contrast staining in 8 (47%) and a mixture in 6 (35%); DECT sensitivity 90%, specificity 100%, accuracy 95%, with inter-reader &kappa; 1.00 vs 0.51 for standard mixed images. Small and retrospective &mdash; a tie-breaker, not a licence to withhold repeat imaging.
                  <br />&bull; <strong>Also standing:</strong> BP order with a floor and a ceiling; glucose and temperature normalisation; NPO until the dysphagia screen (AHA/ASA 2026 AIS guideline, PMID: 41582814). Neuro-check cadence (q15min &times;2 h, q30min &times;6 h, then hourly) is carried over from post-thrombolysis monitoring convention, not from an EVT trial.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Handoff Script &mdash; Angio Suite to Neuro-ICU</strong>
                  <br />The BP and antithrombotic plan survives the transfer only if the interventionalist says all eight aloud:
                  <br />&bull; <strong>1.</strong> Final <strong>mTICI/eTICI grade</strong> and which vessel remains occluded.
                  <br />&bull; <strong>2.</strong> Number of passes and technique used.
                  <br />&bull; <strong>3.</strong> <strong>Stent deployed? Yes/No</strong> &mdash; and if yes, which antiplatelet, what dose, at what time.
                  <br />&bull; <strong>4.</strong> Anesthesia type and the <strong>lowest intraprocedural SBP</strong>.
                  <br />&bull; <strong>5.</strong> Explicit BP order with <strong>both bounds</strong> (e.g. &quot;keep SBP 140&ndash;180&quot;), not a ceiling alone.
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Intracranial Atherosclerosis: Stroke Mechanisms, Randomized Trial Ledger, and the SAMMPRIS Aggressive Medical Bundle" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Mechanism drives the order set */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: MECHANISM DRIVES THE ORDERS</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="28" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="7" y="10" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">1. Artery-to-Artery Embolism</text>
        <text x="7" y="19" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Scattered distal cortical + borderzone DWI dots downstream of plaque</text>
        <text x="7" y="26" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&rarr; DAPT 90d + high-intensity statin; treat BP to target</text>

        <rect x="0" y="31" width="222" height="28" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="7" y="41" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">2. Branch Atheromatous / Perforator Occlusion</text>
        <text x="7" y="50" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Single deep infarct abutting the parent artery; ostial plaque covers the perforator</text>
        <text x="7" y="57" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&rarr; Highest early-fluctuation risk; stent snowplows the perforator ostium</text>

        <rect x="0" y="62" width="222" height="28" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="7" y="72" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">3. Hemodynamic Borderzone Failure</text>
        <text x="7" y="81" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Internal borderzone &quot;rosary beads&quot;; deficits with upright posture or BP dips</text>
        <text x="7" y="88" fill="var(--amber-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&rarr; Still lower BP &mdash; but taper deliberately, not abruptly (PMID 17515467)</text>

        <rect x="0" y="93" width="222" height="25" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="7" y="103" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">4. Mixed &mdash; the most common pattern</text>
        <text x="7" y="112" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">32.7% of symptomatic ICAD on multiparametric MRI (PMID 40375586)</text>
      </g>

      {/* Panel B: Randomized trial ledger */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: TRIAL LEDGER &mdash; READ THE DIRECTION</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="27" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="10" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">WASID (NEJM 2005; PMID 15800226) &bull; n=569</text>
        <text x="6" y="18" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Warfarin vs aspirin 1300 mg: endpoint 21.8% vs 22.1% (HR 1.04)</text>
        <text x="6" y="25" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">NO benefit; warfarin doubled death &amp; major hemorrhage &rarr; stopped early</text>

        <rect x="0" y="30" width="222" height="29" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="40" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SAMMPRIS (NEJM 2011; PMID 21899409) &bull; n=451</text>
        <text x="6" y="48" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Wingspan PTAS + medical vs medical alone, 70&ndash;99% stenosis</text>
        <text x="6" y="56" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">STENTING WORSE: 30-d stroke/death 14.7% vs 5.8% (p=0.002)</text>

        <rect x="0" y="62" width="222" height="27" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="72" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">CASSISS (JAMA 2022; PMID 35943472) &bull; n=358</text>
        <text x="6" y="80" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Expert operators, &ge;3 wk from symptoms, non-perforator territory</text>
        <text x="6" y="87" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">NEUTRAL: 1-y 8.0% vs 7.2%; HR 1.10 (0.52&ndash;2.35) &rarr; selection did not rescue it</text>

        <rect x="0" y="92" width="222" height="26" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="102" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">CMOSS (JAMA 2023; PMID 37606672) &bull; n=324</text>
        <text x="6" y="110" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">EC-IC bypass NEGATIVE: 8.6% vs 12.3%; HR 0.71 (0.33&ndash;1.54); p=0.39</text>
      </g>

      {/* Panel C: The bundle that actually won */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: THE SAMMPRIS MEDICAL BUNDLE</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="22" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="7" y="9" fill="var(--purple-deep)" fontSize="4.9pt" fontFamily="Outfit" fontWeight="800">1. ASA 325 mg + Clopidogrel 75 mg &times; 90 days</text>
        <text x="7" y="18" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Then aspirin alone &bull; CASSISS used the same 90-day window</text>

        <rect x="0" y="24" width="221" height="22" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="7" y="33" fill="var(--teal-deep)" fontSize="4.9pt" fontFamily="Outfit" fontWeight="800">2. SBP target &lt;140 mmHg (&lt;130 if diabetic)</text>
        <text x="7" y="42" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Higher BP predicted MORE stroke, not less (PMID 17515467)</text>

        <rect x="0" y="48" width="221" height="22" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="7" y="57" fill="#1d4ed8" fontSize="4.9pt" fontFamily="Outfit" fontWeight="800">3. LDL &lt;70 mg/dL &mdash; rosuvastatin provided in-trial</text>
        <text x="7" y="66" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Add ezetimibe &plusmn; PCSK9i if not at goal</text>

        <rect x="0" y="72" width="221" height="22" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="7" y="81" fill="var(--amber-deep)" fontSize="4.9pt" fontFamily="Outfit" fontWeight="800">4. Diabetes, non-HDL, smoking, weight</text>
        <text x="7" y="90" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Protocolized secondary risk-factor targets</text>

        <rect x="0" y="96" width="221" height="22" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="7" y="105" fill="#166534" fontSize="4.9pt" fontFamily="Outfit" fontWeight="800">5. Lifestyle coaching &amp; physical activity</text>
        <text x="7" y="114" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Strongest predictor of good outcome: OR 0.6 (0.4&ndash;0.8) &bull; PMID 28003500</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Mechanism first (teal) */}
            <CardSection color="teal" title="1. Mechanism First &mdash; Name It Before You Write the Orders">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '7px', fontSize: '6.9pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Artery-to-Artery Embolism</strong>
                  <br />&bull; <strong>Tell:</strong> multiple scattered cortical/subcortical DWI lesions in one territory downstream of the plaque.
                  <br />&bull; <strong>Changes:</strong> DAPT 90 days + high-intensity statin; treat BP to target without hesitation.
                </div>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.4pt' }}>Branch Atheromatous Disease</strong>
                  <br />&bull; <strong>Tell:</strong> a single deep infarct extending to the surface of the parent artery (MCA M1, basilar) &mdash; plaque covers the perforator ostium.
                  <br />&bull; <strong>Changes:</strong> expect early fluctuation; this is the phenotype most injured by stenting (perforator snowplow).
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.4pt' }}>Hemodynamic Borderzone Failure</strong>
                  <br />&bull; <strong>Tell:</strong> internal borderzone &quot;rosary bead&quot; infarcts; limb-shaking TIA; deficits reproduced by sitting up or by a BP dip.
                  <br />&bull; <strong>Changes:</strong> the only mechanism where BP lowering is staged rather than rushed &mdash; see &sect;3.
                </div>
                <div style={{ border: '1.5px dashed var(--rule)', borderRadius: '5px', padding: '5px 6px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Mixed &mdash; Assume This by Default</strong>
                  <br />&bull; Mixed mechanism was the single most common subtype (32.7%) in 217 symptomatic ICAD patients phenotyped with vessel-wall MRI plus perfusion (PMID 40375586).
                  <br />&bull; Do not force one label; treat the dominant one and cover the rest.
                </div>
              </div>
            </CardSection>

            {/* §2 Trial ledger (purple) */}
            <CardSection color="purple" title="2. The Randomized Ledger &mdash; Antithrombotics and Stenting">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.4pt' }}>
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
                    <td><strong style={{ color: 'var(--red-deep)' }}>Neutral for efficacy, harmful for safety.</strong> Primary endpoint 21.8% warfarin vs 22.1% aspirin (HR 1.04; 95% CI 0.73&ndash;1.48; p=0.83). Warfarin: death 9.7% vs 4.3% (p=0.02), major hemorrhage 8.3% vs 3.2% (p=0.01). Enrollment stopped for safety. <strong>Aspirin, not warfarin.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>WASID High-Risk Phenotype</strong><br />Circulation 2006;113:555<br />PMID: 16432056</td>
                    <td>Same cohort, mean follow-up 1.8 y. Prespecified search for the group worth randomizing to stenting.</td>
                    <td>106/569 (19.0%) had recurrent ischemic stroke; 77 (73%) were in the stenotic artery&rsquo;s territory. Risk highest with stenosis <strong>&ge;70%</strong> (HR 2.03; 95% CI 1.29&ndash;3.22; p=0.0025) and enrollment <strong>&le;17 days</strong> after the qualifying event (HR 1.69; 95% CI 1.06&ndash;2.72; p=0.028). <strong>This defined the 70&ndash;99% target group every later trial enrolled.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>SAMMPRIS</strong><br />NEJM 2011;365:993 (PMID: 21899409)<br />Lancet 2014;383:333 (PMID: 24168957)</td>
                    <td>451 pts, 70&ndash;99% stenosis, TIA/nondisabling stroke within 30 d. Aggressive medical management &plusmn; Wingspan PTAS.</td>
                    <td><strong style={{ color: 'var(--red-deep)' }}>Stenting was worse.</strong> 30-day stroke or death 14.7% PTAS vs 5.8% medical (p=0.002); 1-year primary endpoint 20.0% vs 12.2% (p=0.009); enrollment halted. Final results at median 32.4 mo: 52/224 (23%) PTAS vs 34/227 (15%) medical (p=0.0252); any stroke 26% vs 19% (p=0.0468); major hemorrhage 13% vs 4% (p=0.0009). <strong>The winning arm was the whole bundle, not DAPT alone.</strong></td>
                  </tr>
                  <tr>
                    <td><strong>CASSISS</strong><br />JAMA 2022;328:534<br />PMID: 35943472</td>
                    <td>358 eligible pts at 8 experienced Chinese centers; 70&ndash;99% stenosis, non-perforator territory, enrolled <strong>beyond 3 weeks</strong> from the last symptom. Stenting + medical vs medical.</td>
                    <td><strong>Neutral &mdash; no benefit from stenting.</strong> 1-year stroke/death 8.0% (14/176) vs 7.2% (13/181); HR 1.10 (95% CI 0.52&ndash;2.35); p=0.82. Territory stroke at 3 y 11.3% vs 11.2%; HR 1.00 (0.53&ndash;1.90). 3-y mortality 4.4% vs 1.3% (HR 3.75; 0.77&ndash;18.13; p=0.08). <strong>Better operators and cooler timing did not rescue stenting.</strong></td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 The bundle (amber) */}
            <CardSection color="amber" title="3. The Orders You Actually Write &mdash; the SAMMPRIS Aggressive Medical Bundle">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Antithrombotics</strong>
                  <br />&bull; <strong>Aspirin 325 mg daily + clopidogrel 75 mg daily for 90 days</strong>, then aspirin alone &mdash; the exact regimen of the SAMMPRIS medical arm (PMID: 21899409). CASSISS used the identical 90-day DAPT window before dropping to a single agent.
                  <br />&bull; <strong>Never warfarin</strong> for atherosclerotic ICAD (WASID, PMID: 15800226). No anticoagulant has yet outperformed antiplatelet therapy here; CAPTIVA is actively testing low-dose rivaroxaban and ticagrelor against clopidogrel, each added to aspirin (PMID: 39862061) &mdash; results pending.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Blood Pressure &mdash; and the Real Caveat</strong>
                  <br />&bull; <strong>SAMMPRIS protocol target: SBP &lt;140 mmHg (&lt;130 mmHg in diabetics)</strong> alongside LDL &lt;70 mg/dL &mdash; these two were the trial&rsquo;s designated primary risk factors. Long-term goals follow the AHA/ASA 2021 secondary prevention guideline (PMID: 34024117).
                  <br />&bull; <strong>Permissive hypertension is not supported:</strong> in 567 WASID patients, higher mean SBP and DBP were associated with <em>more</em> ischemic stroke, including stroke in the stenotic territory (PMID: 17515467).
                  <br />&bull; <strong>The nuance is tempo, not target</strong> &mdash; in a flow-limiting lesion with borderzone symptoms, lower stepwise over days while collaterals recruit and keep the patient euvolemic and supine-tolerant.
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
                  <br />&bull; Distinguishes atherosclerotic plaque (eccentric, enhancing) from vasculitis, dissection, and RCVS &mdash; the single most common reason to order it.
                  <br />&bull; In 388 ICAD stroke patients, intraplaque hemorrhage (HR 2.55; 95% CI 1.47&ndash;4.40) and plaque enhancement ratio (HR 1.62; 95% CI 1.11&ndash;2.38) predicted recurrence (PMID: 41891365).
                  <br />&bull; <span style={{ color: 'var(--ink-mute)' }}>Observational, single-center &mdash; a &quot;high-risk plaque&quot; buys prognostic weight and urgency, not an indication to stent.</span>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Perfusion &amp; Quantitative Flow</strong>
                  <br />&bull; CTP/PWI or quantitative MRA identifies the borderzone-failure phenotype and separates it from embolic disease.
                  <br />&bull; In the same multiparametric cohort, a hypoperfusion mechanism carried the highest recurrence risk (HR 3.97; 95% CI 1.43&ndash;11.03; PMID: 40375586).
                  <br />&bull; Note the sobering counterpoint: CMOSS selected on CTP hemodynamic insufficiency and COSS on PET oxygen extraction &mdash; and neither revascularization trial was positive.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.4pt' }}>The Narrow Residual Role for Intervention</strong>
                  <br />&bull; <strong>Not first-line, ever.</strong> Discussion is confined to documented failure of the full bundle &mdash; recurrent territory events on DAPT with SBP and LDL at target &mdash; or hemodynamic symptoms with objectively proven flow failure.
                  <br />&bull; <strong>One randomized trial <em>is</em> positive &mdash; BASIS</strong> (JAMA 2024;332:1059; PMID: 39235816): submaximal balloon angioplasty + aggressive medical management vs medical alone, 501 pts; primary endpoint 4.4% vs 13.5%; HR 0.32 (95% CI 0.16&ndash;0.63); p&lt;0.001 &mdash; but open-label, all-Chinese sites, 17.4% procedural complications, 14.5% dissection, and a medical-arm event rate well above SAMMPRIS. <strong>No stenting trial has ever been positive.</strong>
                  <br />&bull; <strong>Document the conversation:</strong> quote SAMMPRIS 30-day 14.7% and CASSISS HR 1.10 to the patient before any consent.
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Unruptured Intracranial Aneurysm: Symptomatic Triage, PHASES Risk Inputs, and the Two-Column Rupture versus Treatment Ledger" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Triage before any risk score */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--red)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: IS IT ACTUALLY INCIDENTAL?</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="36" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="7" y="11" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SYMPTOMATIC = EMERGENCY, NOT SURVEILLANCE</text>
        <text x="7" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; New pupil-involving CN III palsy &rarr; PCom aneurysm until proven otherwise</text>
        <text x="7" y="28" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Sentinel / thunderclap headache &rarr; treat as warning leak; CT then LP</text>
        <text x="7" y="35" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">&rarr; Urgent CTA/DSA + neurosurgery same day. PHASES does not apply.</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="7" y="51" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">MASS EFFECT / EMBOLIC PRESENTATIONS</text>
        <text x="7" y="60" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">&bull; Cavernous ICA: CN III, IV, VI, V1 &bull; Giant aneurysm: brainstem compression</text>
        <text x="7" y="69" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">&bull; Distal TIA/infarct from intrasaccular thrombus &rarr; also an intervention discussion</text>

        <rect x="0" y="78" width="222" height="36" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="7" y="89" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">TRULY INCIDENTAL &rarr; THE COUNSELING PATHWAY</text>
        <text x="7" y="98" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Prevalence 3.2% (95% CI 1.9&ndash;5.2) without comorbidity &bull; PMID 21641282</text>
        <text x="7" y="107" fill="var(--teal-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">91% of UCAS Japan aneurysms were incidental findings &bull; PMID 22738097</text>
      </g>

      {/* Panel B: PHASES inputs */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: PHASES &mdash; SIX INPUTS, ONE NUMBER</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="36" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="11" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">P &bull; H &bull; A &mdash; who the patient is</text>
        <text x="6" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Population: Finnish 3.6&times; and Japanese 2.8&times; vs N. America / other Europe</text>
        <text x="6" y="28" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Hypertension: present or absent &bull; Age: threshold at 70 years</text>
        <text x="6" y="35" fill="var(--ink-soft)" fontSize="4.1pt" fontFamily="IBM Plex Sans">Same UIA prevalence in Finland/Japan &rarr; higher rupture risk, not more aneurysms</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="51" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">S &bull; E &bull; S &mdash; what the aneurysm is</text>
        <text x="6" y="60" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Size bands &lt;7 / 7&ndash;9.9 / 10&ndash;19.9 / &ge;20 mm &bull; Earlier SAH from another aneurysm</text>
        <text x="6" y="69" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Site: ICA lowest &rarr; MCA &rarr; ACA / PCom / posterior circulation highest</text>

        <rect x="0" y="78" width="222" height="36" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="89" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">WHAT IT GENERATES (PMID 24290159)</text>
        <text x="6" y="98" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Pooled 5-y rupture risk 3.4% (2.9&ndash;4.0); spread 0.25% &rarr; &gt;15% by profile</text>
        <text x="6" y="107" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">It prices rupture only &mdash; never the risk of the operation you are proposing</text>
      </g>

      {/* Panel C: the two-column ledger */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--teal)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: THE LEDGER &mdash; BOTH COLUMNS</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="34" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="7" y="11" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">COLUMN 1 &mdash; LEAVING IT ALONE</text>
        <text x="7" y="20" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">UCAS Japan overall rupture 0.95%/yr (95% CI 0.79&ndash;1.15), n=6697 aneurysms</text>
        <text x="7" y="29" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Growth on serial imaging: 2.4%/pt-yr vs 0.2% without growth &bull; PMID 23821755</text>

        <rect x="0" y="38" width="221" height="38" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="7" y="49" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">COLUMN 2 &mdash; FIXING IT (PMID 30592482)</text>
        <text x="7" y="58" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Endovascular: 30-d complications 4.96% (4.00&ndash;6.12); case fatality 0.30%</text>
        <text x="7" y="67" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Neurosurgical: 30-d complications 8.34% (6.25&ndash;11.10); case fatality 0.10%</text>
        <text x="7" y="74" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans" fontWeight="700">114 studies, 106,433 patients &mdash; this is a one-time, front-loaded debit</text>

        <rect x="0" y="80" width="221" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="7" y="91" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">THE LEVERS THAT ALWAYS APPLY</text>
        <text x="7" y="100" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">For harboring a UIA: smoking OR 3.0 &bull; HTN OR 2.9 &bull; both OR 8.3 (4.5&ndash;15.2)</text>
        <text x="7" y="109" fill="#15803d" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">Stop smoking + control BP for every patient, treated or observed &bull; PMID 23422088</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Triage before any calculation (red) */}
            <CardSection color="red" title="1. Triage Before You Calculate &mdash; Incidental Is a Diagnosis, Not an Assumption">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>Symptomatic &rarr; Different Pathway Entirely</strong>
                  <br />&bull; <strong>New third-nerve palsy with a dilated pupil</strong> is expansion or sentinel bleeding of a PCom (or superior cerebellar) aneurysm until angiography says otherwise &mdash; secure it, do not surveil it.
                  <br />&bull; <strong>Thunderclap or sentinel headache</strong> in a patient with a known aneurysm is a warning leak until CT and CSF are negative. Reset the clock to the aSAH pathway (see <em>Aneurysmal SAH: Grading &amp; Early Management</em>).
                  <br />&bull; None of the natural-history models below were built on symptomatic aneurysms; applying PHASES here understates risk badly.
                </div>
                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Who Has One, and Who to Look For</strong>
                  <br />&bull; Pooled prevalence <strong>3.2% (95% CI 1.9&ndash;5.2)</strong> in adults without comorbidity, mean age 50 &mdash; 68 studies, 1450 aneurysms in 94,912 patients (PMID: 21641282).
                  <br />&bull; Prevalence ratios: <strong>ADPKD 6.9 (3.5&ndash;14)</strong>, family history of aneurysm or SAH <strong>3.4 (1.9&ndash;5.9)</strong>, women vs men 1.61 (1.02&ndash;2.54), rising to 2.2 (1.3&ndash;3.6) in cohorts with mean age above 50.
                  <br />&bull; Also screen the connective-tissue and arteriopathy context &mdash; see <em>Fibromuscular Dysplasia &amp; Cervical Artery Dissection</em>.
                </div>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Familial Screening &mdash; Yield and Its Limits</strong>
                  <br />&bull; With <strong>&ge;2 first-degree relatives</strong> affected by aSAH, aneurysms were found in <strong>51/458 (11%, 95% CI 9&ndash;14)</strong> at first screen, 21/261 (8%) at second, 7/128 (5%) at third, 3/63 (5%) at fourth (PMID: 24618352).
                  <br />&bull; <strong>De novo aneurysms formed after two negative screens</strong> in 5/188 (3%) &mdash; and one patient ruptured a de novo aneurysm 3 years after a negative screen. Serial screening lowers risk; it does not abolish it.
                  <br />&bull; Predictors of a positive first screen: smoking OR 2.7 (1.2&ndash;5.9), prior aneurysm OR 3.9 (1.2&ndash;12.7), familial aneurysm history OR 3.5 (1.6&ndash;8.1).
                </div>
              </div>
            </CardSection>

            {/* §2 PHASES (purple) */}
            <CardSection color="purple" title="2. PHASES &mdash; The Six Components and the 5-Year Absolute Risk They Generate" subtitle="Greving JP et al. Lancet Neurol 2014 &bull; pooled individual data, 8382 patients, 230 ruptures over 29,166 person-years &bull; PMID 24290159">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Both were independent predictors in the Cox model. Age is the component that quietly reverses the calculus in the elderly, because it raises rupture risk <em>and</em> raises operative risk at the same time.</td>
                  </tr>
                  <tr>
                    <td><strong>S</strong> &mdash; Size</td>
                    <td>Maximum diameter banded as <strong>&lt;7.0, 7.0&ndash;9.9, 10.0&ndash;19.9, and &ge;20 mm</strong>.</td>
                    <td>The dominant term. It is what separates the 0.25% profile from the &gt;15% profile below.</td>
                  </tr>
                  <tr>
                    <td><strong>E</strong> &mdash; Earlier SAH<br /><strong>S</strong> &mdash; Site</td>
                    <td>Prior SAH from a <em>different</em> aneurysm; site as ICA, MCA, or ACA / PCom / posterior circulation.</td>
                    <td>Prior SAH raises risk for the remaining aneurysm. Site risk rises ICA &rarr; MCA &rarr; ACA, PCom, and posterior circulation.</td>
                  </tr>
                  <tr>
                    <td style={{ background: 'var(--purple-soft)' }}><strong>Output</strong></td>
                    <td style={{ background: 'var(--purple-soft)' }}>5-year absolute rupture risk read off the published PHASES chart.</td>
                    <td style={{ background: 'var(--purple-soft)' }}>Pooled observed risk was <strong>1.4%/yr (95% CI 1.1&ndash;1.6)</strong> and <strong>3.4% at 5 years (2.9&ndash;4.0)</strong>. In North American / European populations the estimate ranged from <strong>0.25%</strong> (age &lt;70, no vascular risk factors, small &lt;7 mm ICA aneurysm) to <strong>more than 15%</strong> (age &ge;70, hypertension, earlier SAH, giant &gt;20 mm posterior-circulation aneurysm).</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '5px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)', borderLeft: '3px solid var(--red)', paddingLeft: '7px' }}>
                <strong style={{ color: 'var(--red-deep)' }}>Two limitations to say out loud before you quote the number.</strong> (1) <strong>PHASES estimates rupture risk only.</strong> It contains no term for procedural morbidity, so it can never by itself justify treating &mdash; the treat-versus-observe decision needs both columns of &sect;4. (2) <strong>It performs poorly in multiple aneurysms.</strong> In 701 patients with 1673 aneurysms, patient-level discrimination using the largest aneurysm&rsquo;s PHASES score gave an AUC of only <strong>0.572</strong>, falling to 0.450 once a patient had 4 or more aneurysms (PMID: 33631473). The <strong>UIATS</strong> Delphi consensus (69 specialists, 29 factors; PMID: 26276380) is a structured way to capture what PHASES omits &mdash; but it is expert agreement, not an outcome-validated predictor.
              </div>
            </CardSection>

            {/* §3 Natural history evidence (amber) */}
            <CardSection color="amber" title="3. Natural History &mdash; ISUIA, UCAS Japan, and What Growth Adds">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.4pt' }}>
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
              </table>
            </CardSection>

            {/* §4 The treatment side of the ledger (teal) */}
            <CardSection color="teal" title="4. The Other Half of the Ledger &mdash; What Repair Actually Costs">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.33', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.5pt' }}>Procedural Risk &mdash; the Number to Quote</strong>
                  <br />&bull; Meta-analysis of <strong>114 studies, 106,433 patients, 108,263 aneurysms</strong> (JAMA Neurol 2019; PMID: 30592482).
                  <br />&bull; <strong>Endovascular (74 studies):</strong> 30-day clinical complications <strong>4.96% (95% CI 4.00&ndash;6.12)</strong>; case fatality <strong>0.30% (0.20&ndash;0.40)</strong>.
                  <br />&bull; <strong>Neurosurgical (54 studies):</strong> complications <strong>8.34% (6.25&ndash;11.10)</strong>; case fatality <strong>0.10% (0.00&ndash;0.20)</strong>.
                  <br />&bull; Endovascular risk multipliers: wide neck &gt;4 mm or dome-to-neck &gt;1.5 (OR 1.71), posterior circulation (OR 1.42), stent-assisted coiling (OR 1.82), stenting (OR 3.43; 1.45&ndash;8.09).
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
                  <br />&bull; Practical framing: coiling and its variants front-load less morbidity but accept retreatment; clipping costs more up front and retreats less often. Let the aneurysm&rsquo;s neck, location, and the patient&rsquo;s age pick the tool, and refer to a high-volume operator.
                </div>
              </div>
            </CardSection>

            {/* §5 Surveillance, modifiers, and the two conversations (amber) */}
            <CardSection color="amber" title="5. Surveillance, the Modifiers the Scores Miss, and the Two Hard Conversations">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '6.9pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.4pt' }}>A Workable Surveillance Protocol</strong>
                  <br />&bull; <strong>Modality:</strong> 3D time-of-flight MRA at 3T without contrast is the default for serial follow-up &mdash; no radiation, no iodine. Reserve CTA for MR-incompatible patients, clipped constructs, and pre-procedural anatomy; DSA for treatment planning or discordant studies.
                  <br />&bull; <strong>Measure it the same way every time:</strong> same scanner, same sequence, maximum diameter plus a second orthogonal dimension. Report growth only when the change exceeds measurement error &mdash; interobserver variability, not biology, is the usual cause of a &ldquo;bigger&rdquo; aneurysm.
                  <br />&bull; <strong>Interval:</strong> a common practice is imaging at 6&ndash;12 months, then annually, extending to every 2&ndash;5 years once stable across several studies; use the ELAPSS growth estimate to lengthen or shorten. Any documented growth resets to a treatment discussion (PMID: 23821755).
                  <br />&bull; <strong>When to stop:</strong> when a positive result would no longer change management &mdash; competing life-limiting illness, or an operative risk that has risen past the projected 5-year rupture risk. Say so explicitly and stop; endless imaging of an aneurysm you will never treat is harm.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.4pt' }}>Modifiers the Scores Do Not Capture</strong>
                  <br />&bull; <strong>Irregular contour or daughter sac</strong> &mdash; HR 1.63 (1.08&ndash;2.48) in UCAS Japan (PMID: 22738097); it is in ELAPSS as &ldquo;shape&rdquo; but absent from PHASES.
                  <br />&bull; <strong>Documented interval growth</strong> &mdash; the strongest single modifier available (PMID: 23821755).
                  <br />&bull; <strong>&ge;2 first-degree relatives with aSAH</strong> &mdash; screen the family and weight the individual&rsquo;s risk upward (PMID: 24618352).
                  <br />&bull; <strong>Active smoking and hypertension</strong> &mdash; OR 3.0 (2.0&ndash;4.5) and 2.9 (1.9&ndash;4.6) for harboring an aneurysm; jointly OR 8.3 (4.5&ndash;15.2), more than additive (PMID: 23422088).
                  <br />&bull; <strong>ADPKD</strong> (prevalence ratio 6.9), and the connective-tissue / FMD context &mdash; cross-reference <em>Fibromuscular Dysplasia &amp; Cervical Artery Dissection</em>.
                  <br />&bull; <span style={{ color: 'var(--ink-mute)' }}>Formal recommendations on presentation, screening, imaging and treatment outcomes: AHA/ASA 2015 UIA guideline (PMID: 26089327).</span>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.4pt' }}>Scripts for the Two Hard Conversations</strong>
                  <br />&bull; <strong>&ldquo;Your five-year risk is under one percent.&rdquo;</strong> Give the number both ways: <em>&ldquo;About 1 in 200 over five years that it bleeds &mdash; and about 1 in 20 that fixing it causes a complication today.&rdquo;</em> Name the asymmetry: rupture risk accrues slowly and can be re-measured; procedural risk is paid once, immediately, and cannot be returned. Then give them the two things that genuinely lower risk: <strong>stop smoking and control blood pressure</strong>. Close with a concrete plan and a scan date &mdash; surveillance is an active decision, not a deferral.
                  <br />&bull; <strong>&ldquo;We found a second aneurysm.&rdquo;</strong> Say first that this is common and does not multiply the risk by two. Be candid that the models are weakest here: PHASES applied to the largest aneurysm discriminated at AUC 0.572 in 701 multiple-aneurysm patients, and worse with 4 or more (PMID: 33631473). Manage each aneurysm on its own size, site and shape; a prior SAH from one raises the risk of the others (the &ldquo;E&rdquo; of PHASES). Escalate to a multidisciplinary neurovascular discussion rather than a single-number verdict.
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Routing Decision Variables, Randomized Prehospital Trials, and LVO Scale and Door-In-Door-Out Metrics" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Routing Decision Variables */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: MOTHERSHIP vs DRIP-AND-SHIP</text>
      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="20" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="9" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">SCENE: scale-positive, diagnosis still unknown</text>
        <text x="6" y="17" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">RACECAT RACE&gt;4 yield: 22% ICH &bull; 8% mimic &bull; rest ischemic</text>
        <rect x="0" y="24" width="108" height="44" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="5" y="33" fill="#1d4ed8" fontSize="4.7pt" fontFamily="Outfit" fontWeight="800">MOTHERSHIP (bypass)</text>
        <text x="5" y="42" fill="#166534" fontSize="4.1pt" fontFamily="IBM Plex Sans">+ EVT 48.8% vs 39.4%</text>
        <text x="5" y="51" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans">&minus; IVT 47.5% vs 60.4%</text>
        <text x="5" y="60" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans">&minus; ICH worse (aOR 0.63)</text>
        <rect x="114" y="24" width="108" height="44" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="119" y="33" fill="#166534" fontSize="4.7pt" fontFamily="Outfit" fontWeight="800">DRIP-AND-SHIP</text>
        <text x="119" y="42" fill="#166534" fontSize="4.1pt" fontFamily="IBM Plex Sans">+ Needle ~30 min sooner</text>
        <text x="119" y="51" fill="#166534" fontSize="4.1pt" fontFamily="IBM Plex Sans">+ ICH treated locally</text>
        <text x="119" y="60" fill="var(--red-deep)" fontSize="4.1pt" fontFamily="IBM Plex Sans">&minus; DIDO median 174 min</text>
        <rect x="0" y="72" width="222" height="44" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="82" fill="var(--amber-deep)" fontSize="4.7pt" fontFamily="Outfit" fontWeight="800">COMPUTE YOUR OWN CROSSOVER &mdash; 5 LOCAL INPUTS</text>
        <text x="6" y="91" fill="var(--ink)" fontSize="4.1pt" fontFamily="IBM Plex Sans">1. Scale PPV at YOUR LVO prevalence  2. Extra transport min</text>
        <text x="6" y="99" fill="var(--ink)" fontSize="4.1pt" fontFamily="IBM Plex Sans">3. Local door-to-needle  4. EVT-centre door-to-puncture</text>
        <text x="6" y="107" fill="var(--ink)" fontSize="4.1pt" fontFamily="IBM Plex Sans">5. ICH + mimic fraction among your scale-positives</text>
        <text x="6" y="114" fill="var(--amber-deep)" fontSize="4.0pt" fontFamily="IBM Plex Sans" fontWeight="700">Never import another region&#39;s rule &mdash; geography drives it</text>
      </g>
      {/* Panel B: Randomized Prehospital Trials */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: RANDOMIZED PREHOSPITAL TRIALS</text>
      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="34" rx="3" fill="var(--fill-soft)" stroke="var(--ink-mute)" strokeWidth="1" />
        <text x="6" y="11" fill="var(--ink)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">RACECAT &mdash; NEUTRAL (PMID 35510397)</text>
        <text x="6" y="20" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Nonurban Catalonia, n=1401 cluster-RCT, halted for futility</text>
        <text x="6" y="29" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">90-d mRS shift aOR 1.03 (0.82&ndash;1.29); death 27.3% vs 27.2%</text>
        <rect x="0" y="38" width="222" height="34" rx="3" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
        <text x="6" y="49" fill="#9f1239" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">RACECAT ICH SUBSTUDY &mdash; HARM (PMID 37603325)</text>
        <text x="6" y="58" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">n=302 with final diagnosis of ICH; bypass was worse</text>
        <text x="6" y="67" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">mRS shift aOR 0.63 (0.41&ndash;0.96); transport complics 22.6% vs 5.6%</text>
        <rect x="0" y="76" width="222" height="38" rx="3" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
        <text x="6" y="87" fill="#7e22ce" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">TRIAGE-STROKE &amp; INTERACT4 (PMIDs 37800374, 38752650)</text>
        <text x="6" y="96" fill="var(--ink-soft)" fontSize="4.2pt" fontFamily="IBM Plex Sans">TRIAGE-STROKE stopped early: OR 1.42 (0.72&ndash;2.82), underpowered</text>
        <text x="6" y="105" fill="var(--red-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">INTERACT4 ambulance BP drop: ischemic cOR 1.30 (1.06&ndash;1.60)</text>
        <text x="6" y="112" fill="#166534" fontSize="4.0pt" fontFamily="IBM Plex Sans" fontWeight="700">&hellip; but hemorrhagic cOR 0.75 (0.60&ndash;0.92) &mdash; opposite signs</text>
      </g>

      {/* Panel C: LVO Scales & Door-In-Door-Out */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: LVO SCALES &amp; THE DIDO CLOCK</text>
      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="60" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="11" fill="var(--purple-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">LVO SCALES &mdash; SENSITIVITY / SPECIFICITY</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">RACE &ge;5&nbsp;&nbsp;&nbsp;&nbsp;0.85 / 0.68&nbsp;&nbsp;&nbsp;field, n=357, LVO 21%</text>
        <text x="6" y="31" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">LAMS &ge;4&nbsp;&nbsp;&nbsp;&nbsp;0.81 / 0.89&nbsp;&nbsp;&nbsp;ED, n=119, LVO 62%</text>
        <text x="6" y="40" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">C-STAT &ge;2&nbsp;&nbsp;0.83 / 0.40&nbsp;&nbsp;&nbsp;IMS III LVO subset</text>
        <text x="6" y="49" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">FAST-ED &ge;4&nbsp;0.60 / 0.89&nbsp;&nbsp;&nbsp;n=727, LVO 33%</text>
        <text x="6" y="57" fill="var(--red-deep)" fontSize="4.0pt" fontFamily="IBM Plex Sans" fontWeight="700">PPV is prevalence-bound &mdash; field PPV is lower than published</text>
        <rect x="0" y="64" width="221" height="50" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="75" fill="var(--teal-deep)" fontSize="5.0pt" fontFamily="Outfit" fontWeight="800">DOOR-IN-DOOR-OUT (GWTG, n=108,913)</text>
        <rect x="6" y="79" width="72" height="9" rx="2" fill="#16a34a" />
        <rect x="78" y="79" width="33" height="9" fill="#dc2626" />
        <text x="10" y="86" fill="#ffffff" fontSize="3.8pt" fontFamily="Outfit" fontWeight="800">TARGET &le;120 &rarr; +54</text>
        <text x="6" y="97" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Median 174 min (IQR 116&ndash;276); only 27.3% met &le;120 min</text>
        <text x="6" y="105" fill="#166534" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700">EMS prenotification &minus;20.1 min &bull; NIHSS &gt;12 &minus;66.7 min</text>
        <text x="6" y="112" fill="var(--red-deep)" fontSize="4.0pt" fontFamily="IBM Plex Sans" fontWeight="700">Longer for age &ge;80 (+14.9), female (+5.2), Black race (+8.2)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Routing rule construction (teal) */}
            <CardSection color="teal" title="1. Mothership vs Drip-and-Ship &mdash; Build the Rule From Local Numbers, Not Someone Else&#39;s Trial">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What Bypass Actually Buys and Costs</strong>
                  <br />&bull; <strong>Buys EVT access:</strong> in RACECAT, direct transport raised thrombectomy delivery from 39.4% to 48.8% (OR 1.46; 95% CI 1.13&ndash;1.89).
                  <br />&bull; <strong>Costs lysis:</strong> the same bypass cut IV thrombolysis from 60.4% to 47.5% (OR 0.59; 95% CI 0.45&ndash;0.76).
                  <br />&bull; The two effects <strong>cancelled</strong>: 90-day mRS adjusted common OR 1.03 (95% CI 0.82&ndash;1.29) &mdash; a genuinely neutral trial, not a positive one.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>The Five Inputs to Your Local Crossover</strong>
                  <br />&bull; <strong>1. LVO probability</strong> = scale PPV at <em>your</em> LVO prevalence, not the derivation cohort&#39;s.
                  <br />&bull; <strong>2. Incremental transport time</strong> to the EVT centre (drive time, not map distance; day vs night).
                  <br />&bull; <strong>3. Lytic delay incurred</strong> = your local door-to-needle vs the EVT centre&#39;s.
                  <br />&bull; <strong>4. EVT-centre capacity</strong> &mdash; door-to-puncture, angio-suite availability, false-positive absorption.
                  <br />&bull; <strong>5. Non-ischemic fraction</strong> among scale-positives (ICH + mimic), which bypass actively harms.
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
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>This is the asymmetry that breaks scale-only routing: the same rule that helps a minority with LVO measurably harms the ~1 in 5 with ICH.</td>
                  </tr>
                  <tr>
                    <td><strong>TRIAGE-STROKE</strong><br />Multicentre RCT, assessor-blinded<br />Stroke 2023; PMID 37800374</td>
                    <td>171 enrolled (104 ischemic) in Denmark, IVT-eligible with suspected LVO &lt;4 h: nearest primary stroke centre (prioritise IVT) vs direct comprehensive centre (prioritise EVT). Halted before full recruitment.</td>
                    <td><span style={{ color: 'var(--ink)' }}><strong>NO significant difference</strong> &mdash; 90-day mRS shift OR <strong>1.42 (95% CI 0.72&ndash;2.82; p=0.31)</strong>; the trial was underpowered. Onset-to-groin was <strong>35 min shorter</strong> with direct CSC (p=0.007); onset-to-needle was <strong>30 min shorter</strong> with PSC-first (p=0.012).</span></td>
                    <td>Quantifies the trade you are making in minutes even when the outcome signal is absent. Use these two deltas as your local model&#39;s anchors.</td>
                  </tr>
                  <tr>
                    <td><strong>RACECAT vascular-imaging post hoc</strong><br />J Neurointerv Surg 2024; PMID 37068936</td>
                    <td>467 patients allocated to a local stroke centre; CTA/MRA acquired at the local centre in 277 (59%), of whom 198 (71%) had an LVO.</td>
                    <td><span style={{ color: '#166534' }}>Vascular imaging at the local centre did <strong>not</strong> lengthen door-in-door-out (78 vs 76 min; p=0.6), reduced transfers as EVT candidates (58% vs 74%; p=0.004), raised the EVT rate among those transferred (69% vs 55%; p=0.016) and shortened door-to-puncture at the EVT centre (41 vs 54 min; p&lt;0.001).</span></td>
                    <td>Transfer with the CTA already done &mdash; in RACECAT it cost no door-in-door-out time and cut futile transfers. Post hoc and non-randomised; it did not test <em>how</em> the CTA was sequenced.</td>
                  </tr>
                </tbody>
              </table>
            </CardSection>

            {/* §3 Ambulance interventions requiring a diagnosis (red) */}
            <CardSection color="red" title="3. Ambulance Interventions That Require a Diagnosis First &mdash; INTERACT4 and the Mobile Stroke Unit Answer">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.34', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--red)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--red-deep)', fontSize: '7.6pt' }}>INTERACT4: Do Not Lower BP Before You Know the Diagnosis</strong>
                  <br />&bull; <strong>Design (NEJM 2024; PMID 38752650):</strong> 2404 patients in China with suspected stroke causing a motor deficit and SBP &ge;150 mmHg, randomised <em>in the ambulance</em> within 2 h of onset (median 61 min) to target SBP 130&ndash;140 vs usual care. Mean SBP on hospital arrival 159 vs 170 mmHg.
                  <br />&bull; <strong>Overall: NEUTRAL</strong> &mdash; common OR 1.00 (95% CI 0.87&ndash;1.15), serious adverse events similar.
                  <br />&bull; <strong>Opposite signs by subtype:</strong> hemorrhagic stroke <strong>benefited</strong> (cOR 0.75; 95% CI 0.60&ndash;0.92) while cerebral ischemia was <strong>harmed</strong> (cOR 1.30; 95% CI 1.06&ndash;1.60). 46.5% of the 2240 imaged patients had hemorrhagic stroke. <span style={{ color: 'var(--red-deep)' }}>No undifferentiated prehospital BP protocol is safe &mdash; withhold ambulance BP lowering until imaging separates the two.</span>
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
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>Facial droop (0&ndash;1), arm drift (0&ndash;2), grip strength (0&ndash;2). Fastest to teach and score.</td>
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
              </table>
              <div style={{ fontSize: '6.8pt', lineHeight: '1.32', color: 'var(--ink-soft)', marginTop: '4px', borderTop: '1px dashed var(--rule)', paddingTop: '3px' }}>
                <strong style={{ color: 'var(--amber-deep)' }}>Reading these numbers correctly:</strong> sensitivity and specificity are portable; <strong>PPV is not</strong>. Every PPV above was measured where LVO prevalence ran 21&ndash;62%, far above an unselected EMS stroke-alert population, so field PPV will be lower and the false-positive volume arriving at the EVT centre correspondingly higher. Model the absolute number of scale-positive non-LVO arrivals per month before committing the angio suite &mdash; and remember that in RACECAT a fifth of all scale-positives turned out to be ICH, for whom the bypass itself is a harm (PMID 37603325).
              </div>
            </CardSection>

            {/* §5 Transfer, DIDO, telestroke, certification (purple) */}
            <CardSection color="purple" title="5. Interfacility Transfer, Door-In-Door-Out, Telestroke &amp; Certification Tiers">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Door-In-Door-Out Is the Governing Metric</strong>
                  <br />&bull; <strong>Benchmark vs reality (JAMA 2023; PMID 37581671):</strong> guidelines call for DIDO <strong>&le;120 min</strong>; across 108,913 transfers from 1925 GWTG hospitals the median was <strong>174 min (IQR 116&ndash;276)</strong> and only <strong>27.3%</strong> met the target.
                  <br />&bull; <strong>Shortens DIDO:</strong> EMS prenotification &minus;20.1 min (95% CI &minus;22.1 to &minus;18.1); NIHSS &gt;12 vs 0&ndash;1 &minus;66.7 min; EVT-eligible ischemic vs hemorrhagic &minus;16.8 min.
                  <br />&bull; <strong>Lengthens DIDO &mdash; equity signal:</strong> age &ge;80 +14.9 min, female sex +5.2 min, non-Hispanic Black +8.2 min, Hispanic ethnicity +5.4 min vs non-Hispanic White. Audit your own DIDO by race, sex and age.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Where Drip-and-Ship Actually Loses Its Time</strong>
                  <br />&bull; <strong>Process autopsy (Ann Emerg Med 2021; PMID 34598828):</strong> 191 transfers from 3 Chicago primary stroke centres, median DIDO <strong>148.5 min (IQR 106&ndash;208)</strong>. Biggest blocks: CT-to-CTA 22 min, transfer-centre contact to ambulance request 20 min, ambulance request to arrival 20.5 min, ambulance on site 26 min.
                  <br />&bull; <strong>Fixable levers:</strong> giving alteplase &minus;29 min; the sending centre requesting the ambulance itself &minus;20 min. <strong>Costly:</strong> CTA performed at the primary stroke centre +39 min; walk-in arrival +53 min; intubation +23 min.
                  <br />&bull; <strong>Reconcile with RACECAT:</strong> there CTA at the local centre added no DIDO time at all (78 vs 76 min; PMID 37068936). A 39 min penalty is therefore a workflow defect, not an inherent cost of CTA &mdash; fix the sequencing, do not skip the scan.
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Telestroke, Certification Tiers &amp; What Is Still Investigational</strong>
                  <br />&bull; <strong>Telestroke as a routing instrument:</strong> use it to make the transfer decision, not merely to authorise lysis &mdash; image share, vessel status and destination should be settled on the same call. Availability alone does not fix flow: telestroke covered 84.2% of the Chicago cohort yet median DIDO was still 148.5 min.
                  <br />&bull; <strong>Certification tiers</strong> describe capability, not speed. Acute-stroke-ready hospitals stabilise and give lysis; primary stroke centres add a stroke unit; thrombectomy-capable centres perform EVT with limited neurocritical and neurosurgical depth; comprehensive centres add 24/7 neurosurgery, aneurysm and ICH care, and neuro-ICU. Route ICH and SAH by <em>surgical</em> capability, LVO by <em>EVT</em> capability &mdash; they are not the same tier.
                  <br />&bull; <strong>Still investigational:</strong> no blood biomarker is validated to separate ICH from ischemia in the field, and prehospital imaging outside a mobile stroke unit is not deployed. Until one exists the ambulance cannot make a pathology-dependent decision &mdash; the shared lesson of INTERACT4 and the RACECAT ICH substudy. See the 2026 AHA/ASA acute ischemic stroke guideline (PMID 41582814) for current prehospital and systems-of-care recommendations.
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Severe Stroke Supportive Care Targets, Three Neutral Neurocritical Care Trials, and an ICU Day Map" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: First-72-hour supportive targets */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--red)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--red)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: FIRST-72-HOUR SUPPORTIVE TARGETS</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="28" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--red-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">TEMPERATURE &mdash; core &lt;37.5&deg;C, treat at &ge;38.0&deg;C</text>
        <text x="8" y="21" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Scheduled acetaminophen &rarr; surface cooling. Always hunt the source.</text>

        <rect x="0" y="32" width="222" height="28" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="43" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">GLUCOSE &mdash; 140&ndash;180 mg/dL, floor 70 mg/dL</text>
        <text x="8" y="53" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">SHINE: tighter 80&ndash;130 target gave no benefit, more hypoglycemia.</text>

        <rect x="0" y="64" width="222" height="28" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="75" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SWALLOW &mdash; strict NPO until a screen is passed</text>
        <text x="8" y="85" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">No food, fluids or oral meds &mdash; including aspirin &mdash; before screening.</text>

        <rect x="0" y="96" width="222" height="28" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="107" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">VTE &mdash; IPC sleeves on from admission</text>
        <text x="8" y="117" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">CLOTS 3: proximal DVT 8.5% vs 12.1% (ARR 3.6%, 95% CI 1.4&ndash;5.8)</text>
      </g>

      {/* Panel B: Three neutral trials */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: THREE NEUTRAL TRIALS &mdash; SAY SO PLAINLY</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="38" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="12" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">INTREPID (JAMA 2024; PMID 39320879) n=677</text>
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Device normothermia 37.0&deg;C cut fever burden 0.37 vs 0.73 &deg;C-h</text>
        <text x="6" y="32" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">3-mo mRS shift OR 1.09 (0.81&ndash;1.46), P=.54 &mdash; NO outcome benefit</text>

        <rect x="0" y="42" width="222" height="38" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="54" fill="#1d4ed8" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SETPOINT2 (JAMA 2022; PMID 35506515) n=382</text>
        <text x="6" y="64" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Trach &le;5 d vs standard from day 10; mRS 0&ndash;4 43.5% vs 47.1%</text>
        <text x="6" y="74" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">aOR 0.93 (0.60&ndash;1.42), P=.73 &mdash; NS, wide CI, not equivalence</text>

        <rect x="0" y="84" width="222" height="38" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="96" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">CHARM (Lancet Neurol 2024; PMID 39577921) n=431</text>
        <text x="6" y="106" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">IV glibenclamide 8.6 mg/72 h for LHI edema, ages 18&ndash;70 mITT</text>
        <text x="6" y="116" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">mRS shift cOR 1.17 (0.80&ndash;1.71), P=.42 &mdash; negative, stopped early</text>
      </g>

      {/* Panel C: ICU day map */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--teal)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: ICU DAY MAP FOR SEVERE STROKE</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="28" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="8" y="11" fill="var(--teal-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DAY 0&ndash;1 &bull; Bundle on</text>
        <text x="8" y="21" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Swallow screen &bull; IPC &bull; normothermia &bull; glucose &bull; HOB position</text>

        <rect x="0" y="32" width="221" height="28" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="8" y="43" fill="var(--purple-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DAY 2&ndash;5 &bull; Edema window</text>
        <text x="8" y="53" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Peak swelling &bull; hemicraniectomy decision &bull; first extubation trial</text>

        <rect x="0" y="64" width="221" height="28" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="8" y="75" fill="var(--amber-deep)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DAY 5&ndash;10 &bull; Airway conversation</text>
        <text x="8" y="85" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Failed weaning &rarr; trach discussion, framed inside goals of care</text>

        <rect x="0" y="96" width="221" height="28" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="8" y="107" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">DAY 10&ndash;21 &bull; Feeding route &amp; rehab</text>
        <text x="8" y="117" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">NG &rarr; PEG only after swallow trajectory is clear &bull; decannulation</text>

        <text x="8" y="136" fill="var(--ink-mute)" fontSize="4.4pt" fontFamily="IBM Plex Sans" fontWeight="700">Stroke-unit care itself: poor outcome OR 0.77 (0.69&ndash;0.87)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
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
                  <br />&bull; <strong>Bottom line:</strong> fever is a <em>marker</em> of injury severity and of an occult source. Erasing the number with a machine does not erase the injury.
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>What To Actually Do</strong>
                  <br />&bull; Keep core temperature <strong>&lt;37.5&deg;C</strong>; act at <strong>&ge;38.0&deg;C</strong> with scheduled acetaminophen, then surface cooling if refractory. Do not commit an ICU bed and a device to chasing 37.0&deg;C.
                  <br />&bull; <strong>Every fever gets a workup:</strong> aspiration pneumonia, CAUTI, line infection, DVT, drug fever, and &mdash; in SAH/IVH &mdash; chemical/central fever as a diagnosis of exclusion.
                  <br />&bull; Shivering defeats cooling and raises metabolic demand: counter-warm, buspirone, magnesium before escalating sedation.
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
                  <br />&bull; Extubate on <strong>airway protection</strong>, not on GCS alone: cough, secretion volume, cuff leak, and whether the patient handles their own oropharynx.
                  <br />&bull; Around day 5&ndash;7 of failed weaning the honest question is not &quot;trach or no trach&quot; but <strong>&quot;what outcome is this airway serving?&quot;</strong>
                  <br />&bull; <strong>Percutaneous dilational</strong> is the default: in a SETPOINT2 post-hoc matched analysis, surgical tracheostomy carried more early in-hospital infection (14.6% vs 1.2%; p=0.002) and later decannulation (median 81 vs 58 days; p=0.004) with equivalent 6-month outcome (PMID: 38291277).
                </div>

                <div style={{ border: '1.5px solid var(--amber)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Prognostic Guardrails</strong>
                  <br />&bull; A tracheostomy decision is a <strong>trajectory decision</strong>. Name the realistic best case (long-term ventilator-capable facility, mRS 4&ndash;5) before consenting.
                  <br />&bull; Beware the <strong>self-fulfilling prophecy</strong>: early withdrawal of life-sustaining therapy in the first 72 h is the single largest confounder in severe-stroke prognostication.
                  <br />&bull; Sedation: prefer propofol / dexmedetomidine over benzodiazepines so the neurologic exam stays the monitor; interrupt daily <em>unless</em> ICP is the limiting problem.
                  <br />&bull; Re-visit goals of care at each inflection &mdash; edema peak, failed extubation, PEG decision.
                </div>
              </div>
            </CardSection>

            {/* §3 Edema pharmacotherapy & glucose (teal) */}
            <CardSection color="teal" title="3. Cerebral Edema Pharmacotherapy &amp; Glucose &mdash; What The Randomized Evidence Actually Shows">
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td>There is <strong>no approved pharmacologic therapy for malignant edema</strong>. Say this before the hemicraniectomy conversation so families are not waiting for a drug.</td>
                  </tr>
                  <tr>
                    <td><strong>Sulfonylureas &mdash; Cochrane</strong><br />Cochrane Database Syst Rev 2025;3:CD014802<br />PMID: 40066941</td>
                    <td>2 RCTs (GAMES-RP n=86 and CHARM n=535), 621 participants total, both at overall high risk of bias.</td>
                    <td>mRS 0&ndash;4 at 90 days <strong>RR 1.08 (95% CI 0.89&ndash;1.32; P=0.43)</strong>; death <strong>RR 0.78 (0.36&ndash;1.69; P=0.53)</strong> &mdash; both low certainty. Hypoglycemia <strong>RR 4.66 (1.59&ndash;13.67; P=0.005)</strong>, moderate certainty.</td>
                    <td>Pooling does not rescue the signal. The only reproducible drug effect is <strong>harm from hypoglycemia</strong>.</td>
                  </tr>
                  <tr>
                    <td><strong>SHINE</strong><br />JAMA 2019;322:326&ndash;335<br />PMID: 31334795</td>
                    <td>1151 hyperglycemic patients within 12 h of ischemic stroke at 63 US sites. IV insulin to 80&ndash;130 mg/dL (n=581) vs SC sliding scale to 80&ndash;179 mg/dL (n=570) for up to 72 h. Achieved means 118 vs 179 mg/dL.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>NEUTRAL, stopped for futility.</strong> Favorable 90-day outcome 20.5% vs 21.6%; adjusted <strong>RR 0.97 (95% CI 0.87&ndash;1.08; P=.55)</strong>.</span> Severe hypoglycemia occurred <strong>only</strong> in the intensive arm (15/581, 2.6%; risk difference 2.58%, 95% CI 1.29&ndash;3.87).</td>
                    <td>Use a moderate target (commonly <strong>140&ndash;180 mg/dL</strong>) with a hard hypoglycemia floor. Point-of-care glucose is mandatory before thrombolysis and with any unexplained deficit.</td>
                  </tr>
                </tbody>
              </table>
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
                  <br />&bull; <strong>Practice:</strong> start NG feeding early; defer the PEG conversation to roughly day 14&ndash;21, once the swallow trajectory and the goals of care are both legible.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Drugs Do Not Substitute For Nursing</strong>
                  <br />&bull; <strong>Prophylactic metoclopramide is not established:</strong> in a PRECIOUS <em>post hoc</em> analysis of 329 stroke patients with an NG tube, metoclopramide did not reduce first-week pneumonia (41.0% vs 35.8%; adjusted OR <strong>1.35, 95% CI 0.79&ndash;2.30</strong>) or improve 90-day mRS (aOR 1.07, 0.71&ndash;1.61) (PMID: 39129650).
                  <br />&bull; Prophylactic antibiotics are likewise ineffective (PASS, PMID: 25612858) &mdash; treat documented infection, do not pre-treat the risk.
                  <br />&bull; What does work is unglamorous: swallow screening, oral hygiene, upright feeding, early mobilization out of bed, and prompt de-escalation of unnecessary lines and catheters.
                </div>
              </div>
            </CardSection>

            {/* §5 VTE, mobilization, systemic complications (slate) */}
            <CardSection color="slate" title="5. VTE Prophylaxis, Mobilization Dose &amp; The Systemic Complications That Drive Mortality">
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>VTE: Sleeves Now, Heparin On A Schedule</strong>
                  <br />&bull; <strong>IPC from admission in every immobile patient.</strong> CLOTS 3 (Lancet 2013;382:516&ndash;524; PMID: 23727163) randomized 2876 immobile stroke patients: proximal DVT within 30 days <strong>8.5% (122/1438) vs 12.1% (174/1438)</strong>, absolute risk reduction <strong>3.6% (95% CI 1.4&ndash;5.8)</strong>; adjusted OR 0.65 (0.51&ndash;0.84; p=0.001). Skin breaks were more common with IPC (3% vs 1%; p=0.002) &mdash; inspect legs daily.
                  <br />&bull; <strong>Graduated compression stockings alone are not a substitute</strong> and are not recommended for this indication.
                  <br />&bull; <strong>Pharmacologic start times (institutional convention, not trial-derived):</strong> ischemic stroke &mdash; prophylactic LMWH/UFH once bleeding risk is assessed, and after thrombolysis defer until the 24-hour follow-up CT is clean; ICH &mdash; hold until the hematoma is documented stable on repeat imaging, typically day 1&ndash;2 (AHA/ASA ICH guideline, PMID: 35579034); post-craniotomy or hemicraniectomy &mdash; per the operating surgeon, usually 24&ndash;48 h post-op. <strong>IPC covers the entire interval.</strong>
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Mobilization: Early Yes, High-Dose No</strong>
                  <br />&bull; <strong>AVERT (Lancet 2015;386:46&ndash;55; PMID: 25892679)</strong> randomized 2104 patients at 56 stroke units to a frequent, higher-dose very early mobilization protocol vs usual care. Favourable 3-month outcome (mRS 0&ndash;2) was <strong>lower</strong> with the intensive protocol: 46% vs 50%, <strong>adjusted OR 0.73 (95% CI 0.59&ndash;0.90; p=0.004)</strong>. Deaths 8% vs 7% (OR 1.34, 0.93&ndash;1.93; p=0.113), and <strong>no</strong> reduction in immobility-related complications.
                  <br />&bull; Read it as a <em>dose</em> signal, not a prohibition: usual care already mobilized 59% within 24 h. Get patients sitting and out of bed early, but do not front-load high-intensity out-of-bed time in the first 24 h, especially with a large infarct or an unprotected occlusion.
                  <br />&bull; Delirium prevention is the same bundle: daylight, sleep protection, glasses and hearing aids, family presence, and the fewest possible tethers.
                </div>
                <div style={{ borderLeft: '1.5px dashed var(--rule)', paddingLeft: '8px' }}>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Systemic Complications &amp; The Unit Itself</strong>
                  <br />&bull; <strong>Infection:</strong> aspiration pneumonia and catheter-associated UTI dominate. Remove the Foley as soon as strict output measurement is no longer required; use intermittent catheterization for retention.
                  <br />&bull; <strong>Cardiac:</strong> troponin elevation, repolarization abnormalities, arrhythmia and neurogenic stunned myocardium (Takotsubo-pattern) are common after severe stroke &mdash; especially insular infarcts and SAH. Obtain ECG and troponin; echocardiography if the pattern is unexplained. Do not reflexively anticoagulate a demand-ischemia troponin.
                  <br />&bull; <strong>Sodium:</strong> hyponatremia is frequent; distinguish SIADH from cerebral salt wasting by volume status, and avoid hypotonic fluids entirely in patients with edema risk.
                  <br />&bull; <strong>The largest single lever remains the unit:</strong> organised stroke-unit care reduces poor outcome <strong>OR 0.77 (95% CI 0.69&ndash;0.87)</strong> and death <strong>OR 0.76 (0.66&ndash;0.88)</strong> across 29 trials and 5902 participants &mdash; about 2 extra survivors and 6 more people living at home per 100 treated (PMID: 32324916).
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
    <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Recovery Trajectory and Sensitive Window, Rehabilitation Setting Ladder, and Post-Stroke Screening Calendar" style={{ width: '100%', height: '168px' }}>
      <rect x="0" y="0" width="735" height="168" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1" />

      {/* Panel A: Recovery trajectory and the sensitive window */}
      <rect x="10" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="10" y="8" width="232" height="22" rx="6" fill="var(--teal)" />
      <text x="126" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL A: RECOVERY CURVE &amp; SENSITIVE WINDOW</text>

      <g transform="translate(15, 36)">
        <rect x="0" y="0" width="222" height="60" rx="3" fill="#ffffff" stroke="var(--rule)" strokeWidth="1" />
        <rect x="44" y="6" width="46" height="42" fill="var(--teal-soft)" />
        <text x="67" y="13" fill="var(--teal-deep)" fontSize="4pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">2&ndash;3 MO WINDOW</text>
        <line x1="16" y1="50" x2="214" y2="50" stroke="var(--rule)" strokeWidth="1" />
        <line x1="16" y1="6" x2="16" y2="50" stroke="var(--rule)" strokeWidth="1" />
        <path d="M16,48 C40,28 70,16 110,11 S170,6 214,5" fill="none" stroke="var(--purple)" strokeWidth="1.6" />
        <text x="16" y="57" fill="var(--ink-mute)" fontSize="4pt" fontFamily="IBM Plex Sans" textAnchor="middle">onset</text>
        <text x="56" y="57" fill="var(--ink-mute)" fontSize="4pt" fontFamily="IBM Plex Sans" textAnchor="middle">30 d</text>
        <text x="100" y="57" fill="var(--ink-mute)" fontSize="4pt" fontFamily="IBM Plex Sans" textAnchor="middle">3 mo</text>
        <text x="152" y="57" fill="var(--ink-mute)" fontSize="4pt" fontFamily="IBM Plex Sans" textAnchor="middle">6 mo</text>
        <text x="206" y="57" fill="var(--ink-mute)" fontSize="4pt" fontFamily="IBM Plex Sans" textAnchor="middle">12 mo</text>
        <text x="212" y="26" fill="var(--purple-deep)" fontSize="4.2pt" fontFamily="IBM Plex Sans" fontWeight="700" textAnchor="end">Impairment recovers early; function later</text>

        <rect x="0" y="64" width="222" height="26" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="74" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">CPASS (PMID 34544853): 20 extra hours, timing matters</text>
        <text x="6" y="85" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">ARAT at 1 y: 2&ndash;3 mo +6.87 &bull; &le;30 d +5.25 &bull; &ge;6 mo +2.41 (NS)</text>

        <rect x="0" y="94" width="222" height="24" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="104" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">AVERT (PMID 25892679): earlier is NOT better</text>
        <text x="6" y="114" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">High-dose out-of-bed &lt;24 h: mRS 0&ndash;2 46% vs 50%, aOR 0.73</text>
      </g>

      {/* Panel B: Discharge setting ladder */}
      <rect x="252" y="8" width="232" height="152" rx="6" fill="#ffffff" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="252" y="8" width="232" height="22" rx="6" fill="var(--purple)" />
      <text x="368" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL B: DISCHARGE SETTING LADDER</text>

      <g transform="translate(257, 36)">
        <rect x="0" y="0" width="222" height="26" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="11" fill="var(--purple-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800">INPATIENT REHAB FACILITY (IRF)</text>
        <text x="6" y="21" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Tolerates &ge;3 h/day, 5 d/wk &bull; &ge;2 disciplines &bull; rehab MD &ge;3 d/wk</text>

        <rect x="0" y="30" width="222" height="26" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="41" fill="var(--amber-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800">SKILLED NURSING / SUBACUTE REHAB</text>
        <text x="6" y="51" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Cannot sustain 3 h/day &bull; 1&ndash;2 h/day &bull; medical or endurance limits</text>

        <rect x="0" y="60" width="222" height="26" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="71" fill="var(--teal-deep)" fontSize="5pt" fontFamily="Outfit" fontWeight="800">HOME HEALTH</text>
        <text x="6" y="81" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Homebound &bull; safe home + caregiver &bull; therapy 2&ndash;3 visits/wk</text>

        <rect x="0" y="90" width="222" height="26" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="101" fill="#166534" fontSize="5pt" fontFamily="Outfit" fontWeight="800">OUTPATIENT / COMMUNITY THERAPY</text>
        <text x="6" y="111" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">Can travel &bull; task-specific practice + aerobic conditioning</text>
      </g>

      {/* Panel C: Screening and surveillance calendar */}
      <rect x="494" y="8" width="231" height="152" rx="6" fill="#ffffff" stroke="var(--amber)" strokeWidth="1.5" />
      <rect x="494" y="8" width="231" height="22" rx="6" fill="var(--amber)" />
      <text x="609" y="23" fill="#ffffff" fontSize="7pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">PANEL C: POST-STROKE SCREENING CALENDAR</text>

      <g transform="translate(499, 36)">
        <rect x="0" y="0" width="221" height="21" rx="3" fill="var(--purple-soft)" stroke="var(--purple)" strokeWidth="1" />
        <text x="6" y="13" fill="var(--purple-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">PRE-DISCHARGE: swallow, mood, delirium &bull; defer cognition</text>

        <rect x="0" y="23" width="221" height="21" rx="3" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1" />
        <text x="6" y="36" fill="var(--teal-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">1 MONTH: PHQ-9 &bull; spasticity &bull; shoulder pain &bull; med adherence</text>

        <rect x="0" y="46" width="221" height="21" rx="3" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1" />
        <text x="6" y="59" fill="var(--amber-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">3 MONTHS: MoCA &bull; PHQ-9 &bull; fatigue scale &bull; driving / work talk</text>

        <rect x="0" y="69" width="221" height="21" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
        <text x="6" y="82" fill="#1d4ed8" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">6 MONTHS: repeat cognition &mdash; PSCI may improve OR decline</text>

        <rect x="0" y="92" width="221" height="24" rx="3" fill="var(--red-soft)" stroke="var(--red)" strokeWidth="1" />
        <text x="6" y="103" fill="var(--red-deep)" fontSize="4.6pt" fontFamily="Outfit" fontWeight="800">12 MONTHS &amp; BEYOND: up to 1/3 develop dementia by 5 y</text>
        <text x="6" y="112" fill="var(--ink)" fontSize="4.2pt" fontFamily="IBM Plex Sans">AHA/ASA PSCI scientific statement (PMID 37125534)</text>
      </g>
    </svg>
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

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Recovery biology, prognosis, and the critical window (teal) */}
            <CardSection color="teal" title="1. Recovery Biology, Prognosis &amp; the Critical Window &mdash; Setting Expectations at Discharge">
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>Proportional Recovery &amp; Its Limits</strong>
                  <br />&bull; <strong>What it says:</strong> at the group level, many survivors with an intact corticospinal tract regain a roughly fixed fraction of their <em>maximum possible</em> impairment improvement over the first 3 months.
                  <br />&bull; <strong>What it does not say:</strong> it is a description of a cohort, not a prediction for one patient, and it fails in patients with severe initial impairment and absent motor evoked potentials.
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
              <table className="card-table" style={{ margin: '2px 0 0 0', fontSize: '6.5pt' }}>
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
                    <td><strong>IRF:</strong> tolerates &ge;3 h/day, 5 d/wk, needs &ge;2 disciplines and rehabilitation-physician face-to-face visits &ge;3 d/wk (CMS IRF criteria). <strong>SNF:</strong> 1&ndash;2 h/day when endurance or medical burden blocks the 3-hour standard. <strong>Home health:</strong> homebound with a safe home. <strong>Outpatient:</strong> can travel.</td>
                    <td><span style={{ color: '#166534' }}>Re-assess tolerance daily during the acute stay &mdash; the patient who fails a 3-hour trial on day 2 often passes on day 5. Document the disciplines required, not just the deficits.</span></td>
                  </tr>
                  <tr>
                    <td><strong>LEAPS</strong><br />(NEJM 2011; PMID: 21612471)<br /><em>Body-weight&ndash;supported treadmill training</em></td>
                    <td>408 patients 2 months post-stroke randomised to early locomotor training (2 mo), late locomotor training (6 mo), or a physical-therapist-managed <strong>home exercise program</strong>; 36 sessions of 90 min each.</td>
                    <td><strong>Neutral.</strong> 52.0% overall improved functional walking at 1 y. Early locomotor training vs home exercise adjusted OR 0.83 (95% CI 0.50&ndash;1.39); late vs home OR 1.19 (0.72&ndash;1.99). Among severely impaired patients, multiple falls were more common with early locomotor training (p=0.02).</td>
                    <td><span style={{ color: '#166534' }}>A structured, progressive <strong>home</strong> program supervised by a therapist is as good as treadmill technology. Do not delay gait training waiting for a machine.</span></td>
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
              </table>
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
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>VNS-REHAB &mdash; First Positive Device Trial</strong>
                  <br />&bull; <strong>Design (Lancet 2021; PMID: 33894832):</strong> pivotal, triple-blind, sham-controlled; 108 patients (53 VNS / 55 sham) at least <strong>9 months</strong> after ischaemic stroke with moderate-to-severe arm weakness (baseline FMA-UE 20&ndash;50). All were implanted; 6 weeks of in-clinic therapy (18 sessions) then home exercise.
                  <br />&bull; <strong>Primary outcome:</strong> FMA-UE change +5.0 (SD 4.4) vs +2.4 (3.8); between-group difference <strong>2.6 (95% CI 1.0&ndash;4.2), p=0.0014</strong>.
                  <br />&bull; <strong>Response at 90 days:</strong> 23/53 (47%) vs 13/55 (24%); difference 24% (6&ndash;41), p=0.0098. One surgery-related serious adverse event (vocal cord paresis, control group).
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
                  <strong style={{ color: 'var(--amber-deep)', fontSize: '7.6pt' }}>Aphasia: Intensity Is the Active Ingredient</strong>
                  <br />&bull; <strong>Breitenstein (Lancet 2017; PMID: 28256356):</strong> 156 analysed patients &le;70 y with chronic aphasia (&ge;6 months). Three weeks of intensive speech and language therapy at <strong>&ge;10 h/week</strong> improved everyday verbal communication (Amsterdam-Nijmegen A-scale +2.61, 95% CI 1.49&ndash;3.72) vs &minus;0.03 with deferral; Cohen&rsquo;s d 0.58, p=0.0004.
                  <br />&bull; <strong>Big CACTUS (Lancet Neurol 2019; PMID: 31397288):</strong> 278 patients, self-managed computerised word-finding therapy. Naming improved <strong>+16.2% (95% CI 12.7&ndash;19.6), p&lt;0.0001</strong> &mdash; but <strong>functional conversation did not</strong> (TOMs difference &minus;0.03, 95% CI &minus;0.21 to 0.14, p=0.709).
                  <br />&bull; <strong>Counselling:</strong> gains continue well beyond 6&ndash;12 months with dose; drilled words do not automatically transfer to conversation, so pair app-based practice with conversation partner training.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Post-Stroke Cognitive Impairment (PSCI)</strong>
                  <br />&bull; <strong>Scale (AHA/ASA statement, Stroke 2023; PMID: 37125534):</strong> PSCI is common, especially in the first year, and ranges from mild to severe; <strong>up to one-third of stroke survivors develop dementia within 5 years</strong>. Some early impairment is reversible.
                  <br />&bull; <strong>The delirium confound:</strong> a MoCA drawn during delirium, aphasia, neglect, or an acute sedating-medication window measures the confound, not the patient. Screen for delirium first; defer formal cognitive testing to a lucid interval, ideally at follow-up rather than on discharge day.
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
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>The 90-Day Structure</strong>
                  <br />&bull; <strong>Guideline anchor (AHA/ASA, Stroke 2016; PMID: 27145936):</strong> organised, coordinated interdisciplinary rehabilitation with adequate resources, dose and duration is an essential component of stroke care, not a discretionary add-on.
                  <br />&bull; <strong>Visit 1 (7&ndash;14 d):</strong> confirm antithrombotic, statin and antihypertensive actually filled; reconcile discharge changes; mood check.
                  <br />&bull; <strong>Visit 2 (1 mo):</strong> BP and LDL to target; spasticity, shoulder pain, falls and continence; therapy attendance.
                  <br />&bull; <strong>Visit 3 (3 mo):</strong> cognition and mood screens; fatigue; driving and work; re-set the recovery expectation with the family; confirm aetiologic workup closed (including prolonged rhythm monitoring for embolic stroke of undetermined source).
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
            NIHSS ≤3 or ABCD² ≥4. <strong>Within 12 hours</strong> of onset.
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 600 mg</strong> +<br/>Aspirin 162–325 mg
          </td>
          <td style={{padding: '4px 6px', borderBottom: '1px solid var(--rule-soft)'}}>
            <strong>Clopidogrel 75mg qD</strong> +<br/>Aspirin 50&ndash;325mg qD for <strong>90 days</strong> (as randomized)
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
          • <strong>Duration — 21 vs 90 days</strong>: Minor stroke (NIHSS &le;3) / high-risk TIA (ABCD&sup2; &ge;4) &rarr; <strong>21 days</strong> ASA + clopidogrel (POINT/CHANCE), then single antiplatelet — benefit is concentrated in the first 21 days while bleeding risk rises beyond it. Severe symptomatic intracranial atherosclerotic stenosis (70–99%) &rarr; <strong>90 days</strong> ASA + clopidogrel (SAMMPRIS) plus intensive risk-factor control. THALES ASA + ticagrelor is a <strong>30-day</strong> regimen for NIHSS &le;5 / high-risk TIA. Short-course DAPT is endorsed by the 2021 secondary-prevention guideline and the 2026 AHA/ASA AIS guideline.
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
          <br/>• <strong>Timing</strong>: Surgery performed <strong>within 48 hours</strong> of onset.
        </div>
        <div>
          <strong>Radiographic Markers:</strong>
          <br/>• Infarction of <strong>≥ 50%</strong> of the MCA territory (CT/MRI)
          <br/>• DWI core volume <strong>&gt; 82 mL</strong> within 6 hours
          <br/>• DWI core volume <strong>&gt; 145 mL</strong> within 14 hours
          <br/>• Midline shift or mass effect on repeat imaging
          <br/>• <strong>Surgical Spec</strong>: Bone flap diameter <strong>≥ 12–15 cm</strong> with duraplasty.
        </div>
      </div>
    </div>

    
    <div className="outcome-chart-container">
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.5pt', display: 'block', marginBottom: '4px'}}>2. Surgical Outcomes & Evidence (By Age Group)</strong>
      
      
      <div className="outcome-row">
        <div className="outcome-label">
          <strong>Age 18–60 Years</strong> (pooled DECIMAL/DESTINY/HAMLET)<br/>
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
          Age 18–60 Medical Control
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
          <strong>Age ≥ 61 Years</strong> (DESTINY II)<br/>
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
        • <strong>Age 18–60</strong>: NNT = 2 for survival, NNT = 4 for survival with mRS ≤3 (able to walk unassisted). | • <strong>Age ≥ 61</strong>: NNT = 3 for survival, NNT = 25 for mRS ≤3. *Goals-of-care discussion critical.
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
                  <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <span className="font-bold text-crit-600 dark:text-crit-400"><em>Cushing triad is a LATE sign of brainstem compression.</em></span></li>
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
                  <li><strong>Analgesia/sedation (fentanyl/propofol):</strong> Target RASS &minus;4 to &minus;5 to prevent coughing, agitation, or ventilator dyssynchrony.</li>
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
                    <strong>Malignant MCA (DHC):</strong> Clinical decline with infarct &ge; 50% MCA territory, surgery within 48h. <strong>Age 18&ndash;60:</strong> survival and function both improve (pooled DECIMAL/DESTINY/HAMLET; mRS &le;4 75% vs 24%). <strong>Age &ge; 61:</strong> DESTINY II &mdash; survival without severe disability 38% vs 18% (OR 2.91, 95% CI 1.06&ndash;7.49; P=0.04), mortality 33% vs 70%, but no survivor reached mRS 0&ndash;2 and most needed help with most bodily needs; decide on goals of care, not an age cutoff.
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
                <td><strong>IV alteplase only</strong> initiated at this hospital within 3h for eligible AIS patients arriving within 2h of LKW. <span style={{ color: 'var(--red-deep)' }}>The Joint Commission 2026A numerator is alteplase alone and its rationale explicitly excludes tenecteplase &mdash; abstracting TNK into this numerator causes measure failure.</span> Note the divergence: the 2026 AHA/ASA guideline recommends tenecteplase 0.25 mg/kg <em>or</em> alteplase 0.9 mg/kg as co-equal Class I options, while the measure specification has not followed.</td>
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
                <td>Severity Measurement Performed &mdash; SAH and ICH Patients</td>
                <td>CSTK-03a: Hunt and Hess scale documented for aSAH. CSTK-03b: ICH Score documented for ICH. (There is no post-EVT blood-pressure CSTK measure.)</td>
              </tr>
            </tbody>
          </table>

          <div className="ref-citation" style={{marginTop: 'auto', padding: '6px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
            <strong>Quality Reference:</strong> The Joint Commission, Specifications Manual for National Hospital Inpatient Quality Measures, release <strong>2026A</strong> (STK set) and Comprehensive Stroke (CSTK) measure set, release <strong>2026A</strong>. Measure specifications are release-versioned &mdash; confirm the numerator against the release in force for your abstraction period before use.
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
                <br/>• <strong>Clinical Context</strong>: AHA/ASA guidelines emphasize that the ICH Score is a communication aid and must <strong>never</strong> be used as the sole basis for withholding care or making early DNR decisions. Provide full aggressive care for at least the first 24–48 hours.
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
                • <strong>Not for Care Limitations</strong>: These clinical scores serve to quantify severity, improve inter-provider communication, and assist in counseling. They <strong>MUST NOT</strong> be used in isolation as the sole basis for withholding reperfusion therapies, surgical decompression, or withdrawing life-sustaining treatment (avoiding the self-fulfilling prophecy of poor outcome).
                <br/>• <strong>Dynamic Evaluation</strong>: Clinical trajectory over the first 24–72 hours is often more predictive of final recovery than any single point-in-time calculation upon hospital admission.
                <br/>• <strong>Acute ICH — Hemostatic Therapy</strong>: The ICH Score is prognostic, not a treatment target. Early intensive blood-pressure lowering and hematoma-directed care remain the evidence-based acute levers (2022 AHA/ASA ICH guideline). Recombinant factor VIIa (rFVIIa) given within 2h slowed hematoma growth but did <strong>not</strong> improve 180-day function and increased thromboembolic events (FASTEST, 2026; PMID 41653933) — <strong>not</strong> recommended for routine use.
              </div>
            </div>

            {/* Citations Footer */}
            <div className="ref-citation" style={{marginTop: '0', padding: '6px 10px', fontSize: '7.2pt', lineHeight: '1.25'}}>
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
                    <br/>• <strong>Antithrombotics</strong>: Continue for at least 3–6 months (Class 2a, LOE B-NR).
                    <br/>• <strong>Choice</strong>: Individualized choice of Single Antiplatelet vs. VKA/DOAC; short-term DAPT (21–90d) is a reasonable alternative (ESO consensus).
                    <br/>• <strong>STOP-CAD</strong>: In occlusions, consider anticoagulation Day 1–30, then switch to antiplatelet.
                    <br/>• <strong>IV Thrombolysis</strong>: Reasonable within 4.5 hours in otherwise-eligible patients (Class 2a, LOE C-LD).
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
                      <br/>• <strong>Occlusion Benefit</strong>: Patients with complete arterial occlusion at baseline had the highest stroke risk and benefited most from early anticoagulation.
                      <br/>• <strong>Transition Strategy</strong>: Initiate anticoagulation for days 1–30 (highest stroke risk window) and then transition to antiplatelet monotherapy at day 30 to mitigate long-term bleeding risks (which rise significantly by day 180).
                    </td>
                  </tr>
                </tbody>
              </table>
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
    <svg viewBox="0 0 735 120" role="img" focusable="false" aria-label="Fibromuscular dysplasia: string-of-beads arterial morphology, affected vascular beds, and screening extent" style={{width: '100%', height: '100%'}}>
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
                  <br/>• <strong>Females</strong> account for <strong>80–90%</strong> of cases; typical onset age ranges between <strong>30–60 years</strong>.
                  <br/>• Cerebrovascular FMD is as common as renal FMD: among imaged beds, <strong>internal carotid (ICA)</strong> ~74%, <strong>renal</strong> ~70%, <strong>vertebral</strong> ~36%.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Clinical Presentation</strong>
                  <br/>• <strong>Pulsatile Tinnitus</strong>: "Whooshing" or beating sound in sync with heartbeat (extremely common in cranial FMD).
                  <br/>• Neck pain, headache, carotid bruits, or lightheadedness.
                  <br/>• Neurological deficits due to <strong>cervical dissection (CeAD)</strong>, distal embolization, or hemodynamic insufficiency.
                </div>
                <div style={{borderLeft: '1.5px dashed var(--purple)', paddingLeft: '10px'}}>
                  <strong style={{color: 'var(--purple-deep)', fontSize: '8pt'}}>Systemic Screening</strong>
                  <br/>• <strong>Brain-to-Pelvis Screen</strong>: Mandatory <strong>one-time</strong> cross-sectional vascular imaging (CTA or MRA) of all arterial beds from head to pelvis.
                  <br/>• <strong>Aneurysms</strong>: High risk (~13-22% prevalence). One-time screen for intracranial aneurysms.
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
                  <li><strong>Catheter Angiography</strong>: Gold standard, but reserved for therapeutic intervention.</li>
                </ul>
              </div>

              {/* Section 2B: Management */}
              <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '8px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)'}}>
                <strong style={{color: 'var(--red-deep)', fontSize: '9.5pt', display: 'block', marginBottom: '4px'}}>3. Medical &amp; Endovascular Management</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', fontSize: '7.6pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
                  <div>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Pharmacotherapy &amp; Counseling</strong>
                    <br/>• <strong>Antiplatelet Therapy</strong>: Aspirin <strong>81–325 mg daily</strong> is recommended (Class I, 2019 Consensus) for both asymptomatic and symptomatic patients to prevent thromboembolic stroke.
                    <br/>• <strong>BP Control</strong>: Aggressive BP control (ACEi or ARBs first-line for renal protection) with close creatinine monitoring.
                    <br/>• <strong>Trauma Warning</strong>: Patients must strictly <strong>avoid neck manipulation</strong> (e.g., chiropractic therapy, contact sports, rollercoasters).
                  </div>
                  <div style={{borderLeft: '1.5px dashed var(--red)', paddingLeft: '10px'}}>
                    <strong style={{color: 'var(--red-deep)', fontSize: '8pt'}}>Procedural Interventions</strong>
                    <br/>• <strong>Revascularization</strong>: Reserved for patients with recurrent TIA/stroke despite antiplatelets, or severe flow-limiting stenosis.
                    <br/>• <strong>Angioplasty (PTA)</strong>: Percutaneous angioplasty <strong>WITHOUT stenting</strong> is the primary intervention. Stents are generally held unless required for dissection salvage or aneurysm treatment.
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
                      • <strong>Demographics</strong>: 91% female, mean age at diagnosis 51.9 years (SD 13.4; range 5–83).
                      <br/>• <strong>Events at Diagnosis</strong>: Stroke (7.6%), TIA (18.8%), Cervical Dissection (19.7%), Aneurysm (17.0%).
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
            <svg viewBox="0 0 735 90" role="img" focusable="false" aria-label="Brain death determination: prerequisites, clinical examination sequence, apnea testing, and ancillary studies" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
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
                      <br/>• Adults: SBP <strong>&ge; 100 mmHg</strong> <strong>and</strong> MAP <strong>&ge; 75 mmHg</strong> (2023 AAN/AAP/CNS/SCCM)
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
                    <br/>• SBP &lt; 100 mmHg <strong>and/or</strong> MAP &lt; 75 mmHg.
                    <br/>• SpO2 &lt; 85%.
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
              <strong>AAN 2010 Guideline Update:</strong> Wijdicks EF, et al. Evidence-based guideline update: determining brain death in adults. <em>Neurology</em>. 2010;74(23):1911-1918. <a href="https://pubmed.ncbi.nlm.nih.gov/20530327/" target="_blank">PMID: 20530327</a>. (Found insufficient evidence on newer ancillary tests; the Section 4 accept/reject criteria follow the 2023 consensus guideline.)
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
            <svg viewBox="0 0 735 90" role="img" focusable="false" aria-label="Post-stroke seizures: classification, antiseizure medication selection, and SeLECT risk stratification" style={{width: '100%', height: '90px', marginBottom: '8px'}}>
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
                      <br/>• <strong>AIS &amp; ICH:</strong> Routine ASM prophylaxis is <strong>not recommended</strong> (Class III).
                      <br/>• <strong>aSAH:</strong> Routine prophylaxis is <strong>not beneficial</strong> (Class III); however, a short course (3-7 days) <em>may</em> be considered in high-risk features (MCA aneurysm, high-grade SAH, hydrocephalus, or cortical infarction) (Class IIb).
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
                  </table>
                  <div style={{fontSize: '7.2pt', borderTop: '1px dashed rgba(74,90,109,0.3)', paddingTop: '4px', lineHeight: '1.2'}}>
                    <strong>Interpretation:</strong> Score 0 (1.3% risk at 5yr), Score 3 (9% risk at 5yr), Score 6 (34% risk at 5yr), Score 9 (83% risk at 5yr).
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
                    <td style={{padding: '4px'}}><span style={{color: 'var(--red)', fontWeight: '600'}}>Strong CYP Inducer:</span> <strong>Lowers DOAC &amp; statin levels</strong> (highly discouraged!).</td>
                    <td style={{padding: '4px'}}>Ataxia, nystagmus, gingival hypertrophy, osteoporosis.</td>
                  </tr>
                </tbody>
              </table>
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
                <li><strong>50–69%:</strong> moderate benefit &mdash; 5-y ipsilateral stroke 15.7% surgical vs 22.2% medical, <strong>ARR 6.5%</strong>, NNT 15 (NASCET, PMID 9811916); greater in men and with hemispheric symptoms. <strong>&lt;50%:</strong> no benefit.</li>
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
              <svg viewBox="0 0 735 178" role="img" focusable="false" aria-label="Axial arterial territory map, cortical and internal watershed patterns, and the circle of Willis collateral ring" style={{ width: '100%', height: 'auto' }}>
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
                <li><strong>BP target (INTERACT2 / ATACH-2):</strong> Smooth, rapid lowering to <strong>SBP &lt;140 mmHg</strong> (target range 130–150; avoid acute drops &lt;130 mmHg &mdash; Class III: Harm). First-line IV nicardipine, clevidipine, or labetalol.</li>
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
              <svg viewBox="0 0 735 168" role="img" focusable="false" aria-label="Reversible cerebral vasoconstriction syndrome: RCVS-squared score, angiographic course, and phase-dependent complications" style={{ width: '100%', height: 'auto' }}>
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
                  <br />&bull; <strong>Extracranial:</strong> Individualize single antiplatelet vs anticoagulation for 3–6 months (CADISS: no difference, 2% vs 1%, P=0.63; TREAT-CAD: aspirin <strong>NOT</strong> non-inferior to VKA, 23% vs 15%, ischemic stroke 8% vs 0%; STOP-CAD: favors anticoagulation in occlusive dissection, bleeding rises by day 180). DAPT is an accepted alternative but was never the tested comparator.
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
                    <td>sICH: <strong>0 (apixaban) vs 7 patients (aspirin, 1.1%/yr)</strong>; other major hemorrhage 0.7%/yr vs 0.8%/yr (HR 1.02, 95% CI 0.29–3.52). <strong>Biomarker-defined atrial cardiopathy DOES NOT justify anticoagulation</strong> without documented rhythm proof of atrial fibrillation.</td>
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
                    <td><strong>Genetic testing:</strong> NOTCH3 exons 2–24 (EGFR repeats). Skin biopsy: Granular osmiophilic material (GOM).<br /><span style={{ color: 'var(--red-deep)' }}><strong>CAUTION:</strong> triptans/ergots (vasoconstrictive). IV thrombolysis is <strong>not</strong> contraindicated in CADASIL &mdash; data are limited but do not show excess hemorrhage; decide case by case, weighing microbleed and leukoaraiosis burden.</span></td>
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
      <text x="510" y="60" fill="var(--ink-soft)" fontSize="4.8pt" fontFamily="IBM Plex Sans">Rebleeding: Bypass 11.9% vs Medical 31.6% (P=0.042)</text>
      {/* Forest plot bar */}
      <line x1="560" y1="72" x2="680" y2="72" stroke="var(--rule)" strokeWidth="1" />
      <line x1="620" y1="66" x2="620" y2="78" stroke="var(--ink-mute)" strokeWidth="1" />
      <rect x="582" y="69" width="16" height="6" fill="var(--teal)" />
      <line x1="570" y1="72" x2="610" y2="72" stroke="var(--teal-deep)" strokeWidth="1.5" />
      <text x="609" y="82" fill="var(--teal-deep)" fontSize="4.8pt" fontFamily="Outfit" fontWeight="800" textAnchor="middle">Rebleeding HR 0.355 (95% CI 0.125–1.009)</text>

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
                  <br />&bull; <strong>Target Population:</strong> JAM randomized <em>hemorrhagic</em> adult moyamoya only. <span style={{ color: 'var(--red-deep)' }}>No completed randomized trial supports revascularization in adult <em>non-hemorrhagic</em> (ischemic) moyamoya</span> &mdash; practice there rests on observational series and physiologic rationale.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.5pt' }}>Indirect Synangiosis (EDAS / EMS)</strong>
                  <br />&bull; Encephalo-duro-arterio-synangiosis (EDAS) or Encephalo-myo-synangiosis (EMS): suturing vascularized galea, dural flap, or temporalis muscle to pial surface.
                  <br />&bull; <strong>Mechanism:</strong> Relies on spontaneous neoangiogenesis over 3–6 months.
                  <br />&bull; <strong>Target Population:</strong> Children (&lt;10y) with small donor/recipient vessels (&lt;0.8 mm); combined with direct bypass (EDAMS) in adolescents/adults.
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
                  <br />&bull; Primary bilateral stenosing arteriopathy without systemic disease.
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
                    <td>&bull; Highly suggestive of a systemic intravascular coagulopathy or central embolic source (NBTE, paradoxical embolism, or tumor thrombus): acute lesions in &ge;2 territories in 84% of hypercoagulable cancer-related strokes, though the pattern is shared with other systemic embolic/coagulopathic states.<br />&bull; Excludes in-situ large artery atherosclerosis as the sole etiology.</td>
                  </tr>
                  <tr>
                    <td><strong>Markedly Elevated D-Dimer</strong></td>
                    <td>Serum D-Dimer <strong>&gt;3.0–5.0 &micro;g/mL FEU</strong> (frequently &gt;10.0–20.0 &micro;g/mL), markedly out of proportion to typical thromboembolic stroke volume.</td>
                    <td>&bull; Marked elevation supports a cancer-related hypercoagulable mechanism (mean D-dimer 15.4 &plusmn; 10.8 &micro;g/mL in cancer-related stroke; Schwarzbach 2015).<br />&bull; Correlates with circulating tumor-derived microparticles and ongoing intravascular fibrin turnover.</td>
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
        <text x="6" y="22" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">mRS shift: common OR 0.90 (0.67–1.22); P=0.50</text>
        <text x="6" y="31" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">sICH: 5.9% EVT vs 2.6% Med &bull; 12m neutral (Lancet 2026)</text>

        <rect x="0" y="40" width="222" height="34" rx="3" fill="#f8fafc" stroke="var(--rule)" strokeWidth="1" />
        <text x="6" y="52" fill="var(--ink)" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">ESCAPE-MeVO Trial (NEJM 2025; PMID 39908448)</text>
        <text x="6" y="62" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">mRS 0–1: 41.6% EVT vs 43.1% Usual (aRR 0.95; P=0.61)</text>
        <text x="6" y="70" fill="var(--red-deep)" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">sICH: 5.4% EVT vs 2.2% Med &bull; Neutral functional effect</text>

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
                    <td>Isolated MeVO (non-dominant/co-dominant M2, M3/M4, A1–A3, P1–P3) within 24h; n=543 (median age 77, median NIHSS 6, IVT in 65.4%) randomized to EVT + best medical treatment vs best medical treatment alone.</td>
                    <td><strong>Neutral:</strong> No difference in 90-day mRS distribution (common OR for improvement 0.90; 95% CI 0.67–1.22; P=0.50). All-cause mortality 15.5% vs 14.0%.</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH numerically higher with EVT:</strong> 5.9% vs 2.6% (best medical treatment). 12-month outcomes remained neutral (Lancet Neurol 2026; PMID: 42105785). Routine unselected EVT is not supported.</span></td>
                  </tr>
                  <tr>
                    <td><strong>ESCAPE-MeVO</strong><br />(NEJM 2025; PMID: 39908448)</td>
                    <td>MeVO within 12h of last-known-well with favorable baseline non-invasive brain imaging; n=530 enrolled across five countries.</td>
                    <td><strong>Neutral:</strong> 90-day mRS 0–1 in 106/255 (41.6%) with EVT vs 118/274 (43.1%) with usual care (adjusted rate ratio 0.95; 95% CI 0.79–1.15; P=0.61).</td>
                    <td><span style={{ color: 'var(--red-deep)' }}><strong>sICH:</strong> 5.4% in EVT group vs 2.2% in control group. Unselected thrombectomy in minor/moderate MeVO stroke carries procedural risk without net benefit.</span></td>
                  </tr>
                  <tr>
                    <td><strong>CHOICE &amp; CHOICE-2</strong><br />(JAMA 2022 / 2026; PMIDs: 35143603, 42096239)</td>
                    <td>Adjunctive intra-arterial (IA) Alteplase 0.225 mg/kg after thrombectomy within 24h with eTICI 2b50–3: CHOICE max 22.5 mg over 15–30 min; CHOICE-2 max 20 mg over 15 min.</td>
                    <td><strong>CHOICE</strong> (phase 2b, stopped early; authors call findings preliminary): mRS 0–1 59.0% vs 40.4% (adjusted risk difference 18.4%; 95% CI 0.3%–36.4%; P=.047). <strong>CHOICE-2:</strong> mRS 0–1 57.5% vs 42.5% (aRD 15.0%; 95% CI 5.7%–24.3%; P=.002), but 90-day mortality 12.1% vs 6.4% (aRD 5.9%; P=.03).</td>
                    <td><span style={{ color: '#166534' }}>sICH: CHOICE 0% vs 3.8%; CHOICE-2 1.4% vs 0.5% (aOR 3.10; 95% CI 0.32–30.0; P=.33). Clears downstream distal microvascular microthrombi and improves microcirculatory reperfusion.</span></td>
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
              { label: 'DISTAL Trial', cite: 'Fischer U et al. N Engl J Med. 2025;392(14):1374-1384.', pmid: '39908430' },
              { label: 'DISTAL 12-Month', cite: 'Fischer U et al. Lancet Neurol. 2026;25(6):571-580.', pmid: '42105785' },
              { label: 'ESCAPE-MeVO Trial', cite: 'Goyal M et al. N Engl J Med. 2025;392(14):1385-1395.', pmid: '39908448' },
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
        <text x="8" y="49" fill="#166534" fontSize="5.4pt" fontFamily="Outfit" fontWeight="800">TARGET: SBP 140 mmHg (range 130–150) within 1 Hour</text>
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
        <text x="6" y="22" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">No DM: 110–140 mg/dL (6.1–7.8)</text>
        <text x="6" y="32" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">DM: 140–180 mg/dL (7.8–10.0)</text>
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
        <text x="6" y="29" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Overall 180d utility mRS 0.458 vs 0.374 (benefit driven by lobar)</text>

        <rect x="0" y="38" width="221" height="34" rx="3" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1" />
        <text x="6" y="49" fill="#166534" fontSize="5.2pt" fontFamily="Outfit" fontWeight="800">SWITCH Trial (Lancet 2024; PMID 38761811)</text>
        <text x="6" y="59" fill="var(--ink)" fontSize="4.3pt" fontFamily="IBM Plex Sans">Decompressive craniectomy in severe deep basal ganglia ICH</text>
        <text x="6" y="67" fill="#b45309" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">mRS 5-6 44% vs 58%, p=0.057 (NS) &bull; stopped early &bull; weak evidence</text>

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
              INTERACT-2/3 &bull; ATACH-2 &bull; ENRICH &bull; TRIDENT &bull; SWITCH &bull; 2022 AHA/ASA ICH Guidelines &bull; SBP 140 Target (range 130–150)
            </p>

            <div style={{ width: '100%', height: '168px', marginBottom: '6px' }}>
              {renderSVG()}
            </div>

            {/* §1 Hyperacute Blood Pressure Protocol (purple) */}
            <CardSection color="purple" title="1. Hyperacute Blood Pressure Protocol &amp; The Renal Safety Floor">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.35', color: 'var(--ink-soft)' }}>
                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Target Blood Pressure Window</strong>
                  <br />&bull; <strong>Primary Target (Class IIb, LOE B-R):</strong> SBP <strong>140 mmHg</strong>, maintained in the <strong>130–150 mmHg</strong> range, reached smoothly within <strong>1 hour</strong>. Scope: mild-to-moderate ICH presenting with SBP 150&ndash;220 mmHg. <span style={{ color: 'var(--red-deep)' }}>Lowering to SBP &lt;130 mmHg is Class III: Harm.</span>
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
                    <td>Primary outcome (mRS 3–6 at 90 days) neutral: 52.0% vs 55.6% (OR 0.87; 95% CI 0.75–1.01; p=0.06). Prespecified ordinal analysis favoured intensive treatment (OR 0.87; 95% CI 0.77–1.00; p=0.04). No excess adverse events.</td>
                    <td><span style={{ color: '#166534' }}>Established the safety of an SBP &lt;140 mmHg target in hyperacute ICH, with a favourable ordinal signal on function.</span></td>
                  </tr>
                  <tr>
                    <td><strong>INTERACT3</strong><br />(Lancet 2023; PMID: 37245517)</td>
                    <td>Pragmatic stepped-wedge cluster trial (n=7,036) testing a 4-pillar care bundle: BP &lt;140, glucose &lt;180, temp &lt;37.5&deg;C, anticoagulant reversal.</td>
                    <td><strong>Favourable ordinal shift in mRS at 6 months:</strong> common OR 0.86 (95% CI 0.76–0.97; p=0.015); fewer serious adverse events (16.0% vs 20.1%; p=0.0098).</td>
                    <td><span style={{ color: '#166534' }}>Structured multi-target bundle implementation delivers substantial real-world clinical recovery.</span></td>
                  </tr>
                  <tr>
                    <td><strong>TRIDENT Trial</strong><br />(NEJM 2026; PMID: 42019018)</td>
                    <td>Fixed-dose triple combination pill (Telmisartan + Amlodipine + Indapamide) vs placebo for long-term BP lowering after ICH.</td>
                    <td>Sustained ~11 mmHg SBP difference (mean 127 vs 138 mmHg on follow-up); recurrent stroke 4.6% vs 7.4% (HR 0.61; 95% CI 0.41–0.92; p=0.02). Early discontinuation for adverse events 13.6% vs 6.0%, most often a &ge;20% creatinine rise.</td>
                    <td><span style={{ color: '#166534' }}>Long-term secondary prevention requires aggressive combination therapy to maintain SBP &lt;130.</span></td>
                  </tr>
                  <tr>
                    <td><strong>FASTEST Trial</strong><br />(Lancet 2026; PMID: 41653933)</td>
                    <td>Ultra-early recombinant Factor VIIa (rFVIIa) within 2 hours of spontaneous ICH onset.</td>
                    <td><strong>Stopped for futility.</strong> No functional benefit at 180d (adjusted common OR 1.09; 95% CI 0.79–1.51; p=0.61) despite reduced hematoma growth (&minus;3.7 mL); life-threatening thromboembolic events 15 (&lt;5%) vs 4 (1%), RR 3.41 (95% CI 1.14–10.15; p=0.020).</td>
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
                  <br />&bull; <strong>Overall Result:</strong> 180-day utility-weighted mRS <strong>0.458 vs 0.374</strong> (difference 0.084; 95% CrI 0.005&ndash;0.163; posterior probability of superiority 0.981); 30-day mortality 9.3% vs 18.0%.
                  <br />&bull; <strong>Effect Driven by Lobar ICH:</strong> lobar difference 0.127 (95% CrI 0.035&ndash;0.219); anterior basal ganglia neutral (&minus;0.013; 95% CrI &minus;0.147 to 0.116).
                </div>

                <div style={{ border: '1.5px solid var(--teal)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--teal-deep)', fontSize: '7.6pt' }}>SWITCH Trial: Decompressive Surgery</strong>
                  <br />&bull; <strong>Design (Lancet 2024; PMID: 38761811):</strong> Hemicraniectomy (&ge;12 cm bone flap) + best medical care vs medical care alone in deep supratentorial ICH with deteriorating GCS.
                  <br />&bull; <strong>Result:</strong> Primary outcome was mRS 5&ndash;6 at 180 days: 44% (42/95) with decompressive craniectomy vs 58% (55/95) with best medical treatment &mdash; adjusted RR 0.77 (95% CI 0.59&ndash;1.01), adjusted risk difference &minus;13% (95% CI &minus;26 to 0), <strong>p=0.057, not statistically significant</strong>. Stopped early for lack of funding; the authors describe this as weak evidence, and survival was associated with severe disability in both arms.
                  <br />&bull; Indicated as a life-saving rescue maneuver for progressive herniation.
                </div>

                <div style={{ border: '1.5px solid var(--purple)', borderRadius: '5px', padding: '5px 7px', background: '#ffffff' }}>
                  <strong style={{ color: 'var(--purple-deep)', fontSize: '7.6pt' }}>Cerebellar Hemorrhage Rules</strong>
                  <br />&bull; <strong>Immediate Suboccipital Decompression (COR 1):</strong> For cerebellar ICH with <strong>neurological deterioration, brainstem compression, and/or obstructive hydrocephalus</strong>. Diameter &gt;3 cm is a risk marker prompting close monitoring and early neurosurgical involvement &mdash; not a stand-alone Class 1 operative indication (Kuramatsu, JAMA 2019; PMID 31593272).
                  <br />&bull; Place EVD for hydrocephalus, but craniectomy must accompany EVD to prevent upward herniation.
                </div>
              </div>
            </CardSection>

            {/* §4 Expansion Predictors & Neurocritical Management (slate) */}
            <CardSection color="slate" title="4. Expansion Imaging Predictors &amp; Neurocritical Care Bundle">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '7.0pt', lineHeight: '1.32', color: 'var(--ink-soft)' }}>
                <div>
                  <strong style={{ color: 'var(--ink)', fontSize: '7.4pt' }}>Imaging Markers of Expansion</strong>
                  <br />&bull; <strong>CTA Spot Sign:</strong> Contrast extravasation into the hematoma. PREDICT reported sensitivity 51%, specificity 85%, PPV 61%, NPV 78% &mdash; a <strong>negative spot sign does NOT exclude expansion</strong>.
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
              { label: 'INTERACT3', cite: 'Ma L et al. Lancet. 2023;402(10395):27-40.', pmid: '37245517' },
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
        <text x="6" y="100" fill="var(--ink-soft)" fontSize="4.3pt" fontFamily="IBM Plex Sans">SPRINT excluded prior stroke &bull; TRIDENT is post-ICH triple pill</text>
        <text x="6" y="109" fill="#15803d" fontSize="4.3pt" fontFamily="IBM Plex Sans" fontWeight="700">Stroke: RESPECT meta-analysis &bull; MCI: SPRINT MIND (30688979)</text>
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
                  <br />&bull; <strong>SUSTAIN-6 (NEJM 2016; PMID: 27633186):</strong> Demonstrated a <strong>39% relative reduction in nonfatal stroke (1.6% vs 2.7%; HR 0.61, 95% CI 0.38–0.99; p=0.04)</strong> in T2D patients with high CV risk.
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
                    <td><strong>SPRINT (NEJM 2015; PMID: 26551272):</strong> 25% reduction in primary composite CV events; 43% reduction in CV death &mdash; but <em>excluded prior stroke</em>, so the secondary-prevention target is extrapolated.<br /><strong>RESPECT (JAMA Neurol 2019; PMID: 31355878):</strong> In prior-stroke patients HR 0.73 (95% CI 0.49–1.11, NS); its updated meta-analysis supports &lt;130/80 mmHg (RR 0.78; 95% CI 0.64–0.96; NNT 67).</td>
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
                  <br />&bull; <strong>B (Blood Pressure):</strong> SBP &lt;130/80 mmHg (&lt;120 mmHg in selected SVD). TRIDENT (<em>post-ICH</em>, baseline SBP 130–160): low-dose triple pill cut recurrent stroke 4.6% vs 7.4% (HR 0.61); 13.6% vs 6.0% stopped for adverse events, most often a &ge;20% creatinine rise.
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
                  <li><strong>Large-artery atherosclerosis (TOAST aetiology):</strong> Yes (1 pt).</li>
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
                  <li><strong>Score 6-9:</strong> 1y risk 17.9-63%, 5y risk 31.6-83% (Very High).</li>
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


