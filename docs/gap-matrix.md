# Gap Matrix

| Clinical domain | Current site coverage | Evidence update (2021-2026) | Gap | Proposed fix | Priority |
|---|---|---|---|---|---|
| AIS thrombolysis (TNK vs alteplase) | TNK and contraindication content present; pathway logic exists. | AcT, TRACE-2, ORIGINAL and ESO TNK recommendation strengthen TNK 0.25 mg/kg role. | Dosing/selection language needs explicit harmonized TNK-first rule with alteplase fallback conditions. | Added TNK-first decision card with dosing, alteplase fallback conditions, and key exclusions before TNK checkbox. | P0 (completed iter-007) |
| Wake-up/unknown onset AIS | Wake-up workflow and unknown LKW fields exist. | TWIST mixed/negative broad effect in non-advanced imaging contexts; imaging-guided selection remains key. | Risk of over-broad thrombolysis interpretation if imaging requirements are not explicit. | Added imaging hard-stop alert at top of wake-up panel requiring DWI-FLAIR or CTP mismatch before thrombolysis. | P0 (completed iter-007) |
| EVT large core | EVT recommendation and LVO fields present. | SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION support EVT benefit in selected large-core patients. | Large-core eligibility messaging may still look restrictive/legacy in parts of UI. | Added large-core evidence highlight and explicit “do not exclude solely for large core” note in ischemic management. | P0 (completed iter-004) |
| ICH hyperacute bundle | ICH pathway and reversal fields present. | 2022 AHA ICH guideline + INTERACT3 bundle evidence + ANNEXA-I + ENRICH surgical data. | Bundle execution steps are spread across sections and can be missed under pressure. | Added one-screen ICH first-hour critical bundle card (BP, reversal, ICU escalation, early surgery screen). | P0 (completed iter-004) |
| SAH pathway | SAH sections and grading tools present. | 2023 AHA SAH guideline reinforces early securement + DCI prevention workflows. | High-value SAH first-hour actions not consolidated in single rapid card. | Added SAH first-hour rapid actions card (airway/ICU, BP, securing, nimodipine, hydrocephalus, DCI surveillance). | P1 (completed iter-006) |
| CVT pathway | CVT section exists. | 2024 AHA CVT statement + ACTION-CVT observational evidence for DOAC transition in selected patients. | CVT anticoag and escalation sequence could be more explicit. | Added CVT treatment timeline strip (acute/subacute/duration/escalation) with ACTION-CVT DOAC data. | P1 (completed iter-006) |
| Secondary prevention DAPT | Prevention content present. | CHANCE-2, INSPIRES refine phenotype-specific DAPT selection and duration. | DAPT duration guidance may be diffuse across notes/checklists. | Added compact phenotype-based DAPT matrix (CHANCE/POINT, CHANCE-2, THALES/AIS-2026 IIb, INSPIRES, SAMMPRIS-pattern severe ICAD) in TIA workflow. | P0 (completed iter-106) |
| AF-related anticoag timing | AF, CHA2DS2-VASc and HAS-BLED support present. | ELAN and TIMING support earlier DOAC in selected patients. | App lacks explicit early-vs-delayed anticoag timing card tied to infarct size/hemorrhage risk. | Added AF anticoag timing quick card in prevention section (CATALYST/ELAN/TIMING grid + caution flags). | P1 (completed iter-006) |
| Pregnancy/peripartum stroke | Limited explicit pregnancy-focused operational guidance. | Maternal stroke focused update emphasizes urgent, coordinated stroke care. | Special-population workflow not surfaced enough in acute view. | Enhanced pregnancy panel with 4-cell rapid actions grid (treatment, coordination, differential, medication safety). | P1 (completed iter-007) |
| Renal dysfunction and anticoag dosing | Creatinine and CrCl fields exist. | Recent guidance emphasizes dose-pathway safety for anticoagulation and imaging contrast decisions. | Decision-support prompts for renal dosing/contrast precautions are not prominent. | Added renal-safety auto-alert in contrast section (CrCl-based) + existing DOAC dose checker already covers anticoag. | P1 (completed iter-008) |
| Senior-first cognitive load | Fast tools exist (search, shortcuts, calculators), but pathway auto-routing can interrupt utility workflows. | Implementation data favor protocolized, low-friction workflows. | Diagnosis updates can pull users away from active utility tabs. | Keep diagnosis-aware routing but preserve user intent when in Calculators/References. | P1 (completed iter-001) |
| QA/Regression discipline | Build pipeline exists, no automated tests, compare-keys script exists. | High-acuity clinical apps need strict non-regression controls. | No standardized regression checklist in repo. | Added regression-checklist.md. Fixed compare_keys.ps1 false positive (0 true mismatches). | P0 (completed iter-001/010) |

