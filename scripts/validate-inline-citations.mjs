// scripts/validate-inline-citations.mjs
//
// Sweeps source / docs files for inline `PMID NNNNN` references and flags:
//   1) Malformed PMIDs (not 6-9 digits) — ERROR.
//   2) The same PMID paired with disjoint, citation-target-like trial acronyms
//      in TIGHT binding (within ~30 chars before the PMID, same clause). This
//      caught H1 in the 2026-05-09 audit (TRACE-III + MOST sharing 38884324,
//      TESLA + ARCADIA sharing 38319331). Reported as WARNING — guideline PMIDs
//      legitimately appear in multiple discussion contexts, so the operator
//      reviews flags rather than fail-closing CI.
//   3) [opt-in: --check-identifiers] CONTENT cross-check: fetch each inline PMID's
//      title from PubMed eSummary and warn when the footnote's stored trial
//      label/acronym has no reasonable overlap with the real article title. This
//      is the inline-prose analogue of validate-citations.mjs --check-identifiers
//      (which guards citations.js). It catches a wrong-number transposition where
//      a footnote points "AcT" at an unrelated liver-failure paper, etc. — the
//      Cycle-3 inline-footnote defect class. WARNING only (never fail-closes the
//      offline path); escalate with --strict if desired.
//
// Use sibling `validate-citations.mjs` for the markdown-table source-of-truth check
// (formal PMID/DOI/NCT format + duplicate detection across rows). This script is the
// inline-prose / source-code complement.
//
// Output:
//   - Hard errors (malformed PMIDs) → exit 1.
//   - Warnings (suspected duplicates, --check-identifiers title mismatches) →
//     printed; exit 0. The DEFAULT (no-flag) invocation stays OFFLINE.
// CI can run with `--strict` to escalate warnings to errors after triage.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const checkIdentifiers = args.has('--check-identifiers');

const FILE_PATTERNS = ['src', 'scripts', 'docs', 'tests'];
const FILE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.md']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'output', 'android', 'ios']);

const PMID_REGEX = /PMID\s*[:.]?\s*(\d{4,12})/gi;
// Citation-target acronyms: ALL-CAPS-with-optional-hyphens, ≥2 chars, distinctive.
// We deliberately reject common boilerplate and unit/variable tokens.
const ACRONYM_REGEX = /\b([A-Z][A-Z0-9]{1,}(?:-[A-Z0-9]+)*)\b/g;

const REJECT_TOKENS = new Set([
  'PMID', 'DOI', 'NCT', 'NEJM', 'JAMA', 'AHA', 'ASA', 'ESO', 'ESC', 'SVIN', 'WSO',
  'IV', 'IVT', 'EVT', 'CT', 'CTA', 'CTP', 'MRI', 'DWI', 'FLAIR', 'NIHSS', 'ASPECTS',
  'LVO', 'LKW', 'BP', 'SBP', 'DBP', 'HR', 'AF', 'TIA', 'AIS', 'ICH', 'SAH', 'CAA',
  'DOAC', 'TNK', 'TPA', 'AC', 'OAC', 'OR', 'RR', 'CI', 'PE', 'GCS', 'WFNS', 'IPC',
  'ICA', 'MCA', 'PCA', 'M1', 'M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'P1', 'P2', 'P3',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'A', 'B', 'C', 'D', 'COR', 'LOE', 'NNT', 'NS',
  'B-R', 'B-NR', 'C-LD', 'C-EO', 'NIH', 'LDL', 'HDL', 'CV', 'CVD', 'MI', 'PAD',
  'PCC', '4F-PCC', 'STR', 'STROKE', 'TRIAL', 'STUDY', 'GUIDELINE', 'STATEMENT',
  'TIMING', 'EARLY', 'LATER', 'AND', 'FOR', 'THE', 'WITH', 'WITHOUT', 'OF',
  'DIAGNOSIS', 'MANAGEMENT', 'SCIENTIFIC', 'CARE', 'POSTPARTUM', 'INPATIENT',
  'INTRAVENOUS', 'TENECTEPLASE', 'COMPARED', 'OUTCOMES', 'RANDOMIZED',
  'INTERIM', 'EARLIER', 'LATER',
  'BID', 'TID', 'QID', 'DAILY', 'MG', 'KG', 'ML', 'MIN', 'IU', 'PCC',
  'FDA', 'NPO', 'STAT', 'SLP', 'PCSK9I',
  'COR', 'LOE', 'CKD', 'CC', 'GI', 'GU', 'PFO', 'CSO-PVS', 'EUS',
  'JACC', 'NEJM', 'BMJ', 'NEUROLOGY', 'STROKEAHA', 'JAMA', 'CIRCULATION',
  'IPD', 'CFR', 'BR', 'ACTION-CVT', 'CVT', 'AHA-ASA',
  'PMID-VERIFIED', 'BCD-PFO', 'PRES', 'BBHC', 'NEJMOA', 'STROKEAHA',
  'URL', 'SHA', 'PCSK9', 'ECG', 'ECASS', 'NIHSS', 'ICAS-DAPT-EXT', 'ICAS-LDL-LT55',
  'EOS', 'AED', 'PCC', 'BR-NR', 'CRAO', 'CGA', 'PWI', 'NCCT', 'AED', 'STAT'
]);

