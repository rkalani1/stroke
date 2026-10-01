import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import * as calculators from '../src/supplementary-calculators.js';
import { calculatorDefinitions, sourceRecords } from '../src/supplementary-calculator-definitions.js';

const { calculateReviewedABCD2:abcd, calculateReviewedCHADS2VASc:chads, calculateReviewedHASBLED:hasBled, calculateReviewedRoPE:rope, classifyReviewedPASCAL:pascal, calculateReviewedPHASES:phases, calculateReviewedWFNS:wfns, calculateReviewedPHQ2:phq2, calculateReviewedSTOPBANG:stopBang, supplementaryResult, updateSupplementaryField:edit, applySupplementaryScore:apply, reconcileSupplementaryAppliedScores:reconcile } = calculators;
const ABCD = { reviewed:true, tiaConfirmed:true, age:59, bp:'139/89', clinicalFeatures:'other', duration:'under10', diabetes:false };
const CHADS = { reviewed:true, afConfirmed:true, age:64, sex:'M', chf:false, hypertension:false, diabetes:false, strokeTia:false, vascular:false };
const HAS = { reviewed:true, afConfirmed:true, age:65, uncontrolledHypertension:false, renal:false, liver:false, stroke:false, bleeding:false, labileINR:false, drugs:false, alcohol:false };
const ROPE = { reviewed:true, cryptogenicStrokeWithPfo:true, age:29, hypertension:false, diabetes:false, priorStrokeTia:false, smoker:false, corticalInfarct:true };
const PHASES = { reviewed:true, unrupturedSaccular:true, age:69, population:'northAmericaEurope', hypertension:false, sizeMm:6.9, earlierSAH:false, site:'ica' };
const STOP = { reviewed:true, age:50, sex:'F', weight:140, heightCm:200, neckCm:40, sb_snoring:false, sb_tired:false, sb_observed:false, sb_pressure:false };
const regionInput = regions => ({ reviewed:true, hemisphere:'left', regions:Object.fromEntries(regions.map(region => [region.key,false])) });
function caseState() { return { context:'acute', note:{ diagnosisCategory:'tia', age:'59', sex:'M', presentingBP:'139/89', premorbidMRS:'0' }, gcs:{}, dapt:{}, aspects:'', pcAspects:'', supplementary:{} }; }
function prepared(state,id,values) {
  for(const [key,value] of Object.entries(values)) if(key !== 'reviewed') state=edit(state,id,key,value);
  return edit(state,id,'reviewed',true);
}

