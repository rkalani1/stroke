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
- 🔴 **D1 (MATERIAL+HIGH):** `src/education.jsx` (Education tab) leaked ~25 real institutional identifiers into the deployed bundle → **FIXED** `16744e2`: scrubbed institution-neutral, generic disclaimer, +bundle-level CI guard `tests/no-institutional-identifiers.test.js` (negative-control verified), +Education tabpanel aria/prop fix (B3). Bundle grep = 0.
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
- **Live theme verification (production, 6.6.1):** fresh public no-pref → LIGHT ✓; explicit Dark pref + full reload → DARK persists ✓; dark Protocols/ICH = 295 text nodes, 0 contrast failures ✓ (independently corroborates Round 3 on prod).

---

## Cycle 2  (v6.6.1 → **6.7.0**)

### Audit — 5 parallel READ-ONLY agents (evidence · a11y · visual/UX · perf/PWA · public-safety). NOT clean (real findings in 4/5 dims; **public-safety came back fully convergent** — D1/D3 held, zero institutional/PHI/link/network leaks re-verified live → first convergence signal).

### Fixes (5 commits)
**Evidence — `9d6fd28` + `119a79a`:**
- **B1+9 wrong-article citation links (MATERIAL+SOURCE-VERIFIABLE):** TIMELESS/TRACE-III had transposed PMIDs (→ NASH / reteplase papers). Hardened `validate:citations:ids` to title-cross-check ALL 66 `citations.js` PMIDs (was: only the 24-row docs table) — the new guard immediately surfaced **9 MORE** wrong-PMID citations (EXTEND, EPITHET, ECASS-4, CHOICE, THEIA, ARTESIA, BP-TARGET, ENCHANTED2/MT, OPTIMAL-BP) + 4 wrong DOIs + a fully-placeholder THEIA entry. ALL 11 PubMed-verified & corrected; `--check-identifiers` 9→0. Guard is now permanent CI (fix-at-the-guard caught a whole latent class).
- **B2 fabricated positive appraisal (MATERIAL):** the generator copied a templated "endpoint met, favoring intervention, p<0.05, no mortality increase" line from the weekly briefing into `appraisal.results` for 46/50 items — FALSE for negative/neutral trials (ESCAPE-MeVO mortality↑, DISTAL/STEP-Mild/FOCUS neutral) and self-contradicting each card's true `bottomLine`. Fixed at `generate-whats-new.mjs` (durable vs the weekly-regenerated source): `isFabricatedResults`/`safeResults` restate the verified bottom line or a neutral non-asserting line. Grep-proof: "favoring the active intervention"/"endpoint was met"/"without an increase in mortality" = 0. Microplastics item metadata corrected (systematic-review, not RCT).
**A11y/responsive — `125246b`:** A1 **9 wide data-tables** `tabIndex=0`+role=region+aria-label (axe scrollable-region-focusable serious → 0); A2 removed duplicate `role="main"` on `.app-shell` (landmark trio, **156 nodes/route → 0**, one line); A3 heading-order contiguous (tag-only, appearance identical); U1 Education search no longer collapses to 54px (`min-w-[240px] self-start`); U2 top-nav pill overprint in 640–1023px fixed (responsive short labels + a hidden index.html `!important`-specificity bug found & beaten with `lg:!hidden`/`lg:!inline-flex`); U3 Encounter form squeeze in 1024–1279 fixed (two-pane gated `lg:`→`xl:`); U4 banner grammar.
**PWA/housekeeping — `d6695a9`:** **P1 offline reload dead-end (MATERIAL)** — SW navigate-fallback now serves cached `./index.html` shell FIRST, `offline.html` last-resort (was reversed → clinician stranded on a looping "You're offline" card); offline.html link `#/encounter`→`./` (real nav). Playwright-verified: cold-nav + reload offline both render full app; `app.js?v=` precache intact. P2 institutional.js loader gated off public → **0 console 404s** on public (still loads local). P3 deleted orphaned `device-frame.jsx`.
**A11y/perf — `8a98f29`:** finished heading-order on calculators/references/simulators (**0 on all 15 routes**); **CLS 1.0 → 0.0002** via static `#root{min-height:100vh/100dvh}` in the pre-paint `<style>` (JS injection was too late — footer already painted; Lighthouse Perf ~76→~95). Pixel-identical, no flash (kept under hard-revert rule).

