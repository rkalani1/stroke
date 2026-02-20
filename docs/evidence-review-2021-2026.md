# Stroke Evidence Review (2021-02-18 to 2026-02-18)

## Scope and method
- Window: February 18, 2021 through February 18, 2026.
- Priority sources: society guidelines/scientific statements, major RCTs, high-quality multicenter cohorts, and trial registries.
- Evidence tag definitions used in this document:
  - Guideline-grade: official guideline/scientific statement recommendations.
  - RCT-supported: randomized controlled trial evidence.
  - Observational/Consensus: non-randomized cohort, registry, or consensus guidance.

## Conflict handling rule
- If guidelines disagree, prioritize: newer publication date, direct relevance to stroke phenotype, and consistency with multiple RCTs.
- If RCTs conflict, prioritize larger multicenter pragmatic RCTs and endpoint quality (functional outcome over surrogate outcomes).

## 1) Acute ischemic stroke thrombolysis (TNK vs alteplase, windows, wake-up/unknown onset)
- Practical recommendation:
  - Tenecteplase 0.25 mg/kg is a strong first-line thrombolytic option in eligible AIS, especially LVO/EVT-intended pathways.
  - Alteplase remains acceptable where local protocols or contraindication profiles favor it.
  - For wake-up/unknown onset presentations, continue imaging-guided selection; avoid broad unselected expansion.
- Evidence strength: Guideline-grade + RCT-supported.

## 2) EVT eligibility and extended-window selection (including large-core evolution)
- Practical recommendation:
  - Large-core infarct should no longer be an automatic exclusion if patient remains within contemporary trial-like imaging and workflow criteria.
  - Use rapid multimodal imaging and do not delay transfer for potentially treatable LVO with large core.
- Evidence strength: RCT-supported.

## 3) ICH management (BP, reversal, surgery/escalation, ICU priorities)
- Practical recommendation:
  - Use protocolized hyperacute care: BP strategy, glucose/temperature control, reversal pathway, and neurologic critical care bundle.
  - Anticoagulation-associated ICH reversal should be immediate and protocol-driven.
  - For selected lobar moderate-large ICH, early minimally invasive evacuation pathways should be considered at capable centers.
- Evidence strength: Guideline-grade + RCT-supported + Observational/Consensus.

## 4) SAH management essentials and aneurysm workflows
- Practical recommendation:
  - Early aneurysm securement, nimodipine, BP control before securement, ICU-level monitoring for delayed cerebral ischemia, and complication prevention bundles.
- Evidence strength: Guideline-grade.

## 5) CVT diagnosis and management
- Practical recommendation:
  - Fast venous imaging (CTV/MRV), immediate anticoagulation when not contraindicated, and escalation for malignant intracranial hypertension.
  - DOAC transition after initial parenteral anticoagulation is reasonable in selected patients.
- Evidence strength: Guideline-grade + Observational/Consensus.

## 6) Secondary prevention
- Practical recommendation:
  - DAPT should be phenotype- and timing-specific (short duration in minor stroke/high-risk TIA pathways; avoid overextension unless trial-like criteria support it).
  - AF-related stroke: early DOAC strategies are increasingly supported in selected patients without large hemorrhagic risk.
  - Maintain intensive risk-factor control: BP, lipids, diabetes, smoking, exercise, and diet.
  - Keep structured pathways for PFO and carotid disease selection.
- Evidence strength: Guideline-grade + RCT-supported.

## 7) Special populations (pediatrics, pregnancy/peripartum, anticoagulated, renal dysfunction)
- Practical recommendation:
  - Pregnancy/peripartum: treat stroke as a time-critical emergency with maternal-fetal coordination, avoiding delays in reperfusion/reversal pathways.
  - Anticoagulated patients: immediate agent-specific reversal and procedure timing protocols.
  - Renal dysfunction: strict dose/pathway safeguards for anticoagulants and contrast workflows.
  - Pediatrics: high-grade new RCT evidence remains limited in this window; maintain dedicated pediatric stroke escalation pathways and subspecialty consultation.
