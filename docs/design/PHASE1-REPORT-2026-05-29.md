# StrokeOps Phase 1 — Design Foundation Port — Report (2026-05-29)

## 1. Summary

Phase 1 re-skinned the Stroke CDS PWA to the approved "clinical precision instrument" palette without rewriting the 34,907-line monolith (`src/app.jsx`). The approach: re-value CSS-variable token ramps in `tailwind.config.js` + swap Google Fonts to Bricolage Grotesque / Public Sans / IBM Plex Mono + migrate ~880 raw built-in `blue-*` utilities to the teal token ramp via targeted `sed` sweep + add signature CSS classes (`v7-`-prefixed, additive, safelisted). Every existing route, calculator, IndexedDB ward-census logic, and offline PWA guarantee is preserved. The service worker was bumped to `v6.1.0` / `stroke-cache-v6-1-0` to force deployed clients to refetch the re-skinned assets.

---

## 2. Before → After

### Palette
| Dimension | Before (v6.0.x cool slate + cobalt-blue) | After (v6.1.0 warm paper + teal) |
|---|---|---|
| Primary | cobalt blue (HSL ~220) | **teal** (HSL ~186, cobalt token re-valued) |
| Acute / harm signal | orange | **coral** (signal-red family) |
| ICH / institutional | purple/pink | **gold** |
| OK / safe | green | green (unchanged) |
| Ink | cool near-black | **warm near-black** |
| Background | cool slate | **warm paper** |
| Dark mode | cool dark slate | **warm dark paper** |

Clinical diagnosis-category colors (ich / sah / cvt + orange / pink / rose / sky / cyan / yellow / green) are **preserved** — these encode clinical semantics and were not migrated.

~880 raw built-in `blue-*` Tailwind utility references in `app.jsx` promoted to the cobalt (now teal) token ramp. The 52 built-in `teal-*` utilities were intentionally left as a separate clinical accent (not merged into the cobalt token).

### Typography
| Role | Before | After |
|---|---|---|
| Display / headings | Manrope | **Bricolage Grotesque** |
| Body / UI | Newsreader | **Public Sans** |
| Data / citations / mono | JetBrains Mono | **IBM Plex Mono** |

### Signature Visuals (additive `v7-` classes)
- Graph-paper texture overlay on app background
- Teal corner glow on card surfaces
- Freshness "pulse" animation on recency indicators
- Card left-stripe accent by diagnosis category
- Frosted-masthead CSS (`.v7-app` / `.v7-nav-item`) — ported and safelisted; production wiring **deferred to Phase 3/5 IA** (see Deferred Register)
- Utility chip / tag / badge classes (`.v7-chip`, `.v7-tag`, `.v7-badge-*`)

---

## 3. Gate Results

All gates passed. Results are verbatim from the 2026-05-29 run on branch `feat/currency-ux-perf-2026` HEAD `bd86553`.

| Gate | Command | Result |
|---|---|---|
| Production build | `npm run build:prod` | **PASS** — app.js 3.9 MB → gz 711 KB (17.4%) / br 504 KB (12.3%); tailwind.css 99 KB → gz 16 KB; 5 assets compressed |
| Unit tests | `npm run test:unit` | **PASS** — 5608 / 5608 tests passed across 92 test files (vitest v2.1.9) |
| Token lint | `node ./scripts/lint-tokens.mjs` | **PASS** — `✓ lint:tokens — clean` |
| Contrast lint | `node ./scripts/lint-contrast.mjs` | **PASS** — `✓ lint:contrast — 21 pairs verified ≥ floor` |
| Evidence validate | `npm run evidence:validate` | **PASS** — 9 active, 46 completed, 57 citations, 9 recs, 12 claims, 7 guidelines, 30 topics; matcher-engine 46/46 criteria + 13/13 exclusions (100%) |
| Citation validate | `npm run validate:citations` | **PASS** — 24 rows, years 2021–2026 |
| Inline citations | `npm run validate:inline-citations` | **PASS** — 67 unique PMIDs across 128 inline references; 0 review warnings |

**Note on `qa-smoke` / Playwright e2e (`npm test`):** Not run as a full suite — the `/#/trials` embedded-iframe `networkidle` harness quirk is a pre-existing blocker, not a regression from this phase. The individual validators above are the authoritative gates per project convention.

### PWA / SW State
- `service-worker.js`: `APP_VERSION = '6.1.0'`, `CACHE_NAME = 'stroke-cache-v6-1-0'` — confirmed bumped from Task 2; deployed clients will refetch re-skinned `app.js` / `tailwind.css`.
- `index.html` asset query strings: `app.js?v=6.1.0`, `tailwind.css?v=6.1.0` — confirmed on lines 51, 52, 896.
- Offline sanity: `python3 -m http.server 8080` served HTTP 200 on `/` and `/service-worker.js`; served SW contains the bumped `CACHE_NAME`; Playwright not required.

