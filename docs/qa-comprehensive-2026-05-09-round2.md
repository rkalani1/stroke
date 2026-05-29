# Comprehensive QA Audit (Round 2) — Stroke CDS v5.33.0

**Auditor**: Claude (Opus 4.7)
**Date**: 2026-05-09
**Branch**: `claude/comprehensive-qa-testing-j8m9F`
**Scope**: Second-pass deep audit, expanding on the 2026-05-09 round 1 audit (`docs/qa-comprehensive-2026-05-09.md`). Focused on areas only sampled previously — every completed/active trial, every guideline JSON, every uncovered calculator, doc/code drift, dead code, PWA / service worker, accessibility.

---

## TL;DR

After v5.32.0 closed the round-1 high-severity findings, this round pushed coverage further:
- **507/507 tests pass** (was 486 — added 21 new probes for previously-uncovered functions and the corrected mRS-9Q)
- **All 6 validators pass**, including the new inline-citations validator
- **No patient-safety-critical defects** identified.

This release (v5.33.0) lands **9 fixes** spanning calculator correctness, atlas accuracy, dead-code removal, PWA bundle hygiene, and version-string consistency.

**Overall site grade: A (clinical accuracy), A (engineering rigor), A (auditability), A− (scholarly transparency).**

---

## Round-2 Findings & Fixes

### 🟠 R2-H1 — `interpretMRS9Q` had a clinically-incorrect mRS 3 vs mRS 4 boundary

`src/calculators-extended.js:350` — when `q5WalkingUnaided === false` (patient cannot walk without assistance), the function returned `mrs: 3` with the description "able to walk unassisted." That's an **internal contradiction**: the trigger fires precisely when the patient *cannot* walk unassisted, yet the description says they can. Per the published mRS scale (van Swieten 1988):

- **mRS 3**: requires some help BUT able to walk WITHOUT assistance
- **mRS 4**: unable to walk unaided AND unable to attend to own bodily needs

A patient who "needs aid to walk" should map to mRS 4, not mRS 3. The previous code would silently under-disability-score these patients in any tool consuming this function (e.g., for cohort selection, eligibility gates, or note-generator prefill).

**Fix**: rewrote with proper precedence — mRS 5 → mRS 4 (constant care OR cannot walk OR walks only with aid) → mRS 3 (walks unaided + bowel/bladder/dressing help) → mRS 2 → mRS 1 → mRS 0. Added 8 unit tests covering each boundary.

### 🟡 R2-M1 — Atlas content drift across 5 completed trials

Population strings on completed trials carried imprecise or unit-confusing phrasing that would be flagged in any peer review of the export artifacts:

| Trial | Field | Was | Fixed to |
|---|---|---|---|
| TRACE-2 | nihssRange | `NIHSS not >25` | `NIHSS ≤25` |
| EXTEND | ageRange | `≥18` | `18-80` (matches Ma NEJM 2019) |
| TIMELESS | ageRange / NIHSS | `≥18 / ≥5` | `18-85 / 5-25` |
| TRACE-III | ageRange / NIHSS | `≥18 / ≥6` | `18-80 / 6-25` |
| ENCHANTED2/MT | topic | `evt-late-window` (semantically wrong — this is BP-after-EVT) | new dedicated `bp-post-evt` topic; `cl-bp-post-evt-conventional` claim retopiced too |

The new `bp-post-evt` topic was added to `src/evidence/topics.js` and the post-EVT BP claim's topic updated to match. Topic count: 30 → 31.

### 🟡 R2-M2 — `dmvoEVTAdvisory` brittle string match

`src/calculators-extended.js:759` — was checking `loc.includes('M2-DIST')` as the only synonym for distal-M2 occlusion. A clinician writing "distal M2", "M2 distal", or "M2D" in the location field would silently bypass the DMVO advisory (which references the 2025 negative DISTAL/ESCAPE-MeVO/DISCOUNT trials).

**Fix**: normalized whitespace/underscores to hyphens; expanded synonym list to `['M2-DIST', 'M2-DISTAL', 'M2D', 'DISTAL-M2', 'M3', 'M4', 'A2', 'A3', 'P2', 'P3']`. 5 new probe tests cover the synonyms.

### 🟡 R2-M4 — Note-generator inconsistency: progress note used raw ISO dates; signout note dropped LKW date

- **Progress note** (`src/app.jsx:9936`) — `lkwParts.push(`LKW: ${telestrokeNote.lkwDate} ${formatTime(telestrokeNote.lkwTime)}`)` printed the raw ISO date string (`2026-05-09`) instead of `formatDate(...)` (`5/9/26`) like every other note generator. Same for `discoveryDate`.
- **Signout note** (`src/app.jsx:9443`) — `LKW: ${formatTime(telestrokeNote.lkwTime) || '___'}` printed time only with **no date** — clinically misleading for any patient whose LKW is not today.

**Fix**: routed all three through `formatDate()`; signout note now joins `formatDate(lkwDate)` + `formatTime(lkwTime)`.

### 🟢 R2-L1 — Service-worker precaching dead CDN assets

`service-worker.js:15` — `CDN_ASSETS` precached `react@18`, `react-dom@18`, and `lucide@0.563.0` from unpkg. These are all bundled into `app.js` by esbuild; nothing in `index.html` actually loads them. Each entry was a wasted HTTP roundtrip on first install (4 → 1 with the fix). Only `legacy document-export library` is genuinely lazy-loaded from CDN at runtime.

### 🟢 R2-L2 — Version string drift inside index.html inline script

