# Stroke

A client-side clinical decision support toolkit for stroke management with encounter workflows, calculators, protocols, trials, and evidence references.

## V2 Features
- Shift case list at the top of Encounter plus the shift taskboard.
- Pinned references with personal notes, plus global search across content.
- Clinical question tracker, teaching case builder, and question-of-the-day.
- Panic screen button in the header.
- Mobile bottom navigation and sticky action bar per tab.

## Quick Usage
- Use the top search (press `/`) to jump to management tools, references, and more.
- Shift cases are saved in the top bar; Shift tab is the rounding board.

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
- `#/tools`
- `#/tools/clinic`
- `#/tools/map`
- `#/shift`
- `#/questions`
- `#/teaching`
