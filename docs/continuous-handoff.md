# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `1654d91`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION observed: `v5.14.13`
- Service worker cache key: `stroke-app-v12`

## Completed in this cycle (iter-004)
- Added one-screen `ICH First-Hour Critical Bundle` card in ICH management.
- Added `Large Core EVT` evidence highlight with explicit conservative decision rule (do not exclude solely for large core).
- Added DAPT phenotype quick matrix in secondary prevention guidance (rendered when pathway context is populated).
- Updated cycle docs:
  - `docs/evidence-review-2021-2026.md`
  - `docs/gap-matrix.md`
  - `docs/iteration-log.md`
  - `docs/regression-checklist.md`

## QA summary
- Build: pass (`npm run build`).
- Schema check: `compare_keys.ps1` still reports default-vs-sanitizer mismatch (`Missing count: 319`).
- Pre-change baseline: local + live desktop/tablet/mobile route matrix passed (no console errors).
- Post-change pre-push: local + live desktop/tablet/mobile route matrix passed (no console errors).
- Post-deploy validation: live APP_VERSION advanced to `v5.14.13`; local + live route matrix passed (no console errors).

## Known debt and risks
- Storage schema mismatch remains high and should be handled in a dedicated hardening iteration.
- No automated unit/integration tests yet; confidence remains build + scripted smoke + targeted workflow checks.
- Working tree contains unrelated local artifacts not committed by cycle automation:
  - modified `package-lock.json`
  - untracked `app.debug.js`
  - untracked `compare_keys.ps1`

## Next highest-impact actions
1. Add SAH first-hour rapid checklist card at top of SAH pathway (securement, nimodipine, DCI watch, BP context).
2. Add CVT treatment timeline strip (initial anticoagulation, ICP red flags, transition strategy).
3. Add AF anticoag timing quick card in prevention workflow (early vs delayed DOAC framing).
4. Start automated pathway assertions (ischemic/ICH/SAH/TIA/CVT + calculator smoke checks) as scriptable CI gates.

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && "C:\Program Files\nodejs\npm.cmd" run build`
