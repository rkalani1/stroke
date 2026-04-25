// src/evidence/matcher-engine.js
//
// Generic matcher engine for the StrokeOps v6 Evidence Atlas active-trial
// matcherCriteria arrays. Promotes the declarative criteria from
// "documentation mirror" to "executable specification" so that future
// retirement of the inline TRIAL_ELIGIBILITY_CONFIG is concrete and
// testable.
//
// Sprint posture: parallel-verification only. The live matcher in
// src/app.jsx still reads from TRIAL_ELIGIBILITY_CONFIG; the engine runs
// alongside (when the localStorage flag `strokeApp:matcherEngineCheck`
// is set) and logs disagreements. After accumulated parity evidence,
// the user can flip the canonical source in a follow-up sprint.
//
// Pure ES module; no React, no DOM, no React-state hooks. Imports only
// the field-pick helpers that already exist in matcher-helpers.js and
// the activeTrials data. Usable from Node (validator coverage metric)
// and the browser (parallel verification).

import {
  tryInt,
  pickEncounterField,
  ageOf,
  nihssOf,
  premorbidOf
} from './matcher-helpers.js';

// ---------- Field resolver ----------
//
// Each criterion's `field` string is mapped to a function that pulls a
// value out of the encounter `data` envelope produced by app.jsx in the
// trial-eligibility useEffect. New fields are added here; the engine is
// extended in one place rather than per-criterion.

const fieldResolvers = {
  age: (d) => ageOf(d),
  nihss: (d) => nihssOf(d),
  premorbidMRS: (d) => premorbidOf(d),
  aspectsScore: (d) => d?.aspectsScore,
  hoursFromLKW: (d) => d?.hoursFromLKW,
  vesselOcclusion: (d) => d?.telestrokeNote?.vesselOcclusion || [],
  ctaResults: (d) => d?.telestrokeNote?.ctaResults || d?.strokeCodeForm?.cta || '',
  ctpResults: (d) => d?.telestrokeNote?.ctpResults || '',
  diagnosisCategory: (d) => d?.telestrokeNote?.diagnosisCategory,
  symptoms: (d) => d?.telestrokeNote?.symptoms || '',
  pmh: (d) => d?.telestrokeNote?.pmh || '',
  ichLocation: (d) => d?.ichLocation || '',
  onStatin: (d) => d?.onStatin,
  mrsScore: (d) => d?.mrsScore,
  tnkRecommended: (d) => d?.telestrokeNote?.tnkRecommended,
  evtRecommended: (d) => d?.telestrokeNote?.evtRecommended,
  // Exclusion-only fields. The legacy default evaluator was
  // `data[field] === true`, so all of these resolve as top-level
  // booleans on the data envelope.
  priorStroke90d: (d) => d?.priorStroke90d,
  priorICH: (d) => d?.priorICH,
  pregnancy: (d) => d?.pregnancy,
  hemorrhage: (d) => d?.hemorrhage,
  mechValve: (d) => d?.mechValve,
  seizures: (d) => d?.seizures,
  implants: (d) => d?.implants,
  preDementia: (d) => d?.preDementia,
  cardioembolic: (d) => d?.cardioembolic,
  onAnticoag: (d) => d?.onAnticoag,
  recentMI: (d) => d?.recentMI,
  // SISTER's onAnticoag (custom legacy evaluator) checks
  // !!data.telestrokeNote?.lastDOACType (truthy on a string).
  lastDOACType: (d) => d?.telestrokeNote?.lastDOACType,
  // 'reperfusion' is a derived predicate: true if the encounter notes
  // recorded EITHER tnkRecommended OR evtRecommended. Derived fields are
  // legitimate extensions of the field vocabulary and are documented in
  // docs/evidence-atlas-extension-guide.md.
  reperfusion: (d) => {
    // When both decisions are undefined the encounter form has
    // recorded neither TNK nor EVT yet; treat as unknown rather than
    // false so trials with reperfusion == true criteria (e.g. RHAPSODY)
    // surface as needs_info on a fresh form, not not_eligible.
    const tnk = d?.telestrokeNote?.tnkRecommended;
    const evt = d?.telestrokeNote?.evtRecommended;
    if (tnk === undefined && evt === undefined) return null;
    return tnk === true || evt === true;
  },
  // 'domainMatch' is a STEP-EVT-specific derived field combining NIHSS
  // and vessel-occlusion. The engine resolves it to one of the labeled
  // domains so the criterion's `in` operator can match.
  domainMatch: (d) => {
    const nihss = tryInt(nihssOf(d));
    const occlusion = d?.telestrokeNote?.vesselOcclusion || [];
    const mevoMatch = occlusion.some((v) =>
      ['M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3'].includes(v)
    );
    if (mevoMatch) return 'mevo';
    if (nihss !== null && nihss <= 5 && (occlusion.includes('ICA') || occlusion.includes('M1'))) {
      return 'low-nihss-lvo';
    }
    if (nihss === null && occlusion.length === 0) return null;
    return 'none';
  }
};

