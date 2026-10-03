// src/evidence/screener-prefill.js
//
// Pure mapping from the Encounter workspace state to Trial Screener facts.
// Prefill is applied only on an explicit user action; every value it does not
// recognise stays unknown, and every imported fact a modeled study uses has a screener control.

import { encounterTiming, encounterNihss, encounterVolume, validTimestamp } from '../workspace-state.js';
import { reviewedGcs, numericInput } from '../encounter-clinical-review.js';

const MODELED = { ischemic: 'ischemic', ich: 'ich', tia: 'tia' };
const DIAGNOSIS_LABEL = { ischemic: 'Ischemic', ich: 'ICH', tia: 'TIA', sah: 'SAH', cvt: 'CVT', mimic: 'Stroke mimic', other: 'Other / uncertain' };
export const NO_MODELED_STUDIES = 'No modeled studies for this diagnosis';
// Dominance of an M2 occlusion is not recorded in the Encounter, so M2 stays unknown;
// 'M3 / distal' also stays unknown because the screener groups M3 with non-dominant M2.
const VESSEL = { ICA: 'ica_m1', M1: 'ica_m1', None: 'none', ACA: 'other', PCA: 'other', Vertebral: 'other', Basilar: 'other', Other: 'other' };
const ANTICOAGULANT_KIND = { apixaban: 'doac', rivaroxaban: 'doac', dabigatran: 'doac', edoxaban: 'doac', warfarin: 'vka', lmwh: 'lmwh', none: 'none' };
const ANTICOAGULANT_TEXT = { doac: 'on DOAC', vka: 'on warfarin/VKA', lmwh: 'on LMWH', none: 'no anticoagulant' };

// Facts implied by "anticoagulant at onset". undefined clears a fact to unknown.
// LMWH is parenteral, so it says nothing about oral anticoagulant use.
export function anticoagulantFacts(kind) {
  switch (kind) {
    case 'none': return { takingOac: false, exclusions: { exDoacLmwhAtOnset: false, exOacWithin7d: false, exXaDtiWithin48h: false } };
    case 'doac': return { takingOac: true, exclusions: { exDoacLmwhAtOnset: true, exOacWithin7d: true, exXaDtiWithin48h: undefined } };
    case 'vka': return { takingOac: true, exclusions: { exDoacLmwhAtOnset: false, exOacWithin7d: true, exXaDtiWithin48h: false } };
    case 'lmwh': return { takingOac: 'unselected', exclusions: { exDoacLmwhAtOnset: true, exOacWithin7d: undefined, exXaDtiWithin48h: undefined } };
    default: return { takingOac: 'unselected', exclusions: { exDoacLmwhAtOnset: undefined, exOacWithin7d: undefined, exXaDtiWithin48h: undefined } };
  }
}

// Merge a facts patch into screener state, dropping cleared (undefined) keys.
export function applyFacts(state, patch) {
  const exclusions = { ...state.exclusions };
  for (const [id, value] of Object.entries(patch.exclusions || {})) {
    if (typeof value === 'boolean') exclusions[id] = value; else delete exclusions[id];
  }
  return { ...state, ...patch, exclusions };
}

export function applyAnticoagulant(state, kind) {
  return applyFacts(state, { anticoagulant: kind || 'unselected', ...anticoagulantFacts(kind) });
}

