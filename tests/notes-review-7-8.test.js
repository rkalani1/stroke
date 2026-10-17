// 7.8 documentation review: missing vs explicit negative, reported vs calculated, proposed vs
// completed, and no silent omissions. Expected strings follow the documentation rules stated
// in each test, not captured output.
import { describe, expect, it } from 'vitest';
import { buildSummary, newEncounter, updateEncounter, protocolEncounter, copySummary, outputWarnings, documentedBp, documentedMeasurement, unfilledPromptCount, nihssWithBulkZero, setNihssItem, nihssBulkZeroItems, nihssUnenteredItems } from '../src/workspace-state.js';
import { DOCUMENT_FORMATS, copyStatusMessage } from '../src/documentation-output.js';
import { DOCUMENTATION_PROMPTS, appendDocumentationPrompt } from '../src/documentation-prompts.js';
import { encounterDetailWarningSources, ENCOUNTER_DETAIL_GROUPS } from '../src/encounter-details.js';
import { getPublicDemoPhiWarnings } from '../src/public-demo-guardrails.js';
import { encounterOverview } from '../src/encounter-overview.js';
import { caseSummary } from '../src/components/CaseBar.jsx';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';

const NOW = new Date('2026-10-01T12:00:00').getTime();
const zeroExam = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
const make = (patch = {}) => {
  const s = newEncounter();
  return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, decisions: { ...s.decisions, ...patch.decisions }, details: { ...s.details, ...patch.details }, ich: { ...s.ich, ...patch.ich } };
};
// Every output: 7 documentation formats × telephone/video.
const allOutputs = state => DOCUMENT_FORMATS.flatMap(([documentFormat]) => ['phone', 'video'].map(consultationType => buildSummary({ ...state, documentFormat, consultationType }, NOW)));
const BRACKET = '[medication record names an anticoagulant; reconcile actual use and last dose]';

describe('EN-01 anticoagulant exposure is never silent or falsely reassuring', () => {
  it.each(['ich', 'sah'])('acute %s with exposure not assessed prints "not assessed" in every output', diagnosisCategory => {
    for (const text of allOutputs(make({ note: { diagnosisCategory } }))) {
      expect(text).toContain('Anticoagulant exposure: not assessed');
      expect(text).not.toContain('[medication record names');
    }
  });
  it('flags a medication-record anticoagulant when the structured field is blank or "None", including the team handoff', () => {
    for (const text of allOutputs(make({ note: { diagnosisCategory: 'ich', medications: 'apixaban 5 mg BID' } }))) expect(text).toContain(`Anticoagulant exposure: not assessed ${BRACKET}`);
    for (const text of allOutputs(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'none', medications: 'Eliquis 5 mg BID' } }))) expect(text).toContain(`Anticoagulant exposure: none documented ${BRACKET}`);
  });
  it('keeps an explicit all-No checklist attestation but qualifies the "none" exposure (acute ischemic)', () => {
    const checklist = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
    const state = make({ note: { diagnosisCategory: 'ischemic', lastDOACType: 'none', medications: 'apixaban 5 mg BID', tnkContraindicationChecklist: checklist } });
    const text = buildSummary(state, NOW);
    expect(text).toContain(`Anticoagulant exposure: none documented ${BRACKET}`);
    expect(text).toContain('Recorded safety concerns: none; every checklist item answered No');
    // The Protocols projection is unchanged by note wording: still a critical hold.
    const protocol = protocolEncounter(state, NOW);
    expect(protocol.safetyReviewRequired).toBe(true);
    expect(protocol.safetyReviewSeverity).toBe('critical');
    expect(protocol.safetyReviewReason).toContain('The medication record mentions an anticoagulant despite the no-anticoagulant selection.');
  });
  it('prints a plain "none documented" without a medication conflict, and adds nothing to a follow-up note without data', () => {
    expect(buildSummary(make({ note: { diagnosisCategory: 'ischemic', lastDOACType: 'none' } }), NOW)).toMatch(/Anticoagulant exposure: none documented(?! \[)/);
    for (const text of allOutputs(make({ context: 'follow-up', note: { diagnosisCategory: 'ich' } }))) expect(text).not.toContain('Anticoagulant exposure:');
    // Follow-up clinic note for a patient on apixaban: no acute "last dose" prompt.
    for (const text of allOutputs(make({ context: 'follow-up', note: { diagnosisCategory: 'ischemic', medications: 'apixaban 5 mg BID for AF' } }))) expect(text).not.toContain('Anticoagulant exposure:');
    expect(buildSummary(make({ context: 'follow-up', note: { diagnosisCategory: 'ischemic', lastDOACType: 'none', medications: 'apixaban 5 mg BID' } }), NOW)).toContain(`none documented ${BRACKET}`);
    expect(buildSummary(make({ note: { diagnosisCategory: 'tia', medications: 'warfarin 5 mg daily' } }), NOW)).toContain(`Anticoagulant exposure: not assessed ${BRACKET}`);
    const named = buildSummary(make({ note: { diagnosisCategory: 'ich', lastDOACType: 'apixaban', medications: 'apixaban 5 mg BID' } }), NOW);
    expect(named).toContain('Anticoagulant exposure: apixaban');
    expect(named).not.toContain('[medication record names');
  });
});

