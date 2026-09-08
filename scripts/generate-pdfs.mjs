// Export canonical React teaching cards, avoiding duplicated clinical text.
// Build CSS first. STROKE_CHROMIUM_PATH optionally selects a local Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-quickrefs-'));
const destinations = [
  ['ToastClassificationCard','TOAST Stroke Classification'],
  ['DaptRegimensCard','DAPT Guidelines'],
  ['MalignantInfarctionCard','Malignant Infarction'],
  ['AfibAnticoagTimingCard','AFib DOAC Start Timing'],
  ['StrokePrognosisCard','Stroke Prognosis'],
  ['CervicalDissectionCard','Cervical Artery Dissection'],
  ['BrainDeathCard','Brain Death Guidelines'],
  ['EVDInfographic','External Ventricular Drain'],
  ['ICPInfographic','Intracranial Hypertension & Herniation']
];
const rendererPath = path.join(temporary,'render.cjs');
await build({
  stdin: { contents: "import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import * as cards from './src/education.jsx'; export function render(name) { return renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(cards.BedsidePocketCardsStyles),React.createElement(cards[name]))); }", resolveDir:root, loader:'jsx' },
  bundle:true, platform:'node', format:'cjs', outfile:rendererPath, logLevel:'warning'
});
const { render } = createRequire(import.meta.url)(rendererPath);
const css = await fs.readFile(path.join(root,'tailwind.css'),'utf8');
const printCss = [
  '@page { size:letter; margin:0.35in; }',
  '* { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }',
  'html,body { margin:0; background:white; color:#1a1b20; font-family:Arial,sans-serif; }',
  'body { width:748px; }',
  '.no-print,button,[role=button] { display:none !important; }',
  '.bedside-card-view,.card-wrapper,.landscape-card,.card-container,.card-content { width:100% !important; max-width:100% !important; min-width:0 !important; height:auto !important; min-height:0 !important; overflow:visible !important; transform:none !important; }',
  '.bedside-card-view { margin:0 !important; }',
  '.bedside-card-view .card-container { padding:14px !important; box-shadow:none !important; }',
  '.bedside-card-view .card-container,.bedside-card-view .card-content { display:block !important; }',
  '.toast-grid,.checklist-grid,.card-content [style*="grid-template-columns"] { display:block !important; }',
  '.toast-card,.checklist-box { margin:10px 0 !important; }',
  '.card-content :is(p,li,td,th,span,div,strong) { font-size:9.5pt !important; line-height:1.3 !important; }',
  '.card-content :is(h2,h3,h4) { font-size:12pt !important; }',
  '.outcome-row { align-items:flex-start !important; gap:12px !important; break-inside:avoid; margin-bottom:10px !important; }',
  '.outcome-label { flex:0 0 190px !important; width:190px !important; white-space:normal !important; }',
  '.stacked-bar-container { margin-top:6px; }',
  '.card-content .bar-segment { font-size:7pt !important; overflow:hidden; }',
  '.toast-card,.checklist-box,figure,svg,tr { break-inside:avoid; }',
  'h1,h2,h3,h4 { break-after:avoid; }',
  'p,li { orphans:3; widows:3; }',
  'img { max-width:100%; height:auto; }',
  '.ref-citation { margin-top:12px !important; font-size:9pt !important; overflow-wrap:anywhere; }',
  '.card-content .ref-citation,.card-content .ref-citation * { font-size:8.5pt !important; line-height:1.25 !important; }',
  '.quickref-export-date { margin:8px 14px 0; color:#475569; font:9px Arial,sans-serif; }'
].join('\n');
let browser;
try {
  browser = await chromium.launch(process.env.STROKE_CHROMIUM_PATH ? {executablePath:process.env.STROKE_CHROMIUM_PATH} : {});
  const page = await browser.newPage({viewport:{width:816,height:1056}});
  await page.emulateMedia({media:'print',colorScheme:'light'});
  for (const [component,name] of destinations) {
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="' +
      pathToFileURL(root+path.sep).href+'"><title>'+name.replaceAll('&','&amp;') +
      '</title><style>'+css+'</style></head><body>'+render(component)+'<style>'+printCss+'</style></body></html>';
    const htmlPath = path.join(temporary,component+'.html');
    await fs.writeFile(htmlPath,html);
    await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
    await page.evaluate((name) => {
      const card = document.querySelector('.evd-infographic-card,.icp-infographic-card');
      if(card) document.querySelectorAll('body > div').forEach(x => {if(x.contains(card)) x.replaceWith(card);});
      document.querySelectorAll('img').forEach(img => {img.loading='eager';});
      const reference = document.querySelector('.ref-citation');
      if (reference) reference.style.breakInside='avoid';
      const starts = {
        AfibAnticoagTimingCard:'2. Bedside DOAC',
        DaptRegimensCard:'CYP2C19 Genotyping',
        MalignantInfarctionCard:'3. Supportive ICU Care',
        CervicalDissectionCard:'4. Landmark'
      };
      if(starts[name]) {
        const heading=[...document.querySelectorAll('strong,h2,h3,h4')].find(x=>x.textContent.startsWith(starts[name]));
        const block=heading?.closest('div');
        if(block && !block.classList.contains('card-content')) block.style.breakBefore='page';
      }
    }, component);
    await page.evaluate(async () => {await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(()=>{})));});
    const broken=await page.evaluate(()=>[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src));
    if(broken.length) throw new Error('Missing images in '+name+': '+broken.join(', '));
    const destination=path.join(root,'documents/references',name+'.pdf');
    await page.pdf({path:destination,format:'Letter',printBackground:true,preferCSSPageSize:true,
      displayHeaderFooter:true, headerTemplate:'<span></span>',
      footerTemplate:'<div style="width:100%;text-align:center;font:8px Arial;color:#475569">' + name.replaceAll('&','&amp;') + ' · Teaching reference · Generated 2026-09-06 · <span class="pageNumber"></span>/<span class="totalPages"></span></div>'});
    console.log('Generated '+path.relative(root,destination));
  }
} finally {
  await browser?.close();
  await fs.rm(temporary,{recursive:true,force:true});
}
