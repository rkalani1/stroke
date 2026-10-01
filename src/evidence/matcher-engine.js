// src/evidence/matcher-engine.js
//
// Generic matcher engine for the StrokeOps v6 Evidence Atlas active-trial
// matcherCriteria arrays. Promotes the declarative criteria from
// "documentation mirror" to "executable specification" so that future
// retirement of the inline TRIAL_ELIGIBILITY_CONFIG is concrete and
// testable.
//
// The encounter UI now uses evaluateAllTrialsViaEngine unconditionally;
// the former inline evaluators have been retired. These partial summaries
// never certify eligibility. A complete modeled match remains needs_info
// until the study team verifies the current protocol and local requirements.
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
import { MATCHABLE_TRIAL_STATUS_VALUES } from './schema.js';
import { recordedTreatmentDecision } from '../encounter-decision-status.js';

// Validate clinical domains before a comparison. A parseable but impossible
// score is missing information, not evidence that a study criterion is met.
const numericDomains = {
  age: [0, Infinity, false], hoursFromLKW: [0, Infinity, false],
  nihss: [0, 42, true], premorbidMRS: [0, 6, true],
  mrsAtConsent: [0, 6, true], mrsScore: [0, 6, true],
  aspectsScore: [0, 10, true], mriAspectsScore: [0, 10, true]
};
function validNumericField(field, value) {
  const [lo, hi, integer] = numericDomains[field];
  const n = tryInt(value);
  return n !== null && n >= lo && n <= hi && (!integer || Number.isInteger(n));
}
function recordedVessels(data) {
  const vessels = data?.telestrokeNote?.vesselOcclusion;
  const allowed = ['ICA', 'M1', 'M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3', 'Basilar', 'None'];
  if (!Array.isArray(vessels) || !vessels.length ||
      vessels.some(v => !allowed.includes(v)) ||
      (vessels.includes('None') && vessels.length > 1)) return null;
  return vessels;
}
function consistentRecordedValue(top, note, numericValue = false) {
  const normalize = numericValue ? tryInt : value => value;
  if (top != null && note != null && normalize(top) !== normalize(note)) return null;
  return top ?? note ?? null;
}

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
  presentedWithin24h: (d) => d?.presentedWithin24h,
  mrsAtConsent: (d) => d?.mrsAtConsent ?? d?.mRSAtConsent,
  mostAnticoagulantExclusion: (d) => d?.mostAnticoagulantExclusion,
  vesselOcclusion: recordedVessels,
  ctaResults: (d) => d?.telestrokeNote?.ctaResults || d?.strokeCodeForm?.cta || '',
  ctpResults: (d) => d?.telestrokeNote?.ctpResults || '',
  diagnosisCategory: (d) => ['ischemic', 'tia', 'ich', 'sah', 'cvt', 'mimic'].includes(d?.telestrokeNote?.diagnosisCategory) ? d.telestrokeNote.diagnosisCategory : null,
  acuteIschemicStroke: (d) => {
    // Encounter's "ischemic" category also includes TIA. It cannot by itself
    // establish the qualifying acute ischemic presentation for a trial.
    const category = d?.telestrokeNote?.diagnosisCategory;
    const top = d?.acuteIschemicStroke;
    const note = d?.telestrokeNote?.acuteIschemicStroke;
    if (top != null && note != null && top !== note) return null;
    const documented = consistentRecordedValue(top, note);
    if (['tia', 'ich', 'sah', 'cvt', 'mimic'].includes(category)) return documented === true ? null : false;
    return typeof documented === 'boolean' ? documented : null;
  },
  symptoms: (d) => d?.telestrokeNote?.symptoms || '',
  upperExtremityWeakness: (d) => consistentRecordedValue(d?.upperExtremityWeakness, d?.telestrokeNote?.upperExtremityWeakness),
  pmh: (d) => d?.telestrokeNote?.pmh || '',
  ichLocation: (d) => {
    const value = typeof d?.ichLocation === 'string' ? d.ichLocation.trim().toLowerCase() : '';
    return ['lobar', 'cortical', 'deep', 'nonlobar', 'non-lobar', 'bg', 'thalamic', 'cerebellar', 'brainstem', 'infratentorial'].includes(value) ? value : null;
  },
  onStatin: (d) => d?.onStatin,
  mrsScore: (d) => d?.mrsScore,
  tnkRecommended: (d) => recordedTreatmentDecision(d?.telestrokeNote || {}, 'tnk'),
  evtRecommended: (d) => recordedTreatmentDecision(d?.telestrokeNote || {}, 'evt'),
  // Exclusion-only fields. The legacy default evaluator was
  // `data[field] === true`, so all of these resolve as top-level
  // booleans on the data envelope.
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
  // Only a recognized medication or explicit "none" establishes this fact.
  lastDOACType: (d) => {
    const value = d?.telestrokeNote?.lastDOACType;
    if (value === 'none') return false;
    return ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'heparin', 'lmwh', 'fondaparinux'].includes(value) ? true : null;
  },
  // 'reperfusion' is a derived predicate: true if the encounter notes
  // recorded EITHER tnkRecommended OR evtRecommended. Derived fields are
  // legitimate extensions of the field vocabulary and are documented in
  // docs/evidence-atlas-extension-guide.md.
  reperfusion: (d) => {
    // A positive decision establishes a plan; both explicitly negative
    // decisions establish no plan. Any other combination remains unknown.
    // This proxy does not itself confirm that treatment was administered.
    const tnk = recordedTreatmentDecision(d?.telestrokeNote || {}, 'tnk');
    const evt = recordedTreatmentDecision(d?.telestrokeNote || {}, 'evt');
    if (tnk === true || evt === true) return true;
    if (tnk === false && evt === false) return false;
    return null;
  },
  // 'nihssDisabling' matches NIHSS ≥6, or NIHSS 4-5 paired
  // with a recorded disabling-deficit flag. Returns null (unknown) when neither
  // NIHSS nor the disabling flag is recorded so trials surface as needs_info on
  // a fresh form rather than silently not_eligible.
  nihssDisabling: (d) => {
    if (!validNumericField('nihss', nihssOf(d))) return null;
    const n = tryInt(nihssOf(d));
    const disabling = d?.telestrokeNote?.disablingDeficit;
    if (n === null && disabling === undefined) return null;
    if (n !== null && n >= 6) return true;
    if (n !== null && n >= 4 && n <= 5 && disabling === true) return true;
    if (n !== null && n < 4) return false;
    if (n === null) return null;
    return typeof disabling === 'boolean' ? disabling : null;
  },
  // 'domainMatch' is a STEP-EVT-specific derived field combining NIHSS
  // and vessel-occlusion. The engine resolves it to one of the labeled
  // domains so the criterion's `in` operator can match.
  domainMatch: (d) => {
    if (!validNumericField('nihss', nihssOf(d))) return null;
    const nihss = tryInt(nihssOf(d));
    const occlusion = recordedVessels(d);
    // Needs-info when EITHER input is un-entered: a fresh form must surface
    // as needs_info, not flip to a definite 'none'/not-eligible.
    if (nihss === null || !occlusion) return null;
    // Dominance belongs to the culprit M2, not arbitrary CTA prose.
    if (nihss >= 8 && occlusion.includes('M3')) return 'mevo';
    if (nihss >= 8 && occlusion.includes('M2')) {
      if (d?.culpritM2Dominance != null && d?.telestrokeNote?.culpritM2Dominance != null &&
          d.culpritM2Dominance !== d.telestrokeNote.culpritM2Dominance) return null;
      const dominance = d?.culpritM2Dominance ?? d?.telestrokeNote?.culpritM2Dominance;
      if (['non-dominant', 'co-dominant'].includes(dominance)) return 'mevo';
      if (dominance !== 'dominant') return null;
    }
    if (nihss <= 5 && (occlusion.includes('ICA') || occlusion.includes('M1'))) {
      return 'low-nihss-lvo';
    }
    return 'none';
  },
  testedVessel: (d) => {
    const vessels = recordedVessels(d);
    if (!vessels) return null;
    if (vessels.includes('ICA') || vessels.includes('M1')) return true;
    if (!vessels.includes('M2')) return false;
    const top = d?.culpritM2Dominance;
    const note = d?.telestrokeNote?.culpritM2Dominance;
    if (top != null && note != null && top !== note) return null;
    const dominance = top ?? note;
    if (dominance === 'dominant') return true;
    if (['non-dominant', 'co-dominant'].includes(dominance)) return false;
    return null;
  },
  // MRI availability is not an MRI-derived ASPECTS measurement. Never reuse
  // the generic/CT score for an MRI-specific exclusion.
  mriAspectsScore: (d) => consistentRecordedValue(d?.mriAspectsScore, d?.telestrokeNote?.mriAspectsScore, true)
};