function isCitationTargetAcronym(tok) {
  if (REJECT_TOKENS.has(tok)) return false;
  // Must contain at least one digit OR a hyphen, OR be ≥4 letters.
  // Trial acronyms typically: SELECT-2, ANGEL-ASPECT, ELAN, ENRICH, INTERACT3.
  if (tok.length < 4 && !/[0-9-]/.test(tok)) return false;
  return true;
}

async function* walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (FILE_EXTENSIONS.has(path.extname(entry.name))) yield full;
  }
}

// Tight-binding extractor. Looks at ~30 chars BEFORE the PMID, capped at the
// last clause boundary (period+space+capital, double newline, pipe, or another
// PMID). Returns acronyms appearing in that window only.
function extractBoundAcronyms(text, pmidIdx) {
  const span = 50;
  const before = text.slice(Math.max(0, pmidIdx - span), pmidIdx);
  const trimmed = before
    .split(/\s+PMID\s*[:.]?\s*\d/i).pop()
    .split(/\.\s+(?=[A-Z])/).pop()
    .split(/\n\n/).pop()
    .split(/\|/).pop()
    .split(/—/).pop();
  const acronyms = new Set();
  let m;
  const re = new RegExp(ACRONYM_REGEX.source, 'g');
  while ((m = re.exec(trimmed)) !== null) {
    if (isCitationTargetAcronym(m[1])) acronyms.add(m[1]);
  }
  return [...acronyms];
}

// ── content cross-check (opt-in, --check-identifiers) ───────────────────────
//
// SCOPE: src/app.jsx only — the rendered cockpit evidence store, where footnotes
// follow a consistent `ACRONYM (Journal Year, PMID: N)` / `Trial: Author et al.
// Journal Year. PMID: N` shape. Other swept files (calculators*.js, docs/*.md)
// use looser, multi-trial-per-clause prose that this lightweight extractor can't
// disambiguate without false positives; they remain covered by the offline
// malformed-PMID + duplicate-acronym checks, and the docs evidence table has its
// own network guard in validate-citations.mjs --check-identifiers.
//
// Inline footnotes do NOT store the full article title; they store an
// identifying TRIAL LABEL — a trial acronym (AcT, TRACE-2, ACTION-CVT) and/or an
// author surname (Yaghi, Mas, Søndergaard). We cross-check each footnote PMID by
// fetching the real PubMed title AND author list and warning when NONE of the
// stored label tokens appears in either. A transposed PMID points at an unrelated
// article whose title+authors share neither the trial acronym nor its authors —
// exactly the Cycle-3 defect (AcT→liver-failure, ACTION-CVT→physics, etc.).
// Legitimate trials whose acronym is absent from the title (e.g. SPARCL) still
// match on the author surname, so this stays low-noise.

