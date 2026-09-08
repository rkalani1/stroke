import { describe, it, expect } from 'vitest';
import {
  activeTrials,
  getActiveTrial,
  getActiveTrialByLegacyKey,
  getAllActiveTrialIds
} from '../activeTrials.js';

describe('activeTrials module', () => {
  describe('activeTrials data list', () => {
    it('exports a non-empty array of active trials', () => {
      expect(Array.isArray(activeTrials)).toBe(true);
      expect(activeTrials.length).toBeGreaterThan(0);
    });

    it('contains valid trial objects with required properties', () => {
      activeTrials.forEach((trial) => {
        expect(trial).toHaveProperty('id');
        expect(typeof trial.id).toBe('string');
        expect(trial.id.length).toBeGreaterThan(0);

        expect(trial).toHaveProperty('shortName');
        expect(trial).toHaveProperty('fullName');
        expect(trial).toHaveProperty('legacyMatcherKey');
      });
    });
  });

  describe('getActiveTrial', () => {
    it('returns the trial record when given a valid trial ID', () => {
      const trial = getActiveTrial('step-evt');
      expect(trial).not.toBeNull();
      expect(trial.id).toBe('step-evt');
      expect(trial.shortName).toBe('STEP-EVT');

      const aspire = getActiveTrial('aspire');
      expect(aspire).not.toBeNull();
      expect(aspire.id).toBe('aspire');
      expect(aspire.shortName).toBe('ASPIRE');
    });

    it('returns null when given an unknown trial ID', () => {
      expect(getActiveTrial('non-existent-trial-id')).toBeNull();
      expect(getActiveTrial('unknown')).toBeNull();
    });

    it('returns null when given invalid or missing ID inputs', () => {
      expect(getActiveTrial('')).toBeNull();
      expect(getActiveTrial(null)).toBeNull();
      expect(getActiveTrial(undefined)).toBeNull();
      expect(getActiveTrial(123)).toBeNull();
    });
  });

  describe('getActiveTrialByLegacyKey', () => {
    it('returns the trial record when given a valid legacy matcher key', () => {
      const step = getActiveTrialByLegacyKey('STEP');
      expect(step).not.toBeNull();
      expect(step.id).toBe('step-evt');
      expect(step.legacyMatcherKey).toBe('STEP');

      const aspire = getActiveTrialByLegacyKey('ASPIRE');
      expect(aspire).not.toBeNull();
      expect(aspire.id).toBe('aspire');
      expect(aspire.legacyMatcherKey).toBe('ASPIRE');
    });

    it('returns null when given an unknown legacy matcher key', () => {
      expect(getActiveTrialByLegacyKey('NON_EXISTENT_KEY')).toBeNull();
      expect(getActiveTrialByLegacyKey('INVALID')).toBeNull();
    });

    it('returns null when given invalid or missing legacy key inputs', () => {
      expect(getActiveTrialByLegacyKey('')).toBeNull();
      expect(getActiveTrialByLegacyKey(null)).toBeNull();
      expect(getActiveTrialByLegacyKey(undefined)).toBeNull();
      expect(getActiveTrialByLegacyKey(456)).toBeNull();
    });

    it('consistently maps legacy key to the trial retrieved by getActiveTrial', () => {
      activeTrials.forEach((trial) => {
        if (trial.legacyMatcherKey) {
          const byKey = getActiveTrialByLegacyKey(trial.legacyMatcherKey);
          const byId = getActiveTrial(trial.id);
          expect(byKey).toBe(byId);
        }
      });
    });
  });

  describe('getAllActiveTrialIds', () => {
    it('returns a Set containing all active trial IDs', () => {
      const ids = getAllActiveTrialIds();
      expect(ids).toBeInstanceOf(Set);
      expect(ids.size).toBe(activeTrials.length);

      activeTrials.forEach((trial) => {
        expect(ids.has(trial.id)).toBe(true);
      });
    });

    it('contains expected well-known trial IDs', () => {
      const ids = getAllActiveTrialIds();
      expect(ids.has('step-evt')).toBe(true);
      expect(ids.has('picasso')).toBe(true);
      expect(ids.has('tested')).toBe(true);
      expect(ids.has('saturn')).toBe(true);
      expect(ids.has('aspire')).toBe(true);
    });
  });
});
