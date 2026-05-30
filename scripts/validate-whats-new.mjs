// scripts/validate-whats-new.mjs
//
// Validates whats-new.json against the Evidence Atlas.
//
// For each item the validator asserts:
//   1. id resolves to a completedTrials record with verificationStatus==='verified-pubmed'
//   2. item.pmid matches the record's primary citation pmid
//   3. Required display fields are present and non-empty:
//        shortName, evidenceType, result.effect, practiceImpact, certainty,
//        pmid, pubmedUrl
//
// Output style mirrors evidence-validate.mjs:
//   - Errors:   "whats-new/<id>: <message>"
//   - Exit 0 on clean; exit 1 on any error.
//
// Usage:
//   node ./scripts/validate-whats-new.mjs
//   node ./scripts/validate-whats-new.mjs --quiet

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const evidenceIndex = path.join(repoRoot, 'src/evidence/index.js');
const outFile = path.join(repoRoot, 'whats-new.json');

const rawArgs = new Set(process.argv.slice(2));
const quiet = rawArgs.has('--quiet');

function log(line) {
  if (!quiet) console.log(line);
}

function fmtList(label, items) {
  if (!items.length) return '';
  return `\n${label} (${items.length}):\n  - ${items.join('\n  - ')}`;
}

const REQUIRED_FIELDS = ['shortName', 'evidenceType', 'practiceImpact', 'certainty', 'pmid', 'pubmedUrl'];
const REQUIRED_RESULT_FIELDS = ['effect'];

async function main() {
  // Load whats-new.json
  let feed;
  try {
    const raw = await fs.readFile(outFile, 'utf8');
    feed = JSON.parse(raw);
  } catch (err) {
    console.error(`validate-whats-new: failed to read whats-new.json: ${err?.message || err}`);
    process.exit(1);
    return;
  }

  // Load atlas
  let atlas;
  try {
    const url = pathToFileURL(evidenceIndex).href;
    atlas = await import(url);
  } catch (err) {
    console.error(`validate-whats-new: failed to load src/evidence/index.js: ${err?.message || err}`);
    process.exit(1);
    return;
  }

  const { completedTrials, resolveCitations } = atlas;

  // Build lookup maps
  const trialById = new Map(completedTrials.map((t) => [t.id, t]));

  const errors = [];

  // Top-level structure checks
  if (!Array.isArray(feed.items)) {
    errors.push('whats-new.json: missing or non-array "items" field');
    console.error(`validate-whats-new: FAILED${fmtList('errors', errors)}`);
    process.exit(1);
    return;
  }

  if (typeof feed.count !== 'number') {
    errors.push('whats-new.json: missing "count" field');
  } else if (feed.count !== feed.items.length) {
    errors.push(
      `whats-new.json: count=${feed.count} does not match items.length=${feed.items.length}`
    );
  }

  if (feed.generatedFrom !== 'evidence-atlas') {
    errors.push(`whats-new.json: unexpected generatedFrom='${feed.generatedFrom}' (expected 'evidence-atlas')`);
  }

  // Per-item checks
  for (const item of feed.items) {
    const prefix = `whats-new/${item.id || '<missing-id>'}`;

    if (!item.id) {
      errors.push(`${prefix}: missing id`);
      continue;
    }

    // 1. id must resolve to a verified-pubmed completedTrial
    const trial = trialById.get(item.id);
    if (!trial) {
      errors.push(`${prefix}: id '${item.id}' not found in completedTrials`);
      continue;
    }
    if (trial.verificationStatus !== 'verified-pubmed') {
      errors.push(
        `${prefix}: trial verificationStatus='${trial.verificationStatus}' (expected 'verified-pubmed')`
      );
    }

    // 2. pmid must match the trial's primary citation
    const cits = resolveCitations(trial.citationIds || []);
    const expectedPmid = cits[0] ? (cits[0].pmid || '') : '';
    if (item.pmid !== expectedPmid) {
      errors.push(
        `${prefix}: pmid='${item.pmid}' does not match atlas citation pmid='${expectedPmid}'`
      );
    }

    // 3. Required display fields present and non-empty
    for (const field of REQUIRED_FIELDS) {
      const val = item[field];
      if (val == null || val === '') {
        errors.push(`${prefix}: required field '${field}' is missing or empty`);
      }
    }

    // 3b. result sub-fields
    if (!item.result || typeof item.result !== 'object') {
      errors.push(`${prefix}: missing 'result' object`);
    } else {
      for (const field of REQUIRED_RESULT_FIELDS) {
        const val = item.result[field];
        if (val == null || val === '') {
          errors.push(`${prefix}: required field 'result.${field}' is missing or empty`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `validate-whats-new: FAILED with ${errors.length} error${errors.length === 1 ? '' : 's'}.`
    );
    console.error(fmtList('errors', errors));
    process.exit(1);
  } else {
    log(`✓ validate:whats-new — ${feed.items.length} items verified`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`validate-whats-new: unexpected failure: ${err?.stack || err}`);
  process.exit(1);
});
