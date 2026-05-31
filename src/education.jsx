import React, { useState, useMemo, useEffect } from 'react';
import { EvdIcpSimulator } from './simulators/EvdIcpSimulator.jsx';
import { HintsSimulator } from './simulators/HintsSimulator.jsx';
import { PupillometrySimulator } from './simulators/PupillometrySimulator.jsx';
import { NeuroExamsTool } from './simulators/NeuroExamsTool.jsx';

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
    placeholders: ["CONFIRM_TELESTROKE_PATHWAY_SOURCE", "CONFIRM_PUBLIC_SAFE_ROUTING_TEXT"]
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
    placeholders: []
  }
];

// Helper to render confirmation/review labels
const ReviewStatusBadge = ({ status }) => {
  const isOk = status === "Clinical Reference" || status === "Recruiting / Active";
  const color = isOk ? "bg-ok-100 text-ok-900 border-ok-300 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800" : "bg-caution-soft text-caution border-caution";
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${color}`}>
      {status}
    </span>
  );
};

// =====================================================================
// MAIN EDUCATION MODULE EXPORT
// =====================================================================
export default function Education({ activeSubTab, onSubTabChange, onBack, copyToClipboard, addToast }) {
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
              <div className="flex flex-col items-end gap-1 text-right">
                <ReviewStatusBadge status={activeModule.status} />
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

            <footer className="border-t border-line pt-4 text-xs space-y-2">
              <p>
                <b>Verified Evidence Source:</b> <span className="italic">{activeModule.citations}</span>
              </p>

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
              <div className="flex justify-between items-start gap-2">
                <ReviewStatusBadge status={m.status} />
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
  return (
    <div className="bg-paper border border-line rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg text-ink font-bold">EVD Alignment &amp; Herniation Rescue Blueprint</h2>
        <p className="text-xs text-mute">Bedside setups and emergency workflows for intracranial hypertension.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cobalt-600"></span>
            EVD Calibrations
          </h3>
          <div className="text-2xs space-y-2 text-ink-2">
            <div>
              <strong className="block text-ink">Zeroing Level:</strong>
              Reference point is the external auditory meatus (EAM/Tragus), corresponding to the Foramen of Monro.
            </div>
            <div>
              <strong className="block text-ink">Pressure Conversion:</strong>
              1 mmHg = 1.36 cm H2O. Standard EVD drains are set in cm H2O (e.g. +10 cm H2O = 7.4 mmHg).
            </div>
            <div>
              <strong className="block text-ink">Zeroing frequency:</strong>
              Re-level and zero after any patient repositioning or bed movement. Ensure lines are non-kinked.
            </div>
          </div>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600"></span>
            ICP Waveforms
          </h3>
          <div className="space-y-3">
            <div className="h-20 bg-slate-50 border border-line rounded p-2 flex items-center justify-center relative dark:bg-card">
              <svg className="w-full h-full" viewBox="0 0 100 30">
                {/* Normal Wave */}
                <path d="M5 25 Q15 5 25 12 T45 22 T65 24 T85 25" fill="none" stroke="var(--cobalt)" strokeWidth="1.5" />
                {/* Text Markers */}
                <text x="23" y="10" fontSize="3" className="fill-ink font-bold">P1</text>
                <text x="43" y="18" fontSize="3" className="fill-ink">P2</text>
                <text x="63" y="22" fontSize="3" className="fill-ink">P3</text>
              </svg>
              <div className="absolute bottom-1 right-2 text-[8px] text-mute font-mono">Normal: P1 &gt; P2 &gt; P3</div>
            </div>
            <div className="h-20 bg-slate-50 border border-line rounded p-2 flex items-center justify-center relative dark:bg-card">
              <svg className="w-full h-full" viewBox="0 0 100 30">
                {/* Non-compliant Wave */}
                <path d="M5 25 Q15 15 25 15 T45 5 T65 18 T85 25" fill="none" stroke="var(--critical)" strokeWidth="1.5" />
                <text x="23" y="14" fontSize="3" className="fill-ink">P1</text>
                <text x="43" y="8" fontSize="3" className="fill-critical font-bold">P2</text>
                <text x="63" y="16" fontSize="3" className="fill-ink">P3</text>
              </svg>
              <div className="absolute bottom-1 right-2 text-[8px] text-critical font-mono">Non-compliant: P2 &gt; P1</div>
            </div>
          </div>
        </div>

        <div className="p-4 border border-line bg-card rounded-md space-y-3">
          <h3 className="font-bold text-xs text-ink uppercase flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-critical"></span>
            Herniation Rescue Flow
          </h3>
          <div className="text-2xs space-y-2 text-ink-2">
            <div>
              <strong className="block text-ink">1. Position:</strong>
              HOB elevated to 30°, head straight (ensure zero venous drainage obstruction).
            </div>
            <div>
              <strong className="block text-ink">2. Ventilation:</strong>
              Brief hyperventilation to PaCO2 30-35 mmHg (causes vasoconstriction).
            </div>
            <div>
              <strong className="block text-ink">3. Osmotherapy:</strong>
              Mannitol (0.25 - 1.0 g/kg IV) or 3% Hypertonic Saline (250 mL bolus central line).
            </div>
            <div>
              <strong className="block text-ink">4. Alert:</strong>
              Neurosurgery pager STAT. Prepare for emergent EVD opening or decompression.
            </div>
          </div>
        </div>
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
