# StrokeOps Phase 1 — Design Foundation Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the entire stroke app to the approved "clinical precision instrument" design (teal/coral/gold palette + Bricolage Grotesque / Public Sans / IBM Plex Mono + signature texture/glow/pulse) by re-valuing the existing v7 token ramps — *without* rewriting the 34,907-line monolith.

**Architecture:** The monolith never hardcodes color — `tailwind.config.js` maps every utility (`bg-cobalt-600`, `text-slate-900`, …) to `rgb(var(--token) / <alpha-value>)`, and `src/app.jsx` uses **0 raw hex / 0 inline `var(--)`**. Therefore re-valuing ~5 CSS ramps in `src/design/tokens.css` re-themes ~3,900 utility call-sites atomically. We keep the v7 token *names* (`cobalt/crit/warn/ok/slate`) so both lint gates and all JSX keep working; we only change the values (cobalt→teal, crit→coral, warn→gold), swap 3 font families, and port the signature visual elements as additive `v7-`-prefixed classes.

**Tech Stack:** Tailwind 3 (CSS-variable color plumbing), esbuild bundle (`src/app.jsx → app.js`), tailwindcss CLI (`src/styles.css → tailwind.css`), Vitest, custom Node lint gates (`lint-tokens`, `lint-contrast`, `lint-touch-targets`), service-worker precache.

---

## Decisions captured this session (2026-05-29)

1. **Content governance for the protocols surface (affects Phase 3, recorded here):** The existing **Management** tab will be renamed **"Institutional Protocols and Algorithms."** The public GitHub-Pages build presents the **real protocol content, fully de-identified** — *no* "UW", "Harborview", "HMC", "University of Washington", local pager/phone numbers, EHR order-set names, or named people. A reader cannot attribute a protocol to any specific institution. This satisfies the standing "zero identifying institutional content on the public site" constraint while keeping the section clinically substantive. (NOT built in Phase 1; the rename + content work is Phase 3. `BUILD-PLAN.md` has been updated to reflect this.)
2. **This phase = design foundation only.** No IA changes, no new tabs, no content moves. Tokens, type, signature visuals, and two pre-existing gate fixes.
3. **Palette reach (decided 2026-05-29):** A token re-value re-skins ~3,900 token-mapped utilities but **not** ~1,400 raw built-in Tailwind palette utilities (879 `blue`, 252 `orange`, 89 `pink`, 58 `rose`, 52 `teal`, 34 `yellow`, 32 `sky`, plus cyan/green/lime/red/amber). Decision: **promote the primary/info color** — raw `blue-*` is the app's de-facto primary AND the ischemic category color — **to the teal token** (so the app reads teal-primary), while **preserving** the meaningful diagnosis-category / severity / topic colors (`ich/sah/cvt`, orange/pink/rose/sky/cyan/yellow/green) as clinical coding. → adds **Task 3b**; Task 3 additionally re-values the `link` ramp to teal (links are teal in the prototype).

## Hard constraints (in force — do not violate)

- **Extend / re-skin, never rewrite.** Preserve every route, calculator, IndexedDB ward census + 12h expiry, post-tPA timer, LKW countdown, 8 note generators, disclaimers, aria/keyboard/focus.
- **Institution-neutral public site.** Zero HMC/UW/identifying content (already clean on main).
- **Offline PWA.** No in-app live network calls for content; bump SW version so clients refetch rebuilt assets.
- **Token names are frozen this phase.** Do NOT rename `cobalt/crit/warn/ok/slate/info/link` ramps — that would touch 34k lines and both lint gates. Re-value only.
- **Both lint gates must end green.** `lint:tokens` (currently FAILING — 6 amber violations) and `lint:contrast` (currently passing — must stay passing with new values).

## Source-of-truth references

- Approved design: `docs/design/prototype.html` (513 lines — the `:root` block lines 11–39 + component CSS).
- Current tokens: `src/design/tokens.css` (slate+cobalt system) and the `@layer base :root` hex block in `src/styles.css` (which *overrides* the tokens.css v6 aliases via cascade — must be reconciled in Task 3).
- Token utility mapping: `tailwind.config.js` lines 35–106.
- v7 migration record: `docs/v7-after/00-token-inventory.md`.

