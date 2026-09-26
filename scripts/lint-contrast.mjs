#!/usr/bin/env node
/**
 * v7.0 — lint:contrast.
 * Drop-in: scripts/lint-contrast.mjs
 *
 * Parses src/design/tokens.css — the single token source — and asserts WCAG
 * contrast ratios for
 *   1. the locked ramp pairs of §3.2 / §3.8 of the v7 spec, and
 *   2. the SHIPPING semantic layer (--c-ink / --c-surface / …) in BOTH
 *      themes: ink, ink-2, mute and faint on every surface they sit on,
 *      status text on its soft wash, and the non-text focus ring and
 *      control boundary. (Until the index.html palette moved into
 *      tokens.css this lint certified values that never rendered.)
 *
 * Light values are the :root block; dark values are :root overlaid with the
 * [data-theme="dark"] block, so a ramp step brightened for dark (e.g.
 * --cobalt-300) is checked with its dark value only on dark pairs.
 *
 * Floors (per spec §3.2 contrast contract):
 *   • Body text on any surface           ≥ 7.0:1 (AAA)
 *   • Secondary / muted text, headings   ≥ 4.5:1 (AA)
 *   • Non-text UI (icons, dividers, ring)≥ 3.0:1
 *   • Placeholder text                   ≥ 4.5:1
 */

import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const SRC = 'src/design/tokens.css';
const { light, dark } = parseThemes(readFileSync(SRC, 'utf8'));

const FAIL = [];

/* ─── Locked test pairs ─────────────────────────────────────────── */
/* ─── Locked ramp pairs (§3.2 / §3.8) ─── */
const RAMP_PAIRS = [
  // Light theme — body
  { kind:'body',   floor:7.0, fg:'slate-900', bg:'slate-0',    note:'ink on white' },
  { kind:'body',   floor:7.0, fg:'slate-900', bg:'slate-50',   note:'ink on subdued' },
  { kind:'place',  floor:4.5, fg:'slate-500', bg:'slate-50',   note:'muted label on subdued (bg-slate-50)' },
  { kind:'body',   floor:7.0, fg:'slate-600', bg:'slate-0',    note:'muted body on white' },
  // Light — headings (4.5:1 floor)
  { kind:'head',   floor:4.5, fg:'slate-800', bg:'slate-0',    note:'heading on white' },
  // Light — placeholders (4.5:1 floor)
  { kind:'place',  floor:4.5, fg:'slate-500', bg:'slate-0',    note:'placeholder on white' },
  // Light — cobalt button label on cobalt fill
  { kind:'body',   floor:4.5, fg:'slate-0',   bg:'cobalt-600', note:'white text on cobalt-600 button' },
  { kind:'body',   floor:4.5, fg:'slate-0',   bg:'cobalt-700', note:'white text on cobalt-700 hover' },
  // Light — link
  { kind:'body',   floor:4.5, fg:'link-600',  bg:'slate-0',    note:'link blue on white' },
  // Light — semantic text on soft surface
  { kind:'body',   floor:4.5, fg:'crit-800',  bg:'crit-50',    note:'crit text on crit-50' },
  { kind:'body',   floor:4.5, fg:'warn-800',  bg:'warn-50',    note:'warn text on warn-50' },
  { kind:'body',   floor:4.5, fg:'ok-800',    bg:'ok-50',      note:'ok text on ok-50' },
  { kind:'body',   floor:4.5, fg:'info-900',  bg:'info-50',    note:'info text on info-50' },
  // Dark theme — body
  { kind:'body',   floor:7.0, fg:'slate-50',  bg:'slate-950',  note:'inverted ink on dark canvas' },
  { kind:'body',   floor:7.0, fg:'slate-200', bg:'slate-900',  note:'secondary on dark card' },
  // Dark — cobalt label
  { kind:'body',   floor:4.5, fg:'cobalt-400',bg:'slate-950',  note:'cobalt-400 button label on dark' },
  // Dark — link
  { kind:'body',   floor:4.5, fg:'link-400',  bg:'slate-950',  note:'link blue on dark' },
  // Dark — semantic
  { kind:'body',   floor:4.5, fg:'crit-200',  bg:'crit-950',   note:'crit-200 on crit-950' },
  { kind:'body',   floor:4.5, fg:'warn-200',  bg:'warn-950',   note:'warn-200 on warn-950' },
  { kind:'body',   floor:4.5, fg:'ok-200',    bg:'ok-950',     note:'ok-200 on ok-950' },
  // Non-text — focus ring (3:1; WCAG SC 1.4.11 Non-text Contrast)
  { kind:'nontext',floor:3.0, fg:'cobalt-500',bg:'slate-0',    note:'focus ring on white' },
  { kind:'nontext',floor:3.0, fg:'cobalt-300',bg:'slate-950',  note:'focus ring on dark' },
  // Hairline contrast (slate-200 on white = 1.23:1) is intentionally NOT
  // enforced — WCAG 1.4.11 exempts "structural decoration that doesn't
  // convey information" and a 3:1 hairline would render as a heavy
  // divider, defeating the v7 spec's "1px hairline, never 2px" rule.
  // The patch bundle's README listed this pair in its 21/21 count; the
  // delta is intentional after the spec-vs-WCAG reconciliation here.
];

