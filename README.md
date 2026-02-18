# Stroke

A client-side clinical decision support toolkit for stroke management with encounter workflows, calculators, protocols, trials, and evidence references.

## V2 Features
- Shift case list at the top of Encounter.
- Clinic checklist and telestroke map links at the top of the page.
- Global search across management tools, trials, and references.
- Mobile bottom navigation and sticky action bar per tab.

## Quick Usage
- Use the top search (press `/`) to jump to management tools, references, and more.
- Use the clinic checklist and telestroke map links at the top of the page.
- Shift cases are saved in the top bar.

## Privacy & Safety
- Local-only: entered data stays in your browser and is not transmitted by the app.
- Avoid identifiers in free-text fields when possible.
- Local data auto-expires after 12 hours of inactivity.
- Clear local data using your browser's site data/storage controls.

## GitHub Pages Routing
- This app is deployed under the base path `/stroke/` and uses hash routing.
- Use hash routes for deep links to avoid GitHub Pages 404s.

## Deep links
- `#/encounter`
- `#/management`
- `#/management/ich`
- `#/management/ischemic`
- `#/management/calculators`
- `#/management/references`
- `#/trials`

## QA Commands
- `npm test` runs local smoke checks (desktop/tablet/mobile).
- `npm run qa` runs local + live smoke checks and writes `output/playwright/qa-smoke-report.json`.
- `npm run build` builds production assets before deploy.
