# Calculators review — 2026-10-21 (unit: calculators)

Scope: every calculator, score, scale, screen and decision aid in the non-Protocols app, the Encounter-embedded calculators (audited; fixes proposed as patches), and the calculator tools in `mcp/server.mjs` (audited; fixes proposed as patches). The Protocols tab was read only. Branch `worktree-agent-a5e608dcb39776f6f`, based on af21b07 (7.8.0).

Access limits that apply throughout. Publisher sites, PMC web pages, DailyMed and FDA labels were blocked. Sources were read through the PubMed connector (abstracts and, where available, PMC full text), the ClinicalTrials.gov connector (full registry records) and web search. Web search gave secondary label copies and summaries and was never the sole basis for a change. The AHA/ASA 2026 AIS guideline was read only as the app's archived transcription (`src/guidelines/ais-2026.json`), which is secondary. Primary instrument papers without an accessible abstract or full text are marked "not re-read". Their code is unchanged and was not re-verified today.

## 1. Scope inventory

Classes: **A** = arithmetic calculator, **V** = validated score or screening instrument, **D** = descriptive scale or grade, **R** = reference (trial-population) screen, **DA** = decision aid.

| # | Tool | Where | Class | Definition source checked today |
|---|---|---|---|---|
| 1 | ABCD² | Calculators tab, `supplementary-calculators.js` | V | Johnston 2007 (abstract) |
| 2 | CHA₂DS₂-VASc | Calculators tab | V | 2023 ACC/AHA/ACCP/HRS AF guideline (PMC full text); Lip 2010 (abstract) |
| 3 | HAS-BLED | Calculators tab | V | Pisters 2010 (abstract); 2023 ACC/AHA AF guideline (full text) |
| 4 | RoPE | Calculators tab | V | Kent 2013 (abstract); secondary PMC full texts |
| 5 | PASCAL | Calculators tab | DA (classification) | Kent 2021 (abstract); secondary PMC full text |
| 6 | PHASES | Calculators tab | V | Greving 2014 (abstract; point chart not accessible) |
| 7 | mRS descriptors | Calculators tab, Encounter baseline mRS | D | van Swieten 1988 (abstract); DEFUSE 3 registry outcome text |
| 8 | Hunt–Hess | Calculators tab, SAH notes | D | no abstract; not re-read |
| 9 | WFNS | Calculators tab, SAH notes | D (GCS-derived grade) | no abstract; not re-read |
| 10 | Modified Fisher | Calculators tab, SAH notes | D | Frontera 2006 (abstract) |
| 11 | mTICI | Calculators tab, Encounter select | D | Goyal 2014 (PMC full text); Zaidat 2013 (verified 2026-10-17) |
| 12 | NASCET stenosis | Calculators tab | A | NASCET 1991, Bartlett 2006 (abstracts) |
| 13 | ASPECTS regional | Calculators tab → Encounter ASPECTS | V (imaging score) | Barber 2000 (abstract) |
| 14 | pc-ASPECTS regional | Calculators tab → Encounter pc-ASPECTS | V (imaging score) | Puetz 2008 (abstract) |
| 15 | PHQ-2 | Calculators tab, follow-up notes | V (screen) | Kroenke 2003 (abstract) |
| 16 | STOP-BANG | Calculators tab, follow-up notes | V (screen) | Chung 2016 and 2014 (abstracts), Chung 2012 (PMC full text) |
| 17 | NIHSS (itemized or reported total) | Encounter; `calculators.js`, `workspace-state.js`, `clinical/nihss-items.js` | V | Brott 1989 (abstract); DAWN registry (0–42 range) |
| 18 | GCS | Encounter; `encounter-clinical-review.js` | V | Teasdale 2014 (abstract) |
| 19 | ICH score | Encounter and notes; `calculators.js` | V | Hemphill 2001 (abstract) |
| 20 | ABC/2 volume, plus slice-thickness caution | Encounter and notes; Protocols ABC/2 card via projection | A (+ heuristic) | Kothari 1996 (abstract) |
| 21 | Cockcroft–Gault CrCl, adjusted-weight variant, creatinine-unit and height cautions | Encounter; MCP `calc_crcl` | A | Cockcroft & Gault 1976 (abstract); DAWN registry (unit pair) |
| 22 | Alteplase dose | Encounter, case bar, notes; Protocols quick reference (shared); MCP | A | ais-2026-98 (archive); label via secondary copies |
| 23 | Tenecteplase dose, guideline or US label bands | same as 22 | A | ais-2026-98 (archive); label via secondary copies |
| 24 | Weight kg/lb conversion | Encounter, `encounter-inputs.js` | A | definition of the pound |
| 25 | DAWN screen | Encounter; MCP `calc_dawn_eligibility` | R | NCT02142283 (registry, full) |
| 26 | DEFUSE 3 screen | Encounter; MCP `calc_defuse3_eligibility` | R | NCT02586415 (registry, full); Albers 2018 (abstract) |
| 27 | Large-core EVT screen (LASTE subset, RESCUE-Japan LIMIT, TENSION, SELECT2, ANGEL-ASPECT, TESLA) | Encounter | R | TESLA, TENSION (abstracts); SELECT2, ANGEL-ASPECT registries verified 2026-10-17 |
| 28 | Acute DAPT screen | Encounter | DA (graded) | ais-2026-147 to -150 (archive) |
| 29 | WAKE-UP MRI screen and pre-stroke mRS gap | Encounter; `encounter-clinical-review.js` | R | Thomalla 2018 (abstract); registry verified 2026-10-17 |
| 30 | EXTEND perfusion screen | Encounter; `encounter-clinical-review.js` | R | Ma 2019 (abstract) |
| 31 | IVT/EVT guideline partial screens | Encounter; `encounter-clinical-review.js` | DA | inventoried; outside this unit's arithmetic scope |
| 32 | Post-thrombolysis neuro-check schedule | case bar; `computeNeurocheckSchedule` | A (schedule) | not re-read (guideline table inaccessible) |
| 33 | LKW countdown, 4.5 h and 24 h | Encounter, case bar; `computeLKWCountdown` | A (time) | n/a (window values from ais-2026 archive) |
| 34 | TIA disposition review | Encounter; `reviewedTiaDisposition` | DA (checklist, no score) | inventoried only |
| 35 | 4F-PCC / reversal arithmetic | Protocols, `clinical/reversal-dose.js` (locked) | A | out of scope (locked) |
| MCP | `calc_tnk_dose`, `calc_alteplase_dose`, `calc_crcl`, `calc_dawn_eligibility`, `calc_defuse3_eligibility` (callable); `list_calculators` lists all 26 registry tools, 5 callable | `mcp/server.mjs` | wrappers of 21–26 | as for the wrapped functions |

