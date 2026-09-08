import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import * as treatment from '../src/encounter-decision-status.js';

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
    ...treatment, telestrokeNote: note, nihssScore: 0, aspectsScore: '',
    isValidAspectsScore: () => false, calculateICHScore: () => 0,
    calculateGCS: () => 15, calculateTNKDose: () => ({ calculatedDose: 15 }),
    ichScoreItems: {}, gcsItems: {}, ANTICOAGULANT_INFO: {}, TOAST_LABELS: {},
    consultationType: 'telephone', getIchEscalationSummary: () => '',
    getDaptAdherenceSummary: () => '', getAis2026DeltaSummary: () => '',
    getSahOutcomeSummary: () => '', getPathwayForDiagnosis: () => 'ischemic',
    getDocumentedNihss: () => treatment.documentedNihssValue(note, 0, false),
    mrsScore: 0, pcAspectsRegions: [], calculatePCAspects: () => 0, bpPhaseTargets: {},
    formatBpPhaseTarget: () => '', PUBLIC_DEMO_MODE: true,
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
});
