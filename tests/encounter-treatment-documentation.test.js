import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as treatment from '../src/encounter-decision-status.js';
import * as reviewed from '../src/encounter-clinical-review.js';
import { isSuccessfulEvtReperfusion } from '../src/institutional-protocols.js';
import { calculateCrClReviewed, calculateTNKDoseReviewed } from '../src/calculators.js';
import { getClinicalClaim } from '../src/clinical/claim-registry.js';
import { buildTnkConsentDocumentation } from '../src/clinical/consent-documentation.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { formatEncounterClock as formatTime } from '../src/clinical/encounter-time.js';
import { formatPerfusionForExport } from '../src/clinical/perfusion-documentation.js';
import GeneratedNoteDraft from '../src/components/GeneratedNoteDraft.jsx';

const appSource = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const templateStart = appSource.indexOf('const defaultTelestrokeTemplate = `') + 'const defaultTelestrokeTemplate = '.length;
const templateEnd = appSource.indexOf('`;', templateStart) + 1;
const defaultTemplate = new Function('return ' + appSource.slice(templateStart, templateEnd))();

// Exercise the authored output functions while supplying their unrelated
// presentation/calculator dependencies. No copied implementation of the output.
function outputFunction(name, note, extra = {}) {
  const start = appSource.indexOf(`const ${name} = () => {`);
  if (start < 0) throw new Error(`Missing output function ${name}`);
  const indent = appSource.slice(appSource.lastIndexOf('\n', start) + 1, start);
  const end = appSource.indexOf(`\n${indent}};`, start);
  if (end < 0) throw new Error(`Unterminated output function ${name}`);
  const context = {
    ...treatment, ...reviewed, isSuccessfulEvtReperfusion, calculateCrClReviewed, calculateTNKDoseReviewed, getClinicalClaim, buildTnkConsentDocumentation, formatWakeUpScreenForExport, formatTime, formatPerfusionForExport, telestrokeNote: note, nihssScore: 0, aspectsScore: '', lkwTime: null,
    isValidAspectsScore: () => false, calculateICHScore: () => 0,
    calculateGCS: () => 15, calculateTNKDose: () => ({ calculatedDose: 15 }),
    ichScoreItems: {}, gcsItems: {}, ANTICOAGULANT_INFO: {}, TOAST_LABELS: {},
    consultationType: 'telephone', getIchEscalationSummary: () => '',
    getDaptAdherenceSummary: () => '', getAis2026DeltaSummary: () => '',
    getSahOutcomeSummary: () => '', getPathwayForDiagnosis: () => 'ischemic',
    getDocumentedNihss: () => treatment.documentedNihssValue(note, 0, false),
    getDocumentedDischargeNihss: () => reviewed.numericInput(note.dischargeNIHSS, { min: 0, max: 42, integer: true }),
    mrsScore: 0, pcAspectsRegions: [], calculatePCAspects: () => 0, bpPhaseTargets: {},
    formatBpPhaseTarget: () => '', formatReviewedBpPhaseTarget: () => '', PUBLIC_DEMO_MODE: true,
    getPostEvtBpPlanSummary: () => '', getPediatricStrokeSummary: () => '',
    getMaternalStrokeSummary: () => '', getCancerStrokeSummary: () => '',
    getWakeUpCriteriaTrace: () => ({ wake: {} }), getWakeUpEligibilityForNote: () => ({}),
    formatDTNForNote: () => '', getCvtSpecialPopulationNoteLines: () => [],
    getCvtSpecialPopulationPlan: () => ({}),
    editableTemplate: defaultTemplate,
    buildContraindicationTrace: () => '',
    ...extra
  };
  return new Function(...Object.keys(context),
    appSource.slice(start, end + indent.length + 4) + `\nreturn ${name}();`
  )(...Object.values(context));
}

const undecided = {
  diagnosisCategory: 'ischemic', tnkRecommended: false, evtRecommended: false,
  tnkDecisionRecorded: false, evtDecisionRecorded: false
};
const declined = {
  ...undecided, ...treatment.treatmentDecisionFields('tnk', false),
  ...treatment.treatmentDecisionFields('evt', false)
};

const legacyDefaultAttestations = 'After ensuring that there were no evident contraindications, TNK administration was recommended at {tnkAdminTime}. Potential benefits, potential risks (including a potential risk of sx ICH of up to 4%), and alternatives to treatment were discussed with the patient, family/LNOK, and OSH provider.\nTNK was administered at {tnkAdminTime} after a brief time-out.\n';

