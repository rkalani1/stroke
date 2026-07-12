# CHANGELOG

## v6.11.4 — 2026-07-12 — rename "Example Protocols" tab to "Protocols"

Renamed the top-level **"Example Protocols"** tab (and its command-palette
"Go to" entry) to **"Protocols"** at owner request. The "example / not local
policy" framing is preserved elsewhere — the palette keywords (`example`,
`not local policy`), the in-panel disclaimer ("Educational examples only — not
local policy…"), and the machine-readable data-route descriptor
(`Example protocols (not local policy)`) are unchanged, so the tab is not
reframed as vetted institutional policy. Label-only change: the frozen
protocols content is untouched, so the Example Protocols snapshot lock stays
green (the tab label lives in the tablist, outside `#tabpanel-protocols`).
Rebuilt `app.js`; updated the public-demo label guard test. Version bumped
6.11.3 → 6.11.4 to bust HTTP/SW caches so the relabel reaches returning
clients. Gates: leak-guard 0 · unit tests · protocol snapshot lock · build.

## v6.11.3 — 2026-07-11 — clinical corrections + context switch + unified search

Completes the refactor: applies the audit-flagged clinical corrections, ships
the Telestroke/Inpatient/Clinic context switch, and expands the calculator
registry. Version bumped 6.11.2 → 6.11.3 for cache-bust. Example Protocols
wording unchanged (snapshot lock green).

- **Clinical corrections** (6 factual errors, each verified against the
  authoritative source already in the repo; none in the frozen protocols zone;
  locked by `tests/clinical-corrections.test.js`):
  - THALES DAPT duration no longer mislabelled as 90 days (it is 30).
  - ICH Score 4 mortality 94% → 97% (Hemphill) in the education card.
  - HINTS peripheral/central pattern corrected in the cranial-nerve card.
  - TREAT-CAD: removed the overstated "aspirin non-inferior" claim (it was not).
  - Mannitol osmolar-gap hold threshold 55 → 20.
  - AF-timing pearl aligned to the canonical ELAN/OPTIMAS/CATALYST model.
  - (CVT seizure prophylaxis reviewed — guideline-consistent, no change.)
- **Context switch:** header control (All / Telestroke / Inpatient / Clinic)
  that filters/reorders content surfaces; the education gallery filters by
  context (hides nothing by default). Never scopes global search.
- **Unified search:** the command palette now indexes all five `/content` data
  sources (guidelines, trials, education, calculators, references).
- **Calculator registry** expanded to 34 catalogued calculators (each with a
  verified compute export); palette + agent index derive from it.
- **Bugfix:** repaired a latent ReferenceError (undefined `saveToStorage`) that
  blocked the AI-provider settings save.
- Gates: leak-guard 0 · 849 unit tests · protocol snapshot lock · content
  schema/link/currency validators · browser-verified (context switch + search).

## v6.11.2 — 2026-07-11 — content data layer + Example Protocols content lock

Maintainability refactor. **No user-facing behavior change** — the rendered app
is identical (Example Protocols wording is byte-locked; all tabs verified
rendering with zero console errors). Version bumped 6.11.1 → 6.11.2 for
cache-bust of the rebuilt bundle.

- **Example Protocols content lock:** `scripts/snapshot-example-protocols.mjs`
  renders the built app and diffs every `#/protocols/*` subtab's visible text +
  drug-modal content against committed baselines. Wired into CI + `npm test`;
  frozen clinical wording can no longer drift silently.
- **`/content` data layer:** typed, schema-validated clinical data
  (guidelines, trials, education, calculators, references) with build-time
  validation that fails on malformed entries, unresolved citations, or stale
  review dates. Single calculator registry (the agent-asset generator now
  derives from it — `data/calculators-index.json` byte-identical). Single
  citations module enforced. Excluded from the Pages serve (`_config.yml`).
- **Update pipeline:** `check-currency.mjs`, PDF/PMID `scaffold-content.mjs`
  (drafts only, never auto-publishes), `CONTRIBUTING-content.md`, per-entry
  provenance + content CHANGELOG.
- **De-dup:** removed dead inline `calculate4FPCC` (duplicated
  `calculators.js` `calculatePCCDose`, zero call sites) — the only `app.js`
  change, hence the cache-bust.
- **Docs:** `REFACTOR_MAP.md` (full audit), `REMAINING-WORK.md` (sequenced,
  snapshot-gated plan for the remaining render integration + a clinical-review
  queue held for clinician sign-off).
- Gates: leak-guard 0 · 828 unit tests · protocol snapshot lock · content
  schema/link/currency validators · browser-verified render.

## v6.11.1 — 2026-07-06 — restore encounter documentation templates

Restored the risk-benefit discussion and post-reperfusion management note
templates to the encounter tab as an always-visible, copy-pasteable
"Documentation templates" section (they had become reachable only deep in the
gated telestroke flow). Four copy-into-EMR templates, each with a Copy button:
- Thrombolysis (IV TNK/tPA) risk-benefit discussion documentation
- Endovascular therapy (mechanical thrombectomy) risk-benefit discussion documentation
- Post-TNK/tPA management note (ICU, neuro-check cadence, BP <180/105 ×24h, imaging, workup)
- Post-EVT (thrombectomy) management note — restored counterpart (Neuro ICU, post-EVT
  BP 140-180 ×72h with avoid-SBP<140 harm caveat, access-site monitoring, 24h CT/DECT)

All templates are institution-neutral, public-safe educational examples labeled
"not local policy — verify against approved local protocol." No institutional
identifiers, contacts, or PHI. Version bumped 6.11.0 → 6.11.1 for cache-bust.
Gates: leak-guard 0 · protocol + unit tests pass · build · browser-verified render
+ working Copy buttons.

## v6.11.0 — 2026-07-06 — evidence refresh (2026-07-06)

Evidence Atlas / Guidelines refresh, every claim verified live against PubMed
on 2026-07-06 (access date recorded per record):
- Added 6 PubMed-verified completed trials (`src/evidence/completedTrials.js`
  + `citations.js`, all `verified-pubmed`): BRIDGE-TNK (NEJM 2025, PMID
  40396577), HOPE (JAMA 2025, PMID 40773205), EXPECTS (NEJM 2025, PMID
  40174223), MIND (JAMA Neurol 2025, PMID 40892424 — a NEGATIVE trial),
  CHABLIS-T II (Stroke 2025, PMID 39744861), TEMPO-2 (Lancet 2024, PMID
  38768626). Two source-doc DOI errors corrected against PubMed (TEMPO-2,
  ROSE-TNK). Atlas: 58→64 completed, 70→76 citations.
- Extended-window alteplase framed as emerging (not routine to 24h); MIND kept
  as a negative trial (no MIS superiority).
- Thrombolysis-angioedema H2 note made formulary-neutral (removed ranitidine
  token; famotidine retained).
- `src/institutional-protocols.js` audit header refreshed to 2026-07-06
  (re-verified vs June-2026 sources + AHA/ASA 2026 AIS guideline PMID 41582814;
  no clinical change).
- +3 protocol-currency regression guards (evidence-refresh presence + PMIDs/
  DOIs, corrected TEMPO-2 DOI, TNK 0.25 mg/kg max 25 with 0.4 mg/kg prohibition).

Version bumped 6.10.1 → 6.11.0 to bust HTTP/SW caches so the new bundle
propagates immediately. Public-safe: no institutional identifiers added;
leak-guard 0. Gates: all evidence/citation validators + unit/protocol tests +
build pass; browser QA (desktop + mobile) clean.

## v6.10.1 — 2026-07-04 — UI declutter

Owner-directed removal of low-value surfaces (no clinical-content changes):
- Public-demo consent modal + standing PHI banner (no-PHI posture kept in
  metadata/policy: index.html meta, `data/*.json`, COMPLIANCE.md).
- Encounter-summary "Readiness" rail block and its inline Missing-Fields twin
  (Incomplete / Safety-critical chips).
- "not saved yet" auto-save subtitle by the logo.
- Redundant header "Search" button (search bar retained; ⌘K / "/" still open
  the command palette).
- Shortened the Protocols tab label to "Example Protocols" (dropped the
  "(Not Local Policy)" parenthetical; retained as a palette keyword and in the
  machine-readable data route).

Version bumped 6.10.0 → 6.10.1 to bust HTTP/SW caches so the change propagates
immediately. Gates: leak-guard 0 · 683 unit tests · qa-smoke 4/0 · browser QA.

## v6.10.0 — 2026-07-03 — privacy/identity hardening + polish

### Privacy & identity
- All public safety copy is now **institution-neutral**: "not an approved
  clinical tool" replaces every named-institution approval disclaimer across
  the app banner/modal, `index.html` metadata + JSON-LD, `manifest.json`,
  the `data/*.json` `_meta.disclaimer`, `llms.txt` / `llms-full.txt`, the MCP
  server, and `COMPLIANCE.md` (clinical-use gate genericized).
- Leak guard gained a third tier — `identityTokens` (maintainer name,
  personal email, institutional domains) scanned in **every** tracked file
  with no exemptions; the docs/ exemption for institution names was removed
  (Pages serves the repo root, so docs/ is public surface); the negative
  institutional-disclaimer allowance was deleted so named-institution copy
  cannot return. Bundle guard tests hardened to match.
- Author metadata stripped from four served reference PDFs.
- Dev debris removed from the public surface: `scratch/`, `docs/superpowers/`,
  sprint/status/resume notes, debug HTML, one-off scripts, orphaned images,
  and an internal consolidation inventory.

### UX / accessibility
- Unknown deep links now show a "Link not recognized" notice instead of
  silently landing on Encounter.
- Guideline Library empty state gained a "Clear filters" action (matches the
  Evidence Atlas pattern).
- ASTRAL/PLAN sliders have accessible labels; error diagnostics now report
  storage availability; ward-census demo copy clarified; bottom nav respects
  side safe-area insets on notched phones.

### Performance
- All 15 fonts converted TTF → WOFF2 (1,175 KB → 441 KB, −62%); font
  preloads added for the two above-the-fold faces; service-worker precache
  updated.
- Broken antiseizure-pathway image reference removed (production 404);
  education figures now lazy-load.

## v6.0.0 — 2026-05-23 — v7 visual overhaul

**Major bump.** The visual surface is breaking even though APIs are not. The
product is more legible, faster to act in, and finally seamless across the
iframe boundary that has read as a defect since v5.

### Visual overhaul

- **Single accent (cobalt) + four locked semantic ramps** (crit / warn / ok / info).
  Section headers no longer carry their own colors.
- **New type ramp** — Manrope / Newsreader / JetBrains Mono trio preserved,
  but `text-2xs / xs / sm / base / md / lg / xl / 2xl / 3xl / display` replace
  the v5 ad-hoc sizes. Tabular-nums + slashed-zero on every clinical numeric.
- **DeviceFrame** around both Trials iframes — light shows the seam
  deliberately (2px slate-200 border); dark removes the seam entirely
  (1px slate-800 hairline, parent canvas matches child).
- **HeroReadout** — LKW elapsed timer + IV TNK + EVT windows in mono-tabular
  text-3xl on mobile. Three urgency states drive the supporting line only;
  the digits stay slate-900 so read-aloud contrast never degrades.
- **PatientStripMobile** — Age / Sex / LKW / Elapsed / NIHSS / ASPECTS /
  Anticoag. Sticky at top, scrolls under chrome on mobile. PatientStripRail
  (320px right rail at lg+) primitive available; layout wiring follow-on.
- **DrugChip** — primitive available; Management wiring is a follow-on PR.
- **Cards** — no resting shadow, 1px slate-200 borders, 12px radius. Critical
  cards get a 3px left rule + crit-50 fill (never just fill).
- **Buttons** — 5 variants × 3 sizes (sm/md/lg = 32/40/48), 8px radius,
  `:active scale(0.97)` 120ms tap feedback gated by reduced-motion.

### IA changes (shipped this PR)

- "Wake-up Stroke / Unknown LKW" is now a `<SegmentedControl>`, not a checkbox
  (both Phone Consult and Video Telestroke instances).
- "Copy handoff" is now the v7 cobalt primary button (single-accent rule).
- New v7 mobile floating action bar at the bottom of the Encounter view —
  thumb-zone duplicates of Copy Note + Copy Handoff so the clinician never
  has to reach the top-right one-handed.
- Trials sub-tabs (Bedside Screener / Eligibility Tables) restyled with v7
  SubTabs (single-accent cobalt) — no more emerald/amber pill colors.
- Management sub-tabs (ICH / Ischemic / SAH / TIA / CVT / Calculators /
  References) restyled with v7 SubTabs cobalt-active.

### IA changes (deferred to follow-on PR — flagged in risk register)

- Encounter section reorder to canonical 11-step order.
- Completion (Incomplete + Safety-critical) chip-link promotion into
  PatientStrip.
- Dark Handoff Summary card → Card variant=default (current state is
  already bg-white; only the now-replaced copy button was dark).
- ICH protocol prose → numbered-step glance cards.
- Drug name → DrugChip wrapping in Management.

### Accessibility

- WCAG 2.2 AA across the board; AAA for body text on default surfaces (≥7:1).
- `lint:contrast` script validates 21 text/bg pairs in both themes — all
  pass at body ≥7.0, head ≥4.5, ring ≥3.0.
- `lint:touch-targets` infrastructure ready (needs running dev server);
  defensive CSS rule enforces min-height:44px on all interactive elements
  at <md (WCAG 2.5.5).
- Skip-link jumps to `<main id="main">`, not a `<div>`.
- HeroReadout uses `aria-live="polite"` and announces threshold crossings
  only (4.5h / 6h / 24h), never per-tick.
- `prefers-reduced-motion: reduce` zeroes all motion via `--motion-scale`.
- Every icon-only Button has `aria-label` (`lint:tokens` AST check).
- Color is never the only signal — every status uses color + icon/text.

### Performance

- Existing font-display: swap + non-blocking Google-Fonts CSS preload retained.
- `loading="lazy"` on Trials iframes (DeviceFrame).
- Theme controller dynamic-imported so cold-load critical path isn't blocked.
- SW controller dynamic-imported via useEffect.

### Dark mode

- `data-theme="dark"` on `<html>` from `src/design/theme.js`. Detects
  `prefers-color-scheme: dark` for 'auto'. Persists override in
  `localStorage['stroke.v7.theme']`.
- One-shot migration carries forward the v5 `darkMode` boolean.
- Theme toggle UI in ⋯ menu and ⌘K palette: deferred to follow-on PR.

### Service worker (opt-in, mid-consult-safe)

- Cache name bumped to `stroke-cache-v6-0-0`.
- On install: `self.skipWaiting()` so the new SW reaches 'waiting' immediately.
- On activate: SW broadcasts `{type:'sw-update-ready', version:'6.0.0'}` to
  controlled clients — does **not** call `clients.claim()` immediately.
- The app shows a non-blocking sticky toast: "New version 6.0.0 ready —
  tap when you're between consults."
- Mid-consult clinicians are never auto-interrupted.

### Breaking changes (internal — downstream forks beware)

- `theme.extend.colors` now reads from CSS variables in `src/design/tokens.css`.
  Forks that override `theme.extend.colors` need to either use the new tokens
  or restore their fork-specific values inside the extend block.
- The v6 alias names (`ink`, `ink-2`, `mute`, `line`, `paper`, `paper-2`,
  `card`, `critical`, `confirm`, `caution`, `reference`, `accent`, etc.)
  continue to resolve, now pointed at the v7 token values. No source rename.
- v7 codemod (`scripts/codemod-v7.mjs`) is the canonical one-shot migration
  for `src/app.jsx`. Re-running is idempotent.

### Lints introduced

- `npm run lint:tokens` — rejects forbidden accent classes, raw semantic
  hues, placeholder slate-400, font-serif on non-h1/h2/h3, and icon-only
  Buttons without aria-label.
- `node scripts/lint-touch-targets.mjs` — Playwright tap-target lint.
- `node scripts/lint-contrast.mjs` — locked text/bg contrast-pair lint;
  21 pairs verified in light + dark.

---

## v5.37.0 — 2026-05-23 — Retire native Active Trials sub-view; Screener becomes canonical

Trial database consolidation. The native Active Trials sub-view in the Trials
tab is removed in favor of the iframed Bedside Screener (which has its own
internal trial database + live eligibility) as the single source of truth for
recruiting trials. Eliminates the maintenance burden and clinical-safety drift
risk of keeping two parallel trial datasets in sync.

### Trials tab sub-views (was 3, now 2)
- **Bedside Screener** (default) — iframes the live screener with patient
  context. Now the only patient-matching surface and the only trial-database
  browser in this app.
- **Eligibility Tables** — unchanged; still the printable/copy-paste reference.

### Removed
- Active Trials sub-view button and its content block (diagnosis banner,
  category filter pills, trial cards, recruiting-only toggle). ~225 lines.
- The `trialsView === 'active'` storage value is migrated to 'screener'
  automatically on load.

### Behavior changes
- `navigateToTrial()` and `navigateToTrialCard()` (called from the encounter
  view's evidence-atlas trial-match panel) now redirect to Trials → Screener
  with encounter context flowing in via URL hash, instead of scrolling to a
  trial card that no longer exists.
- Default landing sub-view changed from Active Trials to Bedside Screener.

### Why
The Screener already has a built-in "Database" tab that browses every active
trial — same dataset it uses for eligibility evaluation. Keeping a parallel
200+-trial database in the parent app meant two sources of truth that could
drift, with the risk that a user would see different eligibility verdicts
depending on which Trials tab sub-view they happened to be on. Single source
of truth eliminates that class of bug entirely.

## v5.36.0 — 2026-05-23 — Integrate Bedside Trial Screener + Eligibility Tables

Surfaces two existing reference apps as first-class sub-views inside the
decision-support PWA, eliminating the workflow break of leaving the encounter
to look up trial criteria.

### Trials tab — two new sub-views
- **Bedside Screener** (emerald) — iframes `example.github.io/stroke-trials-screener`,
  the live ED-flowsheet eligibility tool. Patient context (kind / age / NIHSS /
  ASPECTS / pre-mRS) is passed via URL hash from the encounter form so the
  screener pre-populates and renders its eligibility verdict with zero re-entry.
- **Eligibility Tables** (amber) — iframes `example.github.io/stroke-eligibility-tables-embed`,
  the public-reference reference tables for ischemic stroke and ICH pathways.
- Existing Active Trials sub-view is now the first of three pills and remains
  the default landing view. Selection persists in `localStorage:trialsView`.

### Encounter view — quick-access launcher card
- New "Active stroke trials" card (placed at the bottom of the encounter
  stack) with two CTAs that jump to the Trials tab and switch to the right
  sub-view, with patient context flowing automatically.

### Iframe ergonomics
- Each iframe lives inside a `bg-card border border-line rounded-md` container
  matching the v6.0 design tokens.
- aria-live loading skeleton while the iframe is fetching.
- "Open in new tab" external-link escape hatch on every iframe card.
- `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"` —
  embedded PWAs run as designed; no cross-origin risk surface added.

### Companion change — `example/stroke-trials-screener`
- Backwards-compatible URL-hash auto-populate added. Hash format:
  `#kind=ischemic_stroke&age=72&nihss=12&aspects=8&pre_mrs=1&onset_val=2&onset_unit=hours`.
- `hashchange` listener so the parent app can update without reloading the iframe.
- Empty hash → screener behaves identically to standalone deployment.

## v5.35.0 — 2026-05-09 — Optimization pass: deferred-fixes cleanup + analyst harness + perf

Comprehensive cleanup of every deferred item across rounds 1-3. Lands the
analyst-facing parameter-sweep harness, tightens citation framing, expands
DEID, and ships Lighthouse-Performance hooks.

### Topic taxonomy cleanup
- Trimmed 3 placeholder leaf topics that had no atlas entries and no parent
  role (`ivt-on-doac`, `cadasil`, `imaging-selection`). Disease-area parents
  (sah, cvt, pfo-closure, carotid-revasc) and `special-populations` (used by
  maternal-stroke guideline) preserved. Topic count: 31 → 28.

### CATALYST framing
- Single canonical citation across the repo: Werring et al., Lancet Neurol
  2025, doi 10.1016/S1474-4422(25)00057-5; n=5441 IPDMA pooling ELAN /
  OPTIMAS / TIMING / START. Previously framed inconsistently as "CATALYST
  meta-analysis (Lancet 2024)" / "consensus protocol" / "institutional
  shorthand". The legacy NIHSS-stratified institutional heuristic is now
  explicitly distinct from the formal IPDMA in calculators.js,
  components.jsx, and teaching.js. New `expert-consensus` protocol ID
  exposed in DOAC_PROTOCOLS alongside legacy `catalyst` alias for
  backwards-compatible localStorage values.

### Parameter-sweep analyst harness
- New `scripts/parameter-sweep.mjs` with 9 sweep domains (TNK dose,
  alteplase dose, CrCl, DAWN tier matrix, DEFUSE-3 mismatch matrix,
  large-core-EVT trial-branch sweep, DAPT branch matrix, late-window
  TRACE-III lytic sweep, PHASES per-score, ROPE × age). Emits one CSV per
  domain (or all). Wired into npm scripts: `analyze:sweep`,
  `analyze:sweep:tnk`, `analyze:sweep:large-core`, `analyze:sweep:dapt`,
  `analyze:sweep:dawn`. Useful for retrospective audits, registry
  comparisons, and grant-application figures.

### DEID extension
- New street-address heuristic: digit + word + (St/Ave/Rd/Blvd/Ln/Dr/Ct/
  Way/Pl). High-precision form to avoid false positives on numeric
  measurements.

### CHA₂DS₂-VASc / VA naming clarity
- Header comment in calculators.js explicitly distinguishes the legacy
  CHA₂DS₂-VASc (Lip 2010, max 9, sex contributes) from the 2024 ESC
  CHA₂DS₂-VA update (drops sex, max 8). Both functions remain exported.

### ABCD² speech-vs-weakness UX
- New `calculateABCD2WithDetail()` returns a structured breakdown with a
  `mutuallyExclusiveNote` field that fires when the user has both
  weakness and speech-disturbance checked, explaining why the score
  doesn't double-count.

### Lighthouse Performance
- Google-Fonts CSS now loaded non-blocking (rel=preload + onload swap to
  rel=stylesheet) with `<noscript>` fallback. Frees the critical-rendering
  path so the app shell paints before remote font CSS arrives.
- Brotli/gzip pre-compression confirmed for app.js (2.5 MB → 446 KB br,
  82 % reduction), tailwind.css, index.html, manifest.json, service-worker.

### Tests
- 511/511 passing. All 6 validators pass.

Version 5.34.0 → 5.35.0.

## v5.34.0 — 2026-05-09 — QA round-3 fixes (null-safety, DEID, UI/logic gaps)

Third-pass deep audit (see `docs/qa-comprehensive-2026-05-09-round3.md`).
No patient-safety-critical defects; 7 fixes addressing defensive-programming
holes, PHI-detection gaps, and UI-vs-logic mismatches.

### Defensive programming (high-severity)
- **11 calculator functions** crashed on `null` / `undefined` input — would
  blow up any caller that passed a cleared form-state object. Added
  `if (!items) return 0/null` guards to:
  `calculateNIHSS`, `calculateGCS`, `calculateICHScore`,
  `calculateABCD2Score`, `calculateCHADS2VascScore`, `calculateROPEScore`,
  `calculateHASBLEDScore`, `calculateRCVS2Score`, `calculatePHASESScore`,
  `calculateICHVolume`, `calculatePCAspects`. 12 regression tests added.

### PHI / de-identification (medium-severity)
- **`DEID_PATTERNS` extended** with 3 new categories per HIPAA Safe Harbor:
  - SSN format `XXX-XX-XXXX`
  - ISO date format `YYYY-MM-DD` (the existing US-format regex `MM/DD/YYYY`
    did NOT catch ISO dates — major gap given that ISO is the JS default
    `toISOString()` output)
  - ZIP+4 format `XXXXX-XXXX`

### UI / logic mismatch (medium-severity)
- **DOAC-IVT site option `'telestroke'`** existed in the pocket-card UI
  (`pocket-cards.jsx:160`) but `evaluateDOAC_IVT()` had no branch for it —
  selecting "Telestroke spoke site" silently fell through to the default
  "Select site pattern" message. Now treated as a synonym of `'spoke'`
  (same time-based DOAC-clearance pathway).
- **DAPT calculator UI** was missing two fields the underlying function
  accepts: `timeFromOnsetH` (default 24, but INSPIRES requires up to 72)
  and `lvdSymptomatic` (INSPIRES atherosclerotic-LVD branch). Without
  these fields the INSPIRES Class-1 branch was unreachable from the
  calculator UI for late presenters.

### Test pass
- **511/511 passing** (was 507). All 6 validators pass.

Version 5.33.0 → 5.34.0.

## v5.33.0 — 2026-05-09 — QA round-2 deep audit fixes

Second-pass comprehensive audit (see `docs/qa-comprehensive-2026-05-09-round2.md`).
No patient-safety-critical defects; 9 fixes spanning calculator correctness,
atlas accuracy, dead-code removal, PWA bundle hygiene, and version-string
consistency.

### Calculator correctness (high-severity)
- **`interpretMRS9Q`** — fixed mRS 3 vs mRS 4 boundary. Patients with
  `q5WalkingUnaided === false` (cannot walk without aid) were silently
  classified as mRS 3 with the description "able to walk unassisted" —
  internal contradiction. Now correctly maps to mRS 4 per published mRS scale
  (van Swieten 1988). Added `q4Walking === false` handling. 8 unit tests added.

### Calculator robustness (medium-severity)
- **`dmvoEVTAdvisory`** — accepted only `'M2-DIST'` substring for distal-M2.
  Now normalizes whitespace/underscores to hyphens and accepts
  `M2-DISTAL`, `M2D`, `DISTAL-M2` synonyms. 5 new probe tests.

### Atlas accuracy (medium-severity)
- **TRACE-2** nihssRange `'NIHSS not >25'` → `'NIHSS ≤25'`.
- **EXTEND** ageRange `'≥18'` → `'18-80'` (matches Ma NEJM 2019).
- **TIMELESS** age/NIHSS `'≥18 / ≥5'` → `'18-85 / 5-25'`.
- **TRACE-III** age/NIHSS `'≥18 / ≥6'` → `'18-80 / 6-25'`.
- **ENCHANTED2/MT** topic `'evt-late-window'` → new dedicated `'bp-post-evt'`
  topic; `cl-bp-post-evt-conventional` claim retopiced. Topic count: 30 → 31.

### Note generators (medium-severity)
- **Progress note** used raw ISO `lkwDate` instead of `formatDate()`.
- **Signout note** dropped LKW date entirely — clinically misleading. Both
  fixed.

### PWA hygiene (low-severity)
- **Service worker** `CDN_ASSETS` no longer precaches `react@18`,
  `react-dom@18`, `lucide@0.563.0` (all bundled into `app.js`). 4 dead
  HTTP roundtrips on first install eliminated; only `legacy document-export library` (genuinely
  lazy-loaded) remains.

### Version consistency (low-severity)
- **index.html** inline IIFE bootstrap script kept its own `APP_VERSION`
  constant at `v5.31.0` while every other version reference had been bumped
  to v5.32.0. Now reconciled to v5.33.0.
- **README** matcher-exclusion count corrected (16 → 15).

### Test coverage
- 21 new probes added to `tests/qa-probes.test.js` for previously-uncovered
  functions (`interpretMRS9Q`, `dmvoEVTAdvisory`,
  `adjunctiveAntithromboticAdvisory`, `bpTargetPostStroke`,
  `lipidsTargetPostStroke`, `icadMedicalRegimen`).

### Tests
- **507/507 passing** (was 486). All 6 validators pass.

Version 5.32.0 → 5.33.0.

## v5.32.0 — 2026-05-09 — QA audit fixes (citation chain, calculator accuracy, matcher fidelity)

Comprehensive QA audit (see `docs/qa-comprehensive-2026-05-09.md`) identified
no patient-safety-critical defects but flagged citation-accuracy bugs, one
broken evidence chain, and several places where the underlying evidence was
approximated rather than reproduced exactly. This release lands every
high-severity fix and most medium-severity fixes.

### Citation accuracy (high-severity)
- **TRACE-III** PMID corrected from `38884324` (wrong; collided with another
  June-2024 NEJM paper) → `38884332` (per validated atlas
  `cit-trace-iii-2024`). Fixed in `src/calculators-extended.js`.
- **MOST trial** inline PMID `38884324 alt` removed (duplicate of TRACE-III's
  PMID); full citation (Lyden NEJM 2024;391:1257-68) retained with a
  `PMID pending verification` comment. Same treatment for **TESLA**
  (Yoo JAMA 2024;331:1709-19) and **ARCADIA** (Kamel JAMA 2024;331:573-81),
  which had been sharing PMID `38319331`.
- **ELAN** PMID reconciled to `37222476` repo-wide (was `37231621` in
  `src/calculators.js`); the validated atlas + evidence-review markdown
  + iteration-log + app.jsx all use `37222476`.

### Evidence chain (high-severity)
- **`rec-ich-anticoag-reversal-warfarin`** (Class I) was incorrectly linked
  to `cl-ich-bp-bundle` (the INTERACT3 BP-bundle claim). Added new claim
  **`cl-ich-warfarin-reversal-pcc-vk`** citing AHA/ASA 2022 ICH guideline
  + Steiner INCH Lancet Neurol 2016, and rewired the recommendation to it.
  The "Why this recommendation?" drawer now lands on warfarin-reversal
  evidence, not BP-bundle evidence.
- New **topic-coherence check** in `validateRecommendation` (in
  `src/evidence/schema.js`): warns when a recommendation's topic does not
  share a root with each supportingClaim's topic. Catches future
  H3-style mis-linkages.

### Calculator accuracy (medium-severity)
- **PHASES 5-year rupture risk** now uses the published per-score table
  (Greving Lancet Neurol 2014 Table 3): score 4 → 0.9% (was 0.7%),
  score 7 → 2.4%, score 9 → 4.3%, score 11 → 7.2%, ≥12 → 17.8%. Bucket
  labels (Very low / Low / … / High) preserved as a separate field.
- **RCVS²** no longer clamps to 0 — published range is −2 to +10.
  Negative scores (carotid involvement = −2) are now preserved, restoring
  diagnostic discrimination at the low end.
- **ABC/2 ICH volume**: new `unitWarning` field surfaces when any
  dimension > 15 cm or computed volume > 500 mL — guards against the
  common mm-vs-cm typo that silently 1000×'s the estimate.
- **Large-core EVT** (`evaluateLargeCoreEVT`): when a SELECT-2 match fires
  with core > 100 mL, the eligible-branch `rationale` now includes the
  "above trial-supported range" warning and a new `beyondTrialRange`
  boolean. Previously the warning only printed in the not-eligible branch.

### Matcher fidelity (medium-severity)
- **SISTER** trial's matcher now honors the trial's published NIHSS
  inclusion: NIHSS ≥ 6 OR NIHSS 4-5 with disabling deficit. New derived
  matcher field `nihssDisabling` (in `src/evidence/matcher-engine.js`)
  reads `disablingDeficit` from the encounter envelope. Previously the
  matcher hard-gated NIHSS ≥ 6, locking out NIHSS-4-disabling patients.

### New tooling
- `scripts/validate-inline-citations.mjs` — sweeps `src/`, `scripts/`,
  `docs/`, `tests/` for inline `PMID NNNNN` references and warns when the
  same PMID is paired with disjoint trial-target acronyms in tight binding
  (within ~50 chars). This is the structural complement to
  `validate-citations.mjs` (which only inspects the markdown table).
  Exit-1 on malformed PMIDs; warnings on suspected duplicates;
  `--strict` flag escalates warnings to errors. Wired into `npm test`
  and `npm run qa`.

### Tests
- 486/486 passing. Pre-existing tests that documented the now-fixed bugs
  (RCVS² clamp, PHASES bucketed risk) updated to reflect corrected
  behavior. The 55-probe `tests/qa-probes.test.js` from the audit remains
  in place as a permanent regression suite.

Version 5.31.0 → 5.32.0.

## v5.31.0 — 2026-05-09 — Visual refresh (modern medical-SaaS aesthetic)

Visual-only redesign — no behavior, content, calculator math, evidence data,
routing, PWA mechanics, storage layer, or disclaimer language was touched.

- **Token system** — `index.html` `:root` and `html.dark` blocks rewritten around
  a confident blue/teal accent (`--accent: #0a6cff`, `--accent-2: #0aa6c0`),
  layered surfaces (`--surface`, `--surface-2`, `--surface-3`), refined
  elevations (`--card-shadow`, `--shadow-pop`), and a 14 px / 20 px radius
  rhythm. Existing `--text-strong` / `--text-muted` aliases preserved so legacy
  selectors continue to resolve.
- **Tailwind theme** (`tailwind.config.js`) — additive `accent`, `accent-2`,
  `accent-soft`, `accent-ink`, `surface`, `surface-2`, `surface-3` color tokens
  + `shadow-card` / `shadow-pop`. Existing v6 ink/paper/critical tokens
  untouched; existing slate/blue utilities continue to work and pick up the
  new dark-mode surface re-points.
- **Shell / header / nav / tool-card / tab-pill** — restyled in the
  `index.html` `<style>` block: glassy header with `backdrop-filter: blur`,
  20 px shell radius, accent → teal active-tab gradient, soft accent hover
  state, modernised card shadow + lift on hover (gated by
  `prefers-reduced-motion: no-preference`).
- **Focus ring** — switched from hard-coded `#3B82F6` to `var(--accent)` so
  the focus indicator follows the theme.
- **Dark-mode `bg-white` / `bg-slate-50` overrides** — re-pointed to the new
  `--surface` / `--surface-2` tokens for cleaner layered surfaces.

Version 5.30.0 → 5.31.0. Tests: 430/430 passing.

## v5.29.0 — 2026-04-25 — v6.0-08 Anchored Management chips

Closes the v6.0 milestone.

- **Snap-scroll to named protocol** — every Management sub-tab pill (ICH, Ischemic, SAH, TIA, CVT, Clinic, Wards, Calculators, Pocket Cards, Teaching, References) now triggers `scrollIntoView({ behavior: 'smooth', block: 'start' })` on its corresponding `mgmt-tabpanel-${id}` after the React render commits (`requestAnimationFrame`). Both pointer clicks and keyboard ←/→/Home/End navigation scroll-anchor.
- **Sticky breadcrumb** — `Management › <active sub-tab>` rendered as mono uppercase eyebrow on `bg-paper-2`, pinned at `top-0 z-40`. Sub-tab pill row stacks underneath at `top-9 z-30`, so the breadcrumb is always visible while protocol content scrolls.
- **Hash routing** is unchanged (the existing `buildHashRoute(activeTab, managementSubTab)` already updated the URL on sub-tab change), so browser back/forward continues to restore the right protocol; the new auto-scroll fires on the resulting state change too.

Cache v92 → v93. Version 5.28.0 → 5.29.0. Tests: 427/427 passing.

## v5.28.0 — 2026-04-25 — v6.0-07 Auto-save indicator

- **`<SavedAgo>`** — new lightweight component in `src/components.jsx`. Reads `localStorage[<prefix>:lastUpdated]` (already written by app.jsx on every appData mutation) and ticks every 5 s. Renders as mono tabular caption: "saved just now" → "saved 6s ago" → "saved 4m ago" → "saved 1h ago".
- Mounted in the encounter shell header next to the "Stroke" wordmark, only when `activeTab === 'encounter'`. No toasts.
- Existing `AutoSaveIndicator` (which depends on a `createAutoSaver` instance, used by patient store) restyled to mono tabular text-mute + `bg-confirm` dot for visual continuity with the new system.

Cache v91 → v92. Version 5.27.0 → 5.28.0. Tests: 427/427 passing.

## v5.27.0 — 2026-04-25 — v6.0-06 Type pass

Type-system rules baked into `src/styles.css` `@layer base` so they apply to all current and future surfaces without per-element opt-in.

- **`text-wrap: balance`** on every heading (`h1`–`h6`). Prevents widow words ("orphan") on the last line, especially noticeable on serif section titles. Graceful fallback in browsers without support.
- **`text-wrap: pretty`** on every `p`. Improves multi-line paragraph rake.
- **`.data-context strong, strong.data`** — `<strong>` inside data-flagged elements renders as JetBrains Mono semibold tabular numerals. Clinical numerics in prose ("BP 168/94", "INR 1.0", "NIHSS 14") now line up by digit and read with the rest of the data layer instead of being bolded body sans.

The full mono-numeric sweep (replacing every existing `<strong>{nihss}</strong>`-style emphasis with `<span className="font-mono tabular-nums">`) is deferred to surface-level PRs and v6.1-03 (the right-rail mirror, which is mostly mono).

Cache v90 → v91. Version 5.26.0 → 5.27.0. Tests: 427/427 passing.

## v5.26.0 — 2026-04-25 — v6.0-05 Hairline cards (first cut)

Globalwide cleanup pass on card chrome:

- **Radii**: `rounded-xl` and `rounded-2xl` → `rounded-md` everywhere (per spec: no 12 px+ radii). `src/app.jsx`, **174 lines** touched. 58 `rounded-xl` instances + the few `rounded-2xl` instances all collapsed to 6 px.
- **Shadows**: `shadow-sm` / `shadow-md` / `shadow-lg` stripped from `src/app.jsx`. Cards are instruments, not marketing surfaces — they read by hairline border + paper background, not by lift.
- **Borders to tokens**: `border border-slate-200` and `border-2 border-slate-300` → `border border-line` (now resolves to `var(--line)` so dark mode flips automatically).

### Notes

- This is the first cut of v6.0-05. Full per-section refactoring of the Encounter form (one card per section, hairline-`border-b` rows, no nested tinted backgrounds) requires touching the ~8 000-line encounter render and is deferred to a follow-up PR within the v6.0 milestone — the most expensive cosmetic move on the roadmap.
- The `bg-blue-50`/`bg-amber-50`/`bg-red-50`/etc. tinted backgrounds are intentionally retained in this PR — many encode clinical state (red = contraindication, amber = caution). They migrate to `bg-{semantic}-soft` token utilities as the hairline-row refactor lands per surface.
- Tests: 427/427 passing. Build clean.
- Cache v89 → v90. Version 5.25.0 → 5.26.0.

## v5.25.0 — 2026-04-25 — v6.0-04 Strip decorative icons

Reduces lucide-icon count in `src/app.jsx` from **288 → 206 (-82)**, removing decorative icons from the surfaces the v6.0 spec explicitly calls out and from prominent section headers.

### Stripped

- **Top tabs** — Encounter / Management / Trials. The dynamic `<i data-lucide={tab.icon}>` is gone; tab definitions no longer carry an `icon` field. Labels-only rendering.
- **Management sub-tabs** — ICH / Ischemic / SAH / TIA / CVT / Clinic / Wards / Calculators / Pocket Cards / Teaching / References. Pills are now label-only, full-rounded, ink/paper-2 active/inactive states (replaces `bg-blue-600` active state).
- **Section-header / category icons** — bulk-stripped 80 instances of decorative `<i data-lucide="X" .../>` for the names: `moon`, `brain`, `activity`, `zap`, `stethoscope`, `file-text`, `library`, `flask-conical`, `pill`, `droplet`, `droplets`, `heart-pulse`, `syringe`, `clipboard-list`, `clipboard-check`, `graduation-cap`, `book-open`, `credit-card`, `calculator`, `git-branch`, `map-pin`, `file-plus`, `lightbulb`, `test-tubes`, `user-plus`, `share-2`, `history`, `file-json`, `user-check`. These were inline with section titles and labels — purely decorative.

### Kept

Per the spec ("Keep icons only for state indicators"), the remaining 206 icons are predominantly:
- **State**: `alert-triangle`, `alert-circle`, `shield-alert`, `check-circle`, `x` (warnings, confirmations, dismissals)
- **Expandable**: `chevron-down`, `chevron-right`
- **Interactive button glyphs**: `copy`, `download`, `eye` (view), `mail`, `scan`, `search`, `external-link`
- **Toggle states**: `volume-x`/`volume-2` (mute), `sun`/`moon` (theme), `wifi-off` (offline)
- **Domain glyphs in icon-only contexts**: `clock` near time data (semantic, not decorative)

### Notes

- No clinical content edited. No recommendations, doses, time targets, citations, classes, or trial citations changed.
- Tests: 427/427 passing. Build clean (2.5 MB JS, no growth).
- Cache v88 → v89. Version 5.24.0 → 5.25.0.

## v5.24.0 — 2026-04-25 — v6.0-03 Demote gradient banners

All 14 `bg-gradient-to-r/br/...` instances in `src/app.jsx` replaced with quiet section headers, solid semantic backgrounds, or hairline cards. **Zero gradient backgrounds remaining anywhere in the app.**

### Demoted

- **App header** "Stroke" wordmark — blue→indigo gradient text → `font-serif text-display text-ink`
- **Window timer banner** — emerald/amber/orange/red gradient → solid semantic bg keyed by treatment-window threshold (`bg-confirm` <3h · `bg-caution` 3–4.5h · `bg-critical` ≥4.5h)
- **Telephone Consult banner** — amber→orange gradient → quiet `<header>` with mono eyebrow ("Step 01 · Capture"), serif title, mono tabular LKW value, secondary action button
- **Recommendation panel** — blue-50→green-50 gradient → `bg-reference-soft` with reference left rule
- **TNK contraindications** — orange-50→red-50 gradient → `bg-critical-soft` with critical left rule
- **TNK dose badge (header + body)** — amber/green gradients → solid `bg-caution`/`bg-confirm` and `bg-caution-soft`/`bg-confirm-soft`
- **Elapsed-time prominent timer** — getElapsedColor() now returns solid utility class (`bg-confirm` / `bg-caution` / `bg-critical`) instead of gradient class strings
- **Quick patient summary** card — slate→blue gradient → `bg-paper-2`
- **Quick dosing reference** details — orange→amber gradient → `bg-caution-soft` with caution left rule
- **Calculator → trial implications** banner — purple→indigo gradient → `bg-reference-soft` with reference left rule
- **Calculator-result card** — white→slate-50 gradient → plain `bg-card`
- **Clinical Trials top header** — blue→indigo→purple gradient → quiet `<header>` with "Reference" eyebrow + serif title
- **Trial relevance summary** — slate→blue gradient → `bg-paper-2`

### Architectural

- The window-timer color logic is now token-driven, so dark mode flips correctly via `--confirm` / `--caution` / `--critical` token overrides.
- Telephone Consult and Clinical Trials banners are now `<header>` elements (was `<div>`), aligning the DOM with the spec ("plain header elements").
- "Start Timer" button on Telephone Consult banner now uses the new `.v6-btn-secondary .v6-btn-sm` classes from v6.0-02 — first concrete adoption of the primitives.

Cache v87 → v88. Version 5.23.0 → 5.24.0. Tests: 427/427 passing. Build clean (2.5 MB bundle, no growth).

## v5.23.0 — 2026-04-25 — v6.0-02 Repaint primitives

### Shared UI primitives

- **`src/primitives.jsx`** — new file. React primitives that bake the v6 visual rules in:
  - `<Button>` — variants `primary` / `secondary` / `critical` / `confirm` / `ghost`, sizes `sm` / `md` / `lg`. Solid ink primary on white. No blue. No filled secondaries. 4 px radius, 1 px line, 2 px ink focus ring.
  - `<Card>` — single white surface on paper. 6 px radius, 1 px hairline. Optional eyebrow / title / description / action header.
  - `<Field>` — labeled input row with hairline-bottom; stacked fields read as a list, not a grid of tiny boxes.
  - `<Input>`, `<Select>`, `<Textarea>` — no bg tint, 1 px line border, ink focus. Mono variant for clinical numerics. `numeric` prop wires `inputmode="decimal"` + iOS-friendly `pattern`.
  - `<Tabs>` — quiet pills. Active = solid ink. No active gradient.
  - `<Banner>` — quiet section header (replaces every gradient banner). Optional 3 px left rule per accent (`critical` / `confirm` / `caution` / `reference`).
  - `<Callout>` — semantic note. Glyph required so color is never the only signal (✕ critical · ✓ confirm · ⚠ caution · ⓘ reference).
  - `<Stamp>` — small semantic badge anchored to a field. Used heavily in v6.2-04 surfaced contraindications.
  - `<Eyebrow>`, `<Data>` — small text helpers (mono uppercase eyebrow, mono tabular data span).

### Component classes for piecemeal migration

- **`src/styles.css` `@layer components`** — mirrors the React primitives so the 34k-line `src/app.jsx` monolith can adopt them via `className` without lifting JSX into separate components:
  - `.v6-btn-primary` / `.v6-btn-secondary` / `.v6-btn-critical` / `.v6-btn-confirm` / `.v6-btn-ghost` (+ `.v6-btn-sm` / `.v6-btn-lg`)
  - `.v6-card` / `.v6-card-header` / `.v6-card-body`
  - `.v6-input` / `.v6-select` / `.v6-textarea`
  - `.v6-eyebrow` / `.v6-data`
  - `.v6-callout-{critical,confirm,caution,reference}`
  - `.v6-stamp-{critical,confirm,caution,reference}`
- **Tailwind `safelist`** for the `v6-*` pattern so classes ship before the monolith adopts them.

### Notes

- This PR is purely additive. No surface in `src/app.jsx` was repainted yet — adoption begins in **v6.0-03** (gradient banner demotion) and continues through **v6.0-08**.
- The "every page should already feel calmer" outcome from the v6.0 spec lands when v6.0-03 → v6.0-08 swap inline `bg-gradient-to-r from-... to-...` and `rounded-xl` chrome for these primitives.

## v5.22.0 — 2026-04-25 — v6.0-01 Tokens & Tailwind config

### Design system foundation

- **Neutral + semantic token system** wired through `src/styles.css` (`:root` + `html.dark`) and exposed as Tailwind utilities via `tailwind.config.js`:
  - Neutrals: `--ink`, `--ink-2`, `--mute`, `--line`, `--paper`, `--paper-2`, `--card` (warm cream paper, hairline lines, dark ink). 90% of the work.
  - Semantic: `--critical` (contraindications, time breaches), `--confirm` (eligible, target met), `--caution` (approaching breach), `--reference` (informational). Used sparingly — never decoratively.
  - Each token has a `-soft` variant for backgrounds.
- **Tailwind utilities**: `text-ink`, `bg-paper`, `border-line`, `text-critical`, `bg-critical-soft`, `text-confirm`, `bg-confirm-soft`, `text-caution`, `bg-caution-soft`, `text-reference`, `bg-reference-soft`, plus dark-mode equivalents.
- **Type scale wired**: `text-display`, `text-section`, `text-eyebrow` (mono uppercase, tracking 0.12em), `text-body`, `text-data` (mono tabular), `text-data-lg`, `text-caption`. Role-based, not size-based.
- **Font stack**: `font-sans` → Manrope, `font-serif` → Newsreader, `font-mono` → JetBrains Mono (newly added via Google Fonts; the only new dependency in the v6 plan). All three preconnect-loaded.
- **Tabular numerics by default** on `.font-mono`, `code`, `kbd`, `samp`, `pre` via `font-variant-numeric: tabular-nums` plus JetBrains Mono `cv02`/`cv03` stylistic alternates for legibility on small screens.
- **Selection color** updated to `--reference-soft` on `--ink` text — pulls into the new system instead of the old hardcoded blue.

### Notes

- This PR is purely additive and visually inert. No existing utilities were removed, no surfaces repainted. The body still uses `bg-slate-50` until v6.0-02 primitives migrate page-level chrome.
- Bulk replacement of `blue-*` / `indigo-*` / `orange-*` / `purple-*` / `green-500/600/700` is deferred to v6.0-02 → v6.0-06, where each surface is touched semantically (e.g. v6.0-03 demotes gradient banners; v6.0-05 strips tinted-card stacking from the Encounter form). Doing the replacement blindly across 1167+ usages would lose the existing semantic intent of red/amber/green clinical signals.

## v5.21.0 — 2026-04-25

### StrokeOps v6 Evidence Atlas

#### New surfaces

- **Evidence Atlas sub-tab** at `#/trials`: 31 completed and landmark trials with PICO summaries, primary endpoints (effect size + CI + p), safety findings, imaging selection criteria, and citations linked to PubMed / DOI. Filter by topic, certainty, evidence type, or verification status. Search across short/full names, interventions, and citation titles.
- **Context Bridge** drawer in active-trial matcher cards: when an active trial matches a patient encounter, related completed trials surface as background evidence — visually distinct (indigo on slate), clearly labeled "Context only · not eligibility criteria". One-way bridge: completed trials never feed into the eligibility checklist.
- **"Why this recommendation?" drawer** in Management sections: every guideline-grade recommendation linked to a chain of supporting claims, each with primary citations. 10 legacy management recommendations now show this drawer (ICH BP target, anticoagulant reversal warfarin/FXa, TNK first-line, EVT late-window/large-core, late-window IVT, DAPT minor stroke, AF anticoagulation timing).

#### Architectural

- **Pure-function matcher engine** (`src/evidence/matcher-engine.js`) replaces the inline imperative `TRIAL_ELIGIBILITY_CONFIG`. 7 operators (`>=`, `<=`, `>`, `<`, `==`, `between`, `in`, `present`, `truthy`), 31 field resolvers including 2 derived (`reperfusion`, `domainMatch`). 100% coverage of 52 inclusion criteria + 16 exclusions across 11 active trials.
- **Snapshot regression suite**: 211 frozen tests (`scenario-snapshot.test.js`) lock matcher behavior across 19 patient scenarios × 11 trials.
- **Validators integrated into `npm test` chain**: `evidence:validate` reports schema, FK integrity, identifier patterns (PMID 7-9 digits, DOI, NCT8), Class-I-without-supporting-claim auditability, stale-evidence (>24mo) warnings.
- **Exporters**: `npm run evidence:export` produces Markdown + CSV + JSON in `output/` for review (atlas summary, completed trials, active trials, claim-source map, PICO table).

#### Bug fixes

- **Tri-state criterion semantics**: 21 evaluator patterns rewritten so unentered fields show as `unknown` (needs info) rather than `not_met` (red strikethrough not-eligible). Affected: `tnkRecommended`, `evtRecommended`, `hoursFromLKW`, `ctpResults`, `ctaResults`, `vesselOcclusion`, `ichLocation`, `onStatin`, `pmh`, `symptoms`, `diagnosisCategory`. Phase 7 had previously fixed this for age and pre-stroke mRS only.
- **RHAPSODY `reperfusion` derived field** now returns `null` (unknown) when both TNK and EVT decisions are undefined, so RHAPSODY shows `needs_info` on a fresh form rather than `not_eligible`.

#### Infrastructure

- **Capacitor scaffold** for opt-in iOS / Android distribution (`android/`, `ios/`, `capacitor.config.json`, `OPTIN_NATIVE_WRAPPER`).
- **CI path-guard** (`.github/workflows/main-pathguard.yml`) blocks accidental commits of build-output artifacts to `main` (e.g., `android/app/build/`, generated `ios/App/Pods/`, `node_modules/`).
- **Service worker** cache version bumped (v84 → v85) so existing PWA installs pick up the new bundle on next launch.

#### Counts

- 11 active trials · 31 completed trials · 42 citations · 11 claims · 9 recommendations · 7 guidelines · 30 topics
- 427 vitest tests (was 154 baseline) · 100% engine coverage
- ~6,000 LOC structured atlas + scripts + tests added · 470 LOC legacy `TRIAL_ELIGIBILITY_CONFIG` retired
