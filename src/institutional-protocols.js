// Example institutional stroke protocols based on current published evidence.
// These are illustrative protocol patterns derived from peer-reviewed trials
// and guideline statements; they are NOT endorsed by any named institution and
// must be adapted to local policy before clinical use. Do not rely on this
// module as the sole source of truth for any patient encounter.
//
// EVIDENCE AUDIT: Last comprehensive review 2026-04-23 against:
// — AHA/ASA AIS 2019 (Powers) + 2019 focused update
// — AHA/ASA ICH 2022 (Greenberg)
// — AHA/ASA aSAH 2023
// — AHA/ASA CVT 2024
// — AHA/ASA Secondary Prevention 2021 (Kleindorfer)
// — ESC AF 2024 (van Gelder — CHA₂DS₂-VA, drops sex)
// — Key trials: NINDS, ECASS III, WAKE-UP, EXTEND, AcT, TRACE-2, TIMELESS,
//   TWIST, MR CLEAN, DAWN, DEFUSE-3, SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT,
//   TENSION, LASTE, BAOCHE, ATTENTION, INTERACT2, ATACH-2, INTERACT3, MISTIE III,
//   ENRICH, ANNEXA-I, CHANCE, POINT, THALES, CHANCE-2, SPARCL, TST, ARCADIA,
//   NAVIGATE-ESUS, RE-SPECT ESUS, CLOSE/RESPECT/REDUCE, CADISS, TREAT-CAD,
//   CREST/CREST-2, CAPRIE, MATCH, SPS3, COMPASS, RESTART, ELAN, OPTIMAS,
//   ENCHANTED2-MT, OPTIMAL-BP, BP-TARGET, BEST-II, AVERT, FOCUS, AFFINITY, SAVE.

// =====================================================================
// Example blood pressure protocols (based on current AHA/ASA evidence)
// =====================================================================
export const INSTITUTIONAL_BP_PROTOCOLS = {
  beforeIVT: {
    scenario: 'Before IVT',
    target: 'BP <185/110',
    cor: '1',
    loe: 'B-NR',
    protocol: 'Labetalol 10 mg IV, repeat q15 min; escalate to 20 mg, then 40 mg, then 60 mg (max single bolus). Max 300 mg in 2h.',
    alternatives: 'Nicardipine 5 mg/hr IV, titrate by 2.5 mg/hr q5 min (max 15 mg/hr). Clevidipine 1-2 mg/hr, double q90 sec (max 32 mg/hr).'
  },
  afterIVT24h: {
    scenario: 'After IVT (24h)',
    target: 'BP <180/105',
    cor: '1',
    loe: 'B-R',
    protocol: 'Monitor q15 min × 2h → q30 min × 6h → q1h until 24h. Treat if SBP >180 or DBP >105.'
  },
  afterEVT24h: {
    scenario: 'After EVT (24h)',
    target: 'BP <180/105',
    cor: '2a',
    loe: 'B-NR',
    protocol: 'For successful recanalization (mTICI ≥2b) maintain SBP in range 140-180 (preserve SBP floor of 140).'
  },
  sbpLT140IVT: {
    scenario: 'SBP <140 after IVT',
    status: 'Not recommended',
    cor: '3 (No Benefit)',
    loe: 'B-R',
    rationale: 'No functional improvement vs <180 target (ENCHANTED2-MT context).'
  },
  sbpLT140EVT: {
    scenario: 'SBP <140 after EVT (×72h)',
    status: 'Likely harmful',
    cor: '— (extrapolated from RCT meta-evidence; AHA/ASA 2019 AIS formal target is SBP <180)',
    loe: 'A (4 RCTs negative/harm)',
    rationale: 'ENCHANTED2-MT (Lancet 2022, n=821) worse mRS shift with <120 × 72h; OPTIMAL-BP (JAMA 2023, n=306) worse mRS 0-2 with <140; BP-TARGET (Lancet Neurol 2021, n=324) neutral/trend harm with 100-129; BEST-II (Stroke 2024) futility for lower targets. Practical extrapolation: maintain SBP floor of 140 for ≥72h post-successful EVT.'
  },
  noReperfusion: {
    scenario: 'Ischemic stroke (no reperfusion therapy)',
    target: 'Permissive until SBP ≥220/120',
    cor: '3 (No Benefit)',
    loe: 'A',
    rationale: 'No benefit to initiating antihypertensive treatment if BP <220/120 without comorbid indication.'
  }
};

