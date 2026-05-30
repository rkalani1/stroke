// scripts/generate-whats-new.mjs
//
// Build-time generator for whats-new.json — sourced ENTIRELY from Dr. Kalani's
// committed Clinical Intelligence briefing
// (data/clinical-intelligence/briefing-latest.md), joined against the
// PubMed verification cache (data/clinical-intelligence/verified-pmids.json).
//
// Clinical-safety contract: a study reaches whats-new.json ONLY when the
// verification cache marks it status==='verified' (a real PMID whose title
// matches the briefing study). Quarantined studies are excluded and written to
// whats-new-quarantine.md with reasons. Verification was performed once, with
// live PubMed access, and frozen into the cache so every subsequent build is
// deterministic + offline.
//
// Deterministic: no network, no Date.now(), no new Date() — output depends only
// on the two committed input files.
//
// Usage:
//   node ./scripts/generate-whats-new.mjs
//
// Cache key: each briefing study is identified by a stable `id` (kebab-cased
// from its acronym, or a slug of its title when it has no acronym). The
// briefing URLs almost never contain a DOI, so the cache is keyed by `id` and
// carries the PubMed-resolved DOI/PMID inside each entry.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const briefingFile = path.join(repoRoot, 'data/clinical-intelligence/briefing-latest.md');
const cacheFile = path.join(repoRoot, 'data/clinical-intelligence/verified-pmids.json');
const outFile = path.join(repoRoot, 'whats-new.json');
const quarantineFile = path.join(repoRoot, 'whats-new-quarantine.md');

// ── briefing parser ─────────────────────────────────────────────────────────

// The doc exporter backslash-escapes Markdown/math punctuation inside text and
// URLs (e.g. \( \) \< \> \= \~ \- \. \+). Strip a backslash that precedes any
// non-alphanumeric, non-whitespace character (never touches \n / \t etc.).
function deEscape(s) {
  return s.replace(/\\([^A-Za-z0-9\s])/g, '$1');
}

function parseTitleLine(line) {
  // [ <title> ]( <url> )   — url may itself contain (escaped) parens, so we
  // greedily capture everything between the first ]( and the trailing ).
  const m = line.match(/^\[(.+?)\]\((.+)\)\s*$/);
  if (!m) return null;
  return { rawTitle: m[1], url: m[2] };
}

