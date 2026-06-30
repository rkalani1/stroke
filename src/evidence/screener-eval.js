// src/evidence/screener-eval.js
//
// Pure, DOM-free port of the standalone stroke-trials-screener eligibility
// engine. No React, no browser globals — fully unit-testable.
//
// COMPLIANCE: unverified studies (sourceCompletenessStatus !== 'complete', and
// status 'placeholder') are surfaced separately and never returned as
// 'eligible' — the engine forces a full registry/protocol confirmation step.

import { screenerTrials } from './screenerTrials.js';

/* ── Constants the UI also needs ───────────────────────────────────── */

export const ONSET_PRESETS = [
  { name: '< 4.5h', val: 2, unit: 'hours', desc: 'Hyperacute' },
  { name: '4.5 – 24h', val: 12, unit: 'hours', desc: 'Acute' },
  { name: '24h – 7d', val: 3, unit: 'days', desc: 'Early Subacute' },
  { name: '7 – 30d', val: 15, unit: 'days', desc: 'Subacute' },
  { name: '30 – 180d', val: 3, unit: 'months', desc: 'Late Subacute' },
  { name: '> 6mo', val: 8, unit: 'months', desc: 'Chronic' }
];

export const EXCLUSION_ITEMS = [
  { id: 'exThrombolysis', label: 'Prior Thrombolysis (tPA/TNK) for index stroke', classifications: ['ischemic'], trials: ['SISTER'] },
  { id: 'exEvt', label: 'Prior EVT with clot engagement', classifications: ['ischemic'], trials: ['SISTER'] },
  { id: 'exStroke90d', label: 'Known stroke in prior 90 days', classifications: ['ischemic'], trials: ['SISTER'] },
  { id: 'exMultipleTerritories', label: 'Acute occlusions in multiple vascular territories', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exTandem', label: 'Tandem occlusions (cervical + intracranial)', classifications: ['ischemic'], trials: ['STEP'] },
  { id: 'exTerminalIllness', label: 'Terminal illness or life expectancy < 2y', classifications: ['ischemic', 'ich'], trials: ['TESTED', 'SATURN'] },
  { id: 'exSecondaryIch', label: 'Suspected secondary cause for ICH (AVM, aneurysm, tumor, SAH)', classifications: ['ich'], trials: ['MINUTE', 'ASPIRE', 'SATURN'] },
  { id: 'exMidbrain', label: 'Midbrain extension or infratentorial/thalamic location', classifications: ['ich'], trials: ['MINUTE'] },
  { id: 'exPriorIch12m', label: 'Prior ICH in past 12 months', classifications: ['ich'], trials: ['ASPIRE'] },
  { id: 'exClearAnticoagulationIndication', label: 'Clear baseline indication for anticoagulation', classifications: ['ich'], trials: ['ASPIRE'] },
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
  { id: 'exPregnancy', label: 'Pregnancy', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3', 'MR-PICS', 'TELE-REHAB-2'] },
  { id: 'exIncarcerated', label: 'Patient is incarcerated (prisoner)', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exTrach', label: 'Mechanical ventilation, tracheostomy, or oxygen > 4 L/min', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exCpapUse14d', label: 'CPAP use within 14 days pre-CVA', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exSecondaryIchOrSah', label: 'Stroke related to tumor, malformation, or SAH', classifications: ['ischemic', 'ich'], trials: ['SCOUTS-3'] },
  { id: 'exPriorUeCondition', label: 'Prior upper extremity condition limiting use', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exLegallyBlind', label: 'Legally blind', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exDenseSensoryLoss', label: 'Dense sensory loss (NIHSS sensory score = 2)', classifications: ['ischemic'], trials: ['VERIFY'] },
  { id: 'exRecentStroke30d', label: 'Separate symptomatic stroke within prior 30 days', classifications: ['ischemic', 'ich'], trials: ['VERIFY', 'TELE-REHAB-2'] },
  { id: 'exSeizures', label: 'Seizures since stroke onset / history of epilepsy', classifications: ['ischemic', 'ich'], trials: ['VERIFY', 'MR-PICS'] },
  { id: 'exBotoxVns3m', label: 'Botulinum toxin to paretic arm within past 3 months or expected by 8-month visit', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exAnticoagulation', label: 'Currently taking anticoagulants', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exHistoryDvtPe', label: 'History of DVT or pulmonary emboli (PE)', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exRecurrentStroke', label: 'Recurrent stroke since the index stroke', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exLifeExpectancy9m', label: 'Life expectancy < 9 months', classifications: ['ischemic', 'ich'], trials: ['TELE-REHAB-2'] },
  { id: 'exCongestiveHeartFailure', label: 'Congestive Heart Failure (moderate/severe)', classifications: ['ischemic', 'tia'], trials: ['CLARITY'] },
  { id: 'exSevereAphasiaCognitive', label: 'Moderate-to-severe cognitive impairment, dementia, or severe aphasia', classifications: ['ischemic', 'ich'], trials: ['MR-PICS', 'CAPPRICORN-1'] },
  { id: 'exSevereSpasticity', label: 'Severe spasticity in target arm', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exArmInjury', label: 'Arm fracture or orthopedic injury', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exSevereClaustrophobia', label: 'Severe claustrophobia', classifications: ['ischemic'], trials: ['MR-PICS'] },
  { id: 'exEgfr30', label: 'eGFR < 30 ml/min/1.73m²', classifications: ['ich'], trials: ['CAPPRICORN-1'] }
];

const ALL_EXCLUSION_IDS = [
  'exThrombolysis', 'exEvt', 'exStroke90d', 'exMultipleTerritories', 'exTandem',
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
  'exRecentStroke30d', 'exSeizures', 'exSevereSpasticity', 'exArmInjury',
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

function evaluateCriterion(c, p) {
  if (c.operator === 'or') {
    return c.branches.some(b => b.criteria.every(cc => evaluateCriterion(cc, p)));
  }
  const val = p[c.field];
  const op = OPERATORS[c.operator];
  if (!op) return false;
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
    onsetVal: 2,
    onsetUnit: 'hours',
    age: 'unselected',
    nihss: 'unselected',
    aspects: 'unselected',
    gcs: 'unselected',
    preMrs: 'unselected',
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
  if (onsetUnit === 'hours') return onsetVal;
  if (onsetUnit === 'days') return onsetVal * 24;
  return onsetVal * 30 * 24;
}

export function buildScreenerParams(state) {
  const onsetHours = onsetToHours(state.onsetVal, state.onsetUnit);
  const onsetDays = onsetHours / 24.0;
  const onsetMonths = onsetDays / 30.0;

  const p = {
    classification: state.classification,
    onsetHours,
    onsetDays,
    onsetMonths,
    age: state.age,
    nihss: state.nihss,
    aspects: state.aspects,
    gcs: state.gcs,
    preMrs: state.preMrs,
    vessel: state.vessel,
    etiology: state.etiology,
    ichLocation: state.ichLocation,
    volume: state.volume,
    statin: state.statin,
    language: state.language === true ? 'english' : state.language === false ? 'other' : 'unselected',
    rehab: state.rehab === true ? 'yes' : state.rehab === false ? 'none' : 'unselected',
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
    p[id] = !!ex[id];
  });
  p.exMidbrain = !!ex.exMidbrain || state.ichLocation === 'thalamic' || state.ichLocation === 'infratentorial';

  return p;
}

export function evaluateTrialEligibility(trial, p) {
  if (trial.status === 'closed') {
    return { status: 'closed', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: ['Study is closed to enrollment'], sourceGaps: trial.sourceGaps || [] };
  }
  if (trial.status === 'placeholder') {
    return { status: 'placeholder', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: ['Incomplete study profile in source; screening not possible'], sourceGaps: trial.sourceGaps || [] };
  }

  const pessP = { ...p };
  const UNSELECTED_MAP = { age: 17, nihss: -1, aspects: -1, gcs: -1, preMrs: 6, vessel: 'none', etiology: 'none', ichLocation: 'none', volume: 'none', statin: false, afibHistory: false, takingOac: false, language: 'other', rehab: 'none', self_consent: false, availability_54w: false, exUeWeakness: false, unilateralSymptomatic: false, anteriorCirculation: false, presentedWithin24h: false, singleAntiplateletSoc: false };
  Object.keys(UNSELECTED_MAP).forEach(k => { if (pessP[k] === 'unselected') pessP[k] = UNSELECTED_MAP[k]; });

  const optP = { ...p };
  const OPT_DEFAULTS = { age: 65, nihss: 8, aspects: 8, gcs: 15, preMrs: 0, vessel: 'none', etiology: 'other', ichLocation: 'bg', volume: 'small', statin: false, afibHistory: false, takingOac: false, language: 'english', rehab: 'yes', self_consent: true, availability_54w: true, exUeWeakness: true, unilateralSymptomatic: true, anteriorCirculation: true, presentedWithin24h: true, singleAntiplateletSoc: true };
  const trialDefaults = trial.optimisticDefaults || {};
  Object.keys(OPT_DEFAULTS).forEach(k => { if (optP[k] === 'unselected') optP[k] = trialDefaults[k] !== undefined ? trialDefaults[k] : OPT_DEFAULTS[k]; });

  const optErrors = [];
  trial.eligibility.criteria.forEach(c => { if (!evaluateCriterion(c, optP)) optErrors.push(c.error); });
  trial.eligibility.exclusions.forEach(c => { if (evaluateCriterion(c, optP)) optErrors.push(c.error); });

  if (optErrors.length > 0) {
    return { status: 'excluded', matchedCriteria: [], pendingCriteria: [], pendingFields: [], exclusionReasons: optErrors, sourceGaps: trial.sourceGaps || [] };
  }

  const isSoon = trial.status === 'soon' || (trial.acronym === 'ASPIRE' && p.onsetDays < 14) || (trial.acronym === 'VERIFY' && p.onsetHours < 24) || (trial.acronym === 'TELE-REHAB-2' && p.onsetDays < 90);
  const requiresSourceConfirmation = !!trial.sourceCompletenessStatus && trial.sourceCompletenessStatus !== 'complete';

  const pendingFields = [];
  const fieldsToTest = [
    { key: 'age', label: 'Age' }, { key: 'nihss', label: 'NIHSS Score' }, { key: 'aspects', label: 'ASPECTS Score' }, { key: 'gcs', label: 'GCS Score' }, { key: 'preMrs', label: 'mRS / functional status' }, { key: 'vessel', label: 'Vessel status' }, { key: 'etiology', label: 'Stroke Subtype' }, { key: 'ichLocation', label: 'Hemorrhage Location' }, { key: 'volume', label: 'Hematoma Volume' }, { key: 'statin', label: 'Statin at onset' }, { key: 'afibHistory', label: 'Atrial Fibrillation history' }, { key: 'takingOac', label: 'Anticoagulation status' }, { key: 'language', label: 'Language spoken' }, { key: 'rehab', label: 'Rehab unit placement' }, { key: 'self_consent', label: 'Patient able to self-consent' }, { key: 'availability_54w', label: '54-week visits availability' }, { key: 'exUeWeakness', label: 'Upper extremity weakness' }, { key: 'unilateralSymptomatic', label: 'Unilateral symptomatic AIS' }, { key: 'anteriorCirculation', label: 'Anterior circulation' }, { key: 'presentedWithin24h', label: 'Presented within 24h' }, { key: 'singleAntiplateletSoc', label: 'Single antiplatelet SOC' }
  ];

  fieldsToTest.forEach((f) => {
    if (p[f.key] === 'unselected') {
      const testP = { ...optP };
      testP[f.key] = pessP[f.key];
      const hasFailure = trial.eligibility.criteria.some(c => !evaluateCriterion(c, testP)) || trial.eligibility.exclusions.some(c => evaluateCriterion(c, testP));
      if (hasFailure) pendingFields.push(f.label);
    }
  });

  if (requiresSourceConfirmation) pendingFields.push('Full registry/protocol confirmation');

  const matchedCriteria = [];
  trial.eligibility.criteria.forEach(c => {
    if (evaluateCriterion(c, p)) {
      const label = c.operator === 'or' ? getActiveBranch(c, p)?.label : formatLabel(c.matchedLabel, p, c.field);
      if (label) matchedCriteria.push(label);
    }
  });

  const pendingCriteria = [];
  trial.eligibility.criteria.forEach(c => {
    if (p[c.field] === 'unselected' || (c.operator === 'or' && c.branches.some(b => b.criteria.some(cc => p[cc.field] === 'unselected')))) {
      if (c.pendingLabel) pendingCriteria.push(c.pendingLabel);
    }
  });
  trial.eligibility.exclusions.forEach(c => {
    if (p[c.field] === 'unselected' && c.pendingLabel) pendingCriteria.push(c.pendingLabel);
  });
  (trial.eligibility.manualPending || []).forEach(m => pendingCriteria.push(m));

  if (requiresSourceConfirmation) {
    pendingCriteria.push('Confirm the full ClinicalTrials.gov record, approved local protocol, activation status, consent path, and study-owner instructions before any clinical or recruitment action');
  }

  const finalStatus = (pendingFields.length > 0 || trial.eligibility.criteria.some(c => !evaluateCriterion(c, pessP)) || trial.eligibility.exclusions.some(c => evaluateCriterion(c, pessP)))
    ? (isSoon ? 'soon' : 'pending')
    : (isSoon ? 'soon' : 'eligible');

  return {
    status: finalStatus,
    matchedCriteria,
    pendingCriteria,
    pendingFields,
    exclusionReasons: [],
    sourceGaps: trial.sourceGaps || []
  };
}

export function isTrialPotentiallyActive(trial, p) {
  if (trial.status === 'closed' || trial.status === 'placeholder') return false;
  const res = evaluateTrialEligibility(trial, p);
  return res.status !== 'excluded';
}

export function patientTimeCategory(onsetDays) {
  if (onsetDays <= 1) return 'hyperacute';
  if (onsetDays > 1 && onsetDays <= 30) return 'acute_subacute';
  return 'subacute_chronic';
}

export function getTimeSortingScore(trialCategory, patientCategory) {
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
  const ready = !!state.classification && state.classification !== 'unselected' && state.classification !== '';
  const params = buildScreenerParams(state);
  const buckets = { eligible: [], pending: [], soon: [], excluded: [], closed: [], incomplete: [] };

  if (ready) {
    trials.forEach((trial) => {
      const r = evaluateTrialEligibility(trial, params);
      const item = { trial, status: r.status, matchedCriteria: r.matchedCriteria, pendingCriteria: r.pendingCriteria, pendingFields: r.pendingFields || [], exclusionReasons: r.exclusionReasons || [], sourceGaps: r.sourceGaps || [] };
      if (r.status === 'placeholder') buckets.incomplete.push(item);
      else buckets[r.status].push(item);
    });
  }

  const timeCategory = patientTimeCategory(params.onsetDays);
  Object.keys(buckets).forEach(k => sortListByTime(buckets[k], timeCategory));

  return { ready, params, timeCategory, ...buckets, briefingNote: ready ? buildBriefingNote(state, buckets) : '' };
}

export function buildBriefingNote(state, buckets) {
  const { eligible, pending, soon } = buckets;
  const cls = (state.classification || 'unselected').toUpperCase();
  let note = '=== STROKE SCREENER REFERRAL NOTE ===\n';
  note += 'Classification: ' + cls + ' | Onset: ' + state.onsetVal + ' ' + state.onsetUnit + ' (LKW)\n';
  note += 'Age: ' + state.age + ' | NIHSS: ' + state.nihss + ' | mRS: ' + state.preMrs + '\n';
  note += '--------------------------------------------------\n';

  if (eligible.length > 0) {
    note += '🟢 REFERRAL CANDIDATES:\n';
    eligible.forEach((item) => {
      note += ' - ' + item.trial.acronym + ' (' + (item.trial.externalMetadata.nct || 'No NCT') + ')\n';
      note += '   Pathway: ' + item.trial.pathway + '\n';
    });
  }
  if (pending.length > 0) {
    note += '🟡 POSSIBLE CANDIDATES (PENDING INPUTS):\n';
    pending.forEach((item) => {
      note += ' - ' + item.trial.acronym + ' (' + (item.trial.externalMetadata.nct || 'No NCT') + ')\n';
      note += '   Pending fields: ' + item.pendingFields.join(', ') + '\n';
    });
  }
  if (soon.length > 0) {
    note += '⏳ ENROLLING SOON / FUTURE MATCH:\n';
    soon.forEach((item) => {
      note += ' - ' + item.trial.acronym + ' (' + (item.trial.externalMetadata.nct || 'No NCT') + ')\n';
      note += '   Pathway: ' + item.trial.pathway + '\n';
    });
  }
  if (eligible.length === 0 && pending.length === 0 && soon.length === 0) {
    note += '❌ No active study matches found for current patient parameters.\n';
  }
  return note;
}

export default evaluateAll;
