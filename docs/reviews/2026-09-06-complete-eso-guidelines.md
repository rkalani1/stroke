# Complete ESO guideline recommendation review

## S1 Plan

Scope: independently account for every formal recommendation, explicit no-recommendation statement, and good-practice/expert-consensus statement in seven source guidelines: ESO/EAN cognition 2021; ESO BP 2025 update, aSAH 2026, stroke-associated pneumonia 2026, aphasia rehabilitation 2025, motor rehabilitation 2025, and visual impairment 2025. All source questions and recommendation tables will have an inventory before completeness metadata is assigned. Clinical prose will be original factual summaries preserving populations, thresholds, exceptions and source grading. No Protocols, app code, build, seed, version or publication action is in scope.

## S2 Setup

Canonical files: corresponding `src/guidelines/*.json`; source DOI/PMID metadata retained. Full primary articles, corrected supplements and rendered recommendation tables are checked together. Scratch source material: `work/complete-guidelines/eso` in the parent workspace. The cognition guideline's 2022 correction restores omitted recommendation boxes and must be applied, not treated as irrelevant.

## S3 Validate before editing

Baseline: 23 tests passed across `guideline-publication-integrity` and `guideline-library-search`. Source records currently contain 1 cognition placeholder, 23 BP entries, 35 aSAH entries, 35 pneumonia entries, 12 aphasia entries, 7 motor entries and 13 visual entries. Counts of entries alone do not establish completeness because consensus may be combined with formal recommendations and some placeholders lack source grades. Primary full text and visual recommendation-table checks are required before replacing those states. Source unavailability or an unresolved statement/grade is reported explicitly and retrieval continues; completeness is never inferred from the abstract.

## Source inventory and implementation

All seven assigned guidelines are complete for formal recommendation/no-recommendation statements and explicitly designated good-practice/expert-consensus statements. The source's own PICO structure controls the inventory. Recommendations, explicit uncertainty statements and consensus are distinguishable in both data and source locators; a no-recommendation statement is not relabelled as a recommendation against treatment.

| Guideline | Source questions | Formal, including no recommendation | Consensus | Implemented total | Source checked |
| --- | ---: | ---: | ---: | ---: | --- |
| ESO/EAN cognition 2021, corrected 2022 | 18 | 22 | 18 boxes | 40 | Corrected supplement 2, all 19 pages |
| ESO BP 2025 update, published 2026 | 8 | 12 | 11 | 23 | Table 11, three panels and PICO structure |
| ESO/EANS/ESMINT aneurysmal SAH 2026 | 15 | 17 | 37 | 54 | All individual PICO boxes; incomplete online Table 3 cross-check |
| ESO stroke-associated pneumonia 2026 | 15 | 19 | 17 boxes | 36 | Table 8, seven panels and individual PICO boxes |
| ESO aphasia rehabilitation 2025 | 10 | 10 | 2 boxes | 12 | Table 4 and additional PICO 6 consensus paragraph |
| ESO motor rehabilitation 2025 | 6 | 7 | 2 boxes | 9 | Table 4, full PMC article |
| ESO visual impairment 2025 | 13 | 13 | 12 numbered statements | 25 | Table 14, all PICO rows |
| **Total** | **85** | **100** | **99** | **199** | |

The before count was 126 records, including one cognition placeholder and combined formal/consensus records. The resulting 199 records are not simply more rows: source strength and certainty are restored, missing uncertainty statements are represented, and consensus no longer inherits a neighbouring evidence grade.

Counting unit: each independently graded formal statement is one recommendation entry, including an explicit no-recommendation result. Separately numbered consensus statements are separate records. An unnumbered consensus box remains one record containing all its clinical and research qualifications. This prevents arbitrary sentence splitting from inflating the apparent number of recommendations. Per-PICO counts below are **formal/consensus** and match the stored coverage inventory.

