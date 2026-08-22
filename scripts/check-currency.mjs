// scripts/check-currency.mjs
//
// Currency report for the /content data layer. Lists every guideline, trial,
// and education entry whose `lastReviewed` is older than N months, together
// with its source URL / PMIDs so a human can re-verify against the source.
//
// This is the low-friction re-verification worklist. It is intentionally
// SEPARATE from validate-content.mjs: validation FAILS the build on staleness
// beyond a hard threshold; this REPORTS the aging worklist at a softer
// threshold so the maintainer can triage before anything breaks CI.
//
// Config / flags:
//   --months N            staleness threshold (default 12)
//   --now YYYY-MM-DD       treat this as "today" (default: system date)
//   --json                machine-readable output
//   --strict              exit non-zero if any entry is stale (for CI gating)
//
// Usage: node scripts/check-currency.mjs --months 12

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const CONTENT = path.join(REPO, 'content');
const argv = process.argv.slice(2);
const args = new Set(argv);

function argVal(flag, fallback) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const MONTHS = Number(argVal('--months', process.env.STROKE_CONTENT_CURRENCY_MONTHS || 12));
const NOW = args.has('--now')
  ? new Date(`${argVal('--now')}T00:00:00Z`)
  : new Date();
const asJson = args.has('--json');
const strict = args.has('--strict');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.json') || p.endsWith('.md')) out.push(p);
  }
  return out;
}

function ageMonths(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return Infinity;
  return (NOW.getUTCFullYear() - d.getUTCFullYear()) * 12 + (NOW.getUTCMonth() - d.getUTCMonth());
}

function recordsOf(file) {
  if (file.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [data];
  }
  return [parseFrontmatter(fs.readFileSync(file, 'utf8')).data];
}

function sourcesOf(rec) {
  const bits = [];
  if (rec.sourceUrl) bits.push(rec.sourceUrl);
  if (Array.isArray(rec.PMIDs) && rec.PMIDs.length) bits.push(`PMID ${rec.PMIDs.join(', ')}`);
  if (rec.PMID) bits.push(`PMID ${rec.PMID}`);
  if (Array.isArray(rec.references)) {
    const pmids = rec.references.map((r) => r && r.pmid).filter(Boolean);
    if (pmids.length) bits.push(`PMID ${pmids.join(', ')}`);
  }
  if (Array.isArray(rec.citationIds) && rec.citationIds.length) bits.push(`cite:${rec.citationIds.join(',')}`);
  return bits.join(' | ') || '(no source recorded)';
}

// Guideline metadata datasets under src/guidelines/*.json. These carry
// publication identity (doi/pmid/urls) but — as of the 89-dataset library —
// no lastReviewed (or equivalent) currency field. Missing currency is
// reported as a WARNING ONLY: it never affects the exit code (including
// --strict, which gates on stale /content entries just as before).
const GUIDELINES_SRC = path.join(REPO, 'src', 'guidelines');
const CURRENCY_FIELDS = ['lastReviewed', 'lastUpdated', 'reviewedDate', 'retrievedDate'];

function guidelineMetaCurrency() {
  const missing = [];
  let datasets = 0;
  if (!fs.existsSync(GUIDELINES_SRC)) return { datasets, missing };
  for (const entry of fs.readdirSync(GUIDELINES_SRC)) {
    if (!entry.endsWith('.json')) continue;
    const file = path.join(GUIDELINES_SRC, entry);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      continue; // malformed JSON is validate-content's problem, not currency's
    }
    // A dataset is a guideline record (has an id). landmark-trials.json is a
    // trial-grouping index without per-dataset identity; skip non-records.
    if (!data || Array.isArray(data) || typeof data !== 'object' || !data.id) continue;
    datasets += 1;
    if (!CURRENCY_FIELDS.some((f) => data[f])) {
      missing.push({ id: data.id, file: path.relative(REPO, file) });
    }
  }
  return { datasets, missing };
}

const guidelineMeta = guidelineMetaCurrency();

const stale = [];
for (const file of walk(CONTENT)) {
  const domain = path.relative(CONTENT, file).split(path.sep)[0];
  if (!['guidelines', 'trials', 'education'].includes(domain)) continue;
  for (const rec of recordsOf(file)) {
    if (!rec.lastReviewed) continue;
    const age = ageMonths(rec.lastReviewed);
    if (age > MONTHS) {
      stale.push({
        domain,
        id: rec.id || '(no id)',
        title: rec.name || rec.title || rec.statement || rec.section || '',
        lastReviewed: rec.lastReviewed,
        ageMonths: age,
        sources: sourcesOf(rec),
        file: path.relative(REPO, file),
      });
    }
  }
}

stale.sort((a, b) => b.ageMonths - a.ageMonths);

if (asJson) {
  console.log(JSON.stringify({
    thresholdMonths: MONTHS,
    asOf: NOW.toISOString().slice(0, 10),
    stale,
    guidelineMeta: {
      datasets: guidelineMeta.datasets,
      missingCurrencyField: guidelineMeta.missing,
    },
  }, null, 2));
} else {
  console.log(`Currency report — entries not reviewed in > ${MONTHS} months (as of ${NOW.toISOString().slice(0, 10)})`);
  if (!stale.length) {
    console.log('  ✓ nothing stale — all guideline/trial/education entries are current.');
  } else {
    for (const s of stale) {
      console.log(`  • [${s.domain}] ${s.id} — reviewed ${s.lastReviewed} (${s.ageMonths} mo)`);
      console.log(`      ${String(s.title).slice(0, 90)}`);
      console.log(`      re-verify: ${s.sources}`);
      console.log(`      ${s.file}`);
    }
    console.log(`\n${stale.length} entr${stale.length === 1 ? 'y' : 'ies'} due for re-verification.`);
  }

  console.log(`\nGuideline metadata currency — src/guidelines/*.json (${guidelineMeta.datasets} datasets)`);
  if (!guidelineMeta.missing.length) {
    console.log('  ✓ every guideline metadata dataset carries a currency field.');
  } else {
    console.log(`  ⚠ ${guidelineMeta.missing.length}/${guidelineMeta.datasets} datasets lack a lastReviewed (or equivalent) field — warning only, does not affect exit code:`);
    for (const m of guidelineMeta.missing) {
      console.log(`  • [guideline-meta] ${m.id} — no currency field (${m.file})`);
    }
  }
}

// --strict gates on stale /content entries only; the src/guidelines metadata
// currency gaps above are warnings by design (see task note: the 89-dataset
// library predates the lastReviewed convention, a hard failure would turn
// the suite red).
if (strict && stale.length) process.exit(1);
