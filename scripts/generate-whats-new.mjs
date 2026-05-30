// scripts/generate-whats-new.mjs
//
// Build-time generator for whats-new.json — derived entirely from the
// Evidence Atlas (verified-pubmed records only).  No network calls, no
// wall-clock timestamps: output is deterministic given the atlas.
//
// Usage:
//   node ./scripts/generate-whats-new.mjs
//   node ./scripts/generate-whats-new.mjs --now=2026-05-30
//
// Reference date precedence:
//   1. --now=YYYY-MM-DD  CLI arg
//   2. WHATS_NEW_NOW env var
//   3. max(promotedDate) across verified-pubmed completed trials  (default)
//
// Window: last WHATS_NEW_WINDOW_DAYS days (default 180) from the reference
//   date.  Set WHATS_NEW_WINDOW_DAYS or pass --window=N to override.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const evidenceIndex = path.join(repoRoot, 'src/evidence/index.js');
const outFile = path.join(repoRoot, 'whats-new.json');

// ── CLI arg parsing ────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
function argValue(flag) {
  for (const a of rawArgs) {
    if (a.startsWith(`${flag}=`)) return a.slice(flag.length + 1);
  }
  return null;
}

const nowArg = argValue('--now') || process.env.WHATS_NEW_NOW || null;
const windowDays = parseInt(
  argValue('--window') || process.env.WHATS_NEW_WINDOW_DAYS || '180',
  10
);

