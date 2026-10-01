// Encounter evidence stays eager; large completed-trial detail records do not.
// Keep these small query helpers behavior-identical to evidence/index.js.
import { activeTrials, getActiveTrialByLegacyKey } from './evidence/activeTrials.js';
import { citations, getCitation, citationLink } from './evidence/citations.js';
import { recommendations } from './evidence/recommendations.js';
import { claims, getClaim } from './evidence/claims.js';
import { topics, topicLabel } from './evidence/topics.js';

export { activeTrials, getActiveTrialByLegacyKey, citations, recommendations, claims, topics, citationLink, topicLabel };
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
