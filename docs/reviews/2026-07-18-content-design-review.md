# Stroke CDS Educational Demo — Content, Design & Safety Review

- **Date:** 2026-07-18
- **Reviewer:** Senior clinical-product editor + frontend engineer (automated review pass)
- **App version reviewed:** 6.11.5 (`main` @ `1142d6d`)
- **Scope:** Public GitHub Pages educational demo — content accuracy/currency, structure, design/minimalism, public safety, machine-consumability.
- **Boundaries honored:** No new clinical recommendations invented; every clinical change is grounded in a primary source or marked OPEN. No PHI, institutional identifiers, or private operational content added. Existing guardrails (PUBLIC_DEMO_MODE, leak-guard, protocol snapshot lock, "verify against local protocol" framing) preserved.

> This review file is an internal working artifact. It is intentionally shipped to the repo tree (docs/) but is not part of the public app UI.

---

## 0. Preflight & baseline (what already passes)

The repo is mature and well-governed. As of this review, on a clean checkout with `npm install`:

| Gate | Result |
|---|---|
| `npm run content:validate` | ✅ 144 records (calculators=34, education=17, guidelines=11, references=18, trials=64) |
| `npm run evidence:validate` | ✅ 10 active, 64 completed, 76 citations, 11 recs, 12 claims, 7 guidelines, 30 topics; matcher coverage 50/50 criteria + 14/14 exclusions |
| `npm run validate:citations` | ✅ 24 rows, years 2021–2026; 74 PMIDs consistency-checked |
| `npm run validate:inline-citations` | ✅ 108 unique PMIDs across 225 inline references |
| `npm run content:currency` | ✅ nothing stale (12-month threshold) |
| `npm run content:bundle:check` | ✅ bundle up to date |
| `npm run validate:whats-new` | ✅ 50 items (21 verified + 29 unverified; no unverified item carries a PMID) |
| `npm run lint:contrast` | ✅ 21 pairs ≥ AA floor |
| `npm run check:leak-guard` | ✅ no institutional / PHI-adjacent content |
| `npm run test:unit` (vitest) | ✅ **850 tests pass** across 33 files |
| `npm run lint:tokens` | ❌ **FAILS** — raw Tailwind hues instead of v7 semantic tokens (see D-1) |
| `npm run lint:touch-targets` | ⚠️ Could not run in this environment (Playwright browser path). Not a repo defect. |

**Takeaway:** the project's own validators, currency checks, citation FK integrity, snapshot locks, and 850 unit tests are green. Findings below are therefore concentrated in (a) currency nuances the validators can't judge, (b) design-token consistency, and (c) docs/machine-readability drift the validators don't cover.

---

## 1. Inventory

### 1.1 Information architecture (hash routes — confirmed against `data/index.json` + `src/app.jsx` nav)

| Route | Purpose |
|---|---|
| `#/encounter` | Synthetic acute encounter workflow (IVT/EVT/imaging selection; public build disables persistence/census/exports) |
| `#/protocols`, `#/protocols/ischemic`, `#/protocols/ich`, `#/protocols/calculators` | Example (institution-neutral) protocol cards + calculators. Clinical wording is **snapshot-locked**. |
| `#/research` | Evidence atlas / guideline summaries |
| `#/trials` | Active-trial screener / matcher + completed-trial atlas |
| `#/education` | Education hub (17 markdown resources + simulators) |
| `#/settings` | App settings/theme |

### 1.2 Content domains
- **Guidelines:** `content/guidelines/*.json` (11 records) + `data/guidelines/*.json` (17 guideline bundles incl. 2026 AIS, 2022 ICH, 2021 secondary prevention, 2023 SAH, 2024 primary prevention, etc.).
- **Trials:** 64 completed/landmark (`data/atlas/completed-trials.json`), 10 active (`data/atlas/active-trials.json`), 24 `content/trials/*.json` teaching cards.
- **Calculators:** 34 in `content/calculators/registry.json` → `src/calculators.js` + `src/calculators-extended.js`.
- **Education:** 17 markdown resources + simulators (HINTS, pupillometry, EVD/ICP, neuro-exam).
- **Evidence engine:** `src/evidence/*` — citations registry (single source of truth), matcher-engine (declarative eligibility), recommendations, claims, topics.
- **What's new:** `whats-new.json` (50 items) generated from `docs/evidence-review-2021-2026.md`.

