# Regression Checklist

Use this checklist before every merge to `main` and GitHub Pages deploy.

## Clinical content integrity
- [ ] No clinically meaningful field was removed without equivalent or better access.
- [ ] Ischemic, ICH, SAH, TIA, CVT pathways remain reachable and complete.
- [ ] Trial matching logic still aligns with diagnosis and severity inputs.
- [ ] Calculator outputs (NIHSS, ICH, mRS, CHA2DS2-VASc, HAS-BLED, etc.) are unchanged unless intentionally updated.

## Safety-critical logic
- [ ] TNK/EVT recommendation logic remains consistent with contraindication handling.
- [ ] Anticoagulation reversal prompts still trigger correctly for hemorrhagic pathways.
- [ ] BP-phase auto-assignment remains correct for ischemic/ICH/SAH contexts.
- [ ] Required-field warnings still display in Encounter when key data are missing.
- [ ] ICH first-hour bundle card remains visible and aligned with reversal/BP/escalation pathways.
- [ ] Large-core EVT evidence callout remains present with conservative eligibility language.
- [ ] SAH first-hour rapid actions card visible at top of SAH management section.
- [ ] CVT treatment timeline strip visible after acute management checklist in CVT tab.
- [ ] AF anticoag timing card appears in secondary prevention when DOAC-for-AF or anticoag-other selected.
- [ ] TNK-first decision card visible for ischemic diagnosis before TNK/EVT checkboxes.
- [ ] Wake-up imaging hard-stop alert visible when lkwUnknown is true (wake-up panel open).
- [ ] Pregnancy rapid actions panel displays when pregnancyStroke checkbox is checked.
- [ ] Pediatric stroke rapid-pathway panel displays and persists checklist fields when age <18 or pediatric pathway is enabled.
- [ ] Maternal postpartum severe-HTN escalation panel fields (postpartum day, OB consult, magnesium decision, delivery coordination) persist and render when pregnancyStroke is selected.
- [ ] Renal-safety alert appears in contrast section when Cr >3 or CrCl <30.
- [ ] PFO closure eligibility card visible in secondary prevention dashboard.
- [ ] Carotid revascularization decision guide visible in secondary prevention dashboard.
- [ ] Ischemic library panel includes Post-EVT BP Guardrail module.
- [ ] TIA library panel includes TIA Disposition Engine module.
- [ ] CVT special-population flags and dynamic plan summary remain present in CVT workflow.
- [ ] Cancer-associated stroke structured pathway fields (mechanism/workup/prevention/oncology consult) render and persist when active cancer is selected.

## Workflow and usability
- [ ] Senior rapid path: key decisions visible within one scroll on desktop.
- [ ] Keyboard shortcuts work (tab switching, phase switching, search, calculator toggle, note copy).
- [ ] Command palette/search remains functional and navigates correctly.
- [ ] New UI changes do not add unnecessary clicks for common acute workflows.
- [ ] DAPT phenotype quick matrix remains visible in secondary prevention workflow when pathway context is present.
- [ ] TIA pathway includes compact phenotype-based DAPT matrix rows (CHANCE/POINT, CHANCE-2, THALES/AIS-2026 IIb, INSPIRES, severe ICAD pattern).
- [ ] Bottom-right quick contacts FAB is visible and opens a callable contact panel.
- [ ] Settings tab shows Contact Directory editor and Reset UW Defaults control.
- [ ] TIA pathway language remains risk-stratified (no universal-admit hard stop text).
- [ ] Phone directory/FAB has NOT been removed unless there is an explicit owner-authored request to remove it.
- [ ] Protected UW defaults remain present with exact numbers: Stroke Phone `206-744-6789`, STAT Pharmacy `206-744-2241`, HMC Stroke RAD Hotline `206-744-8484`.

## Accessibility and responsive behavior
- [ ] Desktop (1440x900), tablet (768x1024), and mobile (390x844) layouts are usable.
- [ ] Focus outlines and keyboard navigation remain intact.
- [ ] Buttons and tap targets remain accessible on mobile.

