# Encounter fixes — independent end-to-end review of the 7.9.0 candidate (unit: encounter-fixes, 2026-10-22)

An independent reviewer drove the built 7.9.0 candidate (pinned at `818ab9b`) end to end and reported 11 findings. This unit reproduced each finding, fixed the genuine ones and added regression tests. It worked on the integrated candidate `8af8c59`, which matches `818ab9b` on every code path involved. Synthetic data only.

The Protocols tab is unchanged. `protocolEncounter`, `evaluateVideoTreatment` and the other hashed projection functions were not edited. The source lock passes, and the rendered lock passes at desktop and phone width. One cross-surface divergence remains and needs an owner decision (finding 2, §6).

## 1. Scope inventory

**Input:** `findings-encounter.json`, `e2e[0].findings` (2 high, 5 medium, 4 low), with the reviewer's Playwright scripts.

**How each finding was reproduced:**
- `npm run build` of this tree before any change, served on 127.0.0.1:4411.
- Each reviewer script re-run unmodified (only the base URL and output folder redirected): headless Chromium, America/Los_Angeles, en-US, fixed clock, service workers blocked, 390×844 and/or 1366×900 as each script sets.
- After the fixes, the same scripts were run on a build served on 127.0.0.1:4413.
- The reviewer's full scenario sweep was run on both builds: 9 journeys × 2 widths × 8 note formats.

**Edited:**
- `src/app.jsx`: reset remount and focus.
- `src/Encounter.jsx`
- `src/components/CaseBar.jsx`
- `src/workspace-state.js`: note generation and the new `treatmentContext`. `protocolEncounter`, `encounterNihss`, `encounterTiming`, `encounterVolume` and `protocolVolumeEstimate` are untouched.
- `src/encounter-timeline.js`
- `src/encounter-details.js`
- `src/encounter-clinical-review.js`: additive only (one medication signal and the `contradictedAsYes` helper). `evaluateVideoTreatment` and the existing signals are unchanged.
- `src/clinical/wake-up-documentation.js`

**Not edited:** every locked file, the Protocols surface and the snapshots.

## 2. Findings

| # | Severity | Finding | Reproduced on base | Genuine | Status |
|---|---|---|---|---|---|
| 1 | High | Recorded IVT, EVT times, mTICI and post-treatment observations vanished from every note, from the case bar and from Section 4 after the working diagnosis changed (mimic, TIA, other, ICH) or the context changed to follow-up | Yes, all 4 diagnoses and follow-up (390 px here; the reviewer saw both widths) | Yes | Fixed |
| 2 | High | A checklist "No" contradicted by an entered value (infective endocarditis care context) left the Encounter IVT screen affirmative and the case-bar dose showing | Yes. The screen read "Known-onset standard-window screen…" and the case bar showed "TNK 21 mg 4.2 mL" | Yes | Fixed in Encounter and the case bar. Protocols divergence left for the owner (§6) |
| 3 | Medium | New encounter left partly typed native inputs (`10/20/yyyy`, `11:--`, `1e`). Typing only the year for the next patient produced `2026-10-20` | Yes | Yes | Fixed |
| 4 | Medium | ICH reversal status "Planned" next to a recorded reversal administration time, with no reconcile flag | Yes (handoff and transfer) | Yes | Fixed in notes and the UI |
| 5 | Medium | Wake-up MRI export printed an explicit No as "not documented" | Yes | Yes | Fixed |
| 6 | Medium | A post-treatment review naming IVT and EVT, a reperfusion time and an mTICI were printed without a recorded administration or puncture, and nothing flagged it | Yes | Yes | Fixed in notes and Section 4 |
| 7 | Medium | The wake-up / EXTEND screen in a note changed its conclusion with the time the note was written | Yes: not applicable at 14:00, "met" at 18:30, "not met" at 22:30 | Yes | Fixed |
| 8 | Low | "Mark unanswered as No" answered "Antiplatelet therapy" No while the medication record named aspirin and clopidogrel | Yes | Yes (inconsistent with the ACE-inhibitor rule) | Fixed |
| 9 | Low | Case bar showed "TNK given … 30 mg" with no flag, while the note said "above the 25 mg maximum" | Yes | Yes | Fixed |
| 10 | Low | The copy-blocked alert did not name a flagged main-note field such as the HPI | Yes | Yes | Fixed (field named, no focus link) |
| 11 | Low | After More › Start new encounter, focus was on `<body>` | Yes (390 and 1366) | Yes | Fixed together with finding 3 |

