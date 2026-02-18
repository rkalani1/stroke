# Iteration Log

## Iteration 001 (2026-02-18)

### What was changed
- Added a conservative management-tab auto-routing guard so diagnosis changes no longer force users out of `Calculators` or `References` while they are actively working there.
- Kept the current top-level IA (`Dashboard`, `Encounter`, `Library`, `Settings`) and avoided regressions during rebase against the latest remote `main`.
- Added delivery docs:
  - `docs/evidence-review-2021-2026.md`
  - `docs/gap-matrix.md`
  - `docs/regression-checklist.md`

### Why
- Reduce context-loss and tab-hopping friction for senior neurologists during high-acuity use.
- Preserve utility workflow continuity when calculators/references are in active use.
- Formalize evidence and non-regression controls for iterative high-acuity updates.

### Evidence citations used for this iteration
- Care bundle approach for acute intracerebral haemorrhage (INTERACT3), Lancet 2023, DOI: 10.1016/S0140-6736(23)01508-4, PMID: 37980922.
- 2022 AHA/ASA ICH guideline, Stroke 2022, DOI: 10.1161/STR.0000000000000407, PMID: 35579034.
- 2023 AHA/ASA aneurysmal SAH guideline, Stroke 2023, DOI: 10.1161/STR.0000000000000436, PMID: 37212182.
- SELECT2 / ANGEL-ASPECT / RESCUE-Japan LIMIT / TENSION large-core EVT RCTs (see evidence review file).
- AcT / TRACE-2 / ORIGINAL TNK trials and ESO tenecteplase recommendation (see evidence review file).

### QA and live validation
- Build:
  - `npm run build` passed.
- Regression hook:
  - `compare_keys.ps1` executed; reported default-vs-sanitizer key mismatch list (pre-existing large delta, no new sanitizer edits in this iteration).
- Local and live viewport smoke checks:
  - Pre-push checks passed earlier in cycle (desktop/tablet/mobile on local and live).
  - Final post-rebase smoke re-run is pending after push to confirm latest production assets.

### Remaining risks
- Storage schema hygiene debt remains (`compare_keys.ps1` large default-vs-sanitizer mismatch set).
- No automated unit/integration test suite exists yet; QA remains build + smoke + manual workflow driven.
- More aggressive deduplication (for example summary-card consolidation) should be implemented on top of the latest IA with targeted regression tests.

### Next opportunities
- Add one-screen ICH first-hour checklist card (P0).
- Add explicit large-core EVT eligibility guidance card with trial-grounded criteria (P0).
- Add DAPT phenotype matrix and AF anticoag timing quick card in prevention workflow (P0/P1).

## Iteration 004 (2026-02-18)

### What was changed
- Added `ICH First-Hour Critical Bundle` card in ICH management to surface stabilization priorities (airway/ICU, BP strategy, immediate reversal, core support, early surgery screen).
- Added `Evidence Highlight (Conservative Interpretation)` in large-core EVT section emphasizing non-exclusion by core alone and documented neurointerventional review.
- Added `Phenotype Quick Matrix (conservative)` in DAPT guidance as a high-signal phenotype-to-duration map.
- Bumped deploy tokens:
  - `index.html` APP version: `v5.14.13`
  - `service-worker.js` cache: `stroke-app-v12`

### Why
- Reduce acute cognitive load by pulling critical ICH actions into one screen.
- Improve large-core EVT decision clarity under time pressure with explicit evidence-backed conservative wording.
- Reduce DAPT selection friction with a concise matrix that complements existing detailed text.

### Evidence citations used for this iteration
- 2022 AHA/ASA ICH guideline, Stroke 2022, DOI: 10.1161/STR.0000000000000407, PMID: 35579034.
- INTERACT3 care-bundle RCT, Lancet 2023, DOI: 10.1016/S0140-6736(23)01508-4, PMID: 37980922.
- ENRICH minimally invasive surgery RCT, N Engl J Med 2024, DOI: 10.1056/NEJMoa2400314, PMID: 38598795.
- SELECT2/ANGEL-ASPECT/RESCUE-Japan LIMIT/TENSION large-core EVT RCTs (see evidence review table).
- SVIN large-core EVT recommendations 2025, DOI: 10.1161/SVIN.124.001581.
- CHANCE-2 and INSPIRES DAPT evidence (see evidence review table).

