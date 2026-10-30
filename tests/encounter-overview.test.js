import { describe, expect, it } from 'vitest';
import { encounterHoldCue, encounterOverview } from '../src/encounter-overview.js';
import { newEncounter } from '../src/workspace-state.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';

const now = new Date('2026-10-01T12:00:00').getTime();
describe('encounter navigation readout', () => {
  it('keeps missing data explicit and points to the first missing input', () => {
    const result = encounterOverview(newEncounter(), now);
    expect(result).toMatchObject({ diagnosis: 'Not documented', examination: '0/15 items · incomplete', timing: 'Not documented' });
    expect(result.missing[0]).toEqual({ label: 'Working diagnosis', target: 'input-diagnosis' });
  });
  it('recognizes zero values while retaining invalid numeric entries as missing', () => {
    const s = newEncounter(); Object.assign(s.note, { diagnosisCategory: 'mimic', age: '0', weight: '0', premorbidMRS: '0' });
    // 2026-10-21: an entered but invalid value stays missing and is labelled for correction.
    expect(encounterOverview(s, now).missing.map(item => item.label)).toContain('Weight (check entry)');
    expect(encounterOverview(s, now).missing.map(item => item.label)).not.toContain('Age');
    expect(encounterOverview(s, now).missing.map(item => item.label)).not.toContain('Baseline mRS');
    s.note.age = '121'; expect(encounterOverview(s, now).missing.map(item => item.label)).toContain('Age (check entry)');
  });
  it('does not present a partial or untestable NIHSS as complete', () => {
    const s = newEncounter(); s.nihss = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
    expect(encounterOverview(s, now).examination).toBe('0/42');
    // A documented UN item completes the examination; the UN count stays visible.
    s.nihss.dysarthria = 'Intubated/other (UN)';
    expect(encounterOverview(s, now)).toMatchObject({ examination: '0/42 · 1 UN' });
    expect(encounterOverview(s, now).missing.map(item => item.label)).not.toContain('NIHSS examination');
    s.nihss.sensory = '';
    expect(encounterOverview(s, now)).toMatchObject({ examination: '14/15 items · incomplete' });
    expect(encounterOverview(s, now).missing).toContainEqual({ label: 'NIHSS examination', target: 'nihss-sensory' });
  });
  it('keeps discovery distinct from onset, ignores retained LKW while unknown, and flags invalid time', () => {
    const s = newEncounter(); Object.assign(s.note, { lkwDate: '2026-10-01', lkwTime: '10:00' });
    expect(encounterOverview(s, now).timing).toBe('120 min elapsed');
    s.note.lkwUnknown = true;
    expect(encounterOverview(s, now)).toMatchObject({ timingLabel: 'Discovery · LKW unknown', timing: 'Onset unknown' });
    Object.assign(s.note, { discoveryDate: '2026-10-01', discoveryTime: '11:00' });
    expect(encounterOverview(s, now).timing).toBe('60 min elapsed');
    s.note.discoveryTime = '13:00'; expect(encounterOverview(s, now).timing).toBe('Invalid / future time');
  });
  it('points the next cue at the same field as an IVT hold', () => {
    const s = newEncounter();
    Object.assign(s.note, { diagnosisCategory: 'ischemic', age: '72', weight: '80', premorbidMRS: '1', lkwDate: '2026-10-01', lkwTime: '10:00', ctHemorrhageStatus: 'absent', glucose: '118', presentingBP: '168/92' });
    expect(encounterHoldCue(s, now)).toEqual({ label: 'Anticoagulant exposure', target: 'input-anticoagulant' });
    s.note.lastDOACType = 'none';
    s.note.ctHemorrhageStatus = 'present';
    expect(encounterHoldCue(s, now)).toEqual({ label: 'CT hemorrhage recorded', target: 'input-ct-review' });
    s.note.diagnosisCategory = 'ich';
    expect(encounterHoldCue(s, now)).toBeNull();
  });
  it('does not require acute-only entries for follow-up or mutate state', () => {
    const s = newEncounter(); s.context = 'follow-up'; const before = JSON.stringify(s);
    expect(encounterOverview(s, now).missing.map(item => item.label)).toEqual(['Working diagnosis', 'Age', 'Weight', 'Baseline mRS', 'Disposition']);
    expect(JSON.stringify(s)).toBe(before);
  });
});
