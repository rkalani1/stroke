# Trials review — 2026-10-21 (unit: trials)

Scope: the Trials surface (`#/trials`, `#/trials/tables`, `#/trials/database`), its 16 study profiles, the screening engine, the Encounter import and every copy/summary output. The Protocols tab was not touched. All registry records were read on 2026-10-21 through the ClinicalTrials.gov connector (`get_trial_details`, full record) and its search index (`search_trials`, exact-day `AREA[LastUpdatePostDate]` queries). The FASTEST Part 1 result was read as a PubMed abstract.

## 1. Scope inventory

**Surfaces** (`src/Trials.jsx`): three tabs.

- **Screener** (`src/components/TrialScreener.jsx`). It has four steps: classification (ischemic, TIA, ICH); timing (6 onset presets, an exact-hours field and a live Encounter LKW anchor); key facts, followed (since the follow-up) by a collapsed "Study-specific facts" section; and an optional exclusion review with 41 refiner items. Results fall into four groups: potential match, insufficient information, later (before the window or not yet recruiting) and does not meet documented criteria. Each card has registry links, chips and an expandable confirm/met list. The tab also offers a copy button for the summary, a summary preview and a details modal.
- **Tables** (`src/components/EligibilityTables.jsx`, `src/evidence/eligibilityTables.js`): 6 phase tables. Ischemic acute has 3 studies, inpatient 5 and outpatient 4. ICH acute has 3, inpatient 3 and outpatient 2. Each table can be copied as HTML or Markdown.
- **Database** (`StudyDatabase` in `TrialScreener.jsx`): search by acronym, name, NCT or registry acronym, plus classification and status filters.
- Outside this unit's files, global search (`QuickSearch.jsx`, shell-owned) indexes the 16 profiles through `enrollmentLabel`. It was read, not changed.

**Profiles** (`src/evidence/screenerTrials.json`): 16 in total, 14 screened and 2 reference-only. Registry status today: 13 RECRUITING (including PICASSO), 1 NOT_YET_RECRUITING (CLARITY) and 2 ACTIVE_NOT_RECRUITING (CAPPRICORN-1, CAPTIVA).

| Profile | NCT | App status | Screened | Criteria / exclusions / manual prompts |
|---|---|---|---|---|
| STEP | NCT06289985 | enrolling | yes | 6 / 7 / 3 |
| SISTER | NCT05948566 | enrolling | yes | 6 / 3 / 3 |
| PICASSO | NCT05611242 | enrolling | reference-only (Tables + Database) | 1 / 0 / 0 |
| TESTED | NCT05911568 | enrolling | yes | 8 / 1 / 2 |
| MINUTE | NCT07260916 | enrolling | yes | 8 / 4 / 3 |
| FASTEST-2 | NCT07227246 | enrolling | yes | 7 / 4 / 3 |
| CLARITY | NCT07174414 | soon | yes | 5 / 3 / 3 |
| INTERCEPT | NCT05723926 | enrolling | yes | 4 / 4 / 7 |
| ASPIRE | NCT03907046 | enrolling | yes | 4 / 3 / 2 |
| SATURN | NCT03936361 | enrolling | yes | 6 / 4 / 2 |
| CAPPRICORN-1 | NCT06393712 | closed | yes (always "closed") | 2 / 2 / 2 |
| SCOUTS-3 | NCT06722755 | enrolling | yes | 4 / 5 / 2 (was 1) |
| VERIFY | NCT05338697 | enrolling | yes | 7 / 6 / 2 |
| MR-PICS | NCT06506279 | enrolling | yes | 6 / 6 / 5 |
| TELE-REHAB-2 | NCT06682429 | enrolling | yes | 6 / 5 / 3 (was 0) |
| CAPTIVA | NCT05047172 | closed | reference-only (Database) | 1 / 0 / 0 |

**Criterion evaluators** (`src/evidence/screener-eval.js`):

- Operators: `== != >= <= > < between in`, plus a composite `or` with branches.
- Onset: preset bands use the endpoint rule, so a band that only touches a limit counts as outside it. A band that starts before a window opens counts as "before window". The Encounter LKW anchor stays live.
- Numeric acceptance (now `numericFact`): scores (NIHSS 0–42, ASPECTS 0–10, GCS 3–15, pre/current mRS 0–6, and since the follow-up ABCD2 0–7) must be whole numbers. Age must be 0–120 and ICH volume 0–300 mL. Anything else stays unknown.
- Fields used: age, classification, onsetHours/Days, nihss, aspects, gcs, preMrs, currentMrs, vessel, ichLocation, ichVolume, statin, afibHistory, afOrFlutterHistory, takingOac, abcd2, antithromboticSoc, presentedWithin24h, unilateralSymptomatic, exUeWeakness, self_consent, language, rehab, availability_54w, and 43 `ex*` exclusion facts. The refiner offers 41 of them; the 2 used only by the closed CAPPRICORN-1 are not offered.
- At first review, ten of these facts had no screener control, so they always stayed unknown in the UI: presentedWithin24h, unilateralSymptomatic, exUeWeakness, self_consent, language, rehab, currentMrs, availability_54w, abcd2 and antithromboticSoc. abcd2 and antithromboticSoc were not even passed to the engine.
- Since the follow-up, every modeled fact has a control (a test checks this for each screened study and each classification it screens). The ten facts sit under "Study-specific facts". Each appears only for the classifications whose screened profiles test it, derived from the profiles: ischemic 9, TIA 2 (ABCD2 and antithrombotic therapy, both CLARITY), ICH 3. Each control names the studies that read it.

**Encounter imports** (`src/evidence/screener-prefill.js`, explicit "Use these facts" only):