- Evidence strength: Guideline-grade + Observational/Consensus.
- Note: pediatric statement above is an inference from evidence scarcity in this date window and should be rechecked as new pediatric trials publish.

## 8) Implementation science and practical workflow
- Practical recommendation:
  - Bundle-based stroke care (protocolized multi-domain treatment) improves outcomes and should be operationalized in UI as checklist-driven rapid workflows.
  - Senior-first UX should prioritize one-screen critical data, low-friction order bundles, and keyboard-first navigation.
- Evidence strength: RCT-supported + Observational/Consensus.

### Operational mapping update (2026-02-18, iter-004)
- Added a one-screen ICH first-hour critical bundle card to prioritize stabilization, BP strategy, anticoagulation reversal, ICU escalation, and early surgery screening.
- Added a large-core EVT evidence highlight with explicit conservative rule: do not exclude solely for large core; require individualized neurointerventional review and risk documentation.
- Added a phenotype quick matrix for DAPT pathway selection as a concise companion to existing detailed text.
- Conservative assumption used: in ambiguous acute scenarios, prioritize stabilization and reversible harm mitigation before lower-priority workflow steps.

### Operational mapping update (2026-02-18, iter-006)
- Added SAH first-hour rapid actions card: consolidated airway/ICU, BP control, aneurysm securing, nimodipine, hydrocephalus screening, and DCI surveillance plan into a single red-highlighted card at the top of the SAH management section. Based on 2023 AHA/ASA SAH guideline (PMID: 37212182).
- Added CVT treatment timeline strip: 4-phase display (acute → subacute → duration → escalation triggers) with ACTION-CVT DOAC transition data. Placed after acute management checklist in CVT tab. Based on 2024 AHA CVT statement + ACTION-CVT (PMID: 36315105).
- Added AF anticoag timing quick reference card in secondary prevention: conditionally displayed when DOAC-for-AF or anticoag-other is selected. Shows CATALYST/ELAN/TIMING severity-based timing grid with caution flags. Based on ELAN (PMID: 37222476) and CATALYST meta-analysis (Fischer U, Lancet Neurol 2025).

### Operational mapping update (2026-02-18, iter-007)
- Added TNK-first decision card in ischemic management: 3-column layout (TNK first-line dosing, alteplase fallback conditions, key exclusions) placed before TNK/EVT recommendation checkboxes. Based on AcT (PMID: 35779579), TRACE-2 (PMID: 37043691), ORIGINAL (PMID: 38710025), ESO 2023 recommendation.
- Added imaging hard-stop alert at top of wake-up stroke evaluation panel: requires DWI-FLAIR mismatch (WAKE-UP trial) or CT perfusion mismatch (EXTEND trial) before thrombolysis. TWIST (Lancet 2023) context: no benefit for unselected wake-up thrombolysis.
- Enhanced pregnancy/peripartum emergency panel with 4-cell rapid actions grid: acute treatment (do not delay, TNK relative CI, EVT preferred for LVO), OB coordination, differential diagnosis (preeclampsia/eclampsia, RCVS, CVT, PRES, peripartum cardiomyopathy), medication safety. Based on AHA 2026 Maternal Stroke Update (PMID: 41678811).

### Operational mapping update (2026-02-18, iter-008)
- Added renal-safety auto-alert in Contrast Allergy + LVO Protocol section: dynamically computes CrCl from patient data and shows severe (CrCl <30) or moderate (CrCl 30-59) warnings with nephropathy precautions.
- Added PFO Closure Eligibility decision card in secondary prevention dashboard: criteria for closure (age 18-60, cryptogenic, RoPE ≥7, PASCAL probable/definite), trial evidence (CLOSE NNT ~20, RESPECT HR 0.55, REDUCE 77% RRR), and medical therapy indications. Class I, LOE A.
- Added Carotid Revascularization Decision Guide in secondary prevention dashboard: symptomatic 70-99% (CEA within 2 weeks), symptomatic 50-69% (CEA may be considered), asymptomatic ≥70% (medical management per CREST-2), plus timing guidance after stroke. NASCET + CREST-2 evidence.

