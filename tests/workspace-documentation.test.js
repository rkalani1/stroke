import { describe, expect, it } from 'vitest';
import { buildSummary, newEncounter, outputWarnings, updateEncounter, copySummary } from '../src/workspace-state.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';

const NOW = new Date('2026-10-01T12:00:00').getTime();
const zeroExam = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
const make = (consultationType, patch = {}) => {
  const state = newEncounter();
  return { ...state, consultationType, ...patch, note: { ...state.note, diagnosisCategory: 'ischemic', age: '65', sex: 'F', weight: '80', chiefComplaint: 'Left arm weakness', symptoms: 'left arm weakness beginning this morning', pmh: 'Hypertension', medications: 'Amlodipine', lkwDate: '2026-10-01', lkwTime: '10:00', presentingBP: '140/80', glucose: '105', heartRate: '72', spO2: '98', temperature: '98.6', plateletCount: '210', creatinine: '1.1', inr: '1.0', ptt: '28', pt: '12', premorbidMRS: '0', ctTime: '10:30', ctResults: 'No hemorrhage described', ctaDate: '2026-10-01', ctaTime: '10:40', ctaResults: 'Right M1 occlusion described', vesselOcclusion: ['M1'], coreVolume: '20', penumbraVolume: '50', ekgResults: 'Sinus rhythm described', clinicianName: 'Reviewing clinician', ...patch.note }, nihss: patch.nihss || zeroExam };
};

