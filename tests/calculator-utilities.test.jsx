import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { ENCOUNTER_TOOLS, matchesCalculatorSearch, reviewedCalculatorText, calculatorProgress } from '../src/calculator-utilities.js';
import { updateSupplementaryField as edit } from '../src/supplementary-calculators.js';

const state = () => ({context:'acute', note:{diagnosisCategory:'tia',age:'59',presentingBP:'170/100',premorbidMRS:'0',name:'Unrelated note text'},gcs:{},dapt:{},supplementary:{}});
const definition = id => calculatorDefinitions.find(item => item.id === id);
const prepared = () => {
  let result = state();
  for (const [key,value] of Object.entries({tiaConfirmed:true,initialSystolic:'139',initialDiastolic:'89',clinicalFeatures:'other',duration:'under10',diabetes:false,reviewed:true})) result = edit(result,'abcd2',key,value);
  return result;
};

describe('calculator search and export boundaries', () => {
  it.each([['NIHSS','stroke scale'],['Renal calculation','Cockcroft-Gault'],['Lytic dose','TNK'],['GCS','Glasgow'],['ABCD²','abcd2'],['CHA₂DS₂-VASc','cha2ds2vasc'],['Modified Rankin scale descriptors','mrs'],['PHQ-2','depression'],['STOP-BANG','sleep apnea'],['Hunt–Hess grade','hunt hess']])('finds %s by %s', (name, query) => {
    const item = [...ENCOUNTER_TOOLS,...calculatorDefinitions].find(candidate => candidate.name === name);
    expect(matchesCalculatorSearch(item,query)).toBe(true);
    expect(matchesCalculatorSearch(item,'unmatched tool')).toBe(false);
  });
  it('exports explicit zero with source/limits and no unrelated Encounter fields', () => {
    const text = reviewedCalculatorText(prepared(),definition('abcd2'));
    expect(text).toContain('ABCD²: 0/7');
    expect(text).toContain(definition('abcd2').sourceUrl);
    expect(text).toContain(definition('abcd2').limits);
    expect(text).not.toContain('Unrelated note text');
    expect(text).not.toContain('139/89');
    // Copy needs a complete score, not the Encounter attestation.
    expect(reviewedCalculatorText(edit(prepared(),'abcd2','reviewed',false),definition('abcd2'))).toContain('ABCD²: 0/7');
    expect(reviewedCalculatorText({...prepared(),note:{...state().note,age:'60'}},definition('abcd2'))).toContain('ABCD²: 1/7');
    expect(reviewedCalculatorText(edit(prepared(),'abcd2','diabetes',undefined),definition('abcd2'))).toBe('');
    expect(reviewedCalculatorText({...prepared(),note:{...state().note,age:''}},definition('abcd2'))).toBe('');
  });
  it('labels mRS as a descriptor of the documented baseline entry', () => {
    expect(reviewedCalculatorText(state(),definition('mrs-descriptors'))).toContain('Baseline mRS descriptor 0: No symptoms.');
    expect(reviewedCalculatorText({...state(),note:{...state().note,premorbidMRS:''}},definition('mrs-descriptors'))).toBe('');
  });
  it('reports unanswered items and blocked applicability without a partial score', () => {
    let value = state();
    expect(calculatorProgress(value,definition('abcd2'))).toMatchObject({complete:false,unanswered:6,status:'6 items unanswered'});
    for (const [key,entry] of Object.entries({tiaConfirmed:true,initialSystolic:'139',initialDiastolic:'89',clinicalFeatures:'other',duration:'under10'})) value = edit(value,'abcd2',key,entry);
    expect(calculatorProgress(value,definition('abcd2'))).toMatchObject({complete:false,unanswered:1,status:'1 item unanswered'});
    expect(calculatorProgress({...value,note:{...value.note,age:''}},definition('abcd2')).status).toBe('1 item unanswered · Encounter age missing');
    value = edit(value,'abcd2','diabetes',false);
    expect(calculatorProgress(value,definition('abcd2'))).toMatchObject({complete:true,value:{score:0,max:7},status:''});
    expect(calculatorProgress(edit(value,'abcd2','tiaConfirmed',false),definition('abcd2')).status).toBe('Not scored: Clinical TIA diagnosis confirmed — No.');
    expect(calculatorProgress(edit(value,'abcd2','initialDiastolic','150'),definition('abcd2')).status).toBe('Not scored: check the entered values.');
    expect(calculatorProgress({...value,note:{...value.note,age:'17'}},definition('abcd2')).status).toBe('Not scored: Encounter age must be a whole number from 18 to 120.');
    expect(calculatorProgress(value,definition('pascal')).status).toBe('2 items unanswered · RoPE worksheet incomplete');
    expect(calculatorProgress(value,definition('aspects-regions'))).toMatchObject({unanswered:11,total:11});
    const wfns = edit(edit({...value,gcs:{eye:4,verbal:5,motor:6}},'wfns','sahConfirmed',true),'wfns','motorDeficit',true);
    expect(calculatorProgress(wfns,definition('wfns')).status).toContain('no WFNS category');
  });
});