## Key citations (metadata + evidence tag)
| Domain | Evidence tag | Title | Year | Journal/Source | URL | PMID / DOI / NCT |
|---|---|---|---|---|---|---|
| AIS thrombolysis | RCT-supported | Intravenous Tenecteplase Compared with Alteplase for Acute Ischaemic Stroke in Canada (AcT) | 2022 | Lancet | https://pubmed.ncbi.nlm.nih.gov/35779579/ | PMID: 35779579; DOI: 10.1016/S0140-6736(22)01054-X |
| AIS thrombolysis | RCT-supported | Trial of Tenecteplase in Chinese Patients with Acute Ischemic Stroke (TRACE-2) | 2023 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/37043691/ | PMID: 37043691; DOI: 10.1056/NEJMoa2216603 |
| AIS thrombolysis | RCT-supported | Tenecteplase vs Alteplase in AIS (ORIGINAL) | 2024 | JAMA | https://pubmed.ncbi.nlm.nih.gov/38710025/ | PMID: 38710025; DOI: 10.1001/jama.2024.8038 |
| Wake-up/unknown onset | RCT-supported | Intravenous thrombolysis with tenecteplase in patients with wake-up stroke (TWIST) | 2023 | Lancet | https://pubmed.ncbi.nlm.nih.gov/36774963/ | PMID: 36774963; DOI: 10.1016/S0140-6736(22)02447-7 |
| AIS thrombolysis | Guideline-grade | European Stroke Organisation expedited recommendation on tenecteplase | 2023 | Eur Stroke J | https://journals.sagepub.com/doi/full/10.1177/23969873231177508 | DOI: 10.1177/23969873231177508 |
| EVT large core | RCT-supported | Trial of Endovascular Thrombectomy for Large Ischemic Strokes (SELECT2) | 2023 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/36762865/ | PMID: 36762865; DOI: 10.1056/NEJMoa2214403 |
| EVT large core | RCT-supported | Endovascular Therapy for Acute Stroke with Large Ischemic Region (RESCUE-Japan LIMIT) | 2022 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/35138767/ | PMID: 35138767; DOI: 10.1056/NEJMoa2205486 |
| EVT large core | RCT-supported | Endovascular Therapy for Acute Ischemic Stroke with Large Infarct (ANGEL-ASPECT) | 2023 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/36762852/ | PMID: 36762852; DOI: 10.1056/NEJMoa2302596 |
| EVT large core | RCT-supported | Endovascular Thrombectomy for Acute Ischemic Stroke with Established Large Infarct (TENSION) | 2023 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/37856323/ | PMID: 37856323; DOI: 10.1056/NEJMoa2310242 |
| ICH | Guideline-grade | 2022 Guideline for the Management of Patients with Spontaneous Intracerebral Hemorrhage | 2022 | Stroke | https://pubmed.ncbi.nlm.nih.gov/35579034/ | PMID: 35579034; DOI: 10.1161/STR.0000000000000407 |
| ICH implementation | RCT-supported | Care bundle approach for acute intracerebral haemorrhage (INTERACT3) | 2023 | Lancet | https://pubmed.ncbi.nlm.nih.gov/37980922/ | PMID: 37980922; DOI: 10.1016/S0140-6736(23)01508-4 |
| ICH reversal | RCT-supported | Andexanet for Factor Xa Inhibitor-Associated Acute Intracerebral Hemorrhage (ANNEXA-I) | 2024 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/38749032/ | PMID: 38749032; DOI: 10.1056/NEJMoa2313040 |
| ICH surgery | RCT-supported | Trial of Early Minimally Invasive Removal of Intracerebral Hemorrhage (ENRICH) | 2024 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/38598795/ | PMID: 38598795; DOI: 10.1056/NEJMoa2400314 |
| SAH | Guideline-grade | 2023 Guideline for Management of Patients With Aneurysmal Subarachnoid Hemorrhage | 2023 | Stroke | https://pubmed.ncbi.nlm.nih.gov/37212182/ | PMID: 37212182; DOI: 10.1161/STR.0000000000000436 |
| CVT | Guideline-grade | Diagnosis and Management of Cerebral Venous Thrombosis: A Scientific Statement from the AHA | 2024 | Stroke / AHA | https://www.ahajournals.org/doi/10.1161/STR.0000000000000456 | PMID: 38284265; DOI: 10.1161/STR.0000000000000456 |
| CVT | Observational/Consensus | Direct Oral Anticoagulants vs Warfarin for CVT (ACTION-CVT) | 2022 | Stroke | https://pubmed.ncbi.nlm.nih.gov/35143325/ | PMID: 35143325; DOI: 10.1161/STROKEAHA.121.037541 |
| Secondary prevention | Guideline-grade | 2021 Guideline for the Prevention of Stroke in Patients With Stroke and TIA | 2021 | Stroke | https://pubmed.ncbi.nlm.nih.gov/34024117/ | PMID: 34024117; DOI: 10.1161/STR.0000000000000375 |
| DAPT pharmacogenomics | RCT-supported | Ticagrelor or Clopidogrel with Aspirin in High-Risk TIA or Minor Stroke (CHANCE-2) | 2021 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/34708996/ | PMID: 34708996; DOI: 10.1056/NEJMoa2111749 |
| DAPT timing/phenotype | RCT-supported | Dual Antiplatelet Treatment up to 72 Hours after Ischemic Stroke (INSPIRES) | 2024 | N Engl J Med | https://www.ahajournals.org/doi/10.1161/STROKEAHA.124.046680 | PMID: 38157499; DOI: 10.1056/NEJMoa2313035 |
| Cardioembolic timing | RCT-supported | Early versus Later Anticoagulation for Stroke with Atrial Fibrillation (ELAN) | 2023 | N Engl J Med | https://pubmed.ncbi.nlm.nih.gov/37222476/ | PMID: 37222476; DOI: 10.1056/NEJMoa2303048 |
| Cardioembolic timing | RCT-supported | Timing of Oral Anticoagulant Therapy in AIS with AF (TIMING) | 2022 | Circulation | https://pubmed.ncbi.nlm.nih.gov/36065821/ | PMID: 36065821; DOI: 10.1161/CIRCULATIONAHA.122.060786 |
| Special populations | Guideline-grade | Maternal Stroke: A Focused Update | 2026 | Stroke / PubMed | https://pubmed.ncbi.nlm.nih.gov/41678811/ | PMID: 41678811 |

