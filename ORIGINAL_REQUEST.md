# Original User Request

## 2026-08-14T10:59:05Z

This is a single self-contained fix; keep it small and focused.

Reorganize the primary navigation tabs so that the Trials tab is positioned between Protocols and Guidelines, and consolidate Educational Resources into the Guidelines & References section as a sub-tab.

Working directory: C:\Users\rkala\stroke
Integrity mode: development

## Requirements

### R1. Primary Navigation Order
Update desktop and mobile navigation layouts, tablists, keyboard navigation sequences, and ARIA attributes so that the primary tab sequence is:
1. Encounter
2. Protocols
3. Trials
4. Guidelines & References

### R2. Consolidated Guidelines & References Section
Consolidate Educational Resources into the Guidelines & References tab (`research`), providing sub-navigation across:
1. Guidelines
2. Reference Library
3. Educational Resources
Maintain full functionality of all educational modules, simulators, and calculators, while supporting backwards-compatible hash routing (e.g. redirecting legacy `#/education` routes to the consolidated section).

### R3. Quality and Build Integrity
Ensure the client bundle builds cleanly and all automated verification checks, static validations, and test suites pass without regression. Run production build (`npm run build:prod`) to generate production assets.

## Acceptance Criteria

### Navigation Layout & Behavior
- [ ] Desktop navigation tab bar displays: Encounter, Protocols, Trials, Guidelines & References in exact order.
- [ ] Mobile bottom navigation bar displays the four tabs in the same sequential order with appropriate icons and active states.
- [ ] Tablist keyboard navigation (Arrow Left/Right, Home, End) traverses the tabs in the updated order.

### Section Consolidation & Routing
- [ ] Guidelines & References contains accessible sub-tabs for Guidelines, Reference Library, and Educational Resources.
- [ ] The Educational Resources sub-tab correctly embeds and renders all educational modules, interactive simulators, and tools.
- [ ] Hash navigation to `#/trials`, `#/research/guidelines`, `#/research/references`, `#/research/education`, and legacy routes like `#/education` correctly loads the target views.

### Verification & Automated Testing
- [ ] `npm run build:prod` succeeds with zero errors, producing updated compressed production bundles.
- [ ] `npm test` passes all test suites, including leak guards, protocol guards, citations validation, and content bundles.