describe('EN-02 bulk NIHSS zero records provenance', () => {
  const ischemic = patch => make({ note: { diagnosisCategory: 'ischemic' }, ...patch });
  it('fills only unentered items, keeps entered scores and records the filled ids', () => {
    const state = nihssWithBulkZero(ischemic({ nihss: { motor_arm_left: 'Some effort against gravity (2)' } }));
    expect(state.nihss.motor_arm_left).toBe('Some effort against gravity (2)');
    expect(state.nihssBulkZero).toHaveLength(14);
    expect(nihssUnenteredItems(state.nihss)).toHaveLength(0);
    // 2 + 14 × 0 = 2; the 14 bulk items are named by item number.
    const text = buildSummary(state, NOW);
    expect(text).toContain('NIHSS score: 2/42 (all items documented; 14 items set to 0 by bulk entry, not individually scored (1a, 1b, 1c, 2, 3, 4, 5b, 6a, 6b, 7, 8, 9, 10, 11)); items 1a 0');
  });
  it('states an all-bulk exam and drops an item once it is scored or cleared individually', () => {
    let state = nihssWithBulkZero(ischemic({ nihss: {} }));
    expect(buildSummary(state, NOW)).toContain('NIHSS score: 0/42 (all items documented; all 15 items set to 0 by bulk entry, not individually scored).');
    state = setNihssItem(state, 'language', 'Mild-moderate aphasia (1)');
    expect(nihssBulkZeroItems(state)).toHaveLength(14);
    state = setNihssItem(state, 'consciousness', 'Alert (0)');
    expect(nihssBulkZeroItems(state)).toHaveLength(13);
    expect(buildSummary(state, NOW)).toContain('NIHSS score: 1/42 (all items documented; 13 items set to 0 by bulk entry');
    // Clearing then re-filling is a union, never a double count (15 − language − 1a = 13).
    state = nihssWithBulkZero(setNihssItem(state, 'visual', ''));
    expect(nihssBulkZeroItems(state)).toHaveLength(13);
    // A reported total carries no bulk text.
    expect(buildSummary({ ...state, nihssSource: 'reported', reportedNihss: '7' }, NOW)).toContain('7/42 (reported total)');
    expect(buildSummary({ ...state, nihssSource: 'reported', reportedNihss: '7' }, NOW)).not.toContain('bulk entry');
  });
  it('keeps the plain wording without the flag and leaves Protocols inputs unchanged', () => {
    const plain = ischemic({ nihss: zeroExam });
    expect(buildSummary(plain, NOW)).toContain('NIHSS score: 0/42 (all items documented).');
    const flagged = { ...plain, nihssBulkZero: NIHSS_ITEMS.map(item => item.id) };
    expect(JSON.stringify(protocolEncounter(flagged, NOW))).toBe(JSON.stringify(protocolEncounter(plain, NOW)));
    // A flag-only change does not reopen the IVT safety review.
    const reviewed = { ...plain, note: { ...plain.note, ivtContraindicationsReviewed: true } };
    expect(updateEncounter(reviewed, prev => ({ ...prev, nihssBulkZero: ['consciousness'] })).note.ivtContraindicationsReviewed).toBe(true);
  });
});