### 1.3 Design system
- `src/design/tokens.css` (v7): semantic hue families `crit` / `warn` / `ok` / `cobalt` / `accent`, with v6 aliases (`bg-card`, `border-line`, `text-ink`) preserved. Self-hosted fonts (Bricolage Grotesque display, Public Sans body, IBM Plex Mono). Tailwind reads tokens via `rgb(var(--token))`.
- Primitives in `src/design/primitives.jsx`, `src/primitives.jsx`, `src/components/`.
- Linters: `lint:tokens` (raw-hue → semantic), `lint:touch-targets` (44px), `lint:contrast` (AA).

---

## 2. Verified linchpin currency checks (done first — highest reputational risk)

Two items carried the highest "is this fabricated?" risk and were **independently web-verified** before any other work:

1. **AHA/ASA 2026 AIS Guideline — REAL & CURRENT.** DOI `10.1161/STR.0000000000000513` resolves to *"2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke"* (AHA/ASA), published in *Stroke*, **Jan 26, 2026**, replacing the 2018 guideline + 2019 update. Documented changes match the repo's usage: broadened EVT eligibility (basilar occlusion + large core), expanded tenecteplase ≤4.5 h, first pediatric AIS recommendations, mobile stroke units. → The repo's heavy citation of the 2026 AIS guideline is legitimate. **KEEP.**
2. **Lipfendra (enlicitide) FDA approval — REAL.** Merck's enlicitide, the first oral PCSK9 inhibitor, was FDA-approved **July 16, 2026** (brand *Lipfendra*, 20 mg once-daily) for LDL-C reduction in hypercholesterolemia/HeFH. The `docs/evidence-review-2021-2026.md` auto-update block is factually accurate. It correctly did **not** propagate into the public `whats-new.json` feed. → Factually **KEEP**, with a scope note (F-3 below).

---

## 3. Findings

Severity: **P0** = incorrect clinical claim / missing critical safety framing / PHI-leak · **P1** = stale high-impact evidence / major UX-blocking clarity · **P2** = design/minimalism/medium copy · **P3** = polish/docs drift.

### 3.A Design / minimalism / accessibility

**STROKE-D1 · P2 · design (token consistency) · `src/education.jsx`, `src/simulators/EvdIcpSimulator.jsx`**
- Evidence: `npm run lint:tokens` fails (exit 1). Raw Tailwind hues used instead of v7 semantic tokens, e.g. `src/education.jsx:3487` `text-red-700`/`text-red-400`, `:3498` `bg-red-700`, `:4759` `text-amber-600`; `src/simulators/EvdIcpSimulator.jsx:719,735,748,788,789` raw `red`/`amber`. Also one placeholder-contrast miss: `src/education.jsx:3530` `text-slate-400` (fails AA on white; linter says use `slate-500`).
- Recommendation: Replace raw `red-*`→`crit-*`, `amber-*`→`warn-*` per the linter's exact mapping; bump `slate-400`→`slate-500`. Pure design polish; no clinical wording touched. This is the one repo self-check currently red.
- Risk if wrong: low (visual consistency / dark-mode parity / one contrast pair). Effort: **S**.

**STROKE-D2 · P3 · a11y (tooling) · `scripts/lint-touch-targets.mjs`**
- Evidence: touch-target lint can't run without a Playwright browser at the default path. Environmental, not a repo bug — noted so the owner knows this gate was not exercisable here.
- Recommendation: none required; optionally document the `PLAYWRIGHT_*` env in CONTRIBUTING. Effort: **S**.

### 3.B Machine-readability

**STROKE-M1 · P3 · machine-readability · `data/guidelines/index.json`**
- Evidence: The index advertises `_meta.count: 18` and 18 `data[]` entries, but entry #5 (the `landmark-trials.json` catalog) is **malformed** — it has only `{recommendationCount, url}` and is missing the `id`, `title`, `shortTitle`, `doi`, `publisherUrl`, `pdfUrl` that all 17 real guideline entries carry. An agent iterating this index hits one entry it cannot identify or cite. The content validators do not cover this file.
- Recommendation: either give the landmark-trials entry a proper `id`/`title` (it is a catalog, not a guideline, so a distinct labeled entry is clearer), or move it out of the guideline index. Keep `_meta.count` in sync.
- Risk if wrong: low (agent parse ambiguity). Effort: **S**.

