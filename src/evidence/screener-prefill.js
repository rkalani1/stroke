// src/evidence/screener-prefill.js
//
// Pure mapping from the Encounter workspace state to Trial Screener facts.
// Prefill is applied only on an explicit user action; every value it does not
// recognise stays unknown, and every imported fact a modeled study uses has a screener control.

import { encounterTiming, encounterNihss, encounterVolume, validTimestamp, nihssBulkZeroItems } from '../workspace-state.js';
import { reviewedGcs, numericInput, documentedIvtContext } from '../encounter-clinical-review.js';
import { untestableNote } from './screener-eval.js';

const MODELED = { ischemic: 'ischemic', ich: 'ich', tia: 'tia' };
const DIAGNOSIS_LABEL = { ischemic: 'Ischemic', ich: 'ICH', tia: 'TIA', sah: 'SAH', cvt: 'CVT', mimic: 'Stroke mimic', other: 'Other / uncertain' };
export const NO_MODELED_STUDIES = 'No modeled studies for this diagnosis';
// M2 maps only when the Encounter records its segment/dominance (note.m2Segment); M2 without
// it, and 'M3 / distal', stay unknown because the screener groups M3 with non-dominant M2.
// The Encounter 'ICA' chip does not distinguish intracranial from cervical ICA, so on its own
// it stays unknown (the studies require an intracranial ICA/M1 occlusion); ICA with M1 maps.
const VESSEL = { M1: 'ica_m1', None: 'none', ACA: 'other', PCA: 'other', Vertebral: 'other', Basilar: 'other', Other: 'other' };
const ANTICOAGULANT_KIND = { apixaban: 'doac', rivaroxaban: 'doac', dabigatran: 'doac', edoxaban: 'doac', warfarin: 'vka', lmwh: 'lmwh', none: 'none' };
const ANTICOAGULANT_TEXT = { doac: 'on DOAC', vka: 'on warfarin/VKA', lmwh: 'on LMWH', none: 'no anticoagulant' };

// Facts implied by "anticoagulant at onset". undefined clears a fact to unknown.
// LMWH is parenteral, so it says nothing about oral anticoagulant use.
export function anticoagulantFacts(kind) {
  switch (kind) {
    case 'none': return { takingOac: false, exclusions: { exDoacLmwhAtOnset: false } };
    case 'doac': return { takingOac: true, exclusions: { exDoacLmwhAtOnset: true } };
    case 'vka': return { takingOac: true, exclusions: { exDoacLmwhAtOnset: false } };
    case 'lmwh': return { takingOac: 'unselected', exclusions: { exDoacLmwhAtOnset: true } };
    default: return { takingOac: 'unselected', exclusions: { exDoacLmwhAtOnset: undefined } };
  }
}

// Every user edit: merge the patch (an undefined exclusion is cleared) and, once facts were imported,
// record each key the patch writes, and no other, as the user's latest answer. That also settles a
// conflict over the key until the next import weighs the new answer.
export function answerFacts(state, patch) {
  const exclusions = { ...state.exclusions };
  for (const [id, value] of Object.entries(patch.exclusions || {})) {
    if (typeof value === 'boolean') exclusions[id] = value; else delete exclusions[id];
  }
  const next = { ...state, ...patch, exclusions }, record = state.imported;
  if (!record) return next;
  const written = { ...patch, ...patch.exclusions }, conflicts = { ...record.conflicts };
  delete written.exclusions;
  for (const key in written) delete conflicts[key];
  return { ...next, imported: { ...record, answers: { ...record.answers, ...written }, conflicts } };
}

// The anticoagulant choice also answers the facts it implies.
export const applyAnticoagulant = (state, kind) => answerFacts(state, { anticoagulant: kind || 'unselected', ...anticoagulantFacts(kind) });

