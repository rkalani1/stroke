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
- **Evidence Atlas** sub-tab at `#/trials` with 31 completed/landmark trials, search, topic / certainty / evidence-type filters, and citation drilldown to PMID / DOI.
- **Context Bridge** in active-trial matcher cards: related completed trials surface as background evidence (never as eligibility criteria).
- **"Why this recommendation?" drawer** in Management sections, walking guideline → claim → primary citation chain.
- **Pure-function matcher engine** (`src/evidence/matcher-engine.js`) with 100% coverage of 52 inclusion criteria + 15 exclusions across 11 active trials.
- **42 verified citations** sourced from `docs/evidence-review-2021-2026.md` plus pre-2021 landmarks.


## Install

The app is a Progressive Web App and runs in any modern browser. Three install paths are supported, plus an optional native distribution path.

| Platform | How |
|---|---|
| Web | Open ` /stroke/` |
| iOS Safari | Share → Add to Home Screen (a one-time tip prompts you) |
| Android Chrome / Desktop Chrome / Edge | Settings ("More") menu → **Install app** |
| App Store / Play Store | Optional Capacitor wrapper — see [docs/pwa-and-app.md](docs/pwa-and-app.md) |

Updates roll out via a non-intrusive **"A new version of Stroke is ready"** banner — clinicians mid-encounter are never auto-reloaded. See [docs/pwa-and-app.md](docs/pwa-and-app.md) for the full update / offline behavior, manifest shortcut targets, and Lighthouse run instructions.

## Privacy & safety
- Public GitHub Pages use is synthetic/demo-only.
- Do not enter PHI, patient identifiers, MRN fragments, dates of birth, real ward census data, real encounter details, learner records, or confidential institutional information.
- Real clinical use requires organization-approved hosting, storage, access control, governance, and incident-response paths outside this public deployment.

## GitHub Pages routing
- Deployed under `/stroke/` using hash routes (`#/encounter`, `#/management`, etc.).

## Deep links
- `#/encounter` · `#/management` · `#/management/ich` · `#/management/ischemic` · `#/management/calculators` · `#/management/references` · `#/trials`

## QA commands

### Validation
- `npm run validate:citations` — verifies the 24-row citation table in `docs/evidence-review-2021-2026.md` (PMID, DOI, NCT structure; year range; URL format).
- `npm run validate:automedbench-lite` — verifies that `docs/ai-agent-evals/automedbench-lite.md` keeps the S1-S5 gate for AI-assisted evidence and protocol updates.
- `npm run evidence:validate` — structural validation of `src/evidence/` (schema conformance, FK integrity, identifier patterns, Class-I-without-supporting-claim auditability, stale-evidence warnings). Reports matcher-engine coverage. Standalone runnable for fast iteration.
- `npm run evidence:export` — emits Markdown + CSV + JSON to `output/` (atlas summary, completed trials, active trials, claim-source map, PICO table).
- `npm run validate:evidence-churn-profiles`, `npm run validate:qa-latency-profiles`, `npm run validate:evidence-promotion` — operational validators for the QA-governance pipeline.

### Tests
- `npm run test:unit` — runs vitest. 427 tests across calculators, atlas, matcher engine, scenario snapshots. Fast (<1s); guards every PR via CI.
- `npm test` — full local chain: validators + Playwright local smoke. Slower (~5–10 min). Requires Playwright browsers (`npx playwright install`).
- `npm run qa` — full chain with live smoke against the deployed site.

### Build
- `npm run build` — production build (Tailwind + esbuild bundle).
- `npm run build:js` / `npm run build:css` — individual steps.
