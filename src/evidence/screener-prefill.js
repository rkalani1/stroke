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
    // onsetVal is the snapshot at import; onsetAnchorMs keeps elapsed time live.
    const anchor = new Date(timing.timestamp).getTime();
    Object.assign(patch, { onsetVal: Math.round(timing.hours * 100) / 100, onsetUnit: 'hours', onsetRangeHours: null, onsetAnchorMs: Number.isFinite(anchor) ? anchor : null });
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
    // A valid last-dose time answers the dose-interval exclusions directly.
    const dose = kind !== 'none' && kind !== 'lmwh' ? validTimestamp(note.lastDOACDose, nowMs) : null;
    const hours = dose ? (nowMs - dose.getTime()) / 3600000 : null;
    // Last dose to onset: from the LKW when recorded; otherwise the time to now bounds it.
    const lkw = typeof patch.onsetAnchorMs === 'number' ? patch.onsetAnchorMs : nowMs;
    const beforeOnset = dose ? (lkw - dose.getTime()) / 3600000 : null;
    const drug = kind === 'doac' ? 'DOAC' : 'warfarin/VKA';
    if (dose) {
      patch.exclusions.exOacWithin7d = hours <= 168;
      if (kind === 'doac') patch.exclusions.exXaDtiWithin48h = hours <= 48;
    }
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
  return { available: facts.length > 0, supported: Boolean(classification), classification, message: classification ? null : 'Diagnosis not recorded in Encounter', patch, summary };
}

// What an import says, without the elapsed-time snapshot (the LKW anchor is kept),
// so the passage of time alone never reads as a changed Encounter.
const canonical = v => v && typeof v === 'object' ? Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => [k, canonical(v[k])]) : v;
const importSource = prefill => prefill?.patch ? JSON.stringify(canonical({ ...prefill.patch, onsetVal: null })) : 'none';

// True when facts were imported and the live Encounter prefill no longer matches them.
export const importChanged = (state, prefill) => Boolean(state?.imported?.source) && Boolean(prefill) && state.imported.source !== importSource(prefill);

// Apply an Encounter prefill. Switching classification starts from a clean
// screen (as the classification buttons do); otherwise entered facts persist.
// Facts the previous import wrote and the user has not changed since are first
// returned to unknown, so a reapply never keeps what the Encounter no longer says.
// A yes/no answer or anticoagulant the user entered that a definite Encounter value
// contradicts is kept, not overwritten, and listed in imported.conflicts.
export function applyEncounterPrefill(state, prefill, initialState) {
  if (!prefill?.patch) return state;
  const base = prefill.patch.classification && prefill.patch.classification !== state.classification ? initialState : state;
  const cleared = { ...base, exclusions: { ...base.exclusions } };
  for (const [key, value] of Object.entries(base.imported?.fields || {})) if (Object.is(base[key], value)) cleared[key] = initialState[key];
  for (const [id, value] of Object.entries(base.imported?.exclusions || {})) if (cleared.exclusions[id] === value) delete cleared.exclusions[id];
  const entered = v => typeof v === 'boolean' || (typeof v === 'string' && v !== 'unselected');
  const conflicts = [];
  const patch = { ...prefill.patch, exclusions: { ...prefill.patch.exclusions } };
  for (const key of Object.keys(patch)) if ((typeof patch[key] === 'boolean' || key === 'anticoagulant') && entered(patch[key]) && entered(cleared[key]) && cleared[key] !== patch[key]) { conflicts.push(key); delete patch[key]; }
  for (const [id, value] of Object.entries(patch.exclusions)) if (typeof value === 'boolean' && typeof cleared.exclusions[id] === 'boolean' && cleared.exclusions[id] !== value) { conflicts.push(id); delete patch.exclusions[id]; }
  const next = applyFacts(cleared, patch);
  const fields = Object.fromEntries(Object.entries(patch).filter(([key, value]) => key !== 'exclusions' && value !== undefined));
  const exclusions = Object.fromEntries(Object.entries(patch.exclusions).filter(([, value]) => typeof value === 'boolean'));
  return { ...next, imported: { fields, exclusions, conflicts, source: importSource(prefill) } };
}

export default screenerPrefillFromEncounter;
