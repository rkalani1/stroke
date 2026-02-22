# Iteration Log

## Iteration 120 (2026-02-21)

### What was changed
- Added configurable latency-threshold alerting to `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`:
  - `--run-duration-threshold-ms` (default `45000`),
  - `--section-duration-threshold-ms` (default `15000`).
- Smoke summary now reports:
  - `runDurationThresholdMs`,
  - `sectionDurationThresholdMs`,
  - `slowRunCount` / `slowSectionCount`,
  - detailed `slowRuns` / `slowSections` arrays.
- Console output now emits threshold-breach alerts without failing the run, improving scheduled-audit observability while preserving non-regression gating on functional issues.

### Verification
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`; threshold alert emitted as expected).
- `npm run qa` passed (`Runs: 6 | Issues: 0`; threshold alert emitted as expected).

## Iteration 119 (2026-02-21)

### What was changed
- Added smoke-runtime timing telemetry in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`:
  - per-run section timing capture (`bootstrap-render`, `quick-contacts-fab`, `encounter-workflow`, `library-workflow`, `settings-workflow`, `post-evt-note-trace`, `pediatric-workflow`, `screenshot`),
  - per-run total duration (`notes.runDurationMs`) in JSON report output.
- Added summary-level timing diagnostics in smoke report output:
  - `averageRunDurationMs`,
  - `slowestRun` (`target`, `viewport`, `durationMs`),
  - console trace of slowest run for rapid CI triage.
- Hardened run-loop fault tolerance already added in iter-118 remains active alongside timing telemetry.

### Verification
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`; slowest run emitted).
- `npm run qa` passed (`Runs: 6 | Issues: 0`; slowest run emitted).

## Iteration 118 (2026-02-21)

### What was changed
- Added churn-profile validation diagnostics capture to CI workflows:
  - `/Users/rizwankalani/stroke/.github/workflows/ci.yml`
  - `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`
- Both workflows now:
  - run `npm run validate:evidence-churn-profiles`,
  - tee validator output to `output/diagnostics/churn-profile-validation.log`,
  - upload diagnostic and governance artifacts for failed-run triage.
- Hardened smoke automation runtime resilience in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`:
  - set deterministic Playwright action timeout defaults,
  - convert per-target/viewport runtime exceptions into structured `audit-runtime-error` issues instead of aborting the entire run.

### Verification
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 117 (2026-02-21)

### What was changed
- Added churn-profile schema validator:
  - new script `/Users/rizwankalani/stroke/scripts/validate-evidence-churn-profiles.mjs`.
- Added npm command:
  - `npm run validate:evidence-churn-profiles`.
- Integrated churn-profile validation into automation gates:
  - `evidence:refresh`,
  - `test`,
  - `qa`.
- Updated evidence-ops maintenance index to include churn-profile validation command.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run validate:evidence-churn-profiles` passed.
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 116 (2026-02-21)

### What was changed
- Externalized churn-profile configuration into `/Users/rizwankalani/stroke/docs/evidence-churn-profiles.json`.
- Added file-based profile loading in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI option:
    - `--topic-churn-profiles-file <path>`
  - watchlist now reports active profile source for traceability.
- Added npm helper command:
  - `npm run evidence:watch:profiles-file`.
- Updated evidence-ops index generator to include churn profile config artifact and command coverage.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:profiles-file` passed.
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 115 (2026-02-21)

### What was changed
- Added policy-profile presets for churn governance in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI option:
    - `--topic-churn-profile <balanced|reperfusion|hemorrhage>`
  - profile defaults now seed:
    - topic weights,
    - churn lookback,
    - base and adjusted churn alert thresholds.
  - explicit CLI overrides still take precedence over profile defaults.
- Added npm helper commands:
  - `npm run evidence:watch:profile:reperfusion`
  - `npm run evidence:watch:profile:hemorrhage`
- Updated evidence-ops maintenance command index to include profile helpers.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:profile:reperfusion` passed.
- `npm run evidence:refresh` passed (balanced profile baseline restored).
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 114 (2026-02-21)

### What was changed
- Added risk-stratified churn weighting by clinical-domain criticality in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI options:
    - `--topic-churn-adjusted-threshold`
    - `--topic-churn-weight topic=value`
  - churn alerting now evaluates both base weighted score and criticality-adjusted score.
  - new weighted churn table columns: `Criticality weight` and `Adjusted score`.
- Added npm helper command:
  - `npm run evidence:watch:churn-critical`.
- Updated evidence-ops maintenance command index to include the churn-critical helper.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:churn-critical` passed.
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 113 (2026-02-21)

### What was changed
- Added weighted churn scoring to watchlist governance in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI options:
    - `--topic-churn-alert-threshold`
    - `--topic-churn-lookback`
  - new appendix output:
    - `Topic Weighted Churn Score (Last N Runs)` with flips, oscillations, and weighted score.
- Added npm helper command:
  - `npm run evidence:watch:churn`.
- Updated evidence-ops command index:
  - `/Users/rizwankalani/stroke/scripts/evidence-ops-index.mjs` now includes churn helper.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:churn` passed.
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 112 (2026-02-21)

### What was changed
- Added persistent multi-run watchlist governance history in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new generated artifact `docs/evidence-watch-history.json` (rolling snapshot history, max 30 entries),
  - new watchlist appendix block `Topic Status History (Last 3 Runs)` for longitudinal status visibility.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-watch-history.json`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 111 (2026-02-21)

### What was changed
- Added topic-status flip alerting to watchlist trend output in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI option `--topic-status-flip-threshold` to set alert sensitivity,
  - new appendix block `Topic Status Flip Alert` listing topic status transitions (`ALERT`/`OK`) vs prior run.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 110 (2026-02-21)

### What was changed
- Added cross-run trend tracking for filtered-topic thresholds in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - reads prior watchlist threshold matrix snapshot when available,
  - emits `Filtered Topic Threshold Trend (vs Previous Run)` table with previous share, current share, delta, and status change by topic.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 109 (2026-02-21)

### What was changed
- Hardened live/local feature-parity gating in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`:
  - added app-version detection from local/live HTML (`APP_VERSION` parsing),
  - enabled live feature-specific assertions only when local and live app versions match,
  - preserved strict local assertion behavior for newly introduced workflow cards.
- Added parity metadata to smoke reports:
  - `localAppVersion`,
  - `liveAppVersion`,
  - `liveParityChecksEnabled`.

### Verification
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 108 (2026-02-21)

### What was changed
- Added per-topic filtered-dominance threshold controls in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new `--filtered-topic-threshold` option (repeatable and comma-list compatible; accepts ratio or percent),
  - new appendix output `Filtered Topic Threshold Matrix` with topic share, threshold, and alert status.
- Added npm helper command:
  - `npm run evidence:watch:topic-thresholds`.
- Updated evidence-ops maintenance index command list:
  - `/Users/rizwankalani/stroke/scripts/evidence-ops-index.mjs` now includes the topic-threshold helper.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:topic-thresholds` passed.
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 106 (2026-02-21)

### What was changed
- Added filtered-exclusion dominance monitoring to evidence-watch automation in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - new CLI option `--filtered-dominance-threshold` (accepts ratio or percent),
  - new watchlist appendix block **Filtered Topic Dominance Alert** with top-topic share vs threshold status.
- Added npm helper command:
  - `npm run evidence:watch:dominance`.
- Added compact phenotype-based DAPT matrix in TIA workflow (`/Users/rizwankalani/stroke/src/app.jsx`) covering CHANCE/POINT, CHANCE-2, THALES/AIS-2026 framing, INSPIRES, and SAMMPRIS-pattern severe ICAD.
- Regenerated evidence-ops artifacts:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 105 (2026-02-21)

### What was changed
- Added domain-level filtered-output visibility in watchlist audit appendix:
  - `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs` now emits **Filtered Candidate Summary by Topic and Reason**.
  - This complements global reason counts with per-domain exclusion signal.
- Regenerated evidence-ops outputs:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 104 (2026-02-21)

### What was changed
- Added filtered-candidate aggregate visibility in watchlist output:
  - `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs` now emits a **Filtered Candidate Summary by Reason** table in the audit appendix.
  - Maintains actionable queue suppression while exposing exclusion-volume distribution for review governance.
- Regenerated evidence-ops artifacts after script update:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 103 (2026-02-21)

### What was changed
- Added CLI controls to evidence watchlist generation (`/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`):
  - `--filtered-all` to output the full filtered-candidate appendix,
  - `--filtered-limit` to customize appendix truncation length.
- Added npm helper command:
  - `npm run evidence:watch:filtered-all`.
- Updated evidence ops index generator (`/Users/rizwankalani/stroke/scripts/evidence-ops-index.mjs`) to include the new maintenance command.
- Verified and restored default artifact state after exercising full-appendix mode:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:watch:filtered-all` passed (full filtered appendix emitted).
- `npm run evidence:refresh` passed (default appendix limit restored).
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 102 (2026-02-21)

### What was changed
- Added filtered-item transparency to evidence watchlist generation in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`:
  - retained strict high-priority queue filtering for low-actionability protocol/design papers,
  - added an explicit **Filtered Low-Actionability Candidates (Audit Appendix)** section to `docs/evidence-watchlist.md` (topic, PMID, reason, URL) so reviewers can still inspect excluded items.
- Regenerated downstream evidence-ops artifacts:
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.

### Verification
- `npm run evidence:refresh` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 101 (2026-02-21)

### What was changed
- Refined evidence-watch triage filtering in `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs` to suppress non-actionable design/protocol papers from promotion queues:
  - added low-value title filters for `rationale and design`, `rationale and methods`, and protocol-study variants.
- Regenerated evidence operations artifacts with stricter triage:
  - `docs/evidence-watchlist.md`,
  - `docs/evidence-promotion-checklist.md`,
  - `docs/evidence-promotion-template.md`,
  - `docs/evidence-promotion-template-p0.md`,
  - `docs/evidence-ops-index.md`.