const fmtHours = h => { const minutes = Math.round(h * 60); return h < 48 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${(h / 24).toFixed(1)} d`; };

export function screenerPrefillFromEncounter(state, nowMs = Date.now()) {
  const note = state?.note || {};
  const diagnosis = note.diagnosisCategory || '';
  const classification = MODELED[diagnosis] || null;
  const patch = { exclusions: {} };
  const summary = [];
  if (diagnosis) summary.push(DIAGNOSIS_LABEL[diagnosis] || diagnosis);
  if (diagnosis && !classification) {
    return { available: true, supported: false, classification: null, message: NO_MODELED_STUDIES, patch: null, summary };
  }
  if (classification) patch.classification = classification;

  const timing = encounterTiming(note, nowMs);
  if (typeof timing.hours === 'number' && Number.isFinite(timing.hours) && timing.hours >= 0) {
    Object.assign(patch, { onsetVal: Math.round(timing.hours * 100) / 100, onsetUnit: 'hours', onsetRangeHours: null });
    summary.push(`LKW ${fmtHours(timing.hours)}`);
  }

  const age = numericInput(note.age, { min: 0, max: 120 });
  if (age !== null) { patch.age = age; summary.push(`${age} y`); }

  const nihss = encounterNihss(state).total;
  if (nihss !== null && nihss !== undefined) { patch.nihss = nihss; summary.push(`NIHSS ${nihss}`); }

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
    const vesselLabel = note.vesselOcclusion?.[0] || '';
    if (VESSEL[vesselLabel]) { patch.vessel = VESSEL[vesselLabel]; summary.push(vesselLabel === 'None' ? 'no occlusion' : vesselLabel); }
    else if (vesselLabel) summary.push(vesselLabel === 'M2' ? 'M2 (dominance not recorded)' : `${vesselLabel} (not imported)`);
    const aspects = numericInput(state.aspects, { min: 0, max: 10, integer: true });
    if (aspects !== null) { patch.aspects = aspects; summary.push(`ASPECTS ${aspects}`); }
  }

  const preMrs = numericInput(note.premorbidMRS, { min: 0, max: 5, integer: true });
  if (preMrs !== null) { patch.preMrs = preMrs; summary.push(`pre-mRS ${preMrs}`); }

  // Etiology answer: documented AF (or its explicit absence) feeds AF-dependent profiles.
  const af = state.details?.afDetected;
  if (af === 'yes' || af === 'no') { patch.afibHistory = af === 'yes'; summary.push(af === 'yes' ? 'AF documented' : 'no AF documented'); }

  const kind = ANTICOAGULANT_KIND[note.lastDOACType];
  if (kind) {
    const facts = anticoagulantFacts(kind);
    patch.anticoagulant = kind;
    // Import only what is known; it never clears an assessment already entered.
    if (typeof facts.takingOac === 'boolean') patch.takingOac = facts.takingOac;
    for (const [id, value] of Object.entries(facts.exclusions)) if (typeof value === 'boolean') patch.exclusions[id] = value;
    // A valid last-dose time answers the dose-interval exclusions directly.
    const dose = kind !== 'none' && kind !== 'lmwh' ? validTimestamp(note.lastDOACDose, nowMs) : null;
    const hours = dose ? (nowMs - dose.getTime()) / 3600000 : null;
    if (dose) {
      patch.exclusions.exOacWithin7d = hours <= 168;
      if (kind === 'doac') patch.exclusions.exXaDtiWithin48h = hours <= 48;
    }
    if (hours !== null && hours > 168) {
      // A last dose more than 7 days ago says nothing about use at onset or at the index stroke.
      // Clear explicitly (not omit) so a reapply also clears what an earlier import set.
      patch.exclusions.exDoacLmwhAtOnset = undefined;
      patch.takingOac = 'unselected';
      patch.anticoagulant = 'unselected';
      summary.push(`${kind === 'doac' ? 'DOAC' : 'warfarin/VKA'}, last dose >7 d`);
    } else summary.push(ANTICOAGULANT_TEXT[kind]);
  }

  const facts = Object.keys(patch).filter(key => key !== 'exclusions' && key !== 'onsetUnit' && key !== 'onsetRangeHours');
  return { available: facts.length > 0, supported: Boolean(classification), classification, message: classification ? null : 'Diagnosis not recorded in Encounter', patch, summary };
}

// Apply an Encounter prefill. Switching classification starts from a clean
// screen (as the classification buttons do); otherwise entered facts persist.
export function applyEncounterPrefill(state, prefill, initialState) {
  if (!prefill?.patch) return state;
  const base = prefill.patch.classification && prefill.patch.classification !== state.classification ? initialState : state;
  return applyFacts(base, prefill.patch);
}

export default screenerPrefillFromEncounter;
