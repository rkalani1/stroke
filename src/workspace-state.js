import { formatEncounterDetails, encounterDetailWarnings, TIA_RISK_FIELDS, treatmentGaps } from './encounter-details.js';
import { formatTimeline, encounterClockTimestamp, evtReperfusionIssue, treatmentRecorded } from './encounter-timeline.js';
import { formatDocumentation } from './documentation-output.js';
import { reconcileSupplementaryAppliedScores, supplementaryResult } from './supplementary-calculators.js';
import { NIHSS_ITEMS } from './clinical/nihss-items.js';
import { SAFETY_ITEMS, BENEFIT_ITEM_IDS } from './clinical/safety-items.js';
import { calculateNIHSS, calculateICHVolumeReviewed, calculateICHScore, calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed } from './calculators.js';
import { formatPerfusionForExport } from './clinical/perfusion-documentation.js';
import { formatWakeUpScreenForExport } from './clinical/wake-up-documentation.js';
import { numericInput, reviewedGcs, gcsDocumentation, evaluateVideoTreatment, reviewedTiaDisposition, documentedIvtContext, assessAnticoagulantExposure, safetyChecklistSignals } from './encounter-clinical-review.js';
import { computeLKWCountdown } from './calculators-extended.js';
import { timestampCandidates, formatRecordedInstant, enteredTime } from './clinical/timestamp.js';
import { getPublicDemoPhiWarnings } from './public-demo-guardrails.js';