**STROKE-M2 · P3 · machine-readability / docs-drift · counts coherence**
- Evidence: `data/index.json`, `llms.txt`, and `sitemap.xml` are mutually coherent and match reality (64 completed / 10 active / 34 calculators). No dead endpoints observed in the manifest. `index.html` JSON-LD (`MedicalWebPage` + `Dataset`) is institution-neutral and mirrors the manifest — good. The drift is isolated to **README** (see P3-README below).
- Recommendation: no change to the machine surfaces; fix README only.

### 3.C Docs drift

**STROKE-DOC1 · P3 · docs-drift · `README.md`**
- Evidence (stale vs actual):
  - "Evidence Atlas … with **31** completed/landmark trials" → actual **64**.
  - "**42 verified citations**" → atlas has **76** citations (74 PMIDs static-checked).
  - matcher "…across **11 active trials**" and "**52 inclusion criteria + 15 exclusions**" → actual **10 active trials**, **50 criteria + 14 exclusions** (per `evidence:validate`).
  - "`npm run test:unit` … **427 tests**" → actual **850**.
  - "Deep links" / "GitHub Pages routing" list `#/management`, `#/management/ich`, `#/management/ischemic`, `#/management/calculators`, `#/management/references` — the live routes are `#/protocols/*` and `#/research` (per `data/index.json`). README deep-links are stale/misleading.
- Recommendation: update the counts to match `evidence:validate`/`test:unit` output, and replace `#/management/*` deep links with the real `#/protocols/*` + `#/research` routes. (Do not touch the snapshot-locked protocol wording — this is README prose only.)
- Risk if wrong: low-moderate (a machine or human following README deep links 404s or mis-navigates; count claims read as inflated/deflated). Effort: **S**.

### 3.D Clinical accuracy / currency

Method: a 7-surface multi-agent audit (IVT, EVT, ICH, secondary prevention, calculators, matcher, 2026-currency) verified every material claim against PubMed / ClinicalTrials.gov / FDA, with an adversarial verify pass on all P0/P1. **The reviewer independently re-verified every finding below against primary sources before recording it** (tool evidence cited). Overall the clinical content is accurate and unusually current; the material defects cluster in the trial-matcher data and a handful of attribution/wording errors.

**STROKE-C1 · P0 · safety (matcher false-positive) · `src/evidence/activeTrials.js` (MOST entry, ~L277–324)**
- Evidence: the "MOST" active-trial entry is fabricated on three axes. Its `nctId` `NCT05326139` **resolves to an unrelated study** — *"Topical Tranexamic Acid Application in Rhinoplasty"* (Başkent University, COMPLETED 2021, n=50, periorbital ecchymosis) — verified via ClinicalTrials.gov. Its `briefDescription` ("TNK 0.40 vs 0.25 + nerinetide") is invented. Its `status` is "recruiting". The **real MOST is `NCT03735979`** (Multi-arm Optimization of Stroke Thrombolysis, Washington University/NINDS, **COMPLETED Oct 2024**, n=514, interventions **argatroban / eptifibatide / placebo** adjunctive to thrombolysis; has results) — verified via ClinicalTrials.gov.
- Risk if wrong: a public medical page links a "recruiting" stroke trial to a rhinoplasty study and invents its intervention — reputational + a screener could suggest enrolling a patient in a closed trial. Per SECURITY.md, matcher misclassification is an in-scope clinical-safety bug.
- Fix: correct to real NCT/intervention/status (`status:'completed'`, neutral result). The app already filters the screener to actively-recruiting trials (`isTrialActivelyRecruiting`, `app.jsx:6018`), so a completed status auto-removes it from active matching while the corrected data stays honest; engine snapshot unaffected. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C2 · P0 · safety (matcher false-positive) · `src/evidence/matcher-engine.js` (~L101–110) + `src/evidence/activeTrials.js` (STEP-EVT)**
- Evidence: the MeVO domain resolver matches `['M2','M3','M4','A1','A2','A3','P1','P2','P3']` with **no NIHSS gate** and returns `'mevo'` (→ eligible). The real STEP platform (`NCT06289985`, recruiting, verified via ClinicalTrials.gov) MVO domain requires **non-dominant/co-dominant M2 or M3 AND NIHSS ≥8** (plus ASPECTS ≥6/≥7, no tandem/multi-territory, etc.). A low-NIHSS or A/P/M4-occlusion patient the real trial excludes currently matches "Eligible." Adversarial verify CONFIRMED (quote accurate in context).
- Risk if wrong: false-positive trial eligibility on a public safety-relevant surface (P0 per SECURITY.md).
- Fix: gate the mevo branch on `nihss >= 8` and restrict to `M2/M3`; align STEP `matcherCriteria` vessel list + descriptive fields to the real criteria. Requires updating `matcher-engine.test.js:120` and regenerating the STEP-EVT rows of `expected-snapshot.js` (intentional engine-behavior change). Effort **M**. **Verdict UPDATE — FIXED.**

