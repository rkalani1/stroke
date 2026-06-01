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
      { label: 'CATALYST Meta-Analysis', citation: 'Fischer U et al. Lancet 2025.', pmid: '40570866' },
      { label: 'AFib Guidelines', citation: 'Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. Circulation. 2024;149:e1-e156.', pmid: '38043043' }
    ]
  },
  {
    id: 'herniation-icp',
    title: 'Intracranial Hypertension & ICP Management',
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
    title: 'EVD Maintenance & Leveling',
    purpose: 'Interactive EVD system simulator, transducer zeroing guide, and clinical complications checklist.',
    actions: 'evd external ventricular drain leveling zeroing tragus overdrainage underdrainage csf',
    categories: ['simulators', 'printable', 'icu'],
    lastReviewed: '2026-05-31',
    references: [
      { label: 'EVD Consensus Statement', citation: 'Bales JW, et al. External Ventricular Drains: A Consensus Statement. Neurocrit Care. 2021.', pmid: '32227294' }
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

const EvdMaintenanceView = () => {
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
          Interactive EVD Simulator
        </button>
      </div>

      {viewMode === 'pocket-card' ? (
        <EVDInfographic />
      ) : (
        <ErrorBoundary>
          <div className="bg-white border border-line rounded-lg p-6 dark:bg-card">
            <div className="v7-callout v7-callout-critical p-3 mb-4 bg-red-50 text-red-900 border border-red-200 rounded-lg dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60">
              <h3 className="font-bold text-xs uppercase mb-1">🛑 Safety Notice — EVD Orders</h3>
              <p className="text-xs">Never change EVD drain height, clamp orders, or flush an EVD independently. All EVD manipulations must be explicitly authorized by Neurosurgery or Neurocritical Care.</p>
            </div>
            <EvdIcpSimulator />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

const IcpManagementView = () => {
  const [viewMode, setViewMode] = useState('pocket-card'); // 'pocket-card', 'escalation', or 'interactive'
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
          onClick={() => setViewMode('escalation')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px] ${
            viewMode === 'escalation'
              ? 'bg-cobalt-600 text-white shadow-sm'
              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700'
          }`}
        >
          Escalation Pathway Card
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
      ) : viewMode === 'escalation' ? (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <HerniationIcpCard />
        </ScaledCardWrapper>
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
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <ToastClassificationCard />
        </ScaledCardWrapper>
      );
    case 'dapt-regimens':
      return (
        <ScaledCardWrapper isLandscape={true}>
          <BedsidePocketCardsStyles />
          <DaptRegimensCard />
        </ScaledCardWrapper>
      );
    case 'malignant-infarction':
      return (
        <ScaledCardWrapper isLandscape={false}>
          <BedsidePocketCardsStyles />
          <MalignantInfarctionCard />
        </ScaledCardWrapper>
      );
    case 'afib-anticoag-timing':
      return (
        <ScaledCardWrapper isLandscape={true}>
          <BedsidePocketCardsStyles />
          <AfibAnticoagTimingCard />
        </ScaledCardWrapper>
      );
    case 'herniation-icp':
      return <IcpManagementView />;
    case 'evd-maintenance':
      return <EvdMaintenanceView />;
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
      overflow: hidden;
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
            <li><strong>Imaging:</strong> Cortical/subcortical infarct <strong>&gt; 1.5 cm</strong> on MRI or CT.</li>
            <li><strong>Vascular:</strong> <strong>&gt; 50% stenosis</strong> or occlusion of the relevant major extracranial (carotid, vertebral) or intracranial artery.</li>
            <li><strong>Exclusion:</strong> Must exclude a high-risk cardioembolic source.</li>
          </ul>
        </div>
        
        <div className="toast-card secondary">
          <h3>2. Small-Vessel Occlusion (SVO / Lacune)</h3>
          <ul className="toast-card-list">
            <li><strong>Clinical:</strong> Classic lacunar syndrome (pure motor, pure sensory, sensorimotor, ataxic hemiparesis, clumsy hand) <strong>WITHOUT</strong> cortical signs.</li>
            <li><strong>Imaging:</strong> Normal scan or deep subcortical lesion <strong>≤ 1.5 cm</strong>.</li>
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
              <strong style={{color: 'var(--red-deep)', fontSize: '8.2pt', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>High-Risk Sources (AC)</strong>
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
    <h1 style={{textAlign: 'center', marginBottom: '4px'}}>DAPT for Non-Cardioembolic Ischemic Stroke</h1>
    <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '6px', textAlign: 'center', fontWeight: '500'}}>
      Guideline-directed Dual Antiplatelet Therapy (DAPT) for secondary non-cardioembolic stroke prevention.
    </p>

    
    <svg viewBox="0 0 735 240" style={{width: '100%', height: '210px', marginBottom: '6px'}}>
      
      <rect x="0" y="0" width="735" height="240" rx="8" fill="var(--fill-soft)" stroke="var(--rule-soft)" strokeWidth="1"/>
      
      
      <rect x="292" y="10" width="150" height="35" rx="6" fill="var(--purple-deep)" />
      <text x="367" y="23" fill="white" fontSize="8.5pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">ACUTE STROKE / TIA</text>
      <text x="367" y="36" fill="rgba(255,255,255,0.8)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">Non-Cardioembolic Onset</text>
      
      
      <path d="M 367 45 L 367 60 M 120 60 L 615 60 M 120 60 L 120 75 M 367 60 L 367 75 M 615 60 L 615 75" stroke="var(--purple)" strokeWidth="1.5" fill="none"/>
      
      
      <rect x="35" y="75" width="170" height="40" rx="6" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5"/>
      <text x="120" y="90" fill="var(--teal-deep)" fontSize="8pt" fontFamily="Outfit" fontWeight="700" textAnchor="middle">Symptomatic IC Stenosis</text>
      <text x="120" y="102" fill="var(--ink-soft)" fontSize="7pt" fontFamily="IBM Plex Sans" textAnchor="middle">70-99% Stenosis (SAMMPRIS)</text>
      
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
          <th style={{padding: '4px 6px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', width: '22%'}}>Scenario / Trial</th>
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
            Severe symptomatic stenosis (70-99%) of major intracranial artery.
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
          • <strong>~30% of US stroke patients</strong> carry a loss-of-function (LOF) allele (<strong>*2, *3</strong>), resulting in poor active metabolite generation and a 2x stroke recurrence rate.
        </p>
      </div>

      
      <div className="dapt-pearl-card red">
        <strong style={{color: 'var(--red-deep)', fontSize: '8.5pt', display: 'block', marginBottom: '4px'}}>Just Safety</strong>
        <p style={{fontSize: '7.6pt', color: 'var(--ink-soft)', margin: '0', lineHeight: '1.45'}}>
          • **Bleeding vs. Benefit**: DAPT beyond 21 days for minor stroke/TIA increases bleeding (including ICH) without reducing recurrence (POINT/CHANCE).
          <br/>• **Post-Lytic Policy**: Avoid DAPT in patients who received TNK or EVT (unless specifically requested by neurointerventions for stent).
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
          <div>mRS 0–3: Functional Independence / Mild-Mod Disability</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-4"></div>
          <div>mRS 4: Moderately Severe (Walk with assistance)</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-5"></div>
          <div>mRS 5: Severe Disability (Bedbound)</div>
        </div>
        <div className="legend-item">
          <div className="legend-dot bar-mrs-6"></div>
          <div>mRS 6: Death</div>
        </div>
      </div>
      
      <div style={{fontSize: '7pt', lineHeight: '1.25', marginTop: '4px', color: 'var(--ink-soft)', textAlign: 'center', borderTop: '1px dashed var(--rule)', paddingTop: '3px'}}>
        • **Age &lt; 60**: NNT = 2 for survival, NNT = 4 for mRS ≤3. | • **Age ≥ 60**: NNT = 3 for survival, NNT = 25 for mRS ≤3. *Goals-of-care discussion critical.
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
            <td style={{padding: '4px 0', color: 'var(--ink-soft)'}}>Use Isotonic Saline (0.9% NS). <strong>Avoid hypotonic fluids</strong> (e.g. D5W, 0.45% NS, LR) which worsen edema. Maintain euvolemia.</td>
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
    <h1 style={{textAlign: 'center', marginBottom: '4px'}}>AFib Anticoagulation Restart Timing After Acute Ischemic Stroke</h1>
    <p style={{fontSize: '8.8pt', color: 'var(--ink-soft)', marginBottom: '12px', textAlign: 'center', fontWeight: '500'}}>
      Evidence-based schedule for starting or restarting DOACs after acute ischemic stroke or TIA.
    </p>

    
    <div style={{borderLeft: '4px solid var(--teal)', background: 'var(--teal-soft)', padding: '6px 10px', borderRadius: '6px', fontSize: '7.8pt', marginBottom: '4px', lineHeight: '1.45', boxShadow: '0 2px 8px var(--teal-glow)'}}>
      <strong style={{color: 'var(--teal-deep)', textTransform: 'uppercase', fontSize: '7.2pt', letterSpacing: '0.05em', display: 'block', marginBottom: '1px'}}>Clinical Efficacy & Safety</strong>
      Early DOAC initiation in patients with AFib and recent stroke is safe and reasonable (Class I, LOE A). It does not increase the risk of symptomatic intracranial hemorrhage (sICH) compared to delayed initiation, and reduces recurrent ischemic stroke. DOACs are preferred over warfarin.
    </div>

    
    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '6px 8px', background: 'var(--fill-soft)', marginBottom: '4px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '9.0pt', display: 'block', marginBottom: '4px'}}>1. Stroke Severity Classification (ELAN Criteria)</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '8.8pt', lineHeight: '1.45'}}>
        <div style={{border: '1px solid rgba(24,132,158,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--teal-deep)', display: 'block'}}>Mild Stroke (NIHSS &lt; 8)</strong>
          • TIA or infarct <strong>&lt; 1.5 cm</strong> on brain imaging (cortical or deep subcortical).
        </div>
        <div style={{border: '1px solid rgba(217,134,11,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--amber-deep)', display: 'block'}}>Moderate (NIHSS 8–15)</strong>
          • Occlusion of a <strong>single superficial branch</strong> of the MCA, PCA, or ACA, or isolated brainstem/cerebellar lesion.
        </div>
        <div style={{border: '1px solid rgba(198,46,46,0.2)', borderRadius: '6px', padding: '4px 6px', background: 'white'}}>
          <strong style={{color: 'var(--red-deep)', display: 'block'}}>Severe (NIHSS ≥ 16)</strong>
          • <strong>Multilobar</strong> infarct, major main stem occlusion (e.g. M1 MCA, P1 PCA, A1 ACA), or large brainstem/cerebellar lesion.
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
      <strong>CATALYST Meta-Analysis:</strong> Fischer U et al. <a href="https://pubmed.ncbi.nlm.nih.gov/40570866/" target="_blank"><em>Lancet</em> 2025; PMID: 40570866</a>. Pooled data (n=5,441) from <a href="https://pubmed.ncbi.nlm.nih.gov/37222476/" target="_blank">ELAN (PMID: 37222476)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/39491870/" target="_blank">OPTIMAS (<em>Lancet</em> 2024; PMID: 39491870)</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/36065821/" target="_blank">TIMING (<em>Circulation</em> 2022; PMID: 36065821)</a>, and <a href="https://pubmed.ncbi.nlm.nih.gov/40163159/" target="_blank">START (<em>JAMA Neurol</em> 2025; PMID: 40163159)</a>. Early DOAC (median Day 2) is non-inferior to delayed (median Day 7–8) with equivalent low sICH (0.6% vs 0.7%).<br/>
      <strong>AFib Guidelines:</strong> Joglar JA et al. 2023 ACC/AHA/ACCP/HRS Guideline. <em>Circulation</em>. 2024;149:e1-e156. <a href="https://pubmed.ncbi.nlm.nih.gov/38043043/" target="_blank">PMID: 38043043</a>
    </div>
  </div>
</div>
</div>
    </div>
  );
}


export function HerniationIcpCard() {
  return (
    <div className="bedside-card-view screen-layout">
      <div className="card-wrapper card-add_figure_07_herniation_icp">
<div className="card-container" style={{boxSizing: 'border-box'}}>
  <div className="card-content">
    <h1 style={{textAlign: 'center', marginBottom: '4px', color: 'var(--red-deep)'}}>Intracranial Hypertension & Herniation due to Stroke</h1>

    
    <div style={{border: '1.5px solid var(--red)', borderRadius: '8px', padding: '6px 10px', background: 'linear-gradient(135deg, var(--red-soft) 0%, #ffffff 100%)', marginBottom: '8px', boxShadow: '0 4px 12px var(--red-glow)'}}>
      <strong style={{color: 'var(--red-deep)', fontSize: '11.0pt', display: 'block', marginBottom: '4px'}}>1. Bedside & Radiographic Signs of Impending Herniation</strong>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 15px', fontSize: '8.0pt', lineHeight: '1.35', color: 'var(--ink-soft)'}}>
        <div>
          • <strong>LOC Decline:</strong> GCS decrease of ≥2 points, stupor, progressive coma.
          <br/>• <strong>Pupils:</strong> New pupillary asymmetry or loss of reactivity.
          <br/>• <strong>Motor Deficits:</strong> New hemiparesis/plegia, extensor/flexor posturing.
        </div>
        <div>
          • <strong>Imaging Markers:</strong> Midline shift, cistern effacement, hydrocephalus.
          <br/>• <strong>Cushing's Triad (Late):</strong> Systolic HTN, bradycardia, irregular breathing.
          <br/>• <strong>Symptoms:</strong> Worsening headache, projectile vomiting.
        </div>
      </div>
    </div>

    
    <div style={{border: '1px solid var(--rule-soft)', borderRadius: '8px', padding: '8px 12px', background: 'var(--fill-soft)', marginBottom: '8px'}}>
      <strong style={{color: 'var(--purple-deep)', fontSize: '11.0pt', display: 'block', marginBottom: '6px'}}>2. Stepwise ICP & Herniation Protocol (Escalation Pathway)</strong>
      
      <div className="step-pathway">
        
        <div className="step-node" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--purple-soft)', borderRadius: '8px', overflow: 'hidden', background: 'white'}}>
          <div className="step-header step-0">
            <span className="step-num">STEP 0</span>
            <span className="step-title">BASELINE NEUROPROTECTION (Prophylaxis)</span>
          </div>
          <div className="step-body" style={{padding: '6px 10px', fontSize: '8.0pt', lineHeight: '1.3'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px'}}>
              <div>
                • <strong>Position:</strong> HOB 30° + midline head/neck position.
                <br/>• <strong>Fever:</strong> Treat T ≥38°C (scheduled acetaminophen).
                <br/>• <strong>Airway/O2:</strong> SpO2 ≥94%; propofol ± fentanyl if intubated.
              </div>
              <div>
                • <strong>Perfusion:</strong> Avoid hypotension; maintain stroke BP goals.
                <br/>• <strong>Metabolic:</strong> Glucose 140–180; euvolemia (Isotonic saline).
                <br/>• <strong>Ventilation:</strong> PaCO2 35–45. <em>(Edema peaks days 3–5).</em>
              </div>
            </div>
          </div>
        </div>
        
        <div className="step-arrow" style={{textAlign: 'center', color: 'var(--purple-deep)', margin: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}}>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
          <span style={{fontSize: '7.8pt', fontWeight: '700', color: 'var(--purple-deep)', background: '#f3ebff', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--purple-soft)', boxShadow: '0 2px 4px rgba(106, 27, 154, 0.05)', display: 'inline-block'}}>
            TRIGGER: GCS decline ≥2, pupillary asymmetry/reactivity loss, OR sustained monitored ICP &gt;22 mmHg
          </span>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
        </div>
        
        
        <div className="step-node" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--purple-soft)', borderRadius: '8px', overflow: 'hidden', background: 'white'}}>
          <div className="step-header step-1">
            <span className="step-num">STEP 1</span>
            <span className="step-title">TARGETED OSMOTHERAPY (First-Line Medical)</span>
          </div>
          <div className="step-body" style={{padding: '6px 10px', fontSize: '8.0pt', lineHeight: '1.3'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px'}}>
              <div>
                • <strong>Consults:</strong> STAT Neuro ICU and Neurosurgery.
                <br/>• <strong>Imaging:</strong> Urgent non-contrast head CT.
              </div>
              <div>
                • <strong>3% HTS:</strong> 250–500 mL IV bolus over 20 min (large-bore PIV OK).
                <br/>• <strong>20% Mannitol:</strong> 0.5–1.0 g/kg IV bolus (In-line filter).
              </div>
            </div>
          </div>
        </div>
        
        <div className="step-arrow" style={{textAlign: 'center', color: 'var(--purple-deep)', margin: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}}>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
          <span style={{fontSize: '7.8pt', fontWeight: '700', color: 'var(--red-deep)', background: 'var(--red-soft)', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--red-glow)', display: 'inline-block'}}>
            If refractory to first-line therapy or acute herniation suspected
          </span>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
        </div>
        
        
        <div className="step-node" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--purple-soft)', borderRadius: '8px', overflow: 'hidden', background: 'white'}}>
          <div className="step-header step-2">
            <span className="step-num">STEP 2</span>
            <span className="step-title">REFRACTORY RESCUE & BRIDGING (Invasive)</span>
          </div>
          <div className="step-body" style={{padding: '6px 10px', fontSize: '8.0pt', lineHeight: '1.3'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '4px 12px'}}>
              <div>
                • <strong>23.4% HTS:</strong> 30 mL IV over 10 min (<strong>Central line only</strong>).
                <br/>• <strong>Hyperventilation:</strong> PaCO2 30–35 (caution: vasoconstriction).
              </div>
              <div>
                • <strong>EVD:</strong> For obstructive hydrocephalus/IVH.
                <br/>• <strong>Cerebellar Warning:</strong> Drain conservatively; risk of upward herniation.
              </div>
            </div>
          </div>
        </div>
        
        <div className="step-arrow" style={{textAlign: 'center', color: 'var(--purple-deep)', margin: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}}>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
          <span style={{fontSize: '7.8pt', fontWeight: '700', color: 'var(--ink-soft)', background: 'var(--fill-soft)', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--rule-soft)', display: 'inline-block'}}>
            If candidate for definitive surgical decompression
          </span>
          <span style={{fontSize: '10pt', fontWeight: 'bold', opacity: '0.5'}}>↓</span>
        </div>
        
        
        <div className="step-node" style={{boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--purple-soft)', borderRadius: '8px', overflow: 'hidden', background: 'white'}}>
          <div className="step-header step-3">
            <span className="step-num">STEP 3</span>
            <span className="step-title">EMERGENCY SURGICAL DECOMPRESSION</span>
          </div>
          <div className="step-body" style={{padding: '6px 10px', fontSize: '8.0pt', lineHeight: '1.3'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px'}}>
              <div>
                • <strong>Supratentorial Infarction/ICH:</strong>
                <br/>Proceed to Decompressive Hemicraniectomy (DHC).
              </div>
              <div>
                • <strong>Infratentorial (Cerebellar):</strong>
                <br/>Suboccipital Decompression + dural expansion.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px'}}>
      
      <div style={{border: '1px solid rgba(24,132,158,0.2)', borderLeft: '4px solid var(--teal)', borderRadius: '8px', padding: '6px 10px', background: 'linear-gradient(180deg, #ffffff 0%, rgba(24,132,158,0.02) 100%)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)'}}>
        <strong style={{color: 'var(--teal-deep)', fontSize: '8.5pt', display: 'block', marginBottom: '4px'}}>Hypertonic Saline (HTS 3% / 23.4%)</strong>
        <ul style={{margin: '0', paddingLeft: '12px', fontSize: '8.0pt', lineHeight: '1.3', color: 'var(--ink-soft)', listStyleType: 'square'}}>
          <li><strong>3% HTS:</strong> 250–500 mL IV over 20 min (Peripheral large-bore OK).</li>
          <li><strong>23.4% HTS:</strong> 30 mL IV over 10 min (<strong>Central line only!</strong>).</li>
          <li><strong>Monitoring:</strong> Na, Cl, renal panel q4-6h. Avoid Na &gt;155–160.</li>
          <li><strong>Advantage:</strong> Supports euvolemia, avoids hypotension/diuresis.</li>
        </ul>
      </div>
      
      
      <div style={{border: '1px solid rgba(217,134,11,0.2)', borderLeft: '4px solid var(--amber)', borderRadius: '8px', padding: '6px 10px', background: 'linear-gradient(180deg, #ffffff 0%, rgba(217,134,11,0.02) 100%)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)'}}>
        <strong style={{color: 'var(--amber-deep)', fontSize: '8.5pt', display: 'block', marginBottom: '4px'}}>Mannitol (20% Solution)</strong>
        <ul style={{margin: '0', paddingLeft: '12px', fontSize: '8.0pt', lineHeight: '1.3', color: 'var(--ink-soft)', listStyleType: 'square'}}>
          <li><strong>Dosing:</strong> 0.5–1.0 g/kg IV bolus (In-line 0.22-micron filter required).</li>
          <li><strong>Monitoring:</strong> Serum Osm, Osmolar Gap (Measured - Calc Osm) q6h.</li>
          <li><strong>Hold Criteria:</strong> Caution if gap ≥20, high risk if gap &gt;55 or AKI/anuria.</li>
          <li><strong>Disadvantage:</strong> Osmotic diuresis (hypovolemia/hypotension), rebound ICP.</li>
        </ul>
      </div>
    </div>

    
    <div style={{borderLeft: '4px solid var(--red)', background: 'linear-gradient(90deg, var(--red-soft) 0%, #ffffff 100%)', padding: '10px 14px', borderRadius: '6px', fontSize: '8.5pt', marginBottom: '12px', lineHeight: '1.4', boxShadow: '0 4px 12px var(--red-glow)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-deep)', fontWeight: '600'}}>
      <span style={{fontSize: '11pt', lineHeight: '1'}}>⚠️</span>
      <span>Corticosteroids are not indicated for cytotoxic edema in stroke and increase infection risk.</span>
    </div>

    
    <div className="ref-citation" style={{marginTop: '0', padding: '4px 10px', fontSize: '7.5pt', lineHeight: '1.25'}}>
      <strong>AHA/ASA Guidelines:</strong> Prabhakaran S, et al. 2026 Guidelines for the Early Management of Acute Ischemic Stroke. <em>Stroke</em>. 2026. DOI: 10.1161/STR.0000000000000513. <a href="https://pubmed.ncbi.nlm.nih.gov/41582814/" target="_blank">PMID: 41582814</a>.<br/>
      <strong>Cerebral Edema:</strong> Wijdicks EF, et al. Recommendations for the Management of Cerebral and Cerebellar Infarction With Swelling. <em>Stroke</em>. 2014;45:1222–1238. <a href="https://pubmed.ncbi.nlm.nih.gov/24481970/" target="_blank">PMID: 24481970</a>.<br/>
      <strong>NCS Guidelines:</strong> Cook AM, et al. Guidelines for the Acute Treatment of Cerebral Edema in Neurocritical Care Patients. <em>Neurocrit Care</em>. 2020;32:647–666. <a href="https://pubmed.ncbi.nlm.nih.gov/32227294/" target="_blank">PMID: 32227294</a>.
    </div>
    </div>
  </div>
</div>
    </div>
  );
}

// =====================================================================
// EVD QUICK REFERENCE CARD (STATIC / PRINT-PREPARED)
// =====================================================================
export const EVDInfographic = () => {
  const [showPdf, setShowPdf] = useState(false);

  const emailDoc = () => {
    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/documents/references/EVD Quick Reference.pdf';
    const subject = encodeURIComponent('EVD Quick Reference');
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
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">EVD Quick Reference</h4>
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
            href="documents/references/EVD Quick Reference.pdf"
            download="EVD Quick Reference.pdf"
            className="px-3.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
            Download
          </a>
          <button
            onClick={emailDoc}
            className="px-3.5 py-1.5 bg-orange-700 text-white rounded-lg text-xs font-semibold hover:bg-orange-855 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
            Email
          </button>
        </div>
      </div>

      {showPdf && (
        <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-md h-[800px] no-print">
          <iframe
            src="documents/references/EVD Quick Reference.pdf"
            className="w-full h-full border-none"
            title="EVD Quick Reference PDF"
          />
        </div>
      )}

      {/* Static Quick Reference Card */}
      <div className="border border-slate-250 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        {/* Header */}
        <div className="bg-slate-800 text-white text-center py-3.5 px-4">
          <h3 className="font-serif text-lg font-bold tracking-wide">EVD Quick Reference</h3>
        </div>

        {/* Top Split Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 dark:border-slate-800">
          {/* Left Col: SVG Graphic (Vector Replacement) */}
          <div className="flex justify-center items-center p-4 bg-slate-50 dark:bg-slate-950/20 border-r border-slate-200 dark:border-slate-800">
            <img 
              src="assets/evd_photo_cropped.png" 
              alt="EVD Cylinder Setup" 
              className="max-h-[260px] object-contain rounded-md shadow-sm"
            />
          </div>

          {/* Right Col: Components & SNACC Vector Logo */}
          <div className="flex flex-col">
            <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
              Components
            </div>
            <div className="p-4 flex-grow text-xs text-slate-600 dark:text-slate-350 space-y-2">
              <ol className="list-decimal pl-4 space-y-1.5">
                <li><strong>Drainage setting:</strong> Increments of 5 cmH₂O, higher = less drainage (higher resistance).</li>
                <li><strong>Drainage stopcock:</strong> 12 o'clock = clamp/closed, 3 o'clock = open to drain.</li>
                <li><strong>Transducer and zeroing stopcock:</strong> Controls baseline calibration.</li>
                <li><strong>Collection/drip chamber:</strong> Graduated cylinder measuring CSF volume.</li>
              </ol>
              <div className="text-[10px] text-slate-400 italic mt-2">
                *Red arrow indicates the direction of CSF flow.
              </div>
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

        {/* Signs of Hydrocephalus Section */}
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
                <li>High-risk factors: Intraventricular Hemorrhage (IVH) in 3rd or 4th ventricles, compression of 4th ventricle, or high volume blood (mGS &ge; 6).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Basics Section */}
        <div>
          <div className="bg-emerald-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Basics
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-emerald-50/15 dark:bg-emerald-950/5 border-b border-slate-200 dark:border-slate-800">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Leveling:</strong> Always align the zero level of the EVD scale/transducer to the external auditory meatus (EAM) / tragus.</li>
              <li><strong>Mobilization Clamping Rules:</strong> Always CLAMP the EVD before: turning the patient, adjusting HOB, or mobilizing the patient out of bed to prevent severe overdrainage or underdrainage.</li>
              <li><strong>Waveform Validity:</strong> ICP value and waveform morphology are valid only when the EVD is clamped.</li>
              <li><strong>CSF Drainage:</strong> CSF drainage is passive: occurs only when patient ICP exceeds EVD chamber height.</li>
              <li><strong>Normal CSF Flow Benchmarks:</strong> Normal CSF production is ~20 mL/hr (~500 mL/day). Drainage &gt;20 mL/hr should trigger immediate assessment for overdrainage or chamber level escalation.</li>
            </ul>
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
    </div>
  );
};

// =====================================================================
// INTRACRANIAL HYPERTENSION AND HERNIATION CARD (STATIC / PRINT-PREPARED)
// =====================================================================
export const ICPInfographic = () => {
  const [showPdf, setShowPdf] = useState(false);

  const emailDoc = () => {
    const fullUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/documents/references/Intracranial hypertension and herniation.pdf';
    const subject = encodeURIComponent('Intracranial hypertension and herniation');
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
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Intracranial hypertension and herniation</h4>
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
            href="documents/references/Intracranial hypertension and herniation.pdf"
            download="Intracranial hypertension and herniation.pdf"
            className="px-3.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="download" className="w-3.5 h-3.5"></i>
            Download
          </a>
          <button
            onClick={emailDoc}
            className="px-3.5 py-1.5 bg-orange-700 text-white rounded-lg text-xs font-semibold hover:bg-orange-855 transition-colors flex items-center gap-1.5"
          >
            <i aria-hidden="true" data-lucide="mail" className="w-3.5 h-3.5"></i>
            Email
          </button>
        </div>
      </div>

      {showPdf && (
        <div className="border border-slate-250 rounded-xl overflow-hidden bg-white shadow-md h-[800px] no-print">
          <iframe
            src="documents/references/Intracranial hypertension and herniation.pdf"
            className="w-full h-full border-none"
            title="Intracranial hypertension and herniation PDF"
          />
        </div>
      )}

      {/* Static Quick Reference Card */}
      <div className="icp-infographic-card border border-red-200 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-md">
        {/* Header */}
        <div className="bg-slate-800 text-white text-center py-3.5 px-4 border-b border-red-200 dark:border-red-900/50">
          <h3 className="font-serif text-lg font-bold tracking-wide">Intracranial hypertension and herniation</h3>
        </div>

        {/* Clinical Signs Section */}
        <div>
          <div className="bg-rose-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Clinical Signs of Herniation
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-orange-50/10 dark:bg-orange-950/5 border-b border-slate-200 dark:border-slate-800">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Motor decline:</strong> Spontaneous GCS motor score decrease of &ge; 1 point.</li>
              <li><strong>Pupillary reactivity:</strong> Decrease in pupillary reactivity (Neurological Pupil Index, NPi &lt; 3).</li>
              <li><strong>Asymmetry:</strong> New pupillary asymmetry or unilateral dilation (ipsilateral mydriasis).</li>
              <li><strong>Focal deficit:</strong> New focal motor deficit or abnormal posturing (decorticate / decerebrate).</li>
              <li><strong>Cushing's Triad (Late Sign):</strong> Systolic hypertension, bradycardia, and irregular respirations. <span className="font-bold text-red-600 dark:text-red-400">*Cushing's Triad is a LATE, pre-terminal sign of brainstem compression. Do not wait for its onset to initiate therapy.*</span></li>
            </ul>
          </div>
        </div>

        {/* Management Section */}
        <div>
          <div className="bg-emerald-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            Management
          </div>
          <div className="p-4 text-xs text-slate-600 dark:text-slate-350 bg-emerald-50/15 dark:bg-emerald-950/5 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Hyperosmolar Therapies &amp; Hold Parameters:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li><strong>Mannitol 20% solution:</strong> 1 g/kg IV bolus over 20–30 min. Must use in-line 0.22-micron filter. <span className="font-semibold text-red-600 dark:text-red-400">Hold if Serum Osmolarity &gt; 320 mOsm/kg OR Osmolar Gap &ge; 20 mOsm/kg.</span></li>
                  <li><strong>Hypertonic Saline (23.4% NaCl):</strong> 30 mL IV bolus over 5–10 min. <span className="font-bold text-red-600 dark:text-red-400">*CENTRAL LINE ACCESS ONLY*</span> to prevent extravasation necrosis.</li>
                  <li><strong>Hypertonic Saline (3% NaCl):</strong> 150–250 mL IV bolus over 15–20 min. Large peripheral IV access is acceptable for emergent rescue. <span className="font-semibold text-red-600 dark:text-red-400">Hold HTS if Serum Sodium &gt; 155–160 mEq/L or Chloride &gt; 115–120 mEq/L.</span></li>
                </ul>
              </li>
              <li><strong>Hyperventilation:</strong> Use strictly as short-term bridge therapy (target PaCO₂ 30–35 mmHg). Avoid prolonged use due to ischemia risks.</li>
              <li><strong>Steroid Contraindication:</strong> Steroids are contraindicated for cytotoxic cerebral edema in stroke and raise infection risks.</li>
              <li><strong>Decompressive Surgery Selection Criteria:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li><strong>Malignant MCA (DHC):</strong> Age &le; 60 years, clinical decline (GCS decline &ge; 1, pupillary changes), CT/MRI infarction &ge; 50% MCA territory, within 48h of onset (DECIMAL/DESTINY trials).</li>
                  <li><strong>Cerebellar Stroke (Suboccipital Decompression):</strong> Mass effect on brainstem, 4th ventricle effacement, cerebellar herniation, or hydrocephalus.</li>
                </ul>
              </li>
              <li><strong>Simplified Escalation Pathway:</strong>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px] uppercase font-bold text-center">
                  <div className="p-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded">Tier 1: Baseline<br/><span className="font-normal text-[9px] lowercase text-slate-500 dark:text-slate-400">hob 30°, midline neck, sedation</span></div>
                  <div className="p-1 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded">Tier 2: Medical<br/><span className="font-normal text-[9px] lowercase text-slate-500 dark:text-slate-400">mannitol 1g/kg, hts 3% bolus</span></div>
                  <div className="p-1 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded">Tier 3: Bridging<br/><span className="font-normal text-[9px] lowercase text-slate-500 dark:text-slate-400">hts 23.4%, hyperventilation</span></div>
                  <div className="p-1 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded">Tier 4: Surgical<br/><span className="font-normal text-[9px] lowercase text-slate-500 dark:text-slate-400">dhc / suboccipital decomp</span></div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ICP Waveform Section */}
        <div>
          <div className="bg-blue-700 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
            ICP Waveform Analysis
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/15 flex flex-col items-center gap-4">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-250 dark:border-slate-800 w-full flex justify-center">
              <svg viewBox="0 0 420 150" className="w-full max-h-[160px] select-none" xmlns="http://www.w3.org/2000/svg">
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
          </div>
        </div>
      </div>
    </div>
  );
};
