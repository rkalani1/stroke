import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const CHECKLIST_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-checklist.md');
const DEFAULT_OUTPUT_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-template.md');

function parseMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed.split('|').slice(1, -1).map((s) => s.trim());
}

function escapePipes(text) {
  return String(text || '').replace(/\|/g, '\\|');
}

function parseQueue(markdown) {
  const lines = markdown.split('\n');
  const rows = [];
  let inQueue = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('| Done | Topic | Priority | PMID |')) {
      inQueue = true;
      continue;
    }
    if (!inQueue) continue;
    if (/^\|[-\s|]+\|\s*$/.test(line.trim())) continue;

    const cols = parseMarkdownRow(line);
    if (!cols || cols.length < 10) {
      if (line.trim() === '' || !line.trim().startsWith('|')) break;
      continue;
    }

    const [done, topic, priority, pmid, year, title, source, doi, url, action] = cols;
    rows.push({ done, topic, priority, pmid, year, title, source, doi, url, action });
  }

  return rows;
}

function isUnchecked(doneCell) {
  return /\[\s\]/.test(String(doneCell || ''));
}

function parseArgs(argv) {
  const args = { pmids: new Set(), priority: 'all', limit: null, outputPath: DEFAULT_OUTPUT_PATH };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--pmid' && argv[i + 1]) {
      args.pmids.add(String(argv[i + 1]).trim());
      i += 1;
      continue;
    }
    if (token.startsWith('--pmid=')) {
      const id = token.split('=')[1];
      if (id) args.pmids.add(String(id).trim());
      continue;
    }
    if (token === '--priority' && argv[i + 1]) {
      args.priority = String(argv[i + 1]).trim().toLowerCase();
      i += 1;
      continue;
    }
    if (token.startsWith('--priority=')) {
      args.priority = String(token.split('=')[1] || '').trim().toLowerCase();
      continue;
    }
    if (token === '--limit' && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      args.limit = Number.isNaN(n) ? null : n;
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      const n = Number.parseInt(token.split('=')[1], 10);
      args.limit = Number.isNaN(n) ? null : n;
      continue;
    }
    if (token === '--output' && argv[i + 1]) {
      args.outputPath = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (token.startsWith('--output=')) {
      args.outputPath = path.resolve(process.cwd(), token.split('=')[1]);
      continue;
    }
  }
  return args;
}

function priorityMatches(rowPriority, filterPriority) {
  if (!filterPriority || filterPriority === 'all') return true;
  const p = String(rowPriority || '').toLowerCase();
  if (filterPriority === 'p0') return p.startsWith('p0');
  if (filterPriority === 'p1') return p.startsWith('p1');
  if (filterPriority === 'p0,p1' || filterPriority === 'p1,p0') return p.startsWith('p0') || p.startsWith('p1');
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const checklistMd = await fs.readFile(CHECKLIST_PATH, 'utf8');
  const queue = parseQueue(checklistMd);
  let pending = queue.filter((row) => isUnchecked(row.done));

  if (args.pmids.size > 0) {
    pending = pending.filter((row) => args.pmids.has(String(row.pmid)));
  }

  pending = pending.filter((row) => priorityMatches(row.priority, args.priority));

  if (typeof args.limit === 'number' && args.limit >= 0) {
    pending = pending.slice(0, args.limit);
  }

  const now = new Date().toISOString();
  const lines = [];
  lines.push('# Evidence Promotion Draft Template (Auto-generated)');
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push(`Source checklist: ${path.relative(process.cwd(), CHECKLIST_PATH)}`);
  lines.push(`Filter: priority=${args.priority || 'all'}${args.pmids.size > 0 ? `; pmids=${[...args.pmids].join(',')}` : ''}${typeof args.limit === 'number' && args.limit >= 0 ? `; limit=${args.limit}` : ''}`);
  lines.push(`Pending candidates: ${pending.length}`);
  lines.push('');

  if (pending.length === 0) {
    lines.push('No unchecked candidates found in promotion checklist.');
  } else {
    lines.push('## How to use');
    lines.push('- Copy one candidate block into a PR description or issue.');
    lines.push('- Complete metadata verification and workflow-impact checkboxes before promotion.');
    lines.push('');

    pending.forEach((c, idx) => {
      lines.push(`## Candidate ${idx + 1}: PMID ${c.pmid} (${c.priority})`);
      lines.push('');
      lines.push(`- Topic: ${c.topic}`);
      lines.push(`- Title: ${c.title}`);
      lines.push(`- Source: ${c.source} (${c.year})`);
      lines.push(`- DOI: ${c.doi}`);
      lines.push(`- URL: ${c.url}`);
      lines.push(`- Promotion focus: ${c.action}`);
      lines.push('');
      lines.push('### Metadata patch block');
      lines.push('| Field | Value |');
      lines.push('|---|---|');
      lines.push(`| Domain | ${escapePipes(c.topic)} |`);
      lines.push(`| Title | ${escapePipes(c.title)} |`);
      lines.push(`| Year | ${escapePipes(c.year)} |`);
      lines.push(`| Journal/Source | ${escapePipes(c.source)} |`);
      lines.push(`| URL | ${escapePipes(c.url)} |`);
      lines.push(`| PMID / DOI / NCT | PMID: ${escapePipes(c.pmid)}; DOI: ${escapePipes(c.doi)} |`);
      lines.push('');
      lines.push('### Workflow impact checklist');
      lines.push('- [ ] Add/update row in `docs/evidence-review-2021-2026.md`');
      lines.push('- [ ] Update relevant pathway text/logic in `src/app.jsx` if practice-changing');
      lines.push('- [ ] Update generated-note trace output where applicable');
      lines.push('- [ ] Re-run `npm run validate:citations`');
      lines.push('- [ ] Re-run `npm test` and `npm run qa`');
      lines.push('');
    });
  }

  await fs.writeFile(args.outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), args.outputPath)} with ${pending.length} pending candidates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
