import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const filePath = path.join(process.cwd(), 'docs', 'evidence-review-2021-2026.md');
const yearMin = 2021;
const yearMax = 2026;
const args = new Set(process.argv.slice(2));
const checkLinks = args.has('--check-links');
const linkTimeoutMs = 10000;
const linkRetries = 1;
const linkConcurrency = 4;

function parseTableRows(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim().startsWith('| Domain | Evidence tag | Title | Year | Journal/Source | URL | PMID / DOI / NCT |'));
  if (start === -1) return [];

  const rows = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    if (/^\|[-\s|]+\|$/.test(line)) continue;
    rows.push(line);
  }
  return rows;
}

function splitRow(row) {
  const cols = row.split('|').slice(1, -1).map((item) => item.trim());
  return {
    raw: row,
    cols,
    domain: cols[0] || '',
    tag: cols[1] || '',
    title: cols[2] || '',
    year: cols[3] || '',
    source: cols[4] || '',
    url: cols[5] || '',
    id: cols[6] || ''
  };
}

function extractIdentifiers(idField) {
  const pmids = [...idField.matchAll(/PMID\s*:\s*(\d+)/gi)].map((match) => match[1]);
  const dois = [...idField.matchAll(/DOI\s*:\s*([^;\s]+)/gi)].map((match) => match[1]);
  const ncts = [...idField.matchAll(/NCT\s*:?\s*(NCT\d{8})/gi)].map((match) => match[1].toUpperCase());
  return { pmids, dois, ncts };
}

