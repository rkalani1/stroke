// Pure clinical calculator functions extracted from app.jsx.
// Keeping these as a separate module makes them unit-testable and
// lets the bundler tree-shake unused helpers.

// DOAC initiation timing protocols for AF-related ischemic stroke.
// 'elan-optimas' (default): supported by ELAN (Fischer NEJM 2023;388:2411-21, PMID 37222476) and
//   OPTIMAS (Werring Lancet 2024, PMID 39491870) and the CATALYST IPD meta-analysis
//   (Dehbi et al., Lancet 2025, PMID 40570866, doi: 10.1016/S0140-6736(25)00439-8; n=5441 pooling
//   ELAN, OPTIMAS, TIMING, START). Early start ≤4 d for minor/moderate; days 6-7 for major.
//   Symptomatic ICH 0.4% in both arms.
// 'expert-consensus': earlier institutional NIHSS-stratified scheme — predates CATALYST and is
//   sometimes informally called "CATALYST" in older notes; kept under a distinct ID for
//   compatibility but renamed here to disambiguate from the formal IPDMA.
// '1-3-6-12': legacy rule (Heidbuchel 2017 EHRA practical guide) — preserved for institutions
//   still using this default.
// Early DOAC initiation (≤4 days) for minor/moderate AF strokes is supported by ELAN (2023),
// OPTIMAS (2024) and the CATALYST IPD meta-analysis (2025) — not by any AHA/ASA 2024 guideline update.
export const DOAC_PROTOCOLS = {
  'elan-optimas': {
    label: 'ELAN/OPTIMAS — early start (default)',
    days: { minor: 1, moderate: 3, severe: 6, verySevere: 7 },
    source: 'Fischer NEJM 2023 (ELAN, PMID 37222476); Werring Lancet 2024 (OPTIMAS, PMID 39491870); Dehbi Lancet 2025 (CATALYST IPDMA, PMID 40570866, doi: 10.1016/S0140-6736(25)00439-8)'
  },
  // Legacy alias retained for backwards-compatibility with persisted localStorage values.
  // Points to the same protocol as 'expert-consensus'.
  catalyst: {
    label: 'Expert-consensus NIHSS-stratified (legacy)',
    days: { minor: 1, moderate: 3, severe: 6 },
    source: 'Institutional expert-consensus protocol (legacy default; predates the CATALYST IPDMA)'
  },
  'expert-consensus': {
    label: 'Expert-consensus NIHSS-stratified (legacy)',
    days: { minor: 1, moderate: 3, severe: 6 },
    source: 'Institutional expert-consensus protocol (legacy default; predates the CATALYST IPDMA)'
  },
  '1-3-6-12': {
    label: '1-3-6-12 rule',
    days: { minor: 1, moderate: 3, severe: 6, verySevere: 12 },
    source: 'Heidbuchel 2017 EHRA practical guide'
  }
};

export const calculateDOACStart = (nihss, onsetDate, protocol = 'elan-optimas', imagingSize = null) => {
  const nihssVal = parseFloat(nihss);
  if (!onsetDate) return null;
  const onset = new Date(onsetDate);
  if (Number.isNaN(onset.getTime())) return null;
  const rule = DOAC_PROTOCOLS[protocol] || DOAC_PROTOCOLS['elan-optimas'] || DOAC_PROTOCOLS.catalyst;
  const nihssSeverity = Number.isNaN(nihssVal)
    ? 'moderate'
    : nihssVal < 8
      ? 'minor'
      : nihssVal <= 15
        ? 'moderate'
        : nihssVal >= 21 && rule.days.verySevere
          ? 'verySevere'
          : 'severe';
  const imagingSeverityMap = { small: 'minor', moderate: 'moderate', large: 'severe' };
  const imagingSeverity = imagingSize ? (imagingSeverityMap[imagingSize] || null) : null;
  const severityOrder = ['minor', 'moderate', 'severe', 'verySevere'];
  const severity = imagingSeverity && severityOrder.indexOf(imagingSeverity) > severityOrder.indexOf(nihssSeverity)
    ? imagingSeverity
    : nihssSeverity;
  const imagingOverride = imagingSeverity && severity !== nihssSeverity;
  const days = rule.days[severity] ?? rule.days.severe ?? rule.days.moderate;
  const startDate = new Date(onset);
  startDate.setDate(startDate.getDate() + days);
  return { severity, days, startDate, protocol, source: rule.source, imagingOverride };
};

