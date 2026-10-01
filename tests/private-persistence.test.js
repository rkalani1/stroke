import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { projectAppData, projectStoredValue, projectTelestrokeNote, projectStrokeCodeForm } from '../src/private-persistence.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/private-persistence-note-controls.json', import.meta.url), 'utf8'));
const calculators = JSON.parse(fs.readFileSync(new URL('./fixtures/private-persistence-calculator-controls.json', import.meta.url), 'utf8'));
const declaration = (name, end) => {
  const start = source.indexOf(`const ${name} =`);
  expect(start).toBeGreaterThan(-1);
  const stop = source.indexOf(end, start);
  expect(stop).toBeGreaterThan(start);
  return source.slice(start, stop);
};
const defaults = new Function(declaration('getDefaultTelestrokeNote', '// Load saved data') + ';return getDefaultTelestrokeNote();')();
const aspectsRegions = new Function(declaration('getDefaultAspectsRegionState', 'const getDefaultPcAspectsRegions') + ';return getDefaultAspectsRegionState();')();
const pcAspectsRegions = new Function(declaration('getDefaultPcAspectsRegions', 'const getDefaultTelestrokeNote') + ';return getDefaultPcAspectsRegions();')();
const nihssItems = new Function(declaration('nihssItems', 'const persistenceShapes') + ';return nihssItems;')();
const policy = { allowFreeText: false, noteDefaults: defaults, aspectsRegions, pcAspectsRegions, nihssItems };
const put = (path, value) => {
  const out = {};
  const keys = path.split('.');
  let node = out;
  keys.slice(0, -1).forEach(key => { node[key] = {}; node = node[key]; });
  node[keys.at(-1)] = value;
  return out;
};
const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const projectNote = note => projectTelestrokeNote(note, defaults);