// =====================================================================
// Example pre-thrombolytic safety-pause attestation
// =====================================================================
export const SAFE_PAUSE_ATTESTATION = '#STROKESAFEPAUSE';
export const getSafePauseText = ({ consentType = 'informed', bp = '', contraindications = 'reviewed' }) => {
  return `SAFE PAUSE BEFORE THROMBOLYTIC ADMINISTRATION:
(1) Consent confirmed (${consentType}).
(2) BP confirmed ${bp || '<185/110'}.
(3) Absolute & relative contraindications ${contraindications}.
(4) Dose confirmed (weight-based, max 25 mg TNK / 90 mg alteplase).
(5) Safety-pause documented in communication platform.
Attestation: ${SAFE_PAUSE_ATTESTATION}`;
};

// =====================================================================
// IVT eligibility — example institutional algorithm
// =====================================================================
export const evaluateIVT = ({
  ichOnCT,
  disablingDeficit,
  hoursFromLKW,
  glucose,
  weight,
  imagingPathway = {},
  crao,
  age
}) => {
  const hrs = parseFloat(hoursFromLKW);
  const glc = parseFloat(glucose);
  const wt = parseFloat(weight);
  const decisions = [];
  const warnings = [];

  if (ichOnCT === true) return { eligible: false, recommendation: 'IVT not recommended', cor: '3 (Harm)', reason: 'Intracranial hemorrhage on imaging', decisions };
  if (disablingDeficit === false) {
    return {
      eligible: false,
      recommendation: 'IVT NOT recommended',
      cor: '3 (No Benefit)',
      loe: 'B',
      reason: 'Non-disabling deficits. Disabling = impairs ADLs (bathing, ambulating, toileting, hygiene, eating) or return-to-work.',
      decisions
    };
  }

  if (Number.isFinite(glc) && (glc < 50 || glc > 400)) {
    warnings.push(`Glucose ${glc} mg/dL — correct first, then re-assess whether deficit persists on glucose-corrected exam.`);
  }

  if (Number.isFinite(hrs)) {
    if (hrs <= 4.5) {
      decisions.push({ step: 'time', msg: `${hrs}h from LKW — standard 0-4.5h window` });
      return {
        eligible: true,
        recommendation: 'TNK recommended — standard window',
        agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
        dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
        cor: '1',
        loe: 'A',
        warnings,
        decisions,
        nextStep: 'Complete SAFE PAUSE; confirm BP <185/110; review contraindications; obtain consent.',
        alternativeAgent: 'Alteplase 0.9 mg/kg (10% bolus, 90% over 60 min; max 90 mg) — consider if TNK unavailable.'
      };
    }
    const { mismatchPresent, ctpCoreMl, ctpRatio, ctpMismatchVolMl, smallVessel, posteriorCirc, contrastAllergy } = imagingPathway;
    const core = parseFloat(ctpCoreMl);
    const ratio = parseFloat(ctpRatio);
    const mismatchVol = parseFloat(ctpMismatchVolMl);
    const imagingCriteriaMet =
      mismatchPresent === true ||
      ((Number.isFinite(core) && core < 50) && (Number.isFinite(ratio) && ratio >= 1.2) && (Number.isFinite(mismatchVol) && mismatchVol >= 10));
    const preferMRI = smallVessel || posteriorCirc || contrastAllergy;
    if (hrs > 4.5 && hrs <= 9) {
      if (!imagingCriteriaMet) {
        return {
          eligible: false,
          recommendation: 'Imaging criteria not met for extended-window IVT',
          cor: '—',
          reason: 'Requires CTP core <50 mL, ratio ≥1.2, mismatch vol ≥10 mL; or MRI DWI/FLAIR mismatch.',
          decisions,
          warnings,
          imagingGuidance: preferMRI ? 'Prefer MRI if small vessel, posterior circulation, or contrast allergy.' : 'CTP acceptable; MRI alternative.'
        };
      }
      return {
        eligible: 'consider',
        recommendation: 'Consider TNK — extended window (4.5-9h or wake-up with DWI-FLAIR mismatch)',
        agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
        dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
        cor: '2a',
        loe: 'B-R',
        warnings,
        decisions,
        nextStep: 'Confirm imaging criteria, informed consent recommended, SAFE PAUSE attestation.',
        imagingGuidance: preferMRI ? 'Prefer MRI (small vessel / posterior / contrast allergy).' : null
      };
    }
    if (hrs > 9 && hrs <= 24) {
      if (!imagingCriteriaMet) {
        return {
          eligible: false,
          recommendation: 'Imaging criteria not met for 9-24h IVT',
          decisions,
          warnings
        };
      }
      return {
        eligible: 'consider',
        recommendation: 'Consider TNK — late window (9-24h) with CTP-selected mismatch',
        agent: 'Tenecteplase 0.25 mg/kg IV bolus (max 25 mg)',
        dose: Number.isFinite(wt) ? Math.min(25, Math.round(wt * 0.25 * 2) / 2) : null,
        cor: '2b',
        loe: 'B-R',
        warnings,
        decisions,
        nextStep: 'Informed consent required; discuss ~9-11% absolute benefit in 0-disability outcome and ~3% sICH risk.'
      };
    }
    return { eligible: false, recommendation: 'Beyond 24h window — IVT not indicated', decisions, warnings };
  }

  if (crao) {
    return {
      eligible: 'consider',
      recommendation: 'CRAO — consider IVT in select cases with informed consent and shared decision-making.',
      cor: '—',
      loe: 'C-LD',
      rationale: 'Trial evidence does not strongly support efficacy; physiologic rationale + observational data; use within 4.5h only.',
      decisions,
      warnings
    };
  }

  return { eligible: null, recommendation: 'Enter LKW time to evaluate window', decisions, warnings };
};

