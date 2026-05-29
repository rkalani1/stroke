# Comprehensive QA Audit (Round 3) — Stroke CDS v5.34.0

**Auditor**: Claude (Opus 4.7)
**Date**: 2026-05-09
**Branch**: `claude/comprehensive-qa-testing-j8m9F`
**Scope**: Third-pass deep audit, expanding on rounds 1 (`docs/qa-comprehensive-2026-05-09.md`) and 2 (`docs/qa-comprehensive-2026-05-09-round2.md`). Focused on previously-uncovered surfaces: pocket-cards interactive workflow, ClinicWorkflow / WardsWorkflow / PHQ9Screen, DEID pattern completeness, calculator behavior under null / undefined / negative / NaN input, time-zone handling, sample guideline content for clinical accuracy.

---

## TL;DR

After v5.33.0, this round found **no patient-safety-critical defects** but uncovered **11 defensive-programming crashes**, **3 PHI-detection gaps**, and **2 UI-vs-logic mismatches** (one of which silently locked clinicians out of a Class-1 INSPIRES recommendation from the calculator UI). All shipped in v5.34.0.

**Tests: 507 → 511. Validators: 6/6 still pass.**

---

## Round-3 Findings & Fixes

### 🟠 R3-H1 — 11 calculators crashed on `null` / `undefined` input

Edge-case probe sweep (44 inputs, 7 crashes initially, expanded to find 11):

```
calculateNIHSS(null) → TypeError: Cannot convert null to object
calculateGCS(null) → TypeError: Cannot read 'eye' of null
calculateICHScore(null) → TypeError
calculateABCD2Score(null) → TypeError
calculateCHADS2VascScore(null) → TypeError
calculateROPEScore(null) → TypeError
calculateHASBLEDScore(null) → TypeError
calculateRCVS2Score(null) → TypeError
calculatePHASESScore(null) → TypeError
calculateICHVolume(null) → TypeError
calculatePCAspects(null) → TypeError
```

**Real-world impact**: any caller that passes a cleared form-state object (e.g., a React `useState({})` initialized empty, or a destructure that yields `undefined` if the parent state shape changed) would throw inside the calculator function — surfacing as a console error and potentially crashing a render. The risk is highest in the IndexedDB-backed multi-patient ward census, where a partially-migrated patient record could have missing fields.

**Fix**: added `if (!items || typeof items !== 'object') return defaultValue;` guard at the top of each function. `calculateICHVolume` and `calculatePCAspects` return `null`/`0` respectively (matching their existing semantic for invalid input). 12 regression probes added to `tests/qa-probes.test.js`.

### 🟡 R3-M1 — DEID_PATTERNS missed SSN, ISO dates, and ZIP+4

`src/app.jsx:703` had only 4 patterns: `mrn` (≥7 digits), `birth-date` (US format only — `MM/DD/YYYY` or `MM-DD-YYYY`), `phone`, `email`. Three meaningful gaps:

1. **No SSN detector**. The pattern `\d{3}-\d{2}-\d{4}` is high-specificity / low-false-positive — easy add.
2. **No ISO-date detector**. The birth-date regex required 1-2 digit fields first (`\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}`) so the ISO format `YYYY-MM-DD` (4-digit year first) was NOT caught. This is the format `Date.toISOString().split('T')[0]` produces — exactly what app code may serialize back into note text.
3. **No ZIP+4 detector**. ZIP+4 (`XXXXX-XXXX`) is HIPAA-Safe-Harbor-relevant.

**Fix**: 3 new regex entries in `DEID_PATTERNS`. ISO date regex anchored to `(19|20)\d{2}` to avoid false positives on years like `1888-01-02`.

### 🟡 R3-M2 — DOAC-IVT pathway: UI option `'telestroke'` had no function branch

`src/pocket-cards.jsx:160` rendered three options for site pattern: `hub`, `spoke`, `telestroke`. But `evaluateDOAC_IVT()` in `src/institutional-protocols.js:213` only handled `hub` and `spoke` — selecting "Telestroke spoke site" silently fell through to the catch-all `{eligible: null, reason: 'Select site pattern (hub vs spoke) to evaluate.'}`. A clinician using the telestroke option would see a "select your site" message after selecting their site.

**Fix**: treat `'telestroke'` as a synonym of `'spoke'` in `evaluateDOAC_IVT`. They share the same time-based DOAC-clearance pathway (no STAT anti-Xa); behavior is now coherent with the UI.

### 🟡 R3-M3 — DAPT calculator UI locked out INSPIRES (Class 1)