- Diagnosis maps to ischemic, ICH or TIA. SAH, CVT, mimic and other are reported as unmodeled, with no import.
- LKW is imported as a live anchor. Unknown, future, impossible, skipped-hour or ambiguous repeated-hour times are not imported, and a discovery time is never used as onset.
- Age 0–120 is imported.
- NIHSS is imported for ischemic stroke and ICH when the itemized exam is complete or a reported total of 0–42 is entered. It is not imported for TIA. Since the follow-up, the count of untestable (UN) items that an itemized total leaves out is carried with it (TR-13).
- For ICH: a complete reviewed GCS; the threshold-safe ABC/2 volume (not imported when a unit warning is present); and an infratentorial location.
- For ischemic stroke: the vessel (M1, ICA + M1 or M2 with its segment; ACA, PCA, vertebral, basilar and Other import as "other"; None as no occlusion; ICA alone and unsegmented M2 are not imported) and ASPECTS 0–10.
- Pre-mRS 0–5, except for TIA.
- AF documented: yes or no.
- Anticoagulant at onset: DOAC, VKA, LMWH or none. "None" is not imported when the medication list conflicts with it. A last dose more than 7 days ago clears use at onset, and a valid last-dose time answers the 7-day and 48-hour exclusions.
- None of the ten study-specific facts is imported. The Encounter's ABCD² (`dapt.abcd2`, a validated 0–7 integer recorded for TIA) would map cleanly, but it was left out as the lead preferred. It is listed in section 7 as a candidate.

**Outputs**: the copyable screening summary (`buildBriefingNote`) and its preview; the table exports (HTML and Markdown); the details modal (`TrialSourceContext`); the Trials header and page caveat; global-search subtitles; and `data/trials.json`, which is generated and not committed.

## 2. Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| TR-01 | Medium | TELE-REHAB-2 was the only screened profile without registry items to confirm (`manualPending` empty), and its source gap mentioned only inclusion tests. The registry's baseline tests (ARAT 18–44, Box & Block) and its exclusions were never prompted. These cover depression, MoCA, communication, spasticity, vision, English/Spanish, the 1.5 h domicile rule, MRI, isolation, a concurrent study and the pregnancy test. An engine-level fully answered screen read "0 to confirm". | Corrected |
| TR-02 | Medium | The copied screening summary printed numeric entries that every criterion rejects as if they were used inputs: "age 150", "NIHSS 3.5", "NIHSS 50", "volume 1e3 mL", "age -5". This contradicts the following line, "Anything not listed was not entered and remains unknown". | Corrected |
| TR-03 | Low | An Encounter-anchored onset printed clock times only. Across midnight, "LKW 25.0 h (Encounter LKW 11:00, as of 12:00)" reads like 1 h. A repeated daylight-saving hour was printed without the offset the notes use. | Corrected |
| TR-04 | Low | A negative exact interval (−1 h) showed "Exact interval entered." while the engine treated timing as unknown. | Corrected |
| TR-05 | Low | Age, NIHSS and volume inputs gave no sign that an out-of-range or fractional entry is ignored. | Corrected (hint plus `aria-invalid`) |
| TR-06 | Low | MINUTE's met label asserted "Randomization is <=16h since last known well" from the time at screening. The registry also requires randomization within 2 h of arrival. This is the same class as 7.8.0 TA-F8 (STEP). | Corrected |
| TR-07 | Low | SISTER omitted registry inclusion 4c (CT hypodensity plus perfusion core smaller than the penumbra). It also omitted part of exclusion 5: planned breastfeeding within 3 months and a positive pregnancy test. | Corrected |
| TR-08 | Low | Registry exclusions were missing from the confirm prompts: ASPIRE active infective endocarditis; SCOUTS-3 exclusions 6, 8, 10–12; VERIFY procedure windows (exclusion 15); MR-PICS GDS, C-SSRS, MoCA, neglect, implanted devices, infection, bleeding/thrombosis risk and outside therapy. | Corrected |
| TR-09 | Low | MR-PICS `sourceHypothesisText` ("To assess the safe use…") is not in the current registry record, which describes "an open prospective feasibility study". | Corrected |
| TR-10 | Info | Three records were updated on the registry after the 7.8.0 check: SISTER (2026-10-19), and CAPPRICORN-1 and CAPTIVA (2026-10-20). Version history is not available through the connector, so what changed cannot be identified. Every stored field was compared with today's full record and none differs. | Verified (dates updated) |
| TR-11 | Info | "Insufficient information" told users to "answer" facts that had no screener control (the 10 facts above). VERIFY, TELE-REHAB-2, MR-PICS, SCOUTS-3 and TESTED could therefore never reach "potential match" in the UI, and neither could CLARITY's completeness. That was conservative. | First pass: wording corrected. Follow-up (lead's decision): controls added. Each study can now reach "potential match" with its registry items still listed to confirm. |
| TR-12 | Info | FASTEST-2: the registry describes Part 2 as "an extension of the FASTEST Trial". The Part 1 registry record (NCT03496883, ACTIVE_NOT_RECRUITING) and its Lancet 2026 result are separate. | Added / verified |
| TR-13 | Low | An imported Encounter NIHSS total that excludes untestable (UN) items is shown without a UN note in the import banner and the summary. | Corrected (follow-up). The Encounter's own count now appears in both, e.g. "NIHSS 7 (excludes 2 untestable items)". The note is dropped once the NIHSS is edited, or when a reapply no longer imports it. |
| TR-14 | Info | The ABC/2 volume import is threshold-safe: a raw 19.996875 mL imports as 19.9, so MINUTE's ≥ 20 mL is not met. Confirmed by test. | Verified |
| TR-15 | Info | README line 14 still says "re-verified against ClinicalTrials.gov on 2026-10-17". README is outside this unit's scope. | For the lead |
| TR-16 | Low | The copied summary listed candidates by NCT number only. Cards, modal and tables link directly to `https://clinicaltrials.gov/study/<NCT>`, but the copied text did not. | Added: one "Registry record:" line per candidate |
| TR-17 | Info | No record has posted results (`has_results` false for all 16 and for NCT03496883). FASTEST Part 1's result is the journal report only. | Verified |
| TR-18 | Low | Follow-up. CLARITY's `abcd2` (TIA pathway, "ABCD2 score ≥6") and `antithromboticSoc` were missing from the screener state and the engine inputs. CLARITY could not be fully answered even outside the UI, and ABCD2 had no range check. | Corrected. Both are passed to the engine, and ABCD2 must be a whole number 0–7. |
| TR-19 | Low | Follow-up. SCOUTS-3 stored the inclusion "On or moving to inpatient rehabilitation with anticipated length of stay at least 5 nights", which is not in today's registry inclusion list. The requirement comes from the description ("recruited upon IPR admission") and exclusion 9 ("Anticipated inpatient rehabilitation length of stay < 5 nights"). | Corrected. The inclusion is attributed to the description, exclusion 9 is added, and the met label and source gap are reworded. |
| TR-20 | Low | Follow-up. MR-PICS stored "available … (54 weeks) for in person visits". Today's registry says "Available for the duration of the study, 54 weeks for multiple visits (38 weeks implanted and 16 weeks post-explant follow-up)". | Corrected (inclusion text and the met and to-confirm labels) |

