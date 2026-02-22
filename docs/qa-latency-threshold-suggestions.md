# QA Latency Threshold Suggestions (Auto-generated)

Generated: 2026-02-22T01:45:35.907Z
History source: docs/qa-latency-history.json
Profiles source: docs/qa-latency-profiles.json
Lookback entries: 8

| Target/Viewport | Samples | Current threshold | P95 observed | Recommended threshold | Delta | Action |
|---|---:|---:|---:|---:|---:|---|
| live/desktop | 3 | 42000 ms | 20228 ms | 25000 ms | -17000 ms | update |
| live/mobile | 3 | 50000 ms | 35245 ms | 43000 ms | -7000 ms | update |
| live/tablet | 3 | 45000 ms | 19059 ms | 23000 ms | -22000 ms | update |
| local/desktop | 5 | 40000 ms | 23870 ms | 29000 ms | -11000 ms | update |
| local/mobile | 5 | 46000 ms | 34922 ms | 42000 ms | -4000 ms | update |
| local/tablet | 5 | 43000 ms | 21242 ms | 26000 ms | -17000 ms | update |

Recommendation method: `recommended threshold = max(10000, rounded(P95 x 1.2))`.
Use `update`/`add` rows to manually revise `docs/qa-latency-profiles.json` when clinically acceptable.