describe('EN-03 BP text', () => {
  it('flags incomplete, malformed and reversed values and keeps a valid pair', () => {
    expect(documentedBp('')).toBe('');
    expect(documentedBp('/')).toBe('');
    expect(documentedBp('180/')).toBe('[BP incomplete: systolic 180, diastolic not documented; correct before interpretation]');
    expect(documentedBp('/95')).toBe('[BP incomplete: systolic not documented, diastolic 95; correct before interpretation]');
    expect(documentedBp('abc/90')).toBe('[BP abc/90 invalid; correct before interpretation]');
    expect(documentedBp('90/160')).toBe('90/160 [systolic not above diastolic; check order]');
    expect(documentedBp('160/90', ' mmHg')).toBe('160/90 mmHg');
  });
  it('states missing acute BP and glucose in the telephone summary and handoff; prints no raw fragments', () => {
    const missing = make({ note: { diagnosisCategory: 'ischemic' } });
    const phone = buildSummary(missing, NOW);
    expect(phone).toContain('BP (mmHg): not documented; Glucose (mg/dL): not documented');
    const handoff = buildSummary({ ...missing, documentFormat: 'handoff' }, NOW);
    expect(handoff).toContain('\nBP: not documented\n');
    expect(handoff).toContain('Labs: Glucose not documented; Platelets not documented; INR not documented');
    for (const text of allOutputs(make({ note: { diagnosisCategory: 'ischemic', presentingBP: '180/' } }))) {
      expect(text).toContain('[BP incomplete: systolic 180, diastolic not documented; correct before interpretation]');
      expect(text).not.toMatch(/180\/ |180\/$|180\/;/m);
    }
    expect(buildSummary({ ...missing, note: { ...missing.note, presentingBP: '/' }, consultationType: 'video' }, NOW)).toContain('Vitals: BP not documented');
    // Follow-up: optional, so nothing is added when not entered.
    expect(buildSummary(make({ context: 'follow-up', note: { diagnosisCategory: 'ischemic' } }), NOW)).not.toContain('BP (mmHg)');
    expect(protocolEncounter(make({ note: { diagnosisCategory: 'ischemic', presentingBP: '90/160' } }), NOW).ivt).toMatchObject({ bpSystolic: '90', bpDiastolic: '160' });
  });
});

describe('EN-05 unfilled documentation prompts', () => {
  it('prints blanks as not documented and counts them for the UI caution', () => {
    const prompt = DOCUMENTATION_PROMPTS.find(item => item.id === 'ivt-discussion');
    const filled = appendDocumentationPrompt('', prompt.text).replace('Participants: [ ]', 'Participants: patient and daughter');
    const state = make({ note: { diagnosisCategory: 'ischemic' }, actions: { discussionDetails: filled } });
    expect(unfilledPromptCount(state)).toBe(4);
    // The team handoff leaves discussion details out; every other format carries them.
    for (const text of allOutputs(state).filter(text => !text.startsWith('Team handoff'))) {
      expect(text).toContain('Benefits, risks and alternatives discussed: [blank; not documented]');
      expect(text).toContain('Participants: patient and daughter');
    }
    for (const text of allOutputs(state)) expect(text).not.toContain('[ ]');
    const handoff = make({ documentFormat: 'handoff', actions: { handoff: DOCUMENTATION_PROMPTS.find(item => item.id === 'transfer-handoff').text } });
    expect(buildSummary(handoff, NOW)).toContain('Sending and receiving teams: [blank; not documented]');
    expect(unfilledPromptCount(make({ actions: { monitoring: 'Neuro checks q15 min recorded.' } }))).toBe(0);
  });
});

