// Case bar BP phases and Encounter copy fixes, 2026-11-14 (audit2 logic-casebar-bp-phase, copy-01/02/06/08/09/12/13/15).
// Expected values come from the cited recommendation text, not from the implementation. AHA/ASA 2026 AIS table 16:
//  ais-2026-72 (COR 1) before IVT: SBP "below 185 mmHg and DBP below 110 mmHg".
//  ais-2026-74 (COR 1) after IVT: "below 180/105 mmHg for at least the first 24 hours".
//  ais-2026-73 (COR 2a) "EVT is planned and who have not received IVT": "at or below 185/110 mmHg before the procedure".
//  ais-2026-76 (COR 2a) "who undergo EVT": "at or below 180/105 mmHg during and for 24 hours after the procedure".
//  ais-2026-70 (COR 2b) / -71 (COR 3: No Benefit) no IVT or EVT: below 220/120 starting treatment "is not effective";
//  at or above 220/120 "the benefit ... is uncertain".
// ICH 2022: ich-2022-22 "within 2 hours of ICH onset and reaching the target within 1 hour"; ich-2022-23 "target of 140
// mm Hg (maintaining 130-150 mm Hg range)"; ich-2022-25 "<130 mm Hg is potentially harmful". Synthetic data only.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import CaseBar, { caseSummary } from '../src/components/CaseBar.jsx';
import { newEncounter, updateEncounter, buildSummary } from '../src/workspace-state.js';
import { calculateICHVolumeReviewed } from '../src/calculators.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';

const now = new Date('2026-11-14T12:00:00').getTime();
const make = (patch = {}) => {
  const s = newEncounter();
  return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, decisions: { ...s.decisions, ...patch.decisions }, details: { ...s.details, ...patch.details }, dapt: { ...s.dapt, ...patch.dapt }, volume: { ...s.volume, ...patch.volume } };
};
const ischemic = (patch = {}) => make({ ...patch, note: { diagnosisCategory: 'ischemic', age: '70', weight: '80', lkwDate: '2026-11-14', lkwTime: '09:00', ...patch.note } });
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const flag = (state, bp) => caseSummary({ ...state, note: { ...state.note, presentingBP: bp } }, now).bpTitle ?? null;

const PRE_IVT = 'Not below 185/110 (pre-IVT)';
const POST_IVT = 'Not below the post-IVT limit of 180/105';
const EVT = 'Above 180/105 (during and 24 h after EVT)';
const PRE_EVT = 'Above 185/110 (before EVT without IVT)';
const NO_REPERFUSION = 'At or above 220/120 without IVT or EVT: the benefit of starting treatment in the first 48–72 h is uncertain (AHA/ASA 2026, COR 2b)';

