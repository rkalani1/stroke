// Type declarations for the StrokeOps v6 Evidence Atlas.
//
// These declarations describe the data shapes exposed by
// src/evidence/index.js so TypeScript-aware editors / linters can
// type-check consumers without converting the codebase to TypeScript.
//
// Pure declaration file — no runtime impact, no behavior change.

export type Certainty = 'high' | 'moderate' | 'low' | 'very-low';
export type EvidenceType = 'rct' | 'meta-analysis' | 'observational' | 'guideline' | 'consensus';
export type ActiveTrialStatus =
  | 'recruiting'
  | 'active-not-recruiting'
  | 'enrolling-by-invitation'
  | 'completed-pending-results';
export type ClassOfRecommendation = 'I' | 'IIa' | 'IIb' | 'III-no-benefit' | 'III-harm';
export type LevelOfEvidence = 'A' | 'B-R' | 'B-NR' | 'C-LD' | 'C-EO';
export type RecommendationSetting = 'inpatient' | 'outpatient' | 'pre-hospital' | 'all';
export type VerificationStatus =
  | 'verified-pubmed'
  | 'verified-doi'
  | 'verified-clinicaltrials-gov'
  | 'verified-guideline'
  | 'verified-rct'
  | 'unverified-source-limited'
  | 'todo-verify'
  | 'disputed';

export type MatcherOperator =
  | '>='
  | '<='
  | '>'
  | '<'
  | '=='
  | 'between'
  | 'in'
  | 'present'
  | 'truthy';

export interface MatcherCriterion {
  field: string;
  operator: MatcherOperator;
  value: unknown;
  label: string;
}

export interface MatcherExclusion {
  id: string;
  field: string;
  operator: MatcherOperator;
  value: unknown;
  label: string;
}

export interface ActiveTrial {
  id: string;
  shortName: string;
  fullName: string;
  nctId: string;
  phase: string;
  status: ActiveTrialStatus;
  topic: string;
  briefDescription: string;
  rationale: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  keyTakeaways: string[];
  lookingFor: string[];
  category: string;
  matcherCriteria: MatcherCriterion[];
  matcherExclusions: MatcherExclusion[];
  relatedCompletedTrialIds: string[];
  link: string;
  lastReviewed: string; // ISO date
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  legacyMatcherKey: string;
}

export interface CompletedTrialPopulation {
  n: number;
  ageRange: string;
  nihssRange: string;
  timeWindow: string;
  keyInclusion: string[];
  keyExclusion: string[];
}

export interface CompletedTrialPrimaryEndpoint {
  definition: string;
  timepoint: string;
  result: string;
  effectSize: string;
  confidenceInterval: string;
  pValue: string;
}

export interface CompletedTrial {
  id: string;
  shortName: string;
  fullName: string;
  topic: string;
  diseaseArea: string[];
  population: CompletedTrialPopulation;
  intervention: string;
  comparator: string;
  primaryEndpoint: CompletedTrialPrimaryEndpoint;
  secondaryEndpoints: { name: string; result: string }[];
  safetyFindings: { sich: string; mortality: string; other: string };
  imagingCriteria: string;
  applicabilityNotes: string;
  limitations: string;
  certainty: Certainty;
  evidenceType: EvidenceType;
  citationIds: string[];
  relatedActiveTrialIds: string[];
  practiceImpact: string;
  lastReviewed: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
}

export interface Citation {
  id: string;
  type: 'journal-article' | 'guideline' | 'registry' | 'preprint' | 'other';
  authors: string;
  title: string;
  journal: string;
  year: number;
  volume: string;
  pages: string;
  pmid: string;
  doi: string;
  url: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
}

export interface Recommendation {
  id: string;
  topic: string;
  setting: RecommendationSetting;
  text: string;
  classOfRecommendation: ClassOfRecommendation;
  levelOfEvidence: LevelOfEvidence;
  guidelineSource: string;
  supportingClaimIds: string[];
  caveats: string[];
  lastReviewed: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
}

export interface Claim {
  id: string;
  statement: string;
  topic: string;
  citationIds: string[];
  certainty: Certainty;
  conflictNotes: string;
  lastReviewed: string;
}

export interface Guideline {
  id: string;
  name: string;
  organization: string;
  year: number;
  topic: string;
  url: string;
  citationId: string;
  verificationStatus: VerificationStatus;
  lastReviewed: string;
  verificationNotes: string;
}

export interface Topic {
  id: string;
  label: string;
  parentId: string;
  notes: string;
}

