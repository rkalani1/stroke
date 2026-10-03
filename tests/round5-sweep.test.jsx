import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import CaseBar from '../src/components/CaseBar.jsx';
import { QuickReference } from '../src/components/QuickReference.jsx';
import { newEncounter, buildSummary, encounterVolume, daptAnticoagulationReview } from '../src/workspace-state.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { evaluateDAWN } from '../src/calculators-extended.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';
import { eligibilityTables, PHASE_LABELS } from '../src/evidence/eligibilityTables.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions }, details: { ...state.details, ...patch.details }, dapt: { ...state.dapt, ...patch.dapt }, ich: { ...state.ich, ...patch.ich }, volume: { ...state.volume, ...patch.volume }, gcs: { ...state.gcs, ...patch.gcs } };
};
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const ich = patch => make({ ...patch, note: { diagnosisCategory: 'ich', age: '70', ...patch?.note }, gcs: { eye: '4', verbal: '5', motor: '6', ...patch?.gcs } });

describe('ICH volume, score and neurosurgery prompts', () => {
  it('never rounds the shown volume up across a threshold', () => {
    expect(encounterVolume({ a: '3.7', b: '2.7', thicknessMm: '5', numSlices: '12' })).toMatchObject({ volume: 29.9, isLarge: false });
    expect(encounterVolume({ a: '3.7', b: '2.7', thicknessMm: '5', numSlices: '6' })).toMatchObject({ volume: 14.9, meetsNonTraumaticIphDualConsultVolume: false });
    expect(encounterVolume({ a: '4.2', b: '3.6', thicknessMm: '5', numSlices: '6' }).volume).toBe(22.7);
  });
  it('withholds the ICH score, the volume trigger and the note value when units look wrong', () => {
    const state = ich({ volume: { a: '37', b: '2.7', thicknessMm: '5', numSlices: '12' }, ich: { ivh: false, infratentorial: false } });
    const html = render(state);
    expect(html).toContain('Confirm the ABC/2 dimensions are in centimeters before scoring.');
    expect(html).not.toContain('≥15 mL: early neurosurgery');
    const note = buildSummary(state, now);
    expect(note).toContain('[ABC/2 volume 299.7 mL implausible; confirm centimeter units before interpretation]');
    expect(note).not.toContain('ICH score:');
  });
  it('prompts neurosurgery from recorded hydrocephalus, decline, mass effect and cerebellar location', () => {
    const html = render(ich({ details: { ichHydrocephalus: 'yes', ichDeterioration: 'yes', ichMassEffect: 'yes', ichLocation: 'Cerebellar' } }));
    expect(html).toContain('<li><strong>Hydrocephalus:</strong> neurosurgery at any size and urgent EVD evaluation (local); EVD when hydrocephalus lowers consciousness (COR 1, B-NR)</li>');
    expect(html).toContain('<li><strong>Neurologic decline:</strong> neurosurgery at any size (local); repeat CT (COR 2a, C-LD)</li>');
    expect(html).toContain('<li><strong>Mass effect:</strong> neurosurgery at any size (local)</li>');
    // The most urgent action (immediate evacuation for cerebellar ICH) leads the list.
    expect(html).toMatch(/<ul class="workspace-trigger-list"><li><strong>Infratentorial:<\/strong> cerebellar ICH/);
    expect(html).toContain('Neurosurgery trigger recorded: see the Neurosurgery list under ICH severity.');
    const conflict = ich({ volume: { a: '3', b: '2', thicknessMm: '5', numSlices: '6' }, ich: { ivh: false, infratentorial: false }, details: { ichLocation: 'Brainstem' } });
    expect(render(conflict)).toContain('ICH location is brainstem but Infratentorial origin is No; reconcile before scoring.');
    const conflictNote = buildSummary(conflict, now);
    expect(conflictNote).toContain('Infratentorial origin: absent (reviewed) [conflicts with ICH location Brainstem; reconcile before interpretation]');
    expect(conflictNote).not.toContain('ICH score:');
  });
  it('carries ICH reversal, neurosurgery, the ICH score and the reversal time into the team handoff', () => {
    const state = ich({ documentFormat: 'handoff', volume: { a: '3', b: '2', thicknessMm: '5', numSlices: '6' }, ich: { ivh: false, infratentorial: false }, details: { ichReversalStatus: 'Administered', ichNeurosurgery: 'Ordered', ichHydrocephalus: 'yes' }, timeline: { reversal: '2026-10-01T11:30' } });
    const text = buildSummary({ ...state, timeline: { reversal: '2026-10-01T11:30' } }, now);
    expect(text).toMatch(/ICH score: \d\/6/);
    expect(text).toContain('ICH hydrocephalus: Yes');
    expect(text).toMatch(/Diagnosis-specific review & plans:[^]*ICH hydrocephalus: Yes[^]*\nICH reversal administration: /);
  });
});