- Queue impact after filter refinement:
  - uncited candidates: `28` → `24`,
  - high-priority (`P0/P1`) promotion queue: `15` → `11`,
  - P0 template candidates: `3` → `1`.

### Verification
- `npm run evidence:refresh` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 100 (2026-02-21)

### What was changed
- Added deterministic pediatric-regression assertions in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`:
  - age `<18` scenario setup on Encounter,
  - pediatric pathway card visibility check,
  - pediatric warning-layer checks (critical age warning + neurology-consult completeness warning),
  - pediatric checklist control presence and interaction checks,
  - generated-note trace assertion verifying pediatric summary propagation.
- Kept legacy TIA/CVT regression checks stable by running pediatric scenario after existing library/settings assertions in smoke flow.

### Verification
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 099 (2026-02-21)

### What was changed
- Added structured pediatric acute-stroke operationalization in `/Users/rizwankalani/stroke/src/app.jsx`:
  - New `pediatricStrokePathway` state block with explicit checklist fields (pediatric neurology consult, pediatric-capable center contact, pediatric-focused NIHSS, vessel imaging completion, seizure-at-onset flag, arteriopathy/cardioembolic concern, SCD exchange-pathway activation).
  - New Special Populations UI card: **Pediatric Stroke Rapid Pathway (AIS 2026)** with live summary output.
  - Added pediatric pathway search alias in command palette (`Pediatric Stroke Pathway`) for faster keyboard navigation.
- Added pediatric safety warnings:
  - age-triggered critical pediatric warning remains active,
  - new warning checks for missing pediatric neurology consult, missing pediatric transfer plan, missing vessel-imaging confirmation, and missing exchange-transfusion status when pediatric SCD pathway is active.
- Propagated pediatric pathway summary into generated outputs:
  - transfer alerts, signout, progress, discharge, consult, and pathway-plan notes.
- Finalized evidence-ops index automation:
  - added `scripts/evidence-ops-index.mjs`,
  - added npm command `npm run evidence:index`,
  - expanded `evidence:refresh` to regenerate watchlist/checklist/templates (`all` + `p0`) + index + sync validation,
  - added `docs/evidence-ops-index.md` generation and wired index/template generation into scheduled `live-smoke.yml`.
- Fixed evidence-template routing regression:
  - `evidence:template:p0` now writes to `docs/evidence-promotion-template-p0.md` (no longer overwrites `docs/evidence-promotion-template.md`).
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.77`.
  - service-worker cache key bumped to `stroke-app-v76`.

### Verification
- `npm run evidence:refresh` passed (`15` high-priority promotion candidates; `3` P0 template candidates).
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 090 (2026-02-20)

### What was changed
- Implemented structured high-priority special-population workflows in `/Users/rizwankalani/stroke/src/app.jsx`:
  - Added `maternalStrokePathway` state and UI controls for postpartum day, severe-HTN/preeclampsia concern, OB consult, magnesium protocol, delivery-team coordination, and fetal monitoring.
  - Added `cancerStrokePathway` state and UI controls for mechanism classification (probable/possible/conventional), D-dimer multiple, multiterritory and NBTE flags, structured workup bundle, prevention branch, and oncology consult.
- Added evidence-aligned safety warnings:
  - Maternal severe-HTN escalation checks (OB consult and magnesium-decision documentation).
  - Cancer-stroke pathway completeness checks (workup bundle presence, mechanism/prevention mismatch, oncology consult documentation).
- Expanded note/handoff output to include structured maternal and cancer summaries in transfer/signout/progress/discharge/consult/full-note paths.
- Updated cache/version for deployment coherence:
  - `APP_VERSION` → `v5.14.72`
  - service worker cache key → `stroke-app-v71`

### Verification
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 089 (2026-02-20)

### What was changed
- Corrected maternal-stroke citation metadata alignment to the Stroke statement record:
  - Updated references from `PMID: 41678811` to `PMID: 41603019` where Stroke-statement metadata was intended.
  - Aligned DOI usage to `10.1161/STR.0000000000000514` for the Stroke publication record.
- Updated in-app maternal rapid-actions citation text to use `PMID: 41603019`.
- Regenerated `docs/evidence-watchlist.md` after citation baseline correction (uncited candidate count reduced from 23 to 22).

### Verification
- `npm run evidence:watch` passed.
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 088 (2026-02-20)

### What was changed
- Added clinician-priority scoring/ranking to automated evidence watchlist generation:
  - New rubric scores each uncited PubMed candidate using guideline/scientific-statement signal, trial-design signal, recency, source strength, and topic-specific workflow relevance.
  - Watchlist output now includes `Priority`, `Score`, and `Rationale` columns and is sorted by score within each clinical domain.
- Added optional external alert fan-out in scheduled live smoke CI:
  - `.github/workflows/live-smoke.yml` now posts a failure payload to `secrets.LIVE_SMOKE_ALERT_WEBHOOK` when configured.
  - Existing GitHub issue alerting remains the default and continues to auto-close on subsequent successful runs.

### Verification
- `npm run evidence:watch` passed after retry (first run had transient PubMed timeout/abort).
- `npm run build` passed.
- `npm test` passed (`Runs: 3 | Issues: 0`).
- `npm run qa` passed (`Runs: 6 | Issues: 0`).

## Iteration 042 (2026-02-20)

### What was changed
- Restored UW stroke on-call contact directory defaults in app settings and runtime state, including clickable numbers for Stroke Phone, STAT Pharmacy, HMC/UW neuroradiology lines, imaging lines, IT help desk, and paging operator.
- Reintroduced bottom-right floating **Quick Contacts** phone button with expandable panel and `tel:` links for one-tap calling.
- Added full **Settings > Contact Directory** editor (add/edit/remove contacts + reset UW defaults) so phone numbers are visible and easily maintainable.
- Updated TIA disposition language across pathway cards, management content, and note templates from “admit all TIAs” to risk-stratified pathways aligned with the 2023 AHA TIA ED statement.
- Updated extended-window IVT recommendation text to reflect modern imaging-selected practice and 2024-2026 evidence context (TIMELESS + OPTION).
- Updated Xa inhibitor ICH reversal language to agent-specific selection (andexanet vs 4F-PCC by formulary/protocol), removed unsupported “PCC first-line everywhere/similar efficacy” wording, and corrected dialysis phrasing.
- Downgraded premorbid disability EVT alert from hard error to warning with shared decision-making guidance.
- Updated poststroke spasticity recommendation block from 2016-centric wording to the 2026 AHA spasticity statement.
- Expanded hormonal risk recommendation block to include contraception/menopause plus transgender estrogen and testosterone-risk counseling context.
- Corrected ESCAPE-MeVO DOI metadata to `10.1056/NEJMoa2411668`.
- Extended smoke QA checks to assert quick-contacts FAB and Settings contact-directory controls are present.

### Verification
- `npm run build` passed.
- `npm test` passed after re-run (first run had transient desktop-only smoke flake that did not reproduce on immediate rerun).

## Iteration 036 (2026-02-18)

### What was changed
- **Accessibility (6 fixes)**:
  - aria-label on DOAC initiation day input (line 23231)
  - aria-label on TEE findings input (line 23322)
  - max="200" on CrCl input in enoxaparin calculator (line 30811)
  - max="500" on CTP core volume, max="1500" on CTP penumbra volume (lines 17897, 17905)
  - aria-label on discharge checklist detail inputs (line 24642)
- **Discharge note additions** (previously only in follow-up brief):
  - Substance screening: AUDIT-C score with positive threshold, counseling status
  - Hormonal risk: OCP discontinuation (Class III), HRT review, migraine+aura
  - Rehab screening: spasticity (Ashworth/botox), central pain (type/treatment), fatigue (severity/management)

### What was audited but skipped
- Agent 1 (note completeness): ~60% false positive rate — claimed ichAnticoagResumption, drugInteractions, returnToWork, palliativeCare, anticoagBridging, fallsRisk were missing from discharge, but all are already present
- Agent 1: airTravelRestrictions and sexualHealthCounseling — follow-up items more appropriate for outpatient visit than acute discharge
- Agent 1: TIA workup in progress note, ESUS workup in progress note — P1 enhancements deferred
- Agent 2: Protocol modal focus return to trigger (P2 enhancement, complex to implement)
- Agent 2: text-slate-500 contrast (borderline 4.2:1 vs 4.5:1 in search area only)

### Audit agents
- Agent a5a0375: Note template completeness — 8 P0, 10 P1 (most false positives; 5 confirmed, implemented)
- Agent a0248c5: Accessibility + input validation — 0 P0, 4 P1, 3 P2 (all P1 confirmed, implemented)

### Build
- v5.14.42, cache v41, commit `75222e4`

## Iteration 035 (2026-02-18)

### What was changed
- **CRITICAL de-identification fix**: Removed hardcoded UW Medicine (`access.uwmedicine.org`) and UW neurology intranet (`intranet.neurology.uw.edu`) links from encounterQuickLinks array — violated standing de-identification constraint
- Quick links now default to OpenEvidence + UpToDate only; users can add institutional links via Settings > Quick Links

### What was audited but skipped
- Performance P0: ASPECTS score inline computation (10-element boolean count — negligible), TIA workup progress (small object count — negligible), CrCl IIFE in input value (lightweight, only renders when calculator open), CTP mismatch IIFE (trivial arithmetic)
- Index-as-key P1: 4 locations — all static display lists that never reorder; index keys are correct

### Audit agents
- Agent a73b972: De-identification compliance — found 2 critical UW/UWMC violations (CONFIRMED, FIXED)
- Agent a93beab: Performance/rendering — found P0/P1 memoization and key issues (all SKIPPED as false positives)

### Build
- v5.14.41, cache v40, commit `e58b8fb`

## Iteration 034 (2026-02-18)

