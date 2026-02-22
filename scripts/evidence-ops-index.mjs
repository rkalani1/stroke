import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const WATCHLIST_PATH = path.join(DOCS_DIR, 'evidence-watchlist.md');
const CHECKLIST_PATH = path.join(DOCS_DIR, 'evidence-promotion-checklist.md');
const TEMPLATE_PATH = path.join(DOCS_DIR, 'evidence-promotion-template.md');
const TEMPLATE_P0_PATH = path.join(DOCS_DIR, 'evidence-promotion-template-p0.md');
const HISTORY_PATH = path.join(DOCS_DIR, 'evidence-watch-history.json');
const CHURN_PROFILE_PATH = path.join(DOCS_DIR, 'evidence-churn-profiles.json');
const QA_LATENCY_PROFILE_PATH = path.join(DOCS_DIR, 'qa-latency-profiles.json');
const QA_LATENCY_HISTORY_PATH = path.join(DOCS_DIR, 'qa-latency-history.json');
const OUTPUT_PATH = path.join(DOCS_DIR, 'evidence-ops-index.md');

async function readText(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return '';
  }
}

function readGeneratedStamp(markdown) {
  const m = String(markdown || '').match(/^Generated:\s*(.+)$/m);
  return m ? m[1].trim() : 'unknown';
}

function countLinesMatching(markdown, regex) {
  return String(markdown || '')
    .split('\n')
    .filter((line) => regex.test(line)).length;
}

function extractPendingCandidates(markdown) {
  const m = String(markdown || '').match(/Pending candidates:\s*(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : null;
}

function extractTotalChecklist(markdown) {
  const m = String(markdown || '').match(/Total candidates:\s*(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : null;
}

function extractWatchlistP0P1(markdown) {
  const lines = String(markdown || '').split('\n');
  let count = 0;
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\|\s*P[01]\b/i.test(line.trim())) count += 1;
  }
  return count;
}

function extractHistoryEntryCount(rawHistory) {
  try {
    const parsed = JSON.parse(String(rawHistory || '[]'));
    return Array.isArray(parsed) ? parsed.length : null;
  } catch {
    return null;
  }
}

function extractProfileCount(rawProfiles) {
  try {
    const parsed = JSON.parse(String(rawProfiles || '{}'));
    const profiles = parsed?.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : parsed;
    if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) return null;
    return Object.keys(profiles).length;
  } catch {
    return null;
  }
}

async function main() {
  const [watchlistMd, checklistMd, templateMd, templateP0Md, historyRaw, churnProfileRaw, qaLatencyProfileRaw, qaLatencyHistoryRaw] = await Promise.all([
    readText(WATCHLIST_PATH),
    readText(CHECKLIST_PATH),
    readText(TEMPLATE_PATH),
    readText(TEMPLATE_P0_PATH),
    readText(HISTORY_PATH),
    readText(CHURN_PROFILE_PATH),
    readText(QA_LATENCY_PROFILE_PATH),
    readText(QA_LATENCY_HISTORY_PATH)
  ]);

  const now = new Date().toISOString();
  const watchlistGenerated = readGeneratedStamp(watchlistMd);
  const checklistGenerated = readGeneratedStamp(checklistMd);
  const templateGenerated = readGeneratedStamp(templateMd);
  const templateP0Generated = readGeneratedStamp(templateP0Md);

  const watchlistP0P1 = extractWatchlistP0P1(watchlistMd);
  const checklistTotal = extractTotalChecklist(checklistMd);
  const templatePending = extractPendingCandidates(templateMd);
  const templateP0Pending = extractPendingCandidates(templateP0Md);
  const historyCount = extractHistoryEntryCount(historyRaw);
  const profileCount = extractProfileCount(churnProfileRaw);
  const qaLatencyProfileCount = extractProfileCount(qaLatencyProfileRaw);
  const qaLatencyHistoryCount = extractHistoryEntryCount(qaLatencyHistoryRaw);

  const out = [];
  out.push('# Evidence Ops Index (Auto-generated)');
  out.push('');
  out.push(`Generated: ${now}`);
  out.push('');
  out.push('## Current Artifacts');
  out.push('| Artifact | Path | Generated | Key count |');
  out.push('|---|---|---|---|');
  out.push(`| Watchlist | docs/evidence-watchlist.md | ${watchlistGenerated} | P0/P1 rows: ${watchlistP0P1} |`);
  out.push(`| Promotion checklist | docs/evidence-promotion-checklist.md | ${checklistGenerated} | Total queued: ${checklistTotal ?? 'unknown'} |`);
  out.push(`| Promotion template (all) | docs/evidence-promotion-template.md | ${templateGenerated} | Pending templates: ${templatePending ?? 'unknown'} |`);
  out.push(`| Promotion template (P0) | docs/evidence-promotion-template-p0.md | ${templateP0Generated} | Pending templates: ${templateP0Pending ?? 'unknown'} |`);
  out.push(`| Watchlist history | docs/evidence-watch-history.json | n/a (JSON snapshot) | Entries: ${historyCount ?? 'unknown'} |`);
  out.push(`| Churn profiles | docs/evidence-churn-profiles.json | n/a (JSON config) | Profiles: ${profileCount ?? 'unknown'} |`);
  out.push(`| QA latency profiles | docs/qa-latency-profiles.json | n/a (JSON config) | Profiles: ${qaLatencyProfileCount ?? 'unknown'} |`);
  out.push(`| QA latency history | docs/qa-latency-history.json | n/a (JSON snapshot) | Entries: ${qaLatencyHistoryCount ?? 'unknown'} |`);
  out.push('');
  out.push('## Maintenance Commands');
  out.push('- `npm run evidence:watch`');
  out.push('- `npm run evidence:watch:filtered-all`');
  out.push('- `npm run evidence:watch:dominance`');
  out.push('- `npm run evidence:watch:topic-thresholds`');
  out.push('- `npm run evidence:watch:churn`');
  out.push('- `npm run evidence:watch:churn-critical`');
  out.push('- `npm run evidence:watch:profiles-file`');
  out.push('- `npm run evidence:watch:profile:reperfusion`');
  out.push('- `npm run evidence:watch:profile:hemorrhage`');
  out.push('- `npm run validate:evidence-churn-profiles`');
  out.push('- `npm run validate:qa-latency-profiles`');
  out.push('- `npm run qa:latency-strict`');
  out.push('- `npm run qa:latency-adaptive-strict`');
  out.push('- `npm run evidence:promote`');
  out.push('- `npm run evidence:template`');
  out.push('- `npm run evidence:template:p0`');
  out.push('- `npm run validate:evidence-promotion`');
  out.push('- `npm run evidence:refresh`');
  out.push('');
  out.push('## Validation Notes');
  out.push('- Promotion checklist must stay in sync with watchlist high-priority entries (P0/P1).');
  out.push('- `npm test` and `npm run qa` include sync validation and will fail on drift.');

  await fs.writeFile(OUTPUT_PATH, `${out.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
