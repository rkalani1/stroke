# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `63cb9c3`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.25`
- Service worker cache key: `stroke-app-v24`

## Session summary (iter-006 through iter-018)

### Clinical content (iter-006 through iter-008, iter-013, iter-014, iter-016 through iter-018)
- SAH first-hour rapid actions card
- CVT treatment timeline strip
- AF anticoag timing quick reference
- TNK-first decision card with alteplase fallback
- Wake-up imaging hard-stop alert
- Pregnancy/peripartum emergency rapid actions panel
- Renal-safety auto-alert in contrast section
- PFO closure eligibility decision card
- Carotid revascularization decision guide
- Post-EVT antithrombotic restart protocol (no-stent, stent/DAPT, sICH, TICI 0-2a)
- Large-core EVT trial outcome matrix (SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION, LASTE)
- Discharge medication reconciliation safety check panel
- AHA/ASA GWTG quality metrics exported to discharge note template
- Caregiver education checklist + screening scores (PHQ-2, MoCA, STOP-BANG) in discharge note

### Usability & workflow (iter-015 through iter-018)
- Inline TNK dose badge at recommendation checkbox
- Secondary prevention plan added to transfer note
- Stable contraindication list keys (field/label-based)
- Diagnosis-aware field visibility: ASPECTS, PC-ASPECTS, contraindication checklist hidden for ICH/SAH
- ICH volume calculator max constraint relaxed (30 → 50 cm)
- Accessibility: label associations for HT management textarea, Other diagnosis input
- Settings menu focus restoration on close (keyboard a11y)
- Protocol modal "Esc to close" hint for discoverability
- Calculator priority maps enhanced: FUNC Score for ICH, Mod. Fisher for SAH
- Calculator radio buttons: role="radio" + aria-checked + aria-label on all groups
- WCAG AA contrast fixes on calculator descriptions and modal hints

### Quality & infrastructure (iter-009 through iter-018)
- Cross-links between reference cards and data-entry sections
- Mobile responsiveness audit: all cards safe at 390px
- Schema mismatch debt resolved (compare_keys.ps1 fixed, 0 true mismatches)
- CrCl calculation added to ALL note templates (transfer, signout, discharge, consult)
- TNK-first rationale added to transfer note treatment section
- NIHSS stale closure bug fixed (click + keyboard handlers use functional updater)
- ASPECTS score input clamped to 0-10 in JS
- Dead code cleanup (unused calculateASPECTS removed)
- html2pdf CDN load timeout guard (8s)
- Full clinical audit: 0 P0/P1 findings (app clinically sound)
- Transfer note statinIntensity → statinDose field name bug fixed
- ErrorBoundary wrapping Encounter tab for crash resilience
- Screening results (PHQ-2, MoCA, STOP-BANG) added to signout note template
- TIA workup completion % and pending items in discharge note

### Gap matrix: ALL P0/P1 items COMPLETED

## Known remaining work
- No automated unit/integration tests
- Bundle size 2.2 MB
- Pediatric stroke pathway guidance not yet added
- Many note template export gaps remain (86 fields collected in UI but not exported to any note)
- Rehab referrals to transfer note
- CVT anticoag details to signout note
- SAH vasospasm monitoring data to discharge note

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && npx esbuild ./src/app.jsx --bundle --minify --format=iife --target=es2018 --outfile=./app.js`
