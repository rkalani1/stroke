# Possible Protocols-tab issues found during the 7.8.0 review

The Protocols tab is frozen. Nothing below was changed or annotated in the app; each item is reported for the protocol owner's adjudication. Do not treat the Protocols text as evidence for other sections, or these notes as corrections.

Verification status: evidence items were raised by the clinical auditors from primary abstracts, PMC full text or registry records, or by comparison with the app's archived guideline transcription (marked). The planned second independent verification of these report-only items did not complete before the release deadline, so each is an auditor finding, not an adjudicated error. Behaviour items were reproduced in the built app by the Protocols-dependency mapper.

## Clinical-content observations

### Protected late-window caveat describes TRACE-5 as a late-window bridging trial (report only)
- Where: src/evidence/recommendations.js — rec-late-window-ivt.caveats[4] (line 126) [PROTECTED]
- Observation: TRACE-5 did report benefit. However, it enrolled basilar occlusion within 24 h, not only 4.5–24 h, and compared tenecteplase with standard medical treatment, with alteplase in 35% of controls and EVT in 49%. It is not a late-window bridging (TNK-before-EVT vs EVT-alone) trial like TNK-PLUS or ATTENTION LATE.
- Evidence: TRACE-5 (Lancet 2026;407:763-772) (PMID 41655588; doi:10.1016/S0140-6736(25)02633-9; abstract)
- Auditor severity / confidence: low / high (source: B1-ivt-1 B1-ivt-1-F15)

### Institutional wake-up branch is narrower than AHA 2026 rec 101 shown on the Evidence card (report only)
- Where: src/management-guidance.js lines 59-73 [PROTECTED]
- Observation: The Evidence extended-window card correctly shows ais-2026-101 (2a). That recommendation allows automated-perfusion selection for wake-up stroke within 9 h of the sleep midpoint in EVT-ineligible patients. The institutional pathway excludes that route. This is a labeled local-policy difference, not an error, but the two tabs give different wake-up imaging routes.
- Evidence: AHA/ASA 2026 AIS — archived transcription ais-2026-101 (PMID 41582814; secondary-summary)
- Auditor severity / confidence: low / high (source: B1-ivt-1 B1-ivt-1-F16)

### Protocols side: extended-window pathway grades a known-onset 4.5–9 h MRI route IIa/B-R and allows only MRI for wake-up
- Where: src/management-guidance.js → id 'ais-ivt-extended' (line 50); actions line 62; pathway row line 70 (PROTECTED)
- Observation: Two mismatches with the Evidence-tab quotes:
- MRI route: ais-2026-100 (DWI–FLAIR, 2a) applies only to unknown onset within 4.5 h of symptom recognition. Known-onset 4.5–9 h is graded only for automated perfusion in EVT-ineligible patients (ais-2026-101). The IIa/B-R label on the MRI branch therefore cites a recommendation whose population it does not match.
- CTP for wake-up: the Protocols exclude it, which is narrower than ais-2026-101 (perfusion within 9 h of the sleep midpoint, 2a). This may be intentional local policy (docs/source-limits.md 7.7.4).
- Evidence: Archived AHA/ASA 2026 transcription ais-2026-100/101 (match the extended-window-ivt quotes) (git 4f8e99d:src/guidelines/ais-2026.json; secondary-summary)
- Auditor severity / confidence: medium / medium (source: B1-ivt-2 B1IVT2-06)

### Protocols side: protected citation record for AIS 2026 lacks volume/pages
- Where: src/evidence/citations.js → cit-aha-ais-2026 (lines 590–603; PROTECTED)
- Observation: PubMed now lists Stroke 2026;57(8):e316–e436. The file is protected, so this is reported only.
- Evidence: PubMed record for the AIS 2026 guideline (PMID 41582814; abstract)
- Auditor severity / confidence: low / high (source: B1-ivt-2 B1IVT2-14)

