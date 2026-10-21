// Encounter review 2026-10-21: event timing across midnight, daylight-saving changes and zones,
// impossible ordering, note wording for missing versus negative entries, and a fixed-seed fuzz of
// every documentation format. Expected values come from UTC arithmetic and the field definitions,
// not from the formatter.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSummary, encounterTiming, newEncounter, deviceTimeZoneText } from '../src/workspace-state.js';
import { formatRecordedInstant, enteredTime } from '../src/clinical/timestamp.js';
import { formatTimeline, timelineIntervals, TIMELINE_FIELDS } from '../src/encounter-timeline.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { elapsedEncounterTime } from '../src/clinical/encounter-time.js';
import { encounterOverview } from '../src/encounter-overview.js';
import { DOCUMENT_FORMATS } from '../src/documentation-output.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';
import { ENCOUNTER_DETAIL_GROUPS } from '../src/encounter-details.js';
import { DOCUMENTATION_PROMPTS } from '../src/documentation-prompts.js';

const priorZone = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
afterAll(() => { if (priorZone === undefined) delete process.env.TZ; else process.env.TZ = priorZone; });
const inZone = (zone, run) => { const previous = process.env.TZ; process.env.TZ = zone; try { return run(); } finally { process.env.TZ = previous; } };
const minutesBetween = (fromIso, toIso) => (Date.parse(toIso) - Date.parse(fromIso)) / 60000;
const encounter = (patch = {}) => {
  const state = newEncounter();
  return { ...state, ...patch, note: { ...state.note, diagnosisCategory: 'ischemic', ...patch.note }, actions: { ...state.actions, ...patch.actions }, decisions: { ...state.decisions, ...patch.decisions } };
};
const line = (text, label) => text.split('\n').find(entry => entry.startsWith(label)) || '';

