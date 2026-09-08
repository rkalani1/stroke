// These helpers describe recorded input, never treatment eligibility.
export function recordedTreatmentDecision(note = {}, treatment) {
  if (note[treatment + 'Recommended'] === true) return true;
  if (note[treatment + 'Recommended'] === false && note[treatment + 'DecisionRecorded'] === true) return false;
  return null;
}

export function treatmentDecisionFields(treatment, decision = null) {
  return {
    [treatment + 'Recommended']: decision === true,
    [treatment + 'DecisionRecorded']: decision === true || decision === false
  };
}

export function treatmentDecisionStatus(note = {}, treatment) {
  const category = note.diagnosisCategory;
  if (category === 'ich' || category === 'sah') return 'N/A (' + category.toUpperCase() + ')';
  if (treatment === 'tnk' && note.tnkAutoBlocked) return 'Not recommended (recorded contraindication)';
  if (recordedTreatmentDecision(note, treatment) === true) return 'Recommended';
  if (recordedTreatmentDecision(note, treatment) === false) return 'Not recommended';
  return 'Decision not documented';
}

const recordedTime = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && Number.isFinite(Date.parse(text))) return text;
  return '';
};

export function treatmentAdministrationTime(note = {}, treatment) {
  if (treatment === 'tnk') {
    return recordedTime(note.tnkAdminTime) || recordedTime(note.dtnTnkAdministered) || recordedTime(note.needleTime);
  }
  // Puncture is a procedure start. A planned device, consent, or recommendation
  // does not establish that EVT was completed.
  return treatment === 'evt' ? recordedTime(note.reperfusionTime) : '';
}

export function hasRecordedTreatmentAdministration(note = {}, treatment) {
  return Boolean(treatmentAdministrationTime(note, treatment));
}

// A default false recommendation is not a documented decision to omit treatment.
// Recorded administration/procedure start overrides a later negative plan.
export function hasRecordedNoTreatment(note = {}, treatment) {
  if (hasRecordedTreatmentAdministration(note, treatment)) return false;
  if (treatment === 'evt' && recordedTime(note.punctureTime)) return false;
  return recordedTreatmentDecision(note, treatment) === false ||
    (treatment === 'tnk' && note.tnkAutoBlocked === true);
}

export function treatmentCourseStatus(note = {}, treatment) {
  const time = treatmentAdministrationTime(note, treatment);
  if (time) return treatment === 'tnk' ? 'Administration recorded at ' + time : 'Procedure/reperfusion recorded at ' + time;
  if (treatment === 'evt' && recordedTime(note.punctureTime)) {
    return 'Puncture recorded at ' + recordedTime(note.punctureTime) + '; procedure completion not documented';
  }
  const status = treatmentDecisionStatus(note, treatment);
  if (status === 'Recommended') return status + (treatment === 'tnk' ? '; administration not documented' : '; procedure completion not documented');
  return status;
}

export function treatmentCourseSummary(note = {}) {
  return 'TNK: ' + treatmentCourseStatus(note, 'tnk') + '\nEVT: ' + treatmentCourseStatus(note, 'evt');
}

export function treatmentDocumentationComplete(note = {}) {
  if (note.diagnosisCategory === 'ich' || note.diagnosisCategory === 'sah') return true;
  return ['tnk', 'evt'].every((treatment) =>
    hasRecordedTreatmentAdministration(note, treatment) || recordedTreatmentDecision(note, treatment) === false ||
    (treatment === 'tnk' && note.tnkAutoBlocked === true));
}

export function documentedNihssValue(note = {}, calculatedScore, hasExamInput = false) {
  const valid = (value) => value !== null && value !== undefined && String(value).trim() !== '' &&
    /^(?:\d|[1-3]\d|4[0-2])$/.test(String(value).trim());
  if (valid(note.nihss)) return String(note.nihss).trim();
  return hasExamInput && valid(calculatedScore) ? String(calculatedScore).trim() : '';
}
