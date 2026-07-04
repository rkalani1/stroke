// src/evidence/__tests__/eligibility-tables.test.js
//
// Unit specs for the native Eligibility Tables reference data layer. Run with
// `npm run test:unit`. Pure data assertions — no DOM, no React.

import { describe, it, expect } from 'vitest';
import {
  eligibilityTables,
  CATEGORY_LABELS,
  PHASE_LABELS,
  ELIGIBILITY_COMPLIANCE_NOTE
} from '../eligibilityTables.js';

const sentinel = (...parts) => parts.join('_');

describe('eligibilityTables — structure & integrity', () => {
  it('exposes exactly 6 phase-grouped tables', () => {
    expect(eligibilityTables.length).toBe(6);
  });

  it('covers both categories across all three phases', () => {
    const combos = eligibilityTables.map((t) => `${t.category}:${t.phase}`).sort();
    expect(combos).toEqual(
      [
        'ich:acute',
        'ich:inpatient',
        'ich:outpatient',
        'ischemic:acute',
        'ischemic:inpatient',
        'ischemic:outpatient'
      ].sort()
    );
  });

  it('has the expected trial count per table', () => {
    const counts = Object.fromEntries(eligibilityTables.map((t) => [`${t.category}-${t.phase}`, t.trials.length]));
    expect(counts).toEqual({
      'ischemic-acute': 2,
      'ischemic-inpatient': 7,
      'ischemic-outpatient': 6,
      'ich-acute': 2,
      'ich-inpatient': 3,
      'ich-outpatient': 3
    });
  });

  it('every trial has a non-empty acronym, summary, eligibility, and exclusions', () => {
    for (const table of eligibilityTables) {
      for (const t of table.trials) {
        expect(t.acronym, `${table.id}`).toBeTruthy();
        expect(t.summary, `${table.id}/${t.acronym}`).toBeTruthy();
        expect(Array.isArray(t.eligibility) && t.eligibility.length > 0).toBe(true);
        expect(Array.isArray(t.exclusions) && t.exclusions.length > 0).toBe(true);
        expect(['enrolling', 'soon', 'unverified']).toContain(t.status);
      }
    }
  });

  it('verified trials carry a valid NCT id; unverified carry none', () => {
    for (const table of eligibilityTables) {
      for (const t of table.trials) {
        if (t.unverified) {
          expect(t.nct).toBe('');
          expect(t.href).toBe('');
        } else {
          expect(t.nct).toMatch(/^NCT\d{8}$/);
          expect(t.href).toContain(t.nct);
        }
      }
    }
  });
});

describe('eligibilityTables — unverified flags (ESUS-MRI / MOCHA)', () => {
  const allTrials = eligibilityTables.flatMap((t) => t.trials);

  it('ESUS-MRI is flagged unverified everywhere it appears', () => {
    const esus = allTrials.filter((t) => t.acronym === 'ESUS-MRI');
    expect(esus.length).toBeGreaterThan(0);
    for (const t of esus) {
      expect(t.unverified).toBe(true);
      expect(t.status).toBe('unverified');
    }
  });

  it('MOCHA is flagged unverified everywhere it appears', () => {
    const mocha = allTrials.filter((t) => t.acronym === 'MOCHA');
    expect(mocha.length).toBeGreaterThan(0);
    for (const t of mocha) {
      expect(t.unverified).toBe(true);
      expect(t.status).toBe('unverified');
    }
  });

  it('only ESUS-MRI and MOCHA are unverified', () => {
    const unverifiedAcronyms = [...new Set(allTrials.filter((t) => t.unverified).map((t) => t.acronym))].sort();
    expect(unverifiedAcronyms).toEqual(['ESUS-MRI', 'MOCHA']);
  });
});

describe('eligibilityTables — institution-clean labels', () => {
  it('exposes category, phase labels and a compliance note', () => {
    expect(CATEGORY_LABELS.ischemic).toBeTruthy();
    expect(CATEGORY_LABELS.ich).toBeTruthy();
    expect(PHASE_LABELS.acute).toBeTruthy();
    expect(PHASE_LABELS.inpatient).toBeTruthy();
    expect(PHASE_LABELS.outpatient).toBeTruthy();
    expect(ELIGIBILITY_COMPLIANCE_NOTE).toContain('Synthetic public demo');
  });

  it('carries no institutional identifiers or protected brand hexes in the data', () => {
    const blob = JSON.stringify(eligibilityTables) + ELIGIBILITY_COMPLIANCE_NOTE;
    expect(blob).not.toMatch(/4b2e83/i);
    expect(blob).not.toMatch(/85754d/i);
    const institutionalOrIdentity = new RegExp([
      sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL')
    ].join('|'), 'i');
    expect(blob).not.toMatch(institutionalOrIdentity);
  });
});
