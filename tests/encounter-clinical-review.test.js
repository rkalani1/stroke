import { describe, expect, it } from 'vitest';
import { evaluateWakeUpScreen, evaluateVideoTreatment, assessAnticoagulantExposure, documentedIvtContext, numericInput, documentedExamScore, buildEvtConsentText, calculatorField, reviewedGcs, gcsDocumentation, reviewedAspects, reviewedPhq2, reviewedStopBang, reviewedTiaDisposition } from '../src/encounter-clinical-review.js';

describe('reviewed Encounter decision boundaries', () => {
  const note = { diagnosisCategory: 'ischemic', presentingBP: '140/80', glucose: '100', age: '60', nihss: '10', disablingDeficit: true, premorbidMRS: '0', lastDOACType: 'none', ctHemorrhageStatus: 'absent', ivtContraindicationsReviewed: true };
  it('never uses discovery as a standard-window onset', () => {
    const result = evaluateVideoTreatment({ note: { ...note, lkwUnknown: true }, clock: { total: 1, label: 'Discovery' }, aspects: 8, critical: [] });
    expect(result.tnk.eligible).toBe(false);
    expect(result.tnk.confidence).toBe('low');
  });
  it('preserves missing NIHSS and explicit zero distinctly', () => {
    expect(documentedExamScore({}, 0, false)).toBe(null);
    expect(documentedExamScore({}, 0, true)).toBe(0);
    expect(documentedExamScore({ nihss: '0' }, 0, false)).toBe(0);
    const result = evaluateVideoTreatment({ note: { ...note, nihss: '', disablingDeficit: null }, clock: { total: 1, label: 'LKW' }, critical: [] });
    expect(result.tnk.confidence).toBe('low');
  });
  it('accepts documented zero elapsed time without using a falsy missing test', () => {
    expect(evaluateVideoTreatment({ note, clock: { total: 0, label: 'LKW' }, critical: [] }).tnk.eligible).toBe(true);
  });
  it('requires a real midpoint and absolute perfusion mismatch', () => {
    const now = new Date('2026-09-30T12:00:00');
    const wake = { ...note, lkwUnknown: true, coreVolume: '20', penumbraVolume: '50', wakeUpStrokeWorkflow: { isWakeUpStroke: true, mriAvailable: false, extendCriteria: { nihss4to26: true, premorbidMRSLt2: true, ischemicCoreLte70: true, mismatchRatioGte1_2: true, timeWindow4_5to9h: true } } };
    expect(evaluateWakeUpScreen(wake, now).extendEligible).toBe(false);
    wake.wakeUpStrokeWorkflow.sleepMidpoint = '2026-09-30T06:00';
    expect(evaluateWakeUpScreen(wake, now).extendEligible).toBe(true);
    expect(evaluateWakeUpScreen({ ...wake, penumbraVolume: '' }, now).extendEligible).toBe(false);
    expect(evaluateWakeUpScreen({ ...wake, coreVolume: '-1' }, now).extendEligible).toBe(false);
    expect(evaluateWakeUpScreen({ ...wake, wakeUpStrokeWorkflow: { ...wake.wakeUpStrokeWorkflow, sleepMidpoint: '2026-09-29T06:00' } }, now).extendEligible).toBe(false);
  });
  it('does not apply the adult EVT tier to children or incomplete posterior imaging', () => {
    for (const age of ['2', '6', '17']) expect(evaluateVideoTreatment({ note: { ...note, age, vesselOcclusion: ['M1'] }, clock: { total: 2, label: 'LKW' }, aspects: 8, critical: [] }).evt.eligible).toBe(false);
    expect(evaluateVideoTreatment({ note: { ...note, vesselOcclusion: ['Basilar'] }, clock: { total: 10, label: 'LKW' }, critical: [] }).evt.eligible).toBe(false);
  });
  it('cannot match EVT with hemorrhage, incompatible diagnosis, critical concerns or invalid pc-ASPECTS', () => {
    const args = { note: { ...note, vesselOcclusion: ['M1'] }, clock: {total:2,label:'LKW'}, aspects:8 };
    for (const patch of [{diagnosisCategory:'ich'}, {diagnosisCategory:'sah'}, {diagnosisCategory:''}, {ctHemorrhageStatus:'present'}, {ctHemorrhageStatus:''}]) expect(evaluateVideoTreatment({...args,note:{...args.note,...patch}}).evt.eligible).toBe(false);
    expect(evaluateVideoTreatment({...args,critical:[{severity:'critical'}]}).evt.eligible).toBe(false);
    for (const pcAspects of [11,6.5,-1,Infinity,'']) expect(evaluateVideoTreatment({...args,note:{...note,vesselOcclusion:['Basilar']},pcAspects}).evt.eligible).toBe(false);
  });
  it('requires valid measured BP and glucose for standard IVT screen', () => {
    for (const patch of [{presentingBP:''},{presentingBP:'185/110'},{presentingBP:'90/120'},{glucose:''},{glucose:'49'},{glucose:'401'},{glucose:Infinity},{diagnosisCategory:'mimic'},{diagnosisCategory:'cvt'},{diagnosisCategory:''}]) expect(evaluateVideoTreatment({note:{...note,...patch},clock:{total:1,label:'LKW'}}).tnk.eligible).toBe(false);
  });
  it('reports untestable GCS components without a fabricated total', () => {
    expect(reviewedGcs({eye:'4',verbal:'5',motor:'6'})).toBe(15);
    for (const eye of ['NT',null,0,99]) expect(reviewedGcs({eye,verbal:'5',motor:'6'})).toBe(null);
    expect(gcsDocumentation({eye:'4',verbal:'NT',motor:'6',notTestableReason:'intubated'})).toContain('total not reported');
    expect(gcsDocumentation({eye:'4',verbal:'NT',motor:'6',notTestableReason:'intubated'})).toContain('E4 VNT M6');
  });
  it('ASPECTS counts only known regions after assessment', () => {
    expect(reviewedAspects({C:true,extraneous:true},true)).toBe(9);
    expect(reviewedAspects({},false)).toBe(null);
    expect(reviewedAspects({C:'unknown'},true)).toBe(null);
  });
  it('does not invent DOAC clearance for heparin', () => {
    const now = new Date('2026-09-30T12:00:00');
    expect(assessAnticoagulantExposure({ lastDOACType: 'heparin', lastDOACDose: '2026-09-29T06:00', ptt: '30' }, now).status).toBe('review');
    expect(assessAnticoagulantExposure({ lastDOACType: 'lmwh', lastDOACDose: '2026-09-30T06:00' }, now).status).toBe('unknown');
    expect(assessAnticoagulantExposure({ lastDOACType: 'lmwh', anticoagulantDoseIntent: 'therapeutic', lastDOACDose: '2026-09-30T06:00' }, now).status).toBe('block');
  });
  it('rejects nonfinite or partial numeric strings', () => {
    for (const x of ['', null, undefined, 'Infinity', Infinity, NaN, '-1', '12abc']) expect(numericInput(x, { min: 0 })).toBe(null);
    expect(numericInput('0', { min: 0 })).toBe(0);
  });
  it('copies only attested consent discussion', () => {
    const text = buildEvtConsentText({ evtRecommended: true, consentKit: {} });
    expect(text).not.toMatch(/Risks discussed|Benefits discussed|Alternatives discussed|consent obtained/i);
    expect(text).toContain('not documented');
    expect(buildEvtConsentText({ consentKit: { evtConsentDiscussed: true } })).toContain('Risks, benefits and alternatives discussed');
  });
  it('respects explicit blank calculator values and disabled synchronization', () => {
    expect(calculatorField({ age: '' }, 'age', '60', true)).toBe('');
    expect(calculatorField({}, 'age', '60', false)).toBe('');
    expect(calculatorField({}, 'age', '60', true)).toBe('60');
  });
});

