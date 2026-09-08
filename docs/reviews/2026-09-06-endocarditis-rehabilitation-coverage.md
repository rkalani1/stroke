# ESC endocarditis, AHA rehabilitation, and remaining-library inventory

Reviewed 6 September 2026. Authored-data scope: `esc-endocarditis-2023.json` and `aha-stroke-rehabilitation-2026.json`. Protocols, application logic, generated bundles, index generation, versions, and deployment are outside this agent's edit scope.

## Method and safety scope

The content-contribution instructions and AutoMedBench S1–S3 were read before clinical edits. The defined task was to account for every formal recommendation and good-practice/consensus statement in the two assigned publications. Source access failure is a stop condition for asserting complete extraction, not grounds to infer missing grades or substitute a different publication. Summaries use original factual wording. The complete source article remains the authority for drug doses, monitoring, diagnostic algorithms, and supporting evidence.

## 2023 ESC endocarditis

**Complete formal recommendation inventory: 120 graded rows in 22 Recommendation Tables.** Additional content comprises 72 ungraded practice, treatment-regimen, and special-population/patient-care summaries, for **192 rows**. The source does not designate a separate formal consensus-statement series; `sourceConsensusCount` is therefore zero, and the 72 additional rows are reported as `sourcePracticeStatementCount`. They are not assigned invented COR/LOE values.

The publisher's full [article](https://academic.oup.com/eurheartj/article/44/39/3948/7243107), accessible through its [full-text CDN rendering](https://oup.silverchair-cdn.com/article-minimal/7243107), supplied current corrected recommendation-table images. All 29 image panels for the 22 tables were retrieved and visually checked. The [original 95-page article PDF](https://cardiologybd.com/wp-content/uploads/2023/10/2023-ESC-Guidelines-for-the-management-of-endocarditis.pdf) supplied page structure and a second extraction; because that mirror predates corrections, it was not used as the final authority for corrected doses. The current 15-page publisher supplement was downloaded from the supplementary-data link in the article. Full downloaded articles and images remain scratch research assets, not repository deliverables.

| Recommendation table | Subject | Graded rows | Advance-PDF page |
|---|---|---:|---:|
| 1 | Dental prophylaxis by cardiac risk | 9 | 14 |
| 2 | High-risk prevention procedures | 2 | 16 |
| 3 | Cardiac procedural prevention | 8 | 16–17 |
| 4 | Endocarditis Team | 2 | 18 |
| 5 | Echocardiography | 11 | 22 |
| 6 | CT, nuclear imaging, MRI | 7 | 23 |
| 7 | Oral streptococci/S. gallolyticus antibiotics | 7 | 30–31 |
| 8 | Staphylococcal antibiotics | 9 | 33–34 |
| 9 | Enterococcal antibiotics | 5 | 35–36 |
| 10 | Empirical antibiotics | 3 | 38–39 |
| 11 | Outpatient antibiotic therapy | 2 | 40 |
| 12 | Left-sided IE surgery | 9 | 44 |
| 13 | Neurological complications | 5 | 45 |
| 14 | Atrioventricular block/pacing | 1 | 46 |
| 15 | Musculoskeletal complications | 3 | 47 |
| 16 | Preoperative coronary assessment | 4 | 48 |
| 17 | Cardiac surgery after neurological events | 4 | 50 |
| 18 | Follow-up | 4 | 52 |
| 19 | Early prosthetic-valve IE | 1 | 53 |
| 20 | CIED-related IE | 12 | 57–58 |
| 21 | Right-sided IE surgery | 8 | 60 |
| 22 | Antithrombotic therapy | 4 | 62–63 |
| **Total** | | **120** | |

The PDF extractor found 116 graded rows. Visual inspection supplied the two Table 3 and two Table 22 continuation rows it missed and resolved merged LOE cells. All 116 available extracted COR/LOE pairs reconcile with the authored rows. ESC's original A/B/C evidence levels are retained, without conversion to AHA's different evidence vocabulary.