| Guideline | Per-PICO reconciliation |
| --- | --- |
| Cognition | 1:1/1; 2:3/1; 3:1/1; 4:1/1; 5:1/1; 6:1/1; 7:1/1; 8:1/1; 9:1/1; 10:1/1; 11:1/1; 12:1/1; 13:1/1; 14:2/1; 15:1/1; 16:1/1; 17:1/1; 18:2/1 |
| BP | 1:1/1; 2:1/1; 3:2/0; 4:4/1; 5:1/1; 6:1/1; 7:1/4; 8:1/2 |
| SAH | 1a:1/0; 1b:1/2; 2:1/1; 3a:1/5; 3b:1/3; 4:3/0; 5a:1/1; 5b:1/3; 6a:1/3; 6b:1/5; 7:1/6; 8:1/1; 9a:1/1; 9b:1/1; 10:1/5 |
| Pneumonia | 1:1/1; 2:1/1; 3:1/1; 4:1/1; 5:1/1; 6:2/0; 7:4/4; 8:1/1; 9:1/1; 10:1/1; 11:1/1; 12:1/1; 13:1/1; 14:1/1; 15:1/1 |
| Aphasia | 1:1/0; 2:1/0; 3:1/0; 4a:1/0; 4b:1/0; 5a:1/0; 5b:1/1; 6(a–f):1/1; 7a:1/0; 7b:1/0 |
| Motor | 1:1/0; 2:1/1; 3:2/0; 4:1/1; 5:1/0; 6:1/0 |
| Visual | 1:1/0; 2:1/2; 3:1/2; 4:1/2; 5:1/2; 6:1/2; 7:1/0; 8:1/0; 9:1/0; 10:1/2; 11:1/0; 12:1/0; 13:1/0 |

### Primary sources and retrieval

All sources were accessed on 2026-09-06. Publisher DOI and PubMed identifiers were retained. Full XML/HTML and the publisher-supplied recommendation images were used, rather than extrapolating from abstracts. The Europe PMC `supplementaryFiles` endpoint provided the original images as well as actual supplements; it resolved the earlier image-only extraction limitation without OCR.

