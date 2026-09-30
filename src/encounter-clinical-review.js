// Encounter-only assessments. Do not use these to rewrite locked institutional
// Protocols. A partial source screen is never a complete treatment determination.
// Sources: AHA/ASA AIS2026 doi:10.1161/STR.0000000000000513 §§4.6–4.7;
// EXTEND doi:10.1056/NEJMoa1813046; WAKE-UP doi:10.1056/NEJMoa1804355.
export function numericInput(value, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)) ? n : null;
}

export function documentedExamScore(note = {}, calculatedScore, examComplete = false) {
  return numericInput(note.nihss, { min: 0, max: 42, integer: true }) ??
    (examComplete ? numericInput(calculatedScore, { min: 0, max: 42, integer: true }) : null);
}

export function calculatorField(values = {}, key, encounterValue, sync) {
  // A deliberate clear is data. It must not fall through to a patient value.
  return Object.hasOwn(values, key) ? values[key] : (sync ? encounterValue ?? '' : '');
}

const hoursSince = (value, now) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  const hours = (new Date(now).getTime() - time) / 3600000;
  return Number.isFinite(hours) && hours >= 0 ? hours : null;
};

export function evaluateWakeUpScreen(note = {}, now = new Date()) {
  const workflow = note.wakeUpStrokeWorkflow || {};
  const core = numericInput(note.coreVolume ?? note.ctpStructured?.coreVolume, { min: 0 });
  // This field represents total hypoperfused volume, not the already-subtracted mismatch.
  const hypoperfusion = numericInput(note.penumbraVolume ?? note.ctpStructured?.penumbraVolume, { min: 0 });
  const mismatchVolume = core !== null && hypoperfusion !== null && hypoperfusion >= core ? hypoperfusion - core : null;
  const directRatio = numericInput(note.mismatchRatio ?? note.ctpStructured?.mismatchRatio, { min: 0 });
  const ratio = core !== null && core > 0 && hypoperfusion !== null ? hypoperfusion / core : directRatio;
  const ratioMet = core === 0 && hypoperfusion > 10 ? true : ratio !== null && ratio > 1.2;
  const age = numericInput(note.age, { min: 18, max: 120 });
  const nihss = documentedExamScore(note);
  const mrs = numericInput(note.premorbidMRS, { min: 0, max: 6, integer: true });
  const discoveryHours = hoursSince(note.discoveryDate && note.discoveryTime ? `${note.discoveryDate}T${note.discoveryTime}` : null, now);
  const onsetHours = note.lkwUnknown ? null : hoursSince(note.lkwDate && note.lkwTime ? `${note.lkwDate}T${note.lkwTime}` : null, now);
  const midpointHours = hoursSince(workflow.sleepMidpoint, now);
  const withinExtendTime = note.lkwUnknown === true ? midpointHours !== null && midpointHours <= 9 : onsetHours !== null && onsetHours >= 4.5 && onsetHours <= 9;
  const perfusionCoreOk = core !== null && core < 70;
  const perfusionMismatchVolOk = mismatchVolume !== null && mismatchVolume > 10;
  const common = age !== null && nihss !== null && note.ctHemorrhageStatus === 'absent';
  const autoExtend = common && nihss >= 4 && nihss <= 26 && mrs !== null && mrs < 2 && withinExtendTime && perfusionCoreOk && ratioMet && perfusionMismatchVolOk;
  const autoWakeUp = common && age <= 80 && nihss <= 25 && note.lkwUnknown === true && discoveryHours !== null && discoveryHours <= 4.5 && workflow.dwi?.positiveForLesion === true && workflow.flair?.noMarkedHyperintensity === true && workflow.mriLesionExtentReviewed === true;
  return { wakeUpEligible: autoWakeUp, extendEligible: autoExtend, manualWakeUp: false, manualExtend: false, autoWakeUp, autoExtend, withinExtendTime, discoveryHours, midpointHours, perfusionCoreOk, perfusionRatioOk: ratioMet, perfusionMismatchVolOk, perfusion: { coreVolume: core, penumbraVolume: hypoperfusion, mismatchVolume, mismatchRatio: ratio }, status: autoWakeUp || autoExtend ? 'partial-source-screen-met' : 'incomplete-or-not-met' };
}

