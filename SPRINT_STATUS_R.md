# SPRINT_STATUS_R.md — Legacy retirement sprint

Fifth sprint after the StrokeOps v6 Evidence Atlas. Stacks on
`feature/strokeops-v6-exclusions` (PR #13). Deletes the legacy
`TRIAL_ELIGIBILITY_CONFIG` and inline evaluators, flips the engine to
unconditional canonical, replaces the engine-vs-legacy parity suite
with a frozen snapshot regression suite.

## Phase tracker

| Phase | Status |
|---|---|
| R1 — Convert parity test to snapshot | ✅ complete |
| R2 — Flip canonical + delete legacy | ✅ complete |
| R3 — Docs + push + PR | ✅ complete |

## What shipped

- **`src/evidence/legacy-criteria.js`: deleted.** ~470 lines retired.
- **`src/app.jsx`: 9 TRIAL_ELIGIBILITY_CONFIG consumers replaced** with
  reads from `evidenceActiveTrials` (the structured atlas). Matcher
  useEffect now drives off `evaluateAllTrialsViaEngine` unconditionally;
  the canonical-source flag and the parallel-verification block are
  removed.
- **`src/evidence/schema.js` + `activeTrials.js`**: `keyTakeaways`,
  `lookingFor`, `category` migrated from the legacy config into the
  atlas as first-class fields on every active trial.
- **`src/evidence/__tests__/scenario-snapshot.test.js`** replaces the
  former `parity.test.js`. Same 19 patient scenarios × 11 trials = 209
  per-trial assertions + 2 structural tests = **211 frozen snapshot
  tests**. The snapshot in `expected-snapshot.js` was captured when
  engine and legacy were in full parity.

## How to regenerate the snapshot

```bash
node /tmp/retire-legacy.mjs    # idempotent; rewrites schema/active/snapshot
```

## Known limitations

- The matcher engine evaluates only `matcherCriteria` and
  `matcherExclusions`. SATURN's legacy `deepICH` exclusion was
  structurally broken (boolean check on a string field) and the
  faithful never-trigger semantics were preserved during exclusion
  promotion.
- The snapshot tests guarantee per-trial **status** parity, not full
  per-criterion id parity. The engine keys criteria by `field`; the
  legacy keyed them by semantic id (`noTNK`, `timeWindow`, etc.). The
  snapshot tests verify the user-visible decision (`eligible` /
  `needs_info` / `not_eligible`) plus exclusion count, which is what
  the matcher card actually displays.