// =====================================================================
// DOAC-exposed IVT pathway — two example site patterns
// =====================================================================
// Primary hub pattern: requires anti-Xa UNDETECTABLE + attending attestation
// Spoke / tele-consult pattern: requires normal renal function + last dose ≥24h + note documentation
export const evaluateDOAC_IVT = ({
  hoursSinceLastDose,
  antiXaUndetectable,
  renalFunctionNormal,
  disablingDeficit,
  endovascularCandidate,
  site
}) => {
  const hrs = parseFloat(hoursSinceLastDose);
  if (disablingDeficit === false) {
    return { eligible: false, reason: 'Non-disabling deficit — IVT not recommended regardless of DOAC status.' };
  }
  if (endovascularCandidate) {
    return {
      eligible: 'preferred-other',
      reason: 'Endovascular candidate — bypass IVT; proceed directly to EVT.',
      rationale: 'DOAC exposure increases sICH risk with IVT; EVT is preferred if eligible.'
    };
  }
  if (Number.isFinite(hrs) && hrs > 48) {
    return {
      eligible: true,
      pathway: 'standard',
      reason: 'DOAC exposure >48h — standard IVT eligibility applies (DOAC considered cleared).',
      cor: '—',
      loe: 'observational'
    };
  }

  if (site === 'hub') {
    if (antiXaUndetectable === true) {
      return {
        eligible: 'consider',
        pathway: 'hub-anti-Xa-undetectable',
        requirement: 'anti-Xa UNDETECTABLE',
        documentation: 'Attending attestation recommended in note.',
        cor: '2b',
        loe: 'C-LD (observational only; no RCT)',
        rationale: 'Primary-hub example pathway: undetectable anti-Xa suggests cleared anticoagulant effect.'
      };
    }
    return {
      eligible: false,
      pathway: 'hub-pending-lab',
      requirement: 'anti-Xa level required before IVT — order STAT',
      reason: 'Primary-hub pathway requires anti-Xa undetectable; if detectable or unavailable, IVT not recommended.'
    };
  }
  if (site === 'spoke') {
    const renalOk = renalFunctionNormal === true;
    const lastDoseOk = Number.isFinite(hrs) && hrs >= 24;
    if (renalOk && lastDoseOk) {
      return {
        eligible: 'consider',
        pathway: 'spoke',
        requirements: ['Normal renal function', `Last DOAC dose ≥24h ago (${hrs}h reported)`],
        documentation: 'Document criteria in consult note.',
        cor: '2b',
        loe: 'C-LD (observational only)',
        rationale: 'Spoke / tele-consult example pathway (no STAT anti-Xa available): time-based surrogate for DOAC clearance.'
      };
    }
    return {
      eligible: false,
      pathway: 'spoke-criteria-unmet',
      missing: [!renalOk ? 'Abnormal renal function' : null, !lastDoseOk ? `Last dose <24h ago${Number.isFinite(hrs) ? ` (${hrs}h)` : ''}` : null].filter(Boolean),
      reason: 'Spoke pathway requires both normal renal function AND last DOAC dose ≥24h.'
    };
  }
  return { eligible: null, reason: 'Select site pattern (hub vs spoke) to evaluate.' };
};

