#!/usr/bin/env node
/**
 * v7.0 — lint:tokens.
 * Drop-in: scripts/lint-tokens.mjs
 *
 * Rejects:
 *   • text-purple-* / text-violet-* / text-indigo-* (any util, any step)
 *     in non-link context — links use text-link-*.
 *   • bg-amber-50 / bg-red-50 / bg-emerald-50 raw outside the v7 semantic
 *     aliases (warn-50, crit-50, ok-50).
 *   • text-slate-400 as text class (placeholder fails AA on white).
 *   • Icon-only <Button variant="icon" …> without an aria-label.
 *   • font-serif outside h1/h2.
 *
 * And, in stylesheets (src/**\/*.css, index.html, offline.html):
 *   • any `html.dark` / `.dark` selector — dark mode keys on
 *     [data-theme="dark"] on <html> and nothing else;
 *   • a custom property declared on :root / html / [data-theme…] outside
 *     src/design/tokens.css — that file is the single token source;
 *   • the same custom property declared twice in one tokens.css block.
 *
 * Run with `npm run lint:tokens` (CI runs it; it is not part of `npm test`).
 *
 * Class rules scan .jsx files under src/ except src/design/* (those are the
 * new v7 primitives and source of truth).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { exit } from 'node:process';

const ROOT = 'src';
const SKIP_DIRS = new Set(['design', 'evidence', 'guidelines']);

const errors = [];

const rules = [
  {
    name: 'forbidden-accent-class',
    rx: /\b(text|bg|border|ring|from|to|via|fill|stroke)-(purple|violet|indigo)-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
    msg: (m) => `forbidden accent class \`${m[0]}\` — use cobalt-* instead (links use link-*).`
  },
  {
    name: 'raw-semantic-hue',
    rx: /\b(bg|text|border|ring)-(amber|red|emerald)-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
    msg: (m) => {
      const repl = { amber: 'warn', red: 'crit', emerald: 'ok' }[m[2]];
      return `raw \`${m[0]}\` — use ${m[1]}-${repl}-${m[3]} (v7 semantic).`;
    }
  },
  {
    name: 'placeholder-slate-400',
    /* Match the FULL utility token (including any Tailwind variant chain)
       then exempt anything qualified by dark: or disabled: — those are
       intentional and have their own contrast contracts. The remaining
       violations are unconditional text-slate-400 / placeholder:text-slate-400
       in light mode (fails AA on white). */
    rx: /(?:^|[\s"'`{])([a-z-]+:)*?(placeholder:text-slate-400|text-slate-400)\b/g,
    msg: (m) => `\`${m[0].trim()}\` fails AA on white. Use slate-500 (4.5:1).`,
    skip: (m) => /(?:^|[^a-z])(dark:|disabled:|focus(?:-visible)?:|active:)/.test(m[0])
  }
];

/* AST-light lint for icon-only Button missing aria-label.
   Matches <Button variant="icon" ... > with no aria-label= inside the tag. */
const ICON_BTN_RX = /<Button\b([^>]*?)\bvariant\s*=\s*["']icon["']([^>]*?)>/g;

function lintFile(path) {
  const src = readFileSync(path, 'utf8');

  for (const r of rules) {
    for (const m of src.matchAll(r.rx)) {
      if (r.skip && r.skip(m)) continue;
      errors.push({ path, line: lineOf(src, m.index), msg: r.msg(m), rule: r.name });
    }
  }

  for (const m of src.matchAll(ICON_BTN_RX)) {
    const tagBody = (m[1] || '') + (m[2] || '');
    if (!/\baria-label\s*=/.test(tagBody)) {
      errors.push({
        path,
        line: lineOf(src, m.index),
        msg: '<Button variant="icon"> missing aria-label',
        rule: 'icon-btn-aria-label'
      });
    }
  }

  /* font-serif scoped to headings (h1/h2/h3). Spec §3.5 card titles use
     serif h3; spec §3.3 narrows serif to h1/h2 elsewhere. The lint
     enforces the union: serif on heading tags only, never on <div>/<p>/<span>. */
  const TAG_RX = /<(\w+)([^>]*?)className\s*=\s*["'`]([^"'`]*?\bfont-serif\b[^"'`]*?)["'`]/g;
  for (const m of src.matchAll(TAG_RX)) {
    const tag = m[1];
    if (tag !== 'h1' && tag !== 'h2' && tag !== 'h3') {
      errors.push({
        path, line: lineOf(src, m.index),
        msg: `font-serif on <${tag}> — v7 reserves Newsreader for h1/h2/h3`,
        rule: 'font-serif-restricted'
      });
    }
  }
}

function lineOf(src, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) line++;
  return line;
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full);
    } else if (full.endsWith('.jsx')) {
      lintFile(full);
    }
  }
}