describe('private free-text-off serialization', () => {
  it('rejects narrative at every canonical default leaf and every nested unknown field', () => {
    const poison = value => Array.isArray(value) ? ['SYNTHETIC NARRATIVE'] : value && typeof value === 'object'
      ? Object.fromEntries([...Object.entries(value).map(([key, child]) => [key, poison(child)]), ['unknown', 'SYNTHETIC NARRATIVE']])
      : 'SYNTHETIC NARRATIVE';
    const note = poison(defaults);
    expect(JSON.stringify(projectNote(note))).not.toContain('SYNTHETIC NARRATIVE');
    expect(note.callerName).toBe('SYNTHETIC NARRATIVE');
    expect(projectNote({ age: '42 patient name', inr: Infinity, weight: { value: 70 }, unknown: { age: 42 } })).toEqual({});
  });

  it('preserves zero, explicit blanks, false, null and valid structured nested values without mutation', () => {
    const note = { age: '0', weight: 70, sex: 'F', disablingDeficit: null, presentedWithin24h: false,
      callerName: 'SYNTHETIC CALLER', symptoms: 'SYNTHETIC SYMPTOMS',
      ctpStructured: { coreVolume: '0', penumbraVolume: '', report: 'SYNTHETIC REPORT' },
      carotidManagement: { symptomatic: null, symptomStatusReviewed: false, stenosisDegree: '70-99' },
      decisionLog: [{ text: 'SYNTHETIC DECISION' }], vesselOcclusion: ['M1', 'SYNTHETIC VESSEL'],
      screeningTools: { stopBangAssessed: false, stopBangScore: 0 },
      ichVolumeCalc: { lengthCm: '1.1', widthCm: '2.2', slicesCm: '3.3' } };
    const before = structuredClone(note);
    const result = projectNote(note);
    expect(result).toMatchObject({ age: '0', weight: 70, sex: 'F', disablingDeficit: null, presentedWithin24h: false,
      ctpStructured: { coreVolume: '0', penumbraVolume: '' }, vesselOcclusion: ['M1'],
      carotidManagement: note.carotidManagement, screeningTools: note.screeningTools, ichVolumeCalc: note.ichVolumeCalc });
    expect(JSON.stringify(result)).not.toContain('SYNTHETIC');
    expect(note).toEqual(before);
  });

  it('round trips every source-inventoried literal note control domain', () => {
    let checks = 0;
    for (const control of fixture.controls) {
      if (!control.path || control.transformedControlValue || control.path === 'mrsAssessment') continue;
      const values = control.controlType === 'select' ? control.exactOptions
        : { number: ['', '0', '12.5'], date: ['', '2026-09-30'], time: ['', '13:45'], 'datetime-local': ['', '2026-09-30T13:45'] }[control.controlType];
      for (const value of values) {
        expect(get(projectNote(put(control.path, value)), control.path), `${control.path}: ${value}`).toBe(value);
        checks++;
      }
    }
    expect(checks).toBeGreaterThan(650);
  });

  it('preserves actual transformed controls, review flags and both current clock formats', () => {
    for (const path of ['disablingDeficit', 'presentedWithin24h', 'carotidManagement.symptomatic']) {
      for (const value of [null, true, false]) expect(get(projectNote(put(path, value)), path)).toBe(value);
    }
    for (const path of ['wakeUpStrokeWorkflow.mriLesionExtentReviewed', 'aspectsRegionsAssessed', 'legacyPcAspectsAssessed',
      'ivtContraindicationsReviewed', 'tiaDisposition.assessmentReviewed', 'aspirinExposureConfirmed',
      'screeningTools.stopBangAssessed', 'drugInteractions.doacDoseAppropriate', 'anticoagBridging.warfarinBridgeIndication',
      'cvtAnticoag.apsStatus', 'aspectsAssessed', 'pcAspectsAssessed', 'carotidManagement.symptomStatusReviewed']) {
      for (const value of [false, true]) expect(get(projectNote(put(path, value)), path), path).toBe(value);
    }
    for (const field of ['consultStartTime', 'tnkAdminTime', 'ichReversalStartTime', 'ichTransferDecisionTime']) {
      for (const value of ['13:45', '01:45 PM', '2026-09-30T13:45:00.000Z']) expect(projectNote({ [field]: value })[field]).toBe(value);
    }
    for (const field of ['discharge', 'day30', 'day90', 'month6', 'month12']) {
      expect(projectNote({ mrsAssessment: { [field]: '6' } }).mrsAssessment[field]).toBe('6');
    }
  });

  it('keeps all real NIHSS labels and unknown/NT region/calculator states', () => {
    for (const item of nihssItems) for (const value of item.options) {
      expect(projectStoredValue('patientData', { [item.id]: value, unknown: 'SYNTHETIC' }, policy)).toEqual({ [item.id]: value });
    }
    expect(projectStoredValue('gcsItems', { eye: 'NT', verbal: 'NT', motor: 'NT', unknown: 'SYNTHETIC' }, policy))
      .toEqual({ eye: 'NT', verbal: 'NT', motor: 'NT' });
    for (const [key, canonical] of [['aspectsRegionState', aspectsRegions], ['pcAspectsRegions', pcAspectsRegions]]) {
      const input = canonical.map(region => ({ ...region, name: 'SYNTHETIC NAME', checked: null, unknown: 'SYNTHETIC' }));
      const output = projectStoredValue(key, input, policy);
      expect(output).toEqual(canonical.map(region => ({ ...region, checked: null })));
      expect(projectStoredValue(key, [], policy)).toHaveLength(canonical.length);
      expect(projectStoredValue(key, 'malformed', policy)).toEqual(canonical.map(region => ({ ...region, checked: null })));
    }
  });

  it('preserves complete FUNC, PHASES, RoPE morphology and EVT shapes from actual controls', () => {
    const values = {
      funcItems: { location: 'infratentorial', preCogImpairment: false },
      phasesItems: { population: 'finnish', hypertension: true, age70: false, size: '12.5', earlierSAH: false, site: 'aca_pcomm_posterior', assessed: true },
      ropeItems: { noHypertension: true, noDiabetes: true, noStrokeTia: false, nonsmoker: false, cortical: true, age: '42', assessed: true, largeShunt: null, atrialSeptalAneurysm: false },
      evtDecisionInputs: { population: 'adult', occlusion: 'mvo-codominant', timeWindow: '6-24', aspects: '5', mrs: '1', nihss: '17', pcAspects: '', age: '73', massEffect: 'present', coreVolume: '55', mismatchRatio: '2.5', mismatchVolume: '80', ctpMismatch: true, disablingDeficit: true }
    };
    for (const [key, value] of Object.entries(values)) {
      expect(projectStoredValue(key, { ...value, unknown: 'SYNTHETIC' }, policy), key).toEqual(value);
    }
    for (const value of ['followup', 'procedure', 'patient-ed']) expect(projectStoredValue('noteTemplate', value, policy)).toBe(value);
    expect(projectStrokeCodeForm({ age: '42', tnk_rec: 'Recommended', evt_rec: 'Not Recommended', hx: 'SYNTHETIC' }))
      .toEqual({ age: '42', tnk_rec: 'Recommended', evt_rec: 'Not Recommended' });
  });

  it('round trips the independently inventoried saved calculator domains and sync metadata', () => {
    for (const [key, schema] of Object.entries(calculators.schemas)) {
      for (const [field, values] of Object.entries(schema.fields)) {
        for (const value of values) expect(projectStoredValue(key, { [field]: value }, policy)?.[field], `${key}.${field}: ${value}`).toEqual(value);
        expect(JSON.stringify(projectStoredValue(key, { [field]: 'SYNTHETIC NARRATIVE', unknown: 'SYNTHETIC NARRATIVE' }, policy))).not.toContain('SYNTHETIC');
      }
      for (const value of schema.scalarValues) expect(projectStoredValue(key, value, policy), key).toEqual(value);
    }
    for (const [path, values] of Object.entries(calculators.knownAdditionalFields)) {
      const [key, field] = path.split('.');
      for (const value of values) expect(projectStoredValue(key, { [field]: value }, policy)?.[field], path).toEqual(value);
    }
    for (const value of ['4|5|6', 'NT|NT|NT', '||', '4||NT']) {
      expect(projectStoredValue('ichScoreItems', { criteriaReviewed: true, syncedGcsSignature: value }, policy))
        .toEqual({ criteriaReviewed: true, syncedGcsSignature: value });
    }
    for (const value of ['5|5|6', '4|6|6', '4|5|7', '4|5|6 SYNTHETIC']) {
      expect(projectStoredValue('ichScoreItems', { syncedGcsSignature: value }, policy)).toEqual({});
    }
  });

  it('preserves source-mapped button and checkbox groups with their assessment state', () => {
    const screeningTools = Object.fromEntries(['sb_snoring', 'sb_tired', 'sb_observed', 'sb_pressure', 'sb_bmi', 'sb_age', 'sb_neck', 'sb_gender'].map(key => [key, true]));
    Object.assign(screeningTools, { stopBangAssessed: true, stopBangScore: '8', stopBangPositive: true });
    const note = { screeningTools, noncardioembolicConfirmed: true, antiplateletContraindicationsReviewed: false,
      cervicalDissectionConfirmed: true, aorticDissectionSuspected: false, nihssSource: 'exam',
      tiaDisposition: { persistentDeficit: false, symptomaticCarotidSevere: false, suspectedCardioembolism: true, crescendoOrRecurrent: false, dwiPositive: true, assessmentReviewed: true },
      tnkContraindicationReviewTime: '01:45 PM', bpProtocolCheck: '180/100' };
    expect(projectNote(note)).toEqual(note);
    for (const value of ['', 'large-artery', 'cardioembolism', 'small-vessel', 'other-determined', 'cryptogenic']) {
      expect(projectNote({ toastClassification: value }).toastClassification).toBe(value);
    }
    expect(projectNote({ screeningTools: { sb_snoring: 'SYNTHETIC', unknown: true }, toastClassification: 'SYNTHETIC' }))
      .toEqual({ screeningTools: {} });
  });

  it('keeps dynamically mapped TNK contraindications and angioedema checklist flags', () => {
    const tnkContraindicationChecklist = Object.fromEntries(['aorticDissection', 'giMalignancy', 'sahPresentation', 'infectiveEndocarditis', 'priorICH', 'vascularMalformation', 'medicationReconciliation', 'abnormalCoagUnknown', 'preexistingDisability', 'largeInfarct', 'severeRenalFailure', 'intracranialAneurysm', 'dualAntiplatelet', 'aceInhibitor'].map((key, index) => [key, index % 2 === 0]));
    const stepsTaken = { airway: true, stopTnk: true, steroids: false, epinephrine: true, icatibant: false };
    const note = { tnkContraindicationReviewed: true, tnkContraindicationChecklist, angioedema: { stepsTaken } };
    expect(projectNote(note)).toEqual(note);
    expect(projectNote({ tnkContraindicationChecklist: { aorticDissection: 'SYNTHETIC', unknown: true }, angioedema: { stepsTaken: { airway: 'SYNTHETIC', unknown: true } } }))
      .toEqual({ tnkContraindicationChecklist: {}, angioedema: { stepsTaken: {} } });
  });

  it('retains mapped post-EVT/workup checkboxes and both distinct note ASPECTS maps', () => {
    const completedTests = Object.fromEntries(['ctaHeadNeck', 'carotidDuplex', 'mriDwi', 'lipidPanel', 'hba1c', 'ecg', 'echo', 'vesselWallMri', 'telemetry', 'echoTte', 'echoTee', 'extendedMonitor', 'bpMonitoring', 'mraNeck', 'hypercoagPanel', 'esrCrp'].map((key, index) => [key, index % 2 === 0]));
    const postEvt = Object.fromEntries(['postEvtBpConfirmed', 'postEvtNeuroChecks', 'postEvtGroinCheck', 'postEvtImagingOrdered', 'postEvtAntiplateletTiming', 'postEvtIcuBed'].map(key => [key, true]));
    const note = { ...postEvt, etiologyWorkup: { completedTests }, aspectsAssessed: true, aspectsRegions: { ...defaults.aspectsRegions, M1: true },
      pcAspectsAssessed: true, pcAspectsRegions: { ...defaults.pcAspectsRegions, pons: true } };
    expect(projectNote(note)).toEqual(note);
    expect(projectNote({ etiologyWorkup: { completedTests: { echo: 'SYNTHETIC', unknown: true } } }))
      .toEqual({ etiologyWorkup: { completedTests: {} } });
  });

  it('omits opaque records, history, templates and unknown keys while off; opt-in preserves their contents', () => {
    const value = { diagnosis: 'SYNTHETIC DIAGNOSIS', telestrokeNote: { callerName: 'SYNTHETIC CALLER' } };
    for (const key of ['shiftPatients', 'encounterHistory', 'telestrokeTemplate', 'currentPatientId', 'unknown']) {
      expect(projectStoredValue(key, value, policy)).toBeUndefined();
      expect(projectStoredValue(key, value, { allowFreeText: true })).toBe(value);
    }
  });

  it('makes current policy authoritative over stale app-data opt-in and preserves nonclinical settings', () => {
    const data = { schemaVersion: 1, settings: { allowFreeTextStorage: true, deidMode: true, workflowPersona: 'trainee', defaultConsultationType: 'videoTelestroke', ttlHoursOverride: null },
      shiftBoards: [{ name: 'SYNTHETIC NAME' }], encounter: { clipboardPacks: [{ body: 'SYNTHETIC BODY' }] },
      uiState: { lastActiveTab: 'research', lastManagementSubTab: 'ich' } };
    const result = projectAppData(data, policy);
    expect(result.settings).toEqual({ ...data.settings, allowFreeTextStorage: false });
    expect(result.uiState).toEqual(data.uiState);
    expect(JSON.stringify(result)).not.toContain('SYNTHETIC');
    expect(projectAppData(data, { allowFreeText: true })).toBe(data);
    expect(data.settings.allowFreeTextStorage).toBe(true);
  });
});

