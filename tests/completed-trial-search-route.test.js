import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { completedTrials, filterCompletedTrials } from '../src/evidence/index.js';
import { getSearchIndex } from '../src/content-context.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const navigateToCompletedTrial = (entry) => {');
const indent = source.slice(source.lastIndexOf('\n', start) + 1, start);
const end = source.indexOf(`\n${indent}};`, start);
const functionSource = source.slice(start, end + indent.length + 4);

function navigate(entry) {
  let filters;
  const focus = vi.fn();
  const section = { open: false, scrollIntoView: vi.fn(), querySelector: () => ({ focus }) };
  const navigateTo = vi.fn();
  const setAtlasExpandAll = vi.fn();
  const context = {
    entry, evidenceCompletedTrials: completedTrials,
    setAtlasFilters: (value) => { filters = value; }, setAtlasExpandAll, navigateTo,
    setTimeout: (callback) => callback(), document: { getElementById: () => section }
  };
  new Function(...Object.keys(context), functionSource + '\nnavigateToCompletedTrial(entry);')(...Object.values(context));
  return { filters, navigateTo, section, focus, setAtlasExpandAll };
}

describe('completed-study search destination', () => {
  it('opens the completed VNS-REHAB evidence card instead of the recruitment screener', () => {
    const entry = getSearchIndex().find((item) => item.domain === 'trial' && item.id === 'vns-rehab');
    expect(entry).toBeDefined();
    const result = navigate(entry);
    expect(result.navigateTo).toHaveBeenCalledWith('research', { clearSearch: true, subTab: 'references' });
    expect(result.filters).toEqual({ topic: '', certainty: '', evidenceType: '', verificationStatus: '', query: 'VNS-REHAB' });
    expect(filterCompletedTrials(result.filters).map((trial) => trial.id)).toContain('vns-rehab');
    expect(result.section.open).toBe(true);
    expect(result.setAtlasExpandAll).toHaveBeenCalledWith(true);
    expect(result.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it('uses an atlas-searchable name for every projected completed-study search result', () => {
    const entries = getSearchIndex().filter((entry) => entry.domain === 'trial');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const { filters } = navigate(entry);
      expect(filterCompletedTrials(filters).map((trial) => trial.id), entry.id).toContain(entry.id);
    }
  });
});