## Iteration 118 Update (2026-02-21)
- CI diagnostics-export gap reduced:
  - Added churn-profile schema validation logging to both GitHub workflows.
  - Added artifact upload coverage for `output/diagnostics/churn-profile-validation.log` plus core evidence-governance artifacts to improve failed-run triage.
- QA harness resilience gap reduced:
  - Smoke automation now applies deterministic Playwright action timeouts.
  - Per-viewport runtime failures are captured as structured issues, preventing whole-run hard aborts from a single flaky interaction.
- Remaining workflow gap:
  - Optional step-level smoke timing telemetry for faster root-cause isolation when scheduled runs degrade.

## Iteration 037 Update (2026-02-18)
- QA/Regression discipline: upgraded from failing placeholder test to real smoke automation across required desktop/tablet/mobile viewports.
- Remaining gap: add deterministic scenario assertions for treatment recommendation correctness (ischemic reperfusion, ICH reversal/BP, SAH/CVT/TIA branch logic), not just workflow presence.

## Iteration 038 Update (2026-02-18)
- QA/Regression discipline: added diagnosis-switch pathway checks to smoke automation, including TNK visibility gating across ischemic vs non-ischemic diagnoses.
- Remaining gap: add explicit outcome-value assertions (not just control visibility) for recommendation states in trial-like scenarios.

## Iteration 039 Update (2026-02-18)
- Operational continuity gap reduced: interruption handoff now references the current commit and an immediately executable resume command for this workspace.

## Iteration 040 Update (2026-02-18)
- Operational gap (stale handoff commit pointer) closed; resume metadata now matches latest deployed commit.

## Iteration 041 Update (2026-02-18)
- Continuous-ops metadata drift mitigated by moving from static commit hashes to command-based retrieval in handoff.

## Iteration 042 Update (2026-02-20)
- Workflow reliability gap closed for on-call operations: restored bottom-right quick-call contact FAB plus editable UW contact directory defaults in Settings.
- Evidence/content gap updates:
  - TIA disposition language converted from universal admission to risk-stratified pathways per AHA TIA ED statement.
  - Extended-window IVT narrative refreshed with TIMELESS + OPTION context.
  - Xa reversal language updated to agent-specific andexanet/PCC selection with local protocol framing.
  - Premorbid disability EVT warning reframed from hard-stop to shared-decision warning.
  - Spasticity block aligned to 2026 AHA statement and hormonal-risk block expanded for transgender and testosterone counseling context.
- Remaining gap: add deterministic scenario-level clinical assertions (for example TIA low-risk outpatient pathway vs high-risk admission) in smoke QA, not only static text/control presence.

## Iteration 068 Update (2026-02-20)
- CVT special-population gap reduced:
  - Added explicit structured pathway flags for pregnancy/postpartum, APS, active cancer, severe thrombophilia.
  - Added dynamic management outputs (acute agent, long-term strategy, duration, cautions) and propagated into note exports.
  - Safety checks now consume these structured fields rather than relying only on legacy anticoag toggles.
- QA/Regression discipline gap reduced:
  - Added deterministic smoke assertions for three newly introduced high-impact modules: Post-EVT BP Guardrail, TIA Disposition Engine, and updated MeVO wording.
  - Added evidence citation metadata validator (`validate:citations`) to prevent silent citation-structure drift.
- Remaining gap:
  - Add scenario-driven decision-state assertions (for example APS+DOAC error transitions and TIA risk-tier disposition changes), not just static component presence.

## Iteration 069 Update (2026-02-20)
- Scenario-level QA gap reduced:
  - Added deterministic state-transition assertions for TIA disposition (high-risk trigger) and CVT APS caution output.
  - Smoke coverage now validates behavior changes, not only component presence.
- Remaining QA gap:
  - Add scenario assertions for wake-up/extended-window auto-perfusion eligibility state transitions and contraindication-trace output in note generation.