**STROKE-C3 · P1 · accuracy · `src/education.jsx` (~L4834)**
- Evidence: interactive card says "escalate to DAPT (Aspirin + Clopidogrel) for 21 days (CHANCE/POINT) or **up to 90 days (INSPIRES)**." INSPIRES (Gao Y, *NEJM* 2023;389(26):2413-2424; PMID 38157499; DOI 10.1056/NEJMoa2309137 — verified via PubMed) used **aspirin only through day 21** plus clopidogrel through day 90, initiated within a **72-hour** window; new stroke 7.3% vs 9.2% (HR 0.79) but **moderate-to-severe bleeding 0.9% vs 0.4% (HR 2.08)**. Presenting INSPIRES as supporting 90 days of *dual* therapy inverts its safety message. (Distinct from the correct 90-day DAPT for symptomatic ICAD/SAMMPRIS shown in `#/protocols/ischemic`, which is left untouched.)
- Fix: cite INSPIRES for the 72-h initiation window + 21-day DAPT (clopidogrel monotherapy to day 90), not a 90-day dual course. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C4 · P1 · citation/attribution · `src/calculators.js` (L16), `src/calculators-extended.js` (L91, 143, 158, 679, 1063)**
- Evidence: six spots attribute recommendations to an **"AHA/ASA 2024 focused update"** (on antiplatelet therapy / DOAC timing / PFO). No such 2024 AHA/ASA stroke update exists — the only 2024 AHA/ASA stroke guideline is **Primary Prevention** (which excludes acute/secondary treatment), verified via web. Most consequential: labeling INSPIRES-based DAPT and early-DOAC "Class 1 (2024 focused update)."
- Fix: attribute to the actual trials (INSPIRES; ELAN/OPTIMAS/CATALYST) and the real **2021** AHA/ASA secondary-prevention guideline; keep COR only where a real guideline assigns it. "focused update" is absent from the frozen protocol DOM (confirmed), so snapshot-safe. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C5 · P1 · currency (framing) · `content/trials/af-after-ich.json` — OPEN**
- Evidence: the anticoagulation-after-ICH teaching rests on **AVERROES/ARTESiA, which excluded ICH survivors**. Dedicated RCTs now exist: **PRESTIGE-AF** (*Lancet* 2025) showed DOACs **reduce ischemic stroke but increase recurrent ICH/major bleeding** in ICH survivors with AF — a genuine trade-off with unsettled net benefit; **ENRICH-AF** (edoxaban) similar. Verified PRESTIGE-AF via web.
- Why OPEN: reframing anticoagulation-after-ICH guidance is a clinical-judgment call on unsettled, conflicting evidence (competing ischemic vs hemorrhagic risk). Per the mission's conservative-wording rule, this is left for owner adjudication rather than auto-rewritten. Recommended owner action: add PRESTIGE-AF (NCT03996772) + ENRICH-AF (NCT03950076) and present as an individualized risk trade-off. Effort **M**. **Verdict OPEN.**