### PROTOCOLS-SIDE: protected pediatric reperfusion text differs from AHA 2026 windows/criteria (report only; no change proposed)
- Where: src/ProtectedProtocols.jsx lines 1797, 1802 (Pediatric EVT flowchart) and 2077-2079 (Pediatric Reperfusion card)
- Observation: AHA 2026 splits pediatric EVT for age >=6 y into <=6 h (2a, no tissue criterion; ais-2026-133) and 6-24 h with potentially salvageable tissue (2a; ais-2026-134). For 28 d-6 y it is <=24 h with salvageable tissue and a pediatric-experienced operator (2b; ais-2026-135). Pediatric IVT is alteplase for confirmed AIS with disabling deficits (2b; ais-2026-97). The Protocols card states no windows or tissue criteria. The flowchart applies a tissue criterion inside 6 h and caps age at 17. These differences sit in protected Protocols content; once B10-F01 is applied, the Evidence card will be more specific than the Protocols card.
- Evidence: AHA/ASA 2026 AIS archived transcription (table-28 recs 1-3; table-19 rec 14) (PMID 41582814; ais-2026-133/-134/-135/-97; secondary-summary)
- Auditor severity / confidence: medium / high (source: B10-systems-populations-diagnosis B10-P01)

### Protected Protocols attach AHA grades to institutional large-core qualifiers (mass effect, CTP core) not in recs 114/117
- Where: src/institutional-protocols.js lines 533–551; src/ProtectedProtocols.jsx lines 429–438; src/management-guidance.js lines 105–107 (protected; read-only)
- Observation: ais-2026-114 (COR 1, A) covers ASPECTS 3–10 within 6 h with no mass-effect criterion, and the Evidence large-core card says exactly that. ais-2026-117 (2a, B-R) has no core-volume criterion. The Protocols show the AHA grade only when the institutional-flowchart qualifiers are met, and 'Pending' otherwise. The qualifiers are more conservative than the AHA text and consistent with the trials' exclusion of mass effect. Whether an AHA EVT figure contains them could not be accessed.
- Evidence: AHA/ASA 2026 AIS ais-2026-114/-117 (archived transcription) (PMID 41582814; archived-transcription (internal consistency)); SVIN large-infarct guideline (full text) (PMID 41573174; PMC12671639; full-text)
- Auditor severity / confidence: low / medium (source: B2-evt-1 B2E1-09)

