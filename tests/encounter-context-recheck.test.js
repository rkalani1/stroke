import fs from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
import * as reviewed from '../src/encounter-clinical-review.js';
import * as decisions from '../src/encounter-decision-status.js';
import * as calculators from '../src/calculators.js';
import { isSuccessfulEvtReperfusion } from '../src/institutional-protocols.js';
import { getClinicalClaim } from '../src/clinical/claim-registry.js';
const source=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
const start=source.indexOf('const GUIDELINE_URLS ='), end=source.indexOf('const getPathwayForDiagnosis',start);
const cards=vm.runInNewContext(source.slice(start,end)+'\nGUIDELINE_RECOMMENDATIONS',{...reviewed,...decisions,...calculators,isSuccessfulEvtReperfusion,getClinicalClaim});
const a=source.indexOf('const getContextualRecommendations ='), b=source.indexOf('// NIHSS validation',a);
const base={diagnosisCategory:'ischemic',age:'60',nihss:'10',disablingDeficit:true,premorbidMRS:'0',lastDOACType:'none',ctHemorrhageStatus:'absent',ivtContraindicationsReviewed:true,presentingBP:'140/80',glucose:'100',vesselOcclusion:['M1']};
function visible(patch={},clock={total:1,label:'LKW'},aspects=8){
 const note={...base,...patch};
 return vm.runInNewContext(source.slice(a,b)+'\ngetContextualRecommendations().map(r=>r.id)',{...reviewed,...decisions,...calculators,isSuccessfulEvtReperfusion,GUIDELINE_RECOMMENDATIONS:cards,telestrokeNote:note,calculateTimeFromLKW:()=>clock,getDocumentedNihss:()=>decisions.documentedNihssValue(note),isNIHSSComplete:()=>false,aspectsScore:aspects,isValidAspectsScore:v=>Number.isInteger(v)&&v>=0&&v<=10,gcsItems:{},abcd2Items:{},abcd2Complete:false,ichScoreItems:{},detectContraindications:()=>[]});
}
const noTx={tnkRecommended:false,tnkDecisionRecorded:true,evtRecommended:false,evtDecisionRecorded:true};
const ap={...noTx,noncardioembolicConfirmed:true,antiplateletContraindicationsReviewed:true,nihss:'2',vesselOcclusion:['None']};
describe('actual Encounter context-card selection after interrupted input',()=>{
 it('retains the valid adult positive partial-screen control',()=>{expect(visible()).toContain('tnk_standard');expect(visible()).toContain('evt_standard');});
 it.each(['','-1','43','1.9'])('withdraws standard reperfusion cards for invalid NIHSS %s',nihss=>{expect(visible({nihss})).not.toContain('tnk_standard');expect(visible({nihss})).not.toContain('evt_standard');});
 it('preserves documented NIHSS0 with disabling deficit for IVT assessment',()=>expect(visible({nihss:'0'})).toContain('tnk_standard'));
 it.each(['presentingBP','glucose','age','ctHemorrhageStatus'])('clearing %s withdraws standard IVT card',key=>expect(visible({[key]:''})).not.toContain('tnk_standard'));
 it.each(['ich','sah','cvt','mimic',''])('diagnosis %s cannot retain adult reperfusion cards',diagnosisCategory=>{const ids=visible({diagnosisCategory});for(const id of ['tnk_standard','evt_standard','evt_late_window','evt_basilar','transfer_evt'])expect(ids).not.toContain(id);});
 it.each([8,17])('does not apply adult TNK/EVT card to age%s',age=>{const ids=visible({age});expect(ids).not.toContain('tnk_standard');expect(ids).not.toContain('evt_standard');});
 it('discovery is not a standard-window clock; unknown onset retains imaging-pathway review',()=>{const ids=visible({lkwUnknown:true},{total:0,label:'Discovery'});expect(ids).not.toContain('tnk_standard');expect(ids).not.toContain('evt_standard');expect(ids).toContain('tnk_extended_imaging');});
 it('unknown onset cannot be laundered through a misleading LKW label',()=>{expect(visible({lkwUnknown:true})).not.toContain('evt_standard');expect(reviewed.evaluateVideoTreatment({note:{...base,lkwUnknown:true},clock:{total:1,label:'LKW'},aspects:8}).evt.eligible).toBe(false);});
 it.each([{total:-1,label:'LKW'},{total:1,label:'LKW',futureWarning:true}])('rejects invalid/future clock %j',clock=>{expect(visible({},clock)).not.toContain('tnk_standard');expect(visible({},clock)).not.toContain('evt_standard');});
 it('does not import DAWN NIHSS10 into current age80 late-window recommendation',()=>expect(visible({age:85,nihss:6},{total:8,label:'LKW'})).toContain('evt_late_window'));
 it('missing ASPECTS cannot satisfy the late-window card',()=>expect(visible({}, {total:8,label:'LKW'},null)).not.toContain('evt_late_window'));
 it('prior EVT completion suppresses new routine IVT instructions',()=>{const ids=visible({reperfusionTime:'12:00'});expect(ids).not.toContain('tnk_standard');expect(ids).toContain('bp_post_evt');});
 it.each(['punctureTime','reperfusionTime'])('withdraws preprocedure BP cards after %s',key=>{const ids=visible({...noTx,evtRecommended:true,[key]:'12:00'});expect(ids).not.toContain('bp_pre_tnk');expect(ids).not.toContain('bp_pre_evt');});
 it('TICI alone is not actual EVT administration',()=>{const ids=visible({ticiScore:'3'});for(const id of ['bp_post_evt','bp_post_evt_drip','ia_lytic_post_evt','post_evt_dect'])expect(ids).not.toContain(id);});
 it('structured anticoagulant exposure activates relevant ICH reference',()=>{expect(visible({diagnosisCategory:'ich',lastDOACType:'dabigatran'})).toContain('reversal_dabigatran');expect(visible({diagnosisCategory:'ich',lastDOACType:'none',medications:'not on dabigatran'})).not.toContain('reversal_dabigatran');});
 it('unknown or dominant M2 is not classified as nondominant/codominant',()=>{expect(visible({vesselOcclusion:['M2']})).not.toContain('mevo_evt_not_recommended');expect(visible({vesselOcclusion:['M2'],culpritM2Dominance:'dominant'})).not.toContain('mevo_evt_not_recommended');expect(visible({vesselOcclusion:['M2'],culpritM2Dominance:'non-dominant'})).toContain('mevo_evt_not_recommended');});
 it('missing vessel imaging is not no occlusion for tirofiban',()=>{expect(visible({...ap,vesselOcclusion:[]})).not.toContain('tirofiban_no_occlusion');expect(visible(ap)).toContain('tirofiban_no_occlusion');});
 it('DAPT requires assessed mechanism/imaging/bleeding, not NIHSS alone',()=>{expect(visible(ap)).toContain('dapt_minor_stroke');for(const patch of [{noncardioembolicConfirmed:false},{antiplateletContraindicationsReviewed:false},{ctHemorrhageStatus:''},{lastDOACType:''},{tnkDecisionRecorded:false},{evtDecisionRecorded:false},{hemorrhagicTransformation:{detected:true}}])expect(visible({...ap,...patch})).not.toContain('dapt_minor_stroke');});
 it.each(['currentICH','activeInternalBleeding','recentGIGUBleeding','knownBleedingDiathesis','lowPlatelets'])('DAPT attestation cannot override %s',key=>expect(visible({...ap,tnkContraindicationChecklist:{[key]:true}})).not.toContain('dapt_minor_stroke'));
 it('DAPT does not use unknown or beyond24h timing as the standard branch',()=>{expect(visible({...ap,lkwUnknown:true})).not.toContain('dapt_minor_stroke');expect(visible(ap,{total:25,label:'LKW'})).not.toContain('dapt_minor_stroke');});
 it('ongoing status does not acquire a maintenance seizure recipe',()=>{const ids=visible({screeningTools:{seizureRisk:'status-epilepticus'}});expect(ids).toContain('status_epilepticus_protocol');expect(ids).not.toContain('seizure_acute_stroke');});
});
describe('current input and visible-source semantics',()=>{
 it('manual and complete-exam zeros are documented, partial/invalid inputs are not',()=>{expect(reviewed.documentedExamScore({nihss:'0'},0,false)).toBe(0);expect(reviewed.documentedExamScore({},0,true)).toBe(0);expect(reviewed.documentedExamScore({},0,false)).toBeNull();for(const v of [-1,43,1.9,'0x10','2abc',true])expect(reviewed.documentedExamScore({nihss:v})).toBeNull();});
 it('source does not silently clamp/truncate manual NIHSS or mark some items complete',()=>{const r=source.slice(source.indexOf('const encounterReadiness ='),source.indexOf('const encounterOutputGate ='));expect(r).toContain('nihssItems.every');expect(r).not.toContain('nihssItems.some');for(const id of ['phone-input-nihss','input-nihss']){const i=source.slice(source.indexOf('id="'+id+'"'),source.indexOf('min="0"',source.indexOf('id="'+id+'"')));expect(i).toContain('nihss: raw');expect(i).not.toContain('parseInt');expect(i).not.toContain('Math.min');}});
 it('withholds the unvalidated sICH prediction and Phone eligibility shortcuts',()=>{expect(source).not.toContain('sICH Risk Estimate (unvalidated heuristic');expect(source).toContain('No individual sICH risk category is assigned');expect(source).not.toContain('eligible for extended thrombolysis');expect(source).toContain("'Partial source screen met'");});
 it('keeps critical card qualifiers visible and distinguishes source grades',()=>{expect(cards.tnk_standard.recommendation).toContain('clinician confirms complete');expect(cards.bp_pre_tnk.recommendation).toContain('After IVT');expect(cards.evt_large_core_early.classOfRec).toBe('Statement');expect(cards.bp_post_evt_drip.classOfRec).toBe('IIa');expect(cards.doac_timing_af.medications).toHaveLength(0);expect(cards.hemorrhagic_transformation.detail).not.toContain('STOP TNK infusion');});
});


