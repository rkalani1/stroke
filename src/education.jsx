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
    id: 'telestroke-map',
    title: 'Telestroke Network Map',
    purpose: 'Regional telestroke coverage and expansion map for service planning. NOT a clinical decision tool.',
    actions: 'Open map in new tab',
    lastReviewed: '2026-05-30',
    categories: ['printable', 'pocket-card'],
    external: true,
    url: 'https://rkalani1.github.io/telestroke-expansion-map/'
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
    default:
      return <p className="text-xs">Module content not found.</p>;
  }
}