export const calculateNIHSS = (responses) => {
  if (!responses || typeof responses !== 'object') return 0;
  const total = Object.values(responses).reduce((sum, response) => {
    if (typeof response !== 'string') return sum;
    if (response.includes('UN')) return sum; // Untestable items do not contribute to total
    const match = response.match(/\((\d+)\)/);
    const score = match ? parseInt(match[1], 10) : 0;
    return sum + (isNaN(score) ? 0 : score);
  }, 0);
  return Math.min(total, 42);
};

export const calculatePCAspects = (regions) => {
  if (!Array.isArray(regions)) return 0;
  return regions.reduce((total, region) => {
    if (!region || typeof region !== 'object') return total;
    return total + (region.checked ? (region.points || 0) : 0);
  }, 0);
};

export const calculateGCS = (items) => {
  if (!items || typeof items !== 'object') return null;
  const rawEye = parseInt(items.eye || 0, 10) || 0;
  const rawVerbal = parseInt(items.verbal || 0, 10) || 0;
  const rawMotor = parseInt(items.motor || 0, 10) || 0;
  if (rawEye === 0 || rawVerbal === 0 || rawMotor === 0) return null;
  const eye = Math.min(4, Math.max(1, rawEye));
  const verbal = Math.min(5, Math.max(1, rawVerbal));
  const motor = Math.min(6, Math.max(1, rawMotor));
  return eye + verbal + motor;
};

export const calculateICHScore = (items) => {
  if (!items || typeof items !== 'object') return null;
  if (!['gcs34', 'gcs512', 'gcs1315'].includes(items.gcs)) return null;
  if (items.criteriaReviewed !== true) return null;
  let score = 0;
  if (items.gcs === 'gcs34') score += 2;
  else if (items.gcs === 'gcs512') score += 1;
  if (items.age80) score += 1;
  if (items.volume30) score += 1;
  if (items.ivh) score += 1;
  if (items.infratentorial) score += 1;
  return score;
};

// ABCD² (Johnston Lancet 2007;369:283-92). Range 0-7.
// CLINICAL FEATURES: weakness scores 2 points; speech without weakness scores 1; both
// together still scores 2 (weakness only — they are mutually exclusive in the score).
// The UI surfaces this via the `mutuallyExclusiveNote` field below so a user
// who toggles speech-disturbance while weakness is already checked sees why
// the score doesn't change.
export function calculateABCD2Score(items) {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.age60) score += 1;
  if (items.bp) score += 1;
  if (items.unilateralWeakness) score += 2;
  if (items.speechDisturbance && !items.unilateralWeakness) score += 1;
  if (items.duration === 'duration10') score += 1;
  else if (items.duration === 'duration60') score += 2;
  if (items.diabetes) score += 1;
  return score;
}

// Returns a structured ABCD² breakdown including the speech-vs-weakness mutual-exclusion
// status, suitable for surfacing in a UI tooltip or expanded score detail.
export const calculateABCD2WithDetail = (items) => {
  const score = calculateABCD2Score(items);
  if (!items || typeof items !== 'object') return { score, components: {}, mutuallyExclusiveNote: null };
  const components = {
    age60: items.age60 ? 1 : 0,
    bp: items.bp ? 1 : 0,
    weakness: items.unilateralWeakness ? 2 : 0,
    speechWithoutWeakness: (items.speechDisturbance && !items.unilateralWeakness) ? 1 : 0,
    duration: items.duration === 'duration60' ? 2 : items.duration === 'duration10' ? 1 : 0,
    diabetes: items.diabetes ? 1 : 0
  };
  const mutuallyExclusiveNote = (items.speechDisturbance && items.unilateralWeakness)
    ? 'Note: per Johnston 2007, the clinical-features item scores either weakness (2 pts) OR speech disturbance (1 pt) — when both are present the score takes the weakness value only (no double-count).'
    : null;
  return { score, components, mutuallyExclusiveNote, source: 'Johnston Lancet 2007;369:283-92' };
};

