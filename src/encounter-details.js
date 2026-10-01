// Optional encounter documentation, shared by the form and note formatter.
// These fields record clinician observations and plans; none determine care.
import { supplementaryResult, supplementaryReviewed } from './supplementary-calculators.js';

const choice = (key, label, options, extra = {}) => ({ key, label, type: 'select', options: options.map(option => Array.isArray(option) ? option : [option, option]), ...extra });
const text = (key, label, extra = {}) => ({ key, label, type: 'textarea', ...extra });
const number = (key, label, min, max, extra = {}) => ({ key, label, type: 'number', min, max, step: 1, ...extra });
const date = (key, label, extra = {}) => ({ key, label, type: 'date', ...extra });
const yesNo = (key, label, extra) => choice(key, label, [['yes', 'Yes'], ['no', 'No']], extra);
const status = (key, label, extra) => choice(key, label, ['Not indicated', 'Planned', 'Ordered', 'In progress', 'Completed', 'Declined', 'Deferred'], extra);
const diagnosis = (...values) => state => values.includes(state.note?.diagnosisCategory);
const acute = state => state.context === 'acute';
const followUp = state => state.context === 'follow-up';
const acuteIschemic = state => acute(state) && diagnosis('ischemic')(state);
const entered = key => state => hasValue(state.details?.[key]);
const is = (key, ...values) => state => values.includes(state.details?.[key]);
const and = (...conditions) => state => conditions.every(condition => condition(state));
const yes = key => is(key, 'yes');
const worksheetResult = (state, id) => supplementaryReviewed(state, id) ? supplementaryResult(state, id) : null;
const worksheet = (id, name) => ({ key: `${id}-worksheet`, type: 'worksheet', calculator: id, name, label: `Reviewed ${name} score` });
const mrsOptions = [
  ['0', '0 — No symptoms'], ['1', '1 — Symptoms without significant disability'],
  ['2', '2 — Slight disability; manages own affairs without assistance'],
  ['3', '3 — Some help required; walks without assistance'],
  ['4', '4 — Unable to walk or attend to bodily needs without assistance'],
  ['5', '5 — Bedbound; requires constant nursing care'], ['6', '6 — Death']
];

