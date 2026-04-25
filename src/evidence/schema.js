// src/evidence/schema.js
//
// JSDoc-typed factory functions and validation helpers for every record type
// in the Evidence Atlas. The schema is the load-bearing artifact — both the
// runtime UI and the build-time validator (scripts/evidence-validate.mjs)
// import from here so a single change propagates.
//
// Pure ES module; no third-party dependencies; usable in Node and the browser.

/**
 * @typedef {'high'|'moderate'|'low'|'very-low'} Certainty
 * @typedef {'rct'|'meta-analysis'|'observational'|'guideline'|'consensus'} EvidenceType
 * @typedef {'recruiting'|'active-not-recruiting'|'enrolling-by-invitation'|'completed-pending-results'} ActiveTrialStatus
 * @typedef {'I'|'IIa'|'IIb'|'III-no-benefit'|'III-harm'} ClassOfRecommendation
 * @typedef {'A'|'B-R'|'B-NR'|'C-LD'|'C-EO'} LevelOfEvidence
 * @typedef {'inpatient'|'outpatient'|'pre-hospital'|'all'} RecommendationSetting
 *
 * @typedef {(
 *   |'verified-pubmed'
 *   |'verified-doi'
 *   |'verified-clinicaltrials-gov'
 *   |'verified-guideline'
 *   |'verified-rct'
 *   |'unverified-source-limited'
 *   |'todo-verify'
 *   |'disputed'
 * )} VerificationStatus
 */

export const CERTAINTY_VALUES = ['high', 'moderate', 'low', 'very-low'];
export const EVIDENCE_TYPE_VALUES = ['rct', 'meta-analysis', 'observational', 'guideline', 'consensus'];
export const ACTIVE_TRIAL_STATUS_VALUES = ['recruiting', 'active-not-recruiting', 'enrolling-by-invitation', 'completed-pending-results'];
export const CLASS_VALUES = ['I', 'IIa', 'IIb', 'III-no-benefit', 'III-harm'];
export const LOE_VALUES = ['A', 'B-R', 'B-NR', 'C-LD', 'C-EO'];
export const SETTING_VALUES = ['inpatient', 'outpatient', 'pre-hospital', 'all'];
export const VERIFICATION_VALUES = [
  'verified-pubmed',
  'verified-doi',
  'verified-clinicaltrials-gov',
  'verified-guideline',
  'verified-rct',
  'unverified-source-limited',
  'todo-verify',
  'disputed'
];

// Structural identifier patterns. Live verification is explicitly out of scope.
export const PMID_PATTERN = /^\d{7,9}$/;
export const DOI_PATTERN = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
export const NCT_PATTERN = /^NCT\d{8}$/;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_ID = /^[a-z0-9][a-z0-9-]*$/;

// Defensive deep-clone for factory output; the seed records remain immutable.
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

const arrOr = (v, fallback = []) => (Array.isArray(v) ? clone(v) : clone(fallback));
const strOr = (v, fallback = '') => (typeof v === 'string' ? v : fallback);

/**
 * Build a CompletedTrial record. Missing/invalid fields are filled with safe
 * defaults; callers should still pipe records through validateCompletedTrial
 * before publishing.
 *
 * @param {Partial<import('./types').CompletedTrial>} input
 * @returns {import('./types').CompletedTrial}
 */
