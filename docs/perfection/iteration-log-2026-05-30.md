# StrokeOps Perfection Campaign — Iteration Log (2026-05-30)

Iterative audit → improve → verify loop on the public, synthetic, offline-first stroke-call cockpit
(https://rkalani1.github.io/stroke/). Stop criterion: **two consecutive full audit cycles with zero
remaining P0/P1/P2 items that are safe, material, and source-verifiable.**

> This is the formal `docs/perfection/` record required by the campaign brief. The blow-by-blow technical
> detail (commit-level) lives in the companion `docs/optimization-log-2026-05-30.md`; this file is the
> structured iteration history with P0–P3 classification, gates, and versions.

**Priority key:** P0 = patient-safety / medical-accuracy / public-safety / test failure · P1 = major
usability / accessibility / device breakage · P2 = material aesthetic or workflow improvement · P3 = minor
polish · QUARANTINE = needs external clinical confirmation or private data · REJECTED = unsafe / speculative
/ phantom / duplicate.

**Baseline at campaign start:** v6.5.0 live (Command Center landing, version alignment, issue #1 closed,
UX ergonomics U1–U6/U12/U5 two-pane Encounter, IVT-contraindication/TNK-window currency).

**Audit dimensions per cycle (8):** clinical-accuracy/evidence · usability/devices · aesthetics ·
interaction · accessibility · perf/PWA · public-safety/privacy · error-free operation.

**Method:** each cycle = 5 parallel read-only audit agents (one per major dimension) producing ranked,
classified findings → serialized fix agents (shared working tree + committed `app.js` build artifact force
serial commits) → full gate battery → version bump → PR → merge → GitHub Pages deploy → **live verification
on the real `github.io` host** (load-bearing: it catches host-gated bugs local gates cannot).

---

## Iteration 1 — Cycle 1 → v6.6.0 / v6.6.1

**Baseline:** v6.5.0. Parallel audit found defects across 4/5 dimensions.

**Audit → classified:**
- **P0** D1: `src/education.jsx` (Education tab) leaked ~25 REAL institutional identifiers (HMC Policy 35.12,
  VA Puget Sound, UW Neurology Residency, SCH/UWMC) into the **deployed bundle** — public-safety breach.
- **P0** A1: AF-anticoagulation-timing recommendation cited pre-OPTIMAS/CATALYST evidence (stale clinical guidance).
- **P0** A2: What's-New ATLAS appraisal **fabricated** "sICH 5.5% vs 2.7% significantly higher" (truth: 1.1%
  vs 1.0%, no difference) + CHOICE-2 "no mortality increase" (truth 12.1% vs 6.4%) — fabricated statistics.
- **P1** Dark mode: a second legacy `darkMode` theme system conflicted with v7 `theme.js`; users could enter a
  half-styled dark state on public. Dark-mode `color-contrast` = **1540 axe violations** across 13 routes.
- **P1** Light-mode `color-contrast` = 46 AA failures on the default surface.
- **P1** C1: SW precache (`./app.js`) didn't match `app.js?v=N` → offline shell break after version bump.
- **P2** D2 CHANCE-2 DOI 404; D3 generated note lacked a synthetic-demo self-label; B-series a11y
  (select labels, ⌘K/badge contrast, palette focus-restore, scroll-region focus).

**Improve (commits `16744e2`,`2bdf827`,`acf76bd`,`32ac35d`,`5ff8432`,`aa671a8`,`1747d5a`,…):**
- D1 scrubbed institution-neutral + **bundle-level CI guard** `tests/no-institutional-identifiers.test.js`
  (scans built `app.js` + `index.html`); A1 → OPTIMAS (PMID 39491870) + CATALYST IPDMA (PMID 40570866, OR
  0.70); A2 corrected at the briefing source + regenerated; C1 `ignoreSearch:true`.
- **Unified the dual theme systems** into ONE 3-way System/Light/Dark `theme.js` control (fresh public load
  still defaults light; explicit Dark/System now honored). Encounter section TOC + scrollspy.
- **Dark contrast 1540 → 0** (biggest lever: 5 non-remapping CSS-var aliases in `tokens.css`); **light 46 → 0**.

**Verify:** vitest 5688/5688 · lint:contrast 21/21 · lint:tokens clean · institutional grep 0.

