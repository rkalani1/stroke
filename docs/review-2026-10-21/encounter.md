# Encounter review — 2026-10-21 (unit: encounter)

Headless review of the complete Encounter journey, its timing, its notes and its session state, on the 7.8.0 baseline (af21b07). Synthetic data only. The Protocols tab is unchanged: the Encounter→Protocols projection hash and the rendered tab lock both pass.

## 1. Scope inventory

**Edited (within scope):** `src/Encounter.jsx`, `src/workspace-state.js` (note generation only; the hashed projection functions `protocolEncounter`, `encounterNihss`, `encounterTiming`, `encounterVolume` and `protocolVolumeEstimate` are untouched), `src/encounter-overview.js`, `src/encounter-timeline.js` (`formatTimeline` only; `encounterClockTimestamp` untouched), `src/documentation-output.js`, `src/clinical/timestamp.js` (`formatRecordedInstant` and a new `enteredTime`; `timestampCandidates`/`parseTimestamp` untouched), `src/clinical/wake-up-documentation.js`, `src/clinical/perfusion-documentation.js`, `src/components/CaseBar.jsx`.

**Read, not changed:** `src/encounter-clinical-review.js`, `src/encounter-details.js`, `src/encounter-inputs.js`, `src/encounter-decision-status.js`, `src/encounter-output-gate.js`, `src/documentation-prompts.js`, `src/clinical/{encounter-time,nihss-items,safety-items,consent-documentation,claim-registry}.js`, `src/use-current-time.js`, `src/public-demo-guardrails.js`; outside scope for context: `src/app.jsx` (clock, copy, reset wiring), `src/components/{Field,TimestampOccurrence,TimestampNowButton,EncounterTimeline,EncounterDetails,EncounterOverview,TiaReadiness}.jsx`, `src/calculators-extended.js` (`computeLKWCountdown`, `computeNeurocheckSchedule`).

**Journeys walked** (Playwright, headless Chromium, built bundle served on 127.0.0.1:4371; America/Los_Angeles, en-US; 390×844 and 1280×900; service workers blocked except where noted):

- Telephone and video × every working diagnosis offered (`DIAGNOSES`: ischemic, TIA, ICH, SAH, CVT, stroke mimic, other/uncertain): followed **Next** through every missing core entry, filled each target, checked focus and visibility, used the four section buttons and the **Jump to** select, toured Protocols/Trials/Evidence/Calculators and back, generated the note.
- One complete video ischemic journey through every control: baseline and timing, weight in lb, NIHSS tap-to-score with an UN item, invalid then valid ASPECTS, vessel chips (None exclusivity), inverted then valid perfusion volumes, explicit "none" anticoagulant, bulk "No" with related-value skips, review attestation, decisions, TNK dose, IVT discussion/consent/time, administration with agent confirmation, dose and pre-IVT BP, EVT puncture and consent, a monitoring prompt, disposition, transfer and post-reperfusion details, mTICI; then all seven documentation formats.
- Timing: midnight, same-date future LKW, Los Angeles fall-back (repeated 01:00–01:59) and spring-forward (missing 02:00–02:59), Europe/London fall-back, Australia/Sydney gap, Asia/Kolkata, America/St_Johns; impossible ordering; a 3 h hidden tab; a next-day `pageshow`.
- Clipboard granted, rejected (`NotAllowedError`), `navigator.clipboard` missing, and a slow write superseded by an edit; New encounter cancel and accept; 10 h idle; back-navigation after leaving the page.
- Unit-level survey of every format for each diagnosis and an exploratory fuzz (8,000 randomized states).

**Formats discovered** (`DOCUMENT_FORMATS`): consultation (Pulsara summary for telephone, Epic note for video), follow-up note, progress note, discharge summary, transfer handoff, team handoff, procedure record — 7 formats × 2 consultation types.

