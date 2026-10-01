# Stroke Encounter workspace

Stroke is a lean, deterministic browser workspace. Encounter opens immediately; the secondary tabs are **Protocols**, **Trials**, **Evidence** and **Calculators & Links**.

**The public build is a synthetic demo. Do not enter PHI, identifiers, real encounter details or confidential information. It is not an approved clinical tool, medical advice, or an institutional system.**

## What remains

- Four Encounter steps: context/baseline/timing, examination/imaging, safety and decision review, documented actions/monitoring/handoff. Relevant branches support video/telephone, ischemic/hemorrhagic and follow-up contexts without inventing unsupported pathways.
- NIHSS entry supports an itemized examination or a separately identified reported total. Embedded GCS, ICH severity/ABC2 volume, renal and lytic-dose calculations. Unknown and invalid inputs remain unresolved; arithmetic does not establish treatment eligibility. Historical DAWN/DEFUSE-3 and acute DAPT screens retain their population and source limitations.
- Protected ischemic and ICH example protocols, interactive drug modals/PocketCards, and the external Telestroke Map. Their clinical locks are preserved except for the two explicitly authorized ICH drug-removal corrections documented below. Interactive cards share Encounter measurements; edits invalidate dependent card reviews, while navigation and elapsed-time updates preserve them. Protocol NIHSS comes from the selected Encounter source, and elapsed hours derive from its recorded timing.
- Explicitly generated telephone Pulsara summaries and full video Epic note templates; any source change invalidates its copy control. Decisions, review, discussion/consent, administration and procedure timestamps remain separate.
- Trials combines the bedside screener, criteria tables and searchable registry database with a separate Completed evidence view. Sixteen pivotal studies include population, comparison, result and applicability limits. Registry summaries and dated review status do not establish enrollment or local activation.
- Evidence provides 17 searchable clinical topics filtered by on-call, hospital or clinic setting. Clinical summaries load from one version-matched JSON endpoint, are included in the offline installation, and link to source-access details and related tools/studies. Quick protocol links reveal the existing reversal, post-lytic hemorrhage and angioedema sections.
- TIA disposition review projects the existing explicit findings and workup/follow-up fields. Positive risks and missing information remain visible; the projection never clears a person for discharge.
- Session state survives navigation. New encounter requires deliberate confirmation and clears entries/drafts/timers. Reload clears clinical state; no encounter persistence, census, imports, patient-context URLs, AI submission, analytics or backend integration.
- Compact theme/install/update controls, local runtime dependencies, and atomic opt-in PWA updates. External references require internet and receive no encounter context.

Thirteen source-linked worksheets and descriptor aids are available in Calculators & Links: ABCD², CHA₂DS₂-VASc, HAS-BLED, RoPE, PASCAL, PHASES, mRS, Hunt–Hess, WFNS, regional ASPECTS/pc-ASPECTS, PHQ-2 and STOP-BANG. Shared measurements come from Encounter; reviewed applications and screening exports invalidate after source edits. Optional Encounter sections support follow-up, progress, discharge, transfer, compact team handoff and procedure documentation through one generation pipeline. Discharge NIHSS and mRS are separately recorded; explicit timestamp shortcuts preserve manual editing and never attest administration. Calculator search covers names and abbreviations; copying a complete reviewed worksheet result includes its source and limits.

The Education/general Guidelines/References portal, withdrawn prediction tools, teaching PDFs/graphics, simulators and broad content-generation machinery are retired. Legacy guideline/reference root routes now open the bounded Evidence view; other retired routes explain retirement. Supported calculator deep links reveal their embedded tool. No hidden archive library is shipped.

## Maintained evidence and interfaces

The curated clinical-reference dataset is maintained separately in `src/reference/acute-topics.json`, `clinic-topics.json` and `studies.json`. Source-check dates identify the actual access scope (official summaries, abstracts or selected full text); they are not a complete clinical certification or an update to protected protocols. PRESTIGE-AF and SWITCH correction bodies were inaccessible; those cards disclose that limit.

The active evidence closure has 10 recommendation records, 12 evidence claims and 43 citations, plus canonical shared clinical statements and the protected literal exceptions. Six selected source projections preserve original review/correction provenance. Missing review dates remain missing; builds and retirement dates are not clinical reviews.

`data/index.json`, `data/clinical-reference.json`, `data/trials.json`, `data/sources.json`, `data/calculators-index.json`, `llms.txt` and the bounded MCP tools describe the maintained scope. Former corpus endpoints return explicit schema-2 retirement envelopes with null data, replacement and archival pointers. This is an intentional compatibility change; consumers must inspect `_meta.status`. See [content maintenance](CONTRIBUTING-content.md), [clinical trace](docs/clinical-claim-maintenance.md), [MCP](mcp/README.md) and [source limitations](docs/source-limits.md).

**Scoped clinical correction:** the owner authorized correcting the two protected ICH factor-Xa drug-removal passages on 2026-10-01 using primary drug-label evidence. Only the affected four snapshot lines were updated. See [source limitations](docs/source-limits.md) for accepted wording and provenance; other protected content and review dates are preserved. This resolves the named release gate without claiming clinical certification.

## Development and verification

```sh
npm ci
npm run build:prod
npm run publish:stage
npm run test:unit
npm test
npm run test:mcp
npm run test:protocol-snapshot
node scripts/qa-upgrade.mjs
```

The production artifact is explicitly staged in `output/site`. Pages currently publishes the repository root via Jekyll; generated `_config.yml` exclusions limit that output to the same public roots. `check:retirement` prevents retired source/assets from returning to the module graph or public artifact. Private bundles require `STROKE_BUILD_TARGET=private` and `STROKE_BUILD_OUTFILE` outside the deployed tree; the build refuses to overwrite public artifacts. That flag does not supply clinical approval or enable persistence.

Required guards cover clinical-source tracing, bounded schemas/citations, leak prevention, public builds, retained protocols, module checksums, asset budgets, synthetic state/summary behavior, PWA updates and rendered browser workflows. Protected snapshots and the Telestroke link baseline are not blanket-regenerated. Only four ICH snapshot lines reflect the owner-authorized drug-removal correction. Retired test consumers have explicit inventories and replacement guards; see `tests/CALCULATOR-TEST-RETIREMENTS.json` and `docs/retired-maintenance.json`.

[IMPLEMENTATION.md](IMPLEMENTATION.md) records exact before/after measurements, validation checkpoints, release context and limitations. The release PR and its linked Actions runs establish the final deployment state. Browser viewport/offline checks simulate devices; they are not physical iPhone/Android validation or accessibility certification.

## Install and rollback

Open the site, then **More → Install App**, or use the browser's installation menu. Shortcuts open Encounter or Protocols. Offline core use requires a successful complete online cache installation; an uncached first visit requires network. Updates never automatically reload an active session. See [PWA behavior](docs/pwa-and-app.md). Existing optional Capacitor distributions remain in the repository; native builds were not changed or certified by this redesign.

The complete committed prior application is preserved at **`archive/pre-encounter-first-20261001-4f8e99d`**, commit `4f8e99de9f605327bb901d0585f279cc7ebcd12e` (6.30.7). Rollback requires a reviewed forward commit restoring that tree, then a *new* coherent app/cache version, production build and normal checks/release. Reusing an old worker version is insufficient for clients already running 7.x. This deployment rollback has not been executed; the baseline-to-new-version update/failure path is tested separately. An already-open old page or permanently offline device cannot be remotely guaranteed to update.