## Build and runtime
- [ ] `npm run build` passes.
- [ ] `npm run validate:citations` passes.
- [ ] `npm run evidence:watch` regenerates watchlist with `Priority / Score / Rationale` columns.
- [ ] `npm run evidence:index` regenerates `docs/evidence-ops-index.md` with current artifact counts/stamps.
- [ ] Design/protocol-only title patterns remain filtered from high-priority evidence-promotion queue generation.
- [ ] Watchlist includes filtered-candidate audit appendix for reviewer override visibility.
- [ ] `npm run evidence:watch:filtered-all` executes and emits full filtered appendix without breaking downstream refresh pipeline.
- [ ] Watchlist filtered appendix includes reason-count summary table for exclusion-audit visibility.
- [ ] Watchlist filtered appendix includes topic+reason summary table for domain-level exclusion review.
- [ ] Watchlist filtered appendix includes top-topic dominance alert (share vs threshold).
- [ ] `npm run evidence:watch:dominance` executes successfully.
- [ ] Watchlist filtered appendix includes topic-threshold matrix (per-topic share/threshold/status).
- [ ] `npm run evidence:watch:topic-thresholds` executes successfully.
- [ ] Watchlist filtered appendix includes trend table vs previous run for topic-threshold status/share deltas.
- [ ] Watchlist filtered appendix includes topic status-flip alert block with thresholded alert summary.
- [ ] Watchlist pipeline maintains rolling history artifact at `docs/evidence-watch-history.json`.
- [ ] Watchlist filtered appendix includes `Topic Status History (Last 3 Runs)` table.
- [ ] Watchlist filtered appendix includes weighted churn table with flips/oscillation penalties.
- [ ] `npm run evidence:watch:churn` executes successfully.
- [ ] Watchlist weighted churn output includes criticality-weight and adjusted-score columns.
- [ ] `npm run evidence:watch:churn-critical` executes successfully.
- [ ] Churn profile mode (`balanced`, `reperfusion`, `hemorrhage`) is selectable and reflected in watchlist output.
- [ ] `npm run evidence:watch:profile:reperfusion` and `npm run evidence:watch:profile:hemorrhage` execute successfully.
- [ ] External profile config file (`docs/evidence-churn-profiles.json`) is present and loadable by watchlist command.
- [ ] `npm run evidence:watch:profiles-file` executes successfully.
- [ ] `npm run validate:evidence-churn-profiles` executes successfully.
- [ ] CI and scheduled live-smoke workflows capture `output/diagnostics/churn-profile-validation.log` in uploaded artifacts.
- [ ] Smoke QA runtime exceptions are reported as `audit-runtime-error` findings (no full-process crash on single-viewport failure).
- [ ] No blocking runtime errors in browser console on local or live smoke routes.
- [ ] QA smoke report includes local/live app-version parity metadata (`localAppVersion`, `liveAppVersion`, `liveParityChecksEnabled`).
- [ ] Service worker cache version updated when asset behavior changes.
- [ ] `index.html` app version updated for storage/cache compatibility when needed.
- [ ] Smoke QA pediatric scenario (age `<18`) asserts pathway-card visibility, warning output, and generated-note trace.

## Deployment verification
- [ ] Feature branch committed with clear message.
- [ ] Changes merged to `main`.
- [ ] `main` pushed to origin.
- [ ] Live URL `https://rkalani1.github.io/stroke/` serves updated build.
- [ ] Post-deploy smoke checks pass on local + live for all three viewport classes.
- [ ] Scheduled `live-smoke.yml` retains baseline GitHub issue alerting and optional webhook fan-out behavior.

## Last completed run (2026-02-21, iter-118)
- [x] CI and live-smoke workflows now log and artifact-export churn-profile schema validation diagnostics.
- [x] `npm run build` passed.
- [x] `npm test` passed (`Runs: 3 | Issues: 0`).
- [x] `npm run qa` local + live smoke passed (`Runs: 6 | Issues: 0`).