No filter defect produced a false potential match. Tri-state behaviour held throughout the audit:

- Invalid or missing entries stay unknown.
- Partial Encounter data never produced a potential match in 400 seeded combinations.
- Registry status is always labelled "(registry)" and never as local activation.
- After the follow-up, a potential match still requires every modeled criterion and exclusion to be answered. No study-specific fact is imported from the Encounter, so the 400-combination invariant still holds. CLARITY can be fully answered, but it stays under "Later" while the registry says NOT_YET_RECRUITING.

## 3. Changes and reasons

Commits (branch `worktree-agent-aa2e74000fc2e9de6`):

1. `unit(trials): re-verify all 16 registry records on 2026-10-21` (`src/evidence/screenerTrials.json` plus date assertions).
   - All 16 `verificationDate` values are now 2026-10-21. Every record was re-read today.
   - Status sentences were rewritten.
   - Last-update dates for SISTER, CAPPRICORN-1 and CAPTIVA were re-established; the other 13 were re-established unchanged.
   - In-text check dates (CLARITY, PICASSO, FASTEST Part 1) were updated.
   - Profile corrections TR-01 and TR-06 to TR-09, plus the FASTEST extension note (TR-12).
2. `unit(trials): truthful summary and timing for rejected entries` (`src/evidence/screener-eval.js`, `src/components/TrialScreener.jsx`, new tests).
   - TR-02: `numericFact()` holds the acceptance rules and is shared by evaluation, the summary and the UI hint.
   - TR-03: `wallTime()` reuses the notes' `formatRecordedInstant`.
   - TR-04, TR-05, TR-11.
3. `unit(trials): quote SCOUTS-3 sedation and MR-PICS suicide-scale exclusions as registered`. This brings prompt wording closer to the registry text.
4. `unit(trials): direct registry link per candidate in the copied summary` (TR-16).
5. `unit(trials): accept only representable instants as an LKW anchor`. This guards commit 2: the dated onset text uses `toISOString`, which would throw for a finite timestamp outside the Date range. Such an anchor now falls back to the stored interval.
6. `unit(trials): keep key-fact inputs aligned when flagged`. A hint placed below the Volume input made its grid row taller, which pushed the neighbouring "ICH location" select out of line (checked at 390 px, dark theme). The hint now sits in the label block above the input, so both controls stay bottom-aligned.
7. `unit(trials): 2026-10-21 review report` (this file).

Follow-up commits, after the lead merged commits 1–7:

8. `unit(trials): follow today's SCOUTS-3 and MR-PICS registry wording` (TR-19, TR-20; `src/evidence/screenerTrials.json`).
9. `unit(trials): controls for study-specific facts and the untestable NIHSS note` (TR-11 follow-up, TR-18, TR-13). Files: `src/evidence/screener-eval.js`, `src/evidence/screener-prefill.js`, `src/components/TrialScreener.jsx` and the tests.
   - `STUDY_FACTS` is derived from the profiles with `studiesUsing()`. An or-branch whose own classification rule excludes a classification does not count, so CLARITY's ABCD2 is offered for TIA only.
   - `VISIBLE_FACTS` now covers key facts and study-specific facts. The copied summary prints a study fact only when it is shown and answered, as "label: option chosen". An invalid number uses the same "(invalid entry; treated as unknown)" wording.
   - Booleans are unknown/yes/no, defaulting to unknown. Current mRS (0–6) and ABCD2 (0–7) use `numericFact` with the existing hint and `aria-invalid` pattern.
   - The lists use the values the criteria test: language English/Spanish/Neither (VERIFY `in ["english","spanish"]`) and rehab Yes/No (SCOUTS-3 `== "yes"`). `antithromboticSoc` is tested as a boolean (`== true`), so it is a yes/no control, not a list.
   - The section header counts only entries the criteria can read.
   - The classification switch moved into the pure `withClassification()`. Hidden study facts return to unknown with the other hidden facts.
   - TR-13: `untestableNote()` is shared by the import banner and the summary. A manual NIHSS entry resets the count.
   - The "Insufficient information" description now reads "confirm and enter it".
10. `unit(trials): report the TR-11 follow-up and TR-13` (this update).

No change to locked files or exports. `npm run test:protocol-source` PASS after each change. CSS: none. The hints use the existing utilities `block`, `font-normal`, `text-xs`, `text-crit-700`, `dark:text-crit-300` and `whitespace-nowrap`, so tailwind.css is unchanged.

**Byte delta** (fresh `npm run build` of commit 1a5f9d4, then `npm run check:asset-budget:json`; "before" is the committed 7.8.0 bundle measured the same way):

| Measure | Before | After | Delta | Budget | Used |
|---|---|---|---|---|---|
| Initial JS (gzip) | 127,374 | 127,372 | −2 | 131,072 | 97.18% |
| Initial JS (raw) | 375,274 | 375,274 | 0 | 385,024 | 97.47% |
| All offline JS (gzip) | 254,900 | 256,049 | +1,149 | 262,144 | 97.67% |
| All offline JS (raw) | 852,513 | 855,574 | +3,061 | 876,544 | 97.61% |
| tailwind.css | 119,694 | 119,694 | 0 | 122,880 | 97.41% |
| SW precache (58 entries) | 2,335,485 | 2,338,546 | +3,061 | 2,411,724.8 | 96.97% |

All budgets pass, with no manifest problems and no missing precache entries. The whole raw increase sits in two deferred chunks that `app.js` loads only through `import()`:

- The shared screener chunk (profile data and engine, used by Trials and global search): +2,487 raw, +904 gzip.
- The Trials chunk (screener UI): +574 raw, +247 gzip.

