import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TrialScreener } from '../src/components/TrialScreener.jsx';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { buildScreenerParams, createInitialScreenerState, evaluateTrialEligibility, numericFact, STUDY_FACTS, VISIBLE_FACTS, withClassification, evaluateAll } from '../src/evidence/screener-eval.js';
import { answerFacts, applyEncounterPrefill, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { newEncounter } from '../src/workspace-state.js';

const minute = screenerTrials.find(trial => trial.acronym === 'MINUTE');
const initial = createInitialScreenerState;
const S = patch => ({ ...initial(), classification: 'ich', ...patch });
const base = { age: 60, onsetVal: 3, onsetUnit: 'hours', ichLocation: 'bg', ichVolume: 25, preMrs: 1,
  exclusions: { exSecondaryIch: false, exMidbrain: false, exDoacLmwhAtOnset: false, exPregnancy: false } };
const evaluate = patch => evaluateTrialEligibility(minute, buildScreenerParams(S({ ...base, ...patch })));

describe('MINUTE uses presentation scores rather than the current Encounter assessment', () => {
  it('leaves both presentation assessments unknown until entered explicitly', () => {
    expect(initial()).toMatchObject({ minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected' });
    const result = evaluate({ nihss: 30, gcs: 15 });
    expect(result.status).toBe('pending');
    expect(result.completeness).toBe('insufficient-information');
    expect(result.unknownModeledCount).toBe(2);
    expect(result.pendingCriteria).toContain('Confirm NIHSS ≥ 6 at presentation');
    expect(result.pendingCriteria).toContain('Confirm GCS ≥ 7 at presentation');
  });

  it('allows a modeled match with qualifying presentation scores despite lower current scores', () => {
    const result = evaluate({ nihss: 1, gcs: 3, minutePresentationNihss: 6, minutePresentationGcs: 7 });
    expect(result.status).toBe('pending');
    expect(result.completeness).toBe('potential-match');
    expect(result.matchedCriteria).toContain('NIHSS at presentation is 6 (meets ≥ 6)');
    expect(result.matchedCriteria).toContain('GCS at presentation is 7 (meets ≥ 7)');
    // A modeled match still carries the complete manual protocol review.
    expect(result.pendingCriteria.length).toBeGreaterThan(0);
  });

  it('fails the presentation criterion despite reassuring current scores', () => {
    const result = evaluate({ nihss: 10, gcs: 15, minutePresentationNihss: 5, minutePresentationGcs: 6 });
    expect(result.status).toBe('excluded');
    expect(result.exclusionReasons).toContain('NIHSS < 6 at presentation');
    expect(result.exclusionReasons).toContain('GCS < 7 at presentation');
  });

  it('keeps missing, malformed, fractional and out-of-range presentation scores unknown', () => {
    for (const [field, invalid] of [
      ['minutePresentationNihss', ['', 'unselected', null, undefined, 'abc', true, NaN, Infinity, -1, 3.5, 43]],
      ['minutePresentationGcs', ['', 'unselected', null, undefined, 'abc', true, NaN, Infinity, 2, 7.5, 16]]
    ]) for (const value of invalid) {
      expect(numericFact(field, value)).toBeNull();
      const result = evaluate({ minutePresentationNihss: 8, minutePresentationGcs: 14, [field]: value });
      expect(result.completeness, `${field}=${String(value)}`).toBe('insufficient-information');
      expect(result.exclusionReasons).toEqual([]);
    }
    expect(numericFact('minutePresentationNihss', 0)).toBe(0);
    expect(numericFact('minutePresentationNihss', 42)).toBe(42);
    expect(numericFact('minutePresentationGcs', 3)).toBe(3);
    expect(numericFact('minutePresentationGcs', 15)).toBe(15);
  });

  it('imports current scores without attesting to presentation and preserves explicitly entered history on reapply', () => {
    const encounter = newEncounter();
    encounter.note.diagnosisCategory = 'ich';
    encounter.nihssSource = 'reported';
    encounter.reportedNihss = '12';
    encounter.gcs = { eye: '4', verbal: '5', motor: '6' };
    const prefill = screenerPrefillFromEncounter(encounter);
    expect(prefill.patch).toMatchObject({ nihss: 12, gcs: 15 });
    expect(prefill.patch).not.toHaveProperty('minutePresentationNihss');
    expect(prefill.patch).not.toHaveProperty('minutePresentationGcs');
    const imported = applyEncounterPrefill(initial(), prefill, initial());
    expect(imported).toMatchObject({ nihss: 12, gcs: 15, minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected' });
    const entered = answerFacts(imported, { minutePresentationNihss: '8', minutePresentationGcs: '10' });
    encounter.reportedNihss = '2';
    encounter.gcs = { eye: '4', verbal: '4', motor: '6' };
    const reapplied = applyEncounterPrefill(entered, screenerPrefillFromEncounter(encounter), initial());
    expect(reapplied).toMatchObject({ nihss: 2, gcs: 14, minutePresentationNihss: '8', minutePresentationGcs: '10' });
  });

  it('clears presentation scores on classification changes and reset rather than leaking them into a later screen', () => {
    const answered = S({ minutePresentationNihss: 8, minutePresentationGcs: 10 });
    const ischemic = withClassification(answered, 'ischemic');
    expect(ischemic).toMatchObject({ minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected' });
    expect(withClassification(ischemic, 'ich')).toMatchObject({ minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected' });
    expect(initial()).toMatchObject({ minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected' });
  });

  it('renders explicit presentation inputs with the right bounds and copies those assessments', () => {
    const state = S({ ...base, nihss: 1, gcs: 3, minutePresentationNihss: 8, minutePresentationGcs: 14 });
    expect(STUDY_FACTS.ich.find(([key]) => key === 'minutePresentationNihss')?.[3]).toEqual(['MINUTE']);
    expect(STUDY_FACTS.ich.find(([key]) => key === 'minutePresentationGcs')?.[3]).toEqual(['MINUTE']);
    expect(VISIBLE_FACTS.ischemic).not.toContain('minutePresentationNihss');
    expect(VISIBLE_FACTS.ich).not.toContain('gcs');
    const html = renderToStaticMarkup(<TrialScreener initialState={state} />);
    expect(html).toMatch(/aria-label="NIHSS at presentation"[^>]*min="0" max="42"/);
    expect(html).toMatch(/aria-label="GCS at presentation"[^>]*min="3" max="15"/);
    expect(html).not.toContain('aria-label="GCS"');
    expect(html).toContain('current Encounter scores do not supply these assessments');
    const note = evaluateAll(state).briefingNote;
    expect(note).toContain('NIHSS at presentation: 8');
    expect(note).toContain('GCS at presentation: 14');
    expect(note).not.toContain(' · NIHSS 1');
    expect(note).not.toContain(' · GCS 3');
  });
});