## Iteration 070 Update (2026-02-20)
- On-call contact safety gap reduced:
  - Added deterministic regression invariants for protected UW quick-call contacts (labels and phone numbers) in both FAB and Settings directory views.
  - This directly enforces the explicit non-removal policy for critical on-call communication pathways.
- Remaining operations gap:
  - Add CI-level fail-fast gate that runs the smoke suite on every push to prevent manual-only execution drift.

## Iteration 071 Update (2026-02-20)
- Evidence metadata fidelity gap reduced:
  - Resolved CVT DOI inconsistency by aligning docs to PubMed-confirmed citation (PMID `38284265`, DOI `10.1161/STR.0000000000000456`).
- Remaining evidence ops gap:
  - Periodically re-verify all PMID/DOI pairs in table against source endpoints to catch drift introduced by manual edits.

## Iteration 072 Update (2026-02-20)
- CI enforcement gap reduced:
  - Added GitHub Actions CI workflow to run build and smoke/citation checks for all pushes and PRs to `main`.
  - Added smoke artifact upload for failed-run diagnostics.
- Remaining reliability gap:
  - Add branch protection policy requiring CI success before merge (repo settings-level step, outside codebase).

## Iteration 073 Update (2026-02-20)
- Live-monitoring gap reduced:
  - Added scheduled daily live-smoke GitHub Actions workflow (`live-smoke.yml`) running full local+live audit.
  - Added artifact retention path for screenshot/report triage.
- Remaining operations gap:
  - Add notification routing (for example Slack/email) for failed scheduled smoke runs via repo settings/integrations.

## Iteration 074 Update (2026-02-20)
- Scenario-level wake-up QA gap reduced:
  - Added layout-aware wake-up/EXTEND smoke flow handling for both standard and compact encounter forms.
  - Added deterministic recovery for LKW auto-collapse so wake-up pathway controls are always reachable in smoke audits.
  - Added manual EXTEND-criteria fallback assertions when direct CTP perfusion input controls are not rendered in compact mode.
- Remaining QA gap:
  - Add deterministic assertions for wake-up contraindication-trace propagation into generated notes (not only on-screen recommendation state).

## Iteration 075 Update (2026-02-20)
- Wake-up contraindication-trace documentation gap reduced:
  - Added explicit non-eligibility reason output for WAKE-UP/EXTEND in transfer, consult, signout, progress, and discharge note templates.
  - Notes now show missing MRI-path criteria (for WAKE-UP) and missing CTP/manual-perfusion criteria (for EXTEND) when eligibility is not met.
- Remaining QA gap:
  - Add deterministic smoke assertions that directly validate generated note text for wake-up non-eligibility trace lines.

## Iteration 076 Update (2026-02-20)
- Wake-up note-trace QA gap reduced:
  - Added deterministic smoke assertions that copy generated Encounter note text and validate wake-up eligibility/non-eligibility rationale lines.
  - Added conditional expectation handling for both paths:
    - auto-eligible EXTEND trace when direct CTP perfusion inputs are present
    - non-eligible rationale trace when compact layout hides direct perfusion inputs
- Remaining reliability gap:
  - Add alert routing for scheduled live-smoke CI failures (integration/repo settings layer).

## Iteration 077 Update (2026-02-20)
- Scheduled live-smoke alert-routing gap reduced:
  - Added built-in GitHub issue alerting on `live-smoke.yml` failure (label: `live-smoke-alert`).
  - Added automatic closure of open alert issues when a later scheduled/manual live-smoke run succeeds.
- Remaining operations gap:
  - Optional external notification fan-out (Slack/email/PagerDuty) if additional channels are desired beyond GitHub issue routing.

## Iteration 078 Update (2026-02-20)
- Documentation-safety gap reduced:
  - Expanded contraindication trace output to include structured **supportive negatives** (not only blockers/cautions), improving rapid chart review and handoff clarity.
  - Supportive-negative output is conditionally evidence-safe (only emitted when specific entered data meet thresholds).
- Remaining workflow gap:
  - Add dedicated UI capture fields for infusion/drip parameters to improve ICU handoff granularity in note templates.

## Iteration 079 Update (2026-02-20)
- ICU handoff granularity gap reduced:
  - Wired existing post-EVT BP guardrail fields (reperfusion status, infusion agent, target strategy) into transfer/signout/progress/discharge note outputs.
  - This improves shift-to-shift continuity without adding new data-entry burden.
