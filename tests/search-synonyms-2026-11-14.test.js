// Global search finds IVT targets by drug name and common phrasings (2026-11-14 clinical-logic review).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeSearch } from '../src/reference-search.js';
import { buildSearchIndex, searchIndex, groupResults } from '../src/quick-search-index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const { data } = JSON.parse(fs.readFileSync(path.join(root, 'data/clinical-reference.json'), 'utf8'));
const index = buildSearchIndex({ ...data, trials: [] }, { protocolSub: 'ischemic' });
const lead = query => { const groups = groupResults(searchIndex(index, query, Infinity)); return groups[0]?.[1]?.[0]?.id || null; };
const ids = query => searchIndex(index, query, Infinity).map(record => record.id);

describe('a thrombolytic drug name also finds targets written in IVT terms', () => {
  it.each([
    ['tpa contraindications', 'protocol:contraindications'], ['tnk contraindications', 'protocol:contraindications'],
    ['alteplase contraindications', 'protocol:contraindications'], ['tpa exclusions', 'protocol:contraindications'],
    ['tnk checklist', 'protocol:safety-pause'], ['tpa checklist', 'protocol:safety-pause'],
    ['tpa eligibility', 'protocol:ivt-card'], ['tpa angioedema', 'protocol:angioedema']
  ])('"%s" leads with %s', (query, id) => expect(lead(query)).toBe(id));
  it('finds post-thrombolysis BP targets', () => {
    for (const query of ['bp after tpa', 'bp after tnk', 'blood pressure after tpa']) expect(ids(query).some(id => /protocol:(qr-)?bp$/.test(id)), query).toBe(true);
    expect(lead('ich bp goal')).toBe('protocol:qr-bp');
  });
  it('ranks a record that matches every word literally above one that needs the drug-name fallback', () => {
    const results = searchIndex(index, 'tpa basilar', Infinity);
    const literal = results.filter(record => ` ${record._keys} ${record._title} ${record._body} `.includes('alteplase'));
    expect(literal.length).toBeGreaterThan(0);
    expect(results.indexOf(literal[0])).toBeLessThan(results.findIndex(record => !` ${record._keys} ${record._title} ${record._body} `.includes('alteplase')));
  });
  it('keeps the bare drug-name leads', () => {
    for (const query of ['tpa', 'tnk', 'alteplase', 'tenecteplase']) expect(lead(query), query).toBe('tool:tnk');
    expect(lead('evt')).toBe('protocol:evt');
    expect(lead('after evt')).toBe('protocol:post-evt');
  });
});

describe('common phrasings normalize to the terms the records use', () => {
  it('maps phrasing variants', () => {
    expect(normalizeSearch('mechanical thrombectomy')).toBe('thrombectomy');
    expect(normalizeSearch('intravenous thrombolysis')).toBe('thrombolysis');
    expect(normalizeSearch('IV thrombolysis')).toBe('thrombolysis');
    expect(normalizeSearch('thrombolytics')).toBe('thrombolytic');
    expect(normalizeSearch('reversal agents')).toBe('reversal');
    expect(normalizeSearch('deep vein thrombosis')).toBe('dvt');
    expect(normalizeSearch('venous thromboembolism')).toBe('vte');
  });
  it.each(['mechanical thrombectomy', 'intravenous thrombolysis', 'thrombolytics', 'reversal agents', 'cholesterol', 'deep vein thrombosis'])('"%s" returns results', query => {
    expect(ids(query).length).toBeGreaterThan(0);
  });
});