export function resolveField(field, data) {
  const fn = fieldResolvers[field];
  if (!fn) return undefined;
  return fn(data);
}

export function knownFields() {
  return new Set(Object.keys(fieldResolvers));
}

// ---------- Operator vocabulary ----------
//
// Every operator returns one of: true, false, or null (unknown).
// The criterion is met when true, not_met when false, unknown when null.
// This matches the legacy evaluator's tri-state output.

const isMissing = (v) => v === undefined || v === null || v === '';

const isPresentString = (v) => typeof v === 'string' && v.trim() !== '';

const operators = {
  '>=': (resolved, value) => {
    const n = tryInt(resolved);
    return n === null ? null : n >= value;
  },
  '<=': (resolved, value) => {
    const n = tryInt(resolved);
    return n === null ? null : n <= value;
  },
  '>': (resolved, value) => {
    const n = tryInt(resolved);
    return n === null ? null : n > value;
  },
  '<': (resolved, value) => {
    const n = tryInt(resolved);
    return n === null ? null : n < value;
  },
  '==': (resolved, value) => {
    if (typeof value === 'boolean') {
      // Boolean equality must distinguish "field absent" (null) from
      // "field is the other boolean" (false). E.g., SISTER's noTNK
      // criterion needs tnkRecommended === false (a recorded decision
      // *not* to give TNK) and unknown when tnkRecommended is undefined.
      if (resolved === undefined || resolved === null) return null;
      return resolved === value;
    }
    if (typeof value === 'number') {
      const n = tryInt(resolved);
      return n === null ? null : n === value;
    }
    if (resolved === undefined || resolved === null) return null;
    return resolved === value;
  },
  'between': (resolved, value) => {
    if (!Array.isArray(value) || value.length !== 2) return null;
    const n = tryInt(resolved);
    if (n === null) return null;
    const [lo, hi] = value;
    return n >= lo && n <= hi;
  },
  'in': (resolved, value) => {
    if (!Array.isArray(value)) return null;
    if (Array.isArray(resolved)) {
      // Array-vs-set check: at least one resolved element appears in value.
      if (resolved.length === 0) return null;
      return resolved.some((v) => value.includes(v));
    }
    if (resolved === undefined || resolved === null || resolved === '') return null;
    return value.includes(resolved);
  },
  // 'truthy' — JS-truthy match. Used for exclusion criteria like
  // SISTER's onAnticoag which fires on !!data.telestrokeNote?.lastDOACType
  // (a non-empty string is truthy; undefined / null / '' are falsy).
  // For exclusion semantics: returns true when resolved is truthy,
  // false when resolved is undefined / null / '' / 0 / false.
  // Never returns null — the absence of the field means "not on this
  // drug", which is a definite false, not an unknown.
  'truthy': (resolved /* , value */) => {
    if (resolved === undefined || resolved === null) return false;
    if (typeof resolved === 'string' && resolved.trim() === '') return false;
    return Boolean(resolved);
  },
  'present': (resolved, value) => {
    // 'present' checks whether the resolved value contains any of the
    // listed needles. Used for free-text fields like ctpResults
    // ('mismatch', 'penumbra'), or for array fields where any of a set
    // of options means the criterion is met.
    if (!Array.isArray(value)) return null;
    if (resolved === undefined || resolved === null) return null;
    if (Array.isArray(resolved)) {
      if (resolved.length === 0) return null;
      return resolved.some((v) => value.some((needle) => String(v).toLowerCase().includes(String(needle).toLowerCase())));
    }
    if (!isPresentString(resolved)) return null;
    const hay = String(resolved).toLowerCase();
    return value.some((needle) => hay.includes(String(needle).toLowerCase()));
  }
};

export function knownOperators() {
  return new Set(Object.keys(operators));
}

// ---------- Public API ----------

/**
 * Evaluate one criterion against the encounter data envelope.
 * Returns one of 'met' | 'not_met' | 'unknown'.
 */
