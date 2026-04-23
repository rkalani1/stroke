import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const WATCHLIST_PATH = path.join(process.cwd(), 'docs', 'evidence-watchlist.md');
const CHECKLIST_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-checklist.md');

function parseMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed.split('|').slice(1, -1).map((s) => s.trim());
}

function extractWatchlistHighPriorityPmids(markdown) {
  const lines = markdown.split('\n');
  const pmids = new Set();
  let inTable = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('| Priority |')) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;

    if (/^\|[-\s|]+\|\s*$/.test(line.trim())) continue;

    const cols = parseMarkdownRow(line);
    if (!cols || cols.length < 9) {
      if (line.trim() === '' || !line.trim().startsWith('|')) inTable = false;
      continue;
    }

    const priority = String(cols[0] || '').toLowerCase();
    const pmid = String(cols[3] || '').trim();
    if ((priority.startsWith('p0') || priority.startsWith('p1')) && pmid) pmids.add(pmid);
  }

  return pmids;
}

function extractChecklistPmids(markdown) {
  const lines = markdown.split('\n');
  const pmids = new Set();
  let inQueueTable = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('| Done | Topic | Priority | PMID |')) {
      inQueueTable = true;
      continue;
    }

    if (!inQueueTable) continue;

    if (/^\|[-\s|]+\|\s*$/.test(line.trim())) continue;

    const cols = parseMarkdownRow(line);
    if (!cols || cols.length < 10) {
      if (line.trim() === '' || !line.trim().startsWith('|')) break;
      continue;
    }

    const pmid = String(cols[3] || '').trim();
    if (pmid) pmids.add(pmid);
  }

  return pmids;
}

function setDiff(a, b) {
  const out = [];
  for (const v of a) if (!b.has(v)) out.push(v);
  return out.sort();
}

async function main() {
  const [watchlistMd, checklistMd] = await Promise.all([
    fs.readFile(WATCHLIST_PATH, 'utf8'),
    fs.readFile(CHECKLIST_PATH, 'utf8')
  ]);

  const watchPmids = extractWatchlistHighPriorityPmids(watchlistMd);
  const checklistPmids = extractChecklistPmids(checklistMd);

  const missingInChecklist = setDiff(watchPmids, checklistPmids);
  const staleInChecklist = setDiff(checklistPmids, watchPmids);

  if (missingInChecklist.length > 0 || staleInChecklist.length > 0) {
    console.error('Evidence promotion checklist is out of sync with watchlist high-priority (P0/P1) entries.');
    if (missingInChecklist.length > 0) console.error(`Missing in checklist: ${missingInChecklist.join(', ')}`);
    if (staleInChecklist.length > 0) console.error(`Stale in checklist: ${staleInChecklist.join(', ')}`);
    console.error('Run: npm run evidence:promote');
    process.exit(1);
  }

  console.log(`Evidence promotion checklist sync OK (${watchPmids.size} high-priority PMIDs).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
