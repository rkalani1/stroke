# r3-shell-search — 2026-10-22

Unit: shell-search (round-3 verification fixes for 7.9.0). Scope: the 12 findings in the `shell-search` slice. They cover Evidence counts and bottom lines; global search, the Evidence filter and the Calculators filter; the offline banner and the first-session offline reference; and four keyboard-focus findings in the app shell.

The work started at the 7.9.0 integration commit `4d13e0e`. An earlier agent on this unit was interrupted by a container restart. I re-checked its four commits against the sources, code and tests and kept what was right. I corrected two things it got wrong (§3, "Corrections to the interrupted work"). I re-ran every check myself; the results are in §8.

I re-checked every finding at `4d13e0e`, and the encounter-fixes and evidence-fixes commits (8af8c59..4d13e0e) had fixed none of them. After the evidence-fixes rewrites, all 92 shipped bottom lines still split at the true first sentence. The new abbreviation rule leaves all 92 unchanged (each one compared before and after in node).

Owned files changed:
- `src/reference-search.js`
- `src/quick-search-index.js` (normalize, searchIndex, groupResults lead and ranking only)
- `src/calculator-utilities.js` (`matchesCalculatorSearch` only)
- `src/components/QuickSearch.jsx` (the no-matches hint and status lines, and the `retry` and `indexNote` they read)
- `src/reference-resource.js`, `src/Reference.jsx`, `src/app.jsx`, `src/design/shell.css`

Tests: the new `tests/shell-search-2026-10-22.test.jsx` and one assertion in `tests/design-2026-10-21.test.jsx`. The service worker needed no change. `service-worker.js` is hand-maintained with generated marker regions, and the first-session fix reads its existing precache from the page.

## 1. Decisions

