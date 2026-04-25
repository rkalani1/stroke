# SPRINT_STATUS_PWA.md — PWA polish sprint

Branch: `feature/strokeops-v6-pwa-polish`
Base: `main` (commit `0c9cd2c`, v5.20.0)
Started: 2026-04-25

## Branch decision

Branched from `main` rather than stacking on `feature/strokeops-v6-evidence-atlas` /
`-retire-legacy`. PR #10 (Evidence Atlas) and the matcher-engine PRs (#11, #12, #13)
are already in flight as draft PRs and the PWA polish work is independent of the
matcher-engine refactor. Keeping the PWA PR off that stack lets reviewers merge them
in any order.

## Phase 1 — Audit findings

Files inspected: `index.html`, `manifest.json`, `service-worker.js`, `src/app.jsx`,
`src/styles.css`, `package.json`, `.github/workflows/ci.yml`, `README.md`.

### Already in place (DO NOT recreate)

| Capability | Where | Notes |
|---|---|---|
| `<link rel="manifest">` | index.html:11 | Points to `manifest.json` |
| `theme-color` meta | index.html:7 | `#3B82F6` matches manifest |
| Viewport with `viewport-fit=cover` | index.html:5 | Already includes notch handling |
| `apple-mobile-web-app-capable` | index.html:9 | Present |
| `apple-mobile-web-app-status-bar-style` | index.html:10 | Currently `default` (not translucent) |
| `apple-mobile-web-app-title` | index.html:14 | Set to "Stroke" |
| `apple-touch-icon` | index.html:13 | Default (no sizes), points to `icon-192.png` |
| `mobile-web-app-capable` | index.html:8 | Android-equivalent |
| Manifest `start_url`, `scope`, `display`, `icons` (192/512 maskable), `categories`, `screenshots`, `lang`, `dir` | manifest.json | All present and correct |
| Service worker registration | src/app.jsx:14593–14629 | useEffect inside main App component; full updatefound + statechange + controllerchange handling |
| SKIP_WAITING SW message handler | service-worker.js:33–37 | Present; intentionally not auto-skipping on install |
| Update banner UI | src/app.jsx:15912–15932 | Top banner with "Reload to update" / "Later" buttons; uses `applyPendingUpdate` to post SKIP_WAITING |
| Offline indicator banner | src/app.jsx:15904–15909 | Amber bar when `navigator.onLine === false` |
| Safe-area bottom helpers | index.html:449–455 | `.pb-safe`, `.mb-safe` already use `env(safe-area-inset-bottom)` |
| iOS auto-zoom prevention | index.html:255–264 | `font-size: 16px` on date/time inputs |
| Touch target minimums | index.html:309–318 | 44px min-height/min-width on buttons |
| 12-hour ward census IndexedDB | src/patient-store.js | Multi-patient roster with TTL |
| Hash routing under `/stroke/` | manifest start_url + app.jsx | `#/encounter` etc. |
| Quick-link bar (ChatGPT, OpenEvidence, UpToDate, Asta, Regional Hospitals) | src/app.jsx:15943–15956 | Preserved verbatim |

### Gaps to address

| # | Gap | Phase |
|---|---|---|
| 1 | `apple-mobile-web-app-status-bar-style="default"` could be `black-translucent` for full-screen effect with safe-area handling — **conservative choice**: keep `default`. With `default`, the status bar is white/black opaque and content does not need to inset. Switching to `black-translucent` makes the status bar overlay content, requiring more invasive header changes. We will keep `default` and add safe-area handling defensively for users running iOS 16+ which has a notched status bar even with `default`. | 2 |
| 2 | No `apple-touch-icon sizes="180x180"` variant — Apple's recommended size | 2 |
| 3 | No `format-detection content="telephone=no"` — medical app shows decimal numbers (NIHSS scores, INR values, etc.) that iOS Safari sometimes auto-converts to `tel:` links | 2 |
| 4 | Header element (src/app.jsx:15935) does not have any safe-area-top/x classes; on devices in standalone PWA mode with a notch, the gradient title sits under the status bar | 2 |
| 5 | `src/styles.css` does not define `pwa-safe-top` / `pwa-safe-x` utility classes (only `pb-safe` / `mb-safe` exist in index.html `<style>`) | 2 |
| 6 | SW registration is correct and present — **Phase 3 SKIP** | 3 |
| 7 | Update banner is functional but is a top banner, not a bottom-right toast as specified. Decision: **keep the existing top banner** — it's clinically appropriate (visible without obscuring the FAB layer), already styled consistently, and the sprint says "do not rearchitect". Phase 4 reduces to verifying the existing banner respects safe-area and adding minor polish if needed. | 4 |
| 8 | No `beforeinstallprompt` capture; no Install button anywhere | 5 |
| 9 | No iOS Add-to-Home-Screen tip | 5 |
| 10 | Manifest has no `shortcuts` for jump-targets | 6 |
| 11 | No `offline.html` — SW falls back to `index.html` which boots React and may render error states when fully offline | 7 |
| 12 | Local `service-worker.js` is at `stroke-app-v81` but deployed is `stroke-app-v83`. Reason: main branch ships v81, deployed pipeline auto-bumps. Will bump to v82 (one increment from v81 — that becomes v83 once deployed by CI? Actually: per sprint instructions "increment by 1" — v81 → v82). After Phase 6 + 7 changes, bump v81 → v82. | 6/7 |
| 13 | No README install instructions | 10 |
| 14 | No PWA documentation (install, update, offline behavior, native wrappers) | 10 |
| 15 | `OPTIN_NATIVE_WRAPPER` file does not exist at repo root | 9 (skip) |

