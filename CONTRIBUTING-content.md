# Updating clinical content (`/content`)

This app's clinical reference data lives in `/content` as typed, schema-validated
files. This guide is the low-friction workflow for adding or updating a
guideline, trial, educational resource, calculator, or reference **in under five
minutes**, with the build refusing to ship malformed or unsourced entries.

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

Schemas and validators: [`content/schema.mjs`](content/schema.mjs). Every field
below is enforced at build time.

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

1. **Edit** the relevant `/content` file (or scaffold a new one — see below).
2. **Validate:** `npm run content:validate`
   - Fails on malformed fields, bad COR/LOE, unresolved citations, or entries
     older than `STROKE_CONTENT_MAX_AGE_MONTHS` (default 18).
3. **Commit.** CI re-runs the same check (`npm test`) plus the Example Protocols
   snapshot lock.

That's it. Guidelines and references render from these files, so a data edit is
the whole change — no component code to touch.

## Scaffolding a new entry from a PDF or PMIDs

Never hand-build the JSON from scratch:

```bash
# From PubMed IDs:
npm run content:scaffold -- --type guideline --pmids 41582814 --now 2026-07-11

# From a guideline PDF's extracted text (mines COR/LOE/statement hints):
npm run content:scaffold -- --type trial --pdf-text /tmp/trial.txt --now 2026-07-11
```

This writes a draft to `content/_drafts/` (gitignored, never validated or
published) with every clinical field as a `TODO`. Any text-mined values are
labelled **unverified**. Fill the TODOs against the primary source, have a
clinician confirm the clinical content, move the file into the live domain
folder, then run `npm run content:validate`.

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

`content/guidelines/*` and `content/trials/*` are currently **projected** from
the mature Evidence Atlas (`src/evidence/recommendations.js`,
`completedTrials.js`) by `npm run content:seed`, so they stay consistent with
the Atlas's own validators and matcher engine. `npm run content:seed:check`
(run in CI) fails if they drift. To change a guideline/trial value, edit the
Atlas source and re-run `content:seed`. Calculators, education, and references
are authored directly in `/content`.
