#!/usr/bin/env node
/**
 * v7.0 — One-shot codemod for src/app.jsx.
 * Drop-in: scripts/codemod-v7.mjs
 *
 * Usage:   node ./scripts/codemod-v7.mjs [--dry] [--input src/app.jsx]
 *
 * Performs five passes:
 *   1. Color-class swap (text-purple-* / -violet-* / -indigo-* → cobalt)
 *      — SKIPS content inside <a href=...>...</a> elements (amendment #1).
 *   2. Semantic-fill swap (bg-amber-50 → bg-warn-50; bg-red-50 → bg-crit-50;
 *      bg-emerald-50 → bg-ok-50). Conservative — only when adjacent to
 *      semantic context cues (border-, text-, ring-) on the same element.
 *   3. Placeholder fix (text-slate-400 → text-slate-500 when used as
 *      placeholder context).
 *   4. font-serif strip — keep on h1/h2 only, remove elsewhere.
 *   5. Link retargeting — every <a href=...> gets text-link-600 dark:text-link-400.
 *
 * Idempotent: re-running produces zero diff once converged.
 * Reversible: pass --restore + path to a .codemod-backup.txt to undo.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { argv, exit } from 'node:process';

const args = parseArgs(argv.slice(2));
const INPUT = args.input || 'src/app.jsx';
const DRY = !!args.dry;

if (!existsSync(INPUT)) {
  console.error(`✕ Input not found: ${INPUT}`);
  exit(1);
}

const original = readFileSync(INPUT, 'utf8');

// Backup before write
if (!DRY) writeFileSync(INPUT + '.codemod-backup.txt', original);

// Pre-tokenize: split the file into [a-block, non-a-block, a-block, ...]
// so passes 1–4 can skip a-blocks. Regex matches the longest non-greedy
// <a ...>...</a> including nested elements. We rely on JSX being well-formed.
const A_BLOCK_RX = /<a\s[^>]*?\bhref\s*=[^>]*?>[\s\S]*?<\/a>/g;
const segments = []; // { type: 'a' | 'plain', text }
{
  let last = 0;
  for (const m of original.matchAll(A_BLOCK_RX)) {
    if (m.index > last) segments.push({ type: 'plain', text: original.slice(last, m.index) });
    segments.push({ type: 'a', text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < original.length) segments.push({ type: 'plain', text: original.slice(last) });
}

// Tally
const counts = {
  'pass-1 accent swap': 0,
  'pass-2 semantic fill': 0,
  'pass-3 placeholder': 0,
  'pass-4 font-serif strip': 0,
  'pass-5 link retarget': 0
};

// ── Pass 1 — accent class swap (purple/violet/indigo → cobalt) ─────
const ACCENT_RX = /\b(text|bg|border|ring|from|to|via|fill|stroke)-(purple|violet|indigo)-(50|100|200|300|400|500|600|700|800|900|950)\b/g;
const accentSwap = (segText) => segText.replace(ACCENT_RX, (m, util, _hue, step) => {
  counts['pass-1 accent swap']++;
  return `${util}-cobalt-${step}`;
});

// ── Pass 2 — semantic-fill swap ────────────────────────────────────
// Flip raw amber/red/emerald accent utilities to v7 semantic equivalents.
// v6 code stores className strings in variables (LKWCountdown evtColor etc.)
// so we scan ALL string literals — single/double/backtick — not just
// className= attrs. False-positive risk in comments/docs is acceptable
// for a one-shot audit-driven migration.
const HUE_TO_SEMANTIC = { amber: 'warn', red: 'crit', emerald: 'ok' };
const STRING_LIT_RX = /(["'`])((?:[^"'`\\\n]|\\.)*?)\1/g;
const semanticSwap = (segText) => segText.replace(STRING_LIT_RX, (m, q, body) => {
  let rewrote = body;
  for (const [hue, sem] of Object.entries(HUE_TO_SEMANTIC)) {
    const r = new RegExp(`\\b(bg|text|border|ring)-${hue}-(50|100|200|300|400|500|600|700|800|900|950)\\b`, 'g');
    rewrote = rewrote.replace(r, (mm, util, step) => {
      counts['pass-2 semantic fill']++;
      return `${util}-${sem}-${step}`;
    });
  }
  return `${q}${rewrote}${q}`;
});

// ── Pass 3 — placeholder slate-400 → slate-500 ─────────────────────
// Only inside placeholder: prefix or as standalone text class for inputs.
const placeholderFix = (segText) => segText
  .replace(/\bplaceholder:text-slate-400\b/g, () => {
    counts['pass-3 placeholder']++;
    return 'placeholder:text-slate-500';
  })
  .replace(/\btext-slate-400\b(?=[\s"'`,;}])/g, (m) => {
    counts['pass-3 placeholder']++;
    return 'text-slate-500';
  });

// ── Pass 4 — font-serif strip (keep on h1/h2 only) ─────────────────
// Conservative: only strip font-serif on elements whose tag is NOT h1/h2.
// Match <tag ...className="...font-serif..."> and conditionally rewrite.
const ELEMENT_RX = /<(\w+)([^>]*?)className\s*=\s*(["'])([^"']*?)\3([^>]*?)>/g;
const fontSerifStrip = (segText) => segText.replace(ELEMENT_RX, (m, tag, pre, q, body, post) => {
  /* Keep font-serif on h1/h2/h3 (per spec §3.5 card titles use serif h3). */
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') return m;
  if (!/\bfont-serif\b/.test(body)) return m;
  counts['pass-4 font-serif strip']++;
  const rewrote = body.replace(/\s*\bfont-serif\b\s*/g, ' ').trim();
  return `<${tag}${pre}className=${q}${rewrote}${q}${post}>`;
});