Per-chunk gzip figures use level 9. `app.js` keeps the same length. Its gzip size moves by −2 only because the deferred chunk names changed. Most of the increase is registry-specific confirmation text, and shortening the MR-PICS summary offset part of it.

**Follow-up byte delta.** Measured on a fresh `npm run build` of the follow-up source, then `npm run check:asset-budget:json`. "Before" is the merged state (the build of 1a5f9d4 above).

| Measure | Before | After | Delta | Budget | Used | Cumulative vs 7.8.0 |
|---|---|---|---|---|---|---|
| Initial JS (gzip) | 127,372 | 127,373 | +1 | 131,072 | 97.18% | −1 |
| Initial JS (raw) | 375,274 | 375,274 | 0 | 385,024 | 97.47% | 0 |
| All offline JS (gzip) | 256,049 | 257,118 | +1,069 | 262,144 | 98.08% | +2,218 |
| All offline JS (raw) | 855,574 | 859,247 | +3,673 | 876,544 | 98.03% | +6,734 |
| tailwind.css | 119,694 | 119,694 | 0 | 122,880 | 97.41% | 0 |
| SW precache (58 entries) | 2,338,546 | 2,342,219 | +3,673 | 2,411,724.8 | 97.12% | +6,734 |

All budgets pass. All offline JS (gzip) has 5,026 bytes left. The increase is again only in deferred chunks:

- Shared screener chunk: +2,363 raw, +791 gzip. This is the field table (labels and options), the derivation, `withClassification`, the summary lines and the registry text.
- Trials chunk: +1,310 raw, +278 gzip. This is the section, the study-name notes and the NIHSS reset.
- The QuickSearch chunk is unchanged in size.

To keep growth down, each label is defined once and the summary reuses it as "label: option" instead of separate sentences. That brought the gzip growth from +1,335 to +1,069. No CSS changed: the new markup uses existing utilities only.

## 4. Evidence ledger (accessed 2026-10-21)

