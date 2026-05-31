import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const axeSource = readFileSync('/Users/rizwankalani/code/stroke/node_modules/axe-core/axe.min.js', 'utf8');
const BASE = 'http://localhost:8997/index.html';
const THEME = process.argv[2] || 'dark'; // dark | light
const MODE = process.argv[3] || 'full';  // full | rules

const RULES = ['color-contrast','select-name','label','scrollable-region-focusable','aria-valid-attr-value'];

function dedupe(violations){
  return violations.map(v=>({id:v.id, impact:v.impact, n:v.nodes.length,
    nodes:v.nodes.slice(0,40).map(nd=>({target:nd.target, html:(nd.html||'').slice(0,160), summary:(nd.failureSummary||'').slice(0,200)}))}));
}

const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleErrs = [];
page.on('console', m => { if(m.type()==='error') consoleErrs.push(m.text().slice(0,200)); });
page.on('pageerror', e => consoleErrs.push('PAGEERROR: '+String(e).slice(0,200)));

// 1. load once to set localStorage on origin
await page.goto(BASE, {waitUntil:'domcontentloaded'});
await page.evaluate((theme)=>{
  localStorage.setItem('stroke.v7.theme', theme);
  localStorage.setItem('stroke.v7.migrated','1');
}, THEME);
// 2. reload so bootstrap applies theme
await page.goto(BASE, {waitUntil:'networkidle'});
await page.waitForTimeout(1200);

// assert theme surfaces
const themeState = await page.evaluate(()=>({
  dataTheme: document.documentElement.getAttribute('data-theme'),
  hasDark: document.documentElement.classList.contains('dark'),
  paper: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()
}));
console.log('THEME_STATE', JSON.stringify(themeState));

// Navigate to Encounter
await page.evaluate(()=>{ window.location.hash = '#/encounter'; });
await page.waitForTimeout(800);

// Click "Video Telestroke" tab
try {
  const btn = page.getByRole('tab', {name:'Video Telestroke'});
  await btn.click({timeout:4000});
} catch(e){ console.log('VT_TAB_CLICK_FAIL', String(e).slice(0,120)); }
await page.waitForTimeout(800);

// Expand all collapsible sections to surface all controls (best-effort)
await page.evaluate(()=>{
  document.querySelectorAll('details:not([open])').forEach(d=>d.open=true);
});
await page.waitForTimeout(400);

// Inject axe and run
await page.evaluate(axeSource);
const result = await page.evaluate(async (rules)=>{
  const opts = { runOnly: { type:'rule', values: rules } };
  return await window.axe.run(document, opts);
}, RULES);

console.log('=== AXE RULES SCAN ('+THEME+') Encounter/VideoTelestroke ===');
console.log(JSON.stringify(dedupe(result.violations), null, 2));
console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrs.slice(0,20)));

await browser.close();
