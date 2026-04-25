# Evidence verification worklist

Records currently flagged `unverified-source-limited` or `todo-verify`
in the Evidence Atlas. Each entry needs a brief manual verification
step (search PubMed, confirm PMID/DOI, transcribe primary endpoint
precision into the structured record).

## How to clear an entry

1. Find the trial on PubMed / ClinicalTrials.gov.
2. Open `src/evidence/{citations,completedTrials}.js`.
3. Update the missing fields:
   - `pmid` / `doi` (must match the structural patterns in `schema.js`)
   - For trials: `primaryEndpoint.{result, effectSize, confidenceInterval, pValue}`
4. Promote `verificationStatus` to `verified-pubmed` (or appropriate variant).
5. Clear `verificationNotes` (or replace with a one-line audit trail).
6. Run `npm run evidence:validate` — should remain clean.
7. Run `npm run test:unit` — snapshot suite should still pass (no behavior change expected).

## Open items (as of v5.21.0)

### `cit-theia-2023` — THEIA: Thrombolysis for Central Retinal Artery Occlusion

- **Status:** `unverified-source-limited`
- **Notes:** Identifier pattern valid; clinical content seeded from existing repo references; user manual verification recommended for primary endpoint precision
- **PubMed search:** https://pubmed.ncbi.nlm.nih.gov/?term=THEIA+thrombolysis+central+retinal+artery+occlusion
- **Suggested PMID:** 36780239 (already in record; confirm)
- **Fields to fill:** Confirm primary endpoint result phrasing, effect size, confidence interval, p-value precision

### `cit-tencraos-2025` — TenCRAOS: Tenecteplase for Central Retinal Artery Occlusion

- **Status:** `todo-verify`
- **Notes:** Trial referenced in repo content but PMID/DOI not yet captured locally; defer to manual verification step
- **ClinicalTrials.gov search:** https://clinicaltrials.gov/search?cond=Central%20Retinal%20Artery%20Occlusion&term=tenecteplase
- **Fields to fill:** PMID or DOI; primary endpoint definition + result; population n; time window; verification status

### `completedTrials/theia` — THEIA trial record

- **Status:** `unverified-source-limited`
- **Notes:** Numeric primary-endpoint precision left qualitative pending manual verification.
- **Fields to fill:** `primaryEndpoint.{effectSize, confidenceInterval, pValue}` from the published primary report

## Stale-evidence watchlist

The validator emits a non-fatal warning when `lastReviewed` is >24 months old. As of v5.21.0, the seed batch shares `2026-04-25` so no stale-evidence warnings are emitted. After 2028-04-25 each record will need re-review or explicit confirmation that nothing has changed.