describe('elapsed time derives from recorded instants', () => {
  it('crosses midnight from the recorded date and never repairs a same-date future time as the next day', () => {
    const now = Date.parse('2026-10-21T01:00:00-07:00');
    const prior = encounterTiming({ lkwDate: '2026-10-20', lkwTime: '23:30' }, now);
    expect(prior.clock.elapsedMinutes).toBe(minutesBetween('2026-10-20T23:30:00-07:00', '2026-10-21T01:00:00-07:00'));
    // 23:30 on the current date is in the future at 01:00: invalid, not 90 minutes "since yesterday".
    const sameDate = encounterTiming({ lkwDate: '2026-10-21', lkwTime: '23:30' }, now);
    expect(sameDate).toMatchObject({ clock: null, invalid: true, hours: null });
    const text = buildSummary(encounter({ note: { lkwDate: '2026-10-21', lkwTime: '23:30' } }), now);
    expect(text).toContain('Last known well (date/time): 2026-10-21 23:30 (invalid or future; correct before interpretation)');
    // The shared elapsed helper reports a future reference as a warning with zero elapsed, never as a wrapped day.
    expect(elapsedEncounterTime({ time: new Date(now + 60000), label: 'LKW' }, new Date(now))).toMatchObject({ seconds: 0, total: 0, futureWarning: true });
  });

  it('recomputes from wall time after a suspension instead of accumulating ticks', () => {
    const note = { lkwDate: '2026-10-21', lkwTime: '09:00' };
    const before = encounterTiming(note, Date.parse('2026-10-21T10:00:00-07:00')).clock.elapsedMinutes;
    const after = encounterTiming(note, Date.parse('2026-10-21T13:00:00-07:00')).clock.elapsedMinutes;
    expect([before, after]).toEqual([60, 240]);
  });

  it('requires a chosen occurrence for a repeated fall-back hour (America/Los_Angeles 2026-11-01 01:30)', () => {
    const now = Date.parse('2026-11-01T03:00:00-08:00');
    const note = { lkwDate: '2026-11-01', lkwTime: '01:30' };
    expect(encounterTiming(note, now)).toMatchObject({ clock: null, invalid: true });
    const first = { ...note, lkwClock: { value: '2026-11-01T01:30', instant: '2026-11-01T08:30:00.000Z' } };
    const second = { ...note, lkwClock: { value: '2026-11-01T01:30', instant: '2026-11-01T09:30:00.000Z' } };
    expect(encounterTiming(first, now).clock.elapsedMinutes).toBe(minutesBetween('2026-11-01T01:30:00-07:00', '2026-11-01T03:00:00-08:00'));
    expect(encounterTiming(second, now).clock.elapsedMinutes).toBe(minutesBetween('2026-11-01T01:30:00-08:00', '2026-11-01T03:00:00-08:00'));
    expect(buildSummary(encounter({ note: first }), now)).toContain('Last known well (date/time): 2026-11-01 01:30 (UTC−07:00)');
  });

  it('rejects a skipped spring-forward time and measures across the change in real minutes', () => {
    const now = Date.parse('2026-03-08T05:00:00-07:00');
    expect(encounterTiming({ lkwDate: '2026-03-08', lkwTime: '02:30' }, now)).toMatchObject({ clock: null, invalid: true });
    expect(encounterTiming({ lkwDate: '2026-03-08', lkwTime: '01:30' }, now).clock.elapsedMinutes).toBe(minutesBetween('2026-03-08T01:30:00-08:00', '2026-03-08T05:00:00-07:00'));
  });

  it('labels each time with its own UTC offset when a note spans a daylight-saving change', () => {
    const now = Date.parse('2026-11-01T03:00:00-08:00');
    const state = encounter({ drug: 'TNK', note: { lkwDate: '2026-10-31', lkwTime: '23:30' }, decisions: { ivt: 'Recommended' }, actions: { administered: true, agentConfirmed: 'TNK', administrationTime: '2026-11-01T02:30' } });
    for (const consultationType of ['phone', 'video']) {
      const text = buildSummary({ ...state, consultationType }, now);
      // 23:30 PDT (UTC−07:00) precedes the change; 02:30 occurs once, after it, in PST like the Times line.
      expect(text).toContain('Last known well (date/time): 2026-10-31 23:30 (UTC−07:00)');
      expect(text).toContain('TNK at 2026-11-01 02:30 (calculated');
      expect(text).toContain('Times: local to the documenting device (America/Los_Angeles, PST)');
    }
    // Times on the same side of the change as the note carry no offset.
    expect(formatRecordedInstant('2026-11-01T02:30', now)).toBe('2026-11-01 02:30');
    expect(formatRecordedInstant('2026-10-31T23:30', Date.parse('2026-10-31T23:45:00-07:00'))).toBe('2026-10-31 23:30');
    // Without a reference only the repeated hour is marked (unchanged behaviour for other callers).
    expect(formatRecordedInstant('2026-10-31T23:30')).toBe('2026-10-31 23:30');
  });

  it('applies the same rule in a second zone (Europe/London, BST to GMT on 2026-10-25)', () => inZone('Europe/London', () => {
    const now = Date.parse('2026-10-25T03:00:00Z');
    expect(encounterTiming({ lkwDate: '2026-10-25', lkwTime: '01:30' }, now)).toMatchObject({ clock: null, invalid: true });
    const note = { lkwDate: '2026-10-24', lkwTime: '23:00' };
    expect(encounterTiming(note, now).clock.elapsedMinutes).toBe(minutesBetween('2026-10-24T23:00:00+01:00', '2026-10-25T03:00:00Z'));
    const text = buildSummary(encounter({ consultationType: 'video', note }), now);
    expect(text).toContain('Last known well (date/time): 2026-10-24 23:00 (UTC+01:00)');
    expect(text).toContain('Times: local to the documenting device (Europe/London, GMT)');
  }));

  it('adds no offsets in a zone without daylight saving and names a UTC device once', () => {
    inZone('Asia/Kolkata', () => {
      const now = Date.parse('2026-10-21T10:00:00+05:30');
      const text = buildSummary(encounter({ note: { lkwDate: '2026-10-21', lkwTime: '08:00' } }), now);
      expect(text).toContain('Last known well (date/time): 2026-10-21 08:00.');
      expect(text).not.toContain('(UTC');
      expect(encounterTiming({ lkwDate: '2026-10-21', lkwTime: '08:00' }, now).clock.elapsedMinutes).toBe(120);
    });
    inZone('UTC', () => expect(deviceTimeZoneText(Date.parse('2026-10-21T10:00:00Z'))).toBe('local to the documenting device (UTC)'));
  });
});

