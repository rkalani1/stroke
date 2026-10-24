# 2026-10-21 review — baseline, inventory and process

This folder holds the 7.9.0 review. Each unit report (`ev-evt.md`, `ev-prevention.md`, `ev-recovery.md`, `ev-acute.md`, `trials.md`, `calculators.md`, `encounter.md`, `design.md`) lists what the unit verified, changed and could not resolve, with evidence-ledger rows. The fix units that acted on the independent verification rounds wrote `evidence-fixes.md` and `encounter-fixes.md` (rounds 1–2) and `r3-ev-evt.md`, `r3-ev-prevrec.md`, `r3-trials.md`, `r3-encounter.md` and `r3-shell-search.md` (round 3); each lists every finding with its decision, the source re-read and the test, and how its own independent verifier judged the fix. The consolidated ledger, with a summary of all verification rounds, is [../evidence-ledger-2026-10-21.md](../evidence-ledger-2026-10-21.md).

## Baseline (before any change)

| Item | Result |
|---|---|
| Starting commit | `af21b07` (7.8.0) on `main`, identical to this branch's base |
| Deployed site | Pages build for `af21b07` succeeded 2026-10-17. Scheduled Live Smoke Audit run 39469496745 (2026-10-20): "Live Pages app.js matches checked-out commit"; "Live Pages shell and public data artifacts match checked-out commit (159 files)"; live browser QA 36/36. No local/deployed difference exists, so the Protocols baseline is the same on both. |
| Unit tests | `npx vitest run`: 112 files, 1996 passed, 3 skipped, 0 failed |
| Protocols source lock | PASS |
| Protocols rendered lock | PASS, 46 fixture/sub-tab captures at 1440 px |
| Example Protocols snapshot | PASS (ich 533 lines, ischemic 775 lines) |
| Build reproducibility | `npm run build` leaves the committed bundle byte-identical |
| Asset budgets | all at 97%: initial JS 124/128 KB gzip, offline JS 249/256 KB gzip, tailwind.css 117/120 KB, SW precache 2.23/2.30 MB |

Environment limits for this review: the container's network policy blocks publisher sites, PMC web pages, DailyMed, FDA and github.io. Sources were read through the PubMed connector (abstracts and PMC full text), the ClinicalTrials.gov connector (full registry records) and web search (secondary summaries, never the sole basis for a change). The live site was verified through GitHub Actions, not by a direct fetch.

## Actual inventory (discovered, not assumed)

- **Routes:** `#/encounter` (plus `#/encounter/section/<group>` and `#/encounter/<tool>`), `#/protocols/ischemic`, `#/protocols/ich` (plus 23 section/quick-reference targets), `#/trials`, `#/trials/tables`, `#/trials/database`, `#/evidence`, `#/evidence/<topic-or-study>`, `#/tools`, `#/tools/<id>`; legacy aliases (`#/management/*`, `#/research/*`, `#/guidelines`, `#/references`, `#/calculators/*`) and an explicit retired-route page.
- **Encounter:** telephone/video modes; four steps (context/baseline/timing, examination/imaging, safety and decision review, documented actions/monitoring/handoff); 12 optional detail groups (context details, phenotype, diagnosis details, etiology, prevention, supportive care, special context, follow-up review, participation, transfer, post-reperfusion, discharge continuity); case bar; completion counter and next-missing navigation.
- **Generated documents:** 7 formats (consultation as Pulsara summary or Epic note, follow-up, progress, discharge, transfer handoff, team handoff, procedure record), plus the Trials screening summary and calculator copy text.
- **Protocols (frozen):** ischemic and ICH sub-tabs, bedside quick reference, IVT-held banner, drug modals/PocketCards, Telestroke Map link.
- **Trials:** 16 registry profiles (14 screened, 2 reference-only): STEP, SISTER, PICASSO, TESTED, MINUTE, FASTEST-2, CLARITY, INTERCEPT, ASPIRE, SATURN, CAPPRICORN-1, SCOUTS-3, VERIFY, MR-PICS, TELE-REHAB-2, CAPTIVA. Views: Screener, Tables, Database.
- **Evidence:** 92 topics in 9 sections (acute ischemic 19, hemorrhage/neurocritical 14, mechanisms/vascular 19, inpatient 7, prevention/antithrombotics 8, recovery/rehabilitation 8, specific populations 7, brain health 4, systems of care 6), 84 quoted guideline recommendations, 88 study summaries.
- **Calculators (26):** Encounter-embedded NIHSS, GCS, ICH score, ABC/2 volume, CrCl, alteplase and TNK dose arithmetic, DAWN and DEFUSE-3 historical screens, acute DAPT screen; worksheets ABCD², CHA₂DS₂-VASc, HAS-BLED, RoPE, PASCAL, PHASES, mRS descriptors, Hunt–Hess, WFNS, ASPECTS and pc-ASPECTS regional, PHQ-2, STOP-BANG, modified Fisher, mTICI, NASCET.
- **Other interfaces:** global search (Ctrl/⌘ K, "/"), theme (light/dark/system), PWA install/update/offline, MCP server (`mcp/`), agent data endpoints (`data/*.json`, `llms.txt`).

## Protocols protection added before any shared-code change

`scripts/protocols-tab-lock.mjs --viewport=phone` (CI: "Protocols tab rendered lock (phone width)") replays every fixture at 390×844 against the unchanged desktop baselines and also fails when protected text is clipped out of reach. Negative control: phone-only CSS clipping Protocols paragraphs failed the lock (138 ICH and 82 ischemic text nodes); the unmodified build passes.

## Process

Eight agents worked in parallel in separate git worktrees with disjoint file ownership: four clinical-evidence units (EVT/systems; prevention/mechanisms; recovery/inpatient/populations; IVT/hemorrhage second check and currency), trials, calculators, encounter workflow/notes, and design/accessibility/performance/PWA. The lead integrated their branches, applied cross-area patches, and commissioned independent reviewers who re-read the primary sources and the integrated code. Three verification rounds followed (the ledger's "Independent verification" section has the counts). Each round's findings went to fix units with the same ownership rules; every fix unit's work was reviewed by a separate verifier, blocking findings were repaired and the repairs reviewed again, and the lead re-checked the non-blocking suggestions against the sources before applying them.
