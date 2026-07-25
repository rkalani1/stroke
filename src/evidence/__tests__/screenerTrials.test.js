import { describe, it, expect } from 'vitest';
import defaultTrials, { CTGOV_FIRST_PASS_NOTE, screenerTrials } from '../screenerTrials.js';

describe('screenerTrials', () => {
  it('exports CTGOV_FIRST_PASS_NOTE correctly', () => {
    expect(CTGOV_FIRST_PASS_NOTE).toBe('First-pass ClinicalTrials.gov summary: not all registry criteria, protocol details, local activation requirements, or consent rules are encoded in this public demo.');
  });

  it('exports screenerTrials array', () => {
    expect(Array.isArray(screenerTrials)).toBe(true);
    expect(screenerTrials.length).toBeGreaterThan(0);
  });

  it('exports default as screenerTrials', () => {
    expect(defaultTrials).toBe(screenerTrials);
  });

  it('ensures all trials are institution-clean (noContactInfo is true)', () => {
    screenerTrials.forEach((trial) => {
      expect(trial.noContactInfo).toBe(true);
    });
  });

  it('ensures placeholder trials have correct sourceCompletenessStatus', () => {
    const placeholders = screenerTrials.filter((t) => t.status === 'placeholder');
    expect(placeholders.length).toBeGreaterThan(0); // ESUS, MOCHA etc.
    placeholders.forEach((trial) => {
      expect(trial.sourceCompletenessStatus).toBe('not_registry_verified');
    });
  });
});