## Last completed run (2026-02-18, iter-037)
- [x] `npm run build` passes
- [x] `npm test` local smoke passes
- [x] `npm run qa` local + live smoke passes
- [x] Required viewports pass on local and live
- [x] Core tabs, diagnosis selectors, trial matcher, and keyboard shortcuts smoke-verified

## Last completed run (2026-02-18, iter-038)
- [x] Diagnosis-switch pathway assertions pass in smoke tests
- [x] TNK visibility gating smoke-verified across ischemic and non-ischemic diagnosis selections
- [x] `npm test` and `npm run qa` both pass with new assertions enabled

## Last completed run (2026-02-18, iter-039)
- [x] `npm test` pass after handoff metadata update
- [x] `npm run qa` pass after handoff metadata update

## Last completed run (2026-02-18, iter-040)
- [x] `npm test` pass after handoff pointer sync
- [x] `npm run qa` pass after handoff pointer sync

## Last completed run (2026-02-18, iter-041)
- [x] `npm test` pass after command-based handoff commit tracking update
- [x] `npm run qa` pass after command-based handoff commit tracking update

## Last completed run (2026-02-20, iter-042)
- [x] `npm run build` pass after contact-directory and evidence text updates
- [x] `npm test` local smoke pass after adding quick-contacts/settings assertions

## Last completed run (2026-02-20, iter-068)
- [x] `npm run build` pass after CVT special-population and QA assertion updates
- [x] `npm run validate:citations` pass (22 citation rows validated)
- [x] `npm test` local smoke pass with 0 issues across desktop/tablet/mobile
- [x] `npm run qa` local + live smoke pass with 0 issues across desktop/tablet/mobile

