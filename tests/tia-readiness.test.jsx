import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TiaReadiness from '../src/components/TiaReadiness.jsx';
import { ENCOUNTER_DETAIL_GROUPS, TIA_RISK_FIELDS, formatEncounterDetails, getEncounterDetailGroups } from '../src/encounter-details.js';
import { newEncounter, encounterTiaReadiness, updateEncounter } from '../src/workspace-state.js';

const negativeRisks = Object.fromEntries(TIA_RISK_FIELDS.map(([key]) => [key, 'no']));
const completedWorkup = { tiaMri: 'Completed', tiaVascularImaging: 'Completed', tiaCardiacWorkup: 'Completed', tiaWorkupComplete: 'yes', tiaFollowupAccess: 'yes' };
function tia(details = {}) {
  const state = newEncounter();
  return { ...state, note: { ...state.note, diagnosisCategory: 'tia' }, details };
}
const render = state => renderToStaticMarkup(<TiaReadiness state={state} />);

describe('TIA readiness from canonical encounter fields', () => {
  it('keeps an untouched assessment unknown, including workup and follow-up', () => {
    const review = encounterTiaReadiness(tia());
    expect(review.status).toBe('incomplete');
    expect(review.reviewed).toBe(false);
    expect(review.reviewedCount).toBe(0);
    expect(review.missing).toHaveLength(5);
    expect(review.gaps).toHaveLength(5);
    expect(review.concerns).toEqual([]);
  });

  it.each(TIA_RISK_FIELDS.map(([key]) => [key]))('treats any positive %s as urgent without an attestation or complete checklist', key => {
    const state = tia({ [key]: 'yes', assessmentReviewed: false });
    const review = encounterTiaReadiness(state);
    expect(review.status).toBe('urgent');
    expect(review.reviewed).toBe(false);
    expect(review.concerns).toHaveLength(1);
    expect(review.gaps).toHaveLength(5);
    expect(render(state)).toContain('role="alert"');
  });

  it('requires all five explicit values even when overall workup is marked complete', () => {
    const state = tia({ ...negativeRisks, ...completedWorkup, tiaCardioembolic: '' });
    expect(encounterTiaReadiness(state)).toMatchObject({ status: 'incomplete', reviewed: false, reviewedCount: 4 });
    state.details.tiaCardioembolic = 'no';
    expect(encounterTiaReadiness(state)).toMatchObject({ status: 'review', reviewed: true, reviewedCount: 5, gaps: [] });
    const html = render(state);
    expect(html).toContain('ABCD² alone cannot clear discharge');
    expect(html).not.toMatch(/safe discharge|cleared for discharge|low-risk discharge/i);
  });

  it.each([undefined, null, '', true, false, 0, 1, 'false', 'true', 'NO', ' yes '])('does not coerce malformed or missing canonical values (%s) into review', value => {
    const review = encounterTiaReadiness(tia({ ...negativeRisks, tiaSevereCarotid: value }));
    expect(review.status).toBe('incomplete');
    expect(review.reviewedCount).toBe(4);
  });

  it('does not let risk review or overall completion conceal unresolved workup components', () => {
    const review = encounterTiaReadiness(tia({ ...negativeRisks, tiaWorkupComplete: 'yes', tiaFollowupAccess: 'yes' }));
    expect(review.status).toBe('review');
    expect(review.gaps).toHaveLength(3);
    expect(review.gaps.join(' ')).toContain('MRI / DWI');
    expect(review.gaps.join(' ')).toContain('vascular imaging');
    expect(review.gaps.join(' ')).toContain('ECG / rhythm');
  });

  it('distinguishes documented not-indicated components from missing or pending workup', () => {
    const review = encounterTiaReadiness(tia({ ...negativeRisks, ...completedWorkup, tiaMri: 'Not indicated', tiaVascularImaging: 'Ordered' }));
    expect(review.gaps).toHaveLength(1);
    expect(review.gaps[0]).toContain('Head / neck vascular imaging');
    expect(review.status).toBe('review');
  });

  it('preserves negative and unknown overall workup/follow-up gaps without claiming clearance', () => {
    const review = encounterTiaReadiness(tia({ ...negativeRisks, ...completedWorkup, tiaWorkupComplete: 'no', tiaFollowupAccess: '' }));
    expect(review.gaps).toEqual(['Same-day workup: not confirmed.', 'Prompt outpatient follow-up: confirmation not documented.']);
    expect(review.status).toBe('review');
  });

  it('does not allow scores, a disposition choice or a separate attestation to override unknown findings', () => {
    const state = tia({ assessmentReviewed: true, ...completedWorkup });
    state.dapt.abcd2 = 0;
    state.actions.disposition = 'Discharge';
    expect(encounterTiaReadiness(state).status).toBe('incomplete');
    state.details.tiaPersistentDeficit = 'yes';
    expect(encounterTiaReadiness(state).status).toBe('urgent');
  });

  it('hides the assessment outside acute TIA while retaining entered observations', () => {
    const state = tia({ tiaDwiPositive: 'yes' });
    for (const incompatible of [{ ...state, context: 'follow-up' }, { ...state, note: { ...state.note, diagnosisCategory: 'ischemic' } }]) {
      expect(encounterTiaReadiness(incompatible)).toBeNull();
      expect(render(incompatible)).toBe('');
      expect(incompatible.details.tiaDwiPositive).toBe('yes');
    }
  });

  it('uses one set of canonical form fields and exports only documented values', () => {
    const state = tia({ tiaSevereCarotid: 'no', tiaCardioembolic: 'yes' });
    const allKeys = ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields.map(field => field.key));
    for (const [key] of TIA_RISK_FIELDS) expect(allKeys.filter(id => id === key)).toHaveLength(1);
    const fields = getEncounterDetailGroups(state).flatMap(group => group.fields);
    expect(fields.find(field => field.key === 'tiaSevereCarotid').options).toEqual([['yes', 'Yes'], ['no', 'No']]);
    const output = formatEncounterDetails(state).flatMap(group => group.lines).join('\n');
    expect(output).toContain('Severe symptomatic carotid stenosis: No');
    expect(output).toContain('Suspected cardioembolic source: Yes');
    expect(output).not.toContain('DWI lesion:');
    const html = render(state);
    expect(html).toContain('href="#/encounter/section/diagnosis-details"');
    expect(html).not.toMatch(/<(input|select|textarea)/);
  });

  it('recomputes immediately after edits and reset, while existing draft invalidation still applies', () => {
    const state = tia({ ...negativeRisks, ...completedWorkup });
    state.draft = { text: 'previous note', stale: false };
    const changed = updateEncounter(state, previous => ({ ...previous, details: { ...previous.details, tiaCardioembolic: 'yes' } }));
    expect(encounterTiaReadiness(changed).status).toBe('urgent');
    expect(changed.draft.stale).toBe(true);
    expect(encounterTiaReadiness(state).status).toBe('review');
    expect(encounterTiaReadiness(newEncounter())).toBeNull();
    expect(encounterTiaReadiness(tia()).status).toBe('incomplete');
  });
});
