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
    applicabilityNotes: 'Pragmatic, non-inferior — supports TNK as first-line in eligible AIS, especially when EVT is anticipated.',
    limitations: 'Open-label; primary endpoint included mRS 0-1 only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-act-2022'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Supports TNK 0.25 mg/kg as a preferred IV thrombolytic for IVT-eligible AIS within 4.5 h.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'trace-2',
    shortName: 'TRACE-2',
    fullName: 'Trial of Tenecteplase in Chinese Patients with Acute Ischemic Stroke',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
    population: { n: 1430, ageRange: '≥18', nihssRange: 'NIHSS 5-25', timeWindow: '≤4.5 h', keyInclusion: ['IVT-eligible'], keyExclusion: ['EVT-intended in some sites'] },
    intervention: 'Tenecteplase 0.25 mg/kg',
    comparator: 'Alteplase 0.9 mg/kg',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Non-inferior: 62.0% (TNK) vs 58.0% (alteplase)', effectSize: 'RR 1.07', confidenceInterval: '95% CI 0.98 to 1.16', pValue: 'Non-inferiority met' },
    secondaryEndpoints: [{ name: 'sICH', result: 'Similar' }],
    safetyFindings: { sich: '~2% in both groups', mortality: 'Similar', other: '' },
    imagingCriteria: 'NIHSS-driven, NCCT',
    applicabilityNotes: 'External validity in East Asian population.',
    limitations: 'Excluded LVO with intended EVT in many sites.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-trace2-2023'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Confirms non-inferiority of TNK in non-LVO eligible AIS within 4.5 h.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'original',
    shortName: 'ORIGINAL',
    fullName: 'Tenecteplase vs Alteplase in AIS (ORIGINAL)',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 1489, ageRange: '≥18', nihssRange: 'all eligible', timeWindow: '≤4.5 h', keyInclusion: ['IVT-eligible AIS within 4.5 h'], keyExclusion: ['Standard contraindications'] },
    intervention: 'TNK 0.25 mg/kg',
    comparator: 'Alteplase 0.9 mg/kg',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Non-inferior', effectSize: 'See publication', confidenceInterval: '', pValue: 'Non-inferiority met' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: 'NCCT',
    applicabilityNotes: '',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-original-2024'],
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'Adds further RCT support for TNK as alteplase-equivalent first-line.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- Late window IVT -------------------
  t({
    id: 'wake-up',
    shortName: 'WAKE-UP',
    fullName: 'MRI-Guided Thrombolysis for Stroke with Unknown Time of Onset',
    topic: 'wake-up-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'wake-up-stroke', 'extended-window-ivt'],
    population: { n: 503, ageRange: '18-80', nihssRange: 'NIHSS ≤25', timeWindow: 'unknown onset (last seen well >4.5 h)', keyInclusion: ['DWI-FLAIR mismatch on MRI', 'Pre-stroke mRS 0-1'], keyExclusion: ['Planned thrombectomy'] },
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'extend',
    shortName: 'EXTEND',
    fullName: 'Thrombolysis Guided by Perfusion Imaging up to 9 Hours after Onset',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 225, ageRange: '18-80', nihssRange: '4-26', timeWindow: '4.5-9 h or wake-up', keyInclusion: ['Perfusion-imaging mismatch (core <70 mL, mismatch ratio >1.2, mismatch volume >10 mL)'], keyExclusion: ['LVO with planned EVT'] },
    intervention: 'IV alteplase 0.9 mg/kg',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Favored alteplase: 35.4% vs 29.5%', effectSize: 'Adjusted RR 1.44', confidenceInterval: '95% CI 1.01 to 2.06', pValue: 'p=0.04' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '6.2% (alteplase) vs 0.9% (placebo)', mortality: '11.5% vs 8.9%', other: '' },
    imagingCriteria: 'CTP / MR-PWI core-mismatch',
    applicabilityNotes: 'Population had ~70% non-LVO; provides direct evidence for late-window selection in EVT-ineligible.',
    limitations: 'Stopped early after WAKE-UP results; modest sample size.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-extend-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports perfusion-mismatch IVT in 4.5-9 h window when EVT not indicated.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'epithet',
    shortName: 'EPITHET',
    fullName: 'Echoplanar Imaging Thrombolytic Evaluation Trial',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 101, ageRange: '≥18', nihssRange: '4-22', timeWindow: '3-6 h', keyInclusion: ['MR-PWI/DWI mismatch'], keyExclusion: [] },
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ecass4-extend',
    shortName: 'ECASS4-EXTEND',
    fullName: 'Extending the Time Window for IV Thrombolysis Using MRI-based Selection',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 119, ageRange: '18-85', nihssRange: '≥4', timeWindow: '4.5-9 h', keyInclusion: ['MRI mismatch'], keyExclusion: [] },
    intervention: 'IV alteplase',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS distribution (ordinal shift) at 90 d', timepoint: '90 d', result: 'Favored alteplase numerically; not statistically significant after early termination', effectSize: 'OR 1.20 (alteplase vs placebo)', confidenceInterval: '95% CI 0.63 to 2.27', pValue: 'p=0.58' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'MRI mismatch',
    applicabilityNotes: 'Trial stopped early after WAKE-UP / EXTEND results.',
    limitations: 'Underpowered after early stop.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-ecass4-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds to the late-window mismatch evidence base; not independently practice-changing.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'timeless',
    shortName: 'TIMELESS',
    fullName: 'Tenecteplase for Stroke at 4.5 to 24 Hours with Perfusion-Imaging Selection',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt', 'tnk-vs-alteplase'],
    population: { n: 458, ageRange: '18-85', nihssRange: '5-25', timeWindow: '4.5-24 h', keyInclusion: ['Anterior LVO + salvageable tissue (CTP mismatch)'], keyExclusion: [] },
    intervention: 'TNK 0.25 mg/kg IV',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'Favored TNK numerically; primary endpoint did not reach significance overall', effectSize: 'Adjusted common OR ~1.13', confidenceInterval: '95% CI ~0.82 to 1.57', pValue: 'p=0.45 (overall)' },
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'twist',
    shortName: 'TWIST',
    fullName: 'Tenecteplase in Wake-up Ischaemic Stroke Trial',
    topic: 'wake-up-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'wake-up-stroke'],
    population: { n: 578, ageRange: '≥18', nihssRange: 'all eligible', timeWindow: 'wake-up <4.5 h after waking', keyInclusion: ['Wake-up AIS, NCCT-only selection'], keyExclusion: [] },
    intervention: 'TNK 0.25 mg/kg',
    comparator: 'Standard care',
    primaryEndpoint: { definition: 'mRS shift at 90 d', timepoint: '90 d', result: 'No significant benefit overall', effectSize: '', confidenceInterval: '', pValue: 'p ns' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: 'NCCT only (no advanced imaging)',
    applicabilityNotes: 'Negative for unselected wake-up TNK; reinforces need for imaging-based selection.',
    limitations: 'Open-label; no advanced imaging.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-twist-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Late-window thrombolysis without advanced imaging is not supported.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'trace-iii',
    shortName: 'TRACE-III',
    fullName: 'Tenecteplase for Ischemic Stroke 4.5-24 Hours without Thrombectomy',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 516, ageRange: '18-80', nihssRange: '6-25', timeWindow: '4.5-24 h', keyInclusion: ['LVO without planned EVT', 'Salvageable tissue (perfusion mismatch)'], keyExclusion: ['EVT planned or available'] },
    intervention: 'TNK 0.25 mg/kg',
    comparator: 'Standard care',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Favored TNK: 33.0% vs 24.2%', effectSize: 'RR 1.37', confidenceInterval: '95% CI 1.04 to 1.81', pValue: 'p=0.03' },
    secondaryEndpoints: [{ name: 'sICH', result: '3.0% (TNK) vs 0.8% (control)' }],
    safetyFindings: { sich: '3.0% vs 0.8%', mortality: 'Similar', other: '' },
    imagingCriteria: 'CTP mismatch / penumbra',
    applicabilityNotes: 'Pure EVT-ineligible population — supports late-window IV thrombolysis where EVT is not an option.',
    limitations: 'Single-region (China); needs replication.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-trace-iii-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Strongest evidence to date for late-window TNK in EVT-ineligible LVO.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'rescue-japan-limit',
    shortName: 'RESCUE-Japan LIMIT',
    fullName: 'Endovascular Therapy for Acute Stroke with Large Ischemic Region',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 203, ageRange: '≥18', nihssRange: '6-30', timeWindow: '≤24 h', keyInclusion: ['ASPECTS 3-5 on CT'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'mRS 0-3 at 90 d', timepoint: '90 d', result: '31.0% (EVT) vs 12.7% (control)', effectSize: 'RR 2.43', confidenceInterval: '95% CI 1.35 to 4.37', pValue: 'p=0.002' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '9% vs 4.5%', mortality: 'Similar', other: '' },
    imagingCriteria: 'NCCT ASPECTS 3-5',
    applicabilityNotes: 'Established large-core EVT benefit pre-SELECT2 / ANGEL-ASPECT.',
    limitations: 'Single-country.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-rescue-japan-2022'],
    relatedActiveTrialIds: ['tested'],
    practiceImpact: 'First major RCT to support large-core EVT.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'tension',
    shortName: 'TENSION',
    fullName: 'Endovascular Thrombectomy for AIS with Established Large Infarct',
    topic: 'evt-large-core',
    diseaseArea: ['acute-ischemic-stroke', 'evt-large-core'],
    population: { n: 253, ageRange: '18-85', nihssRange: '≥6', timeWindow: '≤12 h', keyInclusion: ['ASPECTS 3-5'], keyExclusion: [] },
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  // ------------------- EVT for basilar-artery occlusion -------------------
  t({
    id: 'attention',
    shortName: 'ATTENTION',
    fullName: 'Endovascular Treatment of Acute Basilar-Artery Occlusion',
    topic: 'evt-basilar',
    diseaseArea: ['acute-ischemic-stroke', 'evt-basilar'],
    population: { n: 340, ageRange: '≥18', nihssRange: '≥10', timeWindow: '≤12 h', keyInclusion: ['Basilar-artery occlusion', 'NIHSS ≥10'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'Good functional status (mRS 0-3) at 90 d', timepoint: '90 d', result: 'Favored EVT: 46% vs 23%', effectSize: 'Adjusted RR 2.06', confidenceInterval: '95% CI 1.46 to 2.91', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '5.3% vs 0%', mortality: '37% vs 55% at 90 d', other: '' },
    imagingCriteria: 'CTA/MRA-confirmed basilar-artery occlusion, ≤12 h',
    applicabilityNotes: 'Chinese population; ≤12 h window.',
    limitations: 'Open-label; conducted in China; stopped early.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-attention-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Established EVT benefit for basilar-artery occlusion within 12 h.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'baoche',
    shortName: 'BAOCHE',
    fullName: 'Thrombectomy 6 to 24 Hours after Stroke Due to Basilar-Artery Occlusion',
    topic: 'evt-basilar',
    diseaseArea: ['acute-ischemic-stroke', 'evt-basilar'],
    population: { n: 217, ageRange: '≥18', nihssRange: '≥6', timeWindow: '6-24 h', keyInclusion: ['Basilar-artery occlusion', 'posterior-circulation ASPECTS criteria'], keyExclusion: [] },
    intervention: 'EVT + medical care',
    comparator: 'Medical care',
    primaryEndpoint: { definition: 'Good functional status (mRS 0-3) at 90 d', timepoint: '90 d', result: 'Favored EVT: 46% vs 24%', effectSize: 'Adjusted rate ratio 1.81', confidenceInterval: '95% CI 1.26 to 2.60', pValue: 'p<0.001' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '~6% vs 1%', mortality: 'Lower with EVT', other: '' },
    imagingCriteria: 'Basilar-artery occlusion, 6-24 h from estimated onset',
    applicabilityNotes: 'Extends basilar EVT to the 6-24 h window.',
    limitations: 'Open-label; conducted in China; stopped early for efficacy.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-baoche-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Extends EVT benefit for basilar-artery occlusion to 6-24 h.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
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
    primaryEndpoint: { definition: 'mRS shift / 90-d functional independence', timepoint: '90 d', result: 'Favored EVT: 49% vs 13% (functional independence)', effectSize: 'Adjusted difference 33 percentage points', confidenceInterval: '95% credible interval 24 to 44 percentage points', pValue: 'Posterior probability of superiority >0.999 (Bayesian)' },
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'defuse-3',
    shortName: 'DEFUSE-3',
    fullName: 'Thrombectomy at 6-16 Hours with Selection by Perfusion Imaging',
    topic: 'evt-late-window',
    diseaseArea: ['acute-ischemic-stroke', 'evt-late-window'],
    population: { n: 182, ageRange: '18-90', nihssRange: '≥6', timeWindow: '6-16 h', keyInclusion: ['Core <70 mL, mismatch ratio >1.8, mismatch volume >15 mL'], keyExclusion: [] },
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- IA adjunct after EVT -------------------
  t({
    id: 'choice',
    shortName: 'CHOICE',
    fullName: 'Intra-arterial Alteplase Following Successful Thrombectomy',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 121, ageRange: '≥18', nihssRange: 'all', timeWindow: 'post-EVT', keyInclusion: ['Successful EVT (mTICI 2b/3)'], keyExclusion: [] },
    intervention: 'Intra-arterial alteplase (post-EVT)',
    comparator: 'Placebo',
    primaryEndpoint: { definition: 'mRS 0-1 at 90 d', timepoint: '90 d', result: 'Favored alteplase: 59.0% vs 40.4%', effectSize: 'Adjusted RR 1.59', confidenceInterval: '95% CI 1.07 to 2.36', pValue: 'p=0.047' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'No significant increase', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Hypothesis-generating; replication ongoing.',
    limitations: 'Small; stopped early.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-choice-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'IA alteplase after successful EVT may improve outcomes; not yet standard of care.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
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
    safetyFindings: { sich: '', mortality: 'No deaths', other: '' },
    imagingCriteria: 'Ophthalmologic exam',
    applicabilityNotes: 'CRAO thrombolysis remains investigational; benefit population-uncertain.',
    limitations: 'Small; underpowered.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-theia-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'THEIA was neutral (adjusted OR 1.1, 95% CI 0.07-18.39, p=0.95; underpowered) — CRAO thrombolysis remains unproven; do not present it as evidence-supported outside trials.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Primary endpoint numbers re-verified against PubMed 2026-08-22 (Lancet Neurol 2025;24(11):909-919, PMID 41109232): 19/29 (66%) vs 13/27 (48%), adjusted OR 1.1, p=0.95 — neutral.'
  }),

  // ------------------- ICH -------------------
  t({
    id: 'interact3',
    shortName: 'INTERACT3',
    fullName: 'Care Bundle Approach for Acute Intracerebral Haemorrhage',
    topic: 'ich-bp-management',
    diseaseArea: ['ich', 'ich-bp-management'],
    population: { n: 7036, ageRange: '≥18', nihssRange: 'n/a', timeWindow: '<6 h from onset', keyInclusion: ['Acute spontaneous ICH'], keyExclusion: ['Massive ICH with imminent death'] },
    intervention: 'Care bundle (intensive BP lowering to <140 mmHg, glucose 6.1-7.8 mmol/L, temperature <37.5°C, anticoagulant reversal)',
    comparator: 'Usual care',
    primaryEndpoint: { definition: 'mRS shift at 6 mo', timepoint: '6 mo', result: 'Favored bundle', effectSize: 'Adjusted common OR 0.86', confidenceInterval: '95% CI 0.76 to 0.97', pValue: 'p=0.015' },
    secondaryEndpoints: [{ name: 'Mortality at 6 mo', result: 'Favored bundle' }],
    safetyFindings: { sich: 'n/a', mortality: 'Lower with bundle', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Implementation-focused: bundle not single-component.',
    limitations: 'Cluster-randomized; bundle effects cannot be attributed to single component.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-interact3-2023'],
    relatedActiveTrialIds: ['saturn'],
    practiceImpact: 'Establishes care-bundle approach for acute ICH.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'annexa-i',
    shortName: 'ANNEXA-I',
    fullName: 'Andexanet for Factor Xa Inhibitor-Associated Acute ICH',
    topic: 'ich-anticoag-reversal',
    diseaseArea: ['ich', 'ich-anticoag-reversal'],
    population: { n: 530, ageRange: '≥18', nihssRange: 'n/a', timeWindow: '≤15 h from last FXa dose, ≤6 h from ICH onset', keyInclusion: ['ICH on apixaban/rivaroxaban/edoxaban'], keyExclusion: [] },
    intervention: 'Andexanet alfa',
    comparator: 'Usual care (predominantly 4F-PCC)',
    primaryEndpoint: { definition: 'Hemostatic efficacy at 12 h', timepoint: '12 h', result: 'Favored andexanet: 67.0% vs 53.1%', effectSize: 'Adjusted difference 13.4%', confidenceInterval: '95% CI 4.6 to 22.2', pValue: 'p=0.003' },
    secondaryEndpoints: [{ name: 'Thrombotic events at 30 d', result: '10.3% (andexanet) vs 5.6% (usual care)' }],
    safetyFindings: { sich: 'n/a', mortality: 'Similar at 30 d', other: 'More thrombotic events with andexanet' },
    imagingCriteria: '',
    applicabilityNotes: 'Hemostatic benefit comes with thrombotic-risk trade-off.',
    limitations: 'Open-label; usual care heterogeneous.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-annexa-i-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'AHA/ASA 2022 lists andexanet as Class IIa for FXa-associated ICH; ANNEXA-I refines hemostatic-vs-thrombotic trade-off.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'enrich',
    shortName: 'ENRICH',
    fullName: 'Early Minimally Invasive Removal of Intracerebral Hemorrhage',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: { n: 300, ageRange: '18-80', nihssRange: 'n/a', timeWindow: '≤24 h from onset', keyInclusion: ['ICH 30-80 mL, lobar (after early stop in deep cohort)'], keyExclusion: [] },
    intervention: 'Early minimally invasive parafascicular evacuation + standard care',
    comparator: 'Standard medical care',
    primaryEndpoint: { definition: 'Utility-weighted mRS at 180 d', timepoint: '180 d', result: 'Favored surgery (Bayesian posterior probability >0.95)', effectSize: 'Mean difference 0.084 (0.458 vs 0.374)', confidenceInterval: '95% CrI 0.005 to 0.163', pValue: '' },
    secondaryEndpoints: [{ name: 'Mortality at 30 d', result: '9.3% (surgery) vs 18.0% (control)' }],
    safetyFindings: { sich: 'n/a', mortality: '9.3% (surgery) vs 18.0% (control) by 30 d', other: '' },
    imagingCriteria: 'CT-confirmed ICH 30-80 mL',
    applicabilityNotes: 'Adaptive design enriched for lobar; deep ICH did not benefit and was stopped.',
    limitations: 'Open-label; specific device.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-enrich-2024'],
    relatedActiveTrialIds: ['saturn'],
    practiceImpact: 'Supports early minimally invasive evacuation for lobar ICH at capable centers.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- DAPT -------------------
  t({
    id: 'chance',
    shortName: 'CHANCE',
    fullName: 'Clopidogrel with Aspirin in Acute Minor Stroke or TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 5170, ageRange: '≥40', nihssRange: 'NIHSS ≤3 (or high-risk TIA)', timeWindow: '≤24 h', keyInclusion: ['Minor stroke or high-risk TIA'], keyExclusion: ['Cardioembolic source'] },
    intervention: 'Aspirin + clopidogrel x 21 days, then clopidogrel x 90 d',
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'point',
    shortName: 'POINT',
    fullName: 'Clopidogrel and Aspirin in Acute Ischemic Stroke and High-Risk TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 4881, ageRange: '≥18', nihssRange: 'NIHSS ≤3', timeWindow: '≤12 h', keyInclusion: ['Minor stroke or high-risk TIA'], keyExclusion: [] },
    intervention: 'Aspirin + clopidogrel x 90 days',
    comparator: 'Aspirin alone',
    primaryEndpoint: { definition: 'Major ischemic event at 90 d', timepoint: '90 d', result: 'Favored DAPT: 5.0% vs 6.5%', effectSize: 'HR 0.75', confidenceInterval: '95% CI 0.59 to 0.95', pValue: 'p=0.02' },
    secondaryEndpoints: [{ name: 'Major hemorrhage', result: 'Increased with DAPT (0.9% vs 0.4%)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Bleeding higher with DAPT' },
    imagingCriteria: '',
    applicabilityNotes: 'Bleeding excess emerges after ~21 days, supporting short-course strategy.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-point-2018'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Reinforces 21-day cap on DAPT for minor stroke.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'thales',
    shortName: 'THALES',
    fullName: 'Ticagrelor and Aspirin or Aspirin Alone in AIS or TIA',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 11016, ageRange: '≥40', nihssRange: 'NIHSS ≤5', timeWindow: '≤24 h', keyInclusion: ['Mild/moderate AIS or high-risk TIA'], keyExclusion: ['Cardioembolic'] },
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
    practiceImpact: 'Supports ticagrelor-based DAPT, especially when CYP2C19 LOF suspected.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'inspires',
    shortName: 'INSPIRES',
    fullName: 'Dual Antiplatelet Treatment up to 72 Hours after Ischemic Stroke',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 6100, ageRange: '≥35', nihssRange: 'mild stroke or high-risk TIA', timeWindow: '≤72 h', keyInclusion: ['Mild AIS or high-risk TIA, ≤72 h'], keyExclusion: [] },
    intervention: 'Aspirin + clopidogrel x 21 days, started up to 72 h',
    comparator: 'Aspirin alone',
    primaryEndpoint: { definition: 'New stroke at 90 d', timepoint: '90 d', result: 'Favored DAPT', effectSize: 'HR 0.79', confidenceInterval: '95% CI 0.66 to 0.94', pValue: 'p=0.008' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: 'Moderate-to-severe bleeding higher with DAPT' },
    imagingCriteria: '',
    applicabilityNotes: 'Extends DAPT eligibility window from 24 h to 72 h.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-inspires-2024'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Allows DAPT initiation up to 72 h in eligible mild stroke.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'chance-2',
    shortName: 'CHANCE-2',
    fullName: 'Ticagrelor or Clopidogrel with Aspirin in High-Risk TIA or Minor Stroke',
    topic: 'dapt-minor-stroke',
    diseaseArea: ['secondary-prevention', 'dapt-minor-stroke'],
    population: { n: 6412, ageRange: '≥40', nihssRange: 'NIHSS ≤3', timeWindow: '≤24 h', keyInclusion: ['CYP2C19 loss-of-function carrier', 'Mild AIS or high-risk TIA'], keyExclusion: [] },
    intervention: 'Ticagrelor + ASA x 21 d',
    comparator: 'Clopidogrel + ASA x 21 d',
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
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- AF anticoagulation timing -------------------
  t({
    id: 'elan',
    shortName: 'ELAN',
    fullName: 'Early versus Later Anticoagulation for Stroke with Atrial Fibrillation',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 2013, ageRange: '≥18', nihssRange: 'all', timeWindow: 'post-AIS, ≤28 d', keyInclusion: ['AIS with non-valvular AF'], keyExclusion: ['Mechanical valve'] },
    intervention: 'Early DOAC (within 48 h for minor, 6-7 d for major)',
    comparator: 'Delayed DOAC (>3-4 d for minor, 12-14 d for major)',
    primaryEndpoint: { definition: 'Composite of recurrent stroke / SE / major bleeding at 30 d', timepoint: '30 d', result: '2.9% (early) vs 4.1% (later)', effectSize: 'Risk difference -1.18 percentage points', confidenceInterval: '95% CI -2.84 to 0.47', pValue: '' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Used stroke severity (CT-derived) to calibrate timing.',
    limitations: 'Confidence interval crosses 1 for primary; secondary supports early.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-elan-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports early DOAC initiation per stroke severity.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
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
    safetyFindings: { sich: 'No increase', mortality: 'Similar', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Smaller than ELAN; consistent direction.',
    limitations: 'Underpowered for superiority.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-timing-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports earlier DOAC initiation.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'AF stroke prevention superiority of apixaban over aspirin in VKA-unsuitable patients. Did NOT enrol ICH survivors — background context, not direct ICH-survivor evidence.',
    limitations: 'Pre-DOAC adoption era; comparator is aspirin; prior-ICH patients not enrolled.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-averroes-2011'],
    relatedActiveTrialIds: ['aspire'],
    practiceImpact: 'Supports anticoagulation over aspirin for AF stroke prevention generally; the ICH-survivor question is answered by the dedicated trials below.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'artesia',
    shortName: 'ARTESiA',
    fullName: 'Apixaban for Stroke Prevention in Subclinical Atrial Fibrillation',
    topic: 'subclinical-af',
    diseaseArea: ['secondary-prevention', 'subclinical-af', 'af-after-ich'],
    population: { n: 4012, ageRange: '≥55', nihssRange: 'n/a', timeWindow: 'subclinical AF detected on device', keyInclusion: ['Subclinical AF on cardiac implantable device'], keyExclusion: [] },
    intervention: 'Apixaban',
    comparator: 'Aspirin 81 mg',
    primaryEndpoint: { definition: 'Stroke or systemic embolism', timepoint: '3.5 y', result: 'Favored apixaban: 0.78%/y vs 1.24%/y', effectSize: 'HR 0.63', confidenceInterval: '95% CI 0.45 to 0.88', pValue: 'p=0.007' },
    secondaryEndpoints: [{ name: 'Major bleeding', result: '1.71%/y vs 0.94%/y; HR 1.80' }],
    safetyFindings: { sich: 'Similar', mortality: 'Similar', other: 'Major bleeding higher with apixaban' },
    imagingCriteria: '',
    applicabilityNotes: 'Subclinical-AF trial illustrating the stroke-vs-bleeding trade-off; it did NOT enrol ICH survivors, so it is background rather than direct evidence for that population.',
    limitations: 'Subclinical AF only; prior-ICH patients not enrolled.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-artesia-2023'],
    relatedActiveTrialIds: ['aspire'],
    practiceImpact: 'Establishes apixaban benefit in subclinical AF; the ICH-survivor question is addressed by PRESTIGE-AF, SoSTART, APACHE-AF and the COCROACH meta-analysis, which enrolled that population.',
    lastReviewed: lr,
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- Currency promotion 2026-05-29 (PubMed-verified) -------------------
  t({
    id: 'optimas',
    shortName: 'OPTIMAS',
    fullName: 'Optimal Timing of Anticoagulation after Acute Ischaemic Stroke with Atrial Fibrillation',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 3621, ageRange: '≥18', nihssRange: '', timeWindow: 'Early ≤4 d vs delayed 7-14 d', keyInclusion: ['AF + acute ischaemic stroke'], keyExclusion: [] },
    intervention: 'Early DOAC (≤4 d)',
    comparator: 'Delayed DOAC (7-14 d)',
    primaryEndpoint: { definition: 'Composite: recurrent ischaemic stroke, sICH, unclassifiable stroke, systemic embolism', timepoint: '90 d', result: 'Non-inferior: 3.3% vs 3.3%', effectSize: 'Adjusted risk difference 0.000', confidenceInterval: '95% CI −0.011 to 0.012', pValue: 'p=0.0003 (non-inferiority)' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Low and similar', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Enrolled across infarct sizes; supports not delaying initiation.',
    limitations: 'Open-label timing; blinded endpoint.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-optimas-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Early DOAC (≤4 d) non-inferior to delayed — do not routinely delay anticoagulation.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'catalyst',
    shortName: 'CATALYST',
    fullName: 'IPD Meta-analysis of Anticoagulation Timing after Ischaemic Stroke with AF',
    topic: 'af-anticoag-timing',
    diseaseArea: ['secondary-prevention', 'af-anticoag-timing'],
    population: { n: 5441, ageRange: '', nihssRange: '', timeWindow: 'Early ≤4 d vs later ≥5 d', keyInclusion: ['AF + ischaemic stroke', 'Pooled TIMING, ELAN, OPTIMAS, START'], keyExclusion: [] },
    intervention: 'Early DOAC (≤4 d)',
    comparator: 'Later DOAC (≥5 d)',
    primaryEndpoint: { definition: 'Composite: recurrent ischaemic stroke, sICH, unclassified stroke', timepoint: '30 d', result: 'Favored early: 2.1% vs 3.0%', effectSize: 'OR 0.70', confidenceInterval: '95% CI 0.50 to 0.98', pValue: 'p=0.039' },
    secondaryEndpoints: [{ name: 'Recurrent ischaemic stroke', result: 'OR 0.66 (0.45-0.96)' }, { name: 'sICH', result: 'OR 1.02 (0.43-2.46)' }],
    safetyFindings: { sich: 'No excess (OR 1.02)', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Individual-patient-data pooling of 4 RCTs.',
    limitations: 'Meta-analysis of open-label-timing trials.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-catalyst-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Pooled IPD shows early DOAC (≤4 d) reduces 30-d composite — supports early initiation.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'respect-esus',
    shortName: 'RE-SPECT ESUS',
    fullName: 'Dabigatran for Prevention of Stroke after Embolic Stroke of Undetermined Source',
    topic: 'esus',
    diseaseArea: ['secondary-prevention', 'esus'],
    population: { n: 5390, ageRange: '≥60 (or ≥45 with risk factor)', nihssRange: '', timeWindow: '', keyInclusion: ['ESUS'], keyExclusion: ['Known AF'] },
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
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'arcadia',
    shortName: 'ARCADIA',
    fullName: 'Apixaban to Prevent Recurrence after Cryptogenic Stroke in Patients with Atrial Cardiopathy',
    topic: 'esus',
    diseaseArea: ['secondary-prevention', 'esus'],
    population: { n: 1015, ageRange: '≥45', nihssRange: '', timeWindow: '', keyInclusion: ['Cryptogenic stroke', 'Atrial cardiopathy', 'No AF'], keyExclusion: ['Known AF'] },
    intervention: 'Apixaban 5 mg BID',
    comparator: 'Aspirin 81 mg',
    primaryEndpoint: { definition: 'Recurrent stroke', timepoint: 'Annualized', result: 'No benefit: 4.4%/yr vs 4.4%/yr', effectSize: 'HR 1.00', confidenceInterval: '95% CI 0.64 to 1.55', pValue: 'Stopped for futility' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH', result: '0 (apixaban) vs 7 (aspirin)' }],
    safetyFindings: { sich: '0 vs 7', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Atrial cardiopathy: P-wave terminal force, NT-proBNP, or LA diameter.',
    limitations: 'Stopped for futility.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-arcadia-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Apixaban no better than aspirin in atrial-cardiopathy ESUS — atrial cardiopathy alone does not justify anticoagulation.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    safetyFindings: { sich: '', mortality: '', other: 'Device / AF events' },
    imagingCriteria: '',
    applicabilityNotes: 'Long-term follow-up of the RESPECT cohort.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-respect-pfo-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Long-term PFO closure reduces recurrent stroke vs medical therapy in selected patients <60 y.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    practiceImpact: 'More intensive target (<140) gave no benefit and more renal AEs — avoid overshoot below ~140.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'mistie-iii',
    shortName: 'MISTIE III',
    fullName: 'Minimally Invasive Surgery with Thrombolysis in ICH Evacuation',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: { n: 506, ageRange: '≥18', nihssRange: '', timeWindow: '', keyInclusion: ['Supratentorial ICH ≥30 mL'], keyExclusion: [] },
    intervention: 'MIS catheter + alteplase',
    comparator: 'Standard medical care',
    primaryEndpoint: { definition: 'Good outcome (mRS 0-3)', timepoint: '365 d', result: 'Negative: 45% vs 41%', effectSize: 'Adjusted risk difference 4%', confidenceInterval: '95% CI −4% to 12%', pValue: 'p=0.33' },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: 'Lower with MIS (secondary)', other: 'Outcome better when residual clot ≤15 mL' },
    imagingCriteria: '',
    applicabilityNotes: 'Functional outcome tied to extent of clot evacuation.',
    limitations: 'Negative primary; benefit signal only with adequate evacuation.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-mistie3-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'No overall functional benefit; safe; outcome depends on achieving adequate evacuation.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
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
    primaryEndpoint: { definition: 'Composite periprocedural stroke/MI/death or 4-y ipsilateral stroke', timepoint: '4 y', result: 'Equivalent: 7.2% vs 6.8%', effectSize: 'HR 1.11', confidenceInterval: '95% CI 0.81 to 1.51', pValue: 'p=0.51' },
    secondaryEndpoints: [{ name: 'Periprocedural stroke', result: 'CAS 4.1% vs CEA 2.3% (p=0.01)' }, { name: 'Periprocedural MI', result: 'CAS 1.1% vs CEA 2.3% (p=0.03)' }],
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Stroke favors CEA; MI favors CAS' },
    imagingCriteria: '',
    applicabilityNotes: 'Age interaction: CAS worse periprocedural stroke in older patients.',
    limitations: '',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-crest-2010'],
    relatedActiveTrialIds: [],
    practiceImpact: 'CAS and CEA equivalent on the composite; stroke risk favors CEA, MI risk favors CAS.',
    lastReviewed: '2026-05-29',
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- "What's New" promotion 2026-05-30 (PubMed-verified) -------------------
  // Recent practice-changing studies surfaced in the What's New feed and verified
  // against PubMed (PMID resolves, title matches intervention, abstract supports
  // the reported effect direction + magnitude). lastReviewed=2026-05-30,
  // promotedDate=2026-05-30, verificationStatus='verified-pubmed'.
  t({
    id: 'oceanic-stroke',
    shortName: 'OCEANIC-STROKE',
    fullName: 'Asundexian for Secondary Stroke Prevention',
    topic: 'factor-xi-inhibition',
    diseaseArea: ['secondary-prevention', 'factor-xi-inhibition'],
    population: { n: 12327, ageRange: '≥18', nihssRange: '', timeWindow: '≤72 h', keyInclusion: ['Noncardioembolic ischaemic stroke or high-risk TIA', 'Atherosclerosis / nonlacunar infarct / atherosclerotic plaque'], keyExclusion: [] },
    intervention: 'Asundexian 50 mg once daily + antiplatelet therapy',
    comparator: 'Placebo + antiplatelet therapy',
    primaryEndpoint: { definition: 'Ischaemic stroke', timepoint: 'Trial duration', result: 'Lower with asundexian: 6.2% vs 8.4%', effectSize: 'Cause-specific HR 0.74', confidenceInterval: '95% CI 0.65 to 0.84', pValue: 'p<0.001' },
    secondaryEndpoints: [{ name: 'CV death, MI, or stroke', result: 'Lower with asundexian' }, { name: 'Major bleeding', result: '1.9% vs 1.7% (HR 1.10, 0.85-1.44)' }],
    safetyFindings: { sich: '', mortality: '', other: 'Major bleeding similar (HR 1.10, 0.85-1.44)' },
    imagingCriteria: '',
    applicabilityNotes: 'First positive phase-3 factor XIa inhibitor for secondary prevention.',
    limitations: 'On-top-of-antiplatelet design; long-term safety still accruing.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-oceanic-stroke-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Asundexian on top of antiplatelets cut ischaemic stroke ~26% without more major bleeding — could reshape noncardioembolic prevention.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
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
    safetyFindings: { sich: '', mortality: '', other: 'Early discontinuation 13.6% vs 6.0%, mainly ≥20% serum creatinine rise' },
    imagingCriteria: '',
    applicabilityNotes: 'Simplified low-dose triple pill after ICH; 2-week active run-in before randomisation.',
    limitations: 'Higher adverse-event discontinuation with triple pill.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-trident-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A simplified low-dose triple pill after ICH lowers recurrent stroke and CV events — supports intensive, simplified BP-lowering.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'distal',
    shortName: 'DISTAL',
    fullName: 'Endovascular Treatment for Medium or Distal Vessel Occlusion Stroke — 12-Month Outcomes',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: { n: 543, ageRange: 'Median 77', nihssRange: 'Median 6', timeWindow: '≤6 h, or 6-24 h with salvageable tissue', keyInclusion: ['Medium/distal occlusion: M2/M3-M4, A1-A3, P1-P3'], keyExclusion: [] },
    intervention: 'Endovascular treatment + best medical treatment',
    comparator: 'Best medical treatment alone',
    primaryEndpoint: { definition: 'Disability on ordinal mRS (scores 5-6 combined)', timepoint: '12 mo', result: 'No difference (median mRS 2 vs 2)', effectSize: 'Adjusted common OR 0.81', confidenceInterval: '95% CI 0.59 to 1.12', pValue: 'p=0.20' },
    secondaryEndpoints: [{ name: 'Overall survival', result: 'HR 1.46 (0.93-2.30), p=0.10' }],
    safetyFindings: { sich: '', mortality: 'Survival similar (HR 1.46, NS)', other: '' },
    imagingCriteria: 'Salvageable tissue required for 6-24 h window',
    applicabilityNotes: '12-month results consistent with 90-day results; mild-to-moderate MeVO.',
    limitations: 'Open-label; benefit not excluded in subgroups.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-distal-2025', 'cit-distal-2026'],
    relatedActiveTrialIds: ['step-evt'],
    practiceImpact: 'No long-term benefit of EVT in mild-to-moderate medium/distal vessel occlusion — routine thrombectomy not supported in this population.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'escape-mevo',
    shortName: 'ESCAPE-MeVO',
    fullName: 'Endovascular Treatment for Medium Vessel Occlusion Stroke',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: {
      n: 530,
      ageRange: 'Mean 69.8',
      nihssRange: 'Median 8',
      timeWindow: '≤12 h from last known well',
      keyInclusion: ['Medium vessel occlusion (M2/M3 branches of MCA, A2/A3 branches of ACA, P2/P3 branches of PCA)', 'NIHSS ≥5 or disabling NIHSS 2-4', 'ASPECTS ≥5 on CT (or ≥6 on MRI)'],
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
      { name: 'mRS 0-1 at 90 d (primary)', result: '41.6% vs 43.1% (adjusted rate ratio 0.95, 95% CI 0.79 to 1.15, p=0.61)' },
      { name: 'mRS 0-2 at 90 d', result: '60.3% vs 60.1% (aOR 0.98, 95% CI 0.67 to 1.43)' }
    ],
    safetyFindings: {
      sich: '5.4% vs 2.2% (aOR 2.37, 95% CI 0.90 to 6.27)',
      mortality: '13.3% vs 8.4% (aHR 1.82, 95% CI 1.06 to 3.12)',
      other: 'Higher 90-day mortality in the EVT group (safety signal)'
    },
    imagingCriteria: 'CTA/MRA-selected MeVO',
    applicabilityNotes: 'No functional benefit and showed a signal of increased 90-day mortality and sICH.',
    limitations: 'Open-label trial; ended early for enrollment feasibility.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-mevo-2025'],
    relatedActiveTrialIds: ['step-evt'],
    practiceImpact: 'Does not support routine endovascular thrombectomy for isolated medium vessel occlusion stroke outside of clinical trials.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'Median 10 (range 3-36); NIHSS >=6 required',
      timeWindow: '<=24 h from onset',
      keyInclusion: ['Medium vessel occlusion', 'NIHSS >=6 (moderate-to-severe deficit)', 'Presentation within 24 h of onset', '48 centres in China'],
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
    applicabilityNotes: 'The first POSITIVE randomized trial of MeVO thrombectomy, and it conflicts with the neutral DISTAL / ESCAPE-MeVO / DISCOUNT trials that underpin the 2026 guideline Class III (No Benefit) grading. The most likely reconciler is the deficit threshold: ORIENTAL-MeVO required NIHSS >=6, whereas the neutral trials enrolled milder deficits. Published after the 2026 AIS guideline, so that guideline predates this evidence. Single-country (China), open-label with blinded outcome assessment.',
    limitations: 'Open-label; conducted entirely in China; the prespecified mRS-shift primary analysis could not be used because the proportional-odds assumption was violated.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-oriental-mevo-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports considering thrombectomy for isolated medium vessel occlusion when the deficit is moderate-to-severe (NIHSS >=6), against a background of neutral trials in milder deficits. Individualize; do not read the older Class III grading as covering this population.',
    lastReviewed: '2026-08-22',
    promotedDate: '2026-08-22',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'direct-angio',
    shortName: 'DIRECT ANGIO',
    fullName: 'Direct versus Conventional Transfer to Angiography Suite in Patients with Severe Acute Stroke Treated with Thrombectomy (France)',
    topic: 'acute-ischemic-stroke',
    diseaseArea: ['acute-ischemic-stroke'],
    population: { n: 115, ageRange: '≤85', nihssRange: '', timeWindow: '≤5 h of onset', keyInclusion: ['Acute severe neurological deficit highly suggestive of LVO (ASND-LVO)'], keyExclusion: [] },
    intervention: 'Direct transfer to angiography suite (DTAS)',
    comparator: 'Conventional imaging-first pathway',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-2)', timepoint: '90 d', result: 'No benefit: 36% vs 42%', effectSize: 'Adjusted OR 0.73', confidenceInterval: '95% CI 0.32 to 1.69', pValue: '' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH', result: '15% vs 0% (adj OR 11.0, 1.28-1406)' }, { name: 'All-cause mortality', result: '18% vs 11% (adj OR 1.65, 0.52-5.55)' }],
    safetyFindings: { sich: '15% vs 0% (adj OR 11.0)', mortality: '18% vs 11% (NS)', other: 'Trial stopped early for safety' },
    imagingCriteria: '',
    applicabilityNotes: 'Stopped early for safety after interim analysis; 10 comprehensive stroke centres.',
    limitations: 'Small n (115) limits precision of all estimates.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-direct-angio-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Bypassing pre-EVT imaging increased sICH without benefit and was halted early — cautions against direct-to-angio in suspected LVO.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'tnk-vs-alteplase-rwe',
    shortName: 'TNK vs alteplase · RWE',
    fullName: 'Real-World Efficacy and Safety of Tenecteplase versus Alteplase in Acute Ischemic Stroke: A Propensity Score-Matched Analysis',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
    population: { n: 371, ageRange: '', nihssRange: '', timeWindow: '', keyInclusion: ['Thrombolysed AIS', '68 (18.3%) received tenecteplase', 'Single-centre retrospective, propensity-matched'], keyExclusion: [] },
    intervention: 'Tenecteplase',
    comparator: 'Alteplase',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-2)', timepoint: '90 d', result: 'Comparable (p>0.05)', effectSize: '', confidenceInterval: '', pValue: 'p>0.05 (NS)' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH', result: 'Numerically higher with TNK, NS (p=0.449)' }, { name: 'Door-to-needle time', result: 'Similar between groups' }],
    safetyFindings: { sich: 'Numerically higher with TNK, NS', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Real-world support for tenecteplase as a practical alteplase alternative.',
    limitations: 'Small single-centre; no point estimate / CI reported; underpowered for sICH; selection bias.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-tnk-vs-alteplase-rwe-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds real-world support for tenecteplase as a practical alteplase alternative — consistent with trial-level non-inferiority.',
    lastReviewed: '2026-05-30',
    promotedDate: '2026-05-30',
    verificationStatus: 'verified-pubmed'
  }),

  // ===================== 2026-07-06 evidence refresh (all PubMed-verified) =====================
  t({
    id: 'bridge-tnk',
    shortName: 'BRIDGE-TNK',
    fullName: 'Intravenous Tenecteplase before Thrombectomy in Stroke',
    topic: 'tnk-vs-alteplase',
    diseaseArea: ['acute-ischemic-stroke', 'tnk-vs-alteplase'],
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
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'PubMed 40396577; NCT04733742. Primary numbers from published abstract, verified 2026-07-06.'
  }),
  t({
    id: 'hope-2025',
    shortName: 'HOPE',
    fullName: 'Alteplase for Acute Ischemic Stroke at 4.5 to 24 Hours: The HOPE Randomized Clinical Trial',
    topic: 'extended-window-ivt',
    diseaseArea: ['acute-ischemic-stroke', 'extended-window-ivt'],
    population: { n: 372, ageRange: 'median 72', nihssRange: '', timeWindow: '4.5-24 h', keyInclusion: ['Salvageable tissue on perfusion imaging', 'No initial plan for thrombectomy', 'LVO and non-LVO included'], keyExclusion: ['Planned thrombectomy'] },
    intervention: 'IV alteplase 0.9 mg/kg (max 90 mg)',
    comparator: 'Standard medical treatment',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-1)', timepoint: '90 d', result: 'Favored alteplase: 40% vs 26%', effectSize: 'Adjusted RR 1.52', confidenceInterval: '95% CI 1.14 to 2.02', pValue: 'p=0.004' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH (36 h)', result: '3.8% (alteplase) vs 0.51% (control); adjusted RR 7.34' }, { name: 'Mortality (90 d)', result: '11% in both groups' }],
    safetyFindings: { sich: '3.8% vs 0.51%', mortality: '11% vs 11%', other: '' },
    imagingCriteria: 'CT perfusion — salvageable tissue / target mismatch',
    applicabilityNotes: 'Late-window (4.5-24 h) IV alteplase in perfusion-selected patients not going to thrombectomy. Emerging evidence; not a standard AHA/ASA recommendation. China-only, open-label with blinded endpoint.',
    limitations: 'Single-country (China); higher sICH; extended-window IVT selection criteria still being defined; do not phrase as routine thrombolysis to 24 h.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-hope-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds positive evidence for perfusion-selected late-window IV thrombolysis in EVT-ineligible patients; remains selective and consult-dependent, not routine.',
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'PubMed 40773205; NCT04879615. Verified 2026-07-06.'
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
    verificationNotes: 'PubMed 40174223; NCT05429476. Verified 2026-07-06.'
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
    verificationNotes: 'PubMed 40892424; NCT03342664. Negative trial; verified 2026-07-06.'
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
    applicabilityNotes: 'Late-window perfusion-selected TNK; improved reperfusion but no clear clinical benefit. Emerging; not a standard recommendation.',
    limitations: 'Modest size; surrogate (reperfusion) improved without confirmed clinical benefit.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-chablis-t2-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds to the mixed late-window TNK evidence base; reinforces that reperfusion gains have not consistently translated to clinical benefit.',
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'PubMed 39744861. Effect summary from trial report; verified 2026-07-06.'
  }),
  t({
    id: 'tempo-2',
    shortName: 'TEMPO-2',
    fullName: 'Tenecteplase versus Standard of Care for Minor Ischaemic Stroke with Proven Occlusion (TEMPO-2)',
    topic: 'minor-stroke-thrombolysis',
    diseaseArea: ['acute-ischemic-stroke', 'minor-stroke-thrombolysis'],
    population: { n: 886, ageRange: 'adults', nihssRange: '0-5 (minor)', timeWindow: '≤12 h', keyInclusion: ['Minor stroke (NIHSS 0-5)', 'Intracranial occlusion on CTA'], keyExclusion: [] },
    intervention: 'IV tenecteplase 0.25 mg/kg',
    comparator: 'Standard of care (antiplatelet)',
    primaryEndpoint: { definition: 'Return to baseline function on pre-morbid mRS (ITT)', timepoint: '90 d', result: 'No benefit: 72% (309/432) tenecteplase vs 75% (338/452) control', effectSize: 'RR 0.96', confidenceInterval: '95% CI 0.88 to 1.04', pValue: 'p=0.29' },
    secondaryEndpoints: [{ name: 'Mortality', result: '5% (20/432) vs 1% (5/454); adjusted HR 3.8, 95% CI 1.4-10.2, p=0.0085 — significant excess with tenecteplase' }],
    safetyFindings: { sich: 'Low in both arms', mortality: '5% vs 1%; adjusted HR 3.8, 95% CI 1.4-10.2, p=0.0085 — statistically significant excess with tenecteplase', other: '' },
    imagingCriteria: 'CTA — proven intracranial occlusion',
    applicabilityNotes: 'Thrombolysis did not improve outcomes in minor stroke with occlusion and showed a mortality signal — supports NOT routinely thrombolysing minor (NIHSS 0-5) non-disabling stroke on the basis of occlusion alone.',
    limitations: 'Applies to minor/non-disabling deficits; does not address disabling deficits with occlusion.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-tempo-2-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against routine thrombolysis for minor non-disabling stroke solely because an occlusion is present; keep the disabling-deficit gate.',
    lastReviewed: '2026-07-06',
    promotedDate: '2026-07-06',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'PubMed 38768626; DOI corrected to 10.1016/S0140-6736(24)00921-8. Verified 2026-07-06.'
  }),

  // ------------------- Anticoagulation after ICH in AF (dedicated evidence) -------------------
  // Totality of the randomized evidence, presented objectively: AVERROES/ARTESiA
  // (above) did NOT enrol ICH survivors; the trials below did.
  t({
    id: 'prestige-af',
    shortName: 'PRESTIGE-AF',
    fullName: 'Prevention of Stroke in Intracerebral Haemorrhage Survivors with Atrial Fibrillation',
    topic: 'af-after-ich',
    diseaseArea: ['ich', 'af-after-ich', 'secondary-prevention'],
    population: { n: 319, ageRange: 'median 79', nihssRange: 'n/a', timeWindow: 'Spontaneous ICH survivors with AF, mRS ≤4', keyInclusion: ['Spontaneous ICH survivor with AF and an anticoagulation indication'], keyExclusion: [] },
    intervention: 'DOAC (apixaban/dabigatran/edoxaban/rivaroxaban), n=158',
    comparator: 'No anticoagulation (antiplatelet permitted), n=161',
    primaryEndpoint: { definition: 'Coprimary: first ischaemic stroke (superiority) and first recurrent ICH (non-inferiority), ITT', timepoint: 'trial follow-up', result: 'Ischaemic stroke markedly reduced (0.83 vs 8.60 per 100 patient-years); recurrent ICH did NOT meet non-inferiority (5.00 vs 0.82 per 100 patient-years)', effectSize: 'ischaemic HR 0.05; recurrent-ICH HR 10.89', confidenceInterval: 'ischaemic 95% CI 0.01-0.36; ICH 90% CI 1.95-60.72', pValue: 'ischaemic p<0.0001; ICH non-inferiority not met' },
    secondaryEndpoints: [{ name: 'Death', result: '10% (DOAC) vs 13% (no anticoagulation)' }],
    safetyFindings: { sich: 'Recurrent ICH ~10-fold higher with DOAC', mortality: 'Numerically lower with DOAC (NS)', other: 'Serious adverse events 44% vs 55%' },
    imagingCriteria: '',
    applicabilityNotes: 'Dedicated ICH-survivor RCT: DOAC lowers ischaemic stroke but raises recurrent ICH; net benefit uncertain in a small trial with few events.',
    limitations: 'Small (n=319); wide CIs; source uses discordant CI conventions (95% for ischaemic HR, 90% for ICH HR).',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-prestige-af-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: anticoagulation after ICH in AF trades a large ischaemic-stroke reduction against a substantial recurrent-ICH increase; individualize.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'enrich-af',
    shortName: 'ENRICH-AF',
    fullName: 'Edoxaban for Intracranial Hemorrhage Survivors with Atrial Fibrillation',
    topic: 'af-after-ich',
    diseaseArea: ['ich', 'af-after-ich', 'secondary-prevention'],
    population: { n: 948, ageRange: '≥45', nihssRange: 'n/a', timeWindow: 'Intracranial-haemorrhage survivors with high-risk AF (CHA₂DS₂-VASc ≥2)', keyInclusion: ['Intracranial haemorrhage survivor with AF'], keyExclusion: [] },
    intervention: 'Edoxaban 60 mg (30 mg reduced-dose) daily',
    comparator: 'Non-anticoagulant therapy (none or antiplatelet)',
    primaryEndpoint: { definition: 'Coprimary: stroke/systemic embolism; ISTH major haemorrhage', timepoint: 'event-driven (primary completion 2026)', result: 'Full efficacy not yet reported; the lobar-ICH subgroup was stopped by the DSMB for excess recurrent haemorrhagic stroke', effectSize: '', confidenceInterval: '', pValue: '' },
    secondaryEndpoints: [],
    safetyFindings: { sich: 'Excess recurrent haemorrhagic stroke in the lobar-ICH (CAA-enriched) subgroup → edoxaban stopped in that subgroup', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Ongoing; the only reported result to date is a safety signal in lobar ICH. Do not infer net benefit from ENRICH-AF alone.',
    limitations: 'Primary efficacy pending (2026); lobar-arm-stopped subgroup details partly from secondary reporting.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-enrich-af-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: interim DSMB stopped edoxaban in lobar ICH for excess rebleeding; the main efficacy comparison is awaited.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'unverified-source-limited',
    verificationNotes: 'Design/NCT (NCT03950076) and lobar-arm-stopped safety signal verified; full primary efficacy result not yet published (expected 2026).'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    safetyFindings: { sich: '', mortality: 'Similar', other: 'Severe adverse events 41% (surgery) vs 44% (medical) — no excess with surgery' },
    imagingCriteria: '',
    applicabilityNotes: 'First RCT of decompressive craniectomy (without evacuation) for severe deep ICH — a distinct surgical modality from clot evacuation (ENRICH/MISTIE III).',
    limitations: 'Modest size (n=201); primary-outcome CI crossed the null.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-switch-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Objective: numerically fewer very-poor outcomes with craniectomy, but not statistically significant; no safety excess.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- BP after EVT: second confirmatory RCT -------------------
  t({
    id: 'optimal-bp',
    shortName: 'OPTIMAL-BP',
    fullName: 'Intensive vs Conventional Blood Pressure Lowering after Successful Endovascular Thrombectomy',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: { n: 306, ageRange: '≥18', nihssRange: 'all', timeWindow: 'After successful EVT (mTICI ≥2b)', keyInclusion: ['LVO stroke with successful reperfusion after EVT'], keyExclusion: [] },
    intervention: 'Intensive SBP <140 mmHg for 24 h (n=155)',
    comparator: 'Conventional SBP 140-180 mmHg for 24 h (n=150)',
    primaryEndpoint: { definition: 'Functional independence (mRS 0-2) at 3 months', timepoint: '90 d', result: 'Intensive worse: 39.4% vs 54.4%', effectSize: 'adjusted OR 0.56; risk difference -15.1%', confidenceInterval: 'OR 95% CI 0.33-0.96; RD 95% CI -26.2 to -3.9', pValue: 'p=0.03' },
    secondaryEndpoints: [{ name: 'Symptomatic ICH ≤36 h', result: '9.0% vs 8.1% (NS)' }],
    safetyFindings: { sich: 'No difference (9.0% vs 8.1%)', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Second RCT (with ENCHANTED2/MT) showing harm from intensive BP lowering after successful EVT; supports avoiding SBP <140.',
    limitations: 'Single-country (South Korea); open-label with blinded endpoints.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-optimal-bp-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Intensive SBP <140 after successful EVT reduced functional independence; reinforces ENCHANTED2/MT.',
    lastReviewed: '2026-07-18',
    verificationStatus: 'verified-pubmed'
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
      keyExclusion: ['Diagnosis already established as non-stroke']
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
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      { name: 'mRS 5 (severe disability) at 180 d', result: 'Higher with alteplase: 17% vs 9% (RR 1.99, 95% CI 1.22-3.26, p=0.007)' },
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
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'stich-2',
    shortName: 'STICH II',
    fullName: 'Early surgery versus initial conservative treatment in spontaneous supratentorial lobar intracerebral haematomas',
    topic: 'ich-surgery',
    diseaseArea: ['ich', 'ich-surgery'],
    population: {
      n: 601,
      ageRange: 'adults',
      nihssRange: 'conscious patients',
      timeWindow: '≤48 h from ictus; surgery within 12 h of randomization',
      keyInclusion: ['Superficial lobar ICH 10-100 mL', 'No intraventricular hemorrhage', 'Conscious'],
      keyExclusion: ['IVH present', 'Deep or infratentorial hematoma']
    },
    intervention: 'Early hematoma evacuation within 12 h plus medical therapy',
    comparator: 'Initial medical treatment alone',
    primaryEndpoint: {
      definition: 'Prognosis-based dichotomised Extended Glasgow Outcome Scale',
      timepoint: '6 months',
      result: 'Neutral: unfavourable in 59% vs 62%',
      effectSize: 'OR 0.86; absolute difference 3.7%',
      confidenceInterval: '95% CI 0.62 to 1.20 (absolute -4.3% to 11.6%)',
      pValue: 'p=0.367'
    },
    secondaryEndpoints: [{ name: 'Survival', result: 'Possible small survival advantage, not significant for the primary outcome' }],
    safetyFindings: { sich: '', mortality: 'Early surgery did not increase death or disability', other: '' },
    imagingCriteria: 'Lobar hematoma <1 cm from the cortical surface, no IVH',
    applicabilityNotes: 'Tested the subgroup STICH suggested might benefit — superficial lobar clots without IVH — and still found no significant benefit. Together with STICH they close the case for routine open craniotomy and motivate the minimally invasive era (MISTIE III, ENRICH).',
    limitations: 'Not masked; later evacuation permitted in the conservative arm; enrolled conscious patients only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-stich2-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Early open surgery for superficial lobar ICH without IVH is not beneficial; motivates minimally invasive approaches instead.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      keyInclusion: ['Acute aneurysmal SAH', 'Anemia during critical care'],
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
    applicabilityNotes: '23 centres; the largest transfusion-threshold trial in aSAH. Supports a restrictive threshold as the default, since liberal transfusion conferred no functional advantage at 12 months.',
    limitations: 'Confidence interval leaves a modest benefit statistically possible; anemia definition and transfusion practice varied by site.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-sahara-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A liberal (Hgb ≤10) transfusion threshold after aSAH did not improve 12-month outcome — restrictive transfusion remains reasonable.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ultra-sah',
    shortName: 'ULTRA',
    fullName: 'Ultra-Early Tranexamic Acid After Subarachnoid Haemorrhage',
    topic: 'sah-critical-care',
    diseaseArea: ['sah', 'sah-critical-care'],
    population: {
      n: 955,
      ageRange: 'adults',
      nihssRange: 'all grades',
      timeWindow: 'immediately after diagnosis, until aneurysm treatment or 24 h',
      keyInclusion: ['Spontaneous CT-proven SAH'],
      keyExclusion: []
    },
    intervention: 'Tranexamic acid 1 g bolus then 1 g every 8 h until aneurysm treatment or 24 h, plus usual care',
    comparator: 'Usual care alone',
    primaryEndpoint: {
      definition: 'Good clinical outcome (mRS 0-3) at 6 months',
      timepoint: '6 months',
      result: 'Neutral: 60% vs 64%',
      effectSize: 'adjusted OR 0.86',
      confidenceInterval: '95% CI 0.66 to 1.12',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [
      { name: 'Rebleeding before aneurysm treatment', result: '10% vs 14% (OR 0.71, 95% CI 0.48-1.04)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Serious adverse events comparable between groups' },
    imagingCriteria: 'CT-proven SAH',
    applicabilityNotes: 'Ultra-early antifibrinolysis did not improve outcome even though rebleeding trended lower — the reduction in rebleeding did not translate into function. Argues for prompt aneurysm securing rather than pharmacologic bridging.',
    limitations: 'Open-label (masked outcome assessment); short treatment duration by design.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-ultra-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Routine ultra-early tranexamic acid is not indicated in aSAH — prioritise early aneurysm securing instead.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'earlydrain',
    shortName: 'EARLYDRAIN',
    fullName: 'Effectiveness of Lumbar Cerebrospinal Fluid Drain Among Patients With Aneurysmal Subarachnoid Hemorrhage',
    topic: 'sah-critical-care',
    diseaseArea: ['sah', 'sah-critical-care'],
    population: {
      n: 287,
      ageRange: 'median 55 (IQR 48-63); 68.6% female',
      nihssRange: 'all clinical grades',
      timeWindow: 'lumbar drain started within 72 h of SAH, after aneurysm securing within 48 h',
      keyInclusion: ['Acute aneurysmal SAH', 'Aneurysm treated by clipping or coiling within 48 h'],
      keyExclusion: []
    },
    intervention: 'Additional early lumbar drain at 5 mL/h plus standard care',
    comparator: 'Standard of care alone',
    primaryEndpoint: {
      definition: 'Unfavorable outcome (mRS 3-6) at 6 months',
      timepoint: '6 months',
      result: 'Favors lumbar drain: 32.6% vs 44.8%',
      effectSize: 'RR 0.73; absolute risk difference -0.12',
      confidenceInterval: '95% CI 0.52 to 0.98 (absolute -0.23 to -0.01)',
      pValue: 'p=0.04'
    },
    secondaryEndpoints: [
      { name: 'Secondary infarction at discharge', result: '28.5% vs 39.9% (RR 0.71, 95% CI 0.49-0.99, p=0.04)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'One of the few positive interventions in aSAH critical care — prophylactic lumbar CSF drainage reduced both delayed infarction and 6-month disability. 19 centres in Germany, Switzerland and Canada.',
    limitations: 'Open-label with blinded endpoint assessment; modest sample (287 analysable of 307 randomized) and a p-value close to 0.05; requires the aneurysm to be secured first.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-earlydrain-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Prophylactic early lumbar drainage after aneurysm securing reduced secondary infarction and unfavorable 6-month outcome.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      definition: 'Death and independence at 10 years',
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
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'IVT-eligible',
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
    applicabilityNotes: 'Conducted entirely in China, with an alteplase excellent-outcome rate (70.4%) far above Western trials — a signal of a milder population that limits transportability. The 2026 AHA/ASA AIS guideline notes benefit alongside limited generalizability, so reteplase is an evidence-watch item rather than a protocol substitution.',
    limitations: 'Single-country; open-label; higher rates of any ICH and adverse events; unusually high control-arm outcomes.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-raise-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reteplase beat alteplase for mRS 0-1 within 4.5 h but with more ICH overall; not a default agent outside the trial setting.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS ≤5, with ≤1 point on key single items (median 2)',
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
    limitations: 'Open-label; conducted at 38 Chinese hospitals; very high event-free rates in both arms leave little room to separate them; excludes patients with LVO intended for EVT.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aramis-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'For genuinely non-disabling minor stroke within 4.5 h, DAPT is a reasonable alternative to IV thrombolysis.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: '35 hospitals in eight countries — the broadest geographic base of any TNK trial, and the only one selecting on perfusion mismatch. Recruitment stopped early once other trials reported non-inferiority, which left it underpowered; read it as supporting evidence rather than an independent verdict.',
    limitations: 'Stopped early (680 of a planned 832); open-label; non-inferiority met only per-protocol, not in ITT.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-taste-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds perfusion-selected, multi-country support for TNK 0.25 mg/kg, and shows large-scale CTP-guided IVT selection is feasible.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    certainty: 'high',
    evidenceType: 'observational',
    citationIds: ['cit-best-msu-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Mobile stroke units improved 90-day disability outcomes vs standard EMS, via faster and more complete thrombolysis delivery.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'racecat',
    shortName: 'RACECAT',
    fullName: 'Direct Transportation to a Thrombectomy-Capable Center vs Local Stroke Center in Suspected Large-Vessel Occlusion in Nonurban Areas',
    topic: 'prehospital-stroke-care',
    diseaseArea: ['acute-ischemic-stroke', 'prehospital-stroke-care', 'evt-late-window'],
    population: {
      n: 1401,
      ageRange: 'median 75 (IQR 65-83); 56% men',
      nihssRange: 'median NIHSS 17 (IQR 11-21)',
      timeWindow: 'prehospital, nonurban Catalonia',
      keyInclusion: ['Suspected large-vessel occlusion by EMS in an area whose closest stroke centre cannot perform thrombectomy'],
      keyExclusion: []
    },
    intervention: 'Direct transport to a thrombectomy-capable centre (mothership)',
    comparator: 'Transport to the closest local stroke centre (drip-and-ship)',
    primaryEndpoint: {
      definition: '90-day mRS in the target ischemic-stroke population (n=949)',
      timepoint: '90 d',
      result: 'Neutral: median mRS 3 in both arms',
      effectSize: 'adjusted common OR 1.03',
      confidenceInterval: '95% CI 0.82 to 1.29',
      pValue: 'Not significant; halted for futility'
    },
    secondaryEndpoints: [
      { name: 'IV thrombolysis received', result: 'Lower with direct transport: 47.5% vs 60.4% (OR 0.59, 95% CI 0.45-0.76)' },
      { name: 'Thrombectomy received', result: 'Higher with direct transport: 48.8% vs 39.4% (OR 1.46, 95% CI 1.13-1.89)' },
      { name: '90-day mortality (safety population)', result: '27.3% vs 27.2% (aHR 0.97, 95% CI 0.79-1.18)' }
    ],
    safetyFindings: { sich: '', mortality: 'No difference', other: '' },
    imagingCriteria: 'RACE scale used for prehospital LVO suspicion',
    applicabilityNotes: 'The clearest statement of the mothership-versus-drip-and-ship trade-off: bypassing the local centre bought more thrombectomy but cost thrombolysis, and the two cancelled out. Cluster-randomized in nonurban Catalonia; transport times and network maturity elsewhere may tip the balance either way, so it should not be generalised uncritically.',
    limitations: 'Cluster randomization by geographic area; stopped for futility at the second interim analysis; single region; findings explicitly require replication.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-racecat-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In nonurban areas, direct transport to a thrombectomy centre did not improve 90-day outcome versus the nearest stroke centre.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS ≥2',
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
    applicabilityNotes: 'Extends late-window EVT beyond the DAWN/DEFUSE-3 perfusion paradigm: patients selected on CTA collaterals alone benefited, and these were patients who did NOT meet perfusion criteria. Practically, this means a centre without CT perfusion can still select late-window candidates. Weigh against a roughly four-fold increase in symptomatic hemorrhage.',
    limitations: 'Open-label with blinded endpoints; single-country (18 Dutch centres); guideline-eligible patients were excluded, so this is a distinct, more marginal population.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-mrclean-late-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'CTA collateral status alone can select late-window (6-24 h) EVT candidates who fall outside DAWN/DEFUSE-3 perfusion criteria.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- Antiplatelets after ICH -------------------
  t({
    id: 'restart',
    shortName: 'RESTART',
    fullName: 'REstart or STop Antithrombotics Randomised Trial — antiplatelet therapy after intracerebral haemorrhage',
    topic: 'ich-secondary-prevention',
    diseaseArea: ['ich', 'ich-secondary-prevention', 'secondary-prevention'],
    population: {
      n: 537,
      ageRange: '≥18',
      nihssRange: 'ICH survivors',
      timeWindow: 'randomized a median of 76 days (IQR 29-146) after ICH; followed up to 5 years',
      keyInclusion: ['Taking antithrombotic therapy for occlusive vascular disease when ICH occurred', 'Antithrombotic therapy discontinued', 'Survived 24 h'],
      keyExclusion: []
    },
    intervention: 'Start antiplatelet therapy',
    comparator: 'Avoid antiplatelet therapy',
    primaryEndpoint: {
      definition: 'Recurrent symptomatic intracerebral hemorrhage',
      timepoint: 'median 2.0 y (IQR 1.0-3.0)',
      result: 'Fewer recurrences with antiplatelet therapy: 4% (12/268) vs 9% (23/268)',
      effectSize: 'adjusted HR 0.51',
      confidenceInterval: '95% CI 0.25 to 1.03',
      pValue: 'p=0.060'
    },
    secondaryEndpoints: [
      { name: 'Major hemorrhagic events', result: '7% vs 9% (aHR 0.71, 95% CI 0.39-1.30, p=0.27)' },
      { name: 'Major occlusive vascular events', result: '15% vs 14% (aHR 1.02, 95% CI 0.65-1.60, p=0.92)' }
    ],
    safetyFindings: { sich: 'Recurrent ICH numerically LOWER on antiplatelet therapy', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'Reframes a common fear: restarting an antiplatelet after ICH did not increase recurrent hemorrhage, and the point estimate favoured restarting. The trial excludes all but a very modest increase in risk, so for a patient with a clear antiplatelet indication the established secondary-prevention benefit likely dominates. 122 UK hospitals.',
    limitations: 'Open-label; modest size and event numbers; median 76-day delay to randomization means very early restart is untested; underpowered for occlusive-event benefit.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-restart-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Restarting antiplatelet therapy after ICH did not raise recurrent hemorrhage; the risk is likely outweighed by secondary-prevention benefit.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'noah-afnet6',
    shortName: 'NOAH-AFNET 6',
    fullName: 'Anticoagulation with Edoxaban in Patients with Atrial High-Rate Episodes',
    topic: 'subclinical-af',
    diseaseArea: ['secondary-prevention', 'subclinical-af'],
    population: {
      n: 2536,
      ageRange: 'mean 78; 37.4% women',
      nihssRange: 'device-detected atrial high-rate episodes ≥6 min, median duration 2.8 h',
      timeWindow: 'median follow-up 21 months (terminated early)',
      keyInclusion: ['Age ≥65', 'AHRE ≥6 minutes on an implanted device', '≥1 additional stroke risk factor'],
      keyExclusion: ['ECG-documented atrial fibrillation']
    },
    intervention: 'Edoxaban',
    comparator: 'Placebo',
    primaryEndpoint: {
      definition: 'Composite of cardiovascular death, stroke, or systemic embolism',
      timepoint: 'median 21 months',
      result: 'Neutral: 3.2%/patient-year vs 4.0%/patient-year',
      effectSize: 'HR 0.81',
      confidenceInterval: '95% CI 0.60 to 1.08',
      pValue: 'p=0.15'
    },
    secondaryEndpoints: [
      { name: 'Stroke incidence', result: 'Approximately 1% per patient-year in BOTH groups — far lower than in clinical AF' },
      { name: 'Progression to ECG-diagnosed AF', result: '18.2% overall (8.7% per patient-year)' }
    ],
    safetyFindings: {
      sich: '',
      mortality: '',
      other: 'Composite of death or major bleeding INCREASED with edoxaban: 5.9%/patient-year vs 4.5%/patient-year (HR 1.31, 95% CI 1.02-1.67, p=0.03)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The decisive number is the ~1%/year stroke rate in BOTH arms: device-detected atrial high-rate episodes carry far less thromboembolic risk than ECG-documented AF, leaving no margin for anticoagulation to help before bleeding harm appears. Read alongside ARTESiA, which used a lower-bleeding agent (apixaban) and found a small stroke reduction — together they define a narrow, individualised decision rather than a blanket policy.',
    limitations: 'Terminated early for safety and informal futility; median AHRE duration only 2.8 h; elderly population with competing bleeding risk.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-noah-afnet6-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Edoxaban for device-detected AHRE did not reduce cardiovascular events and increased death or major bleeding; stroke risk was ~1%/year untreated.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      timeWindow: 'restricted mean survival analysis over ~4.6 years',
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
    limitations: 'Higher discontinuation in the rivaroxaban arm may have contributed; non-proportional hazards required restricted-mean-survival analysis; open questions remain about DOACs in other valvular lesions.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-invictus-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Use warfarin, not a DOAC, for AF with rheumatic mitral valve disease — rivaroxaban had worse cardiovascular outcomes and higher mortality.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'chance-3',
    shortName: 'CHANCE-3',
    fullName: 'Colchicine in Patients with Acute Ischaemic Stroke or Transient Ischaemic Attack',
    topic: 'inflammation-stroke-prevention',
    diseaseArea: ['secondary-prevention', 'inflammation-stroke-prevention'],
    population: {
      n: 8343,
      ageRange: '≥40',
      nihssRange: 'minor-to-moderate ischemic stroke or TIA',
      timeWindow: 'randomized within 24 h of onset; treated 90 days',
      keyInclusion: ['High-risk non-cardioembolic minor-to-moderate ischemic stroke or TIA', 'hs-CRP ≥2 mg/L'],
      keyExclusion: ['Cardioembolic source']
    },
    intervention: 'Colchicine 0.5 mg twice daily days 1-3, then 0.5 mg daily to day 90',
    comparator: 'Placebo',
    primaryEndpoint: {
      definition: 'Any new stroke within 90 days',
      timepoint: '90 d',
      result: 'Neutral: 6.3% vs 6.5%',
      effectSize: 'HR 0.98',
      confidenceInterval: '95% CI 0.83 to 1.16',
      pValue: 'p=0.79'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: 'Serious adverse events 2.2% vs 2.1% (p=0.83)' },
    imagingCriteria: '',
    applicabilityNotes: 'Large, double-blind, and enriched for inflammation (hs-CRP ≥2 mg/L required) — the design most likely to show a colchicine effect if one existed in the first 90 days. It did not. Together with CONVINCE, short-term anti-inflammatory therapy after minor stroke lacks support; any remaining hope rests on longer treatment in atherosclerotic phenotypes.',
    limitations: '244 Chinese hospitals; 90-day treatment may be too short for an atherosclerosis-modifying effect; minor-to-moderate severity only.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-chance3-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Ninety days of colchicine after minor stroke/TIA with raised hs-CRP did not reduce recurrent stroke.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS ≥5 with at least one moderately-to-severely weak limb',
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
    relatedActiveTrialIds: ['most'],
    practiceImpact: 'IV tirofiban improved 90-day excellent outcome in non-occlusive, often progressive stroke, with inconsistent secondary endpoints.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- LAAO after ablation -------------------
  t({
    id: 'option-laao',
    shortName: 'OPTION',
    fullName: 'Left Atrial Appendage Closure after Ablation for Atrial Fibrillation',
    topic: 'laa-occlusion',
    diseaseArea: ['secondary-prevention', 'laa-occlusion'],
    population: {
      n: 1600,
      ageRange: 'mean 69.6 ± 7.7; 34.1% women',
      nihssRange: 'CHA₂DS₂-VASc ≥2 in men, ≥3 in women (mean 3.5 ± 1.3)',
      timeWindow: '36 months',
      keyInclusion: ['Atrial fibrillation undergoing catheter ablation', 'Elevated CHA₂DS₂-VASc'],
      keyExclusion: []
    },
    intervention: 'Left atrial appendage closure',
    comparator: 'Oral anticoagulation',
    primaryEndpoint: {
      definition: 'Safety: non-procedure-related major or clinically relevant non-major bleeding (superiority). Efficacy: death, stroke, or systemic embolism at 36 months (non-inferiority)',
      timepoint: '36 months',
      result: 'Safety superior — 8.5% vs 18.1%; efficacy non-inferior — 5.3% vs 5.8%',
      effectSize: 'Bleeding roughly halved; efficacy composite similar',
      confidenceInterval: '',
      pValue: 'p<0.001 for safety superiority; p<0.001 for efficacy non-inferiority'
    },
    secondaryEndpoints: [
      { name: 'Major bleeding including procedure-related, to 36 mo', result: '3.9% vs 5.0% (p<0.001 for non-inferiority)' },
      { name: 'Device- or procedure-related complications', result: '23 patients' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Device/procedure complications in 23 of 803 recipients' },
    imagingCriteria: '',
    applicabilityNotes: 'Unlike LAAOS III (occlusion ADDED to anticoagulation during cardiac surgery), OPTION tests percutaneous closure as a REPLACEMENT for anticoagulation after AF ablation — and it held up, with about half the bleeding. Scope is specifically the post-ablation population; it does not generalise to AF patients who have not been ablated.',
    limitations: 'Industry-funded; open-label by necessity; restricted to patients undergoing ablation; 36-month horizon leaves longer-term device outcomes unresolved.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-option-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'After AF ablation, LAA closure was non-inferior to anticoagulation for death/stroke/embolism with about half the non-procedural bleeding.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),

  // ------------------- Factor XI inhibition in AF -------------------
  t({
    id: 'oceanic-af',
    shortName: 'OCEANIC-AF',
    fullName: 'Asundexian versus Apixaban in Patients with Atrial Fibrillation',
    topic: 'factor-xi-inhibition',
    diseaseArea: ['secondary-prevention', 'factor-xi-inhibition'],
    population: {
      n: 14810,
      ageRange: 'mean 73.9 ± 7.7; 35.2% women',
      nihssRange: 'mean CHA₂DS₂-VASc 4.3 ± 1.3; 18.2% prior stroke or TIA',
      timeWindow: 'stopped prematurely on DMC recommendation',
      keyInclusion: ['High-risk atrial fibrillation'],
      keyExclusion: []
    },
    intervention: 'Asundexian 50 mg once daily',
    comparator: 'Standard-dose apixaban',
    primaryEndpoint: {
      definition: 'Stroke or systemic embolism (non-inferiority)',
      timepoint: 'until premature termination',
      result: 'Asundexian markedly WORSE: 1.3% (98 patients) vs 0.4% (26 patients)',
      effectSize: 'HR 3.79',
      confidenceInterval: '95% CI 2.46 to 5.83',
      pValue: 'Non-inferiority not met; trial stopped'
    },
    secondaryEndpoints: [
      { name: 'Major bleeding', result: 'Lower with asundexian: 0.2% (17) vs 0.7% (53) (HR 0.32, 95% CI 0.18-0.55)' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Overall adverse-event incidence similar' },
    imagingCriteria: '',
    applicabilityNotes: 'The essential counterweight to OCEANIC-STROKE. Asundexian is effective as an ADD-ON to antiplatelet therapy in non-cardioembolic stroke, but it is a poor SUBSTITUTE for a DOAC in atrial fibrillation — nearly four-fold more thromboembolism than apixaban. Factor XIa inhibition does not replace guideline anticoagulation for AF, however favourable its bleeding profile.',
    limitations: 'Stopped early, so absolute event rates are low and follow-up short; tested a single asundexian dose.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-oceanic-af-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Asundexian is inferior to apixaban for AF stroke prevention (HR 3.79) despite less bleeding — do not substitute it for a DOAC.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      { name: 'Periprocedural (day 0-44) events, stenting trial', result: 'No strokes or deaths in the medical-therapy group over that window' }
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
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed',
    verificationNotes: 'Print citation N Engl J Med 2026;394(3):219-231 (PMID 41269206); published online 2025-11-21 at AHA Scientific Sessions. Year follows the repo convention of citing the print issue.'
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
      effectSize: 'Win-ratio analysis',
      confidenceInterval: '',
      pValue: 'Interim analysis'
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
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      result: 'No significant difference between stenting and medical therapy',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [
      { name: 'Stroke in qualifying territory at 2 and 3 years', result: 'No significant difference' },
      { name: 'Mortality at 3 years', result: 'No significant difference' }
    ],
    safetyFindings: { sich: '', mortality: 'No significant difference at 3 years', other: '' },
    imagingCriteria: 'Angiographic stenosis 70-99% of a major intracranial artery',
    applicabilityNotes: 'Designed to give stenting its best chance after SAMMPRIS — experienced operators, refined selection, and a deliberate 3-week cooling-off period excluding the hyperacute phase where SAMMPRIS saw most periprocedural harm. Even so, stenting added nothing. 8 Chinese centres.',
    limitations: 'Smaller than SAMMPRIS and underpowered for modest differences; excluded perforator-territory events, so results do not apply to that common phenotype; single-country.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-cassiss-2022'],
    relatedActiveTrialIds: ['captiva'],
    practiceImpact: 'Intracranial stenting added no benefit over medical therapy for symptomatic 70-99% stenosis, even with refined selection and experienced operators.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'cmoss',
    shortName: 'CMOSS',
    fullName: 'Extracranial-Intracranial Bypass and Risk of Stroke and Death in Patients With Symptomatic Artery Occlusion',
    topic: 'ec-ic-bypass',
    diseaseArea: ['secondary-prevention', 'icas-prevention', 'ec-ic-bypass'],
    population: {
      n: 324,
      ageRange: 'median 52.7; 79.3% men',
      nihssRange: 'TIA or non-disabling ischemic stroke attributed to hemodynamic insufficiency',
      timeWindow: '2 years',
      keyInclusion: ['ICA or MCA occlusion', 'Hemodynamic insufficiency on CT perfusion'],
      keyExclusion: []
    },
    intervention: 'EC-IC bypass surgery plus medical therapy',
    comparator: 'Medical therapy alone',
    primaryEndpoint: {
      definition: 'Stroke or death within 30 days, or ipsilateral ischemic stroke from 30 days to 2 years',
      timepoint: '2 years',
      result: 'Neutral: 8.6% (13/151) vs 12.3% (19/155)',
      effectSize: 'Incidence difference -3.6%',
      confidenceInterval: '95% CI -10.1% to 2.9%',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'CT perfusion evidence of hemodynamic insufficiency required for entry',
    applicabilityNotes: 'The modern re-test of the 1985 EC-IC Bypass Study, with perfusion-based selection and contemporary technique, and it reached the same conclusion. 13 Chinese centres, notably young patients (median 52.7 years).',
    limitations: 'Open-label; modest size with wide confidence interval; single-country; hemodynamic selection by CT perfusion is not standardised across centres.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-cmoss-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'EC-IC bypass for symptomatic ICA/MCA occlusion with hemodynamic insufficiency showed no benefit over medical therapy at 2 years.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    limitations: 'Open-label with blinded outcomes; conducted entirely in China; office rather than ambulatory BP; achieved separation (119 vs 135) is narrower than the nominal targets.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-esprit-bp-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'An SBP target <120 reduced major vascular events versus <140, with consistent benefit in patients with diabetes and prior stroke.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'Included here because it is the largest and most decisive colchicine cardiovascular trial, and stroke was a component of its primary endpoint. Read with CONVINCE and CHANCE-3: across coronary and cerebrovascular populations, colchicine reliably lowers CRP and reliably fails to change events — which weakens the inflammatory hypothesis as a treatment target rather than merely leaving it unproven.',
    limitations: 'Cardiac rather than stroke population; factorial design with spironolactone; stroke was only one component of the composite.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-clear-synergy-colchicine-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Colchicine after MI did not reduce cardiovascular events despite lowering CRP — consistent with the neutral stroke trials.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      result: 'Trial STOPPED EARLY for slow COVID-era enrolment before the planned sample was reached',
      effectSize: 'See publication — underpowered by early termination',
      confidenceInterval: '',
      pValue: ''
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
    practiceImpact: 'IV glibenclamide for large hemispheric infarction remains unproven — CHARM was halted early and underpowered.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      result: 'Fever burden markedly reduced — prevention is achievable',
      effectSize: '',
      confidenceInterval: '',
      pValue: ''
    },
    secondaryEndpoints: [
      { name: '3-month mRS shift (principal secondary)', result: 'FUTILE — enrolment stopped at a planned interim analysis for futility on this endpoint' }
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
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'setpoint2',
    shortName: 'SETPOINT2',
    fullName: 'Early vs Standard Approach to Tracheostomy in Severe Stroke Receiving Mechanical Ventilation',
    topic: 'neurocritical-care',
    diseaseArea: ['neurocritical-care', 'acute-ischemic-stroke', 'ich'],
    population: {
      n: 382,
      ageRange: 'median 59; 49.8% women',
      nihssRange: 'severe acute ischemic or hemorrhagic stroke requiring invasive ventilation',
      timeWindow: '6-month outcome',
      keyInclusion: ['Severe stroke on invasive mechanical ventilation', '26 US and German neurocritical care centres'],
      keyExclusion: []
    },
    intervention: 'Early tracheostomy within 5 days of intubation (performed in 95.2%, median day 4)',
    comparator: 'Ongoing weaning with standard tracheostomy from day 10 if needed (performed in 67%, median day 11)',
    primaryEndpoint: {
      definition: 'mRS 0-4 (no to moderately severe disability) versus 5-6 at 6 months',
      timepoint: '6 months',
      result: 'No significant benefit from early tracheostomy',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'Not significant'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: '',
    applicabilityNotes: 'A third of the standard-care group never needed a tracheostomy at all — the strongest argument against routine early tracheostomy, since early commitment means performing the procedure on patients who would have been extubated. Note the dichotomy used (mRS 0-4 vs 5-6) sets a low functional bar.',
    limitations: 'Open-label; modest size; the unusual mRS 0-4 vs 5-6 dichotomy limits comparability with trials using conventional cut-points.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-setpoint2-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Early (<=5 day) tracheostomy did not improve 6-month outcome in ventilated severe stroke; a third of controls avoided tracheostomy entirely.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      result: 'Favors paired VNS',
      effectSize: 'See publication',
      confidenceInterval: '',
      pValue: 'Met'
    },
    secondaryEndpoints: [
      { name: 'FMA-UE response rate at 90 days after in-clinic therapy', result: 'Higher with paired VNS' }
    ],
    safetyFindings: { sich: '', mortality: '', other: 'Implant-related risks apply to both arms since all participants were implanted' },
    imagingCriteria: '',
    applicabilityNotes: 'Triple-blind and sham-controlled with every participant implanted, which controls for the implant procedure itself — an unusually rigorous design for a device trial. The population is deliberately chronic (>=9 months), where spontaneous recovery has plateaued, so the gain is attributable to the pairing rather than natural history. FDA-cleared on this basis.',
    limitations: 'Small (n=108); requires surgical implantation and intensive paired therapy, limiting scalability; impairment (Fugl-Meyer) rather than a patient-centred activity endpoint.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-vns-rehab-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Paired vagus nerve stimulation improved chronic post-stroke upper-limb impairment versus sham in a rigorous implanted-control design.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      result: 'No benefit — HALTED after the first interim analysis for futility',
      effectSize: '',
      confidenceInterval: '',
      pValue: 'Futility'
    },
    secondaryEndpoints: [],
    safetyFindings: { sich: '', mortality: '', other: '' },
    imagingCriteria: 'Radiologically confirmed CVT',
    applicabilityNotes: 'The only randomized trial of endovascular therapy in CVT, and it stopped early for futility. It is small (67 patients), so it does not exclude benefit in the most severe presentations — but it removes any basis for routine EVT in CVT, which is how the 2024 AHA CVT statement treats it. Anticoagulation remains first-line.',
    limitations: 'Very small; halted at first interim analysis; heterogeneous endovascular techniques pooled; 8 hospitals across 3 countries.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-to-act-2020'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Endovascular therapy for severe CVT showed no benefit and was halted for futility — anticoagulation remains first-line.',
    lastReviewed: '2026-08-15',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'moderate-severe (proximal occlusion)',
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
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'Extended enrolment to 12 h using collateral-based imaging selection; one of the two 2015 trials to show a mortality reduction.',
    limitations: 'Stopped early (n=316); open-label.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-escape-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Confirmed EVT benefit with imaging-selected small core and good collaterals up to 12 h, with reduced mortality.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The cleanest bridging-therapy design of the 2015 set: every patient received IV t-PA, isolating the added value of stent-retriever EVT.',
    limitations: 'Stopped early (n=196); industry-funded.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-swift-prime-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Confirmed stent-retriever EVT within 6 h on top of IV t-PA markedly increases functional independence.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    practiceImpact: 'rFVIIa has no role in spontaneous ICH even at ≤2 h: no functional benefit, more thrombotic harm.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
      timeWindow: 'early (protocol ≤24 h of randomization eligibility)',
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
    applicabilityNotes: 'Stopped after 38 patients for slow recruitment; by design contributed to the prospective pooled analysis with DESTINY and HAMLET that established hemicraniectomy for patients ≤60.',
    limitations: 'Very small; stopped early; primary endpoint not significant on its own.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-decimal-2007'],
    relatedActiveTrialIds: [],
    practiceImpact: 'One of the three European trials whose pooled analysis made early hemicraniectomy standard for malignant MCA infarction in younger patients.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'Terminated after 32 patients when the steering committee opted into the prospective joint analysis of the three European hemicraniectomy trials rather than enrolling the recalculated 188.',
    limitations: 'Very small; primary functional endpoint underpowered.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-destiny-2007'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Demonstrated the survival benefit of hemicraniectomy in malignant MCA infarction; functional benefit established in the pooled analysis.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The single-arm registration study behind andexanet approval. No comparator — the randomized evidence in ICH specifically is ANNEXA-I, which sits alongside this record.',
    limitations: 'Single-arm; efficacy population restricted to confirmed major bleeding with baseline anti-Xa ≥75 ng/mL; thrombotic-risk trade-off unquantified without control.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-annexa4-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Established andexanet reverses anti-Xa activity with 82% good hemostasis, at a 10% 30-day thrombotic event rate.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
    practiceImpact: 'DOACs perform like warfarin for CVT recurrence and recanalization with less major bleeding — a reasonable first-line option.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'basics',
    shortName: 'BASICS',
    fullName: 'Endovascular Therapy for Stroke Due to Basilar-Artery Occlusion',
    topic: 'evt-basilar',
    diseaseArea: ['acute-ischemic-stroke', 'evt-basilar'],
    population: {
      n: 300,
      ageRange: 'adults',
      nihssRange: 'basilar-artery occlusion',
      timeWindow: '≤6 h from estimated onset',
      keyInclusion: ['Basilar-artery occlusion', 'IV thrombolysis used in ~79% of both groups'],
      keyExclusion: []
    },
    intervention: 'Endovascular therapy (n=154; started median 4.4 h after onset)',
    comparator: 'Standard medical care (n=146)',
    primaryEndpoint: {
      definition: 'Favorable functional outcome (mRS 0-3) at 90 d',
      timepoint: '90 d',
      result: 'NOT significant: 44.2% vs 37.7%',
      effectSize: 'RR 1.18',
      confidenceInterval: '95% CI 0.92 to 1.50',
      pValue: ''
    },
    secondaryEndpoints: [{ name: '90-day mortality', result: '38.3% vs 43.2% (RR 0.87, 0.68-1.12)' }],
    safetyFindings: { sich: '4.5% vs 0.7% (RR 6.9, 95% CI 0.9-53.0)', mortality: '38.3% vs 43.2%', other: '' },
    imagingCriteria: 'Confirmed basilar-artery occlusion',
    applicabilityNotes: 'Neutral but with a wide CI that the authors stated may not exclude substantial benefit — the question was answered by the later positive ATTENTION and BAOCHE trials, which used higher-severity selection. Distinct from BASIS (balloon angioplasty for ICAS, JAMA 2024).',
    limitations: 'High thrombolysis rate in the medical arm; broad severity range diluted effect; slow 8-year enrolment.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-basics-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'First basilar EVT RCT — neutral, but set up the severity-selected trials that later proved benefit.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'axiomatic-ssp',
    shortName: 'AXIOMATIC-SSP',
    fullName: 'Safety and Efficacy of Factor XIa Inhibition with Milvexian for Secondary Stroke Prevention',
    topic: 'factor-xi-inhibition',
    diseaseArea: ['secondary-prevention', 'factor-xi-inhibition'],
    population: {
      n: 2366,
      ageRange: 'adults',
      nihssRange: 'acute ischaemic stroke or high-risk TIA',
      timeWindow: '90-day treatment period',
      keyInclusion: ['All participants on clopidogrel (21 d) + aspirin (90 d) background', 'Phase 2 dose-finding: milvexian 25 mg QD; 25, 50, 100, 200 mg BID vs placebo'],
      keyExclusion: []
    },
    intervention: 'Milvexian (five dose arms) + DAPT background',
    comparator: 'Placebo + DAPT background',
    primaryEndpoint: {
      definition: 'Composite of symptomatic ischaemic stroke or covert brain infarct on MRI at 90 d',
      timepoint: '90 d',
      result: 'NEUTRAL: placebo 16.8% vs milvexian arms 15.3-16.7%; no significant dose-response',
      effectSize: 'Model-based RR vs placebo 0.91-0.99 across doses',
      confidenceInterval: '',
      pValue: 'No dose-response'
    },
    secondaryEndpoints: [{ name: 'Major bleeding', result: '1-2% across arms, no dose-response' }],
    safetyFindings: { sich: '', mortality: '', other: 'No meaningful bleeding increase on top of DAPT' },
    imagingCriteria: 'MRI for covert infarct component of composite',
    applicabilityNotes: 'Neutral phase-2 primary endpoint that nevertheless informed the phase-3 LIBREXIA-STROKE design (milvexian 25 mg BID) — the covert-infarct-heavy composite likely blunted sensitivity. Class context: PACIFIC-Stroke (asundexian phase 2) was similarly neutral before OCEANIC-STROKE turned positive.',
    limitations: 'Phase 2; composite dominated by covert MRI infarcts; not powered for clinical stroke.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-axiomatic-ssp-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Milvexian added to DAPT showed no efficacy signal but also no bleeding excess — groundwork for phase 3.',
    lastReviewed: '2026-08-22',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'not restricted by protocol NIHSS band (anterior-circulation LVO)',
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
    imagingCriteria: 'Angiographic selection only — randomization occurred after thrombectomy achieved eTICI ≥2b50; no perfusion or core-volume gate for the adjunct',
    applicabilityNotes: 'PEARL is the largest anterior-circulation replication of the CHOICE hypothesis and uses the identical alteplase dose (0.225 mg/kg, capped at 20 mg) as CHOICE-2. Read the three anterior-circulation alteplase trials as one line of evidence (CHOICE n=121, CHOICE-2 n=440, PEARL n=324) and note that the excellent-outcome benefit reproduces across all three while a numerically higher mortality appears in both of the larger two. All 28 sites were in China, so the finding has not yet been reproduced outside a predominantly East Asian population, and it does not extend to the posterior circulation, where IAT-TOP was neutral.',
    limitations: 'Single-country (China) trial; randomization was not blinded to the interventionalist; the mortality and any-ICH signals are numerically adverse and the trial was not powered to exclude a mortality harm of the observed size; no placebo infusion in the control arm; the benefit rests on a single dichotomized endpoint.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-pearl-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Strengthens, but does not settle, the case for adjunctive IA alteplase 0.225 mg/kg after successful anterior-circulation thrombectomy; the accompanying numerically higher mortality means it remains an unadopted, guideline-unclassed adjunct rather than a standard step.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    imagingCriteria: 'Angiographic selection only — randomization after EVT achieved eTICI 2b-3; late-window entry (4.5-24 h) per site standard imaging',
    applicabilityNotes: 'This is the tenecteplase counterpart to CHOICE/CHOICE-2/PEARL, and the only IA-adjunct trial restricted to the late window (4.5-24 h). Its internal inconsistency is the teaching point: a positive primary endpoint with zero of seven prespecified secondary efficacy endpoints agreeing is weak internal replication, and the investigators themselves call for confirmatory trials. Note the direct tension with the phase 1b/2a IA tenecteplase dose-escalation trial, in which the same 0.125 mg/kg tier crossed a prespecified sICH safety threshold (3 of 12 patients, P=.04) and was not carried into the randomized expansion.',
    limitations: 'Open-label with blinded endpoint assessment; single-country (China); modest size (n=256); no secondary efficacy endpoint corroborated the primary, raising the possibility of a chance finding on a single dichotomized outcome; safety confidence intervals are wide.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-angel-tnk-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Extends the adjunctive-lysis hypothesis to intra-arterial tenecteplase in the late window, but a positive primary with no supporting secondary endpoint is not a basis to adopt it; it remains investigational with no guideline class.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'not restricted by a protocol NIHSS band (acute basilar artery occlusion)',
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
    imagingCriteria: 'Angiographic selection only — randomization after thrombectomy achieved successful recanalization of the basilar artery',
    applicabilityNotes: 'This is the counterweight record for the IA-adjunct category and it must not be softened: in the posterior circulation the result was NEUTRAL, with the point estimate numerically favoring no intra-arterial lytic (41.9% vs 46.7%, adjusted RR 0.93). The correct teaching is a territory dissociation, not a failed drug — the same 0.225 mg/kg alteplase dose that improved excellent outcome in the anterior circulation (CHOICE, CHOICE-2, PEARL) produced no functional benefit after successful basilar recanalization. Basilar occlusion also carries a much higher baseline mortality (about 27-30% in both arms here) than the anterior-circulation trials, which changes both the outcome distribution and the plausible mechanism of benefit.',
    limitations: 'PROBE (open-label, blinded-endpoint) design; single-country (China); powered for a difference larger than any that was observed, so a small benefit or small harm cannot be excluded; used mRS 0-2 rather than the mRS 0-1 endpoint used by the anterior-circulation trials, which limits head-to-head comparison of effect sizes.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-iat-top-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against extrapolating adjunctive intra-arterial alteplase from the anterior circulation to basilar occlusion — after successful basilar recanalization it was safe but produced no functional gain.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ia-tenecteplase-dose-escalation',
    shortName: 'IA Tenecteplase Dose-Escalation Trial',
    fullName: 'Intra-Arterial Tenecteplase After Successful Reperfusion in Large Vessel Occlusion Stroke: A Phase 1b/2a Dose-Escalation and Dose-Expansion Randomized Clinical Trial',
    topic: 'ia-adjunct-after-evt',
    diseaseArea: ['acute-ischemic-stroke', 'ia-adjunct-after-evt'],
    population: {
      n: 205,
      ageRange: 'median 71 y (IQR 60-77); 113 (55.1%) male',
      nihssRange: 'not restricted by a protocol NIHSS band (anterior-circulation LVO)',
      timeWindow: '≤24 h from last known well',
      keyInclusion: ['Large-vessel occlusion with successful reperfusion after thrombectomy (eTICI 2b-3)', 'Phase 1b dose-escalation (n=48, nonrandomized) plus phase 2a dose-expansion (n=157, randomized)', 'Multicenter, China, 2023-2024 (ChiCTR2300073787 and ChiCTR2400080624)'],
      keyExclusion: ['Failure to achieve eTICI 2b-3 after thrombectomy']
    },
    intervention: 'Phase 1b: intra-arterial tenecteplase at 0.0313, 0.0625, 0.1250 and 0.1875 mg/kg tiers. Phase 2a: IA tenecteplase 0.0313 mg/kg (n=46) or 0.0625 mg/kg (n=46)',
    comparator: 'Phase 2a control arm — no intra-arterial thrombolysis (n=65)',
    primaryEndpoint: {
      definition: 'Two primaries. Phase 1b: symptomatic intracranial hemorrhage within 24 h against a prespecified dose-tier safety threshold. Phase 2a: no-disability outcome (modified Rankin Scale 0-1) at 90 days',
      timepoint: '24 h (phase 1b) and 90 d (phase 2a)',
      result: 'Phase 1b: the 0.1250 mg/kg tier CROSSED the prespecified safety threshold (sICH in 3 of 12 patients, P=.04); sICH occurred in 1 of 14 at 0.0313 mg/kg and 2 of 22 at 0.0625 mg/kg. Phase 2a DID NOT demonstrate benefit at either surviving dose: mRS 0-1 33.8% (22/65) control vs 37.0% (17/46) at 0.0313 mg/kg vs 43.5% (20/46) at 0.0625 mg/kg',
      effectSize: 'Phase 2a adjusted RR vs control: 0.85 at 0.0313 mg/kg; 1.15 at 0.0625 mg/kg',
      confidenceInterval: '0.0313 mg/kg 95% CI 0.54 to 1.35; 0.0625 mg/kg 95% CI 0.73 to 1.80',
      pValue: 'P=.50 and P=.55 respectively'
    },
    secondaryEndpoints: [
      {
        name: 'Safety outcomes across the three phase 2a groups',
        result: 'No significant difference among the three groups'
      }
    ],
    safetyFindings: {
      sich: 'Phase 1b by tier: 1/14 at 0.0313 mg/kg, 2/22 at 0.0625 mg/kg, 3/12 at 0.1250 mg/kg — the 0.1250 mg/kg tier exceeded the prespecified safety threshold (P=.04)',
      mortality: 'Not separately reported in the published abstract',
      other: 'No significant difference in safety outcomes among the three phase 2a groups'
    },
    imagingCriteria: 'Angiographic selection only — enrolment after thrombectomy achieved eTICI 2b-3',
    applicabilityNotes: 'This is the dose-safety anchor for the whole IA-adjunct category and it sits in direct tension with ANGEL-TNK: the 0.125 mg/kg intra-arterial tenecteplase dose that ANGEL-TNK reported as effective and safe is the same tier that crossed this trial\'s prespecified sICH boundary during escalation and was therefore not advanced into the randomized expansion. The doses that were carried forward (0.0313 and 0.0625 mg/kg) showed adequate safety but no efficacy signal, with confidence intervals spanning both directions. Read it as an explicit reminder that \'intra-arterial lytic after EVT\' is not one intervention — agent and dose are load-bearing.',
    limitations: 'Small phase 1b/2a trial not powered for efficacy; the escalation phase was nonrandomized and the sICH tier comparisons rest on single-digit event counts; single-country (China); open-label with blinded outcome assessment; the phase 2a efficacy result is exploratory by design.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-ia-tenecteplase-dose-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Shows that the safety of adjunctive intra-arterial tenecteplase is dose-dependent and that the 0.125 mg/kg tier tripped a prespecified hemorrhage boundary in escalation — dose, not just drug class, has to be specified before any adjunctive-lysis claim is made.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The only quantitative synthesis that treats agent AND dose as separate nodes rather than pooling \'IA lytic after EVT\' as one intervention, which is the right question given that the 0.125 mg/kg tenecteplase tier crossed a hemorrhage boundary in dose escalation. Its own authors state the findings are hypothesis-generating and should inform the design of future dose-specific trials rather than guide current practice — that framing should travel with the numbers. Note also that the two \'winning\' nodes are driven largely by the same Chinese trials that populate this category individually, so this is not independent confirmation.',
    limitations: 'Published in a secondary interventional-neurology journal by a two-author group with no listed trialist involvement; frequentist NMA with only seven trials across six nodes, so several comparisons rest on single trials and are indirect; safety estimates explicitly imprecise, meaning a hemorrhage or mortality hazard cannot be excluded; contributing trials are largely open-label and single-country; the authors themselves label the result hypothesis-generating.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ia-thrombolysis-dose-nma-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Frames adjunctive intra-arterial lysis as a dose-specific question rather than a settled class effect, and explicitly does not support adopting any regimen into practice on current evidence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'not restricted by a protocol NIHSS band (anterior-circulation LVO)',
      timeWindow: 'Randomization after successful reperfusion by thrombectomy',
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
    imagingCriteria: 'Angiographic selection only — randomization after thrombectomy achieved successful reperfusion',
    applicabilityNotes: 'The pivotal contrast in this category is timing relative to reperfusion, not the drug. ATTRACTION gave tirofiban AFTER successful reperfusion and improved 90-day independence by about 6 absolute points; RESCUE BT gave IV tirofiban BEFORE thrombectomy in a comparable Chinese population and was neutral with a hemorrhage trend the wrong way. A positive post-reperfusion result therefore does not overturn recommendations against pre-procedural tirofiban. Generalisability is bounded: 99% of participants were Han Chinese, in whom intracranial atherosclerotic occlusion — the lesion type most likely to reocclude and thus to benefit from a GP IIb/IIIa inhibitor — is far more prevalent than in most Western cohorts.',
    limitations: 'Single-country trial with a 99% Han Chinese population; the 3-percentage-point excess of symptomatic haemorrhage is real in absolute terms even though not statistically significant, and the trial was not powered to exclude it; no functional benefit was demonstrated on mortality; the underlying occlusion aetiology mix limits transfer to embolic-predominant populations.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-attraction-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reopens the adjunctive-antiplatelet question specifically for the post-reperfusion window, while the numerically higher symptomatic haemorrhage and the near-uniformly Han Chinese cohort mean it is not yet a general recommendation.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'rescue-bt',
    shortName: 'RESCUE BT',
    fullName: 'Effect of Intravenous Tirofiban vs Placebo Before Endovascular Thrombectomy on Functional Outcomes in Large Vessel Occlusion Stroke',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 948,
      ageRange: 'mean 67 y; 391 (41.2%) women',
      nihssRange: 'not restricted by a protocol NIHSS band (proximal intracranial LVO)',
      timeWindow: '≤24 h from time last known well',
      keyInclusion: ['Stroke with proximal intracranial large-vessel occlusion planned for endovascular thrombectomy', '55 hospitals in China; recruitment Oct 10 2018 - Oct 31 2021 (ChiCTR-IOR-17014167)', 'Investigator-initiated, randomized, double-blind, placebo-controlled'],
      keyExclusion: ['Standard thrombolysis/thrombectomy contraindications per protocol']
    },
    intervention: 'Intravenous tirofiban given BEFORE endovascular thrombectomy (n=463)',
    comparator: 'Matching intravenous placebo before endovascular thrombectomy (n=485)',
    primaryEndpoint: {
      definition: 'Disability level at 90 days measured as the overall ordinal distribution (shift) of modified Rankin Scale scores 0-6; superiority design',
      timepoint: '90 d',
      result: 'DID NOT meet superiority — neutral: median (IQR) 90-day mRS 3 (1-4) with tirofiban vs 3 (1-4) with placebo',
      effectSize: 'Adjusted common OR 1.08 for a lower level of disability with tirofiban',
      confidenceInterval: '95% CI 0.86 to 1.36',
      pValue: 'Not significant — the 95% CI crosses 1; no p-value reported in the abstract'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracranial hemorrhage within 48 h (primary safety outcome)',
        result: '9.7% with tirofiban vs 6.4% with placebo; difference 3.3% (95% CI -0.2% to 6.8%) — numerically higher with tirofiban, CI includes zero'
      }
    ],
    safetyFindings: {
      sich: '9.7% vs 6.4% within 48 h; absolute difference 3.3% (95% CI -0.2% to 6.8%)',
      mortality: 'Not reported in the published abstract',
      other: 'All 948 randomized patients (100%) completed the trial'
    },
    imagingCriteria: 'Confirmed proximal intracranial large-vessel occlusion on vascular imaging; no perfusion-mismatch selection for the adjunct',
    applicabilityNotes: 'This is the required counterweight in the antithrombotic-adjunct category, which otherwise reads as uniformly positive from RESCUE BT2 alone. RESCUE BT is large (n=948), double-blind and placebo-controlled — methodologically the strongest design in the category — and it was NEUTRAL, with symptomatic hemorrhage trending the wrong way. Set it directly against ATTRACTION: the same drug, the same country, opposite results, differing in one structural respect — whether tirofiban was given before or after successful reperfusion. Set it also against RESCUE BT2, which tested tirofiban in patients WITHOUT large- or medium-vessel occlusion, an entirely different population.',
    limitations: 'Single-country (China) trial in a population with a high prevalence of intracranial atherosclerosis; an ordinal shift primary endpoint may miss a benefit confined to a single mRS threshold; not powered to exclude the observed 3.3-percentage-point excess of symptomatic hemorrhage; predates current first-pass thrombectomy technique.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-rescue-bt-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Does not support giving intravenous tirofiban before endovascular thrombectomy: 90-day disability was unchanged and symptomatic hemorrhage was numerically higher.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'most',
    shortName: 'MOST',
    fullName: 'Multi-arm Optimization of Stroke Thrombolysis: Adjunctive Intravenous Argatroban or Eptifibatide for Ischemic Stroke',
    topic: 'acute-antithrombotic-adjuncts',
    diseaseArea: ['acute-ischemic-stroke', 'acute-antithrombotic-adjuncts'],
    population: {
      n: 514,
      ageRange: 'adults ≥18 y',
      nihssRange: 'NIHSS ≥6 before intravenous thrombolysis',
      timeWindow: 'IV thrombolysis within 3 h of onset; study drug started within 75 min of the start of thrombolysis',
      keyInclusion: ['Acute ischemic stroke treated with IV thrombolysis within 3 h of symptom onset (70% alteplase, 30% tenecteplase)', '57 sites in the United States (NCT03735979; NINDS-funded, Washington University)', 'Endovascular thrombectomy per usual care was permitted — 225 patients (44%) underwent thrombectomy'],
      keyExclusion: ['Anticoagulant or GP IIb/IIIa exposure per protocol windows', 'Baseline mRS >3', 'Standard thrombolysis contraindications']
    },
    intervention: 'Adjunctive intravenous argatroban (n=59) or intravenous eptifibatide (n=227), started within 75 min of the start of IV thrombolysis',
    comparator: 'Placebo (n=228)',
    primaryEndpoint: {
      definition: 'Utility-weighted 90-day modified Rankin Scale score (range 0-10, higher = better), centrally adjudicated; Bayesian adaptive three-group design in which a high posterior probability of superiority was required',
      timepoint: '90 d',
      result: 'DID NOT meet superiority for either adjunct — mean (±SD) utility-weighted 90-day mRS 5.2±3.7 with argatroban, 6.3±3.2 with eptifibatide and 6.8±3.0 with placebo; both adjuncts were numerically WORSE than placebo',
      effectSize: 'Posterior mean difference vs placebo −1.51±0.51 (argatroban) and −0.50±0.29 (eptifibatide)',
      confidenceInterval: 'Bayesian design — posterior mean differences with SD reported rather than frequentist confidence intervals',
      pValue: 'No p-value; posterior probability that the adjunct was BETTER than placebo was 0.002 for argatroban and 0.041 for eptifibatide (i.e. both very unlikely to be better)'
    },
    secondaryEndpoints: [
      {
        name: '90-day all-cause mortality (reported descriptively, no p-value)',
        result: 'Higher in the adjunct groups: 24% with argatroban (of only 59 patients), 12% with eptifibatide, 8% with placebo. This was NOT the primary outcome, was not a prespecified hypothesis test, and no p-value or confidence interval was reported for it'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial hemorrhage within 36 h was similar across the three groups: 4% argatroban, 3% eptifibatide, 2% placebo',
      mortality: '90-day mortality 24% (argatroban, n=59), 12% (eptifibatide) and 8% (placebo) — a descriptive secondary observation reported without a p-value; the trial\'s safety monitoring judged none of the deaths in the argatroban group to be drug-related',
      other: 'The excess mortality was not explained by symptomatic intracranial hemorrhage, which was similar across arms'
    },
    imagingCriteria: 'Noncontrast CT excluding hemorrhage and excluding hypodensity of more than one third of the MCA territory; no perfusion or mismatch selection',
    applicabilityNotes: 'The most important record in this category for a US reader, because it is the only large multicenter North American trial here — every other trial in the category is Chinese. Its lesson is about the post-thrombolysis window: adding an anticoagulant or a GP IIb/IIIa inhibitor within 75 minutes of IV lysis did not reduce disability. Read the mortality figures carefully and teach them carefully: they were a descriptive secondary observation, the argatroban percentage rests on only 59 patients, no p-value or interval was reported, symptomatic hemorrhage was similar across arms, and enrolment ended for futility rather than by a safety rule. The honest statement is \'no disability benefit, with an unexplained numerical mortality excess that the design cannot quantify\' — not \'argatroban significantly increased mortality\'.',
    limitations: 'Adaptive design with badly unequal arms — the argatroban group closed at only 59 patients while the other two exceeded 220, so every argatroban estimate is fragile; single-blind; Bayesian posterior probabilities are frequently misreported as frequentist p-values; enrolment stopped early for futility, so the trial cannot exclude a modest benefit or quantify the mortality signal; 44% also received thrombectomy, mixing two treatment contexts.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-most-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against adding intravenous argatroban or eptifibatide to IV thrombolysis in the first hours after treatment: no reduction in disability, and a numerical mortality excess the trial was stopped too early to characterise.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'clots-1',
    shortName: 'CLOTS 1',
    fullName: 'Effectiveness of thigh-length graduated compression stockings to reduce the risk of deep vein thrombosis after stroke (CLOTS trial 1)',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 2518,
      ageRange: 'adults; trial enrolled a broadly representative immobile stroke population',
      nihssRange: 'not reported; immobility used as the entry criterion',
      timeWindow: 'admitted to hospital within 1 week of acute stroke',
      keyInclusion: ['Acute stroke, admitted within 1 week, immobile', '64 centres in the UK, Italy and Australia', 'ISRCTN28163533'],
      keyExclusion: ['Mobile patients']
    },
    intervention: 'Routine care plus thigh-length graduated compression stockings (n=1256)',
    comparator: 'Routine care plus deliberate avoidance of graduated compression stockings (n=1262)',
    primaryEndpoint: {
      definition: 'Symptomatic or asymptomatic deep vein thrombosis in the popliteal or femoral veins, detected on outcome-blinded compression Doppler ultrasound at about 7-10 days and, where practical, again at 25-30 days; intention-to-treat',
      timepoint: '7-10 days, with repeat scanning at 25-30 days',
      result: 'DID NOT meet its aim — NULL: proximal DVT in 126/1256 (10.0%) with stockings vs 133/1262 (10.5%) without, a non-significant absolute risk reduction of 0.5%',
      effectSize: 'ARR 0.5% (non-significant)',
      confidenceInterval: '95% CI −1.9% to 2.9%',
      pValue: 'Not significant (the 95% CI crosses zero)'
    },
    secondaryEndpoints: [
      {
        name: 'Skin complications',
        result: 'HARM: skin breaks, ulcers, blisters and skin necrosis in 64/1256 (5%) with stockings vs 16/1262 (1%) without, OR 4.18 (95% CI 2.40-7.27)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — mechanical device, no anticoagulant tested',
      mortality: 'Not reported as a primary safety endpoint in the primary publication abstract',
      other: 'Four-fold excess of skin breaks, ulcers, blisters and necrosis with stockings (OR 4.18, 95% CI 2.40-7.27)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The essential counterweight in the VTE-prophylaxis section, and the reason the stroke-unit bundle cannot simply be borrowed from surgery. National stroke guidelines had recommended stockings by extrapolation from small trials in surgical patients; a stroke-specific trial of 2518 patients found no DVT benefit and a four-fold excess of skin injury. Teach it alongside CLOTS 3 by the same investigators: same question, same population, opposite answer — the mechanical device that works after stroke is IPC, not thigh-length stockings.',
    limitations: 'Open-label; primary endpoint is largely screen-detected asymptomatic DVT; thigh-length stockings only (below-knee stockings were tested separately in CLOTS 2); the trial cannot exclude a small effect, but the point estimate is essentially zero and the harm is real.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-clots1-2009'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against ordering thigh-length graduated compression stockings for VTE prophylaxis after stroke, given no measured benefit and a four-fold excess of skin injury.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
        result: 'No difference: 69/~880 (8%) enoxaparin vs 71/~880 (8%) unfractionated heparin, p=0.83'
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
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'headpost',
    shortName: 'HeadPoST',
    fullName: 'Head Positioning in Acute Stroke Trial: cluster-randomized, crossover trial of head positioning in acute stroke',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'stroke-unit-care'],
    population: {
      n: 11093,
      ageRange: 'adults with acute stroke',
      nihssRange: 'not reported in the primary publication abstract; 85% of strokes were ischaemic',
      timeWindow: 'position initiated soon after hospital admission; median 14 h from symptom onset (IQR 5-35 h) and maintained for 24 h',
      keyInclusion: ['Acute stroke (85% ischaemic) admitted to a participating hospital', 'Hospitals in nine countries, cluster-randomised with crossover', 'NCT02162017'],
      keyExclusion: ['Not specified in the primary publication abstract']
    },
    intervention: 'Lying flat — fully supine, back horizontal, face upwards — for 24 h, by hospital cluster assignment',
    comparator: 'Sitting up with the head elevated to at least 30 degrees for 24 h, by hospital cluster assignment',
    primaryEndpoint: {
      definition: 'Degree of disability at 90 days on the modified Rankin Scale (0-6), analysed as an ordinal shift with a proportional-odds model',
      timepoint: '90 days',
      result: 'DID NOT meet — NULL: no significant shift in the 90-day mRS distribution between lying flat and sitting up',
      effectSize: 'Unadjusted OR 1.01 for the lying-flat group',
      confidenceInterval: '95% CI 0.92 to 1.10',
      pValue: 'P=0.84'
    },
    secondaryEndpoints: [
      {
        name: 'Adherence to assigned position for 24 h',
        result: '87% in the lying-flat group vs 95% in the sitting-up group, P<0.001 — differential adherence limits how far the null can be pushed'
      },
      {
        name: 'Pneumonia and other serious adverse events',
        result: 'No significant between-group differences in rates of serious adverse events, including pneumonia'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — positioning intervention only',
      mortality: '90-day mortality 7.3% lying flat vs 7.4% sitting up, P=0.83',
      other: 'No significant between-group differences in serious adverse events, including aspiration pneumonia — the harm that motivated head elevation was not detected either way'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The trial behind the near-universal admission order-set line \'head of bed elevated 30 degrees\'. In 11,093 patients, 24 hours of lying flat versus sitting up changed neither 90-day disability nor mortality nor pneumonia. Two design facts must travel with the result: the assigned position began a median of 14 hours after onset — well past the window in which a perfusion argument would be most plausible — and adherence to lying flat was significantly worse than to sitting up (87% vs 95%), both of which bias toward the null. The honest teaching point is that routine head positioning is not a lever on outcome in unselected stroke, which leaves the argument where it belongs: the individual patient in whom perfusion dependence or aspiration risk is the actual question.',
    limitations: 'Cluster-randomised with crossover rather than patient-level randomisation, so patient-level confounding is possible; delayed initiation (median 14 h from onset); differential adherence (87% vs 95%) dilutes the contrast; unblinded intervention; 85% ischaemic, so it is underpowered to speak to ICH separately; no imaging-based selection of perfusion-dependent patients, who are the group most often argued about.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-headpost-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Removes routine head-of-bed position from the list of things that change stroke outcome, leaving it a patient-specific judgement about perfusion or aspiration risk.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'shine-glucose',
    shortName: 'SHINE',
    fullName: 'Stroke Hyperglycemia Insulin Network Effort (SHINE): Intensive vs Standard Treatment of Hyperglycemia and Functional Outcome in Patients With Acute Ischemic Stroke',
    topic: 'stroke-unit-care',
    diseaseArea: ['acute-ischemic-stroke', 'stroke-unit-care', 'neurocritical-care'],
    population: {
      n: 1151,
      ageRange: 'mean 66 y (SD 13.1); 529 (46%) women',
      nihssRange: 'not reported in the primary publication abstract; the primary outcome was adjusted for baseline stroke severity',
      timeWindow: 'enrolled within 12 h of stroke onset; treatment for up to 72 h',
      keyInclusion: ['Acute ischaemic stroke with hyperglycaemia — glucose >110 mg/dL if known diabetes, or ≥150 mg/dL if not', '920 (80%) had diabetes', '63 US sites, April 2012 to August 2018; NCT01369069'],
      keyExclusion: ['Not specified in the primary publication abstract']
    },
    intervention: 'Continuous intravenous insulin via a computerised decision-support tool, target glucose 80-130 mg/dL (4.4-7.2 mmol/L), for up to 72 h (n=581); achieved mean glucose 118 mg/dL',
    comparator: 'Subcutaneous sliding-scale insulin, target glucose 80-179 mg/dL (4.4-9.9 mmol/L), for up to 72 h (n=570); achieved mean glucose 179 mg/dL',
    primaryEndpoint: {
      definition: 'Proportion of patients with a favourable 90-day modified Rankin Scale outcome, adjusted for baseline stroke severity',
      timepoint: '90 days',
      result: 'DID NOT meet — NULL, and enrolment was STOPPED FOR FUTILITY at a prespecified interim analysis: favourable outcome in 119/581 (20.5%) with intensive control vs 123/570 (21.6%) with standard control',
      effectSize: 'Adjusted relative risk 0.97; unadjusted risk difference −0.83%',
      confidenceInterval: '95% CI 0.87 to 1.08 (adjusted RR); 95% CI −5.72% to 4.06% (unadjusted risk difference)',
      pValue: 'P=.55'
    },
    secondaryEndpoints: [
      {
        name: 'Separation between arms',
        result: 'Achieved separation was large and real — mean treatment glucose 118 mg/dL (6.6 mmol/L) intensive vs 179 mg/dL (9.9 mmol/L) standard — so the null is not explained by failure to separate'
      },
      {
        name: 'Trial completion',
        result: '1118 of 1151 randomised patients (97%) completed the trial'
      }
    ],
    safetyFindings: {
      sich: 'Not reported as a separate endpoint in the primary publication abstract',
      mortality: 'Captured within the 90-day mRS; no separate mortality difference was reported in the primary publication abstract',
      other: 'HARM with intensive control: treatment stopped early for hypoglycaemia or other adverse events in 65/581 (11.2%) intensive vs 18/570 (3.2%) standard. Severe hypoglycaemia occurred ONLY in the intensive group — 15/581 (2.6%); risk difference 2.58% (95% CI 1.29% to 3.87%)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The trial that settles the glucose line on the stroke admission order set, and a clean example of a well-executed null with a real safety cost. Intensive control achieved a 61 mg/dL separation from standard care and still produced no functional benefit, while severe hypoglycaemia occurred in 2.6% of intensively treated patients and in none of the standard-care patients. Note the relationship to QASC: QASC\'s bundle included a glucose protocol and the bundle helped, but SHINE shows the benefit cannot be attributed to driving glucose low — the useful protocol is one that avoids extremes, not one that chases a tight target.',
    limitations: 'Stopped early for futility, so the confidence interval around the null is wider than a completed trial would give; 80% of participants had known diabetes, limiting inference in stress hyperglycaemia without diabetes; a 12-hour enrolment window and 72-hour treatment period do not test glucose management beyond the first days; open comparison of two delivery systems (IV computerised protocol vs subcutaneous sliding scale) as well as two targets, so drug delivery and target are confounded.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-shine-2019'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Argues against intensive IV insulin targeting 80-130 mg/dL after ischaemic stroke; a moderate target avoids the hypoglycaemia without giving up any measured functional benefit.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      effectSize: 'Frequency OR 1.13 per additional daily session; amount OR 0.94 per additional unit of minutes/day',
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
      mortality: 'Not reported separately in this secondary-analysis abstract; the analysis reports a consistent pattern across both efficacy and safety outcomes',
      other: 'The consistent pattern of improved odds with higher session frequency was reported across efficacy AND safety outcomes'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The record that makes the mobilisation line on a stroke admission order set actionable rather than vague. AVERT itself found that very early, high-dose mobilisation reduced the odds of a favourable outcome; this prespecified dose-response analysis separates why, and it is the separation that teaches: shorter and more frequent is associated with better outcomes, longer sessions with worse. State the design limit every time this is quoted — the exposure was observed, not randomised, so confounding by indication is entirely plausible (the patients who tolerate long sessions differ from those who do not, and sicker patients may receive fewer, shorter sessions). Class III evidence supports writing \'out of bed short and often\' rather than \'out of bed as long as tolerated\', but it does not prove causation, and the randomised dose question was still open at the time of this review.',
    limitations: 'Observational dose-response across both randomised arms rather than a randomised comparison of mobilisation regimens; confounding by indication is the dominant threat, since dose was determined by clinicians responding to the patient in front of them; graded Class III; conducted within the AVERT population (stroke-unit admission within 24 h), so it does not speak to later rehabilitation dose; the units of the \'amount\' exposure are not stated in the abstract, so the OR of 0.94 should not be converted into a per-minute claim.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-avert-dose-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports framing early mobilisation orders around short, frequent out-of-bed sessions rather than total minutes, while flagging that the randomised dose question was not settled by this analysis.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'dido-gwtg-transfer-2023',
    shortName: 'GWTG-Stroke door-in-door-out',
    fullName: 'Door-in-Door-out Times for Interhospital Transfer of Patients With Stroke (Get With The Guidelines-Stroke registry analysis)',
    topic: 'systems-quality',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'systems-quality'],
    population: {
      n: 108913,
      ageRange: 'mean 66.7 y (SD 15.2); 50.6% male; 71.7% non-Hispanic White',
      nihssRange: 'full range; NIHSS >12 vs 0-1 was one of the strongest correlates of a shorter door-in-door-out time',
      timeWindow: 'emergency-department stay at the transferring hospital, January 2019 to December 2021',
      keyInclusion: ['Ischaemic (n=67,235) or haemorrhagic (n=41,678) stroke', 'Transferred from the emergency department of a Get With The Guidelines-Stroke affiliated hospital to another acute care hospital', '1925 transferring hospitals across the United States'],
      keyExclusion: ['Patients not transferred out of the presenting emergency department']
    },
    intervention: 'Observational exposure — patient-level and hospital-level characteristics of the transferring emergency department (no assigned treatment)',
    comparator: 'The guideline benchmark of a door-in-door-out time of no more than 120 minutes',
    primaryEndpoint: {
      definition: 'Door-in-door-out time (time of transfer out minus time of arrival at the transferring emergency department), analysed both continuously and dichotomised at the guideline-recommended ≤120 minutes, using generalized estimating equation regression',
      timepoint: 'Index emergency-department encounter at the transferring hospital',
      result: 'Real-world practice falls well short of the benchmark: median door-in-door-out time 174 minutes (IQR 116-276), and only 29,741 of 108,913 patients (27.3%) were transferred within 120 minutes',
      effectSize: 'Median 174 min; 27.3% meeting the ≤120-minute recommendation',
      confidenceInterval: 'IQR 116-276 minutes',
      pValue: 'Descriptive primary outcome; associations reported with 95% CIs (below)'
    },
    secondaryEndpoints: [
      {
        name: 'Factors associated with LONGER door-in-door-out time',
        result: 'Age ≥80 y vs 18-59 y +14.9 min (95% CI 12.3 to 17.5); female sex +5.2 min (95% CI 3.6 to 6.9); non-Hispanic Black vs non-Hispanic White +8.2 min (95% CI 5.7 to 10.8); Hispanic ethnicity vs non-Hispanic White +5.4 min (95% CI 1.8 to 9.0)'
      },
      {
        name: 'Factors associated with SHORTER door-in-door-out time',
        result: 'EMS prenotification −20.1 min (95% CI −22.1 to −18.1); NIHSS >12 vs 0-1 −66.7 min (95% CI −68.7 to −64.7); ischaemic stroke eligible for endovascular therapy vs haemorrhagic stroke −16.8 min (95% CI −21.0 to −12.7)'
      },
      {
        name: 'Endovascular-eligible subgroup',
        result: 'Among patients with acute ischaemic stroke eligible for endovascular therapy, female sex, Black race and Hispanic ethnicity were each associated with significantly LONGER door-in-door-out times, while EMS prenotification, intravenous thrombolysis and higher NIHSS were associated with shorter times'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — registry study of process times, not of a treatment',
      mortality: 'Not an outcome of this analysis; the study measured process time, not clinical outcome',
      other: 'The demographic disparities in transfer time are the principal adverse finding: age, sex, race and ethnicity were each independently associated with delay'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The benchmark record for every transfer decision this tool models. It converts an abstract guideline number into what actually happens on 1925 US emergency departments: the recommendation is ≤120 minutes, the observed median is 174 minutes, and barely one transfer in four meets the target. Two teaching points sit inside it. First, the modifiable lever with the largest measured effect that a receiving clinician can influence is EMS prenotification (−20 minutes). Second, the delays are not distributed evenly — older patients, women, Black patients and Hispanic patients all waited measurably longer, and those disparities persisted in the endovascular-eligible subgroup where minutes matter most. Note that the very large effect of NIHSS >12 (−66.7 minutes) reflects triage working as intended for obvious severe strokes, which also means the milder presentations that are hardest to recognise are the ones that wait.',
    limitations: 'Observational registry analysis: associations, not causal effects, and residual confounding by unmeasured hospital and patient factors is certain; restricted to Get With The Guidelines-participating hospitals, which are likely faster and better-resourced than non-participating ones, so the true national median is probably worse; process time only — this analysis does not link door-in-door-out time to functional outcome; time stamps are abstracted from records with variable accuracy; the study period (2019-2021) overlaps the COVID-19 pandemic.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-dido-gwtg-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Gives transfer decisions a concrete, measurable benchmark — a ≤120-minute door-in-door-out target that most US transfers currently miss — and names EMS prenotification and demographic disparity as the levers to audit.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'target-stroke-phase-3-strategies',
    shortName: 'Target Stroke Phase III',
    fullName: 'Association of Component Strategies of the Target Stroke Phase 3 Nationwide Quality Improvement Program With Accelerated Door-to-Puncture and Door-In-Door-Out Times for Ischemic Stroke Endovascular Thrombectomy in the United States',
    topic: 'systems-quality',
    diseaseArea: ['acute-ischemic-stroke', 'systems-quality'],
    population: {
      n: 0,
      ageRange: 'adults; the total cohort size is NOT stated in the retrieved abstract, so no n is asserted here',
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
    applicabilityNotes: 'The companion to the door-in-door-out benchmark record: if that one says how far practice is from the target, this one says which specific changes have measurably moved the clock. The most useful teaching point is the asymmetry — the strategy that helps most at a thrombectomy centre (alert the neurointerventional team the moment EMS prenotifies, −21.9 minutes) is not the strategy that helps at a referring hospital (better stroke screening tools and turning the camera on during telestroke). Treat the effect sizes with proportionate caution: the prenotification estimate has a very wide confidence interval (−42.5 to −1.3 minutes) and all of them are associations between hospital-level practice adoption and observed times, not the results of randomising hospitals to strategies.',
    limitations: 'Retrospective observational cohort with hospital-level exposures — hospitals that adopt more strategies plausibly differ in many unmeasured ways (staffing, volume, culture), so confounding by organisational capability is the central threat; the retrieved abstract does not report the cohort size, so no n is asserted in this record; wide confidence intervals on the largest effect estimate; restricted to Get With The Guidelines participants; study period overlaps the COVID-19 pandemic; process-time outcomes only, with no link to functional outcome.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-target-stroke-3-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Identifies which workflow changes are associated with faster reperfusion at each node of a transfer network — team activation on prenotification at the hub, screening tools and telestroke cameras at the spoke.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ai-lvo-detection-accuracy-meta',
    shortName: 'AI LVO-detection accuracy meta-analysis',
    fullName: 'Diagnostic Test Accuracy of Artificial Intelligence in Large Vessel Occlusion: A Systematic Review and Meta-Analysis',
    topic: 'systems-quality',
    diseaseArea: ['acute-ischemic-stroke', 'systems-quality'],
    population: {
      n: 10937,
      ageRange: 'not reported at the pooled level',
      nihssRange: 'not reported at the pooled level',
      timeWindow: 'acute stroke CT angiography at presentation',
      keyInclusion: ['11 studies of 878 records screened, searching Scopus, PubMed and ScienceDirect to 2 February 2025', 'Commercial AI LVO-detection tools including Viz-LVO, CINA-LVO, RAPID-CTA and JLK', 'Studies reporting an overall confusion diagnostic matrix (primary analysis) or performance by occlusion site (secondary analysis)'],
      keyExclusion: ['Studies not reporting an extractable diagnostic matrix']
    },
    intervention: 'Automated AI detection of large vessel occlusion on CT angiography',
    comparator: 'Reference-standard adjudication of the CT angiogram by human readers',
    primaryEndpoint: {
      definition: 'Pooled diagnostic test accuracy — sensitivity and specificity — of AI software for detecting large vessel occlusion on CT angiography, with pooled positive and negative likelihood ratios, area under the curve and diagnostic odds ratio',
      timepoint: 'Index CT angiogram',
      result: 'Accuracy is good but asymmetric, and the negative result is the weak one: pooled sensitivity 0.87 and pooled specificity 0.95. The pooled positive likelihood ratio was 9.55 and statistically significant, while the pooled negative likelihood ratio of 0.14 was NOT statistically significant — meaning a negative AI read does not reliably rule out an occlusion',
      effectSize: 'Pooled sensitivity 0.87; specificity 0.95; PLR 9.55; NLR 0.14; AUC 0.87; diagnostic odds ratio 4.69',
      confidenceInterval: '95% CI 0.76-0.93 (sensitivity); 0.91-0.97 (specificity); 5.79-13.30 (PLR); 0.03-0.25 (NLR); 0.83-0.92 (AUC); 4.19-5.19 (DOR)',
      pValue: 'p<0.001 for PLR, AUC and DOR; p=0.624 for NLR (not significant)'
    },
    secondaryEndpoints: [
      {
        name: 'Performance by occlusion site',
        result: 'Anterior circulation performance was generally acceptable — good for M1 and ICA-type occlusions, MODERATE for M2 occlusions. Performance was POOR for ICA Type I occlusions and for POSTERIOR circulation occlusions'
      },
      {
        name: 'Sources of variation',
        result: 'Three covariates were identified — type of AI, AI software vendor and geographic region — and significant heterogeneity remained in the pooled PLR, AUC and DOR (I² reported as 98-99% for those estimates)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — diagnostic accuracy study, no treatment',
      mortality: 'Not an outcome; no included study in this pooled analysis reported patient outcomes',
      other: 'The principal clinical hazard is a false-negative read: the authors conclude that negative cases flagged by AI require careful re-evaluation by imaging review and assessment of the patient\'s clinical profile'
    },
    imagingCriteria: 'CT angiography of the head and neck at presentation, read both by the AI tool and by the human reference standard',
    applicabilityNotes: 'The first record in this corpus to address AI triage software, which is now embedded in many transfer pathways yet had no evidence attached to it here. The number worth teaching is not the headline sensitivity but the asymmetry beneath it: a POSITIVE AI flag is genuinely informative (positive likelihood ratio 9.55), while a NEGATIVE AI read is not — the pooled negative likelihood ratio was not statistically significant, and performance was explicitly poor for posterior-circulation and ICA Type I occlusions and only moderate for M2. In transfer terms, that means these tools can reasonably accelerate a transfer that a human would have called anyway, but must never be used to stand down a transfer or to close out a clinically suspicious presentation. The basilar occlusion — the diagnosis where delay is least forgiving — is precisely the one where these tools performed worst.',
    limitations: 'Pooled from 11 heterogeneous studies with extreme statistical heterogeneity (I² of 98-99% for PLR, AUC and DOR), so the pooled point estimates should be read as summaries of a scattered literature rather than as a single trustworthy value; multiple different commercial products pooled together despite vendor being an identified source of variation; diagnostic accuracy only — no included study links AI deployment to patient functional outcome; publication and spectrum bias likely, as accuracy studies are often run on enriched retrospective datasets rather than consecutive real-world scans; published in a lower-profile journal, and the underlying studies are predominantly retrospective.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ai-lvo-dta-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Frames AI LVO-detection output as a rule-in aid that can speed a transfer, never a rule-out that can cancel one — especially for posterior-circulation and M2 occlusions.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'catis-2',
    shortName: 'CATIS-2',
    fullName: 'China Antihypertensive Trial in Acute Ischaemic Stroke II - early versus delayed antihypertensive treatment in patients with acute ischaemic stroke',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 4810,
      ageRange: '≥40 years',
      nihssRange: 'mild-to-moderate stroke (severity distribution not given in the primary report)',
      timeWindow: 'enrolled 24-48 h after symptom onset',
      keyInclusion: ['Acute ischaemic stroke within 24-48 h of symptom onset', 'Elevated systolic blood pressure between 140 mm Hg and <220 mm Hg', '106 hospitals in China, 13 June 2018 - 10 July 2022', 'NCT03479554'],
      keyExclusion: ['Received intravenous thrombolytic treatment']
    },
    intervention: 'Antihypertensive treatment immediately after randomisation, aimed at reducing SBP by 10%-20% within the first 24 h and a mean BP <140/90 mm Hg within seven days (n=2413)',
    comparator: 'Antihypertensive medications discontinued for seven days, then treatment started on day 8 aimed at mean BP <140/90 mm Hg (n=2397)',
    primaryEndpoint: {
      definition: 'Combination of functional dependency or death (modified Rankin Scale score ≥3), intention-to-treat analysis',
      timepoint: '90 days',
      result: 'NULL - early treatment DID NOT reduce dependency or death: 289/2413 (12.0%) early vs 250/2397 (10.5%) delayed. The point estimate numerically favours delaying treatment.',
      effectSize: 'Odds ratio 1.18',
      confidenceInterval: '95% CI 0.98 to 1.41',
      pValue: 'P=0.08'
    },
    secondaryEndpoints: [
      {
        name: 'Achieved blood-pressure separation',
        result: 'Mean SBP fell 9.7% (162.9 to 146.4 mm Hg) in the early group and 4.9% (162.8 to 154.3 mm Hg) in the delayed group within 24 h (P<0.001 for group difference). Day-7 mean SBP was 139.1 vs 150.9 mm Hg (P<0.001), and 54.6% vs 22.4% of patients were below 140/90 mm Hg (P<0.001)'
      },
      {
        name: 'Recurrent stroke and adverse events',
        result: 'No significant differences between the two groups'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'Counted within the composite primary outcome; no separate mortality figure is given in the primary report',
      other: 'No significant difference in reported adverse events between groups'
    },
    imagingCriteria: '',
    applicabilityNotes: 'CATIS-2 asks the question CATIS did not: not whether to treat but when. Holding antihypertensives for a week and restarting on day 8 produced 90-day outcomes no worse than starting immediately, with the point estimate mildly favouring delay. Together with CATIS, ENOS and COSSACS this makes permissive hypertension in the first days after non-reperfused ischaemic stroke a defensible default rather than an omission. The 0.98 lower confidence bound means a modest benefit of delaying cannot be ruled out, but neither has it been demonstrated.',
    limitations: 'Open-label design (blinded outcome assessment); conducted entirely in China. Enrolment began 24-48 h after onset, so the trial says nothing about the first 24 h. Restricted to patients with SBP 140 to <220 mm Hg and to those who did not receive thrombolysis. The primary result was not statistically significant, so it is a null trial, not a demonstration that delay is superior.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-catis2-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports not rushing to restart or start antihypertensives in the first week after a non-thrombolysed ischaemic stroke - deferring to day 8 was not worse at 90 days.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'enos',
    shortName: 'ENOS',
    fullName: 'Efficacy of Nitric Oxide, With or Without Continuing Antihypertensive Treatment, for Management of High Blood Pressure in Acute Stroke - a partial-factorial randomised controlled trial',
    topic: 'bp-acute-ischemic',
    diseaseArea: ['acute-ischemic-stroke', 'bp-acute-ischemic'],
    population: {
      n: 4011,
      ageRange: 'adults admitted to hospital with acute stroke (age range not stated in the primary report)',
      nihssRange: 'not reported in the primary report',
      timeWindow: 'within 48 h of stroke onset (median 26 h, IQR 16-37)',
      keyInclusion: ['Acute ischaemic OR haemorrhagic stroke', 'Raised systolic blood pressure 140-220 mm Hg', 'Continue-versus-stop sub-randomisation restricted to the 2097 patients already taking antihypertensive drugs before their stroke', 'ISRCTN99414122'],
      keyExclusion: []
    },
    intervention: 'Transdermal glyceryl trinitrate 5 mg per day for 7 days started within 48 h of onset (n=2000); in the partial-factorial sub-randomisation, continue pre-stroke antihypertensive drugs (n=1053)',
    comparator: 'No glyceryl trinitrate (n=2011); in the sub-randomisation, stop pre-stroke antihypertensive drugs (n=1044)',
    primaryEndpoint: {
      definition: 'Function assessed with the modified Rankin Scale by observers masked to treatment assignment (ordinal analysis)',
      timepoint: '90 days',
      result: 'NULL in BOTH comparisons - functional outcome DID NOT differ for glyceryl trinitrate versus none, nor for continuing versus stopping pre-stroke antihypertensives',
      effectSize: 'Adjusted common odds ratio for worse outcome 1.01 (glyceryl trinitrate vs none); 1.05 (continue vs stop antihypertensives)',
      confidenceInterval: '95% CI 0.91 to 1.13 (glyceryl trinitrate); 0.90 to 1.22 (continue vs stop)',
      pValue: 'p=0.83 (glyceryl trinitrate); p=0.55 (continue vs stop)'
    },
    secondaryEndpoints: [
      {
        name: 'Blood-pressure separation with glyceryl trinitrate',
        result: 'Day-1 BP was significantly lower with glyceryl trinitrate: difference -7.0 mm Hg systolic (95% CI -8.5 to -5.6) and -3.5 mm Hg diastolic (95% CI -4.4 to -2.6), both p<0.0001'
      },
      {
        name: 'Blood-pressure separation with continuing antihypertensives',
        result: 'Day-7 BP was lower in those who continued: difference -9.5 mm Hg systolic (95% CI -11.8 to -7.2) and -5.0 mm Hg diastolic (95% CI -6.4 to -3.7), both p<0.0001'
      },
      {
        name: 'Baseline blood pressure',
        result: 'Mean 167 (SD 19) / 90 (SD 13) mm Hg at randomisation'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'Not separately reported in the primary report',
      other: 'The investigators describe glyceryl trinitrate as having acceptable safety'
    },
    imagingCriteria: '',
    applicabilityNotes: 'ENOS carries the largest continue-versus-stop randomisation ever performed (2097 patients) and is the record that most directly answers the ward question \'do I restart their home antihypertensives?\'. A real 9.5/5.0 mm Hg separation at day 7 produced identical 90-day function. Two cautions for teaching: the cohort is MIXED ischaemic and haemorrhagic stroke, so it is not a pure non-reperfused-ischaemic trial; and the glyceryl trinitrate comparison is a drug question, not a BP-target question. Read the continue-vs-stop arm alongside COSSACS, which asked the same question in a smaller UK cohort and also found nothing.',
    limitations: 'Mixed stroke type (ischaemic and haemorrhagic) rather than ischaemic-only. The continue-versus-stop comparison was a sub-randomisation covering only the 2097 patients already on antihypertensives, and it was open-label. Enrolment ran from 2001 to 2013, so background care changed substantially over the trial. Median randomisation at 26 h means the very early window is under-represented.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-enos-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The authors state there is no evidence to support continuing pre-stroke antihypertensive drugs in the first few days after acute stroke - the decision to hold or continue does not change 90-day function.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the synthesis record for the whole non-reperfused acute-BP category: pooling 15,521 randomised patients, early antihypertensive therapy reliably drops SBP by about 9 mm Hg and reliably changes nothing about death, disability, major vascular events or recurrence. It should be read as the summary of CATIS, CATIS-2, ENOS, SCAST and their peers rather than as independent evidence. One framing caution: the pooled population was not restricted to non-reperfused patients at inclusion - the authors\' conclusion applies that framing after the fact.',
    limitations: 'Aggregate-data meta-analysis, not individual participant data. Only seven trials, pooling heterogeneous interventions (drug-class trials, treat-versus-withhold trials and timing trials) under one \'early antihypertensive therapy\' label. The published abstract reports no heterogeneity statistics, no formal GRADE assessment, and no p values for the pooled estimates. Several component trials enrolled mixed ischaemic and haemorrhagic stroke. A null pooled estimate does not exclude benefit or harm in specific subgroups.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-early-antihypertensive-meta-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Provides the one-line summary for the category: early BP lowering in acute ischaemic stroke produces a real BP reduction and no measurable change in mortality, dependency or recurrence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'bp-target',
    shortName: 'BP-TARGET',
    fullName: 'Safety and efficacy of intensive blood pressure lowering after successful endovascular therapy in acute ischaemic stroke (BP-TARGET)',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: {
      n: 324,
      ageRange: 'adults ≥18 years',
      nihssRange: 'not reported in the primary report',
      timeWindow: 'target achieved within 1 h of randomisation and maintained for 24 h after reperfusion',
      keyInclusion: ['Acute ischaemic stroke due to large-vessel occlusion successfully treated with endovascular therapy', 'Systolic blood pressure above 130 mm Hg at the end of the procedure (per the authors\' applicability statement)', 'Four academic hospital centres in France, 21 June 2017 - 27 September 2019', 'Randomisation stratified by centre and by intravenous thrombolysis use before endovascular therapy', 'NCT03160677'],
      keyExclusion: []
    },
    intervention: 'Intensive systolic blood-pressure target 100-129 mm Hg for 24 h using intravenous BP-lowering treatment (n=162 randomised; 154 in the primary analysis)',
    comparator: 'Standard-care systolic blood-pressure target 130-185 mm Hg for 24 h (n=162 randomised; 157 in the primary analysis)',
    primaryEndpoint: {
      definition: 'Rate of radiographic intraparenchymal haemorrhage on brain CT at 24-36 h after reperfusion - an IMAGING endpoint, not a functional one; intention-to-treat',
      timepoint: '24-36 h',
      result: 'NULL - the intensive target DID NOT reduce radiographic intraparenchymal haemorrhage: 65/154 (42%) intensive vs 68/157 (43%) standard',
      effectSize: 'Adjusted odds ratio 0.96',
      confidenceInterval: '95% CI 0.60 to 1.51',
      pValue: 'p=0.84'
    },
    secondaryEndpoints: [
      {
        name: 'Achieved blood-pressure separation',
        result: 'Mean systolic BP during the first 24 h after reperfusion was 128 mm Hg (SD 11) intensive vs 138 mm Hg (SD 17) standard'
      },
      {
        name: 'Withdrawals',
        result: '4 of 162 (2%) intensive and 2 of 162 (1%) standard were excluded for withdrawal of consent or legal reasons'
      }
    ],
    safetyFindings: {
      sich: 'The primary outcome was RADIOGRAPHIC, not symptomatic, intraparenchymal haemorrhage: 42% intensive vs 43% standard',
      mortality: 'Death within the first week after randomisation: 11/158 (7%) intensive vs 7/160 (4%) standard',
      other: 'Hypotensive events (the primary safety outcome): 12/158 (8%) intensive vs 5/160 (3%) standard; the difference was not significant'
    },
    imagingCriteria: 'Successful reperfusion after endovascular therapy; the primary outcome was adjudicated on brain CT at 24-36 h',
    applicabilityNotes: 'BP-TARGET is the first randomised trial of post-EVT blood pressure and is easy to misread because its primary endpoint is radiographic haemorrhage rather than function. Two structural points matter for teaching. First, its \'standard care\' band was 130-185 mm Hg, which sits lower than the 140-180 band used as the comparator in OPTIMAL-BP and ENCHANTED2/MT - so the trials are not testing identical control strategies. Second, the trial-supported comparator range in this category is 140-180 mm Hg, NOT 140-160; no randomised trial has used 140 as a lower bound. Like every other trial in this category, BP-TARGET required successful reperfusion, so none of it transfers to patients left with mTICI 0-2a.',
    limitations: 'Modest size (324 randomised) and an imaging primary endpoint, so it is not powered for function. Open-label. Four French academic centres only. Applicable, per the authors, to patients with successful reperfusion and systolic blood pressure above 130 mm Hg at the end of the procedure - a null result on an imaging endpoint is not evidence that BP targets do not matter for outcome.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-bp-target-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Establishes that driving SBP to 100-129 mm Hg after successful thrombectomy does not reduce post-procedural intraparenchymal haemorrhage - it removed the main mechanistic rationale for intensive lowering before the later trials showed functional harm.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'best-ii',
    shortName: 'BEST-II',
    fullName: 'Blood Pressure Management After Endovascular Therapy for Acute Ischemic Stroke: The BEST-II Randomized Clinical Trial',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: {
      n: 120,
      ageRange: 'mean 69.6 years (SD 14.5); 69 of 120 (58%) female',
      nihssRange: 'not reported in the primary report',
      timeWindow: 'targets initiated within 60 minutes of recanalization and maintained for 24 h',
      keyInclusion: ['Acute ischemic stroke after SUCCESSFUL endovascular therapy', '3 US comprehensive stroke centers, January 2020 - March 2022 (final follow-up June 2022)', '113 of 120 (94.2%) completed the trial', 'NCT04116112'],
      keyExclusion: []
    },
    intervention: 'Two lower systolic blood-pressure target arms: 40 to less than 140 mm Hg, and 40 to less than 160 mm Hg. Every arm carried a 40 mm Hg lower floor.',
    comparator: 'Guideline-recommended systolic blood-pressure target of 40 to 180 mm Hg or less',
    primaryEndpoint: {
      definition: 'Phase 2 FUTILITY design with prespecified multiple primary outcomes: follow-up infarct volume at 36 (±12) h and utility-weighted modified Rankin Scale score at 90 (±14) days. The harm-futility boundaries tested were a 10-mL increase in infarct volume (slope 0.5) or a 0.10 decrease in utility-weighted mRS (slope -0.005) per 20-mm Hg reduction in the SBP target (1-sided alpha = .05). An additional prespecified futility criterion was a less than 25% predicted probability of success for a future 2-group superiority trial (maximum sample size 1500, utility-weighted mRS).',
      timepoint: '36 h (imaging) and 90 days (utility-weighted mRS)',
      result: 'DID NOT meet the prespecified futility criteria. Mean follow-up infarct volume was 32.4 mL for the <140 mm Hg group, 50.7 mL for the <160 mm Hg group and 46.4 mL for the ≤180 mm Hg group - the MOST intensive arm had the SMALLEST infarct volume. Mean utility-weighted mRS was 0.51 (<140), 0.47 (<160) and 0.58 (≤180). This is a low probability of benefit, NOT demonstrated harm.',
      effectSize: 'Adjusted slope per mm Hg decrease in the SBP target: -0.29 for follow-up infarct volume; -0.0019 for utility-weighted mRS',
      confidenceInterval: '95% CI -0.81 to infinity (infarct-volume slope); 95% CI -infinity to 0.0017 (utility-weighted mRS slope). Infarct-volume 95% CIs by arm: 18.0-46.7 mL (<140), 33.7-67.7 mL (<160), 24.5-68.2 mL (≤180)',
      pValue: 'Futility P=.99 (infarct volume); futility P=.93 (utility-weighted mRS)'
    },
    secondaryEndpoints: [
      {
        name: 'Predicted probability of success in a future 2-group superiority trial (maximum n=1500, utility-weighted mRS)',
        result: '25% for the <140 mm Hg target and 14% for the <160 mm Hg target, each compared with the ≤180 mm Hg target'
      },
      {
        name: 'Utility-weighted mRS by arm with confidence intervals',
        result: '0.51 (95% CI 0.38 to 0.63) for <140 mm Hg; 0.47 (95% CI 0.35 to 0.60) for <160 mm Hg; 0.58 (95% CI 0.46 to 0.71) for ≤180 mm Hg'
      },
      {
        name: 'Trial completion',
        result: '113 of 120 randomized patients (94.2%) completed the trial'
      }
    ],
    safetyFindings: {
      sich: 'Not reported in the primary report',
      mortality: 'Not reported in the primary report',
      other: 'Every arm carried a 40 mm Hg lower floor, so no arm tested unbounded blood-pressure lowering'
    },
    imagingCriteria: 'Successful recanalization after endovascular therapy; follow-up infarct volume measured at 36 (±12) h',
    applicabilityNotes: 'BEST-II is the record most often described incorrectly, so its framing matters more than its numbers. It is a phase 2 FUTILITY trial that did NOT meet its prespecified futility criteria, and its most intensive arm (<140 mm Hg) had the SMALLEST mean infarct volume of the three. It is NOT a harm trial. The harm signal in this category comes from ENCHANTED2/MT (target <120 mm Hg) and OPTIMAL-BP (target <140 mm Hg), not from BEST-II. What BEST-II does contribute is a probability statement: only a 25% (<140) and 14% (<160) predicted chance that a future superiority trial of those targets would succeed. It is also the only trial ever to test a <160 mm Hg target - and its <160 arm was numerically the worst of the three on utility-weighted mRS, which is why \'140-160\' is not a trial-supported band. The trial-supported comparator range is 140-180 mm Hg.',
    limitations: 'Phase 2 futility design in only 120 patients at 3 US centers - built to screen for futility, not to detect benefit or harm, so the confidence intervals for the primary slopes are one-sided by design. Open-label with blinded endpoints. \'Low probability of success in a future trial\' is a forecast about trial design, not a clinical finding; conflating it with demonstrated harm inverts the paper. All arms required successful recanalization, so nothing here applies to persistent occlusion.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-best-ii-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches the difference between \'low probability of future trial success\' and \'demonstrated harm\' - and supplies the reason the ≤180 mm Hg ceiling, rather than a 140-160 band, remains the referenced target after thrombectomy.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'identify-post-evt-bp',
    shortName: 'IDENTIFY',
    fullName: 'Early intensive blood pressure management after endovascular treatment in ischaemic stroke (IDENTIFY): a multicentre, open-label, blinded-endpoint, randomised controlled trial',
    topic: 'bp-post-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bp-post-evt'],
    population: {
      n: 383,
      ageRange: 'adults (age range not stated in the primary report)',
      nihssRange: 'not reported in the primary report',
      timeWindow: 'endovascular treatment within 6 h of onset; blood-pressure targets maintained until 24 h post-EVT',
      keyInclusion: ['Acute ischaemic stroke due to large vessel occlusion in the anterior circulation', 'Underwent endovascular treatment within 6 h AND achieved successful recanalisation', '63 stroke centres in China, 14 October 2022 - 18 March 2024', 'ChiCTR2200057770'],
      keyExclusion: []
    },
    intervention: 'Intensive management: systolic blood-pressure target <130 mm Hg maintained until 24 h after endovascular treatment (n=183)',
    comparator: 'Standard management: systolic blood-pressure target <180 mm Hg maintained until 24 h after endovascular treatment (n=200)',
    primaryEndpoint: {
      definition: 'Unfavourable functional outcome, defined as a modified Rankin Scale score of 3-6, assessed by blinded endpoint adjudication',
      timepoint: '90 days',
      result: 'NULL - intensive management to <130 mm Hg DID NOT improve outcomes: 130/183 (71.0%) intensive vs 135/200 (67.5%) standard',
      effectSize: 'Risk ratio 1.05',
      confidenceInterval: '95% CI 0.92 to 1.20',
      pValue: 'p=0.45'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracerebral haemorrhage',
        result: 'No significant difference between groups'
      },
      {
        name: 'Malignant brain oedema',
        result: 'No significant difference between groups'
      },
      {
        name: 'All-cause death at 90 days',
        result: 'No significant difference between groups'
      }
    ],
    safetyFindings: {
      sich: 'No significant difference in symptomatic intracerebral haemorrhage between the intensive and standard groups',
      mortality: 'No significant difference in all-cause death at 90 days',
      other: 'No significant difference in malignant brain oedema'
    },
    imagingCriteria: 'Anterior-circulation large-vessel occlusion treated by EVT within 6 h with successful recanalisation',
    applicabilityNotes: 'IDENTIFY is the third randomised test of intensive BP lowering after successful thrombectomy and it reaches the same place as the others: no benefit. It differs usefully from its neighbours in two ways. Its window was restricted to EVT within 6 h, and its intensive target (<130 mm Hg) sits between ENCHANTED2/MT (<120) and OPTIMAL-BP (<140). Its comparator, <180 mm Hg, matches the guideline ceiling rather than the 140-180 band. Read the null here against the harm found in ENCHANTED2/MT and OPTIMAL-BP: the direction of the point estimate (RR 1.05) is consistent with those trials, but this trial alone does not demonstrate harm. As with every trial in this category, successful recanalisation was required.',
    limitations: 'TERMINATED EARLY after a neutral interim analysis and the publication of counterpart randomised trials, so the final sample (383) is smaller than planned and the confidence interval correspondingly wide. Open-label with blinded endpoints. Conducted entirely in China. Restricted to the ≤6 h window and to anterior-circulation occlusions with successful recanalisation, so it does not speak to late-window EVT or to persistent occlusion.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-identify-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a third randomised null to the post-thrombectomy BP question - a <130 mm Hg target within the 6-hour window changed neither function, haemorrhage, oedema nor death.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS pooled as an outcome, not an inclusion criterion',
      timeWindow: 'blood-pressure management during and after reperfusion by systemic thrombolysis or endovascular thrombectomy',
      keyInclusion: ['Nine randomized controlled trials, 4381 participants, primarily from upper-middle and high-income countries', 'SEVEN studies in endovascular thrombectomy patients and TWO in systemic thrombolysis patients - this is not a pure post-EVT synthesis', 'Intensive arms: target <140 mm Hg in five studies, <120 mm Hg in two, <160 mm Hg in one, and one study with both <140 and <160 arms', 'Conventional arms: target <180 mm Hg in eight studies and <160 mm Hg in one', 'CENTRAL, MEDLINE, Embase and two trial registers searched to 20 March 2025; Cochrane RoB 2 and GRADE applied'],
      keyExclusion: []
    },
    intervention: 'Intensive systolic blood-pressure management, defined as any systolic target less than 160 mm Hg',
    comparator: 'Conventional systolic blood-pressure management, target less than 180 mm Hg (less than 160 mm Hg in one study)',
    primaryEndpoint: {
      definition: 'Critical outcomes were clinical function (assessed dichotomously on the modified Rankin Scale), quality of life, and neurologic adverse events (any intracranial haemorrhage and symptomatic intracranial haemorrhage), each graded with GRADE',
      timepoint: 'as reported by the component trials',
      result: 'Intensive management results in LITTLE TO NO clinically meaningful difference in clinical function (high-certainty evidence). IMPORTANT READING NOTE: the published abstract does not state the direction of the mRS dichotomy, so this risk ratio must NOT be paraphrased as favouring either arm.',
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
    limitations: 'Nine trials with substantial clinical heterogeneity: intensive targets ranged from <120 to <160 mm Hg and the conventional comparator was <160 mm Hg in one study rather than <180. Statistical heterogeneity was high for the functional outcome (I-squared 51%) and for quality of life (I-squared 75%). Two of the nine trials studied thrombolysis rather than thrombectomy. Certainty was lowest for symptomatic neurologic adverse events and other adverse events. Participants came primarily from upper-middle and high-income countries; the review explicitly calls for trials in low- and middle-income settings. The published abstract does not state the direction of the dichotomous mRS outcome, so its risk ratio cannot be read directionally.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-cochrane-bp-reperfused-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the GRADE-graded bottom line for post-reperfusion BP: intensive systolic lowering below 160 mm Hg buys no clinically meaningful functional benefit and probably increases all-cause mortality.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'iris-ipd-meta-analysis',
    shortName: 'IRIS IPD meta-analysis',
    fullName: 'Value of intravenous thrombolysis in endovascular treatment for large-vessel anterior circulation stroke: individual participant data meta-analysis of six randomised trials (IRIS)',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 2313,
      ageRange: 'adults; pooled from six randomised trials',
      nihssRange: 'large-vessel anterior-circulation occlusion',
      timeWindow: 'IVT-eligible time windows of the six contributing trials',
      keyInclusion: ['Systematic review to 9 March 2023 plus individual participant data from all six eligible randomised trials of EVT alone vs IVT + EVT', 'Patients presenting DIRECTLY at endovascular-treatment-capable centres', '1153 assigned EVT alone, 1160 assigned IVT plus EVT', 'PROSPERO CRD42023411986'],
      keyExclusion: ['Patients transferred in (the contributing trials enrolled at EVT-capable centres only)', 'Non-randomised studies']
    },
    intervention: 'Endovascular treatment alone (n=1153) — the strategy being tested for non-inferiority',
    comparator: 'Intravenous thrombolysis plus endovascular treatment (n=1160) — standard bridging care',
    primaryEndpoint: {
      definition: '90-day modified Rankin Scale score, ordinal shift; non-inferiority of EVT alone assessed against a prespecified lower 95% CI boundary of 0.82 for the adjusted common odds ratio (analogous to a 5% absolute difference in functional independence)',
      timepoint: '90 d',
      result: 'DID NOT establish non-inferiority of EVT alone: median mRS 3 (IQR 1-5) with EVT alone vs 2 (IQR 1-4) with IVT plus EVT. The CI crosses both the 0.82 non-inferiority boundary and 1.00, so this is an INDETERMINATE result — it neither establishes non-inferiority of skipping the lytic nor demonstrates superiority of bridging.',
      effectSize: 'Adjusted common OR 0.89 for a shift toward improved outcome with EVT alone',
      confidenceInterval: '95% CI 0.76 to 1.04 (prespecified non-inferiority boundary 0.82)',
      pValue: 'Not reported as a p-value; inference is by the CI against the 0.82 boundary'
    },
    secondaryEndpoints: [
      {
        name: 'Any intracranial haemorrhage',
        result: 'LESS frequent with EVT alone: OR 0.82 (95% CI 0.68 to 0.99)'
      },
      {
        name: 'Symptomatic intracranial haemorrhage',
        result: 'No significant difference between strategies'
      },
      {
        name: 'Mortality',
        result: 'No significant difference between strategies'
      },
      {
        name: 'Between-study variability',
        result: 'Small; the variation that existed related mainly to the choice and dose of thrombolytic drug and to country of execution'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage rates did not differ significantly between EVT alone and IVT plus EVT',
      mortality: 'Mortality did not differ significantly between strategies',
      other: 'Any intracranial haemorrhage occurred less frequently with EVT alone (OR 0.82, 95% CI 0.68-0.99) — the one signal that favoured omitting the lytic'
    },
    imagingCriteria: 'Per the six contributing parent trials; anterior-circulation large-vessel occlusion confirmed on vascular imaging',
    applicabilityNotes: 'This is the synthesis that resolves the DIRECT-MT / SKIP / DEVT / MR CLEAN-NO IV / SWIFT DIRECT / DIRECT-SAFE family, and it is routinely mis-stated. IRIS did NOT show bridging superior; it FAILED to show direct EVT non-inferior, and because the interval also crosses 1.00 it cannot be read as a positive trial for bridging either. That indeterminacy — not a victory for either arm — is why guidelines kept bridging as the default rather than declaring the question closed. It applies only to patients presenting DIRECTLY to an EVT-capable centre; drip-and-ship transfer is a different clinical question that these trials did not randomise. Read alongside the IRIS time-dependency analysis, which asks whether the answer changes with the clock, and alongside BRIDGE-TNK, the one trial in this family with a positive superiority result.',
    limitations: 'Six trials with heterogeneous lytic agents and doses (alteplase 0.9 mg/kg, alteplase 0.6 mg/kg, tenecteplase) and differing geography; risk of bias across included studies was low to moderate but not uniformly low; a non-inferiority framework cannot convert an indeterminate result into evidence of equivalence; funded in part by a device manufacturer (Stryker).',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-iris-ipd-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches the difference between a negative trial and an inconclusive one: the pooled data cannot exclude a meaningful loss of benefit from skipping the lytic, which is why bridging remained the default for an IVT-eligible patient presenting directly to a thrombectomy centre.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    practiceImpact: 'Reframes the bridging debate as a clock question rather than a yes/no question: the added value of a lytic before thrombectomy is large very early and shrinks toward nothing by roughly two and a half hours from onset — a gradient, not a threshold.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'direct-mt',
    shortName: 'DIRECT-MT',
    fullName: 'Endovascular Thrombectomy with or without Intravenous Alteplase in Acute Stroke',
    topic: 'bridging-ivt-before-evt',
    diseaseArea: ['acute-ischemic-stroke', 'bridging-ivt-before-evt', 'evt-early-window'],
    population: {
      n: 656,
      ageRange: 'adults',
      nihssRange: 'acute ischaemic stroke from anterior-circulation large-vessel occlusion',
      timeWindow: 'alteplase administered within 4.5 h of symptom onset',
      keyInclusion: ['Anterior-circulation large-vessel occlusion', '41 academic tertiary care centres in China', '656 enrolled of 1586 screened', 'NCT03469206'],
      keyExclusion: ['Standard contraindications to intravenous alteplase']
    },
    intervention: 'Endovascular thrombectomy alone (n=327)',
    comparator: 'Intravenous alteplase 0.9 mg/kg within 4.5 h followed by endovascular thrombectomy (n=329)',
    primaryEndpoint: {
      definition: 'Non-inferiority of thrombectomy alone for the distribution of 90-day mRS scores, judged by whether the lower boundary of the 95% CI of the adjusted common odds ratio was at or above 0.8 (a deliberately wide, 20%-relative non-inferiority margin)',
      timepoint: '90 d',
      result: 'MET non-inferiority within its prespecified 0.8 margin: thrombectomy alone was non-inferior to alteplase plus thrombectomy. The authors\' own conclusion states this holds \'within a 20% margin of confidence.\'',
      effectSize: 'Adjusted common OR 1.07',
      confidenceInterval: '95% CI 0.81 to 1.40 (lower boundary above the 0.8 margin)',
      pValue: 'P=0.04 for non-inferiority'
    },
    secondaryEndpoints: [
      {
        name: 'Successful reperfusion BEFORE thrombectomy',
        result: 'Lower without alteplase: 2.4% vs 7.0%'
      },
      {
        name: 'Overall successful reperfusion',
        result: 'Lower without alteplase: 79.4% vs 84.5%'
      },
      {
        name: '90-day mortality',
        result: '17.7% with thrombectomy alone vs 18.8% with combination therapy'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracranial haemorrhage was among the assessed secondary/safety outcomes; the abstract reports no significant excess with either strategy',
      mortality: '90-day mortality 17.7% (thrombectomy alone) vs 18.8% (alteplase plus thrombectomy)',
      other: 'Successful reperfusion — both pre-thrombectomy and overall — was consistently lower when alteplase was omitted'
    },
    imagingCriteria: 'Anterior-circulation large-vessel occlusion on vascular imaging; no perfusion-mismatch selection required',
    applicabilityNotes: 'The one clearly \'non-inferior\' verdict in this family, and the teaching value lies entirely in the margin. A lower bound of 0.8 on a common odds ratio permits a 20% relative loss of benefit — larger than most clinicians would knowingly accept in a patient who is already eligible for a lytic. Read the margin before you read the conclusion. Every subsequent Western and Asia-Pacific trial that used a tighter margin (SWIFT DIRECT -12%, DIRECT-SAFE -10%) failed to reproduce this result.',
    limitations: 'Single-country (China) trial in academic tertiary centres, limiting generalisability; open design; the wide 20%-relative non-inferiority margin is the dominant limitation and the authors themselves qualify the conclusion with it; reperfusion was measurably worse without the lytic even though the functional endpoint met its margin.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-direct-mt-2020'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The canonical worked example of why a non-inferiority margin must be read before the conclusion — a \'non-inferior\' label that tolerates a 20% relative loss of benefit is a different claim from equivalence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'A positive-looking non-inferiority result that is fragile by construction, and the fragility is the lesson. It stopped at roughly a quarter of its planned enrolment, and trials halted early for efficacy systematically overstate effect size; it used a -10% absolute margin; and it is single-country. The authors themselves attach the caveat about margin acceptability. Set against SWIFT DIRECT and DIRECT-SAFE, which used comparable or tighter margins in different populations and did NOT show non-inferiority, DEVT is the outlier rather than the confirmation.',
    limitations: 'Stopped early for efficacy at 234 of a planned 970 patients (24% of target), which inflates the apparent effect and widens true uncertainty beyond the reported interval; small absolute sample; single-country (China); open-label; -10% non-inferiority margin whose clinical acceptability the authors flag as an open question.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-devt-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'A worked example of two appraisal traps at once — early stopping for efficacy and a permissive non-inferiority margin — in a trial whose headline reads as a green light to skip the lytic.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The strongest European/Canadian evidence against omitting the lytic in an eligible patient already at an endovascular centre. It used a 12% margin — tighter than DIRECT-MT\'s 20%-relative margin — and still failed it, with an 8-percentage-point absolute shortfall in functional independence and a demonstrable reperfusion cost. The authors state plainly that the results do not support omitting alteplase before thrombectomy in eligible patients. Note the funding: Medtronic and University Hospital Bern, with a device-specific first-line protocol.',
    limitations: 'Open-label with blinded outcome assessment only; 5215 screened to randomise 423, so the enrolled population is highly selected; protocol mandated a specific stent retriever as first line, which constrains transferability to other technique; the trial is powered for non-inferiority and does not formally establish superiority of bridging.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-swift-direct-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'In an IVT-eligible patient already at a thrombectomy centre, omitting alteplase was not shown to be non-inferior and cost reperfusion — a concrete reason the bridging default survived.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the trial that puts a time boundary on the bridging question, and it is the direct counterweight to BRIDGE-TNK. BRIDGE-TNK enrolled ONLY patients within 4.5 h and found bridging tenecteplase superior there; TNK-PLUS enrolled 4.5-24 h in a perfusion-selected proximal-MCA population and found nothing. The early-window result must not be extrapolated across that boundary. Also note the direction of the family as a whole: three of the four questions in this domain are now answered differently depending on the clock, not on the drug.',
    limitations: 'Single-country (China) and open-label with blinded endpoint; n=391, so the confidence interval still admits a modest effect in either direction; the perfusion-mismatch entry criteria select a favourable-physiology subgroup and exclude much of the late-window population seen in practice; the numerically higher symptomatic haemorrhage rate rests on 10 versus 5 events and was not a prespecified tested comparison.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-tnk-plus-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Sets the boundary on the positive early-window bridging result: beyond 4.5 h, adding tenecteplase before thrombectomy did not improve 90-day independence in a perfusion-selected proximal MCA population.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The foundational negative trial for direct oral anticoagulants in mechanical heart valves, and the reason every DOAC label carries a mechanical-valve contraindication. Note what it does and does not test: dabigatran is a direct thrombin inhibitor, and the trial included patients within 7 days of valve surgery, which is where the pericardial bleeding clustered. The factor Xa question - and the question in a patient months out from surgery - was left open until PROACT Xa answered it the same way a decade later. RE-ALIGN and PROACT Xa should be read as a pair: two different drug classes, two different timing strata, one conclusion. This is also the corpus\'s only mechanical-valve anticoagulation trial other than PROACT Xa; INVICTUS covers rheumatic valvular AF, which is a different population.',
    limitations: 'Phase 2 dose-validation design with a pharmacokinetic primary endpoint, only 252 patients, terminated early for harm, and neither per-arm randomized numbers nor exclusion criteria are given in the abstract. Because all major bleeds were pericardial and one stratum was within 7 days of surgery, part of the bleeding signal reflects the early post-operative setting rather than the drug alone. Event numbers are small, so the magnitude of harm is imprecise even though the direction is not.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-re-align-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches why a direct thrombin inhibitor is not an option for a mechanical heart valve: dabigatran produced more strokes and more bleeding than warfarin and the trial was halted for harm.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'bhf-protect-tavi',
    shortName: 'BHF PROTECT-TAVI',
    fullName: 'British Heart Foundation Randomised Trial of Routine Cerebral Embolic Protection during Transcatheter Aortic-Valve Implantation (BHF PROTECT-TAVI)',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 7635,
      ageRange: 'adults with aortic stenosis undergoing TAVI; mean age 81.0 years in the 3535-participant cognitive cohort',
      nihssRange: 'not applicable - procedural stroke-prevention trial',
      timeWindow: 'randomized before TAVI; primary outcome within 72 h of the procedure or before discharge',
      keyInclusion: ['Aortic stenosis undergoing transcatheter aortic-valve implantation', '33 centres across the United Kingdom'],
      keyExclusion: []
    },
    intervention: 'TAVI with a cerebral embolic protection device (SENTINEL, Boston Scientific): 3815 randomized, 3795 in the primary analysis',
    comparator: 'TAVI without a cerebral embolic protection device: 3820 randomized, 3799 in the primary analysis',
    primaryEndpoint: {
      definition: 'Stroke within 72 hours after TAVI, or before hospital discharge if that came sooner (superiority design)',
      timepoint: 'within 72 h of TAVI or before discharge',
      result: 'NEUTRAL - routine cerebral embolic protection DID NOT reduce stroke: 81 of 3795 (2.1%) with CEP vs 82 of 3799 (2.2%) without',
      effectSize: 'Absolute difference -0.02 percentage points',
      confidenceInterval: '95% CI -0.68 to 0.63',
      pValue: 'P=0.94'
    },
    secondaryEndpoints: [
      {
        name: 'Disabling stroke',
        result: '47 participants (1.2%) with CEP vs 53 (1.4%) without'
      },
      {
        name: 'Death',
        result: '29 participants (0.8%) with CEP vs 26 (0.7%) without'
      },
      {
        name: 'Access-site complications',
        result: 'Similar in the two groups: 8.1% with CEP vs 7.7% without'
      },
      {
        name: 'Cognition - prespecified secondary analysis in the 3535 participants who underwent cognitive assessment (Circulation 2025)',
        result: 'NO benefit. Baseline-adjusted mean change in telephone MoCA from baseline to 6-8 weeks was 0.83 (95% CI 0.70-0.96) with CEP vs 0.91 (95% CI 0.79-1.04) control; between-group difference -0.07 (95% CI -0.22 to 0.09, P=0.42). A drop of at least 3 t-MoCA points occurred in 154 of 1763 (8.7%) with CEP vs 142 of 1772 (8.0%) control; risk difference 0.72% (95% CI -1.10 to 2.55, P=0.44). Robust to sensitivity analyses with no subgroup interaction'
      }
    ],
    safetyFindings: {
      sich: 'Not reported as a separate category; stroke was the adjudicated primary outcome and disabling stroke was reported separately (1.2% CEP vs 1.4% control)',
      mortality: '29 of 3798 (0.8%) with CEP vs 26 of 3803 (0.7%) without',
      other: '24 serious adverse events in 22 of 3798 participants (0.6%) with CEP vs 13 serious adverse events in 13 of 3803 (0.3%) without; overall access-site complications 8.1% vs 7.7%'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The definitive trial on filter-based cerebral embolic protection at TAVI, and at 7635 participants roughly two and a half times the size of PROTECTED TAVR. Its tight confidence interval (-0.68 to 0.63 percentage points) is what PROTECTED TAVR lacked, and the prespecified cognitive analysis closes the fallback argument that CEP might protect the brain in ways a stroke endpoint would miss. The counterpart teaching point sits in the denominator rather than the effect: about 2% of TAVI patients have a stroke within 72 hours regardless of device, which is the number that belongs in a pre-procedure conversation. The corpus has no other structural-heart procedural-stroke record, so this and PROTECTED TAVR carry the whole domain.',
    limitations: 'Open-label device trial (blinding is not feasible), single-country (UK) recruitment, and one CEP system only - the SENTINEL filter - so it does not test other device designs or deflection-based systems. The primary window is 72 h/discharge, so later strokes are not captured by the primary endpoint. The cognitive analysis is a secondary analysis restricted to the subset who completed telephone MoCA testing, uses a brief telephone instrument, and ends at 6-8 weeks.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-bhf-protect-tavi-2025', 'cit-protect-tavi-cog-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that routine filter-based cerebral embolic protection does not reduce stroke or preserve cognition at TAVI - counselling should centre on the roughly 2% procedural stroke risk itself rather than on device selection.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'protected-tavr',
    shortName: 'PROTECTED TAVR',
    fullName: 'Cerebral Embolic Protection during Transcatheter Aortic-Valve Replacement (PROTECTED TAVR)',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 3000,
      ageRange: 'adults with aortic stenosis; age distribution not reported in the abstract',
      nihssRange: 'not applicable - procedural stroke-prevention trial',
      timeWindow: 'randomized before transfemoral TAVR; primary outcome within 72 h or before discharge',
      keyInclusion: ['Aortic stenosis undergoing transfemoral TAVR', 'Sites in North America, Europe and Australia', 'A neurology professional examined every patient at baseline and after TAVR'],
      keyExclusion: []
    },
    intervention: 'Transfemoral TAVR with a cerebral embolic protection device (n=1501; the device was successfully deployed in 1406 of the 1489 patients in whom deployment was attempted, 94.4%)',
    comparator: 'Transfemoral TAVR without cerebral embolic protection (n=1499)',
    primaryEndpoint: {
      definition: 'Stroke within 72 hours after TAVR or before discharge, whichever came first, in the intention-to-treat population',
      timepoint: 'within 72 h of TAVR or before discharge',
      result: 'DID NOT show a significant effect: 2.3% with CEP vs 2.9% without. The authors state explicitly that, on the basis of the 95% confidence interval, the result may NOT rule out a benefit of CEP - this is an indeterminate trial, not a demonstrated null',
      effectSize: 'Absolute difference -0.6 percentage points',
      confidenceInterval: '95% CI -1.7 to 0.5',
      pValue: 'P=0.30'
    },
    secondaryEndpoints: [
      {
        name: 'Disabling stroke',
        result: '0.5% with CEP vs 1.3% without - the numerical difference that sustained the case for CEP until BHF PROTECT-TAVI reported'
      },
      {
        name: 'Death',
        result: '0.5% with CEP vs 0.3% without'
      },
      {
        name: 'Stroke, TIA or delirium',
        result: '3.1% with CEP vs 3.7% without'
      },
      {
        name: 'Acute kidney injury',
        result: '0.5% in both groups'
      }
    ],
    safetyFindings: {
      sich: 'Not reported as a separate category',
      mortality: '0.5% with CEP vs 0.3% without',
      other: 'One patient (0.1%) had a vascular complication at the CEP access site; the device was successfully deployed in 94.4% of attempts'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The reason this record belongs in the corpus alongside BHF PROTECT-TAVI is methodological as much as clinical: PROTECTED TAVR is a worked example of the difference between \'no significant effect\' and \'no effect\'. Its confidence interval (-1.7 to 0.5 percentage points) was wide enough to contain a clinically worthwhile benefit, and its own authors said so; the disabling-stroke split of 0.5% vs 1.3% then sustained three years of argument for routine CEP. The much larger BHF PROTECT-TAVI later produced an interval an order of magnitude tighter and found nothing. Teach the pair together, and use PROTECTED TAVR when explaining why a P value above 0.05 is not evidence of absence.',
    limitations: 'Underpowered for the observed event rate, so the primary result is indeterminate rather than null - the confidence interval does not exclude a meaningful benefit. Disabling stroke was a secondary endpoint with very few events (0.5% vs 1.3%), so that difference is hypothesis-generating only and should never be quoted as a demonstrated effect. Open-label device trial; restricted to transfemoral access.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-protected-tavr-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the source of the persistent \'disabling stroke 0.5% vs 1.3%\' claim for cerebral embolic protection, and the teaching that this trial could not exclude benefit while the later, larger BHF PROTECT-TAVI could.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'warfarin-resumption-ich-mechanical-valve',
    shortName: 'Warfarin resumption after ICH with a mechanical valve (meta-analysis)',
    fullName: 'Resumption of Warfarin After Intracranial Hemorrhage in Patients With Mechanical Heart Valves: A Systematic Review and Meta-Analysis',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['ich', 'secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 788,
      ageRange: 'adults; age distribution not reported in the abstract',
      nihssRange: 'not applicable - intracranial hemorrhage cohort',
      timeWindow: 'from the index intracranial hemorrhage through the interruption and resumption period, as reported by the included studies',
      keyInclusion: ['Adults with intracranial hemorrhage who required anticoagulation for a mechanical heart valve', '13 studies: 12 retrospective, 1 prospective observational', 'Databases searched from inception to 23 August 2024'],
      keyExclusion: ['No randomized trial exists in this population, so none could be included']
    },
    intervention: 'Resumption of warfarin after intracranial hemorrhage (pooled hemorrhagic-recurrence rate)',
    comparator: 'Interruption of anticoagulation (pooled ischemic-stroke rate while off anticoagulation) - these are POOLED SINGLE-ARM proportions, not a head-to-head comparison',
    primaryEndpoint: {
      definition: 'Two pooled single-arm event rates: ischemic stroke while off anticoagulation, and hemorrhagic recurrence after anticoagulation was resumed. There is NO randomized comparison, no allocated strategy and no non-inferiority margin - the two rates come from different time periods within the same cohorts',
      timepoint: 'in-hospital and short-term follow-up as reported by the 13 included studies',
      result: 'While off anticoagulation, 32 patients had an ischemic stroke - pooled event rate 5.23%, with a pooled average time to stroke of 8.08 days. After anticoagulation was resumed, 73 patients had a hemorrhagic recurrence - pooled event rate 10.95%. The authors conclude that withholding anticoagulation for up to 7 days appears relatively safe, while stating that the included studies were observational and carried SERIOUS OR CRITICAL risk of bias and that randomized trials are needed',
      effectSize: 'Ischemic stroke off anticoagulation 5.23%; hemorrhagic recurrence after resumption 10.95%; pooled average time to stroke 8.08 days',
      confidenceInterval: '95% CI 3.80-7.20% for ischemic stroke off anticoagulation (I-squared 0%); 95% CI 1.99-14.18 days for time to stroke; hemorrhagic recurrence I-squared 40.4% (pooled CI not given in the abstract)',
      pValue: 'Not applicable - pooled single-arm proportions with no between-group test'
    },
    secondaryEndpoints: [
      {
        name: 'Heterogeneity of the ischemic-stroke estimate',
        result: 'I-squared 0% across the 13 studies - the 5.23% figure is consistent, which is unusual for a retrospective literature'
      },
      {
        name: 'Risk of bias',
        result: 'All included studies were observational and were judged at serious or critical risk of bias by the authors'
      }
    ],
    safetyFindings: {
      sich: 'Hemorrhagic recurrence after resumption was the safety endpoint: pooled rate 10.95%, roughly twice the ischemic-stroke rate during interruption',
      mortality: 'Not reported in the abstract',
      other: 'The two rates are not directly comparable in severity: an off-anticoagulation valve thromboembolism and a hematoma expansion carry different consequences, and the pooled analysis does not weight them'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the classic overnight neuro-ICU consult - the mechanical-valve patient who has just bled intracranially - and until now the corpus had no quantitative anchor for it at all. The numbers give shape to the dilemma: ischemic stroke off anticoagulation clusters around day 8 and affects about 1 in 20, while rebleeding after resumption is about twice as common. That is the arithmetic behind the widely used roughly 7-day hold. It sits alongside the corpus\'s ICH anticoagulation-resumption records for atrial fibrillation, but a mechanical valve is a materially higher-thrombotic-risk situation than AF and the AF data should not be transplanted onto it. Crucially, all of this is observational: the decision remains individualized and is made with cardiology and neurosurgery, not read off a pooled percentage.',
    limitations: 'Twelve of thirteen included studies are retrospective and the authors judged all of them at serious or critical risk of bias; there are no randomized data. The comparison is between pooled single-arm rates from different time periods, so it is vulnerable to survivorship and indication bias - patients who were resumed early are those judged to have stable hematomas. Valve position, valve generation and INR intensity are not disaggregated, and the abstract gives no pooled confidence interval for the hemorrhagic-recurrence rate. Absolute numbers are small: 32 ischemic strokes and 73 hemorrhagic recurrences across 788 patients.',
    certainty: 'very-low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-warfarin-ich-mhv-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Puts numbers on the mechanical-valve ICH dilemma for teaching: about 5% have an ischemic stroke while off anticoagulation, clustering around day 8, versus about 11% rebleeding after resumption - all from observational studies at serious or critical risk of bias.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'lv-thrombus-doac-rct-meta',
    shortName: 'DOACs vs warfarin for LV thrombus (RCT meta-analysis)',
    fullName: 'Direct oral anticoagulants or warfarin in left ventricular thrombus: an updated systematic review and meta-analysis of randomized trials',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 554,
      ageRange: 'adults; age distribution not reported in the abstract',
      nihssRange: 'not applicable - anticoagulation trials in LV thrombus, not a stroke cohort',
      timeWindow: 'thrombus resolution assessed at 1 month and 3 months',
      keyInclusion: ['Randomized controlled trials comparing a DOAC with warfarin in left ventricular thrombus', '7 RCTs, 554 patients, of whom 319 received a DOAC', 'Predominantly left ventricular thrombus following acute myocardial infarction'],
      keyExclusion: ['Non-randomized studies were excluded - this is a deliberately RCT-only synthesis']
    },
    intervention: 'Direct oral anticoagulants (n=319 across the 7 trials)',
    comparator: 'Warfarin (n=235 across the 7 trials)',
    primaryEndpoint: {
      definition: 'Left ventricular thrombus resolution on imaging at 1 month and at 3 months - a SURROGATE imaging endpoint. The pooled analysis is not powered for stroke, systemic embolism or death',
      timepoint: '1 month and 3 months',
      result: 'NEUTRAL at both timepoints - no significant difference between DOACs and warfarin: OR 1.69 at 1 month and OR 1.39 at 3 months. The authors conclude DOACs showed comparable efficacy and safety and are a reasonable alternative to warfarin, while calling for further large-scale trials',
      effectSize: 'OR 1.69 for resolution at 1 month; OR 1.39 at 3 months',
      confidenceInterval: '95% CI 0.62-4.60 at 1 month (I-squared 69%); 95% CI 0.82-2.37 at 3 months (I-squared 0%)',
      pValue: 'p=0.31 at 1 month; p=0.22 at 3 months'
    },
    secondaryEndpoints: [
      {
        name: 'Major bleeding',
        result: 'OR 0.51 (95% CI 0.12-2.12) - an interval spanning a fourfold reduction to a twofold increase, so uninformative'
      },
      {
        name: 'Stroke or systemic embolism',
        result: 'OR 0.69 (95% CI 0.10-4.64) - far too wide to establish equivalence on the outcome that actually matters'
      },
      {
        name: 'All-cause mortality',
        result: 'OR 0.86 (95% CI 0.31-2.40)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately; intracranial hemorrhage is subsumed within the major-bleeding endpoint',
      mortality: 'All-cause mortality OR 0.86 (95% CI 0.31-2.40) - no difference detected, but the interval is very wide',
      other: 'Major bleeding OR 0.51 (95% CI 0.12-2.12). Every clinical-event interval in this synthesis is compatible with both benefit and harm'
    },
    imagingCriteria: 'Left ventricular thrombus confirmed on imaging (echocardiography in most included trials); the authors note that future trials should use advanced imaging',
    applicabilityNotes: 'This is the whole randomized evidence base for a decision clinicians make weekly, and it amounts to 554 patients. Read the abstract\'s conclusion and its confidence intervals against each other: the authors call DOACs \'a reasonable alternative\', which is a fair reading of no detected difference, but the interval on stroke or systemic embolism (0.10 to 4.64) cannot distinguish a large benefit from a large harm. That is absence of evidence, not evidence of equivalence, and it is the honest framing for a patient asking whether they can avoid INR monitoring. The single largest contributing trial, RIVAWAR, is in the corpus as its own record. RELEVENT, currently recruiting in Australia and New Zealand, is the first trial to replace the imaging-only endpoint with a net-clinical-benefit composite.',
    limitations: 'Only 554 randomized patients across 7 trials, so every clinical-outcome estimate is imprecise. The primary endpoint is thrombus resolution on imaging - a surrogate that has never been validated against stroke reduction in this population. Substantial heterogeneity at 1 month (I-squared 69%). The included trials are mostly open-label, use different DOACs at different doses, and are dominated by post-myocardial-infarction thrombus, so the results may not transfer to LV thrombus from a non-ischemic cardiomyopathy. The abstract does not give a per-trial breakdown.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-lvt-doac-meta-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that across all 7 randomized trials and 554 patients, DOACs and warfarin are statistically indistinguishable for LV thrombus - but that the intervals on stroke and bleeding are far too wide to call this proven equivalence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'rivawar',
    shortName: 'RIVAWAR',
    fullName: 'Rivaroxaban vs Warfarin in Acute Left Ventricular Thrombus Following Myocardial Infarction (RIVAWAR): An Open-Label Randomised Controlled Trial',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 261,
      ageRange: 'adults; groups similar in age, sex and MI subtype, but the age range is not given in the abstract',
      nihssRange: 'not applicable - LV thrombus cohort, not a stroke cohort',
      timeWindow: 'LV thrombus diagnosed during the index myocardial-infarction admission; treatment for 12 weeks',
      keyInclusion: ['Acute left ventricular thrombus diagnosed during the initial myocardial-infarction hospitalization', 'Most participants had ST-segment-elevation MI and severe LV dysfunction'],
      keyExclusion: []
    },
    intervention: 'Rivaroxaban 20 mg once daily for 12 weeks (n=171)',
    comparator: 'Warfarin, target INR 2-3, for 12 weeks (n=90); randomization was 2:1',
    primaryEndpoint: {
      definition: 'Left ventricular thrombus resolution on echocardiography at 4 and 12 weeks - an open-label NON-INFERIORITY design with an IMAGING endpoint. The numeric non-inferiority margin is not stated in the abstract',
      timepoint: '4 weeks and 12 weeks',
      result: 'Resolution was HIGHER with rivaroxaban at 4 weeks (20% vs 8%) and EQUIVALENT at 12 weeks (95.8% vs 96.6%). By the 12-week endpoint both arms exceeded 95% resolution',
      effectSize: '4 weeks: 20% vs 8%; 12 weeks: 95.8% vs 96.6%',
      confidenceInterval: 'Not reported in the abstract',
      pValue: 'P=0.017 at 4 weeks; P=0.759 at 12 weeks'
    },
    secondaryEndpoints: [
      {
        name: 'Cumulative all-cause mortality',
        result: '3.5% with rivaroxaban vs 3.3% with warfarin (P=0.921)'
      },
      {
        name: 'Major bleeding',
        result: '2.3% with rivaroxaban vs 1.1% with warfarin (P=0.491)'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the abstract',
      mortality: 'Cumulative all-cause mortality 3.5% vs 3.3% (P=0.921)',
      other: 'Major bleeding 2.3% vs 1.1% (P=0.491) - with 261 patients the trial has no power to detect a bleeding difference of the size that would matter'
    },
    imagingCriteria: 'Left ventricular thrombus diagnosed and followed on transthoracic echocardiography',
    applicabilityNotes: 'The largest single randomized trial in the left-ventricular-thrombus evidence base and the dominant contributor to the RCT-only meta-analysis also in this corpus. The two timepoints teach different things. The 4-week difference (20% vs 8%) is real but is a difference in the speed of an imaging surrogate; the 12-week result - above 95% resolution in both arms - is the one that matters for a 3-month treatment decision, and it shows no separation. Neither timepoint speaks to stroke: with 261 patients and roughly 3% mortality there is no power for clinical events, which is exactly the gap the RELEVENT trial\'s net-clinical-benefit composite is designed to close. Note also that resolution of thrombus on echocardiography is not the same as resolution of embolic risk.',
    limitations: 'Open-label, single-institution (National Institute of Cardiovascular Diseases, Karachi), 2:1 randomization, and powered for an imaging surrogate rather than for stroke, systemic embolism or death - the authors themselves call for multicentre trials with longer follow-up. No confidence intervals are reported for the primary endpoint and the non-inferiority margin is not stated in the abstract. Restricted to post-MI thrombus, mostly STEMI with severe LV dysfunction, so it does not address thrombus in non-ischemic cardiomyopathy. Follow-up ends at 12 weeks.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-rivawar-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that rivaroxaban clears post-MI LV thrombus faster than warfarin at 4 weeks but that both exceed 95% resolution by 12 weeks - and that both endpoints are imaging surrogates in a trial with no power for stroke or death.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'aries-hm3',
    shortName: 'ARIES-HM3',
    fullName: 'Aspirin and Hemocompatibility Events With a Left Ventricular Assist Device in Advanced Heart Failure: The ARIES-HM3 Randomized Clinical Trial',
    topic: 'cardiac-source-stroke',
    diseaseArea: ['secondary-prevention', 'cardiac-source-stroke'],
    population: {
      n: 628,
      ageRange: 'adults with advanced heart failure; age range not reported in the abstract. Of the 589 analysed, 77% were men, one third were Black and 61% were White',
      nihssRange: 'not applicable - device antithrombotic trial; stroke is a component of the composite',
      timeWindow: 'enrolled July 2020 to September 2022; median follow-up 14 months; primary endpoint at 12 months',
      keyInclusion: ['Advanced heart failure with a fully magnetically levitated (HeartMate 3) left ventricular assist device', '51 centres with advanced-heart-failure expertise across 9 countries', 'All participants received vitamin K antagonist therapy'],
      keyExclusion: []
    },
    intervention: 'Placebo in place of aspirin, on top of vitamin K antagonist therapy (314 randomized; 296 in the primary analysis population)',
    comparator: 'Aspirin 100 mg/d on top of vitamin K antagonist therapy (314 randomized; 293 in the primary analysis population)',
    primaryEndpoint: {
      definition: 'Survival free of a major nonsurgical (more than 14 days after implant) hemocompatibility-related adverse event - stroke, pump thrombosis, major bleeding, or arterial peripheral thromboembolism - at 12 months, tested for NON-INFERIORITY of placebo against a -10% margin. The claim is non-inferiority, NOT superiority',
      timepoint: '12 months',
      result: 'Placebo (aspirin avoidance) MET non-inferiority: 74% of the placebo group vs 68% of the aspirin group were alive and free of hemocompatibility events at 12 months',
      effectSize: 'Absolute between-group difference 6.0 percentage points in event-free survival, favouring placebo',
      confidenceInterval: 'Lower 1-sided 97.5% CI -1.6%',
      pValue: 'P<0.001 for non-inferiority'
    },
    secondaryEndpoints: [
      {
        name: 'Nonsurgical bleeding events (principal secondary endpoint)',
        result: 'REDUCED with aspirin avoidance: relative risk 0.66 (95% confidence limit 0.51-0.85), P=0.002'
      },
      {
        name: 'Stroke and other thromboembolic events',
        result: 'NO increase with aspirin avoidance, and the finding was consistent across diverse patient subgroups'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately; stroke was a component of the hemocompatibility composite and did not increase when aspirin was withdrawn',
      mortality: 'Not reported separately in the abstract; survival is embedded in the composite primary endpoint',
      other: 'Nonsurgical bleeding was reduced with aspirin avoidance (RR 0.66, 95% confidence limit 0.51-0.85, P=0.002), with no offsetting increase in thromboembolism'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The corpus\'s only LVAD record, and a useful corrective to the reflex that more antithrombotic therapy means less stroke. Aspirin had been mandated alongside a vitamin K antagonist in continuous-flow LVADs without conclusive supporting evidence; when it was formally removed in a fully magnetically levitated device, bleeding fell by a third and stroke did not rise. Two cautions when teaching it. First, the primary claim is non-inferiority against a -10% margin, so the correct statement is that placebo was not worse, not that it was better - even though the point estimate favours placebo by 6 percentage points. Second, this is specific to the HeartMate 3 on a vitamin K antagonist; it does not generalise to earlier axial-flow pumps or to a patient not on a VKA.',
    limitations: 'Non-inferiority design with a -10% margin, so a modest true disadvantage of aspirin avoidance would not have been excluded; the composite endpoint bundles stroke, pump thrombosis, major bleeding and peripheral thromboembolism together, and the bleeding component drives most of the difference. Confined to one device (HeartMate 3) with background vitamin K antagonist therapy. 39 of the 628 randomized patients are not in the primary analysis population. Median follow-up 14 months, so late thrombotic risk is not characterised.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aries-hm3-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that on a HeartMate 3 with a vitamin K antagonist, adding aspirin does not protect against stroke or pump thrombosis and increases nonsurgical bleeding - a rare instance where less antithrombotic therapy is the evidence-supported answer.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ie-lvo-thrombectomy-meta',
    shortName: 'Thrombectomy for IE-related LVO (meta-analysis)',
    fullName: 'Efficacy and Safety of Mechanical Thrombectomy for Patients with Infective Endocarditis-Related Large Vessel Occlusion: a Systematic Review and Meta-Analysis',
    topic: 'endocarditis-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'cardiac-source-stroke', 'endocarditis-stroke'],
    population: {
      n: 2037,
      ageRange: 'mean age 57.9 years; 62.3% women',
      nihssRange: 'not reported in the abstract',
      timeWindow: 'acute large-vessel-occlusion stroke; individual treatment windows not reported in the pooled abstract',
      keyInclusion: ['Acute ischemic stroke due to large-vessel occlusion in the setting of infective endocarditis', '8 studies published between 2017 and 2024; 1401 of the 2037 patients (69%) received mechanical or endovascular thrombectomy', 'Databases searched from inception to December 2024'],
      keyExclusion: ['No randomized trial exists in this population - all 8 included studies are OBSERVATIONAL']
    },
    intervention: 'Mechanical or endovascular thrombectomy for infective-endocarditis-related large-vessel occlusion (n=1401 across the 8 studies)',
    comparator: 'Pooled single-arm proportions, with an additional comparison against non-IE large-vessel-occlusion patients treated with thrombectomy in the studies that reported both',
    primaryEndpoint: {
      definition: 'Pooled proportion achieving a favourable functional outcome (mRS 0-2) at 90 days, with successful recanalization, symptomatic and any intracranial hemorrhage and mortality as further pooled proportions. These are POOLED OBSERVATIONAL proportions, not a randomized treatment effect',
      timepoint: '90 days for functional outcome; procedural for recanalization',
      result: 'Favourable outcome (mRS 0-2) at 90 days in 29.0% of patients, with successful recanalization (mTICI 2b-3) in 76.0%. Compared with non-IE large-vessel occlusion treated with thrombectomy, IE patients had a SIGNIFICANTLY LOWER rate of favourable outcome (RR 0.48) with no significant difference in any intracranial hemorrhage (RR 1.38, 95% CI 0.96-1.98)',
      effectSize: 'mRS 0-2 at 90 days 29.0%; successful recanalization 76.0%; RR 0.48 for favourable outcome versus non-IE LVO',
      confidenceInterval: '95% CI 14.0-43.0% for mRS 0-2 (I-squared 65.7%); 95% CI 68.0-84.0% for recanalization (I-squared 23.6%); 95% CI 0.31-0.75 for the RR versus non-IE LVO (I-squared 0.0%)',
      pValue: 'Not reported in the abstract'
    },
    secondaryEndpoints: [
      {
        name: 'Symptomatic intracranial hemorrhage',
        result: 'Pooled 19.0% (95% CI 0.0-38.0%, I-squared 49.2%) - an interval running from zero to nearly 40%, which is effectively uninformative and must not be quoted as a point estimate'
      },
      {
        name: 'Any intracranial hemorrhage',
        result: 'Pooled 30.0% (95% CI 23.0-38.0%, I-squared 78.3%); versus non-IE LVO treated with thrombectomy, RR 1.38 (95% CI 0.96-1.98, I-squared 62.4%) - no significant difference'
      },
      {
        name: 'All-cause mortality',
        result: 'Pooled 33.0% (95% CI 21.0-45.0%, I-squared 90.4%) - heterogeneity so extreme that the pooled figure describes the literature more than any patient'
      }
    ],
    safetyFindings: {
      sich: 'Pooled symptomatic intracranial hemorrhage 19.0% (95% CI 0.0-38.0%) - the confidence interval is too wide to support any numeric counselling figure',
      mortality: 'Pooled all-cause mortality 33.0% (95% CI 21.0-45.0%), with I-squared 90.4%',
      other: 'Any intracranial hemorrhage 30.0%, which was NOT significantly higher than in thrombectomy for non-IE large-vessel occlusion (RR 1.38, 95% CI 0.96-1.98)'
    },
    imagingCriteria: 'Large-vessel occlusion on angiographic or CT/MR angiographic imaging; recanalization graded by mTICI',
    applicabilityNotes: 'Fills the evidence gap behind a recommendation the app already makes. The useful asymmetry to teach is that intravenous thrombolysis is avoided in endocarditis-associated stroke because of the hemorrhage risk from friable septic emboli and possible infectious aneurysms, whereas mechanical thrombectomy removes the clot without a lytic, and in these pooled series achieved successful recanalization in about three quarters of patients with any-ICH rates not significantly different from non-IE thrombectomy. What is clearly worse is the functional outcome - roughly half the rate of mRS 0-2 - which reflects the underlying illness, the multiterritory embolic burden and the systemic sepsis rather than the procedure. Everything here is pooled observational data with severe heterogeneity, so these numbers support a case-by-case discussion with cardiology and infectious diseases, not a threshold rule.',
    limitations: 'All 8 included studies are observational, published 2017-2024, and heterogeneity is severe for the outcomes that matter most (I-squared 78.3% for any ICH, 90.4% for mortality). The symptomatic-ICH interval spans 0-38%, which is uninformative. Selection bias is inherent and runs toward better-looking results: patients selected for thrombectomy in these series are those judged salvageable, and it is likely that the sickest were never offered the procedure - the pooled outcomes therefore cannot be read as what would happen if thrombectomy were offered to everyone. No baseline NIHSS, time metrics or comparison against medical management within the IE population are given in the abstract.',
    certainty: 'very-low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ie-lvo-mt-meta-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the actual numbers behind teaching on thrombectomy in endocarditis-related large-vessel occlusion - about 76% recanalization and 29% mRS 0-2, with any-ICH not significantly higher than in non-IE thrombectomy - from pooled observational series with severe heterogeneity.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ie-vs-af-stroke-imaging-phenotype',
    shortName: 'IE-associated vs AF-associated stroke imaging phenotype',
    fullName: 'Clinical and Imaging Characteristics of Infective Endocarditis-Associated Versus Atrial Fibrillation-Associated Stroke',
    topic: 'endocarditis-stroke',
    diseaseArea: ['acute-ischemic-stroke', 'cardiac-source-stroke', 'endocarditis-stroke'],
    population: {
      n: 323,
      ageRange: 'not reported in the abstract; younger age was an independent predictor of IE-associated stroke',
      nihssRange: 'not reported in the abstract',
      timeWindow: 'acute embolic infarction at presentation; outcomes to 3 months',
      keyInclusion: ['170 patients with embolic infarction and infective endocarditis diagnosed on transthoracic echocardiography', '153 comparator patients with atrial-fibrillation stroke who presented WITH FEVER - a deliberately hard comparator, since fever is what makes the two hard to tell apart', 'Single-centre retrospective review'],
      keyExclusion: ['Afebrile atrial-fibrillation stroke, which would have made the comparison artificially easy']
    },
    intervention: 'Infective-endocarditis-associated stroke (n=170) - this is a DIAGNOSTIC comparison, not a treatment',
    comparator: 'Atrial-fibrillation-associated stroke presenting with fever (n=153)',
    primaryEndpoint: {
      definition: 'Comparison of clinical and imaging characteristics - lesion size, lesion number and number of vascular territories involved - between IE-associated and AF-associated stroke, with logistic regression for independent predictors of IE-associated stroke',
      timepoint: 'at presentation, with recurrence and mortality followed to 3 months',
      result: 'IE-associated strokes were SMALLER (21.6 plus or minus 19.3 mm vs 66.9 plus or minus 38.0 mm), more often numerous (more than 10 lesions in 44.7% vs 5.2%), and far more often involved both anterior and posterior circulations bilaterally (54.1% vs 2.6%). Independent predictors of IE-associated stroke were younger age (OR 0.87), smaller lesion size (OR 0.94) and 3-territory involvement (OR 81.21)',
      effectSize: 'Lesion size 21.6 plus or minus 19.3 mm vs 66.9 plus or minus 38.0 mm; more than 10 lesions 44.7% vs 5.2%; bilateral anterior-posterior involvement 54.1% vs 2.6%; OR 81.21 for 3-territory involvement',
      confidenceInterval: '95% CI 0.82-0.92 for age; 95% CI 0.92-0.97 for lesion size; 95% CI 16.20-407.00 for 3-territory involvement - an interval so wide that it signals near-complete separation of the groups rather than a calibrated effect size',
      pValue: 'P<0.001 for the lesion-size, lesion-number and territory comparisons and for each independent predictor'
    },
    secondaryEndpoints: [
      {
        name: 'Parenchymal hematoma',
        result: 'COMPARABLE between groups despite the large difference in lesion size: 12.9% in IE-stroke vs 11.1% in AF-stroke (P=0.614)'
      },
      {
        name: 'Ischemic lesion recurrence',
        result: 'Substantially higher in IE-stroke: 53.2% vs 18.1% (OR 6.94, 95% CI 3.41-14.12)'
      },
      {
        name: '3-month mortality',
        result: 'Unadjusted mortality did NOT differ between groups; on adjusted analysis IE-stroke had higher odds of 3-month mortality (OR 3.82, 95% CI 1.71-8.50, P=0.001)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable - this is a diagnostic-phenotype study with no intervention. Parenchymal hematoma rates were similar between groups (12.9% vs 11.1%, P=0.614)',
      mortality: 'Unadjusted 3-month mortality did not differ; adjusted odds of 3-month mortality were higher in IE-stroke (OR 3.82, 95% CI 1.71-8.50)',
      other: 'More than half of IE-stroke patients (53.2%) developed new ischemic lesions during follow-up, versus 18.1% of AF-stroke patients'
    },
    imagingCriteria: 'Brain imaging characterised by lesion size, lesion number and number of vascular territories involved; infective endocarditis was diagnosed on transthoracic echocardiography',
    applicabilityNotes: 'A pattern-recognition record rather than a treatment record, and it fills a specific hole: the corpus already teaches the three-territory sign for cancer-associated stroke and taught nothing about the endocarditis phenotype. The picture is numerous small infarcts scattered across three vascular territories in a younger, febrile patient - which should prompt blood cultures and echocardiography rather than an atrial-fibrillation workup. Two further points carry clinical weight. Recurrence during the admission is the rule rather than the exception (53.2%), so a new deficit in an IE patient is more likely a new embolus than an extension. And parenchymal hematoma rates were the same as in AF-stroke despite much smaller infarcts, which is a reminder that the hemorrhagic risk in endocarditis does not scale with infarct volume. The odds ratio of 81 for three-territory involvement should be quoted as a very strong association, never as a calibrated number - its interval runs from 16 to 407.',
    limitations: 'Single-centre and retrospective, so both selection and verification bias apply - endocarditis was diagnosed on transthoracic echocardiography, which is less sensitive than transesophageal imaging, so some IE cases will have been missed and misclassified into the comparator. The extremely wide interval on three-territory involvement (16.20-407.00) indicates near-separation of the groups, which means the model is unstable, not that the effect is enormous. The comparator group is specifically febrile AF-stroke, which is a narrow and unusual population. Baseline NIHSS is not reported, and the adjusted mortality analysis is a secondary finding in 323 patients.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-ie-vs-af-imaging-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches the imaging signature that should prompt blood cultures and echocardiography rather than an AF workup - numerous small infarcts spread across three vascular territories in a younger febrile patient - and sets the expectation that new ischemic lesions occur in more than half of these patients during follow-up.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    intervention: 'First-line contact aspiration immediately prior to mechanical thrombectomy (n=192); adjunctive technique permitted per operator standard of care',
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
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'ASTER2 is the cleanest teaching example in this category of an endpoint-timing artefact. Measured after the assigned first-line technique alone, the combined approach clearly reperfused better (eTICI 2b50/2c/3 86.2% vs 72.3%, adjusted OR 2.54). Measured at the end of the whole procedure — the prespecified primary — that advantage had disappeared (64.5% vs 57.9%, P=.17), because rescue manoeuvres in the stent-retriever arm caught up. The lesson generalises: an angiographic advantage that rescue technique can erase is not a reason to change first-line practice.',
    limitations: 'Angiographic primary endpoint with no clinical primary; the authors themselves note the trial may have been underpowered to detect smaller between-group differences; open label with blinded endpoint evaluation; single-country (France); enrolment window of 8 h narrower than current practice.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-aster2-2021'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Does not support routinely combining contact aspiration with a stent retriever on the first pass; the first-pass reperfusion advantage does not survive to the end of the procedure.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS greater than 10 required for entry; median NIHSS 17',
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
    applicabilityNotes: 'SIESTA was designed to confirm the observational literature that general anesthesia is harmful, and it did the opposite: the primary endpoint was flat and the 3-month functional secondary favoured general anesthesia. The 37.0% vs 18.2% figure is an unadjusted secondary outcome in a 150-patient single-centre trial, so it is hypothesis-generating, not a result to act on alone — but it is the observation that reopened the anesthesia question and led to GOLIATH, AnStroke, CANVAS II and the pooled Bayesian analysis. The airway cost is real and belongs beside the efficacy signal.',
    limitations: 'Single centre; n=150; primary endpoint was a 24-h neurological score rather than 90-day disability; open label with blinded outcome evaluation; 47 secondary outcomes analysed without a stated multiplicity correction, so the significant ones must be read as exploratory; entry restricted to NIHSS greater than 10, so it says nothing about milder deficits.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-siesta-2016'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Does not support routinely avoiding general anesthesia for thrombectomy; teaches that the airway decision trades procedural stillness against hypothermia, delayed extubation and pneumonia.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    limitations: 'Single centre with a highly selected sample (1,501 screened, 128 enrolled), which limits generalisability; primary endpoint was an imaging surrogate; the favourable functional finding is a secondary outcome with a credible interval bounded near 1; 6 h window only; open label with blinded endpoint evaluation.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-goliath-2018'],
    relatedActiveTrialIds: [],
    practiceImpact: 'General anesthesia for thrombectomy did not produce worse tissue or clinical outcomes than conscious sedation, so an anesthesia plan should be chosen on airway, agitation and workflow grounds rather than on a presumed harm from intubation.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'AnStroke is the flattest of the three European single-centre anesthesia trials — no signal anywhere, in either direction. Its distinctive contribution is physiological: the investigators managed intraprocedural blood pressure to protocol and found no difference in blood-pressure decline between arms, which removes the mechanism most often invoked to explain the harm seen in retrospective series. That is the strongest available argument that the observational association between general anesthesia and poor outcome was confounding by stroke severity, not a causal effect of the anesthetic.',
    limitations: 'Single centre; n=90, badly underpowered for a 90-day functional endpoint (a null result here is uninformative about modest effects); the PubMed abstract\'s rendering of several dispersion statistics is garbled, so only the point estimates and p-values are reproduced here; onset-to-treatment window and NIHSS range not stated in the abstract.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-anstroke-2017'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a neutral, physiologically controlled data point: with blood pressure managed to protocol, general anesthesia and conscious sedation produced the same 3-month outcomes.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the record that makes the anesthesia category legible: SIESTA, GOLIATH, AnStroke and CANVAS II were each individually neutral on their primary endpoints, and pooling all ten randomized trials produces a functional-outcome estimate whose credible interval still crosses 1 (OR 1.24, 95% CrI 0.94-1.66). A 94.2% posterior probability of superiority sounds decisive and is not: it is the probability that the true effect is on the favourable side of no effect, not a demonstration of benefit, and the authors themselves conclude only that general anesthesia \'may be preferred but confirmatory evidence is needed\'. The one unambiguous finding is reperfusion (OR 1.73, CrI 1.23-2.43), and that is bought with four-fold more intraoperative hypotension.',
    limitations: 'Pools open-label trials with heterogeneous non-general-anesthesia comparators, so the control condition is not one thing; several contributing trials are small single-centre studies; Bayesian posterior probabilities depend on the choice of weakly informative priors; a pooled estimate cannot resolve which patient should get which airway; the reperfusion advantage is an angiographic surrogate that did not translate into an unambiguous functional gain.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ga-nonga-bayesian-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Across all ten randomized trials, general anesthesia improves reperfusion and shows a functional-outcome signal that does not reach the level of demonstrated benefit, while costing more intraprocedural hypotension and pneumonia — a reason to stop treating conscious sedation as the safer default, not a mandate to intubate everyone.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'discount',
    shortName: 'DISCOUNT',
    fullName: 'Mechanical Thrombectomy in Ischemic Stroke With a Medium or Distal Arterial Occlusion: The DISCOUNT Randomized Clinical Trial',
    topic: 'evt-mevo',
    diseaseArea: ['acute-ischemic-stroke', 'evt-mevo'],
    population: {
      n: 244,
      ageRange: 'median 75 y (IQR 67-81); 56% male',
      nihssRange: 'median NIHSS 8 (IQR 6-12)',
      timeWindow: 'Within 8 h of symptom onset, or within 24 h of last seen well if no hyperintense signal was present on FLAIR imaging',
      keyInclusion: ['Acute ischemic stroke due to a PRIMARY and ISOLATED medium or distal vessel occlusion', '22 stroke centres in France, November 2021 to April 2025', '244 of a planned 488 patients randomized before the trial was stopped', 'NCT05030142'],
      keyExclusion: []
    },
    intervention: 'Mechanical thrombectomy in addition to medical treatment (n=123); 100 of the 123 (81%) actually received thrombectomy',
    comparator: 'Medical treatment alone (n=121); none received thrombectomy',
    primaryEndpoint: {
      definition: 'Good clinical outcome at 3 months, defined as mRS 0-2, assessed by an independent blinded assessor',
      timepoint: '3 months',
      result: 'DID NOT meet its endpoint, with the point estimate favouring medical treatment alone: 72/116 (62%) with thrombectomy vs 81/119 (68%) with medical treatment alone. The trial was STOPPED at the planned interim analysis on the recommendation of the data and safety monitoring board for futility AND an increased rate of symptomatic intracranial hemorrhage with thrombectomy.',
      effectSize: 'Odds ratio 0.73; adjusted absolute difference -6.8%',
      confidenceInterval: '95% CI 0.40 to 1.31 for the odds ratio; 95% CI -19.4% to 5.7% for the adjusted absolute difference',
      pValue: 'P=.29'
    },
    secondaryEndpoints: [
      {
        name: 'Follow-up completeness',
        result: '217 of 244 randomized patients (89%) completed follow-up'
      },
      {
        name: 'Trial conduct',
        result: 'Halted at the planned interim analysis at 244 of a planned 488 patients on DSMB recommendation'
      }
    ],
    safetyFindings: {
      sich: 'AS-TREATED, NOT RANDOMIZED: among the 100 patients who actually underwent thrombectomy compared with those who did not, symptomatic intracranial hemorrhage occurred in 11% vs 3% (P=.008). This comparison describes the procedural risk borne by patients who had the procedure; it is not a randomized estimate of harm and must never be quoted as one.',
      mortality: 'No significant difference: 6% with thrombectomy vs 8% with medical treatment alone; P=.49',
      other: 'Also as-treated: subarachnoid hemorrhage 13% vs 2% (P<.001) and embolus migration 5% vs 1% (P=.04)'
    },
    imagingCriteria: 'Primary isolated medium or distal vessel occlusion on vascular imaging; for the 8-24 h last-seen-well window, absence of a hyperintense signal on FLAIR was required. No perfusion-mismatch requirement.',
    applicabilityNotes: 'The third published randomized trial of thrombectomy for medium and distal vessel occlusion, and the only one stopped early by its DSMB. DISTAL and ESCAPE-MeVO were neutral; DISCOUNT is neutral on the randomized primary endpoint AND carries the procedural-harm signal that the other two do not report — subarachnoid haemorrhage and embolus migration are exactly the complications of navigating a microcatheter into a small distal vessel. Do not describe the medium-vessel literature as a closed three-trial set: the DISTAL 12-month report states that three of four randomized trials showed no benefit, and ORIENTAL-MeVO is already in this corpus as a positive trial, so the count is moving. Note also that these patients were mild (median NIHSS 8) and old (median 75), and that 19% of the thrombectomy arm never underwent the procedure.',
    limitations: 'Stopped at roughly half its planned enrolment, so the confidence interval on the primary endpoint is wide and a modest benefit is not excluded. The haemorrhage figures are an as-treated comparison, which inflates apparent harm relative to an intention-to-treat estimate by attributing procedural complications only to those exposed. Open label with blinded outcome assessment; single country (France); 19% of the thrombectomy arm did not receive thrombectomy; the mild median NIHSS of 8 means the outcome scale has limited room to show benefit.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-discount-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Adds a randomized trial halted for futility plus a haemorrhage signal to the medium- and distal-vessel occlusion evidence, and supplies the procedural-complication data — subarachnoid haemorrhage and embolus migration — that the neutral MeVO trials do not report.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    imagingCriteria: 'Per the contributing trials; notably, baseline posterior-circulation ASPECTS did NOT modify the treatment effect in this pooled analysis',
    applicabilityNotes: 'This is the quantitative anchor for the basilar category and the only place in the corpus where BASICS and BEST — the two earlier, individually inconclusive trials — contribute their data. Two of its findings correct commonly taught heuristics. First, benefit was NOT modified by posterior-circulation ASPECTS in this pool, so the widely used \'pc-ASPECTS 6 or above\' cut point is not supported by the effect-modifier analysis here. Second, the effect WAS modified by baseline severity, with an uncertain effect below NIHSS 10 — which aligns with the ESO/ESMINT 2024 basilar guideline\'s statement that there is no evidence to recommend endovascular therapy over medical treatment alone at NIHSS below 10. The mortality reduction (36% vs 45%) and the symptomatic-haemorrhage increase (5% vs under 1%) are the two numbers a clinician actually needs when consenting.',
    limitations: 'Three of the four contributing trials were conducted in Chinese populations, where intracranial atherosclerotic disease is the dominant mechanism, so generalisability to Western populations rests largely on BASICS. Effect modifiers are subgroup analyses within a pooled dataset, not independently randomized comparisons, and the finding of \'no heterogeneity\' by pc-ASPECTS is an absence of detected interaction rather than proof of uniform benefit. The symptomatic-haemorrhage odds ratio of 11.98 rests on only 2 events in the control arm, which is why its interval spans 2.82 to 50.81. Only 91% were randomized within 12 h, so this says little about later windows.',
    certainty: 'high',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-veritas-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Pooled across all four randomized basilar trials, endovascular therapy roughly 2.4-fold increased the odds of a favourable 90-day outcome and cut 90-day mortality from 45% to 36%, at the cost of a rise in symptomatic haemorrhage from under 1% to 5%; benefit is uncertain below NIHSS 10 and greater with more proximal occlusions.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the deliberate counterweight to the INTERACT1-4 pooled analysis, and the pair is the teaching point. The pooled individual-patient analysis of all four INTERACT trials reports OR 0.85 (0.78-0.91) for poor function overall; this location-stratified analysis of three of those trials finds nothing significant in either deep or lobar ICH. The two are not contradictory so much as differently powered and differently constructed: this one uses aggregate data for two of three trials, splits the sample into subgroups (only 1105 lobar patients even in step 2), and mixes two different mRS dichotomies across trials. Subgroup analyses of this size cannot exclude a clinically meaningful effect — the lobar confidence interval runs from 0.76 to 1.24. The correct lesson is that whether hematoma location modifies the benefit of intensive BP lowering is an open question, not that BP lowering has been shown not to work.',
    limitations: 'Aggregate rather than individual-patient data for INTERACT2 and INTERACT3, so no patient-level adjustment or formal interaction test across all three trials; the poor-outcome dichotomy differs between trials (mRS 4-6 vs 3-6), which is not a cosmetic difference when the comparison is between subgroups; substantial heterogeneity (I-squared 60%) in the deep stratum once INTERACT3 is added; INTERACT3 randomised a care bundle rather than BP alone; only three of the four INTERACT-family trials are represented, and the lobar stratum is small enough that a real effect could be missed.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ich-bp-location-meta-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that the deep-versus-lobar question in acute BP management is unresolved: current evidence neither establishes a location-specific benefit nor rules one out, so location should not by itself change the acute BP target.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'andexanet-vs-4fpcc-meta',
    shortName: 'Andexanet vs 4F-PCC meta-analysis',
    fullName: 'Efficacy and Safety of Andexanet Alfa Versus Four Factor Prothrombin Complex Concentrate for Emergent Reversal of Factor Xa Inhibitor Associated Intracranial Hemorrhage: A Systematic Review and Meta-Analysis',
    topic: 'ich-anticoag-reversal',
    diseaseArea: ['ich', 'ich-anticoag-reversal'],
    population: {
      n: 2977,
      ageRange: 'Not reported in aggregate across the 16 included studies',
      nihssRange: 'Not reported',
      timeWindow: 'Emergent reversal on presentation, as defined by each source study; literature searched to 16 May 2024',
      keyInclusion: ['16 studies comparing andexanet alfa with four-factor prothrombin complex concentrate for factor Xa inhibitor-associated intracranial haemorrhage', '2977 patients in total', 'PRISMA-conformant systematic review with random-effects pooling'],
      keyExclusion: ['No randomised head-to-head trial existed to include — every contributing study is non-randomised']
    },
    intervention: 'Andexanet alfa',
    comparator: 'Four-factor prothrombin complex concentrate (4F-PCC)',
    primaryEndpoint: {
      definition: 'Three co-primary outcomes pooled with a random-effects model: successful anticoagulation (haemostatic) reversal, overall mortality (in-hospital plus 30-day), and thromboembolic events',
      timepoint: 'In-hospital and 30-day, as reported by the source studies',
      result: 'Mixed, and internally inconsistent. Haemostatic efficacy favoured andexanet (RR 1.10). Overall mortality was lower with andexanet (RR 0.67), yet 30-day mortality specifically DID NOT differ (RR 0.82). Thromboembolic events were MORE frequent with andexanet (RR 1.47).',
      effectSize: 'Haemostatic efficacy RR 1.10; overall mortality RR 0.67; 30-day mortality RR 0.82; thromboembolic events RR 1.47',
      confidenceInterval: 'Haemostatic efficacy 95% CI 1.01-1.20; overall mortality 95% CI 0.51-0.88; 30-day mortality 95% CI 0.58-1.16; thromboembolic events 95% CI 1.01-2.15',
      pValue: 'P=0.02; P=0.004; P=0.26; P=0.046 respectively'
    },
    secondaryEndpoints: [
      {
        name: 'Length of hospital stay',
        result: 'Longer with andexanet: mean difference 0.64 days (95% CI 0.07-1.22), P=0.03'
      },
      {
        name: 'Length of ICU stay',
        result: 'No significant difference: mean difference 0.25 days (95% CI -0.36 to 0.86), P=0.41'
      },
      {
        name: 'Haematoma volume expansion',
        result: 'No significant difference: mean difference -0.89 mL (95% CI -3.11 to 1.34), P=0.435 — the imaging endpoint did not move even though the categorical haemostasis endpoint did'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — every participant already had an intracranial haemorrhage',
      mortality: 'Overall mortality lower with andexanet (RR 0.67, 95% CI 0.51-0.88, P=0.004) but 30-day mortality not different (RR 0.82, 95% CI 0.58-1.16, P=0.26); the discrepancy between the two mortality estimates is itself the finding',
      other: 'Thromboembolic events more frequent with andexanet: RR 1.47 (95% CI 1.01-2.15), P=0.046 — the lower bound sits essentially on 1.00'
    },
    imagingCriteria: 'Radiographically confirmed intracranial haemorrhage in a patient on a factor Xa inhibitor; haemostatic efficacy defined by each source study, most commonly by imaging-based criteria such as those used in the ANNEXA programme',
    applicabilityNotes: 'REGULATORY STATUS FIRST, because it changes what can be ordered: andexanet alfa is no longer commercially available in the United States. AstraZeneca voluntarily withdrew the Biologics License Application after an adverse FDA benefit-risk determination, and US sales ended on 22 December 2025 following the FDA Safety Communication of 18 December 2025. This is a US-only withdrawal — the drug remains marketed as Ondexxya in other regions. Second, keep two distinct thrombotic figures apart, because they are routinely conflated: ANNEXA-I as published in the New England Journal of Medicine in 2024 reported thrombotic events of 10.3% with andexanet versus 5.6% with usual care; the 14.6% versus 6.9% pair is the Day-30 rate from the FDA record, not from the NEJM paper. Quoting 14.6% to \'ANNEXA-I (NEJM 2024)\' is a citation error a reader cannot detect. Third, andexanet WON its randomised primary endpoint — haemostatic efficacy 67.0% versus 53.1% — against a usual-care arm that was predominantly 4F-PCC. Fourth, the divergence learners must notice: AHA/ASA 2022 still rates andexanet Class 2a (LOE B-NR) with 4F-PCC as the alternative when andexanet is unavailable, so the guideline text and current US drug availability now point in opposite directions. 4F-PCC is the US default because the alternative left the market and a weak recommendation now favours it, not because any randomised comparison showed it superior — no such comparison exists, and the 16 studies pooled here are all observational.',
    limitations: 'Every one of the 16 included studies is retrospective or otherwise non-randomised, so confounding by indication dominates: andexanet became available later than 4F-PCC, so treatment assignment tracks calendar era, centre resources and clinician judgement about severity. Haemostatic-efficacy definitions and mortality timepoints vary across studies. The mortality result is internally inconsistent (overall lower, 30-day not different), which is the signature of a fragile pooled estimate rather than a real survival benefit. The thromboembolism confidence interval barely excludes 1.00. This meta-analysis cannot settle a question that only a randomised head-to-head trial could answer, and none has been run.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-andexanet-vs-4fpcc-meta-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that no randomised trial has ever compared andexanet with 4F-PCC head to head, and that US practice reverted to 4F-PCC because andexanet was withdrawn from the US market in December 2025 — a regulatory and supply consequence, not a demonstration that 4F-PCC works better.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'peach',
    shortName: 'PEACH',
    fullName: 'Safety and Efficacy of Prophylactic Levetiracetam for Prevention of Epileptic Seizures in the Acute Phase of Intracerebral Haemorrhage (PEACH)',
    topic: 'ich-seizure-prophylaxis',
    diseaseArea: ['ich', 'ich-seizure-prophylaxis'],
    population: {
      n: 50,
      ageRange: 'Aged 18 years or older',
      nihssRange: 'Randomisation stratified by baseline NIHSS; the enrolled cohort is described as mild-to-moderate severity intracerebral haemorrhage',
      timeWindow: 'Randomised within 24 h of onset; continuous EEG started within 24 h of inclusion and recorded over 48 h',
      keyInclusion: ['Non-traumatic intracerebral haemorrhage presenting within 24 h of onset', 'Three stroke units in France; enrolled 1 June 2017 to 14 April 2020', 'Continuous EEG performed (required for the modified intention-to-treat population)', 'NCT02631759'],
      keyExclusion: ['Traumatic intracerebral haemorrhage']
    },
    intervention: 'Intravenous levetiracetam 500 mg every 12 h, continued for 6 weeks — 24 randomised, 19 in the modified intention-to-treat analysis',
    comparator: 'Matching placebo — 26 randomised, 23 in the modified intention-to-treat analysis',
    primaryEndpoint: {
      definition: 'At least one clinical seizure within 72 h of inclusion, or at least one electrographic seizure recorded on the 48-h continuous EEG; analysed in the modified intention-to-treat population (all randomised patients who had a continuous EEG performed)',
      timepoint: '72 h',
      result: 'Favoured levetiracetam: a clinical or electrographic seizure occurred in 3/19 (16%) on levetiracetam versus 10/23 (43%) on placebo. Every seizure captured in the first 72 h was electrographic only — none were clinical.',
      effectSize: 'OR 0.16',
      confidenceInterval: '95% CI 0.03 to 0.94',
      pValue: 'p=0.043'
    },
    secondaryEndpoints: [
      {
        name: 'Depression at 1 and 3 months',
        result: 'No difference: 3/24 (13%) levetiracetam vs 4/26 (15%) placebo'
      },
      {
        name: 'Anxiety at 1 and 3 months',
        result: 'No difference: 2/24 (8%) levetiracetam vs 1/26 (4%) placebo'
      },
      {
        name: 'Functional outcome',
        result: 'Not established — the authors state explicitly that larger studies are needed to determine whether seizure prophylaxis improves functional outcome in ICH'
      },
      {
        name: 'Most common treatment-emergent adverse events',
        result: 'Headache 9 (39%) levetiracetam vs 6 (24%) placebo; pain 3 (13%) vs 10 (40%); falls 7 (30%) vs 4 (16%)'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — the index event is an intracerebral haemorrhage',
      mortality: 'No treatment-related death was reported in either group',
      other: 'Most frequent serious adverse events were neurological deterioration due to the intracerebral haemorrhage (1 [4%] levetiracetam vs 4 [16%] placebo) and severe pneumonia (2 [9%] vs 2 [8%]); with these event counts none of these differences is interpretable'
    },
    imagingCriteria: 'Non-traumatic intracerebral haemorrhage confirmed on imaging; no imaging-based selection beyond that',
    applicabilityNotes: 'This is the only randomised trial of antiseizure prophylaxis in acute ICH, and it must not be read as overturning the guideline position. AHA/ASA 2022 recommends against routine prophylactic antiseizure medication after ICH, and PEACH does not change that for four reasons the record makes explicit: it stopped at 48% of its recruitment target, it analysed 42 patients, its endpoint was almost entirely electrographic rather than clinical seizures, and it neither showed nor was powered to show any functional benefit. The clinically useful reading is mechanistic rather than prescriptive — a companion prospective EEG analysis of the same PEACH cohort (Epilepsia, 2026) found that rhythmic and periodic patterns preceded acute symptomatic seizures in more than 90% of cases by a median of about 12 hours, and that among patients with those patterns 20% treated with antiseizure medication had seizures versus 75% untreated (p=0.030). That points toward EEG-based risk stratification for prophylaxis rather than treating everyone, which is what a subsequent adequately powered trial would need to test.',
    limitations: 'Stopped prematurely after reaching only 48% of the recruitment target because of slow recruitment and cessation of funding. 50 randomised, 42 analysed, and 13 seizure events in total drive the entire primary result — the 95% CI of 0.03 to 0.94 only just excludes 1. Three French stroke units and mild-to-moderate ICH only. The primary endpoint is dominated by electrographic seizures on 48-h continuous EEG, a measurement most centres do not make and whose prognostic importance is itself unresolved. Labelled phase 3 but powered for none of the outcomes clinicians act on.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-peach-2022', 'cit-peach-eeg-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches why prophylactic levetiracetam after ICH remains a research question rather than routine care: PEACH reduced EEG-detected seizures in 42 analysable patients and says nothing about function, so guidelines still advise against routine prophylaxis.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the CT-based counterpart to the MRI-based Boston criteria v2.0, and it exists for the majority of ICH patients who never get an MRI — the sick, the old, the unstable and the ones at hospitals without out-of-hours MRI. It is a diagnostic-accuracy model, not a treatment trial: what it delivers is a probability that a given lobar haemorrhage is amyloid-related, which is the input to the conversations that actually change management — whether to restart an antithrombotic, how to frame recurrence risk with a family, and whether a patient belongs in a CAA-focused trial such as SATURN. Two structural cautions belong on the card. The rule-out arm requires an APOE genotype, which most centres cannot obtain acutely, so in real time the CT-only features are what a clinician has. And the derivation cohort is autopsy-based, which enriches for fatal haemorrhage in very old patients and is not the population in front of most clinicians. The external validation the authors called for arrived in 2025 as an eight-cohort individual-patient meta-analysis linking the same strata to recurrent haemorrhage.',
    limitations: 'Derivation cohort of 110 with only 62 lobar haemorrhages and 36 CAA cases — very small for a three-variable model, and validated internally by bootstrapping only, with no external cohort in this paper. Enrolment required death plus research autopsy, so the cohort is old (median 83) and skewed toward fatal haemorrhage, limiting transportability to survivors and to younger patients. Confidence intervals around the rule-in and rule-out performance are wide (specificity 96%, 95% CI 78-100; sensitivity 100%, 95% CI 88-100). The reference standard is moderate-or-severe CAA at autopsy, a dichotomy that does not map cleanly onto clinical decision thresholds.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-edinburgh-ct-caa-2018'],
    relatedActiveTrialIds: ['saturn'],
    practiceImpact: 'Gives a CT-only, and optionally CT-plus-APOE, way to grade the probability that a lobar haemorrhage is amyloid-related when MRI is unavailable — the input to how cautiously antithrombotics are restarted.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'edinburgh-ct-caa-recurrence-ipd',
    shortName: 'Edinburgh criteria & ICH recurrence (IPD)',
    fullName: 'Association Between the Edinburgh CT and Genetic Diagnostic Criteria for Cerebral Amyloid Angiopathy-Associated Lobar Intracerebral Haemorrhage and Recurrent Intracerebral Haemorrhage: An Individual Patient Data Meta-Analysis',
    topic: 'caa-diagnosis',
    diseaseArea: ['ich', 'caa-diagnosis', 'ich-secondary-prevention'],
    population: {
      n: 1705,
      ageRange: 'Primary two-stage CT-only cohort (562 patients): median 76 years (IQR 68-82), 282 (50%) female, 280 (50%) male. One-stage CT-only cohort (1620): median 73 years (IQR 62-80), 763 (47%) female, 857 (53%) male. CT-APOE cohort (1006): median 71 years (IQR 58-79), 477 (47%) female, 529 (53%) male.',
      nihssRange: 'Not applicable — prognostic cohort analysis',
      timeWindow: 'Index spontaneous lobar intracerebral haemorrhage; recurrence counted only from 30 days after the index event',
      keyInclusion: ['Aged 16 years or older with first or recurrent spontaneous lobar intracerebral haemorrhage diagnosed on non-contrast brain CT', 'No evidence of an underlying cause other than cerebral small-vessel disease', 'Diagnostic CT that had been, or could be, rated for the Edinburgh CAA imaging features', 'Follow-up data for recurrent intracerebral haemorrhage and death', 'Eight cohorts from Austria, France, Germany, Italy, the UK and the USA, identified at the 2018 International CAA Conference in Lille; 1705 eligible for CT-only criteria and 1021 for CT-APOE criteria'],
      keyExclusion: ['Underlying macrovascular or structural cause for the haemorrhage', '15 CT-APOE patients excluded for missing baseline data, leaving 1006 analysed']
    },
    intervention: 'Edinburgh CT-only and CT-APOE risk strata (low / intermediate / high) applied to the index diagnostic CT',
    comparator: 'The low-risk Edinburgh stratum',
    primaryEndpoint: {
      definition: 'First recurrent intracerebral haemorrhage occurring at least 30 days after the index event, analysed with multivariable competing-risk regression against a competing risk of death, adjusted for age, sex and CT small-vessel-disease score; pooled one-stage analyses additionally adjusted for previous intracerebral haemorrhage, dementia, hypertension and cohort clustering',
      timepoint: '5-year follow-up for the CT-only criteria; 3-year for the CT-APOE criteria',
      result: 'Higher Edinburgh strata were associated with more recurrent haemorrhage. In the primary two-stage CT-only analysis (562 patients from three European cohorts, 69 recurrences over 1381 person-years), 5-year recurrence occurred in 48/307 (16%) of the intermediate-and-high-risk group versus 21/255 (8%) of the low-risk group.',
      effectSize: 'Adjusted sub-distribution hazard ratio 1.79',
      confidenceInterval: '95% CI 1.05 to 3.05',
      pValue: 'p=0.032'
    },
    secondaryEndpoints: [
      {
        name: 'One-stage CT-only meta-analysis (1620 patients, 8 cohorts, 171 recurrences over 3208 person-years) — intermediate vs low risk',
        result: 'Cumulative 5-year recurrence 54/513 (16%) intermediate vs 45/727 (12%) low; adjusted sub-distribution HR 1.68 (95% CI 1.21-2.32), p=0.0018'
      },
      {
        name: 'One-stage CT-only meta-analysis — high vs low risk',
        result: 'Cumulative 5-year recurrence 72/380 (26%) high vs 45/727 (12%) low; adjusted sub-distribution HR 2.97 (95% CI 1.50-5.89), p=0.0018'
      },
      {
        name: 'One-stage CT-APOE meta-analysis (1006 patients, 6 cohorts, 74 recurrences over 1495 person-years)',
        result: 'Cumulative 3-year recurrence 34/320 (15%) high risk vs 14/322 (8%) low risk; adjusted sub-distribution HR 2.22 (95% CI 1.36-3.61), p=0.0014'
      },
      {
        name: 'Two-stage CT-APOE analysis',
        result: 'Could NOT be performed — individual cohorts had too few recurrence events to support cohort-level pooling, so only the one-stage estimate exists for CT-APOE'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — prognostic cohort analysis with no intervention',
      mortality: 'Death was modelled as a competing risk rather than reported as an outcome rate',
      other: 'Not applicable'
    },
    imagingCriteria: 'Diagnostic non-contrast CT rated, or re-rated by the collaborating cohorts, for the Edinburgh CAA imaging features (associated subarachnoid haemorrhage and finger-like projections); the CT small-vessel-disease score was used as an adjustment covariate',
    applicabilityNotes: 'This completes the Edinburgh story and is the record that makes the 2018 criteria clinically actionable. The derivation study predicted CAA pathology at autopsy; this one shows the same CT strata predict what a clinician and family actually care about — whether the bleed comes back. The gradient is steep: roughly a threefold adjusted 5-year recurrence hazard in the high-risk CT-only stratum against low risk, and 26% versus 12% cumulative 5-year recurrence in absolute terms. Because it needs only a non-contrast CT — and for CT-APOE a genotype — it extends CAA recurrence-risk stratification to the many patients and centres where MRI-based Boston criteria v2.0 simply cannot be applied. Two boundaries matter. This is prognostic association, not a treatment trial: it tells you how steep the recurrence gradient is, not whether to restart an antithrombotic, resume anticoagulation or continue a statin — those questions belong to SATURN, ASPIRE and the af-after-ich records. And the recurrence rates in the low-risk stratum are not trivial (12% at 5 years), so a low-risk Edinburgh classification is not a licence to treat the patient as though CAA has been excluded.',
    limitations: 'Observational cohort data pooled at the individual-patient level, not randomised. The primary two-stage analysis rests on only three of the eight cohorts and 69 recurrence events, so the headline 1.79 hazard ratio is imprecise (95% CI 1.05-3.05, barely excluding 1). The CT-APOE two-stage analysis could not be run at all because individual cohorts had too few outcomes, leaving only a pooled estimate for that criterion. Cohorts were assembled by invitation at a 2018 conference rather than by systematic search, raising selection concerns, and CT ratings span eight cohorts, six countries, and different scanners and eras. All cohorts are European or North American — no data from Asia, Africa or South America, where ICH aetiology mix differs.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-edinburgh-ct-recurrence-2025'],
    relatedActiveTrialIds: ['saturn', 'aspire'],
    practiceImpact: 'Lets a clinician grade recurrent-haemorrhage risk after a lobar ICH from the admission CT alone, when MRI-based Boston criteria are unavailable — a roughly threefold 5-year hazard between the high- and low-risk strata.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS >5 (disabling stroke at randomisation)',
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'actisave',
    shortName: 'ACTISAVE',
    fullName: 'Glenzocimab Efficacy and Safety Added to Intravenous Thrombolysis With or Without Mechanical Thrombectomy in Patients With Acute Ischemic Stroke — ACTISAVE: A Prospective, Randomized, Double-Blind Study',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 438,
      ageRange: 'Median 73 y (IQR 63-80); 43% female',
      nihssRange: 'Median pre-thrombolysis NIHSS 9 (IQR 6-15)',
      timeWindow: 'Thrombolysis within 4.5 h of onset (median 2.3 h); study drug started a median of 1.2 h [IQR 0.8-1.6] after thrombolysis initiation',
      keyInclusion: ['Acute ischaemic stroke treated with IV thrombolysis within 4.5 h of symptom onset', 'With or without mechanical thrombectomy — 36% went on to thrombectomy', '438 randomized; 421 treated and included as randomized in the primary analysis set', 'Phase 2/3, 54 primary and comprehensive stroke centers in 10 countries, Sep 2021 - Oct 2023; NCT05070260'],
      keyExclusion: []
    },
    intervention: 'Glenzocimab 1000 mg IV (a humanised antibody fragment against platelet glycoprotein VI) added to IV thrombolysis (n=210 in the primary analysis set)',
    comparator: 'Placebo added to IV thrombolysis (n=211 in the primary analysis set)',
    primaryEndpoint: {
      definition: 'Poor outcome, defined as modified Rankin Scale score 4-6 versus 0-3, at day 90 (a superiority design; lower is better for the active arm)',
      timepoint: 'Day 90',
      result: 'DID NOT meet: poor outcome in 21.6% with glenzocimab vs 15.3% with placebo — not significant, and the point estimate numerically favours placebo',
      effectSize: 'Odds ratio 1.51',
      confidenceInterval: '95% CI 0.90 to 2.54',
      pValue: 'P=0.120'
    },
    secondaryEndpoints: [
      {
        name: 'Functional independence (mRS 0-2) at day 90 — the key secondary',
        result: 'No statistically significant difference'
      },
      {
        name: 'Mortality, mRS shift, NIHSS and quality of life',
        result: 'No statistically significant difference in any secondary outcome'
      }
    ],
    safetyFindings: {
      sich: 'Any intracerebral hemorrhage 60/210 (28.6%) with glenzocimab vs 63/211 (29.9%) with placebo; the abstract does not separately report symptomatic ICH',
      mortality: 'Assessed as a secondary outcome; no statistically significant difference and numbers not given in the abstract',
      other: 'No major safety signals reported'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The phase 1b ACTIMIS trial had suggested that blocking platelet glycoprotein VI would reduce intracranial haemorrhage and mortality alongside thrombolysis — the appealing idea of an antiplatelet that is safe in the bleeding brain. ACTISAVE was the confirmatory trial and reproduced neither the efficacy nor the haemorrhage-reduction signal: ICH rates were essentially identical (28.6% vs 29.9%). The authors\' own summary is that ACTISAVE \'failed to confirm a beneficial effect of glenzocimab.\' Useful counterweight to the assumption that a favourable phase 1b safety signal predicts phase 3 benefit.',
    limitations: '421 patients analysed is modest for a functional-outcome trial, and the confidence interval (0.90-2.54) is wide enough that neither a meaningful benefit nor a meaningful harm can be firmly excluded on the primary endpoint. The numerical excess of poor outcomes in the glenzocimab arm should not be read as demonstrated harm. A mixed thrombolysis-only and thrombolysis-plus-thrombectomy population (36% thrombectomy) blends two quite different reperfusion contexts.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-actisave-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Glenzocimab is not an established adjunct to thrombolysis; the trial that was meant to confirm benefit did not, and there is no bedside role outside research.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      nihssRange: 'NIHSS 4-24',
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'taste-2-edaravone',
    shortName: 'TASTE-2',
    fullName: 'Edaravone dexborneol versus placebo on functional outcomes in patients with acute ischaemic stroke undergoing endovascular thrombectomy (TASTE-2): randomised controlled trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 1362,
      ageRange: '18-80 y',
      nihssRange: 'NIHSS 6-25',
      timeWindow: '≤24 h from symptom onset',
      keyInclusion: ['Clinically diagnosed acute ischaemic stroke within 24 h of symptom onset', 'Age 18-80 years', 'NIHSS 6-25 and ASPECTS 6-10', 'Confirmed large-vessel occlusion in the anterior circulation with planned endovascular thrombectomy', '106 hospitals in China, March 2022 - May 2023; 1362 randomized, 1360 in the intention-to-treat analysis (one patient per group lost to follow-up); NCT05249920'],
      keyExclusion: []
    },
    intervention: 'Edaravone dexborneol 37.5 mg (edaravone 30 mg + (+)-dexborneol 7.5 mg) given before thrombectomy then twice daily for 10-14 days (n=690 randomized; 689 analysed)',
    comparator: 'Placebo on the same schedule before and after thrombectomy (n=672 randomized; 671 analysed)',
    primaryEndpoint: {
      definition: 'Functional independence at 90 days, defined as modified Rankin Scale score 0-2 (co-primary with serious adverse events)',
      timepoint: '90 days',
      result: 'Nominally MET but only just: mRS 0-2 in 379/689 (55.0%) with edaravone dexborneol vs 333/671 (49.6%) with placebo; risk difference 5.4% (95% CI 0.1% to 10.7%). The lower bound of the risk-ratio confidence interval sits exactly at 1.00 and P=0.05, so this is a borderline rather than a robust result',
      effectSize: 'Risk ratio 1.11; risk difference 5.4%',
      confidenceInterval: '95% CI 1.00 to 1.23 (risk ratio); 0.1% to 10.7% (risk difference)',
      pValue: 'P=0.05'
    },
    secondaryEndpoints: [
      {
        name: 'Prespecified admission-mismatch subgroup (NIHSS ≥10 with ASPECTS ≥9, or NIHSS ≥20 with ASPECTS ≥7)',
        result: 'mRS 0-2 in 178/321 (55.5%) vs 134/312 (42.9%); risk ratio 1.29 (95% CI 1.10 to 1.52); risk difference 13.0% (95% CI 5.6% to 20.3%); P for interaction=0.003. The authors conclude the overall effect appeared to be driven by this subgroup and that a dedicated trial in this population may be warranted'
      }
    ],
    safetyFindings: {
      sich: 'Not separately reported in the abstract',
      mortality: 'Not separately reported in the abstract',
      other: 'Serious adverse events 188/690 (27.2%) vs 173/672 (25.7%); risk ratio 1.06 (95% CI 0.89 to 1.26); risk difference 1.5% (95% CI -3.2% to 6.2%); P=0.53'
    },
    imagingCriteria: 'ASPECTS 6-10 with confirmed anterior-circulation large-vessel occlusion; the prespecified mismatch subgroup was defined clinically-radiologically (NIHSS ≥10 with ASPECTS ≥9, or NIHSS ≥20 with ASPECTS ≥7)',
    applicabilityNotes: 'The first placebo-controlled test of edaravone dexborneol in a thrombectomy population, and the strongest cytoprotection signal in this category — but a marginal one. A 5.4-point absolute gain with a risk-ratio lower bound of exactly 1.00 and P=0.05 is a result that should be described as promising and unsettled, not as established benefit. The clinical-imaging mismatch subgroup is where the effect concentrates, and the investigators themselves ask for a dedicated trial there rather than claiming the subgroup as proven. Compare with ESCAPE-NEXT: a subgroup that looks compelling inside one trial is a hypothesis, not a result.',
    limitations: 'Single-country conduct in 106 Chinese hospitals; findings have not been replicated outside China. The primary result is borderline (P=0.05, risk-ratio CI touching 1.00), so it is fragile to any reasonable sensitivity analysis. The mismatch subgroup result is a subgroup finding with an unusual, trial-specific definition. sICH and mortality are not reported separately in the abstract. The 10-14 day dosing schedule is a substantial treatment burden not accounted for in the primary comparison.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-taste2-edaravone-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'The best current signal that a cytoprotectant may add something to thrombectomy — borderline, single-country and not yet a basis for routine use.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'mist-a',
    shortName: 'MIST-A',
    fullName: 'Efficacy and safety of minocycline on patients with acute anterior circulation ischaemic stroke undergoing mechanical thrombectomy (MIST-A): a multicentre, prospective, randomised, open-label, blinded-endpoint, phase 2 trial',
    topic: 'acute-neuroprotection',
    diseaseArea: ['acute-ischemic-stroke', 'acute-neuroprotection'],
    population: {
      n: 189,
      ageRange: 'Not reported in the abstract',
      nihssRange: 'Not reported in the abstract',
      timeWindow: 'After mechanical thrombectomy with successful recanalisation',
      keyInclusion: ['Ischaemic stroke due to anterior-circulation large-vessel occlusion', 'Successful recanalisation achieved after mechanical thrombectomy', 'Randomised 1:1 via a centralised web-based system', '189 randomly assigned; 2 excluded for major protocol violations, leaving 187 in the modified intention-to-treat analysis', '8 hospitals in China, 21 Nov 2022 - 9 Jun 2025; NCT05487417'],
      keyExclusion: ['Major protocol violations (2 patients excluded post-randomisation)']
    },
    intervention: 'Oral minocycline 100 mg twice daily for 5 days as an adjunct to standard care (n=94 in the mITT analysis)',
    comparator: 'Standard care alone — open-label, no placebo (n=93 in the mITT analysis)',
    primaryEndpoint: {
      definition: 'Infarct growth ratio, defined as day-5 infarct volume divided by baseline infarct volume, in the modified intention-to-treat population',
      timepoint: 'Day 5',
      result: 'DID NOT meet: median infarct growth ratio 1.8 (IQR 1.3-3.3) with minocycline vs 1.6 (IQR 1.2-2.8) with standard care — no reduction in infarct growth, with the point estimate numerically favouring the control arm',
      effectSize: 'Adjusted geometric mean ratio 1.10',
      confidenceInterval: '95% CI 0.84 to 1.45',
      pValue: 'p=0.49'
    },
    secondaryEndpoints: [
      {
        name: 'Functional independence (mRS 0-2) at day 90',
        result: '64/94 (68.1%) with minocycline vs 67/93 (72.0%) with standard care; adjusted risk ratio 1.00 (95% CI 0.70 to 1.43) — no difference'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the abstract',
      mortality: 'Not reported separately in the abstract',
      other: 'No significant differences in adverse events (72/94 [76.6%] vs 64/93 [68.8%]) or serious adverse events (24/94 [25.5%] vs 24/93 [25.8%])'
    },
    imagingCriteria: 'Anterior-circulation large-vessel occlusion with successful recanalisation after thrombectomy; serial infarct volumes (baseline and day 5) constituted the primary endpoint',
    applicabilityNotes: 'The essential counterweight to EMPHASIS. Same drug, same class of mechanism, opposite result — and the two are not actually contradictory, because they test different populations and different endpoints. MIST-A asks whether minocycline limits infarct growth after successful reperfusion and answers no; EMPHASIS asks whether it improves 90-day function in mostly mild strokes treated within 72 h and answers a qualified yes. Carrying both prevents the category from reading as a settled positive. The authors state plainly that these findings do not support minocycline as a neuroprotective therapy in the post-thrombectomy population.',
    limitations: 'Phase 2 with only 187 patients analysed — far too small to exclude a clinically meaningful effect on 90-day function, so the null clinical result should be read as uninformative rather than as evidence of no benefit. Open-label design (blinded endpoint assessment and blinded imaging mitigate but do not eliminate bias). The primary endpoint is a radiological surrogate, not a patient-important outcome, and refuting an infarct-growth mechanism does not refute every possible route to clinical benefit. Single-country conduct across 8 Chinese hospitals. Baseline demographics and stroke severity are not reported in the abstract.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-mist-a-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Shows minocycline does not limit infarct growth after successful thrombectomy, and keeps the positive EMPHASIS result from being generalised to reperfused large-vessel stroke.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'resist-ric',
    shortName: 'RESIST',
    fullName: 'Remote Ischemic Conditioning for Acute Stroke: The RESIST Randomized Clinical Trial',
    topic: 'remote-ischemic-conditioning',
    diseaseArea: ['acute-ischemic-stroke', 'ich', 'prehospital-stroke-care', 'remote-ischemic-conditioning'],
    population: {
      n: 1500,
      ageRange: 'Median 71 y; 591 (41%) women',
      nihssRange: 'Not reported in the abstract — patients were enrolled prehospital on symptoms alone, before any diagnostic imaging',
      timeWindow: 'Prehospital stroke symptoms for less than 4 h',
      keyInclusion: ['Prehospital suspected stroke with symptoms of less than 4 hours\' duration', 'Enrolled in the ambulance, before imaging or diagnosis', '4 stroke centres in Denmark, 16 Mar 2018 - 11 Nov 2022; final follow-up 3 Feb 2023', '1433 of 1500 (96%) completed; of these 149 (10%) had TIA and 382 (27%) a stroke mimic', 'Prespecified target-diagnosis population n=902 (737 [82%] ischaemic stroke, 165 [18%] intracerebral haemorrhage): 436 RIC vs 466 sham', 'NCT03481777'],
      keyExclusion: []
    },
    intervention: 'Remote ischemic conditioning via an inflatable cuff on one upper extremity at ≤200 mm Hg (n=749 randomized); 5 cycles of 5 min inflation followed by 5 min deflation, started in the ambulance, repeated at least once in hospital, then twice daily for 7 days in a subset',
    comparator: 'Sham conditioning with the identical cuff and schedule at 20 mm Hg (n=751 randomized)',
    primaryEndpoint: {
      definition: 'Improvement in functional outcome measured as a shift across the modified Rankin Scale (0 = no symptoms to 6 = death) at 90 days, in the prespecified target population with a final diagnosis of ischaemic or haemorrhagic stroke (n=902)',
      timepoint: '90 days',
      result: 'DID NOT meet: median mRS 2 (IQR 1-3) with RIC vs 1 (IQR 1-3) with sham — RIC was not associated with improved functional outcome',
      effectSize: 'Odds ratio 0.95',
      confidenceInterval: '95% CI 0.75 to 1.20',
      pValue: 'P=0.67'
    },
    secondaryEndpoints: [
      {
        name: 'Serious adverse events (all randomised patients)',
        result: '169/749 (23.7%) with RIC vs 175/751 (24.3%) with sham; odds ratio 0.97 (95% CI 0.85 to 1.11); P=0.68'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the abstract',
      mortality: 'Captured within the mRS shift analysis; not reported separately in the abstract',
      other: 'Upper-extremity pain during treatment and/or skin petechiae in 54/749 (7.2%) with RIC vs 11/751 (1.5%) with sham — the intervention is not entirely benign'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The definitive sham-controlled test of prehospital remote ischemic conditioning, and the largest RIC trial in stroke. It is flatly null. Two design features explain most of the debate about it: randomisation happened in the ambulance on symptoms alone, so 531 of 1433 completers (37%) turned out to have TIA or a stroke mimic and could not benefit; and the target-diagnosis population deliberately mixed ischaemic stroke with intracerebral haemorrhage. This trial is the evidence behind the AHA/ASA 2026 Class III (No Benefit, B-R) recommendation against ambulance-initiated RIC that the app already carries. It does not settle whether in-hospital RIC in a confirmed, reperfused ischaemic stroke does anything — that is the question SERIC-EVT and EnTRIPS address.',
    limitations: 'Enrolment before diagnosis meant a large TIA/mimic fraction diluting any true effect, though the prespecified target-diagnosis analysis was designed to handle this. Mixing ischaemic stroke and ICH in one primary population blends two different pathophysiologies. Four centres in a single country. The treatment schedule after the ambulance dose varied — continuation twice daily for 7 days applied only to a subset — so total exposure was not uniform.',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-resist-2023'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Ambulance-initiated remote ischemic conditioning does not improve 90-day outcome and is not a prehospital intervention to adopt.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ricamis',
    shortName: 'RICAMIS',
    fullName: 'Effect of Remote Ischemic Conditioning vs Usual Care on Neurologic Function in Patients With Acute Moderate Ischemic Stroke: The RICAMIS Randomized Clinical Trial',
    topic: 'remote-ischemic-conditioning',
    diseaseArea: ['acute-ischemic-stroke', 'remote-ischemic-conditioning'],
    population: {
      n: 1893,
      ageRange: 'Mean 65 y (SD 10.3); 606 (34.1%) women',
      nihssRange: 'Acute moderate ischaemic stroke (the trial\'s severity band; the abstract does not give the numeric NIHSS range or median)',
      timeWindow: 'Randomised within 48 h of symptom onset',
      keyInclusion: ['Acute moderate ischaemic stroke', 'Randomised within 48 hours after symptom onset', '55 hospitals in China, 26 Dec 2018 - 19 Jan 2021; final follow-up 19 Apr 2021', '1776 of 1893 (93.8%) completed the trial', 'Open-label with blinded endpoint assessment; analysed on a full analysis set', 'NCT03740971'],
      keyExclusion: []
    },
    intervention: 'Remote ischemic conditioning with a pneumatic electronic device — 5 cycles of 5 min inflation and 5 min deflation to the bilateral upper limbs at 200 mm Hg, for 10 to 14 days, as an adjunct to guideline-based treatment (n=922)',
    comparator: 'Guideline-based treatment alone — usual care, with NO sham conditioning (n=971)',
    primaryEndpoint: {
      definition: 'Excellent functional outcome at 90 days, defined as modified Rankin Scale score 0-1, with blinded assessment',
      timepoint: '90 days',
      result: 'MET: mRS 0-1 in 582 (67.4%) with RIC vs 566 (62.0%) with usual care — an absolute difference of 5.4 percentage points',
      effectSize: 'Odds ratio 1.27; risk difference 5.4%',
      confidenceInterval: '95% CI 1.05 to 1.54 (odds ratio); 1.0% to 9.9% (risk difference)',
      pValue: 'P=0.02'
    },
    secondaryEndpoints: [
      {
        name: 'Any adverse event',
        result: '6.8% (59/863) with RIC vs 5.6% (51/913) with usual care'
      }
    ],
    safetyFindings: {
      sich: 'Not reported separately in the abstract',
      mortality: 'Not reported separately in the abstract',
      other: 'Any adverse event 6.8% (59/863) vs 5.6% (51/913)'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The positive RIC trial, and the one whose design deserves the closest reading. The control arm received guideline-based treatment alone with no sham cuff, so patients and treating teams knew who was being conditioned twice daily for 10-14 days; blinded endpoint assessment reduces but does not remove the resulting bias, particularly for a dichotomised mRS 0-1 threshold. The investigators\' own conclusion is that the findings \'require replication in another trial before concluding efficacy.\' Read as a triad with RESIST (sham-controlled, prehospital, null) and SERIC-EVT (sham-controlled, post-thrombectomy, positive): the three together are the clearest illustration in this corpus of how much the control condition shapes what a trial can claim.',
    limitations: 'Open-label with a usual-care control and no sham — the single most important design weakness. Single-country conduct in 55 Chinese hospitals. \'Acute moderate ischaemic stroke\' is not defined numerically in the abstract, so the treated severity band is imprecise. A 10-14 day twice-daily intervention has substantial adherence and resource implications not captured in the effect estimate. sICH and mortality are not reported separately.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-ricamis-2022'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Shows a 5.4-point absolute gain in excellent outcome with RIC in moderate stroke, but from an unblinded usual-care comparison the authors themselves say needs replication.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'The negative counterweight that keeps the SERIC-EVT signal in proportion. Both trials conditioned thrombectomy patients for 7 days and both measured 90-day mRS 0-2, yet SERIC-EVT found a 12.2-point absolute gain against a sham cuff while EnTRIPS found 3.1 points against usual care and no significant effect. The obvious differences — EnTRIPS is a quarter the size, required successful recanalisation before randomisation, used 180 rather than 200 mm Hg with a shorter deflation phase, and used a no-sham control — are exactly the variables a fellow should be able to list when asked why two similar trials disagree. Neither result should be presented as settling the question.',
    limitations: '270 patients is underpowered to exclude the size of effect SERIC-EVT reported; a 95% CI running to 1.30 leaves a clinically meaningful benefit inside the interval, so this is a non-significant result rather than a demonstration of no effect. No sham control — outcome assessors were blinded but patients and treating teams were not. Restricting entry to successful recanalisation selects a population already doing comparatively well (57.8% independence in the control arm), compressing the room for improvement. Single-country conduct across 8 Chinese hospitals.',
    certainty: 'moderate',
    evidenceType: 'rct',
    citationIds: ['cit-entrips-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Ultra-early remote ischemic postconditioning after successful thrombectomy was safe but showed no functional benefit, so the RIC-after-EVT question remains open rather than answered.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the PCSK9 trial that sits UPSTREAM of the stroke clinic, not inside it: everyone with a previous stroke or myocardial infarction was excluded by design, so it cannot be quoted at the bedside of a stroke survivor. Its relevance is that it extends the FOURIER/ODYSSEY OUTCOMES story — PCSK9 inhibition in established coronary disease — into a population with atherosclerosis or diabetes but no prior event, and ischemic stroke is one of the three components of the primary composite. For secondary prevention after ischemic stroke the governing trials remain SPARCL (atorvastatin 80 mg) and Treat Stroke to Target (LDL <70 vs 90-110 mg/dL).',
    limitations: 'By construction it excludes the very patients a stroke service treats; 93% White, limiting generalizability; the primary composite is driven by coronary as well as cerebrovascular events, and no stroke-specific effect estimate is given in the abstract; industry-funded (Amgen).',
    certainty: 'high',
    evidenceType: 'rct',
    citationIds: ['cit-vesalius-cv-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Teaches that the PCSK9 evidence base now reaches patients with atherosclerosis or diabetes and no prior event — but explicitly not stroke survivors, for whom SPARCL and Treat Stroke to Target remain the anchors.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
      keyExclusion: ['Severe daytime sleepiness was not represented — the enrolled population had minimal sleepiness by design of the run-in and consent process']
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
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'Read this as a PAIR with SAVE, never on its own. This pooled analysis of 21 post-stroke trials reports a large reduction in recurrent vascular events (OR 0.45), while SAVE — a single trial larger than the entire meta-analysis at n=2717 versus n=1457 — found no reduction at all (HR 1.10, 95% CI 0.91 to 1.32). The tension is real and unresolved: the meta-analysis pools many small, mostly open-label, stroke-specific trials whose event counts are low, whereas SAVE is a large adequately powered trial in mixed coronary and cerebrovascular disease with poor adherence and minimal sleepiness. The one place the two agree is that FUNCTIONAL independence was not improved.',
    limitations: 'Only 1457 patients across 21 trials, so the pooled event count is small and vulnerable to small-study effects and publication bias; the constituent trials are heterogeneous in PAP modality, timing after stroke and adherence; the abstract mislabels continuous outcomes (neurological deficit, sleepiness, depression, cognition) as odds ratios when the negative bounds identify them as standardised mean differences; no adherence-stratified estimate is reported; directly contradicted on its headline outcome by the larger SAVE trial.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-poststroke-pap-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Keeps the post-stroke sleep-apnea question open rather than closing it: a pooled signal for fewer recurrent vascular events sits against a larger neutral trial, and neither supports promising a patient that PAP will improve functional independence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'anti-inflammatory-cv-meta-2026',
    shortName: 'Anti-inflammatory CV meta-analysis',
    fullName: 'Effects of anti-inflammatory agents on cardiovascular outcomes: a systematic review and meta-analysis of randomised controlled trials',
    topic: 'inflammation-stroke-prevention',
    diseaseArea: ['secondary-prevention', 'inflammation-stroke-prevention'],
    population: {
      n: 82208,
      ageRange: 'not reported in the abstract — trial-level meta-analysis',
      nihssRange: 'not applicable',
      timeWindow: 'Medline, Embase and Cochrane searched from inception to 8 October 2024; trials required at least 100 patient-years of follow-up per treatment arm',
      keyInclusion: ['Randomised controlled trials of anti-inflammatory therapies with a primary cardiovascular outcome', 'At least 100 patient-years of follow-up per treatment arm', '13 trials, 82,208 participants'],
      keyExclusion: ['Trials with under 100 patient-years of follow-up per arm', 'Trials without a primary cardiovascular outcome']
    },
    intervention: 'Anti-inflammatory therapy across drug classes — colchicine, canakinumab, methotrexate and others',
    comparator: 'Placebo or control as randomized within each constituent trial',
    primaryEndpoint: {
      definition: 'Major adverse cardiovascular events (MACE), pooled by trial-level random-effects meta-analysis with a test for heterogeneity of effect BY DRUG CLASS',
      timepoint: 'as reported by the 13 constituent trials',
      result: 'The effect on MACE VARIED BY DRUG CLASS rather than being uniform — driven by colchicine (RR 0.76, moderate certainty) and canakinumab (RR 0.88, moderate certainty), with NO benefit observed for other agents',
      effectSize: 'Colchicine RR 0.76; canakinumab RR 0.88; no benefit for other classes',
      confidenceInterval: 'Colchicine 95% CI 0.65 to 0.90; canakinumab 95% CI 0.79 to 0.97',
      pValue: 'P-heterogeneity by drug class = 0.049'
    },
    secondaryEndpoints: [
      {
        name: 'Heterogeneity within the colchicine trials',
        result: 'Significant heterogeneity among colchicine trials (P-heterogeneity=0.003); subgroup analyses suggested GREATER benefit in coronary artery disease and/or recent myocardial infarction trials (P-heterogeneity=0.068)'
      },
      {
        name: 'Serious adverse events',
        result: 'Varied significantly by drug class (P-heterogeneity=0.005), largely attributable to methotrexate'
      },
      {
        name: 'Infection and malignancy',
        result: 'Some evidence of heterogeneity by class — infection P-heterogeneity=0.076, malignancy P-heterogeneity=0.077'
      }
    ],
    safetyFindings: {
      sich: 'Not reported — intracranial hemorrhage was not a pooled outcome',
      mortality: 'Not reported as a separate pooled outcome in the abstract',
      other: 'Serious adverse events differed significantly by drug class, largely attributable to methotrexate; class-level differences also suggested for infection and malignancy'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the record that explains the app\'s three neutral cerebrovascular colchicine cards — CONVINCE, CHANCE-3 and CLEAR SYNERGY. Pooled across 13 trials, the anti-inflammatory MACE benefit is not a class-wide property: it is concentrated in colchicine and canakinumab, and WITHIN the colchicine trials it is concentrated in coronary artery disease and recent myocardial infarction populations. That is exactly the population the cerebrovascular trials did not enroll. So the honest teaching is not \'colchicine works but the stroke trials were underpowered\' — it is that the coronary evidence may not transport to stroke at all, and the stroke-specific trials remain neutral.',
    limitations: 'Trial-level rather than individual-participant meta-analysis, so subgroup inferences are ecological; the colchicine subgroup signal (P-heterogeneity=0.068) does not reach conventional significance; the class-heterogeneity test itself is borderline (P=0.049); only 13 trials, and the class comparisons are indirect; searches closed 8 October 2024, so later cerebrovascular trials are not included; no stroke-specific pooled effect estimate is reported in the abstract.',
    certainty: 'moderate',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-anti-inflammatory-cv-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reframes anti-inflammatory vascular prevention as class- and population-specific rather than general, and supplies the reason the neutral cerebrovascular colchicine trials should be taken at face value rather than explained away.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      keyExclusion: ['Non-randomized studies; 5 of the 24 reviewed trials could not be connected into the network']
    },
    intervention: 'Cilostazol, and the other antiplatelet strategies in the network — clopidogrel, ticlopidine, dipyridamole, vorapaxar, sarpogrelate and aspirin plus clopidogrel',
    comparator: 'Aspirin, placebo and the other network nodes, compared indirectly',
    primaryEndpoint: {
      definition: 'Incidence of major adverse cardiovascular events (MACE), with any-stroke and ischemic-stroke recurrence as further efficacy outcomes; agents ranked by surface under the cumulative ranking curve (SUCRA)',
      timepoint: 'as reported by the constituent trials',
      result: 'Cilostazol ranked best for preventing MACE (SUCRA 90.0%), significantly better than aspirin, dipyridamole, vorapaxar, sarpogrelate and placebo; the comparison with ticlopidine touches unity and is NOT significant',
      effectSize: 'Cilostazol vs aspirin OR 0.66; vs placebo OR 0.51; vs dipyridamole OR 0.61; vs vorapaxar OR 0.51; vs sarpogrelate OR 0.62; vs ticlopidine OR 0.65',
      confidenceInterval: 'vs aspirin 95% CI 0.49-0.89; vs placebo 0.37-0.71; vs dipyridamole 0.42-0.90; vs vorapaxar 0.35-0.74; vs sarpogrelate 0.40-0.97; vs ticlopidine 0.43-1.00 (upper bound touches 1.00 — not significant)',
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
    applicabilityNotes: 'The lacunar/small-vessel category in this app rests on SPS3, which established that long-term aspirin plus clopidogrel is not the answer after lacunar stroke because bleeding and mortality rise. This network reaches the same conclusion about dual therapy from a much larger evidence base and adds a positive candidate — cilostazol ranked first for MACE. Two cautions belong on the card: the cilostazol evidence base is almost entirely East Asian, where cilostazol is licensed and widely used, and the comparison against ticlopidine touches 1.00 and is not significant, so the ranking is stronger than the individual comparisons. Indirect network estimates are hypothesis-generating for a Western population, not practice-defining.',
    limitations: 'Network meta-analysis relying on indirect comparison, so estimates inherit the transitivity assumptions and any between-trial differences in era, background therapy and stroke definition; the cilostazol evidence derives predominantly from East Asian trials, limiting transportability; SUCRA rankings can promote sparsely-studied agents; 5 of 24 reviewed trials did not connect into the network; no p-values reported; component trials span decades of changing background secondary prevention.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-ssi-antiplatelet-nma-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Reinforces avoiding long-term aspirin plus clopidogrel after small subcortical infarction on bleeding grounds, and flags cilostazol as the best-ranked single agent in a largely East Asian evidence base that has not been replicated in Western populations.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
      sich: 'No symptomatic intracranial haemorrhage was reported; the single major bleeding event was a subarachnoid haemorrhage, which occurred in the anticoagulant group',
      mortality: 'No deaths in either group',
      other: 'One major bleeding event in the entire trial (subarachnoid haemorrhage, anticoagulant group)'
    },
    imagingCriteria: 'Clinician-diagnosed extracranial carotid or vertebral artery dissection at enrolment, with central imaging review performed afterwards; that review could not confirm dissection in 52 of 250 patients.',
    applicabilityNotes: 'CADISS is the trial that reframed the whole question. Before it, observational series reported recurrent stroke rates after cervical dissection high enough to make the antiplatelet-versus-anticoagulant choice feel urgent; CADISS found only 4 recurrent strokes among 250 patients over 3 months. That low background rate — not the point estimate — is the durable teaching point, because it means any true difference between the two strategies must be small in absolute terms. Read it as the first half of a pair with TREAT-CAD, and then read the Kaufmann individual-patient-data meta-analysis, which pools exactly these two trials and is the only synthesis of randomised dissection evidence that exists. The 52 unconfirmed diagnoses are also a teaching point in their own right: radiographic criteria for dissection are applied loosely in routine practice.',
    limitations: 'Open-label with blinded endpoint assessment. Grossly underpowered for the primary endpoint — 4 events total, giving a confidence interval spanning from a 99% relative reduction to a fourfold increase. The specific antiplatelet or anticoagulant agent was left to the local clinician, so neither arm tested a single defined regimen. Central review disconfirmed the dissection diagnosis in 52 patients. Treatment lasted only 3 months, so nothing is learned about longer horizons.',
    certainty: 'low',
    evidenceType: 'rct',
    citationIds: ['cit-cadiss-2015'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Establishes that recurrent stroke after cervical artery dissection is uncommon (about 2% at 3 months) and that neither antiplatelet nor anticoagulant therapy has been shown superior — so the choice can be made on bleeding risk, adherence and cost rather than on a presumed efficacy gap.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'cad-antithrombotic-ipd-meta',
    shortName: 'CAD antithrombotic IPD meta-analysis',
    fullName: 'Antithrombotic Treatment for Cervical Artery Dissection: A Systematic Review and Individual Patient Data Meta-Analysis',
    topic: 'cervical-dissection',
    diseaseArea: ['secondary-prevention', 'cervical-dissection'],
    population: {
      n: 444,
      ageRange: 'Pooled participants of CADISS and TREAT-CAD; the paper opens by noting cervical artery dissection is the most common cause of stroke in younger adults',
      nihssRange: 'Not reported as NIHSS in the abstract',
      timeWindow: '90 days of follow-up in both pooled trials',
      keyInclusion: ['Randomised clinical trials comparing antiplatelet with anticoagulant therapy in cervical artery dissection', 'Primary endpoint required to include a composite of any stroke, death, or major bleeding at 90 days', 'PubMed, Cochrane, Embase and ClinicalTrials.gov searched from inception to 1 August 2023', 'Only two eligible trials exist worldwide: CADISS and TREAT-CAD; all participants of both were eligible'],
      keyExclusion: ['Observational cohorts were not eligible — the synthesis is confined to randomised data']
    },
    intervention: 'Anticoagulation (n=218 in the analysed comparison)',
    comparator: 'Antiplatelet therapy (n=226 in the analysed comparison)',
    primaryEndpoint: {
      definition: 'Composite of (1) ischemic stroke, (2) death, or (3) major bleeding (extracranial or intracranial) at 90 days of follow-up, analysed on individual patient data',
      timepoint: '90 days',
      result: 'DID NOT reach statistical significance: 3/218 (1.4%) with anticoagulation versus 10/226 (4.4%) with antiplatelet therapy. The direction favours anticoagulation and the point estimate is large, but with 13 events in total the confidence interval crosses 1 and the authors\' own conclusion is that no significant difference was found in preventing early recurrent events.',
      effectSize: 'OR 0.33',
      confidenceInterval: '95% CI 0.08-1.05',
      pValue: 'P = .06'
    },
    secondaryEndpoints: [
      {
        name: 'Ischemic stroke alone, anticoagulation versus aspirin',
        result: '1/218 (0.5%) versus 10/226 (4.0%); OR 0.14 (95% CI 0.02-0.61), P = .01 — nominally significant, but it rests on a single event in the anticoagulation arm, so treat it as hypothesis-generating rather than as an established effect'
      },
      {
        name: 'Bleeding events',
        result: '2 with anticoagulation versus 0 with antiplatelet therapy — the trade-off the composite is designed to capture'
      },
      {
        name: 'Populations analysed',
        result: '444 patients in the intention-to-treat population and 370 in the per-protocol population; baseline characteristics were balanced'
      }
    ],
    safetyFindings: {
      sich: 'Intracranial bleeding was folded into the composite major-bleeding component; no separate symptomatic intracranial haemorrhage rate is given in the abstract',
      mortality: 'Death was a component of the composite; no separate mortality figure is reported in the abstract',
      other: 'Two bleeding events with anticoagulation versus none with antiplatelet therapy'
    },
    imagingCriteria: 'Determined by the parent trials — clinical diagnosis with central review in CADISS, MRI-verified dissection in TREAT-CAD.',
    applicabilityNotes: 'This is the ceiling of randomised evidence in cervical artery dissection: after searching every database from inception, exactly two trials and 444 patients exist. Pooling them at the individual-patient level puts the stroke-alone estimate in favour of anticoagulation and the bleeding count against it, with a composite that lands at P=.06 — the textbook picture of a question that has not been settled rather than one that has been answered either way. Teach it against the reflex of quoting whichever parent trial supports the reader\'s habit: CADISS alone reads as \'it does not matter\', TREAT-CAD alone reads as \'anticoagulate\', and the pooled data read as \'nobody knows, and the absolute risks are small\'. The single event driving the stroke-alone odds ratio is the number to remember.',
    limitations: 'Only two trials exist to pool, both small, both open-label, and both with heterogeneous antithrombotic regimens within arms. Thirteen primary events across 444 patients. Subgroup analyses used logistic regression with penalised maximum likelihood on very few events and should not be used to select patients. Ninety-day horizon only. No DOAC data at all, since neither parent trial used one.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-kaufmann-ipd-2024'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Confirms that no randomised evidence establishes either antiplatelet or anticoagulant superiority after cervical artery dissection; both remain defensible, and the decision should turn on individual bleeding risk and practical considerations rather than on a claimed efficacy difference.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'danish-hormonal-contraception-cohort',
    shortName: 'Danish Hormonal Contraception Cohort',
    fullName: 'Stroke and myocardial infarction with contemporary hormonal contraception: real-world, nationwide, prospective cohort study',
    topic: 'hormonal-contraception-stroke',
    diseaseArea: ['secondary-prevention', 'hormonal-contraception-stroke'],
    population: {
      n: 2025691,
      ageRange: 'Women aged 15-49 years',
      nihssRange: 'Not applicable — incident first-ever events ascertained from national registry discharge diagnoses, not a severity-stratified cohort',
      timeWindow: 'Denmark, 1996 to 2021; 22,209,697 person-years of follow-up',
      keyInclusion: ['All women aged 15-49 resident in Denmark between 1996 and 2021', 'Exposure defined by nationally recorded contraceptive prescriptions and device codes'],
      keyExclusion: ['History of arterial or venous thrombosis', 'Antipsychotic use, cancer, thrombophilia, liver disease, kidney disease', 'Polycystic ovary syndrome, endometriosis, infertility treatment', 'Hormone therapy use, oophorectomy, hysterectomy']
    },
    intervention: 'Current use of a contemporary hormonal contraceptive — combined oral contraception, progestin-only pill, combined vaginal ring, transdermal patch, progestin-only implant, or levonorgestrel-releasing intrauterine device',
    comparator: 'No current hormonal contraceptive use',
    primaryEndpoint: {
      definition: 'First-time discharge diagnosis of ischaemic stroke or myocardial infarction, expressed as standardised rates per 100,000 person-years and as adjusted rate ratios versus no use. This is a registry cohort, so associations are adjusted but not randomised.',
      timepoint: 'Over 22,209,697 person-years (1996-2021)',
      result: 'POSITIVE ASSOCIATION for every systemic route except the levonorgestrel IUD. 4730 ischaemic strokes and 2072 myocardial infarctions occurred. Standardised ischaemic stroke rate per 100,000 person-years: 18 (95% CI 18 to 19) no use, 39 (36 to 42) combined oral contraception, 33 (25 to 44) progestin-only pills, 23 (17 to 29) intrauterine device. Combined oral contraception carried an adjusted rate ratio of 2.0 (1.9 to 2.2) for ischaemic stroke, equating to 21 (18 to 24) extra strokes per 100,000 person-years — a doubling of a small number.',
      effectSize: 'Adjusted rate ratio 2.0 for ischaemic stroke with combined oral contraception; standardised rate difference 21 extra ischaemic strokes per 100,000 person-years',
      confidenceInterval: '95% CI 1.9 to 2.2 (rate ratio); 95% CI 18 to 24 (rate difference)',
      pValue: 'Not reported in the abstract; inference is presented through confidence intervals'
    },
    secondaryEndpoints: [
      {
        name: 'Myocardial infarction with combined oral contraception',
        result: 'Adjusted rate ratio 2.0 (95% CI 1.7 to 2.2), equating to 10 (7 to 12) extra myocardial infarctions per 100,000 person-years; standardised rate 18 (16 to 20) versus 8 (8 to 9) per 100,000 person-years in non-users'
      },
      {
        name: 'Progestin-only pills',
        result: 'Adjusted rate ratio 1.6 (95% CI 1.3 to 2.0) for ischaemic stroke and 1.5 (1.1 to 2.1) for myocardial infarction; 15 (6 to 24) extra strokes and 4 (-1 to 9) extra myocardial infarctions per 100,000 person-years — the myocardial infarction rate difference crosses zero'
      },
      {
        name: 'Combined vaginal ring',
        result: 'Adjusted incidence rate ratio 2.4 (95% CI 1.5 to 3.7) for ischaemic stroke and 3.8 (2.0 to 7.3) for myocardial infarction'
      },
      {
        name: 'Transdermal patch',
        result: 'Adjusted incidence rate ratio 3.4 (95% CI 1.3 to 9.1) for ischaemic stroke; no myocardial infarctions occurred, so no estimate is possible'
      },
      {
        name: 'Progestin-only implant',
        result: 'Adjusted incidence rate ratio 2.1 (95% CI 1.2 to 3.8) for ischaemic stroke; three or fewer myocardial infarctions, so the myocardial infarction estimate is uninformative'
      },
      {
        name: 'Progestin-only (levonorgestrel-releasing) intrauterine device',
        result: 'NO INCREASE: adjusted incidence rate ratio 1.1 (95% CI 1.0 to 1.3) for ischaemic stroke and 1.1 (0.9 to 1.3) for myocardial infarction — the only method in the study without a detected arterial signal'
      }
    ],
    safetyFindings: {
      sich: 'Not assessed — the outcomes were ischaemic stroke and myocardial infarction; haemorrhagic stroke was not an endpoint of this analysis',
      mortality: 'Not reported in the abstract',
      other: 'Absolute risks were low throughout: even the highest standardised ischaemic stroke rate (39 per 100,000 person-years on combined oral contraception) means roughly 1 event per 2,500 woman-years'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the evidence behind the hormonal-contraception counselling conversation, and it is a counselling conversation rather than a prohibition. The relative risks look alarming and the absolute risks do not: roughly 21 extra ischaemic strokes and 10 extra myocardial infarctions per 100,000 woman-years on combined oral contraception, against a background of 18 and 8. The clinically usable pattern is that every systemic route studied — oestrogen-containing and progestin-only alike, including the implant — carried an elevated arterial rate ratio, while the levonorgestrel-releasing intrauterine device did not, so the LNG-IUD is the method that keeps effective contraception available to a woman with vascular risk. Two boundaries matter when teaching this. First, it is a registry cohort: prescription records are not consumption, and residual confounding by migraine, smoking and body mass index cannot be excluded even after the extensive exclusions. Second, the cohort excluded women with prior arterial or venous thrombosis, so it does not directly answer what to do after a stroke has already happened — that is an extrapolation, not a finding.',
    limitations: 'Observational registry cohort, not randomised; exposure is inferred from dispensed prescriptions and device codes. Women with prior thrombosis, thrombophilia and several relevant comorbidities were excluded by design, which strengthens internal validity but narrows applicability to exactly the secondary-prevention patient a stroke clinician most often sees. Patch and implant estimates rest on few events and have very wide intervals. Danish population only, with limited ethnic diversity. Migraine with aura — the interaction clinicians most want quantified — is not addressed in the abstract.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-yonis-contraception-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Gives numbers for the contraception conversation: systemic hormonal methods roughly double a small absolute arterial risk in women aged 15-49, while the levonorgestrel intrauterine device shows no detected increase — making it the default option to discuss when arterial risk is the deciding factor.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    applicabilityNotes: 'This is the companion piece to the larger Danish hormonal-contraception cohort, and the two must be read together rather than as independent confirmation — they draw on the same national registries over heavily overlapping person-years. The useful teaching is in the comparator that changes: measured against non-use, progestogen-only methods showed no increase here; measured against ethinylestradiol-containing combined contraceptives, they showed roughly half the ischemic stroke rate. Both statements are compatible, and neither licenses a strong claim, because the authors themselves caution that the absolute number of strokes avoided by switching is small and undetectable for most women under 40. Frame a switch from a combined pill to a progestogen-only method as a low-cost, risk-neutral-to-favourable adjustment for a woman with vascular risk, not as a lifesaving intervention. Note that this cohort of non-pregnant women aged 18-49 was not selected for prior stroke, so it does not directly answer contraceptive choice after a stroke.',
    limitations: 'Observational registry cohort; exposure inferred from dispensed prescriptions and device codes rather than measured use. Shares its data source and much of its follow-up with the larger Danish hormonal-contraception cohort, so it is a companion comparison rather than independent replication. The implant and injection strata contribute few person-years and correspondingly imprecise estimates. Intracerebral haemorrhage confidence intervals are too wide to support any conclusion. Migraine with aura and smoking interactions are not reported in the abstract. Danish population only.',
    certainty: 'low',
    evidenceType: 'observational',
    citationIds: ['cit-danish-poc-stroke-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports progestogen-only contraceptives — pills, implants, injections and the levonorgestrel IUD — as reasonable alternatives when stroke risk is a deciding factor, while making clear that the absolute gain from switching is small.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'finnish-subsequent-pregnancy-after-maternal-stroke',
    shortName: 'Finnish Subsequent-Pregnancy Cohort',
    fullName: 'Stroke Recurrence and Pregnancy Outcomes in the Subsequent Pregnancies After Maternal Ischemic Stroke',
    topic: 'pregnancy-stroke',
    diseaseArea: ['special-populations', 'pregnancy-stroke'],
    population: {
      n: 90,
      ageRange: 'Women of reproductive age who sustained an ischemic stroke during pregnancy or the puerperium',
      nihssRange: 'Not reported as NIHSS',
      timeWindow: 'Index strokes occurred in Finland 1987-2016; subsequent pregnancies followed thereafter through national registers',
      keyInclusion: ['Ischemic stroke diagnosed during pregnancy or puerperium in Finland, 1987-2016', 'Diagnoses verified against medical records rather than accepted from register codes alone', 'Survived at least 1 year after the index stroke', 'Three matched controls without maternal stroke identified for each case'],
      keyExclusion: ['Death within 1 year of the index stroke']
    },
    intervention: 'Prior maternal ischemic stroke (n=90 women with data on subsequent pregnancies) — an exposure, not a treatment',
    comparator: 'Matched women without maternal stroke, three controls per case, drawn from the Medical Birth Register',
    primaryEndpoint: {
      definition: 'Stroke recurrence, other pregnancy complications, and implementation of secondary prevention in subsequent pregnancies of women with a prior maternal ischemic stroke, compared with matched controls. Register-based matched cohort — associations are adjusted but not randomised.',
      timepoint: 'Across all subsequent pregnancies after the index maternal stroke',
      result: 'Women with a prior maternal ischemic stroke were LESS likely to have any subsequent pregnancy: 38.9% versus 51.7% of controls, age-adjusted OR 0.55. Among those who did conceive again, three women had a recurrent maternal ischemic stroke or transient ischemic attack — reported as 8.6%, which is 3 events among the roughly 35 women who had a subsequent pregnancy, NOT 3 of 90. With three events, this figure is an order-of-magnitude estimate only.',
      effectSize: 'Age-adjusted OR 0.55 for having at least one subsequent pregnancy; recurrent ischemic stroke or TIA in 8.6% of those who conceived again',
      confidenceInterval: '95% CI 0.32 to 0.93 (odds of a subsequent pregnancy); no confidence interval is reported around the 8.6% recurrence figure',
      pValue: 'Not reported in the abstract for the primary comparison'
    },
    secondaryEndpoints: [
      {
        name: 'Multiple induced abortions',
        result: 'More common after maternal stroke: adjusted OR 6.24 (95% CI 1.12 to 34.88) — an interval spanning nearly two orders of magnitude, so the direction is more trustworthy than the magnitude'
      },
      {
        name: 'Diabetes during a subsequent pregnancy',
        result: '29.1% versus 13.6% in controls; adjusted OR 2.77 (95% CI 1.17 to 6.59)'
      },
      {
        name: 'Hypertensive disorders of pregnancy',
        result: '12.7% versus 4.5%; adjusted OR 3.57 (95% CI 1.02 to 12.51) — lower bound essentially at unity'
      },
      {
        name: 'Perinatal death in the first subsequent pregnancy',
        result: '5.9% versus 0% in controls, P=0.042 — a comparison against a zero-event control group, so it should be read as a flag rather than as a rate'
      },
      {
        name: 'Antithrombotic use in the first subsequent pregnancy',
        result: '87.9% of women with prior maternal stroke used antithrombotic medication in the first subsequent pregnancy, and this declined across later pregnancies; use of other secondary preventive medications was uncommon both before and during pregnancy'
      }
    ],
    safetyFindings: {
      sich: 'Not assessed',
      mortality: 'Women who died within 1 year of the index stroke were excluded by design, so this cohort says nothing about early mortality; perinatal death in the first subsequent pregnancy was 5.9% versus 0% in controls',
      other: 'The dominant safety pattern is obstetric rather than neurological: diabetes and hypertensive disorders of pregnancy were both substantially more common'
    },
    imagingCriteria: '',
    applicabilityNotes: 'This is the only evidence that speaks to the question a young woman actually asks after a pregnancy-associated stroke — can I get pregnant again — and its answer is \'usually yes, with planning\', delivered with very wide uncertainty. Three recurrences among roughly 35 subsequent pregnancies is the whole recurrence dataset, so any number quoted from it should be given as an approximation with its fragility stated aloud. The more robust findings are the ones with larger denominators: subsequent pregnancies after maternal stroke carried more diabetes and more hypertensive disorders of pregnancy, and secondary preventive medication other than antithrombotics was rarely used. That last point is a care-gap observation, not an efficacy result. Note also that fewer of these women conceived again at all, which may reflect counselling, choice, or the stroke itself — the study cannot distinguish these.',
    limitations: 'Only 90 women with subsequent-pregnancy data and three recurrence events; every estimate is fragile and several confidence intervals span an order of magnitude. Register-based, though diagnoses were verified against medical records. Index strokes span 1987-2016, so early cases predate contemporary imaging, thrombolysis and secondary prevention. Women who died within a year were excluded, selecting for survivors. Finnish population only. Nothing here is a treatment comparison, so it cannot say whether continuing antithrombotics through a subsequent pregnancy changes outcomes.',
    certainty: 'very-low',
    evidenceType: 'observational',
    citationIds: ['cit-finnish-subseq-pregnancy-2025'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supplies the first numbers for counselling after a pregnancy-associated ischemic stroke: most subsequent pregnancies proceed, but they behave as high-risk pregnancies warranting planned antithrombotic continuation, blood-pressure surveillance and glucose screening.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
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
    verificationStatus: 'verified-pubmed'
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
    imagingCriteria: 'Standardised radiological protocol including MRI in every participant, which is how the silent-infarct and white-matter findings were obtained.',
    applicabilityNotes: 'sifap is the only large systematic estimate of how often a rare monogenic cause turns up in young stroke, and it should be taught in both directions. A 0.5% definite yield is far above the general-population prevalence of Fabry disease, so the condition genuinely belongs on the young-stroke differential — but it is low enough that reflexive alpha-galactosidase testing in every young stroke patient is a poor use of the workup. The practical rule that follows is phenotype-driven screening: acroparesthesias, cornea verticillata, angiokeratoma, proteinuria, left ventricular hypertrophy, hearing loss, or a suggestive family history. Two other findings from this cohort are arguably more useful at the bedside than the Fabry number: the commonest ischemic mechanisms in patients aged 18-55 were large-artery atherosclerosis and dissection, and one in five \'first-ever\' strokes already had silent infarcts on MRI, which changes both prognosis and the aggressiveness of secondary prevention. Enrolment closed in 2010, so contemporary imaging and detection practices differ.',
    limitations: 'The 0.5% figure rests on the study\'s own definite-versus-probable classification algorithm, which has been debated since publication; different criteria give different prevalences. Enrolment closed in January 2010, predating current MRI and genetic-testing practice. Confined to 15 European countries, so ethnic and geographic generalisability is limited. Observational with no comparator, so it establishes yield rather than the value of testing. Enrolment at specialist centres selects for referred cases.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-sifap-2013'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports phenotype-driven rather than universal Fabry screening in young stroke — about 1 in 200 young stroke patients has definite Fabry disease — while showing that large-artery atherosclerosis and dissection, not rare diseases, dominate the causes of stroke between 18 and 55.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'ukyss',
    shortName: 'UKYSS',
    fullName: 'Demographics, risk factor profiles and etiologies in young ischemic and hemorrhagic stroke — the United Kingdom Young Stroke Study (UKYSS)',
    topic: 'young-stroke-workup',
    diseaseArea: ['acute-ischemic-stroke', 'young-stroke-workup'],
    population: {
      n: 1765,
      ageRange: 'Mean age 41.6 years (SD 7.1)',
      nihssRange: 'Not reported as NIHSS in the abstract',
      timeWindow: 'First-ever stroke; ambispective observational data collection',
      keyInclusion: ['Young adults with a first-ever stroke (ischemic or hemorrhagic)', 'Eight UK centres', '61.7% (1089) male; 82.4% (1454) white', 'ISRCTN 11029266'],
      keyExclusion: ['Recurrent stroke — the cohort is restricted to first-ever events']
    },
    intervention: 'None — an observational description of demographics, risk factors, investigations and etiologies in young stroke',
    comparator: 'Internal comparisons only: by sex, by age band (18-44 versus 45-49), by ethnicity and by stroke type',
    primaryEndpoint: {
      definition: 'Baseline demographics, vascular risk-factor profiles and assigned stroke etiologies in young adults with first-ever stroke, with prespecified subgroup analysis by sex, age, ethnicity and stroke type',
      timepoint: 'At the index stroke admission',
      result: 'DESCRIPTIVE, and the headline is how conventional young stroke turns out to be. Among ischemic strokes, 50.8% (723) were classified cryptogenic and 38.1% (542) hypertensive. Only 13.4% (191) of the whole cohort received intravenous thrombolysis and 5% (71) mechanical thrombectomy. Among hemorrhagic strokes, hypertension was both the commonest risk factor (56.6%, 192) and the commonest etiology (49.6%, 168), and 15.3% (52) underwent neurosurgery.',
      effectSize: '50.8% of young ischemic strokes classified cryptogenic; 38.1% hypertensive',
      confidenceInterval: 'Not reported for the descriptive proportions',
      pValue: 'Comparisons used chi-squared or Fisher exact tests for categorical variables and t-tests or Mann-Whitney U for means; individual p-values are not given in the abstract'
    },
    secondaryEndpoints: [
      {
        name: 'Risk factors by age band',
        result: 'Patients aged 45-49 had higher rates of smoking, hypertension, diabetes, hyperlipidemia, excess alcohol use, coronary artery disease and atrial fibrillation, while those aged 18-44 had higher recreational drug use, combined oral contraceptive pill use and active malignancy'
      },
      {
        name: 'Risk factors by sex',
        result: 'Males had higher hypertension, hyperlipidemia and excess alcohol use; females had higher migraine and active malignancy'
      },
      {
        name: 'Risk factors by ethnicity',
        result: 'White patients had higher smoking, excess alcohol use, recreational drug use and migraine; non-white patients had higher hypertension, diabetes and hyperlipidemia'
      },
      {
        name: 'Acute reperfusion treatment rates',
        result: '13.4% (191) received intravenous thrombolysis and 5% (71) mechanical thrombectomy — low enough to raise the question of whether young stroke is being recognised in time'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — an observational cohort with no assigned intervention',
      mortality: 'Not reported in the abstract',
      other: 'Not applicable'
    },
    imagingCriteria: '',
    applicabilityNotes: 'UKYSS is the corrective to the way young stroke is usually taught. The framing that a stroke under 50 implies an exotic mechanism holds mainly under 45: in the 45-49 band the risk-factor profile was already the conventional atherosclerotic one, with more smoking, hypertension, diabetes, hyperlipidemia, coronary disease and atrial fibrillation, while recreational drug use and combined oral contraceptive use clustered in the 18-44 group. Hypertension dominated both halves of the cohort — 38.1% of ischemic strokes and both the commonest risk factor and the commonest etiology in hemorrhagic stroke — which makes blood pressure, not the rare-disease panel, the highest-yield thing to address. The other number worth carrying is that half of young ischemic strokes were still classified cryptogenic after workup: that is the honest baseline against which any new diagnostic test in this population should be judged. Read alongside sifap for how rarely a monogenic cause is found and alongside the Jefferson thrombophilia audit for what the reflex panel actually returns.',
    limitations: 'Observational and ambispective, so retrospectively collected data are mixed with prospective, and the depth of workup varied across the eight centres — which directly affects how many strokes end up labelled cryptogenic. UK centres only, with 82.4% white participants, limiting ethnic generalisability. Etiologic classification was site-assigned without a central adjudication process described in the abstract. No outcome data are reported, so nothing can be inferred about prognosis or about the consequences of the low reperfusion-treatment rates. Descriptive throughout — every between-group difference is unadjusted.',
    certainty: 'moderate',
    evidenceType: 'observational',
    citationIds: ['cit-ukyss-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Sets realistic expectations for the young-stroke workup: half of young ischemic strokes remain cryptogenic, hypertension is the single most common modifiable factor across both ischemic and hemorrhagic young stroke, and by the late forties the risk-factor profile is already conventional.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'illicit-drug-use-stroke-mr',
    shortName: 'Illicit Drug Use and Stroke (meta-analysis + Mendelian randomization)',
    fullName: 'Does illicit drug use increase stroke risk? A systematic review, meta-analyses, and Mendelian randomization analysis',
    topic: 'young-stroke-workup',
    diseaseArea: ['acute-ischemic-stroke', 'young-stroke-workup'],
    population: {
      n: 32,
      ageRange: 'Not restricted by age; the observational component draws on administrative, hospital-based and population-based datasets totalling more than 100 million participants across 32 studies',
      nihssRange: 'Not applicable',
      timeWindow: 'Studies from inception of the searched databases; PROSPERO registration CRD420251053702',
      keyInclusion: ['Studies reporting associations between illicit drug use and stroke, pooled with multivariate random-effects models by ischemic and hemorrhagic subtype', 'Two-sample Mendelian randomization using genome-wide association study summary statistics for seven drug exposures, against all stroke, ischemic and hemorrhagic stroke, and ischemic stroke subtypes'],
      keyExclusion: ['Not enumerated in the abstract']
    },
    intervention: 'Illicit substance exposure — cannabis, cocaine, amphetamines and opioids in the observational meta-analysis; genetically predicted cannabis use disorder, cocaine dependence, alcohol misuse, nicotine dependence and overall substance use disorder in the Mendelian randomization',
    comparator: 'Non-users in the observational studies; genetically predicted lower exposure in the Mendelian randomization',
    primaryEndpoint: {
      definition: 'Pooled odds ratios for stroke associated with illicit drug use, by ischemic and hemorrhagic subtype, from random-effects meta-analysis of observational studies',
      timepoint: 'Across all included studies (systematic review; no single follow-up horizon)',
      result: 'POSITIVE for three of four drug classes: cannabis OR 1.37 (95% CI 1.14-1.65), cocaine OR 1.96 (95% CI 1.27-3.01) and amphetamines OR 2.22 (95% CI 1.40-3.53) were each significantly associated with increased stroke risk, while opioids showed NO significant association. The authors state explicitly that the cannabis finding showed heterogeneity and small-study effects, so it is the least secure of the three.',
      effectSize: 'Cannabis OR 1.37; cocaine OR 1.96; amphetamines OR 2.22; opioids not significant',
      confidenceInterval: '95% CI 1.14-1.65 (cannabis); 1.27-3.01 (cocaine); 1.40-3.53 (amphetamines)',
      pValue: 'Not reported in the abstract; inference is presented through confidence intervals'
    },
    secondaryEndpoints: [
      {
        name: 'Mendelian randomization — cannabis use disorder',
        result: 'Associated with any stroke, OR 1.11 (95% CI 1.01-1.51), and with large-artery stroke, OR 1.35 (95% CI 1.01-1.80); both lower bounds sit essentially at unity'
      },
      {
        name: 'Mendelian randomization — cocaine dependence',
        result: 'Associated with cardioembolic stroke, OR 1.08 (95% CI 1.02-1.14), and with intracerebral hemorrhage, OR 1.38 (95% CI 1.15-1.65)'
      },
      {
        name: 'Mendelian randomization — overall substance use disorder',
        result: 'Associated with any stroke, OR 1.33 (95% CI 1.02-1.72), and with intracerebral hemorrhage, OR 7.79 (95% CI 3.46-17.54). The hemorrhage point estimate is implausibly large for a real causal magnitude and should be read as directional only.'
      },
      {
        name: 'Mendelian randomization — alcohol and nicotine',
        result: 'Problematic and dependent alcohol use was linked to large-artery and cardioembolic stroke; nicotine dependence showed NO significant associations, which is discordant with the established observational literature on smoking and is itself a reason for caution about the instruments'
      }
    ],
    safetyFindings: {
      sich: 'Not applicable — an aetiological synthesis, not a treatment study',
      mortality: 'Not reported',
      other: 'Not applicable'
    },
    imagingCriteria: '',
    applicabilityNotes: 'The value of this record is the convergence of two designs with different biases: observational studies of substance use are confounded by everything that travels with substance use, while Mendelian randomization is not confounded in that way but depends on genetic instruments being valid. Both point the same direction for cocaine, amphetamines and cannabis, which is a stronger argument than either alone and supports taking a substance-use history and a toxicology screen seriously in the young cryptogenic workup. Read the numbers with discipline, though. The relative risks are modest (1.37 to 2.22), the cannabis estimate carries acknowledged heterogeneity and small-study effects, several Mendelian randomization lower bounds sit at 1.01, and the substance-use-disorder-to-intracerebral-hemorrhage odds ratio of 7.79 is too large to be a calibrated causal effect. The negative nicotine result — where the true effect is well established — is the clearest warning that the genetic instruments here are imperfect. Nothing in this paper compares a toxicology screen against any other diagnostic test, so it supports asking the question rather than ranking it against alternatives.',
    limitations: 'The observational component pools heterogeneous administrative, hospital-based and population datasets in which exposure ascertainment differs and confounding by smoking, alcohol and social determinants is severe. Cannabis findings showed heterogeneity and small-study effects by the authors\' own account. Mendelian randomization assumes valid, exclusive genetic instruments, and the null result for nicotine dependence suggests those assumptions are strained. Several confidence intervals are barely away from unity or extraordinarily wide. Genetic instruments derive largely from European-ancestry genome-wide association studies, limiting transportability.',
    certainty: 'low',
    evidenceType: 'meta-analysis',
    citationIds: ['cit-illicit-drugs-stroke-mr-2026'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Supports routinely taking a substance-use history — and considering a toxicology screen — in young or cryptogenic stroke, since cocaine, amphetamine and cannabis exposure show concordant observational and genetic associations with stroke.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
  t({
    id: 'save-childs',
    shortName: 'Save ChildS',
    fullName: 'Feasibility, Safety, and Outcome of Endovascular Recanalization in Childhood Stroke: The Save ChildS Study',
    topic: 'pediatric-stroke',
    diseaseArea: ['special-populations', 'pediatric-stroke'],
    population: {
      n: 73,
      ageRange: 'Under 18 years; median age 11.3 years (IQR 7.0-15.0). 37 (51%) boys and 36 (49%) girls',
      nihssRange: 'Median Pediatric NIH Stroke Scale (PedNIHSS) 14.0 (IQR 9.2-20.0) at admission, on a scale of 0 (no deficit) to 34 (maximum deficit)',
      timeWindow: 'Cases accrued 1 January 2000 to 31 December 2018; median follow-up 16 months. No uniform time-from-onset window was applied — treatment timing was at the discretion of the treating centre',
      keyInclusion: ['All pediatric patients (under 18 years) with ischemic stroke who underwent endovascular recanalization', 'Databases of 27 stroke centres in Europe and the United States', '63 (86%) treated for anterior circulation occlusion; 10 (14%) for posterior circulation occlusion', '16 (22%) received concomitant intravenous thrombolysis'],
      keyExclusion: ['Children who did not undergo endovascular recanalization — there is no untreated comparison group']
    },
    intervention: 'Endovascular recanalization (thrombectomy) in children, performed off-label at the treating centre\'s discretion (n=73)',
    comparator: 'NONE. This is a single-arm retrospective cohort. Where safety is compared, the reference is the HERMES meta-analysis of adult thrombectomy trials, which is an external and non-randomised comparison.',
    primaryEndpoint: {
      definition: 'Decrease in the Pediatric NIH Stroke Scale (PedNIHSS, range 0-34) from admission to day 7. Because the cohort is single-arm, this measures change over time in treated children and CANNOT establish that thrombectomy caused the improvement — spontaneous recovery and selection of children likely to do well are unexcluded alternative explanations.',
      timepoint: 'Day 7',
      result: 'Neurologic status improved: median PedNIHSS fell from 14.0 (IQR 9.2-20.0) at admission to 4.0 (IQR 2.0-7.3) at day 7. With no control arm, this is a description of outcome after treatment, not a treatment effect.',
      effectSize: 'Median PedNIHSS 14.0 at admission to 4.0 at day 7 (uncontrolled within-cohort change)',
      confidenceInterval: 'Not applicable — no between-group comparison was made',
      pValue: 'Not applicable — no between-group comparison was made'
    },
    secondaryEndpoints: [
      {
        name: 'Modified Rankin Scale at 6 months',
        result: 'Median mRS 1.0 (IQR 0-1.6)'
      },
      {
        name: 'Modified Rankin Scale at 24 months',
        result: 'Median mRS 1.0 (IQR 0-1.0)'
      },
      {
        name: 'Symptomatic intracerebral hemorrhage compared with adult randomized trials',
        result: 'Proportion of symptomatic intracerebral hemorrhage events was 2.79 (95% CI 0.42-6.66) in the HERMES meta-analysis of adult trials and 1.37 (95% CI 0.03-7.40) in Save ChildS — overlapping intervals, so the honest reading is that no difference was detected, not that children bleed less'
      }
    ],
    safetyFindings: {
      sich: 'Symptomatic intracerebral hemorrhage proportion 1.37 (95% CI 0.03-7.40) versus 2.79 (95% CI 0.42-6.66) in the adult HERMES meta-analysis — an interval so wide it excludes very little',
      mortality: 'Not reported in the abstract',
      other: 'One patient (1%) developed a postinterventional bleeding complication and 4 patients (5%) developed transient peri-interventional vasospasm'
    },
    imagingCriteria: 'Large intracranial vessel occlusion identified on site imaging; no central imaging core-laboratory adjudication or uniform selection paradigm is described, and selection criteria necessarily varied across 27 centres and 19 years.',
    applicabilityNotes: 'The most important thing this record teaches is what does not exist. There is essentially NO randomized evidence for acute reperfusion therapy in childhood arterial ischemic stroke. The one randomized attempt — Thrombolysis in Pediatric Stroke (TIPS, NCT01591096), a phase 1 dose-finding study of intravenous tPA in children aged 2-17 within 4.5 hours — was TERMINATED after enrolling 1 participant against a planned maximum of 36, running from October 2012 to December 2013 (ClinicalTrials.gov record verified 28 August 2026). Childhood stroke is rare, often recognised late, and hard to randomise, so the field is unlikely to produce an adequately powered trial soon. Save ChildS is therefore the best available evidence and it is a 73-child retrospective single-arm series assembled from 27 centres over 19 years. Read it accordingly: it establishes that thrombectomy is technically feasible in children and that the reported complication rates are not obviously worse than in adult trials, and it establishes nothing about whether thrombectomy is better than medical management in a child. Where thrombectomy is offered to a child, it is an off-label extrapolation from adult randomized trials supported by this feasibility series — that framing, not a claimed efficacy result, is what belongs in a conversation with a family.',
    limitations: 'Retrospective, single-arm, and drawn from 27 centres over 19 years, so it is subject to profound selection and reporting bias: centres contribute the children they treated, and children treated are those judged good candidates. No control group of medically managed children, so no efficacy inference is possible. Only 73 children, with the posterior circulation represented by 10. No uniform selection imaging, no uniform time window, no central adjudication. Mortality is not reported in the abstract. The comparison against HERMES is external and non-randomised, with confidence intervals wide enough to be nearly uninformative. Device and technique changed substantially over the 2000-2018 accrual period.',
    certainty: 'very-low',
    evidenceType: 'observational',
    citationIds: ['cit-save-childs-2020', 'cit-tips-study-2009'],
    relatedActiveTrialIds: [],
    practiceImpact: 'Frames pediatric thrombectomy honestly: feasible, with complication rates not detectably worse than in adult trials, but supported only by a 73-child uncontrolled series because the sole randomized pediatric thrombolysis trial closed after enrolling one child — so it remains an off-label, case-by-case extrapolation from adult evidence.',
    lastReviewed: '2026-08-28',
    verificationStatus: 'verified-pubmed'
  }),
];

const byId = new Map(completedTrials.map((c) => [c.id, c]));

export function getCompletedTrial(id) {
  return byId.get(id) || null;
}

export function getAllCompletedTrialIds() {
  return new Set(byId.keys());
}