describe('mounted search and copy', () => {
  let browser,page,script;
  beforeAll(async () => {
    const bundled = await build({bundle:true,write:false,format:'iife',platform:'browser',stdin:{resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx',contents:`
      import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
      import {CalculatorDirectory as Tools} from './src/Tools.jsx';import {calculatorDefinitions} from './src/supplementary-calculator-definitions.js';import {reconcileSupplementaryAppliedScores,updateSupplementaryField} from './src/supplementary-calculators.js';
      const root=createRoot(document.getElementById('root'));window.model=null;window.pending=[];window.copied=[];
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{window.copied.push(text);return new Promise((resolve,reject)=>window.pending.push({resolve,reject}));}}});
      const draw=()=>root.render(<Tools definitions={calculatorDefinitions} state={window.model} tool={window.tool} mapUrl="https://example.com" update={fn=>{window.model=reconcileSupplementaryAppliedScores(window.model,fn(window.model));flushSync(draw);}}/>);
      window.renderTools=(state,tool)=>{window.model=state;window.tool=tool;flushSync(draw)};
      window.editShared=(key,value)=>{window.model=reconcileSupplementaryAppliedScores(window.model,{...window.model,note:{...window.model.note,[key]:value}});flushSync(draw)};
      window.editWorksheet=(key,value)=>{window.model=updateSupplementaryField(window.model,'abcd2',key,value);flushSync(draw)};
      window.settle=(index,failed)=>failed?window.pending[index].reject(new Error('denied')):window.pending[index].resolve();
      window.hideTools=()=>flushSync(()=>root.render(null));
    `}});
    script=bundled.outputFiles[0].text;browser=await chromium.launch({headless:true});
  },30000);
  beforeEach(async()=>{page=await browser.newPage();await page.setContent('<div id="root"></div>');await page.addScriptTag({content:script});});
  afterEach(async()=>{await page?.close();});afterAll(async()=>{await browser?.close();});
  const mount = async (model=prepared(),tool) => page.evaluate(({model,tool})=>window.renderTools(model,tool),{model,tool});
  const copyButton = () => page.locator('#calc-abcd2').getByRole('button',{name:'Copy result'});
  it('searches both tool groups, gives a useful empty state, and preserves open edited worksheets',async()=>{
    await mount();
    await page.locator('#calc-abcd2 > summary').click();
    await page.getByLabel('TIA symptom duration').selectOption('60plus');
    await page.getByLabel('Find a calculator').fill('creatinine');
    expect(await page.getByRole('link',{name:'Renal calculation'}).isVisible()).toBe(true);
    expect(await page.locator('#calc-abcd2').isVisible()).toBe(false);
    expect(await page.getByText('1 calculator found.',{exact:true}).isVisible()).toBe(true);
    await page.getByLabel('Find a calculator').fill('not a calculator');
    expect(await page.getByText('No calculators found.',{exact:false}).isVisible()).toBe(true);
    await page.getByRole('button',{name:'Clear search'}).click();
    expect(await page.locator('#calc-abcd2').evaluate(node=>node.open)).toBe(true);
    expect(await page.getByLabel('TIA symptom duration').inputValue()).toBe('60plus');
    expect(await page.locator('#calc-abcd2').getByRole('status').textContent()).toContain('ABCD²: 2/7');
    expect(await copyButton().isEnabled()).toBe(true);
    await page.getByLabel('Find a calculator').fill('cha2ds2vasc');
    expect(await page.locator('#calc-chadsvasc').isVisible()).toBe(true);
    expect(await page.getByRole('link',{name:'Renal calculation'}).isVisible()).toBe(false);
  });
  it('requires a complete current score and exposes a selected fallback on clipboard failure',async()=>{
    await mount(state(),'abcd2');expect(await copyButton().isDisabled()).toBe(true);
    await mount(prepared(),'abcd2');expect(await copyButton().isEnabled()).toBe(true);
    await copyButton().click();await page.evaluate(()=>window.settle(0,true));
    const fallback=page.getByLabel('ABCD² copy fallback');
    await fallback.waitFor();expect(await fallback.getAttribute('readonly')).not.toBeNull();
    expect(await fallback.inputValue()).toContain('ABCD²: 0/7');
    expect(await fallback.evaluate(node=>node.selectionEnd-node.selectionStart)).toBe((await fallback.inputValue()).length);
    await page.getByLabel('TIA symptom duration').selectOption('60plus');
    expect(await fallback.count()).toBe(0);expect(await copyButton().isEnabled()).toBe(true);
    await page.getByLabel('TIA symptom duration').selectOption('');
    expect(await copyButton().isDisabled()).toBe(true);
    expect(await page.evaluate(()=>window.copied.length)).toBe(1);
  });
  it('acknowledges a current copy and ignores an older rejected request',async()=>{
    await mount(prepared(),'abcd2');
    await copyButton().click();await copyButton().click();
    await page.evaluate(()=>window.settle(1,false));
    await page.getByText('ABCD² copied.',{exact:true}).waitFor();
    await page.evaluate(()=>window.settle(0,true));
    expect(await page.getByText('ABCD² copied.',{exact:true}).isVisible()).toBe(true);
    expect(await page.getByLabel('ABCD² copy fallback').count()).toBe(0);
  });
  it.each([false,true])('ignores stale clipboard completion after worksheet edit/revert/review (failed=%s)',async failed=>{
    await mount(prepared(),'abcd2');await copyButton().click();
    await page.getByLabel('TIA symptom duration').selectOption('60plus');await page.getByLabel('TIA symptom duration').selectOption('under10');
    await page.locator('#calc-abcd2').getByRole('checkbox').check();
    await page.evaluate(failed=>window.settle(0,failed),failed);
    expect(await page.getByText('ABCD² copied.',{exact:true}).count()).toBe(0);expect(await page.getByLabel('ABCD² copy fallback').count()).toBe(0);
  });
  it.each([false,true])('ignores stale clipboard completion after shared-source edit/revert (failed=%s)',async failed=>{
    await mount(prepared(),'abcd2');await copyButton().click();
    await page.evaluate(()=>{window.editShared('age','60');window.editShared('age','59');window.editWorksheet('reviewed',true)});
    await page.evaluate(failed=>window.settle(0,failed),failed);
    expect(await page.getByText('ABCD² copied.',{exact:true}).count()).toBe(0);expect(await page.getByLabel('ABCD² copy fallback').count()).toBe(0);
  });
  it.each([false,true])('ignores stale clipboard completion after filter hide/reopen (failed=%s)',async failed=>{
    await mount(prepared(),'abcd2');await copyButton().click();
    await page.getByLabel('Find a calculator').fill('renal');await page.getByRole('button',{name:'Clear search'}).click();
    await page.evaluate(failed=>window.settle(0,failed),failed);
    expect(await page.getByText('ABCD² copied.',{exact:true}).count()).toBe(0);expect(await page.getByLabel('ABCD² copy fallback').count()).toBe(0);
  });
  it.each([false,true])('ignores stale clipboard completion after unmount/reopen (failed=%s)',async failed=>{
    await mount(prepared(),'abcd2');await copyButton().click();await page.evaluate(()=>window.hideTools());await mount(prepared(),'abcd2');
    await page.evaluate(failed=>window.settle(0,failed),failed);
    expect(await page.getByText('ABCD² copied.',{exact:true}).count()).toBe(0);expect(await page.getByLabel('ABCD² copy fallback').count()).toBe(0);
  });
  it('keeps deep links open and focused after a prior search',async()=>{
    await mount();await page.getByLabel('Find a calculator').fill('renal');await mount(prepared(),'abcd2');
    expect(await page.getByLabel('Find a calculator').inputValue()).toBe('');
    expect(await page.locator('#calc-abcd2').isVisible()).toBe(true);
    expect(await page.locator('#calc-abcd2').evaluate(node=>node.open)).toBe(true);
    expect(await page.getByLabel('Clinical TIA diagnosis confirmed').evaluate(node=>node===document.activeElement)).toBe(true);
    await page.getByLabel('Find a calculator').fill('renal');await mount(prepared(),'rope');await mount(prepared(),'abcd2');
    expect(await page.getByLabel('Find a calculator').inputValue()).toBe('');
    expect(await page.getByLabel('Clinical TIA diagnosis confirmed').evaluate(node=>node===document.activeElement)).toBe(true);
  });
});
