// tests/education-reference-drift.test.js
//
// Reference-vs-body drift guard for the education modules in
// src/education.jsx.
//
// Each entry in EDUCATION_MODULES carries a frontmatter-style `references`
// list ({ label, citation, pmid }). This test asserts that every listed
// reference is actually discussed by the module it is attached to: the
// reference's trial acronym (or, where the label has no acronym, its
// first-author token or an acronym drawn from the citation text) must appear
// somewhere in the module's rendered body — the JSX returned for that module
// by renderSubModuleContent(), including the view/card components it renders
// (pocket-card footers included) and the module's own title/purpose/actions
// strings.
//
// The check is static: it never imports education.jsx (which needs a JSX
// runtime + DOM); it extracts the module records and the component sources
// from the file text, the same technique used by the existing
// clinical-corrections and adversarial-tier5 suites.
//
// Purpose: catch FUTURE drift — a reference added to (or left behind in) a
// module's reference list without the module body being updated, or a body
// rewrite that drops a trial while its reference entry stays. Known
// legitimate exceptions on the current tree are whitelisted explicitly below.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const eduSrc = fs.readFileSync(path.join(ROOT, 'src/education.jsx'), 'utf8');

// Files that can hold a module's body: education.jsx itself plus the card /
// simulator component modules its views render.
const BODY_FILES = [
  'src/education.jsx',
  'src/pocket-cards.jsx',
  'src/teaching.jsx',
  'src/components.jsx',
  'src/simulators/EvdIcpSimulator.jsx',
  'src/simulators/HintsSimulator.jsx',
  'src/simulators/PupillometrySimulator.jsx',
  'src/simulators/NeuroExamsTool.jsx',
].map((p) => fs.readFileSync(path.join(ROOT, p), 'utf8'));

// Known, deliberate exceptions on the current tree. Each is a reference kept
// on the module's list although the body does not name it. One line of
// justification each — remove the entry when the body catches up.
const WHITELIST = new Set([
  // 2026 AHA/ASA AIS guideline is provenance for the HINTS+ algorithm; the simulator body never names AHA/ASA or Prabhakaran.
  'hints-simulator :: AHA/ASA Guideline',
  // Card covers CRYSTAL AF / STROKE-AF / ARCADIA; NOAH-AFNET 6 is discussed in the sibling device-detected-subclinical-af module instead.
  'cryptogenic-stroke-esus :: NOAH-AFNET 6 Trial',
  // Prehospital BP trial kept as background reading; the card body covers in-hospital INTERACT-2/3 + ATACH-2, and INTERACT4 lives in prehospital-triage-systems.
  'ich-blood-pressure :: INTERACT4 Trial',
  // Tranexamic-acid context reference; the card footer discusses FASTEST (rFVIIa) and never names TICH-2 or Sprigg.
  'ich-blood-pressure :: TICH-2 Trial',
]);

// ---------------------------------------------------------------------------
// Extraction helpers (bracket-matching parse of the module array; no eval).
// ---------------------------------------------------------------------------

