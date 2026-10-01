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
