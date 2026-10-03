import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import CaseBar from '../src/components/CaseBar.jsx';
import { QuickReference } from '../src/components/QuickReference.jsx';
import { newEncounter, buildSummary } from '../src/workspace-state.js';
import { safetyChecklistSignals } from '../src/encounter-clinical-review.js';
import { SAFETY_ITEMS, SAFETY_TIERS } from '../src/clinical/safety-items.js';
import { recommendAcuteDAPT } from '../src/calculators-extended.js';
import { buildSearchIndex, searchIndex, groupResults } from '../src/quick-search-index.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions } };
};
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const signals = note => safetyChecklistSignals(note, now);

describe('entered values against the IVT checklist', () => {
  it('flags lab, glucose and imaging conflicts with the same thresholds as the IVT screen', () => {
    expect(signals({ plateletCount: '99' }).lowPlatelets).toEqual({ reason: 'platelets 99 K/µL', conflict: true });
    expect(signals({ plateletCount: '80000' }).lowPlatelets).toEqual({ reason: 'platelets 80 K/µL', conflict: true });
    expect(signals({ plateletCount: '150' }).lowPlatelets).toBeUndefined();
    expect(signals({ inr: '1.8', lastDOACType: 'warfarin' }).warfarinElevatedINR.conflict).toBe(true);
    expect(signals({ inr: '1.8', pt: '18' }).knownBleedingDiathesis).toEqual({ reason: 'INR 1.8, PT 18 s', conflict: true });
    expect(signals({ ptt: '45' }).elevatedAPTT.conflict).toBe(true);
    expect(signals({ glucose: '45' }).lowGlucose.conflict).toBe(true);
    expect(signals({ glucose: '450' }).highGlucose.conflict).toBe(true);
    expect(signals({ ctHemorrhageStatus: 'uncertain' }).currentICH.conflict).toBe(true);
  });
  it('treats BP, unknown dose intent and text mentions as review prompts, not conflicts', () => {
    expect(signals({ presentingBP: '190/100' }).severeUncontrolledHTN.conflict).toBe(false);
    expect(signals({ presentingBP: '185/110' }).severeUncontrolledHTN).toBeUndefined();
    expect(signals({ lastDOACType: 'heparin' }).recentHeparin.conflict).toBe(false);
    expect(signals({ lastDOACType: 'lmwh' }).recentHeparin.conflict).toBe(false);
    expect(signals({ lastDOACType: 'none', medications: 'apixaban 5 mg BID' }).medicationReconciliation.conflict).toBe(false);
  });
  it('respects the item wording for DOAC and LMWH timing', () => {
    expect(signals({ lastDOACType: 'apixaban' }).recentDOAC.conflict).toBe(true);
    expect(signals({ lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T06:00' }).recentDOAC.reason).toBe('apixaban 6 h ago');
    expect(signals({ lastDOACType: 'apixaban', lastDOACDose: '2026-09-28T12:00' }).recentDOAC).toBeUndefined();
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'therapeutic', lastDOACDose: '2026-10-01T00:00' }).recentHeparin.conflict).toBe(true);
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'therapeutic', lastDOACDose: '2026-09-29T00:00' }).recentHeparin).toBeUndefined();
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'prophylactic' }).recentHeparin).toBeUndefined();
  });
  it('only names real checklist items', () => {
    const all = signals({ plateletCount: '50', inr: '2', pt: '20', ptt: '50', glucose: '30', presentingBP: '200/120', ctHemorrhageStatus: 'present', lastDOACType: 'warfarin', medications: 'heparin' });
    const ids = new Set(SAFETY_ITEMS.map(item => item.id));
    expect(Object.keys(all).every(id => ids.has(id))).toBe(true);
  });
});

