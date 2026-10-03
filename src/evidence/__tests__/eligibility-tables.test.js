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
import { screenerTrials } from '../screenerTrials.js';

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
      'ischemic-acute': 3,
      'ischemic-inpatient': 5,
      'ischemic-outpatient': 4,
      'ich-acute': 3,
      'ich-inpatient': 3,
      'ich-outpatient': 2
    });
  });

  it('every trial has a non-empty acronym, summary, eligibility, and exclusions', () => {
    for (const table of eligibilityTables) {
      for (const t of table.trials) {
        expect(t.acronym, `${table.id}`).toBeTruthy();
        expect(t.summary, `${table.id}/${t.acronym}`).toBeTruthy();
        expect(Array.isArray(t.eligibility) && t.eligibility.length > 0).toBe(true);
        expect(Array.isArray(t.exclusions) && t.exclusions.length > 0).toBe(true);
        expect(['enrolling', 'soon']).toContain(t.status);
      }
    }
  });

  it('projects every shared profile using its complete canonical criteria and original registry-check date', () => {
    for (const table of eligibilityTables) for (const reference of table.trials) {
      const source = screenerTrials.find(trial => trial.acronym === reference.acronym);
      expect(source, reference.acronym).toBeTruthy();
      expect(reference.eligibility).toBe(source.exactInclusionCriteria);
      expect(reference.exclusions).toBe(source.exactExclusionCriteria);
      expect(reference.nct).toBe(source.externalMetadata.nct || '');
      expect(reference.sourceDate).toBe(source.externalMetadata.verificationDate || null);
      expect(reference.sourceGaps).toBe(source.sourceGaps);
      expect(reference.phase).toBe(source.externalMetadata.phase);
      expect(reference.referenceOnly).toBe(Boolean(source.referenceOnly));
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

describe('eligibilityTables — recruitment status (2026-10-03 registry audit)', () => {
  const allTrials = eligibilityTables.flatMap((t) => t.trials);
  const acronyms = new Set(allTrials.map(t => t.acronym));

  it('omits not-enrolling profiles and removed placeholders from the phase tables', () => {
    for (const acronym of ['CAPPRICORN-1', 'CAPTIVA', 'ESUS-MRI', 'ESUS', 'MOCHA']) expect(acronyms.has(acronym), acronym).toBe(false);
  });

  it('adds the verified StrokeNet profiles and keeps PICASSO as a flagged criteria reference', () => {
    expect(eligibilityTables.find(t => t.id === 'ich-acute').trials.map(t => t.acronym)).toContain('FASTEST-2');
    expect(eligibilityTables.find(t => t.id === 'ischemic-acute').trials.map(t => t.acronym)).toEqual(['STEP', 'SISTER', 'PICASSO']);
    expect(allTrials.filter(t => t.referenceOnly).map(t => t.acronym)).toEqual(['PICASSO']);
    expect(allTrials.some(t => t.unverified)).toBe(false);
  });
});

describe('eligibilityTables — institution-clean labels', () => {
  it('exposes category, phase labels and a compliance note', () => {
    expect(CATEGORY_LABELS.ischemic).toBeTruthy();
    expect(CATEGORY_LABELS.ich).toBeTruthy();
    expect(PHASE_LABELS.acute).toBeTruthy();
    expect(PHASE_LABELS.inpatient).toBeTruthy();
    expect(PHASE_LABELS.outpatient).toBeTruthy();
    expect(ELIGIBILITY_COMPLIANCE_NOTE).toContain('dated first-pass ClinicalTrials.gov checks');
    expect(ELIGIBILITY_COMPLIANCE_NOTE).not.toMatch(/synthetic|public demo|PHI/i);
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
