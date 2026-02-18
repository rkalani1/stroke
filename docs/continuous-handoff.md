# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `51480b9`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION observed: `v5.14.12`
- Service worker cache key: `stroke-app-v11`

## Completed in this cycle
- Rebased local work onto latest `origin/main` without regressing top-level IA (`Dashboard`, `Encounter`, `Library`, `Settings`).
- Added management auto-routing guard so diagnosis changes do not forcibly pull users out of `Calculators` or `References`.
- Added/updated core governance docs:
  - `docs/evidence-review-2021-2026.md`
  - `docs/gap-matrix.md`
  - `docs/iteration-log.md`
  - `docs/regression-checklist.md`
- Bumped app version to `v5.14.12` and cache key to `stroke-app-v11`.
- Deployed to `main` and confirmed production rollout.

## QA summary
- Build: pass (`npm run build`).
- Post-deploy smoke tests:
  - Local: desktop/tablet/mobile and routes `#/dashboard`, `#/encounter`, `#/library`, `#/settings` all passed, no console errors.
  - Live: desktop/tablet/mobile and same routes all passed, no console errors.

## Known debt and risks
- `compare_keys.ps1` indicates large default-vs-sanitizer mismatch set; schema hardening needed.
- No automated unit/integration tests; current safety net is build + smoke + manual pathway checks.

## Next highest-impact actions
1. Build a one-screen ICH first-hour bundle card (BP, reversal, ICU escalation, surgery trigger) with conservative defaults.
2. Add explicit large-core EVT evidence card and imaging criteria quick reference in ischemic pathway.
3. Add DAPT phenotype matrix and AF anticoag timing quick card in secondary prevention workflow.
4. Add automated regression script for key pathway assertions (ischemic/ICH/SAH/TIA/CVT + calculators).

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && "C:\Program Files\nodejs\npm.cmd" run build`
