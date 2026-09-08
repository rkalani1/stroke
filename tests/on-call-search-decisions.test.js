import { describe, it, expect } from 'vitest';
import { matchesSearchText, scoreSearchMatch } from '../src/search-match.js';
import { treatmentDecisionStatus } from '../src/encounter-decision-status.js';

describe('on-call search relevance', () => {
  it('does not promote irrelevant results even with priority boosts', () => {
    expect(scoreSearchMatch('DAWN', ['Danish Hormonal Contraception Cohort'], 50)).toBe(0);
    expect(scoreSearchMatch('zzzxqv', ['Stroke evidence and calculator'], 100)).toBe(0);
    expect(scoreSearchMatch('blood pressure', ['Blood glucose management'])).toBe(0);
  });
  it('matches all terms across fields and normalizes score typography', () => {
    expect(matchesSearchText('has-bled', ['HAS-BLED Score'])).toBe(true);
    expect(matchesSearchText('abcd2', ['ABCD² Score'])).toBe(true);
    expect(matchesSearchText('tenecteplase 2026', ['Tenecteplase', 'AIS 2026'])).toBe(true);
  });
  it('puts exact names above incidental mentions', () => {
    expect(scoreSearchMatch('DAWN', ['DAWN'])).toBeGreaterThan(scoreSearchMatch('DAWN', ['Evidence from DAWN and DEFUSE-3']));
  });
});

describe('documented treatment decisions', () => {
  it('does not fabricate a negative decision from default or legacy false values', () => {
    expect(treatmentDecisionStatus({}, 'tnk')).toBe('Decision not documented');
    expect(treatmentDecisionStatus({ evtRecommended: false }, 'evt')).toBe('Decision not documented');
  });
  it('distinguishes explicit negative and positive decisions', () => {
    expect(treatmentDecisionStatus({ tnkRecommended: false, tnkDecisionRecorded: true }, 'tnk')).toBe('Not recommended');
    expect(treatmentDecisionStatus({ evtRecommended: true }, 'evt')).toBe('Recommended');
  });
  it('preserves hemorrhage and recorded contraindication context', () => {
    expect(treatmentDecisionStatus({ diagnosisCategory: 'ich', tnkRecommended: true }, 'tnk')).toBe('N/A (ICH)');
    expect(treatmentDecisionStatus({ tnkAutoBlocked: true, tnkRecommended: true }, 'tnk')).toContain('recorded contraindication');
  });
});
