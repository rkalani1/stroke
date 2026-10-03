// Actual stdio contracts: synthetic arithmetic, strict input, historical scope and retirement.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const canonical = JSON.parse(fs.readFileSync(new URL('../data/clinical-reference.json', import.meta.url)));
const toolRegistry = JSON.parse(fs.readFileSync(new URL('../data/calculators-index.json', import.meta.url))).data;
const client = new Client({name:'smoke',version:'2.0.0'});
await client.connect(new StdioClientTransport({command:'node',args:[new URL('./server.mjs',import.meta.url).pathname]}));
const called=new Set();let count=0;
async function call(name,args={}) { const r=await client.callTool({name,arguments:args});assert.notEqual(r.isError,true);called.add(name);count++;const b=JSON.parse(r.content[0].text);assert.match(b._disclaimer,/Synthetic educational demo only/);return b; }
async function rejects(name,args){count++;let r;try{r=await client.callTool({name,arguments:args});}catch(error){assert.equal(error.code,-32602);return;}assert.equal(r.isError,true);}
try {
 const {tools}=await client.listTools();
 assert.deepEqual(new Set(tools.map(t=>t.name)),new Set(['calc_tnk_dose','calc_alteplase_dose','calc_crcl','calc_dawn_eligibility','calc_defuse3_eligibility','list_calculators','get_sources','search_reference']));
 for(const weightKg of [40,80,83,99.99,100,100.01,140]) {
  const tnk=(await call('calc_tnk_dose',{weightKg})).result;assert.equal(Number(tnk.calculatedDose),Math.round(Math.min(weightKg/4,25)*100)/100);assert.equal(tnk.authority,'guideline');
  const a=(await call('calc_alteplase_dose',{weightKg})).result;const total=Math.round(Math.min(weightKg*0.9,90)*10)/10;assert(Math.abs(Number(a.totalDose)-total)<1e-9);assert(Math.abs(Number(a.bolus)+Number(a.infusion)-Number(a.totalDose))<1e-9);
 }
 assert.equal((await call('calc_tnk_dose',{weightKg:69,authority:'fda-label'})).result.calculatedDose,'17.5');
 for(const weightKg of [0,-1,351,'83abc',true,null])for(const name of ['calc_tnk_dose','calc_alteplase_dose'])await rejects(name,{weightKg});
 for(const [sex,factor] of [['male',1],['female',0.85]]) { const r=(await call('calc_crcl',{age:70,weight:80,sex,creatinine:1})).result;assert(Math.abs(r.rawValue-70*80*factor/72)<1e-10); }
 for(const patch of [{sex:'M'},{age:10},{creatinine:''},{weight:[80]}])await rejects('calc_crcl',{age:70,weight:80,sex:'male',creatinine:1,...patch});
 for(const [name,args] of [['calc_dawn_eligibility',{age:70,nihss:15,coreMl:10,timeFromLKWh:10}],['calc_defuse3_eligibility',{age:70,nihss:15,coreMl:10,penumbraMl:30,timeFromLKWh:10}]]){const r=(await call(name,args)).result;assert.equal(r.eligible,null);assert.equal(r.partialScreenMet,true);assert.equal(r.actionable,false);assert.equal(r.missingDomains.length,3);await rejects(name,{...args,nihss:15.5});}
 await rejects('calc_defuse3_eligibility',{age:70,nihss:10,coreMl:30,penumbraMl:20,timeFromLKWh:10});
 const late=await call('calc_dawn_eligibility',{age:70,nihss:20,coreMl:5,timeFromLKWh:4});assert.equal(late.result.eligible,false);assert.match(late.result.nonExclusionNote,/does not exclude EVT/);assert(!('meetsImaging' in late.result)&&!('meetsClinical' in late.result));assert.equal(late.appVersion,JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url))).version);
 const zeroCore=(await call('calc_defuse3_eligibility',{age:70,nihss:10,coreMl:0,penumbraMl:40,timeFromLKWh:10})).result;assert.equal(zeroCore.mismatchRatio,'infinite (core 0 mL)');assert(!('meetsMismatch' in zeroCore));
 assert.match((await call('calc_tnk_dose',{weightKg:7.5})).weightWarning,/below 30 kg/);assert.equal((await call('calc_alteplase_dose',{weightKg:80})).weightWarning,undefined);assert.match((await call('calc_alteplase_dose',{weightKg:80})).result.administration,/over 60 minutes/);
 assert.match((await call('calc_crcl',{age:70,weight:80,sex:'male',creatinine:1,heightCm:66})).heightWarning,/centimeters/);
 const registry=await call('list_calculators');assert.equal(registry.calculators.find(x=>x.id==='defuse3').mcpTool,'calc_defuse3_eligibility');assert.equal(registry.calculators.find(x=>x.id==='ich-volume').mcpTool,null);assert.equal(registry.count,toolRegistry.length);assert(registry.calculators.every(x=>/^#\/(encounter|tools)\//.test(x.route)));assert.equal(registry.calculators.filter(x=>x.module==='supplementary-calculators').length,canonical.data.calculators.length);assert(!registry.calculators.some(x=>['rcvs2','pcc-dose','doac-start','enoxaparin'].includes(x.id)));
 const sources=await call('get_sources');assert.equal(sources.metadata.status,'maintained');assert.equal(sources.sources.guidelines.length,6);assert(sources.sources.guidelines.find(g=>g.id==='ais-2026').publicationUpdates.some(u=>u.status==='partially-applied'));
 const reference=await call('search_reference');assert.equal(reference.count,10);assert.equal(reference.totalMatched,canonical.data.topics.length+canonical.data.studies.length);assert.equal(reference.truncated,true);assert.equal(reference.metadata.topicCount,canonical.data.topics.length);assert.equal(reference.metadata.studyCount,canonical.data.studies.length);
 const elan=await call('search_reference',{query:'ELAN',type:'study',setting:'hospital'});assert.deepEqual(elan.records.map(record=>record.id),['elan','catalyst']);assert(elan.records[0].limits);assert(elan.records[0].sources.every(source=>source.access&&source.checkedAt&&source.url.startsWith('https://')));
 const topics=await call('search_reference',{type:'topic',setting:'clinic',limit:25});assert(topics.count>0);assert(topics.records.every(record=>record.type==='topic'&&record.settings.includes('clinic')&&record.caution));assert.equal(topics.truncated,topics.totalMatched>25);
 const section=canonical.data.topics[0].category;const sectionResults=await call('search_reference',{section,limit:25});assert(sectionResults.records.length>0);assert(sectionResults.records.every(record=>record.category===section));
 const question=await call('search_reference',{query:'what is the bp target for ich',type:'topic'});assert(question.count>0);
 const byRec=await call('search_reference',{query:'ais-2026-114',type:'topic'});assert(byRec.records.slice(0,2).some(record=>record.id==='large-core-evt'));assert.equal((await call('search_reference',{query:'ais-2026-72',type:'topic'})).records[0].id,'acute-bp');
 assert.equal((await call('calc_defuse3_eligibility',{age:70,nihss:10,coreMl:21,penumbraMl:37.8,timeFromLKWh:10})).result.partialScreenMet,true);
 const empty=await call('search_reference',{query:'no-such-reference-xyz'});assert.equal(empty.count,0);assert.equal(empty.totalMatched,0);assert.equal(empty.truncated,false);
 for(const args of [{query:'x'.repeat(201)},{query:12},{type:'enrolling'},{setting:'emergency'},{section:'not-a-section'},{limit:0},{limit:26},{limit:1.5},{limit:'10'}])await rejects('search_reference',args);
 await rejects('search_trials',{query:'stroke'});await rejects('get_guideline',{id:'ais-2026'});
 assert.equal(called.size,tools.length);
 console.log(`SMOKE OK: ${count} calls across all ${tools.length} maintained tools; retired tool names unavailable.`);
}finally{await client.close();}