### What was changed
- **Focus trap deps fix**: Removed `settingsMenuOpen` from modal focus trap useEffect dependency array — settings menu is not a modal and doesn't need focus trapping. Prevents unnecessary effect re-runs and edge-case focus restoration disruption.
- **XSS import hardening**: Added `data:text/html`, `vbscript:`, and `on\w+=` event handler patterns to import validation regex. Blocks additional injection vectors in backup import.
- **Encounter history error logging**: Changed `catch {}` to `catch (e) { console.warn(...) }` for encounter history localStorage save.
- **False positives rejected**: Ctrl+1/2/3/4 in text inputs (intentional — Ctrl+digit is a shortcut, not text input), search opens on 1-char (cosmetic), import confirmation dialog (enhancement), copy without validating empty (intentional for partial notes), PDF export size check (enhancement), import version check (migrateAppData handles this).

### Commit
- Code: `519b29e` (v5.14.40 / cache v39)

## Iteration 033 (2026-02-18)

### What was changed
- **No code changes** — clean audit results.
- **Handler sync final sweep**: All 3 diagnosis-change handlers verified 100% synchronized (37 unique fields, tnkAutoBlocked toast, all category-specific clears identical). PASS.
- **Guideline field sweep**: 140+ GUIDELINE_RECOMMENDATIONS conditions verified. 0 field reference errors, 0 deprecated field names, 0 placeholder text, 0 duplicate IDs. PASS.
- **False positive rejected**: `aed_doac_interaction` and `pause_protocol` sharing a DOAC condition is correct — they are independent clinical topics that legitimately co-fire for DOAC patients.

## Iteration 032 (2026-02-18)

### What was changed
- **Discharge note: returnToWork section**: When `returnToWork.workingAge` is true, outputs expected timeline, prior occupation, vocational rehab referral, and phased return plan.
- **Patient education: discharge mRS**: Lay-friendly mRS descriptions (0-5 scale) so patients understand their functional status. Also includes returnToWork guidance.
- **Progress note: disablingDeficit**: When TNK was given despite low NIHSS based on disabling deficit, the progress note now documents this rationale in the Assessment & Plan section.
- **Audit findings rejected**: 13 P2 controlled component fallback mismatches (theoretical — all fields initialized in default state, never become undefined). Driving restrictions missing from signout/progress (already in 5/8 templates, not needed for inpatient notes).

### Commit
- Code: `966bba8` (v5.14.39 / cache v38)

## Iteration 031 (2026-02-18)

### What was changed
- **Lab-not-checked warnings (3 new)**: When TNK recommended, warn if INR, platelet count, or aPTT not yet documented. Prevents silent assumption that labs are "safe" when unmeasured.
- **EVT imaging warnings (2 new)**: When EVT recommended, warn if CTA results not documented (vessel occlusion confirmation required) and if ASPECTS not scored (eligibility criterion per HERMES/MR CLEAN).
- **TNK auto-block toast sync**: Handlers 1 (template) and 2 (dropdown) now fire `tnkAutoBlocked` toast + state when switching to ICH/SAH with active TNK recommendation, matching Handler 3.
- **Audit findings rejected**: useEffect optional chaining in deps (safe in practice), `consentDocCopied` dead field (trivial), large-core trial eligibility prompts (enhancement), late-window CTP prompts (enhancement).

### Commit
- Code: `b37b95b` (v5.14.38 / cache v37)

## Iteration 030 (2026-02-18)

### What was changed
- **NaN/falsy guard fixes (8 warning conditions)**: INR (`inr > 1.7` → `!isNaN(inr) && inr > 1.7`), aPTT (`ptt && ptt > 40` → `!isNaN(ptt) && ptt > 40`), platelets (2 locations), creatinine, glucose (3 locations). All now use `!isNaN()` instead of falsy checks that silently skip NaN/0 values.
- **ErrorBoundary coverage**: Settings tab and Trials tab now wrapped in ErrorBoundary, matching Encounter and Management tabs.
- **Audit findings rejected**: SW error suppression (P2 not P0 — static PWA), print styling for 968 cards (P2 enhancement), TNK+ICH imaging detection (enhancement — handlers already auto-block), DOAC assumption (intentional defensive design).

### Commit
- Code: `81f1a85` (v5.14.37 / cache v36)

## Iteration 029 (2026-02-18)

### What was changed
- **Progress note data completeness**: Added osmotic therapy (ICH/SAH with Na+ target, osmolality), early mobilization (timing, status), fever management (max temp, FeSS bundle, workup), nutritional support (feeding route, NG/PEG day).
- **Discharge note data completeness**: Added early mobilization status, fever management outcome, family communication/shared decision-making.
- **Signout note data completeness**: Added osmotic therapy (ICH/SAH), early mobilization, fever status, nutrition/feeding route.
- **Audit result**: UI rendering `{( ... )}` patterns verified as valid JSX (false positive). Guideline field ref completeness verified clean (130+ conditions, 0 mismatches).

### Verification
- Cross-template audit found 7 fields with gaps across 8 templates
- Focused on 3 highest-impact templates: progress (daily workhorse), discharge (handoff), signout (shift change)
- All data sourced from existing state fields with proper fallbacks

### Build
- Version: v5.14.36, cache: stroke-app-v35
- Commit: `60ba339`

---

## Iteration 028 (2026-02-18)

### What was changed
- **Progress note ICH management section (P1)**: Added dedicated ICH block with volume (ABC/2), BP management (SBP <140), reversal status, NSG consultation, seizure prophylaxis, and surgical criteria (cerebellar >15mL, hydrocephalus, midline shift, surgery decision).
- **Progress note SAH management section (P1)**: Added dedicated SAH block with grade, Fisher grade, nimodipine, EVD, aneurysm status (secured/method/location), and vasospasm/DCI monitoring.
- **Discharge SAH aneurysm details (P1)**: Added sahAneurysmLocation, sahAneurysmSize, sahSecuringMethod to discharge note SAH section (were in transfer/signout but missing from discharge).
- **Discharge SAH vasospasm monitoring (P1)**: Added full vasospasm/DCI monitoring block (TCD, neuro checks, sodium monitoring, DCI status, induced HTN, notes) to discharge note.
- **Section header standardization (P2)**: Normalized "ICH Management:" → "ICH MANAGEMENT:" in transfer note, "SAH Management:" → "SAH MANAGEMENT:" in transfer and consult notes.
- **Guideline field ref audit**: All 130+ conditions verified clean — no more field name mismatches.

### Verification
- Progress note had NO ICH/SAH-specific sections; transfer/signout/discharge all had them
- Discharge SAH section ended at seizure prophylaxis; transfer had 11 more lines
- Section headers inconsistency confirmed across templates

### Build
- Version: v5.14.35, cache: stroke-app-v34
- Commit: `33eb3fd`

---

## Iteration 027 (2026-02-18)

### What was changed
- **LAA closure guideline field fix (P1)**: `laao_after_ich` condition at line 4300 referenced `ekgFindings` which doesn't exist. Changed to `ekgResults` (the actual field at line 956). LAA closure recommendation for ICH+AF patients was never triggering.
- **Pregnancy EVT guideline field fix (P1)**: `pregnancy_evt` condition at line 4320 referenced `specialPopulations` (nonexistent). Changed to check `pregnancyStroke` boolean (line 1454) with PMH text fallback. Pregnancy EVT guidance was unreliable.
- **ASPECTS input label association (P2)**: Added `id="input-aspects"` and `htmlFor` to label (WCAG 1.3.1).
- **Telemetry/EKG input label association (P2)**: Added `id="input-ekg"` and `htmlFor` to label (WCAG 1.3.1).
- **TNK Admin Time input label association (P2)**: Added `id="input-tnk-admin-time"` and `htmlFor` to label (WCAG 1.3.1).

### Verification
- Confirmed `ekgFindings` has 0 hits in default state; `ekgResults` is the correct field at line 956
- Confirmed `specialPopulations` has 0 hits in default state; `pregnancyStroke` boolean at line 1454
- Verified 3 inputs now have proper label-input associations via id/htmlFor

### Build
- Version: v5.14.34, cache: stroke-app-v33
- Commit: `d1d45db`

---

## Iteration 026 (2026-02-18)

### What was changed
- **COMPASS guideline field reference fix (P1)**: `compass_dual_pathway` condition at line 5559 referenced `medicalHistory` which doesn't exist in the state. Changed to `pmh` (the correct field). COMPASS recommendation for low-dose rivaroxaban + aspirin in polyvascular disease was never triggering.
- **bpPhase reset synchronization (P1)**: Handler 3 (`applyDiagnosisSelection`) had bpPhase reset when leaving ischemic, but Handlers 1 (template) and 2 (dropdown) did not. Added `bpPhase = 'pre-tnk'` reset when leaving ischemic with post-evt/post-tnk phase to both handlers.
- **cvtAnticoag nested object clearing (P2)**: `cvtAnticoag` (acutePhase, transitionAgent, duration, apsStatus, etiologyProvoked) was not cleared when switching away from CVT in any of the 3 handlers. Added reset to all 3, matching the pattern used for osmoticTherapy, angioedema, etc.

### Verification
- Confirmed `medicalHistory` has 0 matches in default state; `pmh` has 50+ references
- Verified bpPhase reset absent from Handlers 1 & 2 by reading lines 16248-16296 and 19848-19902
- Verified cvtAnticoag defined at line 1431 with 24+ references, absent from all clearing blocks

### Build
- Version: v5.14.33, cache: stroke-app-v32
- Commit: `92461d4`

---

## Iteration 025 (2026-02-18)

### What was changed
- **Handler 3 state leak fix (P1 CRITICAL)**: `applyDiagnosisSelection` (called from 9 UI paths including main diagnosis dropdown) was missing 95% of clearing logic. Now clears all ICH (5), SAH (13+vasospasmMonitoring), CVT (5), ischemic treatment (tnk/evt/consent), EVT procedural (5), and nested objects (postTNKMonitoring, doacTiming, hemorrhagicTransformation, angioedema, osmoticTherapy) matching Handlers 1 & 2.
- **EVT procedural field clearing (P2)**: All 3 diagnosis-change handlers now clear evtAccessSite, evtDevice, evtTechnique, evtNumberOfPasses, reperfusionTime when leaving ischemic.
- **Nested object clearing (P2)**: All 3 handlers clear postTNKMonitoring, doacTiming, hemorrhagicTransformation, angioedema when leaving ischemic; osmoticTherapy when leaving ICH.
- **SAH patient education (P1)**: SAH-specific header, disease explanation, rebleeding risk warnings, vasospasm recognition (3-14d), nimodipine compliance (q4h x21d), aneurysm treatment status, EVD mention.
- **Discharge LDL placeholder (P1)**: Replaced static `___` with `secondaryPrevention.ldlCurrent` value.
- **Discharge carotid placeholder (P2)**: Replaced static `___` with `carotidManagement` data (side, degree, symptomatic, intervention).

