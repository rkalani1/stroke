# Encounter-first implementation and verification

## Baseline and scope

Starting/deployed commit: `4f8e99de9f605327bb901d0585f279cc7ebcd12e`, version 6.30.7. The original clean checkout at `9512bdf` is preserved. Branch: `feat/encounter-first-20261001`. Implementation source commit: `5c364246dd862e026886fdde737fd7ce9925756d`; final style/verification changes follow it in this branch. Exact archival rollback ref: **`archive/pre-encounter-first-20261001-4f8e99d`**, pushed to origin.

Pages API confirms legacy branch-root Jekyll deployment from `main`, `/`. Requested client model/speed settings were not exposed or changed. This record covers the finished candidate; final PR/CI/head status is reported in the handoff. The owner authorized the scoped ICH correction on 2026-10-01; the named clinical gate is resolved. This committed record describes the checked pre-merge candidate. Final cloud checks, merge SHA and actual live verification are recorded in the PR/final handoff; this source record does not imply deployment.

## Keep, embed, retire

- Keep protected ICH/ischemic protocol literals, drug modals, PocketCards, external Telestroke map, public synthetic restrictions, supported native wrapper source, and the atomic opt-in PWA controller.
- Embed canonical NIHSS, GCS, ICH severity/ABC2 volume, renal/lytic arithmetic, qualified historical/recommendation screens, explicit timestamps and one generated synthetic summary. Phone/video, diagnosis and follow-up branches remain distinct. Navigation preserves session values; clearing/context changes invalidate outputs and drafts; reset/reload behavior is explicit.
- Remove Education/teaching/simulators, general Trials/Guidelines/References/calculator browsing, matcher/search/atlas payload, 24 teaching documents (77,425,236 bytes), teaching graphics, duplicate generators/notes, private census/persistence and broad content/PDF seed/watch/promotion maintenance. History remains at the archival ref.
- Maintain 10 recommendations, 12 evidence claims, 43 citations, six selected source projections and canonical clinical statements/protected exceptions. Preserve actual dates/corrections; 116 former endpoints return explicit null retirement envelopes. Seven MCP tools remain.

`output/site` is an explicit public stage. Generated `_config.yml` excludes source/support/native/docs roots from actual branch-root Pages output. Checks include all deferred modules, retired direct URLs and JSON metadata. **At this pre-merge checkpoint the live site was 6.30.7. Actual live removal is verified separately after publication.**

## Before/after measurements

Same Chromium 143.0.7499.4, uncompressed local Python HTTP, no CPU/network throttling, 1440×900, five fresh contexts with SW disabled for cold timing. Same `measure.mjs` age-field endpoint; fill plus two frames includes automation overhead. Runs were isolated from concurrent browser/unit work. Hosted and physical-device performance is unmeasured.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Initial JavaScript, raw | 2,306,209 B | 255,027 B |
| Initial JavaScript, gzip | 580,151 B | 82,217 B |
| All initial/deferred JavaScript, raw | 6,377,252 B | 542,597 B |
| All JavaScript, gzip | 1,562,623 B | 149,276 B |
| CSS, raw | 180,352 B | 71,334 B |
| Installed cache | 7,352,562 B / 48 responses | 1,383,125 B / 35 responses |
| Initial JS transfer, uncompressed local HTTP | 2,309,576 B | 255,627 B |
| Usable Encounter median | 94.08 ms | 33.32 ms |
| Input fill + two frames median | 23.42 ms | 15.68 ms |

Initial raw JS falls 88.9%, total raw JS 91.5%, installed cache 81.2%. Baseline static web inventory: 297 files / 92,996,564 B. Explicit candidate: 165 raw files / 1,828,147 B (181 files / 2,135,368 B including optional compression). The baseline inventory was not a complete Pages manifest; this is qualified static accounting, not transfer or live deletion evidence.

Budgets tightened to 300 KB initial raw / 100 KB gzip, 600 KB all raw / 180 KB gzip, 90 KB CSS and 2 MB complete precache. No budgets raised.

## Final engineering checks

