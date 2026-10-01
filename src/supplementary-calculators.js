import { numericInput, reviewedGcs, reviewedPhq2, reviewedStopBang } from './encounter-clinical-review.js';

const ageValue = value => numericInput(value, { min: 18, max: 120, integer: true });
const inputObject = input => input && typeof input === 'object' && !Array.isArray(input) ? input : {};
const complete = (input, keys) => input.reviewed === true && keys.every(key => typeof input[key] === 'boolean');
const sum = (input, keys) => keys.reduce((total, key) => total + Number(input[key]), 0);
const result = (score, max) => ({ score, max });

export function reviewedBloodPressure(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split('/');
  if (parts.length !== 2) return null;
  const systolic = numericInput(parts[0], { min: 1, max: 400 });
  const diastolic = numericInput(parts[1], { min: 1, max: 300 });
  return systolic !== null && diastolic !== null && systolic > diastolic ? { systolic, diastolic } : null;
}

export function calculateReviewedABCD2(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), bp = reviewedBloodPressure(input.bp);
  if (age === null || !bp || !complete(input, ['diabetes']) || input.tiaConfirmed !== true ||
    !['weakness', 'speech', 'other'].includes(input.clinicalFeatures) || !['under10', '10to59', '60plus'].includes(input.duration)) return null;
  return result(Number(age >= 60) + Number(bp.systolic >= 140 || bp.diastolic >= 90) +
    ({ weakness: 2, speech: 1, other: 0 })[input.clinicalFeatures] + ({ under10: 0, '10to59': 1, '60plus': 2 })[input.duration] + Number(input.diabetes), 7);
}

export function calculateReviewedCHADS2VASc(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), keys = ['chf', 'hypertension', 'diabetes', 'strokeTia', 'vascular'];
  if (age === null || !['M', 'F'].includes(input.sex) || input.afConfirmed !== true || !complete(input, keys)) return null;
  return result(sum(input, keys) + Number(input.strokeTia) + (age >= 75 ? 2 : age >= 65 ? 1 : 0) + Number(input.sex === 'F'), 9);
}

export function calculateReviewedHASBLED(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), keys = ['uncontrolledHypertension', 'renal', 'liver', 'stroke', 'bleeding', 'labileINR', 'drugs', 'alcohol'];
  if (age === null || input.afConfirmed !== true || !complete(input, keys)) return null;
  // Pisters 2010 Methods/Table 2: elderly is >65; renal/liver and drugs/alcohol are separate points.
  return result(sum(input, keys) + Number(age > 65), 9);
}

export function calculateReviewedRoPE(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), keys = ['hypertension', 'diabetes', 'priorStrokeTia', 'smoker', 'corticalInfarct'];
  if (age === null || input.cryptogenicStrokeWithPfo !== true || !complete(input, keys)) return null;
  const agePoints = age < 30 ? 5 : age < 40 ? 4 : age < 50 ? 3 : age < 60 ? 2 : age < 70 ? 1 : 0;
  return result(agePoints + ['hypertension', 'diabetes', 'priorStrokeTia', 'smoker'].filter(key => input[key] === false).length + Number(input.corticalInfarct), 10);
}

export function classifyReviewedPASCAL(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), ropeScore = numericInput(input.ropeScore, { min: 0, max: 10, integer: true });
  if (age === null || age > 60 || ropeScore === null || input.cryptogenicStrokeWithPfo !== true || !complete(input, ['largeShunt', 'atrialSeptalAneurysm'])) return null;
  const highRoPE = ropeScore >= 7, highRiskPfo = input.largeShunt || input.atrialSeptalAneurysm;
  return { category: highRoPE && highRiskPfo ? 'Probable' : highRoPE || highRiskPfo ? 'Possible' : 'Unlikely', ropeScore };
}

export function calculateReviewedPHASES(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), size = numericInput(input.sizeMm, { min: Number.MIN_VALUE, max: 200 });
  const population = { northAmericaEurope: 0, japanese: 3, finnish: 5 }, site = { ica: 0, mca: 2, acaPcommPosterior: 4 };
  if (age === null || size === null || input.unrupturedSaccular !== true || !complete(input, ['hypertension', 'earlierSAH']) ||
    !Object.hasOwn(population, input.population) || !Object.hasOwn(site, input.site)) return null;
  return result(population[input.population] + Number(input.hypertension) + Number(age >= 70) +
    (size >= 20 ? 10 : size >= 10 ? 6 : size >= 7 ? 3 : 0) + Number(input.earlierSAH) + site[input.site], 22);
}

