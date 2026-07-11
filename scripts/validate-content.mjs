// scripts/validate-content.mjs
//
// Build-time validation for the /content data layer. Fails the build on:
//   - malformed entries (missing/mistyped required fields, bad enums)
//   - missing citations (PMID/DOI/citationId not resolvable in the registry)
//   - stale lastReviewed beyond a configurable threshold
//
// Citation registry = src/evidence/citations.js (the single citations module).
// Calculator id set = content/calculators/registry.json.
//
// Config:
//   STROKE_CONTENT_MAX_AGE_MONTHS   currency threshold (default 18)
//   STROKE_CONTENT_NOW              ISO date to treat as "now" (default: today)
//   --lenient-currency              treat stale as a warning, not an error
//   --json                          machine-readable report to stdout
//
// Usage: node scripts/validate-content.mjs

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  VALIDATORS, parseFrontmatter, PMID_PATTERN, DOI_PATTERN,
} from '../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const CONTENT = path.join(REPO, 'content');
const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const lenientCurrency = args.has('--lenient-currency');

const MAX_AGE_MONTHS = Number(process.env.STROKE_CONTENT_MAX_AGE_MONTHS || 18);
const NOW = process.env.STROKE_CONTENT_NOW
  ? new Date(`${process.env.STROKE_CONTENT_NOW}T00:00:00Z`)
  : new Date();

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

async function loadCtx() {
  const { citations } = await import(pathToFileURL(path.join(REPO, 'src/evidence/citations.js')).href);
  const citationIds = new Set(citations.map((c) => c.id));
  const pmids = new Set(citations.map((c) => c.pmid).filter(Boolean));
  const dois = new Set(citations.map((c) => c.doi).filter(Boolean));
  let calculatorIds = new Set();
  const regPath = path.join(CONTENT, 'calculators', 'registry.json');
  if (fs.existsSync(regPath)) {
    calculatorIds = new Set(JSON.parse(fs.readFileSync(regPath, 'utf8')).map((c) => c.id));
  }
  return {
    citationIds, pmids, dois, calculatorIds,
    now: NOW, maxAgeMonths: MAX_AGE_MONTHS, staleIsError: !lenientCurrency,
  };
}

function readRecords(file) {
  const rel = path.relative(REPO, file);
  if (file.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const arr = Array.isArray(data) ? data : [data];
    return arr.map((rec, i) => ({ rec, label: `${rel}[${i}]` }));
  }
  if (file.endsWith('.md')) {
    const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    return [{ rec: data, label: rel }];
  }
  return [];
}

function domainOf(file) {
  const rel = path.relative(CONTENT, file);
  return rel.split(path.sep)[0]; // guidelines | trials | education | calculators | references
}

async function main() {
  const ctx = await loadCtx();
  const report = { errors: [], warnings: [], counts: {} };

  // Sanity: the citation registry itself must be well-formed.
  for (const pmid of ctx.pmids) {
    if (!PMID_PATTERN.test(pmid)) report.errors.push(`citations registry: malformed PMID "${pmid}"`);
  }
  for (const doi of ctx.dois) {
    if (!DOI_PATTERN.test(doi)) report.warnings.push(`citations registry: malformed DOI "${doi}"`);
  }

  const files = walk(CONTENT).filter((f) => f.endsWith('.json') || f.endsWith('.md'));
  for (const file of files) {
    if (path.basename(file) === 'schema.mjs') continue;
    const domain = domainOf(file);
    // Directories prefixed with "_" (e.g. _drafts) are scaffolds pending human
    // review — never validated or published as live content.
    if (domain.startsWith('_')) continue;
    const validate = VALIDATORS[domain];
    if (!validate) {
      report.warnings.push(`${path.relative(REPO, file)}: no validator for domain "${domain}" (skipped)`);
      continue;
    }
    report.counts[domain] = report.counts[domain] || 0;
    let records;
    try {
      records = readRecords(file);
    } catch (err) {
      report.errors.push(`${path.relative(REPO, file)}: parse error — ${err.message}`);
      continue;
    }
    for (const { rec, label } of records) {
      report.counts[domain] += 1;
      const { errors, warnings } = validate(rec, ctx);
      for (const e of errors) report.errors.push(`${label}: ${e}`);
      for (const w of warnings) report.warnings.push(`${label}: ${w}`);
    }
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const total = Object.values(report.counts).reduce((a, b) => a + b, 0);
    console.log(`Validated ${total} content records: ${Object.entries(report.counts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    console.log(`Currency threshold: ${MAX_AGE_MONTHS} months (as of ${NOW.toISOString().slice(0, 10)})${lenientCurrency ? ' [lenient]' : ''}`);
    for (const w of report.warnings) console.warn(`  ⚠ ${w}`);
    for (const e of report.errors) console.error(`  ✗ ${e}`);
  }

  if (report.errors.length) {
    if (!asJson) console.error(`\nContent validation FAILED with ${report.errors.length} error(s).`);
    process.exit(1);
  }
  if (!asJson) console.log(`\nContent validation PASSED${report.warnings.length ? ` (${report.warnings.length} warning(s))` : ''}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
