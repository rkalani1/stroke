# Remaining refactor work

## Done (shipped)

- Phases 1, 1.5, 2, 5, 6 — audit, snapshot lock, `/content` data layer +
  validation, update pipeline, tests/docs.
- **Clinical corrections** (6 audit-flagged factual errors) — THALES duration,
  ICH-score mortality, HINTS peripheral/central, TREAT-CAD non-inferiority,
  osmolar-gap threshold, AF-timing pearl. Locked by
  `tests/clinical-corrections.test.js`. (CVT seizure reviewed — guideline-
  consistent, no change.)
- **Context switch (Phase 4)** — Telestroke/Inpatient/Clinic header control,
  education gallery context filter, and the global command palette now indexes
  all five `/content` data sources. Verified live in the browser.
- **Calculator registry (Phase 3)** — single registry expanded to 34 catalogued
  calculators (all with verified compute exports); the agent-asset generator,
  palette, and data index all derive from it. Dead `calculate4FPCC` removed.
- **AI-provider abstraction bugfix** — repaired a latent ReferenceError
  (undefined `saveToStorage`) that blocked the settings save.

## Still remaining (intentionally deferred — high-risk render surgery)

The items below require surgery inside the 36k-line `src/app.jsx` render closure
and were **deliberately not done blind** on a live clinical tool: each changes
rendered clinical output and must be done incrementally, verified in the browser,
and gated by the Example Protocols snapshot lock
(`npm run test:protocol-snapshot`) plus `npm run test:unit`.

**Why the frozen-zone calculators are still inline:** FUNC / SPAN-100 / SEDAN /
DRAGON / mTICI compute *interactively* inside the frozen `#/protocols/calculators`
subtab. The static snapshot captures default render + modals but does not
exercise every input combination, so extracting their compute could change
interactive output in a way the snapshot wouldn't catch. They are correct today;
extraction needs interactive test coverage first, then per-calculator migration.

Everything here builds on infrastructure that already landed:
- `/content` data layer + `content/bundle.json` (schema-validated, CI-checked).
- `src/content-context.js` — pure, tested access + `filterByContext()` primitive
  (Telestroke/Inpatient/Clinic). Not yet imported by `app.jsx`.
- `content/calculators/registry.json` — the single calculator registry.
- The snapshot lock over `#/protocols/*` (the byte-frozen zone).

## Ground rules for every step

1. Never change Example Protocols wording. After each commit,
   `npm run test:protocol-snapshot` must stay green. Any intentional protocols
   change is a separate, reviewed `test:protocol-snapshot:update` commit.
2. Preserve guardrails (REFACTOR_MAP.md §8): `PUBLIC_DEMO_MODE`, copy PHI guard,
   demo note disclaimer, export gating, de-ID scan, storage sanitizers/TTL,
   "verify against local protocol" framing, TNK safety hard-blocks, and the
   AI-provider abstraction (form/validation/localStorage/mock default).
3. Do not reuse the legacy `clinic`/`wards` route alias tokens for the new
   context switch (they still redirect to `ischemic` — REFACTOR_MAP §1).
4. Verify in the browser (preview + read_page/console) before committing.

## Context switch — follow-on polish (feature shipped)

The switch, education filter, and unified palette are shipped. Remaining polish:
1. **Guidelines & References reorder** by `getGuidelines(workflowContext)` (the
   accessor exists; the tab render isn't yet context-ordered).
2. **Calculator surfacing** reorder by context relevance (never remove — the
   registry stays fully accessible).
3. **Clinic rebalance:** narrow `contexts`/`setting` on prevention-oriented
   content (secondary prevention, risk-factor optimization, follow-up) so Clinic
   surfaces it first — a `/content` edit, not code. Until narrowed, education
   defaults to all three contexts (hides nothing).

## Phase 3 — de-duplicate to canonical sources (incremental, higher risk)

Per REFACTOR_MAP.md §4. Do one concept per commit; re-point only NON-frozen
consumers; leave frozen protocols literal (snapshot-guarded). Priority order:

1. **Calculators still computed inline** (FUNC, SPAN-100, SEDAN, DRAGON, mTICI,
   embedded ABC/2) → move into `src/calculators*.js`, register, re-point callers.
   These render *interactively* inside the frozen protocols calculators subtab,
   so add interactive test coverage before extracting (the static snapshot won't
   catch an input-dependent output change). The education `calculateIchScore`
   dup has an incompatible `gcsCategory` signature; reconcile to the canonical
   `calculators.js:calculateICHScore` and re-point the education render (its
   mortality value is already corrected to 97%).
2. **Stray citations** → route every inline PMID/DOI through
   `src/evidence/citations.js` by id, education.jsx first (87 hits, INSPIRES
   drifted 3 ways). Extend `validate-inline-citations`.
3. **Canonical records** for osmotherapy/ICP, HINTS, CVT, prognosis bands, BP
   targets + one monitoring cadence, anticoagulant reversal, DAPT + AF-timing,
   CeAD → `/content` (or the designated module); re-point non-frozen consumers.
4. **Trials** — collapse the 4 representations (activeTrials / screenerTrials /
   eligibilityTables / screener) to one canonical source + derived views.
5. **Note generators** — collapse `generateTelestrokeNoteBody` (~2950 lines, 7
   branches) to a section registry (verbose/concise/patient renderers).

## Clinical review REQUIRED before any of these (do not auto-apply)

The audit surfaced content bugs and contradictions. These are clinical-value
changes a clinician must approve — they were **not** applied by the refactor.
See "Clinical review queue" in REFACTOR_MAP.md §4 and the summary below:

- EvdIcpSimulator osmolar-gap hold `>55` vs `>20` everywhere else.
- teaching.js:182 HINTS peripheral/central wording (contradicts its own card).
- education ICH score-4 mortality `94%` vs `97%` (Hemphill).
- app.jsx:19446 THALES labeled "90 days" (trial is 30 days).
- TREAT-CAD "non-inferior" overstatement (landmark-trials.json:398,
  components.jsx:543) — education card correctly says non-inferiority NOT met.
- CVT seizure prophylaxis: protocol "not recommended" vs order-set prescribes
  levetiracetam.
- ≥4 incompatible AF-anticoagulation-timing schemes to reconcile.

When de-duplicating, seed the canonical record from the source that matches the
authoritative guideline/primary trial, record the divergence in
`content/CHANGELOG.md`, and get clinician sign-off before changing any shipped
clinical value. Frozen protocols values never change here.

## Phase 6 remainder covered elsewhere

Tests (schema, PMID format, snapshot lock, calculator units), a11y pass, and the
README architecture + 5-minute update guide are addressed in the README and
CONTRIBUTING-content.md; the snapshot lock, content schema tests, and
content-context tests are already in CI.