- Production build/stage, checksum/version coherence and module/asset/API retirement guards: passed.
- Full unit suite: 48 files, **878 passed / 3 deployment-state skipped**; controller **8/8 passed**. Main-only deployment checks remain enforced on main. Exact retired-test reasons and retained vectors are recorded in `tests/LEAN-TEST-MIGRATION.md` and JSON inventories; no new Vitest exclusions.
- `npm test`: passed byte/public/source/retirement/protocol guards, public leak scan, citation/PMID/inline/evidence/content schema, AutoMedBench-Lite and **15/15 rendered browser checks**. Live PMID lookup: 43 resolved, zero identity mismatches; existing volume-omission warnings remain. Currency: zero stale records, five missing genuine review dates.
- Protected snapshots: **ICH 524 / ischemic 754 lines**, with only four ICH lines changed for the explicitly authorized drug-removal correction, including otherwise unchanged drug modals. General calculator-directory fixture remains byte-identical; its retired traversal is replaced by embedded regressions. Telestroke link and observed external HTML fingerprint remain unchanged.
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

**Clinical gate resolved:** on 2026-10-01 the owner explicitly instructed: "Yes, apply that correction, then finish the checks, merge, and deploy." The two ICH drug-removal passages now use the accepted rivaroxaban/apixaban/edoxaban label wording. Only four affected ICH snapshot lines were edited manually; no blanket reset occurred. All other protected wording, rules, modals, Telestroke baseline and clinical-review dates are preserved. Primary label evidence and exact accepted text are recorded in `docs/source-limits.md`. This scoped adjudication does not certify the entire protocol.

Retained AIS partially applied corrections, source access/review limits and the NCS ASTRAL body/table discrepancy remain explicit. Metadata lookup, arithmetic, builds and snapshots do not establish clinical validation or new review dates.

External links: Telestroke map HTTP 200, 18,735 B, exact baseline SHA-256 `53dd834cf0579b4b27ff67c6230bfbc49e0040365cb949f496b5f717ce5777c8`. This observes link/HTML identity, not its whole external module graph. UpToDate resolves to login; OpenEvidence blocks automated access with HTTP 403, so authenticated content access is unverified.

## Release and rollback

Owner-authorized correction is applied and local checks pass. This is the pre-merge verification checkpoint; normal PR/Pages checks and live verification determine the final release state. Exact release commits and endpoints are reported in the final handoff. An open PR is not deployed.

Rollback ref: **`archive/pre-encounter-first-20261001-4f8e99d`**. Restore through a reviewed forward commit, assign a *new* coherent app/cache version, build/validate and release normally. Reusing an old worker identity is insufficient for existing 7.x clients. Deployment rollback was not executed; baseline upgrade/failure/retry was tested. Already-open old pages and permanently offline devices cannot be remotely forced to update.

## Post-merge verification repair

PR #228 merged as `cc2b53f789d9d4f12e5a5e5f88d88d72422ca16c`. Pages published version 7.0.0 and all 137 declared shell/module/API artifacts match the checked bytes. The full actual-live smoke passes 16/16; 50 direct retired/support URLs, including all 24 teaching downloads, return 404/410.

Main CI's separate adaptive job failed its local retired-URL assertion because it lacked `output/site` and the harness implicitly served the repository root. Actual live retirement was verified separately. Standalone main/scheduled jobs now stage the same public allowlist before local QA; the default harness fails fast when that stage is missing. No test assertion, latency ceiling or public exclusion is weakened. Final repair PR/main check results are recorded in the release handoff.


## Owner-requested follow-up — 7.0.1 (in progress)

The owner authorized production refinement, then explicitly requested restoring telephone Pulsara and video Epic formats, removing the named visible demo/session/source-directory prose, and restoring Trials as a top tab beside Protocols. These supersede the earlier visible-label and Trials retirement choices. Calculators & Links replaces Tools & sources. Other retirement restrictions, public-build separation, identifier screening, session-only state, source limitations and release gates remain active.

Documentation is generated from canonical fields on explicit action; incomplete exams, unknown events and missing values remain qualified. Optional history, imaging, labs and narrative fields are empty by default and screened. Format or source changes invalidate the draft.

Final review found and repaired a skip-link hash-routing bug and a completed safety-pause attestation that had no recorded confirmation events. The protected helper corpus remains unchanged; controlled production cards suppress unsupported completion and copy. One visibility-aware wall-clock refresh replaces duplicate intervals; source edits and visibility/resume refresh absolute elapsed times.

