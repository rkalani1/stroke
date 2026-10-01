import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ENCOUNTER_DETAIL_GROUPS, getEncounterDetailGroups, formatEncounterDetails, encounterDetailWarnings } from '../src/encounter-details.js';
import EncounterDetails from '../src/components/EncounterDetails.jsx';
import { updateSupplementaryField } from '../src/supplementary-calculators.js';

const encounter = (diagnosis = 'ischemic', context = 'acute', details = {}) => ({ context, note: { diagnosisCategory: diagnosis }, details });
const renderedFields = state => getEncounterDetailGroups(state).flatMap(group => group.fields.map(field => field.key));
const output = state => formatEncounterDetails(state).flatMap(group => group.lines).join('\n');
const reviewedWorksheet = (state, id, values) => {
  for (const [key, value] of Object.entries(values)) state = updateSupplementaryField(state, id, key, value);
  return updateSupplementaryField(state, id, 'reviewed', true);
};

describe('optional encounter details', () => {
  it('does not create undocumented findings, negative attestations, or empty output', () => {
    expect(formatEncounterDetails(encounter())).toEqual([]);
    expect(formatEncounterDetails({ context: 'acute', note: {} })).toEqual([]);
    expect(ENCOUNTER_DETAIL_GROUPS).toHaveLength(12);
    const keys = ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields.map(field => field.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('isolates diagnosis-specific fields and preserves hidden retained observations', () => {
    const details = { ichHydrocephalus: 'no', sahEvdStatus: 'Placed', cvtAnticoagPhase: 'Acute treatment', tiaDwiPositive: 'yes', mimicDifferential: 'Migraine' };
    for (const [diagnosis, activeKey] of Object.entries({ ich: 'ichHydrocephalus', sah: 'sahEvdStatus', cvt: 'cvtAnticoagPhase', tia: 'tiaDwiPositive', mimic: 'mimicDifferential' })) {
      const state = encounter(diagnosis, 'acute', details);
      const keys = renderedFields(state);
      expect(keys).toContain(activeKey);
      Object.keys(details).filter(key => key !== activeKey).forEach(key => expect(keys).not.toContain(key));
      expect(state.details).toEqual(details);
    }
  });
  it('separates follow-up assessment and current acute procedural documentation', () => {
    const details = { followupMrs: '0', reviewedMoca: '0', reperfusionReview: 'After EVT', evtPasses: '0' };
    const acuteOutput = output(encounter('ischemic', 'acute', details));
    expect(acuteOutput).toContain('Recorded EVT passes: 0');
    expect(acuteOutput).not.toContain('follow-up mRS');
    const followupOutput = output(encounter('ischemic', 'follow-up', details));
    expect(followupOutput).toContain('Current follow-up mRS: 0 — No symptoms');
    expect(followupOutput).toContain('Reviewed MoCA score: 0');
    expect(followupOutput).not.toContain('EVT passes');
    expect(output(encounter('ich', 'acute', details))).not.toContain('EVT passes');
  });
  it('requires the relevant selected parent before exporting dependent details', () => {
    const state = encounter('ischemic', 'acute', { antithromboticPlanType: 'Dual antiplatelet', daptStartDate: '2026-10-01', daptMissedDoses: 0 });
    expect(output(state)).toContain('Documented DAPT start date: 2026-10-01');
    expect(output(state)).toContain('Reported missed DAPT doses in 7 days: 0');
    state.details.antithromboticPlanType = 'Single antiplatelet';
    expect(output(state)).not.toContain('DAPT');
    state.details.allergyReview = 'Reviewed — no known allergies';
    state.details.allergies = 'Retained previous allergy concern';
    expect(output(state)).not.toContain('Retained previous');
  });
  it('distinguishes explicitly reviewed negative values from unknowns', () => {
    expect(output(encounter('ich', 'acute', { ichHydrocephalus: 'no' }))).toContain('ICH hydrocephalus: No');
    expect(output(encounter('ich', 'acute', { ichHydrocephalus: '' }))).not.toContain('hydrocephalus');
  });
  it('labels invalid scores, selections and dates without interpreting them', () => {
    const state = encounter('ischemic', 'follow-up', { reviewedMoca: '31', followupMrs: '7', antithromboticPlanType: 'Dual antiplatelet', daptStartDate: '2026-02-30' });
    const text = output(state);
    expect(text).toContain('31 (invalid value; review)');
    state.details.reviewedMoca = '2.5';
    expect(output(state)).toContain('2.5 (invalid value; review)');
    expect(text).toContain('7 (unrecognized selection; review)');
    expect(text).toContain('2026-02-30 (invalid date; review)');
  });
  it('scans all retained hidden and unrecognized values while allowing valid structured dates', () => {
    const seen = [];
    const state = encounter('mimic', 'acute', { ichSurgicalPlan: 'hidden concern', unknownField: { nested: ['retained concern', 'hidden concern'] }, daptStartDate: '2026-10-01', daptStopDate: '2026-02-30', reviewedMoca: 0 });
    const warnings = encounterDetailWarnings(state, value => { seen.push(value); return value.includes('concern') ? ['identifier'] : []; });
    expect(warnings).toEqual(['identifier']);
    expect(seen).toEqual(['hidden concern', 'retained concern', 'hidden concern', '2026-02-30', '0']);
    expect(encounterDetailWarnings(encounter(), () => ['unexpected'])).toEqual([]);
  });
  it('uses complete reviewed worksheet scores and preserves zero without duplicate score state', () => {
    let state = encounter('ischemic', 'follow-up', { reviewedPhq2: '6', reviewedStopBang: '8', screeningContext: 'Discussed follow-up screening' });
    state.note = { ...state.note, age: '50', sex: 'F', weight: '140', heightCm: '200' };
    const before = { ...state.details };
    expect(output(state)).toBe('');
    state = reviewedWorksheet(state, 'phq2', { phq2_q1: 0, phq2_q2: '0' });
    state = reviewedWorksheet(state, 'stop-bang', { sb_snoring: false, sb_tired: false, sb_observed: false, sb_pressure: false, neckCm: '40' });
    expect(output(state)).toContain('Reviewed PHQ-2 score: 0/6');
    expect(output(state)).toContain('Reviewed STOP-BANG score: 0/8');
    expect(output(state)).toContain('Discussed follow-up screening');
    expect(state.details).toEqual(before);
    expect(renderedFields(state)).not.toContain('reviewedPhq2');
    expect(renderedFields(state)).not.toContain('reviewedStopBang');
    expect(output({ ...state, context: 'acute' })).not.toContain('Reviewed PHQ-2');
  });
  it('withdraws changed or incomplete screening results and their dependent context', () => {
    let state = encounter('ischemic', 'follow-up', { screeningContext: 'Reviewed at follow-up' });
    state = reviewedWorksheet(state, 'phq2', { phq2_q1: 0, phq2_q2: 0 });
    expect(output(state)).toContain('Reviewed PHQ-2 score: 0/6');
    state = updateSupplementaryField(state, 'phq2', 'phq2_q2', '');
    expect(output(state)).toBe('');
    state = updateSupplementaryField(state, 'phq2', 'reviewed', true);
    expect(output(state)).toBe('');
    state = reviewedWorksheet(state, 'phq2', { phq2_q1: 0, phq2_q2: 0 });
    expect(output({ ...state, note: { ...state.note, diagnosisCategory: 'tia' } })).toBe('');
    state.details.reviewedMoca = '0';
    expect(output(updateSupplementaryField(state, 'phq2', 'reviewed', false))).toContain('Reviewed at follow-up');
  });
  it('withdraws STOP-BANG after a shared measurement changes or becomes unknown', () => {
    let state = encounter('ischemic', 'follow-up', { screeningContext: 'Sleep screening reviewed' });
    state.note = { ...state.note, age: '50', sex: 'F', weight: '140', heightCm: '200' };
    state = reviewedWorksheet(state, 'stop-bang', { sb_snoring: false, sb_tired: false, sb_observed: false, sb_pressure: false, neckCm: '40' });
    expect(output(state)).toContain('Reviewed STOP-BANG score: 0/8');
    for (const [key, value] of [['age', '51'], ['sex', ''], ['heightCm', ''], ['weight', '']]) {
      const changed = { ...state, note: { ...state.note, [key]: value } };
      expect(output(changed)).toBe('');
      expect(getEncounterDetailGroups(changed).find(group => group.id === 'follow-up-review').fields.find(field => field.calculator === 'stop-bang').result).toBeNull();
    }
  });
  it('renders read-only scores and worksheet links without score input controls', () => {
    const state = reviewedWorksheet(encounter('ischemic', 'follow-up'), 'phq2', { phq2_q1: 0, phq2_q2: 0 });
    const markup = renderToStaticMarkup(React.createElement(EncounterDetails, { state, section: 'safety', update: () => { throw new Error('render must not write state'); } }));
    expect(markup).toContain('href="#/tools/phq2"');
    expect(markup).toContain('href="#/tools/stop-bang"');
    expect(markup).toContain('<output aria-labelledby="encounter-detail-phq2-worksheet-label">0/6</output>');
    expect(markup).toContain('<output aria-labelledby="encounter-detail-stop-bang-worksheet-label">Incomplete / review required</output>');
    expect(markup).not.toContain('id="encounter-detail-reviewedPhq2"');
    expect(markup).not.toContain('id="encounter-detail-reviewedStopBang"');
    expect(markup).toContain('id="encounter-detail-reviewedMoca"');
  });
});