const INLINE_ID_CHECK_FILE = `src${path.sep}app.jsx`;
const NETWORK_TIMEOUT_MS = 15000;
const NETWORK_RETRIES = 2;

// Tokens that look like trial acronyms / author surnames but are journal or
// boilerplate noise we must NOT treat as identifying content.
const LABEL_STOPWORDS = new Set([
  'NEJM', 'JAMA', 'LANCET', 'JACC', 'BMJ', 'STROKE', 'NEUROLOGY', 'CIRCULATION',
  'AHA', 'ASA', 'ESO', 'ESC', 'AHA/ASA', 'PMID', 'DOI', 'NCT', 'LOE', 'COR',
  'CLASS', 'ET', 'AL', 'VS', 'SCIENTIFIC', 'STATEMENT', 'GUIDELINE', 'SECONDARY',
  'PREVENTION', 'RECOMMENDATION', 'STUDY', 'TRIAL', 'NEUROL'
]);

// Isolate the clause that OWNS a PMID, so we read this footnote's own trial
// label without borrowing a neighbour's. Citations end at ")." or at the trial
// separator ". " — but a bare "Vol;pp. PMID" tail must NOT be treated as a clause
// boundary (that would strip the label), so we only cut on ". " when the text
// after it is NOT just the "PMID" tail and the char before "." is not a digit
// (i.e. not a volume/page/year boundary inside the same citation).
function inlineFootnoteClause(text, pmidIdx, span = 180) {
  let before = text.slice(Math.max(0, pmidIdx - span), pmidIdx);
  // Drop any preceding "PMID: NNNN" belonging to an EARLIER citation in the same <p>.
  before = before.split(/\s+PMID\s*[:.]?\s*\d{4,}/i).pop();
  // Drop everything up to the JSX tag open (start of this <p>) if present.
  const tagIdx = before.lastIndexOf('">');
  if (tagIdx !== -1) before = before.slice(tagIdx + 2);
  // Cut at the last trial-separating sentence boundary: a period preceded by a
  // lowercase letter or ")" and followed by " " + capital. We must NOT split on
  // citation-internal abbreviations — "et al." (author byline) and "vs." — which
  // sit mid-citation between the trial label and its PMID, so exclude them via a
  // negative lookbehind. "Vol;pp. PMID" is excluded because the char before "." is
  // a digit (the lookbehind requires [a-z)]). This keeps the trial acronym/author
  // attached while still cutting "...Scientific Statement. ACTION-CVT:".
  const parts = before.split(/(?<![ .]al|[ .]vs)(?<=[a-z)])\.\s+(?=[A-Z])/);
  before = parts.pop();
  before = before.split(/\n\n/).pop().split(/\|/).pop();
  return before;
}

