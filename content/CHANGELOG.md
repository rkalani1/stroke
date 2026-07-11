# Content changelog

Material changes to the `/content` clinical data layer. Per-entry provenance is
recorded in each record's `provenance` field; this file records batch changes,
re-verifications, and schema evolution. Dates are absolute (ISO).

Format: newest first. Each entry: what changed, why, and the source it was
verified against.

## 2026-07-11 — Initial `/content` data layer

- Established the schema-validated `/content` data layer (guidelines, trials,
  education, calculators, references) with build-time validation
  (`scripts/validate-content.mjs`) and a currency report
  (`scripts/check-currency.mjs`).
- Seeded 137 records by faithful derivation from existing canonical sources
  (no clinical value hand-typed):
  - `guidelines/` (11) ← `src/evidence/recommendations.js` (+ claims→citations
    drill-through for PMIDs/DOIs).
  - `trials/` (64) ← `src/evidence/completedTrials.js`.
  - `calculators/registry.json` (24) ← verified compute-module exports; now the
    single source the agent-asset generator derives from.
  - `education/` (16) ← `EDUCATION_MODULES` in `src/education.jsx` (metadata:
    title, summary, tags, contexts, references, lastReviewed).
  - `references/` (18) ← `documents/*` reference PDFs cited in `src/app.jsx`.
- All records validated against the single citations registry
  (`src/evidence/citations.js`). `lastReviewed` dates carried over from the
  source modules (2026-04-25 / 2026-05-30); see `npm run content:currency`.