export function makeCompletedTrial(input = {}) {
  return {
    id: strOr(input.id),
    shortName: strOr(input.shortName),
    fullName: strOr(input.fullName),
    topic: strOr(input.topic),
    diseaseArea: arrOr(input.diseaseArea),
    population: {
      n: Number.isFinite(input.population?.n) ? input.population.n : 0,
      ageRange: strOr(input.population?.ageRange),
      nihssRange: strOr(input.population?.nihssRange),
      timeWindow: strOr(input.population?.timeWindow),
      keyInclusion: arrOr(input.population?.keyInclusion),
      keyExclusion: arrOr(input.population?.keyExclusion)
    },
    intervention: strOr(input.intervention),
    comparator: strOr(input.comparator),
    primaryEndpoint: {
      definition: strOr(input.primaryEndpoint?.definition),
      timepoint: strOr(input.primaryEndpoint?.timepoint),
      result: strOr(input.primaryEndpoint?.result),
      effectSize: strOr(input.primaryEndpoint?.effectSize),
      confidenceInterval: strOr(input.primaryEndpoint?.confidenceInterval),
      pValue: strOr(input.primaryEndpoint?.pValue)
    },
    secondaryEndpoints: arrOr(input.secondaryEndpoints).map((e) => ({
      name: strOr(e?.name),
      result: strOr(e?.result)
    })),
    safetyFindings: {
      sich: strOr(input.safetyFindings?.sich),
      mortality: strOr(input.safetyFindings?.mortality),
      other: strOr(input.safetyFindings?.other)
    },
    imagingCriteria: strOr(input.imagingCriteria),
    applicabilityNotes: strOr(input.applicabilityNotes),
    limitations: strOr(input.limitations),
    certainty: CERTAINTY_VALUES.includes(input.certainty) ? input.certainty : 'moderate',
    evidenceType: EVIDENCE_TYPE_VALUES.includes(input.evidenceType) ? input.evidenceType : 'rct',
    citationIds: arrOr(input.citationIds),
    relatedActiveTrialIds: arrOr(input.relatedActiveTrialIds),
    practiceImpact: strOr(input.practiceImpact),
    lastReviewed: strOr(input.lastReviewed),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : 'todo-verify',
    verificationNotes: strOr(input.verificationNotes)
  };
}

/**
 * @param {Partial<import('./types').ActiveTrial>} input
 * @returns {import('./types').ActiveTrial}
 */
export function makeActiveTrial(input = {}) {
  return {
    id: strOr(input.id),
    shortName: strOr(input.shortName),
    fullName: strOr(input.fullName),
    nctId: strOr(input.nctId),
    phase: strOr(input.phase),
    status: ACTIVE_TRIAL_STATUS_VALUES.includes(input.status) ? input.status : 'recruiting',
    topic: strOr(input.topic),
    briefDescription: strOr(input.briefDescription),
    rationale: strOr(input.rationale),
    inclusionCriteria: arrOr(input.inclusionCriteria),
    exclusionCriteria: arrOr(input.exclusionCriteria),
    matcherCriteria: arrOr(input.matcherCriteria).map((c) => ({
      field: strOr(c?.field),
      operator: strOr(c?.operator),
      value: c?.value,
      label: strOr(c?.label)
    })),
    relatedCompletedTrialIds: arrOr(input.relatedCompletedTrialIds),
    link: strOr(input.link),
    lastReviewed: strOr(input.lastReviewed),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : 'todo-verify',
    verificationNotes: strOr(input.verificationNotes),
    legacyMatcherKey: strOr(input.legacyMatcherKey)
  };
}

export function makeCitation(input = {}) {
  return {
    id: strOr(input.id),
    type: strOr(input.type, 'journal-article'),
    authors: strOr(input.authors),
    title: strOr(input.title),
    journal: strOr(input.journal),
    year: Number.isFinite(input.year) ? input.year : 0,
    volume: strOr(input.volume),
    pages: strOr(input.pages),
    pmid: strOr(input.pmid),
    doi: strOr(input.doi),
    url: strOr(input.url),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : 'todo-verify',
    verificationNotes: strOr(input.verificationNotes)
  };
}

export function makeRecommendation(input = {}) {
  return {
    id: strOr(input.id),
    topic: strOr(input.topic),
    setting: SETTING_VALUES.includes(input.setting) ? input.setting : 'all',
    text: strOr(input.text),
    classOfRecommendation: CLASS_VALUES.includes(input.classOfRecommendation)
      ? input.classOfRecommendation
      : 'IIa',
    levelOfEvidence: LOE_VALUES.includes(input.levelOfEvidence) ? input.levelOfEvidence : 'B-R',
    guidelineSource: strOr(input.guidelineSource),
    supportingClaimIds: arrOr(input.supportingClaimIds),
    caveats: arrOr(input.caveats),
    lastReviewed: strOr(input.lastReviewed),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : 'todo-verify',
    verificationNotes: strOr(input.verificationNotes)
  };
}

export function makeClaim(input = {}) {
  return {
    id: strOr(input.id),
    statement: strOr(input.statement),
    topic: strOr(input.topic),
    citationIds: arrOr(input.citationIds),
    certainty: CERTAINTY_VALUES.includes(input.certainty) ? input.certainty : 'moderate',
    conflictNotes: strOr(input.conflictNotes),
    lastReviewed: strOr(input.lastReviewed)
  };
}

