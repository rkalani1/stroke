# Encounter documentation and search review — 2026-09-06

## Scope and source of truth

This pass follows the authorized site review and excludes changes to the Protocols tab's clinical content. It corrects how encounter inputs become copied text, treatment-dependent draft outputs, history, and search destinations. The source of truth for these changes is the app's existing input fields: a recommendation, a decision explicitly recorded by the user, an administration timestamp, and an EVT puncture/reperfusion timestamp represent different facts. No new treatment indication, dose, clinical eligibility rule, or guideline class was inferred from these states.

The repository's AutoMedBench-Lite S1–S3 steps were applied: identify affected outputs and fields; inspect existing decision, timeline, and output code; reproduce unknown-as-negative and recommendation-as-administration failures; define tests for the affected authored functions. Broader clinical-source verification is recorded in the guideline, education, and evidence review reports.

## Corrections

- Centralized the explicit positive / explicit negative / undocumented decision model in `src/encounter-decision-status.js`. The matcher uses the same recorded-decision helper. Legacy `true` remains a positive recommendation; legacy or default `false` remains unknown unless accompanied by `DecisionRecorded: true`.
- Both diagnosis-reset paths and the TNK automatic-block transition invalidate the prior decision rather than turning a prior positive into an undocumented negative. The decision select and contraindication-review action use the shared field constructor. Export/import field lists retain the new recorded flags.
- Separate treatment course labels require a valid recorded time to state TNK administration. They recognize the dedicated TNK time, the independent door-to-needle timeline, and the legacy needle-time field. EVT puncture is labeled as a start; recorded reperfusion time is distinct from a recommendation or planned device/access site. A recommendation alone never proves administration or procedure completion.
- Clipboard packs, history, handoff summaries, smart notes, follow-up, transfer, signout, procedure, discharge, and default consult outputs use the recorded state. Removed inferred “Medical management,” unsupported eligibility-based negative decisions, and unsupported “activation initiated” text. Patient education no longer treats an EVT recommendation as a procedure received.
- The copied admission-order draft remains incomplete until its treatment-dependent inputs are documented. Actual recorded administration selects the existing post-treatment branch. The selected clinical order text itself was not re-derived from evidence during this pass. Related copied order-bundle conditions distinguish planned from recorded treatment.
- Output NIHSS values preserve explicit numeric/string zero. A default computed zero with no entered NIHSS exam does not become an observed NIHSS of zero.
- Fixed an existing discharge-template runtime error: a cardiac-workup variable was used outside the block in which it was declared.
- Completed-trial search results resolve to the canonical completed-trial browser, clear stale filters, use an atlas-searchable short name, open the section, and focus its search field. Legacy named trial navigation checks completed records before opening the recruitment screener. MINUTE and MR-PICS phase labels were changed to “Device study” using registry verification supplied by the evidence-review agent.

## Validation

Executed:

```text
npx vitest run tests/encounter-treatment-documentation.test.js tests/completed-trial-search-route.test.js tests/on-call-search-decisions.test.js tests/encounter-output-gate.test.js
```

Result: **30 tests passed across 4 files** (2026-09-06, 18:25 local).

The new tests execute the actual authored output functions extracted from `src/app.jsx`, with only unrelated presentation/calculator dependencies supplied. Covered outputs include clipboard context, smart note, follow-up, transfer, signout, procedure, discharge, default consult, patient education, and admission drafts. Coverage includes cleared decisions, legacy false, explicit negative, recommendation without administration, recorded timeline administration without a current recommendation, EVT puncture versus completion, invalid timestamps, and blank versus explicit-zero NIHSS.

The routing test checks VNS-REHAB specifically and verifies that every projected completed-study search entry produces filters containing its canonical atlas record. Browser verification and the full integrated build/QA/Protocols preservation checks remain assigned to the root and evidence-review agents.

## Limits and follow-up

These helpers report recorded input; they cannot verify that treatment happened or that a documented time is accurate. An absent administration time is explicitly unconfirmed, not proof that treatment was withheld. An EVT recommendation, consent, planned device, or TICI calculator value does not independently establish completed EVT. These changes do not provide clinical validation or institutional approval.

Two additional progress-note default phrases were handed to the root integration agent for correction while it owned `app.jsx`: unrecorded post-TNK monitoring must not say “complete / ongoing,” and an unrecorded prophylaxis plan must not say medication was held merely because TNK was recommended.

No PHI, credentials, real encounter data, or restricted institutional material was introduced. No commit, push, build, or generated-artifact refresh was performed by this subtask.

## Final integration review

Read-only comparison of the integrated source against the starting commit confirmed that the entire `app.jsx` Protocols render region (through the following Research Calculators branch marker) is identical after line-ending normalization. `src/institutional-protocols.js` and `src/management-guidance.js` are also unchanged after line-ending normalization. `src/calculators.js` and `src/pocket-cards.jsx` have no diff. The ICH and ischemic example snapshots are byte-identical to the originals despite appearing modified in Git status. The generated generic-protocol and management-card JSON changes consist only of the application-version field.

The caller inventory checked every changed exported function in `src/calculators-extended.js` against calls across `src`. Newly strict helpers are used by the live UI only in the Encounter large-core panel and the Research PASCAL panel. The education reviewer corrected the large-core caller's missing vessel input and incomplete-state presentation. DAWN/DEFUSE-3 and acute-DAPT calls exist inside exported calculator components that the current app does not mount; their inputs already supply the required fields and their current incomplete results do not enter an eligible/not-eligible branch. The LKW countdown caller continues to use its existing unchanged helper contract. Other updated advisory helpers are available to the development/test surface, with no direct rendered-app caller found.

The PASCAL panel previously converted unentered morphology to `false` with `!!`, bypassing the helper's new incomplete-state safeguard. Replaced the two anatomy checkboxes with labeled Unknown / Absent / Present selects and passed raw tri-state values into the helper. Existing defaults and reset shapes omit morphology, so they remain unknown; age synchronization preserves those values; serialized explicit positive and negative observations remain intact. `tests/pascal-input-state.test.js` renders and interacts with the actual authored panel, executes the actual age-sync source, and checks defaults, clearing observations, explicit negatives, positives, and serialization. **All 4 tests passed** on 2026-09-06. Snapshot regeneration remains assigned to the root integrator.

Two additional concrete integration findings were reported to the root integrator and then corrected within the authorized regions. The Nursing Parameters Sheet now remains visibly incomplete for undocumented or recommendation-only reperfusion courses. Its existing clinical text and thresholds are selected using shared recorded-administration detection, including independent timeline times. Explicit negative decisions retain the existing non-reperfusion branch; recorded EVT reperfusion selects the existing post-EVT BP branch. Both duplicate LVO warnings now require an explicit negative decision and exclude recorded EVT completion, rather than describing an undocumented decision as “not pursued.”

Actual authored-output regressions exercise both undocumented decisions, TNK or EVT recommended without recorded treatment, each supported TNK time field, explicitly negative decisions, completed EVT, and unknown/negative/positive/completed EVT warning states.

The final TNK safety-check gate now keeps weight, contraindication review, and consent pending when the treatment decision is undocumented. An explicit negative decision or automatic contraindication block makes those requirements unnecessary only when there is no recorded administration. Recommended or recorded TNK requires the actual documentation fields, including when the recommendation was later cleared or blocked. Four additional tests execute the actual safety-check function for these transitions and all supported administration-time fields. The final focused run of `tests/encounter-treatment-documentation.test.js` and `tests/pascal-input-state.test.js` passed **32 tests across 2 files**. The root integrator retains ownership of the final build, complete suite, and snapshot verification.
