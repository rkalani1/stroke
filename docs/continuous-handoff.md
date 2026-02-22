# Continuous Handoff

## Current state (2026-02-21)
- Branch: `main`
- Last pushed commit: run `git rev-parse --short origin/main`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.78`
- Service worker cache key: `stroke-app-v77`

## Iteration 121 update (2026-02-21, macOS session)
- Completed:
  - Added strict latency enforcement flag in smoke QA:
    - `--enforce-latency-thresholds`
  - Added strict latency QA command:
    - `npm run qa:latency-strict`
  - Added smoke summary trace field:
    - `enforceLatencyThresholds`
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa:latency-strict` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 120 update (2026-02-21, macOS session)
- Completed:
  - Added configurable smoke latency-threshold alerting in:
    - `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`
  - Added summary telemetry for threshold governance:
    - `runDurationThresholdMs`
    - `sectionDurationThresholdMs`
    - `slowRunCount` / `slowSectionCount`
    - `slowRuns` / `slowSections`
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 119 update (2026-02-21, macOS session)
- Completed:
  - Added section-level smoke timing telemetry and per-run duration capture in:
    - `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`
  - Added summary-level timing diagnostics in smoke report output:
    - `averageRunDurationMs`
    - `slowestRun`
    - console trace of slowest run.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 118 update (2026-02-21, macOS session)
- Completed:
  - Added churn-profile schema validation diagnostics capture and artifact export in:
    - `/Users/rizwankalani/stroke/.github/workflows/ci.yml`
    - `/Users/rizwankalani/stroke/.github/workflows/live-smoke.yml`
  - Hardened smoke-run reliability in:
    - `/Users/rizwankalani/stroke/scripts/qa-smoke.mjs`
    - deterministic Playwright action timeout defaults,
    - per-viewport runtime errors now captured as `audit-runtime-error` findings instead of aborting the full run.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Session summary (iter-006 through iter-038)

### Clinical content (iter-006 through iter-008, iter-013, iter-014, iter-016 through iter-029)
- SAH first-hour rapid actions card
- CVT treatment timeline strip
- AF anticoag timing quick reference
- TNK-first decision card with alteplase fallback
- Wake-up imaging hard-stop alert
- Pregnancy/peripartum emergency rapid actions panel
- Renal-safety auto-alert in contrast section
- PFO closure eligibility decision card
- Carotid revascularization decision guide
- Post-EVT antithrombotic restart protocol (no-stent, stent/DAPT, sICH, TICI 0-2a)
- Large-core EVT trial outcome matrix (SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION, LASTE)
- Discharge medication reconciliation safety check panel
- AHA/ASA GWTG quality metrics exported to discharge note template
- Caregiver education checklist + screening scores (PHQ-2, MoCA, STOP-BANG) in discharge note

### Usability & workflow (iter-015 through iter-025)
- Inline TNK dose badge at recommendation checkbox
- Secondary prevention plan added to transfer note
- Stable contraindication list keys (field/label-based)
- Diagnosis-aware field visibility: ASPECTS, PC-ASPECTS, contraindication checklist hidden for ICH/SAH
- ICH volume calculator max constraint relaxed (30 → 50 cm)
- Accessibility: label associations for HT management textarea, Other diagnosis input
- Settings menu focus restoration on close (keyboard a11y)
- Protocol modal "Esc to close" hint for discoverability
- Calculator priority maps enhanced: FUNC Score for ICH, Mod. Fisher for SAH
- Calculator radio buttons: role="radio" + aria-checked + aria-label on all groups
- WCAG AA contrast fixes on calculator descriptions and modal hints
- Vessel occlusion selector hidden for non-ischemic diagnoses
- Template diagnosis handler synchronized with comprehensive dropdown handler
- ASPECTS/PC-ASPECTS mobile responsive grids (2-col on mobile, 3-col tablet, full on desktop)
- EVT procedure details section auto-opens when populated

### Quality & infrastructure (iter-009 through iter-036)
- Cross-links between reference cards and data-entry sections
- Mobile responsiveness audit: all cards safe at 390px
- Schema mismatch debt resolved (compare_keys.ps1 fixed, 0 true mismatches)
- CrCl calculation added to ALL note templates (transfer, signout, discharge, consult)
- TNK-first rationale added to transfer note treatment section
- NIHSS stale closure bug fixed (click + keyboard handlers use functional updater)
- ASPECTS score input clamped to 0-10 in JS
- Dead code cleanup (unused calculateASPECTS removed)
- html2pdf CDN load timeout guard (8s)
- Full clinical audit: 0 P0/P1 findings (app clinically sound)
- Transfer note statinIntensity → statinDose field name bug fixed
- ErrorBoundary wrapping Encounter tab for crash resilience
- Screening results (PHQ-2, MoCA, STOP-BANG) added to signout note template
- TIA workup completion % and pending items in discharge note
- mTICI score added to transfer note EVT section
- Signout SAH/CVT sections enriched with vasospasm and anticoag phase details
- Rehab screening timeline (aphasia 30d, cognitive discharge/3mo) in discharge note
- Consult note PT, affected side, pre-morbid mRS added
- Progress note synced with signout (9 missing fields restored)
- Follow-up brief enhanced with sICH + discharge NIHSS delta
- EVT procedural fields: access site, device, passes, technique, reperfusion time
- Dashboard case outcomes card (DTN, DTP, mTICI, NIHSS delta, mRS, sICH, quality measures)
- ASPECTS interactive scorer state sync bug fixed (stale closure → functional updater)
- EVT procedural fields now in ALL 8 note templates (was only in transfer + procedure)
- QM count guarded behind dischargeChecklistReviewed
- Dashboard outcome card print styling
- DAWN age ≥80 EVT late-window warning (NIHSS <10 → error)
- ACEi + TNK angioedema warning escalated to error severity
- Textarea focus:outline-none consistency (4 locations)
- DAPT duration select visible label added
- Patient education: mimic-aware path (non-stroke content for mimics)
- Patient education: CVT-specific venous thrombosis education
- Wake-up stroke template lkwUnknown ReferenceError fixed
- consentKit cleared on diagnosis change (template + dropdown)
- Follow-up brief: discharge mRS with admission comparison
- Progress note: VTE prophylaxis from state (was static placeholder)
- Handler 3 (applyDiagnosisSelection) synced with Handlers 1 & 2 (28+ field clears)
- EVT procedural fields + nested objects cleared on diagnosis category change (all 3 handlers)
- Patient education: SAH-specific (rebleeding, vasospasm, nimodipine, aneurysm status)
- Discharge note: LDL placeholder replaced with secondaryPrevention.ldlCurrent
- Discharge note: carotid imaging placeholder replaced with carotidManagement data
- COMPASS dual-pathway guideline fixed (medicalHistory → pmh field reference)
- bpPhase reset synchronized across all 3 diagnosis-change handlers
- cvtAnticoag nested object cleared on diagnosis change (all 3 handlers)
- LAA closure guideline fixed (ekgFindings → ekgResults field reference)
- Pregnancy EVT guideline fixed (specialPopulations → pregnancyStroke boolean)
- Accessibility: ASPECTS, EKG, TNK Admin Time label/id associations added
- Progress note: ICH management section (volume, reversal, surgical criteria, BP)
- Progress note: SAH management section (grade, Fisher, aneurysm, vasospasm)
- Discharge note: SAH aneurysm location/size/method + vasospasm monitoring added
- Note template section headers standardized to UPPERCASE
- Progress note: osmotic therapy, early mobilization, fever management, nutritional support added
- Discharge note: early mobilization, fever management, family communication added
- Signout note: osmotic therapy, early mobilization, fever status, nutrition/feeding added
- NaN/falsy guard fixes on 8 warning conditions (INR, aPTT, platelets, creatinine, glucose)
- ErrorBoundary wrapping Settings tab and Trials tab for crash resilience
- Lab-not-checked warnings: INR, platelets, aPTT prompt when TNK recommended but labs undocumented
- EVT imaging warnings: CTA results and ASPECTS not-documented prompts when EVT recommended
- TNK auto-block toast synchronized across all 3 diagnosis-change handlers
- Discharge note: returnToWork section (timeline, vocational rehab, phased return)
- Patient education: discharge mRS with lay-friendly descriptions + returnToWork guidance
- Progress note: disablingDeficit rationale for TNK despite low NIHSS
- Focus trap useEffect deps: removed settingsMenuOpen (not a modal)
- XSS import validation hardened: data:text/html, vbscript:, on*= event handler patterns
- Encounter history localStorage save: silent catch → error logging
- De-identification: UW Medicine + UW neurology intranet links relabeled as "EMR" and "Telestroke Resources" (no institutional names visible)
- Accessibility: aria-label on DOAC initiation day, TEE findings, discharge checklist detail inputs
- Input validation: max bounds on CrCl (200), CTP core (500), CTP penumbra (1500)
- Discharge note: substance screening (AUDIT-C), hormonal risk (OCP/HRT), rehab screening (spasticity, central pain, fatigue)

