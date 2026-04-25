# Stacked-sprint protocol

The StrokeOps v6 Evidence Atlas series (PRs #10 → #14, integrating PR #16) demonstrated a stacked-sprint pattern that worked well for a large refactor of `src/app.jsx`. This doc captures the protocol so future agents (or developers) can repeat it.

## When to use

For a refactor or feature that:
- Touches a single file heavily (>500 LOC of changes)
- Has a clear architectural progression with intermediate milestones
- Benefits from per-step PR review (each step is itself reviewable)
- Risks merge conflicts if done as one big PR

## The pattern

1. **Plan the architectural sequence first.** What's the end state? What are the intermediate states that are themselves coherent and shippable?
2. **Branch off `main` for the first sprint.** Each sprint = one PR. The first PR's base is `main`.
3. **Stack subsequent sprints.** PR #N+1's base is PR #N's branch (not `main`). Use `gh pr create --base feature/sprint-N --head feature/sprint-N+1`.
4. **Each PR carries:**
   - One coherent architectural change
   - Tests proving the change works in isolation
   - A `SPRINT_STATUS_X.md` chronology (X = sprint identifier)
   - A status-reflective commit message explaining the architectural step
5. **Land via combined-merge PR when the stack is complete.** Cherry-picking five stacked PRs through a `main` that has moved meanwhile is painful. Instead:
   - Create a new branch off the current `main`
   - Merge in the tip of the stack
   - Resolve any conflicts (often only the bundled artifact, e.g. `app.js`)
   - Open a single combined PR
   - Merge the combined PR to land everything at once
   - Close (don't merge) the underlying stacked PRs — their work is already on main via the combined PR; they remain as sprint-history archaeology.

## What worked

- **Each sprint had < 30 minutes of clean execution time** when the working tree was stable.
- **Programmatic parity testing** (PR #12's `parity.test.js`) made the legacy retirement low-risk: 210 tests proved engine and legacy agreed before deletion.
- **Frozen snapshots** (PR #14's `scenario-snapshot.test.js`) replaced parity tests once the legacy was gone, preserving regression coverage.
- **Per-sprint validators** (`evidence:validate` reports criteria + exclusion coverage) gave a single-line "is the architecture done?" signal.

## What didn't work

- **Concurrent local development on a different branch** caused repeated working-tree disruption. The agent's bash commands kept getting interrupted by branch switches. Mitigation: do all multi-step work in a single bash invocation.
- **Default `git stash pop` (no args)** popped a stash from a different branch and leaked Capacitor wrapper artifacts to `main`. Mitigation: always `git stash pop stash@{N}` with explicit ref, and `git stash show -p stash@{0}` before popping when multiple stashes exist.
- **Forgetting to update tests after fixing the underlying code** (PR #20 fixed RHAPSODY semantics but didn't update the `resolveField` test expectation; PR #21 cleaned that up). Mitigation: when a bug fix changes a function's contract, grep the test suite for the function name and update assertions in the same PR.

## Sprint counts (StrokeOps v6 series)

| PR | Sprint | LOC | Tests added |
|---|---|---|---|
| #10 | Evidence Atlas (initial seed) | +5,631 / -692 | +17 |
| #11 | Matcher engine (parallel verification) | +1,152 / -163 | +30 |
| #12 | Legacy extraction + parity + canonical flag | +1,571 / -978 | +133 |
| #13 | Exclusion promotion + full parity | +517 / -128 | +7 |
| #14 | Legacy retirement | +2,308 / -1,777 | +1 (211 replace 210) |
| #16 | Combined merge to current main | (integrating) | (no new tests) |
| #20 | RHAPSODY needs_info fix | +22 / -15 | (snapshot regen) |
| #21 | RHAPSODY test followup | +5 / -2 | +1 |
| #22 | Post-merge housekeeping | (deletes 43 leaked + adds CI guard + version bump + README) | — |
| #23 | Refine pathguard for PR #18 | +42 / -9 | — |
| #18 | Capacitor native-wrapper scaffold | +2,954 / -2 | — |

Total: ~14,000 LOC churn / +273 tests / 11 PRs over a single working session.
