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
- [ ] TNK-first decision card visible for ischemic diagnosis before TNK/EVT checkboxes.
- [ ] Wake-up imaging hard-stop alert visible when lkwUnknown is true (wake-up panel open).
- [ ] Pregnancy rapid actions panel displays when pregnancyStroke checkbox is checked.
- [ ] Renal-safety alert appears in contrast section when Cr >3 or CrCl <30.
- [ ] PFO closure eligibility card visible in secondary prevention dashboard.
- [ ] Carotid revascularization decision guide visible in secondary prevention dashboard.
- [ ] Ischemic library panel includes Post-EVT BP Guardrail module.
- [ ] TIA library panel includes TIA Disposition Engine module.
- [ ] CVT special-population flags and dynamic plan summary remain present in CVT workflow.

## Workflow and usability
- [ ] Senior rapid path: key decisions visible within one scroll on desktop.
- [ ] Keyboard shortcuts work (tab switching, phase switching, search, calculator toggle, note copy).
- [ ] Command palette/search remains functional and navigates correctly.
- [ ] New UI changes do not add unnecessary clicks for common acute workflows.
- [ ] DAPT phenotype quick matrix remains visible in secondary prevention workflow when pathway context is present.
- [ ] Bottom-right quick contacts FAB is visible and opens a callable contact panel.
- [ ] Settings tab shows Contact Directory editor and Reset UW Defaults control.
- [ ] TIA pathway language remains risk-stratified (no universal-admit hard stop text).
- [ ] Phone directory/FAB has NOT been removed unless there is an explicit owner-authored request to remove it.
- [ ] Protected UW defaults remain present with exact numbers: Stroke Phone `206-744-6789`, STAT Pharmacy `206-744-2241`, HMC Stroke RAD Hotline `206-744-8484`.

## Accessibility and responsive behavior
- [ ] Desktop (1440x900), tablet (768x1024), and mobile (390x844) layouts are usable.
- [ ] Focus outlines and keyboard navigation remain intact.
- [ ] Buttons and tap targets remain accessible on mobile.

## Build and runtime
- [ ] `npm run build` passes.
- [ ] `npm run validate:citations` passes.
- [ ] No blocking runtime errors in browser console on local or live smoke routes.
- [ ] Service worker cache version updated when asset behavior changes.
- [ ] `index.html` app version updated for storage/cache compatibility when needed.

## Deployment verification
- [ ] Feature branch committed with clear message.
- [ ] Changes merged to `main`.
- [ ] `main` pushed to origin.
- [ ] Live URL `https://rkalani1.github.io/stroke/` serves updated build.
- [ ] Post-deploy smoke checks pass on local + live for all three viewport classes.

## Last completed run (2026-02-18, iter-037)
- [x] `npm run build` passes
- [x] `npm test` local smoke passes
- [x] `npm run qa` local + live smoke passes
- [x] Required viewports pass on local and live
- [x] Core tabs, diagnosis selectors, trial matcher, and keyboard shortcuts smoke-verified

## Last completed run (2026-02-18, iter-038)
- [x] Diagnosis-switch pathway assertions pass in smoke tests
- [x] TNK visibility gating smoke-verified across ischemic and non-ischemic diagnosis selections
- [x] `npm test` and `npm run qa` both pass with new assertions enabled

## Last completed run (2026-02-18, iter-039)
- [x] `npm test` pass after handoff metadata update
- [x] `npm run qa` pass after handoff metadata update

## Last completed run (2026-02-18, iter-040)
- [x] `npm test` pass after handoff pointer sync
- [x] `npm run qa` pass after handoff pointer sync

## Last completed run (2026-02-18, iter-041)
- [x] `npm test` pass after command-based handoff commit tracking update
- [x] `npm run qa` pass after command-based handoff commit tracking update

## Last completed run (2026-02-20, iter-042)
- [x] `npm run build` pass after contact-directory and evidence text updates
- [x] `npm test` local smoke pass after adding quick-contacts/settings assertions

## Last completed run (2026-02-20, iter-068)
- [x] `npm run build` pass after CVT special-population and QA assertion updates
- [x] `npm run validate:citations` pass (22 citation rows validated)
- [x] `npm test` local smoke pass with 0 issues across desktop/tablet/mobile
- [x] `npm run qa` local + live smoke pass with 0 issues across desktop/tablet/mobile

## Last completed run (2026-02-20, iter-069)
- [x] `npm run build` pass after scenario-level QA assertion updates
- [x] `npm test` local smoke pass with TIA/CVT scenario-state assertions enabled
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-070)
- [x] `npm run build` pass after protected-contact QA invariant updates
- [x] `npm test` local smoke pass with protected-contact assertions
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-071)
- [x] CVT key citation row matches PubMed primary metadata (PMID `38284265`, DOI `10.1161/STR.0000000000000456`)
- [x] `npm test` pass after citation metadata correction
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-072)
- [x] CI workflow added to enforce build + local smoke/citation checks on push/PR
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-073)
- [x] Scheduled live-smoke GitHub workflow added (`live-smoke.yml`)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-074)
- [x] Wake-up/EXTEND scenario assertions stabilized for both standard and compact encounter layouts
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-075)
- [x] Wake-up WAKE-UP/EXTEND non-eligibility reason tracing added across transfer/consult/signout/progress/discharge note outputs
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-076)
- [x] Wake-up note-trace smoke assertions pass (clipboard-validated generated note text)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-077)
- [x] Scheduled live-smoke workflow now opens/updates GitHub issue alerts on failure and auto-closes alerts on success
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-078)
- [x] Contraindication trace includes supportive negatives (when data are documented and in-range)
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-079)
- [x] Post-EVT BP infusion/target strategy details now propagate to transfer/signout/progress/discharge note outputs
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-080)
- [x] Citation validator enforces identifier format quality (PMID/DOI/NCT) and duplicate identifier detection
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues

## Last completed run (2026-02-20, iter-081)
- [x] Wake-up smoke includes clipboard assertion for contraindication `Supportive negatives:` note trace output
- [x] `npm run build` pass
- [x] `npm test` pass
- [x] `npm run qa` local + live smoke pass with 0 issues