## File structure (what each task touches)

| File | Role | Tasks |
|---|---|---|
| `src/app.jsx` | monolith (amber violation @ line 15965) | T1 |
| `src/components.jsx` | shared components (amber violation @ line 363) | T1 |
| `index.html` | font `<link>` (line 49–50), asset `?v=` query (lines 51, 52, 896) | T2 |
| `tailwind.config.js` | `fontFamily` (lines 102–106) | T2 |
| `src/design/tokens.css` | the color ramps + new semantic aliases | T3 |
| `src/styles.css` | `@layer base :root/html.dark` hex reconciliation + new `v7-` component layer | T3, T4 |
| `service-worker.js` | precache version bump | T2, T5 |
| `scripts/lint-contrast.mjs` | (read-only gate; values unchanged, run to verify) | T3, T5 |

Generated artifacts (`app.js`, `tailwind.css`) are **never hand-edited** — they are rebuilt by `npm run build`.

---

## Task 1: Fix the 6 pre-existing `lint:tokens` violations (start from green)

**Why first:** The gate is currently red on raw `amber-*` utilities unrelated to this work. Fixing them first means every later token change is attributable, and the acceptance gate is meaningful.

**Files:**
- Modify: `src/app.jsx:15965`
- Modify: `src/components.jsx:363`

- [ ] **Step 1: Confirm the gate fails and see exactly what**

Run: `cd /Users/rizwankalani/code/stroke && node ./scripts/lint-tokens.mjs`
Expected: `✕ lint:tokens — 6 violation(s)` listing `bg-amber-50`, `border-amber-300`, `text-amber-950` at `src/app.jsx:15965` and `src/components.jsx:363`.

- [ ] **Step 2: Apply the amber→warn swap**

In both `src/app.jsx:15965` and `src/components.jsx:363`, replace within the `className`:
- `bg-amber-50` → `bg-warn-50`
- `border-amber-300` → `border-warn-300`
- `text-amber-950` → `text-warn-950`

(These map to the same visual amber today; `warn` is the v7 semantic alias the linter requires. Read the surrounding line first and preserve all other classes verbatim.)

- [ ] **Step 3: Verify the gate is clean**

Run: `node ./scripts/lint-tokens.mjs`
Expected: `✓ lint:tokens — clean`

- [ ] **Step 4: Rebuild + confirm no test regressions**

Run: `npm run build && npm run test:unit`
Expected: build clean; vitest all-pass (record the count, e.g. `XXX passed`).

- [ ] **Step 5: Commit**

```bash
git add src/app.jsx src/components.jsx app.js tailwind.css
git commit -m "fix(tokens): amber→warn on the two pre-existing lint:tokens violations"
```

---

## Task 2: Swap the three typefaces (Manrope/Newsreader/JetBrains → Public Sans/Bricolage Grotesque/IBM Plex Mono)

**Why:** The approved identity is Bricolage Grotesque (display) · Public Sans (body) · IBM Plex Mono (data). The app's `font-serif` slot is, by `lint-tokens` convention, the heading/display family (restricted to h1/h2/h3) — so **serif → Bricolage Grotesque**, `sans → Public Sans`, `mono → IBM Plex Mono`. No JSX changes needed; the families resolve through `tailwind.config.js` + the `<link>`.

**Files:**
- Modify: `index.html:49-50` (the preload + noscript Google Fonts link), `index.html:51,52,896` (asset `?v=` cache-busters)
- Modify: `tailwind.config.js:102-106` (`fontFamily`)
- Modify: `service-worker.js` (CACHE version constant)

- [ ] **Step 1: Replace the Google Fonts URL** (use the verbatim axis spec from the prototype, `docs/design/prototype.html:9`)

In `index.html`, replace the family query in **both** line 49 (`rel="preload"`) and line 50 (`<noscript>`):

From `family=Manrope:wght@400;500;600;700&family=Newsreader:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600`
To `family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:ital,wght@0,400..700;1,400..600`

(Keep `&display=swap` and the surrounding `<link>` attributes intact.)

- [ ] **Step 2: Update the Tailwind font stacks**

In `tailwind.config.js:102-106`, set:

