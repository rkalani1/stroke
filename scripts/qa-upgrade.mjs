// Actual service-worker migration/failure tests on the production module graph.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchChromium, servePublished, waitForInstalled, waitForBrowserState, arg, outDir, setupIschemic } from './qa-smoke.mjs';
const baseline=path.resolve(arg('--baseline-dir','../baseline/site'));
const current=path.resolve(arg('--site-dir','output/site'));
const currentManifest=JSON.parse(await fs.readFile(path.join(current,'app-assets.json'),'utf8'));
const chunk=currentManifest.files.find(file=>file.path.startsWith('chunks/'))?.path;
const protocolChunk=currentManifest.files.find(file=>/ProtectedProtocols/.test(file.path))?.path;
assert(chunk,'Current build has no chunk to exercise atomic install failure');assert(protocolChunk,'Protected protocol chunk not found');
let serving=baseline, mode='normal', failPath=chunk;
const server=await servePublished(()=>serving,Number(arg('--port','4179')),(url)=>{
  if(mode==='asset-failure'&&url.pathname.endsWith('/'+failPath))return{status:503};
  if(mode==='interrupted'&&url.pathname.endsWith('/'+failPath))return{disconnect:true};
  return null;
});
const browser=await launchChromium();
const report={scope:'Actual archived-baseline/current service workers on localhost; injected network failures and cache corruption are simulations',baseline,current,checks:[]};
const check=async(name,fn)=>{try{const detail=await fn();report.checks.push({name,status:'passed',...(detail||{})});}catch(error){report.checks.push({name,status:'failed',error:error.stack||String(error)});console.error(`FAIL ${name}: ${error.message}`);}};
async function oldSession(){
  serving=baseline;mode='normal';const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'America/Los_Angeles'});const page=await context.newPage();page.setDefaultTimeout(15000);
  await page.goto(server.url+'#/encounter');await page.locator('#tabpanel-encounter').waitFor();await waitForInstalled(page,60000);await page.reload();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const numeric=page.locator('#tabpanel-encounter input[type="number"]:visible').first();await numeric.fill('83');
  const original=await page.evaluate(async()=>{const names=(await caches.keys()).filter(name=>name.startsWith('stroke-cache-v'));const cache=await caches.open(names[0]);const response=await cache.match(new URL('app.js',location.href).href);return{names,app:await response.text()};});
  return{context,page,numeric,original};
}
async function stage(page){await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});await waitForBrowserState(page,async()=>Boolean((await navigator.serviceWorker.getRegistration())?.waiting),null,60000);}
async function accept(page){await page.getByRole('button',{name:'Reload to update',exact:true}).click();await page.getByRole('heading',{name:'Encounter',exact:true}).waitFor({timeout:30000});assert.equal(await page.locator('.app-shell').getAttribute('data-version'),currentManifest.appVersion);}
try{
  await check('archived baseline upgrade waits; Later preserves active entered state and installed graph',async()=>{
    const session=await oldSession();try{const{page,numeric,original}=session;serving=current;await stage(page);await page.getByRole('button',{name:'Reload to update',exact:true}).waitFor();assert.equal(await numeric.inputValue(),'83');assert.equal(await page.locator('.app-shell').getAttribute('data-version'),null);
      await page.getByRole('button',{name:'Dismiss update notification',exact:true}).click();await page.waitForTimeout(1200);assert.equal(await numeric.inputValue(),'83');assert.equal(await page.locator('.app-shell').getAttribute('data-version'),null);
      const script=await page.evaluate(async()=>await(await fetch('app.js')).text());assert.equal(script,original.app,'waiting worker replaced old app.js');return{baselineCache:original.names,explicitDefer:true};
    }finally{await session.context.close();}
  });
  await check('explicit upgrade acceptance, retired-cache cleanup and unrelated cache preservation',async()=>{
    const session=await oldSession();try{const{page}=session;await page.evaluate(async()=>{const unrelated=await caches.open('unrelated-app-cache');await unrelated.put(new URL('/other/keep',location.origin),new Response('unrelated application'));const names=(await caches.keys()).filter(name=>name.startsWith('stroke-cache-v'));const cache=await caches.open(names[0]);await cache.put(new URL('documents/archived-teaching.pdf',location.href),new Response('retired synthetic teaching fixture'));});
      serving=current;await stage(page);assert.equal(await session.numeric.inputValue(),'83');await accept(page);await waitForBrowserState(page,async version=>(await caches.keys()).some(name=>name.includes(version.replaceAll('.','-'))),currentManifest.appVersion);
      const cachesState=await page.evaluate(async()=>{const names=await caches.keys();const retained=names.filter(name=>name.startsWith('stroke-cache-v'));const urls=[];for(const name of retained){for(const request of await(await caches.open(name)).keys())urls.push(request.url);}return{names,retained,urls,unrelated:await(await(await caches.open('unrelated-app-cache')).match(new URL('/other/keep',location.origin))).text()};});
      assert.equal(cachesState.retained.length,1);assert.equal(cachesState.unrelated,'unrelated application');assert(!cachesState.urls.some(url=>/documents\/|education|teaching|TrialScreener|deferred-reference/.test(url)));assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'');return{caches:cachesState.names,cacheEntries:cachesState.urls.length,acceptedReloadClearsSession:true};
    }finally{await session.context.close();}
  });
  for(const injected of ['interrupted','asset-failure'])await check(`${injected} update cannot replace working baseline; retry stages complete graph`,async()=>{
    const session=await oldSession();try{const{page,original}=session;serving=current;mode=injected;
      await page.evaluate(async()=>{window.__qaSWStates=[];const reg=await navigator.serviceWorker.getRegistration();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>window.__qaSWStates.push(worker.state));});await reg.update();});
      await page.waitForFunction(()=>window.__qaSWStates.includes('redundant'),null,{timeout:60000});assert.equal(await session.numeric.inputValue(),'83');const failed=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return{waiting:Boolean(reg.waiting),script:await(await fetch('app.js')).text()};});assert.equal(failed.waiting,false);assert.equal(failed.script,original.app);
      await session.context.setOffline(true);await page.reload();await page.locator('#tabpanel-encounter').waitFor();assert.equal(await page.locator('.app-shell').getAttribute('data-version'),null);await session.context.setOffline(false);mode='normal';await stage(page);await accept(page);return{failedAsset:failPath,failureStates:await page.evaluate(()=>window.__qaSWStates||[]),offlineBaselineReload:true,retryAccepted:true};
    }finally{await session.context.close();mode='normal';}
  });
  await check('additional open Stroke window blocks activation without reloading either encounter',async()=>{
    const session=await oldSession();try{const{page}=session;const other=await session.context.newPage();await other.goto(server.url+'#/encounter');await other.locator('#tabpanel-encounter').waitFor();serving=current;await stage(page);await page.getByRole('button',{name:'Reload to update',exact:true}).click();await page.getByText(/close other Stroke tabs/i).first().waitFor();assert.equal(await session.numeric.inputValue(),'83');assert.equal(await other.locator('.app-shell').getAttribute('data-version'),null);await other.close();await accept(page);return{blockedWithSecondClient:true,retryAfterClosingSecondClient:true};}finally{await session.context.close();}
  });
  await check('current-version deferred chunk corruption reports failure and preserves Encounter; network restoration and explicit recovery',async()=>{
    serving=current;mode='normal';const context=await browser.newContext({timezoneId:'America/Los_Angeles'});const page=await context.newPage();page.setDefaultTimeout(12000);try{
      await page.goto(server.url);await page.getByRole('heading',{name:'Encounter',exact:true}).waitFor();await waitForInstalled(page);await page.reload();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await setupIschemic(page);
      await page.evaluate(async relative=>{for(const name of await caches.keys())if(name.startsWith('stroke-cache-v'))await(await caches.open(name)).delete(new URL(relative,location.href));},protocolChunk);failPath=protocolChunk;mode='asset-failure';await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByText(/Unable to load protocols|Protocols unavailable|protocol.*could not|protocol.*unavailable/i).first().waitFor();
      await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');mode='normal';await page.getByRole('link',{name:'Protocols',exact:true}).click();const retry=page.getByRole('button',{name:/Retry|Try again|Reload to retry/i});if(await retry.count()){page.once('dialog',dialog=>dialog.accept());await retry.first().click();}else{await page.reload();}
      await page.locator('#mgmt-tabpanel-ischemic').waitFor();await page.screenshot({path:path.join(outDir,'chunk-recovery.png'),fullPage:true});return{asset:protocolChunk,preservedBeforeRecovery:true,recovery:'explicit retry or reload; no cross-tab encounter transfer'};
    }finally{await context.close();mode='normal';failPath=chunk;}
  });
}finally{await browser.close();await server.close();await fs.mkdir(outDir,{recursive:true});report.passed=report.checks.every(check=>check.status==='passed');await fs.writeFile(path.join(outDir,'qa-upgrade-report.json'),JSON.stringify(report,null,2)+'\n');console.log(`Upgrade QA ${report.passed?'PASS':'FAIL'} ${report.checks.filter(check=>check.status==='passed').length}/${report.checks.length}; output/playwright/qa-upgrade-report.json`);if(!report.passed)process.exitCode=1;}
