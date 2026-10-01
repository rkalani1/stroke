# Retained source limitations

Clinical review dates are copied from existing records. Corpus pruning,
metadata lookup, arithmetic tests and a successful build do not constitute
clinical validation. `workspace-sources.json` explicitly leaves missing review
dates null. Retained AIS correction updates remain partially applied. The
neuroprognostication source retains its original body/table discrepancy for
ASTRAL even though individualized prognosis outputs are retired.

The protected ICH factor-Xa reversal surface preserves an unresolved local
source conflict: its reversal section suggests dialysis in renal failure while
its pharmacokinetic table describes those drugs as not dialyzable. Both
protected locations already show the conflict and select no dialysis action.
No protected wording or baseline was altered to resolve this redesign.

The current primary [Xarelto prescribing information](https://www.jnjlabels.com/package-insert/product-monograph/prescribing-information/XARELTO-pi.pdf)
states that high protein binding prevents dialysis removal. The
[FDA Eliquis label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/202155Orig1s039%2Cs040lbl.pdf)
states that hemodialysis does not substantially affect apixaban exposure.
Those specific label statements were located during this implementation;
they do not certify the entire reversal pathway or resolve the protected local
source. Owner adjudication of that protected conflict remains a clinical
release gate. No automatic PCC or dialysis action is exposed through the MCP
interface or the new Encounter surface.

The maintained source projections retain exactly selected recommendation
records and original review/correction provenance. AIS 2026, ICH 2022,
NCS AIS neuroprognostication 2026, NCS reversal 2026, SVIN large-core 2025,
and AHA/ASA secondary prevention 2021 cover the surviving dependencies.
The last contains only DAPT population/duration and harm qualifiers referenced
by retained recommendations; it is not a restored guideline browser.

Retired public guideline URLs return a schema-2 retirement envelope with null
data. The full committed source corpus and teaching artifacts are preserved at
`archive/pre-encounter-first-20261001-4f8e99d`; they are not current API content.