Scope labels: "registry" means the full record via `get_trial_details`. "Registry index" means the search-index field from an exact-day `AREA[NCTId]… AND AREA[LastUpdatePostDate]RANGE[d,d]` query. The method was calibrated on STEP's known 2025-12-04 date. A combined `RANGE[2026-10-17,MAX]` query over all 16 NCT IDs returned only SISTER, CAPPRICORN-1 and CAPTIVA. Exact-day queries then placed them on 2026-10-19 and 2026-10-20, and none had a date on or after 2026-10-21. "Abstract" means the PubMed abstract.

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| STEP profile: status, EVT-expansion domain criteria, last update | screenerTrials.json STEP | verified | StrokeNet Thrombectomy Endovascular Platform — NCT06289985 — last update posted 2025-12-04 | accessed 2026-10-21, registry + registry index | "Presentation to enrolling hospital within 24 hours of last known well/stroke onset"; "Non-dominant/Co-dominant M2 (defined as serving < 50% of entire overall MCA territory)"; "NIHSS > =8" | RECRUITING; no update after 2025-12-04. Only the check date changed |
| SISTER profile; inclusion 4c and exclusion 5 | SISTER exactInclusionCriteria[2], exactExclusionCriteria[4], exPregnancy labels, manualPending[0] | corrected | Strategy for Improving Stroke Treatment Response (SISTER) Trial — NCT05948566 — last update posted 2026-10-19 | accessed 2026-10-21, registry + registry index | "If CT hypodensity is present … should be smaller than perfusion-based volume (area of Tmax>6s minus CBF<30%)"; "women who are breastfeeding or plan to breastfeed within 3 months … or have a positive urine or serum pregnancy test" | Updated after 2026-10-17; what changed is not identifiable. All previously stored fields still match. registryLastUpdatePosted 2026-10-02 → 2026-10-19 |
| PICASSO reference profile: arm list and criterion 3 vs 9 conflict | PICASSO sourceGaps | verified | Proximal Internal Carotid Artery Acute Stroke Secondary to Tandem or Local Occlusion Thrombectomy Trial — NCT05611242 — last update posted 2026-10-02 | accessed 2026-10-21, registry + registry index | interventions "MT+CAS with IV-AP", "MT+CAS with PO-AP", "MT+CAT with PO-AP"; "Randomization will be 1:1"; criterion 9 "With or without intracranial vascular occlusion" | Conflict and arm question remain open (confirm with study team). Not screened |
| TESTED profile | TESTED | verified | Treatment With Endovascular Intervention for STroke Patients With Existing Disability — NCT05911568 — last update posted 2026-09-02 | accessed 2026-10-21, registry + registry index | "mRS 3-4, for at least 3 months prior to stroke onset"; "ASPECT score ≥3 or MRI ASPECT score ≥4"; "NIH Stroke Scale score ≥6" | Observational; unchanged |
| MINUTE onset label must not assert a randomization time | MINUTE onsetHours matchedLabel/error | corrected | Minimally Invasive Neuroendoscopic Ultra-Early Targeted ICH Evacuation (MINUTE) Trial — NCT07260916 — last update posted 2026-09-15 | accessed 2026-10-21, registry + registry index | "Randomization within 16 hours from LKW and within 2 hours of arrival to the randomizing center." | Label: "Within 16 h of LKW at screening (registry: randomization ≤ 16 h from LKW and ≤ 2 h of arrival)". Other criteria unchanged |
| FASTEST Part 2: relation to Part 1 (extension wording) | FASTEST-2 sourceGaps | added | FASTEST Trial – Part 2 — NCT07227246 — last update posted 2026-08-20 | accessed 2026-10-21, registry + registry index | "FASTEST Part 2 is an extension of the FASTEST Trial where the subgroups include those treated within 2 hours with a positive spot sign … or … within 90 minutes" | Extension wording added. The profile's criteria and exclusions (UFH with abnormal PTT, lactating) were re-read and are unchanged |
| FASTEST Part 1 registry status | FASTEST-2 sourceGaps | verified | FASTEST (Part 1) — NCT03496883 | accessed 2026-10-21, registry | status ACTIVE_NOT_RECRUITING; primary outcome "Modified Rankin Scale (mRS)", 180 days | Separate record from Part 2 |
| FASTEST Part 1 published result | FASTEST-2 sourceGaps | verified | Broderick JP et al. Recombinant factor VIIa versus placebo for spontaneous intracerebral haemorrhage within 2 h of symptom onset (FASTEST). Lancet 2026;407(10530):773-783 — PMID 41653933, doi:10.1016/S0140-6736(26)00097-8 — 2026-02-04 | accessed 2026-10-21, abstract | "met the prespecified stopping criteria for futility at the second interim analysis"; "adjusted common odds ratio 1·09 [95% CI 0·79-1·51]"; "15 (<5%) … four (1%) … (relative risk 3·41 [95% CI 1·14-10·15]"; "-3·7 mL" | Emerging evidence, not a guideline recommendation. PubMed searches on 2026-10-21 found no correction: 2026 titles naming FASTEST or factor VIIa, Lancet "Department of Error" notices since 2026-02 and Erratum-type records. PMC13005960 full text not read |
| CLARITY profile | CLARITY | verified | Cilostazol for Prevention of Recurrent Stroke Trial — NCT07174414 — last update posted 2026-10-15 | accessed 2026-10-21, registry + registry index | "≥40 years"; "Ischemic stroke or high-risk TIA (ABCD2 score ≥6)"; "Atrial fibrillation, mechanical heart valve, or left ventricular assist device" | NOT_YET_RECRUITING with estimated start 2026-10; status may change soon |
| INTERCEPT timing groups and exclusions | INTERCEPT | verified | Carotid Implants for PreveNtion of STrokE ReCurrEnce … — NCT05723926 — last update posted 2026-08-19 | accessed 2026-10-21, registry + registry index | "Group 3: Patient was on OAC at time of index stroke, with index stroke occurring 6 to 52 weeks from enrollment" | Boundaries 41/42/364/365 days tested |
| ASPIRE active infective endocarditis | ASPIRE sourceGaps[0], manualPending[1] | added | Anticoagulation in ICH Survivors for Stroke Prevention and Recovery — NCT03907046 — last update posted 2026-05-08 | accessed 2026-10-21, registry + registry index | "Active infective endocarditis"; "Can be randomized within 14-180 days after ICH onset" | Was not mentioned anywhere in the profile |
| SATURN profile | SATURN | verified | STATINS USE IN INTRACEREBRAL HEMORRHAGE PATIENTS — NCT03936361 — last update posted 2026-04-21 | accessed 2026-10-21, registry + registry index | "Randomization can be carried out within 7 days of the onset of the qualifying ICH"; "Pre-morbid mRS >3" | Unchanged |
| CAPPRICORN-1 profile | CAPPRICORN-1 | verified | A Phase 2 Trial of ALN-APP in Patients With Cerebral Amyloid Angiopathy — NCT06393712 — last update posted 2026-10-20 | accessed 2026-10-21, registry + registry index | status ACTIVE_NOT_RECRUITING; "previous clinical intracerebral hemorrhage (ICH) with onset less than 90 days prior to anticipated randomization" | Updated after 2026-10-17; the change is not identifiable and every stored field still matches. 2026-09-18 → 2026-10-20 |
| SCOUTS-3 exclusions 6, 8, 10–12 | SCOUTS-3 manualPending[1] | added | Optimizing Adherence to the Treatment of Sleep Apnea Among Patients With Stroke Undergoing Inpatient Rehabilitation (SCOUTS3) — NCT06722755 — last update posted 2026-08-13 | accessed 2026-10-21, registry + registry index | "History of pneumothorax, bullous emphysema or other serious co-morbid conditions which limit CPAP use"; "benzodiazepine, barbiturate, general anesthesia, or conscious sedation within the prior 48 hours"; "possible CSF leak or pneumocephalus within past 3 months" | Consent-giver language prompt unchanged |
| VERIFY procedure windows | VERIFY manualPending[1] | added | Validation of Early Prognostic Data for Recovery Outcome After Stroke — NCT05338697 — last update posted 2026-08-20 | accessed 2026-10-21, registry + registry index | "Unable to perform behavioral assessments within 48-120 hours … Unable to receive TMS within 72-168 hours or get MRI within 48-168 hours" | 24–96 h consent window unchanged |
| MR-PICS summary and missing exclusions | MR-PICS sourceHypothesisText, manualPending[4] | corrected | Motor Recovery Through Plasticity-Inducing Cortical Stimulation — NCT06506279 — last update posted 2026-04-13 | accessed 2026-10-21, registry + registry index | "We will be structuring this study as an open prospective feasibility study"; "Severe Neglect as measured by NIH Stroke Scale Question 11 score of 2"; "no occupational, physical, or speech therapy is permitted apart from that provided by the study protocol" | Previous summary text is not in the current record (no version history) |
| TELE-REHAB-2 registry items to confirm | TELE-REHAB-2 manualPending (new), exPregnancy labels, exactExclusionCriteria, sourceGaps[0] | corrected | Telerehabilitation In The Home After Stroke (TR-2) — NCT06682429 — last update posted 2026-10-09 | accessed 2026-10-21, registry + registry index | "Action Research Arm Test score 18-44 (out of 57)"; "Montreal Cognitive Assessment score <22"; "Subject lacks sufficient English or Spanish"; "within 1.5-hr drive of the central study site"; "women of child-bearing potential must have a negative pregnancy test" | Listed for confirmation, not modeled |
| CAPTIVA reference profile | CAPTIVA | verified | Comparison of Anti-coagulation and Anti-Platelet Therapies for Intracranial Vascular Atherostenosis (CAPTIVA) — NCT05047172 — last update posted 2026-10-20 | accessed 2026-10-21, registry + registry index | ACTIVE_NOT_RECRUITING; interventions "Ticagrelor + Aspirin", "Rivaroxaban + Aspirin", "Clopidogrel + Aspirin", "Risk Factor Management"; two primary outcomes "Up to 12 months" | Updated after 2026-10-17; the change is not identifiable and every stored field still matches. 2026-10-13 → 2026-10-20 |
| All 16 check dates and status sentences | all externalMetadata.verificationDate and sourceGaps | corrected | all 16 records above | accessed 2026-10-21, registry + registry index | each full record read on 2026-10-21 | All set to 2026-10-21. Page caveat now "registry checked 2026-10-21" |
| Summary printed rejected numbers as used facts (TR-02) | screener-eval.js buildBriefingNote, numericFact | corrected | repository definition: src/evidence/screener-eval.js SCORE_RANGES / VALUE_RANGES (not a clinical source) | accessed 2026-10-21, repository source | before: "Inputs: Hemorrhage (ICH) · LKW unknown · age 150" | Now "age 150 (invalid entry; treated as unknown)"; accepted values print as read ("age 70") |
| Anchored LKW across midnight / repeated DST hour (TR-03) | screener-eval.js onsetSummary, wallTime | corrected | repository convention: src/clinical/timestamp.js formatRecordedInstant ("a UTC offset is added only when that local clock time repeats") | accessed 2026-10-21, repository source | before: "LKW 25.0 h (Encounter LKW 11:00, as of 12:00)" | Now dates both ends across midnight; "01:30 (UTC−07:00)" for a repeated hour |
| Invalid exact interval shown as entered (TR-04) | TrialScreener.jsx TimingSection | corrected | repository definition: screener-eval.js onsetToHours | accessed 2026-10-21, repository source | "-1" → hint "Exact interval entered." | Now "Not a valid interval; timing remains unknown." with aria-invalid |
| Rejected key-fact entries not flagged (TR-05) | TrialScreener.jsx NumberFact | added | repository definition: screener-eval.js numericFact | accessed 2026-10-21, repository source | age "150", NIHSS "3.5" | Hint "Treated as unknown: enter 0–120" / "a whole number 0–42" / "0–300 mL", linked by aria-describedby |
| "Answer it" for facts without a control (TR-11) | TrialScreener.jsx insufficient-information description | corrected | repository: VISIBLE_FACTS / KeyFacts controls | accessed 2026-10-21, repository source | 10 modeled facts have no control | First pass: wording "confirm it". Follow-up: controls added (rows below); wording now "confirm and enter it" |
| Copied summary lacked direct registry links (TR-16) | screener-eval.js buildBriefingNote | added | ClinicalTrials.gov study URL pattern — https://clinicaltrials.gov/study/NCT… (each profile's registryUrl, validated against its NCT) | accessed 2026-10-21, registry | e.g. "https://clinicaltrials.gov/study/NCT07227246" | One "Registry record:" line under each candidate; later and not-met groups unchanged |
| Imported NIHSS total with UN items (TR-13) | screener-prefill.js, screener-eval.js untestableNote / buildBriefingNote, TrialScreener.jsx NIHSS control | corrected | repository: src/clinical/nihss-items.js ("UN items are not summed") and workspace-state.js nihssAssessment (`untestable` count) | accessed 2026-10-21, repository source | "an item scored UN … is documented but not scored" | Follow-up: banner and summary read "NIHSS 7 (excludes 2 untestable items)" using the Encounter's count. A manual NIHSS entry, or a reapply without the total, drops the note. Reported totals carry no item detail, so no note |
| Presentation ≤ 24 h control (TESTED) | screener-eval.js STUDY_FACTS presentedWithin24h; ischemic only | added | Treatment With Endovascular Intervention for STroke Patients With Existing Disability — NCT05911568 — last update posted 2026-09-02 | accessed 2026-10-21, registry (re-read for the follow-up) | inclusion 3 "Presenting to study hospital within 24 hours of last known well time" | Unknown/yes/no. A "no" gives "Did not present within 24h of onset" |
| Unilateral symptoms, upper-limb deficit, self-consent and language controls (VERIFY) | STUDY_FACTS unilateralSymptomatic, ueWeakness, self_consent, language; ischemic | added | Validation of Early Prognostic Data for Recovery Outcome After Stroke — NCT05338697 — last update posted 2026-08-20 | accessed 2026-10-21, registry (re-read for the follow-up) | "Unilateral symptomatic stroke due to ischemia"; "Motor deficits in the acutely affected UE"; "Cognitive or communication impairment precluding informed consent by the participant"; "Fluent in study approved languages (i.e., English or Spanish)" | Language options are the criterion's values (English, Spanish) plus Neither. SAFE ≤ 8 and the procedure windows stay to confirm |
| Current mRS, upper-limb deficit and 54-week availability controls (MR-PICS) | STUDY_FACTS currentMrs (0–6), ueWeakness, availability_54w; ischemic | added | Motor Recovery Through Plasticity-Inducing Cortical Stimulation — NCT06506279 — last update posted 2026-04-13 | accessed 2026-10-21, registry (re-read for the follow-up) | "Disability measured between 3 and 4 on the modified Rankin Scale"; "Levels of hemiparesis that warrant surgical intervention (upper limb impairment)" | mRS 3–4 meets; 2 does not; 3.5 or 7 stays unknown. UEFM 25–45 stays to confirm |
| MR-PICS availability wording (TR-20) | MR-PICS exactInclusionCriteria[5], availability_54w matched/pending labels | corrected | Motor Recovery Through Plasticity-Inducing Cortical Stimulation — NCT06506279 — last update posted 2026-04-13 | accessed 2026-10-21, registry (re-read for the follow-up) | "Available for the duration of the study, 54 weeks for multiple visits (38 weeks implanted and 16 weeks post-explant follow-up)" | The stored "for in person visits" is not in today's record |
| Upper-limb deficit and self-consent controls (TELE-REHAB-2), ischemic and ICH | STUDY_FACTS ueWeakness, self_consent | added | Telerehabilitation In The Home After Stroke (TR-2) — NCT06682429 — last update posted 2026-10-09 | accessed 2026-10-21, registry (re-read for the follow-up) | "due to ischemia or intracerebral hemorrhage (ICH)"; "The stroke caused upper extremity deficits as defined by Action Research Arm Test score 18-44"; "signed by the subject (i.e., no surrogate consent)" | ARAT 18–44 and the other baseline tests stay to confirm |
| Inpatient-rehabilitation control (SCOUTS-3), ischemic and ICH | STUDY_FACTS rehab | added | Optimizing Adherence to the Treatment of Sleep Apnea Among Patients With Stroke Undergoing Inpatient Rehabilitation (SCOUTS3) — NCT06722755 — last update posted 2026-08-13 | accessed 2026-10-21, registry (re-read for the follow-up) | description "recruited upon IPR admission"; exclusion 9 "Anticipated inpatient rehabilitation length of stay < 5 nights" | Options are the criterion's value ("yes") plus No; "No" gives "does not meet" |
| SCOUTS-3 rehabilitation wording (TR-19) | SCOUTS-3 exactInclusionCriteria[3], exactExclusionCriteria, rehab matchedLabel, sourceGaps[0] | corrected | Optimizing Adherence to the Treatment of Sleep Apnea Among Patients With Stroke Undergoing Inpatient Rehabilitation (SCOUTS3) — NCT06722755 — last update posted 2026-08-13 | accessed 2026-10-21, registry (re-read for the follow-up) | inclusion 1 "Age 18 years or older", 2 "Head CT or brain MRI demonstrating an acute ischemic infarction or intraparenchymal hemorrhage within past 30 days", 3 "Person providing consent … able to be consented in English or Spanish"; exclusion 9 "Anticipated inpatient rehabilitation length of stay < 5 nights" | The stored "On or moving to inpatient rehabilitation…" inclusion is not in today's record. It is now attributed to the description, and exclusion 9 is added |
| ABCD2 (TIA only) and antithrombotic-therapy controls (CLARITY) | STUDY_FACTS abcd2 (0–7), antithromboticSoc; ischemic (antithrombotic only) and TIA | added | Cilostazol for Prevention of Recurrent Stroke Trial — NCT07174414 — last update posted 2026-10-15 | accessed 2026-10-21, registry (re-read for the follow-up) | "Ischemic stroke or high-risk TIA (ABCD2 score ≥6)"; "Treatment with single or dual antithrombotic therapy with aspirin, clopidogrel and/or ticagrelor per international and/or national guidelines" | For TIA, ABCD2 6 meets and 5 does not. With every modeled fact answered, the completeness is "potential match", but the study stays under "Later" while NOT_YET_RECRUITING |
| CLARITY facts missing from the engine inputs (TR-18) | screener-eval.js createInitialScreenerState, buildScreenerParams, SCORE_RANGES | corrected | repository definition: src/evidence/screener-eval.js (not a clinical source) | accessed 2026-10-21, repository source | `abcd2` and `antithromboticSoc` were read by CLARITY's criteria but never placed in the screener state or parameters | Both are now passed through; ABCD2 must be a whole number 0–7, otherwise unknown |

