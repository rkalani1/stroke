import { formatEncounterDetails, encounterDetailWarnings, TIA_RISK_FIELDS } from './encounter-details.js';
import { formatTimeline, encounterClockTimestamp } from './encounter-timeline.js';
import { formatDocumentation } from './documentation-output.js';
import { reconcileSupplementaryAppliedScores } from './supplementary-calculators.js';
import { NIHSS_ITEMS } from './clinical/nihss-items.js';
import { calculateNIHSS, calculateICHVolumeReviewed } from './calculators.js';
import { formatPerfusionForExport } from './clinical/perfusion-documentation.js';
import { formatWakeUpScreenForExport } from './clinical/wake-up-documentation.js';
import { numericInput, gcsDocumentation, evaluateVideoTreatment, reviewedTiaDisposition, documentedIvtContext } from './encounter-clinical-review.js';
import { computeLKWCountdown } from './calculators-extended.js';
import { getPublicDemoPhiWarnings } from './public-demo-guardrails.js';

export const DIAGNOSES = { ischemic: 'Ischemic stroke', ich: 'Intracerebral hemorrhage', sah: 'Subarachnoid hemorrhage', tia: 'TIA', cvt: 'Cerebral venous thrombosis', mimic: 'Stroke mimic', other: 'Other / uncertain' };
export function newEncounter() {
  return {
    context: 'acute', consultationType: 'phone', documentFormat: 'consultation', weightUnit: 'kg', details: {}, timeline: {}, supplementary: {}, note: { diagnosisCategory: '', age: '', weight: '', sex: '', creatinine: '', heightCm: '', premorbidMRS: '', lkwDate: '', lkwTime: '', lkwClock: null, lkwUnknown: false, discoveryDate: '', discoveryTime: '', discoveryClock: null, presentingBP: '', glucose: '', ctHemorrhageStatus: '', disablingDeficit: '', vesselOcclusion: [], lastDOACType: '', lastDOACDose: '', inr: '', ptt: '', anticoagulantDoseIntent: '', medications: '', tnkContraindicationChecklist: {}, ivtContraindicationsReviewed: false, wakeUpStrokeWorkflow: {}, coreVolume: '', penumbraVolume: '', mismatchRatio: '', pregnancyStroke: false, chiefComplaint: '', symptoms: '', pmh: '', heartRate: '', spO2: '', temperature: '', plateletCount: '', pt: '', ctDate: '', ctTime: '', ctResults: '', ctpResults: '', ctaDate: '', ctaTime: '', ctaResults: '', ekgResults: '', nihssDetails: '', clinicianName: '', ticiScore: '' },
    nihssSource: 'itemized', reportedNihss: '', nihss: {}, gcs: {}, aspects: '', pcAspects: '', volume: { a: '', b: '', thicknessMm: '', numSlices: '' }, ich: { ivh: '', infratentorial: '' },
    drug: '', doseAuthority: 'guideline', decisions: { ivt: '', evt: '' }, actions: { administered: false, administrationTime: '', punctureTime: '', reperfusionTime: '', discussion: '', discussionDetails: '', consent: '', consentTime: '', evtDiscussion: '', evtConsent: '', evtConsentTime: '', monitoring: '', disposition: '', handoff: '' },
    rationale: '', assessment: '', dapt: {}, evtMassEffect: '', draft: null, revision: 0
  };
}
export function encounterVolume(volume) {
  const thickness = numericInput(volume.thicknessMm, { min: Number.MIN_VALUE });
  const slices = numericInput(volume.numSlices, { min: 1, integer: true });
  return thickness === null || slices === null ? null : calculateICHVolumeReviewed({ lengthCm: volume.a, widthCm: volume.b, slicesCm: thickness * slices / 10 });
}
// Clinical thresholds use the unrounded ABC/2 flags, never its display value.
export function protocolVolumeEstimate(volume) {
  return volume ? { value: volume.volume, display: volume.volume.toFixed(1), exceeds15: volume.meetsNonTraumaticIphDualConsultVolume, exceeds30: volume.isLarge, unitWarning: volume.unitWarning } : null;
}
export function daptReperfusionReview(state) {
  const recordedTreatment = state.actions.administered || state.actions.administrationTime || state.actions.punctureTime || state.actions.reperfusionTime;
  const decisionsReviewed = state.note.diagnosisCategory === 'tia' || (state.decisions.ivt === 'Not recommended' && state.decisions.evt === 'Not recommended');
  return { excluded: state.dapt.reperfusionExcluded === true && !recordedTreatment && decisionsReviewed, recordedTreatment: Boolean(recordedTreatment) };
}
// POINT excludes a clear anticipated indication for anticoagulation. Prior
// exposure alone is not that indication; reconcile its current status explicitly.
const anticoagulantExposureFlags = ['recentDOAC', 'recentHeparin', 'warfarinElevatedINR'];
export function daptAnticoagulationReview(state) {
  const n = state.note, review = state.dapt.anticoagulationReview;
  const plan = state.details?.antithromboticPlanType;
  if (review === 'ongoing' || ['Anticoagulant', 'Combination under specialist review'].includes(plan)) return { excluded: false, reason: 'Ongoing anticoagulation or an anticoagulant plan/indication requires individualized review.' };
  if (review === 'prophylaxis') return { excluded: false, reason: 'Prophylactic anticoagulation needs separate review of agent, dose and applicable source before selecting combined treatment.' };
  if (!['none', 'stopped'].includes(review)) return { excluded: undefined, reason: 'Review current anticoagulation and any continuing indication before interpreting a DAPT source screen.' };
  if (!['none', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'heparin', 'lmwh'].includes(n.lastDOACType)) return { excluded: undefined, reason: 'Anticoagulant exposure remains unassessed; reconcile it with the current anticoagulation review.' };
  if (review === 'none' && (n.lastDOACType !== 'none' || documentedIvtContext(n).medicationReconciliation || anticoagulantExposureFlags.some(key => n.tnkContraindicationChecklist?.[key] === true))) return { excluded: false, reason: 'Exposure, medication or checklist entries conflict with no anticoagulant use. Reconcile actual use and indication; text cannot establish drug activity.' };
  if (review === 'stopped' && n.lastDOACType === 'none') return { excluded: false, reason: 'Document the prior anticoagulant exposure or reconcile the stopped-exposure selection with no exposure.' };
  return { excluded: true, reason: review === 'stopped' ? 'Prior exposure reviewed as stopped with no ongoing indication; this does not establish drug clearance.' : 'No ongoing anticoagulant use or indication reviewed; confirm remaining source criteria.' };
}
const anticoagulationSources = state => [state.note.lastDOACType, state.note.lastDOACDose, state.note.anticoagulantDoseIntent, state.note.medications, state.details?.antithromboticPlanType, state.details?.antithromboticPlan, state.details?.afDetected, ...anticoagulantExposureFlags.map(key => state.note.tnkContraindicationChecklist?.[key])];