// CHA₂DS₂-VASc — Lip 2010 Chest 137:263-72. Max score 9 (sex contributes +1 for female).
// This is the LEGACY score; ESC 2024 dropped sex and replaced this with CHA₂DS₂-VA.
// Both functions are exported so callers can choose; the UI labels each by name.
// `calculateCHADS2VA` (in calculators-extended.js) is the 2024 ESC update.
export const calculateCHADS2VascScore = (items) => {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.chf) score += 1;
  if (items.hypertension) score += 1;
  if (items.age75) score += 2;
  else if (items.age65) score += 1;
  if (items.diabetes) score += 1;
  if (items.strokeTia) score += 2;
  if (items.vascular) score += 1;
  if (items.female) score += 1;
  return score;
};

export const calculateROPEScore = (items) => {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.noHypertension) score += 1;
  if (items.noDiabetes) score += 1;
  if (items.noStrokeTia) score += 1;
  if (items.nonsmoker) score += 1;
  if (items.cortical) score += 1;
  const age = parseInt(items.age, 10) || 0;
  if (age >= 18 && age <= 29) score += 5;
  else if (age >= 30 && age <= 39) score += 4;
  else if (age >= 40 && age <= 49) score += 3;
  else if (age >= 50 && age <= 59) score += 2;
  else if (age >= 60 && age <= 69) score += 1;
  return score;
};

export const calculateHASBLEDScore = (items) => {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.hypertension) score += 1;
  if (items.renalDisease) score += 1;
  if (items.liverDisease) score += 1;
  if (items.stroke) score += 1;
  if (items.bleeding) score += 1;
  if (items.labileINR) score += 1;
  if (items.elderly) score += 1;
  if (items.drugs) score += 1;
  if (items.alcohol) score += 1;
  return score;
};

// RCVS² (Rocha Stroke 2019;50:1233-9). Range -2 to +10.
// Score ≥5: high specificity (~99%) for RCVS vs primary CNS angiitis / other vasculopathies.
// Score ≤2: high sensitivity for ruling RCVS out. Negative scores are valid output and
// preserved here (legacy clamp to 0 suppressed signal).
export const calculateRCVS2Score = (items) => {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.recurrentTCH) score += 5;
  if (items.carotidInvolvement) score -= 2;
  if (items.vasoconstrictiveTrigger) score += 3;
  if (items.female) score += 1;
  if (items.sah) score += 1;
  return score;
};

export const calculatePHASESScore = (items) => {
  if (!items || typeof items !== 'object') return 0;
  let score = 0;
  if (items.population === 'japanese') score += 3;
  else if (items.population === 'finnish') score += 5;
  if (items.hypertension) score += 1;
  if (items.age70) score += 1;
  const size = parseFloat(items.size) || 0;
  if (size >= 20) score += 10;
  else if (size >= 10) score += 6;
  else if (size >= 7) score += 3;
  if (items.earlierSAH) score += 1;
  if (items.site === 'mca') score += 2;
  else if (items.site === 'aca_pcomm_posterior') score += 4;
  return score;
};

// Per-score 5-year rupture risk per Greving Lancet Neurol 2014 Table 3.
// Bucketed risk-tier label kept for at-a-glance reading; numeric risk is per-score for accuracy.
const PHASES_RISK_PER_SCORE = {
  0: 0.4, 1: 0.4, 2: 0.4,
  3: 0.7,
  4: 0.9,
  5: 1.3,
  6: 1.7,
  7: 2.4,
  8: 3.2,
  9: 4.3,
  10: 5.3,
  11: 7.2
  // ≥12 → 17.8% (handled below)
};
export const getPHASESRisk = (score) => {
  const s = Math.max(0, Math.floor(Number(score) || 0));
  const numeric = s >= 12 ? 17.8 : PHASES_RISK_PER_SCORE[s] ?? 17.8;
  const level = s <= 2 ? 'Very low'
    : s <= 4 ? 'Low'
    : s <= 6 ? 'Low-Moderate'
    : s <= 8 ? 'Moderate'
    : s <= 10 ? 'Moderate-High'
    : 'High';
  return { risk: `${numeric}%`, level, fivYearPct: numeric };
};