function splitBlocks(src) {
  const lines = src.split('\n');
  const blocks = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const t = parseTitleLine(lines[i]);
    if (t) {
      // A genuine study title line is followed (within a few lines) by a
      // "Reference:" line. This rejects stray bracketed links in prose.
      let isStudy = false;
      for (let j = i + 1; j <= i + 4 && j < lines.length; j++) {
        if (/^Reference:/.test(lines[j])) { isStudy = true; break; }
      }
      if (isStudy) {
        if (cur) blocks.push(cur);
        cur = { titleLine: lines[i], body: [] };
        continue;
      }
    }
    if (cur) cur.body.push(lines[i]);
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function kebab(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Acronym extraction, in priority order:
//   1. trailing "(ACRONYM)"                e.g. "... (ATLAS)"
//   2. mid-title "(ACRONYM):"              e.g. "... (DISTAL): 12-month outcomes"
//   3. "The ACRONYM Trial/Study/..."       e.g. "... The SISTER Randomized Trial"
//   4. leading hyphenated acronym token    e.g. "ESCAPE-MeVO CTA Collateral Study"
// Returns { acronym|null, title } where title has any trailing "(ACRONYM)"
// stripped for display.
function extractAcronym(rawTitle) {
  const looksAcronym = (s) =>
    /^[A-Z0-9][A-Za-z0-9\-\/.+]*$/.test(s) && s.length <= 20 && /[A-Z]/.test(s);

  // 1. trailing paren group
  const trailing = rawTitle.match(/\(([^()]+)\)\s*$/);
  if (trailing && looksAcronym(trailing[1].trim())) {
    return {
      acronym: trailing[1].trim(),
      title: rawTitle.slice(0, trailing.index).trim().replace(/[:\s]+$/, '').trim()
    };
  }

  // 2. any "(ACRONYM)" group anywhere in the title
  const anyParen = [...rawTitle.matchAll(/\(([^()]+)\)/g)];
  for (const m of anyParen) {
    const inner = m[1].trim();
    if (looksAcronym(inner)) {
      // keep full title (paren may carry context like "(LASTE ASPECTS 0-2 Sub-study)")
      const acro = inner.split(/[\s]/)[0];
      if (looksAcronym(acro)) return { acronym: acro, title: rawTitle.trim() };
    }
  }

  // 3. "The ACRONYM Trial/Study/Randomized/Registry"
  const theTrial = rawTitle.match(
    /\bThe\s+([A-Z][A-Za-z0-9\-]{1,19})\s+(?:Trial|Study|Randomized|Registry|RCT)\b/
  );
  if (theTrial && looksAcronym(theTrial[1])) {
    return { acronym: theTrial[1], title: rawTitle.trim() };
  }

  // 4. leading hyphenated all-caps token (e.g. ESCAPE-MeVO, STEP-Mild)
  const leading = rawTitle.match(/^([A-Z][A-Z0-9]+(?:-[A-Za-z0-9]+)+)\b/);
  if (leading) {
    return { acronym: leading[1], title: rawTitle.trim() };
  }

  return { acronym: null, title: rawTitle.trim() };
}

function extractDoi(url) {
  const clean = deEscape(url);
  const std = clean.match(/10\.\d{4,9}\/[^\s"'<>]+/);
  if (std) return std[0].replace(/[).,;]+$/, '');
  // Lancet PII form: PIIS0140-6736(26)00876-7 → 10.1016/S0140-6736(26)00876-7
  const pii = clean.match(/PII(S\d{4}-\d{3}[\dX]\(\d{2}\)\d{5}-\d)/);
  if (pii) return '10.1016/' + pii[1];
  return null;
}

function grabBlockField(joinedBody, labelRegexSrc) {
  const re = new RegExp(`${labelRegexSrc}:\\s*([\\s\\S]*?)(?=\\n\\n|$)`);
  const m = joinedBody.match(re);
  return m ? deEscape(m[1].replace(/\s+/g, ' ').trim()) : '';
}

function parseBriefing(src) {
  const blocks = splitBlocks(src);
  return blocks.map((b) => {
    const t = parseTitleLine(b.titleLine);
    const { acronym, title } = extractAcronym(t.rawTitle);
    const url = deEscape(t.url);
    const doi = extractDoi(t.url);
    const id = acronym ? kebab(acronym) : kebab(title);

    const refLine = b.body.find((l) => /^Reference:/.test(l)) || '';
    const refM = refLine.match(/^Reference:\s*(.+?)\s*\((.+?)\)\s*\|/);
    let journalRaw = '';
    let dateRaw = '';
    if (refM) {
      journalRaw = refM[1].trim();
      dateRaw = refM[2].trim();
    } else {
      // No parenthesised date (e.g. "ESOC 2026 Late-Breaker")
      const refM2 = refLine.match(/^Reference:\s*(.+?)\s*\|/);
      if (refM2) journalRaw = refM2[1].trim();
    }
    const yearM = (dateRaw || journalRaw).match(/(19|20)\d{2}/);
    const year = yearM ? parseInt(yearM[0], 10) : null;

    const joined = b.body.join('\n');
    return {
      id,
      acronym,
      title,
      url,
      doi,
      journalRaw,
      dateRaw,
      year,
      bottomLine: grabBlockField(joined, 'Clinical Impact & Protocol Integration'),
      picoQuestion: grabBlockField(joined, 'PICO & Cohort \\(External Validity\\)'),
      methodology: grabBlockField(joined, 'Methodology & Trial Quality \\(Internal Validity\\)'),
      results: grabBlockField(joined, 'Primary Results, Statistics & Safety')
    };
  });
}

// ── inference helpers (deterministic, conservative) ─────────────────────────

function inferEvidenceType(study) {
  // The briefing uses generic "randomized trial" boilerplate for many
  // lower-tier studies, so prefer signals from the curated bottom line + title
  // and only fall back to the (boilerplate-prone) methodology block.
  const curated = `${study.title} ${study.bottomLine}`.toLowerCase();
  const full = `${study.title} ${study.bottomLine} ${study.methodology} ${study.picoQuestion}`.toLowerCase();

  if (/individual patient data|ipd meta-analysis|meta-analysis|systematic review|pooled (ipd|analysis)/.test(full)) {
    return 'meta-analysis';
  }
  if (/\bguideline|consensus statement|evidence synthesis|annual (evidence )?(update|synthesis)/.test(curated)) {
    return 'guideline';
  }
  // Observational signals (registry / cohort / prognostic-predictive / drug-interaction /
  // secondary-or-ancillary analysis) override the boilerplate "randomized" wording.
  if (/registry|observational|prospective cohort|retrospective|case-control|cohort study|biobank|\bpredict(s|or|ors|ive)?\b|association of|drug interaction|secondary analysis|ancillary analysis|sub-?study|subgroup analysis|real-world/.test(curated)) {
    return 'observational';
  }
  if (/randomi[sz]ed|double-blind|placebo-controlled|\brct\b|open-label/.test(full)) {
    return 'rct';
  }
  return 'rct';
}

// Best-effort topic family from study content.
function inferTopic(study) {
  const text = `${study.title} ${study.bottomLine} ${study.picoQuestion}`.toLowerCase();
  if (/intracerebral h(a)?emorrhage|\bich\b|hematoma|lobar/.test(text)) return 'ich';
  if (/thrombectomy|endovascular|evt|large-core|medium.?vessel|mevo|reperfusion|recanaliz/.test(text)) return 'evt';
  if (/thrombolysis|tenecteplase|alteplase|tnk|glenzocimab|tirofiban/.test(text)) return 'thrombolysis';
  if (/secondary prevention|antiplatelet|asundexian|anticoagulation|atrial fibrillation|dual antiplatelet|dissection/.test(text)) return 'secondary-prevention';
  if (/rehabilitation|aphasia|recovery|telerehab|neurofeedback/.test(text)) return 'rehabilitation';
  if (/blood pressure|hypertensive|polypill/.test(text)) return 'blood-pressure';
  if (/microplastic|biobank|epidemiolog|risk factor|cohort/.test(text)) return 'epidemiology';
  return 'stroke';
}

const TOPIC_LABELS = {
  ich: 'Intracerebral hemorrhage',
  evt: 'Endovascular therapy',
  thrombolysis: 'Thrombolysis',
  'secondary-prevention': 'Secondary prevention',
  rehabilitation: 'Stroke rehabilitation',
  'blood-pressure': 'Blood pressure management',
  epidemiology: 'Stroke epidemiology',
  stroke: 'Stroke'
};

// One-line key result extracted from the "Primary Results" block.
function extractEffect(study) {
  const results = study.results || '';
  // Prefer the "Statistical models:" sentence (carries the effect size).
  const sm = results.match(/Statistical models:\s*([^]*?)(?:Main outcomes:|Safety signals:|Historical literature fit:|$)/);
  let effect = sm ? sm[1].trim() : results;
  // Trim to the first informative sentence.
  effect = effect.split(/(?<=[.;])\s+/).filter(Boolean)[0] || effect;
  effect = effect.replace(/\s+/g, ' ').trim().replace(/[.;]+$/, '');
  // Repair an unbalanced trailing '(' fragment created by splitting on ';'
  // inside a parenthetical (e.g. "...(6.2% vs 8.4%" → "...(6.2% vs 8.4%)").
  const opens = (effect.match(/\(/g) || []).length;
  const closes = (effect.match(/\)/g) || []).length;
  if (opens > closes) effect = effect + ')'.repeat(opens - closes);
  // Fall back to the bottom line if results are boilerplate/empty.
  if (!effect || /robust statistical modeling/i.test(effect)) {
    const bl = (study.bottomLine || '').replace(/^Bottom line:\s*/i, '');
    effect = bl.split(/(?<=[.;])\s+/).filter(Boolean)[0] || bl;
    effect = effect.replace(/\s+/g, ' ').trim().replace(/[.;]+$/, '');
  }
  return effect;
}

function inferDirection(study) {
  // Decide from the curated bottom line (the non-boilerplate, human-written
  // sentence). Conservative and safety-aware: a "no significant increase in
  // [safety event]" phrase is a reassurance, NOT a no-benefit signal.
  const bl = (study.bottomLine || '').replace(/^Bottom line:\s*/i, '').toLowerCase();

  // Net-harm: an unfavorable primary result that is NOT framed as an acceptable
  // tradeoff. "at the expense of" denotes a tradeoff with net benefit, so it is
  // excluded here.
  if (
    /\bnet harm\b|\bdetrimental\b|\bworse(ned)? (outcome|functional)|increased (90-day |)mortality|excess mortality|caution(s|ed)? against|halted early (for|due to) (harm|safety)|harmed|increased risk of (recurrent |adverse |ischemic |ischaemic )*(ischemic |ischaemic |recurrent |adverse )*(events|stroke|mortality|death|bleeding|h(a)?emorrhage)/.test(bl) &&
    !/at the expense of/.test(bl)
  ) {
    return 'harm';
  }

  // Negative / no-benefit primary result.
  if (
    /\bno (long-term )?(functional )?benefit\b|did not (significantly )?(reduce|improve|differ|lower)|not superior|failed to (meet|reduce|improve)|underpowered|was (functionally )?neutral|not supported|no difference in the primary|did not meet (its )?primary/.test(bl)
  ) {
    return 'no-benefit';
  }

  // Benefit: efficacy improvement / risk reduction / non-inferiority enabling use.
  if (
    /\breduce[ds]?\b|reduction|\blower(ed|s|ing)?\b|\bimprove[ds]?\b|\bimproves\b|\bbenefit\b|favo(u)?r(ed|ing|s)?|superior|non-?inferior|cuts? .* (risk|relapse)|increases? the likelihood|safely improves|strongly associated|predicts/.test(bl)
  ) {
    return 'benefit';
  }

  return 'neutral';
}

// The "What it changes" card line: keep the curated Bottom line + Practice
// impact, but drop the generic "Clinical implications: Suggests that targeted
// intervention in <Family> ..." boilerplate tail that several lower-tier study
// blocks share verbatim.
function cleanPracticeImpact(bottomLine) {
  let s = (bottomLine || '').replace(/^Bottom line:\s*/i, '').trim();
  s = s.replace(/\s*Clinical implications:.*$/i, '').trim();
  s = s.replace(/\.\.$/, '.').trim();
  return s;
}

function inferCertainty(study, evidenceType) {
  const text = `${study.bottomLine} ${study.results} ${study.methodology}`.toLowerCase();
  if (evidenceType === 'observational') return 'low';
  if (/level 1a|individual patient data|ipd meta-analysis|highly significant|p ?< ?0\.001|level 1b/.test(text)) {
    return 'high';
  }
  if (/underpowered|small.*risk|not excluded|exploratory|secondary analysis|ancillary|subgroup|post hoc|sub-?study/.test(text)) {
    return 'low';
  }
  return 'moderate';
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const src = fs.readFileSync(briefingFile, 'utf8');
  const studies = parseBriefing(src);

  if (studies.length !== 50) {
    console.error(`generate-whats-new: expected 50 study blocks, parsed ${studies.length}`);
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const byId = cache.byId || {};

  const items = [];
  const quarantined = [];

  for (const study of studies) {
    const entry = byId[study.id];
    if (!entry || entry.status !== 'verified') {
      quarantined.push({
        id: study.id,
        acronym: study.acronym || '(none)',
        title: study.title,
        journal: study.journalRaw,
        reason: entry ? entry.reason || 'quarantined' : 'no verification-cache entry (PMID did not resolve or title mismatch)'
      });
      continue;
    }

    const evidenceType = inferEvidenceType(study);
    const topic = inferTopic(study);
    const item = {
      id: study.id,
      shortName: study.acronym || study.title.slice(0, 40),
      fullName: study.title,
      evidenceType,
      topic,
      topicLabel: TOPIC_LABELS[topic] || 'Stroke',
      journal: entry.journal || study.journalRaw,
      year: study.year,
      pmid: entry.pmid,
      doi: entry.doi || study.doi || '',
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${entry.pmid}/`,
      sourceUrl: study.url,
      practiceImpact: cleanPracticeImpact(study.bottomLine),
      result: {
        effect: extractEffect(study),
        direction: inferDirection(study)
      },
      certainty: inferCertainty(study, evidenceType),
      appraisal: {
        bottomLine: study.bottomLine,
        picoQuestion: study.picoQuestion,
        methodology: study.methodology,
        results: study.results
      }
    };

    if (evidenceType === 'observational') {
      item.observationalCaveat =
        'Observational study — confounding limits causal inference; interpret with caution.';
    }

    items.push(item);
  }

  // Sort: year desc, then acronym/shortName asc.
  items.sort((a, b) => {
    const ya = a.year || 0;
    const yb = b.year || 0;
    if (yb !== ya) return yb - ya;
    return (a.shortName || '').localeCompare(b.shortName || '');
  });

  const output = {
    generatedFrom: 'clinical-intelligence-briefing',
    sourceDoc: 'briefing-latest.md',
    count: items.length,
    items
  };

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n', 'utf8');

  // Quarantine report.
  quarantined.sort((a, b) => a.acronym.localeCompare(b.acronym));
  const qLines = [
    '# What\'s New — Quarantined studies',
    '',
    'Studies parsed from `data/clinical-intelligence/briefing-latest.md` that did',
    'NOT resolve to a real PubMed PMID with a matching title. Per the',
    'clinical-safety contract, these are EXCLUDED from `whats-new.json` and never',
    'displayed. Re-verify against PubMed (DOI or exact title) before promoting.',
    '',
    `Generated from: briefing-latest.md · verified-pmids.json`,
    `Quarantined: ${quarantined.length} of 50`,
    '',
    '| Acronym | id | Journal (briefing) | Reason |',
    '|---|---|---|---|'
  ];
  for (const q of quarantined) {
    qLines.push(
      `| ${q.acronym} | \`${q.id}\` | ${q.journal || '—'} | ${q.reason} |`
    );
  }
  qLines.push('');
  fs.writeFileSync(quarantineFile, qLines.join('\n'), 'utf8');

  console.log(
    `generate-whats-new: wrote ${items.length} verified items to whats-new.json ` +
      `(${quarantined.length} quarantined → whats-new-quarantine.md)`
  );
}

main();