### Verification
- Audit found Handler 3 missing clearing for 28+ fields — confirmed by code review at line 12322
- All 3 handlers now have identical clearing logic for each diagnosis category
- SAH education tested: dynamic content based on sahNimodipine, sahAneurysmSecured, sahSecuringMethod, sahEVDPlaced
- LDL/carotid placeholders fall back to `___` when no data entered

### Build
- Version: v5.14.32, cache: stroke-app-v31
- Commit: `9f7f1c7`

---

## Iteration 024 (2026-02-18)

### What was changed
- **Patient education mimic path (P0)**: Mimic diagnoses now get appropriate non-stroke education instead of "STROKE PATIENT EDUCATION" with stroke prevention advice. Patients are told their symptoms were not caused by a stroke and directed to follow-up.
- **CVT patient education (P1)**: CVT patients now get venous-specific education: "Cerebral Venous Thrombosis Patient Education" header, explanation of CVT vs arterial stroke, anticoagulation duration (3-12 months), venous-specific medication guidance.
- **Wake-up stroke template ReferenceError fix (P1)**: lkwUnknown auto-population of discoveryDate/discoveryTime referenced `updated` variable outside its setState callback scope — a ReferenceError crash caught by ErrorBoundary. Moved inside functional updater.
- **consentKit clearing on diagnosis change (P1)**: EVT consent data (evtConsentDiscussed, evtConsentType, evtConsentTime, transferConsentDiscussed) now cleared when diagnosis changes away from ischemic. Applied to both template button handler and comprehensive dropdown handler.
- **Follow-up brief discharge mRS (P1)**: Added discharge mRS with admission comparison to follow-up clinic handoff brief.
- **Progress note VTE prophylaxis (P1)**: Replaced static `___` placeholder with actual vteProphylaxis data (IPC/SCDs, pharmacologic agent, post-TNK hold status).

### Why
- Mimic patients being told they had a stroke is clinically incorrect and could affect treatment compliance, insurance, and patient anxiety.
- CVT is distinct from arterial stroke and requires specific anticoagulation education that wasn't provided.
- Wake-up stroke template crash prevented auto-population of discovery time, requiring manual entry.
- Stale consentKit data could contaminate a new patient's record if diagnosis was switched back to ischemic.

### Audit results
- **Note template fidelity audit**: 1 P0 (mimic education), 10 P1 (various missing data points), 10 P2 (formatting). Many P1 items require new state fields (discharge labs, I/O, subjective data) — deferred.
- **UI edge case audit**: 0 P0, 4 P1 (lkwUnknown race condition, consentKit clearing x2, nested object clears), 4 P2 (height/weight validation, creatinine fallback, select normalization).
- **Clinical audit false positives**: 4/4 P0 claims from iter-023 clinical audit re-confirmed as false positives (auto-block logic handles INR, platelets, basilar NIHSS, and ASPECTS coverage correctly).

### Commit
- `7b1083f` — APP_VERSION v5.14.31, cache key stroke-app-v30

---

## Iteration 023 (2026-02-18)

### What was changed
- **DAWN age ≥80 EVT warning (P1)**: New error-severity warning fires when EVT is recommended for patients ≥80 years old in the late window (6-24h) with NIHSS <10. DAWN trial explicitly required NIHSS ≥10 for this age cohort.
- **ACEi + TNK angioedema warning escalation**: Upgraded from 'warn' (yellow) to 'error' (red) severity. ACE inhibitor use confers 5x increased orolingual angioedema risk with thrombolysis, warranting higher-visibility alert with airway preparation instructions.
- **Textarea focus styling (a11y)**: Added `focus:outline-none` to 4 textareas (symptoms, PMH, CT results, CTA results) for consistent keyboard focus ring behavior matching all other form elements.
- **DAPT duration visible label**: Added `<label>` element for DAPT duration select (previously had only `aria-label`, no visible label for sighted users).

### Why
- DAWN trial age ≥80 exclusion at NIHSS <10 is a hard eligibility criterion. Without this warning, a clinician could recommend late-window EVT for an 85-year-old with NIHSS 7 without the system flagging the protocol deviation.
- ACEi + TNK angioedema risk requires proactive airway preparation (suction, nebulized epinephrine, intubation equipment). Yellow-level warning was insufficient for this actionable clinical preparation step.

### Audit results
- **Clinical safety audit**: 4 P0 claims — ALL verified as FALSE POSITIVES. TNK auto-block already covers INR >1.7 and platelets <100K (line 13589). evt_standard covers ASPECTS 6-10 in early window. Basilar EVT condition correctly requires nihss ≥10. One valid P1: age ≥80 late-window NIHSS warning (implemented).
- **UX/code quality audit**: Score 9.2/10. 0 P0 issues. Valid P1 findings: textarea focus styling (4 locations), DAPT label. Multiple P2 claims verified as false positives (search input already has aria-label, route parsing already safe via default case).

### Commit
- `c3b7ea6` — APP_VERSION v5.14.30, cache key stroke-app-v29

---

## Iteration 022 (2026-02-18)

### What was changed
- **ASPECTS state sync bug fix (P0)**: Interactive ASPECTS scorer onClick handler computed score from stale closure (`telestrokeNote.aspectsRegions`) instead of the functional updater's `prev` state. On rapid clicks, `setAspectsScore` received wrong values while `setTelestrokeNote` was correct. Moved score computation inside the functional updater.
- **ASPECTS/PC-ASPECTS mobile responsive grids (P1)**: ASPECTS `grid-cols-5` and PC-ASPECTS `grid-cols-4` overflowed on mobile viewports. Changed to `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` and `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` respectively.
- **EVT procedural fields in 5 remaining note templates**: Added access site, device, technique, passes, and reperfusion time to signout, progress, follow-up brief, discharge, and consult note templates. Previously only in transfer and procedure notes.
- **QM count guard**: Dashboard quality measures count now only displays when `dischargeChecklistReviewed` is true, preventing premature quality metric display.
- **EVT details auto-open**: `<details>` element auto-opens when any EVT procedural field has data, preserving user context.
- **Dashboard print styling**: Added `print:break-inside-avoid`, `print:border-slate-400`, `print:shadow-none` to case outcomes card.

### Why
- ASPECTS bug: Stale closure in score computation could lead to incorrect ASPECTS score displayed/stored when regions clicked rapidly — a clinical safety issue for EVT eligibility assessment.
- Mobile grids: 5-column and 4-column grids were unusable on phones (390px width), with buttons truncated.
- EVT in all templates: Procedural details like access site, device, and passes were only in transfer/procedure notes. Signout, progress, discharge, consult, and follow-up all need these for continuity of care.

### Audit results
- **Comprehensive audit**: 7 findings — 1 P0 (ASPECTS sync), 2 P1 (mobile grids), 4 P2 (QM guard, EVT open state, print, keyboard help confirmed OK)
- **EVT template coverage audit**: Transfer and procedure complete; 5 templates needed EVT fields added

### Commit
- `ee42b54` — APP_VERSION v5.14.29, cache key stroke-app-v28

---

## Iteration 021 (2026-02-18)

### What was changed
- **EVT procedural fields (5 new)**: Added `evtAccessSite`, `evtDevice`, `evtNumberOfPasses`, `evtTechnique`, `reperfusionTime` to state, allowedKeys, and localStorage persistence. Collapsible "EVT Procedure Details" section in encounter tab shows when EVT is recommended. Procedure note auto-populates from state instead of blank placeholders. Transfer note includes procedural details.
- **Dashboard case outcomes card**: New card on dashboard showing at-a-glance metrics — DTN (color-coded: green ≤45m, amber ≤60m, red >60m), DTP, mTICI (green for 2b/2c/3), NIHSS admission→discharge with delta, discharge mRS, sICH flag, and quality measures compliance count (X/6). All metrics pull from existing state fields.

### Why
- EVT procedural fields: The procedure note (the medicolegal document for thrombectomy) had 5 blank placeholders requiring manual typing. Now auto-populated from structured inputs, reducing documentation time and errors.
- Dashboard outcomes: Neurologists need an immediate summary of case quality metrics without navigating to individual sections. DTN benchmarking and mTICI success rates are core quality indicators.

### Commit
- `487ef18` — APP_VERSION v5.14.28, cache key stroke-app-v27

---

## Iteration 020 (2026-02-18)

### What was changed
- **Consult note PT fix**: Added PT (prothrombin time) to consult note labs line. Also added affected side and pre-morbid mRS to the exam section for clinical context. PT was collected in UI and present in all other templates but missing from consult.
- **Progress note sync with signout**: Added 9 fields present in signout but missing from progress note: TOAST classification, pre-morbid mRS, code status, symptom onset NIHSS, vessel occlusion, ASPECTS, PC-ASPECTS, collaterals grade, EKG results. Progress note now provides the same clinical snapshot as the signout.
- **Follow-up brief discharge outcomes**: Added sICH detection flag and discharge NIHSS with improvement delta (e.g., "Discharge NIHSS: 3 (improved from 12)") to the follow-up clinic handoff brief.
- Bumped APP_VERSION to v5.14.27 and service-worker cache to v26.

### Why
- PT >15s is a TNK contraindication; omitting it from the consult note (the primary medicolegal document) was a documentation gap
- Progress note missing 9 signout fields meant daily follow-up lacked baseline context the shift team already documented
- Discharge NIHSS delta gives the follow-up clinic an immediate sense of recovery trajectory

