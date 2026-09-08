// Reference Library registry guard (P4-2 / P4-4).
//
// src/app.jsx now renders the Reference Library sub-tab's document list from
// the module-level REFERENCE_LIBRARY_SECTIONS registry (instead of hand-copied
// JSX rows), and the Guidelines sub-tab hosts the searchable Guideline Library.
// This test extracts the registry slice and validates:
//   - registry shape (unique kebab ids, known types, https external links);
//   - every repo-local path exists on disk (dead-link guard for the rows the
//     content-layer seed cannot see, e.g. parenthesized filenames);
//   - `year` is only present when traceable to the document's own
//     title/filename (never guessed);
//   - `supersededBy` resolves to another registered document;
//   - the moved Guideline Library exists exactly once (moved, not duplicated),
//     the ref-guidelines compatibility anchor survives, and the References TOC
//     gained the previously missing ref-code-stroke entry;
//   - the "Summary only — see source" chip rule matches the mechanical
//     data-shape definition (every recommendation in the dataset is the single
//     "Scope" abstract statement) and each flagged dataset carries a pmid so
//     "see source" always has a PubMed target.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const appJsxContent = fs.readFileSync(path.join(ROOT, 'src', 'app.jsx'), 'utf8');

// Extract the pure registry slice for direct runtime evaluation (same pattern
// as tests/navigation-reorganization.test.js).
const registrySlice = appJsxContent.substring(
  appJsxContent.indexOf('const REFERENCE_LIBRARY_SECTIONS'),
  appJsxContent.indexOf('// end REFERENCE_LIBRARY_SECTIONS')
);
const scope = {};
new Function(
  'scope',
  registrySlice + `
    scope.REFERENCE_LIBRARY_SECTIONS = REFERENCE_LIBRARY_SECTIONS;
    scope.REFERENCE_LIBRARY_DOCS = REFERENCE_LIBRARY_DOCS;
    scope.REFERENCE_DOC_BY_ID = REFERENCE_DOC_BY_ID;
  `
)(scope);

const { REFERENCE_LIBRARY_SECTIONS, REFERENCE_LIBRARY_DOCS, REFERENCE_DOC_BY_ID } = scope;

describe('REFERENCE_LIBRARY_SECTIONS registry shape', () => {
  it('extracts a non-empty registry from app.jsx', () => {
    expect(REFERENCE_LIBRARY_SECTIONS.length).toBeGreaterThanOrEqual(10);
    expect(REFERENCE_LIBRARY_DOCS.length).toBeGreaterThanOrEqual(28);
  });

  it('document ids are unique kebab-case strings', () => {
    const ids = REFERENCE_LIBRARY_DOCS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9.]+)*$/);
  });

  it('every document declares a known type with the matching source field', () => {
    for (const doc of REFERENCE_LIBRARY_DOCS) {
      expect(['pdf', 'image', 'external-link']).toContain(doc.type);
      if (doc.type === 'external-link') {
        expect(doc.href, `${doc.id} href`).toMatch(/^https:\/\//);
      } else {
        expect(doc.path, `${doc.id} path`).toMatch(/^documents\//);
        expect(doc.path.includes('..')).toBe(false);
      }
    }
  });

  it('every repo-local document path exists on disk', () => {
    const missing = REFERENCE_LIBRARY_DOCS
      .filter((d) => d.type !== 'external-link')
      .filter((d) => !fs.existsSync(path.join(ROOT, d.path)))
      .map((d) => `${d.id}: ${d.path}`);
    expect(missing, `registry paths missing from disk:\n${missing.join('\n')}`).toEqual([]);
  });

  it('year is only present when traceable to the document title/filename', () => {
    for (const doc of REFERENCE_LIBRARY_DOCS) {
      if (doc.year == null) continue;
      expect(Number.isInteger(doc.year)).toBe(true);
      expect(doc.year).toBeGreaterThanOrEqual(1990);
      expect(doc.year).toBeLessThanOrEqual(2100);
      const haystack = [doc.title, doc.path, doc.href, doc.emailTitle, doc.subtitle]
        .filter(Boolean)
        .join(' ');
      const full = String(doc.year);
      const short = full.slice(2); // date-stamped filenames like "7.13.22"
      const traceable = haystack.includes(full) || new RegExp(`\\.${short}\\b`).test(haystack);
      expect(traceable, `${doc.id}: year ${doc.year} not traceable in "${haystack}"`).toBe(true);
    }
  });

  it('supersededBy (when present) resolves to a different registered document', () => {
    for (const doc of REFERENCE_LIBRARY_DOCS) {
      if (!doc.supersededBy) continue;
      expect(REFERENCE_DOC_BY_ID.has(doc.supersededBy), `${doc.id} supersededBy ${doc.supersededBy}`).toBe(true);
      expect(doc.supersededBy).not.toBe(doc.id);
    }
  });

  it('registers the previously unregistered quick reference sheets (P4-4b)', () => {
    const quickrefs = REFERENCE_LIBRARY_DOCS.filter((d) => d.path && d.path.startsWith('documents/references/'));
    expect(quickrefs.length).toBe(9);
  });
});

