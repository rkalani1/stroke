# Project: Stroke CDS Application 2024-2026 Guidelines & Education Update

## Architecture
The Stroke Clinical Decision Support (CDS) application is a high-reliability, client-side progressive web application built with React, TailwindCSS, and an automated static validation pipeline. It integrates declarative JSON/Markdown evidence datasets with interactive decision trees, clinical calculator engines, protocol snapshots, and reference libraries.

- **Data Layer (`data/`, `content/`)**: 17 guideline datasets (771 statements in `data/guidelines/`), 32 educational modules (`content/education/*.md`), 71 completed trials (`content/trials/`), 10 active trials (`src/evidence/activeTrials.js`), and citations registry (`src/evidence/citations.js`).
- **Logic & Matcher Engines (`src/evidence/`, `src/management-guidance.js`, `src/app.jsx`)**: 128 dynamic recommendation rules (`GUIDELINE_RECOMMENDATIONS`), 8 AIS Command Center Cards (`AIS_COMMAND_CENTER_CARDS`), 50 trial eligibility criteria evaluators with 16 exclusion guards (`src/evidence/matcher-engine.js`), and 6 institutional protocol subtabs (`src/institutional-protocols.js`).
- **UI & Presentation Layer (`src/`, `index.html`)**: Collapsible `<details>` accordion containers minimized by default, 4 interactive simulators (`EvdIcpSimulator`, `HintsSimulator`, `NeuroExamsTool`, `PupillometrySimulator`), dark mode design token system with WCAG AA compliance (21 verified token pairs).
- **Build & Verification Pipeline (`scripts/`, `package.json`)**: Content bundler (`build-content-bundle.mjs`), schema/currency validator (`validate-content.mjs`), evidence validator (`validate-evidence.mjs`), citation static analyzer (`validate-citations.mjs`), inline citation sweeper (`validate-inline-citations.mjs`), Playwright protocol snapshot lock (`snapshot-example-protocols.mjs`), and institutional leak guard (`check-no-institutional-leak.mjs`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 2026 AHA/ASA AIS Guideline Statements | 195 recs in `data/guidelines/ais-2026.json` and `src/guidelines/ais-2026.json` (TNK 0.25 mg/kg Class I/A, TNK 0.4 mg/kg Class III: Harm/No Benefit, early EVT, BP targets) | M1 | Survey (explorer_survey_1) |
| 2 | SVIN 2025 Large-Core EVT Guideline | 4 recs in `data/guidelines/svin-large-core-2025.json` (0-6h ASPECTS 0-5 Class I/A, 6-24h ASPECTS 3-5 Class I/A) | M1 | Survey (explorer_survey_1) |
| 3 | CATALYST 2025 DOAC Timing Meta-Analysis | N=5467 pooled analysis (Lancet 2025, PMID 40570866) in `rec-af-early-anticoag` and `content/education/afib-anticoag-timing.md` | M1 | Survey (explorer_survey_1) |
| 4 | Large-Core EVT Clinical Decision Trees | SELECT2, ANGEL-ASPECT, TENSION, LASTE, TESLA, ATLAS IPDMA criteria in `src/app.jsx` and `src/management-guidance.js` | M1 | Survey (explorer_survey_1) |
| 5 | Blood Pressure Guardrails & Harm Thresholds | Pre-IVT <185/110, post-IVT <180/105, post-EVT intensive lowering <140 harm guard (Class III: Harm, LOE A), ICH SBP <130 harm guard (Class III: Harm) | M1 | Survey (explorer_survey_1) |
| 6 | Pediatric Stroke Reperfusion Pathways | Age >=6y EVT (COR IIa/B-NR), age 28d-<6y EVT (COR IIb/B-NR), off-label Alteplase (COR IIb/C-LD), TNK not endorsed, mandatory MRI and BP percentile rules | M1 | Survey (explorer_survey_1) |
| 7 | Guideline Library & COR/LOE Catalog | 17 guideline datasets (771 recs), search/filter by COR/LOE, page-level PDF publisher deep links | M1 | Survey (explorer_survey_1) |
| 8 | 32 Educational Markdown Modules | 32 `.md` modules in `content/education/` with YAML frontmatter, verified against `src/education.jsx` and `content/bundle.json` | M2 | Survey (explorer_survey_2) |
| 9 | Minimized Accordion UX (<details>) | All `<details>` elements in `#research-tabpanel-references`, `#tabpanel-references`, and submodules lack default `open` attribute; minimized by default | M2 | Survey (explorer_survey_2) |
| 10 | Dark Mode & WCAG AA Contrast Compliance | 21 color token pairs passing WCAG AA standards (>=4.5:1 normal text, >=3.0:1 large text/UI), verified via `npm run lint:contrast` | M2 | Survey (explorer_survey_2) |
| 11 | 2024-2026 Landmark Educational Citations | Educational cards citing THEIA 2025, CREST-2 2025, LASTE/TESLA 2024, TIMELESS/TRACE-III 2024, ANNEXA-I 2024, OCEANIC-STROKE 2026, FASTEST 2026 | M2 | Survey (explorer_survey_2) |
| 12 | Content Bundling Pipeline | `npm run content:bundle` bundling 166 records into deterministic `content/bundle.json` | M3 | Survey (explorer_survey_3) |
| 13 | Content & Currency Validator | `npm run content:validate` and `npm run content:currency` verifying schema integrity and freshness (<18 months) | M3 | Survey (explorer_survey_3) |
| 14 | Evidence & Matcher Validator | `npm run evidence:validate` verifying 10 active trials, 71 completed trials, 87 citations, 11 recs, 100% matcher engine coverage | M3 | Survey (explorer_survey_3) |
| 15 | Static Citation & Inline Citation Validators | `npm run validate:citations` (87 PMIDs checked) and `npm run validate:inline-citations` (124 unique PMIDs across 261 references) | M3 | Survey (explorer_survey_3) |
| 16 | Playwright Protocol Snapshot Lock | `npm run test:protocol-snapshot` locking 6 protocol subtabs with `npm run test:protocol-snapshot:update` baseline updater | M3 | Survey (explorer_survey_3) |
| 17 | Institutional & PHI Leak Guard | `npm run check:leak-guard` scanning 402 text files with 0 violations | M3 | Survey (explorer_survey_3) |
| 18 | Production Build & Compression Pipeline | `npm run build:prod` compiling `dist/`, TailwindCSS, ESBuild IIFE bundle (`app.js`), and zlib gzip/brotli compressed assets | M4 | Survey (explorer_survey_3) |
| 19 | Git Deployment Target Verification | Verifying branch status on `main` tracking `origin/main` for live GitHub Pages deployment | M4 | Survey (explorer_survey_3) |
| 20 | E2E Testing Suite & Coverage Verification | Comprehensive opaque-box test suite across Tiers 1-4 and Phase 2 Tier 5 Adversarial Coverage Hardening | Final | Survey (explorer_survey_3) |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Clinical Guidelines & Decision Trees Audit | Verify and ensure 100% accuracy of all 2024-2026 guidelines, COR/LOE grading, PMIDs, large-core EVT, BP guardrails, pediatric reperfusion, CATALYST DOAC timing, and interactive recommendation builders (Features 1-7) | none | DONE |
| M2 | Education Section & UX Accordion Verification | Verify all 32 educational modules, minimized `<details>` accordion containers, dark-mode AA contrast compliance, and 2024-2026 citations (Features 8-11) | M1 | DONE |
| M3 | Content Bundling & Automated Validation Pipeline | Execute and verify complete validation suite (`content:bundle`, `content:validate`, `evidence:validate`, `validate:citations`, `validate:inline-citations`, `test:protocol-snapshot`, `check:leak-guard`) (Features 12-17) | M1, M2 | DONE |
| M4 | Production Build & Deployment | Run `npm run build:prod`, verify compressed bundles, verify clean working tree, and push to `origin/main` (Features 18-19) | M3 | DONE |
| Final | E2E Test Suite & Adversarial Hardening | Execute full E2E test suite (Tiers 1-4) and Tier 5 Adversarial Coverage Hardening (Feature 20) | M1, M2, M3, M4 | DONE |

---

## Interface Contracts
### `data/guidelines/*.json` ↔ `src/guidelines/*.json` ↔ `src/app.jsx`
- Each guideline JSON file exports an array of recommendation objects:
  `{ id: string, section: string, cor: string, loe: string, text: string, pmid?: string, pageNumber?: number }`.
- `GUIDELINE_RECOMMENDATIONS` in `src/app.jsx` references these IDs and defines `conditions(patientData) => boolean` returning actionable recommendations.

### `content/education/*.md` ↔ `scripts/build-content-bundle.mjs` ↔ `content/bundle.json` ↔ `src/education.jsx`
- Markdown files must contain valid YAML frontmatter:
  `id: string, title: string, category: string, summary: string, readingTimeMinutes: number, keyTakeaways: string[], references: { title: string, citation: string, pmid?: string, doi?: string }[]`.
- `src/education.jsx` maps `EDUCATION_MODULES` exactly to the 32 module IDs.

### Verification Tools ↔ CI/Pipeline
- Every validation script exits with code `0` on success and non-zero on failure.
- `scripts/check-no-institutional-leak.mjs` verifies no PHI, patient identifiers, or private institutional tokens exist in any committed or staged file.

---

## Code Layout
- `content/`: Raw Markdown and JSON source files (`education/`, `guidelines/`, `trials/`, `references/`, `bundle.json`).
- `data/`: Guideline catalogs and datasets (`guidelines/`, `trials/`, `evidence/`).
- `src/`: Application source code (`app.jsx`, `education.jsx`, `guidelines/`, `evidence/`, `simulators/`, `components/`).
- `scripts/`: Validation and bundling tooling (`build-content-bundle.mjs`, `validate-content.mjs`, `validate-evidence.mjs`, `validate-citations.mjs`, `validate-inline-citations.mjs`, `snapshot-example-protocols.mjs`, `check-no-institutional-leak.mjs`).
- `tests/`: Automated Vitest unit tests, Playwright protocol snapshot baselines, and test fixtures.
- `dist/`: Production build output (`index.html`, `app.js`, `app.js.gz`, `app.js.br`, `tailwind.css`).