- Remaining workflow gap:
  - Add generalized non-EVT infusion/drip capture (for example vasopressors/sedation) if broader neurocritical workflows require it.

## Iteration 080 Update (2026-02-20)
- Evidence-metadata integrity gap reduced:
  - Citation validator now enforces PMID/DOI/NCT format quality and cross-row duplicate identifier checks.
  - This lowers risk of silent metadata drift when evidence rows are edited over time.
- Remaining evidence-ops gap:
  - Add optional automated link-health checks for citation URLs to detect dead links early.

## Iteration 081 Update (2026-02-20)
- Note-trace regression gap reduced:
  - Added deterministic smoke assertion for contraindication `Supportive negatives:` output in generated Encounter note text.
  - Scenario now seeds representative lab/imaging vitals context before clipboard note validation.
- Remaining evidence-ops gap:
  - Optional citation URL link-health checks remain pending.

## Iteration 082 Update (2026-02-20)
- Post-EVT handoff regression gap reduced:
  - Smoke automation now restores ischemic + EVT decision state before note-copy validation, preventing false negatives from diagnosis-switch cleanup steps.
  - Smoke flow now forces a handoff template (`Signout`) and verifies that structured post-EVT BP plan content with infusion-agent detail is present in exported note text.
- Remaining evidence-ops gap:
  - Optional citation URL link-health checks remain pending.

## Iteration 083 Update (2026-02-20)
- Evidence-ops link-health gap reduced:
  - Citation validator now supports deterministic URL-health checks with timeout/retry and HEAD→GET fallback.
  - Restricted-access responses (`401`/`403`) are surfaced as warnings instead of hard failures to reduce false-positive CI breaks.
  - Scheduled live-smoke workflow now runs citation link-health validation before full QA.
- Remaining evidence-ops gap:
  - Add scheduled PMID/DOI resolver cross-checking (identifier endpoint validation) for deeper metadata drift detection.

## Iteration 084 Update (2026-02-20)
- Evidence-ops identifier-integrity gap reduced:
  - Citation validator now verifies PMID/DOI/NCT endpoint health with dedicated identifier checks.
  - DOI verification was hardened to DOI handle API semantics to avoid false 404 failures from landing-page checks.
  - Scheduled live-smoke workflow now runs both URL-health and identifier-endpoint checks before smoke QA.
- Remaining evidence-ops gap:
  - Add automated watchlist ingestion for newly published 2021-2026 stroke guidance/trials not yet represented in the table.

## Iteration 085 Update (2026-02-20)
- Evidence metadata drift gap reduced:
  - Validator now performs batched PMID metadata retrieval with title-overlap drift warnings (stable under PubMed rate limits).
  - Corrected multiple high-impact citation metadata mismatches (PMID/DOI/source/URL) for thrombolysis, large-core EVT, ICH bundle, and secondary prevention entries.
  - URL-health warnings dropped after replacing unstable non-PubMed links where appropriate.
- Remaining evidence-ops gap:
  - Add automated watchlist ingestion for newly published 2021-2026 stroke guidance/trials not yet represented in the table.

## Iteration 086 Update (2026-02-20)
- Evidence watchlist ingestion gap reduced:
  - Added automated PubMed watchlist generation for uncited, topic-grouped stroke evidence candidates.
  - Added filtering to prioritize high-signal journals and suppress low-value publication formats.
  - Watchlist now persists to `docs/evidence-watchlist.md` for repeatable review and planned citation updates.
- Remaining evidence-ops gap:
  - Add clinician-priority scoring/ranking for watchlist candidates (for example guideline/RCT-first weighting).

## Iteration 088 Update (2026-02-20)
- Evidence watchlist triage gap reduced:
  - Added clinician-priority scoring and ranking to uncited evidence candidates in `scripts/evidence-watch.mjs`.
  - Watchlist now emits explicit `Priority`, `Score`, and `Rationale` fields to support guideline/RCT-first review flow.
- Scheduled-live-smoke external alert fan-out gap reduced:
  - Added optional webhook-based failure notifications in `.github/workflows/live-smoke.yml` using `LIVE_SMOKE_ALERT_WEBHOOK` secret.
  - GitHub issue alerting remains active as baseline channel; webhook fan-out is additive.
