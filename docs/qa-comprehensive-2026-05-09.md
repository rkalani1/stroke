# Comprehensive QA Audit — Stroke Clinical Decision-Support v5.31.0

**Auditor**: Claude (Opus 4.7)
**Date**: 2026-05-09
**Branch**: `claude/comprehensive-qa-testing-j8m9F`
**Scope**: Full repository audit for accuracy, scientific rigor, and usability for **bedside use, study design, grant writing, and analysis**.

---

## TL;DR — Executive Summary

The site is, for a single-author client-side PWA, an unusually rigorous piece of clinical software. Architecture is clean, tests pass (now 485/485 with 55 new probes), and the layered evidence model (citations → claims → recommendations + active-trial matcher engine) is the right structural foundation for the use cases the user named.

**Overall grade: A− (clinical accuracy), A (engineering rigor), B+ (auditability of the citation chain), B (scholarly transparency).**

There are **no patient-safety-critical defects**. There are **citation-accuracy bugs, one broken evidence chain, and several places where the underlying evidence is approximated rather than reproduced exactly** that need correction before the site is suitable as a primary reference for grant applications or systematic-review work.

---

## What Was Tested

| Domain | Method | Result |
|---|---|---|
| Build & test infrastructure | `npm run test:unit`, all 5 validators | ✅ all pass (430 base + 55 new probes = 485/485) |
| Calculator code (`src/calculators.js`, `calculators-extended.js`) | Code review against published formulas + 55-test edge-case probe suite | 🟡 5 issues (1 confirmed clinical bug, 4 minor inaccuracies) |
| Evidence atlas (`src/evidence/`) | Schema validator + cross-ID audit + manual claim/citation walk | 🟠 4 issues (citation duplications, broken claim chain) |
| Clinical workflows (`src/app.jsx`, ~35 k LOC) | Targeted reads of critical path (BP targets, IVT/EVT eligibility, note generators) | ✅ structurally sound; reflects current literature |
| Institutional protocols (`src/institutional-protocols.js`) | Direct read | ✅ defensible; well-commented; properly disclaimed |
| Guideline JSON corpus (`src/guidelines/*.json`) | Structural audit | ✅ 17 guidelines, 781 recommendations indexed |
| PWA / offline / privacy | Manifest, service worker, IndexedDB store | ✅ clean separation; PHI never transmitted; 12 h TTL |

---

## Severity Key

- 🔴 **Critical** — patient-safety risk or substantive scientific error
- 🟠 **High** — scholarly/audit credibility issue; would be flagged in peer review
- 🟡 **Medium** — accuracy or UX issue that could mislead at the margin
- 🟢 **Low** — polish / consistency

---

## 🔴 Critical findings

**None.** No calculator returns a clinically wrong dose; no eligibility gate is inverted; no contraindication is missing in a way that would expose a user to harm.

---

## 🟠 High-severity findings

### H1. Duplicated PMIDs across two distinct trials each (citation accuracy)

`src/calculators-extended.js` reuses two PMIDs across mutually exclusive papers. The citation validator (`scripts/validate-citations.mjs`) only checks `docs/evidence-review-2021-2026.md`, so these inline duplicates are not caught.

| PMID | Used for trial A | Used for trial B | Lines |
|---|---|---|---|
| `38884324` | TRACE-III (Xiong NEJM 2024;391:203-12) | MOST (Lyden NEJM 2024;391:1257-68, marked "alt") | calculators-extended.js:608, 662, 776, 788 |
| `38319331` | TESLA (Yoo JAMA 2024;331:1709-19) | ARCADIA (Kamel JAMA 2024;331:573-81) | calculators-extended.js:516, 1156, 1183 |

These are different papers. Only one PMID per pair can be correct. The author already flagged ambiguity (`PMID 38884324 alt`). **Fix:** look up correct PMIDs on PubMed, replace, and extend the validator to scan source files for inline `PMID NNNNN` patterns.

### H2. Inconsistent ELAN PMID across the codebase

ELAN (Fischer NEJM 2023;388:2411-21) is cited with **two different PMIDs**:

- `src/calculators.js:6,16` → `PMID 37231621`
- `src/app.jsx:22991`, `src/teaching.js:446`, `docs/evidence-review-2021-2026.md:189`, `docs/iteration-log.md:1225` → `PMID 37222476`

The atlas's verified citation table (validator-protected) uses 37222476, which matches the published Fischer NEJM 2023 paper. The calculators-module value should be reconciled to 37222476.

### H3. Broken claim chain on a Class-I recommendation

`src/evidence/recommendations.js:47-62` — `rec-ich-anticoag-reversal-warfarin` (Class **I**) lists `supportingClaimIds: ['cl-ich-bp-bundle']`. The referenced claim `cl-ich-bp-bundle` is the INTERACT3 BP/glucose/temperature bundle claim, **not** a warfarin-reversal claim. The README advertises a "Why this recommendation?" drawer that walks guideline → claim → primary citation; for warfarin reversal, that walk currently lands on INTERACT3, which does not support the recommendation's content.

