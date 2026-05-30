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
### Round 2 (app.jsx a11y/UX quick-wins + D2/D3) — DONE `32ac35d`
- B1 dark "More"/Settings dropdown → token utilities (dark-correct); B2 "Clear all data" → `dark:text-crit-400` (3.0:1→6.39:1); B4 +15 Protocols `select`/`label` associations (axe select-name 9→0, label 3→0); B7 ⌘K kbd badges slate-500→600 (4.24:1→6.76:1); B8 palette focus-restore on Esc/backdrop; B9 Encounter live-note `<pre>` `tabIndex=0`+aria-label (scrollable-region-focusable→0); B10 IIb badge `bg-warn-500`→`warn-700` at source (3.61:1→6.56:1, app-wide); D2 CHANCE-2 DOI `NEJMoa2104816`→`NEJMoa2111749`; D3 generated note prepends "SYNTHETIC EDUCATIONAL DEMO…" in PUBLIC_DEMO_MODE.
### Round 2b (theme + nav) — DONE `5ff8432`
- **B5/U9 — unified the two conflicting theme systems** (theme.js v7 vs legacy `darkMode` boolean that bypassed it and could enter a half-styled dark state on public). Collapsed to ONE source of truth (theme.js getThemePref/setThemePref/effectiveTheme); Settings menu now a 3-way **System / Light / Dark** radiogroup. Fresh public load still defaults LIGHT (no change for current users); explicit Dark/System now honored + persisted; grep confirms only theme.js toggles the `dark` class.
- B6/U11 — Encounter section TOC + IntersectionObserver scrollspy (desktop jump-links + mobile "Jump to…" select, aria-current, reduced-motion-aware). Non-sticky (avoids patient-strip sticky-stack conflict) — noted.
### Round 3 (dark-mode contrast sweep) — DONE `aa671a8`
- Unifying the theme made dark reachable on public → exposed a large pre-existing dark defect. axe AA `color-contrast` in dark across 13 routes: **1540 → 0**. Biggest lever: 5 non-remapping CSS-var aliases in `tokens.css` (`--panel/--panel-2/--ink-soft/--faint/--line-2`) given `[data-theme="dark"]` overrides (~190 nodes). Plus `GUIDELINE_CLASS_COLORS` IIa, `effectClass()`, tailwind `overlay`/`strong` colors + simulator content-glob, and a `dark:`-variant codemod. **Light mode byte-identical** (CSS-diff: 0 light rules changed/removed) — verified.
### Round 4 (light-mode contrast pass) — DONE `1747d5a`
- The dark sweep's axe run surfaced 46 pre-existing LIGHT AA failures on the DEFAULT site (orange/slate/warn/rose/pink/teal text on washes; a 3.55:1 button). Reclassified as in-scope (AA failure on default surface = SAFE+MATERIAL). Darkened at source (slate-500→600 detail renderers, shared DAWN/DEFUSE-3/DAPT/PHQ-9 captions in components.jsx) + per-node 600→700/800 steps. axe light **46 → 0** (+4 latent state-gated); dark regression-checked **still 0**; light visuals faithful (one-step darken).
### Cycle 1 close — version 6.5.0 → **6.6.0** (SW cache `v6-6-0`, index `?v=`/inline, package.json), full gate battery, deploy, live verify.
- 🔴 **Live-verify finding → 6.6.1 (`fix`):** v6.6.0 shipped; live browser smoke on the real github.io host exposed a THIRD theme surface the B5 unification missed — the **inline pre-paint script in `index.html`** force-removed `stroke.v7.theme` and pinned light on every public load, so the new 3-way control's "Dark" rendered for the session but reset on reload (Dark unreachable-persistently on public; orphaned the Round-3 dark work for public users). Fixed: inline script now MIRRORS theme.js (`getThemePref`/`effectiveTheme`) — public unset→light, explicit Dark/System(auto) honored+persisted, no FOUC; non-public path byte-identical. Bumped 6.6.0→**6.6.1** (SW cache `v6-6-1`). Lesson: "unify the theme system" must include the pre-paint `<head>` script — local gates can't catch a `github.io`-gated, reload-only bug; **live-verify on the real host is load-bearing.**
### Noted (re-evaluate next cycle, not yet material): 46 other What's-New items carry generic "without an increase in mortality" boilerplate appraisal text (not study-contradictory like ATLAS); citation-map DOIs need a one-time CrossRef/PubMed verify pass (only CHANCE-2 proven wrong); TOC non-sticky (patient-strip offset coordination deferred); pre-existing light raw-hue base classes that also fail in some non-default states audited clean now.
