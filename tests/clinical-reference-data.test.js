import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { publicSourceUrl, validateClinicalReference } from '../scripts/validate-reference.mjs';
import { searchReference } from '../src/reference-search.js';

import { readClinicalReference } from '../scripts/reference-data.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const canonical = readClinicalReference();
const now = new Date('2026-10-01T23:59:59Z');
const validate = data => validateClinicalReference(data, { now });
const changed = change => { const data = structuredClone(canonical); change(data); return data; };

describe('bounded clinical-reference data', () => {
  it('validates all topics, calculator presentations and completed studies against the source/route contract', () => {
    expect(canonical.topics).toHaveLength(80);
    expect(new Set(canonical.topics.map(topic => topic.category)).size).toBe(9);
    expect(canonical.calculators).toHaveLength(16);
    expect(canonical.studies).toHaveLength(58);
    expect(validate(canonical)).toEqual([]);
  });

  it('maps every archived guideline identity to a visible topic and retains its source access limits', () => {
    const coverage=read('src/reference/coverage.json');
    expect(coverage).toHaveLength(110);expect(new Set(coverage.map(source=>source.id)).size).toBe(110);
    for(const source of coverage){
      expect(source.topicIds.length).toBeGreaterThan(0);
      for(const id of source.topicIds){const topic=canonical.topics.find(topic=>topic.id===id);expect(topic).toBeTruthy();expect(topic.sources.some(record=>record.url===source.url)).toBe(true);}
    }
  });

  it('restores historical study source access without importing archived outcome claims', () => {
    const sources = read('src/reference/study-sources.json');
    expect(sources).toHaveLength(273);
    expect(new Set(sources.map(source => source.url)).size).toBe(273);
    expect(new Set(sources.map(source => source.id)).size).toBe(273);
    for (const source of sources) {
      expect(source.topicIds.length).toBeGreaterThan(0);
      expect(source.access).toContain('bibliographic');
      for (const id of source.topicIds) {
        expect(canonical.topics.find(topic => topic.id === id)?.sources.some(item => item.url === source.url)).toBe(true);
      }
    }
    expect(searchReference(canonical.topics, 'AVERROES').map(topic => topic.id)).toEqual(['af-prevention']);
    expect(searchReference(canonical.topics, 'BEST-MSU').some(topic => topic.id === 'acute-bp')).toBe(false);
    for (const id of ['hope-bp-2026','tnk-vs-alteplase-rwe','enrich-af','actisave']) {
      expect(sources.find(source => source.id === `study-source-${id}`).access).toContain('withheld');
    }
  });

  it('serves the exact canonical records and source dates with matching version and checksum', () => {
    const endpoint = read('data/clinical-reference.json');
    expect(endpoint.data).toEqual(canonical);
    expect(endpoint._meta).toMatchObject({ status: 'maintained', schemaVersion: '2.0.0', appVersion: read('package.json').version, count: canonical.topics.length + canonical.studies.length, topicCount: canonical.topics.length, studyCount: canonical.studies.length });
    expect(endpoint._meta.checksum).toBe(`sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 32)}`);
    expect(endpoint._meta.scope).toContain('not full clinical certification');
  });

  it('advertises bounded views and endpoint while keeping full-corpus endpoints retired', () => {
    const index = read('data/index.json');
    expect(index.endpoints).toContain('https://rkalani1.github.io/stroke/data/clinical-reference.json');
    expect(index.routes.map(route => route.route)).toEqual(expect.arrayContaining(['#/evidence', '#/trials']));
    expect(index.routes.some(route => route.route.includes('/completed'))).toBe(false);
    for (const file of ['llms.txt', 'llms-full.txt', 'sitemap.xml']) expect(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')).toContain('https://rkalani1.github.io/stroke/data/clinical-reference.json');
    for (const path of read('docs/retired-endpoints.json').endpoints) {
      expect(read(path)).toMatchObject({ _meta: { status: 'retired' }, data: null });
    }
  });

  it.each([
    ['missing topic array', data => { delete data.topics; }],
    ['empty study array', data => { data.studies = []; }],
    ['null record', data => { data.topics[0] = null; }],
    ['duplicate id', data => { data.studies[0].id = data.topics[0].id; }],
    ['invalid id', data => { data.topics[0].id = '../unsafe'; }],
    ['missing title', data => { data.topics[0].title = ''; }],
    ['invalid keywords', data => { data.topics[0].keywords = [42]; }],
    ['missing settings', data => { data.topics[0].settings = []; }],
    ['unknown setting', data => { data.topics[0].settings = ['emergency']; }],
    ['duplicate setting', data => { data.topics[0].settings = ['clinic', 'clinic']; }],
    ['missing caution', data => { delete data.topics[0].caution; }],
    ['missing review questions', data => { data.topics[0].consider = []; }],
    ['too many review questions', data => { data.topics[0].consider = Array(5).fill('Review'); }],
    ['missing study result', data => { delete data.studies[0].result; }],
    ['missing study limits', data => { delete data.studies[0].limits; }],
    ['invalid study year', data => { data.studies[0].year = '2023'; }],
    ['unknown related topic', data => { data.studies[0].relatedTopic = 'not-present'; }],
  ])('rejects %s', (_name, mutate) => {
    expect(validate(changed(mutate)).length).toBeGreaterThan(0);
  });

  it('permits an explicitly empty related topic', () => {
    expect(validate(changed(data => { data.studies[0].relatedTopic = ''; }))).toEqual([]);
  });

  it.each(['title', 'url', 'year', 'type', 'checkedAt', 'access'])('requires source %s metadata', field => {
    expect(validate(changed(data => { delete data.topics[0].sources[0][field]; })).length).toBeGreaterThan(0);
  });

  it.each([
    '2026-02-30', '2026-13-01', 'not-a-date', '2027-01-01', '2026-10-01T00:00:00Z',
  ])('rejects invalid or future source-check date %s', date => {
    expect(validate(changed(data => { data.topics[0].sources[0].checkedAt = date; })).length).toBeGreaterThan(0);
  });

  it.each([
    'javascript:alert(1)', 'http://pubmed.ncbi.nlm.nih.gov/37222476/',
    'https://user:password@example.com/', 'https://127.0.0.1/', 'https://[::1]/',
    'https://localhost/', 'https://portal.internal/', 'https://example.com:444/',
    'https://example.com/\nunsafe', 'https://example.com\\@evil.com/', '//example.com/',
  ])('rejects unsafe source URL %s', url => {
    expect(publicSourceUrl(url)).toBe(false);
    expect(validate(changed(data => { data.topics[0].sources[0].url = url; })).length).toBeGreaterThan(0);
  });

  it.each([
    'https://example.com/', 'javascript:alert(1)', '#/education', '#/tools/not-a-tool',
    '#/encounter/nihss/ignored', '#/encounter?patient=anything', '#/evidence/not-a-topic',
    '#/trials/completed/not-a-study', '#/evidence/not-a-study', '#/protocols/ich/angioedema',
  ])('rejects unsafe or unavailable related route %s', href => {
    expect(validate(changed(data => { data.topics[0].related = [{ label: 'Open', href }]; })).length).toBeGreaterThan(0);
  });

  it('accepts mounted protocol and reference deep links', () => {
    expect(validate(changed(data => { data.topics[0].related = [
      { label: 'Reversal', href: '#/protocols/ich/reversal' },
      { label: 'Angioedema', href: '#/protocols/ischemic/angioedema' },
      { label: 'AF timing', href: '#/evidence/af-timing' },
      { label: 'ELAN', href: '#/evidence/elan' },
      { label: 'Legacy ELAN', href: '#/trials/completed/elan' },
    ]; }))).toEqual([]);
  });

  it('shares local study search and care-setting filters without dropping limitations', () => {
    const matches = searchReference(canonical.studies, 'ELAN', 'hospital');
    // The pooled CATALYST population includes ELAN, so it is also a valid match.
    expect(matches.map(record => record.id)).toEqual(['elan', 'catalyst']);
    expect(matches[0].limits).toBeTruthy();
    expect(matches[0].sources[0].access).toBeTruthy();
    expect(searchReference(canonical.topics, '', 'clinic').every(record => record.settings.includes('clinic'))).toBe(true);
    expect(searchReference(canonical.studies, 'no-such-reference-xyz')).toEqual([]);
  });
});