## 3. Changes and reasons

### Finding 1: recorded treatment is never hidden; it is printed and flagged

**Principle.** CONTRIBUTING says context changes invalidate *incompatible outputs*. Screens, eligibility, dose arithmetic, vessel and perfusion selection are derived outputs, and they stay limited to acute ischemic stroke. A recorded administration, puncture or reperfusion time, an mTICI grade and post-treatment observations are facts about care already given. Hiding them can lose a thrombolysed mimic, a post-lytic ICH or a resolved deficit relabelled TIA. They are now printed whatever the working diagnosis or context.

**What counts as recorded treatment.** `treatmentRecorded` (`encounter-timeline.js`) is true for any of:
- the administration checkbox;
- an IVT, puncture or reperfusion time;
- an mTICI grade;
- a post-treatment review selection.

Nothing is inferred. A mimic with only a "Recommended" decision prints no treatment line (tested).

**Notes, every format.** Outside acute ischemic stroke, `buildConsultationSummary` prints the same treatment block: IVT administration (dose, pre-IVT BP and its existing flags), EVT puncture and reperfusion, mTICI, and IVT/EVT discussion and consent. It adds one line, for example:
- `Recorded reperfusion treatment: [working diagnosis Stroke mimic, not acute ischemic stroke; reconcile]`
- `… [follow-up / review context, not acute ischemic stroke; reconcile]`

The team handoff carries that label. The "Post-reperfusion observations & procedure" group and the pre-IVT BP fields follow the same rule, so the observations print in every format. The checklist, decisions, wake-up screen and vessel lines stay acute-ischemic only.

**Section 4.** The IVT/EVT action controls, the EVT consent record, the mTICI field and the post-reperfusion group stay reachable while a treatment is recorded. A caution says: "Recorded reperfusion treatment: <reason>. It stays in every note and the case bar; reconcile."

**Case bar.** The bar keeps "TNK given HH:MM", the next neuro-check pill, the Post-lytic bleed and Angioedema links, and the BP targets link after an administration is recorded.
- In acute care the post-IVT BP flag (not below 180/105) also stays after a diagnosis change.
- For an acute ICH, the ICH SBP targets still take precedence; the post-IVT flag applies only when they do not flag.
- In follow-up context no BP flag is shown, as before for every diagnosis.

**Timeline.** In acute care, IVT, puncture and reperfusion intervals and the IVT order time follow the recorded treatment. Follow-up context still has no acute timeline.

**Reperfusion check.** The "reperfusion precedes puncture" check now applies to any recorded times.

### Finding 2: a contradicted "No" counts as "Yes" in the Encounter screen and the case-bar dose

`contradictedAsYes(note, now, details)` (`encounter-clinical-review.js`) returns the note with every "No" answer that `safetyChecklistSignals` marks as a conflict read as "Yes". It returns the same object when nothing conflicts.
- **Encounter:** builds its screen note from it before calling `evaluateVideoTreatment`.
- **Case bar:** calls the unchanged `protocolEncounter` on `{ ...state, note }`. A hold caused only by a contradiction is titled "Entered values contradict a "No" safety answer; no dose shown." and is not called "IVT card held", because the Protocols card is not held.

"Exactly as a Yes would" is literal: the overlay is the Yes state. Two cases are tested:
- **Endocarditis.** The screen text is identical to the explicit-Yes run and the dose is held.
- **Glucose 450 mg/dL answered No.** With an incomplete NIHSS, the frozen projection otherwise stays "pending" and shows a dose.