describe('completed screening assessments', () => {
  it('does not impute a missing PHQ-2 answer or lose a documented zero', () => {
    expect(reviewedPhq2({phq2_q1:'0'})).toBe(null);
    expect(reviewedPhq2({phq2_q1:'0',phq2_q2:'0'})).toBe(0);
    expect(reviewedPhq2({phq2_q1:'2',phq2_q2:'1'})).toBe(3);
    expect(reviewedPhq2({phq2_q1:'4',phq2_q2:'0'})).toBe(null);
  });
  it('requires STOP-BANG assessment and rejects malformed restored criteria', () => {
    expect(reviewedStopBang({sb_age:true})).toBe(null);
    expect(reviewedStopBang({stopBangAssessed:true})).toBe(0);
    expect(reviewedStopBang({stopBangAssessed:true,sb_age:true})).toBe(1);
    expect(reviewedStopBang({stopBangAssessed:true,sb_age:'false'})).toBe(null);
  });
  it('never converts an untouched TIA checklist into low-risk discharge clearance', () => {
    expect(reviewedTiaDisposition({}).status).toBe('incomplete');
    expect(reviewedTiaDisposition({dwiPositive:true}).status).toBe('urgent');
    expect(reviewedTiaDisposition({assessmentReviewed:true,sameDayWorkupComplete:true,reliableFollowUp48h:true}).status).toBe('review');
  });
});