// =====================================================================
// EVT eligibility — example institutional matrix
// =====================================================================
export const evaluateEVT_Anterior = ({ aspectsScore, timeFromLKWh, nihss, preMRS, age, massEffect }) => {
  const asp = parseFloat(aspectsScore);
  const hrs = parseFloat(timeFromLKWh);
  const n = parseFloat(nihss);
  const mrs = parseFloat(preMRS);
  const a = parseFloat(age);

  if (![asp, hrs, n].every(Number.isFinite)) return { eligible: null, reason: 'Need ASPECTS, LKW hours, and NIHSS.' };
  if (n < 6) return { eligible: false, reason: 'NIHSS <6 — EVT not routinely recommended (may consider for disabling deficit).', cor: '—' };
  if (hrs > 24) return { eligible: false, reason: 'Beyond 24h window — EVT not indicated outside select research protocols.', cor: '—' };

  if (hrs <= 6) {
    if (asp >= 6 && mrs <= 1) return { eligible: true, window: '0-6h', reason: 'Standard EVT criteria met.', cor: '1', loe: 'A' };
    if (asp >= 3 && asp <= 5 && mrs <= 1 && !massEffect) return { eligible: true, window: '0-6h', reason: 'Large-core early-window EVT — no significant mass effect.', cor: '1', loe: 'A' };
    if (asp >= 0 && asp <= 2 && mrs <= 1 && !massEffect && Number.isFinite(a) && a < 80) {
      return {
        eligible: 'consider',
        window: '0-6h expanded',
        reason: 'Very-large-core expansion (ASPECTS 0-2) — age <80, no mass effect; requires CTP core ≤70-100 mL or MR selection.',
        cor: '2a',
        loe: 'B-R'
      };
    }
    if (asp >= 6 && mrs === 2) return { eligible: 'consider', window: '0-6h mild pre-existing disability', reason: 'mRS 2 pre-stroke — mild disability.', cor: '2a', loe: 'B-NR' };
    if (asp >= 6 && (mrs === 3 || mrs === 4)) return { eligible: 'consider', window: '0-6h moderate pre-existing disability', reason: 'mRS 3-4 pre-stroke — individualize per goals of care.', cor: '2b', loe: 'B-NR' };
  }

  if (hrs > 6 && hrs <= 24) {
    if (asp >= 6 && mrs <= 1 && (!Number.isFinite(a) || a < 80) && !massEffect) {
      return { eligible: true, window: '6-24h', reason: 'Late-window EVT — age <80, no significant mass effect; DAWN/DEFUSE-3 selection.', cor: '1', loe: 'A' };
    }
    return { eligible: false, window: '6-24h', reason: 'Does not meet 6-24h standard criteria.', cor: '—' };
  }

  return { eligible: false, reason: 'No matching eligibility tier at entered parameters.', cor: '—' };
};

export const evaluateEVT_M2 = ({ segment, dominant, hoursFromLKWh, nihss, preMRS, aspectsScore }) => {
  const hrs = parseFloat(hoursFromLKWh);
  const n = parseFloat(nihss);
  const mrs = parseFloat(preMRS);
  const asp = parseFloat(aspectsScore);
  if (segment === 'M2-proximal-dominant' && dominant === true) {
    if (hrs <= 6 && n >= 6 && mrs <= 1 && asp >= 6) {
      return {
        eligible: 'consider',
        reason: 'Dominant proximal M2 (proximal segment, ≤1 cm from bifurcation, ≥50% MCA territory supply) within 6h.',
        cor: '2a',
        loe: 'B-NR'
      };
    }
    return { eligible: false, reason: 'Dominant M2 criteria not all met (need ≤6h, NIHSS ≥6, mRS ≤1, ASPECTS ≥6).' };
  }
  if (['M2-nondominant', 'M3', 'ACA', 'PCA', 'M2-codominant'].includes(segment)) {
    return {
      eligible: false,
      cor: '3 (No Benefit)',
      loe: 'A',
      reason: `EVT is NOT recommended for ${segment}. Includes non-dominant / codominant M2, distal MCA (M3), ACA, PCA.`
    };
  }
  return { eligible: null, reason: 'Select segment to evaluate.' };
};

