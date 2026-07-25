// scripts/scaffold-content.mjs
//
// Ingestion helper. Given PubMed IDs and/or the extracted text of a guideline
// PDF, it SCAFFOLDS draft structured entries for human review. It never
// auto-publishes and never invents clinical values: every clinical field is a
// TODO the reviewer must fill, and any text-derived suggestions are clearly
// labelled "unverified — from source text".
//
// Output goes to content/_drafts/ (ignored by the live validators). Promotion
// to a live /content file is a deliberate human step after verification.
//
// Flags:
//   --type guideline|trial|education   what to scaffold (default guideline)
//   --pmids 12345,67890                PMIDs to seed the draft's citation slots
//   --pdf-text path/to/extracted.txt   extracted guideline text to mine for hints
//   --id my-draft-id                   draft id (default: derived/timestamped via --now)
//   --now YYYY-MM-DD                    date stamp for lastReviewed + id (no system clock)
//
// Usage:
//   node scripts/scaffold-content.mjs --type guideline --pmids 41582814 --now 2026-07-11
//   node scripts/scaffold-content.mjs --type trial --pdf-text /tmp/trial.txt --now 2026-07-11

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PMID_PATTERN, COR_VALUES, LOE_VALUES } from '../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const DRAFTS = path.join(REPO, 'content', '_drafts');
const argv = process.argv.slice(2);

function argVal(flag, fallback = null) {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const type = argVal('--type', 'guideline');
const now = argVal('--now');
if (!now || !/^\d{4}-\d{2}-\d{2}$/.test(now)) {
  console.error('scaffold-content: --now YYYY-MM-DD is required (drafts are date-stamped; no system clock is read).');
  process.exit(2);
}
const pmids = (argVal('--pmids', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
for (const p of pmids) {
  if (!PMID_PATTERN.test(p)) { console.error(`scaffold-content: "${p}" is not a valid PMID`); process.exit(2); }
}
const pdfTextPath = argVal('--pdf-text');
let pdfText = '';
if (pdfTextPath) {
  if (!fs.existsSync(pdfTextPath)) { console.error(`scaffold-content: --pdf-text file not found: ${pdfTextPath}`); process.exit(2); }
  pdfText = fs.readFileSync(pdfTextPath, 'utf8');
}
const id = argVal('--id', `draft-${type}-${now}`);

// ── Heuristic hint extraction from guideline text (SUGGESTIONS ONLY) ───────
// These are lexical guesses to speed transcription; the reviewer must confirm
// every one against the source. Never treated as authoritative.
function mineHints(text) {
  if (!text) return { corHits: [], loeHits: [], statementCandidates: [] };
  const corHits = [...new Set((text.match(/\b(Class\s+(I|IIa|IIb|III)|COR\s+(I|IIa|IIb|III))\b/gi) || []))].slice(0, 8);
  const loeHits = [...new Set((text.match(/\b(LOE|Level of Evidence)\s*[:\s]\s*(A|B-?R|B-?NR|C-?LD|C-?EO|B|C)\b/gi) || []))].slice(0, 8);
  const statementCandidates = text.split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 40 && s.length < 320 && /\b(recommend|reasonable|indicated|should|may be|is not|beneficial|harm)\b/i.test(s))
    .slice(0, 6);
  return { corHits, loeHits, statementCandidates };
}

const hints = mineHints(pdfText);
const suggestionsBlock = pdfText ? {
  _sourceTextSuggestions: {
    note: 'UNVERIFIED lexical hints extracted from --pdf-text. Confirm every value against the source before promoting.',
    corMentions: hints.corHits,
    loeMentions: hints.loeHits,
    statementCandidates: hints.statementCandidates,
  },
} : {};

function guidelineDraft() {
  return {
    _draft: true,
    _reviewRequired: 'Fill every TODO from the primary source. Do NOT promote until validate-content passes and a clinician has verified the clinical content.',
    id: `${id}`,
    guideline: 'TODO: source guideline name + year (e.g. "AHA/ASA 2026 AIS Guideline")',
    year: Number(now.slice(0, 4)),
    section: 'TODO: topic key (kebab, e.g. "ich-bp-management")',
    COR: `TODO: one of ${COR_VALUES.join(' | ')}`,
    LOE: `TODO: one of ${LOE_VALUES.join(' | ')}`,
    statement: 'TODO: the recommendation statement, verbatim intent from source',
    PMIDs: pmids,
    DOIs: [],
    citationIds: [],
    caveats: [],
    setting: 'TODO: inpatient | outpatient | pre-facility | all',
    lastReviewed: now,
    sourceUrl: 'TODO: canonical guideline URL',
    provenance: `scaffold-content ${now}${pdfTextPath ? ` from ${path.basename(pdfTextPath)}` : ''}`,
    ...suggestionsBlock,
  };
}

function trialDraft() {
  return {
    _draft: true,
    _reviewRequired: 'Fill every TODO from the primary publication. Do NOT promote until validate-content passes and a clinician has verified the clinical content.',
    id: `${id}`,
    name: 'TODO: trial short name (e.g. "DAWN")',
    fullName: 'TODO: full trial title',
    category: 'TODO: topic key',
    population: 'TODO: n, age, key inclusion/window',
    finding: 'TODO: primary endpoint result',
    teachingPoint: 'TODO: one-line practice implication',
    PMID: pmids[0] || 'TODO: primary publication PMID',
    year: Number(now.slice(0, 4)),
    citationIds: [],
    lastReviewed: now,
    provenance: `scaffold-content ${now}${pdfTextPath ? ` from ${path.basename(pdfTextPath)}` : ''}`,
    ...suggestionsBlock,
  };
}

function educationDraft() {
  const refs = pmids.map((p) => ({ label: 'TODO: label', citation: 'TODO: full citation', pmid: p }));
  const front = [
    '---',
    `id: ${id}`,
    'title: "TODO: module title"',
    'summary: "TODO: one-sentence summary"',
    'tags: []',
    'contexts: [telestroke, inpatient, clinic]',
    'calculators: []',
    `references: ${JSON.stringify(refs)}`,
    `lastReviewed: ${now}`,
    `provenance: scaffold-content ${now}`,
    '_draft: true',
    '---',
    '',
    'TODO: module body. Do NOT promote until validate-content passes and the content is verified.',
    '',
    pdfText ? `<!-- Source-text statement candidates (UNVERIFIED):\n${hints.statementCandidates.map((s) => `- ${s}`).join('\n')}\n-->` : '',
    '',
  ].join('\n');
  return front;
}

fs.mkdirSync(DRAFTS, { recursive: true });
let outPath;
if (type === 'education') {
  outPath = path.join(DRAFTS, `${id}.draft.md`);
  fs.writeFileSync(outPath, educationDraft(), 'utf8');
} else {
  const draft = type === 'trial' ? trialDraft() : guidelineDraft();
  outPath = path.join(DRAFTS, `${id}.draft.json`);
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2) + '\n', 'utf8');
}

console.log(`Scaffolded ${type} draft → ${path.relative(REPO, outPath)}`);
console.log('This is a DRAFT for human review. It is NOT validated or published.');
console.log(`Next: fill the TODOs, move it into content/${type === 'education' ? 'education' : type + 's'}/, then run \`npm run content:validate\`.`);
if (pdfText) console.log(`(${hints.statementCandidates.length} statement candidates + ${hints.corHits.length} COR / ${hints.loeHits.length} LOE mentions mined from source text as unverified hints.)`);
