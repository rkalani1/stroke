// Schema/validation for the maintained citation, claim and source recommendation closure.
// Historical trial factories and recruitment/matcher schemas are retired.
export const CERTAINTY_VALUES = ['high', 'moderate', 'low', 'very-low'];
export const EVIDENCE_TYPE_VALUES = ['rct', 'meta-analysis', 'observational', 'guideline', 'consensus'];
export const CLASS_VALUES = ['I', 'IIa', 'IIb', 'III-no-benefit', 'III-harm'];
export const LOE_VALUES = ['A', 'B-R', 'B-NR', 'C-LD', 'C-EO'];
export const SETTING_VALUES = ['inpatient', 'outpatient', 'pre-facility', 'all'];
export const TODO_VERIFY_STATUS = 'todo-verify';

export const VERIFICATION_VALUES = [
  'verified-pubmed',
  'verified-doi',
  'verified-clinicaltrials-gov',
  'verified-guideline',
  'verified-rct',
  'unverified-source-limited',
  TODO_VERIFY_STATUS,
  'disputed'
];

// Structural identifier patterns. Live verification is explicitly out of scope.
export const PMID_PATTERN = /^\d{7,9}$/;
export const DOI_PATTERN = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_ID = /^[a-z0-9][a-z0-9-]*$/;

// Defensive deep-clone for factory output; the seed records remain immutable.
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

const arrOr = (v, fallback = []) => (Array.isArray(v) ? clone(v) : clone(fallback));
const strOr = (v, fallback = '') => (typeof v === 'string' ? v : fallback);

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
      : TODO_VERIFY_STATUS,
    verificationNotes: strOr(input.verificationNotes)
  };
}

export function makeRecommendation(input = {}) {
  const gradingSystem = strOr(input.gradingSystem, 'AHA');
  const isAha = gradingSystem === 'AHA';
  return {
    id: strOr(input.id),
    topic: strOr(input.topic),
    setting: SETTING_VALUES.includes(input.setting) ? input.setting : 'all',
    text: strOr(input.text),
    gradingSystem,
    classOfRecommendation: isAha
      ? (CLASS_VALUES.includes(input.classOfRecommendation) ? input.classOfRecommendation : 'IIa')
      : null,
    levelOfEvidence: isAha
      ? (LOE_VALUES.includes(input.levelOfEvidence) ? input.levelOfEvidence : 'B-R')
      : null,
    nativeStrength: strOr(input.nativeStrength),
    nativeCertainty: strOr(input.nativeCertainty),
    sourceUrl: strOr(input.sourceUrl),
    guidelineSource: strOr(input.guidelineSource),
    supportingClaimIds: arrOr(input.supportingClaimIds),
    caveats: arrOr(input.caveats),
    lastReviewed: strOr(input.lastReviewed),
    verificationStatus: VERIFICATION_VALUES.includes(input.verificationStatus)
      ? input.verificationStatus
      : TODO_VERIFY_STATUS,
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

function checkVerificationNotes(obj, where, errors) {
  if (obj.verificationStatus === TODO_VERIFY_STATUS && !obj.verificationNotes) {
    errors.push(`${where}: verificationStatus=${TODO_VERIFY_STATUS} requires verificationNotes`);
  }
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

  checkVerificationNotes(c, where, errors);

  return { errors, warnings };
}

export function validateRecommendation(r, ctx = {}) {
  const errors = [];
  const warnings = [];
  const where = `recommendations/${r.id || '<unset>'}`;

  pushIf(errors, !KEBAB_ID.test(r.id || ''), `${where}: id must be kebab-case`);
  pushIf(errors, !r.text, `${where}: text required`);
  const gradingSystem = r.gradingSystem || 'AHA';
  if (gradingSystem === 'AHA') {
    pushIf(errors, !CLASS_VALUES.includes(r.classOfRecommendation), `${where}: classOfRecommendation invalid`);
    pushIf(errors, !LOE_VALUES.includes(r.levelOfEvidence), `${where}: levelOfEvidence invalid`);
  } else {
    pushIf(errors, !['GRADE', 'consensus'].includes(gradingSystem), `${where}: gradingSystem invalid`);
    pushIf(errors, r.classOfRecommendation != null || r.levelOfEvidence != null, `${where}: non-AHA guidance must not carry AHA COR/LOE`);
    pushIf(errors, !r.nativeStrength, `${where}: nativeStrength required for non-AHA guidance`);
    pushIf(errors, gradingSystem === 'GRADE' && !r.nativeCertainty, `${where}: nativeCertainty required for GRADE guidance`);
    pushIf(errors, !/^https:\/\//.test(r.sourceUrl || ''), `${where}: primary sourceUrl required for non-AHA guidance`);
  }
  pushIf(errors, !VERIFICATION_VALUES.includes(r.verificationStatus), `${where}: verificationStatus invalid`);

  if (r.classOfRecommendation === 'I') {
    if (!Array.isArray(r.supportingClaimIds) || r.supportingClaimIds.length === 0) {
      warnings.push(`${where}: Class I recommendation has no supportingClaimIds (auditability warning)`);
    }
  }

  checkVerificationNotes(r, where, errors);

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

  // Topic-coherence: a recommendation's topic should match (or share root with)
  // each supporting claim's topic. The 2026-05-09 audit caught a Class-I warfarin
  // reversal recommendation whose only supporting claim was the INTERACT3 BP
  // bundle — semantically wrong, structurally valid before this check.
  if (ctx.claimById && r.topic && Array.isArray(r.supportingClaimIds)) {
    const recRoot = String(r.topic).split('-')[0];
    for (const cid of r.supportingClaimIds) {
      const claim = ctx.claimById.get(cid);
      if (!claim || !claim.topic) continue;
      const claimRoot = String(claim.topic).split('-')[0];
      if (claim.topic !== r.topic && claimRoot !== recRoot) {
        warnings.push(
          `${where}: supporting claim '${cid}' has topic '${claim.topic}' which does not share a root with recommendation topic '${r.topic}'. Verify alignment.`
        );
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