describe.each([
  ['follow-up brief', 'generateFollowUpBrief', null],
  ...['consult', 'transfer', 'discharge'].map(template => [template, 'generateTelestrokeNoteBody', template])
])('authored CTP measurements in %s', (_surface, functionName, noteTemplate) => {
  it.each([
    ['zero core with 1 mL total volume', '0', '1', 'Calculated mismatch volume: 1 mL', 'zero'],
    ['zero core with 20 mL total volume', '0', '20', 'Calculated mismatch volume: 20 mL', 'zero'],
    ['numeric zero core', 0, 20, 'Calculated mismatch volume: 20 mL', 'zero'],
    ['negative core', '-1', '20', 'Core: invalid measurement; review required', 'invalid'],
    ['conflicting volumes', '20', '10', 'Perfusion volumes conflict: total hypoperfused volume is below core; reconcile measurements', 'conflict'],
    ['ordinary measurements', '10', '30', 'Mismatch ratio: 3.00; arithmetic does not establish eligibility', 'normal'],
    ['null measurements', null, null, null, 'missing'],
    ['blank measurements', '', '', null, 'missing']
  ])('preserves the entered impression and describes %s accurately', (_label, coreVolume, penumbraVolume, expected, category) => {
    const ctpResults = 'CTP radiology impression: motion-limited study; clinician review pending.';
    const note = { ...declined, ctpStructured: { coreVolume, penumbraVolume }, ctpResults };
    const output = outputFunction(functionName, note, { noteTemplate });
    expect(output).not.toContain('Error generating note');
    expect(output).toContain(ctpResults);
    expect(output.split(ctpResults)).toHaveLength(2);
    expect(output).not.toMatch(/Mismatch ratio: Favorable|Infinity/);
    if (expected) expect(output).toContain(expected);
    if (category === 'zero') expect(output).toContain('Mismatch ratio: not calculable (core 0); review volumes and complete eligibility');
    if (['invalid', 'conflict', 'missing'].includes(category)) {
      expect(output).not.toContain('Calculated mismatch volume:');
      expect(output).not.toContain('Mismatch ratio:');
    }
    if (category === 'missing') {
      expect(output).not.toContain('Core: 0 mL');
      expect(output).not.toContain('Total hypoperfused volume (Tmax >6 s): 0 mL');
    }
  });
});

describe('authored wake-up documentation across export surfaces', () => {
  const now = new Date('2026-10-01T12:00:00');
  const workflow = {
    isWakeUpStroke: true, mriAvailable: true, ageEligible: false, nihssEligible: false,
    dwi: { positiveForLesion: true, lesionVolume: '14.5' }, flair: { noMarkedHyperintensity: true },
    mriLesionExtentReviewed: true
  };
  const mri = {
    ...declined, age: '60', nihss: '10', ctHemorrhageStatus: 'absent', lkwUnknown: true,
    discoveryDate: '2026-10-01', discoveryTime: '10:00', wakeUpStrokeWorkflow: workflow
  };
  const ctp = {
    ...mri, coreVolume: '20', penumbraVolume: '50', premorbidMRS: '0',
    wakeUpStrokeWorkflow: { ...workflow, mriAvailable: false, sleepMidpoint: '2026-10-01T06:00' }
  };
  const cases = [
    ['legacy four checks with missing recognition and lesion review', {
      ...mri, discoveryDate: '', discoveryTime: '', wakeUpStrokeWorkflow: { ...workflow, ageEligible: true, nihssEligible: true, mriLesionExtentReviewed: false }
    }, 'MRI (WAKE-UP)', false],
    ['met MRI with unchecked legacy age and NIHSS boxes', mri, 'MRI (WAKE-UP)', true],
    ['measured age outside MRI source screen despite checked legacy box', {
      ...mri, age: '81', wakeUpStrokeWorkflow: { ...workflow, ageEligible: true }
    }, 'MRI (WAKE-UP)', false],
    ['unconfirmed MRI observations', {
      ...mri, wakeUpStrokeWorkflow: { ...workflow, dwi: { positiveForLesion: false }, flair: { noMarkedHyperintensity: false } }
    }, 'MRI (WAKE-UP)', false],
    ['met CTP source screen', ctp, 'CTP (EXTEND)', true],
    ['selected CTP incomplete even though MRI source screen is met', {
      ...mri, wakeUpStrokeWorkflow: { ...workflow, mriAvailable: false }
    }, 'CTP (EXTEND)', false],
    ['selected MRI incomplete even though CTP source screen is met', {
      ...ctp, discoveryTime: '', wakeUpStrokeWorkflow: { ...ctp.wakeUpStrokeWorkflow, mriAvailable: true }
    }, 'MRI (WAKE-UP)', false],
    ['no selected pathway despite both source screens being met', {
      ...ctp, wakeUpStrokeWorkflow: { ...ctp.wakeUpStrokeWorkflow, mriAvailable: null }
    }, 'pathway not documented', false]
  ];
  describe.each([
    ['follow-up brief', 'generateFollowUpBrief', null],
    ['Pulsara summary', 'generatePulsaraSummary', null],
    ...['consult', 'transfer', 'signout', 'progress', 'discharge'].map(template => [template, 'generateTelestrokeNoteBody', template])
  ])('%s', (surface, functionName, noteTemplate) => {
    it.each(cases)('keeps the canonical status for %s', (_label, note, pathway, met) => {
      const output = outputFunction(functionName, note, {
        noteTemplate,
        formatWakeUpScreenForExport: current => formatWakeUpScreenForExport(current, now)
      });
      expect(output).not.toContain('Error generating note');
      expect(output).toContain(`${pathway}: ${met ? 'partial source screen met' : 'incomplete or not met'}; complete eligibility and drug-specific treatment decision require review.`);
      expect(output).not.toMatch(/WAKE-UP eligible|Met WAKE-UP criteria|Met WAKE-UP trial criteria|IV thrombolysis eligible|Age: Eligible/);
      expect(output).not.toMatch(/DWI: Negative|DWI -|DWI -\/FLAIR|FLAIR hyperintense|FLAIR \+/);
      if (surface === 'discharge') {
        expect(output).toContain('ACUTE TREATMENT:');
        expect(output).toContain(`TNK: ${treatment.treatmentCourseStatus(note, 'tnk')}`);
        expect(output).toContain(`EVT: ${treatment.treatmentCourseStatus(note, 'evt')}`);
      }
      if (surface !== 'Pulsara summary') {
        expect(output).toContain(`Documented age: ${note.age}; NIHSS: ${note.nihss}.`);
        if (note.wakeUpStrokeWorkflow.mriAvailable === true) {
          const confirmed = note.wakeUpStrokeWorkflow.dwi.positiveForLesion === true;
          expect(output).toContain(`DWI-positive lesion: ${confirmed ? 'documented' : 'not documented'}.`);
          if (note.wakeUpStrokeWorkflow.dwi.lesionVolume) expect(output).toContain('Recorded MRI lesion volume: 14.5 mL.');
        }
      }
    });
  });
});

