# PWA, install, update, and offline behavior

The Stroke app is a Progressive Web App. There is no separate native binary
to install (yet). This document covers how the four supported install
paths behave, how updates roll out, and what works offline.

## Install paths

### 1. Web (no install)

Just open `https://rkalani1.github.io/stroke/` in any modern browser. Hash
routes (`#/encounter`, `#/management/calculators`, `#/trials`) are
bookmarkable and shareable.

### 2. iOS — Add to Home Screen (Safari)

Apple does not expose a programmatic install API on iOS. The first time a
user visits the site in Safari we surface a small indigo banner:

> Install Stroke: tap Share, then "Add to Home Screen".  [Got it]

Once they tap "Got it" we set `strokeApp:iosInstallTipDismissed` in
`localStorage` so the banner does not return.

After install, the app launches in `display: standalone` mode. The
`apple-mobile-web-app-status-bar-style` is `default` so the status bar is
opaque (white in light mode, black in dark mode). Header padding respects
`env(safe-area-inset-top/right/left)` via the `pwa-safe-top` and
`pwa-safe-x` utility classes for notched devices.

### 3. Android Chrome / Desktop Chrome / Edge — Install button

These browsers fire `beforeinstallprompt` once their installability heuristic
trips (HTTPS, manifest, SW, etc.). The app captures the event, suppresses
the default mini-bar, and exposes a deliberate **"Install app"** entry in
the existing Settings ("More") menu. Clicking it calls `prompt()` and
awaits `userChoice`. On accept we hide the menu item via
`appinstalled` listener and `display-mode: standalone` detection.

The Install entry is intentionally NOT placed in the quick-link bar —
that bar is reserved for clinician resources (ChatGPT, OpenEvidence,
UpToDate, Asta, Regional Hospitals).

### 4. Native distribution (App Store / Play Store) — optional, opt-in

Currently NOT scaffolded. To enable, create a file named
`OPTIN_NATIVE_WRAPPER` at the repo root and re-run the PWA polish sprint
prompt. That triggers an explicit Capacitor scaffold (`@capacitor/cli`,
`@capacitor/ios`, `@capacitor/android`) plus a documentation file under
`docs/pwa-native-distribution.md`.

Three lightweight alternatives, in roughly increasing complexity:

| Path | Effort | Notes |
|---|---|---|
| **PWABuilder.com** | hours | Paste `https://rkalani1.github.io/stroke/`. Generates store packages from the live PWA. |
| **TWA (Trusted Web Activity)** | day | Android only. A Chrome custom tab pointed at the live URL, packaged as an APK. |
| **Capacitor wrapper** | days | Full WebView shell, can add native plugins, requires App Store / Play Store medical-app categorization and disclaimer review. |

Native distribution raises FDA Software-as-a-Medical-Device classification
questions for clinical decision support that exceed the scope of a PWA
polish sprint. Decide on the regulatory posture before scaffolding.

## Update strategy

Service worker `service-worker.js` deliberately does NOT call
`self.skipWaiting()` on install. Instead:

1. Browser detects the new SW file (size or content differs).
2. New SW enters `installing` → `installed` → `waiting`.
3. The page-side React effect (`src/app.jsx` ~line 14593) listens for
   `updatefound` + `statechange` and flips `updateAvailable` to true.
4. The blue "A new version of Stroke is ready. [Reload to update] [Later]"
   banner appears at the top of the app shell.
5. User taps **Reload to update** → page posts `{ type: 'SKIP_WAITING' }`
   to the waiting SW → SW activates → `controllerchange` event fires →
   page reloads.
6. User taps **Later** → banner dismissed for the session, returns next visit.

This protocol is critical for clinical safety: a clinician mid-encounter
must NEVER auto-reload. The waiting SW just sits there until they confirm.

### Cache-busting workflow on release

When you ship a release that touches anything in the precache list:

```
service-worker.js
  CORE_ASSETS:  index.html, manifest.json, icon-192.png, icon-512.png,
                app.js, tailwind.css, offline.html
  CDN_ASSETS:   react@18, react-dom@18, lucide@0.563.0, html2pdf@0.10.1
```

bump `CACHE_NAME` from `stroke-app-vNN` → `stroke-app-vNN+1` and push.
Existing users see the update banner on their next visit.

If you change ONLY content files served outside the precache (e.g. a new
JSON evidence file fetched at runtime), no cache bump is needed —
stale-while-revalidate handles it. When in doubt, bump.

### Cache version history

