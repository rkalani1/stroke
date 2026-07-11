// Unit tests for the content-access + workflow-context filter library.
// Pure — no browser. Exercises the primitive the Telestroke/Inpatient/Clinic
// context switch and the data-driven Guidelines/Education surfaces build on.

import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_CONTEXTS, contextsForRecord, isRelevantTo, filterByContext,
  getGuidelines, getTrials, getEducation, getReferences, getCalculators,
  getCalculatorById, getSearchIndex, searchContent, contentMeta,
} from '../src/content-context.js';

describe('workflow contexts', () => {
  it('defines exactly the three workflow settings', () => {
    expect(WORKFLOW_CONTEXTS).toEqual(['telestroke', 'inpatient', 'clinic']);
  });
});

describe('contextsForRecord', () => {
  it('uses an explicit contexts array when present', () => {
    expect(contextsForRecord({ contexts: ['clinic'] })).toEqual(['clinic']);
  });
  it('projects guideline setting onto the workflow axis', () => {
    expect(contextsForRecord({ setting: 'inpatient' })).toEqual(['inpatient']);
    expect(contextsForRecord({ setting: 'outpatient' })).toEqual(['clinic']);
    expect(contextsForRecord({ setting: 'pre-facility' })).toEqual(['telestroke']);
    expect(contextsForRecord({ setting: 'all' })).toEqual(WORKFLOW_CONTEXTS);
  });
  it('defaults to all contexts when unscoped (never hides content)', () => {
    expect(contextsForRecord({})).toEqual(WORKFLOW_CONTEXTS);
  });
  it('ignores unknown context tokens', () => {
    expect(contextsForRecord({ contexts: ['clinic', 'bogus'] })).toEqual(['clinic']);
  });
});

describe('isRelevantTo / filterByContext', () => {
  const items = [
    { id: 'a', contexts: ['telestroke'] },
    { id: 'b', contexts: ['clinic'] },
    { id: 'c', setting: 'all' },
    { id: 'd' }, // unscoped → all
  ];
  it('null context matches everything (keeps global search unfiltered)', () => {
    expect(filterByContext(items, null).map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('filters to a specific context, keeping unscoped + all records', () => {
    expect(filterByContext(items, 'clinic').map((i) => i.id)).toEqual(['b', 'c', 'd']);
    expect(filterByContext(items, 'telestroke').map((i) => i.id)).toEqual(['a', 'c', 'd']);
  });
  it('an unknown context is treated as no filter', () => {
    expect(filterByContext(items, 'nope').map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('does not mutate the input array', () => {
    const copy = items.slice();
    filterByContext(items, 'clinic');
    expect(items).toEqual(copy);
  });
});

describe('domain accessors over the real bundle', () => {
  it('returns non-empty domains', () => {
    expect(getGuidelines().length).toBeGreaterThan(0);
    expect(getTrials().length).toBeGreaterThan(0);
    expect(getEducation().length).toBeGreaterThan(0);
    expect(getReferences().length).toBeGreaterThan(0);
    expect(getCalculators().length).toBeGreaterThan(0);
  });
  it('guideline setting filtering actually narrows results', () => {
    const all = getGuidelines();
    const inpatient = getGuidelines('inpatient');
    expect(inpatient.length).toBeGreaterThan(0);
    expect(inpatient.length).toBeLessThanOrEqual(all.length);
    // every returned guideline must be inpatient-relevant
    for (const g of inpatient) expect(isRelevantTo(g, 'inpatient')).toBe(true);
  });
  it('education defaults to all three contexts (seeded), so context filtering hides nothing yet', () => {
    expect(getEducation('telestroke').length).toBe(getEducation().length);
    expect(getEducation('clinic').length).toBe(getEducation().length);
  });
  it('looks up a calculator by id', () => {
    const c = getCalculatorById('nihss');
    expect(c).toBeTruthy();
    expect(c.fn).toBe('calculateNIHSS');
    expect(getCalculatorById('does-not-exist')).toBeNull();
  });
});

describe('unified search index', () => {
  it('spans all five domains', () => {
    const domains = new Set(getSearchIndex().map((e) => e.domain));
    expect(domains).toEqual(new Set(['guideline', 'trial', 'education', 'calculator', 'reference']));
  });
  it('searchContent finds a known trial across domains', () => {
    const hits = searchContent('tenecteplase');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.domain === 'calculator' || h.domain === 'trial')).toBe(true);
  });
  it('empty query returns nothing', () => {
    expect(searchContent('')).toEqual([]);
  });
  it('context scopes search but null does not', () => {
    const all = searchContent('stroke', null).length;
    const scoped = searchContent('stroke', 'clinic').length;
    expect(scoped).toBeLessThanOrEqual(all);
  });
});

describe('bundle provenance', () => {
  it('carries generation metadata', () => {
    expect(contentMeta.checksum).toMatch(/^sha256:/);
    expect(contentMeta.counts.guidelines).toBeGreaterThan(0);
  });
});