// Drug-class review, not a pharmacokinetic estimate of thrombolysis eligibility.
// Activase label §2.1; ESO IVT2021 anticoagulant recommendations.
export function documentedIvtContext(note = {}) {
  const medications = typeof note.medications === 'string' ? note.medications : '';
  // A name in free text prompts reconciliation; it does not establish ingestion,
  // dose, recency, or anticoagulant activity (including negated/history mentions).
  const medicationReconciliation = /\b(?:apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa|edoxaban|savaysa|lixiana|warfarin|coumadin|jantoven|heparin|enoxaparin|lovenox|dalteparin|fragmin|tinzaparin|fondaparinux|arixtra)\b/i.test(medications);
  return { medicationReconciliation, pregnancy: note.pregnancyStroke === true };
}

export function assessAnticoagulantExposure(note = {}, now = new Date()) {
  const drug = note.lastDOACType;
  const result = (status, reason) => ({ status, recent: status === 'block', note: ` (${reason})`, reason });
  if (drug === 'none' && documentedIvtContext(note).medicationReconciliation) return result('review', 'The medication record mentions an anticoagulant despite the no-anticoagulant selection. Reconcile actual use, dose and timing; text matching cannot determine exposure or clearance');
  if (drug === 'none') return result('none', 'No anticoagulant use explicitly documented');
  if (!drug) return result('unknown', 'Anticoagulant exposure not assessed');
  const elapsed = hoursSince(note.lastDOACDose, now);
  if (drug === 'warfarin') {
    const inr = numericInput(note.inr, { min: 0.1 });
    return inr === null ? result('unknown', 'Document current INR') : inr > 1.7 ? result('block', 'INR above 1.7') : result('review', 'INR alone does not establish IVT eligibility');
  }
  if (drug === 'heparin') {
    const ptt = numericInput(note.ptt, { min: 1 });
    return ptt === null ? result('unknown', 'UFH exposure requires a current aPTT and dose/time review') : ptt > 40 ? result('block', 'aPTT above 40 seconds') : result('review', 'Review UFH dose, timing and assay; no DOAC clearance model applies');
  }
  if (drug === 'lmwh') {
    if (!['therapeutic', 'prophylactic'].includes(note.anticoagulantDoseIntent) || elapsed === null) return result('unknown', 'Document LMWH dose intent and valid last-dose time');
    if (note.anticoagulantDoseIntent === 'therapeutic' && elapsed < 24) return result('block', 'Therapeutic LMWH within 24 hours');
    return result('review', 'LMWH requires dose-, renal- and timing-specific IVT review');
  }
  if (['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban'].includes(drug)) {
    return result('review', elapsed === null ? 'DOAC timing unknown; drug-specific laboratory and specialist assessment required' : 'Review actual dose, timing, renal function and drug-specific assays; estimated clearance does not establish IVT eligibility');
  }
  return result('review', 'Use an agent-specific anticoagulant and coagulation assessment');
}

