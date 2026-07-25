// Dead-link + citation-format checks for the /content data layer.
// - Local reference paths (PDF/image) must exist on disk (dead-link guard).
// - Every PMID / DOI across all content must be well-formed.
// - Every citationId / PMID / DOI must resolve in the single citations
//   registry (src/evidence/citations.js).
// Pure (no browser).

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { citations } from '../src/evidence/citations.js';
import bundle from '../content/bundle.json';
import { PMID_PATTERN, DOI_PATTERN } from '../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');

const registryPmids = new Set(citations.map((c) => c.pmid).filter(Boolean));
const registryDois = new Set(citations.map((c) => c.doi).filter(Boolean));
const registryIds = new Set(citations.map((c) => c.id));

describe('reference dead-link guard', () => {
  it('every local reference path exists on disk', () => {
    const missing = [];
    for (const r of bundle.references) {
      if (r.type === 'external-link') continue;
      if (!r.path) { missing.push(`${r.id}: no path`); continue; }
      if (!fs.existsSync(path.join(REPO, r.path))) missing.push(`${r.id}: ${r.path}`);
    }
    expect(missing, `missing reference files:\n${missing.join('\n')}`).toEqual([]);
  });
});

describe('citation format', () => {
  it('all PMIDs in content are well-formed', () => {
    const bad = [];
    const check = (pmid, where) => { if (pmid && !PMID_PATTERN.test(String(pmid))) bad.push(`${where}: ${pmid}`); };
    for (const g of bundle.guidelines) (g.PMIDs || []).forEach((p) => check(p, `guideline ${g.id}`));
    for (const t of bundle.trials) check(t.PMID, `trial ${t.id}`);
    for (const e of bundle.education) (e.references || []).forEach((r) => check(r.pmid, `education ${e.id}`));
    expect(bad, `malformed PMIDs:\n${bad.join('\n')}`).toEqual([]);
  });

  it('all DOIs in content are well-formed', () => {
    const bad = [];
    for (const g of bundle.guidelines) (g.DOIs || []).forEach((d) => { if (!DOI_PATTERN.test(d)) bad.push(`guideline ${g.id}: ${d}`); });
    expect(bad, `malformed DOIs:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every content citationId resolves in the single registry', () => {
    const unresolved = [];
    const all = [...bundle.guidelines, ...bundle.trials];
    for (const rec of all) {
      for (const id of rec.citationIds || []) {
        if (!registryIds.has(id)) unresolved.push(`${rec.id}: ${id}`);
      }
    }
    expect(unresolved, `unresolved citationIds:\n${unresolved.join('\n')}`).toEqual([]);
  });

  it('content PMIDs/DOIs that claim registry provenance are present in it', () => {
    // Guidelines are derived from the registry, so their PMIDs/DOIs must exist
    // there. (Education references may cite sources beyond the atlas — those are
    // format-checked above but not required to be in the registry.)
    const orphanPmids = [];
    const orphanDois = [];
    for (const g of bundle.guidelines) {
      for (const p of g.PMIDs || []) if (!registryPmids.has(p)) orphanPmids.push(`${g.id}: ${p}`);
      for (const d of g.DOIs || []) if (!registryDois.has(d)) orphanDois.push(`${g.id}: ${d}`);
    }
    expect(orphanPmids, `guideline PMIDs not in registry:\n${orphanPmids.join('\n')}`).toEqual([]);
    expect(orphanDois, `guideline DOIs not in registry:\n${orphanDois.join('\n')}`).toEqual([]);
  });
});