A contradicted benefit-tier item (ACE inhibitor, seizure at onset, antiplatelet) holds nothing, again exactly as Yes. The reviewer said only endocarditis was uncaught; the glucose path shows the gap was wider when earlier screen branches are incomplete.

### Findings 3 and 11: New encounter remounts the Encounter and focuses its heading

- **Remount.** `<Encounter key={epoch}>`, as Protocols and Trials already were. Native date/time/number inputs with partial entries cannot be cleared through React state, because their value is `''`.
- **Focus.** `reset()` hands the scroll memory a focus target: the Encounter `h1`, now `id="encounter-title" tabIndex={-1}` and styled by the existing `[tabindex]:focus-visible` rule. The focus effect also runs on the epoch change, so the focus lands whether reset is used from Encounter or from More on another surface.
- **Scroll.** `focusEncounterTarget` scrolls a target into view, which would move the heading about 100 px. The hand-off therefore ends with `scrollTo(0, 0)`, and the page stays at the top. Measured: `scrollY` 0 at 390 and 1280/1366 px.

### Finding 4: ICH reversal status vs. a recorded administration time

`reversalIssue` (`encounter-timeline.js`) applies to an acute ICH with a recorded reversal administration time and any status other than "Administered", including no status. It follows the existing IVT pattern.
- **Timeline line:** `ICH reversal administration: 2026-10-21 14:20 [reversal status is 'Planned'; reconcile]`. The team handoff takes this line from the timeline.
- **Encounter:** shows "ICH reversal administration time recorded; reversal status is 'Planned'; reconcile." beside the reversal status in "Diagnosis-specific review & plans".

An "Administered" status with no time is not flagged: it is incomplete rather than contradictory, and the reviewer's "or the reverse" was optional.

### Finding 5: wake-up MRI answers print yes / no / not documented

The Encounter already records the DWI, FLAIR and lesion-extent findings as Yes / No / Not assessed selects (`Truth`), so an explicit `false` is a recorded finding. The export now uses `recordedFinding`, the helper the one-third MCA line already used. The old `recordedCheck` treated `false` as an unchecked attestation and was removed.

### Finding 6: proposed vs. done for procedure and post-treatment records

`treatmentGaps(state)` (`encounter-details.js`) reports two gaps:
- the post-treatment review names IV thrombolysis with no administration recorded (checkbox, agent and time), or names EVT with no puncture time;
- a reperfusion time or mTICI is recorded without a puncture time.

Note lines:
- `Post-treatment review: After IV thrombolysis and EVT [no IVT administration or EVT puncture recorded; reconcile]`
- `EVT puncture: not documented [reperfusion time and mTICI 3 recorded; reconcile]`

Section 4 shows "Reconcile: post-treatment review recorded with no IVT administration or EVT puncture; reperfusion time and mTICI 3 recorded without an EVT puncture time." Lines with complete records are unchanged (tested).

### Finding 7: the imaging screen is evaluated at the treatment, otherwise labelled with its time

**Chosen option.** When a valid IVT administration is recorded, the wake-up / EXTEND screen in the note is evaluated at the administration time. Otherwise it is evaluated at note time. Either way it says which, for example:
- `…; evaluated at the recorded IVT administration, 2026-10-21 13:40.`
- `…; evaluated at note generation, 2026-10-21 18:30.`

**Why this is the most truthful option.**
- The source time criteria are treatment-time criteria. EXTEND randomised patients "to receive intravenous alteplase or placebo between 4.5 and 9.0 hours after the onset of stroke or on awakening with stroke (if within 9 hours from the midpoint of sleep)".
- Evaluating at the treatment answers whether the treatment met the screen, so later notes no longer drift. The reviewer's lysed-at-70-minutes patient now always reads "not applicable (known LKW within 4.5 h)".
- An untreated encounter has no decision time recorded, so the live screen is kept but labelled with its evaluation time. Silently omitting it would hide what a clinician may still act on.

