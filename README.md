# Stroke Toolkit

A client-side clinical decision support toolkit for stroke management with encounter workflows, calculators, protocols, trials, and evidence references.

## Privacy
- Patient identifiers should not be entered.
- Data is stored locally in your browser (if storage is enabled).
- Local data auto-expires after 12 hours of inactivity.
- Use the "Clear local data" button in the header to wipe stored data.

## Local configuration
Create `config.local.json` next to `index.html` (ignored by git). Start from `config.example.json`.

Example:
```json
{
  "institutionLinks": [
    { "label": "Intranet stroke protocol", "url": "https://...", "note": "optional" }
  ],
  "ttlHoursOverride": 8
}
```

If `config.local.json` is missing, institution links are disabled. Invalid JSON shows a warning in the About/Settings panel.

## Deep links
- `#/home`
- `#/encounter`
- `#/ich`
- `#/management`
- `#/calculators`
- `#/trials`
- `#/evidence`
- `#/tools`
- `#/tools/clinic`
- `#/tools/map`
