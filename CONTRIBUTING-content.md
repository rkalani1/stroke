# Maintaining Encounter evidence

The maintained product contains an in-memory synthetic Encounter workflow,
embedded tools, protected example protocols, and bounded source/limits access.
Education, trial recruitment/matching, the general guideline/reference portal,
and teaching PDFs are retired. Their full committed history is at
`archive/pre-encounter-first-20261001-4f8e99d`.

Edit canonical records: `src/clinical/claims.json` for shared wording,
`src/clinical/workspace-sources.json` for tool identities/limits, retained
`src/evidence/{recommendations,claims,citations}.js` for their supporting closure,
and `content/calculators/registry.json` for retained tool contracts. The six
`src/guidelines/*.json` files are explicitly bounded projections. Their original
source review/correction warnings remain applicable; archived full-transcription
coverage is retained as provenance, never advertised as subset completeness.

A moved file, generated endpoint or successful build is not a clinical review.
Preserve actual review dates, missing-date states, original applicability and
source-access/correction limitations. Verify any clinical change against the
primary source. Protected protocols and the Telestroke map require their existing
unchanged locks and release requirements. Do not silently rewrite their wording.

Run `npm run evidence:validate`, `npm run content:validate`,
`npm run validate:citations`, `npm run validate:pmids`,
`npm run validate:inline-citations`, and `npm run check:clinical-claims`.
Currency checks apply only to retained sources. Metadata checks are not clinical
validation. Run focused calculator/state tests and the protected locks too.

Regenerate `npm run agent:assets` and verify `npm run agent:assets:check`.
It produces the maintained API, stable checksums and machine manifests plus
legacy retirement envelopes. Never restore broad corpora through a build.
Old JSON URLs contain `_meta.status: "retired"`, null `data`, and archive and
replacement pointers; clients must inspect that status even when Pages returns
HTTP 200. The MCP README records deliberate tool compatibility changes.

The clinical occurrence checker remains active. Reconcile moved or retired
occurrences with reasons and the archival ref; preserve canonical/source hashes
unless a reviewed source projection changed. Never blanket-reset baselines or
remove guard requirements to pass a build. Production publishing must use the
retained-output allowlist so raw source documents, historical downloads and
maintenance files do not become active public reference content.
