# Stroke

A client-side clinical decision support toolkit for stroke management with encounter workflows, calculators, protocols, trials, and evidence references.

## V2 Features
- Shift taskboard with rounding mode, checklist generators, and signout tasks.
- One-tap timeline recorder, clipboard packs, and quick macros inside Encounter.
- Personal macro library with variable prompts and favorites.
- De-identified case log with analytics, workload timer, and exports.
- Pinned references with personal notes, plus global search across content.
- Clinical question tracker, teaching case builder, and question-of-the-day.
- App lock with PIN, auto-timeout, and panic screen.
- Backup/restore with schema migration and selective exports.
- Mobile bottom navigation and sticky action bar per tab.

## Quick Usage
- Use the top search (press `/`) to jump to calculators, references, macros, and more.
- Encounter now includes Timeline and Clipboard Packs panels plus Quick Macros.
- Shift tab is your rounding board; Case Log stores de-identified cases.
- Settings handles De-ID mode, app lock, backups, and data wipes.

## Privacy & Safety
- Local-only: entered data stays in your browser and is not transmitted by the app.
- Avoid identifiers; use aliases. De-ID mode is ON by default.
- Free-text storage is OFF by default; enable it only if needed.
- Local data auto-expires after 12 hours of inactivity (configurable in Settings).
- Use Settings to export/backup or wipe local data at any time.

## Backup & Restore
- Settings > Export Backup saves a full JSON snapshot.
- Settings > Import Backup validates and migrates data before loading.
- You can also export subsets (macros or case log) from Settings.

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
- `#/macros`
- `#/case-log`
- `#/questions`
- `#/teaching`
- `#/settings`