Protocols tab (read only): the quick-reference dose-by-weight table and the protocol ABC/2 card use the same shared functions as rows 20, 22 and 23. Protocol cards have calculator chips that deep-link to Encounter targets. No prehospital LVO scale, FUNC, SEDAN, DRAGON, HAT, Canadian TIA score, ESSEN or CHA₂DS₂-VA exists anywhere in the app. This was checked in `ProtectedProtocols.jsx`, `management-guidance.js`, `institutional-protocols.js`, `QuickReference.jsx` and `pocket-cards.jsx`.

## 2. Findings

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | Medium | `evaluateDEFUSE3` treated an entered but invalid ASPECTS (11, −1, 5.5, "5x") as "not entered". In Encounter, ASPECTS 11 read "DEFUSE-3 … screen met … Confirm NCCT ASPECTS ≥6", so a malformed value produced a met partial screen. | **Fixed** (`calculators-extended.js`). On CT selection the screen is now unresolved (null). A blank ASPECTS still gives the registry-based confirmation prompt; MRI selection ignores the field. |
| F2 | Low (latent) | `calculateICHScore` scored an omitted binary criterion as "no", and a truthy string as a point: `{gcs:'gcs512', criteriaReviewed:true, age80:'false'}` scored 2. It is the registry's canonical ICH-score helper. Encounter and notes always pass booleans, so no displayed score changes. | **Fixed** (`calculators.js`, hash lock PASS). Each criterion must be an explicit boolean. Three `tests/calculators.test.js` assertions now pass the explicit negatives (see §5). |
| F3 | Low | Global quick search (Ctrl/⌘ K) did not know worksheet synonyms that the Calculators-tab search used. "sleep apnea", "depression", "atrial fibrillation" and "patent foramen ovale" did not find STOP-BANG, PHQ-2, CHA₂DS₂-VASc/HAS-BLED or RoPE/PASCAL. | **Fixed.** The aliases moved onto the definitions (`aliases`), which `quick-search-index.js` already reads. A few synonyms were added: "AF", "OSA", "patent foramen ovale", "unruptured … rupture". No change to `quick-search-index.js`. |
| F4 | Low | STOP-BANG: a neck circumference typed in inches (16) silently scored the neck item "no", a falsely reassuring lower score. Height already had a cm/inch caution; neck did not. Neither caution reached the copied result. | **Fixed.** A non-blocking caution for a neck under 25 cm (a heuristic, labelled as such in the code). Both cautions now show beside the result and are copied with it. |
| F5 | Info | The CHA₂DS₂-VASc worksheet gave no context on the 2024 ESC change to CHA₂DS₂-VA. | **Added** an attributed limits sentence: the 2023 US guideline names CHA₂DS₂-VASc (§6.1 rec 1); ESC 2024 uses CHA₂DS₂-VA without the sex category, which is not calculated here. The score itself is unchanged. |
| F6 | Info | PHQ-2 showed a score with no source cutpoint. | **Added** to limits: Kroenke 2003 found ≥3 optimal (sensitivity 83%, specificity 92%) in primary care and obstetrics-gynecology, not stroke. No interpretation band is computed. |
| F7 | Low | MCP `calc_crcl` returns an adjusted-weight CrCl and obesity text even when `heightWarning` flags an implausible height (for example 66, probably inches). Encounter suppresses the adjusted value in that case. | **Patch for the lead** (§8, P4). |
| F8 | Low | MCP `calc_defuse3_eligibility` has no selection-modality input, so it always applies the CT-perfusion ASPECTS rule. | **Patch for the lead** (§8, P5). |
| F9 | Low | Encounter CrCl: an invalid optional height (for example 0) blocks the estimate, but the message names only age, weight, sex and creatinine. | **Patch for the lead** (§8, P1). |
| F10 | Low | After F1, the Encounter DEFUSE-3 line reads "Required inputs incomplete." when only the ASPECTS entry is malformed. | **Patch for the lead** (§8, P2). |
| F11 | Info | Follow-up note worksheet lines drop the STOP-BANG height and neck cautions. | **Patch for the lead** (§8, P3). |
| F12 | Info | HAS-BLED elderly: the original is "> 65 years" (Pisters 2010), but the 2023 ACC/AHA AF guideline paraphrases it as "age ≥65 years". | Unchanged; the app follows the original instrument. Documented. |
| F13 | Info | STOP-BANG age: the app uses >50. The Chung 2014 abstract says "age ≥ 50" in one sentence; the 2008 wording was not accessible. | Unchanged; flagged (§7). |
| F14 | Info | RoPE "Smoker": secondary full texts describe the item as current smoking. The original point table was not accessible. | Unchanged; flagged (§7). |
| F15 | Info | Modified Fisher maps IVH without visible SAH to grade 2. A code comment cites Frontera Table 1, which could not be re-read today. | Unchanged; flagged; not encoded in the new tests. |
| F16 | Info | `calculateNIHSS(null)` returns 0. It is a partial-sum helper; completeness is gated in `nihssAssessment`, and the UI labels a partial sum as such. | No change (the function feeds the hashed Encounter→Protocols projection). Documented. |
| F17 | Info | `npm run test:mcp` could not run: `@modelcontextprotocol/sdk` and `zod` are not installed in this checkout. | Behaviour was covered by direct function tests; the lead should run it at integration. |

