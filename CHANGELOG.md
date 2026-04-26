# CHANGELOG

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
- **DISCOVERY trial inclusion criterion** tightened from `c !== 'mimic'` (incorrectly accepted TIAs) to `['ischemic','ich','sah'].includes(c)`, matching the trial's actual inclusion criteria.
- **RHAPSODY `reperfusion` derived field** now returns `null` (unknown) when both TNK and EVT decisions are undefined, so RHAPSODY shows `needs_info` on a fresh form rather than `not_eligible`.

#### Infrastructure

- **Capacitor scaffold** for opt-in iOS / Android distribution (`android/`, `ios/`, `capacitor.config.json`, `OPTIN_NATIVE_WRAPPER`).
- **CI path-guard** (`.github/workflows/main-pathguard.yml`) blocks accidental commits of build-output artifacts to `main` (e.g., `android/app/build/`, generated `ios/App/Pods/`, `node_modules/`).
- **Service worker** cache version bumped (v84 → v85) so existing PWA installs pick up the new bundle on next launch.

#### Counts

- 11 active trials · 31 completed trials · 42 citations · 11 claims · 9 recommendations · 7 guidelines · 30 topics
- 427 vitest tests (was 154 baseline) · 100% engine coverage
- ~6,000 LOC structured atlas + scripts + tests added · 470 LOC legacy `TRIAL_ELIGIBILITY_CONFIG` retired
