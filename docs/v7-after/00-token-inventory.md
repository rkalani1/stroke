# v6 → v7 token inventory

Snapshot of the v6 token system at v5.37.0 (baseline before the v7 overhaul lands)
versus the v7 token surface that ships in Phase 1.

## v6 tokens (carried forward as aliases — no source rename required)

Defined in `src/styles.css` `:root` and surfaced via `tailwind.config.js`
`theme.extend.colors`. Every utility below continues to resolve after v7 lands;
its value now points at a v7 token via the alias table at the bottom of
`src/design/tokens.css`.

### Color tokens

| v6 token | v7 source | Where used (v6) |
|---|---|---|
| `ink`              | `text-ink` → `slate-900`  | body copy, headings on default surfaces |
| `ink-2`            | `text-muted` → `slate-600`| secondary text |
| `mute`             | `text-faint` → `slate-500`| timestamps, footnotes |
| `line`             | `border-line` → `slate-200`| 1px hairlines |
| `paper`            | `bg-canvas` → `slate-0`   | full-bleed page background |
| `paper-2`          | `bg-subdued` → `slate-50` | section bands |
| `card`             | `bg-card` → `slate-0`     | resting card surface |
| `critical`         | `crit-700`                | red-700 alias |
| `critical-soft`    | `crit-50`                 | crit fill background |
| `confirm`          | `ok-700`                  | emerald-700 alias |
| `confirm-soft`     | `ok-50`                   | ok fill background |
| `caution`          | `warn-700`                | amber-700 alias |
| `caution-soft`     | `warn-50`                 | warn fill background |
| `reference`        | `info-700`                | blue-700 alias |
| `reference-soft`   | `info-50`                 | info fill background |
| `accent`           | `cobalt-600`              | (new in v7 — no v6 source) |
| `accent-2`         | `cobalt-500`              | (new in v7) |
| `accent-soft`      | `cobalt-50`               | (new in v7) |
| `accent-ink`       | `cobalt-800`              | (new in v7) |
| `surface`          | `bg-card` → `slate-0`     | alias |
| `surface-2`        | `bg-subdued` → `slate-50` | alias |
| `surface-3`        | `bg-canvas` → `slate-0`   | alias |

### Font tokens

| v6 token | v7 keeps as-is |
|---|---|
| `font-sans`  | Manrope stack       |
| `font-serif` | Newsreader stack    |
| `font-mono`  | JetBrains Mono stack|

### v6 fontSize aliases (kept resolving)

`display-lg`, `section`, `eyebrow`, `body`, `data`, `data-lg`, `caption`

## New v7 surface (added in Phase 1)

### Color ramps (CSS variables → Tailwind utilities)

- **slate** — 12-step ramp `slate-{0,50,100,200,300,400,500,600,700,800,900,950}`
- **cobalt** — 10-step ramp `cobalt-{50..900}` (single accent — replaces purple/violet/indigo)
- **link** — 7-step ramp `link-{50,100,200,400,600,700,900}` (only for `<a href>`)
- **crit / warn / ok / info** — 11-step ramps each (semantic — locked meaning)

### fontSize (v7 ramp)

`2xs / xs / sm / base / md / lg / xl / 2xl / 3xl / display` — modular 1.250
on a 16px base. v6 size aliases continue to resolve.

### Spacing — base-4 scale

`{1,2,3,4,5,6,8,10,12,16,20}` = `{4,8,12,16,20,24,32,40,48,64,80}px`

### Border radius — `sm/md/lg/xl/pill`

### Motion

`--motion-scale` (zeroed under `prefers-reduced-motion: reduce`) +
`--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

## What the codemod (Phase 2) does next

`scripts/codemod-v7.mjs` runs five passes against `src/app.jsx` (and the
smaller JSX files):

1. **Accent class swap** — `text|bg|border|ring-{purple|violet|indigo}-N` → `cobalt-N`
   (skips inside `<a href>` blocks; those get link-* in pass 5).
2. **Semantic fill swap** — `{bg|text|border|ring}-{amber|red|emerald}-N` →
   `{warn|crit|ok}-N`.
3. **Placeholder fix** — `text-slate-400` (or `placeholder:text-slate-400`)
   → `text-slate-500` (AA on white).
4. **font-serif strip** — keeps `font-serif` on `h1/h2/h3`, removes elsewhere.
5. **Link retargeting** — every `<a href>` gets
   `text-link-600 dark:text-link-400 hover:underline`.

`scripts/lint-tokens.mjs` enforces the same rules statically so the codemod
output stays clean over time.

## Backward-compatibility guarantees

- Every existing utility (e.g. `text-slate-700`, `bg-paper`, `border-line`,
  `text-critical`, `font-serif`) continues to resolve after Phase 1 lands.
- The v7 tailwind config is *extend* only; nothing existing is replaced.
- `localStorage` keys remain untouched; v7 introduces a `stroke.v7.*`
  namespace only (Phase 9 adds `stroke.v7.theme`).