function extractArray(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`marker not found: ${marker}`);
  const open = src.indexOf('[', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced brackets after: ${marker}`);
}

// Split `[ {...}, {...} ]` source into top-level object-literal sources,
// string-aware so braces inside quoted text do not break the walk.
function splitTopLevelObjects(arrSrc) {
  const out = [];
  let depth = 0;
  let objStart = -1;
  let inStr = null;
  for (let i = 1; i < arrSrc.length - 1; i++) {
    const ch = arrSrc[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '{' || ch === '[') {
      if (depth === 0 && ch === '{') objStart = i;
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        out.push(arrSrc.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }
  return out;
}

function fieldStr(objSrc, name) {
  const m = objSrc.match(new RegExp(`\\b${name}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`));
  return m ? m[2] : '';
}

function extractReferences(objSrc) {
  const idx = objSrc.indexOf('references:');
  if (idx === -1) return null;
  const open = objSrc.indexOf('[', idx);
  let depth = 0;
  let end = -1;
  for (let i = open; i < objSrc.length; i++) {
    if (objSrc[i] === '[') depth++;
    else if (objSrc[i] === ']') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return splitTopLevelObjects(objSrc.slice(open, end + 1)).map((r) => ({
    label: fieldStr(r, 'label'),
    citation: fieldStr(r, 'citation'),
    pmid: fieldStr(r, 'pmid'),
  }));
}

const modules = splitTopLevelObjects(extractArray(eduSrc, 'const EDUCATION_MODULES = [')).map((o) => ({
  id: fieldStr(o, 'id'),
  title: fieldStr(o, 'title'),
  purpose: fieldStr(o, 'purpose'),
  actions: fieldStr(o, 'actions'),
  references: extractReferences(o),
}));

// ---------------------------------------------------------------------------
// Body corpus: the module's renderSubModuleContent case block, expanded
// through the components it renders (transitively, bounded depth), plus the
// module record's own title/purpose/actions. The references list itself is
// deliberately NOT part of the corpus — otherwise every check would be
// satisfied by the reference entry under test.
// ---------------------------------------------------------------------------

const switchSrc = eduSrc.slice(eduSrc.indexOf('function renderSubModuleContent'));

function caseBody(id) {
  const m = switchSrc.indexOf(`case '${id}':`);
  if (m === -1) return '';
  const next = switchSrc.indexOf('case ', m + 5);
  const dflt = switchSrc.indexOf('default:', m + 5);
  let end = next === -1 ? dflt : next;
  if (end === -1) end = switchSrc.length;
  return switchSrc.slice(m, end);
}

const componentSourceCache = new Map();
function componentSource(name) {
  if (componentSourceCache.has(name)) return componentSourceCache.get(name);
  let found = '';
  for (const src of BODY_FILES) {
    for (const pat of [`const ${name} = `, `function ${name}(`]) {
      const i = src.indexOf(pat);
      if (i !== -1) {
        const rest = src.slice(i);
        // A component's source ends where the next top-level declaration
        // starts (column-0 export/const/function).
        const m = rest.slice(10).search(/\n(?:export |const [A-Z]|function [A-Z])/);
        found = m === -1 ? rest : rest.slice(0, m + 10);
        break;
      }
    }
    if (found) break;
  }
  componentSourceCache.set(name, found);
  return found;
}

function collectCorpus(mod) {
  const seen = new Set();
  let corpus = `${caseBody(mod.id)}\n${mod.title}\n${mod.purpose}\n${mod.actions}`;
  let frontier = [...new Set(corpus.match(/[A-Z][A-Za-z0-9]+/g) || [])];
  for (let depth = 0; depth < 4; depth++) {
    const next = [];
    for (const name of frontier) {
      if (seen.has(name)) continue;
      seen.add(name);
      const src = componentSource(name);
      if (src) {
        corpus += `\n${src}`;
        next.push(...new Set((src.match(/<([A-Z][A-Za-z0-9]+)/g) || []).map((s) => s.slice(1))));
      }
    }
    frontier = next;
  }
  return corpus;
}

// ---------------------------------------------------------------------------
// Needle extraction. For each reference build candidate tokens:
//   1. acronym tokens from the label   (>=2 capitals, len>=3: POINT, TICH-2,
//      SeLECT, B_PROUD, NCS, ESO ...)
//   2. strong acronym tokens from the citation text (>=3 capitals, len>=4:
//      catches trial names only present in the citation, e.g. HINTS)
//   3. the first-author surname (len>=3, so 'Li G' does not match vacuously)
// The reference passes when ANY candidate appears in the module corpus,
// compared case-insensitively with hyphens/underscores/spaces collapsed
// (so 'CHANCE-2' matches 'CHANCE 2' and 'B_PROUD' matches 'B-PROUD').
// ---------------------------------------------------------------------------

const norm = (s) => s.toLowerCase().replace(/[\s_‑-]+/g, '');
const GENERIC = new Set(['pmid', 'doi', 'nejm', 'jama', 'lancet', 'stroke', 'circulation', 'mri', 'icu', 'rct', 'iqr']);

function candidatesOf(ref) {
  const cands = [];
  for (const t of (ref.label || '').split(/[\s/(),&]+/)) {
    const clean = t.replace(/[^A-Za-z0-9_-]/g, '');
    if (clean.length >= 3 && (clean.match(/[A-Z]/g) || []).length >= 2 && !GENERIC.has(clean.toLowerCase())) {
      cands.push(clean);
    }
  }
  for (const t of (ref.citation || '').split(/[\s/(),.;:&]+/)) {
    const clean = t.replace(/[^A-Za-z0-9_-]/g, '');
    if (clean.length >= 4 && (clean.match(/[A-Z]/g) || []).length >= 3 && !GENERIC.has(clean.toLowerCase())) {
      cands.push(clean);
    }
  }
  const author = (ref.citation || '').match(/^([A-Za-zÀ-ɏ'-]{3,})/);
  if (author) cands.push(author[1]);
  return [...new Set(cands)];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('education module reference-vs-body drift', () => {
  it('extracts a plausible module/reference census (guards against silent extraction rot)', () => {
    const withRefs = modules.filter((m) => m.references && m.references.length);
    const totalRefs = withRefs.reduce((n, m) => n + m.references.length, 0);
    // Floors, not exact counts: modules get added over time, but if extraction
    // breaks these collapse toward zero and the suite must fail loudly rather
    // than pass vacuously.
    expect(modules.length).toBeGreaterThanOrEqual(30);
    expect(withRefs.length).toBeGreaterThanOrEqual(30);
    expect(totalRefs).toBeGreaterThanOrEqual(100);
    for (const m of modules) expect(m.id, 'every module must parse an id').toBeTruthy();
  });

  it('every whitelisted exception still exists in the module reference lists', () => {
    // A stale whitelist entry means the drift was fixed (or the reference was
    // removed) — prune the entry so the guard stays tight.
    const liveKeys = new Set();
    for (const m of modules) {
      for (const ref of m.references || []) liveKeys.add(`${m.id} :: ${ref.label}`);
    }
    for (const key of WHITELIST) {
      expect(liveKeys.has(key), `whitelist entry no longer matches any reference: ${key}`).toBe(true);
    }
  });

  it('every listed reference is named in its module body or card footer', () => {
    const failures = [];
    for (const mod of modules) {
      if (!mod.references || !mod.references.length) continue;
      const corpus = norm(collectCorpus(mod));
      for (const ref of mod.references) {
        const key = `${mod.id} :: ${ref.label}`;
        if (WHITELIST.has(key)) continue;
        const cands = candidatesOf(ref);
        if (!cands.length) {
          failures.push(`${key} — no acronym/author token could be extracted from label/citation`);
          continue;
        }
        if (!cands.some((c) => corpus.includes(norm(c)))) {
          failures.push(`${key} — none of [${cands.join(', ')}] appear in the module body/card footer`);
        }
      }
    }
    expect(
      failures,
      `Reference drift detected — these module references are never named in their module's body/card footer.\n` +
        `Either discuss the trial in the body, drop the reference, or (only if deliberate) whitelist it with a justification:\n  ${failures.join('\n  ')}`
    ).toEqual([]);
  });
});