**STROKE-C6 · P2 · accuracy (frozen wording) · `src/evidence/recommendations.js` (L128) → renders in frozen `#/protocols/ischemic`**
- Evidence: "the 0.4 mg/kg dose **was not non-inferior** in EXTEND-IA TNK part 2." EXTEND-IA TNK Part 2 (Campbell, *JAMA* 2020;323(13):1257-1265; PMID 32078683; DOI 10.1001/jama.2020.1511 — verified via PubMed) tested whether 0.40 mg/kg **improves** reperfusion vs 0.25 (a superiority/safety question, not a non-inferiority test): reperfusion was **identical, 19.3% vs 19.3% (adj RR 1.03, P=.89)**, with numerically more sICH (4.7% vs 1.3%). "Was not non-inferior" wrongly implies the higher dose failed a non-inferiority test / was less effective.
- Fix: state the higher dose showed **no reperfusion advantage** and a sICH trend, so 0.25 mg/kg is preferred. Clinical bottom line (use 0.25) is correct and unchanged. This string is in the frozen `ischemic.txt` snapshot → handled as an **intentional, documented `test:protocol-snapshot:update`**. Effort **S**. **Verdict UPDATE — FIXED (documented snapshot re-baseline).**

**STROKE-C7 · P2 · accuracy (drug dosing) · `src/calculators.js` (`calculatePCCDose`)**
- Evidence: the warfarin 4F-PCC pathway caps every INR tier at a flat **5000 units** (`Math.min(weight*iuPerKg, 5000)`). The **Kcentra label** (verified via CSL prescribing info) sets tier maxima **25 U/kg → 2500, 35 U/kg → 3500, 50 U/kg → 5000**, with dosing based on **body weight up to but not exceeding 100 kg**. For a >100 kg patient at INR 2–<4 or 4–6, the flat 5000 cap over-doses (e.g., 150 kg × 25 = 3750 vs label max 2500).
- Fix: cap weight at 100 kg before multiplying (`Math.min(weight,100)*iuPerKg`), which yields the exact label maxima per tier. `calculators.test.js` PCC cases (≤100 kg, and 50 U/kg where 100×50=5000) stay green. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C8 · P2 · currency · `content/trials/ich-surgery.json` — OPEN**
- Evidence: the ICH surgery section covers ENRICH/MISTIE III/MIND (evacuation) but omits **SWITCH** (2024 RCT of decompressive craniectomy for deep/severe ICH), a distinct modality. Not an error — a coverage gap.
- Fix: owner to add SWITCH with honest framing. **Verdict OPEN.**

**STROKE-C9 · P3 · accuracy · `content/trials/crao-thrombolysis.json`**
- Evidence: THEIA population states `n=71`; the trial randomized **70** patients. Also `citationId cit-theia-2023` is mislabeled (published 2025). Finding text (no significant benefit, p=0.95) is correct.
- Fix: n=71 → n=70. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C10 · P3 · citation · `content/education/aspirin-failure.md`**
- Evidence: INSPIRES cited as "*N Engl J Med.* 2024;390:59-69" — wrong article. Correct: *N Engl J Med.* 2023;389(26):2413-2424 (PMID 38157499, verified). PMID in the file is correct.
- Fix: correct the citation string. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C11 · P3 · citation · `content/guidelines/aha-asa-2022-ich-guideline.json` (rec-ich-anticoag-reversal-warfarin)**
- Evidence: warfarin reversal (4F-PCC + vitamin K) recorded as `COR I, LOE B-NR`. The 2022 AHA/ASA ICH guideline assigns **4F-PCC over FFP: COR 1, LOE B-R** (randomized evidence, e.g. INCH); IV vitamin K: COR 1, C-LD (verified via web). B-NR understates the randomized evidence.
- Fix: LOE `B-NR` → `B-R` (COR I unchanged). Not in frozen protocol DOM. Effort **S**. **Verdict UPDATE — FIXED.**

**STROKE-C12 / STROKE-M1 · P3 · machine-readability/polish · `data/guidelines/index.json` (generated by `scripts/generate-agent-assets.mjs`)**
- Evidence: the `landmark-trials.json` entry was malformed — `{recommendationCount, url}` only, no `id`/`title` — because the source catalog has no guideline metadata and the generator passed `undefined` through (it even printed `undefined — 0 recommendations` in `llms-full.txt`).
- Fix: added a filename-derived `id`/`title` fallback in the generator so every index entry stays identifiable (now `{id: "landmark-trials", title: "Landmark Trials", …}`); regenerated the agent assets. The maternal-stroke title was left as its current acceptable paraphrase (exact published title not independently confirmed this session — low value, avoided an unverified edit). Effort **S**. **Verdict UPDATE — FIXED (generator).**