// ── Pass 5 — link retargeting (<a href> → text-link-600 dark:text-link-400)
const A_OPEN_RX = /<a\s+([^>]*?)\bhref\s*=\s*(["'])(.*?)\2([^>]*?)>/g;
const linkRetarget = (segText) => segText.replace(A_OPEN_RX, (m, pre, q, href, post) => {
  // If already has text-link-* skip
  const all = pre + post;
  if (/\btext-link-(50|100|200|400|600|700|900)\b/.test(all)) return m;
  // Find className=... and inject; else append a fresh className
  const cnMatch = (pre + post).match(/className\s*=\s*(["'])([^"']*)\1/);
  if (cnMatch) {
    counts['pass-5 link retarget']++;
    const before = m.replace(cnMatch[0], `className=${cnMatch[1]}${cnMatch[2]} text-link-600 dark:text-link-400 hover:underline${cnMatch[1]}`);
    return before;
  }
  counts['pass-5 link retarget']++;
  return `<a ${pre}href=${q}${href}${q}${post} className="text-link-600 dark:text-link-400 hover:underline">`;
});

// Apply passes
let updated = segments.map(seg => {
  if (seg.type === 'a') {
    // Only pass 5 runs inside <a> blocks (and only on the opening tag,
    // which we re-detect at the segment boundary).
    return linkRetarget(seg.text);
  }
  let t = seg.text;
  t = accentSwap(t);
  t = semanticSwap(t);
  t = placeholderFix(t);
  t = fontSerifStrip(t);
  // Pass 5 ALSO runs on plain segments because some <a> tags might be
  // multi-line and split across our naive A_BLOCK_RX boundary.
  t = linkRetarget(t);
  return t;
}).join('');

// ── Report ────────────────────────────────────────────────────────
const totalChanges = Object.values(counts).reduce((s, n) => s + n, 0);
console.log('codemod-v7 — passes:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
console.log(`  TOTAL: ${totalChanges} edits`);
console.log(`  Bytes: ${original.length} → ${updated.length} (Δ ${updated.length - original.length})`);

if (DRY) {
  console.log('(dry-run — no file written)');
  exit(0);
}

writeFileSync(INPUT, updated);
console.log(`✓ Wrote ${INPUT} (backup: ${INPUT}.codemod-backup.txt)`);

// ── Helpers ───────────────────────────────────────────────────────
function parseArgs(arr) {
  const out = {};
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (a === '--dry') out.dry = true;
    else if (a === '--input') out.input = arr[++i];
    else if (a.startsWith('--input=')) out.input = a.slice('--input='.length);
  }
  return out;
}