| Version | Notes |
|---|---|
| v83 → v84 | This sprint: manifest shortcuts + offline.html |
| v82 → v83 | Site improvements (PR #8) |
| v81 → v82 | Earlier deploy (auto-bumped by pipeline) |

## Offline behavior

When the SW serves cached responses, the following work fully offline:

- All 22+ calculators (NIHSS, ASPECTS, ICH score, ABCD², HAS-BLED,
  RCVS², PHASES, ROPE, CrCl, TNK / alteplase dose, DAWN, DEFUSE-3,
  CHANCE / POINT / THALES DAPT duration, ESSEN, SPI-II, BAT / BRAIN /
  9-point ICH expansion, VASOGRADE, Ogilvy-Carter, PHQ-9, NASCET,
  CHA₂DS₂-VA, HEADS²)
- Note templates (telestroke, transfer, signout, progress, discharge)
- Multi-patient ward census (IndexedDB, 12-hour TTL)
- Last-cached encounter form state
- Protocol cards and references that loaded on the previous online session
- Evidence Atlas data (loaded with the bundle)

These do NOT work offline:

- Live trial matching against fresh ClinicalTrials.gov data
- External quick-link destinations (ChatGPT, OpenEvidence, UpToDate,
  Asta, Regional Hospitals)
- Pulsara routing
- Any Claude / OpenAI integration

When a navigation request fails outright (no network and no cached page
for that URL), the SW serves `offline.html` instead of booting a half-
broken React shell. `offline.html` enumerates what works vs what does
not, and links back to `#/encounter`.

## Manual verification checklist

After any change to the PWA layer, verify each path:

### iPhone Safari
- [ ] Visit `https://rkalani1.github.io/stroke/`
- [ ] Indigo "Install Stroke" banner appears at top
- [ ] Tap **Got it** → banner gone
- [ ] Reload → banner stays gone (localStorage flag persists)
- [ ] Share → Add to Home Screen → launch from icon
- [ ] Header does NOT overlap status bar / notch
- [ ] Open NIHSS form, tap a decimal score → does NOT auto-convert to
      `tel:` link

### Android Chrome
- [ ] Visit the URL, wait ~30 s
- [ ] Open Settings (More) menu → **Install app** entry appears
- [ ] Tap → native install prompt appears → Install
- [ ] App launches from app drawer
- [ ] Long-press app icon → manifest shortcuts appear:
      "New encounter", "Calculators", "Trials"
- [ ] Each shortcut navigates to the correct hash route

### Desktop Chrome / Edge
- [ ] Visit the URL → install icon appears in URL bar
- [ ] Settings menu → **Install app** entry also appears
- [ ] After install, right-click docked icon → manifest shortcuts appear

### Update flow (any browser)
- [ ] Bump `CACHE_NAME` in `service-worker.js`
- [ ] Push, wait for GH Pages deploy
- [ ] Existing tab → blue **"A new version of Stroke is ready"** banner
- [ ] **Reload to update** → page reloads, no infinite reload loop
- [ ] **Later** → banner dismissed for session

### Offline flow
- [ ] Install the app
- [ ] Use it once while online (so SW pre-caches)
- [ ] Toggle airplane mode
- [ ] Reload → either the cached app loads OR `offline.html` appears
      (not a blank page, not an error stack trace)

## Lighthouse target

Run `./scripts/lighthouse-pwa.sh` (requires Chrome + npx).

Targets:
- PWA              ≥ 90
- Performance      ≥ 80
- Accessibility    ≥ 90
- Best Practices   ≥ 90

The PWA score is gated on: HTTPS (✓ via GH Pages), service worker (✓),
manifest with `start_url` / `name` / `icons` (✓), themed splash
(✓ via theme_color + background_color), responsive viewport (✓),
no blocking issues. Performance is the most fragile axis on cellular.

## Don't-touch list (preserved by this sprint)

This list is repeated here for posterity; future PWA sprints must NOT
modify any of these:

- 22+ calculators in `src/calculators.js` and `src/calculators-extended.js`
- IndexedDB ward census (12 hour expiry, multi-patient roster) in
  `src/patient-store.js`
- Hash routing under `/stroke/` for GitHub Pages
- Post-tPA neurocheck timer
- LKW countdown to 4.5h and 24h windows
- Quick-link bar (ChatGPT, OpenEvidence, UpToDate, Asta, Regional
  Hospitals)
- Educational-only / non-medical-advice disclaimer language
- Institutional non-endorsement language
- Note templates (8 of them) and Pulsara / Smart Note routing
- Telestroke-expansion-map link target
- Encounter form: NIHSS, ASPECTS, vessel-occlusion, TNK
  contraindications, EVT eligibility components
- Anything from the Evidence Atlas sprint (PR #10)
- service-worker.js cache strategy (stale-while-revalidate same-origin,
  cache-first CDN) and SKIP_WAITING protocol
- manifest.json `scope`, `start_url`, icon paths