**Compatibility.** The label sits after the existing text, so every existing "MRI (WAKE-UP): … met;" check (unit tests and `scripts/qa-smoke.mjs`) still matches. A direct call without a label is unchanged.

### Finding 8: an antiplatelet named in the medication record

The ACE-inhibitor rule is mirrored for "Antiplatelet therapy (single or dual)":
- Names matched: aspirin, ASA, clopidogrel/Plavix, ticagrelor/Brilinta, prasugrel/Effient, dipyridamole/Aggrenox, cilostazol/Pletal, as whole words.
- "Mark unanswered as No" now leaves that item for an individual answer.
- A No answer is listed under "Entered values conflicting with a "No" answer".

It is a benefit-tier item, so it never holds the screen or the dose.

### Finding 9: administered dose above the agent maximum

The case bar's "given" item gets a caution flag and title, and Section 4 shows "Administered dose above the 25 mg maximum; review." The limits are TNK 25 mg and alteplase 90 mg, the same values the note already uses.

### Finding 10: copy-blocked alert names main-note fields

The alert now also names these fields:
- the history and examination free-text fields;
- the rationale and the assessment;
- the three action texts (discussion details, monitoring, handoff).

The labels come from the existing field lists and a shared `TEXT_LABELS` map, so the field labels and their text are unchanged. Structured date fields are excluded, because a valid ISO date is not scanned for copy. A link that focuses the field was not added (budget). The alert names the field and the case-bar "Review N flags" still opens Documentation.

**Budget (initial and offline JS):** `npm run build`, then `check:asset-budget`, compared with `8af8c59` built the same way.

| Check | Base | Final | Delta | Headroom left |
|---|---|---|---|---|
| Initial JS (gzip) | 129,337 B | 130,536 B | +1,199 B | 536 B |
| Initial JS (raw) | 381,380 B | 384,554 B | +3,174 B | 470 B |
| All offline JS (gzip) | 259,310 B | 260,509 B | +1,199 B | 1,635 B |
| `tailwind.css` | | | 0 | |
| Service-worker precache | | | +3,174 B | |

All six budgets pass. **The raw initial budget is now the binding constraint for the lead (470 B).**

