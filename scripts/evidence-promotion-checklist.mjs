import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const WATCHLIST_PATH = path.join(process.cwd(), 'docs', 'evidence-watchlist.md');
const OUTPUT_PATH = path.join(process.cwd(), 'docs', 'evidence-promotion-checklist.md');

function parseMarkdownTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  const cols = trimmed.split('|').slice(1, -1).map((part) => part.trim());
  return cols;
}

function escapePipes(text) {
  return String(text || '').replace(/\|/g, '\\|');
}

function actionByTopic(topic) {
  const t = String(topic || '').toLowerCase();
  if (t.includes('evt')) return 'Confirm impact on EVT eligibility/MeVO caution; update criteria and note traces if practice-changing.';
  if (t.includes('intracerebral hemorrhage') || t.includes('ich')) return 'Assess impact on BP/reversal/escalation timing pathways and update KPI logic if warranted.';
  if (t.includes('sah') || t.includes('cvt')) return 'Assess effect on SAH/CVT protocols and standardized follow-up outcome capture.';
  if (t.includes('secondary prevention')) return 'Assess antithrombotic/lipid/BP/AF timing implications and update discharge pathways.';
  if (t.includes('special populations')) return 'Assess pregnancy/cancer/pediatric pathway impact and update dedicated modules.';
  return 'Assess methodological quality and workflow relevance; promote only if directly practice-changing.';
}

function isPriorityForPromotion(priority) {
  const p = String(priority || '').toLowerCase();
  return p.startsWith('p0') || p.startsWith('p1');
}

async function main() {
  const markdown = await fs.readFile(WATCHLIST_PATH, 'utf8');
  const lines = markdown.split('\n');

  let currentTopic = '';
  let inTable = false;
  const candidates = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      currentTopic = line.replace(/^##\s+/, '').trim();
      inTable = false;
      continue;
    }

    if (line.startsWith('| Priority |')) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;

    if (/^\|[-\s|]+\|\s*$/.test(line.trim())) continue;

    const cols = parseMarkdownTableRow(line);
    if (!cols || cols.length < 9) {
      if (line.trim() === '' || !line.trim().startsWith('|')) inTable = false;
      continue;
    }

    const [priority, score, rationale, pmid, year, source, title, doi, url] = cols;
    if (!isPriorityForPromotion(priority)) continue;

    candidates.push({
      topic: currentTopic,
      priority,
      score,
      rationale,
      pmid,
      year,
      source,
      title,
      doi,
      url
    });
  }

  candidates.sort((a, b) => {
    const rank = (p) => {
      const pp = String(p || '').toLowerCase();
      if (pp.startsWith('p0')) return 0;
      if (pp.startsWith('p1')) return 1;
      if (pp.startsWith('p2')) return 2;
      return 3;
    };
    const r = rank(a.priority) - rank(b.priority);
    if (r !== 0) return r;
    return String(a.topic).localeCompare(String(b.topic));
  });

  const topicCounts = new Map();
  for (const c of candidates) {
    topicCounts.set(c.topic, (topicCounts.get(c.topic) || 0) + 1);
  }

  const generatedAt = new Date().toISOString();
  const out = [];
  out.push('# Evidence Promotion Checklist (Auto-generated)');
  out.push('');
  out.push(`Generated: ${generatedAt}`);
  out.push(`Source watchlist: ${path.relative(process.cwd(), WATCHLIST_PATH)}`);
  out.push('Inclusion: P0 urgent review + P1 high review');
  out.push('');

  if (candidates.length === 0) {
    out.push('No P0/P1 candidates found in the current watchlist.');
  } else {
    out.push('## Queue Summary');
    out.push(`- Total candidates: ${candidates.length}`);
    for (const [topic, count] of topicCounts.entries()) {
      out.push(`- ${topic}: ${count}`);
    }
    out.push('');
    out.push('## Promotion Queue');
    out.push('| Done | Topic | Priority | PMID | Year | Title | Source | DOI | URL | Promotion Action |');
    out.push('|---|---|---|---|---|---|---|---|---|---|');

    for (const c of candidates) {
      out.push(`| [ ] | ${escapePipes(c.topic)} | ${escapePipes(c.priority)} | ${escapePipes(c.pmid)} | ${escapePipes(c.year)} | ${escapePipes(c.title)} | ${escapePipes(c.source)} | ${escapePipes(c.doi)} | ${escapePipes(c.url)} | ${escapePipes(actionByTopic(c.topic))} |`);
    }

    out.push('');
    out.push('## Review Notes');
    out.push('- Promotion requires methodological quality check before updating recommendation logic.');
    out.push('- For accepted items, update: `docs/evidence-review-2021-2026.md`, relevant pathway UI text, and generated-note traces.');
    out.push('- Re-run `npm run validate:citations` and `npm run qa` after any evidence promotion edits.');
  }

  await fs.writeFile(OUTPUT_PATH, `${out.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)} with ${candidates.length} high-priority candidates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