export const MRS_DESCRIPTORS = [
  'No symptoms.',
  'Symptoms without significant disability; usual activities remain possible.',
  'Slight disability; some previous activities are limited, but personal affairs are managed independently.',
  'Moderate disability; some assistance is needed, but walking is independent.',
  'Moderately severe disability; walking and personal care require assistance.',
  'Severe disability; bedridden and requiring continual care.',
  'Death (recorded outcome; do not infer from disability).'
];
export function describeReviewedMRS(value) {
  const score = numericInput(value, { min: 0, max: 6, integer: true });
  return score === null ? null : { score, description: MRS_DESCRIPTORS[score] };
}
export const HUNT_HESS_DESCRIPTORS = [
  '', 'Asymptomatic or mild headache with slight neck stiffness.',
  'Moderate to severe headache and neck stiffness; no neurologic deficit except a cranial nerve palsy.',
  'Drowsiness, confusion or a mild focal neurologic deficit.',
  'Stupor with moderate to severe weakness; early decerebrate posturing may be present.',
  'Deep coma with decerebrate posturing.'
];
export function describeReviewedHuntHess(input = {}) {
  input = inputObject(input);
  const grade = numericInput(input.grade, { min: 1, max: 5, integer: true });
  return input.reviewed === true && input.sahConfirmed === true && grade !== null ? { grade, description: HUNT_HESS_DESCRIPTORS[grade] } : null;
}
export function calculateReviewedWFNS(input = {}) {
  input = inputObject(input);
  const gcs = reviewedGcs(inputObject(input.gcs));
  if (gcs === null || input.sahConfirmed !== true || !complete(input, ['motorDeficit'])) return null;
  // The original table does not supply a category for GCS 15 with motor deficit.
  if (gcs === 15 && input.motorDeficit) return null;
  return { grade: gcs === 15 ? 1 : gcs >= 13 ? input.motorDeficit ? 3 : 2 : gcs >= 7 ? 4 : 5, gcs };
}

export function calculateReviewedModifiedFisher(input = {}) {
  input = inputObject(input);
  if (input.aneurysmalSah !== true || !complete(input, ['ivh']) || !['absent','thin','thick'].includes(input.bloodThickness)) return null;
  // Frontera 2006 Table 1 also assigns no visible SAH with IVH to grade 2.
  const grade = input.bloodThickness === 'thick' ? input.ivh ? 4 : 3 : input.ivh ? 2 : input.bloodThickness === 'thin' ? 1 : 0;
  return { grade:String(grade), description:`${{ absent:'No subarachnoid blood visible', thin:'Thin subarachnoid blood', thick:'Thick subarachnoid blood' }[input.bloodThickness]}; IVH ${input.ivh ? 'present' : 'absent'}.` };
}

export const MTICI_DESCRIPTORS = {
  '0':'No forward flow past the occlusion.',
  '1':'Contrast crosses the obstruction with minimal downstream filling.',
  '2a':'Downstream branches fill less than half of the affected territory.',
  '2b':'Downstream branches fill at least half of the affected territory, short of near-complete reperfusion.',
  '2c':'Almost complete reperfusion; a few distal cortical branches have delayed flow or small emboli.',
  '3':'All downstream branches fill normally with complete reperfusion.'
};
export function describeReviewedMTICI(input = {}) {
  input = inputObject(input);
  return input.reviewed === true && input.ischemic === true && typeof input.grade === 'string' && Object.hasOwn(MTICI_DESCRIPTORS,input.grade)
    ? { grade:input.grade, description:MTICI_DESCRIPTORS[input.grade] } : null;
}

export function calculateReviewedNASCET(input = {}) {
  input = inputObject(input);
  const narrow = numericInput(input.minimumDiameterMm, { min:Number.MIN_VALUE }), distal = numericInput(input.distalDiameterMm, { min:Number.MIN_VALUE });
  if (!complete(input,['patentExtracranialICA','nearOcclusion']) || input.patentExtracranialICA !== true || input.nearOcclusion !== false ||
    !['left','right'].includes(input.side) || narrow === null || distal === null || narrow > distal) return null;
  const percent = 100 * (1 - narrow / distal);
  // A positive residual lumen must never be displayed as complete occlusion.
  return { score:percent > 99.9 ? '>99.9' : Number(percent.toFixed(1)), max:100, unit:'%' };
}