/* Which theme each ramp pair belongs to: the "Dark …" pairs above use the
   dark overlay (brightened cobalt-300 / link-400 …), everything else light. */
const DARK_RAMP_NOTES = new Set([
  'inverted ink on dark canvas', 'secondary on dark card', 'cobalt-400 button label on dark',
  'link blue on dark', 'crit-200 on crit-950', 'warn-200 on warn-950', 'ok-200 on ok-950',
  'focus ring on dark'
]);

/* ─── Shipping semantic layer (--c-*), both themes ─── */
const SURFACES = ['c-surface', 'c-sunken', 'c-muted', 'c-canvas', 'c-shell'];
const SEMANTIC_PAIRS = [];
for (const theme of ['light', 'dark']) {
  for (const bg of SURFACES) {
    SEMANTIC_PAIRS.push({ theme, kind: 'body', floor: 7.0, fg: 'c-ink', bg, note: `${theme}: ink on ${bg}` });
  }
  for (const bg of ['c-surface', 'c-sunken', 'c-muted', 'c-canvas']) {
    SEMANTIC_PAIRS.push({ theme, kind: 'head', floor: 4.5, fg: 'c-ink-2', bg, note: `${theme}: ink-2 on ${bg}` });
    SEMANTIC_PAIRS.push({ theme, kind: 'head', floor: 4.5, fg: 'c-mute', bg, note: `${theme}: mute on ${bg}` });
  }
  SEMANTIC_PAIRS.push({ theme, kind: 'place', floor: 4.5, fg: 'c-faint', bg: 'c-surface', note: `${theme}: placeholder (faint) on surface` });
  SEMANTIC_PAIRS.push({ theme, kind: 'body', floor: 4.5, fg: 'c-accent-ink', bg: 'c-accent-soft', note: `${theme}: accent-ink on accent-soft` });
  for (const s of ['critical', 'confirm', 'caution', 'reference']) {
    SEMANTIC_PAIRS.push({ theme, kind: 'body', floor: 4.5, fg: `c-${s}`, bg: `c-${s}-soft`, note: `${theme}: ${s} on ${s}-soft` });
  }
  for (const bg of ['c-surface', 'c-canvas']) {
    SEMANTIC_PAIRS.push({ theme, kind: 'nontext', floor: 3.0, fg: 'c-focus', bg, note: `${theme}: focus ring on ${bg}` });
  }
  for (const bg of ['c-surface', 'c-sunken']) {
    SEMANTIC_PAIRS.push({ theme, kind: 'nontext', floor: 3.0, fg: 'control-edge', bg, note: `${theme}: checkbox/radio boundary on ${bg}` });
  }
}

const PAIRS = [
  ...RAMP_PAIRS.map((p) => ({ ...p, theme: DARK_RAMP_NOTES.has(p.note) ? 'dark' : 'light' })),
  ...SEMANTIC_PAIRS
];


for (const p of PAIRS) {
  const tokens = p.theme === 'dark' ? dark : light;
  const fg = tokens[p.fg], bg = tokens[p.bg];
  if (!fg || !bg) {
    FAIL.push({ ...p, ratio: null, error: `unknown token (fg=${p.fg} bg=${p.bg})` });
    continue;
  }
  const ratio = contrast(fg, bg);
  if (ratio + 0.001 < p.floor) FAIL.push({ ...p, ratio });
}

if (FAIL.length === 0) {
  console.log(`✓ lint:contrast — ${PAIRS.length} pairs verified ≥ floor`);
  exit(0);
}

console.error(`✕ lint:contrast — ${FAIL.length} pair(s) below floor:`);
for (const f of FAIL) {
  const r = f.error ? f.error : `${f.ratio.toFixed(2)}:1 (floor ${f.floor}:1)`;
  console.error(`  [${f.kind}] ${f.note} — ${r}`);
}
exit(1);

/* ─── Parsing & color math ─────────────────────────────────────── */

function parseThemes(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector) => {
    const i = css.indexOf(selector + ' {');
    if (i < 0) throw new Error(`${SRC}: no "${selector} {" block`);
    return css.slice(i, css.indexOf('}', i));
  };
  const decls = (text) => {
    const out = {};
    for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
    return out;
  };
  const rootDecls = decls(block(':root'));
  const darkDecls = { ...rootDecls, ...decls(block('[data-theme="dark"]')) };
  return { light: resolveAll(rootDecls), dark: resolveAll(darkDecls) };
}

/* Resolve every declaration to [r,g,b] where it is a colour: an RGB triplet
   ("23 47 59"), a reference to one ("var(--slate-500)"), or a full colour
   built from one ("rgb(var(--slate-500))"). Everything else is skipped. */
function resolveAll(declsMap) {
  const out = {};
  const resolve = (name, depth = 0) => {
    const raw = declsMap[name];
    if (raw === undefined || depth > 8) return null;
    let m = raw.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
    if (m) return [+m[1], +m[2], +m[3]];
    m = raw.match(/^(?:rgb\()?var\(--([a-z0-9-]+)\)\)?$/);
    if (m) return resolve(m[1], depth + 1);
    return null;
  };
  for (const name of Object.keys(declsMap)) {
    const rgb = resolve(name);
    if (rgb) out[name] = rgb;
  }
  return out;
}

function relLum(rgb) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const L1 = relLum(a), L2 = relLum(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