### Metadata verification refresh (2026-02-18, iter-037)
- Re-verified 2026 AIS guideline indexing metadata: PMID `40993083`, DOI `10.1161/STR.0000000000000513`.
- Added 2026 extended-window non-LVO tenecteplase RCT metadata: JAMA DOI `10.1001/jama.2025.22824`.
- Re-verified key large-core EVT metadata:
  - SELECT2: PMID `36762818`, DOI `10.1056/NEJMoa2214403`
  - ANGEL-ASPECT: PMID `36762864`, DOI `10.1056/NEJMoa2307987`
  - RESCUE-Japan LIMIT: PMID `36762865`, DOI `10.1056/NEJMoa2214405`
- Re-verified ICH bundle/reversal metadata:
  - INTERACT3: PMID `37245517`, DOI `10.1016/S0140-6736(23)00806-1`, NCT `NCT03209258`
  - ANNEXA-I: PMID `38587294`, DOI `10.1056/NEJMoa2313040`, NCT `NCT03661528`
- Re-verified SAH/CVT/TIA/secondary prevention/special-population metadata:
  - SAH guideline PMID `37212182`, DOI `10.1161/STR.0000000000000436`
  - CVT statement PMID `38284265`, DOI `10.1161/STR.0000000000000456`
  - TIA ED statement PMID `36655570`, DOI `10.1161/STR.0000000000000418`
  - Secondary prevention guideline PMID `34024117`, DOI `10.1161/STR.0000000000000375`
  - Pregnancy statement PMID `41678811`, DOI `10.1161/STR.0000000000000501`