describe('recorded treatment state', () => {
  it('distinguishes legacy positive, explicit negative, and undocumented decisions', () => {
    expect(treatment.recordedTreatmentDecision({ tnkRecommended: true }, 'tnk')).toBe(true);
    expect(treatment.recordedTreatmentDecision({ tnkRecommended: false }, 'tnk')).toBe(null);
    expect(treatment.recordedTreatmentDecision({ tnkDecisionRecorded: true }, 'tnk')).toBe(null);
    expect(treatment.recordedTreatmentDecision(declined, 'tnk')).toBe(false);
  });
  it('invalidates a previously positive or negative decision without inventing its opposite', () => {
    for (const decision of [true, false]) {
      const prior = { ...undecided, ...treatment.treatmentDecisionFields('tnk', decision) };
      const cleared = { ...prior, ...treatment.treatmentDecisionFields('tnk') };
      expect(treatment.recordedTreatmentDecision(cleared, 'tnk')).toBe(null);
      expect(treatment.treatmentCourseStatus(cleared, 'tnk')).toBe('Decision not documented');
      const blocked = { ...cleared, tnkAutoBlocked: true };
      expect(treatment.treatmentCourseStatus(blocked, 'tnk')).toContain('recorded contraindication');
      expect(treatment.treatmentCourseStatus({ ...blocked, tnkAutoBlocked: false }, 'tnk')).toBe('Decision not documented');
    }
  });
  it('requires an administration timestamp rather than a recommendation or consent', () => {
    const planned = { ...undecided, ...treatment.treatmentDecisionFields('tnk', true), tnkConsentDiscussed: true };
    expect(treatment.hasRecordedTreatmentAdministration(planned, 'tnk')).toBe(false);
    expect(treatment.treatmentCourseStatus(planned, 'tnk')).toBe('Recommended; administration not documented');
    for (const key of ['tnkAdminTime', 'needleTime', 'dtnTnkAdministered']) {
      const time = key === 'dtnTnkAdministered' ? '2026-09-06T15:30:00Z' : '15:30';
      expect(treatment.treatmentCourseStatus({ ...planned, [key]: time }, 'tnk')).toBe(`Administration recorded at ${time}`);
    }
    for (const time of ['', '   ', 'unknown', '25:70', true]) {
      expect(treatment.hasRecordedTreatmentAdministration({ tnkAdminTime: time }, 'tnk')).toBe(false);
    }
  });
  it('retains reported administration when a decision is cleared or diagnosis changes', () => {
    const note = { ...undecided, diagnosisCategory: 'ich', tnkAdminTime: '13:40' };
    expect(treatment.treatmentCourseStatus(note, 'tnk')).toBe('Administration recorded at 13:40');
  });
  it('separates EVT planning, puncture, and recorded reperfusion', () => {
    const planned = { evtRecommended: true, evtAccessSite: 'femoral', evtDevice: 'aspiration', ticiScore: '2b' };
    expect(treatment.hasRecordedTreatmentAdministration(planned, 'evt')).toBe(false);
    expect(treatment.treatmentCourseStatus(planned, 'evt')).toContain('completion not documented');
    const started = { ...planned, punctureTime: '14:10' };
    expect(treatment.hasRecordedTreatmentAdministration(started, 'evt')).toBe(false);
    expect(treatment.treatmentCourseStatus(started, 'evt')).toContain('Puncture recorded at 14:10');
    expect(treatment.hasRecordedTreatmentAdministration({ ...started, reperfusionTime: '14:40' }, 'evt')).toBe(true);
  });
  it('preserves explicit NIHSS zero and does not promote the default calculated zero', () => {
    expect(treatment.documentedNihssValue({}, 0, false)).toBe('');
    expect(treatment.documentedNihssValue({ nihss: '' }, 0, false)).toBe('');
    expect(treatment.documentedNihssValue({ nihss: 0 }, 0, false)).toBe('0');
    expect(treatment.documentedNihssValue({ nihss: '0' }, 0, false)).toBe('0');
    expect(treatment.documentedNihssValue({}, 0, true)).toBe('0');
    expect(treatment.documentedNihssValue({ nihss: '43' }, 0, false)).toBe('');
  });
});

