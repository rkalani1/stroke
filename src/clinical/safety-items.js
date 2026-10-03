// Existing Encounter review prompts; these tiers require drug-specific clinician adjudication.
const absoluteContraindications = [
                                  // RED: Generally prohibit thrombolytics
                                  { id: 'currentICH', label: 'Hemorrhage on CT imaging', note: null },
                                  { id: 'intracranialTumor', label: 'Intra-axial intracranial neoplasm', note: 'extra-axial neoplasm is not itemized here; benefit generally outweighs risk' },
                                  { id: 'aorticDissection', label: 'Aortic arch dissection', note: null },
                                  { id: 'activeInternalBleeding', label: 'Active internal bleeding', note: null },
                                  { id: 'giMalignancy', label: 'GI malignancy', note: null },
                                  { id: 'sahPresentation', label: 'Clinical presentation suggestive of SAH', note: 'even if CT normal' },
                                  { id: 'infectiveEndocarditis', label: 'Presentation consistent with infective endocarditis', note: null },
                                  { id: 'acuteSevereTBI', label: 'Moderate-severe TBI within 14 days', note: 'GCS <13 OR intracranial hemorrhage / contusion / skull fracture (AHA/ASA 2026)' },
                                  { id: 'severeUncontrolledHTN', label: 'SBP >185 or DBP >110 mmHg', note: 'unresponsive to treatment' },
                                  { id: 'lowPlatelets', label: 'Platelet count <100,000', note: null },
                                  { id: 'warfarinElevatedINR', label: 'Warfarin use with PT >15s, INR >1.7, or aPTT >40s', note: null },
                                  { id: 'knownBleedingDiathesis', label: 'Severe coagulopathy or bleeding diathesis', note: null },
                                  { id: 'recentDOAC', label: 'DOAC exposure: factor Xa inhibitor or dabigatran within 48 h, or timing unknown', note: 'IVT is not recommended unless drug-specific assays are normal or the approved local pathway permits it (AHA/ASA 2019); estimated clearance does not certify eligibility. Evaluate EVT independently.' }
                                ];
const relativeContraindications = [
                                  // ORANGE: Relative — careful risk-benefit assessment (AHA/ASA 2026)
                                  { id: 'priorICH', label: 'Prior intracranial hemorrhage', note: null },
                                  { id: 'vascularMalformation', label: 'Intracranial vascular malformation', note: 'unless severe neuro sx' },
                                  { id: 'pregnancy', label: 'Pregnancy', note: 'consult OB/GYN; alteplase/TNK do not cross placenta' },
                                  { id: 'recentStroke', label: 'Ischemic stroke within 3 months', note: null },
                                  { id: 'recentHeadTrauma', label: 'Moderate-severe head trauma', note: 'Drug-specific review required: TNKase label contraindicates intracranial/intraspinal trauma within 2 months.' },
                                  { id: 'recentIntracranialSurgery', label: 'Recent intracranial/intraspinal surgery', note: 'Guideline framework only; TNKase label contraindicates intracranial/intraspinal surgery or trauma within 2 months. Complete drug-specific review.' },
                                  { id: 'recentMajorSurgery', label: 'Non-CNS major surgery or trauma', note: '14 days–3 months — warning only (careful risk-benefit); does not auto-block' },
                                  { id: 'recentGIGUBleeding', label: 'Recent GI/urinary tract hemorrhage', note: '<21 days' },
                                  { id: 'recentArterialPuncture', label: 'Recent arterial puncture at non-compressible site', note: '<7 days' },
                                  { id: 'recentLumbarPuncture', label: 'Recent dural puncture', note: '<7 days' },
                                  { id: 'recentHeparin', label: 'Treatment-dose heparin/LMWH within 24 h', note: 'UFH requires aPTT/dose/time review; aPTT does not exclude LMWH effect. Assess LMWH dose intent and timing separately.' },
                                  { id: 'medicationReconciliation', label: 'Anticoagulant medication record requires reconciliation', note: 'Verify actual use, agent, dose and timing. A medication-name match does not establish recent ingestion or anticoagulant activity.' },
                                  { id: 'abnormalCoagUnknown', label: 'Abnormal aPTT, TT, or anti-Xa with unknown anticoagulant use', note: null },
                                  { id: 'preexistingDisability', label: 'Pre-existing disability', note: 'individualize — weigh goals of care' },
                                  { id: 'acutePericarditis', label: 'Acute pericarditis', note: null },
                                  { id: 'unrupturedAneurysm10mm', label: 'Unruptured unsecured intracranial aneurysm >10mm', note: null },
                                  { id: 'largeInfarct', label: 'Extensive hypoattenuation (>1/3 MCA territory)', note: 're-evaluate onset/benefit' },
                                  { id: 'extensiveHypoattenuation', label: 'Frank hypodensity suggesting established infarct', note: 'weigh against clinical deficit' },
                                  { id: 'cerebralMicrobleeds', label: 'Cerebral microbleeds >10 on prior MRI', note: 'uncertain sICH risk (COR IIb)' },
                                  { id: 'lecanemab', label: 'Lecanemab or other anti-amyloid therapy', note: 'ARIA risk' },
                                  { id: 'lowGlucose', label: 'Blood glucose <50 mg/dL', note: 'correct and reassess — auto-blocks TNK until corrected' },
                                  { id: 'elevatedAPTT', label: 'aPTT >40 seconds', note: 'auto-blocks TNK until anticoagulant effect excluded (conservative hard block)' },
                                  { id: 'severeRenalFailure', label: 'Severe renal impairment', note: 'Not a guideline IVT contraindication; individualize (bleeding risk, anticoagulant clearance). No validated creatinine or CrCl cutoff applies.' }
                                ];
