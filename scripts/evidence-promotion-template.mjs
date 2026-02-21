import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const CHECKLIST_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-checklist.md');
const OUTPUT_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-template.md');

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

async function main() {
  const checklistMd = await fs.readFile(CHECKLIST_PATH, 'utf8');
  const queue = parseQueue(checklistMd);
  const pending = queue.filter((row) => isUnchecked(row.done));

  const now = new Date().toISOString();
  const lines = [];
  lines.push('# Evidence Promotion Draft Template (Auto-generated)');
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push(`Source checklist: ${path.relative(process.cwd(), CHECKLIST_PATH)}`);
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

  await fs.writeFile(OUTPUT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)} with ${pending.length} pending candidates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