describe('authored encounter exports', () => {
  const tnkSafetyChecks = note => Object.fromEntries(
    outputFunction('getSafetyChecks', note, { getReferenceTime: () => null })
      .filter(check => ['weight', 'tnkChecklist', 'consent'].includes(check.id))
      .map(check => [check.id, check.complete])
  );
  it('keeps TNK safety checks pending while the treatment decision is undocumented', () => {
    const pending = { weight: false, tnkChecklist: false, consent: false };
    expect(tnkSafetyChecks(undecided)).toEqual(pending);
    expect(tnkSafetyChecks({ ...undecided, weight: '70', tnkContraindicationReviewed: true, tnkConsentDiscussed: true })).toEqual(pending);
  });
  it('marks TNK-specific safety requirements not required after an explicit negative or automatic contraindication block', () => {
    const notRequired = { weight: true, tnkChecklist: true, consent: true };
    expect(tnkSafetyChecks(declined)).toEqual(notRequired);
    expect(tnkSafetyChecks({ ...undecided, tnkAutoBlocked: true })).toEqual(notRequired);
  });
  it('requires the actual weight, review, and consent fields for recommended TNK', () => {
    const planned = { ...undecided, ...treatment.treatmentDecisionFields('tnk', true) };
    expect(tnkSafetyChecks(planned)).toEqual({ weight: false, tnkChecklist: false, consent: false });
    expect(tnkSafetyChecks({ ...planned, weight: '70', tnkContraindicationReviewed: true })).toEqual({ weight: true, tnkChecklist: true, consent: false });
    expect(tnkSafetyChecks({ ...planned, weight: '70', tnkContraindicationReviewed: true, tnkConsentDiscussed: true })).toEqual({ weight: true, tnkChecklist: true, consent: true });
  });
  it('retains TNK documentation requirements after recorded administration even if the recommendation was cleared or blocked', () => {
    for (const key of ['tnkAdminTime', 'needleTime', 'dtnTnkAdministered']) {
      const administered = { ...declined, tnkAutoBlocked: true, [key]: key === 'dtnTnkAdministered' ? '2026-09-06T15:30:00Z' : '15:30' };
      expect(tnkSafetyChecks(administered)).toEqual({ weight: false, tnkChecklist: false, consent: false });
      expect(tnkSafetyChecks({ ...administered, weight: '70', tnkContraindicationReviewed: true, tnkConsentDiscussed: true })).toEqual({ weight: true, tnkChecklist: true, consent: true });
    }
  });
  it('keeps undecided clipboard, smart-note, and follow-up output unknown', () => {
    const clipboard = outputFunction('buildEncounterTemplateContext', undecided);
    expect(clipboard.TNK_STATUS).toBe('Decision not documented');
    expect(clipboard.EVT_STATUS).toBe('Decision not documented');
    for (const name of ['buildSmartNote', 'generateFollowUpBrief']) {
      const output = outputFunction(name, undecided);
      expect(output).toContain('TNK: Decision not documented');
      expect(output).toContain('EVT: Decision not documented');
      expect(output).not.toMatch(/medical management|not recommended based on current eligibility/i);
    }
  });
  it('does not turn recommendations into administered treatment or activated transfer', () => {
    const planned = { ...undecided, ...treatment.treatmentDecisionFields('tnk', true), ...treatment.treatmentDecisionFields('evt', true) };
    for (const name of ['buildSmartNote', 'generateFollowUpBrief']) {
      const output = outputFunction(name, planned);
      expect(output).toContain('Recommended; administration not documented');
      expect(output).toContain('Recommended; procedure completion not documented');
      expect(output).not.toMatch(/TNK.*administered|recommended\/performed|activation initiated/);
    }
  });
  it('reports administration recorded in the independent timeline', () => {
    const note = { ...declined, dtnTnkAdministered: '2026-09-06T15:30:00Z' };
    expect(outputFunction('generateFollowUpBrief', note)).toContain('TNK: Administration recorded at 2026-09-06T15:30:00Z');
    expect(outputFunction('buildEncounterTemplateContext', note).TNK_STATUS).toContain('Administration recorded');
  });
  it('does not choose admission orders from undocumented or merely planned treatment', () => {
    for (const note of [undecided, { ...declined, ...treatment.treatmentDecisionFields('tnk', true) }]) {
      const output = outputFunction('generateAdmissionOrders', note);
      expect(output).toContain('ADMISSION ORDER DRAFT INCOMPLETE');
      expect(output).not.toContain('Aspirin 325mg');
      expect(output).not.toContain('POST-TNK');
    }
    const noReperfusion = outputFunction('generateAdmissionOrders', declined);
    expect(noReperfusion).toContain('ACUTE STROKE ADMISSION ORDERS:');
    expect(noReperfusion).not.toContain('(POST-TNK)');
    const administered = outputFunction('generateAdmissionOrders', { ...declined, tnkAdminTime: '15:30' });
    expect(administered).toContain('(POST-TNK)');
    expect(administered).toContain('administration recorded; verify administered dose');
    expect(administered).not.toMatch(/mg given/);
  });
  it('keeps nursing parameters incomplete when either treatment course is undocumented or only recommended', () => {
    for (const note of [undecided, { ...declined, ...treatment.treatmentDecisionFields('tnk', true) }, { ...declined, ...treatment.treatmentDecisionFields('evt', true) }]) {
      const bundle = outputFunction('getOrderBundles', note).find(item => item.id === 'nursing-params');
      expect(bundle.label).toContain('Incomplete');
      expect(bundle.orders.join('\n')).toContain('NURSING PARAMETER DRAFT INCOMPLETE');
      expect(bundle.orders.join('\n')).not.toMatch(/BP target:|Start enoxaparin|q15min|Bedrest/);
    }
  });
  it('uses all recorded TNK administration times for the existing nursing parameters', () => {
    for (const key of ['tnkAdminTime', 'needleTime', 'dtnTnkAdministered']) {
      const note = { ...declined, [key]: key === 'dtnTnkAdministered' ? '2026-09-06T15:30:00Z' : '15:30' };
      const orders = outputFunction('getOrderBundles', note).find(item => item.id === 'nursing-params').orders.join('\n');
      expect(orders).toContain('BP target: SBP <180/105 x 24h post-lytic');
      expect(orders).toContain('Neuro checks: q15min x 2h, q30min x 6h, q1h x 16h');
      expect(orders).toContain('Hold SQ heparin 24h post-TNK');
      expect(orders).not.toContain('Start enoxaparin');
    }
  });
  it('preserves the existing documented-negative and completed-EVT nursing branches', () => {
    const untreated = outputFunction('getOrderBundles', declined).find(item => item.id === 'nursing-params');
    expect(untreated.label).toBe('Nursing Parameters Sheet');
    expect(untreated.orders).toContain('BP target: SBP <220 (permissive HTN)');
    expect(untreated.orders.join('\n')).toContain('Start enoxaparin 40mg SC daily if immobile');
    const completed = outputFunction('getOrderBundles', { ...declined, reperfusionTime: '15:50' }).find(item => item.id === 'nursing-params');
    expect(completed.orders).toContain('BP target: SBP <180, avoid <140 post-EVT');
  });
  it('does not describe an undocumented or completed EVT course as not pursued in LVO warnings', () => {
    const lvo = { ...undecided, vesselOcclusion: ['M1'] };
    const warningsFor = note => outputFunction('getSanityChecks', note, { calculateCrCl: () => null, calculateTimeFromLKW: () => null }).filter(warning => warning.id === 'lvo-no-evt');
    expect(warningsFor(lvo)).toEqual([]);
    const explicitlyDeclined = { ...lvo, ...treatment.treatmentDecisionFields('evt', false) };
    expect(warningsFor(explicitlyDeclined).length).toBeGreaterThan(0);
    expect(warningsFor({ ...explicitlyDeclined, reperfusionTime: '15:50' })).toEqual([]);
    expect(warningsFor({ ...lvo, ...treatment.treatmentDecisionFields('evt', true) })).toEqual([]);
  });
  it('keeps blank and explicit-zero NIHSS distinct in copied templates and histories', () => {
    expect(outputFunction('buildEncounterTemplateContext', undecided).NIHSS).toBe('');
    expect(outputFunction('buildEncounterTemplateContext', { ...undecided, nihss: 0 }).NIHSS).toBe('0');
    expect(outputFunction('buildSmartNote', undecided)).toContain('NIHSS unknown');
    expect(outputFunction('buildSmartNote', { ...undecided, nihss: 0 })).toContain('NIHSS 0');
  });
  it.each(['transfer', 'signout', 'discharge'])('keeps undocumented decisions unknown in the actual %s template', (noteTemplate) => {
    const output = outputFunction('generateTelestrokeNoteBody', undecided, { noteTemplate });
    expect(output).not.toContain('Error generating note');
    expect(output).toContain('TNK: Decision not documented');
    expect(output).toContain('EVT: Decision not documented');
    expect(output).not.toMatch(/- Medical management/);
  });
  it.each(['transfer', 'signout', 'procedure', 'discharge'])('does not fabricate administered TNK in the actual %s template', (noteTemplate) => {
    const note = { ...declined, ...treatment.treatmentDecisionFields('tnk', true) };
    const output = outputFunction('generateTelestrokeNoteBody', note, { noteTemplate });
    expect(output).not.toContain('Error generating note');
    expect(output).toContain('Recommended; administration not documented');
    expect(output).not.toMatch(/TNK[^\n]*administered at/);
  });
  it('removes the default consult administration narrative until administration is recorded', () => {
    const note = { ...declined, ...treatment.treatmentDecisionFields('tnk', true) };
    const output = outputFunction('generateTelestrokeNoteBody', note, { noteTemplate: 'consult' });
    expect(output).not.toContain('Error generating note');
    expect(output).toContain('TNK: Recommended; administration not documented');
    expect(output).not.toContain('TNK was administered');
  });
  it('does not describe planned EVT as received in patient education', () => {
    const note = { ...undecided, ...treatment.treatmentDecisionFields('evt', true) };
    const output = outputFunction('generateTelestrokeNoteBody', note, { noteTemplate: 'patient-ed' });
    expect(output).not.toContain('Error generating note');
    expect(output).not.toContain('a catheter-based procedure to remove the blood clot');
  });

  it.each(['consult', 'transfer', 'signout', 'procedure'])('does not infer consent, review, or a time-out from TNK administration in %s', (noteTemplate) => {
    for (const key of ['tnkAdminTime', 'needleTime', 'dtnTnkAdministered']) {
      const administered = {
        ...declined,
        [key]: key === 'dtnTnkAdministered' ? '2026-10-01T13:40:00Z' : '13:40'
      };
      const output = outputFunction('generateTelestrokeNoteBody', administered, { noteTemplate });
      expect(output).not.toContain('Error generating note');
      expect(output).toContain('Administration recorded at');
      expect(output).not.toMatch(/consent (?:obtained|recorded)|discussion recorded|risks\/benefits discussion|Contraindication review: completed|THROMBOLYSIS CONTRAINDICATION REVIEW|safety pause:? completed|after a brief time-out|no evident contraindications/i);
    }
  });

  it.each(['consult', 'transfer', 'signout'])('keeps discussion distinct from unrecorded consent and numerical risk in %s', (noteTemplate) => {
    const note = {
      ...declined, ...treatment.treatmentDecisionFields('tnk', true),
      tnkConsentDiscussed: true, tnkConsentType: '',
      tnkConsentWith: 'Synthetic surrogate', tnkConsentTime: '13:10'
    };
    const output = outputFunction('generateTelestrokeNoteBody', note, { noteTemplate });
    expect(output).not.toContain('Error generating note');
    expect(output).toMatch(/discussion recorded/i);
    expect(output).toMatch(/consent status not documented/i);
    expect(output).toContain('Synthetic surrogate');
    expect(output).toContain('13:10');
    expect(output).not.toMatch(/consent (?:obtained|recorded)|presumed consent|\d+(?:\.\d+)?%|understanding|time-out|safety pause:? completed/i);
  });

  it('retains explicitly documented consent, review and safety pause without using administration as proof', () => {
    const note = {
      ...declined, ...treatment.treatmentDecisionFields('tnk', true),
      tnkConsentDiscussed: true, tnkConsentType: 'informed',
      tnkContraindicationReviewed: true, preTNKSafetyPause: true
    };
    const output = outputFunction('generateTelestrokeNoteBody', note, { noteTemplate: 'consult' });
    expect(output).not.toContain('Error generating note');
    expect(output).toContain('Informed consent obtained');
    expect(output).toContain('THROMBOLYSIS CONTRAINDICATION REVIEW');
    expect(output).toContain('Pre-TNK safety pause completed');
    expect(output).toContain('Recommended; administration not documented');
  });

  it.each([false, true])('removes the exact persisted default attestations with administration recorded=%s', (administered) => {
    const clinicianText = 'Clinician narrative: Risks and alternatives discussed with the synthetic surrogate, who requested more time.\nTNK was administered per the outside record; the time-out record is unavailable.\nImaging review: I personally reviewed the provided axial images.';
    const note = { ...declined, ...(administered ? { tnkAdminTime: '13:40' } : {}) };
    const output = outputFunction('generateTelestrokeNoteBody', note, {
      noteTemplate: 'consult',
      editableTemplate: `Consultation\n${legacyDefaultAttestations}${clinicianText}\n`
    });
    expect(output).not.toContain('Error generating note');
    expect(output).not.toContain('After ensuring that there were no evident contraindications');
    expect(output).not.toContain('up to 4%');
    expect(output).not.toContain('after a brief time-out');
    expect(output).toContain(clinicianText);
    expect(output).toContain(administered ? 'TNK: Administration recorded at 13:40' : 'TNK: Not recommended');
  });

  it.each(['consult', 'transfer'])('keeps October 1 date-only LKW and discovery on October 1 west of UTC in %s', (noteTemplate) => {
    const previousTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      // Prove the fixture exposes the former UTC-midnight parsing defect.
      expect(new Date('2026-10-01').getDate()).toBe(30);
      const known = outputFunction('generateTelestrokeNoteBody', {
        ...declined, lkwDate: '2026-10-01', lkwTime: '08:20'
      }, { noteTemplate });
      const discovered = outputFunction('generateTelestrokeNoteBody', {
        ...declined, lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '09:05'
      }, { noteTemplate });
      for (const output of [known, discovered]) {
        expect(output).not.toContain('Error generating note');
        expect(output).toContain('10/1/26');
        expect(output).not.toContain('9/30/26');
      }
      expect(known).toMatch(/(?:Last known well \(date\/time\)|LKW): 10\/1\/26 8:20 am/);
      expect(discovered).toMatch(/Discovery (?:date\/time|time): 10\/1\/26 9:05 am/);
    } finally {
      if (previousTz === undefined) delete process.env.TZ;
      else process.env.TZ = previousTz;
    }
  });
});