Verified with no change: ICH score points and the GCS-tier mapping; ABC/2 C = slices × thickness (mm → cm) and threshold-safe display rounding; the Cockcroft–Gault 0.85 sex factor, adult range and µmol/L caution; alteplase 0.9 mg/kg, 90 mg cap and 10% bolus; TNK 0.25 mg/kg with a 25 mg cap and the US AIS label bands; kg/lb (0.45359237); the DAWN tiers and inclusive 6–24 h window; the DEFUSE 3 thresholds (core <70, ratio ≥1.8, mismatch ≥15) and 6–16 h window; the large-core trial tiers checked; DAPT branches against ais-2026-147 to -150; ABCD²; CHA₂DS₂-VASc; HAS-BLED; RoPE components and PASCAL categories; the PHASES structure; WFNS bands; mTICI 2b and 2c; the NASCET formula; ASPECTS and pc-ASPECTS weights; PHQ-2 scoring; STOP-BANG BMI >35 and neck >40; NIHSS item structure (15 items, 0–42, UN only for limb motor, ataxia and dysarthria); GCS components; calculator deep links and aliases; copy text (source and limits; no `undefined`/`NaN`); keyboard-only use of the Calculators tab.

## 3. Changes and reasons

| Commit | Files | Change |
|---|---|---|
| d8c0ccb | `src/calculators.js`, `src/calculators-extended.js`, `tests/calculators.test.js` | F2 ICH-score explicit booleans; F1 DEFUSE-3 invalid ASPECTS is unresolved. `npm run test:protocol-source`: PASS. |
| 77d7802 | `src/supplementary-calculator-definitions.js`, `content/calculators/registry.json`, `src/calculator-utilities.js`, `src/components/SupplementaryCalculators.jsx`, `src/supplementary-calculators.js` | F3 aliases on definitions (the duplicate alias map in `calculator-utilities.js` is removed). F4 STOP-BANG neck caution, with cautions shown and copied (`resultCautions`). F5 CHA₂DS₂-VASc limits, `reviewedAt` 2026-10-21 with a scope stating what was read. F6 PHQ-2 limits, `reviewedAt` 2026-10-21 (abstract scope). Registry limits stay equal to the definitions (parity test). |
| 7ec3345, 515ec59 | `tests/calculators-2026-10-21.test.jsx` | New tests (§5). |
| (this file) | `docs/review-2026-10-21/calculators.md` | Report. |

No Protocols-owned file, lock, snapshot or hashed shared output changed. The hashed dose functions (`calculateTNKDoseReviewed`, `calculateAlteplaseDoseReviewed`) and the byte-locked legacy helpers (`calculateCrCl`, `calculateICHVolume`, `calculateAlteplaseDose`) are untouched.

Generated outputs (`data/*.json`, `llms*.txt`, bundle) are not committed. They must be regenerated at integration: the `aliases` field and the two limits texts flow into `data/clinical-reference.json`, `data/calculators-index.json` and `data/sources.json`.

**Budget delta** (`npm run check:asset-budget:json`, committed af21b07 outputs vs a local build of this branch):

| Check | Before | After | Delta | Budget |
|---|---|---|---|---|
| Initial JS (gzip) | 127,374 | 127,492 | +118 B | 131,072 |
| Initial JS (raw) | 375,274 | 375,562 | +288 B | 385,024 |
| All offline JS (gzip) | 254,900 | 254,669 | −231 B | 262,144 |
| All offline JS (raw) | 852,513 | 852,096 | −417 B | 876,544 |
| tailwind.css | 119,694 | 119,694 | 0 | 122,880 |
| SW precache | 2,335,485 | 2,336,634 | +1,149 B | 2,411,724.8 |

## 4. Evidence ledger