`src/components.jsx` `DAPTDurationCalculator` exposed: `strokeType`, `nihss`, `abcd2`, `atherosclerotic`, `cyp2c19LOF`, `ichRisk`. The underlying `recommendAcuteDAPT()` function ALSO accepts `timeFromOnsetH` (default 24) and `lvdSymptomatic`.

INSPIRES (Gao NEJM 2023) extends DAPT eligibility from the legacy 24h window out to 72h for NIHSS 4-5 (and is **Class 1** per AHA/ASA 2024 focused update). With the UI default of 24h, the INSPIRES branch was unreachable for late presenters from this calculator. A clinician with a 36h or 60h presentation would have to leave the UI and call the function directly.

**Fix**: added `Hours from onset` numeric input and `Symptomatic LVD ≥50% (INSPIRES)` checkbox to the calculator UI. INSPIRES branch now reachable.

---

## What Was Audited (round 3)

| Area | Method | Result |
|---|---|---|
| `src/pocket-cards.jsx` (interactive protocol cards) | Direct read of IVTEligibilityCard, DOACIVTCard | 1 UI/logic mismatch (M2) |
| `src/components.jsx` workflows (LateWindowEVTCalculator, DAPTDurationCalculator, ClinicWorkflow, WardsWorkflow, PHQ9Screen, PHIBanner, AutoSaveIndicator, etc.) | Direct read | 1 UI gap (M3) |
| Edge-case calculator behavior (null / undefined / negative / NaN / out-of-range) | 44-probe sweep | 11 defensive-programming crashes (H1) |
| `DEID_PATTERNS` PHI completeness | Manual review against HIPAA Safe Harbor categories | 3 new patterns added (M1) |
| Time-zone / locale / number-precision in date generators | Direct read | No findings — `parseDateTimeLocal` correctly uses local-time semantics; rounding patterns reasonable |
| Guideline content sampling (AHA/ASA AIS 2026 — 195 recs) | Per-section spot check (TNK, Class III recs) | Coherent with current evidence (RIGHT-2 / INTERACT-4 negative trial language present in Class III prefacility recs) |
| All 17 guidelines registered in GUIDELINE_LIBRARY | Cross-verified imports vs registry | All 17 imported and registered |

---

## What Was NOT Touched (intentional)

- The 35K-line `src/app.jsx` was sampled in deep but not exhaustively read. Areas not reviewed in this round: the encounter form's full field inventory; the references/teaching tab's 30K+ lines; the algorithm-builder workflow.
- M4-M7 from round 1 (CHA₂DS₂-VASc/VA UI labeling, ABCD² speech-vs-weakness UI affordance, CATALYST framing) — still deferred as low-impact.
- Bundle splitting; Lighthouse Performance — out of scope for clinical-accuracy audit.
- Names / addresses in DEID — high false-positive risk; defer to a content-aware approach (e.g., NER) rather than regex.

---

## Round-1 + Round-2 issues now fully closed

All R1 and R2 high/medium-severity findings shipped in v5.32.0 / v5.33.0:
- Citation duplication (TRACE-III, MOST, TESLA, ARCADIA)
- ELAN PMID reconciliation
- Broken claim chain on warfarin reversal
- PHASES per-score risk lookup
- RCVS² −2 to +10 range
- ABC/2 unit warning
- Large-core EVT >100 mL warning surfacing
- SISTER NIHSS 4-5 disabling
- Inline-PMID validator
- Topic-coherence check
- mRS-9Q boundary fix
- 5 atlas content drift fixes (TRACE-2, EXTEND, TIMELESS, TRACE-III, ENCHANTED2/MT)
- dmvoEVTAdvisory M2-distal synonym matching
- Note-generator date formatting
- Service-worker dead CDN precache
- index.html version-string drift

---

## Test Pass Summary (after this audit)

```
Test Files  8 passed (8)
Tests       511 passed (511)        ← was 507 in v5.33.0; +4 (12 new probes
                                       collapsed into 4 describe blocks)
Validators  6 passed (6)
Build       app.js 2.4 mb           ← unchanged
            tailwind.css 68 kb
```

---

## Next-iteration recommendations (deferred)

1. The 35K-line `app.jsx` would benefit from being split — the audit had to sample rather than exhaustively read it. A future architectural sprint should refactor by route.
2. Address-detection in DEID would close another HIPAA Safe Harbor category but needs a non-regex approach (NER) due to high false-positive risk.
3. Lighthouse Performance score (54-55) would benefit from lazy-route loading and bundle splitting — orthogonal to clinical accuracy.
4. The encounter form has many checkbox / number / select inputs; would benefit from a programmatic schema audit to ensure every state field has a corresponding form widget and vice versa.
