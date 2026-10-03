import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { caseSummary } from '../src/components/CaseBar.jsx';
import { QuickReference } from '../src/components/QuickReference.jsx';
import { PocketCards } from '../src/pocket-cards.jsx';
import { newEncounter, buildSummary, protocolEncounter, parsePreIvtBp } from '../src/workspace-state.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { evaluateIVT } from '../src/institutional-protocols.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions }, details: { ...state.details, ...patch.details }, dapt: { ...state.dapt, ...patch.dapt }, timeline: { ...state.timeline, ...patch.timeline } };
};
const ischemic = patch => make({ ...patch, note: { diagnosisCategory: 'ischemic', age: '68', weight: '72', lkwDate: '2026-10-01', lkwTime: '10:20', ...patch?.note } });
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const ready = { ichOnCT: false, disablingDeficit: true, glucose: 120, weight: 70, age: 64, preMRS: 0, evtStatus: 'not-candidate', bpSystolic: 160, bpDiastolic: 90, contraindicationsReviewed: true, consentObtained: true };
const MRI = { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, dwiLesionUnderOneThirdMCA: true };

describe('protocol IVT card imaging branches', () => {
  it('meets the CTP ratio with a 0 mL core and a qualifying mismatch volume', () => {
    expect(evaluateIVT({ ...ready, hoursFromLKW: 6, imagingPathway: { ctpCoreMl: 0, ctpRatio: '', ctpMismatchVolMl: 40 } }).eligible).toBe('consider');
    expect(evaluateIVT({ ...ready, hoursFromLKW: 6, imagingPathway: { ctpCoreMl: 0, ctpRatio: '', ctpMismatchVolMl: 8 } }).eligible).toBe('pending');
    const p = protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '06:00', coreVolume: '0', penumbraVolume: '40.25' } }), now);
    expect(p.ivt).toMatchObject({ ctpCoreMl: 0, ctpMismatchVolMl: 40.3 });
    expect('ctpRatio' in p.ivt).toBe(false);
  });
  it('pre-fills the WAKE-UP MRI rule only where it is the MRI route', () => {
    const known = protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '06:00', discoveryDate: '2026-10-01', discoveryTime: '06:00', wakeUpStrokeWorkflow: MRI } }), now);
    expect('mriDwiFlairMismatch' in known.ivt).toBe(false);
    const bedtime = protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '02:00', discoveryDate: '2026-10-01', discoveryTime: '11:00', wakeUpStrokeWorkflow: MRI } }), now);
    expect(bedtime.ivt).toMatchObject({ mriDwiFlairMismatch: true, wakeUpRecognition: true });
    const unknownNoDiscovery = protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', lkwUnknown: true, wakeUpStrokeWorkflow: MRI } }), now);
    expect('mriDwiFlairMismatch' in unknownNoDiscovery.ivt).toBe(false);
  });
  it('routes a known bedtime LKW beyond 9 h with the WAKE-UP MRI pattern to the wake-up branch', () => {
    const wake = evaluateIVT({ ...ready, hoursFromLKW: 10, wakeUpRecognition: true, imagingPathway: { mriDwiFlairMismatch: true } });
    expect(wake.eligible).toBe('consider');
    expect(wake.recommendation).toMatch(/wake-up\/unknown-onset window/);
    expect(wake.selectionSource).toMatch(/within 4\.5 h of symptom recognition/);
    expect(evaluateIVT({ ...ready, hoursFromLKW: 10, wakeUpRecognition: true, lvoOnCta: true, imagingPathway: { ctpCoreMl: 10, ctpRatio: 3, ctpMismatchVolMl: 30 } }).recommendation).toMatch(/late window \(9-24h\)/);
    expect(evaluateIVT({ ...ready, hoursFromLKW: 6, imagingPathway: { mriDwiFlairMismatch: true } }).selectionSource).toBe('Selection: MRI DWI-FLAIR mismatch (WAKE-UP; AHA/ASA 2026 COR 2a, LOE B-R).');
  });
  it('marks Encounter-filled CTP inputs and anchors the contraindications target on its own card', () => {
    const html = renderToStaticMarkup(<PocketCards />);
    const start = html.indexOf('id="pc-contraindications"');
    expect(start).toBeGreaterThan(-1);
    expect(html.slice(start, start + 600)).toContain('IVT Contraindications');
    expect(html.slice(start, start + 600)).not.toContain('Blood Pressure Management');
  });
});

