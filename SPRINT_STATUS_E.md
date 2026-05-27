# SPRINT_STATUS_E.md — Matcher-engine promotion follow-up

This is the follow-up sprint after the StrokeOps v6 Evidence Atlas
landed in PR #10. The previous sprint's main `SPRINT_STATUS.md` remains
the reference for that work; this file covers the matcher engine.

**Start time:** 2026-04-25T02:38Z
**Branch:** `feature/strokeops-v6-matcher-engine` (stacked on
`feature/strokeops-v6-evidence-atlas`)

## Goal

Promote the declarative `matcherCriteria` arrays on each active trial
from "documentation mirror" to "executable specification". Deliver
parallel-verification mode behind a localStorage flag so
disagreements between engine and legacy can be observed without
clinician-visible change.

## Phase tracker

| Phase | Status |
|---|---|
| E1 — Generic matcher engine | ✅ complete |
| E2 — Engine tests | ✅ complete |
| E3 — Parallel-verification wiring in app.jsx | ✅ complete |
| E4 — Coverage metric in `evidence:validate` | ✅ complete |
| E5 — Docs + push + PR | in progress |

## Coverage shipped

`npm run evidence:validate` reports:

```
Matcher-engine coverage: 52/52 criteria (100%) — all criteria executable from declarative form.
```

Every active trial's `matcherCriteria` is fully resolvable by the engine
without needing to fall back to legacy logic.

## Test counts

| Suite | Tests |
|---|---|
| `tests/calculators.test.js` | 55 |
| `tests/calculators-extended.test.js` | 54 |
| `tests/institutional-protocols.test.js` | 28 |
| `src/evidence/__tests__/atlas.test.js` | 17 |
| `src/evidence/__tests__/matcher.test.js` | 25 |
| `src/evidence/__tests__/matcher-engine.test.js` (new) | 30 |
| **Total** | **209** |

## Files changed (this sprint)

| Directory | New | Modified |
|---|---|---|
| `src/evidence/` | matcher-engine.js, __tests__/matcher-engine.test.js | 0 |
| `scripts/` | 0 | evidence-validate.mjs (coverage section) |
| `docs/` | evidence-atlas-matcher-engine.md | evidence-atlas-extension-guide.md |
| Root | SPRINT_STATUS_E.md | src/app.jsx (parallel verification block), app.js (rebuild), tailwind.css (rebuild) |

## How to enable parallel verification

In the running app's browser console:

```js
localStorage.setItem('strokeApp:matcherEngineCheck', 'true')
```

Reload. Disagreements log to console as `[matcher-engine] …` warnings.

## Known limitations

- Parallel-verification only. The legacy `TRIAL_ELIGIBILITY_CONFIG` is
  still the canonical source. A follow-up sprint reviews the parity
  telemetry and flips the canonical source.
- The engine evaluates `matcherCriteria` only — not the legacy
  `exclusionFlags`. Exclusion logic remains in `TRIAL_ELIGIBILITY_CONFIG`.
  Promoting exclusion handling is on the next-sprint queue.

## Environment Notes

- Hookify error noise from PreToolUse / PostToolUse hooks remains
  non-blocking and is explicitly ignored.
- Playwright browsers absent → `qa-smoke.mjs` fails on launch
  (pre-existing, intentional per sprint constraints).
