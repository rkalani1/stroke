import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const EVIDENCE_FILE = path.join(process.cwd(), 'docs', 'evidence-review-2021-2026.md');
const WATCHLIST_FILE = path.join(process.cwd(), 'docs', 'evidence-watchlist.md');
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const WINDOW_START = '2025/01/01';
const WINDOW_END = '3000';
const YEAR_MIN = 2021;
const YEAR_MAX = 2026;
const MAX_SEARCH_IDS = 30;
const MAX_PER_TOPIC = 8;
const REQUEST_DELAY_MS = 350;

const TOPIC_QUERIES = [
  {
    id: 'thrombolysis',
    label: 'Thrombolysis and Extended-Window Reperfusion',
    query: '(acute ischemic stroke[Title/Abstract]) AND (tenecteplase[Title/Abstract] OR alteplase[Title/Abstract] OR thrombolysis[Title/Abstract] OR wake-up[Title/Abstract] OR "extended window"[Title/Abstract])',
    titleTerms: ['tenecteplase', 'alteplase', 'thrombolysis', 'wake-up', 'wake up', 'extended']
  },
  {
    id: 'evt',
    label: 'EVT Eligibility (Large Core / Distal Occlusion)',
    query: '(acute ischemic stroke[Title/Abstract]) AND (thrombectomy[Title/Abstract] OR endovascular[Title/Abstract]) AND (large infarct[Title/Abstract] OR large core[Title/Abstract] OR MeVO[Title/Abstract] OR distal occlusion[Title/Abstract])',
    titleTerms: ['thrombectomy', 'endovascular', 'large core', 'large infarct', 'lvo', 'mevo', 'distal occlusion']
  },
  {
    id: 'ich',
    label: 'Intracerebral Hemorrhage (BP, Reversal, Escalation)',
    query: '(intracerebral hemorrhage[Title/Abstract] OR intracerebral haemorrhage[Title/Abstract]) AND (blood pressure[Title/Abstract] OR reversal[Title/Abstract] OR andexanet[Title/Abstract] OR surgery[Title/Abstract] OR minimally invasive[Title/Abstract])',
    titleTerms: ['intracerebral hemorrhage', 'intracerebral haemorrhage', 'ich', 'andexanet', 'hematoma']
  },
  {
    id: 'sah-cvt',
    label: 'SAH and CVT',
    query: '((subarachnoid hemorrhage[Title/Abstract] OR subarachnoid haemorrhage[Title/Abstract] OR cerebral venous thrombosis[Title/Abstract])) AND (guideline[Title/Abstract] OR trial[Title/Abstract] OR statement[Title/Abstract] OR management[Title/Abstract])',
    titleTerms: ['subarachnoid', 'aneurysm', 'cerebral venous thrombosis', 'cvt', 'venous thrombosis']
  },
  {
    id: 'secondary-prevention',
    label: 'Secondary Prevention and Cardioembolic Timing',
    query: '(ischemic stroke[Title/Abstract] OR transient ischemic attack[Title/Abstract]) AND (dual antiplatelet[Title/Abstract] OR anticoagulation timing[Title/Abstract] OR atrial fibrillation[Title/Abstract] OR secondary prevention[Title/Abstract])',
    titleTerms: ['secondary prevention', 'dual antiplatelet', 'atrial fibrillation', 'anticoagulation', 'tia', 'minor stroke']
  },
  {
    id: 'special-populations',
    label: 'Special Populations (Pregnancy / Cancer / Pediatric)',
    query: '(stroke[Title/Abstract]) AND (pregnancy[Title/Abstract] OR postpartum[Title/Abstract] OR maternal[Title/Abstract] OR cancer[Title/Abstract] OR pediatric[Title/Abstract] OR paediatric[Title/Abstract]) AND (guideline[Title/Abstract] OR trial[Title/Abstract] OR statement[Title/Abstract])',
    titleTerms: ['pregnancy', 'postpartum', 'maternal', 'pediatric', 'paediatric', 'cancer']
  }
];

const HIGH_SIGNAL_SOURCE_PATTERNS = [
  /stroke/i,
  /n engl j med/i,
  /lancet/i,
  /jama/i,
  /circulation/i,
  /neurology/i,
  /eur stroke j/i,
  /j neurointerv surg/i,
  /j am heart assoc/i,
  /ann neurol/i
];

const LOW_VALUE_TITLE_PATTERNS = [
  /^response to/i,
  /^re:/i,
  /^corrigendum/i,
  /^comment/i,
  /^editorial/i,
  /case report/i
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTableRows(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim().startsWith('| Domain | Evidence tag | Title | Year | Journal/Source | URL | PMID / DOI / NCT |'));
  if (start === -1) return [];

  const rows = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    if (/^\|[-\s|]+\|$/.test(line)) continue;
    const cols = line.split('|').slice(1, -1).map((item) => item.trim());
    rows.push({
      domain: cols[0] || '',
      tag: cols[1] || '',
      title: cols[2] || '',
      year: cols[3] || '',
      source: cols[4] || '',
      url: cols[5] || '',
      id: cols[6] || ''
    });
  }
  return rows;
}

