// scripts/seed-content.mjs
//
// One-time (re-runnable) seed generator for the /content data layer.
//
// It DERIVES /content/*.{json,md} from the repo's existing canonical sources so
// the new data layer is faithful to what already ships — no clinical value is
// hand-typed or invented here. Sources:
//   - guidelines  ← src/evidence/recommendations.js (+ claims → citations drill-through)
//   - trials      ← src/evidence/completedTrials.js (+ citations for PMID/year)
//   - calculators ← src/calculators.js + src/calculators-extended.js exports
//                   (catalog names from the existing generator list)
//   - education   ← EDUCATION_MODULES in src/education.jsx (literal-extracted)
//   - references  ← documents/*.pdf|jpeg paths referenced in src/app.jsx
//
// Modes:
//   node scripts/seed-content.mjs           # write /content (overwrite)
//   node scripts/seed-content.mjs --check   # fail if regenerating would change
//                                             any file (drift guard for CI)
//
// After seeding, edit /content directly — but re-running this OVERWRITES it, so
// the interim contract is: guidelines/trials remain authored in src/evidence and
// projected here; calculators/education/references are authored here and this
// script only bootstraps them (guarded by --check, so intentional edits show up
// as drift to reconcile). See CONTRIBUTING-content.md.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const CONTENT = path.join(REPO, 'content');
const check = process.argv.includes('--check');

const drift = [];
async function emit(relPath, text) {
  const abs = path.join(CONTENT, relPath);
  if (check) {
    let existing = null;
    try { existing = await fs.readFile(abs, 'utf8'); } catch { /* new file */ }
    if (existing !== text) drift.push(relPath);
    return;
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, text, 'utf8');
}

const json = (obj) => JSON.stringify(obj, null, 2) + '\n';
const kebab = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
const firstYear = (s) => { const m = String(s || '').match(/\b(19|20)\d{2}\b/); return m ? Number(m[0]) : null; };

async function importSrc(rel) {
  return import(pathToFileURL(path.join(REPO, rel)).href);
}

// ── Build citation lookup (id → {pmid, doi, year}) ────────────────────────
async function loadCitations() {
  const { citations } = await importSrc('src/evidence/citations.js');
  const byId = new Map();
  for (const c of citations) byId.set(c.id, c);
  return byId;
}

// ── Guidelines ← recommendations.js ───────────────────────────────────────
async function seedGuidelines(citById) {
  const { recommendations } = await importSrc('src/evidence/recommendations.js');
  const { claims } = await importSrc('src/evidence/claims.js');
  const claimById = new Map(claims.map((c) => [c.id, c]));

  const KNOWN_URLS = {
    'AHA/ASA 2022 ICH': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000407',
    'AHA/ASA 2026 AIS': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000513',
    'AHA/ASA 2021 Secondary Prevention': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000375',
    'AHA/ASA 2023 aSAH': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000436',
    'AHA/ASA 2024 CVT': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000456',
  };
  const urlFor = (src) => {
    for (const [key, url] of Object.entries(KNOWN_URLS)) {
      const [org, year] = [key.split(' ')[0], firstYear(key)];
      if (src.includes(org.split('/')[0]) && year && src.includes(String(year))) return url;
    }
    return undefined;
  };

  // Group recommendations by source guideline slug.
  const groups = new Map();
  for (const rec of recommendations) {
    // Drill supportingClaimIds → citationIds → PMIDs/DOIs.
    const citIds = new Set();
    for (const clId of rec.supportingClaimIds || []) {
      const cl = claimById.get(clId);
      for (const cid of (cl && cl.citationIds) || []) citIds.add(cid);
    }
    const PMIDs = [];
    const DOIs = [];
    for (const cid of citIds) {
      const c = citById.get(cid);
      if (c && c.pmid) PMIDs.push(c.pmid);
      if (c && c.doi) DOIs.push(c.doi);
    }
    const year = firstYear(rec.guidelineSource)
      || (citIds.size ? firstYear(citById.get([...citIds][0])?.year) || citById.get([...citIds][0])?.year : null)
      || new Date(`${rec.lastReviewed}T00:00:00Z`).getUTCFullYear();

    const record = {
      id: rec.id,
      guideline: rec.guidelineSource,
      year,
      section: rec.topic,
      COR: rec.classOfRecommendation,
      LOE: rec.levelOfEvidence,
      statement: rec.text,
      PMIDs: [...new Set(PMIDs)],
      DOIs: [...new Set(DOIs)],
      citationIds: [...citIds],
      caveats: rec.caveats || [],
      setting: rec.setting,
      lastReviewed: rec.lastReviewed,
      sourceUrl: urlFor(rec.guidelineSource || ''),
      provenance: 'src/evidence/recommendations.js',
    };
    const slug = kebab((rec.guidelineSource || 'guideline').split(';')[0]).slice(0, 40) || 'guideline';
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(record);
  }

  for (const [slug, records] of [...groups].sort()) {
    await emit(`guidelines/${slug}.json`, json(records));
  }
  return groups;
}

