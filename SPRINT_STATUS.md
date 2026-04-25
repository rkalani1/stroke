# SPRINT_STATUS.md — StrokeOps v6 Evidence Atlas

**Start time:** 2026-04-25T01:30:00Z
**Branch:** `feature/strokeops-v6-evidence-atlas`
**Baseline commit:** f3b20f6 (reorder quick links: ChatGPT first)
**Repo version:** 5.19.3

## Phase tracker

| Phase | Status |
|---|---|
| 1 — Inspect & baseline | ✅ complete |
| 2 — Evidence data layer | ⏳ in progress |
| 3 — Migrate hardcoded trials | pending |
| 4 — Validators + exports | pending |
| 5 — Trials tab refactor | pending |
| 6 — Context Bridge | pending |
| 7 — Matcher binding fixes | pending |
| 8 — Recommendation evidence drawer | pending |
| 9 — QA | pending |
| 10 — Documentation | pending |
| 11 — Push + PR | pending |

## Baseline state (Phase 1)

- `npm run validate:citations` — PASS (24 rows, 2021-2026)
- `npm run validate:evidence-churn-profiles` — PASS (3 profiles)
- `npm run validate:qa-latency-profiles` — PASS (2 profiles)
- `npm run validate:evidence-promotion` — PASS (11 high-priority PMIDs)
- `node ./scripts/qa-smoke.mjs --local-only` — FAIL (Playwright browsers not installed; pre-existing limitation per sprint constraint "do not install Playwright browsers")
- `npm run build` — PASS (CSS + JS, 2.4 MB bundle)

Active trial data lives inline in `src/app.jsx`:
- `trialsData` object at line ~2383 (display data)
- `TRIAL_ELIGIBILITY_CONFIG` object at line ~3100 (matcher logic)

Existing evidence content sources:
- `docs/evidence-review-2021-2026.md` — 24-row landmark trial citation table (2021-2026)
- `docs/evidence-watchlist.md`, `docs/evidence-promotion-checklist.md`, `docs/gap-matrix.md` — promotion pipeline
- 22+ calculators in `src/calculators.js`, `src/calculators-extended.js`
- Institutional protocols in `src/institutional-protocols.js`

## Environment Notes

- `Hookify import error: No module named 'hookify'` appears on every tool call from PreToolUse / PostToolUse / UserPromptSubmit hooks. This is a non-blocking hook configuration issue and is being explicitly ignored per continuation prompt.
- macOS `timeout` is unavailable; do not wrap commands with it.
- Playwright browsers absent; `qa-smoke.mjs` fails on launch — pre-existing and intentional per sprint constraints.

## Assumptions

1. Evidence data layer is implemented as ES modules under `src/evidence/` (non-bundled JSDoc + plain objects), keeping in line with the existing `src/calculators.js` and `src/institutional-protocols.js` style. No TypeScript.
2. The existing inline `trialsData` and `TRIAL_ELIGIBILITY_CONFIG` will continue to work from `src/app.jsx`; the refactor wires the Trials tab UI through the new structured data, but the legacy objects can act as a thin compatibility layer during transition.
3. Migration uses existing inline trial criteria as canonical for active trials, since those are what the matcher already targets. Completed-trial seed data is sourced from `docs/evidence-review-2021-2026.md` (PMID-verified table) and existing inline references in Management content.
4. `lastReviewed` defaults to `2026-04-25` for newly migrated records when no other date is documented.
5. `verificationStatus` is set to `verified-pubmed` when an entry has a structurally valid PMID in the existing citation table; `unverified-source-limited` otherwise.
6. Evidence Atlas sub-tab is implemented as a section toggle inside the existing `#/trials` route to avoid touching hash-routing infrastructure (per the sprint's fall-back guidance).
7. The new `evidence:validate` script integrates into `package.json`'s `test` chain after `validate:citations` and before `validate:evidence-churn-profiles`.

## Blockers

(none yet)

## Commits this sprint

(populated as work proceeds)
