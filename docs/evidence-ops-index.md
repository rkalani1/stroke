# Evidence Ops Index (Auto-generated)

Generated: 2026-02-21T17:09:05.936Z

## Current Artifacts
| Artifact | Path | Generated | Key count |
|---|---|---|---|
| Watchlist | docs/evidence-watchlist.md | 2026-02-21T17:09:05.364Z | P0/P1 rows: 11 |
| Promotion checklist | docs/evidence-promotion-checklist.md | 2026-02-21T17:09:05.537Z | Total queued: 11 |
| Promotion template (all) | docs/evidence-promotion-template.md | 2026-02-21T17:09:05.670Z | Pending templates: 11 |
| Promotion template (P0) | docs/evidence-promotion-template-p0.md | 2026-02-21T17:09:05.803Z | Pending templates: 1 |

## Maintenance Commands
- `npm run evidence:watch`
- `npm run evidence:watch:filtered-all`
- `npm run evidence:watch:dominance`
- `npm run evidence:watch:topic-thresholds`
- `npm run evidence:promote`
- `npm run evidence:template`
- `npm run evidence:template:p0`
- `npm run validate:evidence-promotion`
- `npm run evidence:refresh`

## Validation Notes
- Promotion checklist must stay in sync with watchlist high-priority entries (P0/P1).
- `npm test` and `npm run qa` include sync validation and will fail on drift.