describe('Phone hemorrhage-risk duplicate withholding',()=>{
 it('preserves the two CT observations while withdrawing scores and risk colors',()=>{
  const a=source.indexOf('{/* CT observations are recorded without an unvalidated risk estimate. */}');
  const block=source.slice(a,source.indexOf('{/* ICH Quick Management */}',a));
  expect(a).toBeGreaterThan(0);
  expect(block).toContain('CT observations before thrombolysis');
  expect(block).toContain('unchecked fields do not establish absence');
  for(const field of ['earlyInfarctSigns','denseArterySign']){expect(block).toContain('checked={!!telestrokeNote.'+field+'}');expect(block).toContain(field+': c');}
  for(const withdrawn of ['SEDAN','SPAN-100','sedanAuto','riskLevel','(+1)','bg-ok-','bg-crit-'])expect(block).not.toContain(withdrawn);
  expect(source).not.toContain('sICH Risk Assessment</p>');
 });
 it.each([{age:'',nihss:''},{age:'90',nihss:'20'},{age:'90',nihss:''}])('does not recreate SPAN risk from contraindication alerts %#',note=>{
  const a=source.indexOf('const detectContraindications =');const b=source.indexOf('return alerts;',a)+'return alerts;'.length;
  const fn=vm.runInNewContext(source.slice(a,b)+'\n}; detectContraindications',{...reviewed,...calculators,ANTICOAGULANT_INFO:{},getWakeUpEligibilityForNote:()=>({})});
  const alerts=fn({telestrokeNote:note});expect(alerts.some(x=>/SPAN-100|Higher sICH risk/.test(x.label+' '+x.message))).toBe(false);
 });
 it('preserves a real pediatric warning when removing the SPAN-only calculation',()=>{
  const a=source.indexOf('const detectContraindications =');const b=source.indexOf('return alerts;',a)+'return alerts;'.length;
  const fn=vm.runInNewContext(source.slice(a,b)+'\n}; detectContraindications',{...reviewed,...calculators,ANTICOAGULANT_INFO:{},getWakeUpEligibilityForNote:()=>({})});
  expect(fn({telestrokeNote:{age:'8'}}).some(x=>x.label==='Pediatric Patient')).toBe(true);
 });
});