describe('Encounter safety review', () => {
  const acute = patch => make({ context: 'acute', ...patch, note: { diagnosisCategory: 'ischemic', ...patch?.note } });
  it('groups every checklist item once, with hard exclusions under the contraindicated tier', () => {
    expect(SAFETY_TIERS.flatMap(([, items]) => items).map(item => item.id).sort()).toEqual(SAFETY_ITEMS.map(item => item.id).sort());
    const tier = id => SAFETY_TIERS.find(([, items]) => items.some(item => item.id === id))[0];
    expect(['elevatedAPTT', 'recentGIGUBleeding', 'recentHeparin', 'lowPlatelets', 'currentICH'].map(tier)).toEqual(Array(5).fill('absolute'));
    expect([tier('lowGlucose'), tier('highGlucose')]).toEqual(['correctable', 'correctable']);
  });
  it('shows a conflict when an entered value contradicts a No answer and keeps bulk marking from answering it', () => {
    const html = render(acute({ note: { plateletCount: '80', tnkContraindicationChecklist: { lowPlatelets: false } } }));
    expect(html).toContain('Entered values contradict a &quot;No&quot; answer: Platelet count &lt;100,000 (platelets 80 K/µL)');
    const open = render(acute({ note: { glucose: '40' } }));
    expect(open).toContain('id="safety-bulk-skipped"');
    expect(open).toContain('Entered glucose 40 mg/dL suggests Yes.');
    expect(open).toContain('aria-describedby="safety-signal-lowGlucose"');
  });
  it('alerts on reversal for acute ICH with documented or unassessed anticoagulant exposure only', () => {
    expect(render(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'apixaban' } }))).toContain('ICH with anticoagulant exposure.');
    expect(render(make({ note: { diagnosisCategory: 'ich', lastDOACType: '', medications: 'Eliquis 5 mg BID' } }))).toContain('ICH with anticoagulant exposure in the medication record.');
    expect(render(make({ note: { diagnosisCategory: 'ich' } }))).toContain('Anticoagulant exposure not assessed.');
    expect(render(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'none' } }))).not.toContain('Reversal table');
    expect(render(make({ context: 'follow-up', note: { diagnosisCategory: 'ich', lastDOACType: 'apixaban' } }))).not.toContain('Reversal is time-critical');
  });
});

describe('documentation of decision-relevant values', () => {
  const video = patch => make({ consultationType: 'video', ...patch, note: { ...patch?.note } });
  it('keeps platelets, INR and weight explicit for acute ischemic stroke and omits incidental values', () => {
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic' } }), now);
    expect(text).toMatch(/^Reason for Consultation: Acute stroke evaluation\n/);
    expect(text).toContain('Vitals: BP not documented, Wt not documented\n');
    expect(text).toContain('Labs: Glucose not documented, Plt not documented, INR not documented\n');
    expect(text).not.toMatch(/HR not documented|SpO2 not documented|Cr not documented/);
  });
  it('requires INR with warfarin and aPTT with heparin outside the acute ischemic context', () => {
    expect(buildSummary(video({ context: 'follow-up', note: { diagnosisCategory: 'tia', lastDOACType: 'warfarin' } }), now)).toContain('INR not documented');
    expect(buildSummary(video({ context: 'follow-up', note: { diagnosisCategory: 'tia', lastDOACType: 'heparin' } }), now)).toContain('aPTT not documented');
    expect(buildSummary(video({ context: 'follow-up', note: { diagnosisCategory: 'tia' } }), now)).toContain('Labs: Glucose not documented\n');
  });
  it('marks an invalid weight instead of dropping it', () => {
    expect(buildSummary(video({ note: { diagnosisCategory: 'ischemic', weight: '900' } }), now)).toContain('Wt [weight invalid; correct before interpretation]');
  });
  it('writes the safety review state and entered-value conflicts into the note', () => {
    const text = buildSummary(make({ note: { diagnosisCategory: 'ischemic', ivtContraindicationsReviewed: true, plateletCount: '80', tnkContraindicationChecklist: { lowPlatelets: false } } }), now);
    expect(text).toContain(`IVT safety review: marked complete by clinician; ${SAFETY_ITEMS.length - 1} checklist items unanswered (checklist incomplete)`);
    expect(text).toContain('Entered values conflicting with a "No" answer: Platelet count <100,000 (platelets 80 K/µL)');
  });
});