- Remaining evidence-ops gap:
  - Add a clinician-approved promotion checklist that maps watchlist `P0/P1` candidates into evidence-table update PR templates (to reduce manual translation friction).

## Iteration 089 Update (2026-02-20)
- Evidence metadata fidelity gap reduced:
  - Corrected maternal-stroke citation mapping to the Stroke statement publication (`PMID: 41603019`, DOI `10.1161/STR.0000000000000514`).
  - Removed mixed-record PMID/DOI pairing from core evidence docs to prevent future identifier drift.
- Watchlist triage baseline refreshed:
  - Regenerated uncited-candidate output after citation correction (`23` → `22` candidates).

## Iteration 090 Update (2026-02-20)
- Special-population workflow gap reduced:
  - Added structured maternal-stroke escalation pathway (postpartum day + severe-HTN/preeclampsia escalation + OB/magnesium/delivery coordination tracking).
  - Added structured cancer-stroke mechanism workflow (probable/possible/conventional classification + workup bundle + prevention branch + oncology co-management state).
- Safety guidance operationalization gap reduced:
  - Added deterministic warning logic for maternal severe-HTN escalation omissions and cancer pathway incompleteness/mechanism-treatment mismatch.
  - Added structured maternal/cancer summary propagation into transfer/signout/progress/discharge/consult/full-note outputs.

## Iteration 091 Update (2026-02-21)
- ICH escalation timeliness gap reduced:
  - Added structured capture for reversal start and transfer decision times in the ICH management workflow.
  - Added computed `door-to-reversal`, `door-to-transfer`, and `reversal-to-transfer` KPIs with inline visibility and dashboard tiles.
  - Added warning prompts for missing ICH timing timestamps when reversal/transfer actions are selected.
  - Added KPI summary propagation into key handoff/documentation outputs for continuity and quality auditability.
- Remaining workflow gap:
  - Add SAH standardized outcome-capture block (discharge + 90-day outcome set) for consistent follow-up measurement.

## Iteration 092 Update (2026-02-21)
- SAH outcome-standardization gap reduced:
  - Added structured SAH outcomes module capturing discharge mRS/disposition and 90-day status/mRS.
  - Added 90-day follow-up scheduling and cognitive/HRQoL planning fields for routine outcome completeness.
  - Added safety warnings for missing discharge mRS, missing 90-day follow-up plan, and inconsistent mortality-vs-mRS coding.
  - Added SAH outcome trace propagation into transfer/signout/progress/discharge/consult/pathway notes.
- Remaining workflow gap:
  - Add secondary-prevention DAPT protocol adherence tracker for eligible minor stroke/TIA pathways.

## Iteration 093 Update (2026-02-21)
- Secondary-prevention DAPT adherence gap reduced:
  - Added structured DAPT adherence tracker fields (start/stop date, missed doses, adherence status, transition planning, barriers).
  - Added warning-layer checks for incomplete DAPT protocol documentation and high-risk nonadherence patterns.
  - Added DAPT adherence trace propagation across key handoff and progress/discharge documentation outputs.
- Remaining workflow gap:
  - Continue incremental protocol polish and trial-index refinements (no unresolved P0/P1 additions currently open in this queue snapshot).

## Iteration 094 Update (2026-02-21)
- AIS 2026 rapid-delta visibility gap reduced:
  - Added dedicated AIS-2026 delta rapid-review UI card in ischemic management workflow.
  - Added structured case-specific AIS-delta trace output into note-generation paths to preserve recommendation-context continuity.
- Remaining workflow gap:
  - Continue iterative protocol/tooling polish and evidence-watchlist triage operations.

## Iteration 095 Update (2026-02-21)
- Evidence promotion-ops gap reduced:
  - Added automated high-priority (`P0/P1`) evidence promotion checklist generation from watchlist output.
  - Added topic-specific promotion-action mapping and structured PMID/DOI/URL queue export.
  - Wired checklist generation into scheduled live-smoke audit workflow for ongoing operational readiness.
- Remaining workflow gap:
  - Add optional PR-template scaffolding that pre-populates evidence-row edits from checklist selections.

## Iteration 096 Update (2026-02-21)
- Evidence-governance drift gap reduced:
  - Added automatic watchlist-to-promotion-checklist sync validation for `P0/P1` PMIDs.
  - Wired sync validation into both `test` and `qa` gates, preventing silent promotion-queue drift.
  - Added composite `evidence:refresh` command to streamline watchlist + checklist regeneration.