describe('EN-06 team handoff carries dosing and safety context', () => {
  it('adds weight, disabling deficit, normalized platelets, allergies, code status, swallow, special context and the wake-up screen', () => {
    const state = make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ischemic', age: '70', sex: 'M', weight: '80', plateletCount: '150000', disablingDeficit: true, lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00', wakeUpStrokeWorkflow: { mriAvailable: true } },
      details: { allergyReview: 'Reviewed — allergies documented', allergies: 'iodinated contrast: hives', codeStatus: 'DNR', swallowScreen: 'Failed', nutritionRoute: 'NPO', specialContext: 'Pregnancy / postpartum', mobilityPlan: 'NOT FOR HANDOFF' } });
    const text = buildSummary(state, NOW);
    for (const part of ['70 year old male · Wt 80 kg · Ischemic stroke', 'Disabling deficit: yes', 'Platelets 150 K/µL', 'Allergies and reported reactions: iodinated contrast: hives', 'Documented code status: DNR', 'Swallow screen: Failed', 'Current nutrition route: NPO', 'Additional care context: Pregnancy / postpartum', 'Wake-up / unknown-onset imaging screen — MRI (WAKE-UP)']) expect(text).toContain(part);
    expect(text).not.toContain('NOT FOR HANDOFF');
  });
  it('states missing weight and INR for warfarin-associated ICH', () => {
    const text = buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich', lastDOACType: 'warfarin', weight: '70' } }), NOW);
    expect(text).toContain('· Wt 70 kg ·');
    expect(text).toContain('INR not documented');
    expect(buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich', lastDOACType: 'warfarin' } }), NOW)).toContain('· Wt not documented ·');
    expect(buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich', lastDOACType: 'heparin' } }), NOW)).toContain('aPTT not documented');
  });
});

describe('EN-07 / EN-22 copy outcome messages', () => {
  it('reports superseded and blocked copies without the "copied." success suffix', () => {
    expect(copyStatusMessage('copied', 'Pulsara summary')).toBe('Pulsara summary copied.');
    for (const result of ['superseded', 'blocked', 'denied']) {
      expect(copyStatusMessage(result, 'Pulsara summary')).not.toMatch(/copied\.$/);
      expect(copyStatusMessage(result, 'Pulsara summary')).not.toBe('');
    }
    expect(copyStatusMessage('superseded', 'x')).toContain('the clipboard may hold an earlier version');
  });
  it('returns superseded when inputs change while the clipboard write is pending', async () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', age: '70' } });
    const text = buildSummary(state, NOW);
    const ref = { current: { ...state, draft: { text, revision: state.revision, stale: false } } };
    let release;
    const pending = copySummary(ref, text, () => new Promise(resolve => { release = resolve; }));
    ref.current = updateEncounter(ref.current, prev => ({ ...prev, note: { ...prev.note, age: '71' } }));
    release();
    expect(await pending).toBe('superseded');
    expect(await copySummary(ref, text, async () => {})).toBe('blocked');
  });
});