describe('restored telephone Pulsara and video Epic documentation', () => {
  it('generates a concise telephone paragraph from canonical history and documented findings', () => {
    const state = make('phone', { rationale: 'Discussed the entered findings with the treating team.', assessment: 'Working clinical assessment entered by the clinician.' });
    const text = buildSummary(state, NOW);
    expect(text).toMatch(/^65 year old female \(Wt: 80kg\) with Hypertension who presents with left arm weakness/);
    expect(text).toContain('Last known well (date/time): 2026-10-01 10:00');
    expect(text).toContain('Pre-mRS: 0. NIHSS score: 0/42 (all items documented)');
    expect(text).toContain('Head CT (10:30; date not documented): No hemorrhage described');
    expect(text).toContain('CTA Head/Neck (2026-10-01 10:40): Right M1 occlusion described; Vessel imaging: M1');
    expect(text).toContain('Core: 20 mL');
    expect(text).toContain('Calculated mismatch volume: 30 mL');
    expect(text).toContain('arithmetic does not establish eligibility');
    expect(text).toContain('Medications: Amlodipine');
    expect(text).toContain(state.assessment);
    expect(text).toContain(state.rationale);
    expect(text).not.toContain('\n');
    expect(text).not.toContain('Reason for Consultation:');
  });

  it('restores the full video template sections and entered objective data', () => {
    const state = make('video', { assessment: 'Clinician assessment.', rationale: 'Clinician recommendations.', note: { nihssDetails: 'All items explicitly completed.' } });
    const text = buildSummary(state, NOW);
    expect(text).toMatch(/^Reason for Consultation: Acute stroke evaluation — Left arm weakness\n\nChief complaint:/);
    for (const section of ['Chief complaint: Left arm weakness', 'Last known well (date/time): 2026-10-01 10:00', 'HPI: 65 year old female p/w left arm weakness', 'Relevant PMH: Hypertension', 'Medications: Amlodipine', 'Objective:', 'Vitals: BP 140/80, HR 72, SpO2 98%, Temp 98.6°F', 'Labs: Glucose 105, Plt 210 K/µL, Cr 1.1, INR 1.0, aPTT 28, PT 12', 'Exam: NIHSS 0/42 (all items documented)', 'Imaging findings:', 'NCCT Head (10:30; date not documented):', 'CTA Head/Neck (2026-10-01 10:40):', 'CTP:', 'Telemetry/EKG: Sinus rhythm described', 'Assessment and Plan:', 'Suspected Diagnosis: Ischemic stroke', 'Recommendations:', 'Clinician Name: Reviewing clinician']) expect(text).toContain(section);
    expect(text).toContain('All items explicitly completed.');
    expect(text).toContain('Clinician assessment.');
    expect(text).toContain('Clinician recommendations.');
  });

  it.each(['phone', 'video'])('removes the previous output labels and consultation banner for %s', format => {
    const text = buildSummary(make(format), NOW);
    expect(text).not.toMatch(/synthetic educational demo|not a real clinical note|no phi/i);
    expect(text).not.toMatch(/^Acute (telephone|video) consultation/m);
    expect(text).not.toMatch(/^Follow-up (telephone|video) consultation/m);
  });

  it.each(['phone', 'video'])('preserves complete zero and withholds a completed score after one item is cleared for %s', format => {
    const state = make(format);
    expect(buildSummary(state, NOW)).toContain('0/42 (all items documented)');
    const partial = { ...state, nihss: { ...state.nihss, motor_arm_left: 'No movement (4)', dysarthria: '' } };
    const text = buildSummary(partial, NOW);
    expect(text).toContain('incomplete: 14/15 items; partial sum 4; no completed score');
    expect(text).not.toContain('0/42 (all items documented)');
    partial.nihss.dysarthria = 'Intubated/other (UN)';
    expect(buildSummary(partial, NOW)).toContain('4/42 (all items documented; 1 item untestable (UN), not scored)');
  });

  it.each(['phone', 'video'])('distinguishes undocumented findings from negative findings in %s', format => {
    const state = newEncounter(); state.consultationType = format;
    const text = buildSummary(state, NOW);
    expect(text).toContain('CT hemorrhage review: not documented');
    expect(text).toContain('CTP: not documented');
    expect(text).toContain('Last known well (date/time): not documented');
    expect(text).not.toContain('No hemorrhage');
    expect(text).not.toContain('CTP: N/A');
    expect(text).not.toContain('GCS: 15');
    if (format === 'video') expect(text).toContain('Telemetry/EKG: not documented');
  });

  it.each(['phone', 'video'])('qualifies unknown onset and invalid/future/incomplete dates in %s', format => {
    const unknown = make(format, { note: { lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '11:00' } });
    const unknownText = buildSummary(unknown, NOW);
    expect(unknownText).toContain('Last known well: UNKNOWN');
    expect(unknownText).toContain('Discovery: 2026-10-01 11:00; discovery does not establish onset');
    expect(unknownText).not.toContain('Last known well (date/time): 2026-10-01 10:00');
    for (const [date, time] of [['2026-02-30', '11:00'], ['2026-10-01', '13:00']]) {
      const text = buildSummary(make(format, { note: { lkwDate: date, lkwTime: time, ctaDate: date, ctaTime: time } }), NOW);
      expect(text).toContain(`${date} ${time} (invalid or future; correct before interpretation)`);
    }
    expect(buildSummary(make(format, { note: { lkwTime: '', ctaTime: '' } }), NOW)).toContain('incomplete date/time; correct before interpretation');
    expect(buildSummary(make(format, { note: { ctTime: '25:90' } }), NOW)).toContain('25:90 (invalid time; correct before interpretation)');
  });

  it.each(['phone', 'video'])('records consent and treatment events only through their independent explicit fields in %s', format => {
    const state = make(format, { drug: 'Alteplase', decisions: { ivt: 'Recommended', evt: 'Recommended' } });
    expect(buildSummary(state, NOW)).toContain('IVT administration: not documented');
    expect(buildSummary(state, NOW)).toContain('Consent status: not documented');
    expect(buildSummary(state, NOW)).not.toContain('safety pause completed');
    state.actions.administrationTime = '2026-10-01T11:00';
    expect(buildSummary(state, NOW)).not.toContain('Alteplase at');
    state.actions.administered = true;
    state.actions.consent = 'Informed consent';
    state.actions.consentTime = '2026-10-01T10:50';
    expect(buildSummary(state, NOW)).toContain('IVT administration: Alteplase at 2026-10-01 11:00');
    expect(buildSummary(state, NOW)).toContain('Consent status: Informed consent');
    expect(buildSummary(state, NOW)).toContain('IVT Consent time: 2026-10-01 10:50');
    state.actions.administrationTime = '2026-10-01T13:00';
    state.actions.consentTime = '2026-10-01T13:00';
    state.actions.punctureTime = '2026-02-30T11:00';
    expect(buildSummary(state, NOW)).not.toContain('Alteplase at');
    expect(buildSummary(state, NOW)).toContain('IVT Consent time: invalid or future');
    expect(buildSummary(state, NOW)).toContain('EVT puncture: invalid or future');
  });

  it.each(['phone', 'video'])('includes the entered manual rationale once and never recycles a generated draft in %s', format => {
    const state = make(format, { rationale: 'Entered clinician rationale.', draft: { text: 'OBSOLETE GENERATED DOCUMENT', stale: false } });
    const text = buildSummary(state, NOW);
    expect(text.split(state.rationale)).toHaveLength(2);
    expect(text).not.toContain('OBSOLETE GENERATED DOCUMENT');
    expect(buildSummary(updateEncounter(state, { rationale: '' }), NOW)).not.toContain(state.rationale);
    expect(updateEncounter(state, { rationale: '' }).draft.stale).toBe(true);
  });

  it.each(['phone', 'video'])('exports ICH source measurements while omitting incompatible reperfusion sources in %s', format => {
    const state = make(format, { note: { diagnosisCategory: 'ich', tnkContraindicationChecklist: { priorICH: true } }, volume: { a: '4', b: '4', thicknessMm: '5', numSlices: '5' }, ich: { ivh: false, infratentorial: '' }, gcs: { eye: '4', verbal: '5', motor: '6' }, drug: 'TNK', actions: { ...newEncounter().actions, administered: true, administrationTime: '2026-10-01T11:00' } });
    const text = buildSummary(state, NOW);
    expect(text).toContain('ABC/2 volume: 20 mL (approximate)');
    expect(text).toContain('Intraventricular hemorrhage: absent (reviewed)');
    expect(text).toContain('Infratentorial origin: not assessed');
    expect(text).toContain('GCS E4 V5 M6 = 15/15');
    expect(text).not.toContain('IVT administration');
    expect(text).not.toContain('Vessel imaging: M1');
    expect(text).not.toContain('Core: 20 mL');
    const followUp = { ...state, context: 'follow-up', note: { ...state.note, diagnosisCategory: 'ischemic' } };
    expect(buildSummary(followUp, NOW)).not.toContain('IVT administration');
    expect(buildSummary(followUp, NOW)).not.toContain('Core: 20 mL');
    if (format === 'video') expect(buildSummary(followUp, NOW)).toMatch(/^Reason for Consultation: Stroke follow-up/);
    else expect(buildSummary(followUp, NOW)).toContain('seen in follow-up for');
  });

  it.each(['phone', 'video'])('preserves the imaging-selected partial-source qualifier in %s', format => {
    const state = make(format, { note: { lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '11:00', wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: true } } });
    const text = buildSummary(state, NOW);
    expect(text).toContain('MRI (WAKE-UP)');
    expect(text).toContain('complete eligibility and drug-specific treatment decision require review');
    expect(text).not.toContain('TNK was administered');
  });

  it.each(['phone', 'video'])('preserves a reviewed but nonqualifying MRI extent in %s', format => {
    const state = make(format, { note: { lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '11:00', wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, mriLesionExtentReviewed: true, dwiLesionUnderOneThirdMCA: false } } });
    const text = buildSummary(state, NOW);
    expect(text).toContain('MRI (WAKE-UP): incomplete or not met;');
    expect(text).toContain('MRI lesion extent reviewed: documented.');
    expect(text).toContain('DWI lesion smaller than one-third MCA territory: no.');
    expect(text).not.toContain('partial source screen met');
  });

  it('allows structured clinical dates while scanning malformed dates and narratives that start with a timestamp', () => {
    const state = make('video', { note: { lastDOACType: 'apixaban', lastDOACDose: '2026-10-01T08:00' } });
    expect(outputWarnings(state)).toEqual([]);
    state.note.ctaDate = 'user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
    state.note.ctaDate = '2026-10-01';
    state.actions.discussion = '2026-10-01T10:30 user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
    state.actions.discussion = '';
    state.note.lastDOACDose = 'user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
  });

  it('initializes restored CT date, CTP narrative and discussion details as empty canonical fields', () => {
    const state = newEncounter();
    expect(state.note.ctDate).toBe('');
    expect(state.note.ctpResults).toBe('');
    expect(state.actions.discussionDetails).toBe('');
    const text = buildSummary(state, NOW);
    expect(text).not.toContain('Discussion details:');
    expect(text).toContain('CTP: not documented');
  });

  it.each(['phone', 'video'])('exports exact entered CT date and local time without inventing a date in %s', format => {
    const state = make(format, { note: { ctDate: '2026-10-01', ctTime: '10:30' } });
    if (format === 'video') expect(buildSummary(state, NOW)).toContain('NCCT Head (2026-10-01 10:30)');
    else expect(buildSummary(state, NOW)).toContain('Head CT (2026-10-01 10:30)');
    const timeOnly = make(format, { note: { ctDate: '', ctTime: '10:30' } });
    expect(buildSummary(timeOnly, NOW)).toContain('10:30; date not documented');
    const dateOnly = make(format, { note: { ctDate: '2026-10-01', ctTime: '' } });
    expect(buildSummary(dateOnly, NOW)).toContain('2026-10-01 [time not documented] (incomplete date/time; correct before interpretation)');
    expect(buildSummary(dateOnly, NOW)).not.toContain('2026-10-01 00:00');
    for (const [ctDate, ctTime] of [['2026-02-30', '10:30'], ['2026-10-01', '13:00']]) {
      expect(buildSummary(make(format, { note: { ctDate, ctTime } }), NOW)).toContain(`${ctDate} ${ctTime} (invalid or future; correct before interpretation)`);
    }
  });

  it.each(['phone', 'video'])('exports explicit discussion details separately from event status and CTP findings in %s', format => {
    const state = make(format, { note: { ctpResults: 'Perfusion findings entered by the reviewing clinician.' } });
    state.actions.discussionDetails = 'Questions remain about the available options.';
    const text = buildSummary(state, NOW);
    expect(text).toContain('Discussion details: Questions remain about the available options.');
    expect(text).toContain('Discussion: not documented');
    expect(text).toContain('Consent status: not documented');
    expect(text).toContain('IVT administration: not documented');
    expect(text).toContain(state.note.ctpResults);
    expect(state.actions.discussion).toBe('');
    expect(state.actions.consent).toBe('');
    expect(state.actions.administered).toBe(false);
    state.actions.discussion = 'Completed';
    expect(buildSummary(state, NOW)).toContain('Discussion: Completed');
    state.actions.discussionDetails = '';
    expect(buildSummary(state, NOW)).not.toContain('Discussion details:');
    expect(buildSummary(state, NOW)).toContain('Discussion: Completed');
  });

  it('invalidates drafts after restoring, editing or clearing the CT date, CTP narrative or discussion details', () => {
    const state = newEncounter(); state.draft = { text: 'Old generated document', stale: false };
    for (const patch of [
      { note: { ...state.note, ctDate: '2026-10-01' } },
      { note: { ...state.note, ctDate: '' } },
      { note: { ...state.note, ctpResults: 'Clinician-entered findings.' } },
      { note: { ...state.note, ctpResults: '' } },
      { actions: { ...state.actions, discussionDetails: 'Clinician-entered discussion details.' } },
      { actions: { ...state.actions, discussionDetails: '' } }
    ]) expect(updateEncounter(state, patch).draft.stale).toBe(true);
  });

  it('scans restored narrative sinks and malformed CT dates while allowing structured clinical dates', () => {
    const state = make('video', { note: { ctDate: '2026-10-01' } });
    expect(outputWarnings(state)).toEqual([]);
    state.note.ctDate = 'user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
    state.note.ctDate = '2026-10-01';
    state.note.ctpResults = 'user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
    state.note.ctpResults = '';
    state.actions.discussionDetails = '2026-10-01T10:30 user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
  });

  it.each(['chiefComplaint', 'symptoms', 'pmh', 'heartRate', 'spO2', 'temperature', 'plateletCount', 'pt', 'ctTime', 'ctResults', 'ctaResults', 'ekgResults', 'nihssDetails', 'clinicianName'])('checks the newly exported %s field before copying', async field => {
    const state = make('video', { note: { [field]: 'user@example.invalid' } });
    expect(outputWarnings(state)).toContain('Possible email address');
    state.draft = { text: buildSummary(state, NOW), stale: false };
    let writes = 0;
    expect(await copySummary({ current: state }, state.draft.text, async () => { writes++; })).toBe('blocked');
    expect(writes).toBe(0);
  });
});