// ABC/2 (Kothari Stroke 1996). Inputs MUST be in centimeters; if any dimension
// is suspiciously large (>15 cm) or computed volume exceeds 500 mL, surface a
// likely-unit-confusion warning so a mm-vs-cm typo doesn't silently 1000× the
// estimate. In the June 2026 algorithm, confirmed non-traumatic IPH >=15 mL
// is the early Neurosurgery + stroke-service evaluation trigger; >=30 mL
// remains the prognostic / MIE-screen volume tier when other criteria fit.
export const calculateICHVolume = (items) => {
  if (!items || typeof items !== 'object') return null;
  const a = parseFloat(items.lengthCm) || 0;
  const b = parseFloat(items.widthCm) || 0;
  const c = parseFloat(items.slicesCm) || 0;
  if (a <= 0 || b <= 0 || c <= 0) return null;
  const volume = (a * b * c) / 2;
  const oversizedDim = a > 15 || b > 15 || c > 15;
  const oversizedVol = volume > 500;
  const unitWarning = (oversizedDim || oversizedVol)
    ? '⚠ Inputs look unusually large — confirm dimensions are in CENTIMETERS (not mm). Common typo: entering 50 (mm) instead of 5 (cm) inflates the estimate ~1000×.'
    : null;
  return {
    volume: Math.round(volume * 10) / 10,
    isDualConsult: volume >= 15,
    meetsNonTraumaticIphDualConsultVolume: volume >= 15,
    isLarge: volume >= 30,
    isExpanding: false,
    unitWarning
  };
};

const JUNE_2026_MIE_LOBAR_PATTERN = /\b(lobar|frontal|temporal|parietal|occipital|cortical)\b/;
const JUNE_2026_MIE_DEEP_LOCATION_PATTERN = /\b(subcortical|deep|basal[-\s]?ganglia|thalamic|thalamus|brainstem|pons|midbrain|cerebellar|cerebellum|caudate|putamen|globus\s+pallidus|internal\s+capsule)\b/;

export const isJune2026MieLobarLocationText = (text = '') => {
  const normalized = String(text || '').toLowerCase();
  return JUNE_2026_MIE_LOBAR_PATTERN.test(normalized)
    && !JUNE_2026_MIE_DEEP_LOCATION_PATTERN.test(normalized);
};

export const calculateEnoxaparinDose = (weightKg, crCl) => {
  const weight = parseFloat(weightKg) || 0;
  const parsedCrCl = parseFloat(crCl);
  const renalClearance = (!isNaN(parsedCrCl) && parsedCrCl > 0) ? parsedCrCl : null;
  if (weight <= 0 || weight > 350) return null;
  const crClUnknown = renalClearance === null;
  const isRenalAdjusted = renalClearance !== null && renalClearance < 30;
  const treatmentDose = Math.round(weight * 1);
  const prophylaxisDose = isRenalAdjusted ? 30 : 40;
  const prophylaxisFreq = weight > 100 && !isRenalAdjusted ? 'q12h' : 'daily';
  const crClWarning = crClUnknown ? ' ⚠ CrCl unknown — verify renal function before dosing' : '';
  const obesityWarning = treatmentDose > 150 ? ' ⚠ Treatment dose >150 mg — consider anti-Xa monitoring (target 0.5-1.0 IU/mL at 4h post-dose) for morbid obesity' : '';
  const dailyTreatmentDose = Math.round(weight * 1.5);
  const dailyTreatmentNote = isRenalAdjusted
    ? `Daily treatment: ${treatmentDose} mg SC daily (CrCl <30 — use 1 mg/kg daily)`
    : `Daily treatment (alternative): ${dailyTreatmentDose} mg SC daily`;
  const dailyTreatmentWarning = dailyTreatmentDose > 180 ? ' ⚠ Daily dose >180 mg — consider BID dosing with anti-Xa monitoring' : '';
  return {
    dose: treatmentDose,
    dailyDose: dailyTreatmentDose,
    frequency: isRenalAdjusted ? 'daily' : 'BID',
    isRenalAdjusted,
    crClUnknown,
    note: (isRenalAdjusted ? `Treatment: ${treatmentDose} mg SC daily (CrCl <30)` : `Treatment: ${treatmentDose} mg SC BID`) + crClWarning + obesityWarning,
    dailyTreatmentNote: dailyTreatmentNote + dailyTreatmentWarning + crClWarning,
    prophylaxisNote: `VTE Prophylaxis: ${prophylaxisDose} mg SC ${prophylaxisFreq}${isRenalAdjusted ? ' (renal-adjusted)' : ''}${weight > 100 && !isRenalAdjusted ? ' (weight >100 kg)' : ''}` + crClWarning
  };
};

