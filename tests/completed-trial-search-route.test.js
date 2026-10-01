import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { completedTrials, filterCompletedTrials } from '../src/evidence/index.js';
import { getBrowserSearchIndex as getSearchIndex } from '../src/content-search-index.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const navigateToCompletedTrial = async (entry) => {');
if (start < 0) throw Error('Completed-trial navigation function missing');
const indent = source.slice(source.lastIndexOf('\n', start) + 1, start);
const end = source.indexOf(`\n${indent}};`, start);
const functionSource = source.slice(start, end + indent.length + 4);

function startNavigation(entry, loadReferenceData = vi.fn().mockResolvedValue(undefined)) {
  let filters;
  const focus = vi.fn();
  const section = { open: false, scrollIntoView: vi.fn(), querySelector: () => ({ focus }) };
  const navigateTo = vi.fn();
  const setAtlasExpandAll = vi.fn();
  const addToast = vi.fn();
  const window = { location: { hash: '#/encounter' } };
  const context = {
    entry, evidenceCompletedTrials: completedTrials,
    setAtlasFilters: (value) => { filters = value; }, setAtlasExpandAll, navigateTo,
    setTimeout: (callback) => callback(), document: { getElementById: () => section },
    window, loadReferenceData, addToast
  };
  const finished = new Function(...Object.keys(context), functionSource + '\nreturn navigateToCompletedTrial(entry);')(...Object.values(context));
  return { get filters() { return filters; }, navigateTo, section, focus, setAtlasExpandAll, finished, window, addToast, loadReferenceData };
}

async function navigate(entry) {
  const result = startNavigation(entry);
  await result.finished;
  return result;
}

describe('completed-study search destination', () => {
  it('opens the completed VNS-REHAB evidence card instead of the recruitment screener', async () => {
    const entry = getSearchIndex().find((item) => item.domain === 'trial' && item.id === 'vns-rehab');
    expect(entry).toBeDefined();
    const result = await navigate(entry);
    expect(result.navigateTo).toHaveBeenCalledWith('research', { clearSearch: true, subTab: 'references' });
    expect(result.filters).toEqual({ topic: '', certainty: '', evidenceType: '', verificationStatus: '', query: 'VNS-REHAB' });
    expect(filterCompletedTrials(result.filters).map((trial) => trial.id)).toContain('vns-rehab');
    expect(result.section.open).toBe(true);
    expect(result.setAtlasExpandAll).toHaveBeenCalledWith(true);
    expect(result.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it('uses an atlas-searchable name for every projected completed-study search result', async () => {
    const entries = getSearchIndex().filter((entry) => entry.domain === 'trial');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const { filters } = await navigate(entry);
      expect(filterCompletedTrials(filters).map((trial) => trial.id), entry.id).toContain(entry.id);
    }
  });

  it('opens the loading destination immediately but waits for records before filtering and focusing', async () => {
    let finish;
    const result = startNavigation({ id: 'vns-rehab' }, () => new Promise(resolve => { finish = resolve; }));
    expect(result.navigateTo).toHaveBeenCalledTimes(1);
    expect(result.window.location.hash).toBe('#/research/references');
    expect(result.filters).toBeUndefined();
    expect(result.focus).not.toHaveBeenCalled();
    finish();
    await result.finished;
    expect(result.filters.query).toBe('VNS-REHAB');
    expect(result.focus).toHaveBeenCalledOnce();
  });

  it.each(['success', 'failure'])('does not override newer navigation after a delayed load %s', async outcome => {
    let finish, fail;
    const result = startNavigation({ id: 'vns-rehab' }, () => new Promise((resolve, reject) => { finish = resolve; fail = reject; }));
    result.window.location.hash = '#/trials/screener';
    if (outcome === 'success') finish(); else fail(Error('offline'));
    await result.finished;
    expect(result.navigateTo).toHaveBeenCalledTimes(1);
    expect(result.filters).toBeUndefined();
    expect(result.focus).not.toHaveBeenCalled();
    expect(result.addToast).not.toHaveBeenCalled();
  });

  it('exposes reference recovery after load failure without opening a fabricated result', async () => {
    const result = startNavigation({ id: 'vns-rehab' }, () => Promise.reject(Error('offline')));
    await result.finished;
    expect(result.filters).toBeUndefined();
    expect(result.section.open).toBe(false);
    expect(result.addToast).toHaveBeenCalledWith(expect.stringContaining('Open in new tab'), 'error');
    expect(result.navigateTo).toHaveBeenLastCalledWith('research', { clearSearch: true, subTab: 'references' });
  });
});