// Module exports
export const activeTrials: ActiveTrial[];
export const completedTrials: CompletedTrial[];
export const citations: Citation[];
export const recommendations: Recommendation[];
export const claims: Claim[];
export const guidelines: Guideline[];
export const topics: Topic[];

// Single-record query helpers
export function getActiveTrial(id: string): ActiveTrial | null;
export function getActiveTrialByLegacyKey(key: string): ActiveTrial | null;
export function getCompletedTrial(id: string): CompletedTrial | null;
export function getCitation(id: string): Citation | null;
export function getRecommendation(id: string): Recommendation | null;
export function getClaim(id: string): Claim | null;
export function getGuideline(id: string): Guideline | null;
export function getTopic(id: string): Topic | null;
export function topicLabel(id: string): string;
export function citationLink(citation: Citation | null): string;

// Id-set helpers
export function getAllActiveTrialIds(): Set<string>;
export function getAllCompletedTrialIds(): Set<string>;
export function getAllCitationIds(): Set<string>;
export function getAllRecommendationIds(): Set<string>;
export function getAllClaimIds(): Set<string>;

// Resolution helpers
export function resolveCompletedTrials(ids: string[]): CompletedTrial[];
export function resolveActiveTrials(ids: string[]): ActiveTrial[];
export function resolveCitations(ids: string[]): Citation[];
export function resolveClaimsWithCitations(claimIds: string[]): (Claim & { citationRecords: Citation[] })[];

// Filters
export interface CompletedTrialFilter {
  topic?: string | null;
  certainty?: Certainty | null;
  evidenceType?: EvidenceType | null;
  verificationStatus?: VerificationStatus | null;
  query?: string;
}
export function filterCompletedTrials(filter?: CompletedTrialFilter): CompletedTrial[];

export interface ActiveTrialFilter {
  topic?: string | null;
  status?: ActiveTrialStatus | null;
  query?: string;
}
export function filterActiveTrials(filter?: ActiveTrialFilter): ActiveTrial[];

// Context Bridge
export function relatedEvidenceFor(activeTrial: ActiveTrial | null | undefined): CompletedTrial[];

// Display label maps
export interface LabelMeta { label: string; tone: string }
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, LabelMeta>;
export const CERTAINTY_LABELS: Record<Certainty, LabelMeta>;
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, LabelMeta>;
export const ACTIVE_STATUS_LABELS: Record<ActiveTrialStatus, LabelMeta>;

// Schema namespace (factories + validators)
export const schema: {
  PMID_PATTERN: RegExp;
  DOI_PATTERN: RegExp;
  NCT_PATTERN: RegExp;
  CERTAINTY_VALUES: Certainty[];
  EVIDENCE_TYPE_VALUES: EvidenceType[];
  ACTIVE_TRIAL_STATUS_VALUES: ActiveTrialStatus[];
  CLASS_VALUES: ClassOfRecommendation[];
  LOE_VALUES: LevelOfEvidence[];
  SETTING_VALUES: RecommendationSetting[];
  VERIFICATION_VALUES: VerificationStatus[];
  makeCompletedTrial(input?: Partial<CompletedTrial>): CompletedTrial;
  makeActiveTrial(input?: Partial<ActiveTrial>): ActiveTrial;
  makeCitation(input?: Partial<Citation>): Citation;
  makeRecommendation(input?: Partial<Recommendation>): Recommendation;
  makeClaim(input?: Partial<Claim>): Claim;
  makeGuideline(input?: Partial<Guideline>): Guideline;
  makeTopic(input?: Partial<Topic>): Topic;
  validateCompletedTrial(t: CompletedTrial, ctx?: { knownCitationIds?: Set<string>; knownActiveTrialIds?: Set<string> }): { errors: string[]; warnings: string[] };
  validateActiveTrial(t: ActiveTrial, ctx?: { knownCompletedTrialIds?: Set<string> }): { errors: string[]; warnings: string[] };
  validateCitation(c: Citation): { errors: string[]; warnings: string[] };
  validateRecommendation(r: Recommendation, ctx?: { knownClaimIds?: Set<string> }): { errors: string[]; warnings: string[] };
  validateClaim(c: Claim, ctx?: { knownCitationIds?: Set<string> }): { errors: string[]; warnings: string[] };
  validateGuideline(g: Guideline, ctx?: { knownCitationIds?: Set<string> }): { errors: string[]; warnings: string[] };
};
