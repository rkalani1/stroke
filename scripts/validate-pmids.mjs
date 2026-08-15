// scripts/validate-pmids.mjs
//
// Citation-metadata guard for the education layer.
//
// WHY THIS EXISTS
// An external evidence audit found eleven PMIDs across the audited card subset
// that resolved to entirely unrelated papers — a nutrition review, a
// condensed-matter physics article, a cystic fibrosis drug-interaction study, a
// food-chemistry paper on selenium in boiled vegetables. That is not a
// transcription pattern. It is what unchecked generated citations look like, and
// every one of them rendered as a live, clickable PubMed link on a
// clinical-facing site.
//
// The existing validators cannot catch this class: validate-citations checks
// PMID *format* and pmid/url consistency, never that the number resolves to the
// intended paper. This script closes that gap by fetching each PMID's real
// metadata and comparing it against the citation string the card prints.
//
// WHAT IT CHECKS
//   Sources swept:
//     • references[] entries in content/education/*.md frontmatter
//     • `pmid: '...'` literals in src/education.jsx and src/simulators/*.jsx
//   For each PMID, from NCBI E-utilities esummary:
//     • first-author surname must appear in the citation string  → ERROR
//     • title similarity must clear the threshold                → ERROR
//     • volume / pages disagreement                              → WARNING
//
// A first-author or title mismatch fails the build. Bibliographic drift only
// warns, because PubMed's own volume/page fields are inconsistent (elided page
// ranges, "discussion" suffixes, truncated NEJM page fields) and because the
// repo deliberately prints print-volume years where PubMed carries the e-pub
// stamp.
//
// NETWORK
// Responses are cached to a gitignored file so CI is not rate-limited and reruns
// are offline. When the cache misses AND the network is unreachable, the script
// reports the gap and exits 0 — an unreachable endpoint is an environment
// problem, not a citation defect. A cached-or-fetched MISMATCH always fails.
//
// Usage:
//   node ./scripts/validate-pmids.mjs            # cached + fetch on miss
//   node ./scripts/validate-pmids.mjs --refresh  # ignore cache, refetch all
//   node ./scripts/validate-pmids.mjs --quiet

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const CACHE = path.join(repoRoot, '.pmid-cache.json');
const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const BATCH = 150;
const RATE_MS = 400; // NCBI allows 3 req/s unauthenticated; stay under it.
const TITLE_THRESHOLD = 0.34;

const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet');
const refresh = args.has('--refresh');
const log = (l) => { if (!quiet) console.log(l); };

// ── source sweep ───────────────────────────────────────────────────────────

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(
  'a an the of for in on with and or to vs versus after before study trial randomized randomised controlled clinical phase multicentre multicenter open label double blind placebo patients'.split(' ')
);
const tokens = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3 && !STOP.has(w)));

function similarity(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size) return 1;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit += 1;
  return hit / A.size;
}

async function collectOccurrences() {
  const out = new Map(); // pmid -> [{file, citation}]
  const add = (pmid, file, citation) => {
    if (!/^\d{6,9}$/.test(pmid)) return;
    if (!out.has(pmid)) out.set(pmid, []);
    out.get(pmid).push({ file, citation: citation || '' });
  };

  // content/education/*.md — references: [ {..., "pmid":"..."} ] in frontmatter
  const eduDir = path.join(repoRoot, 'content/education');
  for (const f of (await fs.readdir(eduDir)).filter((x) => x.endsWith('.md'))) {
    const text = await fs.readFile(path.join(eduDir, f), 'utf8');
    const line = /^references:\s*(\[.*\])\s*$/m.exec(text);
    if (!line) continue;
    let refs;
    try { refs = JSON.parse(line[1]); } catch { continue; }
    for (const r of refs) if (r && r.pmid) add(String(r.pmid), `content/education/${f}`, `${r.label || ''} ${r.citation || ''}`);
  }

  // src/education.jsx + src/simulators/*.jsx — pmid: '...' literals, paired with
  // the nearest citation/cite string on the same object.
  const jsxFiles = [path.join(repoRoot, 'src/education.jsx')];
  const simDir = path.join(repoRoot, 'src/simulators');
  if (fsSync.existsSync(simDir)) {
    for (const f of (await fs.readdir(simDir)).filter((x) => x.endsWith('.jsx'))) jsxFiles.push(path.join(simDir, f));
  }
  for (const abs of jsxFiles) {
    const text = await fs.readFile(abs, 'utf8');
    const rel = path.relative(repoRoot, abs);
    const rx = /pmid:\s*'(\d{6,9})'/g;
    let m;
    while ((m = rx.exec(text)) !== null) {
      // The citation for this pmid is the cite/citation on the same literal.
      const from = Math.max(0, m.index - 700);
      const around = text.slice(from, m.index);
      // Citation strings legitimately contain escaped single quotes, e.g.
      // 'Cerebrovascular \\'moyamoya\\' disease'. A naive [^']* stops at the first
      // escape and truncates the citation, which then fails every identity check
      // — a false positive manufactured by the validator itself.
      const STR = "(?:citation|cite):\\s*'((?:[^'\\\\]|\\\\.)*)'";
      const unesc = (v) => String(v || '').replace(/\\(['"\\\\])/g, '$1');
      const tail = around.split('{').pop() || '';
      const cite = new RegExp(STR + "\\s*,?\\s*$").exec(around) || new RegExp(STR).exec(tail);
      const label = /label:\s*'((?:[^'\\]|\\.)*)'/.exec(tail);
      add(m[1], rel, `${label ? unesc(label[1]) : ''} ${cite ? unesc(cite[1]) : ''}`);
    }
  }
  return out;
}