export const ASPECTS_REGIONS = [['C', 'Caudate'], ['L', 'Lentiform nucleus'], ['IC', 'Internal capsule'], ['I', 'Insular ribbon'], ...['M1','M2','M3','M4','M5','M6'].map(key => [key, key])].map(([key, label]) => ({ key, label, weight: 1 }));
export const PC_ASPECTS_REGIONS = [
  ['pons', 'Pons', 2], ['midbrain', 'Midbrain', 2], ['cerebellumLeft', 'Left cerebellum', 1], ['cerebellumRight', 'Right cerebellum', 1],
  ['pcaLeft', 'Left PCA territory', 1], ['pcaRight', 'Right PCA territory', 1], ['thalamusLeft', 'Left thalamus', 1], ['thalamusRight', 'Right thalamus', 1]
].map(([key, label, weight]) => ({ key, label, weight }));
function reviewedRegions(input, regions) {
  if (input.reviewed !== true || !input.regions || !regions.every(region => typeof input.regions[region.key] === 'boolean')) return null;
  return result(10 - regions.reduce((total, region) => total + (input.regions[region.key] ? region.weight : 0), 0), 10);
}
export function calculateReviewedRegionalASPECTS(input = {}) {
  input = inputObject(input);
  return ['left', 'right'].includes(input.hemisphere) ? reviewedRegions(input, ASPECTS_REGIONS) : null;
}
export function calculateReviewedRegionalPCASPECTS(input = {}) { return reviewedRegions(inputObject(input), PC_ASPECTS_REGIONS); }

export function calculateReviewedPHQ2(input = {}) {
  input = inputObject(input);
  if (input.reviewed !== true) return null;
  const score = reviewedPhq2(input);
  return score === null ? null : result(score, 6);
}
export function calculateReviewedSTOPBANG(input = {}) {
  input = inputObject(input);
  const age = ageValue(input.age), weight = numericInput(input.weight, { min:Number.MIN_VALUE, max:350 }), height = numericInput(input.heightCm, { min:50, max:250 });
  const neck = numericInput(input.neckCm, { min:10, max:100 }), keys = ['sb_snoring','sb_tired','sb_observed','sb_pressure'];
  if (age === null || weight === null || height === null || neck === null || !['M','F'].includes(input.sex) || !complete(input,keys)) return null;
  const bmi = weight / (height / 100) ** 2;
  const score = reviewedStopBang({ ...input, stopBangAssessed:true, sb_bmi:bmi > 35, sb_age:age > 50, sb_neck:neck > 40, sb_gender:input.sex === 'M' });
  return score === null ? null : { ...result(score,8), bmi, bang:{ bmi:bmi > 35, age:age > 50, neck:neck > 40, male:input.sex === 'M' } };
}

const engines = { abcd2:calculateReviewedABCD2, chadsvasc:calculateReviewedCHADS2VASc, 'has-bled':calculateReviewedHASBLED, rope:calculateReviewedRoPE, pascal:classifyReviewedPASCAL, phases:calculateReviewedPHASES, 'mrs-descriptors':describeReviewedMRS, 'hunt-hess':describeReviewedHuntHess, wfns:calculateReviewedWFNS, 'modified-fisher':calculateReviewedModifiedFisher, mtici:describeReviewedMTICI, nascet:calculateReviewedNASCET, 'aspects-regions':calculateReviewedRegionalASPECTS, 'pc-aspects-regions':calculateReviewedRegionalPCASPECTS, phq2:calculateReviewedPHQ2, 'stop-bang':calculateReviewedSTOPBANG };
export const SUPPLEMENTARY_IDS = Object.keys(engines);
// Keep the canonical scoring dependency map independent of presentation/source
// prose so opening Encounter does not eagerly load the calculator directory.
const sharedInputs = { abcd2:['age','bp'], chadsvasc:['age','sex'], 'has-bled':['age'], rope:['age'], pascal:['age'], phases:['age'], 'mrs-descriptors':['mrs'], wfns:['gcs'], 'modified-fisher':['sahCause'], mtici:['mtici'], 'stop-bang':['age','sex','weight','height'] };
const canonicalValue = value => value === undefined ? null : value;
export function supplementarySourceKey(state, id) {
  const n = state.note || {};
  const values = { context: state.context ?? null, diagnosis: n.diagnosisCategory ?? null };
  for (const key of sharedInputs[id] || []) values[key] = canonicalValue(({age:n.age,sex:n.sex,bp:n.presentingBP,mrs:n.premorbidMRS,gcs:state.gcs,weight:n.weight,height:n.heightCm,sahCause:state.details?.sahCause,mtici:n.ticiScore})[key]);
  if (['aspects-regions','pc-aspects-regions','modified-fisher','nascet'].includes(id)) values.imaging = [n.ctDate,n.ctTime,n.ctResults,n.ctaDate,n.ctaTime,n.ctaResults].map(canonicalValue);
  if (id === 'pascal') values.rope = [supplementarySourceKey(state, 'rope'), state.supplementary?.rope || {}];
  return JSON.stringify(values);
}
function reviewedGroup(state, id) {
  const group = state.supplementary?.[id] || {};
  return { ...group, reviewed: group.reviewed === true && group.reviewSourceKey === supplementarySourceKey(state, id) };
}
export function supplementaryResult(state, id) {
  const n = state.note || {}, data = reviewedGroup(state, id);
  if (!Object.hasOwn(engines, id)) return null;
  if (id === 'mrs-descriptors') return describeReviewedMRS(n.premorbidMRS);
  if (id === 'pascal') {
    const rope = supplementaryResult(state, 'rope');
    return classifyReviewedPASCAL({ ...data, age:n.age, ropeScore:rope?.score, cryptogenicStrokeWithPfo:state.supplementary?.rope?.cryptogenicStrokeWithPfo });
  }
  if (id === 'mtici') return describeReviewedMTICI({ ...data, grade:n.ticiScore, ischemic:state.context === 'acute' && n.diagnosisCategory === 'ischemic' });
  if (id === 'modified-fisher') return calculateReviewedModifiedFisher({ ...data, aneurysmalSah:n.diagnosisCategory === 'sah' && state.details?.sahCause === 'Aneurysmal' });
  return engines[id]({ ...data, age:n.age, sex:n.sex, bp:n.presentingBP, gcs:state.gcs, weight:n.weight, heightCm:n.heightCm });
}
export function supplementaryReviewed(state, id) { return reviewedGroup(state, id).reviewed; }

