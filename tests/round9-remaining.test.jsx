import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { caseSummary } from '../src/components/CaseBar.jsx';
import { newEncounter, buildSummary } from '../src/workspace-state.js';
import { SAFETY_ITEMS, BENEFIT_ITEM_IDS } from '../src/clinical/safety-items.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => { const s = newEncounter(); return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, details: { ...s.details, ...patch.details }, decisions: { ...s.decisions, ...patch.decisions }, timeline: { ...s.timeline, ...patch.timeline } }; };
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const allNo = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));

describe('round 9 remaining fixes', () => {
  it('records benefit-tier answers without counting them as safety concerns', () => {
    expect([...BENEFIT_ITEM_IDS].sort()).toEqual(['aceInhibitor', 'dualAntiplatelet', 'intracranialAneurysm', 'recentMI', 'seizureAtOnset']);
    const state = make({ note: { diagnosisCategory: 'ischemic', age: '71', lkwDate: '2026-10-01', lkwTime: '10:00', ivtContraindicationsReviewed: true, tnkContraindicationChecklist: { ...allNo, aceInhibitor: true } } });
    const html = render(state);
    expect(html).toContain('Recorded (IVT benefit generally outweighs risk): ACE inhibitor use');
    expect(html).not.toMatch(/1 concern: ACE inhibitor use/);
    const text = buildSummary(state, now);
    expect(text).toContain('Recorded safety concerns: none among contraindications');
    expect(text).toContain('Recorded factors where IVT benefit generally outweighs risk: ACE inhibitor use');
    expect(text).not.toContain('recorded concerns remain');
  });
  it('counts down the 4.5 h-from-discovery limit for unknown-onset ischemic stroke', () => {
    const wake = make({ note: { diagnosisCategory: 'ischemic', lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '11:00' } });
    expect(caseSummary(wake, now).window).toMatchObject({ text: '4.5 h from discovery in 3:30', short: 'Disc 3:30' });
    expect(render(wake)).toContain('WAKE-UP MRI limit (4.5 h from discovery) in 3:30');
    expect(caseSummary({ ...wake, note: { ...wake.note, diagnosisCategory: 'ich' } }, now).window.text).toBe('since discovery');
  });
  it('limits lytic countdowns and the AF-timing link to ischemic encounters', () => {
    const ich = render(make({ note: { diagnosisCategory: 'ich', lkwDate: '2026-10-01', lkwTime: '10:00' } }));
    expect(ich).not.toContain('· 4.5 h in');
    expect(ich).not.toContain('href="#/evidence/af-timing"');
    expect(render(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '10:00' } }))).toContain('· 4.5 h in');
  });
  it('drops the case-bar dose once IVT is not recommended', () => {
    const base = { note: { diagnosisCategory: 'ischemic', weight: '80', lkwDate: '2026-10-01', lkwTime: '10:00' } };
    expect(caseSummary(make(base), now).dose).not.toBeNull();
    expect(caseSummary(make({ ...base, decisions: { ivt: 'Not recommended' } }), now).dose).toBeNull();
  });
  it('flags an IVT record that precedes LKW or contradicts the decision, and names the anticoagulant', () => {
    const given = make({ drug: 'TNK', note: { diagnosisCategory: 'ischemic', weight: '80', lkwDate: '2026-10-01', lkwTime: '10:00' }, actions: { administered: true, administrationTime: '2026-10-01T01:20' }, decisions: { ivt: 'Not recommended' } });
    const text = buildSummary(given, now);
    expect(text).toContain('[IVT time precedes LKW; review recorded dates/times]');
    expect(text).toContain("[IVT clinician decision is 'Not recommended'; reconcile]");
    expect(buildSummary(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'heparin' } }), now)).toContain('Anticoagulant exposure: heparin (UFH)');
  });
  it('offers the reversal status fields for SAH', () => {
    expect(render(make({ note: { diagnosisCategory: 'sah' } }))).toContain('Anticoagulant reversal status');
  });
});