**Live-verify finding → v6.6.1 (P0 regression caught only on live host):** a THIRD theme surface — the
inline pre-paint `<head>` script in `index.html` — force-removed `stroke.v7.theme` and pinned light on every
public load, so the new 3-way control's Dark reset on reload. Fixed to mirror `theme.js`. **Live production
verification:** fresh public no-pref → LIGHT ✓; explicit Dark + full reload → DARK persists ✓; dark
Protocols/ICH = 295 text nodes, 0 contrast failures ✓.

---

## Iteration 2 — Cycle 2 → v6.7.0

**Audit (5 parallel):** 4/5 not clean; **public-safety came back CLEAN** (first convergence signal).

**Audit → classified:**
- **P0** B1: **11 citations linked to the WRONG paper** (transposed PMIDs → e.g. a NASH or reteplase paper
  instead of TIMELESS/TRACE-III). Surfaced by hardening `validate:citations:ids` to title-cross-check all 66
  `citations.js` PMIDs (was: only the 24-row docs table) — the new guard immediately caught 9 beyond the first 2.
- **P0** B2: the What's-New generator copied a templated **positive** "Results." appraisal ("endpoint met,
  favoring intervention, p<0.05, no mortality increase") into 46/50 items — **false for negative trials**
  (ESCAPE-MeVO mortality↑, DISTAL/STEP-Mild/FOCUS neutral), self-contradicting each card's true bottom line.
- **P1** 9 wide data-tables not keyboard-scrollable (axe serious); duplicate `main` landmark (156 nodes/route);
  heading-order skips.
- **P1** Education search collapsed to a 54px box (md+); top-nav labels overprinted (640–1023px); Encounter
  form crushed to 298px (1024–1279px).
- **P1** Offline reload **dead-ended** on a looping "You're offline" card (SW served offline.html first); CLS = 1.0.

**Improve (`9d6fd28`,`119a79a`,`125246b`,`d6695a9`,`8a98f29`):** all 11 PMIDs PubMed-verified & corrected +
permanent CI guard; B2 fixed at the generator (durable vs weekly-regenerated briefing); 9 tables
`tabIndex=0`+role; one-line `role="main"` removal cleared 156 nodes/route; responsive fixes; SW serves cached
shell first (offline reload → full app, Playwright-verified); **CLS 1.0 → 0.0002** (static `#root`
min-height pre-paint — JS injection was too late; Lighthouse Perf ~76→~95); institutional.js gated off public
(0 console 404s).

**Verify + deploy:** all gates green; v6.7.0 live-verified (CLS 0, institutional.js not requested on public,
corrected PMIDs in bundle).

---

## Iteration 3 — Cycle 3 → v6.8.0

**Audit:** 2/5 CLEAN (perf/PWA + public-safety). Remaining findings all **state-gated** (only visible in open
menus / expanded `<details>` / populated Encounter).

- **P0** 6 **inline-citation footnote PMIDs** wrong (AcT/TRACE-2/ORIGINAL → liver/hip/bladder papers; a
  CLOSE↔REDUCE label swap; ACTION-CVT → a condensed-matter-physics paper) — an UNGUARDED evidence store the
  citations.js guard never saw.
- **P1** (critical) theme control was an illegal `role="radiogroup"` child of `role="menu"`
  (`aria-required-children`); inline citation links color-only at rest (WCAG 1.4.1).
- **P1** Sticky vitals strip overprinted the sticky header (768–1920px); sidebar "Institutional Protocols &
  Algorithms" label clipped.
- **P2** DAPT calculator asserted "DAPT not indicated" from EMPTY input.

**Improve (`7338f4b`,`b3c02f3`,`2e5730d`):** 6 PMIDs corrected + **inline-citation validator hardened** with a
content cross-check (closing that store); theme control → `role="menuitemradio"` in a `role="group"`; links
underlined at rest; sticky-strip offset; sidebar 2-line wrap (mandated name preserved); DAPT neutral prompt;
wash-mounted slate-500 captions → slate-600.

**Verify + deploy:** v6.8.0 live-verified (corrected inline PMIDs present, wrong ones gone, menuitemradio + DAPT prompt live).

---

## Iteration 4 — Cycle 4 → v6.8.1

**Audit:** 4/5 CLEAN (evidence, visual, perf/PWA, public-safety). One a11y finding that, fixed at the class
level, exposed a deep tail.

- **P1** M4-1: in **populated Encounter + dark**, the LKW treatment-window timer rendered white text on
  `--confirm` (a token lightened for dark *text* use) consumed as a solid *background* → 2.1–2.5:1 (WCAG 1.4.3).
