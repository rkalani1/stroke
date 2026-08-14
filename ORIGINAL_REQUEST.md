# Original User Request

## 2026-08-14T08:04:26Z

Audit and update the stroke clinical decision-support application with all recent 2024-2026 clinical guidelines, update all 32+ educational resources and pages in the Education section, ensure minimized dropdown accordion structure is preserved, run the full validation test suite, and deploy to production (git push origin main).

Working directory: C:\Users\rkala\.gemini\antigravity\scratch\stroke
Integrity mode: development

## Requirements

### R1. Clinical Guideline Audit & Incorporation
Review and incorporate any recent 2024–2026 clinical stroke guidelines across the codebase, data files, and interactive tools (including 2026 AHA/ASA AIS updates, ESO 2024-2025, CSBP 2024, SVIN 2025, CATALYST DOAC timing meta-analysis, large-core EVT criteria, AIS BP guardrails, and pediatric reperfusion criteria), ensuring COR/LOE grading, citations, and interactive decision trees accurately reflect latest evidence.

### R2. Comprehensive Education Section & Resource Refresh
Update all 32+ educational modules, topic reviews, case guides, pathology summaries, and clinical pearls in the Education section (#tabpanel-references / content/bundle.json / src/app.jsx / education.json):
- Ensure latest 2024-2026 trials and clinical evidence are cited.
- Ensure all educational cards and sub-sections follow the collapsible <details> accordion structure and are minimized by default.
- Maintain seamless dark-mode support and AA contrast compliance across all educational elements.

### R3. Content Bundling & Automated Validation Pipeline
Re-bundle content assets and execute the complete verification suite:
- npm run content:bundle
- npm run content:validate
- npm run evidence:validate
- npm run validate:citations
- npm run validate:inline-citations
- npm run test:protocol-snapshot (update snapshot baseline with npm run test:protocol-snapshot:update if protocol text is updated with new guideline evidence)
- npm run check:leak-guard

### R4. Production Build & Deployment
Build the compressed production distribution (npm run build:prod) and push all verified changes to origin/main for live GitHub Pages deployment.

## Acceptance Criteria

### Guidelines & Clinical Evidence
- [ ] All 2024-2026 guideline statements across AIS, ICH, SAH, TIA, and CVT are accurately documented with correct Class of Recommendation (COR), Level of Evidence (LOE), and PMID citations.
- [ ] Guideline Library (#ref-guidelines) and interactive recommendation builders match the latest guideline catalog.

### Education Section
- [ ] All 32+ educational modules and reference pages are thoroughly updated and rendered with minimized dropdown accordions.
- [ ] Educational content bundle (content/bundle.json / education.json) passes all schema and currency validations.

### Verification & Deployment
- [ ] npm run content:validate passes with 0 errors.
- [ ] npm run evidence:validate passes with 0 errors.
- [ ] npm run validate:citations and npm run validate:inline-citations pass with 0 errors.
- [ ] npm run test:protocol-snapshot passes.
- [ ] npm run check:leak-guard confirms no institutional / PHI leaks.
- [ ] npm run build:prod builds and compresses bundle cleanly.
- [ ] All commits are pushed to origin/main.
