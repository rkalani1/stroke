import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { recommendAcuteDAPT } from '../src/calculators-extended.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { buildSummary, newEncounter, updateEncounter, daptAnticoagulationReview } from '../src/workspace-state.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const dapt = { age: 65, anticoagulationExcluded: true, anticoagulationReview: 'none', strokeType: 'ischemic', nihss: 2, timeFromOnsetH: 12, noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true, atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false, ichRisk: 'reviewed' };
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const completeState = () => {
  const state = newEncounter();
  Object.assign(state, { nihssSource: 'reported', reportedNihss: '2', dapt: { ...dapt }, decisions: { ivt: 'Not recommended', evt: 'Not recommended' } });
  Object.assign(state.note, { diagnosisCategory: 'ischemic', age: '65', lastDOACType: 'none', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent' });
  return state;
};

describe('source applicability and negative vessel findings', () => {
  it.each([undefined, null, '', ' ', '65years', true, {}, NaN, Infinity, -1, 0, 10, 17.99, 121])('does not select an adult DAPT regimen for age %s', age => {
    const result = recommendAcuteDAPT({ ...dapt, age });
    expect(result.regimen).toBe('—');
    expect(result.dosing).toBeNull();
    expect(result.duration).toBeNull();
  });
  it.each([18, 65, '65', 120])('preserves the complete modeled adult screen at age %s', age => {
    expect(recommendAcuteDAPT({ ...dapt, age }).regimen).toBe('clopidogrel+ASA');
  });
  it.each([{ timeFromOnsetH: 36 }, { nihss: 10 }, { strokeType: 'tia', abcd2: 2 }])('does not convert an unmatched branch into a treatment selection: %o', patch => {
    const result = recommendAcuteDAPT({ ...dapt, ...patch });
    expect(result.regimen).toBe('individualized-review');
    expect(result.dosing).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.rationale).toContain('does not select single antiplatelet therapy');
  });
  it('uses canonical Encounter age rather than a stale worksheet age', () => {
    const state = newEncounter();
    Object.assign(state, { nihssSource: 'reported', reportedNihss: '2', dapt, decisions: { ivt: 'Not recommended', evt: 'Not recommended' } });
    Object.assign(state.note, { diagnosisCategory: 'ischemic', age: '10', lastDOACType: 'none', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent' });
    expect(render(state)).toContain('Pediatric stroke/TIA');
    expect(render(state)).not.toContain('Clopidogrel + aspirin:');
    state.note.age = '';
    expect(render(state)).toContain('Document a valid adult age');
    state.note.age = '65';
    expect(render(state)).toContain('Clopidogrel + aspirin:');
  });
  it('does not describe an explicitly absent occlusion as a medium/distal target', () => {
    const note = { age: 65, nihss: 12, premorbidMRS: 0, diagnosisCategory: 'ischemic', ctHemorrhageStatus: 'absent', vesselOcclusion: ['None'] };
    const result = evaluateVideoTreatment({ note, clock: { total: 2, label: 'LKW' }, aspects: 8 }).evt;
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('No occlusion explicitly documented');
    expect(result.reason).not.toContain('Medium/distal or other occlusion');
    expect(evaluateVideoTreatment({ note: { ...note, vesselOcclusion: [] }, clock: { total: 2, label: 'LKW' }, aspects: 8 }).evt.reason).not.toContain('No occlusion explicitly documented');
  });
});

describe('trial-specific DAPT age and timing bounds', () => {
  it.each([
    [{ age: 39, nihss: 4 }, 'THALES'],
    [{ age: 20, nihss: 4 }, 'THALES'],
    [{ age: 39, cyp2c19LOF: true }, 'CHANCE-2'],
    [{ age: 20, cyp2c19LOF: true }, 'CHANCE-2'],
    [{ age: 34, nihss: 4, atherosclerotic: true, timeFromOnsetH: 48 }, 'INSPIRES'],
    [{ age: 81, nihss: 4, atherosclerotic: true, timeFromOnsetH: 48 }, 'INSPIRES'],
    [{ age: 90, strokeType: 'tia', abcd2: 4, atherosclerotic: true, timeFromOnsetH: 48 }, 'INSPIRES'],
    [{ age: 20, timeFromOnsetH: 12.01 }, 'CHANCE / POINT'],
    [{ age: 39, strokeType: 'tia', abcd2: 4, timeFromOnsetH: 24 }, 'CHANCE / POINT']
  ])('labels an out-of-trial-population age as the AHA/ASA 2026 guideline tier: %o', (patch, trial) => {
    const result = recommendAcuteDAPT({ ...dapt, ...patch });
    // AHA/ASA 2026 DAPT recommendations carry no age limit; the trial gap is disclosed.
    expect(result.regimen).not.toBe('individualized-review');
    expect(result.duration).toBeTruthy();
    expect(result.dosing).toBeTruthy();
    expect(result.class).toContain(`guideline tier; age outside the ${trial} trial population`);
    expect(result.rationale).toContain(`${trial} enrolled`);
    expect(result.rationale).toContain('AHA/ASA 2026 recommendation is not age-restricted');
  });
  it.each([
    [{ age: 40, nihss: 4 }, 'ticagrelor+ASA'],
    [{ age: 40, cyp2c19LOF: true }, 'ticagrelor+ASA (CHANCE-2)'],
    [{ age: 35, nihss: 4, atherosclerotic: true, timeFromOnsetH: 48 }, 'clopidogrel+ASA'],
    [{ age: 80, nihss: 4, atherosclerotic: true, timeFromOnsetH: 72 }, 'clopidogrel+ASA'],
    [{ age: 18, timeFromOnsetH: 12 }, 'clopidogrel+ASA'],
    [{ age: 39, strokeType: 'tia', abcd2: 4, timeFromOnsetH: 12 }, 'clopidogrel+ASA'],
    [{ age: 40, timeFromOnsetH: 24 }, 'clopidogrel+ASA']
  ])('preserves a modeled branch at the source boundary: %o', (patch, regimen) => {
    expect(recommendAcuteDAPT({ ...dapt, ...patch }).regimen).toBe(regimen);
  });
});

describe('current anticoagulation and indication reconciliation for DAPT', () => {
  it.each([undefined, null, '', false, 'true'])('requires an explicit reviewed helper premise: %s', anticoagulationExcluded => {
    const result = recommendAcuteDAPT({ ...dapt, anticoagulationExcluded });
    expect(['—', 'individualized-review']).toContain(result.regimen);
    expect(result.dosing).toBeNull();
    expect(result.duration).toBeNull();
  });
  it.each(['', 'unknown-value', 'other'])('withholds an unassessed or unspecified exposure: %s', lastDOACType => {
    const state = completeState(); state.note.lastDOACType = lastDOACType;
    expect(daptAnticoagulationReview(state).excluded).toBeUndefined();
    expect(render(state)).not.toContain('Clopidogrel + aspirin:');
  });
  it.each(['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'heparin', 'lmwh'])('reconciles %s rather than accepting an inconsistent no-use review', drug => {
    const state = completeState(); state.note.lastDOACType = drug;
    state.note.lastDOACDose = '2026-09-30T09:00';
    state.note.anticoagulantDoseIntent = 'therapeutic';
    expect(daptAnticoagulationReview(state)).toMatchObject({ excluded: false });
    expect(render(state)).not.toContain('Clopidogrel + aspirin:');
    state.dapt.anticoagulationReview = 'ongoing';
    expect(daptAnticoagulationReview(state).excluded).toBe(false);
    state.dapt.anticoagulationReview = 'stopped';
    expect(daptAnticoagulationReview(state).excluded).toBe(true);
    expect(daptAnticoagulationReview(state).reason).toContain('does not establish drug clearance');
    expect(render(state)).toContain('Clopidogrel + aspirin:');
  });
  it.each(['Anticoagulant', 'Combination under specialist review'])('an explicit %s plan overrides a stale no-indication review', antithromboticPlanType => {
    const state = completeState(); state.details.antithromboticPlanType = antithromboticPlanType;
    for (const anticoagulationReview of ['none', 'stopped']) {
      state.dapt.anticoagulationReview = anticoagulationReview;
      expect(daptAnticoagulationReview(state).excluded).toBe(false);
      expect(render(state)).not.toContain('Clopidogrel + aspirin:');
    }
  });
  it('requires reconciliation for medication mentions without inferring active use from text', () => {
    const state = completeState(); state.note.medications = 'Apixaban was stopped after a completed treatment course.';
    expect(daptAnticoagulationReview(state).excluded).toBe(false);
    state.note.lastDOACType = 'apixaban'; state.dapt.anticoagulationReview = 'stopped';
    expect(daptAnticoagulationReview(state).excluded).toBe(true);
  });
  it('does not accept stopped exposure without documenting it or treat prophylaxis as verified eligibility', () => {
    const state = completeState(); state.dapt.anticoagulationReview = 'stopped';
    expect(daptAnticoagulationReview(state).excluded).toBe(false);
    state.dapt.anticoagulationReview = 'prophylaxis'; state.note.lastDOACType = 'lmwh'; state.note.anticoagulantDoseIntent = 'prophylactic';
    expect(daptAnticoagulationReview(state)).toMatchObject({ excluded: false });
    expect(daptAnticoagulationReview(state).reason).toContain('separate review');
  });
  it.each(['recentDOAC', 'recentHeparin', 'warfarinElevatedINR'])('reconciles an affirmative %s exposure checklist entry and renews review when it changes', key => {
    const state = completeState(); state.note.tnkContraindicationChecklist[key] = true;
    expect(daptAnticoagulationReview(state).excluded).toBe(false);
    const next = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, tnkContraindicationChecklist: { ...previous.note.tnkContraindicationChecklist, [key]: false } } }));
    expect(next.dapt.anticoagulationReview).toBeUndefined();
  });
  it.each([
    ['exposure', state => { state.note.lastDOACType = 'apixaban'; }],
    ['dose time', state => { state.note.lastDOACDose = '2026-09-30T09:00'; }],
    ['LMWH intent', state => { state.note.anticoagulantDoseIntent = 'therapeutic'; }],
    ['medications', state => { state.note.medications = 'Warfarin'; }],
    ['plan type', state => { state.details.antithromboticPlanType = 'Anticoagulant'; }],
    ['plan narrative', state => { state.details.antithromboticPlan = 'Reconcile indication'; }],
    ['AF assessment', state => { state.details.afDetected = 'yes'; }],
    ['context', state => { state.context = 'follow-up'; }],
    ['diagnosis', state => { state.note.diagnosisCategory = 'tia'; }]
  ])('renews review after a changed %s source and invalidates the draft', (_, change) => {
    const state = completeState(); state.draft = { text: 'Prior draft', stale: false };
    const next = updateEncounter(state, previous => { const result = structuredClone(previous); change(result); return result; });
    expect(next.dapt.anticoagulationReview).toBeUndefined();
    expect(next.draft.stale).toBe(true);
  });
  it('retains a review for unrelated edits but ignores a stale helper flag when the canonical review is missing', () => {
    const state = completeState();
    expect(updateEncounter(state, previous => ({ ...previous, assessment: 'Entered assessment' })).dapt.anticoagulationReview).toBe('none');
    delete state.dapt.anticoagulationReview;
    expect(state.dapt.anticoagulationExcluded).toBe(true);
    expect(render(state)).not.toContain('Clopidogrel + aspirin:');
    expect(render(state)).toContain('Review current anticoagulation and any continuing indication');
  });
});

