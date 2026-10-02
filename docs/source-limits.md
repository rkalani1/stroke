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