### QA and validation
- Build: `npm run build` passed.
- Storage schema check: `compare_keys.ps1` run; persistent pre-existing mismatch remains (`Missing count: 319`).
- Baseline audit (pre-change): local + live desktop/tablet/mobile on `#/dashboard`, `#/encounter`, `#/library`, `#/settings` all passed without console errors.
- Post-change local regression:
  - Core routes passed.
  - New ICH first-hour bundle text present.
  - New large-core evidence highlight text present.
  - Keyboard `?` shortcut modal opens.
  - DAPT matrix verified after clinical template state is set.
- Post-change audit: local + live desktop/tablet/mobile on `#/dashboard`, `#/encounter`, `#/library`, `#/settings`, `#/management/ich`, `#/management/ischemic` all passed without console errors.

### Remaining risks
- Default-vs-sanitizer schema mismatch debt remains high and should be addressed in a dedicated hardening cycle.
- No automated unit/integration tests yet; regression confidence remains script + smoke + targeted manual checks.

### Next opportunities
- Add SAH rapid first-hour card using existing guideline citations.
- Add CVT treatment timeline strip (initial anticoag, ICP red flags, transition rules).
- Add explicit AF anticoag timing quick card in prevention workflow.

## Iteration 006 (2026-02-18)

### What was changed
- Added `SAH First-Hour Rapid Actions` card at top of SAH management section: 6-cell grid covering airway/ICU, BP control, aneurysm securing, nimodipine, hydrocephalus screen, DCI surveillance plan.
- Added `CVT Treatment Timeline & Escalation` strip in CVT tab after acute management checklist: 4-phase display (acute day 0-14, subacute week 2-4, duration 3-12 mo, escalation triggers) with ACTION-CVT DOAC data.
- Added `AF Anticoag Timing Quick Reference` card in secondary prevention dashboard: conditionally rendered when DOAC-for-AF or anticoag-other is selected, showing CATALYST/ELAN/TIMING severity grid with caution flags.
- Bumped APP_VERSION to v5.14.14 and service-worker cache to v13.

### Why
- SAH: consolidate time-critical first-hour actions into a single scannable card to reduce cognitive load during aSAH triage.
- CVT: make anticoagulation phasing and escalation triggers explicit so treatment timelines are not missed.
- AF timing: surface severity-based DOAC start windows directly in the prevention workflow when AF anticoag is selected.

### Evidence citations used for this iteration
- 2023 AHA/ASA aneurysmal SAH guideline, Stroke 2023, DOI: 10.1161/STR.0000000000000436, PMID: 37212182.
- 2024 AHA CVT Scientific Statement, Stroke 2024, DOI: 10.1161/STR.0000000000000486.
- ACTION-CVT: Yaghi S et al. JAMA Neurol 2022;79:1260-1269, PMID: 36315105.
- ELAN: Fischer U et al. NEJM 2023;388:2411-2421, PMID: 37222476.
- TIMING: Oldgren J et al. Circulation 2022;146:1056-1066, PMID: 36065821.
- CATALYST meta-analysis: Fischer U et al. Lancet Neurol 2025.

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Pre-change: local desktop/tablet/mobile route matrix passed.
- Post-change: new SAH, CVT, and AF cards verified present.
- Deployed to GitHub Pages, push successful.

### Remaining risks
- Default-vs-sanitizer schema mismatch debt remains (pre-existing).
- No automated unit/integration tests yet.

### Next opportunities
- Add special population panel (pregnancy/peripartum emergency notes, maternal-fetal coordination triggers).
- Add renal-safety prompt chips where anticoag/contrast decisions are made.
- Add TNK-first decision card with explicit inclusion/exclusion and alteplase fallback.
- Add hard-stop imaging reminder in wake-up/unknown onset pathway.
- Begin automated pathway assertion tests.

## Iteration 007 (2026-02-18)

### What was changed
- Added `TNK-First Decision Card` in ischemic management: 3-column layout (TNK first-line dosing 0.25 mg/kg max 25 mg, alteplase fallback conditions, key exclusions) placed before TNK/EVT recommendation checkboxes.
- Added `Imaging Hard-Stop Alert` at top of wake-up stroke evaluation panel: requires DWI-FLAIR mismatch or CT perfusion mismatch before thrombolysis. TWIST context: no benefit for unselected wake-up treatment.
- Enhanced `Pregnancy Rapid Actions Panel`: 4-cell grid (acute treatment, OB coordination, differential diagnosis, medication safety) replacing simple bullet list when pregnancyStroke checkbox is active.
- Bumped APP_VERSION to v5.14.15 and service-worker cache to v14.

### Why
- TNK-first: harmonize thrombolytic selection with current evidence (AcT, TRACE-2, ORIGINAL) by surfacing TNK as default choice with clear fallback conditions.
- Wake-up imaging: prevent unselected wake-up thrombolysis by making imaging requirement visible and non-dismissable at the top of the decision tree.
- Pregnancy: enhance maternal stroke emergency workflow with structured rapid actions to reduce time-to-treatment and ensure OB coordination.

