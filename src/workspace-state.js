import { NIHSS_ITEMS } from './clinical/nihss-items.js';
import { calculateNIHSS, calculateICHVolumeReviewed } from './calculators.js';
import { formatPerfusionForExport } from './clinical/perfusion-documentation.js';
import { formatWakeUpScreenForExport } from './clinical/wake-up-documentation.js';
import { numericInput, reviewedGcs } from './encounter-clinical-review.js';
import { computeLKWCountdown } from './calculators-extended.js';
import { PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX, getPublicDemoPhiWarnings } from './public-demo-guardrails.js';

export const DIAGNOSES = { ischemic: 'Ischemic stroke', ich: 'Intracerebral hemorrhage', sah: 'Subarachnoid hemorrhage', tia: 'TIA', cvt: 'Cerebral venous thrombosis', mimic: 'Stroke mimic', other: 'Other / uncertain' };
export function newEncounter() {
  return {
    context: 'acute', consultationType: 'phone', note: { diagnosisCategory: '', age: '', weight: '', sex: '', creatinine: '', heightCm: '', premorbidMRS: '', lkwDate: '', lkwTime: '', lkwUnknown: false, discoveryDate: '', discoveryTime: '', presentingBP: '', glucose: '', ctHemorrhageStatus: '', disablingDeficit: '', vesselOcclusion: [], lastDOACType: '', lastDOACDose: '', inr: '', ptt: '', anticoagulantDoseIntent: '', medications: '', tnkContraindicationChecklist: {}, ivtContraindicationsReviewed: false, wakeUpStrokeWorkflow: {}, coreVolume: '', penumbraVolume: '', mismatchRatio: '', pregnancyStroke: false },
    nihss: {}, gcs: {}, aspects: '', pcAspects: '', volume: { a: '', b: '', thicknessMm: '', numSlices: '' }, ich: { ivh: '', infratentorial: '' },
    drug: '', doseAuthority: 'guideline', decisions: { ivt: '', evt: '' }, actions: { administered: false, administrationTime: '', punctureTime: '', reperfusionTime: '', discussion: '', consent: '', consentTime: '', monitoring: '', disposition: '', handoff: '' },
    rationale: '', assessment: '', dapt: {}, evtMassEffect: '', draft: null, revision: 0
  };
}
export function encounterVolume(volume) {
  const thickness = numericInput(volume.thicknessMm, { min: Number.MIN_VALUE });
  const slices = numericInput(volume.numSlices, { min: 1, integer: true });
  return thickness === null || slices === null ? null : calculateICHVolumeReviewed({ lengthCm: volume.a, widthCm: volume.b, slicesCm: thickness * slices / 10 });
}
export function updateEncounter(state, updater) {
  const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  return { ...next, revision: state.revision + 1, draft: state.draft ? { ...state.draft, stale: true } : null };
}
export function nihssAssessment(responses) {
  const complete = NIHSS_ITEMS.every(item => item.options.includes(responses[item.id]) && !responses[item.id].includes('(UN)'));
  const entered = NIHSS_ITEMS.filter(item => item.options.includes(responses[item.id]));
  const valid = Object.fromEntries(entered.map(item => [item.id, responses[item.id]]));
  return { complete, count: entered.length, partial: calculateNIHSS(valid), total: complete ? calculateNIHSS(valid) : null };
}
// Existing countdown validates calendar, DST gaps, finite values and future times.
export function validTimestamp(value, nowMs = Date.now()) {
  return computeLKWCountdown(value, nowMs) ? new Date(value) : null;
}
export function encounterTiming(note, nowMs = Date.now()) {
  const lkw = note.lkwDate && note.lkwTime ? `${note.lkwDate}T${note.lkwTime}` : '';
  const discovery = note.discoveryDate && note.discoveryTime ? `${note.discoveryDate}T${note.discoveryTime}` : '';
  const timestamp = note.lkwUnknown ? discovery : lkw;
  const clock = computeLKWCountdown(timestamp, nowMs);
  return { timestamp, clock, label: note.lkwUnknown ? 'Discovery' : 'LKW', invalid: Boolean(timestamp && !clock), hours: !note.lkwUnknown && clock ? (nowMs - new Date(timestamp).getTime()) / 3600000 : null };
}
// Incompatible state is retained for reconciliation, but never projected into outputs.
export function activeNote(state) {
  const note = { ...state.note, nihss: nihssAssessment(state.nihss).total ?? '' };
  if (note.diagnosisCategory !== 'ischemic' || state.context !== 'acute') {
    note.wakeUpStrokeWorkflow = {};
    note.vesselOcclusion = [];
    note.ivtContraindicationsReviewed = false;
  }
  return note;
}
export function outputWarnings(state) {
  const texts = [state.rationale, state.assessment, state.note.medications, state.note.presentingBP, ...Object.values(state.actions).filter(value => typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}T/.test(value))];
  return [...new Set(texts.flatMap(getPublicDemoPhiWarnings))];
}
// A delayed clipboard result must never attest or select a newer draft.
export async function copySummary(stateRef, text, writeText) {
  const state = stateRef.current, draft = state.draft;
  if (!draft || draft.stale || draft.text !== text || outputWarnings(state).length) return 'blocked';
  const current = () => stateRef.current.draft === draft && stateRef.current.revision === state.revision && !draft.stale;
  try { await writeText(text); return current() ? 'copied' : 'superseded'; }
  catch { return current() ? 'denied' : 'superseded'; }
}
export function buildSummary(state, nowMs = Date.now()) {
  const n = activeNote(state), exam = nihssAssessment(state.nihss), timing = encounterTiming(n, nowMs);
  const lines = [PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX, `${state.context === 'acute' ? 'Acute' : 'Follow-up'} ${state.consultationType === 'phone' ? 'telephone' : 'video'} consultation`, `Working diagnosis: ${DIAGNOSES[n.diagnosisCategory] || 'not documented'}`];
  const entry = (label, value) => { if (value !== '' && value !== null && value !== undefined) lines.push(`${label}: ${value}`); };
  entry('Age', n.age); entry('Weight (kg)', n.weight); entry('Baseline mRS', n.premorbidMRS);
  if (n.lkwUnknown) lines.push('LKW unknown; discovery does not establish onset.');
  lines.push(`${timing.label}: ${timing.timestamp || 'not documented'}${timing.invalid ? ' (invalid or future; correct before interpretation)' : ''}`);
  lines.push(exam.complete ? `NIHSS: ${exam.total}/42 (all items documented)` : `NIHSS incomplete: ${exam.count}/${NIHSS_ITEMS.length} items; partial sum ${exam.partial}; no completed score`);
  if (['ich', 'sah', 'cvt'].includes(n.diagnosisCategory)) { const gcs = reviewedGcs(state.gcs); entry('GCS', gcs === null ? 'incomplete / not testable' : `${gcs}/15`); }
  entry('BP (mmHg)', n.presentingBP); entry('Glucose (mg/dL)', n.glucose); entry('CT hemorrhage review', n.ctHemorrhageStatus || 'not documented');
  entry('Assessment', state.assessment);
  if (n.diagnosisCategory === 'ischemic' && state.context === 'acute') {
    entry('ASPECTS', numericInput(state.aspects, { min: 0, max: 10, integer: true }));
    entry('pc-ASPECTS', numericInput(state.pcAspects, { min: 0, max: 10, integer: true }));
    entry('Vessel imaging', n.vesselOcclusion.join(', ') || 'not documented');
    const perfusion = formatPerfusionForExport({ ctpStructured: { coreVolume: n.coreVolume, penumbraVolume: n.penumbraVolume } });
    entry('Perfusion measurements', perfusion);
    if (n.lkwUnknown || n.wakeUpStrokeWorkflow.mriAvailable !== undefined) lines.push(formatWakeUpScreenForExport(n, new Date(nowMs)));
    entry('Anticoagulant exposure', n.lastDOACType || 'not assessed');
    const concerns = Object.keys(n.tnkContraindicationChecklist || {}).filter(key => n.tnkContraindicationChecklist[key] === true);
    entry('Recorded safety concerns', concerns.join(', ') || 'none recorded (unchecked does not mean reviewed)');
    entry('IVT safety review', n.ivtContraindicationsReviewed ? 'explicitly recorded; concerns remain' : 'not documented');
    for (const type of ['ivt', 'evt']) entry(`${type.toUpperCase()} clinician decision`, state.decisions[type] || 'not documented');
    const administration = state.actions.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
    entry('IVT administration', administration ? `${state.drug} at ${state.actions.administrationTime}` : 'not documented with a valid drug and timestamp');
    for (const [key, label] of [['punctureTime', 'EVT puncture'], ['reperfusionTime', 'EVT reperfusion']]) if (state.actions[key]) entry(label, validTimestamp(state.actions[key], nowMs) ? state.actions[key] : 'invalid or future; correct before interpretation');
    entry('Discussion', state.actions.discussion || 'not documented');
    entry('Consent status', state.actions.consent || 'not documented');
    if (state.actions.consent && state.actions.consentTime) entry('Consent time', validTimestamp(state.actions.consentTime, nowMs) ? state.actions.consentTime : 'invalid or future; correct before interpretation');
  }
  if (n.diagnosisCategory === 'ich') {
    const volume = encounterVolume(state.volume);
    entry('ABC/2 volume', volume ? `${volume.volume} mL (approximate)` : 'incomplete or invalid');
    entry('Intraventricular hemorrhage', typeof state.ich.ivh === 'boolean' ? state.ich.ivh ? 'present' : 'absent (reviewed)' : 'not assessed');
    entry('Infratentorial origin', typeof state.ich.infratentorial === 'boolean' ? state.ich.infratentorial ? 'present' : 'absent (reviewed)' : 'not assessed');
  }
  entry('Clinician rationale / recommendations', state.rationale);
  entry('Monitoring actions documented', state.actions.monitoring);
  entry('Disposition', state.actions.disposition || 'not documented');
  entry('Handoff', state.actions.handoff);
  return lines.join('\n');
}
