# Bounded clinical statement trace

`src/clinical/claims.json` owns three existing shared statements: TNK stroke dosing, alteplase stroke dosing, and the prognosis safety paragraph. `src/clinical/claim-registry.js` supplies those records to callers. The provenance dates are the existing source-review dates; a refactor, build or PDF export is not a new clinical review. The historical ICH values and teaching qualifier retain their separate source in `src/clinical-prognosis-content.js`.

`docs/clinical-claim-occurrences.json` inventories four selected repeated rule groups on the named authoring surfaces. It includes dose/score statements still requiring manual verification and separately tracks DAPT regimen/population repetitions. DAPT trial regimens are deliberately not merged: trial populations, loading doses, durations and outcomes differ. A manual-verification disposition means the existing statement remains in place and must be reassessed if its related rule changes; it does not assert that it has been converted or newly clinically verified.

Each occurrence records its source location, excerpt, fingerprint, severity through its rule group, and one of three dispositions:

- `canonical`: reads the shared statement or a named shared qualifier.
- `excluded`: numerical calculation/authority data, non-rendered wiring or an intentionally separate historical artifact.
- `requires-manual-verification`: an existing population-specific or study-specific statement that has not been adopted.

The scope is finite. The Protocols tab and geographic map are excluded. Original guideline and study inventories retain their source wording. The named source files cover Encounter, calculator labels, teaching, and the evidence narratives used by search. Search projections and generated metadata retain their existing content-bundle checks; this trace does not pretend they were all converted to shared claims.

Run `node scripts/check-clinical-claims.mjs` (or add `--json` for a machine-readable report). The check fails on changed shared records, changed supporting source records, new/changed/removed in-scope occurrences, or stale/unreviewed maintained PDFs. A shared-record/source change reports every mapped occurrence for that group, including unconverted uses and PDF pages. The PDF inventory records extracted text blocks and cross-block page context where table columns separate a regimen from its duration. The seven maintained PDFs have exact component/style dependencies and output fingerprints. The seventeen historical PDFs remain labeled archives; their recorded bytes are also checked and they are not silently replaced by current summaries.

When a statement changes, first inspect the affected list and the original sources. Reconcile each mapped occurrence, its applicability and its source limits. Expand the explicit scope for a new consumer or rule group. Regenerate only affected maintained PDFs into a candidate directory with `node scripts/generate-pdfs.mjs --only ComponentName --output-dir /tmp/clinical-export-review`, then verify source/text/link parity and the rendered pages before replacing the maintained output. Update the reviewed fingerprints and dispositions only after those checks. Never replace a failed check by deleting an occurrence or rewriting all expected hashes without reviewing the reported differences.

Tests exercise a canonical change, an added occurrence, changed source input, changed PDF bytes, and a changed component amid unrelated lessons. Export dates remain export dates; source currentness and unresolved publication corrections remain separate.
