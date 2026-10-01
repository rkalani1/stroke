import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { calculatorAnchorFor, createNavigationIntents } from '../src/navigation-intent.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const inputLabel = source.indexOf('aria-label="Search trials, management tools, and references"');
const input = source.slice(source.lastIndexOf('<input', inputLabel), source.indexOf('/>', inputLabel));
function handler(name, context) {
  const start = input.indexOf(`${name}={`);
  const end = input.indexOf('\n                        }}', start);
  if (start < 0 || end < 0) throw Error(`Search ${name} handler missing`);
  const code = input.slice(start + name.length + 2, end) + '\n}';
  return new Function(...Object.keys(context), `return ${code};`)(...Object.values(context));
}

describe('header search intent', () => {
  const setters = () => Object.fromEntries(['setSearchQuery', 'setSearchResults', 'setSearchActiveIndex', 'setSearchResultsQuery', 'setSearchOpen', 'setSearchContext'].map(key => [key, vi.fn()]));

  it('invalidates previous results and keyboard selection as soon as input changes', () => {
    const context = setters();
    handler('onChange', context)({ target: { value: 'age 73' } });
    expect(context.setSearchQuery).toHaveBeenCalledWith('age 73');
    expect(context.setSearchResults).toHaveBeenCalledWith([]);
    expect(context.setSearchActiveIndex).toHaveBeenCalledWith(-1);
    expect(context.setSearchResultsQuery).toHaveBeenCalledWith('');
  });

  it('refuses Enter on a result published for a previous query', () => {
    const action = vi.fn();
    const context = { ...setters(), searchOpen: true, searchQuery: 'age 73', searchResultsQuery: 'age 72', searchActiveIndex: 0, searchResults: [{ action }] };
    handler('onKeyDown', context)({ key: 'Enter', preventDefault: vi.fn() });
    expect(action).not.toHaveBeenCalled();
    expect(context.setSearchQuery).not.toHaveBeenCalled();
  });

  it('executes a current-query result and then clears the submitted search', () => {
    const action = vi.fn();
    const context = { ...setters(), searchOpen: true, searchQuery: 'age 73', searchResultsQuery: 'age 73', searchActiveIndex: 0, searchResults: [{ action }] };
    handler('onKeyDown', context)({ key: 'Enter', preventDefault: vi.fn() });
    expect(action).toHaveBeenCalledOnce();
    expect(context.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('refuses a stale pointer result even if its previous callback is delivered', () => {
    const start = source.indexOf('onClick={() => { if (searchResultsQuery !== searchQuery) return; result.action();');
    if (start < 0) throw Error('Search pointer guard missing');
    const end = source.indexOf(' }}', start);
    const body = source.slice(start + 'onClick={() => {'.length, end);
    const action = vi.fn();
    const invoke = new Function('searchResultsQuery', 'searchQuery', 'result', 'setSearchOpen', 'setSearchQuery', body);
    invoke('age 72', 'age 73', { action }, vi.fn(), vi.fn());
    expect(action).not.toHaveBeenCalled();
  });
});

describe('explicit sub-view navigation', () => {
  it('cancels pending actions when either Research strip clicks its already-current subtab', () => {
    const matches = [...source.matchAll(/onClick=\{\(\) => \{\n\s+navigationIntents\.cancel\(\);\n\s+setResearchSubTab\(tab.id\);\n\s+window.location.hash = `#\/research\/\$\{tab.id\}`;\n\s+\}\}/g)];
    expect(matches).toHaveLength(2);
    for (const [handler] of matches) {
      const navigationIntents = createNavigationIntents();
      const token = navigationIntents.begin();
      const window = { location: { hash: '#/research/references' } };
      const run = new Function('navigationIntents', 'setResearchSubTab', 'tab', 'window', `return ${handler.slice('onClick={'.length, -1)};`)(navigationIntents, vi.fn(), { id: 'references' }, window);
      run();
      expect(window.location.hash).toBe('#/research/references');
      expect(navigationIntents.isCurrent(token)).toBe(false);
    }
  });

  it('cancels pending actions for same-route End navigation from both Research keyboard strips', () => {
    const marker = 'aria-label="Guidelines & References sub-sections" onKeyDown={';
    const parts = source.split(marker).slice(1);
    expect(parts).toHaveLength(2);
    for (const part of parts) {
      const end = part.indexOf('\n                    }}>');
      expect(end).toBeGreaterThan(0);
      const navigationIntents = createNavigationIntents();
      const token = navigationIntents.begin();
      const window = { location: { hash: '#/research/education' } };
      const context = { navigationIntents, RESEARCH_SUBTABS: ['guidelines', 'references', 'calculators', 'education'], researchSubTab: 'education', setResearchSubTab: vi.fn(), window, document: { getElementById: () => ({ focus: vi.fn() }) } };
      const run = new Function(...Object.keys(context), `return ${part.slice(0, end)}\n};`)(...Object.values(context));
      run({ key: 'End', preventDefault: vi.fn() });
      expect(window.location.hash).toBe('#/research/education');
      expect(navigationIntents.isCurrent(token)).toBe(false);
    }
  });
});

describe('canonical calculator search actions', () => {
  it('reveals all 15 supported cards, routes TNK to Encounter, and omits only 18 missing panels from browser results', () => {
    const entries = JSON.parse(fs.readFileSync(new URL('../content/search-index.json', import.meta.url), 'utf8')).filter(entry => entry.domain === 'calculator');
    const start = source.indexOf('            const CONTENT_TYPE_LABELS =');
    const end = source.indexOf('\n            GUIDELINE_LIBRARY_INDEX.forEach', start);
    if (start < 0 || end < 0) throw Error('Canonical browser search assembly missing');
    const gotoCalculator = vi.fn();
    const openEncounterAtField = vi.fn();
    const context = {
      results: [], scoreFor: () => 1, getContentSearchIndex: () => entries,
      calculatorAnchorFor, gotoCalculator, openEncounterAtField,
      navigateTo: vi.fn(), navigateToCompletedTrial: vi.fn(), REFERENCE_DOC_BY_ID: new Map(), setEvidenceFilter: vi.fn()
    };
    new Function(...Object.keys(context), source.slice(start, end))(...Object.values(context));
    expect(entries).toHaveLength(34);
    expect(context.results).toHaveLength(16);
    const tnk = context.results.find(result => result.title === 'TNK dose in Encounter');
    expect(tnk.type).toBe('Encounter');
    tnk.action();
    expect(openEncounterAtField).toHaveBeenCalledWith('Weight');
    const calculators = context.results.filter(result => result.type === 'Calculator');
    expect(calculators).toHaveLength(15);
    calculators.forEach(result => result.action());
    expect(gotoCalculator).toHaveBeenCalledTimes(15);
    expect(gotoCalculator.mock.calls.every(([anchor]) => typeof anchor === 'string' && source.includes(`<details id="${anchor}"`))).toBe(true);
    for (const omitted of entries.filter(entry => !calculatorAnchorFor(entry.id) && entry.id !== 'tnk-dose')) {
      expect(context.results.some(result => result.title === omitted.title), omitted.id).toBe(false);
    }
  });
});
