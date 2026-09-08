import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { documentedNihssValue, hasRecordedNoTreatment, hasRecordedTreatmentAdministration } from '../src/encounter-decision-status.js';

// Exercise the actual Encounter recommendation conditions, not copied predicates.
const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const documentedNIHSS =');
const end = source.indexOf('const getPathwayForDiagnosis =', start);
if (start < 0 || end < start) throw new Error('Encounter recommendation boundaries missing');
const recommendations = new Function('hasRecordedNoTreatment', 'hasRecordedTreatmentAdministration', 'getGuidelineUrl',
  source.slice(start, end) + '\nreturn GUIDELINE_RECOMMENDATIONS;')(
  hasRecordedNoTreatment, hasRecordedTreatmentAdministration, () => 'https://example.test/guideline');

const negative = { tnkRecommended: false, tnkDecisionRecorded: true, evtRecommended: false, evtDecisionRecorded: true };
const data = (note = {}, nihss = '3') => ({ telestrokeNote: { diagnosisCategory: 'ischemic', nihss, vesselOcclusion: ['None'], ...note } });
const nonReperfusion = [
  ['bp_ischemic_no_lysis', '3'], ['permissive_hypertension', '3'],
  ['dapt_minor_stroke', '3'], ['dapt_ticagrelor_nihss5', '4'],
  ['tirofiban_no_occlusion', '3']
];

const getterStart = source.indexOf('const getDocumentedNihss =');
const getterEnd = source.indexOf('const buildEncounterTemplateContext =', getterStart);
const callerStart = source.indexOf('const getContextualRecommendations =');
const envelopeStart = source.indexOf('const documentedScore =', callerStart);
const envelopeEnd = source.indexOf('return Object.values(GUIDELINE_RECOMMENDATIONS)', callerStart);
if (getterStart < 0 || getterEnd < getterStart || envelopeStart < callerStart || envelopeEnd < envelopeStart) {
  throw new Error('Actual contextual-recommendation NIHSS caller boundaries missing');
}

function actualRecommendationEnvelope(entered, hasExamInput) {
  return vm.runInNewContext('(() => {\n' + source.slice(getterStart, getterEnd) +
    source.slice(envelopeStart, envelopeEnd) + '\nreturn data; })()', {
    telestrokeNote: { diagnosisCategory: 'ischemic', nihss: entered, ...negative },
    nihssScore: 0,
    nihssItems: [{ id: 'loc' }],
    patientData: hasExamInput ? { loc: 0 } : {},
    documentedNihssValue,
    aspectsScore: null,
    isValidAspectsScore: () => false,
    gcsItems: {}, calculateGCS: () => null,
    timeFrom: null,
    abcd2Complete: false, abcd2Items: {}, calculateABCD2Score: () => null,
    ichScoreItems: {}, calculateICHScore: () => null
  });
}

describe('actual Encounter non-reperfusion condition provenance', () => {
  it.each([
    ['', false, null, false], ['0', false, 0, true], ['', true, 0, true], ['3', false, 3, true]
  ])('actual recommendation envelope preserves NIHSS %s, exam=%s', (entered, hasExamInput, value, minorStrokeVisible) => {
    const envelope = actualRecommendationEnvelope(entered, hasExamInput);
    expect(envelope.nihssScore).toBe(value);
    expect(recommendations.dapt_minor_stroke.conditions(envelope)).toBe(minorStrokeVisible);
  });

  it.each(nonReperfusion)('%s requires documented negative decisions', (id, nihss) => {
    const condition = recommendations[id].conditions;
    expect(condition(data({}, nihss))).toBe(false);
    expect(condition(data({ tnkRecommended: false, evtRecommended: false }, nihss))).toBe(false);
    expect(condition(data({ ...negative, evtDecisionRecorded: false }, nihss))).toBe(false);
    expect(condition(data(negative, nihss))).toBe(true);
    expect(condition(data({ ...negative, tnkDecisionRecorded: false, tnkAutoBlocked: true }, nihss))).toBe(true);
    expect(condition(data({ ...negative, tnkRecommended: true }, nihss))).toBe(false);
  });

  it.each(nonReperfusion)('%s rejects no-treatment framing after administration or EVT start', (id, nihss) => {
    const condition = recommendations[id].conditions;
    for (const field of ['tnkAdminTime', 'dtnTnkAdministered', 'needleTime', 'punctureTime', 'reperfusionTime']) {
      expect(condition(data({ ...negative, [field]: '12:30' }, nihss)), field).toBe(false);
    }
    expect(condition(data({ ...negative, tnkAutoBlocked: true, needleTime: '12:30' }, nihss))).toBe(false);
  });

  it.each(['bp_pre_evt', 'direct_to_angio'])('%s requires a documented no-IVT decision', id => {
    const condition = recommendations[id].conditions;
    const plannedEvt = { evtRecommended: true, vesselOcclusion: ['M1'] };
    expect(condition(data(plannedEvt))).toBe(false);
    expect(condition(data({ ...negative, ...plannedEvt }))).toBe(true);
    expect(condition(data({ ...plannedEvt, tnkAutoBlocked: true }))).toBe(true);
    for (const field of ['tnkAdminTime', 'dtnTnkAdministered', 'needleTime']) {
      expect(condition(data({ ...negative, ...plannedEvt, [field]: '12:30' })), field).toBe(false);
    }
  });

  it('shows completed-EVT imaging guidance only after recorded procedure completion', () => {
    const condition = recommendations.post_evt_dect.conditions;
    expect(condition(data({ evtRecommended: true }))).toBe(false);
    expect(condition(data({ evtRecommended: true, punctureTime: '12:30' }))).toBe(false);
    expect(condition(data({ evtRecommended: true, ticiScore: '3' }))).toBe(false);
    expect(condition(data({ reperfusionTime: '13:00' }))).toBe(true);
  });

  it('does not label EVT as omitted after a documented puncture', () => {
    expect(hasRecordedNoTreatment({ ...negative, punctureTime: '12:30' }, 'evt')).toBe(false);
    expect(hasRecordedNoTreatment({ ...negative, reperfusionTime: '13:00' }, 'evt')).toBe(false);
    expect(hasRecordedNoTreatment(negative, 'evt')).toBe(true);
    expect(hasRecordedNoTreatment({ evtRecommended: false }, 'evt')).toBe(false);
  });
});