| claim / feature | location | status (verified/corrected/added/flagged/unresolved) | source title — URL or DOI/PMID/NCT — publication date | accessed 2026-10-21, scope | supporting passage (short quote) | limitations / resolution |
|---|---|---|---|---|---|---|
| ICH score points and GCS tiers | `src/calculators.js` calculateICHScore; Encounter/notes GCS mapping | corrected (missing-input handling); points verified | The ICH score: a simple, reliable grading scale for intracerebral hemorrhage — doi:10.1161/01.str.32.4.891, PMID 11283388 — 2001-04 | accessed 2026-10-21, abstract | "GCS score 3 to 4 (=2 points), 5 to 12 (=1), 13 to 15 (=0); age >/=80 years yes (=1) … ICH volume >/=30 cm(3) (=1)" | Points unchanged. Omitted or non-boolean criteria now return no score. No mortality bands are shown (unchanged by design). |
| ABC/2: C = slices × thickness | `src/workspace-state.js` encounterVolume → `calculateICHVolumeReviewed` | verified | The ABCs of measuring intracerebral hemorrhage volumes — doi:10.1161/01.str.27.8.1304, PMID 8711791 — 1996-08 | accessed 2026-10-21, abstract | "C is the approximate number of CT slices with hemorrhage multiplied by the slice thickness" | The app states it is the unweighted variant. ABC/3 is not claimed. |
| Cockcroft–Gault sex factor and adult derivation | `src/calculators.js` calculateCrClReviewed | verified | Prediction of creatinine clearance from serum creatinine — doi:10.1159/000180580, PMID 1244564 — 1976 | accessed 2026-10-21, abstract | "(15% less in females)"; "249 patients aged 18-92" | The formula itself is elided in the abstract ("see article"); constants are unchanged from earlier provenance. The adjusted-weight variant (BMI >30, Devine IBW + 0.4 excess) is an app convention, not part of Cockcroft–Gault. |
| Creatinine mg/dL ↔ µmol/L (×88.4) | calculateCrClReviewed unitWarning; MCP calc_crcl | verified | DAWN registry — NCT02142283 | accessed 2026-10-21, registry | "serum creatinine >3.0 mg/dL (264 µmol/L)" | 264/3 = 88 corroborates the factor; 88.4 follows from the molar mass 113.12 g/mol. |
| Alteplase 0.9 mg/kg, maximum 90 mg | calculateAlteplaseDoseReviewed (hash-locked; unchanged) | verified | AHA/ASA 2026 AIS guideline, ais-2026-98 (COR 1, LOE A) — PMID 41582814 — 2026 | accessed 2026-10-21, archived transcription (secondary) | "tenecteplase 0.25 mg/kg (max 25 mg) or alteplase 0.9 mg/kg (max 90 mg) is recommended" | Primary guideline full text not reachable. |
| Alteplase 10% bolus over 1 min, remainder over 60 min | calculateAlteplaseDoseReviewed; MCP calc_alteplase_dose | verified (secondary) | Activase US prescribing information — https://www.gene.com/download/pdf/activase_prescribing.pdf — rev. 9/2022 | accessed 2026-10-21, web-search label copies (drugs.com, gene.com summary); label PDF blocked | "10% of the total dose administered as an initial bolus over 1 minute" | Secondary copies only. Display rounds to 0.1 mg; bolus plus infusion equals the total by construction. |
| Tenecteplase AIS label weight bands (<60 15 mg … ≥90 25 mg) | calculateTNKDoseReviewed 'fda-label' (hash-locked; unchanged) | verified (secondary) | TNKase US prescribing information, AIS — DailyMed setid e647640d-c395-4b4b-a0be-1162f9c21d84 — revision date not verified | accessed 2026-10-21, web-search label copies (drugs.com, RxList, Epocrates); DailyMed blocked | "60 kg to less than 70 kg: 17.5 mg (3.5 mL) … 90 kg or more: 25 mg (5 mL)" | Label window 3 h (stated in the app's label note). Guideline arithmetic 0.25 mg/kg is the default. |
| NIHSS: 15 items, total 0–42 | `src/clinical/nihss-items.js`; nihssAssessment | verified | Measurements of acute cerebral infarction: a clinical examination scale — doi:10.1161/01.str.20.7.864, PMID 2749846 — 1989-07; DAWN registry NCT02142283 | accessed 2026-10-21, abstract + registry | "a 15-item neurologic examination stroke scale"; "The maximum possible score is 42, with the minimum score being a 0." | Item wording and UN rules were not re-read against the NINDS form (inaccessible). Item maxima and UN placement are tested. |
| GCS components; component-first reporting | `encounter-clinical-review.js` reviewedGcs/gcsDocumentation; calculateGCS | verified (principle) | The Glasgow Coma Scale at 40 years — doi:10.1016/S1474-4422(14)70120-6, PMID 25030516 — 2014-08 | accessed 2026-10-21, abstract | "Individual patients are best described by the three components of the coma scale" | Component ranges (E1–4, V1–5, M1–6) are not in the abstract; the official aid was not accessible today; unchanged. |
| DAWN tiers and 6–24 h window | `src/calculators-extended.js` evaluateDAWN; MCP calc_dawn_eligibility | verified | DAWN — NCT02142283 | accessed 2026-10-21, registry (full record) | "0-<21 cc core infarct and NIHSS ≥ 10 (and age ≥ 80 years old)"; "0-<31 cc … (and age < 80 years old)"; "31 cc to <51 cc core infarct and NIHSS ≥ 20"; "randomized between with 6 to 24 hours after time last known well" | Pre-stroke mRS 0–1, <1/3 MCA and the other criteria are not modelled (stated in the screen text). |
| DEFUSE 3 thresholds, window, age and ASPECTS exclusion | evaluateDEFUSE3; MCP calc_defuse3_eligibility | corrected (invalid ASPECTS) | DEFUSE 3 — NCT02586415; Albers et al., NEJM 2018 — doi:10.1056/NEJMoa1713973, PMID 29364767 | accessed 2026-10-21, registry (full record) + abstract | "Age 18-90 years"; "ischemic core volume is < 70 ml, mismatch ratio is >/= 1.8 and mismatch volume* is >/= 15 ml"; "ASPECTS score <6 on non-contrast CT (if patient is enrolled based on CT perfusion criteria)" | Registry allowed pre-stroke mRS ≤2 (not modelled; screen text says confirm baseline function). An entered invalid ASPECTS now returns no screen. |
| TESLA tier: NCCT ASPECTS 2–5 within 24 h; neutral | evaluateLargeCoreEVT TESLA branch | verified | TESLA — doi:10.1001/jama.2024.13933, PMID 39374319 — 2024-09-23 | accessed 2026-10-21, abstract | "Alberta Stroke Program Early CT Scores of 2 to 5"; "thrombectomy did not demonstrate improvement in functional outcomes" | TESLA never marks the screen met (unchanged). Age 18–85 not re-read today. |
| TENSION tier: ASPECTS 3–5 up to 12 h | evaluateLargeCoreEVT TENSION branch | verified | TENSION — doi:10.1016/S0140-6736(23)02032-9, PMID 37837989 — 2023-10-11 | accessed 2026-10-21, abstract | "ASPECTS of 3-5 … up to 12 h from stroke onset" | NIHSS <26 and pre-mRS ≤2 not in the abstract; unchanged. SELECT2 and ANGEL-ASPECT rely on the 2026-10-17 registry reads; RESCUE-Japan LIMIT and LASTE not re-read. |
| DAPT branches (147 COR 1 A; 148 2b B-R; 149 2a B-R; 150 2b B-R) | recommendAcuteDAPT | verified | AHA/ASA 2026 AIS guideline ais-2026-147 to -150 — PMID 41582814 — 2026 | accessed 2026-10-21, archived transcription (secondary) | -149: "within 24-72 hours of onset (or NIHSS 4-5 within 24 hours) … presumed atherosclerotic cause … DAPT (clopidogrel plus aspirin) for 21 days" | Every branch boundary is tested. Grades come from the archive projection. |
| WAKE-UP imaging selection | `encounter-clinical-review.js` evaluateWakeUpScreen | verified | MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset — doi:10.1056/NEJMoa1804355, PMID 29766770 — 2018 | accessed 2026-10-21, abstract | "visible on MRI diffusion-weighted imaging but no parenchymal hyperintensity on fluid-attenuated inversion recovery (FLAIR)" | Age 18–80, NIHSS ≤25 and mRS ≤1 rely on the 2026-10-17 registry read. |
| EXTEND window | evaluateWakeUpScreen (EXTEND branch) | verified (window only) | Thrombolysis Guided by Perfusion Imaging up to 9 Hours — doi:10.1056/NEJMoa1813046, PMID 31067369 — 2019 | accessed 2026-10-21, abstract | "between 4.5 and 9.0 hours after the onset of stroke or on awakening with stroke (if within 9 hours from the midpoint of sleep)" | Core <70, ratio >1.2 and mismatch >10 mL are not in the abstract; not re-read today; unchanged. |
| ABCD² points | calculateReviewedABCD2 | verified | Validation and refinement of scores to predict very early stroke risk after TIA — doi:10.1016/S0140-6736(07)60150-0, PMID 17258668 — 2007-01-27 | accessed 2026-10-21, abstract | "age >or=60 years [1 point]; blood pressure >or=140/90 mm Hg [1]; … unilateral weakness [2], speech impairment without weakness [1]; duration >or=60 min [2] or 10-59 min [1]; and diabetes [1]" | — |
| CHA₂DS₂-VASc components and doubled weights | calculateReviewedCHADS2VASc | verified | 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation — doi:10.1016/j.jacc.2023.08.017, PMID 38043043, PMC11104284 — 2023-11-30 | accessed 2026-10-21, PMC full text | "age ≥75 years (doubled), diabetes mellitus, prior stroke or transient ischemic attack or thromboembolism (doubled), vascular disease, age 65 to 74 years, sex category" | Lip 2010 (doi:10.1378/chest.09-1584) abstract gives the acronym only. |
| US guideline names CHA₂DS₂-VASc | supplementary-calculator-definitions.js chadsvasc limits; registry.json | added | same as above, §6.1 recommendation 1 (COR 1, B-NR) | accessed 2026-10-21, PMC full text | "Patients with AF should be evaluated for their annual risk of thromboembolic events using a validated clinical risk score, such as CHA2DS2-VASc." | Context only; no anticoagulation threshold is generated (6.3.1 rec 1 uses ≥2 men / ≥3 women). |
| ESC 2024 uses CHA₂DS₂-VA (no sex category) | chadsvasc limits | added | 2024 ESC Guidelines for the management of atrial fibrillation — doi:10.1093/eurheartj/ehae176, PMID 39210723 — 2024-09-29; reported in Stroke risk stratifications according to CHA2DS2-VASc vs. CHA2DS2-VA (GLORIA-AF) — doi:10.1093/ehjcvp/pvaf031, PMID 40289614, PMC12343043 — 2025 | accessed 2026-10-21, guideline metadata only (no abstract); secondary PMC full text | "The 2024 European Society of Cardiology guidelines has advocated for the use of CHA2DS2-VA score (with Level of Evidence C) 'in the absence of other locally validated alternatives'" | The ESC text was not read. The note claims only that the sex category is omitted and that CHA₂DS₂-VA is not calculated here (the earlier decision not to derive it is kept). |
| HAS-BLED elderly >65 and component list | calculateReviewedHASBLED | verified; discrepancy flagged | A novel user-friendly score (HAS-BLED) — doi:10.1378/chest.10-0134, PMID 20299623 — 2010-03-18 | accessed 2026-10-21, abstract | "Elderly (> 65 years), Drugs/alcohol concomitantly" | ACC/AHA 2023 paraphrases "elderly [age ≥65 years]". The original is kept. Item definitions (SBP >160, ≥200 µmol/L, ≥8 drinks/week) were not re-read today. |
| Bleeding scores do not decide anticoagulation | HAS-BLED limits | verified | 2023 ACC/AHA/ACCP/HRS AF guideline §6.1 rec 4 (3: No Benefit, B-NR) — PMC11104284 | accessed 2026-10-21, PMC full text | "bleeding risk scores should not be used in isolation to determine eligibility for oral anticoagulation" | Matches the existing limits text. |
| RoPE components | calculateReviewedRoPE | verified (components); flagged (smoking definition) | An index to identify stroke-related vs incidental PFO in cryptogenic stroke — doi:10.1212/WNL.0b013e3182a08d59, PMID 23864310 — 2013-07-17; Ng et al., J Clin Med 2023 — doi:10.3390/jcm12030941, PMC9917737 | accessed 2026-10-21, abstract + secondary PMC full text | "younger age, the presence of a cortical stroke on neuroimaging, and the absence of these factors: diabetes, hypertension, smoking, and prior stroke or TIA"; secondary: "current smoking" | The age-band points are not in the abstract (PMC full text returned empty); unchanged and tested at every band edge. |
| PASCAL categories, RoPE ≥7, shunt >20 bubbles, ASA 10 mm | classifyReviewedPASCAL; field labels | verified | Heterogeneity of treatment effects … PFO closure — doi:10.1001/jama.2021.20956, PMID 34905030 — 2021-12-14; Goessinger et al., Int J Stroke 2024 — doi:10.1177/17474930241298778, PMC11966205 | accessed 2026-10-21, abstract + secondary PMC full text | "combines the RoPE Score with high-risk PFO features (either an atrial septal aneurysm or a large-sized shunt) … unlikely, possible, and probable"; "large if more than 20 bubbles"; "cut-off point of the RoPE score of 7" | Source population is age 18–60 (enforced). |
| PHASES predictors | calculateReviewedPHASES | verified (structure) | Development of the PHASES score — doi:10.1016/S1474-4422(13)70263-1, PMID 24290159 — 2013-11-27 | accessed 2026-10-21, abstract | "Predictors were age, hypertension, history of subarachnoid haemorrhage, aneurysm size, aneurysm location, and geographical region." | The point chart was not accessible; weights unchanged (2026-10-01 check) and tested at the size edges. |
| mRS grades and descriptors | MRS_DESCRIPTORS; encounter-inputs MRS_OPTIONS | verified | van Swieten et al., Stroke 1988 — doi:10.1161/01.str.19.5.604, PMID 3363593; DEFUSE 3 registry NCT02586415 outcome definition | accessed 2026-10-21, abstract + registry | "the modified Rankin scale, which has six grades (0-5)"; registry "4 - Moderately severe disability. Unable to attend to own bodily needs without assistance, and unable to walk unassisted." | Paraphrased descriptors match the registry text. Grade 6 is the outcome convention. |
| Hunt–Hess descriptors | HUNT_HESS_DESCRIPTORS | unresolved (not re-read) | Hunt & Hess, J Neurosurg 1968 — doi:10.3171/jns.1968.28.1.0014, PMID 5635959 | accessed 2026-10-21, metadata only (no abstract) | — | Unchanged; prior check against the Joint Commission data element (2026-10-01). |
| WFNS bands | calculateReviewedWFNS | unresolved (not re-read) | WFNS Committee report — doi:10.3171/jns.1988.68.6.0985, PMID 3131498 | accessed 2026-10-21, metadata only (no abstract) | — | Unchanged; all bands tested; the GCS 15 with motor deficit gap stays unscored. |
| Modified Fisher basis | calculateReviewedModifiedFisher | verified (basis); flagged (IVH-only mapping) | Prediction of symptomatic vasospasm: the modified Fisher scale — doi:10.1227/01.neu.0000243277.86222.6c, PMID 16823296 — 2006-07 | accessed 2026-10-21, abstract | "calculated on the basis of the presence of cisternal blood and intraventricular hemorrhage" | Thin/thick × IVH grades 0–4 are tested. Mapping no visible SAH with IVH to grade 2 was not re-verifiable. |
| mTICI 2c | MTICI_DESCRIPTORS | verified | 2C or not 2C — doi:10.1136/neurintsurg-2013-010665, PMID 23390038, PMC4156591 — 2013 | accessed 2026-10-21, PMC full text | "TICI 2C for situations when the angiogram is nearly normal but one or two of the M4 branches demonstrate slow flow or a tiny distal embolus" | 2b ">50%" verified 2026-10-17 (Zaidat 2013, PMC4160883). |
| NASCET formula, distal reference, near-occlusion exclusion | calculateReviewedNASCET | verified | NASCET methods — doi:10.1161/01.str.22.6.711, PMID 2057968 — 1991-06; Bartlett et al., AJNR 2006 — PMID 16418349, PMC7976065 | accessed 2026-10-21, abstracts | "moderate (30-69%) and severe (70-99%) stenosis"; "Distal internal carotid arteries (ICAs) were measured beyond the bulb … except for suspected near-occlusions" | — |
| ASPECTS 10 regions | ASPECTS_REGIONS | verified | Barber et al., Lancet 2000 — doi:10.1016/s0140-6736(00)02237-6, PMID 10905241 — 2000-05-13 | accessed 2026-10-21, abstract | "The score divides the middle-cerebral-artery territory into ten regions of interest." | — |
| pc-ASPECTS weights | PC_ASPECTS_REGIONS | verified | Puetz et al., Stroke 2008 — doi:10.1161/STROKEAHA.107.511162, PMID 18617663 — 2008-07-10 | accessed 2026-10-21, abstract | "Two points each are subtracted for EIC in midbrain or pons and 1 point each for EIC in left or right thalamus, cerebellum or PCA-territory" | — |
| PHQ-2 scoring and ≥3 cutpoint | calculateReviewedPHQ2; phq2 limits | added (cutpoint text); scoring verified | The Patient Health Questionnaire-2 — doi:10.1097/01.MLR.0000093487.78664.3C, PMID 14583691 — 2003-11 | accessed 2026-10-21, abstract | "scoring each as 0 ("not at all") to 3 ("nearly every day")"; "a PHQ-2 score > or =3 had a sensitivity of 83% and a specificity of 92% for major depression" | Primary care and obstetrics-gynecology population, stated. No band is computed. |
| STOP-BANG items, BMI >35 | calculateReviewedSTOPBANG | verified | STOP-Bang Questionnaire: A Practical Approach — doi:10.1378/chest.15-0903, PMID 26378880 — 2016; Chung et al., BJA 2012 — doi:10.1093/bja/aes022, PMC3325050 | accessed 2026-10-21, abstract + PMC full text | "eight dichotomous (yes/no) items"; "a BMI > 35 kg/m(2)"; "scored based on Yes/No answers (score: 1/0). Thus, the scores range from a value of 0 to 8" | — |
| STOP-BANG neck >40 cm; age threshold | calculateReviewedSTOPBANG | verified (neck); flagged (age) | Alternative scoring models of STOP-Bang — doi:10.5664/jcsm.4022, PMID 25142767, PMC4153119 — 2014 | accessed 2026-10-21, abstract | "neck circumference > 40 cm"; "age ≥ 50" | The app keeps >50 (2008 "over 50" wording not accessible). See §7. |
| STOP-BANG neck/height unit caution | calculateReviewedSTOPBANG neckWarning; copy text | added | Heuristic (no source); 16 in = 40.64 cm by definition | n/a | — | Non-blocking; the 25 cm limit is labelled a heuristic in the code. |
| kg/lb conversion | `src/encounter-inputs.js` weightInKg/displayWeight | verified | International avoirdupois pound = 0.45359237 kg exactly (definition) | n/a, no document fetched | — | Tested (176 lb → 79.832257 kg → TNK 19.96 mg / label 20 mg). |
| Post-thrombolysis neuro-check schedule | computeNeurocheckSchedule | unresolved (not re-read) | No source in the maintained projections; the AHA/ASA AIS IVT-management table was not accessible | not accessible | — | The schedule (q15 min × 8, q30 min × 12, hourly × 16 → 24 h) is tested for arithmetic only. |
| Prehospital LVO scale (RACE) not added as a calculator | §9 decision; Evidence acute-care topic | verified (no change) | AHA/ASA 2026 AIS guideline ais-2026-56 (2b, B-R) — PMID 41582814 — 2026 | accessed 2026-10-21, archived transcription (secondary) | "prefacility assessment with a validated stroke severity scale (e.g., RACE >4)" | Prefacility triage context only; no calculator added. |
| MCP calculator tools | `mcp/server.mjs` | verified (wrappers); flagged F7, F8 | wrapped functions above | accessed 2026-10-21, source review | — | Smoke test not run (SDK not installed). Patches P4–P5. |

## 5. Tests added and results

- `tests/calculators-2026-10-21.test.jsx`: 160 tests. Expected values are derived by hand from the source definitions, with the derivation in comments. Coverage:
  - ICH score: every tier and criterion, non-boolean and missing inputs, and the Encounter GCS→tier mapping at GCS 3/4/5/12/13/15 by rendering.
  - ABC/2 at 15 and 30 mL, threshold-safe display (29.995 → 29.9), and invalid inputs.
  - Cockcroft–Gault, adjusted weight, unit and invalid-input cases.
  - Alteplase and TNK at rounding and cap edges, plus the per-kg label warning.
  - lb→kg conversion feeding the dose; the neuro-check schedule.
  - GCS and NIHSS item structure, UN handling and partial exams.
  - DAWN and DEFUSE 3 at every registry boundary and window edge, including invalid ASPECTS.
  - Large-core trial tiers; DAPT branch edges, including the gating answers.
  - All 16 worksheets at their point edges.
  - Copy text for every worksheet: first line, limits, source, no `undefined`/`NaN`; STOP-BANG caution copied.
  - Global and Tools search synonyms.
  - Every registry route, alias and Evidence calculator link resolves to a live surface.
  - A keyboard-only headless Chromium flow: search → Tab → Enter opens → type-ahead answers → copy.
- Mutation check: run against the original af21b07 `calculators.js` and `calculators-extended.js`, exactly the two new behaviour tests (ICH booleans, DEFUSE-3 invalid ASPECTS) fail, as intended.
- Updated assertions in `tests/calculators.test.js` (3):
  - "GCS 3-4 scores 2" and "GCS 5-12 scores 1" now pass explicit `false` for the four binary criteria; the expected scores are unchanged.
  - `{gcs:'gcs1315', criteriaReviewed:true}` changed from 0 to `null`: an omitted criterion is unresolved. An explicit-negatives case asserting 0 was added.
- Results on this branch:
  - `npx vitest run`: 113 files, 2156 passed, 3 skipped, 0 failed (baseline 112 / 1996 / 3).
  - `npm run test:protocol-source`: PASS.
  - `npm run check:clinical-claims`: PASS.
  - `npm run content:validate`: PASS (pre-existing "no genuine clinical review date" warnings unchanged).
  - `npm run evidence:validate`: PASS.
  - `npm run validate:citations`: PASS.
  - `npm run validate:inline-citations`: PASS.
  - `npm run check:leak-guard`: PASS.
  - `npm run check:asset-budget`: PASS (§3).
  - `npm run build && STROKE_PROTOCOL_LOCK_PORT=4360 npm run test:protocol-tab`: PASS (46 fixture/sub-tab captures).
  - `npm run test:mcp`: not run (F17).
- `tests/clinical-reference-data.test.js` and `agent:assets:check` compare the generated `data/*.json` with source. They pass only after `npm run agent:assets` (or `npm run build`). The full run above used a local build; generated files are not committed.
- Cross-area patches P1–P3 (§8) were checked by applying them temporarily, then reverting:
  - three render and note assertions passed;
  - so did the existing `encounter-details`, `notes-review-7-8`, `lean-encounter-regressions` and `calculators-review-encounter-plausibility` suites (94 tests).
  - P4–P5 could not be exercised (no MCP SDK).

## 6. Protocols observations (report only)

None within the calculator scope. The Protocols quick-reference dose table and the protocol ABC/2 card call the same `calculateTNKDoseReviewed`, `calculateAlteplaseDoseReviewed` and `encounterVolume` functions verified above. Their hashed outputs are unchanged (source lock PASS). Protocol-card calculator chips (`#/encounter/nihss`, `aspects`, `pc-aspects`, `alteplase`, `tnk`) resolve to live Encounter targets.

## 7. Unresolved uncertainties

1. **STOP-BANG age threshold.** The app uses age >50, matching the original label "over 50". The Chung 2014 abstract once writes "age ≥ 50", and the 2008 instrument text was not accessible. Changing it would alter scores at age 50 exactly. Left unchanged pending the original questionnaire text.
2. **RoPE smoking item.** Secondary full texts describe "current smoking"; the original point table (Kent 2013) returned no full text. The label "Smoker" was not changed.
3. **Modified Fisher: IVH without visible SAH → grade 2.** Not re-verifiable today (Frontera 2006 Table 1 inaccessible). Not encoded in the new tests.
4. **Not re-read today.** HAS-BLED item definitions (SBP >160, creatinine ≥200 µmol/L, ≥8 drinks/week), PHASES point weights, Hunt–Hess and WFNS wording, EXTEND perfusion thresholds, the NINDS NIHSS item wording, GCS aid wording, and the AHA neuro-check table. All unchanged; earlier review dates are kept, apart from CHA₂DS₂-VASc and PHQ-2, which were re-read today at the scope stated.
5. **Labels (TNKase, Activase).** Checked only through secondary label copies (DailyMed/FDA blocked).
6. **CHA₂DS₂-VA definitions.** The ESC 2024 full text was not read, so the app still does not compute CHA₂DS₂-VA and makes no claim about its component definitions.
7. **MCP smoke test.** Not run here.

## 8. Cross-area patches for the lead

Not applied on this branch (files owned by the encounter unit or outside this unit's scope). Each was prepared against af21b07 + this branch. P1–P3 were verified by temporary application (§5).

**P1 — `src/Encounter.jsx` (F9), CrCl no-result message.** Replace

```
'No result: valid adult age, kg weight, sex coefficient and mg/dL creatinine required.'
```
with
```
String(n.heightCm ?? '').trim() !== '' && numericInput(n.heightCm, { min: Number.MIN_VALUE, max: 300 }) === null ? 'No result: correct or clear the optional height (positive centimeters).' : 'No result: valid adult age, kg weight, sex coefficient and mg/dL creatinine required.'
```

**P2 — `src/Encounter.jsx` (F10), DEFUSE-3 line.** Replace

```
{label}: {result?.reason || (label === 'DEFUSE-3' && perfusionOrderIssue ? 'Total hypoperfused volume (Tmax >6 s) is below the core; it includes the core, so check whether the mismatch volume was entered instead.' : 'Required inputs incomplete.')}
```
with
```
{label}: {result?.reason || (label === 'DEFUSE-3' && perfusionOrderIssue ? 'Total hypoperfused volume (Tmax >6 s) is below the core; it includes the core, so check whether the mismatch volume was entered instead.' : label === 'DEFUSE-3' && n.wakeUpStrokeWorkflow.mriAvailable !== true && String(s.aspects ?? '').trim() !== '' && numericInput(s.aspects, { min: 0, max: 10, integer: true }) === null ? 'Reviewed ASPECTS must be a whole number from 0 to 10, or blank, before this screen is applied.' : 'Required inputs incomplete.')}
```

**P3 — `src/encounter-details.js` (F11), follow-up worksheet line.**

```diff
-      if (field.type === 'worksheet') return field.result ? [`${field.label}: ${field.result.score}/${field.result.max}`] : [];
+      if (field.type === 'worksheet') return field.result ? [`${field.label}: ${field.result.score}/${field.result.max}${[field.result.heightWarning, field.result.neckWarning].filter(Boolean).map(text => ` [${text}]`).join('')}`] : [];
```

**P4 — `mcp/server.mjs` (F7), `calc_crcl`, after the destructuring line.**

```diff
     const { label, renalCategory, isLow, isBorderline, ...result } = reviewed || {};
+    // As in Encounter: an implausible height drives the obesity adjustment, so no adjusted-weight estimate is returned.
+    if (reviewed?.heightWarning) Object.assign(result, { adjBwValue: null, rawAdjBwValue: null, obesityWarning: null });
```

**P5 — `mcp/server.mjs` (F8), `calc_defuse3_eligibility` input schema.** `evaluateDEFUSE3` already honours `perfusionModality: 'mri'`.

```diff
       aspects: z.number().int().min(0).max(10).optional().describe('Reviewed NCCT ASPECTS; DEFUSE 3 excluded ASPECTS <6 when enrolled on CT perfusion'),
+      perfusionModality: z.enum(['ct', 'mri']).default('ct').describe('Selection imaging; mri does not apply the CT-perfusion NCCT ASPECTS <6 exclusion'),
```

Routing (`src/workspace-routing.js`): no alias fix is needed. Every registry route, every alias and every calculator link in `src/reference/*.json` resolves (tested). Optional and low value: `large-core` → `dawn`, since the large-core screen sits inside the DAWN/DEFUSE-3 disclosure.

## 9. Proposed additional tools (evaluated, none added)

Criteria for adding a tool: an authoritative definition, adequate external validation, clear on-call value in this workflow, honest limitations, and budget room. Each budget is at about 97% of its limit (§3).

| Tool | Decision | Reason |
|---|---|---|
| RACE, LAMS, FAST-ED, VAN (prehospital LVO scales) | Not added | These are EMS triage instruments. This workflow begins with a hospital consult where CTA and the itemized NIHSS are available, and a reported field score adds little to an imaging decision. None is present in Protocols. The Evidence acute-care topic already gives the RACE items and their ≥5 accuracy, and the archived ais-2026-56 (2b, B-R) cites RACE >4 only for prefacility triage to direct angiography. On-call value is low against the remaining budget. |
| FUNC, SEDAN, DRAGON, HAT | Not added | Individual outcome or hemorrhage prediction tools. The app deliberately retired individualized prognosis outputs, and its Evidence card records the NCS guidance that original severity scores alone are not reliable predictors (verified 2026-10-17). No recommendation in the app's maintained guideline projections uses them (searched `src/guidelines/*.json`). |
| Canadian TIA score | Not added | TIA disposition rests on imaging and vascular workup. The app's TIA review already refuses to clear discharge from a score, and ESO 2021 (in-repo, verified 2026-10-17) advises against prediction tools alone. A multi-item ED instrument would cost budget for limited decision value here. Its validation literature was not reviewed today. |
| ESSEN | Not added | A recurrence-risk score that would not change any antithrombotic or acute choice the app models. Its validation literature was not reviewed today. |
| CHA₂DS₂-VA | Not added as a worksheet; attributed note added (F5) | ESC 2024 full-text definitions were not accessible. The 2023 US guideline still uses CHA₂DS₂-VASc. |
