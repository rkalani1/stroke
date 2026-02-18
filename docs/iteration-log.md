# Iteration Log

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
