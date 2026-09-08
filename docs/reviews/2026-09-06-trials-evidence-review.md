# Trials and Evidence Atlas source review — 2026-09-06

Scope: `src/evidence/*`, its tests, and a requested focused correction of
duplicated Encounter claims and trial-screen presentation. Protocols,
guideline-library files, education and calculators
were outside this subtask. This is a source and implementation review of a public
synthetic demo. It is not institutional validation or approval for clinical use.

## S1–S3: plan, setup and evidence before edits

- **Plan:** check all 14 screener study profiles, the overlapping Atlas/table
  registry records, the citation registry, and recent primary stroke evidence.
  Correct supported source/eligibility defects without changing Protocols or
  converting new trial results into treatment instructions.
- **Setup:** baseline source contained 14 screener profiles, 9 Atlas active or
  historical trial records, 237 completed-study records and 322 citations.
  Sources were ClinicalTrials.gov API v2, PubMed E-utilities records/abstracts,
  and primary journal reports. No patient, private-study, contact or site roster
  data were used in the changes.
- **Validation before editing:** baseline screener and matcher suites passed
  (56 tests). All 16 distinct NCT records in the screener, Atlas and eligibility
  tables were fetched successfully. Both unregistered placeholders were searched
  by exact title. All 321 populated PMID identifiers resolved. Source-backed
  discrepancies were identified before modifying the relevant records.
- **Stop conditions:** unavailable full text, missing NCT, unknown local
  activation, incomplete registry criteria, and uncertain subgroup interpretation
  were retained as explicit limitations rather than inferred away.

## Coverage and limits

| Layer | Coverage | What this establishes |
|---|---:|---|
| Native screener | 14/14 profiles | 12 NCT identity/status/core-eligibility checks; 2 unresolved exact-title searches |
| Registry records including Atlas/table-only entries | 16/16 | Overall registry status, last-update date and public eligibility text |
| Existing citation registry | 322/322 entries inspected; 321/321 populated PMIDs resolved | Identifier/title/DOI/publication-date checks; one uncaptured citation resolved |
| Existing completed-study outcomes | 23 selected trial records, using 24 primary-report abstracts | Headline population, primary endpoint and key safety figures, not every full-text claim |
| Additional ENRICH-AF citation | Correspondence metadata inspected | No abstract/full efficacy report available through that citation; no new efficacy assertion |
| Recent surveillance | 89 PubMed date-filtered titles screened | A broad search, not a systematic review or an exhaustive assurance of currency |
| Added studies | 5 structured summaries | TenCRAOS plus STRATEGY, ROCATIS-1, Y-6 phase 2, CRHCP 7-year follow-up |
| Inline trial catalog follow-up | 13/13 duplicated profiles compared | Registry summaries corrected; unverified imaging placeholders no longer carry unrelated study/paper identifiers |

No DOI or publication-year mismatch was found among populated citation pairs
available in the PubMed metadata response. Fourteen low-similarity title matches
were inspected and were abbreviated display titles pointing to the same study,
not wrong-article identifiers. They were not mass-renamed. Author lists, every
page range, supplements, corrections/retractions, and every clinical sentence in
all 237 pre-existing study records were **not** exhaustively re-audited.

The registry/source check date is different from the registry's last-update
date. A globally recruiting trial may not be activated locally. New screener
metadata records both dates, overall `registryStatus`, and
`localActivationStatus: not_assessed`. The 12 identified studies remain
`sourceCompletenessStatus: first_pass`, so a native-screener match cannot become
confirmed eligibility.

## All 14 screener profiles

Registry sources were fetched from
`https://clinicaltrials.gov/api/v2/studies/{NCT}` on 2026-09-06. Links below are
the corresponding human-readable primary registry records.