export const ENCOUNTER_DETAIL_GROUPS = [
  { id: 'context-details', section: 'context', title: 'Consultation & symptom course', fields: [
    choice('consultRole', 'Consultation requested by', ['Emergency clinician', 'Hospitalist', 'Neurologist', 'Intensivist', 'Advanced practice clinician', 'Other clinician']),
    choice('affectedSide', 'Affected side', ['Left', 'Right', 'Bilateral', 'Not lateralizing']),
    yesNo('weightEstimated', 'Weight estimated'),
    text('preIvtBP', 'Documented pre-IVT blood pressure', { when: acuteIschemic }),
    text('preIvtBPTime', 'Pre-IVT blood pressure measurement time', { when: acuteIschemic }),
    choice('symptomTrajectory', 'Symptom trajectory', ['Persistent', 'Improving', 'Resolved', 'Fluctuating', 'Progressive', 'Recurrent']),
    number('onsetNihss', 'Previously documented onset NIHSS', 0, 42, { when: acute }),
    text('onsetNihssSource', 'Onset NIHSS source / limitations', { when: and(acute, entered('onsetNihss')) }),
    choice('allergyReview', 'Allergy review', ['Reviewed — no known allergies', 'Reviewed — allergies documented', 'Unable to verify']),
    text('allergies', 'Allergies and reported reactions', { when: is('allergyReview', 'Reviewed — allergies documented', 'Unable to verify') }),
    yesNo('contrastAllergy', 'Prior iodinated contrast reaction'),
    text('contrastReaction', 'Contrast reaction / clinician plan', { when: yes('contrastAllergy') })
  ] },
  { id: 'phenotype', section: 'exam', title: 'Territory, phenotype & course', fields: [
    choice('strokeTerritory', 'Clinical territory', ['Anterior circulation', 'Posterior circulation', 'Multiple territories', 'Uncertain']),
    choice('strokePhenotype', 'Clinical phenotype', ['Cortical', 'Subcortical / lacunar', 'Brainstem', 'Cerebellar', 'Retinal', 'Mixed', 'Uncertain']),
    text('courseObservations', 'Interval examination / symptom course'),
    yesNo('seizureAtOnset', 'Seizure observed at onset', { when: acute }),
    text('seizureAtOnsetDetails', 'Observed seizure and recovery', { when: and(acute, yes('seizureAtOnset')) }),
    text('additionalImaging', 'Additional imaging findings / comparison')
  ] },
  { id: 'diagnosis-details', section: 'safety', title: 'Diagnosis-specific review & plans', when: diagnosis('ich', 'sah', 'cvt', 'tia', 'mimic', 'other'), fields: [
    choice('ichLocation', 'ICH location', ['Lobar', 'Deep', 'Brainstem', 'Cerebellar', 'Multiple', 'Uncertain'], { when: diagnosis('ich') }),
    yesNo('ichDeterioration', 'ICH clinical deterioration', { when: diagnosis('ich') }),
    yesNo('ichMassEffect', 'ICH mass effect / midline shift', { when: diagnosis('ich') }),
    yesNo('ichHydrocephalus', 'ICH hydrocephalus', { when: diagnosis('ich') }),
    text('ichBpPlan', 'ICH clinician BP plan', { when: diagnosis('ich') }),
    choice('ichReversalStatus', 'ICH reversal status', ['Not indicated', 'Under review', 'Planned', 'Administered', 'Deferred'], { when: diagnosis('ich') }),
    text('ichReversalDetails', 'Reversal agent / documented action / response', { when: and(diagnosis('ich'), entered('ichReversalStatus')) }),
    status('ichNeurosurgery', 'Neurosurgical review', { when: diagnosis('ich') }),
    text('ichSurgicalPlan', 'Neurosurgical findings / decision', { when: diagnosis('ich') }),
    yesNo('ichCaaFeatures', 'CAA features documented', { when: diagnosis('ich') }),
    text('ichAntithromboticPlan', 'Antithrombotic resumption decision / rationale', { when: diagnosis('ich') }),
    choice('sahCause', 'SAH suspected cause', ['Aneurysmal', 'Non-aneurysmal', 'Traumatic', 'Uncertain'], { when: diagnosis('sah') }),
    text('sahAneurysmLocation', 'Aneurysm location', { when: and(diagnosis('sah'), is('sahCause', 'Aneurysmal', 'Uncertain')) }),
    number('sahAneurysmSize', 'Aneurysm size (mm)', 0, undefined, { step: 'any', when: and(diagnosis('sah'), is('sahCause', 'Aneurysmal', 'Uncertain')) }),
    choice('sahSecuringStatus', 'Aneurysm securing status', ['Unsecured', 'Planned', 'Coiled', 'Clipped', 'Other treatment', 'No aneurysm identified'], { when: diagnosis('sah') }),
    yesNo('sahHydrocephalus', 'SAH hydrocephalus', { when: diagnosis('sah') }),
    choice('sahEvdStatus', 'External ventricular drain status', ['Not indicated', 'Under review', 'Planned', 'Placed', 'Removed'], { when: diagnosis('sah') }),
    choice('sahDciReview', 'Delayed cerebral ischemia assessment', ['Not suspected', 'Concern under evaluation', 'Diagnosed'], { when: diagnosis('sah') }),
    yesNo('sahSeizures', 'SAH seizures documented', { when: diagnosis('sah') }),
    text('sahPlan', 'SAH BP / surveillance / medication / neurosurgical plan', { when: diagnosis('sah') }),
    choice('cvtProvocation', 'CVT provoking context', ['Provoked', 'Unprovoked', 'Under evaluation'], { when: diagnosis('cvt') }),
    text('cvtProvokingFactors', 'CVT provoking factors / thrombophilia findings', { when: diagnosis('cvt') }),
    choice('cvtAnticoagPhase', 'CVT anticoagulation phase', ['Under review', 'Acute treatment', 'Transition', 'Maintenance', 'Completed', 'Held / deferred'], { when: diagnosis('cvt') }),
    text('cvtAnticoagPlan', 'CVT agent / duration / transition plan', { when: diagnosis('cvt') }),
    yesNo('cvtIcpConcern', 'CVT intracranial pressure concern', { when: diagnosis('cvt') }),
    yesNo('cvtSeizures', 'CVT seizures documented', { when: diagnosis('cvt') }),
    status('cvtHematology', 'Hematology review', { when: diagnosis('cvt') }),
    text('cvtAdditionalPlan', 'CVT pressure / seizure / specialty plan', { when: diagnosis('cvt') }),
    status('tiaMri', 'TIA MRI / DWI workup', { when: diagnosis('tia') }),
    status('tiaVascularImaging', 'TIA head / neck vascular imaging workup', { when: diagnosis('tia') }),
    status('tiaCardiacWorkup', 'TIA ECG / rhythm workup', { when: diagnosis('tia') }),
    yesNo('tiaDwiPositive', 'TIA presentation with DWI lesion', { when: diagnosis('tia') }),
    yesNo('tiaRecurrent', 'Crescendo or recurrent episodes', { when: diagnosis('tia') }),
    yesNo('tiaPersistentDeficit', 'Persistent deficit at reassessment', { when: diagnosis('tia') }),
    yesNo('tiaWorkupComplete', 'Same-day TIA workup complete', { when: diagnosis('tia') }),
    yesNo('tiaFollowupAccess', 'Prompt outpatient follow-up confirmed', { when: diagnosis('tia') }),
    text('tiaDispositionAssessment', 'TIA workup gaps / disposition assessment', { when: diagnosis('tia') }),
    choice('mimicDifferential', 'Alternative diagnosis under consideration', ['Seizure / postictal deficit', 'Migraine', 'Metabolic / toxic', 'Peripheral vestibular disorder', 'Functional neurologic disorder', 'Structural lesion', 'Infection', 'Other / uncertain'], { when: diagnosis('mimic', 'other') }),
    text('mimicEvidence', 'Findings supporting differential / unresolved concerns', { when: diagnosis('mimic', 'other') })
  ] },
  { id: 'etiology', section: 'safety', title: 'Etiology & diagnostic workup', when: diagnosis('ischemic', 'tia', 'cvt', 'other'), fields: [
    choice('toastClassification', 'Documented etiologic classification', ['Large artery atherosclerosis', 'Cardioembolism', 'Small vessel occlusion', 'Other determined cause', 'Undetermined cause'], { when: diagnosis('ischemic', 'tia') }),
    text('etiologyEvidence', 'Etiology evidence / uncertainty'),
    status('echoStatus', 'Echocardiography status'),
    choice('echoType', 'Echocardiography type', ['TTE', 'TTE with bubble study', 'TEE', 'TTE and TEE'], { when: entered('echoStatus') }),
    text('echoFindings', 'Echocardiography findings', { when: is('echoStatus', 'Completed') }),
    choice('rhythmMonitoring', 'Rhythm monitoring', ['Telemetry', 'External ambulatory monitor', 'Implantable monitor', 'Existing implanted device review', 'Not planned']),
    text('rhythmFindings', 'Rhythm findings / planned duration', { when: entered('rhythmMonitoring') }),
    yesNo('afDetected', 'Atrial fibrillation documented'),
    choice('pfoReview', 'PFO evaluation', ['Not indicated', 'Pending', 'Not identified', 'Identified — assessment pending', 'Assessed']),
    text('pfoFindings', 'PFO findings / clinician plan', { when: is('pfoReview', 'Identified — assessment pending', 'Assessed') }),
    choice('vascularEtiology', 'Vascular cause under review', ['Carotid stenosis', 'Intracranial stenosis', 'Dissection', 'Other arteriopathy', 'None identified', 'Uncertain']),
    text('vascularFindings', 'Vascular findings / revascularization or follow-up plan', { when: entered('vascularEtiology') }),
    text('etiologyPendingTests', 'Etiologic tests pending / responsible service')
  ] },
  { id: 'prevention', section: 'safety', title: 'Secondary prevention & medication review', when: diagnosis('ischemic', 'tia', 'ich', 'sah', 'cvt'), fields: [
    choice('antithromboticPlanType', 'Antithrombotic plan', ['Single antiplatelet', 'Dual antiplatelet', 'Anticoagulant', 'Combination under specialist review', 'Held / deferred', 'Not indicated', 'Undecided']),
    text('antithromboticPlan', 'Antithrombotic regimen / indication / rationale'),
    date('daptStartDate', 'Documented DAPT start date', { when: is('antithromboticPlanType', 'Dual antiplatelet') }),
    date('daptStopDate', 'Planned DAPT stop date', { when: is('antithromboticPlanType', 'Dual antiplatelet') }),
    text('daptTransition', 'Planned DAPT transition', { when: is('antithromboticPlanType', 'Dual antiplatelet') }),
    number('daptMissedDoses', 'Reported missed DAPT doses in 7 days', 0, undefined, { when: is('antithromboticPlanType', 'Dual antiplatelet') }),
    choice('medicationAdherence', 'Medication adherence review', ['No missed doses reported', 'Missed doses reported', 'Access / affordability barrier', 'Unable to assess']),
    text('adherencePlan', 'Adherence barriers / agreed plan', { when: entered('medicationAdherence') }),
    text('interactionReview', 'Medication interactions / reconciliation findings'),
    text('lipidPlan', 'Lipid results / clinician target / medication plan'),
    text('preventionBpPlan', 'Long-term BP target / medication plan'),
    text('diabetesPlan', 'Diabetes assessment / management plan'),
    choice('tobaccoStatus', 'Tobacco use', ['Never', 'Former', 'Current', 'Unable to assess']),
    text('tobaccoPlan', 'Tobacco cessation discussion / plan', { when: is('tobaccoStatus', 'Current', 'Former') }),
    text('lifestylePlan', 'Exercise / nutrition / alcohol / substance-use plan'),
    text('hormonalRiskReview', 'Hormonal therapy / reproductive risk discussion')
  ] },
  { id: 'supportive-care', section: 'safety', title: 'Supportive care & goals', when: acute, fields: [
    choice('swallowScreen', 'Swallow screen', ['Pending', 'Passed', 'Failed', 'Not testable', 'Not indicated']),
    status('slpAssessment', 'SLP assessment'),
    choice('nutritionRoute', 'Current nutrition route', ['Oral', 'NPO', 'Nasogastric / nasoenteric', 'Gastrostomy', 'Parenteral', 'Under review']),
    text('nutritionPlan', 'Swallow / nutrition plan'),
    choice('mobilityStatus', 'Mobilization status', ['Not assessed', 'Bed rest prescribed', 'Assisted mobilization', 'Independent mobilization', 'Deferred due to concern']),
    text('mobilityPlan', 'Mobilization / therapy plan'),
    choice('vtePrevention', 'VTE prevention status', ['Under review', 'Mechanical prophylaxis', 'Pharmacologic prophylaxis', 'Both', 'Held / deferred', 'Not indicated']),
    text('vtePlan', 'VTE prevention plan / rationale'),
    yesNo('feverConcern', 'Fever / infection concern'),
    text('feverPlan', 'Fever evaluation / management', { when: yes('feverConcern') }),
    yesNo('edemaConcern', 'Cerebral edema / pressure concern'),
    text('edemaPlan', 'Pressure / osmotic therapy / surgical coordination plan', { when: yes('edemaConcern') }),
    choice('goalsDiscussion', 'Goals-of-care discussion', ['Not yet discussed', 'Discussed', 'Deferred', 'Unable to obtain']),
    choice('codeStatus', 'Documented code status', ['Full code', 'DNR', 'DNI', 'DNR / DNI', 'Comfort-focused care', 'Other / needs clarification']),
    text('goalsOfCare', 'Goals / code status source / agreed plan', { when: state => entered('goalsDiscussion')(state) || entered('codeStatus')(state) }),
    status('palliativeReview', 'Palliative care review')
  ] },
  { id: 'special-context', section: 'safety', title: 'Special context & coordinated care', fields: [
    choice('specialContext', 'Additional care context', ['Pediatric', 'Pregnancy / postpartum', 'Active cancer', 'Sickle cell disease', 'Infective endocarditis', 'Multiple contexts', 'Other']),
    text('specialContextDetails', 'Relevant context / documented concerns', { when: entered('specialContext') }),
    status('pediatricNeurology', 'Pediatric neurology / center coordination', { when: is('specialContext', 'Pediatric', 'Multiple contexts') }),
    number('postpartumDays', 'Days postpartum, if applicable', 0, undefined, { when: is('specialContext', 'Pregnancy / postpartum', 'Multiple contexts') }),
    status('obstetricCoordination', 'Obstetric / maternal-fetal coordination', { when: is('specialContext', 'Pregnancy / postpartum', 'Multiple contexts') }),
    status('oncologyCoordination', 'Oncology / hematology coordination', { when: is('specialContext', 'Active cancer', 'Multiple contexts') }),
    status('sickleCellCoordination', 'Hematology / transfusion-service coordination', { when: is('specialContext', 'Sickle cell disease', 'Multiple contexts') }),
    status('endocarditisCoordination', 'Infectious disease / cardiology coordination', { when: is('specialContext', 'Infective endocarditis', 'Multiple contexts') }),
    text('specialContextPlan', 'Specialty findings / agreed plan', { when: entered('specialContext') })
  ] },
  { id: 'follow-up-review', section: 'safety', title: 'Follow-up: events, function & screening', when: followUp, fields: [
    yesNo('recurrentEvents', 'Recurrent neurologic events since discharge'),
    text('recurrentEventDetails', 'Recurrent events / evaluation', { when: yes('recurrentEvents') }),
    choice('dischargeMrs', 'Recorded discharge mRS', mrsOptions),
    choice('followupMrs', 'Current follow-up mRS', mrsOptions),
    choice('followupInterval', 'Follow-up assessment interval', ['30 days', '90 days', '6 months', '12 months', 'Other']),
    number('reviewedMoca', 'Reviewed MoCA score', 0, 30),
    worksheet('phq2', 'PHQ-2'),
    worksheet('stop-bang', 'STOP-BANG'),
    text('screeningContext', 'Screening source / limitations / follow-up plan', { when: state => entered('reviewedMoca')(state) || ['phq2', 'stop-bang'].some(id => worksheetResult(state, id) !== null) }),
    yesNo('followupSeizures', 'Interval seizures'),
    text('followupSeizurePlan', 'Seizure events / management plan', { when: yes('followupSeizures') }),
    yesNo('followupFatigue', 'Fatigue reported'),
    yesNo('followupPain', 'Post-stroke pain reported'),
    yesNo('followupSpasticity', 'Spasticity reported'),
    yesNo('followupFalls', 'Falls / balance concern'),
    text('recoverySymptomsPlan', 'Recovery symptoms / assessment / management', { when: state => ['followupFatigue', 'followupPain', 'followupSpasticity', 'followupFalls'].some(key => yes(key)(state)) })
  ] },
  { id: 'participation', section: 'safety', title: 'Recovery, rehabilitation & participation', when: followUp, fields: [
    status('ptReferral', 'Physical therapy'),
    status('otReferral', 'Occupational therapy'),
    status('slpReferral', 'Speech / language therapy'),
    text('rehabGoals', 'Rehabilitation goals / equipment / access barriers'),
    yesNo('drivingConcern', 'Driving assessment / counseling needed'),
    text('drivingPlan', 'Documented driving discussion / assessment plan', { when: yes('drivingConcern') }),
    yesNo('workConcern', 'Return-to-work concern'),
    text('returnToWorkPlan', 'Work barriers / vocational rehabilitation / agreed plan', { when: yes('workConcern') }),
    yesNo('caregiverConcern', 'Caregiver support needs'),
    text('caregiverPlan', 'Caregiver needs / support plan', { when: yes('caregiverConcern') }),
    text('participationConcerns', 'Travel / sexual health / other participation concerns'),
    text('followupAppointments', 'Appointments / follow-up access / responsible services')
  ] },
  { id: 'transfer', section: 'handoff', title: 'Transfer & communication', when: acute, fields: [
    choice('transferStatus', 'Transfer coordination status', ['Not needed', 'Under discussion', 'Requested', 'Accepted', 'Awaiting transport', 'Departed', 'Arrived', 'Canceled']),
    text('transferDestination', 'Receiving facility / service', { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    yesNo('transferAcceptance', 'Receiving service acceptance documented', { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    choice('transportMode', 'Transport mode', ['Ground', 'Air', 'Other'], { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    text('transportEta', 'Transport ETA / outstanding barriers', { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    yesNo('imagingShared', 'Imaging shared with receiving service', { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    yesNo('recordsShared', 'Clinical records shared with receiving service', { when: state => entered('transferStatus')(state) && !is('transferStatus', 'Not needed')(state) }),
    choice('familyCommunication', 'Family / support-person communication', ['Not yet completed', 'Completed', 'Unable to reach', 'Declined']),
    text('familyDiscussionTopics', 'Topics discussed / questions / next contact plan', { when: entered('familyCommunication') })
  ] },
  { id: 'post-reperfusion', section: 'handoff', title: 'Post-reperfusion observations & procedure', when: acuteIschemic, fields: [
    choice('reperfusionReview', 'Post-treatment review', ['After IV thrombolysis', 'After EVT', 'After IV thrombolysis and EVT']),
    text('postReperfusionExam', 'Post-treatment examination / observations', { when: entered('reperfusionReview') }),
    text('postReperfusionBp', 'Documented post-treatment BP plan', { when: entered('reperfusionReview') }),
    status('postReperfusionImaging', 'Post-treatment imaging', { when: entered('reperfusionReview') }),
    choice('evtAccess', 'EVT access site', ['Right femoral', 'Left femoral', 'Right radial', 'Left radial', 'Other'], { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    text('evtDevice', 'Recorded EVT device', { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    choice('evtTechnique', 'Recorded EVT technique', ['Aspiration', 'Stent retriever', 'Combined', 'Angioplasty / stenting', 'Other'], { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    text('procedureTeamRoles', 'Documented procedure team roles', { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    number('evtPasses', 'Recorded EVT passes', 0, undefined, { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    text('evtAccessObservations', 'Access-site / distal pulse observations', { when: is('reperfusionReview', 'After EVT', 'After IV thrombolysis and EVT') }),
    choice('hemorrhagicTransformation', 'Post-treatment hemorrhagic transformation review', ['Not identified', 'Under evaluation', 'HI1', 'HI2', 'PH1', 'PH2', 'Other hemorrhage'], { when: entered('reperfusionReview') }),
    yesNo('postTreatmentAngioedema', 'Post-treatment angioedema observed', { when: is('reperfusionReview', 'After IV thrombolysis', 'After IV thrombolysis and EVT') }),
    text('complicationObservations', 'Complications / documented actions / response', { when: entered('reperfusionReview') })
  ] },
  { id: 'discharge-continuity', section: 'handoff', title: 'Discharge & continuity of care', fields: [
    choice('dischargeReview', 'Discharge / transition review', ['Planning', 'Completed', 'Follow-up reconciliation']),
    date('admissionDate', 'Actual admission date', { actual: true, when: entered('dischargeReview') }),
    date('dischargeDate', 'Actual discharge date', { actual: true, after: 'admissionDate', when: entered('dischargeReview') }),
    text('hospitalCourse', 'Hospital course / interval care summary', { when: entered('dischargeReview') }),
    choice('medicationReconciliation', 'Medication reconciliation', ['Pending', 'Completed', 'Discrepancies require review'], { when: entered('dischargeReview') }),
    text('dischargeMedicationChanges', 'Medication changes / unresolved discrepancies', { when: entered('dischargeReview') }),
    text('dischargePendingTests', 'Pending results / owner / review plan', { when: entered('dischargeReview') }),
    text('dischargeFollowup', 'Follow-up services / timing / appointment status', { when: entered('dischargeReview') }),
    choice('educationStatus', 'Patient / caregiver education', ['Pending', 'Completed', 'Declined', 'Unable to complete'], { when: entered('dischargeReview') }),
    text('educationTopics', 'Education topics / understanding / return precautions discussed', { when: and(entered('dischargeReview'), entered('educationStatus')) })
  ] }
];

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function getEncounterDetailGroups(state, section) {
  return ENCOUNTER_DETAIL_GROUPS.filter(group => (!section || group.section === section) && (!group.when || group.when(state)))
    .map(group => ({ ...group, fields: group.fields.filter(field => !field.when || field.when(state))
      .map(field => field.type === 'worksheet' ? { ...field, result: worksheetResult(state, field.calculator) } : field) }));
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function formatField(field, value, values, now) {
  const source = String(value).trim();
  if (field.type === 'select') {
    const option = field.options.find(([key]) => String(key) === source);
    return option ? option[1] : `${source} (unrecognized selection; review)`;
  }
  if (field.type === 'number') {
    const numeric = Number(source);
    const valid = Number.isFinite(numeric) && numeric >= field.min && (field.max === undefined || numeric <= field.max) && (field.step === 'any' || Number.isInteger(numeric));
    return valid ? source : `${source} (invalid value; review)`;
  }
  if (field.type === 'date') {
    if (!validDate(source)) return `${source} (invalid date; review)`;
    const todayDate = new Date(now), pad = v => String(v).padStart(2, '0');
    const today = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;
    if (field.actual && source > today) return `${source} (future actual-event date; review)`;
    if (field.after && validDate(values[field.after]) && source < values[field.after]) return `${source} (precedes admission; review)`;
  }
  return source;
}

export function formatEncounterDetails(state, now = Date.now()) {
  const values = state.details || {};
  return getEncounterDetailGroups(state).map(group => ({
    id: group.id,
    title: group.title,
    lines: group.fields.flatMap(field => {
      if (field.type === 'worksheet') return field.result ? [`${field.label}: ${field.result.score}/${field.result.max}`] : [];
      return hasValue(values[field.key]) ? [`${field.label}: ${formatField(field, values[field.key], values, now)}`] : [];
    })
  })).filter(group => group.lines.length);
}

// Scan retained hidden entries too, including fields not recognized by the UI.
// Only genuine calendar dates in known date fields bypass the text scan.
export function encounterDetailWarnings(state, scanFn) {
  const fields = new Map(ENCOUNTER_DETAIL_GROUPS.flatMap(group => group.fields.map(field => [field.key, field])));
  const texts = [];
  const collect = value => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    else if (hasValue(value)) texts.push(String(value));
  };
  for (const [key, value] of Object.entries(state.details || {})) {
    if (fields.get(key)?.type === 'date' && validDate(value)) continue;
    collect(value);
  }
  return [...new Set(texts.flatMap(scanFn))];
}
