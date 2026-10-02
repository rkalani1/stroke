## Active source-precision and startup review (2026-10-01)

Baseline:7.6.2, `1f2d18ffa9b5b5106e5db5e40d572f65a09961c7`, clean checkout and matching Pages build. Previous goal turn: progress. Branch:`codex/source-precision-preload-20261001`; rollback:`archive/pre-source-precision-preload-20261001-1f2d18f`.

Implemented generated preloads for the exact static Encounter module graph; dynamic surfaces remain deferred and no JavaScript is added. Initial paired HTML-only testing on the same7.6.2 artifact (six alternating pairs,390px Chromium,150ms simulated latency,200KB/s download,4x CPU slowdown,service workers blocked) measured median usable Encounter2832.9→2681.0ms and LCP2932→2782ms. These local uncompressed observations are not a production Lighthouse claim. Final7.6.2/7.6.3 artifacts repeated the result across six alternating pairs: median usable Encounter2849.5→2690.5ms (5.6%), LCP2950→2788ms; input-plus-two-frames37.2→35.6ms, observed blocking0/0ms. No whole-site or physical-device speedup is claimed. Initial/all JavaScript remain307155/687169raw bytes (gzip+1B each); CSS85738B unchanged; complete45-entry cache1943304→1944406B (+1102B). Existing ceilings are unchanged. Release receipts follow.

Expanded source review compares every displayed numeric/population/endpoint claim in58 study summaries with primary abstracts. MIND overview timing, ACTION-CVT and AVERT dose-response study-design labels are corrected; selected primary endocarditis guidance is now linked and its access scope documented; source-access/correction limitations remain explicit. Protected protocols, all80topics/58summaries/16calculators, old citation links and removed Completed evidence destination are preserved.

Initial checks caught an incomplete cache-version bump; it was repaired before publication, retaining the existing cache naming convention and all assertions. Subsequent1529unit cases+8controller tests and33local published-artifact browser workflows pass. The browser suite is local; its optional final live check is a single deployment smoke, not33live workflows. Final local checks also pass24/24 targeted cases across Chromium/Firefox/WebKit, six7.6.2→7.6.3 upgrade/recovery cases,55MCP calls across eight tools,72contrast pairs,token checks and unchanged payload ceilings. The181-record source-label audit found the two corrected classifications and no further confirmed discrepancy. Normal private CI, merge/Pages and exact live-byte verification remain release gates.

## Active reassessment — study search and MRI selection (2026-10-01)

Baseline: 7.6.1, `37039d16d7d28805b6ffb9e4c3836ee8a2ea459c`, clean checkout and matching production. Prior goal turn supplied new Firefox/WebKit and original-to-final upgrade evidence; classified as progress. Dedicated branch: `codex/evidence-findability-mri-review-20261001`. Rollback ref: `archive/pre-findability-mri-review-20261001-37039d1`.

Implemented direct, filtered study-search links with exact-name ranking, plus an explicit MRI territorial-extent finding separate from review. The same-target link regression found during independent review is repaired and tested. Phone navigation fits two rows when labels permit; Evidence section counts and long trial names wrap at enlarged text; Encounter section navigation adapts to available font-relative width.

Local verification: 1,529 unit cases and eight controller cases; 33 production-browser workflows including both MRI documentation formats and repeated study activation; six immediate-baseline upgrade/recovery cases; unchanged ICH 524 / ischemic 754 locks; 55 MCP calls/eight tools; 72 contrast pairs and token checks. All 80 topic / 58 study / 16 calculator records remain identical. Clinical source scope and direct-publisher access limits are in docs/source-limits.md. No protected source or review date was refreshed.

Payload vs 7.6.1: initial JavaScript 307,155 raw / 102,098 gzip bytes (+223/+109); all JavaScript 687,169 raw / 196,675 gzip (+1004/+358); CSS 85,738 bytes (+505); 45-entry installed cache 1,943,304 bytes (+1,509). Existing ceilings pass unchanged; this small clinical/retrieval repair is not a claimed speedup. Final independent rendered audit passed 35/35 checks in each of Chromium, Firefox and WebKit (105 total), including 16 width/theme/text-size combinations, filtered and repeated study navigation, touch targets, zero page overflow and unobscured Encounter jump targets. Remaining release gates: scoped commit/PR/private CI, main merge/Pages, exact live artifact and workflow verification. No universal accuracy or physical-device certification is claimed.