## 4. Evidence ledger

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| Post-IVT BP cue kept in acute care after the working diagnosis changes (case bar flag "Not below the post-IVT limit of 180/105") | src/components/CaseBar.jsx | flagged (existing cue, scope extended to the recorded-administration state) | AHA/ASA 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke — doi:10.1161/STR.0000000000000513, PMID 41582814 — 2026 | accessed 2026-10-22, archived transcription (`git show 4f8e99d:data/guidelines/ais-2026.json`, ais-2026-74; secondary, archive scope) | "After IVT treatment, BP is recommended to be maintained below 180/105 mmHg for at least the first 24 hours." (COR I, B-R) | The guideline population is AIS treated with IVT. A thrombolysed mimic was treated as presumed AIS; no separate target for thrombolysed mimics was identified. The flag is a monitoring cue tied to the recorded drug, not a recommendation. Acute ICH keeps its own SBP targets first; follow-up context shows no BP flag. Owner may narrow it to acute ischemic if preferred. |
| Wake-up / EXTEND screen in notes evaluated at the recorded IVT administration (else labelled with note time) | src/workspace-state.js; src/clinical/wake-up-documentation.js | corrected (evaluation instant and label; thresholds unchanged) | Ma H et al. Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset of Stroke. N Engl J Med 2019 — doi:10.1056/NEJMoa1813046, PMID 31067369 — 2019-05-09 | accessed 2026-10-22, abstract (PubMed) | "randomly assigned to receive intravenous alteplase or placebo between 4.5 and 9.0 hours after the onset of stroke or on awakening with stroke (if within 9 hours from the midpoint of sleep)" | The window is anchored to treatment. `evaluateWakeUpScreen` logic and thresholds are unchanged. |
| Same, WAKE-UP recognition-time rule (existing in-app rule: treatment within 4.5 h of symptom recognition) | src/encounter-clinical-review.js (read only) | unresolved (source passage not reachable at abstract level) | Thomalla G et al. MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset. N Engl J Med 2018 — doi:10.1056/NEJMoa1804355, PMID 29766770 — 2018-05-16; Thomalla G et al. WAKE-UP trial design. Int J Stroke 2014;9:829-36 — doi:10.1111/ijs.12011, PMID 23490032 — 2013-03-12 (e-pub) | accessed 2026-10-22, abstracts (PubMed) | "no parenchymal hyperintensity on fluid-attenuated inversion recovery (FLAIR), which indicated that the stroke had occurred approximately within the previous 4.5 hours" | Neither abstract states the recognition-to-treatment window; full text not read. The rule itself was not changed; only the instant it is evaluated at (the treatment) changed. |
| Wake-up MRI export prints an explicit No as "no" | src/clinical/wake-up-documentation.js | corrected (wording; no clinical claim) | none (field definition: Yes / No / Not assessed selects in Encounter) | n/a | n/a | Unanswered or malformed values still print "not documented". |
| Agent maxima for the administered-dose flag: TNK 25 mg, alteplase 90 mg | src/components/CaseBar.jsx | added (UI flag; reuses existing in-app values) | existing claims `tnk-stroke-dose` / `alteplase-stroke-dose` (src/clinical/claim-registry.js) and the note's existing check | not re-read 2026-10-22 | n/a | Same limits the note already applied; no new clinical value introduced. |
| Antiplatelet names in the medication record prompt an individual answer to "Antiplatelet therapy (single or dual)" | src/encounter-clinical-review.js | added (text match; no clinical threshold) | none (drug-name list: aspirin/ASA, clopidogrel, ticagrelor, prasugrel, dipyridamole, cilostazol and their common US brand names) | n/a | n/a | A name does not establish current use (as for ACE inhibitors). Benefit-tier item: it holds nothing. |
| Recorded treatment printed and flagged after a change of working diagnosis or context; proposed-vs-done and reversal-status reconcile flags | src/workspace-state.js; src/encounter-details.js; src/encounter-timeline.js; src/Encounter.jsx | added (documentation integrity; no clinical claim) | none | n/a | n/a | Prints only what was recorded; never infers administration or a procedure. |

## 5. Tests

### Added

**`tests/encounter-fixes-2026-10-21.test.js`** (38 tests): unit and server-rendered.

Finding 1:
- 9 diagnosis/context changes (mimic, TIA, other, ICH, SAH, CVT, none, follow-up ischemic, follow-up mimic) × 2 consultation types × 7 formats each contain:
  - the flag;
  - "TNK at 2026-10-21 13:50";
  - EVT puncture and reperfusion;
  - mTICI 2b;
  - the post-treatment review and hemorrhage review.
- The case bar keeps "TNK given", 17.5 mg and "Next check 3:05 PM". The next check is derived from the q15 min schedule: 13:50 + 75 min.
- The rendered bar keeps the post-lytic and BP links.
- Section 4 keeps the controls.
- Post-IVT BP cue in acute care, with the ICH precedence.
- Controls: an acute ischemic encounter has no reconcile line, and an untreated mimic has no treatment line in any format.

Finding 2:
- The endocarditis conflict screen equals the explicit-Yes screen; the dose is held with the conflict title; the Yes run is titled "IVT card held."; `protocolEncounter` is unchanged for the conflict (documents §6).
- Glucose 450 answered No with an incomplete NIHSS.
- Control: no conflict gives the standard screen and TNK 21 mg (0.25 mg/kg × 84 kg).

Finding 4: Planned, Under review and no status are flagged in the timeline, handoff and UI; Administered, no time and SAH are not.

Finding 5: Explicit No, Yes and unanswered at note level.

Finding 6: The reviewer's case A in the procedure record and Section 4; review-only and complete-record variants.