describe('case bar BP flag by phase (logic-casebar-bp-phase)', () => {
  const evtOnly = (punctureTime, decisions = { ivt: 'Not recommended', evt: 'Recommended' }) => ischemic({ decisions, actions: { punctureTime } });
  it('keeps the pre-IVT rule (below 185/110) while IVT is undecided, recommended or under review', () => {
    for (const ivt of ['', 'Recommended', 'Specialist review']) {
      const state = ischemic({ decisions: { ivt, evt: 'Not recommended' } });
      expect(flag(state, '185/100'), ivt).toBe(PRE_IVT);
      expect(flag(state, '180/110'), ivt).toBe(PRE_IVT);
      expect(flag(state, '184/109'), ivt).toBeNull();
    }
  });
  it('keeps the post-IVT rule (below 180/105), also when EVT follows IVT', () => {
    const given = ischemic({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-11-14T11:00', agentConfirmed: 'TNK', punctureTime: '2026-11-14T11:30' }, decisions: { ivt: 'Recommended', evt: 'Recommended' } });
    expect(flag(given, '180/100')).toBe(POST_IVT);
    expect(flag(given, '170/105')).toBe(POST_IVT);
    expect(flag(given, '179/104')).toBeNull();
  });
  it('flags above 180/105 during and for 24 h after a recorded EVT puncture', () => {
    const state = evtOnly('2026-11-14T11:00');
    expect(flag(state, '180/105')).toBeNull();
    expect(flag(state, '181/100')).toBe(EVT);
    expect(flag(state, '170/106')).toBe(EVT);
    expect(flag(state, '186/100')).toBe(EVT);
    // A puncture without a recorded IVT decision is still after EVT, never pre-IVT.
    expect(flag(evtOnly('2026-11-14T11:00', { ivt: '', evt: 'Recommended' }), '186/100')).toBe(EVT);
    // Exactly 24 h after the puncture is still within "for 24 hours after the procedure".
    expect(flag(evtOnly('2026-11-13T12:00'), '182/100')).toBe(EVT);
  });
  it('ends the EVT flag 24 h after a valid puncture time and does not fall back to the pre-IVT or pre-EVT flag', () => {
    for (const decisions of [{ ivt: 'Not recommended', evt: 'Recommended' }, { ivt: '', evt: '' }]) expect(flag(evtOnly('2026-11-13T11:00', decisions), '190/112')).toBeNull();
  });
  it('keeps the EVT flag when the entered puncture time is unusable (Encounter flags the time)', () => {
    expect(flag(evtOnly('2026-11-14T13:00'), '182/100')).toBe(EVT);
  });
  it('uses the pre-EVT limit (at or below 185/110) when IVT is not recommended and EVT is not ruled out', () => {
    for (const evt of ['Recommended', '', 'Specialist review']) {
      const state = ischemic({ decisions: { ivt: 'Not recommended', evt } });
      expect(flag(state, '185/110'), evt).toBeNull();
      expect(flag(state, '186/100'), evt).toBe(PRE_EVT);
      expect(flag(state, '170/111'), evt).toBe(PRE_EVT);
    }
  });
  it('flags only 220/120 or above when neither IVT nor EVT is recommended', () => {
    const state = ischemic({ decisions: { ivt: 'Not recommended', evt: 'Not recommended' } });
    expect(flag(state, '190/100')).toBeNull();
    expect(flag(state, '219/119')).toBeNull();
    expect(flag(state, '220/100')).toBe(NO_REPERFUSION);
    expect(flag(state, '200/120')).toBe(NO_REPERFUSION);
  });
  it('leaves the ICH and SAH rules unchanged apart from the ICH wording, and ignores EVT fields outside acute ischemic stroke', () => {
    expect(flag(make({ note: { diagnosisCategory: 'ich' } }), '170/90')).toBe('ICH: SBP 150–220 → target 140 (keep 130–150); start within 2 h of onset and reach target within 1 h; avoid <130');
    expect(flag(make({ note: { diagnosisCategory: 'ich' } }), '240/120')).toMatch(/^ICH: SBP ≥220 is outside the 2022 150–220 range/);
    expect(flag(make({ note: { diagnosisCategory: 'ich' } }), '140/95')).toBeNull();
    expect(flag(make({ note: { diagnosisCategory: 'sah' }, actions: { punctureTime: '2026-11-14T11:00' } }), '200/110')).toBeNull();
    expect(flag(make({ context: 'follow-up', note: { diagnosisCategory: 'ischemic' }, actions: { punctureTime: '2026-11-14T11:00' } }), '200/110')).toBeNull();
  });
  it('states the same text in the case bar title and the Encounter BP cue', () => {
    const declined = ischemic({ decisions: { ivt: 'Not recommended', evt: 'Not recommended' }, note: { presentingBP: '190/100' } });
    expect(renderToStaticMarkup(<CaseBar state={declined} documentLabel="note" />)).not.toContain('pre-IVT');
    expect(render(declined)).not.toContain(PRE_IVT);
    const high = { ...declined, note: { ...declined.note, presentingBP: '224/100' } };
    expect(renderToStaticMarkup(<CaseBar state={high} documentLabel="note" />)).toContain(`title="${NO_REPERFUSION}"`);
    expect(render(high)).toContain(NO_REPERFUSION);
    const evt = ischemic({ decisions: { ivt: 'Not recommended', evt: 'Recommended' }, actions: { punctureTime: '2026-11-14T11:00' }, note: { presentingBP: '183/100' } });
    expect(render(evt)).toContain(EVT);
  });
});

describe('case bar dose chip names alteplase (copy-08)', () => {
  const ready = patch => updateEncounter(newEncounter(), prev => ({ ...prev, drug: 'Alteplase', ...patch, note: { ...prev.note, diagnosisCategory: 'ischemic', age: '70', weight: '80', lkwDate: '2026-11-14', lkwTime: '10:00', lastDOACType: 'none' }, actions: { ...prev.actions, ...patch?.actions } }));
  it('labels the alteplase dose and administration "Alteplase", as the agent selector and notes do', () => {
    // 0.9 mg/kg × 80 kg = 72 mg; 10% bolus = 7.2 mg.
    expect(caseSummary(ready(), now).dose).toEqual({ label: 'Alteplase', value: '72 mg', detail: '7.2 mg bolus' });
    const given = caseSummary(ready({ actions: { administered: true, administrationTime: '2026-11-14T11:30', agentConfirmed: 'Alteplase', administeredDose: '72' } }), now).dose;
    expect(given).toMatchObject({ label: 'Alteplase given', detail: '72 mg' });
    expect(renderToStaticMarkup(<CaseBar state={ready()} documentLabel="note" />)).not.toMatch(/\btPA\b/);
  });
});

describe('Encounter ICH volume card (copy-01, copy-02)', () => {
  const ich = volume => make({ note: { diagnosisCategory: 'ich', age: '70' }, volume });
  it('names the Encounter units when the shared unit warning fires and leaves the shared string unchanged', () => {
    const html = render(ich({ a: '45', b: '30', thicknessMm: '5', numSlices: '8' }));
    expect(html).toContain('Check units: A and B in centimeters, slice thickness in millimeters.');
    expect(html).not.toContain('Confirm all three dimensions are in centimeters');
    expect(html).toContain('Confirm A and B are in centimeters and slice thickness in millimeters before scoring.');
    // The Protocols ABC/2 card shows this shared string (three centimeter dimensions); it must not change.
    expect(calculateICHVolumeReviewed({ lengthCm: 45, widthCm: 30, slicesCm: 4 }).unitWarning).toBe('Confirm all three dimensions are in centimeters. Entering millimeters for one dimension inflates ABC/2 tenfold; doing so for all three inflates it 1000-fold.');
    expect(render(ich({ a: '4', b: '3', thicknessMm: '5', numSlices: '6' }))).not.toContain('Check units:');
  });
  it('cites the ICH-specific ABC/2 accuracy study (Webb et al., Stroke 2015;46:2470-6, PMID 26243227), not the ischemic-lesion study', () => {
    const html = render(ich({ a: '4', b: '3', thicknessMm: '5', numSlices: '6' }));
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/26243227/"');
    expect(html).toContain('ABC/2 accuracy in ICH (Webb et al., Stroke 2015)');
    // Webb 2015: "accuracy decreases with large, irregular, or lobar clots".
    expect(html).toContain('ABC/2 accuracy decreases with large, irregular or lobar hematomas');
    expect(html).not.toContain('PMC2697964');
  });
});

describe('NIHSS item names (copy-09)', () => {
  it('carry no footnote mark that nothing explains, and the note keeps the item numbers', () => {
    expect(NIHSS_ITEMS.map(item => item.name).filter(name => /†/.test(name))).toEqual([]);
    expect(NIHSS_ITEMS.find(item => item.id === 'language').name).toBe('9. Best Language');
    expect(NIHSS_ITEMS.find(item => item.id === 'dysarthria').name).toBe('10. Dysarthria');
    expect(render(ischemic())).not.toContain('†');
  });
});

describe('IVT checklist wording (copy-12)', () => {
  const item = id => SAFETY_ITEMS.find(entry => entry.id === id);
  it('says the hold applies to IVT with either agent, uses Arabic COR and spaced units', () => {
    expect(item('lowGlucose').note).toBe('correct and reassess — holds IVT (either agent) until corrected');
    expect(item('elevatedAPTT').note).toBe('holds IVT (either agent) until anticoagulant effect is excluded (conservative hold)');
    expect(item('cerebralMicrobleeds').note).toBe('uncertain sICH risk (COR 2b)');
    expect(item('dualAntiplatelet').note).toBe('IVT recommended despite increased sICH (COR 1, LOE B-NR)');
    expect(item('warfarinElevatedINR').label).toBe('Warfarin use with PT >15 s, INR >1.7, or aPTT >40 s');
    expect(item('lowPlatelets').label).toBe('Platelet count <100,000/µL');
    const text = SAFETY_ITEMS.flatMap(entry => [entry.label, entry.note || '']).join('\n');
    expect(text).not.toMatch(/auto-blocks TNK|COR I{1,3}\b|COR I[IV]?[ab]?\b|\d(?:s|mm)\b/);
  });
});

describe('TIA stenosis caution (copy-13)', () => {
  const tia = (tiaSevereCarotid, lvdSymptomatic) => make({ note: { diagnosisCategory: 'tia', age: '70', lkwDate: '2026-11-14', lkwTime: '09:00' }, details: { tiaSevereCarotid }, dapt: { lvdSymptomatic } });
  const caution = 'The TIA review and this screen disagree about symptomatic stenosis';
  it('appears only when the TIA review records >50% and the DAPT screen records no ≥50% stenosis', () => {
    expect(render(tia('yes', false))).toContain(caution);
    // Exactly 50%: TIA ">50%" No and DAPT "≥50%" Yes are both correct.
    expect(render(tia('no', true))).not.toContain(caution);
    expect(render(tia('yes', true))).not.toContain(caution);
    expect(render(tia('no', false))).not.toContain(caution);
  });
});

describe('generated note wording (copy-06)', () => {
  const state = ischemic({ note: { weight: '83', sex: 'F', age: '65' } });
  it('uses sentence case for the IVT discussion and consent lines, like the EVT lines', () => {
    const text = buildSummary({ ...state, consultationType: 'video' }, now);
    expect(text).toContain('IVT discussion: not documented');
    expect(text).toContain('IVT consent status: not documented');
    expect(text).toContain('EVT discussion: not documented');
    expect(text).not.toMatch(/IVT Discussion|IVT Consent/);
  });
  it('spaces the weight unit in the phone summary and keeps the owner note format', () => {
    const text = buildSummary({ ...state, consultationType: 'phone' }, now);
    expect(text).toContain('(Wt: 83 kg)');
    expect(text).toMatch(/^65 year old female \(Wt: 83 kg\)/);
  });
});