describe('safety, DAPT and BP guidance', () => {
  it('states the local <14 day surgery window on the checklist', () => {
    const item = SAFETY_ITEMS.find(entry => entry.id === 'recentMajorSurgery');
    expect(item.label).toBe('Recent major non-CNS surgery or trauma');
    expect(item.note).toMatch(/^Local list: major extracranial surgery or trauma <14 days\./);
  });
  it('withholds a DAPT regimen when the TIA review records a suspected cardioembolic source', () => {
    const state = make({ note: { diagnosisCategory: 'tia', lastDOACType: 'none' }, dapt: { anticoagulationReview: 'none' }, details: { tiaCardioembolic: 'yes' } });
    expect(daptAnticoagulationReview(state)).toMatchObject({ excluded: false, reason: expect.stringMatching(/^A suspected cardioembolic source is recorded in the TIA review/) });
  });
  it('shows the BP target where BP is entered and marks flagged case-bar values with a glyph', () => {
    const state = ich({ note: { presentingBP: '196/104' } });
    expect(render(state)).toMatch(/data-tone="caution"><span>ICH: SBP 150–220 → target 140/);
    const bar = renderToStaticMarkup(<CaseBar state={state} documentLabel="Pulsara summary" blocked={0} onCopy={() => {}} copyStatus="" />);
    expect(bar).toContain('class="case-bar__flag" aria-hidden="true">!</span>');
    expect(bar).toContain('<span class="sr-only">, ICH: SBP 150–220');
    expect(bar).toContain('Copy note<span class="sr-only"> (Pulsara summary)</span>');
    expect(bar).not.toContain('aria-label="Copy');
  });
  it('makes the ticking LKW countdown a timer and announces only threshold crossings', () => {
    const html = render(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '11:00' } }));
    expect(html).toMatch(/role="timer" data-tone="value"|data-tone="value" role="timer"/);
    expect(render(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '07:00' } }))).toContain('role="status">4.5 h from last known well has passed.</span>');
  });
  it('separates basilar NIHSS 6–9 with the AHA/ASA 2026 COR 2b statement', () => {
    const evt = evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '70', nihss: '8', disablingDeficit: true, ctHemorrhageStatus: 'absent', premorbidMRS: '0', vesselOcclusion: ['Basilar'] }, clock: { total: 14, label: 'LKW' }, pcAspects: '8', now: new Date(now) }).evt;
    expect(evt.reason).toMatch(/NIHSS 6–9 with pc-ASPECTS ≥6: EVT benefit within 24 h is not well established \(AHA\/ASA 2026, COR 2b, B-R\)/);
  });
});

