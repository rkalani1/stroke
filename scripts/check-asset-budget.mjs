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

function corePrecacheBytes() {
  const source = readFileSync(join(repoRoot, 'service-worker.js'), 'utf8');
  const match = source.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('CORE_ASSETS not found in service-worker.js');
  // eslint-disable-next-line no-eval
  const assets = eval(match[1]);
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

const checks = [
  {
    id: 'app-js-gzip',
    label: 'app.js (gzip)',
    actual: gzipSizeOf('app.js'),
    budget: 1000 * KB,
    unit: KB,
    unitLabel: 'KB',
    note: 'route-level code splitting is the lever that moves this',
  },
  {
    id: 'app-js-raw',
    label: 'app.js (raw)',
    actual: sizeOf('app.js'),
    budget: 4 * MB,
    unit: MB,
    unitLabel: 'MB',
    note: 'parse/execute cost scales with this, not the gzip figure',
  },
  {
    id: 'tailwind-css',
    label: 'tailwind.css',
    actual: sizeOf('tailwind.css'),
    budget: 200 * KB,
    unit: KB,
    unitLabel: 'KB',
    note: '',
  },
  {
    id: 'sw-precache',
    label: `service-worker precache (${precache.count} entries)`,
    actual: precache.total,
    budget: 6 * MB,
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
    ok: results.every((r) => r.ok),
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