describe('post-thrombolysis prompts', () => {
  const given = { drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00' } };
  it('makes the hemostatic protocol conditional on symptoms and shows the prompt beside the field', () => {
    const html = render(ischemic({ ...given, details: { reperfusionReview: 'After IV thrombolysis', hemorrhagicTransformation: 'PH1' } }));
    expect(html).toContain('Post-thrombolysis hemorrhage recorded (PH1). If symptomatic or neurologically worse: stop any alteplase infusion and start the post-lytic bleed protocol.');
    expect(html).not.toContain('start the protocol now');
    expect(html).toMatch(/data-tone="caution"><span>Post-thrombolysis hemorrhage recorded \(PH1\)/);
    const near = html.slice(html.indexOf('id="encounter-details-post-reperfusion"'));
    expect(near).toMatch(/role="status"[^>]*data-tone="caution"><span>Post-thrombolysis hemorrhage recorded \(PH1\)/);
  });
  it('keeps angioedema critical', () => {
    const html = render(ischemic({ ...given, details: { reperfusionReview: 'After IV thrombolysis', postTreatmentAngioedema: 'yes' } }));
    expect(html).toMatch(/role="alert"[^>]*data-tone="critical"><span>Post-thrombolysis angioedema recorded: airway first/);
  });
  it('keeps the reversal box off non-hemorrhage quick reference', () => {
    expect(renderToStaticMarkup(<QuickReference sub="ischemic" weightKg={80} />)).not.toContain('qr-reversal-dose');
  });
});

describe('documentation output', () => {
  const given = { drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00' } };
  it('reports the administered dose without a weight and flags implausible doses', () => {
    expect(buildSummary(ischemic({ ...given, note: { weight: '' }, actions: { ...given.actions, administeredDose: '20' } }), now)).toContain('(calculated dose unavailable: weight not documented; administered dose recorded as 20 mg)');
    expect(buildSummary(ischemic({ ...given, actions: { ...given.actions, administeredDose: '250' } }), now)).toContain('[administered dose 250 invalid; correct before interpretation]');
    expect(buildSummary(ischemic({ ...given, actions: { ...given.actions, administeredDose: '30' } }), now)).toContain('administered dose recorded as 30 mg (above the 25 mg maximum; review)');
  });
  it('prints the pre-IVT BP once when an administration carries it', () => {
    const text = buildSummary(ischemic({ ...given, details: { preIvtBP: '178/96', preIvtBPTime: '10:50' } }), now);
    expect(text).toContain('pre-IVT BP 178/96 at 10:50');
    expect(text).not.toContain('Documented pre-IVT blood pressure');
    expect(buildSummary(ischemic({ details: { preIvtBP: '178/96' } }), now)).toContain('Documented pre-IVT blood pressure: 178/96');
  });
  it('separates Pulsara timeline entries', () => {
    const text = buildSummary(ischemic({ timeline: { arrival: '2026-10-01T10:40', ctStart: '2026-10-01T10:50' } }), now);
    expect(text).toMatch(/Timeline: ED arrival: [^;]+; CT start: [^;]+;/);
  });
  it('distinguishes an invalid ABCD² and carries it into the team handoff', () => {
    const tia = patch => make({ ...patch, note: { diagnosisCategory: 'tia', age: '70', ...patch?.note } });
    expect(buildSummary(tia({ dapt: { abcd2: '8' } }), now)).toContain('[ABCD² 8 invalid; correct before interpretation]');
    expect(buildSummary(tia({ context: 'follow-up' }), now)).not.toContain('ABCD²');
    expect(buildSummary(tia({ documentFormat: 'handoff', dapt: { abcd2: '5' } }), now)).toContain('ABCD²: 5/7 (reviewed)');
  });
  it('calls the CTP screen not applicable for a known LKW within 4.5 h', () => {
    const line = formatWakeUpScreenForExport({ diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '10:30', coreVolume: '10', penumbraVolume: '60', wakeUpStrokeWorkflow: { mriAvailable: false } }, new Date(now));
    expect(line).toContain('CTP (EXTEND): not applicable (known LKW within 4.5 h)');
  });
});

describe('screens and case bar', () => {
  it('states documented CT hemorrhage before the window message', () => {
    const tnk = evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '70', reportedNihss: '8', nihssSource: 'reported', disablingDeficit: true, ctHemorrhageStatus: 'present' }, clock: { total: 6, label: 'LKW' }, now: new Date(now) }).tnk;
    expect(tnk.reason).toMatch(/^Reviewed imaging shows hemorrhage: IVT is contraindicated/);
  });
  it('reads the last plausible pre-IVT BP pair', () => {
    expect(parsePreIvtBp('10/03 02:55 192/104')).toMatchObject({ sbp: 192, dbp: 104 });
    expect(parsePreIvtBp('200/110 then 175/95 after labetalol')).toMatchObject({ text: '175/95' });
    expect(parsePreIvtBp('10/03')).toBeNull();
  });
  it('matches named ACE inhibitors only', () => {
    const given = { drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00' } };
    expect(caseSummary(ischemic({ ...given, note: { medications: 'aspirin, started April 2024' } }), now).aceInhibitor).toBe(false);
    expect(caseSummary(ischemic({ ...given, note: { medications: 'lisinopril 10 mg' } }), now).aceInhibitor).toBe(true);
  });
  it('gives the local SBP ≥220 branch for acute ICH', () => {
    expect(caseSummary(make({ note: { diagnosisCategory: 'ich', presentingBP: '240/120' } }), now).bpTitle).toMatch(/^ICH: SBP ≥220 is outside the 2022 150–220 range; local protocol: reduce about 20%/);
  });
  it('labels nimodipine label text and the local split dose separately', () => {
    const html = renderToStaticMarkup(<QuickReference sub="ich" />);
    expect(html).toContain('60 mg every 4 h for 21 days (label; cirrhosis: 30 mg every 4 h). If hypotension, local protocol splits the dose to 30 mg every 2 h.');
  });
});
