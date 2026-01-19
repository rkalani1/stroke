# Stroke

A client-side clinical decision support toolkit for stroke management with encounter workflows, calculators, protocols, trials, and evidence references.

## V2 Features
- Shift case list at the top of Encounter plus the shift taskboard.
- Pinned references with personal notes, plus global search across content.
- Clinical question tracker, teaching case builder, and question-of-the-day.
- Panic screen and lock indicator in the header.
- Mobile bottom navigation and sticky action bar per tab.

## Quick Usage
- Use the top search (press `/`) to jump to calculators, references, and more.
- Shift cases are saved in the top bar; Shift tab is the rounding board.

## Privacy & Safety
- Local-only: entered data stays in your browser and is not transmitted by the app.
- Avoid identifiers; use aliases. De-ID mode is ON by default.
- Free-text storage is OFF by default; enable it only if needed.
- Local data auto-expires after 12 hours of inactivity.
- Use the header “Clear local data” button to wipe stored data.

## GitHub Pages Routing
- This app is deployed under the base path `/stroke/` and uses hash routing.
- Use hash routes for deep links to avoid GitHub Pages 404s.

## Deep links
- `#/encounter`
- `#/ich`
- `#/management`
- `#/calculators`
- `#/trials`
- `#/evidence`
- `#/tools`
- `#/tools/clinic`
- `#/tools/map`
- `#/shift`
- `#/questions`
- `#/teaching`
