import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter, buildSummary } from '../src/workspace-state.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { timelineIntervals } from '../src/encounter-timeline.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => { const s = newEncounter(); return { ...s, ...patch, note: { ...s.note, ...patch.note }, details: { ...s.details, ...patch.details }, timeline: { ...s.timeline, ...patch.timeline }, ich: { ...s.ich, ...patch.ich }, volume: { ...s.volume, ...patch.volume } }; };
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const screen = (m2Segment, extra = {}) => evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '66', nihss: '7', premorbidMRS: '0', ctHemorrhageStatus: 'absent', vesselOcclusion: ['M2'], m2Segment, ...extra }, clock: { total: 3, label: 'LKW' }, aspects: '9', now: new Date(now) }).evt;

describe('round 10 remaining fixes', () => {
  it('records M2 dominance and grades EVT by segment', () => {
    expect(render(make({ note: { diagnosisCategory: 'ischemic', vesselOcclusion: ['M2'] } }))).toContain('id="input-m2-segment"');
    expect(screen('dominant-proximal').reason).toMatch(/AHA\/ASA 2026 COR 2a, LOE B-NR/);
    expect(screen('codominant').reason).toMatch(/^Codominant M2 occlusion: AHA\/ASA 2026 rates EVT COR 3: No Benefit/);
    expect(screen('').reason).toMatch(/confirm the exact segment\/dominance/);
    const state = make({ note: { diagnosisCategory: 'ischemic', vesselOcclusion: ['M2'], m2Segment: 'nondominant' } });
    expect(buildSummary(state, now)).toContain('Vessel imaging: M2 (nondominant)');
    expect(screenerPrefillFromEncounter(state, now).patch.vessel).toBe('m2_m3_nd');
    expect(screenerPrefillFromEncounter(make({ note: { diagnosisCategory: 'ischemic', vesselOcclusion: ['M2'], m2Segment: 'dominant-proximal' } }), now).patch.vessel).toBe('dominant_m2');
  });
  it('states the time zone of the note times', () => {
    expect(buildSummary(make({ note: { diagnosisCategory: 'ischemic' } }), now)).toMatch(/Times: local to the documenting device \(/);
    expect(buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ischemic' } }), now)).toMatch(/Times: local to the documenting device/);
  });
  it('reports door-in to door-out for transfers', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic' }, timeline: { arrival: '2026-10-01T10:00', departure: '2026-10-01T11:05' } });
    expect(timelineIntervals(state, now).find(item => item.label === 'Door-in to door-out')).toMatchObject({ minutes: 65 });
  });
  it('prompts a minimally invasive evacuation discussion for a lobar 30–80 mL ICH with GCS 5–14 within 24 h', () => {
    const ich = make({ note: { diagnosisCategory: 'ich', age: '70', lkwDate: '2026-10-01', lkwTime: '08:00' }, details: { ichLocation: 'Lobar' }, gcs: { eye: '3', verbal: '4', motor: '5' }, volume: { a: '5', b: '4', thicknessMm: '5', numSlices: '7' } });
    expect(render(ich)).toContain('trial population for early minimally invasive evacuation');
    expect(render({ ...ich, details: { ichLocation: 'Deep' } })).not.toContain('trial population for early minimally invasive evacuation');
  });
});

describe('round 10 note labels', () => {
  it('prints NIHSS item scores for a non-zero itemized exam', async () => {
    const { NIHSS_ITEMS } = await import('../src/clinical/nihss-items.js');
    const nihss = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
    nihss.motor_arm_left = NIHSS_ITEMS.find(item => item.id === 'motor_arm_left').options[2];
    const state = make({ note: { diagnosisCategory: 'ischemic' }, nihssSource: 'itemized', nihss });
    const text = buildSummary(state, now);
    expect(text).toMatch(/2\/42 \(all items documented\); items 1a 0, 1b 0, 1c 0, 2 0, 3 0, 4 0, 5a 2/);
    const zero = buildSummary(make({ note: { diagnosisCategory: 'ischemic' }, nihssSource: 'itemized', nihss: Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]])) }), now);
    expect(zero).not.toContain('; items 1a');
  });
});
