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
 * Run as part of `npm run lint:tokens` (also wired into npm test).
 *
 * Scans .jsx files under src/ except src/design/* (those are the new v7
 * primitives and source of truth).
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
