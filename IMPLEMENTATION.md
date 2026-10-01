# Encounter-first implementation and verification

## Baseline and scope

Starting/deployed commit: `4f8e99de9f605327bb901d0585f279cc7ebcd12e`, version 6.30.7. The original clean checkout at `9512bdf` is preserved. Branch: `feat/encounter-first-20261001`. Implementation source commit: `5c364246dd862e026886fdde737fd7ce9925756d`; final style/verification changes follow it in this branch. Exact archival rollback ref: **`archive/pre-encounter-first-20261001-4f8e99d`**, pushed to origin.

Pages API confirms legacy branch-root Jekyll deployment from `main`, `/`. Requested client model/speed settings were not exposed or changed. This record covers the finished candidate; final PR/CI/head status is reported in the handoff. Publication is withheld pending the clinical gate below. No main merge or live 7.0 deployment is claimed.

## Keep, embed, retire

- Keep protected ICH/ischemic protocol literals, drug modals, PocketCards, external Telestroke map, public synthetic restrictions, supported native wrapper source, and the atomic opt-in PWA controller.
- Embed canonical NIHSS, GCS, ICH severity/ABC2 volume, renal/lytic arithmetic, qualified historical/recommendation screens, explicit timestamps and one generated synthetic summary. Phone/video, diagnosis and follow-up branches remain distinct. Navigation preserves session values; clearing/context changes invalidate outputs and drafts; reset/reload behavior is explicit.
- Remove Education/teaching/simulators, general Trials/Guidelines/References/calculator browsing, matcher/search/atlas payload, 24 teaching documents (77,425,236 bytes), teaching graphics, duplicate generators/notes, private census/persistence and broad content/PDF seed/watch/promotion maintenance. History remains at the archival ref.
- Maintain 10 recommendations, 12 evidence claims, 43 citations, six selected source projections and canonical clinical statements/protected exceptions. Preserve actual dates/corrections; 116 former endpoints return explicit null retirement envelopes. Seven MCP tools remain.

`output/site` is an explicit public stage. Generated `_config.yml` excludes source/support/native/docs roots from actual branch-root Pages output. Checks include all deferred modules, retired direct URLs and JSON metadata. **The live site remains 6.30.7, so public portal/download removal awaits the gated deployment.**

## Before/after measurements

Same Chromium 143.0.7499.4, uncompressed local Python HTTP, no CPU/network throttling, 1440×900, five fresh contexts with SW disabled for cold timing. Same `measure.mjs` age-field endpoint; fill plus two frames includes automation overhead. Runs were isolated from concurrent browser/unit work. Hosted and physical-device performance is unmeasured.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Initial JavaScript, raw | 2,306,209 B | 255,027 B |
| Initial JavaScript, gzip | 580,151 B | 82,218 B |
| All initial/deferred JavaScript, raw | 6,377,252 B | 542,570 B |
| All JavaScript, gzip | 1,562,623 B | 149,275 B |
| CSS, raw | 180,352 B | 71,334 B |
| Installed cache | 7,352,562 B / 48 responses | 1,383,098 B / 35 responses |
| Initial JS transfer, uncompressed local HTTP | 2,309,576 B | 255,627 B |
| Usable Encounter median | 94.08 ms | 35.43 ms |
| Input fill + two frames median | 23.42 ms | 16.87 ms |

Initial raw JS falls 88.9%, total raw JS 91.5%, installed cache 81.2%. Baseline static web inventory: 297 files / 92,996,564 B. Explicit candidate: 165 raw files / 1,828,120 B (181 files / 2,135,376 B including optional compression). The baseline inventory was not a complete Pages manifest; this is qualified static accounting, not transfer or live deletion evidence.

Budgets tightened to 300 KB initial raw / 100 KB gzip, 600 KB all raw / 180 KB gzip, 90 KB CSS and 2 MB complete precache. No budgets raised.

## Final engineering checks