| id | sev. | decision | what changed | source / evidence re-read | test |
|---|---|---|---|---|---|
| design-shell#2 | low | fixed | Collapsed rows count graded recommendations and ungraded statements separately: "3 ungraded statements" in place of "3 guideline recommendations". The expanded heading and its aria-label read "Ungraded statements" when every item is a statement, "Guideline recommendations" when none is, and "Guideline recommendations and statements" when the list is mixed. The copied text uses the same heading. One helper, `recommendationGroups()`, applies the rule that `recommendationLabels` already uses (`cor === 'Statement'`, chip "Ungraded statement"). I did not use the reviewer's single heading "…and statements" for the TIA and CVT cards, because they hold no guideline recommendation at all. | PMID 36655570 (TIA in the ED) and PMID 38284265 (CVT), PubMed metadata and abstract re-read 2026-10-22: both titles say "A Scientific Statement From the American Heart Association". In the archived transcriptions `tia-ed-2023.json` and `cvt-2024.json` at 4f8e99d, `documentType` is "scientific-statement" and `gradingSystem` is "ungraded"; all 81 and 38 items are Statement/Ungraded. In the shipped data, only `tia-evaluation` and `cvt` (3 items each) carry Statement items. | Unit: counts, headings and copy text for TIA, CVT, graded-only and mixed lists. Chromium: collapsed TIA row; opened CVT heading, aria-label and chips; a graded topic unchanged. |
| design-shell#3 | low | fixed | Offline banner. A tab the service worker controls keeps "Offline · the workspace still works; external and source links need internet". Any other tab (first visit, hard reload, no service worker) shows "Offline · " followed by the More panel's own status, e.g. "Saved for offline use · this tab needs internet until reopened" or "Offline mode unavailable in this browser". This reuses `offlineStatus`, as the reviewer proposed, and adds no new initial strings. | Reproduced: with service workers blocked, the old banner said "still works". | Chromium: an uncontrolled tab shows "Offline · " plus the More status and never "still works"; a controlled tab (controller stubbed) shows "still works". The design-2026-10-21 assertion is updated (§4). |
| design-shell#4 | low | fixed | Global search no longer reports a failed or loading Evidence index as "No matches". When the download failed, it shows "Evidence index unavailable: evidence, studies and calculator worksheets were not searched." and a "Retry evidence download" button, with or without a query or results. Retry calls `useReferenceData().retry` and returns focus to the field. While loading with a query, it shows "No matches. Evidence index still loading." The sr-only status adds the same state, e.g. "3 results; Evidence index unavailable: …", and announces "still loading" only while a query is present. The reviewer's wording "protocols, calculators and trials were searched" would be wrong: the calculator worksheets also come from the reference download (`buildSearchIndex` reads `reference.calculators`). | Reproduced with the reference routed to HTTP 503: "moyamoya" gave "No matches". | Chromium: empty, no-match and with-results states; status text; Retry recovers without a reload and refocuses the input; loading state. |
| design-shell#5 | low | fixed | `ABBREVIATION_END` is now case-insensitive and adds the month abbreviations (Jan–Dec, Sep/Sept), ref, pt/pts and inj; a one-letter initial matches in either case. **Correction:** with the case-insensitive rule, an all-capital acronym such as "MT." or "PT." would no longer end a sentence, because `mt` (Mount) and `pt` are on the list. A sentence ending "…before MT. Then…" would then run on. An all-capital word of 2 or more letters therefore still ends a sentence. | Node at 4d13e0e reproduced both reviewer cases. All 92 shipped bottom lines are identical before and after. | Unit: "Dec. 22, 2025", "Approx. 40%", "Sept. 3 … Jan. 9", "Ref. 12", "before MT. Then", "to PT. Then", plus the existing cases. The existing all-topics bottom-line tests pass. |
| e2e:trials-calculators-search#2 | low | fixed | One normalizer, `normalizeSearch` in reference-search.js, with one alias table for Evidence, global search and the Calculators filter. New whole-word aliases: a-fib and AF → atrial fibrillation; "obstructive sleep apnea", "sleep apnoea" and OSA → sleep apnea; ABC/2 and "abc 2" → abc2; plural "direct oral anticoagulants". `matchesCalculatorSearch` applies it to the query and the text, and keeps the raw compact text so a partial abbreviation ("tn") still finds TNK. Exact over prefix: ABC/2 now matches only ICH volume, so Enter opens `#/encounter/ich-volume`. Generally, results whose every term is a whole word of the name or an alias now rank above prefix or partial matches (§3). | Reproduced in node: "obstructive sleep apnea" gave 0 results; "ABC/2" ranked ABCD² first; the Calculators filter gave nothing for "afib". | Unit: alias table; ABC/2, "abc 2" and "abc2" put ICH volume first and in the lead group; synthetic exact-alias over prefix-only cases (multi-word and 3-letter); Calculators-filter cases ("afib", "a-fib", "AF", the OSA forms, ABC/2, CHA₂DS₂, chadsvasc, stopbang, "tn", empty). |
| e2e:evidence-a11y-pwa#0 | low | fixed | Global search uses the shared normalizer for index fields and queries. NFKD already turns ₂ and ² into 2, so the separate ₂/² replacements were dropped. | Reproduced: "rt-PA dose" led with TRIDENT; "direct oral anticoagulant(s)" gave no matches; "t-PA" gave 149 results; "large vessel occlusion" did not list the EVT protocol. | Unit: rt-PA/alteplase, t-PA, DOAC(s), LVO, TNK, AFib, OSA and apnoea pairs give identical results; "rt-PA dose" finds Lytic dose and the dose table, not TRIDENT; LVO and "large vessel occlusion" lead with `protocol:evt`. |
| e2e:evidence-a11y-pwa#1 | low | fixed (keyword part: lead) | A letter-only term of 1 to 3 letters matches only at a word start, in both Evidence and global search (`hasTerm`, `wordStart`). "TIA" therefore skips "initiation" and "potential", and "AF" skips "after" and "safe". Terms with digits (e.g. "tr2" for TELE-REHAB-2's "TR-2") and longer terms still match anywhere, so type-ahead still works. AF and A-fib are aliased to atrial fibrillation. **Correction:** word-start matching alone hid prefixed abbreviations. "BP" lost the SBP-only topics (aSAH critical care, sICAS, stroke mimics, TRIDENT), "SAH" lost 2 aSAH-only topics, and "ICH" lost 18 sICH-only topics. The alias table now keeps each prefixed form and adds its base: sICH → "sich ich", aSAH → "asah sah", SBP/DBP → "sbp bp" / "dbp bp", NCCT → "ncct ct". "BP", "SAH", "ICH" and "CT" find them again, and "sICH" stays specific. The optional "posterior circulation LVO" keyword on `basilar-occlusion` is content I do not own (§5). | Reproduced: AF gave 67 topics (53 only via "after" or "safe"); TIA gave 37; A-fib included fibromuscular dysplasia. Now AF, A-fib and AFib each return the same 12 topics as "atrial fibrillation". TIA returns 16 topics, each naming TIA. The topics dropped for "ICH" now match only through "which" or "enrich", and for "CT" only through in-word text ("infarct", "direct", …). | Unit: synthetic word-start cases; AF/A-fib/AFib/af equal "atrial fibrillation" on shipped topics; every shipped TIA match names TIA; every shipped topic and study naming sICH, aSAH, SBP/DBP or NCCT is found by ICH, SAH, BP or CT; every "sICH" result names sICH. |
| e2e:evidence-a11y-pwa#2 | low | fixed | `.workspace-offline:empty + .case-bar { margin-top: 8px }`. The external links' 44 px boxes overhang the strip by 8 px, so a case bar directly below now starts under that overhang. When the offline note shows, it already brings its own 8 px top margin. I rejected a larger negative outline offset: it would cut into the link text, because the inline padding is only 8 px. | Measured at 390 px: the outline spanned 91–93 px and the case bar started at 90 px. At 820 and 1440 px: 134–136 px against 132 px. After the change, the outline ends at 93 / 136 px and the bar starts at 98 / 140 px. | Chromium at 390, 820 and 1440 px: the bottom edge of each link's outline is at or above the case bar's top. |
| e2e:evidence-a11y-pwa#3 | low | fixed (Protocols: report only) | A shell keyup handler fires when Tab lands in a `textarea` outside `#tabpanel-protocols`. It checks `tagName` and `closest()`; the earlier agent's `:not(#tabpanel-protocols *)` selector would throw in Chromium before version 88. It calls `scrollIntoView({block:'nearest'})`, which respects the root scroll padding that already reserves the docked nav and the update notice. It runs only for keyboard (Tab) focus, so a tapped field never moves under the pointer. The frozen Protocols "Safe Pause reference checklist" is excluded (§6). | Probe before the change: 4 Encounter text areas at 390×844 and 16 at 320×568 were partly under the nav. After: 0 at both sizes. | Chromium: at 390×844 and 320×568 the field clears the nav, and at 390×844 the update notice; the bottom edge plus 5 px of outline is clear and the top is below the case bar. A Tab keyup on the Protocols text area scrolls nothing. |
| e2e:evidence-a11y-pwa#4 | low | fixed | Evidence summaries get an `onFocus` handler. On keyboard focus (`:focus-visible`), if the row is taller than the space between the root scroll paddings (case bar and bottom chrome), it calls `scrollIntoView({block:'start'})`, so the title sits just below the case bar. Shorter rows keep the browser's own reveal, and a click never scrolls. | Probe before the change: 23 of 92 titles started under the case bar at 568×320. After: 0 at 568×320, 667×375 and 390×844. | Chromium at 568×320 (tall rows present) and 667×375: 40 rows each, no title under the case bar. |
| e2e:evidence-a11y-pwa#5 | low | fixed | After Later hides the notice, focus moves to the More summary in the next frame. More now carries the "Update" badge and is named "More utilities, update ready", so focus lands where the deferred update is held. | Reproduced with the reviewer's steps: `document.activeElement` was BODY. | Chromium: Enter on Later puts focus on the More summary named "More utilities, update ready". |
| e2e:evidence-a11y-pwa#6 | low | fixed | When the network fetch fails or returns a mismatched version, `loadReference()` falls back to the worker's precache, which an uncontrolled page can read from Cache Storage. It walks `caches.keys()` and accepts only a copy that passes `validReferenceData(envelope, APP_VERSION)`, so another release's copy is never used. Evidence and Calculators therefore work offline in the first-visit tab. When no valid copy exists, the Evidence message now names the cause: "…failed or is out of date, and this browser has no offline copy of this version. If offline, reconnect, then retry; Encounter entries stay in this session." | Reproduced in Chromium: with the reference routed to "connection refused", Evidence showed "unavailable". Now Evidence renders every topic and Calculators loads from a precached copy. A cached copy from version 0.0.1 is refused. | Chromium: first-session fallback for Evidence and Calculators; wrong-version copy refused; failure-message wording. The `Tools.jsx` message is outside my ownership (§5). |

