// content/schema.mjs
//
// Declarative field schemas + validators for the /content data layer.
//
// House style deliberately mirrors src/evidence/schema.js: hand-rolled,
// zero external dependencies, validators RETURN {errors, warnings} rather than
// throwing, and citation cross-references are checked against a caller-supplied
// Set of known citation ids / PMIDs / DOIs. This keeps the client bundle free
// of a validation dependency (validation runs only in Node build scripts and
// vitest) while still giving JSON-Schema-grade guarantees.
//
// The five content domains and their required fields are the contract the
// maintainer edits against. See CONTRIBUTING-content.md for the authoring guide.

// ── Shared enums (kept identical to src/evidence/schema.js so the two layers
//    validate COR/LOE the same way) ────────────────────────────────────────
export const COR_VALUES = ['I', 'IIa', 'IIb', 'III-no-benefit', 'III-harm'];
export const LOE_VALUES = ['A', 'B-R', 'B-NR', 'C-LD', 'C-EO'];
export const CONTEXT_VALUES = ['telestroke', 'inpatient', 'clinic'];
export const CALCULATOR_CATEGORIES = [
  'severity', 'prognosis', 'imaging', 'risk', 'dosing',
  'reperfusion', 'secondary-prevention', 'screening'
];
export const REFERENCE_TYPES = ['pdf', 'image', 'external-link'];

export const PMID_PATTERN = /^\d{7,9}$/;
export const DOI_PATTERN = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const KEBAB_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ── Small validation helpers ──────────────────────────────────────────────
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isArr = (v) => Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function req(errors, obj, field, pred, msg) {
  if (!(field in obj) || !pred(obj[field])) {
    errors.push(`${field}: ${msg}`);
  }
}

function monthsBetween(fromIso, toDate) {
  const from = new Date(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) return Infinity;
  return (toDate.getUTCFullYear() - from.getUTCFullYear()) * 12
    + (toDate.getUTCMonth() - from.getUTCMonth());
}

// Checks a record's citation-bearing fields resolve into the known-id sets.
// `ctx.citationIds`, `ctx.pmids`, `ctx.dois` are Sets built from the canonical
// citations registry (src/evidence/citations.js). Missing references are the
// "missing citations" build failure the spec requires.
function checkCitations(errors, obj, ctx) {
  if (!ctx) return;
  for (const id of obj.citationIds || []) {
    if (ctx.citationIds && !ctx.citationIds.has(id)) {
      errors.push(`citationIds: "${id}" is not defined in the citations registry`);
    }
  }
  for (const pmid of obj.PMIDs || obj.pmids || []) {
    if (!PMID_PATTERN.test(pmid)) errors.push(`PMID "${pmid}" is malformed`);
    else if (ctx.pmids && !ctx.pmids.has(pmid)) {
      errors.push(`PMID "${pmid}" is not present in the citations registry`);
    }
  }
  for (const doi of obj.DOIs || obj.dois || []) {
    if (!DOI_PATTERN.test(doi)) errors.push(`DOI "${doi}" is malformed`);
  }
}

// Shared lastReviewed currency check. ctx.now (Date) + ctx.maxAgeMonths.
function checkCurrency(warnings, errors, obj, ctx) {
  if (!('lastReviewed' in obj)) return;
  if (!ISO_DATE_PATTERN.test(obj.lastReviewed)) {
    errors.push(`lastReviewed: "${obj.lastReviewed}" is not an ISO YYYY-MM-DD date`);
    return;
  }
  if (ctx && ctx.now && ctx.maxAgeMonths) {
    const age = monthsBetween(obj.lastReviewed, ctx.now);
    if (age > ctx.maxAgeMonths) {
      // Stale entries are the third mandated build failure. Whether stale is a
      // hard error or a warning is caller-controlled (ctx.staleIsError).
      const bucket = ctx.staleIsError ? errors : warnings;
      bucket.push(`lastReviewed: entry is ${age} months old (> ${ctx.maxAgeMonths}); re-verify against source`);
    }
  }
}

