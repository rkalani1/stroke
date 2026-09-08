# Guideline library review — 2026-09-06

## S1–S3 before editing

Scope: authored `src/guidelines/*.json` and `src/guideline-library.js`; the Protocols tab, its frozen wording, generated outputs, and treatment eligibility logic are excluded. This is a publication-metadata and extraction-integrity review of all 108 documents, with primary-source checking of indexed corrections. It is not a new systematic review of all 3,547 extracted entries.

S1: correct five AIS 2026 entries against items 12, 13 and 22–24 of the publisher's [July correction](https://www.ahajournals.org/doi/pdf/10.1161/STR.0000000000000530?download=true); remove the explicitly superseded 2017 comparison-column entry from the 2025 hypertension dataset, retaining its 2025 replacement. Add traceable correction applicability notices. Do not infer unreadable correction content, invent grades, or mark entire documents clinically reviewed.

S2: affected AIS entry IDs are `ais-2026-98`, `ais-2026-101`, `ais-2026-162`, `ais-2026-164`, and `ais-2026-165`. Original PMID 41582814 / DOI 10.1161/STR.0000000000000513; correction PMID 42507797 / DOI 10.1161/STR.0000000000000530. Hypertension PMID 40811516 / DOI 10.1161/HYP.0000000000000249: [publisher Table 1](https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001356?af=R) distinguishes prior and current wording. Existing source IDs remain stable. These changes touch clinical reference text and index metadata only.

S3: all 108 guideline PMIDs resolved through the Europe PMC MEDLINE interface and matched their stored DOIs; all 28 linked correction PMIDs and DOIs were checked. The five AIS changes map to explicitly numbered correction items. The removed hypertension row is already labeled superseded in the source dataset, and the replacement exists as row 7. No private or patient information is involved. Scoped Vitest regression checks will validate clinical constraints and correction/index integrity; the coordinating agent runs integrated AutoMedBench, evidence refresh, QA, build, and Protocols snapshot checks. Unavailable correction content remains explicitly unresolved.

## Findings and evidence

### S1–S3 extension: 2026 dyslipidemia summary

Before adding the new dataset: the coordinating agent authorized a selected stroke-relevant summary in `src/guidelines/aha-dyslipidemia-2026.json`. PMID 41824552 matches DOI 10.1161/CIR.0000000000001423; publication date is March 13, 2026 and no indexed correction relation was returned. The official source's section 2.1, section 4.2.6 and comparison Table 1 support the risk distinction and treatment targets. Four paraphrased entries will be marked as guideline summaries with partial extraction, rather than a full transcription or inferred LOE. The education/calculator owner confirmed the same risk distinction. No prior-ICH safety claim or Protocols edit is included. The existing integrity suite will be extended for the new document, summary markers and target qualifications.

### Coverage and limits

The baseline inventory contained 108 documents and 3,547 entries. After removing one superseded comparison entry and adding four selected dyslipidemia summaries, the final inventory contains 109 documents and 3,550 entries, including three source-only placeholders: 3,547 evidence-bearing excerpts/statements. These are not all graded recommendations: the original classification distribution was 1,889 Statement, 315 Expert Consensus, 226 Conditional, 127 Strong, 72 No recommendation, and 918 ACC/AHA-style I/IIa/IIb/III entries. The retained set has 917 ACC/AHA-style entries. Narrative material stays ungraded; the review does not infer grades from verbs such as “recommended.”