export function evaluateCriterion(criterion, data) {
  if (!criterion || !operators[criterion.operator] || !fieldResolvers[criterion.field]) {
    return 'unknown';
  }
  try {
    const resolved = resolveField(criterion.field, data);
    const result = operators[criterion.operator](resolved, criterion.value);
    if (result === true) return 'met';
    if (result === false) return 'not_met';
    return 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Evaluate every criterion on a single active trial and return a result
 * shape that mirrors the legacy `evaluateTrialEligibility` output for
 * the parallel-verification path. Status semantics:
 *   - 'eligible'    — every required criterion met
 *   - 'needs_info'  — at least one required criterion unknown, none not_met
 *   - 'not_eligible'— at least one required criterion not_met
 *   - 'pending'     — no criteria yet
 */
export function evaluateActiveTrial(activeTrial, data) {
  if (!activeTrial) return null;
  const criteria = (activeTrial.matcherCriteria || []).map((c, idx) => ({
    id: c.field || `criterion-${idx}`,
    label: c.label || c.field,
    field: c.field,
    operator: c.operator,
    required: true, // matcherCriteria entries are required by default
    status: evaluateCriterion(c, data)
  }));

  // Exclusions — inverse semantics. A criterion that evaluates to met
  // means the exclusion is *triggered*, which forces overall status to
  // not_eligible. unknown/not_met means the exclusion is not triggered.
  const exclusions = [];
  for (const x of activeTrial.matcherExclusions || []) {
    const r = evaluateCriterion(x, data);
    if (r === 'met') {
      exclusions.push({
        id: x.id || x.field,
        label: x.label || x.field,
        field: x.field,
        triggered: true
      });
    }
  }

  const counts = { met: 0, not_met: 0, unknown: 0 };
  for (const c of criteria) counts[c.status] += 1;

  let status = 'pending';
  if (criteria.length === 0 && exclusions.length === 0) status = 'pending';
  else if (exclusions.length > 0) status = 'not_eligible';
  else if (counts.not_met > 0) status = 'not_eligible';
  else if (counts.unknown > 0) status = 'needs_info';
  else status = 'eligible';

  return {
    trialId: activeTrial.id,
    legacyMatcherKey: activeTrial.legacyMatcherKey,
    shortName: activeTrial.shortName,
    criteria,
    exclusions,
    counts,
    status
  };
}

/**
 * Drop-in replacement for the legacy evaluateAllTrials. Returns a map
 * keyed by the legacy matcher key (e.g. 'SISTER', 'STEP') so the UI
 * code that consumes it doesn't need to change.
 *
 * Output shape per trial mirrors evaluateTrialEligibility's: trialId,
 * trialName, category, quickDescription, lookingFor, keyTakeaways,
 * nct, criteria[], exclusions[], status, metCount, notMetCount,
 * unknownCount, requiredMissing.
 *
 * The exclusions array is empty in this engine output — the engine
 * doesn't yet model exclusionFlags. That's a follow-up; for parity the
 * legacy continues to drive exclusion-only not_eligible cases.
 *
 * Inputs:
 *   activeTrials: the structured atlas active-trial array
 *   data:         the encounter envelope (telestrokeNote, etc.)
 *   labelMap:     optional per-trial { [field]: legacyId } to remap
 *                 criterion ids so existing UI css / behavior matches
 *                 (e.g., timeWindow vs hoursFromLKW). When omitted the
 *                 default DEFAULT_FIELD_TO_LEGACY map is used.
 */

const DEFAULT_FIELD_TO_LEGACY = {
  hoursFromLKW: 'timeWindow',
  tnkRecommended: 'noTNK',
  evtRecommended: 'noEVT',
  ctpResults: 'ctpMismatch',
  pmh: 'afib',
  ichLocation: 'lobarICH',
  onStatin: 'onStatin',
  mrsScore: 'mrs',
  domainMatch: 'domainMatch',
  reperfusion: 'reperfusion',
  aspectsScore: 'aspects',
  symptoms: 'ueWeakness'
};

const PER_TRIAL_OVERRIDES = {
  picasso: { ctaResults: 'tandemLesion' },
  captiva: { ctaResults: 'icas' },
  aspire: { diagnosisCategory: 'ichConfirmed' },
  discovery: { diagnosisCategory: 'strokeConfirmed' },
  tested: { vesselOcclusion: 'lvo' },
  most: { vesselOcclusion: 'lvo' }
};

function legacyIdFor(activeTrialId, field) {
  const overrides = PER_TRIAL_OVERRIDES[activeTrialId] || {};
  if (overrides[field]) return overrides[field];
  return DEFAULT_FIELD_TO_LEGACY[field] || field;
}

export function evaluateAllTrialsViaEngine(activeTrialsList, data) {
  const out = {};
  for (const aTrial of activeTrialsList || []) {
    const eng = evaluateActiveTrial(aTrial, data);
    if (!eng) continue;
    const legacyKey = aTrial.legacyMatcherKey || aTrial.id;
    out[legacyKey] = {
      trialId: legacyKey,
      trialName: aTrial.fullName || aTrial.shortName,
      category: aTrial.topic && aTrial.topic.includes('ich') ? 'ich' : 'ischemic',
      quickDescription: aTrial.briefDescription || '',
      lookingFor: aTrial.lookingFor || [],
      keyTakeaways: aTrial.keyTakeaways || [],
      nct: aTrial.nctId,
      criteria: eng.criteria.map((c) => ({
        id: legacyIdFor(aTrial.id, c.id),
        label: c.label,
        status: c.status,
        required: c.required
      })),
      exclusions: (eng.exclusions || []).map((x) => ({
        id: x.id,
        label: x.label,
        triggered: true
      })),
      status: eng.status,
      metCount: eng.counts.met,
      notMetCount: eng.counts.not_met,
      unknownCount: eng.counts.unknown,
      requiredMissing: eng.criteria.filter((c) => c.required && c.status === 'not_met').length
    };
  }
  return out;
}

/**
 * Coverage metric for the validator. Returns the count of criteria the
 * engine can fully evaluate (i.e., field is registered + operator is
 * registered). Used by scripts/evidence-validate.mjs to surface
 * retirement-readiness.
 */
export function coverageReport(activeTrials) {
  const fields = knownFields();
  const ops = knownOperators();
  let total = 0;
  let covered = 0;
  let exclusionsTotal = 0;
  let exclusionsCovered = 0;
  const gaps = [];
  for (const t of activeTrials) {
    for (const c of t.matcherCriteria || []) {
      total += 1;
      const fieldKnown = fields.has(c.field);
      const opKnown = ops.has(c.operator);
      if (fieldKnown && opKnown) covered += 1;
      else gaps.push(`${t.id}/criterion/${c.field}/${c.operator}${fieldKnown ? '' : ' (unknown field)'}${opKnown ? '' : ' (unknown operator)'}`);
    }
    for (const x of t.matcherExclusions || []) {
      exclusionsTotal += 1;
      const fieldKnown = fields.has(x.field);
      const opKnown = ops.has(x.operator);
      if (fieldKnown && opKnown) exclusionsCovered += 1;
      else gaps.push(`${t.id}/exclusion/${x.field}/${x.operator}${fieldKnown ? '' : ' (unknown field)'}${opKnown ? '' : ' (unknown operator)'}`);
    }
  }
  return {
    total, covered,
    exclusionsTotal, exclusionsCovered,
    gaps,
    percent: total === 0 ? 0 : Math.round((covered / total) * 100),
    exclusionsPercent: exclusionsTotal === 0 ? 0 : Math.round((exclusionsCovered / exclusionsTotal) * 100)
  };
}

/**
 * Compare engine output to a legacy evaluator output for a single trial.
 * Returns a list of disagreements suitable for console.warn or telemetry.
 *
 * Inputs:
 *   engineResult — from evaluateActiveTrial(...)
 *   legacyResult — { criteria: [{ id, status }], status } shape from
 *                  app.jsx evaluateTrialEligibility
 *
 * Disagreements are reported per-criterion id (matched on shared id /
 * field), plus an overall status disagreement.
 */
export function diffEvaluations(engineResult, legacyResult) {
  if (!engineResult || !legacyResult) return [];
  const diffs = [];
  // Index legacy criteria by best-matching id.
  const legacyById = new Map();
  for (const c of legacyResult.criteria || []) {
    legacyById.set(c.id, c);
  }
  for (const ec of engineResult.criteria) {
    // Engine criteria are keyed by field; legacy keys are typically the
    // same id. Try direct match first.
    const legacy = legacyById.get(ec.id);
    if (!legacy) continue; // criterion not in legacy → no comparison
    if (legacy.status !== ec.status) {
      diffs.push({
        kind: 'criterion',
        criterion: ec.id,
        legacyStatus: legacy.status,
        engineStatus: ec.status
      });
    }
  }
  if (engineResult.status !== legacyResult.status) {
    diffs.push({
      kind: 'overall',
      legacyStatus: legacyResult.status,
      engineStatus: engineResult.status
    });
  }
  return diffs;
}