// ── Guideline recommendation ──────────────────────────────────────────────
// /content/guidelines/*.json — array records.
export function validateGuideline(g, ctx = {}) {
  const errors = [];
  const warnings = [];
  req(errors, g, 'id', (v) => isStr(v) && KEBAB_PATTERN.test(v), 'must be a kebab-case string');
  req(errors, g, 'guideline', isStr, 'source guideline name is required');
  req(errors, g, 'year', (v) => isNum(v) && v >= 1990 && v <= 2100, 'must be a 4-digit year');
  req(errors, g, 'section', isStr, 'section/topic is required');
  req(errors, g, 'COR', (v) => COR_VALUES.includes(v), `must be one of ${COR_VALUES.join(', ')}`);
  req(errors, g, 'LOE', (v) => LOE_VALUES.includes(v), `must be one of ${LOE_VALUES.join(', ')}`);
  req(errors, g, 'statement', (v) => isStr(v) && v.length >= 12, 'must be a non-trivial statement');
  req(errors, g, 'PMIDs', isArr, 'must be an array (may be empty)');
  req(errors, g, 'DOIs', isArr, 'must be an array (may be empty)');
  req(errors, g, 'lastReviewed', isStr, 'ISO date required');
  if (g.sourceUrl != null) req(errors, g, 'sourceUrl', isStr, 'must be a string when present');
  // Every guideline recommendation must be traceable: a supporting PMID/DOI/
  // citationId, OR a sourceUrl to the guideline it is drawn from (guideline
  // consensus statements are themselves the primary source).
  const hasPmids = isArr(g.PMIDs) && g.PMIDs.length > 0;
  const hasDois = isArr(g.DOIs) && g.DOIs.length > 0;
  const hasCitationIds = isArr(g.citationIds) && g.citationIds.length > 0;
  if (!hasPmids && !hasDois && !hasCitationIds && !isStr(g.sourceUrl)) {
    errors.push('missing citation: a guideline recommendation needs ≥1 PMID/DOI/citationId or a sourceUrl');
  }
  checkCitations(errors, g, ctx);
  checkCurrency(warnings, errors, g, ctx);
  return { errors, warnings };
}

// ── Trial ─────────────────────────────────────────────────────────────────
// /content/trials/*.json — array records.
export function validateTrial(t, ctx = {}) {
  const errors = [];
  const warnings = [];
  req(errors, t, 'id', (v) => isStr(v) && KEBAB_PATTERN.test(v), 'must be a kebab-case string');
  req(errors, t, 'name', isStr, 'trial name is required');
  req(errors, t, 'category', isStr, 'category is required');
  req(errors, t, 'population', isStr, 'population summary is required');
  req(errors, t, 'finding', isStr, 'finding is required');
  req(errors, t, 'teachingPoint', isStr, 'teachingPoint is required');
  req(errors, t, 'year', (v) => isNum(v) && v >= 1980 && v <= 2100, 'must be a 4-digit year');
  // A trial must cite its primary publication.
  if (!isStr(t.PMID) && (!t.citationIds || t.citationIds.length === 0)) {
    errors.push('missing citation: a trial needs a PMID or a citationId');
  }
  if (t.PMID != null && !PMID_PATTERN.test(t.PMID)) errors.push(`PMID "${t.PMID}" is malformed`);
  if (t.PMID && ctx.pmids && !ctx.pmids.has(t.PMID)) {
    warnings.push(`PMID "${t.PMID}" is not in the citations registry`);
  }
  checkCitations(errors, t, ctx);
  checkCurrency(warnings, errors, t, ctx);
  return { errors, warnings };
}

// ── Education module ──────────────────────────────────────────────────────
// /content/education/*.md (YAML frontmatter) — parsed to an object first.
export function validateEducation(e, ctx = {}) {
  const errors = [];
  const warnings = [];
  req(errors, e, 'id', (v) => isStr(v) && KEBAB_PATTERN.test(v), 'must be a kebab-case string');
  req(errors, e, 'title', isStr, 'title is required');
  req(errors, e, 'summary', isStr, 'summary is required');
  req(errors, e, 'tags', isArr, 'tags must be an array');
  req(errors, e, 'contexts', (v) => isArr(v) && v.length > 0 && v.every((c) => CONTEXT_VALUES.includes(c)),
    `contexts must be a non-empty subset of ${CONTEXT_VALUES.join('|')}`);
  req(errors, e, 'calculators', isArr, 'calculators must be an array of calculator ids');
  req(errors, e, 'references', isArr, 'references must be an array');
  req(errors, e, 'lastReviewed', isStr, 'ISO date required');
  // Referenced calculators must exist in the registry.
  if (isArr(e.calculators) && ctx.calculatorIds) {
    for (const id of e.calculators) {
      if (!ctx.calculatorIds.has(id)) errors.push(`calculators: "${id}" is not in the calculator registry`);
    }
  }
  // References may carry PMIDs; validate their shape and (soft) registry presence.
  if (isArr(e.references)) {
    for (const r of e.references) {
      if (r && r.pmid && !PMID_PATTERN.test(r.pmid)) errors.push(`reference PMID "${r.pmid}" is malformed`);
      else if (r && r.pmid && ctx.pmids && !ctx.pmids.has(r.pmid)) {
        warnings.push(`reference PMID "${r.pmid}" is not in the citations registry`);
      }
    }
  }
  checkCurrency(warnings, errors, e, ctx);
  return { errors, warnings };
}