# Encounter-first implementation and verification

## Clinical-reference restoration — checked candidate (7.3.0)

The owner authorized a deep on-call, hospital and clinic review, implementation, merge and deployment. Baseline: clean7.2.0 `372aad76704eda8da7b0b7c782c40f3fb199a0d2`. Immediate rollback ref: `archive/pre-clinical-reference-20261001-372aad7`.

- Evidence adds 17 source-bound topics with question search and on-call/hospital/clinic filters. Trials gains 16 completed-study cards, separately from registry screening. Cards preserve population, outcome, limitations and actual source-access scope; copy includes sources and limitations. One canonical JSON endpoint supplies UI, offline installation and the eighth MCP tool.
- Quick links reveal existing reversal, post-lytic hemorrhage and angioedema sections. Contextual Encounter links connect guidance and worksheets. TIA readiness projects canonical explicit yes/no findings and workup/follow-up gaps, with no discharge clearance or duplicated form state.
- Reference loading is lazy, app-version matched, retryable and included in the atomic offline cache. Unknown values, Encounter isolation, manual generation/copy and source-edit invalidation remain intact. Pending evidence copies invalidate on filtering, navigation and disclosure collapse. Repeated quick links reopen and focus their target. Topic deep links synchronously commit filter resets before scheduling focus; a slower-CI rendering race was corrected and regression-tested.
- Bounded independent content review corrected PRESTIGE-AF's association to ICH and stated the ENRICH utility-weighted mRS direction. Primary/official sources were accessed on2026-10-01; access ranges from official summaries/abstracts to selected full sections. PRESTIGE-AF/SWITCH correction bodies remained inaccessible and the cards say so. No blanket clinical certification or protected-protocol recertification is claimed.
- Removed unused icon vectors, supplied three previously missing protocol glyphs, deferred install-dialog code, omitted an unused calculator-source projection from the browser, and shared React's standard JSX element factory. Clinical content was not removed to satisfy budgets. No runtime dependency or size ceiling changed.

Final local candidate checks: production build; **1,285 unit cases** plus **8 controller cases** (three repository-state cases reserved for main CI); full `npm test` with **28 rendered workflows**; **6 archived-baseline upgrade/failure/recovery scenarios**; **53 MCP calls across eight tools**; ICH **524** / ischemic **754** protected snapshot lines; token lint and **72 contrast pairs**. Fifteen additional320/390/768/1440px light/dark reference layout checks had no horizontal overflow; screenshots were inspected. Browser checks cover keyboard focus, session preservation, TIA unknown/positive/cleared states, reference source copy, retry, offline17-topic/16-study access and protocol shortcuts.

| Artifact | 7.2.0 bytes | 7.3.0 bytes | Unchanged ceiling |
|---|---:|---:|---:|
| Initial JavaScript, raw | 303,272 | 300,666 | 307,200 |
| Initial JavaScript, gzip | 99,368 | 99,385 | 102,400 |
| All JavaScript, raw | 708,892 | 704,545 | 716,800 |
| All JavaScript, gzip | 197,941 | 200,567 | 200,704 |
| CSS | 83,129 | 84,912 | 92,160 |
| Complete cache | 1,560,834 /40responses | 1,625,791 /44responses | 2,097,152 |

The broad archived corpus, withdrawn prediction tools, old teaching files and simulations remain retired. Root guideline/reference aliases now open the curated Evidence view; legacy full-corpus JSON endpoints remain explicit null retirement envelopes. Protected clinical source/modal text, the map and existing calculation algorithms are unchanged. The TIA assessment helper is reused unchanged.

