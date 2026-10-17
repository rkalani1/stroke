import { NIHSS_ITEMS } from './clinical/nihss-items.js';
import { numericInput } from './encounter-clinical-review.js';
import { DIAGNOSES, encounterTiming, encounterNihss } from './workspace-state.js';

// Navigation cues only. These do not gate documentation or determine eligibility.
export function encounterOverview(state, now) {
  const n = state.note, exam = encounterNihss(state), timing = encounterTiming(n, now);
  const missing = [];
  const requireEntry = (entered, label, target) => { if (!entered) missing.push({ label, target }); };
  requireEntry(Boolean(DIAGNOSES[n.diagnosisCategory]), 'Working diagnosis', 'input-diagnosis');
  requireEntry(numericInput(n.age, { min: 0, max: 120 }) !== null, 'Age', 'input-age');
  requireEntry(numericInput(n.weight, { min: Number.MIN_VALUE, max: 350 }) !== null, 'Weight', 'input-weight');
  requireEntry(numericInput(n.premorbidMRS, { min: 0, max: 6, integer: true }) !== null, 'Baseline mRS', 'calc-mrs');
  if (state.context === 'acute') {
    requireEntry(n.lkwUnknown || Boolean(timing.clock), 'LKW date and time', 'input-lkw-date');
    const unassessed = NIHSS_ITEMS.find(item => !item.options.includes(state.nihss[item.id]));
    requireEntry(exam.complete, exam.source === 'reported' ? 'Reported NIHSS total' : 'NIHSS examination', exam.source === 'reported' ? 'input-reported-nihss' : `nihss-${unassessed?.id}`);
    requireEntry(['absent', 'present', 'uncertain'].includes(n.ctHemorrhageStatus), 'CT hemorrhage review', 'input-ct-review');
    const [sbp, dbp] = String(n.presentingBP || '').split('/').map(value => numericInput(value, { min: 1, max: 400 }));
    requireEntry(sbp !== null && dbp !== null, 'Blood pressure', sbp === null ? 'input-sbp' : 'input-dbp');
    requireEntry(numericInput(n.glucose, { min: Number.MIN_VALUE }) !== null, 'Glucose', 'input-glucose');
    if (n.diagnosisCategory === 'ischemic') {
      // Unknown onset: the discovery time anchors the imaging-selected window.
      if (n.lkwUnknown) requireEntry(Boolean(timing.clock), 'Discovery time', 'input-discovery-date');
      requireEntry(Boolean(state.decisions?.ivt), 'IVT clinician decision', 'input-ivt-decision');
      requireEntry(Boolean(state.decisions?.evt), 'EVT clinician decision', 'input-evt-decision');
    }
  }
  requireEntry(Boolean(state.actions.disposition), 'Disposition', 'input-disposition');
  return {
    diagnosis: DIAGNOSES[n.diagnosisCategory] || 'Not documented',
    examination: exam.source === 'reported' ? exam.complete ? `${exam.total}/42 · reported` : 'Reported total missing / invalid' : exam.complete ? `${exam.total}/42${exam.untestable ? ` · ${exam.untestable} UN` : ''}` : `${exam.count}/15 items · incomplete`,
    timingLabel: n.lkwUnknown ? 'Discovery · LKW unknown' : 'Last known well',
    timing: timing.invalid ? 'Invalid / future time' : timing.clock ? `${timing.clock.elapsedMinutes} min elapsed` : n.lkwUnknown ? 'Onset unknown' : 'Not documented',
    missing
  };
}

export function focusEncounterTarget(id) {
  const target = document.getElementById(id);
  if (!target) return;
  for (let element = target.parentElement; element; element = element.parentElement) {
    if (element.tagName === 'DETAILS') element.open = true;
  }
  target.scrollIntoView({ block: 'start', behavior: 'auto' });
  target.focus({ preventScroll: true });
}