**STROKE-C13 · P3 · accuracy · `src/calculators-extended.js` (BRAIN score) — OPEN**
- Evidence: the BRAIN ICH-expansion score uses simplified/non-canonical point weights (self-documented "Simpler implementation").
- Fix: owner to either reproduce the published BRAIN weights/validated bands or relabel as an unvalidated "BRAIN-derived heuristic." **Verdict OPEN.**

**Confirmed-correct (logged as positive verifications, no change):** medium/distal-vessel EVT correctly reflects the neutral ESCAPE-MeVO & DISTAL (2025); AF-timing correctly supersedes the 1-3-6-12-day rule with ELAN/OPTIMAS/CATALYST; large-core & late-window EVT (SELECT2/ANGEL-ASPECT/TENSION/DAWN/DEFUSE-3); ICH BP targets & andexanet/ANNEXA-I; TNK/alteplase dosing; the 2026 AIS guideline and all 2026 scientific statements; the Lipfendra/enlicitide FDA note (accurate, scope-bounded, kept out of the public feed).

---

## 4. Surface scorecard (1–5)

| Surface | Accuracy | Currency | Clarity | Redundancy | Safety framing | Citation | Notes |
|---|---|---|---|---|---|---|---|
| App shell / disclaimer / PWA | 5 | 5 | 5 | 4 | 5 | 5 | Clean, minimal; conditional banners don't over-stack; JSON-LD institution-neutral |
| Encounter / acute workflow | 5 | 5 | 4 | 4 | 5 | 5 | Public build disables persistence/exports; PHI guard patterns in place |
| Protocols — ischemic | 4 | 5 | 5 | 5 | 5 | 4 | One frozen-DOM wording fix (EXTEND-IA TNK, C6); ICAD 90-day DAPT correct |
| Protocols — ICH | 5 | 4 | 5 | 5 | 5 | 4 | Well-hedged; C11 LOE letter; C8 SWITCH gap (OPEN) |
| Calculators | 4 | 4 | 4 | 5 | 5 | 3 | C4 phantom-2024 attributions; C7 PCC cap; C13 BRAIN (OPEN) |
| Evidence atlas / guidelines | 5 | 5 | 5 | 4 | 5 | 5 | 2026 guideline + statements all verified real |
| Trial screener / matcher | 3 | 3 | 4 | 4 | 4 | 3 | **C1 MOST (P0), C2 STEP-EVT (P0)** — the review's most important fixes |
| Education hub | 4 | 5 | 4 | 4 | 5 | 4 | C3 INSPIRES; raw-hue token drift (D1) |
| What's new feed | 5 | 5 | 5 | 5 | 5 | 5 | 50 items; unverified items carry no PMID; Lipfendra kept out |
| README / public meta | 3 | 3 | 4 | 4 | 5 | 4 | Docs-drift counts + `#/management/*` route drift (DOC1) |

---

## 5. Prioritized improvement plan (this session)

Ordered by severity × leverage; grouped into logically-separated commits. Items marked OPEN are documented for owner judgment and intentionally not implemented.

| # | Finding | Change | Commit group |
|---|---|---|---|
| 1 | C1 (P0) | Correct MOST to real NCT03735979 / argatroban-eptifibatide / completed-neutral | matcher-data-integrity |
| 2 | C2 (P0) | Gate STEP-EVT MeVO on M2/M3 + NIHSS≥8; align criteria; regen snapshot + test | matcher-safety |
| 3 | C3 (P1) | INSPIRES 90-day → 21-day DAPT / 72-h window (education.jsx) | currency |
| 4 | C4 (P1) | Replace phantom "2024 focused update" with real trial + 2021-guideline attribution (6 spots) | currency |
| 5 | C7 (P2) | 4F-PCC weight cap at 100 kg (Kcentra label) | dosing |
| 6 | C9/C10/C11/C12 (P3) | THEIA n=70; INSPIRES citation; ICH warfarin LOE B-R; maternal title + landmark-trials index entry | content-polish |
| 7 | M1/DOC1/D1 (P2–P3) | guidelines index entry; README counts+routes; raw-hue→semantic tokens | docs-and-design |
| 8 | C6 (P2, frozen) | EXTEND-IA TNK Part 2 wording — **intentional** `test:protocol-snapshot:update` | protocol-wording (separate, documented) |

