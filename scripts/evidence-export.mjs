// scripts/evidence-export.mjs
//
// Build-time exports of the StrokeOps v6 Evidence Atlas. Produces
// machine- and human-readable artifacts in output/ for downstream
// review (peer reviewers, manual PMID/DOI cross-checks, paper appendix).
//
// Usage:
//   node ./scripts/evidence-export.mjs            # write all artifacts
//   node ./scripts/evidence-export.mjs --check    # validate-only, no writes
//
// Output format intentionally pure ASCII / standard CSV so artifacts are
// diffable in PRs.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const evidenceIndex = path.join(repoRoot, 'src/evidence/index.js');
const outDir = path.join(repoRoot, 'output');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cols) {
  return cols.map(csvEscape).join(',');
}

function writeIfNotCheck(file, content) {
  if (checkOnly) {
    console.log(`(check) would write ${path.relative(repoRoot, file)} (${content.length} bytes)`);
    return Promise.resolve();
  }
  return fs.writeFile(file, content, 'utf8');
}

async function main() {
  const url = pathToFileURL(evidenceIndex).href;
  const atlas = await import(url);
  const {
    activeTrials,
    completedTrials,
    citations,
    recommendations,
    claims,
    guidelines,
    topics,
    citationLink,
    resolveCitations,
    resolveClaimsWithCitations
  } = atlas;

  if (!checkOnly) {
    await fs.mkdir(outDir, { recursive: true });
  }

  // ---------- evidence-atlas.md ----------
  const lines = [];
  lines.push('# StrokeOps v6 — Evidence Atlas');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()}.`);
  lines.push('');
  lines.push('Live verification of identifiers (PMID/DOI/NCT) is the user\'s manual review step. This file reflects the structurally validated atlas.');
  lines.push('');
  lines.push(`**Counts:** ${activeTrials.length} active trials · ${completedTrials.length} completed trials · ${citations.length} citations · ${recommendations.length} recommendations · ${claims.length} claims · ${guidelines.length} guidelines · ${topics.length} topics.`);
  lines.push('');

  lines.push('## Active trials');
  lines.push('');
  for (const t of activeTrials) {
    lines.push(`### ${t.shortName} — ${t.fullName}`);
    lines.push(`- **NCT:** ${t.nctId || '—'} · **Topic:** ${t.topic} · **Status:** ${t.status} · **Phase:** ${t.phase}`);
    lines.push(`- ${t.briefDescription}`);
    if (t.relatedCompletedTrialIds.length) {
      lines.push(`- **Related evidence:** ${t.relatedCompletedTrialIds.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('## Evidence Atlas — completed trials');
  lines.push('');
  for (const t of completedTrials) {
    lines.push(`### ${t.shortName} — ${t.fullName}`);
    lines.push(`- **Topic:** ${t.topic} · **Type:** ${t.evidenceType} · **Certainty:** ${t.certainty} · **Verification:** ${t.verificationStatus}`);
    lines.push(`- **Population:** n=${t.population.n}, ${t.population.ageRange || 'age n/a'}, NIHSS ${t.population.nihssRange || 'n/a'}, ${t.population.timeWindow || 'window n/a'}`);
    lines.push(`- **Intervention:** ${t.intervention}`);
    lines.push(`- **Comparator:** ${t.comparator}`);
    lines.push(`- **Primary endpoint:** ${t.primaryEndpoint.definition} @ ${t.primaryEndpoint.timepoint} → ${t.primaryEndpoint.result}${t.primaryEndpoint.effectSize ? ` (${t.primaryEndpoint.effectSize}${t.primaryEndpoint.confidenceInterval ? `, ${t.primaryEndpoint.confidenceInterval}` : ''}${t.primaryEndpoint.pValue ? `, ${t.primaryEndpoint.pValue}` : ''})` : ''}`);
    if (t.safetyFindings.sich || t.safetyFindings.mortality) {
      lines.push(`- **Safety:** sICH ${t.safetyFindings.sich || 'n/a'}; mortality ${t.safetyFindings.mortality || 'n/a'}${t.safetyFindings.other ? `; other: ${t.safetyFindings.other}` : ''}`);
    }
    if (t.limitations) lines.push(`- **Limitations:** ${t.limitations}`);
    if (t.practiceImpact) lines.push(`- **Practice impact:** ${t.practiceImpact}`);
    const cits = resolveCitations(t.citationIds);
    if (cits.length) {
      lines.push(`- **Citations:** ${cits.map((c) => `${c.title} — ${citationLink(c) || (c.pmid ? 'PMID ' + c.pmid : '')}`.trim()).join(' | ')}`);
    }
    if (t.relatedActiveTrialIds.length) {
      lines.push(`- **Related active trials:** ${t.relatedActiveTrialIds.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('## Recommendations (with claim chain)');
  lines.push('');
  for (const r of recommendations) {
    lines.push(`### ${r.id} — Class ${r.classOfRecommendation}, LOE ${r.levelOfEvidence}`);
    lines.push(`- **Setting:** ${r.setting} · **Topic:** ${r.topic}`);
    lines.push(`- **Recommendation:** ${r.text}`);
    lines.push(`- **Source:** ${r.guidelineSource}`);
    const expanded = resolveClaimsWithCitations(r.supportingClaimIds);
    if (expanded.length) {
      lines.push('- **Supporting claims:**');
      for (const cl of expanded) {
        lines.push(`  - *${cl.statement}* (certainty ${cl.certainty})`);
        for (const cit of cl.citationRecords) {
          lines.push(`    - ${cit.title} — ${cit.year} ${citationLink(cit) || ''}`);
        }
      }
    }
    if (r.caveats.length) {
      lines.push('- **Caveats:**');
      for (const cv of r.caveats) lines.push(`  - ${cv}`);
    }
    lines.push('');
  }

  await writeIfNotCheck(path.join(outDir, 'evidence-atlas.md'), lines.join('\n'));

  // ---------- completed-trials.csv / .json ----------
  const ctHeader = ['id', 'shortName', 'fullName', 'topic', 'evidenceType', 'certainty', 'verificationStatus', 'n', 'timeWindow', 'intervention', 'comparator', 'primaryResult', 'effectSize', 'CI', 'pValue', 'sICH', 'mortality', 'lastReviewed', 'citationIds', 'relatedActiveTrialIds'];
  const ctRows = [csvRow(ctHeader)];
  for (const t of completedTrials) {
    ctRows.push(csvRow([
      t.id, t.shortName, t.fullName, t.topic, t.evidenceType, t.certainty,
      t.verificationStatus, t.population.n, t.population.timeWindow,
      t.intervention, t.comparator, t.primaryEndpoint.result,
      t.primaryEndpoint.effectSize, t.primaryEndpoint.confidenceInterval,
      t.primaryEndpoint.pValue, t.safetyFindings.sich, t.safetyFindings.mortality,
      t.lastReviewed, (t.citationIds || []).join('|'), (t.relatedActiveTrialIds || []).join('|')
    ]));
  }
  await writeIfNotCheck(path.join(outDir, 'completed-trials.csv'), ctRows.join('\n') + '\n');
  await writeIfNotCheck(path.join(outDir, 'completed-trials.json'), JSON.stringify(completedTrials, null, 2));

  // ---------- active-trials.csv / .json ----------
  const atHeader = ['id', 'shortName', 'fullName', 'nctId', 'phase', 'status', 'topic', 'matcherFieldCount', 'relatedCompletedTrialIds', 'lastReviewed', 'verificationStatus', 'legacyMatcherKey'];
  const atRows = [csvRow(atHeader)];
  for (const t of activeTrials) {
    atRows.push(csvRow([
      t.id, t.shortName, t.fullName, t.nctId, t.phase, t.status, t.topic,
      (t.matcherCriteria || []).length, (t.relatedCompletedTrialIds || []).join('|'),
      t.lastReviewed, t.verificationStatus, t.legacyMatcherKey
    ]));
  }
  await writeIfNotCheck(path.join(outDir, 'active-trials.csv'), atRows.join('\n') + '\n');
  await writeIfNotCheck(path.join(outDir, 'active-trials.json'), JSON.stringify(activeTrials, null, 2));

  // ---------- claim-source-map.md ----------
  const csmLines = ['# Claim → Source Map', '', 'Each atomic evidence claim and its supporting citations.', ''];
  for (const cl of claims) {
    csmLines.push(`## ${cl.id}`);
    csmLines.push(`- *${cl.statement}*`);
    csmLines.push(`- Topic: ${cl.topic} · Certainty: ${cl.certainty} · Last reviewed: ${cl.lastReviewed || 'n/a'}`);
    if (cl.conflictNotes) csmLines.push(`- Conflict notes: ${cl.conflictNotes}`);
    const cits = resolveCitations(cl.citationIds);
    for (const c of cits) {
      csmLines.push(`  - ${c.title} (${c.journal} ${c.year}) — ${citationLink(c) || ''}`);
    }
    csmLines.push('');
  }
  await writeIfNotCheck(path.join(outDir, 'claim-source-map.md'), csmLines.join('\n'));

  // ---------- pico-table.csv ----------
  const picoHeader = ['id', 'shortName', 'population', 'intervention', 'comparator', 'primaryEndpointDefinition', 'primaryEndpointResult', 'effectSize', 'CI', 'pValue', 'topic', 'certainty'];
  const picoRows = [csvRow(picoHeader)];
  for (const t of completedTrials) {
    picoRows.push(csvRow([
      t.id, t.shortName,
      `${t.population.n} pts; ${t.population.ageRange}; ${t.population.nihssRange}; ${t.population.timeWindow}`.replace(/;\s*;/g, ';'),
      t.intervention, t.comparator,
      t.primaryEndpoint.definition, t.primaryEndpoint.result,
      t.primaryEndpoint.effectSize, t.primaryEndpoint.confidenceInterval, t.primaryEndpoint.pValue,
      t.topic, t.certainty
    ]));
  }
  await writeIfNotCheck(path.join(outDir, 'pico-table.csv'), picoRows.join('\n') + '\n');

  if (!checkOnly) {
    console.log(`Evidence Atlas exported to ${path.relative(repoRoot, outDir)}/`);
  } else {
    console.log('Evidence Atlas check OK (no files written).');
  }
}

main().catch((err) => {
  console.error(`evidence-export: ${err?.stack || err}`);
  process.exit(1);
});
