# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `9930311`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.16`
- Service worker cache key: `stroke-app-v15`

## Completed in this cycle (iter-008)
- Added renal-safety auto-alert in Contrast Allergy + LVO Protocol (CrCl-based severe/moderate warnings).
- Added PFO Closure Eligibility decision card in secondary prevention (CLOSE/RESPECT/REDUCE evidence).
- Added Carotid Revascularization Decision Guide in secondary prevention (NASCET/CREST-2).
- Bumped APP_VERSION to v5.14.16 and service-worker cache to v15.

## QA summary
- Build: pass (esbuild + tailwindcss).
- Post-change: local cards verified present, build clean.
- Deployed to GitHub Pages successfully.

## Gap matrix status — all P0/P1 items
| Gap | Status |
|-----|--------|
| TNK-first decision card | Completed (iter-007) |
| Wake-up imaging hard-stop | Completed (iter-007) |
| EVT large core | Completed (iter-004) |
| ICH first-hour bundle | Completed (iter-004) |
| DAPT phenotype matrix | Completed (iter-004) |
| SAH first-hour rapid card | Completed (iter-006) |
| CVT treatment timeline | Completed (iter-006) |
| AF anticoag timing card | Completed (iter-006) |
| Pregnancy/peripartum panel | Completed (iter-007) |
| Renal-safety prompt | Completed (iter-008) |
| PFO closure decision card | Completed (iter-008) |
| Carotid revascularization card | Completed (iter-008) |
| Senior-first cognitive load | Completed (iter-001) |
| QA/Regression discipline | Completed (iter-001) |
| Automated pathway tests | Open |
| Schema mismatch debt | Open |

## Known debt and risks
- Storage schema mismatch remains high (pre-existing).
- No automated unit/integration tests yet.
- Working tree: modified `package-lock.json`, untracked `app.debug.js`, `compare_keys.ps1`.

## Next highest-impact actions
1. UI responsive audit and mobile usability optimization.
2. Consolidate/deduplicate guidance that appears in multiple sections.
3. Begin automated pathway assertion tests.
4. Address storage schema mismatch debt.
5. Add pediatric stroke pathway guidance.

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && npx esbuild ./src/app.jsx --bundle --minify --format=iife --target=es2018 --outfile=./app.js`
