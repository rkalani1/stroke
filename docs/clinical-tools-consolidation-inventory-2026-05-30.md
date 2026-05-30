# Clinical Tools Consolidation Inventory — 2026-05-30

Canonical target: **https://rkalani1.github.io/stroke/** (`/Users/rizwankalani/code/stroke`).
Goal: one consolidated, public-safe, offline-capable StrokeOps cockpit; every relevant
clinical GitHub Pages repo is **natively integrated**, **documented as a legacy/external
link**, **redirected**, or **intentionally left separate**.

Disposition legend: **NATIVE** = built into /stroke · **LINK** = external link from the
Home → Legacy/External Tools launcher (with reason) · **SEPARATE** = not surfaced ·
**EXCLUDE** = non-clinical.

## Disposition table

| Repo | Live Pages | Type / audience | Public-safety | Disposition |
|---|---|---|---|---|
| **stroke** | rkalani1.github.io/stroke | the cockpit (canonical) | synthetic demo; institution-neutral | — |
| **stroke-trials-screener** | /stroke-trials-screener | acute trial screener | clean (every trial `noContactInfo`) | **NATIVE** — ported as `src/components/TrialScreener.jsx` + 15-trial dual-eval engine; iframe removed (shipped v6.3.0) |
| **stroke-eligibility-tables-embed** | /stroke-eligibility-tables-embed | trial-eligibility tables | clean (UW brand colors only → re-themed) | **NATIVE** — `src/components/EligibilityTables.jsx`, 6 phase-grouped tables + copy HTML/markdown; iframe removed |
| **clinical-references** | /clinical-references | bedside neuro-ICU refs + simulators + calculators | clean (footer washington.edu links only) | **NATIVE (partial)** — 4 simulators (EVD-ICP, HINTS+, Pupillometry, Neuro-Exams) + evidence (Hemphill cohort, SPARCL/carotid NNT, NPi/Petrosino-2025) ported; remaining static reference pages = candidate future native or LINK |
| **esoc-2026-data-hub** | /esoc-2026-data-hub | ESOC 2026 conference evidence hub (research) | clean; 5 trials `source-limited` (quarantine) | **NATIVE-PORT (planned, deferred)** — 14 trials net-new vs the 57-trial Evidence Atlas (MASTERSTROKE, TECNO, CHILL-ART, CASES, CRAFT, ATLAS-IPD, DISTALS, etc.); OCEANIC/ATLAS/TRIDENT already in app. Port the source-verified high-impact trials into the Evidence Atlas / What's-New **after PubMed verification**; **quarantine** the 5 source-limited (TNK-MeVO, LATE-MT, MILD-MT, EXTEND-IA-DNase, COMMITS) until indexed. Interim: linkable as an evidence resource. |
| **n-epi** | /n-epi | neuro-epi / biostats / study-design / grant / appraisal (research/teaching, 30 modules, ~46k LOC) | clean (footer only) | **LINK** (Home → External Tools: "Statistical & Research Methods"). Optional future native port of 3 calcs (NNT/NNH+fragility, Fagan/diagnostic-accuracy, mRS-ordinal sample-size). Full port would bloat the bedside bundle. |
| **proteomics-power-calc** | /proteomics-power-calc | PWAS sample-size/power (research, React/TS, 2.1 MB) | clean | **LINK** (External Tools: "Proteomics Power Calculator") — research study-design, not bedside. |
| **ccc** | /ccc | Clerkship Coaching OS — WBA tracking / entrustment / CCC export (teaching, stateful) | clean (no trainee data; demo-only) | **LINK** (External Tools: "CCC — Clerkship Coaching") — stateful localStorage app; can't share the stateless cockpit's data model. |
| **telestroke-expansion-map** | /telestroke-expansion-map | regional telestroke coverage/expansion map (admin/service-planning) | **contains REAL Harborview/UW partner-hospital names + GPS** (already public; no PHI/financials) | **LINK → Admin/Service-Planning** (labeled "service planning, NOT a clinical decision tool"). Moved OUT of the clinical Resources dropdown; leading-space URL bug fixed. Do NOT natively embed. |
| **FTEcalculator** | /FTEcalculator | faculty FTE/effort admin calc | clean but bespoke dept constants | **EXCLUDE from cockpit** — bespoke departmental effort weights; surfacing publicly mis-implies a standard. No bedside value. |
| **telestroke-growth-simulator** | (no confirmed Pages deploy) | synthetic Monte-Carlo service-growth model (admin) | synthetic/demo only | **SEPARATE** — synthetic, no deploy, zero clinical value; not surfaced. |
| **stroke-clinic-q** | /stroke-clinic-q | clinic pre-visit questionnaire (patient intake) | clean; demo-only | **SEPARATE/skip** — patient-portal workflow, minimal CDS; STOP-BANG (its only validated score) already in /stroke. Optional future LINK if clinic-workflow value emerges. |
| **stroke-mri-prototype** | /stroke-mri-prototype | hyperacute MRI order-set wireframe (EHR mock) | clean | **SEPARATE/skip** — order-set wireframe, no portable logic; DWI-FLAIR / wake-up / LVO-contrast-allergy concepts already covered in /stroke's IVT/EVT eligibility. The MRI sequence ref (DWI→FLAIR→GRE/SWI) could be a one-line ref-card add later. |
| agent-builder-field-guide | /agent-builder-field-guide | tooling docs | n/a | **EXCLUDE** (non-clinical) |
| claude | /claude | AI tooling | n/a | **EXCLUDE** (non-clinical) |
| rkalani1 | profile | GitHub profile | n/a | **EXCLUDE** |