// Execute only these small sink functions. Never boot the app or invoke its
// reset/clear/TTL paths, and never touch browser storage or a user profile.
const boundarySource = declaration('setKey', 'const removeKey')
  + declaration('saveAppData', 'const parseLastUpdated')
  + declaration('migrateLegacyStorage', 'const ensureArray');
describe('actual application persistence sinks with isolated synthetic storage', () => {
  it('projects queued writes with the current policy, including direct history and stale appData', () => {
    const writes = new Map();
    const context = vm.createContext({ PUBLIC_DEMO_MODE: false, privatePersistencePolicy: { allowFreeText: true },
      projectStoredValue, projectAppData, STORAGE_PREFIX: 'synthetic:', APP_DATA_KEY: 'synthetic:appData', LAST_UPDATED_KEY: 'lastUpdated',
      touchLastUpdated() {}, localStorage: { setItem(key, value) { writes.set(key, value); } } });
    vm.runInContext(boundarySource, context);
    vm.runInContext("const queued = () => setKey('telestrokeNote', {age:'42',callerName:'SYNTHETIC'});", context);
    context.privatePersistencePolicy = policy;
    vm.runInContext("queued(); setKey('encounterHistory', [{diagnosis:'SYNTHETIC'}]); saveAppData({settings:{allowFreeTextStorage:true},shiftBoards:[{name:'SYNTHETIC'}]});", context);
    expect(JSON.parse(writes.get('synthetic:telestrokeNote'))).toEqual({ age: '42' });
    expect(writes.has('synthetic:encounterHistory')).toBe(false);
    expect(JSON.parse(writes.get('synthetic:appData'))).toEqual({ settings: { allowFreeTextStorage: false } });
  });

  it('returns at the public gate before reading policy or storage', () => {
    const context = vm.createContext({ PUBLIC_DEMO_MODE: true });
    for (const key of ['localStorage', 'privatePersistencePolicy', 'projectStoredValue', 'projectAppData']) {
      Object.defineProperty(context, key, { get() { throw new Error(`must not access ${key}`); } });
    }
    vm.runInContext(boundarySource, context);
    expect(() => vm.runInContext('setKey("unknown", {}); saveAppData({}); migrateLegacyStorage();', context)).not.toThrow();
  });

  it('does not read or copy legacy opaque payloads while free text is off', () => {
    const context = vm.createContext({ PUBLIC_DEMO_MODE: false, privatePersistencePolicy: policy });
    Object.defineProperty(context, 'localStorage', { get() { throw new Error('legacy storage must not be reached'); } });
    vm.runInContext(boundarySource, context);
    expect(() => vm.runInContext('migrateLegacyStorage();', context)).not.toThrow();
    const load = source.indexOf('const INITIAL_APP_DATA = loadAppData();');
    expect(source.indexOf('migrateLegacyStorage();', load)).toBeGreaterThan(load);
  });
});
