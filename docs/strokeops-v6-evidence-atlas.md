# StrokeOps v6 — Evidence Atlas

This document describes the structured evidence layer added to the stroke
clinical decision-support app in the StrokeOps v6 sprint. It explains the
load-bearing concepts, the data model, the new UI surfaces, and how the
pieces fit with the existing app.

---

## 1. Architecture in three definitions

The split is enforced at the data layer. They link via
`relatedActiveTrialIds` / `relatedCompletedTrialIds` foreign-key arrays.

### Active Trials
Recruiting / open studies. Used for **patient eligibility matching** against
encounter form fields. Living source: `src/evidence/activeTrials.js`. Each
record has a declarative `matcherCriteria` array — the canonical statement of
what the matcher checks — and a `legacyMatcherKey` field that maps back to the
inline `TRIAL_ELIGIBILITY_CONFIG` in `src/app.jsx` for backward compatibility.

### Evidence Atlas
Completed and landmark trials, plus guidelines, recommendations, claims, and
citations. Used for **what does the literature say**. Never used as
eligibility criteria. Lives in:

- `src/evidence/completedTrials.js` — 31 records (WAKE-UP, EXTEND, EPITHET,
  ECASS4-EXTEND, TIMELESS, TWIST, TRACE-III, SELECT2, ANGEL-ASPECT,
  RESCUE-Japan-LIMIT, TENSION, DAWN, DEFUSE-3, AcT, TRACE-2, ORIGINAL,
  INTERACT3, ANNEXA-I, ENRICH, CHANCE, POINT, THALES, INSPIRES, CHANCE-2,
  ELAN, TIMING, AVERROES, ARTESiA, CHOICE, THEIA, ENCHANTED2/MT)
- `src/evidence/citations.js` — 42 citations (sourced primarily from
  `docs/evidence-review-2021-2026.md`)
- `src/evidence/recommendations.js` — 9 guideline-grade recommendations
- `src/evidence/claims.js` — 11 atomic claims
- `src/evidence/guidelines.js` — 7 guideline registry entries
- `src/evidence/topics.js` — 30-topic taxonomy