export const evaluateEVT_Basilar = ({ nihss, hoursFromLKWh, preMRS, pcAspects, disabling, dualSpecialtyAgreement }) => {
  const n = parseFloat(nihss);
  const hrs = parseFloat(hoursFromLKWh);
  const mrs = parseFloat(preMRS);
  const pc = parseFloat(pcAspects);
  if (!Number.isFinite(n) || !Number.isFinite(hrs)) return { eligible: null, reason: 'Need NIHSS and LKW hours.' };
  if (hrs > 24) return { eligible: false, reason: 'Beyond 24h basilar window.' };
  if (n >= 10 && mrs <= 1 && pc >= 6) {
    return {
      eligible: true,
      reason: 'Basilar artery occlusion — NIHSS ≥10, mRS ≤1, PC-ASPECTS ≥6, within 24h.',
      cor: '1',
      loe: 'A'
    };
  }
  if (n >= 6 && n <= 9 && mrs <= 1 && pc >= 6) {
    if (disabling && dualSpecialtyAgreement) {
      return {
        eligible: 'consider',
        reason: 'Basilar NIHSS 6-9 — example institutional pathway: disabling deficits + dual-specialty agreement (neurointerventional + stroke attending) required.',
        cor: '2b',
        loe: 'B-R',
        institutionalRequirement: 'Disabling deficits + dual-specialty (IR + stroke) concordance'
      };
    }
    return {
      eligible: 'pending',
      reason: 'Basilar NIHSS 6-9 — effectiveness not well established; example institutional pathway requires disabling deficits + dual-specialty agreement.',
      cor: '2b',
      loe: 'B-R'
    };
  }
  return { eligible: false, reason: 'Basilar EVT criteria not met.' };
};

// =====================================================================
// Patient discussion script (extended-window IVT)
// =====================================================================
export const EXTENDED_WINDOW_IVT_DISCUSSION = `Tenecteplase, a clot-dissolving medication, is a treatment for your suspected stroke that can be given beyond the usual 4.5-hour window when brain imaging shows there is still tissue that can be saved. In clinical trials, people who received this treatment in the extended time window had about a 9-11% better chance of recovering without disability compared with people who did not receive the treatment. However, all medicines have some risk, and with clot-dissolving drugs, there is a risk of serious bleeding. Bleeding into the brain that leads to new symptoms can occur in up to about 3% of those treated. This use of clot-dissolving medications beyond 4.5 hours from stroke onset is supported by limited evidence from clinical trials and many uncertainties remain. Your alternatives include standard stroke care without thrombolysis. Based on your imaging findings and clinical presentation, we suspect the benefit of treatment outweighs the risk and recommend proceeding with Tenecteplase treatment.`;

// =====================================================================
// COR/LOE key
// =====================================================================
export const COR_LOE_KEY = {
  cor: {
    '1': { strength: 'Strong', benefit: 'Benefit >>> Risk', verb: 'Is recommended', color: 'green' },
    '2a': { strength: 'Moderate', benefit: 'Benefit >> Risk', verb: 'Is reasonable', color: 'yellow' },
    '2b': { strength: 'Weak', benefit: 'Benefit ≥ Risk', verb: 'May be considered', color: 'orange' },
    '3-nb': { strength: 'Moderate (No Benefit)', benefit: 'Benefit = Risk', verb: 'Not recommended', color: 'red-light' },
    '3-harm': { strength: 'Strong (Harm)', benefit: 'Risk > Benefit', verb: 'Avoid (harmful)', color: 'red' }
  },
  loe: {
    'A': 'High-quality RCTs / meta-analyses',
    'B-R': 'Moderate-quality RCTs',
    'B-NR': 'Well-designed observational / registry',
    'C-LD': 'Limited data / mechanistic studies',
    'C-EO': 'Expert opinion / consensus'
  }
};