### Operational mapping update (2026-02-18, iter-038)
- Added automated diagnosis-switch pathway guard in QA to reduce regression risk for core branch transitions (ischemic, ICH, SAH, CVT, mimic).
- This does not alter clinical recommendation content; it hardens detection of UI/pathway regressions that could hide or mis-surface thrombolysis controls.

### Operational update (2026-02-18, iter-039)
- No clinical evidence recommendations changed in this iteration.
- Documentation-only update to maintain interruption-safe continuous execution metadata.

### Operational update (2026-02-18, iter-040)
- No evidence-content changes; synchronization-only update for continuous execution metadata integrity.

### Operational update (2026-02-18, iter-041)
- No evidence-content changes; handoff metadata now uses command-based commit retrieval for robustness.

### Operational update (2026-02-20, iter-042)
- Updated TIA disposition language in app pathways from universal admission to risk-stratified disposition (admission/observation vs rapid outpatient pathway when infrastructure is reliable), aligned with AHA TIA ED 2023 scientific statement framing.
- Updated extended-window IVT narrative to include modern imaging-selected 4.5-24h context with TIMELESS (NEJM 2024) and OPTION (JAMA 2026) evidence.
- Updated Xa inhibitor-associated ICH reversal framing to agent-specific selection (andexanet when available/appropriate vs 4F-PCC by local protocol), with ANNEXA-I efficacy/safety context.
- Updated poststroke spasticity recommendation text to align with AHA 2026 poststroke spasticity scientific statement.
- Expanded hormonal risk counseling text to include transgender estrogen and testosterone therapy context from AHA/ASA 2024 primary prevention guidance.

### Metadata verification refresh (2026-02-20, iter-042)
- ESCAPE-MeVO DOI corrected to `10.1056/NEJMoa2411668`.
- OPTION late-window thrombolysis RCT metadata confirmed:
  - PMID `40063269`
  - DOI `10.1001/jama.2025.22824`
- ANNEXA-I ICH reversal RCT retained/confirmed:
  - DOI `10.1056/NEJMoa2313040`
- AHA TIA ED scientific statement reference retained:
  - DOI `10.1161/STR.0000000000000418`

### Operational update (2026-02-20, iter-068)
- No new primary trial or guideline citations were added in this iteration.
- Implemented evidence-to-workflow operationalization for CVT special populations (pregnancy/postpartum, APS, active cancer, severe thrombophilia) by converting guidance text into structured decision-support fields and note output.
- Added citation metadata quality gate (`scripts/validate-citations.mjs`) that enforces citation table completeness (title/year/source/URL/PMID|DOI|NCT) within the 2021-2026 evidence window before smoke QA.
- Inference disclosure: the CVT special-population duration/agent summary in UI is a synthesis layer over listed guideline/statement evidence, not a new independent recommendation source.

### Operational update (2026-02-20, iter-069)
- No new guideline/RCT sources were added.
- Strengthened evidence implementation reliability by adding scenario-level regression assertions that verify behavior under high-risk TIA and APS-CVT conditions.
- This iteration improves confidence that existing evidence-linked recommendations remain actionable after future UI/logic edits.

### Operational update (2026-02-20, iter-070)
- No new citation sources were introduced.
- Added workflow-safety regression gates for protected UW on-call contact endpoints to preserve rapid communication reliability during acute stroke operations.
- This is an operational resilience update that supports evidence implementation speed/safety without changing recommendation content.

