// src/evidence/screener-eval.js
//
// Pure, DOM-free port of the standalone stroke-trials-screener eligibility
// engine. No React, no browser globals — fully unit-testable.
//
// COMPLIANCE: unverified studies (sourceCompletenessStatus !== 'complete', and
// status 'placeholder') are surfaced separately and never returned as
// 'eligible' — the engine forces a full registry/protocol confirmation step.

import { screenerTrials } from './screenerTrials.js';
import { tryInt } from './matcher-helpers.js';

/* ── Constants the UI also needs ───────────────────────────────────── */

export const ONSET_PRESETS = [
  { name: '< 4.5h', val: 2, unit: 'hours', rangeHours: [0, 4.5], desc: 'Hyperacute' },
  { name: '4.5 – 24h', val: 12, unit: 'hours', rangeHours: [4.5, 24], desc: 'Acute' },
  { name: '24h – 7d', val: 3, unit: 'days', rangeHours: [24, 168], desc: 'Early Subacute' },
  { name: '7 – 30d', val: 15, unit: 'days', rangeHours: [168, 720], desc: 'Subacute' },
  { name: '30 – 180d', val: 3, unit: 'months', rangeHours: [720, 4320], desc: 'Late Subacute' },
  { name: '> 6mo', val: 8, unit: 'months', rangeHours: [4320, null], desc: 'Chronic' }
];

