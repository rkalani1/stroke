import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import CaseBar, { caseSummary } from '../src/components/CaseBar.jsx';
import { QuickReference } from '../src/components/QuickReference.jsx';
import { reversalDoseLine } from '../src/clinical/reversal-dose.js';
import { newEncounter, buildSummary, protocolEncounter } from '../src/workspace-state.js';
import { evaluateWakeUpScreen, evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { evaluateIVT } from '../src/institutional-protocols.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions }, details: { ...state.details, ...patch.details } };
};
const render = state => renderToStaticMarkup(<Encounter state={state} update={() => {}} now={now} onGenerate={() => {}} onCopy={() => {}} copyStatus="" />);
const ischemic = patch => make({ ...patch, note: { diagnosisCategory: 'ischemic', age: '68', weight: '72', lkwDate: '2026-10-01', lkwTime: '10:20', ...patch?.note } });

describe('local-first anticoagulant reversal line', () => {
  it('leads with the fixed local 4F-PCC dose for warfarin and keeps label arithmetic as a comparison', () => {
    const line = reversalDoseLine({ weightKg: 80, agent: 'warfarin', inr: '3.1' });
    expect(line.local).toBe('INR 3.1 — 4F-PCC 2000 units IV now + vitamin K 10 mg IV; recheck INR at 30 min.');
    expect(line.comparison).toBe('Label dose at 80 kg: 25 units/kg = 2000 units (max 2500); the fixed dose may underdose heavier or high-INR patients.');
    expect(reversalDoseLine({ weightKg: 130, agent: 'warfarin', inr: '7' }).comparison).toMatch(/50 units\/kg = 5000 units \(max 5000\)/);
    expect(reversalDoseLine({ weightKg: 80, agent: 'warfarin', inr: '1.6' }).local).toMatch(/may be reasonable \(COR 2b\)/);
    expect(reversalDoseLine({ weightKg: 80, agent: 'warfarin', inr: '1.1' }).local).toBe('INR 1.1 — below the PCC range; vitamin K 10 mg IV.');
    expect(reversalDoseLine({ weightKg: 80, agent: 'warfarin' }).local).toMatch(/vitamin K 10 mg IV now; enter the INR/);
    expect(reversalDoseLine({ agent: 'warfarin', inr: '3' })).toEqual({ local: 'INR 3 — 4F-PCC 2000 units IV now + vitamin K 10 mg IV; recheck INR at 30 min.', comparison: null });
  });
  it('applies the local <24 h factor Xa trigger and idarucizumab first for dabigatran', () => {
    expect(reversalDoseLine({ weightKg: 80, agent: 'apixaban', lastDoseHours: 6.4 })).toEqual({ local: 'Apixaban, last dose 6 h ago (local trigger <24 h) — 4F-PCC 2000 units IV.', comparison: 'NCS/SCCM 50 units/kg at 80 kg = 4000 units.' });
    expect(reversalDoseLine({ agent: 'rivaroxaban' }).local).toMatch(/last-dose time unknown \(treat as within the local <24 h trigger\)/);
    expect(reversalDoseLine({ agent: 'edoxaban', lastDoseHours: 30 })).toEqual({ local: 'Edoxaban, last dose 30 h ago — beyond the local <24 h trigger; reverse only with renal impairment or an elevated anti-Xa level.', comparison: null });
    expect(reversalDoseLine({ weightKg: 80, agent: 'dabigatran' }).local).toBe('Dabigatran, last-dose time unknown — idarucizumab 5 g IV; 4F-PCC 2000 units IV only if idarucizumab is unavailable.');
    expect(reversalDoseLine({ weightKg: 80, agent: 'dabigatran', lastDoseHours: 40 }).local).toMatch(/^Dabigatran, last dose 40 h ago — reverse if residual effect is likely \(within 3–5 half-lives, renal impairment, or a prolonged thrombin time\): idarucizumab 5 g IV/);
    expect(reversalDoseLine({ weightKg: 120, agent: 'apixaban', lastDoseHours: 2 }).comparison).toBe('NCS/SCCM 50 units/kg at 120 kg = 5000 units (dosing weight capped at 100 kg).');
    expect(reversalDoseLine({ weightKg: 80, agent: 'heparin' })).toBeNull();
    expect(reversalDoseLine({ weightKg: 80 })).toBeNull();
  });
  it('shows the local line on the reversal card and in the acute ICH banner; the banner carries no weight-based dose', () => {
    const card = renderToStaticMarkup(<QuickReference sub="ich" weightKg={80} reversal={{ agent: 'apixaban', lastDoseHours: 6 }} />);
    expect(card).toContain('data-testid="qr-reversal-dose"');
    expect(card).toContain('This patient, local protocol:');
    expect(card).toContain('For comparison only: NCS/SCCM 50 units/kg at 80 kg = 4000 units.');
    const banner = render(make({ note: { diagnosisCategory: 'ich', weight: '80', lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T06:00' } }));
    expect(banner).toContain('Local protocol: Apixaban, last dose 6 h ago (local trigger &lt;24 h) — 4F-PCC 2000 units IV.');
    expect(banner).not.toContain('4000 units');
  });
});

describe('case bar after thrombolysis and for ICH', () => {
  const given = ischemic({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:50', administeredDose: '18' }, note: { presentingBP: '182/100' } });
  it('replaces the lytic countdown with the next neuro check and shows the administration', () => {
    const c = caseSummary(given, now);
    expect(c.window.text).toMatch(/^Next check /);
    expect(c.dose).toMatchObject({ label: 'TNK given', detail: '18 mg' });
  });
  it('flags BP against the phase-specific limit', () => {
    expect(caseSummary(given, now).bpTitle).toBe('Above the post-IVT limit of 180/105');
    expect(caseSummary(ischemic({ note: { presentingBP: '185/100' } }), now).bpHigh).toBe(true);
    expect(caseSummary(ischemic({ note: { presentingBP: '184/109' } }), now).bpHigh).toBe(false);
    expect(caseSummary(make({ note: { diagnosisCategory: 'ich', presentingBP: '210/110' } }), now).bpTitle).toMatch(/^ICH: SBP 150–220 → target 140/);
  });
  it('links post-lytic complications after IVT and BP targets for ICH', () => {
    const bar = state => renderToStaticMarkup(<CaseBar state={state} documentLabel="Pulsara summary" blocked={0} onCopy={() => {}} copyStatus="" />);
    const html = bar({ ...given, note: { ...given.note, medications: 'lisinopril 20 mg daily' } });
    expect(html).toContain('href="#/protocols/ischemic/qr-sich"');
    expect(html).toContain('href="#/protocols/ischemic/qr-angioedema"');
    const ich = bar(make({ note: { diagnosisCategory: 'ich', age: '74', lastDOACType: 'apixaban' } }));
    expect(ich).toContain('href="#/protocols/ich/qr-bp"');
    expect(ich).toMatch(/<a class="case-bar__badge" href="#\/protocols\/ich\/qr-reversal"/);
  });
});

describe('Encounter on-call prompts', () => {
  it('keeps INR beside warfarin for acute ICH', () => {
    const html = render(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'warfarin' } }));
    const safety = html.slice(html.indexOf('id="safety"'));
    expect(safety).toContain('aria-label="INR"');
    for (const diagnosisCategory of ['ich', 'tia', 'sah', 'cvt']) {
      const page = render(make({ note: { diagnosisCategory, lastDOACType: 'warfarin' } }));
      expect(page.split('aria-label="INR"').length - 1).toBe(1);
      expect(page.indexOf('aria-label="INR"')).toBeGreaterThan(page.indexOf('id="safety"'));
    }
    const heparin = render(make({ note: { diagnosisCategory: 'tia', lastDOACType: 'heparin' } }));
    expect(heparin.split('aria-label="aPTT (seconds)"').length - 1).toBe(1);
    expect(heparin.indexOf('aria-label="aPTT (seconds)"')).toBeGreaterThan(heparin.indexOf('id="safety"'));
  });
  it('raises neurosurgery triggers from volume, IVH and infratentorial origin', () => {
    const html = render(make({ note: { diagnosisCategory: 'ich', age: '74' }, volume: { a: '4', b: '3', thicknessMm: '5', numSlices: '8' }, ich: { ivh: true, infratentorial: true } }));
    expect(html).toContain('<li><strong>≥15 mL:</strong> early neurosurgery and stroke-service evaluation (local)</li>');
    expect(html).toContain('EVD for large IVH with impaired consciousness (COR 1, B-NR)');
    expect(html).toContain('href="#/protocols/ich/qr-ich-surgery"');
  });
  it('lists open items when an administration is recorded and links complication protocols', () => {
    const html = render(ischemic({ drug: 'TNK', note: { presentingBP: '192/104' }, actions: { administered: true, administrationTime: '2026-10-01T11:50' } }));
    expect(html).toContain('Administration recorded with open items: entered BP 192/104 not below 185/110; record the last pre-IVT BP and time');
    expect(html).toContain('id="ivt-pre-bp"');
    const recorded = render(ischemic({ drug: 'TNK', note: { presentingBP: '192/104' }, details: { preIvtBP: '178/96', preIvtBPTime: '11:40' }, actions: { administered: true, administrationTime: '2026-10-01T11:50' } }));
    expect(recorded).not.toContain('not below 185/110');
    const high = render(ischemic({ drug: 'TNK', details: { preIvtBP: '186/90' }, actions: { administered: true, administrationTime: '2026-10-01T11:50' } }));
    expect(high).toContain('documented pre-IVT BP 186/90 not below 185/110');
    expect(html).toContain('href="#/protocols/ischemic/qr-sich"');
    const bleed = render(ischemic({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:00' }, details: { hemorrhagicTransformation: 'PH2' } }));
    expect(bleed).toContain('Post-thrombolysis hemorrhage recorded (PH2)');
  });
  it('writes the recorded administered dose', () => {
    const text = buildSummary(ischemic({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T11:50', administeredDose: '18' } }), now);
    expect(text).toContain('administered dose recorded as 18 mg');
    expect(text).toContain('pre-IVT BP not documented');
    const withBp = buildSummary(ischemic({ drug: 'TNK', details: { preIvtBP: '178/96', preIvtBPTime: '11:40' }, actions: { administered: true, administrationTime: '2026-10-01T11:50' } }), now);
    expect(withBp).toMatch(/IVT administration: TNK at [^\n]*; pre-IVT BP 178\/96 at 11:40/);
  });
});

describe('wake-up stroke with a known bedtime LKW', () => {
  const base = { age: '64', nihss: '8', ctHemorrhageStatus: 'absent', lkwUnknown: false, lkwDate: '2026-10-01', lkwTime: '03:45', discoveryDate: '2026-10-01', discoveryTime: '11:15',
    wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: true } };
  it('runs the WAKE-UP MRI screen without discarding the LKW', () => {
    expect(evaluateWakeUpScreen(base, new Date(now))).toMatchObject({ wakeUpApplicable: true, wakeUpEligible: true });
    expect(formatWakeUpScreenForExport(base, new Date(now))).toContain('MRI (WAKE-UP): partial source screen met');
    const early = { ...base, lkwTime: '10:30' };
    expect(evaluateWakeUpScreen(early, new Date(now)).wakeUpApplicable).toBe(false);
    expect(formatWakeUpScreenForExport(early, new Date(now))).toContain('not applicable (known LKW within 4.5 h)');
  });
  it('keeps the prerequisites first and states the window when no imaging-selected screen applies', () => {
    const note = { diagnosisCategory: 'ischemic', age: '79', nihss: '22', disablingDeficit: true, ctHemorrhageStatus: 'absent', lastDOACType: 'none', presentingBP: '150/80', glucose: '120' };
    const pendingReview = evaluateVideoTreatment({ note, clock: { total: 10, label: 'LKW' }, now: new Date(now) });
    expect(pendingReview.tnk.reason).toBe('Complete the IVT contraindication review. 10.0 h from LKW is outside the standard 4.5 h window; IVT only through an imaging-selected extended-window pathway.');
    const reviewed = evaluateVideoTreatment({ note: { ...note, ivtContraindicationsReviewed: true }, clock: { total: 10, label: 'LKW' }, now: new Date(now) });
    expect(reviewed.tnk.reason).toMatch(/^Outside the standard IVT window/);
    expect(evaluateVideoTreatment({ note, clock: { total: 3, label: 'LKW' }, now: new Date(now) }).tnk.reason).toBe('Complete the IVT contraindication review.');
  });
});

describe('protocol cards follow the Encounter', () => {
  it('requires the full WAKE-UP criteria in the protocol IVT wake-up branch text', () => {
    const r = evaluateIVT({ ichOnCT: false, disablingDeficit: true, wakeUpOrUnknownOnset: true, glucose: 120, weight: 70, age: 64, preMRS: 0, evtStatus: 'not-candidate', bpSystolic: 160, bpDiastolic: 90, contraindicationsReviewed: true });
    expect([].concat(r.reason).join(' ')).toMatch(/DWI lesion smaller than one-third of the MCA territory, treated within 4\.5 h of symptom recognition/);
  });
  it('pre-fills the MRI mismatch and EVT branch from Encounter', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00', vesselOcclusion: ['Basilar'], wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, dwiLesionUnderOneThirdMCA: true } } });
    const p = protocolEncounter(state, now);
    expect(p.evtBranch).toBe('basilar');
    expect(p.ivt.mriDwiFlairMismatch).toBe(true);
    expect(protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', vesselOcclusion: ['M2'] } }), now).evtBranch).toBe('m2-distal');
    expect(protocolEncounter(make({ note: { diagnosisCategory: 'ischemic' } }), now).ivt).not.toHaveProperty('mriDwiFlairMismatch');
  });
});

describe('protocol deep links and search', () => {
  it('routes EVT, posterior, safety-pause and ICH-only cards', () => {
    expect(parseWorkspaceRoute('#/protocols/ischemic/evt')).toEqual({ surface: 'protocols', sub: 'ischemic', target: 'evt' });
    expect(parseWorkspaceRoute('#/protocols/ischemic/posterior').target).toBe('posterior');
    expect(parseWorkspaceRoute('#/protocols/ich/qr-sah').target).toBe('qr-sah');
    expect(parseWorkspaceRoute('#/protocols/ischemic/qr-sah').surface).toBe('retired');
  });
  it('finds protocol content for common on-call phrasing', () => {
    const index = buildSearchIndex(null, { protocolSub: 'ich' });
    const hrefs = q => searchIndex(index, q).map(r => r.href);
    expect(hrefs('EVT eligibility')).toContain('#/protocols/ischemic/evt');
    expect(hrefs('basilar')).toContain('#/protocols/ischemic/posterior');
    expect(hrefs('safety pause')).toContain('#/protocols/ischemic/safety-pause');
    expect(hrefs('ICH reversal')).toContain('#/protocols/ich/qr-reversal');
    expect(hrefs('coumadin')).toContain('#/protocols/ich/qr-reversal');
    expect(hrefs('tnk bleed')).toContain('#/protocols/ich/qr-sich');
    expect(hrefs('nimodipine')).toContain('#/protocols/ich/qr-sah');
  });
});

describe('telephone summary detail lines', () => {
  it('separates detail entries instead of running them together', () => {
    const state = make({ consultationType: 'phone', note: { diagnosisCategory: 'ich' }, details: { ichBpPlan: 'nicardipine to SBP 140', ichReversalStatus: 'Administered' } });
    const text = buildSummary(state, now);
    expect(text).not.toContain('\n');
    expect(text).not.toMatch(/SBP 140 ICH reversal status/);
  });
});

describe('TIA and secondary prevention', () => {
  it('blocks the DAPT screen when AF or a cardioembolic mechanism is documented', async () => {
    const { daptAnticoagulationReview } = await import('../src/workspace-state.js');
    const state = make({ note: { diagnosisCategory: 'tia', lastDOACType: 'none' }, dapt: { anticoagulationReview: 'none' }, details: { afDetected: 'yes' } });
    expect(daptAnticoagulationReview(state)).toMatchObject({ excluded: false });
    expect(daptAnticoagulationReview({ ...state, details: { toastClassification: 'Cardioembolism' } })).toMatchObject({ excluded: false, reason: expect.stringMatching(/^A cardioembolic mechanism is documented in Etiology; the DAPT source trials excluded it\. Choose antithrombotic therapy by the specific source\.$/) });
    expect(daptAnticoagulationReview({ ...state, details: { toastClassification: 'Cardioembolism' } }).afTiming).toBeUndefined();
  });
  it('offers ticagrelor plus aspirin for TIA with symptomatic stenosis whatever the ABCD2, and states the 7-day window', async () => {
    const { recommendAcuteDAPT } = await import('../src/calculators-extended.js');
    const base = { anticoagulationExcluded: true, noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true, age: 62, strokeType: 'tia' };
    expect(recommendAcuteDAPT({ ...base, abcd2: 3, lvdSymptomatic: true, atherosclerotic: true, timeFromOnsetH: 6 })).toMatchObject({ regimen: 'ticagrelor+ASA', duration: '30 days', class: 'COR 2b, LOE B-R (AHA/ASA 2026 AIS)' });
    expect(recommendAcuteDAPT({ ...base, abcd2: 5, timeFromOnsetH: 30 }).rationale).toMatch(/at least within 7 days \(COR 1, LOE A\)/);
  });
  it('states "not recommended" for a non-disabling deficit before asking for the checklist', () => {
    const r = evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '70', nihss: '3', disablingDeficit: false, ctHemorrhageStatus: 'absent', lastDOACType: 'none' }, clock: { total: 2, label: 'LKW' }, now: new Date(now) });
    expect(r.tnk.reason).toMatch(/^Non-disabling deficit documented: IVT is not recommended/);
    const pendingReview = evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', age: '70', nihss: '8', disablingDeficit: true, ctHemorrhageStatus: 'absent', lastDOACType: 'none' }, clock: { total: 2, label: 'LKW' }, now: new Date(now) });
    expect(pendingReview.tnk.reason).toBe('Complete the IVT contraindication review.');
  });
  it('writes the reviewed ABCD2 into TIA notes and imports AF into the trial screener', async () => {
    const { screenerPrefillFromEncounter } = await import('../src/evidence/screener-prefill.js');
    const tia = make({ note: { diagnosisCategory: 'tia', age: '62' }, dapt: { ...newEncounter().dapt, abcd2: '5' }, details: { afDetected: 'no' } });
    expect(buildSummary(tia, now)).toContain('ABCD²: 5/7 (reviewed)');
    const prefill = screenerPrefillFromEncounter(tia, now);
    expect(prefill.patch.afibHistory).toBe(false);
    expect(prefill.summary).toContain('no AF documented');
  });
  it('ignores filler words in search', () => {
    const index = buildSearchIndex({ topics: [{ id: 'af-timing', title: 'AF after ischemic stroke: anticoagulation timing', keywords: ['when to start', 'apixaban'] }] });
    expect(searchIndex(index, 'when to start anticoagulation').map(r => r.id)).toContain('topic:af-timing');
    expect(searchIndex(index, 'apixaban timing').map(r => r.id)).toContain('topic:af-timing');
  });
});
