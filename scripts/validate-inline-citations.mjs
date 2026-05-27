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
//
// Use sibling `validate-citations.mjs` for the markdown-table source-of-truth check
// (formal PMID/DOI/NCT format + duplicate detection across rows). This script is the
// inline-prose / source-code complement.
//
// Output:
//   - Hard errors (malformed PMIDs) → exit 1.
//   - Warnings (suspected duplicates) → printed; exit 0.
// CI can run with `--strict` to escalate warnings to errors after triage.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');

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
        if (!occurrences.has(pmid)) occurrences.set(pmid, []);
        occurrences.get(pmid).push({
          file: path.relative(repoRoot, file),
          line,
          acronyms
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
  console.log(`Inline citation validation passed: ${totalPmids} unique PMIDs across ${totalOccurrences} inline references; ${warnings.length} review warnings.`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