Additional source inventories are Table 5 (9 general-prevention bullets), Table 6 (7 prophylaxis regimens), Table 11 (6 proposed culture-negative regimens), Supplementary Table S8 (11 outpatient eligibility/phase groups), S9 (6 organism-specific oral-regimen groups), S10 (12 perioperative neurological-risk/action groups), and Sections 12.5/12.7–12.13/13 (21 special-population and whole-person-care groups). Section identifiers and within-section ordinals are recorded on each row and reconciled to structured `coverage.sourceSections` counts.

Other ordinary/supplemental tables were inventoried: grading definitions, new/revised-recommendation summaries, the Endocarditis Team membership, diagnostic criteria/lesion definitions, organism workup, prognostic and procedural risk scores, and the consolidated “what to do” table are supporting descriptions or duplicates, not additional independent formal recommendation rows. The extraction's complete scope is the formal recommendation set, with separately identified additional practice content; it is not a replacement for the complete article.

Independent review prompted an additional integral-dosing pass: all 24 antibiotic recommendation rows in Tables 7–10 now carry the source's adult and paediatric drug doses, routes, schedules, durations, applicable dose caps, and monitoring footnotes. Table 6 prophylaxis already included its dose matrix. Every organism group in Supplementary Table S9 now carries the shared oral dose key, rather than requiring the reader to find that key in the last group. Counts and grades remain unchanged. The current publisher's enlarged [Table 7](https://academic.oup.com/view-large/570647158), [Table 8](https://academic.oup.com/view-large/570647170), [Table 9](https://academic.oup.com/view-large/570647176), and [Table 10](https://academic.oup.com/view-large/570647192) were used to check small dose cells; notably, ceftriaxone in Table 9's first two rows is IV, while the high-level-resistance row permits IV/IM. The vancomycin table footnote is accompanied by Section 7.7's AUC/MIC 400–600 target for MRSA, avoiding presentation of trough escalation alone as the complete source guidance.

### Corrections

All three indexed notices were re-read in full against the current publisher version; the previously abbreviated notices understated two corrections' scope.

- [ehad625](https://academic.oup.com/eurheartj/article/44/45/4780/7279229): adult amoxicillin in Recommendation Table 7, paediatric cefazolin in Table 8, duplicate Table 14, and supplementary diagnostic Table S6. Corrected dosing reproduced in relevant summaries is retained.
- [ehad776](https://academic.oup.com/eurheartj/article/45/1/56/7442699): reference 479, PET/CT wording in the new-recommendations summary, and paediatric penicillin G in Recommendation Table 7/duplicate Table 14. This is **not merely a reference correction**. The current PET/CT IIb/B recommendation and paediatric penicillin G 200,000 units/kg/day in 4–6 divided IV doses are preserved.
- [ehae877](https://academic.oup.com/eurheartj/article/46/11/1082/7959358): paediatric prophylaxis Table 6 and amoxicillin, ampicillin, cefazolin, or rifampin dosing/routes in Recommendation Tables 7–10, with corresponding Table 14 revisions. This is **not merely a prophylaxis-dose correction**. Current publisher doses are incorporated where reproduced, and affected source rows are linked in metadata.

Bounded source issues remain explicit: Table 6 prints doxycycline weight strata below and above 45 kg without specifying exactly 45 kg; that boundary is not invented. Table 11's Bartonella gentamicin entry prints an inconsistent unit, so the regimen is summarized without repeating that dose. Table 8's daptomycin/rifampin/gentamicin combination grammar is ambiguous. Table 9's main and footnote ampicillin schedules differ, its paediatric fosfomycin dose has no weight band, and a paediatric ceftaroline cell omits route. Table 10's adult rifampin cell omits the per-day unit. These omissions and discrepancies are reported directly, with specialist review rather than guessed corrections or invented schedules.

### Validation

`npx vitest run tests/esc-endocarditis-completeness.test.js tests/guideline-coverage.test.js` passed 9 tests after the integral-dose expansion. Checks cover the independent per-table inventory, ordinal continuity, original grades, unique IDs, ungraded distinction, complete correction scopes, outpatient exclusions, neurological exceptions, source-section reconciliation, full dosing keys, route differences, dose caps and monitoring. No build or generation was run by this agent.

## 2026 AHA adult stroke rehabilitation

The publication identity is confirmed, not a mistaken 2016 reference: Richards and colleagues, published 27 August 2026, DOI **10.1161/STR.0000000000000536**, PMID **42657476**. The [official AHA guideline hub](https://professional.heart.org/en/science-news/2026-guideline-for-adult-stroke-rehabilitation-and-recovery), [PubMed record](https://pubmed.ncbi.nlm.nih.gov/42657476/), and [author-institution publication listing](https://www.vagelos.columbia.edu/departments-centers/rehabilitation-and-regenerative-medicine/research/publications) agree. The 2016 publication is not substituted for this current guideline.

**Full extraction remains blocked; no complete/current clinical review is claimed.** The publisher's full-text/PDF endpoints returned access errors; the official slide deck could not be downloaded through ordinary HTTP or the normal browser download path. Europe PMC verifies the citation but has no PMC full text and reports a subscription-required publisher link. A publicly visible third-party post offered the original English attachment, but normal attachment viewing required account certification; no attempt was made to bypass it. The author-institution page links back to the publisher rather than an open manuscript. Further targeted full-title/DOI searches found no accessible primary full article.

The six [official stroke.org chapter resources](https://www.stroke.org/en/professionals/stroke-resource-library/post-stroke-care/professional-rehab-resources) are accessible, but explicitly provide selected key recommendations and do not reproduce a complete COR/LOE inventory. A secondary interactive summary is also condensed and cannot establish primary-source completeness. Neither is used to invent missing grades, source counts, or full coverage.

The dataset now records verified publication identity and a concrete source-access status. `coverage.status` is `source-unavailable`, and source counts remain null. **Required next action:** obtain the full 2026 primary PDF, then inventory every formal recommendation and good-practice statement before replacing the source-only record.

## Read-only inventory of the remaining library

A structural scan covered all 109 guideline datasets, recording row counts, document types, grading vocabularies, extraction markers, coverage statuses, DOI identities, and exact repeated text. At the scan time, 12 records had newly reconciled complete-coverage metadata, 96 had no complete source inventory, and rehabilitation remained source-unavailable. These are dynamic integration counts, not a certification that the other 96 are incomplete or complete.

No complete-collection assertion is supported by a schema scan alone. Scientific statements often lack a formally graded recommendation series; small focused guidelines may genuinely have only a few recommendations. Direct source counting, rather than total row count, is required before changing either conclusion.

Confirmed findings and disposition:

- **Poststroke primary care 2021:** the old 20-row record covered only part of Table 4 and omitted whole-person care and the rehabilitation figure. The original 14-page primary PDF was obtained and supplied to the parent, who expanded this document. Its Class I rows were genuine source summary classifications, not fabricated grades.
- **SVIN large-core 2025:** the [primary full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC12671639/) has exactly the four formal recommendations already present (one early-window, three late-window). Low row count alone is not an omission.
- **ESO motor, visual, and short-term DAPT:** initial inspection found combined formal/consensus/narrative units that required source reconciliation. The owning ESO agent and parent performed the full inventories and expansions/classification corrections; this report does not supersede their final counts.
- **AHA atrial fibrillation 2023:** one exact dronedarone prohibition appears in both the rhythm-control and heart-failure sections. It is a repeated recommendation in distinct source sections, not sufficient evidence of a bad duplicate; no deletion was made.
- Existing explicit source-only/partial flags in the assigned documents were reviewed; rehabilitation's unresolved flag is retained. No additional hidden omission was established with adequate primary evidence during this bounded independent pass.

The structural CSV is scratch `../complete-guidelines/other/remaining-guideline-inventory.csv`. It is an audit aid, not a clinical completeness certificate. Primary-source inventories remain necessary for records without them, particularly before describing the whole 109-document collection as fully extracted.