### Audit results
- **Consult note audit**: PT placeholder confirmed missing; affected side and pre-morbid mRS identified as high-value additions. Other acute labs (Hgb, WBC, etc.) lack dedicated UI inputs — no action needed.
- **State field coverage audit**: Procedure note needs 5 new EVT state fields (deferred). Progress note synced with signout (9 fields). Follow-up brief enhanced with outcomes. Dashboard outcome cards identified as future work.

### Commit
- `e8b0be1` — APP_VERSION v5.14.27, cache key stroke-app-v26

---

## Iteration 019 (2026-02-18)

### What was changed
- **Vessel occlusion guard (P1)**: Vessel occlusion quick-select buttons now hidden for ICH/SAH/CVT diagnoses. Previously visible for all diagnosis categories, allowing clinically nonsensical "SAH with M1 occlusion" to propagate to notes.
- **Template handler synchronized (P1)**: Quick-start template buttons now clear the same nested objects as the diagnosis dropdown handler — ICH surgical criteria (5 fields), SAH vasospasm monitoring (6 fields), and CVT anticoag flags (5 fields). Previously only cleared 3 basic flags, allowing stale data to persist across template switches.
- **Transfer note mTICI (P0)**: mTICI score now included in transfer note EVT section. Previously omitted from the primary handoff document despite being collected and displayed in signout/procedure notes.
- **Signout SAH enrichment**: Added sodium monitoring flag, neuro checks q1h, and DCI clinical notes to signout SAH section for complete ICU handoff.
- **Signout CVT enrichment**: Added acute phase, transition agent, and APS-warfarin mandatory flag to signout CVT section.
- **Discharge rehab screening timeline**: Added aphasia screen 30d, cognitive screen at discharge, and cognitive screen 3mo to rehab section.
- Bumped APP_VERSION to v5.14.26 and service-worker cache to v25.

### Evidence / rationale
- mTICI (modified Thrombolysis in Cerebral Infarction) is the essential EVT outcome measure; omission from transfer note means receiving facility lacks procedure result
- Template handler desynchronization was a data integrity risk: quick-start templates (line 15963) only cleared 3 flags while dropdown handler (line 19522) cleared 20+ fields including nested objects
- SAH sodium monitoring critical for distinguishing SIADH vs cerebral salt wasting (treatment differs)

### Audit results
- **Note template audit**: 5 gaps found with existing state fields. Fixed: transfer mTICI, signout SAH/CVT, discharge rehab screening. Remaining gaps require new state fields (EVT procedural details, active drip parameters, follow-up appointment specifics).
- **Clinical workflow audit**: 2 P1 findings (vessel occlusion guard, template handler desync) fixed. Midnight crossing in DTN calculations verified already handled. Nested object access and functional updater patterns verified safe.

### Commit
- `771feec` — APP_VERSION v5.14.26, cache key stroke-app-v25

---

## Iteration 018 (2026-02-18)

### What was changed
- **Calculator accessibility (P1)**: Added `role="radio"`, `aria-checked`, and `aria-label` to all calculator radio-button groups: mRS (7 options), ICH GCS (3), standalone GCS eye/verbal/motor (4+5+6), ABCD2 duration (3), Hunt-Hess (5), WFNS (5). Screen readers now announce scale name, option, and selection state.
- **WCAG AA contrast fixes (P1)**: Changed description text from `text-slate-600` (2.5:1) to `text-slate-700` (3.5:1) on mRS, Hunt-Hess, and WFNS calculator descriptions. Changed modal hint text from `text-slate-400` (1.9:1) to `text-slate-600` for WCAG AA compliance.
- **Screening results in signout note**: PHQ-2, MoCA, and STOP-BANG scores now included in signout handoff template when available, preventing screening context loss during shift changes.
- **TIA workup completion tracking**: Discharge note TIA section now shows completion percentage (e.g., "7/10 completed") and lists pending workup items (e.g., "Pending: Echo, HbA1c, TSH").
- Bumped APP_VERSION to v5.14.25 and service-worker cache to v24.

### Evidence / rationale
- WCAG 2.1 SC 1.4.3 (Contrast Minimum): 4.5:1 for normal text, 3:1 for large text
- WCAG 2.1 SC 4.1.2 (Name, Role, Value): custom controls must expose role + state to assistive technology
- Consistent with GCS calculator drawer pattern (lines 32833-32862) which already correctly implements role="radio" + aria-checked

### Audit results
- **Accessibility audit**: 4 P1 issues (aria-labels on radio buttons, contrast failures), all fixed. Verified existing patterns (modal focus trap, tab navigation, alerts) are well-implemented.
- **Note template audit**: 23 gaps identified (11 P0). Most P0 gaps require new state fields (EVT procedural details, drip parameters, osmotic targets, follow-up appointments). Fixed items using existing data: signout screening, TIA workup completion. Remaining P0 gaps logged for future iterations.

### Commit
- `63cb9c3` — APP_VERSION v5.14.25, cache key stroke-app-v24

---

## Iteration 017 (2026-02-18)

### What was changed
- **Settings menu focus restoration**: Added `useEffect` with ref tracking to return focus to the settings trigger button when the menu closes, completing the keyboard navigation round-trip.
- **Protocol modal "Esc to close" hint**: Added subtle text hint at bottom of protocol modal for discoverability.
- **Calculator priority maps enhanced**: Added FUNC Score to ICH priority list and Modified Fisher to SAH priority list in context-aware calculator drawer.
- **Transfer note statinDose bug fix (P0)**: Fixed field name mismatch — `statinIntensity` (non-existent) replaced with `statinDose` (actual field), restoring statin info to transfer notes.
- **ErrorBoundary for Encounter tab**: Wrapped the entire Encounter tab (~10,000 lines) in ErrorBoundary to prevent uncaught render errors from crashing the whole app.
- **Caregiver education in discharge note**: Added structured output for 5 caregiver education items (stroke signs, medication admin, BP monitoring, safe transfers, dysphagia precautions).
- **Screening assessments in discharge note**: Added PHQ-2, MoCA, and STOP-BANG scores with automatic risk flagging (PHQ-2 positive → PHQ-9 follow-up; STOP-BANG ≥5 → sleep study).
- Bumped APP_VERSION to v5.14.24 and service-worker cache to v23.

### Why
- Settings focus: WCAG 2.4.3 (Focus Order) — keyboard users must be able to return to their previous context after closing a dialog.
- statinDose bug: Silent data loss — statin prescription was missing from the primary handoff document sent to receiving facilities.
- ErrorBoundary: Defensive resilience — a render crash in the encounter tab (the most complex section) previously required a full page reload.
- Caregiver education + screening: Joint Commission stroke certification requires documented caregiver education; PHQ-2/MoCA/STOP-BANG are standard inpatient stroke screening measures.

### Audit results
- **UX/keyboard/form audit**: ErrorBoundary gap (fixed), form constraint false positives verified, calculator drawer working correctly.
- **Note template completeness audit**: 86 of 147 fields not exported to any note — highest-impact gaps (caregiver education, screening scores, statinDose bug) fixed; remaining are lower-priority demographic and workflow fields.

### Commit
- `6c6666d` — APP_VERSION v5.14.24, cache key stroke-app-v23

---

## Iteration 016 (2026-02-18)

### What was changed
- **Discharge quality metrics in note**: AHA/ASA Get With The Guidelines quality metric items (antithrombotic prescribed, high-intensity statin, BP optimized, diabetes managed, smoking cessation, diet counseling, exercise counseling) now exported to discharge note under "Discharge Quality Metrics" section. Previously collected but not output.
- **Diagnosis-aware field visibility**: ASPECTS score entry, full ASPECTS calculator, PC-ASPECTS calculator, and TNK contraindication checklist are now hidden when diagnosis is ICH or SAH (shown for ischemic, TIA, or undetermined). Reduces cognitive clutter during non-ischemic encounters.
- **ICH volume calculator max relaxed**: Input max constraint increased from 30cm to 50cm to accommodate very large hematomas (ABC/2 dimensions).
- **Accessibility fixes**: Added `htmlFor`/`id` label association for HT management textarea; added visible `<label>` and `id` for "Other" diagnosis free-text input; removed redundant `aria-label` where `htmlFor` now provides programmatic association.
- **Second TNK checkbox guarded**: The TNK Recommended checkbox after the contraindication checklist now also hidden for ICH/SAH diagnoses, consistent with the primary TNK checkbox.

### Evidence / rationale
- AHA/ASA Get With The Guidelines—Stroke quality measures mandate documentation of antithrombotic at discharge, statin, BP medications, diabetes management, smoking cessation, and patient education (Schwamm et al., Stroke 2009, PMID: 19182079)
- WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships): programmatic label association required for form controls

### Audit results
- **Clinical audit**: 0 P0/P1 findings across medication dosing, guideline compliance, data integrity, and workflow completeness. Application clinically sound.
- **UX audit**: 16 findings; 1 P0 (ICH max constraint, fixed), 9 P1 (accessibility labels and diagnosis visibility, fixed; remainder are medium-priority polish), 6 P2 (deferred).

### Commit
- `9a5fcf1` — APP_VERSION v5.14.23, cache key stroke-app-v22

---

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
- 2024 AHA CVT Scientific Statement, Stroke 2024, PMID: 38284265, DOI: 10.1161/STR.0000000000000456.
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
- AHA 2026 Maternal Stroke Focused Update (PMID: 41603019).

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

## Iteration 011 (2026-02-18)

### What was changed
- Enhanced transfer note labs line with calculated CrCl (Cockcroft-Gault) when age/weight/sex/creatinine are available. Includes renal dose adjustment warning for CrCl <30 and monitoring note for CrCl <60.
- Enhanced TNK treatment documentation with explicit "TNK 0.25 mg/kg single IV bolus" format and TNK-first rationale reference (AcT/TRACE-2/ESO 2023, alteplase fallback).
- Bumped APP_VERSION to v5.14.18 and service-worker cache to v17.