## 5. Tests added and results

`tests/trials-2026-10-21.test.jsx` has 124 tests:

- **Registry records.** All 16 profiles carry 2026-10-21, the established last-update date and the status per record, and their status sentences agree. No 2026-10-17 remains. Statuses read as registry statuses.
- **Profiles.** The FASTEST Part 1 and Part 2 distinction. Every screened profile has registry items to confirm. The TELE-REHAB-2, SISTER, ASPIRE, SCOUTS-3, VERIFY, MR-PICS and MINUTE corrections.
- **Boundaries.** 94 inclusive/exclusive cases quoted from the registry text, run on each stored criterion in isolation. Unit conversion is covered.
- **Unknown inputs.** Missing, malformed, out-of-range and fractional values, and invalid onsets, all stay unknown.
- **Summary.** It is truthful, gives each candidate a direct registry link, and an artifact scan over 3 classifications × 7 timing states × 4 fact sets finds no undefined, null, NaN or `{value}`.
- **LKW import.** Midnight (dated), daylight saving (repeated hour only with an explicit occurrence, printed with its offset), and skipped, future, impossible or discovery-only times. Out-of-range anchors are ignored. ABC/2 threshold safety.
- **Invariant.** 400 seeded partial-Encounter combinations never yield a potential match.
- **Refiner.** Every modeled exclusion is answerable for each classification a study screens.
- **UI hints.** Static render of the hints and `aria-invalid`.