describe('impossible ordering is flagged, never repaired', () => {
  const now = Date.parse('2026-10-21T12:00:00-07:00');
  it('flags treatment and discovery before LKW, reversed procedure times and late consent', () => {
    const state = encounter({ consultationType: 'video', drug: 'TNK', note: { lkwDate: '2026-10-21', lkwTime: '09:00', discoveryDate: '2026-10-21', discoveryTime: '08:00' }, decisions: { ivt: 'Recommended', evt: 'Recommended' },
      actions: { administered: true, agentConfirmed: 'TNK', administrationTime: '2026-10-21T08:30', punctureTime: '2026-10-21T10:00', reperfusionTime: '2026-10-21T09:45', consent: 'Informed consent', consentTime: '2026-10-21T08:45' } });
    const text = buildSummary(state, now);
    expect(text).toContain('Last known well (date/time): 2026-10-21 09:00; symptom discovery: 2026-10-21 08:00 [discovery precedes LKW; review recorded dates/times]');
    expect(line(text, 'IVT administration')).toContain('[IVT time precedes LKW; review recorded dates/times]');
    expect(line(text, 'EVT reperfusion')).toContain('EVT reperfusion precedes puncture');
    expect(line(text, 'IVT Consent time')).toContain('[recorded after the administration time; confirm the consent timeline]');
    // A discovery time after a known LKW is kept without a flag.
    const ordered = buildSummary({ ...state, note: { ...state.note, discoveryTime: '09:40' } }, now);
    expect(ordered).toContain('2026-10-21 09:00; symptom discovery: 2026-10-21 09:40\n');
  });

  it('reports a reversed door-to-needle or midnight interval as invalid instead of adding a day', () => {
    const state = encounter({ drug: 'TNK', actions: { administered: true, administrationTime: '2026-10-21T08:30' }, timeline: { arrival: '2026-10-21T10:00', ctStart: '2026-10-20T23:50' } });
    const intervals = Object.fromEntries(timelineIntervals(state, now).map(entry => [entry.label, entry]));
    expect(intervals['Door to IVT']).toMatchObject({ minutes: null, text: 'Invalid, future, reversed or ambiguous local timestamps' });
    expect(intervals['Door to CT'].minutes).toBeNull();
    // A forward interval across midnight is measured in real minutes.
    const overnight = { ...state, timeline: { arrival: '2026-10-20T23:50', ctStart: '2026-10-21T00:10' } };
    expect(timelineIntervals(overnight, now).find(entry => entry.label === 'Door to CT').minutes).toBe(20);
  });

  it('keeps an unusable entered time visible with the reason, and never treats it as given or performed', () => {
    const state = encounter({ drug: 'TNK', note: { lastDOACType: 'apixaban', lastDOACDose: '2026-10-21T21:00:00.000Z' },
      actions: { administered: true, administrationTime: '2026-10-21T13:30', punctureTime: '2026-02-30T11:00', reperfusionTime: '2026-11-01T01:30', consentTime: '2026-10-21T12:30', evtConsentTime: '2026-10-21T13:00', evtConsent: 'Declined' }, timeline: { arrival: '2026-10-21T19:30:00.000Z' } });
    const text = buildSummary({ ...state, consultationType: 'video' }, now);
    expect(line(text, 'IVT administration')).toBe('IVT administration: not documented as given (entered time 2026-10-21 13:30 is invalid or future; correct before interpretation)');
    expect(text).not.toContain('TNK at');
    expect(line(text, 'EVT puncture')).toBe('EVT puncture: 2026-02-30 11:00 (invalid or future; correct before interpretation)');
    expect(line(text, 'EVT reperfusion')).toBe('EVT reperfusion: 2026-11-01 01:30 (ambiguous local time; choose the recorded clock occurrence before interpretation)');
    // A consent time without a status is kept and named as incomplete, never dropped.
    expect(line(text, 'IVT Consent time')).toBe('IVT Consent time: 2026-10-21 12:30 (invalid or future; correct before interpretation) [consent status not documented]');
    expect(line(text, 'EVT consent time')).toBe('EVT consent time: 2026-10-21 13:00 (invalid or future; correct before interpretation)');
    // A stamped instant (with seconds) is shown as local wall time with its seconds.
    expect(line(text, 'Last anticoagulant dose')).toBe('Last anticoagulant dose: 2026-10-21 14:00:00 (invalid or future; correct before interpretation)');
    expect(formatTimeline(state, now)).toContain('ED arrival: 2026-10-21 12:30:00 (invalid or future, or ambiguous local time; review)');
    expect(enteredTime('2026-10-21T16:30:00.000Z')).toBe('2026-10-21 09:30:00');
  });
});

