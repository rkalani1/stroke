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