| Study / source | Overall status; update posted | Core comparison and disposition |
|---|---|---|
| [STEP, NCT06289985](https://clinicaltrials.gov/study/NCT06289985) | Recruiting; 2025-12-04 | Added adult gate; displayed CT/MRI ASPECTS distinction and >6h MVO core limit. Removed unsupported separate “dominant M3” exclusion. Imaging, NIHSS-0 focal deficit, full domain exclusions remain manual review. |
| [TESTED, NCT05911568](https://clinicaltrials.gov/study/NCT05911568) | Recruiting; 2026-09-02 | Adult gate; mRS 3–4 for ≥3 months, ≥6 NIHSS, CT≥3/MRI≥4 and ≤24h remain. Removed unsupported six-month prognosis cutoff from Atlas summary; registry instead names terminal illness, unassessable or temporary disability. |
| [MINUTE, NCT07260916](https://clinicaltrials.gov/study/NCT07260916) | Recruiting; 2026-06-29 | Added executable pre-ICH mRS≤2 and GCS≥7. Removed “clear standard-of-care surgical indication” exclusion absent from the registry. Retained ≤16h randomization, ≥20mL basal-ganglia ICH and surgery <120min; detailed coagulation, IVH, imaging and consent checks stay explicit. |
| [CLARITY, NCT07174414](https://clinicaltrials.gov/study/NCT07174414) | Not yet recruiting; 2025-09-16 | Remains “soon.” The estimated August 2026 start does not establish actual recruitment. Age≥40, ≤180d stroke/TIA and aspirin OR clopidogrel are retained. |
| [INTERCEPT, NCT05723926](https://clinicaltrials.gov/study/NCT05723926) | Recruiting; 2026-08-19 | Adult gate; longest window corrected from 365d to 52 weeks/364d. OAC-at-index timing groups require confirmation. Removed unsupported absolute <2-year life-expectancy cutoff. Bilateral carotid anatomy and general investigator suitability remain manual. |
| ESUS — no NCT | No exact-title record found 2026-09-06 | Search: “Qualitative model-based ESUS reclassification.” Retained blocked placeholder; no verification date asserted. An exact-title miss is not proof that no study exists. |
| MOCHA — no NCT | No exact-title record found 2026-09-06 | Search: “Automated Intracranial Vessel Wall Analysis Pipeline.” Retained blocked placeholder; an approved source/NCT is still needed. |
| [ASPIRE, NCT03907046](https://clinicaltrials.gov/study/NCT03907046) | Recruiting; 2026-05-08 | Adult and 14–180d gates. Replaced blanket secondary-ICH wording with the registry's hemorrhagic transformation/tumor/unsecured-AVM distinctions. Separate mandatory anticoagulation (e.g., DVT/PE) is not the qualifying AF itself. Full renal/hepatic/hematologic/consent exclusions remain manual. |
| [SATURN, NCT03936361](https://clinicaltrials.gov/study/NCT03936361) | Recruiting; 2026-04-21 | Age≥50, lobar ICH, statin at onset, ≤7d and pre-morbid mRS≤3 checked. Added the missing ≤7d time gate to the separate Atlas matcher. |
| [CAPPRICORN-1, NCT06393712](https://clinicaltrials.gov/study/NCT06393712) | **Active, not recruiting; 2026-09-03** | Corrected “enrolling” to closed to new enrollment in screener and reference tables. Retained sporadic/Dutch-type distinctions and source gaps. Closed studies cannot enter possible-candidate output. |
| [SCOUTS-3, NCT06722755](https://clinicaltrials.gov/study/NCT06722755) | Recruiting; 2026-08-13 | Age≥18, imaging-confirmed ischemic stroke/ICH≤30d, English/Spanish consent and ≥5-night anticipated rehab stay checked. Oxygen/PAP, aspiration, sedative, surgery and other exclusions remain first-pass gaps. |
| [VERIFY, NCT05338697](https://clinicaltrials.gov/study/NCT05338697) | Recruiting; 2026-08-20 | Adult gate; participant consent24–96h; SAFE≤8 at48–96h. Atlas's “within7d”/MRC≤4 summary and unsupported pre-morbid mRS restriction corrected. MRI/TMS and in-person follow-up remain full-protocol checks. |
| [MR-PICS, NCT06506279](https://clinicaltrials.gov/study/NCT06506279) | Recruiting; 2026-04-13 | ≥6 months, age22–75, **current** mRS3–4, UEFM25–45, ≥30% pathway preservation and TMS output checked. Current mRS now has a separate engine parameter. DVT wording narrowed to unprovoked DVT/any PE. Orthopedic impairment requiring extra screening is no longer an automatic exclusion. |
| [TELE-REHAB-2, NCT06682429](https://clinicaltrials.gov/study/NCT06682429) | Recruiting; 2026-08-19 | Age18–80,90–150d, ARAT18–44, Box & Block≥1 and self-signed consent checked. Full behavioral, safety, MRI and follow-up exclusions remain required. |

Other overlapping registry records checked:
[PICASSO NCT05611242](https://clinicaltrials.gov/study/NCT05611242), recruiting,
updated2025-12-17;
[CAPTIVA NCT05047172](https://clinicaltrials.gov/study/NCT05047172), active not
recruiting, updated2026-09-01;
[MOST NCT03735979](https://clinicaltrials.gov/study/NCT03735979), completed,
updated2025-02-07; and
[RHAPSODY-2 NCT05484154](https://clinicaltrials.gov/study/NCT05484154), withdrawn,
updated2024-10-01. Their nonrecruiting status exclusions were preserved.

## Existing outcome review and corrections

| Trial family | Primary-report sources reviewed | Result of review |
|---|---|---|
| IV thrombolysis | [AcT](https://pubmed.ncbi.nlm.nih.gov/35779553/), [TRACE-2](https://pubmed.ncbi.nlm.nih.gov/36774935/), [TIMELESS](https://pubmed.ncbi.nlm.nih.gov/38329148/), [TRACE-III](https://pubmed.ncbi.nlm.nih.gov/38884324/) | Headline efficacy/safety consistent at abstract level; this does not validate every selection claim. |
| Bridging IVT before EVT | [BRIDGE-TNK](https://pubmed.ncbi.nlm.nih.gov/40396577/), [TNK-PLUS](https://pubmed.ncbi.nlm.nih.gov/42099212/) | Distinct early/late windows and positive/neutral results retained. |
| Adjunct IA treatment | [CHOICE](https://pubmed.ncbi.nlm.nih.gov/35143603/), [CHOICE-2](https://pubmed.ncbi.nlm.nih.gov/42096239/), [PEARL](https://pubmed.ncbi.nlm.nih.gov/42262770/), [ANGEL-TNK](https://pubmed.ncbi.nlm.nih.gov/40616323/), [IAT-TOP](https://pubmed.ncbi.nlm.nih.gov/42026933/) | CHOICE's unsupported RR1.59/CI replaced by primary-report adjusted risk difference18.4 percentage points (CI0.3–36.4);121 randomized/113 treated-as-randomized distinguished. Other headline outcomes retained. |
| Medium/distal occlusion | [DISTAL90d](https://pubmed.ncbi.nlm.nih.gov/39908430/), [DISTAL12mo](https://pubmed.ncbi.nlm.nih.gov/42105785/), [ESCAPE-MeVO](https://pubmed.ncbi.nlm.nih.gov/39908448/), [DISCOUNT](https://pubmed.ncbi.nlm.nih.gov/42485024/), [ORIENTAL-MeVO](https://pubmed.ncbi.nlm.nih.gov/42127389/) | DISTAL's original90d primary result restored;12mo follow-up remains separately named. ORIENTAL's positive result/safety signal retained, but removed unsupported certainty that NIHSS explains divergent trials or independently overrides guidelines. |
| ICH surgery/hemostasis | [ENRICH](https://pubmed.ncbi.nlm.nih.gov/38598795/), [SWITCH](https://pubmed.ncbi.nlm.nih.gov/38761811/), [FASTEST](https://pubmed.ncbi.nlm.nih.gov/41653933/) | Headline efficacy, uncertainty and safety consistent at abstract level. |
| Anticoagulation | [OPTIMAS](https://pubmed.ncbi.nlm.nih.gov/39491870/), [PRESTIGE-AF](https://pubmed.ncbi.nlm.nih.gov/40023176/), [OCEANIC-STROKE](https://pubmed.ncbi.nlm.nih.gov/41985132/), [OCEANIC-AF](https://pubmed.ncbi.nlm.nih.gov/39225267/) | Corrected ASPIRE's background takeaway: PRESTIGE recurrent-ICH noninferiority was **not** met. Updated ASPIRE context links to post-ICH trials. Other headline outcomes retained. |
| Retinal occlusion | [THEIA](https://pubmed.ncbi.nlm.nih.gov/41109232/) | Primary outcome already correctly neutral and imprecise. Added distinct TenCRAOS report below. |

ENRICH-AF's cited [2023 correspondence](https://pubmed.ncbi.nlm.nih.gov/37839419/)
has no PubMed abstract. This pass did not independently establish current
ENRICH-AF results or re-review its complete protocol; no new results were invented.

## New/captured evidence

| Study and source | Why included | Scope retained |
|---|---|---|
| [TenCRAOS, PMID41604638](https://pubmed.ncbi.nlm.nih.gov/41604638/) | Existing citation had no PMID/DOI despite published NEJM report | Neutral vision-recovery result; fatal-ICH event and imprecision preserved. Legacy citation id retained for stable links. |
| [STRATEGY, PMID42671865](https://pubmed.ncbi.nlm.nih.gov/42671865/) | Primary BAD-stroke trial published2026-08-31 | Neutral deterioration/new-stroke composite; few bleeding events do not prove safety equivalence. |
| [ROCATIS-1, PMID42662137](https://pubmed.ncbi.nlm.nih.gov/42662137/) | Published2026-08-26; prevention evidence | Platelet assay is the primary endpoint; vascular events secondary, recurrent-stroke difference not significant; hypothesis-generating. |
| [Y-6 phase2, PMID42621146](https://pubmed.ncbi.nlm.nih.gov/42621146/) | Published electronically2026-08-11; relevant neutral adjunct trial absent from Atlas | Five-arm phase2 efficacy not significant; not a treatment recommendation. |
| [CRHCP7y, PMID42666029](https://pubmed.ncbi.nlm.nih.gov/42666029/) | Published2026-08-28; sustained prevention-program follow-up | General cardiovascular composite, not a post-stroke-specific BP target or a new independent randomization. |

Surveillance query: `(stroke[Title/Abstract] OR intracerebral hemorrhage[Title/Abstract]
OR subarachnoid hemorrhage[Title/Abstract]) AND (randomized controlled trial[Publication Type]
OR randomized[Title] OR randomised[Title]) AND ("2026/08/22"[Date - Publication] :
"2026/09/06"[Date - Publication])`, PubMed ESearch,100-result cap,89 returned.
Electronic and print dates were distinguished; a September issue date alone was
not treated as a newly completed study. Reviews, meta-analyses, protocols and
secondary analyses were not silently labeled new primary randomized trials.

Additional relevant records read but not added as practice-changing evidence:
[HOPE Kids2](https://pubmed.ncbi.nlm.nih.gov/42665434/) (surrogate endpoint and
voxelotor discontinuation/mortality context require a dedicated review),
[loberamisal phase2](https://pubmed.ncbi.nlm.nih.gov/41218852/) (small, efficacy
not significant), [LAIS](https://pubmed.ncbi.nlm.nih.gov/41344725/) (protocol,
not results), [fibrinogenase](https://pubmed.ncbi.nlm.nih.gov/41192976/) (small
regional trial requiring a dedicated full-methods review), and
[TESLA one-year report](https://pubmed.ncbi.nlm.nih.gov/42545711/) (no abstract
returned; no numeric long-term claim extracted). The search also returned ICH
and LAAO meta-analyses; no new ICH efficacy result was inferred from their titles.

## S4–S5: changes and validation

Changed sources: `activeTrials.js`, `citations.js`, `completedTrials.js`,
`eligibilityTables.js`, `screenerTrials.json`, `screener-eval.js`, and stale
matcher-module documentation and first-pass presentation fields. Added
`tests/evidence-september-review.test.js`.
Two existing matcher fixtures now specify onset. Only the15 snapshot statuses
affected by the verified VERIFY/ASPIRE windows were updated; other scenario
outputs were not regenerated from the implementation. The later decision-state
fix explicitly marks negative decisions in two existing synthetic scenarios;
one historical RHAPSODY snapshot now correctly remains `needs_info` when the
PICASSO fixture has no EVT decision. No snapshot was broadly regenerated.

- `node scripts/evidence-validate.mjs`: **pass**,9 active/historical,242 completed,
  326 citations before the Education reconciliation (378 afterward);44/44
  modeled inclusion criteria and14/14 exclusions executable.
  Existing informational orphan-citation warnings remain (education-only
  citations are not all referenced by Atlas records).
- `npx vitest run src/evidence/__tests__ tests/evidence-september-review.test.js
  --reporter=dot`: **pass**,361 tests across9 files, including37 new regression
  tests for the dated source findings and boundary behavior.
- In-memory esbuild JSX transform of `src/app.jsx`: **pass**. The requested
  inline follow-up corrected VERIFY and ASPIRE profiles, MeVO outcome
  attribution, and the Encounter trial-screen labels and note export. The
  generic matcher preserves internal status values and adds explicit
  “Possible candidate” and “Full protocol review required” presentation fields.
- The Encounter basilar warning now distinguishes ATTENTION NIHSS ≥10 from
  BAOCHE NIHSS ≥6, verified against their primary registry eligibility records
  ([ATTENTION](https://clinicaltrials.gov/study/NCT04751708),
  [BAOCHE](https://clinicaltrials.gov/study/NCT02737189)). It prompts specialist
  review rather than claiming both trials imposed a universal ≥10 hard stop.
  These two focused threshold checks are additional to the16 registry records
  counted in the screener/Atlas coverage matrix.
- The full `app.jsx` suffix beginning at the Protocols tab render conditional
  was byte-identical before/after this follow-up patch (SHA-256
  `1e50cb381c53ee2594c20c3fda1e60b80bd8c4d2abeb431e22181fee7f61e67d`).
- A second focused inline pass corrected the remaining11 catalog profiles:
  STEP vessel/imaging/platelet limits; TESTED's unsupported added cutoffs;
  INTERCEPT timing/anatomy; CLARITY's age/antiplatelet/life-expectancy criteria;
  MINUTE's registry20mL/16h versus previous15mL/15h prescreen wording; MR-PICS
  age75 and safety distinctions; SATURN's withdrawal-of-care exclusion;
  MIRROR and CADASIL registry details; and unverified ESUS/MOCHA placeholders.
  Its Protocols suffix was also byte-identical before/after (SHA-256
  `8c79b26a0ef1f33bad222d43add670e90e5d9643c9db2a6c19a99a4c0bdfb964`).
- Four additional already-referenced identifiers were fetched during that
  focused pass: [Catch-up-ESUS NCT03820375](https://clinicaltrials.gov/study/NCT03820375)
  (status unknown, update2019-01-30; a different observational registry, not the
  local MRI-reclassification placeholder), [MIRROR NCT04494295](https://clinicaltrials.gov/study/NCT04494295)
  (recruiting, update2026-02-06), [CADASIL NCT05567744](https://clinicaltrials.gov/study/NCT05567744)
  (recruiting, update2025-10-16), and [ATTENTION-LATE NCT05701956](https://clinicaltrials.gov/study/NCT05701956)
  (completed, update2026-02-18, no posted results). These supplement the initial
  16 registry records and the two basilar-threshold checks;22 distinct registry
  identifiers were retrieved overall.
- PRESTIGE-AF's inline CAA panel now attributes recurrent-ICH risk to the
  overall ICH+AF trial population rather than claiming a CAA-specific effect.
  ATTENTION-LATE's unverified numeric outcome was removed. Its verified
  [primary publication](https://pubmed.ncbi.nlm.nih.gov/41946560/) is a protocol;
  conference results were not treated as a completed efficacy report or as a
  treatment instruction.
- The trial matcher now treats `Recommended: false` as unknown unless the
  corresponding `DecisionRecorded: true` is also present. Legacy positive
  values remain positive. The derived reperfusion-plan field is unknown unless
  one decision is positive or both negatives are documented. New regressions
  cover default-false PICASSO false eligibility and a partially recorded plan.
- Root integration owns the final content projections, full test/build/QA,
  browser checks and Protocols snapshot check. No Protocols snapshot baseline
  was changed. No PHI, credentials, contact details or restricted material was
  introduced.

## Remaining implementation/source limits

1. Registry summaries still omit protocol detail; no local activation is known.
   Unknown exclusion fields in the generic Atlas matcher currently do not
   trigger exclusion, so its internal `eligible` means only “modeled criteria
   passed.” The public wrapper/UI now labels these results “Possible candidate”
   with full protocol review required, including in the exported Encounter
   note. This is a presentation correction, not a claim that missing clinical
   data or local activation has been verified. The native14-study screener
   already caps every first-pass match at pending.
2. The current streamlined screener UI collects classification/onset only.
   Detailed age, disability and safety gates are tested engine behavior and
   pending checks, not a claim that the user has entered those facts.
3. All13 entries in the legacy inline trial catalog received focused comparison
   and corrections, alongside the MeVO/PRESTIGE/ATTENTION-LATE statements.
   This does not certify every other inline app claim. A treatment recommendation
   field is still only a plan, not proof of administration; full recruitment
   eligibility cannot be inferred from the generic matcher proxy fields.
4. These headline checks do not certify all Atlas claims, every guideline,
   trial eligibility, clinical outcome or newest publication. The explicit
   coverage above should accompany any report of completeness.

## Focused browser regression follow-up

The root-requested functional checks used the local site at
`http://127.0.0.1:4186/`, after `npm run build:js`, in fresh Playwright Edge
contexts with `serviceWorkers: 'block'`. No clinical encounter data was entered.
The first pass exposed one completed-trial destination bug. After the root's
routing correction and a fresh `build:js`, **all seven grouped workflow checks
passed**. No page JavaScript errors were observed in either run.

| Workflow | Observed result |
|---|---|
| Mixed search `stroke`, two ArrowDown presses, Enter | Selected Education / Stroke Prognosis & Clinical Scores opens that education resource. |
| Reading view keyboard control on that resource | Enter selects Reading view; Space selects Fit card; `aria-pressed` changes correctly in both directions. |
| Mixed search `rehabilitation`, ArrowDown, Enter | **Pass after correction:** opens Reference Library, completed-trial query VNS-REHAB, one matching record, correct full title and PMID33894832 link. |
| Header `channel-blocking` | Opens the exact AF guideline recommendation despite its Unicode en dash; one matching entry appears. Reviewed publication-correction disclosure expands. |
| Header `2026 AHA/ASA Stroke Rehabilitation` | Opens the source-only record, explicit extraction limitation, publisher DOI and PubMed link. |
| Header ESO/EAN cognition guideline title | Opens the source-only record and corrected-supplement link; correction disclosure states that the missing recommendation boxes were restored. |
| Database → Not enrolling | Shows only CAPPRICORN-1, with the active-not-recruiting explanation and 2026-09-03 registry date. |
| ICH screener → chronic window | CAPPRICORN is absent from possible candidates and the briefing note; expanding excluded/closed entries shows it as not enrolling. |

The original failed completed-trial destination was reproduced after waiting for
the destination render. The search callback routed every trial-type index entry
to the generic Trials tab without its identifier. The root's correction now
resolves the completed-study identifier, clears the evidence filters and opens
the matching record in Reference Library. The final fresh-context regression
confirmed the corrected destination. Keyboard selection order and both mixed-type
destinations passed; the original issue was destination routing.

## Refreshed promotion queue: all10 P1 candidates triaged

The generated queue at `docs/evidence-promotion-checklist.md` dated
2026-09-07T01:09:41Z contains10 P1 candidates and no P0 item. Their primary PubMed
records were retrieved on2026-09-06 local time. Nine supplied abstracts; the
TESLA follow-up supplied metadata only. The JAMA publisher page confirms that
TESLA is a prespecified one-year secondary-outcome research letter, with outcome
details behind its access gate. No inference was made about those inaccessible
numeric results.

| PMID / source | Study type and disposition | Implication for this update |
|---|---|---|
| [42017224](https://pubmed.ncbi.nlm.nih.gov/42017224/) — ORIENTAL-MeVO ACA registry | Retrospective25-center cohort,343 patients; propensity-adjusted associations. Distinct from the randomized ORIENTAL-MeVO report. | Relevant observational context, not a new randomized ACA eligibility rule; no automatic promotion or guideline override. |
| [42545711](https://pubmed.ncbi.nlm.nih.gov/42545711/) — TESLA one-year outcomes | Previously identified in this review. [Publisher](https://jamanetwork.com/journals/jama/article-abstract/2852448) confirms prespecified secondary follow-up; outcome tables unavailable. | Retain an explicit full-text review gap; do not replace TESLA's original90-day primary result with inferred one-year results. |
| [42261979](https://pubmed.ncbi.nlm.nih.gov/42261979/) — TENSION antithrombotic exposure | Secondary analysis of246 randomized-trial participants; treatment-by-exposure interaction analyses did not establish differing effects. | Supports context for existing large-core evidence; no new antiplatelet, anticoagulant or IVT eligibility rule based on this subgroup analysis. |
| [41979451](https://pubmed.ncbi.nlm.nih.gov/41979451/) — LASTE ASPECTS0–2 | Post hoc subgroup of181 early-window trial patients; favorable functional/mortality results, imprecise sICH estimate. | Relevant additional support for already represented LASTE evidence, with age/time/imaging limits preserved; not a separate trial or authorization to expand selection to other settings. |
| [42127389](https://pubmed.ncbi.nlm.nih.gov/42127389/) — ORIENTAL-MeVO RCT | Primary randomized report, already cited and reviewed in the Atlas and corrected inline summary. | **Already incorporated**; the queue's “uncited” label is a detection gap, not a missing trial. |
| [41914357](https://pubmed.ncbi.nlm.nih.gov/41914357/) — ANGEL-ASPECT hyperdense-MCA sign | Subgroup analysis of432 participants; treatment interaction P=0.19. | A nonsignificant result within one subgroup is not proof of a treatment-effect difference. No new HMCAS-based exclusion or treatment instruction. |
| [41671526](https://pubmed.ncbi.nlm.nih.gov/41671526/) — prior antiplatelets/direct EVT | Retrospective EVA-TRISP registry analysis;1,308 matched participants without prior IVT or anticoagulation. | Association does not establish a benefit of starting antiplatelets before EVT; no drug or selection recommendation promoted. |
| [42586098](https://pubmed.ncbi.nlm.nih.gov/42586098/) — RECAP-ICH | IPD synthesis of4 existing trials,2,944 participants. Recurrent stroke6.5% versus10.4%, adjusted HR0.62 (95% CI0.48–0.80); recurrent-ICH HR0.39. | Relevant long-term secondary-prevention synthesis absent from the initial focused review, **not a new primary RCT or acute-ICH BP study**. Supports sustained BP control; does not establish a new immediate target, reversal rule or escalation KPI. Full methods/target heterogeneity should be reviewed before a separate evidence-synthesis record is added. |
| [42636833](https://pubmed.ncbi.nlm.nih.gov/42636833/) — HARMONi | Primary phase3 oncology RCT of ivonescimab/chemotherapy in advanced EGFR-mutated NSCLC; cancer progression/survival endpoints. | Out of stroke-treatment scope. Stroke adverse events in an oncology safety report do not define cancer-associated-stroke management. Do not promote. |
| [42669035](https://pubmed.ncbi.nlm.nih.gov/42669035/) — prostate-cancer cardiovascular referral | Primary RCT of2,487 patients; hierarchical composite improved mainly through cholesterol control; clinical CV-event difference not established (HR1.08,95% CI0.79–1.49). | Cardio-oncology service-delivery context, not evidence for a new stroke prevention drug/target or cancer-stroke treatment pathway. Do not promote to clinical logic. |

No previously unreviewed primary stroke RCT in this ten-item queue establishes
an additional treatment change for this update. This is a scoped triage
conclusion, not a claim that every useful secondary analysis has been fully
reviewed. RECAP-ICH is a relevant additional synthesis and TESLA remains an
explicit access-limited follow-up item.

The watchlist's baseline reports23 cited PMIDs, whereas the actual Atlas has
321 pre-existing populated PMID identifiers. Its detector reads a narrower
legacy citation input, so “uncited” must not be interpreted as absent from the
whole application. The duplicate ORIENTAL-MeVO flag demonstrates this limitation.
Generated queue/checklist files were not manually edited.

## Expanded mobile verification and final guard maintenance

Fresh Edge contexts against the root's current local build at4186 used
`serviceWorkers: 'block'` and320px/390px viewports. At each width the audit
expanded all24 top-level Reference Library accordions (including document
categories) and all23 individual Calculator accordions. This included the
root's revised reference-card layout and disabled Andexanet calculator.
The checks used DOM `checkVisibility` to exclude closed content, measured
visible element bounds and document/body scroll width, and inspected accessible
names through Edge's accessibility tree. They did not treat bounding rectangles
inside closed `details` as visible controls.

| State | Observed result |
|---|---|
| Reference Library, all24 accordions expanded,320px and390px | No horizontal overflow, no unnamed visible controls, no page JavaScript errors. Document/body width equaled the viewport. |
| Calculators, all23 accordions expanded,320px and390px | No horizontal overflow, no unnamed visible controls, no page JavaScript errors. Document/body width equaled the viewport. |
| Education → Stroke Prognosis → Pocket Card Reference → Reading view,320px | No horizontal overflow or unnamed visible controls. Reader client/scroll widths both246px, contained within the320px page. |
| Education → Stroke Prognosis bedside calculator,320px | No horizontal overflow. Four visible controls lacked accessible names: the glucose number input and three binary toggles (visual field defect, admission delay, impaired consciousness). |

The four Education findings were sent to the Education owner for a bounded
accessibility correction: give the glucose input an associated label including
its selected unit, and give `BinaryToggle` an accessible label and checked state.
The shared toggle is at `src/education.jsx:5301`, glucose input at5501, and the
three instances at5541/5550/5559 at time of inspection. The audit did not edit
application code or any Protocols content. The owner/root's post-fix validation
should accompany these initial observations.

The stale MIRROR test was updated in
`tests/protocol-currency-guards.test.js` to inspect the public trial profile in
both source and bundle: NCT04494295, registry verification date, ICH >20mL,
NIHSS >5, baseline mRS ≤2,24-hour surgical timing and full protocol/local review
requirement. It rejects an invented GCS threshold and retains the separate
unchanged local Protocols guards. The file passed **18/18 tests**. The reviewer
owns the separate adversarial matcher fixture update, preserving both cases:
raw false/false without recorded decisions resolves to unknown; both explicitly
recorded negative decisions resolve to false.

## Education citation-registry reconciliation (metadata only)

The final content check reported55 missing-registry occurrences, deduplicated
to52 PubMed identifiers. All52 resolved through the primary NCBI PubMed
ESummary API on2026-09-06 local time. None duplicated an existing registry
PMID or DOI. Their exact PubMed titles, journal publication years, journals,
volumes, pages and DOI values were added to `src/evidence/citations.js`, with
explicit metadata-only verification notes. Author names use the first three
indexed names plus et al. where applicable. Journal year is retained when an
earlier electronic-publication year differs, and the electronic date is noted
when PubMed provides it. No new outcome or treatment claim was added.

An independent Education review compared all55 reference occurrences in the
content metadata and source with these primary metadata records. It found no
clear PMID-to-unrelated-paper mismatch. Shortened titles, page abbreviations
and group-versus-named-author attributions do not change source identity.
This does not establish that every nearby effect estimate or recommendation
is supported by the full article.

**Validation:** content validation now reports zero errors and zero warnings;
the citation and evidence validators pass at378 citation records. A separate
field comparison confirmed52/52 added records match the retrieved PubMed
metadata, with one registry entry per PMID. The focused evidence and Tier1
files passed130 tests, with two existing deployment gates skipped. The Tier1
suite invokes its existing compression test; root integration will refresh
generated assets after the citation source changes. No app, seed or clinical
content edits were made in this reconciliation.

The evidence validator's informational orphan list now contains126 entries:
the previous74 plus these52. Its scan covers Atlas relationships but does not
resolve Education PMID references, so these52 are used by Education despite
that narrower diagnostic. The content validator independently verifies those
Education-to-registry links. No validator rule was relaxed.

| PubMed primary record | Journal year | DOI |
|---|---:|---|
| [29097489 — Treatment and Outcome of Hemorrhagic Transformation After Intravenous Alteplase in Acute Ischemic Stroke: A Scientific Statement for Healthcare Professionals From the American Heart Association/American Stroke Association.](https://pubmed.ncbi.nlm.nih.gov/29097489/) | 2017 | 10.1161/STR.0000000000000152 |
| [8909417 — Arterial territories of human brain: brainstem and cerebellum.](https://pubmed.ncbi.nlm.nih.gov/8909417/) | 1996 | 10.1212/wnl.47.5.1125 |
| [9633714 — Arterial territories of the human brain: cerebral hemispheres.](https://pubmed.ncbi.nlm.nih.gov/9633714/) | 1998 | 10.1212/wnl.50.6.1699 |
| [32196841 — Monogenic cerebral small-vessel diseases: diagnosis and therapy. Consensus recommendations of the European Academy of Neurology.](https://pubmed.ncbi.nlm.nih.gov/32196841/) | 2020 | 10.1111/ene.14183 |
| [26648971 — DWI Lesion Patterns in Cancer-Related Stroke--Specifying the Phenotype.](https://pubmed.ncbi.nlm.nih.gov/26648971/) | 2015 | 10.1159/000439549 |
| [34469763 — Second asymptomatic carotid surgery trial (ACST-2): a randomised comparison of carotid artery stenting versus carotid endarterectomy.](https://pubmed.ncbi.nlm.nih.gov/34469763/) | 2021 | 10.1016/S0140-6736(21)01910-3 |
| [1852179 — Beneficial effect of carotid endarterectomy in symptomatic patients with high-grade carotid stenosis.](https://pubmed.ncbi.nlm.nih.gov/1852179/) | 1991 | 10.1056/NEJM199108153250701 |
| [14976332 — Prognosis of cerebral vein and dural sinus thrombosis: results of the International Study on Cerebral Vein and Dural Sinus Thrombosis (ISCVT).](https://pubmed.ncbi.nlm.nih.gov/14976332/) | 2004 | 10.1161/01.STR.0000117571.76197.26 |
| [31479105 — Safety and Efficacy of Dabigatran Etexilate vs Dose-Adjusted Warfarin in Patients With Cerebral Venous Thrombosis: A Randomized Clinical Trial.](https://pubmed.ncbi.nlm.nih.gov/31479105/) | 2019 | 10.1001/jamaneurol.2019.2764 |
| [21293023 — Diagnosis and management of cerebral venous thrombosis: a statement for healthcare professionals from the American Heart Association/American Stroke Association.](https://pubmed.ncbi.nlm.nih.gov/21293023/) | 2011 | 10.1161/STR.0b013e31820a8364 |
| [37952187 — Direct Oral Anticoagulants for Stroke Prevention in Patients With Device-Detected Atrial Fibrillation: A Study-Level Meta-Analysis of the NOAH-AFNET 6 and ARTESiA Trials.](https://pubmed.ncbi.nlm.nih.gov/37952187/) | 2024 | 10.1161/CIRCULATIONAHA.123.067512 |
| [39862882 — Apixaban versus aspirin for stroke prevention in people with subclinical atrial fibrillation and a history of stroke or transient ischaemic attack: subgroup analysis of the ARTESiA randomised controlled trial.](https://pubmed.ncbi.nlm.nih.gov/39862882/) | 2025 | 10.1016/S1474-4422(24)00475-7 |
| [22236222 — Subclinical atrial fibrillation and the risk of stroke.](https://pubmed.ncbi.nlm.nih.gov/22236222/) | 2012 | 10.1056/NEJMoa1105575 |
| [28329139 — Duration of device-detected subclinical atrial fibrillation and occurrence of stroke in ASSERT.](https://pubmed.ncbi.nlm.nih.gov/28329139/) | 2017 | 10.1093/eurheartj/ehx042 |
| [26738503 — The Insertion and Management of External Ventricular Drains: An Evidence-Based Consensus Statement : A Statement for Healthcare Professionals from the Neurocritical Care Society.](https://pubmed.ncbi.nlm.nih.gov/26738503/) | 2016 | 10.1007/s12028-015-0224-8 |
| [31573636 — Association of General Anesthesia vs Procedural Sedation With Functional Outcome Among Patients With Acute Ischemic Stroke Undergoing Thrombectomy: A Systematic Review and Meta-analysis.](https://pubmed.ncbi.nlm.nih.gov/31573636/) | 2019 | 10.1001/jama.2019.11455 |
| [19762709 — HINTS to diagnose stroke in the acute vestibular syndrome: three-step bedside oculomotor examination more sensitive than early MRI diffusion-weighted imaging.](https://pubmed.ncbi.nlm.nih.gov/19762709/) | 2009 | 10.1161/STROKEAHA.109.551234 |
| [31593272 — Association of Surgical Hematoma Evacuation vs Conservative Treatment With Functional Outcome in Patients With Cerebellar Intracerebral Hemorrhage.](https://pubmed.ncbi.nlm.nih.gov/31593272/) | 2019 | 10.1001/jama.2019.13014 |
| [15800226 — Comparison of warfarin and aspirin for symptomatic intracranial arterial stenosis.](https://pubmed.ncbi.nlm.nih.gov/15800226/) | 2005 | 10.1056/NEJMoa043033 |
| [16432056 — Predictors of ischemic stroke in the territory of a symptomatic intracranial arterial stenosis.](https://pubmed.ncbi.nlm.nih.gov/16432056/) | 2006 | 10.1161/CIRCULATIONAHA.105.578229 |
| [17515467 — Relationship between blood pressure and stroke recurrence in patients with intracranial arterial stenosis.](https://pubmed.ncbi.nlm.nih.gov/17515467/) | 2007 | 10.1161/CIRCULATIONAHA.106.622464 |
| [24168957 — Aggressive medical treatment with or without stenting in high-risk patients with intracranial artery stenosis (SAMMPRIS): the final results of a randomised trial.](https://pubmed.ncbi.nlm.nih.gov/24168957/) | 2014 | 10.1016/S0140-6736(13)62038-3 |
| [30688979 — Effect of Intensive vs Standard Blood Pressure Control on Probable Dementia: A Randomized Clinical Trial.](https://pubmed.ncbi.nlm.nih.gov/30688979/) | 2019 | 10.1001/jama.2018.21442 |
| [11730446 — Delirium in mechanically ventilated patients: validity and reliability of the confusion assessment method for the intensive care unit (CAM-ICU).](https://pubmed.ncbi.nlm.nih.gov/11730446/) | 2001 | 10.1001/jama.286.21.2703 |
| [38752755 — European Stroke Organisation (ESO) Guidelines on the diagnosis and management of patent foramen ovale (PFO) after stroke.](https://pubmed.ncbi.nlm.nih.gov/38752755/) | 2024 | 10.1177/23969873241247978 |
| [30528472 — Effects of fluoxetine on functional outcomes after acute stroke (FOCUS): a pragmatic, double-blind, randomised, controlled trial.](https://pubmed.ncbi.nlm.nih.gov/30528472/) | 2019 | 10.1016/S0140-6736(18)32823-X |
| [32702334 — Safety and efficacy of fluoxetine on functional outcome after acute stroke (AFFINITY): a randomised, double-blind, placebo-controlled trial.](https://pubmed.ncbi.nlm.nih.gov/32702334/) | 2020 | 10.1016/S1474-4422(20)30207-6 |
| [32702335 — Safety and efficacy of fluoxetine on functional recovery after acute stroke (EFFECTS): a randomised, double-blind, placebo-controlled trial.](https://pubmed.ncbi.nlm.nih.gov/32702335/) | 2020 | 10.1016/S1474-4422(20)30219-2 |
| [25892679 — Efficacy and safety of very early mobilisation within 24 h of stroke onset (AVERT): a randomised controlled trial.](https://pubmed.ncbi.nlm.nih.gov/25892679/) | 2015 | 10.1016/S0140-6736(15)60690-0 |
| [34544853 — Critical Period After Stroke Study (CPASS): A phase II clinical trial testing an optimal time for motor recovery after stroke in humans.](https://pubmed.ncbi.nlm.nih.gov/34544853/) | 2021 | 10.1073/pnas.2026676118 |
| [37125534 — Cognitive Impairment After Ischemic and Hemorrhagic Stroke: A Scientific Statement From the American Heart Association/American Stroke Association.](https://pubmed.ncbi.nlm.nih.gov/37125534/) | 2023 | 10.1161/STR.0000000000000430 |
| [37603325 — Effect of Bypassing the Closest Stroke Center in Patients with Intracerebral Hemorrhage: A Secondary Analysis of the RACECAT Randomized Clinical Trial.](https://pubmed.ncbi.nlm.nih.gov/37603325/) | 2023 | 10.1001/jamaneurol.2023.2754 |
| [33528537 — Association Between Dispatch of Mobile Stroke Units and Functional Outcomes Among Patients With Acute Ischemic Stroke in Berlin.](https://pubmed.ncbi.nlm.nih.gov/33528537/) | 2021 | 10.1001/jama.2020.26345 |
| [37800374 — Transport Strategy in Patients With Suspected Acute Large Vessel Occlusion Stroke: TRIAGE-STROKE, a Randomized Clinical Trial.](https://pubmed.ncbi.nlm.nih.gov/37800374/) | 2023 | 10.1161/STROKEAHA.123.043875 |
| [37652068 — The Neurological Pupil index for outcome prognostication in people with acute brain injury (ORANGE): a prospective, observational, multicentre cohort study.](https://pubmed.ncbi.nlm.nih.gov/37652068/) | 2023 | 10.1016/S1474-4422(23)00271-5 |
| [39652324 — Neurological Pupil Index and Intracranial Hypertension in Patients With Acute Brain Injury: A Secondary Analysis of the ORANGE Study.](https://pubmed.ncbi.nlm.nih.gov/39652324/) | 2025 | 10.1001/jamaneurol.2024.4189 |
| [33367973 — Automated Pupillometry Identifies Absence of Intracranial Pressure Elevation in Intracerebral Hemorrhage Patients.](https://pubmed.ncbi.nlm.nih.gov/33367973/) | 2021 | 10.1007/s12028-020-01146-4 |
| [30635475 — RCVS(2) score and diagnostic approach for reversible cerebral vasoconstriction syndrome.](https://pubmed.ncbi.nlm.nih.gov/30635475/) | 2019 | 10.1212/WNL.0000000000006917 |
| [18025032 — The clinical and radiological spectrum of reversible cerebral vasoconstriction syndrome. A prospective series of 67 patients.](https://pubmed.ncbi.nlm.nih.gov/18025032/) | 2007 | 10.1093/brain/awm256 |
| [21482916 — Reversible cerebral vasoconstriction syndromes: analysis of 139 cases.](https://pubmed.ncbi.nlm.nih.gov/21482916/) | 2011 | 10.1001/archneurol.2011.68 |
| [32324916 — Organised inpatient (stroke unit) care for stroke: network meta-analysis.](https://pubmed.ncbi.nlm.nih.gov/32324916/) | 2020 | 10.1002/14651858.CD000197.pub4 |
| [22649218 — An integer-based score to predict functional outcome in acute ischemic stroke: the ASTRAL score.](https://pubmed.ncbi.nlm.nih.gov/22649218/) | 2012 | 10.1212/WNL.0b013e318259e221 |
| [23147454 — The PLAN score: a bedside prediction rule for death and severe disability following acute ischemic stroke.](https://pubmed.ncbi.nlm.nih.gov/23147454/) | 2012 | 10.1001/2013.jamainternmed.30 |
| [11283388 — The ICH score: a simple, reliable grading scale for intracerebral hemorrhage.](https://pubmed.ncbi.nlm.nih.gov/11283388/) | 2001 | 10.1161/01.str.32.4.891 |
| [3363593 — Interobserver agreement for the assessment of handicap in stroke patients.](https://pubmed.ncbi.nlm.nih.gov/3363593/) | 1988 | 10.1161/01.str.19.5.604 |
| [7678184 — Classification of subtype of acute ischemic stroke. Definitions for use in a multicenter clinical trial. TOAST. Trial of Org 10172 in Acute Stroke Treatment.](https://pubmed.ncbi.nlm.nih.gov/7678184/) | 1993 | 10.1161/01.str.24.1.35 |
| [12867109 — Unruptured intracranial aneurysms: natural history, clinical outcome, and risks of surgical and endovascular treatment.](https://pubmed.ncbi.nlm.nih.gov/12867109/) | 2003 | 10.1016/s0140-6736(03)13860-3 |
| [22738097 — The natural course of unruptured cerebral aneurysms in a Japanese cohort.](https://pubmed.ncbi.nlm.nih.gov/22738097/) | 2012 | 10.1056/NEJMoa1113260 |
| [28363976 — ELAPSS score for prediction of risk of growth of unruptured intracranial aneurysms.](https://pubmed.ncbi.nlm.nih.gov/28363976/) | 2017 | 10.1212/WNL.0000000000003865 |
| [23821755 — Natural history of asymptomatic unruptured cerebral aneurysms evaluated at CT angiography: growth and rupture incidence and correlation with epidemiologic risk factors.](https://pubmed.ncbi.nlm.nih.gov/23821755/) | 2013 | 10.1148/radiol.13121188 |
| [30592482 — Procedural Clinical Complications, Case-Fatality Risks, and Risk Factors in Endovascular and Neurosurgical Treatment of Unruptured Intracranial Aneurysms: A Systematic Review and Meta-analysis.](https://pubmed.ncbi.nlm.nih.gov/30592482/) | 2019 | 10.1001/jamaneurol.2018.4165 |
| [26089327 — Guidelines for the Management of Patients With Unruptured Intracranial Aneurysms: A Guideline for Healthcare Professionals From the American Heart Association/American Stroke Association.](https://pubmed.ncbi.nlm.nih.gov/26089327/) | 2015 | 10.1161/STR.0000000000000070 |

## Final Trials/search integration check

The final caller review found and corrected one missing-data mismatch. The
Encounter trial-matcher envelope passed the NIHSS calculator's initial zero
when no examination or NIHSS entry was recorded. That made PICASSO's NIHSS≥4
criterion fail instead of remaining unknown. The caller now passes
`getDocumentedNihss() || null` and tracks examination-input changes. Blank NIHSS
is unknown; an explicitly entered zero or recorded examination scoring zero
remains a documented zero. No trial criterion or treatment recommendation changed.
Four new provenance cases plus the existing focused review, engine and frozen
scenario suites passed **215/215 tests**. The app source also passed an in-memory
JSX transform. Root integration must rebuild the bundle after this caller change.

The treatment-decision resolver still distinguishes undocumented false defaults
from explicitly recorded negatives and accepts a legacy positive as positive.
The wrapper and Encounter UI consistently use “Possible candidate” and the full
protocol-review requirement. A recommendation remains a plan, not evidence of
administration. Existing required-field and incomplete-protocol limitations
described above remain in place.

Six focused fresh-Edge browser checks against the local4186 build passed with
zero page errors: mixed-type keyboard search to VNS-REHAB, channel-blocking search
to the exact recommendation, both source-only rehabilitation/cognition searches,
CAPPRICORN's Not enrolling filter, and its exclusion from screener candidates
and the briefing note. Search rendering and keyboard activation use the same
ordered result array. All52 added Education citation IDs were present in the
then-current bundle. The exact catalog tests assert242 completed trials and378
citations; earlier report counts are explicitly identified as baseline or prior
validation stages. No further unsupported change to the reviewed trial claims
was identified in this bounded check.

## Final documented-decision caller audit

A read-only scan of the remaining `tnkRecommended`/`evtRecommended` usages found
seven dynamic Encounter recommendation predicates that still equated default
false with a decision to omit treatment. Their sole consumers were the two
Encounter recommendation surfaces; the excluded Protocols tab did not call this
recommendation catalog. With root authorization, the seven predicates now use
`hasRecordedNoTreatment`: an explicit negative decision (or the existing TNK
contraindication flag) is required, and recorded administration prevents a
no-treatment classification. EVT puncture also prevents an omitted-EVT label.
The two duplicate LVO warnings use the same helper. The post-EVT imaging card
now requires recorded EVT completion instead of a recommendation alone. Clinical
recommendation text and clinical thresholds were not changed in this correction.

The affected recommendation records are `bp_pre_evt`, `bp_ischemic_no_lysis`,
`dapt_minor_stroke`, `dapt_ticagrelor_nihss5`, `direct_to_angio`,
`tirofiban_no_occlusion`, `permissive_hypertension`, and `post_evt_dect`.
The contextual-recommendation data caller also now passes a documented NIHSS
number or null, preserving explicit zero and avoiding a blank-calculator zero.

`tests/encounter-treatment-condition-provenance.test.js` executes the actual
app recommendation predicates, actual NIHSS getter and actual recommendation
data envelope. Its18 cases cover undocumented negatives, recorded negatives,
recorded contraindication, all three TNK administration-time fields, EVT
puncture/completion, recommendation-only EVT, and blank versus explicit/calculated
NIHSS zero. Combined with the focused evidence and search/decision tests,
**65/65 tests passed**. The current app JSX transform and whitespace checks pass.

Other concrete caller issues found during this scan were handed to their owners:
root corrected the separate Encounter Copy Note treatment narrative and safety
checks; the Education owner corrected post-care/timer/BP-phase callers and
timestamp-dependent note details; the repository reviewer corrected the Nursing
sheet. Two residual narrative headings/phrases that could imply completed care
from a plan were sent to root for wording correction. This final audit concerned
documented-input semantics, not a new clinical audit of the surrounding text.