function extractTrialLabelTokens(text, pmidIdx) {
  const before = inlineFootnoteClause(text, pmidIdx);
  const tokens = new Set();
  // 1) Trial acronyms (ALL-CAPS, hyphen/digit-tolerant) reusing the shared filter.
  let m;
  const reAcr = new RegExp(ACRONYM_REGEX.source, 'g');
  while ((m = reAcr.exec(before)) !== null) {
    const tok = m[1];
    if (LABEL_STOPWORDS.has(tok)) continue;
    if (isCitationTargetAcronym(tok)) tokens.add(tok.toLowerCase());
  }
  // 2) Mixed-case trial acronyms like "AcT" that the all-caps regex misses, when
  //    they immediately precede a parenthesised journal/year or a "(... PMID".
  const reMixed = /\b([A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*)\s*\(/g;
  while ((m = reMixed.exec(before)) !== null) {
    const tok = m[1];
    if (LABEL_STOPWORDS.has(tok.toUpperCase())) continue;
    if (tok.length >= 3 && /[A-Z]/.test(tok)) tokens.add(tok.toLowerCase());
  }
  // 3) Author surnames in "Surname X et al." / "Surname X." byline form.
  const reAuthor = /\b([A-Z][a-zØøÅåÄäÖö'’-]{3,})\s+[A-Z](?:[A-Z]?)?\s+et\s+al\.?/g;
  while ((m = reAuthor.exec(before)) !== null) {
    if (!LABEL_STOPWORDS.has(m[1].toUpperCase())) tokens.add(m[1].toLowerCase());
  }
  return [...tokens];
}

// Map a footnote journal shorthand → canonical key so "NEJM" matches the
// eSummary `source` "N Engl J Med", "JAMA Neurol" matches "JAMA Neurol", etc.
// Returns null when no journal hint is present in the window.
const JOURNAL_ALIASES = [
  { key: 'nejm', re: /\bnejm\b|new england journal/ , src: /n engl j med|new england journal/ },
  { key: 'lancet neurol', re: /\blancet neurol/, src: /lancet neurol/ },
  { key: 'lancet', re: /\blancet\b/, src: /^lancet| lancet/ },
  { key: 'jama neurol', re: /\bjama neurol/, src: /jama neurol/ },
  { key: 'jama', re: /\bjama\b/, src: /^jama$|^jama / },
  { key: 'jacc', re: /\bjacc\b/, src: /j am coll cardiol|jacc/ },
  { key: 'stroke', re: /\bstroke\b/, src: /^stroke$/ },
  { key: 'circulation', re: /\bcirculation\b/, src: /circulation/ },
  { key: 'neurology', re: /\bneurology\b/, src: /^neurology$/ },
  { key: 'bmj', re: /\bbmj\b/, src: /bmj|br med j/ }
];

function extractFootnoteJournal(text, pmidIdx) {
  const clause = inlineFootnoteClause(text, pmidIdx).toLowerCase();
  for (const j of JOURNAL_ALIASES) {
    if (j.re.test(clause)) return j;
  }
  return null;
}

function journalMatches(journalHint, recordSource) {
  if (!journalHint || !recordSource) return false;
  return journalHint.src.test(recordSource);
}

// Normalize a PubMed title to a searchable lowercased string (keep hyphens so
// "ACTION-CVT" survives; collapse the rest of the punctuation to spaces).
function normalizeTitleForMatch(title) {
  return ` ${String(title || '').toLowerCase().replace(/[^a-z0-9-]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

function labelTokenInTitle(token, normalizedTitle) {
  // Exact word match, or hyphen-insensitive (ACTION-CVT vs "action cvt").
  if (normalizedTitle.includes(` ${token} `)) return true;
  const collapsed = token.replace(/-/g, ' ');
  if (collapsed !== token && normalizedTitle.includes(` ${collapsed} `)) return true;
  const joined = token.replace(/-/g, '');
  if (joined !== token && normalizedTitle.replace(/-/g, '').includes(joined)) return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHealthyStatus(status) {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

// Batch-fetch PubMed eSummary records (title + author surnames) for a set of
// PMIDs (NCBI allows comma-joined ids). Returns a Map pmid -> { title, authors }.
async function fetchPubmedRecords(pmids) {
  if (pmids.length === 0) return { records: new Map(), error: null };
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
  let payload = null;
  let lastFailure = null;
  for (let attempt = 0; attempt <= NETWORK_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'user-agent': 'stroke-inline-citation-validator/1.0' },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (response.status === 429) {
        lastFailure = `HTTP 429`;
        await sleep(600 * (attempt + 1));
        continue;
      }
      if (!isHealthyStatus(response.status)) {
        lastFailure = `HTTP ${response.status}`;
        break;
      }
      payload = await response.json();
      break;
    } catch (error) {
      lastFailure = error?.message || String(error);
      if (attempt < NETWORK_RETRIES) {
        await sleep(600 * (attempt + 1));
        continue;
      }
    }
  }
  if (!payload) return { records: new Map(), error: lastFailure || 'unknown error' };
  const records = new Map();
  for (const pmid of pmids) {
    const item = payload?.result?.[pmid];
    if (item && item.title) {
      const authors = Array.isArray(item.authors)
        ? item.authors.map((a) => String(a?.name || '').toLowerCase())
        : [];
      records.set(pmid, {
        title: item.title,
        authors,
        source: String(item.source || item.fulljournalname || '').toLowerCase(),
        year: String(item.pubdate || '').match(/\d{4}/)?.[0] || ''
      });
    }
  }
  return { records, error: null };
}

function truncate(text, max = 90) {
  const value = String(text || '').trim();
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function labelTokenInAuthors(token, authors) {
  // Author surname match (token is lowercased). Authors come as "Surname IN".
  return authors.some((a) => {
    const surname = a.split(/\s+/)[0] || '';
    return surname === token || surname.replace(/[^a-zø-ÿ]/g, '') === token;
  });
}

// Content cross-check of the in-scope inline-PMID occurrences (src/app.jsx).
// For each labelled occurrence, warn when NONE of the footnote's trial-label
// tokens (acronym + author surname) appears in the PubMed title OR author list.
// WARNING-only for mismatches; an unreachable endpoint or an unresolvable PMID is
// an ERROR (a swept evidence PMID that PubMed cannot confirm is itself a defect).
async function checkInlineIdentifiers(occurrences) {
  const errors = [];
  const warnings = [];
  // Restrict to the rendered cockpit evidence store; only fetch those PMIDs.
  const scoped = new Map();
  for (const [pmid, occs] of occurrences) {
    const inScope = occs.filter((o) => o.file === INLINE_ID_CHECK_FILE && (o.labels || []).length > 0);
    if (inScope.length > 0) scoped.set(pmid, inScope);
  }
  const pmids = [...scoped.keys()];
  if (pmids.length === 0) return { errors, warnings, checkedCount: 0 };

  const { records, error } = await fetchPubmedRecords(pmids);
  if (error) {
    errors.push(`inline PMID eSummary batch fetch failed (${error})`);
    return { errors, warnings, checkedCount: 0 };
  }
  let checkedCount = 0;
  for (const pmid of pmids) {
    const rec = records.get(pmid);
    if (!rec) {
      errors.push(`inline PMID ${pmid}: missing eSummary record (cannot verify)`);
      continue;
    }
    const normTitle = normalizeTitleForMatch(rec.title);
    for (const occ of scoped.get(pmid)) {
      const labels = occ.labels;
      checkedCount += 1;
      // A footnote is corroborated if its trial acronym / author surname appears
      // in the article's title or author list, OR the footnote's stated journal
      // matches the article's journal. Trials whose acronym is absent from the
      // title (e.g. REDUCE → "Patent Foramen Ovale Closure...") still pass via the
      // journal cross-check; a transposed PMID matches on NONE of these.
      const labelMatched = labels.some(
        (t) => labelTokenInTitle(t, normTitle) || labelTokenInAuthors(t, rec.authors)
      );
      const journalMatched = journalMatches(occ.journalHint, rec.source);
      if (!labelMatched && !journalMatched) {
        warnings.push(
          `inline PMID ${pmid} (${occ.file}:${occ.line}) content mismatch: ` +
          `footnote label [${labels.join(', ')}]` +
          `${occ.journalHint ? ` / journal '${occ.journalHint.key}'` : ''} matches neither ` +
          `the PubMed title '${truncate(rec.title)}', its authors ` +
          `[${rec.authors.slice(0, 3).join(', ')}], nor its journal '${rec.source}'`
        );
      }
    }
  }
  return { errors, warnings, checkedCount };
}

async function main() {
  const errors = [];
  const warnings = [];
  const occurrences = new Map();

  for (const dir of FILE_PATTERNS) {
    const abs = path.join(repoRoot, dir);
    try { await fs.access(abs); } catch { continue; }
    for await (const file of walk(abs)) {
      if (file.endsWith('src/evidence/citations.js')) continue;
      if (file.endsWith('package-lock.json')) continue;
      if (file.includes(`docs${path.sep}qa-comprehensive-`)) continue;
      if (file.includes(`docs${path.sep}evidence-promotion-template`)) continue;
      if (file.includes(`docs${path.sep}iteration-log.md`)) continue;

      const text = await fs.readFile(file, 'utf8');
      let m;
      const re = new RegExp(PMID_REGEX.source, 'gi');
      while ((m = re.exec(text)) !== null) {
        const pmid = m[1];
        if (!/^\d{6,9}$/.test(pmid)) {
          errors.push(`${path.relative(repoRoot, file)}: malformed PMID '${pmid}' at offset ${m.index}`);
          continue;
        }
        const before = text.slice(0, m.index);
        const line = before.split('\n').length;
        const acronyms = extractBoundAcronyms(text, m.index);
        const labels = checkIdentifiers ? extractTrialLabelTokens(text, m.index) : [];
        const journalHint = checkIdentifiers ? extractFootnoteJournal(text, m.index) : null;
        if (!occurrences.has(pmid)) occurrences.set(pmid, []);
        occurrences.get(pmid).push({
          file: path.relative(repoRoot, file),
          line,
          acronyms,
          labels,
          journalHint
        });
      }
    }
  }

  // Detect duplicates with conflicting trial-target acronym sets.
  // Only flag when BOTH occurrences have ≥1 acronym and the sets are disjoint.
  for (const [pmid, occs] of occurrences) {
    if (occs.length < 2) continue;
    for (let i = 0; i < occs.length; i++) {
      for (let j = i + 1; j < occs.length; j++) {
        const a = new Set(occs[i].acronyms);
        const b = new Set(occs[j].acronyms);
        if (a.size === 0 || b.size === 0) continue;
        const intersection = [...a].filter((x) => b.has(x));
        if (intersection.length > 0) continue;
        warnings.push(
          `PMID ${pmid} appears with disjoint trial acronyms — possible duplicate-citation bug:\n` +
          `  • ${occs[i].file}:${occs[i].line}  [${[...a].slice(0, 3).join(', ')}]\n` +
          `  • ${occs[j].file}:${occs[j].line}  [${[...b].slice(0, 3).join(', ')}]`
        );
      }
    }
  }

  // Opt-in network content cross-check (mirrors validate-citations.mjs
  // --check-identifiers). Title mismatches are WARNINGS; an unreachable endpoint
  // or a PMID PubMed cannot resolve is an ERROR (the swept PMID is unverifiable).
  let inlineChecked = 0;
  if (checkIdentifiers) {
    const idResults = await checkInlineIdentifiers(occurrences);
    errors.push(...idResults.errors);
    warnings.push(...idResults.warnings);
    inlineChecked = idResults.checkedCount;
  }

  if (warnings.length > 0) {
    console.warn(`Inline citation drift warnings (${warnings.length}):`);
    warnings.forEach((w) => console.warn(`- ${w}`));
  }

  if (errors.length > 0) {
    console.error(`Inline citation validation failed with ${errors.length} hard issue(s):`);
    errors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  }

  if (strict && warnings.length > 0) {
    console.error(`--strict: escalating ${warnings.length} warnings to errors.`);
    process.exit(1);
  }

  const totalPmids = occurrences.size;
  const totalOccurrences = [...occurrences.values()].reduce((s, v) => s + v.length, 0);
  const idSuffix = checkIdentifiers
    ? ` PubMed title cross-checked ${inlineChecked} labelled occurrence(s);`
    : '';
  console.log(`Inline citation validation passed: ${totalPmids} unique PMIDs across ${totalOccurrences} inline references;${idSuffix} ${warnings.length} review warnings.`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
