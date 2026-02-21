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
const DEFAULT_FILTERED_APPENDIX_LIMIT = 20;
const DEFAULT_FILTERED_TOPIC_DOMINANCE_THRESHOLD = 0.6;
const DEFAULT_TOPIC_STATUS_FLIP_ALERT_THRESHOLD = 1;

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
  /case report/i,
  /rationale and design/i,
  /rationale and methods/i,
  /\bstudy protocol\b/i,
  /\bprotocol study\b/i
];

const GUIDELINE_SIGNAL_PATTERNS = [
  /scientific statement/i,
  /guidelines?\s+(for|from|update|recommendation|management|on)\b/i,
  /guideline\s+expands/i,
  /guideline\s+update/i,
  /consensus/i,
  /recommendation/i,
  /position paper/i
];

const TRIAL_SIGNAL_PATTERNS = [
  /randomized/i,
  /randomised/i,
  /\btrial\b/i,
  /phase\s*[23]/i,
  /noninferiority/i,
  /pragmatic/i
];

const SYNTHESIS_SIGNAL_PATTERNS = [
  /meta-analysis/i,
  /systematic review/i
];

const HIGH_IMPACT_SOURCE_PATTERNS = [
  /n engl j med/i,
  /lancet/i,
  /jama/i,
  /stroke/i,
  /circulation/i
];

const SPECIALTY_SOURCE_PATTERNS = [
  /neurology/i,
  /eur stroke j/i,
  /j neurointerv surg/i,
  /j am heart assoc/i,
  /ann neurol/i,
  /int j stroke/i,
  /transl stroke res/i
];

function parseCliOptions(argv = []) {
  let filteredAppendixLimit = DEFAULT_FILTERED_APPENDIX_LIMIT;
  let filteredAll = false;
  let filteredTopicDominanceThreshold = DEFAULT_FILTERED_TOPIC_DOMINANCE_THRESHOLD;
  let topicStatusFlipAlertThreshold = DEFAULT_TOPIC_STATUS_FLIP_ALERT_THRESHOLD;
  const filteredTopicThresholds = new Map();

  function parseDominanceThreshold(rawValue) {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    if (parsed <= 1) return parsed;
    if (parsed <= 100) return parsed / 100;
    return null;
  }

  function normalizeTopicKey(raw) {
    return String(raw || '').trim().toLowerCase();
  }

  function parseTopicThresholdToken(token) {
    const raw = String(token || '').trim();
    if (!raw) return;
    const eq = raw.indexOf('=');
    if (eq <= 0) return;
    const topicKey = normalizeTopicKey(raw.slice(0, eq));
    const threshold = parseDominanceThreshold(raw.slice(eq + 1));
    if (!topicKey || threshold === null) return;
    filteredTopicThresholds.set(topicKey, threshold);
  }

  function parseTopicThresholdList(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) return;
    raw.split(',').forEach((item) => parseTopicThresholdToken(item));
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--filtered-all') {
      filteredAll = true;
      continue;
    }
    if (arg === '--filtered-limit' && i + 1 < argv.length) {
      const value = Number.parseInt(argv[i + 1], 10);
      if (!Number.isNaN(value) && value > 0) filteredAppendixLimit = value;
      i += 1;
      continue;
    }
    if (arg.startsWith('--filtered-limit=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(value) && value > 0) filteredAppendixLimit = value;
      continue;
    }
    if (arg === '--filtered-dominance-threshold' && i + 1 < argv.length) {
      const threshold = parseDominanceThreshold(argv[i + 1]);
      if (threshold !== null) filteredTopicDominanceThreshold = threshold;
      i += 1;
      continue;
    }
    if (arg.startsWith('--filtered-dominance-threshold=')) {
      const threshold = parseDominanceThreshold(arg.split('=')[1]);
      if (threshold !== null) filteredTopicDominanceThreshold = threshold;
      continue;
    }
    if (arg === '--filtered-topic-threshold' && i + 1 < argv.length) {
      parseTopicThresholdList(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith('--filtered-topic-threshold=')) {
      parseTopicThresholdList(arg.split('=')[1]);
      continue;
    }
    if (arg === '--topic-status-flip-threshold' && i + 1 < argv.length) {
      const value = Number.parseInt(argv[i + 1], 10);
      if (!Number.isNaN(value) && value >= 0) topicStatusFlipAlertThreshold = value;
      i += 1;
      continue;
    }
    if (arg.startsWith('--topic-status-flip-threshold=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(value) && value >= 0) topicStatusFlipAlertThreshold = value;
    }
  }

  return {
    filteredAppendixLimit,
    filteredAll,
    filteredTopicDominanceThreshold,
    filteredTopicThresholds,
    topicStatusFlipAlertThreshold
  };
}

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

function formatPercent(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '';
  return `${(numeric * 100).toFixed(1)}%`;
}

function parsePercentCell(value) {
  const raw = String(value || '').replace('%', '').trim();
  const numeric = Number.parseFloat(raw);
  if (Number.isNaN(numeric)) return null;
  return numeric / 100;
}

function normalizeTopicKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function parsePreviousThresholdMatrix(markdown) {
  const lines = String(markdown || '').split('\n');
  const headingIndex = lines.findIndex((line) => line.trim() === '### Filtered Topic Threshold Matrix');
  if (headingIndex === -1) return new Map();

  let tableStart = -1;
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith('| Topic | Count | Share | Threshold | Status |')) {
      tableStart = i;
      break;
    }
  }
  if (tableStart === -1) return new Map();

  const rows = new Map();
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    const cols = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cols.length < 5) continue;
    const topic = cols[0];
    if (!topic) continue;
    rows.set(topic, {
      topic,
      count: Number.parseInt(cols[1], 10),
      share: parsePercentCell(cols[2]),
      threshold: parsePercentCell(cols[3]),
      status: cols[4]
    });
  }
  return rows;
}

