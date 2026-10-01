import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { validReferenceData, searchReference, referenceText } from '../src/reference-search.js';
import { readClinicalReference } from '../scripts/reference-data.mjs';
const data = readClinicalReference();
const envelope = { _meta: { appVersion: 'test', schemaVersion: '2.0.0' }, data };
let browser, script;
beforeAll(async () => {
  script = (await build({bundle:true,write:false,format:'iife',stdin:{resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx',contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom'; import Reference from './src/Reference.jsx'; import Tools from './src/Tools.jsx'; import {newEncounter} from './src/workspace-state.js';
    const root=createRoot(document.getElementById('root')); window.renderReference=(props={})=>flushSync(()=>root.render(<Reference version="test" {...props}/>)); window.renderCalculators=()=>flushSync(()=>root.render(<Tools version="test" state={newEncounter()} update={()=>{}}/>)); window.renderReference();
  `}})).outputFiles[0].text;
  browser=await chromium.launch({headless:true});
},30000);
afterAll(async()=>browser?.close());
async function pageWith(options={}) {
  const page=await browser.newPage();
  await page.setContent('<div id="root"></div>');
  await page.evaluate(({envelope,options})=>{
    window.envelope=envelope;window.requests=0;
    window.fetch=async()=>{window.requests++;if(options.fail && window.requests===1) throw Error('offline');return {ok:true,json:async()=>options.mismatch && window.requests===1?{...envelope,_meta:{...envelope._meta,appVersion:'old'}}:window.envelope};};
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{window.copied=text;if(options.deferred)return new Promise((resolve,reject)=>{window.resolveCopy=resolve;window.rejectCopy=reject;});if(options.denied)return Promise.reject(Error('denied'));return Promise.resolve();}}});
  },{envelope,options});
  await page.addScriptTag({content:script});return page;
}
describe('curated reference integrity and interaction',()=>{
  it('rejects incompatible and malformed records before rendering',()=>{
    expect(validReferenceData(envelope,'test')).toBe(true);
    for(const mutate of [e=>e._meta.appVersion='old',e=>e.data.topics[0].consider=null,e=>e.data.studies[0].relatedTopic='missing',e=>e.data.topics[0].related=[{label:'bad',href:'javascript:alert(1)'}],e=>e.data.topics[0].keywords=null,e=>e.data.topics.push(e.data.topics[0]),e=>e.data.calculators[0].fields=null,e=>e.data.calculators[0].shared=['missing'],e=>e.data.topics[0].category='',e=>e.data.calculators.find(d=>d.fields.some(f=>f.type==='number')).fields.find(f=>f.type==='number').options={bad:'object'} ]){const next=structuredClone(envelope);mutate(next);expect(validReferenceData(next,'test')).toBe(false);}
    const unrelated=structuredClone(envelope);unrelated.data.studies[0].relatedTopic='';expect(validReferenceData(unrelated,'test')).toBe(true);
    expect(searchReference(data.topics,'PFO','clinic').some(r=>r.id==='pfo')).toBe(true);
    expect(searchReference(data.studies,'ICH','on-call').length).toBeGreaterThan(0);
    expect(referenceText(data.studies[0])).toContain(data.studies[0].sources[0].url);
    expect(referenceText(data.studies[0])).toContain(data.studies[0].limits);
  });
  it.each(['fail','mismatch'])('retries %s downloads without reload',async(kind)=>{
    const page=await pageWith({[kind]:true});try{
      await page.getByRole('button',{name:'Retry reference download'}).waitFor();
      await page.getByRole('button',{name:'Retry reference download'}).click();
      await page.getByLabel('Find a clinical question').waitFor();expect(await page.locator('.reference-card').count()).toBe(data.topics.length);
      expect(await page.evaluate(()=>window.requests)).toBe(2);
    }finally{await page.close();}
  });
  it('filters questions, preserves sources in manual copy and limits related studies',async()=>{
    const page=await pageWith({denied:true});try{
      await page.getByLabel('Find a clinical question').fill('PFO');await page.getByLabel('Care setting').selectOption('clinic');await page.getByLabel('Clinical section').selectOption('Stroke mechanisms and vascular disorders');
      const card=page.locator('[data-reference-id="pfo"]');await card.locator('summary').click();await card.getByRole('button').click();
      const fallback=page.getByLabel('Evidence copy fallback');await fallback.waitFor();expect(await fallback.inputValue()).toContain('Limits:');expect(await fallback.inputValue()).toContain('https://');
      await page.getByLabel('Find a clinical question').fill('no matches xyz');expect(await fallback.count()).toBe(0);expect(await page.locator('.reference-card').count()).toBe(0);
      const session=await page.context().newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:4});
      await page.evaluate(()=>window.renderReference({focusId:'af-timing'}));
      await page.waitForFunction(()=>document.querySelector('[data-reference-id="af-timing"]')?.open && document.activeElement.closest('[data-reference-id]')?.dataset.referenceId==='af-timing');
      expect(await page.getByLabel('Find a clinical question').inputValue()).toBe('');expect(await page.getByLabel('Clinical section').inputValue()).toBe('all');
      await session.send('Emulation.setCPUThrottlingRate',{rate:1});
      await page.evaluate(()=>window.renderReference({mode:'studies',focusId:'topic-af-timing'}));await page.getByText('Show all completed evidence',{exact:true}).waitFor();
      expect(await page.locator('.reference-card').count()).toBe(3);expect(await page.getByText('Reference not found.',{exact:false}).count()).toBe(0);
      await page.evaluate(()=>window.renderReference({mode:'studies',focusId:'elan'}));await page.waitForFunction(()=>document.querySelector('[data-reference-id="elan"]').open && document.activeElement.closest('[data-reference-id]')?.dataset.referenceId==='elan');
      expect(await page.evaluate(()=>document.activeElement.closest('[data-reference-id]')?.dataset.referenceId)).toBe('elan');expect(await page.evaluate(()=>window.requests)).toBe(1);
    }finally{await page.close();}
  });
  it('shares the validated static download with Calculators and keeps collapsed card bodies out of the DOM',async()=>{
    const page=await pageWith();try{
      await page.getByLabel('Find a clinical question').waitFor();expect(await page.locator('.reference-body').count()).toBe(0);
      await page.evaluate(()=>window.renderCalculators());await page.getByRole('heading',{name:'Calculators',exact:true}).waitFor();
      expect(await page.locator('.supplementary-calculators .tool-target').count()).toBe(data.calculators.length);expect(await page.evaluate(()=>window.requests)).toBe(1);
    }finally{await page.close();}
  });
  it('ignores delayed clipboard results after navigation',async()=>{
    const page=await pageWith({deferred:true});try{
      await page.locator('[data-reference-id="pfo"] summary').click();await page.locator('[data-reference-id="pfo"]').getByRole('button').click();
      await page.locator('[data-reference-id="pfo"] summary').click();await page.evaluate(()=>window.rejectCopy(Error('denied')));
      await page.locator('[data-reference-id="pfo"] summary').click();expect(await page.getByLabel('Evidence copy fallback').count()).toBe(0);
      await page.locator('[data-reference-id="pfo"]').getByRole('button').click();
      await page.evaluate(()=>window.renderReference({active:false}));await page.evaluate(()=>window.rejectCopy(Error('denied')));
      expect(await page.getByLabel('Evidence copy fallback').count()).toBe(0);
      await page.evaluate(()=>window.renderReference({active:true}));expect(await page.getByText('Copied with sources and limits.').count()).toBe(0);
    }finally{await page.close();}
  });
});
