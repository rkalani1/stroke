# Stroke Clinical Decision Support

A client-side educational/demo toolkit for stroke management. Runs entirely in the browser; no backend, no tracking.

**The public GitHub Pages deployment is a synthetic demo only. It is not medical advice, not an official system, and not endorsed by any named institution. Do not enter PHI, patient identifiers, MRN fragments, ward census data, real encounter details, or confidential institutional information.**

## Features
- Acute encounter workflow (IVT, EVT, extended-window imaging selection).
- Protocol cards (example institutional patterns based on published evidence).
- Calculators: NIHSS, ASPECTS, ICH score, ABCD², HAS-BLED, RCVS², PHASES, ROPE, CrCl, TNK/alteplase dose, DAWN, DEFUSE-3, CHANCE/POINT/THALES DAPT duration, ESSEN, SPI-II, BAT/BRAIN/9-point ICH expansion, VASOGRADE, Ogilvy-Carter, PHQ-9, NASCET, CHA₂DS₂-VA, HEADS².
- Public build disables ward census, imports/exports, encounter persistence, and patient-context URL handoff. Private/approved deployments can re-enable operational modules after governance review.
- Clinic and wards workflows.
- Post-tPA neurocheck timer; LKW countdown to 4.5h and 24h windows.
- Note generators for telestroke consult, transfer, signout, progress, discharge.
- **Completed evidence** under `#/research/references` with 242 completed/landmark trials, search, topic / certainty / evidence-type filters, and citation drilldown to PMID / DOI.
- **Context Bridge** in active-trial matcher cards: related completed trials surface as background evidence (never as eligibility criteria).
- **"Why this recommendation?" drawer** in Management sections, walking guideline → claim → primary citation chain.
- **Pure-function matcher engine** (`src/evidence/matcher-engine.js`) with executable coverage of 44 modeled inclusion criteria + 14 exclusions. These partial models support candidate screening, not definitive eligibility.
- **378 citation records**, including primary reports, education sources and pre-2021 landmarks.


## Install

The app is a Progressive Web App and runs in any modern browser. Three install paths are supported, plus an optional native distribution path.