describe('reviewed point assignments without outcome or treatment inference', () => {
  it.each([null,undefined,[],false,'',{}])('withholds every instrument for missing/malformed input %j', input => {
    for(const fn of [abcd,chads,hasBled,rope,pascal,phases,wfns,phq2,stopBang,calculators.calculateReviewedRegionalASPECTS,calculators.calculateReviewedRegionalPCASPECTS,calculators.describeReviewedHuntHess]) expect(fn(input)).toBeNull();
  });
  it.each(['',' ','60years','0x3c','NaN','Infinity',true,NaN,17,121,59.5])('does not coerce invalid age %j', age => {
    for(const [fn,input] of [[abcd,ABCD],[chads,CHADS],[hasBled,HAS],[rope,ROPE],[phases,PHASES],[stopBang,STOP]]) expect(fn({...input,age})).toBeNull();
  });
  it('does not treat unreviewed or missing booleans as explicitly negative', () => {
    for(const [fn,input,key] of [[abcd,ABCD,'diabetes'],[chads,CHADS,'chf'],[hasBled,HAS,'renal'],[rope,ROPE,'smoker'],[phases,PHASES,'earlierSAH'],[stopBang,STOP,'sb_pressure']]) {
      expect(fn({...input,reviewed:false})).toBeNull();expect(fn({...input,[key]:undefined})).toBeNull();expect(fn({...input,[key]:'false'})).toBeNull();
    }
  });
  it('calculates ABCD² boundaries and mutually exclusive symptom points', () => {
    expect(abcd(ABCD)).toEqual({score:0,max:7});
    expect(abcd({...ABCD,age:60})).toEqual({score:1,max:7});
    expect(abcd({...ABCD,bp:'140/89'}).score).toBe(1);expect(abcd({...ABCD,bp:'139/90'}).score).toBe(1);
    expect(abcd({...ABCD,clinicalFeatures:'speech',duration:'10to59'}).score).toBe(2);
    expect(abcd({...ABCD,age:60,bp:'140/90',clinicalFeatures:'weakness',duration:'60plus',diabetes:true})).toEqual({score:7,max:7});
    for(const bp of ['','140','140/','/90','140/90/80','140x/90','0/0','80/90']) expect(abcd({...ABCD,bp})).toBeNull();
    expect(abcd({...ABCD,tiaConfirmed:false})).toBeNull();
  });
  it('scores CHA₂DS₂-VASc age bands without double-counting age', () => {
    expect(chads(CHADS)).toEqual({score:0,max:9});expect(chads({...CHADS,age:65}).score).toBe(1);expect(chads({...CHADS,age:74}).score).toBe(1);expect(chads({...CHADS,age:75}).score).toBe(2);
    expect(chads({...CHADS,age:75,sex:'F',chf:true,hypertension:true,diabetes:true,strokeTia:true,vascular:true})).toEqual({score:9,max:9});
    expect(chads({...CHADS,sex:''})).toBeNull();expect(chads({...CHADS,afConfirmed:false})).toBeNull();
  });
  it('retains original HAS-BLED age >65 and separate renal/liver/drugs/alcohol points', () => {
    expect(hasBled(HAS)).toEqual({score:0,max:9});expect(hasBled({...HAS,age:66}).score).toBe(1);
    expect(hasBled({...HAS,renal:true,liver:true,drugs:true,alcohol:true}).score).toBe(4);
    expect(hasBled({...HAS,age:66,uncontrolledHypertension:true,renal:true,liver:true,stroke:true,bleeding:true,labileINR:true,drugs:true,alcohol:true})).toEqual({score:9,max:9});
  });
  it.each([[29,10],[30,9],[39,9],[40,8],[49,8],[50,7],[59,7],[60,6],[69,6],[70,5]])('scores RoPE age %i independently as %i', (age,score) => expect(rope({...ROPE,age}).score).toBe(score));
  it('gives explicit zero for complete RoPE and withholds unknown smoking/history', () => {
    expect(rope({...ROPE,age:70,hypertension:true,diabetes:true,priorStrokeTia:true,smoker:true,corticalInfarct:false})).toEqual({score:0,max:10});
    expect(rope({...ROPE,smoker:undefined})).toBeNull();
  });
  it.each([[6,false,false,'Unlikely'],[6,true,false,'Possible'],[7,false,false,'Possible'],[7,false,true,'Probable']])('classifies PASCAL %i/%s/%s as %s', (ropeScore,largeShunt,atrialSeptalAneurysm,category) => {
    expect(pascal({reviewed:true,age:60,cryptogenicStrokeWithPfo:true,ropeScore,largeShunt,atrialSeptalAneurysm})).toEqual({category,ropeScore});
  });
  it('withholds PASCAL for out-of-source age, unknown anatomy, blank or malformed RoPE', () => {
    const input={reviewed:true,age:60,cryptogenicStrokeWithPfo:true,ropeScore:7,largeShunt:true,atrialSeptalAneurysm:false};
    for(const change of [{age:61},{largeShunt:undefined},{atrialSeptalAneurysm:undefined},{ropeScore:''},{ropeScore:'7x'},{ropeScore:7.5},{ropeScore:11},{cryptogenicStrokeWithPfo:false}]) expect(pascal({...input,...change})).toBeNull();
  });
  it.each([[6.99,0],[7,3],[9.99,3],[10,6],[19.99,6],[20,10]])('scores PHASES diameter %s as %i', (sizeMm,score) => expect(phases({...PHASES,sizeMm}).score).toBe(score));
  it('requires explicit PHASES population/site and produces no rupture-risk table', () => {
    expect(phases(PHASES)).toEqual({score:0,max:22});expect(phases({...PHASES,population:'japanese'}).score).toBe(3);
    expect(phases({...PHASES,age:70,population:'finnish',hypertension:true,sizeMm:20,earlierSAH:true,site:'acaPcommPosterior'})).toEqual({score:22,max:22});
    expect(phases({...PHASES,site:'mca'}).score).toBe(2);
    for(const change of [{population:''},{site:''},{sizeMm:''},{sizeMm:0},{sizeMm:'10mm'},{unrupturedSaccular:false}]) expect(phases({...PHASES,...change})).toBeNull();
  });
  it('describes mRS explicit zero and Hunt–Hess manual grades without assigning an examination', () => {
    expect(calculators.describeReviewedMRS('0')).toMatchObject({score:0});for(const score of ['',true,'0x0',6.5,7]) expect(calculators.describeReviewedMRS(score)).toBeNull();
    expect(calculators.describeReviewedHuntHess({reviewed:true,sahConfirmed:true,grade:3})).toMatchObject({grade:3});expect(calculators.describeReviewedHuntHess({grade:3})).toBeNull();
  });
  it.each([[{eye:4,verbal:5,motor:6},false,1],[{eye:3,verbal:5,motor:6},false,2],[{eye:3,verbal:5,motor:6},true,3],[{eye:2,verbal:4,motor:6},true,4],[{eye:1,verbal:1,motor:4},false,5]])('derives WFNS from complete canonical GCS', (gcs,motorDeficit,grade) => expect(wfns({reviewed:true,sahConfirmed:true,gcs,motorDeficit})).toMatchObject({grade}));
  it('does not manufacture WFNS for untestable GCS or the original-table gap', () => {
    for(const gcs of [null,{}, {eye:4,verbal:'NT',motor:6}]) expect(wfns({reviewed:true,sahConfirmed:true,gcs,motorDeficit:false})).toBeNull();
    expect(wfns({reviewed:true,sahConfirmed:true,gcs:{eye:4,verbal:5,motor:6},motorDeficit:true})).toBeNull();
  });
  it('requires every imaging region and handles weighted pc-ASPECTS subtraction', () => {
    const anterior=regionInput(calculators.ASPECTS_REGIONS), posterior=regionInput(calculators.PC_ASPECTS_REGIONS);
    expect(calculators.calculateReviewedRegionalASPECTS(anterior)).toEqual({score:10,max:10});anterior.regions.C=true;expect(calculators.calculateReviewedRegionalASPECTS(anterior).score).toBe(9);delete anterior.regions.M6;expect(calculators.calculateReviewedRegionalASPECTS(anterior)).toBeNull();
    expect(calculators.calculateReviewedRegionalPCASPECTS(posterior).score).toBe(10);posterior.regions.pons=true;posterior.regions.midbrain=true;posterior.regions.thalamusLeft=true;expect(calculators.calculateReviewedRegionalPCASPECTS(posterior).score).toBe(5);
    for(const region of calculators.PC_ASPECTS_REGIONS) posterior.regions[region.key]=true;expect(calculators.calculateReviewedRegionalPCASPECTS(posterior)).toEqual({score:0,max:10});posterior.regions.pons=undefined;expect(calculators.calculateReviewedRegionalPCASPECTS(posterior)).toBeNull();
  });
  it('preserves complete-zero PHQ-2 and rejects partial/invalid frequencies', () => {
    expect(phq2({reviewed:true,phq2_q1:'0',phq2_q2:0})).toEqual({score:0,max:6});expect(phq2({reviewed:true,phq2_q1:3,phq2_q2:3})).toEqual({score:6,max:6});
    for(const change of [{phq2_q1:''},{phq2_q2:undefined},{phq2_q2:4},{phq2_q2:1.5}]) expect(phq2({reviewed:true,phq2_q1:0,phq2_q2:0,...change})).toBeNull();
  });
  it('uses strict shared STOP-BANG thresholds without re-entering age/sex/BMI', () => {
    expect(stopBang(STOP)).toEqual({score:0,max:8,bmi:35,bang:{bmi:false,age:false,neck:false,male:false}});
    expect(stopBang({...STOP,age:51,sex:'M',weight:140.01,neckCm:40.01,sb_snoring:true,sb_tired:true,sb_observed:true,sb_pressure:true})).toMatchObject({score:8,max:8});
    for(const change of [{heightCm:''},{weight:''},{neckCm:''},{sb_tired:undefined},{sex:''}]) expect(stopBang({...STOP,...change})).toBeNull();
  });
});

