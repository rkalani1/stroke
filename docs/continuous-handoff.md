# Continuous Handoff

## Current state (2026-02-18)
- Branch: `main`
- Last pushed commit: `c3b7ea6`
- Production URL: `https://rkalani1.github.io/stroke/`
- Live APP_VERSION: `v5.14.30`
- Service worker cache key: `stroke-app-v29`

## Session summary (iter-006 through iter-023)

### Clinical content (iter-006 through iter-008, iter-013, iter-014, iter-016 through iter-023)
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

### Usability & workflow (iter-015 through iter-023)
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
- Vessel occlusion selector hidden for non-ischemic diagnoses
- Template diagnosis handler synchronized with comprehensive dropdown handler
- ASPECTS/PC-ASPECTS mobile responsive grids (2-col on mobile, 3-col tablet, full on desktop)
- EVT procedure details section auto-opens when populated

### Quality & infrastructure (iter-009 through iter-023)
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
- mTICI score added to transfer note EVT section
- Signout SAH/CVT sections enriched with vasospasm and anticoag phase details
- Rehab screening timeline (aphasia 30d, cognitive discharge/3mo) in discharge note
- Consult note PT, affected side, pre-morbid mRS added
- Progress note synced with signout (9 missing fields restored)
- Follow-up brief enhanced with sICH + discharge NIHSS delta
- EVT procedural fields: access site, device, passes, technique, reperfusion time
- Dashboard case outcomes card (DTN, DTP, mTICI, NIHSS delta, mRS, sICH, quality measures)
- ASPECTS interactive scorer state sync bug fixed (stale closure → functional updater)
- EVT procedural fields now in ALL 8 note templates (was only in transfer + procedure)
- QM count guarded behind dischargeChecklistReviewed
- Dashboard outcome card print styling
- DAWN age ≥80 EVT late-window warning (NIHSS <10 → error)
- ACEi + TNK angioedema warning escalated to error severity
- Textarea focus:outline-none consistency (4 locations)
- DAPT duration select visible label added

### Gap matrix: ALL P0/P1 items COMPLETED

## Known remaining work
- No automated unit/integration tests
- Bundle size 2.2 MB
- Pediatric stroke pathway guidance not yet added
- Structured pertinent negatives in consult note (requires new state fields)
- Active drip parameters section for signout note (requires new state fields)
- Specific follow-up appointment fields for discharge note (requires new state fields)
- Imaging follow-up modality field for discharge note (requires new state field)

## Resume command
- `cd C:\Users\rkala\stroke && git pull --rebase origin main && npx esbuild ./src/app.jsx --bundle --minify --format=iife --target=es2018 --outfile=./app.js`
