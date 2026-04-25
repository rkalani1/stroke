# Evidence Atlas — Extension guide

How to add new content to the Evidence Atlas, run validation and export,
and apply the "Why this recommendation?" drawer to additional Management
sections.

The schema is documented separately in `evidence-atlas-schema.md`. This
guide is operational.

---

## Add a completed trial

1. Open `src/evidence/completedTrials.js`.
2. Append a new entry using the `t({...})` factory. Use kebab-case for `id`.
3. Required fields per the schema:
   - `id`, `shortName`, `fullName`, `topic`
   - `population.n`, `intervention`, `comparator`
   - `primaryEndpoint.definition`, `primaryEndpoint.result`
   - `certainty`, `evidenceType`
   - `lastReviewed` (ISO date)
   - `verificationStatus`
4. Add at least one citation. If the citation does not yet exist:
   - Open `src/evidence/citations.js`
   - Append `makeCitation({...})` with `id`, `title`, `journal`, `year`, and
     either a `pmid` (7–9 digits) or a `doi` (`10.xxxx/...`)
   - Set `verificationStatus` to `verified-pubmed` if PMID is supplied,
     `verified-doi` if only DOI, or `unverified-source-limited` if neither
     can be confirmed locally
5. Optionally cross-link with active trials by adding the new
   completed-trial id to `relatedCompletedTrialIds` on the relevant active
   trial in `src/evidence/activeTrials.js` — and / or by adding active-trial
   ids to `relatedActiveTrialIds` on the new completed trial.
6. Run `npm run evidence:validate`. Resolve any reported errors.
7. Run `npm run evidence:export` to refresh `output/`.
8. Run `npm run test:unit` — the FK-integrity test will catch any dangling
   references.

---

## Add an active trial

1. Open `src/evidence/activeTrials.js`.
2. Append `makeActiveTrial({...})`. Use kebab-case for `id`.
3. Provide at least one `matcherCriteria` entry — required by the
   validator. Each entry is `{ field, operator, value, label }` and is the
   declarative mirror of the live evaluator.
4. If a matching legacy `TRIAL_ELIGIBILITY_CONFIG` entry exists in
   `src/app.jsx`, set `legacyMatcherKey` to the legacy key. The Context
   Bridge resolves active trials by this key when populating
   "Background evidence" drawers, so this is what wires your new active
   trial into the matcher panel.
5. Add `relatedCompletedTrialIds` for any landmark trials whose results
   inform the trial's rationale.
6. Set `nctId` (validated against `^NCT\d{8}$`).
7. Set `lastReviewed`, `verificationStatus`.
8. Validate, export, test as above.

---

## Add a recommendation with claim chain

1. Pick or add the supporting claim(s) in `src/evidence/claims.js`. A claim
   is a single auditable statement supported by ≥1 citations.
2. In `src/evidence/recommendations.js`, append `makeRecommendation({...})`.
   - `classOfRecommendation` and `levelOfEvidence` use the AHA enums
   - `supportingClaimIds` is the list of claim ids
   - `caveats` is a list of human-readable caveats shown in an amber band
3. To surface the new recommendation inside an existing Management section,
   open `src/app.jsx` and find the relevant legacy recommendation id (e.g.
   `bp_ich_acute`). Add a single mapping line to
   `MANAGEMENT_REC_TO_ATLAS_REC`:
   ```js
   const MANAGEMENT_REC_TO_ATLAS_REC = {
     'bp_ich_acute': 'rec-ich-bp-target',
     'your_legacy_id': 'rec-your-new-rec-id',
   };
   ```
4. The "Why this recommendation? (N supporting claims)" drawer will appear
   on the matching card automatically. No JSX changes required.

---

## Add a topic

1. Open `src/evidence/topics.js`.
2. Append `makeTopic({...})` with kebab-case `id` and human label. Use
   `parentId` to nest under an existing topic.
3. Validate. The validator emits a non-fatal warning if records reference
   an unregistered topic — this lets you stage data and taxonomy
   independently.

---

## Run validation and export

```bash
npm run evidence:validate          # structural validation, exits 1 on error
npm run evidence:validate:json     # same, JSON output
npm run evidence:export            # writes output/{evidence-atlas.md, *.csv, *.json}
npm run evidence:export:check      # validates exports without writing
```

The validator is wired into the npm `test` chain. Every PR that ships
atlas data passes through it.

---

## What's source-limited and what to do about it

Records flagged `unverified-source-limited` or `todo-verify` carry a
`verificationNotes` field describing what needs human review. Typical
flags:

- Pre-2021 landmark trials whose PMIDs are widely published but not in the
  current repo's citation table.
- Trials with partial primary-endpoint precision (where the local repo
  content held the qualitative result but not the numeric effect size,
  CI, or p-value).

Resolution workflow:

1. Confirm the identifier on PubMed / ClinicalTrials.gov / DOI.
2. Update the record's numeric fields with verified values.
3. Promote `verificationStatus` to the matching `verified-*` value.
4. Clear `verificationNotes` (or set it to a brief audit trail entry).
5. Re-run `npm run evidence:validate` — the warning resolves.

---

## Apply the recommendation drawer to a new Management section

The Phase 8 pattern is data-driven and requires zero new JSX after the
initial scaffold. To extend coverage to a new Management section that
uses the existing `rec.classOfRec / rec.levelOfEvidence / rec.guideline`
data shape:

1. Identify the legacy recommendation id (e.g. `bp_ich_avoid_low`).
2. Add or reuse a structured atlas recommendation in
   `src/evidence/recommendations.js`.
3. Add the mapping in `MANAGEMENT_REC_TO_ATLAS_REC` inside `src/app.jsx`.
4. Build (`npm run build:js`) and the drawer renders.

If the section uses a *different* data shape (i.e. it does not pass
through the shared recommendation card render at `src/app.jsx` ~line 21704),
copy the small JSX block from inside the existing render — it's about 40
lines, and the only inputs are the legacy id and the
`MANAGEMENT_REC_TO_ATLAS_REC` map.

---

## Where things are

| Concern | File |
|---|---|
| Schema factories + validators | `src/evidence/schema.js` |
| Type-only docs | `docs/evidence-atlas-schema.md` |
| Active trials | `src/evidence/activeTrials.js` |
| Completed trials | `src/evidence/completedTrials.js` |
| Citations | `src/evidence/citations.js` |
| Recommendations | `src/evidence/recommendations.js` |
| Claims | `src/evidence/claims.js` |
| Guidelines | `src/evidence/guidelines.js` |
| Topics | `src/evidence/topics.js` |
| Barrel + queries + label maps | `src/evidence/index.js` |
| Matcher field-binding helpers | `src/evidence/matcher-helpers.js` |
| Generic matcher engine | `src/evidence/matcher-engine.js` |
| Validator | `scripts/evidence-validate.mjs` |
| Exporter | `scripts/evidence-export.mjs` |
| Trials sub-tab toggle and Atlas view | `src/app.jsx` (search "trialsView") |
| Context Bridge drawer | `src/app.jsx` (search "Context Bridge") |
| Inline recommendation drawer + map | `src/app.jsx` (search "MANAGEMENT_REC_TO_ATLAS_REC") |
| Atlas tests | `src/evidence/__tests__/atlas.test.js` |
| Matcher binding tests | `src/evidence/__tests__/matcher.test.js` |
| Matcher engine tests | `src/evidence/__tests__/matcher-engine.test.js` |
| Sprint architecture overview | `docs/strokeops-v6-evidence-atlas.md` |
| Matcher engine guide | `docs/evidence-atlas-matcher-engine.md` |
| Build artifacts | `output/` (gitignored) |
