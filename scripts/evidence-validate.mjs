// scripts/evidence-validate.mjs
//
// Structural validator for the StrokeOps v6 Evidence Atlas.
// Runs offline — no live PubMed / DOI / NCT lookups.
//
// Integration:
//   - Mirrors the style and exit semantics of scripts/validate-citations.mjs
//   - Wired into npm `test` immediately after validate:citations and before
//     validate:evidence-churn-profiles in package.json.
//   - Standalone runnable: `node ./scripts/evidence-validate.mjs` for fast
//     iteration during atlas authoring.
//
// Output contract:
//   - Errors print one per line, prefixed with the record path (e.g.
//     `completedTrials/wake-up: ...`) for direct file-and-key navigation.
//   - Exit 0 on clean. Exit 0 with a printed warnings block on warnings only.
//   - Exit 1 on any error.

import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const evidenceIndex = path.join(repoRoot, 'src/evidence/index.js');

async function loadAtlas() {
  const url = pathToFileURL(evidenceIndex).href;
  return import(url);
}

const args = new Set(process.argv.slice(2));
const json = args.has('--json');
const quiet = args.has('--quiet');

function log(line) {
  if (!quiet) console.log(line);
}

function warn(line) {
  if (!quiet) console.log(line);
}

function fmtList(label, items) {
  if (!items.length) return '';
  return `\n${label} (${items.length}):\n  - ${items.join('\n  - ')}`;
}

async function loadEngine() {
  const url = pathToFileURL(path.join(repoRoot, 'src/evidence/matcher-engine.js')).href;
  return import(url);
}

async function main() {
  let atlas;
  try {
    atlas = await loadAtlas();
  } catch (err) {
    console.error(`evidence-validate: failed to load src/evidence/index.js: ${err?.message || err}`);
    process.exit(1);
    return;
  }
  let engine = null;
  try {
    engine = await loadEngine();
  } catch (err) {
    // Engine is optional for the validator; it adds a coverage metric but
    // its absence must not block validation.
    engine = null;
  }

  const {
    activeTrials,
    completedTrials,
    citations,
    recommendations,
    claims,
    guidelines,
    topics,
    schema,
    getAllCitationIds,
    getAllActiveTrialIds,
    getAllCompletedTrialIds,
    getAllClaimIds
  } = atlas;

  const errors = [];
  const warnings = [];

  const knownCitationIds = getAllCitationIds();
  const knownActiveTrialIds = getAllActiveTrialIds();
  const knownCompletedTrialIds = getAllCompletedTrialIds();
  const knownClaimIds = getAllClaimIds();

  // Duplicate id detection
  const seenIds = new Map(); // collection -> Set
  for (const [name, list] of [
    ['activeTrials', activeTrials],
    ['completedTrials', completedTrials],
    ['citations', citations],
    ['recommendations', recommendations],
    ['claims', claims],
    ['guidelines', guidelines],
    ['topics', topics]
  ]) {
    const set = new Set();
    for (const r of list) {
      if (set.has(r.id)) errors.push(`${name}: duplicate id '${r.id}'`);
      set.add(r.id);
    }
    seenIds.set(name, set);
  }

  // Topic referential integrity
  const knownTopicIds = seenIds.get('topics');
  for (const t of topics) {
    if (t.parentId && !knownTopicIds.has(t.parentId)) {
      errors.push(`topics/${t.id}: parentId '${t.parentId}' not found`);
    }
  }
  for (const list of [activeTrials, completedTrials, recommendations, claims, guidelines]) {
    for (const r of list) {
      if (r.topic && !knownTopicIds.has(r.topic)) {
        warnings.push(`${r.id || '<unset>'}: topic '${r.topic}' not registered in topics.js (display will fall back to raw id)`);
      }
    }
  }

  // Citation structure
  for (const c of citations) {
    const { errors: e, warnings: w } = schema.validateCitation(c);
    errors.push(...e);
    warnings.push(...w);
  }

  // Completed trials
  for (const t of completedTrials) {
    const { errors: e, warnings: w } = schema.validateCompletedTrial(t, {
      knownCitationIds,
      knownActiveTrialIds
    });
    errors.push(...e);
    warnings.push(...w);
  }

  // Active trials
  for (const t of activeTrials) {
    const { errors: e, warnings: w } = schema.validateActiveTrial(t, {
      knownCompletedTrialIds
    });
    errors.push(...e);
    warnings.push(...w);
  }

  // Claims
  for (const c of claims) {
    const { errors: e, warnings: w } = schema.validateClaim(c, { knownCitationIds });
    errors.push(...e);
    warnings.push(...w);
  }

  // Recommendations
  for (const r of recommendations) {
    const { errors: e, warnings: w } = schema.validateRecommendation(r, { knownClaimIds });
    errors.push(...e);
    warnings.push(...w);
  }

  // Guidelines
  for (const g of guidelines) {
    const { errors: e, warnings: w } = schema.validateGuideline(g, { knownCitationIds });
    errors.push(...e);
    warnings.push(...w);
  }

  // Active trial: at least one matcherCriteria field; checked by schema.

  // Aggregate counts for the summary line.
  const counts = {
    activeTrials: activeTrials.length,
    completedTrials: completedTrials.length,
    citations: citations.length,
    recommendations: recommendations.length,
    claims: claims.length,
    guidelines: guidelines.length,
    topics: topics.length
  };

  // Engine coverage — surfaces retirement readiness for the legacy
  // TRIAL_ELIGIBILITY_CONFIG. 100% means every declarative criterion can
  // be evaluated by the generic engine; gaps list the specific
  // (trial/field/operator) tuples that still require legacy logic.
  let coverage = null;
  if (engine && typeof engine.coverageReport === 'function') {
    coverage = engine.coverageReport(activeTrials);
    if (coverage.gaps.length > 0) {
      warnings.push(`matcher-engine coverage ${coverage.percent}% (${coverage.covered}/${coverage.total}); gaps require legacy evaluator: ${coverage.gaps.join(', ')}`);
    }
  }

  if (json) {
    const payload = { ok: errors.length === 0, counts, coverage, errors, warnings };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(errors.length === 0 ? 0 : 1);
    return;
  }

  if (errors.length === 0) {
    log(`Evidence Atlas validation passed: ${counts.activeTrials} active, ${counts.completedTrials} completed, ${counts.citations} citations, ${counts.recommendations} recs, ${counts.claims} claims, ${counts.guidelines} guidelines, ${counts.topics} topics.`);
    if (coverage) {
      log(`Matcher-engine coverage: ${coverage.covered}/${coverage.total} criteria (${coverage.percent}%) + ${coverage.exclusionsCovered}/${coverage.exclusionsTotal} exclusions (${coverage.exclusionsPercent}%)${coverage.gaps.length === 0 ? ' — all criteria and exclusions executable from declarative form' : ''}.`);
    }
    if (warnings.length) {
      warn(`(${warnings.length} warning${warnings.length === 1 ? '' : 's'} below — non-fatal)`);
      warn(fmtList('warnings', warnings));
    }
    process.exit(0);
  } else {
    console.error(`Evidence Atlas validation FAILED with ${errors.length} error${errors.length === 1 ? '' : 's'}.`);
    console.error(fmtList('errors', errors));
    if (warnings.length) {
      console.error(fmtList('warnings', warnings));
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`evidence-validate: unexpected failure: ${err?.stack || err}`);
  process.exit(1);
});
