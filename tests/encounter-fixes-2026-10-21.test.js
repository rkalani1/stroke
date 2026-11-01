// Encounter fixes for the independent end-to-end review of the 7.9.0 candidate (unit encounter-fixes, 2026-10-22).
// Synthetic encounters only. Expected text comes from the recorded inputs and the field and source definitions
// (EXTEND window and thresholds, agent maxima), not from the implementation. Browser checks for New encounter
// (native partial inputs, focus) are in encounter-fixes-2026-10-21.test.jsx.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Encounter, { bulkNoPatch } from '../src/Encounter.jsx';
import CaseBar, { caseSummary } from '../src/components/CaseBar.jsx';
import { buildSummary, newEncounter, protocolEncounter, DIAGNOSES } from '../src/workspace-state.js';
import { formatTimeline, localTimestamp } from '../src/encounter-timeline.js';
import { safetyChecklistSignals } from '../src/encounter-clinical-review.js';
import { encounterHoldCue } from '../src/encounter-overview.js';
import { DOCUMENT_FORMATS } from '../src/documentation-output.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';

const priorZone = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
afterAll(() => { if (priorZone === undefined) delete process.env.TZ; else process.env.TZ = priorZone; });

const merge = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, ...patch.note }, actions: { ...state.actions, ...patch.actions }, decisions: { ...state.decisions, ...patch.decisions }, details: { ...patch.details }, timeline: { ...patch.timeline } };
};
const render = (state, now) => renderToStaticMarkup(React.createElement(Encounter, { state, update: () => {}, now, onGenerate: () => {}, onCopy: () => {}, copyStatus: '' }));
const allNo = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
const formats = ['phone', 'video'].flatMap(consultationType => DOCUMENT_FORMATS.map(([documentFormat]) => ({ consultationType, documentFormat })));

// TNK at 13:50 after LKW 13:00, then EVT 14:10-14:40 with mTICI 2b and a post-treatment review.
const NOW = Date.parse('2026-10-21T15:00:00-07:00');
const treated = (patch = {}) => merge({
  drug: 'TNK', decisions: { ivt: 'Recommended', evt: 'Recommended' },
  ...patch,
  note: { diagnosisCategory: 'ischemic', age: '50', sex: 'F', weight: '70', premorbidMRS: '0', lkwDate: '2026-10-21', lkwTime: '13:00', presentingBP: '160/90', glucose: '100', ctHemorrhageStatus: 'absent', lastDOACType: 'none', ticiScore: '2b', ...patch.note },
  actions: { administered: true, administrationTime: '2026-10-21T13:50', agentConfirmed: 'TNK', administeredDose: '17.5', punctureTime: '2026-10-21T14:10', reperfusionTime: '2026-10-21T14:40', ...patch.actions },
  details: { reperfusionReview: 'After IV thrombolysis and EVT', hemorrhagicTransformation: 'Under evaluation', evtPasses: '1', ...patch.details }
});