// =====================================================================
// Contraindication lists (absolute, relative, benefit-greater)
// =====================================================================
export const IVT_ABSOLUTE_CONTRAINDICATIONS = [
  { label: 'CT with hemorrhage', detail: 'Acute intracranial hemorrhage on imaging.' },
  { label: 'CT with extensive hypodensity', detail: 'Clear hypodensity responsible for symptoms.' },
  { label: 'Acute intracranial or spinal cord injury <14 days', detail: 'Likely contraindicated.' },
  { label: 'Neurosurgery <14 days', detail: 'Potentially harmful; should not be administered.' },
  { label: 'Infective endocarditis', detail: 'Should not be administered.' },
  { label: 'Severe coagulopathy', detail: 'Plt <100K, INR >1.7, aPTT >40s, PT >15s.' },
  { label: 'Aortic arch dissection', detail: 'Potentially harmful; should not be administered.' },
  { label: 'Moderate-severe TBI <14 days', detail: 'GCS <10 or hemorrhage/contusion/skull fracture.' },
  { label: 'Amyloid immunotherapy / ARIA', detail: 'ICH risk unknown; IV thrombolysis should be avoided.' }
];

export const IVT_RELATIVE_CONTRAINDICATIONS = [
  { label: 'Pre-existing disability/frailty', detail: 'Treatment on individual basis.' },
  { label: 'DOAC exposure <48h', detail: 'Potential efficacy supported by observational studies; see DOAC pathway.' },
  { label: 'Prior ischemic stroke <3 months', detail: 'Weigh timing/size against IVT benefit.' },
  { label: 'Prior ICH', detail: 'Amyloid angiopathy = higher risk. Modifiable causes (HTN) may have greater net benefit.' },
  { label: 'Major non-CNS trauma (14d-3mo)', detail: 'Surgical consultation; consider involved areas.' },
  { label: 'Major non-CNS surgery <10 days', detail: 'Consider surgical area and bleeding risk.' },
  { label: 'GI/GU bleeding <21 days', detail: 'GI/GU consultation.' },
  { label: 'Arterial/dural puncture <7 days', detail: 'May be considered in individual cases.' },
  { label: 'Intracranial vascular malformations', detail: 'Safety unknown; unruptured and untreated.' },
  { label: 'Intracranial arterial dissection', detail: 'Safety unknown.' },
  { label: 'Recent STEMI <3 months', detail: 'Cardiology consult; hemopericardium risk.' },
  { label: 'Acute pericarditis', detail: 'May be reasonable. Emergent cardiology consult.' },
  { label: 'Left atrial or ventricular thrombus', detail: 'May be reasonable if major AIS. Cardiology consult.' },
  { label: 'Pregnancy / post-partum', detail: 'Obstetric consultation; benefits vs uterine bleeding risk.' },
  { label: 'Systemic active malignancy', detail: 'Oncology consultation; consider type, stage, complications.' },
  { label: 'Neurosurgery 14 days-3 months', detail: 'Individual basis; neurosurgical consultation recommended.' }
];

export const IVT_BENEFIT_GREATER_CONSIDER = [
  { label: 'Extracranial cervical dissection', detail: 'Reasonably safe within 4.5h; probably recommended.' },
  { label: 'Extra-axial intracranial neoplasm', detail: 'Benefit likely outweighs risk.' },
  { label: 'Unruptured intracranial aneurysm', detail: 'Benefit likely outweighs risk; treatment should be considered.' },
  { label: 'Angiographic procedural stroke', detail: 'Benefit likely outweighs risk.' },
  { label: 'History of GI/GU bleeding (remote)', detail: 'Candidates if stable; GI/GU consultation.' },
  { label: 'History of MI (remote)', detail: 'Probably greater benefit from IVT.' },
  { label: 'Recreational drug use', detail: 'Greater benefit than risk in most patients.' },
  { label: 'Stroke mimic uncertainty', detail: 'Risk of harm with IVT is low; benefit likely outweighs risk.' },
  { label: 'Moya-moya disease', detail: 'No increased ICH risk; benefit likely outweighs risk.' }
];

export const GENERALIZABILITY_LIMITATIONS = [
  'Age >80',
  'Significant head-size or vessel tortuosity',
  'Comorbidities that affect assessment',
  'Seizures at stroke onset',
  'High suspicion for underlying ICAD',
  'Life expectancy <6 months'
];

// =====================================================================
// Backwards-compat aliases (legacy imports)
// =====================================================================
export const HMC_BP_PROTOCOLS = INSTITUTIONAL_BP_PROTOCOLS;
export const evaluateIVT_HMC = evaluateIVT;
export const evaluateEVT_HMC_Anterior = evaluateEVT_Anterior;
export const evaluateEVT_HMC_M2 = evaluateEVT_M2;
export const evaluateEVT_HMC_Basilar = evaluateEVT_Basilar;