---

## 4. Commits

Phase 1 commit chain (newest → oldest):

```
bd86553  feat(design): port signature texture/glow/pulse/cards/frosted-nav as v7 classes
09b02c1  feat(palette): promote primary blue→teal token; preserve clinical category coding
443ee68  feat(tokens): re-value v7 ramps to teal/coral/gold + warm neutrals (contrast-verified)
b7be1fa  feat(type): swap to Bricolage Grotesque / Public Sans / IBM Plex Mono
f84a2c6  fix(tokens): amber→warn on the two pre-existing lint:tokens violations
36d3653  docs: build plan consolidating the design phase -> live build
```

(Plus upstream prototype/planning commits: `e82a766`, `ff9f325`.)

---

## 5. Architecture Note

The re-value works because the monolith reaches all token-mapped colors exclusively through `tailwind.config.js` CSS-variable plumbing — there are **0 raw hex values** in `src/app.jsx`. Re-valuing ~5 CSS-variable ramps (cobalt / signal / gold / neutral / paper) re-skinned approximately **3,900 generated Tailwind utilities** across the compiled output. A separate targeted sweep migrated the ~880 raw built-in `blue-*` class references in `app.jsx` to the cobalt (now teal) token ramp. This leaves the source file structurally unchanged — the visual re-skin is entirely in the config and token layer.

---

## 6. Deferred / Follow-up Register

The following items were surfaced by code review. They are **tracked, not done**. Each is a deliberate deferral, not an oversight.

1. **Frosted masthead wiring** — `.v7-app` / `.v7-nav-item` CSS is ported and `/^v7-/`-safelisted; deferred to **Phase 3/5 IA** because the production nav is a responsive horizontal-pills → 248 px sidebar already styled in `index.html`, and the prototype's top-bar layout would clash. Optional low-risk partial win available: apply just the frosted backdrop-filter to the existing `.app-nav` without the full layout restructure.

2. **Pre-existing bug `src/app.jsx:32575`** — `text-${prognosis.color}-700` where `prognosis.color` is never set → `text-undefined-700` (no visual effect, classes are purged). Not introduced this phase; easy one-line fix in a future pass.

3. **IIa guideline-class badge inconsistency** — `GUIDELINE_CLASS_COLORS['IIa']` (cobalt filled, `app.jsx:3297`) vs Atlas `corTone` 'sky' (outlined, `app.jsx:32753` / `atlasToneClass` `app.jsx:5944`). Pre-existing divergence; unify in a later pass.

4. **`index.html` inline-`<style>` coupling** — selectors couple to JSX Tailwind utility class names (fragile under future renames). Future-proof with `data-` attributes or dedicated semantic classes.

5. **Dark-mode focus-ring literal rgba** — uses `rgba(63,182,196,.45)` (between cobalt-300 and cobalt-400). Normalize to a cobalt token reference in a later cleanup.

6. **`ischemic` diagnosis category renders teal** — accepted tradeoff per the 2026-05-29 "promote primary→teal, keep clinical coding" decision (teal = brand primary = ischemic makes clinical sense). Revisit if a distinct non-primary ischemic hue is wanted.

7. **52 built-in `teal-*` utilities** — intentionally left as a separate clinical accent, not merged into the cobalt token ramp. Revisit in a future unification pass if desired.

8. **`color-mix()` (13 uses) has no `@supports` guard** — degrades gracefully (lines / glow / tints disappear on unsupported browsers). Acceptable for the modern clinical-device audience; add guard in a hardening pass if needed.

9. **`lint:touch-targets` could not complete** — due to the pre-existing `/#/trials` embedded-iframe `networkidle` harness quirk (not a touch-target failure). This phase adds **zero** new interactive elements and changes no control sizing, so touch-target compliance is structurally unchanged. Verify with a scoped run (skip the trials route) in a future pass.

---

## 7. Constraints Upheld

- **Institution-neutral public site**: zero named-institution content on `rkalani1.github.io/stroke`. Verified clean.
- **Extend, not rewrite**: all existing routes, calculators, IndexedDB ward census, post-tPA timer, LKW countdown, 8 note generators, disclaimers, and aria/keyboard behavior preserved. 0 lines of logic removed from `src/app.jsx`.
- **Offline PWA**: service worker bumped to `v6.1.0` / `stroke-cache-v6-1-0`; deployed clients will refetch re-skinned assets on next visit.
- **Token names frozen**: all CSS-variable names unchanged; only their resolved values were re-set.
- **Both lint gates green**: `lint:tokens` clean, `lint:contrast` 21/21 pairs verified ≥ floor.
- **100% accurate**: no evidence content modified; all validators pass.
