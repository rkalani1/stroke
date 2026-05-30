import React, { useState, useMemo } from 'react';

// =====================================================================
// PLACEHOLDER & CITATION SCHEMAS
// All items requiring institutional confirmation or further review are
// prefixed with CONFIRM_* or REVIEW_*.
// =====================================================================

const EDUCATION_BANNER_TEXT = "Generic educational reference only — synthetic demonstration content, not official institutional policy and not endorsed by any named institution. Example call chains, role labels, and policy targets are illustrative; verify and replace them with your own current local protocols at the bedside.";

// All values below are GENERIC, institution-neutral example labels. Each is a
// placeholder to be replaced with your own local policy, role, and call-chain
// text before any clinical use. No named institution, governance body, person,
// or policy number is referenced.
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

// =====================================================================
// DATA MODELS FOR THE 14 MODULES
// =====================================================================

const EDUCATION_MODULES = [
  {
    id: "csc-quality",
    title: "CSC Quality Metrics & Epic Guide",
    purpose: "Ensure resident documentation complies with Comprehensive Stroke Center (CSC) certification requirements, Joint Commission guidelines, and safe transitions.",
    actions: "Always record the core clinical milestones (LKW, NIHSS, lytic eligibility) during initial evaluation, and document discharge measures before sign-out.",
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
    actions: "Assess airway, head position (30° straight), stop provoking stimuli, open EVD as ordered, and notify attending/seniors/neurosurgery for ICP spikes or herniation signs.",
    categories: ["pocket-card", "icu", "printable"],
    lastReviewed: "2026-05-15",
    status: "Needs Specialist Review",
    citations: "Neurocritical Care Society Consensus Guidelines; Brain Trauma Foundation Guidelines.",
    placeholders: ["CONFIRM_HERNIATION_PHONE", "CONFIRM_NCC_CALL_CHAIN", "CONFIRM_NSGY_CALL_CHAIN", "CONFIRM_LOCAL_OSMOTHERAPY_PROTOCOL"]
  },
  {
    id: "note-routing",
    title: "Stroke Note Routing Card",
    purpose: "Provide a quick, logic-based roadmap for residents to direct note routing and co-signatures to the correct attending physician.",
    actions: "Consult the routing tree below based on the day of the week, clinical setting, and service location. Forward to the correct attending role.",
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
    actions: "Use the standard SmartPhrases (.ISTIA* for ischemic, .IPH* for hemorrhagic) and complete the mandatory clinical checklist fields.",
    categories: ["epic"],
    lastReviewed: "2026-05-12",
    status: "Needs IT Review",
    citations: "Local neurosciences EMR templates committee (your build).",
    placeholders: ["CONFIRM_EPIC_BUILD_OWNER", "CONFIRM_NEUROSCIENCE_IT_APPROVAL", "CONFIRM_TEMPLATE_FINAL_TEXT", "CONFIRM_GO_LIVE_DATE"]
  },
  {
    id: "ctp",
    title: "Simplified CTP Metrics Resident Card",
    purpose: "bedside interpretation guidelines for Computed Tomography Perfusion (CTP) to determine late-window IVT and EVT eligibility.",
    actions: "Verify Tmax and CBF mismatch parameters. Never rely on automated CTP maps alone; integrate clinical NIHSS and angiographic vessel imaging.",
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
    actions: "Screen patients against main inclusion criteria and contact the on-call research coordinator if a candidate is identified.",
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
    actions: "Perform PedNIHSS. Order STAT MRI/MRA of the brain. Immediately consult Pediatric Neurology and activate the pediatric stroke team.",
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
    actions: "Subtract 1 point for each region with acute ischemic hypodensity. Be careful not to count old infarcts or chronic small vessel changes.",
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
    actions: "Establish acute SBP target. Order STAT reversal agents based on exposures. Call neurosurgery for surgical candidates (volume/location).",
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
    actions: "Apply pneumatic compression devices immediately. Refer to the timing grid for LMWH/UFH starts based on lytic exposure and scan stability.",
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
    actions: "Perform pupillometry Q1h-Q4h in severe stroke/TBI. Report NPi < 3 or drop > 0.5 as an early indicator of brainstem compression.",
    categories: ["icu", "printable"],
    lastReviewed: "2026-05-11",
    status: "Needs ICU Review",
    citations: "Neurocritical Care Society Recommendations on Pupillometry; Oddo et al., Intensive Care Med 2018.",
    placeholders: ["CONFIRM_PUPILLOMETRY_EMR_INTEGRATION_STATUS", "CONFIRM_LOCAL_PUPILLOMETRY_USE_CASES"]
  },
  {
    id: "policy-safety-pause",
    title: "Acute Stroke Safety Pause Card",
    purpose: "Step-by-step protocol for the multidisciplinary time-out performed in the CT scanner before administering IV thrombolytics.",
    actions: "Ensure Stroke Fellow, Bedside Nurse, and Pharmacist are present. Read aloud the contraindications checklist and confirm consent.",
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
    actions: "Ensure appropriate telemetry, echo, lab workup, secondary prevention, and quality metric documentation are checked off sequentially.",
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
    actions: "Verify referral center and document encounter in the designated tele-health template. Do not post active phone lines publicly.",
    categories: ["epic"],
    lastReviewed: "2026-05-02",
    status: "Needs Admin Review",
    citations: "Example telestroke operations manual (your network).",
    placeholders: ["CONFIRM_TELESTROKE_PATHWAY_SOURCE", "CONFIRM_PUBLIC_SAFE_ROUTING_TEXT"]
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

export default function Education({ activeSubTab, onSubTabChange, onBack, copyToClipboard, addToast }) {
  // Align with the prop names supplied by the host app (app.jsx). Internally we
  // use `subTab` (the currently focused module id) and `onNavigate` (set/clear
  // the focused module). `onBack` returns to the host's home tab when present.
  const subTab = activeSubTab;
  const onNavigate = onSubTabChange || (() => {});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { key: "all", label: "All Modules" },
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
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "needs-review") {
          if (!m.placeholders || m.placeholders.length === 0) return false;
        } else if (!m.categories.includes(selectedCategory)) {
          return false;
        }
      }
      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return m.title.toLowerCase().includes(q) ||
               m.purpose.toLowerCase().includes(q) ||
               m.actions.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, search]);

  // Handle printing specific cards
  const handlePrint = (e, moduleId) => {
    e.stopPropagation();
    // Navigate to subTab first to focus display
    onNavigate(moduleId);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Render individual full detail view
  if (subTab) {
    const activeModule = EDUCATION_MODULES.find(m => m.id === subTab);
    if (activeModule) {
      return (
        <div id="tabpanel-education" role="tabpanel" aria-labelledby="tab-education" className="space-y-6 max-w-4xl mx-auto v7-reveal">
          <button
            onClick={() => onNavigate(null)}
            className="no-print inline-flex items-center gap-2 text-sm text-cobalt-700 hover:text-cobalt-900 font-semibold mb-2 min-h-[44px] dark:text-cobalt-300"
            aria-label="Back to Education Hub dashboard"
          >
            <i aria-hidden="true" data-lucide="arrow-right" className="w-4 h-4 rotate-180"></i>
            Back to Resident Education Hub
          </button>

          <div className="bg-card border border-line rounded-lg shadow-sm overflow-hidden p-6 space-y-6">
            <header className="border-b border-line pb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase text-mute tracking-wider mb-1">Stroke Cards 2026</p>
                <h1 className="font-serif text-2xl text-ink font-bold">{activeModule.title}</h1>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <ReviewStatusBadge status={activeModule.status} />
                <span className="font-mono text-[10px] text-mute">Last Reviewed: {activeModule.lastReviewed}</span>
              </div>
            </header>

            {/* Quality/Policy Disclaimer Banner */}
            <div className="v7-guardrail p-3 border border-line rounded bg-slate-50 dark:bg-paper-2">
              <i data-lucide="shield-alert" aria-hidden="true" className="w-5 h-5 text-caution shrink-0"></i>
              <p className="text-xs text-ink-2">
                <b>Disclaimer:</b> {EDUCATION_BANNER_TEXT}
              </p>
              <button
                onClick={(e) => handlePrint(e, activeModule.id)}
                className="no-print ml-auto px-2.5 py-1 text-xs bg-cobalt-100 hover:bg-cobalt-200 text-cobalt-900 rounded font-semibold min-h-[36px] dark:bg-cobalt-900 dark:hover:bg-cobalt-800 dark:text-cobalt-300"
              >
                Print Card 🖨
              </button>
            </div>

            {/* Custom Content for each SubModule */}
            <main className="space-y-6 text-sm text-ink-2">
              {renderSubModuleContent(activeModule.id, onNavigate)}
            </main>

            <footer className="border-t border-line pt-4 text-xs space-y-2">
              <p>
                <b>Verified Evidence Source:</b> <span className="italic">{activeModule.citations}</span>
              </p>
              {activeModule.placeholders.length > 0 && (
                <div className="bg-caution-soft/40 border border-caution/20 rounded p-3 mt-3">
                  <p className="font-semibold text-caution mb-2">⚠️ Institutional Placeholders Requiring Call-Chain Verification:</p>
                  <ul className="list-disc list-inside space-y-1.5 font-mono text-[11px]">
                    {activeModule.placeholders.map(p => (
                      <li key={p}>
                        <span className="text-ink font-bold">{p}</span>
                        <span className="text-mute"> → Defaults to: </span>
                        <span className="bg-caution-soft px-1 rounded text-caution font-semibold">{PLACEHOLDERS[p]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
        <h1 className="font-serif text-2xl text-ink font-bold">Resident Stroke Education Hub</h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          Bedside guides, quality documentation checklists, interactive note-routing helpers, and trials references compiled for stroke neurology rotations.
        </p>

        {/* Education disclaimer bar */}
        <div className="v6-callout v6-callout-caution flex items-center gap-3 mt-4">
          <i data-lucide="alert-triangle" aria-hidden="true" className="w-5 h-5 text-caution shrink-0"></i>
          <p className="text-xs text-caution font-medium leading-normal">
            <b>Safety Notice:</b> {EDUCATION_BANNER_TEXT}
          </p>
        </div>
      </header>

      {/* Filter and Search controls */}
      <section className="bg-card border border-line rounded-lg p-4 space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
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
              <span className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">Open Card →</span>
              <button
                onClick={(e) => handlePrint(e, m.id)}
                className="p-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono flex items-center gap-1.5 dark:bg-paper-2 dark:hover:bg-overlay dark:text-ink-2"
                title="Print this card"
              >
                <span>Print</span>
                <i data-lucide="file-output" className="w-3.5 h-3.5" aria-hidden="true"></i>
              </button>
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
};

// =====================================================================
// RENDER HELPERS FOR DETAILED MODULE VIEWS
// =====================================================================

function renderSubModuleContent(moduleId, onNavigate) {
  switch (moduleId) {
    case "csc-quality":
      return (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-confirm p-3">
            <h3 className="font-bold text-xs uppercase mb-1"> bedside target: 100% compliant documentation</h3>
            <p className="text-xs">Joint Commission regulatory reviews require explicit, non-contradictory documentation of these items in every acute stroke record.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-line rounded p-4 bg-paper">
              <h3 className="font-bold text-sm text-ink mb-2">📝 Admission & Triage Phase Checklist</h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Last Known Well (LKW):</strong> Exact date/time LKW and discovery time. If unknown, document explicitly as "unknown".
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Severity (NIHSS):</strong> Complete NIHSS on arrival. Explicitly note individual sub-scores.
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>IV Thrombolytic Rationale:</strong> Either TNK administration time, or explicit contraindications (DOAC exposure, severe hypertension, platelets, etc.).
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>EVT Rationale:</strong> In large vessel occlusion (LVO), document groin puncture time or explicit reason for no EVT (large core, distal occlusions, poor baseline).
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Dysphagia Screening:</strong> Must be performed and documented <em>prior</em> to any oral intake (food, liquids, oral meds).
                </li>
              </ul>
            </div>

            <div className="border border-line rounded p-4 bg-paper">
              <h3 className="font-bold text-sm text-ink mb-2">🏥 Wards & Discharge Phase Checklist</h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Antithrombotic Therapy:</strong> Administered by End of Hospital Day 2 (aspirin, clopidogrel, or anticoagulation).
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>AF Anticoagulation:</strong> For patients with atrial fibrillation/flutter, direct oral anticoagulants (DOAC) or warfarin must be prescribed at discharge.
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>DVT/VTE Prophylaxis:</strong> Mechanical compression on Day 1. Pharmacologic heparin/enoxaparin started by Day 2 (unless contraindicated).
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Statin Therapy:</strong> High-intensity statin (Atorvastatin 80mg) prescribed at discharge for all ischemic stroke patients.
                </li>
                <li>
                  <input type="checkbox" readOnly checked className="mr-2" />
                  <strong>Stroke Education & Disposition:</strong> Documented counseling on warning signs, risk factors, emergency activation, and scheduled outpatient follow-up.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-paper border border-line rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-ink">💻 What to Document in Epic</h3>
            <p className="text-xs">
              Make sure your admission notes utilize standard SmartTexts and do not leave fields blank. Ensure the <b>Time of Symptoms Discovery</b> and <b>Baseline modified Rankin Scale (mRS)</b> are explicitly mapped in the flowsheet cells.
            </p>
            <div className="bg-card p-3 border border-line rounded text-2xs font-mono">
              - LKW: [HH:MM] on [MM/DD/YYYY] | Discovery: [HH:MM] | Baseline mRS: [0-5]<br />
              - Presenting NIHSS: [0-42] | Dysphagia Screen: Passed / Failed / NPO<br />
              - IV TNK: Recommended / Contraindicated / Given at [HH:MM]<br />
              - Secondary Prevention: High-intensity statin + Dual Antiplatelets (DAPT) x 21 days
            </div>
          </div>
        </div>
      );

    case "evd-icp":
      return (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-critical p-3">
            <h3 className="font-bold text-xs uppercase mb-1">🛑 Safety Notice — EVD Orders</h3>
            <p className="text-xs">Never change EVD drain height, clamp orders, or flush an EVD independently. All EVD manipulations must be explicitly authorized by Neurosurgery or Neurocritical Care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-ink">🧠 ICP Waveform Interpretation</h3>
              <p className="text-xs">
                A normal ICP waveform consists of three peaks: <b>P1 (Percussion)</b> &gt; <b>P2 (Tidal)</b> &gt; <b>P3 (Dicrotic)</b>. 
              </p>
              <div className="border border-line rounded p-3 bg-card flex justify-around text-center text-xs">
                <div>
                  <span className="block font-bold text-cobalt-700 dark:text-cobalt-300">P1 (Systolic)</span>
                  <span className="text-[10px] text-mute">Arterial pulse wave</span>
                </div>
                <div>
                  <span className="block font-bold text-cobalt-700 dark:text-cobalt-300">P2 (Compliance)</span>
                  <span className="text-[10px] text-mute">Brain tissue recoil</span>
                </div>
                <div>
                  <span className="block font-bold text-cobalt-700 dark:text-cobalt-300">P3 (Dicrotic)</span>
                  <span className="text-[10px] text-mute">Aortic valve closure</span>
                </div>
              </div>
              <p className="text-xs text-critical font-semibold">
                ⚠️ Low Compliance Pattern: When P2 is elevated and exceeds P1 (P2 &gt; P1), the brain is highly non-compliant, and small volume changes will cause severe ICP spikes.
              </p>
              <div className="flex gap-2">
                <a
                  href="#/protocols/simulators"
                  onClick={() => onNavigate(null)}
                  className="px-3 py-1.5 text-xs bg-cobalt-700 hover:bg-cobalt-800 text-white rounded font-medium inline-block"
                >
                  Go to Interactive EVD Simulator →
                </a>
              </div>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-3">
              <h3 className="font-bold text-sm text-ink">🚨 Red Flags for Herniation</h3>
              <ul className="list-disc list-inside space-y-2 text-xs text-critical">
                <li>Pupillary asymmetry or fixed dilated pupil (blown pupil)</li>
                <li>Decerebrate or decorticate posturing</li>
                <li>Cushing's Triad: Hypertension, Bradycardia, Irregular breathing</li>
                <li>Acute decline in GCS / stupor</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">⏱ Immediate Bedside Actions</h3>
              <ol className="list-decimal list-inside space-y-2 text-xs">
                <li><b>Airway/Breathing/Circulation:</b> Check oxygenation and vitals.</li>
                <li><b>Head Position:</b> Ensure HOB is elevated to 30° and neck is straight (no venous compression).</li>
                <li><b>Stop Provoking Factors:</b> Avoid suctioning, agitation, or constrictive neck collars.</li>
                <li><b>Notify:</b> Page NCC Fellow/Attending, Senior Resident, and Neurosurgery on-call.</li>
                <li><b>Osmotherapy:</b> Administer hypertonic saline or mannitol bolus as ordered.</li>
              </ol>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">💊 Hyperosmolar Therapies & Dosing</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <strong>Mannitol (20%):</strong> Dose: <strong className="text-ink">0.25 to 1.0 g/kg</strong> IV bolus over 20-30 minutes. Requires filtered tubing. Monitor serum osmolality (target &lt; 320 mOsm/kg) and osmolar gap.
                </li>
                <li>
                  <strong>3% Hypertonic Saline:</strong> Dose: <strong className="text-ink">250 mL</strong> IV bolus over 10-15 minutes (typically via central line). Target serum Na 145-155 mEq/L.
                </li>
                <li>
                  <strong>23.4% Hypertonic Saline:</strong> Dose: <strong className="text-ink">30 mL</strong> IV bolus over 5-10 minutes (strictly central line, reserved for acute herniation crisis).
                </li>
              </ul>
            </div>
          </div>
        </div>
      );

    case "note-routing":
      return (
        <div className="space-y-6">
          <p className="text-xs">
            Use the logic table below to route admission, progress, and consult notes to the appropriate attending physician on service.
          </p>

          <div className="overflow-x-auto border border-line rounded">
            <table className="w-full text-xs text-left bg-card">
              <thead className="bg-paper border-b border-line text-ink font-semibold">
                <tr>
                  <th className="p-3">Clinical Scenario</th>
                  <th className="p-3">Primary Action</th>
                  <th className="p-3">Co-signature / Attending Routing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink-2">
                <tr>
                  <td className="p-3 font-semibold">ED Discharge (TIA/Minor Stroke)</td>
                  <td className="p-3">Document discharge encounter</td>
                  <td className="p-3">Route to the on-call Stroke Attending</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">ED Admission to Stroke Service</td>
                  <td className="p-3">Route admission H&amp;P note</td>
                  <td className="p-3">Route to admitting Stroke Attending of the day</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">ED Admission to Non-Neurology Service</td>
                  <td className="p-3">Write consult note</td>
                  <td className="p-3">Route to Stroke Attending on-call</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Consult Note (Weekday 08:00 - 17:00)</td>
                  <td className="p-3">Document recommendations</td>
                  <td className="p-3">Route to Stroke Consult Attending of the day</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Consult Note (Weekend / Holiday)</td>
                  <td className="p-3">Document recommendations</td>
                  <td className="p-3">Route to Weekend Stroke Attending on-call</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Morning Report Discussion</td>
                  <td className="p-3">Review overnight admissions</td>
                  <td className="p-3">Forward H&amp;P to the post-call Stroke Attending</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Inpatient Progress Note</td>
                  <td className="p-3">Document daily assessment</td>
                  <td className="p-3">Route to the attending rounding on the service</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Discharge Summary</td>
                  <td className="p-3">Summarize hospital course</td>
                  <td className="p-3">Route to the discharging Stroke Attending</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );

    case "epic-templates":
      return (
        <div className="space-y-6">
          <p className="text-xs">
            Review the breakdown of core clinical templates that residents are expected to maintain.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">💡 Ischemic Stroke SmartPhrases</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <strong>.ISTIAADMIT</strong> - Complete H&amp;P containing onset timeline, NIHSS breakdown, lytic decision, post-lytic telemetry orders, and secondary prevention meds.
                </li>
                <li>
                  <strong>.ISTIAPROGRESS</strong> - Inpatient progress template pulling in active labs, daily NIHSS, BP targets, telemetry rhythm, swallow screen status, and physical therapy recs.
                </li>
                <li>
                  <strong>.ISTIADISCHARGE</strong> - Discharge summary pulling in lipid targets, antithrombotics, and stroke warning signs education.
                </li>
              </ul>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">🩸 Hemorrhagic Stroke (ICH) SmartPhrases</h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <strong>.IPHADMIT</strong> - H&amp;P tracking hematoma location, GCS, calculated ICH Score, anticoagulation reversal status, and target SBP orders.
                </li>
                <li>
                  <strong>.IPHPROGRESS</strong> - Daily progress note detailing repeat imaging results, ICP trends, EVD parameters, and mechanical/pharmacologic VTE ppx timeline.
                </li>
                <li>
                  <strong>.IPHDISCHARGE</strong> - Summary tracking rehabilitation placement, blood pressure targets, and long-term anticoagulation resumption timelines.
                </li>
              </ul>
            </div>
          </div>

          <div className="border border-line rounded p-4 bg-paper space-y-3">
            <h3 className="font-bold text-sm text-ink">📌 Mandatory SmartPhrase Sections</h3>
            <p className="text-xs">
              Every stroke note template must contain structured sections covering the following metrics:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-2xs font-semibold text-slate-700 dark:text-ink-2">
              <div className="p-2 border border-line bg-card rounded">Stroke Timeline</div>
              <div className="p-2 border border-line bg-card rounded">NIHSS/Severity</div>
              <div className="p-2 border border-line bg-card rounded">Imaging Summary</div>
              <div className="p-2 border border-line bg-card rounded">Lysis/EVT Decision</div>
              <div className="p-2 border border-line bg-card rounded">BP Target Strategy</div>
              <div className="p-2 border border-line bg-card rounded">Antithrombotic Plan</div>
              <div className="p-2 border border-line bg-card rounded">Dysphagia/DVT/Rehab</div>
              <div className="p-2 border border-line bg-card rounded">Stroke Mechanism</div>
            </div>
          </div>
        </div>
      );

    case "ctp":
      return (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-caution p-3">
            <h3 className="font-bold text-xs uppercase mb-1">⚠️ Core Caveat</h3>
            <p className="text-xs">Do not make clinical decisions on CTP maps alone. Always correlate CTP volumes with the patient's acute neurologic exam (NIHSS), non-contrast head CT, CTA, and baseline functional status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">🔬 Core vs Penumbra</h3>
              <p className="text-xs">
                <b>Ischemic Core:</b> Tissue that is already infarcted and unsalvageable. Typically defined as cerebral blood flow <b>(CBF) &lt; 30%</b>.
              </p>
              <p className="text-xs">
                <b>Penumbra (Hypoperfusion):</b> Viable tissue at risk of infarction if blood flow is not restored. Defined as time-to-peak <b>(Tmax) &gt; 6 seconds</b>.
              </p>
              <p className="text-xs">
                <b>Mismatch:</b> The volume of salvageable tissue, calculated as: <br />
                <span className="font-mono font-bold text-cobalt-700 dark:text-cobalt-300">Mismatch Volume = Penumbra Vol - Core Vol</span>
              </p>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-2 col-span-2">
              <h3 className="font-bold text-sm text-ink">⏱ Late-Window Tissue Criteria (6-24 hours)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-line bg-card rounded">
                  <h4 className="font-bold text-cobalt-800 mb-1 dark:text-cobalt-300">DEFUSE-3 (6-16h)</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ischemic core volume <b>&lt; 70 mL</b></li>
                    <li>Mismatch ratio <b>&gt;= 1.8</b></li>
                    <li>Mismatch volume <b>&gt;= 15 mL</b></li>
                  </ul>
                </div>
                <div className="p-3 border border-line bg-card rounded">
                  <h4 className="font-bold text-cobalt-800 mb-1 dark:text-cobalt-300">DAWN (6-24h)</h4>
                  <p className="mb-1 text-[11px] leading-tight">Clinical-core mismatch tiers based on age and NIHSS:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Age &gt;= 80: NIHSS &gt;= 10 and core &lt; 21 mL</li>
                    <li>Age &lt; 80: NIHSS &gt;= 10 and core &lt; 31 mL</li>
                    <li>Age &lt; 80: NIHSS &gt;= 20 and core 31-51 mL</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-line rounded p-4 bg-paper space-y-2">
            <h3 className="font-bold text-sm text-ink text-critical">⚠️ Common Pitfalls in CTP Interpretation</h3>
            <ul className="list-disc list-inside space-y-2 text-xs">
              <li>
                <strong>Patient Motion:</strong> Motion artifacts can artificially elevate Tmax volumes, creating a false mismatch.
              </li>
              <li>
                <strong>Poor Bolus Contrast:</strong> Delay in contrast injection or low cardiac output can shift Tmax maps, overestimating core/penumbra.
              </li>
              <li>
                <strong>Stroke Mimics:</strong> Active seizures or hemiplegic migraines can alter regional cerebral blood flow and mimic a perfusion defect.
              </li>
              <li>
                <strong>Posterior Circulation:</strong> CTP has very poor sensitivity for brainstem and cerebellar ischemia. Do not use CTP to rule out basilar artery occlusions.
              </li>
            </ul>
          </div>
        </div>
      );

    case "trials":
      return (
        <div className="space-y-6">
          <p className="text-xs">
            Review the summary of key active clinical trials. If a patient meets criteria, page the Stroke Research Coordinator immediately.
          </p>

          <div className="space-y-4">
            <div className="p-4 border border-line rounded bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink flex items-center justify-between">
                <span>1. SELECT2 &amp; ANGEL-ASPECT (Large Core EVT)</span>
                <span className="text-[10px] bg-ok-100 text-ok-900 border border-ok-300 rounded px-1.5 py-0.5 dark:bg-ok-900 dark:text-ok-300 dark:border-ok-800">Completed (2023)</span>
              </h3>
              <p className="text-xs text-ink-2">
                <b>Population:</b> Acute Ischemic Stroke with large core (ASPECTS 3-5 or core volume &gt;= 50 mL on CTP). <br />
                <b>Finding:</b> EVT significantly improved functional independence (mRS 0-2) compared to medical management alone, with a similar safety profile.
              </p>
            </div>

            <div className="p-4 border border-line rounded bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink flex items-center justify-between">
                <span>2. ELAN &amp; OPTIMAS (Early DOAC Start)</span>
                <span className="text-[10px] bg-ok-100 text-ok-900 border border-ok-300 rounded px-1.5 py-0.5 dark:bg-ok-900 dark:text-ok-300 dark:border-ok-800">Completed (2023-2024)</span>
              </h3>
              <p className="text-xs text-ink-2">
                <b>Population:</b> Non-valvular atrial fibrillation presenting with acute ischemic stroke. <br />
                <b>Finding:</b> Early initiation of DOACs (within 48 hours for minor/moderate, day 6 for severe) was safe and did not increase intracranial hemorrhage rates compared to traditional 4-to-14 day delays.
              </p>
            </div>

            <div className="p-4 border border-line rounded bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink flex items-center justify-between">
                <span>3. ENRICH &amp; SWITCH (ICH Minimally Invasive Surgery)</span>
                <span className="text-[10px] bg-ok-100 text-ok-900 border border-ok-300 rounded px-1.5 py-0.5 dark:bg-ok-900 dark:text-ok-300 dark:border-ok-800">Completed (2024)</span>
              </h3>
              <p className="text-xs text-ink-2">
                <b>Population:</b> Spontaneous Intracerebral Hemorrhage (lobar 30-80 mL for ENRICH; deep/basal ganglia for SWITCH). <br />
                <b>Finding:</b> Parafascicular minimally invasive surgical evacuation (MIPS) significantly improved functional outcomes at 180 days compared to medical management.
              </p>
            </div>

            <div className="p-4 border border-line rounded bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink flex items-center justify-between">
                <span>4. ACTIVE PROTOCOLS (Telestroke / Local Registries)</span>
                <span className="text-[10px] bg-caution-soft text-caution border border-caution rounded px-1.5 py-0.5">Recruiting</span>
              </h3>
              <p className="text-xs text-ink-2">
                Refer to the telestroke screening tool to check if the spoke site is active for stroke alert registries. Always verify patient consent before enrolling.
              </p>
            </div>
          </div>
        </div>
      );

    case "pediatric-stroke":
      return (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-caution p-3">
            <h3 className="font-bold text-xs uppercase mb-1">👶 Key Pediatric Differences</h3>
            <p className="text-xs">Pediatric stroke presentation is highly variable and mimics (seizure, migraine, encephalitis) are common. The standard 4.5h IV thrombolysis window does not apply uniformly to children; decisions are highly individualized.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-line rounded p-4 bg-paper space-y-3">
              <h3 className="font-bold text-sm text-ink">🏥 Diagnostic Pathway</h3>
              <ul className="list-disc list-inside space-y-2 text-xs">
                <li>
                  <strong>STAT MRI/MRA Brain:</strong> MRI is the gold standard. CTA is reserved for cases where MRI is not immediately available.
                </li>
                <li>
                  <strong>STAT Labs:</strong> CBC, CMP, PT/PTT, Fibrinogen, Thrombin Time, and initial Hypercoagulable panel.
                </li>
                <li>
                  <strong>Echocardiogram:</strong> Order with bubble study to evaluate for congenital cardiac shunt or patent foramen ovale (PFO).
                </li>
              </ul>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-3">
              <h3 className="font-bold text-sm text-ink">🔬 Risk Factors &amp; Mimics</h3>
              <p className="text-xs">
                <b>Etiologies:</b> Arteriopathy (Focal Cerebral Arteriopathy, Moyamoya), Congenital Heart Disease, Sickle Cell Disease, Prothrombotic states, and systemic infections.
              </p>
              <p className="text-xs">
                <b>Mimics:</b> Todd's Paralysis (post-ictal), Hemiplegic Migraine, Demyelinating disease (ADEM), and conversion disorders.
              </p>
            </div>
          </div>

          <div className="border border-line rounded p-4 bg-paper space-y-2">
            <h3 className="font-bold text-sm text-ink">⏱ Escalation call chain</h3>
            <p className="text-xs">
              For any suspected pediatric stroke (age &lt; 18), immediately contact: <br />
              <span className="font-mono text-xs font-bold text-critical">Pediatric Neurology Fellow/Attending on-call (your children's center)</span> and activate the local pediatric transfer protocol.
            </p>
          </div>
        </div>
      );

    case "aspects":
      return (
        <div className="space-y-6">
          <p className="text-xs">
            Subtract 1 point from 10 for each region showing acute ischemic changes (loss of gray-white differentiation or hypodensity).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-line rounded p-4 bg-paper space-y-3">
              <h3 className="font-bold text-sm text-ink">🧠 ASPECTS regions (MCA Territory)</h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><b>C:</b> Caudate</li>
                <li><b>I:</b> Insular Ribbon</li>
                <li><b>IC:</b> Internal Capsule</li>
                <li><b>L:</b> Lentiform Nucleus</li>
                <li><b>M1:</b> Anterior MCA cortex</li>
                <li><b>M2:</b> MCA cortex lateral to insular ribbon</li>
                <li><b>M3:</b> Posterior MCA cortex</li>
                <li><b>M4:</b> Anterior MCA territory (superior to M1)</li>
                <li><b>M5:</b> Lateral MCA territory (superior to M2)</li>
                <li><b>M6:</b> Posterior MCA territory (superior to M3)</li>
              </ul>
              <p className="text-xs font-semibold text-cobalt-800 dark:text-cobalt-300">
                AHA/ASA Guideline: ASPECTS &gt;= 6 is class 1A indication for EVT in the 0-6h window.
              </p>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-3">
              <h3 className="font-bold text-sm text-ink">🧠 PC-ASPECTS (Posterior Circulation)</h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><b>Pons:</b> 2 points</li>
                <li><b>Midbrain:</b> 2 points</li>
                <li><b>Left Thalamus:</b> 1 point</li>
                <li><b>Right Thalamus:</b> 1 point</li>
                <li><b>Left Occipital:</b> 1 point</li>
                <li><b>Right Occipital:</b> 1 point</li>
                <li><b>Left Cerebellar:</b> 1 point</li>
                <li><b>Right Cerebellar:</b> 1 point</li>
              </ul>
              <p className="text-xs font-semibold text-cobalt-800 dark:text-cobalt-300">
                Basilar EVT indications (ATTENTION/BAOCHE) target PC-ASPECTS &gt;= 6.
              </p>
            </div>
          </div>
        </div>
      );

    case "ich-triage-reversal":
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">⏱ Reversal Protocols by Exposure</h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <strong>Warfarin:</strong> 4-factor PCC (25-50 U/kg based on baseline INR) + Vitamin K 10mg IV slow infusion. Target INR &lt; 1.4.
                </li>
                <li>
                  <strong>Factor Xa Inhibitors (Apixaban/Rivaroxaban):</strong> PCC 4-factor 50 U/kg (or Andexanet Alfa if immediately available and indicated).
                </li>
                <li>
                  <strong>Heparin (UFH/LMWH):</strong> Protamine Sulfate (1mg per 100 units UFH administered; adjust for time elapsed).
                </li>
                <li>
                  <strong>Antiplatelet associated ICH:</strong> Do NOT transfuse platelets routinely (increased death/disability in PATCH trial), unless surgical candidate or severe thrombocytopenia.
                </li>
              </ul>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink">🏥 Surgical Triage &amp; Consults</h3>
              <p className="text-xs">
                <b>Neurosurgery Consult Triggers:</b> <br />
                - Cerebellar hematoma &gt; 3 cm or with brainstem compression/hydrocephalus (requires emergent evacuation). <br />
                - Supratentorial hematoma with severe mass effect or clinical deterioration. <br />
                - Intraventricular hemorrhage (IVH) causing acute hydrocephalus (requires EVD).
              </p>
              <p className="text-xs">
                <b>Stability Scan:</b> Repeat head CT in 6 hours to confirm no expansion before initiating DVT chemoprophylaxis.
              </p>
            </div>
          </div>
        </div>
      );

    case "dvt-prophylaxis":
      return (
        <div className="space-y-6">
          <p className="text-xs">
            Review the standardized timeline for post-stroke Venous Thromboembolism (VTE) prophylaxis.
          </p>

          <div className="overflow-x-auto border border-line rounded">
            <table className="w-full text-xs text-left bg-card">
              <thead className="bg-paper border-b border-line text-ink font-semibold">
                <tr>
                  <th className="p-3">Stroke Type / Scenario</th>
                  <th className="p-3">Mechanical Prophylaxis</th>
                  <th className="p-3">Pharmacologic Prophylaxis (LMWH/UFH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink-2">
                <tr>
                  <td className="p-3 font-semibold">Acute Ischemic Stroke (No Lytic)</td>
                  <td className="p-3">SCDs immediately on admission</td>
                  <td className="p-3">Start by Day 2 (within 24-48 hours of admission)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Post-IV Thrombolysis (TNK/Alteplase)</td>
                  <td className="p-3">SCDs immediately</td>
                  <td className="p-3">Strictly HOLD for 24 hours. Start after 24-hour CT rules out sICH.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Intracerebral Hemorrhage (ICH)</td>
                  <td className="p-3">SCDs immediately</td>
                  <td className="p-3">Start at 24-48 hours if stability head CT confirms no hematoma expansion.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Post-EVD Placement</td>
                  <td className="p-3">SCDs immediately</td>
                  <td className="p-3">Hold for 24 hours post-procedure; restart only after neurosurgery clearance.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );

    case "pupillometry":
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-line rounded p-4 bg-paper col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-ink">🔬 Neurological Pupil Index (NPi)</h3>
              <p className="text-xs">
                NPi is a quantitative index (0 to 5) calculated from pupil reactivity parameters (constriction velocity, latency, dilation velocity).
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 border border-line bg-card rounded">
                  <span className="block font-bold text-ok-900 dark:text-ok-300">3.0 - 5.0</span>
                  <span className="text-[10px]">Normal reactivity</span>
                </div>
                <div className="p-2 border border-line bg-card rounded bg-caution-soft text-caution">
                  <span className="block font-bold">&lt; 3.0</span>
                  <span className="text-[10px]">Abnormal / Sluggish</span>
                </div>
                <div className="p-2 border border-line bg-card rounded bg-critical-soft text-critical">
                  <span className="block font-bold">0.0</span>
                  <span className="text-[10px]">Non-reactive pupil</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-critical">
                ⚠️ Early Indicator: A significant drop in NPi (&gt; 0.5 points) from baseline, even if still above 3.0, is a strong warning sign of impending brainstem compression or herniation.
              </p>
              <div className="flex gap-2">
                <a
                  href="#/protocols/simulators"
                  onClick={() => onNavigate(null)}
                  className="px-3 py-1.5 text-xs bg-cobalt-700 hover:bg-cobalt-800 text-white rounded font-medium inline-block"
                >
                  Go to Interactive Pupillometry Simulator →
                </a>
              </div>
            </div>

            <div className="border border-line rounded p-4 bg-paper space-y-2">
              <h3 className="font-bold text-sm text-ink text-critical">⚠️ Limitations of NPi</h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>A normal NPi does NOT rule out early elevated ICP.</li>
                <li>Pharmacologic pupil dilation (atropine) or constriction (opiates) will alter NPi parameters.</li>
                <li>Severe localized orbital trauma limits accuracy.</li>
              </ul>
            </div>
          </div>
        </div>
      );

    case "policy-safety-pause":
      return (
        <div className="space-y-6">
          <div className="border border-line rounded p-4 bg-paper space-y-3">
            <h3 className="font-bold text-sm text-ink">⏱ Pre-Thrombolytic Scanner Time-Out</h3>
            <p className="text-xs">
              Perform the safety pause at the CT scanner console immediately prior to spiking the lytic bag.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-xs text-ink-2">
              <li>
                <strong>Verify Participants:</strong> Stroke Fellow, Bedside Nurse, and Pharmacist must be present at the bedside/console.
              </li>
              <li>
                <strong>Read-Aloud Checklist:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-700 dark:text-ink-2">
                  <li>Confirm Patient Identity (2 identifiers).</li>
                  <li>Confirm Symptom Onset / LKW time is within 4.5 hours.</li>
                  <li>Confirm CT scan shows no Intracranial Hemorrhage.</li>
                  <li>Verify no absolute contraindications (recent surgery, platelets &lt; 100k, DOAC use).</li>
                  <li>Confirm blood pressure is safely controlled below <b>185/110 mmHg</b>.</li>
                </ul>
              </li>
              <li>
                <strong>Consent Check:</strong> Verify informed consent has been obtained, or that presumed consent criteria are met and documented.
              </li>
            </ol>
          </div>
        </div>
      );

    case "hospital-roadmap":
      return (
        <div className="space-y-6">
          <div className="border border-line rounded p-4 bg-paper space-y-4">
            <h3 className="font-bold text-sm text-ink">📅 Day-by-Day Senior Resident Timeline</h3>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-cobalt-800 dark:text-cobalt-300">Day 0: Admission &amp; Stabilization</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-ink-2">
                  <li>Confirm ICU or telemetry level of care orders.</li>
                  <li>Establish blood pressure parameters (e.g. SBP &lt; 180 post-lytics/EVT; &lt; 220 if no lytic).</li>
                  <li>Perform and document dysphagia screening; keep NPO if screen failed.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-cobalt-800 dark:text-cobalt-300">Day 1: Secondary Prevention Workup</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-ink-2">
                  <li>Start antithrombotics (e.g. DAPT for minor stroke/TIA, single antiplatelet for others).</li>
                  <li>Order MRI Brain, CTA Head/Neck (if not done), Echocardiogram, and lipids panel.</li>
                  <li>Verify physical therapy (PT) and occupational therapy (OT) evaluations are placed.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-cobalt-800 dark:text-cobalt-300">Day 2-3: Etiology &amp; Discharge Planning</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-ink-2">
                  <li>Review telemetry for paroxysmal atrial fibrillation (AF).</li>
                  <li>Optimize medical regimen (add statin, adjust anti-hypertensives).</li>
                  <li>Begin discharge coordination: verify rehabilitation bed or outpatient home health setup.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );

    case "telestroke-routing":
      return (
        <div className="space-y-6">
          <div className="v6-callout v6-callout-caution p-3">
            <h3 className="font-bold text-xs uppercase mb-1">📞 Telestroke Pager Routing</h3>
            <p className="text-xs">Do not post live attending cell phone numbers or direct lines on this public platform. Always route through the regional hospital call operator.</p>
          </div>

          <div className="border border-line rounded p-4 bg-paper space-y-2 text-xs">
            <h3 className="font-bold text-sm text-ink">💻 Documentation and Epic Co-Signatures</h3>
            <p>
              All telestroke consults performed at spoke sites must use the designated tele-health templates. Route notes to the on-call attending under the role-based alias.
            </p>
          </div>
        </div>
      );

    default:
      return <p className="text-xs">Module content not found.</p>;
  }
}