describe('notes, calculators and content', () => {
  it('says every checklist item was answered No when none are unanswered', () => {
    const checklist = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
    const text = buildSummary(make({ note: { diagnosisCategory: 'ischemic', tnkContraindicationChecklist: checklist, ivtContraindicationsReviewed: true } }), now);
    expect(text).toContain('Recorded safety concerns: none; every checklist item answered No');
  });
  it('clears the shared dose intent when the anticoagulant changes', async () => {
    const { updateEncounter } = await import('../src/workspace-state.js');
    const ufh = make({ note: { diagnosisCategory: 'ischemic', lastDOACType: 'heparin', anticoagulantDoseIntent: 'prophylactic' } });
    const lmwh = updateEncounter(ufh, prev => ({ ...prev, note: { ...prev.note, lastDOACType: 'lmwh' } }));
    expect(lmwh.note.anticoagulantDoseIntent).toBe('');
    const same = updateEncounter(ufh, prev => ({ ...prev, note: { ...prev.note, medications: 'aspirin' } }));
    expect(same.note.anticoagulantDoseIntent).toBe('prophylactic');
  });
  it('documents UFH dose intent', () => {
    expect(buildSummary(make({ note: { diagnosisCategory: 'ischemic', lastDOACType: 'heparin', anticoagulantDoseIntent: 'prophylactic' } }), now)).toContain('UFH dose intent: prophylactic SC');
  });
  it('formats DAWN window messages as h:mm and uses the official limb-ataxia wording', () => {
    expect(evaluateDAWN({ age: 70, nihss: 12, coreMl: 10, timeFromLKWh: 2.2249222 }).reason).toBe('Outside DAWN window (6-24h); LKW 2:13');
    expect(NIHSS_ITEMS.find(item => item.id === 'limb_ataxia').options).toEqual(['Absent (0)', 'Present in one limb (1)', 'Present in two limbs (2)', 'Amputation/joint fusion (UN)']);
  });
  it('finds the post-lytic bleed card from symptom phrasing', () => {
    const index = buildSearchIndex(null);
    expect(searchIndex(index, 'headache after tnk').map(result => result.href)).toContain('#/protocols/ischemic/qr-sich');
    expect(searchIndex(index, 'vomiting after tpa').map(result => result.href)).toContain('#/protocols/ischemic/qr-sich');
  });
  it('scopes the sICH card to the first 24 h after thrombolysis', () => {
    expect(renderToStaticMarkup(<QuickReference />)).toContain('Guideline scope: symptomatic ICH within 24 h of IV thrombolysis (AHA/ASA 2019).');
  });
  it('keeps the reference cards on the current guideline grades', () => {
    const vascular = fs.readFileSync(new URL('../src/reference/expanded-vascular.json', import.meta.url), 'utf8');
    expect(vascular).toContain('EVT is reasonable for a disabling dominant proximal M2 occlusion within 6 h with NIHSS ≥6, ASPECTS ≥6 and prestroke mRS 0–1 (AHA 2026, 2a).');
    expect(vascular).not.toContain('disabling dominant or proximal M2 occlusion (AHA 2026, 2a');
    expect(vascular).toContain('LDL-C <55 and non-HDL-C <85 mg/dL, adding ezetimibe and/or a PCSK9 antibody as needed (COR 1)');
    expect(vascular).toContain('percutaneous left atrial appendage closure is reasonable (ACC/AHA 2023, 2a; AHA 2021 stroke guideline 2b if at least 45 days of anticoagulation can be tolerated); with high bleeding risk on anticoagulation it may be an alternative (ACC/AHA 2023, 2b).');
  });
  it('labels outpatient trial tables Day 14 onward', () => {
    expect(PHASE_LABELS.outpatient).toBe('Outpatient (Day 14 Onward)');
    expect(eligibilityTables.filter(table => table.phase === 'outpatient').map(table => table.title)).toEqual(['Ischemic Stroke — Outpatient (Day 14 Onward)', 'Intracerebral Hemorrhage (ICH) — Outpatient (Day 14 Onward)']);
  });
});

describe('round-6 review follow-ups', () => {
  it('floors DAWN elapsed time so a time just under 6 h never reads 6:00', () => {
    expect(evaluateDAWN({ age: 70, nihss: 12, coreMl: 10, timeFromLKWh: 5.996 }).reason).toBe('Outside DAWN window (6-24h); LKW 5:59');
  });
  it('shows the hypoperfused-volume hint only on the DEFUSE-3 row', () => {
    const html = render(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '04:00', coreVolume: '50', penumbraVolume: '30' } }));
    expect(html).toContain('DAWN: Required inputs incomplete.');
    expect(html).toContain('DEFUSE-3: Total hypoperfused volume (Tmax &gt;6 s) is below the core');
  });
  it('applies the TIA-review DAPT checks only while the diagnosis is TIA', () => {
    const base = { note: { lastDOACType: 'none' }, dapt: { anticoagulationReview: 'none' }, details: { tiaCardioembolic: 'yes' } };
    expect(daptAnticoagulationReview(make({ ...base, note: { ...base.note, diagnosisCategory: 'ischemic' } })).excluded).toBe(true);
  });
  it('announces LKW milestones only for acute ischemic stroke', () => {
    expect(render(ich({ note: { lkwDate: '2026-10-01', lkwTime: '07:00' } }))).not.toContain('4.5 h from last known well has passed.');
  });
  it('leads deterioration and hypertension searches with the ICH surgery and BP cards', () => {
    const index = buildSearchIndex(null, { protocolSub: 'ich' });
    expect(searchIndex(index, 'ich deterioration')[0].href).toBe('#/protocols/ich/qr-ich-surgery');
    expect(searchIndex(index, 'hypertension').map(result => result.href)).toContain('#/protocols/ich/qr-bp');
  });
});
