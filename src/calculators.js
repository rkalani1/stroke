// Maintained Encounter arithmetic/source screens only. Full historical helpers are at the archival Git ref.
// Reviewed helpers accept complete finite numbers, never partial strings or booleans.
import { reviewedNumber } from './reviewed-number.js';



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

export const calculateGCS = (items) => {
  if (!items || typeof items !== 'object' || Array.isArray(items)) return null;
  const values = ['eye', 'verbal', 'motor'].map(key => reviewedNumber(items[key]));
  if (values.some((value, index) => !Number.isInteger(value) || value < 1 || value > [4, 5, 6][index])) return null;
  return values.reduce((total, value) => total + value, 0);
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
    obesityWarning: isObese ? `BMI >30 — CrCl may be overestimated. Adjusted body weight CrCl: ${adjBwCrCl} mL/min. DOAC renal dosing (e.g., rivaroxaban FDA labeling) uses Cockcroft-Gault CrCl with actual body weight; do not use AdjBW CrCl alone to reduce DOAC doses (confirm with pharmacy).` : null
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

// Display values are rounded to 0.1 mg; the infusion is derived from the rounded
// total and bolus so bolus + infusion always equals the displayed total.
export const calculateAlteplaseDoseReviewed = (weightKg) => {
  const weight = reviewedNumber(weightKg);
  if (weight === null || weight <= 0 || weight > 350) return null;
  const totalTenths = Math.round(Math.min(Number((weight * 0.9).toPrecision(12)), 90) * 10);
  const bolusTenths = Math.round(totalTenths * 0.1);
  const totalDose = totalTenths / 10;
  const bolus = bolusTenths / 10;
  const infusion = (totalTenths - bolusTenths) / 10;
  return { totalDose, bolus, infusion, weightKg: weight, capped: weight * 0.9 > 90,
    roundingNote: 'Values rounded to 0.1 mg; the remaining infusion is the rounded total minus the rounded bolus, so bolus plus infusion equals the total dose. Independently verify preparation and administration.',
    sourceUrl: 'https://www.gene.com/download/pdf/activase_prescribing.pdf' };
};

export const calculateCrClReviewed = (age, weight, sex, creatinine, heightCm) => {
  const [a, w, cr] = [age, weight, creatinine].map(reviewedNumber);
  const heightProvided = heightCm !== undefined && heightCm !== null && heightCm !== '';
  const h = heightProvided ? reviewedNumber(heightCm) : null;
  if ([a, w, cr].some(x => x === null) || a < 18 || a > 120 || w <= 0 || w > 350 || cr < 0.1 || !['M', 'F'].includes(sex)) return null;
  if (heightProvided && (h === null || h <= 0 || h > 300)) return null;
  const result = calculateCrCl(a, w, sex, cr, h);
  if (!result || !Number.isFinite(result.value) || (result.adjBwValue !== null && !Number.isFinite(result.adjBwValue))) return null;
  const rawValue = ((140 - a) * w * (sex === 'F' ? 0.85 : 1)) / (72 * cr);
  // The legacy category uses the unrounded estimate. Do not let display
  // rounding near 15 preserve its unsupported dialysis inference.
  const below15 = result.renalCategory === 'severe-dialysis';
  let rawAdjBwValue = null;
  if (result.isObese) {
    const ibw = Math.max(30, (sex === 'M' ? 50 : 45.5) + 2.3 * (h / 2.54 - 60));
    rawAdjBwValue = ((140 - a) * (ibw + 0.4 * (w - ibw)) * (sex === 'F' ? 0.85 : 1)) / (72 * cr);
  }
  return { ...result, rawValue, rawAdjBwValue, label: below15 ? 'Severe (<15 before rounding); specialist assessment required' : result.label,
    renalCategory: below15 ? 'severe' : result.renalCategory,
    scopeNote: 'Adult Cockcroft–Gault estimate. Confirm stable creatinine, appropriate weight convention, and the specific drug label; this estimate does not determine a dialysis indication.' };
};

export const calculateICHVolumeReviewed = (items) => {
  if (!items || typeof items !== 'object') return null;
  const dimensions = [items.lengthCm, items.widthCm, items.slicesCm].map(reviewedNumber);
  if (dimensions.some(x => x === null || x <= 0)) return null;
  const volume = dimensions.reduce((a, b) => a * b, 1) / 2;
  if (!Number.isFinite(volume)) return null;
  const result = calculateICHVolume({ lengthCm: dimensions[0], widthCm: dimensions[1], slicesCm: dimensions[2] });
  if (!result || !Number.isFinite(result.volume)) return null;
  // The displayed value never rounds up across a threshold the app applies (2, 15, 20, 30, 60 mL),
  // so the shown volume always agrees with the unrounded threshold flags.
  const crosses = [2, 15, 20, 30, 60].some(t => result.volume >= t && volume < t);
  return { ...result, rawVolume: volume, volume: crosses ? Math.floor(volume * 10) / 10 : result.volume, unitWarning: dimensions.some(x => x > 15) || volume > 500
    ? 'Confirm all three dimensions are in centimeters. Entering millimeters for one dimension inflates ABC/2 tenfold; doing so for all three inflates it 1000-fold.' : null };
};

export const calculateTNKDoseReviewed = (weightKg, authority = 'guideline') => {
  const weight = reviewedNumber(weightKg);
  if (weight === null || weight <= 0 || weight > 350 || !['guideline', 'fda-label'].includes(authority)) return null;
  const labeledBands = [
    { minWeight: 0, maxWeight: 60, dose: 15, vial: '3 mL' },
    { minWeight: 60, maxWeight: 70, dose: 17.5, vial: '3.5 mL' },
    { minWeight: 70, maxWeight: 80, dose: 20, vial: '4 mL' },
    { minWeight: 80, maxWeight: 90, dose: 22.5, vial: '4.5 mL' },
    { minWeight: 90, maxWeight: null, dose: 25, vial: '5 mL' }
  ];
  const round2 = value => Math.round(Number(value.toPrecision(12)) * 100) / 100;
  const dose = authority === 'fda-label'
    ? labeledBands.find(band => weight >= band.minWeight && (band.maxWeight === null || weight < band.maxWeight)).dose
    : round2(Math.min(weight * 0.25, 25));
  // Label bands deliver a fixed dose per band; report the delivered mg/kg so a
  // low-weight patient receiving more than 0.30 mg/kg is visible at the bedside.
  const deliveredMgPerKg = Math.round((dose / weight) * 1000) / 1000;
  const labelNote = authority === 'fda-label'
    ? ` Label band delivers ${deliveredMgPerKg.toFixed(3)} mg/kg (guideline arithmetic 0.25 mg/kg).${deliveredMgPerKg > 0.3 ? ' WARNING: above 0.30 mg/kg; confirm the weight and consider guideline weight-based dosing.' : ''} US TNKase AIS labeling covers treatment within 3 hours of symptom onset; guideline use extends to 4.5 hours.`
    : '';
  return {
    weightKg: weight, calculatedDose: String(dose), volume: `${round2(dose / 5)} mL`, isMaxDose: authority === 'fda-label' ? dose === 25 : weight * 0.25 >= 25, deliveredMgPerKg,
    authority, authorityLabel: authority === 'fda-label' ? 'US TNKase AIS prescribing information: weight bands' : 'AHA/ASA 2026 AIS guideline: 0.25 mg/kg, maximum 25 mg',
    sourceUrl: authority === 'fda-label' ? 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e647640d-c395-4b4b-a0be-1162f9c21d84' : 'https://doi.org/10.1161/STR.0000000000000513',
    roundingNote: `Dose and volume rounded to 0.01 mg / 0.01 mL; no additional syringe rounding is applied. Volume assumes the labeled 5 mg/mL reconstituted concentration. This dose reference does not establish IVT eligibility or the treatment time window.${labelNote}`,
    doseTable: authority === 'fda-label' ? labeledBands : [{ minWeight: 0, maxWeight: null, dose: '0.25 mg/kg, maximum 25 mg', vial: 'Dose ÷ 5 mg/mL' }]
  };
};
