// Pure clinical calculator functions extracted from app.jsx.
// Keeping these as a separate module makes them unit-testable and
// lets the bundler tree-shake unused helpers.

// DOAC initiation timing protocols for AF-related ischemic stroke.
// 'elan-optimas' (default): supported by ELAN (Fischer NEJM 2023;388:2411-21, PMID 37231621) and
//   OPTIMAS (Werring Lancet 2024, PMID 39426394) and CATALYST meta-analysis (Werring Lancet 2024).
//   Early start ≤4 d for minor/moderate; days 6-7 for major. Symptomatic ICH 0.2% in both arms.
// 'catalyst': earlier UW/expert-consensus mapping (NIHSS-stratified) — kept for compatibility.
// '1-3-6-12': legacy rule — preserved for institutions still using this default.
// AHA/ASA 2024 focused update endorses early DOAC initiation (≤4 days) for minor/moderate AF strokes.
export const DOAC_PROTOCOLS = {
  'elan-optimas': {
    label: 'ELAN/OPTIMAS — early start (default)',
    days: { minor: 1, moderate: 3, severe: 6, verySevere: 7 },
    source: 'Fischer NEJM 2023 (ELAN, PMID 37231621); Werring Lancet 2024 (OPTIMAS, PMID 39426394); CATALYST meta-analysis 2024'
  },
  catalyst: {
    label: 'CATALYST consensus',
    days: { minor: 1, moderate: 3, severe: 6 },
    source: 'CATALYST consensus protocol (legacy default)'
  },
  '1-3-6-12': {
    label: '1-3-6-12 rule',
    days: { minor: 1, moderate: 3, severe: 6, verySevere: 12 },
    source: 'Heidbuchel 2017 EHRA practical guide'
  }
};

export const calculateDOACStart = (nihss, onsetDate, protocol = 'elan-optimas') => {
  const nihssVal = parseFloat(nihss);
  if (!onsetDate) return null;
  const onset = new Date(onsetDate);
  if (Number.isNaN(onset.getTime())) return null;
  const rule = DOAC_PROTOCOLS[protocol] || DOAC_PROTOCOLS['elan-optimas'] || DOAC_PROTOCOLS.catalyst;
  const severity = Number.isNaN(nihssVal)
    ? 'moderate'
    : nihssVal < 8
      ? 'minor'
      : nihssVal <= 15
        ? 'moderate'
        : nihssVal >= 21 && rule.days.verySevere
          ? 'verySevere'
          : 'severe';
  const days = rule.days[severity] ?? rule.days.severe ?? rule.days.moderate;
  const startDate = new Date(onset);
  startDate.setDate(startDate.getDate() + days);
  return { severity, days, startDate, protocol, source: rule.source };
};

export const calculateNIHSS = (responses) => {
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
  return regions.reduce((total, region) => {
    return total + (region.checked ? region.points : 0);
  }, 0);
};

export const calculateGCS = (items) => {
  const rawEye = parseInt(items.eye || 0, 10) || 0;
  const rawVerbal = parseInt(items.verbal || 0, 10) || 0;
  const rawMotor = parseInt(items.motor || 0, 10) || 0;
  if (rawEye === 0 && rawVerbal === 0 && rawMotor === 0) return 0;
  if ((rawEye === 0 || rawVerbal === 0 || rawMotor === 0) && (rawEye !== 0 || rawVerbal !== 0 || rawMotor !== 0)) return null;
  const eye = Math.min(4, Math.max(1, rawEye));
  const verbal = Math.min(5, Math.max(1, rawVerbal));
  const motor = Math.min(6, Math.max(1, rawMotor));
  return eye + verbal + motor;
};

export const calculateICHScore = (items) => {
  let score = 0;
  if (items.gcs === 'gcs34') score += 2;
  else if (items.gcs === 'gcs512') score += 1;
  if (items.age80) score += 1;
  if (items.volume30) score += 1;
  if (items.ivh) score += 1;
  if (items.infratentorial) score += 1;
  return score;
};