- Remaining workflow gap:
  - Optional PR-template scaffolding for one-click promotion of selected checklist items.

## Iteration 097 Update (2026-02-21)
- Evidence promotion templating gap reduced:
  - Added auto-generated PR/issue scaffolding from unchecked promotion-checklist candidates.
  - Added per-candidate metadata patch blocks and standardized workflow-impact checklist sections.
  - Expanded `evidence:refresh` to include template generation and sync validation.
- Remaining workflow gap:
  - Optional selective-template generation (for chosen PMIDs only) to reduce draft volume when queue is large.

## Iteration 098 Update (2026-02-21)
- Selective evidence-template generation gap reduced:
  - Added priority-filtered (`P0`) and capped (`top5`) template generation workflows.
  - Added CLI targeting by PMID and custom output path for focused promotion prep.
  - Generated dedicated urgent promotion draft (`evidence-promotion-template-p0.md`).
- Remaining workflow gap:
  - Optional lightweight UI index for navigating generated evidence-promotion draft files.

## Iteration 099 Update (2026-02-21)
- Special-population pediatric workflow gap reduced:
  - Added structured pediatric pathway fields and UI checklist (consult, transfer-capable center, imaging confirmation, etiology flags, SCD exchange-pathway capture).
  - Added warning-level safeguards for pediatric workflow incompleteness under acute conditions.
  - Added pediatric summary propagation into transfer/signout/progress/discharge/consult/pathway-note outputs.
- Evidence-ops navigation gap reduced:
  - Added auto-generated evidence operations index (`docs/evidence-ops-index.md`) and command (`npm run evidence:index`) for faster maintenance visibility.
  - Integrated index generation and dual template generation (`all` + `p0`) into `evidence:refresh` and scheduled live-smoke workflow.
- Remaining workflow gap:
  - Add scenario-level smoke assertions that specifically verify pediatric-pathway warning transitions and note-trace output in age `<18` cases.

## Iteration 100 Update (2026-02-21)
- Pediatric pathway regression-coverage gap reduced:
  - Added explicit smoke scenario assertions for age `<18` pathway activation, pediatric-warning visibility, checklist control presence, and note-trace propagation.
  - Positioned pediatric scenario after baseline library/settings checks to preserve prior cross-domain regression signal stability.
- Remaining workflow gap:
  - Add optional live-URL artifact extraction for pediatric scenario screenshots to speed remote triage when scheduled smoke failures occur.

## Iteration 101 Update (2026-02-21)
- Evidence-promotion queue noise gap reduced:
  - Filtered design/protocol-only papers (`rationale/design`, `rationale/methods`, protocol-study variants) out of high-priority watchlist candidates.
  - Regenerated watchlist/checklist/template outputs with reduced non-actionable items.
- Queue hygiene impact:
  - uncited watchlist candidates reduced (`28` → `24`),
  - high-priority promotion queue reduced (`15` → `11`),
  - urgent P0 template list narrowed (`3` → `1`).
- Remaining workflow gap:
  - Add optional explicit “filtered as design/protocol-only” audit appendix so reviewers can inspect excluded PMIDs when desired.

## Iteration 102 Update (2026-02-21)
- Evidence triage transparency gap reduced:
  - Added filtered-candidate audit appendix output to watchlist generation so excluded protocol/design papers remain reviewable without polluting actionable queue tiers.
  - Maintained reduced high-priority queue size while exposing exclusion rationale and PMIDs.
- Remaining workflow gap:
  - Add optional CLI flag to emit full (untruncated) filtered appendix when deep manual review is needed.

## Iteration 103 Update (2026-02-21)
- Filtered-appendix control gap reduced:
  - Added explicit watchlist CLI controls for filtered appendix output size/full export (`--filtered-limit`, `--filtered-all`).
  - Added npm helper command `evidence:watch:filtered-all` and surfaced it in evidence-ops maintenance index.
- Remaining workflow gap:
  - Add optional structured diff summary between default and full filtered appendix output for rapid reviewer triage.

## Iteration 104 Update (2026-02-21)
- Filtered-output interpretability gap reduced:
  - Added filtered-candidate summary counts by exclusion reason to the watchlist audit appendix.
  - This enables rapid evaluation of whether filters are over-suppressing any specific publication class.
