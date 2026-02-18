# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `f2ffbb8`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.14`
- Service worker cache key: `stroke-app-v13`

## Completed in this cycle (iter-006)
- Added SAH first-hour rapid actions card at top of SAH management (airway/ICU, BP, securing, nimodipine, hydrocephalus, DCI surveillance).
- Added CVT treatment timeline strip (acute/subacute/duration/escalation) with ACTION-CVT DOAC transition data.
- Added AF anticoag timing quick reference in secondary prevention (CATALYST/ELAN/TIMING grid, conditional on AF regimen selection).
- Bumped APP_VERSION to v5.14.14 and service-worker cache to v13.
- Updated cycle docs: evidence-review, gap-matrix, iteration-log, regression-checklist.

## QA summary
- Build: pass (esbuild + tailwindcss).
- Schema check: pre-existing mismatch persists (not addressed this cycle).
- Post-change: local desktop/tablet/mobile route matrix passed (no console errors).
- Deployed to GitHub Pages successfully.

## Known debt and risks
- Storage schema mismatch remains high and should be handled in a dedicated hardening iteration.
- No automated unit/integration tests yet; confidence remains build + smoke + targeted workflow checks.
- Working tree contains unrelated local artifacts not committed:
  - modified `package-lock.json`
  - untracked `app.debug.js`
  - untracked `compare_keys.ps1`

## Next highest-impact actions
1. Add TNK-first decision card with explicit inclusion/exclusion criteria and alteplase fallback branch in ischemic management (P0 gap).
2. Add hard-stop imaging reminder in wake-up/unknown onset pathway (P0 gap).
3. Add special population panel (pregnancy/peripartum emergency notes + maternal-fetal coordination triggers) (P1 gap).
4. Add renal-safety prompt chips where anticoag/contrast decisions are made (P1 gap).
5. Start automated pathway assertion tests as scriptable CI gates.

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && npx esbuild ./src/app.jsx --bundle --minify --format=iife --target=es2018 --outfile=./app.js`
