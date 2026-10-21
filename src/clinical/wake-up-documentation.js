import { documentedExamScore, evaluateWakeUpScreen, numericInput } from '../encounter-clinical-review.js';
import { computeLKWCountdown } from '../calculators-extended.js';
import { formatRecordedInstant, enteredTime } from './timestamp.js';

const reviewLimit = 'complete eligibility and drug-specific treatment decision require review';
const recordedText = value => typeof value === 'string' && value.trim() ? value.trim() : 'not documented';
// A unit follows only a number; derived values use the CTP export precision (0.1 mL, ratio 0.01).
const recordedNumber = (value, unit = '') => Number.isFinite(value) ? `${value}${unit}` : 'not documented or invalid';
const rounded = (value, places) => { const result = Math.round(value * 10 ** places) / 10 ** places; return Number.isFinite(value) && Number.isFinite(result) ? result : value; };
const recordedCheck = value => value === true ? 'documented' : 'not documented';
const recordedFinding = value => value === true ? 'yes' : value === false ? 'no' : 'not documented';

// A sleep midpoint in the repeated fall-back hour stays flagged until its occurrence is chosen;
// a valid value prints as local wall time.
const sleepMidpointText = (value, now) => {
  const text = recordedText(value);
  if (text === 'not documented') return text;
  return computeLKWCountdown(text, now.getTime()) ? formatRecordedInstant(text, now.getTime()) : `${enteredTime(text)} (invalid, future or ambiguous; correct before interpretation)`;
};

// Export the selected source screen, using the same assessment as the Encounter
// UI. Checkbox state is an attestation, not proof of a negative imaging finding.
// Callers decide whether the wake-up workflow belongs in their note surface.
export function formatWakeUpScreenForExport(note = {}, now = new Date()) {
  const workflow = note.wakeUpStrokeWorkflow || {};
  const screen = evaluateWakeUpScreen(note, now);
  const isMri = workflow.mriAvailable === true;
  const isCtp = workflow.mriAvailable === false;
  const pathway = isMri ? 'MRI (WAKE-UP)' : isCtp ? 'CTP (EXTEND)' : 'pathway not documented';
  const met = isMri ? screen.wakeUpEligible === true : isCtp ? screen.extendEligible === true : false;
  // A known LKW within 4.5 h: the screen does not apply. Only recorded MRI findings are kept; age, NIHSS,
  // perfusion volumes and times are already elsewhere in the note.
  const notApplicable = !met && (isMri || isCtp) && screen.wakeUpApplicable === false;
  const lines = [`Wake-up / unknown-onset imaging screen — ${pathway}: ${met ? 'partial source screen met' : notApplicable ? 'not applicable (known LKW within 4.5 h)' : 'incomplete or not met'}; ${reviewLimit}.`];
  if (!notApplicable) lines.push(`Documented age: ${recordedNumber(numericInput(note.age, { min: 0 }))}; NIHSS: ${recordedNumber(documentedExamScore(note))}.`);

  if (isMri) {
    lines.push(
      `DWI-positive lesion: ${recordedCheck(workflow.dwi?.positiveForLesion)}.`,
      `No marked corresponding FLAIR hyperintensity: ${recordedCheck(workflow.flair?.noMarkedHyperintensity)}.`,
      `MRI lesion extent reviewed: ${recordedCheck(workflow.mriLesionExtentReviewed)}.`,
      `DWI lesion smaller than one-third MCA territory: ${recordedFinding(workflow.dwiLesionUnderOneThirdMCA)}.`,
      ...notApplicable ? [] : [`Symptom discovery (date/time): ${recordedText(note.discoveryDate)} / ${recordedText(note.discoveryTime)}.`]
    );
    if (workflow.dwi?.lesionVolume !== undefined && workflow.dwi?.lesionVolume !== null && String(workflow.dwi.lesionVolume).trim() !== '') {
      lines.push(`Recorded MRI lesion volume: ${recordedNumber(numericInput(workflow.dwi.lesionVolume, { min: 0 }), ' mL')}.`);
    }
  } else if (isCtp && !notApplicable) {
    const perfusion = screen.perfusion;
    // Total below core is a measurement conflict, not a ratio below 1; core 0 has no ratio.
    const conflict = perfusion.coreVolume !== null && perfusion.penumbraVolume !== null && perfusion.penumbraVolume < perfusion.coreVolume ? 'not calculable (total hypoperfused volume below core; reconcile)' : '';
    lines.push(
      `Screen source: ${screen.perfusionSource}.`,
      `Documented premorbid mRS: ${recordedNumber(numericInput(note.premorbidMRS, { min: 0, max: 6, integer: true }))}.`,
      `Perfusion core: ${recordedNumber(perfusion.coreVolume, ' mL')}; total hypoperfused volume: ${recordedNumber(perfusion.penumbraVolume, ' mL')}; calculated mismatch volume: ${conflict || recordedNumber(rounded(perfusion.mismatchVolume, 1), ' mL')}; mismatch ratio: ${conflict || (perfusion.coreVolume === 0 && perfusion.penumbraVolume !== null ? 'not calculable (core 0)' : recordedNumber(rounded(perfusion.mismatchRatio, 2)))}.`,
      note.lkwUnknown === true
        ? `Sleep midpoint: ${sleepMidpointText(workflow.sleepMidpoint, now)}.`
        : `Last known well (date/time): ${recordedText(note.lkwDate)} / ${recordedText(note.lkwTime)}.`
    );
  }

  return lines.join('\n');
}
