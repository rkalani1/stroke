import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter, updateEncounter } from '../src/workspace-state.js';
import { safetyChecklistSignals } from '../src/encounter-clinical-review.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => { const s = newEncounter(); return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, details: { ...s.details, ...patch.details } }; };
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);

describe('round 9 on-call fixes', () => {
  it('lets the clinician record the agent beside the administration', () => {
    const html = render(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '10:30' }, actions: { administered: true } }));
    expect(html).toContain('id="ivt-agent-given"');
    expect(html).toContain('Not selected (required for the note)');
  });
  it('does not let bulk "No" overwrite related entries elsewhere in the Encounter', () => {
    const signals = safetyChecklistSignals({ medications: 'lisinopril 20 mg' }, new Date(now), { specialContext: 'Infective endocarditis', seizureAtOnset: 'yes' });
    expect(signals.aceInhibitor).toMatchObject({ conflict: true });
    expect(signals.infectiveEndocarditis).toMatchObject({ conflict: true });
    expect(signals.seizureAtOnset).toMatchObject({ conflict: true });
    expect(safetyChecklistSignals({}, new Date(now), { specialContext: 'Pregnancy / postpartum' }).pregnancy).toMatchObject({ conflict: false });
    expect(safetyChecklistSignals({ medications: 'aspirin' }, new Date(now)).aceInhibitor).toBeUndefined();
  });
  it('keeps the safety review after a post-treatment NIHSS re-examination', () => {
    const base = make({ note: { diagnosisCategory: 'ischemic', ivtContraindicationsReviewed: true }, nihssSource: 'reported', reportedNihss: '9' });
    const given = { ...base, actions: { ...base.actions, administered: true, administrationTime: '2026-10-01T11:20' } };
    expect(updateEncounter(given, prev => ({ ...prev, reportedNihss: '6' })).note.ivtContraindicationsReviewed).toBe(true);
    expect(updateEncounter(base, prev => ({ ...prev, reportedNihss: '6' })).note.ivtContraindicationsReviewed).toBe(false);
  });
  it('shows the reversal banner for SAH with anticoagulant exposure', () => {
    const html = render(make({ note: { diagnosisCategory: 'sah', lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T07:00', weight: '70' } }));
    expect(html).toContain('SAH with anticoagulant exposure');
    expect(html).toContain('4F-PCC 2000 units IV');
  });
});