export function makeGuideline(input = {}) {
  return {
    id: strOr(input.id),
    name: strOr(input.name),
    organization: strOr(input.organization),
    year: Number.isFinite(input.year) ? input.year : 0,
    topic: strOr(input.topic),
    url: strOr(input.url),
    citationId: strOr(input.citationId),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : 'verified-guideline',
    lastReviewed: strOr(input.lastReviewed),
    verificationNotes: strOr(input.verificationNotes)
  };
}

export function makeTopic(input = {}) {
  return {
    id: strOr(input.id),
    label: strOr(input.label),
    parentId: strOr(input.parentId, ''),
    notes: strOr(input.notes)
  };
}

// ---------------------------------------------------------------------------
// Validation. Returns { errors: string[], warnings: string[] } — no throw.
// Caller decides how to react. The build-time validator turns errors into a
// nonzero exit; the runtime UI silently degrades on missing references.
// ---------------------------------------------------------------------------

const within24Months = (iso) => {
  if (!ISO_DATE.test(iso || '')) return false;
  const reviewed = new Date(`${iso}T00:00:00Z`).getTime();
  if (Number.isNaN(reviewed)) return false;
  // Anchor "now" to the project's known stable date when the env is offline-
  // ish; for runtime use Date.now is fine. Both branches return the cutoff.
  const now = Date.now();
  const cutoff = now - 24 * 30 * 24 * 60 * 60 * 1000;
  return reviewed >= cutoff;
};

function pushIf(list, condition, message) {
  if (condition) list.push(message);
}