The key new assertions fail on the pre-change source (HEAD copy) and pass after.

**Updated existing assertions (deliberate, all from today's re-verification):**

- `src/evidence/__tests__/trials-review-2026-10-17.test.js`: expected last-update map. SISTER 2026-10-02 → 2026-10-19, CAPPRICORN-1 2026-09-18 → 2026-10-20 and CAPTIVA 2026-10-13 → 2026-10-20. These are registry updates after 2026-10-17, established by exact-day queries today.
- `src/evidence/__tests__/screener-eval.test.js:257`: summary header "registry checked 2026-10-17" → "2026-10-21", because all profiles were re-read.
- `tests/trials-dom.test.jsx` lines 93, 102, 200 and 211: displayed check date 2026-10-17 → 2026-10-21. Same reason.

Runs (final source = commit 1a5f9d4 plus this report):

- `npx vitest run` (full, Playwright browser path set): 113 files passed, 2,120 tests passed, 3 skipped, 0 failed. The pre-change baseline was 112 files, 1,996 passed and 3 skipped. The difference is exactly the new file's 124 tests. Both runs skip the same 3 tests, in `tests/adversarial-m4-challenger.test.js`.
- Trial-related files after the last code change (`npx vitest run trials screener eligibility`, which includes the 3 Playwright DOM files): 11 files, 277 passed.
- `npm run test:protocol-source`: PASS after every change and on the final source.
- `npm run build` then `STROKE_PROTOCOL_LOCK_PORT=4350 npm run test:protocol-tab`: PASS (46 fixture/sub-tab captures) on a fresh build of commit 1a5f9d4. An earlier run on an intermediate build of this branch also passed with 46 captures.
- Final source: `check:clinical-claims` PASS. `content:validate` PASS (16 trial profiles). `evidence:validate` PASS. `validate:citations` PASS. `validate:inline-citations` PASS. `check:leak-guard` PASS (public scan of 598 tracked text files, run with this report staged; it warns that no private denylist was loaded). `check:leak-guard:staged` could not run here: it exits 1 because it requires a private denylist, and none is available in this environment. `check:asset-budget`: all within budget (figures in section 3).
- Build outputs regenerated by the build and test runs were restored to the committed files before each commit. None is committed.

**Follow-up tests** (same file, now 153 tests; expected values come from the registry text re-read for the follow-up, quoted in the file):

- **Visibility.** `STUDY_FACTS` per classification equals the registry-derived list: ischemic 9, TIA 2, ICH 3, each with the studies that read it. A second test walks every screened profile and each classification it screens. No modeled criterion is left without a control (or-branches for another classification excluded).
- **Rendering.** For each classification the collapsed "Study-specific facts" section sits after the key facts and before the exclusion review, shows "(0 of N answered)", and has only that classification's controls, each naming its studies and linked by `aria-describedby`.
- **Options.**
  - Booleans offer Unknown/Yes/No, with Unknown selected by default.
  - Language offers exactly English, Spanish and Neither, and rehab offers Yes and No.
  - Every option gives a definite met or not-met for its criterion, and every value a criterion tests is offered.
- **Invalid numbers.** Current mRS 3.5 and ABCD2 8 get `aria-invalid`, the hint and "(invalid entry; treated as unknown)" in the summary. An invalid entry is not counted as answered.
- **Summary.** Study facts print only when shown and answered, for each classification, as "label: option chosen". Legacy booleans print as the engine reads them.
- **Classification change.** Hidden study facts, including the NIHSS untestable count, return to unknown. Facts shown on both screens are kept.
- **Each of VERIFY, TELE-REHAB-2, MR-PICS, SCOUTS-3, TESTED and CLARITY:**
  - With every modeled fact answered at the registry limits, it reaches "potential match" and its registry items are still listed to confirm. CLARITY reaches that completeness but stays under "Later".
  - Each contrary answer to a study-specific fact gives "does not meet documented criteria" with the criterion's reason.
  - Leaving any one modeled fact or exclusion unanswered keeps it at "insufficient information" with exactly 1 unknown.
- **TR-13.**
  - Banner, state and summary read "NIHSS 7 (excludes 2 untestable items)", and "1 untestable item" for one.
  - There is no note for a fully scored exam or a reported total.
  - A reapply that no longer imports the total clears the note. TIA imports nothing.
- **Browser (Playwright, 390 px).**
  - The section starts collapsed, counts answered facts and prints them in the preview.
  - Switching to ICH and back resets the hidden facts.
  - With the section open there is no horizontal overflow and no target under 44 px, in light and dark.
  - The Encounter banner shows the untestable note, the preview carries it after "Use these facts", and editing the NIHSS drops it.
- **The 400-combination partial-Encounter invariant** still passes unchanged.

Ten key follow-up assertions (scratch harness) fail on the pre-follow-up HEAD source (e81cb7b) and pass on the follow-up source.

Follow-up runs:

- `npx vitest run` (full, Playwright browser path set): 113 files passed, 2,149 tests passed, 3 skipped, 0 failed. The merged state had 2,120 passed; the +29 are the follow-up's new tests in this file. The same 3 tests are skipped.
- Trial-related files (`npx vitest run trials screener eligibility`): 11 files, 306 passed.
- `npm run test:protocol-source`: PASS after the follow-up changes and on the final follow-up source.
- `check:clinical-claims`, `content:validate` (16 trial profiles), `evidence:validate`, `validate:citations` and `validate:inline-citations`: all PASS on the follow-up source.
- `check:leak-guard`: PASS (public scan with this report staged; no private denylist is available here, as before).
- `npm run build` then `STROKE_PROTOCOL_LOCK_PORT=4350 npm run test:protocol-tab`: PASS (46 fixture/sub-tab captures) on a fresh build of the follow-up source. This was run as a precaution; no Protocols module changed.

## 6. Protocols observations (report only)

None. This unit did not review Protocols content, and no trials finding depends on it. Trial data reaches no Protocols-rendered module: global search loads it lazily, only after search is opened. The Protocols tab lock was run as a precaution (result in section 5).

## 7. Unresolved uncertainties

- **Registry updates after 2026-10-17.** The content of the 2026-10-19 (SISTER) and 2026-10-20 (CAPPRICORN-1, CAPTIVA) updates is unknown, because the connector has no version history. They may concern site lists or administrative fields. No stored field differs from today's records.
- **Index lag.** Last-update dates come from the search index, which can lag the live record. "Registry index" scope is stated.
- **PICASSO.** Criterion 3 vs 9 (intracranial occlusion required or not) and the three-arm intervention list vs "1:1" randomization remain unresolved. Confirm with the study team. The profile is not screened.
- **CLARITY.** The estimated start is 2026-10 but the status is still NOT_YET_RECRUITING, so it may change within days.
- **Controls.** Resolved in the follow-up (TR-11). A potential match still depends on every modeled fact being answered, and the registry's unmodeled items stay in the to-confirm list.
- **Encounter ABCD².** The Encounter records a validated ABCD² (0–7) for TIA in `dapt.abcd2`, which would map cleanly to CLARITY's fact. It was not imported, as the lead preferred. Importing it would be a one-field change in `screener-prefill.js` and would need its own import test.
- **Shared upper-limb fact.** One "Upper-limb motor deficit" answer serves VERIFY, MR-PICS and TELE-REHAB-2. Each study's own threshold (SAFE ≤ 8, UEFM 25–45, ARAT 18–44) stays in its to-confirm list, so "yes" does not mean the study threshold is met.
- **VERIFY language labels.** The control reads "Fluent language", per the registry's "Fluent in study approved languages (i.e., English or Spanish)". The criterion's own labels still say "speaks" / "English or Spanish speaking", which the 2026-10-17 test TO-10 pins. They were left unchanged.
- **Partial exclusion lists.** Some registry exclusions remain covered only by generic confirmation text, and the source gaps say so. Examples: VERIFY co-enrollment and comorbidity; ASPIRE lab and BP thresholds; FASTEST-2 terminal illness and investigational-trial items; MINUTE capacity and DNR.
- **NIHSS with UN items (TR-13).** Resolved in the follow-up.
- **FASTEST Part 1.** Abstract scope only. PMC full text (PMC13005960) exists but was not needed for the stored numbers.
- **README.** README line 14 (date) is outside this unit's scope.
