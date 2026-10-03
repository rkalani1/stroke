# Retained source limitations

Clinical review dates are copied from existing records. Corpus pruning,
metadata lookup, arithmetic tests and a successful build do not constitute
clinical validation. `workspace-sources.json` explicitly leaves missing review
dates null. Retained AIS correction updates remain partially applied. The
neuroprognostication source retains its original body/table discrepancy for
ASTRAL even though individualized prognosis outputs are retired.

The two protected ICH factor-Xa drug-removal passages were corrected with
explicit owner authorization on 2026-10-01: "Yes, apply that correction, then
finish the checks, merge, and deploy." The accepted wording is:

> Rivaroxaban is not dialyzable. Hemodialysis does not appear to substantially
> affect apixaban exposure and does not significantly contribute to edoxaban
> clearance. Follow the approved agent-specific reversal pathway and specialist
> assessment.

Primary label evidence was rechecked for this scoped correction:
- [Xarelto prescribing information, revised March 2026](https://www.jnjlabels.com/package-insert/product-monograph/prescribing-information/XARELTO-pi.pdf), §§5.2/10: high protein binding prevents dialysis removal.
- [FDA Eliquis label, 2025](https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/202155Orig1s039%2Cs040lbl.pdf), §5.2: hemodialysis does not appear to substantially affect exposure.
- [Savaysa prescribing information on DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e77d3400-56ad-11e3-949a-0800200c9a66), §§5.3/8.6/10/12.3: hemodialysis does not significantly contribute to edoxaban clearance.

Only the two approved passages and their four affected snapshot lines change.
The remaining protected protocol wording, rules, modals and Telestroke lock
are preserved. Dabigatran is a separate branch and is unchanged. This resolves
the named release gate; it does not certify the entire reversal pathway or
refresh unrelated clinical review dates. No automatic PCC or dialysis action
is exposed through the MCP interface or Encounter.

The maintained source projections retain exactly selected recommendation
records and original review/correction provenance. AIS 2026, ICH 2022,
NCS AIS neuroprognostication 2026, NCS reversal 2026, SVIN large-core 2025,
and AHA/ASA secondary prevention 2021 cover the surviving dependencies.
The last contains only DAPT population/duration and harm qualifiers referenced
by retained recommendations; it is not a restored guideline browser.

Retired public guideline URLs return a schema-2 retirement envelope with null
data. The full committed source corpus and teaching artifacts are preserved at
`archive/pre-encounter-first-20261001-4f8e99d`; they are not current API content.


## Expanded Evidence source scope (7.4.0)

All 110 archived document PMID/DOI pairs matched live NLM bibliographic metadata on 2026-10-01. Cards distinguish that identity check from an abstract, official summary or selected full-text review. The source crosswalk retains companion guidance without reviving 3,547 historical extracted statements as current recommendations. Per-card scope and correction-access notes remain visible.

Two archive labels were misleading despite correct identifiers: `svin-dsa-collaterals-2025` concerns DSA determination of cerebral circulatory arrest, and `svin-lab-consensus-2025` concerns training/certification standards. Their source titles and topic destinations now reflect the actual publications. The 2026 rehabilitation archive was an access placeholder; its prior presence was not a full guideline extraction.

Modified Fisher and mTICI are source-specific grading/descriptor aids without individual prognosis. NASCET requires paired extracranial ICA measurements, explicit patency and exclusion of near-occlusion; it does not determine intervention. CHA₂DS₂-VA was not derived by subtracting sex from the original worksheet because the 2024 ESC clinical definitions differ.


## Clinical utility review (7.5.0)

On 2026-10-01, the completed-study library expanded from 16 to 29 using primary NLM abstracts and accessible corrections. Added areas include lipid/BP secondary prevention, ESUS/atrial cardiopathy, AF detection, carotid disease, rehabilitation and medium-vessel thrombectomy. Abstract verification is not full-text appraisal. Existing PRESTIGE-AF/SWITCH correction limits remain; inaccessible AVERT/PROGRESS correction bodies are disclosed on their new cards. Selected retinal ischemia, extended-window IVT and medium/distal-vessel cards distinguish trial populations, negative or underpowered results, hemorrhage findings and guidance search dates.

Calculator checks used the official GCS assessment aid, the original HAS-BLED definitions, the ABCD² first-recorded-BP definition and primary comparisons of ABC/2 methods. GCS leaves untestable components without a total. ABCD² first-TIA BP remains independent of current treatment BP. Simplified unweighted ABC/2 is explicitly distinguished from area-weighted counting. Cockcroft–Gault arithmetic exposes pre-rounding values and weight assumptions; it does not choose a drug, dose or weight convention. Source-specific documentation checks do not establish clinical validation.

Fourteen identified trial records (12 screening profiles and two table-only records) were checked against live ClinicalTrials.gov records. Selected automatic exclusions were narrowed or expanded to the actual registry definition. Old broader input flags are not silently reinterpreted. Manual protocol exceptions, site activation and PICASSO's conflicting intracranial-occlusion wording remain unresolved. Two profiles lacking verified identity remain withheld. Registry review does not establish enrollment eligibility.


## MRI selection precision (7.6.2)

The prior Encounter field “MRI lesion extent reviewed” did not document whether the lesion met the MRI source criterion. It can no longer satisfy that criterion alone. A separate three-state finding records whether the DWI lesion is smaller than one-third of MCA territory; the MRI partial screen requires explicit Yes, with the existing review and other gates. Existing reviewed flags are not converted. Generated documentation distinguishes the finding from the review attestation and does not imply that all imaging exclusions were reviewed.

This scoped repair was checked on 2026-10-01 against AHA/ASA 2026 AIS §4.6.3 recommendation 1, available in the [AHA guideline compendium](https://eguideline.guidelinecentral.com/i/1542862-aha-asa-early-management-of-acute-ischemic-stroke-2026/27) and selected publisher-indexed text of the [primary guideline](https://www.ahajournals.org/doi/10.1161/STR.0000000000000513). Direct publisher full-page access returned403. This is a selected recommendation check, not a complete review of the guideline or inaccessible corrections; unrelated review dates and protected protocols remain unchanged. The partial source screen is not treatment eligibility or a universal infarct-size cutoff.


## Displayed-claim and study-design review (7.6.3)

A further review compared the displayed population, comparison, numeric results and endpoint interpretations of all 58 study summaries with freshly retrieved primary abstracts. Selected official topic summaries and accessible correction passages were also read. Abstract support does not resolve unavailable correction bodies or constitute full guideline review; existing source-specific limits and unrelated review dates are preserved.

Source-precision repairs were established: the ICH surgery overview now distinguishes MIND’s 180-day disability outcome from its 30-day mortality outcome ([primary report](https://jamanetwork.com/journals/jamaneurology/fullarticle/2838201)); ACTION-CVT’s historical source label is observational rather than randomized ([primary abstract](https://pubmed.ncbi.nlm.nih.gov/35143325/)). The AVERT dose-response source is identified as an observational secondary analysis, not randomized dose assignment ([primary abstract](https://pubmed.ncbi.nlm.nih.gov/26888985/)). Selected primary ESC endocarditis sections 4 and 9.1 became accessible and support the card’s team/neurologic-imaging overview; its link and access scope now reflect that read, without implying complete corrected-table review. These changes create no new treatment rule and change no calculator.


## Correction-text recovery (7.6.4)

On 2026-10-02, publisher-indexed primary PDF text was read for six AHA corrections; direct PDF requests returned403. This resolves those correction-body review gaps at the indexed-text scope, not the full underlying guideline/statement review.

- AF guideline corrections [38153996](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001207), [38408149](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001218) and [38857333](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001263) concern trial-name expansions/disclosures, an ATRIA table entry and a rate-control figure footnote. The overview does not reproduce these passages or provide ATRIA/rate-control dosing.
- The acute-hospital AF [correction37093973](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001147) clarifies supplemental dabigatran renal/interaction conditions and apixaban dose-reduction criteria. No anticoagulant dose-selection rule is added or changed.
- Hypertension corrections [41259465](https://www.ahajournals.org/doi/pdf/10.1161/HYP.0000000000000257) and [42160500](https://www.ahajournals.org/doi/pdf/10.1161/HYP.0000000000000264) concern resistant-hypertension/table text and the labetalol repeat interval. The Evidence overview reproduces neither; the retained labetalol modal already states repeat intervals of10–20minutes, not the corrected guideline’s erroneous2-minute repeat interval. This is a scoped comparison, not complete protocol recertification.

Hypertension correction41984986 remains unreviewed. Complete corrected recommendation tables and the other source-specific access gaps remain outside this review. Only the three rechecked sources receive an updated access date; unrelated clinical review dates, all58study summaries and protected protocol literals are unchanged.

## Additional topic review — 2026-10-02

Three source-linked topic cards were added after selected primary-section review: BSH2024 APS guidance; AHA/ASA2023 SAH diagnostic recommendations and ACEP2019 acute-headache policy; and ESH/SVM2019 FMD consensus. Access notes identify exact sections and the full-document limits. The FMD corrigendum was read through publisher-indexed text; its corrected procedural wording is not reproduced. The previously indexed AHA/ASA SAH correction38011240 remains unreconciled. The ACEP2026 update was still a draft and was not used. These cards add no automated diagnostic or treatment rule. The prior80 topic records and58 study summaries retain their existing review scope.

## Protected protocol clinical-audit corrections — 2026-10-03

The protocol owner authorized these protected-content edits (`src/ProtectedProtocols.jsx`, `src/institutional-protocols.js`, `src/pocket-cards.jsx`, `src/management-guidance.js`). Grades were checked against the archived AHA/ASA AIS 2026, ICH 2022 and aSAH 2023 recommendation records at `archive/pre-encounter-first-20261001-4f8e99d` and the maintained NCS/SCCM 2026 projection. The protocol snapshot was deliberately re-baselined; its diff contains only these lines plus the new sr-only page heading.

- IVT safety: factor Xa inhibitor or dabigatran within 48 h or unknown timing added as an absolute IVT contraindication unless drug-specific assays are normal; EVT evaluated independently ([AHA/ASA 2019, PMID 31662037](https://pubmed.ncbi.nlm.nih.gov/31662037/); no graded DOAC recommendation in the AIS 2026 extract). Unresolved local source conflicts now render in the contraindication card. The Protocols IVT card is held whenever Encounter anticoagulant exposure is anything other than an explicit "none", or entered platelets, INR, aPTT or PT exceed IVT thresholds. Platelet wording now follows AIS 2026 (do not delay IVT for the count unless thrombocytopenia is suspected).
- Extended-window IVT: the 9-24 h branch now requires LVO on CTA and carries COR 2b, LOE B-R (AIS 2026; [TRACE-III, PMID 38884324](https://pubmed.ncbi.nlm.nih.gov/38884324/)). The institutional CTP thresholds (core <50 mL, ratio ≥1.2, mismatch ≥10 mL) are retained and labeled institutional; EXTEND and TRACE-III thresholds are named where shown. The consent script uses absolute effects from [EXTEND](https://pubmed.ncbi.nlm.nih.gov/31067369/), [WAKE-UP](https://pubmed.ncbi.nlm.nih.gov/29766770/) and TRACE-III (sICH 2-6 per 100 treated vs <1 per 100).
- EVT: codominant M2, distal MCA, ACA and PCA are COR 3: No Benefit, LOE A (AIS 2026; [ESCAPE-MeVO](https://pubmed.ncbi.nlm.nih.gov/39908448/), [DISTAL](https://pubmed.ncbi.nlm.nih.gov/39908430/)); dominant M2 at 6-24 h is labeled an institutional tier without an AIS 2026 grade. All-EVT BP ≤180/105 for 24 h (COR 2a, LOE B-NR) and post-mTICI ≥2b SBP <140 harm (COR 3: Harm, LOE A) were added; the intraprocedural goal now reads SBP 140-180. Post-lytic notification uses SBP >180 or DBP >105.
- Hemorrhage and reversal: cryoprecipitate is stated as 2 pre-pooled units (≈10 single-donor units); factor Xa reversal is triggered by last dose <24 h, unknown timing or renal impairment as well as an elevated assay; andexanet is noted as withdrawn from the US market (December 2025) with the [NCS/SCCM 2026](https://pubmed.ncbi.nlm.nih.gov/42786382/) 4F-PCC recommendation; INR 1.3-1.9 PCC is "may be reasonable" (COR 2b, LOE C-LD); the institutional fixed 2000-unit 4F-PCC dose carries a label-dosing caveat; protamine follows [NCS/SCCM 2016](https://pubmed.ncbi.nlm.nih.gov/26714677/) dose-proportional dosing; antiplatelet platelet-transfusion harm (COR 3: Harm, LOE B-R) and the emergency-neurosurgery exception (COR 2b, LOE C-LD) follow ICH 2022; cerebellar ICH ≥15 mL or with deterioration, brainstem compression or obstructive hydrocephalus → immediate evacuation ± EVD (ICH 2022, COR 1, LOE B-NR).
- Other: drug-aware safety-pause dose line; status-epilepticus levetiracetam load; glucose row LOE C-LD; uninterrupted 3-oz water swallow wording; ENRICH trial context labeled separately from the local MIE screen; pediatric moyamoya/arteriopathy row is ungraded.

These are guideline-alignment corrections, not certification of the full protocols. US TNKase label window (3 h) and andexanet market status were taken from the label/AABB notice cited by the owner and were not independently refetched (network access to DailyMed was blocked).

## Trials registry audit — 2026-10-03

All 16 stored trial records were re-read on ClinicalTrials.gov on 2026-10-03; recorded statuses were unchanged. The two profiles without a registry record (ESUS, MOCHA) were removed. FASTEST Part 2 (NCT07227246) and SISTER (NCT05948566) were added as screening profiles. PICASSO and CAPTIVA became reference-only profiles: neither is screened, and CAPTIVA (active, not recruiting) appears only in Database. CAPPRICORN-1 and CAPTIVA left the criteria tables. Registry exclusions added for MINUTE, STEP, SATURN and VERIFY are listed in each record. INTERCEPT timing is now modeled as two groups: under 6 weeks from the index stroke, or 6–52 weeks if on an oral anticoagulant at the index stroke. CAPTIVA arm-level changes are not verified. Preset onset bands that only touch a study limit at an endpoint now count as outside that window. The check did not return last-update-posted dates, so the dates recorded on 2026-10-01 are kept and labelled as such. Local activation is not assessed.

## Independent verification follow-up — 2026-10-03

A second reviewer re-checked the 2026-10-03 corrections, the quick reference, all 80 quoted recommendations and the new study summaries against the archived AIS 2026/ICH 2022/aSAH 2023 transcriptions, NCS/SCCM 2016/2026 and PubMed abstracts. No dose, window or grade was reversed. Follow-up edits: the corticosteroid/hypothermia/barbiturate row now shows COR 3: Harm, C-LD (ais-2026-187); the CT perfusion topic separates 4.5–9 h and unknown-onset (2a) from known-onset 9–24 h LVO-only IVT (2b); the factor Xa reversal trigger in the protected ICH protocol and quick reference is labeled institutional beside the NCS/SCCM 2016 rule (reverse within 3–5 half-lives of the last dose; PMID 26714677); the platelet item restores the AHA 2019 instruction to stop an alteplase infusion if platelets return <100,000/mm³; oxygen, temperature and ≥220/120 rows follow ais-2026-62/64, -78/79 and -70 with the ESO 2025 attribution; TAPIS, DISCOUNT and HOPE descriptions match their abstracts; the note's calculated thrombolytic dose names its method and states that the administered dose is not recorded. The protocol snapshot changed only in those three trigger lines and the platelet line.

## On-call simulation review — 7.7.3 (2026-10-03)

Scenario agents walked through hyperacute ischemic, hemorrhage and complication cases end to end, and skeptic agents then tried to refute each finding. Protected protocol text changed in two places, and the content lock was re-baselined deliberately:

- **Ischemic, wake-up / unknown onset:** the IVT card and guidance now require the full AHA/ASA 2026 criteria (ais-2026-100, COR 2a, B-R). These are MRI DWI-FLAIR mismatch with a DWI lesion smaller than one-third of the MCA territory, and treatment within 4.5 h of symptom recognition. The card previously accepted the mismatch checkbox alone. When Encounter holds the MRI attestations and a discovery time, the card's mismatch box is filled from them and is read-only.
- **ICH, IVH & hydrocephalus:** added "large IVH with impaired level of consciousness: EVD over medical management alone" (AHA/ASA 2022 ICH, COR 1, B-NR). The Evidence ich-surgery topic already lists it.
- **Ischemic, institutional BP table:** the "COR / LOE" header is no longer rendered while no institutional BP row carries a grade. The column was empty, and the row wording is unchanged.

Bedside additions, which are deferred and do not change protected text:

- **4F-PCC arithmetic:** computed from the doses the reversal card already states. These are the Kcentra label INR tiers with weight capped at 100 kg, and 50 units/kg for factor Xa inhibitors or dabigatran without idarucizumab. The local fixed dose is shown alongside.
- **ICH BP timing:** AHA/ASA 2022 grades — start ≤2 h, target ≤1 h (COR 2a, C-LD); smooth control (COR 2a, B-NR); large or severe ICH (COR 2b, C-LD).
- **ICH surgical-trigger card:** cerebellar evacuation (COR 1, B-NR), EVD for large IVH (COR 1, B-NR), minimally invasive evacuation (COR 2a, B-R).
- **aSAH first-hour card:** early securing (COR 1, B-NR), nimodipine (COR 1, A) with the US label dose (60 mg every 4 h for 21 days), and BP (COR 1, C-EO). The workup sequence is given ungraded because the archived 2023 aSAH records are retired.
- **Pre-IVT BP at administration:** when an administration is recorded, Section 4 shows the existing pre-IVT BP fields again. It cautions when the documented pre-IVT BP, or failing that the entered BP, is not below 185/110 (AHA/ASA 2026 ais-2026-72). The note's IVT administration line now carries the pre-IVT BP, or states it is not documented.
- **Case bar and Encounter:** phase-specific BP flags (AHA/ASA 2026 ais-2026-72 and -74; AHA/ASA 2022 ICH ich-2022-23), the next post-IVT neuro check, and links to the post-thrombolysis bleeding and angioedema protocols. ICH neurosurgery prompts reuse the local ≥15 mL and IVH triggers.

## Implementation review — 7.7.4 (2026-10-03)

Reviewers re-read the 7.7.3 code across four areas: clinical accuracy, logic, on-call UX and note output. Skeptic agents then tried to refute each finding. Protected protocol text is unchanged. Corrections:

- **4F-PCC is local-first.** v6.17.0 made the Protocols tab follow the Stroke Center folder, which uses a fixed 2000-unit dose, not weight- or INR-tiered. The 7.7.3 highlighted weight-based dose competed with that, so the reversal card and the acute ICH banner now lead with the local protocol:
  - **Warfarin:** 4F-PCC 2000 units with vitamin K 10 mg IV, and recheck INR at 30 min. INR 1.3–1.9 may be reasonable (COR 2b).
  - **Factor Xa inhibitors:** apply the institutional <24 h trigger to the recorded last dose. Unknown timing is treated as within the trigger. Beyond 24 h, reverse only with renal impairment or an elevated anti-Xa level.
  - **Dabigatran:** idarucizumab first. Beyond 24 h, reverse only if residual effect is likely (NCS/SCCM 2016: within 3–5 half-lives, renal impairment, or a prolonged thrombin time).
  - The label (Kcentra INR tiers) or NCS/SCCM 50 units/kg arithmetic stays only as a small "for comparison only" line on the card, mirroring the protocol's own fixed-dose caveat. Above 100 kg the dosing-weight cap is stated. The banner carries no weight-based dose, and the card shows the patient line only for acute ICH or SAH.
- **Protocol IVT card imaging:**
  - A 0 mL CTP core with a mismatch volume ≥10 mL meets the ratio, matching the Encounter EXTEND screen.
  - The ratio is no longer pre-filled blank and locked, and Encounter-filled CTP inputs are marked and disabled.
  - The WAKE-UP MRI rule (ais-2026-100) is pre-filled only where MRI is the route: unknown onset, or a known LKW of ≥9 h, with a recorded discovery time.
  - A known 4.5–9 h interval accepts MRI mismatch on the LKW clock, so its checkbox stays editable.
  - A known bedtime LKW ≥9 h with the attested WAKE-UP pattern now reaches the wake-up branch instead of "not supported".
- **Post-thrombolysis hemorrhage:** a recorded PH1, PH2 or other hemorrhage is often an asymptomatic 24 h imaging finding. The hemostatic protocol is therefore stated as conditional on symptoms or neurological worsening; PH2 keeps a critical tone. Recorded angioedema stays critical. The prompt now also appears beside the field that triggers it.
- **Smaller corrections:**
  - Nimodipine: the label text (60 mg every 4 h for 21 days; cirrhosis 30 mg every 4 h) is separated from the local split dose for hypotension.
  - DAPT exclusion: AF reads as an anticoagulation indication with the AF-timing link. Other cardioembolic sources ask for source-specific therapy.
  - ICH case-bar BP: SBP ≥220 gives the local first-hour rule (reduce about 20%, never more than 25%) instead of the 150–220 target.
  - Documented CT hemorrhage is stated before the time-window message. Past 4.5 h from a known LKW with no imaging-selected screen met, the hemorrhage and contraindication prompts keep their place (extended-window IVT needs them too) and add the window note.
  - "COR 3: No Benefit" chips return to the 7.7.2 neutral tone.
  - The contraindications deep link opens the IVT Contraindications card.
  - In acute ischemic stroke the anticoagulant badge opens IVT contraindications rather than reversal.
