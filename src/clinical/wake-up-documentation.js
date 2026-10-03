import { documentedExamScore, evaluateWakeUpScreen, numericInput } from '../encounter-clinical-review.js';

const reviewLimit = 'complete eligibility and drug-specific treatment decision require review';
const recordedText = value => typeof value === 'string' && value.trim() ? value.trim() : 'not documented';
const recordedNumber = value => Number.isFinite(value) ? String(value) : 'not documented or invalid';
const recordedCheck = value => value === true ? 'documented' : 'not documented';
const recordedFinding = value => value === true ? 'yes' : value === false ? 'no' : 'not documented';

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
  const lines = [
    `Wake-up / unknown-onset imaging screen — ${pathway}: ${met ? 'partial source screen met' : 'incomplete or not met'}; ${reviewLimit}.`,
    `Documented age: ${recordedNumber(numericInput(note.age, { min: 0 }))}; NIHSS: ${recordedNumber(documentedExamScore(note))}.`
  ];

  if (isMri) {
    lines.push(
      `DWI-positive lesion: ${recordedCheck(workflow.dwi?.positiveForLesion)}.`,
      `No marked corresponding FLAIR hyperintensity: ${recordedCheck(workflow.flair?.noMarkedHyperintensity)}.`,
      `MRI lesion extent reviewed: ${recordedCheck(workflow.mriLesionExtentReviewed)}.`,
      `DWI lesion smaller than one-third MCA territory: ${recordedFinding(workflow.dwiLesionUnderOneThirdMCA)}.`,
      `Symptom discovery (date/time): ${recordedText(note.discoveryDate)} / ${recordedText(note.discoveryTime)}.`
    );
    if (workflow.dwi?.lesionVolume !== undefined && workflow.dwi?.lesionVolume !== null && String(workflow.dwi.lesionVolume).trim() !== '') {
      lines.push(`Recorded MRI lesion volume: ${recordedNumber(numericInput(workflow.dwi.lesionVolume, { min: 0 }))} mL.`);
    }
  } else if (isCtp) {
    const perfusion = screen.perfusion;
    lines.push(
      `Screen source: ${screen.perfusionSource}.`,
      `Documented premorbid mRS: ${recordedNumber(numericInput(note.premorbidMRS, { min: 0, max: 6, integer: true }))}.`,
      `Perfusion core: ${recordedNumber(perfusion.coreVolume)} mL; total hypoperfused volume: ${recordedNumber(perfusion.penumbraVolume)} mL; calculated mismatch volume: ${recordedNumber(perfusion.mismatchVolume)} mL; mismatch ratio: ${recordedNumber(perfusion.mismatchRatio)}.`,
      note.lkwUnknown === true
        ? `Sleep midpoint: ${recordedText(workflow.sleepMidpoint)}.`
        : `Last known well (date/time): ${recordedText(note.lkwDate)} / ${recordedText(note.lkwTime)}.`
    );
  }

  return lines.join('\n');
}