The schema's `validateRecommendation` only checks that referenced claim IDs **exist**, not that they are topically aligned. **Fix:** add a claim like `cl-ich-warfarin-reversal-pcc-vk` citing `cit-aha-ich-2022` and an FFP-vs-PCC primary trial (e.g., Steiner Lancet Neurol 2016, INCH; or Frontera 2016 Stroke), then point this recommendation at it. Add a topic-vs-claim consistency check to the validator.

### H4. SELECT-2 branch in `evaluateLargeCoreEVT` returns `eligible: true` for any core ≥ 50 mL with no upper bound

`src/calculators-extended.js:573-575`. SELECT-2 enrolled patients with median core ~80 mL but the trial did not specifically validate benefit at very large cores (>120-150 mL); a reasonable safety bound is missing. The function does push a warning into `reasons` when `coreGT100` is true, **but only the not-eligible branch surfaces `reasons` to the user** — the `rationale` string for an eligible SELECT-2 match never includes the >100 mL warning. Confirmed by my probe `tests/qa-probes.test.js`, "Core 110 mL: SELECT-2 ≥50 criterion fires…".

**Fix options:** (a) demote eligibility to `'consider'` with a "extrapolated beyond trial-supported range" note when core >100 mL or >120 mL; or (b) merge the existing `reasons` array into the eligible-branch rationale so the warning surfaces.

---

## 🟡 Medium-severity findings

### M1. PHASES 5-year rupture-risk lookup is bucketed, not per-score (Greving Lancet Neurol 2014)

`src/calculators.js:179-186`. The published per-score 5-year risks are 0.4, 0.7, 0.9, 1.3, 1.7, 2.4, 3.2, 4.3, 5.3, 7.2, 17.8 (scores 0-2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ≥12). The site collapses these into 6 buckets ("≤4 → 0.7%", "≤6 → 1.5%", etc.), so a score of 4 is reported as 0.7% rather than the published 0.9%, score 11 as 17.8% (matches ≥12 only). For grant-writing or registry analyses this is a noticeable abstraction. **Fix:** use a per-score lookup table; preserve the bucketed labels (`Very low`, `Low`, …) as a separate field.

### M2. RCVS² clamps negative scores to 0 (`Math.max(0, score)`)

`src/calculators.js:160`. Per Rocha 2019 (Stroke 2019;50:1233), RCVS² ranges −2 to +10. Clamping suppresses signal: a patient with carotid involvement (−2) and no other features clamps to 0, making them indistinguishable from a true 0. Diagnostic discrimination at the low end is lost. **Fix:** allow negative output; document the published range.

### M3. ABC/2 inputs are not range-validated

`src/calculators.js:188-195`. The function accepts any positive a, b, c. A common entry error (volume in **mm** instead of cm) silently produces a 1000× over-estimate. **Fix:** sanity-check inputs (e.g., warn if any dimension > 15 cm, or if computed volume > 500 mL).

### M4. CHA₂DS₂-VASc retains `female` term while the README and ESC 2024 guideline reference CHA₂DS₂-VA

`src/calculators.js:110-121` (`calculateCHADS2VascScore`) still adds 1 for female, alongside the new `calculateCHADS2VA` (calculators-extended.js:382-396). Both exist, which is fine — but the README line 10 says "CHA₂DS₂-VA" (the new one) yet the legacy function is what the calculators tab still wires up in some places. **Fix:** verify which the UI exposes and update the README list to match (or surface both with explicit labels).

### M5. ABCD² speech-vs-weakness mutual exclusion is correct but not documented to the user

`src/calculators.js:98-108`. The code correctly gives 2 points for unilateral weakness *or* 1 point for speech disturbance (not both), per Johnston 2007. Clinically this is correct, but a clinician entering both may wonder why the score didn't change when they checked speech. **Fix:** add a one-line explanation in the calculator UI (and consider exposing it in the calculator function output for transparency).

### M6. SISTER's NIHSS criterion mismatches its own inclusion text

`src/evidence/activeTrials.js:30,45`. Inclusion text reads `NIHSS ≥4 (4-5 must be disabling)`; the matcher criterion is `nihss ≥6` with the "or 4-5 disabling" carried only in the label. The matcher will mark NIHSS-4 disabling patients as not_met. **Fix:** add a `disabling-deficit` field to the encounter envelope and a derived field in `matcher-engine.js` (analogous to `domainMatch`) to honor the trial's actual inclusion logic.

### M7. CATALYST is described as both an "institutional shorthand" and a "Lancet meta-analysis"