### Context Bridge
A **one-way** link from completed → active. When an active trial matches the
patient encounter, related completed evidence appears in a clearly labeled
"Background evidence" drawer **at the bottom of the matcher card, never inside
the eligibility criterion list**. Bridge edges are declared on the active
trial via `relatedCompletedTrialIds`. Visually distinct (indigo on slate vs
the matcher card's emerald/amber) so the boundary is unmistakable.

Examples wired in this sprint:
- SISTER → EXTEND, WAKE-UP, TIMELESS, TRACE-III, TWIST
- TESTED → SELECT2, ANGEL-ASPECT, RESCUE-Japan-LIMIT, TENSION
- CAPTIVA → CHANCE, POINT, THALES
- SATURN → INTERACT3, ENRICH
- ASPIRE → AVERROES, ARTESiA
- MOST → AcT, TRACE-2, ORIGINAL
- STEP-EVT → DAWN, DEFUSE-3

---

## 2. New UI surfaces

### `#/trials` — sub-tab toggle

| Sub-view | What it shows | Source |
|---|---|---|
| Active Trials (default) | Existing recruiting-trial matcher behavior, unchanged | Inline `trialsData` + `TRIAL_ELIGIBILITY_CONFIG` |
| Evidence Atlas | 31 completed/landmark trials with topic / certainty / evidence-type filters and search | `src/evidence/completedTrials.js` via `filterCompletedTrials` |

Section toggle, not a hash route — preserves GitHub Pages `/stroke/`
routing. State (`trialsView`, `atlasFilters`) persisted to localStorage so
the clinician returns to their preferred surface.

### Active Trial card — Background evidence drawer

Each matched active trial card now ends with a collapsible
"Background evidence (N)" drawer that lists related completed trials in
compact form. Each compact card has an "Open in Evidence Atlas →" button
that switches the parent sub-view and scrolls to the corresponding atlas
record so clinicians can read full PICO + safety + citations without
losing place.

### Evidence Atlas — Guideline-grade recommendations panel

The Atlas sub-view exposes a "Guideline-grade recommendations" panel
listing the 9 seeded structured recommendations. Each card opens a
"Why this recommendation?" drawer showing class, level of evidence,
guideline source, supporting claims, primary citations with PMID / DOI
links (constructed from structurally validated identifiers; no live
network calls), and explicit caveats.

### Management section — inline drawer

Existing recommendation cards in `#/management/ich` and
`#/management/ischemic` (rendered from the legacy per-section
recommendation data, e.g. `bp_ich_acute`) now show a
"Why this recommendation? (N supporting claims)" inline drawer
whenever the legacy id maps to an atlas recommendation id via
`MANAGEMENT_REC_TO_ATLAS_REC` in `src/app.jsx`.

Initial mappings:

| Legacy id | Atlas recommendation id |
|---|---|
| `bp_ich_acute` | `rec-ich-bp-target` |
| `bp_ich_avoid_low` | `rec-ich-bp-target` |
| `reversal_warfarin` | `rec-ich-anticoag-reversal-warfarin` |
| `reversal_doac_xa` | `rec-ich-anticoag-reversal-fxa` |
| `tnk_dose` | `rec-tnk-first-line` |
| `evt_window` | `rec-evt-late-window` |
| `evt_large_core` | `rec-evt-large-core` |
| `late_window_ivt` | `rec-late-window-ivt` |
| `dapt_minor_stroke` | `rec-dapt-minor-stroke` |
| `af_anticoag_timing` | `rec-af-early-anticoag` |

Adding a new mapping is a one-line edit; the drawer surface is
identical across sections.

---

## 3. New scripts and integration

### `npm run evidence:validate`
Offline structural validator. Slots into `npm test` between
`validate:citations` and `validate:evidence-churn-profiles`. Standalone
runnable. Checks:

- Schema conformance (required fields, enum values)
- Foreign-key resolution (citation, claim, active-trial, completed-trial,
  guideline references)
- Identifier patterns: PMID `^\d{7,9}$`, DOI `^10\.\d{4,9}/...`, NCT `^NCT\d{8}$`
- Class-I-without-supporting-claim warning (auditability)
- Stale-evidence warning when `lastReviewed` >24 months old
- Required `verificationNotes` for `todo-verify` records

### `npm run evidence:export`
Emits to `output/`:
- `evidence-atlas.md` — Markdown atlas summary
- `completed-trials.csv` and `.json`
- `active-trials.csv` and `.json`
- `claim-source-map.md`
- `pico-table.csv`

`output/` was already in `.gitignore`.

### `npm run evidence:validate:json`
Same checks, JSON output for tooling.

### `npm run evidence:export:check`
Validates exports without writing files.

---

## 4. Validation philosophy

Live verification of identifiers (PubMed / DOI / NCT) is the user's
manual review step. The validator does **structural checks only**.
Records with `verificationStatus: 'verified-pubmed'` pass the structural
test that their PMID matches `^\d{7,9}$`; the user must still confirm
the identifier resolves to the cited paper.

Records flagged `unverified-source-limited` or `todo-verify` carry a
`verificationNotes` field explaining what needs human verification.

---

## 5. What was *not* done (intentional)

- **No app rewrite.** The encounter form, calculators, ward census,
  IndexedDB schema and 12-hour expiry, post-tPA timer, LKW countdown,
  quick-link bar, eight note generators, and telestroke-expansion-map
  link all remain unchanged.
- **No live network calls** for evidence verification.
- **No new heavy dependencies.** Pure ES modules + Node built-ins.
- **No browser automation against authenticated sites.**
- **No PHI**; all examples synthetic.

---

## 6. Known limitations

- `qa-smoke.mjs` requires Playwright browsers, which the sprint
  intentionally did not install. The CI pipeline that triggers on PR
  merge still runs the same script, so if the deployment environment
  has Playwright browsers cached this will pass; locally, it is
  expected to fail until `npx playwright install` is run by the user.
- Two completed-trial entries (`theia`, `tencraos-2025`) have
  partial primary-endpoint precision and are flagged
  `unverified-source-limited` / `todo-verify` accordingly.
- The atlas seed contains a topic taxonomy but topics with no records
  attached (e.g. `cadasil`) are intentionally retained for future
  population.
