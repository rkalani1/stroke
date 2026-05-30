# Performance & UX Assessment — 2026-05-29

**Branch:** `feat/currency-ux-perf-2026` (off `origin/main` v6.0.0)
**Scope:** measured assessment + prioritized recommendations for the performance and bedside-UX axes. Per the repo's hard constraint (*extend/refactor, never rewrite; preserve all routes/calculators/census/timers/note-generators/a11y; offline PWA*), risky monolith surgery is **documented, not performed autonomously** — these need a scoped, reviewed sprint.

## Performance

### Measured (this branch)
- **Transfer:** `app.js` ~2.5 MB raw → **691 KB gzip / 489 KB brotli**. GitHub Pages auto-gzips; the service worker precaches the bundle, so the cost is paid once then served offline.
- **Composition (esbuild metafile):** `app.jsx` **1.5 MB = 70%** of the bundle · react-dom 128 KB · 17 guideline JSONs **≈ 250 KB** (ais 62, secondary-prev 50, ich 36, primary-prev 24, sah 23 …) · evidence layer ~70 KB.
- **Lighthouse:** performance **64**, accessibility 95, best-practices 100.
- Bottleneck: parse/execute of the 1.5 MB monolith (total blocking time) + eagerly-bundled guideline data.

### Options (ROI vs risk)
| # | Change | Initial-load win | Risk | Verdict |
|---|---|---|---|---|
| 1 | **Lazy-load the 17 guideline JSONs** (dynamic import / fetch on first References view) | ~250 KB | **Medium** — app is an offline PWA; the service worker must precache them or offline References breaks | Feasible, but only with SW-precache + offline regression testing. Recommended as the first reviewed perf task. |
| 2 | **Split the 1.5 MB `app.jsx` monolith** into route-level chunks | Highest ceiling | **High** — explicitly out of scope ("no rewrite") | Defer; would need an architectural decision. |
| 3 | Generate + SW-serve brotli (`build:compress`) for precompressed assets | Small (GH Pages already gzips) | Low | Nice-to-have. |
| 4 | Audit for dead/duplicate data shipped in the bundle | Small–medium | Low | Worth a pass. |

### Honest verdict
The app already compresses to ~490–690 KB and is offline-cached, which is the right priority for a bedside tool. Lighthouse 64 is driven by the monolith's parse/execute. **Meaningful gains require a reviewed refactor** (guideline lazy-load with SW precache, or splitting the monolith) — not a safe blind change. Recommend a scoped perf sprint that lands #1 with offline verification.

## Bedside UX

### Already strong (verified in code)
- **Global command palette exists:** `⌘K` / `Ctrl-K` opens global search (`src/app.jsx` → KEYBOARD SHORTCUTS `useEffect`); layered **Escape** closes one overlay at a time; encounter shortcuts (e.g. `M` to mute timer alerts).
- Structured encounter capture (phone vs video telestroke), NIHSS, anticoag pathway, post-tPA timer, LKW countdown, 8 note generators, ward census.
- Accessibility 95 (Lighthouse); aria-labels and focus management present.

### Incremental opportunities (not foundational)
1. **Discoverability of `⌘K` on mobile/touch** (no physical keyboard) — ensure the search affordance is an obvious tap target, not just a `⌘K` badge.
2. **Index the newly promoted Atlas trials in global search** — verify the 15 trials added this session (basilar EVT, ESUS, PFO, ICH-BP, MISTIE III, carotid, AF-timing) surface in `⌘K` search and the Atlas tab. *The structured-layer promotion should make them discoverable automatically — confirm in a smoke test.*
3. Optional glanceable summary atop the long encounter form (progressive disclosure).

### Verdict
UX is mature. The highest-value UX outcome this session is a **side effect of the currency work**: promoting trials into the structured Evidence Atlas makes them flow into the Atlas tab, the "Why this recommendation?" drawer, and (pending confirmation) the global search index — so the evidence is now *discoverable*, not just present in prose.

## Recommended next steps (reviewed, in order)
1. Smoke-test that the 15 new trials appear in `⌘K` search + Atlas (quick, low-risk).
2. Scoped perf task: lazy-load guideline JSONs **with** service-worker precache + an offline regression test.
3. Decide separately on monolith splitting (architectural; out of current scope).

*No autonomous changes were made to app.jsx, the bundle, or the service worker. Evidence-data changes are covered by the currency-audit doc and are validated + tested.*
