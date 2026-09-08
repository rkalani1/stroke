# Non-Protocol evidence and usability review — September 6, 2026

## Scope and starting point (S1–S2)

Requested scope: Encounter, Trials, Guidelines & References, calculators, education, reference downloads, and mobile/on-call usability. The Protocols tab was excluded.

Reviewed upstream main at commit `636d1d2fe1fb69ba197ebf63c6ad3cb173123e44` (v6.24.0), rather than the older local checkout. Work is isolated on `codex/non-protocol-review-20260906`. The user's original checkout was not modified. Release version: 6.25.0.

Canonical content lives in `src/app.jsx`, `src/education.jsx`, `src/calculators-extended.js`, `src/simulators/`, `src/guidelines/` and `src/evidence/`. The `content/` and `data/` trees, application bundle and CSS are regenerated projections. The former PDF generator duplicated clinical HTML; it now renders the actual Education components.

Before each clinical correction, the assigned review checked the relevant primary publication, registry or official guidance. Stop conditions were unavailable full text, uncertain enrollment, conflicting evidence, or insufficient inputs. Those conditions produce an explicit limitation or incomplete state; they do not justify invented eligibility, recommendation classes, or blanket review dates.

## Evidence work and source trace (S3–S4)

| Area | Completed work | Detailed trace |
| --- | --- | --- |
| Guidelines | 109 documents; 3,550 indexed rows, of which 3,547 are extracted entries and 3 are source-only placeholders. Checked PubMed/DOI identity and publication-update relationships. Reconciled all 34 items in the AIS 2026 erratum and corrected five extracted recommendations. Added four explicitly partial 2026 dyslipidemia summaries. | [Guideline review](2026-09-06-guideline-review.md) |
| Publication corrections | Recorded 28 notices across 21 documents. Twenty-two were evaluated against the extracted content; six remain unresolved because the correction text could not be fully retrieved. Scope notes, unresolved warnings, reviewed correction links and source supplements are visible in the library. | [Guideline review](2026-09-06-guideline-review.md) |
| Trials and evidence | Reviewed all 14 native screener profiles, 13 duplicate inline profiles and 22 distinct registry IDs across surfaces. Checked all 321 populated baseline Atlas PMIDs and DOI pairs. Corrected recruitment, criteria, and several numerical/interpretive claims; added five study summaries, bringing completed studies to 242. Added 52 PubMed-verified Education bibliographic records, resolving 55 registry-reference warnings; the central registry now contains 378 citations. Bibliographic identity checks are distinct from full-paper clinical review. | [Evidence review](2026-09-06-trials-evidence-review.md) |
| Education and calculators | Corrected identified high-risk advice and input-boundary errors across CRAO thrombolysis, AF detection, BP/lipid prevention, DAPT, late-window/large-core EVT, ICH selection, prognosis, HINTS and pupillometry. Updated targeted brain-death, anticoagulant dosing/reversal, DAPT and prognosis teaching content. | [Education/calculator review](2026-09-06-education-calculator-review.md) |
| Encounter documentation | Distinguishes undecided, explicitly not recommended, recommended, and timestamp-recorded treatment. Preserves explicit NIHSS zero while leaving an unexamined default unknown. Corrected copied outputs, invalidated-state resets, candidate-screening wording and an existing discharge-template scope error. | [Encounter review](2026-09-06-encounter-documentation-review.md) |