The private identifier denylist is unavailable locally; the public full-tree scan passes and the existing private CI gate must pass on this candidate before merge. No gate or hook was bypassed. Normal PR/main CI, private identifier gates, Pages publication, exact live-byte parity and production browser checks determine release completion and are recorded in the final release receipt. No physical iOS/Android testing, native release, accessibility certification or production rollback was performed. Rollback uses the baseline above in a forward release with a new app/cache identity; simply reusing an older worker version is insufficient.

## Release candidate — 7.2.0

Baseline: clean `b3656cb403f7fb9dfdc13b8e5fc8dfc8269233ce`, deployed application 7.1.0. The owner authorized restoring the remaining useful prior functionality. A bounded comparison of archived mounted UI with current source identified the additions below. Prior Trials actions are already represented; withdrawn calculators, unfinished score placeholders, duplicate summaries and the education portal remain retired.

- Reported NIHSS entry is separate from the itemized examination; the selected source supplies shared Encounter/protocol values. Source changes invalidate dependent reviews. Zero remains valid; missing/invalid reports never use hidden examination values.
- Discharge NIHSS and mRS are separately recorded without copying current or onset scores. Compact Team handoff uses the existing guarded generation/copy pipeline.
- Explicit current-time shortcuts cover LKW, discovery and documented events. Replacement requires confirmation; a timestamp never attests administration. Exact instants survive the repeated daylight-saving hour. Manual edits permanently clear shortcut provenance, including edit/revert.
- Calculator name/alias search preserves worksheet inputs and open state. Copying a complete, currently reviewed result includes its source and limits. Denied clipboard access offers selectable text; edits, routing and filtering invalidate stale asynchronous responses.

Final local candidate checks: production build; **1,178** unit cases and **8** controller cases; full `npm test` with **25** rendered workflows; **6** archived-baseline update/failure/recovery scenarios; **41** MCP calls across seven tools; ICH **524** / ischemic **754** protected snapshot lines; token lint, **72** contrast pairs and **21** touch viewport/route combinations. Fifteen additional 320/390/768/1440px light/dark layout checks have no overflow. Screenshots were inspected. Bounded independent review found a repeated-hour shortcut defect, which was fixed and regression-tested; scoped rereview found no remaining issue.

| Artifact | 7.1.0 bytes | 7.2.0 bytes | Existing ceiling |
|---|---:|---:|---:|
| Initial JavaScript, raw | 298,759 | 303,272 | 307,200 |
| Initial JavaScript, gzip | 97,993 | 99,368 | 102,400 |
| All JavaScript, raw | 699,868 | 708,892 | 716,800 |
| All JavaScript, gzip | 195,038 | 197,941 | 200,704 |
| CSS | 82,781 | 83,129 | 92,160 |
| Complete cache, 40 responses | 1,551,462 | 1,560,834 | 2,097,152 |

No asset ceiling or runtime dependency changed. Source/protocol content and clinical review dates are preserved; the 125 generated JSON exports change only application-version metadata. No new score algorithm or clinical validation is claimed. The official NLM NIHSS total definition was accessible; the original NINDS page/booklet blocked automated retrieval. Existing source-access limitations continue to apply. No physical iOS/Android test, native release build, accessibility certification or production rollback was performed.

This is the checked source candidate. Normal PR/main CI, private identifier gates, Pages publication, exact live-byte parity and actual-production browser checks determine release completion and are recorded in the release PR/final handoff. Immediate prior main is the baseline above. Archival rollback remains `archive/pre-encounter-first-20261001-4f8e99d`, restored through a forward release with a new coherent application/cache identity.

## Prior verified release — 7.1.0