## Consolidated /stroke route map (post-cockpit)

- `#/home` — **Command Center** (default landing): status strip (version · offline-ready · evidence freshness · synthetic-demo banner), fast route tiles, Legacy/External-Tools launcher. Command palette app-wide (⌘K / "/").
- `#/encounter` — acute phone-consult / telestroke / code-stroke workflow.
- `#/protocols` — Institutional Protocols & Algorithms → sub-tabs: `ich · ischemic · sah · tia · cvt · calculators · references · simulators`.
  - `#/protocols/simulators` — Bedside Simulators: EVD-ICP, HINTS+, Pupillometry/NPi, Neuro-Exams.
  - `#/protocols/ischemic` — incl. the AIS Command Center (6 evidence-linked cards).
- `#/research` — Research & Guidelines: verified What's-New feed (50 studies) + Evidence Atlas + guidelines.
- `#/trials` — Bedside Screener (native) · Eligibility Tables (native) · Evidence Atlas.

## Public-safety notes

- The public build is **synthetic demo, no PHI, not an official system** (banner on Home + per-surface where data is entered/copied). Verified: **zero** Harborview/HMC/UW-Medicine/Montlake/Kalani identifiers in the deployed bundle (`app.js`/`index.html`).
- **telestroke-expansion-map** carries real (already-public) institutional partner names; it is **linked, never embedded**, and re-homed under Admin/Service-Planning with a "not a clinical decision tool" label.
- External-linked repos (n-epi, proteomics, ccc) each carry only a boilerplate `washington.edu` terms/privacy footer (a compliance-sweep artifact, not an institutional disclosure); recommend stripping those footers when those repos are next redeployed (tracked as a deferred housekeeping item).
- Evidence currency rule preserved: What's-New shows only PMID/verified items; ESOC source-limited trials are **quarantined**, not displayed.

## Deferred items (ranked by impact)

1. **esoc-2026-data-hub native port** — PubMed-verify the ~9 source-confirmed net-new ESOC trials → Evidence Atlas / What's-New; quarantine the 5 source-limited. (Highest evidence-currency value.)
2. **n-epi selective calc port** — NNT/NNH (+fragility index), Fagan/diagnostic-accuracy, mRS-ordinal sample-size into Management/Trials.
3. Strip the boilerplate `washington.edu` footers from n-epi / proteomics / ccc on their next redeploy.
4. clinical-references remaining static bedside pages — selectively native or LINK.
5. stroke-mri-prototype — add the MRI-sequence ref card (DWI→FLAIR→GRE/SWI) to the imaging reference.
