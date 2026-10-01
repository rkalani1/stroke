// Actual stdio contracts: synthetic arithmetic, strict input, historical scope and retirement.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
const client = new Client({name:'smoke',version:'2.0.0'});
await client.connect(new StdioClientTransport({command:'node',args:[new URL('./server.mjs',import.meta.url).pathname]}));
const called=new Set();let count=0;
async function call(name,args={}) { const r=await client.callTool({name,arguments:args});assert.notEqual(r.isError,true);called.add(name);count++;const b=JSON.parse(r.content[0].text);assert.match(b._disclaimer,/Synthetic educational demo only/);return b; }
async function rejects(name,args){count++;let r;try{r=await client.callTool({name,arguments:args});}catch(error){assert.equal(error.code,-32602);return;}assert.equal(r.isError,true);}
try {
 const {tools}=await client.listTools();
 assert.deepEqual(new Set(tools.map(t=>t.name)),new Set(['calc_tnk_dose','calc_alteplase_dose','calc_crcl','calc_dawn_eligibility','calc_defuse3_eligibility','list_calculators','get_sources']));
 for(const weightKg of [40,80,83,99.99,100,100.01,140]) {
  const tnk=(await call('calc_tnk_dose',{weightKg})).result;assert.equal(Number(tnk.calculatedDose),Math.min(weightKg/4,25));assert.equal(tnk.authority,'guideline');
  const a=(await call('calc_alteplase_dose',{weightKg})).result;const total=Math.min(weightKg*0.9,90);assert(Math.abs(Number(a.totalDose)-total)<1e-9);assert(Math.abs(Number(a.bolus)+Number(a.infusion)-total)<1e-9);
 }
 assert.equal((await call('calc_tnk_dose',{weightKg:69,authority:'fda-label'})).result.calculatedDose,'17.5');
 for(const weightKg of [0,-1,351,'83abc',true,null])for(const name of ['calc_tnk_dose','calc_alteplase_dose'])await rejects(name,{weightKg});
 for(const [sex,factor] of [['male',1],['female',0.85]]) { const r=(await call('calc_crcl',{age:70,weight:80,sex,creatinine:1})).result;assert(Math.abs(r.rawValue-70*80*factor/72)<1e-10); }
 for(const patch of [{sex:'M'},{age:10},{creatinine:''},{weight:[80]}])await rejects('calc_crcl',{age:70,weight:80,sex:'male',creatinine:1,...patch});
 for(const [name,args] of [['calc_dawn_eligibility',{age:70,nihss:15,coreMl:10,timeFromLKWh:10}],['calc_defuse3_eligibility',{age:70,nihss:15,coreMl:10,penumbraMl:30,timeFromLKWh:10}]]){const r=(await call(name,args)).result;assert.equal(r.eligible,null);assert.equal(r.partialScreenMet,true);assert.equal(r.actionable,false);assert.equal(r.missingDomains.length,3);await rejects(name,{...args,nihss:15.5});}
 const registry=await call('list_calculators');assert.equal(registry.count,10);assert(registry.calculators.every(x=>x.route.startsWith('#/encounter/')));assert(!registry.calculators.some(x=>['rcvs2','pcc-dose','doac-start','enoxaparin'].includes(x.id)));
 const sources=await call('get_sources');assert.equal(sources.metadata.status,'maintained');assert.equal(sources.sources.guidelines.length,6);assert(sources.sources.guidelines.find(g=>g.id==='ais-2026').publicationUpdates.some(u=>u.status==='partially-applied'));
 await rejects('search_trials',{query:'stroke'});await rejects('get_guideline',{id:'ais-2026'});
 assert.equal(called.size,tools.length);
 console.log(`SMOKE OK: ${count} calls across all ${tools.length} maintained tools; retired tool names unavailable.`);
}finally{await client.close();}
