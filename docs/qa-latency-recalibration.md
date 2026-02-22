# QA Latency Recalibration (Auto-generated)

Generated: 2026-02-22T01:34:45.813Z
History source: docs/qa-latency-history.json
Lookback entries: 5
Total samples: 9

| Target/Viewport | Samples | P50 | P95 | Max | Recommended threshold |
|---|---:|---:|---:|---:|---:|
| live/desktop | 1 | 18254 ms | 18254 ms | 18254 ms | 22000 ms |
| live/mobile | 1 | 34644 ms | 34644 ms | 34644 ms | 42000 ms |
| live/tablet | 1 | 17762 ms | 17762 ms | 17762 ms | 22000 ms |
| local/desktop | 2 | 22340 ms | 24034 ms | 24222 ms | 29000 ms |
| local/mobile | 2 | 34738 ms | 35013 ms | 35044 ms | 43000 ms |
| local/tablet | 2 | 18711 ms | 19102 ms | 19145 ms | 23000 ms |

Method: recommended threshold = rounded `P95 x 1.2` (minimum `10000 ms`).
Use this table to adjust `docs/qa-latency-profiles.json` when sustained baseline drift is observed.
