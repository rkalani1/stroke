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

export const EXCLUSION_ITEMS = [
  { id: 'exMultipleTerritories', label: 'Acute occlusions in multiple vascular territories', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exTandem', label: 'Tandem occlusions (cervical + intracranial)', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exTerminalIllness', label: 'Known terminal cancer or terminal illness at stroke onset', classifications: ['ischemic'], trials: ['TESTED'] },
  { id: 'exLifeExpectancy2y', label: 'Life expectancy < 2 years', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exSecondaryIch', label: 'Suspected secondary cause for ICH (AVM, aneurysm, tumor, SAH)', classifications: ['ich'], trials: ['MINUTE', 'SATURN'] },
  { id: 'exMidbrain', label: 'Midbrain extension or infratentorial/thalamic location', classifications: ['ich'], trials: ['MINUTE'] },
  { id: 'exPriorIch12m', label: 'Prior ICH in past 12 months', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exClearAnticoagulationIndication', label: 'Separate mandatory anticoagulation indication (e.g., DVT/PE)', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exClearAntiplateletIndication', label: 'Clear baseline indication for antiplatelet therapy', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exIchScore3', label: 'Clinical ICH Score > 3', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exRecentMi3m', label: 'Myocardial Infarction within past 3 months', classifications: ['ich'], trials: ['SATURN'] },
  { id: 'exEgfr35', label: 'eGFR < 35 ml/min/1.73m²', classifications: ['ischemic'], trials: ['ESUS', 'MOCHA'] },
  { id: 'exMriContraindication', label: 'Contraindication to MRI or gadolinium contrast', classifications: ['ischemic'], trials: ['ESUS', 'MOCHA'] },
  { id: 'exRecentSurgery30d', label: 'Surgery within 30 days prior to stroke onset', classifications: ['ischemic'], trials: ['ESUS'] },
  { id: 'exBilateralCarotidRevasc', label: 'History of bilateral carotid endarterectomy/stenting', classifications: ['ischemic'], trials: ['MOCHA'] },
  { id: 'exPriorIchHistory', label: 'Prior history of spontaneous ICH / brain hemorrhage', classifications: ['ischemic', 'tia'], trials: ['INTERCEPT', 'MR-PICS'] },
  { id: 'exBrainBleed2y', label: 'Spontaneous brain bleed within past 2 years', classifications: ['ischemic', 'tia'], trials: ['CLARITY'] },
  { id: 'exSaptContraindication', label: 'Contraindication to additional SAPT for 6 months', classifications: ['ischemic'], trials: ['INTERCEPT'] },
  { id: 'exCarotidStenosis50', label: 'Carotid/vertebral/subclavian/intracranial stenosis ≥ 50%', classifications: ['ischemic'], trials: ['INTERCEPT'] },
  { id: 'exPregnancy', label: 'Pregnancy', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3', 'MR-PICS', 'TELE-REHAB-2', 'INTERCEPT'] },
  { id: 'exIncarcerated', label: 'Patient is incarcerated (prisoner)', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
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
  { id: 'exAnticoagulation', label: 'Currently taking anticoagulants', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exHistoryDvtPe', label: 'History of unprovoked DVT or any pulmonary embolus', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exRecurrentStroke', label: 'Recurrent stroke since the index stroke', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exLifeExpectancy9m', label: 'Life expectancy < 9 months', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exCongestiveHeartFailure', label: 'Congestive Heart Failure (moderate/severe)', classifications: ['ischemic', 'tia'], trials: ['CLARITY'] },
  { id: 'exSevereAphasiaCognitive', label: 'Moderate-to-severe cognitive impairment, dementia, or severe aphasia', classifications: ['ischemic', 'ich'], trials: ['MR-PICS', 'CAPPRICORN-1'] },
  { id: 'exEgfr30', label: 'eGFR < 30 ml/min/1.73m²', classifications: ['ich'], trials: ['CAPPRICORN-1'] }
];

const ALL_EXCLUSION_IDS = [
  'exMultipleTerritories', 'exTandem',
  'exTerminalIllness', 'exSecondaryIch', 'exMidbrain', 'exMassiveIvh',
  'exAbsentBrainstem', 'exEvdEvacuation', 'exPriorIch12m',
  'exClearAnticoagulationIndication', 'exClearAntiplateletIndication',
  'exIchScore3', 'exRecentMi3m', 'exLifeExpectancy2y', 'exLifeExpectancy9m',
  'exEgfr35', 'exMriContraindication', 'exRecentSurgery30d',
  'exBilateralCarotidRevasc', 'exPriorIchHistory', 'exBrainBleed2y',
  'exSaptContraindication', 'exCarotidStenosis50', 'exPregnancy',
  'exIncarcerated', 'exTrach', 'exCpapUse14d', 'exSecondaryIchOrSah',
  'exPriorDementia', 'exWorseningNeurologic', 'exDisorderInterfering',
  'exPriorUeCondition', 'exLegallyBlind', 'exDenseSensoryLoss',
  'exRecentStroke30d', 'exSeizures', 'exVerifySeizure', 'exSevereSpasticity', 'exArmInjury',
  'exSevereAphasiaCognitive', 'exSevereClaustrophobia', 'exBotoxVns3m',
  'exAnticoagulation', 'exHistoryDvtPe', 'exRecurrentStroke',
  'exPlannedCarotidIntervention', 'exDrugAlcoholAbuse',
  'exMsParkinsonAlsDementia', 'exMajorPsychiatric', 'exOtherUpperLimbTrial',
  'exCongestiveHeartFailure', 'exEgfr30'
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
    if (c.operator === 'between') {
      if (hi < c.value[0] || lo > c.value[1]) return false;
      return lo >= c.value[0] && hi <= c.value[1] ? true : null;
    }
    const atLo = op(lo,c.value), atHi = op(hi,c.value);
    return atLo === atHi ? atLo : null;
  }
  return op(val, c.value);
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
    ...criteria.filter(c => evaluateCriterion(c,p) === null).map(c => c.pendingLabel || c.matchedLabel || c.error || c.field),
    ...exclusions.filter(c => evaluateCriterion(c,p) === null).map(c => c.pendingLabel || `Confirm exclusion absent: ${c.error || c.field}`),
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
    pendingFields: [...new Set([...criteria.filter(c => evaluateCriterion(c,p) === null).flatMap(c => c.operator === 'or' ? ['Alternative eligibility pathway'] : [{age:'Age',rehab:'Rehab unit placement',language:'Language spoken',currentMrs:'Current post-stroke mRS',preMrs:'Pre-stroke mRS'}[c.field] || c.field]), ...exclusions.filter(c => evaluateCriterion(c,p) === null).map(c => c.pendingLabel || c.error || c.field), 'Full registry/protocol confirmation'])],
    exclusionReasons: [...failed.filter(c => !futureWindow).map(c => c.error), ...hits.map(c => c.error)].filter(Boolean),
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

export function evaluateAll(state, trials = screenerTrials) {
  const ready = CLASSIFICATIONS.includes(state.classification);
  const params = buildScreenerParams(state);
  const buckets = { eligible: [], pending: [], soon: [], excluded: [], closed: [], incomplete: [] };

  if (ready) {
    trials.forEach((trial) => {
      const r = evaluateTrialEligibility(trial, params);
      const item = { trial, status: r.status, beforeWindow: r.beforeWindow || false, notYetEnrolling: r.notYetEnrolling || false, matchedCriteria: r.matchedCriteria, pendingCriteria: r.pendingCriteria, pendingFields: r.pendingFields || [], exclusionReasons: r.exclusionReasons || [], sourceGaps: r.sourceGaps || [] };
      if (r.status === 'placeholder') buckets.incomplete.push(item);
      else buckets[r.status].push(item);
    });
  }

  const timeCategory = patientTimeCategory(params.onsetDays);
  Object.keys(buckets).forEach(k => sortListByTime(buckets[k], timeCategory));

  return { ready, params, timeCategory, ...buckets, briefingNote: ready ? buildBriefingNote(state, buckets) : '' };
}

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

function briefingSourceLine(trial) {
  const metadata = trial.externalMetadata || {};
  const status = metadata.registryStatus ? metadata.registryStatus.replace(/_/g, ' ').toLowerCase() : 'not verified';
  return `   Registry: ${status}; recorded check: ${metadata.verificationDate || 'not recorded'}; local activation: not confirmed.\n`;
}

// Paste-ready referral note. Deliberately carries only what the screener was
// actually told — classification and onset window — plus the matched studies
// and their referral pathway. It never asserts bedside facts the user did not
// enter (the v7.3 screener no longer collects them).
export function buildBriefingNote(state, buckets) {
  const { eligible, pending, soon } = buckets;
  const cls = CLASSIFICATION_NOTE_LABELS[state.classification] || String(state.classification || '').toUpperCase();
  const { onsetHours, onsetRangeHours } = buildScreenerParams(state);

  const screenedAt = onsetHours === null ? 'not recorded' : onsetHours < 48
    ? onsetHours.toFixed(1) + ' h'
    : onsetHours < 24 * 60
    ? (onsetHours / 24).toFixed(1) + ' d'
    : (onsetHours / 24 / 30).toFixed(1) + ' mo';

  let note = '=== STROKE SCREENER REFERRAL NOTE ===\n';
  note += 'Classification: ' + cls + '\n';
  note += 'Onset window: ' + onsetNoteLabel(onsetHours) + (Array.isArray(onsetRangeHours) ? ' (selected range; exact interval not recorded)' : ' (screened at ' + screenedAt + ')') + '\n';
  note += '--------------------------------------------------\n';

  const candidates = [...eligible, ...pending];
  if (candidates.length > 0) {
    note += 'POSSIBLE CANDIDATES (' + candidates.length + '):\n';
    candidates.forEach((item) => {
      note += ' - ' + item.trial.acronym + ' (' + (item.trial.externalMetadata.nct || 'No NCT') + ')\n';
      note += briefingSourceLine(item.trial);
      note += '   Pathway: ' + item.trial.pathway + '\n';
    });
  }
  for (const [label, items] of [
    ['BEFORE STUDY WINDOW', soon.filter(item => !item.notYetEnrolling)],
    ['NOT YET ENROLLING', soon.filter(item => item.notYetEnrolling)]
  ]) {
    if (!items.length) continue;
    note += label + ' (' + items.length + '):\n';
    items.forEach((item) => {
      note += ' - ' + item.trial.acronym + ' (' + (item.trial.externalMetadata.nct || 'No NCT') + ')\n';
      note += briefingSourceLine(item.trial);
      if (item.beforeWindow) note += '   Timing: before the modeled study window; eligibility remains unconfirmed.\n';
      note += '   Pathway: ' + item.trial.pathway + '\n';
    });
  }
  if (candidates.length === 0 && soon.length === 0) {
    note += 'No active study matches this classification and onset window.\n';
  }
  note += '--------------------------------------------------\n';
  note += 'First-pass ClinicalTrials.gov screen only. Confirm the full registry\n';
  note += 'record, the approved local protocol, activation status and consent\n';
  note += 'path before any clinical or recruitment action.\n';
  return note;
}

export default evaluateAll;