**OPEN for owner (not implemented):** C5 af-after-ICH reframe (PRESTIGE-AF/ENRICH-AF), C8 SWITCH addition, C13 BRAIN weights, STEP full exclusion set, optional OPTIMAL-BP citation on `bp-post-evt`.

**Out of scope (per mission):** large `app.jsx` render-closure rewrite; extracting frozen-zone calculators; Capacitor/native; re-enabling private modules; any "AI agent" marketing.

---

## 6. Implementation notes (what actually changed)

Edits respected the repo's generate/seed pipeline — several "content"/"data" files are **derived**, so fixes were applied to the canonical source and re-projected:

- **Trial-screener safety (C1, C2):** `src/evidence/activeTrials.js` (MOST → real `NCT03735979`/argatroban-eptifibatide/`completed`; STEP-EVT criteria), `src/evidence/matcher-engine.js` (MeVO domain now `M2/M3` + NIHSS ≥8), `src/evidence/__tests__/matcher-engine.test.js` (added false-positive guards). The frozen scenario snapshot was byte-identical (the bug was never exercised by the 19 scenarios), so `expected-snapshot.js` is unchanged.
- **Guideline/trial content (C9, C11):** authored in the **canonical** `src/evidence/completedTrials.js` (THEIA n=70) and `src/evidence/recommendations.js` (warfarin reversal `LOE B-R`), then `npm run content:seed` re-projected `content/trials/*` and `content/guidelines/*`. Direct edits to those `content/*` files were reverted (they are generated).
- **Education (C3, C10):** `src/education.jsx` — INSPIRES 21-day/72-h correction, INSPIRES citation string (both the module reference that seeds `content/education/aspirin-failure.md` and the rendered card).
- **Calculators (C4, C7):** `src/calculators.js` + `src/calculators-extended.js` — removed six phantom "AHA/ASA 2024 focused update" attributions; 4F-PCC weight capped at 100 kg (Kcentra label).
- **Protocols frozen wording (C6):** `src/evidence/recommendations.js` EXTEND-IA TNK caveat; the frozen `tests/snapshots/example-protocols/ischemic.txt` was re-baselined with a documented `test:protocol-snapshot:update` (one line changed).
- **Machine-readability (M1):** `scripts/generate-agent-assets.mjs` filename-derived `id`/`title` fallback → fixes `data/guidelines/index.json` **and** the `undefined` string that was leaking into `llms-full.txt`.
- **Docs/design (DOC1, D1):** `README.md` counts + `#/protocols/*` routes; token drift fixed (`src/education.jsx`, `src/simulators/EvdIcpSimulator.jsx`, 3 lines of `src/app.jsx`) so `lint:tokens` is clean.
- **Tooling robustness:** `scripts/qa-smoke.mjs` now honors `STROKE_CHROMIUM_PATH` (same override the snapshot script already uses), enabling browser QA where the Playwright-pinned build is absent.
- `lastReviewed` bumped to 2026-07-18 for the three re-verified entries (THEIA, warfarin reversal, aspirin-failure).
- Generated artifacts rebuilt: `app.js`, `tailwind.css`, `content/bundle.json`, `data/atlas/*`, `data/guidelines/index.json`, `llms-full.txt`.

## 7. Verification (all run; results)