export function resolveField(field, data) {
  const fn = fieldResolvers[field];
  if (!fn) return undefined;
  const value = fn(data);
  return numericDomains[field] && !validNumericField(field, value) ? null : value;
}

const KNOWN_FIELDS = new Set(Object.keys(fieldResolvers));

export function knownFields() {
  return KNOWN_FIELDS;
}

// ---------- Operator vocabulary ----------
//
// Every operator returns one of: true, false, or null (unknown).
// The criterion is met when true, not_met when false, unknown when null.
// This matches the legacy evaluator's tri-state output.

const numeric = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isPresentString = (v) => typeof v === 'string' && v.trim() !== '';

const operators = {
  '>=': (resolved, value) => {
    const n = numeric(resolved);
    return n === null ? null : n >= value;
  },
  '<=': (resolved, value) => {
    const n = numeric(resolved);
    return n === null ? null : n <= value;
  },
  '>': (resolved, value) => {
    const n = numeric(resolved);
    return n === null ? null : n > value;
  },
  '<': (resolved, value) => {
    const n = numeric(resolved);
    return n === null ? null : n < value;
  },
  '==': (resolved, value) => {
    if (typeof value === 'boolean') {
      // Boolean equality must distinguish "field absent" (null) from
      // "field is the other boolean" (false). E.g., a "no thrombolysis"
      // criterion needs tnkRecommended === false (a recorded decision
      // *not* to give TNK) and unknown when tnkRecommended is undefined.
      if (typeof resolved !== 'boolean') return null;
      return resolved === value;
    }
    if (typeof value === 'number') {
      const n = numeric(resolved);
      return n === null ? null : n === value;
    }
    if (resolved === undefined || resolved === null) return null;
    return resolved === value;
  },
  'between': (resolved, value) => {
    if (!Array.isArray(value) || value.length !== 2) return null;
    const n = numeric(resolved);
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
  // An unrecorded medication/exclusion is unknown, never documented absence.
  'truthy': (resolved) => typeof resolved === 'boolean' ? resolved : null,
  'present': (resolved, value) => {
    // 'present' checks whether the resolved value contains any of the
    // listed needles. Used for free-text fields like ctpResults
    // ('mismatch', 'penumbra'), or for array fields where any of a set
    // of options means the criterion is met.
    // NEGATION-AWARE for free text: "No intracranial stenosis" must not
    // satisfy a stenosis criterion. A needle whose every occurrence is
    // negated counts as a documented ABSENCE (false), not a match.
    if (!Array.isArray(value) || !value.length || value.some(v => typeof v !== 'string' || !v.trim())) return null;
    if (resolved === undefined || resolved === null) return null;
    if (Array.isArray(resolved)) {
      if (resolved.length === 0) return null;
      return resolved.some((v) => value.some((needle) => String(v).toLowerCase().includes(String(needle).toLowerCase())));
    }
    if (!isPresentString(resolved)) return null;
    const hay = String(resolved).toLowerCase();
    let sawNegative = false;
    let sawPositive = false;
    let sawUncertain = false;
    for (const needle of value) {
      const n = String(needle).toLowerCase();
      let idx = hay.indexOf(n);
      while (idx !== -1) {
        // Look back within the same clause for a negation cue.
        const before = hay.slice(0, idx);
        const contrast = [...before.matchAll(/\b(?:but|however|although)\b/g)].at(-1);
        const clauseStart = Math.max(0, Math.max(hay.lastIndexOf('.', idx), hay.lastIndexOf(';', idx), hay.lastIndexOf(',', idx)) + 1,
          contrast ? contrast.index + contrast[0].length : 0);
        const prefix = hay.slice(Math.max(clauseStart, idx - 40), idx);
        const suffix = hay.slice(idx + n.length).split(/[.;,]/, 1)[0].slice(0, 45);
        const uncertain = /\b(?:possible|probable|suspected|uncertain|questionable|query|rule out|cannot exclude|family history|mother|father)\b/.test(prefix) || /\?|\b(?:uncertain|unlikely|unconfirmed|not confirmed|cannot be excluded|not excluded)\b/.test(suffix);
        const negated = /(\bno\b|\bnot\b|\bwithout\b|\bnegative for\b|\bdenies\b|\bnon-?occlusive\b|\bruled out\b|\babsent\b)\s*[^.;,]*$/.test(prefix) || /^\s*(?:is\s+|was\s+)?(?:ruled out|absent|not\s+(?:seen|present|identified|visualized))\b/.test(suffix);
        if (uncertain) sawUncertain = true;
        else if (negated) sawNegative = true;
        else sawPositive = true;
        idx = hay.indexOf(n, idx + n.length);
      }
    }
    if (sawUncertain || (sawNegative && sawPositive)) return null;
    if (sawPositive) return true;
    if (sawNegative) return false;
    // An unrelated history or report does not document absence.
    return null;
  }
};

const KNOWN_OPERATORS = new Set(Object.keys(operators));
const MATCHABLE_TRIAL_STATUS_SET = new Set(MATCHABLE_TRIAL_STATUS_VALUES);

export function knownOperators() {
  return KNOWN_OPERATORS;
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
    const operand = criterion.operator === 'present' && criterion.field === 'ichLocation' && typeof resolved === 'string' && resolved.trim()
      ? [resolved] : resolved;
    const result = operators[criterion.operator](operand, criterion.value);
    if (result === true) return 'met';
    if (result === false) return 'not_met';
    return 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Evaluate every criterion on a single active trial and return a result
 * shape that retains the legacy UI contract. Internal status semantics:
 *   - 'needs_info'  — no modeled failure; full protocol review still required
 *   - 'inactive'    — trial status does not permit current matching
 *   - 'not_eligible'— at least one required criterion not_met
 *   - 'pending'     — no criteria yet
 */
export function evaluateActiveTrial(activeTrial, data) {
  if (!activeTrial) return null;
  if (!MATCHABLE_TRIAL_STATUS_SET.has(activeTrial.status)) {
    return { trialId: activeTrial.id, legacyMatcherKey: activeTrial.legacyMatcherKey, shortName: activeTrial.shortName, criteria: [], exclusions: [], unknownExclusions: [], counts: { met: 0, not_met: 0, unknown: 0 }, status: 'inactive', fullProtocolReviewRequired: true };
  }
  const rawCriteria = activeTrial.matcherCriteria;
  const criteriaLen = rawCriteria ? rawCriteria.length : 0;
  const criteria = new Array(criteriaLen);
  const counts = { met: 0, not_met: 0, unknown: 0 };

  for (let i = 0; i < criteriaLen; i++) {
    const c = rawCriteria[i];
    const status = evaluateCriterion(c, data);
    counts[status] += 1;
    criteria[i] = {
      id: c.field || `criterion-${i}`,
      label: c.label || c.field,
      field: c.field,
      operator: c.operator,
      required: true, // matcherCriteria entries are required by default
      status
    };
  }

  // Exclusions — inverse semantics. A criterion that evaluates to met
  // means the exclusion is *triggered*, which forces overall status to
  // not_eligible. Unknown exclusions remain explicitly unresolved;
  // only not_met records an exclusion as absent.
  const exclusions = [];
  const unknownExclusions = [];
  const rawExclusions = activeTrial.matcherExclusions;
  if (rawExclusions) {
    for (let i = 0; i < rawExclusions.length; i++) {
      const x = rawExclusions[i];
      const r = evaluateCriterion(x, data);
      if (r === 'unknown') unknownExclusions.push({ id: x.id || x.field, label: x.label || x.field, field: x.field });
      if (r === 'met') {
        exclusions.push({
          id: x.id || x.field,
          label: x.label || x.field,
          field: x.field,
          triggered: true
        });
      }
    }
  }

  let status = 'pending';
  if (criteriaLen === 0 && exclusions.length === 0) status = 'pending';
  else if (exclusions.length > 0) status = 'not_eligible';
  else if (counts.not_met > 0) status = 'not_eligible';
  else if (counts.unknown > 0 || unknownExclusions.length > 0) status = 'needs_info';
  else status = 'needs_info'; // Partial registry summaries never certify full eligibility.

  return {
    trialId: activeTrial.id,
    legacyMatcherKey: activeTrial.legacyMatcherKey,
    shortName: activeTrial.shortName,
    criteria,
    exclusions,
    unknownExclusions,
    fullProtocolReviewRequired: true,
    counts,
    status
  };
}

/**
 * Drop-in replacement for the legacy evaluateAllTrials. Returns a map
 * keyed by the legacy matcher key (e.g. 'STEP', 'TESTED') so the UI
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
  if (!activeTrialsList) return out;
  for (let i = 0; i < activeTrialsList.length; i++) {
    const aTrial = activeTrialsList[i];
    if (!aTrial) continue;
    // Status gate: a trial that is not actively enrolling (completed,
    // withdrawn, terminated, suspended, active-not-recruiting) must never be
    // matched against a live patient or written into a clinical note.
    if (!MATCHABLE_TRIAL_STATUS_SET.has(aTrial.status)) continue;
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
      exclusions: eng.exclusions.map((x) => ({
        id: x.id,
        label: x.label,
        triggered: true
      })),
      status: eng.status,
      screeningLabel: eng.status === 'eligible' ? 'Possible candidate' : eng.status === 'needs_info' ? 'Needs information' : 'Screen criteria not met',
      screeningNote: 'Full protocol review required; confirm all inclusion and exclusion criteria, local activation, and consent with the study team.',
      fullProtocolReviewRequired: true,
      metCount: eng.counts.met,
      notMetCount: eng.counts.not_met,
      unknownCount: eng.counts.unknown + eng.unknownExclusions.length,
      unknownExclusions: eng.unknownExclusions,
      requiredMissing: eng.criteria.filter((c) => c.required && c.status === 'unknown').length + eng.unknownExclusions.length
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
  const fields = KNOWN_FIELDS;
  const ops = KNOWN_OPERATORS;
  let total = 0;
  let covered = 0;
  let exclusionsTotal = 0;
  let exclusionsCovered = 0;
  const gaps = [];

  if (activeTrials) {
    for (let i = 0; i < activeTrials.length; i++) {
      const t = activeTrials[i];
      if (!t) continue;

      const criteria = t.matcherCriteria;
      if (criteria) {
        for (let j = 0; j < criteria.length; j++) {
          const c = criteria[j];
          total += 1;
          const fieldKnown = fields.has(c.field);
          const opKnown = ops.has(c.operator);
          if (fieldKnown && opKnown) covered += 1;
          else gaps.push(`${t.id}/criterion/${c.field}/${c.operator}${fieldKnown ? '' : ' (unknown field)'}${opKnown ? '' : ' (unknown operator)'}`);
        }
      }

      const exclusions = t.matcherExclusions;
      if (exclusions) {
        for (let j = 0; j < exclusions.length; j++) {
          const x = exclusions[j];
          exclusionsTotal += 1;
          const fieldKnown = fields.has(x.field);
          const opKnown = ops.has(x.operator);
          if (fieldKnown && opKnown) exclusionsCovered += 1;
          else gaps.push(`${t.id}/exclusion/${x.field}/${x.operator}${fieldKnown ? '' : ' (unknown field)'}${opKnown ? '' : ' (unknown operator)'}`);
        }
      }
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
