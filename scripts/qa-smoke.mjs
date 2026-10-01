// Render the published artifact, with synthetic fixtures and explicit outcomes.
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
export const arg = (name, fallback) => { if (!args.includes(name)) return fallback; const value=args[args.indexOf(name)+1]; if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`); return value; };
export const outDir = path.resolve('output/playwright');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
export async function launchChromium() {
  const options = [...(process.env.STROKE_CHROMIUM_PATH ? [{ executablePath: process.env.STROKE_CHROMIUM_PATH }] : []), { channel: 'chromium' }, {}];
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  try { for (const dir of fsSync.readdirSync(cache)) {
    const exe = path.join(cache, dir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    if (dir.startsWith('chromium-') && fsSync.existsSync(path.join(cache, dir, 'INSTALLATION_COMPLETE')) && fsSync.existsSync(exe)) options.push({ executablePath: exe });
  } } catch {}
  let last; for (const option of options) { try { return await chromium.launch(option); } catch (error) { last = error; } } throw last;
}
export async function servePublished(getRoot, port = 4177, override = () => null) {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost'); requests.push(url.pathname);
    const blocked = override(url, request);
    if (blocked?.disconnect) { response.destroy(); return; }
    if (blocked) { response.writeHead(blocked.status || 503, { 'Content-Type': blocked.type || 'text/plain', 'Cache-Control': 'no-store' }); response.end(blocked.body || 'Injected unavailable asset'); return; }
    if (!url.pathname.startsWith('/stroke/')) { response.writeHead(404); response.end('Not found'); return; }
    let relative; try { relative = decodeURIComponent(url.pathname.slice('/stroke/'.length)); } catch { response.writeHead(400); response.end(); return; }
    const root = path.resolve(getRoot()); const file = path.resolve(root, relative || 'index.html');
    if (!file.startsWith(`${root}${path.sep}`)) { response.writeHead(403); response.end(); return; }
    try { const body = await fs.readFile(file); response.writeHead(200, { 'Content-Type': `${MIME[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' }); response.end(body); }
    catch { response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${port}/stroke/`, requests, close: () => new Promise(resolve => server.close(resolve)) };
}
export async function waitForBrowserState(page, predicate, argument = null, timeout = 45000) {
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline) { if(await page.evaluate(predicate,argument)) return; await new Promise(resolve=>setTimeout(resolve,100)); }
  throw new Error(`Browser state did not become ready within ${timeout} ms`);
}
export async function waitForInstalled(page, timeout = 45000) {
  await waitForBrowserState(page, async () => { const reg = await navigator.serviceWorker.getRegistration(); return reg?.active?.state === 'activated'; }, null, timeout);
}
export async function localStamp(page, minutesAgo = 30) {
  return page.evaluate(minutes => { const d = new Date(Date.now() - minutes * 60000), p = x => String(x).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }, minutesAgo);
}
export async function reset(page) {
  await page.getByRole('link', { name: 'Stroke', exact: true }).click();
  await page.getByRole('button', { name: 'New encounter', exact: true, includeHidden: true }).evaluate(button => { button.closest('details').open = true; });
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'New encounter', exact: true, includeHidden: true }).click();
  await page.getByLabel('Age (years)', { exact: true }).waitFor();
  assert.equal(await page.locator('.workspace-utilities').evaluate(element => element.open), false);
}
export async function setupIschemic(page) {
  await page.getByLabel('Working diagnosis', { exact: true }).selectOption('ischemic');
  await page.getByLabel('Age (years)', { exact: true }).fill('65'); await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).fill('83');
  const stamp = await localStamp(page); await page.getByLabel('LKW date (local)', { exact: true }).fill(stamp.split('T')[0]); await page.getByLabel('LKW time (local)', { exact: true }).fill(stamp.split('T')[1]);
  await page.getByLabel('Selected IV thrombolytic', { exact: true }).selectOption('TNK');
}
export async function generate(page) {
  const label = await page.getByLabel('Consultation', { exact: true }).inputValue() === 'video' ? 'Epic note' : 'Pulsara summary';
  await page.getByRole('button', { name: `Generate ${label}`, exact: true }).click();
  return page.getByLabel(`Generated ${label}`, { exact: true });
}
export async function openDetails(control) { await control.evaluate(element => { for(let e=element;e;e=e.parentElement) if(e.tagName==='DETAILS') e.open=true; }); }

function latencyConfiguration() {
  const defaults={flat:{},adaptive:{runThresholdByTargetViewport:{'local/desktop':40000,'local/tablet':43000,'local/mobile':46000,'live/desktop':42000,'live/tablet':45000,'live/mobile':50000},sectionThresholdBySection:{'encounter-workflow':22000,'library-workflow':18000,'pediatric-workflow':20000}}};
  const file=arg('--latency-profiles-file',null);let profiles=defaults;
  if(file){const parsed=JSON.parse(fsSync.readFileSync(path.resolve(file),'utf8'));profiles={...defaults,...(parsed.profiles||parsed)};}
  const name=arg('--latency-profile','flat');if(!profiles[name])throw new Error(`Unknown latency profile: ${name}`);
  for(const [profile,config] of Object.entries(profiles)) {
    if(!config||typeof config!=='object'||Array.isArray(config))throw new Error(`Invalid latency profile ${profile}`);
    for(const key of ['runThresholdByTargetViewport','sectionThresholdBySection','sectionThresholdByTargetViewportSection'])for(const [scope,value] of Object.entries(config[key]||{}))if(!Number.isFinite(value)||value<=0)throw new Error(`Invalid latency ceiling ${profile}.${key}.${scope}`);
  }
  const integer=(flag,fallback)=>{const raw=arg(flag,String(fallback));const value=Number(raw);if(!Number.isInteger(value)||value<=0)throw new Error(`Invalid or missing positive integer for ${flag}`);return value;};
  const run=integer('--run-duration-threshold-ms',45000), section=integer('--section-duration-threshold-ms',15000), profile=profiles[name];
  return {name,file,enforce:args.includes('--enforce-latency-thresholds'),run:(target,viewport)=>{const ceiling=profile.runThresholdByTargetViewport?.[`${target}/${viewport}`]||run;return args.includes('--run-duration-threshold-ms')?Math.min(run,ceiling):ceiling;},section:(target,viewport,key)=>{const ceiling=profile.sectionThresholdByTargetViewportSection?.[`${target}/${viewport}:${key}`]||profile.sectionThresholdBySection?.[key]||section;return args.includes('--section-duration-threshold-ms')?Math.min(section,ceiling):ceiling;}};
}
async function main() {
  const latency=latencyConfiguration();
  await fs.mkdir(outDir, { recursive: true });
  const site = path.resolve(arg('--site-dir', 'output/site'));
  if (!fsSync.existsSync(path.join(site, 'index.html'))) throw new Error('Published QA artifact missing. Run npm run publish:stage or supply an explicit --site-dir.');
  const server = await servePublished(() => site, Number(arg('--port', '4177')));
  const browser = await launchChromium();
  const report = { scope: 'Rendered production artifact; Chromium simulations, not physical devices', site, checks: [], screenshots: [], metrics: {}, runs: [], latency: {profile:latency.name,profilesFile:latency.file,enforced:latency.enforce}, live: { status: 'not run', reason: '--local-only or no --live; no implied deployed verification' } };
  const check = async (name, fn) => { const started = performance.now(); try { const details = await fn(); report.checks.push({ name, status: 'passed', durationMs: Math.round(performance.now()-started), ...(details || {}) }); } catch(error) { report.checks.push({ name, status: 'failed', error: error.stack || String(error) }); console.error(`FAIL ${name}: ${error.message}`); } };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Los_Angeles' });
    await context.addInitScript(() => {
      window.__qaClipboard = []; window.__qaDenyClipboard = false; window.__qaStorageWrites = []; window.__qaIndexedDB = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { if(window.__qaDenyClipboard) throw new DOMException('Denied', 'NotAllowedError'); window.__qaClipboard.push(text); } } });
      const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value) { window.__qaStorageWrites.push([key,value]); return write.call(this,key,value); };
      const open = indexedDB.open.bind(indexedDB); indexedDB.open = function(...values) {window.__qaIndexedDB.push(values);return open(...values);};
    });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    const errors=[], failedResources=[], requestUrls=[], consoleMessages=[];
    page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', req => failedResources.push({url:req.url(),error:req.failure()?.errorText})); page.on('request', req => requestUrls.push(req.url())); page.on('console',message=>consoleMessages.push({type:message.type(),text:message.text()}));
    await check('default Encounter, public build on localhost, retired primary portal absent', async () => {
      const started=performance.now(); await page.goto(server.url); await page.getByRole('heading',{name:'Encounter',exact:true}).waitFor(); report.metrics.usableEncounterMs=Math.round(performance.now()-started);report.metrics.initialJsTransferBytes=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>new URL(x.name).pathname.endsWith('.js')).reduce((sum,x)=>sum+x.transferSize,0));
      assert.equal(await page.locator('.app-shell').getAttribute('data-demo'),'synthetic'); assert.equal(new URL(page.url()).hash,'#/encounter');
      for(const name of ['Education','Trials','Guidelines & References','Bedside','Teaching']) assert.equal(await page.getByRole('tab',{name,exact:true}).count(),0);
      assert.equal(await page.getByRole('link',{name:'Protocols',exact:true}).count(),1);
    });
    await check('keyboard skip preserves Encounter and Protocols routes, focus and session entries', async () => {
      await page.getByLabel('Age (years)', { exact: true }).fill('65');
      try {
        for (const hash of ['#/encounter', '#/protocols/ischemic']) {
          await page.evaluate(hash => { location.hash = hash; }, hash);
          if (hash.includes('protocols')) await page.locator('#mgmt-tabpanel-ischemic').waitFor();
          const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
          await skip.focus(); await page.keyboard.press('Enter');
          assert.equal(new URL(page.url()).hash, hash);
          assert.equal(await page.evaluate(() => document.activeElement.id), 'workspace-main');
        }
      } finally {
        await page.getByRole('link', { name: 'Stroke', exact: true }).click();
      }
      assert.equal(await page.getByLabel('Age (years)', { exact: true }).inputValue(), '65');
    });
    await check('telephone Pulsara and video Epic templates reuse entries and invalidate after switching', async () => {
      await setupIschemic(page);
      await openDetails(page.getByLabel('Chief complaint', { exact: true }));
      await page.getByLabel('Chief complaint', { exact: true }).fill('Focal weakness');
      await page.getByLabel('Presenting symptoms / HPI', { exact: true }).fill('QA symptoms entered for documentation.');
      await page.getByLabel('Manual rationale / recommendations', { exact: true }).fill('QA specialist review pending.');
      const phone = await (await generate(page)).inputValue();
      assert(phone.includes('Focal weakness') || phone.includes('QA symptoms'));
      assert(phone.includes('NIHSS score: incomplete'));
      assert(!/SYNTHETIC|EDUCATIONAL DEMO|NO PHI|NOT A REAL CLINICAL NOTE|Acute telephone consultation/i.test(phone));
      await page.getByLabel('Consultation', { exact: true }).selectOption('video');
      assert.equal(await page.locator('[data-generated-note]').count(), 0);
      const video = await (await generate(page)).inputValue();
      for (const section of ['Reason for Consultation:', 'Chief complaint:', 'HPI:', 'Objective:', 'Imaging findings:', 'Assessment and Plan:', 'Recommendations:', 'Clinician Name']) assert(video.includes(section));
      assert(video.includes('QA specialist review pending.'));
      assert(!/SYNTHETIC|EDUCATIONAL DEMO|NO PHI|NOT A REAL CLINICAL NOTE|Acute video consultation/i.test(video));
      await page.getByRole('link', { name: 'Calculators & Links', exact: true }).click();
      assert.equal(await page.getByRole('heading', { name: 'Retained primary sources', exact: true }).count(), 0);
      assert(!(await page.locator('main').innerText()).includes('archival Git ref'));
      await reset(page);
    });
    await check('restored Trials navigation, three views and unchanged Encounter session', async () => {
      try {
      await page.getByLabel('Age (years)', { exact: true }).fill('67');
      await page.getByRole('link', { name: 'Trials', exact: true }).click();
      await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
      const screen = page.getByRole('tabpanel', { name: 'Screener', exact: true });
      await screen.getByText('Choose a classification to see possible study profiles.', { exact: true }).waitFor({ state: 'visible' });
      await screen.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      await screen.getByRole('button', { name: /4.5 – 24h/ }).click();
      await screen.getByRole('heading', { name: /^Possible candidates/ }).waitFor({ state: 'visible' });
      await page.getByRole('tab', { name: 'Tables', exact: true }).click();
      const tables = page.getByRole('tabpanel', { name: 'Tables', exact: true });
      await tables.getByRole('button', { name: 'Ischemic Stroke', exact: true }).waitFor({ state: 'visible' });
      await page.getByRole('tab', { name: 'Database', exact: true }).click();
      const database = page.getByRole('tabpanel', { name: 'Database', exact: true });
      await database.getByRole('searchbox', { name: 'Search the study database by acronym, name or NCT number', exact: true }).fill('STEP');
      assert((await database.innerText()).includes('STEP'));
      assert(!(await database.innerText()).includes('PICASSO'));
      await page.screenshot({ path: path.join(outDir, 'trials-desktop.png'), fullPage: true });
      await page.getByRole('link', { name: 'Stroke', exact: true }).click();
      assert.equal(await page.getByLabel('Age (years)', { exact: true }).inputValue(), '67');
      await page.getByRole('link', { name: 'Trials', exact: true }).click();
      await page.getByRole('tab', { name: 'Screener', exact: true }).click();
      assert.equal(await screen.getByRole('button', { name: 'Ischemic stroke', exact: true }).getAttribute('aria-pressed'), 'true');
      await reset(page);
      await page.getByRole('link', { name: 'Trials', exact: true }).click();
      await screen.getByText('Choose a classification to see possible study profiles.', { exact: true }).waitFor({ state: 'visible' });
      const visibleText = await page.locator('main').innerText();
      assert(!/synthetic|public demo|educational demo|no PHI|not a real clinical note/i.test(visibleText));
      } finally { await reset(page); }
    });
    await check('protocol clocks show validated LKW and Discovery components', async () => {
      try {
      await setupIschemic(page);
      await page.getByRole('link', { name: 'Protocols', exact: true }).click();
      await openDetails(page.getByText(/Auto time: LKW: 0h 3\dm/));
      await page.getByText(/Auto time: LKW: 0h 3\dm/).waitFor();
      assert(!(await page.locator('main').innerText()).includes('undefinedh'));
      await page.getByRole('link', { name: 'Stroke', exact: true }).click();
      const stamp = await localStamp(page, 45);
      await openDetails(page.getByLabel('Discovery date (local)', { exact: true }));
      await page.getByLabel('Discovery date (local)', { exact: true }).fill(stamp.split('T')[0]);
      await page.getByLabel('Discovery time (local)', { exact: true }).fill(stamp.split('T')[1]);
      await page.getByLabel('Last known well is unknown', { exact: true }).check();
      await page.getByRole('link', { name: 'Protocols', exact: true }).click();
      await openDetails(page.getByText(/Auto time: Discovery: 0h 4\dm/));
      await page.getByText(/Auto time: Discovery: 0h 4\dm/).waitFor();
      assert(!(await page.locator('main').innerText()).includes('undefinedh'));
      } finally { await reset(page); }
    });
    await check('protocol reference inputs never attest unrecorded safety-pause events', async () => {
      try {
      await page.getByRole('link', { name: 'Protocols', exact: true }).click();
      const cards = page.getByRole('region', { name: 'Protocol cards', exact: true });
      await openDetails(cards);
      await cards.getByLabel(/^Consent type/).selectOption('informed');
      await cards.getByLabel('BP at attestation', { exact: true }).fill('178/96');
      await cards.getByLabel(/^Contraindications/).selectOption('reviewed');
      await cards.getByLabel(/^Provider agreement/).selectOption('confirmed');
      assert(await cards.getByRole('button', { name: 'Copy completed safety pause', exact: true }).isDisabled());
      const text = await cards.getByLabel('Safe Pause reference checklist (read-only)', { exact: true }).inputValue();
      assert(text.includes('Completed attestation unavailable'));
      assert(!/Dose confirmed|Pause performed|Pause confirmed|Safety pause documented/.test(text));
      } finally { await reset(page); }
    });
    await check('all viewport/theme rendering, focus, numeric semantics and primary touch controls', async () => {
      const results=[];
      for(const width of [360,390,768,1440]) for(const theme of ['light','dark']) {
        const viewport=width>=1000?'desktop':width>=768?'tablet':'mobile';const started=performance.now();const sections=[];
        const timed=async(name,thresholdKey,fn)=>{const began=performance.now();await fn();const durationMs=Math.round(performance.now()-began),thresholdMs=latency.section('local',viewport,thresholdKey);sections.push({name,thresholdKey,durationMs,thresholdMs});if(latency.enforce)assert(durationMs<=thresholdMs,`${width}/${theme} ${name}: ${durationMs} exceeds ${thresholdMs}ms`);};
        await page.setViewportSize({width,height:900});const picker=page.getByLabel('Theme',{exact:true});await openDetails(picker);await picker.selectOption(theme);await picker.evaluate(el=>el.closest('details').open=false);await page.reload();await page.getByRole('heading',{name:'Encounter',exact:true}).waitFor();
        assert.equal(await page.locator('html').getAttribute('data-theme'),theme);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`overflow ${width}/${theme}`);
        await timed('encounter-workflow','encounter-workflow',async()=>{
          await setupIschemic(page);const weight=page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true});assert.equal(await weight.getAttribute('type'),'number');await weight.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert(await weight.evaluate(el=>document.activeElement===el));assert(await weight.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'visible keyboard focus missing');
          const primary=await page.locator('.workspace-primary').evaluateAll(els=>els.filter(e=>e.offsetParent!==null).map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));assert(primary.every(x=>x.width>=44&&x.height>=44));
          await page.getByRole('button',{name:'Generate Pulsara summary',exact:true}).click();assert((await page.getByLabel('Generated Pulsara summary',{exact:true}).inputValue()).includes('NIHSS score: incomplete'));const shot=path.join(outDir,`encounter-${width}-${theme}.png`);await page.screenshot({path:shot,fullPage:true});report.screenshots.push(shot);
        });
        await timed('navigation-tools','library-workflow',async()=>{await page.getByRole('link',{name:'Calculators & Links',exact:true}).click();await page.getByRole('heading',{name:'Calculators & Links',exact:true}).waitFor();await page.evaluate(()=>location.hash='#/education');await page.getByRole('heading',{name:'Retired destination',exact:true}).waitFor();await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');});
        await timed('retained-protocols-pediatric','pediatric-workflow',async()=>{await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.locator('#mgmt-tabpanel-ischemic').waitFor();const age=page.locator('#evt-age');await openDetails(age);await age.fill('17');assert((await page.locator('#mgmt-tabpanel-ischemic').innerText()).includes('Adult EVT algorithm does not apply'));await page.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();const trigger=page.getByRole('button',{name:'Vitamin K 10 mg IV',exact:true,includeHidden:true}).first();await openDetails(trigger);await trigger.click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`protocol overflow ${width}/${theme}`);});
        const durationMs=Math.round(performance.now()-started),thresholdMs=latency.run('local',viewport);report.runs.push({target:'local',viewport,width,theme,durationMs,thresholdMs,sections});if(latency.enforce)assert(durationMs<=thresholdMs,`${width}/${theme}: ${durationMs} exceeds ${thresholdMs}ms`);results.push({width,theme,overflow});await page.getByRole('link',{name:'Stroke',exact:true}).click();
      }
      await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'200% CSS layout scale overflow');await page.getByLabel('Age (years)',{exact:true}).fill('66');assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'66');await page.evaluate(()=>document.documentElement.style.zoom='');await page.setViewportSize({width:720,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'desktop half-width reflow overflow');await page.setViewportSize({width:1440,height:900});await page.reload();return{viewports:results,zoom:'200% CSS layout-scale and 720px desktop-reflow simulations; not a physical-device or native browser-zoom certification',latencyScope:'Independent local runs per viewport and theme; former library ceiling applies to navigation/tools retirement contract'};
    });
    await check('canonical state survives Protocols, Tools and browser back/forward', async () => {
      await setupIschemic(page); await page.getByLabel('Manual rationale / recommendations',{exact:true}).fill('Synthetic QA marker zeta: clinician review pending.');
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.locator('#mgmt-tabpanel-ischemic').waitFor();
      await page.getByRole('link',{name:'Calculators & Links',exact:true}).click();await page.getByRole('heading',{name:'Calculators & Links',exact:true}).waitFor();await page.goBack();await page.locator('#mgmt-tabpanel-ischemic').waitFor();await page.goBack();await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');await page.goForward();await page.locator('#mgmt-tabpanel-ischemic').waitFor();await page.getByRole('link',{name:'Stroke',exact:true}).click();assert((await page.getByLabel('Manual rationale / recommendations',{exact:true}).inputValue()).includes('marker zeta'));
    });
    await check('legacy tool links reveal and focus retained tools; unavailable and retired routes explicit', async () => {
      for(const [route,id] of [['#/calculators/nihss','calc-nihss'],['#/research/calculators/crcl','calc-crcl'],['#/encounter/aspects','calc-aspects'],['#/calculators/tnk-dose','calc-tnk']]) {
        await page.evaluate(hash=>location.hash=hash,route);await page.waitForFunction(target=>{const el=document.getElementById(target);return el&&(el===document.activeElement||el.contains(document.activeElement));},id);
      }
      for(const route of ['#/education','#/research/guidelines','#/calculators/rcvs2','#/encounter/unknown-calc']) {await page.evaluate(hash=>location.hash=hash,route);await page.getByRole('heading',{name:/Retired/}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).isVisible(),false);}
      await page.evaluate(()=>location.hash='#/encounter/ich-score');await page.getByText('This tool is inactive in the current context.',{exact:false}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');await page.getByRole('link',{name:'Stroke',exact:true}).click();
    });
    await check('complete vs partial NIHSS, explicit zero, valid dose and clearing weight', async () => {
      const items=page.locator('#calc-nihss select');await openDetails(items.first());assert.equal(await items.count(),15);
      await items.first().selectOption({label:'Alert (0)'});assert((await page.locator('#calc-nihss').innerText()).includes('1/15 items documented · partial sum 0'));
      for(let i=0;i<15;i++){const value=await items.nth(i).locator('option').evaluateAll(els=>els.find(e=>e.textContent.includes('(0)')).value);await items.nth(i).selectOption(value);}
      assert((await page.locator('#calc-nihss').innerText()).includes('Complete NIHSS: 0/42'));const interactionStarted=performance.now();await items.first().selectOption('Drowsy (1)');await page.getByText('Complete NIHSS: 1/42',{exact:true}).waitFor();report.metrics.representativeInteractionMs=Math.round(performance.now()-interactionStarted);report.metrics.interactionMeasurement='Playwright select action through visible NIHSS update; driver overhead included';await items.first().selectOption('Alert (0)');await items.first().selectOption('');assert((await page.locator('#calc-nihss').innerText()).includes('14/15 items documented'));await items.first().selectOption('Alert (0)');
      assert((await page.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('');assert(!(await page.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('83');
    });
    await check('summary explicit generation/copy, clipboard denial fallback, stale-input invalidation and no recursion', async () => {
      assert.equal(await page.evaluate(()=>window.__qaClipboard.length),0);let draft=await generate(page);const first=await draft.inputValue();assert(first.includes('Synthetic')||first.includes('SYNTHETIC'));assert(first.includes('marker zeta'));assert(first.includes('Consent status: not documented'));assert(first.includes('IVT administration: not documented'));
      await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).click();assert.equal(await page.evaluate(()=>window.__qaClipboard.length),1);assert.equal(await page.evaluate(()=>window.__qaClipboard[0]),first);
      await page.evaluate(()=>window.__qaDenyClipboard=true);await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).click();await page.getByText('Clipboard unavailable. Select the read-only summary and copy it manually.',{exact:true}).waitFor();assert(await draft.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length));
      await page.getByLabel('Age (years)',{exact:true}).fill('66');await page.getByText('Encounter inputs changed. Generate again before reviewing or copying.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).count(),0);draft=await generate(page);const second=await draft.inputValue();assert.equal(second.split('Clinician rationale / recommendations:').length-1,1);assert(!second.includes(first));
      await page.getByLabel('Context',{exact:true}).selectOption('follow-up');assert.equal(await page.locator('#calc-tnk').count(),0);assert.equal(await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).count(),0);draft=await generate(page);assert(!(await draft.inputValue()).includes('IVT administration:'));assert((await draft.inputValue()).includes('marker zeta'));await page.getByLabel('Context',{exact:true}).selectOption('acute');assert.equal(await page.getByLabel('Selected IV thrombolytic',{exact:true}).inputValue(),'TNK');
    });
    await check('unentered discovery, future timestamps, explicit administration timer and context invalidation', async () => {
      await page.getByLabel('Last known well is unknown',{exact:true}).check();await page.getByText('Discovery timestamp not documented',{exact:true}).waitFor();const discovery=page.getByLabel('Discovery time (local)',{exact:true});await openDetails(discovery);assert.equal(await discovery.inputValue(),'');await page.getByLabel('Last known well is unknown',{exact:true}).uncheck();
      const admin=page.getByLabel('IVT administration timestamp (local)',{exact:true});await admin.fill(await localStamp(page,5));await page.getByText(/Monitoring timer inactive:/).waitFor();await page.getByLabel('IV thrombolytic administration explicitly recorded',{exact:true}).check();await page.getByText(/Recorded TNK administration · next scheduled check/).waitFor();await admin.fill(await localStamp(page,-60));await page.getByText(/Monitoring timer inactive:/).waitFor();await admin.fill('');await page.getByLabel('IV thrombolytic administration explicitly recorded',{exact:true}).uncheck();
    });
    await check('ICH ABC/2, complete GCS, reviewed zero ICH score, clearing and retained protocol shared dimensions', async () => {
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ich');for(const [label,value] of [['GCS Eye','4'],['GCS Verbal','5'],['GCS Motor','6']])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).selectOption(value);await page.getByText('GCS 15/15',{exact:true}).waitFor();
      for(const [label,value] of [['A: largest diameter (cm)','4'],['B: perpendicular diameter (cm)','3'],['Slice thickness (mm)','5'],['Number of hematoma slices','4']])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).fill(value);
      assert((await page.locator('#calc-ich-volume').innerText()).includes('12 mL'));for(const label of ['Intraventricular hemorrhage','Infratentorial origin'])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).selectOption('false');await page.getByText('ICH score 0/6 · severity framework; no individual prognosis',{exact:true}).waitFor();
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();await page.locator('#mgmt-tabpanel-ich').waitFor();const dim=page.locator('#mgmt-tabpanel-ich input[placeholder="e.g. 4.2"]');await openDetails(dim);assert.equal(await dim.inputValue(),'4');await dim.fill('');await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.getByLabel('A: largest diameter (cm)',{exact:true}).inputValue(),'');assert((await page.locator('#calc-ich-score').innerText()).includes('Complete age, GCS, volume'));
    });
    await check('public-demo privacy: no clinical storage, IndexedDB, URL/context transfer, console or cached response values', async () => {
      const marker='Synthetic QA marker zeta';assert(!requestUrls.some(url=>decodeURIComponent(url).includes(marker)));assert(!page.url().includes('marker'));assert(!consoleMessages.some(message=>message.text.includes(marker)));
      const writes=await page.evaluate(()=>window.__qaStorageWrites);assert(writes.every(([key])=>['stroke.v7.theme','stroke.v7.migrated'].includes(key)),JSON.stringify(writes));assert.deepEqual(await page.evaluate(()=>window.__qaIndexedDB),[]);
      assert.equal(await page.evaluate(async sentinel=>{for(const name of await caches.keys()){const cache=await caches.open(name);for(const req of await cache.keys()){const response=await cache.match(req);if((response.headers.get('content-type')||'').match(/text|json|javascript/)&&(await response.text()).includes(sentinel))return true;}}return false;},marker),false);
      assert(requestUrls.filter(url=>/^https?:/.test(url)).every(url=>new URL(url).origin===new URL(server.url).origin),'core required external request');
    });
    await check('deliberate reset cancel/accept clears full encounter, derived outputs, draft and timers', async () => {
      const button=page.getByRole('button',{name:'New encounter',exact:true,includeHidden:true});await openDetails(button);page.once('dialog',dialog=>dialog.dismiss());await button.click();assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'66');await reset(page);for(const label of ['Age (years)','Weight (kg)','Manual rationale / recommendations','Entered examination / imaging assessment'])assert.equal(await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).inputValue(),'');assert.equal(await page.getByLabel('Working diagnosis',{exact:true}).inputValue(),'');assert((await page.locator('#calc-nihss').innerText()).includes('0/15 items documented'));assert.equal(await page.getByLabel('Generated Pulsara summary',{exact:true}).count(),0);
    });
    await check('canonical protocol measurements, clears and source-review invalidation after repeated navigation', async () => {
      await setupIschemic(page);await page.getByLabel('Glucose (mg/dL)',{exact:true}).fill('100');await page.getByLabel('Reviewed ASPECTS (0–10)',{exact:true}).fill('3');await page.getByLabel('Baseline mRS',{exact:true}).selectOption('0');
      const items=page.locator('#calc-nihss select');await openDetails(items.first());for(let i=0;i<15;i++){const value=await items.nth(i).locator('option').evaluateAll(els=>els.find(e=>e.textContent.includes('(0)')).value);await items.nth(i).selectOption(value);}
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByRole('tab',{name:'Ischemic/TIA protocol tab',exact:true}).click();const cards=page.getByRole('region',{name:'Protocol cards',exact:true});await openDetails(cards);
      assert.equal(await cards.getByLabel('NIHSS',{exact:true}).inputValue(),'0');assert(await cards.getByLabel('NIHSS',{exact:true}).evaluate(el=>el.readOnly));assert.equal(await cards.getByLabel('ASPECTS',{exact:true}).inputValue(),'3');assert.equal(await cards.getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');assert.equal(await page.locator('#evt-aspects').inputValue(),'3-5');assert(await page.locator('#evt-aspects').isDisabled());
      const ivtAge=cards.getByLabel('Age',{exact:true}).first();await ivtAge.fill('70');assert(await ivtAge.evaluate(el=>document.activeElement===el));const review=cards.getByLabel('Absolute and relative contraindications reviewed',{exact:true});await review.check();assert(await review.isChecked());
      await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'70');await page.getByRole('link',{name:'Protocols',exact:true}).click();assert(await review.isChecked());
      await page.getByRole('link',{name:'Stroke',exact:true}).click();await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('90');await page.getByLabel('Glucose (mg/dL)',{exact:true}).fill('130');await page.getByLabel('Last known well is unknown',{exact:true}).check();await items.first().selectOption('');await page.getByLabel('Reviewed ASPECTS (0–10)',{exact:true}).fill('');
      await page.getByRole('link',{name:'Protocols',exact:true}).click();assert.equal(await cards.getByLabel('Weight (kg)',{exact:true}).inputValue(),'90');assert.equal(await cards.getByLabel('Glucose',{exact:true}).inputValue(),'130');assert.equal(await cards.getByLabel('NIHSS',{exact:true}).inputValue(),'');assert.equal(await cards.getByLabel('ASPECTS',{exact:true}).inputValue(),'');assert.equal(await cards.getByLabel('LKW (h)',{exact:true}).first().inputValue(),'');assert(await cards.getByLabel('Wake-up or unknown LKW (leave LKW hours blank)',{exact:true}).isChecked());assert.equal(await review.isChecked(),false);
      await reset(page);return{sourceEditsInvalidateReviews:true,derivedScoresNeverImputed:true,navigationPreservesReviews:true};
    });
    await check('fresh TIA DAPT review is visible, completable and invalidated by diagnosis changes', async () => {
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');const stamp=await localStamp(page,120);await page.getByLabel('LKW date (local)',{exact:true}).fill(stamp.split('T')[0]);await page.getByLabel('LKW time (local)',{exact:true}).fill(stamp.split('T')[1]);await page.getByLabel('CT hemorrhage review',{exact:true}).selectOption('absent');const dapt=page.locator('#calc-dapt');await openDetails(dapt.getByLabel('Reviewed ABCD² (0–7)',{exact:true}));await dapt.getByLabel('Reviewed ABCD² (0–7)',{exact:true}).fill('4');
      for(const[label,value]of[['Noncardioembolic mechanism confirmed','true'],['Antiplatelet contraindications reviewed','true'],['Presumed atherosclerotic mechanism','false'],['Symptomatic stenosis ≥50%','false'],['Known CYP2C19 loss-of-function carrier','false']])await dapt.getByLabel(label,{exact:true}).selectOption(value);await dapt.getByLabel('Hemorrhagic risk assessment',{exact:true}).selectOption('reviewed');assert(!(await dapt.innerText()).includes('clopidogrel+ASA:'));await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert((await dapt.innerText()).includes('clopidogrel+ASA:'));
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ischemic');for(const label of ['IVT clinician decision','EVT clinician decision'])await page.getByLabel(label,{exact:true}).selectOption('Not recommended');await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');assert.equal(await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).inputValue(),'');assert(!(await dapt.innerText()).includes('clopidogrel+ASA:'));await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert((await dapt.innerText()).includes('clopidogrel+ASA:'));
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ischemic');await page.getByLabel('EVT puncture timestamp (local)',{exact:true}).fill(await localStamp(page,30));await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert(!(await dapt.innerText()).includes('clopidogrel+ASA:'));assert((await dapt.innerText()).includes('Recorded reperfusion'));await reset(page);return{explicitTiaReview:true,hiddenDecisionsDoNotCompleteReview:true,recordedTreatmentCannotBeOverridden:true};
    });
    await check('console and resource errors', async () => {assert.deepEqual(errors,[]);assert.deepEqual(failedResources,[]);assert.deepEqual(consoleMessages.filter(x=>x.type==='error'),[]);});
    report.metrics.totalPageJsTransferBytes=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script'||new URL(x.name).pathname.endsWith('.js')).reduce((sum,x)=>sum+x.transferSize,0));
    await context.close();
    await check('fresh complete installation, offline reload, full synthetic encounter and protected drug modal', async () => {
      const offline=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'});const p=await offline.newPage();const offlineErrors=[];p.on('pageerror',e=>offlineErrors.push(e.message));try{
        await p.goto(server.url);await p.getByRole('heading',{name:'Encounter',exact:true}).waitFor();await waitForInstalled(p);await p.reload();await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
        const cache=await p.evaluate(async()=>{const names=await caches.keys();const active=names.filter(name=>name.startsWith('stroke-cache-v'));let totalBytes=0,entries=0,urls=[];for(const name of active){const c=await caches.open(name);for(const req of await c.keys()){entries++;urls.push(req.url);totalBytes+=(await(await c.match(req)).arrayBuffer()).byteLength;}}return{names:active,totalBytes,entries,urls};});assert(!cache.urls.some(url=>/education|teaching|TrialScreener|deferred-reference/.test(url)));report.metrics.offlineCacheBytes=cache.totalBytes;
        await offline.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await setupIschemic(p);await p.getByLabel('Manual rationale / recommendations',{exact:true}).fill('Synthetic offline encounter; specialist review pending.');const items=p.locator('#calc-nihss select');await openDetails(items.first());for(let i=0;i<15;i++){const value=await items.nth(i).locator('option').evaluateAll(els=>els.find(e=>e.textContent.includes('(0)')).value);await items.nth(i).selectOption(value);}assert((await p.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));assert((await(await generate(p)).inputValue()).includes('NIHSS score: 0/42'));
        await p.getByRole('link',{name:'Trials',exact:true}).click();await p.getByRole('heading',{name:'Trials',exact:true}).waitFor();await p.getByRole('tab',{name:'Database',exact:true}).click();await p.getByRole('searchbox',{name:'Search the study database by acronym, name or NCT number',exact:true}).fill('STEP');assert((await p.getByRole('tabpanel',{name:'Database',exact:true}).innerText()).includes('STEP'));await p.screenshot({path:path.join(outDir,'trials-offline-mobile.png'),fullPage:true});await p.getByRole('link',{name:'Protocols',exact:true}).click();await p.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();const trigger=p.getByRole('button',{name:'Vitamin K 10 mg IV',exact:true,includeHidden:true}).first();await openDetails(trigger);await trigger.click();await p.getByRole('dialog').waitFor();assert((await p.getByRole('dialog').innerText()).includes('Vitamin K'));await p.keyboard.press('Escape');assert.equal(await p.getByRole('dialog').count(),0);assert.deepEqual(offlineErrors,[]);await p.screenshot({path:path.join(outDir,'offline-protocol-mobile.png'),fullPage:true});return{cache,simulation:true};
      }finally{await offline.close();}
    });
    await check('published retired raw URLs unavailable and old JSON endpoints return retirement metadata', async () => {
      for(const relative of ['src/app.jsx','documents/references/External Ventricular Drain.pdf','content/bundle.json','assets/select_score_chart.png']){const response=await fetch(new URL(relative,server.url));assert([404,410].includes(response.status),`${relative}: ${response.status}`);}
      for(const relative of ['data/atlas/completed-trials.json','data/atlas/active-trials.json','data/guidelines/index.json']){const response=await fetch(new URL(relative,server.url));if(response.status===404||response.status===410)continue;assert((response.headers.get('content-type')||'').includes('json'));const data=await response.json();assert(data.retired||data.status==='retired'||data.status==='deprecated'||data._meta?.status==='retired',relative);}
    });
    if(args.includes('--live')&&!args.includes('--local-only'))await check('live deployed version parity and retained smoke',async()=>{const p=await browser.newPage();try{await p.goto(process.env.STROKE_LIVE_URL||'https://rkalani1.github.io/stroke/');await p.getByRole('heading',{name:'Encounter',exact:true}).waitFor();assert.equal(await p.locator('.app-shell').getAttribute('data-version'),JSON.parse(await fs.readFile('package.json','utf8')).version);report.live={status:'passed',url:p.url()};}finally{await p.close();}});
  } finally {await browser.close();await server.close();report.passed=report.checks.every(c=>c.status==='passed');await fs.writeFile(path.join(outDir,'qa-smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(`Browser QA ${report.passed?'PASS':'FAIL'}: ${report.checks.filter(c=>c.status==='passed').length}/${report.checks.length}; output/playwright/qa-smoke-report.json`);if(!report.passed)process.exitCode=1;}
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error);process.exitCode=1;});