describe('shared anticoagulant history and compact handoff continuity', () => {
  it.each(['ich', 'sah', 'tia', 'cvt', 'mimic', 'other'])('keeps entered history in mounted %s and all requested note styles without IVT decisions', diagnosisCategory => {
    const state = newEncounter();
    Object.assign(state.note, { diagnosisCategory, lastDOACType: 'warfarin', lastDOACDose: '2026-09-30T20:00', inr: '2.5' });
    const html = render(state);
    expect(html).toContain('aria-label="Anticoagulant exposure"');
    expect(html).toContain('aria-label="Last anticoagulant dose (local)"');
    expect(html.match(/aria-label="INR"/g)).toHaveLength(1);
    for (const consultationType of ['phone', 'video']) for (const documentFormat of ['consultation', 'handoff', 'transfer']) {
      Object.assign(state, { consultationType, documentFormat });
      const text = buildSummary(state, now);
      expect(text).toContain('Anticoagulant exposure: warfarin');
      expect(text).toContain('Last anticoagulant dose: 2026-09-30 20:00');
      expect(text).not.toContain('IVT clinician decision:');
      expect(text).not.toContain('INR alone does not establish');
    }
  });
  it('retains follow-up medication history and suppresses an inactive old dose after no exposure is selected', () => {
    const state = newEncounter(); state.context = 'follow-up';
    Object.assign(state.note, { diagnosisCategory: 'ischemic', lastDOACType: 'lmwh', lastDOACDose: '2026-10-01T09:00', anticoagulantDoseIntent: 'therapeutic' });
    const text = buildSummary(state, now);
    expect(text).toContain('Anticoagulant exposure: LMWH');
    expect(text).toContain('LMWH dose intent: therapeutic');
    expect(text).not.toContain('IVT clinician decision:');
    state.note.lastDOACType = 'none';
    expect(buildSummary(state, now)).toContain('Anticoagulant exposure: none');
    expect(buildSummary(state, now)).not.toContain('Last anticoagulant dose:');
    expect(buildSummary(state, now)).not.toContain('LMWH dose intent:');
  });
  it('qualifies future anticoagulant timestamps and invalidates a previously generated draft', () => {
    const state = newEncounter(); state.note.diagnosisCategory = 'ich'; state.note.lastDOACType = 'apixaban'; state.note.lastDOACDose = '2026-10-02T09:00';
    expect(buildSummary(state, now)).toContain('(invalid or future; correct before interpretation)');
    state.draft = { text: buildSummary(state, now), stale: false };
    expect(updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, lastDOACDose: '2026-09-30T09:00' } })).draft.stale).toBe(true);
  });
  it('preserves entered perfusion and post-treatment examination/complications in compact handoff', () => {
    const state = newEncounter(); state.documentFormat = 'handoff';
    Object.assign(state.note, { diagnosisCategory: 'ischemic', coreVolume: '10', penumbraVolume: '30', ctpResults: 'Perfusion report reviewed.' });
    state.details = { reperfusionReview: 'After IV thrombolysis', postReperfusionExam: 'New tongue swelling observed.', hemorrhagicTransformation: 'Under evaluation', postTreatmentAngioedema: 'yes', complicationObservations: 'Airway team notified.', hospitalCourse: 'Long unrelated history.', dischargeReview: 'Planning' };
    const text = buildSummary(state, now);
    expect(text).toContain('CTP: Core: 10 mL');
    expect(text).toContain('Calculated mismatch volume: 20 mL');
    expect(text).toContain('Perfusion report reviewed.');
    expect(text).toContain('Post-treatment examination / observations: New tongue swelling observed.');
    expect(text).toContain('Post-treatment hemorrhagic transformation review: Under evaluation');
    expect(text).toContain('Post-treatment angioedema observed: Yes');
    expect(text).toContain('Complications / documented actions / response: Airway team notified.');
    expect(text).not.toContain('Long unrelated history');
    state.context = 'follow-up';
    const followup = buildSummary(state, now);
    expect(followup).not.toContain('Core: 10 mL');
    expect(followup).not.toContain('New tongue swelling observed');
    expect(followup).toContain('CTP: Perfusion report reviewed.');
  });
  it('does not fabricate perfusion or post-treatment findings when not entered', () => {
    const state = newEncounter(); state.documentFormat = 'handoff'; state.note.diagnosisCategory = 'ischemic';
    const text = buildSummary(state, now);
    expect(text).not.toContain('CTP:');
    expect(text).not.toContain('Post-treatment examination');
    expect(text).not.toContain('angioedema observed');
  });
});
