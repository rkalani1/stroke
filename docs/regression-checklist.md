# Regression Checklist

Use this checklist before every merge to `main` and GitHub Pages deploy.

## Clinical content integrity
- [ ] No clinically meaningful field was removed without equivalent or better access.
- [ ] Ischemic, ICH, SAH, TIA, CVT pathways remain reachable and complete.
- [ ] Trial matching logic still aligns with diagnosis and severity inputs.
- [ ] Calculator outputs (NIHSS, ICH, mRS, CHA2DS2-VASc, HAS-BLED, etc.) are unchanged unless intentionally updated.

## Safety-critical logic
- [ ] TNK/EVT recommendation logic remains consistent with contraindication handling.
- [ ] Anticoagulation reversal prompts still trigger correctly for hemorrhagic pathways.
- [ ] BP-phase auto-assignment remains correct for ischemic/ICH/SAH contexts.
- [ ] Required-field warnings still display in Encounter when key data are missing.
- [ ] ICH first-hour bundle card remains visible and aligned with reversal/BP/escalation pathways.
- [ ] Large-core EVT evidence callout remains present with conservative eligibility language.
- [ ] SAH first-hour rapid actions card visible at top of SAH management section.
- [ ] CVT treatment timeline strip visible after acute management checklist in CVT tab.
- [ ] AF anticoag timing card appears in secondary prevention when DOAC-for-AF or anticoag-other selected.

## Workflow and usability
- [ ] Senior rapid path: key decisions visible within one scroll on desktop.
- [ ] Keyboard shortcuts work (tab switching, phase switching, search, calculator toggle, note copy).
- [ ] Command palette/search remains functional and navigates correctly.
- [ ] New UI changes do not add unnecessary clicks for common acute workflows.
- [ ] DAPT phenotype quick matrix remains visible in secondary prevention workflow when pathway context is present.

## Accessibility and responsive behavior
- [ ] Desktop (1440x900), tablet (768x1024), and mobile (390x844) layouts are usable.
- [ ] Focus outlines and keyboard navigation remain intact.
- [ ] Buttons and tap targets remain accessible on mobile.

## Build and runtime
- [ ] `npm run build` passes.
- [ ] No blocking runtime errors in browser console on local or live smoke routes.
- [ ] Service worker cache version updated when asset behavior changes.
- [ ] `index.html` app version updated for storage/cache compatibility when needed.

## Deployment verification
- [ ] Feature branch committed with clear message.
- [ ] Changes merged to `main`.
- [ ] `main` pushed to origin.
- [ ] Live URL `https://rkalani1.github.io/stroke/` serves updated build.
- [ ] Post-deploy smoke checks pass on local + live for all three viewport classes.