| Platform | How |
|---|---|
| Web | Open ` /stroke/` |
| iOS Safari | **Install App** button in the Trials header opens an Add-to-Home-Screen walkthrough (Share → Add to Home Screen) |
| Android Chrome / Desktop Chrome / Edge | **Install App** button in the Trials header fires the browser install prompt (the browser's own menu → Install also works) |
| App Store / Play Store | Optional Capacitor wrapper — see [docs/pwa-and-app.md](docs/pwa-and-app.md) |

Updates roll out via a non-intrusive **"A new version of Stroke is ready"** banner — clinicians mid-encounter are never auto-reloaded. See [docs/pwa-and-app.md](docs/pwa-and-app.md) for the full update / offline behavior, manifest shortcut targets, and Lighthouse run instructions.

## Privacy & safety
- Public GitHub Pages use is synthetic/demo-only.
- Do not enter PHI, patient identifiers, MRN fragments, dates of birth, real ward census data, real encounter details, learner records, or confidential institutional information.
- Real clinical use requires organization-approved hosting, storage, access control, governance, and incident-response paths outside this public deployment.

## Clinical content data layer (`/content`)

Clinical reference data has a typed, schema-validated projection under
`/content`. Edit the canonical sources in `src/evidence/`, `src/guidelines/`,
`src/education.jsx`, and the reference registry in `src/app.jsx`; then run
`npm run content:seed` and `npm run build:prod`. Hand edits to seeded projections
are overwritten. Full guide:
[CONTRIBUTING-content.md](CONTRIBUTING-content.md).

| Domain | Files | Schema |
|---|---|---|
| Guidelines | `content/guidelines/*.json` | id, guideline, year, section, COR, LOE, statement, PMIDs[], DOIs[], lastReviewed, sourceUrl |
| Trials | `content/trials/*.json` | name, category, population, finding, teachingPoint, PMID, year |
| Education | `content/education/*.md` | frontmatter: id, title, summary, tags, contexts[], calculators[], references[], lastReviewed |
| Calculators | `content/calculators/registry.json` | single registry (id, name, category, fn, module) |
| References | `content/references/*.json` | reference cards + PDF metadata |

- **Validation** (`content/schema.mjs`, run by `npm run content:validate` and in
  CI) fails the build on malformed fields, bad COR/LOE, a citation that doesn't
  resolve in the single registry (`src/evidence/citations.js`), or a
  `lastReviewed` older than 18 months.
- **Single citations module:** every PMID/DOI is defined once in
  `src/evidence/citations.js` and referenced by id.
- **Update a guideline/trial/resource:** verify the primary source, edit its canonical
  source (or scaffold a draft — `npm run content:scaffold -- --type guideline --pmids
  … --now YYYY-MM-DD`), regenerate seeded data, validate, and review the diff. See
  CONTRIBUTING-content.md.
- **Currency worklist:** `npm run content:currency` lists entries due for
  re-verification with their source URLs/PMIDs.
- `content/bundle.json` is the generated single-import projection consumed via
  `src/content-context.js` (pure access + Telestroke/Inpatient/Clinic filtering).

The full architecture audit and the sequenced refactor plan live in
[REFACTOR_MAP.md](REFACTOR_MAP.md); remaining render-integration work is scoped
in [REMAINING-WORK.md](REMAINING-WORK.md).

### Example Protocols content lock

The Example Protocols tab (`#/protocols/*`) clinical wording is frozen. A
rendered-DOM snapshot lock (`npm run test:protocol-snapshot`, in CI) captures
every subtab's visible text + drug-modal content and fails on any drift, so
refactors can't silently alter clinical text/values. Intentional changes are a
separate reviewed `npm run test:protocol-snapshot:update` commit.

## GitHub Pages routing
- Deployed under `/stroke/` using hash routes (`#/encounter`, `#/protocols`, `#/research`, etc.).

## Deep links
- `#/encounter` · `#/protocols` · `#/protocols/ischemic` · `#/protocols/ich` · `#/protocols/calculators` · `#/research` · `#/trials` · `#/education`

## QA commands

### Validation
- `npm run validate:citations` — verifies the 24-row citation table in `docs/evidence-review-2021-2026.md` (PMID, DOI, NCT structure; year range; URL format).
- `npm run validate:automedbench-lite` — verifies that `docs/ai-agent-evals/automedbench-lite.md` keeps the S1-S5 gate for AI-assisted evidence and protocol updates.
- `npm run evidence:validate` — structural validation of `src/evidence/` (schema conformance, FK integrity, identifier patterns, Class-I-without-supporting-claim auditability, stale-evidence warnings). Reports matcher-engine coverage. Standalone runnable for fast iteration.
- `npm run evidence:export` — emits Markdown + CSV + JSON to `output/` (atlas summary, completed trials, active trials, claim-source map, PICO table).
- `npm run validate:evidence-churn-profiles`, `npm run validate:qa-latency-profiles`, `npm run validate:evidence-promotion` — operational validators for the QA-governance pipeline.

### Tests
- `npm run test:unit` — runs Vitest across calculators, atlas, matcher engine, e2e tiers, and scenario snapshots. One tier-2 e2e spec needs outbound network access. Guards every PR via CI.
- `npm test` — full local chain: validators + Playwright local smoke. Slower (~5–10 min). Requires Playwright browsers (`npx playwright install`).
- `npm run qa` — full chain with live smoke against the deployed site.

### September 2026 evidence and usability review

The non-Protocol review includes 109 source documents and 3,547 extracted
entries excluding three source-only placeholders. Coverage varies by document.
Six correction notices remain explicitly unresolved because their full text
could not be retrieved. See [the review record](docs/reviews/2026-09-06-non-protocol-review.md)
for the scope, sources, changes, checks and limitations.

Teaching PDFs are generated from the same React cards as the live Education
view. After an authored teaching change, run `node scripts/generate-pdfs.mjs`
with Playwright Chromium installed (or set `STROKE_CHROMIUM_PATH`), then inspect
the PDFs. This prevents the former duplicate HTML export from drifting.

### Build
- `npm run build` — production build (Tailwind + esbuild bundle).
- `npm run build:js` / `npm run build:css` — individual steps.