Key primary sources include the [FDA Andexxa safety communication](https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/update-safety-andexxa), the [AIS 2026 erratum](https://www.ahajournals.org/doi/pdf/10.1161/STR.0000000000000530), [2025 hypertension guideline](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001356), [2026 dyslipidemia guideline](https://www.ahajournals.org/doi/10.1161/CIR.0000000000001423), [TenCRAOS](https://www.nejm.org/doi/full/10.1056/NEJMoa2508515), and [2023 brain-death consensus guidance](https://pmc.ncbi.nlm.nih.gov/articles/PMC10791061/). The linked reports give the other PMIDs, DOIs, registry records, source sections, access failures and decisions.

No generic evidence summary was promoted into the excluded Protocols tab. The long-term RECAP-ICH synthesis and secondary/subgroup analyses were triaged without inventing acute-treatment thresholds. Unverified ATTENTION-LATE efficacy numbers were removed; the available protocol is clearly distinguished from published results.

## Practical interface changes

- Global search requires meaningful term matches, normalizes score typography and hyphens, includes extracted guideline entries and source-only documents, and uses consistent keyboard selection. Completed-study hits open the matching completed-evidence record instead of the active-trial screener.
- Mobile encounter controls occupy less space. Resource shortcuts scroll in one row, field-readiness detail is expandable, and document actions and decision controls have larger targets.
- The final caller audit corrected missing vessel input in the Encounter large-core panel, preserved unknown PASCAL morphology and trial-screen NIHSS, and propagated recorded-treatment semantics through copied action plans, nursing sheets, safety checks and contextual recommendation gates. Explicit NIHSS zero is preserved. Recommendation alone does not establish administration or completed EVT.
- Teaching cards have Fit and Reading views. Reading view enlarges text, reflows columns, permits table scrolling and avoids fixed-height clipping.
- Reference rows stack their actions on narrow screens. Nine teaching PDFs were regenerated from canonical React content and visually checked. Eighteen older PDFs and one image remain available as teaching archives with currentness explicitly unverified.
- Removed ineffective inputs from the disabled andexanet calculator and linked the current US safety notice.
- Fixed Windows-sensitive generated-file checks and test-server path handling. Release, cache and shell asset versions are synchronized.

The design checks used the [WCAG reflow guidance](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) and [target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) as references; this is not a complete WCAG conformance audit.

## Validation (S5)

Final integrated results are recorded here after the last regeneration:

- Production build: passed (`npm run build:prod`). Asset budget remains within all four limits: application raw/gzip, CSS and service-worker precache.
- Full unit suite: 74 files passed; 1,956 tests passed and 7 existing gates skipped (1,963 total).
- Local full-chain smoke: 4 runs, 0 issues; citation, content, evidence, generated-asset and AutoMedBench gates passed (`npm test`).
- Nine routes × four widths (320, 390, 768, 1440) × two color modes: 72 combinations, no document-wide overflow or JavaScript errors.
- Expanded mobile checks at 320/390: 24 Reference Library and 23 Calculator disclosures, no overflow or unnamed visible controls. Targeted Education accessibility issues were corrected.
- Seven focused browser workflows passed: keyboard search/action consistency, normalized guideline search, source-only navigation, correction disclosures, completed-trial routing, closed recruitment filtering, and Reading/Fit controls.
- Fresh service-worker install, offline calculator reload and offline navigation to Trials: passed.
- Nine regenerated PDFs / 18 pages: parsed successfully, targeted corrected text checked, and rendered previews visually reviewed. Page breaks and the PH2 illustration were corrected during review.
- ICH and ischemic Protocols snapshots: unchanged (524 and 764 lines). The calculator snapshot changed only for the reviewed andexanet status card and explicit PASCAL anatomy input states (456 lines); its diff is isolated for review.
- Evidence refresh and ten-item P1 watchlist triage: complete. The watchlist's legacy markdown citation set is narrower than the Atlas and can report already-included papers as uncited.
- Content validation: zero errors and zero warnings. The age-based currency report flags no overdue projected entries but reports missing document-level review dates for all 109 guideline datasets. No blanket clinical review dates were assigned. The evidence validator's orphan detector does not count Education references, so its informational orphan list includes the 52 newly reconciled records.
- Publication is verified after deployment; the pull request and dated cross-device handoff record the live release result. This report records the pre-publication source review and validation.

The initial checkout's unit run had ten failures, including line-ending checks, absent compressed artifacts and a missing bundled browser. Final runs use the installed Edge executable through the existing `STROKE_CHROMIUM_PATH` override. Chromium-based emulation covers layout widths; physical iOS/Android devices and Safari were not directly tested.

## Limits that remain visible

This is an extensive, targeted evidence and software review, not independent clinical certification of every pre-existing statement, score, threshold, or archived lecture page.

- Six correction notices require full-text verification; affectedness is not asserted.
- Three documents are source-only; several others contain selected extracts. Missing text does not mean guideline silence.
- Numeric and interpretive checks concentrated on high-impact clinical claims and identified contradictions. PubMed identity verification alone does not validate all numerical summaries.
- Trial screening models encode subsets of study criteria. Candidate suggestions require full protocol and current local-site confirmation. A global registry recruiting status is not proof of local activation.
- Historical teaching files retain their original content with archival labels. Current interactive sources and regenerated sheets are identified separately.
- Protocol-coupled routines excluded from this request remain unchanged. The public deployment's synthetic/demo and no-PHI boundaries remain in place.
- The assistant cannot verify whether a recorded treatment actually occurred; generated documentation reports the entered state.

No PHI, credentials, real encounter records or restricted institutional material was introduced.