- Remaining workflow gap:
  - Add optional per-topic filtered-reason matrix (topic x reason counts) for even faster domain-level triage.

## Iteration 105 Update (2026-02-21)
- Domain-level filtered-triage visibility gap reduced:
  - Added per-topic + reason count summary in watchlist filtered appendix.
  - Reviewers can now quickly see which clinical domains are most affected by protocol/design exclusions.
- Remaining workflow gap:
  - Add optional threshold alert when one topic dominates filtered exclusions (potential over-filtering signal).

## Iteration 106 Update (2026-02-21)
- Filter-overreach detection gap reduced:
  - Added watchlist filtered-topic dominance alerting with configurable threshold support (`--filtered-dominance-threshold`).
  - Watchlist now reports top filtered topic share and alert status directly in the audit appendix.
- Secondary-prevention implementation gap reduced:
  - Added compact phenotype-based DAPT matrix in TIA workflow for one-glance regimen selection by clinical phenotype and intended treatment window.
- Remaining workflow gap:
  - Optional per-topic custom dominance thresholds (domain-specific guardrails) if filtering policy needs non-uniform sensitivity.

## Iteration 108 Update (2026-02-21)
- Per-topic filtering-sensitivity gap reduced:
  - Added per-topic threshold overrides for filtered-dominance alerts (`--filtered-topic-threshold topic=value`).
  - Added `Filtered Topic Threshold Matrix` appendix output so reviewers can audit topic-level share against topic-specific thresholds.
  - Added npm helper command `evidence:watch:topic-thresholds` for repeatable policy checks.
- Remaining workflow gap:
  - Optional trend tracking of topic-level alert status across iterations (time-series governance view).

## Iteration 109 Update (2026-02-21)
- QA parity-regression gap reduced:
  - Added local/live app-version detection in smoke automation and enabled live feature-specific assertions only when versions are in sync.
  - Prevents false pre-deploy live failures while preserving strict post-deploy parity enforcement.
  - Smoke report now emits explicit parity metadata (`localAppVersion`, `liveAppVersion`, `liveParityChecksEnabled`).
- Remaining workflow gap:
  - Optional per-feature parity policy registry (to tune which new assertions require live version match before enforcement).

## Iteration 110 Update (2026-02-21)
- Topic-threshold governance-trend gap reduced:
  - Added previous-vs-current trend table for filtered topic thresholds in watchlist output.
  - Trend table now surfaces topic-level share deltas and status transitions (`ALERT`/`OK`) between consecutive runs.
- Remaining workflow gap:
  - Optional alert-on-churn policy when topic status flips repeatedly across consecutive runs.

## Iteration 111 Update (2026-02-21)
- Topic-status churn governance gap reduced:
  - Added explicit topic status-flip alert block (`Topic Status Flip Alert`) in watchlist output.
  - Added configurable status-flip alert threshold (`--topic-status-flip-threshold`) for churn sensitivity control.
- Remaining workflow gap:
  - Optional multi-run persistence tracking (for example 3-run rolling flip count) if longer-horizon churn surveillance is needed.

## Iteration 112 Update (2026-02-21)
- Multi-run churn surveillance gap reduced:
  - Added persistent rolling history artifact (`docs/evidence-watch-history.json`) generated by watchlist pipeline.
  - Added `Topic Status History (Last 3 Runs)` table in watchlist appendix for longitudinal status tracking.
- Remaining workflow gap:
  - Optional weighted churn scoring (for example larger penalties for repeated ALERT->OK->ALERT oscillation).

## Iteration 113 Update (2026-02-21)
- Weighted churn-governance gap reduced:
  - Added `Topic Weighted Churn Score` output using flips + oscillation penalties over rolling history.
  - Added configurable churn controls: `--topic-churn-alert-threshold` and `--topic-churn-lookback`.
  - Added helper command `evidence:watch:churn` for repeatable churn surveillance runs.
- Remaining workflow gap:
  - Optional risk-stratified weighting by topic criticality (for example higher weight for thrombolysis/ICH domains).

## Iteration 114 Update (2026-02-21)
- Risk-stratified churn weighting gap reduced:
  - Added criticality-aware churn scoring with configurable topic weight overrides.
  - Added adjusted-threshold alerting path (`--topic-churn-adjusted-threshold`) alongside base churn threshold.
  - Added helper command `evidence:watch:churn-critical` for high-criticality surveillance mode.