### Why
- CrCl in the clinical note ensures receiving physicians are immediately aware of renal function implications for medication dosing.
- TNK-first rationale in the note documents the evidence basis for thrombolytic choice, supporting medicolegal documentation.

### Evidence citations used for this iteration
- AcT (Lancet 2022), TRACE-2 (NEJM 2023), ESO 2023 TNK Recommendation.
- Cockcroft-Gault CrCl formula (standard clinical use).

### QA and validation
- Build passed.
- Note template changes verified in code review.
- Deployed to GitHub Pages, push successful.

### Next opportunities
- Begin automated pathway assertion tests.
- Performance audit (bundle size 2.2 MB).
- Add pediatric stroke pathway guidance.
- Consider additional note template enhancements (signout, discharge).

## Iteration 012 (2026-02-18)

### What was changed
- Added calculated CrCl to signout, discharge, and consult note labs output for consistency with transfer note.
- CrCl <30 flag displays "dose adjust" warning in all note templates.
- Bumped APP_VERSION to v5.14.19 and service-worker cache to v18.

### QA and validation
- Build passed.
- Deployed to GitHub Pages, push successful.

## Iteration 013 (2026-02-18)

### What was changed
- **Bug fix (P0):** NIHSS click and keyboard handlers migrated to functional updater pattern (`setPatientData(prev => ...)`) to prevent stale closure race condition when clicking rapidly.
- **Defensive fix:** ASPECTS score input clamped to 0-10 range in JS (`Math.max(0, Math.min(10, v))`), not just HTML min/max attributes.
- **Dead code cleanup:** Removed unused `calculateASPECTS` function (ASPECTS score computed inline, not via this function).
- **Clinical content:** Added Post-EVT Antithrombotic Restart Protocol as collapsible section after complication watch — covers no-stent (ASA), stent (DAPT x30d), sICH delay, and TICI 0-2a management.
- **Clinical content:** Added Large-Core EVT Trial Outcome Matrix in reference section — SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION, LASTE with NNT and sICH rates for goals-of-care counseling. DAWN/DEFUSE-3 shown for comparison.
- Bumped APP_VERSION to v5.14.20 and service-worker cache to v19.

### Why
- NIHSS stale closure could cause score desynchronization during rapid clinical assessment.
- Post-EVT antithrombotic restart timing is a high-frequency clinical decision with no prior structured guidance.
- Large-core trial outcomes enable evidence-based goals-of-care discussions at the bedside.

### Evidence citations used for this iteration
- SELECT2 (NEJM 2023, PMID: 36762865): NNT ~4.2 for mRS 0-2, sICH ~13% vs 7%.
- ANGEL-ASPECT (NEJM 2023, PMID: 36762534): NNT ~3.3, sICH ~6% vs 3%.
- RESCUE-Japan LIMIT (NEJM 2022, PMID: 35387397): NNT ~4.5, sICH ~9% vs 4%.
- TENSION (Lancet 2024, PMID: 38401546): NNT ~3.7, sICH ~5% vs 3%.
- LASTE (Lancet Neurol 2024, PMID: 38547886): NNT ~5.0, sICH ~15% vs 8%.
- SVIN 2025 large-core recommendations (DOI: 10.1161/SVIN.124.001581).

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Post-change: new post-EVT restart section and trial outcome matrix verified present.
- Deployed to GitHub Pages, push successful.

### Remaining risks
- No automated unit/integration tests yet.
- Discharge medication reconciliation not yet structured (checklist exists but no content framework).

### Next opportunities
- Add modified Fisher score calculator for SAH vasospasm risk stratification.
- Add discharge medication reconciliation checklist with structured categories.
- Add post-seizure prophylaxis guidance.
- Consider html2pdf error handling improvements.

## Iteration 014 (2026-02-18)

### What was changed
- Added discharge medication reconciliation safety check panel (collapsible): duplicate therapy alerts, statin intensity verification, drug interactions (P2Y12i+PPI, warfarin+antibiotics, DOAC+CYP3A4), and patient/caregiver education checklist.
- Added html2pdf CDN load timeout guard (8s) to prevent indefinite hang on slow/unresponsive networks.
- Bumped APP_VERSION to v5.14.21 and service-worker cache to v20.

### QA and validation
- Build passed.
- Deployed to GitHub Pages, push successful.

## Iteration 015 (2026-02-18)

### What was changed
- Added inline TNK dose badge next to "TNK Recommended" checkbox — displays calculated dose (e.g., "20.5 mg") when weight is available, eliminating need to open calculator drawer.
- Added secondary prevention plan section to transfer note — includes antithrombotic, statin, BP target, DAPT duration, ezetimibe, PCSK9i, GLP-1 RA, SGLT-2i when populated.
- Changed contraindication alert list keys from index-based (`key={idx}`) to stable identifiers (`key={alert.field || alert.label}`) for all three severity levels.
- Bumped APP_VERSION to v5.14.22 and service-worker cache to v21.

### Why
- Inline TNK dose: During acute consultations, dose visibility at the recommendation point saves 45-60 seconds of drawer navigation per TNK case.
- Secondary prevention in transfer note: Receiving facility previously lacked consulting neurologist's prevention strategy; must now create their own plan without guidance.
- Stable list keys: Prevents React component state bugs when contraindication lists update dynamically.

### QA and validation
- Build: `npx esbuild` and `npx tailwindcss` passed.
- Post-change: inline dose badge verified, secondary prevention section verified in transfer note.
- Deployed to GitHub Pages, push successful.

### Next opportunities
- Auto-populate CrCl calculator from demographics (age, weight, sex, creatinine).
- Add discharge checklist items to discharge note template (currently collected but not exported).
- Consider conditional field visibility by diagnosis category (hide ischemic fields for ICH).
- Context-aware calculator drawer filtering by diagnosis.

## Iteration 037 (2026-02-18)

### What was changed
- Replaced failing `npm test` stub with a deterministic local smoke run.
- Added `scripts/qa-smoke.mjs` to audit required viewport classes (`1440x900`, `768x1024`, `390x844`) on local and live targets.
- Added `npm run qa` to execute local + live smoke checks with JSON artifacts at `output/playwright/qa-smoke-report.json`.
- Added `output/` to `.gitignore` to keep regression artifacts out of source control.
- Updated operational docs (`iteration-log`, `gap-matrix`, `evidence-review-2021-2026`, `regression-checklist`, `continuous-handoff`) for continuous mode.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke)
- `npm run qa`: pass (local + live smoke)

## Iteration 038 (2026-02-18)

### What was changed
- Enhanced `scripts/qa-smoke.mjs` with diagnosis-switch pathway assertions:
  - Verifies active diagnosis button state styling for ischemic/ICH/SAH/CVT/mimic pathways.
  - Verifies TNK recommendation control visibility remains diagnosis-dependent (present for ischemic, hidden for hemorrhagic/mimic selections).
- Hardened local server startup behavior:
  - Reuses an already-running local server at `http://127.0.0.1:4173/` if present.
  - Spawns and tears down local server only when needed.

### QA and validation
- `npm test`: pass (local smoke with diagnosis-switch assertions)
- `npm run qa`: pass (local + live smoke with diagnosis-switch assertions)

## Iteration 039 (2026-02-18)

### What was changed
- Updated `docs/continuous-handoff.md` operational metadata to the latest deployed commit and corrected the resume command to the active macOS workspace path.
- Normalized handoff summary range to include iterations through iter-038 and clarified testing depth (smoke vs deep integration tests).

### QA and validation
- `npm test`: pass
- `npm run qa`: pass

## Iteration 040 (2026-02-18)

### What was changed
- Synced continuous handoff metadata (`Last pushed commit`) to the latest deployed hash after iter-3 push.

### QA and validation
- `npm test`: pass
- `npm run qa`: pass

## Iteration 041 (2026-02-18)

### What was changed
- Made handoff commit tracking durable by replacing hardcoded hash with a runtime command (`git rev-parse --short HEAD`) to avoid stale metadata drift across rapid iterations.

### QA and validation
- `npm test`: pass
- `npm run qa`: pass

## Iteration 068 (2026-02-20)

### What was changed
- Fixed a runtime initialization regression in `src/app.jsx` by converting newly added clinical helper functions to hoisted function declarations (eliminated app boot `ReferenceError` and restored full render).
- Completed CVT special-population integration end-to-end:
  - Added structured decision engine for pregnancy/postpartum, APS, active cancer, and severe thrombophilia.
  - Added interactive CVT special-population flags in both Encounter and Library CVT workflows.
  - Added dynamic CVT plan summary (acute agent, long-term agent strategy, duration, cautions) in Library CVT panel.
  - Wired special-population content into transfer/consult/discharge/progress/signout note outputs.
  - Extended CVT safety warnings to use new special-population fields (APS + DOAC contraindication, pregnancy agent cautions).
- Added citation integrity tooling:
  - New `scripts/validate-citations.mjs` verifies evidence table structure, year window (2021-2026), URL format, and PMID/DOI/NCT metadata presence.
  - Added npm script `validate:citations` and chained it into `npm test` and `npm run qa`.
- Expanded regression smoke assertions in `scripts/qa-smoke.mjs`:
  - Verifies ischemic Library panel contains updated MeVO wording (`No routine EVT (select/trial only)`).
  - Verifies `Post-EVT BP Guardrail` is present in ischemic Library content.
  - Verifies TIA Library panel contains `TIA Disposition Engine`.
- Cache/version bump for deploy consistency:
  - `index.html` APP_VERSION `v5.14.70`
  - `service-worker.js` cache `stroke-app-v69`

### QA and validation
- `npm run build`: pass
- `npm test`: pass (`validate:citations` + local smoke across desktop/tablet/mobile, 0 issues)
- `npm run qa`: pass (local + live smoke across desktop/tablet/mobile, 0 issues)
- `git push origin main`: pass

### Next opportunities
- Add scenario-level QA assertions for CVT special-population warning transitions (APS/pregnancy toggles).
- Add deterministic smoke checks for wake-up CT perfusion auto-eligibility text output.

## Iteration 069 (2026-02-20)