// ── Trials ← completedTrials.js ───────────────────────────────────────────
async function seedTrials(citById) {
  const { completedTrials } = await importSrc('src/evidence/completedTrials.js');
  const records = completedTrials.map((t) => {
    const primaryCit = (t.citationIds || []).map((id) => citById.get(id)).find(Boolean);
    const pop = t.population || {};
    const popSummary = [
      pop.n != null ? `n=${pop.n}` : null,
      pop.ageRange, pop.nihssRange && pop.nihssRange !== 'all eligible' ? `NIHSS ${pop.nihssRange}` : null,
      pop.timeWindow,
    ].filter(Boolean).join(', ');
    return {
      id: t.id,
      name: t.shortName || t.fullName,
      fullName: t.fullName,
      category: t.topic || (t.diseaseArea && t.diseaseArea[0]) || 'stroke',
      population: popSummary || (pop.keyInclusion || []).join('; ') || 'see source',
      finding: (t.primaryEndpoint && t.primaryEndpoint.result) || t.applicabilityNotes || 'see source',
      teachingPoint: t.practiceImpact || t.applicabilityNotes || 'see source',
      PMID: primaryCit && primaryCit.pmid ? primaryCit.pmid : undefined,
      year: (primaryCit && primaryCit.year) || firstYear(t.fullName) || null,
      citationIds: t.citationIds || [],
      certainty: t.certainty,
      lastReviewed: t.lastReviewed,
      provenance: 'src/evidence/completedTrials.js',
    };
  });
  // Group by category for browsable files.
  const groups = new Map();
  for (const r of records) {
    const slug = kebab(r.category).slice(0, 40) || 'other';
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(r);
  }
  for (const [slug, recs] of [...groups].sort()) {
    await emit(`trials/${slug}.json`, json(recs));
  }
  return records.length;
}

