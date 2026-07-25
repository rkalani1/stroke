# Evidence Currency Audit — 2026-05-29

**Branch:** `feat/currency-ux-perf-2026` (off `origin/main` v6.0.0)
**Method:** Repo's own governance tooling — `npm run evidence:validate` + `evidence:export` (authoritative structured inventory) cross-referenced against the prose/teaching/protocol layers (`grep -r src`) and current best evidence.
**Constraint:** Institution-neutral, public, synthetic-only. No named-institution content. Extend/refactor, never rewrite. Every added trial carries a verified PMID/DOI and passes the schema validator + `test:unit`.

## Headline

The app's **prose/teaching layer is current.** The gap is **consistency**: the *structured* Evidence Atlas (`src/evidence/`) — which powers the Atlas tab and the "Why this recommendation?" drawer — is **reperfusion-weighted** and under-covers secondary prevention, ESUS, PFO, carotid, basilar EVT, and parts of ICH. Several of these trials already appear in prose but have not been **promoted** into the structured layer.

## Structured Atlas inventory (authoritative)

- 31 completed trials · 9 active · 42 citations · 12 claims · 9 recommendations · 7 guideline refs · 28 topics.
- Citations: **33 verified-pubmed**, 6 verified-guideline, 1 verified-doi, **2 flagged** (`theia` = unverified-source-limited; `tencraos` = todo-verify).
- Matcher engine: 46/46 criteria + 13/13 exclusions executable (100%).
- **Completed-trial set:** ACT, TRACE-2, NINDS(original), WAKE-UP, EXTEND, EPITHET, ECASS4-EXTEND, TIMELESS, TWIST, TRACE-III, SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT, TENSION, DAWN, DEFUSE-3, CHOICE, THEIA, INTERACT3, ANNEXA-I, ENRICH, CHANCE, POINT, THALES, INSPIRES, CHANCE-2, ELAN, TIMING, AVERROES, ARTESIA, ENCHANTED2-MT.

## Coverage gaps (in structured Atlas) — by topic

| Topic | In Atlas | Practice-relevant, NOT in Atlas | In prose layer? | Priority |
|---|---|---|---|---|
| Basilar EVT | — | **ATTENTION, BAOCHE** | yes | **P0** |
| Large-core EVT | SELECT2, ANGEL-ASPECT, TENSION, RESCUE-Japan LIMIT | **LASTE** | yes | P1 |
| AF anticoag timing | ELAN, TIMING | **OPTIMAS, CATALYST** | yes | **P0** |
| ESUS | — | **NAVIGATE-ESUS, RE-SPECT ESUS, ARCADIA** | partial | **P0** |
| PFO closure | — | **RESPECT, CLOSE, REDUCE** | yes | P1 |
| Carotid | — | CREST (CREST-2/ACST-2 = ongoing/announce-only) | yes | P1 |
| ICH | INTERACT3, ANNEXA-I, ENRICH | **INTERACT2, ATACH-2, MISTIE III** | yes | P1 |
| Antiplatelet/statin landmarks | CHANCE/POINT/THALES/INSPIRES/CHANCE-2 | SPARCL, CAPRIE, SPS3, COMPASS, MATCH | yes | P2 |

*(Trials already in prose → "promote into structured layer." Genuinely absent → "add.")*

## Governance gaps

1. **No machine-readable `lastReviewed` per guideline file.** The 17 `src/guidelines/*.json` carry topic + year in the filename but no `lastReviewed` / `sourceVersion` field, so freshness can't be queried or surfaced. The prose audit block in `institutional-protocols.js` is the only date stamp (2026-04-23). → add a small `meta` block per guideline JSON.
2. **Atlas vs guideline-set mismatch:** structured layer references 7 guidelines; the app ships 17 guideline JSONs. Reconcile which are authoritative for the Atlas/drawer.
3. **2 flagged citations** to resolve: `theia` (endpoint precision), `tencraos` (no PMID/DOI yet).

## Prioritized plan

**P0 (highest yield, clearly verifiable):**
- Promote **basilar EVT** (ATTENTION, BAOCHE) into the Atlas with verified PMIDs.
- Promote **AF-timing** (OPTIMAS, CATALYST) and **ESUS** (NAVIGATE-ESUS, RE-SPECT ESUS, ARCADIA) — high practice relevance, currently invisible in the Atlas/drawer.

**P1:**
- LASTE; PFO trio (RESPECT/CLOSE/REDUCE); ICH foundations (INTERACT2, ATACH-2, MISTIE III); CREST.
- Add `lastReviewed` meta to each guideline JSON.

**P2:**
- Older antiplatelet/statin landmarks (SPARCL, CAPRIE, SPS3, COMPASS, MATCH) for atlas completeness.
- Resolve the 2 flagged citations.

**Each change:** verified PMID/DOI → conform to `src/evidence/schema.js` → `npm run evidence:validate` clean → `npm run test:unit` green → small, reviewable commit per batch.

## Out of scope (per constraints)
No named-institution content. No rewrite. No new heavy deps. No live network calls in-app for verification (verification happens here, at authoring time, against PubMed/DOI).
