# Education, calculator, and reference review — 2026-09-06

## S1 Plan

Review `src/education.jsx`, the four simulators, both calculator modules, and education/calculator/reference metadata. Correct source-supported contradictions and unsafe certainty in educational outputs. Protocols, its operational calculator behavior, and generated bundles are excluded. Stop a particular change if the primary source cannot support it; document remaining gaps rather than changing review dates indiscriminately.

Initial targets: remove current US andexanet dosing from educational cards (FDA safety communication); make the CRAO helper reflect TenCRAOS and THEIA rather than recommend lysis; separate clinical AF from device-detected AHRE; enforce Boston v2.0 clinical and imaging exclusions; correct prevention BP/lipid evidence and input handling. No patient or private institutional information is needed.

## S2 Setup

The reviewed baseline is `636d1d2` / v6.24.0. Education card bodies live in `src/education.jsx`; `/content/education` supplies metadata. Both calculator modules are shared code. `calculateDOACStart`, `calculateEnoxaparinDose`, and andexanet's institutional helper are Protocol-coupled and remain unchanged. The extended prevention/Boston helpers are exposed under `window.strokeP0`, not called by Protocol rendering. The CRAO helper is currently an exported/tested helper without an app UI caller.

Read `CONTRIBUTING-content.md` and `docs/ai-agent-evals/automedbench-lite.md`. The work affects clinical wording, calculator logic, and metadata, and therefore needs source fidelity checks, relevant unit tests, content validation, and the Protocol snapshot. Root integration owns full QA, evidence refresh, generated content, and production build.

## S3 Validate before editing

Baseline scoped tests passed: 181 tests across `calculators-extended`, `stress-calculators-m3`, `qa-probes`, and `education-reference-drift`. Existing tests encode the unsafe CRAO eligibility behavior; they need to distinguish research-screen features from a treatment recommendation. Primary sources below were accessed on 2026-09-06. No PHI, credentials, or restricted data was used.

## Primary sources