describe('EN-08 / EN-16 IVT administration record', () => {
  const base = patch => make({ note: { diagnosisCategory: 'ischemic', weight: '80' }, decisions: { ivt: 'Recommended' }, ...patch });
  it('names what is missing and keeps an entered time', () => {
    expect(buildSummary(base({ actions: { administrationTime: '2026-10-01T10:15' } }), NOW)).toContain('IVT administration: not documented as given (administration checkbox not ticked; agent not selected); entered time 2026-10-01 10:15 retained for review');
    expect(buildSummary(base({ drug: 'TNK', actions: { administered: true } }), NOW)).toContain('IVT administration: not documented as given (timestamp not entered)');
    expect(buildSummary(base({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-01T13:00' } }), NOW)).toContain('not documented as given (entered time is invalid or future; correct before interpretation)');
    expect(buildSummary(base(), NOW)).toContain('IVT administration: not documented as given.');
  });
  it('marks an agent pre-filled from the dose calculation until it is confirmed', () => {
    const given = base({ drug: 'Alteplase', actions: { administered: true, administrationTime: '2026-10-01T10:15' } });
    expect(buildSummary(given, NOW)).toContain('[agent pre-filled from the dose-calculation selection; confirm the agent given]');
    const confirmed = { ...given, actions: { ...given.actions, agentConfirmed: 'Alteplase' } };
    expect(buildSummary(confirmed, NOW)).toContain('IVT administration: Alteplase at 2026-10-01 10:15');
    expect(buildSummary(confirmed, NOW)).not.toContain('agent pre-filled');
    // A later change of agent needs a new confirmation.
    expect(buildSummary({ ...confirmed, drug: 'TNK' }, NOW)).toContain('agent pre-filled');
    expect(protocolEncounter(confirmed, NOW).drug).toBe('Alteplase');
  });
});

describe('EN-09 core acute fields are stated when missing or invalid', () => {
  it('acute ischemic: disabling deficit, Pre-mRS and invalid ASPECTS', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic' }, aspects: '11', pcAspects: '7.5' });
    const phone = buildSummary(state, NOW), video = buildSummary({ ...state, consultationType: 'video' }, NOW), handoff = buildSummary({ ...state, documentFormat: 'handoff' }, NOW);
    expect(phone).toContain('Disabling deficit: not assessed.');
    expect(video).toMatch(/Exam: NIHSS [^\n]*; Disabling deficit: not assessed/);
    expect(handoff).toContain('Disabling deficit: not assessed');
    expect(phone).toContain('Pre-mRS: not documented');
    expect(phone).toContain('[ASPECTS 11 invalid; correct before interpretation]');
    expect(phone).toContain('[pc-ASPECTS 7.5 invalid; correct before interpretation]');
    expect(buildSummary(make({ note: { diagnosisCategory: 'ischemic', disablingDeficit: false } }), NOW)).toContain('Disabling deficit: no.');
  });
  it('acute ICH: missing GCS and an uncalculated ICH score are stated', () => {
    const text = buildSummary(make({ note: { diagnosisCategory: 'ich', age: '70' } }), NOW);
    expect(text).toContain('GCS: not documented');
    expect(text).toContain('ICH score: not calculated (requires age, complete GCS, ABC/2 volume, IVH and infratentorial origin)');
  });
  it('acute SAH: a missing clinical grade is stated and carried in the handoff', () => {
    const state = make({ note: { diagnosisCategory: 'sah' } });
    expect(buildSummary(state, NOW)).toContain('Clinical grade (Hunt–Hess / WFNS): not documented');
    expect(buildSummary({ ...state, documentFormat: 'handoff' }, NOW)).toContain('Clinical grade (Hunt–Hess / WFNS): not documented');
    expect(buildSummary({ ...state, context: 'follow-up' }, NOW)).not.toContain('Clinical grade');
  });
});

describe('EN-10 event ordering flags', () => {
  const lkw = { diagnosisCategory: 'ischemic', lkwDate: '2026-10-01', lkwTime: '09:30' };
  it('flags EVT times before LKW, consent after the action, a puncture without an EVT recommendation and mTICI 0-1 with a reperfusion time', () => {
    const text = buildSummary(make({ note: { ...lkw, ticiScore: '0' }, drug: 'TNK', decisions: { ivt: 'Recommended', evt: 'Not recommended' }, actions: { administered: true, agentConfirmed: 'TNK', administrationTime: '2026-10-01T10:15', consent: 'Informed consent', consentTime: '2026-10-01T10:45', punctureTime: '2026-10-01T09:00', reperfusionTime: '2026-10-01T09:20', evtConsent: 'Informed consent', evtConsentTime: '2026-10-01T09:10' } }), NOW);
    expect(text).toContain("EVT puncture: 2026-10-01 09:00 [precedes LKW; review recorded dates/times] [EVT clinician decision is 'Not recommended'; reconcile]");
    expect(text).toContain('EVT reperfusion: 2026-10-01 09:20 [precedes LKW; review recorded dates/times] [mTICI 0 recorded with a reperfusion time; review]');
    expect(text).toContain('IVT Consent time: 2026-10-01 10:45 [recorded after the administration time; confirm the consent timeline]');
    expect(text).toContain('EVT consent time: 2026-10-01 09:10 [recorded after the puncture time; confirm the consent timeline]');
  });
  it('adds no flag to a consistent sequence and avoids double punctuation', () => {
    const text = buildSummary(make({ note: { ...lkw, ticiScore: '2b' }, drug: 'TNK', decisions: { ivt: 'Recommended', evt: 'Recommended' }, actions: { administered: true, agentConfirmed: 'TNK', administrationTime: '2026-10-01T10:15', consent: 'Informed consent', consentTime: '2026-10-01T10:10', punctureTime: '2026-10-01T10:40', reperfusionTime: '2026-10-01T10:55' } }), NOW);
    expect(text).not.toMatch(/precedes LKW|recorded after the|reconcile\]|recorded with a reperfusion time/);
    const reversed = buildSummary(make({ note: lkw, decisions: { evt: 'Recommended' }, actions: { punctureTime: '2026-10-01T10:40', reperfusionTime: '2026-10-01T10:30' } }), NOW);
    expect(reversed).toContain('(EVT reperfusion precedes puncture; review the recorded dates and times)');
    expect(reversed).not.toContain('.)');
  });
});

describe('EN-11 sleep midpoint', () => {
  it('prints local wall time for a chosen DST occurrence and flags a future value', () => {
    const prior = process.env.TZ; process.env.TZ = 'America/Los_Angeles';
    try {
      const note = { lkwUnknown: true, wakeUpStrokeWorkflow: { mriAvailable: false, sleepMidpoint: '2026-11-01T08:30:00.000Z' } };
      // 08:30Z on 2026-11-01 is the first (PDT, UTC−07:00) 01:30.
      expect(formatWakeUpScreenForExport(note, new Date('2026-11-01T14:00:00Z'))).toContain('Sleep midpoint: 2026-11-01 01:30:00 (UTC−07:00).');
      const future = { lkwUnknown: true, wakeUpStrokeWorkflow: { mriAvailable: false, sleepMidpoint: '2026-10-18T03:00' } };
      expect(formatWakeUpScreenForExport(future, new Date('2026-10-17T18:00:00Z'))).toContain('Sleep midpoint: 2026-10-18T03:00 (invalid, future or ambiguous; correct before interpretation).');
    } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
  });
});

describe('EN-13 / EN-14 measurements', () => {
  it('carries entered optional vitals, labs, EKG and clinician into the telephone summary', () => {
    const text = buildSummary(make({ note: { diagnosisCategory: 'ischemic', heartRate: '88', spO2: '97', temperature: '98.6', creatinine: '1.1', pt: '12.5', ekgResults: 'sinus rhythm', clinicianName: 'Dr Synthetic' } }), NOW);
    for (const part of ['HR (beats/min): 88', 'SpO2 (%): 97', 'Temp (°F): 98.6', 'Cr (mg/dL): 1.1', 'PT (s): 12.5', 'Telemetry/EKG: sinus rhythm.', 'Clinician: Dr Synthetic.']) expect(text).toContain(part);
    expect(buildSummary(make({ note: { diagnosisCategory: 'ischemic' } }), NOW)).not.toMatch(/HR \(beats|SpO2|Temp \(|Cr \(|PT \(s\)|Telemetry|Clinician:/);
  });
  it('flags non-numeric, out-of-range and wrong-unit values and adds units to video labs', () => {
    expect(documentedMeasurement('glucose', '-5')).toBe('[-5 invalid; correct before interpretation]');
    expect(documentedMeasurement('spO2', '150')).toBe('[150 invalid; correct before interpretation]');
    expect(documentedMeasurement('temperature', '37')).toBe('[37 °F implausible; check unit]');
    expect(documentedMeasurement('creatinine', 'abc')).toBe('[abc invalid; correct before interpretation]');
    expect(documentedMeasurement('glucose', '120', ' mg/dL')).toBe('120 mg/dL');
    const video = buildSummary(make({ consultationType: 'video', note: { diagnosisCategory: 'ischemic', glucose: '-5', plateletCount: '-3', temperature: '37', heartRate: '0' } }), NOW);
    expect(video).toContain('Labs: Glucose [-5 invalid; correct before interpretation], Plt [-3 invalid; correct before interpretation]');
    expect(video).toContain('Temp [37 °F implausible; check unit]');
    expect(video).toContain('HR [0 invalid; correct before interpretation]');
  });
});

describe('EN-15 overview completion cue', () => {
  it('lists missing acute BP, glucose, discovery time and both clinician decisions', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic', age: '70', weight: '80', premorbidMRS: '0', lkwUnknown: true, ctHemorrhageStatus: 'absent' }, nihss: zeroExam, actions: { disposition: 'Admission' } });
    expect(encounterOverview(state, NOW).missing.map(item => item.label)).toEqual(['Blood pressure', 'Glucose', 'Discovery time', 'IVT clinician decision', 'EVT clinician decision']);
    expect(encounterOverview(state, NOW).missing[0].target).toBe('input-sbp');
    expect(encounterOverview({ ...newEncounter(), context: 'follow-up' }, NOW).missing.map(item => item.label)).toEqual(['Working diagnosis', 'Age', 'Weight', 'Baseline mRS', 'Disposition']);
  });
});

describe('EN-16 / calculators F6 case bar dose', () => {
  const ready = patch => updateEncounter(newEncounter(), prev => ({ ...prev, drug: 'TNK', ...patch, note: { ...prev.note, diagnosisCategory: 'ischemic', age: '70', weight: '80', lkwDate: '2026-10-01', lkwTime: '10:00', lastDOACType: 'none', ...patch?.note } }));
  it('shows dose arithmetic only for a selected agent with no hold (0.25 mg/kg × 80 kg = 20 mg = 4 mL at 5 mg/mL)', () => {
    expect(caseSummary(ready(), NOW).dose).toEqual({ label: 'TNK', value: '20 mg', detail: '4 mL' });
    expect(caseSummary(ready({ drug: '' }), NOW).dose).toBeNull();
  });
  it('withholds it for CT hemorrhage, a held IVT card, an implausible weight or a pediatric age', () => {
    expect(caseSummary(ready({ note: { ctHemorrhageStatus: 'present' } }), NOW).dose).toMatchObject({ value: 'Held', flag: 'caution' });
    expect(caseSummary(ready({ note: { ctHemorrhageStatus: 'uncertain' } }), NOW).dose.value).toBe('Held');
    const held = caseSummary(ready({ note: { lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T09:00' } }), NOW).dose;
    expect(held.value).toBe('Held');
    expect(held.title).toMatch(/^IVT card held\. /);
    expect(caseSummary(ready({ note: { lastDOACType: '' } }), NOW).dose.value).toBe('Held');
    expect(caseSummary(ready({ note: { weight: '8' } }), NOW).dose.value).toBe('Check weight');
    expect(caseSummary(ready({ note: { weight: '29.9' } }), NOW).dose.value).toBe('Check weight');
    // 0.25 × 30 = 7.5 mg; 7.5 / 5 mg/mL = 1.5 mL.
    expect(caseSummary(ready({ note: { weight: '30' } }), NOW).dose).toMatchObject({ label: 'TNK', value: '7.5 mg' });
    expect(caseSummary(ready({ note: { age: '17', weight: '60' } }), NOW).dose.value).toBe('Not shown');
    expect(caseSummary(ready({ decisions: { ivt: 'Not recommended', evt: '' } }), NOW).dose).toBeNull();
  });
});

describe('EN-04 / EN-19 copy gate sources', () => {
  it('names the detail field behind a flag and whether it is hidden', () => {
    const state = make({ note: { diagnosisCategory: 'ischemic' }, details: { ichSurgicalPlan: 'call neurosurgery 206-555-0123' } });
    expect(outputWarnings(state).length).toBeGreaterThan(0);
    const label = ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields).find(field => field.key === 'ichSurgicalPlan').label;
    expect(encounterDetailWarningSources(state, getPublicDemoPhiWarnings)).toEqual([{ label: outputWarnings(state)[0], key: 'ichSurgicalPlan', field: label, hidden: true }]);
    expect(encounterDetailWarningSources({ ...state, note: { ...state.note, diagnosisCategory: 'ich' } }, getPublicDemoPhiWarnings)[0].hidden).toBe(false);
    const cleared = { ...state, details: {} };
    expect(outputWarnings(cleared)).toEqual([]);
  });
  it('labels the discharge score source without inviting a date', () => {
    expect(ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields).find(field => field.key === 'dischargeScoreSource').label).toBe('Discharge score source / timing (e.g., hospital day) / limitations');
    expect(outputWarnings(make({ details: { dischargeMrs: '2', dischargeScoreSource: 'hospital day 5' } }))).toEqual([]);
  });
});

describe('no undefined / null / NaN in generated notes', () => {
  it.each(['', 'ischemic', 'ich', 'sah', 'tia', 'cvt', 'mimic', 'other'])('empty %s encounter in every format and context', diagnosisCategory => {
    for (const context of ['acute', 'follow-up']) for (const text of allOutputs(make({ context, note: { diagnosisCategory } }))) expect(text).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/);
  });
});