`index.html:711` — an inline IIFE bootstrap script kept its own `const APP_VERSION = 'v5.31.0'` for storage migration / cache invalidation, while every other version reference (cache-busting query strings, service-worker, package.json) had been bumped to 5.32.0. This script runs **before React loads** to clean stale localStorage; an out-of-date constant could cause migrations to skip or replay incorrectly across users on different deploys.

**Fix**: bumped to 5.33.0 alongside the rest of the release.

### 🟢 R2-L3 — README under-counted matcher exclusions

`README.md:18` — claimed "52 inclusion criteria + 16 exclusions". After the dead-code removal, the actual count is 15 exclusions. README updated.

### 🟢 R2-L4 — 21 new probe tests for previously-uncovered functions

Three calculator functions had **0 dedicated test coverage** in v5.32.0:
- `interpretMRS9Q` (the function with the R2-H1 bug)
- `dmvoEVTAdvisory` (the function with the R2-M2 brittle-match bug)
- `adjunctiveAntithromboticAdvisory`

Three more had only-trivial coverage (1 test each):
- `bpTargetPostStroke`
- `lipidsTargetPostStroke`
- `icadMedicalRegimen`

Added 21 new probe tests to `tests/qa-probes.test.js` covering each. Total test count: 486 → **507**.

---

## What Was Audited (round 2)

| Area | Method | Result |
|---|---|---|
| All 31 completed trials | Full read of `completedTrials.js` | 5 atlas-content fixes (M1) |
| All 11 active trials | Full read of `activeTrials.js` | 1 dead-code fix (M3); SISTER `nihssDisabling` already shipped in v5.32.0 |
| All 17 guideline JSON files (771 recommendations) | Programmatic structural audit | All structurally valid; non-standard LOE codes (`A*`, `B/C`, `Expert Consensus`, `Guideline Summary`) reflect source-document conventions, not bugs |
| Every exported calculator function (55 total) | Per-function test-coverage scan + manual review of uncovered functions | 1 clinical-correctness fix (H1), 1 brittle-string fix (M2), 21 new probes (L4) |
| Note generators (telestroke, transfer, signout, progress, discharge) | Direct read | 2 formatting/completeness fixes (M4) |
| `src/teaching.js` content (LANDMARK_TRIALS, STROKE_SYNDROMES, NEUROANATOMY, TEACHING_PEARLS, KEYBOARD_SHORTCUTS) | Direct read | Clinically accurate; no fixes needed |
| `src/components.jsx` / `src/primitives.jsx` / `src/pocket-cards.jsx` | Export inventory | Clean; no fixes needed |
| Docs/code cross-references | Pattern scan | 1 README count correction (L3); 1 inline-script version drift (L2) |
| Dead-code / TODO / FIXME scan | grep | None |
| Service worker + manifest | Direct read | 1 dead-precache cleanup (L1); SW design is sound (network-first for shell, cache-first for assets, proper update banner) |
| Accessibility | Pattern scan for buttons / inputs / labels | Inputs use wrapping `<label>` (valid pattern). 181 ARIA refs in app.jsx. Non-blocking. |

---

## What Was NOT Touched (intentional)

- `app.js` minified bundle is 2.4 MB — flagged by esbuild but not a regression. Dynamic-import / route-splitting would be a meaningful refactor (out of scope for an accuracy audit).
- Lighthouse Performance score (54) on the live site — not affected by any change in this audit; orthogonal to clinical-accuracy goals.
- M4 (CHA₂DS₂-VASc/VA UI labeling), M5 (ABCD² speech-vs-weakness UX), M7 (CATALYST framing) from round 1 — touch UI in `app.jsx` and were deferred again as low-impact.
- Lengthening / restructuring of the 35K-line `app.jsx` into smaller modules — that's an architectural project, not an audit fix.
- Re-running `npm run validate:citations:ids` against PubMed — sandboxed network can't reach NCBI; the operator should run this from a network-enabled environment after merge to verify identifier liveness.

---

## Round-1 Issues Now Fully Closed

The round-1 H1, H2, H3, H4 and M1, M2, M3, M6 findings (PMID duplications, ELAN reconciliation, broken claim chain, large-core EVT >100 mL warning, PHASES per-score table, RCVS² clamp, ABC/2 unit warning, SISTER NIHSS-4-disabling) all shipped in v5.32.0. R1-M4, R1-M5, R1-M7 (UI labeling nits in `app.jsx`) and R1-L6 (parameter-sweep harness) remain deferred.

---

## Test Pass Summary

```
Test Files  8 passed (8)
Tests       507 passed (507)        ← was 486 in v5.32.0; +21 from this audit
Validators  6 passed (6)            ← citations, inline-citations, evidence,
                                       evidence-churn-profiles, qa-latency-profiles,
                                       evidence-promotion
Build       app.js 2.4 mb           ← unchanged
            tailwind.css 68 kb
```

---

## Next-iteration recommendations (for future sprints)

1. **Bundle splitting** — split `app.jsx` by route (encounter / management / trials / clinic / wards) using esbuild's `--splitting` flag with `--format=esm`. Could reduce time-to-interactive on first load substantially.
2. **Parameter-sweep export harness** — a `npm run analyze` command that takes an encounter envelope + a parameter grid and emits CSV of (input → which trial branches fire). Useful for retrospective audits and grant figures.
3. **NPM script** for re-running `validate:citations:ids` against PubMed with retries — deferred-network-OK pattern.
4. **Topic taxonomy cleanup** — 31 topics; several have 0-1 atlas entries (`cadasil`, `cognitive-trajectories`, `tandem-lesions`, `ivt-on-doac`). Either populate them or trim.
5. **Lighthouse Performance work** — defer non-critical CSS, lazy-load icons, possibly use a smaller build target than ES2018.
