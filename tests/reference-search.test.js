import { describe, expect, it } from 'vitest';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { searchReference } from '../src/reference-search.js';

const data = readClinicalReference();
const ids = (records, query, setting = 'all') => searchReference(records, query, setting).map(record => record.id);

describe('evidence retrieval aliases', () => {
  it.each([
    ['CHANCE2', 'chance-2'], ['CHANCE 2', 'chance-2'], ['CHANCE-2', 'chance-2'],
    ['DEFUSE3', 'defuse-3'], ['DEFUSE 3', 'defuse-3'], ['DEFUSE-3', 'defuse-3'],
    ['SELECT 2', 'select2'], ['SELECT2', 'select2'], ['SELECT-2', 'select2'],
  ])('finds and prioritizes the exact known identifier %s', (query, id) => {
    const matches = ids(data.studies, query);
    expect(matches[0]).toBe(id);
    expect(matches).toEqual(ids(data.studies, id));
    expect(matches).not.toContain('close');
  });
  it('combines numbered study aliases with clinical terms and care-setting filters', () => {
    expect(ids(data.studies, 'DAPT CHANCE2', 'clinic')).toEqual(['chance-2']);
    expect(ids(data.studies, 'DAPT CHANCE2', 'on-call')).toEqual([]);
    expect(ids(data.studies, 'perfusion DEFUSE3')).toEqual(['defuse-3']);
    expect(ids(data.studies, 'SELECT 20')).not.toContain('select2');
    expect(ids(data.studies, 'CHANCE20')).not.toContain('chance-2');
    expect(ids(data.studies, 'DEFUZE3')).toEqual([]);
  });
  it('expands AFib as a whole-word alias across topic and study searches', () => {
    for (const records of [data.topics, data.studies]) {
      expect(ids(records, 'AFib')).toEqual(ids(records, 'atrial fibrillation'));
      expect(ids(records, 'AFib anticoagulation')).toEqual(ids(records, 'atrial fibrillation anticoagulation'));
      expect(ids(records, 'afibbed')).toEqual([]);
    }
    expect(ids(data.topics, 'AFib')).toContain('af-prevention');
    expect(ids(data.studies, 'AFib')).toContain('elan');
  });
  it('keeps general clinical word/number searches separate rather than fusing them into identifiers', () => {
    const records = [{ id: 'example', title: 'DAPT review', keywords: [], settings: ['hospital'], sources: [], summary: 'Review the duration of 21 days.' }];
    expect(ids(records, 'DAPT 21 days')).toEqual(['example']);
    expect(ids(data.studies, 'POINT')[0]).toBe('point');
    expect(ids(data.studies, 'POINT').length).toBeGreaterThan(1);
  });
});
