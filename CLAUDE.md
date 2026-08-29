# Stroke CDS

Public educational demo (GitHub Pages), not an approved clinical system — but clinical-content
correctness matters, because this code may be adapted into approved environments.
Node/CommonJS, no build step for tests. `npm install` once.

## Verify before saying you are done

Do not report work as complete on the strength of reading the diff. Run the checks.

| When | Command | Notes |
|---|---|---|
| Inner loop, after most edits | `npm run test:unit` | 1,711 vitest specs across 55 files, ~16s. (`CONTRIBUTING.md` still says 427 — stale.) |
| Touched content, evidence, or citations | `npm run qa` | 11-stage gate. The real bar. |
| Before opening a PR | `npm run test` && `npm run build` | `test` is the 15-stage superset of `qa`. |

`npm run qa` chains: `check:leak-guard`, `validate:citations`, `validate:inline-citations`,
`evidence:validate`, `content:seed:check`, `content:validate`,
`validate:evidence-churn-profiles`, `validate:qa-latency-profiles`,
`validate:evidence-promotion`, `validate:automedbench-lite`, and `scripts/qa-smoke.mjs`.
It stops at the first failure, so re-run after each fix rather than assuming the rest pass.

**The gate writes to the working tree.** Running `qa` (or `test:unit`) regenerates tracked
artifacts — `app.js`, `tailwind.css`, `content/bundle.json`, `data/atlas/*.json`, `llms*.txt`,
`whats-new.json`. Run `git status` afterwards and `git restore` anything you did not mean to
change; otherwise a verification run silently becomes an 18-file diff.

**Establish the baseline before blaming your change.** Neither gate is green on every branch.
Measured on `jules-approved-integration`, 2026-08-28, with no edits applied:

- `npm run test:unit` — 71 of 1,711 specs fail across 8 files. Mostly the agent-authored
  curriculum audits under `.agents/reviewer_gen2_2/`, plus assertions in
  `tests/adversarial-m4-challenger.test.js` that require being on `main` with a clean tree.
- `npm run qa` — exits 1 at stage 5, `content:seed:check`, which reports ~15 `education/*.md`
  files whose seeds are stale and asks for `npm run content:seed`. Stages 6-11 therefore never
  run; do not assume they pass.

Run both once before you start and compare against that. Do not report a pre-existing failure as
a regression, and do not "fix" one you did not cause.

Also beware the shell trap that hid this: `npm run qa | tail` reports `tail`'s exit code, not
npm's. Check `$?` on the unpiped command, or `${PIPESTATUS[0]}`.

Report failures with the validator's own output. Never edit a validator or a fixture to make a
check go green — if a check looks wrong, say so and stop.

## Hard rules

- **Leak guard.** `npm run check:leak-guard` runs `scripts/check-no-institutional-leak.mjs` over
  tracked files. This repo is public: no institutional identifiers, no real patient data, no
  internal hostnames or paths in anything committed. If the guard trips, fix the content — do not
  narrow the guard.
- **The pre-commit hook needs a private denylist.** `npm run hooks:install` points `core.hooksPath`
  at `.githooks`, whose pre-commit runs `check:leak-guard:staged`. That script hard-fails with
  "private denylist required but no private denylist was loaded" unless
  `STROKE_LEAK_GUARD_PRIVATE_DENYLIST` is set or `scripts/leak-guard-denylist.local.json` exists.
  That file is gitignored and must never be staged — the guard rejects the commit if it is.
  It needs at least one rule under `institutionalTokens`, `identityTokens`, `phiPatterns`,
  `literalDenylist`, or `literalSha256Denylist`; an empty ruleset still fails. Note the split:
  `exemptFiles` only skips institutional rules, while **`fullyExemptFiles`** is what skips a file
  for PHI patterns. `git config --unset core.hooksPath` backs the hook out if needed.

- **Path guard.** Keep build outputs out of the diff: `android/app/build/`,
  `android/app/src/main/assets/public/`, `ios/App/Pods/`, `node_modules/`, and the generated
  `*.br` / `*.gz` / bundled `app.js` artifacts. Source under `android/` and `ios/` is fine.
- `npm run build` regenerates CSS/JS bundles — only commit those when the build is the point.

## Where things live

`docs/evidence-atlas-extension-guide.md` (adding a trial) · `docs/evidence-atlas-matcher-engine.md`
(matcher operators) · `docs/evidence-atlas-schema.md` (data shapes) ·
`docs/sprint-protocol.md` (multi-step refactors) · `CONTRIBUTING.md` (PR requirements) ·
`GATE_STATUS.md` (milestone gate records).