export function evaluateVideoTreatment({ note = {}, clock, aspects, pcAspects, critical = [], now = new Date() } = {}) {
  const pending = reason => ({ eligible: false, confidence: 'low', reason });
  const review = reason => ({ eligible: false, confidence: 'medium', reviewRequired: true, reason });
  const matched = reason => ({ eligible: true, confidence: 'medium', reason });
  const age = numericInput(note.age, { min: 0, max: 120 });
  const nihss = documentedExamScore(note);
  const hours = clock && !clock.futureWarning && clock.label !== 'Discovery' ? numericInput(clock.total, { min: 0 }) : null;
  const mrs = numericInput(note.premorbidMRS, { min: 0, max: 6, integer: true });
  const wake = evaluateWakeUpScreen(note, now);
  const exposure = assessAnticoagulantExposure(note, now);
  const bpParts = typeof note.presentingBP === 'string' ? note.presentingBP.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/) : null;
  const systolic = numericInput(bpParts?.[1], { min: 40, max: 350 });
  const diastolic = numericInput(bpParts?.[2], { min: 20, max: 250 });
  const glucose = numericInput(note.glucose, { min: 1, max: 2000 });
  const pcScore = numericInput(pcAspects, { min: 0, max: 10, integer: true });
  // A completed-review attestation cannot erase a separately documented concern.
  // Relative factors trigger specialist review, never a permanent exclusion label.
  const checklist = note.tnkContraindicationChecklist || {};
  const context = documentedIvtContext(note);
  const concernKeys = ['currentICH', 'intracranialTumor', 'aorticDissection', 'activeInternalBleeding', 'giMalignancy', 'sahPresentation', 'infectiveEndocarditis', 'acuteSevereTBI', 'severeUncontrolledHTN', 'lowPlatelets', 'warfarinElevatedINR', 'knownBleedingDiathesis', 'priorICH', 'vascularMalformation', 'pregnancy', 'recentStroke', 'recentHeadTrauma', 'recentIntracranialSurgery', 'recentMajorSurgery', 'recentGIGUBleeding', 'recentArterialPuncture', 'recentLumbarPuncture', 'recentHeparin', 'recentDOAC', 'abnormalCoagUnknown', 'preexistingDisability', 'acutePericarditis', 'unrupturedAneurysm10mm', 'largeInfarct', 'extensiveHypoattenuation', 'cerebralMicrobleeds', 'lecanemab', 'lowGlucose', 'highGlucose', 'elevatedAPTT', 'severeRenalFailure'];
  const recordedConcern = concernKeys.some(key => checklist[key] === true) || context.pregnancy || context.medicationReconciliation || checklist.medicationReconciliation === true;
  const malformedConcern = concernKeys.some(key => checklist[key] !== undefined && typeof checklist[key] !== 'boolean');
  let tnk = pending('Complete onset, examination, imaging and contraindication assessment.');
  if (critical.length || exposure.status === 'block' || ['ich', 'sah'].includes(note.diagnosisCategory) || note.tnkAutoBlocked === true || note.infectiveEndocarditis === true || recordedConcern || malformedConcern) tnk = review('A recorded contraindication, relative risk factor or contradictory checklist entry requires clinician review; do not proceed from this partial screen. Relative/correctable factors are not permanent exclusions, and the review attestation does not override them.');
  else if (note.diagnosisCategory !== 'ischemic') tnk = pending('Confirm the working ischemic-stroke diagnosis and reconcile any alternative diagnosis before applying this partial screen. Diagnostic uncertainty alone is not a permanent IVT contraindication.');
  else if (age === null || age < 18) tnk = pending(age === null ? 'Document age.' : 'Pediatric stroke: use the pediatric specialist pathway; adult IVT criteria do not apply.');
  else if (nihss === null || typeof note.disablingDeficit !== 'boolean') tnk = pending('Document a complete NIHSS and whether the residual deficit is disabling.');
  else if (note.ctHemorrhageStatus !== 'absent' || note.ivtContraindicationsReviewed !== true) tnk = pending('Confirm reviewed imaging excludes hemorrhage and complete the IVT contraindication review.');
  else if (systolic === null || diastolic === null || systolic <= diastolic || glucose === null) tnk = pending('Document valid current BP and glucose in mg/dL; an attestation does not fill missing measurements.');
  else if (systolic >= 185 || diastolic >= 110 || glucose < 50 || glucose > 400) tnk = review('Correct the recorded BP or severe glucose derangement and reassess persistent deficits before an IVT decision; no eligibility is inferred from this screen.');
  else if (exposure.status !== 'none') tnk = pending(exposure.reason + '. Resolve the anticoagulant assessment before an IVT decision.');
  else if (note.disablingDeficit === false) tnk = review('Non-disabling deficit documented: IVT is not recommended for mild non-disabling stroke. Reassess disability and use the appropriate antithrombotic pathway.');
  else if (note.lkwUnknown === true) tnk = pending(wake.wakeUpEligible || wake.extendEligible ? 'Imaging-selected partial screen met. Confirm the complete source pathway, drug-specific evidence and EVT plan with the stroke team; this is not standard-window TNK eligibility.' : 'Onset is unknown. Discovery time is not LKW; complete the MRI/recognition or perfusion/sleep-midpoint pathway.');
  else if (hours === null) tnk = pending('Document a valid known-onset/LKW time; future times require correction.');
  else if (hours <= 4.5) tnk = matched(`Known-onset standard-window screen: ${hours.toFixed(1)} h, documented disabling deficit and NIHSS ${nihss}. Clinician confirmation of complete IVT eligibility is required.`);
  else tnk = pending(wake.extendEligible ? 'EXTEND partial imaging/time screen met. Review drug-specific IVT evidence, full exclusions and EVT plan; do not infer routine TNK eligibility.' : 'Outside the standard IVT window. A complete imaging-selected, drug-specific pathway is required.');
  const vessels = Array.isArray(note.vesselOcclusion) ? note.vesselOcclusion : [];
  let evt = pending('Document vessel imaging, age, complete NIHSS, baseline function and time.');
  if (['ich', 'sah', 'mimic', 'cvt'].includes(note.diagnosisCategory) || note.ctHemorrhageStatus === 'present' || checklist.currentICH === true) evt = review('The recorded diagnosis or hemorrhage finding conflicts with the modeled ischemic EVT pathway; urgent specialist reconciliation is required.');
  else if (note.diagnosisCategory !== 'ischemic' || note.ctHemorrhageStatus !== 'absent' || critical.length) evt = pending('Confirm ischemic diagnosis, reviewed hemorrhage-negative imaging and resolution of critical clinical concerns before applying the partial EVT screen.');
  else if (age !== null && age < 18) evt = pending('Pediatric occlusion: urgent pediatric neurointerventional review with age-specific imaging/expertise criteria. Adult recommendation tiers do not apply.');
  else if (age === null || nihss === null || mrs === null || hours === null) evt = pending('Adult EVT assessment incomplete: age, NIHSS, premorbid mRS and valid LKW-based interval are required. Unknown onset still warrants urgent expert imaging review.');
  else if (hours > 24) evt = review('Beyond the modeled 24-hour window: individualized urgent neurointerventional review; this screen cannot determine benefit.');
  else if (mrs > 1) evt = review(`Premorbid mRS ${mrs}: use the separate baseline-disability recommendation and individualized goals; disability is not an automatic exclusion.`);
  else if (vessels.includes('Basilar')) evt = pcScore === null ? pending('Basilar occlusion: document assessed pc-ASPECTS and brainstem infarct extent.') : nihss >= 10 && pcScore >= 6 ? matched('Basilar occlusion partial guideline screen met: within 24 h, NIHSS ≥10, premorbid mRS 0–1 and pc-ASPECTS ≥6. Confirm full specialist assessment.') : review('Basilar occlusion outside the modeled strong-recommendation tier; individual neurointerventional review.');
  else if (vessels.some(v => ['ICA', 'M1'].includes(v))) {
    if (nihss < 6) evt = review('Low-NIHSS proximal occlusion: benefit is uncertain; assess disability, deterioration and current trial options urgently.');
    else if (numericInput(aspects, { min: 0, max: 10, integer: true }) === null) evt = pending('Document assessed ASPECTS.');
    else if (aspects >= 6) evt = matched('Adult ICA/M1 partial guideline screen met: within 24 h, NIHSS ≥6, ASPECTS ≥6 and premorbid mRS 0–1. Confirm the complete clinical/imaging assessment.');
    else evt = review('Large-core assessment requires the complete age, timing, imaging and mass-effect pathway; ASPECTS alone cannot establish eligibility.');
  } else if (vessels.length) evt = review('Medium/distal or other occlusion: confirm the exact segment/dominance, disability and current evidence with the neurointerventional team.');
  return { tnk, evt };
}