Finding 7:
- With TNK at 13:40, the screen line is identical at 14:00, 18:30, 22:30 and the next day 13:00.
- Untreated, 18:30 is "met" and 22:30 is "not met", each labelled. Expected values are derived from the EXTEND criteria: 6 h and 10 h after LKW; core 10 < 70 mL; ratio 8 > 1.2; mismatch 70 > 10 mL.

Finding 8: Five medication strings; bulk No skips the item; a No answer is listed as a conflict; "nasal" is not matched.

Finding 9: TNK 30 and alteplase 95 are flagged; 25, 90 and an empty dose are not.

Finding 10: HPI, rationale and handoff are named; a valid CT date is never named.

**`tests/encounter-fixes-2026-10-21.test.jsx`** (3 tests): Chromium, the app built from source, fixed clock.
- New encounter at 390 and 1280 px:
  - partial date, time and number entries are cleared (`badInput` false);
  - focus is on `encounter-title` with `scrollY` 0;
  - typing only the year afterwards no longer completes "2026-10-20".
- More › Start new encounter from Protocols returns focus to the heading at the top.

**Before and after.** On the `8af8c59` tree (via `git archive`) with only these two files added, 34 of the 41 new tests fail. The 7 that pass there are the negative controls (acute ischemic and untreated-mimic notes, no-conflict screen, "Administered" reversal status, no reversal time or SAH, and doses at or below the maximum). All 41 pass on this branch.

### Updated assertions

Each change is deliberate, and each test still checks the same behaviour:
- **`tests/documentation-output.test.js`, `tests/workspace-documentation.test.js`, `tests/workspace-state.test.js` (finding 1).** These asserted that a recorded administration *disappears* in follow-up or ICH ("omitting incompatible reperfusion sources"). They now assert that it is printed with the reconcile flag. Vessel imaging, perfusion core and the checklist are still asserted absent, which is the original intent for derived ischemic output.
- **`tests/workspace-documentation.test.js` (finding 5).** "MRI lesion extent reviewed: documented." is now "yes.".
- **`tests/encounter-details.test.js` (findings 1 and 6).** The post-treatment group in follow-up and ICH is now printed and flagged (`[no EVT puncture recorded; reconcile]`). A new control checks that an ICH note without a review has no such group.
- **`tests/encounter-time-review.test.js` (finding 1).** Renamed from "does not export or flag retained acute EVT values in an incompatible context". Recorded EVT times are still exported and still checked for reperfusion-before-puncture after the change, flagged. Intervals stay acute-only.
- **`tests/encounter-2026-10-21.test.js`:**
  - Finding 6: the puncture line gains `[reperfusion time recorded; reconcile]`.
  - Finding 5: DWI wording.
  - Fuzz, "never invent": "TNK at …" requires an explicit administration record, but no longer requires acute ischemic stroke.
  - Fuzz, two new invariants: a valid recorded administration appears in every note, and outside acute ischemic stroke it is flagged.
- **`tests/wake-up-documentation.test.js` (finding 5).** "documented" is now "yes", and an explicit `false` now prints "no". The old test "does not turn unconfirmed MRI checks (false) into negative findings" encoded checkbox semantics; it is now "prints an MRI answer %j as %s", and undefined, null and "true" still print "not documented".
- **`tests/cycle2-encounter-safety.test.jsx` (findings 1 and 6).** In follow-up, the post-treatment observations stay, flagged.
- **`tests/lean-encounter-regressions.test.jsx` (finding 1).**
  - Follow-up with nothing recorded still shows no dose calculation and no administration controls.
  - Follow-up with a recorded administration keeps the timer and the reconcile caution.

`scripts/qa-smoke.mjs`: no assertion needed a wording change (the wake-up checks match substrings that remain). `node scripts/qa-smoke.mjs --local-only` on the final build, with port 4177 checked free first, gave "Browser QA PASS: 35/35".

### Results (final tree, commit `a1feddf`)

