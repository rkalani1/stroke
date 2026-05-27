# QA Latency Recalibration (Auto-generated)

Generated: 2026-02-22T01:45:35.761Z
History source: docs/qa-latency-history.json
Lookback entries: 8
Total samples: 24

| Target/Viewport | Samples | P50 | P95 | Max | Recommended threshold |
|---|---:|---:|---:|---:|---:|
| live/desktop | 3 | 18360 ms | 20228 ms | 20435 ms | 25000 ms |
| live/mobile | 3 | 34644 ms | 35245 ms | 35312 ms | 43000 ms |
| live/tablet | 3 | 18898 ms | 19059 ms | 19077 ms | 23000 ms |
| local/desktop | 5 | 22235 ms | 23870 ms | 24222 ms | 29000 ms |
| local/mobile | 5 | 32463 ms | 34922 ms | 35044 ms | 42000 ms |
| local/tablet | 5 | 20262 ms | 21242 ms | 21403 ms | 26000 ms |

Method: recommended threshold = rounded `P95 x 1.2` (minimum `10000 ms`).
Use this table to adjust `docs/qa-latency-profiles.json` when sustained baseline drift is observed.