export function buildEvtConsentText(note = {}) {
  const kit = note.consentKit || {};
  const lines = ['EVT COMMUNICATION RECORD'];
  if (kit.evtConsentDiscussed === true) {
    lines.push('Risks, benefits and alternatives discussed' + (kit.evtConsentWith ? ` with ${kit.evtConsentWith}` : '') + (kit.evtConsentTime ? ` at ${kit.evtConsentTime}` : '') + '.');
  } else lines.push('Risk, benefit and alternative discussion not documented.');
  const labels = { 'informed-consent': 'Informed consent obtained (explicitly recorded)', surrogate: 'Surrogate consent obtained (explicitly recorded)', presumed: 'Presumed consent basis recorded; verify circumstances', declined: 'EVT declined (explicitly recorded)' };
  lines.push('Consent status: ' + (kit.evtConsentDiscussed === true && labels[kit.evtConsentType] ? labels[kit.evtConsentType] : 'not documented'));
  return lines.join('\n');
}

// GCS owner assessment aid: do not total an untestable component or impute one.
export function reviewedGcs(items = {}) {
  const eye = numericInput(items.eye, { min: 1, max: 4, integer: true });
  const verbal = numericInput(items.verbal, { min: 1, max: 5, integer: true });
  const motor = numericInput(items.motor, { min: 1, max: 6, integer: true });
  return [eye, verbal, motor].some(v => v === null) ? null : eye + verbal + motor;
}
export function gcsDocumentation(items = {}) {
  const total = reviewedGcs(items);
  return `GCS E${items.eye || '?'} V${items.verbal || '?'} M${items.motor || '?'}${total === null ? '; total not reported (incomplete or not testable)' : ` = ${total}/15`}${items.notTestableReason ? `; limitation: ${items.notTestableReason}` : ''}`;
}
export function reviewedAspects(regions = {}, assessed = false) {
  const keys = ['C','L','IC','I','M1','M2','M3','M4','M5','M6'];
  if (!assessed || keys.some(k => regions[k] !== undefined && typeof regions[k] !== 'boolean')) return null;
  return 10 - keys.filter(k => regions[k] === true).length;
}