// ── metadata ───────────────────────────────────────────────────────────────

async function readCache() {
  if (refresh) return {};
  try { return JSON.parse(await fs.readFile(CACHE, 'utf8')); } catch { return {}; }
}

async function fetchSummaries(pmids) {
  const records = {};
  let networkError = null;
  for (let i = 0; i < pmids.length; i += BATCH) {
    const slice = pmids.slice(i, i + BATCH);
    const url = `${EUTILS}?db=pubmed&retmode=json&id=${slice.join(',')}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'stroke-cds-citation-validator' } });
      if (!res.ok) { networkError = `HTTP ${res.status}`; break; }
      const json = await res.json();
      const result = json && json.result;
      if (!result) { networkError = 'malformed esummary payload'; break; }
      for (const id of result.uids || []) {
        const r = result[id];
        if (!r) continue;
        records[id] = {
          title: r.title || '',
          firstAuthor: (r.authors && r.authors[0] && r.authors[0].name) || '',
          journal: r.source || '',
          year: (r.pubdate || '').slice(0, 4),
          volume: r.volume || '',
          pages: r.pages || '',
        };
      }
    } catch (err) {
      networkError = err && err.message ? err.message : String(err);
      break;
    }
    if (i + BATCH < pmids.length) await new Promise((r) => setTimeout(r, RATE_MS));
  }
  return { records, networkError };
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const occurrences = await collectOccurrences();
  const pmids = [...occurrences.keys()].sort();
  if (!pmids.length) { log('validate-pmids: no PMIDs found — nothing to check.'); process.exit(0); }

  const cache = await readCache();
  const missing = pmids.filter((p) => !cache[p]);
  let networkError = null;
  if (missing.length) {
    log(`validate-pmids: ${pmids.length} PMIDs (${missing.length} uncached) — querying NCBI…`);
    const r = await fetchSummaries(missing);
    Object.assign(cache, r.records);
    networkError = r.networkError;
    if (Object.keys(r.records).length) {
      await fs.writeFile(CACHE, JSON.stringify(cache, null, 1));
    }
  }

  const errors = [];
  const warnings = [];
  let checked = 0;
  const unresolved = [];

  for (const pmid of pmids) {
    const rec = cache[pmid];
    if (!rec) { unresolved.push(pmid); continue; }
    for (const occ of occurrences.get(pmid)) {
      checked += 1;
      const cite = occ.citation || '';
      // PubMed returns a PERSONAL name as "Surname AB", but for consortium
      // authorship it returns the whole organization, e.g. "North American
      // Symptomatic Carotid Endarterectomy Trial Collaborators" or "Research
      // Committee on the Pathology and Treatment of Spontaneous Occlusion of the
      // Circle of Willis". Taking the first token of those yields "North" /
      // "Research", which matches nothing and flags a perfectly correct citation.
      // Landmark trials are disproportionately consortium-authored, so this is
      // exactly where a false positive costs the most trust.
      const rawAuthor = String(rec.firstAuthor || '').trim();
      const isConsortium =
        rawAuthor.split(/\s+/).length > 3 ||
        /\b(collaborat|committee|group|investigat|consortium|network|trialists|society|association|council)/i.test(rawAuthor);
      const surname = isConsortium ? '' : rawAuthor.split(/\s+/)[0];

      // This repo's house citation style is `LABEL Author et al. Journal. Year;Vol:Pages.`
      // — it deliberately does NOT reproduce the paper title. So title similarity
      // alone is the WRONG primary signal here: it flags correct citations whose
      // format simply omits the title. A citation is corroborated when ANY of the
      // independent identity signals agrees, and only fails when they ALL disagree
      // — which is what a transposed PMID actually looks like.
      const authorMatch = !!(surname && norm(cite).includes(norm(surname)));
      const journalMatch = !!(rec.journal && norm(cite).includes(norm(rec.journal).replace(/\.$/, '')));
      const titleMatch = similarity(rec.title, cite) >= TITLE_THRESHOLD;
      // Trial acronym as printed on the card, e.g. "TOAST", "ATLAS", "CHOICE-2".
      const acronyms = (cite.match(/\b[A-Z][A-Z0-9-]{2,}\b/g) || []);
      const acronymMatch = acronyms.some((a) => norm(rec.title).includes(norm(a)));

      if (!authorMatch && !journalMatch && !titleMatch && !acronymMatch) {
        errors.push(
          `${occ.file} — PMID ${pmid}: cited as "${cite.trim().slice(0, 110)}" but PubMed has ` +
          `"${rec.title.slice(0, 90)}" (${rec.firstAuthor || 'no first author'}, ${rec.journal} ${rec.year}). ` +
          `No author, journal, acronym or title overlap — this PMID does not appear to be the cited paper.`
        );
        continue;
      }

      // Author present on BOTH sides but disagreeing is its own strong signal,
      // even when the journal happens to match (transpositions inside a journal).
      const citeHasAnyAuthor = /[A-Z][a-z]{2,}\s+[A-Z]{1,3}\b|et al/.test(cite);
      if (surname && citeHasAnyAuthor && !authorMatch && !journalMatch && !titleMatch && !acronymMatch) {
        errors.push(
          `${occ.file} — PMID ${pmid}: first author '${rec.firstAuthor}' does not appear in ` +
          `"${cite.trim().slice(0, 110)}" (PubMed title: "${rec.title.slice(0, 80)}")`
        );
        continue;
      }

      // Bibliographic drift — warn only. PubMed elides page ranges, appends
      // "discussion", truncates some NEJM page fields, and stamps e-pub years.
      const volInCite = new RegExp(`\\b${rec.volume}\\b`).test(cite);
      if (rec.volume && !volInCite && /\d{2,4}\s*[;(]/.test(cite)) {
        warnings.push(`${occ.file} — PMID ${pmid}: volume ${rec.volume} not found in "${cite.trim().slice(0, 90)}"`);
      }
    }
  }

  if (unresolved.length) {
    const reason = networkError ? `network unreachable (${networkError})` : 'no esummary record';
    log(`validate-pmids: ${unresolved.length} PMID(s) unresolved — ${reason}.`);
    if (!networkError) {
      // Reachable network but PubMed returned nothing: the PMID does not exist.
      for (const p of unresolved) {
        for (const occ of occurrences.get(p)) errors.push(`${occ.file} — PMID ${p}: no PubMed record (PMID does not resolve)`);
      }
    } else {
      log('validate-pmids: treating as an environment gap, not a citation defect. Run with network access, or commit .pmid-cache.json warmed by a run that had it.');
    }
  }

  if (warnings.length && !quiet) {
    console.log(`\nBibliographic drift warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  • ${w}`));
  }

  if (errors.length) {
    console.error(`\nvalidate-pmids FAILED with ${errors.length} citation-metadata mismatch(es):`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    console.error('\nA PMID that resolves to a different paper renders as a live, clickable link to the wrong study.');
    console.error('Fix the PMID or delete the claim — do not substitute a citation you have not verified.');
    process.exit(1);
  }

  log(`✓ validate:pmids — ${checked} citation occurrence(s) across ${pmids.length - unresolved.length} resolved PMID(s); 0 mismatches${warnings.length ? `, ${warnings.length} drift warning(s)` : ''}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`validate-pmids: unexpected failure: ${err?.stack || err}`);
  process.exit(1);
});
