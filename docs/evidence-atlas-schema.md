# Evidence Atlas — Schema reference

Pure ES modules. Source: `src/evidence/schema.js` (factories + validators)
and the per-record-type files (`activeTrials.js`, `completedTrials.js`,
`citations.js`, `recommendations.js`, `claims.js`, `guidelines.js`,
`topics.js`).

This reference describes every field on every record. Validators are
exposed as `schema.validateCompletedTrial`, `schema.validateActiveTrial`,
etc., and import from the same module. The build-time validator
(`scripts/evidence-validate.mjs`) and the runtime UI both consume this
schema, so a single edit propagates.

---

## Identifier patterns

Live verification is out of scope. The validator does structural checks
only.

| Identifier | Regex | Comment |
|---|---|---|
| PMID | `^\d{7,9}$` | NCBI PubMed identifier (currently 7–9 digits) |
| DOI | `^10\.\d{4,9}/[-._;()/:A-Z0-9]+$/i` | DOI pattern with case-insensitive suffix |
| NCT | `^NCT\d{8}$` | ClinicalTrials.gov identifier (NCT + 8 digits) |
| ISO date | `^\d{4}-\d{2}-\d{2}$` | All `lastReviewed` fields use ISO date |

---

## Enums

```
Certainty:                  high | moderate | low | very-low
EvidenceType:               rct | meta-analysis | observational | guideline | consensus
ActiveTrialStatus:          recruiting | active-not-recruiting | enrolling-by-invitation | completed-pending-results
ClassOfRecommendation:      I | IIa | IIb | III-no-benefit | III-harm
LevelOfEvidence:            A | B-R | B-NR | C-LD | C-EO
RecommendationSetting:      inpatient | outpatient | pre-hospital | all
VerificationStatus:         verified-pubmed | verified-doi | verified-clinicaltrials-gov |
                            verified-guideline | verified-rct |
                            unverified-source-limited | todo-verify | disputed
```

---

## CompletedTrial

```js
{
  id: string,                    // kebab-case, unique within completedTrials
  shortName: string,             // e.g. "EXTEND"
  fullName: string,              // full publication name
  topic: string,                 // FK to topics.js
  diseaseArea: string[],         // additional cross-tags

  population: {
    n: number,                   // total enrolled
    ageRange: string,            // free text
    nihssRange: string,
    timeWindow: string,
    keyInclusion: string[],
    keyExclusion: string[]
  },

  intervention: string,
  comparator: string,

  primaryEndpoint: {
    definition: string,          // wording from publication
    timepoint: string,           // e.g. "90 d"
    result: string,              // "Favored EVT: 31.0% vs 12.7%"
    effectSize: string,          // "RR 2.43"
    confidenceInterval: string,  // "95% CI 1.35 to 4.37"
    pValue: string               // "p=0.002"
  },

  secondaryEndpoints: { name: string, result: string }[],

  safetyFindings: {
    sich: string,                // sICH rate
    mortality: string,
    other: string
  },

  imagingCriteria: string,       // when relevant
  applicabilityNotes: string,
  limitations: string,

  certainty: Certainty,
  evidenceType: EvidenceType,
  citationIds: string[],         // FKs to citations.js
  relatedActiveTrialIds: string[],

  practiceImpact: string,
  lastReviewed: string,          // ISO date
  verificationStatus: VerificationStatus,
  verificationNotes: string      // required when verificationStatus = 'todo-verify'
}
```

Example: see `EXTEND` in `src/evidence/completedTrials.js`.

---

## ActiveTrial

```js
{
  id: string,
  shortName: string,
  fullName: string,
  nctId: string,                 // structurally validated NCT8
  phase: string,
  status: ActiveTrialStatus,
  topic: string,
  briefDescription: string,
  rationale: string,
  inclusionCriteria: string[],
  exclusionCriteria: string[],

  matcherCriteria: {
    field: string,               // canonical encounter form field name
    operator: '>=' | '<=' | '==' | 'in' | 'between' | 'present',
    value: any,
    label: string                // human-readable
  }[],

  relatedCompletedTrialIds: string[],

  link: string,
  lastReviewed: string,
  verificationStatus: VerificationStatus,
  verificationNotes: string,
  legacyMatcherKey: string       // back-link to TRIAL_ELIGIBILITY_CONFIG
}
```

`matcherCriteria` is a *declarative mirror* of the live matcher. Live
evaluation continues from `TRIAL_ELIGIBILITY_CONFIG` in `src/app.jsx`;
this field is the single-source documentation of what binds where.

---

## Citation

```js
{
  id: string,
  type: 'journal-article' | 'guideline' | 'registry' | 'preprint' | 'other',
  authors: string,
  title: string,
  journal: string,
  year: number,
  volume: string,
  pages: string,
  pmid: string,                  // structurally validated
  doi: string,                   // structurally validated
  url: string,
  verificationStatus: VerificationStatus,
  verificationNotes: string
}
```

Helper: `citationLink(c)` returns the best-available URL (preferring
explicit `url`, then `pmid` PubMed link, then DOI redirect).

---

## Recommendation

```js
{
  id: string,
  topic: string,
  setting: RecommendationSetting,
  text: string,
  classOfRecommendation: ClassOfRecommendation,
  levelOfEvidence: LevelOfEvidence,
  guidelineSource: string,
  supportingClaimIds: string[],  // FKs to claims.js
  caveats: string[],
  lastReviewed: string,
  verificationStatus: VerificationStatus,
  verificationNotes: string
}
```

Auditability rule: a Class I recommendation with no `supportingClaimIds`
emits a validator warning.

---

## Claim

```js
{
  id: string,
  statement: string,             // single auditable assertion
  topic: string,
  citationIds: string[],         // FKs to citations.js
  certainty: Certainty,
  conflictNotes: string,         // describes any conflicting evidence
  lastReviewed: string
}
```

Recommendations cite Claims; Claims cite Citations. The chain is what the
"Why this recommendation?" drawer walks.

---

## Guideline

```js
{
  id: string,
  name: string,
  organization: string,
  year: number,
  topic: string,
  url: string,
  citationId: string,
  verificationStatus: VerificationStatus,
  lastReviewed: string,
  verificationNotes: string
}
```

---

## Topic

```js
{
  id: string,
  label: string,
  parentId: string,              // optional FK to topics
  notes: string
}
```

Helper: `topicLabel(id)` returns the display label or falls back to the
raw id.

---

## Validator semantics

| Severity | Trigger |
|---|---|
| **error** | schema mismatch, dangling FK, malformed PMID/DOI/NCT, missing required field, missing verification note for `todo-verify`, missing matcher criteria, missing primary-endpoint result |
| **warning** | Class I recommendation without supporting claims, `lastReviewed` >24 months old (stale-evidence), unregistered topic id |

Errors → exit 1. Warnings → exit 0 with banner.

---

## Query helpers (`src/evidence/index.js`)

```js
filterCompletedTrials({ topic, certainty, evidenceType, verificationStatus, query })
filterActiveTrials({ topic, status, query })
resolveCompletedTrials(ids)
resolveActiveTrials(ids)
resolveCitations(ids)
resolveClaimsWithCitations(claimIds)   // expands claim → citation chain
relatedEvidenceFor(activeTrial)        // shortcut for Context Bridge
getActiveTrial(id)
getActiveTrialByLegacyKey(key)
getCompletedTrial(id)
getCitation(id)
getRecommendation(id)
getClaim(id)
```

Display label maps:

```js
VERIFICATION_STATUS_LABELS, CERTAINTY_LABELS, EVIDENCE_TYPE_LABELS, ACTIVE_STATUS_LABELS
```