- **P1 (class):** driving into **opened+populated calculator states** (which no route/tab scan reaches)
  surfaced **41 more AA contrast violations** — MAX DOSE pill (a `dark:bg-card/20` override that **silently
  didn't compile** — arbitrary opacity on a CSS-var alias), a Quick-Dosing drug-name dark-on-dark bug
  (`classes.split` dropped the `dark:` variant), 20 slate-500 calculator captions, white/70 radio labels.

**Improve (`09766b3`,`f417b30`):** class-level dark-chip fix (`dark:bg-{ok,warn,crit}-700`); **entire contrast
tail closed** — final axe `color-contrast` = 0 in every reachable state, both themes.

**Verify + deploy:** v6.8.1 live-verified.

---

## Iteration 5 — Cycle 5 → v6.8.2

**Audit:** 3/5 CLEAN (evidence rendered-surfaces, perf/PWA, public-safety). a11y + visual found items in the
under-covered **simulator files** + references/calculators deep states.

- **P1** PHQ-9 radios had no accessible name (36 nodes); 4 unlabeled `<select>`s; references View/Download
  buttons (`text-white`+`text-link-600` conflict → 2.79:1 dark); references Email button 3.55:1 light;
  Pupillometry button 3.74:1; **NeuroExams table** not keyboard-scrollable (missed instance in a separate sim
  file); 8 slate-500 captions.
- **P1 (class):** **wash-badge contrast class** — static enumeration across ALL files found **14 failing
  `bg-{crit,warn,ok,orange}-50/100/200`-wash + lightened-text badge pairs** collapsing to 1.25–2.44:1 in dark.
  Seed = a **safety-relevant** "Renal dose adjustment required" badge (1.72:1, only renders at low CrCl).
- **P2** EvdIcp "TRAGUS (forame…" SVG label clipped (loses the foramen-of-Monro zeroing reference).
- **P2 (hygiene)** 18 wrong-article PMIDs in **non-rendered** `calculators-extended.js`/`calculators.js`
  QA-scaffold `source:` strings (never reaches UI → not convergence-blocking, but corrected to close the
  wrong-PMID class entirely + remove a wire-up landmine).

**Improve (`232986e`,`c55ef42`,`2d097e3`,`cd60ff3`):** all simulator/references a11y fixes; wash-badge class
closed (`dark:bg-*-950` + theme-flipping `--tag-*` vars, measured 5.37–10.12:1); 18 PMIDs PubMed-verified.

**Verify + deploy:** v6.8.2 live-verified (renal dark-fix 147 nodes, corrected PMIDs in/wrong out).

---

## Iteration 6 — Cycle 6 → v6.8.3

**Audit:** 3/5 CLEAN. Audits showed strong **discrimination** (correctly rejected a by-design mobile-nav
`region`, a slider-race phantom, and a hover-only contrast as non-blockers).

- **P1** `landmark-unique`: 6 AIS-card scrollable-table regions shared one aria-label; references heading-order
  h1→h4/h2→h4 skips.
- **P1** M1: research provenance caveat badge `whitespace-nowrap` truncated mid-word AND distorted the study
  card (clipped title/summary) at 320/375/1024/1280.
- **P1** M2: EvdIcp TRAGUS label now **collided with the XDCR transducer box** at the level state — the
  Cycle-5 edge-clip fix traded a clip for an overlap.

**Improve (`4bbbe30`):** unique region labels; contiguous heading-order; caveat pill wraps (card intact,
screenshot-verified 6 widths); TRAGUS moved to its own row (screenshot-verified offset 0 + both extremes ×
320/1280 × light/dark = 12 cases).

**Verify + deploy:** v6.8.3 live-verified.

---

## Iteration 7 — Cycle 7 → v6.8.4

**Audit:** 3/5 CLEAN (evidence 6/6 fresh PubMed spot-checks; perf/PWA Perf 93/95 CLS 0; public-safety 6th
consecutive). 5 a11y/visual stragglers, two echoing prior lessons.

- **P1** F1: mobile bottom-nav `role=tablist` not in a landmark (desktop wraps it, mobile didn't — asymmetry);
  F2: unlabeled wake-up phone-path date/time inputs (missed `label` instances).
- **P1 (class):** V1+V3: COR/LOE legend tables + PHQ-9 table clipped on **all phone widths** — the same
  "missing `overflow-x-auto`" class as Cycle-2's app.jsx tables, but in **satellite files**
  (`pocket-cards.jsx`, `components.jsx`).
- **P1** V2: EvdIcp "mmHg error" label collided with TRAGUS at **negative** transducer offsets — the symmetric
  counterpart of the Cycle-6 M2 fix (which only verified offset-0 + positive extreme).

**Improve (`17e5b34`):** mobile-nav landmark; date/time labels; **wide-table class closed across ALL files**
(21 `<table>`s inventoried → 3 wrapped + 6 upgraded to the standard scroll+focus pattern, unique labels); V2
error annotation pulled out of the transducer translate-group, verified non-overlapping across the full
−15..+15 range. Full axe sweep (14 routes × 2 themes × 375/1280 + populated) = **0**.

**Verify + deploy:** v6.8.4 live-verified (F1/F2 present, institutional 0).

---

## Iteration 8 — Cycle 8 → v6.8.5

**Audit (parallel `stroke-convergence` workflow):** evidence **CLEAN** (validators 0/0 both
`--check-identifiers`, 6/6 fresh PubMed, fabrication guard intact), perf/PWA **CLEAN** (Perf 93/94, CLS 0,
deterministic byte-identical build, offline solid), public-safety **CLEAN** (7th consecutive). a11y + visual
returned **3 findings** (the audits again showed strong discrimination — rejected a gradient-bail phantom, a
non-reproducible transient LKW tint, a breakpoint-edge measurement artifact, and the by-design localhost-only
404).

- **P1 a11y** (`a11y-copybtn-contrast`, `src/app.jsx` btnColorMap): order-bundle "Quick Copy" buttons rendered
  white text on `bg-yellow-600` (2.93:1) and `bg-orange-600` (3.56:1) — axe-confirmed on 6 routes, both themes.
- **P2 a11y** (`a11y-pre-arialabel`, `src/app.jsx:27839`): `aria-label` on a role-less focusable `<pre>`
  note-preview (aria-prohibited-attr).
- **P1 visual** (`VIS-1`, `pocket-cards.jsx` + `institutional-protocols.js:58`): a 70-char descriptive COR
  value + `CorChip` `whitespace-nowrap` inflated a Protocols example card to ~919px → clipped right-66% on
  phones 320–414px, both themes.

**Improve (`b1aeb73` → v6.8.5):** buttons `-600`→`-700` (white on yellow-700 4.92 / orange-700 5.18, AA);
`<pre>` `role="region"`; relocated the COR rationale text into the `rationale` field (no clinical content
lost) + `CorChip` now wraps (`break-words max-w-full`, class-level so no future long value clips).

**Verify + deploy:** vitest 5688/5688 · lint:contrast 21/21 · lint:tokens · institutional 0/0; v6.8.5
**live-verified** (version coherent, all 3 fixes present in live bundle, old yellow-600 button gone,
institutional 0). 120 curated screenshots captured in parallel (`docs/perfection/screenshots/2026-05-30/`).

→ Cycle 8 produced findings, so it is **not** one of the two required clean cycles. All 3 are now resolved.

## Iteration 9+ — formal convergence certification (deferred)

The two-consecutive-clean stop criterion requires re-running two more *full* audit cycles against v6.8.5 with
both returning zero P0/P1/P2. This was **time-boxed out** of the session. **Status: all known findings
resolved; the live site (v6.8.5) carries zero known remaining safe/material/source-verifiable P0/P1/P2; the
formal "two consecutive clean" certification is the one outstanding step.** See `final-report-2026-05-30.md`
§"Honest convergence statement".

---

## Cross-cutting lessons (durable)
1. **Live-verify on the real host is load-bearing** — the v6.6.1 inline-script theme bug was `github.io`-gated
   and reload-only; no local gate could catch it.
2. **Closing a defect class = static enumeration across EVERY source file** — repeated stragglers (tables,
   wash-badges, slate-500 captions, labels) were missed instances living in satellite files
   (`components.jsx`, `pocket-cards.jsx`, `src/simulators/*`) that app.jsx-scoped sweeps never globbed.
3. **Verify the FULL parameter range of any moving element** — the EvdIcp SVG label needed offset 0 AND both
   extremes; sampled endpoints left the negative-offset collision (V2).
4. **Fix at the guard, not the instance** — hardening the citation validators turned "fix 2 wrong PMIDs" into
   "find and prevent all 11 + 18, now and in CI forever."
5. **Bootstrap dark mode correctly when auditing** — toggling `.dark` alone (without `data-theme="dark"`)
   produces partial-dark phantom contrast failures; the token ramps key on `[data-theme="dark"]`.
6. **Silently-dead overrides** (`dark:bg-card/20` — arbitrary opacity on a CSS-var alias emits nothing) leak
   the light value into dark unnoticed; only DOM-level rendered-contrast scanning catches them.