describe('Guideline Library relocation and References TOC (P4-2a / P4-4c)', () => {
  it('the searchable Guideline Library renders exactly once, in the Guidelines sub-tab', () => {
    const searchInputs = appJsxContent.match(/aria-label="Search guideline recommendations"/g) || [];
    expect(searchInputs.length).toBe(1);
    const guidelinesPanelStart = appJsxContent.indexOf('id="research-tabpanel-guidelines"');
    const referencesPanelStart = appJsxContent.indexOf('id="research-tabpanel-references"');
    const libraryIdx = appJsxContent.indexOf('aria-label="Search guideline recommendations"');
    expect(guidelinesPanelStart).toBeGreaterThan(0);
    expect(libraryIdx).toBeGreaterThan(guidelinesPanelStart);
    expect(libraryIdx).toBeLessThan(referencesPanelStart);
  });

  it('keeps a ref-guidelines compatibility anchor in the References panel', () => {
    const anchors = appJsxContent.match(/id="ref-guidelines"/g) || [];
    expect(anchors.length).toBe(1);
    expect(appJsxContent.indexOf('id="ref-guidelines"')).toBeGreaterThan(
      appJsxContent.indexOf('id="research-tabpanel-references"')
    );
  });

  it('References TOC gained the previously missing ref-code-stroke entry and the section id exists', () => {
    expect(appJsxContent).toContain("['ref-code-stroke', 'Code Stroke']");
    expect(appJsxContent).toContain('id="ref-code-stroke"');
  });

  it('per-recommendation anchor ids and classNote footnote are wired (P4-2b/c)', () => {
    expect(appJsxContent).toContain('id={`gl-rec-${rec.id}`}');
    expect(appJsxContent).toContain('Note: {rec.classNote}');
    // Badge carries only the short class token + LOE, never the long classNote.
    expect(appJsxContent).toContain('{recClass}/{recLevel}');
    expect(appJsxContent).not.toContain('${recClass} (${rec.classNote})');
  });
});

describe('No-stub rule (P4-2e) against src/guidelines data', () => {
  const dir = path.join(ROOT, 'src', 'guidelines');
  const files = fs.readdirSync(dir).filter(
    (f) => f.endsWith('.json') && f !== 'index.json' && f !== 'landmark-trials.json'
  );
  const datasets = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const summaryOnly = datasets.filter(
    (g) => (g.recommendations || []).length > 0 && g.recommendations.every((r) => r.section === 'Scope')
  );

  // This guard used to assert that stubs EXISTED (a floor of 60, when 67 of 89
  // datasets were a single abstract-quoting "Scope" line). The library has since
  // been rebuilt from the published full text, so the invariant is inverted: no
  // dataset may go back to being abstract-only.
  it('no dataset is an abstract-only stub', () => {
    const ids = summaryOnly.map((g) => g.id);
    expect(ids, `abstract-only stub datasets have reappeared: ${ids.join(', ')}`).toEqual([]);
  });

  it('every dataset declares documentType and gradingSystem', () => {
    const missing = datasets
      .filter((g) => !g.documentType || !g.gradingSystem)
      .map((g) => g.id);
    expect(missing, `datasets missing documentType/gradingSystem: ${missing.join(', ')}`).toEqual([]);
  });

  // Six documents publish their recommendation boxes as images or sit behind a
  // subscription. They carry what was recoverable plus an explicit caveat, and
  // must never be given a grade their source did not state.
  it('documents whose source is not machine-readable say so, and claim no grades', () => {
    const flagged = datasets.filter((g) => g.extractionStatus === 'source-not-machine-readable');
    for (const g of flagged) {
      expect(g.extractionNote, `${g.id} lacks an extractionNote`).toBeTruthy();
      expect(g.gradingSystem, `${g.id} must be ungraded`).toBe('ungraded');
      for (const r of g.recommendations || []) {
        expect(r.classOfRec, `${g.id} claims a grade it could not read`).toBe('Statement');
        expect(r.levelOfEvidence, `${g.id} claims a level it could not read`).toBe('Ungraded');
      }
    }
  });

  it('every dataset carries a pmid, so "see source" always has a PubMed target', () => {
    const missing = datasets.filter((g) => !g.pmid && !g.pubmedUrl).map((g) => g.id);
    expect(missing, `datasets without pmid/pubmedUrl: ${missing.join(', ')}`).toEqual([]);
  });

  it('the flagship graded guidelines keep their class distribution', () => {
    const byId = new Map(datasets.map((g) => [g.id, g]));
    for (const id of ['ais-2026', 'ich-2022', 'secondary-prevention-2021', 'sah-2023']) {
      const g = byId.get(id);
      expect(g, `${id} missing`).toBeTruthy();
      const graded = (g.recommendations || []).filter((r) => ['I', 'IIa', 'IIb', 'III'].includes(r.classOfRec));
      expect(graded.length, `${id} lost its ACC/AHA classes`).toBeGreaterThan(50);
    }
  });
});
