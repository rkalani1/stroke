// src/evidence/index.js
//
// Barrel export and helper queries for the StrokeOps v6 Evidence Atlas.
// Pure ES module; usable in Node (validators, exports) and the browser
// (Trials tab, Management drawers).
//
//   import { activeTrials, completedTrials, lookupRelatedEvidence } from './evidence/index.js';

import { activeTrials, getActiveTrial, getActiveTrialByLegacyKey, getAllActiveTrialIds } from './activeTrials.js';
import { completedTrials, getCompletedTrial, getAllCompletedTrialIds } from './completedTrials.js';
import { citations, getCitation, getAllCitationIds, citationLink } from './citations.js';
import { recommendations, getRecommendation, getAllRecommendationIds } from './recommendations.js';
import { claims, getClaim, getAllClaimIds } from './claims.js';
import { guidelines, getGuideline } from './guidelines.js';
import { topics, getTopic, topicLabel } from './topics.js';
import * as schema from './schema.js';

export {
  activeTrials,
  completedTrials,
  citations,
  recommendations,
  claims,
  guidelines,
  topics,
  // queries
  getActiveTrial,
  getActiveTrialByLegacyKey,
  getCompletedTrial,
  getCitation,
  getRecommendation,
  getClaim,
  getGuideline,
  getTopic,
  topicLabel,
  citationLink,
  // id sets used by validators / cross-reference resolution
  getAllActiveTrialIds,
  getAllCompletedTrialIds,
  getAllCitationIds,
  getAllRecommendationIds,
  getAllClaimIds,
  // schema (factories + validators)
  schema
};

/**
 * Resolve a list of related completed-trial ids into full records, dropping
 * any unresolvable references. Used by the Active Trials view to surface the
 * Context Bridge "Background evidence" drawer.
 */
export function resolveCompletedTrials(ids = []) {
  return (ids || [])
    .map((id) => getCompletedTrial(id))
    .filter(Boolean);
}

export function resolveActiveTrials(ids = []) {
  return (ids || [])
    .map((id) => getActiveTrial(id))
    .filter(Boolean);
}

export function resolveCitations(ids = []) {
  return (ids || [])
    .map((id) => getCitation(id))
    .filter(Boolean);
}

export function resolveClaimsWithCitations(claimIds = []) {
  return (claimIds || [])
    .map((id) => getClaim(id))
    .filter(Boolean)
    .map((c) => ({ ...c, citationRecords: resolveCitations(c.citationIds) }));
}

/**
 * Filter completed trials by topic, certainty, evidence type, verification
 * status, and free-text query (case-insensitive substring against shortName,
 * fullName, topic, intervention, and supporting citation titles).
 */
export function filterCompletedTrials({
  topic = null,
  certainty = null,
  evidenceType = null,
  verificationStatus = null,
  query = ''
} = {}) {
  const q = (query || '').trim().toLowerCase();
  return completedTrials.filter((t) => {
    if (topic && t.topic !== topic && !(t.diseaseArea || []).includes(topic)) return false;
    if (certainty && t.certainty !== certainty) return false;
    if (evidenceType && t.evidenceType !== evidenceType) return false;
    if (verificationStatus && t.verificationStatus !== verificationStatus) return false;
    if (!q) return true;
    const hay = [
      t.shortName,
      t.fullName,
      t.topic,
      t.intervention,
      ...(t.diseaseArea || []),
      ...resolveCitations(t.citationIds).map((c) => c.title)
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function filterActiveTrials({
  topic = null,
  status = null,
  query = ''
} = {}) {
  const q = (query || '').trim().toLowerCase();
  return activeTrials.filter((t) => {
    if (topic && t.topic !== topic) return false;
    if (status && t.status !== status) return false;
    if (!q) return true;
    const hay = [t.shortName, t.fullName, t.topic, t.briefDescription, t.nctId].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/**
 * For the Context Bridge: given an active trial, return its related completed
 * trials in the order specified on the active trial record. Pre-filters to
 * only include trials that are still discoverable in the registry (drops
 * dangling references).
 */
export function relatedEvidenceFor(activeTrial) {
  if (!activeTrial) return [];
  return resolveCompletedTrials(activeTrial.relatedCompletedTrialIds);
}

/**
 * Verification-status pills for the UI. Centralized so future label/color
 * changes happen in one place.
 */
export const VERIFICATION_STATUS_LABELS = {
  'verified-pubmed': { label: 'Verified · PubMed', tone: 'emerald' },
  'verified-doi': { label: 'Verified · DOI', tone: 'emerald' },
  'verified-clinicaltrials-gov': { label: 'Verified · CT.gov', tone: 'emerald' },
  'verified-guideline': { label: 'Verified · Guideline', tone: 'emerald' },
  'verified-rct': { label: 'Verified · RCT', tone: 'emerald' },
  'unverified-source-limited': { label: 'Source-limited', tone: 'amber' },
  'todo-verify': { label: 'Verify', tone: 'amber' },
  'disputed': { label: 'Disputed', tone: 'rose' }
};

export const CERTAINTY_LABELS = {
  high: { label: 'High certainty', tone: 'emerald' },
  moderate: { label: 'Moderate certainty', tone: 'sky' },
  low: { label: 'Low certainty', tone: 'amber' },
  'very-low': { label: 'Very low certainty', tone: 'rose' }
};

export const EVIDENCE_TYPE_LABELS = {
  rct: { label: 'RCT', tone: 'sky' },
  'meta-analysis': { label: 'Meta-analysis', tone: 'sky' },
  observational: { label: 'Observational', tone: 'slate' },
  guideline: { label: 'Guideline', tone: 'indigo' },
  consensus: { label: 'Consensus', tone: 'slate' }
};

export const ACTIVE_STATUS_LABELS = {
  recruiting: { label: 'Recruiting', tone: 'emerald' },
  'active-not-recruiting': { label: 'Active · not recruiting', tone: 'sky' },
  'enrolling-by-invitation': { label: 'Enrolling by invitation', tone: 'sky' },
  'completed-pending-results': { label: 'Completed · pending results', tone: 'slate' }
};