const fmtHours = h => { const minutes = Math.round(h * 60); return h < 48 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${(h / 24).toFixed(1)} d`; };

export function screenerPrefillFromEncounter(state, nowMs = Date.now()) {
  const note = state?.note || {};
  const diagnosis = note.diagnosisCategory || '';
  const classification = MODELED[diagnosis] || null;
  const patch = { exclusions: {} };
  const summary = [];
  if (diagnosis) summary.push(DIAGNOSIS_LABEL[diagnosis] || diagnosis);
  const timing = encounterTiming(note, nowMs);
  const timed = Number.isFinite(timing.hours) && timing.hours >= 0;
  const anchor = timed ? new Date(timing.timestamp).getTime() : NaN;
  // The Encounter LKW anchor now (null when none), for every diagnosis, so an imported
  // anchor the Encounter no longer holds is never described as live.
  const lkwAnchorMs = Number.isFinite(anchor) ? anchor : null;
  if (diagnosis && !classification) {
    return { available: true, supported: false, classification: null, message: NO_MODELED_STUDIES, patch: null, summary, lkwAnchorMs };
  }
  if (classification) patch.classification = classification;

  if (timed) {
    // onsetVal is the snapshot at import; onsetAnchorMs keeps elapsed time live.
    Object.assign(patch, { onsetVal: Math.round(timing.hours * 100) / 100, onsetUnit: 'hours', onsetRangeHours: null, onsetAnchorMs: lkwAnchorMs });
    summary.push(`LKW ${fmtHours(timing.hours)}`);
  }

  const age = numericInput(note.age, { min: 0, max: 120 });
  if (age !== null) { patch.age = age; summary.push(`${age} y`); }

  // The TIA screen has no NIHSS control, so an Encounter NIHSS is not imported for TIA.
  // A complete itemized total leaves untestable (UN) items out, and bulk entry sets items
  // to 0 without scoring them; both counts travel with it.
  const { total: nihss, untestable } = encounterNihss(state);
  if (classification !== 'tia' && nihss !== null && nihss !== undefined) {
    const bulk = nihssBulkZeroItems(state).length;
    Object.assign(patch, { nihss, nihssUntestable: untestable || 0, nihssBulkZero: bulk });
    summary.push(`NIHSS ${nihss}${untestableNote(untestable, bulk)}`);
  }

  if (classification === 'ich') {
    const gcs = reviewedGcs(state.gcs || {});
    if (gcs !== null) { patch.gcs = gcs; summary.push(`GCS ${gcs}`); }
    const volume = state.volume ? encounterVolume(state.volume) : null;
    if (volume && !volume.unitWarning && Number.isFinite(volume.volume)) {
      patch.ichVolume = Math.round(volume.volume * 100) / 100;
      summary.push(`${volume.volume.toFixed(1)} mL`);
    }
    if (state.ich?.infratentorial === true) { patch.ichLocation = 'infratentorial'; summary.push('infratentorial'); }
  }

  if (classification === 'ischemic') {
    const vessels = Array.isArray(note.vesselOcclusion) ? note.vesselOcclusion : [];
    const vesselLabel = vessels[0] || '';
    const M2_SEGMENT = { 'dominant-proximal': 'dominant_m2', codominant: 'm2_m3_nd', nondominant: 'm2_m3_nd', distal: 'm2_m3_nd' };
    if (vesselLabel === 'ICA') {
      if (vessels.includes('M1')) { patch.vessel = 'ica_m1'; summary.push('ICA + M1'); }
      else summary.push('ICA (intracranial vs cervical not recorded; not imported)');
    }
    else if (vesselLabel === 'M2' && M2_SEGMENT[note.m2Segment]) { patch.vessel = M2_SEGMENT[note.m2Segment]; summary.push(`M2 (${note.m2Segment.replace('-', ' ')})`); }
    else if (VESSEL[vesselLabel]) { patch.vessel = VESSEL[vesselLabel]; summary.push(vesselLabel === 'None' ? 'no occlusion' : vesselLabel); }
    else if (vesselLabel) summary.push(vesselLabel === 'M2' ? 'M2 (dominance not recorded)' : `${vesselLabel} (not imported)`);
    const aspects = numericInput(state.aspects, { min: 0, max: 10, integer: true });
    if (aspects !== null) { patch.aspects = aspects; summary.push(`ASPECTS ${aspects}`); }
  }

  const preMrs = numericInput(note.premorbidMRS, { min: 0, max: 5, integer: true });
  if (classification !== 'tia' && preMrs !== null) { patch.preMrs = preMrs; summary.push(`pre-mRS ${preMrs}`); }

  // Etiology answer: documented AF (or its explicit absence) feeds AF-dependent profiles.
  const af = state.details?.afDetected;
  if (af === 'yes' || af === 'no') { patch.afibHistory = af === 'yes'; summary.push(af === 'yes' ? 'AF documented' : 'no AF documented'); }

  // 'None' that the Encounter medication list contradicts is not imported: an
  // unreconciled answer must not become a definitive 'absent' exclusion.
  const kind = ANTICOAGULANT_KIND[note.lastDOACType];
  const noneConflict = kind === 'none' && documentedIvtContext(note).medicationReconciliation;
  if (noneConflict) summary.push('anticoagulant "none" conflicts with medication list (not imported)');
  if (kind && !noneConflict) {
    const facts = anticoagulantFacts(kind);
    patch.anticoagulant = kind;
    // Import only what is known; it never clears an assessment already entered.
    if (typeof facts.takingOac === 'boolean') patch.takingOac = facts.takingOac;
    for (const [id, value] of Object.entries(facts.exclusions)) if (typeof value === 'boolean') patch.exclusions[id] = value;
    // A valid last-dose time bounds use at onset (below) and is described in the summary.
    const dose = kind !== 'none' && kind !== 'lmwh' ? validTimestamp(note.lastDOACDose, nowMs) : null;
    const hours = dose ? (nowMs - dose.getTime()) / 3600000 : null;
    // Last dose to onset: from the LKW when recorded; otherwise the time to now bounds it.
    const lkw = lkwAnchorMs ?? nowMs;
    const beforeOnset = dose ? (lkw - dose.getTime()) / 3600000 : null;
    const drug = kind === 'doac' ? 'DOAC' : 'warfarin/VKA';
    if (beforeOnset !== null && beforeOnset > 48) {
      // A last dose more than 48 h (two daily dosing intervals) before onset does not establish
      // use at onset or at the index stroke; leave both unknown. Clear explicitly (not omit) so
      // a reapply also clears what an earlier import set.
      patch.exclusions.exDoacLmwhAtOnset = undefined;
      patch.takingOac = 'unselected';
      patch.anticoagulant = 'unselected';
      summary.push(hours > 168 ? `${drug}, last dose >7 d` : `${drug}, last dose ${Math.round(beforeOnset)} h before ${lkw === nowMs ? 'now' : 'LKW'} (use at onset unknown)`);
    } else summary.push(ANTICOAGULANT_TEXT[kind]);
  }

  const facts = Object.keys(patch).filter(key => key !== 'exclusions' && key !== 'onsetUnit' && key !== 'onsetRangeHours' && key !== 'onsetAnchorMs');
  return { available: facts.length > 0, supported: Boolean(classification), classification, message: classification ? null : 'Diagnosis not recorded in Encounter', patch, summary, lkwAnchorMs };
}

// What an import says, without the elapsed-time snapshot (the LKW anchor is kept),
// so the passage of time alone never reads as a changed Encounter.
// Keys are listed sorted, so insertion order never matters; undefined (cleared) values drop out.
const importSource = ({ patch } = {}) => patch ? JSON.stringify(patch, [...Object.keys(patch), ...Object.keys(patch.exclusions || {})].filter(key => key !== 'onsetVal').sort()) : 'none';

// True when facts were imported and the live Encounter prefill no longer matches them.
export const importChanged = (state, prefill) => Boolean(state?.imported?.source) && Boolean(prefill) && state.imported.source !== importSource(prefill);

const entered = v => v != null && v !== 'unselected';
// A screen as one flat map of facts and exclusion answers (exclusion ids are never state keys).
const flat = ({ exclusions, imported, ...facts }) => ({ ...facts, ...exclusions });
const OAC = ['anticoagulant', 'takingOac', ...Object.keys(anticoagulantFacts().exclusions)];
const WEIGHED = ['afibHistory', 'afOrFlutterHistory', ...OAC];

// Encounter import and reapply. U is the user's latest explicit answer to each fact: what the screen
// held at the first import, then each key a user edit writes (answerFacts). E is what the Encounter
// says now. Every import computes the screen from U and E alone:
// - yes/no facts, the anticoagulant choice and its exclusions (WEIGHED): U and E entered and different
//   is a conflict, listed in imported.conflicts until the user answers it: an exclusion is present,
//   any other fact unknown. Otherwise the one entered, else unknown. An Encounter anticoagulant or OAC
//   answer the user contradicted supplies nothing but present exclusions.
// - Encounter AF against a "No" to AF or flutter is, on every import, a conflict over AF or flutter (and
//   over AF unless the user answered AF Yes); documented absence of AF never contradicts flutter.
// - every other fact is the Encounter's when it records one (a different value replaces U), otherwise U,
//   so a value an import wrote that the user never answered returns to unknown. A different
//   classification starts a clean screen.
export function applyEncounterPrefill(state, prefill, initialState) {
  if (!prefill?.patch) return state;
  const base = prefill.patch.classification && prefill.patch.classification !== state.classification ? initialState : state;
  const U = base.imported?.answers || flat(base), E = flat(prefill.patch);
  const answers = { ...U }, conflicts = {}, screen = { ...flat(initialState), ...U };
  for (const key in E) if (!WEIGHED.includes(key) && String(U[key]) !== String(E[key])) { screen[key] = E[key]; delete answers[key]; }
  const differs = key => entered(U[key]) && entered(E[key]) && U[key] !== E[key];
  const contradicted = differs('anticoagulant') || differs('takingOac');
  const afConflict = E.afibHistory === true && U.afOrFlutterHistory === false;
  for (const key of WEIGHED) {
    const fact = key in initialState;
    if (differs(key) || afConflict && (key === 'afOrFlutterHistory' || key === 'afibHistory' && U[key] !== true)) {
      conflicts[key] = U[key];
      screen[key] = fact ? 'unselected' : true;
    } else screen[key] = entered(U[key]) ? U[key] : entered(E[key]) && !(contradicted && OAC.includes(key) && (fact || !E[key])) ? E[key] : initialState[key];
  }
  const next = { exclusions: {}, imported: { source: importSource(prefill), answers, conflicts } };
  for (const [key, value] of Object.entries(screen)) if (key in initialState) next[key] = value; else if (typeof value === 'boolean') next.exclusions[key] = value;
  return next;
}

export default screenerPrefillFromEncounter;
