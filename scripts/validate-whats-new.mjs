// scripts/validate-whats-new.mjs
//
// Offline build gate for whats-new.json (clinical-intelligence pipeline).
//
// Validates whats-new.json against the committed verification cache
// (data/clinical-intelligence/verified-pmids.json). No atlas dependency.
//
// For each item the validator asserts:
//   1. Required display fields are present and non-empty:
//        shortName, fullName, pmid, pubmedUrl, practiceImpact
//   2. result.effect is present and non-empty
//   3. appraisal.bottomLine is present and non-empty
//   4. item.pmid matches a verified-pmids.json entry with status==='verified'
//   5. pubmedUrl is the canonical https://pubmed.ncbi.nlm.nih.gov/<pmid>/ form
//
// Output style mirrors the other validators:
//   - Errors:   "whats-new/<id>: <message>"
//   - Exit 0 on clean; exit 1 on any error.
//
// Usage:
//   node ./scripts/validate-whats-new.mjs
//   node ./scripts/validate-whats-new.mjs --quiet

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const outFile = path.join(repoRoot, 'whats-new.json');
const cacheFile = path.join(repoRoot, 'data/clinical-intelligence/verified-pmids.json');

const rawArgs = new Set(process.argv.slice(2));
const quiet = rawArgs.has('--quiet');

function log(line) {
  if (!quiet) console.log(line);
}

function fmtList(label, items) {
  if (!items.length) return '';
  return `\n${label} (${items.length}):\n  - ${items.join('\n  - ')}`;
}

const REQUIRED_FIELDS = ['shortName', 'fullName', 'pmid', 'pubmedUrl', 'practiceImpact'];

async function main() {
  let feed;
  try {
    feed = JSON.parse(await fs.readFile(outFile, 'utf8'));
  } catch (err) {
    console.error(`validate-whats-new: failed to read whats-new.json: ${err?.message || err}`);
    process.exit(1);
    return;
  }

  let cache;
  try {
    cache = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
  } catch (err) {
    console.error(`validate-whats-new: failed to read verified-pmids.json: ${err?.message || err}`);
    process.exit(1);
    return;
  }

  const byId = cache.byId || {};
  // PMID -> verified status lookup (only status==='verified' entries count).
  const verifiedPmids = new Set(
    Object.values(byId)
      .filter((e) => e && e.status === 'verified' && e.pmid)
      .map((e) => String(e.pmid))
  );

  const errors = [];

  if (!Array.isArray(feed.items)) {
    errors.push('whats-new.json: missing or non-array "items" field');
    console.error(`validate-whats-new: FAILED${fmtList('errors', errors)}`);
    process.exit(1);
    return;
  }

  if (feed.generatedFrom !== 'clinical-intelligence-briefing') {
    errors.push(
      `whats-new.json: unexpected generatedFrom='${feed.generatedFrom}' (expected 'clinical-intelligence-briefing')`
    );
  }
  if (feed.sourceDoc !== 'briefing-latest.md') {
    errors.push(`whats-new.json: unexpected sourceDoc='${feed.sourceDoc}' (expected 'briefing-latest.md')`);
  }
  if (typeof feed.count !== 'number') {
    errors.push('whats-new.json: missing numeric "count" field');
  } else if (feed.count !== feed.items.length) {
    errors.push(`whats-new.json: count=${feed.count} does not match items.length=${feed.items.length}`);
  }

  for (const item of feed.items) {
    const prefix = `whats-new/${item.id || '<missing-id>'}`;

    if (!item.id) {
      errors.push(`${prefix}: missing id`);
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      const val = item[field];
      if (val == null || val === '') {
        errors.push(`${prefix}: required field '${field}' is missing or empty`);
      }
    }

    // result.effect
    if (!item.result || typeof item.result !== 'object') {
      errors.push(`${prefix}: missing 'result' object`);
    } else if (item.result.effect == null || item.result.effect === '') {
      errors.push(`${prefix}: required field 'result.effect' is missing or empty`);
    }

    // appraisal.bottomLine
    if (!item.appraisal || typeof item.appraisal !== 'object') {
      errors.push(`${prefix}: missing 'appraisal' object`);
    } else if (item.appraisal.bottomLine == null || item.appraisal.bottomLine === '') {
      errors.push(`${prefix}: required field 'appraisal.bottomLine' is missing or empty`);
    }

    // pmid must be a verified PMID in the cache (clinical-safety gate).
    if (item.pmid && !verifiedPmids.has(String(item.pmid))) {
      errors.push(
        `${prefix}: pmid='${item.pmid}' is not present as status='verified' in verified-pmids.json`
      );
    }

    // pubmedUrl canonical form.
    if (item.pmid && item.pubmedUrl !== `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`) {
      errors.push(
        `${prefix}: pubmedUrl='${item.pubmedUrl}' does not match canonical https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`
      );
    }
  }

  if (errors.length > 0) {
    console.error(
      `validate-whats-new: FAILED with ${errors.length} error${errors.length === 1 ? '' : 's'}.`
    );
    console.error(fmtList('errors', errors));
    process.exit(1);
  } else {
    log(`✓ validate:whats-new — ${feed.items.length} verified items`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`validate-whats-new: unexpected failure: ${err?.stack || err}`);
  process.exit(1);
});