- Production build/stage, checksum/version coherence and module/asset/API retirement guards: passed.
- Full unit suite: 48 files, **878 passed / 3 deployment-state skipped**; controller **8/8 passed**. Main-only deployment checks remain enforced on main. Exact retired-test reasons and retained vectors are recorded in `tests/LEAN-TEST-MIGRATION.md` and JSON inventories; no new Vitest exclusions.
- `npm test`: passed byte/public/source/retirement/protocol guards, public leak scan, citation/PMID/inline/evidence/content schema, AutoMedBench-Lite and **15/15 rendered browser checks**. Live PMID lookup: 43 resolved, zero identity mismatches; existing volume-omission warnings remain. Currency: zero stale records, five missing genuine review dates.
- Protected snapshots: unchanged **ICH 524 / ischemic 754 lines**, including drug modals. General calculator-directory fixture remains byte-identical; its retired traversal is replaced by embedded regressions. Telestroke link and observed external HTML fingerprint remain unchanged.
- Browser: 360/390/768/1440 light/dark, keyboard/focus/labels/numeric semantics and 200% CSS layout scaling and 720px desktop-reflow simulations; no overflow, console errors or failed core resources. Eight independent adaptive viewport/theme runs preserve existing ceilings; invalid profiles/files/missing values and a deliberate 1 ms breach fail closed.
- Offline: fresh complete online install, offline reload, synthetic Encounter/calculations/summary and protected drug modal passed. Core requests require no external service; external links carry no encounter context.
- Actual archived-baseline upgrade **6/6 passed**: defer preserves old graph/entries; explicit acceptance activates the complete graph and clears the session; disconnected/503 chunk installs preserve the old offline version then retry; second client blocks activation; protocol corruption isolates failure and permits explicit reload recovery; scoped cleanup preserves unrelated origin caches. CI reproduces the baseline via `git archive`, not local setup.
- Privacy instrumentation found no encounter values in storage/IndexedDB, network/URLs, console or cached responses. Arbitrary-host public build and private-output separation passed. Free-text safeguards include BP.
- Independent dose vectors: 37 cases covering 40/80/83/100/140 kg, cap/band edges, decimals/invalid units/inputs and exact total/bolus/infusion consistency. State regressions plus retained timing/screens cover partial NIHSS, explicit zero, clearing, incompatible contexts, reset, strict calendar/DST, future events and subminute window boundaries. Delayed clipboard resolution/rejection after edits, regeneration or reset cannot attest/select a newer draft.
- MCP: 41 calls across seven tools passed. Maintained synthetic helper sweep: 3,895 rows across seven domains passed; these are not clinical validation.
- Tokens, 72 contrast pairs, 44 px/equivalent native-label touch targets across 12 viewport/route combinations, workflow YAML and whitespace checks passed.

The local staged private leak scan could not run because its private denylist is unavailable locally. Public full-tree scanning passed; unchanged binaries are native icons/splash/fonts/wrapper assets. Repository CI has the configured private-denylist secrets and retains the mandatory private gate. Its result must pass before merge; no private rules were fabricated, removed or bypassed with `--no-verify`.

Screenshots were visually inspected. Browser/offline/update checks simulate Chromium devices; they are not physical iOS/Android, native release or accessibility certification. Native builds, post-publication main-state/live parity/smoke and deployment rollback remain unrun. Cloud CI/Lighthouse results are reported in the final handoff. Baseline and candidate dependency audits report the same 11 vulnerabilities; unused lucide/fake-indexeddb dependencies were removed without a forced migration.

## Review and clinical limits

Bounded independent review found and fixed BP free-text export protection, invalid DST normalization, stale async clipboard completion and future consent-time qualification. Re-review exposed subminute rounding at source-window boundaries; strict validation now precedes exact millisecond arithmetic with just-after-boundary regressions. Hidden GCS state no longer enters incompatible summaries. Declared theme-token coverage prevents undefined link variables. The pre-merge review also found rounded ICH threshold comparisons, an unreachable fresh-TIA DAPT review and stale protocol input copies. These are repaired: unrounded 15/30 mL flags, explicit current-context reperfusion review with recorded-event conflict holds, and canonical protocol measurements with source-dependent review invalidation. Independent below/at/above boundary tests, fresh/switched TIA checks and 18 React DOM cases cover clearing, explicit zero, incompatible contexts, focus, navigation and wall-clock updates. Focused re-review reports no remaining findings. No actionable engineering finding is silently accepted.

**Publication blocker:** protected ICH reversal prose considers factor-Xa dialysis in renal failure while its PK table says the agents are not dialyzable. Locked locations already display the unresolved conflict and select no dialysis action. Primary Xarelto/FDA Eliquis label statements located during this run conflict with dialysis-removal inference; see `docs/source-limits.md`. Protected wording/baselines remain unchanged. Owner adjudication through the protected clinical review process is required before merge/deployment.

Retained AIS partially applied corrections, source access/review limits and the NCS ASTRAL body/table discrepancy remain explicit. Metadata lookup, arithmetic, builds and snapshots do not establish clinical validation or new review dates.

External links: Telestroke map HTTP 200, 18,735 B, exact baseline SHA-256 `53dd834cf0579b4b27ff67c6230bfbc49e0040365cb949f496b5f717ce5777c8`. This observes link/HTML identity, not its whole external module graph. UpToDate resolves to login; OpenEvidence blocks automated access with HTTP 403, so authenticated content access is unverified.

## Release and rollback

Finished candidate is ready for the named clinical gate after normal CI verification. Source/verification commits and PR are reported in the final handoff. Merge/Pages deployment are withheld; an open PR is not deployed.

Rollback ref: **`archive/pre-encounter-first-20261001-4f8e99d`**. Restore through a reviewed forward commit, assign a *new* coherent app/cache version, build/validate and release normally. Reusing an old worker identity is insufficient for existing 7.x clients. Deployment rollback was not executed; baseline upgrade/failure/retry was tested. Already-open old pages and permanently offline devices cannot be remotely forced to update.