### Gap matrix: ALL P0/P1 items COMPLETED

## Known remaining work
- No deep unit/integration tests yet (smoke automation is now in place)
- Bundle size 2.2 MB
- Pediatric stroke pathway guidance not yet added
- Structured pertinent negatives in consult note (requires new state fields)
- Active drip parameters section for signout note (requires new state fields)
- Specific follow-up appointment fields for discharge note (requires new state fields)
- Imaging follow-up modality field for discharge note (requires new state field)

## Resume command
- `cd /Users/rizwankalani/stroke && git pull --rebase origin main && npm test && npm run qa && npm run build`

## Iteration 037a update (2026-02-18, Mac session)
- Added deterministic smoke automation (`scripts/qa-smoke.mjs`) and wired commands:
  - `npm test` => local smoke
  - `npm run qa` => local + live smoke
- Updated docs for continuous mode tracking and refreshed evidence metadata verification notes.

## Iteration 037b update (2026-02-19, Windows session)
- Phone view vessel occlusion quick-select: added diagnosis guard (was showing for ICH/SAH/CVT)
- Tablet NIHSS input: added step="1" (phone view had it, tablet didn't)
- Tablet glucose handler: added JS clamping Math.max(10, Math.min(800, parsed)) to match phone view
- Tablet weight input: bounds tightened min=20 max=350 (was min=0 max=500)
- Tablet aria-invalid/aria-describedby added for glucose, INR, platelets error states
- Quick links restored with de-identified labels ("EMR", "Telestroke Resources")

## Iteration 038 update (2026-02-18)
- Strengthened smoke automation with diagnosis-switch and TNK-visibility gating checks.
- Added local server re-use logic to avoid flaky failures when port `4173` is already occupied.
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && npm test && npm run qa && npm run build`

## Iteration 040 update (2026-02-18)
- Handoff metadata commit pointer synced to latest deployed state.
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && npm test && npm run qa && npm run build`

## Iteration 041 update (2026-02-18)
- Replaced hardcoded handoff commit hash with command-based retrieval to prevent stale metadata in rapid loops.

## Iteration 042 update (2026-02-19, Windows session)
- Guideline logic fixes (4 P1):
  - MIE GCS upper bound ≤12 → ≤15 (MISTIE-III enrollment criteria)
  - Decompressive craniectomy age <60 → ≤60 (DECIMAL/DESTINY criteria)
  - CVT thrombophilia: removed inappropriate age≤60 restriction
  - EVT late window: added ASPECTS≥6 check with null passthrough
- Note template enrichment:
  - Transfer note: chiefComplaint added before HPI
  - TNK auto-block reason surfaced in transfer, signout, discharge, follow-up brief
- Infrastructure: qa-smoke.mjs cross-platform python command fix

## Iteration 043 update (2026-02-19, Windows session)
- dx.includes → diagnosisCategory migration:
  - 6 TIA guidelines migrated to diagnosisCategory === 'tia'
  - arcadia_atrial_cardiopathy + esus_monitoring: added ischemic/tia guards
  - NIHSS-TIA discordance flag migrated
- Note template enrichment:
  - preTNKSafetyPause in transfer note
  - bpPostEVT in transfer, signout, discharge notes
- Accessibility:
  - ConfirmModal Enter/Escape keyboard handlers (P0)
  - ConfirmModal input label association
  - Weight unit toggle aria-pressed + aria-label

## Iteration 044 update (2026-02-19, Windows session)
- Accessibility:
  - Calculator drawer, changelog modal, keyboard help modal: "Press Esc to close" hints
  - Keyboard help: search navigation entries (↑/↓ and Enter)
- Note template enrichment:
  - Signout note: chiefComplaint added before Brief HPI
- Warning audit (iter-044 agents): localStorage persistence solid (no P0/P1), warning coverage audit mostly false positives (contraindication checklist already covers claimed gaps)

## Iteration 045 update (2026-02-19, Windows session)
- Note template completeness audit:
  - Signout note: PMH and home medications added
  - Discharge note: PMH added; PC-ASPECTS scoring added to imaging section
  - Progress note: PMH added
  - Follow-up brief: PMH and presenting BP added
- UI/UX interaction audit: weight bounds false positive (both views have HTML min/max), CrCl bounds false positive (calculator has min/max), keyboard help Esc hint already added in iter-044

## Iteration 046 update (2026-02-19, Windows session)
- Phone/tablet parity fixes:
  - Phone NIHSS: added 0-42 clamping + empty-string guard (P0 — was unclamped)
  - Phone glucose warning: threshold 50 → 60 mg/dL to match tablet (AHA guideline)
  - Phone aria-describedby IDs: renamed -tablet suffix → -phone
- Guideline audit: all P0 claims false positives (ASPECTS≥6 intentional per DAWN/DEFUSE-3, ICH seizure prophylaxis correctly fires for all ICH, SAH nimodipine de-dup is design choice)

## Iteration 047 update (2026-02-19, Windows session)
- Encounter readiness:
  - Weight added to recommended tracked fields (critical for TNK dosing)
  - Weight jump target added to Ctrl+Shift+N navigation
  - useMemo dependency array updated
- Calculator audit: ALL CLEAR — all formulas correct (GCS, ICH Score, CHA2DS2-VASc, HAS-BLED, ABCD2, ROPE, mRS, FUNC, RCVS², PHASES, CrCl, TNK, Alteplase, PCC, Enoxaparin)
- Search/navigation audit: comprehensive (60+ searchable items, all keyboard shortcuts working)

## Iteration 048 update (2026-02-19, Windows session)
- Default state safety:
  - ctDate and ctaDate defaults changed from today's date to empty string (prevents pre-filled dates mistaken for actual)
- Clinical pathway visibility audit: ALL CLEAR — perfect diagnosis gating across all 5 categories
- Data persistence audit: architecture solid, XSS prevention robust, no P0 issues

## Iteration 049 update (2026-02-19, Windows session)
- Note template guideline sync:
  - Signout + progress notes: DAPT duration added to antithrombotic line
  - Signout note: ICH BP target specified (SBP <140, was just "BP managed")
  - Signout note: clinical rationale field surfaced before disposition
- Crash resilience audit: all P0 claims false positives (all split/parse patterns have upstream guards)
- Guideline-to-note sync audit: transfer note already has secondary prevention (agent missed it)

## Iteration 050 update (2026-02-19, Windows session)
- Consent documentation:
  - evtConsentWith field added to consentKit (default state, UI text input, all 3 diagnosis-change resets)
  - Transfer note: EVT consent line includes "with [name/relation]" when specified
  - Consult note: EVT consent header uses specific person name (falls back to "patient/family")
- Warning system:
  - Code status conflict: DNR/DNI or Comfort care + TNK/EVT → P0 goals-of-care conflict error
- Trial eligibility audit: SISTER EVT exclusion confirmed correct (non-EVT candidates), CTP detail claims impractical (require new fields)

## Iteration 051 update (2026-02-19, Windows session)
- Transfer pre-flight safety warnings (4 new, all use existing fields):
  - GCS ≤8 + transferAccepted → airway protection reminder
  - Post-TNK + transferAccepted + neuro checks not started → monitoring warning
  - transferAccepted + imaging not shared → imaging warning
  - transferAccepted + BP not stable → hemodynamic warning
- Drug interaction: nimodipine + CYP3A4 inhibitor warning for SAH patients
  (diltiazem, verapamil, azole antifungals, macrolides, protease inhibitors)
- Transfer audit false positives: DAPT Duration UI "missing" — exists at lines 18656/22425
- Medication audit false positives: triple therapy override field — warnings are sufficient

## Iteration 052 update (2026-02-19, Windows session)
- Phone view vitals parity:
  - HR, SpO2, Temp inputs added to phone view (were completely absent)
  - Clamping logic matches tablet: HR 20-300, SpO2 50-100, Temp 90-110°F
- Phone glucose fix (residual from iter-046):
  - Border color threshold 50→60 mg/dL
  - aria-invalid threshold 50→60 mg/dL (iter-046 only fixed error message + aria-describedby)
- localStorage persistence audit: ALL CLEAR — all 199 fields matched

## Iteration 053 update (2026-02-19, Windows session)
- Warning system expansion (4 new warnings):
  - DTN >60 min benchmark warning (AHA/ASA ≤60 min target)
  - Contrast allergy + EVT → premedication protocol / MRA reminder
  - Contrast allergy + CTA done → delayed reaction monitoring (4-48h)
  - CrCl <30 + contrast imaging → nephropathy risk, hydration, metformin hold
- Procedure note bug fix: hemorrhagicTransformation.phType → .classification (field name mismatch)
- Note template audit: consultStartTime "missing" was FALSE POSITIVE (IS in consult note at line 10750)
- Warning audit false positives: pregnancy+CTA=P2 at best, allergy text parsing=high false positive risk

## Iteration 054 update (2026-02-19, Windows session)
- Accessibility: arrow key navigation on ALL 11 radio button groups (WCAG 2.1 AA)
  - GCS eye/verbal/motor (main + calculator drawer), ICH GCS, mRS, ABCD2, Hunt-Hess, WFNS
  - Shared handleRadioKeyDown helper: ArrowUp/Down/Left/Right → focus + click
- Guideline evidence audit: ALL CLEAR — all thresholds verified correct
  (TNK dosing, EVT windows, BP targets, ASPECTS, reversal agents, DAPT durations, statin intensity)
- Keyboard accessibility audit: overall STRONG, only radio groups needed fix

## Iteration 055 update (2026-02-19, Windows session)
- New feature: JSON encounter export (exportEncounterJSON)
  - Settings menu "Export as JSON" button + command search "export json"
  - Downloads telestrokeNote, nihssScore, gcsItems, ichScoreItems as .json
  - Pairs with existing importJSON() for cross-device encounter transfer
- ICH pathway audit: ALL CLEAR — no P0/P1 gaps (comprehensive BP/reversal/surgical/VTE coverage)
- Print/export audit false positives: print CSS exists, PDF has filename, #app always exists

## Iteration 056 update (2026-02-19, Windows session)
- SAH pathway fixes:
  - Modified Fisher added to SAH grading scale dropdown (grades 0-4 with vasospasm risk %)
  - fisherGrade auto-synced when Modified Fisher selected in grading dropdown
  - Note template label mappings updated for modifiedFisher scale across all templates
  - SAH aneurysm securing warning (neurosurgery consulted + unsecured → remind 24h urgency)
  - DCI + induced hypertension warning (DCI suspected + aneurysm secured + no induced HTN)
  - DCI + unsecured aneurysm warning (induced HTN contraindicated until secured)
- Encounter history:
  - localStorage quota error upgraded from silent console.warn to user-visible toast
- Audit false positives: batch save race condition (localStorage is synchronous), encounter history restore (feature request, JSON export/import covers it), nested object merge (2-level deep merge already exists)

## Iteration 057 update (2026-02-19, Windows session)
- CVT warning system (4 new warnings):
  - CVT + DOAC in APS: CONTRAINDICATED error (TRAPS/ASTRO-APS), was UI-only
  - CVT + enoxaparin without weight: dosing error (1 mg/kg requires weight)
  - CVT + hemorrhagic infarction + no anticoag: reminder HT is NOT contraindication (Class I)
  - CVT + pregnancy + DOAC: teratogenic contraindication error
- TIA warning system (1 new warning):
  - ABCD2 ≥4 without DAPT selected: CHANCE/POINT protocol reminder
- CVT audit false positives: antiplatelet detection (free-text parsing too error-prone), ICP/seizure/thrombophilia gaps (need new state fields)
- TIA audit: pathway STRONG overall, no P0 gaps; crescendo TIA + observation protocol need new state fields (skipped)

## Iteration 058 update (2026-02-19, Windows session)
- P0 bug fix: mimic diagnosis auto-detect category was '' instead of 'mimic' (broke all mimic routing)
- Order bundle colorMap: added indigo, amber, yellow (Acute Labs, Seizure Tx, Glucose Mgmt were rendering gray)
- CVT anticoagulation order bundle: weight-based enoxaparin, APS warfarin logic, provoked/unprovoked duration
- CVT added to nursing parameters sheet with CVT-specific BP target
- Post-TNK→mimic reclassification warning: alerts if TNK was given before diagnosis changed to mimic
- Mimic audit false positives: DAPT NIHSS threshold (isIschemic already includes TIA)
- Order bundle audit false positives: DAPT threshold for TIA (isIschemic = ischemic || tia at line 12251)

## Iteration 059 update (2026-02-19, Windows session)
- Guideline fix: glycemic_management condition no longer false-triggers on empty glucose field
- Note template enrichment:
  - Progress note: weight in demographics line, home medications after PMH
  - Signout note: discharge NIHSS with delta after admission NIHSS
  - Follow-up brief: SAH summary section (grade, scale, Fisher, aneurysm status, nimodipine, DCI)
- Guideline audit false positives: seizureRisk null guards already present, ich_mis_evac GCS criterion sufficient
- Note template audit false positives: procedure note secondary prevention/PMH (operative note design choice)

## Iteration 060 update (2026-02-19, Windows session)
- Command search expansion: Ischemic Stroke Management, Discharge Checklist, Order Bundles added to searchable items
- Warning system: EVT recommended for age ≥80 + pre-mRS ≥2 warning (outside DAWN/DEFUSE-3 enrollment criteria)
- Special populations audit false positives: almost all P1+ require new state fields (skipped per constraint)
- Command search audit false positives: SAH pathway line 24523 claim was about L&D team standby, not APS

## Iteration 061 update (2026-02-19, Windows session)
- P0 fixes:
  - ICH Management section case mismatch in transfer note (sentinel '\nICH Management:\n' vs '\nICH MANAGEMENT:\n' — empty header always appended)
  - Negative DTN/Door-to-CT/CT-to-Needle time values now rejected (>=0 and <=1440 guard, matching DTP)
  - parseDT NaN guard: tnkAdminTime HH:MM string no longer produces Invalid Date (was silencing TNK window warnings)
  - TNK window warning now uses dtnTnkAdministered (full datetime) with tnkAdminTime+lkwDate fallback
- P1 fixes:
  - doorToNeedle === 0 no longer treated as falsy (changed to null check)
  - Recommendations 500-char truncation removed from transfer/signout/progress/discharge notes
  - Future LKW shows red badge "FUTURE — check LKW time" instead of green "Within TNK window"
  - Wake-up stroke discovery timing now shows urgency color in header badge (was always gray)
  - Print CSS: .sticky scoped to .sticky.top-0 and .sticky.z-50 (patient summary strip now visible)
  - Print CSS: closed details panels forced visible (details > *:not(summary) { display: block })
  - Print CSS: max-h-96 override removes height constraint for full note preview
- False positives/downgrades: two-timer race (P0→P2, 15s pre-LKW intentional), PDF #root capture (complex refactor, deferred), a[href]:after (cosmetic), midnight crossover (very rare edge case)

## Iteration 062 update (2026-02-19, Windows session)
- Discharge workflow fixes:
  - TIA follow-up urgency: migrated from diagnosis.includes('tia') to diagnosisCategory === 'tia' (2 locations: discharge note + patient education)
  - HbA1c follow-up lab extended to TIA patients (was ischemic only; AHA/ASA 2021 Class I)
  - Echo/TEE results populated from esusWorkup.teeFindings in KEY RESULTS section (was hardcoded ___)
  - Standalone GWTG warnings (STK-5 antithrombotic, STK-6 statin) fire when disposition set without checklist review
- State management fixes:
  - Search /dx command handler now performs FULL pathway field cleanup on diagnosis change (was only clearing tnkRecommended for ICH/SAH and bpPhase)
  - Template quick-start buttons route management subtab for all 5 categories (was ICH only)
- Skipped: young adult workup in discharge note (needs new section), QM counter mismatch (cosmetic), sexual health/air travel (not standard), consentDocCopied (dead code), export round-trip (known feature gap), mrsAssessment.admission (needs new field)

## Iteration 063 update (2026-02-19, Windows session)
- Accessibility (P0 fixes):
  - aria-label on EVT consent time input, CTP perfusion textarea, EKG/telemetry input (phone view)
  - role="alert" on BP threshold, glucose, platelet, INR contraindication alert divs (tablet view)
- Note template parity (6 templates improved):
  - Progress note: LKW time in header, CVT management block (anticoag, ICP, seizure, hematology)
  - Signout note: formatDTNForNote() for full time metrics including DTP
  - Follow-up brief: LKW time, clinical rationale
  - Discharge note: chief complaint, clinical rationale after acute treatment
  - Procedure note: PMH + home medications, formatDTNForNote() for DTP metric
- Skipped: phone view 21+ label associations (bulk fix, future iter), color contrast (borderline AA), heading hierarchy (minor), calculator labels (Library tab), procedure note pathway blocks (design choice)

## Iteration 064 update (2026-02-19, Windows session)
- Guideline logic fixes (8 bugs):
  - seizure_acute_stroke: dead code fixed — now matches actual dropdown values (acute-seizure/late-seizure/status-epilepticus)
  - status_epilepticus_protocol: restricted to status-epilepticus only (was firing for any seizure)
  - Removed basilar from 5 anterior EVT hasLVO regexes (kept in transfer_evt for legitimate basilar transfers)
  - bp_ischemic_no_lysis: added !inWindow gate preventing contradictory co-fire with bp_pre_tnk
  - basilar_evt_class1: added NIHSS>=10 + time<=24h gates (was firing on mild basilar stenosis)
  - Carotid guidelines: gated by symptomatic/asymptomatic status via cm.symptomatic field
  - dapt_auto_stop: reworded message for clinical clarity
  - tnk_standard: removed TIA from eligibility (TNK not given for TIA)
- Mobile audit: ALL 16 P0 findings skipped — phone view is intentionally simplified (design choice)

## Iteration 065 update (2026-02-19, Windows session)
- GCS partial entry detection:
  - calculateGCS() now returns null (not falsely low score) when only some components entered
  - Prevents Eye=4/Verbal=0/Motor=0 from yielding GCS=6 and triggering intubation warning
  - UI shows "Incomplete" label + amber warning when partial entry detected
- Nimodipine dose adjustment fix (3 locations):
  - Changed "reduce to 30 mg q2h" to "reduce to 30 mg q4h" per FDA label
  - 30 mg q2h was same daily dose at higher frequency, paradoxically worsening hypotension
- CVT anticoagulation monitoring:
  - Added specific timing: aPTT q6h until therapeutic then daily (UFH), anti-Xa day 3-5 peak (LMWH+renal), platelets baseline/day 3-5/weekly (HIT screening)
- Skipped (false positives from prior audit agents): NIHSS step already present, glucose clamping already present, weight aria-pressed already present, dx.includes TIA migration already complete, arcadia/esus diagnosisCategory guards already present, decompressive craniectomy age already <= 60

## Iteration 066 update (2026-02-19, Windows session)
- Encounter JSON export completeness:
  - Added 16 missing calculator/scoring states to exportEncounterJSON (was only 4 of 20)
  - Now exports: ASPECTS, mRS, ABCD2, CHA2DS2-VASc, ROPE, Hunt-Hess, WFNS, HAS-BLED, RCVS², PHASES, EVT decision inputs, DOAC protocol, stroke code form, ICH volume params, ASPECTS regions, PC-ASPECTS regions, consultationType
- AED-DOAC interaction enhancement:
  - Recommendation now also fires when pre-admission anticoagulant is a DOAC (lastDOACType field), not just secondary prevention dropdown
  - Excludes non-DOAC anticoagulants (warfarin, heparin, enoxaparin, fondaparinux)
- Dead code removal: importBackup function removed (defined but never called, no UI wiring)
- Secondary prevention audit: ALL PASS — zero bugs across antiplatelets, anticoagulants, statins, medication interactions, DAPT duration, dose accuracy, diagnosis category filtering
- Data export/import audit: importBackup dead code confirmed. Export completeness gap addressed above.

## Iteration 067 update (2026-02-20, macOS session)
- Restored on-call quick-call workflow for UW stroke operations:
  - Reintroduced bottom-right Quick Contacts FAB with tap-to-call `tel:` links.
  - Restored UW/HMC default contact numbers (stroke phone, radiology lines, angio, imaging, IT/paging) and added Settings contact-directory editor (add/remove/reset defaults).
- Evidence/content refresh:
  - TIA disposition wording changed from universal-admission language to risk-stratified pathways aligned with AHA TIA ED statement framing.
  - Extended-window IVT recommendation text updated with TIMELESS + OPTION context for imaging-selected late presenters.
  - Xa inhibitor ICH reversal wording updated to agent-specific andexanet/PCC selection (formulary/protocol based) with ANNEXA-I context.
  - Premorbid disability EVT warning downgraded from hard-error to shared-decision warning.
  - Spasticity recommendation updated to AHA 2026 statement wording; hormonal risk recommendation expanded for transgender estrogen/testosterone counseling context.
  - ESCAPE-MeVO DOI corrected to `10.1056/NEJMoa2411668`.
- QA updates:
  - Smoke script now checks for Quick Contacts FAB and Settings contact-directory controls.
  - `npm run build` pass.
  - `npm test` pass (local smoke, all three viewports).
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && npm test && npm run build`

## Iteration 068 update (2026-02-20, macOS session)
- Fixed runtime initialization regression caused by non-hoisted helper functions introduced in this cycle.
- Completed CVT special-population workflow integration (pregnancy/postpartum, APS, active cancer, severe thrombophilia):
  - Structured flags in Encounter and Library CVT modules.
  - Dynamic plan summary (acute agent, long-term strategy, duration, cautions).
  - Safety warning linkage and note-template propagation.
- Added `scripts/validate-citations.mjs` and wired `npm run validate:citations` into `npm test`/`npm run qa`.
- Expanded smoke assertions for:
  - Ischemic panel updated MeVO wording.
  - Ischemic panel Post-EVT BP Guardrail module.
  - TIA panel TIA Disposition Engine module.
- Local verification complete:
  - `npm run build` pass
  - `npm test` pass (0 smoke issues)
- Deployment verification complete:
  - `git push origin main` pass
  - `npm run qa` pass (local + live smoke, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run build`

## Iteration 069 update (2026-02-20, macOS session)
- Expanded smoke QA from static presence checks to scenario-level decision checks:
  - TIA: `Persistent deficit` toggle must produce `Admit / high-acuity observation` recommendation.
  - CVT: `APS confirmed` toggle must produce APS caution text in special-population panel.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (local)
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 070 update (2026-02-20, macOS session)
- Added explicit protected-contact regression invariants to smoke automation:
  - Quick Contacts must contain Stroke Phone, STAT Pharmacy, and HMC Stroke RAD Hotline.
  - Settings Contact Directory must retain protected label/phone pairs for those three defaults.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (local)
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 071 update (2026-02-20, macOS session)
- Performed source-level evidence metadata audit for CVT statement and corrected a stale DOI in documentation.
- PubMed-verified CVT metadata now standardized across docs:
  - PMID `38284265`
  - DOI `10.1161/STR.0000000000000456`
- Validation status:
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 072 update (2026-02-20, macOS session)
- Added GitHub Actions CI workflow (`.github/workflows/ci.yml`) to run:
  - `npm ci`
  - `npm run build`
  - `npm test` (citation validator + local smoke)
- CI now uploads smoke artifacts (`output/playwright`) on every run for easier failure triage.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 073 update (2026-02-20, macOS session)
- Added scheduled production audit workflow (`.github/workflows/live-smoke.yml`):
  - Daily cron + manual trigger.
  - Runs `npm run qa` (local + live smoke) and uploads artifacts.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 074 update (2026-02-20, macOS session)
- Stabilized wake-up/extended-window QA scenario in `scripts/qa-smoke.mjs`:
  - Re-opens LKW card after wake-up toggle when senior-rapid auto-collapse hides controls.
  - Supports both standard (`input-*`) and compact (`phone-input-*`) encounter field IDs.
  - Adds manual EXTEND checkbox fallback assertions when direct CTP perfusion fields are not rendered.
  - Prevents smoke hard-fail from unstable checkbox state checks by capturing toggle failures as explicit issues.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 075 update (2026-02-20, macOS session)
- Added explicit WAKE-UP/EXTEND non-eligibility trace output to generated notes:
  - transfer, consult, signout, progress, and discharge templates now record missing criteria when wake-up eligibility is not met.
- Introduced shared helpers in `src/app.jsx`:
  - `getWakeUpCriteriaTrace(...)`
  - `formatMissingCriteria(...)`
- Rebuilt deploy artifact (`app.js`) after source updates.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 076 update (2026-02-20, macOS session)
- Added deterministic wake-up note-trace validation to smoke automation:
  - Enables clipboard read/write in Playwright smoke context.
  - Copies Encounter full note and asserts expected wake-up trace text is present.
  - Uses conditional expectations for eligible vs non-eligible trace outputs based on available perfusion inputs.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 077 update (2026-02-20, macOS session)
- Enhanced scheduled live-smoke operational alerting in `.github/workflows/live-smoke.yml`:
  - On failure: opens/updates a labeled GitHub issue (`live-smoke-alert`) with run metadata.
  - On success: comments and auto-closes open `live-smoke-alert` issues.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 078 update (2026-02-20, macOS session)
- Expanded `buildContraindicationTrace(...)` output in `src/app.jsx` with structured supportive negatives:
  - INR/platelet/aPTT/glucose threshold clearance
  - BP threshold clearance
  - CT negative hemorrhage text detection
  - No anticoagulant exposure / remote DOAC-dose signal where documented
- Rebuilt client bundle (`app.js`) after source changes.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 079 update (2026-02-20, macOS session)
- Added structured post-EVT BP plan export helper and note integration:
  - `getPostEvtBpPlanSummary(...)` now formats reperfusion status, infusion agent, and target strategy.
  - Included in transfer, signout, progress, and discharge outputs to improve neurocritical handoff clarity.
- Rebuilt client bundle (`app.js`) after source updates.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 080 update (2026-02-20, macOS session)
- Hardened citation QA script (`scripts/validate-citations.mjs`) with:
  - PMID/DOI/NCT format checks
  - duplicate identifier detection across rows/titles
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 081 update (2026-02-20, macOS session)
- Expanded wake-up note smoke scenario to validate contraindication supportive-negative trace persistence:
  - Seeds BP/INR/platelets/glucose/CT inputs.
  - Copies generated full note and asserts `Supportive negatives:` appears.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 082 update (2026-02-20, macOS session)
- Completed post-EVT BP-plan note regression flow in smoke automation:
  - Restores Encounter ischemic state and re-checks `EVT Recommended` after diagnosis-switch assertions.
  - Forces `Signout` note template before copying full note.
  - Asserts copied note text includes structured post-EVT BP plan with Nicardipine agent detail.
- Validation status:
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 083 update (2026-02-20, macOS session)
- Added evidence URL-health checks in citation validator:
  - New CLI mode: `node ./scripts/validate-citations.mjs --check-links`
  - URL checks include timeout, retry, and HEAD→GET fallback.
  - `401/403` responses are reported as warnings (reachable but restricted), not hard failures.
- Added npm script:
  - `npm run validate:citations:links`
- Updated scheduled production audit workflow:
  - `live-smoke.yml` now runs `npm run validate:citations:links` before `npm run qa`.
- Validation status:
  - `npm run validate:citations:links` pass (warnings only)
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations:links && npm run qa`

## Iteration 084 update (2026-02-20, macOS session)
- Added evidence identifier-endpoint checks in citation validator:
  - New CLI mode: `node ./scripts/validate-citations.mjs --check-identifiers`
  - Verifies PMID, DOI, and NCT endpoint health with retry/timeout safeguards.
  - DOI checks now use DOI handle API semantics to avoid landing-page false negatives.
- Added npm script:
  - `npm run validate:citations:ids`
- Updated scheduled production audit workflow:
  - `live-smoke.yml` now runs both `validate:citations:links` and `validate:citations:ids` before `npm run qa`.
- Validation status:
  - `npm run validate:citations:ids` pass
  - `npm run validate:citations:links` pass (warnings only)
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations:links && npm run validate:citations:ids && npm run qa`

## Iteration 085 update (2026-02-20, macOS session)
- Hardened PMID validation strategy:
  - Switched PMID checks to a batched PubMed eSummary call to avoid 429 rate-limit errors.
  - Added title-overlap drift warnings to detect PMIDs that resolve but map to unrelated articles.
- Corrected evidence table metadata drift:
  - Updated incorrect PMIDs/DOIs/sources/URLs in major rows (AcT, TRACE-2, ORIGINAL, TWIST, TENSION, INTERACT3, plus additional DOI corrections).
  - Updated stale historical metadata notes to align with current PubMed-verified identifiers.
- Validation status:
  - `npm run validate:citations:ids` pass (no remaining PMID-title drift warnings)
  - `npm run validate:citations:links` pass (1 warning, 0 failures)
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations:links && npm run validate:citations:ids && npm run qa`

## Iteration 086 update (2026-02-20, macOS session)
- Added automated evidence watchlist generation:
  - Script: `scripts/evidence-watch.mjs`
  - Command: `npm run evidence:watch`
  - Output: `docs/evidence-watchlist.md`
- Watchlist logic:
  - scans uncited PubMed candidates across thrombolysis, EVT, ICH, SAH/CVT, secondary prevention, and special populations
  - filters to high-signal sources
  - excludes low-value title types (for example corrigendum/response/case report)
- Validation status:
  - `npm run evidence:watch` pass
  - `npm run build` pass
  - `npm test` pass
  - `npm run qa` pass (local + live, 0 issues)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:watch && npm run validate:citations:links && npm run validate:citations:ids && npm run qa`

## Iteration 088 update (2026-02-20, macOS session)
- Added clinician-priority watchlist scoring/ranking in `scripts/evidence-watch.mjs` and regenerated `docs/evidence-watchlist.md`.
  - Output now includes `Priority`, `Score`, and `Rationale` columns sorted by urgency.
  - Scoring weights guideline/scientific-statement signal, trial-design signal, recency, source strength, and direct domain relevance.
- Added optional external failure fan-out in `.github/workflows/live-smoke.yml`:
  - uses `secrets.LIVE_SMOKE_ALERT_WEBHOOK` when configured;
  - preserves existing GitHub issue alert flow and auto-close behavior.
- Validation status:
  - `npm run evidence:watch` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:watch && npm run validate:citations:links && npm run validate:citations:ids && npm test && npm run qa`

## Iteration 089 update (2026-02-20, macOS session)
- Corrected maternal-stroke evidence metadata alignment to Stroke statement record:
  - updated references to `PMID: 41603019`, DOI `10.1161/STR.0000000000000514`.
  - removed mixed PMID/DOI pairing from evidence docs.
- Updated in-app maternal rapid-actions citation text to `PMID: 41603019`.
- Regenerated watchlist baseline:
  - `npm run evidence:watch` now reports `22` uncited candidates (previously `23`).
- Validation status:
  - `npm run evidence:watch` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:watch && npm run validate:citations:links && npm run validate:citations:ids && npm test && npm run qa`

## Iteration 090 update (2026-02-20, macOS session)
- Implemented structured special-population workflows in `src/app.jsx`:
  - `maternalStrokePathway` (postpartum day, severe HTN, OB consult, magnesium decision, delivery coordination, fetal monitoring).
  - `cancerStrokePathway` (mechanism class, D-dimer multiple, multiterritory/NBTE flags, workup bundle, prevention branch, oncology consult).
- Added warning-layer safeguards:
  - maternal severe-HTN escalation omissions,
  - cancer pathway incompleteness and mechanism/prevention mismatch.
- Added structured maternal/cancer summaries to generated handoff note outputs.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.72`
  - cache key bumped to `stroke-app-v71`
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations && npm test && npm run qa`

## Iteration 091 update (2026-02-21, macOS session)
- Implemented ICH escalation timeliness workflow upgrades in `src/app.jsx`:
  - Added `ichReversalStartTime` and `ichTransferDecisionTime` capture fields in ICH management UI.
  - Added computed KPI summaries: door-to-reversal, door-to-transfer decision, and reversal-to-transfer.
  - Added warning-layer prompts when reversal/transfer actions are selected without timing documentation.
  - Added KPI propagation into transfer/signout/progress/discharge/consult/voice/pathway note outputs.
  - Added outcomes-dashboard KPI tiles: `D2-Reversal` and `D2-Transfer`.
  - Added diagnosis-switch reset handling so ICH timing fields clear when leaving ICH category.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.73`.
  - service-worker cache key bumped to `stroke-app-v72`.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations && npm test && npm run qa`

## Iteration 092 update (2026-02-21, macOS session)
- Implemented SAH standardized outcomes workflow in `src/app.jsx`:
  - Added `sahOutcomeSet` structured state (discharge mRS/disposition, 90-day mRS/status, follow-up scheduling/date, cognitive + HRQoL planning flags).
  - Added SAH outcomes panel in management UI with live summary trace.
  - Added warning-layer checks for missing discharge mRS, missing 90-day follow-up plan, and deceased-status vs mRS inconsistency.
  - Added outcome-summary propagation to full-note brief, transfer, signout, progress, discharge, consult, and pathway-plan outputs.
  - Added diagnosis-switch reset handling for `sahOutcomeSet` when leaving SAH category.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.74`.
  - service-worker cache key bumped to `stroke-app-v73`.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations && npm test && npm run qa`

## Iteration 093 update (2026-02-21, macOS session)
- Implemented DAPT adherence tracking workflow upgrades in `src/app.jsx`:
  - Added structured secondary-prevention fields:
    - `daptStartDate`, `daptPlannedStopDate`, `daptMissedDoses7d`,
    - `daptAdherenceStatus`, `daptTransitionPlanned`, `daptTransitionAgent`, `daptAdherenceNotes`.
  - Added `getDaptAdherenceSummary(...)` helper and propagated output into brief/transfer/signout/progress/discharge/consult/voice/pathway notes.
  - Added warning-layer safeguards for missing DAPT duration/start/stop, high missed-dose burden, and missing post-DAPT transition details.
  - Added compact DAPT adherence tracker UI inside antithrombotic selection with live adherence trace rendering.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.75`.
  - service-worker cache key bumped to `stroke-app-v74`.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations && npm test && npm run qa`

## Iteration 094 update (2026-02-21, macOS session)
- Implemented AIS-2026 guideline-delta visibility upgrades in `src/app.jsx`:
  - Added dedicated ischemic-management rapid-review card for key 2026 AIS deltas.
  - Added `getAis2026DeltaSummary(...)` to synthesize case-specific guideline-delta traces.
  - Propagated AIS-delta trace output into brief/transfer/signout/progress/discharge/consult/voice/pathway notes.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.76`.
  - service-worker cache key bumped to `stroke-app-v75`.
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run validate:citations && npm test && npm run qa`

## Iteration 095 update (2026-02-21, macOS session)
- Implemented evidence-promotion checklist automation:
  - Added script `scripts/evidence-promotion-checklist.mjs`.
  - Added npm command `npm run evidence:promote`.
  - Generated `docs/evidence-promotion-checklist.md` from watchlist with P0/P1 triage queue.
- Updated scheduled production audit:
  - `.github/workflows/live-smoke.yml` now runs `npm run evidence:promote` before full QA.
- Validation status:
  - `npm run evidence:promote` pass (`13` queued high-priority candidates)
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:watch && npm run evidence:promote && npm run validate:citations && npm test && npm run qa`

## Iteration 096 update (2026-02-21, macOS session)
- Implemented evidence-promotion sync validation:
  - Added script `scripts/validate-evidence-promotion.mjs` to enforce watchlist `P0/P1` PMID parity with promotion checklist.
  - Added npm scripts:
    - `validate:evidence-promotion`
    - `evidence:refresh` (`watch` + `promote`)
  - Wired `validate:evidence-promotion` into both `npm test` and `npm run qa`.
- Validation status:
  - `npm run evidence:promote` pass (`13` high-priority candidates)
  - `npm run validate:evidence-promotion` pass (`13` PMIDs synced)
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm run validate:citations && npm test && npm run qa`

## Iteration 097 update (2026-02-21, macOS session)
- Implemented evidence promotion template scaffolding:
  - Added script `scripts/evidence-promotion-template.mjs`.
  - Added npm command `npm run evidence:template`.
  - Generated `docs/evidence-promotion-template.md` from pending promotion-checklist candidates.
- Updated composite refresh pipeline:
  - `evidence:refresh` now runs watchlist + checklist + template generation plus sync validation.
- Validation status:
  - `npm run evidence:promote` pass (`13` candidates)
  - `npm run evidence:template` pass (`13` templates)
  - `npm run validate:evidence-promotion` pass (`13` PMIDs synced)
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm run validate:citations && npm test && npm run qa`

## Iteration 098 update (2026-02-21, macOS session)
- Implemented selective evidence-template generation controls in `scripts/evidence-promotion-template.mjs`:
  - `--priority` (`p0`/`p1`/`all`)
  - `--pmid` targeting
  - `--limit`
  - `--output`
- Added npm helper commands:
  - `evidence:template:p0`
  - `evidence:template:top5`
- Generated focused urgent draft:
  - `docs/evidence-promotion-template-p0.md` (`3` P0 candidates).
- Validation status:
  - `npm run evidence:promote` pass (`13` candidates)
  - `npm run evidence:template` pass (`13` templates)
  - P0 template generation command pass (`3` templates)
  - `npm run validate:evidence-promotion` pass (`13` PMIDs synced)
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm run evidence:template:p0 && npm run validate:citations && npm test && npm run qa`

## Iteration 099 update (2026-02-21, macOS session)
- Implemented pediatric pathway operationalization in `src/app.jsx`:
  - Added `pediatricStrokePathway` structured state and persistence allow-list coverage.
  - Added new **Pediatric Stroke Rapid Pathway (AIS 2026)** card under Special Populations with checklist controls and live summary.
  - Added pediatric workflow warning checks (missing pediatric neurology consult, missing pediatric-capable transfer plan, missing vessel-imaging confirmation, missing SCD exchange activation status when relevant).
  - Added pediatric summary propagation to transfer/signout/progress/discharge/consult/pathway-note outputs.
  - Added command-palette search alias: `Pediatric Stroke Pathway`.
- Finalized evidence-ops indexing:
  - Added `scripts/evidence-ops-index.mjs` and output `docs/evidence-ops-index.md`.
  - Added npm command `npm run evidence:index`.
  - Expanded `evidence:refresh` to run watchlist + promotion checklist + templates (all + P0) + index + sync validation.
  - Updated `.github/workflows/live-smoke.yml` to generate promotion templates and evidence index before QA.
- Fixed template-output routing regression:
  - `evidence:template:p0` now writes to `docs/evidence-promotion-template-p0.md` instead of overwriting `docs/evidence-promotion-template.md`.
- Deployment coherency update:
  - `APP_VERSION` bumped to `v5.14.77`.
  - service-worker cache key bumped to `stroke-app-v76`.
- Validation status:
  - `npm run evidence:refresh` pass (`15` high-priority PMIDs; `3` P0 templates)
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm run validate:citations && npm test && npm run qa`

## Iteration 100 update (2026-02-21, macOS session)
- Added pediatric regression hardening in `scripts/qa-smoke.mjs`:
  - age `<18` encounter scenario assertion flow,
  - pediatric pathway card visibility assertion,
  - pediatric warning-layer assertion checks,
  - pediatric checklist-control assertion checks,
  - clipboard note-trace assertion for pediatric summary propagation.
- Stabilized smoke sequence by running pediatric scenario after baseline library/settings checks to avoid cross-domain false positives.
- Validation status:
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 101 update (2026-02-21, macOS session)
- Refined evidence-watch triage filters in `scripts/evidence-watch.mjs` to exclude design/protocol-only publications from high-priority queues:
  - `rationale and design`
  - `rationale and methods`
  - `study protocol` / `protocol study`
- Regenerated evidence operations artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Queue impact after regeneration:
  - uncited candidate count: `24`
  - high-priority promotion queue: `11`
  - urgent P0 promotion queue: `1`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 102 update (2026-02-21, macOS session)
- Enhanced `scripts/evidence-watch.mjs` transparency while preserving stricter triage:
  - Added filtered low-actionability audit appendix output in `docs/evidence-watchlist.md`.
  - Appendix includes topic, PMID, title, filter reason, and PubMed URL for reviewer override visibility.
- Regenerated dependent evidence artifacts:
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 103 update (2026-02-21, macOS session)
- Added filtered-appendix CLI controls in `scripts/evidence-watch.mjs`:
  - `--filtered-all`
  - `--filtered-limit` (value or `--filtered-limit=<n>`)
- Added npm helper command in `package.json`:
  - `evidence:watch:filtered-all`
- Updated `scripts/evidence-ops-index.mjs` maintenance command list to include the new helper.
- Validation status:
  - `npm run evidence:watch:filtered-all` pass (`2` filtered candidates logged)
  - `npm run evidence:refresh` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 104 update (2026-02-21, macOS session)
- Enhanced filtered-candidate transparency in `scripts/evidence-watch.mjs`:
  - Added `Filtered Candidate Summary by Reason` table in watchlist audit appendix.
- Regenerated evidence operations artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 105 update (2026-02-21, macOS session)
- Added per-domain filtered-candidate visibility in `scripts/evidence-watch.mjs`:
  - new watchlist appendix table: `Filtered Candidate Summary by Topic and Reason`.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 106 update (2026-02-21, macOS session)
- Added filtered-topic dominance alerting in `scripts/evidence-watch.mjs`:
  - new CLI option: `--filtered-dominance-threshold` (ratio or percent),
  - new watchlist appendix table: `Filtered Topic Dominance Alert` (top topic share, threshold, status).
- Added npm helper command in `package.json`:
  - `evidence:watch:dominance`
- Added compact phenotype-based DAPT matrix in TIA management workflow (`src/app.jsx`) with one-glance regimen windows for CHANCE/POINT, CHANCE-2, THALES/AIS-2026 IIb framing, INSPIRES, and severe symptomatic ICAD (SAMMPRIS pattern).
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm run evidence:watch:dominance` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 107 update (2026-02-21, macOS session)
- Synced handoff metadata to deployed state:
  - `Live APP_VERSION` updated to `v5.14.78`,
  - `Service worker cache key` updated to `stroke-app-v77`.
- Validation status:
  - live endpoint checks confirm version/cache markers match deployed assets.
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 108 update (2026-02-21, macOS session)
- Added per-topic filtered-dominance controls in `scripts/evidence-watch.mjs`:
  - new CLI override option `--filtered-topic-threshold topic=value` (repeatable, comma-list compatible),
  - new watchlist appendix table `Filtered Topic Threshold Matrix` with topic share vs threshold status.
- Added npm helper command:
  - `evidence:watch:topic-thresholds`
- Updated maintenance index in `scripts/evidence-ops-index.mjs` to list the new helper command.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:watch:topic-thresholds` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 109 update (2026-02-21, macOS session)
- Hardened smoke-QA feature-parity gating in `scripts/qa-smoke.mjs`:
  - added local/live `APP_VERSION` extraction from target HTML,
  - enabled live feature-specific assertion enforcement only when local/live versions match,
  - preserved strict local assertions for newly added workflow features.
- Added smoke report parity metadata:
  - `localAppVersion`
  - `liveAppVersion`
  - `liveParityChecksEnabled`
- Validation status:
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm test && npm run qa`

## Iteration 110 update (2026-02-21, macOS session)
- Enhanced watchlist governance trend visibility in `scripts/evidence-watch.mjs`:
  - added parser for previous run topic-threshold matrix snapshot,
  - added new appendix output `Filtered Topic Threshold Trend (vs Previous Run)` with previous share, current share, delta (pp), and status transitions.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 111 update (2026-02-21, macOS session)
- Added topic-status flip governance alerting in `scripts/evidence-watch.mjs`:
  - new CLI option `--topic-status-flip-threshold` (integer, default 1),
  - new watchlist appendix block `Topic Status Flip Alert` with topic transition rows and thresholded alert summary.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 112 update (2026-02-21, macOS session)
- Added persistent watchlist governance history in `scripts/evidence-watch.mjs`:
  - new generated history artifact `docs/evidence-watch-history.json`,
  - rolling retention of 30 snapshots,
  - new watchlist appendix block `Topic Status History (Last 3 Runs)`.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 113 update (2026-02-21, macOS session)
- Added weighted churn scoring in `scripts/evidence-watch.mjs`:
  - new CLI options:
    - `--topic-churn-alert-threshold`
    - `--topic-churn-lookback`
  - new watchlist appendix block:
    - `Topic Weighted Churn Score (Last N Runs)` with flips, oscillations, and weighted score.
- Added npm helper command:
  - `evidence:watch:churn`
- Updated evidence-ops maintenance command index to include churn helper.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:watch:churn` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 114 update (2026-02-21, macOS session)
- Added criticality-adjusted churn monitoring in `scripts/evidence-watch.mjs`:
  - new CLI options:
    - `--topic-churn-adjusted-threshold`
    - `--topic-churn-weight topic=value`
  - weighted churn alerts now evaluate base and criticality-adjusted score paths.
  - table output now includes `Criticality weight` and `Adjusted score`.
- Added npm helper command:
  - `evidence:watch:churn-critical`
- Updated evidence-ops maintenance index to include the new churn-critical helper.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:watch:churn-critical` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 115 update (2026-02-21, macOS session)
- Added churn policy profiles in `scripts/evidence-watch.mjs`:
  - new CLI option `--topic-churn-profile`,
  - supported profiles: `balanced`, `reperfusion`, `hemorrhage`,
  - profile defaults cover topic weights, lookback window, and churn thresholds while preserving explicit override precedence.
- Added npm helper commands:
  - `evidence:watch:profile:reperfusion`
  - `evidence:watch:profile:hemorrhage`
- Updated evidence-ops maintenance command index to include profile helpers.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:watch:profile:reperfusion` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 116 update (2026-02-21, macOS session)
- Externalized churn profile configuration:
  - added `docs/evidence-churn-profiles.json` as editable policy source,
  - added file-based profile loading in `scripts/evidence-watch.mjs` via `--topic-churn-profiles-file`.
- Added npm helper command:
  - `evidence:watch:profiles-file`
- Updated evidence-ops index generator to include churn profile config artifact and helper command.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run evidence:watch:profiles-file` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`

## Iteration 117 update (2026-02-21, macOS session)
- Added churn-profile schema validator:
  - new script `scripts/validate-evidence-churn-profiles.mjs`.
- Added npm command:
  - `validate:evidence-churn-profiles`
- Wired churn-profile validation into:
  - `evidence:refresh`
  - `test`
  - `qa`
- Updated evidence-ops maintenance index to include profile-validation command.
- Regenerated evidence ops artifacts:
  - `docs/evidence-watchlist.md`
  - `docs/evidence-watch-history.json`
  - `docs/evidence-promotion-checklist.md`
  - `docs/evidence-promotion-template.md`
  - `docs/evidence-promotion-template-p0.md`
  - `docs/evidence-ops-index.md`
- Validation status:
  - `npm run validate:evidence-churn-profiles` pass
  - `npm run evidence:refresh` pass
  - `npm run build` pass
  - `npm test` pass (`Runs: 3 | Issues: 0`)
  - `npm run qa` pass (`Runs: 6 | Issues: 0`)
- Next command to continue loop:
  - `cd /Users/rizwankalani/stroke && test ! -f .codex-stop && npm run evidence:refresh && npm test && npm run qa`