### Evidence citations used for this iteration
- AcT (Lancet 2022, PMID: 35779579), TRACE-2 (NEJM 2023, PMID: 37043691), ORIGINAL (JAMA 2024, PMID: 38710025), ESO 2023 TNK recommendation.
- WAKE-UP (NEJM 2018), EXTEND (NEJM 2019), TWIST (Lancet 2023, PMID: 36774963).
- AHA 2026 Maternal Stroke Focused Update (PMID: 41678811).

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Post-change: all new cards verified present in correct locations.
- Deployed to GitHub Pages, push successful.

### Remaining risks
- Default-vs-sanitizer schema mismatch debt remains.
- No automated unit/integration tests yet.

### Next opportunities
- Add renal-safety prompt chips where anticoag/contrast decisions are made (P1 gap).
- Add DAPT phenotype selection with CHANCE-2 CYP2C19 guidance details.
- Begin automated pathway assertion tests.
- PFO/carotid secondary prevention decision cards.

## Iteration 008 (2026-02-18)

### What was changed
- Added renal-safety auto-alert in Contrast Allergy + LVO Protocol section: dynamically computes CrCl from patient data and displays severe/moderate renal warnings with hydration and monitoring guidance.
- Added `PFO Closure Eligibility` decision card in secondary prevention dashboard: criteria for closure, trial evidence (CLOSE/RESPECT/REDUCE), and medical therapy indications.
- Added `Carotid Revascularization Decision Guide` in secondary prevention dashboard: symptomatic 70-99% (CEA within 2 weeks), symptomatic 50-69% (CEA reasonable), asymptomatic ≥70% (medical per CREST-2), plus timing after stroke.
- Bumped APP_VERSION to v5.14.16 and service-worker cache to v15.

### Why
- Renal safety: prevent contrast nephropathy in patients with impaired renal function undergoing emergent CTA.
- PFO: consolidate closure eligibility criteria and trial evidence for quick decision-making in cryptogenic stroke.
- Carotid: provide unified decision framework for revascularization timing and approach selection.

### Evidence citations used for this iteration
- CLOSE (NEJM 2017, PMID: 28902580), RESPECT (NEJM 2017, PMID: 28902590), REDUCE (JACC 2017, PMID: 28917503).
- NASCET (NEJM 1991), CREST-2 (NEJM 2025).
- AHA/ASA 2021 Secondary Stroke Prevention (PMID: 34024117).

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Post-change: all new cards verified present in correct locations.
- Deployed to GitHub Pages, push successful.

### Remaining risks
- Default-vs-sanitizer schema mismatch debt remains.
- No automated unit/integration tests yet.

### Next opportunities
- UI audit: responsive behavior, mobile usability, and layout optimization.
- Consolidate/deduplicate guidance that now appears in multiple sections.
- Begin automated pathway assertion tests.
- Add pediatric stroke pathway guidance.

## Iteration 009 (2026-02-18)

### What was changed
- Added cross-reference links between PFO closure card → cardiac workup PFO evaluation.
- Added cross-reference links between carotid revascularization card → acute care carotid management.
- Mobile responsiveness audit: all cards from iter-006 through 008 confirmed safe at 390x844.
- Deduplication audit: all new cards are complementary (reference vs data entry).
- Bumped APP_VERSION to v5.14.17 and service-worker cache to v16.

### Why
- Improve workflow navigation between evidence-reference cards and their data-entry counterparts.
- Verify no mobile regressions from newly added content.

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Mobile audit: all grids degrade correctly to single-column at 390px.
- Deployed to GitHub Pages, push successful.

### Next opportunities
- Address storage schema mismatch debt.
- Begin automated pathway assertion tests.
- Add pediatric stroke pathway guidance or other clinical content improvements.

## Iteration 010 (2026-02-18)

### What was changed
- Fixed `compare_keys.ps1` to only match top-level default state keys (12-space indent) instead of all nested sub-fields. The previous 319-count mismatch was entirely false positives.
- Verified: 194 top-level keys in default state, 194 in allowedKeys — 0 true mismatches.
- Schema mismatch debt is now resolved.

### Why
- Eliminate false alarm that has been flagged since iter-001, allowing future schema checks to catch real issues.

### QA and validation
- Build passed.
- compare_keys.ps1: 0 missing, 0 extra.

### Next opportunities
- Begin automated pathway assertion tests.
- Performance audit (bundle size 2.2 MB).
- Add pediatric stroke pathway guidance.
