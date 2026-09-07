# Complete major AHA guideline source inventories — 2026-09-06

This review reconciles every formal recommendation table and numbered row in six complete publisher PDFs. It is a bounded source-inventory audit, not a new clinical validation of every existing summary, effect estimate, supporting paragraph, or referenced study. Existing text and correction statuses were preserved, except the 14 confirmed omitted entries added below. No Protocols or application code was changed.

## Findings and changes

- AIS 2026: 195 → 202 COR recommendations, 45 tables. Added hospital certification, stroke-severity scales, two hemodynamic-augmentation rows, neuroprotective agents, emergency carotid endarterectomy, and organized inpatient stroke-unit care. All prior 195 IDs are now explicit and unchanged; the five existing STR0530 correction references still target the same rows.
- ICH 2022: all 124 recommendations in 31 tables accounted for; no missing formal rows found.
- SAH 2023: 81 → 84 recommendations, 15 tables. Restored seizure-table rows 4–6, page 32: phenytoin harm, ≤7-day treatment for presenting seizures, and lack of benefit beyond 7 days in patients without prior epilepsy.
- Primary prevention 2024: 80 → 83 recommendations, 27 tables. Restored Patient Assessment rows 2–4, page 10: AF risk-score assessment and adult risk-factor/SDOH screening. Two distinct printed tables share the title Inflammation in Atherosclerosis (pages 36 and 37); their numbering resets and they are inventoried separately rather than silently combined.
- Secondary prevention 2021: all 162 recommendations in 41 tables accounted for; no missing formal rows found.
- AF 2023: all 194 COR recommendations were present. Added the separate §8.4 row 6 economic-value statement (intermediate value, B-R), for 195 total entries across 60 tables. Its type is value-statement, not consensus or a COR recommendation.

## Method and limits

Complete PDFs were checked from cover through references/appendices. Table extraction was reconciled to local recommendation numbering, continuation tables, grades, and physical PDF pages; source-derived signatures are checked into tests/fixtures/major-aha-source-inventory-20260906.json. Existing summary order and grades reconciled within every table. AIS uses independent full-text extraction because the vector-heavy PDF stalls geometric table extraction. Its 202 numbered COR/LOE rows reconcile to 45 tables. The only source-versus-current grade difference is AIS dysphagia row 5: IIa in the January source, correctly IIb after STR0530.

The parent agent reconfirmed the prior in-session complete 34-item STR0530 correction review: only five already-present formal recommendation rows changed; none of the seven newly added rows is affected. Coverage completeness is separate from correction currency. No separate ungraded consensus/good-practice recommendation set was designated in these documents; C-EO rows remain formal recommendations. Supporting narrative, repeated summary figures, and evidence tables are not counted as additional formal recommendations.

Direct AHA-hosted PDF downloads returned HTTP 403. The alternative files are copies of the original publisher PDFs, verified by DOI, title, pagination, and document identity. PMC AF retrieval returned a browser challenge; Europe PMC full-text XML returned 404. An initially retrieved secondary-prevention teaching copy contained only 12 selected pages and was rejected; the complete 104-page OHSU copy was used instead. The Portail Vasculaire link returned HTML and was rejected.

## Sources and complete table inventory

### AHA/ASA Early Management of Acute Ischemic Stroke 2026

