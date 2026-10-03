#!/usr/bin/env node
/**
 * Asset budget gate.
 *
 * The Lighthouse workflow gates Accessibility and Best Practices at 90 but
 * writes Performance as advisory, because a Lighthouse score on a hosted run
 * is CDN- and device-sensitive. That left nothing watching payload size: the
 * bundle grew from 2.5 MB / 691 KB gzip (2026-05-29 assessment) to
 * 3.79 MB / 888 KB gzip by v6.22.0 — a 52% increase in ~3 months — with no
 * check to catch it.
 *
 * Bytes are deterministic and host-independent, so they make a gate that a
 * score cannot. Budgets are set just above today's measurements: they do not
 * demand an improvement, they stop a further slide. Lower them when a real
 * reduction lands (route splitting, WebP infographics).
 *
 * Usage:  node scripts/check-asset-budget.mjs [--json]
 * Exits non-zero on breach.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.includes('--json');

const KB = 1024;
const MB = 1024 * 1024;

const sizeOf = (rel) => (existsSync(join(repoRoot, rel)) ? statSync(join(repoRoot, rel)).size : null);

const gzipSizeOf = (rel) => {
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) return null;
  return gzipSync(readFileSync(abs), { level: 9 }).length;
};

const manifest = JSON.parse(readFileSync(join(repoRoot, 'app-assets.json'), 'utf8'));
const manifestProblems = [];
if (manifest.buildTarget !== 'public') manifestProblems.push('Deployed browser manifest must identify a public build');
if (manifest.appVersion !== JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version) manifestProblems.push('Browser manifest version is stale');
for (const file of manifest.files) {
  if (!/^(app\.js|chunks\/[A-Za-z0-9_-]+\.js)$/.test(file.path)) { manifestProblems.push(`Invalid generated asset path: ${file.path}`); continue; }
  if (!existsSync(join(repoRoot, file.path))) { manifestProblems.push(`Missing generated asset: ${file.path}`); continue; }
  const bytes = readFileSync(join(repoRoot, file.path));
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) manifestProblems.push(`Generated asset checksum mismatch: ${file.path}`);
}
if (!manifest.initial.includes(manifest.entry) || manifest.initial.some(file => !manifest.files.some(entry => entry.path === file))) manifestProblems.push('Initial module graph is incomplete');
const sumSizes = (files, measure) => files.reduce((sum, rel) => sum + (measure(rel) ?? Infinity), 0);

function corePrecacheBytes() {
  const source = readFileSync(join(repoRoot, 'service-worker.js'), 'utf8');
  const match = source.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('CORE_ASSETS not found in service-worker.js');
  // eslint-disable-next-line no-eval
  const chunksMatch = source.match(/const APP_CHUNKS = (\[[\s\S]*?\]);/);
  if (!chunksMatch) throw new Error('APP_CHUNKS not found in service-worker.js');
  const chunks = JSON.parse(chunksMatch[1]);
  const expectedChunks = manifest.files.filter(file => file.path !== manifest.entry).map(file => './' + file.path).sort();
  if (JSON.stringify([...chunks].sort()) !== JSON.stringify(expectedChunks)) manifestProblems.push('Service-worker chunk list does not match the generated browser manifest');
  const assets = [...eval(match[1]), ...chunks];
  let total = 0;
  const missing = [];
  for (const asset of assets) {
    const rel = asset === './' ? 'index.html' : asset.replace(/^\.\//, '');
    const size = sizeOf(rel);
    if (size === null) missing.push(rel);
    else total += size;
  }
  return { total, count: assets.length, missing };
}

const precache = corePrecacheBytes();

// BUDGET HISTORY
// 2026-08-28: app.js raw 4 -> 5 MB, gzip 1000 -> 1300 KB.
// The evidence atlas grew from 131 to 237 completed trials (+102 citations,
// +19 society guideline documents) in one reviewed literature refresh, which
// took app.js from 3.62 MB to 4.30 MB raw / 1.07 MB gzip. The payload is data,
// not code: src/evidence/completedTrials.js alone went 243 KB -> 744 KB and is
// imported eagerly through src/evidence/index.js.
// This was raised deliberately rather than by trimming records, because the
// per-record prose carries the caveats that make a trial card safe to read
// (stopped-early status, as-treated vs randomized, non-inferiority margins).
// The real lever remains route-level code splitting: the atlas is only needed
// by the Reference Library and education views, so lazy-loading the evidence
// layer would return roughly half a megabyte to first load. Until that lands,
// treat further growth here as a prompt to split, not to raise again.

// 2026-08-29: app.js raw 5 -> 6 MB, gzip 1300 -> 1600 KB, precache 6 -> 8 MB.
// The guideline library went from 108 placeholder datasets (1010 recommendations,
// most of them a single "scope" line quoting an abstract) to complete extracted
// recommendation sets: 3547 recommendations across the same 108 documents.
//
// Splitting preserves offline availability by precaching all modules while
// delaying parsing and execution of reference modules until requested. The
// whole install retains its separate 8 MB limit; the initial graph now has its
// own stricter limits so moving bytes to a shared eager chunk cannot hide growth.
//
// The one real saving available is de-duplication: the same content ships twice,
// bundled into app.js via src/guideline-library.js AND as static data/guidelines/
// files (~2.2 MB each). Collapsing those to a single precached source is the next
// lever, and it is a refactor worth doing deliberately rather than under a budget
// alarm. Until then, further growth here should be met by de-duplicating, not by
// raising these numbers a third time.

// 2026-09-27 (v6.29.0): app.js raw 6 -> 6.5 MB only; gzip (1600 KB) and
// precache (8 MB) are unchanged. The clinical accuracy audit and evidence
// currency pass took app.js from 5.93 MB to 6.16 MB raw (gzip 1543 KB, 96%).
// The growth is verified clinical data, not code: 12 new completed trials plus
// corrected records (+108 KB in completedTrials.js), audit corrections and the
// now-rendered disclaimer footer in app.jsx (+51 KB), and 17 new citations.
// Emitting UTF-8 instead of \u escapes would save only ~22 KB. This departs
// from the note above: the guideline de-duplication it describes remains the
// required next lever before any further raise, and this raise is flagged for
// owner review in the release report.

// 2026-10-01 Encounter-first: initial 300KB raw/100KB gzip; all JS
// 600KB raw/180KB gzip; CSS90KB; complete precache2MB. Tightened after measurement.
// v7.0.1 owner-requested Trials restoration adds 89.8KB of deferred UI/data.
// Reuse canonical table criteria and keep the initial/gzip/CSS/cache ceilings;
// reviewed whole-JS raw ceiling is now640KB (~627KB measured, no packed-data layer).
// v7.1.0 restores 13 worksheets, optional Encounter documentation and Trials UI.
// Keep initial300KB/100KB, CSS90KB and cache2MB ceilings; source/UI prose is lazy.
// Measured complete JS is about700KB raw/195KB gzip; bounded new ceilings below.
// 2026-10-03 clinical audit: IVT lab/anticoagulant safety holds, NIHSS UN totals,
// DAPT guideline tiers and dose-display rounding add ~1.5KB gzip to the initial
// graph (measured 101.2KB); the deferred bedside QuickReference adds ~5KB gzip
// once Protocols renders it. Reviewed ceilings: initial 102KB, whole-JS 208KB gzip.
// 2026-10-03 Trials registry audit (flagged for owner review): the explicit
// Encounter-to-Trials import reuses the canonical workspace-state/GCS helpers,
// so esbuild moves them out of app.js into a shared initial chunk. Initial raw
// bytes are unchanged (~0.3 MB); gzip rises ~1 KB from the chunk boundary
// (99.7% -> 100.7% of the old 100 KB). FASTEST Part 2, SISTER, PICASSO and
// CAPTIVA profiles plus the compact screener add ~8.5 KB gzip of deferred
// Trials data/UI. Ceilings: initial gzip 100 -> 101 KB; all JS gzip 196 -> 202 KB.
// 2026-10-03 deep review (integrated): pinned case bar, global quick search
// (lazy), tap-to-score NIHSS and vessel chips, bedside QuickReference (lazy),
// verified clinical-audit corrections, live calculator scoring, the Trials
// registry audit with Encounter import, and the Evidence overhaul (92 topics,
// 88 study summaries, 80 verbatim guideline recommendations). Measured after
// integration: initial 107 KB gzip / 0.31 MB raw, all JS 221 KB gzip /
// 0.74 MB raw, CSS 104 KB raw (17.6 KB gzip), precache 2.05 MB. Reviewed
// ceilings leave ~5% headroom: initial 112 KB gzip / 330 KB raw, all JS
// 232 KB gzip / 780 KB raw, CSS 110 KB, precache 2.2 MB.
// 2026-10-03 v7.7.3 on-call pass: patient-specific 4F-PCC arithmetic, ICH
// neurosurgery and post-thrombolysis prompts, open-item checks on recorded IVT,
// phase-specific case-bar BP flags and next-check display, wake-up handling with
// a known LKW, protocol-card prefill and new jump targets. Measured: initial
// 113 KB gzip / 0.32 MB raw, all JS 231 KB gzip / 0.76 MB raw. Reviewed ceilings
// keep ~3% headroom: initial 116 KB gzip / 340 KB raw, all JS 240 KB gzip / 800 KB raw.
// The round-3 visual pass (protocol disclosure markers, touch sizing, dark selected
// states, phone case-bar rules) takes tailwind.css to 111 KB raw; CSS ceiling 110 -> 114 KB.
// 2026-10-03 v7.7.4 implementation review: local-first reversal lines, symptom-
// conditional post-lytic prompts, IVT-card imaging fixes and note validation add
// 3.6 KB raw / 1.3 KB gzip to the initial graph (React is 134 KB of it). Measured:
// initial 115.4 KB gzip / 339 KB raw, all JS 234 KB gzip / 0.77 MB raw. Reviewed
// ceilings restore ~3% headroom: initial 120 KB gzip / 352 KB raw, all JS 248 KB
// gzip / 820 KB raw.
const checks = [
  {
    id: 'app-js-gzip',
    label: 'Initial module graph (gzip)',
    actual: sumSizes(manifest.initial, gzipSizeOf),
    budget: 120 * KB,
    unit: KB,
    unitLabel: 'KB',
    note: 'route-level code splitting is the lever that moves this',
  },
  {
    id: 'app-js-raw',
    label: 'Initial module graph (raw)',
    actual: sumSizes(manifest.initial, sizeOf),
    budget: 352 * KB,
    unit: MB,
    unitLabel: 'MB',
    note: 'parse/execute cost scales with this, not the gzip figure',
  },
  {
    id: 'all-js-gzip', label: 'All offline JavaScript (gzip)',
    actual: sumSizes(manifest.files.map(file => file.path), gzipSizeOf),
    budget: 248 * KB, unit: KB, unitLabel: 'KB', note: 'Deferred modules still count toward the whole payload',
  },
  {
    id: 'all-js-raw', label: 'All offline JavaScript (raw)',
    actual: sumSizes(manifest.files.map(file => file.path), sizeOf),
    budget: 820 * KB, unit: MB, unitLabel: 'MB', note: '',
  },
  {
    id: 'tailwind-css',
    label: 'tailwind.css',
    actual: sizeOf('tailwind.css'),
    budget: 114 * KB,
    unit: KB,
    unitLabel: 'KB',
    note: '',
  },
  {
    id: 'sw-precache',
    label: `service-worker precache (${precache.count} entries)`,
    actual: precache.total,
    budget: 2.2 * MB,
    unit: MB,
    unitLabel: 'MB',
    note: 'what a first-time visitor downloads before the app is offline-ready',
  },
];

const results = checks.map((check) => ({
  ...check,
  ok: check.actual !== null && check.actual <= check.budget,
  missing: check.actual === null,
}));

if (asJson) {
  console.log(JSON.stringify({
    ok: results.every((r) => r.ok) && !precache.missing.length && !manifestProblems.length,
    manifestProblems,
    precacheMissing: precache.missing,
    checks: results.map(({ id, label, actual, budget, ok }) => ({ id, label, actual, budget, ok })),
  }, null, 2));
} else {
  console.log('Asset budget');
  for (const r of results) {
    if (r.missing) {
      console.log(`  ✗ ${r.label} — file not found (run npm run build)`);
      continue;
    }
    const pct = Math.round((r.actual / r.budget) * 100);
    const actual = (r.actual / r.unit).toFixed(r.unit === MB ? 2 : 0);
    const budget = (r.budget / r.unit).toFixed(r.unit === MB ? 2 : 0);
    console.log(
      `  ${r.ok ? '✓' : '✗'} ${r.label.padEnd(42)} ${actual.padStart(8)} / ${budget} ${r.unitLabel} (${pct}% of budget)`
      + (r.note && !r.ok ? `\n      ${r.note}` : ''),
    );
  }
  if (precache.missing.length) {
    console.log(`\n  ! ${precache.missing.length} precache entries missing on disk: ${precache.missing.join(', ')}`);
  }
}

const breached = results.filter((r) => !r.ok);
if (breached.length) {
  console.error(`\nAsset budget exceeded by ${breached.length} check(s).`);
  console.error('Either bring the payload back under budget, or raise the budget in');
  console.error('scripts/check-asset-budget.mjs as a deliberate, reviewed decision.');
  process.exit(1);
}
if (precache.missing.length) {
  console.error('\nservice-worker.js lists precache entries that do not exist — install would fail.');
  process.exit(1);
}
if (manifestProblems.length) {
  console.error(`\nBrowser asset manifest failed: ${manifestProblems.join('; ')}`);
  process.exit(1);
}