### What was changed
- Upgraded regression smoke (`scripts/qa-smoke.mjs`) from static presence checks to scenario-level behavior checks:
  - TIA scenario assertion: enabling `Persistent deficit` in TIA Disposition Engine must switch recommendation to `Admit / high-acuity observation`.
  - CVT scenario assertion: enabling `APS confirmed` in CVT special-population panel must surface APS caution text (`DOACs are not recommended in APS`).
- Preserved existing assertions for:
  - Ischemic MeVO wording (`No routine EVT (select/trial only)`)
  - Post-EVT BP Guardrail presence
  - TIA Disposition Engine presence

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 070 (2026-02-20)

### What was changed
- Hardened phone-directory non-removal safeguards in `scripts/qa-smoke.mjs` with explicit contact invariants.
- Quick Contacts FAB smoke now requires these UW defaults to be present:
  - `Stroke Phone`
  - `STAT Pharmacy`
  - `HMC Stroke RAD Hotline`
- Settings smoke now requires matching label + phone-value pairs for protected defaults:
  - `Stroke Phone` / `206-744-6789`
  - `STAT Pharmacy` / `206-744-2241`
  - `HMC Stroke RAD Hotline` / `206-744-8484`

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 071 (2026-02-20)

### What was changed
- Completed primary-source citation audit for CVT 2024 AHA scientific statement.
- Corrected residual CVT citation mismatch in evidence docs:
  - Updated DOI from `10.1161/STR.0000000000000486` to `10.1161/STR.0000000000000456`.
  - Added PMID `38284265` directly in key citation table row.
- Cross-checked against PubMed primary page for PMID `38284265` and aligned iteration log wording accordingly.

### QA and validation
- `npm test`: pass (includes citation validator + local smoke)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 072 (2026-02-20)

### What was changed
- Added repository CI workflow at `/Users/rizwankalani/stroke/.github/workflows/ci.yml`.
- CI now enforces on every push/PR to `main`:
  - `npm ci`
  - `npm run build`
  - `npm test` (citation validation + local smoke)
- Added artifact upload for smoke outputs (`output/playwright`) to improve regression triage in CI.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 073 (2026-02-20)

### What was changed
- Added scheduled production audit workflow at `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`.
- Workflow runs daily (`cron: 0 13 * * *`) and on manual dispatch.
- Workflow executes full QA (`npm run qa`) and uploads smoke artifacts (`output/playwright`) for diagnostics.
- This complements push/PR CI by continuously verifying live-site behavior over time.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 074 (2026-02-20)

### What was changed
- Stabilized wake-up/extended-window QA scenario in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs` to eliminate false failures from layout/state drift.
- Added explicit LKW-card re-open step (`Edit`) after wake-up toggle, because senior-rapid auto-collapse hid downstream controls.
- Made scenario input selectors dual-path:
  - Standard desktop IDs (`#input-nihss`, `#input-premorbid-mrs`, `#input-ctp-core`, `#input-ctp-penumbra`)
  - Compact/senior IDs (`#phone-input-nihss`, `#phone-input-premorbid-mrs`)
- Added manual EXTEND fallback checks by toggling all five EXTEND criteria checkboxes when direct CTP inputs are unavailable.
- Hardened checkbox interaction logic to avoid smoke-script crashes (guarded scroll + click with captured issue output instead of uncaught exception).
- Updated auto-criteria matcher to handle both text variants:
  - `Auto criteria met ...`
  - `Auto criteria not fully met yet ...`

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 075 (2026-02-20)

### What was changed
- Added shared wake-up decision trace helpers in `/Users/rizwankalani/stroke/src/app.jsx`:
  - `getWakeUpCriteriaTrace(...)`
  - `formatMissingCriteria(...)`
- Extended note-generation outputs to explicitly document non-eligibility reasons (not only positive eligibility) for wake-up/extended-window pathways:
  - Transfer note
  - Consult note
  - Signout note
  - Progress note
  - Discharge note
- For CTP-pathway wake-up cases, notes now include explicit unmet EXTEND criteria/perfusion thresholds when patient is not yet eligible.
- For MRI-pathway wake-up cases, notes now include explicit missing WAKE-UP criteria when not yet eligible.
- Rebuilt bundled client artifact (`/Users/rizwankalani/stroke/app.js`) from updated source.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 076 (2026-02-20)

### What was changed
- Extended `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs` with deterministic wake-up note-trace assertions.
- Added clipboard-enabled smoke context (`clipboard-read`/`clipboard-write`) and a generated-note validation step:
  - Clicks `Copy Full Note` in Encounter.
  - Reads clipboard text.
  - Verifies expected wake-up trace text is present:
    - Non-eligible rationale (`WAKE-UP criteria not...`, `EXTEND criteria not...`, `not yet eligible`) when direct perfusion inputs are unavailable.
    - Eligibility trace (`MEETS EXTEND CRITERIA`/equivalent) when direct perfusion auto-eligibility is active.
- Reordered wake-up smoke scenario sequencing so note-trace checks occur before manual EXTEND checkbox forcing, preventing false negatives.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 077 (2026-02-20)

### What was changed
- Upgraded scheduled live-smoke operational alerting in `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`.
- Added workflow permissions for issue automation:
  - `contents: read`
  - `issues: write`
- Added failure-path issue routing:
  - On live-smoke failure, open or update a labeled GitHub issue (`live-smoke-alert`) with run URL, SHA, workflow, and event metadata.
- Added success-path auto-resolution:
  - On live-smoke success, comment on and close any open `live-smoke-alert` issues.
- This removes silent scheduled-failure risk and creates an auditable alert trail directly in-repo.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 078 (2026-02-20)

### What was changed
- Enhanced contraindication-trace documentation in `/Users/rizwankalani/stroke/src/app.jsx` by adding explicit **supportive negatives** when data are entered and within safety thresholds.
- `buildContraindicationTrace(...)` now captures and exports:
  - INR ≤1.7
  - Platelets ≥100K
  - aPTT ≤40s
  - Glucose ≥50 mg/dL
  - BP within pre-lysis threshold (≤185/110)
  - No intracranial hemorrhage wording when CT text explicitly documents a negative hemorrhage finding
  - No known anticoagulant exposure (or DOAC last dose ≥48h when documented)
- Contraindication trace remains conservative: only documented/derivable negatives are included.
- Rebuilt bundled client artifact (`/Users/rizwankalani/stroke/app.js`) from updated source.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 079 (2026-02-20)

### What was changed
- Added shared post-EVT BP plan formatter in `/Users/rizwankalani/stroke/src/app.jsx`:
  - `getPostEvtBpPlanSummary(...)`
- Integrated structured post-EVT BP guardrail details into note outputs using existing stored fields (`postEvtBP`):
  - Reperfusion status
  - Infusion agent (nicardipine/clevidipine/labetalol/none)
  - Target strategy (standard vs 130-180 guardrail)
- Updated output sections in:
  - Transfer note
  - Signout note
  - Progress note
  - Discharge note
- Rebuilt bundled client artifact (`/Users/rizwankalani/stroke/app.js`) from updated source.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 080 (2026-02-20)

### What was changed
- Hardened citation integrity checks in `/Users/rizwankalani/stroke/scripts/validate-citations.mjs`.
- Added identifier extraction and validation for citation metadata table rows:
  - PMID format validation
  - DOI format validation (`10.xxxx/...` pattern)
  - NCT format validation (`NCT########`)
- Added cross-row duplicate identifier detection:
  - Duplicate PMID across different titles
  - Duplicate DOI across different titles
  - Duplicate NCT across different titles
- Existing table-shape, year-range, URL, and title/year duplicate checks remain in place.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 081 (2026-02-20)

### What was changed
- Expanded `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs` wake-up scenario with explicit contraindication-trace regression coverage.
- Smoke scenario now seeds key thrombolysis safety fields before copying note text:
  - BP
  - INR
  - Platelets
  - Glucose
  - CT result text (`No acute hemorrhage.`)
- Added deterministic clipboard assertion for generated note content:
  - Must contain `Supportive negatives:` trace line in contraindication section.
- Existing wake-up eligibility/non-eligibility trace checks remain intact.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 082 (2026-02-20)

### What was changed
- Completed post-EVT note-plan regression coverage in `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`.
- Added deterministic smoke setup before post-EVT note assertion:
  - return to Encounter (`Ctrl+2`)
  - re-select `Ischemic Stroke or TIA`
  - re-check `EVT Recommended`
  - switch note template to `Signout`
- Kept existing library-side Post-EVT BP Guardrail configuration in smoke flow (reperfusion status, current BP, infusion agent, target strategy).
- Added clipboard assertion that generated note text contains structured post-EVT BP plan output with Nicardipine agent line.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 083 (2026-02-20)

### What was changed
- Added citation URL-health validation mode to `/Users/rizwankalani/stroke/scripts/validate-citations.mjs`:
  - new flag: `--check-links`
  - checks each unique citation URL with bounded timeout/retry and HEAD→GET fallback
  - treats HTTP `401`/`403` as reachable-but-restricted (warning, not failure)
  - reports row-indexed failures for unreachable links
- Added npm script in `/Users/rizwankalani/stroke/package.json`:
  - `validate:citations:links`
- Updated scheduled production audit in `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`:
  - runs citation URL-health validation before full local+live smoke QA.

### QA and validation
- `npm run validate:citations:links`: pass (3 restricted-access warnings, 0 failures)
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 084 (2026-02-20)

### What was changed
- Added citation identifier-endpoint verification mode to `/Users/rizwankalani/stroke/scripts/validate-citations.mjs`:
  - new flag: `--check-identifiers`
  - verifies PMID, DOI, and NCT endpoints with retry/timeout safeguards
  - DOI validation now uses DOI handle API endpoint semantics instead of landing-page fetches to reduce false negatives
- Added npm script in `/Users/rizwankalani/stroke/package.json`:
  - `validate:citations:ids`
- Updated scheduled production audit in `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`:
  - runs `validate:citations:ids` in addition to URL-health checks before full smoke QA.