```js
fontFamily: {
  sans:  ['"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  serif: ['"Bricolage Grotesque"', 'Georgia', 'ui-serif', 'serif'],
  mono:  ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
},
```

- [ ] **Step 3: Bump cache-busters so clients refetch**

In `index.html`, bump every `?v=6.0.x` query on `app.js` (lines 51, 896) and `tailwind.css` (line 52) to `?v=6.1.0`. In `service-worker.js`, bump the cache-name/version constant (grep for `const CACHE` / a version string near line 1–30) to a new value (e.g. `…-v6.1.0`). Fonts are runtime-cached by the SW handler (`service-worker.js:126`), so the precache list needs no font entry.

- [ ] **Step 4: Rebuild and verify gates still green**

Run: `npm run build && node ./scripts/lint-tokens.mjs`
Expected: build clean; `✓ lint:tokens — clean` (the `font-serif`-on-headings rule is still satisfied since serif is now the display family used on h1/h2/h3).

- [ ] **Step 5: Eyeball the fonts loaded**

Run: `python3 -m http.server 8080` (in the repo), open `http://localhost:8080/#/encounter`, confirm headings render in Bricolage Grotesque and body in Public Sans (DevTools → Computed → font-family). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add index.html tailwind.config.js service-worker.js app.js tailwind.css
git commit -m "feat(type): swap to Bricolage Grotesque / Public Sans / IBM Plex Mono"
```

---

## Task 3: Re-value the color ramps to teal / coral / gold (the core re-skin)

**Why:** This is the atomic re-theme. Re-valuing the ramps in `tokens.css` re-skins all ~3,900 token-mapped utility call-sites. The ramps are rebuilt as full 11-step ramps anchored on the prototype mids, **constructed so the exact steps that `lint-contrast` checks still clear their AA/AAA floors** (white text on `cobalt-600/700`; `crit/warn/ok-800` on `*-50`; dark inversions). `lint-contrast` is the test — it must print `✓ … 21 pairs verified ≥ floor`.

**Also re-value the `link` ramp to teal** (per Decision 3): set `--link-50/100/200/400/600/700/900` to teal-tinted values matching the `cobalt` (teal) ramp, so existing `link-*` (actual `<a>`) utilities render teal as in the prototype. The `lint-contrast` pairs `link-600/slate-0` (≥4.5) and `link-400/slate-950` (≥4.5 dark) must still pass — use `--link-600 = --cobalt-600`'s teal and a bright teal for `--link-400` in dark. Raw `blue-*` migration is **Task 3b** (separate), not here.

**Files:**
- Modify: `src/design/tokens.css` (ramp values, light `:root` + `[data-theme="dark"]`/`html.dark`; add prototype semantic aliases)
- Modify: `src/styles.css` (`@layer base :root` and `html.dark` hex blocks — they currently *override* the aliases; re-point them to the new palette)

### Candidate ramps (RGB triplets — the `tokens.css` format `--name: R G B;`)

These are computed by construction (prototype mid = the 500/600 anchor; tints toward paper for 50–300, shades toward ink for 700–950). Treat as the starting values; `lint-contrast` in Step 4 is the gate that forces any nudge.

**`cobalt` → teal** (anchor `--teal #0C7C8C`, dark `--teal-d #0A6571`):
```
--cobalt-50:  226 240 241;  --cobalt-100: 204 230 232; --cobalt-200: 168 213 217;
--cobalt-300: 122 190 197;  --cobalt-400:  64 160 172; --cobalt-500:  12 124 140;
--cobalt-600:  10 101 113;  --cobalt-700:   8  80  90; --cobalt-800:   7  62  70;
--cobalt-900:   6  47  53;
```
(white-on-`cobalt-600` ≈ 6.6:1, white-on-`cobalt-500` ≈ 4.9:1 → both ≥4.5 ✓ by construction; verify in Step 4.)

**`crit` → coral** (anchor `--coral #DC3F3A`, wash `#FBE7E5`):
```
--crit-50: 251 231 229; --crit-100: 248 213 210; --crit-200: 244 180 175; --crit-300: 237 140 134;
--crit-400: 228 95 89;  --crit-500: 220 63 58;   --crit-600: 190 48 44;   --crit-700: 158 38 35;
--crit-800: 124 31 29;  --crit-900: 96 26 24;    --crit-950: 60 20 19;
```

