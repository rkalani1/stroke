# Updating clinical content (`/content`)

This app projects clinical reference data into typed, schema-validated files
under `/content`. Edit the canonical source, verify the clinical change against
the primary evidence, and regenerate its projections. Structural validation
detects malformed records and broken identifiers; it does not validate clinical
accuracy, completeness, applicability, or the current corrected edition.

> **Not the Example Protocols tab.** The `#/protocols/*` clinical wording is
> frozen byte-for-byte and is *not* edited here — see
> [REFACTOR_MAP.md §7](REFACTOR_MAP.md) and the `test:protocol-snapshot` lock.

## The five content domains

| Domain | Location | One record is… |
|---|---|---|
| Guidelines | `content/guidelines/*.json` | a guideline recommendation (COR/LOE + statement + sources) |
| Trials | `content/trials/*.json` | a completed trial (population, finding, teaching point) |
| Education | `content/education/*.md` | a teaching module's metadata (YAML frontmatter) |
| Calculators | `content/calculators/registry.json` | one entry in the single calculator registry |
| References | `content/references/*.json` | a reference card / PDF metadata record |

Schemas and validators: [`content/schema.mjs`](content/schema.mjs). Run the
validation commands below before release; `npm run build` alone does not run
all clinical-content validators.

## Required fields

**Guideline** (`content/guidelines/<source-slug>.json`, an array):
```json
{
  "id": "rec-ich-bp-target",        // kebab-case, unique
  "guideline": "AHA/ASA 2022 ICH Guideline",
  "year": 2022,
  "section": "ich-bp-management",   // topic key
  "COR": "IIb",                     // I | IIa | IIb | III-no-benefit | III-harm
  "LOE": "B-R",                     // A | B-R | B-NR | C-LD | C-EO
  "statement": "…",
  "PMIDs": ["35579034"],            // may be empty IF sourceUrl is set
  "DOIs": ["10.1161/STR.0000000000000407"],
  "citationIds": ["cit-aha-ich-2022"],   // ids into src/evidence/citations.js
  "lastReviewed": "2026-07-11",     // ISO date
  "sourceUrl": "https://…"          // required if no PMID/DOI/citationId
}
```

**Trial** (`content/trials/<category>.json`, an array): `id, name, category,
population, finding, teachingPoint, year`, plus a `PMID` **or** `citationIds`.

**Education** (`content/education/<id>.md`, YAML frontmatter): `id, title,
summary, tags, contexts (subset of telestroke|inpatient|clinic), calculators
(ids from the registry), references, lastReviewed`.

**Calculator** (`content/calculators/registry.json`): `id, name, category, fn,
module` — `fn` must be a real export of `src/calculators.js` or
`src/calculators-extended.js` (verified by `content:seed`).

**Reference** (`content/references/<category>.json`): `id, title, category,
type (pdf|image|external-link)`, plus `path` (files) or `url` (links).

## Citations are defined once

Every PMID/DOI/citationId you reference must already exist in the single
citations registry, [`src/evidence/citations.js`](src/evidence/citations.js).
Add the citation there first (with `makeCitation`), then reference it by id.
The validator fails the build on any citation it can't resolve.

## The workflow

1. **Verify and edit the canonical source** listed below. Record the primary
   source, population, outcome, recommendation grade and unresolved limitations.
2. **Regenerate:** `npm run content:seed`, `npm run build:prod`, and
   `npm run evidence:export` when Evidence Atlas records change. Teaching-card
   changes also require regenerating each affected approved PDF with
   `node scripts/generate-pdfs.mjs --only <ComponentName>` and inspecting every page.
3. **Validate:** `npm run content:seed:check`, `npm run content:validate`,
   `npm run content:bundle:check`, `npm run agent:assets:check`, and the relevant
   source validators and tests.
   - Fails on malformed fields, bad COR/LOE, unresolved citations, or entries
     older than `STROKE_CONTENT_MAX_AGE_MONTHS` (default 18).
4. **Review and release.** Review the generated diff and rendered output,
   independently review changed clinical claims, and require CI and the Example
   Protocols snapshot lock to pass before publication.

Do not edit generated `/content` records directly: the seed check rejects drift
and regeneration overwrites it. Several visible surfaces render directly from
their canonical React or data modules, so a projection-only edit will not
update them.

## Scaffolding a new entry from a PDF or PMIDs

Never hand-build the JSON from scratch:

```bash
# From PubMed IDs:
npm run content:scaffold -- --type guideline --pmids 41582814 --now 2026-07-11

# From a guideline PDF's extracted text (mines COR/LOE/statement hints):
npm run content:scaffold -- --type trial --pdf-text /tmp/trial.txt --now 2026-07-11
```

This writes a draft to `content/_drafts/` (gitignored, never validated or
published) with clinical fields marked `TODO` or **unverified**. Verify each
field against the primary source, have the clinical content reviewed, then
incorporate the accepted record into its canonical source and regenerate.
Copying a draft directly into a live projection folder is not the authoring
contract.

## Keeping content current

```bash
npm run content:currency            # list entries not reviewed in > 12 months
npm run content:currency -- --months 6
```

Each stale entry is listed with its source URL / PMIDs so you can re-verify.
After re-verifying, bump `lastReviewed` to today. CI runs this as an advisory
report; the build hard-fails only past the 18-month threshold.

## Provenance & changelog

Every seeded record carries a `provenance` field naming where it came from.
Record material content changes in [`content/CHANGELOG.md`](content/CHANGELOG.md).

## Where guidelines & trials are *authored* today

| Content | Canonical source |
|---|---|
| Evidence Atlas recommendations and completed trials | `src/evidence/recommendations.js`, `src/evidence/completedTrials.js`, with linked claims/citations in `src/evidence/` |
| Full Guidelines library | `src/guidelines/*.json`; this is distinct from the smaller Evidence Atlas recommendation projection |
| Education metadata and teaching cards | `EDUCATION_MODULES` and components in `src/education.jsx` |
| Calculator implementation and catalog | `src/calculators.js`, `src/calculators-extended.js`, and the catalog in `scripts/seed-content.mjs` |
| Reference/download registry | `REFERENCE_LIBRARY_SECTIONS` in `src/app.jsx` |

`npm run content:seed:check` fails if any seeded domain differs from these
sources. Public `data/` assets are generated separately by `npm run agent:assets`
(also run by the build). Preserve provenance and source-access qualifications in
every projection; a new review date is not evidence of newly verified claims.
