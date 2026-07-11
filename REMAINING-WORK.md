# Remaining refactor work (Phases 3–4 render integration)

Phases 1, 1.5, 2, and 5 are complete and committed. This file scopes the parts
of Phases 3 (de-duplicate) and 4 (context switch) that require surgery inside
the 36k-line `src/app.jsx` render closure. Those were **deliberately not done
blind** in an autonomous session on a live clinical tool: each step below
changes rendered clinical output and must be executed incrementally, verified in
the browser, and gated by the Example Protocols snapshot lock
(`npm run test:protocol-snapshot`) plus `npm run test:unit`.

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

## Phase 4 — context switch (recommended next, lowest risk)

The primitive is done and tested; wiring is additive.

1. **State + control.** Add `workflowContext` state (`null` = All, else one of
   `WORKFLOW_CONTEXTS`) near the other UI state in `StrokeClinicalTool`
   (~app.jsx 2246). Persist via the existing `uiState`/`navigateTo` seam
   (extend, don't fork — see `clinicalContext` at ~17404). Render a segmented
   control (All / Telestroke / Inpatient / Clinic) in the header shell
   (~app.jsx 16511). Default `null` so nothing is hidden until chosen.
2. **First consumers (no content hidden by default — education/guidelines seed
   to all contexts / `all` setting):**
   - Education gallery (`src/education.jsx` filter at ~471): intersect with
     `filterByContext(getEducation(), workflowContext)`.
   - Guidelines & References tab: reorder/scope guideline recs by
     `getGuidelines(workflowContext)`.
   - Calculator surfacing: reorder the registry by context relevance (do not
     remove any — clinicians need全 access).
3. **Keep global search unfiltered:** the palette/search must pass `context =
   null` (that is exactly what `filterByContext(x, null)` returns). Wire the
   palette to `getSearchIndex()`/`searchContent()` so it indexes all five
   domains at once (Phase 4 "index all data sources").
4. **Clinic rebalance:** author `contexts`/`setting` on the prevention-oriented
   content (secondary prevention, risk-factor optimization, follow-up) so the
   Clinic context surfaces it first. This is a `/content` edit, not code.
5. Verify: switch contexts in the browser, confirm education/guidelines reorder,
   confirm global search still returns everything, snapshot + units green.

## Phase 3 — de-duplicate to canonical sources (incremental, higher risk)

Per REFACTOR_MAP.md §4. Do one concept per commit; re-point only NON-frozen
consumers; leave frozen protocols literal (snapshot-guarded). Priority order:

1. **Calculators still computed inline** (FUNC, ASPECTS, PC-ASPECTS, SPAN-100,
   SEDAN, DRAGON, mTICI, embedded ABC/2) → move into `src/calculators*.js`, add
   to the registry, unit-test each, re-point callers. (Compute already
   centralized; these are the stragglers.) Delete the education `calculateIchScore`
   dup after re-pointing (fix its 94%→97% value only with clinician sign-off).
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