// Each item lists only screenable profiles that use it. Items used solely by
// closed or reference-only profiles are omitted, so the refiner never asks
// about a criterion that cannot change any screening result.
export const EXCLUSION_ITEMS = [
  { id: 'exMultipleTerritories', label: 'Acute occlusions in multiple vascular territories', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exTandem', label: 'Tandem occlusions (cervical + intracranial)', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exSeizureAtOnset', label: 'Seizure at stroke onset or before enrollment', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exSuspectedIcad', label: 'Known or suspected underlying intracranial atherosclerosis at the occlusion', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exIvtGivenOrPlanned', label: 'IV thrombolysis given or planned', classifications: ['ischemic'], trials: ['SISTER'] },
  { id: 'exXaDtiWithin48h', label: 'Factor Xa inhibitor or direct thrombin inhibitor within 48 h', classifications: ['ischemic'], trials: ['SISTER'] },
  { id: 'exTerminalIllness', label: 'Known terminal cancer or terminal illness at stroke onset', classifications: ['ischemic'], trials: ['TESTED'] },
  { id: 'exTerminalComorbidity2y', label: 'Life expectancy <24 months due to comorbid terminal conditions', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exSecondaryIch', label: 'Suspected secondary cause for ICH (AVM, aneurysm, tumor, SAH, trauma, coagulopathy)', classifications: ['ich'], trials: ['MINUTE', 'SATURN', 'FASTEST-2'] },
  { id: 'exMidbrain', label: 'Midbrain extension or infratentorial/thalamic location', classifications: ['ich'], trials: ['MINUTE'] },
  { id: 'exDoacLmwhAtOnset', label: 'DOAC or LMWH at ICH onset', classifications: ['ich'], trials: ['MINUTE'] },
  { id: 'exOacWithin7d', label: 'Oral anticoagulant (VKA or DOAC) within 7 days', classifications: ['ich'], trials: ['FASTEST-2'] },
  { id: 'exBrainstemIch', label: 'Brainstem hemorrhage (cerebellar is not brainstem)', classifications: ['ich'], trials: ['FASTEST-2'] },
  { id: 'exPriorIch12m', label: 'Prior ICH in past 12 months', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exClearAnticoagulationIndication', label: 'Separate mandatory anticoagulation indication (e.g., DVT/PE)', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exClearAntiplateletIndication', label: 'Clear baseline indication for antiplatelet therapy', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exIchScore3', label: 'Clinical ICH Score > 3', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exRecentCoronarySyndrome', label: 'CAD-related MI or unstable angina within the previous 3 months', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exSpontaneousHemorrhagicStroke', label: 'History of spontaneous hemorrhagic stroke', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exIntracranialHemorrhage', label: 'History of intracranial hemorrhage', classifications: ['ischemic', 'tia'], trials: ['INTERCEPT'] },
  { id: 'exBrainBleed2y', label: 'Spontaneous brain bleed within past 2 years', classifications: ['ischemic', 'tia'], trials: ['CLARITY'] },
  { id: 'exSaptContraindication', label: 'Contraindication to additional SAPT for 6 months', classifications: ['ischemic', 'tia'], trials: ['INTERCEPT'] },
  { id: 'exUntreatedStenosisPlaque', label: 'Untreated ≥50% stenosis or investigator-defined high-risk plaque: carotid, subclavian, vertebral or intracranial artery', classifications: ['ischemic', 'tia'], trials: ['INTERCEPT'] },
  { id: 'exPregnancy', label: 'Pregnancy', classifications: ['ischemic', 'ich', 'tia'], trials: ['STEP', 'SISTER', 'MINUTE', 'FASTEST-2', 'SCOUTS-3', 'MR-PICS', 'TELE-REHAB-2', 'INTERCEPT', 'VERIFY'] },
  { id: 'exIncarcerated', label: 'Patient is incarcerated (prisoner)', classifications: ['ischemic', 'ich'], trials: ['STEP', 'SCOUTS-3'] },
  { id: 'exTrach', label: 'Mechanical ventilation, tracheostomy, or oxygen > 4 L/min', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exCpapUse14d', label: 'CPAP use within 14 days pre-CVA', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exSecondaryIchOrSah', label: 'Stroke related to tumor, malformation, or SAH', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exPriorUeCondition', label: 'Prior upper extremity condition limiting use', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exLegallyBlind', label: 'Legally blind', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exDenseSensoryLoss', label: 'Dense sensory loss (NIHSS sensory score = 2)', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exRecentStroke30d', label: 'Separate symptomatic stroke within prior 30 days', classifications: ['ischemic', 'ich'], trials: ['VERIFY', 'TELE-REHAB-2'] },
  { id: 'exVerifySeizure', label: 'Seizure after the index stroke, or seizure within 12 months while taking antiseizure medication', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exSeizures', label: 'History of seizures or epilepsy', classifications: ['ischemic', 'ich'], trials: ['MR-PICS'] },
  { id: 'exBotoxVns3m', label: 'Botulinum toxin to paretic arm within past 3 months or expected by 8-month visit', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exTherapeuticAnticoagulation', label: 'Currently taking therapeutic anticoagulation', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exHistoryDvtPe', label: 'History of unprovoked DVT or any pulmonary embolus', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exRecurrentStroke', label: 'Recurrent stroke since the index stroke', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exLifeExpectancy9m', label: 'Life expectancy < 9 months', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exCongestiveHeartFailure', label: 'Congestive Heart Failure (moderate/severe)', classifications: ['ischemic', 'tia'], trials: ['CLARITY'] },
  { id: 'exMrPicsCommunication', label: 'Aphasia or cognitive deficits prevent communicating pain/discomfort or understanding motor testing/rehabilitation tasks', classifications: ['ischemic'], trials: ['MR-PICS'] }
];

// Every exclusion id any stored profile can reference, plus retired generic
// ids that must remain inert (they never satisfy a source-specific exclusion).
const ALL_EXCLUSION_IDS = [
  'exTerminalComorbidity2y', 'exRecentCoronarySyndrome', 'exSpontaneousHemorrhagicStroke',
  'exTherapeuticAnticoagulation', 'exMrPicsCommunication', 'exCaaCognitiveImpairment', 'exIntracranialHemorrhage', 'exUntreatedStenosisPlaque',
  'exMultipleTerritories', 'exTandem',
  'exTerminalIllness', 'exSecondaryIch', 'exMidbrain', 'exPriorIch12m',
  'exClearAnticoagulationIndication', 'exClearAntiplateletIndication',
  'exIchScore3', 'exRecentMi3m', 'exLifeExpectancy2y', 'exLifeExpectancy9m',
  'exPriorIchHistory', 'exBrainBleed2y',
  'exSaptContraindication', 'exCarotidStenosis50', 'exPregnancy',
  'exIncarcerated', 'exTrach', 'exCpapUse14d', 'exSecondaryIchOrSah',
  'exPriorUeCondition', 'exLegallyBlind', 'exDenseSensoryLoss',
  'exRecentStroke30d', 'exSeizures', 'exVerifySeizure', 'exSevereAphasiaCognitive', 'exBotoxVns3m',
  'exAnticoagulation', 'exHistoryDvtPe', 'exRecurrentStroke',
  'exCongestiveHeartFailure', 'exEgfr30',
  'exDoacLmwhAtOnset', 'exOacWithin7d', 'exBrainstemIch', 'exIvtGivenOrPlanned', 'exXaDtiWithin48h', 'exSeizureAtOnset', 'exSuspectedIcad'
];

/* ── Evaluation Engine ─────────────────────────────────────────────── */

const OPERATORS = {
  '==': (p, v) => p === v,
  '!=': (p, v) => p !== v,
  '>=': (p, v) => typeof p === 'number' && p >= v,
  '<=': (p, v) => typeof p === 'number' && p <= v,
  '>': (p, v) => typeof p === 'number' && p > v,
  '<': (p, v) => typeof p === 'number' && p < v,
  'between': (p, v) => typeof p === 'number' && p >= v[0] && p <= v[1],
  'in': (p, v) => Array.isArray(v) && v.includes(p)
};

const missing = v => v === undefined || v === null || (typeof v === 'string' && (!v.trim() || v === 'unselected')) || (typeof v === 'number' && !Number.isFinite(v));
const SCORE_RANGES = { nihss: [0, 42], aspects: [0, 10], gcs: [3, 15], preMrs: [0, 6], currentMrs: [0, 6] };
const CLASSIFICATIONS = ['ischemic', 'tia', 'ich'];
const CATEGORICAL_VALUES = {
  classification: CLASSIFICATIONS,
  vessel: ['ica_m1', 'dominant_m2', 'm2_m3_nd', 'other', 'none'],
  ichLocation: ['bg', 'lobar', 'thalamic', 'infratentorial', 'other'],
  volume: ['bg_large', 'small', 'other'],
  etiology: ['esus', 'cardioembolic', 'laa', 'small_vessel', 'other'],
  rehab: ['yes', 'none'], language: ['english', 'spanish', 'other']
};
function criterionValue(c, p) {
  const value = p[c.field];
  if (missing(value)) return null;
  if (typeof c.value === 'boolean') return typeof value === 'boolean' ? value : null;
  if (CATEGORICAL_VALUES[c.field] && !CATEGORICAL_VALUES[c.field].includes(value)) return null;
  const numeric = ['>=', '<=', '>', '<', 'between'].includes(c.operator) ||
    typeof c.value === 'number' || (Array.isArray(c.value) && c.value.every(v => typeof v === 'number'));
  if (numeric) {
    const n = tryInt(value);
    if (n === null || n < 0) return null;
    const range = SCORE_RANGES[c.field];
    if (range && (!Number.isInteger(n) || n < range[0] || n > range[1])) return null;
    return n;
  }
  return typeof value === 'string' ? value : null;
}
function validOnsetRange(range, hours) {
  if (!Array.isArray(range) || range.length !== 2 || hours === null) return false;
  const [lo, hi] = range;
  return typeof lo === 'number' && Number.isFinite(lo) && lo >= 0 &&
    (hi === null || (typeof hi === 'number' && Number.isFinite(hi) && hi >= lo)) &&
    hours >= lo && (hi === null || hours <= hi);
}
function evaluateCriterion(c, p) {
  if (c.operator === 'or') {
    const branches = (c.branches || []).map(b => {
      const results = b.criteria.map(cc => evaluateCriterion(cc, p));
      return results.includes(false) ? false : results.includes(null) ? null : true;
    });
    return branches.includes(true) ? true : branches.includes(null) ? null : false;
  }
  const val = criterionValue(c, p);
  const op = OPERATORS[c.operator];
  if (!op || missing(val)) return null;
  if (c.field?.startsWith('onset') && Array.isArray(p.onsetRangeHours)) {
    if (!validOnsetRange(p.onsetRangeHours, p.onsetHours)) return null;
    const divisor = c.field === 'onsetDays' ? 24 : c.field === 'onsetMonths' ? 720 : 1;
    const lo = p.onsetRangeHours[0] / divisor;
    const hi = p.onsetRangeHours[1] === null ? Infinity : p.onsetRangeHours[1] / divisor;
    // Preset bands share endpoints (4.5 h, 24 h, 7 d, 30 d, 180 d). A band
    // that touches a study limit only at its endpoint does not overlap that
    // window, so it is a definite miss rather than an unknown.
    if (c.operator === 'between') {
      if (hi <= c.value[0] || lo >= c.value[1]) return false;
      return lo >= c.value[0] && hi <= c.value[1] ? true : null;
    }
    if ((c.operator === '<=' || c.operator === '<') && lo >= c.value && lo > 0) return false;
    if ((c.operator === '>=' || c.operator === '>') && hi <= c.value) return false;
    const atLo = op(lo,c.value), atHi = op(hi,c.value);
    return atLo === atHi ? atLo : null;
  }
  return op(val, c.value);
}

const FIELD_TEXT = {
  age: 'age', nihss: 'NIHSS', aspects: 'ASPECTS', gcs: 'GCS', preMrs: 'pre-stroke mRS', currentMrs: 'current (post-stroke) mRS',
  vessel: 'occlusion site', ichLocation: 'ICH location', ichVolume: 'ICH volume (mL)', classification: 'event type',
  onsetHours: 'hours from LKW', onsetDays: 'days from LKW', onsetMonths: 'months from LKW',
  afibHistory: 'documented clinical atrial fibrillation', afOrFlutterHistory: 'atrial fibrillation or flutter', statin: 'statin use at onset',
  takingOac: 'oral anticoagulant at the index stroke', exUeWeakness: 'upper-extremity motor deficit', presentedWithin24h: 'presentation within 24 h of LKW'
};
const VALUE_TEXT = {
  ica_m1: 'ICA/M1', dominant_m2: 'dominant M2', m2_m3_nd: 'non-dominant M2/M3', other: 'other', none: 'none',
  bg: 'basal ganglia', lobar: 'lobar', thalamic: 'thalamic', infratentorial: 'infratentorial',
  ischemic: 'ischemic stroke', ich: 'ICH', tia: 'TIA', english: 'English', spanish: 'Spanish', yes: 'yes'
};
const OP_TEXT = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '=', '!=': '≠' };
const valueText = v => VALUE_TEXT[v] ?? String(v);

// Unknown criteria are phrased as questions to answer — never as a matched
// template with an empty "{value}" or as a failed criterion.
export function pendingText(c) {
  if (c.pendingLabel) return c.pendingLabel;
  if (c.operator === 'or') return 'Confirm one pathway: ' + (c.branches || []).map(b => (b.label || '').replace(/^Meets\s+/, '')).filter(Boolean).join(' OR ');
  const label = FIELD_TEXT[c.field] || c.field;
  if (typeof c.value === 'boolean') return `Confirm ${label}${c.value ? '' : ' is absent'}`;
  if (c.operator === 'between') return `Confirm ${label} ${c.value[0]}–${c.value[1]}`;
  if (c.operator === 'in') return `Confirm ${label} is ${c.value.map(valueText).join(' or ')}`;
  return `Confirm ${label} ${OP_TEXT[c.operator] || c.operator} ${valueText(c.value)}`;
}

function getActiveBranch(c, p) {
  if (c.operator !== 'or') return null;
  return c.branches.find(b => b.criteria.every(cc => evaluateCriterion(cc, p)));
}

function formatLabel(label, p, field) {
  if (!label) return '';
  return label.replace('{value}', p[field]);
}

/* ── Default screenerState ─────────────────────────────────────────── */

export function createInitialScreenerState() {
  return {
    classification: 'unselected',
    onsetVal: null,
    onsetUnit: 'hours',
    onsetRangeHours: null,
    age: 'unselected',
    nihss: 'unselected',
    aspects: 'unselected',
    gcs: 'unselected',
    preMrs: 'unselected',
    currentMrs: 'unselected',
    vessel: 'unselected',
    etiology: 'unselected',
    ichLocation: 'unselected',
    volume: 'unselected',
    ichVolume: 'unselected',
    // Display value of the "anticoagulant at onset" fact. Selecting it writes
    // the derived OAC/exclusion facts; the engine never reads this field.
    anticoagulant: 'unselected',
    statin: 'unselected',
    language: 'unselected',
    rehab: 'unselected',
    self_consent: 'unselected',
    availability_54w: 'unselected',
    ueWeakness: 'unselected',
    unilateralSymptomatic: 'unselected',
    anteriorCirculation: 'unselected',
    presentedWithin24h: 'unselected',
    singleAntiplateletSoc: 'unselected',
    afibHistory: 'unselected',
    afOrFlutterHistory: 'unselected',
    takingOac: 'unselected',
    exclusions: {}
  };
}

export function onsetToHours(onsetVal, onsetUnit) {
  if (typeof onsetVal !== 'number' && (typeof onsetVal !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(onsetVal.trim()))) return null;
  const value = Number(onsetVal);
  const factor = onsetUnit === 'hours' ? 1 : onsetUnit === 'days' ? 24 : onsetUnit === 'months' ? 720 : null;
  if (!Number.isFinite(value) || value < 0 || typeof factor !== 'number') return null;
  const hours = value * factor;
  return Number.isFinite(hours) ? hours : null;
}

export function buildScreenerParams(state) {
  const rawHours = onsetToHours(state.onsetVal, state.onsetUnit);
  const rangeValid = state.onsetRangeHours == null || validOnsetRange(state.onsetRangeHours, rawHours);
  const onsetHours = rangeValid ? rawHours : null;
  const onsetDays = onsetHours === null ? null : onsetHours / 24.0;
  const onsetMonths = onsetDays === null ? null : onsetDays / 30.0;

  const p = {
    classification: state.classification,
    onsetHours,
    onsetRangeHours: rangeValid ? state.onsetRangeHours : null,
    onsetDays,
    onsetMonths,
    age: state.age,
    nihss: state.nihss,
    aspects: state.aspects,
    gcs: state.gcs,
    preMrs: state.preMrs,
    currentMrs: state.currentMrs ?? 'unselected',
    vessel: state.vessel,
    etiology: state.etiology,
    ichLocation: state.ichLocation,
    volume: state.volume,
    ichVolume: state.ichVolume ?? 'unselected',
    statin: state.statin,
    language: ['english', 'spanish', 'other'].includes(state.language) ? state.language : state.language === true ? 'english' : state.language === false ? 'other' : 'unselected',
    rehab: ['yes', 'none'].includes(state.rehab) ? state.rehab : state.rehab === true ? 'yes' : state.rehab === false ? 'none' : 'unselected',
    self_consent: state.self_consent,
    availability_54w: state.availability_54w,
    exUeWeakness: state.ueWeakness,
    unilateralSymptomatic: state.unilateralSymptomatic,
    anteriorCirculation: state.anteriorCirculation,
    presentedWithin24h: state.presentedWithin24h,
    singleAntiplateletSoc: state.singleAntiplateletSoc,
    afibHistory: state.afibHistory,
    // AF establishes this broader ASPIRE criterion; absent AF does not exclude flutter.
    afOrFlutterHistory: typeof state.afOrFlutterHistory === 'boolean' ? state.afOrFlutterHistory : state.afibHistory === true ? true : 'unselected',
    takingOac: state.takingOac
  };

  const ex = state.exclusions || {};
  ALL_EXCLUSION_IDS.forEach((id) => {
    p[id] = typeof ex[id] === 'boolean' ? ex[id] : null;
  });
  if (state.ichLocation === 'thalamic' || state.ichLocation === 'infratentorial') p.exMidbrain = true;

  return p;
}

export function evaluateTrialEligibility(trial, p) {
  if (trial.status === 'closed') {
    return { status: 'closed', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: ['Study is closed to enrollment'], sourceGaps: trial.sourceGaps || [] };
  }
  if (trial.status === 'placeholder') {
    return { status: 'placeholder', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: ['Incomplete study profile in source; screening not possible'], sourceGaps: trial.sourceGaps || [] };
  }

  if (!['enrolling', 'soon'].includes(trial.status)) {
    return { status: 'closed', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: ['Enrollment status is unknown or inactive; confirm with the study team'], sourceGaps: trial.sourceGaps || [] };
  }
  const criteria = trial.eligibility?.criteria || [];
  const exclusions = trial.eligibility?.exclusions || [];
  const failed = criteria.filter(c => evaluateCriterion(c, p) === false);
  const hits = exclusions.filter(c => evaluateCriterion(c, p) === true);
  const tooEarly = c => c.field?.startsWith('onset') && typeof p[c.field] === 'number' &&
    ((c.operator === '>=' && p[c.field] < c.value) || (c.operator === '>' && p[c.field] <= c.value) || (c.operator === 'between' && p[c.field] < c.value[0]));
  const futureWindow = failed.length > 0 && failed.every(tooEarly) && hits.length === 0;
  const pendingCriteria = [
    ...criteria.filter(c => evaluateCriterion(c,p) === null).map(pendingText),
    ...exclusions.filter(c => evaluateCriterion(c,p) === null).map(c => c.pendingLabel || `Confirm exclusion absent: ${c.error || c.field}`),
    // A shared refiner answer (e.g. 'Pregnancy: absent') can leave a study-specific part open.
    ...exclusions.filter(c => c.residualPending && evaluateCriterion(c,p) === false).map(c => c.residualPending),
    ...(trial.eligibility?.manualPending || [])
  ].filter(Boolean);
  // Every stored profile is a partial summary. Neither absence of a modeled
  // exclusion nor metadata verification establishes complete eligibility.
  pendingCriteria.push('Full registry/protocol, local activation and consent confirmation required');
  const matchedCriteria = criteria.filter(c => evaluateCriterion(c,p) === true).map(c => c.operator === 'or' ? getActiveBranch(c,p)?.label : formatLabel(c.matchedLabel,p,c.field)).filter(Boolean);
  return {
    status: hits.length || (failed.length && !futureWindow) ? 'excluded' : (trial.status === 'soon' || futureWindow) ? 'soon' : 'pending',
    // A patient before the study window is different from a registry that is
    // not yet recruiting. Preserve both facts when they happen together.
    beforeWindow: futureWindow,
    notYetEnrolling: trial.status === 'soon',
    matchedCriteria: [...new Set(matchedCriteria)],
    pendingCriteria: [...new Set(pendingCriteria)],
    pendingFields: [...new Set([...criteria.filter(c => evaluateCriterion(c,p) === null).flatMap(c => c.operator === 'or' ? ['Alternative eligibility pathway'] : [{age:'Age',rehab:'Rehab unit placement',language:'Language spoken',currentMrs:'Current post-stroke mRS',preMrs:'Pre-stroke mRS',ichVolume:'ICH volume'}[c.field] || c.field]), ...exclusions.filter(c => evaluateCriterion(c,p) === null).map(c => c.pendingLabel || c.error || c.field), 'Full registry/protocol confirmation'])],
    exclusionReasons: [...failed.filter(c => !futureWindow).map(c => c.error), ...hits.map(c => c.error)].filter(Boolean),
    failedFields: [...failed.map(c => c.field || 'pathway'), ...hits.map(c => c.field)],
    sourceGaps: trial.sourceGaps || [],
    fullProtocolReviewRequired: true
  };
}

export function isTrialPotentiallyActive(trial, p) {
  if (!['enrolling', 'soon'].includes(trial.status)) return false;
  const res = evaluateTrialEligibility(trial, p);
  return res.status !== 'excluded';
}

export function patientTimeCategory(onsetDays) {
  if (typeof onsetDays !== 'number' || !Number.isFinite(onsetDays) || onsetDays < 0) return 'unknown';
  if (onsetDays <= 1) return 'hyperacute';
  if (onsetDays > 1 && onsetDays <= 30) return 'acute_subacute';
  return 'subacute_chronic';
}

export function getTimeSortingScore(trialCategory, patientCategory) {
  if (patientCategory === 'unknown') return 0;
  if (patientCategory === 'hyperacute') {
    if (trialCategory === 'hyperacute') return 3;
    if (trialCategory === 'acute_subacute') return 2;
    return 1;
  } else if (patientCategory === 'acute_subacute') {
    if (trialCategory === 'acute_subacute') return 3;
    if (trialCategory === 'subacute_chronic') return 2;
    return 1;
  }
  if (trialCategory === 'subacute_chronic') return 3;
  if (trialCategory === 'acute_subacute') return 2;
  return 1;
}

function sortListByTime(list, patientCategory) {
  list.forEach((item, idx) => { item.originalIndex = idx; });
  list.sort((a, b) => {
    const scoreA = getTimeSortingScore(a.trial.timeCategory, patientCategory);
    const scoreB = getTimeSortingScore(b.trial.timeCategory, patientCategory);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.originalIndex - b.originalIndex;
  });
  return list;
}

// Reference-only profiles (criteria tables / Database) are never screened.
export function evaluateAll(state, trials = screenerTrials) {
  const ready = CLASSIFICATIONS.includes(state.classification);
  const params = buildScreenerParams(state);
  const buckets = { eligible: [], pending: [], soon: [], excluded: [], closed: [], incomplete: [] };

  if (ready) {
    trials.filter(trial => !trial.referenceOnly).forEach((trial) => {
      const r = evaluateTrialEligibility(trial, params);
      const item = { trial, status: r.status, beforeWindow: r.beforeWindow || false, notYetEnrolling: r.notYetEnrolling || false, matchedCriteria: r.matchedCriteria, pendingCriteria: r.pendingCriteria, pendingFields: r.pendingFields || [], exclusionReasons: r.exclusionReasons || [], failedFields: r.failedFields || [], sourceGaps: r.sourceGaps || [] };
      if (r.status === 'placeholder') buckets.incomplete.push(item);
      else buckets[r.status].push(item);
    });
  }

  const timeCategory = patientTimeCategory(params.onsetDays);
  Object.keys(buckets).forEach(k => sortListByTime(buckets[k], timeCategory));

  return { ready, params, timeCategory, ...buckets, briefingNote: ready ? buildBriefingNote(state, buckets) : '' };
}

/* ── Display helpers shared by the UI and the copied summary ───────── */

export const SCREEN_CAVEAT = 'First-pass registry screen — confirm full criteria, local activation and consent.';
// The engine appends this to every result; the page states it once instead.
export const GENERIC_CONFIRMATION = 'Full registry/protocol, local activation and consent confirmation required';

export function phaseLabel(metadata = {}) {
  if (metadata.studyType === 'OBSERVATIONAL') return 'Observational';
  const phase = String(metadata.phase || '');
  if (!phase) return '';
  if (phase === 'NA') return 'Phase N/A';
  return 'Phase ' + phase.replace(/PHASE/g, '').split(/[/,\s]+/).filter(Boolean).join('/');
}

export function enrollmentLabel(trial, result) {
  if (result?.notYetEnrolling || trial.status === 'soon') return 'Not yet recruiting';
  if (result?.beforeWindow) return 'Before study window';
  if (trial.status === 'enrolling') return 'Recruiting';
  if (trial.status === 'closed') return trial.externalMetadata?.registryStatus === 'ACTIVE_NOT_RECRUITING' ? 'Not enrolling (active, not recruiting)' : 'Not enrolling';
  return 'Status unverified';
}

export const toConfirm = result => (result?.pendingCriteria || []).filter(line => line !== GENERIC_CONFIRMATION);
// A study for a different stroke type is not a useful "not met" entry.
export const relevantNotMet = excluded => (excluded || []).filter(item => !(item.failedFields || []).includes('classification'));

const CLASSIFICATION_NOTE_LABELS = {
  ischemic: 'Ischemic stroke',
  tia: 'TIA',
  ich: 'Hemorrhage (ICH)'
};

const ONSET_NOTE_LABELS = [
  { maxHours: 4.5, label: '< 4.5 h from LKW' },
  { maxHours: 24, label: '4.5 – 24 h from LKW' },
  { maxHours: 24 * 7, label: '24 h – 7 d from LKW' },
  { maxHours: 24 * 30, label: '7 – 30 d from LKW' },
  { maxHours: 24 * 180, label: '30 – 180 d from LKW' }
];

function onsetNoteLabel(onsetHours) {
  if (onsetHours === null) return 'Not recorded';
  const band = ONSET_NOTE_LABELS.find((b) => onsetHours <= b.maxHours);
  return band ? band.label : '> 6 months from LKW';
}

export function onsetSummary(state) {
  const { onsetHours, onsetRangeHours } = buildScreenerParams(state);
  if (onsetHours === null) return 'LKW unknown';
  if (Array.isArray(onsetRangeHours)) return onsetNoteLabel(onsetHours) + ' (selected range)';
  const exact = onsetHours < 48 ? onsetHours.toFixed(1) + ' h' : onsetHours < 24 * 60 ? (onsetHours / 24).toFixed(1) + ' d' : (onsetHours / 24 / 30).toFixed(1) + ' mo';
  return 'LKW ' + exact;
}

const INPUT_TEXT = [
  ['age', v => 'age ' + v],
  ['nihss', v => 'NIHSS ' + v],
  ['gcs', v => 'GCS ' + v],
  ['preMrs', v => 'pre-mRS ' + v],
  ['aspects', v => 'ASPECTS ' + v],
  ['vessel', v => 'occlusion ' + valueText(v)],
  ['ichLocation', v => 'location ' + valueText(v)],
  ['ichVolume', v => 'volume ' + v + ' mL'],
  ['anticoagulant', v => 'anticoagulant at onset: ' + ({ none: 'none', doac: 'DOAC', lmwh: 'LMWH', vka: 'warfarin/VKA' }[v] || v)],
  ['takingOac', v => v ? 'on OAC at index event' : 'not on OAC at index event'],
  ['afibHistory', v => v ? 'atrial fibrillation' : 'no atrial fibrillation'],
  ['statin', v => v ? 'statin at onset' : 'no statin at onset']
];

// Plain-text summary for a note or a research-coordinator message. It carries
// only what the screener was told plus the resulting groups and reasons.
export function buildBriefingNote(state, buckets) {
  const { eligible = [], pending = [], soon = [], excluded = [] } = buckets;
  const cls = CLASSIFICATION_NOTE_LABELS[state.classification] || String(state.classification || '').toUpperCase();
  const inputs = [cls, onsetSummary(state), ...INPUT_TEXT.filter(([key]) => !missing(state[key]) && state[key] !== 'unselected').filter(([key]) => !(key === 'takingOac' && state.anticoagulant && state.anticoagulant !== 'unselected')).map(([key, text]) => text(state[key]))];
  // Only assessments that can affect a study for this stroke type are reported.
  const itemFor = id => EXCLUSION_ITEMS.find(item => item.id === id && item.classifications.includes(state.classification));
  const recorded = Object.entries(state.exclusions || {}).filter(([id, v]) => typeof v === 'boolean' && itemFor(id)).map(([id, v]) => `${itemFor(id).label}: ${v ? 'present' : 'absent'}`);
  const checks = [...new Set([...eligible, ...pending, ...soon].map(item => item.trial.externalMetadata?.verificationDate).filter(Boolean))].sort();
  const head = item => {
    const m = item.trial.externalMetadata || {};
    return `- ${item.trial.acronym} (${m.nct || 'no NCT'}) · ${enrollmentLabel(item.trial, item)}${phaseLabel(m) ? ' · ' + phaseLabel(m) : ''} · window ${item.trial.enrollmentWindowText}`;
  };

  const lines = ['TRIAL SCREEN — first pass' + (checks.length ? ` (registry checked ${checks[checks.length - 1]})` : '')];
  lines.push('Inputs: ' + inputs.join(' · '));
  if (recorded.length) lines.push('Exclusions recorded: ' + recorded.join('; '));
  lines.push('Anything not listed was not entered and remains unknown.', '');

  const candidates = [...eligible, ...pending];
  lines.push(`ACT NOW — possible candidates (${candidates.length})`);
  if (!candidates.length) lines.push('- None under the entered facts.');
  candidates.forEach(item => {
    const confirm = toConfirm(item);
    lines.push(head(item));
    if (confirm.length) lines.push(`  To confirm (${confirm.length}): ${confirm.join('; ')}`);
    lines.push(`  Pathway: ${item.trial.pathway}`);
  });
  if (soon.length) {
    lines.push('', `LATER (${soon.length})`);
    soon.forEach(item => lines.push(head(item) + (item.beforeWindow && item.notYetEnrolling ? ' · before study window' : '')));
  }
  const notMet = relevantNotMet(excluded);
  if (notMet.length) {
    lines.push('', `NOT MET (${notMet.length})`);
    notMet.forEach(item => lines.push(`- ${item.trial.acronym}: ${item.exclusionReasons.join('; ') || 'modeled criterion not met'}`));
  }
  lines.push('', SCREEN_CAVEAT + ' Screening does not determine treatment eligibility.');
  return lines.join('\n') + '\n';
}

export const buildScreeningSummary = buildBriefingNote;

export default evaluateAll;