describe('canonical source review and explicit application', () => {
  it('has unique callable definitions and matching source IDs; never generates management or prognosis', () => {
    expect(new Set(calculatorDefinitions.map(item=>item.id)).size).toBe(calculatorDefinitions.length);
    for(const item of calculatorDefinitions) { expect(typeof calculators[item.fn]).toBe('function');expect(sourceRecords.some(source=>source.id===item.sourceIds[0])).toBe(true); }
    for(const output of [abcd(ABCD),chads(CHADS),hasBled(HAS),rope(ROPE),phases(PHASES)]) expect(Object.keys(output).sort()).toEqual(['max','score']);
  });
  it('never initializes callbacks/attestations from absence, and requires current shared-source review', () => {
    const empty=caseState();expect(supplementaryResult(empty,'abcd2')).toBeNull();expect(empty.supplementary).toEqual({});
    const reviewed=prepared(empty,'abcd2',ABCD);expect(supplementaryResult(reviewed,'abcd2').score).toBe(0);
    expect(supplementaryResult({...reviewed,note:{...reviewed.note,age:'60'}},'abcd2')).toBeNull();
    expect(supplementaryResult({...reviewed,note:{...reviewed.note,presentingBP:''}},'abcd2')).toBeNull();
    expect(supplementaryResult({...reviewed,context:'follow-up'},'abcd2')).toBeNull();
  });
  it('invalidates an applied zero before the next evaluation, including source clearing', () => {
    const reviewed=prepared(caseState(),'abcd2',ABCD), applied=apply(reviewed,'abcd2');expect(applied.dapt.abcd2).toBe(0);
    const edited=edit(applied,'abcd2','duration','60plus');expect(edited.dapt.abcd2).toBe('');expect(edited.supplementary.applied.abcd2).toBeUndefined();
    const sourceEdit={...applied,note:{...applied.note,presentingBP:''}};expect(reconcile(applied,sourceEdit).dapt.abcd2).toBe('');
    expect(reconcile(applied,{...applied,revision:99}).dapt.abcd2).toBe(0);
  });
  it('preserves a newer manual score while removing obsolete provenance', () => {
    const applied=apply(prepared(caseState(),'abcd2',ABCD),'abcd2');
    const manual={...applied,dapt:{...applied.dapt,abcd2:'4'}};const edited=edit(manual,'abcd2','diabetes',true);
    expect(edited.dapt.abcd2).toBe('4');expect(edited.supplementary.applied.abcd2).toBeUndefined();
  });
  it('does not overwrite manual regional scores until explicit application; subsequent imaging edits invalidate', () => {
    const state={...caseState(),note:{...caseState().note,diagnosisCategory:'ischemic',ctResults:'Reviewed image'},aspects:'7'};
    const reviewed=prepared(state,'aspects-regions',regionInput(calculators.ASPECTS_REGIONS));expect(reviewed.aspects).toBe('7');
    const applied=apply(reviewed,'aspects-regions');expect(applied.aspects).toBe(10);
    const changed={...applied,note:{...applied.note,ctResults:'New image'}};expect(supplementaryResult(changed,'aspects-regions')).toBeNull();expect(reconcile(applied,changed).aspects).toBe('');
    expect(apply({...reviewed,context:'follow-up'},'aspects-regions').aspects).toBe('7');
  });
  it('PASCAL cannot substitute an unreviewed or manually entered RoPE total', () => {
    const state={...caseState(),note:{...caseState().note,age:'29'}};
    const morph=prepared(state,'pascal',{largeShunt:true,atrialSeptalAneurysm:false,ropeScore:10});expect(supplementaryResult(morph,'pascal')).toBeNull();
    const ropeComplete=prepared(morph,'rope',ROPE);expect(supplementaryResult(ropeComplete,'pascal')).toBeNull();
    const full=edit(ropeComplete,'pascal','reviewed',true);expect(supplementaryResult(full,'pascal')).toMatchObject({category:'Probable'});
    expect(supplementaryResult(edit(full,'rope','smoker',undefined),'pascal')).toBeNull();
  });
});