- FDA, 2025-12-18, [Update on the Safety of Andexxa](https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/update-safety-andexxa): US commercial sales/manufacturing ceased after 2025-12-22; serious risks outweigh benefits.
- Ryan et al., [TenCRAOS, NEJM 2026](https://www.nejm.org/doi/full/10.1056/NEJMoa2508515), PMID 41604638: no significant visual recovery benefit versus aspirin, with serious safety concerns including fatal ICH.
- Préterre et al., [THEIA, Lancet Neurology 2025](https://pubmed.ncbi.nlm.nih.gov/41109232/): neutral, underpowered alteplase trial.
- [2023 ACC/AHA/ACCP/HRS AF guideline](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193), §§6.2, 6.4–6.4.1: risk-based anticoagulation in diagnosed AF differs from AHRE duration/risk thresholds; prolonged monitoring after cryptogenic stroke.
- Kamel et al., [ARCADIA, JAMA 2024](https://jamanetwork.com/journals/jama/fullarticle/2814933), PMID 38324415: three prespecified biomarkers; left atrial volume index was not an entry criterion; no benefit of apixaban over aspirin without AF.
- Charidimou et al., [Boston criteria v2.0, Table 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC9389452/), PMID 35841910: age at least 50, qualifying presentation, absent deep hemorrhagic lesions and other causes, and defined MRI markers.
- [2025 AHA/ACC hypertension guideline](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001356), §5.3.9.3: outpatient secondary-prevention BP goal below 130/80 in neurologically stable patients.
- [2026 ACC/AHA dyslipidemia guideline](https://professional.heart.org/en/guidelines-statements/2026-accahaaacvprabcacpmadaagsaphaaspcnlapcna-guideline-on-the-management-ofcir0000000000001423), DOI 10.1161/CIR.0000000000001423: LDL goals below 55 for very-high-risk ASCVD and below 70 for ASCVD not at very high risk.
- Giugliano et al., [FOURIER stroke analysis, Stroke 2020](https://pubmed.ncbi.nlm.nih.gov/32312223/): no statistically significant hemorrhagic-stroke difference in the studied population; not proof of safety in prior ICH.
- Nissen et al., [CLEAR Outcomes, NEJM 2023](https://www.nejm.org/doi/full/10.1056/NEJMoa2215024): reduced composite cardiovascular outcomes; stroke alone was not significantly reduced.

## Additional primary sources used

- [2026 AHA/ASA AIS guideline](https://www.ahajournals.org/doi/10.1161/STR.0000000000000513), BP section and §4.7.2: post-EVT BP ceiling, harm from active intensive lowering below 140 after successful reperfusion, vessel-specific distal-occlusion recommendation, and current large-core context. The guideline-review agent independently checked the BP recommendation text.
- [2021 AHA/ASA secondary prevention guideline](https://www.ahajournals.org/doi/10.1161/STR.0000000000000375), §5.1.1: clopidogrel plus aspirin for up to 90 days in recent symptomatic severe ICAD is Class 2a, not an indication attached to all stenosis ≥50%; cilostazol dual therapy is a selected Class 2b option.
- [DEFUSE-3 primary report](https://www.nejm.org/doi/10.1056/NEJMoa1713973) and [protocol](https://pmc.ncbi.nlm.nih.gov/articles/PMC5916787/): core <70 mL, age 18–90, total hypoperfused volume used for mismatch calculations.
- [DAWN](https://www.nejm.org/doi/10.1056/NEJMoa1706442): adult age/severity/core groups and 6–24-hour trial context.
- [INSPIRES](https://www.nejm.org/doi/10.1056/NEJMoa2309137): atherosclerotic population and timing qualifications, with aspirin for 21 days and clopidogrel through day 90.
- [BASIS](https://jamanetwork.com/journals/jama/fullarticle/2823274), DOI 10.1001/jama.2024.12829: published randomized evidence for selected symptomatic 70–99% ICAD; not merely observational angioplasty evidence.
- [ENRICH](https://www.nejm.org/doi/10.1056/NEJMoa2308440): age, volume, NIHSS, GCS, premorbid function and 24-hour treatment criteria; benefit attributable to lobar hemorrhage.
- [SWITCH primary report](https://www.sciencedirect.com/science/article/pii/S0140673624007025) and [published protocol](https://pmc.ncbi.nlm.nih.gov/articles/PMC11418560/): mRS 5–6 in 44% vs 58%, aRR 0.77 (95% CI 0.59–1.01), p=0.057; volume 30–100 mL, GCS 8–13, NIHSS 10–30, stable clot, premorbid mRS ≤1, randomization <66 hours.
- [TRACE-III](https://www.nejm.org/doi/10.1056/NEJMoa2310392): perfusion-selected anterior LVO without EVT access; both mismatch components and full clinical screening are necessary.
- [GRACE-3](https://www.saem.org/publications/grace/grace-3): appropriate clinical context and examiner training for HINTS; partial findings must not classify a patient as safely peripheral.
- [ORANGE secondary analysis](https://jamanetwork.com/journals/jamaneurology/fullarticle/2827730), PMID 39652324: pupillometry does not diagnose or exclude intracranial hypertension and should not be converted into a herniation diagnosis or treatment trigger.
- [Savaysa current US prescribing information](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=e77d3400-56ad-11e3-949a-0800200c9a66), §§2.1–2.2: distinguish NVAF renal dose reduction from the VTE weight criterion.
- [ELAN protocol](https://pmc.ncbi.nlm.nih.gov/articles/PMC9720853/): PH1/PH2 exclusions do not support a universal PH2 restart day.
- [2023 brain-death consensus guideline](https://doi.org/10.1212/WNL.0000000000207740), inspected via the [primary-paper mirror](https://www.organdonationalliance.org/wp-content/uploads/2023/11/2023-Pediatric-and-Adult-BD-Guidelines-AAN.pdf), recommendations 8–13, 17–27, 36; [2024 correction](https://www.neurology.org/doi/10.1212/WNL.0000000000208108) concerns ECMO ABG sampling. The card points to the full ECMO protocol rather than reproducing an incomplete sweep-gas recipe.
- [ICH Score original report](https://pubmed.ncbi.nlm.nih.gov/11283388/): historical cohort prognostication, not a certain individual outcome or default 100% response for an invalid/unsupported score.
- [ESO 2024 PFO guideline](https://journals.sagepub.com/doi/10.1177/23969873241247978): causal-likelihood category is part of selected-patient assessment, not an automatic US recommendation class. The guideline-review agent checked the recommendation wording; unverified category-specific NNTs were removed.

## S4 Execute

Source changes are in `src/calculators-extended.js`, `src/education.jsx`, `src/simulators/HintsSimulator.jsx`, `src/simulators/PupillometrySimulator.jsx`, and the hypoperfused-volume input label in `src/components.jsx`. The shared Protocol calculator module `src/calculators.js` was not changed.

The calculator audit corrected incomplete-input defaults, invalid boundaries, and overconfident interpretation in DAWN, DEFUSE-3, large-core EVT, extended-window lysis, acute DAPT, post-EVT BP, chronic BP/lipids, ICAD, ENRICH, SWITCH, PASCAL, Boston CAA, ARCADIA, AF monitoring and CRAO. Missing required criteria now produce an incomplete result instead of being presumed satisfied. Modeled trial matches are explicitly partial screens, with remaining exclusions requiring clinical review. Historical CRAO screening no longer produces a thrombolysis regimen or actionable eligibility. Unsupported guideline classes, projected upgrades, and several non-source-supported effect summaries were removed or corrected.

The education changes remove current US andexanet regimens, distinguish observational ANNEXA-4 from randomized ANNEXA-I, and qualify ICH BP targets. AF teaching now uses the US NVAF edoxaban dose criteria and has no fixed PH2 restart date. The brain-death card corrects pediatric BP and exam intervals, observation and drug-clearance requirements, apnea preparation and chronic-hypercarbia handling, stopping rules and time-of-death documentation. Its historical raster was removed because it used the obsolete PaCO2 OR criterion. ICH prognosis no longer maps score 6 or an invalid score automatically to 100% mortality. HINTS starts with unknown findings, and pupillometry describes measurement patterns without diagnosing herniation or prescribing osmotherapy from NPi alone.

Teaching cards now offer a 44-pixel `Reading view` control alongside the original fitted overview. Reading view uses 15-pixel body/table text, reflows columns and checklists, preserves table scrolling, and removes fixed-height clipping. `BedsidePocketCardsStyles` is exported so the integration agent can generate PDFs from canonical card components.

## Coverage and limits

All education modules, both calculator files, the four simulator files, and reference metadata were inventoried and searched for known contradictory claims and unsafe defaults. This was a targeted clinical review of high-risk advisories and named cards, not independent certification of every historical formula, threshold, image, institutional instruction, or cited paper in the repository. The HINTS and pupillometry interpretation logic received source-focused review; the EVD and neuro-exam simulators were not independently revalidated against every original source. Existing risk-score tests provide computational regression coverage, not clinical validation.

Protocol-rendered content and Protocol-coupled DOAC timing/enoxaparin/andexanet routines remain excluded as requested. Changing a reference or source citation elsewhere does not establish that the excluded Protocols section is current. The metadata directories are seeded from the authored source; the integration agent owns seed/bundle generation. Review dates were not advanced indiscriminately for untouched modules.

The initial reference-file integrity pass parsed 27 PDFs (317 pages at baseline), with no fatal unreadable files; several old PDFs needed recoverable cross-reference repair. This is file integrity, not a 317-page independent clinical audit. Four quickrefs received focused extracted-text comparison, revealing stale copied-generator content. The integration agent subsequently replaced the duplicated generator with canonical component rendering and regenerated all nine quickrefs.

## S5 Submit and validation

- Final scoped unit run: **403 tests passed in 9 files** (`calculators-extended`, `stress-calculators-m3`, `qa-probes`, `education-reference-drift`, `hints-simulator`, `pupillometry-simulator`, `clinical-safety-september-review`, `stroke-prognosis-calculator`, `final-curriculum-verification`). The new regression suite covers clinically meaningful missing inputs, boundaries, exclusion gates and source-result distinctions.
- `npm run build:js`: passed for preview; final combined generation/build is owned by the integration agent.
- `npm run validate:automedbench-lite`: passed.
- Headless Edge browser checks: DAPT landscape, brain death and reversal cards at widths **390, 768 and 1440** had no page-width overflow or clipped reading-view content. Body/table text measured 15 px. A visual inspection led to an additional checklist-column reflow correction. These checks do not claim exhaustive coverage of every device or image.
- Local Protocol snapshot command could not launch the absent pinned Chromium executable. The integration agent already verified the baseline with the system browser and owns final snapshot comparison; no snapshot was rebaselined by this subtask.
- Independent regenerated-PDF readback: all **9 PDFs / 18 pages** parsed. Brain-death pediatric BP/12-hour interval, progressive desaturation and PaCO2-plus-pH documentation were present; old newborn-24-hour text and old raster were absent. AF edoxaban wording correctly distinguished NVAF from weight-based VTE reduction and the fixed PH2 day was absent. DAPT retained the non-universal-genotyping caveat. Prognosis showed 97% at score 4, the corrected PLAN PMID 23147454 and no certain score-6 prediction. The integration agent owns full-page visual PDF QA.
- Final visual follow-up removed the AF timeline's residual PH2 days-12–14 band and connector, replacing them with an independent annotation above the axis: “PH2: individualized review / No established start day.” The overlapping lower annotation was removed. A new visual-structure regression passed with all **174 curriculum tests**; the integration agent will regenerate the AF PDF from this final source.
- Final mobile accessibility follow-up named the prognosis glucose input with its active unit and exposed the shared binary controls as named switches with checked state. No clinical text or calculation changed. Two regression checks were added; **185 tests passed** across the prognosis and curriculum files after this final source edit. No build was run during this follow-up.

No patient data, credentials or private clinical material were used. No commit, push or deployment was performed by this subtask. Remaining uncertainty is explicit: partial screens are not complete treatment eligibility, educational tiers are not validated diagnostic rules, and passing tests does not clinically certify untouched content.