export function calculateABCD2Score(items) {
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

export const calculateCHADS2VascScore = (items) => {
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

export const calculateRCVS2Score = (items) => {
  let score = 0;
  if (items.recurrentTCH) score += 5;
  if (items.carotidInvolvement) score -= 2;
  if (items.vasoconstrictiveTrigger) score += 3;
  if (items.female) score += 1;
  if (items.sah) score += 1;
  return Math.max(0, score);
};

export const calculatePHASESScore = (items) => {
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

export const getPHASESRisk = (score) => {
  if (score <= 2) return { risk: '0.4%', level: 'Very low' };
  if (score <= 4) return { risk: '0.7%', level: 'Low' };
  if (score <= 6) return { risk: '1.5%', level: 'Low-Moderate' };
  if (score <= 8) return { risk: '2.4%', level: 'Moderate' };
  if (score <= 10) return { risk: '3.6%', level: 'Moderate-High' };
  return { risk: '17.8%', level: 'High' };
};

export const calculateICHVolume = (items) => {
  const a = parseFloat(items.lengthCm) || 0;
  const b = parseFloat(items.widthCm) || 0;
  const c = parseFloat(items.slicesCm) || 0;
  if (a <= 0 || b <= 0 || c <= 0) return null;
  const volume = (a * b * c) / 2;
  return { volume: Math.round(volume * 10) / 10, isLarge: volume >= 30, isExpanding: false };
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

// FXa inhibitor ICH reversal — andexanet alfa per FDA label + ANNEXA-I context.
// ANNEXA-I (Connolly NEJM 2024;390:1745-55, PMID 38749032) showed superior hemostatic efficacy
// vs usual care (≈80% 4F-PCC) BUT with a thrombotic-event signal: 10.3% vs 5.6% (absolute +4.7%);
// ischemic stroke specifically 6.5% vs 1.5%. Mortality numerically higher (NS).
// Many institutions retain 4F-PCC 50 U/kg (fixed) as alternative when andexanet is unavailable,
// contraindicated, or the patient is at elevated thrombotic risk. Always re-verify your hospital
// pathway and ensure 4F-PCC is stocked as backup.
//
// Inputs:
//   doacType         — string ('apixaban', 'rivaroxaban', 'edoxaban', 'betrixaban')
//   lastDoseHours    — hours since last DOAC dose
//   doacDoseMg       — dose strength of last DOAC tablet (mg)
//   thrombosisRisk   — 'high' | 'moderate' | 'low' (default 'moderate'); affects warning verbosity.
export const calculateAndexanetDose = (doacType, lastDoseHours, doacDoseMg, thrombosisRisk = 'moderate') => {
  const hours = Math.max(0, parseFloat(lastDoseHours) || 0);
  const doseMg = Math.max(0, parseFloat(doacDoseMg) || 0);
  const t = (doacType || '').toLowerCase();
  const isApixaban = t.includes('apixaban');
  const isRivaroxaban = t.includes('rivaroxaban');
  const isEdoxaban = t.includes('edoxaban');

  const ANNEXA_I_NOTE = 'ANNEXA-I (NEJM 2024, PMID 38749032): andexanet improved hemostatic efficacy (67% vs 53%) but signaled excess thrombotic events (10.3% vs 5.6%, ischemic stroke 6.5% vs 1.5%). Confirm institutional pathway.';
  const PCC_ALT = '4F-PCC alternative when andexanet unavailable / contraindicated / high thrombosis risk: 50 U/kg fixed-dose IV (Class 2b, AHA/ASA 2022 ICH; many centers prefer this since ANNEXA-I).';
  const buildResult = (base, contextWarn) => {
    const thrombosisWarn = thrombosisRisk === 'high'
      ? '⚠️ HIGH thrombotic risk (recent VTE/MI/stroke <14d, mechanical valve, active cancer, severe atherosclerosis): strongly consider 4F-PCC 50 U/kg INSTEAD of andexanet given ANNEXA-I excess ischemic stroke (6.5% vs 1.5%).'
      : thrombosisRisk === 'low'
        ? null
        : '⚠️ ANNEXA-I thrombotic signal: monitor for VTE/MI/ischemic stroke; restart anticoagulation (when safe) per ICH/AF restart pathway.';
    const merged = [contextWarn, thrombosisWarn].filter(Boolean).join(' | ');
    return { ...base, doseWarning: merged || null, annexaINote: ANNEXA_I_NOTE, pccAlternative: PCC_ALT };
  };

  const lowDose = { regimen: 'low-dose', bolus: '400 mg IV over 15-30 min', infusion: '4 mg/min x 120 min (480 mg)', total: '880 mg' };
  const highDose = { regimen: 'high-dose', bolus: '800 mg IV over 15-30 min', infusion: '8 mg/min x 120 min (960 mg)', total: '1760 mg' };

  if (isApixaban) {
    if (hours >= 8) return buildResult(lowDose, 'Last dose ≥8h ago — low-dose regimen per FDA label.');
    if (doseMg > 0 && doseMg <= 5) return buildResult(lowDose, 'Apixaban dose ≤5 mg (per FDA label) — low-dose.');
    if (doseMg > 5) return buildResult(highDose, 'Apixaban >5 mg and last dose <8h — high-dose.');
    return buildResult(lowDose, 'DOAC dose not entered. Standard apixaban (5 mg BID) → low-dose. If patient was on 10 mg BID and last dose <8h, use high-dose. Enter DOAC dose to confirm.');
  }
  if (isRivaroxaban) {
    if (hours >= 8) return buildResult(lowDose, 'Last dose ≥8h ago — low-dose regimen per FDA label.');
    if (doseMg > 0 && doseMg <= 10) return buildResult(lowDose, 'Rivaroxaban ≤10 mg (per FDA label) — low-dose.');
    if (doseMg > 10) return buildResult(highDose, 'Rivaroxaban >10 mg and last dose <8h — high-dose.');
    return buildResult(highDose, 'DOAC dose not entered. Common rivaroxaban dose (20 mg daily) → high-dose. If patient was on ≤10 mg, use low-dose. Enter DOAC dose to confirm.');
  }
  if (isEdoxaban) {
    return buildResult(highDose, 'Edoxaban: andexanet not FDA-approved for edoxaban reversal. 4F-PCC 50 U/kg is the preferred reversal agent (off-label for andexanet).');
  }
  return { regimen: 'N/A', bolus: 'Not applicable for this DOAC', infusion: '', total: '', doseWarning: 'andexanet alfa is FDA-approved for apixaban and rivaroxaban only. For dabigatran, use idarucizumab (Praxbind 5 g IV). For edoxaban or other Xa-inhibitors, use 4F-PCC 50 U/kg.', annexaINote: ANNEXA_I_NOTE, pccAlternative: PCC_ALT };
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

// 4F-PCC dosing — supports both warfarin reversal (INR-stratified per AHA/ASA 2022 ICH)
// and FXa-inhibitor ICH reversal (fixed 50 U/kg per ANNEXA-I-era practice).
// Inputs:
//   weightKg — patient weight in kg
//   inrVal   — INR (optional; only used for warfarin pathway)
//   indication — 'warfarin' (default) | 'fxa-ich' | 'fxa-no-andexanet' — selects pathway
// Reference doses:
//   - Warfarin: AHA/ASA 2022 ICH (Greenberg, Stroke 2022) — INR-stratified.
//   - FXa-ICH: many centers use 50 U/kg fixed when andexanet unavailable / contraindicated;
//     AHA/ASA 2022 ICH lists PCC as Class 2b for FXa reversal. Post-ANNEXA-I, PCC remains
//     widely used given thrombosis signal and cost. ESO 2024 acknowledges PCC alternative.
export const calculatePCCDose = (weightKg, inrVal, indication = 'warfarin') => {
  const weight = parseFloat(weightKg);
  const inr = parseFloat(inrVal);
  if (isNaN(weight) || weight <= 0 || weight > 350) return null;

  // FXa-inhibitor ICH pathway — fixed 50 U/kg
  if (indication === 'fxa-ich' || indication === 'fxa-no-andexanet') {
    const fxaDose = Math.min(Math.round(weight * 50), 5000);
    return {
      ahaDose: fxaDose,
      iuPerKg: 50,
      weight,
      inrTierNote: indication === 'fxa-no-andexanet'
        ? '4F-PCC 50 IU/kg fixed (max 5000) — FXa-inhibitor ICH when andexanet unavailable / contraindicated / high thrombosis risk. Class 2b AHA/ASA 2022 ICH; widely used post-ANNEXA-I (NEJM 2024, PMID 38749032).'
        : '4F-PCC 50 IU/kg fixed (max 5000) for FXa-inhibitor ICH (apixaban/rivaroxaban/edoxaban). Pair with hemostasis monitoring; restart AC per AF/ICH restart pathway.',
      indication
    };
  }

  // Warfarin pathway — INR-stratified
  let iuPerKg = null;
  let inrTierNote = '';
  if (!isNaN(inr)) {
    if (inr < 1.3) { iuPerKg = null; inrTierNote = 'INR <1.3 — PCC likely not needed; give Vitamin K 10 mg IV'; }
    else if (inr < 2) { iuPerKg = 25; inrTierNote = 'INR 1.3-1.9 — consider 4F-PCC 25 IU/kg (COR 2b/C)'; }
    else if (inr < 4) { iuPerKg = 25; inrTierNote = 'INR 2.0-3.9 — 4F-PCC 25 IU/kg (COR 1/B)'; }
    else if (inr <= 6) { iuPerKg = 35; inrTierNote = 'INR 4.0-6.0 — 4F-PCC 35 IU/kg (COR 1/B)'; }
    else { iuPerKg = 50; inrTierNote = 'INR >6 — 4F-PCC 50 IU/kg (COR 1/B)'; }
  }
  const ahaDose = iuPerKg ? Math.min(Math.round(weight * iuPerKg), 5000) : null;
  return { ahaDose, iuPerKg, weight, inrTierNote, indication: 'warfarin' };
};

export const calculateAlteplaseDose = (weightKg) => {
  const weight = parseFloat(weightKg);
  if (isNaN(weight) || weight <= 0 || weight > 350) return null;
  const totalDose = Math.min(+(weight * 0.9).toFixed(1), 90);
  const bolus = +(totalDose * 0.1).toFixed(1);
  const infusion = +(totalDose * 0.9).toFixed(1);
  return { totalDose, bolus, infusion, weightKg: weight, capped: weight * 0.9 > 90 };
};