// Andexanet is not available through the institution, so Protocols must not emit
// a low- or high-dose regimen from these inputs. Keep the export and legacy result
// keys stable for API consumers while returning a non-actionable result. The local
// factor-Xa pathway is screen-gated and uses a fixed PCC dose; it is not weight-based.
export const calculateAndexanetDose = (doacType, lastDoseHours, doacDoseMg, thrombosisRisk = 'moderate') => {
  const unavailableNotice = 'Andexanet alfa is not available through the institution; no andexanet dose is provided.';
  const institutionalPathway = 'For rivaroxaban, apixaban, or edoxaban-associated ICH, obtain a Direct Xa Inhibitor screen. If the screen is elevated and there is no PCC contraindication, the institutional pathway uses 4F-PCC 2000 units IV.';

  return {
    regimen: 'unavailable',
    bolus: '',
    infusion: '',
    total: '',
    doseWarning: unavailableNotice,
    annexaINote: unavailableNotice,
    pccAlternative: institutionalPathway,
    unavailable: true,
    actionable: false,
    requiresElevatedDirectXaScreen: true,
    inputsRetainedForDocumentation: {
      doacType: doacType || '',
      lastDoseHours: lastDoseHours ?? '',
      doacDoseMg: doacDoseMg ?? '',
      thrombosisRisk
    }
  };
};

export const calculateCrCl = (age, weight, sex, creatinine, heightCm) => {
  const a = parseFloat(age);
  const w = parseFloat(weight);
  const cr = parseFloat(creatinine);
  if (!a || !w || !cr || a <= 0 || w <= 0 || cr < 0.1) return null;
  if (a > 120) return null;
  if (sex !== 'M' && sex !== 'F') return null;
  const sexFactor = (sex === 'F') ? 0.85 : 1.0;
  const crcl = ((140 - a) * w * sexFactor) / (72 * cr);
  const h = parseFloat(heightCm);
  const bmi = (h && h > 0) ? w / ((h / 100) ** 2) : null;
  const isObese = bmi && bmi > 30;
  let adjBwCrCl = null;
  if (isObese && h > 0) {
    const heightIn = h / 2.54;
    const ibw = Math.max(30, sex === 'M' ? 50 + 2.3 * (heightIn - 60) : 45.5 + 2.3 * (heightIn - 60));
    const adjBw = ibw + 0.4 * (w - ibw);
    adjBwCrCl = Math.round(((140 - a) * adjBw * sexFactor) / (72 * cr) * 10) / 10;
  }
  return {
    value: Math.round(crcl * 10) / 10,
    adjBwValue: adjBwCrCl,
    isLow: crcl < 30,
    isBorderline: crcl >= 30 && crcl < 50,
    isObese,
    bmi: bmi ? Math.round(bmi * 10) / 10 : null,
    renalCategory: crcl < 15 ? 'severe-dialysis' : crcl < 30 ? 'severe' : crcl < 50 ? 'moderate' : crcl < 90 ? 'mild' : 'normal',
    label: crcl < 15 ? 'Severe (consider dialysis)' : crcl < 30 ? 'Severe (<30)' : crcl < 50 ? 'Moderate (30-49)' : crcl < 90 ? 'Mild (50-89)' : 'Normal (≥90)',
    obesityWarning: isObese ? `BMI >30 — CrCl may be overestimated. Adjusted body weight CrCl: ${adjBwCrCl} mL/min. Use AdjBW CrCl for DOAC dosing decisions.` : null
  };
};