walk(ROOT);

/* ─── Stylesheet guards: one dark hook, one token source ─── */
const TOKENS_CSS = 'src/design/tokens.css';
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
const inlineStyles = (html) => {
  // Keep offsets (for line numbers): blank everything outside <style> blocks.
  let out = html.replace(/[^\n]/g, ' ');
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf(m[1]);
    out = out.slice(0, start) + m[1] + out.slice(start + m[1].length);
  }
  return out;
};
function cssFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { if (!SKIP_DIRS.has(name) || name === 'design') out.push(...cssFiles(full)); }
    else if (full.endsWith('.css')) out.push(full);
  }
  return out;
}
const sheets = [
  ...cssFiles(ROOT).map((path) => ({ path, css: stripComments(readFileSync(path, 'utf8')) })),
  ...['index.html', 'offline.html'].map((path) => ({ path, css: stripComments(inlineStyles(readFileSync(path, 'utf8'))) }))
];
for (const { path, css } of sheets) {
  // Selector text only: whatever precedes a `{`, back to the previous `;`, `{` or `}`.
  for (const m of css.matchAll(/(?<=^|[;{}])([^;{}]*)\{/g)) {
    const selector = m[1];
    const at = m.index + (selector.length - selector.trimStart().length);
    // `.dark` as a class (html.dark, .dark .x, …) — not `.dark-mode-toggle`,
    // not an escaped Tailwind variant class such as `.dark\:bg-card`.
    if (/\.dark(?![\w-]|\\:)/.test(selector)) {
      errors.push({ path, line: lineOf(css, at), rule: 'dark-class-selector',
        msg: `\`${selector.trim().replace(/\s+/g, ' ').slice(0, 80)}\` — dark mode keys on [data-theme="dark"] only; no html.dark / .dark selectors.` });
    }
  }
  if (path === TOKENS_CSS) continue;
  for (const m of css.matchAll(/(^|[;{}])\s*((?::root|html)(?:\[[^\]]*\])?|\[data-theme[^\]]*\])\s*\{([^{}]*)\}/g)) {
    const decl = m[3].match(/--[\w-]+(?=\s*:)/);
    if (decl) {
      errors.push({ path, line: lineOf(css, m.index + m[0].indexOf(m[2])), rule: 'token-outside-tokens-css',
        msg: `\`${decl[0]}\` declared on \`${m[2]}\` — tokens are declared in ${TOKENS_CSS} only.` });
    }
  }
}
{
  const css = stripComments(readFileSync(TOKENS_CSS, 'utf8'));
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seen = new Map();
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:/g)) {
      if (seen.has(d[1])) {
        errors.push({ path: TOKENS_CSS, line: lineOf(css, m.index + m[1].length + 1 + d.index), rule: 'duplicate-token',
          msg: `\`${d[1]}\` is declared twice in \`${m[1].trim()}\` — one declaration per token.` });
      }
      seen.set(d[1], true);
    }
  }
}

if (errors.length === 0) {
  console.log('✓ lint:tokens — clean');
  exit(0);
}

console.error(`✕ lint:tokens — ${errors.length} violation(s):`);
for (const e of errors.slice(0, 200)) {
  console.error(`  ${e.path}:${e.line}  [${e.rule}]  ${e.msg}`);
}
if (errors.length > 200) console.error(`  …and ${errors.length - 200} more`);
exit(1);
