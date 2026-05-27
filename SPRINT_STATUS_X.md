# SPRINT_STATUS_X.md — Exclusions sprint

Fourth sprint after the StrokeOps v6 Evidence Atlas. Stacks on
`feature/strokeops-v6-legacy-extraction` (PR #12).

**Start time:** 2026-04-25T03:08Z
**Branch:** `feature/strokeops-v6-exclusions`

## Goal

Promote `exclusionFlags` from the legacy `TRIAL_ELIGIBILITY_CONFIG`
into the structured atlas as `matcherExclusions`. Extend the engine
to evaluate them. Strengthen the parity test suite by adding scenarios
that fire exclusions and removing the previous sprint's
"legacy-only" tolerance carve-out. Result: 100% engine coverage of
both criteria and exclusions, plus an enforced parity invariant
across every supported scenario.

## Phase tracker

| Phase | Status |
|---|---|
| X1 — Schema + data migration | ✅ complete |
| X2 — Engine evaluates exclusions | ✅ complete |
| X3 — Exclusion-triggering parity scenarios | ✅ complete |
| X4 — Validator coverage + docs + PR | in progress |

## What shipped

### X1 — Schema + data migration

- `schema.js`: `makeActiveTrial` factory now includes
  `matcherExclusions` array. Each entry has the same `{ id, field,
  operator, value, label }` shape as `matcherCriteria`, with default
  `operator: '=='`, `value: true`.
- `activeTrials.js`: every trial now has `matcherExclusions`
  populated. **16 exclusion entries across 11 trials**, faithfully
  translated from the legacy `exclusionFlags`. SISTER's custom
  `onAnticoag` evaluator (`!!data.telestrokeNote?.lastDOACType`) is
  expressed as `{ field: 'lastDOACType', operator: 'truthy' }`.
- SATURN's legacy `deepICH` exclusion was structurally broken
  (default `data.ichLocation === true` never fires because
  `ichLocation` is a string). Migration faithfully preserves that
  never-trigger behavior; the exclusion record carries a comment
  marking it for future cleanup.

### X2 — Engine evaluates exclusions

- `matcher-engine.js`: added 13 exclusion-only field resolvers
  (`priorStroke90d`, `priorICH`, `pregnancy`, `hemorrhage`,
  `mechValve`, `seizures`, `implants`, `preDementia`,
  `cardioembolic`, `onAnticoag`, `recentMI`, `lastDOACType`).
- New `truthy` operator for `!!field` checks. Returns `true` when
  resolved value is JS-truthy (and not an empty string), else
  `false`. Never returns `null` — for exclusion semantics, "field
  absent" means "exclusion not triggered", which is a definite
  false rather than unknown.
- `evaluateActiveTrial`: also evaluates `matcherExclusions`. Any
  triggered exclusion forces overall status to `not_eligible` and
  populates an `exclusions` array on the result.
- `evaluateAllTrialsViaEngine`: now returns a populated
  `exclusions` array in each per-trial result, matching the legacy
  UI shape exactly.
- `coverageReport`: tracks criteria and exclusions separately.

### X3 — Exclusion-triggering parity scenarios

- `parity.test.js`: added 7 new scenarios that take a baseline-
  eligible patient and flip a single exclusion flag (priorStroke90d,
  priorICH, lastDOACType, pregnancy, hemorrhage, mechValve,
  cardioembolic). Both legacy and engine must now downgrade to
  `not_eligible`.
- Removed the `legacyIsExclusionOnly` carve-out from the previous
  sprint. Parity is now strict: per-criterion AND overall status
  must agree across every (scenario, trial) pair.
- **Total scenarios:** 19 (was 12). **Parity tests:** 210 (was
  133).

### X4 — Validator + docs

- `evidence:validate` output now reports exclusions coverage
  alongside criteria coverage:
  `Matcher-engine coverage: 52/52 criteria (100%) + 16/16
  exclusions (100%) — all criteria and exclusions executable from
  declarative form.`

## Test counts

| Suite | Tests | Δ vs prior sprint |
|---|---|---|
| `tests/calculators.test.js` | 55 | — |
| `tests/calculators-extended.test.js` | 54 | — |
| `tests/institutional-protocols.test.js` | 28 | — |
| `src/evidence/__tests__/atlas.test.js` | 17 | — |
| `src/evidence/__tests__/matcher.test.js` | 25 | — |
| `src/evidence/__tests__/matcher-engine.test.js` | 37 | +7 |
| `src/evidence/__tests__/parity.test.js` | 210 | +77 |
| **Total** | **426** | **+84** |

## Coverage

- `matcherCriteria`: **52/52 (100%)** — unchanged from prior sprint.
- `matcherExclusions`: **16/16 (100%)** — new this sprint.

## Files added / changed

| Directory | New | Modified |
|---|---|---|
| `src/evidence/` | 0 | activeTrials.js (+~80 lines), schema.js, matcher-engine.js, __tests__/matcher-engine.test.js, __tests__/parity.test.js |
| `scripts/` | 0 | evidence-validate.mjs (exclusion-coverage line) |
| Root | SPRINT_STATUS_X.md | app.js (rebuild), tailwind.css (rebuild) |

## Path to legacy retirement

With this sprint complete, the engine handles **everything** the legacy
evaluator handles:
- 52/52 inclusion criteria
- 16/16 exclusions
- Identical UI output shape
- Per-criterion AND overall-status parity across 19 scenarios × 11
  trials (210 assertions)

The next sprint can flip the canonical-source flag's default to
`true`, then delete `legacy-criteria.js` (~470 lines) plus the
`evaluateAllTrials` import in `src/app.jsx`. The parity test suite
remains in CI as a regression guard during and after the deletion.

## Environment Notes

- Hookify error noise from PreToolUse / PostToolUse hooks remains
  non-blocking; ignored.
- Playwright browsers absent → `qa-smoke.mjs` fails on launch
  (pre-existing).