const cautionaryConditions = [
                                  // BLUE: Benefits of IVT generally outweigh increased risk (AHA/ASA 2026 Table 8)
                                  { id: 'intracranialAneurysm', label: 'Unruptured intracranial aneurysm (<10mm or secured)', note: 'IVT benefit outweighs risk' },
                                  { id: 'recentMI', label: 'History of myocardial infarction', note: 'IVT benefit outweighs risk' },
                                  { id: 'seizureAtOnset', label: 'Seizure at onset / diagnostic uncertainty', note: 'if true stroke, IVT benefit outweighs risk' },
                                  { id: 'highGlucose', label: 'Blood glucose >400 mg/dL', note: 'correct; if deficits persist, IVT is eligible' },
                                  { id: 'dualAntiplatelet', label: 'Antiplatelet therapy (single or dual)', note: 'IVT recommended despite increased sICH (COR I, B-NR)' },
                                  { id: 'aceInhibitor', label: 'ACE inhibitor use', note: 'Increased angioedema risk in alteplase cohorts; prepare airway assessment without treating ACE-inhibitor use alone as an absolute exclusion.' }
                                ];
export const SAFETY_ITEMS = [...absoluteContraindications, ...relativeContraindications, ...cautionaryConditions];
// Encounter display groups follow the local IVT exclusion list
// (IVT_ABSOLUTE_CONTRAINDICATIONS in institutional-protocols.js) and AHA/ASA 2026
// AIS Table 8. Presentation only: item ids, storage order and screen logic are unchanged.
const DISPLAY_TIER = {
  elevatedAPTT: 'absolute', recentGIGUBleeding: 'absolute', recentHeparin: 'absolute', largeInfarct: 'absolute', extensiveHypoattenuation: 'absolute',
  recentIntracranialSurgery: 'absolute', recentHeadTrauma: 'absolute', recentArterialPuncture: 'absolute', unrupturedAneurysm10mm: 'absolute', lecanemab: 'absolute',
  lowGlucose: 'correctable', highGlucose: 'correctable'
};
const sourceTier = item => absoluteContraindications.includes(item) ? 'absolute' : relativeContraindications.includes(item) ? 'relative' : 'benefit';
export const SAFETY_TIERS = ['absolute', 'correctable', 'relative', 'benefit'].map(tier => [tier, SAFETY_ITEMS.filter(item => (DISPLAY_TIER[item.id] || sourceTier(item)) === tier)]);