- Full original publisher PDF: [119 pages](https://www.setrac.org/wp-content/uploads/2026/01/2026-guideline-for-the-early-management-of-patients-with-acute-ischemic-stroke-a-guideline-from.pdf); DOI 10.1161/STR.0000000000000513.
- SHA-256: `54207c7520f4b297b7510aa3b1fdf81f3eb4c36682326fc7c1bf98c3d4e91482`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendations for Stroke Awareness (Population Level) | 4 | 10–10 |
| table-02 | Recommendations for EMS Systems | 3 | 11–11 |
| table-03 | Recommendations for Prefacility Assessment and Management | 7 | 12–12 |
| table-04 | Recommendations for EMS Destination Management | 5 | 14–15 |
| table-05 | Recommendations for Role of Mobile Stroke Units | 4 | 16–16 |
| table-06 | Recommendation for Hospital Stroke Capabilities | 1 | 17–17 |
| table-07 | Recommendations for Emergency Evaluation of Patients With | 5 | 18–18 |
| table-08 | Recommendations for Telemedicine | 7 | 20–20 |
| table-09 | Recommendations for Organization and Integration of Components | 8 | 22–22 |
| table-10 | Recommendations for Stroke Registries, Quality Improvement, and | 3 | 24–24 |
| table-11 | Recommendation for Stroke Scales | 1 | 26–26 |
| table-12 | Recommendations for Initial, Vascular, and Multimodal Imaging | 11 | 26–27 |
| table-13 | Recommendations for Other Diagnostic Tests | 2 | 31–31 |
| table-14 | Recommendations for Airway, Breathing, and Oxygenation | 6 | 31–32 |
| table-15 | Recommendations for Head Positioning | 2 | 34–34 |
| table-16 | Recommendations for Blood Pressure Management | 10 | 35–35 |
| table-17 | Recommendations for Temperature Management | 3 | 37–37 |
| table-18 | Recommendations for Blood Glucose Management | 3 | 37–37 |
| table-19 | Recommendations for Thrombolysis Decision-Making | 14 | 38–38 |
| table-20 | Recommendations for Choice of Thrombolytic Agent | 2 | 42–42 |
| table-21 | Recommendations for Extended Time Windows for Intravenous | 3 | 44–44 |
| table-22 | Recommendations for Other IV Fibrinolytics and Sonothrombolysis | 7 | 45–45 |
| table-23 | Recommendations for Other Specific Circumstances | 2 | 47–47 |
| table-24 | Recommendations for Concomitant With IVT | 2 | 48–48 |
| table-25 | Recommendations for Endovascular Thrombectomy for Adult | 8 | 53–54 |
| table-26 | Recommendations for Posterior Circulation Stroke | 2 | 56–57 |
| table-27 | Recommendations for Endovascular Techniques | 9 | 57–58 |
| table-28 | Recommendations for Endovascular Thrombectomy in Pediatric | 3 | 60–60 |
| table-29 | Recommendations for Antiplatelet Treatment | 18 | 62–62 |
| table-30 | Recommendations for Anticoagulants | 6 | 68–68 |
| table-31 | Recommendations for Hemodynamic Augmentation | 2 | 71–71 |
| table-32 | Recommendation for Neuroprotective Agents | 1 | 71–71 |
| table-33 | Recommendation for Emergency Carotid Endarterectomy, Carotid Angioplasty, and Stenting Without Intracranial Clot | 1 | 72–72 |
| table-34 | Recommendation for Stroke Units | 1 | 72–72 |
| table-35 | Recommendations for Dysphagia | 6 | 74–74 |
| table-36 | Recommendations for Nutrition | 3 | 75–75 |
| table-37 | Recommendations for Deep Vein Thrombosis Prophylaxis | 5 | 76–76 |
| table-38 | Recommendations for Depression | 2 | 77–77 |
| table-39 | Recommendations for Other In-Facility Management Considerations | 3 | 79–79 |
| table-40 | Recommendations for Rehabilitation | 3 | 80–80 |
| table-41 | Recommendations for Brain Swelling (General Recommendations) | 3 | 81–81 |
| table-42 | Recommendations for Brain Swelling (Medical Management) | 3 | 81–81 |
| table-43 | Recommendations for Supratentorial Infarction (Surgical Management) | 4 | 82–82 |
| table-44 | Recommendations for Cerebellar Infarction (Surgical Management) | 2 | 84–84 |
| table-45 | Recommendations for Seizures | 2 | 84–84 |

### AHA/ASA Spontaneous ICH Guideline 2022

- Full original publisher PDF: [80 pages](https://www.mcgill.ca/anesthesia/files/anesthesia/mx_spontaneous_intracer._hemorrhage_-_aha-_2022_1.pdf); DOI 10.1161/STR.0000000000000407.
- SHA-256: `e9e60ea55197db85c041b6830543fa5f5c77bb0b27c86a2ef12fc0a4dfa58f68`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendations for Organization of Prehospital and Initial Systems of Care | 7 | 8–8 |
| table-02 | Recommendations for Physical Examination and Laboratory Assessment | 1 | 10–10 |
| table-03 | Recommendations for Neuroimaging for ICH Diagnosis and Acute Course | 5 | 12–13 |
| table-04 | Recommendations for Diagnostic Assessment for ICH Pathogenesis | 7 | 14–14 |
| table-05 | Recommendations for Acute BP Lowering | 5 | 16–17 |
| table-06 | Recommendations for Anticoagulant-Related Hemorrhage | 12 | 19–19 |
| table-07 | Recommendations for Antiplatelet-Related Hemorrhage | 3 | 23–23 |
| table-08 | Recommendations for General Hemostatic Treatments | 2 | 24–24 |
| table-09 | Recommendations for Inpatient Care Setting | 9 | 25–25 |
| table-10 | Recommendations for Prevention and Management of Acute Medical Complications | 4 | 27–27 |
| table-11 | Recommendations for Thromboprophylaxis and Treatment of Thrombosis | 6 | 29–29 |
| table-12 | Recommendations for Nursing Care | 3 | 31–31 |
| table-13 | Recommendations for Glucose Management | 3 | 32–32 |
| table-14 | Recommendations for Temperature Management | 2 | 33–33 |
| table-15 | Recommendations for Seizures and Antiseizure Drugs | 4 | 34–34 |
| table-16 | Recommendations for Neuroinvasive Monitoring, ICP, and Edema Treatment | 5 | 35–35 |
| table-17 | Recommendations for MIS Evacuation of ICH | 3 | 37–37 |
| table-18 | Recommendations for MIS Evacuation of IVH | 5 | 39–39 |
| table-19 | Recommendations for Craniotomy for Supratentorial Hemorrhage | 2 | 41–41 |
| table-20 | Recommendations for Craniotomy for Posterior Fossa Hemorrhage | 1 | 42–42 |
| table-21 | Recommendations for Craniectomy for ICH | 2 | 43–43 |
| table-22 | Recommendations for Outcome Prediction | 3 | 44–44 |
| table-23 | Recommendations for Decisions to Limit Life-Sustaining Treatment | 3 | 45–45 |
| table-24 | Recommendations for Rehabilitation and Recovery | 5 | 47–47 |
| table-25 | Recommendations for Neurobehavioral Complications | 6 | 48–48 |
| table-26 | Recommendations for Prognostication of Future ICH Risk | 1 | 50–50 |
| table-27 | Recommendations for BP Management | 2 | 51–51 |
| table-28 | Recommendations for Management of Antithrombotic Agents | 5 | 52–52 |
| table-29 | Recommendations for Management of Other Medications | 2 | 54–54 |
| table-30 | Recommendations for Lifestyle Modifications/Patient and Caregiver Education | 5 | 55–55 |
| table-31 | Recommendations for Primary ICH Prevention in Individuals With High- Risk Imaging Findings | 1 | 56–56 |

### AHA/ASA Aneurysmal Subarachnoid Hemorrhage 2023

- Full original publisher PDF: [57 pages](https://www.mcgill.ca/anesthesia/files/anesthesia/mx_aneurysmal_sah_-_aha-_2023_1.pdf); DOI 10.1161/STR.0000000000000436.
- SHA-256: `b9e7deb7c10f2b18b129625dbc0f33fd31725521cc180d75fedf52dd81bc86e6`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendations for Natural History and Outcome of aSAH | 4 | 8–8 |
| table-02 | Recommendations for Clinical Manifestations and Diagnosis of aSAH | 6 | 9–9 |
| table-03 | Recommendations for Hospital Characteristics and Systems of Care | 2 | 11–11 |
| table-04 | Recommendations for Medical Measures to Prevent Rebleeding After aSAH | 3 | 13–13 |
| table-05 | Recommendations for Surgical and Endovascular Methods for Treatment of Ruptured Cerebral Aneurysms | 13 | 14–14 |
| table-06 | Recommendations for Anesthetic Management of Surgical and Endovascular Treatment of aSAH | 7 | 17–17 |
| table-07 | Recommendations for Management of Medical Complications Associated With aSAH | 8 | 19–20 |
| table-08 | Recommendations for Nursing Interventions and Activities | 6 | 22–23 |
| table-09 | Recommendations for Monitoring and Detection of Cerebral Vasospasm and DCI | 4 | 25–25 |
| table-10 | Recommendations for Management of Cerebral Vasospasm and DCI After aSAH | 8 | 26–26 |
| table-11 | Recommendations for Management of Hydrocephalus Associated With aSAH | 4 | 30–30 |
| table-12 | Recommendations for Management of Seizures Associated With aSAH | 6 | 31–32 |
| table-13 | Recommendations for aSAH Acute Recovery | 8 | 33–34 |
| table-14 | Recommendations for aSAH Long-Term Recovery | 3 | 36–36 |
| table-15 | Recommendations for Risk Factors, Prevention, and Subsequent Monitoring for Recurrent aSAH | 2 | 37–37 |

### AHA/ASA Primary Prevention of Stroke 2024

- Full original publisher PDF: [81 pages](https://saigaiin.sakura.ne.jp/sblo_files/saigaiin/image/E884B3E58D92E4B8ADE38080E382ACE382A4E38389E383A9E382A4E383B3.pdf); DOI 10.1161/STR.0000000000000475.
- SHA-256: `00841f498d669d05d62872db99c217a636abbbe29e72eb018b1727a6de53244d`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendations for Patient Assessment | 4 | 9–10 |
| table-02 | Recommendations for Diet Quality | 5 | 12–12 |
| table-03 | Recommendations for Physical Activity | 3 | 14–14 |
| table-04 | Recommendations for Weight and Obesity | 2 | 16–16 |
| table-05 | Recommendations for Sleep | 2 | 17–17 |
| table-06 | Recommendations for Blood Sugar | 3 | 18–19 |
| table-07 | Recommendations for Blood Pressure | 4 | 20–20 |
| table-08 | Recommendations for Lipids | 4 | 22–22 |
| table-09 | Recommendations for Tobacco Use | 6 | 24–24 |
| table-10 | Recommendations for Asymptomatic Carotid Artery Stenosis | 6 | 26–26 |
| table-11 | Recommendations for Asymptomatic Cerebral SVD, Including Silent Cerebral Infarcts | 3 | 29–29 |
| table-12 | Recommendations for Migraine | 2 | 30–30 |
| table-13 | Recommendations for Sickle Cell Disease | 6 | 31–31 |
| table-14 | Recommendations for Genetic Stroke Syndromes | 3 | 34–34 |
| table-15 | Recommendation for Inflammation in Atherosclerosis | 1 | 36–36 |
| table-16 | Recommendation for Inflammation in Atherosclerosis | 6 | 37–37 |
| table-17 | Recommendations for Infection | 2 | 39–39 |
| table-18 | Recommendations for Substance Use and Substance Disorders | 2 | 40–40 |
| table-19 | Recommendations for Prevention of Pregnancy-Associated Stroke | 2 | 42–42 |
| table-20 | Recommendations for Pregnancy and Long-Term Stroke Risk | 2 | 44–44 |
| table-21 | Recommendations for Endometriosis | 2 | 47–47 |
| table-22 | Recommendations for Hormonal Contraception | 3 | 48–48 |
| table-23 | Recommendations for Menopause | 3 | 49–49 |
| table-24 | Recommendation for Transgender Health | 1 | 51–51 |
| table-25 | Recommendation for Testosterone Use | 1 | 52–52 |
| table-26 | Recommendation for Cardiomyopathy | 1 | 53–53 |
| table-27 | Recommendations for Antiplatelet Use for Primary Prevention | 4 | 54–54 |

### AHA/ASA Secondary Stroke Prevention 2021

- Full original publisher PDF: [104 pages](https://www.ohsu.edu/sites/default/files/2022-04/AHA%20%20Stroke%20Prevention%20Guidlines%202021.pdf); DOI 10.1161/STR.0000000000000375.
- SHA-256: `3347d9c0ee0e804ecaf0c0f689d0beb09b47773eb64fd63126445e48a0c16d87`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendations for Diagnostic Evaluation | 14 | 10–10 |
| table-02 | Recommendations for Nutrition | 2 | 14–14 |
| table-03 | Recommendations for Physical Activity | 4 | 16–16 |
| table-04 | Recommendations for Smoking Cessation | 3 | 17–17 |
| table-05 | Recommendations for Substance Use | 3 | 18–18 |
| table-06 | Recommendations for Hypertension | 4 | 20–20 |
| table-07 | Recommendations for Treating and Monitoring Hyperlipidemia | 4 | 21–21 |
| table-08 | Recommendations for Hypertriglyceridemia | 2 | 23–23 |
| table-09 | Recommendations for Glucose | 8 | 24–24 |
| table-10 | Recommendations for Obesity | 3 | 27–27 |
| table-11 | Recommendations for Obstructive Sleep Apnea | 2 | 28–28 |
| table-12 | Recommendations for Intracranial Large Artery Atherosclerosis | 10 | 29–30 |
| table-13 | Recommendations for Extracranial Carotid Stenosis | 12 | 32–33 |
| table-14 | Recommendations for Extracranial Vertebral Artery Stenosis | 3 | 34–34 |
| table-15 | Recommendations for Aortic Arch Atherosclerosis | 2 | 35–35 |
| table-16 | Recommendations for Moyamoya Disease | 2 | 36–36 |
| table-17 | Recommendation for Small Vessel Stroke | 1 | 37–37 |
| table-18 | Recommendations for AF | 10 | 38–38 |
| table-19 | Recommendations for Valvular Disease | 10 | 41–41 |
| table-20 | Recommendations for LV Thrombus | 4 | 44–44 |
| table-21 | Recommendations for Cardiomyopathy | 5 | 46–46 |
| table-22 | Recommendations for PFO | 4 | 48–48 |
| table-23 | Recommendations for Congenital Heart Disease | 2 | 50–50 |
| table-24 | Recommendation for Cardiac Tumors | 1 | 52–52 |
| table-25 | Recommendations for Dissection | 3 | 52–52 |
| table-26 | Recommendation for Hematologic Traits | 1 | 53–53 |
| table-27 | Recommendations for Antiphospholipid Syndrome | 4 | 54–54 |
| table-28 | Recommendation for Hyperhomocysteinemia | 1 | 55–55 |
| table-29 | Recommendation for Malignancy | 1 | 56–56 |
| table-30 | Recommendations for Sickle Cell Disease | 2 | 57–57 |
| table-31 | Recommendations for Autoimmune Vasculitis | 4 | 58–58 |
| table-32 | Recommendations for Infectious Vasculitis | 2 | 59–59 |
| table-33 | Recommendations for Other Genetic Disorders | 2 | 60–60 |
| table-34 | Recommendations for Carotid Web | 2 | 61–61 |
| table-35 | Recommendations for Fibromuscular Dysplasia | 3 | 62–62 |
| table-36 | Recommendation for Dolichoectasia | 1 | 62–62 |
| table-37 | Recommendations for ESUS | 2 | 63–63 |
| table-38 | Recommendations for Antithrombotic Medications | 6 | 64–64 |
| table-39 | Recommendations for Health Systems–Based Interventions | 3 | 67–67 |
| table-40 | Recommendations for Behavior Change Interventions | 6 | 69–69 |
| table-41 | Recommendations for Health Equity | 4 | 71–71 |

### 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation: A Report of the American College of Cardiology/American Heart Association Joint Committee on Clinical Practice Guidelines

- Full original publisher PDF: [156 pages](https://cardiq.org/wp-content/uploads/resources/2023%20AFib%20Guidelines.pdf); DOI 10.1161/CIR.0000000000001193.
- SHA-256: `556b0ce0e0adc808c16140b177323bb97570e39101f3efb8cef83ec418a14778`.

| Table ID | Source table | Rows | Physical PDF pages |
|---|---|---:|---|
| table-01 | Recommendation to Address Health Inequities and Barriers to AF Management | 1 | 20–20 |
| table-02 | Recommendation for SDM in AF Management | 1 | 21–21 |
| table-03 | Recommendations for Basic Clinical Evaluation | 2 | 22–22 |
| table-04 | Recommendations for Rhythm Monitoring Tools and Methods | 5 | 23–23 |
| table-05 | Recommendation for Primary Prevention | 1 | 24–24 |
| table-06 | Recommendation for Weight Loss in Individuals Who Are Overweight or Obese | 1 | 25–25 |
| table-07 | Recommendation for Physical Fitness | 1 | 25–25 |
| table-08 | Recommendation for Smoking Cessation | 1 | 26–26 |
| table-09 | Recommendation for Alcohol Consumption | 1 | 26–26 |
| table-10 | Recommendation for Caffeine Consumption | 1 | 26–26 |
| table-11 | Recommendation for the Treatment of Hypertension | 1 | 27–27 |
| table-12 | Recommendation for Sleep | 1 | 28–28 |
| table-13 | Recommendations for Comprehensive Care | 2 | 28–28 |
| table-14 | Recommendations for Risk Stratification Schemes | 4 | 29–29 |
| table-15 | Recommendations for Risk-Based Selection of Oral Anticoagulation: Balancing Risks and Benefits | 2 | 31–31 |
| table-16 | Recommendations for Antithrombotic Therapy | 5 | 33–33 |
| table-17 | Recommendations for Considerations in Managing Anticoagulants | 3 | 36–36 |
| table-18 | Recommendation for Silent AF and Stroke of Undetermined Cause | 1 | 38–38 |
| table-19 | Recommendations for Oral Anticoagulation for Device-Detected Atrial High-Rate Episodes Among Patients Without a Previous Diagnosis of AF | 3 | 40–40 |
| table-20 | Recommendations for Percutaneous Approaches to Occlude the LAA | 2 | 42–42 |
| table-21 | Recommendations for Cardiac Surgery—LAA Exclusion/Excision | 3 | 43–43 |
| table-22 | Recommendations for Active Bleeding on Anticoagulant Therapy and Reversal Drugs | 5 | 44–45 |
| table-23 | Recommendations for Management of Patients With AF and ICH | 3 | 47–47 |
| table-24 | Recommendations for Periprocedural Management | 6 | 50–50 |
| table-25 | Recommendations for AF Complicating ACS or PCI | 2 | 52–52 |
| table-26 | Recommendation for CCD | 1 | 53–53 |
| table-27 | Recommendation for PAD | 1 | 54–54 |
| table-28 | Recommendations for CKD/Kidney Failure | 3 | 55–55 |
| table-29 | Recommendations for AF in VHD | 2 | 56–56 |
| table-30 | Recommendations for Anticoagulation of Typical AFL | 5 | 57–57 |
| table-31 | Recommendations for Broad Considerations for Rate Control | 2 | 59–59 |
| table-32 | Recommendations for Acute Rate Control | 5 | 60–60 |
| table-33 | Recommendations for Long-Term Rate Control | 5 | 63–63 |
| table-34 | Recommendations for AVNA | 4 | 64–64 |
| table-35 | Recommendations for Goals of Therapy With Rhythm Control | 7 | 66–66 |
| table-36 | Recommendations for Prevention of Thromboembolism in the Setting of Cardioversion | 7 | 69–69 |
| table-37 | Recommendations for Electrical Cardioversion | 6 | 72–72 |
| table-38 | Recommendations for Pharmacological Cardioversion | 5 | 73–73 |
| table-39 | Recommendations for Specific Drug Therapy for Long-Term Maintenance of Sinus Rhythm | 8 | 76–76 |
| table-40 | Recommendations for Inpatient Initiation of Antiarrhythmic Agents | 3 | 79–79 |
| table-41 | Recommendations for AF Catheter Ablation | 7 | 84–84 |
| table-42 | Recommendations for Techniques and Technologies for AF Catheter Ablation | 2 | 86–86 |
| table-43 | Recommendations for Management of Recurrent AF After Catheter Ablation | 2 | 87–87 |
| table-44 | Recommendations for Anticoagulation Therapy Before and After Catheter Ablation | 4 | 88–88 |
| table-45 | Recommendations for the Role of Pacemakers and ICDs for the Prevention and Treatment of AF | 4 | 89–90 |
| table-46 | Recommendations for Surgical Ablation | 3 | 90–90 |
| table-47 | Recommendations for Management of AF in Patients With HF | 12 | 92–92 |
| table-48 | Recommendations for Management of Early Onset AF, Including Genetic Testing | 2 | 97–97 |
| table-49 | Recommendation for Athletes | 1 | 98–98 |
| table-50 | Recommendations for Anticoagulation Considerations in Patients With Class III Obesity | 2 | 98–98 |
| table-51 | Recommendations for WPW and Preexcitation Syndromes | 4 | 99–99 |
| table-52 | Recommendations for ACHD | 6 | 100–100 |
| table-53 | Recommendations for Prevention of AF After Cardiac Surgery | 2 | 102–102 |
| table-54 | Recommendations for Treatment of AF After Cardiac Surgery | 5 | 102–102 |
| table-55 | Recommendations for Acute Medical Illness or Surgery (Including AF in Critical Care) | 3 | 104–104 |
| table-56 | Recommendation for Hyperthyroidism | 1 | 106–106 |
| table-57 | Recommendations for Pulmonary Disease | 2 | 106–106 |
| table-58 | Recommendations for Pregnancy | 5 | 107–107 |
| table-59 | Recommendations for Cardio-Oncology and Anticoagulation Considerations | 3 | 108–108 |
| table-60 | Recommendations for Anticoagulation Use in Patients With Liver Disease | 3 | 110–110 |

## Validation

Focused test file: tests/guidelines-major-aha-completeness.test.js. It verifies all source row numbers/pages and grades, all six denominators and table counts, preserved AIS correction IDs, newly restored seizure/assessment/AIS qualifiers, and separate AF economic-value accounting.
