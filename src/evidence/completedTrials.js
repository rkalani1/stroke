// src/evidence/completedTrials.js
//
// Completed / landmark trials. The Atlas's "what does the literature say"
// surface. NEVER used as eligibility criteria — those live in activeTrials.js.
//
// Seed data is drawn from docs/evidence-review-2021-2026.md (PMID-verified)
// and from existing inline references in src/app.jsx Management content.
// Where a precise numeric (effectSize, CI, pValue) was not available locally,
// the field is left as a short qualitative summary and verificationNotes flag
// the limitation. No live network lookups were performed.

import { makeCompletedTrial } from './schema.js';

const lr = '2026-04-25';

// Helper to keep records compact while still type-safe.
const t = makeCompletedTrial;

export const completedTrials = [
  // Scoped current-evidence updates; original source-depth limits are explicit.
  t({
    "id": "hope-bp-2026",
    "shortName": "HOPE (reperfusion-guided BP)",
    "fullName": "Personalized Blood Pressure Targeting After Endovascular Therapy for Acute Ischemic Stroke: A Randomized Clinical Trial.",
    "topic": "bp-post-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-post-evt"
    ],
    "population": {
      "n": 440,
      "ageRange": "Adults; mean 75 years",
      "nihssRange": "Not asserted as an eligibility threshold",
      "timeWindow": "After successful anterior-circulation EVT; BP strategy for 72 hours",
      "keyInclusion": [
        "mTICI ≥2b",
        "Pre-stroke mRS 0–2; ASPECTS ≥6",
        "11 Spanish comprehensive stroke centers"
      ],
      "keyExclusion": [
        "Residual arterial stenosis ≥50%"
      ]
    },
    "secondaryEndpoints": [
      {
        "name": "Hemorrhagic transformation",
        "result": "22.3% versus 31.6%; OR 0.62 (95% CI 0.41–0.95)"
      }
    ],
    "safetyFindings": {
      "sich": "3.5% versus 3.9%; no significant difference detected",
      "mortality": "Narrative reports 15.4% versus 15.6%, but mRS-table counts/percentages differ; source discrepancy unresolved",
      "other": "Serious adverse events 15.8% versus 12.0%; a neutral safety comparison is not proof of equal risk"
    },
    "imagingCriteria": "Successful anterior reperfusion, ASPECTS ≥6 and no residual ≥50% stenosis; only 43/440 had mTICI 2b.",
    "applicabilityNotes": "The randomized comparison tested the combined reperfusion-guided strategy. It does not independently prove benefit for each reperfusion subgroup or establish universal BP targets. It cautions against converting earlier intensive-lowering results into an unconditional 140-mm Hg physiologic floor.",
    "limitations": "Open label, stopped early for funding; selected anatomy, predominantly mTICI 2c/3, and inconsistent control numerator/mortality values in the primary report. Supplement not appraised.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-hope-bp-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "New selected-strategy evidence requiring reconciliation with earlier BP trials and current guidance. Do not translate either arm into a universal bedside order.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-30",
    "verificationStatus": "disputed",
    verificationNotes: "Original main Methods/Results/Tables 1–2 compared (JAMA Neurology DOI10.1001/jamaneurol.2026.1706). Primary control numerator and mortality reporting disagree within the source; retained explicitly, not silently corrected.",
    "intervention": "Trial strategy: SBP 140–160 mm Hg for mTICI 2b, or 100–140 for mTICI 2c/3, for 72 hours; antihypertensives or vasopressors as needed",
    "comparator": "SBP <180 mm Hg for 72 hours",
    "primaryEndpoint": {
      "definition": "mRS 0–2 in the intention-to-treat analysis",
      "timepoint": "90 days",
      "result": "60.0% versus reported 47.1%; 215 versus 225 analyzed. Control numerator is inconsistent: 106 in abstract/main versus 105 in Table 2.",
      "effectSize": "Reported absolute risk difference 13.3 percentage points",
      "confidenceInterval": "95% CI 4.1–22.6 percentage points",
      "pValue": "P=.005"
    }
  }),
  t({
    "id": "lais-2026",
    "shortName": "LAIS",
    "fullName": "Loberamisal for Acute Ischemic Stroke: The LAIS Randomized Clinical Trial.",
    "topic": "acute-neuroprotection",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-neuroprotection"
    ],
    "population": {
      "n": 998,
      "ageRange": "18–80 years",
      "nihssRange": "7–20; median baseline 8",
      "timeWindow": "Within 48 hours of symptom onset",
      "keyInclusion": [
        "Pre-stroke mRS ≤1",
        "32 hospitals in China",
        "997 treated participants in primary analysis (502/495)"
      ],
      "keyExclusion": []
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "Not separately quantified in reviewed abstract",
      "mortality": "6/502 (1.2%) versus 10/495 (2.0%)",
      "other": "Serious adverse events 8.6% versus 10.7%; adverse events 87.8% versus 88.7%"
    },
    "imagingCriteria": "Full eligibility protocol not reviewed",
    "applicabilityNotes": "Positive phase 3 functional result in a selected Chinese population, predominantly near the lower NIHSS threshold. Registry-listed criteria additionally required NIHSS motor items 5 and 6 to sum to at least 2. Prior IV thrombolysis was permitted, with NIHSS assessed after thrombolysis; thrombectomy or interventional therapy already applied or planned for the episode was excluded. These registry criteria do not establish efficacy alongside EVT. Replication and wider population applicability remain unresolved. Registry: https://clinicaltrials.gov/study/NCT06517173 (record updated 2026-07-07; accessed 2026-09-30).",
    "limitations": "Original abstract and selected registry-listed eligibility criteria compared; main tables, final publication protocol and supplement not comprehensively appraised. Eligibility list is nonexhaustive; registry wording is not confirmation of every criterion in the final analyzed population.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-lais-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Important recent neuroprotection evidence; retain as a trial summary, not a prescribing instruction or claim of guideline adoption.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Primary abstract, bibliographic identity and selected ClinicalTrials.gov NCT06517173 eligibility criteria compared 2026-09-30; registry record updated 2026-07-07. Full-card clinical verification is not claimed; final-paper eligibility concordance is not established.",
    "intervention": "Trial regimen: loberamisal 40 mg IV once daily for 10 days plus standard care",
    "comparator": "Matching placebo plus standard care",
    "primaryEndpoint": {
      "definition": "mRS 0–1",
      "timepoint": "90 days",
      "result": "350/502 (69.7%) versus 279/495 (56.3%)",
      "effectSize": "RR 1.24; risk difference 13.28 percentage points",
      "confidenceInterval": "RR 95% CI 1.12–1.36; risk difference 7.24–19.32 percentage points",
      "pValue": "Not specified in reviewed abstract"
    }
  }),
  t({
    "id": "erase-stroke-2026",
    "shortName": "ERASE-STROKE",
    "fullName": "Early and prolonged oral edaravone for neuroprotection in acute ischemic stroke: the ERASE-STROKE randomized controlled phase 3 trial.",
    "topic": "acute-neuroprotection",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-neuroprotection"
    ],
    "population": {
      "n": 614,
      "ageRange": "Not quantified in reviewed abstract",
      "nihssRange": "Disabling stroke; exact threshold not verified",
      "timeWindow": "Within 24 hours; treatment for 28 days",
      "keyInclusion": [
        "Disabling anterior-circulation ischemic stroke",
        "Intention-to-treat population 614"
      ],
      "keyExclusion": [
        "Reperfusion therapy"
      ]
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "No statistically detected difference; abstract does not provide counts/CI",
      "mortality": "No statistically detected difference; counts/CI not provided in reviewed abstract",
      "other": "Serious adverse events not significantly different; this does not establish safety equivalence"
    },
    "imagingCriteria": "Full eligibility protocol not reviewed",
    "applicabilityNotes": "Positive phase 3 result in disabling anterior stroke without reperfusion. Registry-listed criteria specify age 18–80 years, pre-stroke mRS 0–1, NIHSS 6–20 and a sum of at least 2 on NIHSS motor items 5 and 6. The registry excludes dysphagia and a history of atrial fibrillation or rheumatic heart disease; it also excludes scheduled or received IV thrombolysis and a need for endovascular treatment immediately or within 90 days. These are selected registry criteria, not a complete final-paper eligibility audit. The result does not support replacing or delaying indicated IVT/EVT, or extrapolating the regimen to reperfusion-treated patients. Registry: https://clinicaltrials.gov/study/NCT06648304 (record updated 2025-02-03; accessed 2026-09-30).",
    "limitations": "Original abstract and selected registry-listed eligibility criteria compared; main tables, final publication protocol and supplement not comprehensively appraised. Eligibility list is nonexhaustive; registry wording is not confirmation of every criterion in the final analyzed population.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-erase-stroke-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Recent evidence candidate for further appraisal; full eligibility, safety tables, availability and guideline adoption remain unconfirmed.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Primary abstract, bibliographic identity and selected ClinicalTrials.gov NCT06648304 eligibility criteria compared 2026-09-30; registry record updated 2025-02-03. Full-card clinical verification and final-paper eligibility concordance are not claimed.",
    "intervention": "Trial regimen: oral edaravone TTYP01 60 mg twice daily for 28 days plus standard care",
    "comparator": "Placebo plus standard care",
    "primaryEndpoint": {
      "definition": "mRS 0–1",
      "timepoint": "90 days",
      "result": "65.4% versus 47.1%",
      "effectSize": "OR 2.12",
      "confidenceInterval": "95% CI 1.53–2.94",
      "pValue": "P<.001"
    }
  }),
  t({
    "id": "atis-nvaf-2025",
    "shortName": "ATIS-NVAF",
    "fullName": "Optimal Antithrombotics for Ischemic Stroke and Concurrent Atrial Fibrillation and Atherosclerosis: A Randomized Clinical Trial.",
    "topic": "secondary-prevention",
    "diseaseArea": [
      "secondary-prevention",
      "secondary-prevention"
    ],
    "population": {
      "n": 316,
      "ageRange": "Mean 77.2 years",
      "nihssRange": "Not specified in reviewed abstract",
      "timeWindow": "Stroke/TIA 8–360 days before enrollment; two-year outcome",
      "keyInclusion": [
        "Nonvalvular AF and at least one atherosclerotic cardiovascular manifestation",
        "41 sites in Japan"
      ],
      "keyExclusion": []
    },
    "secondaryEndpoints": [
      {
        "name": "Ischemic cardiovascular events",
        "result": "11.1% versus 14.2%; HR 0.76 (95% CI 0.39–1.48), P=.41"
      }
    ],
    "safetyFindings": {
      "sich": "Not separately quantified in reviewed abstract",
      "mortality": "Not separately quantified in reviewed abstract",
      "other": "Major or clinically relevant nonmajor bleeding 19.5% versus 8.6%; HR 2.42 (95% CI 1.23–4.76), P=.008"
    },
    "imagingCriteria": "Full eligibility protocol not reviewed",
    "applicabilityNotes": "Adding an antiplatelet did not demonstrate net benefit and increased clinically relevant bleeding in this selected AF-plus-atherosclerosis population. Registry-listed criteria include age ≥20 years and mRS ≤4. Exclusions include myocardial infarction or acute coronary syndrome within 12 months, drug-eluting coronary stenting within 12 months, bare-metal coronary stenting within 3 months, carotid/intracranial/lower-extremity stenting within 3 months, and symptomatic intracranial hemorrhage or gastrointestinal bleeding within 6 months. Acute coronary/stent indications therefore require their own evidence. These selected registry criteria do not replace a complete final-paper eligibility appraisal. Registry: https://clinicaltrials.gov/study/NCT03062319 (record updated 2024-12-27; accessed 2026-09-30).",
    "limitations": "Small open-label Japanese trial, early futility termination and wide efficacy intervals. Abstract chronology is internally awkward; selected registry-listed eligibility criteria were compared, but the main report, final publication protocol and supplement remain incompletely appraised.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-atis-nvaf-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports caution about routine combined antiplatelet and anticoagulant therapy solely for coexisting atherosclerosis after stroke. It does not establish absence of benefit for every separate antiplatelet indication.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Primary abstract, bibliographic identity and selected ClinicalTrials.gov NCT03062319 eligibility criteria compared 2026-09-30; registry record updated 2024-12-27. Full-card clinical verification and final-paper eligibility concordance are not claimed.",
    "intervention": "Anticoagulant plus antiplatelet therapy (159 randomized)",
    "comparator": "Anticoagulant monotherapy (157 randomized)",
    "primaryEndpoint": {
      "definition": "Composite ischemic cardiovascular events and major bleeding",
      "timepoint": "Two years",
      "result": "17.8% versus 19.6%; stopped for futility",
      "effectSize": "HR 0.91",
      "confidenceInterval": "95% CI 0.53–1.55",
      "pValue": "P=.64"
    }
  }),
  // ------------------- Tenecteplase vs alteplase -------------------
  t({
    id: 'act',
    shortName: 'AcT',
    fullName: 'Intravenous Tenecteplase Compared with Alteplase for Acute Ischaemic Stroke in Canada',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
    population: {
      n: 1577,
      ageRange: 'adults ≥18',
      nihssRange: 'all eligible',
      timeWindow: '≤4.5 h',
      keyInclusion: ['IVT-eligible AIS within 4.5 h'],
      keyExclusion: ['Standard alteplase contraindications']
    },
    intervention: 'Tenecteplase 0.25 mg/kg (max 25 mg) IV bolus',
    comparator: 'Alteplase 0.9 mg/kg IV (10% bolus + 60-min infusion)',
    primaryEndpoint: {
      definition: 'mRS 0-1 at 90-120 days',
      timepoint: '90-120 d',
      result: 'Non-inferior: 36.9% (TNK) vs 34.8% (alteplase)',
      effectSize: 'Risk difference 2.1%',
      confidenceInterval: '95% CI -2.6% to 6.9%',
      pValue: 'Non-inferiority margin met'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic ICH', result: 'Similar between groups' },
      { name: '90-day mortality', result: 'Similar' }
    ],
    safetyFindings: { sich: 'Similar to alteplase', mortality: 'Similar', other: '' },
    imagingCriteria: 'Standard CT-based selection',
    applicabilityNotes: 'Pragmatic, registry-linked non-inferiority trial — supports TNK 0.25 mg/kg as a reasonable alternative to alteplase for IVT-eligible AIS within 4.5 h. About one-third of patients went on to EVT, but AcT was not designed to show an EVT-specific advantage (that signal comes from EXTEND-IA TNK).',
    limitations: 'Open-label; primary endpoint included mRS 0-1 only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-act-2022'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Supports TNK 0.25 mg/kg (max 25 mg) as a reasonable alternative to alteplase 0.9 mg/kg for IVT-eligible AIS within 4.5 h (non-inferior on mRS 0-1); the 2026 AHA/ASA AIS guideline recommends either agent (COR 1).',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'trace-2',
    shortName: 'TRACE-2',
    fullName: 'Tenecteplase Reperfusion Therapy in Acute Ischemic Cerebrovascular Events-II',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
    population: { n: 1430, ageRange: '≥18', nihssRange: '5-25', timeWindow: '≤4.5 h', keyInclusion: ['IVT-eligible within 4.5 h', 'Pre-stroke mRS 0-1'], keyExclusion: ['Intended EVT (only EVT-ineligible or EVT-declining patients enrolled)'] },
    intervention: 'Tenecteplase 0.25 mg/kg',
    comparator: 'Alteplase 0.9 mg/kg',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Non-inferior: 62% (439/705, TNK) vs 58% (405/696, alteplase)', effectSize: 'RR 1.07', confidenceInterval: '95% CI 0.98 to 1.16', pValue: 'Non-inferiority met' },
    secondaryEndpoints: [{ name: 'sICH', result: 'Similar' }],
    safetyFindings: { sich: '2% (15/711, TNK) vs 2% (13/706, alteplase) within 36 h; RR 1.18, 95% CI 0.56-2.50', mortality: '7% (46, TNK) vs 5% (35, alteplase) at 90 d; RR 1.31, 95% CI 0.86-2.01 (not statistically significant)', other: '' },
    imagingCriteria: 'NIHSS-driven, NCCT',
    applicabilityNotes: 'External validity in East Asian population.',
    limitations: 'Open-label with blinded endpoint assessment; enrolled only patients not intended for EVT (ineligible for or declined thrombectomy); single country (53 centres in China); used rhTNK-tPA, a recombinant tenecteplase produced in China.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-trace2-2023'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Confirms non-inferiority of TNK 0.25 mg/kg vs alteplase in IVT-eligible AIS within 4.5 h in patients ineligible for or declining EVT.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 37003696 (https://doi.org/10.1016/S0140-6736(23)00627-X).",
  }),
  t({
    id: 'original',
    shortName: 'ORIGINAL',
    fullName: 'Tenecteplase vs Alteplase for Patients With Acute Ischemic Stroke (ORIGINAL)',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 1489, ageRange: '≥18', nihssRange: '1-25', timeWindow: '≤4.5 h', keyInclusion: ['IVT-eligible AIS within 4.5 h'], keyExclusion: ['Standard contraindications'] },
    intervention: 'TNK 0.25 mg/kg',
    comparator: 'Alteplase 0.9 mg/kg',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Non-inferior: 72.7% (532/732, TNK) vs 70.3% (515/733, alteplase)', effectSize: 'RR 1.03', confidenceInterval: '95% CI 0.97 to 1.09', pValue: 'Non-inferiority met' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: 'NCCT',
    applicabilityNotes: '',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-original-2024'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Adds further RCT support (non-inferiority, China) for TNK 0.25 mg/kg as a suitable alternative to alteplase within 4.5 h; sICH 1.2% in each group.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Late window IVT -------------------
  t({
    id: 'wake-up',
    shortName: 'WAKE-UP',
    fullName: 'MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset',
    topic: 'wake-up-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'wake-up-stroke', 'extended-window-ivt'],
    population: { n: 503, ageRange: '18-80', nihssRange: '≤25', timeWindow: 'unknown onset (last seen well >4.5 h)', keyInclusion: ['DWI-FLAIR mismatch on MRI', 'Pre-stroke mRS 0-1'], keyExclusion: ['Planned thrombectomy'] },
    intervention: 'IV alteplase 0.9 mg/kg',
    comparator: 'Placebo / standard care',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Favored alteplase: 53.3% vs 41.8%', effectSize: 'OR 1.61', confidenceInterval: '95% CI 1.09 to 2.36', pValue: 'p=0.02' },
    secondaryEndpoints: [{ name: 'Mortality at 90 d', result: 'Numerically higher with alteplase, not significant' }],
    safetyFindings: { sich: '2.0% (alteplase) vs 0.4% (control)', mortality: '4.1% vs 1.2%', other: 'Trial halted early for funding' },
    imagingCriteria: 'DWI-FLAIR mismatch on MRI',
    applicabilityNotes: 'Applies to MRI-equipped centers; supports MRI-based selection in unknown-onset stroke.',
    limitations: 'Early termination; modest absolute benefit with non-trivial sICH increase.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-wake-up-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Foundational evidence for imaging-selected thrombolysis in wake-up / unknown onset stroke.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'extend',
    shortName: 'EXTEND',
    fullName: 'Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 225, ageRange: '≥18', nihssRange: '4-26', timeWindow: '4.5-9 h or wake-up', keyInclusion: ['Perfusion-imaging mismatch (core <70 mL, mismatch ratio >1.2, mismatch volume >10 mL)'], keyExclusion: ['LVO with planned EVT'] },
    intervention: 'IV alteplase 0.9 mg/kg',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Favored alteplase: 35.4% vs 29.5%', effectSize: 'Adjusted RR 1.44', confidenceInterval: '95% CI 1.01 to 2.06', pValue: 'p=0.04' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '6.2% (alteplase) vs 0.9% (placebo)', mortality: '11.5% vs 8.9%', other: '' },
    imagingCriteria: 'CTP / MR-PWI core-mismatch',
    applicabilityNotes: 'LVO was not required for entry, but most enrolled patients had perfusion mismatch due to a major artery occlusion (patients deemed eligible for endovascular clot retrieval were excluded); provides direct evidence for perfusion-mismatch-selected alteplase at 4.5-9 h or on waking when EVT is not planned.',
    limitations: 'Stopped early after WAKE-UP results; modest sample size.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-extend-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports perfusion-mismatch IVT in 4.5-9 h window when EVT not indicated.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 33789024 (https://doi.org/10.1056/NEJMx200014).",
  }),
  t({
    id: 'epithet',
    shortName: 'EPITHET',
    fullName: 'Echoplanar Imaging Thrombolytic Evaluation Trial',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 101, ageRange: '≥18', nihssRange: '>4', timeWindow: '3-6 h', keyInclusion: ['Hemispheric AIS 3-6 h; randomized regardless of mismatch (86% had PWI/DWI mismatch; primary analysis in mismatch patients)'], keyExclusion: [] },
    intervention: 'IV alteplase',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'Infarct growth at 90 d', timepoint: '90 d', result: 'Primary endpoint not met: infarct growth non-significantly lower with alteplase; reperfusion significantly more common', effectSize: 'Geometric mean infarct growth ratio 0.69', confidenceInterval: '95% CI 0.38 to 1.28', pValue: 'p=0.239' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'PWI/DWI mismatch',
    applicabilityNotes: 'Hypothesis-generating for mismatch-based selection.',
    limitations: 'Small; surrogate endpoint primary.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-epithet-2008'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Conceptual basis for later mismatch-based late-window trials.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ecass4-extend',
    shortName: 'ECASS4-EXTEND',
    fullName: 'Extending the Time Window for IV Thrombolysis Using MRI-based Selection',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 119, ageRange: '≥18 (upper limit needs confirmation)', nihssRange: '4-26', timeWindow: '4.5-9 h or unknown onset', keyInclusion: ['MRI PWI/DWI mismatch: ratio >1.2, perfusion lesion ≥20 mL, core <100 mL', 'Pre-stroke mRS 0-1'], keyExclusion: [] },
    intervention: 'IV alteplase',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS distribution (ordinal shift) at 90 d', timepoint: '90 d', result: 'Favored alteplase numerically; not statistically significant after early termination', effectSize: 'OR 1.20 (alteplase vs placebo)', confidenceInterval: '95% CI 0.63 to 2.27', pValue: 'p=0.58' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'MRI mismatch',
    applicabilityNotes: 'Trial stopped early for slow recruitment after 119 of 264 planned patients.',
    limitations: 'Underpowered after early stop.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-ecass4-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds to the late-window mismatch evidence base; not independently practice-changing.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'timeless',
    shortName: 'TIMELESS',
    fullName: 'Tenecteplase for Stroke at 4.5 to 24 Hours with Perfusion-Imaging Selection',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt', 'tnk-vs-alteplase'],
    population: { n: 458, ageRange: '≥18', nihssRange: '≥5', timeWindow: '4.5-24 h', keyInclusion: ['Anterior LVO + salvageable tissue (CTP mismatch)'], keyExclusion: [] },
    intervention: 'TNK 0.25 mg/kg IV',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored TNK numerically; primary endpoint did not reach significance overall', effectSize: 'Adjusted common OR 1.13', confidenceInterval: '95% CI 0.82 to 1.57', pValue: 'p=0.45 (overall)' },
    secondaryEndpoints: [{ name: 'Pre-EVT reperfusion', result: 'Higher with TNK' }],
    safetyFindings: { sich: '3.2% (TNK) vs 2.3% (placebo)', mortality: 'Similar', other: '' },
    imagingCriteria: 'CTP mismatch, RAPID',
    applicabilityNotes: 'Population had high EVT use; benefit may have been masked.',
    limitations: 'Statistically non-significant primary; subgroup signals only.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-timeless-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Cautionary: late-window TNK alone (with EVT permitted) did not meet its primary endpoint.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "twist",
    "shortName": "TWIST",
    "fullName": "Tenecteplase in Wake-up Ischaemic Stroke Trial",
    "topic": "wake-up-stroke",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "wake-up-stroke"
    ],
    "population": {
      "n": 578,
      "ageRange": "≥18",
      "nihssRange": "≥3 or aphasia, with limb weakness",
      "timeWindow": "wake-up <4.5 h after waking",
      "keyInclusion": [
        "Wake-up AIS, NCCT-only selection"
      ],
      "keyExclusion": []
    },
    "intervention": "TNK 0.25 mg/kg",
    "comparator": "Standard care",
    "primaryEndpoint": {
      "definition": "mRS shift at 90 d",
      "timepoint": "90 d",
      "result": "No significant benefit overall",
      "effectSize": "Adjusted OR 1.18",
      "confidenceInterval": "95% CI 0.88 to 1.58",
      "pValue": "p=0.27"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "6/288 versus 3/290; adjusted OR 2.17 (95% CI 0.53–8.87)",
      "mortality": "90-day mortality 9.7% versus 7.9%; adjusted HR 1.29 (95% CI 0.74–2.26)",
      "other": ""
    },
    "imagingCriteria": "NCCT only (no advanced imaging)",
    "applicabilityNotes": "The NCCT-selected wake-up TNK strategy did not significantly improve the primary outcome. The trial did not randomize imaging strategies, so neutrality does not establish advanced imaging as a universally necessary condition for benefit.",
    "limitations": "Open-label; no advanced imaging.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-twist-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not establish routine benefit for this tested wake-up strategy. Retain wide efficacy and safety uncertainty and distinguish evidence for specific imaging-selected trials from a proof that other selection cannot work.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "trace-iii",
    "shortName": "TRACE-III",
    "fullName": "Tenecteplase for Ischemic Stroke 4.5-24 Hours without Thrombectomy",
    "topic": "extended-window-ivt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "extended-window-ivt"
    ],
    "population": {
      "n": 516,
      "ageRange": "≥18",
      "nihssRange": "6-25",
      "timeWindow": "4.5-24 h",
      "keyInclusion": [
        "LVO without planned EVT",
        "Salvageable tissue (perfusion mismatch)"
      ],
      "keyExclusion": [
        "EVT planned or available"
      ]
    },
    "intervention": "TNK 0.25 mg/kg",
    "comparator": "Standard care",
    "primaryEndpoint": {
      "definition": "mRS 0-1 at 90 d",
      "timepoint": "90 d",
      "result": "Favored TNK: 33.0% vs 24.2%",
      "effectSize": "RR 1.37",
      "confidenceInterval": "95% CI 1.04 to 1.81",
      "pValue": "p=0.03"
    },
    "secondaryEndpoints": [
      {
        "name": "sICH",
        "result": "3.0% (TNK) vs 0.8% (control)"
      }
    ],
    "safetyFindings": {
      "sich": "3.0% vs 0.8%",
      "mortality": "Similar",
      "other": ""
    },
    "imagingCriteria": "CTP mismatch / penumbra",
    "applicabilityNotes": "Selected late-window LVO population without access to EVT; not proof that every enrolled patient was physiologically ineligible for EVT. A small proportion later received rescue EVT.",
    "limitations": "Single-region (China); needs replication.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-trace-iii-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports the tested perfusion-selected late-window TNK strategy where EVT was unavailable, within the trial selection and bleeding trade-off.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "verificationNotes": "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified."
  }),

  // ------------------- EVT large-core / late window -------------------
  t({
    id: 'select2',
    shortName: 'SELECT2',
    fullName: 'Trial of Endovascular Thrombectomy for Large Ischemic Strokes',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 352, ageRange: '18-85', nihssRange: '≥6', timeWindow: '≤24 h', keyInclusion: ['ASPECTS 3-5 or core volume ≥50 mL'], keyExclusion: [] },
    intervention: 'EVT plus medical therapy',
    comparator: 'Medical therapy alone',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored EVT (generalized OR 1.51)', effectSize: 'OR 1.51', confidenceInterval: '95% CI 1.20 to 1.89', pValue: 'p<0.001' },
    secondaryEndpoints: [{ name: 'mRS 0-3', result: 'Higher with EVT' }],
    safetyFindings: { sich: '0.6% (EVT) vs 1.1% (control)', mortality: 'Similar', other: 'Vascular complications more frequent with EVT' },
    imagingCriteria: 'CT or MRI; ASPECTS 3-5 or core volume ≥50 mL',
    applicabilityNotes: 'Establishes EVT benefit for large-core anterior-circulation LVO up to 24 h.',
    limitations: 'Open-label; modest absolute benefit at lower ASPECTS.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-select2-2023'],
    relatedActiveTrialIds: ['tested'],
    practiceImpact: 'Supports EVT for large-core; large core is no longer an automatic exclusion.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'angel-aspect',
    shortName: 'ANGEL-ASPECT',
    fullName: 'Endovascular Therapy for Acute Ischemic Stroke with Large Infarct',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 456, ageRange: '18-80', nihssRange: '6-30', timeWindow: '≤24 h', keyInclusion: ['ASPECTS 3-5 or core 70-100 mL'], keyExclusion: [] },
    intervention: 'EVT + medical management',
    comparator: 'Medical management',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored EVT', effectSize: 'OR 1.37', confidenceInterval: '95% CI 1.11 to 1.69', pValue: 'p=0.004' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '6.1% vs 2.7%', mortality: 'Similar', other: '' },
    imagingCriteria: 'ASPECTS 3-5 or core 70-100 mL',
    applicabilityNotes: 'Chinese population; complementary to SELECT2.',
    limitations: 'Open-label.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-angel-aspect-2023'],
    relatedActiveTrialIds: ['tested'],
    practiceImpact: 'Confirms EVT benefit in large-core population.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'rescue-japan-limit',
    shortName: 'RESCUE-Japan LIMIT',
    fullName: 'Endovascular Therapy for Acute Stroke with Large Ischemic Region',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 203, ageRange: '≥18', nihssRange: '≥6', timeWindow: '≤6 h from LKW, or 6-24 h if no FLAIR change', keyInclusion: ['ICA or M1 occlusion', 'ASPECTS 3-5 on CT or DWI (predominantly MRI-based)'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'mRS 0-3 at 90 d', timepoint: '90 d', result: '31.0% (EVT) vs 12.7% (control)', effectSize: 'RR 2.43', confidenceInterval: '95% CI 1.35 to 4.37', pValue: 'p=0.002' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '9.0% vs 4.9%', mortality: 'Similar', other: '' },
    imagingCriteria: 'CT- or DWI-ASPECTS 3-5 (predominantly MRI); FLAIR-negative if 6-24 h',
    applicabilityNotes: 'Established large-core EVT benefit pre-SELECT2 / ANGEL-ASPECT.',
    limitations: 'Single-country.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-rescue-japan-2022'],
    relatedActiveTrialIds: ['tested'],
    practiceImpact: 'First major RCT to support large-core EVT.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'tension',
    shortName: 'TENSION',
    fullName: 'Endovascular Thrombectomy for AIS with Established Large Infarct',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 253, ageRange: '≥18', nihssRange: '<26', timeWindow: '≤12 h from onset or last seen well', keyInclusion: ['ASPECTS 3-5'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored EVT', effectSize: 'Adjusted common OR 2.58', confidenceInterval: '95% CI 1.60 to 4.15', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '5.6% (7/125, EVT) vs 4.7% (6/128, medical care)', mortality: 'Lower with EVT (HR 0.67, 95% CI 0.46-0.98; p=0.038)', other: '' },
    imagingCriteria: 'ASPECTS 3-5, ≤12 h',
    applicabilityNotes: '',
    limitations: 'Stopped early for efficacy.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-tension-2023'],
    relatedActiveTrialIds: ['tested'],
    practiceImpact: 'European replication of large-core EVT benefit.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  // ------------------- EVT for basilar-artery occlusion -------------------
  t({
    id: 'attention',
    shortName: 'ATTENTION',
    fullName: 'Endovascular Treatment of Acute Basilar-Artery Occlusion — 90-Day, 1-Year and 3-Year Outcomes',
    topic: 'evt-basilar',
    diseaseArea: [
      'acute-ischemic-stroke',
      'evt-basilar'
    ],
    population: {
      n: 340,
      ageRange: '≥18',
      nihssRange: '≥10',
      timeWindow: '≤12 h from estimated time of basilar-artery occlusion',
      keyInclusion: [
        'Basilar-artery occlusion confirmed by CTA/MRA/DSA',
        'NIHSS ≥10 at the time of neuroimaging',
        'Randomised 2:1 at 36 centres in China; 342 randomised (per the 1-year report), 340 in the intention-to-treat population (226 EVT, 114 control)'
      ],
      keyExclusion: [
        'pc-ASPECTS <6 if age <80 y (<8 if age ≥80 y)',
        'Pre-stroke mRS ≥3 if age <80 y (≥1 if age ≥80 y)',
        'Complete bilateral thalamic or bilateral brainstem infarction',
        'Bilateral mydriasis',
        'Cerebellar infarction with mass effect compressing the fourth ventricle',
        'Occlusion of both anterior and posterior circulation'
      ]
    },
    intervention: 'Endovascular thrombectomy + best medical care (n=226)',
    comparator: 'Best medical care alone (n=114)',
    primaryEndpoint: {
      definition: 'Good functional status (mRS 0-3) at 90 d',
      timepoint: '90 d',
      result: 'Favored EVT: 104/226 (46%) vs 26/114 (23%)',
      effectSize: 'Adjusted rate ratio 2.06',
      confidenceInterval: '95% CI 1.46 to 2.91',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [
      {
        name: '1-year mRS 0-3 (JAMA Neurol 2024 extension; 330 of 342 randomised [96.5%] with 1-year data)',
        result: '99/222 (44.6%) vs 21/108 (19.4%); adjusted rate ratio 2.23 (95% CI 1.51-3.29)'
      },
      {
        name: '1-year excellent outcome (mRS 0-1)',
        result: '62/222 (27.9%) vs 9/108 (8.3%); rose from 90 d in the EVT arm (45/226 [19.9%]) but not in the control arm (9/114 [7.9%])'
      },
      {
        name: '1-year mortality',
        result: '101/222 (45.5%) vs 69/108 (63.9%), up from 83/226 (36.7%) vs 63/114 (55.3%) at 90 d; no effect estimate given in the abstract'
      },
      {
        name: '3-year mRS 0-3 (JAMA Neurol 2026 extension primary outcome; 307 of 340 [90.3%] with 3-year data)',
        result: '78/203 (38.4%) vs 19/104 (18.3%); adjusted risk ratio 2.05 (95% CI 1.35-3.11), P=.001'
      },
      {
        name: '3-year mRS distribution (ordinal shift)',
        result: 'Favored EVT: adjusted common odds ratio 2.60 (95% CI 1.53-4.43)'
      },
      {
        name: '3-year cumulative mortality',
        result: '113/203 (55.7%) vs 76/104 (73.1%); adjusted risk ratio 0.76 (95% CI 0.65-0.89)'
      },
      {
        name: '3-year prespecified age subgroup',
        result: 'Benefit observed in patients <70 y; a treatment effect was not demonstrated in patients ≥70 y (subgroup estimates not given in the abstract)'
      },
      {
        name: '3-year mRS 0-2 and quality of life',
        result: 'Prespecified secondary outcomes; values not reported in the abstract (full text not retrievable) — not recorded here'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage 12/226 (5%) vs 0/114 (0%)',
      mortality: '90 d: 37% vs 55% (adjusted RR 0.66, 95% CI 0.52-0.82); 1 y: 101/222 (45.5%) vs 69/108 (63.9%); cumulative 3 y: 113/203 (55.7%) vs 76/104 (73.1%) (adjusted RR 0.76, 95% CI 0.65-0.89)',
      other: 'Procedural complications in 14% of the EVT group, including one death from arterial perforation'
    },
    imagingCriteria: 'CTA/MRA/DSA-confirmed basilar-artery occlusion ≤12 h; pc-ASPECTS ≥6 (≥8 if age ≥80 y) on CT, CTA source images or MRI-DWI; no complete bilateral thalamic or brainstem infarction',
    applicabilityNotes: 'Chinese population (36 centres); NIHSS ≥10 within 12 h with pc-ASPECTS ≥6 (≥8 if ≥80 y); about one third received IV thrombolysis. The 1-year (JAMA Neurol 2024) and 3-year (JAMA Neurol 2026) reports are follow-up extensions of this same randomised cohort, not independent trials — never count them as additional evidence alongside ATTENTION. Their contribution is durability: mRS 0-3 remained about twice as frequent with EVT at 1 year (44.6% vs 19.4%) and 3 years (38.4% vs 18.3%); mortality rose in both arms over time but stayed lower with EVT; and the mRS 0-1 gap widened between 90 days and 1 year. At 3 years a treatment effect was not demonstrated in the prespecified subgroup aged ≥70 years — an exploratory subgroup finding without published estimates in the abstract, which is not evidence of no benefit in older patients. Patients with NIHSS <10 were not enrolled, so ATTENTION does not inform milder BAO.',
    limitations: 'Open-label treatment with blinded outcome assessment (PROBE); conducted entirely in China, so transportability to other populations is uncertain; NIHSS ≥10 required, so milder BAO is not addressed. The long-term reports are complete-case analyses of patients with available follow-up (1 year: 330 of the 342 randomised, 96.5%; 3 years: 307 of the 340-patient intention-to-treat population, 90.3%), and the age-subgroup finding is exploratory. Outcomes beyond 90 days are not among those listed in the NCT04751708 registry record; the 3-year extension was registered separately (ChiCTR2400082236). The 3-year report\'s Key Points give n=303 while its Results give n=307.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: [
      'cit-attention-2022',
      'cit-attention-1y-2024',
      'cit-attention-3y-2026'
    ],
    relatedActiveTrialIds: [],
    practiceImpact: 'Established EVT benefit for basilar-artery occlusion with NIHSS ≥10 within 12 h; the 1- and 3-year extensions show the functional benefit and lower mortality persist rather than fading after 90 days.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "2026-09-26 re-verification (independently re-checked): 90-day figures against the NEJM abstract (PMID 36239644); eligibility thresholds and registered outcomes (all ≤90 days) from ClinicalTrials.gov NCT04751708; 1-year figures from the JAMA Neurol 2024 abstract (PMID 39186280); 3-year figures from the JAMA Neurol 2026 abstract (PMID 41460644; extension registered ChiCTR2400082236). PMC returned abstract and Key Points only, so 3-year mRS 0-2, quality-of-life and age-subgroup estimates are not recorded. The earlier limitation \"stopped early\" is not supported by the NEJM abstract, the protocol abstract (PMID 35102797), the registry (status Completed, enrollment 340) or the 1-year report (342 randomised) and is dropped; confirm against the NEJM Methods (sample-size section) at the next full-text review. The BAOCHE abstract (PMID 36239645), by contrast, states enrollment was halted at a prespecified interim analysis. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'baoche',
    shortName: 'BAOCHE',
    fullName: 'Thrombectomy 6 to 24 Hours after Stroke Due to Basilar-Artery Occlusion',
    topic: 'evt-basilar',
    diseaseArea: ['acute-ischemic-stroke', 'evt-basilar'],
    population: { n: 217, ageRange: '18-80', nihssRange: '≥6', timeWindow: '6-24 h', keyInclusion: ['Basilar-artery occlusion', 'posterior-circulation ASPECTS criteria'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'Good functional status (mRS 0-3) at 90 d', timepoint: '90 d', result: 'Favored EVT: 46% vs 24%', effectSize: 'Adjusted rate ratio 1.81', confidenceInterval: '95% CI 1.26 to 2.60', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '~6% vs 1%', mortality: '31% vs 42% (adjusted RR 0.75, 95% CI 0.54-1.04; not significant)', other: '' },
    imagingCriteria: 'Basilar-artery occlusion, 6-24 h from estimated onset',
    applicabilityNotes: 'Extends basilar EVT to the 6-24 h window.',
    limitations: 'Open-label; conducted in China; enrollment halted at a prespecified interim analysis for superiority; the original primary outcome (mRS 0-4 at 90 d: 55% vs 43%, adjusted rate ratio 1.21, 95% CI 0.95-1.54) was changed to mRS 0-3.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-baoche-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Extends EVT benefit for basilar-artery occlusion to 6-24 h.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'dawn',
    shortName: 'DAWN',
    fullName: 'Thrombectomy 6 to 24 Hours after Stroke with Mismatch between Deficit and Infarct',
    topic: 'evt-late-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-late-window'],
    population: { n: 206, ageRange: '≥18', nihssRange: '≥10', timeWindow: '6-24 h', keyInclusion: ['Clinical-core mismatch'], keyExclusion: [] },
    intervention: 'EVT',
    comparator: 'Medical therapy',
    primaryEndpoint: { definition: 'Coprimary: mean utility-weighted mRS and functional independence (mRS 0-2) at 90 d', timepoint: '90 d', result: 'Favored EVT: 49% vs 13% (functional independence)', effectSize: 'Adjusted difference 33 percentage points', confidenceInterval: '95% credible interval 24 to 44 percentage points', pValue: 'Posterior probability of superiority >0.999 (Bayesian)' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '6% vs 3%', mortality: 'Similar', other: '' },
    imagingCriteria: 'Clinical-core mismatch (NIHSS-based)',
    applicabilityNotes: 'Established late-window EVT.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-dawn-2018'],
    relatedActiveTrialIds: ['step-evt'],
    practiceImpact: 'Foundational evidence for late-window EVT.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'defuse-3',
    shortName: 'DEFUSE-3',
    fullName: 'Thrombectomy at 6-16 Hours with Selection by Perfusion Imaging',
    topic: 'evt-late-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-late-window'],
    population: { n: 182, ageRange: '18-90', nihssRange: '≥6', timeWindow: '6-16 h', keyInclusion: ['Core <70 mL, mismatch ratio ≥1.8, mismatch volume ≥15 mL'], keyExclusion: [] },
    intervention: 'EVT',
    comparator: 'Medical therapy',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored EVT', effectSize: 'OR 2.77', confidenceInterval: '95% CI 1.63 to 4.70', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '7% vs 4%', mortality: '14% vs 26%', other: '' },
    imagingCriteria: 'CTP / MR-PWI mismatch',
    applicabilityNotes: '',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-defuse3-2018'],
    relatedActiveTrialIds: ['step-evt'],
    practiceImpact: 'Established perfusion-mismatch criteria for late-window EVT.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- IA adjunct after EVT -------------------
  t({
    "id": "choice",
    "shortName": "CHOICE",
    "fullName": "Intra-arterial Alteplase Following Successful Thrombectomy",
    "topic": "ia-adjunct-after-evt",
    "diseaseArea": [
      "acute-ischemic-stroke"
    ],
    "population": {
      "n": 121,
      "ageRange": "≥18",
      "nihssRange": "Admission NIHSS ≤25",
      "timeWindow": "EVT within 24 hours of last known well; study drug after successful reperfusion",
      "keyInclusion": [
        "Successful EVT (mTICI 2b/3)"
      ],
      "keyExclusion": [
        "Admission NIHSS >25 or contraindication to alteplase"
      ]
    },
    "intervention": "Intra-arterial alteplase (post-EVT)",
    "comparator": "Placebo",
    "primaryEndpoint": {
      "definition": "mRS 0-1 at 90 d",
      "timepoint": "90 d",
      "result": "Favored alteplase: 59.0% (36/61) vs 40.4% (21/52)",
      "effectSize": "Adjusted risk difference 18.4 percentage points",
      "confidenceInterval": "95% CI 0.3 to 36.4 percentage points",
      "pValue": "p=0.047"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "No significant increase",
      "mortality": "Similar",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Hypothesis-generating phase 2b trial (terminated early). Replication has since reported: PEARL (JAMA 2025; n=324; China) and CHOICE-2 (JAMA 2026; n=440; Spain) both found higher mRS 0-1 with IA alteplase 0.225 mg/kg (max 20 mg), but 90-day mortality was higher with IA alteplase (CHOICE-2 12.1% vs 6.4%, P=.03; PEARL 17.1% vs 11.3%, not significant). POST-UK (IA urokinase) and POST-TNK (IA tenecteplase) (JAMA 2025) did not meet their primary endpoints.",
    "limitations": "Small; stopped early. 121 randomized, but 113 treated as randomized in the primary analysis.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-choice-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "IA alteplase after successful EVT may improve outcomes; not yet standard of care.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- CRAO -------------------
  t({
    id: 'theia',
    shortName: 'THEIA',
    fullName: 'Thrombolysis for Central Retinal Artery Occlusion',
    topic: 'crao-thrombolysis',
    diseaseArea: ['crao-thrombolysis'],
    population: { n: 70, ageRange: '≥18', nihssRange: 'n/a', timeWindow: '≤4.5 h from severe vision loss', keyInclusion: ['Non-arteritic acute CRAO with severe vision loss (Snellen <20/400)'], keyExclusion: [] },
    intervention: 'IV alteplase 0.9 mg/kg',
    comparator: 'Oral aspirin 300 mg (double-dummy with IV saline placebo)',
    primaryEndpoint: { definition: 'Improvement in visual acuity ≥0.3 LogMAR from baseline', timepoint: '1 month', result: 'No significant benefit: 19/29 (66%) vs 13/27 (48%)', effectSize: 'Adjusted OR 1.1', confidenceInterval: '95% CI 0.07 to 18.39', pValue: 'p=0.95' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'No symptomatic hemorrhage related to study treatment; 1 asymptomatic ICH (alteplase group)', mortality: 'Not reported in the abstract', other: '' },
    imagingCriteria: 'Ophthalmologic exam',
    applicabilityNotes: 'CRAO thrombolysis remains investigational; benefit population-uncertain.',
    limitations: 'Small; underpowered.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-theia-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'THEIA was neutral (adjusted OR 1.1, 95% CI 0.07-18.39, p=0.95; underpowered) — CRAO thrombolysis remains unproven; do not present it as evidence-supported outside trials.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Primary endpoint numbers re-verified against PubMed 2026-08-22 (Lancet Neurol 2025;24(11):909-919, PMID 41109232): 19/29 (66%) vs 13/27 (48%), adjusted OR 1.1, p=0.95 — neutral. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  t({
    id: 'tencraos',
    shortName: 'TenCRAOS',
    fullName: 'A Randomized Trial of Tenecteplase in Acute Central Retinal Artery Occlusion',
    topic: 'crao-thrombolysis',
    diseaseArea: ['crao-thrombolysis'],
    population: { n: 78, ageRange: 'Adults', nihssRange: 'n/a', timeWindow: '≤4.5 h', keyInclusion: ['Acute nonarteritic CRAO'], keyExclusion: [] },
    intervention: 'IV tenecteplase 0.25 mg/kg with oral placebo',
    comparator: 'Oral aspirin 300 mg with IV placebo',
    primaryEndpoint: { definition: 'Affected-eye BCVA ≤0.7 logMAR (≥20/100)', timepoint: '30 days', result: 'No significant difference: 20% (8/40) vs 24% (9/38)', effectSize: 'Risk difference −3.7 percentage points', confidenceInterval: '95% CI −22.0 to 14.7', pValue: 'P=.69' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'One fatal intracranial hemorrhage in the tenecteplase group', mortality: '', other: 'More adverse events with tenecteplase' },
    imagingCriteria: 'Ophthalmic confirmation of CRAO',
    applicabilityNotes: 'Phase 3, double-blind, double-dummy trial at 16 sites in six countries.',
    limitations: 'Small trial; wide confidence interval. Abstract-level review; detailed exclusions require the full protocol.',
    certainty: 'low', evidenceType: 'rct', citationIds: ['cit-tencraos-2025'], relatedActiveTrialIds: [],
    practiceImpact: 'No demonstrated visual-recovery benefit; serious safety concerns. This is an evidence summary, not a treatment recommendation.',
    lastReviewed: '2026-09-06', verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- ICH -------------------
  t({
    "id": "interact3",
    "shortName": "INTERACT3",
    "fullName": "Third Intensive Care Bundle with Blood Pressure Reduction in Acute Cerebral Haemorrhage Trial (INTERACT3)",
    "topic": "ich-bp-management",
    "diseaseArea": [
      "ich",
      "ich-bp-management"
    ],
    "population": {
      "n": 7036,
      "ageRange": "≥18",
      "nihssRange": "n/a",
      "timeWindow": "<6 h from onset",
      "keyInclusion": [
        "Acute spontaneous ICH"
      ],
      "keyExclusion": [
        "ICH secondary to a structural lesion (AVM, aneurysm, tumour, trauma, prior infarct) or to reperfusion therapy"
      ]
    },
    "intervention": "Care bundle (SBP target <140 mmHg with a lower safety boundary of 130 mmHg within 1 h of starting treatment; glucose 6.1-7.8 mmol/L without diabetes, 7.8-10.0 mmol/L with diabetes; temperature <37.5°C; warfarin reversal to INR <1.5 within 1 h)",
    "comparator": "Usual care",
    "primaryEndpoint": {
      "definition": "mRS shift at 6 mo",
      "timepoint": "6 mo",
      "result": "Favored bundle",
      "effectSize": "Adjusted common OR 0.86",
      "confidenceInterval": "95% CI 0.76 to 0.97",
      "pValue": "p=0.015"
    },
    "secondaryEndpoints": [
      {
        "name": "Mortality at six months (secondary)",
        "result": "OR 0.77 (95% CI 0.63–0.95) in the reported analysis; additional covariate adjustment gave OR 0.84 (0.65–1.07), P=.16. Significance was not robust to secondary-outcome multiplicity control."
      }
    ],
    "safetyFindings": {
      "sich": "n/a",
      "mortality": "Reported OR 0.77 (95% CI 0.63–0.95); additionally covariate-adjusted OR 0.84 (0.65–1.07), P=.16. Secondary mortality evidence is analysis-dependent.",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The adjusted primary result supports the tested organized care bundle within its source and analytic limits. A change in time adjustment after unmasking and analysis-dependent mortality findings require explicit interpretation; benefit cannot be assigned to one component.",
    "limitations": "Cluster-randomized multifactorial bundle; individual component effects cannot be separated. After unmasking, the primary time adjustment changed from trial period to calendar time; the originally specified period model was neutral. Mortality significance did not persist with additional covariate adjustment or multiplicity control. No complete supplement appraisal.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-interact3-2023"
    ],
    "relatedActiveTrialIds": [
      "saturn"
    ],
    "practiceImpact": "Establishes care-bundle approach for acute ICH.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'annexa-i',
    shortName: 'ANNEXA-I',
    fullName: 'Andexanet for Factor Xa Inhibitor-Associated Acute ICH',
    topic: 'ich-anticoag-reversal',
    diseaseArea: ['ich', 'ich-anticoag-reversal'],
    population: { n: 530, ageRange: '≥18', nihssRange: 'n/a', timeWindow: '≤15 h from last FXa dose to randomization (or >15 h/unknown if anti-FXa >100 ng/mL); <6 h from symptom onset to baseline imaging; baseline scan ≤2 h before randomization', keyInclusion: ['ICH on apixaban/rivaroxaban/edoxaban'], keyExclusion: [] },
    intervention: 'Andexanet alfa',
    comparator: 'Usual care (predominantly 4F-PCC)',
    primaryEndpoint: { definition: 'Hemostatic efficacy at 12 h', timepoint: '12 h', result: 'Favored andexanet: 67.0% vs 53.1%', effectSize: 'Adjusted difference 13.4 percentage points', confidenceInterval: '95% CI 4.6 to 22.2', pValue: 'p=0.003' },
    secondaryEndpoints: [{ name: 'Thrombotic events at 30 d', result: '10.3% (andexanet) vs 5.6% (usual care)' }],
    safetyFindings: { sich: 'n/a', mortality: 'Similar at 30 d', other: 'More thrombotic events with andexanet' },
    imagingCriteria: '',
    applicabilityNotes: 'Hemostatic benefit comes with thrombotic-risk trade-off.',
    limitations: 'Open-label; usual care heterogeneous.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-annexa-i-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The 2022 AHA/ASA ICH guideline (published before ANNEXA-I) rated andexanet reasonable (COR 2a, LOE B-NR) for factor Xa inhibitor-associated ICH. ANNEXA-I showed better hemostatic efficacy than usual care (85.5% of usual-care patients received PCC) but more thrombotic events (10.3% vs 5.6%), including ischemic stroke (6.5% vs 1.5%), with no appreciable difference in modified Rankin scale score or death at 30 days. Andexanet (Andexxa) is no longer available in the US: it was withdrawn from the US market in December 2025 after the FDA concluded its risks, including thromboembolic events, outweigh its benefits. The 2026 Neurocritical Care Society/SCCM focused update conditionally recommends 4F-PCC rather than andexanet for factor Xa inhibitor-associated ICH.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'enrich',
    shortName: 'ENRICH',
    fullName: 'Early Minimally Invasive Removal of Intracerebral Hemorrhage',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: { n: 300, ageRange: '18-80', nihssRange: 'n/a', timeWindow: '≤24 h from onset', keyInclusion: ['Lobar or anterior basal ganglia ICH 30-80 mL, GCS 5-14 (lobar only after adaptation at n=175)'], keyExclusion: [] },
    intervention: 'Early minimally invasive parafascicular evacuation + standard care',
    comparator: 'Standard medical care',
    primaryEndpoint: { definition: 'Utility-weighted mRS at 180 d', timepoint: '180 d', result: 'Favored surgery (posterior probability of superiority 0.981; prespecified threshold ≥0.975)', effectSize: 'Mean difference 0.084 (0.458 vs 0.374)', confidenceInterval: '95% CrI 0.005 to 0.163', pValue: '' },
    secondaryEndpoints: [{ name: 'Mortality at 30 d', result: '9.3% (surgery) vs 18.0% (control)' }],
    safetyFindings: { sich: 'n/a', mortality: '9.3% (surgery) vs 18.0% (control) by 30 d', other: '' },
    imagingCriteria: 'CT-confirmed ICH 30-80 mL',
    applicabilityNotes: 'Adaptive design: after 175 patients an adaptation rule restricted enrollment to lobar ICH; benefit was not shown in anterior basal ganglia ICH (UW-mRS difference -0.013, 95% CrI -0.147 to 0.116). Thalamic and infratentorial ICH were excluded.',
    limitations: 'Open-label; specific device.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-enrich-2024'],
    relatedActiveTrialIds: ['saturn'],
    practiceImpact: 'Supports early minimally invasive evacuation for lobar ICH at capable centers.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- DAPT -------------------
  t({
    id: 'chance',
    shortName: 'CHANCE',
    fullName: 'Clopidogrel with Aspirin in Acute Minor Stroke or TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 5170, ageRange: '≥40', nihssRange: '≤3 (or high-risk TIA)', timeWindow: '≤24 h', keyInclusion: ['Minor stroke or high-risk TIA'], keyExclusion: ['Cardioembolic source'] },
    intervention: 'Clopidogrel 300 mg load then 75 mg/d for 90 d, plus aspirin 75 mg/d for the first 21 d',
    comparator: 'Aspirin alone x 90 d',
    primaryEndpoint: { definition: 'New stroke at 90 d', timepoint: '90 d', result: 'Favored DAPT: 8.2% vs 11.7%', effectSize: 'HR 0.68', confidenceInterval: '95% CI 0.57 to 0.81', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: 'Bleeding similar' },
    imagingCriteria: '',
    applicabilityNotes: 'Chinese population; ABCD² ≥4 or NIHSS ≤3.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-chance-2013'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Founding evidence for short-course DAPT in minor stroke / high-risk TIA.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'point',
    shortName: 'POINT',
    fullName: 'Clopidogrel and Aspirin in Acute Ischemic Stroke and High-Risk TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 4881, ageRange: '≥18', nihssRange: '≤3', timeWindow: '≤12 h', keyInclusion: ['Minor stroke or high-risk TIA'], keyExclusion: [] },
    intervention: 'Aspirin + clopidogrel x 90 days',
    comparator: 'Aspirin alone',
    primaryEndpoint: { definition: 'Major ischemic event at 90 d', timepoint: '90 d', result: 'Favored DAPT: 5.0% vs 6.5%', effectSize: 'HR 0.75', confidenceInterval: '95% CI 0.59 to 0.95', pValue: 'p=0.02' },
    secondaryEndpoints: [{ name: 'Major hemorrhage', result: 'Increased with DAPT (0.9% vs 0.4%)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Bleeding higher with DAPT' },
    imagingCriteria: '',
    applicabilityNotes: 'Benefit was front-loaded: major ischemic events HR 0.65 (95% CI 0.50-0.85) for days 0-21 vs HR 1.38 (95% CI 0.81-2.35) for days 22-90, while the major-hemorrhage rate stayed low but relatively constant through 90 days (Johnston, Circulation 2019; PMID 31238700) — the rationale for limiting DAPT to ~21 days.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-point-2018'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Reinforces 21-day cap on DAPT for minor stroke.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'thales',
    shortName: 'THALES',
    fullName: 'Ticagrelor and Aspirin or Aspirin Alone in AIS or TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 11016, ageRange: '≥40', nihssRange: '≤5', timeWindow: '≤24 h', keyInclusion: ['Mild/moderate AIS or high-risk TIA'], keyExclusion: ['Cardioembolic'] },
    intervention: 'Ticagrelor + aspirin x 30 d',
    comparator: 'Aspirin alone',
    primaryEndpoint: { definition: 'Stroke or death at 30 d', timepoint: '30 d', result: 'Favored DAPT: 5.5% vs 6.6%', effectSize: 'HR 0.83', confidenceInterval: '95% CI 0.71 to 0.96', pValue: 'p=0.02' },
    secondaryEndpoints: [{ name: 'Severe bleeding', result: '0.5% vs 0.1%' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Severe bleeding higher with DAPT' },
    imagingCriteria: '',
    applicabilityNotes: 'Ticagrelor-based alternative to clopidogrel-based DAPT.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-thales-2020'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Supports 30-day ticagrelor-aspirin as an alternative DAPT regimen (fewer 30-day stroke/death events, no difference in disability, more severe bleeding); THALES did not select patients by CYP2C19 genotype — evidence in loss-of-function carriers comes from CHANCE-2.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'inspires',
    shortName: 'INSPIRES',
    fullName: 'Dual Antiplatelet Treatment up to 72 Hours after Ischemic Stroke',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 6100, ageRange: '35-80', nihssRange: '≤5 (TIA: ABCD² ≥4)', timeWindow: '≤72 h', keyInclusion: ['Mild AIS (NIHSS ≤5) or high-risk TIA (ABCD² ≥4), ≤72 h', 'Presumed atherosclerotic cause (symptomatic stenosis ≥50% or multiple acute infarcts)', 'No thrombolysis or thrombectomy'], keyExclusion: [] },
    intervention: 'Clopidogrel 300 mg load then 75 mg/d to day 90 + aspirin days 1-21 (21 d DAPT, then clopidogrel alone), started ≤72 h',
    comparator: 'Aspirin alone',
    primaryEndpoint: { definition: 'New stroke at 90 d', timepoint: '90 d', result: 'Favored DAPT: 7.3% vs 9.2%', effectSize: 'HR 0.79', confidenceInterval: '95% CI 0.66 to 0.94', pValue: 'p=0.008' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: 'Moderate-to-severe bleeding higher with DAPT' },
    imagingCriteria: '',
    applicabilityNotes: 'Extends the DAPT window to 72 h for mild stroke (NIHSS ≤5) or high-risk TIA (ABCD2 ≥4) of presumed atherosclerotic cause in patients not treated with thrombolysis or thrombectomy (87% enrolled 24-72 h after onset); not tested in other stroke mechanisms.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-inspires-2024'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Allows DAPT initiation up to 72 h in eligible mild stroke.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'chance-2',
    shortName: 'CHANCE-2',
    fullName: 'Ticagrelor versus Clopidogrel in CYP2C19 Loss-of-Function Carriers with Stroke or TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 6412, ageRange: '≥40', nihssRange: '≤3', timeWindow: '≤24 h', keyInclusion: ['CYP2C19 loss-of-function carrier', 'Mild AIS or high-risk TIA'], keyExclusion: [] },
    intervention: 'Ticagrelor 180 mg load, then 90 mg BID to day 90 + aspirin for the first 21 d',
    comparator: 'Clopidogrel 300 mg load, then 75 mg daily to day 90 + aspirin for the first 21 d',
    primaryEndpoint: { definition: 'New stroke at 90 d', timepoint: '90 d', result: 'Favored ticagrelor: 6.0% vs 7.6%', effectSize: 'HR 0.77', confidenceInterval: '95% CI 0.64 to 0.94', pValue: 'p=0.008' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Pharmacogenomic-guided antiplatelet strategy.',
    limitations: 'Genotype testing not always available.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-chance2-2021'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Supports ticagrelor over clopidogrel in CYP2C19 LOF carriers.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- AF anticoagulation timing -------------------
  t({
    id: 'elan',
    shortName: 'ELAN',
    fullName: 'Early versus Later Anticoagulation for Stroke with Atrial Fibrillation',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 2013, ageRange: '≥18', nihssRange: 'all', timeWindow: 'Acute AIS; DOAC start timed by imaging-defined infarct size', keyInclusion: ['AIS with non-valvular AF'], keyExclusion: ['Mechanical valve'] },
    intervention: 'Early DOAC (within 48 h for minor or moderate stroke; day 6-7 for major stroke)',
    comparator: 'Later DOAC (day 3-4 for minor, day 6-7 for moderate, day 12-14 for major stroke)',
    primaryEndpoint: { definition: 'Composite of recurrent ischaemic stroke, systemic embolism, major extracranial bleeding, symptomatic intracranial haemorrhage, or vascular death at 30 d', timepoint: '30 d', result: '2.9% (early) vs 4.1% (later)', effectSize: 'Risk difference -1.18 percentage points', confidenceInterval: '95% CI -2.84 to 0.47', pValue: '' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Timing calibrated by imaging-defined infarct size (CT or MRI), not by NIHSS.',
    limitations: 'The 95% CI for the primary risk difference (-2.84 to 0.47 percentage points) includes no difference; recurrent ischaemic stroke was numerically lower with early start (1.4% vs 2.5%; OR 0.57, 95% CI 0.29-1.07) but also not conclusive.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-elan-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports early DOAC initiation per stroke severity.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'timing',
    shortName: 'TIMING',
    fullName: 'Timing of Oral Anticoagulant Therapy in AIS with AF',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 888, ageRange: '≥18', nihssRange: 'all', timeWindow: '≤72 h post-AIS', keyInclusion: ['AIS with non-valvular AF'], keyExclusion: [] },
    intervention: 'Early DOAC (≤4 d)',
    comparator: 'Delayed DOAC (5-10 d)',
    primaryEndpoint: { definition: 'Composite ischemic event / sICH / mortality at 90 d', timepoint: '90 d', result: 'Non-inferior: 6.89% (early) vs 8.68% (delayed)', effectSize: 'Absolute risk difference -1.79%', confidenceInterval: '95% CI -5.31% to 1.74%', pValue: 'Non-inferiority met' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'None in either group', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Smaller than ELAN; consistent direction.',
    limitations: 'Underpowered for superiority.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-timing-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports earlier DOAC initiation.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- AF prevention background -------------------
  t({
    id: 'averroes',
    shortName: 'AVERROES',
    fullName: 'Apixaban in Patients with Atrial Fibrillation Unsuitable for VKA',
    topic: 'af-after-ich',
    diseaseArea: ['secondary-prevention', 'af-after-ich'],
    population: { n: 5599, ageRange: '≥50', nihssRange: 'n/a', timeWindow: 'chronic AF', keyInclusion: ['AF with ≥1 stroke risk factor; not VKA candidate'], keyExclusion: [] },
    intervention: 'Apixaban 5 mg BID',
    comparator: 'Aspirin 81-324 mg/d',
    primaryEndpoint: { definition: 'Stroke or systemic embolism', timepoint: '~1 y', result: 'Favored apixaban: 1.6%/y vs 3.7%/y', effectSize: 'HR 0.45', confidenceInterval: '95% CI 0.32 to 0.62', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: 'Major bleeding similar' },
    imagingCriteria: '',
    applicabilityNotes: 'AF stroke prevention superiority of apixaban over aspirin in VKA-unsuitable patients. Not designed for ICH survivors (serious bleeding within the prior 6 months or high bleeding risk was an exclusion) — background context, not direct ICH-survivor evidence.',
    limitations: 'Comparator is aspirin in a VKA-unsuitable population; stopped early for benefit (mean follow-up 1.1 y); excluded patients with serious bleeding in the prior 6 months or at high bleeding risk, and did not specifically enrol ICH survivors.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-averroes-2011'],
    relatedActiveTrialIds: ['aspire'],
    practiceImpact: 'Supports anticoagulation over aspirin for AF stroke prevention generally; the ICH-survivor question is answered by the dedicated trials below.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "artesia",
    "shortName": "ARTESiA",
    "fullName": "Apixaban for Stroke Prevention in Subclinical Atrial Fibrillation",
    "topic": "subclinical-af",
    "diseaseArea": [
      "secondary-prevention",
      "subclinical-af",
      "af-after-ich"
    ],
    "population": {
      "n": 4012,
      "ageRange": "≥55",
      "nihssRange": "n/a",
      "timeWindow": "Subclinical episodes 6 minutes to 24 hours; progression to clinical AF or >24-hour episodes triggered open-label anticoagulation and censoring",
      "keyInclusion": [
        "Device-detected subclinical AF with at least one episode ≥6 minutes and none >24 hours",
        "Stroke-risk enrichment, generally CHA2DS2-VASc ≥3, with protocol exceptions for age ≥75 or prior stroke"
      ],
      "keyExclusion": []
    },
    "intervention": "Apixaban 5 mg twice daily, or 2.5 mg twice daily when standard dose-reduction criteria were met",
    "comparator": "Aspirin 81 mg",
    "primaryEndpoint": {
      "definition": "Stroke or systemic embolism",
      "timepoint": "3.5 y",
      "result": "Favored apixaban: 0.78%/y vs 1.24%/y",
      "effectSize": "HR 0.63",
      "confidenceInterval": "95% CI 0.45 to 0.88",
      "pValue": "p=0.007"
    },
    "secondaryEndpoints": [
      {
        "name": "Major bleeding",
        "result": "1.71%/y vs 0.94%/y; HR 1.80"
      }
    ],
    "safetyFindings": {
      "sich": "Similar",
      "mortality": "Similar",
      "other": "Major bleeding higher with apixaban"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Applies to the enrolled risk-enriched device-detected subclinical AF population, not every AHRE duration or low-risk patient. Efficacy used intention-to-treat and major bleeding an on-treatment population; keep these analysis sets distinct.",
    "limitations": "Subclinical AF only; prior-ICH patients not enrolled.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-artesia-2023"
    ],
    "relatedActiveTrialIds": [
      "aspire"
    ],
    "practiceImpact": "Apixaban reduced stroke/systemic embolism and increased major bleeding in the studied population. Weigh absolute risks within the episode-duration and stroke-risk eligibility boundaries.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- BP after EVT -------------------
  t({
    id: 'enchanted2-mt',
    shortName: 'ENCHANTED2/MT',
    fullName: 'Intensive BP Control after Endovascular Thrombectomy',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: { n: 821, ageRange: '≥18', nihssRange: 'all', timeWindow: 'post-successful EVT', keyInclusion: ['Successful EVT with mTICI 2b/3'], keyExclusion: [] },
    intervention: 'Intensive SBP target <120 mmHg',
    comparator: 'Less-intensive SBP target 140-180 mmHg',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored less-intensive (worse with intensive)', effectSize: 'OR 1.37', confidenceInterval: '95% CI 1.07 to 1.76', pValue: 'p=0.012' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Post-EVT BP intensive lowering harmful; conventional control preferred.',
    limitations: 'Single-region trial (China).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-enchanted2-mt-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Avoid intensive BP lowering after successful EVT; target 140-180 mmHg.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 36463906 (https://doi.org/10.1016/S0140-6736(22)02427-8).",
  }),

  // ------------------- Currency promotion 2026-05-29 (PubMed-verified) -------------------
  t({
    "id": "optimas",
    "shortName": "OPTIMAS",
    "fullName": "Optimal Timing of Anticoagulation after Acute Ischaemic Stroke with Atrial Fibrillation",
    "topic": "af-anticoag-timing",
    "diseaseArea": [
      "secondary-prevention",
      "af-anticoag-timing"
    ],
    "population": {
      "n": 3621,
      "ageRange": "≥18",
      "nihssRange": "",
      "timeWindow": "Early ≤4 d vs delayed 7-14 d",
      "keyInclusion": [
        "AF + acute ischaemic stroke"
      ],
      "keyExclusion": [
        "PH2 hemorrhagic transformation",
        "Unrelated acute intracranial hemorrhage",
        "Contraindications to anticoagulation"
      ]
    },
    "intervention": "Early DOAC (≤4 d)",
    "comparator": "Delayed DOAC (7-14 d)",
    "primaryEndpoint": {
      "definition": "Composite: recurrent ischaemic stroke, sICH, unclassifiable stroke, systemic embolism",
      "timepoint": "90 d",
      "result": "Non-inferior: 3.3% vs 3.3%",
      "effectSize": "Adjusted risk difference 0.000",
      "confidenceInterval": "95% CI −0.011 to 0.012",
      "pValue": "p=0.0003 (non-inferiority)"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "Low and similar",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Starting a DOAC within four days was noninferior overall to days 7–14 for the primary composite using a two-percentage-point margin. Very severe strokes were uncommon; nonsignificant severity interactions do not establish noninferiority in every severity or hemorrhagic-transformation subgroup.",
    "limitations": "Open-label trial; PH2 and anticoagulation contraindications excluded, and very severe stroke remains imprecisely represented. Original correction notice impact remains unresolved in the review; no blanket full-protocol clearance.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-optimas-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports early initiation in appropriately selected patients resembling the enrolled population. Do not extrapolate to PH2, contraindicated patients or every very severe stroke.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification. Correction impact unresolved: PMID 39755394 (https://doi.org/10.1016/S0140-6736(24)02802-2).",
  }),
  t({
    "id": "catalyst",
    "shortName": "CATALYST",
    "fullName": "IPD Meta-analysis of Anticoagulation Timing after Ischaemic Stroke with AF",
    "topic": "af-anticoag-timing",
    "diseaseArea": [
      "secondary-prevention",
      "af-anticoag-timing"
    ],
    "population": {
      "n": 5441,
      "ageRange": "",
      "nihssRange": "",
      "timeWindow": "Early ≤4 d vs later ≥5 d",
      "keyInclusion": [
        "AF + ischaemic stroke",
        "Pooled TIMING, ELAN, OPTIMAS, START"
      ],
      "keyExclusion": []
    },
    "intervention": "Early DOAC (≤4 d)",
    "comparator": "Later DOAC (≥5 d)",
    "primaryEndpoint": {
      "definition": "Composite: recurrent ischaemic stroke, sICH, unclassified stroke",
      "timepoint": "30 d",
      "result": "Favored early: 2.1% vs 3.0%",
      "effectSize": "OR 0.70",
      "confidenceInterval": "95% CI 0.50 to 0.98",
      "pValue": "p=0.039"
    },
    "secondaryEndpoints": [
      {
        "name": "Recurrent ischaemic stroke",
        "result": "OR 0.66 (0.45-0.96)"
      },
      {
        "name": "sICH",
        "result": "OR 1.02 (0.43-2.46)"
      }
    ],
    "safetyFindings": {
      "sich": "No statistically detected increase: OR 1.02, 95% CI 0.43–2.46; only 20 events, so a substantial relative increase remains compatible with the data.",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Individual-patient-data pooling of 4 RCTs.",
    "limitations": "IPD meta-analysis of open-label trials; event rates were low. PH2 and very severe stroke are not adequately covered for unrestricted extrapolation. Source models used unadjusted odds ratios with trial random effects; main and supplement review is scoped, not exhaustive.",
    "certainty": "high",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-catalyst-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Earlier DOAC initiation reduced the 30-day composite in selected AF-related stroke populations. This does not certify safety for PH2, every severe stroke, or each individual timing subgroup.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'navigate-esus',
    shortName: 'NAVIGATE ESUS',
    fullName: 'Rivaroxaban for Stroke Prevention after Embolic Stroke of Undetermined Source',
    topic: 'esus',
    diseaseArea: ['secondary-prevention', 'esus'],
    population: { n: 7213, ageRange: '≥50', nihssRange: '', timeWindow: '', keyInclusion: ['ESUS'], keyExclusion: ['Known AF'] },
    intervention: 'Rivaroxaban 15 mg',
    comparator: 'Aspirin 100 mg',
    primaryEndpoint: { definition: 'Recurrent stroke or systemic embolism', timepoint: 'Annualized', result: 'No benefit: 5.1%/yr vs 4.8%/yr', effectSize: 'HR 1.07', confidenceInterval: '95% CI 0.87 to 1.33', pValue: 'p=0.52' },
    secondaryEndpoints: [{ name: 'Major bleeding', result: 'HR 2.72 (1.68-4.39), p<0.001' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Major bleeding higher with rivaroxaban' },
    imagingCriteria: '',
    applicabilityNotes: '',
    limitations: 'Stopped early for futility/harm.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-navigate-esus-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Rivaroxaban not superior to aspirin in ESUS and more bleeding — empiric anticoagulation not indicated.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'respect-esus',
    shortName: 'RE-SPECT ESUS',
    fullName: 'Dabigatran for Prevention of Stroke after Embolic Stroke of Undetermined Source',
    topic: 'esus',
    diseaseArea: ['secondary-prevention', 'esus'],
    population: { n: 5390, ageRange: '≥60 (or 18-59 with ≥1 additional vascular risk factor)', nihssRange: '', timeWindow: '', keyInclusion: ['ESUS'], keyExclusion: ['Known AF'] },
    intervention: 'Dabigatran 150/110 mg BID',
    comparator: 'Aspirin 100 mg',
    primaryEndpoint: { definition: 'Recurrent stroke', timepoint: 'Annualized', result: 'No benefit: 4.1%/yr vs 4.8%/yr', effectSize: 'HR 0.85', confidenceInterval: '95% CI 0.69 to 1.03', pValue: 'p=0.10' },
    secondaryEndpoints: [{ name: 'Major bleeding', result: 'HR 1.19 (0.85-1.66)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: '',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-respect-esus-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Dabigatran not superior to aspirin in ESUS — confirms NAVIGATE; no empiric DOAC.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "arcadia",
    "shortName": "ARCADIA",
    "fullName": "Apixaban to Prevent Recurrence after Cryptogenic Stroke in Patients with Atrial Cardiopathy",
    "topic": "esus",
    "diseaseArea": [
      "secondary-prevention",
      "esus"
    ],
    "population": {
      "n": 1015,
      "ageRange": "≥45",
      "nihssRange": "",
      "timeWindow": "",
      "keyInclusion": [
        "Cryptogenic stroke",
        "Atrial cardiopathy",
        "No AF"
      ],
      "keyExclusion": [
        "Known AF"
      ]
    },
    "intervention": "Apixaban 5 mg twice daily, reduced to 2.5 mg twice daily when standard dose-reduction criteria were met",
    "comparator": "Aspirin 81 mg",
    "primaryEndpoint": {
      "definition": "Recurrent stroke",
      "timepoint": "Annualized",
      "result": "No benefit: 4.4%/yr vs 4.4%/yr",
      "effectSize": "HR 1.00",
      "confidenceInterval": "95% CI 0.64 to 1.55",
      "pValue": "Stopped for futility"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic ICH",
        "result": "0 (apixaban) vs 7 (aspirin)"
      }
    ],
    "safetyFindings": {
      "sich": "0 vs 7",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Atrial cardiopathy: P-wave terminal force, NT-proBNP, or LA diameter.",
    "limitations": "Stopped for futility.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-arcadia-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Apixaban no better than aspirin in atrial-cardiopathy ESUS — atrial cardiopathy alone does not justify anticoagulation.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'laste',
    shortName: 'LASTE',
    fullName: 'Thrombectomy for Stroke with a Large Infarct of Unrestricted Size',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 333, ageRange: '≥18', nihssRange: '', timeWindow: '≤6.5 h', keyInclusion: ['ASPECTS ≤5', 'Large core, unrestricted size'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored EVT (median mRS 4 vs 6)', effectSize: 'Generalized OR 1.63', confidenceInterval: '95% CI 1.29 to 2.06', pValue: 'p<0.001' },
    secondaryEndpoints: [{ name: '90-d mortality', result: '36.1% vs 55.5% (adj RR 0.65, 0.50-0.84)' }],
    safetyFindings: { sich: '9.6% vs 5.7%', mortality: '36.1% vs 55.5%', other: '' },
    imagingCriteria: 'ASPECTS ≤5, no upper infarct-size limit, ≤6.5 h',
    applicabilityNotes: 'Extends EVT to very large infarcts.',
    limitations: 'Stopped early; more sICH.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-laste-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Thrombectomy benefits even very large infarcts (ASPECTS ≤5), at the cost of more sICH.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'respect-pfo',
    shortName: 'RESPECT',
    fullName: 'Long-Term Outcomes of Patent Foramen Ovale Closure or Medical Therapy after Stroke',
    topic: 'pfo-closure',
    diseaseArea: ['secondary-prevention', 'pfo-closure'],
    population: { n: 980, ageRange: '18-60', nihssRange: '', timeWindow: '', keyInclusion: ['PFO', 'Cryptogenic stroke'], keyExclusion: [] },
    intervention: 'PFO closure (Amplatzer)',
    comparator: 'Medical therapy',
    primaryEndpoint: { definition: 'Recurrent ischaemic stroke (ITT)', timepoint: 'Median 5.9 y', result: 'Favored closure: 0.58 vs 1.07 per 100 pt-yr', effectSize: 'HR 0.55', confidenceInterval: '95% CI 0.31 to 0.999', pValue: 'p=0.046' },
    secondaryEndpoints: [{ name: 'Stroke of undetermined cause', result: 'HR 0.38 (0.18-0.79), p=0.007' }],
    safetyFindings: { sich: '', mortality: '', other: 'Venous thromboembolism (PE/DVT) more common with closure than with medical therapy' },
    imagingCriteria: '',
    applicabilityNotes: 'Long-term follow-up of the RESPECT cohort.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-respect-pfo-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Long-term PFO closure reduces recurrent stroke vs medical therapy in selected patients <60 y.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'close',
    shortName: 'CLOSE',
    fullName: 'Patent Foramen Ovale Closure or Anticoagulation vs Antiplatelets after Stroke',
    topic: 'pfo-closure',
    diseaseArea: ['secondary-prevention', 'pfo-closure'],
    population: { n: 663, ageRange: '16-60', nihssRange: '', timeWindow: '', keyInclusion: ['PFO with atrial septal aneurysm or large shunt', 'Cryptogenic stroke'], keyExclusion: [] },
    intervention: 'PFO closure + antiplatelet',
    comparator: 'Antiplatelet alone',
    primaryEndpoint: { definition: 'Recurrent stroke', timepoint: 'Mean 5.3 y', result: 'Favored closure: 0/238 vs 14/235', effectSize: 'HR 0.03', confidenceInterval: '95% CI 0 to 0.26', pValue: 'p<0.001' },
    secondaryEndpoints: [{ name: 'New-onset AF', result: '4.6% vs 0.9% (p=0.02)' }],
    safetyFindings: { sich: '', mortality: '', other: 'AF higher with closure' },
    imagingCriteria: 'Atrial septal aneurysm or large shunt',
    applicabilityNotes: 'High-risk PFO anatomy.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-close-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Closure markedly cuts recurrent stroke in high-risk PFO anatomy (ASA / large shunt).',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'reduce',
    shortName: 'REDUCE',
    fullName: 'Patent Foramen Ovale Closure or Antiplatelet Therapy for Cryptogenic Stroke',
    topic: 'pfo-closure',
    diseaseArea: ['secondary-prevention', 'pfo-closure'],
    population: { n: 664, ageRange: '18-59', nihssRange: '', timeWindow: '', keyInclusion: ['PFO', 'Cryptogenic stroke (81% mod/large shunt)'], keyExclusion: [] },
    intervention: 'PFO closure + antiplatelet',
    comparator: 'Antiplatelet alone',
    primaryEndpoint: { definition: 'Clinical recurrent ischaemic stroke', timepoint: 'Median 3.2 y', result: 'Favored closure: 1.4% vs 5.4%', effectSize: 'HR 0.23', confidenceInterval: '95% CI 0.09 to 0.62', pValue: 'p=0.002' },
    secondaryEndpoints: [{ name: 'New brain infarction', result: 'RR 0.51 (0.29-0.91), p=0.04' }],
    safetyFindings: { sich: '', mortality: '', other: 'AF / device events higher' },
    imagingCriteria: '',
    applicabilityNotes: '',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-reduce-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Closure reduces recurrent stroke and new infarcts; watch for AF and device events.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 32040904 (https://doi.org/10.1056/NEJMx200001).",
  }),
  t({
    id: 'interact2',
    shortName: 'INTERACT2',
    fullName: 'Rapid Blood-Pressure Lowering in Acute Intracerebral Hemorrhage',
    topic: 'ich-bp-management',
    diseaseArea: ['ich', 'ich-bp-management'],
    population: { n: 2839, ageRange: '≥18', nihssRange: '', timeWindow: '≤6 h', keyInclusion: ['Spontaneous ICH', 'SBP 150-220'], keyExclusion: [] },
    intervention: 'Intensive SBP <140 within 1 h',
    comparator: 'Guideline SBP <180',
    primaryEndpoint: { definition: 'Death or major disability (mRS 3-6)', timepoint: '90 d', result: 'Negative primary: 52.0% vs 55.6%', effectSize: 'OR 0.87', confidenceInterval: '95% CI 0.75 to 1.01', pValue: 'p=0.06' },
    secondaryEndpoints: [{ name: 'Ordinal mRS shift', result: 'OR 0.87 (0.77-1.00), p=0.04' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: '',
    limitations: 'Dichotomous primary not met; ordinal analysis favored intensive lowering.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-interact2-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports early BP reduction in ICH; ordinal benefit despite a negative dichotomous primary.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'atach-2',
    shortName: 'ATACH-2',
    fullName: 'Intensive Blood-Pressure Lowering in Acute Cerebral Hemorrhage',
    topic: 'ich-bp-management',
    diseaseArea: ['ich', 'ich-bp-management'],
    population: { n: 1000, ageRange: '≥18', nihssRange: '', timeWindow: '≤4.5 h', keyInclusion: ['ICH <60 cm³', 'GCS ≥5'], keyExclusion: [] },
    intervention: 'Intensive SBP 110-139 (nicardipine)',
    comparator: 'Standard SBP 140-179',
    primaryEndpoint: { definition: 'Death or disability (mRS 4-6)', timepoint: '3 mo', result: 'No benefit: 38.7% vs 37.7%', effectSize: 'RR 1.04', confidenceInterval: '95% CI 0.85 to 1.27', pValue: 'Stopped for futility' },
    secondaryEndpoints: [{ name: 'Renal adverse events', result: '9.0% vs 4.0% (p=0.002)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'More renal AEs with intensive target' },
    imagingCriteria: '',
    applicabilityNotes: 'Argues against targeting <140 vs ~140.',
    limitations: 'Stopped for futility.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-atach2-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'An intensive SBP target of 110-139 mm Hg (vs 140-179) did not reduce death or disability and caused more renal adverse events (9.0% vs 4.0%). For mild-to-moderate ICH presenting with SBP 150-220 mm Hg, the 2022 AHA/ASA ICH guideline targets SBP 140 mm Hg (maintaining 130-150) and considers acute lowering to <130 mm Hg potentially harmful.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "mistie-iii",
    "shortName": "MISTIE III",
    "fullName": "Minimally Invasive Surgery with Thrombolysis in ICH Evacuation",
    "topic": "ich-surgery",
    "diseaseArea": [
      "ich",
      "ich-surgery"
    ],
    "population": {
      "n": 506,
      "ageRange": "≥18",
      "nihssRange": "",
      "timeWindow": "",
      "keyInclusion": [
        "Supratentorial ICH ≥30 mL"
      ],
      "keyExclusion": []
    },
    "intervention": "MIS catheter + alteplase",
    "comparator": "Standard medical care",
    "primaryEndpoint": {
      "definition": "Good outcome (mRS 0-3)",
      "timepoint": "365 d",
      "result": "Negative: 45% vs 41%",
      "effectSize": "Adjusted risk difference 4%",
      "confidenceInterval": "95% CI −4% to 12%",
      "pValue": "p=0.33"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "",
      "mortality": "Lower with MIS (secondary)",
      "other": "Outcome better when residual clot ≤15 mL"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The randomized primary functional endpoint was neutral. Residual clot ≤15 mL was associated with better outcome in exploratory as-treated analyses; achieved removal was not randomized and unmeasured confounding remains possible.",
    "limitations": "Negative primary; an exploratory association was reported with residual clot volume of 15 mL or less. These analyses were not multiplicity-adjusted and cannot establish a causal treatment threshold.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-mistie3-2019"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "The study does not establish routine functional benefit or prove that achieving ≤15 mL causes benefit. The evacuation association is hypothesis-generating.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification. Correction impact unresolved: PMID 31007203 (https://doi.org/10.1016/S0140-6736(19)30859-1).",
  }),
  t({
    id: 'crest',
    shortName: 'CREST',
    fullName: 'Stenting versus Endarterectomy for Carotid-Artery Stenosis',
    topic: 'carotid-revasc',
    diseaseArea: ['secondary-prevention', 'carotid-revasc'],
    population: { n: 2502, ageRange: '', nihssRange: '', timeWindow: '', keyInclusion: ['Symptomatic or asymptomatic carotid stenosis'], keyExclusion: [] },
    intervention: 'Carotid artery stenting (CAS)',
    comparator: 'Carotid endarterectomy (CEA)',
    primaryEndpoint: { definition: 'Composite periprocedural stroke/MI/death or 4-y ipsilateral stroke', timepoint: '4 y', result: 'No significant difference: 7.2% vs 6.8%', effectSize: 'HR 1.11', confidenceInterval: '95% CI 0.81 to 1.51', pValue: 'p=0.51' },
    secondaryEndpoints: [{ name: 'Periprocedural stroke', result: 'CAS 4.1% vs CEA 2.3% (p=0.01)' }, { name: 'Periprocedural MI', result: 'CAS 1.1% vs CEA 2.3% (p=0.03)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Stroke favors CEA; MI favors CAS' },
    imagingCriteria: '',
    applicabilityNotes: 'Age interaction: CAS worse periprocedural stroke in older patients.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-crest-2010'],
    relatedActiveTrialIds: [],
    practiceImpact: 'No significant difference between CAS and CEA on the composite; periprocedural stroke favored CEA and periprocedural MI favored CAS, and 4-year stroke or death (secondary endpoint) was higher with CAS (6.4% vs 4.7%; HR 1.50, p=0.03).',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- "What's New" promotion 2026-05-30 (PubMed-verified) -------------------
  // Recent practice-changing studies surfaced in the What's New feed and verified
  // against PubMed (PMID resolves, title matches intervention, abstract supports
  // the reported effect direction + magnitude). lastReviewed=2026-05-30,
  // promotedDate=2026-05-30, verificationStatus='verified-pubmed'.
  t({
    "id": "oceanic-stroke",
    "shortName": "OCEANIC-STROKE",
    "fullName": "Asundexian for Secondary Stroke Prevention",
    "topic": "factor-xi-inhibition",
    "diseaseArea": [
      "secondary-prevention",
      "factor-xi-inhibition"
    ],
    "population": {
      "n": 12327,
      "ageRange": "≥18",
      "nihssRange": "",
      "timeWindow": "≤72 h",
      "keyInclusion": [
        "Noncardioembolic ischaemic stroke or high-risk TIA",
        "Atherosclerosis / nonlacunar infarct / atherosclerotic plaque"
      ],
      "keyExclusion": []
    },
    "intervention": "Asundexian 50 mg once daily + antiplatelet therapy",
    "comparator": "Placebo + antiplatelet therapy",
    "primaryEndpoint": {
      "definition": "Ischaemic stroke",
      "timepoint": "Trial duration",
      "result": "Lower with asundexian: 6.2% vs 8.4%",
      "effectSize": "Cause-specific HR 0.74",
      "confidenceInterval": "95% CI 0.65 to 0.84",
      "pValue": "p<0.001"
    },
    "secondaryEndpoints": [
      {
        "name": "CV death, MI, or stroke",
        "result": "Lower with asundexian"
      },
      {
        "name": "Major bleeding",
        "result": "1.9% vs 1.7% (HR 1.10, 0.85-1.44)"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Major bleeding HR 1.10 (95% CI 0.85–1.44): no statistically detected increase, but the interval does not establish equivalence or exclude a clinically relevant relative increase."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "First positive phase-3 factor XIa inhibitor for secondary prevention.",
    "limitations": "On-top-of-antiplatelet design; long-term safety still accruing.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-oceanic-stroke-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Positive ischemic efficacy result in the selected trial population. Clinical use depends on regulatory authorization and current guidance; do not describe major bleeding as proven unchanged.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-05-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'trident',
    shortName: 'TRIDENT',
    fullName: 'Three Low-Dose Antihypertensive Agents in a Single Pill after Intracerebral Hemorrhage',
    topic: 'ich-secondary-prevention',
    diseaseArea: ['ich', 'secondary-prevention', 'ich-secondary-prevention'],
    population: { n: 1670, ageRange: 'Mean 58', nihssRange: '', timeWindow: '', keyInclusion: ['History of intracerebral haemorrhage', 'Baseline SBP 130-160 mm Hg', 'Clinically stable'], keyExclusion: [] },
    intervention: 'Single-pill triple therapy: telmisartan 20 mg / amlodipine 2.5 mg / indapamide 1.25 mg + standard care',
    comparator: 'Placebo + standard care',
    primaryEndpoint: { definition: 'First recurrent stroke', timepoint: 'Median 2.5 y', result: 'Lower with triple pill: 4.6% vs 7.4%', effectSize: 'HR 0.61', confidenceInterval: '95% CI 0.41 to 0.92', pValue: 'p=0.02' },
    secondaryEndpoints: [{ name: 'Major cardiovascular events', result: '6.6% vs 9.8% (p=0.04)' }, { name: 'Mean SBP on follow-up', result: '127 vs 138 mm Hg' }],
    safetyFindings: { sich: '', mortality: '', other: 'Early discontinuation for adverse events 13.6% vs 6.0%; most common cause was a ≥20% serum creatinine rise' },
    imagingCriteria: '',
    applicabilityNotes: 'Simplified low-dose triple pill after ICH; 2-week active run-in before randomisation.',
    limitations: 'Higher adverse-event discontinuation with triple pill.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-trident-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A simplified low-dose triple pill after ICH lowers recurrent stroke and CV events — supports intensive, simplified BP-lowering.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'atlas',
    shortName: 'ATLAS',
    fullName: 'Endovascular Thrombectomy for Large-Core Ischaemic Stroke up to 24 h — Systematic Review and IPD Meta-analysis with Central Imaging Adjudication',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 1886, ageRange: '', nihssRange: '', timeWindow: '≤24 h', keyInclusion: ['ASPECTS ≤5 or estimated ischaemic core ≥50 mL', '6 randomised trials'], keyExclusion: [] },
    intervention: 'Endovascular thrombectomy',
    comparator: 'Medical management',
    primaryEndpoint: { definition: '90-day mRS distribution (ordinal shift)', timepoint: '90 d', result: 'Favored EVT (median mRS 4 vs 5)', effectSize: 'Adjusted pooled generalised OR 1.63', confidenceInterval: '95% CI 1.42 to 1.88', pValue: 'p<0.0001' },
    secondaryEndpoints: [{ name: '90-day mortality', result: '31.1% vs 37.3% (aRR 0.82, 0.70-0.97)' }, { name: 'Symptomatic ICH within 36 h', result: '1.1% vs 1.0% (RD -0.17 pp, -1.01 to 0.67)' }],
    safetyFindings: { sich: '1.1% vs 1.0%', mortality: '31.1% vs 37.3%', other: '' },
    imagingCriteria: 'ASPECTS ≤5 or core ≥50 mL; central imaging core-lab readjudication',
    applicabilityNotes: 'Benefit sustained across ASPECTS / core strata to 24 h; uncertain for core ≥150 mL beyond 6 h.',
    limitations: 'Wide CIs for very extensive cores (≥150 mL); trial-level heterogeneity.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-atlas-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Consolidates EVT benefit across large-core strata to 24 h, except very extensive cores (≥150 mL) beyond 6 h where evidence remains limited.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'tapis',
    shortName: 'TAPIS',
    fullName: 'Ticagrelor with Aspirin Dual Antiplatelet Therapy combined with Intravenous Thrombolysis in Patients with Ischaemic Stroke in China',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'dapt-minor-stroke'],
    population: { n: 1382, ageRange: 'Median 65.6', nihssRange: '4-10', timeWindow: '≤6 h of onset', keyInclusion: ['Treated with IV thrombolysis', 'NIHSS 4-10'], keyExclusion: [] },
    intervention: 'Oral aspirin + ticagrelor DAPT within 6 h (ticagrelor days 2-7)',
    comparator: 'Placebo (open-label aspirin days 2-90)',
    primaryEndpoint: { definition: 'Excellent functional outcome (mRS 0-1)', timepoint: '90 d', result: 'Higher with early DAPT: 68.7% vs 62.0%', effectSize: 'Risk ratio 1.11', confidenceInterval: '95% CI 1.03 to 1.20', pValue: 'p=0.0089' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH within 36 h', result: '0.9% vs 0.7% (RR 1.20, 0.37-3.93)' }],
    safetyFindings: { sich: '0.9% vs 0.7%', mortality: '', other: 'Wide CIs preclude excluding a small sICH increase' },
    imagingCriteria: '',
    applicabilityNotes: 'Early oral DAPT as an adjunct to thrombolysis in moderate stroke; single-country (China) trial.',
    limitations: 'Open-label aspirin days 2-90; sICH CIs wide.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-tapis-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Early oral DAPT within 6 h as an adjunct to thrombolysis improved excellent outcomes in moderate stroke — a strategy long considered contraindicated; small sICH risk not excluded.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'choice-2',
    shortName: 'CHOICE-2',
    fullName: 'Adjunctive Intra-Arterial Alteplase After Successful Thrombectomy for Acute Ischemic Stroke',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: { n: 440, ageRange: 'Median 76', nihssRange: '', timeWindow: '≤24 h', keyInclusion: ['LVO treated with thrombectomy', 'eTICI 2b50-3 after EVT', '440 randomized; 433 treated as randomized and analysed (214 vs 219)'], keyExclusion: [] },
    intervention: 'Thrombectomy + intra-arterial alteplase 0.225 mg/kg (max 20 mg) over 15 min',
    comparator: 'Thrombectomy alone',
    primaryEndpoint: { definition: 'Excellent functional outcome (mRS 0-1)', timepoint: '90 d', result: 'Higher with IA alteplase: 57.5% vs 42.5%', effectSize: 'Adjusted risk difference 15.0%', confidenceInterval: '95% CI 5.7% to 24.3%', pValue: 'p=0.002' },
    secondaryEndpoints: [{ name: '90-day mortality', result: '12.1% vs 6.4% (adj RD 5.9%, 0.5-11.3; p=0.03)' }, { name: 'Residual hypoperfusion', result: '28.6% vs 50.5% (adj RD -22.0%, -31.5 to -12.4)' }],
    safetyFindings: { sich: '1.4% vs 0.5% (aOR 3.10, 0.32-30.0)', mortality: '90-day mortality 12.1% vs 6.4% (adjusted risk difference 5.9%, 95% CI 0.5-11.3; P=.03)', other: 'Higher mortality signal warrants caution' },
    imagingCriteria: 'eTICI 2b50-3 after successful thrombectomy',
    applicabilityNotes: 'Open-label trial, blinded outcome; 14 centres in Spain.',
    limitations: 'Higher mortality with IA alteplase; modest sample.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-choice-2-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'IA alteplase after successful EVT improved excellent outcomes and reperfusion — but a higher mortality signal warrants caution before adoption.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "distal",
    "shortName": "DISTAL",
    "fullName": "Endovascular Treatment for Medium or Distal Vessel Occlusion Stroke — 90-Day and 12-Month Outcomes",
    "topic": "evt-mevo",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "evt-mevo"
    ],
    "population": {
      "n": 543,
      "ageRange": "Median 77",
      "nihssRange": "Median 6",
      "timeWindow": "≤6 h, or 6-24 h with salvageable tissue",
      "keyInclusion": [
        "Medium/distal occlusion: non-dominant or co-dominant M2, M3-M4, A1-A3, P1-P3"
      ],
      "keyExclusion": []
    },
    "intervention": "Endovascular treatment + best medical treatment",
    "comparator": "Best medical treatment alone",
    "primaryEndpoint": {
      "definition": "Original trial primary outcome: disability on ordinal mRS",
      "timepoint": "90 d",
      "result": "No significant difference",
      "effectSize": "Common OR for improvement 0.90",
      "confidenceInterval": "95% CI 0.67 to 1.22",
      "pValue": "p=0.50"
    },
    "secondaryEndpoints": [
      {
        "name": "12-month follow-up mRS distribution (2026 report)",
        "result": "No significant difference: adjusted common OR 0.81 (95% CI 0.59-1.12), p=0.20; median mRS 2 in both groups"
      }
    ],
    "safetyFindings": {
      "sich": "5.9% versus 2.6% within 24 hours (±6 hours) after randomization; the 90-day horizon applies to mortality and serious adverse events, not this sICH assessment.",
      "mortality": "90-day mortality 15.5% vs 14.0%; 12-month survival HR 1.46 (95% CI 0.93-2.30), p=0.10",
      "other": ""
    },
    "imagingCriteria": "Salvageable tissue required for 6-24 h window",
    "applicabilityNotes": "12-month results consistent with 90-day results; mild-to-moderate MeVO.",
    "limitations": "Open-label; benefit not excluded in subgroups.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-distal-2025",
      "cit-distal-2026"
    ],
    "relatedActiveTrialIds": [
      "step-evt"
    ],
    "practiceImpact": "No long-term benefit of EVT in mild-to-moderate medium/distal vessel occlusion — routine thrombectomy not supported in this population.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-05-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'escape-mevo',
    shortName: 'ESCAPE-MeVO',
    fullName: 'Endovascular Treatment for Medium Vessel Occlusion Stroke',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: {
      n: 530,
      ageRange: 'Median 75',
      nihssRange: 'Median 8',
      timeWindow: '≤12 h from last known well',
      keyInclusion: ['Medium vessel occlusion (M2/M3 branches of MCA, A2/A3 branches of ACA, P2/P3 branches of PCA)', 'NIHSS >5, or NIHSS 3-5 with a disabling deficit', 'ASPECTS ≥6 (ASPECTS ≤5 excluded)'],
      keyExclusion: []
    },
    intervention: 'Endovascular treatment + best medical management',
    comparator: 'Best medical management alone',
    primaryEndpoint: {
      definition: 'mRS 0-1 (independent functional outcome)',
      timepoint: '90 d',
      result: 'No difference: 41.6% (106/255) vs 43.1% (118/274)',
      effectSize: 'Adjusted rate ratio 0.95',
      confidenceInterval: '95% CI 0.79 to 1.15',
      pValue: 'p=0.61'
    },
    secondaryEndpoints: [
      { name: 'mRS 0-2 at 90 d', result: '60.3% vs 60.1% (aOR 0.98, 95% CI 0.67 to 1.43)' }
    ],
    safetyFindings: {
      sich: '5.4% vs 2.2% (aOR 2.37, 95% CI 0.90 to 6.27)',
      mortality: '13.3% vs 8.4% (aHR 1.82, 95% CI 1.06 to 3.12)',
      other: 'Higher 90-day mortality in the EVT group (safety signal)'
    },
    imagingCriteria: 'CTA/MRA-selected MeVO',
    applicabilityNotes: 'No functional benefit and showed a signal of increased 90-day mortality and sICH.',
    limitations: 'Open-label with blinded outcome assessment; completed planned enrollment (n=530).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-mevo-2025'],
    relatedActiveTrialIds: ['step-evt'],
    practiceImpact: 'Does not support routine endovascular thrombectomy for isolated medium vessel occlusion stroke outside of clinical trials.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'oriental-mevo',
    shortName: 'ORIENTAL-MeVO',
    fullName: 'Endovascular Treatment of Medium-Vessel-Occlusion Strokes',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: {
      n: 563,
      ageRange: 'Median 71',
      nihssRange: 'Median 10 (range 3-36); NIHSS ≥6 required',
      timeWindow: '≤24 h from onset',
      keyInclusion: ['Medium vessel occlusion', 'NIHSS ≥6 (moderate-to-severe deficit)', 'Presentation within 24 h of onset', '48 centres in China'],
      keyExclusion: []
    },
    intervention: 'Endovascular thrombectomy + medical management',
    comparator: 'Medical management alone',
    primaryEndpoint: {
      definition: 'Functional independence (mRS 0-2). Prespecified substitution after the proportional-odds assumption for the mRS shift was violated',
      timepoint: '90 d',
      result: 'Benefit: 58.6% (280 patients) vs 46.6% (283 patients)',
      effectSize: 'Adjusted rate ratio 1.24',
      confidenceInterval: '95% CI 1.07 to 1.44',
      pValue: 'P=0.004'
    },
    secondaryEndpoints: [
      { name: 'IV thrombolysis co-treatment', result: '36.6% of participants overall' }
    ],
    safetyFindings: {
      sich: '4.7% vs 2.2%',
      mortality: '11.1% vs 10.2% (no excess)',
      other: 'Higher symptomatic intracranial haemorrhage with thrombectomy; no mortality signal, in contrast to ESCAPE-MeVO'
    },
    imagingCriteria: 'CTA/MRA-confirmed medium vessel occlusion',
    applicabilityNotes: 'A positive trial in a selected NIHSS ≥6 population, alongside neutral DISTAL, ESCAPE-MeVO and DISCOUNT results. Differences in selection, geography and treatment may matter, but cross-trial comparisons cannot establish that NIHSS alone explains the discordance. Single-country (China), open-label with blinded outcome assessment.',
    limitations: 'Open-label; conducted entirely in China; the prespecified mRS-shift primary analysis could not be used because the proportional-odds assumption was violated.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-oriental-mevo-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Positive functional-outcome result with more symptomatic hemorrhage; interpret with the neutral MeVO trials. This study summary does not independently revise guideline recommendations.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "direct-angio",
    "shortName": "DIRECT ANGIO",
    "fullName": "Direct versus Conventional Transfer to Angiography Suite in Patients with Severe Acute Stroke Treated with Thrombectomy (France)",
    "topic": "acute-ischemic-stroke",
    "diseaseArea": [
      "acute-ischemic-stroke"
    ],
    "population": {
      "n": 115,
      "ageRange": "≤85",
      "nihssRange": "",
      "timeWindow": "≤5 h of onset",
      "keyInclusion": [
        "Acute severe neurological deficit highly suggestive of LVO (ASND-LVO)"
      ],
      "keyExclusion": []
    },
    "intervention": "Direct transfer to angiography suite (DTAS)",
    "comparator": "Conventional imaging-first pathway",
    "primaryEndpoint": {
      "definition": "Functional independence (mRS 0-2)",
      "timepoint": "90 d",
      "result": "No benefit: 36% vs 42%",
      "effectSize": "Adjusted OR 0.73",
      "confidenceInterval": "95% CI 0.32 to 1.69",
      "pValue": ""
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic ICH",
        "result": "AIS-only: 5/34 (15%) versus 0/42; adjusted OR 11.0 (95% CI 1.28–1406)."
      },
      {
        "name": "All-cause mortality",
        "result": "18% vs 11% (adj OR 1.65, 0.52-5.55)"
      }
    ],
    "safetyFindings": {
      "sich": "AIS-only safety analysis: 5/34 (15%) versus 0/42. These denominators differ from the broader 115-person suspected-stroke population used for primary function and mortality.",
      "mortality": "18% vs 11% (NS)",
      "other": "Trial stopped early for safety"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "A triage-strategy trial in suspected LVO, including primary ICH and patients who did not undergo thrombectomy. Keep AIS-only hemorrhage rates separate from the overall randomized clinical outcomes.",
    "limitations": "Small n (115) limits precision of all estimates.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-direct-angio-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "In a small trial stopped early for safety, direct transfer to the angiography suite was associated with more sICH and no evidence of functional benefit; estimates are imprecise and the authors call for further trials before firm conclusions.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-05-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'stabled',
    shortName: 'STABLED',
    fullName: 'Catheter Ablation and Oral Anticoagulation for Secondary Stroke Prevention in Atrial Fibrillation',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 249, ageRange: '20-85 (mean 71.7)', nihssRange: '', timeWindow: 'Ablation 1-6 mo after index stroke', keyInclusion: ['Nonvalvular AF', 'Prior ischaemic stroke', 'On / scheduled for edoxaban', 'mRS ≤3'], keyExclusion: [] },
    intervention: 'Standard therapy + catheter ablation',
    comparator: 'Standard therapy (edoxaban) alone',
    primaryEndpoint: { definition: 'Composite: recurrent ischaemic stroke, systemic embolism, all-cause death, HF hospitalisation', timepoint: 'Median >3 y', result: 'No reduction: 5.6% vs 4.9% per person-year', effectSize: 'HR 1.11', confidenceInterval: '95% CI 0.62 to 2.01', pValue: '' },
    secondaryEndpoints: [{ name: 'Mortality', result: '2.8 vs 1.0 per 100 person-years' }],
    safetyFindings: { sich: '', mortality: '2.8 vs 1.0 per 100 person-years', other: '2 ablation-related SAEs (cardiac tamponade, stroke; 0.8% each)' },
    imagingCriteria: '',
    applicabilityNotes: 'Open-label; 45 sites in Japan; lower-than-anticipated event rate.',
    limitations: 'Underpowered (low event rate); open-label.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-stabled-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adding ablation to anticoagulation did not reduce recurrent events in post-stroke AF (underpowered) — does not support routine ablation for secondary prevention.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'suicide-after-stroke',
    shortName: 'Suicide after stroke',
    fullName: 'Increased Risk of Suicide after Stroke: A Population-Based Matched Cohort Study',
    topic: 'special-populations',
    diseaseArea: ['secondary-prevention', 'special-populations'],
    population: { n: 129438, ageRange: 'Mean 71.4', nihssRange: '', timeWindow: '2008-2017', keyInclusion: ['64,719 stroke patients matched 1:1 to Ontario population controls'], keyExclusion: [] },
    intervention: 'Hospitalisation for stroke (exposure)',
    comparator: 'Matched general-population controls',
    primaryEndpoint: { definition: 'Suicide (composite of deliberate self-harm or death by suicide)', timepoint: 'Through follow-up (627,774 person-years)', result: 'Higher in stroke survivors: 11.1 vs 3.2 per 10,000 person-years', effectSize: 'HR 2.87', confidenceInterval: '95% CI 2.35 to 3.51', pValue: '' },
    secondaryEndpoints: [{ name: 'Younger survivors', result: 'HR 4.34 (2.48-7.61)' }, { name: 'Low-income neighbourhood', result: 'HR 1.88 (1.30-2.70)' }, { name: 'Timing', result: '67.4% of events after first year' }],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Association did not vary by presence of major depression.',
    limitations: 'Observational — residual confounding; administrative-data ascertainment; association not causation.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-suicide-after-stroke-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports long-term (beyond 1 year) suicidality screening in survivors — especially younger and lower-income patients.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'hyponatremia-ich',
    shortName: 'Hyponatremia & ICH',
    fullName: 'Severity-Stratified Hyponatremia Is Associated with Increased Mortality and Complications in Nontraumatic Intracerebral Hemorrhage',
    topic: 'ich',
    diseaseArea: ['ich'],
    population: { n: 45114, ageRange: '', nihssRange: '', timeWindow: 'Serum Na ≤7 d of diagnosis', keyInclusion: ['Nontraumatic ICH', 'Propensity-matched: moderate hypoNa 17,547/arm; severe 5,010/arm', 'TriNetX federated EHR'], keyExclusion: [] },
    intervention: 'Hyponatremia (moderate or severe) within 7 days',
    comparator: 'Propensity-matched normonatraemia',
    primaryEndpoint: { definition: '30-day mortality', timepoint: '30 d', result: 'Moderate 17.5% vs 13.3%; severe 18.7% vs 12.9%', effectSize: 'Moderate HR 1.324; severe HR 1.473', confidenceInterval: 'Moderate 95% CI 1.255-1.398; severe 1.332-1.628', pValue: 'p<0.001' },
    secondaryEndpoints: [{ name: 'Complications', result: 'More seizures, cerebral edema, hydrocephalus, EVD, tracheostomy, PEG, DVT, MI' }],
    safetyFindings: { sich: '', mortality: 'Moderate HR 1.32; severe HR 1.47', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Serum sodium as a readily-available risk-stratification marker in acute ICH.',
    limitations: 'RWE — coding granularity; illness-severity confounding; whether correcting Na changes outcome is unproven.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-hyponatremia-ich-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Serum sodium is a readily-available risk-stratification marker in acute ICH; supports vigilant Na monitoring (causality not established).',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "tnk-vs-alteplase-rwe",
    "shortName": "TNK vs alteplase · RWE",
    "fullName": "Real-World Efficacy and Safety of Tenecteplase versus Alteplase in Acute Ischemic Stroke: A Propensity Score-Matched Analysis",
    "topic": "tnk-vs-alteplase",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "tnk-vs-alteplase"
    ],
    "population": {
      "n": 371,
      "ageRange": "≥18 years",
      "nihssRange": "",
      "timeWindow": "",
      "keyInclusion": [
        "Thrombolysed AIS; pre-stroke mRS ≤2",
        "Unmatched cohort: 303 alteplase and 68 tenecteplase recipients",
        "Single-center retrospective study; matched-population reporting discrepancies remain unresolved"
      ],
      "keyExclusion": []
    },
    "intervention": "Tenecteplase 0.25 mg/kg, maximum 25 mg",
    "comparator": "Alteplase 0.9 mg/kg, maximum 90 mg",
    "primaryEndpoint": {
      "definition": "mRS 0–2; original overall-cohort estimate, not a validated matched-cohort comparison",
      "timepoint": "90 d",
      "result": "Source Table 2 reports 26/68 versus 122/303; matched-population interpretation is withheld because source cohort descriptions are inconsistent",
      "effectSize": "Reported adjusted OR 0.91",
      "confidenceInterval": "95% CI 0.52–1.58",
      "pValue": "P=.748"
    },
    "secondaryEndpoints": [
      {
        "name": "Source discrepancy",
        "result": "Matched safety comparisons are withheld pending reconciliation of the analysis populations and endpoint definitions."
      }
    ],
    "safetyFindings": {
      "sich": "Unresolved: source reports 6/68 (8.8%) in the raw TNK cohort but 16.2% in a matched narrative; these cannot be treated as the same estimate",
      "mortality": "No validated matched mortality comparison asserted",
      "other": "No claim of noninferiority or equivalent safety follows from this observational study"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "This small retrospective study provides an imprecise association. Its inconsistent matched-cohort safety reporting prevents using this card as comparative treatment support.",
    "limitations": "Single-center observational design, selection bias and few safety events. Table 2 does report an adjusted estimate and confidence interval. Treatment-allocation percentages and raw versus matched safety populations are inconsistent in the original report; no correction resolving them was available.",
    "certainty": "low",
    "evidenceType": "observational",
    "citationIds": [
      "cit-tnk-vs-alteplase-rwe-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Use randomized TNK evidence for treatment decisions. This source is retained for transparency with unresolved matched-population reporting; observational nonsignificance does not establish noninferiority.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-05-30",
    "verificationStatus": "disputed",
    verificationNotes: "Primary full text reviewed 2026-09-30; matched efficacy/safety interpretation remains unresolved (PMC13201182). Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ===================== 2026-07-06 evidence refresh (all PubMed-verified) =====================
  t({
    id: 'bridge-tnk',
    shortName: 'BRIDGE-TNK',
    fullName: 'Intravenous Tenecteplase before Thrombectomy in Stroke',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt'],
    population: { n: 550, ageRange: 'adults', nihssRange: '', timeWindow: '≤4.5 h', keyInclusion: ['Large-vessel occlusion within 4.5 h of onset', 'Eligible for IV thrombolysis and for thrombectomy'], keyExclusion: ['Contraindication to IV thrombolysis'] },
    intervention: 'IV tenecteplase 0.25 mg/kg (max 25 mg) then endovascular thrombectomy',
    comparator: 'Endovascular thrombectomy alone',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-2)', timepoint: '90 d', result: 'Favored TNK + thrombectomy: 52.9% vs 44.1%', effectSize: 'Unadjusted RR 1.20', confidenceInterval: '95% CI 1.01 to 1.43', pValue: 'p=0.04' },
    secondaryEndpoints: [{ name: 'Successful reperfusion before thrombectomy', result: '6.1% (TNK) vs 1.1% (thrombectomy alone)' }],
    safetyFindings: { sich: '8.5% (TNK) vs 6.7% (thrombectomy alone)', mortality: '22.3% vs 19.9% at 90 d', other: '' },
    imagingCriteria: 'NCCT + CTA; large-vessel occlusion confirmed',
    applicabilityNotes: 'Supports giving IV tenecteplase before thrombectomy (rather than bypassing thrombolysis) in thrombolysis-eligible LVO presenting within 4.5 h. Does not address bridging in later windows.',
    limitations: 'Open-label; single-country (China); generalizability to other populations and EVT-access settings uncertain.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-bridge-tnk-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reinforces bridging IV thrombolysis before thrombectomy for eligible LVO within 4.5 h; do not routinely skip IVT in thrombolysis-eligible patients headed to EVT inside that window. Says nothing about later windows.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 40396577; NCT04733742. Primary numbers from published abstract, verified 2026-07-06. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "hope-2025",
    "shortName": "HOPE",
    "fullName": "Alteplase for Acute Ischemic Stroke at 4.5 to 24 Hours: The HOPE Randomized Clinical Trial",
    "topic": "extended-window-ivt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "extended-window-ivt"
    ],
    "population": {
      "n": 372,
      "ageRange": "median 72",
      "nihssRange": "",
      "timeWindow": "4.5-24 h",
      "keyInclusion": [
        "Salvageable tissue on perfusion imaging",
        "No initial plan for thrombectomy",
        "LVO and non-LVO included"
      ],
      "keyExclusion": [
        "Planned thrombectomy"
      ]
    },
    "intervention": "IV alteplase 0.9 mg/kg (max 90 mg)",
    "comparator": "Standard medical treatment",
    "primaryEndpoint": {
      "definition": "Functional independence (mRS 0-1)",
      "timepoint": "90 d",
      "result": "Favored alteplase: 40% vs 26%",
      "effectSize": "Adjusted RR 1.52",
      "confidenceInterval": "95% CI 1.14 to 2.02",
      "pValue": "p=0.004"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic ICH (36 h)",
        "result": "3.8% (alteplase) vs 0.51% (control); adjusted RR 7.34"
      },
      {
        "name": "Mortality (90 d)",
        "result": "11% in both groups"
      }
    ],
    "safetyFindings": {
      "sich": "3.8% vs 0.51%",
      "mortality": "11% vs 11%",
      "other": ""
    },
    "imagingCriteria": "CT perfusion — salvageable tissue / target mismatch",
    "applicabilityNotes": "Enrolled patients without an initial plan for EVT, including eligible patients who declined after separate discussion. This does not mean all participants were EVT-ineligible. Rescue EVT occurred in 10 patients: three assigned alteplase (including one crossover) and seven assigned standard care; eight had initially declined eligible EVT and two initially had mild/ineligible presentations that deteriorated. This is population-dependent emerging evidence, not a standard recommendation for routine thrombolysis to 24 hours; apply current guidance and full eligibility criteria.",
    "limitations": "Single-country (China); higher sICH; extended-window IVT selection criteria still being defined; do not phrase as routine thrombolysis to 24 h.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-hope-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Positive evidence for the tested perfusion-selected late-window alteplase strategy in patients with no initial EVT plan, including eligible patients who declined EVT. Selective, not evidence that all participants were EVT-ineligible.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-07-06",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "PubMed 40773205; NCT04879615. Verified 2026-07-06. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'expects-2025',
    shortName: 'EXPECTS',
    fullName: 'Alteplase for Posterior Circulation Ischemic Stroke at 4.5 to 24 Hours',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 234, ageRange: 'adults', nihssRange: 'median 3 (mainly mild)', timeWindow: '4.5-24 h', keyInclusion: ['Posterior circulation ischemic stroke', 'No extensive early hypodensity on CT', 'No planned thrombectomy'], keyExclusion: ['Planned thrombectomy'] },
    intervention: 'IV alteplase 0.9 mg/kg (max 90 mg)',
    comparator: 'Standard medical treatment',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-2)', timepoint: '90 d', result: 'Favored alteplase: 89.6% vs 72.6%', effectSize: 'Adjusted RR 1.16', confidenceInterval: '95% CI 1.03 to 1.30', pValue: 'p=0.01' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH (36 h)', result: '1.7% (alteplase) vs 0.9% (control)' }, { name: 'Mortality (90 d)', result: '5.2% vs 8.5%' }],
    safetyFindings: { sich: '1.7% vs 0.9%', mortality: '5.2% vs 8.5%', other: '' },
    imagingCriteria: 'NCCT (no extensive early hypodensity); no perfusion required',
    applicabilityNotes: 'Late-window (4.5-24 h) IV alteplase for mainly mild posterior-circulation stroke not going to thrombectomy. Emerging evidence; not a standard AHA/ASA recommendation. China-only; mostly low NIHSS.',
    limitations: 'Single-country (China); mild strokes predominate; benefit in severe posterior-circulation stroke not established.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-expects-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports late-window thrombolysis for selected mild posterior-circulation stroke without perfusion mismatch requirement; remains emerging, not routine.',
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 40174223; NCT05429476. Verified 2026-07-06. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'mind-2025',
    shortName: 'MIND',
    fullName: 'Minimally Invasive Surgery vs Medical Management Alone for Intracerebral Hemorrhage: The MIND Randomized Clinical Trial',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: { n: 236, ageRange: '18-80', nihssRange: '≥6', timeWindow: '≤72 h (surgery)', keyInclusion: ['Spontaneous supratentorial ICH 20-80 mL', 'NIHSS ≥6', 'GCS 5-15'], keyExclusion: ['Underlying vascular lesion'] },
    intervention: 'Minimally invasive surgery (Artemis device) + medical management',
    comparator: 'Guideline-based medical management alone',
    primaryEndpoint: { definition: 'Combined death & disability (ordinal mRS)', timepoint: '180 d', result: 'No significant benefit of surgery', effectSize: 'OR 1.03', confidenceInterval: '96% CI 0.62 to 1.72', pValue: 'p=0.45' },
    secondaryEndpoints: [{ name: '30-day mortality', result: '7.2% (surgery) vs 9.8% (medical)' }],
    safetyFindings: { sich: '', mortality: '7.2% vs 9.8% at 30 d', other: 'Enrollment stopped early (n=236) after a contemporaneous positive ICH trial' },
    imagingCriteria: 'CT — supratentorial ICH 20-80 mL',
    applicabilityNotes: 'MIS with the Artemis device did NOT improve 180-day outcome or reduce 30-day mortality vs medical management. Contrast with ENRICH (positive for a defined lobar-ICH pathway). Early stop limits power.',
    limitations: 'Stopped early; underpowered; device- and protocol-specific. A negative result — does not support routine MIS outside a defined pathway.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-mind-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Tempers enthusiasm for minimally invasive ICH evacuation; MIS benefit appears pathway- and technique-specific (cf. ENRICH), not universal.',
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 40892424; NCT03342664. Negative trial; verified 2026-07-06. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'chablis-t2',
    shortName: 'CHABLIS-T II',
    fullName: 'Tenecteplase Thrombolysis for Stroke up to 24 Hours After Onset With Perfusion Imaging Selection (CHABLIS-T II)',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 224, ageRange: 'adults', nihssRange: '', timeWindow: '4.5-24 h', keyInclusion: ['LVO / medium-vessel occlusion', 'CT-perfusion target mismatch'], keyExclusion: [] },
    intervention: 'IV tenecteplase (perfusion-selected)',
    comparator: 'Best medical treatment (23% received IV alteplase)',
    primaryEndpoint: { definition: 'Major reperfusion (>50% of involved ischaemic territory) without symptomatic ICH', timepoint: '24-48 h post-randomisation', result: '33.3% (37/111) vs 10.8% (12/113); no significant difference in 90-day clinical outcomes', effectSize: 'Adjusted RR 3.0', confidenceInterval: '95% CI 1.6 to 5.7', pValue: 'p=0.001' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH', result: '5.4% vs 4.4%' }],
    safetyFindings: { sich: '5.4% vs 4.4%', mortality: '', other: '' },
    imagingCriteria: 'CT perfusion — target mismatch',
    applicabilityNotes: 'Late-window perfusion-selected TNK; improved reperfusion but no difference in 90-day clinical outcomes. 54.9% of all enrolled patients (both arms) were also transferred for preplanned EVT. Emerging; not a standard recommendation.',
    limitations: 'Modest size; surrogate (reperfusion) improved without confirmed clinical benefit.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-chablis-t2-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds to the mixed late-window TNK evidence base; reinforces that reperfusion gains have not consistently translated to clinical benefit.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 39744861. Effect summary from trial report; verified 2026-07-06. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "tempo-2",
    "shortName": "TEMPO-2",
    "fullName": "Tenecteplase versus Standard of Care for Minor Ischaemic Stroke with Proven Occlusion (TEMPO-2)",
    "topic": "minor-stroke-thrombolysis",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "minor-stroke-thrombolysis"
    ],
    "population": {
      "n": 886,
      "ageRange": "adults",
      "nihssRange": "0-5 (minor)",
      "timeWindow": "≤12 h",
      "keyInclusion": [
        "Minor stroke (NIHSS 0-5)",
        "Intracranial occlusion (CTA/MRA) or focal perfusion abnormality"
      ],
      "keyExclusion": []
    },
    "intervention": "IV tenecteplase 0.25 mg/kg",
    "comparator": "Standard of care (antiplatelet)",
    "primaryEndpoint": {
      "definition": "Return to baseline function on pre-morbid mRS (ITT)",
      "timepoint": "90 d",
      "result": "No benefit: 72% (309/432) tenecteplase vs 75% (338/452) control",
      "effectSize": "RR 0.96",
      "confidenceInterval": "95% CI 0.88 to 1.04",
      "pValue": "p=0.29"
    },
    "secondaryEndpoints": [
      {
        "name": "Mortality",
        "result": "5% (20/432) vs 1% (5/454); adjusted HR 3.8, 95% CI 1.4-10.2, p=0.0085 — significant excess with tenecteplase"
      }
    ],
    "safetyFindings": {
      "sich": "8 (2%) vs 2 (<1%); RR 4.2, 95% CI 0.9-19.7, p=0.059",
      "mortality": "5% vs 1%; adjusted HR 3.8, 95% CI 1.4-10.2, p=0.0085 — statistically significant excess with tenecteplase",
      "other": ""
    },
    "imagingCriteria": "Intracranial occlusion on vascular imaging OR a relevant focal perfusion lesion; CTA-proven occlusion was not the only qualifying pathway.",
    "applicabilityNotes": "Thrombolysis did not improve outcomes in minor stroke with occlusion and showed a mortality signal — supports NOT routinely thrombolysing minor (NIHSS 0-5) non-disabling stroke on the basis of occlusion alone.",
    "limitations": "Minor stroke and clinical equipoise: patients judged to warrant routine IV thrombolysis were excluded, but the trial was not restricted to nondisabling deficits. Later subgroup analysis confirms some disabling presentations. The neutral result does not override established treatment of otherwise eligible disabling stroke.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-tempo-2-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "No routine benefit from the tested TNK strategy in this selected minor-stroke population. Do not relabel the entire cohort as nondisabling or infer that all disabling presentations were excluded.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-07-06",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "PubMed 38768626; DOI corrected to 10.1016/S0140-6736(24)00921-8. Verified 2026-07-06. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification. Correction impact unresolved: PMID 38879259 (https://doi.org/10.1016/S0140-6736(24)01209-1).",
  }),

  // ------------------- Anticoagulation after ICH in AF (dedicated evidence) -------------------
  // Totality of the randomized evidence, presented objectively: AVERROES/ARTESiA
  // (above) did NOT enrol ICH survivors; the trials below did.
  t({
    "id": "prestige-af",
    "shortName": "PRESTIGE-AF",
    "fullName": "Prevention of Stroke in Intracerebral Haemorrhage Survivors with Atrial Fibrillation",
    "topic": "af-after-ich",
    "diseaseArea": [
      "ich",
      "af-after-ich",
      "secondary-prevention"
    ],
    "population": {
      "n": 319,
      "ageRange": "median 79",
      "nihssRange": "n/a",
      "timeWindow": "Spontaneous ICH survivors with AF, mRS ≤4",
      "keyInclusion": [
        "Spontaneous ICH survivor with AF and an anticoagulation indication"
      ],
      "keyExclusion": []
    },
    "intervention": "DOAC (apixaban/dabigatran/edoxaban/rivaroxaban), n=158",
    "comparator": "No anticoagulation (antiplatelet permitted), n=161",
    "primaryEndpoint": {
      "definition": "Co-primary time-to-first ischemic stroke (superiority) and time-to-first recurrent ICH (noninferiority)",
      "timepoint": "trial follow-up",
      "result": "First events: ischemic stroke 1 versus 20; recurrent ICH 11 versus 1. All-event incidence rates are separate estimands: ischemic stroke 0.83 versus 8.60 and recurrent ICH 5.00 versus 0.82 per 100 patient-years.",
      "effectSize": "ischaemic HR 0.05; recurrent-ICH HR 10.89",
      "confidenceInterval": "ischaemic 95% CI 0.01-0.36; ICH 90% CI 1.95-60.72",
      "pValue": "ischaemic p<0.0001; ICH non-inferiority not met"
    },
    "secondaryEndpoints": [
      {
        "name": "Death",
        "result": "10% (DOAC) vs 13% (no anticoagulation)"
      }
    ],
    "safetyFindings": {
      "sich": "Recurrent ICH ~10-fold higher with DOAC",
      "mortality": "Numerically lower with DOAC (NS)",
      "other": "Serious adverse events 44% vs 55%"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The reduction in ischemic stroke accompanied more recurrent ICH in this selected AF population. Keep first-event hazard ratios distinct from all-event incidence rates, and do not interpret wide intervals as precise patient-specific risks.",
    "limitations": "Small number of events with wide intervals; selected survivors with mRS ≤4 and generally small ICH volumes. The prespecified two-sided 95% interval for superiority and 90% interval for one-sided noninferiority serve different tests and are not inherently inconsistent. Published PDF declares a corrected version on March 13, 2025; precise correction substance remains unresolved.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-prestige-af-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Objective: anticoagulation after ICH in AF trades a large ischaemic-stroke reduction against a substantial recurrent-ICH increase; individualize.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification. Correction impact unresolved: PMID 40089377 (https://doi.org/10.1016/S0140-6736(25)00466-0); PMID 40543974 (https://doi.org/10.1016/S0140-6736(25)01252-8).",
  }),
  t({
    "id": "enrich-af",
    "shortName": "ENRICH-AF",
    "fullName": "Edoxaban for Intracranial Hemorrhage Survivors with Atrial Fibrillation",
    "topic": "af-after-ich",
    "diseaseArea": [
      "ich",
      "af-after-ich",
      "secondary-prevention"
    ],
    "population": {
      "n": 948,
      "ageRange": "≥45",
      "nihssRange": "n/a",
      "timeWindow": "Intracranial-haemorrhage survivors with high-risk AF (CHA₂DS₂-VASc ≥2)",
      "keyInclusion": [
        "Intracranial haemorrhage survivor with AF"
      ],
      "keyExclusion": []
    },
    "intervention": "Edoxaban 60 mg (30 mg reduced-dose) daily",
    "comparator": "Non-anticoagulant therapy (none or antiplatelet)",
    "primaryEndpoint": {
      "definition": "Coprimary: stroke/systemic embolism; ISTH major haemorrhage",
      "timepoint": "event-driven (primary completion 2026)",
      "result": "Full efficacy not yet reported; the lobar-ICH subgroup was stopped by the DSMB for excess recurrent haemorrhagic stroke",
      "effectSize": "",
      "confidenceInterval": "",
      "pValue": ""
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "Excess recurrent haemorrhagic stroke in the lobar-ICH (CAA-enriched) subgroup → edoxaban stopped in that subgroup",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Completed July 2026 per ClinicalTrials.gov (NCT03950076; n=948); no peer-reviewed main results found in PubMed as of September 2026. The only published result to date is the DSMB safety signal in lobar ICH, after which lobar ICH was excluded. Do not infer net benefit from ENRICH-AF alone.",
    "limitations": "Primary efficacy pending (2026); lobar-arm-stopped subgroup details partly from secondary reporting.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-enrich-af-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "An interim safety concern is reported for lobar ICH/cortical SAH, but this record is not a completed, fully verified efficacy RCT. The original-source details and final efficacy result remain unresolved.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "unverified-source-limited",
    "verificationNotes": "Design/NCT (NCT03950076) and lobar-arm-stopped safety signal verified; full primary efficacy result not yet published (expected 2026). Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. The cited correspondence has no indexed abstract and its full body was not recovered; subgroup-stop claims were not independently verified from that primary source."
  }),
  t({
    id: 'sostart',
    shortName: 'SoSTART',
    fullName: 'Start or Stop Anticoagulants Randomised Trial',
    topic: 'af-after-ich',
    diseaseArea: ['ich', 'af-after-ich', 'secondary-prevention'],
    population: { n: 203, ageRange: 'adults', nihssRange: 'n/a', timeWindow: 'Survivors of spontaneous intracranial haemorrhage with AF (CHA₂DS₂-VASc ≥2)', keyInclusion: ['Spontaneous intracranial haemorrhage survivor with AF'], keyExclusion: [] },
    intervention: 'Start long-term oral anticoagulation (n=101)',
    comparator: 'Avoid anticoagulation (antiplatelet or none, n=102)',
    primaryEndpoint: { definition: 'Recurrent symptomatic spontaneous intracranial haemorrhage', timepoint: '~1-2 y', result: 'Inconclusive: 8/101 (8%) start vs 4/102 (4%) avoid; starting NOT shown non-inferior', effectSize: 'adjusted HR 2.42', confidenceInterval: '95% CI 0.72-8.09', pValue: 'p=0.152' },
    secondaryEndpoints: [{ name: 'Death', result: '22% (start) vs 11% (avoid)' }],
    safetyFindings: { sich: 'Recurrent ICH numerically higher with anticoagulation (imprecise)', mortality: 'Numerically higher with start', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Pilot-phase non-inferiority RCT; underpowered and inconclusive for the ICH-survivor anticoagulation question.',
    limitations: 'Small pilot (n=203); wide CIs; open-label.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-sostart-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: did not establish non-inferiority of starting anticoagulation after ICH; hypothesis-generating.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'apache-af',
    shortName: 'APACHE-AF',
    fullName: 'Apixaban After Anticoagulation-Associated Intracerebral Haemorrhage in Atrial Fibrillation',
    topic: 'af-after-ich',
    diseaseArea: ['ich', 'af-after-ich', 'secondary-prevention'],
    population: { n: 101, ageRange: 'median 78', nihssRange: 'n/a', timeWindow: '7-90 d after anticoagulation-associated ICH; AF, CHA₂DS₂-VASc ≥2, mRS ≤4', keyInclusion: ['Anticoagulation-associated ICH survivor with AF'], keyExclusion: [] },
    intervention: 'Apixaban 5 mg (or 2.5 mg) BID (n=50)',
    comparator: 'Avoid anticoagulation (antiplatelet allowed, n=51)',
    primaryEndpoint: { definition: 'Composite of non-fatal stroke or vascular death', timepoint: 'annualized', result: 'No difference: 26% (12.6%/y) apixaban vs 24% (11.9%/y) avoid; high absolute risk in both arms', effectSize: 'adjusted HR 1.05', confidenceInterval: '95% CI 0.48-2.31', pValue: 'p=0.90' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: 'Serious adverse events ~57-58% in both arms' },
    imagingCriteria: '',
    applicabilityNotes: 'Phase-2 feasibility RCT to estimate event rates; not powered for efficacy. ~12%/y absolute risk of non-fatal stroke or vascular death regardless of arm.',
    limitations: 'Small phase-2 (n=101); imprecise estimate.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-apache-af-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: no clear difference; both strategies carry high residual vascular risk.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'cocroach',
    shortName: 'COCROACH',
    fullName: 'Oral Anticoagulation after Intracranial Haemorrhage in AF: Individual-Patient-Data Meta-analysis',
    topic: 'af-after-ich',
    diseaseArea: ['ich', 'af-after-ich', 'secondary-prevention'],
    population: { n: 412, ageRange: '75% ≥75', nihssRange: 'n/a', timeWindow: 'AF with prior spontaneous intracranial haemorrhage (pooled RCTs: SoSTART, APACHE-AF, NASPAF-ICH, and the ICH subgroup of ELDERCARE-AF)', keyInclusion: ['Randomised in an anticoagulation-after-ICH trial'], keyExclusion: [] },
    intervention: 'Start oral anticoagulation (DOAC in 99%), n=212',
    comparator: 'Avoid anticoagulation (antiplatelet in 33%), n=200',
    primaryEndpoint: { definition: 'Any stroke or cardiovascular death', timepoint: 'pooled', result: 'Favoured anticoagulation but non-significant: 14% vs 22%', effectSize: 'HR 0.68 (I²=0%)', confidenceInterval: '95% CI 0.42-1.10', pValue: 'NS' },
    secondaryEndpoints: [{ name: 'Ischaemic major adverse cardiovascular events', result: '4% vs 19%; HR 0.27 (95% CI 0.13-0.56) — significant reduction' }, { name: 'Haemorrhagic MACE', result: 'HR 1.80 (95% CI 0.77-4.21) — numerically higher, NS' }],
    safetyFindings: { sich: 'Recurrent bleeding numerically higher with anticoagulation (NS, wide CI)', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'IPD meta-analysis of the completed pre-2025 RCTs. Anticoagulation significantly cut ischaemic events; the composite of any stroke/CV death favoured anticoagulation but was not statistically significant; recurrent bleeding was numerically higher.',
    limitations: 'Pools small trials (n=412); predates PRESTIGE-AF and ENRICH-AF.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-cocroach-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective synthesis: net benefit of anticoagulation after ICH in AF remains statistically uncertain; ischaemic reduction is offset by a non-significant bleeding increase.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- ICH surgery: decompressive craniectomy -------------------
  t({
    id: 'switch',
    shortName: 'SWITCH',
    fullName: 'Decompressive Craniectomy plus Best Medical Treatment vs Best Medical Treatment Alone for Severe Deep ICH',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: { n: 201, ageRange: '18-75', nihssRange: 'n/a', timeWindow: 'Severe deep (basal ganglia/thalamic) spontaneous ICH', keyInclusion: ['Severe deep spontaneous ICH'], keyExclusion: [] },
    intervention: 'Decompressive craniectomy (no clot evacuation) + best medical treatment (n=96 analysed)',
    comparator: 'Best medical treatment alone (n=101 analysed)',
    primaryEndpoint: { definition: 'mRS 5-6 (death or very severe disability) at 180 d', timepoint: '180 d', result: 'Favoured surgery numerically but not significant: 44% vs 58%', effectSize: 'adjusted RR 0.77; adjusted risk difference -13%', confidenceInterval: 'RR 95% CI 0.59-1.01; RD 95% CI -26 to 0', pValue: 'p=0.057' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'Numerically lower with craniectomy but not statistically significant (Cochrane 2025 analysis of SWITCH: all-cause mortality RR 0.74, 95% CI 0.45-1.19; 30-day case fatality RR 0.43, 95% CI 0.19-1.00)', other: 'Severe adverse events 41% (surgery) vs 44% (medical) — no excess with surgery' },
    imagingCriteria: '',
    applicabilityNotes: 'First RCT of decompressive craniectomy (without evacuation) for severe deep ICH — a distinct surgical modality from clot evacuation (ENRICH/MISTIE III).',
    limitations: 'Stopped early for lack of funding (n=201 randomized); primary-outcome CI crossed the null; survivors in both arms were often severely disabled.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-switch-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: numerically fewer very-poor outcomes with craniectomy, but not statistically significant; no safety excess.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification. Correction impact unresolved: PMID 38823994 (https://doi.org/10.1016/S0140-6736(24)01089-4); PMID 38971592 (https://doi.org/10.1016/S0140-6736(24)01355-2).",
  }),

  // ------------------- BP after EVT: second confirmatory RCT -------------------
  t({
    "id": "optimal-bp",
    "shortName": "OPTIMAL-BP",
    "fullName": "Intensive vs Conventional Blood Pressure Lowering after Successful Endovascular Thrombectomy",
    "topic": "bp-post-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-post-evt"
    ],
    "population": {
      "n": 306,
      "ageRange": "≥20 years",
      "nihssRange": "all",
      "timeWindow": "After successful EVT (mTICI ≥2b)",
      "keyInclusion": [
        "LVO stroke with successful reperfusion after EVT",
        "SBP ≥140 mm Hg after reperfusion; randomization within two hours"
      ],
      "keyExclusion": []
    },
    "intervention": "Intensive SBP <140 mmHg for 24 h (n=155)",
    "comparator": "Conventional SBP 140-180 mmHg for 24 h (n=150)",
    "primaryEndpoint": {
      "definition": "Functional independence (mRS 0-2) at 3 months",
      "timepoint": "90 d",
      "result": "Intensive worse: 39.4% vs 54.4%",
      "effectSize": "adjusted OR 0.56; risk difference -15.1%",
      "confidenceInterval": "OR 95% CI 0.33-0.96; RD 95% CI -26.2 to -3.9",
      "pValue": "p=0.03"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic ICH ≤36 h",
        "result": "9.0% vs 8.1% (NS)"
      }
    ],
    "safetyFindings": {
      "sich": "No difference (9.0% vs 8.1%)",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Actively lowering SBP to <140 after successful EVT reduced functional independence in this selected population with post-procedure SBP ≥140. Control patients who fell below 140 were not routinely given vasopressors solely to restore the target; mean control SBP was 138.",
    "limitations": "Terminated early on DSMB recommendation for safety concerns; single-country (South Korea); open-label with blinded endpoints.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-optimal-bp-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Avoid extrapolating the intensive-lowering result into a universal physiologic SBP floor or an instruction to raise every spontaneous value below 140. Respect the studied selection and current guidance.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Prehospital BP in undifferentiated stroke -------------------
  t({
    id: 'interact4',
    shortName: 'INTERACT4',
    fullName: 'Intensive Ambulance-Delivered Blood-Pressure Reduction in Hyperacute Stroke',
    topic: 'prehospital-stroke-care',
    diseaseArea: ['ich', 'acute-ischemic-stroke', 'prehospital-stroke-care'],
    population: {
      n: 2404,
      ageRange: 'mean age 70',
      nihssRange: 'suspected stroke with motor deficit',
      timeWindow: '≤2 h from onset, assessed in the ambulance',
      keyInclusion: ['Suspected acute stroke with a motor deficit', 'SBP ≥150 mm Hg', 'Randomized in the ambulance within 2 h of onset'],
      keyExclusion: ['Coma', 'Severe comorbidity or pre-stroke disability', 'Epilepsy or seizure at onset', 'Recent head injury (<7 d)', 'Hypoglycaemia (glucose <2.8 mmol/L)']
    },
    intervention: 'Immediate prehospital SBP lowering (target 130-140 mm Hg)',
    comparator: 'Usual prehospital blood-pressure management',
    primaryEndpoint: {
      definition: 'mRS shift at 90 days',
      timepoint: '90 d',
      result: 'Neutral overall: no difference in functional outcome',
      effectSize: 'common OR 1.00',
      confidenceInterval: '95% CI 0.87 to 1.15',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [
      { name: 'Hemorrhagic stroke subgroup (n=1041, 46.5%)', result: 'Benefit: common OR 0.75 (95% CI 0.60-0.92)' },
      { name: 'Cerebral ischemia subgroup', result: 'Harm: common OR 1.30 (95% CI 1.06-1.60)' },
      { name: 'SBP on hospital arrival', result: '159 vs 170 mm Hg' }
    ],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Serious adverse events similar between groups' },
    imagingCriteria: 'None prehospital — stroke type confirmed on arrival (imaging in 2240 patients)',
    applicabilityNotes: 'The decisive result is the qualitative interaction: the SAME prehospital intervention helped hemorrhagic and harmed ischemic stroke. Prehospital BP lowering therefore cannot be applied before stroke type is known. Conducted entirely in China, where the hemorrhage fraction (46.5%) is far above that of most Western EMS systems, which shifts the net effect.',
    limitations: 'Single-country; open-label; very high hemorrhage proportion limits transportability; subgroup effects are post-randomization by diagnosis.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-interact4-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Do not lower BP prehospital in undifferentiated stroke — benefit in hemorrhage is offset by harm in ischemia. Supports imaging-first BP decisions.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- ICH hemostatic therapy -------------------
  t({
    id: 'tich-2',
    shortName: 'TICH-2',
    fullName: 'Tranexamic Acid for Hyperacute Primary Intracerebral Haemorrhage',
    topic: 'ich-hemostatic',
    diseaseArea: ['ich', 'ich-hemostatic'],
    population: {
      n: 2325,
      ageRange: 'adults',
      nihssRange: 'not restricted',
      timeWindow: '≤8 h from onset',
      keyInclusion: ['Spontaneous intracerebral hemorrhage within 8 h'],
      keyExclusion: ['Secondary ICH', 'Contraindication to tranexamic acid']
    },
    intervention: 'Tranexamic acid 1 g IV bolus then 1 g over 8 h',
    comparator: 'Matching placebo',
    primaryEndpoint: {
      definition: 'mRS shift at day 90',
      timepoint: '90 d',
      result: 'Neutral: no significant shift',
      effectSize: 'adjusted OR 0.88',
      confidenceInterval: '95% CI 0.76 to 1.03',
      pValue: 'p=0.11'
    },
    secondaryEndpoints: [
      { name: 'Death by day 7', result: 'Fewer with TXA: 9% vs 11% (aOR 0.73, 95% CI 0.53-0.99, p=0.041)' },
      { name: 'Case fatality at 90 d', result: 'No difference: 22% vs 21% (aHR 0.92, 95% CI 0.77-1.10)' }
    ],
    safetyFindings: { sich: '', mortality: 'Early mortality reduced, 90-day mortality unchanged', other: 'Fewer serious adverse events with TXA at days 2, 7 and 90; no excess thromboembolism' },
    imagingCriteria: 'CT-confirmed spontaneous ICH',
    applicabilityNotes: 'The largest antifibrinolytic trial in ICH. Negative for functional outcome despite a real early-mortality and safety signal — the pattern of a treatment that limits early expansion without changing the disability that follows.',
    limitations: 'Broad time window (up to 8 h) diluted any expansion effect; no imaging-based selection for patients at risk of expansion.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-tich2-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Tranexamic acid is not routine in spontaneous ICH — no functional benefit, though it is safe and reduces early death.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- IVH / EVD thrombolysis -------------------
  t({
    id: 'clear-3',
    shortName: 'CLEAR III',
    fullName: 'Thrombolytic Removal of Intraventricular Haemorrhage in Treatment of Severe Stroke',
    topic: 'ivh-management',
    diseaseArea: ['ich', 'ivh-management', 'ich-surgery'],
    population: {
      n: 500,
      ageRange: 'adults',
      nihssRange: 'not restricted',
      timeWindow: 'ICU, after EVD placement',
      keyInclusion: ['Routinely placed EVD', 'Stable ICH volume <30 mL', 'IVH obstructing 3rd or 4th ventricle'],
      keyExclusion: ['Underlying vascular pathology', 'Unstable hematoma']
    },
    intervention: 'Alteplase 1 mg via EVD, up to 12 doses 8 h apart',
    comparator: '0.9% saline irrigation via EVD',
    primaryEndpoint: {
      definition: 'Good outcome (mRS ≤3) at 180 days',
      timepoint: '180 d',
      result: 'Neutral: 48% vs 45%',
      effectSize: 'RR 1.06',
      confidenceInterval: '95% CI 0.88 to 1.28',
      pValue: 'p=0.554'
    },
    secondaryEndpoints: [
      { name: '180-day case fatality', result: 'Lower with alteplase: 18% vs 29% (HR 0.60, 95% CI 0.41-0.86, p=0.006)' },
      { name: 'mRS 5 (severe disability) at 180 d (post hoc analysis)', result: 'Higher with alteplase: 17% vs 9% (RR 1.99, 95% CI 1.22-3.26, p=0.007)' },
      { name: 'Ventriculitis', result: '7% vs 12% (RR 0.55, 95% CI 0.31-0.97, p=0.048)' }
    ],
    safetyFindings: { sich: 'Symptomatic bleeding 2% vs 2% (NS)', mortality: 'Reduced', other: 'Fewer serious adverse events (46% vs 60%, RR 0.76, p=0.002)' },
    imagingCriteria: 'Serial CT every 24 h during dosing',
    applicabilityNotes: 'The mortality-versus-disability trade-off is the teaching point: intraventricular alteplase converted deaths into survivors at mRS 5, with no net gain at the mRS ≤3 threshold. Discuss explicitly in goals-of-care conversations.',
    limitations: 'Powered for mRS ≤3; the survival benefit was accompanied by more severe disability. Clot removal was often incomplete.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-clear3-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'EVD alteplase for obstructive IVH reduces mortality but does not improve functional outcome and increases survival at mRS 5.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- ICH surgical evacuation (foundational) -------------------
  t({
    id: 'stich',
    shortName: 'STICH',
    fullName: 'International Surgical Trial in Intracerebral Haemorrhage — early surgery vs initial conservative treatment',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: {
      n: 1033,
      ageRange: 'adults',
      nihssRange: 'clinical-status stratified (good vs poor prognosis)',
      timeWindow: 'surgery within 24 h of randomization',
      keyInclusion: ['Spontaneous supratentorial ICH', 'Clinical equipoise about surgery'],
      keyExclusion: ['Clear indication or contraindication to surgery']
    },
    intervention: 'Early hematoma evacuation (within 24 h) plus medical therapy',
    comparator: 'Initial conservative treatment (delayed evacuation permitted)',
    primaryEndpoint: {
      definition: 'Favourable outcome on the 8-point Glasgow Outcome Scale, prognosis-based dichotomy',
      timepoint: '6 months',
      result: 'Neutral: 26% vs 24% favourable',
      effectSize: 'OR 0.89; absolute benefit 2.3%',
      confidenceInterval: '95% CI 0.66 to 1.19 (absolute -3.2% to 7.7%)',
      pValue: 'p=0.414'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'No overall difference', other: '' },
    imagingCriteria: 'CT-confirmed supratentorial ICH',
    applicabilityNotes: '83 centres in 27 countries. Sets the default of medical management for supratentorial ICH in equipoise, and frames every subsequent surgical trial. Does NOT apply to cerebellar ICH with mass effect or hydrocephalus, where evacuation remains indicated.',
    limitations: 'Substantial crossover from conservative to surgical arms; heterogeneous surgical technique; equipoise-based enrolment selects out the clearest surgical candidates.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-stich-2005'],
    relatedActiveTrialIds: [],
    practiceImpact: 'No overall benefit from routine early craniotomy for supratentorial ICH — the basis for medical management as default in equipoise.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "stich-2",
    "shortName": "STICH II",
    "fullName": "Early surgery versus initial conservative treatment in spontaneous supratentorial lobar intracerebral haematomas",
    "topic": "ich-surgery",
    "diseaseArea": [
      "ich",
      "ich-surgery"
    ],
    "population": {
      "n": 601,
      "ageRange": "adults",
      "nihssRange": "conscious patients",
      "timeWindow": "≤48 h from ictus; surgery within 12 h of randomization",
      "keyInclusion": [
        "Superficial lobar ICH 10-100 mL",
        "No intraventricular hemorrhage",
        "Conscious"
      ],
      "keyExclusion": [
        "IVH present",
        "Deep or infratentorial hematoma"
      ]
    },
    "intervention": "Early hematoma evacuation within 12 h plus medical therapy",
    "comparator": "Initial medical treatment alone",
    "primaryEndpoint": {
      "definition": "Prognosis-based dichotomised Extended Glasgow Outcome Scale",
      "timepoint": "6 months",
      "result": "Neutral: unfavourable in 59% vs 62%",
      "effectSize": "OR 0.86; absolute difference 3.7%",
      "confidenceInterval": "95% CI 0.62 to 1.20 (absolute -4.3% to 11.6%)",
      "pValue": "p=0.367"
    },
    "secondaryEndpoints": [
      {
        "name": "Survival",
        "result": "6-month mortality 18% vs 24% (OR 0.71, 95% CI 0.48-1.06; p=0.095) — a possible small survival advantage that was not statistically significant"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "Early surgery did not increase death or disability",
      "other": ""
    },
    "imagingCriteria": "Lobar hematoma ≤1 cm from the cortical surface, no IVH",
    "applicabilityNotes": "The primary superiority comparison was neutral. Conservative care allowed rescue surgery (21% underwent delayed surgery), and the confidence interval retains uncertainty about smaller benefit and selected subgroups.",
    "limitations": "Not masked; later evacuation permitted in the conservative arm; enrolled conscious patients only. A possible survival advantage and selected-patient benefit remain uncertain; the neutral primary result is not formal equivalence.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-stich2-2013"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not establish routine benefit from the tested early open-surgery strategy, but does not prove absence of benefit or close the question for every patient.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- aSAH critical care -------------------
  t({
    id: 'sahara',
    shortName: 'SAHaRA',
    fullName: 'Liberal or Restrictive Transfusion Strategy in Aneurysmal Subarachnoid Hemorrhage',
    topic: 'sah-critical-care',
    diseaseArea: ['sah', 'sah-critical-care'],
    population: {
      n: 742,
      ageRange: 'critically ill adults',
      nihssRange: 'all clinical grades',
      timeWindow: 'critical-care period after aSAH',
      keyInclusion: ['First-ever acute aneurysmal SAH', 'Hemoglobin ≤10 g/dL within 10 days of aSAH'],
      keyExclusion: []
    },
    intervention: 'Liberal transfusion — mandatory transfusion at hemoglobin ≤10 g/dL',
    comparator: 'Restrictive transfusion — optional transfusion at hemoglobin ≤8 g/dL',
    primaryEndpoint: {
      definition: 'Unfavorable neurologic outcome (mRS ≥4) at 12 months',
      timepoint: '12 months',
      result: 'Neutral: 33.5% vs 37.7%',
      effectSize: 'RR 0.88',
      confidenceInterval: '95% CI 0.72 to 1.09',
      pValue: 'p=0.22'
    },
    secondaryEndpoints: [
      { name: 'Functional Independence Measure at 12 mo', result: '82.8 vs 79.8 (mean difference 3.01, 95% CI -5.49 to 11.51)' },
      { name: 'EQ-5D-5L utility index', result: '0.5 vs 0.5 (mean difference 0.02, 95% CI -0.04 to 0.09)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Adverse events similar in the two groups' },
    imagingCriteria: '',
    applicabilityNotes: '23 centres; the largest transfusion-threshold trial in aSAH. A liberal threshold (≤10 g/dL) did not significantly reduce unfavourable 12-month outcome compared with a restrictive one (≤8 g/dL). The contemporaneous TRAIN trial (JAMA 2024; acute brain injury including aSAH) found fewer unfavourable 180-day outcomes with a liberal <9 g/dL versus restrictive <7 g/dL threshold (62.6% vs 72.6%; adjusted RR 0.86), so the optimal threshold after aSAH remains uncertain.',
    limitations: 'Confidence interval leaves a modest benefit statistically possible; transfusion in the restrictive arm was optional rather than mandated at hemoglobin ≤8 g/dL, leaving practice in that arm to clinician discretion.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-sahara-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A liberal (Hgb ≤10) transfusion threshold after aSAH did not improve 12-month outcome — restrictive transfusion remains reasonable.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "ultra-sah",
    "shortName": "ULTRA",
    "fullName": "Ultra-Early Tranexamic Acid After Subarachnoid Haemorrhage",
    "topic": "sah-critical-care",
    "diseaseArea": [
      "sah",
      "sah-critical-care"
    ],
    "population": {
      "n": 955,
      "ageRange": "adults",
      "nihssRange": "all grades",
      "timeWindow": "Ictus <24 hours; treatment continued until aneurysm treatment or a maximum of 24 hours",
      "keyInclusion": [
        "Spontaneous CT-proven SAH"
      ],
      "keyExclusion": [
        "Selected perimesencephalic hemorrhage",
        "Treatment for DVT/PE, hypercoagulable history, pregnancy or creatinine >150 µmol/L"
      ]
    },
    "intervention": "Tranexamic acid 1 g IV bolus followed by continuous IV infusion of 1 g per eight hours, maximum 24 hours or until aneurysm treatment; maximum total 4 g",
    "comparator": "Usual care alone",
    "primaryEndpoint": {
      "definition": "Good clinical outcome (mRS 0-3) at 6 months",
      "timepoint": "6 months",
      "result": "Neutral: 60% vs 64%",
      "effectSize": "adjusted OR 0.86",
      "confidenceInterval": "95% CI 0.66 to 1.12",
      "pValue": "Not significant"
    },
    "secondaryEndpoints": [
      {
        "name": "Rebleeding before aneurysm treatment",
        "result": "10% vs 14% (OR 0.71, 95% CI 0.48-1.04)"
      },
      {
        "name": "Excellent outcome (secondary mRS 0–2)",
        "result": "229/475 (48%) versus 262/470 (56%); adjusted OR 0.73 (95% CI 0.57–0.95). Secondary finding requires multiplicity/exploratory caution."
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Serious adverse events comparable between groups"
    },
    "imagingCriteria": "CT-proven SAH",
    "applicabilityNotes": "No demonstrated primary functional benefit from the tested ultra-early, short-duration regimen. Numerically less rebleeding did not establish net benefit; the adverse excellent-outcome secondary signal should not be omitted or upgraded to definitive harm across all outcomes.",
    "limitations": "Open-label (masked outcome assessment); short treatment duration by design.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-ultra-2021"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Routine ultra-early tranexamic acid is not indicated in aSAH — prioritise early aneurysm securing instead.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "earlydrain",
    "shortName": "EARLYDRAIN",
    "fullName": "Effectiveness of Lumbar Cerebrospinal Fluid Drain Among Patients With Aneurysmal Subarachnoid Hemorrhage",
    "topic": "sah-critical-care",
    "diseaseArea": [
      "sah",
      "sah-critical-care"
    ],
    "population": {
      "n": 287,
      "ageRange": "median 55 (IQR 48-63); 68.6% female",
      "nihssRange": "all clinical grades",
      "timeWindow": "lumbar drain started within 72 h of SAH, after aneurysm securing within 48 h",
      "keyInclusion": [
        "Acute aneurysmal SAH",
        "Aneurysm treated by clipping or coiling within 48 h"
      ],
      "keyExclusion": [
        "Absent or compressed basal cisterns",
        "Therapeutic anticoagulation"
      ]
    },
    "intervention": "Additional early lumbar drain at 5 mL/h plus standard care",
    "comparator": "Standard of care alone",
    "primaryEndpoint": {
      "definition": "Unfavorable outcome (mRS 3-6) at 6 months",
      "timepoint": "6 months",
      "result": "Favors lumbar drain: 32.6% vs 44.8%",
      "effectSize": "RR 0.73; absolute risk difference -0.12",
      "confidenceInterval": "95% CI 0.52 to 0.98 (absolute -0.23 to -0.01)",
      "pValue": "p=0.04"
    },
    "secondaryEndpoints": [
      {
        "name": "Secondary infarction at discharge",
        "result": "28.5% vs 39.9% (RR 0.71, 95% CI 0.49-0.99, p=0.04)"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Drainage postponed when craniospinal pressure gradient exceeded 5 mm Hg or ICP exceeded 20 mm Hg. Securing the aneurysm alone did not establish drainage safety."
    },
    "imagingCriteria": "Post-procedural CT had to indicate safe lumbar drainage after aneurysm treatment; absent or compressed basal cisterns were excluded.",
    "applicabilityNotes": "All clinical grades were represented, but lumbar drainage required selected anatomy, post-procedure CT safety assessment and pressure monitoring. Nonprimary analyses were exploratory without multiplicity adjustment.",
    "limitations": "Open-label with blinded endpoint assessment; modest sample (287 analysable of 307 randomized) and a p-value close to 0.05; requires the aneurysm to be secured first.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-earlydrain-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Prophylactic early lumbar drainage after aneurysm securing reduced secondary infarction and unfavorable 6-month outcome.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Aneurysm securing & unruptured aneurysms -------------------
  t({
    id: 'isat-18yr',
    shortName: 'ISAT (18-year)',
    fullName: 'Durability of Endovascular Coiling versus Neurosurgical Clipping of Ruptured Cerebral Aneurysms — 18-year follow-up of the UK ISAT cohort',
    topic: 'aneurysm-treatment',
    diseaseArea: ['sah', 'aneurysm-treatment'],
    population: {
      n: 1644,
      ageRange: 'adults',
      nihssRange: 'treatment equipoise between clipping and coiling',
      timeWindow: 'randomized 1994-2002; followed 10.0-18.5 years',
      keyInclusion: ['Ruptured intracranial aneurysm', 'Equipoise between clipping and coiling'],
      keyExclusion: []
    },
    intervention: 'Endovascular coiling',
    comparator: 'Neurosurgical clipping',
    primaryEndpoint: {
      definition: 'Survival, and survival free of dependency (alive with self-reported mRS 0-2), at 10 years — long-term (tertiary-objective) follow-up of the UK cohort',
      timepoint: '10 years',
      result: 'Favors coiling: alive and independent more likely after coiling',
      effectSize: 'OR 1.34 for alive and independent; survival OR 1.35 (83% vs 79% alive)',
      confidenceInterval: '95% CI 1.07 to 1.67 (survival 1.06 to 1.73)',
      pValue: 'Significant'
    },
    secondaryEndpoints: [
      { name: 'Independence (mRS 0-2) at 10 y among responders', result: '82% vs 78% (OR 1.25, 95% CI 0.92-1.71)' },
      { name: 'Late recurrent SAH >1 y', result: '33 patients, 17 from the target aneurysm — small absolute risk, higher after coiling' }
    ],
    safetyFindings: { sich: '', mortality: 'Lower with coiling at 10 years', other: 'Greater need for aneurysm re-treatment after coiling' },
    imagingCriteria: '',
    applicabilityNotes: 'The durability question answered: the early coiling advantage persists to 10-18 years, and the higher rebleed and re-treatment rate after coiling does not erase it. Applies to aneurysms in genuine equipoise — mostly small anterior-circulation lesions in good-grade patients.',
    limitations: 'Reflects 1990s technique for both arms; UK cohort only; dependency self-reported by questionnaire.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-isat-18yr-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Coiling retains a survival and disability-free-survival advantage over clipping at 10+ years when both are feasible.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'phases',
    shortName: 'PHASES',
    fullName: 'Development of the PHASES Score for Prediction of Risk of Rupture of Intracranial Aneurysms',
    topic: 'unruptured-aneurysms',
    diseaseArea: ['sah', 'unruptured-aneurysms'],
    population: {
      n: 8382,
      ageRange: 'adults across six prospective cohorts',
      nihssRange: 'incidental unruptured saccular aneurysms',
      timeWindow: '29,166 person-years of follow-up',
      keyInclusion: ['Incidental unruptured intracranial saccular aneurysm'],
      keyExclusion: []
    },
    intervention: 'Risk-prediction model (Population, Hypertension, Age, Size, Earlier SAH, Site)',
    comparator: 'N/A — pooled individual-patient prognostic analysis',
    primaryEndpoint: {
      definition: '5-year risk of aneurysm rupture',
      timepoint: '5 years',
      result: 'Mean 1-year rupture risk 1.4%; 5-year risk 3.4% (230 ruptures)',
      effectSize: '5-year absolute risk ranges from 0.25% to >15% by risk profile',
      confidenceInterval: '1-year 95% CI 1.1-1.6; 5-year 95% CI 2.9-4.0',
      pValue: ''
    },
    secondaryEndpoints: [
      { name: 'Geographic risk', result: 'Finnish 3.6× and Japanese 2.8× the risk of North American / other European populations' },
      { name: 'Predictors', result: 'Age, hypertension, prior SAH, aneurysm size, aneurysm location, geographic region' }
    ],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'Imaging-detected incidental saccular aneurysms',
    applicabilityNotes: 'The standard bedside instrument for counselling a patient with an incidental aneurysm. The spread it quantifies — 0.25% to >15% over five years — is what makes treat-versus-observe a genuine calculation rather than a reflex.',
    limitations: 'Derived from observational cohorts, so treated aneurysms drop out of follow-up; no external validation in the original report; does not model treatment risk, which must be weighed against these numbers.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-phases-2014'],
    relatedActiveTrialIds: [],
    practiceImpact: 'PHASES gives an absolute 5-year rupture risk for incidental aneurysms, anchoring treat-versus-observe discussions.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Novel thrombolytics -------------------
  t({
    id: 'raise',
    shortName: 'RAISE',
    fullName: 'Reteplase versus Alteplase for Acute Ischemic Stroke',
    topic: 'novel-thrombolytics',
    diseaseArea: ['acute-ischemic-stroke', 'novel-thrombolytics'],
    population: {
      n: 1412,
      ageRange: 'adults',
      nihssRange: '4-25 (ages 18-80; patients planned for endovascular treatment excluded)',
      timeWindow: '≤4.5 h',
      keyInclusion: ['Ischemic stroke within 4.5 h of onset'],
      keyExclusion: ['Standard thrombolysis contraindications']
    },
    intervention: 'Reteplase 18 mg IV bolus, then a second 18 mg bolus 30 min later',
    comparator: 'Alteplase 0.9 mg/kg (max 90 mg)',
    primaryEndpoint: {
      definition: 'Excellent functional outcome (mRS 0-1) at 90 days',
      timepoint: '90 d',
      result: 'Superior: 79.5% (reteplase) vs 70.4% (alteplase)',
      effectSize: 'RR 1.13',
      confidenceInterval: '95% CI 1.05 to 1.21',
      pValue: 'p<0.001 non-inferiority; p=0.002 superiority'
    },
    secondaryEndpoints: [
      { name: 'Any intracranial hemorrhage at 90 d', result: 'Higher with reteplase: 7.7% vs 4.9% (RR 1.59, 95% CI 1.00-2.51)' },
      { name: 'Any adverse event', result: '91.6% vs 82.4% (RR 1.11, 95% CI 1.03-1.20)' }
    ],
    safetyFindings: {
      sich: 'Symptomatic ICH ≤36 h 2.4% vs 2.0% (RR 1.21, 95% CI 0.54-2.75)',
      mortality: '',
      other: 'Excess of any ICH and of adverse events overall with reteplase'
    },
    imagingCriteria: 'Standard non-contrast CT selection',
    applicabilityNotes: 'Conducted entirely in China, with an alteplase excellent-outcome rate (70.4%) far above Western trials — a signal of a milder population that limits transportability. Reteplase therefore remains an evidence-watch item rather than a protocol substitution.',
    limitations: 'Single-country; open-label; higher rates of any ICH and adverse events; unusually high control-arm outcomes.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-raise-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reteplase beat alteplase for mRS 0-1 within 4.5 h but with more ICH overall; not a default agent outside the trial setting.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Minor non-disabling stroke -------------------
  t({
    id: 'aramis',
    shortName: 'ARAMIS',
    fullName: 'Dual Antiplatelet Therapy vs Alteplase for Patients With Minor Nondisabling Acute Ischemic Stroke',
    topic: 'minor-stroke-thrombolysis',
    diseaseArea: ['acute-ischemic-stroke', 'minor-stroke-thrombolysis', 'dapt-minor-stroke'],
    population: {
      n: 760,
      ageRange: 'median 64 (IQR 57-71); 31.0% women',
      nihssRange: '≤5, with ≤1 point on key single items (median 2)',
      timeWindow: '≤4.5 h',
      keyInclusion: ['Minor non-disabling ischemic stroke within 4.5 h'],
      keyExclusion: ['Disabling deficit on key NIHSS items']
    },
    intervention: 'DAPT — clopidogrel 300 mg then 75 mg daily plus aspirin 100 mg daily for 12±2 days, then guideline antiplatelet therapy',
    comparator: 'IV alteplase 0.9 mg/kg, then guideline antiplatelet therapy from 24 h',
    primaryEndpoint: {
      definition: 'Excellent functional outcome (mRS 0-1) at 90 days — non-inferiority margin -4.5%',
      timepoint: '90 d',
      result: 'Non-inferior: 93.8% (DAPT) vs 91.4% (alteplase)',
      effectSize: 'Risk difference 2.3%; lower bound of 1-sided 97.5% CI -1.5%',
      confidenceInterval: '95% CI -1.5% to 6.2%',
      pValue: 'p<0.001 for non-inferiority'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic ICH to 90 d', result: '0.3% (1/371) with DAPT vs 0.9% (3/351) with alteplase' }
    ],
    safetyFindings: { sich: '0.3% vs 0.9%', mortality: '', other: '' },
    imagingCriteria: 'Standard CT-based selection',
    applicabilityNotes: 'Directly addresses the common bedside question of whether to thrombolyse a minor non-disabling deficit. DAPT was non-inferior with numerically less symptomatic hemorrhage. Note the strict definition of non-disabling used here (≤1 point on key single items) — it does not license withholding thrombolysis from a low-NIHSS patient whose deficit is disabling, such as isolated aphasia or hemianopia.',
    limitations: 'Open-label; conducted at 38 Chinese hospitals; very high event-free rates in both arms leave little room to separate them; excludes patients with a definite indication for anticoagulation (e.g., cardioembolic stroke), and LVO was uncommon (36 of 480 patients with vessel imaging in a post hoc analysis).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aramis-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'For genuinely non-disabling minor stroke within 4.5 h, DAPT is a reasonable alternative to IV thrombolysis.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Perfusion-selected TNK -------------------
  t({
    id: 'taste',
    shortName: 'TASTE',
    fullName: 'Tenecteplase versus Alteplase for Thrombolysis in Patients Selected by Perfusion Imaging within 4.5 h',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
    population: {
      n: 680,
      ageRange: 'median 74 (IQR 63-82); 38% female',
      nihssRange: 'median NIHSS 7 (IQR 4-11)',
      timeWindow: '≤4.5 h from onset or last known well',
      keyInclusion: ['Target mismatch on perfusion imaging', 'Not being considered for EVT'],
      keyExclusion: ['Planned endovascular thrombectomy']
    },
    intervention: 'Tenecteplase 0.25 mg/kg',
    comparator: 'Alteplase 0.90 mg/kg',
    primaryEndpoint: {
      definition: 'No disability (mRS 0-1) at 3 months — non-inferiority margin -0.03',
      timepoint: '3 months',
      result: 'Non-inferiority met per-protocol (59% vs 56%) but NOT in intention-to-treat (57% vs 55%)',
      effectSize: 'ITT standardised risk difference 0.03; per-protocol 0.05',
      confidenceInterval: 'ITT 95% CI -0.033 to 0.10; per-protocol -0.02 to 0.12',
      pValue: 'ITT one-tailed p=0.031; per-protocol p=0.01'
    },
    secondaryEndpoints: [
      { name: '90-day mortality', result: '7% vs 4% (SRD 0.02, 95% CI -0.02 to 0.05)' }
    ],
    safetyFindings: { sich: '3% (9/337) vs 2% (6/340); risk difference 0.01 (95% CI -0.01 to 0.03)', mortality: '7% vs 4%', other: '' },
    imagingCriteria: 'CT or MR perfusion target mismatch required for entry',
    applicabilityNotes: '35 hospitals in eight countries; one of the few tenecteplase-versus-alteplase trials to require perfusion-imaging mismatch for entry (the earlier 75-patient phase 2B trial by Parsons et al., NEJM 2012, also selected on CT-perfusion mismatch). Recruitment stopped early once other trials reported non-inferiority, which left it underpowered; read it as supporting evidence rather than an independent verdict.',
    limitations: 'Stopped early (680 of a planned 832); open-label; non-inferiority met only per-protocol, not in ITT.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-taste-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds perfusion-selected, multi-country support for TNK 0.25 mg/kg, and shows large-scale CTP-guided IVT selection is feasible.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Prehospital systems of care -------------------
  t({
    id: 'best-msu',
    shortName: 'BEST-MSU',
    fullName: 'Prospective, Multicenter, Controlled Trial of Mobile Stroke Units',
    topic: 'prehospital-stroke-care',
    diseaseArea: ['acute-ischemic-stroke', 'prehospital-stroke-care'],
    population: {
      n: 1515,
      ageRange: 'adults',
      nihssRange: 'all; 1047 were tPA-eligible',
      timeWindow: '≤4.5 h from onset',
      keyInclusion: ['Acute stroke symptoms within 4.5 h', 'Attended by MSU or EMS on alternating weeks'],
      keyExclusion: []
    },
    intervention: 'Mobile stroke unit — ambulance with CT scanner and stroke staff',
    comparator: 'Standard emergency medical services management',
    primaryEndpoint: {
      definition: 'Utility-weighted mRS ≥0.91 at 90 days among tPA-eligible patients',
      timepoint: '90 d',
      result: 'Favors MSU: mean uw-mRS 0.72 vs 0.66',
      effectSize: 'adjusted OR 2.43',
      confidenceInterval: '95% CI 1.75 to 3.36',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [
      { name: 'Onset-to-tPA time', result: '72 min (MSU) vs 108 min (EMS)' },
      { name: 'tPA delivered among eligible', result: '97.1% vs 79.5%' },
      { name: 'mRS 0-1 at 90 d', result: '55.0% vs 44.4%' },
      { name: '90-day mortality', result: '8.9% vs 11.9%' }
    ],
    safetyFindings: { sich: '', mortality: 'Numerically lower with MSU', other: '' },
    imagingCriteria: 'On-board non-contrast CT',
    applicabilityNotes: 'The anchor trial for mobile stroke units. Two mechanisms drive the benefit and both matter: 36 minutes faster to thrombolysis, and a far higher proportion of eligible patients actually treated (97% vs 80%). Cost and population density govern whether the model transfers.',
    limitations: 'Alternating-week design rather than individual randomization; conducted in US metropolitan areas; cost-effectiveness not addressed here.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-best-msu-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Mobile stroke units improved 90-day disability outcomes vs standard EMS, via faster and more complete thrombolysis delivery.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 37379155 (https://doi.org/10.1056/NEJMx230002).",
  }),
  t({
    "id": "racecat",
    "shortName": "RACECAT",
    "fullName": "Direct Transportation to a Thrombectomy-Capable Center vs Local Stroke Center in Suspected Large-Vessel Occlusion in Nonurban Areas",
    "topic": "prehospital-stroke-care",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "prehospital-stroke-care"
    ],
    "population": {
      "n": 1401,
      "ageRange": "median 75 (IQR 65-83); 56% men",
      "nihssRange": "median NIHSS 17 (IQR 11-21)",
      "timeWindow": "prehospital, nonurban Catalonia; estimated arrival at a thrombectomy-capable centre <7 h from last seen well",
      "keyInclusion": [
        "Suspected large-vessel occlusion by EMS in an area whose closest stroke centre cannot perform thrombectomy"
      ],
      "keyExclusion": []
    },
    "intervention": "Direct transport to a thrombectomy-capable centre (mothership)",
    "comparator": "Transport to the closest local stroke centre (drip-and-ship)",
    "primaryEndpoint": {
      "definition": "90-day mRS in the target ischemic-stroke population (n=949)",
      "timepoint": "90 d",
      "result": "Neutral: median mRS 3 in both arms",
      "effectSize": "adjusted common OR 1.03",
      "confidenceInterval": "95% CI 0.82 to 1.29",
      "pValue": "Not significant; halted for futility"
    },
    "secondaryEndpoints": [
      {
        "name": "IV thrombolysis received",
        "result": "Lower with direct transport: 47.5% vs 60.4% (OR 0.59, 95% CI 0.45-0.76)"
      },
      {
        "name": "Thrombectomy received",
        "result": "Higher with direct transport: 48.8% vs 39.4% (OR 1.46, 95% CI 1.13-1.89)"
      },
      {
        "name": "90-day mortality (safety population)",
        "result": "27.3% vs 27.2% (aHR 0.97, 95% CI 0.79-1.18)"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "No difference",
      "other": ""
    },
    "imagingCriteria": "RACE scale used for prehospital LVO suspicion",
    "applicabilityNotes": "Bypass routing increased EVT and reduced IV thrombolysis without a significant primary disability difference. The trial did not establish that these treatment changes quantitatively cancelled each other.",
    "limitations": "Cluster randomization by a pre-established temporal sequence (stratified by time band, territory and weekday); stopped for futility at the second interim analysis; single region; findings explicitly require replication.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-racecat-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "The tested routing strategy did not improve average disability in this setting. Transport time, local capability and patient selection matter; neutrality does not identify the mechanism or prove equivalence.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- EVT late window: collateral-based selection -------------------
  t({
    id: 'mr-clean-late',
    shortName: 'MR CLEAN-LATE',
    fullName: 'Endovascular Treatment 6-24 h After Stroke Selected by Collateral Flow on CT Angiography',
    topic: 'evt-late-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-late-window'],
    population: {
      n: 502,
      ageRange: '≥18; 52% female',
      nihssRange: '≥2',
      timeWindow: '6-24 h from onset or last seen well',
      keyInclusion: ['Anterior-circulation large-vessel occlusion', 'Collateral flow on CTA'],
      keyExclusion: ['Already eligible for late-window EVT under DAWN/DEFUSE-3 perfusion criteria — those patients were treated per guideline and excluded']
    },
    intervention: 'Endovascular treatment plus best medical management',
    comparator: 'Best medical management alone',
    primaryEndpoint: {
      definition: 'mRS shift at 90 days',
      timepoint: '90 d',
      result: 'Favors EVT: median mRS 3 (IQR 2-5) vs 4 (IQR 2-6)',
      effectSize: 'adjusted common OR 1.67',
      confidenceInterval: '95% CI 1.20 to 2.32',
      pValue: 'Significant'
    },
    secondaryEndpoints: [
      { name: 'All-cause mortality at 90 d', result: '24% vs 30% (aOR 0.72, 95% CI 0.44-1.18)' }
    ],
    safetyFindings: {
      sich: 'Higher with EVT: 7% vs 2% (aOR 4.59, 95% CI 1.49-14.10)',
      mortality: 'No significant difference',
      other: ''
    },
    imagingCriteria: 'CTA collateral flow — deliberately NOT perfusion mismatch',
    applicabilityNotes: 'Extends late-window EVT beyond the DAWN/DEFUSE-3 perfusion paradigm: patients selected on CTA collaterals alone benefited, and these were patients who were not eligible under the Dutch guideline\'s DAWN/DEFUSE-3-derived clinical and perfusion-imaging criteria. Practically, this means a centre without CT perfusion can still select late-window candidates. Weigh against a roughly four-fold increase in symptomatic hemorrhage.',
    limitations: 'Open-label with blinded endpoints; single-country (18 Dutch centres); guideline-eligible patients were excluded, so this is a distinct, more marginal population.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-mrclean-late-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'CTA collateral status alone can select late-window (6-24 h) EVT candidates who are not eligible under DAWN/DEFUSE-3-derived clinical and perfusion-imaging criteria.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- EVT technique & adjuncts -------------------
  t({
    id: 'angel-reboot',
    shortName: 'ANGEL-REBOOT',
    fullName: 'Bailout Intracranial Angioplasty or Stenting Following Thrombectomy for Acute Large-Vessel Occlusion',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique', 'icas-prevention'],
    population: {
      n: 348,
      ageRange: 'median 63 (IQR 55-69); 74% male',
      nihssRange: 'not restricted',
      timeWindow: '≤24 h from onset',
      keyInclusion: ['Unsuccessful recanalisation (eTICI 0-2a) or residual stenosis >70% with reocclusion risk after thrombectomy'],
      keyExclusion: []
    },
    intervention: 'Bailout angioplasty or stenting after thrombectomy',
    comparator: 'Standard therapy — continue or terminate the thrombectomy procedure',
    primaryEndpoint: {
      definition: 'mRS shift at 90 days',
      timepoint: '90 d',
      result: 'Neutral, numerically worse with bailout',
      effectSize: 'common OR 0.86',
      confidenceInterval: '95% CI 0.59 to 1.24',
      pValue: 'p=0.41'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic ICH', result: 'Higher with bailout: 5% (8/175) vs 1% (1/169)' },
      { name: 'Parenchymal hematoma type 2', result: '3% (6/175) vs 0' },
      { name: 'Procedure-related arterial dissection', result: '14% (24/176) vs 3% (5/172)' }
    ],
    safetyFindings: {
      sich: '5% vs 1%',
      mortality: 'Similar: 11% vs 10%',
      other: 'Marked excess of dissection and parenchymal hematoma with bailout'
    },
    imagingCriteria: 'eTICI grading of post-thrombectomy reperfusion',
    applicabilityNotes: 'Answers a question that arises mid-procedure: after a failed pass or with high-grade residual stenosis, does rescue angioplasty or stenting help? It did not, and it caused substantially more dissection and hemorrhage. 36 Chinese centres, where intracranial atherosclerotic occlusion is more prevalent than in Western cohorts.',
    limitations: 'Open-label; tirofiban was used off-label in 96% of patients, which the authors flag as affecting generalisability; Chinese population with a high ICAS burden.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-angel-reboot-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Routine bailout angioplasty/stenting after failed or unstable thrombectomy did not improve outcome and increased dissection and hemorrhage.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'protect-mt',
    shortName: 'PROTECT-MT',
    fullName: 'Balloon Guide Catheters for Endovascular Thrombectomy in Acute Ischaemic Stroke Due to Large-Vessel Occlusion',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique'],
    population: {
      n: 329,
      ageRange: 'median 69 (IQR 59-76); 61% male',
      nihssRange: 'not restricted',
      timeWindow: '≤24 h from onset',
      keyInclusion: ['Anterior-circulation LVO eligible for thrombectomy per local guidelines'],
      keyExclusion: []
    },
    intervention: 'Balloon guide catheter during thrombectomy',
    comparator: 'Conventional guide catheter',
    primaryEndpoint: {
      definition: 'mRS shift at 90 days',
      timepoint: '90 d',
      result: 'WORSE with balloon guide catheter',
      effectSize: 'adjusted common OR 0.66',
      confidenceInterval: '95% CI 0.45 to 0.98',
      pValue: 'p=0.037'
    },
    secondaryEndpoints: [
      { name: 'All-cause mortality at 90 d', result: 'Numerically higher: 24% (39/164) vs 16% (26/165)' }
    ],
    safetyFindings: {
      sich: 'No significant difference',
      mortality: 'Numerically higher with balloon guide catheter',
      other: 'No significant difference in intracranial hemorrhage or other serious adverse events'
    },
    imagingCriteria: '',
    applicabilityNotes: 'Terminated early for safety after 329 of a planned larger enrolment. A cautionary result for a device widely assumed beneficial on mechanistic grounds — flow arrest was expected to reduce distal embolisation, and the randomized comparison found worse function instead. Treat as hypothesis-generating pending replication, which the authors call for.',
    limitations: 'Stopped early for safety, so the effect estimate may be exaggerated; open-label; 28 Chinese centres; operator familiarity with balloon guide catheters may differ elsewhere.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-protect-mt-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Balloon guide catheters led to worse 90-day function than conventional guide catheters; the trial was halted for safety.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Foundational antiplatelet trials -------------------
  t({
    id: 'sps3',
    shortName: 'SPS3',
    fullName: 'Secondary Prevention of Small Subcortical Strokes — clopidogrel added to aspirin after lacunar stroke',
    topic: 'lacunar-svd-prevention',
    diseaseArea: ['secondary-prevention', 'lacunar-svd-prevention'],
    population: {
      n: 3020,
      ageRange: 'mean 63; 63% men',
      nihssRange: 'recent symptomatic lacunar infarct',
      timeWindow: 'long-term secondary prevention; mean follow-up 3.4 years',
      keyInclusion: ['MRI-confirmed recent symptomatic lacunar infarct'],
      keyExclusion: ['Cortical infarct', 'Major cardioembolic source']
    },
    intervention: 'Clopidogrel 75 mg daily plus aspirin 325 mg daily',
    comparator: 'Aspirin 325 mg daily plus placebo',
    primaryEndpoint: {
      definition: 'Any recurrent stroke (ischemic or intracranial hemorrhage)',
      timepoint: 'mean 3.4 y',
      result: 'Neutral: 2.5%/y (DAPT) vs 2.7%/y (aspirin)',
      effectSize: 'HR 0.92',
      confidenceInterval: '95% CI 0.72 to 1.16',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [
      { name: 'Recurrent ischemic stroke', result: 'HR 0.82 (95% CI 0.63-1.09)' },
      { name: 'Disabling or fatal stroke', result: 'HR 1.06 (95% CI 0.69-1.64)' },
      { name: 'Recurrent ischemic strokes that were lacunar', result: '71% (133/187)' }
    ],
    safetyFindings: {
      sich: '',
      mortality: 'INCREASED with DAPT: 113 vs 77 deaths (HR 1.52, 95% CI 1.14-2.04, p=0.004), not explained by fatal hemorrhage',
      other: 'Major hemorrhage nearly doubled: 2.1%/y vs 1.1%/y (HR 1.97, 95% CI 1.41-2.71, p<0.001)'
    },
    imagingCriteria: 'MRI-confirmed lacunar infarct required for entry',
    applicabilityNotes: 'The definitive answer against LONG-TERM dual antiplatelet therapy after lacunar stroke — not merely futile but harmful, with nearly doubled major hemorrhage and increased all-cause mortality. It does not contradict CHANCE/POINT, which tested 21-90 days of DAPT started acutely; the distinction between short-course acute DAPT and indefinite DAPT is exactly what SPS3 establishes.',
    limitations: 'Aspirin dose (325 mg) higher than contemporary practice; the mortality signal was unexplained and may be partly chance.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-sps3-2012'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Do not use long-term aspirin + clopidogrel after lacunar stroke — no benefit, doubled major bleeding, increased mortality.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'match',
    shortName: 'MATCH',
    fullName: 'Aspirin and Clopidogrel Compared with Clopidogrel Alone after Recent Ischaemic Stroke or TIA in High-Risk Patients',
    topic: 'secondary-prevention',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: {
      n: 7599,
      ageRange: 'adults',
      nihssRange: 'recent ischemic stroke or TIA plus ≥1 additional vascular risk factor',
      timeWindow: '18 months of treatment and follow-up',
      keyInclusion: ['Recent ischemic stroke or TIA', 'At least one additional vascular risk factor', 'Already receiving clopidogrel 75 mg daily'],
      keyExclusion: []
    },
    intervention: 'Aspirin 75 mg daily added to clopidogrel 75 mg daily',
    comparator: 'Placebo added to clopidogrel 75 mg daily',
    primaryEndpoint: {
      definition: 'Composite of ischemic stroke, MI, vascular death, or rehospitalisation for acute ischemia',
      timepoint: '18 months',
      result: 'Neutral: 15.7% vs 16.7%',
      effectSize: 'Relative risk reduction 6.4%; absolute risk reduction 1%',
      confidenceInterval: 'RRR 95% CI -4.6% to 16.3%; ARR -0.6% to 2.7%',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [
      { name: 'Life-threatening bleeding', result: 'Increased: 2.6% vs 1.3% (absolute risk increase 1.3%, 95% CI 0.6-1.9)' },
      { name: 'Mortality', result: 'No difference' }
    ],
    safetyFindings: { sich: '', mortality: 'No difference', other: 'Life-threatening and major bleeding both increased with added aspirin' },
    imagingCriteria: '',
    applicabilityNotes: 'With SPS3, one of the two trials that established the bleeding cost of prolonged dual antiplatelet therapy in stroke. Treatment ran 18 months — a duration no current guideline endorses — and the bleeding penalty appeared without a matching ischemic benefit.',
    limitations: 'Enrolled a high-risk, largely small-vessel population; predates the short-course acute DAPT paradigm; single antiplatelet backbone was clopidogrel rather than aspirin.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-match-2004'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adding aspirin to clopidogrel for 18 months after stroke/TIA gave no significant benefit and doubled life-threatening bleeding.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Antiplatelets after ICH -------------------
  t({
    "id": "restart",
    "shortName": "RESTART",
    "fullName": "REstart or STop Antithrombotics Randomised Trial — antiplatelet therapy after intracerebral haemorrhage",
    "topic": "ich-secondary-prevention",
    "diseaseArea": [
      "ich",
      "ich-secondary-prevention",
      "secondary-prevention"
    ],
    "population": {
      "n": 537,
      "ageRange": "≥18",
      "nihssRange": "ICH survivors",
      "timeWindow": "randomized a median of 76 days (IQR 29-146) after ICH; followed up to 5 years",
      "keyInclusion": [
        "Taking antithrombotic therapy for occlusive vascular disease when ICH occurred",
        "Antithrombotic therapy discontinued",
        "Survived 24 h"
      ],
      "keyExclusion": []
    },
    "intervention": "Start antiplatelet therapy",
    "comparator": "Avoid antiplatelet therapy",
    "primaryEndpoint": {
      "definition": "Recurrent symptomatic intracerebral hemorrhage",
      "timepoint": "median 2.0 y (IQR 1.0-3.0)",
      "result": "Fewer recurrences with antiplatelet therapy: 4% (12/268) vs 9% (23/268)",
      "effectSize": "adjusted HR 0.51",
      "confidenceInterval": "95% CI 0.25 to 1.03",
      "pValue": "p=0.060"
    },
    "secondaryEndpoints": [
      {
        "name": "Major hemorrhagic events",
        "result": "7% vs 9% (aHR 0.71, 95% CI 0.39-1.30, p=0.27)"
      },
      {
        "name": "Major occlusive vascular events",
        "result": "15% vs 14% (aHR 1.02, 95% CI 0.65-1.60, p=0.92)"
      },
      {
        "name": "Extended randomized-cohort follow-up (2021)",
        "result": "Median 3.0 years (up to seven): recurrent ICH 22/268 (8.2%) versus 25/268 (9.3%); adjusted HR 0.87 (95% CI 0.49–1.55), P=.64."
      }
    ],
    "safetyFindings": {
      "sich": "Recurrent ICH numerically LOWER on antiplatelet therapy",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Initial and extended follow-up did not detect an increase in recurrent ICH from restarting antiplatelet therapy, but the extended 95% CI permits clinically important benefit or harm. This is follow-up of the same randomized cohort, not an independent trial.",
    "limitations": "Open-label; modest size and event numbers; median 76-day delay to randomization means very early restart is untested; underpowered for occlusive-event benefit. The 2021 extension of the same cohort gives a wider long-term recurrence HR interval (0.49–1.55); neither report establishes universal safety or excludes clinically important harm.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-restart-2019",
      "cit-restart-extended-2021"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports individualized antiplatelet resumption when indicated after ICH; the extended result does not exclude all but a very small recurrence-risk increase.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "verificationNotes": "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification."
  }),

  // ------------------- LAA occlusion, subclinical AF, valvular AF -------------------
  t({
    id: 'laaos-3',
    shortName: 'LAAOS III',
    fullName: 'Left Atrial Appendage Occlusion during Cardiac Surgery to Prevent Stroke',
    topic: 'laa-occlusion',
    diseaseArea: ['secondary-prevention', 'laa-occlusion'],
    population: {
      n: 4770,
      ageRange: 'mean 71',
      nihssRange: 'AF with mean CHA₂DS₂-VASc 4.2 (≥2 required)',
      timeWindow: 'mean follow-up 3.8 years',
      keyInclusion: ['Atrial fibrillation', 'CHA₂DS₂-VASc ≥2', 'Scheduled for cardiac surgery for another indication'],
      keyExclusion: []
    },
    intervention: 'Surgical left atrial appendage occlusion during the planned cardiac surgery, plus usual care including oral anticoagulation',
    comparator: 'No occlusion, plus usual care including oral anticoagulation',
    primaryEndpoint: {
      definition: 'Ischemic stroke (including TIA with positive neuroimaging) or systemic embolism',
      timepoint: 'mean 3.8 y',
      result: 'Favors occlusion: 4.8% vs 7.0%',
      effectSize: 'HR 0.67',
      confidenceInterval: '95% CI 0.53 to 0.85',
      pValue: 'p=0.001'
    },
    secondaryEndpoints: [
      { name: 'Continued oral anticoagulation at 3 y', result: '76.8% of participants' },
      { name: 'Assigned procedure received', result: '92.1%' }
    ],
    safetyFindings: { sich: '', mortality: 'No significant difference', other: 'Perioperative bleeding and heart failure did not differ significantly' },
    imagingCriteria: '',
    applicabilityNotes: 'The critical design point: the benefit was ON TOP of continued anticoagulation, not instead of it — three-quarters were still anticoagulated at 3 years. LAAOS III therefore supports concomitant occlusion in patients already having cardiac surgery; it says nothing about percutaneous LAAO as an anticoagulation substitute.',
    limitations: 'Applies only to patients undergoing cardiac surgery for another indication; surgical, not percutaneous, occlusion; participants unaware of assignment but surgeons were not.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-laaos3-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Concomitant surgical LAA occlusion during cardiac surgery reduced stroke/systemic embolism by a third, additive to ongoing anticoagulation.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "noah-afnet6",
    "shortName": "NOAH-AFNET 6",
    "fullName": "Anticoagulation with Edoxaban in Patients with Atrial High-Rate Episodes",
    "topic": "subclinical-af",
    "diseaseArea": [
      "secondary-prevention",
      "subclinical-af"
    ],
    "population": {
      "n": 2536,
      "ageRange": "mean 78; 37.4% women",
      "nihssRange": "device-detected atrial high-rate episodes ≥6 min, median duration 2.8 h",
      "timeWindow": "median follow-up 21 months (terminated early)",
      "keyInclusion": [
        "Age ≥65",
        "AHRE ≥6 minutes on an implanted device",
        "≥1 additional stroke risk factor"
      ],
      "keyExclusion": [
        "ECG-documented atrial fibrillation"
      ]
    },
    "intervention": "Edoxaban",
    "comparator": "No anticoagulation/placebo, with aspirin when otherwise indicated; not a uniformly aspirin-free group",
    "primaryEndpoint": {
      "definition": "Composite of cardiovascular death, stroke, or systemic embolism",
      "timepoint": "median 21 months",
      "result": "Neutral: 3.2%/patient-year vs 4.0%/patient-year",
      "effectSize": "HR 0.81",
      "confidenceInterval": "95% CI 0.60 to 1.08",
      "pValue": "p=0.15"
    },
    "secondaryEndpoints": [
      {
        "name": "Stroke incidence",
        "result": "Approximately 1% per patient-year in BOTH groups — far lower than in clinical AF"
      },
      {
        "name": "Progression to ECG-diagnosed AF",
        "result": "18.2% overall (8.7% per patient-year)"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Composite of death or major bleeding INCREASED with edoxaban: 5.9%/patient-year vs 4.5%/patient-year (HR 1.31, 95% CI 1.02-1.67, p=0.03)"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Edoxaban did not significantly reduce the tested primary composite and increased the death-or-major-bleeding safety composite. The imprecise superiority result does not rule out a smaller effect or prove that no patient can benefit.",
    "limitations": "Terminated early for safety and informal futility; median AHRE duration only 2.8 h; elderly population with competing bleeding risk. Original full main report remained inaccessible in the audit; abstract and investigator-reported cointerventions are distinguished. No detailed protocol clearance.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-noah-afnet6-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not support routine edoxaban for all device-detected AHRE on the basis of this trial. Compare population, endpoint and aspirin cointervention differences when discussing ARTESiA; do not imply each safety component independently increased.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: original abstract; full main report remained inaccessible.",
  }),
  t({
    id: 'invictus',
    shortName: 'INVICTUS',
    fullName: 'Rivaroxaban in Rheumatic Heart Disease-Associated Atrial Fibrillation',
    topic: 'valvular-rheumatic-af',
    diseaseArea: ['secondary-prevention', 'valvular-rheumatic-af'],
    population: {
      n: 4531,
      ageRange: 'mean 50.5; 72.3% women',
      nihssRange: 'AF with echocardiographic rheumatic heart disease',
      timeWindow: 'mean follow-up 3.1 years (restricted mean survival time analysis because hazards were non-proportional)',
      keyInclusion: ['AF with rheumatic heart disease and either CHA₂DS₂-VASc ≥2, mitral-valve area ≤2 cm², left atrial spontaneous echo contrast, or left atrial thrombus'],
      keyExclusion: []
    },
    intervention: 'Rivaroxaban at standard doses',
    comparator: 'Dose-adjusted vitamin K antagonist',
    primaryEndpoint: {
      definition: 'Composite of stroke, systemic embolism, myocardial infarction, or death from vascular or unknown cause',
      timepoint: 'restricted mean survival time',
      result: 'VKA SUPERIOR: restricted mean survival 1599 d (rivaroxaban) vs 1675 d (VKA)',
      effectSize: 'Difference -76 days favouring VKA',
      confidenceInterval: '95% CI -121 to -31 days',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [
      { name: 'Death', result: 'Higher with rivaroxaban: restricted mean survival 1608 d vs 1680 d (difference -72 d, 95% CI -117 to -28)' },
      { name: 'Study-drug discontinuation', result: 'More common with rivaroxaban at all visits' }
    ],
    safetyFindings: { sich: '', mortality: 'Higher with rivaroxaban', other: 'No significant difference in major bleeding' },
    imagingCriteria: 'Echocardiographic confirmation of rheumatic heart disease',
    applicabilityNotes: 'One of the few settings where a DOAC is clearly INFERIOR to warfarin. Rheumatic mitral disease with AF is a warfarin indication, and the excess mortality with rivaroxaban was not explained by bleeding. A young (mean age 50) predominantly female cohort in low- and middle-income countries — clinically the population most affected worldwide.',
    limitations: 'Open-label; higher discontinuation in the rivaroxaban arm may have contributed; non-proportional hazards required restricted-mean-survival analysis; open questions remain about DOACs in other valvular lesions.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-invictus-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Use warfarin, not a DOAC, for AF with rheumatic mitral valve disease — rivaroxaban had worse cardiovascular outcomes and higher mortality.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Anti-inflammatory secondary prevention -------------------
  t({
    id: 'convince',
    shortName: 'CONVINCE',
    fullName: 'Long-Term Colchicine for the Prevention of Vascular Recurrent Events in Non-Cardioembolic Stroke',
    topic: 'inflammation-stroke-prevention',
    diseaseArea: ['secondary-prevention', 'inflammation-stroke-prevention'],
    population: {
      n: 3144,
      ageRange: 'adults',
      nihssRange: 'non-severe ischemic stroke or high-risk TIA',
      timeWindow: 'long-term; randomized 2016-2022, follow-up to Jan 2024',
      keyInclusion: ['Non-severe, non-cardioembolic ischemic stroke or high-risk TIA'],
      keyExclusion: ['Cardioembolic source']
    },
    intervention: 'Colchicine 0.5 mg daily plus guideline-based usual care',
    comparator: 'Guideline-based usual care alone',
    primaryEndpoint: {
      definition: 'First fatal or non-fatal recurrent ischemic stroke, MI, cardiac arrest, or hospitalisation for unstable angina',
      timepoint: 'long-term follow-up',
      result: 'Neutral: 9.8% vs 11.7% (3.32 vs 3.92 per 100 person-years)',
      effectSize: 'HR 0.84',
      confidenceInterval: '95% CI 0.68 to 1.05',
      pValue: 'p=0.12 (significance threshold 0.048)'
    },
    secondaryEndpoints: [
      { name: 'C-reactive protein', result: 'Lower with colchicine at 28 days and 1, 2 and 3 years (p<0.05 at all timepoints)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Serious adverse event rates similar between groups' },
    imagingCriteria: '',
    applicabilityNotes: 'Underpowered rather than clearly negative: COVID-related budget constraints stopped it before the planned 367 outcomes accrued, and the confidence interval still admits a worthwhile benefit. CRP fell as expected, so the anti-inflammatory mechanism engaged — the open question is whether it translates to events in stroke as it did in coronary disease.',
    limitations: 'Open-label; terminated early for funding with fewer events than planned; heterogeneous stroke mechanisms dilute any atherosclerosis-specific effect.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-convince-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Colchicine is not established for stroke prevention — CONVINCE was neutral but underpowered; read with CHANCE-3.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "chance-3",
    "shortName": "CHANCE-3",
    "fullName": "Colchicine in Patients with Acute Ischaemic Stroke or Transient Ischaemic Attack",
    "topic": "inflammation-stroke-prevention",
    "diseaseArea": [
      "secondary-prevention",
      "inflammation-stroke-prevention"
    ],
    "population": {
      "n": 8343,
      "ageRange": "≥40",
      "nihssRange": "minor-to-moderate ischemic stroke or TIA",
      "timeWindow": "randomized within 24 h of onset; treated 90 days",
      "keyInclusion": [
        "High-risk non-cardioembolic minor-to-moderate ischemic stroke or TIA",
        "hs-CRP ≥2 mg/L"
      ],
      "keyExclusion": [
        "Cardioembolic source"
      ]
    },
    "intervention": "Colchicine 0.5 mg twice daily days 1-3, then 0.5 mg daily to day 90",
    "comparator": "Placebo",
    "primaryEndpoint": {
      "definition": "Any new stroke within 90 days",
      "timepoint": "90 d",
      "result": "Neutral: 6.3% vs 6.5%",
      "effectSize": "HR 0.98",
      "confidenceInterval": "95% CI 0.83 to 1.16",
      "pValue": "p=0.79"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Serious adverse events 2.2% vs 2.1% (p=0.83)"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "No significant reduction in the primary endpoint with the tested short-term colchicine regimen. The confidence interval includes potentially important benefit and harm; follow-up hsCRP was unavailable to confirm biological response.",
    "limitations": "244 Chinese hospitals; 90-day treatment may be too short for an atherosclerosis-modifying effect; minor-to-moderate severity only.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-chance3-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not support routine use of this tested regimen. Longer duration or alternative atherosclerotic selection remain unproven hypotheses, not the only possible settings for benefit.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Acute antithrombotic adjuncts -------------------
  t({
    id: 'rescue-bt2',
    shortName: 'RESCUE BT2',
    fullName: 'Tirofiban for Stroke without Large or Medium-Sized Vessel Occlusion',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 1177,
      ageRange: 'adults',
      nihssRange: '≥5 with at least one moderately-to-severely weak limb',
      timeWindow: 'four entry routes: ≤24 h and ineligible for reperfusion; progression at 24-96 h; early deterioration after thrombolysis; or no improvement 4-24 h after thrombolysis',
      keyInclusion: ['Ischemic stroke WITHOUT large- or medium-vessel occlusion', 'Mostly small infarcts presumed atherosclerotic'],
      keyExclusion: ['Complete occlusion of a large or medium-sized vessel']
    },
    intervention: 'IV tirofiban for 2 days (plus oral placebo), then aspirin to day 90',
    comparator: 'Oral aspirin 100 mg daily for 2 days (plus IV placebo), then aspirin to day 90',
    primaryEndpoint: {
      definition: 'Excellent outcome (mRS 0-1) at 90 days',
      timepoint: '90 d',
      result: 'Favors tirofiban: 29.1% vs 22.2%',
      effectSize: 'adjusted RR 1.26',
      confidenceInterval: '95% CI 1.04 to 1.53',
      pValue: 'p=0.02'
    },
    secondaryEndpoints: [
      { name: 'Secondary endpoints (functional independence, quality of life)', result: 'Generally NOT consistent with the primary result' }
    ],
    safetyFindings: {
      sich: '1.0% (tirofiban) vs 0% (aspirin)',
      mortality: 'Similar between groups',
      other: ''
    },
    imagingCriteria: 'Vessel imaging required to exclude large/medium-vessel occlusion',
    applicabilityNotes: 'Targets a genuinely unmet niche — progressive or deteriorating non-occlusive stroke, where no reperfusion option exists. Read the result cautiously: secondary endpoints did not corroborate the primary, the population was assembled from four heterogeneous clinical routes, and it was conducted entirely in China where intracranial atherosclerosis predominates.',
    limitations: 'Four disparate enrolment pathways pooled into one trial; inconsistent secondary endpoints; single-country; small excess of symptomatic hemorrhage.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-rescue-bt2-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'IV tirofiban improved 90-day excellent outcome in non-occlusive, often progressive stroke, with inconsistent secondary endpoints.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- LAAO after ablation -------------------
  t({
    "id": "option-laao",
    "shortName": "OPTION",
    "fullName": "Left Atrial Appendage Closure after Ablation for Atrial Fibrillation",
    "topic": "laa-occlusion",
    "diseaseArea": [
      "secondary-prevention",
      "laa-occlusion"
    ],
    "population": {
      "n": 1600,
      "ageRange": "mean 69.6 ± 7.7; 34.1% women",
      "nihssRange": "CHA₂DS₂-VASc ≥2 in men, ≥3 in women (mean 3.5 ± 1.3)",
      "timeWindow": "36 months",
      "keyInclusion": [
        "Atrial fibrillation undergoing catheter ablation",
        "Elevated CHA₂DS₂-VASc"
      ],
      "keyExclusion": []
    },
    "intervention": "WATCHMAN FLX LAA closure with OAC plus aspirin for 90 days, then aspirin through 12 months; not immediate withdrawal of all antithrombotic therapy",
    "comparator": "Oral anticoagulation",
    "primaryEndpoint": {
      "definition": "Safety: non-procedure-related major or clinically relevant non-major bleeding (superiority). Efficacy: death, stroke, or systemic embolism at 36 months (non-inferiority)",
      "timepoint": "36 months",
      "result": "Safety superior — 8.5% vs 18.1%; efficacy non-inferior — 5.3% vs 5.8%",
      "effectSize": "Bleeding roughly halved; efficacy composite similar",
      "confidenceInterval": "",
      "pValue": "p<0.001 for safety superiority; p<0.001 for efficacy non-inferiority"
    },
    "secondaryEndpoints": [
      {
        "name": "Major bleeding including procedure-related, to 36 mo",
        "result": "3.9% vs 5.0% (p<0.001 for non-inferiority)"
      },
      {
        "name": "Device- or procedure-related complications",
        "result": "23 patients"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Device/procedure complications occurred in 22 closure-assigned patients and one control crossover (23 total); these are not all 23/803 in the assigned closure arm."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "After AF ablation, the strategy reduced nonprocedural bleeding and met noninferiority for its efficacy composite using a five-percentage-point margin. The composite was predominantly deaths and does not establish stroke-specific equivalence. Protocol-required initial OAC plus aspirin remains part of the tested strategy.",
    "limitations": "Industry-funded; open-label by necessity; restricted to patients undergoing ablation; 36-month horizon leaves longer-term device outcomes unresolved.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-option-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "A selected post-ablation LAA-closure strategy with required initial antithrombotic therapy. Do not infer immediate OAC-free care or stroke-specific equivalence from the composite result.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- AF screening -------------------
  t({
    id: 'loop-study',
    shortName: 'LOOP',
    fullName: 'Implantable Loop Recorder Detection of Atrial Fibrillation to Prevent Stroke',
    topic: 'subclinical-af',
    diseaseArea: ['secondary-prevention', 'subclinical-af'],
    population: {
      n: 6004,
      ageRange: '70-90 (mean 74.7); 47.3% women',
      nihssRange: 'no known AF, ≥1 stroke risk factor (90.7% hypertensive)',
      timeWindow: 'median follow-up 64.5 months',
      keyInclusion: ['Age 70-90 without known AF', 'At least one of hypertension, diabetes, previous stroke, or heart failure'],
      keyExclusion: ['Known atrial fibrillation']
    },
    intervention: 'Implantable loop recorder monitoring, with anticoagulation recommended for AF episodes ≥6 minutes (n=1501)',
    comparator: 'Usual care (n=4503)',
    primaryEndpoint: {
      definition: 'Time to first stroke or systemic arterial embolism',
      timepoint: 'median 64.5 months',
      result: 'Neutral: 4.5% vs 5.6%',
      effectSize: 'HR 0.80',
      confidenceInterval: '95% CI 0.61 to 1.05',
      pValue: 'p=0.11'
    },
    secondaryEndpoints: [
      { name: 'AF detected', result: '31.8% vs 12.2% (HR 3.17, 95% CI 2.81-3.59, p<0.0001)' },
      { name: 'Anticoagulation started', result: '29.7% vs 13.1% (HR 2.72, 95% CI 2.41-3.08, p<0.0001)' },
      { name: 'Major bleeding', result: '4.3% vs 3.5% (HR 1.26, 95% CI 0.95-1.69, p=0.11)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Major bleeding numerically higher with screening' },
    imagingCriteria: '',
    applicabilityNotes: 'The cleanest demonstration that detecting more AF is not the same as preventing more stroke: tripling detection and doubling anticoagulation produced no significant stroke reduction. The authors\' own conclusion is the teaching point — not all AF is worth screening for, and not all screen-detected AF merits anticoagulation.',
    limitations: '1:3 randomization; Danish population aged 70-90; underpowered for a modest true effect (CI includes a 39% reduction); primary prevention, not post-stroke ESUS monitoring.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-loop-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Loop-recorder AF screening tripled detection but did not significantly reduce stroke — detection alone is not a surrogate for benefit.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 34688368 (https://doi.org/10.1016/S0140-6736(21)02090-0).",
  }),

  // ------------------- Factor XI inhibition in AF -------------------
  t({
    "id": "oceanic-af",
    "shortName": "OCEANIC-AF",
    "fullName": "Asundexian versus Apixaban in Patients with Atrial Fibrillation",
    "topic": "factor-xi-inhibition",
    "diseaseArea": [
      "secondary-prevention",
      "factor-xi-inhibition"
    ],
    "population": {
      "n": 14810,
      "ageRange": "mean 73.9 ± 7.7; 35.2% women",
      "nihssRange": "mean CHA₂DS₂-VASc 4.3 ± 1.3; 18.2% prior stroke or TIA",
      "timeWindow": "stopped prematurely on DMC recommendation",
      "keyInclusion": [
        "High-risk atrial fibrillation"
      ],
      "keyExclusion": []
    },
    "intervention": "Asundexian 50 mg once daily",
    "comparator": "Standard-dose apixaban",
    "primaryEndpoint": {
      "definition": "Stroke or systemic embolism (non-inferiority)",
      "timepoint": "until premature termination",
      "result": "Asundexian markedly WORSE: 1.3% (98 patients) vs 0.4% (26 patients)",
      "effectSize": "HR 3.79",
      "confidenceInterval": "95% CI 2.46 to 5.83",
      "pValue": "Non-inferiority not met; trial stopped"
    },
    "secondaryEndpoints": [
      {
        "name": "Primary safety endpoint: ISTH major bleeding",
        "result": "17/7373 versus 53/7364; HR 0.32 (95% CI 0.18–0.55), safety population distinct from efficacy ITT"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Overall adverse-event incidence similar"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The essential counterweight to OCEANIC-STROKE. Asundexian is effective as an ADD-ON to antiplatelet therapy in non-cardioembolic stroke, but it is a poor SUBSTITUTE for a DOAC in atrial fibrillation — nearly four-fold more thromboembolism than apixaban. Factor XIa inhibition does not replace guideline anticoagulation for AF, however favourable its bleeding profile.",
    "limitations": "Stopped early, so absolute event rates are low and follow-up short; tested a single asundexian dose. Major bleeding is the primary safety endpoint; its denominators must not be interchanged with the efficacy intention-to-treat population.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-oceanic-af-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Asundexian is inferior to apixaban for AF stroke prevention (HR 3.79) despite less bleeding — do not substitute it for a DOAC.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Carotid & intracranial revascularization -------------------
  t({
    id: 'crest-2',
    shortName: 'CREST-2',
    fullName: 'Medical Management and Revascularization for Asymptomatic Carotid Stenosis',
    topic: 'carotid-revasc',
    diseaseArea: ['secondary-prevention', 'carotid-revasc'],
    population: {
      n: 2485,
      ageRange: 'adults',
      nihssRange: 'ASYMPTOMATIC high-grade (>=70%) carotid stenosis',
      timeWindow: 'follow-up to 4 years',
      keyInclusion: ['Asymptomatic carotid stenosis >=70%'],
      keyExclusion: ['Symptomatic stenosis']
    },
    intervention: 'Intensive medical management PLUS revascularization — two parallel trials: carotid stenting (n=1245) and carotid endarterectomy (n=1240)',
    comparator: 'Intensive medical management alone',
    primaryEndpoint: {
      definition: 'Any stroke or death within 44 days, or ipsilateral ischemic stroke thereafter, to 4 years',
      timepoint: '4 years',
      result: 'Stenting trial POSITIVE: 2.8% vs 6.0% medical alone. Endarterectomy trial NEUTRAL: 3.7% vs 5.3%',
      effectSize: 'Stenting absolute difference ~3.2%; endarterectomy ~1.6%',
      confidenceInterval: 'Stenting 2.8% (95% CI 1.5-4.3) vs 6.0% (95% CI 3.8-8.3); CEA 3.7% (95% CI 2.1-5.5) vs 5.3% (95% CI 3.3-7.4)',
      pValue: 'Stenting p=0.02; endarterectomy p=0.24'
    },
    secondaryEndpoints: [
      { name: 'Periprocedural (day 0-44) events, stenting trial', result: 'No strokes or deaths in the medical-therapy group vs seven strokes and one death in the stenting group (endarterectomy trial: three vs nine strokes)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'High-grade (>=70%) asymptomatic stenosis',
    applicabilityNotes: 'Two parallel trials across 155 centres in five countries, and they did not agree: adding stenting to intensive medical therapy reduced events, adding endarterectomy did not reach significance. Note how low the medical-only event rate was (5-6% over 4 years) — modern medical therapy has narrowed the margin that the 1990s trials were built on, which is the central message regardless of which arm you emphasise.',
    limitations: 'Two separate trials, not a three-way randomization, so stenting and endarterectomy were never compared with each other here; event rates lower than anticipated; asymptomatic disease only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-crest2-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In asymptomatic >=70% stenosis on intensive medical therapy, adding stenting reduced 4-year events; adding endarterectomy did not reach significance.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Print citation N Engl J Med 2026;394(3):219-231 (PMID 41269206); published online 2025-11-21. Year follows the repo convention of citing the print issue. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'ecst-2',
    shortName: 'ECST-2',
    fullName: 'Optimised Medical Therapy Alone versus Optimised Medical Therapy plus Revascularisation for Carotid Stenosis — 2-year interim results',
    topic: 'carotid-revasc',
    diseaseArea: ['secondary-prevention', 'carotid-revasc'],
    population: {
      n: 429,
      ageRange: '>=18',
      nihssRange: 'asymptomatic or symptomatic carotid stenosis >=50% with LOW-to-INTERMEDIATE predicted risk (5-year ipsilateral stroke risk <20% by Carotid Artery Risk score)',
      timeWindow: '2-year interim analysis',
      keyInclusion: ['Carotid stenosis >=50%', 'CAR score predicted 5-year ipsilateral stroke risk <20%'],
      keyExclusion: ['High predicted stroke risk']
    },
    intervention: 'Optimised medical therapy plus revascularization (endarterectomy or stenting)',
    comparator: 'Optimised medical therapy alone',
    primaryEndpoint: {
      definition: 'Hierarchical composite by win ratio: periprocedural death/fatal stroke/fatal MI, then non-fatal stroke, then non-fatal MI, then new silent cerebral infarction',
      timepoint: '2 years',
      result: 'No benefit from added revascularization in this low-to-intermediate-risk group',
      effectSize: 'Win ratio 1.01',
      confidenceInterval: '95% CI 0.60 to 1.70',
      pValue: 'p=0.97 (2-year interim analysis)'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'Carotid stenosis >=50%; silent infarction assessed on imaging',
    applicabilityNotes: 'Risk-stratified rather than stenosis-stratified — the CAR score selects patients whose predicted 5-year stroke risk is under 20%, and in that group modern medical therapy alone held up. Complements CREST-2 by asking the question in symptomatic as well as asymptomatic disease. Interim at 2 years; final results pending.',
    limitations: 'Interim analysis with modest numbers; hierarchical win-ratio endpoint is harder to interpret than a simple composite; includes silent infarction, which has uncertain patient importance.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-ecst2-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'For carotid stenosis with a low-to-intermediate predicted stroke risk, adding revascularization to optimised medical therapy showed no 2-year benefit.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 41579907 (https://doi.org/10.1016/S1474-4422(25)00447-8).",
  }),
  t({
    id: 'cassiss',
    shortName: 'CASSISS',
    fullName: 'Stenting Plus Medical Therapy vs Medical Therapy Alone for Symptomatic Severe Intracranial Atherosclerotic Stenosis',
    topic: 'icas-prevention',
    diseaseArea: ['secondary-prevention', 'icas-prevention'],
    population: {
      n: 358,
      ageRange: 'mean 56.3; 73.5% male',
      nihssRange: 'TIA or non-disabling, non-perforator-territory stroke',
      timeWindow: 'enrolled beyond 3 weeks from the latest ischemic event; followed 3 years',
      keyInclusion: ['Symptomatic severe intracranial stenosis 70-99%', 'Non-perforator territory'],
      keyExclusion: ['Brainstem or basal-ganglia end-artery (perforator) territory events', 'Within 3 weeks of symptom onset']
    },
    intervention: 'Intracranial stenting plus medical therapy (DAPT 90 days, then single antiplatelet, plus risk-factor control)',
    comparator: 'Medical therapy alone',
    primaryEndpoint: {
      definition: 'Stroke or death within 30 days, or stroke in the qualifying artery territory from 30 days to 1 year',
      timepoint: '1 year',
      result: 'No significant difference: 8.0% vs 7.2%',
      effectSize: 'HR 1.10',
      confidenceInterval: '95% CI 0.52 to 2.35',
      pValue: 'P=0.82'
    },
    secondaryEndpoints: [
      { name: 'Stroke in qualifying territory at 2 and 3 years', result: 'No significant difference' },
      { name: 'Mortality at 3 years', result: '4.4% vs 1.3% (HR 3.75, 95% CI 0.77-18.13; P=0.08)' }
    ],
    safetyFindings: { sich: '', mortality: '3-year mortality 4.4% vs 1.3% (HR 3.75, 95% CI 0.77-18.13; P=0.08) — numerically higher with stenting, not significant', other: '' },
    imagingCriteria: 'Angiographic stenosis 70-99% of a major intracranial artery',
    applicabilityNotes: 'Designed to give stenting its best chance after SAMMPRIS — experienced operators, refined selection, and a deliberate 3-week cooling-off period excluding the hyperacute phase where SAMMPRIS saw most periprocedural harm. Even so, stenting added nothing. 8 Chinese centres.',
    limitations: 'Smaller than SAMMPRIS and underpowered for modest differences; excluded perforator-territory events, so results do not apply to that common phenotype; single-country.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-cassiss-2022'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Intracranial stenting added no benefit over medical therapy for symptomatic 70-99% stenosis, even with refined selection and experienced operators.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "cmoss",
    "shortName": "CMOSS",
    "fullName": "Extracranial-Intracranial Bypass and Risk of Stroke and Death in Patients With Symptomatic Artery Occlusion",
    "topic": "ec-ic-bypass",
    "diseaseArea": [
      "secondary-prevention",
      "icas-prevention",
      "ec-ic-bypass"
    ],
    "population": {
      "n": 324,
      "ageRange": "18–65 years",
      "nihssRange": "TIA or non-disabling ischemic stroke attributed to hemodynamic insufficiency",
      "timeWindow": "Qualifying event within 12 months; most recent stroke >3 weeks earlier and deficit stable >1 month",
      "keyInclusion": [
        "ICA or MCA occlusion",
        "Hemodynamic insufficiency on CT perfusion",
        "Pre-stroke mRS 0–2; stable unilateral ICA/MCA occlusion"
      ],
      "keyExclusion": [
        ">50% stenosis in another major vessel",
        "Infarction exceeding half the MCA territory"
      ]
    },
    "intervention": "EC-IC bypass surgery plus medical therapy",
    "comparator": "Medical therapy alone",
    "primaryEndpoint": {
      "definition": "Stroke or death within 30 days, or ipsilateral ischemic stroke from 30 days to 2 years",
      "timepoint": "2 years",
      "result": "Neutral: 8.6% (13/151) vs 12.3% (19/155)",
      "effectSize": "Incidence difference -3.6%",
      "confidenceInterval": "95% CI -10.1% to 2.9% (HR 0.71, 95% CI 0.33-1.54)",
      "pValue": "P=0.39"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "Shared CT perfusion thresholds MTT >4 seconds and relative CBF <0.95, independently confirmed by an imaging core laboratory.",
    "applicabilityNotes": "The modern re-test of the 1985 EC-IC Bypass Study, with perfusion-based selection and contemporary technique, and it reached the same conclusion: the excess 30-day stroke or death with bypass (6.2% vs 1.8%) partly offset its lower rate of ipsilateral ischemic stroke from 30 days to 2 years (2.0% vs 10.3%), leaving no significant net benefit. 13 Chinese centres, notably young patients (median 52.7 years).",
    "limitations": "Neutral superiority result with wide intervals. Hemodynamic selection may not identify an optimal responder population, but the trial did use common CTP thresholds and core-laboratory confirmation. Hazards were nonproportional; component/subgroup analyses and post hoc RR remain exploratory.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-cmoss-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "EC-IC bypass for symptomatic ICA/MCA occlusion with hemodynamic insufficiency showed no benefit over medical therapy at 2 years.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Blood-pressure targets -------------------
  t({
    id: 'esprit-bp',
    shortName: 'ESPRIT (BP)',
    fullName: 'Lowering Systolic Blood Pressure to <120 mm Hg versus <140 mm Hg in Patients at High Cardiovascular Risk',
    topic: 'bp-targets-prevention',
    diseaseArea: ['secondary-prevention', 'bp-targets-prevention'],
    population: {
      n: 11255,
      ageRange: 'mean 64.6 ± 7.1',
      nihssRange: 'high cardiovascular risk; 4359 with diabetes and 3022 with previous stroke',
      timeWindow: 'median 3.4 years',
      keyInclusion: ['High cardiovascular risk', 'Enrolled from 116 hospitals or communities in China'],
      keyExclusion: []
    },
    intervention: 'Intensive treatment targeting office SBP <120 mm Hg (achieved mean 119.1)',
    comparator: 'Standard treatment targeting SBP <140 mm Hg (achieved mean 134.8)',
    primaryEndpoint: {
      definition: 'Composite of MI, revascularization, hospitalisation for heart failure, stroke, or cardiovascular death',
      timepoint: 'median 3.4 y',
      result: 'Favors intensive: 9.7% vs 11.1%',
      effectSize: 'HR 0.88',
      confidenceInterval: '95% CI 0.78 to 0.99',
      pValue: 'p=0.028'
    },
    secondaryEndpoints: [
      { name: 'Heterogeneity by diabetes or prior stroke', result: 'None — the effect was consistent across both subgroups' }
    ],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Directly answers the two populations SPRINT excluded: diabetes and prior stroke. The absence of heterogeneity is the point — an SBP <120 target held its benefit in stroke survivors, who had been the main group where intensive lowering was questioned.',
    limitations: 'Open-label with blinded outcomes; conducted entirely in China; office rather than ambulatory BP; achieved separation (119 vs 135) is narrower than the nominal targets; serious syncope more frequent with intensive treatment (0.4% vs 0.1%; HR 3.00, 95% CI 1.35-6.68).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-esprit-bp-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'An SBP target <120 reduced major vascular events versus <140, with consistent benefit in patients with diabetes and prior stroke.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'bproad',
    shortName: 'BPROAD',
    fullName: 'Intensive Blood-Pressure Control in Patients with Type 2 Diabetes',
    topic: 'bp-targets-prevention',
    diseaseArea: ['secondary-prevention', 'bp-targets-prevention'],
    population: {
      n: 12821,
      ageRange: '>=50 (mean 63.8 ± 7.5); 45.3% women',
      nihssRange: 'type 2 diabetes with elevated SBP and increased cardiovascular risk',
      timeWindow: 'median 4.2 years',
      keyInclusion: ['Age >=50', 'Type 2 diabetes', 'Elevated systolic BP', 'Increased cardiovascular risk'],
      keyExclusion: []
    },
    intervention: 'Intensive treatment targeting SBP <120 mm Hg (achieved 121.6 at 1 year)',
    comparator: 'Standard treatment targeting SBP <140 mm Hg (achieved 133.2 at 1 year)',
    primaryEndpoint: {
      definition: 'Composite of non-fatal stroke, non-fatal MI, treatment or hospitalization for heart failure, or cardiovascular death',
      timepoint: 'median 4.2 y',
      result: 'Favors intensive: 1.65 vs 2.09 events per 100 person-years',
      effectSize: 'HR 0.79',
      confidenceInterval: '95% CI 0.69 to 0.90',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [],
    safetyFindings: {
      sich: '',
      mortality: '',
      other: 'Serious adverse events similar overall, but symptomatic hypotension and hyperkalemia more frequent with intensive treatment'
    },
    imagingCriteria: '',
    applicabilityNotes: 'Settles the question ACCORD-BP left open. With ESPRIT it forms a consistent pair supporting an SBP <120 target in diabetes, including for stroke prevention. Balance against the measurable excess of symptomatic hypotension and hyperkalemia, which is what limits the target in frail patients.',
    limitations: '145 Chinese sites; open-label; multiple imputation used for missing outcomes; achieved SBP separation narrower than the targets.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-bproad-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In type 2 diabetes, an SBP target <120 cut major cardiovascular events by 21% versus <140, at the cost of more hypotension and hyperkalemia.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'clear-synergy-colchicine',
    shortName: 'CLEAR SYNERGY (colchicine)',
    fullName: 'Colchicine in Acute Myocardial Infarction (CLEAR SYNERGY / OASIS-9)',
    topic: 'inflammation-stroke-prevention',
    diseaseArea: ['secondary-prevention', 'inflammation-stroke-prevention'],
    population: {
      n: 7062,
      ageRange: 'adults',
      nihssRange: 'acute myocardial infarction',
      timeWindow: 'median follow-up 3 years',
      keyInclusion: ['Myocardial infarction', '104 centres in 14 countries'],
      keyExclusion: []
    },
    intervention: 'Colchicine (2×2 factorial with spironolactone)',
    comparator: 'Placebo',
    primaryEndpoint: {
      definition: 'Composite of cardiovascular death, recurrent MI, stroke, or unplanned ischemia-driven revascularization',
      timepoint: 'median 3 y',
      result: 'Neutral: 9.1% vs 9.3%',
      effectSize: 'HR 0.99',
      confidenceInterval: '95% CI 0.85 to 1.16',
      pValue: 'p=0.93'
    },
    secondaryEndpoints: [
      { name: 'C-reactive protein at 3 months', result: 'Lower with colchicine (adjusted mean difference -1.28 mg/L, 95% CI -1.81 to -0.75)' },
      { name: 'Diarrhea', result: 'More frequent: 10.2% vs 6.6% (p<0.001)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'No increase in serious infections; more diarrhea' },
    imagingCriteria: '',
    applicabilityNotes: 'Included here because it is the largest colchicine trial after myocardial infarction, and stroke was a component of its primary endpoint. It lowered CRP without reducing events, in contrast with the earlier positive coronary trials COLCOT (recent MI; HR 0.77, 95% CI 0.61-0.96) and LoDoCo2 (chronic coronary disease; HR 0.69, 95% CI 0.57-0.83). The stroke trials CONVINCE (HR 0.84, 95% CI 0.68-1.05; CRP lowered) and CHANCE-3 (HR 0.98, 95% CI 0.83-1.16; follow-up CRP not measured) also missed their primary endpoints, so colchicine is not established for stroke prevention and the coronary evidence is now mixed.',
    limitations: 'Cardiac rather than stroke population; factorial design with spironolactone; stroke was only one component of the composite.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-clear-synergy-colchicine-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Colchicine after MI did not reduce cardiovascular events despite lowering CRP — consistent with the neutral stroke trials.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Malignant edema & neurocritical care -------------------
  t({
    id: 'charm',
    shortName: 'CHARM',
    fullName: 'Intravenous Glibenclamide for Cerebral Oedema after Large Hemispheric Stroke',
    topic: 'malignant-edema',
    diseaseArea: ['acute-ischemic-stroke', 'malignant-edema'],
    population: {
      n: 535,
      ageRange: '18-85 (primary analysis restricted to 18-70)',
      nihssRange: 'large hemispheric infarction',
      timeWindow: 'study drug started within 10 h of onset',
      keyInclusion: ['ASPECTS 1-5, OR ischemic core 80-300 mL on CT perfusion or DWI'],
      keyExclusion: []
    },
    intervention: 'Intravenous glibenclamide 8.6 mg over 72 h',
    comparator: 'Placebo',
    primaryEndpoint: {
      definition: 'mRS shift at day 90 (modified ITT, ages 18-70)',
      timepoint: '90 d',
      result: 'Neutral: no favourable mRS shift with glibenclamide (common OR 1.17, 95% CI 0.80-1.71; p=0.42); trial stopped early by the sponsor for slow COVID-era enrolment',
      effectSize: 'Common OR 1.17 (underpowered by early termination)',
      confidenceInterval: '95% CI 0.80 to 1.71',
      pValue: 'p=0.42'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'ASPECTS 1-5 or core volume 80-300 mL — an explicitly imaging-defined large-infarct population',
    applicabilityNotes: '143 stroke centres in 21 countries — the definitive attempt at pharmacologic prevention of malignant edema, following the GAMES-RP signal in patients under 70. Terminated early by the sponsor for operational reasons (COVID-related slow enrolment) before unblinding, so the result reflects an underpowered trial rather than a demonstrated absence of effect. Decompressive hemicraniectomy remains the intervention with proven mortality benefit.',
    limitations: 'Stopped early for non-scientific reasons; primary analysis restricted to ages 18-70 while enrolment ran to 85.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-charm-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'IV glibenclamide did not improve 90-day function after large hemispheric infarction in patients aged 18-70 (common OR 1.17, 95% CI 0.80-1.71), though CHARM was halted early and underpowered; 90-day mortality did not differ significantly (32% vs 29%; HR 1.20, 95% CI 0.85-1.70) and hypoglycemia was more frequent with glibenclamide (6% vs 2%).',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 39706639 (https://doi.org/10.1016/S1474-4422(24)00495-2).",
  }),
  t({
    id: 'intrepid',
    shortName: 'INTREPID',
    fullName: 'Fever Prevention in Patients With Acute Vascular Brain Injury',
    topic: 'neurocritical-care',
    diseaseArea: ['neurocritical-care', 'acute-ischemic-stroke', 'ich', 'sah'],
    population: {
      n: 677,
      ageRange: 'median 62; 51% female',
      nihssRange: 'critically ill: 254 ischemic stroke, 223 ICH, 200 SAH',
      timeWindow: 'up to 14 days or ICU discharge',
      keyInclusion: ['Critically ill with acute vascular brain injury', '43 ICUs in 7 countries'],
      keyExclusion: []
    },
    intervention: 'Automated surface temperature management targeting 37.0 °C',
    comparator: 'Standard tiered fever treatment triggered at >=38 °C',
    primaryEndpoint: {
      definition: 'Daily mean fever burden (°C-hour above 37.9 °C)',
      timepoint: 'acute phase',
      result: 'Fever burden reduced: daily mean 0.37 vs 0.73 °C-hour',
      effectSize: 'Difference −0.35 °C-hour',
      confidenceInterval: '95% CI −0.51 to −0.20',
      pValue: 'P<.001'
    },
    secondaryEndpoints: [
      { name: '3-month mRS shift (principal secondary)', result: 'No difference (median mRS 4 vs 4; OR for favourable shift 1.09, 95% CI 0.81-1.46; P=.54) — enrolment stopped at a planned interim analysis for futility on this endpoint' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Major adverse events tracked included death, pneumonia, sepsis and malignant cerebral edema' },
    imagingCriteria: '',
    applicabilityNotes: 'Separates two questions that are often conflated: fever CAN be prevented with device-based normothermia, and preventing it did NOT translate into better function. Stopped early for futility on the functional endpoint after enrolling 686 of a planned 1176.',
    limitations: 'Open-label; stopped early for futility; mixed ischemic/ICH/SAH population dilutes any condition-specific effect.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-intrepid-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Device-based fever prevention reduced fever burden but did not improve 3-month function; halted for futility.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "setpoint2",
    "shortName": "SETPOINT2",
    "fullName": "Early vs Standard Approach to Tracheostomy in Severe Stroke Receiving Mechanical Ventilation",
    "topic": "neurocritical-care",
    "diseaseArea": [
      "neurocritical-care",
      "acute-ischemic-stroke",
      "ich"
    ],
    "population": {
      "n": 382,
      "ageRange": "median 59; 49.8% women",
      "nihssRange": "severe acute ischemic or hemorrhagic stroke requiring invasive ventilation",
      "timeWindow": "Randomized within 4 days of intubation; functional outcome at 6 months",
      "keyInclusion": [
        "Severe stroke requiring invasive ventilation; SETscore >10 and clinician expectation of prolonged ventilation",
        "26 US and German neurocritical care centres"
      ],
      "keyExclusion": [
        "Premorbid mRS >1",
        "More than 4 days of ventilation before enrollment"
      ]
    },
    "intervention": "Early tracheostomy within 5 days of intubation (performed in 95.2%, median day 4)",
    "comparator": "Ongoing weaning with standard tracheostomy from day 10 if needed (performed in 67%, median day 11)",
    "primaryEndpoint": {
      "definition": "mRS 0-4 (no to moderately severe disability) versus 5-6 at 6 months",
      "timepoint": "6 months",
      "result": "No significant benefit: mRS 0-4 in 43.5% vs 47.1% (difference −3.6%, 95% CI −14.3% to 7.2%); wide CI cannot exclude clinically relevant benefit or harm",
      "effectSize": "Adjusted OR 0.93",
      "confidenceInterval": "95% CI 0.60 to 1.42",
      "pValue": "P=0.73"
    },
    "secondaryEndpoints": [],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": ""
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Selected ventilated patients with severe stroke and low premorbid disability. In standard care, 43/194 (22%) were successfully extubated and 21/194 (10.8%) died before tracheostomy; these distinct outcomes must not be combined as successful avoidance. The primary mRS 0–4 endpoint includes moderately severe disability and is not functional independence.",
    "limitations": "Open-label; powered for a 15-percentage-point difference. The wide confidence interval leaves smaller benefit or harm unresolved. The patient-informed mRS 0–4 threshold differs from other trials' endpoint definitions.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-setpoint2-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "The early strategy did not demonstrate improved six-month outcome. It does not establish an individual recovery ceiling or prove that every patient can safely avoid tracheostomy.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-09-26",
    verificationNotes: "Primary main report and available main tables compared; no complete supplement/version-history clearance. Enrollment selection and competing outcomes corrected. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- Rehabilitation -------------------
  t({
    id: 'vns-rehab',
    shortName: 'VNS-REHAB',
    fullName: 'Vagus Nerve Stimulation Paired with Rehabilitation for Upper Limb Motor Function after Ischaemic Stroke',
    topic: 'rehabilitation',
    diseaseArea: ['rehabilitation'],
    population: {
      n: 108,
      ageRange: 'adults',
      nihssRange: 'moderate-to-severe arm weakness (baseline Fugl-Meyer Upper Extremity 20-50)',
      timeWindow: 'at least 9 months after ischemic stroke — the CHRONIC phase',
      keyInclusion: ['Moderate-to-severe arm weakness >=9 months post-stroke', '19 stroke rehabilitation services in the UK and USA'],
      keyExclusion: []
    },
    intervention: 'Implanted vagus nerve stimulation (0.8 mA, 100 μs, 30 Hz) paired with rehabilitation — 6 weeks in-clinic (18 sessions) then home exercise',
    comparator: 'Sham stimulation (0 mA) paired with identical rehabilitation; ALL participants were implanted',
    primaryEndpoint: {
      definition: 'Change in Fugl-Meyer Assessment-Upper Extremity the day after in-clinic therapy',
      timepoint: 'end of 6-week in-clinic therapy',
      result: 'Favors paired VNS: FMA-UE +5.0 vs +2.4 points',
      effectSize: 'Between-group difference 2.6 points',
      confidenceInterval: '95% CI 1.0 to 4.2',
      pValue: 'p=0.0014'
    },
    secondaryEndpoints: [
      { name: 'FMA-UE response rate at 90 days after in-clinic therapy', result: '47% vs 24% (difference 24%, 95% CI 6-41; p=0.0098)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Implant-related risks apply to both arms since all participants were implanted' },
    imagingCriteria: '',
    applicabilityNotes: 'Triple-blind and sham-controlled with every participant implanted, which controls for the implant procedure itself — an unusually rigorous design for a device trial. The population is deliberately chronic (>=9 months), where spontaneous recovery has plateaued, so the gain is attributable to the pairing rather than natural history. FDA-approved (Vivistim Paired VNS System, 2021) on this basis.',
    limitations: 'Small (n=108); requires surgical implantation and intensive paired therapy, limiting scalability; impairment (Fugl-Meyer) rather than a patient-centred activity endpoint.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-vns-rehab-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Paired vagus nerve stimulation improved chronic post-stroke upper-limb impairment versus sham in a rigorous implanted-control design.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  // ------------------- CVT endovascular therapy -------------------
  t({
    id: 'to-act',
    shortName: 'TO-ACT',
    fullName: 'Endovascular Treatment With Medical Management vs Standard Care in Severe Cerebral Venous Thrombosis',
    topic: 'cvt',
    diseaseArea: ['cvt'],
    population: {
      n: 67,
      ageRange: 'adults',
      nihssRange: 'severe CVT with >=1 risk factor for poor outcome',
      timeWindow: 'EVT within 24 h of randomization; 12-month outcome',
      keyInclusion: ['Radiologically confirmed CVT', 'At least one of: mental status disorder, coma, intracerebral hemorrhage, or deep venous system thrombosis'],
      keyExclusion: []
    },
    intervention: 'Endovascular treatment (mechanical thrombectomy, intrasinus alteplase or urokinase, or both) plus standard care',
    comparator: 'Guideline-based standard medical care alone',
    primaryEndpoint: {
      definition: 'mRS 0-1 at 12 months',
      timepoint: '12 months',
      result: 'No benefit: mRS 0-1 at 12 months 67% vs 68%; halted after the first interim analysis for futility',
      effectSize: 'RR 0.99',
      confidenceInterval: '95% CI 0.71 to 1.38',
      pValue: 'Futility'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'Radiologically confirmed CVT',
    applicabilityNotes: 'The only randomized trial comparing endovascular therapy with standard medical care in CVT, and it stopped early for futility. It is small (67 patients), so it does not exclude benefit in the most severe presentations — but it removes any basis for routine EVT in CVT, which is how the 2024 AHA CVT statement treats it. Anticoagulation remains first-line.',
    limitations: 'Very small; halted at first interim analysis; heterogeneous endovascular techniques pooled; 8 hospitals across 3 countries.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-to-act-2020'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Endovascular therapy for severe CVT showed no benefit and was halted for futility — anticoagulation remains first-line.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Early-window EVT — the 2015 landmark trials + HERMES -------------------
  // All results verified live against PubMed abstracts on 2026-08-22.
  t({
    id: 'mr-clean',
    shortName: 'MR CLEAN',
    fullName: 'A Randomized Trial of Intraarterial Treatment for Acute Ischemic Stroke',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 500,
      ageRange: 'mean 65 (range 23-96)',
      nihssRange: '≥2, no upper severity limit (proximal occlusion)',
      timeWindow: '≤6 h',
      keyInclusion: ['Proximal anterior-circulation occlusion confirmed on vessel imaging', '89% pre-treated with IV alteplase'],
      keyExclusion: []
    },
    intervention: 'Intraarterial treatment (81.5% retrievable stents) + usual care',
    comparator: 'Usual care alone (including IV alteplase when eligible)',
    primaryEndpoint: {
      definition: 'mRS shift (ordinal) at 90 d',
      timepoint: '90 d',
      result: 'Favored EVT; mRS 0-2: 32.6% vs 19.1% (absolute difference 13.5 pp, 95% CI 5.9-21.2)',
      effectSize: 'Adjusted common OR 1.67',
      confidenceInterval: '95% CI 1.21 to 2.30',
      pValue: ''
    },
    secondaryEndpoints: [{ name: 'Functional independence (mRS 0-2)', result: '32.6% vs 19.1%' }],
    safetyFindings: { sich: 'No significant difference', mortality: 'No significant difference', other: '' },
    imagingCriteria: 'Vessel imaging confirming proximal anterior-circulation occlusion; no core-size selection',
    applicabilityNotes: 'First positive EVT trial of the modern stent-retriever era (16 Dutch centres); its result triggered interim analyses that stopped the sibling 2015 trials early.',
    limitations: 'Open-label; usual-care comparator; single country.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-mr-clean-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Established EVT within 6 h for proximal anterior-circulation LVO as effective and safe on top of IV thrombolysis.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'escape',
    shortName: 'ESCAPE',
    fullName: 'Randomized Assessment of Rapid Endovascular Treatment of Ischemic Stroke',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 316,
      ageRange: 'adults',
      nihssRange: 'disabling deficit (proximal occlusion)',
      timeWindow: '≤12 h',
      keyInclusion: ['Proximal anterior-circulation occlusion', 'Small infarct core', 'Moderate-to-good collateral circulation on CT/CTA'],
      keyExclusion: ['Large infarct core', 'Poor collaterals']
    },
    intervention: 'Rapid endovascular treatment (available thrombectomy devices) + standard care',
    comparator: 'Standard care alone',
    primaryEndpoint: {
      definition: 'mRS shift (ordinal) at 90 d',
      timepoint: '90 d',
      result: 'Favored EVT; mRS 0-2: 53.0% vs 29.3% (p<0.001). Stopped early for efficacy',
      effectSize: 'Common OR 2.6',
      confidenceInterval: '95% CI 1.7 to 3.8',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [{ name: '90-day mortality', result: '10.4% vs 19.0% (p=0.04) — reduced with EVT' }],
    safetyFindings: { sich: '3.6% vs 2.7% (p=0.75)', mortality: 'Reduced: 10.4% vs 19.0% (p=0.04)', other: 'Median CT-to-first-reperfusion 84 min' },
    imagingCriteria: 'CT/CTA: small core, moderate-to-good collaterals',
    applicabilityNotes: 'Extended enrolment to 12 h using collateral-based imaging selection; the only one of the five 2015 trials to show a statistically significant mortality reduction (HERMES found no pooled 90-day mortality difference).',
    limitations: 'Stopped early (n=316); open-label.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Confirmed EVT benefit with imaging-selected small core and good collaterals up to 12 h, with reduced mortality.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'extend-ia',
    shortName: 'EXTEND-IA',
    fullName: 'Endovascular Therapy for Ischemic Stroke with Perfusion-Imaging Selection',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 70,
      ageRange: 'adults',
      nihssRange: 'all eligible',
      timeWindow: 'Alteplase <4.5 h; EVT started at median 210 min',
      keyInclusion: ['ICA or MCA occlusion', 'CT-perfusion: salvageable tissue and ischaemic core <70 mL', 'All received IV alteplase 0.9 mg/kg'],
      keyExclusion: []
    },
    intervention: 'Endovascular thrombectomy with Solitaire FR stent retriever + IV alteplase',
    comparator: 'IV alteplase alone',
    primaryEndpoint: {
      definition: 'Coprimary: reperfusion at 24 h and early neurologic improvement (NIHSS reduction ≥8 or NIHSS 0-1 at day 3)',
      timepoint: '24 h / day 3',
      result: 'Both favored EVT: reperfusion median 100% vs 37% (p<0.001); early improvement 80% vs 37% (p=0.002). Stopped early for efficacy',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'p<0.001 / p=0.002'
    },
    secondaryEndpoints: [{ name: 'mRS 0-2 at 90 d', result: '71% vs 40% (p=0.01)' }],
    safetyFindings: { sich: 'No significant difference', mortality: 'No significant difference', other: '' },
    imagingCriteria: 'CT perfusion: mismatch with core <70 mL',
    applicabilityNotes: 'Smallest of the 2015 trials but with the strictest perfusion-imaging selection; foundation for later perfusion-selected paradigms (EXTEND, DEFUSE 3).',
    limitations: 'Very small (n=70); stopped early; coprimary endpoints were physiologic/early rather than 90-day disability.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-extend-ia-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Showed perfusion-selected patients gain large reperfusion and functional benefits from stent-retriever EVT added to alteplase.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'swift-prime',
    shortName: 'SWIFT PRIME',
    fullName: 'Stent-Retriever Thrombectomy after Intravenous t-PA vs. t-PA Alone in Stroke',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 196,
      ageRange: 'adults',
      nihssRange: 'moderate-severe',
      timeWindow: '≤6 h',
      keyInclusion: ['Proximal anterior-circulation occlusion', 'Receiving or had received IV t-PA', 'Absence of large ischaemic-core lesions'],
      keyExclusion: ['Large ischaemic core']
    },
    intervention: 'Stent-retriever thrombectomy + IV t-PA',
    comparator: 'IV t-PA alone',
    primaryEndpoint: {
      definition: 'mRS shift (ordinal) at 90 d',
      timepoint: '90 d',
      result: 'Favored EVT (p<0.001); mRS 0-2: 60% vs 35% (p<0.001). Stopped early for efficacy',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [{ name: 'Substantial reperfusion at end of procedure', result: '88%' }],
    safetyFindings: { sich: '0% vs 3% (p=0.12)', mortality: '9% vs 12% (p=0.50)', other: 'Median qualifying-imaging-to-groin-puncture 57 min' },
    imagingCriteria: 'Core-excluding imaging; proximal anterior occlusion',
    applicabilityNotes: 'With EXTEND-IA, one of the two 2015 trials in which every patient received IV t-PA, isolating the added value of stent-retriever EVT over IV t-PA alone.',
    limitations: 'Stopped early (n=196); industry-funded.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-swift-prime-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Confirmed stent-retriever EVT within 6 h on top of IV t-PA markedly increases functional independence.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'revascat',
    shortName: 'REVASCAT',
    fullName: 'Thrombectomy within 8 Hours after Symptom Onset in Ischemic Stroke',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 206,
      ageRange: 'adults',
      nihssRange: 'moderate-severe',
      timeWindow: '≤8 h',
      keyInclusion: ['Proximal anterior-circulation occlusion', 'Absence of large infarct on neuroimaging', 'Alteplase ineligible or failed to revascularize'],
      keyExclusion: ['Large established infarct']
    },
    intervention: 'Solitaire stent-retriever thrombectomy + medical therapy',
    comparator: 'Medical therapy alone (including IV alteplase when eligible)',
    primaryEndpoint: {
      definition: 'mRS shift (ordinal) at 90 d',
      timepoint: '90 d',
      result: 'Favored EVT; mRS 0-2: 43.7% vs 28.2% (adjusted OR 2.1, 95% CI 1.1-4.0)',
      effectSize: 'Adjusted OR 1.7 for 1-point mRS improvement',
      confidenceInterval: '95% CI 1.05 to 2.8',
      pValue: ''
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '1.9% in both groups (p=1.00)', mortality: '18.4% vs 15.5% (p=0.60)', other: '' },
    imagingCriteria: 'Neuroimaging excluding large infarct',
    applicabilityNotes: 'Population-based design embedded in the Catalan reperfusion registry (only 8 eligible patients treated outside the trial), supporting generalisability; enrolment halted early for loss of equipoise after the other 2015 trials reported.',
    limitations: 'Halted at 206 of planned 690; modest effect precision.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-revascat-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Extended the randomized EVT evidence to 8 h and to a registry-embedded, population-representative setting.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'hermes',
    shortName: 'HERMES',
    fullName: 'Endovascular Thrombectomy after Large-Vessel Ischaemic Stroke: Meta-analysis of Individual Patient Data from Five Randomised Trials',
    topic: 'evt-early-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-early-window'],
    population: {
      n: 1287,
      ageRange: 'all ages (incl. ≥80)',
      nihssRange: 'all enrolled',
      timeWindow: 'randomized ≤12 h',
      keyInclusion: ['Individual patient data from MR CLEAN, ESCAPE, REVASCAT, SWIFT PRIME, EXTEND-IA', 'Proximal anterior-circulation occlusion'],
      keyExclusion: []
    },
    intervention: 'Endovascular thrombectomy (634 patients)',
    comparator: 'Standard care (653 patients)',
    primaryEndpoint: {
      definition: 'mRS shift (ordinal) at 90 d, adjusted',
      timepoint: '90 d',
      result: 'Strongly favored EVT; NNT 2.6 to reduce disability by ≥1 mRS level',
      effectSize: 'Adjusted common OR 2.49',
      confidenceInterval: '95% CI 1.76 to 3.53',
      pValue: 'p<0.0001'
    },
    secondaryEndpoints: [
      { name: 'Age ≥80 subgroup', result: 'cOR 3.68 (95% CI 1.95-6.92)' },
      { name: 'Randomized >300 min after onset', result: 'cOR 1.76 (95% CI 1.05-2.97)' },
      { name: 'Alteplase-ineligible', result: 'cOR 2.43 (95% CI 1.30-4.55)' }
    ],
    safetyFindings: { sich: 'No difference vs control', mortality: 'No difference at 90 d', other: 'No difference in parenchymal haematoma' },
    imagingCriteria: 'Per component trials (vessel imaging ± core/collateral selection)',
    applicabilityNotes: 'The definitive pooled analysis behind the Class I guideline recommendation for early-window EVT: benefit consistent across age, severity, occlusion site, alteplase eligibility, and time strata, with no heterogeneity of effect (p-interaction=0.43).',
    limitations: 'Pooled trials used heterogeneous imaging selection and devices; late-window and large-core questions answered by later trials.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-hermes-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Cemented EVT as standard of care for proximal anterior-circulation LVO, irrespective of patient characteristics.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  // ------------------- Orphan-citation backfill 2026-08-22 -------------------
  // Trial records for citations that already existed in citations.js without a
  // completed-trial record. Results verified live against PubMed abstracts
  // (and the 2026-08-22 verification digest) on 2026-08-22.
  t({
    id: 'sammpris',
    shortName: 'SAMMPRIS',
    fullName: 'Stenting versus Aggressive Medical Therapy for Intracranial Arterial Stenosis',
    topic: 'icas-prevention',
    diseaseArea: ['icas-prevention', 'secondary-prevention'],
    population: {
      n: 451,
      ageRange: 'adults',
      nihssRange: 'recent TIA or stroke',
      timeWindow: 'recent qualifying event',
      keyInclusion: ['TIA or stroke attributed to 70-99% stenosis of a major intracranial artery'],
      keyExclusion: []
    },
    intervention: 'Aggressive medical management + percutaneous angioplasty and stenting (Wingspan)',
    comparator: 'Aggressive medical management alone',
    primaryEndpoint: {
      definition: 'Stroke or death within 30 d of enrolment or revascularization, or stroke in the qualifying-artery territory beyond 30 d',
      timepoint: '30 d / 1 y',
      result: 'HARM from stenting: 30-day stroke/death 14.7% vs 5.8% (P=0.002); 1-year primary endpoint 20.0% vs 12.2%. Enrolment stopped early',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'P=0.002 (30-day); P=0.009 (over time)'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '30-day fatal stroke 2.2% with PTAS', other: 'High periprocedural stroke rate drove the harm signal' },
    imagingCriteria: '70-99% intracranial stenosis',
    applicabilityNotes: 'Defined modern management of symptomatic intracranial atherosclerosis: aggressive medical therapy (DAPT + intensive risk-factor control) beat stenting, whose periprocedural risk was high while medical-arm risk was lower than expected.',
    limitations: 'Wingspan system only; stopped early, limiting long-term comparisons.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-sammpris-2011'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Aggressive medical management — not stenting — is first-line for symptomatic 70-99% intracranial stenosis.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'tesla',
    shortName: 'TESLA',
    fullName: 'Thrombectomy for Stroke With Large Infarct on Noncontrast CT',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: {
      n: 300,
      ageRange: 'median 67',
      nihssRange: 'moderate-severe',
      timeWindow: '≤24 h',
      keyInclusion: ['Anterior-circulation LVO', 'Large infarct on noncontrast CT alone (ASPECTS 2-5)'],
      keyExclusion: []
    },
    intervention: 'Thrombectomy + usual care (n=152)',
    comparator: 'Usual medical care alone (n=148)',
    primaryEndpoint: {
      definition: 'Mean 90-day utility-weighted mRS (Bayesian; superiority threshold posterior probability ≥.975)',
      timepoint: '90 d',
      result: 'DID NOT meet superiority: UW-mRS 2.93 vs 2.27, adjusted difference 0.63 (95% CrI −0.09 to 1.34); posterior probability .96',
      effectSize: 'Adjusted UW-mRS difference 0.63',
      confidenceInterval: '95% CrI −0.09 to 1.34',
      pValue: 'Posterior probability .96 (<.975 threshold)'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '24-h sICH 4.0% vs 1.3%', mortality: '90-day mortality 35.3% vs 33.3%', other: 'More parenchymal haematomas and SAH with EVT' },
    imagingCriteria: 'Noncontrast CT only, ASPECTS 2-5 — no CTP/MRI selection',
    applicabilityNotes: 'The outlier among the large-core trials: NCCT-only selection to ASPECTS 2-5 within 24 h did not demonstrate benefit, though the credible interval includes a clinically relevant effect. Read alongside SELECT2/ANGEL-ASPECT/TENSION/LASTE and the ATLAS IPD meta-analysis, which pooled TESLA and still found overall large-core benefit.',
    limitations: 'Bayesian design just missed its threshold; NCCT-only selection; wide credible interval.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-tesla-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Cautions that NCCT-only ASPECTS 2-5 selection up to 24 h is not clearly beneficial — context for the otherwise positive large-core class.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'fastest',
    shortName: 'FASTEST',
    fullName: 'Recombinant Factor VIIa versus Placebo for Spontaneous Intracerebral Haemorrhage within 2 h of Symptom Onset',
    topic: 'ich-hemostatic',
    diseaseArea: ['ich', 'ich-hemostatic'],
    population: {
      n: 626,
      ageRange: 'adults',
      nihssRange: 'spontaneous ICH',
      timeWindow: '≤2 h from onset (mean 100 min)',
      keyInclusion: ['Spontaneous ICH treated within 2 h of onset', '93 sites: USA, Japan, Canada, Spain, Germany, UK'],
      keyExclusion: []
    },
    intervention: 'rFVIIa 80 μg/kg IV (n=328)',
    comparator: 'Placebo (n=298)',
    primaryEndpoint: {
      definition: 'Ordinal functional outcome by mRS (0-2 / 3 / 4-6) at 180 d',
      timepoint: '180 d',
      result: 'NEGATIVE: adjusted common OR 1.09; trial met prespecified futility criteria at 2nd interim analysis',
      effectSize: 'Adjusted common OR 1.09',
      confidenceInterval: '95% CI 0.79 to 1.51',
      pValue: 'p=0.61'
    },
    secondaryEndpoints: [
      { name: 'ICH growth at 24 h', result: 'Reduced: −3.7 mL (95% CI −5.4 to −1.9); ICH+IVH −5.2 mL (−7.6 to −2.8)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Life-threatening thromboembolic events within 4 d: <5% (15) vs 1% (4); RR 3.41 (95% CI 1.14-10.15), p=0.020' },
    imagingCriteria: 'CT-confirmed spontaneous ICH',
    applicabilityNotes: 'Hyperacute (≤2 h) hemostatic therapy slowed haematoma growth but did not improve 180-day function and tripled life-threatening thrombotic events — the biology works, the clinical benefit does not follow.',
    limitations: 'Stopped for futility; ultra-early window limits enrolment generalisability.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-fastest-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'rFVIIa within 2 h of spontaneous ICH slowed haematoma growth but did not improve 180-day function and increased life-threatening thromboembolic events; use outside trials is not supported (testing in the highest-risk patients is ongoing).',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 42314714 (https://doi.org/10.1016/S0140-6736(26)01202-X).",
  }),
  t({
    id: 'decimal',
    shortName: 'DECIMAL',
    fullName: 'Early Decompressive Craniectomy in Malignant Middle Cerebral Artery Infarction',
    topic: 'malignant-edema',
    diseaseArea: ['acute-ischemic-stroke', 'malignant-edema'],
    population: {
      n: 38,
      ageRange: '18-55',
      nihssRange: 'malignant MCA infarction',
      timeWindow: 'early: ≤30 h from onset to surgery (needs confirmation)',
      keyInclusion: ['Malignant MCA infarction', 'France, multicenter'],
      keyExclusion: []
    },
    intervention: 'Early decompressive craniectomy + medical therapy',
    comparator: 'Medical therapy alone',
    primaryEndpoint: {
      definition: 'mRS ≤3 at 6 months',
      timepoint: '6 mo / 1 y',
      result: 'mRS ≤3: 25% vs 5.6% at 6 mo (P=0.18); 50% vs 22.2% at 1 y (P=0.10) — underpowered; mortality reduced by 52.8 pp (P<0.0001)',
      effectSize: 'Absolute mortality reduction 52.8 pp',
      confidenceInterval: '',
      pValue: 'P<0.0001 (mortality); P=0.18 (primary)'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'Reduced by 52.8 absolute percentage points with surgery', other: '' },
    imagingCriteria: 'Malignant MCA infarction criteria (clinical + imaging)',
    applicabilityNotes: 'Stopped after 38 patients for slow recruitment; its DSMB recommended pooling with DESTINY and HAMLET under a protocol planned while the trials were still recruiting, and that pooled analysis established hemicraniectomy within 48 h for patients aged 18-60.',
    limitations: 'Very small; stopped early; primary endpoint not significant on its own.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-decimal-2007'],
    relatedActiveTrialIds: [],
    practiceImpact: 'One of the three European trials whose pooled analysis made early hemicraniectomy standard for malignant MCA infarction in younger patients.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'destiny',
    shortName: 'DESTINY',
    fullName: 'Decompressive Surgery for the Treatment of Malignant Infarction of the Middle Cerebral Artery',
    topic: 'malignant-edema',
    diseaseArea: ['acute-ischemic-stroke', 'malignant-edema'],
    population: {
      n: 32,
      ageRange: 'adults (≤60 by design)',
      nihssRange: 'malignant MCA infarction',
      timeWindow: 'early hemicraniectomy',
      keyInclusion: ['Life-threatening (malignant) MCA infarction', 'Germany, multicenter, sequential design'],
      keyExclusion: []
    },
    intervention: 'Hemicraniectomy + medical therapy',
    comparator: 'Conservative therapy',
    primaryEndpoint: {
      definition: '30-day mortality (first endpoint); mRS 0-3 vs 4-6 at 6 months (primary)',
      timepoint: '30 d / 6-12 mo',
      result: '30-day survival 88% vs 47% (P=0.02); mRS 0-3 at 6-12 mo: 47% vs 27% (P=0.23) — primary endpoint not significant alone',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'P=0.02 (survival); P=0.23 (mRS 0-3)'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'Markedly reduced with surgery (88% vs 47% 30-day survival)', other: '' },
    imagingCriteria: 'Malignant MCA infarction criteria',
    applicabilityNotes: 'Enrollment paused per protocol after 32 patients once the 30-day mortality end point was reached; the recalculated sample size was 188, but the steering committee terminated the trial in light of the results of the joint analysis of the 3 European hemicraniectomy trials.',
    limitations: 'Very small; primary functional endpoint underpowered.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-destiny-2007'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Demonstrated the survival benefit of hemicraniectomy in malignant MCA infarction; functional benefit established in the pooled analysis.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'hamlet',
    shortName: 'HAMLET',
    fullName: 'Hemicraniectomy After Middle Cerebral Artery Infarction with Life-threatening Edema Trial',
    topic: 'malignant-edema',
    diseaseArea: ['acute-ischemic-stroke', 'malignant-edema'],
    population: {
      n: 64,
      ageRange: 'adults',
      nihssRange: 'space-occupying hemispheric infarction',
      timeWindow: 'randomized within 4 days of onset',
      keyInclusion: ['Space-occupying hemispheric infarction', 'Netherlands'],
      keyExclusion: []
    },
    intervention: 'Surgical decompression (n=32)',
    comparator: 'Best medical treatment (n=32)',
    primaryEndpoint: {
      definition: 'mRS 0-3 vs 4-6 at 1 year',
      timepoint: '1 y',
      result: 'No effect on primary outcome (ARR 0%, 95% CI −21 to 21); case fatality reduced (ARR 38%, 95% CI 15-60)',
      effectSize: 'ARR 0% (primary); ARR 38% (case fatality)',
      confidenceInterval: '95% CI −21 to 21 (primary)',
      pValue: ''
    },
    secondaryEndpoints: [
      { name: 'Meta-analysis of DECIMAL/DESTINY/HAMLET patients randomized ≤48 h', result: 'Poor outcome ARR 16% (−0.1 to 33); case fatality ARR 50% (34-66)' }
    ],
    safetyFindings: { sich: '', mortality: 'Case fatality reduced by 38 pp with surgery', other: '' },
    imagingCriteria: 'Space-occupying hemispheric infarction',
    applicabilityNotes: 'The timing trial of the trio: surgery within 48 h reduces death and poor outcome, but no evidence of functional benefit when delayed up to 96 h — the basis for operating early.',
    limitations: 'Small; the up-to-4-day window dilutes early-surgery effect; outcome preferences (survival vs dependency) drive the decision.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-hamlet-2009'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Operate within 48 h: delayed decompression saves lives but has no demonstrated functional benefit.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'destiny-2',
    shortName: 'DESTINY II',
    fullName: 'Hemicraniectomy in Older Patients with Extensive Middle-Cerebral-Artery Stroke',
    topic: 'malignant-edema',
    diseaseArea: ['acute-ischemic-stroke', 'malignant-edema'],
    population: {
      n: 112,
      ageRange: '≥61 (median 70, range 61-82)',
      nihssRange: 'malignant MCA infarction',
      timeWindow: 'randomized within 48 h of onset',
      keyInclusion: ['Malignant MCA infarction', 'Age 61 or older'],
      keyExclusion: []
    },
    intervention: 'Hemicraniectomy',
    comparator: 'Conservative ICU treatment',
    primaryEndpoint: {
      definition: 'Survival without severe disability (mRS 0-4) at 6 months',
      timepoint: '6 mo',
      result: 'Favored surgery: 38% vs 18%',
      effectSize: 'OR 2.91',
      confidenceInterval: '95% CI 1.06 to 7.49',
      pValue: 'P=0.04'
    },
    secondaryEndpoints: [
      { name: 'Mortality', result: '33% vs 70%' },
      { name: 'mRS 0-2 survivors', result: '0% in both groups; mRS 4: 32% vs 15%; mRS 5: 28% vs 13%' }
    ],
    safetyFindings: { sich: '', mortality: '33% vs 70% — large reduction with surgery', other: 'Infections more frequent after surgery; herniation more frequent with conservative care' },
    imagingCriteria: 'Malignant MCA infarction criteria',
    applicabilityNotes: 'Extends hemicraniectomy to patients over 60 — but no survivor regained independence (mRS 0-2 = 0%), and most needed assistance with most bodily needs. The consent conversation, not the operation, is the hard part.',
    limitations: 'Outcome benefit driven by survival into moderate-severe disability; quality-of-life trade-offs are value-dependent.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-destiny2-2014'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Hemicraniectomy improves survival without severe disability in patients >60, at the cost of survival largely into mRS 4-5.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'annexa-4',
    shortName: 'ANNEXA-4',
    fullName: 'Full Study Report of Andexanet Alfa for Bleeding Associated with Factor Xa Inhibitors',
    topic: 'ich-anticoag-reversal',
    diseaseArea: ['ich', 'ich-anticoag-reversal'],
    population: {
      n: 352,
      ageRange: 'mean 77',
      nihssRange: 'acute major bleeding',
      timeWindow: '≤18 h after factor Xa inhibitor dose',
      keyInclusion: ['Acute major bleeding on a factor Xa inhibitor', '64% intracranial, 26% gastrointestinal'],
      keyExclusion: []
    },
    intervention: 'Andexanet alfa bolus + 2-h infusion (single-arm)',
    comparator: 'None (single-group cohort)',
    primaryEndpoint: {
      definition: 'Coprimary: % change in anti-factor Xa activity; excellent/good hemostatic efficacy at 12 h',
      timepoint: '12 h',
      result: 'Anti-Xa activity reduced 92% (apixaban and rivaroxaban); excellent/good hemostasis 82% (204/249)',
      effectSize: '92% anti-Xa reduction',
      confidenceInterval: '95% CI 91-93 (apixaban); 88-94 (rivaroxaban)',
      pValue: ''
    },
    secondaryEndpoints: [
      { name: '30-day mortality', result: '14%' },
      { name: '30-day thrombotic events', result: '10%' }
    ],
    safetyFindings: { sich: '', mortality: '14% at 30 d', other: 'Thrombotic events 10% within 30 d; anti-Xa reduction not predictive of hemostatic efficacy overall (modestly predictive in ICH)' },
    imagingCriteria: '',
    applicabilityNotes: 'Single-arm cohort study of andexanet in factor Xa inhibitor-associated major bleeding. US accelerated approval (May 2018) rested on anti-factor Xa reduction in healthy volunteers, with a randomized trial required as a condition of approval. Andexanet was withdrawn from the US market in December 2025 because of FDA safety concerns about thrombotic events and is no longer available in the US. No comparator — the randomized evidence in ICH specifically is ANNEXA-I, which sits alongside this record.',
    limitations: 'Single-arm; efficacy population restricted to confirmed major bleeding with baseline anti-Xa ≥75 ng/mL; thrombotic-risk trade-off unquantified without control.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-annexa4-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Established andexanet reverses anti-Xa activity with 82% good hemostasis, at a 10% 30-day thrombotic event rate.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'action-cvt',
    shortName: 'ACTION-CVT',
    fullName: 'Direct Oral Anticoagulants Versus Warfarin in the Treatment of Cerebral Venous Thrombosis',
    topic: 'cvt',
    diseaseArea: ['cvt'],
    population: {
      n: 845,
      ageRange: 'mean 44.8; 64.7% women',
      nihssRange: 'CVT on oral anticoagulation',
      timeWindow: 'treated Jan 2015 - Dec 2020; median follow-up 345 d',
      keyInclusion: ['Consecutive CVT patients on oral anticoagulation', '27 centres: USA, Europe, New Zealand'],
      keyExclusion: []
    },
    intervention: 'DOAC (33.0% DOAC only; 15.1% both at different times)',
    comparator: 'Warfarin (51.8% warfarin only)',
    primaryEndpoint: {
      definition: 'Recurrent cerebral/systemic venous thrombosis (IPTW-adjusted Cox)',
      timepoint: 'Median 345 d follow-up',
      result: 'Similar recurrence: aHR 0.94 (95% CI 0.51-1.73); major hemorrhage LOWER with DOACs: aHR 0.35 (0.15-0.82, p=0.02)',
      effectSize: 'aHR 0.94 (recurrence); aHR 0.35 (major hemorrhage)',
      confidenceInterval: '95% CI 0.51-1.73 (recurrence)',
      pValue: 'p=0.84 (recurrence); p=0.02 (major hemorrhage)'
    },
    secondaryEndpoints: [
      { name: 'Death', result: 'aHR 0.78 (95% CI 0.22-2.76)' },
      { name: 'Partial/complete recanalization', result: 'aOR 0.92 (95% CI 0.48-1.73)' }
    ],
    safetyFindings: { sich: '', mortality: 'Similar (aHR 0.78)', other: 'Major hemorrhage lower with DOACs (aHR 0.35, p=0.02)' },
    imagingCriteria: 'Radiologically confirmed CVT; recanalization on follow-up imaging in 525 analysable patients',
    applicabilityNotes: 'The largest comparative CVT anticoagulation dataset — retrospective and IPTW-adjusted, not randomized. Consistent with RE-SPECT CVT and supports DOAC use in the 2024 AHA CVT statement.',
    limitations: 'Retrospective multicenter cohort; treatment crossover in 15%; residual confounding possible.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-action-cvt-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In this retrospective cohort, DOACs were associated with similar rates of recurrent venous thrombosis and recanalization and less major bleeding than warfarin — supportive observational evidence for DOACs as an alternative to warfarin for oral anticoagulation, which the authors say needs confirmation in prospective or randomized studies.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "basics",
    "shortName": "BASICS",
    "fullName": "Endovascular Therapy for Stroke Due to Basilar-Artery Occlusion",
    "topic": "evt-basilar",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "evt-basilar"
    ],
    "population": {
      "n": 300,
      "ageRange": "adults",
      "nihssRange": "Initially NIHSS ≥10 and age <85; after 91 randomized patients, eligibility expanded to NIHSS <10, age ≥85 and IVT contraindication",
      "timeWindow": "≤6 h from estimated onset",
      "keyInclusion": [
        "Basilar-artery occlusion",
        "IV thrombolysis used in ~79% of both groups"
      ],
      "keyExclusion": [
        "Intracranial hemorrhage",
        "Extensive bilateral brainstem infarction, cerebellar mass effect, or acute hydrocephalus"
      ]
    },
    "intervention": "Endovascular therapy (n=154; started median 4.4 h after onset)",
    "comparator": "Standard medical care (n=146)",
    "primaryEndpoint": {
      "definition": "Favorable functional outcome (mRS 0-3) at 90 d",
      "timepoint": "90 d",
      "result": "NOT significant: 44.2% vs 37.7%",
      "effectSize": "RR 1.18",
      "confidenceInterval": "95% CI 0.92 to 1.50",
      "pValue": ""
    },
    "secondaryEndpoints": [
      {
        "name": "90-day mortality",
        "result": "38.3% vs 43.2% (RR 0.87, 0.68-1.12)"
      }
    ],
    "safetyFindings": {
      "sich": "4.5% vs 0.7% (RR 6.9, 95% CI 0.9-53.0)",
      "mortality": "38.3% vs 43.2%",
      "other": ""
    },
    "imagingCriteria": "CTA/MRA-confirmed basilar occlusion; excluded extensive bilateral brainstem infarction, cerebellar mass effect and acute hydrocephalus. No CT-perfusion eligibility threshold.",
    "applicabilityNotes": "The confidence interval did not exclude meaningful benefit. Later ATTENTION and BAOCHE findings apply to their own selection criteria and windows; do not infer benefit across every BASICS subgroup. Distinct from BASIS for intracranial atherosclerosis.",
    "limitations": "High IVT use, broad severity range after amendment and slow eight-year recruitment. A diluting effect of milder stroke is a hypothesis; descriptive subgroup analyses were not powered to establish it.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-basics-2021"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "First basilar EVT RCT to begin enrolling (2011), though reported after the smaller, early-terminated BEST trial (Lancet Neurol 2019) — neutral, but set up the severity-selected trials that later proved benefit.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-09-26",
    verificationNotes: "Original main report via university repository compared, including main tables and subgroup figure; no complete protocol/supplement history clearance. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "axiomatic-ssp",
    "shortName": "AXIOMATIC-SSP",
    "fullName": "Safety and Efficacy of Factor XIa Inhibition with Milvexian for Secondary Stroke Prevention",
    "topic": "factor-xi-inhibition",
    "diseaseArea": [
      "secondary-prevention",
      "factor-xi-inhibition"
    ],
    "population": {
      "n": 2366,
      "ageRange": "≥40 years",
      "nihssRange": "≤7 (initially ≤5)",
      "timeWindow": "randomized within 48 h of symptom onset of acute ischaemic stroke or high-risk TIA (age ≥40); 90-day treatment period",
      "keyInclusion": [
        "All participants on clopidogrel (21 d) + aspirin (90 d) background",
        "Phase 2 dose-finding: milvexian 25 mg QD; 25, 50, 100, 200 mg BID vs placebo",
        "Nonlacunar, noncardioembolic stroke with visible supplying-artery atherosclerosis; selected reperfusion patients entered ≥24 hours later without hemorrhagic transformation"
      ],
      "keyExclusion": []
    },
    "intervention": "Milvexian (five dose arms) + DAPT background",
    "comparator": "Placebo + DAPT background",
    "primaryEndpoint": {
      "definition": "Composite of symptomatic ischaemic stroke or covert brain infarct on MRI at 90 d",
      "timepoint": "90 d",
      "result": "Neutral prespecified dose-response analysis. Reported 16.8% placebo and 15.3–16.7% active-arm risks are model-based estimates, not raw event proportions.",
      "effectSize": "Model-based RR vs placebo 0.91-0.99 across doses",
      "confidenceInterval": "",
      "pValue": "No dose-response"
    },
    "secondaryEndpoints": [
      {
        "name": "Major bleeding",
        "result": "1-2% across arms, no dose-response"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Major bleeding, mainly gastrointestinal, increased at 50 mg twice daily and higher despite no consistent dose-response. The 200 mg twice-daily group also had a renal adverse-event signal; no meaningful intracranial bleeding increase was detected."
    },
    "imagingCriteria": "MRI for covert infarct component of composite",
    "applicabilityNotes": "The primary dose-response analysis was neutral. Prespecified exploratory analyses suggested fewer symptomatic ischemic strokes at most doses; these do not establish efficacy. Lack of a consistent bleeding dose-response does not mean no bleeding excess.",
    "limitations": "Phase 2; composite dominated by covert MRI infarcts; not powered for clinical stroke.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-axiomatic-ssp-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Phase 2 dose-finding evidence; no established clinical benefit. Interpret exploratory stroke and dose-specific bleeding findings separately from the neutral primary analysis.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'pearl',
    shortName: 'PEARL',
    fullName: 'Intra-Arterial Alteplase After Successful Endovascular Reperfusion in Acute Stroke',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: {
      n: 324,
      ageRange: 'median 68 y (IQR 58-75)',
      nihssRange: 'baseline NIHSS 6-25 (protocol inclusion; anterior-circulation LVO)',
      timeWindow: '≤24 h from symptom onset to thrombectomy',
      keyInclusion: ['Acute anterior-circulation large-vessel occlusion stroke', 'Successful reperfusion after mechanical thrombectomy (eTICI ≥2b50)', 'Guideline-based IV thrombolysis permitted before EVT', '28 hospitals in China; randomized Aug 1 2023 - Oct 16 2024 (NCT05856851)'],
      keyExclusion: ['Failure to achieve eTICI ≥2b50 after thrombectomy']
    },
    intervention: 'Intra-arterial alteplase 0.225 mg/kg (maximum 20 mg) after successful reperfusion (n=164)',
    comparator: 'Standard treatment, no intra-arterial thrombolysis (n=160)',
    primaryEndpoint: {
      definition: 'Proportion with modified Rankin Scale score 0-1 (excellent outcome) at 90 days; superiority design',
      timepoint: '90 d',
      result: 'MET superiority, favoring IA alteplase: 44.8% (73/163) vs 30.2% (48/159)',
      effectSize: 'Adjusted RR 1.45',
      confidenceInterval: '95% CI 1.08 to 1.96',
      pValue: 'P=.01'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracranial hemorrhage within 36 h',
        result: '4.3% (7/164) vs 5.0% (8/160); adjusted RR 0.85 (95% CI 0.43-1.69), P=.67 — no difference'
      },
      {
        name: 'All-cause mortality within 90 days',
        result: '17.1% (28/164) vs 11.3% (18/160); adjusted HR 1.60 (95% CI 0.88-2.89), P=.12 — numerically higher with IA alteplase, not statistically significant'
      },
      {
        name: 'Any intracranial hemorrhage within 36 h',
        result: '32.9% (54/164) vs 26.9% (43/160); adjusted RR 1.22 (95% CI 0.92-1.63), P=.17 — numerically higher, not significant'
      }
    ],
    safetyFindings: {
      sich: '4.3% (7/164) vs 5.0% (8/160) within 36 h; adjusted RR 0.85 (95% CI 0.43-1.69)',
      mortality: '90-day all-cause mortality 17.1% vs 11.3%; adjusted HR 1.60 (95% CI 0.88-2.89), P=.12',
      other: 'Any intracranial hemorrhage within 36 h 32.9% vs 26.9% (adjusted RR 1.22, 95% CI 0.92-1.63)'
    },
    imagingCriteria: 'Baseline NCCT/DWI ASPECTS ≥6, then randomization after thrombectomy achieved eTICI ≥2b50; no perfusion-based core-volume gate for the adjunct',
    applicabilityNotes: 'PEARL is a Chinese replication of the CHOICE hypothesis and uses the identical alteplase dose (0.225 mg/kg, capped at 20 mg) as CHOICE-2. Read the three anterior-circulation alteplase trials as one line of evidence (CHOICE n=121, CHOICE-2 n=440, PEARL n=324): the excellent-outcome benefit reproduces across all three, while 90-day mortality was higher with IA alteplase in both of the larger two — numerically in PEARL (17.1% vs 11.3%, P=.12) and statistically significantly in CHOICE-2 (12.1% vs 6.4%, adjusted risk difference 5.9%, P=.03). The finding is not confined to East Asian populations (CHOICE and CHOICE-2 were Spanish trials), but it does not extend to the posterior circulation, where IAT-TOP was neutral.',
    limitations: 'Single-country (China) trial; randomization was not blinded to the interventionalist; the mortality and any-ICH signals are numerically adverse and the trial was not powered to exclude a mortality harm of the observed size; no placebo infusion in the control arm; the benefit rests on a single dichotomized endpoint.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-pearl-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Strengthens, but does not settle, the case for adjunctive IA alteplase 0.225 mg/kg after successful anterior-circulation thrombectomy; the 2026 AHA/ASA AIS guideline rates adjunctive intra-arterial thrombolytics after mTICI ≥2b reperfusion only Class 2b (may be reasonable; LOE B-R) on an evidence review that predates PEARL and CHOICE-2, and the numerically higher mortality here (not significant) plus the significantly higher mortality in CHOICE-2 argue for caution — an optional adjunct, not a standard step.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'angel-tnk',
    shortName: 'ANGEL-TNK',
    fullName: 'Intra-arterial Tenecteplase for Acute Stroke After Successful Endovascular Therapy',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: {
      n: 256,
      ageRange: 'median 71.6 y (IQR 61.3-79.2); 44.1% female',
      nihssRange: 'not restricted by a protocol NIHSS band (anterior-circulation LVO)',
      timeWindow: '4.5 to 24 h from last known well',
      keyInclusion: ['Acute anterior-circulation large-vessel occlusion', 'Successful endovascular recanalization (eTICI 2b-3)', '19 centers in China; recruitment Feb 16 2023 - Mar 23 2024 (NCT05624190)'],
      keyExclusion: ['Failure to achieve eTICI ≥2b after endovascular therapy']
    },
    intervention: 'Intra-arterial tenecteplase 0.125 mg/kg after successful endovascular therapy (n=126)',
    comparator: 'Standard medical treatment, no intra-arterial lytic (n=129)',
    primaryEndpoint: {
      definition: 'Excellent outcome at 90 days, defined as modified Rankin Scale score 0-1; superiority design',
      timepoint: '90 d',
      result: 'MET superiority, favoring IA tenecteplase: 40.5% (51/126) vs 26.4% (34/129)',
      effectSize: 'RR 1.44',
      confidenceInterval: '95% CI 1.06 to 1.95',
      pValue: 'P=.02'
    },
    secondaryEndpoints: [
      {
        name: 'Seven prespecified secondary efficacy endpoints (90-day mRS 0-1, ordinal mRS, mRS 0-2, mRS 0-3, 36-h NIHSS 0-1 or ≥10-point improvement, 90-day EQ-VAS, 24-h Tmax>6 s volume and infarct-core change)',
        result: 'NONE of the 7 showed a significant difference — no secondary endpoint supported the primary result'
      },
      {
        name: 'Symptomatic intracranial hemorrhage within 48 h',
        result: '5.6% vs 6.2%; RR 0.95 (95% CI 0.36-2.53), P=.92 — no difference'
      },
      {
        name: 'All-cause mortality within 90 days',
        result: '21.4% vs 21.7%; RR 0.76 (95% CI 0.40-1.43), P=.78 — no difference'
      }
    ],
    safetyFindings: {
      sich: '5.6% vs 6.2% within 48 h; RR 0.95 (95% CI 0.36-2.53), P=.92',
      mortality: '90-day all-cause mortality 21.4% vs 21.7%; RR 0.76 (95% CI 0.40-1.43), P=.78',
      other: 'No excess of any intracranial hemorrhage within 48 h reported'
    },
    imagingCriteria: 'Perfusion-selected late-window cohort (per protocol): CTP/PWI ischemic core <70 mL, mismatch ratio ≥1.2 and a minimum mismatch volume (≥10 mL in the published protocol; ≥15 mL in the ClinicalTrials.gov record), ASPECTS ≥6 on NCCT/DWI; randomization after EVT achieved eTICI 2b50-3; patients who received IV thrombolysis on admission were excluded',
    applicabilityNotes: 'This is the tenecteplase counterpart to CHOICE/CHOICE-2/PEARL, and the only IA-adjunct trial restricted to the late window (4.5-24 h). Its internal inconsistency is the teaching point: a positive primary endpoint with zero of seven prespecified secondary efficacy endpoints agreeing is weak internal replication, and the investigators themselves call for confirmatory trials. Note the direct tension with the phase 1b/2a IA tenecteplase dose-escalation trial, in which the same 0.125 mg/kg tier crossed a prespecified sICH safety threshold (3 of 12 patients, P=.04) and was not carried into the randomized expansion.',
    limitations: 'Open-label with blinded endpoint assessment; single-country (China); modest size (n=256); no secondary efficacy endpoint corroborated the primary, raising the possibility of a chance finding on a single dichotomized outcome; safety confidence intervals are wide.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-angel-tnk-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Extends the adjunctive-lysis hypothesis to intra-arterial tenecteplase in the late window, but a positive primary with no supporting secondary endpoint is not a basis to adopt it; the 2026 AHA/ASA guideline gives adjunctive intra-arterial thrombolytics after successful EVT (mTICI ≥2b) only a Class 2b (LOE B-R) recommendation, and the 0.125 mg/kg IA tenecteplase regimen specifically still needs confirmatory trials.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'iat-top',
    shortName: 'IAT-TOP',
    fullName: 'Intra-arterial Alteplase Thrombolysis After Successful Thrombectomy for Acute Ischemic Stroke in the Posterior Circulation',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt', 'evt-basilar'],
    population: {
      n: 246,
      ageRange: 'median 65.0 y (IQR 56.0-72.0); 176 male (71.5%)',
      nihssRange: '≥6 at admission (registered inclusion criterion, NCT05897554; also age 18-80 and PC-ASPECTS 6-10)',
      timeWindow: '≤24 h from time last known well',
      keyInclusion: ['Acute basilar artery occlusion (posterior-circulation LVO)', 'Successful recanalization after endovascular thrombectomy', '37 comprehensive stroke centers in China; enrolment Sep 5 2023 - Nov 29 2024 (NCT05897554)'],
      keyExclusion: ['Basilar artery reocclusion before the intra-arterial infusion (1 of 247 enrolled patients excluded from the full analysis set)']
    },
    intervention: 'Intra-arterial alteplase 0.225 mg/kg (maximum 22.5 mg) at 1.0 mg/mL infused over 15 min distal to the PICA origin (n=124)',
    comparator: 'Control — no intra-arterial thrombolysis after successful thrombectomy (n=122)',
    primaryEndpoint: {
      definition: 'Functional independence, defined as modified Rankin Scale score 0-2, at 90 days; superiority design',
      timepoint: '90 d',
      result: 'DID NOT meet superiority — flatly neutral and numerically favoring control: 41.9% (52/124) with IA alteplase vs 46.7% (57/122) control',
      effectSize: 'Adjusted RR 0.93',
      confidenceInterval: '95% CI 0.73 to 1.18',
      pValue: 'P=.55'
    },
    secondaryEndpoints: [
      {
        name: 'All-cause mortality at 90 days (co-primary safety outcome)',
        result: '29.6% vs 27.0%; adjusted HR 1.07 (95% CI 0.71-1.61), P=.75 — no difference'
      },
      {
        name: 'Symptomatic intracranial hemorrhage within 48 h (co-primary safety outcome)',
        result: '2.4% vs 2.5%; unadjusted RR 0.98 (95% CI 0.20-4.74), P=.97 — no difference'
      }
    ],
    safetyFindings: {
      sich: '2.4% vs 2.5% within 48 h; RR 0.98 (95% CI 0.20-4.74), P=.97 — low and equal in both arms',
      mortality: '90-day mortality 29.6% vs 27.0%; adjusted HR 1.07 (95% CI 0.71-1.61), P=.75',
      other: 'Investigators concluded the intervention appeared safe; it simply did not improve function'
    },
    imagingCriteria: 'Baseline PC-ASPECTS 6-10 on CT/CTA source images or DWI; randomization after thrombectomy achieved eTICI ≥2b50 with no more than 3 device passes',
    applicabilityNotes: 'This is the counterweight record for the IA-adjunct category and it must not be softened: in the posterior circulation the result was NEUTRAL, with the point estimate numerically favoring no intra-arterial lytic (41.9% vs 46.7%, adjusted RR 0.93). The result is consistent with, but cannot by itself establish, a territory-specific effect (IAT-TOP used mRS 0-2 rather than mRS 0-1) — the same 0.225 mg/kg alteplase dose that improved excellent outcome in the anterior circulation (CHOICE, CHOICE-2, PEARL) produced no functional benefit after successful basilar recanalization. Basilar occlusion also carries a much higher baseline mortality (about 27-30% in both arms here) than the anterior-circulation trials, which changes both the outcome distribution and the plausible mechanism of benefit.',
    limitations: 'PROBE (open-label, blinded-endpoint) design; single-country (China); powered for a difference larger than any that was observed, so a small benefit or small harm cannot be excluded; used mRS 0-2 rather than the mRS 0-1 endpoint used by the anterior-circulation trials, which limits head-to-head comparison of effect sizes.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-iat-top-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against extrapolating adjunctive intra-arterial alteplase from the anterior circulation to basilar occlusion — after successful basilar recanalization it was safe but produced no functional gain.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "ia-tenecteplase-dose-escalation",
    "shortName": "DATE (IA tenecteplase dose-escalation)",
    "fullName": "Intra-Arterial Tenecteplase After Successful Reperfusion in Large Vessel Occlusion Stroke: A Phase 1b/2a Dose-Escalation and Dose-Expansion Randomized Clinical Trial",
    "topic": "ia-adjunct-after-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ia-adjunct-after-evt"
    ],
    "population": {
      "n": 205,
      "ageRange": "median 71 y (IQR 60-77); 113 (55.1%) male",
      "nihssRange": "6-24 (baseline, protocol inclusion; anterior-circulation LVO)",
      "timeWindow": "≤24 h from last known well",
      "keyInclusion": [
        "Large-vessel occlusion with successful reperfusion after thrombectomy (eTICI 2b-3)",
        "Phase 1b dose-escalation (n=48, nonrandomized) plus phase 2a dose-expansion (n=157, randomized)",
        "Multicenter, China, 2023-2024 (ChiCTR2300073787 and ChiCTR2400080624)"
      ],
      "keyExclusion": [
        "Failure to achieve eTICI 2b-3 after thrombectomy",
        "IV thrombolysis before EVT"
      ]
    },
    "intervention": "IA tenecteplase dose escalation after EVT: 0.03125, 0.0625 and 0.1250 mg/kg were administered. The planned 0.1875 mg/kg tier was never reached; escalation stopped after sICH in 3/12 at 0.1250 mg/kg.",
    "comparator": "Phase 2a control arm — no intra-arterial thrombolysis (n=65)",
    "primaryEndpoint": {
      "definition": "Two primaries. Phase 1b: symptomatic intracranial hemorrhage within 24 h against a prespecified dose-tier safety threshold. Phase 2a: no-disability outcome (modified Rankin Scale 0-1) at 90 days",
      "timepoint": "24 h (phase 1b) and 90 d (phase 2a)",
      "result": "Phase 1b: the 0.1250 mg/kg tier CROSSED the prespecified safety threshold (sICH in 3 of 12 patients, P=.04); sICH occurred in 1 of 14 at 0.0313 mg/kg and 2 of 22 at 0.0625 mg/kg. Phase 2a DID NOT demonstrate benefit at either surviving dose: mRS 0-1 33.8% (22/65) control vs 37.0% (17/46) at 0.0313 mg/kg vs 43.5% (20/46) at 0.0625 mg/kg",
      "effectSize": "Phase 2a adjusted RR vs control: 0.85 at 0.0313 mg/kg; 1.15 at 0.0625 mg/kg",
      "confidenceInterval": "0.0313 mg/kg 95% CI 0.54 to 1.35; 0.0625 mg/kg 95% CI 0.73 to 1.80",
      "pValue": "P=.50 and P=.55 respectively"
    },
    "secondaryEndpoints": [
      {
        "name": "Safety outcomes across the three phase 2a groups",
        "result": "No significant difference among the three groups"
      }
    ],
    "safetyFindings": {
      "sich": "Phase 1b by tier: 1/14 at 0.0313 mg/kg, 2/22 at 0.0625 mg/kg, 3/12 at 0.1250 mg/kg — the 0.1250 mg/kg tier exceeded the prespecified safety threshold (P=.04)",
      "mortality": "Phase 2a 90-day death: 21.5% (14/65) control vs 15.2% (7/46) at 0.0313 mg/kg (adjusted RR 0.77; 95% CI 0.34-1.79) vs 19.6% (9/46) at 0.0625 mg/kg (adjusted RR 0.78; 95% CI 0.36-1.66), no significant difference; phase 1b (nonrandomized, no control) deaths 2/14 (14.3%), 5/22 (22.7%) and 4/12 (33.3%) at 0.0313, 0.0625 and 0.1250 mg/kg",
      "other": "No significant difference in safety outcomes among the three phase 2a groups"
    },
    "imagingCriteria": "Baseline NCCT ASPECTS ≥6 (perfusion imaging not required); enrolment after thrombectomy achieved eTICI 2b-3",
    "applicabilityNotes": "Small nonrandomized dose-escalation study in patients who had not received IV thrombolysis before EVT. The 3/12 sICH at 0.1250 mg/kg is a safety signal in this selected setting, not a universal dose-specific contraindication or evidence supporting the unadministered 0.1875 mg/kg tier.",
    "limitations": "Small phase 1b/2a trial not powered for efficacy; the escalation phase was nonrandomized and the sICH tier comparisons rest on single-digit event counts; single-country (China); open-label with blinded outcome assessment; the phase 2a efficacy result is exploratory by design.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-ia-tenecteplase-dose-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Shows that the safety of adjunctive intra-arterial tenecteplase is dose-dependent and that the 0.125 mg/kg tier tripped a prespecified hemorrhage boundary in escalation — dose, not just drug class, has to be specified before any adjunctive-lysis claim is made.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'ia-thrombolysis-dose-network-meta-analysis',
    shortName: 'IA Thrombolysis Dose Network Meta-analysis',
    fullName: 'Dose-Specific Intra-Arterial Thrombolysis After Endovascular Thrombectomy for Large-Vessel Occlusion Stroke: A Network Meta-Analysis of Randomized Trials',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: {
      n: 2126,
      ageRange: 'median approximately 69 y; approximately 40% women',
      nihssRange: 'as per the seven contributing randomized trials',
      timeWindow: 'as per the contributing trials (angiographic reperfusion achieved after EVT)',
      keyInclusion: ['Randomized controlled trials of adults with large-vessel occlusion acute ischemic stroke who achieved angiographic reperfusion after EVT', 'Randomization to adjunctive intra-arterial alteplase, tenecteplase, or urokinase versus EVT alone', 'Seven RCTs forming a coherent 6-node network; predominantly anterior-circulation stroke', 'PubMed, Embase and Cochrane CENTRAL searched from inception to Oct 30 2025'],
      keyExclusion: ['Nonrandomized comparisons; trials without angiographic reperfusion after EVT']
    },
    intervention: 'Dose-specific adjunctive intra-arterial thrombolysis regimens (alteplase 0.225 mg/kg; tenecteplase 0.125, 0.0625 and 0.03125 mg/kg; urokinase)',
    comparator: 'Endovascular thrombectomy alone (control node)',
    primaryEndpoint: {
      definition: 'Excellent functional recovery (modified Rankin Scale 0-1) at 90 days, compared across dose-specific nodes in a frequentist random-effects network meta-analysis with GRADE-for-NMA certainty rating',
      timepoint: '90 d',
      result: 'Signal confined to two regimens: IA alteplase 0.225 mg/kg OR 1.94 vs control, and tenecteplase 0.125 mg/kg OR 1.90 vs control; lower-dose tenecteplase (0.0625 and 0.03125 mg/kg) and urokinase showed attenuated or uncertain effects',
      effectSize: 'OR 1.94 (alteplase 0.225 mg/kg); OR 1.90 (tenecteplase 0.125 mg/kg)',
      confidenceInterval: '95% CI 1.31 to 2.87 (alteplase 0.225 mg/kg); 95% CI 1.12 to 3.23 (tenecteplase 0.125 mg/kg)',
      pValue: 'Not reported — effect estimates presented as odds ratios with 95% CIs and P-score rankings'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracranial hemorrhage',
        result: 'NO regimen differed significantly from control; safety estimates were imprecise'
      },
      {
        name: '90-day mortality',
        result: 'NO regimen differed significantly from control; safety estimates were imprecise'
      },
      {
        name: 'Broader functional outcomes',
        result: 'Effects were attenuated relative to the mRS 0-1 endpoint'
      },
      {
        name: 'Network coherence',
        result: 'Global heterogeneity and inconsistency were low across outcomes'
      }
    ],
    safetyFindings: {
      sich: 'No dose-specific regimen showed a statistically significant difference from control; estimates imprecise',
      mortality: 'No dose-specific regimen showed a statistically significant difference from control at 90 days; estimates imprecise',
      other: 'Risk of bias assessed with Cochrane RoB 2; certainty rated with GRADE adapted for network meta-analysis'
    },
    imagingCriteria: 'Not applicable — inclusion in the contributing trials was defined angiographically by post-EVT reperfusion',
    applicabilityNotes: 'The only quantitative synthesis that treats agent AND dose as separate nodes rather than pooling \'IA lytic after EVT\' as one intervention, which is the right question given that the 0.125 mg/kg tenecteplase tier crossed a hemorrhage boundary in dose escalation. Its own authors state the findings are hypothesis-generating and should inform the design of future dose-specific trials rather than guide current practice — that framing should travel with the numbers. Note also that the two \'winning\' nodes each rest on very few trials that already populate this category individually (alteplase 0.225 mg/kg: CHOICE [Spain] and PEARL [China]; tenecteplase 0.125 mg/kg: ANGEL-TNK [China]), so this is not independent confirmation.',
    limitations: 'Two-author, PROSPERO-registered study-level analysis without individual patient data or listed trialist involvement; frequentist NMA with only seven trials across six nodes, so several comparisons rest on single trials and are indirect; safety estimates explicitly imprecise, meaning a hemorrhage or mortality hazard cannot be excluded; contributing trials are largely open-label and single-country; the authors themselves label the result hypothesis-generating.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ia-thrombolysis-dose-nma-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Frames adjunctive intra-arterial lysis as a dose-specific question rather than a settled class effect, and explicitly does not support adopting any regimen into practice on current evidence.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'attraction',
    shortName: 'ATTRACTION',
    fullName: 'Adjunct Tirofiban Treatment after Successful Endovascular Thrombectomy Recanalisation in Acute Anterior Circulation Ischaemic Stroke',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 1380,
      ageRange: 'median 71 y (IQR 62-77); 591 (43%) female, 789 (57%) male',
      nihssRange: '6-30 (protocol inclusion; anterior-circulation LVO)',
      timeWindow: 'Randomization within 24 h of onset (last known well), after successful reperfusion by thrombectomy',
      keyInclusion: ['Acute ischaemic stroke due to anterior-circulation large-vessel occlusion', 'Successful reperfusion after thrombectomy', '82 hospitals in China; randomized Apr 9 2024 - Sep 29 2025 (NCT06265051)', '1367 of 1380 (99%) participants were of Han Chinese ethnicity'],
      keyExclusion: ['Failure to achieve successful reperfusion after thrombectomy (1686 assessed, 1380 randomized)']
    },
    intervention: 'Tirofiban — intra-arterial bolus 5 µg/kg followed by IV infusion 0.1 µg/kg/min for 24 h (n=689)',
    comparator: 'Matching placebo, same volume, same bolus and infusion procedure (n=691)',
    primaryEndpoint: {
      definition: 'Functional independence (modified Rankin Scale 0-2) at 90 days, intention-to-treat; superiority design',
      timepoint: '90 d',
      result: 'MET superiority, favoring tirofiban: 49% (340/689) vs 43% (299/691)',
      effectSize: 'Unadjusted absolute risk difference 6.1 percentage points; adjusted RR 1.15',
      confidenceInterval: '95% CI 0.8 to 11.3 percentage points (unadjusted); 95% CI 1.03 to 1.27 (adjusted RR)',
      pValue: 'p=0.023 unadjusted; p=0.0092 adjusted'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracranial haemorrhage within 48 h',
        result: '12% (82/687) vs 9% (65/691) — numerically higher with tirofiban, NOT statistically significant; the authors state this \'warrants caution when weighing potential benefit against bleeding risk\''
      },
      {
        name: 'Any intracranial haemorrhage within 48 h',
        result: '34% (235) vs 32% (219) — no significant difference'
      },
      {
        name: 'Death within 90 days',
        result: '18% (126) vs 19% (131) — no significant difference'
      }
    ],
    safetyFindings: {
      sich: '12% (82/687) vs 9% (65/691) within 48 h — numerically higher with tirofiban, not statistically significant',
      mortality: '90-day death 18% (126) vs 19% (131) — no difference',
      other: 'Any intracranial haemorrhage within 48 h 34% vs 32%; no patients lost to follow-up at 90 days'
    },
    imagingCriteria: 'ASPECTS ≥6 on NCCT or DWI; randomization after thrombectomy achieved stable mTICI 2b/3',
    applicabilityNotes: 'The pivotal contrast in this category is timing relative to reperfusion, not the drug. ATTRACTION gave tirofiban AFTER successful reperfusion and improved 90-day independence by about 6 absolute points; RESCUE BT gave IV tirofiban BEFORE thrombectomy in a comparable Chinese population and was neutral with a hemorrhage trend the wrong way. A positive post-reperfusion result therefore does not overturn recommendations against pre-procedural tirofiban. Generalisability is bounded: 99% of participants were Han Chinese, in whom intracranial atherosclerotic occlusion — the lesion type most likely to reocclude and thus to benefit from a GP IIb/IIIa inhibitor — is far more prevalent than in most Western cohorts.',
    limitations: 'Single-country trial with a 99% Han Chinese population; the 2.5-percentage-point excess of symptomatic haemorrhage (11.9% vs 9.4%) is real in absolute terms even though not statistically significant, and the trial was not powered to exclude it; no mortality benefit was demonstrated (90-day death 18% vs 19%); the underlying occlusion aetiology mix limits transfer to embolic-predominant populations.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-attraction-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reopens the adjunctive-antiplatelet question specifically for the post-reperfusion window, while the numerically higher symptomatic haemorrhage and the near-uniformly Han Chinese cohort mean it is not yet a general recommendation.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "rescue-bt",
    "shortName": "RESCUE BT",
    "fullName": "Effect of Intravenous Tirofiban vs Placebo Before Endovascular Thrombectomy on Functional Outcomes in Large Vessel Occlusion Stroke",
    "topic": "acute-antithrombotic-adjuncts",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-antithrombotic-adjuncts"
    ],
    "population": {
      "n": 948,
      "ageRange": "Median age 67 years",
      "nihssRange": "≤30",
      "timeWindow": "≤24 h from time last known well",
      "keyInclusion": [
        "Stroke with proximal intracranial large-vessel occlusion planned for endovascular thrombectomy",
        "55 hospitals in China; recruitment Oct 10 2018 - Oct 31 2021 (ChiCTR-IOR-17014167)",
        "Investigator-initiated, randomized, double-blind, placebo-controlled",
        "ASPECTS ≥6"
      ],
      "keyExclusion": [
        "IV thrombolysis after onset",
        "Dual antiplatelet therapy in the previous week"
      ]
    },
    "intervention": "Tirofiban 10 µg/kg IV bolus followed by 0.15 µg/kg/min for up to 24 hours",
    "comparator": "Matching intravenous placebo before endovascular thrombectomy (n=485)",
    "primaryEndpoint": {
      "definition": "Disability level at 90 days measured as the overall ordinal distribution (shift) of modified Rankin Scale scores 0-6; superiority design",
      "timepoint": "90 d",
      "result": "DID NOT meet superiority — neutral: median (IQR) 90-day mRS 3 (1-4) with tirofiban vs 3 (1-4) with placebo",
      "effectSize": "Adjusted common OR 1.08 for a lower level of disability with tirofiban",
      "confidenceInterval": "95% CI 0.86 to 1.36",
      "pValue": "Not significant — the 95% CI crosses 1; no p-value reported in the abstract"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic intracranial hemorrhage within 48 h (primary safety outcome)",
        "result": "9.7% with tirofiban vs 6.4% with placebo; difference 3.3% (95% CI -0.2% to 6.8%) — numerically higher with tirofiban, CI includes zero"
      }
    ],
    "safetyFindings": {
      "sich": "9.7% vs 6.4% within 48 h; absolute difference 3.3% (95% CI -0.2% to 6.8%)",
      "mortality": "84/463 (18.1%) versus 82/485 (16.9%); adjusted OR 1.09 (95% CI 0.77–1.55)",
      "other": "Any ICH 34.9% versus 28.0%, adjusted OR 1.40 (1.06–1.86), exploratory; 58 placebo patients received rescue tirofiban."
    },
    "imagingCriteria": "Confirmed proximal intracranial large-vessel occlusion on vascular imaging; no perfusion-mismatch selection for the adjunct",
    "applicabilityNotes": "The primary trial was neutral. Timing, dosing and eligibility differed from other tirofiban trials; cross-trial contrasts cannot isolate timing as the sole cause of different outcomes.",
    "limitations": "Single-country (China) trial in a population with a high prevalence of intracranial atherosclerosis; an ordinal shift primary endpoint may miss a benefit confined to a single mRS threshold; not powered to exclude the observed 3.3-percentage-point excess of symptomatic hemorrhage; predates current first-pass thrombectomy technique.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-rescue-bt-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not support giving intravenous tirofiban before endovascular thrombectomy: 90-day disability was unchanged and symptomatic hemorrhage was numerically higher.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "most",
    "shortName": "MOST",
    "fullName": "Multi-arm Optimization of Stroke Thrombolysis: Adjunctive Intravenous Argatroban or Eptifibatide for Ischemic Stroke",
    "topic": "acute-antithrombotic-adjuncts",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-antithrombotic-adjuncts"
    ],
    "population": {
      "n": 514,
      "ageRange": "adults ≥18 y",
      "nihssRange": "≥6 before intravenous thrombolysis",
      "timeWindow": "IV thrombolysis within 3 h of onset; study drug started within 75 min of the start of thrombolysis",
      "keyInclusion": [
        "Acute ischemic stroke treated with IV thrombolysis within 3 h of symptom onset (70% alteplase, 30% tenecteplase)",
        "57 sites in the United States (NCT03735979; NINDS-funded, Washington University)",
        "Endovascular thrombectomy per usual care was permitted — 225 patients (44%) underwent thrombectomy"
      ],
      "keyExclusion": [
        "Anticoagulant or GP IIb/IIIa exposure per protocol windows",
        "Baseline mRS >3",
        "Standard thrombolysis contraindications"
      ]
    },
    "intervention": "Adjunctive intravenous argatroban (n=59) or intravenous eptifibatide (n=227), started within 75 min of the start of IV thrombolysis",
    "comparator": "Placebo (n=228)",
    "primaryEndpoint": {
      "definition": "Utility-weighted 90-day modified Rankin Scale score (range 0-10, higher = better), centrally adjudicated; Bayesian adaptive three-group design in which a high posterior probability of superiority was required",
      "timepoint": "90 d",
      "result": "DID NOT meet superiority for either adjunct — mean (±SD) utility-weighted 90-day mRS 5.2±3.7 with argatroban, 6.3±3.2 with eptifibatide and 6.8±3.0 with placebo; both adjuncts were numerically WORSE than placebo",
      "effectSize": "Posterior mean difference vs placebo −1.51±0.51 (argatroban) and −0.50±0.29 (eptifibatide)",
      "confidenceInterval": "Bayesian design — posterior mean differences with SD reported rather than frequentist confidence intervals",
      "pValue": "No p-value; posterior probability that the adjunct was BETTER than placebo was 0.002 for argatroban and 0.041 for eptifibatide (i.e. both very unlikely to be better)"
    },
    "secondaryEndpoints": [
      {
        "name": "90-day all-cause mortality (descriptive)",
        "result": "Treated safety denominators: argatroban 13/54 (24%), eptifibatide 25/212 (12%), placebo 17/217 (8%). Randomized totals were 59/227/228; do not substitute them for the safety population."
      }
    ],
    "safetyFindings": {
      "sich": "Symptomatic intracranial hemorrhage within 36 h was similar across the three groups: 4% argatroban, 3% eptifibatide, 2% placebo",
      "mortality": "Treated safety population: argatroban 13/54 (24%), eptifibatide 25/212 (12%), placebo 17/217 (8%); these differ from randomized totals 59/227/228.",
      "other": "The excess mortality was not explained by symptomatic intracranial hemorrhage, which was similar across arms"
    },
    "imagingCriteria": "Noncontrast CT excluding hemorrhage and excluding hypodensity of more than one third of the MCA territory; no perfusion or mismatch selection",
    "applicabilityNotes": "The most important record in this category for a US reader, because it is the only large multicenter North American trial here — every other trial in the category is Chinese. Its lesson is about the post-thrombolysis window: adding an anticoagulant or a GP IIb/IIIa inhibitor within 75 minutes of IV lysis did not reduce disability. Read the mortality figures carefully and teach them carefully: they were a descriptive secondary observation, the argatroban percentage rests on only 59 patients, no p-value or interval was reported, symptomatic hemorrhage was similar across arms, and enrolment ended for futility rather than by a safety rule. The honest statement is 'no disability benefit, with an unexplained numerical mortality excess that the design cannot quantify' — not 'argatroban significantly increased mortality'.",
    "limitations": "Adaptive design with badly unequal arms — the argatroban group closed at only 59 patients while the other two exceeded 220, so every argatroban estimate is fragile; single-blind; Bayesian posterior probabilities are frequently misreported as frequentist p-values; enrolment stopped early for futility, so the trial cannot exclude a modest benefit or quantify the mortality signal; 44% also received thrombectomy, mixing two treatment contexts.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-most-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Argues against adding intravenous argatroban or eptifibatide to IV thrombolysis in the first hours after treatment: no reduction in disability, and a numerical mortality excess the trial was stopped too early to characterise.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'qasc',
    shortName: 'QASC',
    fullName: 'Quality in Acute Stroke Care: implementation of evidence-based treatment protocols to manage fever, hyperglycaemia, and swallowing dysfunction in acute stroke',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 1696,
      ageRange: 'adults ≥18 y',
      nihssRange: 'unselected stroke severity; benefit reported as present irrespective of severity',
      timeWindow: 'presentation ≤48 h of symptom onset',
      keyInclusion: ['Ischaemic stroke or intracerebral haemorrhage presenting within 48 h', 'Admitted to one of 19 acute stroke units in New South Wales, Australia with on-site CT and high-dependency beds', 'English-speaking, aged ≥18 y', '687 pre-intervention and 1009 post-intervention patients from 6564 assessed for eligibility'],
      keyExclusion: ['Non-English-speaking', 'Age <18 y']
    },
    intervention: '10 stroke units (clusters) randomised to nurse-initiated fever, hyperglycaemia and swallowing (FeSS) treatment protocols plus multidisciplinary team-building workshops to address implementation barriers; 558 post-intervention patients with 90-day mRS',
    comparator: '9 stroke units receiving only an abridged version of existing guidelines; 449 post-intervention patients with 90-day mRS',
    primaryEndpoint: {
      definition: 'Death or dependency (modified Rankin Scale ≥2) at 90 days, compared between pre- and post-intervention patient cohorts recruited at cluster-randomised stroke units; intention-to-treat',
      timepoint: '90 days',
      result: 'POSITIVE: intervention-unit patients were significantly less likely to be dead or dependent — 236/558 (42%) vs 259/449 (58%) — number needed to treat 6.4',
      effectSize: 'Adjusted absolute difference 15.7%; NNT 6.4',
      confidenceInterval: '95% CI 5.8 to 25.4 (adjusted absolute difference)',
      pValue: 'p=0.002'
    },
    secondaryEndpoints: [
      {
        name: 'SF-36 physical component summary at 90 d',
        result: '45.6 (SD 10.2) vs 42.5 (SD 10.5), p=0.002; adjusted absolute difference 3.4 (95% CI 1.2-5.5)'
      },
      {
        name: 'SF-36 mental component summary at 90 d',
        result: 'No difference: 49.5 (SD 10.9) vs 49.4 (SD 10.6), p=0.69'
      },
      {
        name: 'Functional dependency (Barthel Index ≥60) at 90 d',
        result: 'No difference: 487/532 (92%) vs 380/423 (90%), p=0.44'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — no thrombolytic or antithrombotic intervention was tested',
      mortality: 'No difference: 21/558 (4%) intervention vs 24/451 (5%) control, p=0.36',
      other: 'Protocol-driven care package; no excess adverse events reported in the primary publication'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The evidentiary anchor for the three cheapest lines on a stroke admission order set — swallow screen before anything by mouth, a fever protocol and a glucose protocol. Note carefully what QASC is and is not: units (clusters) were randomised, and outcomes were compared between pre- and post-intervention patient cohorts rather than between individually randomised patients, so this is implementation science, not a patient-level drug trial. Its effect size (NNT 6.4) is large partly because it measures the gap between what guidelines say and what wards actually do. It sits upstream of the individual bundle components: SHINE later showed that tight glucose control per se does not help, so QASC\'s benefit is best read as the whole package plus the act of enforcing it, not as proof that any single protocol carries the effect.',
    limitations: 'Cluster randomisation with pre/post cohorts, not patient-level randomisation; possible secular trends and differential cohort composition; loss of eligible patients was large (1696 of 6564 assessed); single Australian state; the mechanism of benefit cannot be attributed to any one protocol; unblinded clinicians though assessors, statistician and patients were masked.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-qasc-2011'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports enforcing a nurse-initiated fever/glucose/swallowing protocol on admission as a package rather than leaving each element to individual discretion.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'clots-3',
    shortName: 'CLOTS 3',
    fullName: 'Effectiveness of intermittent pneumatic compression in reduction of risk of deep vein thrombosis in patients who have had a stroke (CLOTS 3)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 2876,
      ageRange: 'median 76 y (IQR 67-84)',
      nihssRange: 'not reported; immobility used as the entry criterion instead of NIHSS',
      timeWindow: 'enrolled day 0 to day 3 of hospital admission',
      keyInclusion: ['Acute stroke with immobility, defined as unable to walk to the toilet without the help of another person', '94 centres in the UK', 'ISRCTN93529999'],
      keyExclusion: ['Patients able to mobilise independently to the toilet']
    },
    intervention: 'Intermittent pneumatic compression (IPC) sleeves in addition to usual care (n=1438)',
    comparator: 'No IPC, usual care alone (n=1438)',
    primaryEndpoint: {
      definition: 'Proximal deep vein thrombosis detected on protocol screening compression duplex ultrasound at 7-10 days (and where practical 25-30 days), or any imaging-confirmed symptomatic proximal DVT, within 30 days of randomisation',
      timepoint: '30 days',
      result: 'POSITIVE: proximal DVT in 122/1438 (8.5%) with IPC vs 174/1438 (12.1%) without — absolute risk reduction 3.6%',
      effectSize: 'ARR 3.6%; adjusted OR 0.65 in the 2512 patients analysed after excluding 323 who died before any primary outcome and 41 with no screening scan (122/1267 vs 174/1245)',
      confidenceInterval: '95% CI 1.4 to 5.8 for the ARR; 95% CI 0.51 to 0.84 for the adjusted OR',
      pValue: 'p=0.001 (adjusted OR)'
    },
    secondaryEndpoints: [
      {
        name: 'Death during the 30-day treatment period',
        result: '156/1438 (11%) IPC vs 189/1438 (13%) no IPC, p=0.057 — favours IPC but did NOT reach significance'
      },
      {
        name: 'Ultrasound screening burden',
        result: 'Primary outcome was largely screen-detected, not clinically apparent, DVT'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — mechanical prophylaxis, no anticoagulant tested',
      mortality: '30-day deaths 156 (11%) vs 189 (13%), p=0.057 — a non-significant difference favouring IPC',
      other: 'Skin breaks on the legs 44 (3%) with IPC vs 20 (1%) without, p=0.002; falls with injury 33 (2%) vs 24 (2%), p=0.221'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The positive half of the CLOTS pair and the reason a mechanical VTE line belongs on the stroke admission order set. Read it directly against CLOTS 1: the same investigators found graduated compression stockings useless, so the mechanical answer after stroke is IPC, not stockings. Two honest caveats for teaching: the endpoint is dominated by ultrasound-screen-detected proximal DVT rather than clinically apparent thromboembolism, and the mortality difference at 30 days did not reach statistical significance (p=0.057) even though it pointed the same way.',
    limitations: 'Open-label for patients and caregivers (ultrasound technician masked); primary endpoint is largely asymptomatic screen-detected DVT rather than a patient-important clinical event; 323 patients died before any primary outcome could be recorded, complicating the adjusted analysis; UK-only; device manufacturer among the funders.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-clots3-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports applying intermittent pneumatic compression from the day of admission in stroke patients who cannot walk to the toilet unaided, with daily skin inspection.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "clots-1",
    "shortName": "CLOTS 1",
    "fullName": "Effectiveness of thigh-length graduated compression stockings to reduce the risk of deep vein thrombosis after stroke (CLOTS trial 1)",
    "topic": "stroke-unit-care",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ich",
      "stroke-unit-care"
    ],
    "population": {
      "n": 2518,
      "ageRange": "adults; trial enrolled a broadly representative immobile stroke population",
      "nihssRange": "not reported; immobility used as the entry criterion",
      "timeWindow": "admitted to hospital within 1 week of acute stroke",
      "keyInclusion": [
        "Acute stroke, admitted within 1 week, immobile",
        "64 centres in the UK, Italy and Australia",
        "ISRCTN28163533"
      ],
      "keyExclusion": [
        "Mobile patients"
      ]
    },
    "intervention": "Routine care plus thigh-length graduated compression stockings (n=1256)",
    "comparator": "Routine care plus deliberate avoidance of graduated compression stockings (n=1262)",
    "primaryEndpoint": {
      "definition": "Proximal deep-vein thrombosis within 30 days, detected by scheduled ultrasound screening or symptomatic diagnosis",
      "timepoint": "Within 30 days; scheduled scans plus symptom-prompted imaging",
      "result": "DID NOT meet its aim — NULL: proximal DVT in 126/1256 (10.0%) with stockings vs 133/1262 (10.5%) without, a non-significant absolute risk reduction of 0.5%",
      "effectSize": "ARR 0.5% (non-significant)",
      "confidenceInterval": "95% CI −1.9% to 2.9%",
      "pValue": "Not significant (the 95% CI crosses zero)"
    },
    "secondaryEndpoints": [
      {
        "name": "Skin complications",
        "result": "HARM: skin breaks, ulcers, blisters and skin necrosis in 64/1256 (5%) with stockings vs 16/1262 (1%) without, OR 4.18 (95% CI 2.40-7.27)"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — mechanical device, no anticoagulant tested",
      "mortality": "Not reported as a primary safety endpoint in the primary publication abstract",
      "other": "Four-fold excess of skin breaks, ulcers, blisters and necrosis with stockings (OR 4.18, 95% CI 2.40-7.27)"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The essential counterweight in the VTE-prophylaxis section, and the reason the stroke-unit bundle cannot simply be borrowed from surgery. National stroke guidelines had recommended stockings by extrapolation from small trials in surgical patients; a stroke-specific trial of 2518 patients found no DVT benefit and a four-fold excess of skin injury. Teach it alongside CLOTS 3 by the same investigators: same question, same population, opposite answer — the mechanical device that works after stroke is IPC, not thigh-length stockings.",
    "limitations": "Open-label; primary endpoint is largely screen-detected asymptomatic DVT; thigh-length stockings only (below-knee stockings were tested separately in CLOTS 2); the trial cannot exclude a small effect, but the point estimate is essentially zero and the harm is real.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-clots1-2009"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Argues against ordering thigh-length graduated compression stockings for VTE prophylaxis after stroke, given no measured benefit and a four-fold excess of skin injury.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'prevail',
    shortName: 'PREVAIL',
    fullName: 'The efficacy and safety of enoxaparin versus unfractionated heparin for the prevention of venous thromboembolism after acute ischaemic stroke (PREVAIL Study)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'stroke-unit-care'],
    population: {
      n: 1762,
      ageRange: 'adults',
      nihssRange: 'stratified at randomisation: severe stroke NIHSS ≥14 vs less severe NIHSS <14',
      timeWindow: 'randomised within 48 h of symptom onset',
      keyInclusion: ['Acute ischaemic stroke', 'Unable to walk unassisted', 'NCT00077805'],
      keyExclusion: ['Patients able to walk unassisted']
    },
    intervention: 'Enoxaparin 40 mg subcutaneously once daily for 10 days (range 6-14; mean 10.5 days, SD 3.2); efficacy population n=666',
    comparator: 'Unfractionated heparin 5000 U subcutaneously every 12 h for the same duration; efficacy population n=669',
    primaryEndpoint: {
      definition: 'Composite of symptomatic OR asymptomatic (screen-detected) deep vein thrombosis, symptomatic pulmonary embolism, or fatal pulmonary embolism, in the efficacy population (received ≥1 dose and had VTE present or were assessed for it)',
      timepoint: 'During the ~10-day treatment period',
      result: 'POSITIVE for the composite: 68/666 (10%) with enoxaparin vs 121/669 (18%) with unfractionated heparin — a 43% relative reduction',
      effectSize: 'Relative risk 0.57; absolute difference −7.9%',
      confidenceInterval: '95% CI 0.44 to 0.76 (RR); 95% CI −11.6 to −4.2 (absolute difference)',
      pValue: 'p=0.0001'
    },
    secondaryEndpoints: [
      {
        name: 'Consistency by stroke severity',
        result: 'NIHSS ≥14: 26 (16%) vs 52 (30%), p=0.0036. NIHSS <14: 42 (8%) vs 69 (14%), p=0.0044'
      },
      {
        name: 'Any bleeding',
        result: 'No difference: 69 (8%) enoxaparin vs 71 (8%) unfractionated heparin, p=0.83'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage 4 (1%) with enoxaparin vs 6 (1%) with unfractionated heparin, p=0.55 — no signal of excess intracranial bleeding',
      mortality: 'All-cause mortality was a prespecified safety endpoint; no between-group difference was reported in the primary publication abstract',
      other: 'Major EXTRACRANIAL bleeding was significantly more common with enoxaparin: 7 (1%) vs 0 (p=0.015). The composite of symptomatic ICH plus major extracranial haemorrhage was 11 (1%) vs 6 (1%), p=0.23'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The trial behind choosing which pharmacological VTE prophylaxis goes on the stroke admission order set. Read the endpoint honestly before quoting the 43% figure: it is a composite dominated by asymptomatic, screening-ultrasound-detected DVT in an OPEN-LABEL trial, not by symptomatic pulmonary embolism or death, so the strength of the case for enoxaparin rests substantially on once-daily convenience and consistency across severity strata rather than on hard clinical outcomes. The small but statistically significant excess of major extracranial bleeding (7 events vs 0) is the counterweight, and it is the number most often dropped when this trial is summarised.',
    limitations: 'Open-label design with a partly asymptomatic screen-detected primary endpoint, which is the combination most vulnerable to ascertainment effects; efficacy analysed in 1335 of 1762 randomised patients rather than full ITT; excess major extracranial bleeding with enoxaparin; excludes patients able to walk unassisted, so it says nothing about ambulatory stroke patients; industry-relevant comparison of two dosing schedules as well as two drugs.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-prevail-2007'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Informs the choice between once-daily enoxaparin and twice-daily unfractionated heparin for VTE prophylaxis in non-ambulatory ischaemic stroke, with extracranial bleeding as the trade-off to weigh.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'food-tube-feeding',
    shortName: 'FOOD (Trials 2 and 3)',
    fullName: 'Effect of timing and method of enteral tube feeding for dysphagic stroke patients (FOOD): a multicentre randomised controlled trial',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 1180,
      ageRange: 'adults admitted with stroke and dysphagia',
      nihssRange: 'not reported; dysphagia requiring consideration of tube feeding was the entry criterion',
      timeWindow: 'Trial 2 enrolled within 7 days of admission; Trial 3 within 30 days of admission',
      keyInclusion: ['Dysphagic stroke patients in whom the responsible clinician was uncertain about timing (Trial 2) or route (Trial 3) of enteral feeding', 'Trial 2 (early vs avoid tube feeding): n=859 from 83 hospitals in 15 countries', 'Trial 3 (PEG vs nasogastric): n=321 from 47 hospitals in 11 countries'],
      keyExclusion: ['Patients for whom the clinician was certain of the correct feeding strategy (the uncertainty principle governed entry)']
    },
    intervention: 'Trial 2: early enteral tube feeding. Trial 3: percutaneous endoscopic gastrostomy (PEG) feeding',
    comparator: 'Trial 2: no tube feeding for more than 7 days (\'avoid\'). Trial 3: nasogastric tube feeding',
    primaryEndpoint: {
      definition: 'Death or poor outcome at 6 months, intention-to-treat, in each of the two parallel pragmatic randomised comparisons',
      timepoint: '6 months',
      result: 'BOTH comparisons DID NOT meet significance on the primary endpoint. Trial 2 (early vs avoid): absolute reduction in death of 5.8% (p=0.09, not significant) but a reduction in death or poor outcome of only 1.2% (p=0.7) — i.e. the primary endpoint was flat, with the direction of effect being fewer deaths and more dependent survivors. Trial 3 (PEG vs nasogastric): absolute INCREASE in risk of death of 1.0% (p=0.9) and an increased risk of death or poor outcome of 7.8% (p=0.05), i.e. borderline evidence of harm from starting with PEG',
      effectSize: 'Trial 2: −5.8% absolute risk of death; −1.2% absolute risk of death or poor outcome. Trial 3: +1.0% absolute risk of death; +7.8% absolute risk of death or poor outcome',
      confidenceInterval: 'Trial 2: 95% CI −0.8 to 12.5 (death); −4.2 to 6.6 (death or poor outcome). Trial 3: 95% CI −10.0 to 11.9 (death); 0.0 to 15.5 (death or poor outcome)',
      pValue: 'Trial 2: p=0.09 (death), p=0.7 (death or poor outcome). Trial 3: p=0.9 (death), p=0.05 (death or poor outcome)'
    },
    secondaryEndpoints: [
      {
        name: 'Direction of the early-feeding effect',
        result: 'The authors concluded early tube feeding might reduce case fatality but at the expense of increasing the proportion surviving with poor outcome — the survival and disability effects pull in opposite directions'
      },
      {
        name: 'Feeding route',
        result: 'The data do not support a policy of early initiation of PEG feeding in dysphagic stroke patients'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — nutritional intervention, no antithrombotic tested',
      mortality: 'Trial 2: absolute reduction in death of 5.8% (95% CI −0.8 to 12.5, p=0.09) with early feeding — not statistically significant. Trial 3: absolute increase in death of 1.0% (95% CI −10.0 to 11.9, p=0.9) with PEG',
      other: 'Procedure-specific complications of PEG placement are not quantified in the primary publication abstract'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The evidence behind two separate lines on the admission order set — when to start tube feeding, and by what route — and a rare example of a trial whose survival and disability effects diverge. Do not present FOOD Trial 2 as showing that early feeding \'works\': the primary endpoint of death or poor outcome was flat (1.2%, p=0.7), and the mortality signal (5.8%, p=0.09) was not statistically significant. What it does show is a direction of effect in which earlier feeding buys survival that is partly survival with dependency, which makes the moment the tube is ordered the right moment for a goals-of-care conversation. Trial 3 is the clearer practical message: starting with a PEG rather than a nasogastric tube was, if anything, worse on death-or-poor-outcome (+7.8%, p=0.05).',
    limitations: 'Pragmatic enrolment under the uncertainty principle, so the population is defined by clinician equipoise rather than fixed criteria and generalisability is hard to specify; both comparisons are underpowered for the modest differences observed; unblinded; recruitment spanned 1996-2003, predating modern stroke-unit dysphagia pathways; the composite of death or poor outcome can conceal opposing movements in its components, which is exactly what happened here.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-food-2005'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Frames tube-feeding decisions after stroke as a survival-versus-dependency trade-off and argues against starting with a PEG rather than a nasogastric tube in newly dysphagic patients.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'so2s',
    shortName: 'SO2S',
    fullName: 'Effect of Routine Low-Dose Oxygen Supplementation on Death and Disability in Adults With Acute Stroke: The Stroke Oxygen Study Randomized Clinical Trial',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 8003,
      ageRange: 'mean 72 y (SD 13); 4398 (55%) men',
      nihssRange: 'median NIHSS 5 — a predominantly mild stroke population',
      timeWindow: 'enrolled within 24 h of hospital admission',
      keyInclusion: ['Adults with acute stroke', 'No clear indication for, and no contraindication to, oxygen treatment', 'Mean baseline oxygen saturation 96.6% — i.e. non-hypoxic at entry', '136 centres in the United Kingdom; ISRCTN52416964'],
      keyExclusion: ['Clear clinical indication for oxygen', 'Contraindication to oxygen']
    },
    intervention: 'Prophylactic low-dose oxygen by nasal tubes, randomised 1:1:1 to continuous oxygen for 72 h (n=2668) or nocturnal oxygen 21:00-07:00 for 3 nights (n=2667); 3 L/min if baseline saturation ≤93%, 2 L/min if >93%',
    comparator: 'Control — oxygen only if clinically indicated (n=2668)',
    primaryEndpoint: {
      definition: '90-day modified Rankin Scale score (0-6), assessed by postal questionnaire with the participant aware and the assessor blinded, analysed by ordinal logistic regression (common OR >1.00 indicates improvement)',
      timepoint: '90 days',
      result: 'DID NOT meet — NULL: no benefit of prophylactic oxygen at any dose or schedule. Unadjusted OR for a better outcome 0.97 for oxygen vs control, and 1.03 for continuous vs nocturnal oxygen. No subgroup could be identified that benefited',
      effectSize: 'Unadjusted common OR 0.97 (oxygen vs control); 1.03 (continuous vs nocturnal)',
      confidenceInterval: '95% CI 0.89 to 1.05 (oxygen vs control); 95% CI 0.93 to 1.13 (continuous vs nocturnal)',
      pValue: 'P=.47 (oxygen vs control); P=.61 (continuous vs nocturnal)'
    },
    secondaryEndpoints: [
      {
        name: 'Subgroup analysis',
        result: 'No subgroup could be identified that benefited from oxygen'
      },
      {
        name: 'Primary outcome ascertainment',
        result: 'Available for 7677 of 8003 participants (96%)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — no thrombolytic or antithrombotic tested',
      mortality: 'Captured within the ordinal mRS (score 6); no separate mortality difference was reported in the primary publication abstract',
      other: 'At least 1 serious adverse event in 348 (13.0%) continuous-oxygen, 294 (11.0%) nocturnal-oxygen and 322 (12.1%) control participants; no significant harms identified'
    },
    imagingCriteria: '',
    applicabilityNotes: 'One of the largest neutral trials in acute stroke and the direct answer to the reflex \'put them on 2 litres\' order. In 8003 non-hypoxic patients (mean saturation 96.6%) neither continuous nor nocturnal low-dose oxygen changed 90-day disability, and no subgroup benefited. The trial does not address oxygen for measured hypoxaemia, which was an exclusion and remains standard care; it addresses prophylactic oxygen for the diagnosis of stroke. Pair it with HeadPoST and PASS as the three large negative trials that between them strip several habitual lines off a stroke admission order set.',
    limitations: 'Single-blind (participant aware, assessor blinded); enrolled a predominantly mild population (median NIHSS 5), so the result is least certain in severe stroke; low-dose protocol (2-3 L/min) does not test higher-flow or normobaric hyperoxia strategies; postal mRS ascertainment; UK-only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-so2s-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against routine prophylactic supplemental oxygen in non-hypoxic stroke patients; treat the measured desaturation, not the diagnosis.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "headpost",
    "shortName": "HeadPoST",
    "fullName": "Head Positioning in Acute Stroke Trial: cluster-randomized, crossover trial of head positioning in acute stroke",
    "topic": "stroke-unit-care",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ich",
      "stroke-unit-care"
    ],
    "population": {
      "n": 11093,
      "ageRange": "adults with acute stroke",
      "nihssRange": "Median NIHSS 4; 85% ischemic stroke",
      "timeWindow": "position initiated soon after hospital admission; median 14 h from symptom onset (IQR 5-35 h) and maintained for 24 h",
      "keyInclusion": [
        "Acute stroke (85% ischaemic) admitted to a participating hospital",
        "Hospitals in nine countries, cluster-randomised with crossover",
        "NCT02162017"
      ],
      "keyExclusion": [
        "Clear clinical indication or contraindication to either assigned position",
        "Unable to maintain the assigned position"
      ]
    },
    "intervention": "Lying flat — fully supine, back horizontal, face upwards — for 24 h, by hospital cluster assignment",
    "comparator": "Sitting up with the head elevated to at least 30 degrees for 24 h, by hospital cluster assignment",
    "primaryEndpoint": {
      "definition": "Degree of disability at 90 days on the modified Rankin Scale (0-6), analysed as an ordinal shift with a proportional-odds model",
      "timepoint": "90 days",
      "result": "DID NOT meet — NULL: no significant shift in the 90-day mRS distribution between lying flat and sitting up",
      "effectSize": "Unadjusted OR 1.01 for the lying-flat group",
      "confidenceInterval": "95% CI 0.92 to 1.10",
      "pValue": "P=0.84"
    },
    "secondaryEndpoints": [
      {
        "name": "Process measure: adherence to assigned position for 24 h",
        "result": "87% lying flat versus 95% sitting up; P<0.001"
      },
      {
        "name": "Pneumonia and other serious adverse events",
        "result": "No significant between-group differences in rates of serious adverse events, including pneumonia"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — positioning intervention only",
      "mortality": "90-day mortality 7.3% lying flat vs 7.4% sitting up, P=0.83",
      "other": "Pneumonia: 3.1% versus 3.4%; OR 0.86 (95% CI 0.68–1.08), P=.19. No significant difference does not establish equivalence in patients with specific positioning indications."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The tested 24-hour positions showed no average difference in 90-day disability in this predominantly mild-stroke population. Median initiation was 14 hours after onset. The result does not resolve earlier positioning, perfusion-dependent deficits, raised ICP or an individual aspiration indication.",
    "limitations": "Cluster crossover design; unblinded positioning; delayed initiation and different adherence may limit applicability. The ICH subgroup was small and patients were not selected for perfusion dependence. These features do not prove a particular direction of bias.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-headpost-2017"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Individualize positioning for the patient's clinical indication; this trial did not demonstrate an average 90-day disability benefit from routinely assigning either tested position.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Original main report and main tables compared; no separate supplement or complete subsequent positioning-evidence review. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'pass-preventive-antibiotics',
    shortName: 'PASS',
    fullName: 'The Preventive Antibiotics in Stroke Study (PASS): a pragmatic randomised open-label masked endpoint clinical trial',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 2550,
      ageRange: 'adults with acute stroke',
      nihssRange: 'not reported in the primary publication abstract',
      timeWindow: 'randomised within 24 h of symptom onset',
      keyInclusion: ['Adults with acute stroke', '30 academic and non-academic centres in the Netherlands', 'ISRCTN66140176'],
      keyExclusion: ['Not specified in the primary publication abstract']
    },
    intervention: 'Intravenous ceftriaxone 2 g every 24 h for 4 days in addition to stroke-unit care (n=1275 randomised; 1268 in the ITT analysis)',
    comparator: 'Standard stroke-unit care without preventive antimicrobial therapy (n=1275 randomised; 1270 in the ITT analysis)',
    primaryEndpoint: {
      definition: 'Functional outcome at 3 months on the modified Rankin Scale, analysed by ordinal regression, intention-to-treat, with masked endpoint assessment',
      timepoint: '3 months',
      result: 'DID NOT meet — NULL: preventive ceftriaxone did not affect the distribution of 90-day mRS scores',
      effectSize: 'Adjusted common odds ratio 0.95',
      confidenceInterval: '95% CI 0.82 to 1.09',
      pValue: 'p=0.46'
    },
    secondaryEndpoints: [
      {
        name: 'Follow-up completeness',
        result: '2514 of 2538 ITT patients (99%), 1257 in each group, completed 3-month follow-up'
      },
      {
        name: 'Infection rates, antimicrobial use, length of stay',
        result: 'Prespecified secondary outcomes; the primary publication abstract reports no benefit on functional outcome and no increase in adverse events'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — antimicrobial intervention only',
      mortality: 'Death was a prespecified secondary outcome; no mortality difference was reported in the primary publication abstract',
      other: 'Preventive ceftriaxone did not increase adverse events. Clostridium difficile overgrowth infection in 2 patients (<1%) in the ceftriaxone group and none in the control group'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The definitive answer to whether the stroke-unit bundle should include antibiotics for the risk of stroke-associated pneumonia rather than for a documented infection: in 2550 patients, four days of ceftriaxone changed nothing at 90 days. This matters most in the patient who has just failed a swallow screen, where the temptation to pre-treat is highest — and it is exactly there that PASS says to treat the documented infection instead. Read it alongside QASC: the swallow screen itself was part of a bundle that helped; prophylactic antibiotics on top of it were not.',
    limitations: 'Open-label (endpoint assessment masked), so clinician behaviour in the control arm could differ; single-country (Netherlands) with strong baseline stroke-unit care, which raises the bar for showing added benefit; one antibiotic at one dose and duration; unselected stroke population rather than one enriched for dysphagia or high pneumonia risk, so a benefit in a very high-risk subgroup is not formally excluded.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-pass-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against prophylactic antibiotics as part of the stroke admission bundle; antibiotics are for documented infection.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "shine-glucose",
    "shortName": "SHINE",
    "fullName": "Stroke Hyperglycemia Insulin Network Effort (SHINE): Intensive vs Standard Treatment of Hyperglycemia and Functional Outcome in Patients With Acute Ischemic Stroke",
    "topic": "stroke-unit-care",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "stroke-unit-care",
      "neurocritical-care"
    ],
    "population": {
      "n": 1151,
      "ageRange": "Mean 66 years (SD 13.1); 524 (46%) women",
      "nihssRange": "3–22; prestroke mRS 0 for NIHSS 3–7, or 0–1 for NIHSS 8–22",
      "timeWindow": "enrolled within 12 h of stroke onset; treatment for up to 72 h",
      "keyInclusion": [
        "Acute ischaemic stroke with hyperglycaemia — glucose >110 mg/dL if known diabetes, or ≥150 mg/dL if not",
        "923 (80%) had diabetes",
        "63 US sites, April 2012 to August 2018; NCT01369069"
      ],
      "keyExclusion": [
        "Type 1 diabetes, dialysis, or another indication for intravenous insulin"
      ]
    },
    "intervention": "Continuous intravenous insulin via a computerised decision-support tool, target glucose 80-130 mg/dL (4.4-7.2 mmol/L), for up to 72 h (n=581); achieved mean glucose 118 mg/dL",
    "comparator": "Subcutaneous sliding-scale insulin, target glucose 80-179 mg/dL (4.4-9.9 mmol/L), for up to 72 h (n=570); achieved mean glucose 179 mg/dL",
    "primaryEndpoint": {
      "definition": "Favorable 90-day mRS: 0 for baseline NIHSS 3–7; 0–1 for NIHSS 8–14; 0–2 for NIHSS 15–22",
      "timepoint": "90 days",
      "result": "DID NOT meet — NULL, and enrolment was STOPPED FOR FUTILITY at a prespecified interim analysis: favourable outcome in 119/581 (20.5%) with intensive control vs 123/570 (21.6%) with standard control",
      "effectSize": "Adjusted relative risk 0.97; unadjusted risk difference −0.83%",
      "confidenceInterval": "95% CI 0.87 to 1.08 (adjusted RR); 95% CI −5.72% to 4.06% (unadjusted risk difference)",
      "pValue": "P=.55"
    },
    "secondaryEndpoints": [
      {
        "name": "Prespecified secondary clinical outcomes",
        "result": "No significant differences in 90-day NIHSS, Barthel Index or Stroke Specific Quality of Life."
      },
      {
        "name": "Process measures",
        "result": "Mean glucose 118 versus 179 mg/dL; 1118/1151 completed follow-up."
      }
    ],
    "safetyFindings": {
      "sich": "Not reported as a separate endpoint in the primary publication abstract",
      "mortality": "54/581 (9.3%) versus 65/570 (11.4%); RR 0.82 (95% CI 0.58–1.15)",
      "other": "HARM with intensive control: treatment stopped early for hypoglycaemia or other adverse events in 65/581 (11.2%) intensive vs 18/570 (3.2%) standard. Severe hypoglycaemia occurred ONLY in the intensive group — 15/581 (2.6%); risk difference 2.58% (95% CI 1.29% to 3.87%)"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Intensive control did not improve the primary outcome and increased severe hypoglycemia (<40 mg/dL). SHINE cannot identify which component caused any benefit in the different QASC bundle.",
    "limitations": "Stopped for futility; predominantly type 2 diabetes. Delivery method and glucose target differed together. Participants received masking saline, but treating clinicians were unblinded; glucose-measurement frequency differed.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-shine-2019"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Does not support the tested intensive 80–130 mg/dL regimen. A neutral superiority result does not prove equivalent outcomes or define all other glucose targets.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Corrected original main report, Tables1–2 and November5,2019 correction compared. Demographic counts and endpoint definition corrected; no complete supplement clearance. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'avert-dose-response',
    shortName: 'AVERT dose-response',
    fullName: 'Prespecified dose-response analysis for A Very Early Rehabilitation Trial (AVERT)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care', 'rehabilitation'],
    population: {
      n: 2104,
      ageRange: 'aged ≥18 y',
      nihssRange: 'baseline stroke severity was a modelled covariate and a top CART splitting variable; range not stated in the abstract',
      timeWindow: 'admitted to a stroke unit within 24 h of stroke onset',
      keyInclusion: ['First or recurrent confirmed stroke', 'Admitted to a stroke unit within 24 h of onset', 'All 2104 AVERT participants analysed irrespective of assigned treatment group; 2083 (99.0%) followed to 3 months'],
      keyExclusion: ['Not specified in this secondary-analysis abstract']
    },
    intervention: 'Higher daily FREQUENCY of out-of-bed mobilisation sessions (modelled as a continuous exposure across both randomised arms)',
    comparator: 'Higher daily AMOUNT of mobilisation in minutes per day, and later time to first mobilisation (the competing dose dimensions, held constant in turn)',
    primaryEndpoint: {
      definition: 'Association between mobilisation dose components (timing, frequency, amount) and favourable 3-month outcome, using regression and Classification and Regression Trees, analysed IRRESPECTIVE of randomised group — a prespecified dose-response analysis, not a randomised dose comparison',
      timepoint: '3 months',
      result: 'The two dose dimensions pull in OPPOSITE directions: greater daily frequency of out-of-bed sessions improved the odds of a favourable outcome (OR 1.13), while greater amount of mobilisation in minutes per day REDUCED the odds of a good outcome (OR 0.94), each holding the other and time to first mobilisation constant',
      effectSize: 'Frequency OR 1.13 per additional daily session; amount OR 0.94 per extra 5 minutes of (physiotherapist-recorded) out-of-bed activity per day',
      confidenceInterval: '95% CI 1.09 to 1.18 (frequency); 95% CI 0.91 to 0.97 (amount)',
      pValue: 'p<0.001 for both'
    },
    secondaryEndpoints: [
      {
        name: 'Variable importance (CART)',
        result: 'Session frequency was the most important variable after the prognostic variables age and baseline stroke severity'
      },
      {
        name: 'Evidence grading',
        result: 'Graded by Neurology as Class III evidence — an association within a randomised cohort, not a randomised comparison of doses'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — rehabilitation dose analysis',
      mortality: 'Increasing daily session frequency was the only dose characteristic associated with lower odds of death (by approximately 20%); associations with nonfatal serious adverse events were less consistent',
      other: 'The consistent pattern of improved odds with higher session frequency was reported across efficacy AND safety outcomes'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The record that makes the mobilisation line on a stroke admission order set actionable rather than vague. AVERT itself found that very early, high-dose mobilisation reduced the odds of a favourable outcome; this prespecified dose-response analysis separates why, and it is the separation that teaches: shorter and more frequent is associated with better outcomes, longer sessions with worse. State the design limit every time this is quoted — the exposure was observed, not randomised, so confounding by indication is entirely plausible (the patients who tolerate long sessions differ from those who do not, and sicker patients may receive fewer, shorter sessions). Class III evidence supports writing \'out of bed short and often\' rather than \'out of bed as long as tolerated\', but it does not prove causation, and the randomised dose question was still open at the time of this review: the multi-arm adaptive AVERT DOSE trial (n=1000 mild or moderate ischaemic stroke; stopped early for funding reasons) had been reported only as an ESOC 2026 conference abstract, with full peer-reviewed results not yet published.',
    limitations: 'Observational dose-response across both randomised arms rather than a randomised comparison of mobilisation regimens; confounding by indication is the dominant threat, since dose was determined by clinicians responding to the patient in front of them; graded Class III; conducted within the AVERT population (stroke-unit admission within 24 h), so it does not speak to later rehabilitation dose; the units of the \'amount\' exposure are given in the full text as every extra 5 minutes of out-of-bed activity per day, recorded by physiotherapists only (nursing-assisted minutes were not captured, so total activity is underestimated).',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-avert-dose-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports framing early mobilisation orders around short, frequent out-of-bed sessions rather than total minutes, while flagging that the randomised dose question was not settled by this analysis.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "dido-gwtg-transfer-2023",
    "shortName": "GWTG-Stroke door-in-door-out",
    "fullName": "Door-in-Door-out Times for Interhospital Transfer of Patients With Stroke (Get With The Guidelines-Stroke registry analysis)",
    "topic": "systems-quality",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ich",
      "systems-quality"
    ],
    "population": {
      "n": 108913,
      "ageRange": "mean 66.7 y (SD 15.2); 50.6% male; 71.7% non-Hispanic White",
      "nihssRange": "full range; NIHSS >12 vs 0-1 was one of the strongest correlates of a shorter door-in-door-out time",
      "timeWindow": "emergency-department stay at the transferring hospital, January 2019 to December 2021",
      "keyInclusion": [
        "Ischaemic (n=67,235) or haemorrhagic (n=41,678) stroke",
        "Transferred from the emergency department of a Get With The Guidelines-Stroke affiliated hospital to another acute care hospital",
        "1925 transferring hospitals across the United States"
      ],
      "keyExclusion": [
        "Patients not transferred out of the presenting emergency department"
      ]
    },
    "intervention": "Observational exposure — patient-level and hospital-level characteristics of the transferring emergency department (no assigned treatment)",
    "comparator": "The guideline benchmark of a door-in-door-out time of no more than 120 minutes",
    "primaryEndpoint": {
      "definition": "Door-in-door-out time (time of transfer out minus time of arrival at the transferring emergency department), analysed both continuously and dichotomised at the guideline-recommended ≤120 minutes, using generalized estimating equation regression",
      "timepoint": "Index emergency-department encounter at the transferring hospital",
      "result": "Real-world practice falls well short of the benchmark: median door-in-door-out time 174 minutes (IQR 116-276), and only 29,741 of 108,913 patients (27.3%) were transferred within 120 minutes",
      "effectSize": "Median 174 min; 27.3% meeting the ≤120-minute recommendation",
      "confidenceInterval": "IQR 116-276 minutes",
      "pValue": "Descriptive primary outcome; associations reported with 95% CIs (below)"
    },
    "secondaryEndpoints": [
      {
        "name": "Factors associated with LONGER door-in-door-out time",
        "result": "Age ≥80 y vs 18-59 y +14.9 min (95% CI 12.3 to 17.5); female sex +5.2 min (95% CI 3.6 to 6.9); non-Hispanic Black vs non-Hispanic White +8.2 min (95% CI 5.7 to 10.8); Hispanic ethnicity vs non-Hispanic White +5.4 min (95% CI 1.8 to 9.0)"
      },
      {
        "name": "Factors associated with SHORTER door-in-door-out time",
        "result": "EMS prenotification versus private arrival −20.1 min (95% CI −22.1 to −18.1); NIHSS >12 vs 0-1 −66.7 min (95% CI −68.7 to −64.7); ischaemic stroke eligible for endovascular therapy vs haemorrhagic stroke −16.8 min (95% CI −21.0 to −12.7)"
      },
      {
        "name": "Endovascular-eligible subgroup",
        "result": "Among patients with acute ischaemic stroke eligible for endovascular therapy, female sex, Black race and Hispanic ethnicity were each associated with significantly LONGER door-in-door-out times, while EMS prenotification, intravenous thrombolysis and higher NIHSS were associated with shorter times"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — registry study of process times, not of a treatment",
      "mortality": "Not an outcome of this analysis; the study measured process time, not clinical outcome",
      "other": "The demographic disparities in transfer time are the principal adverse finding: age, sex, race and ethnicity were each independently associated with delay"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Historical 2019–2021 GWTG-Stroke transfer data. EMS prenotification was associated with about 20 minutes shorter door-in-door-out time compared with private arrival. The analysis cannot rank causal interventions or show that the NIHSS association proves triage works as intended.",
    "limitations": "Observational registry with organizational and patient confounding; participating hospitals do not establish a current national benchmark or prove that nonparticipating hospitals have a worse median. Variable timestamp accuracy and process outcomes without a demonstrated functional-outcome effect.",
    "certainty": "moderate",
    "evidenceType": "observational",
    "citationIds": [
      "cit-dido-gwtg-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Use as a historical workflow and equity audit benchmark. Test local bottlenecks; do not turn associations into causal or current nationwide predictions.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'target-stroke-phase-3-strategies',
    shortName: 'Target Stroke Phase III',
    fullName: 'Association of Component Strategies of the Target Stroke Phase 3 Nationwide Quality Improvement Program With Accelerated Door-to-Puncture and Door-In-Door-Out Times for Ischemic Stroke Endovascular Thrombectomy in the United States',
    topic: 'systems-quality',
    diseaseArea: ['acute-ischemic-stroke', 'systems-quality'],
    population: {
      n: 0,
      ageRange: 'median age 71-72 years across cohorts; the full text reports 37,373 direct-arriving EVT patients (450 centres), 28,665 transfer-in EVT patients (395 centres) and 12,703 transfer-out patients (1,107 centres) from 1,305 hospitals; the cohorts may overlap, so no single total n is asserted',
      nihssRange: 'not reported in the retrieved abstract',
      timeWindow: '1 January 2017 to 31 March 2022',
      keyInclusion: ['American Heart Association Get With The Guidelines-Stroke participating hospitals', 'Three analysed groups: patients arriving directly at a thrombectomy hospital and undergoing EVT; patients transferred in from a non-thrombectomy hospital and undergoing EVT; and patients at a non-thrombectomy hospital who were potentially EVT-eligible, received IV thrombolysis and were transferred out', 'Retrospective observational cohort evaluating the AHA\'s Target Stroke Phase III quality-improvement strategies'],
      keyExclusion: ['Hospitals not participating in Get With The Guidelines-Stroke']
    },
    intervention: 'Hospital-level adoption of individual Target Stroke Phase III quality-improvement strategies (prenotification-triggered neurointerventional team activation, CT plus CTA in all patients ≤24 h from last known well, stroke screening tools, camera use during telestroke)',
    comparator: 'Hospitals not using, or using less of, each strategy over the same period',
    primaryEndpoint: {
      definition: 'Door-to-puncture time at thrombectomy hospitals, modelled against adoption of each Target Stroke Phase III component strategy; door-in-door-out time analysed for transferring non-thrombectomy hospitals',
      timepoint: 'Index encounter, 2017-2022',
      result: 'Different strategies work at different points in the chain. In DIRECT-ARRIVING EVT patients, two strategies were independently associated with shorter door-to-puncture time: alerting the neurointerventional team on EMS prenotification (−21.9 minutes) and performing CT plus CTA in all patients presenting ≤24 h from last known well (−6.6 minutes). In TRANSFER-IN EVT patients, two different strategies helped: greater use of stroke screening tools (−3.5 minutes per 25% increase in use) and greater use of a camera during telestroke consultations (−5.8 minutes per 25% increase in camera use)',
      effectSize: '−21.9 min (prenotification-triggered NIR team alert); −6.6 min (CT+CTA in all ≤24 h); −3.5 min per 25% increase in screening-tool use; −5.8 min per 25% increase in telestroke camera use',
      confidenceInterval: '95% CI −42.5 to −1.3; −11.8 to −1.5; −6.4 to −0.6; −10.7 to −0.9 respectively',
      pValue: 'Statistical significance indicated by confidence intervals excluding zero; exact p values not reported in the abstract'
    },
    secondaryEndpoints: [
      {
        name: 'Strategy specificity by hospital type',
        result: 'The strategies associated with more timely care were distinctly DIFFERENT for thrombectomy versus non-thrombectomy hospitals, and different again for EMS arrivals versus interfacility transfers'
      },
      {
        name: 'Implication for quality programmes',
        result: 'A single national checklist applied uniformly is unlikely to be optimal; the effective component depends on where the hospital sits in the transfer network'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — quality-improvement process study, not a treatment comparison',
      mortality: 'Not an outcome of this analysis',
      other: 'No safety endpoints; the study measures workflow time intervals only'
    },
    imagingCriteria: 'Performing non-contrast CT plus CT angiography in ALL patients presenting within 24 h of last known well was one of the strategies tested, and was associated with a 6.6-minute shorter door-to-puncture time in direct-arriving EVT patients',
    applicabilityNotes: 'The companion to the door-in-door-out benchmark record: if that one says how far practice is from the target, this one says which specific changes have measurably moved the clock. The most useful teaching point is the asymmetry — the strategy that helps most at a thrombectomy centre (alert the neurointerventional team the moment EMS prenotifies, −21.9 minutes) is not the strategy associated with faster puncture for transfer-in patients at thrombectomy centres (greater use of stroke screening tools and of a camera during telestroke consultations, which the authors suggest may partly reflect better-resourced stroke systems), and neither matches the strategies associated with shorter door-in-door-out time at transferring hospitals (for example, the transferring hospital itself being a telestroke hub −14.5 minutes, automated neuroimaging software −7.7 minutes, vascular imaging in all patients ≤24 h from last known well −5.7 minutes). Treat the effect sizes with proportionate caution: the prenotification estimate has a very wide confidence interval (−42.5 to −1.3 minutes) and all of them are associations between hospital-level practice adoption and observed times, not the results of randomising hospitals to strategies.',
    limitations: 'Retrospective observational cohort with hospital-level exposures — hospitals that adopt more strategies plausibly differ in many unmeasured ways (staffing, volume, culture), so confounding by organisational capability is the central threat; the retrieved abstract does not report the cohort size, so no n is asserted in this record; wide confidence intervals on the largest effect estimate; restricted to Get With The Guidelines participants; study period overlaps the COVID-19 pandemic; process-time outcomes only, with no link to functional outcome.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-target-stroke-3-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Identifies which workflow changes are associated with faster reperfusion at each node of a transfer network — team activation on prenotification at the hub, screening-tool and telestroke-camera use for transfer-in patients, also at the hub; and at transferring hospitals, telestroke-hub status, automated imaging software, vascular imaging in all patients and faster thrombolysis for shorter door-in-door-out time.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "ai-lvo-detection-accuracy-meta",
    "shortName": "AI LVO-detection accuracy meta-analysis",
    "fullName": "Diagnostic Test Accuracy of Artificial Intelligence in Large Vessel Occlusion: A Systematic Review and Meta-Analysis",
    "topic": "systems-quality",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "systems-quality"
    ],
    "population": {
      "n": 10937,
      "ageRange": "not reported at the pooled level",
      "nihssRange": "not reported at the pooled level",
      "timeWindow": "acute stroke CT angiography at presentation",
      "keyInclusion": [
        "11 studies of 878 records screened, searching Scopus, PubMed and ScienceDirect to 2 February 2025",
        "Commercial AI LVO-detection tools including Viz-LVO, CINA-LVO, RAPID-CTA and JLK",
        "Studies reporting an overall confusion diagnostic matrix (primary analysis) or performance by occlusion site (secondary analysis)"
      ],
      "keyExclusion": [
        "Studies not reporting an extractable diagnostic matrix"
      ]
    },
    "intervention": "Automated AI detection of large vessel occlusion on CT angiography",
    "comparator": "Reference-standard adjudication of the CT angiogram by human readers",
    "primaryEndpoint": {
      "definition": "Pooled diagnostic sensitivity and specificity for AI detection of LVO on CTA",
      "timepoint": "Index CT angiogram",
      "result": "Sensitivity 0.87 and specificity 0.95. An absent AI flag cannot independently exclude LVO; performance and intended use vary by product and vessel territory.",
      "effectSize": "Sensitivity 0.87; specificity 0.95; PLR 9.55; NLR 0.14; AUC 0.87",
      "confidenceInterval": "95% CI: sensitivity 0.76–0.93; specificity 0.91–0.97; PLR 5.79–13.30; NLR 0.03–0.25; AUC 0.83–0.92",
      "pValue": "DOR scale and effect-versus-heterogeneity test labels are unresolved; disputed statistics omitted"
    },
    "secondaryEndpoints": [
      {
        "name": "Performance by occlusion site",
        "result": "Anterior circulation performance was generally acceptable — good for M1 and ICA-terminus (ICA-T) occlusions (the ICA-T pooled AUC was not robust in leave-one-out analysis), MODERATE for M2 occlusions. Performance was POOR for ICA Type I occlusions and for POSTERIOR circulation occlusions"
      },
      {
        "name": "Variation across studies",
        "result": "Software type, vendor and region varied. Ambiguously labeled DOR and heterogeneity-test numbers are omitted pending source clarification."
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — diagnostic accuracy study, no treatment",
      "mortality": "Not an outcome; no included study in this pooled analysis reported patient outcomes",
      "other": "The principal clinical hazard is a false-negative read: the authors conclude that negative cases flagged by AI require careful re-evaluation by imaging review and assessment of the patient's clinical profile"
    },
    "imagingCriteria": "CT angiography of the head and neck at presentation, read both by the AI tool and by the human reference standard",
    "applicabilityNotes": "The first record in this corpus to address AI triage software, which is now embedded in many transfer pathways yet had no evidence attached to it here. The number worth teaching is not the headline sensitivity but the asymmetry beneath it: a POSITIVE AI flag is genuinely informative (positive likelihood ratio 9.55), while a NEGATIVE AI read is less informative — pooled sensitivity was 0.87, so roughly 1 in 8 occlusions was missed; performance was only moderate for M2, and the single study that examined posterior-circulation and ICA type I occlusions (one product, CINA-LVO) found very poor detection. In transfer terms, that means these tools can reasonably accelerate a transfer that a human would have called anyway, but must never be used to stand down a transfer or to close out a clinically suspicious presentation. Posterior-circulation evidence is thin: only one included study (Mellander et al., retrospective, a single product, CINA-LVO) examined it, and sensitivity was 0.0 (95% CI 0.0-0.2), unchanged for basilar and P1 occlusions; posterior-circulation detection was outside that software's intended use, and no other product's posterior-circulation accuracy was assessed, so an absent AI flag must never be taken as excluding a basilar occlusion.",
    "limitations": "11 heterogeneous studies pooled across products and settings; diagnostic accuracy does not establish patient-outcome benefit. Predominantly retrospective studies are vulnerable to spectrum and publication bias. The source does not resolve the scale of its diagnostic odds ratio or the labels of several reported tests; those disputed statistics are withheld.",
    "certainty": "low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-ai-lvo-dta-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Frames AI LVO-detection output as a rule-in aid that can speed a transfer, never a rule-out that can cancel one — especially for posterior-circulation and M2 occlusions.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Supported diagnostic estimates retained; DOR scale and test-label discrepancies remain unresolved after full-main-text review (PMC13100493). Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'catis',
    shortName: 'CATIS',
    fullName: 'China Antihypertensive Trial in Acute Ischemic Stroke',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 4071,
      ageRange: 'adults (age range not stated in the primary report)',
      nihssRange: 'not reported in the primary report',
      timeWindow: '≤48 h from onset',
      keyInclusion: ['Nonthrombolysed acute ischemic stroke within 48 h of onset', 'Elevated systolic blood pressure', '26 hospitals across China, August 2009 - May 2013', 'NCT01840072'],
      keyExclusion: ['Treated with intravenous thrombolysis (cohort was nonthrombolysed by design)']
    },
    intervention: 'Antihypertensive treatment aimed at lowering SBP by 10% to 25% within the first 24 h after randomization, achieving BP <140/90 mm Hg within 7 days and maintaining that level during hospitalization (n=2038)',
    comparator: 'Discontinuation of all antihypertensive medications during hospitalization (n=2033)',
    primaryEndpoint: {
      definition: 'Combination of death and major disability (modified Rankin Scale score ≥3)',
      timepoint: '14 days or hospital discharge',
      result: 'NULL - the primary outcome DID NOT differ between groups: 683 events with antihypertensive treatment vs 681 events with control',
      effectSize: 'Odds ratio 1.00',
      confidenceInterval: '95% CI 0.88 to 1.14',
      pValue: 'P=.98'
    },
    secondaryEndpoints: [
      {
        name: 'Death and major disability at 3 months',
        result: 'No difference: 500 events vs 502 events; odds ratio 0.99 (95% CI 0.86 to 1.15), P=.93'
      },
      {
        name: 'Achieved blood-pressure separation',
        result: 'Mean SBP fell 166.7 to 144.7 mm Hg (-12.7%) with treatment vs 165.6 to 152.9 mm Hg (-7.2%) with control within 24 h; absolute difference -9.1 mm Hg (95% CI -10.2 to -8.1), P<.001. At day 7 mean SBP was 137.3 vs 146.5 mm Hg; difference -9.3 mm Hg (95% CI -10.1 to -8.4), P<.001'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'Reported only inside the composite of death and major disability, which did not differ between groups at 14 days/discharge or at 3 months',
      other: 'Adverse-event detail is not given in the primary report'
    },
    imagingCriteria: '',
    applicabilityNotes: 'CATIS is the anchor trial for the patient the ward asks about every day and who is not covered by either the post-EVT BP trials or the long-term prevention trials: the acute ischaemic stroke patient who did not receive reperfusion therapy. A genuine, sustained ~9 mm Hg separation in SBP over the first week produced identical function. Read it beside CATIS-2 (which tested timing rather than treat-vs-withhold), ENOS and COSSACS (which tested continuing vs stopping pre-stroke agents), and SCAST (which tested an ARB). All point the same way. Note the contrast with the post-EVT setting, where BP targets do have RCT support in one direction (do not lower intensively after successful reperfusion).',
    limitations: 'Single-blind, blinded-endpoint design; conducted entirely in China, so generalisability outside that population is untested. The control arm stopped all antihypertensives rather than continuing usual care, so the comparison is treat-versus-withhold, not one target versus another. The primary endpoint at 14 days or discharge is early for a functional outcome; the 3-month result was a secondary endpoint. Patients treated with thrombolysis were excluded.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-catis-2014'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that lowering BP in the first 24-48 h of non-thrombolysed ischaemic stroke is comorbidity management rather than a neuroprotective intervention - it changed neither death nor disability.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "catis-2",
    "shortName": "CATIS-2",
    "fullName": "China Antihypertensive Trial in Acute Ischaemic Stroke II - early versus delayed antihypertensive treatment in patients with acute ischaemic stroke",
    "topic": "bp-acute-ischemic",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-acute-ischemic"
    ],
    "population": {
      "n": 4810,
      "ageRange": "≥40 years",
      "nihssRange": "<21; 68% had NIHSS <5",
      "timeWindow": "enrolled 24-48 h after symptom onset",
      "keyInclusion": [
        "Acute ischaemic stroke within 24-48 h of symptom onset",
        "Elevated systolic blood pressure between 140 mm Hg and <220 mm Hg",
        "106 hospitals in China, 13 June 2018 - 10 July 2022",
        "NCT03479554"
      ],
      "keyExclusion": [
        "Received intravenous thrombolytic treatment",
        "IV thrombolysis or EVT",
        "Pre-stroke mRS ≥3, atrial fibrillation, affected/bilateral ≥70% artery stenosis, DBP ≥120, or acute indication for BP treatment"
      ]
    },
    "intervention": "Antihypertensive treatment immediately after randomisation, aimed at reducing SBP by 10%-20% within the first 24 h and a mean BP <140/90 mm Hg within seven days (n=2413)",
    "comparator": "Antihypertensive medications discontinued for seven days, then treatment started on day 8 aimed at mean BP <140/90 mm Hg (n=2397)",
    "primaryEndpoint": {
      "definition": "Combination of functional dependency or death (modified Rankin Scale score ≥3), intention-to-treat analysis",
      "timepoint": "90 days",
      "result": "Death or major disability: 289/2401 versus 250/2382 analyzed participants (12.0% versus 10.5%); randomized totals were 2413 and 2397.",
      "effectSize": "Odds ratio 1.18",
      "confidenceInterval": "95% CI 0.98 to 1.41",
      "pValue": "P=0.08"
    },
    "secondaryEndpoints": [
      {
        "name": "Achieved blood-pressure separation",
        "result": "Mean SBP fell 9.7% (162.9 to 146.4 mm Hg) in the early group and 4.9% (162.8 to 154.3 mm Hg) in the delayed group within 24 h (P<0.001 for group difference). Day-7 mean SBP was 139.1 vs 150.9 mm Hg (P<0.001), and 54.6% vs 22.4% of patients were below 140/90 mm Hg (P<0.001)"
      },
      {
        "name": "Recurrent stroke and adverse events",
        "result": "No significant differences between the two groups"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported in the primary report",
      "mortality": "17 (0.7%) versus 12 (0.5%), P=.36",
      "other": "No significant difference in reported adverse events between groups"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Selected nonreperfused patients randomized 24–48 hours after onset. The 95% CI 0.98–1.41 permits a small benefit through important harm from early treatment; it does not prove delay superior or establish noninferiority.",
    "limitations": "Open-label design (blinded outcome assessment); conducted entirely in China. Enrolment began 24-48 h after onset, so the trial says nothing about the first 24 h. Restricted to patients with SBP 140 to <220 mm Hg and to those who did not receive thrombolysis. The primary result was not statistically significant, so it is a null trial, not a demonstration that delay is superior.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-catis2-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "No significant primary benefit from the tested early BP strategy. This result does not address the first 24 hours, reperfusion-treated patients or urgent independent BP indications.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "enos",
    "shortName": "ENOS",
    "fullName": "Efficacy of Nitric Oxide, With or Without Continuing Antihypertensive Treatment, for Management of High Blood Pressure in Acute Stroke - a partial-factorial randomised controlled trial",
    "topic": "bp-acute-ischemic",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-acute-ischemic"
    ],
    "population": {
      "n": 4011,
      "ageRange": "Age ≥18 years",
      "nihssRange": "Motor deficit required; severity measured with Scandinavian Stroke Scale and estimated NIHSS, without a specified NIHSS eligibility range",
      "timeWindow": "within 48 h of stroke onset (median 26 h, IQR 16-37)",
      "keyInclusion": [
        "Acute ischaemic OR haemorrhagic stroke",
        "Raised systolic blood pressure 140-220 mm Hg",
        "Continue-versus-stop sub-randomisation restricted to the 2097 patients already taking antihypertensive drugs before their stroke",
        "ISRCTN99414122"
      ],
      "keyExclusion": [
        "Definite indication to start or stop BP drugs, including thrombolysis BP management",
        "Premorbid mRS 3–5, GCS <8, or important comorbidity"
      ]
    },
    "intervention": "Transdermal glyceryl trinitrate 5 mg per day for 7 days started within 48 h of onset (n=2000); in the partial-factorial sub-randomisation, continue pre-stroke antihypertensive drugs (n=1053)",
    "comparator": "No glyceryl trinitrate (n=2011); in the sub-randomisation, stop pre-stroke antihypertensive drugs (n=1044)",
    "primaryEndpoint": {
      "definition": "Function assessed with the modified Rankin Scale by observers masked to treatment assignment (ordinal analysis)",
      "timepoint": "90 days",
      "result": "NULL in BOTH comparisons - functional outcome DID NOT differ for glyceryl trinitrate versus none, nor for continuing versus stopping pre-stroke antihypertensives",
      "effectSize": "Adjusted common odds ratio for worse outcome 1.01 (glyceryl trinitrate vs none); 1.05 (continue vs stop antihypertensives)",
      "confidenceInterval": "95% CI 0.91 to 1.13 (glyceryl trinitrate); 0.90 to 1.22 (continue vs stop)",
      "pValue": "p=0.83 (glyceryl trinitrate); p=0.55 (continue vs stop)"
    },
    "secondaryEndpoints": [
      {
        "name": "Blood-pressure separation with glyceryl trinitrate",
        "result": "Day-1 BP was significantly lower with glyceryl trinitrate: difference -7.0 mm Hg systolic (95% CI -8.5 to -5.6) and -3.5 mm Hg diastolic (95% CI -4.4 to -2.6), both p<0.0001"
      },
      {
        "name": "Blood-pressure separation with continuing antihypertensives",
        "result": "Day-7 BP was lower in those who continued: difference -9.5 mm Hg systolic (95% CI -11.8 to -7.2) and -5.0 mm Hg diastolic (95% CI -6.4 to -3.7), both p<0.0001"
      },
      {
        "name": "Exploratory continuation signals",
        "result": "Some Barthel, disposition and cognitive outcomes were worse with continuation; multiple secondary comparisons do not establish definitive harm."
      }
    ],
    "safetyFindings": {
      "sich": "Day 7: 22 versus 18 (GTN/no GTN); 12 versus 11 (continue/stop). Comparisons must remain separate.",
      "mortality": "Day 90 deaths: 233/2000 versus 263/2011 (GTN/no GTN); 167/1053 versus 146/1044 (continue/stop). No significant difference established.",
      "other": "GTN increased clinical hypotension (53 versus 15) and headache (360 versus 170)."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "A neutral ordinal outcome does not establish identical function. This mixed-stroke drug-strategy trial is not a BP-target trial; enrollment excluded specific treatment indications. Acute stability, swallowing and enteral access constrain application.",
    "limitations": "Mixed stroke type (ischaemic and haemorrhagic) rather than ischaemic-only. The continue-versus-stop comparison was a sub-randomisation covering only the 2097 patients already on antihypertensives, and it was open-label. Enrolment ran from 2001 to 2013, so background care changed substantially over the trial. Median randomisation at 26 h means the very early window is under-represented.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-enos-2015"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "The trial did not support routine immediate continuation of prestroke antihypertensives in its selected population. It does not establish unrestricted equivalence of holding and restarting therapy.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Main report and tables compared. The report notes a February 13, 2015 correction; the separate correction history remains unresolved. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'cossacs',
    shortName: 'COSSACS',
    fullName: 'Continue or Stop Post-Stroke Antihypertensives Collaborative Study',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 763,
      ageRange: '>18 years',
      nihssRange: 'predominantly mild stroke (the investigators describe the cohort as acute mild stroke); NIHSS distribution not reported',
      timeWindow: 'enrolled within 48 h of stroke AND within 48 h of the last antihypertensive dose',
      keyInclusion: ['Patients already taking antihypertensive drugs at the time of stroke', '49 UK National Institute for Health Research Stroke Research Network centres', 'Recruited 1 January 2003 - 31 March 2009', 'ISRCTN89712435'],
      keyExclusion: []
    },
    intervention: 'Continue pre-existing antihypertensive drugs for 2 weeks (n=379)',
    comparator: 'Stop pre-existing antihypertensive drugs for 2 weeks (n=384)',
    primaryEndpoint: {
      definition: 'Death or dependency, with dependency defined as a modified Rankin Scale score greater than 3 points; intention-to-treat, blinded endpoint assessment',
      timepoint: '2 weeks',
      result: 'NULL - continuing antihypertensives DID NOT reduce death or dependency: 72/379 continue vs 82/384 stop',
      effectSize: 'Relative risk 0.86',
      confidenceInterval: '95% CI 0.65 to 1.14',
      pValue: 'p=0.3'
    },
    secondaryEndpoints: [
      {
        name: 'Blood-pressure separation at 2 weeks',
        result: '13 mm Hg systolic (95% CI 10 to 17) and 8 mm Hg diastolic (95% CI 6 to 10) lower in the continue group; p<0.0001 for the between-group difference'
      },
      {
        name: 'Serious adverse events, 6-month mortality and major cardiovascular events',
        result: 'No substantial differences between groups'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'No substantial difference in 6-month mortality between groups',
      other: 'The investigators note that the lower blood pressures achieved by continuing antihypertensive treatment after acute mild stroke were not associated with an increase in adverse events'
    },
    imagingCriteria: '',
    applicabilityNotes: 'COSSACS is the UK counterpart to the ENOS continue-versus-stop sub-randomisation, and the two agree. It is the weaker of the pair: it stopped early and is underpowered, so its neutral result is reassurance about safety rather than proof of equivalence. Its real teaching value is the pairing - a 13/8 mm Hg difference in achieved BP produced no detectable difference in death or dependency at 2 weeks, and no excess harm from the lower pressures.',
    limitations: 'Terminated early, which the investigators themselves cite as the reason the trial was underpowered - the 95% CI (0.65 to 1.14) is wide enough to include a clinically meaningful benefit or harm. Open-label with blinded endpoints. Primary endpoint at only 2 weeks. Predominantly mild stroke, so it does not speak to severe stroke or to patients requiring reperfusion therapy.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-cossacs-2010'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a safety argument to the continue-or-stop discussion: the lower pressures produced by continuing home antihypertensives after mild stroke were not associated with more adverse events, though the trial was too small to settle the efficacy question.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'scast',
    shortName: 'SCAST',
    fullName: 'Scandinavian Candesartan Acute Stroke Trial - the angiotensin-receptor blocker candesartan for treatment of acute stroke',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 2029,
      ageRange: 'older than 18 years',
      nihssRange: 'not reported in the primary report (Scandinavian Stroke Scale used as a secondary outcome)',
      timeWindow: 'within 30 h of symptom onset',
      keyInclusion: ['Acute stroke, ischaemic or haemorrhagic', 'Systolic blood pressure 140 mm Hg or higher', '146 centres in nine north European countries', 'NCT00120003 / ISRCTN13643354'],
      keyExclusion: []
    },
    intervention: 'Candesartan for 7 days, escalating from 4 mg on day 1 to 16 mg on days 3 to 7 (n=1017)',
    comparator: 'Matching placebo for 7 days (n=1012)',
    primaryEndpoint: {
      definition: 'Two co-primary effect variables, each requiring p≤0.025 for significance: (1) composite of vascular death, myocardial infarction or stroke during the first 6 months; (2) functional outcome at 6 months measured by the modified Rankin Scale. Intention-to-treat.',
      timepoint: '6 months',
      result: 'NEITHER co-primary favoured candesartan. The composite vascular endpoint did not differ (120 events candesartan vs 111 placebo). Functional outcome trended WORSE with candesartan, but the trend DID NOT clear the prespecified p≤0.025 threshold, so it is a signal rather than a demonstration of harm.',
      effectSize: 'Composite vascular endpoint adjusted hazard ratio 1.09; functional outcome adjusted common odds ratio 1.17 for poor outcome with candesartan',
      confidenceInterval: '95% CI 0.84 to 1.41 (composite); 95% CI 1.00 to 1.38 (functional outcome)',
      pValue: 'p=0.52 (composite); p=0.048 for functional outcome - not significant at the prespecified p≤0.025 level for two co-primaries'
    },
    secondaryEndpoints: [
      {
        name: 'Blood-pressure separation during the 7-day treatment period',
        result: 'Day-7 mean BP 147/82 mm Hg (SD 23/14) with candesartan vs 152/84 mm Hg (SD 22/14) with placebo; p<0.0001'
      },
      {
        name: 'All prespecified secondary endpoints and subgroups',
        result: 'Effects were similar across death from any cause, vascular death, ischaemic stroke, haemorrhagic stroke, myocardial infarction, stroke progression, symptomatic hypotension and renal failure, and across the Scandinavian Stroke Scale at 7 days and Barthel index at 6 months; no evidence of a differential effect in any prespecified subgroup'
      },
      {
        name: 'Follow-up completeness',
        result: '6-month status available for 2004 of 2029 patients (99%)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the primary report; haemorrhagic stroke was among the prespecified secondary endpoints and showed no differential effect',
      mortality: 'Death from any cause was a prespecified secondary endpoint with a similar effect to the primary analyses',
      other: 'Symptomatic hypotension in 9 (1%) candesartan vs 5 (<1%) placebo; renal failure reported in 18 (2%) vs 13 (1%)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'SCAST is the counterweight record for this category: the other trials here are null, and SCAST is the one that leans, gently, toward harm. It is also a lesson in reading a co-primary design. The functional-outcome p value of 0.048 looks significant on its own but was prespecified to require p≤0.025 because two co-primaries were being tested, so the correct reading is the investigators\' own - \'if anything, the evidence suggested a harmful effect\'. Do not render this as demonstrated harm, and do not soften it into a clean null either. The cohort is MIXED ischaemic and haemorrhagic stroke.',
    limitations: 'Two co-primary endpoints with a stricter significance threshold, which the functional-outcome result did not clear - the finding is a trend, not a demonstration. Mixed stroke type (ischaemic and haemorrhagic) rather than ischaemic-only. Tests one drug class (an angiotensin-receptor blocker) rather than a BP target, so the harm signal cannot be attributed to BP lowering per se. North European population; treatment limited to 7 days.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-scast-2011'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against reflexively starting an ARB for BP lowering within 30 h of acute stroke - the functional trend went the wrong way and symptomatic hypotension and renal failure were numerically more common.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'chase',
    shortName: 'CHASE',
    fullName: 'Controlling Hypertension After Severe Cerebrovascular Event - a randomized, multicenter, controlled study',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 500,
      ageRange: 'adults (age range not stated in the primary report)',
      nihssRange: 'acute SEVERE stroke; severity scale distribution not reported',
      timeWindow: 'acute phase of severe stroke',
      keyInclusion: ['Consecutive patients with acute severe stroke and elevated blood pressure', 'Mixed cohort: acute ischaemic stroke AND intracerebral haemorrhage', '26 Chinese hospitals', 'NCT02982655'],
      keyExclusion: []
    },
    intervention: 'Individualized blood-pressure lowering: a 10-15% reduction in systolic blood pressure from the admission level (n=242 of 483 analysed)',
    comparator: 'Standard blood-pressure lowering: target SBP <200 mm Hg in acute ischaemic stroke and <180 mm Hg in intracerebral haemorrhage (n=241 of 483 analysed)',
    primaryEndpoint: {
      definition: 'Proportion of patients with a poor functional outcome (described by the investigators as three-month death or dependence)',
      timepoint: 'day 90',
      result: 'NULL - individualized lowering DID NOT significantly reduce poor outcome: 71.1% vs 73.4%. The point estimate numerically favours individualization but the confidence interval is wide and includes both meaningful benefit and meaningful harm.',
      effectSize: 'Odds ratio 0.75',
      confidenceInterval: '95% CI 0.47 to 1.19',
      pValue: 'p=0.222'
    },
    secondaryEndpoints: [
      {
        name: 'Analysed population',
        result: '483 of the 500 recruited patients were included in the analysis'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'Counted inside the composite primary outcome of death or dependence; no separate mortality figure is given',
      other: 'Serious adverse events were similar: 27.7% individualized vs 28.2% standard'
    },
    imagingCriteria: '',
    applicabilityNotes: 'CHASE is the only trial in this set that enrolled specifically severe stroke, and it is also the weakest. Two features make it worth teaching anyway. First, it tested individualization (a percentage reduction from each patient\'s own admission BP) against a fixed permissive ceiling and could not separate them. Second, roughly 72% of patients in BOTH arms had a poor outcome at 90 days, which is a sobering prognostic anchor for severe stroke that no BP strategy moved. The cohort is MIXED ischaemic and intracerebral haemorrhage, so it is not a clean non-reperfused-ischaemic trial.',
    limitations: 'Small (483 analysed) and correspondingly imprecise - the 95% CI 0.47 to 1.19 does not exclude a clinically important effect in either direction. Mixed ischaemic and haemorrhagic cohort with different comparator targets by stroke type, which complicates interpretation. Single-country (China); the primary outcome definition is reported only summarily in the published abstract. This is a hypothesis-generating result, not a practice-defining one.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-chase-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Shows that in severe stroke an individualized 10-15% BP reduction did not clearly beat a permissive fixed ceiling, and that outcomes remained poor in about 72% of patients regardless of strategy.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'early-antihypertensive-ais-meta-2026',
    shortName: 'Early AHT in AIS meta-analysis',
    fullName: 'Early antihypertensive therapy in acute ischemic stroke: a meta-analysis of randomized controlled trials',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 15521,
      ageRange: 'adults enrolled in the component randomized trials',
      nihssRange: 'not reported at the meta-analysis level',
      timeWindow: 'antihypertensive therapy initiated within 48 h of symptom onset',
      keyInclusion: ['Seven randomized controlled trials, 15,521 patients with acute ischemic stroke', 'Early antihypertensive therapy defined as blood-pressure-lowering treatment initiated within 48 h of symptom onset', 'PubMed, Embase and Cochrane CENTRAL searched'],
      keyExclusion: ['The pooled population was NOT restricted at inclusion to patients who did not receive reperfusion therapy - the non-reperfusion framing appears only in the authors\' concluding sentence']
    },
    intervention: 'Early antihypertensive therapy started within 48 h of onset, pooled across seven randomized trials',
    comparator: 'Placebo or usual care',
    primaryEndpoint: {
      definition: 'Two primary outcomes: all-cause mortality, and death or functional dependency (modified Rankin Scale score ≥3). Random-effects pooling of risk ratios.',
      timepoint: 'as reported by the component trials',
      result: 'NULL on both primary outcomes - early antihypertensive therapy was NOT associated with a difference in all-cause mortality or in death/functional dependency',
      effectSize: 'All-cause mortality RR 0.97; death or functional dependency RR 1.01',
      confidenceInterval: '95% CI 0.71 to 1.31 (all-cause mortality); 95% CI 0.92 to 1.12 (death or functional dependency)',
      pValue: 'Not reported in the published abstract; both confidence intervals include 1'
    },
    secondaryEndpoints: [
      {
        name: 'Major vascular events',
        result: 'No significant difference: RR 0.89 (95% CI 0.63 to 1.26)'
      },
      {
        name: 'Recurrent stroke',
        result: 'No significant difference: RR 0.90 (95% CI 0.49 to 1.64)'
      },
      {
        name: 'Blood pressure at 24 h',
        result: 'Therapy did lower blood pressure: systolic mean difference -8.58 mm Hg (95% CI -9.87 to -7.30); diastolic mean difference -4.00 mm Hg (95% CI -4.45 to -3.54)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported at the meta-analysis level',
      mortality: 'All-cause mortality was a primary outcome and showed no association: RR 0.97 (95% CI 0.71 to 1.31)',
      other: 'Adverse events other than the listed vascular outcomes were not pooled in the published abstract'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the synthesis record for the whole non-reperfused acute-BP category: pooling 15,521 randomised patients, early antihypertensive therapy reliably drops SBP by about 9 mm Hg and reliably changes nothing about death, disability, major vascular events or recurrence. The published abstract does not name the seven component trials; it probably overlaps with the individual trials in this category (e.g., CATIS, CATIS-2, ENOS, SCAST; needs confirmation), so it should not be counted as independent evidence alongside them. One framing caution: the pooled population was not restricted to non-reperfused patients at inclusion - the authors\' conclusion applies that framing after the fact.',
    limitations: 'Aggregate-data meta-analysis, not individual participant data. Only seven trials, pooling heterogeneous interventions (drug-class trials, treat-versus-withhold trials and timing trials) under one \'early antihypertensive therapy\' label. The published abstract reports no heterogeneity statistics, no formal GRADE assessment, and no p values for the pooled estimates. Several component trials enrolled mixed ischaemic and haemorrhagic stroke. A null pooled estimate does not exclude benefit or harm in specific subgroups.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-early-antihypertensive-meta-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Provides the one-line summary for the category: early BP lowering in acute ischaemic stroke produces a real BP reduction and no measurable change in mortality, dependency or recurrence.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "bp-target",
    "shortName": "BP-TARGET",
    "fullName": "Safety and efficacy of intensive blood pressure lowering after successful endovascular therapy in acute ischaemic stroke (BP-TARGET)",
    "topic": "bp-post-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-post-evt"
    ],
    "population": {
      "n": 324,
      "ageRange": "adults ≥18 years",
      "nihssRange": "not reported in the primary report",
      "timeWindow": "target achieved within 1 h of randomisation and maintained for 24 h after reperfusion",
      "keyInclusion": [
        "Acute ischaemic stroke due to large-vessel occlusion successfully treated with endovascular therapy",
        "Systolic blood pressure above 130 mm Hg at the end of the procedure (per the authors' applicability statement)",
        "Four academic hospital centres in France, 21 June 2017 - 27 September 2019",
        "Randomisation stratified by centre and by intravenous thrombolysis use before endovascular therapy",
        "NCT03160677"
      ],
      "keyExclusion": []
    },
    "intervention": "Intensive systolic blood-pressure target 100-129 mm Hg for 24 h using intravenous BP-lowering treatment (n=162 randomised; 154 in the primary analysis)",
    "comparator": "Standard-care systolic blood-pressure target 130-185 mm Hg for 24 h (n=162 randomised; 157 in the primary analysis)",
    "primaryEndpoint": {
      "definition": "Rate of radiographic intraparenchymal haemorrhage on brain CT at 24-36 h after reperfusion - an IMAGING endpoint, not a functional one; intention-to-treat",
      "timepoint": "24-36 h",
      "result": "NULL - the intensive target DID NOT reduce radiographic intraparenchymal haemorrhage: 65/154 (42%) intensive vs 68/157 (43%) standard",
      "effectSize": "Adjusted odds ratio 0.96",
      "confidenceInterval": "95% CI 0.60 to 1.51",
      "pValue": "p=0.84"
    },
    "secondaryEndpoints": [
      {
        "name": "Achieved blood-pressure separation",
        "result": "Mean systolic BP during the first 24 h after reperfusion was 128 mm Hg (SD 11) intensive vs 138 mm Hg (SD 17) standard"
      },
      {
        "name": "Withdrawals",
        "result": "4 of 162 (2%) intensive and 2 of 162 (1%) standard were excluded for withdrawal of consent or legal reasons"
      }
    ],
    "safetyFindings": {
      "sich": "The primary outcome was RADIOGRAPHIC, not symptomatic, intraparenchymal haemorrhage: 42% intensive vs 43% standard",
      "mortality": "Death within the first week after randomisation: 11/158 (7%) intensive vs 7/160 (4%) standard",
      "other": "Hypotensive events (the primary safety outcome): 12/158 (8%) intensive vs 5/160 (3%) standard; the difference was not significant"
    },
    "imagingCriteria": "Successful reperfusion after endovascular therapy; the primary outcome was adjudicated on brain CT at 24-36 h",
    "applicabilityNotes": "After successful reperfusion, BP-TARGET compared SBP 100–129 with 130–185 mm Hg in patients with post-procedure SBP >130. Its primary endpoint was radiographic intraparenchymal hemorrhage, not function. Comparator targets differ across trials: OPTIMAL-BP and ENCHANTED2/MT used 140–180, whereas BEST-II used ≤180 with 40 participants per arm. These results do not establish targets for persistent mTICI 0–2a occlusion.",
    "limitations": "Modest size (324 randomised) and an imaging primary endpoint, so it is not powered for function. Open-label. Four French academic centres only. Applicable, per the authors, to patients with successful reperfusion and systolic blood pressure above 130 mm Hg at the end of the procedure - a null result on an imaging endpoint is not evidence that BP targets do not matter for outcome.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-bp-target-2021"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "The tested 100–129 mm Hg strategy did not significantly reduce the radiographic primary endpoint. This trial alone does not establish a functional benefit, a universal lower BP boundary or the effects of other reperfusion-specific targets.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "best-ii",
    "shortName": "BEST-II",
    "fullName": "Blood Pressure Management After Endovascular Therapy for Acute Ischemic Stroke: The BEST-II Randomized Clinical Trial",
    "topic": "bp-post-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-post-evt"
    ],
    "population": {
      "n": 120,
      "ageRange": "Age ≥18 years; mean 69.6 years (SD 14.5)",
      "nihssRange": "Baseline median NIHSS 16 / 18 / 14 in the <140 / <160 / ≤180 mm Hg groups",
      "timeWindow": "Randomization ≤45 min and target initiation ≤60 min after successful anterior-circulation reperfusion; maintained 24 h",
      "keyInclusion": [
        "Acute ischemic stroke after SUCCESSFUL endovascular therapy",
        "3 US comprehensive stroke centers, January 2020 - March 2022 (final follow-up June 2022)",
        "113 of 120 (94.2%) completed the trial",
        "NCT04116112"
      ],
      "keyExclusion": []
    },
    "intervention": "SBP targets <140 mm Hg or <160 mm Hg, with 40 participants assigned to each arm",
    "comparator": "SBP target ≤180 mm Hg; 40 participants assigned",
    "primaryEndpoint": {
      "definition": "Phase 2 FUTILITY design with prespecified multiple primary outcomes: follow-up infarct volume at 36 (±12) h and utility-weighted modified Rankin Scale score at 90 (±14) days. The harm-futility boundaries tested were a 10-mL increase in infarct volume (slope 0.5) or a 0.10 decrease in utility-weighted mRS (slope -0.005) per 20-mm Hg reduction in the SBP target (1-sided alpha = .05). An additional prespecified futility criterion was a less than 25% predicted probability of success for a future 2-group superiority trial (maximum sample size 1500, utility-weighted mRS).",
      "timepoint": "36 h (imaging) and 90 days (utility-weighted mRS)",
      "result": "DID NOT meet the prespecified futility criteria. Mean follow-up infarct volume was 32.4 mL for the <140 mm Hg group, 50.7 mL for the <160 mm Hg group and 46.4 mL for the ≤180 mm Hg group - the MOST intensive arm had the SMALLEST infarct volume. Mean utility-weighted mRS was 0.51 (<140), 0.47 (<160) and 0.58 (≤180). This is a low probability of benefit, NOT demonstrated harm.",
      "effectSize": "Adjusted slope per mm Hg decrease in the SBP target: -0.29 for follow-up infarct volume; -0.0019 for utility-weighted mRS",
      "confidenceInterval": "95% CI -0.81 to infinity (infarct-volume slope); 95% CI -infinity to 0.0017 (utility-weighted mRS slope). Infarct-volume 95% CIs by arm: 18.0-46.7 mL (<140), 33.7-67.7 mL (<160), 24.5-68.2 mL (≤180)",
      "pValue": "Futility P=.99 (infarct volume); futility P=.93 (utility-weighted mRS)"
    },
    "secondaryEndpoints": [
      {
        "name": "Predicted probability of success in a future 2-group superiority trial (maximum n=1500, utility-weighted mRS)",
        "result": "25% for the <140 mm Hg target and 14% for the <160 mm Hg target, each compared with the ≤180 mm Hg target"
      },
      {
        "name": "Utility-weighted mRS by arm with confidence intervals",
        "result": "0.51 (95% CI 0.38 to 0.63) for <140 mm Hg; 0.47 (95% CI 0.35 to 0.60) for <160 mm Hg; 0.58 (95% CI 0.46 to 0.71) for ≤180 mm Hg"
      },
      {
        "name": "Trial completion",
        "result": "113 of 120 randomized patients (94.2%) completed the trial"
      }
    ],
    "safetyFindings": {
      "sich": "Symptomatic hemorrhagic transformation: 2/37, 1/35 and 2/37 in the <140, <160 and ≤180 mm Hg groups, respectively",
      "mortality": "In-hospital mortality: 3/40, 6/40 and 3/40, respectively; no independently verified 90-day mortality comparison is asserted here",
      "other": "The protocol reduced or stopped antihypertensive treatment below the next lower target. Forty was the number assigned per arm, not a blood-pressure floor."
    },
    "imagingCriteria": "Successful recanalization after endovascular therapy; follow-up infarct volume measured at 36 (±12) h",
    "applicabilityNotes": "Phase 2 futility trial after successful anterior-circulation EVT. The prespecified test for unequivocal harm did not cross its boundary; this does not establish safety or clinical equivalence. Predicted probabilities of success for a future superiority trial were 25% for <140 and 14% for <160 versus ≤180 mm Hg. These are trial-design forecasts, not demonstrated patient benefit.",
    "limitations": "120 participants at three US centers; open treatment with blinded outcome assessment. The futility design explicitly tested a prespecified harm boundary using one-sided intervals. Limited precision and failure to cross that boundary do not exclude clinically important harm or benefit. No inference to persistent occlusion.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-best-ii-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "BEST-II tested <140, <160 and ≤180 mm Hg, with n=40 per arm. It did not establish a 140–160 mm Hg band or a low-pressure safety floor. Interpret alongside larger trials and current guidance, retaining their different reperfusion and population criteria.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "identify-post-evt-bp",
    "shortName": "IDENTIFY",
    "fullName": "Early intensive blood pressure management after endovascular treatment in ischaemic stroke (IDENTIFY): a multicentre, open-label, blinded-endpoint, randomised controlled trial",
    "topic": "bp-post-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bp-post-evt"
    ],
    "population": {
      "n": 383,
      "ageRange": "≥18 years",
      "nihssRange": "Baseline median NIHSS 15 (IQR 12–19), not an eligibility threshold",
      "timeWindow": "endovascular treatment within 6 h of onset; blood-pressure targets maintained until 24 h post-EVT",
      "keyInclusion": [
        "Acute ischaemic stroke due to large vessel occlusion in the anterior circulation",
        "Underwent endovascular treatment within 6 h AND achieved successful recanalisation",
        "63 stroke centres in China, 14 October 2022 - 18 March 2024",
        "ChiCTR2200057770",
        "SBP >130 mm Hg within six hours after EVT"
      ],
      "keyExclusion": [
        "Residual major intracranial or extracranial artery stenosis ≥70%"
      ]
    },
    "intervention": "Intensive management: systolic blood-pressure target <130 mm Hg maintained until 24 h after endovascular treatment (n=183)",
    "comparator": "Standard management: systolic blood-pressure target <180 mm Hg maintained until 24 h after endovascular treatment (n=200)",
    "primaryEndpoint": {
      "definition": "Unfavourable functional outcome, defined as a modified Rankin Scale score of 3-6, assessed by blinded endpoint adjudication",
      "timepoint": "90 days",
      "result": "NULL - intensive management to <130 mm Hg DID NOT improve outcomes: 130/183 (71.0%) intensive vs 135/200 (67.5%) standard",
      "effectSize": "Risk ratio 1.05",
      "confidenceInterval": "95% CI 0.92 to 1.20",
      "pValue": "p=0.45"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic intracerebral haemorrhage",
        "result": "No significant difference between groups"
      },
      {
        "name": "Malignant brain oedema",
        "result": "No significant difference between groups"
      },
      {
        "name": "All-cause death at 90 days",
        "result": "No significant difference between groups"
      }
    ],
    "safetyFindings": {
      "sich": "No significant difference in symptomatic intracerebral haemorrhage between the intensive and standard groups",
      "mortality": "No significant difference in all-cause death at 90 days",
      "other": "Hypotension: 104/181 (57.5%) versus 65/199 (32.7%); RR 1.76 (95% CI 1.39–2.23), P<.0001."
    },
    "imagingCriteria": "Anterior-circulation large-vessel occlusion treated by EVT within 6 h with successful recanalisation",
    "applicabilityNotes": "The primary mRS 3–6 endpoint was neutral. Hypotension was more frequent with intensive treatment. Exploratory adjusted severe disability (mRS 4–5, aRR 1.44) and death/severe disability (aRR 1.25) favored standard treatment; no multiplicity adjustment.",
    "limitations": "TERMINATED EARLY after a neutral interim analysis and the publication of counterpart randomised trials, so the final sample (383) is smaller than planned and the confidence interval correspondingly wide. Open-label with blinded endpoints. Conducted entirely in China. Restricted to the ≤6 h window and to anterior-circulation occlusions with successful recanalisation, so it does not speak to late-window EVT or to persistent occlusion.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-identify-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "No demonstrated primary benefit from the tested <130 target. The hypotension increase and exploratory disability signals preclude describing the strategy as established safe or functionally equivalent.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'optimal-bp-1-year',
    shortName: 'OPTIMAL-BP 1-year',
    fullName: 'Intensive Versus Conventional Blood Pressure Lowering After Successful Endovascular Thrombectomy: OPTIMAL-BP 1-Year Outcomes',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: {
      n: 306,
      ageRange: 'adults (age range not stated in the extension report; age was an adjustment covariate)',
      nihssRange: 'baseline NIHSS used as an adjustment covariate; distribution not reported in the extension',
      timeWindow: 'randomisation within 2 h after recanalization; BP targets applied for 24 h after enrolment; follow-up extended to 1 year',
      keyInclusion: ['Endovascular thrombectomy for acute ischemic stroke caused by large vessel occlusion', 'Achieved successful reperfusion of the occluded artery', 'Systolic blood pressure ≥140 mm Hg on 2 measurements obtained 2 minutes apart within 2 hours after recanalization', '19 centers throughout South Korea', '294 of 306 randomized patients (96.1%) completed the 1-year follow-up', 'NCT04205305'],
      keyExclusion: []
    },
    intervention: 'Intensive blood-pressure management, systolic target <140 mm Hg for 24 h after enrolment (parent-trial randomisation)',
    comparator: 'Conventional blood-pressure management, systolic target 140-180 mm Hg for 24 h after enrolment',
    primaryEndpoint: {
      definition: 'Two primary outcomes of the 1-year extension: modified Rankin Scale score 0 to 2 (functional independence) at 1 year, and all-cause mortality within 1 year. Adjusted odds ratios from multivariable logistic regression adjusting for age, sex, onset-to-randomization time and baseline NIHSS.',
      timepoint: '1 year',
      result: 'Functional independence at 1 year was NUMERICALLY LOWER with intensive management (40.5% vs 52.7%), but the INTENTION-TO-TREAT estimate did NOT cross conventional significance (P=0.051). Only the per-protocol analysis did (41.1% vs 54.7%, P=0.040). State this as persistence of the early signal, not as newly proven long-term harm, and never quote the per-protocol figure as if it were the intention-to-treat result.',
      effectSize: 'Intention-to-treat adjusted odds ratio 0.59; per-protocol adjusted odds ratio 0.56',
      confidenceInterval: '95% CI 0.34 to 1.00 (intention-to-treat); 95% CI 0.32 to 0.97 (per protocol)',
      pValue: 'P=0.051 (intention-to-treat); P=0.040 (per protocol)'
    },
    secondaryEndpoints: [
      {
        name: 'All-cause mortality within 1 year',
        result: 'Did not differ between groups'
      },
      {
        name: 'Distribution of modified Rankin Scale change from 3 months to 1 year',
        result: 'Did not differ between groups - the divergence was established by 3 months and did not widen afterwards'
      },
      {
        name: 'Follow-up completeness',
        result: '294 of 306 randomized patients (96.1%) completed 1-year follow-up'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the 1-year extension (see the parent OPTIMAL-BP report)',
      mortality: 'One-year all-cause mortality did not differ between the intensive and conventional groups',
      other: 'The mRS trajectory from 3 months to 1 year was similar in both arms'
    },
    imagingCriteria: 'Successful reperfusion of the occluded artery after endovascular thrombectomy',
    applicabilityNotes: 'This is the long-term follow-up of OPTIMAL-BP, not a second trial - it must never be counted as independent evidence alongside the parent record. Its contribution is durability: the functional gap opened by just 24 hours of intensive BP lowering was still visible a year later, and the mRS trajectory from 3 months to 1 year was flat in both arms, meaning the divergence happened early and then persisted rather than accumulating. The precision caveat is essential: the intention-to-treat adjusted OR was 0.59 (95% CI 0.34 to 1.00, P=0.051), which just misses conventional significance; only the per-protocol analysis crossed it. The comparator here is 140-180 mm Hg, which together with ENCHANTED2/MT is what makes 140-180 - not 140-160 - the range with trial support. Successful reperfusion was required, so none of this transfers to mTICI 0-2a.',
    limitations: 'Extension analysis of a completed trial rather than a new randomisation, so it inherits the parent trial\'s open-label design and its 19-centre South Korean population. The intention-to-treat primary estimate did not reach conventional significance (P=0.051) and the upper confidence bound touches 1.00; the per-protocol analysis is not an intention-to-treat result and is susceptible to post-randomisation selection. Adjusted rather than unadjusted estimates are reported for the primary comparison.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-optimal-bp-1y-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Shows the functional cost of 24 hours of intensive post-thrombectomy BP lowering is still measurable at one year, reinforcing existing recommendations against intensive lowering after successful reperfusion.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'cochrane-bp-reperfused-2026',
    shortName: 'Cochrane review: BP after reperfusion',
    fullName: 'Blood pressure management in reperfused ischemic stroke (Cochrane Database of Systematic Reviews)',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: {
      n: 4381,
      ageRange: 'adults enrolled in the included randomized trials',
      nihssRange: 'pooled as an outcome, not an inclusion criterion',
      timeWindow: 'blood-pressure management during and after reperfusion by systemic thrombolysis or endovascular thrombectomy',
      keyInclusion: ['Nine randomized controlled trials, 4381 participants, primarily from upper-middle and high-income countries', 'SEVEN studies in endovascular thrombectomy patients and TWO in systemic thrombolysis patients - this is not a pure post-EVT synthesis', 'Intensive arms: target <140 mm Hg in five studies, <120 mm Hg in two, <160 mm Hg in one, and one study with both <140 and <160 arms', 'Conventional arms: target <180 mm Hg in eight studies and <160 mm Hg in one', 'CENTRAL, MEDLINE, Embase and two trial registers searched to 20 March 2025; Cochrane RoB 2 and GRADE applied'],
      keyExclusion: []
    },
    intervention: 'Intensive systolic blood-pressure management, defined as any systolic target less than 160 mm Hg',
    comparator: 'Conventional systolic blood-pressure management, target less than 180 mm Hg (less than 160 mm Hg in one study)',
    primaryEndpoint: {
      definition: 'Critical outcomes were clinical function (assessed dichotomously on the modified Rankin Scale), quality of life, and neurologic adverse events (any intracranial haemorrhage and symptomatic intracranial haemorrhage), each graded with GRADE',
      timepoint: 'as reported by the component trials',
      result: 'Intensive management results in LITTLE TO NO clinically meaningful difference in clinical function (high-certainty evidence). The review protocol defines the dichotomous clinical-function outcome on the mRS (0 to 2 favourable, 3 to 6 poor), and the plain-language summary reports it as the chance of living independently at about 3 months; read that way, RR 0.89 (95% CI 0.80 to 0.98) means slightly fewer patients were functionally independent with intensive lowering, a difference the authors judged not clinically meaningful.',
      effectSize: 'Risk ratio 0.89 for clinical function (dichotomous mRS); I-squared 51%; 9 studies, 4272 participants; high-certainty evidence',
      confidenceInterval: '95% CI 0.80 to 0.98',
      pValue: 'Not reported in the published abstract'
    },
    secondaryEndpoints: [
      {
        name: 'All-cause mortality',
        result: 'Intensive management PROBABLY INCREASES all-cause mortality: RR 1.19 (95% CI 1.08 to 1.32); I-squared 0%; 9 studies, 4297 participants; moderate-certainty evidence'
      },
      {
        name: 'Any intracranial haemorrhage',
        result: 'Neither increased nor reduced: RR 0.99 (95% CI 0.87 to 1.14); I-squared 30%; 9 studies, 4304 participants; high-certainty evidence'
      },
      {
        name: 'Symptomatic intracranial haemorrhage',
        result: 'May result in little to no clinically meaningful difference: RR 1.03 (95% CI 0.77 to 1.36); I-squared 2%; 9 studies, 4304 participants; low-certainty evidence'
      },
      {
        name: 'Favorable neurologic status (dichotomous)',
        result: 'Probably reduced by intensive management: RR 0.71 (95% CI 0.51 to 1.01); I-squared 0%; 3 studies, 713 participants; moderate-certainty evidence'
      },
      {
        name: 'Quality of life',
        result: 'Likely little to no clinically meaningful difference: standardized mean difference -0.14 (95% CI -0.49 to 0.22); I-squared 75%; 3 studies, 3165 participants; moderate-certainty evidence'
      },
      {
        name: 'Clinical function (continuous)',
        result: 'Likely little to no clinically meaningful difference: mean difference 0.28 (95% CI -0.20 to 0.77); I-squared 30%; 4 studies, 787 participants; moderate-certainty evidence'
      },
      {
        name: 'Neurologic status (continuous, NIHSS)',
        result: 'Probably little to no clinically meaningful difference: mean difference 1.77 (95% CI 0.37 to 3.16); I-squared 10%; 6 studies, 1710 participants; moderate-certainty evidence'
      },
      {
        name: 'Hospital length of stay',
        result: 'Probably little to no clinically meaningful difference: mean difference 0.38 (95% CI -1.40 to 2.15); I-squared 33%; 5 studies, 3086 participants; moderate-certainty evidence'
      },
      {
        name: 'Other adverse events',
        result: 'May have little to no clinically meaningful effect: RR 1.21 (95% CI 0.86 to 1.72); I-squared 61%; 8 studies, 4012 participants; very low-certainty evidence'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage RR 1.03 (95% CI 0.77 to 1.36), low-certainty evidence; any intracranial haemorrhage RR 0.99 (95% CI 0.87 to 1.14), high-certainty evidence',
      mortality: 'Intensive systolic BP management probably INCREASES all-cause mortality: RR 1.19 (95% CI 1.08 to 1.32), moderate-certainty evidence - the single most important safety signal in this synthesis',
      other: 'Other adverse events RR 1.21 (95% CI 0.86 to 1.72), very low-certainty evidence. Certainty across all outcomes ranged from high to very low, downgraded mainly for risk of bias, imprecision and inconsistency.'
    },
    imagingCriteria: 'Reperfusion by systemic thrombolysis or endovascular thrombectomy in the component trials',
    applicabilityNotes: 'This is the GRADE-assessed synthesis for the post-reperfusion BP category and it is the record that should anchor the teaching. Two things must travel with it. First, the pool MIXES seven thrombectomy trials with two thrombolysis trials, so it is not a pure post-EVT synthesis and its estimates should not be quoted as if they were. Second, the mortality result is the headline a clinician needs: intensive lowering probably increases all-cause mortality (RR 1.19, 95% CI 1.08 to 1.32, moderate certainty) while producing no clinically meaningful functional gain. The review\'s own recommendation for future work - subgroup analyses by age, baseline BP and stroke severity, plus imaging and physiological markers for individualized targets - is exactly the gap that the absence of any trial in mTICI 0-2a patients leaves open. No randomised trial has enrolled patients with unsuccessful reperfusion, so no blood-pressure target is established for them.',
    limitations: 'Nine trials with substantial clinical heterogeneity: intensive targets ranged from <120 to <160 mm Hg and the conventional comparator was <160 mm Hg in one study rather than <180. Statistical heterogeneity was high for the functional outcome (I-squared 51%) and for quality of life (I-squared 75%). Two of the nine trials studied thrombolysis rather than thrombectomy. Certainty was lowest for symptomatic neurologic adverse events and other adverse events. Participants came primarily from upper-middle and high-income countries; the review explicitly calls for trials in low- and middle-income settings. The dichotomous mRS outcome is functional independence (favourable outcome prespecified as mRS 0-2 in the review protocol; described as \'living independently\' in the plain-language summary), so RR 0.89 (95% CI 0.80 to 0.98) indicates fewer independent patients with intensive lowering, although the authors judged the difference not clinically meaningful.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-cochrane-bp-reperfused-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the GRADE-graded bottom line for post-reperfusion BP: intensive systolic lowering below 160 mm Hg buys no clinically meaningful functional benefit and probably increases all-cause mortality.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "iris-ipd-meta-analysis",
    "shortName": "IRIS IPD meta-analysis",
    "fullName": "Value of intravenous thrombolysis in endovascular treatment for large-vessel anterior circulation stroke: individual participant data meta-analysis of six randomised trials (IRIS)",
    "topic": "bridging-ivt-before-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bridging-ivt-before-evt",
      "evt-early-window"
    ],
    "population": {
      "n": 2313,
      "ageRange": "adults; pooled from six randomised trials",
      "nihssRange": "large-vessel anterior-circulation occlusion",
      "timeWindow": "IVT-eligible time windows of the six contributing trials",
      "keyInclusion": [
        "Systematic review to 9 March 2023 plus individual participant data from all six eligible randomised trials of EVT alone vs IVT + EVT",
        "Patients presenting DIRECTLY at endovascular-treatment-capable centres",
        "1153 assigned EVT alone, 1160 assigned IVT plus EVT",
        "PROSPERO CRD42023411986"
      ],
      "keyExclusion": [
        "Patients transferred in (the contributing trials enrolled at EVT-capable centres only)",
        "Non-randomised studies"
      ]
    },
    "intervention": "Endovascular treatment alone (n=1153) — the strategy being tested for non-inferiority",
    "comparator": "Intravenous thrombolysis plus endovascular treatment (n=1160) — standard bridging care",
    "primaryEndpoint": {
      "definition": "90-day modified Rankin Scale score, ordinal shift; non-inferiority of EVT alone assessed against a prespecified lower 95% CI boundary of 0.82 for the adjusted common odds ratio (analogous to a 5% absolute difference in functional independence)",
      "timepoint": "90 d",
      "result": "DID NOT establish non-inferiority of EVT alone: median mRS 3 (IQR 1-5) with EVT alone vs 2 (IQR 1-4) with IVT plus EVT. The CI crosses both the 0.82 non-inferiority boundary and 1.00, so this is an INDETERMINATE result — it neither establishes non-inferiority of skipping the lytic nor demonstrates superiority of bridging.",
      "effectSize": "Adjusted common OR 0.89 for a shift toward improved outcome with EVT alone",
      "confidenceInterval": "95% CI 0.76 to 1.04 (prespecified non-inferiority boundary 0.82)",
      "pValue": "Adjusted one-sided noninferiority P=.14 (primary Table 2)"
    },
    "secondaryEndpoints": [
      {
        "name": "Any intracranial haemorrhage",
        "result": "LESS frequent with EVT alone: OR 0.82 (95% CI 0.68 to 0.99)"
      },
      {
        "name": "Symptomatic intracranial haemorrhage",
        "result": "No significant difference between strategies"
      },
      {
        "name": "Mortality",
        "result": "No significant difference between strategies"
      },
      {
        "name": "Between-study variability",
        "result": "Small; the variation that existed related mainly to the choice and dose of thrombolytic drug and to country of execution"
      }
    ],
    "safetyFindings": {
      "sich": "Symptomatic intracranial haemorrhage rates did not differ significantly between EVT alone and IVT plus EVT",
      "mortality": "Mortality did not differ significantly between strategies",
      "other": "Any intracranial haemorrhage occurred less frequently with EVT alone (OR 0.82, 95% CI 0.68-0.99) — the one signal that favoured omitting the lytic"
    },
    "imagingCriteria": "Per the six contributing parent trials; anterior-circulation large-vessel occlusion confirmed on vascular imaging",
    "applicabilityNotes": "This is the synthesis that resolves the DIRECT-MT / SKIP / DEVT / MR CLEAN-NO IV / SWIFT DIRECT / DIRECT-SAFE family, and it is routinely mis-stated. IRIS did NOT show bridging superior; it FAILED to show direct EVT non-inferior, and because the interval also crosses 1.00 it cannot be read as a positive trial for bridging either. That indeterminacy — not a victory for either arm — is why guidelines kept bridging as the default rather than declaring the question closed. It applies only to patients presenting DIRECTLY to an EVT-capable centre; drip-and-ship transfer is a different clinical question that these trials did not randomise. Read alongside the IRIS time-dependency analysis, which asks whether the answer changes with the clock, and alongside BRIDGE-TNK, the one trial in this family with a positive superiority result.",
    "limitations": "Six trials with heterogeneous lytic agents and doses (alteplase 0.9 mg/kg, alteplase 0.6 mg/kg, tenecteplase) and differing geography; risk of bias across included studies was low to moderate but not uniformly low; a non-inferiority framework cannot convert an indeterminate result into evidence of equivalence; funded in part by a device manufacturer (Stryker). Conversion of a common-OR margin to an absolute difference depends on the observed control distribution; 0.82 is not universally equivalent to a fixed five-percentage-point loss.",
    "certainty": "high",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-iris-ipd-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Teaches the difference between a negative trial and an inconclusive one: the pooled data cannot exclude a meaningful loss of benefit from skipping the lytic, which is why bridging remained the default for an IVT-eligible patient presenting directly to a thrombectomy centre.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'iris-time-dependency',
    shortName: 'IRIS time-dependency analysis',
    fullName: 'Time to Treatment With Intravenous Thrombolysis Before Thrombectomy and Functional Outcomes in Acute Ischemic Stroke: A Meta-Analysis',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 2313,
      ageRange: 'median 71 years (IQR 62-78); 44.3% female',
      nihssRange: 'anterior-circulation large-vessel occlusion (2313 of 2334 pooled participants)',
      timeWindow: 'median time from symptom onset to EXPECTED administration of IVT 2 h 28 min (IQR 1 h 46 min to 3 h 17 min)',
      keyInclusion: ['Individual participant data from the same 6 randomised trials of IVT plus thrombectomy vs thrombectomy alone', 'All participants eligible for both IVT and thrombectomy and presenting directly at thrombectomy-capable stroke centres', '190 sites in 15 countries; enrolment January 2017 to July 2021'],
      keyExclusion: ['Posterior-circulation occlusion (21 of 2334 pooled participants excluded to leave 2313)', 'Transferred patients — the pooled trials enrolled only direct presenters']
    },
    intervention: 'IV thrombolysis plus thrombectomy (n=1160)',
    comparator: 'Thrombectomy alone (n=1153)',
    primaryEndpoint: {
      definition: 'Whether the association between allocated treatment and 90-day disability (7-level mRS; stated minimal clinically important difference for mRS 0-2 rates 1.3%) VARIES with time from symptom onset to expected administration of IVT — i.e. a treatment-by-time interaction, not a between-arm comparison',
      timepoint: '90 d',
      result: 'Statistically significant interaction: the benefit of adding IVT falls as the interval from onset to expected IVT lengthens. Adjusted common OR for a 1-step mRS shift toward improvement 1.49 at 1 hour, 1.25 at 2 hours, 1.04 at 3 hours.',
      effectSize: 'Ratio of adjusted common OR per 1-hour delay 0.84',
      confidenceInterval: '95% CI 0.72 to 0.97 for the interaction; adjusted common OR 1.49 (95% CI 1.13-1.96) at 1 h, 1.25 (95% CI 1.04-1.49) at 2 h, 1.04 (95% CI 0.88-1.23) at 3 h',
      pValue: 'P=.02 for interaction'
    },
    secondaryEndpoints: [
      {
        name: 'Predicted absolute risk difference for mRS 0-2',
        result: '9% (95% CI 3% to 16%) at 1 hour; 5% (95% CI 1% to 9%) at 2 hours; 1% (95% CI -3% to 5%) at 3 hours'
      },
      {
        name: 'Point on the modelled curve at which benefit ceased to be statistically significant',
        result: 'After 2 hours 20 minutes from symptom onset to expected IVT administration'
      },
      {
        name: 'Point at which the point estimate crossed the null',
        result: '3 hours 14 minutes'
      }
    ],
    safetyFindings: {
      sich: 'Not the focus of this time-interaction analysis; safety comparisons are reported in the companion IRIS individual-participant-data meta-analysis',
      mortality: 'Not reported as a time-interaction outcome in this analysis',
      other: ''
    },
    imagingCriteria: 'Per the six contributing parent trials; anterior-circulation large-vessel occlusion required for inclusion in this analysis',
    applicabilityNotes: 'The \'2 hours 20 minutes\' figure is the single most frequently mis-quoted number in this domain, and it must be taught precisely. It is a MODELLED INFLECTION on a continuous time-benefit curve, not a randomisation threshold, not a prespecified subgroup cut point, and not a guideline cutoff — no society recommendation contains it. The clock is symptom onset to EXPECTED administration of IVT: not door-to-needle, not onset-to-groin, not last-known-well-to-arrival. And it applies only to mothership presentation at an EVT-capable centre, not to drip-and-ship transfer. Read as a continuous gradient — early large, late small — rather than a switch that flips at 140 minutes.',
    limitations: 'The time-effect is modelled from observed treatment times, not randomised — patients were not allocated to an interval, so residual confounding by everything that travels with a short onset-to-treatment time cannot be excluded. Heterogeneous lytic agents and doses across the six trials. A continuous curve reported at illustrative 1-, 2- and 3-hour points invites readers to reify a threshold the data do not contain.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-iris-time-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reframes the bridging debate as a clock question rather than a yes/no question: the added value of a lytic before thrombectomy is large very early and shrinks steadily with time from onset to expected IVT (predicted absolute gain in mRS 0-2 about 9% at 1 h, 5% at 2 h and 1% at 3 h; no longer statistically significant after about 2 h 20 min, with the point estimate crossing the null at 3 h 14 min) — a gradient, not a threshold.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "direct-mt",
    "shortName": "DIRECT-MT",
    "fullName": "Endovascular Thrombectomy with or without Intravenous Alteplase in Acute Stroke",
    "topic": "bridging-ivt-before-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "bridging-ivt-before-evt",
      "evt-early-window"
    ],
    "population": {
      "n": 656,
      "ageRange": "adults",
      "nihssRange": "acute ischaemic stroke from anterior-circulation large-vessel occlusion",
      "timeWindow": "alteplase administered within 4.5 h of symptom onset",
      "keyInclusion": [
        "Anterior-circulation large-vessel occlusion",
        "41 academic tertiary care centres in China",
        "656 enrolled of 1586 screened",
        "NCT03469206"
      ],
      "keyExclusion": [
        "Standard contraindications to intravenous alteplase"
      ]
    },
    "intervention": "Endovascular thrombectomy alone (n=327)",
    "comparator": "Intravenous alteplase 0.9 mg/kg within 4.5 h followed by endovascular thrombectomy (n=329)",
    "primaryEndpoint": {
      "definition": "Noninferiority for the 90-day ordinal mRS distribution: lower 95% CI boundary of adjusted common OR ≥0.80",
      "timepoint": "90 d",
      "result": "Met its prespecified common-OR 0.80 noninferiority margin. This permits a 20% reduction in cumulative outcome odds, not a fixed 20% risk difference or a 20% loss of benefit versus no treatment.",
      "effectSize": "Adjusted common OR 1.07",
      "confidenceInterval": "95% CI 0.81 to 1.40 (lower boundary above the 0.8 margin)",
      "pValue": "P=0.04 for non-inferiority"
    },
    "secondaryEndpoints": [
      {
        "name": "Successful reperfusion BEFORE thrombectomy",
        "result": "Lower without alteplase: 2.4% vs 7.0%"
      },
      {
        "name": "Overall successful reperfusion",
        "result": "Lower without alteplase: 79.4% vs 84.5%"
      },
      {
        "name": "90-day mortality",
        "result": "17.7% with thrombectomy alone vs 18.8% with combination therapy"
      }
    ],
    "safetyFindings": {
      "sich": "Symptomatic intracranial haemorrhage was among the assessed secondary/safety outcomes; the main-trial abstract does not report symptomatic intracranial haemorrhage; in an as-treated secondary analysis (n=591, Heidelberg criteria), sICH was 6.8% with alteplase plus thrombectomy vs 4.0% with thrombectomy alone (OR 1.90, 95% CI 0.90 to 3.99, P=0.095; not significant) and any ICH was similar (45.9% vs 40.1%, P=0.16), but parenchymal haematoma was more frequent with alteplase (17.8% vs 11.1%, P=0.024) (Hu et al., J Neurointerv Surg 2022; PMID 36270789)",
      "mortality": "90-day mortality 17.7% (thrombectomy alone) vs 18.8% (alteplase plus thrombectomy)",
      "other": "Successful reperfusion — both pre-thrombectomy and overall — was consistently lower when alteplase was omitted"
    },
    "imagingCriteria": "Anterior-circulation large-vessel occlusion on vascular imaging; no perfusion-mismatch selection required",
    "applicabilityNotes": "The prespecified noninferiority margin was a common odds ratio of 0.80 for a better ordinal mRS outcome. This is not a fixed 20% absolute-risk margin or proof that 80% of the benefit versus no treatment was retained. DIRECT-MT and DEVT met their own noninferiority criteria; margins and designs differed across six trials.",
    "limitations": "Open-label trial with a relatively permissive common-odds-ratio margin. The margin concerns cumulative outcome odds, not loss of treatment effect versus an untreated counterfactual. Individual-trial noninferiority does not establish universal equivalence of direct EVT and bridging.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-direct-mt-2020"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Interpret this trial alongside the full bridging evidence and current guidance. Avoid translating an OR 0.80 margin into a 20% loss of treatment benefit or calling DIRECT-MT the sole positive noninferiority trial.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'skip-trial',
    shortName: 'SKIP',
    fullName: 'Effect of Mechanical Thrombectomy Without vs With Intravenous Thrombolysis on Functional Outcome Among Patients With Acute Ischemic Stroke: The SKIP Randomized Clinical Trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 204,
      ageRange: 'median 74 years; 62.7% men',
      nihssRange: 'median NIHSS 18',
      timeWindow: 'IVT-eligible acute large-vessel occlusion; enrolment January 2017 to July 2019, final follow-up October 2019',
      keyInclusion: ['Acute ischaemic stroke due to large-vessel occlusion', '23 hospital networks in Japan', 'All 204 randomised patients completed the trial', 'UMIN000021488'],
      keyExclusion: ['Standard contraindications to intravenous alteplase']
    },
    intervention: 'Mechanical thrombectomy alone (n=101)',
    comparator: 'Intravenous alteplase at the Japanese dose of 0.6 mg/kg plus mechanical thrombectomy (n=103)',
    primaryEndpoint: {
      definition: 'Favourable outcome, mRS 0-2 at 90 days, tested for non-inferiority of thrombectomy alone against an odds-ratio margin of 0.74 using a 1-sided significance threshold of .025',
      timepoint: '90 d',
      result: 'DID NOT demonstrate non-inferiority: 60/101 (59.4%) with thrombectomy alone vs 59/103 (57.3%) with low-dose alteplase plus thrombectomy. The authors explicitly add that the wide confidence intervals also did NOT allow a conclusion of inferiority — an inconclusive trial, not a negative one.',
      effectSize: 'Difference 2.1%; OR 1.09',
      confidenceInterval: 'Difference 1-sided 97.5% CI -11.4% to infinity; OR 1-sided 97.5% CI 0.63 to infinity (margin OR 0.74)',
      pValue: 'P=.18 for non-inferiority'
    },
    secondaryEndpoints: [
      {
        name: '90-day mortality',
        result: '8/101 (7.9%) vs 9/103 (8.7%); difference -0.8% (95% CI -9.5% to 7.8%); OR 0.90 (95% CI 0.33 to 2.43); P>.99'
      },
      {
        name: 'Any intracerebral haemorrhage within 36 h',
        result: 'LESS frequent without alteplase: 34/101 (33.7%) vs 52/103 (50.5%); difference -16.8% (95% CI -32.1% to -1.6%); OR 0.50 (95% CI 0.28 to 0.88); P=.02'
      },
      {
        name: 'Overall secondary and safety endpoint pattern',
        result: 'Of 7 prespecified secondary efficacy and 4 safety endpoints, 10 showed no significant between-group difference'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral haemorrhage within 36 h 6/101 (5.9%) vs 8/103 (7.7%); difference -1.8% (95% CI -9.7% to 6.1%); OR 0.75 (95% CI 0.25 to 2.24); P=.78 — not significantly different',
      mortality: '90-day mortality 7.9% vs 8.7%, not significantly different',
      other: 'Any intracerebral haemorrhage was significantly less frequent when alteplase was omitted (33.7% vs 50.5%)'
    },
    imagingCriteria: 'Large-vessel occlusion confirmed on vascular imaging; no perfusion-mismatch selection required',
    applicabilityNotes: 'SKIP is the trial most often mis-filed as negative. It failed to demonstrate non-inferiority AND could not demonstrate inferiority — the confidence intervals were simply too wide at n=204. It also tested a comparator no Western unit uses: Japan\'s 0.6 mg/kg alteplase dose, so its result speaks specifically to LOW-DOSE bridging. The reduction in any intracerebral haemorrhage without alteplase mirrors the same signal in the IRIS pooled data.',
    limitations: 'Small (n=204) and consequently indeterminate in both directions, as the authors state; open-label; single-country; the 0.6 mg/kg alteplase comparator limits transferability to settings using 0.9 mg/kg; the non-inferiority margin was framed on the odds-ratio scale (0.74), which is difficult to translate to an absolute risk a patient can weigh.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-skip-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Illustrates that an underpowered non-inferiority trial answers nothing — SKIP excluded neither benefit nor harm from omitting the lytic, and its comparator was Japan\'s low-dose alteplase, not the 0.9 mg/kg used elsewhere.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'devt',
    shortName: 'DEVT',
    fullName: 'Effect of Endovascular Treatment Alone vs Intravenous Alteplase Plus Endovascular Treatment on Functional Independence in Patients With Acute Ischemic Stroke: The DEVT Randomized Clinical Trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 234,
      ageRange: 'mean 68 years; 102 women (43.6%)',
      nihssRange: 'proximal anterior-circulation intracranial occlusion',
      timeWindow: 'within 4.5 h of symptom onset and eligible for intravenous thrombolysis',
      keyInclusion: ['Age 18 years or older with proximal anterior-circulation intracranial occlusion', '33 stroke centres in China; enrolment 20 May 2018 to 2 May 2020, final follow-up 22 July 2020', 'All 234 randomised patients completed the trial', 'ChiCTR-IOR-17013568'],
      keyExclusion: ['Ineligible for intravenous thrombolysis']
    },
    intervention: 'Endovascular thrombectomy alone (n=116)',
    comparator: 'Intravenous alteplase followed by endovascular thrombectomy (n=118)',
    primaryEndpoint: {
      definition: 'Proportion achieving functional independence (mRS 0-2) at 90 days, tested for non-inferiority of EVT alone against a prespecified margin of -10%',
      timepoint: '90 d',
      result: 'MET the prespecified non-inferiority threshold: 63/116 (54.3%) with EVT alone vs 55/118 (46.6%) with combined treatment. The trial was STOPPED EARLY for efficacy after 234 of a planned 970 randomisations — 24% of the intended sample. The authors state the findings \'should be interpreted in the context of the clinical acceptability of the selected noninferiority threshold.\'',
      effectSize: 'Absolute difference 7.7% favouring EVT alone',
      confidenceInterval: '1-sided 97.5% CI -5.1% to infinity (non-inferiority margin -10%)',
      pValue: 'P=.003 for non-inferiority'
    },
    secondaryEndpoints: [
      {
        name: '90-day mortality',
        result: '17.2% vs 17.8%; difference -0.5% (95% CI -10.3% to 9.2%) — no significant difference'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral haemorrhage within 48 h 6.1% vs 6.8%; difference -0.8% (95% CI -7.1% to 5.6%) — no significant difference',
      mortality: '90-day mortality 17.2% (EVT alone) vs 17.8% (bridging)',
      other: 'No significant between-group differences were detected on the reported safety outcomes'
    },
    imagingCriteria: 'Proximal anterior-circulation intracranial occlusion on vascular imaging; no perfusion selection required',
    applicabilityNotes: 'A positive-looking non-inferiority result that is fragile by construction, and the fragility is the lesson. It stopped at roughly a quarter of its planned enrolment, and trials halted early for efficacy systematically overstate effect size; it used a -10% absolute margin; and it is single-country. The authors themselves attach the caveat about margin acceptability. Set against SWIFT DIRECT and DIRECT-SAFE, which used the same (DIRECT-SAFE, 10%) or a wider (SWIFT DIRECT, 12%) absolute margin in different populations and did NOT show non-inferiority, DEVT is the outlier rather than the confirmation.',
    limitations: 'Stopped early for efficacy at 234 of a planned 970 patients (24% of target), which inflates the apparent effect and widens true uncertainty beyond the reported interval; small absolute sample; single-country (China); open-label; -10% non-inferiority margin whose clinical acceptability the authors flag as an open question.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-devt-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A worked example of two appraisal traps at once — early stopping for efficacy and a permissive non-inferiority margin — in a trial whose headline reads as a green light to skip the lytic.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'mr-clean-no-iv',
    shortName: 'MR CLEAN-NO IV',
    fullName: 'A Randomized Trial of Intravenous Alteplase before Endovascular Treatment for Stroke',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 539,
      ageRange: 'adults',
      nihssRange: 'acute ischaemic stroke eligible for both intravenous alteplase and endovascular treatment',
      timeWindow: 'IVT-eligible window; patients presenting directly to an EVT-capable hospital',
      keyInclusion: ['Presented DIRECTLY to a hospital capable of providing endovascular treatment', 'Eligible for both intravenous alteplase and EVT', 'Open-label multicentre trial in Europe; 539 patients in the analysis', 'ISRCTN80619088'],
      keyExclusion: ['Not eligible for intravenous alteplase', 'Presented via transfer rather than directly']
    },
    intervention: 'Endovascular treatment alone',
    comparator: 'Intravenous alteplase followed by endovascular treatment (standard of care)',
    primaryEndpoint: {
      definition: '90-day mRS; the trial tested BOTH superiority of EVT alone and non-inferiority against a margin of 0.8 for the lower boundary of the 95% CI of the odds ratio',
      timepoint: '90 d',
      result: 'DID NOT show either: median mRS 3 (IQR 2-5) with EVT alone vs 2 (IQR 2-5) with alteplase plus EVT. EVT alone was neither superior nor non-inferior — an indeterminate result on both prespecified questions.',
      effectSize: 'Adjusted common OR 0.84',
      confidenceInterval: '95% CI 0.62 to 1.15 (non-inferiority margin 0.8 for the lower bound)',
      pValue: 'P=0.28'
    },
    secondaryEndpoints: [
      {
        name: 'Death from any cause',
        result: '20.5% with EVT alone vs 15.8% with alteplase plus EVT; adjusted OR 1.39 (95% CI 0.84 to 2.30) — numerically higher without the lytic but not statistically significant'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral haemorrhage 5.9% with EVT alone vs 5.3% with alteplase plus EVT; adjusted OR 1.30 (95% CI 0.60 to 2.81) — similar in the two groups',
      mortality: '20.5% vs 15.8%; adjusted OR 1.39 (95% CI 0.84 to 2.30)',
      other: 'The incidence of symptomatic intracerebral haemorrhage was similar in the two groups'
    },
    imagingCriteria: 'Large-vessel occlusion on vascular imaging in patients eligible for both treatments; no perfusion-mismatch selection required',
    applicabilityNotes: 'The clearest example in the family of a trial that answers neither question it asked. It excluded neither benefit nor harm from dropping alteplase, and the mortality point estimate ran numerically against the direct-EVT strategy (20.5% vs 15.8%) without reaching significance. An inconclusive trial is not a negative trial, and this is the record to open when someone cites MR CLEAN-NO IV as evidence that the lytic can be skipped. Applies to direct presentation at an EVT-capable hospital in a European system, not to transfers.',
    limitations: 'Open-label; the 95% CI spans a clinically meaningful loss of benefit AND a clinically meaningful gain, so no conclusion is licensed in either direction; the non-significant excess mortality with EVT alone is imprecise and hypothesis-generating rather than a demonstrated harm; single-region (Europe).',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-mrclean-no-iv-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that an inconclusive trial is not a licence to change practice — MR CLEAN-NO IV left the door open in both directions, which is precisely why bridging remained standard.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'swift-direct',
    shortName: 'SWIFT DIRECT',
    fullName: 'Thrombectomy alone versus intravenous alteplase plus thrombectomy in patients with stroke: an open-label, blinded-outcome, randomised non-inferiority trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 408,
      ageRange: 'adults',
      nihssRange: 'stroke due to large-vessel occlusion confirmed on CT or MR angiography',
      timeWindow: 'IVT-eligible patients admitted to endovascular centres',
      keyInclusion: ['Large-vessel occlusion confirmed with CT or magnetic resonance angiography', 'Admitted to endovascular centres in Europe and Canada', '5215 screened, 423 randomised, 408 in the primary efficacy analysis (201 thrombectomy alone, 207 alteplase plus thrombectomy)', 'Enrolment 29 November 2017 to 7 May 2021; NCT03192332'],
      keyExclusion: ['Not eligible for intravenous alteplase']
    },
    intervention: 'Stent-retriever thrombectomy alone with a commercially available Solitaire device as first line (n=201 analysed)',
    comparator: 'Intravenous alteplase 0.9 mg/kg (max 90 mg, 10% bolus then 60-min infusion) as early as possible after randomisation, plus stent-retriever thrombectomy (n=207 analysed)',
    primaryEndpoint: {
      definition: 'mRS 0-2 at 90 days; non-inferiority of thrombectomy alone assessed with the one-sided lower 95% confidence limit of the Mantel-Haenszel risk difference against a prespecified margin of 12%',
      timepoint: '90 d',
      result: 'DID NOT show non-inferiority: 114/201 (57%) with thrombectomy alone vs 135/207 (65%) with alteplase plus thrombectomy. The lower limit of the one-sided 95% CI was -15.1%, crossing the -12% margin.',
      effectSize: 'Adjusted risk difference -7.3%',
      confidenceInterval: '95% CI -16.6 to 2.1; lower limit of the one-sided 95% CI -15.1% (margin -12%)',
      pValue: 'Non-inferiority not met by the prespecified CI criterion'
    },
    secondaryEndpoints: [
      {
        name: 'Successful reperfusion',
        result: 'LESS common with thrombectomy alone: 182/201 (91%) vs 199/207 (96%); risk difference -5.1% (95% CI -10.2 to 0.0), p=0.047'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage 5/201 (2%) with thrombectomy alone vs 7/202 (3%) with alteplase plus thrombectomy; risk difference -1.0% (95% CI -4.8 to 2.7)',
      mortality: 'Not reported in the abstract',
      other: 'Reperfusion was measurably worse when alteplase was omitted (91% vs 96%, p=0.047) — a mechanistic explanation for the functional shortfall'
    },
    imagingCriteria: 'Large-vessel occlusion confirmed on CT or MR angiography; no perfusion-mismatch selection required',
    applicabilityNotes: 'The strongest European/Canadian evidence against omitting the lytic in an eligible patient already at an endovascular centre. It used a 12% absolute margin — not tighter than the DIRECT-MT common-OR margin of 0.8 but wider on the absolute scale (the IRIS collaboration equated a common-OR margin of 0.82 with about a 5% absolute difference in functional independence) — and still failed it, with an 8-percentage-point absolute shortfall in functional independence and a demonstrable reperfusion cost. The authors state plainly that the results do not support omitting alteplase before thrombectomy in eligible patients. Note the funding: Medtronic and University Hospital Bern, with a device-specific first-line protocol.',
    limitations: 'Open-label with blinded outcome assessment only; 5215 screened to randomise 423, so the enrolled population is highly selected; protocol mandated a specific stent retriever as first line, which constrains transferability to other technique; the trial is powered for non-inferiority and does not formally establish superiority of bridging.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-swift-direct-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In an IVT-eligible patient already at a thrombectomy centre, omitting alteplase was not shown to be non-inferior and cost reperfusion — a concrete reason the bridging default survived.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'direct-safe',
    shortName: 'DIRECT-SAFE',
    fullName: 'Endovascular thrombectomy versus standard bridging thrombolytic with endovascular thrombectomy within 4.5 h of stroke onset: an open-label, blinded-endpoint, randomised non-inferiority trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window', 'evt-basilar'],
    population: {
      n: 295,
      ageRange: 'adults',
      nihssRange: 'large-vessel occlusion of the intracranial internal carotid artery, MCA (M1 or M2), or basilar artery, confirmed on non-contrast CT plus vascular imaging',
      timeWindow: 'presented within 4.5 h of stroke onset',
      keyInclusion: ['Adults with stroke and large-vessel occlusion in the intracranial ICA, MCA M1/M2, or basilar artery', '25 acute-care hospitals in Australia, New Zealand, China and Vietnam', 'Randomised 1:1 stratified by occlusion site and geographic region; enrolment 2 June 2018 to 8 July 2021', 'NCT03494920'],
      keyExclusion: ['Presenting beyond 4.5 h of stroke onset']
    },
    intervention: 'Direct endovascular thrombectomy, Trevo device as first-line intervention (n=148 randomised, 146 analysed)',
    comparator: 'Bridging therapy — intravenous thrombolytic, alteplase OR tenecteplase per each site\'s standard care, before thrombectomy (n=147)',
    primaryEndpoint: {
      definition: 'Functional independence, defined as mRS 0-2 OR return to baseline at 90 days, with a non-inferiority margin of -0.1, analysed by intention to treat and per protocol',
      timepoint: '90 d',
      result: 'DID NOT show non-inferiority of direct thrombectomy: 80/146 (55%) direct vs 89/147 (61%) bridging. The authors conclude the study should inform guidelines to recommend bridging therapy as standard treatment.',
      effectSize: 'ITT risk difference -0.051; per-protocol risk difference -0.062',
      confidenceInterval: 'ITT two-sided 95% CI -0.160 to 0.059; per-protocol two-sided 95% CI -0.173 to 0.049 (margin -0.1)',
      pValue: 'Non-inferiority not met by the prespecified CI criterion'
    },
    secondaryEndpoints: [
      {
        name: 'Death',
        result: '22/146 (15%) direct vs 24/147 (16%) bridging; adjusted OR 0.92 (95% CI 0.46 to 1.84)'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral haemorrhage 2/146 (1%) direct vs 1/147 (1%) bridging; adjusted OR 1.70 (95% CI 0.22 to 13.04) — three events in total, an interval too wide to inform anything',
      mortality: '15% vs 16%; adjusted OR 0.92 (95% CI 0.46 to 1.84)',
      other: 'Safety outcomes were similar between groups'
    },
    imagingCriteria: 'Non-contrast CT plus vascular imaging confirming intracranial ICA, MCA M1/M2 or basilar occlusion; no perfusion-mismatch selection required',
    applicabilityNotes: 'A geographically distinct replication of SWIFT DIRECT\'s verdict across Australia, New Zealand, China and Vietnam, and the only trial in the family to include BASILAR occlusion. Its bridging arm deliberately used whichever lytic the site normally gave — alteplase or tenecteplase — so it tests the bridging STRATEGY rather than a specific drug, which is both its external-validity strength and a source of heterogeneity. Together with SWIFT DIRECT it is why the guideline default did not move.',
    limitations: 'Open-label with blinded endpoint; modest size (n=295) with correspondingly wide intervals; the bridging arm mixed alteplase and tenecteplase at site discretion; only three symptomatic haemorrhages occurred in total, so the safety comparison is uninformative; a specific thrombectomy device was mandated first line.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-direct-safe-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A second, geographically independent trial reaching the same verdict — within 4.5 h, bridging remains the default for the IVT-eligible patient, including basilar occlusion.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'tnk-plus',
    shortName: 'TNK-PLUS',
    fullName: 'Intravenous Tenecteplase Prior to Endovascular Treatment for Ischemic Stroke at 4.5 to 24 Hours: The TNK-PLUS Randomized Clinical Trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-late-window'],
    population: {
      n: 391,
      ageRange: 'median 68 years (IQR 59-75); 155 (39.6%) female',
      nihssRange: 'MCA-M1 or proximal M2 occlusion',
      timeWindow: '4.5 to 24 h after last known to be well',
      keyInclusion: ['Adults 18 years or older with acute ischaemic stroke due to MCA-M1 or proximal M2 occlusion', 'Salvageable tissue on CT perfusion or MR perfusion-diffusion: ischaemic core <70 mL, mismatch ratio ≥1.8, mismatch volume ≥15 mL', '40 centres in China; enrolment 25 January 2024 to 21 July 2025, final follow-up 14 October 2025', 'NCT06221371'],
      keyExclusion: ['Outside the prespecified perfusion-mismatch profile', 'Occlusion other than MCA-M1 or proximal M2']
    },
    intervention: 'Intravenous tenecteplase 0.25 mg/kg (maximum 25 mg) before endovascular treatment (n=199)',
    comparator: 'Endovascular treatment alone (n=192)',
    primaryEndpoint: {
      definition: 'Functional independence, mRS 0-2 at 90 days — a SUPERIORITY design, not non-inferiority',
      timepoint: '90 d',
      result: 'DID NOT meet superiority — a null result: 88/199 (44.2%) with tenecteplase before EVT vs 83/192 (43.2%) with EVT alone. Bridging tenecteplase did not improve clinical outcomes in the 4.5-24 h window.',
      effectSize: 'Adjusted relative rate 1.01; risk difference 0.99%',
      confidenceInterval: '95% CI 0.83 to 1.24 for the adjusted relative rate; risk difference 95% CI -8.84% to 10.83%',
      pValue: 'P=.89'
    },
    secondaryEndpoints: [
      {
        name: '90-day mortality',
        result: '25/197 (12.7%) with bridging tenecteplase vs 27/190 (14.2%) with EVT alone'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage within 36 h 10/197 (5.1%) with bridging tenecteplase vs 5/190 (2.6%) with EVT alone — numerically higher on 10 versus 5 events, an imprecise difference reported descriptively rather than as a tested comparison',
      mortality: '90-day mortality 12.7% vs 14.2%',
      other: 'All 391 enrolled patients completed the trial'
    },
    imagingCriteria: 'CT perfusion or MR perfusion-diffusion mismatch required: ischaemic core <70 mL, mismatch ratio ≥1.8, mismatch volume ≥15 mL',
    applicabilityNotes: 'This is the trial that puts a time boundary on the bridging question, and it is the direct counterweight to BRIDGE-TNK. BRIDGE-TNK enrolled ONLY patients within 4.5 h and found bridging tenecteplase superior there; TNK-PLUS enrolled 4.5-24 h in a perfusion-selected proximal-MCA population and found nothing. The early-window result must not be extrapolated across that boundary.',
    limitations: 'Single-country (China) and open-label with blinded endpoint; n=391, so the confidence interval still admits a modest effect in either direction; the perfusion-mismatch entry criteria select a favourable-physiology subgroup and exclude much of the late-window population seen in practice; the numerically higher symptomatic haemorrhage rate rests on 10 versus 5 events and was not a prespecified tested comparison.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-tnk-plus-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Sets the boundary on the positive early-window bridging result: beyond 4.5 h, adding tenecteplase before thrombectomy did not improve 90-day independence in a perfusion-selected proximal MCA population.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 're-align',
    shortName: 'RE-ALIGN',
    fullName: 'Dabigatran versus Warfarin in Patients with Mechanical Heart Valves (RE-ALIGN)',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 252,
      ageRange: 'adults; age distribution not reported in the abstract',
      nihssRange: 'not applicable - anticoagulation trial, no index stroke required for entry',
      timeWindow: 'two strata: mechanical valve replacement within the past 7 days, and replacement at least 3 months earlier',
      keyInclusion: ['Mechanical aortic- or mitral-valve replacement', 'Stratum A: valve replaced within the past 7 days', 'Stratum B: valve replaced at least 3 months earlier'],
      keyExclusion: []
    },
    intervention: 'Dabigatran, starting dose 150, 220 or 300 mg twice daily chosen by kidney function and then adjusted to a trough plasma level of at least 50 ng/mL; randomization was 2:1 in favour of dabigatran, and 162 patients were in the as-treated dabigatran analysis',
    comparator: 'Warfarin, INR target 2-3 or 2.5-3.5 according to thromboembolic risk (roughly one third of the 252 enrolled; per-arm randomized n not given in the abstract)',
    primaryEndpoint: {
      definition: 'Trough plasma dabigatran level - this was a phase 2 DOSE-VALIDATION study, so the primary endpoint was pharmacokinetic, not clinical; there was no powered efficacy comparison and no non-inferiority margin',
      timepoint: 'during treatment; the trial was terminated prematurely',
      result: 'STOPPED EARLY for harm after 252 patients, because of an excess of BOTH thromboembolic and bleeding events on dabigatran. Ischemic or unspecified stroke occurred in 9 dabigatran patients (5%) and in 0 warfarin patients; major bleeding in 7 (4%) vs 2 (2%). Dose adjustment or discontinuation of dabigatran was required in 52 of 162 patients (32%) to reach the trough target',
      effectSize: 'Ischemic or unspecified stroke 9 (5%) with dabigatran vs 0 with warfarin; major bleeding 7 (4%) vs 2 (2%)',
      confidenceInterval: 'Not reported - the trial was stopped before any confirmatory efficacy comparison',
      pValue: 'Not reported; the trial ended on a safety decision rather than a hypothesis test'
    },
    secondaryEndpoints: [
      {
        name: 'Ischemic or unspecified stroke',
        result: '9 patients (5%) on dabigatran vs 0 patients on warfarin'
      },
      {
        name: 'Major bleeding',
        result: '7 patients (4%) on dabigatran vs 2 patients (2%) on warfarin; ALL major bleeding events were pericardial'
      },
      {
        name: 'Dabigatran dose adjustment or discontinuation',
        result: 'Required in 52 of 162 as-treated patients (32%) to reach the trough target of at least 50 ng/mL'
      }
    ],
    safetyFindings: {
      sich: 'Not separately reported; the strokes were classified as ischemic or unspecified',
      mortality: 'Not reported in the abstract',
      other: 'All major bleeding events were pericardial. The trial was terminated prematurely because both thrombotic and bleeding events accumulated on dabigatran'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The foundational negative trial for direct oral anticoagulants in mechanical heart valves, and, with PROACT Xa, one of the two trials the 2023 ACC/AHA/ACCP/HRS atrial fibrillation guideline cites in keeping vitamin K antagonists as the anticoagulants of choice for mechanical heart valves. Note what it does and does not test: dabigatran is a direct thrombin inhibitor, and the trial included patients within 7 days of valve surgery, which is where the pericardial bleeding clustered. RE-ALIGN included both an early (≤7 days) and a late (≥3 months) post-operative stratum; the factor Xa question was left open until PROACT Xa (apixaban, On-X aortic valves implanted ≥3 months earlier) answered it the same way a decade later. RE-ALIGN and PROACT Xa should be read as a pair: two different drug classes, two different timing strata, one conclusion. This is also the corpus\'s only mechanical-valve anticoagulation trial other than PROACT Xa; INVICTUS covers rheumatic valvular AF, which is a different population.',
    limitations: 'Phase 2 dose-validation design with a pharmacokinetic primary endpoint, only 252 patients, terminated early for harm, and neither per-arm randomized numbers nor exclusion criteria are given in the abstract. Because all major bleeds were pericardial and one stratum was within 7 days of surgery, part of the bleeding signal reflects the early post-operative setting rather than the drug alone. Event numbers are small, so the magnitude of harm is imprecise even though the direction is not.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-re-align-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches why a direct thrombin inhibitor is not an option for a mechanical heart valve: dabigatran produced more strokes and more bleeding than warfarin and the trial was halted for harm.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'proact-xa',
    shortName: 'PROACT Xa',
    fullName: 'Apixaban or Warfarin in Patients with an On-X Mechanical Aortic Valve (PROACT Xa)',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 863,
      ageRange: 'adults; age distribution not reported in the abstract',
      nihssRange: 'not applicable - anticoagulation trial, no index stroke required for entry',
      timeWindow: 'On-X aortic valve implanted at least 3 months before enrollment',
      keyInclusion: ['On-X mechanical AORTIC valve implanted at least 3 months before enrollment', '94% of participants also took aspirin'],
      keyExclusion: []
    },
    intervention: 'Apixaban 5 mg twice daily (part of the 863 randomized; per-arm n not reported in the abstract)',
    comparator: 'Warfarin, target INR 2.0-3.0 (part of the 863 randomized; per-arm n not reported in the abstract)',
    primaryEndpoint: {
      definition: 'Composite of valve thrombosis or valve-related thromboembolism, with CO-PRIMARY analyses testing (a) NON-INFERIORITY of apixaban to warfarin and (b) the apixaban event rate against a prespecified objective performance criterion (OPC). The numeric non-inferiority margin is not stated in the abstract',
      timepoint: 'on-treatment follow-up; the trial was stopped early',
      result: 'DID NOT meet non-inferiority and DID NOT meet the OPC success criterion. The trial was STOPPED EARLY after 863 participants because of an excess of thromboembolic events on apixaban. 26 primary events occurred: 20 events in 16 apixaban participants (4.2%/patient-year) vs 6 events in 6 warfarin participants (1.3%/patient-year)',
      effectSize: 'Difference in primary event rates 2.9 per 100 patient-years (apixaban minus warfarin)',
      confidenceInterval: '95% CI 0.8 to 5.0 for the difference; apixaban 4.2%/patient-year (95% CI 2.3-6.0) vs warfarin 1.3%/patient-year (95% CI 0.3-2.3)',
      pValue: 'Not reported in the abstract; neither the non-inferiority nor the OPC success criterion was met'
    },
    secondaryEndpoints: [
      {
        name: 'Major bleeding',
        result: '3.6%/patient-year with apixaban vs 4.5%/patient-year with warfarin - bleeding was NOT the problem; thromboembolism was'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported in the abstract',
      other: 'Major bleeding 3.6%/patient-year with apixaban vs 4.5%/patient-year with warfarin. The trial was halted early for an excess of thromboembolic events in the apixaban group'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The single best answer to the recurring bedside question \'can this mechanical-valve patient go on a DOAC?\' The On-X aortic valve is the least thrombogenic mechanical prosthesis and the one for which a lower INR target is licensed - so it was the most favourable possible test case for a factor Xa inhibitor, and even there apixaban was worse. Read as a pair with RE-ALIGN: RE-ALIGN failed a direct thrombin inhibitor in 2013, PROACT Xa failed a factor Xa inhibitor in 2023, in a chronically implanted population rather than a post-operative one. Together they close the class. Note that this trial answers valve thromboembolism, not stroke recurrence after an index cerebral event - the corpus has no randomized data on that narrower question.',
    limitations: 'Stopped early for harm, so the effect estimate is imprecise and, as with all trials terminated at an interim boundary, likely to overstate the magnitude of the difference even though the direction is clear. Only 26 primary events in total. Restricted to a single valve model in a single position (On-X aortic), so it does not directly address mitral or non-On-X prostheses - though no trial supports a DOAC there either. 94% of participants also took aspirin. Per-arm randomized numbers and exclusion criteria are not given in the abstract.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-proact-xa-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that no direct oral anticoagulant has been shown safe for a mechanical heart valve, including the On-X aortic valve - the one prosthesis for which the question was formally randomized, and the trial was halted for excess thromboembolism.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "bhf-protect-tavi",
    "shortName": "BHF PROTECT-TAVI",
    "fullName": "British Heart Foundation Randomised Trial of Routine Cerebral Embolic Protection during Transcatheter Aortic-Valve Implantation (BHF PROTECT-TAVI)",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 7635,
      "ageRange": "adults with aortic stenosis undergoing TAVI; mean age 81.0 years in the 3535-participant cognitive cohort",
      "nihssRange": "not applicable - procedural stroke-prevention trial",
      "timeWindow": "randomized before TAVI; primary outcome within 72 h of the procedure or before discharge",
      "keyInclusion": [
        "Aortic stenosis undergoing transcatheter aortic-valve implantation",
        "33 UK centers; physician assessment of clinical/anatomic suitability for SENTINEL"
      ],
      "keyExclusion": []
    },
    "intervention": "TAVI with a cerebral embolic protection device (SENTINEL, Boston Scientific): 3815 randomized, 3795 in the primary analysis",
    "comparator": "TAVI without a cerebral embolic protection device: 3820 randomized, 3799 in the primary analysis",
    "primaryEndpoint": {
      "definition": "Stroke within 72 hours after TAVI, or before hospital discharge if that came sooner (superiority design)",
      "timepoint": "within 72 h of TAVI or before discharge",
      "result": "NEUTRAL - routine cerebral embolic protection DID NOT reduce stroke: 81 of 3795 (2.1%) with CEP vs 82 of 3799 (2.2%) without",
      "effectSize": "Absolute difference -0.02 percentage points",
      "confidenceInterval": "95% CI -0.68 to 0.63",
      "pValue": "P=0.94"
    },
    "secondaryEndpoints": [
      {
        "name": "Disabling stroke",
        "result": "47 participants (1.2%) with CEP vs 53 (1.4%) without"
      },
      {
        "name": "Death",
        "result": "29 participants (0.8%) with CEP vs 26 (0.7%) without"
      },
      {
        "name": "Access-site complications",
        "result": "Similar in the two groups: 8.1% with CEP vs 7.7% without"
      },
      {
        "name": "Cognitive companion: 3535 assessed of 5368 eligible before cognitive collection stopped",
        "result": "NO benefit. Baseline-adjusted mean change in telephone MoCA from baseline to 6-8 weeks was 0.83 (95% CI 0.70-0.96) with CEP vs 0.91 (95% CI 0.79-1.04) control; between-group difference -0.07 (95% CI -0.22 to 0.09, P=0.42). A drop of at least 3 t-MoCA points occurred in 154 of 1763 (8.7%) with CEP vs 142 of 1772 (8.0%) control; risk difference 0.72% (95% CI -1.10 to 2.55, P=0.44). Robust to sensitivity analyses with no subgroup interaction"
      }
    ],
    "safetyFindings": {
      "sich": "Hemorrhagic stroke 1/3795 versus 0/3799 in Table 2; this is not necessarily the same definition as separately adjudicated symptomatic ICH.",
      "mortality": "29/3795 versus 26/3799 by 72 hours or earlier discharge; observed-outcome denominators differ from the SAE analysis population.",
      "other": "24 serious adverse events in 22 of 3798 participants (0.6%) with CEP vs 13 serious adverse events in 13 of 3803 (0.3%) without; overall access-site complications 8.1% vs 7.7%"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "No detected average 6–8-week telephone-MoCA benefit in the assessed cohort. This brief instrument omits some cognitive domains and the study lacked routine MRI; it cannot exclude every cognitive or imaging effect of protection.",
    "limitations": "Open-label device trial (blinding is not feasible), single-country (UK) recruitment, and one CEP system only - the SENTINEL filter - so it does not test other device designs or deflection-based systems. The primary window is 72 h/discharge, so later strokes are not captured by the primary endpoint. The cognitive analysis is a secondary analysis restricted to the subset who completed telephone MoCA testing, uses a brief telephone instrument, and ends at 6-8 weeks.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-bhf-protect-tavi-2025",
      "cit-protect-tavi-cog-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Routine SENTINEL use did not demonstrate benefit for the measured early-stroke endpoint or short-term telephone cognition. Apply the specific population, device, outcome and time horizons.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Original 25-page accepted manuscript and main tables, final published abstract and full cognitive companion compared. AAM-to-final version differences and complete protocol/supplement history not exhaustively reviewed. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "protected-tavr",
    "shortName": "PROTECTED TAVR",
    "fullName": "Cerebral Embolic Protection during Transcatheter Aortic-Valve Replacement (PROTECTED TAVR)",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 3000,
      "ageRange": "adults with aortic stenosis; age distribution not reported in the abstract",
      "nihssRange": "not applicable - procedural stroke-prevention trial",
      "timeWindow": "randomized before transfemoral TAVR; primary outcome within 72 h or before discharge",
      "keyInclusion": [
        "Aortic stenosis undergoing transfemoral TAVR",
        "Sites in North America, Europe and Australia",
        "A neurology professional examined every patient at baseline and after TAVR"
      ],
      "keyExclusion": []
    },
    "intervention": "Transfemoral TAVR with a cerebral embolic protection device (n=1501; the device was successfully deployed in 1406 of the 1489 patients in whom deployment was attempted, 94.4%)",
    "comparator": "Transfemoral TAVR without cerebral embolic protection (n=1499)",
    "primaryEndpoint": {
      "definition": "Stroke within 72 hours after TAVR or before discharge, whichever came first, in the intention-to-treat population",
      "timepoint": "within 72 h of TAVR or before discharge",
      "result": "DID NOT show a significant effect: 2.3% with CEP vs 2.9% without. The authors state explicitly that, on the basis of the 95% confidence interval, the result may NOT rule out a benefit of CEP - this is an indeterminate trial, not a demonstrated null",
      "effectSize": "Absolute difference -0.6 percentage points",
      "confidenceInterval": "95% CI -1.7 to 0.5",
      "pValue": "P=0.30"
    },
    "secondaryEndpoints": [
      {
        "name": "Disabling stroke",
        "result": "0.5% with CEP vs 1.3% without - the numerical difference that sustained the case for CEP until BHF PROTECT-TAVI reported"
      },
      {
        "name": "Death",
        "result": "0.5% with CEP vs 0.3% without"
      },
      {
        "name": "Stroke, TIA or delirium",
        "result": "3.1% with CEP vs 3.7% without"
      },
      {
        "name": "Acute kidney injury",
        "result": "0.5% in both groups"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported as a separate category",
      "mortality": "0.5% with CEP vs 0.3% without",
      "other": "One patient (0.1%) had a vascular complication at the CEP access site; the device was successfully deployed in 94.4% of attempts"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "No significant primary stroke reduction with cerebral embolic protection in this trial. The later BHF primary absolute-difference CI (−0.68 to 0.63 percentage points) is about 1.7-fold narrower in width, not an order of magnitude, and still permits clinically relevant benefit or harm.",
    "limitations": "Underpowered for the observed event rate, so the primary result is indeterminate rather than null - the confidence interval does not exclude a meaningful benefit. Disabling stroke was a secondary endpoint with very few events (0.5% vs 1.3%), so that difference is hypothesis-generating only and should never be quoted as a demonstrated effect. Open-label device trial; restricted to transfemoral access.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-protected-tavr-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Neither trial demonstrated a primary stroke reduction from routine use of the tested protection strategy. Nonsignificance and a narrower interval do not prove exact absence of benefit.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "warfarin-resumption-ich-mechanical-valve",
    "shortName": "Warfarin resumption after ICH with a mechanical valve (meta-analysis)",
    "fullName": "Resumption of Warfarin After Intracranial Hemorrhage in Patients With Mechanical Heart Valves: A Systematic Review and Meta-Analysis",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "ich",
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 788,
      "ageRange": "adults; age distribution not reported in the abstract",
      "nihssRange": "not applicable - intracranial hemorrhage cohort",
      "timeWindow": "from the index intracranial hemorrhage through the interruption and resumption period, as reported by the included studies",
      "keyInclusion": [
        "Adults with intracranial hemorrhage who required anticoagulation for a mechanical heart valve",
        "13 studies: 12 retrospective, 1 prospective observational",
        "Databases searched from inception to 23 August 2024",
        "Mixed intracranial hemorrhage types, including traumatic cases: intraparenchymal, subdural, subarachnoid and other hemorrhage"
      ],
      "keyExclusion": []
    },
    "intervention": "Resumption of warfarin after intracranial hemorrhage (pooled hemorrhagic-recurrence rate)",
    "comparator": "Interruption of anticoagulation (pooled ischemic-stroke rate while off anticoagulation) - these are POOLED SINGLE-ARM proportions, not a head-to-head comparison",
    "primaryEndpoint": {
      "definition": "Observational pooled single-arm ischemic-stroke rates during interruption and hemorrhagic recurrence after resumption; not a randomized head-to-head comparison",
      "timepoint": "Heterogeneous follow-up; study means range from 30 to 1125 days",
      "result": "The abstract reports pooled rates of 5.23% for ischemic stroke off anticoagulation and 10.95% for recurrence after resumption. These are not directly comparable treatment effects. Recurrence counts and denominators conflict within the source, so no reconciled absolute recurrence count is asserted.",
      "effectSize": "Abstract-reported pooled rates: 5.23% and 10.95%; source discrepancy limits interpretation",
      "confidenceInterval": "Ischemic stroke pooled 95% CI 3.80–7.20%; mean timing 8.08 days, 95% CI 1.99–14.18, from 23 events in three studies (I²=89%)",
      "pValue": "No randomized between-strategy comparison"
    },
    "secondaryEndpoints": [
      {
        "name": "Timing subset",
        "result": "Mean 8.08 days from only 23 events in three studies, with I²=89%; this does not establish an event cluster or safe withholding interval."
      },
      {
        "name": "Risk of bias",
        "result": "Full report classifies 11/13 studies at serious or critical risk of bias (eight serious, three critical)."
      }
    ],
    "safetyFindings": {
      "sich": "Abstract pooled hemorrhagic recurrence 10.95%; source conflicts remain: 73 versus 74 events and denominators 592 versus 677. Pooled and crude proportions are different estimands.",
      "mortality": "No validated pooled mortality estimate asserted",
      "other": "Different observation periods, hemorrhage types and selection for restarting prevent a causal comparison of the two rates."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Restart decisions for a mechanical valve require individualized assessment of hematoma stability and thromboembolic risk with cardiology and neurosurgery. The small, heterogeneous timing subset does not validate a universal seven-day hold or demonstrate that events cluster on day eight. AF restart trials cannot be directly transplanted to mechanical valves.",
    "limitations": "Twelve retrospective studies and one prospective observational study; 11/13 serious or critical risk of bias in the body. Mixed intracranial hemorrhage types and heterogeneous follow-up, indication and survivorship bias, few events and no randomized timing comparison. Valve characteristics are described but outcome stratification is insufficient. Abstract pooled rates differ appropriately from crude rates; inconsistent recurrence counts and denominators remain unresolved.",
    "certainty": "very-low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-warfarin-ich-mhv-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Observational evidence illustrates competing risks but does not establish a safe restart day. Do not infer a seven-day withholding rule from the pooled mean time among 23 ischemic events.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Full report read; recurrence counts/denominators remain internally inconsistent. No timing recommendation is certified. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "lv-thrombus-doac-rct-meta",
    "shortName": "DOACs vs warfarin for LV thrombus (RCT meta-analysis)",
    "fullName": "Direct oral anticoagulants or warfarin in left ventricular thrombus: an updated systematic review and meta-analysis of randomized trials",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 554,
      "ageRange": "adults; age distribution not reported in the abstract",
      "nihssRange": "not applicable - anticoagulation trials in LV thrombus, not a stroke cohort",
      "timeWindow": "thrombus resolution assessed at 1 month and 3 months",
      "keyInclusion": [
        "Randomized controlled trials comparing a DOAC with warfarin in left ventricular thrombus",
        "7 RCTs, 554 patients, of whom 319 received a DOAC",
        "Predominantly left ventricular thrombus following acute myocardial infarction"
      ],
      "keyExclusion": [
        "Non-randomized studies were excluded - this is a deliberately RCT-only synthesis"
      ]
    },
    "intervention": "Direct oral anticoagulants (n=319 across the 7 trials)",
    "comparator": "Warfarin (n=235 across the 7 trials)",
    "primaryEndpoint": {
      "definition": "Left ventricular thrombus resolution on imaging at 1 month and at 3 months - a SURROGATE imaging endpoint. The pooled analysis is not powered for stroke, systemic embolism or death",
      "timepoint": "1 month and 3 months",
      "result": "NEUTRAL at both timepoints - no significant difference between DOACs and warfarin: OR 1.69 at 1 month and OR 1.39 at 3 months. The authors conclude DOACs showed comparable efficacy and safety and are a reasonable alternative to warfarin, while calling for further large-scale trials",
      "effectSize": "OR 1.69 for resolution at 1 month; OR 1.39 at 3 months",
      "confidenceInterval": "95% CI 0.62-4.60 at 1 month (I-squared 69%); 95% CI 0.82-2.37 at 3 months (I-squared 0%)",
      "pValue": "p=0.31 at 1 month; p=0.22 at 3 months"
    },
    "secondaryEndpoints": [
      {
        "name": "Major bleeding",
        "result": "OR 0.51 (95% CI 0.12–2.12), permitting 88% lower through 112% higher odds; clinically imprecise and not equivalence."
      },
      {
        "name": "Stroke or systemic embolism",
        "result": "OR 0.69 (95% CI 0.10-4.64) - far too wide to establish equivalence on the outcome that actually matters"
      },
      {
        "name": "All-cause mortality",
        "result": "OR 0.86 (95% CI 0.31-2.40)"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported separately; intracranial hemorrhage is subsumed within the major-bleeding endpoint",
      "mortality": "All-cause mortality OR 0.86 (95% CI 0.31-2.40) - no difference detected, but the interval is very wide",
      "other": "Major bleeding OR 0.51 (95% CI 0.12-2.12). Every clinical-event interval in this synthesis is compatible with both benefit and harm"
    },
    "imagingCriteria": "Left ventricular thrombus confirmed on imaging (echocardiography in most included trials); the authors note that future trials should use advanced imaging",
    "applicabilityNotes": "Pooled randomized evidence remains clinically imprecise for uncommon outcomes. The major-bleeding odds-ratio interval 0.12–2.12 permits 88% lower to 112% higher odds; it is not a fourfold risk-reduction interval or evidence of equivalence.",
    "limitations": "Only 554 randomized patients across 7 trials, so every clinical-outcome estimate is imprecise. The primary endpoint is thrombus resolution on imaging - a surrogate that has never been validated against stroke reduction in this population. Substantial heterogeneity at 1 month (I-squared 69%). The included trials are mostly open-label, use different DOACs at different doses, and are dominated by post-myocardial-infarction thrombus, so the results may not transfer to LV thrombus from a non-ischemic cardiomyopathy. The abstract does not give a per-trial breakdown.",
    "certainty": "low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-lvt-doac-meta-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Interpret the pooled estimates and wide intervals as uncertain clinical effects. Odds ratios are not risk ratios, and sparse events do not establish equal efficacy or safety.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "rivawar",
    "shortName": "RIVAWAR",
    "fullName": "Rivaroxaban vs Warfarin in Acute Left Ventricular Thrombus Following Myocardial Infarction (RIVAWAR): An Open-Label Randomised Controlled Trial",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 261,
      "ageRange": "adults; groups similar in age, sex and MI subtype, but the age range is not given in the abstract",
      "nihssRange": "not applicable - LV thrombus cohort, not a stroke cohort",
      "timeWindow": "LV thrombus diagnosed within 7 days of MI; 12-week treatment",
      "keyInclusion": [
        "Acute left ventricular thrombus diagnosed during the initial myocardial-infarction hospitalization",
        "Most participants had ST-segment-elevation MI and severe LV dysfunction"
      ],
      "keyExclusion": [
        "Prior intracranial or major bleeding, cardiogenic shock, GFR <30 mL/min, or another anticoagulation indication"
      ]
    },
    "intervention": "Trial regimen: rivaroxaban 20 mg daily; aspirin 75 mg plus clopidogrel 75 mg for 4 weeks, then clopidogrel alone for 8 weeks (n=171).",
    "comparator": "Warfarin INR 2–3 with the same antiplatelet regimen (n=90; 2:1 randomization).",
    "primaryEndpoint": {
      "definition": "Complete LVT resolution at 12 weeks; noninferiority margin 7 percentage points. Four-week resolution was earlier follow-up.",
      "timepoint": "12 weeks",
      "result": "158/165 (95.8%) versus 84/87 (96.6%); imaging analysis excludes deaths. Met reported noninferiority criterion, not equivalence.",
      "effectSize": "Difference −0.8 percentage points",
      "confidenceInterval": "95% CI −5.7 to 4.1 percentage points",
      "pValue": "P(noninferiority)=.017; superiority P=.759 in abstract versus >.999 in body/table (unresolved)."
    },
    "secondaryEndpoints": [
      {
        "name": "Mortality",
        "result": "6/171 versus 3/90; P=.921 abstract, .941 Results, >.999 Table 2."
      },
      {
        "name": "Major bleeding",
        "result": "4/171 versus 1/90; P=.491 abstract versus .662 body/table."
      }
    ],
    "safetyFindings": {
      "sich": "Intracranial bleeding 2/171 versus 0/90; not separately identified as symptomatic ICH.",
      "mortality": "6/171 versus 3/90; source p-values disagree (see secondary outcomes).",
      "other": "Ischemic stroke 6/171 versus 1/90; major bleeding 4/171 versus 1/90. Too few events to establish safety equivalence."
    },
    "imagingCriteria": "Left ventricular thrombus diagnosed and followed on transthoracic echocardiography",
    "applicabilityNotes": "Short-term post-MI imaging-surrogate evidence; thrombus resolution does not establish equivalent embolic risk.",
    "limitations": "Single-center, open-label, clinical outcomes underpowered; unresolved source p-value discrepancies. No nonischemic cardiomyopathy inference.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-rivawar-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports the reported 12-week imaging noninferiority result within trial selection; does not establish clinical-event equivalence.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-08-28",
    verificationNotes: "Main report compared. Internal p-value discrepancies remain unresolved; no verified correction, protocol or contemporary guideline synthesis. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "aries-hm3",
    "shortName": "ARIES-HM3",
    "fullName": "Aspirin and Hemocompatibility Events With a Left Ventricular Assist Device in Advanced Heart Failure: The ARIES-HM3 Randomized Clinical Trial",
    "topic": "cardiac-source-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "cardiac-source-stroke"
    ],
    "population": {
      "n": 628,
      "ageRange": "adults with advanced heart failure; age range not reported in the abstract. Of the 589 analysed, 77% were men, one third were Black and 61% were White",
      "nihssRange": "not applicable - device antithrombotic trial; stroke is a component of the composite",
      "timeWindow": "Randomized days 2–7 after HeartMate 3 implantation; primary endpoint at 12 months",
      "keyInclusion": [
        "Advanced heart failure with a fully magnetically levitated (HeartMate 3) left ventricular assist device",
        "51 centres with advanced-heart-failure expertise across 9 countries",
        "All participants received vitamin K antagonist therapy"
      ],
      "keyExclusion": [
        "Additional mechanical support",
        "Investigator judgment that aspirin was required"
      ]
    },
    "intervention": "Aspirin avoidance (placebo) beginning days 2–7 after HeartMate 3 implantation, with VKA anticoagulation targeting INR 2–3",
    "comparator": "Aspirin 100 mg daily plus VKA anticoagulation targeting INR 2–3",
    "primaryEndpoint": {
      "definition": "Survival free of a major nonsurgical (more than 14 days after implant) hemocompatibility-related adverse event - stroke, pump thrombosis, major bleeding, or arterial peripheral thromboembolism - at 12 months, tested for NON-INFERIORITY of placebo against a -10% margin. The claim is non-inferiority, NOT superiority",
      "timepoint": "12 months",
      "result": "Placebo (aspirin avoidance) MET non-inferiority: 74% of the placebo group vs 68% of the aspirin group were alive and free of hemocompatibility events at 12 months",
      "effectSize": "Absolute between-group difference 6.0 percentage points in event-free survival, favouring placebo",
      "confidenceInterval": "Lower 1-sided 97.5% CI -1.6%",
      "pValue": "P<0.001 for non-inferiority"
    },
    "secondaryEndpoints": [
      {
        "name": "Nonsurgical bleeding events (principal secondary endpoint)",
        "result": "REDUCED with aspirin avoidance: relative risk 0.66 (95% confidence limit 0.51-0.85), P=0.002"
      },
      {
        "name": "Stroke and other thromboembolic events",
        "result": "No statistically detected thrombotic increase: thrombotic RR 0.58 (95% CI 0.21–1.58), stroke RR 0.52 (0.21–1.30); low event counts leave uncertainty."
      }
    ],
    "safetyFindings": {
      "sich": "Separate sICH estimate not asserted. Stroke RR 0.52 (95% CI 0.21–1.30) does not establish equal stroke risk.",
      "mortality": "Not reported separately in the abstract; survival is embedded in the composite primary endpoint",
      "other": "Nonsurgical bleeding decreased (RR 0.66, 95% CI 0.51–0.85), P=.002. Thromboembolic estimates remain imprecise."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Aspirin avoidance was noninferior for the tested composite and reduced bleeding. Thrombotic outcomes were uncommon: RR 0.58 (95% CI 0.21–1.58), stroke RR 0.52 (0.21–1.30), no pump thrombosis; wide intervals preclude categorical claims of unchanged thrombotic risk.",
    "limitations": "Non-inferiority design with a -10% margin, so a modest true disadvantage of aspirin avoidance would not have been excluded; the composite endpoint bundles stroke, pump thrombosis, major bleeding and peripheral thromboembolism together, and the bleeding component drives most of the difference. Confined to one device (HeartMate 3) with background vitamin K antagonist therapy. 39 of the 628 randomized patients are not in the primary analysis population. Median follow-up 14 months, so late thrombotic risk is not characterised.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-aries-hm3-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Supports the studied early post-implant aspirin-avoidance strategy with VKA. The main report explicitly does not establish equivalent results from withdrawing aspirin in patients already chronically supported.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'ecmo-lv-venting-brain-injury',
    shortName: 'ELSO LV venting and acute brain injury',
    fullName: 'Impact of Left Ventricular Venting on Acute Brain Injury in Patients With Cardiogenic Shock: An Extracorporeal Life Support Organization Registry Analysis',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke', 'neurocritical-care'],
    population: {
      n: 13276,
      ageRange: 'median 58.2 years; 69.9% male',
      nihssRange: 'not applicable - registry cohort of critically ill patients on mechanical circulatory support, most of whom are sedated',
      timeWindow: 'peripheral venoarterial ECMO runs recorded 2013-2024',
      keyInclusion: ['Adults on peripheral venoarterial ECMO for cardiogenic shock', 'Extracorporeal Life Support Organization (ELSO) registry, 2013-2024'],
      keyExclusion: ['Cohort restricted to peripheral VA-ECMO for cardiogenic shock; other cannulation configurations and other ECMO indications were not analysed']
    },
    intervention: 'Left ventricular venting (n=1456, 11.0% of the cohort; 65.5% by percutaneous microaxial flow pump, 29.9% by intra-aortic balloon pump)',
    comparator: 'No left ventricular venting (n=11,820)',
    primaryEndpoint: {
      definition: 'Acute brain injury, defined as hypoxic-ischemic brain injury, ischemic stroke, or intracranial hemorrhage, compared by multivariable logistic regression. This is an OBSERVATIONAL association in a registry - patients were not randomized to venting',
      timepoint: 'during the ECMO hospitalization',
      result: 'Acute brain injury occurred in 525 of 13,276 patients (4.0%). LV-vented patients had HIGHER adjusted odds of acute brain injury (aOR 1.67) with NO difference in hospital mortality (aOR 1.07). In a propensity-matched comparison of the two venting strategies there was no difference between an intra-aortic balloon pump and a microaxial flow pump',
      effectSize: 'Acute brain injury aOR 1.67 for LV venting vs no venting; hospital mortality aOR 1.07',
      confidenceInterval: '95% CI 1.22-2.26 for acute brain injury; 95% CI 0.90-1.27 for hospital mortality',
      pValue: 'p=0.001 for acute brain injury; p=0.45 for hospital mortality'
    },
    secondaryEndpoints: [
      {
        name: 'Intra-aortic balloon pump vs percutaneous microaxial flow pump, propensity-matched (231 vs 231)',
        result: 'NO significant difference in acute brain injury (aOR 1.35, 95% CI 0.69-2.71, p=0.39) or in mortality (aOR 0.88, 95% CI 0.58-1.31, p=0.52)'
      },
      {
        name: 'Hospital mortality with LV venting',
        result: 'No difference: aOR 1.07 (95% CI 0.90-1.27, p=0.45)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately; intracranial hemorrhage is folded into the composite acute-brain-injury definition alongside ischemic stroke and hypoxic-ischemic injury',
      mortality: 'Hospital mortality did not differ between vented and non-vented patients (aOR 1.07, 95% CI 0.90-1.27)',
      other: 'Acute brain injury here is what was entered into the ELSO registry, which depends on local neuroimaging and reporting practice rather than protocolised neurological assessment'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The corpus previously had no ECMO content at all, and this record supplies the number a stroke service most needs when it is called to a cannulated patient: roughly 4% of adults on peripheral VA-ECMO for cardiogenic shock have a registry-documented acute brain injury, spanning ischemic stroke, intracranial hemorrhage and hypoxic-ischemic injury. The venting association is worth teaching, but as a marker of risk rather than a demonstrated cause: patients who need an LV vent have a distended, poorly ejecting ventricle and stagnant blood, which is itself a thromboembolic state, so confounding by indication runs in exactly the direction of the finding. The clean part of the analysis is the propensity-matched head-to-head, which found no difference between balloon-pump and microaxial-pump venting.',
    limitations: 'Retrospective registry analysis with no randomization; confounding by indication is the central threat, because the decision to vent tracks the severity of LV distension. Neurological injury is registry-reported without protocolised imaging or a standard neurological examination, so ascertainment varies by centre and the 4.0% rate reflects what was captured rather than a systematically screened incidence. No functional outcomes, no timing of injury relative to cannulation, and no post-discharge follow-up. The propensity-matched device comparison contains only 231 patients per arm, so it is underpowered to exclude a moderate difference.',
    certainty: 'very-low',
    evidenceType: 'observational',
    citationIds: ['cit-ecmo-lv-venting-abi-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Gives the base rate for neurological injury on venoarterial ECMO - about 4% of adults supported for cardiogenic shock - and flags left ventricular venting as a marker of higher neurological risk, on registry data that cannot establish cause.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ie-baseline-antithrombotic-ich',
    shortName: 'IE baseline antithrombotic therapy and ICH',
    fullName: 'Baseline Antithrombotic Therapy and Intracranial Hemorrhage Risk in Infective Endocarditis: A Multicenter Prospective Cohort Study',
    topic: 'endocarditis-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke', 'endocarditis-stroke'],
    population: {
      n: 3236,
      ageRange: 'adults; age distribution not reported in the abstract',
      nihssRange: 'not applicable - endocarditis cohort in which neurological events are outcomes, not entry criteria',
      timeWindow: 'antithrombotic exposure classified at the time of IE diagnosis; primary outcome at 30 days, mortality followed to 1 year',
      keyInclusion: ['Definite LEFT-SIDED infective endocarditis', 'Prospective multicentre cohort, 2008-2018', 'Classified at diagnosis as no therapy, antiplatelet therapy, anticoagulation, or combined antithrombotic therapy'],
      keyExclusion: ['Right-sided infective endocarditis']
    },
    intervention: 'Baseline anticoagulation (AC) at IE diagnosis, and combined antithrombotic therapy (CAT: anticoagulant plus antiplatelet) analysed separately',
    comparator: 'No antithrombotic therapy (NT) at IE diagnosis; antiplatelet therapy alone (APT) analysed as a third exposure group',
    primaryEndpoint: {
      definition: 'Intracranial hemorrhage within 30 days, by multivariable logistic regression adjusted for confounders. This is an OBSERVATIONAL comparison of pre-existing exposures, not a randomized allocation and not a test of stopping versus continuing therapy',
      timepoint: '30 days',
      result: 'Intracranial hemorrhage occurred in 182 of 3236 patients (5.6%), with the highest incidence in the combined-therapy group (9.5%) and the anticoagulation group (6.8%). Compared with no antithrombotic therapy, baseline ANTICOAGULATION was independently associated with more ICH (adjusted risk ratio 1.83), and COMBINED therapy carried the highest risk (aRR 2.45). ANTIPLATELET therapy alone was NOT associated with ICH, and ischemic stroke rates were similar across all groups',
      effectSize: 'Adjusted risk ratio 1.83 for anticoagulation and 2.45 for combined antithrombotic therapy, each versus no antithrombotic therapy',
      confidenceInterval: '95% CI 1.16-2.91 for anticoagulation; 95% CI 1.55-3.87 for combined therapy',
      pValue: 'Not reported in the abstract; both confidence intervals exclude 1'
    },
    secondaryEndpoints: [
      {
        name: 'Ischemic stroke',
        result: 'Rates were SIMILAR across all four exposure groups - baseline anticoagulation did not appear to protect against ischemic stroke in this cohort'
      },
      {
        name: '1-year all-cause mortality',
        result: 'Combined antithrombotic therapy independently predicted higher 1-year mortality: adjusted hazard ratio 1.21 (95% CI 1.02-1.43)'
      },
      {
        name: 'Other independent factors associated with ICH',
        result: 'Staphylococcus aureus and Candida spp. endocarditis, extracranial embolism, prior cerebrovascular disease, and septic shock'
      }
    ],
    safetyFindings: {
      sich: 'Intracranial hemorrhage at 30 days was the primary outcome: 182 of 3236 overall (5.6%), 9.5% on combined therapy and 6.8% on anticoagulation',
      mortality: 'Combined antithrombotic therapy was independently associated with higher 1-year mortality (aHR 1.21, 95% CI 1.02-1.43)',
      other: 'The microbiological signal matters as much as the drug signal: S. aureus and Candida endocarditis were themselves independent predictors of intracranial hemorrhage'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The closest thing that exists to evidence on anticoagulation in infective endocarditis, and it is a prospective observational cohort - there is no randomized trial. Three points do the teaching. First, the asymmetry: anticoagulation was associated with more intracranial bleeding without a matching reduction in ischemic stroke, which is why anticoagulation in IE is generally treated as risk without demonstrated benefit. Second, combined anticoagulant plus antiplatelet therapy carried both the highest ICH risk and higher 1-year mortality, while antiplatelet therapy alone was not associated with ICH. Third, and easy to miss: what predicted bleeding was not only the drug but the organism - S. aureus and Candida - together with septic shock and prior cerebrovascular disease, which is a practical risk-stratification list for deciding who needs early brain imaging. Note the design limit: this measures BASELINE exposure and therefore cannot say what happens when anticoagulation is stopped or restarted during the admission, which is the question actually asked at the bedside.',
    limitations: 'Observational, so confounding by indication is unavoidable - patients already anticoagulated at IE diagnosis have atrial fibrillation, prosthetic valves or venous thromboembolism and differ systematically in baseline stroke and bleeding risk. The exposure is baseline therapy only, so the study cannot address the timing question (interrupt, continue, or resume). No randomized comparison exists in this population. Restricted to definite left-sided IE in a 2008-2018 cohort, with practice and DOAC use having changed since. Neither p values for the primary risk ratios nor the age distribution are given in the abstract.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-ie-antithrombotic-ich-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the quantitative basis for teaching that anticoagulation in left-sided infective endocarditis is associated with roughly double the 30-day intracranial-hemorrhage risk without a reduction in ischemic stroke, while antiplatelet therapy alone is not - on observational data only.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "ie-lvo-thrombectomy-meta",
    "shortName": "Thrombectomy for IE-related LVO (meta-analysis)",
    "fullName": "Efficacy and Safety of Mechanical Thrombectomy for Patients with Infective Endocarditis-Related Large Vessel Occlusion: a Systematic Review and Meta-Analysis",
    "topic": "endocarditis-stroke",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "cardiac-source-stroke",
      "endocarditis-stroke"
    ],
    "population": {
      "n": 2037,
      "ageRange": "mean age 57.9 years; 62.3% women",
      "nihssRange": "not reported in the abstract",
      "timeWindow": "acute large-vessel-occlusion stroke; individual treatment windows not reported in the pooled abstract",
      "keyInclusion": [
        "Acute ischemic stroke due to large-vessel occlusion in the setting of infective endocarditis",
        "8 studies published between 2017 and 2024; 1401 of the 2037 patients (69%) received mechanical or endovascular thrombectomy",
        "Databases searched from inception to December 2024"
      ],
      "keyExclusion": [
        "No randomized trial exists in this population - all 8 included studies are OBSERVATIONAL"
      ]
    },
    "intervention": "Mechanical or endovascular thrombectomy for infective-endocarditis-related large-vessel occlusion (n=1401 across the 8 studies)",
    "comparator": "Pooled single-arm proportions, with an additional comparison against non-IE large-vessel-occlusion patients treated with thrombectomy in the studies that reported both",
    "primaryEndpoint": {
      "definition": "Pooled proportion achieving a favourable functional outcome (mRS 0-2) at 90 days, with successful recanalization, symptomatic and any intracranial hemorrhage and mortality as further pooled proportions. These are POOLED OBSERVATIONAL proportions, not a randomized treatment effect",
      "timepoint": "90 days for functional outcome; procedural for recanalization",
      "result": "Favourable outcome (mRS 0-2) at 90 days in 29.0% of patients, with successful recanalization (mTICI 2b-3) in 76.0%. Compared with non-IE large-vessel occlusion treated with thrombectomy, IE patients had a SIGNIFICANTLY LOWER rate of favourable outcome (RR 0.48) with no significant difference in any intracranial hemorrhage (RR 1.38, 95% CI 0.96-1.98)",
      "effectSize": "mRS 0-2 at 90 days 29.0%; successful recanalization 76.0%; RR 0.48 for favourable outcome versus non-IE LVO",
      "confidenceInterval": "95% CI 14.0-43.0% for mRS 0-2 (I-squared 65.7%); 95% CI 68.0-84.0% for recanalization (I-squared 23.6%); 95% CI 0.31-0.75 for the RR versus non-IE LVO (I-squared 0.0%)",
      "pValue": "Not reported in the abstract"
    },
    "secondaryEndpoints": [
      {
        "name": "Symptomatic intracranial hemorrhage",
        "result": "Pooled 19.0% (95% CI 0.0-38.0%, I-squared 49.2%) - an interval running from zero to nearly 40%, which is effectively uninformative and must not be quoted as a point estimate"
      },
      {
        "name": "Any intracranial hemorrhage",
        "result": "Pooled 30.0% (95% CI 23.0-38.0%, I-squared 78.3%); versus non-IE LVO treated with thrombectomy, RR 1.38 (95% CI 0.96-1.98, I-squared 62.4%) - no significant difference"
      },
      {
        "name": "All-cause mortality",
        "result": "Pooled 33.0% (95% CI 21.0-45.0%, I-squared 90.4%) - heterogeneity so extreme that the pooled figure describes the literature more than any patient"
      }
    ],
    "safetyFindings": {
      "sich": "Pooled symptomatic intracranial hemorrhage 19.0% (95% CI 0.0-38.0%) - the confidence interval is too wide to support any numeric counselling figure",
      "mortality": "Pooled all-cause mortality 33.0% (95% CI 21.0-45.0%), with I-squared 90.4%",
      "other": "Any intracranial hemorrhage 30.0%, which was NOT significantly higher than in thrombectomy for non-IE large-vessel occlusion (RR 1.38, 95% CI 0.96-1.98)"
    },
    "imagingCriteria": "Large-vessel occlusion on angiographic or CT/MR angiographic imaging; recanalization graded by mTICI",
    "applicabilityNotes": "Pooled observational IE-versus-non-IE thrombectomy comparisons show prognosis differences but cannot attribute worse outcome solely to systemic illness or exclude a procedural contribution.",
    "limitations": "Eight observational studies with substantial heterogeneity, few events and selection/confounding that cannot be assigned a certain direction. The sICH interval spans 0–38% and is clinically imprecise. Abstract-level review does not establish full baseline, timing or within-IE medical-control comparisons.",
    "certainty": "very-low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-ie-lvo-mt-meta-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Limited observational evidence for a selected, high-risk group. Treatment selection and confounding may operate in either direction; do not use the comparison as causal proof of procedural safety.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'cooper',
    shortName: 'COOPER',
    fullName: 'Characteristics and Outcomes of Operated Versus Nonoperated Patients With Infective Endocarditis and Cerebral Complications: the COOPER Study',
    topic: 'endocarditis-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke', 'endocarditis-stroke'],
    population: {
      n: 288,
      ageRange: 'mean age 65 plus or minus 14 years; 74% male',
      nihssRange: 'not reported; coma was recorded as a predictor variable',
      timeWindow: 'prospective enrollment 2013-2021; primary outcome at 1 month, secondary outcomes to 1 year',
      keyInclusion: ['Infective endocarditis with cerebral complications: 288 of 1230 consecutive IE patients in a prospective Aquitaine (France) cohort', 'Ischemic cerebral lesions in 76% and hemorrhagic lesions in 19%', 'Severe valvular damage in 43%; cardiac surgery was indicated in 86%'],
      keyExclusion: ['Infective endocarditis without cerebral complications (the other 942 patients in the parent cohort)']
    },
    intervention: 'Cardiac surgery performed (operated patients)',
    comparator: 'Cardiac surgery not performed (nonoperated patients) - allocation was CLINICAL, not randomized; per-group numbers are not given in the abstract',
    primaryEndpoint: {
      definition: 'All-cause mortality at 1 month, in a NON-RANDOMIZED comparison of operated versus nonoperated patients with multivariable adjustment',
      timepoint: '1 month',
      result: 'One-month all-cause mortality was significantly higher among nonoperated than operated patients: 27% vs 5.9%. On multivariable analysis, heart failure, coma and cardiac surgery were independent predictors of mortality, with surgery protective (odds ratio 0.24). Neither the type of cerebral lesion nor the timing of surgery appeared to affect prognosis',
      effectSize: '27% vs 5.9% one-month mortality; adjusted odds ratio 0.24 for cardiac surgery',
      confidenceInterval: '95% CI 0.10-0.56 for the odds ratio',
      pValue: 'P<0.001 for the mortality difference; P<0.001 for the adjusted odds ratio'
    },
    secondaryEndpoints: [
      {
        name: 'Type of cerebral lesion (ischemic vs hemorrhagic)',
        result: 'Did not appear to affect prognosis in this cohort'
      },
      {
        name: 'Timing of cardiac surgery relative to the cerebral event',
        result: 'Did not appear to affect prognosis in this cohort - the finding that bears most directly on the customary practice of delaying surgery after a large infarct or a hemorrhage'
      },
      {
        name: 'All-cause mortality to 1 year',
        result: 'Reported as a secondary outcome; the abstract does not give the 1-year figures'
      }
    ],
    safetyFindings: {
      sich: 'Hemorrhagic cerebral lesions were present in 19% of the cohort at baseline; post-operative hemorrhagic conversion rates are not reported in the abstract',
      mortality: 'One-month all-cause mortality 27% nonoperated vs 5.9% operated (P<0.001)',
      other: 'Heart failure and coma were the other independent predictors of mortality'
    },
    imagingCriteria: 'Cerebral imaging classified lesions as ischemic (76%) or hemorrhagic (19%)',
    applicabilityNotes: 'This bears directly on one of the hardest joint decisions in the field - whether to delay valve surgery after a stroke in endocarditis - and it argues, in a prospective cohort, that deferring an indicated operation is associated with far higher one-month mortality, with neither lesion type nor surgical timing predicting outcome. But the direction of the confounding must be stated every time this record is used: in real practice the patients who are not operated on are the moribund, the comatose and those with a hemorrhage judged too fresh, so the 27% versus 5.9% gap is an upper bound on any surgical benefit, not an effect estimate. Read it as evidence that surgery should be actively and repeatedly discussed by a multidisciplinary endocarditis team with neurology input, which is what the authors themselves conclude - not as evidence that any particular patient should be operated on now.',
    limitations: 'Observational and non-randomized, with confounding by indication running strongly in the direction of the finding: the sickest patients are precisely those denied surgery, so a large part of the mortality gap reflects who was selected rather than what was done. Single-region French cohort (Aquitaine, 2013-2021). Per-group numbers for operated and nonoperated patients are not given in the abstract, and \'surgical timing does not affect prognosis\' is a negative finding in a subgroup analysis of 288 patients, which is far too small to exclude a real timing effect. Immortal-time bias also favours the operated group, since a patient must survive long enough to reach the operating room.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-cooper-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Provides the quantitative basis for teaching that in endocarditis with cerebral complications an indicated valve operation should be actively discussed rather than reflexively deferred, while making explicit that the 27% versus 5.9% mortality gap is confounded by indication and is an upper bound, not an effect estimate.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "ie-vs-af-stroke-imaging-phenotype",
    "shortName": "IE-associated vs AF-associated stroke imaging phenotype",
    "fullName": "Clinical and Imaging Characteristics of Infective Endocarditis-Associated Versus Atrial Fibrillation-Associated Stroke",
    "topic": "endocarditis-stroke",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "cardiac-source-stroke",
      "endocarditis-stroke"
    ],
    "population": {
      "n": 323,
      "ageRange": "not reported in the abstract; younger age was an independent predictor of IE-associated stroke",
      "nihssRange": "not reported in the abstract",
      "timeWindow": "acute embolic infarction at presentation; outcomes to 3 months",
      "keyInclusion": [
        "Definite infective endocarditis by modified Duke criteria; comparison with AF-associated stroke",
        "TEE performed for clinical suspicion unless unstable; 20.6% of IE patients also had AF"
      ],
      "keyExclusion": [
        "Afebrile atrial-fibrillation stroke, which would have made the comparison artificially easy"
      ]
    },
    "intervention": "Infective-endocarditis-associated stroke (n=170) - this is a DIAGNOSTIC comparison, not a treatment",
    "comparator": "Atrial-fibrillation-associated stroke presenting with fever (n=153)",
    "primaryEndpoint": {
      "definition": "Comparison of clinical and imaging characteristics - lesion size, lesion number and number of vascular territories involved - between IE-associated and AF-associated stroke, with logistic regression for independent predictors of IE-associated stroke",
      "timepoint": "at presentation, with recurrence and mortality followed to 3 months",
      "result": "IE-associated strokes were SMALLER (21.6 plus or minus 19.3 mm vs 66.9 plus or minus 38.0 mm), more often numerous (more than 10 lesions in 44.7% vs 5.2%), and far more often involved both anterior and posterior circulations bilaterally (54.1% vs 2.6%). Independent predictors of IE-associated stroke were younger age (OR 0.87), smaller lesion size (OR 0.94) and 3-territory involvement (OR 81.21)",
      "effectSize": "Lesion size 21.6 plus or minus 19.3 mm vs 66.9 plus or minus 38.0 mm; more than 10 lesions 44.7% vs 5.2%; bilateral anterior-posterior involvement 54.1% vs 2.6%; OR 81.21 for 3-territory involvement",
      "confidenceInterval": "95% CI 0.82-0.92 for age; 95% CI 0.92-0.97 for lesion size; 95% CI 16.20-407.00 for 3-territory involvement - an interval so wide that it signals near-complete separation of the groups rather than a calibrated effect size",
      "pValue": "P<0.001 for the lesion-size, lesion-number and territory comparisons and for each independent predictor"
    },
    "secondaryEndpoints": [
      {
        "name": "Parenchymal hematoma",
        "result": "COMPARABLE between groups despite the large difference in lesion size: 12.9% in IE-stroke vs 11.1% in AF-stroke (P=0.614)"
      },
      {
        "name": "Ischemic lesion recurrence",
        "result": "Substantially higher in IE-stroke: 53.2% vs 18.1% (OR 6.94, 95% CI 3.41-14.12)"
      },
      {
        "name": "3-month mortality",
        "result": "Unadjusted mortality did NOT differ between groups; on adjusted analysis IE-stroke had higher odds of 3-month mortality (OR 3.82, 95% CI 1.71-8.50, P=0.001)"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable - this is a diagnostic-phenotype study with no intervention. Parenchymal hematoma rates were similar between groups (12.9% vs 11.1%, P=0.614)",
      "mortality": "Unadjusted 3-month mortality did not differ; adjusted odds of 3-month mortality were higher in IE-stroke (OR 3.82, 95% CI 1.71-8.50)",
      "other": "Any new ischemic lesion on follow-up DWI within 1 month (symptomatic or silent) in 42 of 79 IE-stroke patients with follow-up imaging (53.2%) versus 21 of 116 AF-stroke patients (18.1%); symptomatic recurrent ischemic stroke 15.3% vs 4.6%"
    },
    "imagingCriteria": "Brain lesion size, number and vascular territories compared. IE eligibility required definite modified Duke criteria; TTE/TEE supported clinical evaluation rather than TTE alone defining IE.",
    "applicabilityNotes": "The imaging phenotype can prompt blood cultures and appropriate TTE/TEE when IE is clinically suspected. IE and AF are not mutually exclusive, and imaging alone does not justify omitting another relevant embolic-source evaluation.",
    "limitations": "Single-centre and retrospective, so both selection and verification bias apply - IE-stroke required definite IE by the modified Duke criteria, with transesophageal echocardiography performed when IE was suspected, but 20.6% of the IE group also had atrial fibrillation, which may blur the phenotype comparison. The extremely wide interval on three-territory involvement (16.20-407.00) indicates near-separation of the groups, which means the model is unstable, not that the effect is enormous. The comparator group is specifically febrile AF-stroke, which is a narrow and unusual population. Baseline NIHSS is not reported, and the adjusted mortality analysis is a secondary finding in 323 patients.",
    "certainty": "low",
    "evidenceType": "observational",
    "citationIds": [
      "cit-ie-vs-af-imaging-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Use the phenotype as a diagnostic clue within the clinical evaluation. Similar group-level hemorrhage rates despite smaller mean infarcts do not establish an individual volume-independent bleeding rule.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'aster',
    shortName: 'ASTER',
    fullName: 'Contact Aspiration vs Stent Retriever for Successful Revascularization (ASTER)',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique'],
    population: {
      n: 381,
      ageRange: 'mean 69.9 y; 174 women (45.7%)',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Within 6 h of symptom onset; median onset-to-arterial-puncture 227 min (IQR 180-280)',
      keyInclusion: ['Acute ischemic stroke with large-vessel occlusion in the anterior circulation', 'Presentation within 6 h of symptom onset', '8 comprehensive stroke centers in France, October 2015-October 2016'],
      keyExclusion: []
    },
    intervention: 'First-line contact aspiration (n=192), assigned at randomization immediately before mechanical thrombectomy',
    comparator: 'First-line stent retriever (n=189)',
    primaryEndpoint: {
      definition: 'Successful revascularization, defined as modified Thrombolysis in Cerebral Infarction (mTICI) 2b or 3 at the end of all endovascular procedures',
      timepoint: 'End of the endovascular procedure',
      result: 'DID NOT show a difference: 164/192 (85.4%) with contact aspiration vs 157/189 (83.1%) with stent retriever',
      effectSize: 'Odds ratio 1.20; absolute difference 2.4%',
      confidenceInterval: '95% CI 0.68 to 2.10 for the OR; 95% CI -5.4% to 9.7% for the absolute difference',
      pValue: 'P=.53'
    },
    secondaryEndpoints: [
      {
        name: 'Change in NIHSS at 24 h',
        result: 'No significant difference between groups (numeric values not given in the abstract)'
      },
      {
        name: 'Overall distribution of 90-day mRS',
        result: 'No significant difference between groups'
      },
      {
        name: 'Trial completion',
        result: '363 of 381 randomized patients (95.3%) completed the trial'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'All-cause 90-day mortality was a prespecified secondary outcome; the abstract reports no significant difference between groups without giving rates',
      other: 'Procedure-related serious adverse events did not differ significantly between the two first-line techniques'
    },
    imagingCriteria: 'Anterior-circulation large-vessel occlusion confirmed on baseline vascular imaging; no advanced perfusion or clot-composition selection was required',
    applicabilityNotes: 'The first randomized head-to-head test of first-line technique, and the anchor for the category. Read it alongside COMPASS (which asked the same question with a 90-day clinical primary endpoint and a formal non-inferiority design), ASTER2 (combined aspiration plus stent retriever vs stent retriever alone) and VECTOR (combined vs aspiration alone in susceptibility-vessel-sign-positive clots). Taken together these four trials say the same thing from four directions: first-line device choice does not decide the outcome. That matters because the evt-technique category otherwise reads as only ANGEL-REBOOT and PROTECT-MT, two trials in which an added manoeuvre was neutral or harmful.',
    limitations: 'Primary endpoint was angiographic, not clinical, and was measured at the end of all procedures rather than after the assigned first-line pass, so crossover and rescue technique dilute the contrast between arms. Open-label with blinded endpoint adjudication. Single-country (France), 6 h window only, and the trial was not powered for 90-day function.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aster-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that either contact aspiration or a stent retriever is a defensible first-line choice for anterior-circulation thrombectomy; the technique argument should not be presented to trainees as settled in either direction.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'compass-thrombectomy',
    shortName: 'COMPASS (thrombectomy)',
    fullName: 'Aspiration thrombectomy versus stent retriever thrombectomy as first-line approach for large vessel occlusion (COMPASS)',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique'],
    population: {
      n: 270,
      ageRange: 'Not specified in the abstract',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Within 6 h of symptom onset',
      keyInclusion: ['Acute ischaemic stroke from anterior-circulation large-vessel occlusion', 'Presentation within 6 h of onset', 'Alberta Stroke Program Early CT Score (ASPECTS) greater than 6', '15 sites (10 hospitals and 4 specialty clinics in the USA, 1 hospital in Canada), 1 June 2015 to 5 July 2017'],
      keyExclusion: []
    },
    intervention: 'Direct aspiration as first pass (n=134); adjunctive technology permitted consistent with the operator\'s standard of care',
    comparator: 'Stent retriever as first line (n=136)',
    primaryEndpoint: {
      definition: 'Non-inferiority of 90-day functional outcome, measured as the proportion achieving mRS 0-2, analysed by intention to treat; prespecified non-inferiority margin 0.15',
      timepoint: '90 d',
      result: 'MET non-inferiority: mRS 0-2 in 69/134 (52%, 95% CI 43.8-60.3) with aspiration first pass vs 67/136 (50%, 95% CI 41.6-57.4) with stent retriever first line',
      effectSize: 'Non-inferiority established against a 0.15 margin',
      confidenceInterval: '95% CI 43.8-60.3 (aspiration) and 41.6-57.4 (stent retriever) for the arm proportions',
      pValue: 'p=0.0014 for non-inferiority'
    },
    secondaryEndpoints: [
      {
        name: 'Any intracranial haemorrhage',
        result: '48/134 (36%) aspiration first pass vs 46/135 (34%) stent retriever first line'
      }
    ],
    safetyFindings: {
      sich: 'Not separately reported in the abstract; any intracranial haemorrhage occurred in 36% vs 34%',
      mortality: 'All-cause mortality at 3 months 30 patients (22%) in both groups',
      other: 'Trial funded by Penumbra, the manufacturer of the aspiration system'
    },
    imagingCriteria: 'Non-contrast CT ASPECTS greater than 6 plus confirmed anterior-circulation large-vessel occlusion',
    applicabilityNotes: 'COMPASS is the trial that carried the technique question from angiography to the patient: unlike ASTER and ASTER2, its primary endpoint was 90-day disability, and its design was formal non-inferiority rather than superiority. Non-inferiority within a 0.15 margin is a wide tolerance, so this establishes that aspiration is an acceptable alternative, not that the two techniques are equivalent. Industry-funded, which is worth naming when the result favours the sponsor\'s device class.',
    limitations: 'Non-inferiority margin of 0.15 is generous relative to the absolute effect sizes seen in thrombectomy trials; open label with blinded outcome assessment and core-lab adjudication; n=270 is modest for a 90-day clinical endpoint; funded by the aspiration-catheter manufacturer; 6 h window only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-compass-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports a direct-aspiration first-pass strategy as an acceptable alternative to a stent retriever for anterior-circulation thrombectomy, judged on 90-day disability rather than on angiographic reperfusion alone.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'aster2',
    shortName: 'ASTER2',
    fullName: 'Thrombectomy With Combined Contact Aspiration and Stent Retriever vs Stent Retriever Alone (ASTER2)',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique'],
    population: {
      n: 408,
      ageRange: 'mean 73 y; 220 women (54%), 185 men (46%) among the 405 analysed',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Up to 8 h after symptom onset',
      keyInclusion: ['Large-vessel occlusion in the anterior circulation', 'Randomized within 8 h of symptom onset', '11 French comprehensive stroke centers, 16 October 2017 to 29 May 2018, with 12-month outcome follow-up'],
      keyExclusion: []
    },
    intervention: 'Initial thrombectomy with contact aspiration and stent retriever combined (n=205 randomized; 203 analysed)',
    comparator: 'Initial thrombectomy with stent retriever alone (n=203 randomized; 202 analysed)',
    primaryEndpoint: {
      definition: 'Rate of expanded Thrombolysis in Cerebral Infarction (eTICI) 2c or 3 — near-total or total reperfusion — at the end of the endovascular procedure',
      timepoint: 'End of the endovascular procedure',
      result: 'DID NOT differ significantly: 131/203 (64.5%) combined vs 117/202 (57.9%) stent retriever alone',
      effectSize: 'Adjusted odds ratio 1.33; risk difference 6.6%',
      confidenceInterval: '95% CI 0.88 to 1.99 for the adjusted OR; 95% CI -3.0% to 16.2% for the risk difference',
      pValue: 'P=.17'
    },
    secondaryEndpoints: [
      {
        name: 'Prespecified secondary efficacy endpoints',
        result: 'Of 14 prespecified secondary efficacy endpoints, 12 showed no significant difference'
      },
      {
        name: 'Successful reperfusion after the assigned initial intervention alone (eTICI 2b50/2c/3)',
        result: '86.2% combined vs 72.3% stent retriever alone; adjusted OR 2.54 (95% CI 1.51-4.28), P<.001'
      },
      {
        name: 'Near-total or total reperfusion after the assigned initial intervention alone (eTICI 2c/3)',
        result: '59.6% combined vs 49.5% stent retriever alone; adjusted OR 1.52 (95% CI 1.02-2.27), P=.04'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported in the abstract',
      other: 'Not reported in the abstract'
    },
    imagingCriteria: 'Anterior-circulation large-vessel occlusion on baseline vascular imaging; no advanced perfusion selection required',
    applicabilityNotes: 'ASTER2 is the cleanest teaching example in this category of an endpoint-timing artefact. Measured after the assigned first-line technique alone, the combined approach reperfused better (eTICI 2c/3 59.6% vs 49.5%, adjusted OR 1.52, P=.04; eTICI 2b50-3 86.2% vs 72.3%, adjusted OR 2.54). Measured on the same eTICI 2c/3 threshold at the end of the whole procedure — the prespecified primary — the difference narrowed and was no longer significant (64.5% vs 57.9%, P=.17), because rescue manoeuvres in the stent-retriever arm caught up. The lesson generalises: an angiographic advantage that rescue technique can erase is not a reason to change first-line practice.',
    limitations: 'Angiographic primary endpoint with no clinical primary; the authors themselves note the trial may have been underpowered to detect smaller between-group differences; open label with blinded endpoint evaluation; single-country (France); enrolment window of 8 h narrower than current practice.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aster2-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Does not support routinely combining contact aspiration with a stent retriever on the first pass; the first-pass reperfusion advantage does not survive to the end of the procedure.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'vector',
    shortName: 'VECTOR',
    fullName: 'Adaptive Endovascular Strategy to the Clot MRI in Large Intracranial Vessel Occlusion (VECTOR): stent retrievers plus contact aspiration versus contact aspiration alone in susceptibility-vessel-sign-positive stroke',
    topic: 'evt-technique',
    diseaseArea: ['acute-ischemic-stroke', 'evt-technique'],
    population: {
      n: 521,
      ageRange: 'median 74.9 y (IQR 64.4-83.3); 284 (55%) female, 237 (45%) male',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Arterial puncture within 24 h of symptom onset',
      keyInclusion: ['Anterior-circulation occlusion positive for the susceptibility vessel sign (SVS) on pretreatment MRI', 'Arterial puncture within 24 h of symptom onset', '22 centres in France, 26 November 2019 to 14 February 2022 (526 enrolled, 521 in the intention-to-treat population)'],
      keyExclusion: ['SVS-negative occlusion on pretreatment MRI']
    },
    intervention: 'Combined technique — stent retriever plus contact aspiration — as the first-line thrombectomy strategy (n=263)',
    comparator: 'Contact aspiration alone as the first-line strategy (n=258)',
    primaryEndpoint: {
      definition: 'eTICI grade 2c or 3 reperfusion after three or fewer passes on the post-treatment angiogram, adjudicated by a blinded independent central imaging core laboratory',
      timepoint: 'After three or fewer passes',
      result: 'DID NOT differ significantly: 152/263 (58%) combined vs 135/258 (52%) contact aspiration alone',
      effectSize: 'Odds ratio 1.27',
      confidenceInterval: '95% CI 0.88 to 1.83',
      pValue: 'p=0.19'
    },
    secondaryEndpoints: [
      {
        name: 'Procedure-related adverse events',
        result: '32/263 (12%) combined vs 27/257 (11%) aspiration alone; OR 1.14 (95% CI 0.65-2.00), p=0.65'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral haemorrhage not separately reported in the abstract; any intracerebral haemorrhage — the most common adverse event — occurred in 146/259 (56%) combined vs 123/251 (49%) aspiration alone; OR 1.32 (95% CI 0.91-1.90), p=0.13',
      mortality: 'All-cause mortality at 3 months 57/251 (23%) combined vs 48/247 (19%) aspiration alone; OR 1.19 (95% CI 0.76-1.86), p=0.45; none judged treatment-related',
      other: 'Funded by Cerenovus'
    },
    imagingCriteria: 'Pretreatment MRI with a positive susceptibility vessel sign — an imaging marker of a friable, red-blood-cell-rich clot',
    applicabilityNotes: 'VECTOR is the field\'s attempt to rescue the technique question by selecting on clot biology rather than on the patient. The premise — that SVS-positive, red-cell-rich clots are the ones a stent retriever should grip best — is mechanistically appealing and observationally supported, and the trial still returned a null. That is the most useful thing in this category: an enrichment strategy built on a plausible mechanism did not convert a neutral technique comparison into a positive one. Note also the wide 24 h window and the older, MRI-selected population (median age 74.9).',
    limitations: 'Angiographic primary endpoint rather than a clinical one; requires pretreatment MRI, which many centres cannot obtain before thrombectomy, limiting external validity; open label with blinded core-lab adjudication; single-country (France); industry-funded (Cerenovus).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-vector-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Even when the clot is selected on MRI as red-cell-rich, adding a stent retriever to contact aspiration on the first pass does not improve near-complete reperfusion within three passes; either first-line strategy remains defensible.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'siesta',
    shortName: 'SIESTA',
    fullName: 'Sedation vs Intubation for Endovascular Stroke Treatment (SIESTA)',
    topic: 'evt-anesthesia',
    diseaseArea: ['acute-ischemic-stroke', 'evt-anesthesia'],
    population: {
      n: 150,
      ageRange: 'mean 71.5 y; 60 women (40%)',
      nihssRange: 'greater than 10 required for entry; median NIHSS 17',
      timeWindow: 'Not specified in the abstract',
      keyInclusion: ['Acute ischemic stroke in the anterior circulation', 'NIHSS greater than 10', 'Isolated or combined occlusion at any level of the internal carotid or middle cerebral artery', 'Single centre, Heidelberg University Hospital, Germany, April 2014 to February 2016'],
      keyExclusion: []
    },
    intervention: 'Nonintubated conscious sedation during thrombectomy (n=77) — the arm hypothesised to be superior',
    comparator: 'Intubated general anesthesia during thrombectomy (n=73)',
    primaryEndpoint: {
      definition: 'Early neurological improvement on the NIHSS at 24 h (scale 0-42; a 4-point difference was prespecified as clinically relevant); the trial tested whether conscious sedation is SUPERIOR to general anesthesia',
      timepoint: '24 h',
      result: 'DID NOT meet superiority: general anesthesia NIHSS 16.8 at admission to 13.6 at 24 h (difference -3.2, 95% CI -5.6 to -0.8) vs conscious sedation 17.2 to 13.6 (difference -3.6, 95% CI -5.5 to -1.7)',
      effectSize: 'Mean difference between groups -0.4',
      confidenceInterval: '95% CI -3.4 to 2.7',
      pValue: 'P=.82'
    },
    secondaryEndpoints: [
      {
        name: 'Prespecified secondary outcomes overall',
        result: 'Of 47 prespecified secondary outcomes analysed, 41 showed no significant difference'
      },
      {
        name: 'Functional independence (unadjusted mRS 0-2) at 3 months',
        result: '37.0% with general anesthesia vs 18.2% with conscious sedation; P=.01 — an unadjusted secondary outcome, in the opposite direction to the trial\'s hypothesis'
      },
      {
        name: 'Substantial patient movement during the procedure',
        result: '0% with general anesthesia vs 9.1% with conscious sedation; difference 9.1%, P=.008'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'No difference at 3 months: 24.7% in both groups',
      other: 'General anesthesia carried more postinterventional complications: hypothermia 32.9% vs 9.1% (P<.001), delayed extubation 49.3% vs 6.5% (P<.001), and pneumonia 13.7% vs 3.9% (P=.03)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'SIESTA was designed to confirm the observational literature that general anesthesia is harmful, and it did the opposite: the primary endpoint was flat and the 3-month functional secondary favoured general anesthesia. The 37.0% vs 18.2% figure is an unadjusted secondary outcome in a 150-patient single-centre trial, so it is hypothesis-generating, not a result to act on alone — but together with the contemporaneous single-centre GOLIATH and AnStroke trials it reopened the anesthesia question, which later work such as CANVAS II and the pooled Bayesian meta-analysis took up. The airway cost is real and belongs beside the efficacy signal.',
    limitations: 'Single centre; n=150; primary endpoint was a 24-h neurological score rather than 90-day disability; open label with blinded outcome evaluation; 47 secondary outcomes analysed without a stated multiplicity correction, so the significant ones must be read as exploratory; entry restricted to NIHSS greater than 10, so it says nothing about milder deficits.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-siesta-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Does not support routinely avoiding general anesthesia for thrombectomy; teaches that the airway decision trades procedural stillness against hypothermia, delayed extubation and pneumonia.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'goliath',
    shortName: 'GOLIATH',
    fullName: 'General or Local Anesthesia in Intra Arterial Therapy (GOLIATH)',
    topic: 'evt-anesthesia',
    diseaseArea: ['acute-ischemic-stroke', 'evt-anesthesia'],
    population: {
      n: 128,
      ageRange: 'mean 71.4 y (SD 11.4); 62 women (48.4%)',
      nihssRange: 'median NIHSS 18 (IQR 14-21)',
      timeWindow: 'Within 6 h of onset',
      keyInclusion: ['Acute ischemic stroke caused by anterior-circulation large-vessel occlusion', 'Within 6 h of onset', 'Single centre, Aarhus University Hospital, Denmark, 12 March 2015 to 2 February 2017; 1,501 patients screened to enrol 128'],
      keyExclusion: []
    },
    intervention: 'General anesthesia during endovascular therapy (n=65)',
    comparator: 'Conscious sedation during endovascular therapy (n=63); 4 patients (6.3%) crossed over to general anesthesia',
    primaryEndpoint: {
      definition: 'Infarct growth between the MRI performed before endovascular therapy and the MRI performed 48-72 h afterwards; the prespecified hypothesis was that conscious sedation would produce LESS infarct growth',
      timepoint: '48-72 h post-procedure MRI',
      result: 'DID NOT meet the prespecified hypothesis — the difference was not statistically significant, and the numerical direction favoured general anesthesia: median (IQR) growth 8.2 (2.2-38.6) mL with general anesthesia vs 19.4 (2.4-79.0) mL with conscious sedation',
      effectSize: 'Median infarct growth 8.2 mL vs 19.4 mL',
      confidenceInterval: 'Not reported in the abstract',
      pValue: 'P=.10'
    },
    secondaryEndpoints: [
      {
        name: 'Successful reperfusion',
        result: '76.9% with general anesthesia vs 60.3% with conscious sedation; P=.04'
      },
      {
        name: 'Shift to a lower 90-day mRS',
        result: 'Odds ratio 1.91 (95% CI 1.03-3.56) favouring general anesthesia'
      },
      {
        name: 'Crossover',
        result: '4 of 63 patients (6.3%) allocated to conscious sedation were converted to general anesthesia'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported in the abstract',
      other: 'Not reported in the abstract'
    },
    imagingCriteria: 'MRI before endovascular therapy and again at 48-72 h, used to measure the primary endpoint of infarct growth',
    applicabilityNotes: 'GOLIATH is the only anesthesia trial with a tissue-level primary endpoint, and it is the trial most often mis-cited as showing that general anesthesia is better. It did not: the primary endpoint was negative at P=.10. The mRS shift OR of 1.91 with a lower bound of 1.03 is a secondary outcome in a 128-patient single-centre trial, and a confidence interval that only just clears 1 in that setting is fragile. What GOLIATH does establish, together with SIESTA and AnStroke, is that the observational claim of harm from general anesthesia is not reproduced under randomization.',
    limitations: 'Single centre with a highly selected sample (1,501 screened, 128 enrolled), which limits generalisability; primary endpoint was an imaging surrogate; the favourable functional finding is a secondary outcome with a 95% confidence interval whose lower bound (1.03) is near 1; 6 h window only; open label with blinded endpoint evaluation.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-goliath-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'General anesthesia for thrombectomy did not produce worse tissue or clinical outcomes than conscious sedation, so an anesthesia plan should be chosen on airway, agitation and workflow grounds rather than on a presumed harm from intubation.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'anstroke',
    shortName: 'AnStroke',
    fullName: 'General Anesthesia Versus Conscious Sedation for Endovascular Treatment of Acute Ischemic Stroke: The AnStroke Trial (Anesthesia During Stroke)',
    topic: 'evt-anesthesia',
    diseaseArea: ['acute-ischemic-stroke', 'evt-anesthesia'],
    population: {
      n: 90,
      ageRange: 'Not specified in the abstract',
      nihssRange: 'Not specified in the abstract (admission NIHSS was recorded and balanced)',
      timeWindow: 'Not specified in the abstract',
      keyInclusion: ['Patients receiving endovascular treatment for acute ischemic stroke', 'Enrolled 2013-2016', 'Single centre, Sahlgrenska University Hospital, Gothenburg, Sweden'],
      keyExclusion: []
    },
    intervention: 'General anesthesia during endovascular treatment (n=45)',
    comparator: 'Conscious sedation during endovascular treatment (n=45)',
    primaryEndpoint: {
      definition: 'Neurological outcome at 3 months measured by the modified Rankin Scale',
      timepoint: '3 months',
      result: 'NO DIFFERENCE: mRS 0-2 achieved by 19/45 (42.2%) with general anesthesia vs 18/45 (40.0%) with conscious sedation',
      effectSize: 'Absolute difference 2.2 percentage points',
      confidenceInterval: 'Not reported in the abstract',
      pValue: 'P=1.00'
    },
    secondaryEndpoints: [
      {
        name: 'Successful recanalization',
        result: '91.1% with general anesthesia vs 88.9% with conscious sedation; P=1.00'
      },
      {
        name: 'NIHSS at 24 h',
        result: 'Median 8 with general anesthesia vs 9 with conscious sedation; P=.60'
      },
      {
        name: 'Cerebral infarction volume',
        result: 'Median 20 mL in both groups; P=.53'
      },
      {
        name: 'Intraprocedural physiology',
        result: 'No difference in blood-pressure decline from baseline (P=.57), blood glucose (P=.94), PaCO2 (P=.68) or time intervals (P=.78)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'In-hospital mortality 13.3% in both groups; P=1.00',
      other: 'The trial protocolised intraprocedural blood pressure, and no between-arm difference in blood-pressure decline was observed — relevant because hypotension is the mechanism usually blamed for harm from general anesthesia'
    },
    imagingCriteria: '',
    applicabilityNotes: 'AnStroke is the flattest of the three European single-centre anesthesia trials — no signal anywhere, in either direction. Its distinctive contribution is physiological: blood-pressure decline from baseline did not differ between arms (P=.57), so a differential fall in blood pressure, the mechanism most often invoked to explain harm from general anesthesia in retrospective series, was not seen here. With only 90 patients it is consistent with, but cannot by itself establish, the view that the observational association between general anesthesia and poor outcome reflected confounding (for example by stroke severity) rather than a causal effect of the anesthetic.',
    limitations: 'Single centre; n=90, badly underpowered for a 90-day functional endpoint (a null result here is uninformative about modest effects); the PubMed abstract\'s rendering of several dispersion statistics is garbled, so only the point estimates and p-values are reproduced here; onset-to-treatment window and NIHSS range not stated in the abstract.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-anstroke-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a neutral, physiologically controlled data point: with blood pressure managed to protocol, general anesthesia and conscious sedation produced the same 3-month outcomes.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'canvas-ii',
    shortName: 'CANVAS II',
    fullName: 'Choice of Anesthesia for Endovascular Treatment of Acute Ischemic Stroke (CANVAS II): General Anesthesia vs Conscious Sedation in Posterior Circulation Stroke',
    topic: 'evt-anesthesia',
    diseaseArea: ['acute-ischemic-stroke', 'evt-anesthesia', 'evt-basilar'],
    population: {
      n: 87,
      ageRange: 'mean 62 y (SD 12); 16 female (18.4%), 71 male (81.6%)',
      nihssRange: 'median NIHSS 15 (IQR 12-17)',
      timeWindow: 'Not specified in the abstract',
      keyInclusion: ['Adults with acute POSTERIOR circulation ischemic stroke undergoing endovascular treatment', '2 comprehensive care hospitals in China, March 2018 to June 2021', '210 patients admitted with acute posterior-circulation ischemic stroke; 93 recruited; 87 in the intention-to-treat analysis'],
      keyExclusion: []
    },
    intervention: 'General anesthesia during endovascular treatment (n=43)',
    comparator: 'Conscious sedation during endovascular treatment (n=44); 13 of these patients (29.5%) were ultimately converted to general anesthesia',
    primaryEndpoint: {
      definition: 'Functional independence at 90 days on the modified Rankin Scale; the trial asked whether conscious sedation is a feasible alternative to general anesthesia in posterior-circulation stroke',
      timepoint: '90 d',
      result: 'NO SIGNIFICANT DIFFERENCE: functional independence 48.8% with general anesthesia vs 54.5% with conscious sedation',
      effectSize: 'Risk ratio 0.89; adjusted odds ratio 0.91',
      confidenceInterval: '95% CI 0.58 to 1.38 for the risk ratio; 95% CI 0.37 to 2.22 for the adjusted odds ratio',
      pValue: 'Not reported in the abstract; the confidence intervals include the null'
    },
    secondaryEndpoints: [
      {
        name: 'Successful reperfusion (mTICI 2b-3), intention-to-treat',
        result: '95.3% with general anesthesia vs 77.3% with conscious sedation; adjusted OR 5.86 (95% CI 1.16-29.53) — favours general anesthesia'
      },
      {
        name: 'Crossover from conscious sedation',
        result: '13 of 44 patients (29.5%) allocated to conscious sedation were transferred to general anesthesia'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported in the abstract',
      other: 'Not reported in the abstract'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The only randomized anesthesia trial confined to the posterior circulation, and the reason it matters is the crossover rate: nearly a third of patients assigned to conscious sedation ended up intubated anyway. In a patient with brainstem ischaemia, depressed consciousness and an unprotected airway, \'conscious sedation\' is often a plan that does not survive contact with the procedure. The reperfusion difference (95.3% vs 77.3%) is a wide, imprecise adjusted odds ratio in 87 patients and should be read as consistent with the anterior-circulation trials rather than as an independent finding.',
    limitations: 'Explicitly an EXPLORATORY trial, not a definitive one; n=87 after 210 screened; two centres in a single country; 29.5% crossover from conscious sedation to general anesthesia, which biases an intention-to-treat comparison toward the null; the secondary reperfusion odds ratio spans 1.16 to 29.53, so its magnitude is uninterpretable; the abstract does not report symptomatic haemorrhage or mortality.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-canvas-ii-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In posterior-circulation thrombectomy, conscious sedation was not better than general anesthesia and frequently converted to it — so plan the airway ahead of the case rather than defaulting to sedation.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ga-vs-nonga-bayesian-meta-2026',
    shortName: 'GA vs non-GA Bayesian meta-analysis',
    fullName: 'General Anesthesia Versus Non-GA in Endovascular Therapy for Acute Ischemic Stroke: A Systematic Review and Bayesian Meta-Analysis of RCTs',
    topic: 'evt-anesthesia',
    diseaseArea: ['acute-ischemic-stroke', 'evt-anesthesia'],
    population: {
      n: 1601,
      ageRange: 'mean 70.0 y; 46.6% female',
      nihssRange: 'Per the contributing trials',
      timeWindow: 'Per the contributing trials',
      keyInclusion: ['Ten randomized controlled trials comparing general anesthesia with non-general-anesthesia strategies during endovascular thrombectomy in adults with acute ischemic stroke', 'PubMed/MEDLINE, Embase and the Cochrane Central Register of Controlled Trials searched from inception to 3 January 2026', 'Bayesian random-effects models with weakly informative priors; a posterior probability of superiority above 80% was prespecified as substantial evidence of benefit'],
      keyExclusion: []
    },
    intervention: 'General anesthesia during endovascular therapy',
    comparator: 'Non-general-anesthesia strategies (conscious sedation or local anesthesia; comparators were heterogeneous across trials)',
    primaryEndpoint: {
      definition: 'Functional independence, mRS 0-2 at 90 days, reported as a Bayesian odds ratio with a 95% credible interval and a posterior probability of superiority (prespecified threshold above 80%)',
      timepoint: '90 d',
      result: 'Signal favouring general anesthesia, but the credible interval INCLUDES the null: OR 1.24 with a 94.2% posterior probability of superiority',
      effectSize: 'Odds ratio 1.24',
      confidenceInterval: '95% credible interval 0.94 to 1.66',
      pValue: 'No frequentist p-value; posterior probability of superiority 94.2%'
    },
    secondaryEndpoints: [
      {
        name: 'Successful reperfusion (TICI 2b-3)',
        result: 'OR 1.73 (95% CrI 1.23-2.43); posterior probability of superiority above 99% — the one outcome where general anesthesia is clearly better'
      },
      {
        name: '90-day mortality',
        result: 'OR 0.92 (95% CrI 0.67-1.27); posterior probability 69% — no substantial difference'
      },
      {
        name: 'Excellent outcome (mRS 0-1)',
        result: 'OR 1.06 (95% CrI 0.80-1.41); posterior probability 67% — no substantial difference'
      },
      {
        name: 'Symptomatic intracranial hemorrhage',
        result: 'OR 0.93 (95% CrI 0.56-1.52); posterior probability 62% — no substantial difference'
      }
    ],
    safetyFindings: {
      sich: 'OR 0.93 (95% CrI 0.56-1.52); no substantial difference',
      mortality: 'OR 0.92 (95% CrI 0.67-1.27); no substantial difference',
      other: 'General anesthesia increased intraoperative hypotension (OR 4.28, 95% CrI 2.35-7.86) and pneumonia (OR 1.60, 95% CrI 0.95-2.81)'
    },
    imagingCriteria: 'Per the contributing trials',
    applicabilityNotes: 'This is the record that makes the anesthesia category legible: SIESTA, GOLIATH, AnStroke and CANVAS II were each individually neutral on their primary endpoints, and pooling all ten randomized trials produces a functional-outcome estimate whose credible interval still crosses 1 (OR 1.24, 95% CrI 0.94-1.66). A 94.2% posterior probability of superiority sounds decisive and is not: it is the probability that the true effect is on the favourable side of no effect, not a demonstration of benefit, and the authors themselves conclude only that general anesthesia \'may be preferred but confirmatory evidence is needed\'. The one unambiguous finding is reperfusion (OR 1.73, CrI 1.23-2.43), and that comes with about four-fold higher odds of intraoperative hypotension (OR 4.28, 95% CrI 2.35-7.86).',
    limitations: 'Pools open-label trials with heterogeneous non-general-anesthesia comparators, so the control condition is not one thing; several contributing trials are small single-centre studies; Bayesian posterior probabilities depend on the choice of weakly informative priors; a pooled estimate cannot resolve which patient should get which airway; the reperfusion advantage is an angiographic surrogate that did not translate into an unambiguous functional gain.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ga-nonga-bayesian-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Across all ten randomized trials, general anesthesia improves reperfusion and shows a functional-outcome signal that does not reach the level of demonstrated benefit, while costing more intraprocedural hypotension and pneumonia — a reason to stop treating conscious sedation as the safer default, not a mandate to intubate everyone.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ceres-tandem',
    shortName: 'CERES-TANDEM',
    fullName: 'Emergent Carotid Stenting for Acute Anterior Circulation Ischemic Stroke With Tandem Lesions: The Multicenter CERES-TANDEM Study',
    topic: 'tandem-lesions',
    diseaseArea: ['acute-ischemic-stroke', 'tandem-lesions'],
    population: {
      n: 4053,
      ageRange: 'mean 70 y; 65.5% female',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Within 24 h of symptom onset (presentation beyond 24 h was an exclusion)',
      keyInclusion: ['Consecutive adults treated for anterior-circulation acute ischemic stroke due to tandem lesions', '49 comprehensive stroke centres in Europe, North America and Singapore, 1 January 2018 to 31 December 2024', 'International multicenter longitudinal RETROSPECTIVE cohort (NCT06965036) — treatment was chosen by the operator, not randomly assigned'],
      keyExclusion: ['Primary hemorrhagic stroke', 'Absence of an intracranial occlusion', 'Presentation more than 24 h from symptom onset', 'Age under 18']
    },
    intervention: 'Emergent carotid stenting (eCAS) of the cervical internal carotid lesion during endovascular thrombectomy (n=2,522) — an operator decision, not a randomized allocation',
    comparator: 'No stenting during thrombectomy (n=1,531)',
    primaryEndpoint: {
      definition: '90-day modified Rankin Scale shift, analysed by stabilized inverse-probability-of-treatment-weighted (IPTW) ordinal regression; this is an ASSOCIATION in a non-randomized cohort, not a randomized treatment effect',
      timepoint: '90 d',
      result: 'Emergent carotid stenting was ASSOCIATED WITH a better mRS shift after IPTW weighting',
      effectSize: 'Common odds ratio 1.31',
      confidenceInterval: '95% CI 1.17 to 1.47',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [
      {
        name: 'mRS 0-1 at 90 days',
        result: 'OR 1.27 (95% CI 1.08-1.50), p=0.005'
      },
      {
        name: 'mRS 0-2 at 90 days',
        result: 'OR 1.30 (95% CI 1.13-1.51), p<0.001'
      },
      {
        name: 'Direct-effect estimand adjusting for successful recanalization and sICH',
        result: 'Common OR 1.17 (95% CI 1.04-1.31), p=0.008'
      },
      {
        name: 'Never-crossers stratum estimand',
        result: 'Common OR 1.37 (95% CI 1.21-1.55), p<0.001'
      },
      {
        name: 'Sensitivity analysis including recanalization in the IPTW framework',
        result: 'Common OR 1.14 (95% CI 1.02-1.27), p=0.008'
      },
      {
        name: 'Subgroup interactions',
        result: 'No interaction for intracranial occlusion site, IV thrombolysis, sedation technique, endovascular approach, or access site'
      }
    ],
    safetyFindings: {
      sich: 'No significant increase with stenting: OR 1.21 (95% CI 0.93-1.56), p=0.15',
      mortality: 'Not reported in the abstract',
      other: 'The authors grade the study as providing Class II evidence'
    },
    imagingCriteria: 'Tandem lesion — an intracranial anterior-circulation occlusion together with a cervical internal carotid steno-occlusive lesion — confirmed on vascular imaging; absence of an intracranial occlusion was an exclusion',
    applicabilityNotes: 'The largest tandem-lesion dataset in existence, and the first record in this category, so it is important to say plainly what it is and is not. It is a retrospective cohort in which the interventionalist chose whether to stent, and confounding by indication runs in an obvious direction: the patients an operator judges suitable for an acute stent are the ones with a workable anatomy, a tolerable infarct burden and a plan for antiplatelet therapy. IPTW weighting, a direct-effect estimand and a never-crossers stratum all address measured confounders and none can address unmeasured ones. The randomized answers are pending in TITAN, EASI-TOC and PICASSO; until they report, whether to stent the cervical carotid during thrombectomy is preference, not evidence.',
    limitations: 'Retrospective, non-randomized, with treatment allocation by operator judgement — confounding by indication is the leading alternative explanation for the entire result. Registered on ClinicalTrials.gov but observational in design. sICH definition and ascertainment vary across 49 centres and 7 years. Mortality, antiplatelet regimen and stent-patency outcomes are not reported in the abstract. The consistent effect across three estimands demonstrates internal robustness to the modelled confounders only.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-ceres-tandem-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Provides the largest real-world signal that stenting the cervical carotid during thrombectomy for a tandem lesion tracks with better 90-day recovery without more symptomatic haemorrhage — an association to weigh, not a randomized result to follow.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'iris-tandem-stenting',
    shortName: 'IRIS tandem-lesion carotid-stenting analysis',
    fullName: 'Acute Carotid Stenting for Tandem Lesions in Patients Randomized to Endovascular Treatment With or Without Thrombolysis: Results From the IRIS Individual Participant Data Meta-Analysis',
    topic: 'tandem-lesions',
    diseaseArea: ['acute-ischemic-stroke', 'tandem-lesions'],
    population: {
      n: 340,
      ageRange: 'Not specified in the abstract',
      nihssRange: 'Not specified in the abstract',
      timeWindow: 'Per the contributing trials; all patients presented directly to endovascular-capable centres',
      keyInclusion: ['Individual participant data from 6 randomized clinical trials of IV thrombolysis plus endovascular treatment versus endovascular treatment alone, conducted in Asia, Europe and Oceania between 2017 and 2021', '340 of 2,267 randomized patients (15%) had carotid tandem lesions', '113 of 329 patients with tandem lesions (34%) underwent acute carotid stenting'],
      keyExclusion: ['CRITICAL DESIGN POINT: the randomization in these trials was IV thrombolysis versus no IV thrombolysis. The decision to place a carotid stent was NOT randomized, so the stenting comparison is a non-randomized analysis nested inside randomized cohorts.']
    },
    intervention: 'Acute carotid stenting during endovascular treatment (n=113) — an operator decision, not a randomized allocation',
    comparator: 'No acute carotid stenting during endovascular treatment (n=216)',
    primaryEndpoint: {
      definition: '90-day modified Rankin Scale score, assessed with mixed-effect ordinal regression; an ASSOCIATION, because stenting was not the randomized variable',
      timepoint: '90 d',
      result: 'Acute carotid stenting was ASSOCIATED WITH better 90-day functional outcomes; confirmed on inverse-probability-of-treatment weighting (adjusted common OR 1.66, 95% CI 1.08-2.54)',
      effectSize: 'Adjusted common odds ratio 1.60',
      confidenceInterval: '95% CI 1.03 to 2.47',
      pValue: 'Not reported in the abstract; the confidence interval excludes 1'
    },
    secondaryEndpoints: [
      {
        name: 'Effect modification by prior IV thrombolysis',
        result: 'No heterogeneity: adjusted common OR 2.07 (95% CI 1.06-4.07) in patients randomized to IVT plus EVT vs 1.21 (95% CI 0.59-2.50) in those randomized to EVT alone; p for interaction 0.81'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial hemorrhage 6.3% with stenting vs 3.7% without; adjusted OR 2.09 (95% CI 0.78-5.59) — not statistically significant, but the point estimate is a doubling and the interval is wide enough to be compatible with meaningful harm',
      mortality: 'Not reported in the abstract',
      other: 'Any intracranial hemorrhage 44% with stenting vs 35% without; adjusted OR 1.30 (95% CI 0.79-2.15)'
    },
    imagingCriteria: 'Carotid tandem lesion identified in the parent trials',
    applicabilityNotes: 'This analysis exists to answer one specific bedside reflex — that a patient who has already received IV thrombolysis should not receive an acute carotid stent because of bleeding risk. It found no interaction (p=0.81) between prior thrombolysis and the association between stenting and outcome. Read it beside CERES-TANDEM: two independent datasets, both non-randomized, both pointing the same way, and neither able to exclude confounding by indication. Note also that this is not the IRIS individual-participant meta-analysis of the thrombolysis question itself, and it is unrelated to the tocilizumab trial that also uses the acronym IRIS — always name the analysis, never write bare \'IRIS\'.',
    limitations: 'The stenting decision was not randomized; only the thrombolysis decision was, so this is an observational comparison with the same confounding-by-indication problem as any registry. Only 113 stented patients, which is why the symptomatic-haemorrhage interval (0.78 to 5.59) cannot rule out real harm. Denominators shift between analyses in the source abstract (340 tandem lesions identified, 329 with stenting status available). The parent trials enrolled only patients presenting directly to endovascular-capable centres, excluding transferred patients.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-iris-tandem-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that prior IV thrombolysis did not modify the association between acute carotid stenting and 90-day outcome in tandem lesions — evidence against treating a preceding lytic as an automatic contraindication to stenting, while the randomized question remains open.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "discount",
    "shortName": "DISCOUNT",
    "fullName": "Mechanical Thrombectomy in Ischemic Stroke With a Medium or Distal Arterial Occlusion: The DISCOUNT Randomized Clinical Trial",
    "topic": "evt-mevo",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "evt-mevo"
    ],
    "population": {
      "n": 244,
      "ageRange": "median 75 y (IQR 67-81); 56% male",
      "nihssRange": "median NIHSS 8 (IQR 6-12)",
      "timeWindow": "Within 8 h of symptom onset, or within 24 h of last seen well if no hyperintense signal was present on FLAIR imaging",
      "keyInclusion": [
        "Acute ischemic stroke due to a PRIMARY and ISOLATED medium or distal vessel occlusion",
        "22 stroke centres in France, November 2021 to April 2025",
        "244 of a planned 488 patients randomized before the trial was stopped",
        "NCT05030142"
      ],
      "keyExclusion": []
    },
    "intervention": "Mechanical thrombectomy in addition to medical treatment (n=123); 100 of the 123 (81%) actually received thrombectomy",
    "comparator": "Medical treatment alone (n=121); none received thrombectomy",
    "primaryEndpoint": {
      "definition": "Good clinical outcome at 3 months, defined as mRS 0-2, assessed by an independent blinded assessor",
      "timepoint": "3 months",
      "result": "DID NOT meet its endpoint, with the point estimate favouring medical treatment alone: 72/116 (62%) with thrombectomy vs 81/119 (68%) with medical treatment alone. The trial was STOPPED at the planned interim analysis on the recommendation of the data and safety monitoring board for futility AND an increased rate of symptomatic intracranial hemorrhage with thrombectomy.",
      "effectSize": "Odds ratio 0.73; adjusted absolute difference -6.8%",
      "confidenceInterval": "95% CI 0.40 to 1.31 for the odds ratio; 95% CI -19.4% to 5.7% for the adjusted absolute difference",
      "pValue": "P=.29"
    },
    "secondaryEndpoints": [
      {
        "name": "Follow-up completeness",
        "result": "217 of 244 randomized patients (89%) completed follow-up"
      },
      {
        "name": "Trial conduct",
        "result": "Halted at the planned interim analysis at 244 of a planned 488 patients on DSMB recommendation"
      }
    ],
    "safetyFindings": {
      "sich": "AS-TREATED, NOT RANDOMIZED: among the 100 patients who actually underwent thrombectomy compared with those who did not, symptomatic intracranial hemorrhage occurred in 11% vs 3% (P=.008). This comparison describes the procedural risk borne by patients who had the procedure; it is not a randomized estimate of harm and must never be quoted as one.",
      "mortality": "No significant difference: 6% with thrombectomy vs 8% with medical treatment alone; P=.49",
      "other": "Also as-treated: subarachnoid hemorrhage 13% vs 2% (P<.001) and embolus migration 5% vs 1% (P=.04)"
    },
    "imagingCriteria": "Primary isolated medium or distal vessel occlusion on vascular imaging; for the 8-24 h last-seen-well window, absence of a hyperintense signal on FLAIR was required. No perfusion-mismatch requirement.",
    "applicabilityNotes": "A randomized trial of thrombectomy for medium and distal vessel occlusion published in full after DISTAL, ESCAPE-MeVO and ORIENTAL-MeVO (interim results were presented in 2025), and the only one of these trials stopped early by its DSMB. DISTAL and ESCAPE-MeVO were neutral, with numerically more symptomatic intracranial haemorrhage after thrombectomy in both (5.9% vs 2.6%, which the DISTAL investigators described as similar; 5.4% vs 2.2%) and higher 90-day mortality in ESCAPE-MeVO (13.3% vs 8.4%; adjusted HR 1.82); DISCOUNT is neutral on the randomized primary endpoint and adds as-treated data on subarachnoid haemorrhage and embolus migration, the complications of navigating a microcatheter into a small distal vessel. Do not describe the medium-vessel literature as a closed three-trial set: the DISTAL 12-month report states that three of four randomized trials showed no benefit, and ORIENTAL-MeVO is already in this corpus as a positive trial, so the count is moving. Note also that these patients had moderate deficits (median NIHSS 8) and were old (median 75), and that 19% of the thrombectomy arm never underwent the procedure.",
    "limitations": "Stopped at about half planned enrollment, with wide primary intervals and uncertainty about smaller effects. Hemorrhage rates use an as-treated comparison, not randomized treatment assignment; the direction and magnitude of any difference from ITT require the actual analysis sets and crossover outcomes. Open label with blinded outcomes; 19% assigned thrombectomy did not receive it. Preserve population and endpoint specificity.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-discount-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Adds a randomized trial halted for futility plus a haemorrhage signal to the medium- and distal-vessel occlusion evidence, and supplies the procedural-complication data — subarachnoid haemorrhage and embolus migration — from its as-treated comparison; DISTAL and ESCAPE-MeVO also had numerically more symptomatic haemorrhage with thrombectomy.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "verificationNotes": "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified."
  }),
  t({
    id: 'veritas',
    shortName: 'VERITAS',
    fullName: 'Endovascular therapy for acute vertebrobasilar occlusion (VERITAS): a systematic review and individual patient data meta-analysis',
    topic: 'evt-basilar',
    diseaseArea: ['acute-ischemic-stroke', 'evt-basilar'],
    population: {
      n: 988,
      ageRange: 'median 67 y (IQR 58-74); 686 (69%) male, 302 (31%) female',
      nihssRange: 'Per the contributing trials; treatment effect was heterogeneous by baseline severity, with an uncertain effect at baseline NIHSS below 10',
      timeWindow: '904 of 988 patients (91%) were randomly assigned within 12 h of estimated stroke onset',
      keyInclusion: ['Individual patient data pooled from four randomized trials of endovascular therapy versus standard medical treatment in vertebrobasilar ischaemic stroke: ATTENTION, BAOCHE, BASICS and BEST', 'Studies conducted between 1 January 2010 and 1 September 2023; 934 titles and abstracts screened, 7 full texts reviewed, 4 trials included', '556 patients (56%) in the endovascular groups and 432 (44%) in the control groups', 'Three of the four contributing trials were conducted in Chinese populations; one enrolled European and Brazilian patients'],
      keyExclusion: []
    },
    intervention: 'Endovascular therapy (n=556)',
    comparator: 'Standard medical treatment alone (n=432)',
    primaryEndpoint: {
      definition: 'Favourable functional status at 90 days, defined as mRS 0-3 (a score of 3 indicating moderate disability)',
      timepoint: '90 d',
      result: 'POSITIVE: mRS 0-3 in 251/556 (45%) with endovascular therapy vs 128/432 (30%) with control',
      effectSize: 'Adjusted common odds ratio 2.41',
      confidenceInterval: '95% CI 1.78 to 3.26',
      pValue: 'p<0.0001'
    },
    secondaryEndpoints: [
      {
        name: 'Functional independence (mRS 0-2) at 90 days',
        result: '194 (35%) with endovascular therapy vs 89 (21%) with control; adjusted common OR 2.52 (95% CI 1.82-3.48), p<0.0001'
      },
      {
        name: 'Overall degree of disability (ordinal mRS shift) at 90 days',
        result: 'Adjusted common OR 2.09 (95% CI 1.61-2.71), p<0.0001'
      },
      {
        name: 'Effect modification — where benefit is uncertain',
        result: 'Heterogeneity of treatment effect was found for baseline stroke severity (uncertain effect at baseline NIHSS below 10) and for occlusion site (greater benefit with more proximal occlusions)'
      },
      {
        name: 'Effect modification — where benefit was consistent',
        result: 'NO heterogeneity across subgroups defined by age, sex, baseline posterior-circulation ASPECTS, presence of atrial fibrillation, intracranial atherosclerotic disease, or time from onset to imaging'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage 30/548 (5%) with endovascular therapy vs 2/413 (under 1%) with control; odds ratio 11.98 (95% CI 2.82-50.81), p<0.0001 — a large relative increase on a small absolute base, and the confidence interval is very wide',
      mortality: '90-day mortality 198/556 (36%) with endovascular therapy vs 196/432 (45%) with control; odds ratio 0.60 (95% CI 0.45-0.80), p<0.0001',
      other: 'Both arms have high absolute mortality, which is the natural history of basilar occlusion rather than a treatment effect'
    },
    imagingCriteria: 'Per the contributing trials; baseline posterior-circulation ASPECTS did not modify the treatment effect within the enrolled range, but the authors state that benefit remains uncertain in patients with extensive infarcts on neuroimaging',
    applicabilityNotes: 'This is the quantitative anchor for the basilar category and the place in the corpus where BASICS (which also has its own record) and BEST — the two earlier, individually inconclusive trials — are pooled with ATTENTION and BAOCHE. Two of its findings correct commonly taught heuristics. First, benefit was not modified by posterior-circulation ASPECTS within the range the trials enrolled, but that range was pre-selected: ATTENTION and BAOCHE listed pc-ASPECTS below 6 among their imaging exclusions, and BASICS and BEST excluded bilateral extended brainstem ischaemia. This absence of a detected interaction therefore does not undercut the widely used \'pc-ASPECTS 6 or above\' threshold or support thrombectomy in extensive posterior-circulation infarction; the VERITAS authors state that benefit remains uncertain with extensive infarcts on neuroimaging, and the ESO/ESMINT 2024 guideline suggests against reperfusion therapy when there are extensive bilateral and/or brainstem ischaemic changes. Second, the effect WAS modified by baseline severity, with an uncertain effect below NIHSS 10 — which aligns with the ESO/ESMINT 2024 basilar guideline\'s statement that there is no evidence to recommend endovascular therapy over medical treatment alone at NIHSS below 10. The mortality reduction (36% vs 45%) and the symptomatic-haemorrhage increase (5% vs under 1%) are the two numbers a clinician actually needs when consenting.',
    limitations: 'Three of the four contributing trials were conducted in Chinese populations, where intracranial atherosclerotic disease is the dominant mechanism, so generalisability to Western populations rests largely on BASICS. Effect modifiers are subgroup analyses within a pooled dataset, not independently randomized comparisons, and the finding of \'no heterogeneity\' by pc-ASPECTS is an absence of detected interaction rather than proof of uniform benefit. The symptomatic-haemorrhage odds ratio of 11.98 rests on only 2 events in the control arm, which is why its interval spans 2.82 to 50.81. Only 91% were randomized within 12 h, so this says little about later windows.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-veritas-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Pooled across all four randomized basilar trials, endovascular therapy roughly 2.4-fold increased the odds of a favourable 90-day outcome and cut 90-day mortality from 45% to 36%, at the cost of a rise in symptomatic haemorrhage from under 1% to 5%; benefit is uncertain below NIHSS 10 and greater with more proximal occlusions.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: original abstract; full main report remained inaccessible.",
  }),
  t({
    id: 'interact-pooled',
    shortName: 'INTERACT1-4 pooled',
    fullName: 'Effects of Blood Pressure Lowering in Relation to Time in Acute Intracerebral Haemorrhage: A Pooled Analysis of the Four INTERACT Trials',
    topic: 'ich-bp-management',
    diseaseArea: ['ich', 'ich-bp-management'],
    population: {
      n: 11312,
      ageRange: 'Mean 63 years (SD 12.7); 4066 (35.9%) female, 7246 (64.1%) male',
      nihssRange: 'Not used; baseline severity handled through the ICH score in the heterogeneity analyses',
      timeWindow: 'Median 2.9 h from symptom onset to randomisation (IQR 1.8-4.1); INTERACT1-3 enrolled within 6 h of onset, INTERACT4 within 2 h',
      keyInclusion: ['Individual patient data from INTERACT1 (n=404), INTERACT2 (n=2829), INTERACT3 (n=7036) and INTERACT4 (n=1043)', 'INTERACT1-3: adults with acute intracerebral haemorrhage presenting within 6 h with systolic BP >150 mm Hg', 'INTERACT4: suspected acute stroke causing a motor deficit with systolic BP >=150 mm Hg within 2 h of onset; 1029 of 1043 had a haemorrhagic stroke', 'Registered PROSPERO CRD420251001539; parent trials NCT00226096, NCT00716079, NCT03209258, NCT03790800'],
      keyExclusion: ['As specified by each parent trial; this pooled analysis added no further exclusions']
    },
    intervention: 'Intensive blood-pressure lowering, target systolic BP <140 mm Hg within 1 h, using locally available drugs (delivered as BP treatment alone in INTERACT1/2, as part of a care bundle in INTERACT3, and prehospital in INTERACT4)',
    comparator: 'Guideline-recommended blood-pressure lowering, target systolic BP <180 mm Hg within 1 h',
    primaryEndpoint: {
      definition: 'Functional recovery defined by the distribution of modified Rankin Scale scores, reported as the odds of poor physical function (mRS 3-6); logistic regression adjusted for trial and baseline haematoma volume',
      timepoint: 'As reported by each parent trial — 90 days for INTERACT1, INTERACT2 and INTERACT4, 6 months for INTERACT3',
      result: 'Favoured intensive BP lowering: significantly decreased odds of poor physical function (mRS 3-6)',
      effectSize: 'OR 0.85',
      confidenceInterval: '95% CI 0.78 to 0.91',
      pValue: 'No p value reported for this outcome in the abstract; the confidence interval excludes 1.00'
    },
    secondaryEndpoints: [
      {
        name: 'Systolic BP at 1 hour',
        result: 'Mean 149.6 mm Hg (SD 21.8) intensive vs 158.8 mm Hg (SD 22.8) guideline; difference 9.13 mm Hg (95% CI 8.28-10.00), p<0.0001'
      },
      {
        name: 'Neurological deterioration within 7 days',
        result: 'Reduced with intensive treatment: OR 0.76 (95% CI 0.66-0.88), p=0.0002'
      },
      {
        name: 'Death',
        result: 'Reduced with intensive treatment: OR 0.83 (95% CI 0.75-0.94), p=0.002'
      },
      {
        name: 'Any serious adverse event',
        result: 'Reduced with intensive treatment: OR 0.84 (95% CI 0.76-0.92), p=0.0003'
      },
      {
        name: 'Relative (>=33%) haematoma growth at 24 h — CT substudy (n=2921)',
        result: 'NO apparent effect: OR 0.85 (95% CI 0.70-1.03), p=0.09'
      },
      {
        name: 'Absolute (>=6 mL) haematoma growth at 24 h — CT substudy (n=2921)',
        result: 'NO apparent effect: OR 0.84 (95% CI 0.68-1.04), p=0.12'
      },
      {
        name: 'Interaction with time from onset to randomisation — CT substudy only',
        result: 'Treatment effects on both functional recovery and relative haematoma growth decreased as time from onset increased, with the effect crossing unity at about 3 h (p=0.002 and p=0.01 for interaction respectively)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — every participant had an intracerebral haemorrhage as the index event',
      mortality: 'Lower with intensive BP lowering: OR 0.83 (95% CI 0.75-0.94), p=0.002',
      other: 'Any serious adverse event was also lower with intensive treatment: OR 0.84 (95% CI 0.76-0.92), p=0.0003 — the pooled data show no safety signal from lowering BP quickly'
    },
    imagingCriteria: 'CT-confirmed spontaneous intracerebral haemorrhage in INTERACT1-3; INTERACT4 randomised in the ambulance on suspected stroke with CT confirmation afterwards. A CT substudy of 2921 patients had paired baseline and 24-h volumetry for the haematoma-growth endpoints.',
    applicabilityNotes: 'This is the record that keeps the BP category from reading as uniformly negative — INTERACT2 and ATACH-2 both missed their primary endpoints, yet the individual-patient pool of all four INTERACT trials shows better function, less neurological deterioration and lower mortality with early intensive lowering. Two caveats belong on the same card. First, the pooled \'intervention\' is not one thing: INTERACT1 and INTERACT2 randomised BP strategy alone, INTERACT3 randomised a care bundle (BP plus glucose control, antipyresis and anticoagulation reversal) and contributes 62% of the patients, and INTERACT4 randomised prehospital treatment. Second, the widely quoted 3-hour cut-off comes from the 2921-patient CT substudy, not the full 11,312, and time from onset is a patient characteristic rather than an allocated exposure. Note also that the mechanism is not what most learners assume: intensive lowering did not reduce haematoma growth on either the relative or the absolute definition, so whatever benefit exists is not mediated through stopping the bleed. Read this record beside the 2026 location-stratified meta-analysis (deep vs lobar), which found no significant benefit in either location and is the honest counterweight.',
    limitations: 'Pooled analysis of trials with different interventions, different outcome timepoints (90 days vs 6 months) and different mRS dichotomies; INTERACT3\'s care bundle dominates the sample. The timing signal that drives the \'3 hours\' teaching point rests on only 2921 of 11,312 patients and on a non-randomised interaction with time from onset, which correlates with severity and access to care. No adjustment for the multiplicity of secondary and interaction tests is described in the abstract.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-interact-pooled-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports starting BP lowering as early as possible after ICH — ideally within about 3 hours of onset — while making explicit that the benefit is not mediated by reduced haematoma growth.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ich-bp-deep-vs-lobar-meta',
    shortName: 'Deep vs lobar ICH BP meta-analysis',
    fullName: 'Functional Outcomes After Intensive Blood Pressure Reduction in Deep and Lobar Intracerebral Hemorrhage',
    topic: 'ich-bp-management',
    diseaseArea: ['ich', 'ich-bp-management'],
    population: {
      n: 9022,
      ageRange: 'Mean 63 years; 37% female (both analysis steps)',
      nihssRange: 'Not used; ATACH-2 individual patient data were adjusted for Glasgow Coma Scale score and presence of intraventricular haemorrhage',
      timeWindow: 'Acute ICH windows as defined by the three parent trials; the analysis did not stratify by time from onset',
      keyInclusion: ['Stepwise meta-analysis stratified by haematoma location of three landmark intensive-BP trials: ATACH-2, INTERACT2 and INTERACT3', 'Step 1 pooled ATACH-2 and INTERACT2 (3-month outcomes, intensive BP lowering only): 2983 deep and 537 lobar ICH', 'Step 2 added INTERACT3 (6-month outcomes, care bundle): 7917 deep and 1105 lobar ICH', 'ATACH-2 contributed individual patient data adjusted for age, GCS and IVH; INTERACT2 and INTERACT3 contributed publicly available pooled results'],
      keyExclusion: ['INTERACT1 and INTERACT4 were not included', 'Patients whose haematoma location was not classifiable as deep or lobar']
    },
    intervention: 'Intensive systolic BP target <140 mm Hg (delivered within a care bundle in INTERACT3)',
    comparator: 'Standard care, systolic BP target 140-180 mm Hg',
    primaryEndpoint: {
      definition: 'Poor functional outcome stratified by haematoma location (deep vs lobar); poor outcome defined as mRS 4-6 in ATACH-2 and INTERACT3 and mRS 3-6 in INTERACT2',
      timepoint: '3 months (ATACH-2, INTERACT2) and 6 months (INTERACT3), as reported by each trial',
      result: 'DID NOT demonstrate a significant benefit of intensive BP reduction in either location. Step 1: deep OR 0.89, lobar OR 0.92. Step 2 (with INTERACT3 added): deep OR 0.82, lobar OR 0.97. All four confidence intervals cross 1.00.',
      effectSize: 'Step 2 deep OR 0.82; step 2 lobar OR 0.97 (step 1 deep OR 0.89; step 1 lobar OR 0.92)',
      confidenceInterval: 'Step 2 deep 95% CI 0.57-1.18 (I-squared 60%); step 2 lobar 95% CI 0.76-1.24 (I-squared 0%). Step 1 deep 95% CI 0.40-1.98 (I-squared 0%); step 1 lobar 95% CI 0.73-1.17 (I-squared 0%)',
      pValue: 'No p values reported in the abstract; the authors describe every estimate as non-significant'
    },
    secondaryEndpoints: [
      {
        name: 'Heterogeneity in the deep stratum after adding INTERACT3',
        result: 'I-squared rose from 0% (step 1) to 60% (step 2), which the authors flag as limiting firm conclusions'
      },
      {
        name: 'Direction of effect',
        result: 'Point estimates in deep ICH favoured intensive treatment (0.89 then 0.82) while lobar estimates sat near the null (0.92 then 0.97); the authors call this a direction worth testing, not a demonstrated interaction'
      },
      {
        name: 'Authors\' stated conclusion',
        result: 'Well-powered studies specifically designed to test whether intensive BP reduction differs by haematoma location are warranted'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — every participant had an intracerebral haemorrhage as the index event',
      mortality: 'Not reported separately; death is absorbed into the mRS 4-6 or 3-6 poor-outcome composite',
      other: 'Not reported in this location-stratified analysis'
    },
    imagingCriteria: 'Haematoma location classified as deep or lobar on the diagnostic CT of each parent trial',
    applicabilityNotes: 'This is the deliberate counterweight to the INTERACT1-4 pooled analysis, and the pair is the teaching point. The pooled individual-patient analysis of all four INTERACT trials reports OR 0.85 (0.78-0.91) for poor function overall; this location-stratified analysis of ATACH-2 plus two of those trials (INTERACT2 and INTERACT3) finds nothing significant in either deep or lobar ICH. The two are not contradictory so much as differently powered and differently constructed: this one uses aggregate data for two of three trials, splits the sample into subgroups (only 1105 lobar patients even in step 2), and mixes two different mRS dichotomies across trials. Subgroup analyses of this size cannot exclude a clinically meaningful effect — the lobar confidence interval runs from 0.76 to 1.24. The correct lesson is that whether hematoma location modifies the benefit of intensive BP lowering is an open question, not that BP lowering has been shown not to work.',
    limitations: 'Aggregate rather than individual-patient data for INTERACT2 and INTERACT3, so no patient-level adjustment or formal interaction test across all three trials; the poor-outcome dichotomy differs between trials (mRS 4-6 vs 3-6), which is not a cosmetic difference when the comparison is between subgroups; substantial heterogeneity (I-squared 60%) in the deep stratum once INTERACT3 is added; INTERACT3 randomised a care bundle rather than BP alone; only two of the four INTERACT-family trials (INTERACT2 and INTERACT3) are represented, alongside ATACH-2, and the lobar stratum is small enough that a real effect could be missed.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ich-bp-location-meta-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that the deep-versus-lobar question in acute BP management is unresolved: current evidence neither establishes a location-specific benefit nor rules one out, so location should not by itself change the acute BP target.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "andexanet-vs-4fpcc-meta",
    "shortName": "Andexanet vs 4F-PCC meta-analysis",
    "fullName": "Efficacy and Safety of Andexanet Alfa Versus Four Factor Prothrombin Complex Concentrate for Emergent Reversal of Factor Xa Inhibitor Associated Intracranial Hemorrhage: A Systematic Review and Meta-Analysis",
    "topic": "ich-anticoag-reversal",
    "diseaseArea": [
      "ich",
      "ich-anticoag-reversal"
    ],
    "population": {
      "n": 2977,
      "ageRange": "Aggregate mean 77 years; study range 65–84",
      "nihssRange": "Not reported",
      "timeWindow": "Emergent reversal on presentation, as defined by each source study; literature searched to 16 May 2024",
      "keyInclusion": [
        "16 studies comparing andexanet alfa with four-factor prothrombin complex concentrate for factor Xa inhibitor-associated intracranial haemorrhage",
        "2977 patients in total",
        "PRISMA-conformant systematic review with random-effects pooling"
      ],
      "keyExclusion": [
        "Excluded: non-English reports, case reports/series, reviews and conference abstracts, studies using aPCC or combined PCC plus andexanet, and studies including non-intracranial bleeding. One randomised trial was included (ANNEXA-I: andexanet vs usual care, in which 85.5% of the usual-care arm received prothrombin complex concentrate); the other 15 studies are observational cohorts"
      ]
    },
    "intervention": "Andexanet alfa",
    "comparator": "Four-factor prothrombin complex concentrate (4F-PCC)",
    "primaryEndpoint": {
      "definition": "Three co-primary outcomes pooled with a random-effects model: successful anticoagulation (haemostatic) reversal, overall mortality (in-hospital plus 30-day), and thromboembolic events",
      "timepoint": "In-hospital and 30-day, as reported by the source studies",
      "result": "Hemostatic efficacy favored andexanet (RR 1.10). Primary overall mortality RR 0.72; 30-day mortality RR 0.82 was nonsignificant. Thromboembolic events were more frequent (RR 1.47). Different analysis sets and timepoints prevent treating differing significance as a logical contradiction.",
      "effectSize": "Hemostatic efficacy RR 1.10; primary overall mortality RR 0.72; 30-day mortality RR 0.82; thromboembolism RR 1.47",
      "confidenceInterval": "95% CI: 1.01–1.20; 0.54–0.95; 0.58–1.16; 1.01–2.15, respectively",
      "pValue": "P=.02; P=.02; P=.26; P=.046, respectively"
    },
    "secondaryEndpoints": [
      {
        "name": "Length of hospital stay",
        "result": "Longer with andexanet: mean difference 0.64 days (95% CI 0.07-1.22), P=0.03"
      },
      {
        "name": "Length of ICU stay",
        "result": "No significant difference: mean difference 0.25 days (95% CI -0.36 to 0.86), P=0.41"
      },
      {
        "name": "Haematoma volume expansion",
        "result": "No significant difference: mean difference -0.89 mL (95% CI -3.11 to 1.34), P=0.435 — the imaging endpoint did not move even though the categorical haemostasis endpoint did"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — every participant already had an intracranial haemorrhage",
      "mortality": "Primary overall RR 0.72 (95% CI 0.54–0.95), P=.02. Excluding Pham gives sensitivity RR 0.67 (0.51–0.88), P=.004. Thirty-day RR 0.82 (0.58–1.16), P=.26; different significance does not prove contradictory mortality effects.",
      "other": "Thromboembolic events more frequent with andexanet: RR 1.47 (95% CI 1.01-2.15), P=0.046 — the lower bound sits essentially on 1.00"
    },
    "imagingCriteria": "Radiographically confirmed intracranial haemorrhage in a patient on a factor Xa inhibitor; haemostatic efficacy defined by each source study, most commonly by imaging-based criteria such as those used in the ANNEXA programme",
    "applicabilityNotes": "One RCT plus 15 cohorts. Hemostatic efficacy, thrombosis and mortality analyses use different study sets and timepoints; a significant overall mortality estimate and a nonsignificant 30-day estimate do not establish a contradiction. Most mortality evidence remains vulnerable to confounding.",
    "limitations": "Predominantly observational synthesis; no causal survival conclusion. Overall mortality primary RR 0.72 (95% CI 0.54–0.95), P=.02; RR 0.67 (0.51–0.88), P=.004 is the sensitivity analysis excluding Pham. FDA communicated that risks outweigh benefits; AstraZeneca then submitted a voluntary BLA-withdrawal request and reported US manufacture/sales ending December 22, 2025; completed regulatory withdrawal and current non-US availability are not independently established here.",
    "certainty": "low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-andexanet-vs-4fpcc-meta-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Retain hemostasis-versus-thrombosis trade-offs and source-specific analytic limits. Current reversal choices require current guideline and jurisdictional availability review; do not infer a confirmed global withdrawal or survival benefit from this pooled observational comparison.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "peach",
    "shortName": "PEACH",
    "fullName": "Safety and Efficacy of Prophylactic Levetiracetam for Prevention of Epileptic Seizures in the Acute Phase of Intracerebral Haemorrhage (PEACH)",
    "topic": "ich-seizure-prophylaxis",
    "diseaseArea": [
      "ich",
      "ich-seizure-prophylaxis"
    ],
    "population": {
      "n": 50,
      "ageRange": "Aged 18 years or older",
      "nihssRange": "Randomisation stratified by baseline NIHSS; the enrolled cohort is described as mild-to-moderate severity intracerebral haemorrhage",
      "timeWindow": "Randomised within 24 h of onset; continuous EEG started within 24 h of inclusion and recorded over 48 h",
      "keyInclusion": [
        "Spontaneous supratentorial ICH within 24 hours (companion Methods)",
        "Three stroke units in France; enrolled 1 June 2017 to 14 April 2020",
        "Continuous EEG performed (required for the modified intention-to-treat population)",
        "NCT02631759"
      ],
      "keyExclusion": [
        "NIHSS >25, traumatic or secondary ICH (vascular malformation, tumor, hemorrhagic transformation), current antiseizure medication or established epilepsy"
      ]
    },
    "intervention": "Trial regimen: levetiracetam 500 mg every 12 hours, initially IV then oral when feasible; companion report describes 30 days at 1 g/day followed by taper within a six-week course. Exact taper not reproduced without the original protocol. 24 randomized; 19 analyzed.",
    "comparator": "Matching placebo — 26 randomised, 23 in the modified intention-to-treat analysis",
    "primaryEndpoint": {
      "definition": "At least one clinical seizure within 72 h of inclusion, or at least one electrographic seizure recorded on the 48-h continuous EEG; analysed in the modified intention-to-treat population (all randomised patients who had a continuous EEG performed)",
      "timepoint": "72 h",
      "result": "Favoured levetiracetam: a clinical or electrographic seizure occurred in 3/19 (16%) on levetiracetam versus 10/23 (43%) on placebo. Every seizure captured in the first 72 h was electrographic only — none were clinical.",
      "effectSize": "OR 0.16",
      "confidenceInterval": "95% CI 0.03 to 0.94",
      "pValue": "p=0.043"
    },
    "secondaryEndpoints": [
      {
        "name": "Depression at 1 and 3 months",
        "result": "No difference: 3/24 (13%) levetiracetam vs 4/26 (15%) placebo"
      },
      {
        "name": "Anxiety at 1 and 3 months",
        "result": "No difference: 2/24 (8%) levetiracetam vs 1/26 (4%) placebo"
      },
      {
        "name": "Functional outcome",
        "result": "Not established — the authors state explicitly that larger studies are needed to determine whether seizure prophylaxis improves functional outcome in ICH"
      },
      {
        "name": "Most common treatment-emergent adverse events",
        "result": "Headache 9 (39%) levetiracetam vs 6 (24%) placebo; pain 3 (13%) vs 10 (40%); falls 7 (30%) vs 4 (16%)"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — the index event is an intracerebral haemorrhage",
      "mortality": "No treatment-related death was reported in either group",
      "other": "Most frequent serious adverse events were neurological deterioration due to the intracerebral haemorrhage (1 [4%] levetiracetam vs 4 [16%] placebo) and severe pneumonia (2 [9%] vs 2 [8%]); with these event counts none of these differences is interpretable"
    },
    "imagingCriteria": "Spontaneous supratentorial ICH; excluded structural/secondary hemorrhage causes. Broader nontraumatic ICH is not the full selection criterion.",
    "applicabilityNotes": "The small trial does not establish functional benefit or routine prophylaxis. In the companion EEG cohort, rhythmic/periodic patterns preceded seizures in 10/12 evaluable seizure patients (83.3%), or 10/11 with those patterns (90.9%). The latter denominator is conditional. Subgroup 20% versus 75% findings do not validate an EEG-guided treatment strategy.",
    "limitations": "Stopped prematurely after reaching only 48% of the recruitment target because of slow recruitment and cessation of funding. 50 randomised, 42 analysed, and 13 patients with a seizure (3 on levetiracetam, 10 on placebo) drive the entire primary result — the 95% CI of 0.03 to 0.94 only just excludes 1. Three French stroke units and mild-to-moderate ICH only. The primary endpoint is dominated by electrographic seizures on 48-h continuous EEG, a measurement most centres do not make and whose prognostic importance is itself unresolved. Labelled phase 3 but powered for none of the outcomes clinicians act on.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-peach-2022",
      "cit-peach-eeg-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Hypothesis-generating seizure prevention evidence; no established functional benefit and no validated EEG-guided prophylaxis strategy.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "promotedDate": "2026-09-26",
    verificationNotes: "Original primary abstract and full EEG companion compared; original full endpoint/safety tables and protocol inaccessible. Companion detail does not constitute full main-trial clearance. Review scope: original abstract and identified companion report; the companion does not replace the main trial report.",
  }),
  t({
    id: 'stop-msu',
    shortName: 'STOP-MSU',
    fullName: 'Tranexamic Acid Versus Placebo in Individuals with Intracerebral Haemorrhage Treated Within 2 h of Symptom Onset (STOP-MSU)',
    topic: 'ich-hemostatic',
    diseaseArea: ['ich', 'ich-hemostatic'],
    population: {
      n: 201,
      ageRange: 'Median 66 years (IQR 55-77); 82 (41%) female, 119 (59%) male',
      nihssRange: 'Not reported in the primary publication',
      timeWindow: 'Investigational product commenced within 2 h of symptom onset',
      keyInclusion: ['Aged 18 years or older', 'Acute spontaneous intracerebral haemorrhage confirmed on non-contrast CT', 'Able to be treated within 2 h of stroke onset', '24 hospitals and one mobile stroke unit in Australia, Finland, New Zealand, Taiwan and Viet Nam', 'Recruited 19 March 2018 to 27 February 2023; NCT03385928'],
      keyExclusion: ['Secondary or traumatic intracerebral haemorrhage', 'One of 202 recruited participants withdrew consent for any data use and is excluded from the 201-patient intention-to-treat population']
    },
    intervention: 'Intravenous tranexamic acid 1 g over 10 min followed by 1 g over 8 h, commenced within 2 h of symptom onset (n=103)',
    comparator: 'Matched intravenous saline placebo on the same dosing schedule (n=98)',
    primaryEndpoint: {
      definition: 'Haematoma growth, defined as at least 33% relative growth OR at least 6 mL absolute growth on CT at 24 h (target window 18-30 h) compared with the baseline CT; analysed within an estimand framework adhering to the intention-to-treat principle',
      timepoint: '24 h (target range 18-30 h)',
      result: 'DID NOT reduce haematoma growth, and the point estimate favoured placebo: growth occurred in 43/101 (43%) assessable participants given tranexamic acid versus 37/97 (38%) given placebo',
      effectSize: 'Adjusted OR 1.31',
      confidenceInterval: '95% CI 0.72 to 2.40',
      pValue: 'p=0.37'
    },
    secondaryEndpoints: [
      {
        name: 'Other imaging endpoints and functional outcome',
        result: 'No observed effects — the authors report no effect on other imaging endpoints, functional outcome or safety'
      },
      {
        name: 'Mortality at 7 days',
        result: '8/98 (8%) placebo vs 8/103 (8%) tranexamic acid; adjusted OR 1.08 (95% CI 0.35 to 3.35)'
      },
      {
        name: 'Mortality at 90 days',
        result: '15/98 (15%) placebo vs 19/103 (18%) tranexamic acid; adjusted OR 1.61 (95% CI 0.65 to 3.98) — numerically higher with tranexamic acid, with a confidence interval far too wide to call harm'
      },
      {
        name: 'Major thromboembolic events at 90 days',
        result: '1/98 (1%) placebo vs 3/103 (3%) tranexamic acid; risk difference 0.02 (95% CI -0.02 to 0.06)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — the index event is an intracerebral haemorrhage; the trial measured haematoma growth instead',
      mortality: '7 days 8% vs 8% (adjusted OR 1.08, 95% CI 0.35-3.35); 90 days 15% placebo vs 18% tranexamic acid (adjusted OR 1.61, 95% CI 0.65-3.98)',
      other: 'Major thromboembolic events 3/103 (3%) with tranexamic acid vs 1/98 (1%) with placebo; risk difference 0.02 (95% CI -0.02 to 0.06)'
    },
    imagingCriteria: 'Non-contrast CT confirming spontaneous intracerebral haemorrhage at baseline, with a repeat CT at 24 h (18-30 h window) for the growth endpoint; scans were missing or of inadequate quality in three participants and treated as missing at random',
    applicabilityNotes: 'STOP-MSU is the ultra-early test that TICH-2 was said to need. TICH-2 gave tranexamic acid within 8 h and reduced haematoma expansion without changing function; the standard rebuttal was that treatment simply came too late. STOP-MSU treated everyone inside 2 hours, and haematoma growth still was not reduced — the point estimate ran the wrong way. Place it beside FASTEST, where recombinant factor VIIa given at a mean of 100 minutes did shrink the bleed by about 4 mL yet left 180-day disability unchanged while tripling life-threatening thrombosis, and beside the INTERACT1-4 CT substudy, where intensive BP lowering improved function without any effect on haematoma growth. Across three different mechanisms, the haematoma-growth target has now failed to deliver what its biology promised. This is a phase 2 trial with an imaging primary endpoint, so it settles the growth question in this window and nothing more; the phase 3 TICH-3 programme will add context to the functional question.',
    limitations: 'Phase 2, 201 participants, and a surrogate imaging primary endpoint — not powered for functional outcome or mortality, so the wider mortality confidence intervals exclude neither harm nor benefit. Recruitment took five years across five countries; requiring treatment inside 2 h selects a fast-presenting, largely urban population and limits generalisability. Despite the trial name only one mobile stroke unit contributed. The numerically higher 90-day mortality with tranexamic acid (18% vs 15%, adjusted OR 1.61, 95% CI 0.65-3.98) must be reported but must not be presented as demonstrated harm at this sample size.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-stop-msu-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Do not give tranexamic acid for primary ICH outside a trial — treating within 2 hours of onset still did not slow the bleed.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'edinburgh-ct-caa-criteria',
    shortName: 'Edinburgh CT criteria',
    fullName: 'The Edinburgh CT and Genetic Diagnostic Criteria for Lobar Intracerebral Haemorrhage Associated with Cerebral Amyloid Angiopathy: Model Development and Diagnostic Test Accuracy Study',
    topic: 'caa-diagnosis',
    diseaseArea: ['ich', 'caa-diagnosis'],
    population: {
      n: 110,
      ageRange: 'Median 83 years (IQR 76-87); 49 (45%) men',
      nihssRange: 'Not applicable — a diagnostic-accuracy study against a neuropathological reference standard',
      timeWindow: 'First-ever intracerebral haemorrhage diagnosed by CT; participants included between 1 June 2010 and 10 February 2016',
      keyInclusion: ['Adults with first-ever intracerebral haemorrhage diagnosed by CT', 'Died and underwent research autopsy within the prospective, population-based LINCHPIN inception cohort (Lothian IntraCerebral Haemorrhage, Pathology, Imaging and Neurological Outcome)', 'APOE genotyping performed', 'CT rated by radiologists masked to clinical, genetic and histopathological features; small-vessel disease including CAA rated by a neuropathologist masked to clinical, radiographic and genetic features'],
      keyExclusion: ['Patients who survived, or who did not come to research autopsy, are by construction absent from the cohort']
    },
    intervention: 'A logistic-regression prediction model combining two non-contrast CT features (associated subarachnoid haemorrhage; intracerebral haemorrhage with finger-like projections) with APOE epsilon-4 possession, internally validated by bootstrapping',
    comparator: 'Neuropathological reference standard — moderate or severe cerebral amyloid angiopathy at autopsy versus absent or mild',
    primaryEndpoint: {
      definition: 'Discrimination (c statistic) of the CT plus APOE model for CAA-associated lobar intracerebral haemorrhage against the autopsy reference standard, with derived rule-in and rule-out diagnostic criteria',
      timepoint: 'Autopsy (reference standard); CT rated from the diagnostic scan',
      result: 'Excellent discrimination, confirmed on internal bootstrap validation. Of 110 participants, ICH was lobar in 62 (56%), deep in 41 (37%) and infratentorial in 7 (6%); of the 62 lobar haemorrhages, 36 (58%) had moderate or severe CAA and 26 (42%) absent or mild CAA.',
      effectSize: 'c statistic 0.92',
      confidenceInterval: '95% CI 0.86 to 0.98',
      pValue: 'Component associations with CAA-associated lobar ICH: subarachnoid haemorrhage 32/36 (89%) vs 11/26 (42%), p=0.014; finger-like projections 14/36 (39%) vs 0/26, p=0.043; APOE epsilon-4 possession 18/36 (50%) vs 2/26 (8%), p=0.0020'
    },
    secondaryEndpoints: [
      {
        name: 'Rule-out criteria',
        result: 'Neither subarachnoid haemorrhage nor APOE epsilon-4 possession: sensitivity 100% (95% CI 88-100)'
      },
      {
        name: 'Rule-in criteria',
        result: 'Subarachnoid haemorrhage plus either APOE epsilon-4 possession or finger-like projections: specificity 96% (95% CI 78-100)'
      },
      {
        name: 'Authors\' own caveat',
        result: 'The model showed excellent discrimination in this cohort but requires external validation'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — diagnostic-accuracy study, no intervention',
      mortality: 'All 110 participants died; the cohort is restricted by design to decedents who came to research autopsy',
      other: 'Not applicable'
    },
    imagingCriteria: 'Non-contrast CT rated by radiologists masked to clinical, genetic and histopathological data. The two rated imaging features are associated subarachnoid haemorrhage and intracerebral haemorrhage with finger-like projections.',
    applicabilityNotes: 'This is the CT-based counterpart to the MRI-based Boston criteria v2.0, and it exists for the majority of ICH patients who never get an MRI — the sick, the old, the unstable and the ones at hospitals without out-of-hours MRI. It is a diagnostic-accuracy model, not a treatment trial: what it delivers is a probability that a given lobar haemorrhage is amyloid-related, which is the input to the conversations that actually change management — whether to restart an antithrombotic, how to frame recurrence risk with a family, and whether a patient belongs in a CAA-focused trial such as SATURN. Two structural cautions belong on the card. The rule-out arm requires an APOE genotype, which most centres cannot obtain acutely, so in real time the CT-only features are what a clinician has. And the derivation cohort is autopsy-based, which enriches for fatal haemorrhage in very old patients and is not the population in front of most clinicians. External diagnostic validation against MRI-based Boston criteria followed in single-centre cohorts (simplified Edinburgh CT criteria, Neurology 2022: AUC 0.74; Clin Neuroradiol 2023: AUC 0.76), and in 2025 an eight-cohort individual-patient meta-analysis linked the same strata to recurrent haemorrhage.',
    limitations: 'Derivation cohort of 110 with only 62 lobar haemorrhages and 36 CAA cases — very small for a three-variable model, and validated internally by bootstrapping only, with no external cohort in this paper. Enrolment required death plus research autopsy, so the cohort is old (median 83) and skewed toward fatal haemorrhage, limiting transportability to survivors and to younger patients. Confidence intervals around the rule-in and rule-out performance are wide (specificity 96%, 95% CI 78-100; sensitivity 100%, 95% CI 88-100). The reference standard is moderate-or-severe CAA at autopsy, a dichotomy that does not map cleanly onto clinical decision thresholds.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-edinburgh-ct-caa-2018'],
    relatedActiveTrialIds: ['saturn'],
    practiceImpact: 'Gives a CT-only, and optionally CT-plus-APOE, way to grade the probability that a lobar haemorrhage is amyloid-related when MRI is unavailable — the input to how cautiously antithrombotics are restarted.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "edinburgh-ct-caa-recurrence-ipd",
    "shortName": "Edinburgh criteria & ICH recurrence (IPD)",
    "fullName": "Association Between the Edinburgh CT and Genetic Diagnostic Criteria for Cerebral Amyloid Angiopathy-Associated Lobar Intracerebral Haemorrhage and Recurrent Intracerebral Haemorrhage: An Individual Patient Data Meta-Analysis",
    "topic": "caa-diagnosis",
    "diseaseArea": [
      "ich",
      "caa-diagnosis",
      "ich-secondary-prevention"
    ],
    "population": {
      "n": 1705,
      "ageRange": "Primary two-stage CT-only cohort (562 patients): median 76 years (IQR 68-82), 282 (50%) female, 280 (50%) male. One-stage CT-only cohort (1620): median 73 years (IQR 62-80), 763 (47%) female, 857 (53%) male. CT-APOE cohort (1006): median 71 years (IQR 58-79), 477 (47%) female, 529 (53%) male.",
      "nihssRange": "Not applicable — prognostic cohort analysis",
      "timeWindow": "Index spontaneous lobar intracerebral haemorrhage; recurrence counted only from 30 days after the index event",
      "keyInclusion": [
        "Aged 16 years or older with first or recurrent spontaneous lobar intracerebral haemorrhage diagnosed on non-contrast brain CT",
        "No evidence of an underlying cause other than cerebral small-vessel disease",
        "Diagnostic CT that had been, or could be, rated for the Edinburgh CAA imaging features",
        "Follow-up data for recurrent intracerebral haemorrhage and death",
        "Eight cohorts from Austria, France, Germany, Italy, the UK and the USA, identified at the 2018 International CAA Conference in Lille; 1705 eligible for CT-only criteria and 1021 for CT-APOE criteria",
        "Primary 562-person analysis required a first-ever index ICH; secondary analyses also included recurrent presentations"
      ],
      "keyExclusion": [
        "Underlying macrovascular or structural cause for the haemorrhage",
        "15 CT-APOE patients excluded for missing baseline data, leaving 1006 analysed",
        "Death or ICH recurrence within the first 30 days"
      ]
    },
    "intervention": "Edinburgh CT-only and CT-APOE risk strata (low / intermediate / high) applied to the index diagnostic CT",
    "comparator": "The low-risk Edinburgh stratum",
    "primaryEndpoint": {
      "definition": "Recurrent ICH in 30-day event-free survivors, with competing-risk analysis; primary two-stage cohort had first-ever index ICH",
      "timepoint": "5-year follow-up for the CT-only criteria; 3-year for the CT-APOE criteria",
      "result": "Higher strata were associated with more recurrence. Primary 562-person analysis had 69 events over 1381 person-years: 48/307 in intermediate/high and 21/255 low. Reported five-year cumulative incidence was 16% versus 8%; these estimates are not simply the crude fractions.",
      "effectSize": "Adjusted sub-distribution hazard ratio 1.79",
      "confidenceInterval": "95% CI 1.05 to 3.05",
      "pValue": "p=0.032"
    },
    "secondaryEndpoints": [
      {
        "name": "One-stage CT-only meta-analysis (1620 patients, 8 cohorts, 171 recurrences over 3208 person-years) — intermediate vs low risk",
        "result": "Cumulative 5-year recurrence 54/513 (16%) intermediate vs 45/727 (12%) low; adjusted sub-distribution HR 1.68 (95% CI 1.21-2.32), p=0.0018"
      },
      {
        "name": "One-stage CT-only meta-analysis — high vs low risk",
        "result": "Cumulative 5-year recurrence 72/380 (26%) high vs 45/727 (12%) low; adjusted sub-distribution HR 2.97 (95% CI 1.50-5.89), p=0.0018"
      },
      {
        "name": "One-stage CT-APOE meta-analysis (1006 patients, 6 cohorts, 74 recurrences over 1495 person-years)",
        "result": "Cumulative 3-year recurrence 34/320 (15%) high risk vs 14/322 (8%) low risk; adjusted sub-distribution HR 2.22 (95% CI 1.36-3.61), p=0.0014"
      },
      {
        "name": "Two-stage CT-APOE analysis",
        "result": "Could NOT be performed — individual cohorts had too few recurrence events to support cohort-level pooling, so only the one-stage estimate exists for CT-APOE"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — prognostic cohort analysis with no intervention",
      "mortality": "Death was modelled as a competing risk rather than reported as an outcome rate",
      "other": "Not applicable"
    },
    "imagingCriteria": "Diagnostic non-contrast CT rated, or re-rated by the collaborating cohorts, for the Edinburgh CAA imaging features (associated subarachnoid haemorrhage and finger-like projections); the CT small-vessel-disease score was used as an adjustment covariate",
    "applicabilityNotes": "Recurrence estimates are conditional on surviving 30 days without recurrence, not unconditional risk from admission. Reported cumulative-incidence estimates account for competing death and are not crude event fractions.",
    "limitations": "Observational cohort data pooled at the individual-patient level, not randomised. The primary two-stage analysis rests on only three of the eight cohorts and 69 recurrence events, so the headline 1.79 hazard ratio is imprecise (95% CI 1.05-3.05, barely excluding 1). The CT-APOE two-stage analysis could not be run at all because individual cohorts had too few outcomes, leaving only a pooled estimate for that criterion. Cohorts were assembled by invitation at a 2018 conference rather than by systematic search, raising selection concerns, and CT ratings span eight cohorts, six countries, and different scanners and eras. All cohorts are European or North American — no data from Asia, Africa or South America, where ICH aetiology mix differs. Excluding early deaths and recurrences conditions estimates on 30-day event-free survival. Follow-up BP control and antithrombotic exposure were unavailable; prognostic association does not establish treatment selection.",
    "certainty": "moderate",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-edinburgh-ct-recurrence-2025"
    ],
    "relatedActiveTrialIds": [
      "saturn",
      "aspire"
    ],
    "practiceImpact": "May inform conditional recurrence-risk discussion in comparable 30-day event-free survivors. It does not establish an antithrombotic treatment-selection rule or describe early-event risk.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'escape-na1',
    shortName: 'ESCAPE-NA1',
    fullName: 'Efficacy and safety of nerinetide for the treatment of acute ischaemic stroke (ESCAPE-NA1): a multicentre, double-blind, randomised controlled trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 1105,
      ageRange: '≥18 y (median not reported in the abstract)',
      nihssRange: 'Disabling ischaemic stroke at randomisation; no numeric NIHSS threshold specified in the abstract',
      timeWindow: '≤12 h from onset',
      keyInclusion: ['Acute ischaemic stroke due to large-vessel occlusion within a 12 h treatment window', 'Functioning independently in the community before the stroke', 'ASPECTS >4', 'Moderate-to-good collateral filling on multiphase CT angiography', 'All patients underwent endovascular thrombectomy; alteplase given per usual care when indicated', '48 acute-care hospitals in 8 countries, 1 Mar 2017 - 12 Aug 2019; NCT02930018'],
      keyExclusion: []
    },
    intervention: 'Single IV dose of nerinetide 2.6 mg/kg (maximum 270 mg) plus endovascular thrombectomy (n=549)',
    comparator: 'Saline placebo plus endovascular thrombectomy (n=556)',
    primaryEndpoint: {
      definition: 'Favourable functional outcome, defined as modified Rankin Scale score 0-2, in the intention-to-treat population; analysis adjusted for age, sex, baseline NIHSS, ASPECTS, occlusion location, site, alteplase use and declared first device',
      timepoint: '90 days after randomisation',
      result: 'DID NOT meet: mRS 0-2 in 337/549 (61.4%) with nerinetide vs 329/556 (59.2%) with placebo',
      effectSize: 'Adjusted risk ratio 1.04',
      confidenceInterval: '95% CI 0.96 to 1.14',
      pValue: 'p=0.35'
    },
    secondaryEndpoints: [
      {
        name: 'Neurological disability, functional independence in activities of daily living, excellent outcome (mRS 0-1) and mortality',
        result: 'Similar between groups'
      },
      {
        name: 'Interaction with alteplase co-treatment',
        result: 'Evidence of treatment-effect modification: the treatment effect was inhibited in patients who received alteplase. This was the observation that generated the no-thrombolytic hypothesis later tested in ESCAPE-NEXT'
      }
    ],
    safetyFindings: {
      sich: 'Not reported numerically in the abstract',
      mortality: 'Reported as a secondary outcome and similar between groups; numbers not given in the abstract',
      other: 'Serious adverse events occurred equally between groups'
    },
    imagingCriteria: 'ASPECTS >4 with moderate-to-good collateral filling on multiphase CT angiography',
    applicabilityNotes: 'The trial that opened the modern neuroprotection era and the reference point for everything that follows in this category. Nerinetide targets excitotoxic signalling downstream of PSD-95 and was tested where reperfusion is guaranteed — in thrombectomy patients — precisely so that a cytoprotectant would have a reperfused bed to protect. It still did not improve 90-day outcome overall. The alteplase interaction was the post hoc signal that drove ESCAPE-NEXT; read the two records together, because ESCAPE-NEXT is what happened when that signal was tested prospectively.',
    limitations: 'The alteplase interaction was a subgroup/effect-modification observation within a neutral overall trial, not a prespecified confirmatory result. Enrolment required moderate-to-good collaterals on multiphase CTA, a selection step many centres do not perform. Safety and mortality figures are not quantified in the published abstract.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-na1-2020'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Establishes that adding a PSD-95 inhibitor to thrombectomy did not improve 90-day function, and frames why no acute neuroprotectant has entered routine practice.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'escape-next',
    shortName: 'ESCAPE-NEXT',
    fullName: 'Efficacy and safety of nerinetide in acute ischaemic stroke in patients undergoing endovascular thrombectomy without previous thrombolysis (ESCAPE-NEXT): a multicentre, double-blind, randomised controlled trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 850,
      ageRange: '≥18 y (median not reported in the abstract)',
      nihssRange: '>5 (disabling stroke at randomisation)',
      timeWindow: '≤12 h from onset',
      keyInclusion: ['Acute ischaemic stroke due to anterior-circulation large-vessel occlusion within 12 h of onset', 'Pre-stroke Barthel Index >90 (functioning independently in the community)', 'ASPECTS >4', 'NOT treated with a plasminogen activator — the defining entry criterion', 'All patients underwent endovascular thrombectomy', '77 centres in Canada (16), USA (16), Germany (21), Italy (4), Netherlands (3), Norway (4), Switzerland (3), Australia (8) and Singapore (2), 6 Dec 2020 - 31 Jan 2023; NCT04462536'],
      keyExclusion: ['Treatment with a plasminogen activator']
    },
    intervention: 'Single IV dose of nerinetide 2.6 mg/kg (maximum 270 mg) plus endovascular thrombectomy, no thrombolytic (n=454)',
    comparator: 'Saline placebo plus endovascular thrombectomy, no thrombolytic (n=396)',
    primaryEndpoint: {
      definition: 'Favourable functional outcome, defined as modified Rankin Scale score 0-2, in the intention-to-treat population; adjusted for time from onset to randomisation (≤4.5 h yes/no), age, sex, baseline NIHSS, occlusion location, time from qualifying imaging to randomisation, baseline ASPECTS and region',
      timepoint: '90 days from randomisation',
      result: 'DID NOT meet: mRS 0-2 in 206/454 (45%) with nerinetide vs 181/396 (46%) with placebo — no benefit, with the point estimate very slightly favouring placebo',
      effectSize: 'Odds ratio 0.97',
      confidenceInterval: '95% CI 0.72 to 1.30',
      pValue: 'p=0.82'
    },
    secondaryEndpoints: [
      {
        name: 'Mortality, stroke worsening, improved functional independence and neurological disability measures',
        result: 'Reported as prespecified secondary outcomes; the abstract reports no benefit for nerinetide and does not give individual numbers'
      }
    ],
    safetyFindings: {
      sich: 'Not reported numerically in the abstract',
      mortality: 'Prespecified secondary outcome; numbers not given in the abstract',
      other: 'Serious adverse events occurred equally between groups; the authors state nerinetide was not associated with excess adverse events'
    },
    imagingCriteria: 'ASPECTS >4 with anterior-circulation large-vessel occlusion on vascular imaging',
    applicabilityNotes: 'This is the confirmatory test of the ESCAPE-NA1 alteplase-interaction hypothesis, run in exactly the non-thrombolysed thrombectomy population where that post hoc analysis had suggested benefit. It found none. Set beside ESCAPE-NA1 it is one of the cleanest worked examples in the corpus of a promising subgroup signal failing to survive a dedicated confirmatory trial — and a reason to be sceptical of any acute treatment whose case rests on effect modification within a neutral parent trial.',
    limitations: 'Group sizes were unequal (454 vs 396) despite 1:1 minimisation randomisation, which is worth noticing though it does not by itself invalidate the result. Safety data are summarised qualitatively rather than tabulated in the abstract. The trial cannot exclude benefit in a differently timed or differently selected population; the authors explicitly call for work on ideal timing and sub-population.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-next-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Closes the nerinetide question for thrombectomy without thrombolysis: there is no functional benefit, and no basis for using it outside a trial.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "actisave",
    "shortName": "ACTISAVE",
    "fullName": "Glenzocimab Efficacy and Safety Added to Intravenous Thrombolysis With or Without Mechanical Thrombectomy in Patients With Acute Ischemic Stroke — ACTISAVE: A Prospective, Randomized, Double-Blind Study",
    "topic": "acute-neuroprotection",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-neuroprotection"
    ],
    "population": {
      "n": 438,
      "ageRange": "Median 73 y (IQR 63-80); 43% female",
      "nihssRange": "Median pre-thrombolysis NIHSS 9 (IQR 6-15)",
      "timeWindow": "Thrombolysis within 4.5 h of onset (median 2.3 h); study drug started a median of 1.2 h [IQR 0.8-1.6] after thrombolysis initiation",
      "keyInclusion": [
        "Acute ischaemic stroke treated with IV thrombolysis within 4.5 h of symptom onset",
        "With or without mechanical thrombectomy — 36% went on to thrombectomy",
        "Phase 2/3, 54 primary and comprehensive stroke centers in 10 countries, Sep 2021 - Oct 2023; NCT05070260",
        "Analysis-set discrepancy: abstract reports 438 randomized/421 treated; body describes 436 randomized/419 randomized-and-treated plus two nonrandomized treated patients"
      ],
      "keyExclusion": []
    },
    "intervention": "Glenzocimab 1000 mg IV over six hours: one quarter over 15 minutes, remainder over 5 h 45 min; begun within two hours of IV thrombolysis",
    "comparator": "Placebo added to IV thrombolysis (n=211 in the primary analysis set)",
    "primaryEndpoint": {
      "definition": "Poor outcome, defined as modified Rankin Scale score 4-6 versus 0-3, at day 90 (a superiority design; lower is better for the active arm)",
      "timepoint": "Day 90",
      "result": "DID NOT meet: poor outcome in 21.6% with glenzocimab vs 15.3% with placebo — not significant, and the point estimate numerically favours placebo",
      "effectSize": "Odds ratio 1.51",
      "confidenceInterval": "95% CI 0.90 to 2.54",
      "pValue": "P=0.120"
    },
    "secondaryEndpoints": [
      {
        "name": "Functional independence (mRS 0-2) at day 90 — the key secondary",
        "result": "No statistically significant difference"
      },
      {
        "name": "Exploratory EVT angiographic outcomes",
        "result": "eTICI 2b–3: 83.9% versus 96.6%, OR 0.16 (95% CI 0.03–0.82); eTICI 2c–3 OR 0.34 (0.15–0.81), favoring placebo. These do not establish clinical harm."
      }
    ],
    "safetyFindings": {
      "sich": "Any intracerebral hemorrhage 60/210 (28.6%) with glenzocimab vs 63/211 (29.9%) with placebo; the abstract does not separately report symptomatic ICH",
      "mortality": "Assessed as a secondary outcome; no statistically significant difference and numbers not given in the abstract",
      "other": "No major safety signals reported"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The tested regimen did not significantly improve the primary clinical endpoint. Selected angiographic secondary findings favored placebo, so the result is not neutrality of every secondary outcome. Randomized/treated analysis-set counts conflict within the report.",
    "limitations": "Blinded endpoint change and sample-size reduction; no complete supplement appraisal. Source abstract and body disagree on enrollment, randomization and treated analysis populations; no reconciled denominator is asserted. Secondary angiographic findings are exploratory.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-actisave-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Glenzocimab is not an established adjunct to thrombolysis; the trial that was meant to confirm benefit did not, and there is no bedside role outside research.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "disputed",
    "verificationNotes": "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification."
  }),
  t({
    id: 'taste-edaravone-dexborneol',
    shortName: 'TASTE (edaravone dexborneol)',
    fullName: 'Edaravone Dexborneol Versus Edaravone Alone for the Treatment of Acute Ischemic Stroke: A Phase III, Randomized, Double-Blind, Comparative Trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 1165,
      ageRange: '35-80 y',
      nihssRange: '4-24',
      timeWindow: '≤48 h from onset',
      keyInclusion: ['Clinical diagnosis of acute ischaemic stroke', 'Age 35-80 years', 'NIHSS 4-24', 'Within 48 hours of stroke onset', '48 hospitals in China, May 2015 - December 2016; NCT02430350'],
      keyExclusion: []
    },
    intervention: '14-day infusion of edaravone dexborneol — a fixed combination of edaravone (a free-radical scavenger) and (+)-borneol (an anti-inflammatory) (n=585)',
    comparator: '14-day infusion of edaravone injection ALONE — an active comparator, not placebo (n=580)',
    primaryEndpoint: {
      definition: 'Proportion of patients with modified Rankin Scale score ≤1 on day 90 after randomisation (superiority of the combination over edaravone alone)',
      timepoint: 'Day 90',
      result: 'MET: mRS ≤1 in 67.18% with edaravone dexborneol vs 58.97% with edaravone alone — the combination was superior to edaravone alone',
      effectSize: 'Odds ratio 1.42',
      confidenceInterval: '95% CI 1.12 to 1.81',
      pValue: 'p=0.004'
    },
    secondaryEndpoints: [
      {
        name: 'Prespecified sex subgroup',
        result: 'Greater benefit in women (OR 2.26, 95% CI 1.49-3.43) than in men (OR 1.14, 95% CI 0.85-1.52) — a prespecified subgroup finding that has not been independently confirmed'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported in the abstract',
      other: 'Safety outcomes are not quantified in the published abstract'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The foundational trial for the edaravone dexborneol family and the reason this drug is widely used in China. The single most important caveat for a reader outside China is the comparator: patients in the control arm received edaravone alone, an agent that is not standard care in North America or Europe. The trial therefore shows that adding (+)-borneol to edaravone helps more than edaravone by itself; it does NOT establish what either agent does relative to placebo or to no cytoprotectant. Read it as the necessary background to TASTE-2, which did use a placebo comparator. Note also the name collision with the 2024 Australian TASTE tenecteplase trial — a different drug, a different question, the same acronym.',
    limitations: 'Active-comparator design with no placebo arm, so the absolute effect of the strategy is unmeasurable. Single-country conduct (48 Chinese hospitals) in 2015-2016, before the modern thrombectomy era, with no reported reperfusion-therapy stratification. A 48-hour enrolment window is far wider than the therapeutic window assumed for cytoprotection. Safety data are not quantified in the abstract. The female-benefit subgroup is hypothesis-generating only.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-taste-edaravone-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Explains why edaravone dexborneol is used routinely in China and why that practice has not transferred: the trial\'s control arm was edaravone, not placebo or usual care.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "taste-2-edaravone",
    "shortName": "TASTE-2",
    "fullName": "Edaravone dexborneol versus placebo on functional outcomes in patients with acute ischaemic stroke undergoing endovascular thrombectomy (TASTE-2): randomised controlled trial",
    "topic": "acute-neuroprotection",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-neuroprotection"
    ],
    "population": {
      "n": 1362,
      "ageRange": "18-80 y",
      "nihssRange": "6-25",
      "timeWindow": "≤24 h from symptom onset",
      "keyInclusion": [
        "Clinically diagnosed acute ischaemic stroke within 24 h of symptom onset",
        "Age 18-80 years",
        "NIHSS 6-25 and ASPECTS 6-10",
        "Confirmed large-vessel occlusion in the anterior circulation with planned endovascular thrombectomy",
        "106 hospitals in China, March 2022 - May 2023; 1362 randomized, 1360 in the intention-to-treat analysis (one patient per group lost to follow-up); NCT05249920"
      ],
      "keyExclusion": []
    },
    "intervention": "Edaravone dexborneol 37.5 mg (edaravone 30 mg + (+)-dexborneol 7.5 mg) given before thrombectomy then twice daily for 10-14 days (n=690 randomized; 689 analysed)",
    "comparator": "Placebo on the same schedule before and after thrombectomy (n=672 randomized; 671 analysed)",
    "primaryEndpoint": {
      "definition": "Functional independence at 90 days, defined as modified Rankin Scale score 0-2 (co-primary with serious adverse events)",
      "timepoint": "90 days",
      "result": "Nominally MET but only just: mRS 0-2 in 379/689 (55.0%) with edaravone dexborneol vs 333/671 (49.6%) with placebo; risk difference 5.4% (95% CI 0.1% to 10.7%). The lower bound of the risk-ratio confidence interval sits exactly at 1.00 and P=0.05, so this is a borderline rather than a robust result",
      "effectSize": "Risk ratio 1.11; risk difference 5.4%",
      "confidenceInterval": "95% CI 1.00 to 1.23 (risk ratio); 0.1% to 10.7% (risk difference)",
      "pValue": "P=0.05"
    },
    "secondaryEndpoints": [
      {
        "name": "Prespecified admission-mismatch subgroup (NIHSS ≥10 with ASPECTS ≥9, or NIHSS ≥20 with ASPECTS ≥7)",
        "result": "mRS 0-2 in 178/321 (55.5%) vs 134/312 (42.9%); risk ratio 1.29 (95% CI 1.10 to 1.52); risk difference 13.0% (95% CI 5.6% to 20.3%); P for interaction=0.003. The authors conclude the overall effect appeared to be driven by this subgroup and that a dedicated trial in this population may be warranted"
      }
    ],
    "safetyFindings": {
      "sich": "5.3% versus 6.5%",
      "mortality": "16.5% in each group",
      "other": "Serious adverse events 188/690 (27.2%) vs 173/672 (25.7%); risk ratio 1.06 (95% CI 0.89 to 1.26); risk difference 1.5% (95% CI -3.2% to 6.2%); P=0.53"
    },
    "imagingCriteria": "ASPECTS 6-10 with confirmed anterior-circulation large-vessel occlusion; the prespecified mismatch subgroup was defined clinically-radiologically (NIHSS ≥10 with ASPECTS ≥9, or NIHSS ≥20 with ASPECTS ≥7)",
    "applicabilityNotes": "The primary independence result was near the conventional significance threshold (RR 1.11, 95% CI 1.00–1.23; P=.05). Reported multiple-imputation, covariate-adjusted and per-protocol sensitivity analyses preserved its direction. Ordinal mRS and mRS 0–1 were neutral; subgroup findings remain exploratory.",
    "limitations": "Selected Chinese EVT population; no complete supplement appraisal. The primary result is imprecise and requires interpretation alongside neutral secondary functional endpoints. Both arms received the same infusion schedule; treatment burden was balanced in the randomized comparison.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-taste2-edaravone-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "A modest signal in the studied EVT population, with neutral other functional endpoints. Do not call every reasonable sensitivity analysis negative or infer universal benefit.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'emphasis-minocycline',
    shortName: 'EMPHASIS',
    fullName: 'Efficacy and safety of minocycline in patients with acute ischaemic stroke (EMPHASIS): a multicentre, double-blind, randomised controlled trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 1724,
      ageRange: 'Median 65 y (IQR 57-71); 1151 (66.8%) male, 573 (33.2%) female',
      nihssRange: 'Entry range NIHSS 4-25 with level-of-consciousness subscale (1a) ≤1, but MEDIAN BASELINE NIHSS WAS 5 (IQR 4-7) — a predominantly mild-stroke cohort',
      timeWindow: '≤72 h from onset',
      keyInclusion: ['Ischaemic stroke in the previous 72 hours', 'NIHSS 4-25 with NIHSS subscale 1a (level of consciousness) score of 1 or less', 'Block randomisation stratified by study site; patients, treating clinicians and investigators all fully masked', '58 hospitals across China, 19 May 2023 - 20 May 2024; NCT05836740'],
      keyExclusion: []
    },
    intervention: 'Oral minocycline, 200 mg loading dose then 100 mg every 12 h for the subsequent 4 days, in addition to routine treatment (n=862 randomized; 850 in the primary analysis)',
    comparator: 'Matching oral placebo in addition to routine treatment (n=862 randomized; 851 in the primary analysis)',
    primaryEndpoint: {
      definition: 'Excellent functional outcome at 90 days, defined as modified Rankin Scale score 0-1; analysed in all patients randomised who received at least one dose, without imputation for missing data',
      timepoint: '90 days',
      result: 'MET: mRS 0-1 in 447/850 (52.6%) with minocycline vs 403/851 (47.4%) with placebo — a 5.2 percentage-point absolute difference favouring minocycline',
      effectSize: 'Adjusted risk ratio 1.11',
      confidenceInterval: '95% CI 1.03 to 1.20',
      pValue: 'p=0.0061'
    },
    secondaryEndpoints: [
      {
        name: 'Ordinal analysis across the full range of mRS scores',
        result: 'Also favoured minocycline: adjusted common odds ratio 1.19 (95% CI 1.03 to 1.38); p=0.018'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage similar between groups at 24 h (1/860 [0.1%] minocycline vs 0/861 [0%] placebo) and at 6 days (3/859 [0.3%] vs 0/861 [0%])',
      mortality: 'Not reported separately in the abstract',
      other: 'Serious adverse events 40/862 (4.6%) with minocycline vs 51/862 (5.9%) with placebo; p=0.24. No significant differences in other safety outcomes'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The largest positive acute neuroprotection trial in this category and a genuinely interesting result — a cheap, oral, off-patent anti-inflammatory given up to 72 h after onset. The number that governs how it should be read is the median baseline NIHSS of 5, well down in the mild end of the 4-25 entry range. The trial therefore speaks to mild ischaemic stroke in a Chinese population, not to the severe strokes the entry criteria might suggest, and the authors explicitly say future work is needed to establish whether benefit extends to more severe or more minor strokes. Read directly against MIST-A, the phase 2 minocycline trial in thrombectomy patients that was flatly null on infarct growth.',
    limitations: 'Single-country conduct across 58 Chinese hospitals, with the generalisability limits that implies for stroke aetiology, background care and case mix. The effect is modest (adjusted RR 1.11, lower bound 1.03) on a dichotomised endpoint. Enrolment out to 72 h is far beyond any plausible window for a purely neuroprotective mechanism, which complicates the mechanistic story. No imputation for missing data. Mortality is not separately reported in the abstract. The authors themselves call for confirmation.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-emphasis-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The strongest positive neuroprotection signal to date, but in a mild-stroke Chinese cohort awaiting replication — not yet a reason to give minocycline outside a trial.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "mist-a",
    "shortName": "MIST-A",
    "fullName": "Efficacy and safety of minocycline on patients with acute anterior circulation ischaemic stroke undergoing mechanical thrombectomy (MIST-A): a multicentre, prospective, randomised, open-label, blinded-endpoint, phase 2 trial",
    "topic": "acute-neuroprotection",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "acute-neuroprotection"
    ],
    "population": {
      "n": 189,
      "ageRange": "18–85 years",
      "nihssRange": "6–30",
      "timeWindow": "After mechanical thrombectomy with successful recanalisation",
      "keyInclusion": [
        "Ischaemic stroke due to anterior-circulation large-vessel occlusion",
        "Successful recanalisation achieved after mechanical thrombectomy",
        "Randomised 1:1 via a centralised web-based system",
        "189 randomly assigned; 2 excluded for major protocol violations, leaving 187 in the modified intention-to-treat analysis",
        "8 hospitals in China, 21 Nov 2022 - 9 Jun 2025; NCT05487417"
      ],
      "keyExclusion": [
        "Major protocol violations (2 patients excluded post-randomisation)"
      ]
    },
    "intervention": "Minocycline 200 mg loading dose within one hour of successful recanalization, then 100 mg twice daily for five days; oral or nasogastric administration",
    "comparator": "Standard care alone — open-label, no placebo (n=93 in the mITT analysis)",
    "primaryEndpoint": {
      "definition": "Infarct growth ratio, defined as day-5 infarct volume divided by baseline infarct volume, in the modified intention-to-treat population",
      "timepoint": "Day 5",
      "result": "DID NOT meet: median infarct growth ratio 1.8 (IQR 1.3-3.3) with minocycline vs 1.6 (IQR 1.2-2.8) with standard care — no reduction in infarct growth, with the point estimate numerically favouring the control arm",
      "effectSize": "Adjusted geometric mean ratio 1.10",
      "confidenceInterval": "95% CI 0.84 to 1.45",
      "pValue": "p=0.49"
    },
    "secondaryEndpoints": [
      {
        "name": "Functional independence (mRS 0-2) at day 90",
        "result": "64/94 (68.1%) with minocycline vs 67/93 (72.0%) with standard care; adjusted risk ratio 1.00 (95% CI 0.70 to 1.43) — no difference"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported separately in the abstract",
      "mortality": "Not reported separately in the abstract",
      "other": "No significant differences in adverse events (72/94 [76.6%] vs 64/93 [68.8%]) or serious adverse events (24/94 [25.5%] vs 24/93 [25.8%])"
    },
    "imagingCriteria": "Anterior-circulation large-vessel occlusion with successful recanalisation after thrombectomy; serial infarct volumes (baseline and day 5) constituted the primary endpoint",
    "applicabilityNotes": "The essential counterweight to EMPHASIS. Same drug, same class of mechanism, opposite result — and the two are not actually contradictory, because they test different populations and different endpoints. MIST-A asks whether minocycline limits infarct growth after successful reperfusion and answers no; EMPHASIS asks whether it improves 90-day function in mostly mild strokes treated within 72 h and answers a qualified yes. Carrying both prevents the category from reading as a settled positive. The authors state plainly that these findings do not support minocycline as a neuroprotective therapy in the post-thrombectomy population.",
    "limitations": "Phase 2 with only 187 patients analysed — far too small to exclude a clinically meaningful effect on 90-day function, so the null clinical result should be read as uninformative rather than as evidence of no benefit. Open-label design (blinded endpoint assessment and blinded imaging mitigate but do not eliminate bias). The primary endpoint is a radiological surrogate, not a patient-important outcome, and refuting an infarct-growth mechanism does not refute every possible route to clinical benefit. Single-country conduct across 8 Chinese hospitals. Baseline demographics and stroke severity are not reported in the abstract.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-mist-a-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Shows minocycline does not limit infarct growth after successful thrombectomy, and keeps the positive EMPHASIS result from being generalised to reperfused large-vessel stroke.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "resist-ric",
    "shortName": "RESIST",
    "fullName": "Remote Ischemic Conditioning for Acute Stroke: The RESIST Randomized Clinical Trial",
    "topic": "remote-ischemic-conditioning",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ich",
      "prehospital-stroke-care",
      "remote-ischemic-conditioning"
    ],
    "population": {
      "n": 1500,
      "ageRange": "Median 71 y; 591 (41%) women",
      "nihssRange": "Not reported in the abstract — patients were enrolled prehospital on symptoms alone, before any diagnostic imaging",
      "timeWindow": "Prehospital stroke symptoms for less than 4 h",
      "keyInclusion": [
        "Prehospital suspected stroke with symptoms of less than 4 hours' duration",
        "Enrolled in the ambulance, before imaging or diagnosis",
        "4 stroke centres in Denmark, 16 Mar 2018 - 11 Nov 2022; final follow-up 3 Feb 2023",
        "1433 of 1500 (96%) completed; of these 149 (10%) had TIA and 382 (27%) a stroke mimic",
        "Prespecified target-diagnosis population n=902 (737 [82%] ischaemic stroke, 165 [18%] intracerebral haemorrhage): 436 RIC vs 466 sham",
        "NCT03481777"
      ],
      "keyExclusion": []
    },
    "intervention": "Five cycles of five-minute cuff inflation and five-minute deflation; repeat six hours later, with twice-daily treatment for seven days at the Aarhus site. Main Methods uses 200 mm Hg, or SBP+35 up to 285 mm Hg when SBP >175; abstract reports ≤200 mm Hg.",
    "comparator": "Sham conditioning with the identical cuff and schedule at 20 mm Hg (n=751 randomized)",
    "primaryEndpoint": {
      "definition": "Improvement in functional outcome measured as a shift across the modified Rankin Scale (0 = no symptoms to 6 = death) at 90 days, in the prespecified target population with a final diagnosis of ischaemic or haemorrhagic stroke (n=902)",
      "timepoint": "90 days",
      "result": "DID NOT meet: median mRS 2 (IQR 1-3) with RIC vs 1 (IQR 1-3) with sham — RIC was not associated with improved functional outcome",
      "effectSize": "Odds ratio 0.95",
      "confidenceInterval": "95% CI 0.75 to 1.20",
      "pValue": "P=0.67"
    },
    "secondaryEndpoints": [
      {
        "name": "Serious adverse events (consented analysis population)",
        "result": "169/713 (23.7%) versus 175/720 (24.3%); estimate 0.97 (95% CI 0.85–1.11), P=.68, labeled OR in abstract but RR in Table 2. This is an unresolved source-label discrepancy, not all 1500 randomized patients."
      }
    ],
    "safetyFindings": {
      "sich": "Not reported separately in the abstract",
      "mortality": "Captured within the mRS shift analysis; not reported separately in the abstract",
      "other": "Upper-extremity pain during treatment and/or skin petechiae in 54/749 (7.2%) with RIC vs 11/751 (1.5%) with sham — the intervention is not entirely benign"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The primary analysis involved 902 patients with confirmed ischemic stroke or ICH. TIA/mimic enrollment reduced target recruitment below the planned 1000 but did not dilute that target-population analysis. The primary confidence interval permits benefit or harm.",
    "limitations": "Source abstract and main text disagree about the cuff maximum and SAE effect label (abstract OR; Table 2 RR). SAE denominators were 713/720 after consent exclusions. No complete supplement clearance; neutral superiority is not proof of equivalence.",
    "certainty": "high",
    "evidenceType": "rct",
    "citationIds": [
      "cit-resist-2023"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "No demonstrated primary benefit from the tested strategy. Preserve source-reporting discrepancies and uncertainty rather than describing the trial as definitively excluding effect.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "ricamis",
    "shortName": "RICAMIS",
    "fullName": "Effect of Remote Ischemic Conditioning vs Usual Care on Neurologic Function in Patients With Acute Moderate Ischemic Stroke: The RICAMIS Randomized Clinical Trial",
    "topic": "remote-ischemic-conditioning",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "remote-ischemic-conditioning"
    ],
    "population": {
      "n": 1893,
      "ageRange": "Mean 65 y (SD 10.3); 606 (34.1%) women",
      "nihssRange": "Acute moderate ischaemic stroke (the trial's severity band; NIHSS 6-16 per the registered protocol (ClinicalTrials.gov NCT03740971); the abstract does not give the baseline median)",
      "timeWindow": "Randomised within 48 h of symptom onset",
      "keyInclusion": [
        "Acute moderate ischaemic stroke",
        "Randomised within 48 hours after symptom onset",
        "55 hospitals in China, 26 Dec 2018 - 19 Jan 2021; final follow-up 19 Apr 2021",
        "1776 of 1893 (93.8%) completed the trial",
        "Open-label with blinded endpoint assessment; analysed on a full analysis set",
        "NCT03740971",
        "Pre-stroke mRS 0–1"
      ],
      "keyExclusion": [
        "IV thrombolysis or EVT",
        "Known AF/cardioembolic source at eligibility assessment",
        "Uncontrolled BP ≥180/110 or limb contraindications to cuff treatment"
      ]
    },
    "intervention": "Bilateral upper-limb remote ischemic conditioning, five cycles of 200 mm Hg inflation for five minutes and deflation for five minutes, twice daily for 10–14 days",
    "comparator": "Guideline-based treatment alone — usual care, with NO sham conditioning (n=971)",
    "primaryEndpoint": {
      "definition": "Excellent functional outcome at 90 days, defined as modified Rankin Scale score 0-1, with blinded assessment",
      "timepoint": "90 days",
      "result": "MET: mRS 0-1 in 582 (67.4%) with RIC vs 566 (62.0%) with usual care — an absolute difference of 5.4 percentage points",
      "effectSize": "Odds ratio 1.27; risk difference 5.4%",
      "confidenceInterval": "95% CI 1.05 to 1.54 (odds ratio); 1.0% to 9.9% (risk difference)",
      "pValue": "P=0.02"
    },
    "secondaryEndpoints": [
      {
        "name": "Any adverse event",
        "result": "6.8% (59/863) with RIC vs 5.6% (51/913) with usual care"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported separately in the abstract",
      "mortality": "7/863 versus 10/913; HR 0.74 (95% CI 0.28–1.94), P=.54",
      "other": "Any adverse event 6.8% (59/863) vs 5.6% (51/913)"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The positive RIC trial, and the one whose design deserves the closest reading. The control arm received guideline-based treatment alone with no sham cuff, so patients and treating teams knew who was being conditioned twice daily for 10-14 days; blinded endpoint assessment reduces but does not remove the resulting bias, particularly for a dichotomised mRS 0-1 threshold. The investigators' own conclusion is that the findings 'require replication in another trial before concluding efficacy.' Read as a triad with RESIST (sham-controlled, prehospital, null) and SERIC-EVT (sham-controlled, post-thrombectomy, positive): the three together are the clearest illustration in this corpus of how much the control condition shapes what a trial can claim.",
    "limitations": "Open-label without sham; selected nonreperfused population and replication needed. Mortality was reported but imprecise. Eligibility excluded known cardioembolism, though later final etiologic classification included 22 cardioembolic cases; do not conflate screening with final diagnosis.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-ricamis-2022"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Shows a 5.4-point absolute gain in excellent outcome with RIC in moderate stroke, but from an unblinded usual-care comparison the authors themselves say needs replication.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'seric-evt',
    shortName: 'SERIC-EVT',
    fullName: 'Remote ischaemic conditioning improves outcomes of ischaemic stroke treated by endovascular thrombectomy: the SERIC-EVT trial',
    topic: 'remote-ischemic-conditioning',
    diseaseArea: ['acute-ischemic-stroke', 'remote-ischemic-conditioning'],
    population: {
      n: 498,
      ageRange: 'Not reported in the abstract',
      nihssRange: 'Not reported in the abstract',
      timeWindow: 'After endovascular thrombectomy for acute large-vessel occlusion',
      keyInclusion: ['Acute ischaemic stroke treated with endovascular thrombectomy', 'Randomised 1:1 to RIC or sham RIC', '25 hospitals', '498 participants recruited; 10 (2.0%) excluded because they received no intervention, leaving 488 (244 RIC / 244 sham) in the modified intention-to-treat analysis', 'Participant-blinded design'],
      keyExclusion: ['Received no study intervention after randomisation (10 patients, 2.0%)']
    },
    intervention: 'Remote ischaemic conditioning at a cuff pressure of 200 mmHg, twice daily for 7 days (n=244 in the mITT analysis)',
    comparator: 'Sham remote ischaemic conditioning at 60 mmHg using the identical procedure and schedule (n=244 in the mITT analysis)',
    primaryEndpoint: {
      definition: 'Proportion of patients with a modified Rankin Scale score of 0-2 on day 90',
      timepoint: 'Day 90',
      result: 'MET: mRS 0-2 in 61.1% with RIC vs 48.9% with sham RIC — note that the effect estimate reported in the abstract is UNADJUSTED',
      effectSize: 'Unadjusted risk ratio 1.25',
      confidenceInterval: '95% CI 1.06 to 1.47',
      pValue: 'P=0.009'
    },
    secondaryEndpoints: [
      {
        name: 'Haemorrhagic transformation within 7 days (primary safety outcome)',
        result: '37.7% with RIC vs 35.2% with sham RIC — no signal of excess haemorrhage'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately; the prespecified safety outcome was any haemorrhagic transformation within 7 days, 37.7% vs 35.2%',
      mortality: 'Not reported separately in the abstract',
      other: 'No excess haemorrhagic transformation with RIC'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The strongest remote ischemic conditioning signal to date and the only sham-controlled positive result in this category: a 12.2 percentage-point absolute gain in 90-day independence after thrombectomy. It answers the objection raised against RICAMIS — that its result came from an unblinded usual-care comparison — because SERIC-EVT used a genuine sham cuff. Three cautions keep it from being decisive: the headline effect estimate is unadjusted, the analysis is modified intention-to-treat with 10 post-randomisation exclusions, and the abstract describes the trial as participant-blinded without stating that outcome assessors were blinded. Read directly against EnTRIPS, which tested post-thrombectomy conditioning against usual care and was null.',
    limitations: 'The reported risk ratio is unadjusted, so imbalance in baseline prognostic factors is not accounted for in the headline number. Modified intention-to-treat analysis with 10 post-randomisation exclusions departs from strict ITT. The abstract states participant blinding but not assessor blinding. Baseline age, stroke severity, country and trial dates are not given in the abstract, which limits judgement about generalisability. A twice-daily 7-day intervention carries real adherence and staffing costs.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-seric-evt-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The first sham-controlled evidence that RIC after thrombectomy may improve 90-day independence — promising enough to justify confirmatory trials, not enough to change practice.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'entrips',
    shortName: 'EnTRIPS',
    fullName: 'Remote Ischemic Postconditioning in Endovascular Thrombectomy for Stroke: The EnTRIPS Randomized Clinical Trial',
    topic: 'remote-ischemic-conditioning',
    diseaseArea: ['acute-ischemic-stroke', 'remote-ischemic-conditioning'],
    population: {
      n: 270,
      ageRange: 'Mean 65.5 y (SD 16.8); 171 (63.8%) men',
      nihssRange: 'Not reported in the abstract',
      timeWindow: 'Presentation within 24 h of onset; conditioning randomised and started within 6 h AFTER endovascular treatment',
      keyInclusion: ['Adults with acute ischaemic stroke due to large-vessel occlusion presenting within 24 hours of symptom onset', 'Underwent endovascular treatment and achieved successful recanalisation', 'Randomised within 6 hours after endovascular treatment — an ultra-early postconditioning design', '8 hospitals in China, 12 Apr 2021 - 26 Mar 2025', '268 of 270 (99.3%) completed the trial (133 RIPC / 135 control)', 'Outcome-assessor blinded; NCT04581759'],
      keyExclusion: []
    },
    intervention: 'Remote ischemic POSTconditioning for 7 days using pneumatic devices — 5 cycles of bilateral upper-arm cuff inflation (5 min at 180 mm Hg) followed by 3 min deflation — plus guideline-based therapy (n=135 randomized; 133 completed)',
    comparator: 'Guideline-based therapy alone, with no sham conditioning (n=135)',
    primaryEndpoint: {
      definition: 'Functional independence at 90 days, defined as modified Rankin Scale score 0-2 (range 0 [no symptoms] to 6 [death])',
      timepoint: '90 days',
      result: 'DID NOT meet: mRS 0-2 in 81/133 (60.9%) with RIPC vs 78/135 (57.8%) with control — no significant improvement in 90-day functional outcome',
      effectSize: 'Adjusted risk ratio 1.07',
      confidenceInterval: '95% CI 0.89 to 1.30',
      pValue: 'P=0.46'
    },
    secondaryEndpoints: [
      {
        name: 'RIPC-related adverse events within 7 days',
        result: '10/133 (7.5%) in the RIPC group; no intervention-related adverse events in the control group'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the abstract',
      mortality: 'Not reported separately in the abstract',
      other: 'RIPC-related adverse events in 10/133 (7.5%); none in the control arm. The authors conclude ultra-early RIPC is safe in this population'
    },
    imagingCriteria: 'Large-vessel occlusion with successful recanalisation after endovascular treatment',
    applicabilityNotes: 'The negative counterweight that keeps the SERIC-EVT signal in proportion. Both trials conditioned thrombectomy patients for 7 days and both measured 90-day mRS 0-2, yet SERIC-EVT found a 12.2-point absolute gain against a sham cuff while EnTRIPS found 3.1 points against usual care and no significant effect. The obvious differences — EnTRIPS is roughly half the size (270 vs 498 randomised), required successful recanalisation before randomisation, used 180 rather than 200 mm Hg with a shorter deflation phase, and used a no-sham control — are exactly the variables a fellow should be able to list when asked why two similar trials disagree. Neither result should be presented as settling the question.',
    limitations: '270 patients is underpowered to exclude the size of effect SERIC-EVT reported; a 95% CI running to 1.30 leaves a clinically meaningful benefit inside the interval, so this is a non-significant result rather than a demonstration of no effect. No sham control — outcome assessors were blinded but patients and treating teams were not. Restricting entry to successful recanalisation selects a population already doing comparatively well (57.8% independence in the control arm), compressing the room for improvement. Single-country conduct across 8 Chinese hospitals.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-entrips-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Ultra-early remote ischemic postconditioning after successful thrombectomy was safe but showed no functional benefit, so the RIC-after-EVT question remains open rather than answered.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'vesalius-cv',
    shortName: 'VESALIUS-CV',
    fullName: 'Evolocumab in Patients without a Previous Myocardial Infarction or Stroke (VESALIUS-CV)',
    topic: 'lipid-lowering-prevention',
    diseaseArea: ['secondary-prevention', 'lipid-lowering-prevention'],
    population: {
      n: 12257,
      ageRange: 'median 66 years; 43% women, 93% White',
      nihssRange: 'not applicable — no prior stroke permitted',
      timeWindow: 'median follow-up 4.6 years',
      keyInclusion: ['Atherosclerosis or diabetes', 'LDL cholesterol at least 90 mg/dL', 'No previous myocardial infarction and no previous stroke'],
      keyExclusion: ['Previous myocardial infarction', 'Previous stroke']
    },
    intervention: 'Evolocumab 140 mg subcutaneously every 2 weeks (n=6129)',
    comparator: 'Matching placebo every 2 weeks (n=6128)',
    primaryEndpoint: {
      definition: 'Two primary end points — 3-point MACE (death from coronary heart disease, myocardial infarction, or ischemic stroke) and 4-point MACE (3-point MACE or ischemia-driven arterial revascularization); superiority design',
      timepoint: '5-year Kaplan-Meier estimate, median follow-up 4.6 years',
      result: 'MET both primary end points. 3-point MACE in 336 patients (5-year KM 6.2%) with evolocumab vs 443 (8.0%) with placebo; 4-point MACE in 747 (13.4%) vs 907 (16.2%)',
      effectSize: '3-point MACE hazard ratio 0.75; 4-point MACE hazard ratio 0.81',
      confidenceInterval: '3-point MACE 95% CI 0.65 to 0.86; 4-point MACE 95% CI 0.73 to 0.89',
      pValue: 'P<0.001 for both primary end points'
    },
    secondaryEndpoints: [
      {
        name: '4-point MACE (3-point MACE or ischemia-driven arterial revascularization)',
        result: '13.4% vs 16.2% at 5 years; hazard ratio 0.81 (95% CI 0.73 to 0.89), P<0.001 — reported as the second primary end point, not a hierarchical secondary'
      }
    ],
    safetyFindings: {
      sich: 'Not reported — intracranial hemorrhage was not an abstract-level end point',
      mortality: 'Not reported separately in the abstract; death from coronary heart disease was a component of the primary composite',
      other: 'No evidence of a between-group difference in the incidence of safety events'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the PCSK9 trial that sits UPSTREAM of the stroke clinic, not inside it: everyone with a previous stroke or myocardial infarction was excluded by design, so it cannot be quoted at the bedside of a stroke survivor. Its relevance is that it extends the FOURIER/ODYSSEY OUTCOMES story — PCSK9 inhibition in established atherosclerotic disease, including patients with a previous ischaemic stroke in FOURIER — into a population with atherosclerosis or diabetes but no prior event, and ischemic stroke is one of the three components of the primary composite. For secondary prevention after ischemic stroke the governing trials remain SPARCL (atorvastatin 80 mg) and Treat Stroke to Target (LDL <70 vs 90-110 mg/dL).',
    limitations: 'By construction it excludes the very patients a stroke service treats; 93% White, limiting generalizability; the primary composite is driven by coronary as well as cerebrovascular events, and no stroke-specific effect estimate is given in the abstract; industry-funded (Amgen).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-vesalius-cv-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that the PCSK9 evidence base now reaches patients with atherosclerosis or diabetes and no prior event — but explicitly not stroke survivors, for whom SPARCL and Treat Stroke to Target remain the anchors.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'ez-pave',
    shortName: 'Ez-PAVE',
    fullName: 'Intensive LDL Cholesterol Targeting in Atherosclerotic Cardiovascular Disease (Ez-PAVE)',
    topic: 'lipid-lowering-prevention',
    diseaseArea: ['secondary-prevention', 'lipid-lowering-prevention'],
    population: {
      n: 3048,
      ageRange: '19-80 years by protocol; age distribution not reported in the abstract',
      nihssRange: 'not reported — enrolment was by ASCVD status, not stroke severity',
      timeWindow: 'median follow-up 3.0 years',
      keyInclusion: ['Documented atherosclerotic cardiovascular disease — prior acute coronary syndrome, stable angina with imaging or functional confirmation, coronary or other arterial revascularization, stroke or TIA, or peripheral artery disease', 'Conducted entirely in South Korea'],
      keyExclusion: ['LDL cholesterol below 70 mg/dL without statin therapy', 'Active liver disease or unexplained AST/ALT above twice the upper limit of normal', 'Statin or ezetimibe allergy', 'Solid-organ transplant recipient', 'Life expectancy under 3 years']
    },
    intervention: 'Treat-to-target LDL cholesterol below 55 mg/dL (1.4 mmol/L) — intensive-targeting group (n=1526); achieved median on-treatment LDL 56 mg/dL',
    comparator: 'Treat-to-target LDL cholesterol below 70 mg/dL (1.8 mmol/L) — conventional-targeting group (n=1522); achieved median on-treatment LDL 66 mg/dL',
    primaryEndpoint: {
      definition: 'Composite of death from cardiovascular causes, nonfatal myocardial infarction, nonfatal stroke, any revascularization, or hospitalization for unstable angina; open-label superiority design',
      timepoint: '3 years',
      result: 'MET superiority: 100 events (Kaplan-Meier cumulative incidence 6.6%) with the <55 mg/dL target vs 147 events (9.7%) with the <70 mg/dL target',
      effectSize: 'Hazard ratio 0.67',
      confidenceInterval: '95% CI 0.52 to 0.86',
      pValue: 'P=0.002'
    },
    secondaryEndpoints: [
      {
        name: 'Achieved LDL cholesterol separation',
        result: 'Median on-treatment LDL 56 mg/dL (intensive) vs 66 mg/dL (conventional) — a 10 mg/dL separation, narrower than the 15 mg/dL gap between the assigned targets'
      },
      {
        name: 'Prespecified safety end points',
        result: 'Similar between groups except a LOWER incidence of creatinine elevation in the intensive-targeting group'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported separately; cardiovascular death was a component of the primary composite',
      other: 'Prespecified safety end-point incidence similar between groups, apart from less creatinine elevation with intensive targeting'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The first randomized test of <55 vs <70 mg/dL in established ASCVD, and therefore the natural successor question to Treat Stroke to Target, which compared <70 with 90-110 mg/dL after ischemic stroke or TIA. But this is a mixed-ASCVD trial in which stroke and TIA are only one qualifying entry route, no stroke subgroup estimate is reported, and \'any revascularization\' — a coronary-driven, operator-influenced outcome — sits inside the primary composite of an OPEN-LABEL trial. It supports, and does not settle, an LDL target below 55 for a stroke survivor.',
    limitations: 'Open-label, so a soft revascularization component inside the primary composite is vulnerable to ascertainment bias; single-country (South Korea) with unknown transportability; the achieved LDL separation was only 10 mg/dL; 3-year follow-up; no reported stroke-specific or stroke-subgroup effect estimate.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-ez-pave-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds randomized support for pushing LDL below 55 mg/dL in established atherosclerotic disease, while teaching why an open-label composite containing \'any revascularization\' cannot be read as a stroke-specific result.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'soul',
    shortName: 'SOUL',
    fullName: 'Oral Semaglutide and Cardiovascular Outcomes in High-Risk Type 2 Diabetes (SOUL)',
    topic: 'glp1-metabolic-prevention',
    diseaseArea: ['secondary-prevention', 'glp1-metabolic-prevention'],
    population: {
      n: 9650,
      ageRange: '50 years or older',
      nihssRange: 'not applicable — enrolment by vascular and renal risk, not stroke severity',
      timeWindow: 'mean follow-up 47.5 ± 10.9 months; median 49.5 months',
      keyInclusion: ['Age 50 years or older', 'Type 2 diabetes with glycated hemoglobin 6.5-10.0%', 'Known atherosclerotic cardiovascular disease, chronic kidney disease, or both'],
      keyExclusion: ['Not specified in the abstract beyond the inclusion frame']
    },
    intervention: 'Once-daily ORAL semaglutide, maximal dose 14 mg, in addition to standard care (n=4825)',
    comparator: 'Matching oral placebo in addition to standard care (n=4825)',
    primaryEndpoint: {
      definition: 'Major adverse cardiovascular events — composite of death from cardiovascular causes, nonfatal myocardial infarction, or nonfatal stroke, in a time-to-first-event analysis; event-driven superiority design',
      timepoint: 'median 49.5 months',
      result: 'MET superiority: 579 of 4825 (12.0%; 3.1 events per 100 person-years) with oral semaglutide vs 668 of 4825 (13.8%; 3.7 per 100 person-years) with placebo',
      effectSize: 'Hazard ratio 0.86',
      confidenceInterval: '95% CI 0.77 to 0.96',
      pValue: 'P=0.006'
    },
    secondaryEndpoints: [
      {
        name: 'Major kidney disease events (five-point composite; confirmatory secondary)',
        result: 'DID NOT differ significantly between groups — the confirmatory secondary outcomes did not differ significantly'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported separately; cardiovascular death was a component of the primary composite',
      other: 'Serious adverse events 47.9% with oral semaglutide vs 50.3% with placebo; gastrointestinal disorders 5.0% vs 4.4%'
    },
    imagingCriteria: '',
    applicabilityNotes: 'Extends the GLP-1 receptor agonist class benefit the app already teaches through SELECT, FLOW and SUSTAIN-6 to a NON-INJECTABLE route, which is the practical barrier most often cited in clinic. Nonfatal stroke is one of three components of the composite, so this is class-level cardiovascular evidence rather than a stroke-prevention trial; no stroke-specific effect estimate appears in the abstract. Note also that the confirmatory kidney secondary was null, so the result should not be generalized to renal end points.',
    limitations: 'Composite primary end point with no reported stroke-specific estimate; enrolment required type 2 diabetes, so it says nothing about GLP-1 therapy in non-diabetic stroke survivors; industry-funded (Novo Nordisk); the confirmatory secondary kidney outcome did not differ, which caps the breadth of the claim.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-soul-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Establishes that an oral GLP-1 receptor agonist reduces major adverse cardiovascular events in high-risk type 2 diabetes, giving a tablet option for vascular risk reduction where injection is a barrier.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'surpass-cvot',
    shortName: 'SURPASS-CVOT',
    fullName: 'Cardiovascular Outcomes with Tirzepatide versus Dulaglutide in Type 2 Diabetes (SURPASS-CVOT)',
    topic: 'glp1-metabolic-prevention',
    diseaseArea: ['secondary-prevention', 'glp1-metabolic-prevention'],
    population: {
      n: 13165,
      ageRange: 'mean 64.1 ± 8.8 years; 29.0% women',
      nihssRange: 'not applicable — enrolment by diabetes and atherosclerotic disease status',
      timeWindow: 'event-driven; follow-up duration not stated in the abstract',
      keyInclusion: ['Type 2 diabetes', 'Atherosclerotic cardiovascular disease', 'Mean body-mass index 32.6 ± 5.5; mean glycated hemoglobin 8.4 ± 0.9%; mean diabetes duration 14.7 ± 8.8 years'],
      keyExclusion: ['134 of 13,299 randomized patients were excluded post-randomization for not meeting inclusion criteria, leaving a modified intention-to-treat population of 13,165']
    },
    intervention: 'Tirzepatide (dual GIP/GLP-1 receptor agonist) up to 15 mg weekly subcutaneously (n=6586)',
    comparator: 'ACTIVE comparator — dulaglutide 1.5 mg weekly subcutaneously, an agent already shown to reduce cardiovascular events (n=6579)',
    primaryEndpoint: {
      definition: 'Composite of death from cardiovascular causes, myocardial infarction, or stroke, tested for NON-INFERIORITY of tirzepatide to dulaglutide with a margin of 1.05 for the upper limit of the 95.3% confidence interval of the hazard ratio; an upper limit below 1.00 would indicate superiority',
      timepoint: 'event-driven; timepoint not stated in the abstract',
      result: 'MET non-inferiority but DID NOT meet superiority: 801 events (12.2%) with tirzepatide vs 862 (13.1%) with dulaglutide',
      effectSize: 'Hazard ratio 0.92',
      confidenceInterval: '95.3% CI 0.83 to 1.01',
      pValue: 'P=0.003 for non-inferiority; P=0.09 for superiority'
    },
    secondaryEndpoints: [
      {
        name: 'Adverse events',
        result: 'Appeared similar between the two groups, although more gastrointestinal adverse events occurred with tirzepatide'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract',
      mortality: 'Not reported separately; cardiovascular death was a component of the primary composite',
      other: 'More gastrointestinal adverse events with tirzepatide; overall adverse-event incidence appeared similar'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The counterweight to the positive incretin story. Every GLP-1 cardiovascular trial the app carries — SELECT, FLOW, SUSTAIN-6 and now SOUL — is placebo-controlled and positive; SURPASS-CVOT is the head-to-head, and a more potent dual incretin agonist with larger weight and HbA1c effects was NOT superior to dulaglutide for the composite of cardiovascular death, myocardial infarction or stroke. The honest reading is that incretin cardioprotection appears to be a class effect with a ceiling, not a dose- or potency-graded one. Stroke sits inside the composite with no separate estimate reported.',
    limitations: 'Active-comparator non-inferiority design, so it cannot quantify benefit versus no treatment; superiority was formally tested and NOT met (P=0.09); no stroke-specific effect estimate in the abstract; 134 randomized patients were excluded post-randomization from the modified ITT population; industry-funded (Eli Lilly).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-surpass-cvot-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Caps expectations for incretin therapy: tirzepatide matched but did not beat dulaglutide on cardiovascular events, so agent choice within the class should turn on glycemic, weight, tolerability and access considerations rather than on an assumed cardiovascular advantage.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'save-cpap',
    shortName: 'SAVE',
    fullName: 'Sleep Apnea Cardiovascular Endpoints — CPAP for Prevention of Cardiovascular Events in Obstructive Sleep Apnea (SAVE)',
    topic: 'sleep-apnea-stroke',
    diseaseArea: ['secondary-prevention', 'sleep-apnea-stroke'],
    population: {
      n: 2717,
      ageRange: '45-75 years; most participants were men',
      nihssRange: 'not reported — enrolment was by established coronary or cerebrovascular disease, not stroke severity',
      timeWindow: 'mean follow-up 3.7 years',
      keyInclusion: ['Moderate-to-severe obstructive sleep apnea', 'Established coronary or cerebrovascular disease', '1-week sham-CPAP run-in before randomization', 'Most participants had minimal daytime sleepiness'],
      keyExclusion: ['Excessive daytime sleepiness or high sleep-related accident risk (Epworth Sleepiness Scale >15, driver occupation, or a fall-asleep or near-miss accident in the previous 12 months) — an explicit exclusion criterion']
    },
    intervention: 'CPAP plus usual care; mean adherence 3.3 hours per night, with apnea-hypopnea index falling from 29.0 to 3.7 events per hour',
    comparator: 'Usual care alone',
    primaryEndpoint: {
      definition: 'Composite of death from cardiovascular causes, myocardial infarction, stroke, or hospitalization for unstable angina, heart failure, or transient ischemic attack',
      timepoint: 'mean follow-up 3.7 years',
      result: 'DID NOT meet: a primary end-point event occurred in 229 CPAP participants (17.0%) and 207 usual-care participants (15.4%) — the point estimate favors usual care',
      effectSize: 'Hazard ratio with CPAP 1.10',
      confidenceInterval: '95% CI 0.91 to 1.32',
      pValue: 'P=0.34'
    },
    secondaryEndpoints: [
      {
        name: 'Individual and other composite cardiovascular end points',
        result: 'No significant effect on any individual or other composite cardiovascular end point'
      },
      {
        name: 'Snoring and daytime sleepiness',
        result: 'Significantly reduced by CPAP'
      },
      {
        name: 'Health-related quality of life and mood',
        result: 'Significantly improved by CPAP'
      }
    ],
    safetyFindings: {
      sich: 'Not reported — not an end point of this trial',
      mortality: 'Cardiovascular death was a component of the primary composite; no significant effect on any individual cardiovascular end point',
      other: 'No safety signal reported; the trial\'s limiting problem was adherence, at a mean of 3.3 hours per night'
    },
    imagingCriteria: '',
    applicabilityNotes: 'SAVE is the reference negative trial for sleep-disordered breathing in vascular prevention, and it belongs in secondary prevention rather than in a rehabilitation list. The result is squarely null for cardiovascular events, including stroke, in patients with moderate-to-severe obstructive sleep apnea and established coronary or cerebrovascular disease. Two features constrain how far the null generalizes: adherence averaged only 3.3 hours per night, well below the 4-hour threshold usually taken as adequate, and participants with significant daytime sleepiness were largely absent. What CPAP did deliver — less snoring, less sleepiness, better quality of life and mood — remains a legitimate reason to treat symptomatic sleep apnea; it is the event-reduction claim that this trial does not support.',
    limitations: 'Open-label, usual-care comparator rather than sham CPAP after the run-in; mean adherence of only 3.3 h/night makes this as much a test of a CPAP strategy as of CPAP itself; a minimally sleepy population, so the sleepy patients most likely to adhere and benefit were under-represented; predominantly male.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-save-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that CPAP should be offered for symptoms — sleepiness, snoring, quality of life — and not promised as a way to prevent recurrent vascular events; the largest randomized test found no event reduction.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'poststroke-pap-meta-2026',
    shortName: 'Post-stroke PAP meta-analysis',
    fullName: 'Post-stroke sleep disordered breathing and the effect of positive airway pressure treatment: an updated systematic review and meta-analysis of randomized controlled trials',
    topic: 'sleep-apnea-stroke',
    diseaseArea: ['secondary-prevention', 'sleep-apnea-stroke'],
    population: {
      n: 1457,
      ageRange: 'not reported in the abstract',
      nihssRange: 'not reported in the abstract',
      timeWindow: 'records searched from inception in July 2024 up to September 2024; 72,387 records screened',
      keyInclusion: ['Randomized controlled trials of positive airway pressure treatment in patients after stroke', '21 RCTs, 753 patients in the PAP arm and 704 in the conventional arm'],
      keyExclusion: ['Non-randomized studies']
    },
    intervention: 'Positive airway pressure treatment after stroke (753 patients pooled)',
    comparator: 'Conventional care (704 patients pooled)',
    primaryEndpoint: {
      definition: 'Effectiveness of positive airway pressure on recurrent vascular events after stroke (with neurological deficit, functional independence, depression, sleepiness and cognition as co-reported outcomes); pooled random-effects meta-analysis',
      timepoint: 'as reported by the 21 constituent trials',
      result: 'PAP reduced recurrent vascular events',
      effectSize: 'OR 0.45',
      confidenceInterval: '95% CI 0.28 to 0.78',
      pValue: 'p < 0.01'
    },
    secondaryEndpoints: [
      {
        name: 'Functional independence',
        result: 'NOT improved — 0.25 (95% CI -0.11 to 0.60; p = 0.17). The abstract labels this an OR, but a negative lower bound indicates a standardised mean difference'
      },
      {
        name: 'Neurological deficit',
        result: 'Improved — -0.30 (95% CI -0.47 to -0.14; p < 0.01), reported in the abstract as an \'OR\' but on a continuous (SMD) scale'
      },
      {
        name: 'Daytime sleepiness',
        result: 'Reduced — -0.96 (95% CI -1.47 to -0.45; p < 0.01), again on a continuous scale despite the \'OR\' label'
      },
      {
        name: 'Depression',
        result: 'Improved — -0.58 (95% CI -1.05 to -0.11; p = 0.02), continuous scale'
      },
      {
        name: 'Cognitive function',
        result: 'Improved — 1.10 (95% CI 0.35 to 1.86; p = 0.02), continuous scale'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — not an outcome of this review',
      mortality: 'Not reported as a separate pooled outcome in the abstract',
      other: 'Adherence, the dominant problem in the individual trials, is not quantified in the abstract'
    },
    imagingCriteria: '',
    applicabilityNotes: 'Read this as a PAIR with SAVE, never on its own. This pooled analysis of 21 post-stroke trials reports a large reduction in recurrent vascular events (OR 0.45), while SAVE — a single trial larger than the entire meta-analysis at n=2717 versus n=1457 — found no reduction at all (HR 1.10, 95% CI 0.91 to 1.32). The tension is real and unresolved: the meta-analysis pools many small, mostly open-label, stroke-specific trials whose event counts are low, whereas SAVE is a large adequately powered trial in mixed coronary and cerebrovascular disease with poor adherence and minimal sleepiness. Where they overlap they agree on symptoms rather than events: SAVE found CPAP reduced daytime sleepiness and improved mood, and the meta-analysis found PAP reduced sleepiness and depression. SAVE did not measure functional independence, which the meta-analysis found was not improved.',
    limitations: 'Only 1457 patients across 21 trials, so the pooled event count is small and vulnerable to small-study effects and publication bias; the constituent trials are heterogeneous in PAP modality, timing after stroke and adherence; the abstract mislabels continuous outcomes (neurological deficit, sleepiness, depression, cognition) as odds ratios when the negative bounds identify them as standardised mean differences; no adherence-stratified estimate is reported; directly contradicted on its headline outcome by the larger SAVE trial.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-poststroke-pap-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Keeps the post-stroke sleep-apnea question open rather than closing it: a pooled signal for fewer recurrent vascular events sits against a larger neutral trial, and neither supports promising a patient that PAP will improve functional independence.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "anti-inflammatory-cv-meta-2026",
    "shortName": "Anti-inflammatory CV meta-analysis",
    "fullName": "Effects of anti-inflammatory agents on cardiovascular outcomes: a systematic review and meta-analysis of randomised controlled trials",
    "topic": "inflammation-stroke-prevention",
    "diseaseArea": [
      "secondary-prevention",
      "inflammation-stroke-prevention"
    ],
    "population": {
      "n": 82208,
      "ageRange": "not reported in the abstract — trial-level meta-analysis",
      "nihssRange": "not applicable",
      "timeWindow": "Medline, Embase and Cochrane searched from inception to 8 October 2024; trials required at least 100 patient-years of follow-up per treatment arm",
      "keyInclusion": [
        "Randomised controlled trials of anti-inflammatory therapies with a primary cardiovascular outcome",
        "At least 100 patient-years of follow-up per treatment arm",
        "13 trials, 82,208 participants"
      ],
      "keyExclusion": [
        "Trials with under 100 patient-years of follow-up per arm",
        "Trials without a primary cardiovascular outcome"
      ]
    },
    "intervention": "Anti-inflammatory therapy across drug classes — colchicine, canakinumab, methotrexate and others",
    "comparator": "Placebo or control as randomized within each constituent trial",
    "primaryEndpoint": {
      "definition": "Major adverse cardiovascular events (MACE), pooled by trial-level random-effects meta-analysis with a test for heterogeneity of effect BY DRUG CLASS",
      "timepoint": "as reported by the 13 constituent trials",
      "result": "The effect on MACE VARIED BY DRUG CLASS rather than being uniform — driven by colchicine (RR 0.76, moderate certainty) and canakinumab (RR 0.88, moderate certainty), with NO benefit observed for other agents",
      "effectSize": "Colchicine RR 0.76; canakinumab RR 0.88; no benefit for other classes",
      "confidenceInterval": "Colchicine 95% CI 0.65 to 0.90; canakinumab 95% CI 0.79 to 0.97",
      "pValue": "P-heterogeneity by drug class = 0.049"
    },
    "secondaryEndpoints": [
      {
        "name": "Heterogeneity within the colchicine trials",
        "result": "Significant heterogeneity among colchicine trials (P-heterogeneity=0.003); subgroup analyses suggested GREATER benefit in coronary artery disease and/or recent myocardial infarction trials (P-heterogeneity=0.068)"
      },
      {
        "name": "Serious adverse events",
        "result": "Varied significantly by drug class (P-heterogeneity=0.005), largely attributable to methotrexate"
      },
      {
        "name": "Infection and malignancy",
        "result": "Some evidence of heterogeneity by class — infection P-heterogeneity=0.076, malignancy P-heterogeneity=0.077"
      }
    ],
    "safetyFindings": {
      "sich": "Not reported — intracranial hemorrhage was not a pooled outcome",
      "mortality": "Not reported as a separate pooled outcome in the abstract",
      "other": "Serious adverse events differed significantly by drug class, largely attributable to methotrexate; class-level differences also suggested for infection and malignancy"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "The synthesis includes CLEAR-SYNERGY (7062 participants) in Table 1. Exploratory trial-population comparisons do not prove a coronary-only benefit or explain why individual stroke trials were neutral.",
    "limitations": "Trial-level ecological and post hoc subgroup comparisons; heterogeneous drugs and populations. CLEAR-SYNERGY is included despite the stated search-date tension. Canakinumab upper CI differs in abstract (.97) and body (.98); no silent reconciliation or exhaustive underlying-trial re-extraction.",
    "certainty": "moderate",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-anti-inflammatory-cv-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Class and population heterogeneity remain clinically relevant, but post hoc interaction P=.068 does not establish a causal population modifier. Use indication-specific trials rather than a pooled result to select stroke treatment.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'ssi-antiplatelet-nma-2025',
    shortName: 'SSI antiplatelet network meta-analysis',
    fullName: 'Efficacy and safety of antiplatelet therapy for secondary prevention of small subcortical infarction: a systematic review and network meta-analysis',
    topic: 'lacunar-svd-prevention',
    diseaseArea: ['secondary-prevention', 'lacunar-svd-prevention'],
    population: {
      n: 47507,
      ageRange: 'not reported in the abstract — trial-level network meta-analysis',
      nihssRange: 'not reported; enrolment was by small subcortical infarction subtype',
      timeWindow: 'Medline, Embase, Cochrane Library and Web of Science searched from inception to October 2024; PROSPERO CRD42024607819',
      keyInclusion: ['Randomized controlled trials of antiplatelet therapy for secondary prevention after small subcortical infarction', '24 RCTs and 47,507 patients in the systematic review; 19 RCTs and 39,137 patients entered the network'],
      keyExclusion: ['Non-randomized studies; 5 of the 24 reviewed trials were not included in the network meta-analysis (reason not stated in the abstract)']
    },
    intervention: 'Cilostazol, and the other antiplatelet strategies in the network — clopidogrel, ticlopidine, dipyridamole, vorapaxar, sarpogrelate and aspirin plus clopidogrel',
    comparator: 'Aspirin, placebo and the other network nodes, compared indirectly',
    primaryEndpoint: {
      definition: 'Incidence of major adverse cardiovascular events (MACE), with any-stroke and ischemic-stroke recurrence as further efficacy outcomes; agents ranked by surface under the cumulative ranking curve (SUCRA)',
      timepoint: 'as reported by the constituent trials',
      result: 'Cilostazol ranked best for preventing MACE (SUCRA 90.0%), reported by the authors as significantly better than aspirin, ticlopidine, dipyridamole, vorapaxar, sarpogrelate and placebo, although the ticlopidine comparison is borderline (95% CI upper bound 1.00)',
      effectSize: 'Cilostazol vs aspirin OR 0.66; vs placebo OR 0.51; vs dipyridamole OR 0.61; vs vorapaxar OR 0.51; vs sarpogrelate OR 0.62; vs ticlopidine OR 0.65',
      confidenceInterval: 'vs aspirin 95% CI 0.49-0.89; vs placebo 0.37-0.71; vs dipyridamole 0.42-0.90; vs vorapaxar 0.35-0.74; vs sarpogrelate 0.40-0.97; vs ticlopidine 0.43-1.00 (upper bound 1.00 — borderline; reported as significant by the authors)',
      pValue: 'Not reported — inference is by 95% credible/confidence intervals and SUCRA ranking'
    },
    secondaryEndpoints: [
      {
        name: 'Severe bleeding',
        result: 'Aspirin plus clopidogrel and vorapaxar were each associated with a significantly INCREASED risk of severe bleeding compared with control'
      },
      {
        name: 'Any stroke and ischemic stroke recurrence',
        result: 'Reported as efficacy outcomes of the network; no separate effect estimates are given in the abstract'
      },
      {
        name: 'Intracranial hemorrhage and mortality',
        result: 'Prespecified safety outcomes of the network; no effect estimates given in the abstract'
      }
    ],
    safetyFindings: {
      sich: 'Intracranial hemorrhage was a prespecified safety outcome, but no pooled estimate is reported in the abstract',
      mortality: 'A prespecified safety outcome; no pooled estimate reported in the abstract',
      other: 'Aspirin plus clopidogrel and vorapaxar significantly increased severe bleeding versus control — the authors conclude both \'may be not recommended\' in this population'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The lacunar/small-vessel category in this app rests on SPS3, which established that long-term aspirin plus clopidogrel is not the answer after lacunar stroke because bleeding and mortality rise. This network reaches the same conclusion about dual therapy from a much larger evidence base and adds a positive candidate — cilostazol ranked first for MACE. Two cautions belong on the card: the cilostazol evidence base is almost entirely East Asian, where cilostazol is licensed and widely used, and the comparison against ticlopidine, although reported as significant by the authors, has a 95% CI upper bound of 1.00, so the ranking is stronger than some individual comparisons. Indirect network estimates are hypothesis-generating for a Western population, not practice-defining.',
    limitations: 'Network meta-analysis relying on indirect comparison, so estimates inherit the transitivity assumptions and any between-trial differences in era, background therapy and stroke definition; the cilostazol evidence derives predominantly from East Asian trials, limiting transportability; SUCRA rankings can promote sparsely-studied agents; 5 of 24 reviewed trials did not connect into the network; no p-values reported; component trials span decades of changing background secondary prevention.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ssi-antiplatelet-nma-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reinforces avoiding long-term aspirin plus clopidogrel after small subcortical infarction on bleeding grounds, and flags cilostazol as the best-ranked single agent in a largely East Asian evidence base that has not been replicated in Western populations.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'cadiss',
    shortName: 'CADISS',
    fullName: 'Cervical Artery Dissection in Stroke Study — antiplatelet treatment compared with anticoagulation treatment for cervical artery dissection',
    topic: 'cervical-dissection',
    diseaseArea: ['secondary-prevention', 'cervical-dissection'],
    population: {
      n: 250,
      ageRange: 'Adults; mean age not reported in the abstract. Dissection is the commonest identified cause of ischaemic stroke in adults under 50, so the enrolled population is a young-stroke population.',
      nihssRange: 'Severity not reported as NIHSS. 224/250 presented with stroke or transient ischaemic attack; 26/250 presented with local symptoms only (headache, neck pain or Horner syndrome).',
      timeWindow: 'Symptom onset within the previous 7 days; mean time to randomisation 3.65 days (SD 1.91)',
      keyInclusion: ['Extracranial carotid or vertebral artery dissection (118 carotid, 132 vertebral)', 'Onset of symptoms within the past 7 days', 'Enrolled at 39 UK and 7 Australian hospitals with specialist stroke or neurology services'],
      keyExclusion: ['No exclusion criteria are enumerated in the published abstract']
    },
    intervention: 'Antiplatelet drugs for 3 months, specific agent chosen by the local clinician (n=126)',
    comparator: 'Anticoagulant drugs for 3 months, specific agent chosen by the local clinician (n=124)',
    primaryEndpoint: {
      definition: 'Ipsilateral stroke or death in the intention-to-treat population. This was a superiority comparison of two active strategies — no non-inferiority margin was prespecified, so a null result here cannot be read as equivalence.',
      timepoint: '3 months',
      result: 'NO DIFFERENCE DETECTED, and the trial was far too small to detect one: stroke or death occurred in 3/126 (2%) assigned antiplatelet versus 1/124 (1%) assigned anticoagulant. Only 4 of all 250 patients (2%) had a recurrent stroke, all ipsilateral — an event rate far below what observational series had predicted.',
      effectSize: 'OR 0.335 as reported',
      confidenceInterval: '95% CI 0.006-4.233',
      pValue: 'p=0.63'
    },
    secondaryEndpoints: [
      {
        name: 'Preplanned per-protocol analysis excluding the 52 patients whose dissection was not confirmed on central imaging review',
        result: 'Stroke or death 3/101 (3%) antiplatelet versus 1/96 (1%) anticoagulant; OR 0.346 (95% CI 0.006-4.390), p=0.66 — same direction, same imprecision'
      },
      {
        name: 'Total recurrent stroke in the whole randomised cohort',
        result: '4/250 (2%), all ipsilateral'
      },
      {
        name: 'Central imaging adjudication of the enrolment diagnosis',
        result: 'Central review failed to confirm dissection in 52 of 250 enrolled patients — roughly one in five clinical diagnoses did not hold up'
      }
    ],
    safetyFindings: {
      sich: 'The only major bleeding event in the trial was a subarachnoid haemorrhage (an intracranial bleed) in the anticoagulant group; no other intracranial haemorrhage is reported in the abstract',
      mortality: 'No deaths in either group',
      other: 'One major bleeding event in the entire trial (subarachnoid haemorrhage, anticoagulant group)'
    },
    imagingCriteria: 'Clinician-diagnosed extracranial carotid or vertebral artery dissection at enrolment, with central imaging review performed afterwards; that review could not confirm dissection in 52 of 250 patients.',
    applicabilityNotes: 'CADISS is the trial that reframed the whole question. Before it, observational series reported recurrent stroke rates after cervical dissection high enough to make the antiplatelet-versus-anticoagulant choice feel urgent; CADISS found only 4 recurrent strokes among 250 patients over 3 months. That low background rate — not the point estimate — is the durable teaching point, because it means any true difference between the two strategies must be small in absolute terms. Read it as the first half of a pair with TREAT-CAD, and then read the Kaufmann individual-patient-data meta-analysis, which pools exactly these two trials and is the only individual-patient-data synthesis of the randomised dissection evidence. The 52 unconfirmed diagnoses are also a teaching point in their own right: radiographic criteria for dissection are applied loosely in routine practice.',
    limitations: 'Open-label with blinded endpoint assessment. Grossly underpowered for the primary endpoint — 4 events total, giving a confidence interval spanning from a 99% relative reduction to a fourfold increase. The specific antiplatelet or anticoagulant agent was left to the local clinician, so neither arm tested a single defined regimen. Central review disconfirmed the dissection diagnosis in 52 patients. Treatment lasted only 3 months, so nothing is learned about longer horizons.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-cadiss-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Establishes that recurrent stroke after cervical artery dissection is uncommon (about 2% at 3 months) and that neither antiplatelet nor anticoagulant therapy has been shown superior — so the choice can be made on bleeding risk, adherence and cost rather than on a presumed efficacy gap.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified. Correction impact unresolved: PMID 25987273 (https://doi.org/10.1016/S1474-4422(15)00045-9).",
  }),
  t({
    id: 'treat-cad',
    shortName: 'TREAT-CAD',
    fullName: 'Aspirin versus anticoagulation in cervical artery dissection (TREAT-CAD): an open-label, randomised, non-inferiority trial',
    topic: 'cervical-dissection',
    diseaseArea: ['secondary-prevention', 'cervical-dissection'],
    population: {
      n: 194,
      ageRange: 'Older than 18 years; the abstract frames cervical artery dissection as a major cause of stroke in people aged under 50',
      nihssRange: 'Not reported as NIHSS; entry required symptomatic, MRI-verified cervical artery dissection',
      timeWindow: 'Randomised within 2 weeks of symptom onset; treatment given for 90 days',
      keyInclusion: ['Age over 18 years', 'Symptomatic cervical artery dissection verified on MRI', 'Enrolment within 2 weeks before randomisation', 'Ten stroke centres across Switzerland, Germany and Denmark, 11 Sep 2013 to 21 Dec 2018'],
      keyExclusion: ['No exclusion criteria are enumerated in the published abstract']
    },
    intervention: 'Aspirin 300 mg once daily for 90 days (n=100 randomised; n=91 in the per-protocol population)',
    comparator: 'Vitamin K antagonist — phenprocoumon, acenocoumarol or warfarin, target INR 2.0-3.0 — for 90 days (n=94 randomised; n=82 in the per-protocol population)',
    primaryEndpoint: {
      definition: 'Composite of clinical outcomes (stroke, major haemorrhage or death) and MRI outcomes (new ischaemic or haemorrhagic brain lesions) in the per-protocol population, assessed at 14 days for clinical and MRI outcomes and at 90 days for clinical outcomes. NON-INFERIORITY DESIGN: aspirin would be declared non-inferior only if the upper limit of the two-sided 95% CI for the absolute risk difference lay below a 12% margin.',
      timepoint: '14 days (clinical and MRI) and 90 days (clinical)',
      result: 'DID NOT meet non-inferiority. The primary endpoint occurred in 21/91 (23%) on aspirin versus 12/82 (15%) on vitamin K antagonist; the upper bound of the confidence interval (21%) exceeded the 12% non-inferiority margin, so aspirin was NOT shown to be non-inferior. Note what this does and does not say: failing to show non-inferiority is not the same as showing inferiority.',
      effectSize: 'Absolute risk difference 8% (aspirin worse)',
      confidenceInterval: '95% CI -4 to 21 (margin 12%)',
      pValue: 'Non-inferiority p=0.55'
    },
    secondaryEndpoints: [
      {
        name: 'Ischaemic stroke',
        result: '7/91 (8%) on aspirin versus 0/82 on vitamin K antagonist'
      },
      {
        name: 'Subclinical MRI outcomes (new ischaemic or haemorrhagic lesions without clinical events)',
        result: '14/91 (15%) on aspirin versus 11/82 (13%) on vitamin K antagonist — the arms were similar on the imaging component, so the composite was driven by the clinical strokes'
      },
      {
        name: 'Adverse events (all)',
        result: '19 in the aspirin group versus 26 in the vitamin K antagonist group'
      }
    ],
    safetyFindings: {
      sich: 'No symptomatic intracranial haemorrhage is reported in the abstract; the only major haemorrhage was extracranial',
      mortality: 'No deaths in either group',
      other: 'One major extracranial haemorrhage (1%) in the vitamin K antagonist group and none in the aspirin group'
    },
    imagingCriteria: 'MRI-verified cervical artery dissection required for entry; new ischaemic or haemorrhagic lesions on follow-up MRI formed part of the primary composite, with imaging core-laboratory adjudicators masked to allocation.',
    applicabilityNotes: 'TREAT-CAD is the counterweight that keeps CADISS from being read as \'aspirin is fine\'. Because it embedded MRI lesions in the primary composite, it detected far more events than CADISS did — 33 across 173 patients rather than 4 across 250 — and all 7 ischaemic strokes fell in the aspirin arm. That is a real signal, but it comes from an open-label trial of 173 analysable patients with a wide confidence interval, so it argues for equipoise rather than for anticoagulating everyone. The honest reading of the pair is that neither trial rules the other out, which is exactly why the Kaufmann individual-patient-data meta-analysis of both was undertaken. Note also that TREAT-CAD compared aspirin with a vitamin K antagonist, not with a direct oral anticoagulant, so it says nothing about DOACs in dissection.',
    limitations: 'Open-label; investigators, patients and clinical event adjudicators were aware of allocation, and only the imaging core lab was masked. Small (173 in the per-protocol population). Primary analysis was per-protocol rather than intention-to-treat — the conservative choice for a non-inferiority trial, but it drops 21 randomised patients. The composite mixes clinical strokes with subclinical MRI lesions of uncertain prognostic weight. Vitamin K antagonists, not DOACs, formed the comparator. Confined to three European countries.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-treat-cad-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Aspirin was not shown to be non-inferior to a vitamin K antagonist after cervical artery dissection, and every ischaemic stroke in the trial occurred on aspirin — enough to keep anticoagulation a reasonable option in dissection, particularly where CADISS offers no reassurance to the contrary.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "cad-antithrombotic-ipd-meta",
    "shortName": "CAD antithrombotic IPD meta-analysis",
    "fullName": "Antithrombotic Treatment for Cervical Artery Dissection: A Systematic Review and Individual Patient Data Meta-Analysis",
    "topic": "cervical-dissection",
    "diseaseArea": [
      "secondary-prevention",
      "cervical-dissection"
    ],
    "population": {
      "n": 444,
      "ageRange": "Pooled participants of CADISS and TREAT-CAD; the paper opens by noting cervical artery dissection is the most common cause of stroke in younger adults",
      "nihssRange": "Not reported as NIHSS in the abstract",
      "timeWindow": "90 days of follow-up in both pooled trials",
      "keyInclusion": [
        "Randomised clinical trials comparing antiplatelet with anticoagulant therapy in cervical artery dissection",
        "Primary endpoint required to include a composite of any stroke, death, or major bleeding at 90 days",
        "PubMed, Cochrane, Embase and ClinicalTrials.gov searched from inception to 1 August 2023",
        "Only two eligible trials exist worldwide: CADISS and TREAT-CAD; all participants of both were eligible"
      ],
      "keyExclusion": [
        "Observational cohorts were not eligible — the synthesis is confined to randomised data"
      ]
    },
    "intervention": "Anticoagulation (n=218 in the analysed comparison)",
    "comparator": "Antiplatelet therapy: heterogeneous single or dual agents in CADISS; aspirin specifically in TREAT-CAD. Pooled antiplatelet group included 55/226 dual-antiplatelet recipients.",
    "primaryEndpoint": {
      "definition": "Composite of (1) ischemic stroke, (2) death, or (3) major bleeding (extracranial or intracranial) at 90 days of follow-up, analysed on individual patient data",
      "timepoint": "90 days",
      "result": "DID NOT reach statistical significance: 3/218 (1.4%) with anticoagulation versus 10/226 (4.4%) with antiplatelet therapy. The direction favours anticoagulation and the point estimate is large, but with 13 events in total the confidence interval crosses 1 and the authors' own conclusion is that no significant difference was found in preventing early recurrent events.",
      "effectSize": "OR 0.33",
      "confidenceInterval": "95% CI 0.08-1.05",
      "pValue": "P = .06"
    },
    "secondaryEndpoints": [
      {
        "name": "Ischemic stroke alone, anticoagulation versus antiplatelet therapy",
        "result": "1/218 (0.5%) versus 10/226 (4.4%; printed as 4.0% in the abstract); OR 0.14 (95% CI 0.02-0.61), P = .01 — nominally significant, but it rests on a single event in the anticoagulation arm, so treat it as hypothesis-generating rather than as an established effect"
      },
      {
        "name": "Bleeding events",
        "result": "2 with anticoagulation versus 0 with antiplatelet therapy — the trade-off the composite is designed to capture"
      },
      {
        "name": "Populations analysed",
        "result": "444 patients in the intention-to-treat population and 370 in the per-protocol population; baseline characteristics were balanced"
      }
    ],
    "safetyFindings": {
      "sich": "Intracranial bleeding was folded into the composite major-bleeding component; no separate symptomatic intracranial haemorrhage rate is given in the abstract",
      "mortality": "Death was a component of the composite; no separate mortality figure is reported in the abstract",
      "other": "Two bleeding events with anticoagulation versus none with antiplatelet therapy"
    },
    "imagingCriteria": "Determined by the parent trials — clinical diagnosis with central review in CADISS, MRI-verified dissection in TREAT-CAD.",
    "applicabilityNotes": "The pooled comparison is anticoagulation versus antiplatelet therapy, not uniformly versus aspirin. Parent-trial regimens differed; TREAT-CAD was aspirin-specific whereas CADISS allowed heterogeneous antiplatelet regimens.",
    "limitations": "Two small open-label trials; CADISS permitted mixed single/dual antiplatelets while TREAT-CAD allocated aspirin. Thirteen primary events across 444 patients; sparse subgroup analyses should not select patients. Ninety-day horizon and no DOAC data. Source percentage/count inconsistencies remain explicitly distinguished.",
    "certainty": "low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-kaufmann-ipd-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Interpret the composite and stroke-alone findings with their comparator and precision limits. Do not relabel the entire pooled antiplatelet arm as aspirin.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'stop-cad',
    shortName: 'STOP-CAD',
    fullName: 'Antithrombotic Treatment for Stroke Prevention in Cervical Artery Dissection: The STOP-CAD Study',
    topic: 'cervical-dissection',
    diseaseArea: ['secondary-prevention', 'cervical-dissection'],
    population: {
      n: 3636,
      ageRange: 'Adults with cervical artery dissection; age distribution not given in the abstract',
      nihssRange: 'Not reported as NIHSS',
      timeWindow: 'Outcomes assessed within 30 and 180 days of dissection',
      keyInclusion: ['Cervical artery dissection without major trauma', 'Multicentre international retrospective cohort spanning 16 countries and 63 sites'],
      keyExclusion: ['Dissection associated with major trauma']
    },
    intervention: 'Anticoagulation — 402/3636 (11.1%) received anticoagulation exclusively; the main analysis used an as-treated crossover approach counting only outcomes occurring on the treatment in question',
    comparator: 'Antiplatelet therapy — 2453/3636 (67.5%) received antiplatelets exclusively',
    primaryEndpoint: {
      definition: 'Subsequent ischemic stroke and major hemorrhage (intracranial or extracranial) within 30 and 180 days, compared between anticoagulation and antiplatelet therapy using adjusted Cox regression with inverse probability of treatment weighting. This is an observational comparison of treatments chosen by clinicians, not a randomised allocation — confounding by indication is the central threat.',
      timepoint: '30 days and 180 days',
      result: 'NO SIGNIFICANT DIFFERENCE in ischemic stroke: anticoagulation versus antiplatelet adjusted HR 0.71 (95% CI 0.45-1.12) by day 30 and 0.80 (95% CI 0.28-2.24) by day 180. Overall event rates were low — 162 new ischemic strokes (4.4%) and 28 major hemorrhages (0.8%) by day 180 — and 87.0% of all ischemic strokes had already occurred by day 30.',
      effectSize: 'Adjusted HR 0.71 for ischemic stroke by day 30',
      confidenceInterval: '95% CI 0.45-1.12 (day 30); 95% CI 0.28-2.24 (day 180)',
      pValue: 'p=0.145 (day 30); p=0.670 (day 180)'
    },
    secondaryEndpoints: [
      {
        name: 'Major hemorrhage by day 30',
        result: 'Not increased with anticoagulation: adjusted HR 1.39 (95% CI 0.35-5.45), p=0.637 — but with 28 hemorrhages in the whole cohort this interval excludes almost nothing'
      },
      {
        name: 'Major hemorrhage by day 180',
        result: 'INCREASED with continued anticoagulation: adjusted HR 5.56 (95% CI 1.53-20.13), p=0.009. The interval is wide enough that the magnitude is uncertain, but the signal is the basis for the authors\' suggestion to switch to an antiplatelet before 180 days if anticoagulation is started.'
      },
      {
        name: 'Interaction by occlusive dissection',
        result: 'Patients with occlusive dissection had significantly lower ischemic stroke risk on anticoagulation: adjusted HR 0.40 (95% CI 0.18-0.88), p=0.009 — a subgroup interaction in an observational dataset, hypothesis-generating and not a selection rule'
      },
      {
        name: 'Timing of recurrent stroke',
        result: '87.0% of ischemic strokes occurred by day 30, so the window in which any antithrombotic choice can matter is the first month'
      }
    ],
    safetyFindings: {
      sich: 'Intracranial hemorrhage was counted within the composite major-hemorrhage outcome; no separate symptomatic intracranial hemorrhage rate is reported in the abstract',
      mortality: 'Mortality is not reported in the abstract',
      other: '28 major hemorrhages (0.8%) by day 180 across the whole cohort; the excess with anticoagulation emerged only in the 30-to-180-day window'
    },
    imagingCriteria: 'Cervical artery dissection diagnosed at the contributing sites; no central imaging core-laboratory adjudication is described in the abstract.',
    applicabilityNotes: 'STOP-CAD is roughly eight times larger than all randomised dissection evidence combined, and it is observational — so it should be used for the questions the trials cannot answer (when do recurrent strokes happen, does the choice matter in occlusive dissection, when does anticoagulant bleeding risk start to bite) and not to overrule them on the main comparison. Two findings are practice-shaping and neither depends on the treatment comparison: recurrent stroke is concentrated in the first 30 days, and prolonged anticoagulation past that window is where the bleeding accrues. The occlusive-dissection interaction is the most cited result and the most fragile — it is a subgroup of a non-randomised comparison, and STOP-CAD cannot distinguish a treatment effect from clinicians having anticoagulated the patients they judged highest risk.',
    limitations: 'Retrospective and observational; treatment was chosen by local clinicians, so confounding by indication is unavoidable despite inverse probability of treatment weighting. Only 11.1% of the cohort received anticoagulation exclusively, so the treated group is small and probably selected. As-treated crossover analysis counts only outcomes occurring on a given treatment, which can bias when treatment is switched in response to events. No central imaging adjudication. The 180-day hemorrhage hazard ratio rests on very few events and its confidence interval spans a 20-fold increase. The authors themselves call for large prospective studies.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-stop-cad-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reinforces that recurrent stroke after cervical artery dissection is front-loaded into the first 30 days, and that if anticoagulation is used it is reasonable to plan a switch to an antiplatelet before 180 days, when the bleeding excess appears.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "danish-hormonal-contraception-cohort",
    "shortName": "Danish Hormonal Contraception Cohort",
    "fullName": "Stroke and myocardial infarction with contemporary hormonal contraception: real-world, nationwide, prospective cohort study",
    "topic": "hormonal-contraception-stroke",
    "diseaseArea": [
      "secondary-prevention",
      "hormonal-contraception-stroke"
    ],
    "population": {
      "n": 2025691,
      "ageRange": "Women aged 15-49 years",
      "nihssRange": "Not applicable — incident first-ever events ascertained from national registry discharge diagnoses, not a severity-stratified cohort",
      "timeWindow": "Denmark, 1996 to 2021; 22,209,697 person-years of follow-up",
      "keyInclusion": [
        "All women aged 15-49 resident in Denmark between 1996 and 2021",
        "Exposure defined by nationally recorded contraceptive prescriptions and device codes"
      ],
      "keyExclusion": [
        "History of arterial or venous thrombosis",
        "Antipsychotic use, cancer, thrombophilia, liver disease, kidney disease",
        "Polycystic ovary syndrome, endometriosis, infertility treatment",
        "Hormone therapy use, oophorectomy, hysterectomy"
      ]
    },
    "intervention": "Current use of a contemporary hormonal contraceptive — combined oral contraception, progestin-only pill, combined vaginal ring, transdermal patch, progestin-only implant, or levonorgestrel-releasing intrauterine device",
    "comparator": "No current hormonal contraceptive use",
    "primaryEndpoint": {
      "definition": "First-time discharge diagnosis of ischaemic stroke or myocardial infarction, expressed as standardised rates per 100,000 person-years and as adjusted rate ratios versus no use. This is a registry cohort, so associations are adjusted but not randomised.",
      "timepoint": "Over 22,209,697 person-years (1996-2021)",
      "result": "Method-specific associations varied; progestin injection was inconclusive (RR 1.8, 95% CI 0.8–4.4). 4730 ischaemic strokes and 2072 myocardial infarctions occurred. Standardised ischaemic stroke rate per 100,000 person-years: 18 (95% CI 18 to 19) no use, 39 (36 to 42) combined oral contraception, 33 (25 to 44) progestin-only pills, 23 (17 to 29) intrauterine device. Combined oral contraception carried an adjusted rate ratio of 2.0 (1.9 to 2.2) for ischaemic stroke, equating to 21 (18 to 24) extra strokes per 100,000 person-years — a doubling of a small number.",
      "effectSize": "Adjusted rate ratio 2.0 for ischaemic stroke with combined oral contraception; standardised rate difference 21 extra ischaemic strokes per 100,000 person-years",
      "confidenceInterval": "95% CI 1.9 to 2.2 (rate ratio); 95% CI 18 to 24 (rate difference)",
      "pValue": "Not reported in the abstract; inference is presented through confidence intervals"
    },
    "secondaryEndpoints": [
      {
        "name": "Myocardial infarction with combined oral contraception",
        "result": "Adjusted rate ratio 2.0 (95% CI 1.7 to 2.2), equating to 10 (7 to 12) extra myocardial infarctions per 100,000 person-years; standardised rate 18 (16 to 20) versus 8 (8 to 9) per 100,000 person-years in non-users"
      },
      {
        "name": "Progestin-only pills",
        "result": "Adjusted rate ratio 1.6 (95% CI 1.3 to 2.0) for ischaemic stroke and 1.5 (1.1 to 2.1) for myocardial infarction; 15 (6 to 24) extra strokes and 4 (-1 to 9) extra myocardial infarctions per 100,000 person-years — the myocardial infarction rate difference crosses zero"
      },
      {
        "name": "Combined vaginal ring",
        "result": "Adjusted incidence rate ratio 2.4 (95% CI 1.5 to 3.7) for ischaemic stroke and 3.8 (2.0 to 7.3) for myocardial infarction"
      },
      {
        "name": "Transdermal patch",
        "result": "Adjusted incidence rate ratio 3.4 (95% CI 1.3 to 9.1) for ischaemic stroke; no myocardial infarctions occurred, so no estimate is possible"
      },
      {
        "name": "Progestin-only implant",
        "result": "Adjusted incidence rate ratio 2.1 (95% CI 1.2 to 3.8) for ischaemic stroke; three or fewer myocardial infarctions, so the myocardial infarction estimate is uninformative"
      },
      {
        "name": "Progestin-only (levonorgestrel-releasing) intrauterine device",
        "result": "No statistically detected increase: adjusted incidence rate ratio 1.1 (95% CI 1.0 to 1.3) for ischaemic stroke and 1.1 (0.9 to 1.3) for myocardial infarction; sparse injection data also did not establish an increased stroke rate"
      }
    ],
    "safetyFindings": {
      "sich": "Not assessed — the outcomes were ischaemic stroke and myocardial infarction; haemorrhagic stroke was not an endpoint of this analysis",
      "mortality": "Not reported in the abstract",
      "other": "Combined oral contraception pooled incidence was 39/100,000 person-years; vaginal ring 46 and one pill formulation 52 were higher. Absolute risks and precision differ by method."
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Observational first-thrombosis cohort; prior thrombosis was excluded. The combined-pill pooled stroke incidence was 39/100,000 person-years, not the highest method-specific rate (vaginal ring 46; one pill formulation 52). Injection estimates were sparse and inconclusive: RR 1.8, 95% CI 0.8–4.4, five events.",
    "limitations": "Observational registry cohort, not randomised; exposure is inferred from dispensed prescriptions and device codes. Women with prior thrombosis, thrombophilia and several relevant comorbidities were excluded by design, which strengthens internal validity but narrows applicability to exactly the secondary-prevention patient a stroke clinician most often sees. Patch and implant estimates rest on few events and have very wide intervals. Danish population only, with limited ethnic diversity. Migraine with aura — the interaction clinicians most want quantified — is not addressed in the abstract.",
    "certainty": "moderate",
    "evidenceType": "observational",
    "citationIds": [
      "cit-yonis-contraception-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Method-specific observational associations do not by themselves define contraceptive eligibility after stroke. The levonorgestrel IUD lacked a detected increased signal; sparse nonsignificant injection data are uncertainty, not proof of safety or harm.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'danish-progestogen-only-contraception-stroke',
    shortName: 'Danish Progestogen-Only Contraceptive Cohort',
    fullName: 'Risk of ischemic and hemorrhagic stroke in users of progestogen-only contraceptives: A Danish registry study',
    topic: 'hormonal-contraception-stroke',
    diseaseArea: ['secondary-prevention', 'hormonal-contraception-stroke'],
    population: {
      n: 1734905,
      ageRange: 'Non-pregnant women aged 18-49 years',
      nihssRange: 'Not applicable — registry-ascertained incident stroke events',
      timeWindow: 'Denmark, 2004 to 2021; 16,854,953 person-years of follow-up',
      keyInclusion: ['All non-pregnant Danish women aged 18-49 between 2004 and 2021', 'Exposure person-years: levonorgestrel-releasing IUD 1,720,931; desogestrel-only pills 255,404; norethisterone-only pills 104,261; etonogestrel implants 61,756; medroxyprogesterone injections 27,469; ethinylestradiol-containing combined hormonal contraceptives 4,431,841'],
      keyExclusion: ['Pregnancy', 'Ages outside 18-49']
    },
    intervention: 'Progestogen-only contraceptive use — levonorgestrel-releasing intrauterine device, progestogen-only pill (desogestrel or norethisterone), etonogestrel implant, or medroxyprogesterone injection',
    comparator: 'Two comparators were used: (1) non-use of hormonal contraception, and (2) combined hormonal contraceptives containing ethinylestradiol plus an equivalent progestogen',
    primaryEndpoint: {
      definition: 'Incidence rate ratios for ischemic stroke and for intracerebral haemorrhage associated with progestogen-only contraceptive use, from Poisson regression adjusted for age, ethnicity, education, calendar year and risk factors. Registry cohort — adjusted association, not randomised comparison.',
      timepoint: 'Across 16,854,953 person-years (2004-2021)',
      result: 'NULL against non-use: compared with non-use of hormonal contraception, NO progestogen-only method was associated with an increased adjusted incidence rate ratio for either ischemic stroke or intracerebral haemorrhage. Against combined hormonal contraceptives containing ethinylestradiol, ischemic stroke rates were roughly halved: desogestrel-only pills IRR 0.56 and levonorgestrel IUD IRR 0.44.',
      effectSize: 'Ischemic stroke IRR 0.56 for desogestrel-only pills and 0.44 for the levonorgestrel IUD, each versus combined hormonal contraceptives containing ethinylestradiol',
      confidenceInterval: '95% CI 0.38 to 0.82 (desogestrel-only pills); 95% CI 0.36 to 0.53 (levonorgestrel IUD)',
      pValue: 'Not reported in the abstract; inference is presented through confidence intervals'
    },
    secondaryEndpoints: [
      {
        name: 'Intracerebral haemorrhage versus ethinylestradiol-containing combined hormonal contraceptives',
        result: 'NOT significantly changed: levonorgestrel IUD IRR 0.85 (95% CI 0.37 to 1.92); desogestrel-only pills IRR 0.98 (95% CI 0.44 to 2.20) — intervals wide enough that no conclusion about haemorrhagic stroke can be drawn either way'
      },
      {
        name: 'Absolute benefit of switching',
        result: 'The authors state explicitly that the absolute number of strokes avoided by choosing a progestogen-only method over a combined hormonal contraceptive is small and, for most women — particularly those under 40 — unlikely to be clinically detectable'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — intracerebral haemorrhage was studied as an outcome, not as a treatment complication, and no difference was detected',
      mortality: 'Not reported in the abstract',
      other: 'Exposure was dominated by the levonorgestrel IUD (1,720,931 of the progestogen-only person-years), so implant and injection estimates rest on far less data'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the companion piece to the larger Danish hormonal-contraception cohort, and the two must be read together rather than as independent confirmation — they draw on the same national registries over heavily overlapping person-years. The useful teaching is in the comparator that changes: measured against non-use, progestogen-only methods showed no increase here; measured against ethinylestradiol-containing combined contraceptives, they showed roughly half the ischemic stroke rate. Both statements are compatible, but note the discordance with the larger Danish cohort (Yonis, BMJ 2025), which did find raised ischemic stroke rate ratios versus non-use for progestin-only pills (1.6) and the implant (2.1), while the levonorgestrel IUD showed no increase in either study; neither comparison licenses a strong claim, because the authors themselves caution that the absolute number of strokes avoided by switching is small and undetectable for most women under 40. Frame a switch from a combined pill to a progestogen-only method as a low-cost, risk-neutral-to-favourable adjustment for a woman with vascular risk, not as a lifesaving intervention. Note that this cohort of non-pregnant women aged 18-49 was not selected for prior stroke, so it does not directly answer contraceptive choice after a stroke.',
    limitations: 'Observational registry cohort; exposure inferred from dispensed prescriptions and device codes rather than measured use. Shares its data source and much of its follow-up with the larger Danish hormonal-contraception cohort, so it is a companion comparison rather than independent replication. The implant and injection strata contribute few person-years and correspondingly imprecise estimates. Intracerebral haemorrhage confidence intervals are too wide to support any conclusion. Migraine with aura and smoking interactions are not reported in the abstract. Danish population only.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-danish-poc-stroke-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports progestogen-only contraceptives — pills, implants, injections and the levonorgestrel IUD — as reasonable alternatives when stroke risk is a deciding factor, while making clear that the absolute gain from switching is small.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "finnish-subsequent-pregnancy-after-maternal-stroke",
    "shortName": "Finnish Subsequent-Pregnancy Cohort",
    "fullName": "Stroke Recurrence and Pregnancy Outcomes in the Subsequent Pregnancies After Maternal Ischemic Stroke",
    "topic": "pregnancy-stroke",
    "diseaseArea": [
      "special-populations",
      "pregnancy-stroke"
    ],
    "population": {
      "n": 90,
      "ageRange": "Women of reproductive age who sustained an ischemic stroke during pregnancy or the puerperium",
      "nihssRange": "Not reported as NIHSS",
      "timeWindow": "Index strokes occurred in Finland 1987-2016; subsequent pregnancies followed thereafter through national registers",
      "keyInclusion": [
        "Ischemic stroke diagnosed during pregnancy or puerperium in Finland, 1987-2016",
        "Diagnoses verified against medical records rather than accepted from register codes alone",
        "Survived at least 1 year after the index stroke",
        "Three matched controls without maternal stroke identified for each case"
      ],
      "keyExclusion": [
        "Death within 1 year of the index stroke"
      ]
    },
    "intervention": "Prior maternal ischemic stroke (n=90 women with data on subsequent pregnancies) — an exposure, not a treatment",
    "comparator": "Matched women without maternal stroke, three controls per case, drawn from the Medical Birth Register",
    "primaryEndpoint": {
      "definition": "Stroke recurrence, other pregnancy complications, and implementation of secondary prevention in subsequent pregnancies of women with a prior maternal ischemic stroke, compared with matched controls. Register-based matched cohort — associations are adjusted but not randomised.",
      "timepoint": "Across all subsequent pregnancies after the index maternal stroke",
      "result": "Women with a prior maternal ischemic stroke were LESS likely to have any subsequent pregnancy: 38.9% versus 51.7% of controls, age-adjusted OR 0.55. Among those who did conceive again, three women had a recurrent maternal ischemic stroke or transient ischemic attack — reported as 8.6%, which is 3 events among the roughly 35 women who had a subsequent pregnancy, NOT 3 of 90. With three events, this figure is an order-of-magnitude estimate only.",
      "effectSize": "Age-adjusted OR 0.55 for having at least one subsequent pregnancy; recurrent ischemic stroke or TIA in 8.6% of those who conceived again",
      "confidenceInterval": "95% CI 0.32 to 0.93 (odds of a subsequent pregnancy); no confidence interval is reported around the 8.6% recurrence figure",
      "pValue": "Not reported in the abstract for the primary comparison"
    },
    "secondaryEndpoints": [
      {
        "name": "Multiple induced abortions",
        "result": "More common after maternal stroke: adjusted OR 6.24 (95% CI 1.12 to 34.88) — an interval spanning nearly two orders of magnitude, so the direction is more trustworthy than the magnitude"
      },
      {
        "name": "Diabetes during a subsequent pregnancy",
        "result": "29.1% versus 13.6% in controls; adjusted OR 2.77 (95% CI 1.17 to 6.59)"
      },
      {
        "name": "Hypertensive disorders of pregnancy",
        "result": "12.7% versus 4.5%; adjusted OR 3.57 (95% CI 1.02 to 12.51) — lower bound essentially at unity"
      },
      {
        "name": "Perinatal death in the first subsequent pregnancy",
        "result": "5.9% versus 0% in controls, P=0.042 — a comparison against a zero-event control group, so it should be read as a flag rather than as a rate"
      },
      {
        "name": "Antithrombotic use in the first subsequent pregnancy",
        "result": "87.9% of women with prior maternal stroke used antithrombotic medication in the first subsequent pregnancy, and this declined across later pregnancies; use of other secondary preventive medications was uncommon both before and during pregnancy"
      }
    ],
    "safetyFindings": {
      "sich": "Not assessed",
      "mortality": "Women who died within 1 year of the index stroke were excluded by design, so this cohort says nothing about early mortality; perinatal death in the first subsequent pregnancy was 5.9% versus 0% in controls",
      "other": "The dominant safety pattern is obstetric rather than neurological: diabetes and hypertensive disorders of pregnancy were both substantially more common"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Three of 35 women with subsequent pregnancies experienced recurrent ischemic stroke or TIA; this is not three events in 35 pregnancy episodes, because women could have multiple pregnancies. Medication use was observed and cannot establish an untreated care gap without indication data.",
    "limitations": "Only 90 women with subsequent-pregnancy data and three recurrence events; every estimate is fragile and several confidence intervals span an order of magnitude. Register-based, though diagnoses were verified against medical records. Index strokes span 1987-2016, so early cases predate contemporary imaging, thrombolysis and secondary prevention. Women who died within a year were excluded, selecting for survivors. Finnish population only. Nothing here is a treatment comparison, so it cannot say whether continuing antithrombotics through a subsequent pregnancy changes outcomes.",
    "certainty": "very-low",
    "evidenceType": "observational",
    "citationIds": [
      "cit-finnish-subseq-pregnancy-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Individualize pregnancy and postpartum prevention. Continue or prescribe antithrombotic treatment when indicated; the observational medication patterns do not support blanket continuation for every woman.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'jefferson-inherited-thrombophilia-audit',
    shortName: 'Jefferson Inherited Thrombophilia Audit',
    fullName: 'Low value of inherited thrombophilia testing among patients with stroke or transient ischemic attack: A three-year retrospective study',
    topic: 'young-stroke-workup',
    diseaseArea: ['acute-ischemic-stroke', 'young-stroke-workup'],
    population: {
      n: 249,
      ageRange: 'Median age 49.0 years; 50.2% female',
      nihssRange: 'Not reported as NIHSS; the cohort comprises isolated acute ischemic stroke or TIA, including branch and central retinal artery occlusion',
      timeWindow: 'Testing performed during the index hospital admission; admissions 1 January 2019 to 31 December 2021',
      keyInclusion: ['Admitted with acute ischemic stroke or TIA (including branch and central retinal artery occlusion) to Thomas Jefferson University Hospitals', 'Underwent inpatient inherited thrombophilia testing during the admission', '249 of 2108 consecutive stroke or TIA admissions were tested'],
      keyExclusion: ['Concurrent venous thromboembolism — the cohort is deliberately restricted to ISOLATED arterial events']
    },
    intervention: 'Inpatient inherited thrombophilia panel — factor V Leiden, prothrombin G20210A variant, hyperhomocysteinemia, PAI-1 elevation, and deficiencies of protein C, protein S and antithrombin (1035 individual tests). ANTIPHOSPHOLIPID ANTIBODIES WERE NOT PART OF THE TESTED PANEL.',
    comparator: 'No comparator arm — this is a single-centre audit of testing yield and its consequences, not a controlled comparison',
    primaryEndpoint: {
      definition: 'Yield of inpatient inherited thrombophilia testing after isolated arterial ischemic stroke or TIA, defined as the proportion of patients with at least one abnormal result and, critically, the proportion of abnormal results that changed clinical management',
      timepoint: 'Index admission, 2019-2021',
      result: 'HIGH ABNORMAL RATE, ZERO MANAGEMENT IMPACT. 42.2% of patients had at least one abnormal test and 14.3% of the 1035 individual tests resulted abnormal — but 28% of abnormal results were borderline positive antigen or activity assays that likely represented false positives, and NO patient with an abnormal result had their clinical management changed as a result. Charges for the tests totalled $468,588 USD.',
      effectSize: '42.2% of patients with at least one abnormal result; 0 of those results changed management',
      confidenceInterval: 'Not reported',
      pValue: 'Not applicable to the primary yield figure'
    },
    secondaryEndpoints: [
      {
        name: 'Positivity by presence of conventional stroke risk factors',
        result: 'No significant difference: 47.1% positive among those without risk factors versus 40.9% among those with them, P = .428 — testing did not discriminate the \'cryptogenic\' patient it is ordered for'
      },
      {
        name: 'Positivity by age under versus over 50 years',
        result: 'No significant difference: 45.7% versus 38.3%, P = .237 — being young did not raise the yield'
      },
      {
        name: 'Cost',
        result: '$468,588 USD in charges over three years at a single institution'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — this is a diagnostic-yield audit, not a treatment study',
      mortality: 'Not applicable',
      other: 'The harm at issue is diagnostic rather than physical: a 42.2% abnormal-result rate of which 28% were probable false positives generates labelling, repeat testing, family cascade testing and anxiety with no demonstrated benefit'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the counterweight record for the reflex hypercoagulable panel in young stroke, and its power is in the second number rather than the first. A 42.2% abnormal rate sounds like a productive test until you see that management changed in nobody, and that positivity was no higher in the patients without conventional risk factors or under age 50 — the two groups in whom the panel is ordered precisely because it is expected to yield more. Two boundaries must travel with this record. First, the panel tested was INHERITED thrombophilia only; acquired antiphospholipid antibody testing was not included and is a separate decision with a different evidence base, since antiphospholipid syndrome does change anticoagulation choice. Second, acute-phase and anticoagulant effects on protein C, protein S and antithrombin assays are a known cause of spurious inpatient results, which is consistent with the 28% borderline findings — timing of the test, not just the decision to test, is part of the lesson.',
    limitations: 'Single-centre, retrospective, and confined to patients whose clinicians chose to test, so the 249 are a selected subset of 2108 admissions and yield cannot be generalised to universal testing. No comparison group and no follow-up on downstream consequences. \'Management change\' was judged by chart review without prespecified criteria. Antiphospholipid antibodies were not tested. Cost figures are US hospital charges, which do not translate to other systems. Nothing better exists: no stroke-specific randomised or prospective evaluation of inherited thrombophilia testing yield has been published, so this audit stands as the best available evidence rather than as strong evidence.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-jefferson-thrombophilia-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against reflexively ordering an inpatient inherited thrombophilia panel after an isolated arterial ischemic stroke or TIA — the yield is high in abnormal results, substantially false-positive, and in this audit changed management in no one; acquired antiphospholipid testing is a separate question.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'sifap',
    shortName: 'sifap',
    fullName: 'Stroke in Young Fabry Patients (sifap): acute cerebrovascular disease in the young',
    topic: 'young-stroke-workup',
    diseaseArea: ['acute-ischemic-stroke', 'young-stroke-workup'],
    population: {
      n: 5023,
      ageRange: '18 to 55 years; median age 46. Males predominated overall (2962, 59%), but females outnumbered males (65.3%) in the youngest band, aged 18-24',
      nihssRange: 'Not reported as NIHSS; the cohort comprised 3396 ischemic strokes, 271 hemorrhagic strokes and 1071 transient ischemic attacks',
      timeWindow: 'Enrolled at the acute event; recruitment April 2007 to January 2010',
      keyInclusion: ['Age 18-55 years with acute ischemic stroke, hemorrhagic stroke or TIA', 'Prospective multinational enrolment across 47 centres in 15 European countries', 'Standardised clinical, laboratory and radiological protocol applied to every participant', 'NCT00414583'],
      keyExclusion: ['Age outside 18-55 years']
    },
    intervention: 'Systematic screening for Fabry disease in every enrolled young stroke patient — a diagnostic-yield study, not a treatment comparison',
    comparator: 'No comparator arm; yield is interpreted against the background prevalence of Fabry disease in the general population',
    primaryEndpoint: {
      definition: 'Prevalence of Fabry disease among consecutive young patients (18-55) presenting with acute cerebrovascular disease, classified by the study\'s own definite and probable criteria',
      timepoint: 'At enrolment (2007-2010)',
      result: 'LOW BUT NON-TRIVIAL YIELD: definite Fabry disease was diagnosed in 0.5% (95% CI 0.4%-0.8%, n=27) of all patients, with probable Fabry disease in a further 18 patients (0.4%). Roughly 1 in 200 young stroke patients had definite Fabry disease. The figure depends on the study\'s own definite-versus-probable classification algorithm, so it is best used as an order-of-magnitude prevalence rather than a precise rate.',
      effectSize: '0.5% definite Fabry disease (n=27); a further 0.4% probable (n=18)',
      confidenceInterval: '95% CI 0.4% to 0.8% for definite Fabry disease',
      pValue: 'Not applicable to a prevalence estimate'
    },
    secondaryEndpoints: [
      {
        name: 'Proportion with a first-ever stroke',
        result: '80.5% of the cohort'
      },
      {
        name: 'Silent infarcts on MRI',
        result: 'Present in 20% of patients with a first-ever stroke and in 11.4% of TIA patients who had no history of a previous cerebrovascular event — a fifth of \'first\' strokes were not actually first'
      },
      {
        name: 'Most common causes of ischemic stroke in the young',
        result: 'Large-artery atherosclerosis 18.6% and dissection 9.9% — conventional mechanisms, not rare ones, led the list'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — an observational prevalence cohort with no intervention',
      mortality: 'Not reported in the abstract',
      other: 'Classical vascular risk factors and white matter changes were highly prevalent, which the authors framed as an argument for earlier preventive strategies in this age group'
    },
    imagingCriteria: 'Standardised radiological protocol with central, blinded MRI reading; MRI was not available or adequate in every participant (a later sifap analysis found that 3203 of 5023 patients, 63.8%, had the required MRI data set), so the silent-infarct and white-matter findings rest on the MRI-imaged subset.',
    applicabilityNotes: 'sifap is the only large systematic estimate of how often a rare monogenic cause turns up in young stroke, and it should be taught in both directions. A 0.5% definite yield is far above the general-population prevalence of Fabry disease, so the condition genuinely belongs on the young-stroke differential — but it is low enough that reflexive alpha-galactosidase testing in every young stroke patient is a poor use of the workup. The practical rule that follows is phenotype-driven screening: acroparesthesias, cornea verticillata, angiokeratoma, proteinuria, left ventricular hypertrophy, hearing loss, or a suggestive family history. Two other findings from this cohort are arguably more useful at the bedside than the Fabry number: the commonest ischemic mechanisms in patients aged 18-55 were large-artery atherosclerosis and dissection, and one in five \'first-ever\' strokes already had silent infarcts on MRI, which changes both prognosis and the aggressiveness of secondary prevention. Enrolment closed in 2010, so contemporary imaging and detection practices differ.',
    limitations: 'The 0.5% figure rests on the study\'s own definite-versus-probable classification algorithm, which has been debated since publication; different criteria give different prevalences. Enrolment closed in January 2010, predating current MRI and genetic-testing practice. Confined to 15 European countries, so ethnic and geographic generalisability is limited. Observational with no comparator, so it establishes yield rather than the value of testing. Enrolment at specialist centres selects for referred cases.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-sifap-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports phenotype-driven rather than universal Fabry screening in young stroke — about 1 in 200 young stroke patients has definite Fabry disease — while showing that large-artery atherosclerosis and dissection, not rare diseases, dominate the causes of stroke between 18 and 55.',
    lastReviewed: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "ukyss",
    "shortName": "UKYSS",
    "fullName": "Demographics, risk factor profiles and etiologies in young ischemic and hemorrhagic stroke — the United Kingdom Young Stroke Study (UKYSS)",
    "topic": "young-stroke-workup",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "young-stroke-workup"
    ],
    "population": {
      "n": 1765,
      "ageRange": "Mean age 41.6 years (SD 7.1)",
      "nihssRange": "Not reported as NIHSS in the abstract",
      "timeWindow": "First-ever stroke; all data in this report collected retrospectively for 2013–2020",
      "keyInclusion": [
        "Young adults with a first-ever stroke (ischemic or hemorrhagic)",
        "Eight UK centres",
        "61.7% (1089) male; 82.4% (1454) white",
        "ISRCTN 11029266"
      ],
      "keyExclusion": [
        "Recurrent stroke — the cohort is restricted to first-ever events"
      ]
    },
    "intervention": "None — an observational description of demographics, risk factors, investigations and etiologies in young stroke",
    "comparator": "Internal comparisons only: by sex, by age band (18-44 versus 45-49), by ethnicity and by stroke type",
    "primaryEndpoint": {
      "definition": "Baseline demographics, vascular risk-factor profiles and assigned stroke etiologies in young adults with first-ever stroke, with prespecified subgroup analysis by sex, age, ethnicity and stroke type",
      "timepoint": "At the index stroke admission",
      "result": "Among ischemic strokes, 50.8% (723) were undetermined/cryptogenic; hypertension was a risk factor in 38.1% (542), not an etiologic classification. IV thrombolysis was used in 191 (13.4%) and EVT in 71 (5%). Among hemorrhagic strokes, hypertension was a risk factor in 56.6% and an assigned etiology in 49.6%; 15.3% underwent neurosurgery.",
      "effectSize": "50.8% undetermined ischemic etiology; hypertension present as a risk factor in 38.1%",
      "confidenceInterval": "Not reported for the descriptive proportions",
      "pValue": "Comparisons used chi-squared or Fisher exact tests for categorical variables and t-tests or Mann-Whitney U for means; individual p-values are not given in the abstract"
    },
    "secondaryEndpoints": [
      {
        "name": "Risk factors by age band",
        "result": "Patients aged 45-49 had higher rates of smoking, hypertension, diabetes, hyperlipidemia, excess alcohol use, coronary artery disease and atrial fibrillation, while those aged 18-44 had higher recreational drug use, combined oral contraceptive pill use and active malignancy"
      },
      {
        "name": "Risk factors by sex",
        "result": "Males had higher hypertension, hyperlipidemia and excess alcohol use; females had higher migraine and active malignancy"
      },
      {
        "name": "Risk factors by ethnicity",
        "result": "White patients had higher smoking, excess alcohol use, recreational drug use and migraine; non-white patients had higher hypertension, diabetes and hyperlipidemia"
      },
      {
        "name": "Acute reperfusion treatment rates",
        "result": "191 (13.4% of ischemic strokes) received IV thrombolysis and 71 (5%) EVT. Onset and eligibility data are needed before attributing these rates to recognition delays."
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — an observational cohort with no assigned intervention",
      "mortality": "Not reported in the abstract",
      "other": "Not applicable"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Hypertension was a risk factor in 38.1% of young ischemic-stroke patients, not the assigned etiology of 38.1%. TOAST classification included 14.3% small-vessel disease and 50.8% undetermined cause. Lower reperfusion use cannot establish delayed recognition without onset and eligibility data.",
    "limitations": "All data in this report were retrospective, from 2013–2020. Selection, missingness and risk-factor versus etiologic classification limit interpretation; the study cannot rank rare causes against blood pressure as a universal diagnostic priority.",
    "certainty": "moderate",
    "evidenceType": "observational",
    "citationIds": [
      "cit-ukyss-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Address established vascular risk factors while evaluating age-appropriate etiologies. Do not equate a hypertension history with hypertensive stroke causation.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "illicit-drug-use-stroke-mr",
    "shortName": "Illicit Drug Use and Stroke (meta-analysis + Mendelian randomization)",
    "fullName": "Does illicit drug use increase stroke risk? A systematic review, meta-analyses, and Mendelian randomization analysis",
    "topic": "young-stroke-workup",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "young-stroke-workup"
    ],
    "population": {
      "n": 0,
      "ageRange": "Not restricted by age; the observational component draws on administrative, hospital-based and population-based datasets totalling more than 100 million participants across 32 studies",
      "nihssRange": "Not applicable",
      "timeWindow": "Studies from inception of the searched databases; PROSPERO registration CRD420251053702",
      "keyInclusion": [
        "Studies reporting associations between illicit drug use and stroke, pooled with multivariate random-effects models by ischemic and hemorrhagic subtype",
        "Two-sample Mendelian randomization using genome-wide association study summary statistics for seven drug exposures, against all stroke, ischemic and hemorrhagic stroke, and ischemic stroke subtypes"
      ],
      "keyExclusion": [
        "Not enumerated in the abstract"
      ]
    },
    "intervention": "Illicit substance exposure — cannabis, cocaine, amphetamines and opioids in the observational meta-analysis; genetically predicted cannabis use disorder, cocaine dependence, alcohol misuse, nicotine dependence and overall substance use disorder in the Mendelian randomization",
    "comparator": "Non-users in the observational studies; genetically predicted lower exposure in the Mendelian randomization",
    "primaryEndpoint": {
      "definition": "Pooled odds ratios for stroke associated with illicit drug use, by ischemic and hemorrhagic subtype, from random-effects meta-analysis of observational studies",
      "timepoint": "Across all included studies (systematic review; no single follow-up horizon)",
      "result": "POSITIVE for three of four drug classes: cannabis OR 1.37 (95% CI 1.14-1.65), cocaine OR 1.96 (95% CI 1.27-3.01) and amphetamines OR 2.22 (95% CI 1.40-3.53) were each significantly associated with increased stroke risk, while opioids showed NO significant association. The authors state explicitly that the cannabis finding showed heterogeneity and small-study effects, so it is the least secure of the three.",
      "effectSize": "Cannabis OR 1.37; cocaine OR 1.96; amphetamines OR 2.22; opioids not significant",
      "confidenceInterval": "95% CI 1.14-1.65 (cannabis); 1.27-3.01 (cocaine); 1.40-3.53 (amphetamines)",
      "pValue": "Not reported in the abstract; inference is presented through confidence intervals"
    },
    "secondaryEndpoints": [
      {
        "name": "Mendelian randomization — cannabis use disorder",
        "result": "Associated with any stroke, OR 1.11 (95% CI 1.01-1.51), and with large-artery stroke, OR 1.35 (95% CI 1.01-1.80); both lower bounds sit essentially at unity"
      },
      {
        "name": "Mendelian randomization — cocaine dependence",
        "result": "Associated with cardioembolic stroke, OR 1.08 (95% CI 1.02-1.14), and with intracerebral hemorrhage, OR 1.38 (95% CI 1.15-1.65)"
      },
      {
        "name": "Mendelian randomization — overall substance use disorder",
        "result": "Associated with any stroke, OR 1.33 (95% CI 1.02-1.72), and with intracerebral hemorrhage, OR 7.79 (95% CI 3.46-17.54). The hemorrhage point estimate is implausibly large for a real causal magnitude and should be read as directional only."
      },
      {
        "name": "Mendelian randomization — alcohol and nicotine",
        "result": "Problematic and dependent alcohol use was linked to large-artery and cardioembolic stroke; nicotine dependence showed NO significant associations, which is discordant with the established observational literature on smoking and is itself a reason for caution about the instruments"
      }
    ],
    "safetyFindings": {
      "sich": "Not applicable — an aetiological synthesis, not a treatment study",
      "mortality": "Not reported",
      "other": "Not applicable"
    },
    "imagingCriteria": "",
    "applicabilityNotes": "Observational associations and genetic-liability analyses concern different exposures and assumptions. Amphetamine Mendelian randomization could not be performed, so its observational association has no concordant genetic confirmation in this report.",
    "limitations": "Heterogeneous observational studies and genetic-instrument assumptions limit causal interpretation. No amphetamine MR analysis; null nicotine-dependence findings do not alone prove invalid instruments or refute smoking evidence.",
    "certainty": "low",
    "evidenceType": "meta-analysis",
    "citationIds": [
      "cit-illicit-drugs-stroke-mr-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Assess substance use as clinically relevant exposure. Genetic-liability odds ratios are scale-dependent and require instrument and sensitivity appraisal; magnitude alone does not invalidate them. Nicotine dependence is not interchangeable with every measure of smoking.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    "id": "save-childs",
    "shortName": "Save ChildS",
    "fullName": "Feasibility, Safety, and Outcome of Endovascular Recanalization in Childhood Stroke: The Save ChildS Study",
    "topic": "pediatric-stroke",
    "diseaseArea": [
      "special-populations",
      "pediatric-stroke"
    ],
    "population": {
      "n": 73,
      "ageRange": "Under 18 years; median age 11.3 years (IQR 7.0-15.0). 37 (51%) boys and 36 (49%) girls",
      "nihssRange": "Median Pediatric NIH Stroke Scale (PedNIHSS) 14.0 (IQR 9.2-20.0) at admission, on a scale of 0 (no deficit) to 34 (maximum deficit)",
      "timeWindow": "Cases accrued 1 January 2000 to 31 December 2018; median follow-up 16 months. No uniform time-from-onset window was applied — treatment timing was at the discretion of the treating centre",
      "keyInclusion": [
        "All pediatric patients (under 18 years) with ischemic stroke who underwent endovascular recanalization",
        "Databases of 27 stroke centres in Europe and the United States",
        "63 (86%) treated for anterior circulation occlusion; 10 (14%) for posterior circulation occlusion",
        "16 (22%) received concomitant intravenous thrombolysis"
      ],
      "keyExclusion": [
        "Children who did not undergo endovascular recanalization — there is no untreated comparison group"
      ]
    },
    "intervention": "Endovascular recanalization (thrombectomy) in children, performed off-label at the treating centre's discretion (n=73)",
    "comparator": "NONE. This is a single-arm retrospective cohort. Where safety is compared, the reference is the HERMES meta-analysis of adult thrombectomy trials, which is an external and non-randomised comparison.",
    "primaryEndpoint": {
      "definition": "Decrease in the Pediatric NIH Stroke Scale (PedNIHSS, range 0-34) from admission to day 7. Because the cohort is single-arm, this measures change over time in treated children and CANNOT establish that thrombectomy caused the improvement — spontaneous recovery and selection of children likely to do well are unexcluded alternative explanations.",
      "timepoint": "Day 7",
      "result": "Neurologic status improved: median PedNIHSS fell from 14.0 (IQR 9.2-20.0) at admission to 4.0 (IQR 2.0-7.3) at day 7. With no control arm, this is a description of outcome after treatment, not a treatment effect.",
      "effectSize": "Median PedNIHSS 14.0 at admission to 4.0 at day 7 (uncontrolled within-cohort change)",
      "confidenceInterval": "Not applicable — no between-group comparison was made",
      "pValue": "Not applicable — no between-group comparison was made"
    },
    "secondaryEndpoints": [
      {
        "name": "Modified Rankin Scale at 6 months",
        "result": "Median mRS 1.0 (IQR 0-1.6)"
      },
      {
        "name": "Modified Rankin Scale at 24 months",
        "result": "Median mRS 1.0 (IQR 0-1.0)"
      },
      {
        "name": "Symptomatic intracerebral hemorrhage compared with adult randomized trials",
        "result": "Proportion of symptomatic intracerebral hemorrhage events was 2.79 (95% CI 0.42-6.66) in the HERMES meta-analysis of adult trials and 1.37 (95% CI 0.03-7.40) in Save ChildS — overlapping intervals, so the honest reading is that no difference was detected, not that children bleed less"
      },
      {
        "name": "Later prospective comparative evidence: SaveChildSPro (2024)",
        "result": "117 EVT versus 91 medical patients across 45 centers, including propensity-matched analyses (PMID 39401507). Observational, not randomized evidence."
      }
    ],
    "safetyFindings": {
      "sich": "Symptomatic intracerebral hemorrhage proportion 1.37 (95% CI 0.03-7.40) versus 2.79 (95% CI 0.42-6.66) in the adult HERMES meta-analysis — an interval so wide it excludes very little",
      "mortality": "Not reported in the abstract",
      "other": "One patient (1%) developed a postinterventional bleeding complication and 4 patients (5%) developed transient peri-interventional vasospasm"
    },
    "imagingCriteria": "Large intracranial vessel occlusion identified on site imaging; no central imaging core-laboratory adjudication or uniform selection paradigm is described, and selection criteria necessarily varied across 27 centres and 19 years.",
    "applicabilityNotes": "This historic 73-child retrospective single-arm series is no longer the only or best available evidence. SaveChildSPro adds prospective comparative observations, but confounding and selection remain.",
    "limitations": "Retrospective, single-arm, and drawn from 27 centres over 19 years, so it is subject to profound selection and reporting bias: centres contribute the children they treated, and children treated are those judged good candidates. No control group of medically managed children, so no efficacy inference is possible. Only 73 children, with the posterior circulation represented by 10. No uniform selection imaging, no uniform time window, no central adjudication. Mortality is not reported in the abstract. The comparison against HERMES is external and non-randomised, with confidence intervals wide enough to be nearly uninformative. Device and technique changed substantially over the 2000-2018 accrual period. Long-term outcome missingness limits the original cohort. Later observational evidence does not remove the absence of randomized pediatric proof.",
    "certainty": "very-low",
    "evidenceType": "observational",
    "citationIds": [
      "cit-save-childs-2020",
      "cit-tips-study-2009",
      "cit-savechilds-pro-2024"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Pediatric EVT evidence includes later prospective comparative data; neither study establishes randomized efficacy. Use specialist, age-appropriate selection and retain uncertainty.",
    "lastReviewed": "2026-09-30",
    "verificationStatus": "verified-pubmed",
    "verificationNotes": "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification."
  }),

  // Source-reviewed additions, 2026-09-06 (primary-report abstracts).
  t({
  "id": "strategy",
  "shortName": "STRATEGY",
  "fullName": "Tirofiban for Branch Atheromatous Disease-Related Stroke: The STRATEGY Randomized Clinical Trial",
  "topic": "acute-antithrombotic-adjuncts",
  "diseaseArea": [
    "acute-antithrombotic-adjuncts"
  ],
  "population": {
    "n": 970,
    "ageRange": "18-80 (median 63)",
    "nihssRange": "≤10 with LOC 1a ≤1 (median 3)",
    "timeWindow": "Within 48 h",
    "keyInclusion": [
      "MRI-confirmed branch atheromatous disease-related ischemic stroke",
      "Single penetrating-artery territory infarct on DWI (<30 mm) with <70% ipsilateral parent-artery stenosis"
    ],
    "keyExclusion": [
      "Intravenous thrombolysis or endovascular therapy after stroke onset",
      "Prior intracranial hemorrhage",
      "Pre-stroke mRS ≥2"
    ]
  },
  "intervention": "IV tirofiban plus aspirin",
  "comparator": "Placebo plus aspirin",
  "primaryEndpoint": {
    "definition": "Early neurological deterioration within 7 days or new stroke within 90 days",
    "timepoint": "7/90 days",
    "result": "No significant difference: 17.1% vs 19.6%",
    "effectSize": "HR 0.88",
    "confidenceInterval": "95% CI 0.65 to 1.19",
    "pValue": "P=.39"
  },
  "secondaryEndpoints": [],
  "safetyFindings": {
    "sich": "",
    "mortality": "",
    "other": "Moderate/severe bleeding: 1/486 (0.2%) vs 0; P>.99"
  },
  "imagingCriteria": "See primary report",
  "applicabilityNotes": "Double-blind study at 38 Chinese hospitals; NCT05310968.",
  "limitations": "Primary result is neutral; very few bleeding events cannot establish equivalence in safety. Abstract-level review.",
  "certainty": "moderate",
  "evidenceType": "rct",
  "citationIds": [
    "cit-strategy-2026"
  ],
  "relatedActiveTrialIds": [],
  "practiceImpact": "No demonstrated reduction in the prespecified deterioration/recurrent-stroke composite in this selected population.",
  "lastReviewed": "2026-09-26",
  "verificationStatus": "verified-pubmed"
}),
  t({
  "id": "rocatis-1",
  "shortName": "ROCATIS-1",
  "fullName": "The impact of concomitant use of rosuvastatin or atorvastatin plus clopidogrel on the platelet inhibition and clinical outcomes in acute large-vessel minor stroke or TIA: A randomized controlled multi-center trial, the ROCATIS-1 trial",
  "topic": "lipid-lowering-prevention",
  "diseaseArea": [
    "lipid-lowering-prevention"
  ],
  "population": {
    "n": 600,
    "ageRange": "Adults >18",
    "nihssRange": "≤5 (minor stroke) or TIA",
    "timeWindow": "Within 24 h",
    "keyInclusion": [
      "First-ever large-vessel minor ischemic stroke (NIHSS ≤5) or large-vessel TIA"
    ],
    "keyExclusion": []
  },
  "intervention": "Rosuvastatin 20 mg daily from within 24 h of onset to day 90, with aspirin plus clopidogrel for 3 weeks then clopidogrel alone",
  "comparator": "Atorvastatin 40 mg daily with the same antiplatelet regimen",
  "primaryEndpoint": {
    "definition": "Change in ADP-induced platelet maximum aggregation",
    "timepoint": "3 months",
    "result": "Reported change 54.4 vs 49.2; favored rosuvastatin",
    "effectSize": "",
    "confidenceInterval": "",
    "pValue": "P=.003"
  },
  "secondaryEndpoints": [
    {
      "name": "Stroke/MI/vascular death composite",
      "result": "7.3% vs 13.3%; HR 0.52 (95% CI 0.33-0.81)"
    },
    {
      "name": "Recurrent stroke",
      "result": "4.0% vs 6.3%; HR 0.60 (95% CI 0.32-1.10); not significant"
    }
  ],
  "safetyFindings": {
    "sich": "",
    "mortality": "",
    "other": "No significant difference in drug-related adverse effects reported"
  },
  "imagingCriteria": "See primary report",
  "applicabilityNotes": "Single-blind trial at four hospitals in Egypt (North African population).",
  "limitations": "Platelet assay primary outcome; clinical endpoints are secondary. Authors describe findings as hypothesis-generating. Abstract-level review.",
  "certainty": "low",
  "evidenceType": "rct",
  "citationIds": [
    "cit-rocatis-1-2026"
  ],
  "relatedActiveTrialIds": [],
  "practiceImpact": "Requires double-blind multinational confirmation before changing statin selection.",
  "lastReviewed": "2026-09-26",
  "verificationStatus": "verified-pubmed"
}),
  t({
  "id": "y6-phase2",
  "shortName": "Y-6 phase 2",
  "fullName": "Efficacy and safety of sublingual cilostazol and dexborneol for the treatment of acute ischaemic stroke: a randomised phase 2 trial in China",
  "topic": "acute-neuroprotection",
  "diseaseArea": [
    "acute-neuroprotection"
  ],
  "population": {
    "n": 300,
    "ageRange": "35-80",
    "nihssRange": "7-25 at randomisation",
    "timeWindow": "Within 24 h",
    "keyInclusion": [
      "Anterior-circulation LVO treated with EVT; NIHSS 7-25"
    ],
    "keyExclusion": []
  },
  "intervention": "Two doses of sublingual cilostazol/dexborneol (Y-6) or cilostazol alone",
  "comparator": "Placebo",
  "primaryEndpoint": {
    "definition": "mRS 0-1 at 90 days",
    "timepoint": "90 days",
    "result": "No active arm significantly improved the primary endpoint; high/low-dose Y-6 44.6%/46.0% vs 35.7% placebo",
    "effectSize": "RR 1.25/1.29 for high/low-dose Y-6",
    "confidenceInterval": "95% CI 0.79-1.97 / 0.83-2.00",
    "pValue": "P=.34/.25"
  },
  "secondaryEndpoints": [],
  "safetyFindings": {
    "sich": "28-day sICH: 1.8%/4.8% for high/low-dose Y-6 vs 3.6% placebo",
    "mortality": "",
    "other": "No significant safety difference; small groups"
  },
  "imagingCriteria": "See primary report",
  "applicabilityNotes": "Double-blind five-arm trial at 33 Chinese centers; 294 received treatment; NCT06138834.",
  "limitations": "Phase 2; no significant primary efficacy result. Abstract-level review.",
  "certainty": "low",
  "evidenceType": "rct",
  "citationIds": [
    "cit-y6-phase2-2026"
  ],
  "relatedActiveTrialIds": [],
  "practiceImpact": "Exploratory adjunctive-treatment evidence; larger confirmatory studies are needed.",
  "lastReviewed": "2026-09-26",
  "verificationStatus": "verified-pubmed"
}),
  t({
  "id": "crhcp-seven-year",
  "shortName": "CRHCP 7-year follow-up",
  "fullName": "Long-Term Effectiveness of Intensive Blood Pressure Management Led by Nonphysician Community Healthcare Providers on Cardiovascular Events: 7-Year Follow-Up of a Cluster Randomized Trial",
  "topic": "bp-targets-prevention",
  "diseaseArea": [
    "bp-targets-prevention"
  ],
  "population": {
    "n": 33995,
    "ageRange": "≥40",
    "nihssRange": "Not applicable — community hypertension population",
    "timeWindow": "Community hypertension management",
    "keyInclusion": [
      "Age ≥40 in rural China with BP ≥140/90 mm Hg, or ≥130/80 mm Hg if at high cardiovascular risk or on antihypertensive treatment"
    ],
    "keyExclusion": []
  },
  "intervention": "Nonphysician provider-led intensive BP-management program targeting <130/80 mm Hg (4-year active intervention; free/discounted drugs, extra training and incentives withdrawn during the 3-year posttrial period)",
  "comparator": "Usual care",
  "primaryEndpoint": {
    "definition": "MI, stroke, heart-failure hospitalization or cardiovascular death composite",
    "timepoint": "7 years",
    "result": "2.4% vs 3.0% per person-year",
    "effectSize": "HR 0.76",
    "confidenceInterval": "95% CI 0.72 to 0.81",
    "pValue": "P<.0001"
  },
  "secondaryEndpoints": [
    {
      "name": "Years 4-7 after trial-support components ended",
      "result": "Composite HR 0.79 (95% CI 0.73-0.85)"
    }
  ],
  "safetyFindings": {
    "sich": "",
    "mortality": "",
    "other": "Higher hypotension (RR 1.58) and mild hypokalemia (RR 1.38)"
  },
  "imagingCriteria": "See primary report",
  "applicabilityNotes": "326-village cluster trial; 31,334 entered posttrial follow-up; NCT03527719.",
  "limitations": "General cardiovascular prevention population, not a post-stroke-specific target trial. Follow-up of an existing trial, not an independent new randomization. Abstract-level review.",
  "certainty": "moderate",
  "evidenceType": "rct",
  "citationIds": [
    "cit-crhcp-seven-year-2026"
  ],
  "relatedActiveTrialIds": [],
  "practiceImpact": "Long-term program benefit persisted after some trial support ended; does not by itself set an acute-stroke BP target.",
  "lastReviewed": "2026-09-26",
  "verificationStatus": "verified-pubmed"
}),

  // ── Promoted 2026-09-19: EVT large-core/MeVO secondary analyses + RECAP-ICH ──
  t({
    id: 'oriental-mevo-acao-registry',
    shortName: 'ORIENTAL-MeVO ACAo Registry',
    fullName: 'Endovascular Thrombectomy Versus Standard Medical Management in Acute Anterior Cerebral Artery Occlusion Stroke: The ORIENTAL-MeVO Registry Study',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: {
      n: 343,
      ageRange: '',
      nihssRange: 'subgroup benefit concentrated at baseline NIHSS >=6',
      timeWindow: '<=24 h from symptom onset',
      keyInclusion: ['Acute ischemic stroke from anterior cerebral artery occlusion (A1/A2/A3 segments)', 'ACAo verified by CTA, MRA and DSA', 'Prestroke mRS <=2', 'Received either EVT or standard medical management exclusively', '25 Chinese centers, September 2019 to September 2024', 'ChiCTR2500096954'],
      keyExclusion: ['Clot migration from a proximal major artery into the ACA', 'Multiterritory occlusion', 'Missing 90-day mRS']
    },
    intervention: 'Endovascular thrombectomy',
    comparator: 'Standard medical management',
    primaryEndpoint: {
      definition: '90-day mRS distribution, adjusted by inverse probability of treatment weighting (propensity-score methods for baseline confounders)',
      timepoint: '90 d',
      result: 'Favored EVT: adjusted OR 2.14 for the mRS shift; excellent outcome aRR 1.77 (95% CI 1.27-2.48); functional independence aRR 2.35 (95% CI 1.63-3.39)',
      effectSize: 'Adjusted odds ratio 2.14',
      confidenceInterval: '95% CI 1.59 to 2.89',
      pValue: 'p<0.001'
    },
    secondaryEndpoints: [
      { name: 'Excellent functional outcome', result: 'Adjusted risk ratio 1.77 (95% CI 1.27-2.48, p<0.001)' },
      { name: 'Functional independence', result: 'Adjusted risk ratio 2.35 (95% CI 1.63-3.39, p<0.001)' },
      { name: 'Subgroup by severity', result: 'Improved secondary outcomes in patients with baseline NIHSS >=6' }
    ],
    safetyFindings: {
      sich: 'No significant difference in 24-h symptomatic ICH vs medical management',
      mortality: 'No significant difference in 90-day mortality',
      other: ''
    },
    imagingCriteria: 'ACA occlusion (A1/A2/A3) confirmed on CTA, MRA and DSA',
    applicabilityNotes: 'The retrospective registry arm of the ORIENTAL-MeVO program — NOT the NEJM ORIENTAL-MeVO randomized trial already in this corpus (id oriental-mevo). ACA occlusion is a MeVO subtype with minimal dedicated randomized evidence, so this IPTW-adjusted comparison is currently the best available ACAo-specific data. Treatment was not randomized: confounding by indication survives propensity methods, and the effect sizes are larger than any randomized MeVO result, which is itself a caution.',
    limitations: 'Retrospective and non-randomized; single-country (China); IPTW/propensity matching cannot exclude residual confounding; 343 patients across 25 centers over 5 years implies selection; no core-lab adjudication reported in the abstract.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-oriental-mevo-acao-registry-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In anterior cerebral artery occlusion, registry data associate EVT with better 90-day outcomes without excess sICH or mortality, strongest at NIHSS >=6 — hypothesis-supporting evidence for a MeVO subtype the randomized trials barely cover, not RCT-grade.',
    lastReviewed: '2026-09-19',
    promotedDate: '2026-09-19',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  t({
    "id": "tension-prior-antithrombotic",
    "shortName": "TENSION antithrombotic analysis",
    "fullName": "Large Core Stroke Thrombectomy Is Safe and Effective Regardless of Prior Antithrombotic or Thrombolytic Treatment: A Secondary Analysis of the Randomized TENSION Trial",
    "topic": "evt-large-core",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "evt-large-core"
    ],
    "population": {
      "n": 246,
      "ageRange": "Median 74 (IQR 65-80)",
      "nihssRange": "",
      "timeWindow": "Parent TENSION criteria (extended lesion, extended time window); NCT03094715",
      "keyInclusion": [
        "All TENSION participants: LVO with established large infarct",
        "176 (72%) with any prior antithrombotic or thrombolytic exposure — 75 (31%) antiplatelets, 56 (23%) anticoagulants",
        "89 (36%) received intravenous thrombolysis; 43 (17.5%) had more than one class",
        "49% women",
        "124 (50%) assigned to EVT"
      ],
      "keyExclusion": []
    },
    "intervention": "EVT plus medical therapy",
    "comparator": "Medical therapy alone",
    "primaryEndpoint": {
      "definition": "90-day functional outcome (mRS shift), stratified by prior antiplatelet, anticoagulant and IV-thrombolysis exposure",
      "timepoint": "90 d",
      "result": "EVT benefit in every stratum: with antiplatelets cOR 2.40 (1.22-4.99), without 2.29 (1.53-3.46); with anticoagulation cOR 2.45 (1.17-5.28), without 2.12 (1.44-3.15); with IVT cOR 1.46 (0.83-2.61), without 2.89 (1.87-4.51)",
      "effectSize": "Common odds ratios 1.46 to 2.89 across the six strata",
      "confidenceInterval": "Per-stratum 95% CIs as listed; interaction analyses consistent with similar treatment effects across subgroups",
      "pValue": ""
    },
    "secondaryEndpoints": [
      {
        "name": "Treatment-by-exposure interaction",
        "result": "Consistent with similar EVT effects regardless of prior antithrombotic or thrombolytic treatment"
      }
    ],
    "safetyFindings": {
      "sich": "Prior IVT exposure: 10% versus 2.5% without IVT; observational exposure contrast. EVT-associated sICH did not significantly differ within exposure strata.",
      "mortality": "Mortality similar between groups",
      "other": ""
    },
    "imagingCriteria": "Parent TENSION imaging criteria (established large infarct)",
    "applicabilityNotes": "No statistically demonstrated modification of EVT benefit by prior antithrombotic or IVT exposure. These subgroup analyses do not prove unmodified benefit or safety; IVT exposure was not randomized in this analysis.",
    "limitations": "Exposure strata are small (antiplatelet n=75, anticoagulant n=56, IVT n=89 of 246 total), so per-stratum confidence intervals are wide; exposure was not randomized even though EVT assignment was; inherits the open-label design of the parent trial.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-tension-antithrombotic-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Retain the parent-trial result and the uncertainty of exposure subgroups. Do not conflate EVT assignment with the observational prior-IVT safety comparison.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-19",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  t({
    id: 'laste-aspects-0-2',
    shortName: 'LASTE ASPECTS 0-2',
    fullName: 'Endovascular Thrombectomy in Patients With Largest Baseline Infarcts (ASPECTS 0-2): An Ancillary Analysis of the LASTE Trial',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: {
      n: 181,
      ageRange: 'Median 72; parent trial capped at <=80',
      nihssRange: '',
      timeWindow: 'Randomization within 6.5 h of last known well (parent LASTE criteria); NCT03811769',
      keyInclusion: ['LASTE participants with ASPECTS 0-2 — large baseline infarcts without an upper size limit', 'Median core volume 156 mL (25th-75th percentiles, 121-204 mL)', 'Proximal anterior circulation LVO', '55.8% women', 'Selection predominantly by MRI'],
      keyExclusion: []
    },
    intervention: 'EVT plus medical care',
    comparator: 'Medical care alone',
    primaryEndpoint: {
      definition: 'Distribution of the modified Rankin Scale score at 90 days',
      timepoint: '90 d',
      result: 'Favored EVT: generalized OR 1.81; mRS 0-3 in 31.4% vs 8.5% (RR 3.69, 95% CI 1.77-7.68)',
      effectSize: 'Generalized odds ratio 1.81',
      confidenceInterval: '95% CI 1.32 to 2.47',
      pValue: ''
    },
    secondaryEndpoints: [
      { name: '90-day mortality', result: '38.4% vs 59.6% (RR 0.64, 95% CI 0.47-0.89)' },
      { name: 'Infarct growth volume at 24 h', result: 'Reduced with EVT: mean difference -70.3 mL (95% CI -94.2 to -46.3)' },
      { name: 'mRS 0-3 at 90 days', result: '31.4% vs 8.5% (RR 3.69, 95% CI 1.77-7.68)' }
    ],
    safetyFindings: {
      sich: '12.9% vs 4.5% (RR 2.85, 95% CI 0.94-8.60)',
      mortality: '38.4% vs 59.6% — mortality reduced despite numerically more sICH',
      other: ''
    },
    imagingCriteria: 'ASPECTS 0-2, predominantly MRI-selected; no upper infarct-size limit',
    applicabilityNotes: 'Post hoc ancillary analysis of LASTE, not independent evidence next to the parent record (id laste). It adds randomized data below the ASPECTS 3-5 range used by SELECT2/ANGEL-ASPECT/TENSION (SELECT2 and ANGEL-ASPECT also admitted patients on core volume, and TESLA admitted ASPECTS 2-5), and the benefit here is on the mRS 0-3 rather than mRS 0-2 scale — survival and reduced dependence, not independence. The sICH excess (RR 2.85, CI crossing 1) is the real trade-off to state. Findings apply to patients <80 within 6.5 h, mostly MRI-selected; read alongside ATLAS, which remains uncertain for cores >=150 mL beyond 6 h.',
    limitations: 'Post hoc subgroup (n=181) of a trial stopped early; not powered for this stratum; sICH CI spans 0.94-8.60; age <=80 and 6.5-h window limit generalizability to older or later-presenting patients; predominantly MRI-based selection may not transfer to NCCT-only workflows (TESLA context).',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-laste-aspects-0-2-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In patients under 80 treated within 6.5 h, even ASPECTS 0-2 with a median 156 mL core benefited from EVT — infarct size in isolation should not disqualify thrombectomy, accepting a numerically higher sICH rate for large gains in survival and mRS 0-3.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-19',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  t({
    "id": "angel-aspect-hmcas",
    "shortName": "ANGEL-ASPECT HMCAS analysis",
    "fullName": "Effects of Computed Tomography Hyperdense Middle Cerebral Artery Sign on the Efficacy of Endovascular Therapy in Acute Ischemic Stroke With Large Infarcts: A Subgroup Analysis of the ANGEL-ASPECT Trial",
    "topic": "evt-large-core",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "evt-large-core"
    ],
    "population": {
      "n": 432,
      "ageRange": "",
      "nihssRange": "",
      "timeWindow": "Parent ANGEL-ASPECT criteria; NCT04551664",
      "keyInclusion": [
        "ANGEL-ASPECT participants with anterior-circulation LVO and large infarct core",
        "33% HMCAS-positive on baseline noncontrast CT"
      ],
      "keyExclusion": []
    },
    "intervention": "Endovascular therapy (categorized by baseline HMCAS status)",
    "comparator": "Medical management",
    "primaryEndpoint": {
      "definition": "90-day modified Rankin Scale score, by HMCAS status",
      "timepoint": "90 d",
      "result": "No significant treatment-by-HMCAS interaction (p=0.19): EVT favored without HMCAS (generalized OR 2.78, 95% CI 1.80-4.27, p<0.001); not statistically significant with HMCAS (adjusted OR 1.69, 95% CI 0.93-3.08, p=0.09)",
      "effectSize": "Generalized OR 2.78 (HMCAS absent); adjusted OR 1.69 (HMCAS present)",
      "confidenceInterval": "95% CI 1.80 to 4.27 (absent); 95% CI 0.93 to 3.08 (present)",
      "pValue": "Interaction p=0.19"
    },
    "secondaryEndpoints": [
      {
        "name": "Prognosis within the EVT arm",
        "result": "HMCAS-positive patients had worse functional outcomes than HMCAS-negative (adjusted RR 0.44, 95% CI 0.26-0.73, p=0.002)"
      },
      {
        "name": "Thrombectomy passes",
        "result": "HMCAS-positive patients required more passes (p<0.001)"
      }
    ],
    "safetyFindings": {
      "sich": "",
      "mortality": "",
      "other": "Safety by HMCAS status not reported in the abstract"
    },
    "imagingCriteria": "Baseline noncontrast CT read for hyperdense MCA sign; parent-trial large-core selection",
    "applicabilityNotes": "The quoted poorer outcome association and greater thrombectomy-pass count compare HMCAS groups within EVT-treated participants. Pass counts have no medical-treatment analogue. A nonsignificant interaction does not prove that the marker is prognostic only or that treatment effect is identical.",
    "limitations": "Post hoc subgroup of 432 patients; underpowered for interaction testing, so a real modification cannot be excluded either; HMCAS reading not central to the parent design; single-country (China) trial population.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-angel-aspect-hmcas-2026"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Exploratory imaging association within a randomized trial. Do not use the HMCAS subgroup result alone to deny EVT or to claim a proven absence of treatment-effect modification.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-19",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),

  t({
    id: 'eva-trisp-prior-apt',
    shortName: 'EVA-TRISP prior-APT analysis',
    fullName: 'Previous Antiplatelet Therapy and Outcomes of Acute Ischemic Stroke With Large Vessel Occlusion Treated With Direct Endovascular Therapy (EVA-TRISP registry)',
    topic: 'acute-ischemic-stroke',
    diseaseArea: ['acute-ischemic-stroke'],
    population: {
      n: 1308,
      ageRange: 'Mean 75.8 ± 11.4',
      nihssRange: 'Mean NIHSS 13.1 ± 7.2',
      timeWindow: 'Consecutive patients 2015-2023; no interaction with time-to-groin earlier/later than 6 h (p=0.743)',
      keyInclusion: ['Anterior circulation LVO treated with DIRECT EVT — no prior IV thrombolysis, no anticoagulants', 'EVA-TRISP registry: 20 high-volume stroke centers across 9 European countries and Israel', 'Propensity-matched: 480 without vs 828 with any previous antiplatelet therapy (764 single, 64 dual APT)', 'From 12,950 registry patients, 2,611 met criteria', '49.4% female'],
      keyExclusion: ['Previous IV thrombolysis', 'Anticoagulant use']
    },
    intervention: 'Direct EVT with any previous antiplatelet therapy',
    comparator: 'Direct EVT without previous antiplatelet therapy',
    primaryEndpoint: {
      definition: '90-day mRS score (shift analysis), propensity-matched with multilevel models',
      timepoint: '90 d',
      result: 'Any previous APT associated with a shift toward LOWER mRS: OR 1.30; 90-day independence OR 1.62 (95% CI 1.22-2.16, p=0.001)',
      effectSize: 'Odds ratio 1.30 for the mRS shift',
      confidenceInterval: '95% CI 1.04 to 1.61',
      pValue: 'p=0.018'
    },
    secondaryEndpoints: [
      { name: 'Independence at 90 days', result: 'OR 1.62 (95% CI 1.22-2.16, p=0.001) favoring prior APT' },
      { name: 'Successful reperfusion', result: 'No association: OR 0.96 (95% CI 0.69-1.35)' },
      { name: 'Interactions', result: 'None with proximal/distal occlusion (p=0.213) or time-to-groin </>6 h (p=0.743)' }
    ],
    safetyFindings: {
      sich: 'No association with prior APT: OR 1.06 (95% CI 0.47-2.39)',
      mortality: 'No association: OR 0.89 (95% CI 0.66-1.21)',
      other: ''
    },
    imagingCriteria: 'Anterior circulation large vessel occlusion',
    applicabilityNotes: 'Class III observational evidence (per the journal classification) and a direction-of-effect surprise: prior antiplatelet exposure was associated with BETTER 90-day outcomes after direct EVT, not merely non-inferior, without more sICH. Read it as the general-LVO companion to the randomized TENSION prior-antithrombotic secondary analysis (PMID 42261979, promoted in this same batch): both land on the same practice point from opposite methodological directions. The favorable association should not be over-read as a treatment effect of APT — indication bias and healthy-user effects survive matching.',
    limitations: 'Retrospective registry analysis; propensity matching on medical history cannot exclude residual confounding; dual-APT subgroup tiny (n=64); excludes IVT-treated and anticoagulated patients, so it says nothing about bridging or anticoagulant scenarios; Class III evidence.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-eva-trisp-prior-apt-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In direct EVT for anterior-circulation LVO, prior antiplatelet therapy was associated with better 90-day outcomes and no excess sICH — prior APT is a reason for reassurance, never a reason to withhold or delay thrombectomy.',
    lastReviewed: '2026-09-19',
    promotedDate: '2026-09-19',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),

  t({
    id: 'recap-ich',
    shortName: 'RECAP-ICH',
    fullName: 'Intensive Blood Pressure Lowering After Spontaneous Intracerebral Haemorrhage for Secondary Stroke Prevention (RECAP-ICH): Systematic Review and Individual Participant Data Meta-analysis',
    topic: 'ich-secondary-prevention',
    diseaseArea: ['ich', 'secondary-prevention', 'ich-secondary-prevention'],
    population: {
      n: 2944,
      ageRange: 'Mean 59.6 (SD 10.6)',
      nihssRange: '',
      timeWindow: 'Long-term secondary prevention after spontaneous ICH; median follow-up 42.0 months (IQR 24.0-66.0)',
      keyInclusion: ['Four eligible randomized trials providing individual participant data (of 24 assessed)', 'Adults with previous spontaneous intracerebral haemorrhage', 'Fixed-dose antihypertensive therapy or intensive target-based BP lowering vs placebo or standard management', '33.0% female; 75.3% Asian', 'Mean achieved SBP difference 11.2 mm Hg (95% CI 10.7-11.7)', 'PROSPERO CRD420251274994'],
      keyExclusion: []
    },
    intervention: 'Intensive or fixed-dose blood pressure-lowering treatment',
    comparator: 'Placebo or standard blood pressure management',
    primaryEndpoint: {
      definition: 'First recurrent stroke of any type; one-stage intention-to-treat IPD meta-analysis, Cox models with random effect for trial and prespecified covariate adjustment',
      timepoint: 'Median 42.0 months',
      result: 'Reduced recurrent stroke: 96 (6.5%) of 1487 vs 152 (10.4%) of 1457',
      effectSize: 'Adjusted HR 0.62',
      confidenceInterval: '95% CI 0.48 to 0.80',
      pValue: 'p=0.0002'
    },
    secondaryEndpoints: [
      { name: 'Recurrent intracerebral haemorrhage (the driver of benefit)', result: '33 (2.2%) vs 81 (5.6%); adjusted HR 0.39 (95% CI 0.26-0.59, p<0.0001)' },
      { name: 'Time to 1% absolute risk reduction', result: '6.1 months (95% CI 3.5-14.8)' },
      { name: 'Subgroup consistency', result: 'Consistent across age, sex, region, background treatment, baseline BP and time since index event' }
    ],
    safetyFindings: {
      sich: '',
      mortality: '',
      other: 'Serious adverse events 429 (28.9%) of 1487 intensive vs 481 (33.0%) of 1457 control — no evidence of excess harm'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The pooled IPD anchor for post-ICH BP lowering: only four trials qualified, and 75.3% of participants were Asian, so the estimate leans heavily on that population mix. Benefit is driven by preventing recurrent haemorrhage (HR 0.39), which is exactly the mechanism the post-ICH pathway teaches. Read as the category-level synthesis above TRIDENT (id trident): TRIDENT shows one practical regimen, RECAP-ICH shows the class effect, its consistency across subgroups including time since the index event, and a clinically usable time-to-benefit of about 6 months.',
    limitations: 'Only four trials contributed IPD; heterogeneous strategies pooled (fixed-dose and target-based); 75.3% Asian participants limits generalizability; funding declared as none but the individual trials retain their own designs and biases.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-recap-ich-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Pooled patient-level randomized data: sustained BP lowering after ICH cuts recurrent stroke by ~38% (adjusted HR 0.62) — mainly recurrent haemorrhage (HR 0.39) — without excess serious adverse events, with a 1% absolute benefit accruing by about 6 months; long-term BP control is the cornerstone of secondary prevention after ICH.',
    lastReviewed: '2026-09-19',
    promotedDate: '2026-09-19',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  // ------------------- Evidence currency 2026-09-26 (verified promotion batch) -------------------
  t({
    id: 'trace-5',
    shortName: 'TRACE-5',
    fullName: 'Tenecteplase versus standard medical treatment for basilar artery occlusion within 24 h (TRACE-5): a multicentre, prospective, randomised, open-label, blinded-endpoint, superiority, phase 3 trial',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt', 'evt-basilar'],
    population: {
      n: 452,
      ageRange: 'adults ≥18; mean 66.4 y (SD 11.2); 321 (71%) male, 131 (29%) female',
      nihssRange: 'any — no NIHSS threshold in the registered eligibility (randomisation balanced on NIHSS <10 vs ≥10)',
      timeWindow: 'within 24 h of stroke onset or last known well',
      keyInclusion: [
        'Adults 18 years or older with acute ischaemic stroke due to complete or near-complete ("potentially retrievable") basilar artery occlusion on CT angiography or MR angiography',
        'Eligible for intravenous thrombolytics within 24 h of stroke onset or the time last known well; with stuttering prodromal symptoms, the time of sudden deterioration was taken as the estimated occlusion time',
        'Pre-stroke mRS score of 3 or less',
        '66 stroke centres in China; enrolment 24 January 2024 to 20 June 2025; NCT06196320'
      ],
      keyExclusion: [
        'Intracerebral haemorrhage or another diagnosis (e.g. tumour) on baseline imaging',
        'Posterior-circulation ASPECTS (pc-ASPECTS) <6 on non-contrast CT, CTA source images or MRI DWI',
        'Significant cerebellar mass effect or acute hydrocephalus; established frank hypodensity on non-contrast CT; bilateral extensive brainstem ischaemia',
        'Other standard contraindications to intravenous thrombolysis',
        'Concurrent anterior- and posterior-circulation large vessel occlusion'
      ]
    },
    intervention: 'Single intravenous bolus of tenecteplase 0.25 mg/kg (maximum 25 mg) within 24 h of onset, with or without endovascular thrombectomy at the treating team\'s discretion (n=221)',
    comparator: 'Standard medical treatment — could include intravenous alteplase 0.9 mg/kg (maximum 90 mg) within 4.5 h of onset, anticoagulation or antiplatelets — with or without endovascular thrombectomy (n=231); alteplase was used in 80 (35%) of the standard-treatment group',
    primaryEndpoint: {
      definition: 'mRS 0-1, or return to the baseline mRS if the pre-stroke mRS was 2-3, at 90 days — a SUPERIORITY design',
      timepoint: '90 d',
      result: 'POSITIVE: 83/221 (38%) with tenecteplase vs 66/231 (29%) with standard medical treatment',
      effectSize: 'Adjusted relative rate 1.50',
      confidenceInterval: '95% CI 1.09 to 2.08',
      pValue: 'p=0.014'
    },
    secondaryEndpoints: [
      { name: 'Severe disability or death (mRS 5-6) at 90 days', result: '82 (37%) with tenecteplase vs 89 (39%) with standard medical treatment; adjusted relative rate 0.87 (95% CI 0.65-1.18) — similar between groups' },
      { name: 'Endovascular thrombectomy after randomisation', result: '222 of 452 patients (49%) subsequently underwent thrombectomy; the abstract does not give the split by arm' }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage within 36 h in 4 (2%) with tenecteplase vs 7 (3%) with standard medical treatment; adjusted relative rate 0.58 (95% CI 0.17-1.99) — few events, so the estimate is imprecise',
      mortality: 'All-cause 90-day mortality 65 (29%) vs 71 (31%); adjusted relative rate 0.87 (95% CI 0.62-1.22) — similar between groups',
      other: 'mRS 5-6 at 90 days 82 (37%) vs 89 (39%); absolute 90-day mortality near 30% in both arms'
    },
    imagingCriteria: 'CT or MR angiography confirming complete or near-complete basilar artery occlusion; pc-ASPECTS ≥6 on non-contrast CT, CTA source images or DWI (pc-ASPECTS <6, bilateral extensive brainstem ischaemia, frank hypodensity, cerebellar mass effect and hydrocephalus excluded). No perfusion-mismatch requirement in the registered eligibility.',
    applicabilityNotes: 'A phase 3 randomised trial designed specifically to test intravenous thrombolysis in basilar artery occlusion up to 24 h. The earlier randomised late-window posterior-circulation thrombolysis trial, EXPECTS (alteplase 4.5-24 h), enrolled mainly mild stroke without planned thrombectomy and, per the TRACE-5 protocol, only 16 BAO patients. The comparator is a heterogeneous standard-medical-treatment arm: 35% of controls received alteplase (permitted only within 4.5 h), so the trial blends a tenecteplase-versus-alteplase comparison in early presenters with a tenecteplase-versus-no-thrombolysis comparison in later presenters. Randomisation was stratified by the investigator\'s intention to perform thrombectomy and (for controls) to give alteplase, but the abstract does not report results by these strata. About half of all patients (49%) went on to thrombectomy, so the result applies to a tenecteplase-first strategy with thrombectomy at clinician discretion — not to tenecteplase as a substitute for thrombectomy, and not to tenecteplase as a proven bridge before thrombectomy beyond 4.5 h. On that last question, ATTENTION LATE (JAMA 2026, PMID 42776543) found no improvement in 90-day functional independence when tenecteplase was added before thrombectomy at 4.5-24 h in BAO patients with NIHSS ≥10 admitted directly to thrombectomy-capable centres (30% vs 30%). Both guidelines in this library predate TRACE-5. The ESO/ESMINT 2024 basilar guideline found insufficient data for an evidence-based recommendation on IVT within 24 h and relied on expert consensus instead. The AHA/ASA 2026 AIS guideline (PubMed 2026-01-26) has no BAO-specific thrombolysis recommendation beyond 4.5 h; its 4.5-24 h IVT recommendation for LVO (Class IIb, B-R) is limited to patients with salvageable penumbra who cannot receive EVT.',
    limitations: 'Open-label with blinded endpoint assessment; conducted only in Chinese patients at 66 centres, so generalisability to other populations is untested; a heterogeneous comparator (alteplase in 35%, antithrombotics otherwise) and discretionary thrombectomy in about half the patients make the independent effect of tenecteplase hard to isolate; the primary endpoint is excellent outcome (mRS 0-1 or return to baseline), while mRS 5-6 and mortality were not significantly different; the symptomatic-haemorrhage comparison rests on 11 events in total; patients with pc-ASPECTS <6, bilateral extensive brainstem ischaemia or frank hypodensity were excluded, so the trial does not inform treatment of established large posterior-circulation infarcts; the tenecteplase manufacturer (China Shijiazhuang Pharmaceutical Company Recomgen Pharmaceutical) was among the funders. Replication is pending: the TRACE-5 protocol describes a parallel trial with shared protocol and data elements, POST-ETERNAL (NCT05105633, still recruiting per ClinicalTrials.gov), with a planned pooled analysis.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-trace-5-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In Chinese patients with basilar artery occlusion and pc-ASPECTS ≥6 treated within 24 h, intravenous tenecteplase (with thrombectomy at clinician discretion) improved the 90-day rate of mRS 0-1 or return to baseline versus standard medical treatment (38% vs 29%), without a demonstrated difference in symptomatic haemorrhage or death. It provides dedicated randomised support for thrombolysis in BAO up to 24 h. It does not establish benefit of tenecteplase as a bridge before thrombectomy beyond 4.5 h (ATTENTION LATE was neutral), awaits replication outside China, and postdates the AHA/ASA 2026 and ESO/ESMINT 2024 guidance, so it remains emerging evidence that guidelines do not yet endorse.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Primary, safety and mRS 5-6 numbers transcribed verbatim from the PubMed abstract of PMID 41655588 (Lancet 2026;407(10530):763-772; DOI 10.1016/S0140-6736(25)02633-9), checked 2026-09-26. Eligibility and imaging criteria from ClinicalTrials.gov NCT06196320 (status COMPLETED, enrollment 452, sponsor Beijing Tiantan Hospital) and the published protocol (Stroke Vasc Neurol 2026;11(3):365-372, PMID 41151803, PMC13347805). The full text is not in PMC and the publisher page was not reachable, so baseline NIHSS, the onset-to-randomisation distribution, per-arm thrombectomy counts, the prespecified secondary efficacy outcomes (mRS 0-2, mRS 0-3, ordinal mRS, early neurological improvement, reperfusion on the initial angiogram) and subgroup results (including thrombectomy vs no thrombectomy and 0-6 h vs 6-24 h) are deliberately not transcribed. Figures quoted in secondary web summaries were not checked against the primary report and are not used. Independently re-verified 2026-09-26 against PubMed (PMID 41655588 abstract; PMID 41151803 protocol full text in PMC13347805, including the randomisation strata, the 16-BAO-patient EXPECTS figure, the POST-ETERNAL pooled-analysis plan and the manufacturer grant; PMID 41582814 for the AHA/ASA 2026 guideline publication date) and ClinicalTrials.gov (NCT06196320; NCT05105633). The per-arm denominators 221 and 231 are the randomised groups; the abstract states that primary and safety outcomes were assessed in all randomly assigned participants. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'option-tnk',
    shortName: 'OPTION (TNK)',
    fullName: 'Tenecteplase for Acute Non-Large Vessel Occlusion 4.5 to 24 Hours After Ischemic Stroke: The OPTION Randomized Clinical Trial',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt', 'evt-mevo'],
    population: {
      n: 570,
      ageRange: '≥18 (median 68, IQR 59-75); 196 (34.6%) female',
      nihssRange: '6-25, or 4-5 with a disabling deficit',
      timeWindow: '4.5-24 h from last seen well (wake-up and unwitnessed onset eligible)',
      keyInclusion: [
        'Acute ischaemic stroke WITHOUT large vessel occlusion on CTA/MRA (ICA, MCA-M1, vertebral and basilar occlusions excluded); M2 or more distal MCA, ACA, PCA, AICA, PICA and SCA occlusions and large-to-medium vessel stenosis eligible',
        'CT perfusion target mismatch: ischaemic core (rCBF <30%) <50 mL, mismatch ratio (Tmax >6 s / core) ≥1.2, mismatch volume ≥10 mL',
        'Pre-stroke mRS 0-1',
        '48 centres in China; recruited 2 June 2023 to 4 August 2025, final follow-up 28 October 2025; 570 randomised, 566 in the primary analysis',
        'NCT05752916'
      ],
      keyExclusion: [
        'Planned or anticipated endovascular therapy',
        'Thrombolytic within 72 h or intention to give standard IV thrombolysis',
        'Acute intracranial haemorrhage or acute LVO on CTA/MRA',
        'Rapidly improving symptoms likely to reach NIHSS <4',
        'Standard thrombolysis contraindications (e.g. DOAC within 48 h, INR >1.7, platelets <100,000/μL, BP >185/110 mmHg)'
      ]
    },
    intervention: 'Intravenous tenecteplase 0.25 mg/kg (maximum 25 mg) single bolus (n=282 analysed)',
    comparator: 'Standard medical treatment — antiplatelet therapy (aspirin or clopidogrel alone) at investigator discretion (n=284 analysed)',
    primaryEndpoint: {
      definition: 'Excellent functional outcome, mRS 0-1 at 90 days',
      timepoint: '90 d',
      result: 'Favoured tenecteplase: 123/282 (43.6%) vs 97/284 (34.2%) with standard medical treatment',
      effectSize: 'Risk ratio 1.28 (primary analysis as reported in the abstract; not labelled as adjusted)',
      confidenceInterval: '95% CI 1.04 to 1.57',
      pValue: 'P=.02'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic ICH within 36 h (Heidelberg)', result: '2.8% (tenecteplase) vs 0% (standard care); risk difference 2.85% (95% CI 1.16% to 5.54%); P=.004' },
      { name: 'Mortality at 90 d', result: '5.0% vs 3.2%; RR 1.57 (95% CI 0.69 to 3.57); P=.28' }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage within 36 h 2.8% vs 0% (risk difference 2.85%, 95% CI 1.16%-5.54%; P=.004)',
      mortality: '90-day mortality 5.0% vs 3.2% (RR 1.57, 95% CI 0.69-3.57; P=.28) — not statistically different, but numerically higher with tenecteplase',
      other: 'All symptomatic haemorrhages occurred in the tenecteplase arm'
    },
    imagingCriteria: 'NCCT + CTA + CT perfusion required: LVO excluded on CTA/MRA; target mismatch with ischaemic core (rCBF <30%) <50 mL, mismatch ratio ≥1.2 and mismatch volume ≥10 mL',
    applicabilityNotes: 'The first RCT dedicated to NON-large-vessel-occlusion stroke in the 4.5-24 h window, and the first to show a functional benefit of late-window tenecteplase in that population. TRACE-III (LVO only) and TIMELESS (LVO, mostly with EVT) did not address it; CHABLIS-T II (tenecteplase, large/medium vessel occlusion, 4.5-24 h) improved reperfusion but did not change 90-day clinical outcomes; HOPE (alteplase, LVO and non-LVO) was positive overall. It applies to perfusion-selected patients with a disabling deficit (NIHSS 6-25, or 4-5 disabling) in whom thrombectomy is not planned; it does not apply to patients without a CTP target mismatch, to minor non-disabling deficits, or to patients proceeding to EVT. The comparator was antiplatelet therapy, not alteplase. A secondary analysis presented as an ESOC 2026 late-breaking abstract (Eur Stroke J, DOI 10.1093/esj/aakag023.1876; conference abstract, not a peer-reviewed paper) classified 386 of 566 patients (68.2%) as medium vessel occlusion by ESCAPE-MeVO/DISTAL criteria, with a consistent direction of effect in MeVO (42.6% vs 33.0%; aRR 1.29, 95% CI 1.00-1.66) and non-MeVO patients (46.0% vs 36.6%; aRR 1.45, 95% CI 1.05-2.00; P for interaction 0.75). Read with the MeVO thrombectomy trials: ESCAPE-MeVO and DISTAL were neutral while ORIENTAL-MeVO (NIHSS ≥6) was positive, so OPTION tests a thrombolytic alternative rather than establishing that no endovascular option exists.',
    limitations: 'Single country (China, 48 centres) and open-label with blinded endpoint assessment; a single trial with a modest absolute difference (9.4 percentage points) and a lower 95% CI bound for the risk ratio of 1.04; symptomatic ICH was higher with tenecteplase (2.8% vs 0%) and 90-day mortality was numerically higher (5.0% vs 3.2%, not significant); selection required CT perfusion with permissive mismatch thresholds (ratio ≥1.2, mismatch volume ≥10 mL), which not every centre can obtain and which is less validated for small distal lesions; control arm received antiplatelet therapy; tenecteplase manufacturer (CSPC) co-funded the investigator-initiated trial per the protocol paper; secondary efficacy outcomes (mRS 0-2, ordinal mRS, reperfusion) were not verifiable from the retrievable primary text and are not recorded here; the MeVO/non-MeVO breakdown comes from a conference abstract only.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-option-tnk-2026', 'cit-option-tnk-protocol-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a single positive RCT for perfusion-selected IV tenecteplase at 4.5-24 h in non-LVO stroke when EVT is not planned: excellent outcome 43.6% vs 34.2%, at the cost of symptomatic ICH 2.8% vs 0%. Emerging, selective and consult-dependent — it post-dates the 2026 AHA/ASA guideline, is not yet replicated outside China, and should not be generalised to patients without a CTP target mismatch or to those proceeding to thrombectomy.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 41642827 (JAMA 2026;335(13):1137-1147; DOI 10.1001/jama.2026.0210; PMC12878635 — PMC body not retrievable, numbers from the published abstract/Key Points); eligibility, CTP thresholds, control-arm regimen and sICH definition from the protocol paper (PubMed 41169527, PMC12569589) and ClinicalTrials.gov NCT05752916 (completed, enrollment 570). MeVO breakdown from ESOC 2026 abstract LB148 (PMC13144800; abstract text reads \"556\" but 386+180=566, and the subgroup numerators 83+40=123 and 63+34=97 reconcile with the main result). Independently re-verified 2026-09-26. Id is option-tnk to avoid collision with option-laao. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 't-flavor',
    shortName: 'T-FLAVOR',
    fullName: 'Standard-Dose Tenecteplase vs Low-Dose Alteplase for Acute Ischemic Stroke From Large-Vessel Occlusion (Tenecteplase versus Alteplase for Large-Vessel-Occlusion Recanalization, T-FLAVOR)',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase', 'bridging-ivt-before-evt'],
    population: {
      n: 218,
      ageRange: 'mean 77.1 years (SD 12.0); aged 20 years or older, no upper age limit; 92/218 (42.2%) female',
      nihssRange: 'no NIHSS restriction; baseline median 18 (IQR 11-23)',
      timeWindow: 'IV thrombolysis within 4.5 h of onset, followed by mechanical thrombectomy (protocol: thrombectomy within 6 h)',
      keyInclusion: ['Acute ischaemic stroke eligible for IV thrombolysis within 4.5 h (Japanese guideline criteria) and scheduled for mechanical thrombectomy', 'Occlusion of the ICA, M1 or M2 segment of the MCA, or basilar artery on CTA or MRA before thrombolysis', 'Pre-stroke mRS 0-3 (protocol)', '18 hospitals in Japan; enrolment 19 August 2022 to 13 March 2025', '221 randomised; 218 received study drug and formed the full analysis set', 'jRCTs051210055 (Japan Registry of Clinical Trials)'],
      keyExclusion: ['Detailed exclusion criteria are in the eMethods supplement, not the main text', 'Screening exclusions before randomisation included direct oral anticoagulant use and a substantially large infarct (CONSORT diagram)', '3 patients excluded after randomisation for ineligibility (beyond 4.5 h, coexisting SAH, abdominal aneurysm); none received a thrombolytic']
    },
    intervention: 'Intravenous tenecteplase 0.25 mg/kg (maximum 25 mg) single bolus before mechanical thrombectomy (n=107)',
    comparator: 'Intravenous alteplase 0.6 mg/kg (maximum 60 mg; 0.06 mg/kg bolus then the remainder over 60 min), the low dose approved in Japan, before mechanical thrombectomy (n=111)',
    primaryEndpoint: {
      definition: 'Substantial reperfusion on the initial angiogram (mTICI 2b, 2c or 3, or no retrievable thrombus), adjudicated by a masked independent committee. SUPERIORITY design with a prespecified 2-sided alpha of 0.10: success required the lower bound of the 90% CI to exceed 0',
      timepoint: 'Initial angiogram before thrombectomy (median thrombolysis-to-angiogram 24 min)',
      result: 'Met its prespecified 90%-CI success criterion: 11/107 (10.3%) with tenecteplase vs 4/111 (3.6%) with low-dose alteplase. The authors state that the conventional 95% CI (-0.19% to 13.2%) crosses zero, so the result is NOT significant at the usual 0.05 threshold.',
      effectSize: 'Absolute difference 6.5 percentage points (Mantel-Haenszel, stratified by occlusion site)',
      confidenceInterval: '90% CI 0.89 to 12.1 (prespecified); 95% CI -0.19 to 13.2',
      pValue: 'P=.06 (prespecified alpha 0.10)'
    },
    secondaryEndpoints: [
      { name: '90-day mRS shift (ordinal)', result: 'Common OR 1.47 (95% CI 0.92-2.35; P=.11), not significant; median mRS 2 (IQR 0-4) vs 3 (IQR 1-4)' },
      { name: 'Independent outcome at 90 days (Table 2: mRS 0-2 or no change)', result: '60/107 (56.1%) vs 54/111 (48.6%); difference 7.4 (95% CI -5.80 to 20.7); P=.27' },
      { name: 'Excellent outcome at 90 days (Table 2: mRS 0-1 or no change)', result: '46/107 (43.0%) vs 45/111 (40.5%); difference 2.5 (95% CI -10.6 to 15.5); P=.71' },
      { name: 'Early neurological improvement at 72 h (NIHSS reduction >=8 or NIHSS 0-1)', result: '72/107 (67.3%) vs 62/111 (55.9%); difference 11.4 (95% CI -1.39 to 24.3); P=.08' },
      { name: 'Primary endpoint, per-protocol set (106 vs 107)', result: '10.4% vs 2.8%; difference 7.4 percentage points (90% CI 1.87-13.0; P=.03)' },
      { name: 'Clot migration on initial angiogram (tertiary)', result: '22/107 (20.6%) vs 16/111 (14.4%); difference 6.1 (95% CI -3.9 to 16.2); P=.23' },
      { name: 'Reperfusion on CTA/MRA at 24-36 h (tertiary)', result: '78/107 (72.9%) vs 77/111 (69.4%); difference 3.5 (95% CI -8.5 to 15.5); P=.57' },
      { name: 'ASPECTS at 24-36 h (tertiary)', result: 'Mean 6.0 vs 6.2; difference -0.24 (95% CI -0.99 to 0.51); P=.53' },
      { name: 'Primary endpoint by occlusion site (descriptive, Figure 2B)', result: 'ICA 9.4% vs 6.5%; M1 5.0% vs 0%; M2 17.2% vs 7.1%; basilar 16.9% vs 0%. Very small strata (basilar n=15); no interaction test by occlusion site is reported, so this is hypothesis-generating only. The prespecified subgroup analyses (age, sex, NIHSS, AF, prior stroke/TIA, prestroke antithrombotics, thrombolysis-to-angiogram time, ASPECTS) showed no significant heterogeneity for the primary outcome.' }
    ],
    safetyFindings: {
      sich: 'sICH within 24-36 h 3/107 (2.8%) vs 2/111 (1.8%); risk difference 1.0 percentage point (95% CI -2.99 to 4.99; P=.62)',
      mortality: '90-day death 7/107 (6.5%) vs 11/111 (9.9%); risk difference -3.4 (95% CI -10.6 to 3.90; P=.36)',
      other: 'Any ICH within 24-36 h 43/107 (40.2%) vs 47/111 (42.3%); difference -2.2 (95% CI -15.22 to 10.91); P=.75. Serious adverse events and procedure-related complications were similar between groups (eTables 5-6). Only 5 sICH events in total, so the trial could not exclude a clinically important difference in sICH.'
    },
    imagingCriteria: 'CTA or MRA confirmation of ICA, M1, M2 or basilar occlusion before thrombolysis; baseline median ASPECTS 10 (IQR 8-10); primary endpoint read on the first diagnostic angiogram by a masked external committee',
    applicabilityNotes: 'Per the authors, the first RCT to compare tenecteplase 0.25 mg/kg with the 0.6 mg/kg alteplase regimen that is standard in Japan and used elsewhere in East Asia. Its question is regional: before thrombectomy, how does TNK compare with the local low-dose alteplase standard? It is NOT a tenecteplase dose-ranging trial, because only 0.25 mg/kg was tested. It also does not address the comparison with 0.9 mg/kg alteplase, which AcT, TRACE-2 and ORIGINAL cover. The population was elderly (mean 77 y), severe (median NIHSS 18), low body weight (mean 58.8 kg) and largely cardioembolic (61.9%), with a very short thrombolysis-to-angiogram time (median 24 min). Pre-thrombectomy reperfusion was low in both arms (10.3% vs 3.6%). That is well below the 22% reported with TNK in EXTEND-IA TNK (median 55 min to angiography) but close to the 6.1% seen with TNK in BRIDGE-TNK, which fits the short interval before angiography in contemporary workflows. Read alongside SKIP, whose bridging arm used the same 0.6 mg/kg alteplase regimen.',
    limitations: 'Phase 2 with n=218, a sample size set by drug-supply feasibility rather than power for clinical outcomes. The prespecified alpha was 0.10, and the authors acknowledge that the 95% CI for the primary endpoint (-0.19 to 13.2) crosses zero. The primary endpoint is a surrogate (angiographic), and the clinical secondary outcomes were underpowered and not significant. Safety comparisons are imprecise (5 sICH events in total; 95% CI for the difference -2.99 to 4.99 percentage points). Treatment was open-label, with masked endpoint adjudication, and thrombectomy technique was not standardised. The trial ran in one country (18 Japanese hospitals) and had 3 post-randomisation exclusions (no drug given). The paper\'s study-level meta-analysis is exploratory and pools trials that used 0.9 mg/kg alteplase as the comparator.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-t-flavor-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Phase 2 evidence for settings where 0.6 mg/kg alteplase is the local standard. Tenecteplase 0.25 mg/kg before thrombectomy gave more early reperfusion (10.3% vs 3.6%), but only under the prespecified alpha-0.10, 90%-CI criterion. No difference was detected in 90-day function, sICH or mortality, and the trial was not powered to show one. It does not demonstrate clinical superiority or establish safety equivalence. Its role is to support regional adoption or regulatory evaluation of TNK alongside the larger 0.9 mg/kg-comparator trials. It does not change practice where alteplase 0.9 mg/kg or TNK 0.25 mg/kg is already standard.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "PubMed 42223935 (PMC13227334); DOI 10.1001/jamaneurol.2026.1590; JAMA Neurol 2026;83(8):769-777. Registered as jRCTs051210055 (Japan Registry of Clinical Trials). No ClinicalTrials.gov record was found: a registry search for tenecteplase with a Japan location returned none, and the paper cites only the jRCT id. Protocol published in Eur Stroke J 2022;7(1):71-75 (PMID 35300254; erratum PMID 37021203). Primary, secondary and safety numbers were copied from the PMC full text (abstract, Results, Table 1 and Table 2) and independently re-verified 2026-09-26. Table 2 labels the mRS 0-2 and 0-1 outcomes \"or no change\" (presumably relative to prestroke mRS, which could be up to 3; the exact definition is in the inaccessible supplement). PubMed publication-type indexing includes \"Equivalence Trial\", but the paper describes a superiority design (alpha 0.10). The eMethods supplement holding the full eligibility criteria was not accessible; pre-stroke mRS 0-3 and thrombectomy within 6 h come from the protocol abstract. Despite the candidate description, this is not a tenecteplase dose-comparison trial. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'attention-late',
    shortName: 'ATTENTION LATE',
    fullName: 'Tenecteplase Before Thrombectomy at 4.5 to 24 Hours for Basilar Artery Occlusion: The ATTENTION LATE Randomized Clinical Trial',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-basilar', 'evt-late-window'],
    population: {
      n: 330,
      ageRange: '≥18 years (registry); mean 66 (SD 11) years; 241 males (73%), 89 females (27%)',
      nihssRange: '≥10 (moderate to severe basilar artery occlusion)',
      timeWindow: '4.5 to 24 h from stroke onset',
      keyInclusion: [
        'Acute basilar artery occlusion, or vertebral artery occlusion that prevents antegrade flow into the basilar artery, confirmed on CTA, MRA or DSA (registry)',
        'NIHSS ≥10',
        'Presenting 4.5 to 24 h from stroke onset, admitted directly to EVT-capable centres',
        'Eligible for both EVT and IV thrombolysis by standard criteria except for the time window (registry)',
        '40 stroke centres in China; enrolment 16 March 2023 to 4 February 2025, final follow-up 4 May 2025',
        'NCT05701956'
      ],
      keyExclusion: [
        'IV thrombolysis before randomisation (registry)',
        'Pre-stroke mRS ≥2 (registry)',
        'PC-ASPECTS <6 on CT/CTA source images or <5 on MRI-DWI (registry)',
        'Extensive bilateral thalamic or brainstem infarction, or large cerebellar infarction compressing the fourth ventricle (registry)',
        'Intracranial haemorrhage on CT or MRI; fewer than 10 microbleeds allowed (registry)',
        'Concurrent anterior- and posterior-circulation large-vessel occlusion (registry)'
      ]
    },
    intervention: 'Intravenous tenecteplase 0.25 mg/kg bolus (maximum 25 mg) followed by EVT (n=166)',
    comparator: 'EVT alone (n=164)',
    primaryEndpoint: {
      definition: 'Functional independence, mRS 0-2 at 90 days. The published protocol hypothesised that tenecteplase before EVT would result in better clinical outcomes than EVT alone (a superiority question)',
      timepoint: '90 d',
      result: 'DID NOT show benefit (neutral result): 50/165 (30%) with tenecteplase before EVT vs 50/164 (30%) with EVT alone reached mRS 0-2. The authors conclude that adding IV tenecteplase before EVT did not improve functional outcomes compared with EVT alone.',
      effectSize: 'Adjusted rate ratio 0.92; risk difference -0.18%',
      confidenceInterval: '95% CI 0.67 to 1.25 for the adjusted rate ratio; risk difference 95% CI -10.13% to 9.76%',
      pValue: 'Not reported in the abstract; the 95% CI for the adjusted rate ratio includes 1'
    },
    secondaryEndpoints: [
      {
        name: '90-day mortality',
        result: '66 (40%) with tenecteplase before EVT vs 70 (43%) with EVT alone; the authors describe mortality as similar between groups'
      },
      {
        name: 'Other registry-listed secondary outcomes (mRS 0-3, ordinal mRS shift, reperfusion before and after EVT, 72-h recanalisation)',
        result: 'Not reported in the abstract and not verified here, because the PMC full-text body could not be retrieved at review'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage in 8 (5%) with tenecteplase before EVT vs 6 (4%) with EVT alone. Numerically higher on 8 versus 6 events; the abstract reports no statistical comparison and does not state the sICH definition (registry: haemorrhage with NIHSS worsening ≥4 or death, within 72 h)',
      mortality: '90-day mortality 66 (40%) vs 70 (43%), described by the authors as similar',
      other: '332 randomised; 2 withdrew consent, leaving 330 (166 tenecteplase before EVT, 164 EVT alone); 329 completed 90-day follow-up (primary-outcome denominators 165 and 164)'
    },
    imagingCriteria: 'Registry criteria: basilar or vertebral artery occlusion (vertebral only if it blocks antegrade basilar flow) confirmed on CTA, MRA or DSA; PC-ASPECTS ≥6 on CT/CTA source images or ≥5 on MRI-DWI; no extensive bilateral thalamic or brainstem infarction; no space-occupying cerebellar infarction; no intracranial haemorrhage. The registry does not list a perfusion-mismatch requirement.',
    applicabilityNotes: 'The posterior-circulation counterpart of TNK-PLUS. Both trials asked whether adding IV tenecteplase before thrombectomy helps a patient beyond 4.5 h, and neither found a benefit: TNK-PLUS in perfusion-selected proximal MCA occlusion, ATTENTION LATE in basilar occlusion with NIHSS ≥10. The trial enrolled only patients admitted DIRECTLY to EVT-capable centres, so it does not address drip-and-ship patients facing a long transfer. It does not address patients within 4.5 h, where bridging stays the default for the IVT-eligible patient (DIRECT-SAFE included basilar occlusion). It is also a different question from TRACE-5 (Lancet 2026, PMID 41655588), which compared tenecteplase with standard medical treatment within 24 h in basilar occlusion, with or without later thrombectomy (49% had EVT). The two designs should not be merged at the bedside.',
    limitations: 'Open-label with blinded endpoint assessment. Conducted in China only (40 centres). With n=330, the risk-difference 95% CI (-10.13% to 9.76%) cannot exclude a benefit or harm of about 10 percentage points. Restricted to direct admissions to EVT-capable centres with NIHSS ≥10. The sICH comparison rests on 8 versus 6 events. This is an abstract-level review: the PMC full-text body was not retrievable, so P values, the baseline NIHSS and PC-ASPECTS distribution, onset-to-treatment times, reperfusion rates, secondary outcomes and subgroups were not verified. Eligibility and imaging detail come from the ClinicalTrials.gov registry, not the published methods.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-attention-late-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In basilar artery occlusion with NIHSS ≥10 presenting 4.5 to 24 h after onset directly to an EVT-capable centre, adding IV tenecteplase before thrombectomy did not improve 90-day functional independence versus thrombectomy alone (30% vs 30%). No benefit was demonstrated. The trial does not change the within-4.5 h bridging default and does not establish harm.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against PubMed PMID 42776543 (JAMA, published online 2026-09-23; DOI 10.1001/jama.2026.15496; PMC13602079) and ClinicalTrials.gov NCT05701956 (completed; enrolment 330; start 2023-03-16; primary completion 2025-02-04; completion 2025-05-04; no posted results). All numbers are copied from the PubMed abstract and Key Points. The PMC record returned the abstract but no body text, so secondary outcomes, P values and subgroups are omitted rather than asserted. Eligibility and imaging detail come from the registry record. Protocol: Li R et al., Stroke Vasc Neurol 2026, PMID 41946560, DOI 10.1136/svn-2025-004275. The published acronym is \"ATTENTION LATE\" (the repo previously wrote \"ATTENTION-LATE\"). Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'asset-it',
    shortName: 'ASSET-IT',
    fullName: 'Advancing Stroke Safety and Efficacy Through Early Tirofiban Administration After Intravenous Thrombolysis',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 832,
      ageRange: 'adults ≥18 y (registry NCT06134622); baseline age distribution not reported in the abstract',
      nihssRange: '4-25 before IV thrombolysis (registry NCT06134622)',
      timeWindow: 'IV thrombolysis within 4.5 h of onset (last known well); study drug started within 60 min after thrombolysis',
      keyInclusion: [
        'Acute ischaemic noncardioembolic stroke treated with IV alteplase or tenecteplase within 4.5 h of onset',
        'Not eligible for thrombectomy',
        'NIHSS 4-25 before thrombolysis (registry)',
        '38 centres in China; phase 3, multicentre, double-blind, placebo-controlled (NCT06134622)'
      ],
      keyExclusion: [
        'Planned mechanical thrombectomy or other endovascular treatment, e.g. intra-arterial thrombolysis (registry)',
        'History of atrial fibrillation or AF on emergency ECG (registry)',
        'ASPECTS or PC-ASPECTS <6 on NCCT, CTA source images or DWI; severe leukoaraiosis (registry)',
        'Pre-stroke mRS >1 (registry)'
      ]
    },
    intervention: '24-hour IV tirofiban infusion started within 60 min after IV thrombolysis (n=414); the thrombolytic was alteplase in 75% and tenecteplase in 25% of patients',
    comparator: 'Placebo infusion (n=418)',
    primaryEndpoint: {
      definition: 'Excellent functional outcome (mRS 0-1) at 90 days',
      timepoint: '90 d',
      result: 'MET superiority, favoring tirofiban: 65.9% vs 54.9%',
      effectSize: 'RR 1.20',
      confidenceInterval: '95% CI 1.07 to 1.34',
      pValue: 'p=0.001'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic intracranial haemorrhage within 36 h (safety outcome)', result: '1.7% (tirofiban) vs 0% (placebo); no between-group test reported in the abstract' },
      { name: 'Death at 90 days (safety outcome)', result: '4.1% vs 3.8%' }
    ],
    safetyFindings: {
      sich: '1.7% vs 0% within 36 h — low, but higher with tirofiban',
      mortality: '90-day mortality 4.1% vs 3.8%',
      other: 'Authors: "The incidence of intracranial hemorrhage was low but higher with tirofiban than placebo."'
    },
    imagingCriteria: 'Thrombectomy-ineligible; registry excluded ASPECTS or PC-ASPECTS <6 and severe leukoaraiosis — no vessel-occlusion requirement or exclusion stated in the abstract',
    applicabilityNotes: 'Tests an early (≤60 min after lysis) 24-hour GP IIb/IIIa infusion in thrombectomy-ineligible, noncardioembolic patients with NIHSS 4-25 — the group in whom usual practice withholds antithrombotics for 24 h after thrombolysis. Read it against MOST, which tested the same concept in a similar window without benefit: adjunctive eptifibatide (also a GP IIb/IIIa inhibitor) or argatroban started within 75 min of the start of IVT did not reduce 90-day disability (57 US sites, IVT within 3 h, 44% also had thrombectomy). The two trials differ in country, eligibility criteria, thrombectomy exposure and the exclusion of AF, and neither explains the other away, so the post-lysis GP IIb/IIIa question is unresolved rather than settled. The other tirofiban trials here answer different questions: RESCUE BT2 gave tirofiban instead of lysis in stroke without large/medium-vessel occlusion; INSTANT started it 4-24 h after an inadequate tenecteplase response; RESCUE BT gave it before thrombectomy (neutral); ATTRACTION gave it after successful thrombectomy. Three-quarters of ASSET-IT patients received alteplase, so the tenecteplase-specific effect is less certain. The 2026 AHA/ASA AIS guideline rates antiplatelet therapy in the first 24 h after IVT IIb (B-NR; risk "uncertain", ais-2026-137) and IV tirofiban IIb (B-R; efficacy "not well established", ais-2026-138).',
    limitations: 'Single-country (China) trial; AF/cardioembolic stroke, thrombectomy candidates, ASPECTS <6 and pre-stroke mRS >1 excluded; tirofiban is not licensed for stroke in most regions; the sICH excess is small in absolute terms (1.7% vs 0%) and the trial was not powered to characterise it; the discordant MOST result (no disability reduction with eptifibatide in a similar post-lysis window) has not been reconciled; tirofiban dose regimen, baseline age/NIHSS distribution and subgroup results are not captured here (abstract + registry only).',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-asset-it-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A large phase 3 double-blind trial in which an early 24-h tirofiban infusion after IV thrombolysis increased excellent 90-day outcome in thrombectomy-ineligible noncardioembolic stroke, with a small sICH excess. It is a single Chinese trial that conflicts with MOST, where a GP IIb/IIIa inhibitor (eptifibatide) given in a similar window did not reduce disability, so it does not by itself replace the standard 24-hour post-lysis antithrombotic hold outside a protocol; the 2026 AHA/ASA guideline rates IV tirofiban IIb (B-R).',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed abstract (PMID 40616232; N Engl J Med 2025;393(12):1191-1201; DOI 10.1056/NEJMoa2503678; epub 2025-07-04) and ClinicalTrials.gov NCT06134622 (eligibility; status completed, enrollment 832). No PMC full text. Tirofiban dose and baseline age/NIHSS are not in the abstract and were not recorded; secondary news reports (not primary) give median age 69 y, median NIHSS 6 and 0.4 µg/kg/min x 30 min then 0.1 µg/kg/min x 23.5 h — confirm against the NEJM full text before entering. The protocol paper (Int J Stroke 2025, PMID 39501470) listed sICH at 24 h; the publication reports sICH within 36 h. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'instant',
    shortName: 'INSTANT',
    fullName: 'Intravenous Tirofiban After Tenecteplase in Acute Ischemic Stroke',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 359,
      ageRange: 'Adults ≥18 y (registry); mean 66 y; 141 (39.3%) female',
      nihssRange: '≥4 before randomization (registry NCT05604638 and published protocol)',
      timeWindow: 'Randomized, with study drug started, 4-24 h after IV tenecteplase',
      keyInclusion: [
        'Acute ischaemic stroke treated with IV tenecteplase',
        'Insufficient clinical response on serial NIHSS within 4-24 h after tenecteplase: no significant change from baseline, neurological deterioration, or neurological fluctuation',
        'No large or medium vessel occlusion and no cardioembolic aetiology',
        '37 hospitals in China; recruitment Apr 24 2024 - Jul 16 2025; final follow-up Oct 11 2025'
      ],
      keyExclusion: [
        'Occlusion of ICA, MCA M1-M3, ACA A1-A3, PCA P1-P3, vertebral or basilar artery on CTA/MRA/DSA (registry)',
        'Confirmed or suspected cardioembolic mechanism, including chronic or paroxysmal atrial fibrillation (registry)',
        'Intracranial haemorrhage on CT/MRI after thrombolysis and before randomization (registry)',
        'Platelets <100×10^9/L or GFR <30 mL/min (registry)'
      ]
    },
    intervention: 'IV tirofiban 0.3 µg/kg/min over 30 min, then 0.075 µg/kg/min for up to 47.5 h (n=177); oral aspirin and/or clopidogrel started 44 h after thrombolysis',
    comparator: 'Matching placebo infusion (n=182); oral aspirin and/or clopidogrel started 24 h after thrombolysis',
    primaryEndpoint: {
      definition: 'Excellent outcome (mRS 0-1) at 90 days',
      timepoint: '90 d',
      result: 'MET superiority, favoring tirofiban: 63.8% (113/177) vs 52.2% (95/182)',
      effectSize: 'RR 1.22',
      confidenceInterval: '95% CI 1.02 to 1.46',
      pValue: 'p=0.03'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic ICH within 48 h (safety outcome)', result: '1 patient (reported as 0.9%) with tirofiban vs 0 with placebo' },
      { name: 'Death at 90 days (safety outcome)', result: '0.6% vs 1.6%' },
      { name: 'Prespecified secondary efficacy outcomes (ordinal mRS, mRS 0-2, mRS 0-3, early neurological improvement at 48 h, EQ-5D-5L)', result: 'Not reported in the published abstract; the full text was not available to verify them' }
    ],
    safetyFindings: {
      sich: '1 patient (reported as 0.9%) with tirofiban vs 0 with placebo within 48 h',
      mortality: '90-day mortality 0.6% vs 1.6%',
      other: 'Double-blind, placebo-controlled; 358/359 (99.7%) completed the trial'
    },
    imagingCriteria: 'CTA/MRA/DSA excluding large and medium vessel occlusion (registry lists ICA, M1-M3, A1-A3, P1-P3, vertebral and basilar); CT/MRI excluding haemorrhage after thrombolysis',
    applicabilityNotes: 'A narrow rescue population: non-LVO/MeVO, noncardioembolic patients with NIHSS ≥4 who did not improve, worsened or fluctuated 4-24 h after tenecteplase. Patients with large or medium vessel occlusion, a cardioembolic source (including AF) or alteplase-only thrombolysis were not enrolled, so the result does not transfer to them. Within this category, RESCUE BT2 (tirofiban vs aspirin; NIHSS ≥5 with limb weakness) also enrolled thrombolysis non-responders as one of four entry routes; ASSET-IT started a 24-h tirofiban infusion within 60 min of thrombolysis; MOST (argatroban or eptifibatide within 75 min of thrombolysis) showed no benefit. INSTANT tests delayed rescue tirofiban in tenecteplase non-responders and does not address routine concurrent adjuncts. The app\'s tirofiban_no_occlusion card already cites INSTANT; this record makes that citation traceable in the Atlas.',
    limitations: 'Single trial in one country (37 Chinese hospitals) with a modest sample (n=359); the lower 95% CI bound (1.02) is close to no effect. Control-arm mRS 0-1 (52.2%) was far higher than the 23% assumed in the published protocol\'s sample-size calculation (planned n=310; registry planned 348), so the population had a better prognosis than anticipated. The placebo arm started oral antiplatelets 20 h earlier (24 h vs 44 h after thrombolysis), so the comparison is tirofiban bridging versus earlier oral antiplatelet therapy, not tirofiban versus no antiplatelet. Safety event counts are very small (1 sICH), so bleeding risk is imprecisely estimated, and the reported 0.9% does not equal 1/177 (0.6%). Secondary efficacy outcomes could not be verified from the abstract. Per the published protocol, Lunan Pharmaceutical Group (the tirofiban manufacturer) supplied tirofiban and placebo and was one of the funders.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-instant-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In a single Chinese trial, IV tirofiban started 4-24 h after tenecteplase in non-LVO/MeVO, noncardioembolic non-responders increased 90-day mRS 0-1 (63.8% vs 52.2%) with one sICH. The 2026 AHA/ASA guideline, which predates INSTANT, rates IV tirofiban in AIS IIb (efficacy not well established).',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed abstract (PMID 42100960; JAMA 2026;335(22):1949-1958; DOI 10.1001/jama.2026.5245); PMC13156798 returned the abstract and Key Points only, with no body text. Eligibility was checked against ClinicalTrials.gov NCT05604638 (the registry still reads RECRUITING with a planned enrolment of 348) and the published protocol (J Am Heart Assoc 2025;14(13):e038536, PMID 40576038; also registered as ChiCTR2300074368; planned n=310). The ESOC 2026 late-breaking abstract (DOI 10.1093/esj/aakag023.1872) reported placebo 52.5% and mortality 1.7%; this record uses the JAMA figures (95/182 = 52.2%; 1.6%). The reported sICH of 0.9% for 1 of 177 tirofiban patients does not match 1/177 (0.6%), and the denominator is unverified. PubMed's first author entry is empty (unparsed); Liu X is the first named individual author. Confirm the byline on the publisher page. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'opens-2',
    shortName: 'OPENS-2',
    fullName: 'Normobaric hyperoxia combined with endovascular treatment for acute ischaemic stroke in China (OPENS-2 trial): a multicentre, randomised, single-blind, sham-controlled trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 282,
      ageRange: '18-80 y; median 65 (IQR 57-71); 75 (27%) female; 282 (100%) Chinese Han ethnicity',
      nihssRange: '10-20, with NIHSS level-of-consciousness score 0-1 (registry NCT04681651)',
      timeWindow: '≤6 h from onset (onset to randomisation)',
      keyInclusion: [
        'Acute ischaemic stroke from anterior-circulation large-vessel occlusion (ICA or MCA M1 on CT, MR or DSA angiography), candidate for endovascular treatment',
        'NIHSS 10-20 (registry)',
        'ASPECTS ≥6 and <1/3 MCA territory involved (registry)',
        'Pre-stroke mRS 0-1 (registry)',
        '26 comprehensive stroke centres in China; 473 screened, 282 randomised 1:1 by minimisation (age, sex, occlusion site, IV thrombolysis), 22 Apr 2021 - 5 Feb 2023; NCT04681651'
      ],
      keyExclusion: [
        'Active chronic obstructive pulmonary disease or acute respiratory distress syndrome (registry)',
        'Needing >3 L/min oxygen to keep SaO2 at 95% (registry)',
        'Seizure at onset; SBP >185 or DBP >110 mmHg; rapid improvement to NIHSS <10 or recanalisation before randomisation (registry)'
      ]
    },
    intervention: 'Normobaric hyperoxia plus EVT: 100% oxygen at 10 L/min via non-rebreather mask for 4 h, or FiO2 1.0 if intubated (n=140)',
    comparator: 'Sham normobaric hyperoxia plus EVT: 100% oxygen at 1 L/min, or FiO2 0.3 if intubated (n=142)',
    primaryEndpoint: {
      definition: 'Ordinal modified Rankin Scale score at 90 days, intention-to-treat population (all randomised patients)',
      timepoint: '90 days',
      result: 'MET superiority, favouring normobaric hyperoxia: median mRS 2 (IQR 1-4) vs 3 (IQR 1-4)',
      effectSize: 'Adjusted common OR 1.65',
      confidenceInterval: '95% CI 1.09 to 2.50',
      pValue: 'p=0.018'
    },
    secondaryEndpoints: [
      { name: 'Death at 90 days', result: '14/140 (10%) vs 17/142 (12%); adjusted risk difference -0.02 (95% CI -0.09 to 0.06)' },
      { name: 'Serious adverse events', result: '28 (20%) vs 33 (23%); adjusted risk difference -0.03 (95% CI -0.12 to 0.07)' }
    ],
    safetyFindings: {
      sich: 'Not reported in the abstract. sICH (ECASS II, 24 h) is a registered safety outcome (NCT04681651), but no trial-level figure could be verified: the full text is not in PMC',
      mortality: '90-day death 10% vs 12%; adjusted risk difference -0.02 (95% CI -0.09 to 0.06), no significant difference',
      other: 'Serious adverse events 20% vs 23% (adjusted risk difference -0.03, 95% CI -0.12 to 0.07); authors conclude benefit came "without raising safety concerns"'
    },
    imagingCriteria: 'CT, MR or DSA angiography showing ICA or MCA M1 occlusion; ASPECTS ≥6; infarct <1/3 of MCA territory on CT or MRI (registry)',
    applicabilityNotes: 'The 2026 AHA/ASA recommendation that normobaric hyperoxia before EVT "may be reasonable" (ais-2026-62; IIb, B-R) uses the OPENS-2 eligibility phenotype: ≤6 h, NIHSS 10-20, ASPECTS ≥6, anterior LVO (M1 or carotid terminus), planned EVT. Do not generalise beyond that phenotype. It does not support routine supplemental oxygen in non-hypoxic stroke without EVT, where SO2S found no benefit and ais-2026-64 advises against it. A later two-centre Chinese phase IIb trial in the 6-24 h window (Stroke 2026, PMID 42403344, NCT05128422; n=120, open-label with blinded assessors, EVT-alone control) improved early neurological improvement (35% vs 19%; adjusted OR 2.86, 95% CI 1.12-7.45) and 24-48 h infarct volume. Its 90-day mRS shift was not statistically significant (adjusted common OR 1.52, 95% CI 0.87-2.63), so the extended window remains unproven.',
    limitations: 'Single-country trial in a 100% Han Chinese population; modest sample (n=282); registered as phase 2 on ClinicalTrials.gov; single-blind by design (the abstract states participants and outcome assessors were masked); sICH and oxygen-specific adverse events are not in the abstract; the only positive confirmatory-size result so far and not yet replicated in a multinational trial.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-opens-2-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A single positive trial supports high-flow normobaric oxygen started before EVT, but only in the OPENS-2 phenotype, which is the framing of the 2026 AHA/ASA guideline (IIb, "may be reasonable"). It is not a basis for oxygen in non-hypoxic patients outside that phenotype. Multinational replication is still needed.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed abstract (PMID 39922675; Lancet 2025;405(10477):486-497; DOI 10.1016/S0140-6736(24)02809-5) and ClinicalTrials.gov NCT04681651 (eligibility and outcomes; the registry phase field reads PHASE2). The NIHSS, ASPECTS, pre-stroke mRS and exclusion criteria come from the registry, not the abstract. The protocol (PMID 39250887, Cerebrovasc Dis 2023;53(3):346-353) frames NBO as an adjunct given before recanalisation. No PMC full text, so sICH is unverified. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "post-tnk",
    "shortName": "POST-TNK",
    "fullName": "Intra-Arterial Tenecteplase Following Endovascular Reperfusion for Large Vessel Occlusion Acute Ischemic Stroke",
    "topic": "ia-adjunct-after-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ia-adjunct-after-evt"
    ],
    "population": {
      "n": 540,
      "ageRange": "≥18 years",
      "nihssRange": "≤25",
      "timeWindow": "≤24 h from last known well",
      "keyInclusion": [
        "Pre-stroke mRS 0–1",
        "Intracranial ICA, M1 or M2 occlusion; eTICI 2c–3 after EVT",
        "ASPECTS ≥6 within six hours; at 6–24 hours ASPECTS ≥7 or DAWN/DEFUSE-3 criteria"
      ],
      "keyExclusion": [
        "Prior IV thrombolysis"
      ]
    },
    "intervention": "IA tenecteplase 0.0625 mg/kg, maximum 6.25 mg, infused over 10–15 minutes after successful EVT",
    "comparator": "No intra-arterial thrombolysis (n=271 randomized; 270 analysed for the primary outcome)",
    "primaryEndpoint": {
      "definition": "Freedom from disability (mRS 0-1) at 90 days; superiority design",
      "timepoint": "90 d",
      "result": "DID NOT meet superiority: 49.1% (132/269) vs 44.1% (119/270)",
      "effectSize": "Adjusted RR 1.15",
      "confidenceInterval": "95% CI 0.97 to 1.36",
      "pValue": "P=.11"
    },
    "secondaryEndpoints": [
      {
        "name": "Death at 90 days (primary safety outcome)",
        "result": "16.0% vs 19.3%; adjusted HR 0.75 (95% CI 0.50-1.13), P=.16 — no significant difference"
      },
      {
        "name": "Symptomatic ICH within 48 h (primary safety outcome)",
        "result": "6.3% vs 4.4%; adjusted RR 1.43 (95% CI 0.68-2.99), P=.35 — numerically higher with IA tenecteplase, not significant"
      }
    ],
    "safetyFindings": {
      "sich": "6.3% vs 4.4% within 48 h; adjusted RR 1.43 (95% CI 0.68-2.99), P=.35",
      "mortality": "16.0% vs 19.3% at 90 d; adjusted HR 0.75 (95% CI 0.50-1.13), P=.16",
      "other": "Any radiographic ICH 36.6% versus 27.3%; adjusted RR 1.33 (95% CI 1.04–1.69), P=.02; additional safety signal with multiplicity caution."
    },
    "imagingCriteria": "eTICI 2c–3; ASPECTS ≥6 ≤6 hours, or ASPECTS ≥7 / DAWN / DEFUSE-3 selection at 6–24 hours.",
    "applicabilityNotes": "Run by the same Chongqing network with the same design as POST-UK (IA urokinase, JAMA 2025), which was also neutral; the posterior-circulation ATTENTION-IA trial (IA tenecteplase 0.0625 mg/kg, BMJ 2025) was likewise neutral on mRS 0-1. Read alongside the positive anterior-circulation IA-adjunct trials (CHOICE, CHOICE-2 with its mortality signal, PEARL, ANGEL-TNK at 0.125 mg/kg) and the neutral posterior-circulation IAT-TOP. POST-TNK enrolled only anterior-circulation patients with eTICI 2c-3 reperfusion and no prior IVT, so it does not address eTICI 2b reperfusion, IVT-bridged patients, or the posterior circulation. The 2026 AHA/ASA guideline rates adjunctive IA thrombolytics (urokinase, alteplase, or tenecteplase) after mTICI ≥2b as Class IIb (LOE B-R; ais-2026-131).",
    "limitations": "Open-label treatment (blinded outcome assessment only); single country (China); IVT-treated patients excluded; eTICI 2c-3 only; a single dichotomized primary endpoint. The 95% CI (0.97-1.36) neither demonstrates benefit nor excludes a modest one, and sICH was numerically higher with wide uncertainty.",
    "certainty": "moderate",
    "evidenceType": "rct",
    "citationIds": [
      "cit-post-tnk-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Neutral: adjunctive IA tenecteplase 0.0625 mg/kg after near-complete or complete reperfusion did not significantly increase 90-day mRS 0-1. It adds a neutral trial to a mixed IA-adjunct literature and is not a basis for routine use.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-26",
    "verificationStatus": "verified-pubmed",
    verificationNotes: "Original main report recovered and compared 2026-09-30, resolving earlier body-access gaps for the dose and eligibility fields. Supplement/protocol history not exhaustively audited. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification.",
  }),
  t({
    id: 'post-uk',
    shortName: 'POST-UK',
    fullName: 'Intra-Arterial Urokinase After Endovascular Reperfusion for Acute Ischemic Stroke',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: {
      n: 534,
      ageRange: 'Median 69 y; 41.8% female',
      nihssRange: 'Not specified in the abstract',
      timeWindow: '≤24 h from last known well',
      keyInclusion: [
        'Proximal intracranial anterior-circulation large-vessel occlusion (ICA, M1 or M2 per protocol) treated with EVT',
        'Near-complete or complete reperfusion after thrombectomy (eTICI 2c-3 per protocol)',
        '35 hospitals in China; Nov 2022-Mar 2024 (ChiCTR2200065617); 535 enrolled, 534 randomized (267 per arm)'
      ],
      keyExclusion: [
        'Received IV thrombolysis, or had a contraindication to IV thrombolysis other than time',
        'More than 3 thrombectomy passes or procedure time >90 min (protocol)',
        'Prestroke mRS ≥2 (protocol)',
        'Vessel rupture, dissection or contrast extravasation during the procedure (protocol)'
      ]
    },
    intervention: 'Single intra-arterial dose of urokinase 100 000 IU injected in the initial target territory after successful EVT (protocol: via distal access catheter or microcatheter proximal to the original occlusion over 10-15 min) (n=267)',
    comparator: 'No intra-arterial thrombolysis; procedure ended after EVT (n=267)',
    primaryEndpoint: {
      definition: 'Survival without disability (mRS 0-1) at 90 days; superiority design',
      timepoint: '90 d',
      result: 'DID NOT meet superiority: 45.1% (120/266) vs 40.2% (107/266)',
      effectSize: 'Adjusted RR 1.13',
      confidenceInterval: '95% CI 0.94 to 1.36',
      pValue: 'P=.19'
    },
    secondaryEndpoints: [
      { name: 'Death at 90 days (primary safety)', result: '18.4% vs 17.3%; adjusted HR 1.06 (95% CI 0.71-1.59), P=.77 — no difference' },
      { name: 'Symptomatic ICH within 48 h (primary safety)', result: '4.1% vs 4.1%; adjusted RR 1.05 (95% CI 0.45-2.44), P=.91 — no difference' }
    ],
    safetyFindings: {
      sich: '4.1% vs 4.1% within 48 h; adjusted RR 1.05 (95% CI 0.45-2.44), P=.91',
      mortality: '90-day mortality 18.4% vs 17.3%; adjusted HR 1.06 (95% CI 0.71-1.59), P=.77',
      other: 'Open-label with blinded end-point assessment; 532 (99.6%) completed the trial'
    },
    imagingCriteria: 'Angiographic selection only — randomization after thrombectomy achieved eTICI 2c-3 (near-complete or complete) reperfusion; eTICI 2b patients were not eligible',
    applicabilityNotes: 'The first dedicated RCT of intra-arterial urokinase after successful thrombectomy, run by the same Chinese network and design as POST-TNK (IA tenecteplase, also neutral). It enrolled only anterior-circulation patients with eTICI 2c-3 reperfusion who had not received (and were not otherwise ineligible for) IV thrombolysis, so it does not address eTICI 2b reperfusion, bridging-IVT patients or other urokinase doses. The 2026 AHA/ASA guideline rates adjunctive IA thrombolytics after mTICI ≥2b as IIb (B-R; ais-2026-131) and names urokinase among the options, but POST-UK itself showed no significant benefit of IA urokinase. Read with the positive IA alteplase and tenecteplase trials (CHOICE, CHOICE-2 with its mortality signal, PEARL, ANGEL-TNK) and the neutral ones (POST-TNK; posterior-circulation IAT-TOP and ATTENTION-IA).',
    limitations: 'Open-label (blinded end point); single country; anterior circulation and eTICI 2c-3 only; IVT-treated and IVT-ineligible patients excluded, as were procedures with >3 passes or >90 min; one fixed 100 000 IU dose; sized to detect a 13-point absolute difference in mRS 0-1 (protocol), so a smaller true benefit, which the CI (aRR 0.94-1.36) still allows, cannot be excluded.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-post-uk-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Neutral: a single 100 000 IU dose of IA urokinase after eTICI 2c-3 reperfusion did not significantly increase 90-day mRS 0-1, with no difference in sICH or mortality. No benefit of IA urokinase has been demonstrated, so this trial does not support routine use.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed abstract and PMC Key Points (PMID 39804674; JAMA 2025;333(7):589-598; DOI 10.1001/jama.2024.23480; PMC11836763). Registered only at ChiCTR (ChiCTR2200065617), with no NCT. n=534 is the number randomized (267 per arm; the Key Points say \"included 534 patients\"); 535 were enrolled. The eTICI 2c-3 threshold, anterior-circulation restriction, exclusions (IVT given or contraindicated, >3 passes, procedure >90 min, prestroke mRS ≥2) and the 13-point design assumption come from the published protocol (Stroke Vasc Interv Neurol 5(2):e001563, online 2024-10-30; PMID 41573192; DOI 10.1161/SVIN.124.001563). The PMC deposit of the JAMA paper carries the abstract and Key Points but no body text. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    "id": "attention-ia",
    "shortName": "ATTENTION-IA",
    "fullName": "Intra-arterial Tenecteplase After Successful Endovascular Recanalisation in Patients With Acute Posterior Circulation Arterial Occlusion",
    "topic": "ia-adjunct-after-evt",
    "diseaseArea": [
      "acute-ischemic-stroke",
      "ia-adjunct-after-evt",
      "evt-basilar"
    ],
    "population": {
      "n": 208,
      "ageRange": "≥18 y; mean 66.0 y (SD 11.1); 24.5% (51) women",
      "nihssRange": "≥6 (moderate to severe stroke); median NIHSS before EVT 20.0 (IQR 12.5-35.0)",
      "timeWindow": "Within 24 h of onset (last known free of major deficits); median onset to randomization 7.0 h (IQR 4.6-9.4); randomized after successful EVT",
      "keyInclusion": [
        "Occlusion of the V4 vertebral segment, proximal/middle/distal basilar artery, or P1 posterior cerebral artery (basilar 69%, vertebral 26%, PCA 5%)",
        "Successful recanalization after EVT (eTICI 2b50-3)",
        "Posterior-circulation ASPECTS ≥6 on non-contrast CT, CTA source images or MRI-DWI",
        "Prior IV thrombolysis allowed (26.9% vs 24.0% received it)",
        "31 hospitals in China; Jan 24 - Aug 24 2023 (NCT05684172)"
      ],
      "keyExclusion": [
        "Pre-stroke mRS >1",
        "Intracranial haemorrhage on neuroimaging",
        "Contraindication to IV thrombolysis other than time (registry)",
        "Complete clinical recovery in the angiography suite by the end of EVT (registry)",
        "Uncontrolled SBP >185 or DBP >110 mmHg (registry)"
      ]
    },
    "intervention": "Intra-arterial tenecteplase 0.0625 mg/kg (maximum 6.25 mg) over 15 s via distal access catheter or microcatheter, proximal to any residual thrombus or distal to the origin of the main pontine perforators, after successful EVT (n=104)",
    "comparator": "Endovascular treatment only, no intra-arterial adjunct (n=104)",
    "primaryEndpoint": {
      "definition": "Freedom from disability (mRS 0-1) at 90 days; intention-to-treat, adjusted for age, pre-stroke mRS, onset-to-randomization time, hypertension and baseline NIHSS",
      "timepoint": "90 d",
      "result": "DID NOT meet superiority: 34.6% (36/104) vs 26.0% (27/104); adjusted absolute difference 8.3 percentage points (95% CI -3.8 to 20.4)",
      "effectSize": "Adjusted RR 1.36",
      "confidenceInterval": "95% CI 0.92 to 2.02",
      "pValue": "P=0.12"
    },
    "secondaryEndpoints": [
      {
        "name": "Functional independence (mRS 0-2) at 90 days",
        "result": "38.5% (40) vs 40.4% (42); adjusted RR 0.93 (95% CI 0.67-1.28) — no signal"
      },
      {
        "name": "Ordinal mRS shift at 90 days",
        "result": "Adjusted common OR 1.00 (95% CI 0.61-1.62) — no shift"
      },
      {
        "name": "All-cause mortality at 90 days (primary safety)",
        "result": "27.9% (29) vs 26.9% (28); adjusted RR 1.13 (95% CI 0.73-1.74)"
      },
      {
        "name": "Symptomatic ICH within 36 h, modified Heidelberg (primary safety)",
        "result": "8.3% (8) vs 3.1% (3); adjusted RR 3.09 (95% CI 0.78-12.20)"
      },
      {
        "name": "Any radiological ICH within 36 h",
        "result": "26.8% (26) vs 15.5% (15); adjusted RR 1.77 (95% CI 1.00-3.11)"
      },
      {
        "name": "Index-artery patency at 24–72 h (CTA/MRA; missing-imaging count unresolved)",
        "result": "90.0% (63) vs 91.4% (64); adjusted RR 0.98 (95% CI 0.88-1.10); source footnote and denominators disagree on how many scans were missing."
      }
    ],
    "safetyFindings": {
      "sich": "8.3% vs 3.1% within 36 h — numerically higher with IA tenecteplase; adjusted RR 3.09 (95% CI 0.78-12.20), not statistically significant. The sICH window was changed from 72 h to 36 h during the trial",
      "mortality": "27.9% vs 26.9% at 90 d; adjusted RR 1.13 (95% CI 0.73-1.74) — no difference",
      "other": "Any radiological ICH within 36 h 26.8% vs 15.5% (adjusted RR 1.77, 95% CI 1.00-3.11); secondary outcomes were not adjusted for multiplicity"
    },
    "imagingCriteria": "Posterior-circulation occlusion (V4, basilar or P1) with eTICI 2b50-3 after EVT; pc-ASPECTS ≥6 on CT, CTA source images or MRI-DWI",
    "applicabilityNotes": "The posterior-circulation counterpart of the anterior-circulation IA tenecteplase trials. It used the same 0.0625 mg/kg dose as POST-TNK (anterior circulation, neutral) and half the ANGEL-TNK dose (0.125 mg/kg, positive primary). With IAT-TOP (IA alteplase after successful basilar recanalization, also neutral), neither randomized posterior-circulation trial shows benefit from adjunctive IA thrombolysis, and ATTENTION-IA adds a numerical excess of sICH and any ICH. The population is intracranial-atherosclerosis-predominant (large-artery atherosclerosis 69.0% vs 58.7%), with intracranial stenting or angioplasty in 43.3% vs 34.6%, and tenecteplase was infused distal to the pontine perforators in 56%. The 2026 AHA/ASA IIb recommendation for adjunctive IA thrombolytics after mTICI ≥2b (ais-2026-131) is not circulation-specific, and the two posterior-circulation RCTs give it no randomized support after vertebrobasilar thrombectomy.",
    "limitations": "Open-label with blinded endpoint assessment (PROBE); single country (China); powered for an 18-percentage-point absolute difference, so the 95% CI (RR 0.92-2.02) cannot exclude a smaller benefit; sICH estimate rests on 11 events and its window was changed from 72 h to 36 h; imbalances in hypertension (70.2% vs 84.6%, adjusted for) and stenting (43.3% vs 34.6%); no post-EVT perfusion imaging; the paper gives the adjusted absolute difference as 8.3 points in the Results and 7.6% in the Limitations section. Table 2 missing-imaging count is internally inconsistent; it is omitted rather than silently recalculated.",
    "certainty": "low",
    "evidenceType": "rct",
    "citationIds": [
      "cit-attention-ia-2025"
    ],
    "relatedActiveTrialIds": [],
    "practiceImpact": "Neutral: IA tenecteplase after successful posterior-circulation recanalization did not significantly increase 90-day mRS 0-1, secondary functional outcomes showed no signal, and symptomatic ICH was numerically higher. No demonstrated benefit; not a basis for routine IA thrombolysis after vertebrobasilar thrombectomy.",
    "lastReviewed": "2026-09-30",
    "promotedDate": "2026-09-26",
    "verificationStatus": "verified-pubmed",
    "verificationNotes": "Verified 2026-09-26 against the PubMed abstract (PMID 39809509; BMJ 2025;388:e080489; DOI 10.1136/bmj-2024-080489), the PMC full text (PMC11729139; baseline table, Table 2 outcomes) and ClinicalTrials.gov NCT05684172 (eligibility; phase 2/3; enrollment 208). e080489 is the BMJ article number, not a page range. The registry lists sICH within 72 h and mortality as secondary outcomes; the publication reports sICH within 36 h and 90-day mortality as primary safety outcomes, and states that the sICH window was changed from 72 h to 36 h. The abstract conclusion says \"combined disability and mortality\"; the primary outcome is mRS 0-1 as recorded here. Review scope: selected original main-report fields compared; no exhaustive protocol, supplement or whole-card clinical certification."
  }),
  t({
    id: 'optimistmain',
    shortName: 'OPTIMISTmain',
    fullName: 'Low-intensity versus standard monitoring after intravenous thrombolysis for acute ischaemic stroke (Optimal Post rtPA-IV Monitoring in Ischaemic Stroke Trial)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'stroke-unit-care'],
    population: {
      n: 4922,
      ageRange: 'Adults ≥18 y (registry NCT03734640); age distribution not reported in the PubMed abstract',
      nihssRange: '<10 (mild to moderate impairment) and clinically stable',
      timeWindow: 'Eligibility (clinically stable, NIHSS <10) established within 2 h of initiation of IV thrombolysis; the tested protocols cover the first 24 h after thrombolysis',
      keyInclusion: [
        'Consecutive adults with acute ischaemic stroke treated with IV thrombolysis according to local guidelines (registry: IV alteplase according to standard criteria)',
        'Clinically stable with NIHSS <10 within 2 h of thrombolysis initiation',
        '4922 participants at 114 hospitals (clusters) in eight countries (Australia, Chile, China, Malaysia, Mexico, UK, USA, Vietnam); hospitals randomly allocated to three stepped-wedge implementation sequences across four periods between Apr 28 2021 and Sep 30 2024 (NCT03734640)'
      ],
      keyExclusion: [
        'NIHSS ≥10 (major neurological impairment) or clinically unstable / critical-care needs',
        'Definite clinical contraindication or indication to either low-intensity or standard neurological monitoring (registry)'
      ]
    },
    intervention: 'Low-intensity monitoring: neurological and vital-sign assessments every 15 min for 2 h, then every 2 h for 8 h, then every 4 h until 24 h after thrombolysis (n=2789)',
    comparator: 'Standard monitoring: every 15 min for 2 h, then every 30 min for 6 h, then every 1 h until 24 h after thrombolysis (n=2133)',
    primaryEndpoint: {
      definition: 'Unfavourable functional outcome (mRS 2-6) at 90 days, assessed by research staff masked to allocation; non-inferiority margin RR 1.15, intention-to-treat, generalised linear mixed model adjusted for cluster and time with imputation of missing outcomes',
      timepoint: '90 days',
      result: 'BORDERLINE — non-inferiority NOT established with conventional confidence: mRS 2-6 in 809/2552 (31.7%) with low-intensity vs 606/1963 (30.9%) with standard monitoring. The upper 95% CI bound (1.15) reaches the 1.15 margin and p=0.057; the authors conclude only "weak evidence" that low-intensity monitoring is non-inferior',
      effectSize: 'RR 1.03 (unfavourable outcome, low-intensity vs standard)',
      confidenceInterval: '95% CI 0.92 to 1.15',
      pValue: 'p=0.057 (non-inferiority test, as reported); above the one-sided 0.025 alpha stated in the trial protocol'
    },
    secondaryEndpoints: [
      { name: 'Symptomatic intracerebral haemorrhage', result: '5/2783 (0.2%) low-intensity vs 8/2122 (0.4%) standard; too few events for a precise comparison' },
      { name: 'Serious adverse events', result: 'Similar: 309/2789 (11.1%) vs 240/2133 (11.3%)' }
    ],
    safetyFindings: {
      sich: '5/2783 (0.2%) vs 8/2122 (0.4%)',
      mortality: 'Not reported in the PubMed abstract (full text not in PMC); captured within the mRS 2-6 primary outcome',
      other: 'Serious adverse events 309/2789 (11.1%) vs 240/2133 (11.3%)'
    },
    imagingCriteria: 'None beyond standard IV-thrombolysis eligibility under local guidelines',
    applicabilityNotes: 'Applies only to clinically stable patients with NIHSS <10 after IV thrombolysis. It does not address patients treated with thrombectomy, NIHSS ≥10, patients needing critical care, or anyone with early deterioration. The pragmatic stepped-wedge design across eight countries mirrors routine stroke-unit practice, but the non-inferiority result is borderline, so the trial supports a hospital-level protocol review rather than a mandate. The app\'s default post-thrombolysis schedule (every 15 min for 2 h, every 30 min for 6 h, hourly for 16 h) is unchanged by this record; adopting a low-intensity pathway is an institutional decision.',
    limitations: 'Stepped-wedge cluster randomisation (hospitals switched from control to intervention over time) rather than individual randomisation, so estimates depend on modelling of secular trends and cluster effects; nurses and clinicians were aware of the monitoring protocol (only the 90-day assessment was masked); unequal group sizes; the 95% CI upper bound reaches the margin (p=0.057). The 2023 protocol paper (PMID 37883934) and the registry named the ordinal 90-day mRS as the primary outcome and projected 7,200 patients at 120 sites; the published primary outcome is dichotomous mRS 2-6 with an RR margin of 1.15, and 4922 participants were enrolled. The registry lists IV alteplase; tenecteplase use is not described in the abstract. sICH was rare (13 events), limiting safety precision; mortality and protocol adherence are not reported in the abstract.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-optimistmain-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Cluster-randomised data suggest that, in clinically stable NIHSS <10 patients, less frequent observation after thrombolysis gave similar 90-day mRS 2-6 rates with few sICH events. Non-inferiority was not established with conventional confidence (the authors call the evidence weak), so the trial supports local protocol review, not a change to the default post-thrombolysis monitoring schedule.',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed abstract (PMID 40412428; Lancet 2025;405(10493):1909-1922; DOI 10.1016/S0140-6736(25)00549-5), the ClinicalTrials.gov record NCT03734640 (completed; enrollment 4922; registered primary outcome: 90-day mRS shift analysis) and the protocol paper (PMID 37883934; Cerebrovasc Dis 2023). Also registered as ACTRN12619001556134p (as printed in the abstract). The full text is not in PMC, so age, sex, mortality and protocol adherence were not recorded. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
  t({
    id: 'headsoar',
    shortName: 'HeadSOAR',
    fullName: 'Head Positioning After Endovascular Therapy for Acute Stroke due to Large Vessel Occlusion (HeadSOAR)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'stroke-unit-care'],
    population: {
      n: 1368,
      ageRange: 'Adults ≥18 y; median age 68 y; 565 (41.3%) women',
      nihssRange: 'Median baseline NIHSS 15; registry requires NIHSS ≥8 before EVT',
      timeWindow: 'Last known well to randomisation ≤24 h (registry); assigned head position maintained for 72 h after EVT',
      keyInclusion: [
        'Anterior-circulation LVO (ICA, M1 or M2, with or without a cervical tandem lesion) on DSA (registry)',
        'Successful reperfusion (eTICI ≥2b) after thrombectomy',
        'ASPECTS ≤7 before EVT (registry; the design preprint describes "medium to large core strokes") — confirm against the BMJ methods',
        '67 comprehensive stroke centres in China; 16 Nov 2023 to 23 Jan 2025 (NCT06115707)'
      ],
      keyExclusion: [
        'Pre-stroke mRS >1 (registry)',
        'Acute occlusions in multiple vascular territories (registry)',
        'Contraindication to a flat head position (registry)'
      ]
    },
    intervention: 'Elevated head position 30-40° for 72 h after thrombectomy (n=685)',
    comparator: 'Flat head position 0-10° for 72 h after thrombectomy (n=683)',
    primaryEndpoint: {
      definition: 'Functional status at 90 days by ordinal (shift) analysis of the modified Rankin Scale (0-6)',
      timepoint: '90 d',
      result: 'DID NOT meet — no significant shift: median mRS 3 (IQR 1-5) with head elevation vs 3 (IQR 1-5) flat',
      effectSize: 'Adjusted generalised OR 1.12 for a lower level of disability (head elevation vs flat)',
      confidenceInterval: '95% CI 0.97 to 1.29',
      pValue: 'P=0.14'
    },
    secondaryEndpoints: [
      { name: 'All-cause mortality at 90 days (primary safety outcome)', result: '125/682 (18.3%) vs 137/676 (20.3%); adjusted RR 0.86 (95% CI 0.69 to 1.07), P=0.18' }
    ],
    safetyFindings: {
      sich: 'Not reported in the PubMed abstract (registry secondary outcome: sICH by Heidelberg criteria within 72 h)',
      mortality: '18.3% vs 20.3% at 90 d — numerically lower with elevation, not statistically different',
      other: 'Open-label, blinded end point; 1358 (99.3%) completed 90-day follow-up; pneumonia and brain oedema are registry secondary outcomes not reported in the abstract'
    },
    imagingCriteria: 'DSA-confirmed anterior-circulation LVO with eTICI ≥2b after thrombectomy; ASPECTS ≤7 before EVT per registry',
    applicabilityNotes: 'The largest trial of head position after thrombectomy. In anterior-circulation LVO with eTICI ≥2b reperfusion, 72 h of head elevation (30-40°) versus flat positioning (0-10°) did not significantly shift the 90-day mRS; the confidence interval (0.97 to 1.29) is compatible with no effect or a modest benefit of elevation, and the authors state that the result "leaves open the possibility of a modest but clinically meaningful benefit of head elevation". The registry restricts enrolment to NIHSS ≥8 and ASPECTS ≤7 (medium-to-large core), so the result may not transfer to small-core or unsuccessfully reperfused patients. It complements HeadPoST (24 h flat vs ≥30° in unselected, mostly mild stroke; null) and the 2026 AHA/ASA statement that routine flat positioning for 24 h gives no benefit over 30° (ais-2026-66, III: No Benefit). Head position before reperfusion (ZODIAC) is a separate question; HeadSOAR gives no evidence that continuing flat positioning after successful EVT improves outcome. HoBIT (NCT07367633; 0° vs ≥30° after EVT, recruiting) is testing the question without a core restriction.',
    limitations: 'Open-label (positioning cannot be masked) with blinded end-point assessment; single country (China); registry eligibility limited to NIHSS ≥8, ASPECTS ≤7 and eTICI ≥2b; adherence to the 72-h positions, sICH, pneumonia and malignant oedema are not reported in the abstract; the between-group difference was smaller than expected, so a modest benefit of elevation is not excluded.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-headsoar-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'After successful thrombectomy for anterior-circulation LVO (registry: NIHSS ≥8, ASPECTS ≤7), 72 h of head elevation at 30-40° did not significantly improve 90-day disability compared with flat 0-10° positioning; a modest benefit of elevation is not excluded. Neither position is established as outcome-improving after reperfusion, so head-of-bed angle remains a patient-specific judgement (for example aspiration risk, oedema, tolerance).',
    lastReviewed: '2026-09-26',
    promotedDate: '2026-09-26',
    verificationStatus: 'verified-pubmed',
    verificationNotes: "Verified 2026-09-26 against the PubMed record (PMID 42624516; BMJ 2026;394:e100363; DOI 10.1136/bmj-2026-100363; published 2026-08-20; no PMC full text) and ClinicalTrials.gov NCT06115707 (eligibility: NIHSS ≥8, ASPECTS ≤7, eTICI 2b-3, onset to randomisation ≤24 h). The ASPECTS ≤7 criterion matches the design preprint (medRxiv doi 10.1101/2025.10.30.25339117, which describes \"medium to large core strokes\"; seen via search listing only, full text egress-blocked) but has not been checked against the BMJ methods. Review scope: indexed primary outcome/abstract only; full original report, detailed eligibility, supplements and application claims are not comprehensively verified.",
  }),
];

const byId = new Map(completedTrials.map((c) => [c.id, c]));

export function getCompletedTrial(id) {
  return byId.get(id) || null;
}

export function getAllCompletedTrialIds() {
  return new Set(byId.keys());
}