`src/teaching.js:451` describes CATALYST as institutional shorthand. `src/calculators.js:7` describes it as a "CATALYST meta-analysis (Werring Lancet 2024)" with no PMID. `src/app.jsx:4839` and 12604 reference "CATALYST" as if it is a publication. There is a real Lancet 2024 IPD meta-analysis by Werring et al. (CATALYST, doi: 10.1016/S0140-6736(24)02197-5) — the site should pick one framing, attach a PMID/DOI, and use it consistently.

---

## 🟢 Low-severity findings

### L1. `capped` flag on alteplase uses strict `>` so 100 kg = 90 mg is reported `capped: false`

`src/calculators.js:378-385`. Trivial UX nuance only; the dose itself is correct (90 mg).

### L2. `calculateNIHSS` truncates total to 42 but does not warn the user that the input would have summed to >42

If someone fat-fingered "(7)" into a field that should be (4), the total caps silently. **Suggested fix:** expose `truncated: true` when the raw sum exceeds 42 to flag likely entry errors.

### L3. Citation validator only checks the markdown table, not source-file inline citations

`scripts/validate-citations.mjs` is excellent but operates only on `docs/evidence-review-2021-2026.md`. Inline `PMID NNNNN` references in `src/calculators-extended.js`, `src/app.jsx`, etc. are unchecked. This is the structural reason H1 and H2 escaped detection. **Fix:** extend the validator (or add a sibling) that scans all `src/**/*.js`, `src/**/*.jsx`, `docs/**/*.md` for `PMID\s*[:.]?\s*\d+` and flags duplicates / format errors. A 30-line script.

### L4. `tests/qa-probes.test.js` (added by this audit) covers 55 edge-case scenarios

Now passing. Suggested to keep in the repo as a permanent regression suite. They span:

- NIHSS truncation, GCS partial-input safety, ICH/HAS-BLED max scores
- ABCD² mutual exclusion of speech vs weakness
- CHA₂DS₂-VASc max 9 vs CHA₂DS₂-VA max 8
- Late-window EVT trial matrix (DAWN, DEFUSE-3, LASTE, SELECT-2, ANGEL-ASPECT)
- TRACE-III gating on EVT availability
- CHANCE/POINT/INSPIRES/THALES branching by NIHSS, time, atherosclerosis
- Post-EVT BP (ENCHANTED2/MT compliance)
- ENRICH lobar vs deep, SWITCH window, INTERACT3 bundle
- PASCAL category & NNT
- Boston 2.0 CAA criteria including non-hemorrhagic markers

### L5. `output/pico-table.csv` is a high-quality artifact for grant work — should be promoted in README

The export pipeline produces CSV, JSON, and Markdown (atlas summary, completed trials, active trials, claim-source map, PICO table). This is ideal for plugging into grant-writing software, systematic-review databases, and PRISMA flow inputs. The README mentions `evidence:export` but does not advertise the **PICO table** specifically — it deserves a sentence.

### L6. No machine-readable "what did the site recommend at this NIHSS / time / mRS / etc." trace for an analyst

For people doing retrospective audits or grant-application figures, an analyst-facing helper that takes a parameter sweep (e.g., NIHSS 6-22 × LKW 0-24 h × ASPECTS 0-10) and emits a CSV of which trial branches fire is achievable from the existing pure functions. Worth scoping for a future sprint; nothing in the current pipeline does this.

### L7. Topic taxonomy has 30 nodes but many are unreferenced

`src/evidence/topics.js`. Topics like `cadasil`, `cognitive-trajectories`, `tandem-lesions`, `ivt-on-doac` exist but have 0-1 atlas entries. Either populate them or trim to the topics actually used.

---

## Strengths Worth Preserving

1. **Pure-function calculators with structured returns** (severity tier, action text, source) — exactly the right shape for being reusable from notes, dashboards, and analysis pipelines.
2. **Layered evidence model** (citations → claims → recommendations → active-trial matcher) with formal schemas in `src/evidence/schema.js`. The `Class-I-without-supportingClaimIds` warning is the right governance posture.
3. **Matcher engine with 100 % coverage** (52 inclusion + 16 exclusion criteria executable from declarative form) and a frozen 211-test scenario-snapshot suite — that's grown-up software engineering.
4. **De-identification posture** — `DEID_PATTERNS` (MRN, birth-date, phone, email regex), `deidMode: true` default, IndexedDB-only storage, 12 h TTL, no transmission. Good fit for HIPAA-minimal use.
5. **Note generators** (`generateTelestrokeNote` etc.) include CrCl annotation, contrast-allergy flag, weight-estimation flag, time-window calculations — these match real telestroke-consult content.
6. **Institutional-protocol module** is **explicitly disclaimed** as illustrative and not endorsed by any institution, with a clear evidence audit comment block. The right tone.
7. **Evidence-export artifacts** (`evidence-atlas.md`, `pico-table.csv`, `claim-source-map.md`) are exactly the kind of derivative the site needs to be useful for grant work and systematic-review prep.
8. **17 guideline JSONs covering 781 recommendations** spanning AIS, ICH, SAH, CVT, secondary prevention, primary prevention, TIA, premorbid disability, peri-op stroke, post-stroke cognition, cancer, maternal, spasticity, and primary care — that breadth is grant-grade.