// ── Calculators ← compute-module exports ──────────────────────────────────
// The canonical calculator catalog. This is the SINGLE source of truth that
// the agent-asset generator (data/calculators-index.json), the command palette,
// and the search index all derive from. Order + fields are kept identical to
// the pre-refactor generator list so data/ stays byte-identical; expanding the
// catalog to the remaining compute exports is a separate, reviewed change.
// Each entry is verified against the actual module export at seed time.
const CALCULATOR_CATALOG = [
  { id: 'nihss', name: 'NIH Stroke Scale', category: 'severity', fn: 'calculateNIHSS' },
  { id: 'ich-score', name: 'ICH Score', category: 'prognosis', fn: 'calculateICHScore' },
  { id: 'ich-volume', name: 'ICH Volume (ABC/2)', category: 'imaging', fn: 'calculateICHVolume' },
  { id: 'gcs', name: 'Glasgow Coma Scale', category: 'severity', fn: 'calculateGCS' },
  { id: 'abcd2', name: 'ABCD² (TIA risk)', category: 'risk', fn: 'calculateABCD2WithDetail' },
  { id: 'aspects-pc', name: 'pc-ASPECTS', category: 'imaging', fn: 'calculatePCAspects' },
  { id: 'chadsvasc', name: 'CHA₂DS₂-VASc', category: 'risk', fn: 'calculateCHADS2VascScore' },
  { id: 'hasbled', name: 'HAS-BLED', category: 'risk', fn: 'calculateHASBLEDScore' },
  { id: 'rope', name: 'RoPE (PFO)', category: 'risk', fn: 'calculateROPEScore' },
  { id: 'rcvs2', name: 'RCVS²', category: 'risk', fn: 'calculateRCVS2Score' },
  { id: 'phases', name: 'PHASES (aneurysm)', category: 'risk', fn: 'calculatePHASESScore' },
  { id: 'tnk-dose', name: 'Tenecteplase dose (0.25 mg/kg)', category: 'dosing', fn: 'calculateTNKDose' },
  { id: 'alteplase-dose', name: 'Alteplase dose (0.9 mg/kg)', category: 'dosing', fn: 'calculateAlteplaseDose' },
  { id: 'doac-start', name: 'DOAC start timing (post-stroke AF)', category: 'dosing', fn: 'calculateDOACStart' },
  { id: 'pcc-dose', name: '4F-PCC dose', category: 'dosing', fn: 'calculatePCCDose' },
  { id: 'andexanet', name: 'Andexanet alfa dose', category: 'dosing', fn: 'calculateAndexanetDose' },
  { id: 'enoxaparin', name: 'Enoxaparin dose', category: 'dosing', fn: 'calculateEnoxaparinDose' },
  { id: 'crcl', name: 'Creatinine clearance (Cockcroft-Gault)', category: 'dosing', fn: 'calculateCrCl' },
  { id: 'dawn', name: 'DAWN EVT eligibility', category: 'reperfusion', fn: 'evaluateDAWN' },
  { id: 'defuse3', name: 'DEFUSE-3 EVT eligibility', category: 'reperfusion', fn: 'evaluateDEFUSE3' },
  { id: 'acute-dapt', name: 'Acute DAPT recommendation', category: 'secondary-prevention', fn: 'recommendAcuteDAPT' },
  { id: 'essen', name: 'Essen Stroke Risk Score', category: 'risk', fn: 'calculateESSEN' },
  { id: 'spi2', name: 'Stroke Prognosis Instrument II', category: 'prognosis', fn: 'calculateSPI2' },
  { id: 'vasograde', name: 'VASOGRADE (DCI risk)', category: 'risk', fn: 'calculateVASOGRADE' },
  // Additional user-facing calculators with verified compute (README-listed),
  // catalogued so they are searchable via the palette/agent index.
  { id: 'chadsva', name: 'CHA₂DS₂-VA (2024 ESC)', category: 'risk', fn: 'calculateCHADS2VA' },
  { id: 'nascet', name: 'NASCET carotid stenosis', category: 'imaging', fn: 'calculateNASCET' },
  { id: 'havoc', name: 'HAVOC (occult AF risk)', category: 'risk', fn: 'calculateHAVOC' },
  { id: 'boston-caa', name: 'Boston Criteria v2.0 (CAA)', category: 'imaging', fn: 'evaluateBostonCAA20' },
  { id: 'bat', name: 'BAT Score (ICH expansion)', category: 'prognosis', fn: 'calculateBAT' },
  { id: 'brain', name: 'BRAIN Score (ICH expansion)', category: 'prognosis', fn: 'calculateBRAIN' },
  { id: 'nine-point', name: '9-Point ICH Expansion Score', category: 'prognosis', fn: 'calculateNinePoint' },
  { id: 'ogilvy-carter', name: 'Ogilvy-Carter (SAH surgical risk)', category: 'prognosis', fn: 'calculateOgilvyCarter' },
  { id: 'phq9', name: 'PHQ-9 (post-stroke depression)', category: 'screening', fn: 'interpretPHQ9' },
  { id: 'mrs-9q', name: 'mRS-9Q (simplified mRS)', category: 'severity', fn: 'interpretMRS9Q' },
];

async function seedCalculators() {
  const base = await importSrc('src/calculators.js');
  const ext = await importSrc('src/calculators-extended.js');
  const registry = [];
  const missing = [];
  for (const c of CALCULATOR_CATALOG) {
    let module = null;
    if (typeof base[c.fn] === 'function') module = 'calculators';
    else if (typeof ext[c.fn] === 'function') module = 'calculators-extended';
    if (!module) { missing.push(c.fn); continue; }
    registry.push({ id: c.id, name: c.name, category: c.category, fn: c.fn, module });
  }
  if (missing.length) {
    throw new Error(`seed-content: calculator catalog references missing exports: ${missing.join(', ')}`);
  }
  await emit('calculators/registry.json', json(registry));
  return registry.length;
}