- **`npx vitest run`:** 124 files passed, 2,468 tests passed, 3 skipped, 0 failed. The 7.9.0 base was 122 files, 2,427 passed, 3 skipped.
- **Pass:**
  - `npm run test:protocol-source`
  - `npm run check:asset-budget`
  - `npm run check:clinical-claims`
  - `check:leak-guard`, including the two new files (their synthetic phone number is built at run time, as the existing tests do).
- **Rendered Protocols lock, desktop:** `npm run build && STROKE_PROTOCOL_LOCK_PORT=4410 npm run test:protocol-tab` gives "Protocols tab preservation lock: PASS (46 fixture/sub-tab captures, desktop 1440x900)".
- **Rendered Protocols lock, phone:** `STROKE_PROTOCOL_LOCK_PORT=4412 node scripts/protocols-tab-lock.mjs --viewport=phone` gives "PASS (46 fixture/sub-tab captures, phone 390x844)".
- **Other validators:** `content:validate`, `evidence:validate`, `validate:citations` and `validate:inline-citations` pass. No content data was changed.
- **Browser re-runs:** every reviewer script re-run on the fixed build shows the expected result. The scenario sweep (18 runs, 144 notes) has no artefacts and no console or page errors. Its only note differences from the base are the intended ones: the reversal flag on the ICH journey, the wake-up label, and DWI/FLAIR "yes".

## 6. Protocols observations (report only)

**P-1. Owner decision: a contradicted "No" does not hold the Protocols IVT card.**

*Divergence.* With infective endocarditis recorded as the care context and the checklist answered "No" (reviewer script `t11b`):
- the Encounter IVT screen now reads "A recorded contraindication, relative risk factor or contradictory checklist entry requires clinician review…";
- the case-bar dose is "Held";
- the Protocols tab shows no "IVT card held" banner, the same as a run without the conflict. With the item answered "Yes", Protocols shows "IVT card held."

The banner and everything Protocols renders come from `protocolEncounter()` in `src/workspace-state.js`. That function is hash-locked and was not changed.

*One-line fix, if the owner approves.* In `protocolEncounter` (`src/workspace-state.js`, the `const treatment = …` line), pass the contradiction-aware note, and add `contradictedAsYes` to the existing import from `./encounter-clinical-review.js` on line 10:

```js
const treatment = compatible ? evaluateVideoTreatment({ note: { ...contradictedAsYes(n, nowMs, state.details), nihss }, clock: hours === '' ? null : { total: hours, label: 'LKW' }, aspects: state.aspects, pcAspects: state.pcAspects, now: new Date(nowMs) }).tnk : null;
```

*Effect of that change, checked in a scratch copy of this tree (not committed):*
- the projection holds the card for the endocarditis conflict (`safetyReviewRequired: true`, severity critical, the Encounter screen's reason) and not without the conflict;
- `scripts/protocols-source-lock.mjs` still reports PASS, because no fixture contains a contradicted "No";
- the rendered lock was not run for this variant;
- it still changes what Protocols renders for conflicting entries, so it needs the owner.

No other Protocols issue was found within this unit's scope.

## 7. Unresolved uncertainties

- **Post-IVT BP cue for non-ischemic diagnoses.** Keeping the cue for a thrombolysed mimic or a post-lytic ICH without an ICH flag extends a guideline target written for IVT-treated AIS (§4). It is a cue, not a recommendation; the owner may prefer to restrict it.
- **Follow-up context.** A recorded treatment now keeps Section 4 controls and the neuro-check pill in follow-up context. That is the safer default, but it is a visible change: an earlier acute encounter switched to follow-up now asks for reconciliation instead of hiding the record.
- **Fields still not named in the copy-blocked alert.** The GCS limitation, the lastDOACType value, malformed structured dates and non-timestamp timeline values block copy without being named. These are rare free-text paths, left out to save budget.
- **WAKE-UP recognition window.** Not confirmed at abstract level (§4); the existing rule is unchanged.
- **Browser coverage.** Headless Chromium only; WebKit/Firefox native date pickers were not tested.
