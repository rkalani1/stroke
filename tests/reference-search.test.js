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

  it('maps common drug and procedure abbreviations to the terms the cards use', () => {
    for (const query of ['tPA', 't-PA', 'rt-PA', 'rtPA']) {
      const matches = ids(data.studies, query);
      expect(matches).toEqual(expect.arrayContaining(['ninds-tpa', 'ecass-3', 'extend', 'wake-up']));
      expect(matches).toEqual(ids(data.studies, 'alteplase'));
    }
    expect(ids(data.topics, 'TNK')).toEqual(expect.arrayContaining(['thrombolytic-choice', 'acute-reperfusion']));
    expect(ids(data.topics, 'TNKase')).toEqual(ids(data.topics, 'tenecteplase'));
    expect(ids(data.topics, 'DOAC')).toEqual(expect.arrayContaining(['af-timing', 'antithrombotic-reversal', 'cvt']));
    expect(ids(data.topics, 'NOAC')).toEqual(ids(data.topics, 'DOAC'));
    expect(ids(data.topics, 'LVO')).toEqual(ids(data.topics, 'large vessel occlusion'));
    expect(ids(data.topics, 'MeVO')).toContain('medium-distal-evt');
    expect(ids(data.topics, 'EVT')).toEqual(ids(data.topics, 'thrombectomy'));
    expect(ids(data.topics, 'MT')).toEqual(ids(data.topics, 'thrombectomy'));
    expect(ids(data.topics, 'IVT')).toEqual(ids(data.topics, 'thrombolysis'));
    // Abbreviations kept as written still match themselves.
    for (const query of ['ICH', 'SAH', 'CVT', 'PFO']) expect(ids(data.topics, query).length).toBeGreaterThan(0);
    // Whole words only: "tpas" or "mtici" are not rewritten.
    expect(ids(data.topics, 'tpas')).toEqual([]);
    expect(ids(data.topics, 'mTICI').length).toBeGreaterThan(0);
  });
});
