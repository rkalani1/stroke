// Export canonical React teaching cards, avoiding duplicated clinical text.
// Build CSS first. STROKE_CHROMIUM_PATH optionally selects a local Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MAINTAINED_DOWNLOADS, RETIRED_DOWNLOADS } from '../src/download-manifest.js';
const root = process.cwd();
const exportDate = process.env.STROKE_PDF_EXPORT_DATE || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(exportDate)) throw new Error('STROKE_PDF_EXPORT_DATE must be YYYY-MM-DD');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-quickrefs-'));
const destinations = MAINTAINED_DOWNLOADS;
const outputArg = process.argv.indexOf('--output-dir');
if (outputArg >= 0 && (!process.argv[outputArg + 1] || process.argv[outputArg + 1].startsWith('--'))) {
  throw new Error('--output-dir requires a candidate directory');
}
// Candidate exports stay outside the public documents tree until reviewed.
const outputDir = outputArg >= 0 ? path.resolve(process.argv[outputArg + 1]) : path.join(root, 'documents/references');
await fs.mkdir(outputDir, { recursive: true });
// Operational EVD/ICP handouts were retired by the source review. Do not
// regenerate them from reference-only replacement cards or stale components.
for (const { path: file } of RETIRED_DOWNLOADS) {
  try { await fs.access(path.join(root, file)); }
  catch { continue; }
  throw new Error('Retired clinical export is still present: ' + file);
}
const selected = process.argv.indexOf('--only');
const selectedName = selected >= 0 ? process.argv[selected + 1] : null;
if (selected >= 0 && !destinations.some(({ component }) => component === selectedName)) {
  throw new Error('--only must name an approved export component');
}
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
  // This accessible image trigger contains clinical artwork that must print.
  '.card-cervical-dissection button[aria-label="Open cervical artery dissection stroke mechanisms image"] { display:flex !important; }',
  '.bedside-card-view,.card-wrapper,.landscape-card,.card-container,.card-content { width:100% !important; max-width:100% !important; min-width:0 !important; height:auto !important; min-height:0 !important; overflow:visible !important; transform:none !important; }',
  '.bedside-card-view { margin:0 !important; }',
  '.bedside-card-view .card-container { padding:14px !important; box-shadow:none !important; }',
  '.bedside-card-view .card-container,.bedside-card-view .card-content { display:block !important; }',
  '.toast-grid,.checklist-grid,.card-content [style*="grid-template-columns"] { display:block !important; }',
  '.toast-card,.checklist-box { margin:10px 0 !important; }',
  '.card-stroke-prognosis [style*="repeat(6"] { display:grid !important; }',
  '.card-stroke-prognosis th:first-child { padding-right:8px !important; }',
  '.clinical-scroll-region { overflow:visible !important; max-height:none !important; }',
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
  for (const { component, title: name, path: publicPath } of destinations) {
    if (selectedName && component !== selectedName) continue;
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="' +
      pathToFileURL(root+path.sep).href+'"><title>'+name.replaceAll('&','&amp;') +
      '</title><style>'+css+'</style></head><body>'+render(component)+'<style>'+printCss+'</style></body></html>';
    const htmlPath = path.join(temporary,component+'.html');
    await fs.writeFile(htmlPath,html);
    if (outputArg >= 0) await fs.writeFile(path.join(outputDir, component + '.html'), html);
    await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
    await page.evaluate((name) => {
      // Flatten the two-column teaching layout into its numbered reading order.
      if (name === 'ToastClassificationCard') {
        const grid = document.querySelector('.toast-grid');
        const cards = [...(grid?.querySelectorAll('.toast-card') || [])];
        if (cards.length !== 5) throw new Error('Expected all five TOAST categories');
        const number = card => Number(card.querySelector('h3')?.textContent.match(/^\s*(\d+)\./)?.[1]);
        cards.sort((a, b) => number(a) - number(b));
        if (cards.some((card, i) => number(card) !== i + 1)) throw new Error('Invalid TOAST category order');
        grid.replaceChildren(...cards);
      }
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
      if(name === 'CervicalDissectionCard') {
        const heading=[...document.querySelectorAll('strong')].find(x=>x.textContent.startsWith('3. Medical Management'));
        if(heading?.parentElement) {heading.parentElement.style.breakBefore='page';heading.parentElement.style.breakInside='avoid';}
      }
    }, component);
    await page.evaluate(async () => {await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(()=>{})));});
    const broken=await page.evaluate(()=>[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src));
    if(broken.length) throw new Error('Missing images in '+name+': '+broken.join(', '));
    const destination=path.join(outputDir,path.basename(publicPath));
    await page.pdf({path:destination,format:'Letter',printBackground:true,preferCSSPageSize:true,
      displayHeaderFooter:true, headerTemplate:'<span></span>',
      footerTemplate:'<div style="width:100%;text-align:center;font:8px Arial;color:#475569">' + name.replaceAll('&','&amp;') + ' · Teaching reference · Generated ' + exportDate + ' · <span class="pageNumber"></span>/<span class="totalPages"></span></div>'});
    console.log('Generated '+path.relative(root,destination));
  }
} finally {
  await browser?.close();
  await fs.rm(temporary,{recursive:true,force:true});
}
