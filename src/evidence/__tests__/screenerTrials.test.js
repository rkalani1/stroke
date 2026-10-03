import { describe, it, expect } from 'vitest';
import defaultTrials, { CTGOV_FIRST_PASS_NOTE, screenerTrials } from '../screenerTrials.js';

describe('screenerTrials', () => {
  it('exports CTGOV_FIRST_PASS_NOTE correctly', () => {
    expect(CTGOV_FIRST_PASS_NOTE).toBe('First-pass ClinicalTrials.gov summary: not all registry criteria, protocol details, local activation requirements, or consent rules are encoded in this screening summary.');
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

  it('carries no placeholder profiles; any future placeholder must be flagged unverified', () => {
    const placeholders = screenerTrials.filter((t) => t.status === 'placeholder');
    expect(placeholders).toEqual([]);
    placeholders.forEach((trial) => {
      expect(trial.sourceCompletenessStatus).toBe('not_registry_verified');
    });
  });
});