const applications = { abcd2: ['dapt','abcd2'], 'aspects-regions': [null,'aspects'], 'pc-aspects-regions': [null,'pcAspects'] };
function applicationKey(state, id) {
  // Include local worksheet and shared data. PASCAL is not an applied Encounter scalar.
  return JSON.stringify([supplementarySourceKey(state,id), state.supplementary?.[id] || {}]);
}
const sameScore = (value, applied) => numericInput(value, { min:0, integer:true }) === applied;
export function reconcileSupplementaryAppliedScores(previous, next) {
  let output = next;
  for (const id of SUPPLEMENTARY_IDS) {
    const data = output.supplementary?.[id];
    if (data?.reviewed === true && data.reviewSourceKey !== supplementarySourceKey(output, id)) {
      output = { ...output, supplementary: { ...output.supplementary, [id]: { ...data, reviewed: false, reviewSourceKey: null } } };
    }
  }
  for (const [id, stamp] of Object.entries(output.supplementary?.applied || {})) {
    const destination = applications[id];
    if (!destination || !stamp || stamp.sourceKey === applicationKey(output,id)) continue;
    const [group,key] = destination, current = group ? output[group]?.[key] : output[key];
    output = { ...output, supplementary: { ...output.supplementary, applied: { ...output.supplementary.applied } } };
    delete output.supplementary.applied[id];
    if (sameScore(current,stamp.value)) output = group ? { ...output, [group]: { ...output[group], [key]: '' } } : { ...output, [key]: '' };
  }
  return output;
}
export function updateSupplementaryField(state, id, key, value) {
  const group = state.supplementary?.[id] || {};
  const edited = key === 'reviewed' ? { ...group, reviewed:value === true, reviewSourceKey:value === true ? supplementarySourceKey(state,id) : null } : { ...group, [key]:value, reviewed:false, reviewSourceKey:null };
  return reconcileSupplementaryAppliedScores(state, { ...state, supplementary:{ ...state.supplementary, [id]:edited } });
}
export function canApplySupplementaryScore(state, id) {
  return Object.hasOwn(applications,id) && state.context === 'acute' &&
    state.note?.diagnosisCategory === (id === 'abcd2' ? 'tia' : 'ischemic') && supplementaryResult(state,id) !== null;
}
export function applySupplementaryScore(state, id) {
  if (!canApplySupplementaryScore(state,id)) return state;
  const value = supplementaryResult(state,id).score, [group,key] = applications[id];
  const next = group ? { ...state, [group]: { ...state[group], [key]:value } } : { ...state, [key]:value };
  return { ...next, supplementary:{ ...next.supplementary, applied:{ ...next.supplementary?.applied, [id]:{ value, sourceKey:applicationKey(next,id) } } } };
}
