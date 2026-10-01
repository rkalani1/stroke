import { NIHSS_ITEMS } from './clinical/nihss-items.js';
import { numericInput } from './encounter-clinical-review.js';
import { DIAGNOSES, encounterTiming, nihssAssessment } from './workspace-state.js';

// Navigation cues only. These do not gate documentation or determine eligibility.
export function encounterOverview(state, now) {
  const n = state.note, exam = nihssAssessment(state.nihss), timing = encounterTiming(n, now);
  const missing = [];
  const requireEntry = (entered, label, target) => { if (!entered) missing.push({ label, target }); };
  requireEntry(Boolean(DIAGNOSES[n.diagnosisCategory]), 'Working diagnosis', 'input-diagnosis');
  requireEntry(numericInput(n.age, { min: 0, max: 120 }) !== null, 'Age', 'input-age');
  requireEntry(numericInput(n.weight, { min: Number.MIN_VALUE, max: 350 }) !== null, 'Weight', 'input-weight');
  requireEntry(numericInput(n.premorbidMRS, { min: 0, max: 6, integer: true }) !== null, 'Baseline mRS', 'calc-mrs');
  if (state.context === 'acute') {
    requireEntry(n.lkwUnknown || Boolean(timing.clock), 'LKW date and time', 'input-lkw-date');
    const unassessed = NIHSS_ITEMS.find(item => !item.options.includes(state.nihss[item.id]) || state.nihss[item.id]?.includes('(UN)'));
    requireEntry(exam.complete, 'NIHSS examination', `nihss-${unassessed?.id}`);
    requireEntry(['absent', 'present', 'uncertain'].includes(n.ctHemorrhageStatus), 'CT hemorrhage review', 'input-ct-review');
  }
  requireEntry(Boolean(state.actions.disposition), 'Disposition', 'input-disposition');
  return {
    diagnosis: DIAGNOSES[n.diagnosisCategory] || 'Not documented',
    examination: exam.complete ? `${exam.total}/42` : `${exam.count}/15 items · incomplete`,
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
