import { describe, it, expect } from 'vitest';
import { weightInKg, displayWeight, nihssKeyboardOption } from '../src/encounter-inputs.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { newEncounter, outputWarnings, buildSummary } from '../src/workspace-state.js';
describe('restored input conveniences', () => {
  it('keeps canonical kilograms separate from the selected display unit', () => {
    expect(weightInKg('220.46226218', 'lb')).toBeDefined();
    expect(Number(weightInKg('220.46226218', 'lb'))).toBeCloseTo(100, 7);
    expect(displayWeight('100', 'lb')).toBe('220.46');
    expect(displayWeight('100', 'kg')).toBe('100');
    expect(weightInKg('', 'lb')).toBe('');
    expect(weightInKg('0', 'lb')).toBe('0');
    expect(weightInKg('invalid', 'kg')).toBe('');
  });
  it('does not let binary conversion tails block otherwise valid note generation', () => {
    const state = newEncounter();
    state.note.weight = weightInKg('220.462262', 'lb');
    expect(state.note.weight).toBe('100');
    expect(outputWarnings(state)).toEqual([]);
    expect(buildSummary(state)).toContain('Wt: 100kg');
    expect(weightInKg('83', 'lb')).toBe('37.648167');
  });
  it('only maps valid item scores and supported untestable options', () => {
    expect(nihssKeyboardOption(NIHSS_ITEMS[0], '0')).toBe(NIHSS_ITEMS[0].options[0]);
    expect(nihssKeyboardOption(NIHSS_ITEMS[0], '4')).toBeUndefined();
    expect(nihssKeyboardOption(NIHSS_ITEMS[0], 'Tab')).toBeUndefined();
    expect(nihssKeyboardOption(NIHSS_ITEMS.find(item => item.id === 'dysarthria'), 'U')).toContain('(UN)');
  });
});
