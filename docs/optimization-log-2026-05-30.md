# StrokeOps Optimization Log — 2026-05-30

Iterative audit/improvement cycles across: **evidence/correctness · visual design · UX ·
accessibility · performance · PWA/offline · public-safety**. Completion = two consecutive
full cycles with **no remaining safe, material, source-verifiable improvement**.

Classification per finding: **SAFE** (low regression risk) · **MATERIAL** (real user/clinical
impact) · **SOURCE-VERIFIABLE** (clinical claims traceable to a published source). Only
findings that are SAFE + MATERIAL (+ source-verifiable when clinical) are actioned.

Baseline at start: **v6.5.0** live (rkalani1.github.io/stroke). Prior work this session:
teal re-skin, native screener/eligibility/4 simulators, Command Center + palette, repo
inventory, version unification, issue #1 closed, punch-list UX (U1-U6,U12,U5 two-pane),
clinical currency (C1 ≤4.5h window, C6 absolute TBI CI).

---

## Cycle 1

### Audit (parallel, read-only): A evidence · B UX/visual/a11y · C perf/PWA · D public-safety/links

### Findings → actions
**Public-safety (D):**
- 🔴 **D1 (MATERIAL+HIGH):** `src/education.jsx` (Education tab) leaked ~25 REAL institutional identifiers (HMC Policy 35.12, VA Puget Sound, UW Neurology Residency, SCH/UWMC) into the deployed bundle → **FIXED** `16744e2`: scrubbed institution-neutral, generic disclaimer, +bundle-level CI guard `tests/no-institutional-identifiers.test.js` (negative-control verified), +Education tabpanel aria/prop fix (B3). Bundle grep = 0.
- D2 (MATERIAL): CHANCE-2 DOI wrong (`NEJMoa2104816` 404 → real `NEJMoa2111749`). → Round 2.
- D3 (SAFE): generated transfer-note copy lacks a synthetic-demo self-label (screener/eligibility do embed it). → Round 2.
- Q2/Q3/Q5 (banners/persistence/private-layer): CLEAN/robust.

**Evidence (A):**
- 🔴 **A1 (MATERIAL+SAFE+SOURCE-VERIFIABLE):** AF-anticoag-timing rec cited pre-OPTIMAS/CATALYST → **FIXED** `2bdf827`: rec/claim now reference OPTIMAS (PMID 39491870) + CATALYST IPDMA (PMID 40570866, OR 0.70) — "early ≤4d across severities, except very severe/large HT."
- **A2 (MATERIAL+SAFE):** What's-New ATLAS appraisal FABRICATED "sICH 5.5% vs 2.7% significantly higher" (real: 1.1% vs 1.0%, no diff) + CHOICE-2 "no mortality increase" (real: 12.1% vs 6.4%) → **FIXED** `2bdf827` (corrected briefing source + regenerated; grep '5.5% vs 2.7%' = 0).
- DAPT/BP/reversal/LDL/PFO/TIA/late-window/simulators: AUDITED ACCURATE (convergence signal).

**PWA/offline (C):**
- **C1 (MATERIAL+SAFE):** SW precache (bare `./app.js`) didn't match `app.js?v=N` requests → offline shell break after version bump → **FIXED** `acf76bd`: `ignoreSearch:true` on shell catch. Live Lighthouse: A11y 100 / BP 96 / SEO 100, LCP 181ms, CLS 0. Compression/CORE_ASSETS/fonts-offline/manifest/cache-flow: CONVERGED.
- C2 (minor cosmetic): `private/institutional.js` + `config.local.json` 404s drop BP 100→96 + console noise. → Round 2 (optional).

**UX/visual/a11y (B):** B1/B2 dark "More" dropdown bg-white + contrast fail; B4 Protocols `<select>` label association (×9); B5 dual theme systems → 3-way "Theme: Light/Dark/System" (U9); B6 Encounter TOC (U11); B7 ⌘K kbd badge contrast 4.24:1; B8 palette focus-restore on close; B9 Encounter scroll-region tabindex; B10 white-on-warn-500 badge contrast. → Round 2. (No horizontal overflow anywhere; ⌘K palette ARIA exemplary; landmarks/reduced-motion clean — convergence signals.)

### Round 1 (parallel, disjoint files) — DONE: 16744e2 (D1+B3) · 2bdf827 (A1+A2) · acf76bd (C1)
### Round 2 (app.jsx a11y/UX batch + D2/D3) — in progress
### Noted (re-evaluate next cycle, not yet material): 46 other What's-New items carry generic "without an increase in mortality" boilerplate appraisal text (not study-contradictory like ATLAS); citation-map DOIs need a one-time CrossRef/PubMed verify pass (only CHANCE-2 proven wrong).