Combined candidate verification: 968 Vitest cases and 8 controller tests pass (three repository-state cases are intentionally main-only). npm test passes all validators and 20 browser cases. Upgrade/failure recovery 6/6, MCP 41 calls over seven maintained tools, protected ICH524/ischemic754 text locks, generated metadata, tokens/contrast and 21 touch-target viewport/route combinations pass. Rendered desktop/mobile Trials reviewed. No protected corpus or snapshot changes in this follow-up. Trial profile schema/currency validation retains original dated checks and the two unverified withheld profiles.

Current initial JS 252,011 raw/82,060 gzip; whole offline JS 630,088/171,342; CSS 72,758; complete cache 1,471,659 bytes/38 entries. Trials contributes90,671 raw/22,211 gzip on demand. Shared table criteria removed duplicate facts. The newly authorized Trials scope raises only the reviewed whole-JS raw ceiling from600 to640KiB; initial300KiB/100KiB gzip, total180KiB gzip, CSS90KiB and cache2MiB remain unchanged. No packed-data layer was added.

Same uncompressed local Chromium143, 1440×900, SW blocked, no throttling, three fresh contexts and2600ms idle samples: empty Encounter and Tools after Protocols now have zero periodic callbacks (previous2 and5). Active timed Encounter uses one interval; exact sample callback counts depend on phase. Median script work is3.803→0ms empty,6.932→3.799ms timed,16.682→0ms Tools. Median usable-load77.795→78.960ms establishes no startup speedup; initial bytes255,027→252,011. Values are local measurements, not device/cloud guarantees.

Additional repairs: protocol timing receives the validated complete elapsed shape and labels Discovery separately; unknown LKW does not invent onset circumstances; telephone follow-up context survives; confirmed New encounter closes its utility menu. Browser regressions cover these and both complete/incomplete documentation paths.

Next: commit/push this reviewed candidate, normal PR checks and merge, then verify main CI, Pages build, exact live bytes and actual-live browser/retired-URL checks.

Local leak checks use the public denylist; the authoritative private list is held by existing CI. An optional local hook installation was reverted to the original unset configuration after it could not load that private list. No hook file, private scan, CI gate or release protection was changed. The full private CI scans must pass on this exact candidate before merge.


### PR 230 CI synchronization repair

The first PR run passed both private identifier scans, unit tests and MCP smoke, but the rendered browser smoke checked the newly selected Trials Tables panel before the hash route rendered. Its immediate visibility assertion failed and left the next check on Trials. Replaced that assertion with the existing Playwright visible-state wait and added unconditional encounter reset for this check; no production behavior or test expectations were relaxed. The exact updated candidate must pass normal CI before merge.


## Original aesthetics restoration — 7.0.2

Starting production commit: b86fc38d5ee5eafc8139441ed08a9773235bee17 (7.0.1). The owner requested the original aesthetics with the trimmed content. The original archival design tokens are byte-identical to current tokens, so the change restores the sheet/masthead/navigation/card/control recipes in a compact shell stylesheet. A decorative inline activity SVG avoids restoring the old icon runtime. The current top destinations, all clinical content, notes, state, routes and retirement boundaries remain intact; only the section-number presentation changes. The old desktop sidebar and mobile bottom navigation are not needed for the retained top-level navigation.

First production build and browser pass: 20/20; 72 token contrast pairs pass and current asset ceilings pass. Desktop/mobile light/dark views were inspected against archived screenshots. A small mobile menu placement adjustment keeps the popover anchored to its actual More control after wrapping. Final versioned build, touch controls, required release checks and live verification follow; the final receipt is written in the task outputs after deployment.

Final local verification: production build; 968 Vitest tests and 8 controller tests; full npm test with 20/20 rendered workflows; ICH524/ischemic754 locks; 72 contrast pairs; 21 touch viewport/route combinations; 320/390/768px menu bounds; generated-asset checks all pass. All 125 changed data exports were compared structurally and differ only in appVersion. No clinical-source record or protocol baseline changed. The decorative SVG is hidden/nonfocusable; cache tests retain exact identity assertions for the new coherent 7.0.2 cache name.
