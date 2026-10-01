import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { TrialSourceContext } from '../src/components/TrialScreener.jsx';
import GuidelineProvenance from '../src/components/GuidelineProvenance.jsx';
import { evaluateAll, createInitialScreenerState } from '../src/evidence/screener-eval.js';

const trial = (status = 'enrolling') => ({
  acronym: 'SYNTHETIC', status, timeCategory: 'acute_subacute',
  externalMetadata: { nct: 'NCT-EXAMPLE', registryStatus: status === 'soon' ? 'NOT_YET_RECRUITING' : 'RECRUITING', verificationDate: '2026-09-30', registryLastUpdatePosted: '2026-08-01' },
  pathway: 'Confirm with study team',
  eligibility: { criteria: [{ field: 'onsetDays', operator: 'between', value: [7, 30], error: 'Outside study window' }], exclusions: [] }
});

describe('trial result uncertainty', () => {
  it('distinguishes before-window timing from registry recruitment in cards and referral data', () => {
    const state = { ...createInitialScreenerState(), classification: 'ischemic', onsetVal: 2, onsetUnit: 'days' };
    const before = evaluateAll(state, [trial()]);
    expect(before.soon[0]).toMatchObject({ beforeWindow: true, notYetEnrolling: false });
    expect(before.briefingNote).toContain('BEFORE STUDY WINDOW');
    expect(before.briefingNote).not.toContain('NOT YET ENROLLING');
    expect(before.briefingNote).toContain('recorded check: 2026-09-30; local activation: not confirmed');
    const inactive = evaluateAll({ ...state, onsetVal: 10 }, [trial('soon')]);
    expect(inactive.soon[0]).toMatchObject({ beforeWindow: false, notYetEnrolling: true });
    expect(inactive.briefingNote).toContain('NOT YET ENROLLING');
    expect(inactive.briefingNote).not.toContain('BEFORE STUDY WINDOW');
  });

  it('retains both uncertainties and never calls an early not-yet-recruiting study eligible', () => {
    const result = evaluateAll({ ...createInitialScreenerState(), classification: 'ischemic', onsetVal: 2, onsetUnit: 'days' }, [trial('soon')]);
    expect(result.soon[0]).toMatchObject({ beforeWindow: true, notYetEnrolling: true });
    expect(result.eligible).toHaveLength(0);
    expect(result.briefingNote).toContain('before the modeled study window');
  });
  it('keeps an overlapping coarse onset range uncertain instead of calling it before-window', () => {
    const result = evaluateAll({ ...createInitialScreenerState(), classification: 'ischemic', onsetVal: 2, onsetUnit: 'days', onsetRangeHours: [0, 336] }, [trial()]);
    expect(result.soon).toHaveLength(0);
    expect(result.pending[0].beforeWindow).toBe(false);
    expect(result.pending[0].pendingFields).toContain('onsetDays');
  });

  it('carries recorded registry dates beside local activation uncertainty', () => {
    const html = renderToStaticMarkup(<TrialSourceContext trial={trial()} />);
    expect(html).toContain('2026-09-30');
    expect(html).toContain('2026-08-01');
    expect(html).toContain('Local activation:');
    expect(html).toContain('not confirmed here');
    expect(html).toContain('does not establish complete eligibility');
    const missing = renderToStaticMarkup(<TrialSourceContext trial={{ acronym: 'UNVERIFIED' }} />);
    expect(missing).toContain('Not recorded');
    expect(missing).toContain('Not verified');
    expect(missing).not.toContain('2026-');
  });

  it('exposes the actual guideline review date and currentness limits outside disclosure', () => {
    const html = renderToStaticMarkup(<GuidelineProvenance guideline={{ sourceReview: { reviewedAt: '2026-09-30', currencyNote: 'Correction remains unresolved.', scope: 'Limited source access' } }} />);
    const visible = html.slice(0, html.indexOf('<details'));
    expect(visible).toContain('2026-09-30');
    expect(visible).toContain('Correction remains unresolved.');
    expect(visible).toContain('does not establish that all current guidance has been verified');
    expect(renderToStaticMarkup(<GuidelineProvenance guideline={{}} />)).toContain('Not recorded');
  });
});