**`warn` → gold** (anchor `--gold #B07D24`, wash `#F6ECD6`):
```
--warn-50: 246 236 214; --warn-100: 241 226 192; --warn-200: 230 206 150; --warn-300: 214 178 102;
--warn-400: 196 150 60; --warn-500: 176 125 36;  --warn-600: 150 105 28;  --warn-700: 124 86 22;
--warn-800: 99 68 18;   --warn-900: 76 52 15;    --warn-950: 48 33 10;
```

**`ok`** (re-anchor on prototype `--ok #2C7A52`, wash `#E2F0E8`):
```
--ok-50: 226 240 232; --ok-100: 200 228 211; --ok-200: 158 208 178; --ok-300: 110 182 142;
--ok-400: 68 150 108; --ok-500: 44 122 82;   --ok-600: 36 102 68;   --ok-700: 30 84 56;
--ok-800: 24 66 44;   --ok-900: 18 50 34;    --ok-950: 12 34 22;
```

**`slate` → warm neutrals (conservative — surfaces + ink only; mid-grays keep current luminance to preserve text contrast):**
```
--slate-0:  255 255 255;   (panel white — unchanged)
--slate-50: 251 250 246;   (warm paper #FBFAF6)
--slate-100: 244 242 235;  (warm panel-2 #F4F2EB)
--slate-900: 20 23 29;     (warm ink #14171D)
--slate-950: 14 17 21;     (warm ink-deep)
```
Leave `--slate-200..800` at their current values (they carry border/muted-text contrast that `lint-contrast` enforces at AAA — do not lighten).

**Dark-mode accent overrides** (in the `[data-theme="dark"]` + `html.dark` blocks), from the prototype dark `:root`:
```
--cobalt-300: 63 182 196;  (bright teal for dark focus ring / accents — #3FB6C4)
--crit-300/400 → coral-light #F06B62;  --warn-300/400 → gold-light #D6A24E;  --ok-300 → #5FB489;
```
Keep dark `--slate-*` surface steps as currently authored unless `lint-contrast` dark pairs fail.

### New prototype semantic aliases (append to `tokens.css`, after the ramps — bridges the prototype component CSS in Task 4)
```css
:root{
  --teal: rgb(var(--cobalt-500)); --teal-d: rgb(var(--cobalt-600)); --teal-wash: rgb(var(--cobalt-50));
  --coral: rgb(var(--crit-500)); --coral-wash: rgb(var(--crit-50));
  --gold: rgb(var(--warn-500)); --gold-wash: rgb(var(--warn-50));
  --ok-c: rgb(var(--ok-600)); --ok-wash: rgb(var(--ok-50));
  --panel: rgb(var(--slate-0)); --panel-2: rgb(var(--slate-100));
  --ink-soft: rgb(var(--slate-600)); --faint: rgb(var(--slate-500));
  --line-2: rgb(var(--slate-300));
  --display-font: "Bricolage Grotesque", Georgia, serif;
  --sans-font: "Public Sans", -apple-system, sans-serif;
  --mono-font: "IBM Plex Mono", ui-monospace, monospace;
  --ease: cubic-bezier(.2,.7,.2,1); --radius-card: 14px; --radius-s: 9px;
  --maxw: 1180px;
}
```
(Reuse the existing `--ink`, `--paper`, `--card`, `--line` aliases already present. Note: `--paper` must resolve to warm `slate-50`; verify the existing alias points there, else update it.)

- [ ] **Step 1: Snapshot the passing baseline**

Run: `cd /Users/rizwankalani/code/stroke && node ./scripts/lint-contrast.mjs`
Expected: `✓ lint:contrast — 21 pairs verified ≥ floor` (this is the green we must preserve).

- [ ] **Step 2: Apply the ramp re-values + dark overrides + aliases** in `src/design/tokens.css` (replace the `--cobalt-*`, `--crit-*`, `--warn-*`, `--ok-*` triples and the 5 `--slate-*` surface/ink triples listed above; add the alias block).

