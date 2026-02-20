import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const filePath = path.join(process.cwd(), 'docs', 'evidence-review-2021-2026.md');
const yearMin = 2021;
const yearMax = 2026;

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

function validateRows(rows) {
  const errors = [];
  const seenTitles = new Set();

  rows.forEach((row, index) => {
    const item = splitRow(row);
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

    const dedupeKey = `${item.title.toLowerCase()}::${item.year}`;
    if (seenTitles.has(dedupeKey)) {
      errors.push(`row ${rowNum}: duplicate title/year '${item.title}' (${item.year})`);
    }
    seenTitles.add(dedupeKey);
  });

  return errors;
}

async function main() {
  const markdown = await fs.readFile(filePath, 'utf8');
  const rows = parseTableRows(markdown);
  if (rows.length === 0) {
    console.error('No citation metadata table found.');
    process.exit(1);
  }

  const errors = validateRows(rows);
  if (errors.length > 0) {
    console.error(`Citation validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Citation validation passed: ${rows.length} rows, years ${yearMin}-${yearMax}.`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