function isHighSignalSource(source) {
  return HIGH_SIGNAL_SOURCE_PATTERNS.some((pattern) => pattern.test(String(source || '')));
}

function isLowValueTitle(title) {
  return LOW_VALUE_TITLE_PATTERNS.some((pattern) => pattern.test(String(title || '')));
}

function getLowValueReason(title) {
  const text = String(title || '');
  for (const pattern of LOW_VALUE_TITLE_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

function matchesTopicTitle(title, terms = []) {
  const normalized = String(title || '').toLowerCase();
  if (!normalized || terms.length === 0) return true;
  return terms.some((term) => normalized.includes(String(term).toLowerCase()));
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(String(text || '')));
}

function toPriorityLabel(score) {
  if (score >= 10) return 'P0 urgent review';
  if (score >= 7) return 'P1 high review';
  if (score >= 4) return 'P2 medium review';
  return 'P3 lower review';
}

function scoreCandidate(article, topic) {
  let score = 0;
  const reasons = [];
  const title = String(article.title || '');
  const source = String(article.source || '');
  const pubtypes = (article.pubtypes || []).join(' | ');

  if (article.year === YEAR_MAX) {
    score += 2;
    reasons.push('current-year publication');
  } else if (article.year === YEAR_MAX - 1) {
    score += 1;
    reasons.push('recent publication');
  }

  if (
    hasPattern(title, GUIDELINE_SIGNAL_PATTERNS) ||
    hasPattern(pubtypes, [/practice guideline/i, /guideline/i, /consensus/i])
  ) {
    score += 6;
    reasons.push('guideline/scientific-statement signal');
  }

  if (
    hasPattern(title, TRIAL_SIGNAL_PATTERNS) ||
    hasPattern(pubtypes, [/randomized controlled trial/i, /clinical trial/i, /multicenter study/i])
  ) {
    score += 4;
    reasons.push('trial-design signal');
  }

  if (hasPattern(title, SYNTHESIS_SIGNAL_PATTERNS)) {
    score += 2;
    reasons.push('evidence-synthesis signal');
  }

  if (hasPattern(source, HIGH_IMPACT_SOURCE_PATTERNS)) {
    score += 2;
    reasons.push('high-impact source');
  } else if (hasPattern(source, SPECIALTY_SOURCE_PATTERNS)) {
    score += 1;
    reasons.push('specialty high-signal source');
  }

  if (
    topic.id === 'evt' &&
    hasPattern(title, [/large core/i, /large infarct/i, /\bmevo\b/i, /\bm2\b/i, /distal occlusion/i])
  ) {
    score += 1;
    reasons.push('direct EVT eligibility relevance');
  }

  if (
    topic.id === 'ich' &&
    hasPattern(title, [/blood pressure/i, /reversal/i, /hematoma expansion/i, /surgery/i, /craniectomy/i])
  ) {
    score += 1;
    reasons.push('direct ICH-management relevance');
  }

  if (
    topic.id === 'special-populations' &&
    hasPattern(title, [/pregnancy/i, /postpartum/i, /maternal/i, /cancer/i, /pediatric/i, /paediatric/i])
  ) {
    score += 1;
    reasons.push('special-population operational relevance');
  }

  return {
    priorityScore: score,
    priorityLabel: toPriorityLabel(score),
    priorityRationale: reasons.join('; ') || 'high-signal source in monitored topic'
  };
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
      doi,
      pubtypes: Array.isArray(item.pubtype) ? item.pubtype : []
    });
  }
  return ordered;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const evidenceMarkdown = await fs.readFile(EVIDENCE_FILE, 'utf8');
  let previousWatchlistMarkdown = '';
  try {
    previousWatchlistMarkdown = await fs.readFile(WATCHLIST_FILE, 'utf8');
  } catch {
    previousWatchlistMarkdown = '';
  }
  const previousThresholdMatrix = parsePreviousThresholdMatrix(previousWatchlistMarkdown);
  const citationRows = parseTableRows(evidenceMarkdown);
  if (citationRows.length === 0) {
    throw new Error('Citation table not found in evidence review file.');
  }

  const citedPmids = new Set();
  citationRows.forEach((row) => {
    extractPmids(row.id).forEach((pmid) => citedPmids.add(pmid));
  });

  const seenCandidatePmids = new Set();
  const filteredLowValue = [];
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
      const lowValueReason = getLowValueReason(article.title);
      if (lowValueReason) {
        filteredLowValue.push({
          topic: topic.label,
          pmid: article.pmid,
          year: article.year,
          source: article.source,
          title: article.title,
          reason: lowValueReason
        });
        continue;
      }
      if (!matchesTopicTitle(article.title, topic.titleTerms)) continue;
      const scored = scoreCandidate(article, topic);
      candidates.push({
        ...article,
        ...scored
      });
      seenCandidatePmids.add(article.pmid);
      if (candidates.length >= MAX_PER_TOPIC) break;
    }

    candidates.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return (b.year || 0) - (a.year || 0);
    });

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

    lines.push('| Priority | Score | Rationale | PMID | Year | Source | Title | DOI | URL |');
    lines.push('|---|---|---|---|---|---|---|---|---|');
    for (const candidate of topic.candidates) {
      lines.push(
        `| ${escapePipes(candidate.priorityLabel)} | ${candidate.priorityScore} | ${escapePipes(candidate.priorityRationale)} | ${candidate.pmid} | ${candidate.year || ''} | ${escapePipes(candidate.source)} | ${escapePipes(candidate.title)} | ${escapePipes(candidate.doi)} | https://pubmed.ncbi.nlm.nih.gov/${candidate.pmid}/ |`
      );
    }
    lines.push('');
  }

  lines.push('## Notes');
  lines.push('- This watchlist is a screening aid, not an automatic recommendation update.');
  lines.push('- Priority scores are triage-only and weight guideline/trial signal, recency, source strength, and direct workflow relevance.');
  lines.push('- Additions to evidence tables should still be clinician-reviewed for methodological quality and workflow relevance.');
  lines.push('- Filtered low-actionability entries are listed below for optional reviewer override.');
  lines.push('');

  lines.push('## Filtered Low-Actionability Candidates (Audit Appendix)');
  if (filteredLowValue.length === 0) {
    lines.push('- None.');
    lines.push('');
  } else {
    const appendixLimit = options.filteredAll
      ? filteredLowValue.length
      : Math.max(1, options.filteredAppendixLimit || DEFAULT_FILTERED_APPENDIX_LIMIT);
    const appendixRows = filteredLowValue.slice(0, appendixLimit);
    lines.push('| Topic | PMID | Year | Source | Title | Filter reason | URL |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const item of appendixRows) {
      lines.push(
        `| ${escapePipes(item.topic)} | ${item.pmid} | ${item.year || ''} | ${escapePipes(item.source)} | ${escapePipes(item.title)} | ${escapePipes(item.reason)} | https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/ |`
      );
    }
    if (!options.filteredAll && filteredLowValue.length > appendixRows.length) {
      lines.push(`| ... | ... | ... | ... | ... | ... | ... |`);
    }
    lines.push('');

    const reasonCounts = new Map();
    for (const item of filteredLowValue) {
      const key = item.reason || 'unknown';
      reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
    }
    const reasonRows = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]);
    lines.push('### Filtered Candidate Summary by Reason');
    lines.push('| Filter reason | Count |');
    lines.push('|---|---|');
    for (const [reason, count] of reasonRows) {
      lines.push(`| ${escapePipes(reason)} | ${count} |`);
    }
    lines.push('');

    const topicReasonCounts = new Map();
    for (const item of filteredLowValue) {
      const key = `${item.topic}|||${item.reason || 'unknown'}`;
      topicReasonCounts.set(key, (topicReasonCounts.get(key) || 0) + 1);
    }
    const topicReasonRows = [...topicReasonCounts.entries()]
      .map(([key, count]) => {
        const [topic, reason] = key.split('|||');
        return { topic, reason, count };
      })
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

    lines.push('### Filtered Candidate Summary by Topic and Reason');
    lines.push('| Topic | Filter reason | Count |');
    lines.push('|---|---|---|');
    for (const row of topicReasonRows) {
      lines.push(`| ${escapePipes(row.topic)} | ${escapePipes(row.reason)} | ${row.count} |`);
    }
    lines.push('');

    const topicCounts = new Map();
    for (const item of filteredLowValue) {
      const key = item.topic || 'Unknown topic';
      topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
    }
    const topicRows = [...topicCounts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
    const totalFiltered = filteredLowValue.length;
    const topTopic = topicRows[0] || { topic: 'None', count: 0 };
    const topShare = totalFiltered > 0 ? topTopic.count / totalFiltered : 0;
    const dominanceThreshold = options.filteredTopicDominanceThreshold || DEFAULT_FILTERED_TOPIC_DOMINANCE_THRESHOLD;
    const topicIdByLabel = new Map(
      TOPIC_QUERIES.map((topic) => [normalizeTopicKey(topic.label), normalizeTopicKey(topic.id)])
    );
    const customThresholds = options.filteredTopicThresholds || new Map();
    const resolveThreshold = (topicLabel) => {
      const normalizedLabel = normalizeTopicKey(topicLabel);
      const topicId = topicIdByLabel.get(normalizedLabel);
      if (topicId && customThresholds.has(topicId)) return customThresholds.get(topicId);
      if (customThresholds.has(normalizedLabel)) return customThresholds.get(normalizedLabel);
      return dominanceThreshold;
    };
    const topThreshold = resolveThreshold(topTopic.topic);
    const dominanceAlert = topShare >= topThreshold;

    lines.push('### Filtered Topic Dominance Alert');
    lines.push('| Topic | Count | Share | Alert threshold | Status |');
    lines.push('|---|---|---|---|---|');
    lines.push(
      `| ${escapePipes(topTopic.topic)} | ${topTopic.count} | ${formatPercent(topShare)} | ${formatPercent(topThreshold)} | ${dominanceAlert ? 'ALERT' : 'OK'} |`
    );
    lines.push('');
    lines.push('### Filtered Topic Threshold Matrix');
    lines.push('| Topic | Count | Share | Threshold | Status |');
    lines.push('|---|---|---|---|---|');
    for (const row of topicRows) {
      const share = totalFiltered > 0 ? row.count / totalFiltered : 0;
      const threshold = resolveThreshold(row.topic);
      lines.push(
        `| ${escapePipes(row.topic)} | ${row.count} | ${formatPercent(share)} | ${formatPercent(threshold)} | ${share >= threshold ? 'ALERT' : 'OK'} |`
      );
    }
    lines.push('');
    lines.push('### Filtered Topic Threshold Trend (vs Previous Run)');
    if (previousThresholdMatrix.size === 0) {
      lines.push('- No previous threshold-matrix snapshot available for comparison.');
      lines.push('');
    } else {
      lines.push('| Topic | Previous share | Current share | Delta (pp) | Previous status | Current status |');
      lines.push('|---|---|---|---|---|---|');
      const statusFlips = [];
      for (const row of topicRows) {
        const currentShare = totalFiltered > 0 ? row.count / totalFiltered : 0;
        const currentThreshold = resolveThreshold(row.topic);
        const currentStatus = currentShare >= currentThreshold ? 'ALERT' : 'OK';
        const previous = previousThresholdMatrix.get(row.topic) || null;
        const prevShare = previous?.share;
        const prevStatus = previous?.status || 'n/a';
        const deltaPp = prevShare === null || typeof prevShare !== 'number'
          ? 'n/a'
          : `${((currentShare - prevShare) * 100).toFixed(1)}pp`;
        lines.push(
          `| ${escapePipes(row.topic)} | ${prevShare === null || typeof prevShare !== 'number' ? 'n/a' : formatPercent(prevShare)} | ${formatPercent(currentShare)} | ${deltaPp} | ${escapePipes(prevStatus)} | ${currentStatus} |`
        );
        if ((prevStatus === 'ALERT' || prevStatus === 'OK') && prevStatus !== currentStatus) {
          statusFlips.push({ topic: row.topic, previousStatus: prevStatus, currentStatus });
        }
      }
      lines.push('');
      lines.push('### Topic Status Flip Alert');
      if (statusFlips.length === 0) {
        lines.push('- No topic status flips detected compared with previous run.');
      } else {
        lines.push('| Topic | Previous status | Current status |');
        lines.push('|---|---|---|');
        for (const flip of statusFlips) {
          lines.push(`| ${escapePipes(flip.topic)} | ${flip.previousStatus} | ${flip.currentStatus} |`);
        }
        const flipThreshold = Math.max(0, options.topicStatusFlipAlertThreshold ?? DEFAULT_TOPIC_STATUS_FLIP_ALERT_THRESHOLD);
        lines.push('');
        lines.push(
          `- ${statusFlips.length >= flipThreshold ? 'ALERT' : 'Info'}: ${statusFlips.length} topic status flip(s) detected (threshold ${flipThreshold}).`
        );
      }
      lines.push('');
    }
    if (dominanceAlert) {
      lines.push(
        `- Alert: ${escapePipes(topTopic.topic)} contributes ${formatPercent(topShare)} of filtered entries (threshold ${formatPercent(topThreshold)}). Review filter strictness for this topic.`
      );
    } else {
      lines.push(
        `- No dominance alert. Top topic share is ${formatPercent(topShare)} (threshold ${formatPercent(topThreshold)}).`
      );
    }
    if (customThresholds.size > 0) {
      lines.push(`- Custom per-topic threshold overrides active for ${customThresholds.size} topic key(s).`);
    }
    lines.push('');
  }

  await fs.writeFile(WATCHLIST_FILE, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Evidence watchlist updated: ${path.relative(process.cwd(), WATCHLIST_FILE)}`);
  console.log(`Topics scanned: ${TOPIC_QUERIES.length}; uncited candidates: ${seenCandidatePmids.size}.`);
  console.log(`Filtered low-actionability candidates logged: ${filteredLowValue.length}${options.filteredAll ? ' (full appendix)' : ` (appendix limit ${options.filteredAppendixLimit})`}.`);
  if (filteredLowValue.length > 0) {
    const topicCounts = new Map();
    for (const item of filteredLowValue) {
      topicCounts.set(item.topic, (topicCounts.get(item.topic) || 0) + 1);
    }
    const topTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = topTopic ? topTopic[1] / filteredLowValue.length : 0;
    const threshold = options.filteredTopicDominanceThreshold || DEFAULT_FILTERED_TOPIC_DOMINANCE_THRESHOLD;
    console.log(
      `Filtered dominance: ${topTopic ? `${topTopic[0]} (${formatPercent(share)})` : 'none'}; threshold ${formatPercent(threshold)}; status ${share >= threshold ? 'ALERT' : 'OK'}.`
    );
    if ((options.filteredTopicThresholds || new Map()).size > 0) {
      console.log(`Custom topic thresholds active: ${(options.filteredTopicThresholds || new Map()).size}.`);
    }
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