// ── Education ← EDUCATION_MODULES literal in education.jsx ─────────────────
function extractEducationModules() {
  const src = fsSync.readFileSync(path.join(REPO, 'src/education.jsx'), 'utf8');
  const start = src.indexOf('const EDUCATION_MODULES = [');
  if (start === -1) throw new Error('EDUCATION_MODULES not found in education.jsx');
  // Find the matching close bracket for the array literal.
  let i = src.indexOf('[', start);
  let depth = 0;
  let end = -1;
  for (; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('could not find end of EDUCATION_MODULES array');
  const literal = src.slice(src.indexOf('[', start), end + 1);
  // The array is pure data (strings/arrays/objects) — no JSX, no calls.
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}

const yamlList = (arr) => `[${arr.map((x) => (typeof x === 'string' ? JSON.stringify(x) : x)).join(', ')}]`;

async function seedEducation() {
  const modules = extractEducationModules();
  for (const m of modules) {
    const tags = Array.isArray(m.categories) ? m.categories : [];
    // contexts is a NEW UX-routing hint (not a clinical fact); default to all
    // three so nothing is hidden until the maintainer narrows it.
    const contexts = ['telestroke', 'inpatient', 'clinic'];
    const front = [
      '---',
      `id: ${m.id}`,
      `title: ${JSON.stringify(m.title)}`,
      `summary: ${JSON.stringify(m.purpose || '')}`,
      `tags: ${yamlList(tags)}`,
      `contexts: ${yamlList(contexts)}`,
      `calculators: []`,
      `references: ${JSON.stringify(m.references || [])}`,
      `lastReviewed: ${m.lastReviewed}`,
      `provenance: src/education.jsx`,
      '---',
      '',
      m.purpose || '',
      '',
      '> The interactive teaching card for this module renders from `src/education.jsx`.',
      '> This file owns the module metadata (title, summary, tags, contexts, references).',
      '',
    ].join('\n');
    await emit(`education/${m.id}.md`, front);
  }
  return modules.length;
}

// ── References ← documents/* paths in app.jsx ─────────────────────────────
async function seedReferences() {
  const src = fsSync.readFileSync(path.join(REPO, 'src/app.jsx'), 'utf8');
  const rx = /documents\/[A-Za-z0-9 _%.&/-]+\.(pdf|jpe?g|png)/gi;
  const seen = new Map();
  let m;
  while ((m = rx.exec(src)) !== null) {
    let p = m[0].replace(/%20/g, ' ');
    if (seen.has(p)) continue;
    const parts = p.split('/');
    const category = parts[1] || 'general';
    const file = parts[parts.length - 1];
    const title = file.replace(/\.(pdf|jpe?g|png)$/i, '');
    const ext = file.split('.').pop().toLowerCase();
    seen.set(p, {
      id: kebab(`${category}-${title}`).slice(0, 60),
      title,
      category,
      type: ext === 'pdf' ? 'pdf' : 'image',
      path: p,
      provenance: 'src/app.jsx reference library',
    });
  }
  const records = [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
  // Group by category directory.
  const groups = new Map();
  for (const r of records) {
    const slug = kebab(r.category);
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(r);
  }
  for (const [slug, recs] of [...groups].sort()) {
    await emit(`references/${slug}.json`, json(recs));
  }
  return records.length;
}

async function main() {
  const citById = await loadCitations();
  const g = await seedGuidelines(citById);
  const t = await seedTrials(citById);
  const c = await seedCalculators();
  const e = await seedEducation();
  const r = await seedReferences();

  if (check) {
    if (drift.length) {
      console.error('seed-content --check: /content is out of sync with canonical sources:');
      for (const f of drift) console.error(`  - ${f}`);
      console.error('Run `npm run content:seed` and review/commit the changes.');
      process.exit(1);
    }
    console.log('seed-content --check: /content is in sync.');
    return;
  }
  console.log(`Seeded /content: guidelines(${[...g.values()].reduce((n, a) => n + a.length, 0)} recs in ${g.size} files), trials(${t}), calculators(${c}), education(${e}), references(${r}).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