// ── Date helpers (no Date.now / new Date() with no args) ──────────────────
function parseIso(s) {
  // Parse YYYY-MM-DD → Date at UTC midnight; throws on bad input.
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid ISO date string: '${s}'`);
  }
  return new Date(`${s}T00:00:00.000Z`);
}

function subtractDays(isoDate, days) {
  const d = parseIso(isoDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// ── Direction heuristic ───────────────────────────────────────────────────
// Derives a direction label from trial certainty + result text.
// Conservative — defaults to 'neutral' on ambiguity.
function deriveDirection(trial) {
  const result = (trial.primaryEndpoint.result || '').toLowerCase();
  const effectSize = (trial.primaryEndpoint.effectSize || '').toLowerCase();
  const practiceImpact = (trial.practiceImpact || '').toLowerCase();
  const certainty = trial.certainty;

  // Harm signals
  const harmWords = ['harm', 'worse', 'higher mortality', 'increased mortality', 'increased risk', 'excess', 'detrimental'];
  if (harmWords.some((w) => result.includes(w) || practiceImpact.includes(w))) {
    return 'harm';
  }

  // No-benefit signals (non-inferiority met is a benefit for the new agent; trial failure is no-benefit)
  const noBenefitWords = ['no benefit', 'no significant', 'not superior', 'failed', 'halted', 'no difference'];
  if (noBenefitWords.some((w) => result.includes(w) || practiceImpact.includes(w))) {
    return 'no-benefit';
  }

  // Non-inferiority met → 'benefit' (new treatment equivalent, enabling use)
  if (
    result.includes('non-inferior') ||
    result.includes('noninferiority') ||
    (effectSize.includes('non-inferior') || effectSize.includes('noninferiority'))
  ) {
    return 'benefit';
  }

  // Explicit benefit signals
  const benefitWords = [
    'favored', 'improved', 'better', 'benefit', 'reduction', 'lower', 'reduced',
    'significant improvement', 'superior'
  ];
  if (benefitWords.some((w) => result.includes(w) || practiceImpact.includes(w))) {
    // Only label 'benefit' if certainty is moderate or high
    if (certainty === 'high' || certainty === 'moderate') return 'benefit';
  }

  return 'neutral';
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // Load atlas
  const atlasUrl = pathToFileURL(evidenceIndex).href;
  const atlas = await import(atlasUrl);
  const { completedTrials, citations, topics, resolveCitations } = atlas;

  // Build topic label map
  const topicLabelMap = Object.fromEntries(
    topics.map((t) => [t.id, t.label || t.name || t.id])
  );

  // Filter to verified-pubmed only
  const verified = completedTrials.filter(
    (t) => t.verificationStatus === 'verified-pubmed'
  );

  if (verified.length === 0) {
    console.error('generate-whats-new: no verified-pubmed records found in atlas');
    process.exit(1);
  }

  // Determine reference date
  let refDate;
  if (nowArg) {
    // Validate the provided date
    parseIso(nowArg); // throws on bad format
    refDate = nowArg;
  } else {
    // Use max(promotedDate) across verified records — deterministic
    const dates = verified
      .map((t) => t.promotedDate || t.lastReviewed)
      .filter(Boolean)
      .sort();
    refDate = dates[dates.length - 1];
  }

  const cutoff = subtractDays(refDate, windowDays);

  // Publication-recency floor — a "What's New" feed must surface recently
  // *published* practice-changing studies, not the entire bulk-promoted atlas.
  // Anchor to (refYear - 1) so a 2026 build shows 2025-2026 papers, not 2010
  // CREST / 2013 INTERACT2 (which were promoted recently but published long ago).
  // Deterministic — derived from refDate, no wall-clock.
  const refYear = parseInt(refDate.slice(0, 4), 10);
  const minYear = refYear - 1;

  // Select: recently promoted (within window) AND recently published, verified.
  const selected = verified.filter((t) => {
    const d = t.promotedDate || t.lastReviewed;
    if (!d || d < cutoff) return false;
    const cits = resolveCitations(t.citationIds || []);
    const citYear = cits[0] ? cits[0].year : null;
    return citYear != null && citYear >= minYear;
  });

  // Sort: promotedDate desc, then shortName asc
  selected.sort((a, b) => {
    const da = a.promotedDate || a.lastReviewed || '';
    const db = b.promotedDate || b.lastReviewed || '';
    if (db !== da) return db.localeCompare(da);
    return (a.shortName || '').localeCompare(b.shortName || '');
  });

  // Build cards
  const items = selected.map((t) => {
    // Resolve primary citation (use first citation id)
    const cits = resolveCitations(t.citationIds || []);
    const primaryCit = cits[0] || null;

    const card = {
      id: t.id,
      shortName: t.shortName,
      fullName: t.fullName,
      evidenceType: t.evidenceType,
      topic: t.topic,
      topicLabel: topicLabelMap[t.topic] || t.topic,
      journal: primaryCit ? primaryCit.journal : '',
      year: primaryCit ? primaryCit.year : null,
      design: {
        n: t.population ? t.population.n : null,
        population: t.population
          ? [
              t.population.ageRange,
              t.population.nihssRange,
              t.population.timeWindow
            ]
              .filter(Boolean)
              .join('; ')
          : '',
        comparator: t.comparator || ''
      },
      result: {
        effect: t.primaryEndpoint ? t.primaryEndpoint.result : '',
        ci: t.primaryEndpoint ? (t.primaryEndpoint.confidenceInterval || '') : '',
        p: t.primaryEndpoint ? (t.primaryEndpoint.pValue || '') : '',
        direction: deriveDirection(t)
      },
      practiceImpact: t.practiceImpact || '',
      certainty: t.certainty,
      pmid: primaryCit ? (primaryCit.pmid || '') : '',
      pubmedUrl: primaryCit ? (primaryCit.url || (primaryCit.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${primaryCit.pmid}/` : '')) : '',
      promotedDate: t.promotedDate || t.lastReviewed
    };

    // Append observational caveat only for observational evidence type
    if (t.evidenceType === 'observational') {
      card.observationalCaveat =
        'Observational study — confounding limits causal inference; interpret with caution.';
    }

    return card;
  });

  // Build output object — NO wall-clock timestamp (keep deterministic)
  const output = {
    generatedFrom: 'evidence-atlas',
    count: items.length,
    window: {
      days: windowDays,
      referenceDate: refDate,
      cutoff
    },
    items
  };

  await fs.writeFile(outFile, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(
    `generate-whats-new: wrote ${items.length} items to whats-new.json (refDate=${refDate}, window=${windowDays}d, cutoff=${cutoff})`
  );
}

main().catch((err) => {
  console.error(`generate-whats-new: ${err?.stack || err}`);
  process.exit(1);
});