## Last completed run (2026-02-20, iter-069)
- [x] `npm run build` pass after scenario-level QA assertion updates
- [x] `npm test` local smoke pass with TIA/CVT scenario-state assertions enabled
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-070)
- [x] `npm run build` pass after protected-contact QA invariant updates
- [x] `npm test` local smoke pass with protected-contact assertions
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-071)
- [x] CVT key citation row matches PubMed primary metadata (PMID `38284265`, DOI `10.1161/STR.0000000000000456`)
- [x] `npm test` pass after citation metadata correction
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-072)
- [x] CI workflow added to enforce build + local smoke/citation checks on push/PR
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-073)
- [x] Scheduled live-smoke GitHub workflow added (`live-smoke.yml`)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-074)
- [x] Wake-up/EXTEND scenario assertions stabilized for both standard and compact encounter layouts
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-075)
- [x] Wake-up WAKE-UP/EXTEND non-eligibility reason tracing added across transfer/consult/signout/progress/discharge note outputs
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-076)
- [x] Wake-up note-trace smoke assertions pass (clipboard-validated generated note text)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-077)
- [x] Scheduled live-smoke workflow now opens/updates GitHub issue alerts on failure and auto-closes alerts on success
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-078)
- [x] Contraindication trace includes supportive negatives (when data are documented and in-range)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-079)
- [x] Post-EVT BP infusion/target strategy details now propagate to transfer/signout/progress/discharge note outputs
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-080)
- [x] Citation validator enforces identifier format quality (PMID/DOI/NCT) and duplicate identifier detection
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-081)
- [x] Wake-up smoke includes clipboard assertion for contraindication `Supportive negatives:` note trace output
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-082)
- [x] Post-EVT smoke path restores ischemic + EVT state before note-copy assertion
- [x] Smoke note assertion confirms post-EVT BP plan output includes Nicardipine agent detail
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-083)
- [x] `npm run validate:citations:links` pass (URL health checks; restricted-access links warned, no hard failures)
- [x] Scheduled live-smoke workflow now runs citation URL-health validation pre-QA
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-084)
- [x] `npm run validate:citations:ids` pass (PMID/DOI/NCT endpoint verification)
- [x] `npm run validate:citations:links` pass (warnings only; no hard failures)
- [x] Scheduled live-smoke workflow now runs both URL-health and identifier checks pre-QA
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-085)
- [x] `npm run validate:citations:ids` pass with batched PMID checks and no title-drift warnings
- [x] Corrected high-impact citation metadata mismatches in evidence table (PMID/DOI/source/URL)
- [x] `npm run validate:citations:links` pass (single restricted-access warning)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-086)
- [x] `npm run evidence:watch` pass (watchlist regenerated with current citation baseline)
- [x] Watchlist filtering added (high-signal sources + low-value title exclusion)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-088)
- [x] `npm run evidence:watch` pass with clinician-priority scoring/ranking output
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-20, iter-089)
- [x] Maternal-stroke citation mapping corrected to Stroke record (`PMID 41603019`, DOI `10.1161/STR.0000000000000514`)
- [x] `npm run evidence:watch` pass with refreshed uncited baseline (`22` candidates)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-20, iter-090)
- [x] Structured maternal-stroke escalation workflow added (postpartum severe-HTN + OB/magnesium/delivery coordination fields)
- [x] Structured cancer-stroke mechanism/workup/prevention workflow added
- [x] Safety warnings added for maternal escalation omissions and cancer pathway mismatch/incompleteness
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-091)
- [x] ICH reversal/transfer decision time fields added to management workflow
- [x] ICH warning checks added for missing reversal/transfer timing timestamps
- [x] ICH KPI summaries propagate across transfer/signout/progress/discharge/consult/voice/pathway note outputs
- [x] Case Outcomes dashboard renders ICH `D2-Reversal` and `D2-Transfer` tiles when data are available
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-092)
- [x] SAH outcomes module added (discharge + 90-day standardized tracking fields)
- [x] SAH warning checks added for missing discharge mRS / missing 90-day follow-up / mortality-mRS mismatch
- [x] SAH outcome summaries propagate through transfer/signout/progress/discharge/consult/pathway note outputs
- [x] SAH management UI includes structured outcomes panel with follow-up planning fields
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-093)
- [x] DAPT adherence tracker added to secondary prevention workflow (start/stop date, missed doses, status, transition plan)
- [x] DAPT warning checks added for incomplete protocol documentation and adherence risk
- [x] DAPT adherence summaries propagate across brief/transfer/signout/progress/discharge/consult/pathway notes
- [x] Secondary prevention antithrombotic UI now includes live DAPT adherence trace preview
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-094)
- [x] Dedicated AIS-2026 rapid-delta card added to ischemic management UI
- [x] Case-specific AIS-2026 delta summary helper added and wired to note generation
- [x] AIS delta traces propagate across brief/transfer/signout/progress/discharge/consult/voice/pathway notes
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-095)
- [x] `npm run evidence:promote` generates high-priority promotion queue from watchlist
- [x] New script `scripts/evidence-promotion-checklist.mjs` writes `docs/evidence-promotion-checklist.md`
- [x] Scheduled live-smoke workflow executes `npm run evidence:promote` pre-QA
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-096)
- [x] `validate-evidence-promotion.mjs` added and passes against current watchlist/checklist (`13` PMIDs)
- [x] `npm test` now enforces evidence-promotion sync validation
- [x] `npm run qa` now enforces evidence-promotion sync validation
- [x] `evidence:refresh` command added for watchlist + promotion regeneration
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-097)
- [x] `evidence-promotion-template.mjs` added and generates promotion draft scaffolds
- [x] `npm run evidence:template` generates `docs/evidence-promotion-template.md`
- [x] `evidence:refresh` flow now includes template generation and sync validation
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-098)
- [x] `evidence-promotion-template.mjs` now supports `--priority`, `--pmid`, `--limit`, and `--output`
- [x] `npm run evidence:template:p0` and `npm run evidence:template:top5` added
- [x] `docs/evidence-promotion-template-p0.md` generated for urgent-review subset
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-099)
- [x] Pediatric rapid-pathway checklist added with warning safeguards and note-trace propagation
- [x] `scripts/evidence-ops-index.mjs` + `npm run evidence:index` added and wired into `evidence:refresh` and scheduled live-smoke
- [x] `npm run evidence:refresh` pass (`15` queued high-priority PMIDs; `3` P0 template candidates)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-100)
- [x] Smoke regression now validates pediatric pathway UI/warnings/note-trace in age `<18` scenario
- [x] Existing TIA/CVT library assertions remain passing with pediatric scenario sequenced post-baseline checks
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-101)
- [x] `evidence-watch.mjs` filters design/protocol-only titles from high-priority queue generation
- [x] `npm run evidence:refresh` pass (`24` uncited; `11` P0/P1 queue; `1` P0 candidate)
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-102)
- [x] Watchlist now outputs filtered low-actionability candidate appendix (topic/PMID/reason)
- [x] `npm run evidence:refresh` pass (queue remains `11` high-priority, with transparent filtered appendix)
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-103)
- [x] `npm run evidence:watch:filtered-all` pass (full filtered appendix emitted)
- [x] `npm run evidence:refresh` pass (default appendix limit restored)
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-104)
- [x] Watchlist filtered appendix now includes `Filtered Candidate Summary by Reason`
- [x] `npm run evidence:refresh` pass (high-priority queue remains `11`; filtered total `2`)
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-105)
- [x] Watchlist filtered appendix now includes `Filtered Candidate Summary by Topic and Reason`
- [x] `npm run evidence:refresh` pass (queue stable: `11` high-priority; `2` filtered)
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-106)
- [x] Watchlist filtered appendix now includes `Filtered Topic Dominance Alert` with threshold status
- [x] `npm run evidence:watch:dominance` pass (dominance threshold command path verified)
- [x] `npm run evidence:refresh` pass (queue stable: `11` high-priority; filtered dominance alert emitted)
- [x] `npm run build` pass after TIA phenotype DAPT matrix addition
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-108)
- [x] Watchlist filtered appendix now includes `Filtered Topic Threshold Matrix`
- [x] `npm run evidence:watch:topic-thresholds` pass (custom per-topic thresholds applied)
- [x] `npm run evidence:refresh` pass (default threshold state regenerated)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-109)
- [x] `qa-smoke-report.json` now includes local/live app-version parity metadata fields
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-110)
- [x] Watchlist now includes `Filtered Topic Threshold Trend (vs Previous Run)` table
- [x] `npm run evidence:refresh` pass (trend snapshot regenerated)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-111)
- [x] Watchlist now includes `Topic Status Flip Alert` with thresholded summary
- [x] `npm run evidence:refresh` pass (status-flip block regenerated)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-112)
- [x] Rolling history artifact generated at `docs/evidence-watch-history.json`
- [x] Watchlist includes `Topic Status History (Last 3 Runs)` table
- [x] `npm run evidence:refresh` pass (history + watchlist artifacts regenerated)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-113)
- [x] Watchlist includes `Topic Weighted Churn Score` table
- [x] `npm run evidence:watch:churn` pass
- [x] `npm run evidence:refresh` pass
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-114)
- [x] Weighted churn table now includes criticality-adjusted scoring columns
- [x] `npm run evidence:watch:churn-critical` pass
- [x] `npm run evidence:refresh` pass
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-115)
- [x] Watchlist output now reports active churn profile metadata
- [x] `npm run evidence:watch:profile:reperfusion` pass
- [x] `npm run evidence:refresh` pass (balanced baseline restored)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-116)
- [x] External profile config file created at `docs/evidence-churn-profiles.json`
- [x] `npm run evidence:watch:profiles-file` pass
- [x] `npm run evidence:refresh` pass (profile source trace retained)
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)

## Last completed run (2026-02-21, iter-117)
- [x] `npm run validate:evidence-churn-profiles` pass (3 profiles)
- [x] `npm run evidence:refresh` pass with schema validation gate enabled
- [x] `npm run build` pass
- [x] `npm test` pass (`Runs: 3 | Issues: 0`)
- [x] `npm run qa` local + live smoke pass (`Runs: 6 | Issues: 0`)
