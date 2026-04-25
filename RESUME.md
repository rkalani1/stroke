# RESUME — picking up StrokeOps v6 work

Pickup notes for any future Claude Code session that returns to this
branch. Read this first; it's a 2-minute orientation.

## Where you are

- **Branch:** `feature/strokeops-v6-evidence-atlas`
- **Latest sprint commit:** see `git log --oneline feature/strokeops-v6-evidence-atlas ^main`
- **All ten implementation phases shipped.** The remaining work in the
  current sprint is Phase 11: push the branch and open a PR (see below).

## Quick verify

```bash
npm run evidence:validate     # → 11 active, 31 completed, 42 cit, 9 rec, 11 claims, 7 gl, 30 topics; clean
npm run test:unit             # → 179/179
npm run build                 # → 2.5 MB bundle clean
npm test                      # → all five validators pass; qa-smoke fails on missing Playwright browsers (pre-existing)
```

## Architecture in one diagram

```
┌──────────────────────────┐    ┌──────────────────────────┐
│   Active trials          │    │  Evidence Atlas          │
│   (recruiting)           │    │  (completed + landmark)  │
│                          │    │                          │
│  src/evidence/           │    │  src/evidence/           │
│    activeTrials.js       │◄───│    completedTrials.js    │
│                          │    │                          │
│  Used for ELIGIBILITY    │    │  Used for LITERATURE     │
│  matching against        │    │  context. Never used     │
│  encounter form          │    │  as eligibility.         │
└────────┬─────────────────┘    └──────────┬───────────────┘
         │                                 │
         │  Context Bridge (one-way ←)     │
         │  via relatedCompletedTrialIds   │
         └─────────────────────────────────┘

┌──────────────────────────┐
│  Recommendations         │   recommendations cite claims;
│    src/evidence/         │   claims cite citations.
│      recommendations.js  │   The "Why this recommendation?"
│      claims.js           │   drawer walks the chain.
│      citations.js        │
└──────────────────────────┘
```

## Where things live

| Concern | File |
|---|---|
| Schema + factories + validators | `src/evidence/schema.js` |
| Active trials | `src/evidence/activeTrials.js` |
| Completed / landmark trials | `src/evidence/completedTrials.js` |
| Citations | `src/evidence/citations.js` |
| Recommendations | `src/evidence/recommendations.js` |
| Claims | `src/evidence/claims.js` |
| Guidelines | `src/evidence/guidelines.js` |
| Topics | `src/evidence/topics.js` |
| Barrel + queries + label maps | `src/evidence/index.js` |
| Matcher field-binding helpers | `src/evidence/matcher-helpers.js` |
| Validator | `scripts/evidence-validate.mjs` |
| Exporter | `scripts/evidence-export.mjs` |
| Architecture overview | `docs/strokeops-v6-evidence-atlas.md` |
| Schema reference | `docs/evidence-atlas-schema.md` |
| Extension guide (how to add a trial / rec / topic) | `docs/evidence-atlas-extension-guide.md` |
| UI — sub-tab toggle | `src/app.jsx` (search `trialsView`) |
| UI — Context Bridge drawer | `src/app.jsx` (search `Context Bridge`) |
| UI — recommendation drawer + legacy-id map | `src/app.jsx` (search `MANAGEMENT_REC_TO_ATLAS_REC`) |

## What's next (priority order)

1. **Phase 11 — push and open PR.** From this branch:
   ```bash
   git push -u origin feature/strokeops-v6-evidence-atlas
   gh pr create --draft --base main \
     --title "feat: StrokeOps v6 Evidence Atlas — structured evidence data layer with Active/Atlas split and context bridge" \
     --body-file <(cat <<'EOF'
     ... see PR body in SPRINT_STATUS.md ...
   EOF
   )
   ```
   The user will mark the PR ready for review and merge.

2. **Manual identifier verification** for records currently flagged
   `unverified-source-limited` or `todo-verify`:
   - `cit-theia-2023` — DOI present, partial endpoint precision
   - `cit-tencraos-2025` — referenced in repo content, no PMID/DOI yet
   - any `completedTrials` whose `verificationStatus !== 'verified-pubmed'`

3. **Extend `MANAGEMENT_REC_TO_ATLAS_REC`** to cover more legacy
   recommendation ids. Each new entry is a one-line edit; the drawer
   appears automatically. See `docs/evidence-atlas-extension-guide.md`
   §"Apply the recommendation drawer to a new Management section".

4. **Promote the structured matcherCriteria to drive evaluation.** Today
   the matcher still evaluates from `TRIAL_ELIGIBILITY_CONFIG` in
   `src/app.jsx`; the `matcherCriteria` array on each active trial is a
   declarative mirror. A future sprint could collapse the two by writing a
   small generic evaluator that consumes `matcherCriteria` directly and
   retiring the inline config.

5. **Apply the inline drawer pattern to additional Management surfaces**
   that don't pass through the shared recommendation card render. The JSX
   block is ~40 lines; copy and adapt.

## Hard constraints (still in force for any follow-up sprint)

- No app rewrite — refactor and extend only.
- Preserve all existing routes, calculators, IndexedDB ward census schema
  and 12-hour expiry, post-tPA timer, LKW countdown, quick-link bar,
  eight note generators, telestroke-expansion-map link, all disclaimers.
- Hash-routing under `/stroke/` for GitHub Pages.
- No new heavy dependencies.
- No PHI; synthetic data only.
- No live network calls for evidence verification.
- No browser automation against authenticated sites.
- Existing aria-labels, keyboard navigation, focus management preserved.

## Known limitations

- `qa-smoke.mjs` fails locally without Playwright browsers (pre-existing
  per sprint constraint). Run `npx playwright install` if local
  end-to-end smoke is needed.
- Two trial entries (`theia`, plus the `cit-tencraos-2025` citation)
  carry partial endpoint precision and are flagged `todo-verify` /
  `unverified-source-limited`. The validator emits no errors for them;
  they are explicit handoffs to the user for manual PMID/DOI lookup.

## Sprint commits (as of last save)

```
538f30a chore(qa): full validation, test, and build pass
9ccdd14 feat(management): evidence drawer for representative recommendations
fac983f fix(matcher): correct field bindings and audit banner rendering
b4343b1 feat(matcher): context bridge from active trials to related completed evidence
4be1331 feat(trials): split Active Trials and Evidence Atlas sub-views
8205013 feat(evidence-atlas): add structural validator, exports, and unit tests
c4c02b0 feat(evidence-atlas): introduce structured evidence data layer with seed records
c95c9d9 chore(sprint): initialize StrokeOps v6 sprint with baseline status
```

## Final report (printed to stdout at end-of-sprint)

See SPRINT_STATUS.md for the canonical run report.