---

## Usability for the Stated Use Cases

### Bedside / Clinical Decision Support — **A**
- All major calculators present, source-cited, with edge-case handling.
- Note generators handle telestroke, transfer, signout, progress, discharge.
- Time windows (LKW countdown, post-tPA neurocheck schedule) are correct.
- Multi-patient ward census via IndexedDB.
- Concerns: H4 (eligible=true beyond trial-supported core), M3 (ABC/2 unit confusion), M6 (SISTER NIHSS gate).

### Study Design — **A−**
- Active-trial matcher engine + completed-trials atlas form a nice "what's been tried, what's enrolling" view.
- PICO export is a natural starting point for new-protocol design.
- Concerns: a study designer cross-referencing the in-app PMIDs against PubMed will spot H1, H2, M7 quickly. Citation accuracy is the **single biggest credibility risk** for this use case.

### Grant Application Writing — **B+**
- Strengths: claims with conflictNotes (e.g., "TIMELESS primary endpoint did not reach significance overall") and certainty grading are exactly the language a methods reviewer wants to see.
- The structural evidence chain (recommendation→claim→citation) lets a grant writer pull a defensible justification block without paraphrasing.
- Concerns: H1, H2, H3 directly affect the credibility of any grant text quoted from the site. The PHASES per-score risk imprecision (M1) would also be flagged in a peer review.

### Analysis (audits, registry comparisons, secondary research) — **B**
- The pure-function calculators are reusable.
- `evidence:export` artifacts are CSV/JSON-friendly.
- Gaps: there is no parameter-sweep harness or programmatic API surface for "given these encounter envelopes, what would the site have recommended?" — analysts who want to compare site recommendations against a real-world cohort have to reconstruct it. Worth adding (L6).

---

## Concrete Fix Recommendations (priority-ordered)

1. **(H1)** Resolve the four PMID duplications. Confirm correct PMIDs for TRACE-III, MOST, TESLA, ARCADIA against PubMed; replace inline strings.
2. **(H2)** Reconcile ELAN PMID to `37222476` repo-wide.
3. **(H3)** Add `cl-ich-warfarin-reversal-pcc-vk` claim and rewire `rec-ich-anticoag-reversal-warfarin`. Add a topic-coherence check (recommendation.topic ⊆ supportingClaim.topic union) to `validateRecommendation` in `schema.js`.
4. **(L3)** Extend `validate-citations.mjs` (or add a sibling `validate-inline-citations.mjs`) to scan source files for `PMID\s*[:.]?\s*(\d+)` patterns and detect duplicates / format errors. This single change would prevent regressions of H1/H2.
5. **(H4)** Add an upper-bound consider/eligible distinction to `evaluateLargeCoreEVT` for core >100 mL; merge `reasons` warnings into the eligible-branch rationale string.
6. **(M1)** Use a per-score PHASES lookup table.
7. **(M2)** Allow RCVS² to range from −2 to +10 (drop `Math.max(0, …)`).
8. **(M3)** Add ABC/2 sanity bounds.
9. **(M6)** Plumb a `disablingDeficit` field through to SISTER's matcher.
10. **(M7)** Pin a single CATALYST framing (citation + DOI) repo-wide.

---

## Test Suite After This Audit

- Pre-audit: **430 tests / 7 files** pass.
- New probe suite added (`tests/qa-probes.test.js`): 55 edge-case probes spanning calculators-base, calculators-extended, and trial matrices. Pass.
- Post-audit: **485 tests / 8 files** pass; all five validators pass; evidence export emits 7 artifacts cleanly.

---

## Disclaimers

- Live PMID lookups against PubMed/eutils were blocked by the sandboxed network (Host not in allowlist). Bug class H1 was caught by **structural** analysis (same PMID for two papers cannot both be correct). H2 was caught by **internal-consistency** analysis (the repo cites ELAN with two different PMIDs in different files). The user or repo owner should still run `npm run validate:citations:ids` from a network-enabled environment to verify identifier liveness.
- This audit was not exhaustive of the 35 k-line `src/app.jsx`. Sections sampled: management drawers, telestroke-note generator, BP/IVT/EVT decision branches, encounter form data plumbing, PHI / de-identification path. Sections not deeply audited: rehab/clinic workflows, post-stroke cognition tab, and the PWA service-worker update banner.