- [ESO/EAN post-stroke cognition guideline](https://doi.org/10.1177/23969873211042192), PMID 34746430, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC8564156/), with [2022 correction](https://doi.org/10.1177/23969873221076951), PMID 35300261. The restored boxes are in [corrected supplement 2](https://journals.sagepub.com/doi/suppl/10.1177/23969873211042192/suppl_file/sj-pdf-2-eso-10.1177_23969873211042192.pdf). The complete original supplement was obtained from [Europe PMC supplementary assets](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8564156/supplementaryFiles). CC BY 4.0.
- [ESO blood-pressure guideline update](https://doi.org/10.1093/esj/aakag004), PMID 42095756, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC13151662/). Table 11: `aakag004fx26-1.jpg` through `aakag004fx26-3.jpg`; all eight PICOs. CC BY 4.0.
- [ESO/EANS/ESMINT aneurysmal SAH guideline](https://doi.org/10.1093/esj/aakag043), PMID 42095754, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC13151661/). Individual recommendation/consensus boxes `aakag043fx3.jpg` through `aakag043fx32.jpg`; Table 3 `aakag043fx33-1.jpg` through `-5.jpg`. CC BY-NC 4.0.
- [ESO stroke-associated pneumonia guideline](https://doi.org/10.1093/esj/aakag044), PMID 42095755, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC13151663/). Table 8 `aakag044fx39-1.jpg` through `-7.jpg`; individual boxes `aakag044fx4.jpg` through `fx38.jpg`. CC BY-NC 4.0.
- [ESO aphasia rehabilitation guideline](https://doi.org/10.1177/23969873241311025), PMID 40401776, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12098336/). Table 4 `table4-23969873241311025`, supplemented by the full PICO 6(a–f) consensus and voting paragraph. CC BY-NC 4.0.
- [ESO motor rehabilitation guideline](https://doi.org/10.1177/23969873251338142), PMID 40401760, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12098312/). Full primary HTML Table 4 was accessible even though Europe PMC full-text XML returned unavailable. Original concise factual summaries are used; the article is not copied into the repository.
- [ESO visual impairment guideline](https://doi.org/10.1177/23969873251314693), PMID 40401755, [full article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12098360/). Table 14 `table27-23969873251314693`; diagnostic risk-of-bias grading is preserved as QUADAS-2. CC BY 4.0.

Scratch source archive: `../complete-guidelines/eso` relative to the repository. It contains source XML/HTML, original asset ZIPs, the corrected cognition PDF, rendered cognition pages, rendered rehab source-table rows and the data-authoring script. This source archive is outside git; no wholesale article text or publisher figures were added to the app.

### Source defects and grading distinctions resolved

- **Cognition correction applied:** the original published article omitted recommendation boxes. The corrected supplement restores all 18 PICOs. Every restored record links to the correction, and its publication-update status is now `applied`. All 19 PDF pages were rendered and visually read alongside extraction. The PICO 18 white-matter recommendation's printed quality label is Moderate, despite an inconsistent single-circle symbol; the explicit Moderate label is retained.
- **BP source grades restored:** the former 23 ungraded paraphrases cover the full statement count, but now retain exact strength and certainty. PICO 4's pressure-ceiling statement is printed as weak against intervention even though its operative advice is to keep pressure below 180/105; the source grade and operational text are both retained with an explanation. Source distinctions such as <220/110 versus >220/120 and mTICI 3 are not silently normalised to other guidelines.
- **SAH table truncation overcome:** the online Table 3 ends within PICO 7 after consensus item 3. The individual PICO boxes supply the remaining hydrocephalus, centre/operator volume and long-term follow-up statements. The source has 15 questions, not 15 separately graded statements: PICO 4 contains three, giving 17 formal entries. Its stated 37 consensus statements are all accounted for. Thus neither the abstract nor the truncated synopsis was treated as a sufficient inventory.
- **Pneumonia outcome grading separated:** Table 8 repeats its first panel; it is not counted twice. PICO 6 has a very-low-certainty pneumonia-incidence statement and a moderate-certainty clinical-outcome statement, both weak against preventive antibiotics. PICO 7's four medication categories and their separate consensus guidance are retained. Recommendations consistently retain the acute, non-ventilated stroke population.
- **Aphasia full consensus retained:** the synoptic table abbreviates the tDCS discussion. The full-text restriction to high-quality trials, validated outcome assessment, participant descriptions, adverse-event reporting and differing 10/12 versus 12/12 agreement are included.
- **Motor uncertainty made visible:** previously combined PICO 2 and PICO 4 records now have their own no-recommendation rows alongside consensus. The chronic-stroke and stable-cardiovascular-status qualifiers, and different walking-endurance versus speed grades, remain explicit.
- **Visual grading preserved:** QUADAS-2 medium/high risk of bias is not misrepresented as GRADE certainty. Six uncertain PICOs now have separate formal no-recommendation rows and their 12 individually numbered consensus statements, all ungraded. The specialist-care and eye-occlusion cautions remain intact.

### Newer evidence versus historical source recommendations

Completeness describes faithful representation of these named guideline publications. It does not turn a historical recommendation into a newly issued recommendation. The visual guideline's 2025 PICO 9 suggestion of CRAO thrombolysis retains its source wording, weak strength and very-low-certainty grade, with a separate dated `currentEvidenceNote` and primary links:

- [THEIA, 2025](https://pubmed.ncbi.nlm.nih.gov/41109232/), DOI 10.1016/S1474-4422(25)00308-4: no demonstrated significant visual benefit from alteplase; underpowered.
- [TenCRAOS, 2026](https://pubmed.ncbi.nlm.nih.gov/41604638/), DOI 10.1056/NEJMoa2508515: no significant visual-recovery benefit from tenecteplase versus aspirin, with serious safety concerns including fatal intracranial haemorrhage.

These primary reports were verified in the preceding 2026-09-06 evidence/calculator review. The new note explicitly prevents the preserved 2025 suggestion being read as current endorsement of routine thrombolysis.

## S5 Validation and residual limits

`npx vitest run tests/complete-eso-guidelines.test.js`: **18 tests passed**. Tests independently encode every source PICO's expected formal/consensus counts, unique source locators, correction application, absence of stale placeholder metadata, and key clinical restrictions and grading distinctions. They check the new CRAO evidence note independently from the historical grade. `git diff --check` passed for the seven source files, focused test and this report.

The source images for BP, SAH and pneumonia were read visually. The corrected cognition supplement was read on every rendered page. Aphasia, motor and visual tables were reconciled row by row from full primary XML/HTML, with rendered table checks of the most easily confused grading, consensus and eligibility rows. No formal statement or designated consensus box remains unresolved within these seven publications. Source grading quirks and the truncated/duplicated synopsis panels are documented above rather than concealed.

Authored changes are limited to the seven guideline JSON files, this report and the focused test. No Protocols code, app/index code, generated content, version, build, commit or publication action was performed by this subtask. Shared projection/UI/schema and whole-app regression testing remain with the parent integration task. This is comprehensive coverage of the formal source guidance, not independent re-adjudication of every cited trial or all possible later research in every guideline topic. No patient data, credentials or private institutional material were used.