- [ ] **Step 3: Reconcile the `src/styles.css` hex override layer** — in the `@layer base :root` and `html.dark` blocks, set the v6 alias hex to the new palette so they don't shadow stale blue/red values:
```
--ink:#14171D; --ink-2:#3A414C; --mute:#545E6B; --line:#E7E2D6; --paper:#FBFAF6; --paper-2:#F4F2EB; --card:#FFFFFF;
--critical:#9E2623; --critical-soft:#FBE7E5; --confirm:#1E5438; --confirm-soft:#E2F0E8;
--caution:#7C5616; --caution-soft:#F6ECD6; --reference:#0A6571; --reference-soft:#E2F0F1;
```
and the matching `html.dark` block to the prototype dark equivalents.

- [ ] **Step 4: Run the contrast gate — the test**

Run: `node ./scripts/lint-contrast.mjs`
Expected: `✓ lint:contrast — 21 pairs verified ≥ floor`.
If any pair prints below floor, darken that ramp's offending step (e.g. white-on-`cobalt-600` low → make `--cobalt-600` darker) and re-run until green. **Do not lower any floor in the script.**

- [ ] **Step 5: Rebuild + full static gates**

Run: `npm run build && node ./scripts/lint-tokens.mjs && npm run test:unit && npm run evidence:validate && npm run validate:citations`
Expected: build clean; `✓ lint:tokens — clean`; vitest all-pass; evidence clean; citations PASS.

- [ ] **Step 6: Visual smoke**

Run a local server, load `/#/encounter`, `/#/management`, `/#/trials`; confirm the app now reads teal-primary / coral-acute / gold-ICH on warm paper, light + dark (toggle theme). No blue/Manrope residue.

- [ ] **Step 7: Commit**

```bash
git add src/design/tokens.css src/styles.css app.js tailwind.css
git commit -m "feat(tokens): re-value v7 ramps to teal/coral/gold + warm neutrals (contrast-verified)"
```

---

## Task 3b: Migrate the primary `blue` accent → teal token (preserve clinical color-coding)

**Why:** Decision 3 — promote the app's de-facto primary/info color (raw `blue-*`, 879 uses) to the `cobalt` token (now teal) so the app reads teal-primary, while **preserving** diagnosis-category/severity/topic colors. This is a codemod-style mechanical sweep, gated by build + tests + lint.

**Files:** `src/app.jsx` (bulk), `src/components.jsx`, `src/primitives.jsx`, `src/pocket-cards.jsx`, `src/teaching.jsx`, `src/design/*.jsx` (only if they contain `blue-`). Optionally add a throwaway `scripts/codemod-blue-to-cobalt.mjs` (mirroring the existing `scripts/codemod-v7.mjs` pattern) and delete it after, or apply via verified in-place edits.

- [ ] **Step 1: Inventory** — `grep -rnoE "[a-z:-]*blue-[0-9]+" src/app.jsx src/components.jsx src/primitives.jsx src/pocket-cards.jsx src/teaching.jsx src/design/*.jsx | sort | uniq -c`. Also locate the color-name→class helper maps: `grep -rn "case 'blue'" src` and object maps returning class strings keyed on `blue:`.

- [ ] **Step 2: Migrate utility classes** — replace every Tailwind utility of shape `(<variant:>*)(bg|text|border|ring|from|to|via|fill|stroke|divide|accent|caret|outline|decoration|placeholder)-blue-(\d{2,3})` → same prefix with `cobalt-` (keep the step number; map the rare `blue-950` → `cobalt-900` since the cobalt ramp tops at 900). Use a regex anchored on the utility shape — do NOT blind-replace the bare word `blue` (avoid hitting strings/identifiers/comments like "blueprint" or aria text).

- [ ] **Step 3: Migrate helper-map class strings** — in the color→class helper maps, change returned `blue-*` class strings to `cobalt-*`. The `ischemic` category maps to the name `'blue'`; leave the NAME, but its helper now returns teal classes (ischemic renders teal — acceptable; it stays distinct from `ich`=crit/coral, `sah`=purple, `cvt`=indigo).

- [ ] **Step 4: PRESERVE (do not touch)** — `red`(already `crit`), `orange`, `pink`, `rose`, `sky`, `cyan`, `yellow`, `green`, `lime`, `purple`, `indigo` utilities and their helper entries. These are clinical category/severity/topic codes and stay distinct.