describe('notes keep missing, negative, proposed and completed distinct', () => {
  const now = Date.parse('2026-10-21T10:00:00-07:00');
  it.each(['phone', 'video', 'handoff'])('states that no NIHSS item was scored, never a partial sum of 0 (%s)', format => {
    const state = encounter(format === 'handoff' ? { documentFormat: 'handoff' } : { consultationType: format });
    const text = buildSummary(state, now);
    expect(text).toContain('incomplete: 0/15 items scored; no completed score');
    expect(text).not.toContain('partial sum 0');
    // One item scored 0 is a real partial examination and keeps its partial sum.
    expect(buildSummary({ ...state, nihss: { consciousness: 'Alert (0)' } }, now)).toContain('incomplete: 1/15 items; partial sum 0; no completed score');
  });

  it('states that EVT was not documented as performed when only a recommendation and consent exist', () => {
    const recommended = encounter({ decisions: { evt: 'Recommended' }, actions: { evtConsent: 'Informed consent' } });
    for (const documentFormat of ['consultation', 'handoff']) {
      const text = buildSummary({ ...recommended, consultationType: 'video', documentFormat }, now);
      expect(text).toContain('EVT clinician decision: Recommended');
      expect(text).toContain('EVT puncture: not documented');
      expect(text).not.toContain('EVT reperfusion');
    }
    // A reperfusion time without a puncture time keeps the missing puncture visible, in order.
    const partial = buildSummary({ ...recommended, consultationType: 'video', actions: { ...recommended.actions, reperfusionTime: '2026-10-21T09:30' } }, now);
    expect(partial).toContain('EVT puncture: not documented\nEVT reperfusion: 2026-10-21 09:30\n');
    // Non-ischemic and follow-up notes carry no acute EVT line at all.
    expect(buildSummary({ ...recommended, note: { ...recommended.note, diagnosisCategory: 'ich' } }, now)).not.toContain('EVT puncture');
    expect(buildSummary({ ...recommended, context: 'follow-up' }, now)).not.toContain('EVT puncture');
  });

  it('names an unrecorded study time instead of reading as an undocumented study', () => {
    const text = buildSummary(encounter({ consultationType: 'video', note: { ctaResults: 'Left M1 occlusion' } }), now);
    expect(text).toContain('CTA Head/Neck (time not documented): Left M1 occlusion');
    expect(text).toContain('NCCT Head (time not documented): not documented');
  });

  it('trims entered text and keeps a one-line Pulsara paragraph readable', () => {
    const state = encounter({ assessment: '  Large vessel syndrome  \n', rationale: 'Transfer for EVT\nRepeat CTA not needed', note: { medications: ' aspirin ', nihssDetails: 'Examined via video.', ctResults: 'No hemorrhage.' },
      actions: { monitoring: 'Neuro checks q15 min\nBP every 15 min.\nPlan:\nescalate if worse' } });
    const phone = buildSummary(state, now);
    expect(phone).not.toContain('\n');
    expect(phone).toContain('Medications: aspirin. Assessment: Large vessel syndrome.');
    expect(phone).toContain('Clinician rationale / recommendations: Transfer for EVT; Repeat CTA not needed');
    expect(phone).toContain('Monitoring actions documented: Neuro checks q15 min; BP every 15 min. Plan: escalate if worse');
    expect(phone).toContain('Head CT (time not documented): No hemorrhage. CT hemorrhage review');
    const video = buildSummary({ ...state, consultationType: 'video' }, now);
    expect(video).toContain('Exam: NIHSS incomplete: 0/15 items scored; no completed score — Examined via video. Disabling deficit: not assessed');
    expect(video).toContain('Suspected Diagnosis: Ischemic stroke\nLarge vessel syndrome\n');
    expect(video).not.toMatch(/ [.;,]|\.;|[ \t]$/m);
  });

  it('exports a CTP/EXTEND screen with rounded arithmetic, explicit conflicts and no not-applicable scaffolding', () => {
    const base = { lkwUnknown: true, age: '70', premorbidMRS: '0', ctHemorrhageStatus: 'absent', wakeUpStrokeWorkflow: { mriAvailable: false, sleepMidpoint: '2026-10-21T04:00' } };
    const perfusion = (core, total) => line(formatWakeUpScreenForExport({ ...base, coreVolume: core, penumbraVolume: total }, new Date(now)), 'Perfusion core');
    // 33.3 - 12 = 21.3 mL; 33.3 / 12 = 2.775 → 2.78 (arithmetic rounding of the displayed value only).
    expect(perfusion('12', '33.3')).toBe('Perfusion core: 12 mL; total hypoperfused volume: 33.3 mL; calculated mismatch volume: 21.3 mL; mismatch ratio: 2.78.');
    expect(perfusion('30', '110')).toContain('mismatch ratio: 3.67.');
    expect(perfusion('30', '20')).toBe('Perfusion core: 30 mL; total hypoperfused volume: 20 mL; calculated mismatch volume: not calculable (total hypoperfused volume below core; reconcile); mismatch ratio: not calculable (total hypoperfused volume below core; reconcile).');
    expect(perfusion('0', '40')).toContain('calculated mismatch volume: 40 mL; mismatch ratio: not calculable (core 0).');
    expect(perfusion('', 'x')).toBe('Perfusion core: not documented or invalid; total hypoperfused volume: not documented or invalid; calculated mismatch volume: not documented or invalid; mismatch ratio: not documented or invalid.');
    // A known LKW within 4.5 h: the screen line alone (the CTP line and LKW are elsewhere in the note).
    const known = { ...base, lkwUnknown: false, lkwDate: '2026-10-21', lkwTime: '08:30', coreVolume: '30', penumbraVolume: '110' };
    expect(formatWakeUpScreenForExport(known, new Date(now))).toBe('Wake-up / unknown-onset imaging screen — CTP (EXTEND): not applicable (known LKW within 4.5 h); complete eligibility and drug-specific treatment decision require review.');
    // The MRI pathway keeps its recorded findings even when the screen does not apply.
    const mri = formatWakeUpScreenForExport({ ...known, wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true } } }, new Date(now)).split('\n');
    expect(mri).toEqual(['Wake-up / unknown-onset imaging screen — MRI (WAKE-UP): not applicable (known LKW within 4.5 h); complete eligibility and drug-specific treatment decision require review.', 'DWI-positive lesion: documented.', 'No marked corresponding FLAIR hyperintensity: not documented.', 'MRI lesion extent reviewed: not documented.', 'DWI lesion smaller than one-third MCA territory: not documented.']);
  });

  it('starts every optional format with its clinical context directly under the heading', () => {
    for (const [documentFormat] of DOCUMENT_FORMATS.filter(([id]) => !['consultation', 'handoff'].includes(id))) {
      expect(buildSummary(encounter({ consultationType: 'video', documentFormat }), now)).toMatch(/\n\nClinical context:\nReason for Consultation: Acute stroke evaluation\n/);
    }
  });

  it('labels an entered but unusable core value for correction in the completion counter', () => {
    const state = encounter({ note: { age: '130', weight: '0', presentingBP: '170/', glucose: '', lkwDate: '2026-10-21', lkwTime: '23:00' } });
    const labels = encounterOverview(state, now).missing.map(entry => entry.label);
    expect(labels).toEqual(expect.arrayContaining(['Age (check entry)', 'Weight (check entry)', 'Blood pressure (check entry)', 'Glucose', 'LKW date and time (check entry)']));
    expect(encounterOverview(state, now).missing.find(entry => entry.label.startsWith('Blood pressure')).target).toBe('input-dbp');
  });
});

