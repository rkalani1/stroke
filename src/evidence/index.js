// Maintained Encounter/protocol evidence only. Historical atlas is archived in Git.
import { citations, getCitation, getAllCitationIds, citationLink } from './citations.js';
import { recommendations, getRecommendation, getAllRecommendationIds } from './recommendations.js';
import { claims, getClaim, getAllClaimIds } from './claims.js';
import { guidelines, getGuideline } from './guidelines.js';
import { topics, getTopic, topicLabel } from './topics.js';
import * as schema from './schema.js';
export { citations, getCitation, getAllCitationIds, citationLink, recommendations, getRecommendation, getAllRecommendationIds, claims, getClaim, getAllClaimIds, guidelines, getGuideline, topics, getTopic, topicLabel, schema };
export function resolveCitations(ids = []) { return (ids || []).map(getCitation).filter(Boolean); }
export function resolveClaimsWithCitations(ids = []) { return (ids || []).map(getClaim).filter(Boolean).map(c => ({ ...c, citationRecords: resolveCitations(c.citationIds) })); }
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