- [ ] **Step 4b: Also fix the raw-blue `--focus-ring`** (found in T3) — in `src/styles.css` `@layer base :root`, `--focus-ring: 0 0 0 3px rgba(37,99,235,.35)` renders a blue focus glow that clashes with teal. Change the rgba to the teal primary: `rgba(12,124,140,.35)` (and the `html.dark` focus-ring, if separately blue, to a bright-teal `rgba(63,182,196,.45)`).

- [ ] **Step 5: Gates** — `node ./scripts/lint-tokens.mjs` clean; `npm run build`; `npm run test:unit` (expect 5608/5608); `grep -rcE "[a-z:-]*blue-[0-9]+" src/*.jsx src/design/*.jsx` → expect 0 (document any deliberate remnant). Delete any throwaway codemod script.

- [ ] **Step 6: Visual check** — app reads teal-primary; ICH/SAH/CVT and the topic/severity chips remain visually distinct.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(palette): promote primary blue→teal token; preserve clinical category coding"
```

---

## Task 4: Port the signature visual elements (texture · glow · pulse · cards · frosted tab bar · chips)

**Why:** The palette alone doesn't make the "instrument" — the graph-paper texture, teal corner glow, freshness pulse, card left-stripe, frosted sticky masthead, and mono chips are the recognizable cues. Port them as **additive `v7-`-prefixed classes** (already safelisted by `tailwind.config.js:27`), referencing the Task-3 aliases, then apply them to the body + tab bar + one representative surface.

**Files:**
- Modify: `src/styles.css` (append a `v7 signature` block; verbatim port from `docs/design/prototype.html` lines 42–93, 107–199, retargeted to alias names)
- Modify: `src/app.jsx` (add `v7-` classes to the body wrapper + the tab-bar nav render — locate via `grep -n "activeTab" src/app.jsx` and the primary nav render)

- [ ] **Step 1: Port base atmospherics into `src/styles.css`** — graph-paper texture (`body` background-image, 42px grid via `color-mix(... var(--line) 42%...)`), teal corner glow (`body::before` radial `var(--teal) 8%`), `.v7-pulse` + `@keyframes v7pulse` (2.4s `var(--ease)`), `.v7-reveal` fade-up — **all motion gated behind `@media (prefers-reduced-motion: no-preference)`** (the repo already zeroes `--motion-scale` under reduce; respect it).

- [ ] **Step 2: Port component classes** — `.v7-card`/`.v7-study::before` (3px topic-colored left stripe: teal/coral/gold/ink-2), `.v7-chip`/`.v7-tag`/`.v7-stype`/`.v7-cert`/`.v7-verify` (mono, uppercase, `color-mix` tinted borders), `.v7-guardrail` strip, and `header.v7-app` (sticky, `backdrop-filter: saturate(160%) blur(10px)`, `color-mix(... var(--paper) 84%...)`) with `nav .v7-nav-item.active::before{content:"▸ ";color:var(--teal)}`. Copy CSS from prototype lines 56–84, 107–182 and swap `var(--panel)`→ alias names defined in Task 3.

- [ ] **Step 3: Apply to body + content wrapper** — add the `v7-skin` class to the root app wrapper and `v7-content` (`position:relative; z-index:1`) to the main content container in `src/app.jsx`, so the texture/glow paint behind real content. Do not alter routing, labels, aria, or handlers.
  - **DECISION (2026-05-29, during T4): DEFER applying `v7-app`/`v7-nav-item` to the existing tab bar.** Discovery: the production nav is NOT the prototype's simple top-bar — it is a responsive design (horizontal pills on mobile, a **248px vertical sidebar at ≥1024px**) already styled in `index.html` (`.app-nav` idx 207, `.tab-pill.active` teal gradient idx 236, sidebar idx 255–312). Layering the prototype's frosted top-bar + mono pills + injected `▸` active marker would clash with both layouts. The nav is already teal-themed (via T3b's blue→cobalt sweep). The `.v7-app`/`.v7-nav-item` CSS is fully ported and `/^v7-/`-safelisted, ready to wire into the **Phase 3/5 IA masthead** when the unified tab bar (adds "Research & Guidelines", renames Management → "Institutional Protocols and Algorithms") is actually built. So T4 ships: signature CSS (all classes) + body texture/glow/pulse application; nav restyle deferred to the IA phase.

- [ ] **Step 4: Rebuild + gates (incl. touch targets)**

Run: `npm run build`, then in one shell `python3 -m http.server 8080 &` and in another `node ./scripts/lint-touch-targets.mjs` (requires Playwright browsers; if absent run `npx playwright install chromium` first).
Expected: build clean; `✓ lint:touch-targets` clean across the 9 route·viewport combos. Also re-run `node ./scripts/lint-tokens.mjs` → clean. Stop the server.

- [ ] **Step 5: Visual verification (light + dark, desktop + 375px)** — confirm texture, glow, pulse, frosted nav with `▸` active marker, and card stripes render; nothing overlaps/regresses the calculators or timers.

- [ ] **Step 6: Commit**

```bash
git add src/styles.css src/app.jsx app.js tailwind.css
git commit -m "feat(design): port signature texture/glow/pulse/cards/frosted-nav as v7 classes"
```

---

## Task 5: Full gate sweep, PWA refresh, final verification

**Files:** Modify: `service-worker.js` (final version bump if not already); no source changes expected.

- [ ] **Step 1: Run the entire gate chain**

Run:
```bash
npm run build:prod && npm run test:unit && node ./scripts/lint-tokens.mjs && node ./scripts/lint-contrast.mjs && npm run evidence:validate && npm run validate:citations && npm run validate:inline-citations
```
Expected: all green (record each result). `qa-smoke` Playwright e2e is allowed to fail only on missing browsers (pre-existing repo limitation) — note it explicitly if so.

- [ ] **Step 2: Confirm SW version bumped** so deployed clients refetch the re-skinned `app.js`/`tailwind.css` (grep the cache constant; must differ from the v6.0.x baseline).

- [ ] **Step 3: Offline check** — load the app, go offline (DevTools), reload; app + new styles still render from cache.

- [ ] **Step 4: Write the phase report** to `docs/design/PHASE1-REPORT-2026-05-29.md` (gates + before/after counts + screenshots refs + any deferred items), then commit:

```bash
git add service-worker.js docs/design/PHASE1-REPORT-2026-05-29.md app.js tailwind.css
git commit -m "chore(design): Phase 1 foundation port — full gate pass + PWA refresh"
```

---

## Folded-in / deferred (from BUILD-PLAN "known quick-fixes")

- **Eligibility-iframe `example.github.io`:** the only occurrence is a *comment* at `src/app.jsx:34652`, not a live `src`. No production 404 risk; fix is comment hygiene only — optional, fold into Task 4 if touching that region, otherwise skip.
- **`lastReviewed` on guideline JSONs:** **deferred** — requires *real* review dates; do not fabricate. Out of Phase 1 scope.
- **IA rename (Management → Institutional Protocols and Algorithms) + de-identified protocol content:** **Phase 3**, per the captured decision above.

## Self-review notes

- **Spec coverage:** BUILD-PLAN Phase 1 ("Design tokens → app, surface by surface") → Tasks 2–4. The "surface by surface" framing is satisfied globally by the token architecture (Task 3 re-skins all surfaces at once) plus per-surface signature application (Task 4); both lint/contrast gates and PWA constraint are explicit gates.
- **Type/name consistency:** token ramp names unchanged (`cobalt/crit/warn/ok/slate`); new aliases (`--teal/--coral/--gold/--panel/--panel-2/--ink-soft/--faint/--line-2`) defined once in Task 3, consumed in Task 4. `--ok-c` aliased (not `--ok`) to avoid clashing with the `ok` ramp utility resolution — verify no prototype CSS references bare `--ok` after port.
- **No placeholders:** every token value and command is concrete; the one genuinely iterative step (contrast tuning) is gated by a real linter rather than guessed.
- **Risk register:** (1) warm-neutral contrast — mitigated by leaving slate-200..800 untouched + the contrast gate; (2) `styles.css` hex layer shadowing — addressed in Task 3 Step 3; (3) dark-mode pairs — verified by the same gate; (4) public site is light-pinned (`theme.js`), so dark-mode regressions affect local/teaching use only.