export const calculateTNKDose = (weightKg) => {
  const weight = parseFloat(weightKg);
  if (isNaN(weight) || weight <= 0 || weight > 350) return null;
  const rawDose = weight * 0.25;
  const finalDose = Math.min(Math.round(rawDose * 2) / 2, 25);
  const doseTable = [
    { minWeight: 0, maxWeight: 59.9, dose: 'Variable (0.25 mg/kg)', vial: 'Calculate' },
    { minWeight: 60, maxWeight: 69.9, dose: '15-17.5 mg', vial: '3-3.5 mL' },
    { minWeight: 70, maxWeight: 79.9, dose: '17.5-20 mg', vial: '3.5-4 mL' },
    { minWeight: 80, maxWeight: 89.9, dose: '20-22.5 mg', vial: '4-4.5 mL' },
    { minWeight: 90, maxWeight: 99.9, dose: '22.5-25 mg', vial: '4.5-5 mL' },
    { minWeight: 100, maxWeight: Infinity, dose: '25 mg (MAX)', vial: '5 mL' }
  ];
  return {
    weightKg: weight,
    calculatedDose: finalDose.toFixed(1),
    volume: `${(finalDose / 5).toFixed(1)} mL`,
    isMaxDose: rawDose >= 25,
    doseTable
  };
};