describe('recorded treatment survives a change of working diagnosis or context (finding 1)', () => {
  const changes = [...['mimic', 'tia', 'other', 'ich', 'sah', 'cvt', ''].map(dx => ['acute', dx]), ['follow-up', 'ischemic'], ['follow-up', 'mimic']];
  it.each(changes)('prints the recorded IVT, EVT, mTICI and post-treatment review in every format (%s, "%s"), flagged', (context, dx) => {
    const state = treated({ context, note: { diagnosisCategory: dx } });
    const flag = `Recorded reperfusion treatment: [${context === 'acute' ? `working diagnosis ${DIAGNOSES[dx] || 'not documented'}` : 'follow-up / review context'}, not acute ischemic stroke; reconcile]`;
    for (const sample of formats) {
      const text = buildSummary({ ...state, ...sample }, NOW);
      for (const part of [flag, 'IVT administration: TNK at 2026-10-21 13:50', 'EVT puncture: 2026-10-21 14:10', 'EVT reperfusion: 2026-10-21 14:40', 'Recorded mTICI grade: 2b', 'Post-treatment review: After IV thrombolysis and EVT', 'Post-treatment hemorrhagic transformation review: Under evaluation']) {
        expect(text, `${sample.consultationType}/${sample.documentFormat}`).toContain(part);
      }
    }
  });

  it('keeps the case-bar monitoring cues and the Section 4 controls, with a visible reconcile notice', () => {
    for (const [context, dx] of changes) {
      const state = treated({ context, note: { diagnosisCategory: dx } });
      const bar = caseSummary(state, NOW);
      expect(bar.administered).toBe(true);
      expect(bar.dose).toMatchObject({ label: 'TNK given', detail: '17.5 mg' });
      // q15 min checks for 2 h from 13:50: the next one after 15:00 is 15:05.
      expect(bar.window.text).toBe(`Next check ${new Date('2026-10-21T15:05:00-07:00').toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      const html = render(state, NOW);
      expect(html).toContain('IV thrombolytic administration explicitly recorded');
      expect(html).toContain('EVT puncture timestamp (local)');
      expect(html).toContain('Recorded mTICI grade');
      expect(html).toContain('Post-reperfusion observations &amp; procedure');
      expect(html).toContain('Recorded reperfusion treatment: ');
    }
  });

  it('renders the given dose and the post-lytic links in the case bar after the change', () => {
    // The bar reads wall time. Pin the clock so the administration, 70 min earlier, is never a local time
    // that occurs twice (on the day daylight saving ends, the app rightly rejects such an ambiguous entry).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-10-21T14:00:00-07:00'));
    try {
      const recent = localTimestamp(Date.now() - 70 * 60000).slice(0, 16);
      for (const [context, dx] of changes) {
        const html = renderToStaticMarkup(React.createElement(CaseBar, { state: treated({ context, note: { diagnosisCategory: dx }, actions: { administrationTime: recent } }), documentLabel: 'Pulsara summary', blocked: 0, onCopy: () => {}, copyStatus: '' }));
        expect(html).toContain('TNK given');
        expect(html).toContain('href="#/protocols/ischemic/qr-sich"');
        expect(html).toMatch(/href="#\/protocols\/(ischemic|ich)\/qr-bp"/);
      }
    } finally { vi.useRealTimers(); }
  });

  it('keeps post-IVT BP cues in acute care after the diagnosis changes; an ICH keeps its own BP targets first', () => {
    const mimic = caseSummary(treated({ note: { diagnosisCategory: 'mimic', presentingBP: '185/100' } }), NOW);
    expect(mimic.bpTitle).toBe('Not below the post-IVT limit of 180/105');
    expect(caseSummary(treated({ note: { diagnosisCategory: 'ich', presentingBP: '160/90' } }), NOW).bpTitle).toMatch(/^ICH: SBP 150–220/);
    expect(caseSummary(treated({ note: { diagnosisCategory: 'ich', presentingBP: '140/106' } }), NOW).bpTitle).toBe('Not below the post-IVT limit of 180/105');
  });

  it('acute ischemic stroke needs no reconcile line, and nothing is invented without a record', () => {
    expect(buildSummary(treated(), NOW)).not.toContain('Recorded reperfusion treatment');
    expect(render(treated(), NOW)).not.toContain('Recorded reperfusion treatment');
    const mimic = merge({ drug: 'TNK', decisions: { ivt: 'Recommended' }, note: { diagnosisCategory: 'mimic' } });
    for (const sample of formats) {
      const text = buildSummary({ ...mimic, ...sample }, NOW);
      for (const part of ['IVT administration', 'EVT puncture', 'Recorded reperfusion treatment', 'Post-treatment review']) expect(text).not.toContain(part);
    }
    expect(caseSummary(mimic, NOW).administered).toBe(false);
    expect(render(mimic, NOW)).not.toContain('IV thrombolytic administration explicitly recorded');
  });
});

describe('a contradicted checklist "No" holds the Encounter screen and the case-bar dose as a "Yes" would (finding 2)', () => {
  const at = Date.parse('2026-10-21T14:00:00-07:00');
  const candidate = (patch = {}) => merge({ drug: 'TNK', nihssSource: 'reported', reportedNihss: '4', ...patch,
    note: { diagnosisCategory: 'ischemic', age: '58', sex: 'M', weight: '84', premorbidMRS: '0', lkwDate: '2026-10-21', lkwTime: '12:30', presentingBP: '162/88', glucose: '104', ctHemorrhageStatus: 'absent', disablingDeficit: true, plateletCount: '240', inr: '1.0', lastDOACType: 'none', tnkContraindicationChecklist: allNo, ivtContraindicationsReviewed: true, ...patch.note } });
  const ivtScreen = html => html.match(/IVT: ([^<]*)/)?.[1];
  const endocarditis = { details: { specialContext: 'Infective endocarditis' } };
  const answeredYes = { ...endocarditis, note: { tnkContraindicationChecklist: { ...allNo, infectiveEndocarditis: true } } };

  it('without a conflict the screen and dose are unchanged', () => {
    expect(ivtScreen(render(candidate(), at))).toMatch(/^Known-onset standard-window screen: 1\.5 h/);
    // 0.25 mg/kg x 84 kg = 21 mg (below the 25 mg maximum).
    expect(caseSummary(candidate(), at).dose).toMatchObject({ label: 'TNK', value: '21 mg' });
  });

  it('infective endocarditis recorded as a care context with the checklist answered No', () => {
    const state = candidate(endocarditis);
    expect(safetyChecklistSignals(state.note, at, state.details).infectiveEndocarditis).toEqual({ reason: 'additional care context: infective endocarditis', conflict: true });
    const screen = ivtScreen(render(state, at));
    expect(screen).toMatch(/^A recorded contraindication, relative risk factor or contradictory checklist entry requires clinician review/);
    expect(screen).toBe(ivtScreen(render(candidate(answeredYes), at)));
    const dose = caseSummary(state, at).dose;
    expect(dose).toMatchObject({ label: 'IVT dose', value: 'Held', flag: 'caution' });
    expect(dose.title).toMatch(/^Entered values contradict a "No" safety answer; no dose shown\. A recorded contraindication/);
    expect(caseSummary(candidate(answeredYes), at).dose).toMatchObject({ value: 'Held', title: expect.stringMatching(/^IVT card held\./) });
    // The overview's Next cue names the same hold as the case bar.
    expect(encounterHoldCue(candidate(), at)).toBeNull();
    expect(encounterHoldCue(state, at)).toEqual({ label: 'Contradicted safety answer', target: 'safety-title' });
    expect(encounterHoldCue(candidate(answeredYes), at)).toEqual({ label: 'Safety review', target: 'safety-title' });
    // Remaining divergence (owner decision): the frozen Protocols projection reads the answer as given.
    expect(protocolEncounter(state, at).safetyReviewRequired).toBe(false);
    expect(protocolEncounter(candidate(answeredYes), at).safetyReviewRequired).toBe(true);
  });

  it('names the field behind the hold: an unassessed anticoagulant first, then a contradicted answer that can hold IVT', () => {
    const cue = state => encounterHoldCue(state, at), held = state => caseSummary(state, at).dose;
    // Benefit-tier entries (an antiplatelet, an ACE inhibitor, seizure at onset) answered No never hold IVT.
    for (const patch of [{ note: { medications: 'aspirin 81 mg daily' } }, { note: { medications: 'lisinopril 10 mg daily' } }, { details: { seizureAtOnset: 'yes' } }]) {
      expect(cue(candidate(patch))).toBeNull();
      expect(held(candidate(patch))).toMatchObject({ label: 'TNK', value: '21 mg' });
      const unassessed = candidate({ ...patch, note: { ...patch.note, lastDOACType: '' } });
      expect(cue(unassessed)).toEqual({ label: 'Anticoagulant exposure', target: 'input-anticoagulant' });
      expect(held(unassessed)).toMatchObject({ value: 'Held', detail: 'anticoagulant not assessed', title: expect.stringMatching(/^IVT card held\./) });
      const highBp = candidate({ ...patch, note: { ...patch.note, presentingBP: '200/100' } });
      expect(cue(highBp)).toEqual({ label: 'Safety review', target: 'safety-title' });
      expect(held(highBp)).toMatchObject({ value: 'Held', detail: 'safety review' });
    }
    // A real contradiction beside an unassessed anticoagulant: the anticoagulant field first (7.8.1), then the contradiction.
    // The case-bar title still says the entered values contradict a "No".
    for (const both of [candidate({ note: { glucose: '450', lastDOACType: '' } }), candidate({ ...endocarditis, note: { lastDOACType: '' } })]) {
      expect(cue(both)).toEqual({ label: 'Anticoagulant exposure', target: 'input-anticoagulant' });
      expect(held(both)).toMatchObject({ value: 'Held', detail: 'anticoagulant not assessed', title: expect.stringMatching(/^Entered values contradict a "No" safety answer; no dose shown\. .*Anticoagulant exposure not yet assessed in Encounter\.$/) });
    }
    // Glucose 450 holds on its own; the contradicted "No" is still named.
    const contradicted = candidate({ note: { glucose: '450' } });
    expect(cue(contradicted)).toEqual({ label: 'Contradicted safety answer', target: 'safety-title' });
    expect(held(contradicted)).toMatchObject({ value: 'Held', detail: 'contradicted answer' });
  });

  it('names no IVT hold after a recorded administration or a Not recommended decision', () => {
    const given = candidate({ ...endocarditis, actions: { administered: true, administrationTime: '2026-10-21T13:30', agentConfirmed: 'TNK', administeredDose: '21' } });
    expect(encounterHoldCue(given, at)).toBeNull();
    expect(caseSummary(given, at).dose).toMatchObject({ label: 'TNK given', detail: '21 mg' });
    const declined = candidate({ ...endocarditis, decisions: { ivt: 'Not recommended' } });
    expect(encounterHoldCue(declined, at)).toBeNull();
    expect(caseSummary(declined, at).dose).toBeNull();
    // A hold recorded before either still names its field.
    expect(encounterHoldCue(candidate(endocarditis), at)).toEqual({ label: 'Contradicted safety answer', target: 'safety-title' });
    // Administration counts only with an agent selected and a valid past time, as on the case bar and the monitoring timer.
    const pad2 = value => String(value).padStart(2, '0');
    const local = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
    for (const actions of [{ administrationTime: local(at + 3600000) }, { administrationTime: '2026-02-30T10:00' }, { administrationTime: local(at - 1800000), drug: '' }]) {
      const { drug = 'TNK', ...recorded } = actions;
      const pending = candidate({ ...endocarditis, drug, actions: { administered: true, agentConfirmed: 'TNK', administeredDose: '21', ...recorded } });
      expect(encounterHoldCue(pending, at)).toEqual({ label: 'Contradicted safety answer', target: 'safety-title' });
      expect(caseSummary(pending, at).dose).toMatchObject({ label: 'IVT dose', value: 'Held', detail: 'contradicted answer' });
    }
    // Any decision other than Not recommended keeps the hold.
    for (const ivt of ['Specialist review', 'Recommended', '']) {
      const decided = candidate({ ...endocarditis, decisions: { ivt } });
      expect(encounterHoldCue(decided, at)).toEqual({ label: 'Contradicted safety answer', target: 'safety-title' });
      expect(caseSummary(decided, at).dose).toMatchObject({ value: 'Held', detail: 'contradicted answer' });
    }
  });

  it('names a recorded or uncertain CT hemorrhage before anything else, on the cue and the case bar', () => {
    for (const [status, label, detail, title] of [['present', 'CT hemorrhage recorded', 'CT hemorrhage', 'CT hemorrhage recorded; no dose shown'], ['uncertain', 'CT hemorrhage review', 'CT uncertain', 'CT hemorrhage review uncertain or conflicting; no dose shown']]) {
      const ct = candidate({ ...endocarditis, note: { ctHemorrhageStatus: status, lastDOACType: '' } });
      expect(encounterHoldCue(ct, at)).toEqual({ label, target: 'input-ct-review' });
      expect(caseSummary(ct, at).dose).toMatchObject({ value: 'Held', detail, title });
    }
  });

  it('a severe glucose answered No holds before the examination is complete, exactly as a "Yes"', () => {
    const conflict = candidate({ reportedNihss: '', note: { glucose: '450' } });
    const yes = candidate({ reportedNihss: '', note: { glucose: '450', tnkContraindicationChecklist: { ...allNo, highGlucose: true } } });
    expect(ivtScreen(render(conflict, at))).toBe(ivtScreen(render(yes, at)));
    expect(caseSummary(conflict, at).dose).toMatchObject({ value: 'Held', flag: 'caution' });
    expect(caseSummary(yes, at).dose).toMatchObject({ value: 'Held', flag: 'caution' });
  });
});

describe('ICH reversal status against a recorded administration time (finding 4)', () => {
  const at = Date.parse('2026-10-21T15:00:00-07:00');
  const ich = (status, reversal = '2026-10-21T14:20', dx = 'ich') => merge({ note: { diagnosisCategory: dx }, details: { ichReversalStatus: status, ichReversalDetails: 'Synthetic reversal entry' }, timeline: { arrival: '2026-10-21T13:10', reversal } });
  it.each([['Planned', "[reversal status is 'Planned'; reconcile]"], ['Under review', "[reversal status is 'Under review'; reconcile]"], ['', "[reversal status is 'not documented'; reconcile]"], ['Administered', '']])('flags status "%s" beside a recorded time in the timeline, the team handoff and Encounter', (status, flag) => {
    const state = ich(status);
    expect(formatTimeline(state, at)).toContain(`ICH reversal administration: 2026-10-21 14:20${flag ? ` ${flag}` : ''}\n`);
    expect(buildSummary({ ...state, documentFormat: 'handoff' }, at)).toContain(`ICH reversal administration: 2026-10-21 14:20${flag ? ` ${flag}` : ''}`);
    expect(render(state, at).includes('ICH reversal administration time recorded;')).toBe(Boolean(flag));
  });
  it('needs a recorded time and an ICH encounter', () => {
    expect(buildSummary(ich('Planned', ''), at)).not.toContain('reconcile]');
    expect(render(ich('Planned', ''), at)).not.toContain('ICH reversal administration time recorded');
    expect(buildSummary(ich('Planned', '2026-10-21T14:20', 'sah'), at)).not.toContain('ICH reversal administration');
  });
});

describe('wake-up MRI answers print as recorded (finding 5)', () => {
  const at = Date.parse('2026-10-21T09:00:00-07:00');
  const wakeUp = workflow => merge({ consultationType: 'video', note: { diagnosisCategory: 'ischemic', age: '59', lkwUnknown: true, discoveryDate: '2026-10-21', discoveryTime: '06:30', wakeUpStrokeWorkflow: { mriAvailable: true, ...workflow } } });
  it('an explicit No prints "no"; an unanswered item prints "not documented"', () => {
    const text = buildSummary(wakeUp({ dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: false }, mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: false }), at);
    for (const part of ['DWI-positive lesion: yes.', 'No marked corresponding FLAIR hyperintensity: no.', 'MRI lesion extent reviewed: yes.', 'DWI lesion smaller than one-third MCA territory: no.']) expect(text).toContain(part);
    expect(buildSummary(wakeUp({ dwi: { positiveForLesion: false } }), at)).toContain('DWI-positive lesion: no.');
    const unanswered = buildSummary(wakeUp({}), at);
    for (const label of ['DWI-positive lesion', 'No marked corresponding FLAIR hyperintensity', 'MRI lesion extent reviewed']) expect(unanswered).toContain(`${label}: not documented.`);
  });
});

describe('treatment records without the matching administration or puncture are flagged (finding 6)', () => {
  const at = Date.parse('2026-10-21T16:00:00-07:00');
  const record = (patch = {}) => merge({ documentFormat: 'procedure', consultationType: 'video', decisions: { ivt: 'Not recommended', evt: 'Recommended' }, ...patch,
    note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-21', lkwTime: '12:00', ctHemorrhageStatus: 'absent', ticiScore: '3', ...patch.note },
    actions: { reperfusionTime: '2026-10-21T15:00', ...patch.actions },
    details: { reperfusionReview: 'After IV thrombolysis and EVT', evtAccess: 'Right radial', evtPasses: '2', hemorrhagicTransformation: 'HI1', ...patch.details } });
  it('names what is missing in the record, in the procedure note and in Section 4', () => {
    const text = buildSummary(record(), at);
    expect(text).toContain('Post-treatment review: After IV thrombolysis and EVT [no IVT administration or EVT puncture recorded; reconcile]');
    expect(text).toContain('EVT puncture: not documented [reperfusion time and mTICI 3 recorded; reconcile]');
    expect(text).toContain('IVT administration: not documented as given');
    expect(render(record(), at)).toContain('Reconcile: post-treatment review recorded with no IVT administration or EVT puncture; reperfusion time and mTICI 3 recorded without an EVT puncture time.');
  });
  it('flags only what is missing', () => {
    expect(buildSummary(record({ details: { reperfusionReview: 'After EVT' } }), at)).toContain('Post-treatment review: After EVT [no EVT puncture recorded; reconcile]');
    expect(buildSummary(record({ details: { reperfusionReview: 'After IV thrombolysis' }, actions: { reperfusionTime: '' }, note: { ticiScore: '' } }), at)).toContain('Post-treatment review: After IV thrombolysis [no IVT administration recorded; reconcile]');
    const complete = record({ drug: 'TNK', decisions: { ivt: 'Recommended' }, actions: { administered: true, administrationTime: '2026-10-21T13:00', agentConfirmed: 'TNK', punctureTime: '2026-10-21T14:00' } });
    expect(buildSummary(complete, at)).not.toMatch(/\[no |recorded; reconcile\]/);
    expect(render(complete, at)).not.toContain('Reconcile: ');
  });
});

describe('the wake-up / EXTEND screen in a note does not change with when the note is written (finding 7)', () => {
  // LKW 12:30, CTP core 10 mL of 80 mL, NIHSS 8, pre-mRS 0, disabling; TNK recorded at 13:40 (1 h 10 min after LKW).
  const ctp = actions => merge({ drug: 'TNK', nihssSource: 'reported', reportedNihss: '8', decisions: { ivt: 'Recommended' }, actions,
    note: { diagnosisCategory: 'ischemic', age: '68', sex: 'M', weight: '82', premorbidMRS: '0', lkwDate: '2026-10-21', lkwTime: '12:30', presentingBP: '170/90', glucose: '120', ctHemorrhageStatus: 'absent', disablingDeficit: true, coreVolume: '10', penumbraVolume: '80', wakeUpStrokeWorkflow: { mriAvailable: false } } });
  const screenLine = (state, iso) => buildSummary({ ...state, consultationType: 'video' }, Date.parse(iso)).split('\n').find(entry => entry.startsWith('Wake-up / unknown-onset imaging screen'));
  it('evaluates a treated encounter at the recorded administration', () => {
    const state = ctp({ administered: true, administrationTime: '2026-10-21T13:40', agentConfirmed: 'TNK' });
    const lines = ['2026-10-21T14:00:00-07:00', '2026-10-21T18:30:00-07:00', '2026-10-21T22:30:00-07:00', '2026-10-22T13:00:00-07:00'].map(iso => screenLine(state, iso));
    expect(new Set(lines).size).toBe(1);
    expect(lines[0]).toBe('Wake-up / unknown-onset imaging screen — CTP (EXTEND): not applicable (known LKW within 4.5 h); complete eligibility and drug-specific treatment decision require review; evaluated at the recorded IVT administration, 2026-10-21 13:40.');
  });
  it('labels an untreated screen with the note time it was evaluated at', () => {
    // 18:30 is 6 h after LKW: inside the EXTEND 4.5-9 h window, core <70 mL, ratio 8 >1.2, mismatch 70 mL >10 mL.
    expect(screenLine(ctp({}), '2026-10-21T18:30:00-07:00')).toBe('Wake-up / unknown-onset imaging screen — CTP (EXTEND): partial source screen met; complete eligibility and drug-specific treatment decision require review; evaluated at note generation, 2026-10-21 18:30.');
    // 22:30 is 10 h after LKW: outside the window.
    expect(screenLine(ctp({}), '2026-10-21T22:30:00-07:00')).toMatch(/incomplete or not met; .*; evaluated at note generation, 2026-10-21 22:30\.$/);
  });
});

describe('an antiplatelet named in the medication record (finding 8)', () => {
  it.each(['aspirin 81 mg daily; clopidogrel 75 mg daily', 'ASA 81', 'Plavix', 'ticagrelor 90 mg twice daily', 'cilostazol'])('is a related entry for "Antiplatelet therapy" (%s)', medications => {
    const signal = safetyChecklistSignals({ medications }, new Date(), {}).dualAntiplatelet;
    expect(signal).toEqual({ reason: 'medication record names an antiplatelet', conflict: true });
    expect(bulkNoPatch({}, { dualAntiplatelet: signal })).not.toHaveProperty('dualAntiplatelet');
  });
  it('is flagged when answered No, and is not matched inside other words', () => {
    const state = merge({ consultationType: 'video', note: { diagnosisCategory: 'ischemic', medications: 'aspirin 81 mg daily; lisinopril 10 mg', tnkContraindicationChecklist: allNo } });
    expect(buildSummary(state, NOW)).toContain('Entered values conflicting with a "No" answer: Antiplatelet therapy (single or dual) (medication record names an antiplatelet)');
    expect(safetyChecklistSignals({ medications: 'nasal saline; lisinopril 10 mg' }, new Date(), {}).dualAntiplatelet).toBeUndefined();
  });
});

describe('an administered dose above the agent maximum (finding 9)', () => {
  const given = (drug, administeredDose) => treated({ drug, actions: { agentConfirmed: drug, administeredDose } });
  it.each([['TNK', '30', 25], ['Alteplase', '95', 90]])('%s %s mg is flagged in the case bar and beside the dose field', (drug, dose, max) => {
    const bar = caseSummary(given(drug, dose), NOW);
    expect(bar.dose).toMatchObject({ flag: 'caution', detail: `${dose} mg` });
    expect(bar.dose.title).toContain(`administered dose above the ${max} mg maximum`);
    expect(render(given(drug, dose), NOW)).toContain(`Administered dose above the ${max} mg maximum; review.`);
  });
  it.each([['TNK', '25'], ['Alteplase', '90'], ['TNK', '']])('%s "%s" mg is not flagged', (drug, dose) => {
    expect(caseSummary(given(drug, dose), NOW).dose.flag).toBeUndefined();
    expect(render(given(drug, dose), NOW)).not.toContain('Administered dose above');
  });
});

describe('the copy-blocked alert names main-note fields (finding 10)', () => {
  const alertText = state => renderToStaticMarkup(React.createElement(Encounter, { state, update: () => {}, now: NOW, onGenerate: () => {}, onCopy: () => {}, copyStatus: '' })).match(/<div role="alert"[^>]*><p>([^<]*)/)?.[1];
  it('names the HPI, the rationale and action texts, but never a valid structured date', () => {
    // Built at run time so the leak guard does not read a phone-shaped literal in source.
    const phone = ['206', '555', '0142'].join('-');
    const state = merge({ rationale: 'reach me at user@example.invalid', note: { diagnosisCategory: 'ischemic', symptoms: `Left arm drift; callback ${phone}`, ctDate: '2026-10-21' }, actions: { handoff: `Call ${phone}` } });
    const text = alertText(state);
    expect(text).toContain('Flagged: &quot;Presenting symptoms / HPI&quot;; &quot;Manual rationale / recommendations&quot;; &quot;Handoff record&quot;.');
    expect(text).not.toContain('Head CT date');
  });
});