| Gate | Result |
|---|---|
| `npm test` (full CI chain) | ✅ exit 0 (leak-guard, test:protocol, citations, inline-citations, evidence:validate, **content:seed:check in sync**, content:validate, bundle:check, whats-new, churn/latency/promotion/automedbench, qa-smoke local) |
| `npm run test:unit` | ✅ 850 tests / 33 files |
| `npm run test:protocol` | ✅ 45 tests |
| `npm run test:protocol-snapshot` | ✅ PASS (1 documented ischemic re-baseline) |
| `npm run build` | ✅ content bundle + tailwind + esbuild |
| `npm run lint:tokens` | ✅ **clean** (was failing pre-review) |
| `npm run lint:contrast` | ✅ 21 pairs ≥ AA |
| `npm run agent:assets:check` | ✅ OK |
| qa-smoke `--local-only` | ✅ 4 runs / 0 issues (browser QA via chromium override) |
| `npm run lint:touch-targets` | ⚠️ not runnable here (Playwright build mismatch); env-only, not a defect |

**OPEN items for owner (not implemented):** C5 (af-after-ICH reframe — PRESTIGE-AF/ENRICH-AF trade-off), C8 (add SWITCH to ICH surgery), C13 (relabel/reimplement BRAIN score), STEP full exclusion set, optional OPTIMAL-BP citation on `bp-post-evt`.

---

## 8. Follow-up round (2026-07-18) — OPEN items implemented; C6 reverted per owner

Owner directed: implement all OPEN items and show the anticoagulation-after-ICH evidence in full and objectively, with **no changes to the Protocols tab**. All new work lands in `#/trials`/`#/research`/`#/education` (a protocol-snapshot check confirmed **zero drift** across all six frozen subtabs).

- **C6 REVERTED (Protocols tab):** the EXTEND-IA TNK wording change and its `ischemic.txt` re-baseline were reverted; the Protocols tab now matches `main` byte-for-byte. The EXTEND-IA "was not non-inferior" phrasing (imprecise vs PMID 32078683) is **re-filed as an OPEN Protocols-wording item** for the owner to decide on directly.
- **C5 IMPLEMENTED — totality of anticoagulation-after-ICH evidence, objective:** added five verified entries to the `af-after-ich` atlas topic — **PRESTIGE-AF** (Lancet 2025, PMID 40023176: ischaemic HR 0.05 but recurrent-ICH non-inferiority not met, HR 10.89), **ENRICH-AF** (NCT03950076; ongoing — only reported result is the lobar-ICH arm stopped for harm), **SoSTART** (Lancet Neurol 2021, PMID 34487722; inconclusive), **APACHE-AF** (Lancet Neurol 2021, PMID 34687635; no difference, imprecise), and the **COCROACH** IPD meta-analysis (Lancet Neurol 2023, PMID 37839434; ischaemic HR 0.27 significant, composite HR 0.68 NS, bleeding HR 1.80 NS). AVERROES/ARTESiA reframed objectively to note they did **not** enrol ICH survivors.
- **C8 IMPLEMENTED:** **SWITCH** (Lancet 2024, PMID 38761811) added to `ich-surgery` — decompressive craniectomy for severe deep ICH; mRS 5-6 44% vs 58%, aRR 0.77 (95% CI 0.59-1.01), p=0.057 (favoured surgery numerically, not significant).
- **C13 IMPLEMENTED:** `calculateBRAIN` rewritten with the **canonical Wang et al. Stroke 2015 weights** (PMID 25503550; B 0/5/7, R 4, A 6, I 2, N 5→0 by time band; range 0-24) — replacing the prior "simpler" non-canonical arithmetic and the wrong journal citation (was "Neurology 2015").
- **OPTIMAL-BP** (JAMA 2023, PMID 37668619) added to `bp-post-evt` — intensive SBP <140 after successful EVT reduced functional independence (39.4% vs 54.4%, aOR 0.56), a second RCT reinforcing ENCHANTED2/MT.
- **STEP full exclusion set:** displayed exclusions expanded to the complete real STEP criteria (septic embolus, seizure at onset, ICAD, ASPECTS <6/<7, tandem/multi-territory, mass effect >5 mm, etc.); two executable matcher exclusions added (`seizures`, `aspectsScore<6`). Matcher coverage 16/16; count test updated 14→16.

Verification (round 2): all trials/scores verified against PubMed/ClinicalTrials.gov (7-agent workflow); `npm test` exit 0; `test:unit` 850; `evidence:validate` 71 completed / 82 citations / 16 exclusions; `content:seed:check` in sync; `lint:tokens` clean; **protocol snapshot zero drift**; qa-smoke 4/0.