Severity: reviewers rated all 12 findings low, and none changes a clinical value.

## 2. Evidence ledger

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-22, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| The 3 TIA card items are ungraded scientific-statement items, not guideline recommendations | src/Reference.jsx collapsed contents and heading; referenceText copy header | corrected | Amin HP et al. Diagnosis, Workup, Risk Reduction of Transient Ischemic Attack in the Emergency Department Setting: A Scientific Statement From the American Heart Association. Stroke 2023;54:e109–e121 — PMID 36655570, doi:10.1161/STR.0000000000000418 — 2023-01-19 | accessed 2026-10-22, PubMed metadata and abstract; archived transcription tia-ed-2023.json at 4f8e99d (secondary) | Title: "A Scientific Statement From the American Heart Association"; abstract: "This scientific statement focuses on…"; archive: `"documentType":"scientific-statement"`, `"gradingSystem":"ungraded"`, 81/81 items Statement/Ungraded | Labels and counts only. Item text, chips, sources and checkedAt are unchanged. |
| The 3 CVT card items are ungraded scientific-statement items | same | corrected | Saposnik G et al. Diagnosis and Management of Cerebral Venous Thrombosis: A Scientific Statement From the American Heart Association. Stroke 2024;55:e77–e90 — PMID 38284265, doi:10.1161/STR.0000000000000456 — 2024-01-29 | accessed 2026-10-22, PubMed metadata and abstract; archived transcription cvt-2024.json at 4f8e99d (secondary) | "This scientific statement provides an update of the 2011 American Heart Association scientific statement…"; archive: `"documentType":"scientific-statement"`, `"gradingSystem":"ungraded"`, 38/38 items Statement/Ungraded | As above. |
| Search synonyms: AF / A-fib = atrial fibrillation; OSA / obstructive sleep apnea / sleep apnoea = sleep apnea; ABC/2 = ABC 2; sICH ⊃ ICH, aSAH ⊃ SAH, SBP/DBP ⊃ BP, NCCT ⊃ CT | src/reference-search.js ALIASES (shared by Evidence, global search and the Calculators filter) | added | none: standard abbreviations used only to match search text; nothing displayed changes | n/a (search behaviour) | — | Matching only. No clinical text, score or threshold changed. |
| Basilar artery occlusion is reachable by an "LVO" search | basilar-occlusion topic keywords (content data, not owned) | flagged | not re-read today | not accessed | — | Left unchanged; proposed to the content owner in §5. |

