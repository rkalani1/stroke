import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { activeNote, buildSummary, encounterNihss, newEncounter, protocolEncounter, updateEncounter } from '../src/workspace-state.js';
import { encounterOverview } from '../src/encounter-overview.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const zeroExam = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, diagnosisCategory: 'ischemic', age: '60', premorbidMRS: '0', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent', vesselOcclusion: ['M1'], ...patch.note }, aspects: '8' };
};
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);

describe('current reported NIHSS', () => {
  it('starts with an unassessed itemized examination and no imputed report', () => {
    const state = newEncounter();
    expect(state).toMatchObject({ nihssSource: 'itemized', reportedNihss: '', nihss: {} });
    expect(encounterNihss(state)).toMatchObject({ source: 'itemized', complete: false, total: null });
  });

  it.each(['', ' ', null, undefined, false, true, [], {}, 'twelve', '12 points', '0x10', '12.5', '-1', '43', Infinity, NaN])('withholds an invalid reported total %s instead of reviving a complete itemized zero', value => {
    const state = make({ nihssSource: 'reported', reportedNihss: value, nihss: zeroExam });
    expect(encounterNihss(state)).toMatchObject({ source: 'reported', complete: false, total: null, count: null, partial: null });
    expect(activeNote(state).nihss).toBe('');
    expect(protocolEncounter(state, now).anterior.nihss).toBe('');
    expect(buildSummary(state, now)).toContain('reported total missing or invalid; no current score');
    expect(buildSummary(state, now)).not.toContain('all items documented');
  });

  it.each([['0', 0], [0, 0], ['12', 12], ['42', 42], [42, 42]])('projects valid reported total %s through notes and every protocol branch', (value, expected) => {
    const state = make({ nihssSource: 'reported', reportedNihss: value, nihss: { dysarthria: 'invalid' } });
    expect(encounterNihss(state)).toMatchObject({ source: 'reported', complete: true, total: expected });
    expect(activeNote(state).nihss).toBe(expected);
    const protocol = protocolEncounter(state, now);
    for (const branch of ['anterior', 'm2', 'basilar']) expect(protocol[branch].nihss).toBe(expected);
    expect(encounterOverview(state, now).examination).toBe(`${expected}/42 · reported`);
    expect(encounterOverview(state, now).missing.map(item => item.label)).not.toContain('Reported NIHSS total');
  });

  it.each(['phone', 'video'])('keeps reported provenance and examination detail in %s documentation', consultationType => {
    const state = make({ consultationType, nihssSource: 'reported', reportedNihss: '12', note: { nihssDetails: 'Left arm weakness recorded by referring examiner.' } });
    const output = buildSummary(state, now);
    expect(output).toContain('12/42 (reported total)');
    expect(output).toContain(state.note.nihssDetails);
    expect(output).not.toMatch(/all items documented|items; partial sum/);
  });

  it('uses only the selected source in clinical screens without losing either entry', () => {
    const state = make({ nihss: zeroExam, reportedNihss: '12' });
    const selected = updateEncounter(state, { nihssSource: 'reported' });
    expect(selected.nihss).toEqual(zeroExam);
    expect(selected.reportedNihss).toBe('12');
    const screen = value => evaluateVideoTreatment({ note: activeNote(value), clock: { total: 2, label: 'LKW' }, aspects: '8', now: new Date(now) });
    expect(screen(state).evt.reason).toContain('Low-NIHSS');
    expect(screen(selected).evt.reason).not.toContain('Low-NIHSS');
    expect(render(selected)).toContain('Reported NIHSS: 12/42');
    expect(render(selected)).not.toContain('Complete NIHSS: 0/42');
    const restored = updateEncounter(selected, { nihssSource: 'itemized' });
    expect(encounterNihss(restored).total).toBe(0);
    expect(restored.reportedNihss).toBe('12');
    expect(render(restored)).toContain('Complete NIHSS: 0/42');
    expect(activeNote({ ...restored, reportedNihss: 'malformed' }).nihss).toBe(0);
  });

  it('propagates the selected source to embedded DAWN and DEFUSE-3 screening', () => {
    const state = make({ nihss: zeroExam, reportedNihss: '12', note: { lkwTime: '04:00', coreVolume: '20', penumbraVolume: '50' } });
    expect(render(state)).toContain('DAWN: No tier met (age 60, NIHSS 0, core 20 mL)');
    const selected = updateEncounter(state, { nihssSource: 'reported' });
    expect(render(selected)).toContain('DAWN: DAWN Group B age/severity/core screen met');
    expect(render(selected)).toContain('DEFUSE-3: DEFUSE-3 age/severity/perfusion screen met');
    const cleared = updateEncounter(selected, { reportedNihss: '' });
    expect(render(cleared)).toContain('DAWN: Required inputs incomplete.');
    expect(render(cleared)).toContain('DEFUSE-3: Required inputs incomplete.');
  });

  it('invalidates source-dependent reviews and generated output even when switching to the same numeric score', () => {
    const state = make({ nihss: zeroExam, reportedNihss: '0', note: { ivtContraindicationsReviewed: true }, dapt: { reperfusionExcluded: true } });
    state.draft = { text: buildSummary(state, now), stale: false };
    const switched = updateEncounter(state, { nihssSource: 'reported' });
    expect(activeNote(switched).nihss).toBe(0);
    expect(switched.note.ivtContraindicationsReviewed).toBe(false);
    expect(switched.dapt.reperfusionExcluded).toBeUndefined();
    expect(switched.draft.stale).toBe(true);
    expect(protocolEncounter(switched, now).sourceKey).not.toBe(protocolEncounter(state, now).sourceKey);
    const reviewed = { ...switched, note: { ...switched.note, ivtContraindicationsReviewed: true }, dapt: { reperfusionExcluded: true }, draft: { text: buildSummary(switched, now), stale: false } };
    const edited = updateEncounter(reviewed, { reportedNihss: '8' });
    expect(edited.note.ivtContraindicationsReviewed).toBe(false);
    expect(edited.dapt.reperfusionExcluded).toBeUndefined();
    expect(edited.draft.stale).toBe(true);
    expect(protocolEncounter(edited, now).sourceKey).not.toBe(protocolEncounter(reviewed, now).sourceKey);
  });

  it('does not let inactive malformed inputs or elapsed time change the active score and review source', () => {
    const state = make({ nihssSource: 'reported', reportedNihss: '8', note: { ivtContraindicationsReviewed: true } });
    const changed = updateEncounter(state, { nihss: { dysarthria: 'invalid', motor_arm_left: 'No movement (4)' } });
    expect(encounterNihss(changed).total).toBe(8);
    expect(changed.note.ivtContraindicationsReviewed).toBe(true);
    expect(protocolEncounter(changed, now + 60000).sourceKey).toBe(protocolEncounter(state, now).sourceKey);
    expect(protocolEncounter({ ...changed, context: 'follow-up' }, now).anterior.nihss).toBe('');
  });

  it('points missing documentation to the active report and resets both sources', () => {
    const state = make({ nihssSource: 'reported', reportedNihss: '', nihss: zeroExam });
    expect(encounterOverview(state, now).missing).toContainEqual({ label: 'Reported NIHSS total', target: 'input-reported-nihss' });
    const html = render(state);
    expect(html).toContain('id="input-reported-nihss"');
    expect(html).toContain('Reported NIHSS total (0–42)');
    expect(html).not.toContain('Enter NIHSS items');
    const reset = newEncounter();
    expect(encounterNihss(reset).total).toBeNull();
    expect(reset.nihssSource).toBe('itemized');
    expect(reset.reportedNihss).toBe('');
    expect(reset.nihss).toEqual({});
  });
});