// Institutional 4F-PCC pathways use a fixed 2000-unit dose. `weightKg` remains in
// the signature and returned object for compatibility, but never changes the dose.
// For factor-Xa inhibitors, this result is conditional on an elevated Direct Xa
// Inhibitor screen and absence of PCC contraindications. This helper intentionally
// makes no statement about factor-Xa dialysis because accepted sources conflict.
export const calculatePCCDose = (weightKg, inrVal, indication = 'warfarin', gate = {}) => {
  const parsedWeight = parseFloat(weightKg);
  const weight = Number.isFinite(parsedWeight) && parsedWeight > 0 && parsedWeight <= 350
    ? parsedWeight
    : null;
  const inr = parseFloat(inrVal);
  const fixedDose = 2000;

  // Factor-Xa inhibitor ICH pathway — fixed dose, contingent on an elevated screen.
  if (indication === 'fxa-ich' || indication === 'fxa-no-andexanet') {
    const gateComplete = gate.directXaElevated === true && gate.pccContraindicated === false;
    return {
      ahaDose: gateComplete ? fixedDose : null,
      iuPerKg: null,
      weight,
      inrTierNote: 'If the Direct Xa Inhibitor screen is elevated and there is no PCC contraindication, give 4F-PCC 2000 units IV. Andexanet alfa is not available through the institution.',
      indication,
      fixedDose: true,
      recommendation: gateComplete ? 'give-fixed-dose' : 'pending-required-gates',
      requiresElevatedDirectXaScreen: true,
      requiresPccContraindicationReview: true,
      missing: [
        ...(gate.directXaElevated === true ? [] : ['elevated Direct Xa Inhibitor screen']),
        ...(gate.pccContraindicated === false ? [] : ['explicit confirmation that PCC is not contraindicated'])
      ],
      andexanetAvailable: false
    };
  }

  // Dabigatran fallback is supported only when idarucizumab is unavailable.
  if (indication === 'dabigatran-fallback') {
    const gateComplete = gate.idarucizumabAvailable === false && gate.pccContraindicated === false;
    return {
      ahaDose: gateComplete ? fixedDose : null,
      iuPerKg: null,
      weight,
      inrTierNote: 'If idarucizumab is unavailable, give 4F-PCC 2000 units IV.',
      indication,
      fixedDose: true,
      recommendation: gateComplete ? 'give-fixed-dose-fallback' : 'pending-required-gates',
      missing: [
        ...(gate.idarucizumabAvailable === false ? [] : ['confirmation that idarucizumab is unavailable']),
        ...(gate.pccContraindicated === false ? [] : ['explicit confirmation that PCC is not contraindicated'])
      ]
    };
  }

  // Warfarin pathway — INR determines recommendation strength, never the dose.
  let ahaDose = null;
  let inrTierNote = 'Enter or verify INR before applying the institutional warfarin PCC tier.';
  let recommendation = 'needs-inr';
  if (!Number.isNaN(inr)) {
    if (inr < 1.3) {
      inrTierNote = 'INR <1.3 — no institutional PCC recommendation is printed for this tier; give vitamin K 10 mg IV.';
      recommendation = 'no-institutional-pcc-recommendation';
    } else if (inr < 1.6) {
      ahaDose = fixedDose;
      inrTierNote = 'INR 1.3-1.5 — consider 4F-PCC case-by-case (COR 2b/C). If selected, give 2000 units IV immediately.';
      recommendation = 'consider-case-by-case';
    } else if (inr < 2) {
      ahaDose = fixedDose;
      inrTierNote = 'INR 1.6-1.9 — 4F-PCC recommended (COR 2b/C); give 2000 units IV immediately.';
      recommendation = 'recommended';
    } else {
      ahaDose = fixedDose;
      inrTierNote = 'INR ≥2.0 — 4F-PCC recommended (COR 1/B); give 2000 units IV immediately.';
      recommendation = 'recommended';
    }
  }

  return {
    ahaDose,
    iuPerKg: null,
    weight,
    inrTierNote,
    indication: 'warfarin',
    fixedDose: true,
    recommendation,
    vitaminK: 'Give vitamin K 10 mg IV immediately.',
    monitoring: 'Repeat PT/INR at 30 minutes and every 6 hours for 24 hours after PCC infusion.',
    rescue: 'If PT/INR is >1.5 after infusion, page hematology and consider 500 additional units of PCC or 2-4 units of plasma (FFP).'
  };
};

export const calculateAlteplaseDose = (weightKg) => {
  const weight = parseFloat(weightKg);
  if (isNaN(weight) || weight <= 0 || weight > 350) return null;
  const totalDose = Math.min(+(weight * 0.9).toFixed(1), 90);
  const bolus = +(totalDose * 0.1).toFixed(1);
  const infusion = +(totalDose * 0.9).toFixed(1);
  return { totalDose, bolus, infusion, weightKg: weight, capped: weight * 0.9 > 90 };
};

// CHOICE-2 Trial (Ren et al., JAMA 2026): Adjunctive IA alteplase for eTICI 2b50-3
// 0.225 mg/kg (max 22.5 mg) infused over 15-30 minutes post-thrombectomy.
export const calculateAdjunctiveIAAlteplase = (weightKg, eTICI) => {
  const weight = parseFloat(weightKg);
  if (isNaN(weight) || weight <= 0 || weight > 350) return null;
  
  // Eligible if eTICI is 2b50, 2b67, 2c, or 3
  const isEligibleTICI = ['2b50', '2b67', '2c', '3'].includes(String(eTICI).toLowerCase());
  
  const rawDose = weight * 0.225;
  const finalDose = Math.min(+(rawDose).toFixed(2), 22.5);
  
  return {
    weightKg: weight,
    eTICI: eTICI,
    isEligible: isEligibleTICI,
    dose: finalDose,
    maxDoseReached: rawDose >= 22.5,
    note: isEligibleTICI
      ? `CHOICE-2 (JAMA 2026): Adjunctive IA alteplase 0.225 mg/kg (max 22.5 mg) over 15-30 min.`
      : `CHOICE-2 criteria generally require successful reperfusion (eTICI 2b50-3) before adjunctive IA alteplase.`
  };
};