function validateRows(parsedRows) {
  const errors = [];
  const seenTitles = new Set();
  const seenPmids = new Map();
  const seenDois = new Map();
  const seenNcts = new Map();

  parsedRows.forEach((item, index) => {
    const rowNum = index + 1;

    if (item.cols.length < 7) {
      errors.push(`row ${rowNum}: expected 7 columns, got ${item.cols.length}`);
      return;
    }

    if (!item.domain) errors.push(`row ${rowNum}: missing domain`);
    if (!item.tag) errors.push(`row ${rowNum}: missing evidence tag`);
    if (!item.title) errors.push(`row ${rowNum}: missing title`);
    if (!item.source) errors.push(`row ${rowNum}: missing journal/source`);

    const year = Number.parseInt(item.year, 10);
    if (Number.isNaN(year) || year < yearMin || year > yearMax) {
      errors.push(`row ${rowNum}: year '${item.year}' outside ${yearMin}-${yearMax}`);
    }

    if (!/^https?:\/\//i.test(item.url)) {
      errors.push(`row ${rowNum}: invalid URL '${item.url}'`);
    }

    if (!/(PMID\s*:\s*\d+|DOI\s*:\s*[^;\s]+|NCT\s*:?\s*NCT\d{8})/i.test(item.id)) {
      errors.push(`row ${rowNum}: missing PMID/DOI/NCT metadata in '${item.id}'`);
    }

    const { pmids, dois, ncts } = extractIdentifiers(item.id);

    for (const pmid of pmids) {
      if (!/^\d{6,9}$/.test(pmid)) {
        errors.push(`row ${rowNum}: invalid PMID format '${pmid}'`);
      }
      const prior = seenPmids.get(pmid);
      if (prior && prior !== item.title) {
        errors.push(`row ${rowNum}: PMID '${pmid}' duplicated across titles ('${prior}' and '${item.title}')`);
      } else {
        seenPmids.set(pmid, item.title);
      }
    }

    for (const doi of dois) {
      if (!/^10\.\d{4,9}\/\S+$/i.test(doi)) {
        errors.push(`row ${rowNum}: invalid DOI format '${doi}'`);
      }
      const normalized = doi.toLowerCase();
      const prior = seenDois.get(normalized);
      if (prior && prior !== item.title) {
        errors.push(`row ${rowNum}: DOI '${doi}' duplicated across titles ('${prior}' and '${item.title}')`);
      } else {
        seenDois.set(normalized, item.title);
      }
    }

    for (const nct of ncts) {
      if (!/^NCT\d{8}$/i.test(nct)) {
        errors.push(`row ${rowNum}: invalid NCT format '${nct}'`);
      }
      const normalized = nct.toUpperCase();
      const prior = seenNcts.get(normalized);
      if (prior && prior !== item.title) {
        errors.push(`row ${rowNum}: NCT '${nct}' duplicated across titles ('${prior}' and '${item.title}')`);
      } else {
        seenNcts.set(normalized, item.title);
      }
    }

    const dedupeKey = `${item.title.toLowerCase()}::${item.year}`;
    if (seenTitles.has(dedupeKey)) {
      errors.push(`row ${rowNum}: duplicate title/year '${item.title}' (${item.year})`);
    }
    seenTitles.add(dedupeKey);
  });

  return errors;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHealthyUrlStatus(status) {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = linkTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { redirect: 'follow', ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrlHealth(url) {
  const methods = ['HEAD', 'GET'];
  let lastFailure = null;

  for (const method of methods) {
    for (let attempt = 0; attempt <= linkRetries; attempt += 1) {
      try {
        const response = await fetchWithTimeout(url, { method, headers: { 'user-agent': 'stroke-citation-validator/1.0' } });
        const status = response.status;
        if (isHealthyUrlStatus(status)) {
          return { ok: true, status, method, warning: status === 401 || status === 403 ? `HTTP ${status}` : null };
        }

        if (method === 'HEAD' && (status === 405 || status === 501)) {
          break;
        }
        if (method === 'HEAD' && status >= 400) {
          break;
        }
        lastFailure = { status, method, message: `HTTP ${status}` };
      } catch (error) {
        lastFailure = { status: null, method, message: error?.message || String(error) };
        if (attempt < linkRetries) {
          await sleep(250 * (attempt + 1));
          continue;
        }
      }
    }
  }

  return {
    ok: false,
    status: lastFailure?.status ?? null,
    method: lastFailure?.method || 'GET',
    message: lastFailure?.message || 'unreachable URL'
  };
}

async function validateUrlHealth(parsedRows) {
  const errors = [];
  const warnings = [];
  const uniqueUrls = new Map();

  parsedRows.forEach((row, idx) => {
    if (!row.url) return;
    const rowNum = idx + 1;
    const existing = uniqueUrls.get(row.url) || [];
    existing.push({ rowNum, title: row.title });
    uniqueUrls.set(row.url, existing);
  });

  const entries = [...uniqueUrls.entries()];
  let cursor = 0;

  const workers = Array.from({ length: Math.min(linkConcurrency, entries.length || 1) }, async () => {
    while (cursor < entries.length) {
      const current = cursor;
      cursor += 1;
      const [url, refs] = entries[current];
      const health = await checkUrlHealth(url);
      const rowSummary = refs.map((ref) => ref.rowNum).join(', ');

      if (!health.ok) {
        errors.push(`URL health check failed for row(s) ${rowSummary}: ${url} (${health.message})`);
        continue;
      }

      if (health.warning) {
        warnings.push(`URL row(s) ${rowSummary} returned ${health.warning} (${url})`);
      }
    }
  });

  await Promise.all(workers);
  return { errors, warnings, checkedCount: entries.length };
}

async function main() {
  const markdown = await fs.readFile(filePath, 'utf8');
  const rows = parseTableRows(markdown);
  if (rows.length === 0) {
    console.error('No citation metadata table found.');
    process.exit(1);
  }

  const parsedRows = rows.map(splitRow);
  const errors = validateRows(parsedRows);
  const warnings = [];
  let checkedUrls = 0;

  if (checkLinks) {
    const linkResults = await validateUrlHealth(parsedRows);
    errors.push(...linkResults.errors);
    warnings.push(...linkResults.warnings);
    checkedUrls = linkResults.checkedCount;
  }

  if (warnings.length > 0) {
    console.warn(`Citation URL health warnings (${warnings.length}):`);
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.error(`Citation validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const linkSuffix = checkLinks ? `; URL health checked (${checkedUrls} unique)` : '';
  console.log(`Citation validation passed: ${rows.length} rows, years ${yearMin}-${yearMax}${linkSuffix}.`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