### Cycle 2 close — version 6.6.1 → **6.7.0** (SW cache `v6-7-0`), full gate battery (validators + vitest 5688 + lint:contrast 21/21 + `--check-identifiers` 0 + institutional 0/0/0), deploy, live verify (CLS 0, institutional.js not requested on public, corrected PMIDs in bundle).

---

## Cycle 3  (v6.7.0 → **6.8.0**)

### Audit — 5 parallel READ-ONLY agents, now scanning DEEPER (open menus / expanded `<details>` / populated Encounter / later phases). **2 of 5 dims CONVERGED: perf/PWA CLEAN** (CLS 0 live+local, offline reload holds, BP 100 live, simulator-animation cleanup empirically leak-free) **+ public-safety CLEAN** (re-confirms Cycle-2; exhaustive identifier+PHI+links+network sweep, live DOM, zero leaks). The other 3 found only **state-gated** defects a default-state scan can't see — the signal the two-consecutive-clean rule is built to catch.

### Fixes (4 commits)
**Evidence inline footnotes — `7338f4b`:** **6 wrong inline-citation PMIDs** in 3 user-facing `app.jsx` footnotes (AcT/TRACE-2/ORIGINAL → liver/hip/bladder papers; CLOSE↔REDUCE swap → REDUCE/preschool-nutrition; ACTION-CVT → a condensed-matter-physics paper) — an UNGUARDED evidence store (the citations.js guard never saw inline footnotes). All PubMed-verified & corrected + 3 wrong journal strings fixed. Hardened `validate-inline-citations.mjs` with an opt-in `--check-identifiers` content cross-check for app.jsx inline PMIDs (catches 5/6 of the class; the CLOSE↔REDUCE same-journal/same-year swap is the one heuristic limit — honestly reported).
**A11y interaction-states + responsive — `b3c02f3`:** **C3-1 [critical]** theme control was an illegal `role="radiogroup"` child of `role="menu"` → converted segments to `role="menuitemradio"` in a `role="group"` (`aria-required-children` → 0, menu-open); **C3-2 [serious ×103]** inline citation links were color-only (`hover:underline`→`underline`, WCAG 1.4.1, expanded details); **C3-3** wash-mounted `slate-500` captions → `slate-600` (atlas/NNT). **C3-4** ~40 "dark" violations were a **harness artifact** (audit toggled `.dark` class but left `data-theme="light"` → CSS-var ramps keyed on `[data-theme="dark"]` didn't apply → partial dark → phantom failures; real app sets BOTH, dark genuinely 0 per live verify) → correctly no change. **V1** sticky vitals-strip overprinted the sticky header (768–1920) → offset `sticky top-[var(--app-header-h)]`; **V2** sidebar "Institutional Protocols & Algorithms" clipped → 2-line wrap (mandated name preserved); **V3** DAPT calc asserted "DAPT not indicated" from EMPTY input → neutral "Enter NIHSS" prompt.
**Matcher-caption residual — `2e5730d`:** trial-matcher `slate-500` captions on status washes (only render in populated Encounter, axe-unreachable) → `slate-600`.

### Cycle 3 close — version 6.7.0 → **6.8.0** (SW cache `v6-8-0`), full gate battery, deploy, live verify.
### Noted (re-evaluate Cycle 4): `docs/evidence-review-2021-2026.md` PROSE (not the validated table, not deployed) still repeats the old wrong PMIDs — docs-only, immaterial to the live site; the inline-citation guard can't distinguish a same-journal/same-year acronym swap without a hand-maintained anchor table (deliberately avoided); other wash-mounted `slate-500` captions only reachable in populated Encounter/expanded state — Cycle-4 a11y audit to scan those states explicitly.

---

## Cycle 4  (v6.8.0 → **6.8.1**)

### Audit — 5 parallel READ-ONLY agents (deep on evidence/a11y/visual; regression-confirm on perf/PWA + public-safety). **4 of 5 dims CLEAN:** evidence CLEAN (Cycle-3 held; fresh clinical slice — NIHSS/ICH-score/ABCD²/PHASES/RCVS²/dosing-tables/HINTS+pupillometry sim logic — all source-accurate; only wrong-PMIDs left are in NON-rendered `window.strokeP0` console-QA strings → COSMETIC), visual/UX CLEAN, **perf/PWA CLEAN** (Lighthouse 100/100/100 live, LCP <190ms, CLS 0, offline holds, leak-free), **public-safety CLEAN** (3rd consecutive — exhaustive sweep, zero leaks). a11y found **one** real finding.

### Methodology fix carried forward: the a11y agent was instructed to bootstrap dark CORRECTLY (`localStorage stroke.v7.theme=dark`+reload → asserts BOTH `data-theme=dark` AND `.dark`), eliminating Cycle-3's phantom-dark artifact. Proof a finding is real, not phantom: it fails in dark while the SAME DOM passes in light.

### Fixes (2 commits)
**M4-1 dark chip contrast — `09766b3`:** in **populated Encounter + dark**, the LKW treatment-window timer rendered white text on `--confirm` (#5FB489 — a semantic token LIGHTENED in dark for *text* use) consumed as a solid *background* → 2.1–2.5:1 (1.4.3 fail). Class-level fix: every semantic-token solid-fill chip with light text (`bg-confirm`/`bg-caution`/`bg-critical`: LKW timer, TNK dose header + MAX-DOSE, sidebar elapsed panel, `.v6-btn-*`, `Button` variants) pinned to `dark:bg-{ok,warn,crit}-700` → dark == light (#1E5438, 8.82:1). Negative-control reproduced+cleared.
**Contrast tail closed — `f417b30`:** driving into **opened+populated calculator states** (which NO route/tab-level scan reaches) surfaced **41 more AA violations** → all fixed to 0: MAX DOSE pill (`bg-white/20 dark:bg-card/20` — the dark override silently DIDN'T COMPILE, arbitrary opacity on a CSS-var alias → `bg-warn-900` 11.63:1); 7 `text-orange-600`+2 `-500` body captions → -700/-800; a Quick-Dosing **drug-name dark-on-dark bug** (`classes.split` dropped the `dark:text-*-300` variant → restructured colorMap, 7 nodes); 20 `slate-500` calculator captions on tints → slate-600; 6 `white/70` radio/timer secondary labels; Hunt-Hess/WFNS/VTE/PHASES singletons. Final axe `color-contrast` = **0 in every reachable state, both themes** (40-state sweep + exhaustive calculators/protocols).

### Cycle 4 close — version 6.8.0 → **6.8.1** (SW cache `v6-8-1`), full gate battery, deploy, live verify. (4/5 dims already converged; this closes the a11y contrast tail.)
### Lesson: convergence-by-axe is only as complete as the states you render — a silently-dead Tailwind override (`dark:bg-card/20`) + 41 nodes hiding in opened-calculator states proved a tab-level scan ≠ a full scan. Future audits must drive deep states (open every accordion, populate every calculator).

---

## Cycle 5  (v6.8.1 → **6.8.2**)

### Audit — 5 parallel READ-ONLY (deep a11y/visual; regression-confirm perf/PWA + public-safety). **3 of 5 CLEAN** (evidence rendered-surfaces — fresh slice Atlas effect-sizes/screener-I&E/matcher-logic/verified-appraisals all source-accurate; **perf/PWA CLEAN** Lighthouse Perf 93/95 CLS 0; **public-safety CLEAN** 4th consecutive). a11y + visual found real items in the under-covered SIMULATOR files + references/calculators deep states → counter reset (the rule working).

### Fixes (4 commits)
**Evidence hygiene — `232986e` + `cd60ff3`:** corrected **18 wrong-article PMIDs in NON-rendered `calculators-extended.js`/`calculators.js` `window.strokeP0` QA-scaffold** `source:` strings (3 then 15; INSPIRES/TRACE-III/OPTIMAS + ENRICH/SWITCH/ARTESIA/Boston2.0/RESCUE-BT2/ESPRIT/ATTICUS/INTERACT3/RESCUE-Japan/Kent-PASCAL/ENCHANTED2-MT/TENSION/LASTE/CSPS.com/CASSISS), all PubMed-verified (5 cross-confirmed vs the rendered citations.js). Non-rendered → didn't BLOCK convergence, but closes the wrong-PMID class entirely (rendered + non-rendered) + removes a wire-up landmine. Wrong journals/years also fixed.
**A11y + visual — `c55ef42`:** (8 audit + 3 sibling) PHQ-9 radios got `aria-label`+`th scope` (36 nodes, were unnamed); 4 unlabeled `<select>`s (PHASES/CrCl/CVT/Andexanet) id+htmlFor; references View/Download buttons had `text-white`+`text-link-600` CONFLICT → teal-on-cobalt 2.79:1 dark → removed link classes; references Email `bg-orange-600`→`-700` (light 3.55); 8 references/pupillometry `slate-500`→`600` captions; Pupillometry button `teal-600`→`700`; **NeuroExams table** `tabIndex=0`+role (missed instance — separate sim file); **EvdIcp SVG "TRAGUS (forame…" clip** → right-anchored `textAnchor=end x=312` (restores foramen-of-Monro zeroing reference).
**Wash-badge contrast class CLOSED — `2d097e3`:** static enumeration across ALL files found **14 failing `bg-{crit,warn,ok,orange}-50/100/200`-wash + lightened-text badge pairs** collapsing to 1.25–2.44:1 in DARK (root cause: `-50/-100/-200` washes don't remap in dark, only text `-300/400` brightens). Seed = the SAFETY-relevant "Renal dose adjustment required" badge (1.72:1 dark, only renders at low CrCl). All fixed (`dark:bg-*-950` + theme-flipping `--tag-*` vars for v7 chips); measured 5.37–10.12:1; axe 0 in every triggered + injected state both themes; v7 chip visual identity preserved.

### Cycle 5 close — version 6.8.1 → **6.8.2** (SW cache `v6-8-2`), full gate battery, deploy, live verify. NOT a clean cycle (a11y/visual found real items) → convergence counter reset; Cycle 6 begins the two-consecutive-clean requirement afresh.
### Lesson: a fix applied "everywhere" means "everywhere the sweep's file-glob reached" — 3 of Cycle-5's a11y findings were MISSED INSTANCES of already-applied fixes living in separate `src/simulators/*.jsx` files. Closing a class durably = STATIC enumeration across ALL source files + driving state-gated clinical inputs (low CrCl, out-of-range labs), not just axe-on-default-state.

---

## Cycle 6  (v6.8.2 → **6.8.3**)

### Audit — 5 parallel READ-ONLY (deep a11y/visual; regression-confirm evidence/perf/public-safety). **3 of 5 CLEAN** (evidence — fresh 8-PMID PubMed spot-check 8/8, THEIA correction held, 18 non-rendered scaffold fixes held; **perf/PWA CLEAN** Lighthouse Perf 93/94 CLS 0, CSS +0.33% only; **public-safety CLEAN** 5th consecutive). a11y + visual found 4 stragglers (the audits correctly REJECTED 3 non-blockers: by-design mobile-nav `region`, a slider-race phantom, a hover-only contrast — good discrimination).

### Fixes — `4bbbe30`
- **A `landmark-unique`** (app.jsx:28986): 6 AIS-Command-Center scrollable-table regions shared one aria-label → `${card.shortLabel||card.title}` (9 unique).
- **B `heading-order`** (references, app.jsx:33941/34848): h1→h4 / h2→h4 skips → demoted HINTS cluster + guideline card to contiguous h2/h3 (tag-only, appearance identical).
- **M1 research caveat pill** (app.jsx:35887): `whitespace-nowrap` truncated the unverified-provenance caveat mid-word AND forced the study card wider than its column (clipping the title/summary) at 320/375/1024/1280 → wrap (`whitespace-normal max-w-full break-words`); screenshot-verified full text + intact card at 6 widths both themes.
- **M2 EvdIcp TRAGUS↔transducer collision** (EvdIcpSimulator.jsx:507): the Cycle-5 edge-clip fix (right-anchor x=312) traded a clip for an OVERLAP — the label sat on the XDCR transducer box at the level (offset-0) state. Moved label to its own row (`y=tragusY-13`) keeping the in-bounds anchor; screenshot-verified no-clip AND no-overlap at offset 0 + both extremes × 320/1280 × light/dark (12 cases). Lesson: SVG label placement is two-sided (fit bounds AND avoid movable elements) — verify the default + extreme render states, don't reason from coords.

### Cycle 6 close — version 6.8.2 → **6.8.3** (SW cache `v6-8-3`), full gate battery, deploy, live verify. NOT clean (4 items) → two-consecutive-clean counter has not yet started; Cycle 7 is the next clean attempt.

---

## Cycle 7  (v6.8.3 → **6.8.4**)

### Audit — 5 parallel READ-ONLY. **3 of 5 CLEAN** (evidence — 6/6 fresh PubMed spot-checks match, no regression from Cycle-6 tag changes; perf/PWA — Perf 93/95 CLS 0, deterministic byte-identical build; public-safety — 6th consecutive). a11y + visual found 5 stragglers (audits again rejected non-blockers — a search `aria-activedescendant` render-race PHANTOM correctly excluded).

### Fixes — `17e5b34`
- **F1 mobile-nav landmark** (app.jsx:36423): the mobile bottom `<nav role="tablist">` overrode its own navigation landmark (desktop wraps its tablist in `role=navigation`, mobile didn't) → moved `role=navigation` to the `<nav>`, `role=tablist` to an inner div (axe `region` 0 at 375).
- **F2 phone-path date/time labels** (app.jsx:17883/17886): `#phone-discovery-date/time` were unlabeled (siblings had aria-label) → added aria-label.
- **V2 EvdIcp error↔TRAGUS collision at NEGATIVE offsets** (EvdIcpSimulator.jsx:515): the "±X mmHg error" text lived INSIDE the transducer `translate()` group at `tragusY+20`, so raising the bed (offset −10..−15) drove it up into the stationary TRAGUS label (the symmetric counterpart of Cycle-6's M2, which only checked offset 0 + positive) → pulled it OUT of the group to a fixed safe position; screenshot-verified non-overlapping across −15..+15 × both themes × 320/1280.
- **V1+V3 + WIDE-TABLE CLASS CLOSED** (pocket-cards COR/LOE 437/449, components PHQ-9 730 clipped on phones — same "missing `overflow-x-auto`" class as Cycle-2's app.jsx tables, but in SATELLITE files): inventoried ALL 21 `<table>`s across every source file → 3 wrapped + 6 bare-wrappers upgraded to the standard `overflow-x-auto tabIndex=0 role=region aria-label focus-ring` pattern (unique labels); 12 already standard. Full axe sweep (14 routes × 2 themes × 375/1280 + populated): **0** across region/label/landmark-unique/scrollable-region/contrast/heading-order.

### Cycle 7 close — version 6.8.3 → **6.8.4** (SW cache `v6-8-4`), full gate battery, deploy, live verify. NOT clean (5 items) → counter not started; Cycle 8 next.
### Lesson (reinforced): closing a class = enumerate across EVERY file (V1/V3 were the Cycle-2 table class in satellite files) + verify the FULL parameter range of any moving element (V2 was the negative-offset mirror of M2). Sampled endpoints + single-file globs leave stragglers.