export const DIAGNOSES = { ischemic: 'Ischemic stroke', ich: 'Intracerebral hemorrhage', sah: 'Subarachnoid hemorrhage', tia: 'TIA', cvt: 'Cerebral venous thrombosis', mimic: 'Stroke mimic', other: 'Other / uncertain' };
export function newEncounter() {
  return {
    context: 'acute', consultationType: 'phone', documentFormat: 'consultation', weightUnit: 'kg', details: {}, timeline: {}, supplementary: {}, note: { diagnosisCategory: '', age: '', weight: '', sex: '', creatinine: '', heightCm: '', premorbidMRS: '', lkwDate: '', lkwTime: '', lkwClock: null, lkwUnknown: false, discoveryDate: '', discoveryTime: '', discoveryClock: null, presentingBP: '', glucose: '', ctHemorrhageStatus: '', disablingDeficit: '', vesselOcclusion: [], m2Segment: '', lastDOACType: '', lastDOACDose: '', inr: '', ptt: '', anticoagulantDoseIntent: '', medications: '', tnkContraindicationChecklist: {}, ivtContraindicationsReviewed: false, wakeUpStrokeWorkflow: {}, coreVolume: '', penumbraVolume: '', mismatchRatio: '', pregnancyStroke: false, chiefComplaint: '', symptoms: '', pmh: '', heartRate: '', spO2: '', temperature: '', plateletCount: '', pt: '', ctDate: '', ctTime: '', ctClock: null, ctResults: '', ctpResults: '', ctaDate: '', ctaTime: '', ctaClock: null, ctaResults: '', ekgResults: '', nihssDetails: '', clinicianName: '', ticiScore: '' },
    nihssSource: 'itemized', reportedNihss: '', nihss: {}, nihssBulkZero: [], gcs: {}, aspects: '', pcAspects: '', volume: { a: '', b: '', thicknessMm: '', numSlices: '' }, ich: { ivh: '', infratentorial: '' },
    drug: '', doseAuthority: 'guideline', decisions: { ivt: '', evt: '' }, actions: { administered: false, administrationTime: '', administeredDose: '', punctureTime: '', reperfusionTime: '', discussion: '', discussionDetails: '', consent: '', consentTime: '', evtDiscussion: '', evtConsent: '', evtConsentTime: '', monitoring: '', disposition: '', handoff: '' },
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
  // The DAPT source trials excluded AF and other cardioembolic sources. AF is an anticoagulation
  // indication; other cardioembolic sources (endocarditis, PFO) need source-specific therapy.
  if (state.details?.afDetected === 'yes') return { excluded: false, afTiming: true, reason: 'AF is documented in Etiology: an anticoagulation indication that the DAPT source trials excluded. See anticoagulation timing.' };
  if (state.details?.toastClassification === 'Cardioembolism') return { excluded: false, reason: 'A cardioembolic mechanism is documented in Etiology; the DAPT source trials excluded it. Choose antithrombotic therapy by the specific source.' };
  if (state.note?.diagnosisCategory === 'tia' && state.details?.tiaCardioembolic === 'yes') return { excluded: false, reason: 'A suspected cardioembolic source is recorded in the TIA review; the DAPT source trials excluded cardioembolic mechanisms. Reconcile it with "Noncardioembolic mechanism confirmed" and choose therapy by the specific source.' };
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
    // AHA 2023 TIA ED statement: vessel imaging and ECG are warranted for every TIA; MRI may reasonably be
    // unavailable acutely, so only MRI can be closed as "Not indicated".
    ...[['tiaMri', 'MRI / DWI', true], ['tiaVascularImaging', 'Head / neck vascular imaging', false], ['tiaCardiacWorkup', 'ECG / rhythm workup', false]]
      .filter(([key, , optional]) => !(details[key] === 'Completed' || (optional && details[key] === 'Not indicated')))
      .map(([key, label]) => details[key] === 'Not indicated'
        ? `${label}: recorded as not indicated; the AHA 2023 TIA statement considers it warranted for every TIA. Document the reason.`
        : `${label}: completion or a clinician-reviewed alternative remains to be documented.`),
    ...[['tiaWorkupComplete', 'Same-day workup'], ['tiaFollowupAccess', 'Rapid follow-up (ideally ≤48 h)']]
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
  // An affirmative IVT card requires an explicit "none documented" anticoagulant
  // exposure. A DOAC, heparin, warfarin, unreconciled or unassessed exposure is a
  // safety hold even when the Encounter screen labels it pending rather than review.
  const treatment = compatible ? evaluateVideoTreatment({ note: { ...n, nihss }, clock: hours === '' ? null : { total: hours, label: 'LKW' }, aspects: state.aspects, pcAspects: state.pcAspects, now: new Date(nowMs) }).tnk : null;
  const exposure = compatible ? assessAnticoagulantExposure(n, new Date(nowMs)) : null;
  const safetyReasons = [
    ...(treatment?.reviewRequired === true ? [treatment.reason] : []),
    ...(exposure && exposure.status !== 'none' ? [n.lastDOACType ? `Anticoagulant exposure — ${exposure.reason}.` : 'Anticoagulant exposure not yet assessed in Encounter.'] : [])
  ];
  const safetyReviewRequired = compatible && safetyReasons.length > 0;
  // Unassessed exposure is a gap to fill (caution); recorded concerns are critical.
  const safetyReviewSeverity = treatment?.reviewRequired === true || exposure?.status === 'block' || exposure?.status === 'review' ? 'critical' : 'caution';
  const vessels = Array.isArray(n.vesselOcclusion) ? n.vesselOcclusion : [];
  const evtBranch = vessels.includes('Basilar') || vessels.includes('Vertebral') ? 'basilar' : !vessels.some(v => ['ICA', 'M1'].includes(v)) && vessels.some(v => ['M2', 'M3 / distal', 'ACA', 'PCA'].includes(v)) ? 'm2-distal' : 'anterior';
  // Encounter MRI/perfusion entries pre-fill the protocol IVT card (read-only there).
  const workflow = n.wakeUpStrokeWorkflow || {};
  const discovery = encounterClockTimestamp(n, 'discovery');
  const recognitionHours = validTimestamp(discovery, nowMs) ? (nowMs - new Date(discovery).getTime()) / 3600000 : null;
  const imaging = {};
  // The WAKE-UP MRI rule (recognition within 4.5 h) is pre-filled only where it is the MRI route:
  // unknown onset, or a known LKW of 9 h or more, with a recorded discovery time. A known 4.5-9 h
  // interval accepts MRI mismatch on the LKW clock, so the card's checkbox stays editable there.
  const wakeUpContext = recognitionHours !== null && (n.lkwUnknown === true || (hours !== '' && Number(hours) >= 9));
  if (compatible && workflow.mriAvailable === true && wakeUpContext) imaging.mriDwiFlairMismatch = workflow.dwi?.positiveForLesion === true && workflow.flair?.noMarkedHyperintensity === true && workflow.dwiLesionUnderOneThirdMCA === true && recognitionHours <= 4.5;
  const wakeUpRecognition = imaging.mriDwiFlairMismatch === true && n.lkwUnknown !== true;
  const core = numericInput(n.coreVolume, { min: 0 }), total = numericInput(n.penumbraVolume, { min: 0 });
  if (compatible && core !== null && total !== null && total >= core) Object.assign(imaging, { ctpCoreMl: core, ...(core > 0 ? { ctpRatio: Math.round(total / core * 100) / 100 } : {}), ctpMismatchVolMl: Math.round((total - core) * 10) / 10 });
  const lvoOnCta = vessels.some(v => ['ICA', 'M1', 'M2'].includes(v)) ? true : vessels.length === 1 && vessels[0] === 'None' ? false : null;
  // Fixed source values define review validity; wall-clock advancement does not
  // reset local attestations, but elapsed time is recalculated on every render.
  const sourceKey = JSON.stringify([state.context, n, nihssSourceInput(state), state.aspects, state.pcAspects, state.evtMassEffect]);
  return {
    sourceKey, compatible, evtBranch, safetyReviewRequired, safetyReviewReason: safetyReviewRequired ? safetyReasons.join(' ') : '', safetyReviewSeverity: safetyReviewRequired ? safetyReviewSeverity : '', drug: state.drug || '',
    ivt: { ...imaging, age: n.age, weight: n.weight, glucose: n.glucose, hoursFromLKW: hours, wakeUpOrUnknownOnset: n.lkwUnknown, wakeUpRecognition, preMRS: n.premorbidMRS, bpSystolic, bpDiastolic, ichOnCT: compatible && ['present', 'absent'].includes(n.ctHemorrhageStatus) ? n.ctHemorrhageStatus === 'present' : null, disablingDeficit: compatible && typeof n.disablingDeficit === 'boolean' ? n.disablingDeficit : null, ...(compatible && lvoOnCta !== null ? { lvoOnCta } : {}) },
    anterior: { ...shared, aspectsScore: compatible ? state.aspects : '', timeFromLKWh: hours, coreVolume: compatible ? n.coreVolume : '', massEffect: compatible && typeof state.evtMassEffect === 'boolean' ? state.evtMassEffect : null },
    m2: { ...shared, aspectsScore: compatible ? state.aspects : '', hoursFromLKWh: hours },
    basilar: { ...shared, pcAspects: compatible ? state.pcAspects : '', hoursFromLKWh: hours }
  };
}
export function deviceTimeZoneText(nowMs = Date.now()) {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const abbreviation = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date(nowMs)).find(part => part.type === 'timeZoneName')?.value;
    return `local to the documenting device (${[...new Set([zone, abbreviation])].filter(Boolean).join(', ')})`;
  } catch { return 'local to the documenting device'; }
}
export function updateEncounter(state, updater) {
  const next = reconcileSupplementaryAppliedScores(state, typeof updater === 'function' ? updater(state) : { ...state, ...updater });
  const contextChanged = next.context !== state.context || next.note.diagnosisCategory !== state.note.diagnosisCategory;
  const nihssChanged = JSON.stringify(nihssSourceInput(next)) !== JSON.stringify(nihssSourceInput(state));
  // A post-treatment re-examination does not reopen the pre-treatment safety review.
  let note = nihssChanged && !(next.actions?.administered && next.actions?.administrationTime) ? { ...next.note, ivtContraindicationsReviewed: false } : next.note;
  for (const prefix of ['lkw', 'discovery', 'ct', 'cta']) {
    const key = `${prefix}Clock`, clock = note[key];
    const edited = note[`${prefix}Date`] !== state.note[`${prefix}Date`] || note[`${prefix}Time`] !== state.note[`${prefix}Time`];
    if (clock && (clock.value !== `${note[`${prefix}Date`]}T${note[`${prefix}Time`]}` || edited && clock === state.note[key])) note = { ...note, [key]: null };
  }
  // LMWH and UFH share the dose-intent field; a different agent starts with no recorded intent,
  // so a UFH 'prophylactic' entry can never carry over to relax the LMWH hold.
  if (note.lastDOACType !== state.note.lastDOACType && note.anticoagulantDoseIntent) note = { ...note, anticoagulantDoseIntent: '' };
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
// NIHSS rules: an item scored UN (amputation/joint fusion for limb items,
// intubation/physical barrier for dysarthria) is documented but not scored. With
// all 15 items documented, the total sums the scored items and reports the UN
// count; an item that is simply not assessed still withholds the total.
export function nihssAssessment(responses) {
  const entered = NIHSS_ITEMS.filter(item => item.options.includes(responses[item.id]));
  const complete = entered.length === NIHSS_ITEMS.length;
  const untestable = entered.filter(item => responses[item.id].includes('(UN)')).length;
  const valid = Object.fromEntries(entered.map(item => [item.id, responses[item.id]]));
  return { complete, count: entered.length, untestable, partial: calculateNIHSS(valid), total: complete ? calculateNIHSS(valid) : null };
}
export const nihssUntestableNote = count => count > 0 ? `${count} item${count === 1 ? '' : 's'} untestable (UN)` : '';
// "Set unentered items to 0" records which items it filled (top-level nihssBulkZero, never
// inside note or nihss, so Protocols inputs are unchanged). An item keeps that provenance
// while it still holds its 0 option and until it is scored individually.
export const nihssUnenteredItems = (nihss = {}) => NIHSS_ITEMS.filter(item => !item.options.includes(nihss[item.id]));
export const nihssBulkZeroItems = state => state.nihssSource === 'reported' ? [] : NIHSS_ITEMS.filter(item => (state.nihssBulkZero || []).includes(item.id) && /\(0\)$/.test(String(state.nihss?.[item.id] || '')));
export const nihssBulkZeroNote = items => !items.length ? ''
  : items.length === NIHSS_ITEMS.length ? `all ${items.length} items set to 0 by bulk entry, not individually scored`
  : `${items.length} item${items.length === 1 ? '' : 's'} set to 0 by bulk entry, not individually scored (${items.map(item => item.name.split('.')[0]).join(', ')})`;
export function nihssWithBulkZero(state) {
  const fill = nihssUnenteredItems(state.nihss);
  return { ...state, nihss: { ...state.nihss, ...Object.fromEntries(fill.map(item => [item.id, item.options.find(option => option.endsWith('(0)'))])) },
    nihssBulkZero: [...new Set([...(state.nihssBulkZero || []), ...fill.map(item => item.id)])] };
}
// An individually entered (or cleared) item is no longer a bulk entry.
export const setNihssItem = (state, id, value) => ({ ...state, nihss: { ...state.nihss, [id]: value }, nihssBulkZero: (state.nihssBulkZero || []).filter(entry => entry !== id) });
// Keep the itemized examination and a reported total separately. Only the
// selected source can supply a current score; an invalid report never falls back.
function nihssSourceInput(state) {
  return state.nihssSource === 'reported' ? ['reported', state.reportedNihss] : ['itemized', state.nihss];
}
export function encounterNihss(state) {
  if (state.nihssSource !== 'reported') return { ...nihssAssessment(state.nihss), source: 'itemized' };
  const total = numericInput(state.reportedNihss, { min: 0, max: 42, integer: true });
  return { source: 'reported', complete: total !== null, total, count: null, untestable: 0, partial: null };
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
// Why a recorded treatment needs reconciling: the encounter is no longer acute ischemic stroke ('' otherwise).
export const treatmentContext = state => state.context === 'acute' && state.note.diagnosisCategory === 'ischemic' || !treatmentRecorded(state) ? ''
  : `${state.context === 'acute' ? `working diagnosis ${DIAGNOSES[state.note.diagnosisCategory] || 'not documented'}` : 'follow-up / review context'}, not acute ischemic stroke`;
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
    ...['lkwClock', 'discoveryClock', 'ctClock', 'ctaClock'].flatMap(key => [[state.note[key]?.value, timestampPattern], [state.note[key]?.instant, timestampPattern]])
  ].filter(([value, pattern]) => typeof value === 'string' && !pattern.test(value)).map(([value]) => value);
  const actionTimes = ['administrationTime', 'punctureTime', 'reperfusionTime', 'consentTime', 'evtConsentTime'];
  const actionTexts = Object.entries(state.actions).filter(([key, value]) => typeof value === 'string' && !(actionTimes.includes(key) && timestampPattern.test(value))).map(([, value]) => value);
  const texts = [state.rationale, state.assessment, state.gcs.notTestableReason, ...noteFields.map(key => state.note[key]), state.note.lastDOACType, ...malformedDates, ...actionTexts];
  return [...new Set([...texts.flatMap(getPublicDemoPhiWarnings), ...encounterDetailWarnings(state, getPublicDemoPhiWarnings), ...Object.values(state.timeline || {}).filter(value => value && !timestampPattern.test(value)).flatMap(getPublicDemoPhiWarnings)])];
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
// Last plausible "SBP/DBP" pair in the free-text pre-IVT BP field (a trajectory such as
// "200/110 then 175/95" ends on the pre-treatment value; dates such as 10/03 are skipped), or null.
export function parsePreIvtBp(value) {
  const pairs = [...String(value ?? '').matchAll(/(\d{2,3})\s*\/\s*(\d{2,3})/g)]
    .map(match => ({ sbp: Number(match[1]), dbp: Number(match[2]) }))
    .filter(({ sbp, dbp }) => sbp >= 50 && sbp <= 300 && dbp >= 20 && dbp <= 200 && sbp > dbp);
  const last = pairs[pairs.length - 1];
  return last ? { ...last, text: `${last.sbp}/${last.dbp}` } : null;
}
const documented = (value, fallback = 'not documented') => hasValue(value) ? String(value).trim() : fallback;
const timestampReview = value => timestampCandidates(value).length > 1 ? 'ambiguous local time; choose the recorded clock occurrence before interpretation' : 'invalid or future; correct before interpretation';
// A recorded event time as local wall time, or its written value with the reason it needs correction.
const recordedTime = (value, nowMs) => validTimestamp(value, nowMs) ? formatRecordedInstant(value, nowMs) : `${enteredTime(value, nowMs)} (${timestampReview(value)})`;
function documentedDateTime(date, time, nowMs, recordedTimestamp) {
  if (!hasValue(date) && !hasValue(time)) return 'not documented';
  if (!hasValue(date) || !hasValue(time)) return `${documented(date, '[date not documented]')} ${documented(time, '[time not documented]')} (incomplete date/time; correct before interpretation)`;
  const local = `${date}T${time}`, timestamp = recordedTimestamp === undefined ? local : recordedTimestamp;
  // A UTC offset is added for a repeated local hour or a daylight-saving change before the note (formatRecordedInstant).
  const offset = timestamp ? / \(UTC[^)]*\)$/.exec(formatRecordedInstant(timestamp, nowMs) || '')?.[0] || '' : '';
  const instant = timestamp !== local && !timestamp ? ' (recorded instant unavailable)' : offset;
  return `${date} ${time}${instant}${validTimestamp(timestamp, nowMs) ? '' : ` (${timestampReview(timestamp)})`}`;
}
function documentedCtTime(value) {
  if (!hasValue(value)) return 'not documented';
  return /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(value))
    ? `${value}; date not documented`
    : `${value} (invalid time; correct before interpretation)`;
}
// A plain decimal prints as entered (INR 1.0 keeps its written precision); any other accepted form
// (1e3, +5, 0120) prints as the parsed number, so BP and measurements read alike.
const enteredNumber = (raw, number) => /^(0|[1-9]\d*)(\.\d+)?$/.test(raw) ? raw : String(number);
// Note-only BP text: the stored presentingBP ("SBP/DBP") is never rewritten. '' when nothing is
// entered; an incomplete, malformed or reversed pair is flagged instead of printed raw.
export function documentedBp(value, unit = '') {
  const raw = String(value ?? '').trim();
  if (!raw || /^\/?$/.test(raw.replace(/\s/g, ''))) return '';
  const parts = raw.split('/').map(part => part.trim());
  if (parts.length === 2 && (!parts[0] || !parts[1])) return `[BP incomplete: systolic ${parts[0] || 'not documented'}, diastolic ${parts[1] || 'not documented'}; correct before interpretation]`;
  const sbp = parts.length === 2 ? numericInput(parts[0], { min: 1, max: 400 }) : null, dbp = parts.length === 2 ? numericInput(parts[1], { min: 1, max: 300 }) : null;
  if (sbp === null || dbp === null) return `[BP ${raw} invalid; correct before interpretation]`;
  return `${enteredNumber(parts[0], sbp)}/${enteredNumber(parts[1], dbp)}${unit}${sbp <= dbp ? ' [systolic not above diastolic; check order]' : ''}`;
}
// Note-only measurement text: '' when not entered; a non-numeric or out-of-range entry is flagged.
const MEASUREMENT_RANGES = { glucose: [Number.MIN_VALUE, 2000], heartRate: [Number.MIN_VALUE, 300], spO2: [Number.MIN_VALUE, 100], temperature: [Number.MIN_VALUE, 115], inr: [Number.MIN_VALUE, 20], ptt: [Number.MIN_VALUE, 300], pt: [Number.MIN_VALUE, 300], creatinine: [Number.MIN_VALUE, 30] };
export function documentedMeasurement(key, value, unit = '') {
  if (!hasValue(value)) return '';
  const raw = String(value).trim(), [min, max] = MEASUREMENT_RANGES[key] || [-Infinity, Infinity];
  const number = numericInput(raw, { min, max });
  if (number === null) return `[${raw} invalid; correct before interpretation]`;
  // The field is labelled °F; a value below 80 °F reads as a Celsius entry.
  if (key === 'temperature' && number < 80) return `[${raw} °F implausible; check unit]`;
  return `${enteredNumber(raw, number)}${unit}`;
}
const unfilledPromptPattern = /:[ \t]*\[ \][ \t]*$/gm;
// Inserted documentation prompts leave "Label: [ ]" blanks; an unfilled blank is never copied as documentation.
export const unfilledPromptCount = state => ['discussionDetails', 'monitoring', 'handoff'].reduce((count, key) => count + (String(state.actions?.[key] || '').match(unfilledPromptPattern) || []).length, 0);
const markUnfilledPrompts = text => hasValue(text) ? String(text).replace(unfilledPromptPattern, ': [blank; not documented]') : text;
export function buildSummary(state, nowMs = Date.now()) {
  const consultation = buildConsultationSummary(state, nowMs);
  // A recorded administration carries the pre-IVT BP on its own line; do not repeat it in the details.
  const administrationLine = state.actions?.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
  return formatDocumentation(state, consultation, formatEncounterDetails(state, nowMs, { omit: administrationLine ? ['preIvtBP', 'preIvtBPTime'] : [] }), formatTimeline(state, nowMs));
}
function buildConsultationSummary(state, nowMs = Date.now()) {
  const n = activeNote(state), exam = encounterNihss(state);
  const acuteIschemic = n.diagnosisCategory === 'ischemic' && state.context === 'acute';
  const diagnosis = DIAGNOSES[n.diagnosisCategory] || 'not documented';
  const sex = n.sex === 'M' ? 'male' : n.sex === 'F' ? 'female' : documented(n.sex, '[sex not documented]');
  const ageValue = numericInput(n.age, { min: 0, max: 120 });
  const demographics = `${hasValue(n.age) && ageValue === null ? `[age ${String(n.age).trim()} invalid; correct before interpretation]` : documented(n.age, '[age not documented]')} year old ${sex}`;
  const weightKg = numericInput(n.weight, { min: Number.MIN_VALUE, max: 350 });
  const weightText = weightKg === null ? '' : `${Math.round(weightKg * 10) / 10} kg`;
  const weightEntry = hasValue(n.weight) && weightKg === null ? '[weight invalid; correct before interpretation]' : weightText;
  // Platelets entered per µL (>= 2000) are shown in K/µL, as the IVT screen reads them.
  const platelets = numericInput(n.plateletCount, { min: 0 });
  const plateletText = !hasValue(n.plateletCount) ? '' : platelets === null ? `[${String(n.plateletCount).trim()} invalid; correct before interpretation]` : `${platelets >= 2000 ? Number((platelets / 1000).toPrecision(6)) : platelets} K/µL`;
  // PCC reversal is weight-based, so weight is decision-relevant for anticoagulated ICH too.
  const medicationAnticoagulant = documentedIvtContext(n).medicationReconciliation;
  const anticoagulatedIch = n.diagnosisCategory === 'ich' && (n.lastDOACType && n.lastDOACType !== 'none' || medicationAnticoagulant);
  // Acute ischemic stroke: an unanswered disabling-deficit question is stated, never omitted.
  const disabling = !acuteIschemic ? '' : `Disabling deficit: ${typeof n.disablingDeficit === 'boolean' ? n.disablingDeficit ? 'yes' : 'no' : 'not assessed'}`;
  const bpText = documentedBp(n.presentingBP), glucoseText = documentedMeasurement('glucose', n.glucose);
  const chiefComplaint = documented(n.chiefComplaint);
  const symptoms = documented(n.symptoms, '[symptoms not documented]');
  const pmh = documented(n.pmh, '[PMH not documented]');
  const discovery = documentedDateTime(n.discoveryDate, n.discoveryTime, nowMs, encounterClockTimestamp(n, 'discovery'));
  // Ordering checks compare valid recorded instants only; an invalid or ambiguous LKW is flagged on its own line.
  const lkwMs = n.lkwUnknown ? NaN : validTimestamp(encounterClockTimestamp(n, 'lkw'), nowMs)?.getTime() ?? NaN;
  // A known LKW (e.g., bedtime) keeps an entered discovery time; discovery cannot precede LKW.
  const lkw = n.lkwUnknown
    ? `Last known well: UNKNOWN. Discovery: ${discovery}; discovery does not establish onset`
    : `Last known well (date/time): ${documentedDateTime(n.lkwDate, n.lkwTime, nowMs, encounterClockTimestamp(n, 'lkw'))}${discovery === 'not documented' ? '' : `; symptom discovery: ${discovery}${(validTimestamp(encounterClockTimestamp(n, 'discovery'), nowMs)?.getTime() ?? NaN) < lkwMs ? ' [discovery precedes LKW; review recorded dates/times]' : ''}`}`;
  const examText = exam.source === 'reported'
    ? exam.complete ? `${exam.total}/42 (reported total)` : 'reported total missing or invalid; no current score'
    : exam.complete ? `${exam.total}/42 (all items documented${exam.untestable ? `; ${nihssUntestableNote(exam.untestable)}, not scored` : ''}${nihssBulkZeroItems(state).length ? `; ${nihssBulkZeroNote(nihssBulkZeroItems(state))}` : ''})`
    // With no item scored there is no partial sum to report (a "0" would read as an examined NIHSS of 0).
    : `incomplete: ${exam.count}/${NIHSS_ITEMS.length} items${exam.count ? `; partial sum ${exam.partial}` : ' scored'}; no completed score`;
  // Item scores let the receiving team compare a later exam item by item (omitted for an all-zero exam).
  const nihssItems = exam.source !== 'reported' && exam.complete && (exam.total > 0 || exam.untestable) ? NIHSS_ITEMS.map(item => { const match = String(state.nihss?.[item.id] || '').match(/\((\d|UN)\)$/); return match ? `${item.name.split('.')[0]} ${match[1]}` : null; }).filter(Boolean).join(', ') : '';
  const examTextWithItems = nihssItems ? `${examText}; items ${nihssItems}` : examText;
  const examDetails = hasValue(n.nihssDetails) ? ` — ${String(n.nihssDetails).trim()}` : '';
  const extraExam = [];
  if (hasValue(n.premorbidMRS)) extraExam.push(`Pre-mRS: ${n.premorbidMRS}`);
  else if (acuteIschemic) extraExam.push('Pre-mRS: not documented');
  if (['eye', 'verbal', 'motor'].some(key => hasValue(state.gcs[key]))) extraExam.push(gcsDocumentation(state.gcs));
  else if (state.context === 'acute' && n.diagnosisCategory === 'ich') extraExam.push('GCS: not documented');
  const aspects = acuteIschemic ? numericInput(state.aspects, { min: 0, max: 10, integer: true }) : null;
  const pcAspects = acuteIschemic ? numericInput(state.pcAspects, { min: 0, max: 10, integer: true }) : null;
  // An entered but invalid reviewed score is flagged, not silently dropped.
  const scoreText = (label, raw, value) => value !== null ? `; ${label}: ${value}` : acuteIschemic && hasValue(raw) ? `; [${label} ${String(raw).trim()} invalid; correct before interpretation]` : '';
  // A study time in parentheses reads "time not documented", so it is not mistaken for the study itself.
  const studyTime = text => text === 'not documented' ? 'time not documented' : text;
  const ctTimestamp = studyTime(hasValue(n.ctDate) ? documentedDateTime(n.ctDate, n.ctTime, nowMs, encounterClockTimestamp(n, 'ct')) : documentedCtTime(n.ctTime));
  const ctaTimestamp = studyTime(documentedDateTime(n.ctaDate, n.ctaTime, nowMs, encounterClockTimestamp(n, 'cta')));
  const ct = `${documented(n.ctResults)}; CT hemorrhage review: ${documented(n.ctHemorrhageStatus)}${scoreText('ASPECTS', state.aspects, aspects)}${scoreText('pc-ASPECTS', state.pcAspects, pcAspects)}`;
  const M2_LABEL = { 'dominant-proximal': 'dominant proximal', codominant: 'codominant', nondominant: 'nondominant', distal: 'distal' };
  const vessels = acuteIschemic ? n.vesselOcclusion.map(v => v === 'M2' && M2_LABEL[n.m2Segment] ? `M2 (${M2_LABEL[n.m2Segment]})` : v).join(', ') : '';
  const cta = `${documented(n.ctaResults)}${vessels ? `; Vessel imaging: ${vessels}` : acuteIschemic ? '; Vessel imaging: not documented' : ''}`;
  const perfusion = acuteIschemic ? formatPerfusionForExport({ ctpStructured: { coreVolume: n.coreVolume, penumbraVolume: n.penumbraVolume }, ctpResults: n.ctpResults }) : documented(n.ctpResults, '');
  const recommendations = [];
  const entry = (label, value) => { if (hasValue(value)) recommendations.push(`${label}: ${String(value).trim()}`); };
  const ANTICOAGULANT_LABEL = { none: 'none documented', heparin: 'heparin (UFH)', lmwh: 'LMWH', other: 'other agent (see medications)' };
  // Acute ICH/SAH reversal and acute IVT depend on exposure: an unassessed exposure is printed, never omitted,
  // and a medication-record anticoagulant without a structured agent is flagged rather than shown as "none".
  const acuteHemorrhage = state.context === 'acute' && ['ich', 'sah'].includes(n.diagnosisCategory);
  const exposureReconcile = medicationAnticoagulant && (!n.lastDOACType || n.lastDOACType === 'none') ? ' [medication record names an anticoagulant; reconcile actual use and last dose]' : '';
  if (acuteIschemic || acuteHemorrhage || hasValue(n.lastDOACType) || (state.context === 'acute' && medicationAnticoagulant)) entry('Anticoagulant exposure', `${n.lastDOACType ? ANTICOAGULANT_LABEL[n.lastDOACType] || n.lastDOACType : 'not assessed'}${exposureReconcile}`);
  if (n.lastDOACType && n.lastDOACType !== 'none' && n.lastDOACDose) entry('Last anticoagulant dose', recordedTime(n.lastDOACDose, nowMs));
  if (n.lastDOACType === 'lmwh') entry('LMWH dose intent', n.anticoagulantDoseIntent);
  // Documentation only: prophylactic SC heparin is standard care, unlike treatment-dose UFH.
  if (n.lastDOACType === 'heparin') entry('UFH dose intent', n.anticoagulantDoseIntent === 'prophylactic' ? 'prophylactic SC' : n.anticoagulantDoseIntent === 'therapeutic' ? 'treatment dose' : '');
  // Recorded treatment prints whatever the working diagnosis or context; outside acute ischemic stroke it is flagged.
  const treated = acuteIschemic || treatmentRecorded(state);
  const administration = state.actions.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
  if (acuteIschemic) {
    // Evaluated at a recorded IVT administration, so a later note does not change the conclusion; otherwise at note time.
    const at = administration || new Date(nowMs);
    if (n.lkwUnknown || n.wakeUpStrokeWorkflow.mriAvailable !== undefined) recommendations.push(formatWakeUpScreenForExport(n, at, `evaluated at ${administration ? 'the recorded IVT administration' : 'note generation'}, ${formatRecordedInstant(`${at.toISOString().slice(0, 16)}Z`, nowMs)}`));
    const checklist = n.tnkContraindicationChecklist || {};
    const concerns = Object.keys(checklist).filter(key => checklist[key] === true && !BENEFIT_ITEM_IDS.has(key)).map(key => SAFETY_ITEMS.find(item => item.id === key)?.label || key);
    const benefitFactors = Object.keys(checklist).filter(key => checklist[key] === true && BENEFIT_ITEM_IDS.has(key)).map(key => SAFETY_ITEMS.find(item => item.id === key)?.label || key);
    const unanswered = SAFETY_ITEMS.filter(item => typeof checklist[item.id] !== 'boolean').length;
    const signals = safetyChecklistSignals(n, nowMs, state.details);
    const conflicts = SAFETY_ITEMS.filter(item => signals[item.id]?.conflict && checklist[item.id] === false);
    const unansweredText = unanswered ? `; ${unanswered} checklist item${unanswered === 1 ? '' : 's'} unanswered (checklist incomplete)` : '';
    entry('Recorded safety concerns', concerns.join('; ') || (unanswered ? 'none recorded (unchecked does not mean reviewed)' : benefitFactors.length ? 'none among contraindications' : 'none; every checklist item answered No'));
    if (benefitFactors.length) entry('Recorded factors where IVT benefit generally outweighs risk', benefitFactors.join('; '));
    if (conflicts.length) entry('Entered values conflicting with a "No" answer', conflicts.map(item => `${item.label} (${signals[item.id].reason})`).join('; '));
    entry('IVT safety review', n.ivtContraindicationsReviewed ? `marked complete by clinician${concerns.length ? '; recorded concerns remain' : ''}${unansweredText}` : 'not documented');
    for (const type of ['ivt', 'evt']) entry(`${type.toUpperCase()} clinician decision`, state.decisions[type] || 'not documented');
  }
  if (treated) {
    const context = treatmentContext(state);
    entry('Recorded reperfusion treatment', context && `[${context}; reconcile]`);
    const calculated = administration ? state.drug === 'TNK' ? calculateTNKDoseReviewed(n.weight, state.doseAuthority) : calculateAlteplaseDoseReviewed(n.weight) : null;
    // The recorded administered dose is reported whether or not the calculated dose is available.
    const doseMax = state.drug === 'TNK' ? 25 : state.drug === 'Alteplase' ? 90 : null;
    const doseRaw = hasValue(state.actions.administeredDose) ? String(state.actions.administeredDose).trim() : '';
    const doseValue = doseRaw ? numericInput(doseRaw, { min: Number.MIN_VALUE, max: 100 }) : null;
    const administeredText = !doseRaw ? 'administered dose not recorded' : doseValue === null ? `[administered dose ${doseRaw} invalid; correct before interpretation]` : `administered dose recorded as ${doseValue} mg${doseMax !== null && doseValue > doseMax ? ` (above the ${doseMax} mg maximum; review)` : ''}`;
    const calculatedText = administration ? ` (${calculated ? `calculated ${state.drug === 'TNK' ? `${calculated.calculatedDose} mg by ${state.doseAuthority === 'fda-label' ? 'US label weight band' : '0.25 mg/kg'}` : `${calculated.totalDose} mg total: ${calculated.bolus} mg bolus, ${calculated.infusion} mg infusion`} for ${Math.round(calculated.weightKg * 10) / 10} kg` : `calculated dose unavailable: weight ${hasValue(n.weight) ? 'invalid' : 'not documented'}`}; ${administeredText})` : '';
    const preIvtBpText = hasValue(state.details?.preIvtBP) ? `; pre-IVT BP ${String(state.details.preIvtBP).trim()}${hasValue(state.details?.preIvtBPTime) ? ` at ${String(state.details.preIvtBPTime).trim()}` : ''}` : '; pre-IVT BP not documented';
    // Reconcile the record against the LKW and the documented decision (an AM/PM slip or a stale decision).
    const ivtReview = administration ? [Number.isFinite(lkwMs) && new Date(state.actions.administrationTime).getTime() < lkwMs && '[IVT time precedes LKW; review recorded dates/times]', state.decisions.ivt !== 'Recommended' && `[IVT clinician decision is '${state.decisions.ivt || 'not documented'}'; reconcile]`].filter(Boolean).join(' ') : '';
    // A partial record names what is missing and keeps an entered time visible (proposed vs completed action).
    const ivtTime = state.actions.administrationTime, ivtTimeValid = validTimestamp(ivtTime, nowMs);
    const ivtMissing = [!state.actions.administered && 'administration checkbox not ticked', !state.drug && 'agent not selected', !hasValue(ivtTime) && 'timestamp not entered', hasValue(ivtTime) && !ivtTimeValid && `entered time ${enteredTime(ivtTime, nowMs)} is ${timestampReview(ivtTime)}`].filter(Boolean);
    const ivtNotGiven = !state.actions.administered && !hasValue(ivtTime) ? 'not documented as given' : `not documented as given (${ivtMissing.join('; ')})${ivtTimeValid ? `; entered time ${formatRecordedInstant(ivtTime, nowMs)} retained for review` : ''}`;
    // The agent field is pre-filled from the dose-calculation selection until the clinician confirms it.
    const agentUnconfirmed = administration && state.actions.agentConfirmed !== state.drug ? ' [agent pre-filled from the dose-calculation selection; confirm the agent given]' : '';
    entry('IVT administration', administration ? `${state.drug} at ${formatRecordedInstant(ivtTime, nowMs)}${calculatedText}${preIvtBpText}${ivtReview ? ` ${ivtReview}` : ''}${agentUnconfirmed}` : ivtNotGiven);
    const before = (value, referenceMs) => Number.isFinite(referenceMs) && validTimestamp(value, nowMs) && new Date(value).getTime() < referenceMs;
    const evtFlags = key => [
      before(state.actions[key], lkwMs) && '[precedes LKW; review recorded dates/times]',
      key === 'punctureTime' && state.decisions.evt !== 'Recommended' && `[EVT clinician decision is '${state.decisions.evt || 'not documented'}'; reconcile]`,
      key === 'reperfusionTime' && ['0', '1'].includes(state.note.ticiScore) && `[mTICI ${state.note.ticiScore} recorded with a reperfusion time; review]`
    ].filter(Boolean).join(' ');
    // Like IVT administration, a missing puncture time is stated: a recommendation or consent never implies the procedure.
    for (const [key, label] of [['punctureTime', 'EVT puncture'], ['reperfusionTime', 'EVT reperfusion']]) if (state.actions[key]) {
      const issue = key === 'reperfusionTime' ? evtReperfusionIssue(state, nowMs).replace(/\.$/, '') : '', flags = evtFlags(key);
      entry(label, validTimestamp(state.actions[key], nowMs) ? `${formatRecordedInstant(state.actions[key], nowMs)}${issue ? ` (${issue})` : ''}${flags ? ` ${flags}` : ''}` : recordedTime(state.actions[key], nowMs));
    } else if (key === 'punctureTime') entry(label, `not documented${treatmentGaps(state).evt ? ` [${treatmentGaps(state).evt} recorded; reconcile]` : ''}`);
    entry('Recorded mTICI grade', state.note.ticiScore);
    entry('IVT Discussion', state.actions.discussion || 'not documented');
    entry('IVT Consent status', state.actions.consent || 'not documented');
    const consentAfter = (value, actionTime) => validTimestamp(value, nowMs) && validTimestamp(actionTime, nowMs) && new Date(value).getTime() > new Date(actionTime).getTime();
    // An entered consent time is kept even without a consent status.
    const consentTime = (value, status, actionTime, action) => value ? `${recordedTime(value, nowMs)}${consentAfter(value, actionTime) ? ` [recorded after the ${action} time; confirm the consent timeline]` : ''}${status ? '' : ' [consent status not documented]'}` : '';
    entry('IVT Consent time', consentTime(state.actions.consentTime, state.actions.consent, ivtTime, 'administration'));
    entry('EVT discussion', state.actions.evtDiscussion || 'not documented');
    entry('EVT consent status', state.actions.evtConsent || 'not documented');
    entry('EVT consent time', consentTime(state.actions.evtConsentTime, state.actions.evtConsent, state.actions.punctureTime, 'puncture'));
  }
  if (n.diagnosisCategory === 'ich') {
    const volume = encounterVolume(state.volume);
    entry('ABC/2 volume', volume ? volume.unitWarning ? `[ABC/2 volume ${volume.volume} mL implausible; confirm centimeter units before interpretation]` : `${volume.volume} mL (approximate)` : 'incomplete or invalid');
    entry('Intraventricular hemorrhage', typeof state.ich.ivh === 'boolean' ? state.ich.ivh ? 'present' : 'absent (reviewed)' : 'not assessed');
    const ichLocationConflict = ['Cerebellar', 'Brainstem'].includes(state.details?.ichLocation) && state.ich.infratentorial === false;
    entry('Infratentorial origin', typeof state.ich.infratentorial === 'boolean' ? state.ich.infratentorial ? 'present' : `absent (reviewed)${ichLocationConflict ? ` [conflicts with ICH location ${state.details.ichLocation}; reconcile before interpretation]` : ''}` : 'not assessed');
    const gcs = reviewedGcs(state.gcs);
    if (ageValue !== null && gcs !== null && volume && !volume.unitWarning && !ichLocationConflict && typeof state.ich.ivh === 'boolean' && typeof state.ich.infratentorial === 'boolean') entry('ICH score', `${calculateICHScore({ gcs: gcs <= 4 ? 'gcs34' : gcs <= 12 ? 'gcs512' : 'gcs1315', age80: ageValue >= 80, volume30: volume.isLarge, ivh: state.ich.ivh, infratentorial: state.ich.infratentorial, criteriaReviewed: true })}/6 (severity grade; not an individual prognosis)`);
    // A score that cannot be calculated is stated, with the reason, rather than omitted.
    else entry('ICH score', volume?.unitWarning ? 'withheld: confirm ABC/2 centimeter units' : ichLocationConflict ? 'withheld: ICH location conflicts with infratentorial origin; reconcile' : 'not calculated (requires age, complete GCS, ABC/2 volume, IVH and infratentorial origin)');
  }
  // SAH grades from the Encounter worksheets (AHA/ASA aSAH 2023: document a validated clinical grade).
  if (n.diagnosisCategory === 'sah') {
    const huntHess = supplementaryResult(state, 'hunt-hess'), wfns = supplementaryResult(state, 'wfns'), fisher = supplementaryResult(state, 'modified-fisher');
    if (huntHess) entry('Hunt–Hess grade', `${huntHess.grade} (${huntHess.description})`);
    if (wfns) entry('WFNS grade', `${wfns.grade} (GCS ${wfns.gcs})`);
    if (fisher) entry('Modified Fisher grade', `${fisher.grade} (${fisher.description.replace(/\.$/, '')})`);
    if (state.context === 'acute' && !huntHess && !wfns) entry('Clinical grade (Hunt–Hess / WFNS)', 'not documented');
  }
  // ABCD² is entered in the acute DAPT screen; follow-up notes carry it only when one was recorded.
  if (n.diagnosisCategory === 'tia' && (state.context === 'acute' || hasValue(state.dapt?.abcd2))) {
    const abcd2 = numericInput(state.dapt?.abcd2, { min: 0, max: 7, integer: true });
    entry('ABCD²', abcd2 !== null ? `${abcd2}/7 (reviewed)` : hasValue(state.dapt?.abcd2) ? `[ABCD² ${String(state.dapt.abcd2).trim()} invalid; correct before interpretation]` : 'not documented');
  }
  entry('Discussion details', markUnfilledPrompts(state.actions.discussionDetails));
  entry('Clinician rationale / recommendations', state.rationale);
  entry('Monitoring actions documented', markUnfilledPrompts(state.actions.monitoring));
  entry('Disposition', state.actions.disposition || 'not documented');
  entry('Handoff', markUnfilledPrompts(state.actions.handoff));
  // Telestroke spans time zones: entered and stamped times are wall-clock times on the documenting device.
  entry('Times', deviceTimeZoneText(nowMs));
  // Decision-relevant measurements stay explicit when missing: BP and glucose in acute care; platelets,
  // INR and weight for acute ischemic stroke; INR with warfarin; aPTT with heparin/LMWH exposure.
  const acute = state.context === 'acute';
  const inrRequired = acuteIschemic || n.lastDOACType === 'warfarin', pttRequired = ['heparin', 'lmwh'].includes(n.lastDOACType);
  const weightRequired = acuteIschemic || anticoagulatedIch;
  const assessment = documented(state.assessment, ''), medications = documented(n.medications, '');
  // Entered text that ends a sentence is not followed by a stray separator (".;").
  const tidy = text => text.replace(/\.; /g, '. ');

  if (state.documentFormat === 'handoff') {
    const labels = new Set(['Times', 'ABCD²', 'ICH score', 'Hunt–Hess grade', 'WFNS grade', 'Modified Fisher grade', 'Clinical grade (Hunt–Hess / WFNS)', 'UFH dose intent', 'Anticoagulant exposure', 'Last anticoagulant dose', 'LMWH dose intent', 'Recorded safety concerns', 'Entered values conflicting with a "No" answer', 'IVT safety review', 'IVT clinician decision', 'EVT clinician decision', 'Recorded reperfusion treatment', 'IVT administration', 'EVT puncture', 'EVT reperfusion', 'Recorded mTICI grade', 'ABC/2 volume', 'Intraventricular hemorrhage', 'Infratentorial origin', 'Clinician rationale / recommendations', 'Monitoring actions documented', 'Disposition', 'Handoff']);
    const handoffLine = line => labels.has(line.slice(0, line.indexOf(':'))) || line.startsWith('Wake-up / unknown-onset imaging screen');
    const weight = weightEntry ? ` · Wt ${weightEntry}` : weightRequired ? ' · Wt not documented' : '';
    const labItem = (label, text, required) => hasValue(text) ? `${label} ${text}` : required ? `${label} not documented` : '';
    const labs = [labItem('Glucose', documentedMeasurement('glucose', n.glucose, ' mg/dL'), acute), labItem('Platelets', plateletText, acuteIschemic), labItem('INR', documentedMeasurement('inr', n.inr), inrRequired), labItem('aPTT', documentedMeasurement('ptt', n.ptt, ' s'), pttRequired)].filter(Boolean).join('; ');
    return tidy(['Team handoff', `${demographics}${weight} · ${diagnosis}${state.context === 'follow-up' ? ' · follow-up' : ''}`,
      lkw, `NIHSS: ${examTextWithItems}${examDetails}${disabling ? `; ${disabling}` : ''}${extraExam.length ? `; ${extraExam.join('; ')}` : ''}`,
      `CT (${ctTimestamp}): ${ct}`, `CTA: ${cta}`, hasValue(perfusion) ? `CTP: ${perfusion}` : '',
      bpText ? `BP: ${documentedBp(n.presentingBP, ' mmHg')}` : acute ? 'BP: not documented' : '',
      // The receiving team needs the coagulation values behind any reversal or IVT decision.
      labs ? `Labs: ${labs}` : '',
      assessment ? `Assessment: ${assessment}` : '',
      ...recommendations.filter(handoffLine)].filter(Boolean).join('\n'));
  }

  if (state.consultationType === 'phone') {
    const weight = weightText ? ` (Wt: ${weightText.replace(' ', '')})` : hasValue(n.weight) ? ' (Wt: [invalid; correct before interpretation])' : '';
    const lab = (label, value, required) => hasValue(value) ? `${label}: ${value}` : required ? `${label}: not documented` : '';
    const vitals = [lab('BP (mmHg)', bpText, acute), lab('Glucose (mg/dL)', glucoseText, acute),
      lab('HR (beats/min)', documentedMeasurement('heartRate', n.heartRate)), lab('SpO2 (%)', documentedMeasurement('spO2', n.spO2)), lab('Temp (°F)', documentedMeasurement('temperature', n.temperature)),
      lab('Plt', plateletText, acuteIschemic), lab('INR', documentedMeasurement('inr', n.inr), inrRequired), lab('aPTT (s)', documentedMeasurement('ptt', n.ptt), pttRequired),
      lab('Cr (mg/dL)', documentedMeasurement('creatinine', n.creatinine)), lab('PT (s)', documentedMeasurement('pt', n.pt))].filter(Boolean).join('; ');
    // One paragraph: a line break inside entered text becomes "; " unless the line already ends a clause.
    return tidy(`${demographics}${weight} with ${pmh} ${state.context === 'follow-up' ? 'seen in follow-up for' : 'who presents with'} ${symptoms}.${hasValue(n.chiefComplaint) ? ` Chief complaint: ${chiefComplaint}.` : ''} ${lkw}. ${extraExam.length ? `${extraExam.join('. ')}. ` : ''}NIHSS score: ${examTextWithItems}${examDetails}.${disabling ? ` ${disabling}.` : ''} Working diagnosis: ${diagnosis}. Head CT (${ctTimestamp}): ${ct}. CTA Head/Neck (${ctaTimestamp}): ${cta}. CTP: ${documented(perfusion)}.${hasValue(n.ekgResults) ? ` Telemetry/EKG: ${String(n.ekgResults).trim()}.` : ''}${vitals ? ` ${vitals}.` : ''}${medications ? ` Medications: ${medications}.` : ''}${assessment ? ` Assessment: ${assessment}.` : ''} ${recommendations.join('. ')}.${hasValue(n.clinicianName) ? ` Clinician: ${String(n.clinicianName).trim()}.` : ''}`.replace(/([^\s.;:!?,])[ \t]*\n\s*/g, '$1; ').replace(/\s*\n\s*/g, ' ').replace(/([^.])\.\.(?=\s|$)/g, '$1.'));
  }
  // Optional measurements appear only when entered; core fields keep an explicit "not documented".
  const optional = (label, text, required = false) => hasValue(text) ? `, ${label} ${text}` : required ? `, ${label} not documented` : '';
  return tidy(`Reason for Consultation: ${state.context === 'acute' ? 'Acute stroke evaluation' : 'Stroke follow-up'}${hasValue(n.chiefComplaint) ? ` — ${chiefComplaint}` : ''}

Chief complaint: ${chiefComplaint}
${lkw}
HPI: ${demographics} p/w ${symptoms}
Relevant PMH: ${pmh}
Medications: ${documented(n.medications)}

Objective:
Vitals: BP ${bpText || 'not documented'}${optional('HR', documentedMeasurement('heartRate', n.heartRate))}${optional('SpO2', documentedMeasurement('spO2', n.spO2, '%'))}${optional('Temp', documentedMeasurement('temperature', n.temperature, '°F'))}${optional('Wt', weightEntry, weightRequired)}
Labs: Glucose ${documentedMeasurement('glucose', n.glucose, ' mg/dL') || 'not documented'}${optional('Plt', plateletText, acuteIschemic)}${optional('Cr', documentedMeasurement('creatinine', n.creatinine, ' mg/dL'))}${optional('INR', documentedMeasurement('inr', n.inr), inrRequired)}${optional('aPTT', documentedMeasurement('ptt', n.ptt, ' s'), pttRequired)}${optional('PT', documentedMeasurement('pt', n.pt, ' s'))}
Exam: NIHSS ${examTextWithItems}${examDetails}${disabling ? `; ${disabling}` : ''}${extraExam.length ? `; ${extraExam.join('; ')}` : ''}

Imaging findings:
NCCT Head (${ctTimestamp}): ${ct}
CTA Head/Neck (${ctaTimestamp}): ${cta}
CTP: ${documented(perfusion)}
Telemetry/EKG: ${documented(n.ekgResults)}

Assessment and Plan:
Suspected Diagnosis: ${diagnosis}${assessment ? `
${assessment}` : ''}

Recommendations:
${recommendations.join('\n')}

Clinician Name: ${documented(n.clinicianName)}`);
}
