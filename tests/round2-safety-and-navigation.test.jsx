import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter, { bulkNoPatch } from '../src/Encounter.jsx';
import CaseBar from '../src/components/CaseBar.jsx';
import { QuickReference } from '../src/components/QuickReference.jsx';
import { newEncounter, buildSummary } from '../src/workspace-state.js';
import { safetyChecklistSignals } from '../src/encounter-clinical-review.js';
import { SAFETY_ITEMS, SAFETY_TIERS } from '../src/clinical/safety-items.js';
import { recommendAcuteDAPT } from '../src/calculators-extended.js';
import { buildSearchIndex, searchIndex, groupResults } from '../src/quick-search-index.js';
import { recommendationLabels } from '../src/reference-search.js';

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
    // Same boundary as the IVT screen (correct BP at >=185/>=110).
    expect(signals({ presentingBP: '185/90' }).severeUncontrolledHTN.reason).toBe('BP 185/90');
    expect(signals({ presentingBP: '184/109' }).severeUncontrolledHTN).toBeUndefined();
    expect(signals({ lastDOACType: 'heparin' }).recentHeparin.conflict).toBe(false);
    expect(signals({ lastDOACType: 'lmwh' }).recentHeparin.conflict).toBe(false);
    expect(signals({ lastDOACType: 'none', medications: 'apixaban 5 mg BID' }).medicationReconciliation.conflict).toBe(false);
    expect(signals({ lastDOACType: 'warfarin' }).warfarinElevatedINR).toEqual({ reason: 'warfarin exposure; current INR not documented', conflict: false });
    expect(signals({ lastDOACType: 'warfarin', inr: '1.2' }).warfarinElevatedINR).toBeUndefined();
  });
  it('respects the item wording for DOAC and LMWH timing', () => {
    expect(signals({ lastDOACType: 'apixaban' }).recentDOAC.conflict).toBe(true);
    expect(signals({ lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T06:00' }).recentDOAC.reason).toBe('apixaban 6 h ago');
    expect(signals({ lastDOACType: 'apixaban', lastDOACDose: '2026-09-28T12:00' }).recentDOAC).toBeUndefined();
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'therapeutic', lastDOACDose: '2026-10-01T00:00' }).recentHeparin.conflict).toBe(true);
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'therapeutic', lastDOACDose: '2026-09-29T00:00' }).recentHeparin).toBeUndefined();
    expect(signals({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'prophylactic' }).recentHeparin).toBeUndefined();
  });
  it('bulk "No" answers only unanswered items without a related entered value', () => {
    const note = { plateletCount: '80', lastDOACType: 'warfarin' };
    const patch = bulkNoPatch({ currentICH: true }, signals(note));
    expect(patch.lowPlatelets).toBeUndefined();
    expect(patch.warfarinElevatedINR).toBeUndefined();
    expect(patch.currentICH).toBeUndefined();
    expect(patch.aorticDissection).toBe(false);
    expect(Object.keys(patch)).toHaveLength(SAFETY_ITEMS.length - 3);
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
    // Display tiers follow the local IVT_ABSOLUTE_CONTRAINDICATIONS list.
    const absolute = ['elevatedAPTT', 'recentGIGUBleeding', 'recentHeparin', 'lowPlatelets', 'currentICH', 'largeInfarct', 'extensiveHypoattenuation', 'recentIntracranialSurgery', 'recentHeadTrauma', 'recentArterialPuncture', 'unrupturedAneurysm10mm', 'lecanemab'];
    expect(absolute.map(tier)).toEqual(Array(absolute.length).fill('absolute'));
    expect(['priorICH', 'recentStroke', 'pregnancy'].map(tier)).toEqual(['relative', 'relative', 'relative']);
    expect([tier('lowGlucose'), tier('highGlucose')]).toEqual(['correctable', 'correctable']);
  });
  it('shows a conflict when an entered value contradicts a No answer and keeps bulk marking from answering it', () => {
    const allNo = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
    expect(render(acute({ note: { plateletCount: '50', tnkContraindicationChecklist: allNo } }))).toContain('Safety review: 1 &quot;No&quot; answer contradicted by entered values');
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
    const reconcile = render(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'none', medications: 'apixaban stopped 2023' } }));
    expect(reconcile).toContain('Medication record names an anticoagulant despite &quot;None&quot;.');
    expect(reconcile).not.toContain('data-tone="critical"><span><strong>ICH with anticoagulant exposure');
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
  it('reads per-µL platelets as K/µL and keeps weight explicit for anticoagulated ICH', () => {
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', plateletCount: '80000' } }), now);
    expect(text).toContain('Plt 80 K/µL');
    expect(buildSummary(video({ note: { diagnosisCategory: 'ich', lastDOACType: 'apixaban' } }), now)).toContain('Wt not documented');
  });
  it('carries entered and decision-relevant labs into the telephone summary', () => {
    const phone = patch => buildSummary(make({ consultationType: 'phone', ...patch, note: { ...patch.note } }), now);
    expect(phone({ note: { diagnosisCategory: 'ischemic' } })).toContain('Plt: not documented; INR: not documented');
    expect(phone({ note: { diagnosisCategory: 'ischemic', plateletCount: '85000', inr: '1.9', weight: '500' } })).toMatch(/\(Wt: \[invalid; correct before interpretation\]\).*Plt: 85 K\/µL; INR: 1\.9/s);
    expect(phone({ context: 'follow-up', note: { diagnosisCategory: 'tia', lastDOACType: 'heparin' } })).toContain('aPTT (s): not documented');
    expect(phone({ context: 'follow-up', note: { diagnosisCategory: 'tia' } })).not.toMatch(/Plt:|INR:/);
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
    expect(html).toContain('Bleeding concerns remain: Platelet count &lt;100,000 (entered platelets 40 K/µL).');
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

describe('recommendation chips', () => {
  it('gives COR 3: No Benefit its own tone and COR 3: Harm the harm tone', () => {
    expect(recommendationLabels({ cor: '3: No Benefit', loe: 'A' }).tone).toBe('cor-3nb');
    expect(recommendationLabels({ cor: '3: Harm', loe: 'B-R' }).tone).toBe('cor-3');
    expect(recommendationLabels({ cor: '2a', loe: 'B-NR' }).tone).toBe('cor-2a');
  });
});

describe('quick search grouping', () => {
  const offline = buildSearchIndex(null);
  it('leads with the best navigation match and keeps the rest in a stable order', () => {
    const results = searchIndex(offline, 'reversal');
    const groups = groupResults(results);
    expect(groups[0][0]).toBe(results.find(r => ['Go to', 'Protocols', 'Calculators'].includes(r.group)).group);
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
