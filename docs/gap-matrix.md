# Gap Matrix

| Clinical domain | Current site coverage | Evidence update (2021-2026) | Gap | Proposed fix | Priority |
|---|---|---|---|---|---|
| AIS thrombolysis (TNK vs alteplase) | TNK and contraindication content present; pathway logic exists. | AcT, TRACE-2, ORIGINAL and ESO TNK recommendation strengthen TNK 0.25 mg/kg role. | Dosing/selection language needs explicit harmonized TNK-first rule with alteplase fallback conditions. | Added TNK-first decision card with dosing, alteplase fallback conditions, and key exclusions before TNK checkbox. | P0 (completed iter-007) |
| Wake-up/unknown onset AIS | Wake-up workflow and unknown LKW fields exist. | TWIST mixed/negative broad effect in non-advanced imaging contexts; imaging-guided selection remains key. | Risk of over-broad thrombolysis interpretation if imaging requirements are not explicit. | Added imaging hard-stop alert at top of wake-up panel requiring DWI-FLAIR or CTP mismatch before thrombolysis. | P0 (completed iter-007) |
| EVT large core | EVT recommendation and LVO fields present. | SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION support EVT benefit in selected large-core patients. | Large-core eligibility messaging may still look restrictive/legacy in parts of UI. | Added large-core evidence highlight and explicit “do not exclude solely for large core” note in ischemic management. | P0 (completed iter-004) |
| ICH hyperacute bundle | ICH pathway and reversal fields present. | 2022 AHA ICH guideline + INTERACT3 bundle evidence + ANNEXA-I + ENRICH surgical data. | Bundle execution steps are spread across sections and can be missed under pressure. | Added one-screen ICH first-hour critical bundle card (BP, reversal, ICU escalation, early surgery screen). | P0 (completed iter-004) |
| SAH pathway | SAH sections and grading tools present. | 2023 AHA SAH guideline reinforces early securement + DCI prevention workflows. | High-value SAH first-hour actions not consolidated in single rapid card. | Added SAH first-hour rapid actions card (airway/ICU, BP, securing, nimodipine, hydrocephalus, DCI surveillance). | P1 (completed iter-006) |
| CVT pathway | CVT section exists. | 2024 AHA CVT statement + ACTION-CVT observational evidence for DOAC transition in selected patients. | CVT anticoag and escalation sequence could be more explicit. | Added CVT treatment timeline strip (acute/subacute/duration/escalation) with ACTION-CVT DOAC data. | P1 (completed iter-006) |
| Secondary prevention DAPT | Prevention content present. | CHANCE-2, INSPIRES refine phenotype-specific DAPT selection and duration. | DAPT duration guidance may be diffuse across notes/checklists. | Add compact DAPT matrix by phenotype/timing (minor stroke/high-risk TIA/LAA context). | P0 |
| AF-related anticoag timing | AF, CHA2DS2-VASc and HAS-BLED support present. | ELAN and TIMING support earlier DOAC in selected patients. | App lacks explicit early-vs-delayed anticoag timing card tied to infarct size/hemorrhage risk. | Added AF anticoag timing quick card in prevention section (CATALYST/ELAN/TIMING grid + caution flags). | P1 (completed iter-006) |
| Pregnancy/peripartum stroke | Limited explicit pregnancy-focused operational guidance. | Maternal stroke focused update emphasizes urgent, coordinated stroke care. | Special-population workflow not surfaced enough in acute view. | Enhanced pregnancy panel with 4-cell rapid actions grid (treatment, coordination, differential, medication safety). | P1 (completed iter-007) |
| Renal dysfunction and anticoag dosing | Creatinine and CrCl fields exist. | Recent guidance emphasizes dose-pathway safety for anticoagulation and imaging contrast decisions. | Decision-support prompts for renal dosing/contrast precautions are not prominent. | Added renal-safety auto-alert in contrast section (CrCl-based) + existing DOAC dose checker already covers anticoag. | P1 (completed iter-008) |
| Senior-first cognitive load | Fast tools exist (search, shortcuts, calculators), but pathway auto-routing can interrupt utility workflows. | Implementation data favor protocolized, low-friction workflows. | Diagnosis updates can pull users away from active utility tabs. | Keep diagnosis-aware routing but preserve user intent when in Calculators/References. | P1 (completed iter-001) |
| QA/Regression discipline | Build pipeline exists, no automated tests, compare-keys script exists. | High-acuity clinical apps need strict non-regression controls. | No standardized regression checklist in repo. | Added regression-checklist.md. Fixed compare_keys.ps1 false positive (0 true mismatches). | P0 (completed iter-001/010) |

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