Every baseline file and the added dyslipidemia file were parsed and checked for PMID/DOI pairing, required fields, valid COR/LOE vocabulary, unique projected entry IDs, nonempty text/section, positive integral page references when present, and HTTPS source URLs. All 109 PMID/DOI pairs match the MEDLINE records retrieved through [Europe PMC's API](https://europepmc.org/RestfulWebService). No indexed retraction or expression-of-concern relation was returned. This is a metadata check, not proof of complete clinical currency or exhaustive correction indexing. The only exact duplicate text occurs in AF 2023 rows 119 and 155, in two different clinical sections; it was retained because the sectional contexts differ.

The baseline 108 documents comprise 55 guidelines, 46 scientific statements and seven advisories; the added dyslipidemia guideline raises the final count to 109. Six already recorded source extraction limits. ESC endocarditis 2023, ESO/EAN cognition 2021 and AHA rehabilitation 2026 are source-only records with no transcribed recommendations. ESO BP 2025, ESO SAH 2026 and ESO pneumonia 2026 contain narrative excerpts rather than fully transcribed recommendation boxes. Hypertension 2025 is now explicitly marked partial: it contains selected new/revised comparison-table items with no extracted LOE. Its current RAAS-inhibitor entry remains; the prior 2017 ACE-inhibitor entry is removed. No full-review date was advanced.

### Correction applicability

MEDLINE links 28 published corrections to 21 documents. Primary publisher notices were read directly or through the search index's primary-publisher text when direct HTML/PDF requests returned HTTP 403. Twenty-two notices were available for substantive applicability review: one required changes to five extracted rows, and 21 did not require changes to the extracted rows. Six notices remain affectedness-unknown after publisher HTML/PDF and authoritative-alternative searches. They are explicitly flagged in the data and must not be described as clinically cleared.

AIS 2026: all 34 numbered items were checked, including the final page's continuation of references. Items 12, 13 and 22–24 affect the five IDs recorded above; their row provenance now includes the correction DOI. Other items concern nonextracted tables, supporting discussion, references, figures, or publication information. “Applied” means the correction was reconciled to this library's extracted rows; it does not mean the entire source was independently re-reviewed. The Protocols tab was excluded.

The table below records each notice and the extraction-specific decision. “Not applicable” means no corresponding erroneous clinical text is reproduced in this library; it does not imply the correction is clinically unimportant in the original publication.


| Dataset | Correction PMID / source | Status | Applicability |
|---|---|---|---|
| `aha-af-guideline-2023` | [38153996](https://doi.org/10.1161/cir.0000000000001207) | not-applicable | Trial-acronym, affiliation and disclosure corrections do not alter the extracted recommendations. |
| `aha-af-guideline-2023` | [38408149](https://doi.org/10.1161/cir.0000000000001218) | not-applicable | Corrects the PREVAIL trial expansion in supporting text; the library does not reproduce that expansion. |
| `aha-af-guideline-2023` | [38857333](https://doi.org/10.1161/cir.0000000000001263) | not-applicable | Corrects the ATRIA hypertension point in Table 8 and a Figure 17 footnote marker; neither table nor figure is reproduced in these entries. |
| `aha-aggressive-ldl-lowering-2023` | [37878679](https://doi.org/10.1161/atv.0000000000000165) | not-applicable | Corrects the ASCOT-LLA LDL value in a supporting evidence table; the affected value is not reproduced in the library. |
| `aha-atrial-fibrillation-occurring-2023` | [37093973](https://doi.org/10.1161/cir.0000000000001147) | not-applicable | Corrects dabigatran renal/drug-interaction and apixaban dose-reduction criteria in a supplemental table; these dosing rows are not reproduced here. |
| `aha-care-ais-evt-icu-2021` | [42507798](https://doi.org/10.1161/str.0000000000000531) | not-applicable | Corrects a labetalol infusion typo in Table 4. The library names labetalol without reproducing the erroneous dose; use the corrected source for dosing. |
| `aha-care-ais-posthyperacute-2021` | [33900839](https://doi.org/10.1161/str.0000000000000373) | not-applicable | Corrects EEG wording, a residual-volume acronym, an NIHSS typo, the IPC expansion and an affiliation. Relevant library text already uses the corrected terms or does not reproduce the affected material. |
| `aha-crao-2021` | [34029154](https://doi.org/10.1161/str.0000000000000374) | not-applicable | Adds the American Academy of Neurology affirmation; no extracted clinical statement changes. |
| `aha-creating-virtual-networks-2025` | [41871197](https://doi.org/10.1161/str.0000000000000519) | not-applicable | Adds the American Academy of Neurology affirmation; no extracted clinical statement changes. |
| `aha-hypertension-guideline-2025` | [41259465](https://doi.org/10.1161/hyp.0000000000000257) | not-applicable | Corrects comparison/grading-table presentation and aprocitentan supporting text and figure notes. The affected clinical material is not reproduced in the extracted entries. |
| `aha-hypertension-guideline-2025` | [41984986](https://doi.org/10.1161/hyp.0000000000000262) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `aha-hypertension-guideline-2025` | [42160500](https://doi.org/10.1161/hyp.0000000000000264) | not-applicable | Corrects the labetalol IV injection interval in Table 26. Drug dosing from this table is not reproduced in the library. |
| `aha-recommendations-regional-destination-2021` | [34181455](https://doi.org/10.1161/str.0000000000000379) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `ais-2026` | [42507797](https://doi.org/10.1161/str.0000000000000530) | applied | All 34 correction items checked for applicability to this library. Five recommendation changes applied; remaining items concern material not reproduced here. This does not represent a new clinical review of the full guideline. |
| `cardiac-brain-health-2024` | [39705397](https://doi.org/10.1161/str.0000000000000483) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `esc-endocarditis-2023` | [37738322](https://doi.org/10.1093/eurheartj/ehad625) | not-applicable | Corrects antibiotic doses in Tables 7, 8 and 14 and supplemental Table S6. This library currently contains a source-only placeholder, not antibiotic recommendations. |
| `esc-endocarditis-2023` | [38086544](https://doi.org/10.1093/eurheartj/ehad776) | not-applicable | Corrects a reference. The library contains a source-only placeholder and does not reproduce the reference list. |
| `esc-endocarditis-2023` | [39824219](https://doi.org/10.1093/eurheartj/ehae877) | not-applicable | Corrects a pediatric antibiotic-prophylaxis dose in Table 6. The library contains a source-only placeholder and no dosing table. |
| `eso-artery-dissection-2021` | [37021160](https://doi.org/10.1177/23969873221133905) | not-applicable | Adds omitted ethical-approval and informed-consent declarations; no clinical recommendation changes. |
| `eso-ean-poststroke-cognition-2021` | [35300261](https://doi.org/10.1177/23969873221076951) | not-applicable | Restores missing recommendation boxes in the online supplement. This library remains source-only; consult the corrected supplement for recommendations. |
| `eso-esmint-thrombectomy-2022` | [37021163](https://doi.org/10.1177/23969873221133913) | not-applicable | Adds omitted informed-consent and ethical-approval declarations; no clinical recommendation changes. |
| `eso-stroke-in-women-2022` | [37021188](https://doi.org/10.1177/23969873221133929) | not-applicable | Adds omitted declaration information; no clinical recommendation changes. |
| `eso-subclinical-af-screening-2022` | [37021192](https://doi.org/10.1177/23969873221133924) | not-applicable | Adds an omitted informed-consent declaration; no clinical recommendation changes. |
| `poststroke-spasticity-2026` | [42044236](https://doi.org/10.1161/str.0000000000000522) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `primary-prevention-2024` | [39585937](https://doi.org/10.1161/str.0000000000000482) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `primary-prevention-2024` | [39869715](https://doi.org/10.1161/str.0000000000000486) | unresolved | The indexed correction was confirmed, but its substantive text could not be retrieved from the publisher or an authoritative alternative. Its applicability to these entries remains unresolved; consult the correction. |
| `sah-2023` | [38011240](https://doi.org/10.1161/str.0000000000000449) | not-applicable | Corrects seizure-section reference numbering without changing recommendation text or grades; the library does not reproduce numbered citations. |
| `secondary-prevention-2021` | [34181456](https://doi.org/10.1161/str.0000000000000383) | not-applicable | Corrects the PFO take-home summary, diagnostic algorithm and a trial acronym. Extracted PFO criteria and diagnostic recommendation grades already reflect the corrected recommendations; the algorithm and acronym are not reproduced. |

### Recent publication search

The [AHA guideline publication schedule](https://professional.heart.org/en/guidelines-and-statements/guideline-publication-schedule) and [recent guideline listing](https://professional.heart.org/en/guidelines-statements) were checked. The August 27, 2026 adult stroke rehabilitation guideline is already represented, with an explicit source-only limit. The scheduled 2026 ICH update is future work and was not treated as a published replacement for ICH 2022.

A bounded MEDLINE query for stroke/cerebrovascular/hemorrhage guideline, statement, consensus or correction titles first published August 29–September 6, 2026 found no new matching stroke guidance to add. This narrowly scoped search does not prove completeness, does not cover indexing lag, and does not justify refreshing every document review date. The March 2026 dyslipidemia guideline (DOI [10.1161/CIR.0000000000001423](https://www.ahajournals.org/doi/abs/10.1161/CIR.0000000000001423)) was added as four selected summaries after the coordinating agent authorized it. Sections 2.1 and 4.2.6, Figure 10 and Table 1 were checked; the rest of the guideline was not transcribed. The education/calculator owner confirmed the corresponding risk distinction. No blanket ICH safety conclusion was added.

### Per-document metadata inventory

All rows below had matching MEDLINE PMID/DOI pairs. Counts reflect the final authored dataset. “No indexed correction” describes the retrieved relation list only. Recommendation wording outside the documented correction checks was not newly verified line by line.

| Authored dataset (`src/guidelines/`) | PMID / original source | Entries | Correction / extraction coverage |
|---|---|---|---|
| `aan-asm-withdrawal-2021.json` | [34873018](https://doi.org/10.1212/WNL.0000000000012944) | 14 | No indexed correction |
| `aan-brain-death-guidance-2025.json` | [41187308](https://doi.org/10.1212/WNL.0000000000214334) | 27 | No indexed correction |
| `aan-consent-ais-2022.json` | [35312627](https://doi.org/10.1212/WNL.0000000000013040) | 26 | No indexed correction |
| `aan-driver-licensure-2025.json` | [40073306](https://doi.org/10.1212/WNL.0000000000213459) | 28 | No indexed correction |
| `aan-functional-seizures-2025.json` | [41370742](https://doi.org/10.1212/WNL.0000000000214466) | 33 | No indexed correction |
| `aan-neuropalliative-2022.json` | [35256519](https://doi.org/10.1212/WNL.0000000000200063) | 36 | No indexed correction |
| `aan-sicas-2022.json` | [35314513](https://doi.org/10.1212/WNL.0000000000200030) | 15 | No indexed correction |
| `aha-acute-bp-management-2024.json` | [38804130](https://doi.org/10.1161/HYP.0000000000000238) | 41 | No indexed correction |
| `aha-adult-moyamoya-disease-2023.json` | [37609846](https://doi.org/10.1161/STR.0000000000000443) | 28 | No indexed correction |
| `aha-af-guideline-2023.json` | [38033089](https://doi.org/10.1161/CIR.0000000000001193) | 194 | not-applicable |
| `aha-aggressive-ldl-lowering-2023.json` | [37706297](https://doi.org/10.1161/ATV.0000000000000164) | 27 | not-applicable |
| `aha-antiamyloid-immunotherapy-2024.json` | [39660440](https://doi.org/10.1161/STR.0000000000000480) | 22 | No indexed correction |
| `aha-atrial-fibrillation-occurring-2023.json` | [36912134](https://doi.org/10.1161/CIR.0000000000001133) | 47 | not-applicable |
| `aha-brain-health-life-span-2026.json` | [42047038](https://doi.org/10.1161/STR.0000000000000518) | 26 | No indexed correction |
| `aha-cadasil-2023.json` | [37602377](https://doi.org/10.1161/STR.0000000000000444) | 30 | No indexed correction |
| `aha-care-ais-evt-icu-2021.json` | [33691467](https://doi.org/10.1161/STR.0000000000000358) | 34 | not-applicable |
| `aha-care-ais-posthyperacute-2021.json` | [33691469](https://doi.org/10.1161/STR.0000000000000357) | 61 | not-applicable |
| `aha-care-ais-prehospital-2021.json` | [33691468](https://doi.org/10.1161/STR.0000000000000356) | 42 | No indexed correction |
| `aha-cervical-artery-dissection-2024.json` | [38299330](https://doi.org/10.1161/STR.0000000000000457) | 26 | No indexed correction |
| `aha-clinical-performance-measures-2021.json` | [34348470](https://doi.org/10.1161/STR.0000000000000388) | 13 | No indexed correction |
| `aha-crao-2021.json` | [33677974](https://doi.org/10.1161/STR.0000000000000366) | 21 | not-applicable |
| `aha-creating-virtual-networks-2025.json` | [41342129](https://doi.org/10.1161/STR.0000000000000511) | 24 | not-applicable |
| `aha-dyslipidemia-2026.json` | [41824552](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423) | 4 | No indexed correction; partial-extraction |
| `aha-hypertension-guideline-2025.json` | [40811516](https://doi.org/10.1161/HYP.0000000000000249) | 19 | not-applicable, unresolved; partial-extraction |
| `aha-ich-performance-measures-2024.json` | [38695183](https://doi.org/10.1161/STR.0000000000000464) | 30 | No indexed correction |
| `aha-ideal-foundational-requirements-2023.json` | [36748462](https://doi.org/10.1161/STR.0000000000000424) | 40 | No indexed correction |
| `aha-impact-sleep-disorders-2024.json` | [38235581](https://doi.org/10.1161/STR.0000000000000453) | 43 | No indexed correction |
| `aha-improving-access-rehabilitation-2025.json` | [40740119](https://doi.org/10.1161/STR.0000000000000493) | 87 | No indexed correction |
| `aha-in-hospital-stroke-2022.json` | [35137601](https://doi.org/10.1161/STR.0000000000000402) | 45 | No indexed correction |
| `aha-lv-systolic-dysfunction-2026.json` | [42389837](https://doi.org/10.1161/STR.0000000000000528) | 31 | No indexed correction |
| `aha-lv-thrombus-2022.json` | [36106537](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001092) | 27 | No indexed correction |
| `aha-mis-ich-evacuation-2026.json` | [42634945](https://www.ahajournals.org/doi/10.1161/STR.0000000000000529) | 20 | No indexed correction |
| `aha-nursing-role-psychosocial-2024.json` | [39155870](https://doi.org/10.1161/STR.0000000000000471) | 36 | No indexed correction |
| `aha-palliative-end-life-2024.json` | [39676661](https://doi.org/10.1161/STR.0000000000000479) | 36 | No indexed correction |
| `aha-primary-agenda-brain-2021.json` | [33719523](https://doi.org/10.1161/STR.0000000000000367) | 29 | No indexed correction |
| `aha-recommendations-regional-destination-2021.json` | [33691507](https://doi.org/10.1161/STROKEAHA.120.033228) | 47 | unresolved |
| `aha-rural-stroke-care-2024.json` | [39665145](https://doi.org/10.1161/STR.0000000000000478) | 35 | No indexed correction |
| `aha-sex-gender-evt-2022.json` | [35695016](https://doi.org/10.1161/STR.0000000000000411) | 29 | No indexed correction |
| `aha-social-environmental-determinants-2026.json` | [42109096](https://doi.org/10.1161/STR.0000000000000520) | 37 | No indexed correction |
| `aha-standards-postacute-rehabilitation-2025.json` | [40408522](https://doi.org/10.1161/STROKEAHA.124.048942) | 18 | No indexed correction |
| `aha-stroke-rehabilitation-2026.json` | [42657476](https://www.ahajournals.org/doi/10.1161/STR.0000000000000536) | 1 | No indexed correction; source-not-machine-readable |
| `aha-targeted-nursing-interventions-2025.json` | [41164866](https://doi.org/10.1161/STR.0000000000000495) | 28 | No indexed correction |
| `aha-transitions-of-care-2024.json` | [38557155](https://doi.org/10.1161/STR.0000000000000462) | 21 | No indexed correction |
| `aha-use-marijuana-effect-2022.json` | [35142225](https://doi.org/10.1161/STR.0000000000000396) | 31 | No indexed correction |
| `aha-vascular-contributions-cognitive-2026.json` | [42186798](https://doi.org/10.1161/STR.0000000000000524) | 27 | No indexed correction |
| `ais-2026.json` | [41582814](https://www.ahajournals.org/doi/10.1161/STR.0000000000000513) | 195 | applied |
| `caa-icaa-wso-2025.json` | [40721902](https://journals.sagepub.com/doi/10.1177/17474930251365861) | 46 | No indexed correction |
| `cancer-stroke-2026.json` | [41623113](https://www.ahajournals.org/doi/10.1161/STR.0000000000000517) | 37 | No indexed correction |
| `cardiac-brain-health-2024.json` | [39387123](https://www.ahajournals.org/doi/10.1161/STR.0000000000000476) | 33 | unresolved |
| `cvt-2024.json` | [38284265](https://www.ahajournals.org/doi/10.1161/STR.0000000000000456) | 38 | No indexed correction |
| `esc-endocarditis-2023.json` | [37622656](https://academic.oup.com/eurheartj/article/44/39/3948/7243107) | 1 | not-applicable; source-not-machine-readable |
| `eso-af-secondary-prevention-2019.json` | [31984228](https://doi.org/10.1177/2396987319841187) | 23 | No indexed correction |
| `eso-anticoagulant-reversal-ich-2019.json` | [31903428](https://doi.org/10.1177/2396987319849763) | 11 | No indexed correction |
| `eso-aphasia-rehab-2025.json` | [40401776](https://doi.org/10.1177/23969873241311025) | 12 | No indexed correction |
| `eso-artery-dissection-2021.json` | [34746432](https://doi.org/10.1177/23969873211046475) | 17 | not-applicable |
| `eso-bao-2024.json` | [38752743](https://doi.org/10.1177/23969873241257223) | 18 | No indexed correction |
| `eso-bp-2025.json` | [42095756](https://doi.org/10.1093/esj/aakag004) | 23 | No indexed correction; source-not-machine-readable |
| `eso-carotid-stenosis-2021.json` | [34414302](https://doi.org/10.1177/23969873211012121) | 16 | No indexed correction |
| `eso-covert-csvd-2021.json` | [34414301](https://doi.org/10.1177/23969873211012132) | 15 | No indexed correction |
| `eso-cvt-2017.json` | [31008314](https://doi.org/10.1177/2396987317719364) | 24 | No indexed correction |
| `eso-dysphagia-2021.json` | [34746431](https://doi.org/10.1177/23969873211039721) | 23 | No indexed correction |
| `eso-ean-poststroke-cognition-2021.json` | [34746430](https://doi.org/10.1177/23969873211042192) | 1 | not-applicable; source-not-machine-readable |
| `eso-esmint-mechanical-thrombectomy-2019.json` | [31165090](https://doi.org/10.1177/2396987319832140) | 42 | No indexed correction |
| `eso-esmint-thrombectomy-2022.json` | [35300256](https://doi.org/10.1177/23969873221076968) | 4 | not-applicable |
| `eso-glycaemia-2018.json` | [31008333](https://doi.org/10.1177/2396987317742065) | 7 | No indexed correction |
| `eso-ich-2025.json` | [40401775](https://doi.org/10.1177/23969873251340815) | 61 | No indexed correction |
| `eso-intracranial-atherosclerosis-2022.json` | [36082254](https://doi.org/10.1177/23969873221099715) | 22 | No indexed correction |
| `eso-ivt-2021.json` | [33817340](https://doi.org/10.1177/2396987321989865) | 58 | No indexed correction |
| `eso-lacunar-2024.json` | [38380638](https://doi.org/10.1177/23969873231219416) | 34 | No indexed correction |
| `eso-mobile-stroke-units-2022.json` | [35300251](https://doi.org/10.1177/23969873221079413) | 3 | No indexed correction |
| `eso-motor-rehab-2025.json` | [40401760](https://doi.org/10.1177/23969873251338142) | 7 | No indexed correction |
| `eso-moyamoya-2023.json` | [37021176](https://doi.org/10.1177/23969873221144089) | 29 | No indexed correction |
| `eso-pacns-2023.json` | [37903069](https://doi.org/10.1177/23969873231190431) | 32 | No indexed correction |
| `eso-pfo-2024.json` | [38752755](https://doi.org/10.1177/23969873241247978) | 22 | No indexed correction |
| `eso-poststroke-seizures-2017.json` | [31008306](https://doi.org/10.1177/2396987317705536) | 7 | No indexed correction |
| `eso-sah-2026.json` | [42095754](https://doi.org/10.1093/esj/aakag043) | 35 | No indexed correction; source-not-machine-readable |
| `eso-sap-2026.json` | [42095755](https://doi.org/10.1093/esj/aakag044) | 35 | No indexed correction; source-not-machine-readable |
| `eso-secondary-prevention-2022.json` | [36082250](https://doi.org/10.1177/23969873221100032) | 13 | No indexed correction |
| `eso-short-term-dapt-2021.json` | [34414300](https://doi.org/10.1177/23969873211000877) | 8 | No indexed correction |
| `eso-space-occupying-infarction-2021.json` | [34414308](https://doi.org/10.1177/23969873211014112) | 18 | No indexed correction |
| `eso-stroke-in-women-2022.json` | [35647308](https://doi.org/10.1177/23969873221078696) | 10 | not-applicable |
| `eso-subclinical-af-screening-2022.json` | [36082257](https://doi.org/10.1177/23969873221099478) | 12 | not-applicable |
| `eso-temperature-2015.json` | [26148223](https://doi.org/10.1111/ijs.12579) | 3 | No indexed correction |
| `eso-tenecteplase-2023.json` | [37021186](https://doi.org/10.1177/23969873221150022) | 9 | No indexed correction |
| `eso-tia-2021.json` | [34414299](https://doi.org/10.1177/2396987321992905) | 9 | No indexed correction |
| `eso-unruptured-aneurysms-2022.json` | [36082246](https://doi.org/10.1177/23969873221099736) | 28 | No indexed correction |
| `eso-visual-2025.json` | [40401755](https://doi.org/10.1177/23969873251314693) | 13 | No indexed correction |
| `eso-vte-prophylaxis-2016.json` | [31008263](https://doi.org/10.1177/2396987316628384) | 4 | No indexed correction |
| `ich-2022.json` | [35579034](https://www.ahajournals.org/doi/10.1161/STR.0000000000000407) | 124 | No indexed correction |
| `maternal-stroke-2026.json` | [41603019](https://www.ahajournals.org/doi/10.1161/STR.0000000000000514) | 57 | No indexed correction |
| `ncs-ich-seizure-prophylaxis-2024.json` | [39707127](https://link.springer.com/article/10.1007/s12028-024-02183-z) | 10 | No indexed correction |
| `ncs-neuroprognostication-ais-2026.json` | [41942818](https://link.springer.com/article/10.1007/s12028-026-02486-3) | 23 | No indexed correction |
| `ncs-neuroprognostication-ich-2023.json` | [37923968](https://link.springer.com/article/10.1007/s12028-023-01854-7) | 13 | No indexed correction |
| `ncs-sah-seizure-prophylaxis-2026.json` | [42552475](https://link.springer.com/article/10.1007/s12028-026-02614-z) | 11 | No indexed correction |
| `ncs-sccm-antithrombotic-reversal-2016.json` | [26714677](https://link.springer.com/article/10.1007/s12028-015-0222-x) | 69 | No indexed correction |
| `perioperative-stroke-2021.json` | [33827230](https://www.ahajournals.org/doi/10.1161/CIR.0000000000000968) | 28 | No indexed correction |
| `poststroke-cognitive-2023.json` | [37125534](https://www.ahajournals.org/doi/10.1161/STR.0000000000000430) | 32 | No indexed correction |
| `poststroke-primary-care-2021.json` | [34261351](https://www.ahajournals.org/doi/10.1161/STR.0000000000000382) | 20 | No indexed correction |
| `poststroke-spasticity-2026.json` | [41608795](https://www.ahajournals.org/doi/10.1161/STR.0000000000000515) | 38 | unresolved |
| `premorbid-disability-2022.json` | [35343235](https://www.ahajournals.org/doi/10.1161/STR.0000000000000406) | 25 | No indexed correction |
| `primary-prevention-2024.json` | [39429201](https://www.ahajournals.org/doi/10.1161/STR.0000000000000475) | 80 | unresolved |
| `sah-2023.json` | [37212182](https://www.ahajournals.org/doi/10.1161/STR.0000000000000436) | 81 | not-applicable |
| `secondary-prevention-2021.json` | [34024117](https://www.ahajournals.org/doi/10.1161/STR.0000000000000375) | 162 | not-applicable |
| `svin-dsa-collaterals-2025.json` | [41816515](https://doi.org/10.1161/SVIN.125.002091) | 15 | No indexed correction |
| `svin-lab-consensus-2025.json` | [41573319](https://doi.org/10.1161/SVIN.124.001478) | 40 | No indexed correction |
| `svin-large-core-2025.json` | [41573174](https://www.ahajournals.org/doi/10.1161/SVIN.124.001581) | 4 | No indexed correction |
| `svin-mevo-dvo-evt-2026.json` | [42404835](https://doi.org/10.1161/SVIN.125.002314) | 9 | No indexed correction |
| `systemic-complications-2024.json` | [39633600](https://www.ahajournals.org/doi/10.1161/STR.0000000000000477) | 34 | No indexed correction |
| `tia-ed-2023.json` | [36655570](https://www.ahajournals.org/doi/10.1161/STR.0000000000000418) | 81 | No indexed correction |

### Data contract and validation

`publicationUpdates[]` holds `type`, `pmid`, `doi`, `publisherUrl`, `status`, `note`, `checkedAt` and `affectedRecommendationIds`. The check date describes this notice-applicability check only. Allowed statuses are `applied`, `not-applicable`, `partially-applied`, and `unresolved`. Legacy AIS `correctedBy` remains compatible and has a synchronized note. Modified AIS entries have `correctionSourceUrl`; original source and PDF links remain intact. The index exposes `sourceOnly`, `partialExtraction`, `recommendationCount`, and `hasUnresolvedUpdates` so the UI can accurately describe source-only records, partial coverage, and unknown correction impact.

Validation: `node node_modules/vitest/vitest.mjs run tests/guideline-publication-integrity.test.js tests/guideline-library-search.test.js` passed 23 tests in two files. The new tests protect corrected reperfusion and dysphagia constraints, stable correction references, superseded-row exclusion, source-only counts, all-document schema and identifiers, and all 28 publication-update records. Integrated build, evidence refresh, AutoMedBench, QA, and Protocols snapshot verification belong to the coordinating agent; this subtask did not run generation or commit/push.

S5: changed 22 guideline datasets, the guideline index, this report, and one focused test file. Source metadata checks cover all 109 documents; substantive correction checks cover 22 of 28 notices; full clinical review of all 3,547 evidence-bearing entries remains outside the claims of this report. Six specific unreadable notices are visible in the table and data. No PHI, credentials, or restricted institutional information were introduced.