### PROTECTED rec-evt-large-core caveat drops 'without significant mass effect' (and NIHSS ≥6, LOE B-R) for ais-2026-117
- Where: src/evidence/recommendations.js:160 (rec-evt-large-core caveats[1]); text at line 153
- Observation: ais-2026-117 (IIa/B-R) also requires NIHSS ≥6 and 'without significant mass effect'; the caveat leaves both out while warning against exactly that. The main text also omits 'and reduce mortality' from ais-2026-114/116. The Evidence-tab large-core-evt summary carries the full bounds, so the two tabs differ in completeness rather than direction.
- Evidence: AIS 2026 projection / archived full transcription (internal consistency) (src/guidelines/ais-2026.json ais-2026-117 (line 620); archive cc2b53f^; secondary-summary); AHA guideline compendium summary (via WebSearch) (https://eguideline.guidelinecentral.com/i/1542862/35; secondary-summary)
- Auditor severity / confidence: low / high (source: B2-evt-2 B2-evt-2-F11)

### Protocols side: nondominant M2/ACA/PCA EVT rationale lacks the ORIENTAL-MeVO note that the codominant branch carries
- Where: src/ProtectedProtocols.jsx line 367 (EVT evaluator branch for 'mvo-nondominant', 'aca', 'pca')
- Observation: The codominant branch (line 376), the MeVO block (line 2321), institutional-protocols.js line 625 and management-guidance.js line 166 all add 'ORIENTAL-MeVO (2026, after the guideline) reported benefit with NIHSS ≥6; individualize only with the neurointerventional team.' This branch does not, although ORIENTAL-MeVO also enrolled non-dominant M2, ACA and PCA occlusions. The Evidence card (medium-distal-evt) presents ORIENTAL-MeVO as positive across these segments. Protocols and Evidence are internally inconsistent; the guideline grade itself is not in dispute.
- Evidence: ORIENTAL-MeVO registry record (NCT06146790; registry)
- Auditor severity / confidence: low / high (source: B2-evt-3 B2E3-12)

### PROTOCOLS (report only): the institutional post-EVT SBP floor of 140 after mTICI ≥2b goes beyond the evidence
- Where: Places the 140 floor appears:
- src/ProtectedProtocols.jsx l.154 (bpPhaseTargets 'post-evt' systolicLow: 140)
- l.186–194 (checker requires SBP ≥140 when mTICI ≥2b)
- l.2151 ('The entered value does not meet the selected institutional threshold.')
- l.1724, l.2163, l.2304
- src/institutional-protocols.js l.26–27
- src/management-guidance.js l.136/142
- src/components/QuickReference.jsx l.166 ('Local protocol: SBP 140–180')
- Observation: AHA ais-2026-77 and the ESO 2025 update recommend against intensive lowering to <140. Neither sets a floor that makes spontaneously lower SBP a target to raise. ESO notes that no randomized evidence supports induced hypertension after successful thrombectomy, with particular concern after mTICI 3. HOPE (2026) targeted 100–140 after mTICI 2c/3 and found better outcomes, and BP-TARGET's intensive arm (mean SBP 128) showed no difference in intraparenchymal hemorrhage. Flagging SBP 120–139 after complete reperfusion as off-target could prompt BP augmentation without evidence. This is labeled local policy, so it is reported only.
- Evidence: ESO 2025 update, PICO 4 additional information (PMC13151662; full-text); ESO 2025 update abstract (PMID 42095756; abstract); HOPE full text (PMC13247842; full-text)
- Auditor severity / confidence: medium / medium (source: B3-acute-bp B3-P1)

### PROTOCOLS (report only): the Protocols paraphrase of ais-2026-77 drops its population and duration qualifiers
- Where: src/ProtectedProtocols.jsx l.2165 and l.2304; src/components/QuickReference.jsx l.166
- Observation: The COR 3: Harm recommendation is limited to anterior-circulation LVO with no other indication for specific BP targets, for the first 72 hours. The Protocols wording drops all three qualifiers.
- Evidence: AHA/ASA 2026 ais-2026-77 (src/guidelines/ais-2026.json projection) (PMID 41582814; app projection/archive transcription)
- Auditor severity / confidence: low / high (source: B3-acute-bp B3-P2)

### PROTECTED: warfarin reversal rec attributes 'IV vitamin K 10 mg' to AHA/ASA 2022, which states no dose
- Where: src/evidence/recommendations.js → rec-ich-anticoag-reversal-warfarin.text (line 96)
- Observation: ich-2022-28 (I, C-LD) recommends IV vitamin K immediately after factor replacement but gives no dose. The 10 mg figure matches ESO 2019 and the archived ESO/EANS 2025 consensus, not AHA 2022. This is an attribution imprecision, not a dosing error. The Evidence-tab card says only 'then IV vitamin K (COR 1)' and is accurate. Protected Protocols content: reported only, no change proposed.
- Evidence: AHA/ASA 2022 ICH guideline ich-2022-28 (archived transcription; matches projection) (PMID 35579034; internal archive transcription (full text not accessible)); ESO Guideline on Reversal of Oral Anticoagulants in Acute ICH, Eur Stroke J 2019;4:294-306 (PMID 31903428; PMC6921939; doi:10.1177/2396987319849763; abstract)
- Auditor severity / confidence: low / medium (source: B4-ich-1 B4-ich-1-P1)

### PROTECTED: smooth-BP-control rec source line lists INTERACT3 beside the AHA IIa/B-NR grade
- Where: src/evidence/recommendations.js → rec-ich-bp-smooth-control.guidelineSource (line 19)
- Observation: The IIa/B-NR grade belongs to ich-2022-21 alone. INTERACT3 postdates the guideline and tested a bundle, so listing it in the grade's source line can imply it informed the class. The rec's caveats already warn against BP-only attribution. Protected: reported only.
- Evidence: AHA/ASA 2022 ICH guideline ich-2022-21 (projection) and INTERACT3 abstract (PMID 35579034; PMID 37245517; abstract)
- Auditor severity / confidence: low / medium (source: B4-ich-1 B4-ich-1-P2)

### PROTECTED: the local '≤25% in the first hour' rule can exceed the ESO 70 mmHg reduction ceiling cited on the Evidence card
- Where: src/ProtectedProtocols.jsx line 1378 (ICH Blood Pressure Target card)
- Observation: The Evidence card ich-management caution reads 'avoid SBP drops >70 mm Hg or below 110 (ESO 2026 consensus)'. The ESO BP update text also cites a pooled INTERACT2/ATACH-2 analysis linking >70 mmHg first-hour reductions to unfavourable outcomes. For presenting SBP above about 280 mmHg, a 25% reduction exceeds 70 mmHg. This is an edge-case discordance between Evidence and Protocols. Protected: reported only.
- Evidence: 2025 update to ESO guideline on BP management in AIS and ICH, Eur Stroke J 2026;11(5) (PMID 42095756; PMC13151662; doi:10.1093/esj/aakag004; full-text)
- Auditor severity / confidence: low / medium (source: B4-ich-1 B4-ich-1-P3)

### Protocols side truncates the ich-2022-27 LOE as '1/B' (reported only, no change proposed)
- Where: src/ProtectedProtocols.jsx lines 856 and 1261: 'INR ≥ 2.0 (COR/LOE 1/B)'
- Observation: The ACC/AHA LOE for ich-2022-27 (4F-PCC over FFP, INR ≥2.0) is B-R (randomized, INCH trial). The Evidence card and protected QuickReference show '1, B-R'; the protocol shows an undifferentiated 'B'. The grade direction is the same, so this is not a clinical disagreement.
- Evidence: INCH: FFP vs PCC in VKA-related intracranial haemorrhage (Lancet Neurol 2016;15:566-73) (PMID 27302126; DOI 10.1016/S1474-4422(16)00110-1; NCT00928915; abstract)
- Auditor severity / confidence: low / high (source: B4-ich-2 B4-ich-2-F07)

### Protocols-side: protected levetiracetam SAH prophylaxis criteria and duration differ from AHA 2023 and NCS 2026
- Where: src/ProtectedProtocols.jsx line 302 (LEVETIRACETAM note), protected
- Observation: The criteria match neither high-risk list. AHA 2023 (archive) lists ruptured MCA aneurysm, high grade, ICH, hydrocephalus and cortical infarction. NCS 2026 expert guidance lists high-grade SAH, anterior circulation aneurysm, intraparenchymal hemorrhage, hydrocephalus requiring CSF diversion and clipping. 'Seizure at onset' is treatment, not prophylaxis. NCS 2026 advises not continuing prophylaxis beyond 3 days without seizures. Reported for the protocol owner only.
- Evidence: NCS aSAH seizure prophylaxis guideline 2026 (PMID 42552475; PMC13642444; full-text)
- Auditor severity / confidence: low / medium (source: B5-sah-cvt-other B5-17)

### Protected DAPT record uses AHA 2021 '≥30% stenosis' threshold; Evidence card and THALES use ≥50%
- Where: src/evidence/recommendations.js line 177 (rec-dapt-minor-stroke caveats[1]); headline text line 170
- Observation: The protected caveat faithfully copies the AHA 2021 wording, but its stenosis threshold (≥30%) differs from the Evidence card's AHA 2026 quote (ais-2026-148: ≥50%). THALES TIA eligibility was ≥50%. The headline also reflects 2021 rec 146 (21–90 days, within 7 days) rather than the current 2026 Class I (21 days, within 24 h, no IVT), although caveat 1 explains this. The protected record and the Evidence tab therefore state different TIA stenosis thresholds for ticagrelor-aspirin.
- Evidence: THALES rationale and design (PMID 30747613; PMC6826854; full-text); AHA 2021 secondary-prevention-2021-147 (projection line 57; archive identical) vs AHA 2026 ais-2026-148 (projection line 726) (PMID 34024117; PMID 41582814; secondary-summary)
- Auditor severity / confidence: low / high (source: B7-antiplatelet-tia B7-F13)

## Behaviour observations (reproduced in the built 7.7.13 app)

- **IVT card can show an affirmative, dose-bearing verdict while Encounter says the safety review is incomplete.** Ticking only the card-local contraindication checkbox produced "TNK recommended — standard window, COR 1, LOE A" while the Encounter screen still read "Complete the IVT contraindication review" (pocket-cards.jsx 112-113, institutional-protocols.js 362-380; workspace-state.js passes the raw `ivtContraindicationsReviewed`).
- **The EVT builder's "Disabling deficit present" checkbox writes an explicit No to Encounter when unticked**, which then flips the IVT card and Encounter screen to "not recommended (COR 3: No Benefit)" (ProtectedProtocols.jsx 2001-2003; app.jsx write-back).
- **Over-broad local resets:** any Encounter note edit (even clinician name) clears IVT-card attestations, EVT status and builder selections because the reset key includes the whole note (workspace-state.js sourceKey; pocket-cards.jsx 58-64).
- **Silent non-results:** the IVT card hides every `eligible === null` result, including the pediatric "adult IVT algorithm does not apply" message (age 10 reproduced); the M2 card hides pending results (pocket-cards.jsx 214, 342).
- **Incomplete builder input reads as "No institutional EVT tier"** rather than a pending prompt when ASPECTS, mRS or pc-ASPECTS is missing (ProtectedProtocols.jsx 413-454).
- **The "Linked to Encounter" line is always shown**, although NIHSS, elapsed time and CT/deficit are projected only for acute ischemic encounters.
- **Reversal timing:** a future or invalid last-dose time is treated as "timing unknown"; UFH, LMWH and "other" get no patient-specific Quick Reference line.
- **Diagnosis-dependent banners keep an empty icon placeholder** (lucide icons are created only on tab/modal change).

## Not a Protocols change in 7.8.0
- SAH encounters now open the ICH Protocols sub-tab from the header and search, matching the case bar. The Protocols content itself is unchanged; the rendered lock (46 states) and the source hash lock pass.

# 7.9.0 review (2026-10-21): additional Protocols observations, report only

7.9.0 makes no Protocols change of its own. It carries the owner's 7.8.1–7.8.3 Protocols edits from `main` unchanged (next section). The rendered lock (46 synthetic states) passes at 1440 px and, new in this release, at 390 px, and the source hash lock and the example-protocols snapshot pass. Nothing below was changed or annotated in the app. Each item needs the protocol owner's decision; the first decision item is a cross-surface conflict that could not be fixed without changing Protocols output.

## Owner changes in 7.8.1–7.8.3 and the lock re-baseline (2026-10-30)
- While this review ran, 7.8.1–7.8.3 were pushed to `main` (2026-10-26). They edit three frozen Protocols files: `src/ProtectedProtocols.jsx` and `src/pocket-cards.jsx` (sticky and scroll offsets for the new sticky header) and `src/components/QuickReference.jsx` (the bedside quick reference became one disclosure that starts closed). CI failed on all three pushes because the source lock record was not updated, so the rendered lock never ran there.
- Check before re-baselining: the rendered lock was run on an untouched checkout of `main` (88f53b9) against the 7.8.0 baselines, then every capture was regenerated from that checkout and diffed line by line. Across all 46 fixture/sub-tab captures the only difference is one removed line, `h2: Bedside quick reference` (the heading is now the disclosure's summary). Every protected line is identical: wording, numbers, doses, thresholds, links, tables and the content behind each disclosure. The example-protocols snapshot passes on `main` unchanged.
- The 7.9.0 branch takes those three files from `main` byte for byte. The captures in `tests/snapshots/protocols-tab/` are the ones generated from `main`, not from this branch, and `source-lock.json` changes only the three file hashes (export and behaviour hashes are unchanged). This branch then passes the rendered lock at desktop and phone width against them, so 7.9.0 adds no Protocols change of its own.
- For the owner: the quick reference now starts closed. Case-bar and search links to a quick-reference card still open it (the reveal helper opens every closed parent disclosure). If the closed default was not intended, that is a one-line change in `QuickReference.jsx` for the owner.

## Decision needed: reversal card and Encounter can disagree about a mistyped last-dose time
- Where: `src/app.jsx` computes the quick-reference reversal input `lastDoseHours` with `Date.parse(state.note.lastDOACDose)`; Encounter uses its strict `validTimestamp`.
- Observation: `Date.parse` (V8) rolls an impossible date forward (`2026-02-30T08:00` becomes 2 March), accepts a time skipped by the spring-forward change, and silently picks one occurrence of a repeated hour. Encounter rejects all three. For an acute ICH on apixaban with the mistyped dose `2026-02-30T08:00` at 2026-10-21 10:00 (Los Angeles), reproduced with `reversalDoseLine`: Encounter says "last-dose time unknown (treat as within the local <24 h trigger) — 4F-PCC 2000 units IV"; the Protocols card says "last dose 5593 h ago — beyond the local <24 h trigger; reverse only with renal impairment or an elevated anti-Xa level."
- Why not fixed: the input feeds the frozen quick reference, so correcting it changes Protocols output (only for invalid, skipped or ambiguous dose times). Suggested fix if approved: compute `lastDoseHours` with `validTimestamp(state.note.lastDOACDose, now)` in `src/app.jsx`, as Encounter does, and add a lock fixture with an impossible dose date.
- Source: the app's own local rule that unknown timing is treated as within the trigger (CHANGELOG 7.7.4). Found by the encounter review unit.

## Decision needed: IVT card is not held when a checklist "No" is contradicted elsewhere in Encounter
- Where: `protocolEncounter()` in `src/workspace-state.js` (hash-locked projection that drives the Protocols "IVT card held" banner).
- Observation: an independent end-to-end review found that when the IVT checklist says "No" to an item that other Encounter entries contradict (reproduced with infective endocarditis recorded as the care context), Encounter already showed a critical conflict, but the IVT screen, the case-bar dose and the Protocols banner did not hold, as they would for "Yes". 7.9.0 holds the Encounter IVT screen and the case-bar dose (`contradictedAsYes` in `src/encounter-clinical-review.js`); the Protocols banner is unchanged because changing it alters Protocols output.
- Suggested fix if approved (one line in `protocolEncounter`, plus importing `contradictedAsYes`): pass `{ ...contradictedAsYes(n, nowMs, state.details), nihss }` as the note to `evaluateVideoTreatment`. Tried in a scratch copy only: the card was held for the conflict and only for it, and the source lock still passed; the rendered lock was not run on that variant. Add a lock fixture for the conflict if approved.

## Boundary wording (low)
- Post-IVT: the local protocol says "treat if SBP >180 or DBP >105; maintain BP below 180/105" (`institutional-protocols.js`); ais-2026-74 (COR I, B-R) says "maintained below 180/105 mmHg", so exactly 180 or 105 is neither below target nor a treatment trigger. The Encounter case bar now flags ≥180/≥105.
- Pre-IVT: the local exclusion list prints "SBP >185 or DBP >110 mmHg on repeated measures"; ais-2026-72 requires lowering "below 185 mmHg and DBP below 110 mmHg". The Encounter checklist label now reads ≥185/≥110, matching its long-standing logic. The two surfaces therefore word the same boundary differently until the owner decides.
- Round-3 verification confirmed both items independently and proposed the same wording for the owner: "treat if SBP ≥180 or DBP ≥105" and "SBP ≥185 or DBP ≥110".

## EVT tiers with institutional qualifiers (low)
- The frozen EVT quick reference grades "0–6 h ASPECTS 3–5 with no significant mass effect: EVT, COR I / LOE A". ais-2026-114 (ASPECTS 3–10) has no mass-effect or age criterion. It also grades "ASPECTS 0–2, age <80, no significant mass effect, and CTP core ≤70 mL: COR IIa / LOE B-R"; ais-2026-117 has no CTP-core criterion. These may be intended local policy; if so, the owner may want them labelled "AHA grade with institutional qualifier". Encounter's EVT screen messages in 7.9.0 follow the AHA text.

## Citations and wording to check (low)
- The IVT exclusion list's DOAC detail cites the "AHA/ASA 2019 AIS guideline (PMID 31662037)"; the 2026 guideline (PMID 41582814) states that it replaces the 2018 guideline and the 2019 update.
- Pediatric card: "In sickle cell disease, acute pediatric management centers on exchange transfusion (STOP-era protocols) rather than lysis." STOP was a primary-prevention transfusion trial; ASH 2020 acute-management text could not be read in this review, so no discrepancy is asserted.
- Kcentra INR-tier dosing and idarucizumab 5 g in the locked reversal file could not be re-verified against the labels (DailyMed blocked). The quick-reference BP rows, glucose rows, TNK label bands and 3-h window, andexanet withdrawal note and nimodipine regimen were checked and agree with the sources read.

## MINUTE pre-screen time limit (low)
- `src/institutional-protocols.js` research screen "MINUTE screen" lists "Arrival <=15 hours since last known well". The ClinicalTrials.gov record NCT07260916 (read 2026-10-22, full registry record) has inclusion 8: "Randomization within 16 hours from LKW and within 2 hours of arrival to the randomizing center." The Trials-tab MINUTE profile follows the registry (≤16 h from LKW, within 2 h of arrival). A patient arriving 15–16 h after last known well and randomized by 16 h fits the registry but not the Protocols screen. The 15 h figure may be a deliberate local buffer; if so, the owner may want it labelled as a local operational cutoff. Found by the round-3 trials verifier; not changed.

## Extended-window CTP gate rounds before comparing (low)
- `protocolEncounter()` (`src/workspace-state.js`, about line 114; hash-locked) rounds the CTP ratio to 0.01 and the mismatch volume to 0.1 mL before the frozen extended-window pathway compares them inclusively (`ratio >= 1.2`, `mismatchVol >= 10` in `src/institutional-protocols.js`, about lines 387–388). Core 49.9 mL with total 59.86 mL projects as ratio 1.2 and mismatch 10 mL and meets both gates, although the true values are 1.1996 and 9.96 mL. The EXTEND registry (NCT01580839) uses strict "> 1.2" and "> 10 mL". Only values within rounding distance of the thresholds are affected. Encounter's own note now prints such edge values with two more decimals (7.9.0). Suggested fix if approved: compare unrounded values, and decide whether the local gate is meant to be inclusive. Found by the round-3 encounter unit; not changed.

## Pocket-card premorbid mRS options include 6 (low)
- The EVT pocket cards in `src/pocket-cards.jsx` (about lines 292, 335 and 362) offer premorbid mRS 6 (death), and the anterior card writes the value back into the Encounter. A premorbid mRS of 6 is not a meaningful input. Encounter displays a 6 that arrives this way rather than dropping it. Found by the round-3 encounter unit; not changed.

## Safe Pause text at phone width (low)
- At 390×844 the read-only Safe Pause text area sits partly under the docked navigation bar. The shell's Tab-reveal helper deliberately skips the Protocols panel. Extending it there (removing the `#tabpanel-protocols` exclusion in `src/app.jsx`) would change Protocols behaviour, so it was left for the owner. Found by the round-3 shell unit; the phone lock's clipping check passes because the text remains reachable by scrolling.

## Pediatric EVT wording (low)
- `src/ProtectedProtocols.jsx` (about line 2079) says EVT for ages 28 days–6 years by an "experienced neurointerventionalist"; the AHA 2026 recommendation (archived transcription) says "with pediatric experience". Possibly intended; the owner may want the source wording. Found by the evidence-fixes unit; not changed.

## Presentation (low)
- `ProtectedProtocols.jsx` scrolls with `behavior: 'smooth'` on sub-tab switch, section jumps and reveals; a script-requested smooth scroll ignores the reduced-motion preference.
- Reveals at larger browser text sizes (found by the 7.9.0 pre-merge verification, 2026-10-30). Case-bar links, search results and deep links land a Protocols target 104 px below the case bar, exactly where 7.8.3 lands it (8 px padding plus a 96 px margin). That space fits the stuck breadcrumb and sub-tabs at the default text size only. With Chrome's text size set to Large (20 px), the top 7.8 px of the focused card (its border, the top of its focus ring and part of the INST badge) sits under the sub-tabs. At Very large (24 px) it is about 30 px, and at 200% text about 74 px. The card heading stays visible at Large and Very large. 7.8.3 lands on the same pixel in every case, so this is not a 7.9.0 change. Suggested fix if wanted: have `src/app.jsx` measure the stuck breadcrumb and sub-tab heights, as it already does for `--header-h`, and pad by the larger of 104 px and that height plus 6 px. That leaves today's landing unchanged at the default text size. It is not done here because it changes where the Protocols surface lands content.
- Keyboard paging on Protocols (7.9.0 shell change; no Protocols file or text changed). The root scroll padding now covers the stuck breadcrumb and sub-tabs, so keyboard focus is never left under them. Page Down and Space therefore scroll about 84 px less than on 7.8.3 at 481 px wide and above, because Chrome pages by 0.875 × (viewport height − scroll padding). For example, a page step is 576 px instead of 660 px at 1440×900, and 281 px instead of 365 px at 481×700. On 481–768 px screens the 7.8.3 step was longer than the band visible under the bars, so each page skipped 22–37 px of protocol text unseen; the new step skips none. When Tab reaches a control that is off screen, Chrome now places it about 48 px lower than on 7.8.3. At 390 px both behave the same.
- The "IVT card held" banner is inserted together with its `role="status"`, a pattern that some screen readers do not announce; it sits inside the locked surface.