export function encounterTiaReadiness(state) {
  if (state.context !== 'acute' || state.note?.diagnosisCategory !== 'tia') return null;
  const details = state.details || {};
  const assessment = Object.fromEntries(TIA_RISK_FIELDS.map(([key, name]) => [name,
    details[key] === 'yes' ? true : details[key] === 'no' ? false : undefined]));
  const missing = TIA_RISK_FIELDS.filter(([, name]) => typeof assessment[name] !== 'boolean').map(([, , label]) => label);
  const concerns = TIA_RISK_FIELDS.filter(([, name]) => assessment[name] === true).map(([, , label]) => label);
  const gaps = [
    ...[['tiaMri', 'MRI / DWI'], ['tiaVascularImaging', 'Head / neck vascular imaging'], ['tiaCardiacWorkup', 'ECG / rhythm workup']]
      .filter(([key]) => !['Completed', 'Not indicated'].includes(details[key]))
      .map(([, label]) => `${label}: completion or a clinician-reviewed alternative remains to be documented.`),
    ...[['tiaWorkupComplete', 'Same-day workup'], ['tiaFollowupAccess', 'Prompt outpatient follow-up']]
      .filter(([key]) => details[key] !== 'yes')
      .map(([key, label]) => `${label}: ${details[key] === 'no' ? 'not confirmed' : 'confirmation not documented'}.`)
  ];
  return { ...reviewedTiaDisposition({ ...assessment, assessmentReviewed: missing.length === 0 }),
    reviewed: missing.length === 0, reviewedCount: TIA_RISK_FIELDS.length - missing.length, missing, concerns, gaps };
}
export function protocolEncounter(state, nowMs = Date.now()) {
  const n = state.note, compatible = state.context === 'acute' && n.diagnosisCategory === 'ischemic';
  const hours = compatible ? encounterTiming(n, nowMs).hours ?? '' : '';
  const nihss = compatible ? encounterNihss(state).total ?? '' : '';
  const [bpSystolic = '', bpDiastolic = ''] = n.presentingBP.split('/').map(value => numericInput(value, { min: 0 }) === null ? '' : value.trim());
  const shared = { age: n.age, nihss, preMRS: n.premorbidMRS };
  const safetyReviewRequired = compatible && evaluateVideoTreatment({ note: { ...n, nihss }, clock: hours === '' ? null : { total: hours, label: 'LKW' }, aspects: state.aspects, pcAspects: state.pcAspects, now: new Date(nowMs) }).tnk.reviewRequired === true;
  // Fixed source values define review validity; wall-clock advancement does not
  // reset local attestations, but elapsed time is recalculated on every render.
  const sourceKey = JSON.stringify([state.context, n, nihssSourceInput(state), state.aspects, state.pcAspects, state.evtMassEffect]);
  return {
    sourceKey, compatible, safetyReviewRequired,
    ivt: { age: n.age, weight: n.weight, glucose: n.glucose, hoursFromLKW: hours, wakeUpOrUnknownOnset: n.lkwUnknown, preMRS: n.premorbidMRS, bpSystolic, bpDiastolic, ichOnCT: compatible && ['present', 'absent'].includes(n.ctHemorrhageStatus) ? n.ctHemorrhageStatus === 'present' : null, disablingDeficit: compatible && typeof n.disablingDeficit === 'boolean' ? n.disablingDeficit : null },
    anterior: { ...shared, aspectsScore: compatible ? state.aspects : '', timeFromLKWh: hours, coreVolume: compatible ? n.coreVolume : '', massEffect: compatible && typeof state.evtMassEffect === 'boolean' ? state.evtMassEffect : null },
    m2: { ...shared, aspectsScore: compatible ? state.aspects : '', hoursFromLKWh: hours },
    basilar: { ...shared, pcAspects: compatible ? state.pcAspects : '', hoursFromLKWh: hours }
  };
}
export function updateEncounter(state, updater) {
  const next = reconcileSupplementaryAppliedScores(state, typeof updater === 'function' ? updater(state) : { ...state, ...updater });
  const contextChanged = next.context !== state.context || next.note.diagnosisCategory !== state.note.diagnosisCategory;
  const nihssChanged = JSON.stringify(nihssSourceInput(next)) !== JSON.stringify(nihssSourceInput(state));
  let note = nihssChanged ? { ...next.note, ivtContraindicationsReviewed: false } : next.note;
  for (const prefix of ['lkw', 'discovery']) {
    const key = `${prefix}Clock`, clock = note[key];
    const edited = note[`${prefix}Date`] !== state.note[`${prefix}Date`] || note[`${prefix}Time`] !== state.note[`${prefix}Time`];
    if (clock && (clock.value !== `${note[`${prefix}Date`]}T${note[`${prefix}Time`]}` || edited && clock === state.note[key])) note = { ...note, [key]: null };
  }
  const anticoagulationChanged = contextChanged || JSON.stringify(anticoagulationSources(next)) !== JSON.stringify(anticoagulationSources(state));
  const dapt = { ...next.dapt, ...(contextChanged || nihssChanged ? { reperfusionExcluded: undefined } : {}), ...(anticoagulationChanged ? { anticoagulationReview: undefined } : {}) };
  return { ...next, note, dapt, revision: state.revision + 1, draft: state.draft ? { ...state.draft, stale: true } : null };
}
// A manually reviewed score has its own provenance, even when its value is
// numerically identical to a previously applied worksheet result.
export function setEncounterReviewedScore(state, key, value) {
  const id = { aspects: 'aspects-regions', pcAspects: 'pc-aspects-regions', abcd2: 'abcd2' }[key];
  if (!id) return state;
  const applied = { ...state.supplementary?.applied };
  delete applied[id];
  return { ...state, ...(key === 'abcd2' ? { dapt: { ...state.dapt, abcd2: value } } : { [key]: value }), supplementary: { ...state.supplementary, applied } };
}
export function nihssAssessment(responses) {
  const complete = NIHSS_ITEMS.every(item => item.options.includes(responses[item.id]) && !responses[item.id].includes('(UN)'));
  const entered = NIHSS_ITEMS.filter(item => item.options.includes(responses[item.id]));
  const valid = Object.fromEntries(entered.map(item => [item.id, responses[item.id]]));
  return { complete, count: entered.length, partial: calculateNIHSS(valid), total: complete ? calculateNIHSS(valid) : null };
}
// Keep the itemized examination and a reported total separately. Only the
// selected source can supply a current score; an invalid report never falls back.
function nihssSourceInput(state) {
  return state.nihssSource === 'reported' ? ['reported', state.reportedNihss] : ['itemized', state.nihss];
}
export function encounterNihss(state) {
  if (state.nihssSource !== 'reported') return { ...nihssAssessment(state.nihss), source: 'itemized' };
  const total = numericInput(state.reportedNihss, { min: 0, max: 42, integer: true });
  return { source: 'reported', complete: total !== null, total, count: null, partial: null };
}
// Existing countdown validates calendar, DST gaps, finite values and future times.
export function validTimestamp(value, nowMs = Date.now()) {
  return computeLKWCountdown(value, nowMs) ? new Date(value) : null;
}
export function encounterTiming(note, nowMs = Date.now()) {
  const lkw = encounterClockTimestamp(note, 'lkw');
  const discovery = encounterClockTimestamp(note, 'discovery');
  const timestamp = note.lkwUnknown ? discovery : lkw;
  const clock = computeLKWCountdown(timestamp, nowMs);
  return { timestamp, clock, label: note.lkwUnknown ? 'Discovery' : 'LKW', invalid: Boolean(timestamp && !clock), hours: !note.lkwUnknown && clock ? (nowMs - new Date(timestamp).getTime()) / 3600000 : null };
}
// Incompatible state is retained for reconciliation, but never projected into outputs.
export function activeNote(state) {
  const note = { ...state.note, nihss: encounterNihss(state).total ?? '' };
  if (note.diagnosisCategory !== 'ischemic' || state.context !== 'acute') {
    note.wakeUpStrokeWorkflow = {};
    note.vesselOcclusion = [];
    note.ivtContraindicationsReviewed = false;
  }
  return note;
}
export function outputWarnings(state) {
  const noteFields = ['age', 'weight', 'sex', 'creatinine', 'heightCm', 'premorbidMRS', 'presentingBP', 'glucose', 'inr', 'ptt', 'medications', 'chiefComplaint', 'symptoms', 'pmh', 'heartRate', 'spO2', 'temperature', 'plateletCount', 'pt', 'ctTime', 'ctResults', 'ctaResults', 'ekgResults', 'nihssDetails', 'clinicianName', 'ctpResults'];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^\d{2}:\d{2}(?::\d{2})?$/;
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;
  // Structured clinical dates are allowed; malformed date fields and all
  // narrative fields still pass through the identifier scan.
  const malformedDates = [
    ...['lkwDate', 'discoveryDate', 'ctDate', 'ctaDate'].map(key => [state.note[key], datePattern]),
    ...['lkwTime', 'discoveryTime', 'ctaTime'].map(key => [state.note[key], timePattern]),
    [state.note.lastDOACDose, timestampPattern],
    ...['lkwClock', 'discoveryClock'].flatMap(key => [[state.note[key]?.value, timestampPattern], [state.note[key]?.instant, timestampPattern]])
  ].filter(([value, pattern]) => typeof value === 'string' && !pattern.test(value)).map(([value]) => value);
  const actionTimes = ['administrationTime', 'punctureTime', 'reperfusionTime', 'consentTime', 'evtConsentTime'];
  const actionTexts = Object.entries(state.actions).filter(([key, value]) => typeof value === 'string' && !(actionTimes.includes(key) && timestampPattern.test(value))).map(([, value]) => value);
  const texts = [state.rationale, state.assessment, state.gcs.notTestableReason, ...noteFields.map(key => state.note[key]), state.note.lastDOACType, ...malformedDates, ...actionTexts];
  return [...new Set([...texts.flatMap(getPublicDemoPhiWarnings), ...encounterDetailWarnings(state, getPublicDemoPhiWarnings), ...Object.values(state.timeline || {}).filter(value => value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)).flatMap(getPublicDemoPhiWarnings)])];
}
// A delayed clipboard result must never attest or select a newer draft.
export async function copySummary(stateRef, text, writeText) {
  const state = stateRef.current, draft = state.draft;
  if (!draft || draft.stale || draft.text !== text || outputWarnings(state).length) return 'blocked';
  const current = () => stateRef.current.draft === draft && stateRef.current.revision === state.revision && !draft.stale;
  try { await writeText(text); return current() ? 'copied' : 'superseded'; }
  catch { return current() ? 'denied' : 'superseded'; }
}
// Documentation is generated only from the current canonical sources. The
// templates format recorded facts and clinician text; they never attest care.
const hasValue = value => value !== '' && value !== null && value !== undefined && String(value).trim() !== '';
const documented = (value, fallback = 'not documented') => hasValue(value) ? String(value).trim() : fallback;
const measurement = (value, unit) => hasValue(value) ? `${value}${unit}` : 'not documented';
function documentedDateTime(date, time, nowMs, recordedTimestamp) {
  if (!hasValue(date) && !hasValue(time)) return 'not documented';
  if (!hasValue(date) || !hasValue(time)) return `${documented(date, '[date not documented]')} ${documented(time, '[time not documented]')} (incomplete date/time; correct before interpretation)`;
  const local = `${date}T${time}`, timestamp = recordedTimestamp === undefined ? local : recordedTimestamp;
  const instant = timestamp !== local ? ` (recorded instant ${timestamp || 'unavailable'})` : '';
  return `${date} ${time}${instant}${validTimestamp(timestamp, nowMs) ? '' : ' (invalid or future; correct before interpretation)'}`;
}
function documentedCtTime(value) {
  if (!hasValue(value)) return 'not documented';
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(value))
    ? `${value}; date not documented`
    : `${value} (invalid time; correct before interpretation)`;
}
export function buildSummary(state, nowMs = Date.now()) {
  const consultation = buildConsultationSummary(state, nowMs);
  return formatDocumentation(state, consultation, formatEncounterDetails(state, nowMs), formatTimeline(state, nowMs));
}
function buildConsultationSummary(state, nowMs = Date.now()) {
  const n = activeNote(state), exam = encounterNihss(state);
  const acuteIschemic = n.diagnosisCategory === 'ischemic' && state.context === 'acute';
  const diagnosis = DIAGNOSES[n.diagnosisCategory] || 'not documented';
  const sex = n.sex === 'M' ? 'male' : n.sex === 'F' ? 'female' : documented(n.sex, '[sex not documented]');
  const demographics = `${documented(n.age, '[age not documented]')} year old ${sex}`;
  const chiefComplaint = documented(n.chiefComplaint);
  const symptoms = documented(n.symptoms, '[symptoms not documented]');
  const pmh = documented(n.pmh, '[PMH not documented]');
  const lkw = n.lkwUnknown
    ? `Last known well: UNKNOWN. Discovery: ${documentedDateTime(n.discoveryDate, n.discoveryTime, nowMs, encounterClockTimestamp(n, 'discovery'))}; discovery does not establish onset`
    : `Last known well (date/time): ${documentedDateTime(n.lkwDate, n.lkwTime, nowMs, encounterClockTimestamp(n, 'lkw'))}`;
  const examText = exam.source === 'reported'
    ? exam.complete ? `${exam.total}/42 (reported total)` : 'reported total missing or invalid; no current score'
    : exam.complete ? `${exam.total}/42 (all items documented)`
    : `incomplete: ${exam.count}/${NIHSS_ITEMS.length} items; partial sum ${exam.partial}; no completed score`;
  const examDetails = hasValue(n.nihssDetails) ? ` — ${n.nihssDetails}` : '';
  const extraExam = [];
  if (hasValue(n.premorbidMRS)) extraExam.push(`Pre-mRS: ${n.premorbidMRS}`);
  if (['eye', 'verbal', 'motor'].some(key => hasValue(state.gcs[key]))) extraExam.push(gcsDocumentation(state.gcs));
  const aspects = acuteIschemic ? numericInput(state.aspects, { min: 0, max: 10, integer: true }) : null;
  const pcAspects = acuteIschemic ? numericInput(state.pcAspects, { min: 0, max: 10, integer: true }) : null;
  const ctTimestamp = hasValue(n.ctDate) ? documentedDateTime(n.ctDate, n.ctTime, nowMs) : documentedCtTime(n.ctTime);
  const ct = `${documented(n.ctResults)}; CT hemorrhage review: ${documented(n.ctHemorrhageStatus)}${aspects === null ? '' : `; ASPECTS: ${aspects}`}${pcAspects === null ? '' : `; pc-ASPECTS: ${pcAspects}`}`;
  const vessels = acuteIschemic ? n.vesselOcclusion.join(', ') : '';
  const cta = `${documented(n.ctaResults)}${vessels ? `; Vessel imaging: ${vessels}` : acuteIschemic ? '; Vessel imaging: not documented' : ''}`;
  const perfusion = acuteIschemic ? formatPerfusionForExport({ ctpStructured: { coreVolume: n.coreVolume, penumbraVolume: n.penumbraVolume }, ctpResults: n.ctpResults }) : documented(n.ctpResults, '');
  const recommendations = [];
  const entry = (label, value) => { if (hasValue(value)) recommendations.push(`${label}: ${value}`); };
  if (acuteIschemic || hasValue(n.lastDOACType)) entry('Anticoagulant exposure', n.lastDOACType || 'not assessed');
  if (n.lastDOACType && n.lastDOACType !== 'none' && n.lastDOACDose) entry('Last anticoagulant dose', validTimestamp(n.lastDOACDose, nowMs) ? n.lastDOACDose : `${n.lastDOACDose} (invalid or future; correct before interpretation)`);
  if (n.lastDOACType === 'lmwh') entry('LMWH dose intent', n.anticoagulantDoseIntent);
  if (acuteIschemic) {
    if (n.lkwUnknown || n.wakeUpStrokeWorkflow.mriAvailable !== undefined) recommendations.push(formatWakeUpScreenForExport(n, new Date(nowMs)));
    const concerns = Object.keys(n.tnkContraindicationChecklist || {}).filter(key => n.tnkContraindicationChecklist[key] === true);
    entry('Recorded safety concerns', concerns.join(', ') || 'none recorded (unchecked does not mean reviewed)');
    entry('IVT safety review', n.ivtContraindicationsReviewed ? 'explicitly recorded; concerns remain' : 'not documented');
    for (const type of ['ivt', 'evt']) entry(`${type.toUpperCase()} clinician decision`, state.decisions[type] || 'not documented');
    const administration = state.actions.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
    entry('IVT administration', administration ? `${state.drug} at ${state.actions.administrationTime}` : `not documented with a valid drug and timestamp${state.actions.administrationTime && !validTimestamp(state.actions.administrationTime, nowMs) ? '; entered time is invalid or future; correct before interpretation' : ''}`);
    for (const [key, label] of [['punctureTime', 'EVT puncture'], ['reperfusionTime', 'EVT reperfusion']]) if (state.actions[key]) entry(label, validTimestamp(state.actions[key], nowMs) ? state.actions[key] : 'invalid or future; correct before interpretation');
    entry('Recorded mTICI grade', state.note.ticiScore);
    entry('IVT Discussion', state.actions.discussion || 'not documented');
    entry('IVT Consent status', state.actions.consent || 'not documented');
    entry('EVT discussion', state.actions.evtDiscussion || 'not documented');
    entry('EVT consent status', state.actions.evtConsent || 'not documented');
    if (state.actions.evtConsent && state.actions.evtConsentTime) entry('EVT consent time', validTimestamp(state.actions.evtConsentTime, nowMs) ? state.actions.evtConsentTime : 'invalid or future; correct before interpretation');
    if (state.actions.consent && state.actions.consentTime) entry('Consent time', validTimestamp(state.actions.consentTime, nowMs) ? state.actions.consentTime : 'invalid or future; correct before interpretation');
  }
  if (n.diagnosisCategory === 'ich') {
    const volume = encounterVolume(state.volume);
    entry('ABC/2 volume', volume ? `${volume.volume} mL (approximate)` : 'incomplete or invalid');
    entry('Intraventricular hemorrhage', typeof state.ich.ivh === 'boolean' ? state.ich.ivh ? 'present' : 'absent (reviewed)' : 'not assessed');
    entry('Infratentorial origin', typeof state.ich.infratentorial === 'boolean' ? state.ich.infratentorial ? 'present' : 'absent (reviewed)' : 'not assessed');
  }
  entry('Discussion details', state.actions.discussionDetails);
  entry('Clinician rationale / recommendations', state.rationale);
  entry('Monitoring actions documented', state.actions.monitoring);
  entry('Disposition', state.actions.disposition || 'not documented');
  entry('Handoff', state.actions.handoff);

  if (state.documentFormat === 'handoff') {
    const labels = new Set(['Anticoagulant exposure', 'Last anticoagulant dose', 'LMWH dose intent', 'Recorded safety concerns', 'IVT clinician decision', 'EVT clinician decision', 'IVT administration', 'EVT puncture', 'EVT reperfusion', 'Recorded mTICI grade', 'ABC/2 volume', 'Intraventricular hemorrhage', 'Infratentorial origin', 'Clinician rationale / recommendations', 'Monitoring actions documented', 'Disposition', 'Handoff']);
    return ['Team handoff', `${demographics} · ${diagnosis}${state.context === 'follow-up' ? ' · follow-up' : ''}`,
      lkw, `NIHSS: ${examText}${examDetails}${extraExam.length ? `; ${extraExam.join('; ')}` : ''}`,
      `CT (${ctTimestamp}): ${ct}`, `CTA: ${cta}`, hasValue(perfusion) ? `CTP: ${perfusion}` : '',
      hasValue(n.presentingBP) ? `BP: ${n.presentingBP} mmHg` : '', hasValue(state.assessment) ? `Assessment: ${state.assessment}` : '',
      ...recommendations.filter(line => labels.has(line.slice(0, line.indexOf(':'))))].filter(Boolean).join('\n');
  }

  if (state.consultationType === 'phone') {
    const weight = hasValue(n.weight) ? ` (Wt: ${n.weight}kg)` : '';
    const vitals = [hasValue(n.presentingBP) ? `BP (mmHg): ${n.presentingBP}` : '', hasValue(n.glucose) ? `Glucose (mg/dL): ${n.glucose}` : ''].filter(Boolean).join('; ');
    return `${demographics}${weight} with ${pmh} ${state.context === 'follow-up' ? 'seen in follow-up for' : 'who presents with'} ${symptoms}.${hasValue(n.chiefComplaint) ? ` Chief complaint: ${n.chiefComplaint}.` : ''} ${lkw}. ${extraExam.length ? `${extraExam.join('. ')}. ` : ''}NIHSS score: ${examText}${examDetails}. Working diagnosis: ${diagnosis}. Head CT (${ctTimestamp}): ${ct}. CTA Head/Neck (${documentedDateTime(n.ctaDate, n.ctaTime, nowMs)}): ${cta}. CTP: ${documented(perfusion)}.${vitals ? ` ${vitals}.` : ''}${hasValue(n.medications) ? ` Medications: ${n.medications}.` : ''}${hasValue(state.assessment) ? ` Assessment: ${state.assessment}.` : ''} ${recommendations.join('. ')}.`.replace(/\s*\n\s*/g, ' ');
  }
  return `Reason for Consultation: ${state.context === 'acute' ? 'Acute stroke evaluation' : 'Stroke follow-up'} — ${chiefComplaint}

Chief complaint: ${chiefComplaint}
${lkw}
HPI: ${demographics} p/w ${symptoms}
Relevant PMH: ${pmh}
Medications: ${documented(n.medications)}

Objective:
Vitals: BP ${documented(n.presentingBP)}, HR ${documented(n.heartRate)}, SpO2 ${measurement(n.spO2, '%')}, Temp ${measurement(n.temperature, '°F')}
Labs: Glucose ${documented(n.glucose)}, Plt ${measurement(n.plateletCount, 'K/µL')}, Cr ${documented(n.creatinine)}, INR ${documented(n.inr)}, aPTT ${documented(n.ptt)}, PT ${documented(n.pt)}
Exam: NIHSS ${examText}${examDetails}${extraExam.length ? `; ${extraExam.join('; ')}` : ''}

Imaging findings:
NCCT Head (${ctTimestamp}): ${ct}
CTA Head/Neck (${documentedDateTime(n.ctaDate, n.ctaTime, nowMs)}): ${cta}
CTP: ${documented(perfusion)}
Telemetry/EKG: ${documented(n.ekgResults)}

Assessment and Plan:
Suspected Diagnosis: ${diagnosis}${hasValue(state.assessment) ? `
${state.assessment}` : ''}

Recommendations:
${recommendations.join('\n')}

Clinician Name: ${documented(n.clinicianName)}`;
}