**Verified as already correct** (no change): elapsed times derive from recorded instants (`computeLKWCountdown`), not ticks; `useCurrentTime` reads wall time on `visibilitychange` and `pageshow`; future, skipped and ambiguous times are rejected (never shifted to another day); reversed intervals print "Invalid, future, reversed or ambiguous local timestamps" (no `+24 h` repair anywhere in `src`); IVT/EVT-before-LKW, reperfusion-before-puncture and late-consent flags; repeated-hour occurrence chooser; delayed clipboard results cannot attest a newer draft; New encounter asks first and clears every Encounter field, the draft, the copy status and the case bar, and remounts Trials and Protocols; values persist across tab changes; no persistence of clinical data. Service-worker updates (code review only; the upgrade path is the lead's `qa-upgrade`) never reload an open encounter: the banner says that **Reload to update** clears the session, and **Later** keeps it.

## 2. Findings

| ID | Severity | Area | Finding | Status |
|---|---|---|---|---|
| E-01 | Medium | Notes / time zone | Times were written as local wall time with an offset only for a repeated hour, and the `Times:` line names the zone abbreviation at generation. A note spanning a daylight-saving change (LKW 2026-10-31 23:30 PDT, note at 03:00 PST) printed `23:30` under "PST", so a hand-computed LKW-to-needle interval would be 1 h wrong. | Fixed: a time whose UTC offset differs from the note's carries it, e.g. `2026-10-31 23:30 (UTC−07:00)`. |
| E-02 | Medium | Notes / missing vs negative | An unexamined NIHSS printed `incomplete: 0/15 items; partial sum 0; no completed score` in every format; "NIHSS … 0" can be read as an examined score of 0. | Fixed: `incomplete: 0/15 items scored; no completed score` (keeps the "NIHSS score: incomplete" prefix that `scripts/qa-smoke.mjs` asserts); the Encounter readout drops "partial sum 0" when no item is scored. |
| E-03 | Medium | Notes / proposed vs completed | Acute ischemic notes stated "IVT administration: not documented as given" but said nothing for EVT without a puncture time, so "EVT clinician decision: Recommended" with "EVT consent status: Informed consent" could read as a performed procedure (team handoff included). | Fixed: `EVT puncture: not documented`, also before a reperfusion time recorded without a puncture time. |
| E-04 | Low–Medium | Notes / dropped entries | An IVT or EVT consent record time entered without a consent status was omitted; a discovery date/time entered with a known LKW (e.g., bedtime LKW) was omitted unless the MRI wake-up pathway was selected. | Fixed: consent time kept with `[consent status not documented]`; discovery appended to the LKW line. |
| E-05 | Low–Medium | Timing / ordering | Discovery earlier than a known LKW was not flagged. | Fixed: `[discovery precedes LKW; review recorded dates/times]`. |
| E-06 | Low | Notes / flagged times | Future, invalid or ambiguous EVT puncture/reperfusion and consent times printed only the reason, without the entered value (LKW, dose and timeline lines kept it); the IVT not-given line dropped it too. | Fixed: the written value is kept with date and time separated, e.g. `EVT puncture: 2026-02-30 11:00 (invalid or future; correct before interpretation)`. |
| E-07 | Medium | Notes / CTP-EXTEND export | The wake-up/EXTEND block printed unrounded floats (`mismatch ratio: 3.6666666666666665`, `21.299999999999997 mL`), a ratio below 1 when total < core, units after placeholders (`not documented or invalid mL`), and, when the screen does not apply (known LKW < 4.5 h), six lines duplicating the CTP and LKW lines in the consultation and the compact team handoff. | Fixed: derived values rounded (0.1 mL, 0.01); total < core → `not calculable (total hypoperfused volume below core; reconcile)`; core 0 → `not calculable (core 0)`; units only after numbers; not applicable → screen line only (the MRI pathway keeps its recorded DWI/FLAIR findings). |
| E-08 | Low | Notes / plain text | Untrimmed entries produced ` .` and ` ;` (assessment, medications, handoff, NIHSS details, CTP text); a sentence-ending entry produced `.;`; multi-line entries ran together in the one-line Pulsara paragraph (`[blank; not documented] Monitoring ordered …`); optional formats put a blank line under `Clinical context:`; a UTC device printed `(UTC, UTC)`. | Fixed: trimmed; `.; ` → `. `; line breaks → `; ` unless the line already ends a clause; heading followed directly by content; zone named once. |
| E-09 | Low | Notes / labels | `CTA Head/Neck (not documented): Left M1 occlusion` reads as "CTA not documented". | Fixed: `(time not documented)` for CT and CTA. |
| E-10 | Low | Completion counter | An entered but unusable core value (age 130, weight 400 kg or 900 lb, BP `170/`, future LKW, invalid reported NIHSS) counted as missing under the same label as an empty field ("Next: Weight"). | Fixed: `Next: Weight (check entry)`; same target and count. |
| E-11 | Low | Validation messages | No message where entered: ASPECTS/pc-ASPECTS outside 0–10 (only the EVT screen said "Document assessed ASPECTS"); future, invalid or ambiguous EVT puncture/reperfusion and consent times had no UI feedback (IVT time only via "Monitoring timer inactive"). | Fixed: inline cautions in Sections 2 and 4. |
| E-12 | Medium | Stale state | The encounter lives in memory indefinitely (an installed PWA left open for days; a back-forward-cache restore, where the browser uses one, also returns it; the case bar shows it on every surface) with nothing showing its age; a new patient's entries could be added to an old encounter, carrying over weight, anticoagulant or allergies. In the headless run, leaving and going back reloaded the page (state cleared), so the bfcache path was checked in code (`pageshow` refreshes the clock) rather than observed. | Fixed: non-blocking status after 2 h without an entry — "Last entry 2 h 05 min ago. If this is a different patient, use New encounter first." In memory only; nothing persisted or cleared automatically. |
| E-13 | Low | Case bar | The case bar said "TNK given"/"tPA given" when the agent was pre-filled from the dose calculation and not confirmed (Encounter and the note flag it). | Fixed: "IVT given" with a caution flag until confirmed. |
| E-14 | Low | Performance | `CaseBar` called `useCurrentTime(true)`, so an empty encounter ran a one-second interval on every surface, regressing 7.6.0's measured "zero periodic callbacks" for an empty Encounter. | Fixed: ticks only while it shows a time. |
| O-1 | Low (a11y) | Copy status (`src/app.jsx`, out of scope) | Two identical copy outcomes in a row leave the live-region text unchanged, so the second is not re-announced. | Report only; suggested patch below. |
| O-2 | Info | Pre-IVT BP time | Free text without a date; cannot be ordered against the IVT time. | Unchanged; noted. |
| O-3 | Info | README | "a UTC offset is added only for a repeated daylight-saving hour" is now incomplete. | Lead to update (README outside scope). |
| O-4 | Info | Dead code | `src/encounter-decision-status.js` and `src/clinical/consent-documentation.js` are imported nowhere (not bundled); `src/encounter-output-gate.js` only by its test. | Unchanged. |
| O-5 | Info | Session loss | An accidental reload (e.g., mobile pull-to-refresh) clears the session without warning, by design. A `beforeunload` prompt would be an `app.jsx`/product decision. | Unchanged. |
| O-6 | Info | Test side effect | `tests/adversarial-m4-challenger.test.js` runs `npm run build:prod` in the repository root during `npx vitest run`, rewriting tracked outputs and leaving git-ignored `chunks/*.br|*.gz`; after a later source change those stale files make `npm run build` fail in `check:retirement` until `git clean -fdqX chunks`. | Unchanged; lead may want to isolate that test. |

Suggested patch for O-1 (`src/app.jsx`, not applied): clear the status before each attempt so every outcome changes the live region.

```js
const copy = async text => {
  if (buildSummary(stateRef.current, Date.now()) !== text) { await generateAndCopy(); return; }
  setCopyStatus('');
  ...
};
const generateAndCopy = async () => {
  ...
  setCopyStatus('');
  const result = await copySummary(stateRef, text, value => navigator.clipboard.writeText(value));
```

## 3. Changes and reasons

- **Time labels across daylight-saving changes (E-01).** `formatRecordedInstant(value, reference)` adds the offset when the instant's offset differs from the reference (the note time) as well as for a repeated hour; every note caller passes `nowMs`. Without a reference the old behaviour is unchanged. `documentedDateTime` uses the same rule for typed date/time pairs.
- **Missing, negative, proposed and completed (E-02–E-06).** Zero-item NIHSS wording (checked against the lead-run `scripts/qa-smoke.mjs` note assertions, which all still hold; that script was not run here because it uses fixed ports); `EVT puncture: not documented`; consent time without a status; discovery with a known LKW and its ordering flag (comparisons use valid instants only, so an invalid or ambiguous LKW no longer anchors "precedes LKW" flags — it is flagged on its own line); flagged times keep their value through a shared `recordedTime` helper.
- **CTP/EXTEND export (E-07).** Display rounding and conflict wording in `wake-up-documentation.js`; `evaluateWakeUpScreen` (which feeds the locked projection) is unchanged.
- **Plain text (E-08, E-09).** Trimming at the note sinks, one-line Pulsara separators, `.; ` tidy, heading layout, study-time label, zone name dedupe; `ctpResults` trimmed in `perfusion-documentation.js`.
- **Entry feedback (E-10, E-11).** Counter labels, ASPECTS and timestamp cautions, reusing existing `Result` tones and classes (no CSS change).
- **Stale state (E-12).** A render-time ref records when `state.revision` last changed; the notice uses the existing caution `Result` (role `status`). No storage, no timer of its own.
- **Case bar (E-13, E-14).** Unconfirmed agent label; tick only while a time is displayed.

**Asset budget** (final tree built with `npm run build`, compared with the af21b07 baseline measured the same way): initial JS gzip 127,374 → 128,178 B (**+804 B**, 97.8% of 131,072), initial raw 375,274 → 377,272 B (+1,998 B); all offline JS gzip 254,900 → 255,711 B (+811 B), raw +2,003 B; `tailwind.css` 0; service-worker precache +2,003 B. All six budgets pass; the remaining initial gzip headroom is 2,894 B, shared with the other units.

## 4. Evidence ledger

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| EXTEND perfusion arithmetic: mismatch ratio = perfusion lesion ÷ infarct core; absolute mismatch = perfusion lesion − core; export rounds the derived values and reports total < core as a conflict | src/clinical/wake-up-documentation.js | corrected (display of derived values) | Ma H et al. A multicentre, randomized, double-blinded, placebo-controlled Phase III study to investigate EXtending the time for Thrombolysis in Emergency Neurological Deficits (EXTEND). Int J Stroke 2012;7:74-80 — doi:10.1111/j.1747-4949.2011.00730.x, PMID 22188854 — 2012-01 | accessed 2026-10-21, abstract | "infarct core volume <70 ml, perfusion lesion : infarct core mismatch ratio >1·2, and absolute mismatch >10 ml" | Display only. Thresholds and `evaluateWakeUpScreen` eligibility logic unchanged. "Total includes core" is the existing field definition; the conflict wording matches the existing CTP export. |
| EXTEND window in the export's screen-source line: 4.5–9 h from LKW or within 9 h of the sleep midpoint | src/encounter-clinical-review.js `EXTEND_PERFUSION_SOURCE` (read-only) | verified | Ma H et al. Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset of Stroke. N Engl J Med 2019 — doi:10.1056/NEJMoa1813046, PMID 31067369 — 2019-05-09 | accessed 2026-10-21, abstract | "between 4.5 and 9.0 hours after the onset of stroke or on awakening with stroke (if within 9 hours from the midpoint of sleep)" | No change. |
| WAKE-UP population: unknown onset with a DWI lesion and no FLAIR hyperintensity; the not-applicable export keeps recorded DWI/FLAIR findings | src/clinical/wake-up-documentation.js | verified | Thomalla G et al. MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset. N Engl J Med 2018 — doi:10.1056/NEJMoa1804355, PMID 29766770 — 2018-05-16 | accessed 2026-10-21, abstract | "unknown time of onset … an ischemic lesion that was visible on MRI diffusion-weighted imaging but no parenchymal hyperintensity on fluid-attenuated inversion recovery (FLAIR)" | Export wording only; screen logic unchanged. |
| Discovery cannot precede a known LKW (ordering flag) | src/workspace-state.js LKW line | added (ordering check; no clinical threshold) | none (definitional: LKW is the last time at baseline; symptom discovery is a later observation) | n/a | n/a | Flag only; values unchanged. Unknown-LKW wording unchanged. |
| NIHSS with no item scored reads "0/15 items scored", not a partial sum of 0 | src/workspace-state.js; src/Encounter.jsx | corrected (wording; no clinical claim) | none (existing instrument rule in `nihssAssessment`: a total requires every item) | n/a | n/a | No scoring change. |
| "EVT puncture: not documented" when no puncture time is recorded | src/workspace-state.js | added (documentation wording; no clinical claim) | none | n/a | n/a | Mirrors the existing IVT administration line. |
| UTC offset on times whose offset differs from the note's | src/clinical/timestamp.js; note callers | corrected (time labelling) | none (runtime IANA rules; tests derive expected minutes from explicit UTC offsets) | n/a | n/a | README sentence to update (O-3). |
| 2 h idle notice | src/Encounter.jsx | added (usability heuristic; no clinical claim) | none | n/a | n/a | Threshold is a usability choice, not evidence-based; non-blocking; in memory only. |
| Case bar "IVT given" until the agent is confirmed | src/components/CaseBar.jsx | corrected (UI; mirrors the note flag) | none | n/a | n/a | — |

## 5. Tests

**Added**
- `tests/encounter-2026-10-21.test.js` (20 tests): midnight and same-date future LKW; suspension; Los Angeles fall-back occurrences and spring-forward gap; DST-spanning labels (Los Angeles, Europe/London); no offsets in Asia/Kolkata; UTC zone named once; discovery-before-LKW, IVT-before-LKW, reversed procedure times, late consent; reversed and overnight intervals; flagged times keep their value; zero-item NIHSS in three formats; EVT not documented (including reperfusion without puncture); study-time label; trimming and one-line Pulsara; CTP/EXTEND export; optional-format heading; counter labels; and a fixed-seed fuzz of 400 random synthetic encounters × 2 consultation types × 7 formats (5,600 notes) asserting no literal undefined/null/NaN/Infinity/[object …], no doubled or dangling punctuation, no empty brackets, no unfilled prompt blanks, no unrounded decimals, no unit after a placeholder, no trailing whitespace or blank-line runs, balanced brackets, a time-zone line in every note, a one-paragraph Pulsara summary, and never-invent invariants (administration, complete NIHSS, disabling deficit, answered checklist, missing EVT puncture, missing IVT decision). Expected values come from UTC arithmetic and field definitions. Run against the original sources (af21b07), 15 of 20 fail; the 5 that pass encode behaviour that was already correct.
- `tests/encounter-2026-10-21.test.jsx` (12 tests, Chromium, app shell built from source on a synthetic origin, fixed clock/zone/locale): copy granted (status, "Copied ✓", copied text equals the regenerated note, case-bar announcement on Protocols), denied and missing clipboard (message, full-note selection, also from another surface), superseded copy; midnight, repeated hour, no per-second clock for an encounter without a time, 3 h hidden-tab resume, 2 h idle notice; counter label and focus, ASPECTS and timestamp cautions; New encounter cancel/accept; identical note under en-US and de-DE.

**Updated assertions** (wording deliberately changed; each still checks the same behaviour):
- `tests/documentation-output.test.js`: "entered time is invalid or future" → "entered time 2026-10-01 13:00 is invalid or future" (value kept, E-06); `not.toContain('EVT puncture:')` → `toContain('EVT puncture: not documented')` (consent still never implies the procedure, E-03).
- `tests/encounter-time-review.test.js`: "`<label>`: ambiguous local time" → "`<label>`: 2026-11-01 01:3x (ambiguous local time" (E-06).
- `tests/notes-review-7-8.test.js`: IVT not-given text keeps the entered time (E-06); sleep-midpoint flagged values print `2026-11-01 01:30` instead of `2026-11-01T01:30`, and a stale comment is corrected (the field does have an occurrence chooser).
- `tests/workspace-documentation.test.js`, `tests/workspace-state.test.js`: consent/puncture flagged lines keep their value (E-06).
- `tests/encounter-overview.test.js`: invalid weight/age labels gain "(check entry)" (E-10).
- `tests/notes-review-dom.test.jsx`: empty itemized readout "0/15 items documented · partial sum 0" → "0/15 items documented" (E-02).
- `tests/round3-oncall.test.jsx`: the "TNK given" fixture records `agentConfirmed: 'TNK'`; a new assertion covers "IVT given" while unconfirmed (E-13).

**Results** (final tree, commit 338dffe): `npx vitest run` — 114 files passed, 2,028 tests passed, 3 skipped, 0 failed (baseline 112 files, 1,996 passed, 3 skipped; +32 new tests). `npm run test:protocol-source` PASS. `npm run build && STROKE_PROTOCOL_LOCK_PORT=4370 npm run test:protocol-tab` on that exact build: PASS (46 fixture/sub-tab captures). All 14 telephone/video × diagnosis walks were repeated on the same build: core entries complete through **Next**, values kept across tabs, no note artifacts, no page errors. `check:asset-budget`, `check:clinical-claims`, `content:validate`, `evidence:validate`, `validate:citations`, `validate:inline-citations`, `check:leak-guard` PASS. Not run (fixed ports, lead-run): `npm run test:protocol-snapshot`, `scripts/qa-smoke.mjs`; their note-text assertions were read and remain satisfied (E-02).

## 6. Protocols observations (report only)

**P-1. Reversal card last-dose hours use a lenient parser.** `src/app.jsx` passes `lastDoseHours` to the Protocols quick reference with `Date.parse(state.note.lastDOACDose)`. V8 rolls an impossible date forward (`2026-02-30T08:00` → 2 March), accepts a time skipped by the spring-forward change, and silently picks one occurrence of a repeated hour, whereas the Encounter's strict parser rejects all three. For an acute ICH with apixaban and a mistyped dose date `2026-02-30T08:00` at 2026-10-21 10:00 (Los Angeles), reproduced with `reversalDoseLine`:

- Encounter banner (strict parser, time unknown): "Apixaban, last-dose time unknown (treat as within the local <24 h trigger) — 4F-PCC 2000 units IV."
- Protocols reversal card (lenient parser): "Apixaban, last dose 5593 h ago — beyond the local <24 h trigger; reverse only with renal impairment or an elevated anti-Xa level."

The two surfaces give opposite reversal prompts for the same entry. The basis is the app's own local rule (unknown timing is treated as within the trigger, CHANGELOG 7.7.4); no external source is needed to establish the inconsistency. Suggested owner-approved fix: compute `lastDoseHours` with `validTimestamp(state.note.lastDOACDose, now)` in `src/app.jsx`, as Encounter does. This changes Protocols output only for invalid, skipped or ambiguous dose times; the existing lock fixtures (including `ich-apixaban-future-dose`) should be unaffected, but it must go through the Protocols owner. Not changed here.

No other Protocols issue was identified within this unit's scope.

## 7. Unresolved uncertainties

- The 2 h idle threshold is a judgement, not evidence-based; long post-IVT documentation sessions will see the notice (it is non-blocking).
- The offset rule labels times relative to the note's generation time; a device whose zone setting changes mid-encounter still interprets typed local times in the current zone (stamped instants are preserved). Inherent to local-time entry; unchanged.
- Repeated identical copy outcomes are not re-announced (O-1) until `app.jsx` is patched.
- Browser checks are headless Chromium simulations, not physical-device or screen-reader validation.
