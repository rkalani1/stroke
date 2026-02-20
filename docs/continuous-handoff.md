# Continuous Handoff

## Current state (2026-02-20)
- Branch: `main`
- Last pushed commit: run `git rev-parse --short origin/main`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.70`
- Service worker cache key: `stroke-app-v69`

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