## 3. Code changes and corrections

- `src/reference-search.js`:
  - exported `normalizeSearch` with the shared alias table
  - `wordStart`/`hasTerm` for short letter-only terms
  - additive aliases for prefixed abbreviations
  - `recommendationGroups()`
  - case-insensitive `ABBREVIATION_END` with month and other abbreviations; an all-capital acronym still ends a sentence
  - the referenceText header follows `recommendationGroups`
- `src/quick-search-index.js`:
  - imports `normalizeSearch`; the local normalize, its ₂/² replacements and its afib/tpa-only aliases are removed
  - short terms match at word starts
  - **exact tier:** a result whose every term is a whole word of its title or keywords (a name or an alias), or whose title equals the query, sorts above every partial or prefix result
  - the lead (Enter) still prefers a navigation result, but only one that is in the top tier and, if the top result holds the whole query as a phrase, holds it too
- `src/calculator-utilities.js`: `matchesCalculatorSearch` applies `normalizeSearch` to the query and the text, and keeps the raw compact text.
- `src/components/QuickSearch.jsx`: index-state hint, Retry and status line.
- `src/reference-resource.js`: precache fallback validated with `validReferenceData`.
- `src/Reference.jsx`: graded and ungraded counts and headings; keyboard reveal for tall rows; offline-aware failure message.
- `src/app.jsx`:
  - offline banner chosen from controller state and `offlineStatus`
  - Tab reveal for text areas outside Protocols
  - Later moves focus to More
  - to offset these bytes, the unreachable GCS branch of the Encounter tool gate is removed. `gcs` is already excluded by `!['nihss','mrs','crcl','gcs'].includes(route.tool)`, so the "GCS opens with ICH, SAH or CVT." string was dead. ICH volume and ICH severity keep "This calculator needs an ICH encounter." and "Set ICH".
- `src/design/shell.css`: one rule for the case bar's top margin, and the strip comment is updated.

**Corrections to the interrupted work.**