it.each(['phone','video'])('unknown LKW alone does not invent an onset cause in %s documentation', format => {
  const state = newEncounter(); state.consultationType = format; state.note.lkwUnknown = true;
  expect(buildSummary(state, NOW)).toContain('Last known well: UNKNOWN.');
  expect(buildSummary(state, NOW)).not.toMatch(/wake-up stroke \/ unwitnessed onset/);
});


it('preserves an explicitly entered chief complaint in the Pulsara paragraph', () => {
  const state = newEncounter(); state.note.chiefComplaint = 'Unresolved dizziness';
  expect(buildSummary(state, NOW)).toContain('Chief complaint: Unresolved dizziness.');
  state.note.chiefComplaint = '';
  expect(buildSummary(state, NOW)).not.toContain('Chief complaint:');
});


describe('perfusion narrative across supported contexts', () => {
  it.each(['phone', 'video'])('retains entered narrative without activating selection arithmetic for %s', consultationType => {
    for (const context of ['acute', 'follow-up']) {
      const state = newEncounter(); state.context = context; state.consultationType = consultationType;
      Object.assign(state.note, { diagnosisCategory: 'tia', ctpResults: 'Reviewed prior perfusion findings.', coreVolume: '20', penumbraVolume: '60' });
      const result = buildSummary(state, NOW);
      expect(result).toContain('CTP: Reviewed prior perfusion findings.');
      expect(result).not.toContain('Calculated mismatch volume');
    }
  });
});