- Remaining workflow gap:
  - Optional institution-specific policy profiles (for example ICU-heavy vs telestroke-heavy weighting presets).

## Iteration 115 Update (2026-02-21)
- Institution-specific governance profile gap reduced:
  - Added churn policy profiles (`balanced`, `reperfusion`, `hemorrhage`) with domain-specific default weights and thresholds.
  - Added profile selection CLI control (`--topic-churn-profile`) and npm helper commands for profile execution.
- Remaining workflow gap:
  - Optional externalized profile config file for site-specific governance customization without script edits.

## Iteration 116 Update (2026-02-21)
- Externalized profile-config gap reduced:
  - Added editable profile configuration artifact (`docs/evidence-churn-profiles.json`).
  - Added file-based profile loading (`--topic-churn-profiles-file`) so governance policy can be customized without modifying script logic.
  - Added profile-source trace output in watchlist appendix for auditability.
- Remaining workflow gap:
  - Optional schema validation gate for profile config file to fail fast on malformed profile definitions.

## Iteration 117 Update (2026-02-21)
- Profile-config schema-validation gap reduced:
  - Added dedicated churn-profile validator script and integrated it into `evidence:refresh`, `test`, and `qa`.
  - malformed profile definitions now fail fast before watchlist generation and smoke execution.
- Remaining workflow gap:
  - Optional CI artifact export of churn-profile validation diagnostics for failed scheduled runs.

## Evidence-backed addition queue (2026-02-20, iter-088 refresh)

| Priority | Proposed addition | Why this matters operationally | Primary evidence anchor |
|---|---|---|---|
| P0 | Add a dedicated **2026 AIS guideline delta** card (adult + pediatric) in ischemic management and note templates. | Ensures new 2026 AHA/ASA recommendations are one-click visible in acute workflow (TNK/alteplase parity, pediatric recognition/escalation, extended-window framing, BP cautions after reperfusion). | 2026 AHA/ASA AIS guideline (PMID: 41582814; DOI: 10.1161/STR.0000000000000513) — completed iter-094 |
| P0 | Add structured **cancer-related stroke classification** workflow block (probable/possible/conventional mechanism + workup bundle + prevention branch). | Converts cancer-stroke statement into explicit triage and secondary-prevention actions, reducing ambiguity in high-recurrence subgroup. | AHA scientific statement (PMID: 41623113; DOI: 10.1161/STR.0000000000000517) — completed iter-090 |
| P0 | Expand maternal module with **postpartum severe-HTN and delivery/stabilization decision prompts**. | Pregnancy-associated stroke admissions cluster around hypertensive disorders; explicit prompts improve time-critical stabilization and OB-neuro coordination. | Maternal stroke statement (PMID: 41603019; DOI: 10.1161/STR.0000000000000514) — completed iter-090 |
| P1 | Add SAH follow-up block for **standardized outcome selection** (discharge + 90-day measure set). | Improves trial-aligned comparability and handoff continuity in aneurysmal SAH recovery tracking. | SAH outcome position paper (PMID: 41498145; DOI: 10.1161/STROKEAHA.125.053470) — completed iter-092 |
| P1 | Add explicit **MeVO trial-state caution** badge in EVT section (routine EVT benefit not yet established; selective use only). | Prevents overgeneralization of EVT to medium/distal occlusions while evidence remains mixed/neutral in RCT era. | ESCAPE-MeVO post-hoc outcome report (PMID: 41651659; DOI: 10.1136/jnis-2025-024733) — completed iter-106 validation |
| P1 | Add anticoag-ICH **door-to-reversal/transfer timer** KPI outputs in dashboard + notes. | Timeliness is a modifiable process metric strongly tied to hemorrhage pathway safety. | Anticoag-ICH timeliness cohort (PMID: 41703701; DOI: 10.1161/JAHA.125.043223) — completed iter-091 |
| P2 | Add secondary-prevention implementation tracker for **DAPT protocol adherence** in eligible minor stroke/TIA phenotypes. | Converts recommendation text into measurable local quality behavior and catches underuse/overuse drift. | Regional implementation analysis (PMID: 41679778; DOI: 10.1136/svn-2025-004815) — completed iter-093 |