The restored application is live at [GitHub Pages](https://rkalani1.github.io/stroke/). [PR #232](https://github.com/rkalani1/stroke/pull/232) merged on 2026-10-01 as application release commit `687e7a543914707789124837af064e66338d6d2a`. The sections below preserve the chronological implementation checkpoints; their pending statements describe those earlier stages, not the current release. Later owner-approved restorations supersede the initial retirement scope where explicitly described.

- [Main CI](https://github.com/rkalani1/stroke/actions/runs/36914988776) passed all four jobs, including the main-only repository-state assertions and all three private-denylist scans. Normal PR checks passed before merge; no release gate was bypassed.
- [Pages deployment](https://github.com/rkalani1/stroke/actions/runs/36914987784) completed successfully for the application release commit. All **143** declared live artifacts match the checked release bytes. Actual-live browser verification passed **25/25** workflows; all **50** retired direct URLs, including **24** teaching downloads, returned 404/410.
- Local verification passed **1,104** unit cases, **8** service-worker controller cases, **24** browser workflows, **6** archived-baseline upgrade/failure-recovery scenarios and **41** MCP calls across seven tools. Protected ICH **524** / ischemic **754** line snapshots are unchanged by 7.1.0. Expanded layouts, touch targets, contrast and asset budgets passed as detailed below.
- [Live Lighthouse](https://github.com/rkalani1/stroke/actions/runs/36914988827) reported performance **87** (advisory), accessibility **100**, best practices **100** and CLS **0**. These observations and browser simulations do not establish physical-device, native-build, accessibility or clinical certification.

No application release check remains pending. Primary-source access/review limitations remain explicit; physical iOS/Android tests, native release builds and a production rollback were not performed. The exact archival rollback ref and forward-release procedure are recorded below. Documentation-only follow-ups do not change this application release commit or its verified public bytes.

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

Combined candidate verification: 968 Vitest cases and 8 controller tests pass (three repository-state cases are intentionally main-only). npm test passes all validators and 20 browser cases. Upgrade/failure recovery 6/6, MCP 41 calls over seven maintained tools, protected ICH 524 / ischemic 754 text locks, generated metadata, tokens/contrast and 21 touch-target viewport/route combinations pass. Rendered desktop/mobile Trials reviewed. No protected corpus or snapshot changes in this follow-up. Trial profile schema/currency validation retains original dated checks and the two unverified withheld profiles.

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

Final local verification: production build; 968 Vitest tests and 8 controller tests; full npm test with 20/20 rendered workflows; ICH 524 / ischemic 754 locks; 72 contrast pairs; 21 touch viewport/route combinations; 320/390/768px menu bounds; generated-asset checks all pass. All 125 changed data exports were compared structurally and differ only in appVersion. No clinical-source record or protocol baseline changed. The decorative SVG is hidden/nonfocusable; cache tests retain exact identity assertions for the new coherent 7.0.2 cache name.

## Workflow restoration follow-up — 7.1.0

Baseline: clean origin/main `688f48edf9ef105831ac4bfb80f2c1c01cc31719` (7.0.2). The owner authorized appropriate restorations after reviewing the original design. Preserve the existing pearl/mineral tokens and four retained destinations. Restore visible Encounter navigation and New encounter, native Telephone/Video radio segments, four section shortcuts, a compact canonical-state readout and advisory missing-entry navigation. Restore CT date/perfusion narrative and optional editable discussion/monitoring/handoff prompts. Keep explicit note generation, draft invalidation, event distinctions and reset confirmation; no clinical-rule expansion or duplicated generator.

Completed scope: shell/readout and documentation helpers; unit/browser/accessibility/protocol/offline checks; bounded independent review; normal PR checks, merge and live deployment verification. No new dependencies or telemetry.

### Expanded owner scope

The owner subsequently requested all useful prior Encounter and Trials functionality and other useful calculators. This supersedes the earlier narrow restoration: optional structured consultation/phenotype, diagnosis-specific review, etiology, prevention, supportive care, special contexts, follow-up/rehabilitation, transfer, post-reperfusion and discharge groups now share canonical state. Consultation/event timing uses explicit full timestamps; optional progress/follow-up/discharge/transfer/procedure output formats reuse the single generation/copy pipeline. The prior Trials desktop layout, visible future-study groups, briefing preview and responsive eligibility tables are restored. Supported calculator worksheets are restored with strict completeness, canonical inputs and primary-source records. Withdrawn prediction/simulator/drug outputs remain unavailable. Interim review found and corrected Examination target naming, nonacute CTP narrative omission, future/reversed actual dates and repeated-hour timer arithmetic. Final expanded verification and release are complete as recorded above.

Integration complete: 13 source-linked tools, shared scalar provenance reconciliation, PHQ-2/STOP-BANG note projection, coherent 7.1.0 app/cache identities and generated source contracts. A bounded independent final review found no remaining concrete defects. Source acknowledgments clear synchronously after edits; PASCAL depends on the current reviewed RoPE worksheet. Comprehensive local and release checks passed.

Final local candidate verification: 1,104 Vitest cases and 8 service-worker controller cases pass; three deployment-repository checks remain main-only. Full `npm test` passes including 24 rendered browser workflows. Protected snapshots remain ICH 524 / ischemic 754; 72 token contrast pairs, token lint, 21 touch viewport/route combinations and nine expanded 320/390/1440px form/table layout checks pass. Six baseline upgrade/failure-recovery scenarios and MCP41 calls/seven tools pass. Supplementary registry now contains13 new tools (23 total), with current source/limits metadata and unchanged source-access qualifications. No protected protocol or trial criteria/status record changed.

Final payload: initial JS298,759 raw/97,993 gzip; all offline JS699,868/195,038; CSS82,781; complete precache1,551,462 bytes/40 entries. Source/form metadata loads with Calculators & Links; core scoring/dependency reconciliation stays synchronous. Original initial300KiB/100KiB, CSS90KiB and cache2MiB ceilings remain. The owner-authorized feature restoration raises only full-JS ceilings to700KiB raw/196KiB gzip. No new runtime dependency or encoding layer was added.

Browser verification also repaired explicit accessible names on optional controls, 44px calculator/worksheet links and pounds-to-kilograms floating-point tails that could trigger the identifier scan. Conversion precision is one milligram. Review acknowledgments cannot revive after a source edit/revert; applied values clear on changed sources, while a separately reviewed manual value retains its own provenance. Normal PR checks, merge, Pages build and exact live-byte/browser verification are complete; the current-release receipt above records the authoritative results.


## Comprehensive Evidence and calculator access — 7.4.0 (in progress)

Baseline: clean 794f9ef2bdb10e768ff2f08ad9e0a825aba17e6c (7.3.0), branch feat/comprehensive-evidence. Rollback: archive/pre-comprehensive-evidence-20261001-794f9ef. The owner's latest request explicitly expands the prior bounded Evidence scope: account for all archived topics and useful additional guideline/statement areas, restore worthwhile calculators, move external destinations to the top, rename Calculators, and release through normal checks.

Design: preserve the existing typography, sheet, cards and controls. Nine clinical sections, search and care-setting filters make the larger library navigable; details render on expansion. Header references wrap with 44px touch targets. The same canonical Encounter measurements drive optional worksheets.

Implementation: archive source/topic crosswalk and primary-source identity review; source-bound clinical question cards with access limits; modified Fisher, mTICI and NASCET plus context-aware Encounter links and shared GCS. Presentation data moves from bundled JavaScript into the already versioned, offline clinical-reference resource, shared by Evidence and Calculators. This removes duplicate executable data and retains existing payload ceilings. No protocol literal or map-lock change is planned.

Outstanding: finish source/data authoring; validate source crosswalk and calculator boundaries; focused and full tests, offline/version recovery and phone/tablet/desktop browser review; independent combined review; normal PR/private CI checks, merge and verify exact production deployment.


### 7.4.0 integrated verification

Final scope: 80 topic cards in nine clinical sections; all 110 archived guideline/statement documents, 70 prior Atlas areas and 28 reference records have a topic crosswalk. Bibliographic PMID/DOI identity is verified separately from source-specific abstract/summary/full-text limits. Independent review corrected endpoint/population wording for OCEANIC evidence and seven publication-type labels. The historic bulk recommendation extraction remains retired; primary-source links are restored in the appropriate cards.

Calculator scope: 26 registry contracts, 16 supplementary worksheets/descriptors. GCS is accessible across contexts; modified Fisher, mTICI and NASCET have focused primary-source scope and unknown/invalidation tests. Clinical definitions prevented an unsafe shortcut from the original CHA2DS2-VASc fields to newer CHA2DS2-VA. The protected protocol/map corpus was not edited.

The UI and service worker now share generated structural validation of the versioned reference/calculator resource. Independent engineering review found and repaired empty-study-association disagreement and malformed numeric-option acceptance. Failed downloads can retry; malformed resources cannot replace the working installed version. No Encounter data enters this static resource.

Checks: production build; 1370 unit cases plus 8 service-worker controller tests pass (3 repository-state cases remain main-only); npm test passes all guards/validators and 30 browser workflows; MCP55calls/8tools; unchanged ICH 524 / ischemic 754 protocol locks;72contrastpairs/tokenlint;144responsive checks at320/390/720/768/1024/1440light/dark, including44pxprimarycontrols, focus, filters, state and new worksheets. Both original6.30.7 and immediate7.3.0 baseline upgrade/failure/recovery suites pass6/6. Device/reflow/offline checks are Chromium simulations, not physical-device or accessibility certification. A transient font error during simultaneous local re-staging was traced to that test overlap; the final stable responsive run is clean.

Payload vs7.3.0: initialJS300666→304197raw /99385→100540gzip; allJS704545→700773raw /200567→199116gzip; CSS84912→85416; completeofflinecache1625791→1752353bytes (44→45entries). All pre-existing ceilings remain unchanged. Calculator metadata extraction removes duplicated executable data; expanded reference coverage increases the installed data footprint. No speedup is claimed.

Local public identifier checks pass. The private denylist is CI-owned and unavailable locally; normal private CI must pass the exact candidate before merge. Prior missing clinical review dates, AIS partial-correction scope, two withheld trial profiles and the named inaccessible correction bodies remain explicit. Source identity checks do not certify every recommendation.

Next: publish branch/tag, pass normal PR checks, merge exact reviewed head, then verify main CI, Pages deployment, live asset parity, actual-live workflows and retired URL availability. Rollback ref remains archive/pre-comprehensive-evidence-20261001-794f9ef.


## Clinical utility and precision review — 7.5.0

Baseline: deployed 7.4.0 at `94d4ea3de24034e879f2ef2ab8ef20b58f24d05d`; branch `feat/final-clinical-utility-review`; rollback `archive/pre-final-utility-review-20261001-94d4ea3`. Owner authorized implementation, normal merge and production deployment. The header Quick protocols row is removed; content and retained deep links remain.

Review scope: all prior archived topic mappings and useful restoration candidates, 80 current topic cards, 29 completed studies (13 added), source-specific calculators and live identified registry records. Concrete fixes cover first-TIA BP provenance, descriptive/component GCS documentation and strict helper input, HAS-BLED criteria, unweighted ABC/2 labeling, pre-rounding renal arithmetic, and registry-specific exclusions. The prior unreviewed prognosis/RCVS tools, simulations and bulk extracted recommendations remain retired. Clinical-source access limits remain explicit. No blanket accuracy or clinical certification is claimed.

Integrated candidate verification: production build; 1,429 unit cases and eight service-worker controller cases pass (three repository-state cases run separately on main); npm test passes all guards and 30 rendered workflows; MCP55calls/8tools; unchanged ICH 524 / ischemic 754 protocol locks;72contrastpairs; token lint;21touch-target route/viewport combinations;312responsive checks at320/390/720/768/1024/1440 in light/dark. Nine screenshots were captured and six representative phone/tablet/desktop images inspected. Both original6.30.7 and immediate7.4.0 upgrade/failure/recovery suites pass6/6. Browser, reflow and failure-injection checks are Chromium simulations, not physical-device, Safari or clinical certification.

Payload vs7.4.0: initialJS304197→306301raw /100540→101371gzip; allJS700773→705859raw /199116→200581gzip; CSS85416→85190; completeofflinecache1752353→1778756bytes,45entries. All pre-existing ceilings remain unchanged. Fourteen unused trial-state fields were removed. The locked legacy renal implementation is unchanged; pre-rounding adjusted-weight arithmetic is exposed by its reviewed wrapper. Five interleaved local runs showed median Encounter89→87ms, interaction12→11ms, Evidence84→82ms; these small observations do not establish a speedup.

Local public identifier scanning passes. The CI-owned private scan, exact-head PR checks, main checks and actual publication remain release gates. The final external release receipt records their authoritative completion; no local result substitutes for deployment. Existing inaccessible corrections and source-review limitations remain explicit. Rollback uses the baseline tag through a forward release with a new coherent app/cache identity.


### Post-publication QA synchronization

PR237 published 7.5.0 at `21a88e3d2a65021dfb5efc043842720c15f812af`; all 148 live artifacts matched and 31 actual-origin workflows passed. Main CI then caught one test-induced `ERR_ABORTED` for the lazy Install button module: the viewport/theme test opened Utilities and reloaded before its download finished. A deterministic 600 ms module delay reproduced that cancellation; waiting for the visible Install App control eliminated it. The test now waits for that semantic state before its intentional reload. Error/resource assertions, application assets and release identity are unchanged. The follow-up PR and normal main checks verify the repair; the final release receipt records completion.


## Historical evidence and Encounter precision — 7.6.0

Baseline: deployed 7.5.0 at `8bd6bea9c497ce2477c160e05b3adf540ef4cd65`; branch `fix/comprehensive-utility-cycle2`; rollback `archive/pre-cycle2-review-20261001-8bd6bea`. This second review follows the owner's authorization to implement useful restorations, preserve simplicity, and merge/deploy through normal gates. The header Quick protocols row remains removed.

Historical inventory corrects the earlier 237-study count: the original collection contains **264 study records** and **273 distinct PMID source citations**, including nine follow-up/protocol reports. All 273 identities and indexed notice relations were checked against NLM metadata and restored to searchable Evidence topics. This recovers source navigation, not every archived outcome narrative: 212 original reports currently have citations/topic context rather than individual outcome cards. The completed-study view expands from 29 to **58 reviewed summaries**, with 29 primary abstracts independently checked for population, comparator, endpoint, safety and applicability. Eighty topics in nine sections, the 110-document guideline/statement crosswalk, Trials and the restored calculator/Encounter workflows remain. Four historical interpretation holds remain explicit; inaccessible correction bodies and partial/full-text access limits are not silently cleared.

Confirmed Encounter repairs: explicit age and reconciled anticoagulation premises for DAPT; trial-specific age/time boundaries with neutral individualized review outside the modeled population; invalidation on medication/exposure/indication/checklist edits; no automatic fallback antiplatelet prescription for unmatched inputs. Shared anticoagulant exposure and last-dose documentation now survive nonischemic/follow-up contexts without exporting an IVT conclusion. Explicitly absent vessel targets no longer display distal-vessel advice. Compact handoffs retain entered perfusion and applicable post-reperfusion facts. An independent adversarial recheck found no outstanding concrete defect after the trial-age and contradictory-exposure findings were fixed.

Simplification preserves exact behavior: shared field visibility predicates, repeated form rendering and strict numeric parsing replace duplicates. Browser-only evidence projections omit fields the interface never reads while retaining every displayed claim, dose, population, limitation, review scope, citation, caveat and conflict. Complete canonical data and public API exports remain intact; the clinical gate runs before bundling. Projection contracts and public API parity have focused tests. Two isolated timing experiments failed the predefined improvement threshold and were rejected.

Integrated local verification: **1,514 unit cases**, eight service-worker controller cases, MCP55calls/8tools, unchanged ICH 524 / ischemic 754 locks, 72 contrast pairs, token lint and all source/content/public identifier/asset guards pass. Three repository-state checks remain main-only. The final local browser run passes **32/32** workflows; it supersedes an initial 31/32 run that asserted content before a native disclosure's lazy body mounted. The repaired test waits for semantic content; application behavior and assertions are unchanged. Responsive checks pass **312** cases at320/390/720/768/1024/1440 in both themes; 21 additional touch route/viewport combinations pass. Both original6.30.7 and immediate7.5.0 upgrade/failure/recovery suites pass6/6. A14,400-row DAPT sweep and focused source-rule regressions pass. Six additional DAPT browser scenarios at320/768/1440 in both themes verify age/exposure conflicts, reconciliation and invalidation, with44pxcontrols and no overflow/page errors. The first scratch scenario omitted required CT/exposure inputs; the complete fixture correctly reaches the positive source screen before testing its guards. Browser/device checks are Chromium simulations, not physical-device, Safari or clinical certification.

Payload vs7.5.0: initialJS306301→306888raw /101371→101947gzip; allJS705859→687173raw /200581→196635gzip; CSS85190 unchanged; completeofflinecache1778756→1942800bytes,45entries. Every existing ceiling remains unchanged. Five interleaved same-host runs show median usable Encounter90→87ms, interaction11→11ms, Evidence79→76ms; these small differences do not establish a speedup. The larger source bibliography increases installed data while the browser projections reduce executable bytes.

Local results do not substitute for publication. Normal exact-head PR checks, CI-owned private identifier scans, main checks, Pages receipt, live byte parity, actual-origin workflows and retired-URL checks remain release gates. Their authoritative results and the exact merge commit will be recorded in the external release receipt. The baseline tag is the rollback source for a forward release with a new coherent app/cache identity. No production rollback has been executed and no blanket clinical-accuracy certification is claimed.


## Consolidated Evidence — 7.6.1

The owner requested removing the incomplete Completed evidence subsection from Trials if its useful content belongs in Evidence. Trials now retains only Screener, Tables and Database. All 58 existing study summaries are preserved inside their 30 related clinical topics within the 80-topic Evidence library. Topic search includes study names, populations and outcomes. Expanded summaries retain all sources, correction notes, review scope, applicability and guarded copy behavior. Nested disclosures mount content on demand; old completed-topic/study links open the corresponding Evidence card and focus its summary. Canonical data/API/MCP study records remain unchanged; five authored related links now use Evidence routes and the old destination is no longer advertised.

Baseline: `90d971656abe506b225b7addcbfb800abb48ab29` (7.6.0). Rollback source: `archive/pre-evidence-consolidation-20261001-90d9716`, through a forward release with a new app/cache identity. No clinical-source or protocol text was changed. Structural comparison confirms all study and calculator records unchanged and all topic text/source records unchanged except the five internal route replacements. Browser validation now rejects collisions between topic/study IDs, matching the canonical validator.

Local verification: 1,520 unit tests plus eight service-worker controller tests; 32 browser workflows including offline nested summaries; MCP55 calls/eight tools; ICH 524 / ischemic 754 locks; token lint and72 contrast pairs pass. Eight responsive viewport/theme combinations (320/390/768/1440, light/dark) verify three44px Trials tabs, nested study/legacy focus, search, geometry and retained Encounter inputs. Mobile Trials and a long nested study were visually inspected. Independent source review found no concrete blocker. Three deployment-repository tests and private identifier scans remain normal CI gates. Chromium simulations do not certify physical devices or every browser.

Final payload: initial JS306932raw/101989gzip; all JS686165raw/196317gzip; CSS85233; complete offline cache1941795bytes/45entries. All existing limits remain unchanged. Source content is preserved; a standalone comprehensive historical outcomes catalog is not claimed. The release receipt records baseline-upgrade verification, exact PR/main/Pages checks, live asset parity and actual-origin workflows after deployment.

Upgrade verification: all six7.6.0→7.6.1 defer/accept/interruption/failed-asset/multi-tab/recovery cases pass. The initial multi-tab retry read the old version because the helper awaited an already-visible Encounter heading before asynchronous activation/reload completed. The helper now waits up to30seconds for the exact new app version, then retains the heading/version assertion. Independent review confirmed that it neither triggers extra reloads nor relaxes activation/cache/session checks. No production service-worker behavior changed.