// ── Calculator registry entry ─────────────────────────────────────────────
// /content/calculators/registry.json — single registry, array records.
export function validateCalculator(c, ctx = {}) {
  const errors = [];
  const warnings = [];
  req(errors, c, 'id', (v) => isStr(v) && KEBAB_PATTERN.test(v), 'must be a kebab-case string');
  req(errors, c, 'name', isStr, 'display name is required');
  req(errors, c, 'category', (v) => CALCULATOR_CATEGORIES.includes(v),
    `category must be one of ${CALCULATOR_CATEGORIES.join(', ')}`);
  req(errors, c, 'fn', (v) => isStr(v), 'compute function name is required');
  req(errors, c, 'module', (v) => v === 'calculators' || v === 'calculators-extended',
    'module must be "calculators" or "calculators-extended"');
  if (c.aliases != null) req(errors, c, 'aliases', isArr, 'aliases must be an array');
  if (c.contexts != null) {
    req(errors, c, 'contexts', (v) => isArr(v) && v.every((x) => CONTEXT_VALUES.includes(x)),
      `contexts must be a subset of ${CONTEXT_VALUES.join('|')}`);
  }
  checkCitations(errors, c, ctx);
  return { errors, warnings };
}

// ── Reference card / PDF metadata ─────────────────────────────────────────
// /content/references/*.json — array records.
export function validateReference(r, ctx = {}) {
  const errors = [];
  const warnings = [];
  req(errors, r, 'id', (v) => isStr(v) && KEBAB_PATTERN.test(v), 'must be a kebab-case string');
  req(errors, r, 'title', isStr, 'title is required');
  req(errors, r, 'category', isStr, 'category is required');
  req(errors, r, 'type', (v) => REFERENCE_TYPES.includes(v), `type must be one of ${REFERENCE_TYPES.join(', ')}`);
  if (r.type === 'external-link') {
    req(errors, r, 'url', isStr, 'external-link references need a url');
  } else {
    req(errors, r, 'path', isStr, 'pdf/image references need a repo-relative path');
  }
  if (r.contexts != null) {
    req(errors, r, 'contexts', (v) => isArr(v) && v.every((x) => CONTEXT_VALUES.includes(x)),
      `contexts must be a subset of ${CONTEXT_VALUES.join('|')}`);
  }
  checkCitations(errors, r, ctx);
  return { errors, warnings };
}

export const VALIDATORS = {
  guidelines: validateGuideline,
  trials: validateTrial,
  education: validateEducation,
  calculators: validateCalculator,
  references: validateReference,
};

// ── Minimal YAML-frontmatter parser for /content/education/*.md ────────────
// Supports exactly the subset this repo emits: `key: value`, quoted strings,
// numbers, ISO dates, and flow arrays `[a, b, c]` (optionally of quoted
// strings) or of `{k: v}` inline objects. No external YAML dependency.
export function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing YAML frontmatter (--- fenced block)');
  const body = m[2];
  const data = {};
  for (const rawLine of m[1].split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) throw new Error(`unparseable frontmatter line: ${line}`);
    const [, key, rawVal] = kv;
    data[key] = parseScalarOrFlow(rawVal.trim());
  }
  return { data, body: body.trimStart() };
}

function parseScalarOrFlow(v) {
  if (v === '' ) return '';
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return splitFlow(inner).map((x) => parseScalarOrFlow(x.trim()));
  }
  if (v.startsWith('{') && v.endsWith('}')) {
    const obj = {};
    for (const part of splitFlow(v.slice(1, -1))) {
      const kv = part.split(/:(.*)/s);
      obj[kv[0].trim()] = parseScalarOrFlow((kv[1] || '').trim());
    }
    return obj;
  }
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

// Split a flow sequence on top-level commas (respecting [], {}, and quotes).
function splitFlow(s) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '[' || ch === '{') depth += 1;
    if (ch === ']' || ch === '}') depth -= 1;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