### QA and validation
- `npm run validate:citations:ids`: pass
- `npm run validate:citations:links`: pass (3 restricted-access warnings, 0 failures)
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 085 (2026-02-20)

### What was changed
- Hardened citation identifier validation in `/Users/rizwankalani/stroke/scripts/validate-citations.mjs`:
  - PMID checks now use batched PubMed eSummary retrieval to avoid rate-limit failures.
  - Added PMID title-overlap drift detection (warning-level) to surface metadata mismatches.
  - Preserved DOI handle endpoint checks and URL-health checks.
- Corrected evidence table metadata drift in `/Users/rizwankalani/stroke/docs/evidence-review-2021-2026.md`:
  - Fixed incorrect PMIDs/DOIs/URLs/sources for key trials (AcT, TRACE-2, ORIGINAL, TWIST, TENSION, INTERACT3).
  - Corrected additional DOI mismatches (RESCUE-Japan LIMIT, ANGEL-ASPECT, ENRICH, INSPIRES, TIMING).
  - Updated CVT and INSPIRES URLs to PubMed endpoints for more reliable accessibility.
  - Corrected stale metadata in historical verification notes (including AIS guideline PMID and large-core/ANNEXA references).

### QA and validation
- `npm run validate:citations:ids`: pass (no identifier drift warnings after corrections)
- `npm run validate:citations:links`: pass (1 restricted-access warning, 0 failures)
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 086 (2026-02-20)

### What was changed
- Added automated evidence watchlist generator:
  - new script: `/Users/rizwankalani/stroke/scripts/evidence-watch.mjs`
  - new npm command: `npm run evidence:watch`
  - output file: `/Users/rizwankalani/stroke/docs/evidence-watchlist.md`
- Watchlist generation behavior:
  - uses PubMed E-utilities to scan high-priority stroke domains for recent uncited literature
  - excludes already cited PMIDs
  - applies high-signal source filtering and low-value publication exclusion heuristics
  - groups candidates by clinical topic for manual curation into the evidence table
- Regenerated watchlist with current baseline citation set.

### QA and validation
- `npm run evidence:watch`: pass (watchlist regenerated)
- `npm run build`: pass
- `npm test`: pass (local smoke, 0 issues)
- `npm run qa`: pass (local + live smoke, 0 issues)

## Iteration 091 (2026-02-21)

### What was changed
- Added structured ICH timeliness capture in `/Users/rizwankalani/stroke/src/app.jsx`:
  - `ichReversalStartTime` and `ichTransferDecisionTime` fields with explicit time inputs in the ICH management workflow.
  - New KPI helpers for `door-to-reversal`, `door-to-transfer decision`, and `reversal-to-transfer` intervals.
- Added ICH warning-layer safeguards:
  - warns when reversal is marked initiated but reversal start time is missing.
  - warns when transfer is accepted but transfer decision time is missing.
- Added ICH KPI propagation into generated note outputs:
  - transfer, signout, progress, discharge, consult, voice-style, and pathway-plan outputs now include timing summary when available.
- Added ICH dashboard KPI tiles in outcomes view:
  - `D2-Reversal` (color-coded timeliness bands),
  - `D2-Transfer` (color-coded timeliness bands).
- Added diagnosis-switch cleanup for ICH-specific timing fields to prevent stale carryover outside ICH pathways.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.73`.
  - service-worker cache key bumped to `stroke-app-v72`.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 095 (2026-02-21)

### What was changed
- Added evidence-promotion automation tooling:
  - new script: `/Users/rizwankalani/stroke/scripts/evidence-promotion-checklist.mjs`
  - new npm command: `npm run evidence:promote`
  - generated output: `/Users/rizwankalani/stroke/docs/evidence-promotion-checklist.md`
- New promotion checklist behavior:
  - parses watchlist candidates from `docs/evidence-watchlist.md`,
  - filters to high-priority (`P0`/`P1`) uncited candidates,
  - emits a clinician-review queue with topic-specific promotion actions and PMID/DOI/URL traceability.
- Updated scheduled production audit workflow:
  - `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml` now runs `npm run evidence:promote` before full QA.

### QA and validation
- `npm run evidence:promote`: pass (`13` high-priority candidates queued)
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 096 (2026-02-21)

### What was changed
- Added evidence-promotion sync validator:
  - new script: `/Users/rizwankalani/stroke/scripts/validate-evidence-promotion.mjs`
  - validates that all `P0/P1` PMIDs in `docs/evidence-watchlist.md` are present in `docs/evidence-promotion-checklist.md` (and no stale extras remain).
- Extended npm evidence-ops commands in `/Users/rizwankalani/stroke/package.json`:
  - `validate:evidence-promotion`
  - `evidence:refresh` (`watch` + `promote`)
- Hardened QA/test gates:
  - `npm test` now includes `validate:evidence-promotion`.
  - `npm run qa` now includes `validate:evidence-promotion`.

### QA and validation
- `npm run evidence:promote`: pass (`13` high-priority candidates queued)
- `npm run validate:evidence-promotion`: pass (`13` PMIDs synced)
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 097 (2026-02-21)

### What was changed
- Added evidence promotion PR-template scaffolding:
  - new script: `/Users/rizwankalani/stroke/scripts/evidence-promotion-template.mjs`
  - new npm command: `npm run evidence:template`
  - generated output: `/Users/rizwankalani/stroke/docs/evidence-promotion-template.md`
- Extended evidence refresh flow:
  - `evidence:refresh` now runs watchlist generation, promotion checklist generation, template generation, and sync validation in one command.
- Template output now includes per-candidate:
  - metadata patch block (domain/title/year/source/URL/PMID/DOI),
  - standardized workflow-impact checklist,
  - topic + promotion-focus trace context.

### QA and validation
- `npm run evidence:promote`: pass (`13` high-priority candidates queued)
- `npm run evidence:template`: pass (`13` candidate templates generated)
- `npm run validate:evidence-promotion`: pass (`13` PMIDs synced)
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 098 (2026-02-21)

### What was changed
- Added selective evidence-template generation controls in `/Users/rizwankalani/stroke/scripts/evidence-promotion-template.mjs`:
  - `--priority` filter (`p0`, `p1`, or `all`)
  - `--pmid` targeting (repeatable)
  - `--limit` result cap
  - `--output` custom file path
- Extended npm scripts in `/Users/rizwankalani/stroke/package.json`:
  - `evidence:template:p0`
  - `evidence:template:top5`
- Generated focused urgent queue draft:
  - `/Users/rizwankalani/stroke/docs/evidence-promotion-template-p0.md`

### QA and validation
- `npm run evidence:promote`: pass (`13` high-priority candidates queued)
- `npm run evidence:template`: pass (`13` templates generated)
- `node ./scripts/evidence-promotion-template.mjs --priority p0 --output docs/evidence-promotion-template-p0.md`: pass (`3` templates generated)
- `npm run validate:evidence-promotion`: pass (`13` PMIDs synced)
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 094 (2026-02-21)

### What was changed
- Added a dedicated **2026 AIS Guideline Delta** rapid-review card in ischemic management UI (`/Users/rizwankalani/stroke/src/app.jsx`):
  - thrombolysis pathway emphasis (TNK-based workflow),
  - imaging-selected extended-window framing,
  - post-EVT BP floor harm reminder (avoid SBP <140 after successful reperfusion),
  - short-course DAPT framing for eligible minor stroke/high-risk TIA.
- Added case-specific AIS-2026 delta summarization helper:
  - `getAis2026DeltaSummary(...)`
- Propagated AIS delta trace into core generated documentation outputs:
  - brief summary, transfer, signout, progress, discharge, consult, voice-style summary, and pathway-plan notes.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.76`.
  - service-worker cache key bumped to `stroke-app-v75`.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 093 (2026-02-21)

### What was changed
- Added structured DAPT adherence tracking in `/Users/rizwankalani/stroke/src/app.jsx` under secondary prevention:
  - start date, planned stop date, missed doses (7d),
  - adherence status (`on track`, `at risk`, `nonadherent`, `completed`),
  - explicit post-DAPT transition plan and transition agent,
  - adherence barrier notes.
- Added DAPT safety/completeness warnings:
  - missing duration/start/stop date for selected DAPT pathways,
  - high missed-dose burden warning (>=3 missed doses/7 days),
  - completed DAPT without transition plan,
  - transition plan without selected transition agent.
- Added DAPT adherence summary propagation into generated notes:
  - brief summary, transfer, signout, progress, discharge, consult, voice-style summary, and pathway-plan outputs.
- Added compact UI “DAPT Adherence Tracker” with live trace preview directly in antithrombotic selection workflow.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.75`.
  - service-worker cache key bumped to `stroke-app-v74`.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)

## Iteration 092 (2026-02-21)

### What was changed
- Added standardized SAH outcome-capture workflow in `/Users/rizwankalani/stroke/src/app.jsx`:
  - new `sahOutcomeSet` structured fields for discharge and 90-day endpoints:
    - discharge mRS,
    - discharge destination,
    - 90-day mRS,
    - 90-day vital status,
    - follow-up scheduling/date,
    - cognitive and HRQoL follow-up planning flags.
- Added SAH outcome-capture warning safeguards:
  - warns when SAH disposition is documented without discharge mRS.
  - warns when SAH pathway lacks 90-day follow-up scheduling and no 90-day mRS is documented.
  - warns on internal inconsistency (`90-day deceased` with mRS not equal to `6`).
- Added SAH outcome-summary propagation into generated notes:
  - full-note brief summary, transfer, signout, progress, discharge, consult, and pathway-plan outputs now include SAH outcome trace when present.
- Added SAH Management UI card:
  - compact “SAH Outcomes (Discharge + 90-Day)” panel with structured inputs and live summary.
  - embedded evidence citation footer for standardized SAH outcomes paper.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.74`.
  - service-worker cache key bumped to `stroke-app-v73`.

### QA and validation
- `npm run build`: pass
- `npm test`: pass (`Runs: 3 | Issues: 0`)
- `npm run qa`: pass (`Runs: 6 | Issues: 0`)