describe('mounted calculator controls', () => {
  let browser,page,script;
  beforeAll(async () => {
    const bundled=await build({bundle:true,write:false,format:'iife',platform:'browser',stdin:{resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx',contents:`
      import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
      import SupplementaryCalculators from './src/components/SupplementaryCalculators.jsx';
      import {reconcileSupplementaryAppliedScores} from './src/supplementary-calculators.js';
      const root=createRoot(document.getElementById('root'));window.calls=0;
      const draw=()=>root.render(<SupplementaryCalculators state={window.model} tool={window.tool} update={update=>{window.calls++;const prev=window.model;window.model=reconcileSupplementaryAppliedScores(prev,typeof update==='function'?update(prev):update);draw();}}/>);
      window.renderTools=(state,tool)=>{window.model=state;window.tool=tool;flushSync(draw)};
      window.editShared=(key,value)=>{const previous=window.model;window.model=reconcileSupplementaryAppliedScores(previous,{...previous,note:{...previous.note,[key]:value}});flushSync(draw)};
    `}});script=bundled.outputFiles[0].text;browser=await chromium.launch({headless:true});
  },30000);
  beforeEach(async()=>{page=await browser.newPage();await page.setContent('<div id="root"></div>');await page.addScriptTag({content:script});});
  afterEach(async()=>{await page?.close();});afterAll(async()=>{await browser?.close();});
  it('mounts all definitions with no invented score or initialization callbacks',async()=>{
    await page.evaluate(state=>window.renderTools(state),caseState());
    for(const item of calculatorDefinitions) expect(await page.locator(`#calc-${item.id}`).count()).toBe(1);
    expect(await page.evaluate(()=>window.calls)).toBe(0);
    expect(await page.locator('input[type="checkbox"]:checked').count()).toBe(0);
    expect(await page.locator('input[aria-label="Age"],input[aria-label="Sex"]').count()).toBe(0);
  });
  it('opens/focuses a lazy-mounted target, preserves input focus, and synchronously withdraws an applied result on shared clearing',async()=>{
    await page.evaluate(state=>window.renderTools(state,'abcd2'),caseState());
    expect(await page.locator('#calc-abcd2').evaluate(node=>node.open)).toBe(true);
    const applicable=page.getByLabel('Clinical TIA diagnosis confirmed');expect(await applicable.evaluate(node=>node===document.activeElement)).toBe(true);
    await applicable.selectOption('true');expect(await applicable.evaluate(node=>node===document.activeElement)).toBe(true);
    await page.getByLabel('TIA clinical features').selectOption('other');await page.getByLabel('TIA symptom duration').selectOption('under10');await page.locator('#calc-abcd2').getByLabel('History of diabetes',{exact:true}).selectOption('false');
    await page.getByRole('checkbox').check();expect(await page.getByRole('status').textContent()).toContain('ABCD²: 0/7');
    await page.getByRole('button',{name:'Use reviewed score in Encounter'}).click();expect(await page.evaluate(()=>window.model.dapt.abcd2)).toBe(0);
    await page.evaluate(()=>window.editShared('age',''));expect(await page.getByRole('status').textContent()).toContain('no score');expect(await page.evaluate(()=>window.model.dapt.abcd2)).toBe('');expect(await page.getByRole('checkbox').isChecked()).toBe(false);
    expect(await page.getByRole('link',{name:'Review shared inputs in Encounter'}).getAttribute('href')).toBe('#/encounter');
  });
  it('handles an unknown malformed route safely',async()=>{
    await page.evaluate(state=>window.renderTools(state,'bad]route'),caseState());expect(await page.getByRole('status').textContent()).toBe('Calculator unavailable.');
  });
});