describe('authored consent copy surfaces', () => {
  it('keeps both IVT and EVT canned copy templates as documentation prompts', () => {
    const start = appSource.indexOf('          const DOC_TEMPLATES = {');
    const end = appSource.indexOf('\n          };', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const templates = new Function(appSource.slice(start, end + '\n          };'.length) + '\nreturn DOC_TEMPLATES;')();
    for (const name of ['tnkRiskBenefit', 'evtRiskBenefit']) {
      expect(templates[name]).toContain('Documentation prompt:');
      expect(templates[name]).toMatch(/explicitly documented|only if they occurred/);
      expect(templates[name]).not.toMatch(/were discussed|verbalized understanding|consent was obtained|\d+(?:\.\d+)?%/i);
    }
  });

  it('uses the authored consent-copy helper and does not upgrade administration to documentation', () => {
    expect(appSource).toContain('const tnkDoc = buildTnkConsentDocumentation(telestrokeNote);');
    const output = buildTnkConsentDocumentation({ tnkRecommended: true, tnkAdminTime: '13:40' });
    expect(output).toContain('Discussion: Not documented');
    expect(output).toContain('Consent status: Not documented');
    expect(output).toContain('Contraindication review: Not documented');
    expect(output).toContain('Pre-TNK safety pause: Not documented');
    expect(output).not.toMatch(/\d+(?:\.\d+)?%|consent obtained|Risks discussed|within 4.5 hours/i);
  });

  it('copies an explicit discussion with missing consent type without inventing a risk estimate', () => {
    const output = buildTnkConsentDocumentation({ tnkConsentDiscussed: true, tnkConsentType: '', tnkConsentWith: 'Synthetic surrogate', tnkConsentTime: '13:10' });
    expect(output).toContain('Discussion: Recorded');
    expect(output).toContain('Participants: Synthetic surrogate');
    expect(output).toContain('Time: 13:10');
    expect(output).toContain('Consent status: Not documented');
    expect(output).not.toMatch(/\d+(?:\.\d+)?%|consent obtained|Risks discussed|within 4.5 hours/i);
    const recorded = buildTnkConsentDocumentation({ tnkConsentDiscussed: true, tnkConsentType: 'declined', tnkContraindicationReviewed: true, preTNKSafetyPause: true });
    expect(recorded).toContain('Consent status: Patient/family declined');
    expect(recorded).toContain('Contraindication review: Recorded');
    expect(recorded).toContain('Pre-TNK safety pause: Recorded');
  });

  it('keeps the generic up-to-4% counseling assertion only in the exact legacy cleanup pattern', () => {
    const matches = appSource.split('\n').filter((line) => line.includes('up to 4%'));
    expect(matches).toHaveLength(1);
    expect(matches[0]).toContain('note = note.replace(/^After ensuring');
    expect(defaultTemplate).not.toMatch(/up to 4%|after a brief time-out|I personally reviewed imaging/);
  });
});

describe('generated drafts remain separate from clinician inputs', () => {
  it('keeps both Generate Auto-Note handlers from writing generated output into recommendations', () => {
    const labels = [...appSource.matchAll(/Generate Auto-Note/g)];
    expect(labels).toHaveLength(2);
    for (const { index } of labels) {
      const start = appSource.lastIndexOf('<button', index);
      const end = appSource.indexOf('</button>', index);
      expect(start).toBeGreaterThan(0);
      expect(end).toBeGreaterThan(index);
      const button = appSource.slice(start, end + '</button>'.length);
      expect(button).toContain('setGeneratedNoteDraft(');
      expect(button).toContain('inputKey: generatedNoteInputKey');
      expect(button).not.toContain('setTelestrokeNote');
      expect(button).not.toMatch(/recommendationsText\s*:/);
    }
  });

  it('regenerates from current consent state and preserves manual recommendations exactly once', () => {
    const manual = 'Manual recommendation: await review of the repeat imaging.';
    const recorded = Object.freeze({
      ...declined, ...treatment.treatmentDecisionFields('tnk', true),
      recommendationsText: manual, tnkConsentDiscussed: true, tnkConsentType: 'informed'
    });
    const first = outputFunction('generateTelestrokeNoteBody', recorded, { noteTemplate: 'consult' });
    expect(first).toContain('Informed consent obtained');
    // Deliberately retain the old type while clearing the discussion checkbox.
    // A prior generated snapshot must not supply the now-cleared attestation.
    const cleared = Object.freeze({ ...recorded, tnkConsentDiscussed: false });
    const regenerated = outputFunction('generateTelestrokeNoteBody', cleared, { noteTemplate: 'consult' });
    for (const output of [first, regenerated]) {
      expect(output).not.toContain('Error generating note');
      expect(output.split(manual)).toHaveLength(2);
      expect(output.split('TELEPHONE CONSULTATION NOTE')).toHaveLength(2);
    }
    expect(regenerated).not.toContain('Informed consent obtained');
    expect(regenerated).not.toContain('IV thrombolysis risks/benefits discussion recorded');
    expect(recorded.recommendationsText).toBe(manual);
    expect(cleared.recommendationsText).toBe(manual);
  });

  it('runs the actual video Auto-Note handler with current recommendations and unknown-onset state', () => {
    const labels = [...appSource.matchAll(/Generate Auto-Note/g)];
    expect(labels).toHaveLength(2);
    const labelIndex = labels[1].index;
    const buttonStart = appSource.lastIndexOf('<button', labelIndex);
    const handlerStart = appSource.indexOf('onClick={() => {', buttonStart) + 'onClick={() => {'.length;
    const handlerEnd = appSource.lastIndexOf('\n                              }}', labelIndex);
    expect(handlerStart).toBeGreaterThan(buttonStart);
    expect(handlerEnd).toBeGreaterThan(handlerStart);
    const authoredHandler = appSource.slice(handlerStart, handlerEnd);
    const runHandler = (note, extra = {}) => {
      const drafts = [];
      const context = {
        ...treatment, ...reviewed, telestrokeNote: note,
        getContextualRecommendations: () => [], getPathwayForDiagnosis: () => 'ischemic',
        getDocumentedNihss: () => '', isValidAspectsScore: () => false,
        aspectsScore: '', lkwTime: null, trialEligibility: {},
        getPediatricStrokeSummary: () => '', PUBLIC_DEMO_MODE: true,
        DEMO_NOTE_DISCLAIMER: '[Synthetic test documentation]', generatedNoteInputKey: 'current-inputs',
        ...extra,
        setGeneratedNoteDraft: (draft) => drafts.push(draft)
      };
      new Function(...Object.keys(context), authoredHandler)(...Object.values(context));
      expect(drafts).toHaveLength(1);
      expect(drafts[0].inputKey).toBe('current-inputs');
      return drafts[0].text;
    };
    const manual = 'Manual recommendation A: await outside imaging review.';
    const revisedManual = 'Manual recommendation B: clarify the remaining questions.';
    const original = Object.freeze({ ...declined, recommendationsText: manual });
    const revised = Object.freeze({ ...declined, recommendationsText: revisedManual });
    const first = runHandler(original);
    const regenerated = runHandler(revised);
    expect(first).toContain(`CLINICIAN-ENTERED RECOMMENDATIONS:\n${manual}`);
    expect(first.split(manual)).toHaveLength(2);
    expect(regenerated).toContain(`CLINICIAN-ENTERED RECOMMENDATIONS:\n${revisedManual}`);
    expect(regenerated.split(revisedManual)).toHaveLength(2);
    expect(regenerated).not.toContain(manual);
    expect(original.recommendationsText).toBe(manual);
    expect(revised.recommendationsText).toBe(revisedManual);

    // Unknown-onset status takes precedence over a previously entered known LKW.
    const previousLkw = new Date('2026-09-29T15:40:00Z');
    const unknown = Object.freeze({
      ...declined, lkwUnknown: true, lkwDate: '2026-09-29', lkwTime: '15:40',
      discoveryDate: '2026-10-01', discoveryTime: '09:05'
    });
    const discovered = runHandler(unknown, { lkwTime: previousLkw });
    expect(discovered).toContain('Last known well: Unknown (wake-up/unwitnessed).');
    expect(discovered).toContain('Discovery (date/time): 2026-10-01 09:05');
    expect(discovered).not.toContain(previousLkw.toLocaleDateString());

    const missingDiscovery = runHandler(Object.freeze({
      ...unknown, discoveryDate: '', discoveryTime: ''
    }), { lkwTime: previousLkw });
    expect(missingDiscovery).toContain('Last known well: Unknown (wake-up/unwitnessed).');
    expect(missingDiscovery).toContain('Discovery (date/time): date not documented time not documented');
    expect(missingDiscovery).not.toContain(previousLkw.toLocaleDateString());
    expect(missingDiscovery).not.toContain('Discovery (date/time): 2026-10-01 09:05');
  });

  it('invalidates a generated snapshot when any authored note, exam or template input group changes', () => {
    const declaration = appSource.match(/^\s*const generatedNoteInputKey = [^\n]+;/m)?.[0];
    expect(declaration).toBeTruthy();
    const baseline = {
      telestrokeNote: { recommendationsText: 'Manual text', tnkConsentDiscussed: true },
      patientData: { '1a': 'Alert (0)' }, gcsItems: { eye: '4' },
      ichScoreItems: { gcs: 'gcs1315' }, aspectsScore: 8,
      abcd2Items: { duration: 'duration1059' }, nihssScore: 0, mrsScore: 0,
      pcAspectsRegions: [], lkwTime: new Date('2026-10-01T10:00:00Z'),
      strokeCodeForm: { tnk: [] }, trialEligibility: {},
      noteTemplate: 'consult', consultationType: 'telephone', editableTemplate: defaultTemplate
    };
    const evaluate = new Function(...Object.keys(baseline), declaration + '\nreturn generatedNoteInputKey;');
    const keyFor = (inputs) => evaluate(...Object.keys(baseline).map((key) => inputs[key]));
    const original = keyFor(baseline);
    const changes = {
      telestrokeNote: { ...baseline.telestrokeNote, tnkConsentDiscussed: false },
      patientData: { '1a': 'Not alert (1)' }, gcsItems: { eye: '3' },
      ichScoreItems: { gcs: 'gcs512' }, aspectsScore: 7,
      abcd2Items: { duration: 'duration60' }, nihssScore: 1, mrsScore: 1,
      pcAspectsRegions: ['pons'], lkwTime: new Date('2026-10-01T11:00:00Z'),
      strokeCodeForm: { tnk: ['review-needed'] }, trialEligibility: { study: { status: 'needs_info' } },
      noteTemplate: 'transfer', consultationType: 'videoTelestroke', editableTemplate: 'Edited template'
    };
    for (const [field, value] of Object.entries(changes)) {
      expect(keyFor({ ...baseline, [field]: value }), `${field} must invalidate the draft`).not.toBe(original);
    }
    expect(appSource).toContain("text={generatedNoteIsCurrent ? generatedNoteDraft.text : ''}");
    expect(appSource).toContain('stale={!!generatedNoteDraft && !generatedNoteIsCurrent}');
  });

  it('renders current drafts read-only and withholds both stale text and stale copy controls', () => {
    const previousText = 'Prior generated snapshot: Informed consent obtained.';
    const render = (props) => renderToStaticMarkup(React.createElement(GeneratedNoteDraft, { onCopy: () => {}, ...props }));
    const current = render({ text: previousText, stale: false });
    expect(current).toContain(previousText);
    expect(current).toMatch(/<textarea[^>]*readonly=""/i);
    expect(current).toContain('Copy generated note');
    const stale = render({ text: previousText, stale: true });
    expect(stale).toContain('Encounter inputs changed');
    expect(stale).toContain('Generate the note again');
    expect(stale).not.toContain(previousText);
    expect(stale).not.toMatch(/<textarea|<button|Copy generated note/);
    expect(render({ text: '', stale: false })).toBe('');
  });
});