1. Exact-over-prefix ranking. The earlier agent gave +10 to a record whose keywords held the whole multi-word query. That did not implement "exact alias above prefix". A title-prefix record still outscored it (5n + 8 > 3n + 10 for two terms). It also wrongly counted part of a longer alias as exact: "intracerebral hemorrhage" was treated as an exact match for ICH severity, whose alias is "intracerebral hemorrhage score". Its synthetic test passed only because the "prefix" record did not match the query at all.
   - Measured over 1636 queries built from every shipped title, keyword, alias and calculator name, comparing the Enter target before and after: the +10 rule changed 30 Enter targets beyond the word-start changes. Several were worse:
     - "minor stroke" → ARAMIS instead of the minor-stroke topic
     - "intracerebral hemorrhage" → ICH severity instead of the ICH protocol
     - "lobar hemorrhage" → ENRICH
     - "cervical dissection" → FMD
   - I replaced it with the exact tier and phrase-aware lead described above. Against the earlier agent's version, 10 Enter targets changed, and each new target is the record named by the whole phrase: DIRECT-MT → the DIRECT-MT study instead of "Safety & decision review"; "CT perfusion" → the CT perfusion topic.
   - Against 4d13e0e, the Enter targets that changed are those the findings asked for, or that a partial match had caused:
     - ABC/2 → ICH volume
     - LVO and "large vessel occlusion" → EVT protocol
     - TENSION → a TENSION record instead of the BP protocol, which matched inside "hypertension"
     - EXTEND → the EXTEND study instead of the IVT card ("extended")
     - TRACE-2 → the TRACE-2 study instead of ICH volume ("intracerebral")
     - PRES → the RCVS/PRES topic instead of the BP protocol ("pressure")
   - The protocol-first design is kept wherever the protocol matches exactly: TIA, SAH, ICH score, NIHSS, BP targets and "tPA" lead as before.
2. Prefixed abbreviations: see e2e:evidence-a11y-pwa#1.
3. Acronym sentence end: see design-shell#5.

## 4. Tests and checks

New: `tests/shell-search-2026-10-22.test.jsx`, 69 tests. 61 run in node. 8 run in headless Chromium, built from source with esbuild and routed on `http://localhost:4314/`; no server is started. I ran the file against the 4d13e0e sources: 57 of 69 fail there. The 12 that pass guard behaviour that already worked and must not regress: "tn" finds TNK, "Is it a stroke?", "4.5 h", "before MT. Then", "to PT. Then", CHA₂DS₂, chadsvasc and stopbang in the Calculators filter, and the empty query. All 69 pass with the fixes. The probes that motivated the corrections (BP lost the SBP-only topics; DIRECT-MT led to "Safety & decision review") reproduced on the earlier agent's commit `3b74cae`.

Updated assertion: `tests/design-2026-10-21.test.jsx`, "says when it is offline…". That harness blocks service workers, so its tab is never controlled. The old expected text ("the workspace still works") is the defect described in design-shell#3. The test now expects "Offline · " followed by the More panel's status; the controlled-tab wording is tested in the new file.

## 5. For the lead (files I do not own)

1. `src/Tools.jsx` line 8. The calculator failure text does not name the offline cause either. Suggested patch, matching Evidence: replace `<p>The calculator download is unavailable or out of date.</p>` with `<p>The calculator download failed or is out of date, and this browser has no offline copy of this version. If offline, reconnect, then retry; Encounter entries stay in this session.</p>`. The precache fallback already lets this page load in the first-visit tab whenever the worker has installed.
2. Evidence content: optionally add the keyword "large vessel occlusion" or "posterior circulation LVO" to the basilar-occlusion topic, so an LVO search lists basilar artery occlusion. Keywords drive search only. I did not make the change: the topic data is outside my ownership, and I did not re-read a source for it today.
3. `src/calculator-utilities.js` ENCOUNTER_TOOLS (not mine): the ICH severity tool's aliases are "intracerebral hemorrhage score". Adding "ICH score" would make that the tool's own exact alias. Today "ICH score" + Enter already opens it, through the protocol-first lead, and the Evidence topic `neuroprognostication`, which carries the exact keyword "ICH score", ranks first within Evidence. This is optional.
4. `src/supplementary-calculator-definitions.js` ALIASES needs no change. The shared normalizer maps "obstructive sleep apnea", "sleep apnoea" and OSA to the STOP-BANG alias "sleep apnea".
5. Budget: see §8. The lazy-chunk delta exceeds my +600 B gzip cap by about 100 B.

## 6. Protocols observations (report only)