describe('explicit contradictory treatment records take precedence over attestation',()=>{
  const base={diagnosisCategory:'ischemic',age:60,nihss:10,disablingDeficit:true,premorbidMRS:0,lastDOACType:'none',ctHemorrhageStatus:'absent',ivtContraindicationsReviewed:true,presentingBP:'140/80',glucose:100,vesselOcclusion:['ICA']};
  const assess=patch=>evaluateVideoTreatment({note:{...base,...patch},clock:{total:1,label:'LKW'},aspects:8});
  it.each(['activeInternalBleeding','currentICH','aorticDissection','intracranialTumor','infectiveEndocarditis','recentIntracranialSurgery','recentMajorSurgery','recentDOAC','sahPresentation'])('requires review of the recorded %s concern even with a completed attestation',key=>{
    const {tnk}=assess({tnkContraindicationChecklist:{[key]:true}});expect(tnk.eligible).toBe(false);expect(tnk.reviewRequired).toBe(true);expect(tnk.reason).toContain('not permanent exclusions');
  });
  it.each([{infectiveEndocarditis:true},{tnkAutoBlocked:true},{tnkContraindicationChecklist:{currentICH:'false'}}])('preserves an independent block or malformed record %o',patch=>{
    const {tnk}=assess(patch);expect(tnk.eligible).toBe(false);expect(tnk.reviewRequired).toBe(true);
  });
  it('does not treat blue-tier antiplatelet, ACE-inhibitor or seizure flags alone as absolute contraindications',()=>{
    const {tnk}=assess({tnkContraindicationChecklist:{dualAntiplatelet:true,aceInhibitor:true,seizureAtOnset:true}});expect(tnk.eligible).toBe(true);
  });
  it('prevents the explicitly hemorrhage-positive checklist from contradicting a negative-imaging EVT screen',()=>{
    const {evt}=assess({tnkContraindicationChecklist:{currentICH:true}});expect(evt.eligible).toBe(false);expect(evt.reviewRequired).toBe(true);
  });
  it.each(['apixaban 5 mg twice daily','Eliquis','rivaroxaban','Xarelto','dabigatran','Pradaxa','edoxaban','Savaysa','warfarin','Coumadin','Jantoven','heparin','enoxaparin','Lovenox','dalteparin','fondaparinux'])('reconciles %s in medication text against explicit no-anticoagulant selection',medications=>{
    const patch={medications,lastDOACType:'none'};
    expect(documentedIvtContext(patch).medicationReconciliation).toBe(true);
    expect(assessAnticoagulantExposure(patch).status).toBe('review');
    expect(assess(patch).tnk).toMatchObject({eligible:false,reviewRequired:true});
  });
  it('treats the separate pregnancy flag as the same relative-risk review, not a permanent exclusion',()=>{
    expect(documentedIvtContext({pregnancyStroke:true}).pregnancy).toBe(true);
    expect(assess({pregnancyStroke:true}).tnk).toMatchObject({eligible:false,reviewRequired:true});
  });
  it('uses medication mentions only for reconciliation, including uncertain or historical mentions',()=>{
    expect(assessAnticoagulantExposure({lastDOACType:'none',medications:'Previously on apixaban; stopped per patient'})).toMatchObject({status:'review',recent:false});
    expect(assess({medications:'aspirin, clopidogrel, lisinopril'}).tnk.eligible).toBe(true);
  });
  it('rejects object and array numeric coercion before any treatment screen',()=>{
    for(const value of [[60],{valueOf:()=>60},[],true]) {
      expect(numericInput(value)).toBe(null);
      expect(assess({age:value}).tnk.eligible).toBe(false);
    }
  });
});