// Fixed-seed fuzz: randomized synthetic encounters through every format. The pools hold synthetic
// text only; entered text never contains the artifact words checked below.
describe('documentation fuzz (fixed seed)', () => {
  let seed = 20261021;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const pick = list => list[Math.floor(random() * list.length)];
  const chance = p => random() < p;
  const TEXT = ['', '  ', 'left arm weakness', 'aphasia; right face droop', 'HTN, DM2', 'see prior imaging', 'Résumé of événement', 'line one\nline two', 'ends with a period.', 'trailing space ', '\nleading newline', 'Plan:\nrepeat CT'];
  const NUMBER = ['', ' ', '0', '1', '12', '82', '82.5', '-3', '1e3', 'abc', '400', '99999', '0.5', '30.1', '110.3', '33.3', '7.7', ' 80 '];
  const DATE = ['', '2026-10-21', '2026-10-20', '2026-10-22', '2026-02-30', '2026-11-01', '2026-03-08'];
  const TIME = ['', '00:00', '01:30', '02:30', '08:15', '09:59', '23:30', '10:00:30'];
  const STAMP = ['', '2026-10-21T08:30', '2026-10-21T09:45', '2026-10-21T11:00', '2026-10-20T23:50', '2026-11-01T01:30', '2026-03-08T02:30', '2026-10-21T16:30:00.000Z', '2026-02-30T08:00', '2026-11-01T08:30:00.000Z'];
  const DETAIL_FIELDS = ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields).filter(field => field.type !== 'worksheet');
  const option = list => pick(['', ...list]);
  function randomState() {
    const state = newEncounter(), n = state.note;
    state.context = pick(['acute', 'acute', 'follow-up']);
    n.diagnosisCategory = option(['ischemic', 'ischemic', 'ich', 'sah', 'tia', 'cvt', 'mimic', 'other']);
    for (const key of ['age', 'weight', 'creatinine', 'heightCm', 'glucose', 'inr', 'ptt', 'heartRate', 'spO2', 'temperature', 'plateletCount', 'pt', 'coreVolume', 'penumbraVolume']) n[key] = pick(NUMBER);
    n.sex = option(['M', 'F']); n.premorbidMRS = option(['0', '1', '2', '3', '4', '5', '6']);
    Object.assign(n, { lkwDate: pick(DATE), lkwTime: pick(TIME), lkwUnknown: chance(0.2), discoveryDate: pick(DATE), discoveryTime: pick(TIME), ctDate: pick(DATE), ctTime: pick(TIME), ctaDate: pick(DATE), ctaTime: pick(TIME) });
    n.presentingBP = pick(['', '170/', '/95', '170/95', '95/170', 'abc/def', '220/120', ' 150 / 90 ']);
    n.ctHemorrhageStatus = option(['absent', 'present', 'uncertain']);
    n.disablingDeficit = pick(['', true, false]);
    n.vesselOcclusion = pick([[], ['None'], ['M1'], ['ICA', 'M1'], ['M2'], ['Basilar'], ['M3 / distal', 'ACA']]);
    n.m2Segment = option(['dominant-proximal', 'codominant', 'nondominant', 'distal']);
    n.lastDOACType = option(['none', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'heparin', 'lmwh', 'other']);
    n.lastDOACDose = pick(STAMP); n.anticoagulantDoseIntent = option(['therapeutic', 'prophylactic']);
    n.medications = pick(['', 'apixaban 5 mg twice daily', 'aspirin', 'lisinopril 10 mg', ' none ']);
    for (const key of ['chiefComplaint', 'symptoms', 'pmh', 'ctResults', 'ctaResults', 'ctpResults', 'ekgResults', 'nihssDetails', 'clinicianName']) n[key] = pick(TEXT);
    n.ticiScore = option(['0', '1', '2a', '2b', '2c', '3']);
    n.tnkContraindicationChecklist = Object.fromEntries(SAFETY_ITEMS.filter(() => chance(0.3)).map(item => [item.id, chance(0.3)]));
    if (chance(0.15)) n.tnkContraindicationChecklist = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
    n.ivtContraindicationsReviewed = chance(0.4);
    n.wakeUpStrokeWorkflow = chance(0.35) ? { mriAvailable: pick([true, false, undefined]), dwi: { positiveForLesion: pick([true, false, undefined]), lesionVolume: pick(['', '4.25', 'x']) }, flair: { noMarkedHyperintensity: pick([true, undefined]) }, mriLesionExtentReviewed: pick([true, undefined]), dwiLesionUnderOneThirdMCA: pick([true, false, undefined]), sleepMidpoint: pick(STAMP) } : {};
    state.nihssSource = pick(['itemized', 'itemized', 'reported']); state.reportedNihss = pick(NUMBER);
    state.nihss = Object.fromEntries(NIHSS_ITEMS.slice(0, pick([0, 3, 14, 15, 15])).map(item => [item.id, pick(item.options)]));
    if (chance(0.2)) state.nihssBulkZero = NIHSS_ITEMS.slice(0, 5).map(item => item.id);
    state.gcs = chance(0.5) ? { eye: pick(['', '1', '4', 'UN']), verbal: pick(['', '5', 'UN', 'NT']), motor: pick(['', '6', '3']), notTestableReason: pick(['', 'intubated']) } : {};
    state.aspects = pick(['', '9', '11', 'x', '6']); state.pcAspects = pick(['', '8', '-1']);
    state.volume = { a: pick(NUMBER), b: pick(NUMBER), thicknessMm: pick(['', '5', '0', '50']), numSlices: pick(['', '6', '2.5']) };
    state.ich = { ivh: pick(['', true, false]), infratentorial: pick(['', true, false]) };
    state.drug = option(['TNK', 'Alteplase']); state.doseAuthority = pick(['guideline', 'fda-label']);
    state.decisions = { ivt: option(['Recommended', 'Not recommended', 'Specialist review']), evt: option(['Recommended', 'Not recommended', 'Specialist review']) };
    const prompt = () => chance(0.2) ? pick(DOCUMENTATION_PROMPTS).text : pick(TEXT);
    state.actions = { administered: chance(0.4), administrationTime: pick(STAMP), administeredDose: pick(NUMBER), punctureTime: pick(STAMP), reperfusionTime: pick(STAMP), discussion: option(['Discussed', 'Not discussed']), discussionDetails: prompt(), consent: option(['Informed consent', 'Surrogate consent', 'Presumed basis', 'Declined']), consentTime: pick(STAMP), evtDiscussion: option(['Discussed', 'Not discussed']), evtConsent: option(['Informed consent', 'Declined']), evtConsentTime: pick(STAMP), monitoring: prompt(), disposition: option(['Transfer', 'Admission', 'Discharge', 'Follow-up', 'Pending']), handoff: prompt(), agentConfirmed: pick(['', 'TNK', 'Alteplase']) };
    state.rationale = pick(TEXT); state.assessment = pick(TEXT);
    state.dapt = chance(0.3) ? { abcd2: pick(['', '5', '9', 'x']) } : {};
    state.timeline = Object.fromEntries(TIMELINE_FIELDS.filter(() => chance(0.2)).map(([key]) => [key, pick(STAMP)]));
    state.details = Object.fromEntries(DETAIL_FIELDS.filter(() => chance(0.12)).map(field => [field.key, field.type === 'select' ? pick(field.options)[0] : field.type === 'number' ? pick(NUMBER) : field.type === 'date' ? pick(DATE) : pick(TEXT)]));
    return state;
  }
  const ARTIFACTS = {
    'literal undefined/null/NaN/Infinity': /\b(?:undefined|null|NaN|Infinity)\b/, 'object text': /\[object /,
    'double space': /\S {2,}\S/, 'space before punctuation': / [,.;:](?=\s|$)/, 'doubled period': /[^.]\.\.(?!\.)/, 'empty clause': /;\s*[;.]|\.;|,\s*[,.]/,
    'empty brackets': /\(\s*\)|\[\s*\]/, 'unfilled prompt blank': /: \[ \]/, 'unrounded decimal': /\d\.\d{4,}/, 'unit after placeholder': /(?:documented|invalid) (?:mL|mg|kg|mg\/dL|s)\b/,
    'trailing whitespace': /[ \t]$/m, 'blank-line run': /\n[ \t]*\n[ \t]*\n/, 'zero-item partial sum': /\b0\/15 items; partial sum/
  };
  const balanced = text => text.split('\n').every(entry => (entry.match(/\(/g) || []).length === (entry.match(/\)/g) || []).length && (entry.match(/\[/g) || []).length === (entry.match(/\]/g) || []).length);
  const now = Date.parse('2026-10-21T10:00:00-07:00');

  it('generates clean, explicit text for 400 random encounters in every format and both consultation types', () => {
    const problems = [];
    let notes = 0;
    for (let index = 0; index < 400; index += 1) {
      const state = randomState();
      for (const consultationType of ['phone', 'video']) for (const [documentFormat] of DOCUMENT_FORMATS) {
        const sample = { ...state, consultationType, documentFormat };
        const text = buildSummary(sample, now);
        notes += 1;
        const fail = reason => problems.push(`#${index} ${consultationType}/${documentFormat}/${state.note.diagnosisCategory || '-'}: ${reason}`);
        for (const [name, pattern] of Object.entries(ARTIFACTS)) if (pattern.test(text)) fail(`${name} near "${text.slice(Math.max(0, text.search(pattern) - 40), text.search(pattern) + 40)}"`);
        if (!balanced(text)) fail('unbalanced parentheses or brackets on a line');
        if (!/Times: local to the documenting device \(/.test(text)) fail('missing time-zone line');
        if (consultationType === 'phone' && documentFormat === 'consultation' && text.includes('\n')) fail('Pulsara summary is not one paragraph');
        // Never invent: administration, procedure, completed exams or answered checklists need their inputs.
        const acuteIschemic = state.context === 'acute' && state.note.diagnosisCategory === 'ischemic';
        if (/(?:TNK|Alteplase) at \d/.test(text) && !(acuteIschemic && state.actions.administered && state.drug)) fail('administration without an explicit record');
        if (/\/42 \(all items documented/.test(text) && !(state.nihssSource === 'itemized' && NIHSS_ITEMS.every(item => item.options.includes(state.nihss[item.id])))) fail('complete NIHSS without every item');
        if (/Disabling deficit: (?:yes|no)\b/.test(text) && typeof state.note.disablingDeficit !== 'boolean') fail('disabling deficit invented');
        if (text.includes('every checklist item answered No') && !SAFETY_ITEMS.every(item => state.note.tnkContraindicationChecklist[item.id] === false)) fail('checklist reported as answered');
        if (acuteIschemic && !state.actions.punctureTime && !text.includes('EVT puncture: not documented')) fail('missing EVT puncture not stated');
        if (acuteIschemic && !state.decisions.ivt && !text.includes('IVT clinician decision: not documented')) fail('missing IVT decision not stated');
      }
    }
    expect(notes).toBe(400 * 2 * DOCUMENT_FORMATS.length);
    expect(problems.slice(0, 10)).toEqual([]);
  });
});
