# Stroke Clinical Decision Support

A client-side clinical decision-support toolkit for stroke management. Runs entirely in the browser; no backend, no tracking.

**This app is for educational and decision-support purposes only. It is not medical advice and is not endorsed by any named institution. Clinicians must apply their own judgment and local policy before acting on any content displayed here.**

## Features
- Acute encounter workflow (IVT, EVT, extended-window imaging selection).
- Protocol cards (example institutional patterns based on published evidence).
- Calculators: NIHSS, ASPECTS, ICH score, ABCD², HAS-BLED, RCVS², PHASES, ROPE, CrCl, TNK/alteplase dose, DAWN, DEFUSE-3, CHANCE/POINT/THALES DAPT duration, ESSEN, SPI-II, BAT/BRAIN/9-point ICH expansion, VASOGRADE, Ogilvy-Carter, PHQ-9, NASCET, CHA₂DS₂-VA, HEADS².
- Multi-patient ward census (IndexedDB, local-only).
- Clinic and wards workflows.
- Post-tPA neurocheck timer; LKW countdown to 4.5h and 24h windows.
- Note generators for telestroke consult, transfer, signout, progress, discharge.

## Install

The app is a Progressive Web App and runs in any modern browser. Three install paths are supported, plus an optional native distribution path.

| Platform | How |
|---|---|
| Web | Open `https://rkalani1.github.io/stroke/` |
| iOS Safari | Share → Add to Home Screen (a one-time tip prompts you) |
| Android Chrome / Desktop Chrome / Edge | Settings ("More") menu → **Install app** |
| App Store / Play Store | Optional Capacitor wrapper — see [docs/pwa-and-app.md](docs/pwa-and-app.md) |

Updates roll out via a non-intrusive **"A new version of Stroke is ready"** banner — clinicians mid-encounter are never auto-reloaded. See [docs/pwa-and-app.md](docs/pwa-and-app.md) for the full update / offline behavior, manifest shortcut targets, and Lighthouse run instructions.

## Privacy & safety
- All data is stored locally in your browser. Nothing is transmitted.
- Avoid entering identifiable PHI.
- Local data auto-expires after 12 hours of inactivity.

## GitHub Pages routing
- Deployed under `/stroke/` using hash routes (`#/encounter`, `#/management`, etc.).

## Deep links
- `#/encounter` · `#/management` · `#/management/ich` · `#/management/ischemic` · `#/management/calculators` · `#/management/references` · `#/trials`

## QA commands
- `npm test` — local smoke checks.
- `npm run qa` — local + live smoke checks.
- `npm run build` — production build.
