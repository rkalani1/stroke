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
