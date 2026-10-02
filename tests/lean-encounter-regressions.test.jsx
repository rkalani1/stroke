import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter, updateEncounter, activeNote, buildSummary, nihssAssessment } from '../src/workspace-state.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const zeroExam = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions } };
};
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);

describe('retained Encounter behavior replacing monolith output and duplicate-tool contracts', () => {
  it.each(['phone', 'video'])('uses the requested %s documentation format without default attestations', consultationType => {
    const summary = buildSummary(make({ consultationType, note: { diagnosisCategory: 'ischemic' } }), now);
    expect(summary).not.toMatch(/SYNTHETIC EDUCATIONAL DEMO|NOT A REAL CLINICAL NOTE|NO PHI/);
    expect(summary).not.toMatch(/telephone consultation|video consultation|Acute consultation/);
    expect(summary).toContain(consultationType === 'phone' ? 'NIHSS score:' : 'Assessment and Plan:');
    expect(summary).toContain('IVT clinician decision: not documented');
    expect(summary).toContain('Consent status: not documented');
    expect(summary).not.toContain('Potential benefits, potential risks');
    expect(summary).not.toContain('TNK was administered');
  });
  it('does not promote a partial exam sum into a completed score or a copied assessment', () => {
    const state = make({ nihss: { motor_arm_left: 'No movement (4)' } });
    expect(nihssAssessment(state.nihss)).toMatchObject({ complete: false, partial: 4, total: null });
    expect(activeNote(state).nihss).toBe('');
    expect(buildSummary(state, now)).toContain('NIHSS score: incomplete: 1/15 items; partial sum 4; no completed score');
  });
  it('preserves a complete explicit NIHSS zero and withdraws it when one field is cleared', () => {
    const state = make({ nihss: zeroExam });
    expect(buildSummary(state, now)).toContain('NIHSS score: 0/42 (all items documented)');
    const cleared = updateEncounter(state, previous => ({ ...previous, nihss: { ...previous.nihss, dysarthria: '' } }));
    expect(activeNote(cleared).nihss).toBe('');
    expect(buildSummary(cleared, now)).toContain('no completed score');
  });
  it.each(['ich', 'sah', 'cvt', 'mimic', 'other'])('does not project prior ischemic screening inputs into %s outputs', diagnosisCategory => {
    const state = make({ note: { diagnosisCategory, vesselOcclusion: ['M1'], wakeUpStrokeWorkflow: { isWakeUpStroke: true }, ivtContraindicationsReviewed: true }, drug: 'TNK', weight: '83' });
    expect(activeNote(state)).toMatchObject({ vesselOcclusion: [], wakeUpStrokeWorkflow: {}, ivtContraindicationsReviewed: false });
    expect(buildSummary(state, now)).not.toContain('IVT clinician decision');
    expect(render(state)).not.toContain('Dose calculation');
    expect(state.note.vesselOcclusion).toEqual(['M1']);
  });
  it('follow-up does not activate stored reperfusion inputs or administration timers', () => {
    const html = render(make({ context: 'follow-up', note: { diagnosisCategory: 'ischemic', weight: '83' }, drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00' } }));
    expect(html).not.toContain('Dose calculation');
    expect(html).not.toContain('next scheduled check');
  });
  it('asks for MRI lesion extent and its qualifying finding separately without preselecting a finding', () => {
    const html = render(make({ note: { diagnosisCategory: 'ischemic', wakeUpStrokeWorkflow: { mriLesionExtentReviewed: true } } }));
    expect(html).toContain('aria-label="MRI lesion extent reviewed"');
    expect(html).toContain('aria-label="DWI lesion smaller than one-third MCA territory"');
    const extentSelect = html.match(/<select aria-label="DWI lesion smaller than one-third MCA territory"[^>]*>(.*?)<\/select>/)?.[1];
    expect(extentSelect).toContain('<option value="" selected="">Not assessed</option>');
  });
  it('manual rationale is retained once while generated text stays separate', () => {
    const state = make({ rationale: 'Synthetic specialist review pending.', draft: { text: 'OLD GENERATED DRAFT', stale: false, revision: 0 } });
    const output = buildSummary(state, now);
    expect(output.split(state.rationale)).toHaveLength(2);
    expect(output).not.toContain('OLD GENERATED DRAFT');
  });
  it('a stale generated draft exposes neither the text nor its copy action', () => {
    const html = render(make({ draft: { text: 'OBSOLETE GENERATED TEXT', stale: true } }));
    expect(html).toContain('Encounter inputs changed');
    expect(html).not.toContain('OBSOLETE GENERATED TEXT');
    expect(html).not.toContain('Copy Pulsara summary');
  });
  it('a recommendation and a timestamp alone do not attest administration', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic' }, decisions: { ivt: 'Recommended', evt: '' }, drug: 'TNK', actions: { administrationTime: '2026-10-01T11:00', administered: false } });
    expect(buildSummary(state, now)).toContain('IVT administration: not documented with a valid drug and timestamp');
    expect(render(state)).toContain('Monitoring timer inactive');
  });
  it('completed elapsed schedule does not attest that monitoring was performed', () => {
    const html = render(make({ note: { diagnosisCategory: 'ischemic' }, drug: 'TNK', actions: { administered: true, administrationTime: '2026-09-29T11:00' } }));
    expect(html).toContain('checks themselves are not attested');
    expect(html).not.toContain('All checks completed');
  });
  it('safety-review acknowledgement preserves a separately recorded concern', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', ivtContraindicationsReviewed: true, tnkContraindicationChecklist: { currentICH: true } } });
    const output = buildSummary(state, now);
    expect(output).toContain('Recorded safety concerns: currentICH');
    expect(output).toContain('explicitly recorded; concerns remain');
    expect(render(state)).toContain('Hemorrhage on CT imaging');
  });
  it('severity scoring has no individualized prognosis output', () => {
    const html = render(make({ note: { diagnosisCategory: 'ich', age: '80' }, gcs: { eye: '4', verbal: '5', motor: '6' }, volume: { a: '4', b: '4', thicknessMm: '10', numSlices: '4' }, ich: { ivh: false, infratentorial: false } }));
    expect(html).toContain('severity framework; no individual prognosis');
    expect(html).not.toMatch(/mortality:|97%|survival probability/i);
  });
  it.each([['5.99', 0], ['6', 1], ['6.01', 1]])('uses unrounded 30 mL severity threshold at diameter %s', (a, score) => {
    // Independent ABC/2: 5 cm * 2 cm * A / 2 = 5A; 29.95, 30, 30.05 mL.
    const state = make({ note: { diagnosisCategory: 'ich', age: '65' }, gcs: { eye: '4', verbal: '5', motor: '6' }, volume: { a, b: '5', thicknessMm: '10', numSlices: '2' }, ich: { ivh: false, infratentorial: false } });
    expect(render(state)).toContain(`ICH score ${score}/6`);
  });
  it('fresh TIA can explicitly complete its own reperfusion review without hidden ischemic decisions', () => {
    const state = make({ note: { diagnosisCategory: 'tia', age: '65', lastDOACType: 'none', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent' }, dapt: { anticoagulationReview: 'none', abcd2: '4', noncardioembolicConfirmed: true, antiplateletContraindicationsReviewed: true, ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false } });
    expect(render(state)).toContain('No reperfusion treatment after review');
    expect(render(state)).not.toContain('clopidogrel+ASA:');
    const reviewed = updateEncounter(state, prev => ({ ...prev, dapt: { ...prev.dapt, reperfusionExcluded: true, anticoagulationReview: 'none' } }));
    expect(render(reviewed)).toContain('clopidogrel+ASA:');
    expect(reviewed.decisions).toEqual({ ivt: '', evt: '' });
    expect(render({ ...reviewed, actions: { ...reviewed.actions, punctureTime: '2026-10-01T11:00' } })).not.toContain('clopidogrel+ASA:');
    expect(render({ ...reviewed, actions: { ...reviewed.actions, punctureTime: '2026-10-01T11:00' } })).toContain('Recorded reperfusion');
  });
  it('ischemic-to-TIA and follow-up changes invalidate the explicit DAPT reperfusion review', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', age: '65', lastDOACType: 'none', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent' }, nihss: zeroExam, decisions: { ivt: 'Not recommended', evt: 'Not recommended' }, dapt: { anticoagulationReview: 'none', reperfusionExcluded: true, abcd2: '4', noncardioembolicConfirmed: true, antiplateletContraindicationsReviewed: true, ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false } });
    const switched = updateEncounter(state, prev => ({ ...prev, note: { ...prev.note, diagnosisCategory: 'tia' } }));
    expect(switched.decisions).toEqual(state.decisions);
    expect(switched.dapt.reperfusionExcluded).toBeUndefined();
    expect(render(switched)).not.toContain('clopidogrel+ASA:');
    expect(render(updateEncounter(switched, prev => ({ ...prev, dapt: { ...prev.dapt, reperfusionExcluded: true, anticoagulationReview: 'none' } })))).toContain('clopidogrel+ASA:');
    expect(updateEncounter(state, prev => ({ ...prev, context: 'follow-up' })).dapt.reperfusionExcluded).toBeUndefined();
  });
  it('a recorded bleeding concern cannot be cleared by DAPT review attestation', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', age: '65', lastDOACType: 'none', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent' }, nihss: zeroExam, decisions: { ivt: 'Not recommended', evt: 'Not recommended' }, dapt: { anticoagulationReview: 'none', reperfusionExcluded: true, noncardioembolicConfirmed: true, antiplateletContraindicationsReviewed: true, ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false } });
    expect(render(state)).toContain('clopidogrel+ASA:');
    for (const key of ['currentICH', 'activeInternalBleeding', 'lowPlatelets', 'knownBleedingDiathesis', 'recentGIGUBleeding']) {
      expect(render({ ...state, note: { ...state.note, tnkContraindicationChecklist: { [key]: true } } })).not.toContain('clopidogrel+ASA:');
    }
  });
});