export function reviewedPhq2(screen = {}) {
  const first = numericInput(screen.phq2_q1, { min: 0, max: 3, integer: true });
  const second = numericInput(screen.phq2_q2, { min: 0, max: 3, integer: true });
  return first === null || second === null ? null : first + second;
}
export function reviewedStopBang(screen = {}) {
  const keys = ['sb_snoring', 'sb_tired', 'sb_observed', 'sb_pressure', 'sb_bmi', 'sb_age', 'sb_neck', 'sb_gender'];
  if (screen.stopBangAssessed !== true || keys.some(key => screen[key] !== undefined && typeof screen[key] !== 'boolean')) return null;
  return keys.filter(key => screen[key] === true).length;
}
export function reviewedTiaDisposition(assessment = {}) {
  const danger = ['persistentDeficit', 'symptomaticCarotidSevere', 'suspectedCardioembolism', 'crescendoOrRecurrent', 'dwiPositive'];
  if (danger.some(key => assessment[key] === true)) return { status: 'urgent', text: 'Urgent stroke-team evaluation and disposition review: a high-risk feature is recorded. This checklist does not independently determine admission or discharge.' };
  if (assessment.assessmentReviewed !== true) return { status: 'incomplete', text: 'Disposition assessment incomplete. Unchecked criteria do not establish low risk; no outpatient clearance is generated.' };
  return { status: 'review', text: 'Risk-feature assessment recorded. Determine disposition using the complete clinical and vascular/cardiac evaluation, workup availability and reliable rapid follow-up; ABCD² alone cannot clear discharge.' };
}

export function gcsComponentsDocumented(items = {}) {
  return [['eye',4],['verbal',5],['motor',6]].every(([key,max]) => items[key] === 'NT' || numericInput(items[key],{min:1,max,integer:true}) !== null);
}
