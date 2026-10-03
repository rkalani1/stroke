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
const nihssRows = page => page.locator('#calc-nihss fieldset[id^="nihss-"]');
const scoreNihss = (row, option) => row.locator(`input[type="radio"][value="${option}"]`).check();
const scoreNihssZero = row => row.locator('input[type="radio"][value$="(0)"]').check();
const nihssValue = async row => (await row.locator('input[type="radio"]:checked').count()) ? row.locator('input[type="radio"]:checked').inputValue() : '';
async function fillBp(page, value) { const [systolic, diastolic] = value.split('/'); await page.getByLabel('Systolic BP (mmHg)', { exact: true }).fill(systolic); await page.getByLabel('Diastolic BP (mmHg)', { exact: true }).fill(diastolic); }
const chooseNihssSource = (page, value) => page.check(`input[name="nihss-source"][value="${value}"]`);
export async function reset(page) {
  await page.getByRole('link', { name: 'Stroke', exact: true }).click();
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
  const label = (await page.getByRole('button', { name: /^Generate / }).innerText()).replace(/^Generate /, '');
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
  const reference = JSON.parse(await fs.readFile(path.join(site, 'data/clinical-reference.json'), 'utf8'));
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
      await page.getByRole('radio', { name: 'Video', exact: true }).check();
      assert.equal(await page.locator('[data-generated-note]').count(), 0);
      const video = await (await generate(page)).inputValue();
      for (const section of ['Reason for Consultation:', 'Chief complaint:', 'HPI:', 'Objective:', 'Imaging findings:', 'Assessment and Plan:', 'Recommendations:', 'Clinician Name']) assert(video.includes(section));
      assert(video.includes('QA specialist review pending.'));
      assert(!/SYNTHETIC|EDUCATIONAL DEMO|NO PHI|NOT A REAL CLINICAL NOTE|Acute video consultation/i.test(video));
      await page.getByRole('link', { name: 'Calculators', exact: true }).click();
      assert.equal(await page.getByRole('heading', { name: 'Retained primary sources', exact: true }).count(), 0);
      assert(!(await page.locator('main').innerText()).includes('archival Git ref'));
      await reset(page);
    });
    await check('MRI source screen requires a qualifying extent and invalidates both documentation formats after edits', async () => {
      try {
        await reset(page); await setupIschemic(page);
        await chooseNihssSource(page, 'reported');
        await page.getByLabel('Reported NIHSS total (0–42)', {exact:true}).fill('8');
        await page.getByLabel('Last known well is unknown', {exact:true}).check();
        const stamp = await localStamp(page, 60);
        await openDetails(page.getByLabel('Discovery date (local)', {exact:true}));
        await page.getByLabel('Discovery date (local)', {exact:true}).fill(stamp.split('T')[0]);
        await page.getByLabel('Discovery time (local)', {exact:true}).fill(stamp.split('T')[1]);
        await page.getByLabel('CT hemorrhage review', {exact:true}).selectOption('absent');
        await openDetails(page.getByLabel('MRI pathway selected (No = CTP / EXTEND)', {exact:true}));
        for (const label of ['MRI pathway selected (No = CTP / EXTEND)', 'DWI positive lesion', 'FLAIR without marked hyperintensity', 'MRI lesion extent reviewed']) await page.getByLabel(label, {exact:true}).selectOption('true');
        const extent = page.getByLabel('DWI lesion smaller than one-third MCA territory', {exact:true});
        assert.equal(await extent.inputValue(), '');
        assert((await (await generate(page)).inputValue()).includes('MRI (WAKE-UP): incomplete or not met;'));
        for (const consultation of ['Telephone', 'Video']) {
          await page.getByRole('radio', {name:consultation, exact:true}).check();
          await extent.selectOption('true');
          assert.equal(await page.locator('[data-generated-note]').count(), 0);
          let text = await (await generate(page)).inputValue();
          assert(text.includes('MRI (WAKE-UP): partial source screen met;'));
          assert(text.includes('DWI lesion smaller than one-third MCA territory: yes.'));
          await extent.selectOption('false');
          assert.equal(await page.locator('[data-generated-note]').count(), 0);
          text = await (await generate(page)).inputValue();
          assert(text.includes('MRI (WAKE-UP): incomplete or not met;'));
          assert(text.includes('DWI lesion smaller than one-third MCA territory: no.'));
          await extent.selectOption('');
          assert.equal(await page.locator('[data-generated-note]').count(), 0);
        }
      } finally { await reset(page); }
    });
    await check('encounter shortcuts reveal and focus missing fields without changing route or state', async () => {
      await reset(page);
      await page.getByRole('button', { name: 'Next: Working diagnosis' }).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'input-diagnosis');
      await page.getByLabel('Working diagnosis', { exact: true }).selectOption('ischemic');
      await page.getByLabel('Age (years)', { exact: true }).fill('65');
      await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).fill('80');
      await page.getByLabel('Baseline mRS', { exact: true }).selectOption('0');
      await page.getByLabel('Last known well is unknown', { exact: true }).check();
      await page.getByRole('button', { name: 'Next: NIHSS examination' }).click();
      assert((await page.evaluate(() => document.activeElement.id)).startsWith('nihss-'));
      assert.equal(await page.locator('#calc-nihss details').first().evaluate(el => el.open), true);
      const examItems = nihssRows(page);
      for (let index = 0; index < await examItems.count(); index++) await examItems.nth(index).locator('input[type="radio"]').first().check();
      await page.getByLabel('CT hemorrhage review', { exact: true }).selectOption('uncertain');
      await page.getByLabel('Disposition', { exact: true }).selectOption('Pending');
      const overview = page.getByRole('complementary', { name: 'Encounter at a glance' });
      assert((await page.locator('#calc-nihss').innerText()).includes('0/42'));
      assert((await overview.innerText()).includes('Core entries recorded'));
      const nav = page.getByRole('navigation', { name: 'Encounter sections' });
      for (const [name, id] of [['Context', 'context'], ['Examination', 'exam'], ['Decision review', 'safety'], ['Documentation', 'handoff']]) {
        await nav.getByRole('button', { name, exact: true }).click();
        assert.equal(await page.evaluate(() => document.activeElement.id), `${id}-title`);
      }
      assert.equal(new URL(page.url()).hash, '#/encounter');
      await page.setViewportSize({ width: 390, height: 844 });
      for (const id of ['context', 'exam', 'safety', 'handoff']) {
        await page.getByLabel('Jump to encounter section').selectOption(id);
        assert.equal(await page.evaluate(() => document.activeElement.id), `${id}-title`);
      }
      assert.equal(await page.getByLabel('Age (years)', { exact: true }).inputValue(), '65');
      await page.setViewportSize({ width: 1440, height: 900 });
      await reset(page);
    });
    await check('editable documentation prompts and CT details feed the existing note with draft safeguards', async () => {
      await setupIschemic(page);
      await page.getByRole('radio', { name: 'Video', exact: true }).check();
      await openDetails(page.getByLabel('Head CT date (local)', { exact: true }));
      const stamp = await localStamp(page, 15);
      await page.getByLabel('Head CT date (local)', { exact: true }).fill(stamp.split('T')[0]);
      await page.getByLabel('Head CT time (local)', { exact: true }).fill(stamp.split('T')[1]);
      await page.getByLabel('CT perfusion findings', { exact: true }).fill('Perfusion findings recorded for review.');
      await page.getByLabel('Discussion details', { exact: true }).fill('Individual discussion details.');
      await openDetails(page.getByRole('button', { name: 'IVT discussion', exact: true, includeHidden: true }));
      await generate(page);
      await page.getByRole('button', { name: 'IVT discussion', exact: true, includeHidden: true }).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'action-discussionDetails');
      assert.equal(await page.locator('[data-generated-note]').count(), 0);
      const details = page.getByLabel('Discussion details', { exact: true });
      const inserted = await details.inputValue();
      assert(inserted.startsWith('Individual discussion details.'));
      assert(inserted.includes('Participants: [ ]'));
      await page.getByRole('button', { name: 'IVT discussion', exact: true, includeHidden: true }).click();
      assert.equal(await details.inputValue(), inserted);
      await details.fill('Documented discussion details reviewed with the treating team.');
      const output = await (await generate(page)).inputValue();
      assert(output.includes(`NCCT Head (${stamp.replace('T', ' ')})`));
      assert(output.includes('Perfusion findings recorded for review.'));
      assert(output.includes('Documented discussion details reviewed with the treating team.'));
      assert(output.includes('Discussion: not documented'));
      assert(output.includes('Consent status: not documented'));
      assert(output.includes('IVT administration: not documented'));
      await reset(page);
      assert.equal(await page.getByLabel('Discussion details', { exact: true }).inputValue(), '');
      await openDetails(page.getByLabel('Head CT date (local)', { exact: true }));
      assert.equal(await page.getByLabel('Head CT date (local)', { exact: true }).inputValue(), '');
      assert.equal(await page.getByLabel('CT perfusion findings', { exact: true }).inputValue(), '');
    });
    await check('restored timeline, weight units, keyboard scoring and note formats use canonical entries', async () => {
      await reset(page); await setupIschemic(page);
      await page.check('input[name="weight-unit"][value="lb"]');
      await page.getByLabel('Weight (lb)', { exact:true }).fill('220.462262');
      await page.check('input[name="weight-unit"][value="kg"]');
      assert(Math.abs(Number(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact:true }).inputValue()) - 100) < .001);
      const timer=page.getByRole('button',{name:'Start consultation timer',exact:true,includeHidden:true}); await openDetails(timer); await timer.click();
      await page.getByRole('button',{name:'Stop consultation timer',exact:true}).click();
      await page.getByLabel('ED arrival (local)',{exact:true}).fill(await localStamp(page,30));
      await page.getByLabel('CT start (local)',{exact:true}).fill(await localStamp(page,20));
      assert((await page.locator('.timeline-intervals').innerText()).includes('10 min'));
      const selectors=nihssRows(page);await openDetails(selectors.first());await selectors.first().focus();await selectors.first().press('0');
      assert((await nihssValue(selectors.first())).endsWith('(0)'));
      assert(await selectors.nth(1).evaluate(el=>document.activeElement===el));
      const transferStatus=page.getByLabel('Transfer coordination status',{exact:true});await openDetails(transferStatus);await transferStatus.selectOption('Accepted');
      const destination=page.getByLabel('Receiving facility / service',{exact:true});await openDetails(destination);await destination.fill('Receiving stroke service');
      await page.getByLabel('Documentation format',{exact:true}).selectOption('transfer');
      const handoff=await generate(page);assert((await handoff.inputValue()).includes('Receiving stroke service'));assert((await handoff.inputValue()).includes('Consultation elapsed'));
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByRole('link',{name:'Encounter',exact:true}).click();
      assert.equal(await page.getByLabel('Receiving facility / service',{exact:true}).inputValue(),'Receiving stroke service');
      await reset(page);await openDetails(page.getByRole('button',{name:'Start consultation timer',exact:true,includeHidden:true}));await page.getByRole('button',{name:'Start consultation timer',exact:true,includeHidden:true}).waitFor({state:'visible'});
      assert.equal(await page.getByLabel('ED arrival (local)',{exact:true}).inputValue(),'');
    });
    await check('reported NIHSS, distinct discharge outcomes, compact handoff and explicit current timestamps', async () => {
      try {
        await reset(page); await setupIschemic(page);
        await chooseNihssSource(page, 'reported');
        await page.getByLabel('Reported NIHSS total (0–42)', {exact:true}).fill('8');
        await page.getByLabel('Documentation format', {exact:true}).selectOption('handoff');
        let text = await (await generate(page)).inputValue();
        assert(text.startsWith('Team handoff\n')); assert(text.includes('NIHSS: 8/42 (reported total)'));
        assert(!text.includes('all items documented'));
        const discharge = page.getByLabel('Recorded discharge NIHSS', {exact:true}); await openDetails(discharge);
        await discharge.fill('0'); await page.getByLabel('Recorded discharge mRS', {exact:true}).selectOption('1');
        await page.getByLabel('Documentation format', {exact:true}).selectOption('discharge');
        text = await (await generate(page)).inputValue();
        assert(text.includes('NIHSS score: 8/42 (reported total)')); assert(text.includes('Recorded discharge NIHSS: 0')); assert(text.includes('Recorded discharge mRS: 1'));
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', {name:'Set LKW to now', exact:true}).click();
        assert.equal(await page.locator('[data-generated-note]').count(),0);
        assert(await page.getByLabel('LKW time (local)', {exact:true}).inputValue());
        await page.getByRole('button', {name:'Set IVT timestamp to now', exact:true}).click();
        assert.equal(await page.getByLabel('IV thrombolytic administration explicitly recorded').isChecked(),false);
        assert((await page.locator('#handoff').innerText()).includes('Monitoring timer inactive'));
        await page.getByLabel('Reported NIHSS total (0–42)', {exact:true}).fill('43');
        assert((await (await generate(page)).inputValue()).includes('reported total missing or invalid'));
      } finally { await reset(page); }
    });
    await check('restored worksheets apply explicit scores, search/copy safely and feed follow-up notes', async () => {
      await reset(page);await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');
      await page.getByLabel('Age (years)',{exact:true}).fill('60');await fillBp(page,'140/90');
      await page.evaluate(()=>{location.hash='#/tools/abcd2';});
      const calculator=page.locator('#calc-abcd2');await calculator.waitFor({state:'visible'});
      await calculator.getByLabel('Clinical TIA diagnosis confirmed',{exact:true}).selectOption('true');
      await calculator.getByLabel('First BP after TIA: systolic (mmHg)',{exact:true}).fill('140');
      await calculator.getByLabel('First BP after TIA: diastolic (mmHg)',{exact:true}).fill('90');
      await calculator.getByLabel('TIA clinical features',{exact:true}).selectOption('weakness');
      await calculator.getByLabel('TIA symptom duration',{exact:true}).selectOption('60plus');
      assert((await calculator.getByRole('status').innerText()).includes('1 item unanswered'));
      await calculator.getByLabel('History of diabetes',{exact:true}).selectOption('false');
      assert((await calculator.getByRole('status').innerText()).includes('6/7'));
      assert.equal(await calculator.getByRole('button',{name:'Use in Encounter',exact:true}).isEnabled(),false);
      await calculator.getByRole('button',{name:'Copy result',exact:true}).click();
      await calculator.getByText('ABCD² copied.',{exact:true}).waitFor();
      const copied=await page.evaluate(()=>window.__qaClipboard.at(-1));assert(copied.includes('6/7'));assert(copied.includes('Source:'));assert(copied.includes('Limits:'));
      const search=page.getByRole('searchbox',{name:'Find a calculator'});await search.fill('Cockcroft');
      assert(await page.getByRole('link',{name:'Renal calculation',exact:true}).isVisible());assert.equal(await calculator.isVisible(),false);
      await page.getByRole('button',{name:'Clear search',exact:true}).click();assert(await calculator.isVisible());assert.equal(await calculator.getByLabel('TIA symptom duration',{exact:true}).inputValue(),'60plus');
      await page.evaluate(()=>window.__qaDenyClipboard=true);await calculator.getByRole('button',{name:'Copy result',exact:true}).click();
      const fallback=calculator.getByLabel('ABCD² copy fallback',{exact:true});await fallback.waitFor();assert((await fallback.inputValue()).includes('6/7'));
      await search.fill('missing calculator');assert((await page.getByRole('status').filter({hasText:'No calculators found'}).innerText()).includes('No calculators found'));
      await page.getByRole('button',{name:'Clear search',exact:true}).click();assert.equal(await fallback.count(),0);await page.evaluate(()=>window.__qaDenyClipboard=false);
      await calculator.getByLabel('Inputs and source limits reviewed',{exact:true}).check();
      await calculator.getByRole('button',{name:'Use in Encounter',exact:true}).click();
      await page.getByRole('link',{name:'Encounter',exact:true}).click();const score=page.getByLabel('Reviewed ABCD² (0–7)',{exact:true});await openDetails(score);assert.equal(await score.inputValue(),'6');
      await fillBp(page,'120/70');assert.equal(await score.inputValue(),'6');
      await page.getByLabel('Age (years)',{exact:true}).fill('61');assert.equal(await score.inputValue(),'');
      await page.getByLabel('Context',{exact:true}).selectOption('follow-up');
      await page.evaluate(()=>{location.hash='#/tools/phq2';});const phq=page.locator('#calc-phq2');await phq.waitFor({state:'visible'});
      for(const select of await phq.locator('select').all()) await select.selectOption('0');
      assert((await phq.getByRole('status').innerText()).includes('0/6'));
      await phq.getByLabel('Inputs and source limits reviewed',{exact:true}).check();
      await page.getByRole('link',{name:'Encounter',exact:true}).click();await page.getByLabel('Documentation format',{exact:true}).selectOption('follow-up');
      assert((await (await generate(page)).inputValue()).includes('PHQ-2 score: 0/6'));
      await page.evaluate(()=>{location.hash='#/tools/phq2';});await phq.waitFor({state:'visible'});await phq.locator('select').first().selectOption('');
      await page.getByRole('link',{name:'Encounter',exact:true}).click();assert(!(await (await generate(page)).inputValue()).includes('PHQ-2 score:'));
      await reset(page);await page.evaluate(()=>{location.hash='#/tools/phq2';});await phq.waitFor({state:'visible'});assert.equal(await phq.locator('select').first().inputValue(),'');
      await reset(page);
    });
    await check('restored Trials registry views and unchanged Encounter session', async () => {
      try {
      await page.getByLabel('Age (years)', { exact: true }).fill('67');
      await page.getByRole('link', { name: 'Trials', exact: true }).click();
      await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
      const screen = page.getByRole('tabpanel', { name: 'Screener', exact: true });
      await screen.getByText('Choose a classification to see possible study profiles.', { exact: true }).waitFor({ state: 'visible' });
      await screen.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      await screen.getByRole('button', { name: /4.5 – 24h/ }).click();
      await screen.getByRole('heading', { name: /possible candidates/i }).waitFor({ state: 'visible' });
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
    await check('header references and all clinical sections remain reachable without sharing Encounter values', async () => {
      await reset(page); await setupIschemic(page);
      const links = page.getByRole('navigation', { name: 'External references', exact: true }).getByRole('link');
      assert.deepEqual(await links.allTextContents(), ['Telestroke Map', 'UpToDate', 'OpenEvidence']);
      for (const link of await links.all()) { assert.equal(await link.getAttribute('target'), '_blank'); assert((await link.getAttribute('rel')).includes('noopener')); assert(!(await link.getAttribute('href')).includes('83')); }
      await page.getByRole('link', { name: 'Evidence', exact: true }).click();
      const evidence = page.getByRole('region', { name: 'Evidence', exact: true });
      await evidence.getByLabel('Clinical section', { exact: true }).waitFor();
      await evidence.getByLabel('Find a clinical question', { exact: true }).fill('');
      await evidence.getByLabel('Care setting', { exact: true }).selectOption('all');
      const sections = [...new Set(reference.data.topics.map(topic => topic.category))];
      assert.equal(sections.length, 9);
      for (const section of sections) {
        await evidence.getByLabel('Clinical section', { exact: true }).selectOption(section);
        const expected = reference.data.topics.filter(topic => topic.category === section).map(topic => topic.id).sort();
        await page.waitForFunction(count => document.querySelectorAll('[aria-label="Evidence"] [data-reference-id]').length === count, expected.length);
        assert.deepEqual((await evidence.locator('[data-reference-id]').evaluateAll(nodes => nodes.map(node => node.dataset.referenceId))).sort(), expected);
      }
      await evidence.getByLabel('Clinical section', { exact: true }).selectOption('all');
      await page.getByRole('link', { name: 'Calculators', exact: true }).click();
      await page.getByRole('heading', { name: 'Calculators', exact: true }).waitFor();
      assert.equal(await page.locator('.tools-surface').getByRole('heading', { name: 'External references', exact: true }).count(), 0);
      await reset(page);
    });
    await check('restored GCS access and NASCET arithmetic preserve explicit review and invalidation', async () => {
      try {
        await reset(page); await setupIschemic(page);
        await page.evaluate(() => { location.hash = '#/encounter/gcs'; });
        const gcs = page.locator('#calc-gcs');
        await gcs.getByLabel('GCS Eye', { exact: true }).waitFor({ state: 'visible' });
        assert.equal(await page.getByLabel('Working diagnosis', { exact: true }).inputValue(), 'ischemic');
        for (const [name, value] of [['Eye','4'],['Verbal','5'],['Motor','6']]) await gcs.getByLabel(`GCS ${name}`, { exact: true }).selectOption(value);
        await gcs.getByText('GCS 15/15', { exact: true }).waitFor();
        assert((await (await generate(page)).inputValue()).includes('GCS E4 V5 M6 = 15/15'));
        await gcs.getByLabel('GCS Verbal', { exact: true }).selectOption('UN');
        await gcs.getByLabel('GCS assessment limitation (optional)', { exact: true }).fill('Intubation');
        assert.equal(await page.locator('[data-generated-note]').count(),0);
        let note = await (await generate(page)).inputValue();
        assert(note.includes('GCS E4 VNT M6; total not reported')); assert(note.includes('limitation: Intubation')); assert(!note.includes('GCS E4 V5 M6 = 15/15'));
        await page.getByRole('radio', { name: 'Video', exact: true }).check();
        assert((await (await generate(page)).inputValue()).includes('GCS E4 VNT M6; total not reported'));
        await gcs.getByLabel('GCS Verbal', { exact: true }).selectOption('5');
        note = await (await generate(page)).inputValue(); assert(note.includes('GCS E4 V5 M6 = 15/15')); assert(!note.includes('limitation: Intubation'));
        await page.evaluate(() => { location.hash = '#/tools/nascet'; });
        const card = page.locator('#calc-nascet');
        await card.getByLabel('Measured ICA side', { exact: true }).selectOption('left');
        await card.getByLabel('Minimum residual lumen diameter (mm)', { exact: true }).fill('3');
        await card.getByLabel('Normal distal ICA diameter (mm)', { exact: true }).fill('4');
        await card.getByLabel('Patent extracranial ICA and suitable distal reference confirmed', { exact: true }).selectOption('true');
        await card.getByLabel('Near-occlusion suspected or present', { exact: true }).selectOption('false');
        await card.getByRole('status').filter({ hasText: 'NASCET carotid stenosis: 25%' }).waitFor();
        await card.getByLabel('Minimum residual lumen diameter (mm)', { exact: true }).fill('');
        await card.getByRole('status').filter({ hasText: '1 item unanswered' }).waitFor();
        assert.equal(await card.getByRole('button', { name: 'Copy result', exact: true }).isEnabled(), false);
        await page.getByRole('link', { name: 'Encounter', exact: true }).click();
        assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).inputValue(), '83');
      } finally { await reset(page); }
    });
    await check('Evidence filters, deep links, completed studies and source copy preserve Encounter entries', async () => {
      const clipboard = await page.evaluate(() => ({ entries: window.__qaClipboard, denied: window.__qaDenyClipboard }));
      try {
        await reset(page); await setupIschemic(page);
        const marker = 'QA evidence navigation marker: specialist review pending.';
        await page.getByLabel('Manual rationale / recommendations', { exact: true }).fill(marker);
        await page.getByRole('link', { name: 'Evidence', exact: true }).click();
        const evidence = page.getByRole('region', { name: 'Evidence', exact: true });
        await evidence.getByText(`${reference.data.topics.length} topics found.`, { exact: true }).waitFor();
        await evidence.getByLabel('Care setting', { exact: true }).selectOption('clinic');
        await evidence.getByLabel('Clinical section', { exact: true }).selectOption('Stroke mechanisms and vascular disorders');
        await evidence.getByRole('searchbox', { name: 'Find a clinical question', exact: true }).fill('PFO');
        await evidence.locator('[data-reference-id="pfo"]').waitFor({ state: 'visible' });
        const filteredIds = await evidence.locator('[data-reference-id]').evaluateAll(cards => cards.map(card => card.dataset.referenceId));
        assert(filteredIds.length < reference.data.topics.length);
        assert(filteredIds.every(id => reference.data.topics.find(topic => topic.id === id).settings.includes('clinic')));
        await evidence.getByRole('searchbox', { name: 'Find a clinical question', exact: true }).fill('unmatchableqareference');
        await evidence.getByText('0 topics found.', { exact: true }).waitFor();
        await evidence.getByRole('button', {name:'Clear filters', exact:true}).click();
        await evidence.getByRole('searchbox', {name:'Find a clinical question', exact:true}).fill('ELAN');
        const matches = evidence.getByRole('navigation', {name:'Matching study summaries', exact:true});
        assert.equal(await matches.getByRole('link').first().getAttribute('href'), '#/evidence/elan');
        await matches.getByRole('link').first().click();
        await page.waitForFunction(() => document.querySelector('[data-reference-id="elan"]')?.open && document.activeElement.closest('[data-reference-id]')?.dataset.referenceId === 'elan');
        assert.equal(await matches.count(), 1);
        assert.equal(await evidence.getByRole('searchbox', {name:'Find a clinical question', exact:true}).inputValue(), 'ELAN');
        await evidence.locator('[data-reference-id="af-timing"] > summary').click();
        await evidence.getByRole('searchbox', {name:'Find a clinical question', exact:true}).fill('ELAN');
        await matches.getByRole('link').first().click();
        await page.waitForFunction(() => document.querySelector('[data-reference-id="elan"]')?.open && document.activeElement.closest('[data-reference-id]')?.dataset.referenceId === 'elan');
        assert.equal(await matches.count(), 1);
        assert.equal(await evidence.getByRole('searchbox', {name:'Find a clinical question', exact:true}).inputValue(), 'ELAN');
        await evidence.locator('[data-reference-id="elan"] > summary').click();
        await page.evaluate(() => { location.hash = '#/evidence/af-timing'; });
        const topic = evidence.locator('[data-reference-id="af-timing"]');
        await page.waitForFunction(() => { const card = document.querySelector('[aria-label="Evidence"] [data-reference-id="af-timing"]'); return card?.open && card.contains(document.activeElement); });
        assert.equal(await evidence.getByLabel('Care setting', { exact: true }).inputValue(), 'all');
        assert.equal(await evidence.getByLabel('Clinical section', { exact: true }).inputValue(), 'all');
        assert.equal(await evidence.getByRole('searchbox', { name: 'Find a clinical question', exact: true }).inputValue(), '');
        await topic.getByRole('heading', { name: 'Study summaries', exact: true }).waitFor();
        assert.deepEqual((await topic.locator('[data-reference-id]').evaluateAll(cards => cards.map(card => card.dataset.referenceId))).sort(), ['catalyst', 'elan', 'optimas']);
        const study = topic.locator('[data-reference-id="elan"]'), expected = reference.data.studies.find(record => record.id === 'elan');
        await study.locator('summary').click();
        await study.getByRole('button', { name: `Copy ${expected.title} evidence`, exact: true }).click();
        await study.getByText('Copied with sources and limits.', { exact: true }).waitFor();
        const copied = await page.evaluate(() => window.__qaClipboard.at(-1));
        assert(copied.includes(expected.population)); assert(copied.includes(`Limits: ${expected.limits}`));
        for (const source of expected.sources) { assert(copied.includes(source.url)); assert(copied.includes(`Source checked ${source.checkedAt}: ${source.access}`)); }
        await page.evaluate(() => { location.hash = '#/trials/completed/elan'; });
        await page.waitForFunction(() => document.querySelector('[data-reference-id="elan"]')?.open && document.activeElement.closest('[data-reference-id]')?.dataset.referenceId === 'elan');
        assert.equal(await page.getByRole('link', { name: 'Evidence', exact: true }).getAttribute('aria-current'), 'page');
        await page.evaluate(() => { location.hash = '#/evidence/af-timing'; });
        await page.waitForFunction(() => document.activeElement.closest('[data-reference-id]')?.dataset.referenceId === 'af-timing');
        assert.equal(new URL(page.url()).hash, '#/evidence/af-timing');
        await page.getByRole('link', { name: 'Encounter', exact: true }).click();
        assert.equal(await page.getByLabel('Age (years)', { exact: true }).inputValue(), '65');
        assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).inputValue(), '83');
        assert.equal(await page.getByLabel('Manual rationale / recommendations', { exact: true }).inputValue(), marker);
      } finally {
        await page.evaluate(saved => { window.__qaClipboard = saved.entries; window.__qaDenyClipboard = saved.denied; }, clipboard);
        await reset(page);
      }
    });
    await check('header omits Quick protocols while existing protocol deep links retain focus and state', async () => {
      try {
        await reset(page); await setupIschemic(page);
        assert.equal(await page.getByRole('navigation', { name: 'Quick protocols', exact: true }).count(), 0);
        await page.evaluate(() => { location.hash = '#/protocols/ich/reversal'; });
        await page.waitForFunction(() => document.activeElement?.textContent.trim() === 'Anticoagulation Reversal' && document.activeElement.closest('#mgmt-tabpanel-ich'));
        await page.evaluate(() => { location.hash = '#/protocols/ischemic/post-lytic'; });
        const target = page.locator('#isch-postlytic');
        await page.waitForFunction(() => { const card = document.getElementById('isch-postlytic'); return card?.open && card.contains(document.activeElement); });
        await target.locator('summary').first().click();
        assert.equal(await target.evaluate(card => card.open), false);
        await page.evaluate(() => { location.hash = '#/protocols/ischemic'; });
        await page.waitForFunction(() => location.hash === '#/protocols/ischemic');
        await page.evaluate(() => { location.hash = '#/protocols/ischemic/post-lytic'; });
        await page.waitForFunction(() => { const card = document.getElementById('isch-postlytic'); return card?.open && card.contains(document.activeElement); });
        assert.equal(new URL(page.url()).hash, '#/protocols/ischemic/post-lytic');
        await page.evaluate(() => { location.hash = '#/protocols/ischemic/angioedema'; });
        await page.waitForFunction(() => { const card = document.getElementById('isch-angioedema'); return card?.open && card.contains(document.activeElement); });
        await page.evaluate(() => { location.hash = '#/protocols/ich/reversal'; });
        await page.waitForFunction(() => document.activeElement?.textContent.trim() === 'Anticoagulation Reversal' && document.activeElement.closest('#mgmt-tabpanel-ich'));
        await page.getByRole('link', { name: 'Encounter', exact: true }).click();
        assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).inputValue(), '83');
      } finally { await reset(page); }
    });
    await check('canonical TIA details distinguish unknown, positive, reviewed and cleared findings without discharge clearance', async () => {
      try {
        await reset(page);
        await page.getByLabel('Working diagnosis', { exact: true }).selectOption('tia');
        const review = page.locator('section[aria-labelledby="tia-readiness-title"]');
        await review.getByText(/Disposition assessment incomplete/).waitFor();
        assert((await review.innerText()).includes('0/5 high-risk features explicitly reviewed.'));
        await review.getByRole('link', { name: 'Review TIA findings and workup', exact: true }).click();
        await page.waitForFunction(() => { const details = document.getElementById('encounter-details-diagnosis-details'); return details?.open && details.contains(document.activeElement); });
        assert.equal(new URL(page.url()).hash, '#/encounter/section/diagnosis-details');
        const riskLabels = ['TIA presentation with DWI lesion', 'Crescendo or recurrent episodes', 'Persistent deficit at reassessment', 'Severe symptomatic carotid stenosis', 'Suspected cardioembolic source'];
        for (const label of riskLabels) assert.equal(await page.getByLabel(label, { exact: true }).count(), 1);
        await page.getByLabel('Suspected cardioembolic source', { exact: true }).selectOption('yes');
        await review.getByRole('alert').filter({ hasText: 'Urgent stroke-team evaluation' }).waitFor();
        assert((await review.innerText()).includes('1/5 high-risk features explicitly reviewed.'));
        await page.getByLabel('Suspected cardioembolic source', { exact: true }).selectOption('');
        await review.getByText(/Disposition assessment incomplete/).waitFor();
        for (const label of riskLabels) await page.getByLabel(label, { exact: true }).selectOption('no');
        await review.getByText(/Risk-feature assessment recorded/).waitFor();
        assert((await review.innerText()).includes('ABCD² alone cannot clear discharge'));
        await review.getByRole('heading', { name: 'Workup & follow-up gaps', exact: true }).waitFor();
        for (const label of ['TIA MRI / DWI workup', 'TIA head / neck vascular imaging workup', 'TIA ECG / rhythm workup']) await page.getByLabel(label, { exact: true }).selectOption('Completed');
        for (const label of ['Same-day TIA workup complete', 'Prompt outpatient follow-up confirmed']) await page.getByLabel(label, { exact: true }).selectOption('yes');
        await review.getByRole('heading', { name: 'Workup & follow-up gaps', exact: true }).waitFor({ state: 'hidden' });
        await page.getByLabel('Severe symptomatic carotid stenosis', { exact: true }).selectOption('');
        await review.getByText(/Disposition assessment incomplete/).waitFor();
        assert((await review.innerText()).includes('4/5 high-risk features explicitly reviewed.'));
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
        await page.setViewportSize({width,height:900});const picker=page.getByLabel('Theme',{exact:true});await openDetails(picker);await picker.selectOption(theme);
        // Utilities starts a lazy download. Wait for its rendered control before
        // intentionally reloading; keep the resource-failure assertions strict.
        await page.getByRole('button',{name:'Install App',exact:true}).waitFor({state:'visible'});
        await picker.evaluate(el=>el.closest('details').open=false);await page.reload();await page.getByRole('heading',{name:'Encounter',exact:true}).waitFor();
        assert.equal(await page.locator('html').getAttribute('data-theme'),theme);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`overflow ${width}/${theme}`);
        await timed('encounter-workflow','encounter-workflow',async()=>{
          await setupIschemic(page);const weight=page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true});assert.equal(await weight.getAttribute('type'),'number');await weight.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert(await weight.evaluate(el=>document.activeElement===el));assert(await weight.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'visible keyboard focus missing');
          const primary=await page.locator('.workspace-primary').evaluateAll(els=>els.filter(e=>e.offsetParent!==null).map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));assert(primary.every(x=>x.width>=44&&x.height>=44));
          await page.getByRole('button',{name:'Generate Pulsara summary',exact:true}).click();assert((await page.getByLabel('Generated Pulsara summary',{exact:true}).inputValue()).includes('NIHSS score: incomplete'));const shot=path.join(outDir,`encounter-${width}-${theme}.png`);await page.screenshot({path:shot,fullPage:true});report.screenshots.push(shot);
        });
        await timed('navigation-tools','library-workflow',async()=>{await page.getByRole('link',{name:'Calculators',exact:true}).click();await page.getByRole('heading',{name:'Calculators',exact:true}).waitFor();await page.evaluate(()=>location.hash='#/education');await page.getByRole('heading',{name:'Retired destination',exact:true}).waitFor();await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');});
        await timed('retained-protocols-pediatric','pediatric-workflow',async()=>{await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.locator('#mgmt-tabpanel-ischemic').waitFor();const age=page.locator('#evt-age');await openDetails(age);await age.fill('17');assert((await page.locator('#mgmt-tabpanel-ischemic').innerText()).includes('Adult EVT algorithm does not apply'));await page.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();const trigger=page.getByRole('button',{name:'Vitamin K 10 mg IV',exact:true,includeHidden:true}).first();await openDetails(trigger);await trigger.click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`protocol overflow ${width}/${theme}`);});
        const durationMs=Math.round(performance.now()-started),thresholdMs=latency.run('local',viewport);report.runs.push({target:'local',viewport,width,theme,durationMs,thresholdMs,sections});if(latency.enforce)assert(durationMs<=thresholdMs,`${width}/${theme}: ${durationMs} exceeds ${thresholdMs}ms`);results.push({width,theme,overflow});await page.getByRole('link',{name:'Stroke',exact:true}).click();
      }
      await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'200% CSS layout scale overflow');await page.getByLabel('Age (years)',{exact:true}).fill('66');assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'66');await page.evaluate(()=>document.documentElement.style.zoom='');await page.setViewportSize({width:720,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'desktop half-width reflow overflow');await page.setViewportSize({width:1440,height:900});await page.reload();return{viewports:results,zoom:'200% CSS layout-scale and 720px desktop-reflow simulations; not a physical-device or native browser-zoom certification',latencyScope:'Independent local runs per viewport and theme; former library ceiling applies to navigation/tools retirement contract'};
    });
    await check('case bar fits every width, surfaces keep scroll, targets take focus and dark links stay legible', async () => {
      const picker=page.getByLabel('Theme',{exact:true});await openDetails(picker);const originalTheme=await picker.inputValue();await picker.evaluate(el=>el.closest('details').open=false);
      try {
        await setupIschemic(page);await fillBp(page,'172/94');await page.getByLabel('Anticoagulant exposure',{exact:true}).selectOption('apixaban');
        // The sticky bar wraps instead of clipping, keeps the 4.5 h pill uncovered and publishes its height.
        for(const width of [360,390,600,834,1180,1440]) {
          await page.setViewportSize({width,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
          const fit=await page.evaluate(()=>{const pill=document.querySelector('.case-bar__window'),r=pill.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),items=document.querySelector('.case-bar__items');return {overflow:document.documentElement.scrollWidth>innerWidth+1,pill:Boolean(hit&&pill.contains(hit)),clipped:items.scrollWidth>items.clientWidth+1,bar:Math.ceil(document.querySelector('.case-bar').getBoundingClientRect().height),published:parseInt(getComputedStyle(document.documentElement).getPropertyValue('--case-bar-h'),10)};});
          assert.equal(fit.overflow,false,`case bar overflows at ${width}px`);assert(fit.pill,`4.5 h pill covered at ${width}px`);assert.equal(fit.clipped,false,`case bar items clipped at ${width}px`);assert(Math.abs(fit.bar-fit.published)<=1,`--case-bar-h ${fit.published} vs bar ${fit.bar} at ${width}px`);
        }
        await page.setViewportSize({width:1280,height:800});
        // Each surface keeps its own position; an unvisited surface starts at the top.
        await page.evaluate(()=>window.scrollTo(0,1200));const saved=await page.evaluate(()=>Math.round(scrollY));assert(saved>600,'encounter too short to scroll');
        await page.evaluate(()=>{location.hash='#/trials';});await page.locator('.trials-surface').first().waitFor();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>Math.round(scrollY)),0);
        await page.evaluate(()=>{location.hash='#/encounter';});await page.waitForFunction(y=>Math.abs(scrollY-y)<=2,saved);
        // A named target wins over restoration, and the held-card link lands on the safety section.
        await page.evaluate(()=>{location.hash='#/protocols/ischemic/qr-bp';});await page.waitForFunction(()=>{const el=document.getElementById('qr-bp');return el&&el.open&&el.contains(document.activeElement);});
        const held=page.getByRole('link',{name:'Review in Encounter',exact:true});assert.equal(await held.count(),1,'apixaban with unknown timing must hold the IVT card');await held.click();
        await page.waitForFunction(()=>document.activeElement?.id==='safety-title');assert(await page.evaluate(()=>{const r=document.getElementById('safety-title').getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}));
        // Classed text links keep link-400 contrast in the dark theme.
        await openDetails(picker);await picker.selectOption('dark');await picker.evaluate(el=>el.closest('details').open=false);
        await page.evaluate(()=>{location.hash='#/trials/database';});await page.waitForFunction(()=>document.querySelectorAll('#workspace-main a.text-link-600').length>0);
        const low=await page.evaluate(()=>{const lum=color=>{const [r,g,b]=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};const background=el=>{for(let e=el;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;}return 'rgb(255, 255, 255)';};return [...document.querySelectorAll('#workspace-main a.text-link-600, .workspace-skip')].filter(a=>a.getClientRects().length).map(a=>{const f=lum(getComputedStyle(a).color),b=lum(background(a));return {text:a.textContent.trim().slice(0,30),ratio:Math.round((Math.max(f,b)+.05)/(Math.min(f,b)+.05)*100)/100};}).filter(x=>x.ratio<4.5);});
        assert.deepEqual(low,[],`dark links below 4.5:1: ${JSON.stringify(low.slice(0,5))}`);
      } finally { await openDetails(picker);await picker.selectOption(originalTheme);await picker.evaluate(el=>el.closest('details').open=false);await reset(page); }
    });
    await check('canonical state survives Protocols, Tools and browser back/forward', async () => {
      await setupIschemic(page); await page.getByLabel('Manual rationale / recommendations',{exact:true}).fill('Synthetic QA marker zeta: clinician review pending.');
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.locator('#mgmt-tabpanel-ischemic').waitFor();
      await page.getByRole('link',{name:'Calculators',exact:true}).click();await page.getByRole('heading',{name:'Calculators',exact:true}).waitFor();await page.goBack();await page.locator('#mgmt-tabpanel-ischemic').waitFor();await page.goBack();await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');await page.goForward();await page.locator('#mgmt-tabpanel-ischemic').waitFor();await page.getByRole('link',{name:'Stroke',exact:true}).click();assert((await page.getByLabel('Manual rationale / recommendations',{exact:true}).inputValue()).includes('marker zeta'));
    });
    await check('legacy tool links reveal and focus retained tools; unavailable and retired routes explicit', async () => {
      for(const [route,id] of [['#/calculators/nihss','calc-nihss'],['#/research/calculators/crcl','calc-crcl'],['#/encounter/aspects','calc-aspects'],['#/calculators/tnk-dose','calc-tnk']]) {
        await page.evaluate(hash=>location.hash=hash,route);await page.waitForFunction(target=>{const el=document.getElementById(target);return el&&(el===document.activeElement||el.contains(document.activeElement));},id);
      }
      await page.evaluate(() => { location.hash = '#/research/guidelines'; });
      const restoredEvidence = page.getByRole('region', { name: 'Evidence', exact: true });
      await restoredEvidence.getByRole('heading', { name: 'Evidence', exact: true }).waitFor();
      await restoredEvidence.getByRole('searchbox', { name: 'Find a clinical question', exact: true }).waitFor();
      assert.equal(await restoredEvidence.locator('[data-reference-id]').count(), reference.data.topics.length);
      for(const route of ['#/education','#/calculators/rcvs2','#/encounter/unknown-calc']) {await page.evaluate(hash=>location.hash=hash,route);await page.getByRole('heading',{name:/Retired/}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).isVisible(),false);}
      await page.evaluate(()=>location.hash='#/encounter/ich-score');await page.getByText('This calculator needs an ICH encounter.',{exact:false}).waitFor();assert.equal(await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');await page.getByRole('link',{name:'Stroke',exact:true}).click();
    });
    await check('complete vs partial NIHSS, explicit zero, valid dose and clearing weight', async () => {
      const items=nihssRows(page);await openDetails(items.first());assert.equal(await items.count(),15);
      await scoreNihss(items.first(),'Alert (0)');assert((await page.locator('#calc-nihss').innerText()).includes('1/15 items documented · partial sum 0'));
      for(let i=0;i<15;i++) await scoreNihssZero(items.nth(i));
      assert((await page.locator('#calc-nihss').innerText()).includes('Complete NIHSS: 0/42'));const interactionStarted=performance.now();await scoreNihss(items.first(),'Drowsy (1)');await page.getByText('Complete NIHSS: 1/42',{exact:true}).waitFor();report.metrics.representativeInteractionMs=Math.round(performance.now()-interactionStarted);report.metrics.interactionMeasurement='Playwright radio action through visible NIHSS update; driver overhead included';await scoreNihss(items.first(),'Alert (0)');await items.first().focus();await items.first().press('Delete');assert((await page.locator('#calc-nihss').innerText()).includes('14/15 items documented'));await scoreNihss(items.first(),'Alert (0)');
      assert((await page.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('');assert(!(await page.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('83');
    });
    await check('summary explicit generation/copy, clipboard denial fallback, stale-input invalidation and no recursion', async () => {
      assert.equal(await page.evaluate(()=>window.__qaClipboard.length),0);let draft=await generate(page);const first=await draft.inputValue();assert(first.includes('Synthetic')||first.includes('SYNTHETIC'));assert(first.includes('marker zeta'));assert(first.includes('Consent status: not documented'));assert(first.includes('IVT administration: not documented'));
      await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).click();assert.equal(await page.evaluate(()=>window.__qaClipboard.length),1);assert.equal(await page.evaluate(()=>window.__qaClipboard[0]),first);
      await page.evaluate(()=>window.__qaDenyClipboard=true);await page.getByRole('button',{name:'Copy Pulsara summary',exact:true}).click();await page.getByText('Clipboard unavailable. Select the read-only summary and copy it manually.',{exact:true}).waitFor();assert(await draft.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length));
      await page.getByLabel('Age (years)',{exact:true}).fill('66');await page.getByText('Inputs changed since the preview. Copy regenerates the note automatically.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Copy this preview',exact:true}).count(),0);draft=await generate(page);const second=await draft.inputValue();assert.equal(second.split('Clinician rationale / recommendations:').length-1,1);assert(!second.includes(first));
      await page.getByLabel('Context',{exact:true}).selectOption('follow-up');assert.equal(await page.locator('#calc-tnk').count(),0);assert.equal(await page.getByRole('button',{name:'Copy this preview',exact:true}).count(),0);draft=await generate(page);assert(!(await draft.inputValue()).includes('IVT administration:'));assert((await draft.inputValue()).includes('marker zeta'));await page.getByLabel('Context',{exact:true}).selectOption('acute');assert.equal(await page.getByLabel('Selected IV thrombolytic',{exact:true}).inputValue(),'TNK');
    });
    await check('unentered discovery, future timestamps, explicit administration timer and context invalidation', async () => {
      await page.getByLabel('Last known well is unknown',{exact:true}).check();await page.getByText('Discovery timestamp not documented',{exact:true}).waitFor();const discovery=page.getByLabel('Discovery time (local)',{exact:true});await openDetails(discovery);assert.equal(await discovery.inputValue(),'');await page.getByLabel('Last known well is unknown',{exact:true}).uncheck();
      const admin=page.getByLabel('IVT administration timestamp (local)',{exact:true});await admin.fill(await localStamp(page,5));await page.getByText(/Monitoring timer inactive:/).waitFor();await page.getByLabel('IV thrombolytic administration explicitly recorded',{exact:true}).check();await page.getByText(/Recorded TNK administration · next scheduled check/).waitFor();await admin.fill(await localStamp(page,-60));await page.getByText(/Monitoring timer inactive:/).waitFor();await admin.fill('');await page.getByLabel('IV thrombolytic administration explicitly recorded',{exact:true}).uncheck();
    });
    await check('ICH ABC/2, complete GCS, reviewed zero ICH score, clearing and retained protocol shared dimensions', async () => {
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ich');for(const [label,value] of [['GCS Eye','4'],['GCS Verbal','5'],['GCS Motor','6']])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).selectOption(value);await page.getByText('GCS 15/15',{exact:true}).waitFor();
      for(const [label,value] of [['A: largest diameter (cm)','4'],['B: perpendicular diameter (cm)','3'],['Slice thickness (mm)','5'],['Number of hematoma slices','4']])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).fill(value);
      assert((await page.locator('#calc-ich-volume').innerText()).includes('12 mL'));for(const label of ['Intraventricular hemorrhage','Infratentorial origin'])await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).selectOption('false');await page.getByText('ICH score 0/6 · severity grade, not an individual prognosis',{exact:true}).waitFor();
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();await page.locator('#mgmt-tabpanel-ich').waitFor();const dim=page.locator('#mgmt-tabpanel-ich input[placeholder="e.g. 4.2"]');await openDetails(dim);assert.equal(await dim.inputValue(),'4');await dim.fill('');await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.getByLabel('A: largest diameter (cm)',{exact:true}).inputValue(),'');assert((await page.locator('#calc-ich-score').innerText()).includes('Complete age, GCS, volume'));
    });
    await check('public-demo privacy: no clinical storage, IndexedDB, URL/context transfer, console or cached response values', async () => {
      const marker='Synthetic QA marker zeta';assert(!requestUrls.some(url=>decodeURIComponent(url).includes(marker)));assert(!page.url().includes('marker'));assert(!consoleMessages.some(message=>message.text.includes(marker)));
      const writes=await page.evaluate(()=>window.__qaStorageWrites);assert(writes.every(([key])=>['stroke.v7.theme','stroke.v7.migrated'].includes(key)),JSON.stringify(writes));assert.deepEqual(await page.evaluate(()=>window.__qaIndexedDB),[]);
      assert.equal(await page.evaluate(async sentinel=>{for(const name of await caches.keys()){const cache=await caches.open(name);for(const req of await cache.keys()){const response=await cache.match(req);if((response.headers.get('content-type')||'').match(/text|json|javascript/)&&(await response.text()).includes(sentinel))return true;}}return false;},marker),false);
      assert(requestUrls.filter(url=>/^https?:/.test(url)).every(url=>new URL(url).origin===new URL(server.url).origin),'core required external request');
    });
    await check('repeated local times require an occurrence and reversed EVT events remain qualified', async () => {
      const timingContext = await browser.newContext({ timezoneId: 'America/Los_Angeles', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      try {
        const p = await timingContext.newPage();
        await p.clock.setFixedTime(new Date('2026-11-01T10:00:00Z'));
        await p.goto(server.url);
        await p.getByLabel('Working diagnosis', { exact: true }).selectOption('ischemic');
        await p.getByLabel('LKW date (local)', { exact: true }).fill('2026-11-01');
        await p.getByLabel('LKW time (local)', { exact: true }).fill('01:31');
        const occurrence = p.getByLabel('LKW clock occurrence', { exact: true });
        assert.equal(await occurrence.inputValue(), '');
        assert((await p.locator('#context').innerText()).includes('ambiguous local time'));
        await occurrence.selectOption({ label: 'Second occurrence (UTC−08:00)' });
        assert((await p.locator('#context').innerText()).includes('LKW: 29 min elapsed'));
        await p.getByLabel('LKW time (local)', { exact: true }).fill('01:32');
        assert.equal(await occurrence.inputValue(), '');
        await p.getByLabel('Selected IV thrombolytic', { exact: true }).selectOption('TNK');
        await p.getByLabel('IV thrombolytic administration explicitly recorded', { exact: true }).check();
        await p.getByLabel('IVT administration timestamp (local)', { exact: true }).fill('2026-11-01T01:31');
        assert((await p.locator('#handoff').innerText()).includes('Monitoring timer inactive'));
        await p.getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
        assert(!(await p.getByLabel('Generated Pulsara summary', { exact: true }).inputValue()).includes('TNK at'));
        await p.getByLabel('IVT administration timestamp (local) clock occurrence', { exact: true }).selectOption({ label: 'Second occurrence (UTC−08:00)' });
        assert.equal(await p.getByRole('button', { name: 'Copy this preview', exact: true }).count(), 0);
        assert((await p.locator('#handoff').innerText()).includes('next scheduled check'));
        await p.getByLabel('EVT puncture timestamp (local)', { exact: true }).fill('2026-11-01T00:45');
        await p.getByLabel('EVT reperfusion timestamp (local)', { exact: true }).fill('2026-11-01T00:30');
        assert((await p.locator('#handoff').innerText()).includes('EVT reperfusion precedes puncture'));
        for (const [consultation, label] of [['Telephone', 'Pulsara summary'], ['Video', 'Epic note']]) {
          await p.getByRole('radio', { name: consultation, exact: true }).check();
          await p.getByRole('button', { name: `Generate ${label}`, exact: true }).click();
          const text = await p.getByLabel(`Generated ${label}`, { exact: true }).inputValue();
          assert(text.includes('EVT reperfusion precedes puncture'));
          assert(text.includes('TNK at 2026-11-01 01:31:00 (UTC−08:00)'));
        }
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        return { repeatedHour: 'explicit first/second occurrence', editedChoice: 'invalidated', monitoring: 'unresolved until selected', chronology: 'qualified in both formats' };
      } finally { await timingContext.close(); }
    });
    await check('deliberate reset cancel/accept clears full encounter, derived outputs, draft and timers', async () => {
      const button=page.getByRole('button',{name:'New encounter',exact:true,includeHidden:true});await openDetails(button);page.once('dialog',dialog=>dialog.dismiss());await button.click();assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'66');await reset(page);for(const label of ['Age (years)','Weight (kg)','Manual rationale / recommendations','Entered examination / imaging assessment'])assert.equal(await page.locator('#tabpanel-encounter').getByLabel(label,{exact:true}).inputValue(),'');assert.equal(await page.getByLabel('Working diagnosis',{exact:true}).inputValue(),'');assert((await page.locator('#calc-nihss').innerText()).includes('0/15 items documented'));assert.equal(await page.getByLabel('Generated Pulsara summary',{exact:true}).count(),0);
    });
    await check('canonical protocol measurements, clears and source-review invalidation after repeated navigation', async () => {
      await setupIschemic(page);await page.getByLabel('Glucose (mg/dL)',{exact:true}).fill('100');await page.getByLabel('Reviewed ASPECTS (0–10)',{exact:true}).fill('3');await page.getByLabel('Baseline mRS',{exact:true}).selectOption('0');
      const items=nihssRows(page);await openDetails(items.first());for(let i=0;i<15;i++) await scoreNihssZero(items.nth(i));
      await page.getByRole('link',{name:'Protocols',exact:true}).click();await page.getByRole('tab',{name:'Ischemic/TIA protocol tab',exact:true}).click();const cards=page.getByRole('region',{name:'Protocol cards',exact:true});await openDetails(cards);
      assert.equal(await cards.getByLabel('NIHSS',{exact:true}).inputValue(),'0');assert(await cards.getByLabel('NIHSS',{exact:true}).evaluate(el=>el.readOnly));assert.equal(await cards.getByLabel('ASPECTS',{exact:true}).inputValue(),'3');assert.equal(await cards.getByLabel('Weight (kg)',{exact:true}).inputValue(),'83');assert.equal(await page.locator('#evt-aspects').inputValue(),'3-5');assert(await page.locator('#evt-aspects').isDisabled());
      const ivtAge=cards.getByLabel('Age',{exact:true}).first();await ivtAge.fill('70');assert(await ivtAge.evaluate(el=>document.activeElement===el));const review=cards.getByLabel('Absolute and relative contraindications reviewed',{exact:true});await review.check();assert(await review.isChecked());
      await page.getByRole('link',{name:'Stroke',exact:true}).click();assert.equal(await page.getByLabel('Age (years)',{exact:true}).inputValue(),'70');await page.getByRole('link',{name:'Protocols',exact:true}).click();assert(await review.isChecked());
      await page.getByRole('link',{name:'Stroke',exact:true}).click();await page.locator('#tabpanel-encounter').getByLabel('Weight (kg)',{exact:true}).fill('90');await page.getByLabel('Glucose (mg/dL)',{exact:true}).fill('130');await page.getByLabel('Last known well is unknown',{exact:true}).check();await items.first().focus();await items.first().press('Delete');await page.getByLabel('Reviewed ASPECTS (0–10)',{exact:true}).fill('');
      await page.getByRole('link',{name:'Protocols',exact:true}).click();assert.equal(await cards.getByLabel('Weight (kg)',{exact:true}).inputValue(),'90');assert.equal(await cards.getByLabel('Glucose',{exact:true}).inputValue(),'130');assert.equal(await cards.getByLabel('NIHSS',{exact:true}).inputValue(),'');assert.equal(await cards.getByLabel('ASPECTS',{exact:true}).inputValue(),'');assert.equal(await cards.getByLabel('LKW (h)',{exact:true}).first().inputValue(),'');assert(await cards.getByLabel('Wake-up or unknown LKW (leave LKW hours blank)',{exact:true}).isChecked());assert.equal(await review.isChecked(),false);
      await reset(page);return{sourceEditsInvalidateReviews:true,derivedScoresNeverImputed:true,navigationPreservesReviews:true};
    });
    await check('fresh TIA DAPT review is visible, completable and invalidated by diagnosis changes', async () => {
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');await page.getByLabel('Age (years)',{exact:true}).fill('65');await page.getByLabel('Anticoagulant exposure',{exact:true}).selectOption('none');const stamp=await localStamp(page,120);await page.getByLabel('LKW date (local)',{exact:true}).fill(stamp.split('T')[0]);await page.getByLabel('LKW time (local)',{exact:true}).fill(stamp.split('T')[1]);await page.getByLabel('CT hemorrhage review',{exact:true}).selectOption('absent');const dapt=page.locator('#calc-dapt');await openDetails(dapt.getByLabel('Reviewed ABCD² (0–7)',{exact:true}));await dapt.getByLabel('Reviewed ABCD² (0–7)',{exact:true}).fill('4');
      for(const[label,value]of[['Noncardioembolic mechanism confirmed','true'],['Antiplatelet contraindications reviewed','true'],['Presumed atherosclerotic mechanism','false'],['Symptomatic stenosis ≥50%','false'],['Known CYP2C19 loss-of-function carrier','false']])await dapt.getByLabel(label,{exact:true}).selectOption(value);await dapt.getByLabel('Hemorrhagic risk assessment',{exact:true}).selectOption('reviewed');assert(!(await dapt.innerText()).includes('Clopidogrel + aspirin:'));await dapt.getByLabel('Current anticoagulation / indication review',{exact:true}).selectOption('none');await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert((await dapt.innerText()).includes('Clopidogrel + aspirin:'));
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ischemic');for(const label of ['IVT clinician decision','EVT clinician decision'])await page.getByLabel(label,{exact:true}).selectOption('Not recommended');await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');assert.equal(await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).inputValue(),'');assert(!(await dapt.innerText()).includes('Clopidogrel + aspirin:'));await dapt.getByLabel('Current anticoagulation / indication review',{exact:true}).selectOption('none');await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert((await dapt.innerText()).includes('Clopidogrel + aspirin:'));
      await page.getByLabel('Working diagnosis',{exact:true}).selectOption('ischemic');await page.getByLabel('EVT puncture timestamp (local)',{exact:true}).fill(await localStamp(page,30));await page.getByLabel('Working diagnosis',{exact:true}).selectOption('tia');await dapt.getByLabel('No reperfusion treatment after review',{exact:true}).selectOption('true');assert(!(await dapt.innerText()).includes('Clopidogrel + aspirin:'));assert((await dapt.innerText()).includes('Recorded reperfusion'));await reset(page);return{explicitTiaReview:true,hiddenDecisionsDoNotCompleteReview:true,recordedTreatmentCannotBeOverridden:true};
    });
    await check('anticoagulant history survives diagnosis changes and compact handoff retains CTP', async () => {
      try {
        await page.getByLabel('Working diagnosis', {exact:true}).selectOption('ischemic');
        await page.getByLabel('Anticoagulant exposure', {exact:true}).selectOption('apixaban');
        const lastDose = await localStamp(page, 90);
        await page.getByLabel('Last anticoagulant dose (local)', {exact:true}).fill(lastDose);
        await page.getByLabel('Working diagnosis', {exact:true}).selectOption('ich');
        assert.equal(await page.getByLabel('Anticoagulant exposure', {exact:true}).inputValue(), 'apixaban');
        assert.equal(await page.getByLabel('Last anticoagulant dose (local)', {exact:true}).inputValue(), lastDose);
        const ctp = page.getByLabel('CT perfusion findings', {exact:true}); await openDetails(ctp); await ctp.fill('Synthetic perfusion observation');
        await page.getByLabel('Documentation format', {exact:true}).selectOption('handoff');
        await page.getByRole('button', {name:'Generate Team handoff',exact:true}).click();
        const draft = await page.getByLabel('Generated Team handoff', {exact:true}).inputValue();
        assert(draft.includes('Anticoagulant exposure: apixaban'));
        assert(draft.includes(`Last anticoagulant dose: ${lastDose.replace('T', ' ')}`));
        assert(draft.includes('CTP: Synthetic perfusion observation'));
        await page.getByLabel('Anticoagulant exposure', {exact:true}).selectOption('none');
        assert.equal(await page.getByRole('button', {name:'Copy this preview',exact:true}).count(), 0);
      } finally { await reset(page); }
    });
    await check('historical study citations are searchable and new summaries preserve outcome limits', async () => {
      await page.getByRole('link', {name:'Evidence',exact:true}).click();
      const evidence = page.getByRole('region', {name:'Evidence',exact:true});
      await evidence.getByLabel('Find a clinical question', {exact:true}).fill('AVERROES');
      assert.equal(await evidence.locator('[data-reference-id]').count(), 1);
      const af = evidence.locator('[data-reference-id="af-prevention"]'); await af.locator('summary').click();
      await af.locator(':scope > .reference-body > details.reference-sources > summary').click();
      await af.getByRole('link', {name:/AVERROES/}).waitFor();
      assert((await af.locator(':scope > .reference-body > .reference-sources > .reference-provenance').textContent()).includes('bibliographic record checked'));
      await page.getByRole('link', {name:'Trials',exact:true}).click();
      await page.getByRole('heading', {name:'Trials',exact:true}).waitFor();
      assert.equal(await page.getByRole('tab', {name:'Completed evidence',exact:true}).count(), 0);
      assert.equal(await page.getByRole('tablist', {name:'Trials sub-view',exact:true}).getByRole('tab').count(), 3);
      await page.getByRole('link', {name:'Evidence',exact:true}).click();
      await evidence.getByLabel('Find a clinical question', {exact:true}).fill('HERMES');
      const parent = evidence.locator(`[data-reference-id="${reference.data.studies.find(study => study.id === 'hermes').relatedTopic}"]`);
      await parent.locator(':scope > summary').click();
      const hermes = parent.locator('[data-reference-id="hermes"]'); await hermes.locator('summary').click();
      await hermes.getByText(/The NNT is not for functional independence/).waitFor();
      await parent.getByRole('heading', {name:'Study summaries',exact:true}).waitFor();
      await reset(page);
    });
    await check('console and resource errors', async () => {assert.deepEqual(errors,[]);assert.deepEqual(failedResources,[]);assert.deepEqual(consoleMessages.filter(x=>x.type==='error'),[]);});
    report.metrics.totalPageJsTransferBytes=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.initiatorType==='script'||new URL(x.name).pathname.endsWith('.js')).reduce((sum,x)=>sum+x.transferSize,0));
    await context.close();
    await check('fresh complete installation, offline Encounter, Evidence, completed studies and protected drug modal', async () => {
      const offline=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'});const p=await offline.newPage();const offlineErrors=[];p.on('pageerror',e=>offlineErrors.push(e.message));try{
        await p.goto(server.url);await p.getByRole('heading',{name:'Encounter',exact:true}).waitFor();await waitForInstalled(p);await p.reload();await p.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
        const cache = await p.evaluate(async () => {
          const active = (await caches.keys()).filter(name => name.startsWith('stroke-cache-v'));
          let totalBytes = 0, entries = 0, reference; const urls = [];
          for (const name of active) {
            const cached = await caches.open(name);
            for (const request of await cached.keys()) {
              entries++; urls.push(request.url);
              const response = await cached.match(request);
              if (new URL(request.url).pathname === '/stroke/data/clinical-reference.json') {
                const data = await response.clone().json();
                reference = { appVersion: data._meta.appVersion, schemaVersion: data._meta.schemaVersion, topics: data.data.topics.length, studies: data.data.studies.length, calculators: data.data.calculators.length };
              }
              totalBytes += (await response.arrayBuffer()).byteLength;
            }
          }
          return { names: active, totalBytes, entries, urls, reference };
        });
        assert(!cache.urls.some(url=>/education|teaching|TrialScreener|deferred-reference/.test(url)));report.metrics.offlineCacheBytes=cache.totalBytes;
        assert.deepEqual(cache.reference, { appVersion: await p.locator('.app-shell').getAttribute('data-version'), schemaVersion: '2.0.0', topics: reference.data.topics.length, studies: reference.data.studies.length, calculators: reference.data.calculators.length });
        assert.equal(cache.reference.appVersion, reference._meta.appVersion);
        await offline.setOffline(true);await p.reload({waitUntil:'domcontentloaded'});await setupIschemic(p);await p.getByLabel('Manual rationale / recommendations',{exact:true}).fill('Synthetic offline encounter; specialist review pending.');const items=nihssRows(p);await openDetails(items.first());for(let i=0;i<15;i++) await scoreNihssZero(items.nth(i));assert((await p.locator('#calc-tnk').innerText()).includes('TNK 20.75 mg'));assert((await(await generate(p)).inputValue()).includes('NIHSS score: 0/42'));
        await p.getByRole('link',{name:'Trials',exact:true}).click();await p.getByRole('heading',{name:'Trials',exact:true}).waitFor();await p.getByRole('tab',{name:'Database',exact:true}).click();await p.getByRole('searchbox',{name:'Search the study database by acronym, name or NCT number',exact:true}).fill('STEP');assert((await p.getByRole('tabpanel',{name:'Database',exact:true}).innerText()).includes('STEP'));await p.screenshot({path:path.join(outDir,'trials-offline-mobile.png'),fullPage:true});
        assert.equal(await p.evaluate(() => navigator.onLine), false);
        await p.getByRole('link', { name: 'Calculators', exact: true }).click();
        await p.getByRole('heading', { name: 'Calculators', exact: true }).waitFor();
        assert.equal(await p.locator('.supplementary-calculators .tool-target').count(), reference.data.calculators.length);
        await p.getByRole('link', { name: 'Evidence', exact: true }).click();
        const evidence = p.getByRole('region', { name: 'Evidence', exact: true });
        await evidence.getByText(`${reference.data.topics.length} topics found.`, { exact: true }).waitFor();
        assert.equal(await evidence.locator('[data-reference-id]').count(), reference.data.topics.length);
        const topic = evidence.locator('[data-reference-id="af-timing"]');
        await topic.locator('summary').click();
        await topic.locator(':scope > .reference-body > details.reference-sources > summary').waitFor();
        await p.evaluate(() => { location.hash = '#/evidence/elan'; });
        const study = evidence.locator('[data-reference-id="elan"]');
        await p.waitForFunction(() => document.querySelector('[data-reference-id="elan"]')?.open);
        await study.locator(':scope > .reference-body > details.reference-sources > summary').click();
        await study.getByRole('link', { name: 'ELAN primary report', exact: true }).waitFor();
        assert.equal(await p.evaluate(() => navigator.onLine), false);
        await p.screenshot({ path: path.join(outDir, 'evidence-offline-mobile.png'), fullPage: true });
        await p.getByRole('link', { name: 'Encounter', exact: true }).click();
        assert.equal(await p.locator('#tabpanel-encounter').getByLabel('Weight (kg)', { exact: true }).inputValue(), '83');
        assert.equal(await p.getByLabel('Manual rationale / recommendations', { exact: true }).inputValue(), 'Synthetic offline encounter; specialist review pending.');
        await p.getByRole('link',{name:'Protocols',exact:true}).click();await p.getByRole('tab',{name:'ICH protocol tab',exact:true}).click();const trigger=p.getByRole('button',{name:'Vitamin K 10 mg IV',exact:true,includeHidden:true}).first();await openDetails(trigger);await trigger.click();await p.getByRole('dialog').waitFor();assert((await p.getByRole('dialog').innerText()).includes('Vitamin K'));await p.keyboard.press('Escape');assert.equal(await p.getByRole('dialog').count(),0);assert.deepEqual(offlineErrors,[]);await p.screenshot({path:path.join(outDir,'offline-protocol-mobile.png'),fullPage:true});return{cache,simulation:true};
      }finally{await offline.close();}
    });
    await check('published retired raw URLs unavailable and old JSON endpoints return retirement metadata', async () => {
      for(const relative of ['src/app.jsx','documents/references/External Ventricular Drain.pdf','content/bundle.json','assets/select_score_chart.png']){const response=await fetch(new URL(relative,server.url));assert([404,410].includes(response.status),`${relative}: ${response.status}`);}
      for(const relative of ['data/atlas/completed-trials.json','data/atlas/active-trials.json','data/guidelines/index.json']){const response=await fetch(new URL(relative,server.url));if(response.status===404||response.status===410)continue;assert((response.headers.get('content-type')||'').includes('json'));const data=await response.json();assert(data.retired||data.status==='retired'||data.status==='deprecated'||data._meta?.status==='retired',relative);}
    });
    if (args.includes('--live') && !args.includes('--local-only')) await check('live deployed app/reference version parity, Evidence and completed studies', async () => {
      const p = await browser.newPage();
      try {
        await p.goto(process.env.STROKE_LIVE_URL || 'https://rkalani1.github.io/stroke/');
        await p.getByRole('heading', { name: 'Encounter', exact: true }).waitFor();
        const version = JSON.parse(await fs.readFile('package.json', 'utf8')).version;
        assert.equal(await p.locator('.app-shell').getAttribute('data-version'), version);
        const endpoint = new URL('data/clinical-reference.json', p.url()).href;
        const response = await p.request.get(endpoint);
        assert.equal(response.status(), 200);
        assert((response.headers()['content-type'] || '').includes('json'));
        const deployed = await response.json();
        assert.equal(deployed._meta.appVersion, version);
        assert.equal(deployed._meta.schemaVersion, '2.0.0');
        assert.deepEqual(deployed.data, reference.data);
        await p.getByRole('link', { name: 'Evidence', exact: true }).click();
        await p.getByRole('region', { name: 'Evidence', exact: true }).getByText(`${reference.data.topics.length} topics found.`, { exact: true }).waitFor();
        await p.getByRole('link', { name: 'Trials', exact: true }).click();
        await p.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
        assert.equal(await p.getByRole('tab', { name: 'Completed evidence', exact: true }).count(), 0);
        await p.evaluate(() => { location.hash = '#/evidence/elan'; });
        const elanStudy = p.getByRole('region', { name: 'Evidence', exact: true }).locator('[data-reference-id="elan"]');
        await elanStudy.locator(':scope > .reference-body > details.reference-sources > summary').click();
        await elanStudy.getByRole('link', {name:'ELAN primary report',exact:true}).waitFor();
        report.live = { status: 'passed', url: p.url(), version, referenceEndpoint: endpoint, topics: deployed.data.topics.length, studies: deployed.data.studies.length };
      } finally { await p.close(); }
    });
  } finally {await browser.close();await server.close();report.passed=report.checks.every(c=>c.status==='passed');await fs.writeFile(path.join(outDir,'qa-smoke-report.json'),JSON.stringify(report,null,2)+'\n');console.log(`Browser QA ${report.passed?'PASS':'FAIL'}: ${report.checks.filter(c=>c.status==='passed').length}/${report.checks.length}; output/playwright/qa-smoke-report.json`);if(!report.passed)process.exitCode=1;}
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error);process.exitCode=1;});