export function validateCompletedTrial(t, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `completedTrials/${t.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(t.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !t.shortName, `${where}: shortName required`);
  pushIf(errors, !t.fullName, `${where}: fullName required`);
  pushIf(errors, !t.topic, `${where}: topic required`);
  pushIf(errors, !CERTAINTY_VALUES.includes(t.certainty), `${where}: certainty invalid`);
  pushIf(errors, !EVIDENCE_TYPE_VALUES.includes(t.evidenceType), `${where}: evidenceType invalid`);
  pushIf(errors, !VERIFICATION_VALUES.includes(t.verificationStatus), `${where}: verificationStatus invalid`);
  pushIf(errors, !t.primaryEndpoint?.result, `${where}: primaryEndpoint.result required`);

  if (t.verificationStatus === 'todo-verify' && !t.verificationNotes) {
    errors.push(`${where}: verificationStatus=todo-verify requires verificationNotes`);
  }

  if (!ISO_DATE.test(t.lastReviewed || '')) {
    errors.push(`${where}: lastReviewed must be ISO date YYYY-MM-DD`);
  } else if (!within24Months(t.lastReviewed)) {
    warnings.push(`${where}: stale-evidence (lastReviewed ${t.lastReviewed} > 24 months ago)`);
  }

  if (ctx.knownCitationIds) {
    for (const cid of t.citationIds || []) {
      if (!ctx.knownCitationIds.has(cid)) {
        errors.push(`${where}: citationIds references unknown citation '${cid}'`);
      }
    }
  }
  if (ctx.knownActiveTrialIds) {
    for (const aid of t.relatedActiveTrialIds || []) {
      if (!ctx.knownActiveTrialIds.has(aid)) {
        errors.push(`${where}: relatedActiveTrialIds references unknown active trial '${aid}'`);
      }
    }
  }

  return { errors, warnings };
}

export function validateActiveTrial(t, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `activeTrials/${t.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(t.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !t.shortName, `${where}: shortName required`);
  pushIf(errors, !t.fullName, `${where}: fullName required`);
  pushIf(errors, !t.topic, `${where}: topic required`);
  pushIf(errors, !ACTIVE_TRIAL_STATUS_VALUES.includes(t.status), `${where}: status invalid`);
  pushIf(errors, !VERIFICATION_VALUES.includes(t.verificationStatus), `${where}: verificationStatus invalid`);

  if (t.nctId && !NCT_PATTERN.test(t.nctId)) {
    errors.push(`${where}: nctId '${t.nctId}' fails NCT pattern`);
  }

  if (!Array.isArray(t.matcherCriteria) || t.matcherCriteria.length === 0) {
    errors.push(`${where}: at least one matcherCriteria entry required`);
  }

  if (t.verificationStatus === 'todo-verify' && !t.verificationNotes) {
    errors.push(`${where}: verificationStatus=todo-verify requires verificationNotes`);
  }

  if (!ISO_DATE.test(t.lastReviewed || '')) {
    errors.push(`${where}: lastReviewed must be ISO date YYYY-MM-DD`);
  } else if (!within24Months(t.lastReviewed)) {
    warnings.push(`${where}: stale-evidence (lastReviewed ${t.lastReviewed} > 24 months ago)`);
  }

  if (ctx.knownCompletedTrialIds) {
    for (const cid of t.relatedCompletedTrialIds || []) {
      if (!ctx.knownCompletedTrialIds.has(cid)) {
        errors.push(`${where}: relatedCompletedTrialIds references unknown completed trial '${cid}'`);
      }
    }
  }

  return { errors, warnings };
}

export function validateCitation(c) {
  const errors = [];
  const warnings = [];
  const where = `citations/${c.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(c.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !c.title, `${where}: title required`);
  pushIf(errors, !VERIFICATION_VALUES.includes(c.verificationStatus), `${where}: verificationStatus invalid`);

  if (c.pmid && !PMID_PATTERN.test(c.pmid)) {
    errors.push(`${where}: pmid '${c.pmid}' fails 7-9 digit pattern`);
  }
  if (c.doi && !DOI_PATTERN.test(c.doi)) {
    errors.push(`${where}: doi '${c.doi}' fails DOI pattern`);
  }

  if (c.verificationStatus === 'todo-verify' && !c.verificationNotes) {
    errors.push(`${where}: verificationStatus=todo-verify requires verificationNotes`);
  }

  return { errors, warnings };
}

export function validateRecommendation(r, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `recommendations/${r.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(r.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !r.text, `${where}: text required`);
  pushIf(errors, !CLASS_VALUES.includes(r.classOfRecommendation), `${where}: classOfRecommendation invalid`);
  pushIf(errors, !LOE_VALUES.includes(r.levelOfEvidence), `${where}: levelOfEvidence invalid`);
  pushIf(errors, !VERIFICATION_VALUES.includes(r.verificationStatus), `${where}: verificationStatus invalid`);

  if (r.classOfRecommendation === 'I') {
    if (!Array.isArray(r.supportingClaimIds) || r.supportingClaimIds.length === 0) {
      warnings.push(`${where}: Class I recommendation has no supportingClaimIds (auditability warning)`);
    }
  }

  if (r.verificationStatus === 'todo-verify' && !r.verificationNotes) {
    errors.push(`${where}: verificationStatus=todo-verify requires verificationNotes`);
  }

  if (!ISO_DATE.test(r.lastReviewed || '')) {
    errors.push(`${where}: lastReviewed must be ISO date YYYY-MM-DD`);
  } else if (!within24Months(r.lastReviewed)) {
    warnings.push(`${where}: stale-evidence (lastReviewed ${r.lastReviewed} > 24 months ago)`);
  }

  if (ctx.knownClaimIds) {
    for (const cid of r.supportingClaimIds || []) {
      if (!ctx.knownClaimIds.has(cid)) {
        errors.push(`${where}: supportingClaimIds references unknown claim '${cid}'`);
      }
    }
  }

  return { errors, warnings };
}

export function validateClaim(c, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `claims/${c.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(c.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !c.statement, `${where}: statement required`);
  pushIf(errors, !CERTAINTY_VALUES.includes(c.certainty), `${where}: certainty invalid`);

  if (ctx.knownCitationIds) {
    for (const cid of c.citationIds || []) {
      if (!ctx.knownCitationIds.has(cid)) {
        errors.push(`${where}: citationIds references unknown citation '${cid}'`);
      }
    }
  }

  return { errors, warnings };
}

export function validateGuideline(g, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `guidelines/${g.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(g.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !g.name, `${where}: name required`);
  pushIf(errors, !g.organization, `${where}: organization required`);

  if (ctx.knownCitationIds && g.citationId && !ctx.knownCitationIds.has(g.citationId)) {
    errors.push(`${where}: citationId references unknown citation '${g.citationId}'`);
  }

  return { errors, warnings };
}
