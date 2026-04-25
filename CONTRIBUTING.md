# Contributing to Stroke CDS

Thanks for considering a contribution. This is a clinical
decision-support tool used in real patient care, so the bar for
correctness is high.

## Quick start

```bash
git clone https://github.com/rkalani1/stroke.git
cd stroke
npm install
npm run test:unit   # 427 vitest tests, ~1s
npm run build       # CSS + JS bundle
```

## Workflows

| You're doing... | Read |
|---|---|
| Adding a new clinical trial to the matcher / Atlas | [`docs/evidence-atlas-extension-guide.md`](docs/evidence-atlas-extension-guide.md) |
| Adding a new matcher operator or field resolver | [`docs/evidence-atlas-matcher-engine.md`](docs/evidence-atlas-matcher-engine.md) |
| Understanding the Atlas data shapes | [`docs/evidence-atlas-schema.md`](docs/evidence-atlas-schema.md) |
| Verifying a `todo-verify` evidence record | [`docs/evidence-verification-worklist.md`](docs/evidence-verification-worklist.md) |
| Doing a multi-step refactor | [`docs/sprint-protocol.md`](docs/sprint-protocol.md) (the StrokeOps v6 stacked-sprint pattern) |
| Reporting a security issue | [`SECURITY.md`](SECURITY.md) |

## Required for every PR

1. **Tests pass**: `npm run test:unit` (427 specs across calculators,
   atlas, matcher engine, scenario snapshots).
2. **Validators clean**: `npm run validate:citations` and
   `npm run evidence:validate` (the latter reports matcher-engine
   coverage; should remain 100%).
3. **Build succeeds**: `npm run build`.
4. **Path guard satisfied**: no `android/app/build/`,
   `android/app/src/main/assets/public/`, `ios/App/Pods/`,
   `node_modules/`, or other build outputs in the diff. Source files
   under `android/` or `ios/` are fine. CI enforces this via
   `.github/workflows/main-pathguard.yml`.

## Clinical-correctness expectations

- **Cite primary sources** for any new evidence claim. Add to
  `src/evidence/citations.js` with a structurally valid PMID
  (`^\d{7,9}$`), DOI (`^10\.\d{4,9}/...`), or NCT (`^NCT\d{8}$`).
  Live identifier verification is a manual step — see
  `docs/evidence-verification-worklist.md`.
- **No mock identifiers**. If a real PMID/DOI isn't available, mark
  `verificationStatus: 'todo-verify'` with a `verificationNotes` field
  describing what needs verification.
- **Synthetic test data only**. No PHI in tests, scenarios, or fixtures.
- **Tri-state criterion semantics**: a matcher criterion returns
  `met` / `not_met` / `unknown`. Empty / undefined source data should
  be `unknown`, not `not_met`. See
  `src/evidence/matcher-helpers.js` (`pickEncounterField`,
  `boolEq`, `numInRange`, etc.).
- **Class I recommendations require supporting claims** (the
  validator emits a non-fatal warning otherwise — auditability check).

## Hard constraints (from the original sprint guidance, still in force)

- No app rewrite. Refactor and extend only.
- Preserve existing routes, calculators, IndexedDB ward census,
  post-tPA timer, LKW countdown, quick-link bar, note generators,
  telestroke-expansion-map link, the non-medical-advice and
  institutional-non-endorsement disclaimers.
- Hash-routing under `/stroke/` for GitHub Pages.
- No new heavy dependencies.
- No PHI; synthetic data only.
- No live network calls for evidence verification — validators do
  structural checks only.
- No browser automation against authenticated sites.
- Existing aria-labels, keyboard navigation, focus management
  preserved.

## Pull-request checklist

PRs use the template at `.github/PULL_REQUEST_TEMPLATE.md`. The
short version:

- [ ] `npm run test:unit` is green
- [ ] `npm run evidence:validate` is clean (52/52 + 16/16 = 100% if you touched the matcher)
- [ ] `npm run build` succeeds
- [ ] No PHI in tests / scenarios / commit messages
- [ ] No mobile-wrapper build artifacts on main (CI guards this)
- [ ] If clinical content changed, primary sources cited in the PR description