function extractPmids(idField) {
  return [...String(idField || '').matchAll(/PMID\s*:\s*(\d+)/gi)].map((match) => match[1]);
}

function extractYear(pubdate) {
  const match = String(pubdate || '').match(/\b(20\d{2})\b/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function escapePipes(text) {
  return String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function isHighSignalSource(source) {
  return HIGH_SIGNAL_SOURCE_PATTERNS.some((pattern) => pattern.test(String(source || '')));
}

function isLowValueTitle(title) {
  return LOW_VALUE_TITLE_PATTERNS.some((pattern) => pattern.test(String(title || '')));
}

function matchesTopicTitle(title, terms = []) {
  const normalized = String(title || '').toLowerCase();
  if (!normalized || terms.length === 0) return true;
  return terms.some((term) => normalized.includes(String(term).toLowerCase()));
}

async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'stroke-evidence-watch/1.0' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function searchPubMed(term) {
  const fullTerm = `${term} AND ("${WINDOW_START}"[Date - Publication] : "${WINDOW_END}"[Date - Publication])`;
  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax=${MAX_SEARCH_IDS}&term=${encodeURIComponent(fullTerm)}`;
  const payload = await fetchJson(url);
  await sleep(REQUEST_DELAY_MS);
  return payload?.esearchresult?.idlist || [];
}

async function summarizePubMed(ids) {
  if (!ids || ids.length === 0) return [];
  const url = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
  const payload = await fetchJson(url);
  await sleep(REQUEST_DELAY_MS);

  const ordered = [];
  for (const id of ids) {
    const item = payload?.result?.[id];
    if (!item) continue;
    const doi = (item.articleids || []).find((entry) => entry.idtype === 'doi')?.value || '';
    ordered.push({
      pmid: id,
      title: item.title || '',
      source: item.source || '',
      pubdate: item.pubdate || '',
      year: extractYear(item.pubdate),
      doi
    });
  }
  return ordered;
}

async function main() {
  const evidenceMarkdown = await fs.readFile(EVIDENCE_FILE, 'utf8');
  const citationRows = parseTableRows(evidenceMarkdown);
  if (citationRows.length === 0) {
    throw new Error('Citation table not found in evidence review file.');
  }

  const citedPmids = new Set();
  citationRows.forEach((row) => {
    extractPmids(row.id).forEach((pmid) => citedPmids.add(pmid));
  });

  const seenCandidatePmids = new Set();
  const resultsByTopic = [];

  for (const topic of TOPIC_QUERIES) {
    const ids = await searchPubMed(topic.query);
    const summaries = await summarizePubMed(ids);
    const candidates = [];

    for (const article of summaries) {
      if (!article.pmid) continue;
      if (citedPmids.has(article.pmid)) continue;
      if (seenCandidatePmids.has(article.pmid)) continue;
      if (!article.year || article.year < YEAR_MIN || article.year > YEAR_MAX) continue;
      if (!isHighSignalSource(article.source)) continue;
      if (isLowValueTitle(article.title)) continue;
      if (!matchesTopicTitle(article.title, topic.titleTerms)) continue;
      candidates.push(article);
      seenCandidatePmids.add(article.pmid);
      if (candidates.length >= MAX_PER_TOPIC) break;
    }

    resultsByTopic.push({
      ...topic,
      candidates
    });
  }

  const generatedAt = new Date().toISOString();
  const lines = [];
  lines.push('# Evidence Watchlist (Auto-generated)');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push('');
  lines.push('Purpose: highlight potentially relevant **uncited** PubMed evidence for 2021-2026 stroke workflows.');
  lines.push(`Baseline cited PMIDs: ${citedPmids.size}`);
  lines.push(`Search window start: ${WINDOW_START}`);
  lines.push('');

  for (const topic of resultsByTopic) {
    lines.push(`## ${topic.label}`);
    if (topic.candidates.length === 0) {
      lines.push('- No uncited candidates identified in current query window.');
      lines.push('');
      continue;
    }

    lines.push('| PMID | Year | Source | Title | DOI | URL |');
    lines.push('|---|---|---|---|---|---|');
    for (const candidate of topic.candidates) {
      lines.push(
        `| ${candidate.pmid} | ${candidate.year || ''} | ${escapePipes(candidate.source)} | ${escapePipes(candidate.title)} | ${escapePipes(candidate.doi)} | https://pubmed.ncbi.nlm.nih.gov/${candidate.pmid}/ |`
      );
    }
    lines.push('');
  }

  lines.push('## Notes');
  lines.push('- This watchlist is a screening aid, not an automatic recommendation update.');
  lines.push('- Additions to evidence tables should still be clinician-reviewed for methodological quality and workflow relevance.');
  lines.push('');

  await fs.writeFile(WATCHLIST_FILE, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Evidence watchlist updated: ${path.relative(process.cwd(), WATCHLIST_FILE)}`);
  console.log(`Topics scanned: ${TOPIC_QUERIES.length}; uncited candidates: ${seenCandidatePmids.size}.`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