- The read-only "Safe Pause reference checklist" text area in the frozen Protocols tab has the same partial coverage as e2e:evidence-a11y-pwa#3: at 390×844 it spans about 740–929 px, and the docked nav starts at 775 px. The new shell Tab reveal deliberately skips `#tabpanel-protocols`, so Protocols behaviour is unchanged (tested). If the owner wants the reveal there too, removing the `!target.closest('#tabpanel-protocols')` check in `src/app.jsx` would extend it to that field. That is a scroll-only change, but it is the owner's call.
- In a tab the worker does not control, Protocols' lazily loaded quick reference cannot load offline unless it was opened before. The banner now says the tab needs internet. Nothing in Protocols was changed.
- The case bar now starts 8 px lower when it follows the external-links strip directly. This affects Protocols chrome only, not its content. Both Protocols tab locks pass (§8).

## 7. Unresolved uncertainties

- `navigator.serviceWorker.controller` decides the banner at render time. A tab becomes controlled without a reload only after an explicit update, and that update reloads the tab. So this is not a practical case.
- The Tab reveal relies on Chrome placing focus before keyup. It was verified in Chromium only; other browsers keep their own focus scrolling, and the handler can only add a scroll.
- Ranking: the exact tier and the phrase-aware lead were checked against 1636 queries drawn from shipped content, but not every possible query. Single-word queries that equal an alias now lead with that alias's record, e.g. "exam" → NIHSS ("neurologic exam") rather than the Examination section, which matched only by prefix. That follows the requested rule, exact alias above prefix.
- "direct oral …" typed slowly: the DOAC alias still expands to "direct oral anticoagulant", so Evidence type-ahead stays smooth. I rejected the alternative canonical token "doac", which would have broken the partial query "direct oral".

## 8. Final check results

Run on the final source tree (commit `db1df19` plus this report), after `git clean -fqX chunks && npm run build`. The build left `data/` unchanged.

- `npx vitest run`: 126 files passed; 2552 tests passed, 3 skipped, 0 failed. The 4d13e0e baseline was 125 files and 2483 passed; the difference is the new 69-test file.
- `npm run test:protocol-source`: PASS.
- Protocols tab locks on the final build, port 4310:
  - `test:protocol-tab`: PASS, 46 fixture/sub-tab captures at desktop 1440×900
  - `test:protocol-tab:phone`: PASS, 46 fixture/sub-tab captures at phone 390×844
  - Both also passed on the build of the preceding commit `a14339d`, at 46 captures each. The only later source change is the Tab-reveal check in `src/app.jsx` (`tagName`/`closest`).
- Validators: `check:clinical-claims` PASS (4 bounded groups, 31 occurrences, 0 exports). `content:validate` PASS (26 retained tools, 25 source/limits records, 16 trial profiles, 92 topics, 88 studies; its "no genuine clinical review date" notes are pre-existing). `evidence:validate` PASS (43 citations, 12 claims, 10 recommendations, 4 guidelines, 9 topics). `validate:citations` passed (43 rows, 43 PMIDs consistent). `validate:inline-citations` passed (15 PMIDs, 0 warnings). `check:leak-guard`: no institutional or PHI-adjacent content found. I did not modify clinical content or data; these validators confirm nothing regressed.
- Budget (`npm run check:asset-budget`: every check within budget). Deltas are measured against the committed 4d13e0e outputs:

  | check | 4d13e0e | final | delta |
  |---|---|---|---|
  | initial gzip | 130536 | 130584 | +48 B (cap +120: within) |
  | initial raw | 384554 | 384571 | +17 B |
  | all offline JS gzip | 260509 | 261257 | +748 B |
  | all offline JS raw | 869427 | 871028 | +1601 B |
  | tailwind.css | 106849 | 106910 | +61 B |
  | SW precache | 2135416 | 2137078 | +1662 B |

  The lazy chunks add +700 B gzip against a cap of +600, so they are over by about 100 B. By chunk: the shared reference-search chunk +329, Reference +217, QuickSearch +136, the calculator-utilities chunk +21, Tools −1. Trims I tried in my own files saved too little to matter: a shorter heading expression (kept), and a plural helper (reverted, because it added 10 B gzip). The remaining bytes are the alias table, word-start matching, the exact tier, the graded/ungraded counts, the precache fallback and the focus handlers. The lead decides whether to accept the overage.