## Assumptions

- Sprint lock checked: no other sessions have task locks active.
- The deployed v83 cache reflects two server-side bumps already (v81 → v82 → v83 from earlier deploys); local source remained at v81. Not investigating the bump pipeline — sprint says "do not bump CACHE_NAME unless your changes alter precached assets". We WILL alter precached assets (adding `offline.html`), so we bump v81 → v82.
- Status bar style stays `default` to avoid coupling iOS standalone PWA appearance changes to this sprint. Safe-area additions are defensive and harmless when status bar is opaque.
- Update banner stays at the top of the app shell (existing pattern), not a bottom-right toast. The banner already does what the sprint requires functionally.
- `display: standalone` in manifest means once installed, the browser chrome is hidden — that's where safe-area handling matters most.
- Lighthouse will not be run in this session (no headless Chrome). Document the command and expected target.
- No FDA/regulatory review work in this sprint — that's a separate decision out of scope.

## Blockers

None so far.

## Phase status

- [x] Phase 1 — Audit
- [x] Phase 2 — iOS polish
- [x] Phase 3 — SW registration audit (SKIPPED — already correct in src/app.jsx:14593)
- [x] Phase 4 — Update banner UX (existing banner at src/app.jsx:15912 retained verbatim — already meets spec functionally)
- [x] Phase 5 — Install prompt UX
- [x] Phase 6 — Manifest enrichment
- [x] Phase 7 — Offline fallback
- [x] Phase 8 — Lighthouse documentation
- [x] Phase 9 — Native wrapper (SKIPPED — `OPTIN_NATIVE_WRAPPER` not present)
- [x] Phase 10 — Documentation
- [ ] Phase 11 — Push + draft PR (pending after this commit)

## Commits

- `06d524b` chore(pwa): audit existing PWA wiring and document gaps
- `d1b2cd8` feat(pwa): add iOS Safari meta tags and safe-area handling
- `3eabd72` feat(pwa): install button + iOS Add-to-Home-Screen tip
- `547e0fd` feat(pwa): manifest shortcuts for encounter/calculators/trials
- `3273407` feat(pwa): dedicated offline fallback page
- `10c50a8` chore(pwa): lighthouse audit script and target documentation
- `(this commit)` docs(pwa): comprehensive install + update + offline documentation
- `(final commit)` chore(release): finalize PWA polish sprint and open PR

## Lighthouse

Not run in this autonomous sprint — no Chrome / Lighthouse CLI in
working environment. Documented run command at
`scripts/lighthouse-pwa.sh`. User can run with one command after
deploy. Targets: PWA ≥ 90, Performance ≥ 80, Accessibility ≥ 90,
Best Practices ≥ 90.

## Notable decisions / deviations from sprint prompt

1. **Update banner stayed at top, not bottom-right toast.** The
   existing top banner from PR #8 already provides Reload/Later
   actions, is styled consistently, and avoids overlapping the FAB.
   Sprint says "do not rearchitect" — kept as-is.
2. **SW registration kept in app.jsx, not moved to inline script
   tag in index.html.** Existing useEffect at src/app.jsx:14593
   handles updatefound + statechange + controllerchange correctly.
   Adding a second registration in index.html would race with the
   React-side one. Sprint says "If Phase 1 found that SW registration
   is present and correct, skip this phase" — skipped.
3. **CACHE_NAME bumped from v83 → v84 (sprint guidance was v83 → v84
   "increment by 1"; local source had been v81 but was bumped to v83
   between audit phase and Phase 6).** Single bump, two phases worth
   of asset changes (manifest shortcuts + offline.html).
4. **format-detection telephone=no added** to prevent iOS Safari from
   auto-converting NIHSS scores / INRs into tel: links — clinical
   safety issue beyond spec.
5. **Header className change limited to `pwa-safe-top pwa-safe-x`** —
   no restructuring, no new wrapper element.
6. **iOS install tip uses indigo banner**, not modal. Modal would
   block clinical content. Banner dismisses to localStorage flag.