describe('DAPT screen', () => {
  const base = { anticoagulationExcluded: true, noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true, age: 65, strokeType: 'ischemic', nihss: 2 };
  it('writes elapsed time as hours and minutes', () => {
    expect(recommendAcuteDAPT({ ...base, timeFromOnsetH: 3.1 }).rationale).toContain('within 3 h 06 min');
    expect(recommendAcuteDAPT({ ...base, timeFromOnsetH: 80 }).rationale).toContain('(80 h 00 min > 72 h)');
  });
  it('routes entered thrombocytopenia to individualized review even when the item is unanswered', () => {
    const state = make({ note: { diagnosisCategory: 'tia', age: '65', plateletCount: '40', ctHemorrhageStatus: 'absent', lkwDate: '2026-10-01', lkwTime: '06:00' }, dapt: { ...newEncounter().dapt, abcd2: '5', anticoagulationReview: 'none', reperfusionExcluded: true, noncardioembolicConfirmed: true, antiplateletContraindicationsReviewed: true, atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false, ichRisk: 'reviewed' } });
    const html = render(state);
    expect(html).not.toContain('Trial dosing: Clopidogrel');
    expect(html).toContain('Individualized review:');
  });
});

describe('case bar and quick reference on the ICH tab', () => {
  const bar = state => renderToStaticMarkup(<CaseBar state={state} documentLabel="Epic note" blocked={0} onCopy={() => {}} copyStatus="" />);
  it('links reversal to the ICH tab and shows exposure as a separate badge', () => {
    const html = bar(make({ note: { diagnosisCategory: 'ich', age: '72', sex: 'F', lastDOACType: 'apixaban' } }));
    expect(html).toContain('href="#/protocols/ich/qr-reversal"');
    expect(html).toContain('aria-label="Open Encounter: ICH · 72 F"');
    expect(html).toMatch(/class="case-bar__badge"[^>]*><span class="sr-only">Anticoagulant: <\/span>Apixaban/);
    expect(bar(make({ note: { diagnosisCategory: 'ischemic', age: '72', lastDOACType: 'apixaban' } }))).toContain('href="#/protocols/ischemic/qr-reversal"');
  });
  it('orders reversal before dosing on the ICH tab', () => {
    const ich = renderToStaticMarkup(<QuickReference sub="ich" />), ischemic = renderToStaticMarkup(<QuickReference />);
    expect(ich.indexOf('id="qr-reversal"')).toBeLessThan(ich.indexOf('id="qr-dose"'));
    expect(ischemic.indexOf('id="qr-dose"')).toBeLessThan(ischemic.indexOf('id="qr-reversal"'));
  });
});

describe('quick search grouping', () => {
  const offline = buildSearchIndex(null);
  it('leads with the group holding the best match and keeps the rest in a stable order', () => {
    const results = searchIndex(offline, 'reversal');
    const groups = groupResults(results);
    expect(groups[0][0]).toBe(results[0].group);
    expect(groups.map(([, items]) => items.length).reduce((a, b) => a + b, 0)).toBe(results.length);
  });
  it('caps long groups, reports the hidden count and expands on request', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ id: `t${i}`, group: 'Evidence', title: `T${i}` }));
    expect(groupResults(many)).toEqual([['Evidence', many.slice(0, 5), 9]]);
    expect(groupResults(many, { expanded: ['Evidence'] })).toEqual([['Evidence', many, 0]]);
    expect(groupResults(many.slice(0, 8))).toEqual([['Evidence', many.slice(0, 8), 0]]);
  });
  it('keeps quick-reference results on the ICH tab for an ICH encounter', () => {
    const ich = buildSearchIndex(null, { protocolSub: 'ich' });
    expect(searchIndex(ich, 'labetalol').map(r => r.href)).toContain('#/protocols/ich/qr-bp');
    expect(searchIndex(ich, 'reversal').map(r => r.href)).toContain('#/protocols/ich/reversal');
  });
});