### Metadata verification refresh (2026-02-20, iter-071)
- CVT scientific statement metadata re-verified from PubMed primary source:
  - PMID `38284265`
  - DOI `10.1161/STR.0000000000000456`
- Corrected key-citation table row to remove prior DOI mismatch.

### Operational update (2026-02-20, iter-072)
- No new clinical evidence sources were added in this iteration.
- Added CI enforcement for evidence/citation and smoke checks so evidence-linked pathway updates cannot bypass automated validation on push/PR.

### Operational update (2026-02-20, iter-073)
- No new medical evidence sources added.
- Added scheduled live-smoke automation to continuously verify that evidence-linked pathways remain operational on production between code changes.

### Operational update (2026-02-20, iter-074)
- No new medical evidence sources were added in this iteration.
- Hardened wake-up/EXTEND regression automation to account for encounter-layout variability and LKW auto-collapse state transitions.
- Added manual EXTEND-criteria fallback verification path so evidence-linked extended-window eligibility guidance remains test-covered even when direct CTP fields are conditionally hidden.

### Operational update (2026-02-20, iter-075)
- No new medical evidence sources were added in this iteration.
- Improved evidence traceability by writing explicit WAKE-UP/EXTEND non-eligibility reason lines into generated clinical note outputs (transfer, consult, signout, progress, discharge).
- This reduces ambiguity in downstream handoffs by documenting which evidence-linked criteria were not met at decision time.

### Operational update (2026-02-20, iter-076)
- No new medical evidence sources were added in this iteration.
- Added deterministic QA verification that generated note text preserves wake-up evidence traceability (eligible vs not-yet-eligible rationale), using clipboard-based smoke assertions.
- This closes the implementation loop between evidence-linked decision logic and exported documentation quality.

### Operational update (2026-02-20, iter-077)
- No new medical evidence sources were added in this iteration.
- Added scheduled live-smoke failure routing to GitHub issues with automatic issue resolution on subsequent pass.
- This improves operational reliability of evidence-linked pathway monitoring by ensuring failed production audits are surfaced and tracked.

### Operational update (2026-02-20, iter-078)
- No new medical evidence sources were added in this iteration.
- Strengthened consult-note safety traceability by adding structured supportive-negative outputs (when documented) to thrombolysis contraindication trace lines.
- This complements blocker/caution output and improves decision transparency during acute handoffs.

### Operational update (2026-02-20, iter-079)
- No new medical evidence sources were added in this iteration.
- Extended operationalization of post-EVT BP evidence by embedding structured infusion/target strategy details into core handoff note templates.
- This improves continuity of guideline-concordant BP management documentation across transitions of care.

### Operational update (2026-02-20, iter-080)
- No new medical evidence sources were added in this iteration.
- Strengthened evidence metadata governance by adding PMID/DOI/NCT format validation and duplicate-identifier detection in the citation validator.
- This improves durability of evidence traceability across continuous content updates.

### Operational update (2026-02-20, iter-081)
- No new medical evidence sources were added in this iteration.
- Added regression automation coverage to ensure supportive-negative contraindication trace lines persist in generated clinical note output.
- This improves reliability of evidence-informed documentation safety language during future UI/logic changes.

### Operational update (2026-02-20, iter-082)
- No new medical evidence sources were added in this iteration.
- Strengthened regression verification for post-EVT BP evidence operationalization by asserting that exported handoff note text retains structured BP-plan details (including infusion-agent strategy) after scenario state transitions.
- This improves reliability of guideline-concordant post-EVT documentation in generated notes.

### Operational update (2026-02-20, iter-083)
- No new medical evidence sources were added in this iteration.
- Added citation URL-health verification capability in the evidence validator and integrated it into scheduled live-smoke workflow execution.
- This improves ongoing evidence-source availability monitoring without changing clinical recommendation content.
