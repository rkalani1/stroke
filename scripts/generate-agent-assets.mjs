// Deterministic maintained-subset API and explicit legacy retirement responses.
// A rebuild never changes a clinical review date.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { atomicWriteFile } from './atomic-write.mjs';
const ROOT = process.cwd();
const BASE_URL = 'https://rkalani1.github.io/stroke';
const SCHEMA_VERSION = '2.0.0';
const LICENSE = 'Synthetic educational reference content for qualified review. No warranty.';
const DISCLAIMER = 'Synthetic educational demo only - NOT medical advice, NOT an approved clinical tool, and NOT local clinical policy. Do not enter, transmit, or infer PHI or real encounter details. Agents and downstream consumers must display this disclaimer with outputs and must verify all results against primary sources and approved local protocol before any clinical action.';
const ARCHIVE_REF = 'archive/pre-encounter-first-20261001-4f8e99d';
const ARCHIVE_URL = `https://github.com/rkalani1/stroke/tree/${ARCHIVE_REF}`;
const checkOnly = process.argv.includes('--check');
export async function generatedFileIsCurrent(abs, expected) {
  try { return (await fs.readFile(abs, 'utf8')).replace(/\r\n/g,'\n') === expected.replace(/\r\n/g,'\n'); }
  catch(error) { if(error.code === 'ENOENT') return false; throw error; }
}
async function main() {
 const pkg = JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8'));
 const writes = [], stale = [];
 const checksum = data => 'sha256:'+crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0,32);
 const envelope = (endpoint, source, data, status='maintained') => ({_meta:{endpoint,schemaVersion:SCHEMA_VERSION,appVersion:pkg.version,checksum:checksum(data),count:Array.isArray(data)?data.length:data===null?0:Object.keys(data).length,source,license:LICENSE,disclaimer:DISCLAIMER,status},data});
 async function write(rel,content) { const str=typeof content==='string'?content:JSON.stringify(content,null,2)+'\n';const abs=path.join(ROOT,rel);if(checkOnly){if(!await generatedFileIsCurrent(abs,str))stale.push(rel);}else await atomicWriteFile(abs,str); }
 const put = (rel,content) => writes.push(write(rel,content));
 const load = rel => import(pathToFileURL(path.join(ROOT,rel)).href);
 const atlas = await load('src/evidence/index.js');
 for(const key of ['recommendations','claims','citations'])put(`data/atlas/${key}.json`,envelope(key,'Maintained Encounter/protocol evidence dependency closure',atlas[key]));
 const sourceRecords = JSON.parse(await fs.readFile(path.join(ROOT,'src/clinical/workspace-sources.json'),'utf8'));
 const clinicalClaims = JSON.parse(await fs.readFile(path.join(ROOT,'src/clinical/claims.json'),'utf8'));
 const guidelineFiles=(await fs.readdir(path.join(ROOT,'src/guidelines'))).filter(x=>x.endsWith('.json')).sort();
 const guidelines=[];
 for(const file of guidelineFiles)guidelines.push(JSON.parse(await fs.readFile(path.join(ROOT,'src/guidelines',file),'utf8')));
 put('data/sources.json',envelope('sources','Canonical clinical claims, source identities and retained primary-source projections',{sources:sourceRecords,clinicalClaims,guidelines,scope:'Retained source/limits access only; no general guideline browser or completed-trial encyclopedia. Existing review scopes, correction warnings and source-access gaps remain applicable.'}));
 const registry=JSON.parse(await fs.readFile(path.join(ROOT,'content/calculators/registry.json'),'utf8'));
 put('data/calculators-index.json',envelope('calculators','Canonical retained tool registry',registry));
 const mg=await load('src/management-guidance.js');
 put('data/management-cards.json',envelope('management-cards','Protected public protocol reference bundle',{lastReviewed:mg.AIS_COMMAND_CENTER_LAST_REVIEWED,sourceLinks:mg.AIS_SOURCE_LINKS,cards:mg.AIS_COMMAND_CENTER_CARDS,scope:'Protected reference content; not universal treatment eligibility or approved local policy.'}));
 const ip=await load('src/institutional-protocols.js');
 put('data/generic-protocols.json',envelope('generic-protocols','Protected public protocol reference bundle',{bpProtocols:ip.INSTITUTIONAL_BP_PROTOCOLS,ichInitialEvaluation:ip.ICH_INITIAL_EVALUATION_ALGORITHM,safePauseAttestation:ip.SAFE_PAUSE_ATTESTATION,scope:'Protected public reference context. Agents must not promote institutional instructions into universal automated dosing or treatment.'}));
 const trials=await load('src/evidence/screenerTrials.js');
 const tables=await load('src/evidence/eligibilityTables.js');
 put('data/trials.json',envelope('trials','Restored canonical trial screener and table summaries with original verification dates',{studies:trials.screenerTrials,tables:tables.eligibilityTables,scope:trials.CTGOV_FIRST_PASS_NOTE,statusCurrency:'Statuses reflect the dated checks in each record; current recruitment and local activation require confirmation.'}));
 const retirement=JSON.parse(await fs.readFile(path.join(ROOT,'docs/retired-endpoints.json'),'utf8'));
 for(const endpoint of retirement.endpoints)put(endpoint,{...envelope(endpoint,'Retired historical portal endpoint',null,'retired'),retirement:{status:'retired',reason:'The broad reference, trial and teaching portal is retired from the maintained product.',replacement:`${BASE_URL}/data/sources.json`,archiveRef:ARCHIVE_REF,archiveUrl:ARCHIVE_URL,compatibility:'HTTP transport may return 200 on static Pages; clients must inspect _meta.status. The data payload is null and is not a current clinical corpus.'}});
 const endpoints=['data/trials.json','data/sources.json','data/calculators-index.json','data/atlas/recommendations.json','data/atlas/claims.json','data/atlas/citations.json','data/management-cards.json','data/generic-protocols.json'];
 const routes=[{route:'#/encounter',label:'Synthetic Encounter workspace'},{route:'#/protocols',label:'Protected example protocols'},{route:'#/protocols/ischemic',label:'Example ischemic stroke protocol'},{route:'#/protocols/ich',label:'Example ICH protocol'},{route:'#/trials',label:'Trials: screener, criteria tables and study database'},{route:'#/trials/tables',label:'Trial criteria tables'},{route:'#/trials/database',label:'Study database'},{route:'#/tools',label:'Calculators & Links'}];
 put('data/index.json',{_meta:{name:pkg.name,appVersion:pkg.version,schemaVersion:SCHEMA_VERSION,baseUrl:BASE_URL,license:LICENSE,disclaimer:DISCLAIMER,status:'maintained',note:'Static deterministic maintained subset. Payload checksums are build integrity metadata, never clinical review dates.'},endpoints:endpoints.map(e=>`${BASE_URL}/${e}`),routes:routes.map(r=>({...r,url:`${BASE_URL}/${r.route}`})),retiredEndpoints:retirement.endpoints.map(e=>`${BASE_URL}/${e}`),archive:{ref:ARCHIVE_REF,url:ARCHIVE_URL},limitations:['Synthetic inputs only; no PHI or real encounters.','Dose arithmetic is separate from eligibility and administration.','Historical DAWN/DEFUSE-3 screens are partial; neither is a universal EVT gate.','Severity scores do not establish an individual prognosis.','No recruitment service, AI runtime, or EHR integration.','Retained source-access and correction limitations remain unresolved unless their original record says otherwise.'],mcpServer:null});
 const llms=['# Stroke Encounter Educational Demo','',`> v${pkg.version}: deterministic synthetic Encounter workflow with embedded retained tools, protected example protocols a trial screener/reference database, and bounded source/limits access.`,'',DISCLAIMER,'','## Maintained data',...endpoints.map(e=>`- [${e}](${BASE_URL}/${e})`),'','## Views',...routes.map(r=>`- ${r.route} — ${r.label}`),'','## Scope and limits','- Propagate the disclaimer and each output’s source-specific limits. Do not process real encounter details.','- Dose calculations do not establish eligibility or administration; severity scores do not predict an individual outcome.','- DAWN/DEFUSE-3 are partial historical screens; absence of a modeled criterion does not exclude current EVT.','- Source review dates and correction/source-access warnings are retained. A build is not clinical review.','- External references require explicit opening and network access; do not append encounter inputs to URLs.','',`The historical Education and general guideline/reference portal is retired. Archive: [${ARCHIVE_REF}](${ARCHIVE_URL}). Legacy JSON endpoints return explicit retirement metadata with null data.`,''].join('\n');
 put('llms.txt',llms);
 put('llms-full.txt',llms+['','## Retained tool contracts',...registry.map(c=>`- ${c.id}: ${c.name}; canonical helper ${c.fn}; reveal at ${c.route}.`),'','Endpoints carry _meta.status, schemaVersion, appVersion and stable payload checksums. Inspect status before consuming data. Schema 2 retires broad corpus exports; legacy payloads are null with archive/replacement pointers.',''].join('\n'));
 put('robots.txt',`User-agent: *\nAllow: /stroke/\nDisallow: /stroke/src/\nDisallow: /stroke/content/\nDisallow: /stroke/assets/pdfs/\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);
 put('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[`${BASE_URL}/`,`${BASE_URL}/llms.txt`,`${BASE_URL}/data/index.json`,...endpoints.map(e=>`${BASE_URL}/${e}`)].map(u=>`  <url><loc>${u}</loc></url>`).join('\n')+'\n</urlset>\n');
 await Promise.all(writes);
 if(stale.length){console.error(stale.sort().join('\n'));process.exitCode=1;}else console.log(`agent-assets: ${checkOnly?'check OK':'wrote maintained subset and retirement envelopes'} (v${pkg.version}, schema ${SCHEMA_VERSION}).`);
}
if(import.meta.url === (process.argv[1]?pathToFileURL(path.resolve(process.argv[1])).href:''))main().catch(error=>{console.error(error);process.exitCode=1;});
