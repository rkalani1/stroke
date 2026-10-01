import fs from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
import * as c from '../src/calculators-extended.js';
import * as reviewed from '../src/encounter-clinical-review.js';
import * as decisions from '../src/encounter-decision-status.js';
import * as baseCalculators from '../src/calculators.js';
import { isSuccessfulEvtReperfusion } from '../src/institutional-protocols.js';
import { completeCases } from './fixtures/clinical-complete-cases.js';
const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start=source.indexOf('const GUIDELINE_URLS ='), end=source.indexOf('const getPathwayForDiagnosis',start);
const cards=vm.runInNewContext(source.slice(start,end)+'\nGUIDELINE_RECOMMENDATIONS',{...reviewed,...decisions,...baseCalculators,isSuccessfulEvtReperfusion});
const cases = {
 ...Object.fromEntries(['calculateESSEN','calculateSPI2','calculateBAT','calculateBRAIN','calculateNinePoint','calculateCHADS2VA','calculateHAVOC','interpretMRS9Q'].map(k=>[k,completeCases[k]])),
 calculateSeLECTScore: {...completeCases.calculateSeLECTScore, nihss:2},
 calculateEDEMAScore: {...completeCases.calculateEDEMAScore, midlineShiftMm:0},
 calculateOgilvyCarter: {age:40,huntHess:1,fisher:1,size:5,posteriorCirculation:false},
 calculateVASOGRADE: {wfns:1,modifiedFisher:1}
};
describe('complete observation versus omitted, cleared and invalid clinical fields',()=>{
 for (const [name, data] of Object.entries(cases)) {
  it(`${name}: a complete valid comparison case still calculates`,()=>expect(c[name](data)).not.toBeNull());
  it(`${name}: a blank form does not become a reassuring score`,()=>expect(c[name]({})).toBeNull());
  for(const key of Object.keys(data)) it(`${name}: missing ${key} withdraws the score`,()=>{const x={...data};delete x[key];expect(c[name](x)).toBeNull();});
  for(const [key,value] of Object.entries(data)) {
   if(typeof value==='number') it(`${name}: ${key} rejects partial strings, booleans, whitespace and arrays`,()=>{for(const invalid of ['1abc',' ',true,[],Infinity,NaN])expect(c[name]({...data,[key]:invalid})).toBeNull();});
   if(typeof value==='boolean') it(`${name}: ${key} requires an assessed boolean`,()=>{for(const invalid of ['',null,'false',0,1])expect(c[name]({...data,[key]:invalid})).toBeNull();});
  }
 }
 it('VASOGRADE accepts only native ranges and does not assign Green to modified Fisher0',()=>{for(const x of [{wfns:0,modifiedFisher:1},{wfns:6,modifiedFisher:1},{wfns:1,modifiedFisher:5},{wfns:1.5,modifiedFisher:1}])expect(c.calculateVASOGRADE(x)).toBeNull();expect(c.calculateVASOGRADE({wfns:1,modifiedFisher:0}).grade).toBe('Unclassified');});
 it('BRAIN retains the score without invented risk bands',()=>{const r=c.calculateBRAIN(completeCases.calculateBRAIN);expect(r.score).toBe(0);expect(r.risk).toBeNull();});
 it('NinePoint explicitly distinguishes absent, unavailable and undocumented CTA',()=>{const x={...completeCases.calculateNinePoint};expect(c.calculateNinePoint({...x,spotSign:'unavailable'}).score).toBe(1);expect(c.calculateNinePoint({...x,spotSign:false}).score).toBe(0);expect(c.calculateNinePoint({...x,spotSign:undefined})).toBeNull();});
 it('PHQ9 requires an integer and does not clear safety concerns at low totals',()=>{for(const score of [1.9,'3abc','',true,-1,28])expect(c.interpretPHQ9(score)).toBeNull();expect(c.interpretPHQ9(0).action).not.toContain('No treatment needed');expect(c.interpretPHQ9(0).safetyNote).toContain('item 9');});
 it('dysphagia cannot pass before every observation is documented',()=>{const x=completeCases.interpretBarnesJewishDysphagia;expect(c.interpretBarnesJewishDysphagia(x).pass).toBe(true);for(const key of Object.keys(x)){const p={...x};delete p[key];expect(c.interpretBarnesJewishDysphagia(p).pass).toBeNull();}expect(c.interpretBarnesJewishDysphagia({...x,coughOnWater3oz:true}).pass).toBe(false);});
 it('driving clearance is unresolved without a jurisdiction and functional assessment',()=>{expect(c.recommendDriving({}).mayDrive).toBeNull();expect(c.recommendDriving({strokeType:'tia',severity:'minor'}).minWait).toBeNull();expect(c.recommendDriving({seizure:true}).mayDrive).toBe(false);});
 it('VTE timing does not infer mobility, imaging or a fixed post-securing time',()=>{expect(c.recommendVTEProphylaxis({diagnosis:'ich',days:2}).agent).toBeNull();expect(c.recommendVTEProphylaxis({diagnosis:'ich',days:2,immobile:true}).modality).toContain('mechanical');const sah=c.recommendVTEProphylaxis({diagnosis:'sah',days:2,immobile:true,aneurysmSecured:true});expect(sah.rationale).toContain('uncertain');expect(sah.agent).not.toMatch(/40 mg/);});
 it('DAPT numeric severity alone or conflicting bleeding concern cannot authorize a regimen',()=>{expect(c.recommendAcuteDAPT({nihss:2,strokeType:'ischemic',timeFromOnsetH:2}).regimen).toBe('—');const x={...completeCases.recommendAcuteDAPT,nihss:2,strokeType:'ischemic',timeFromOnsetH:2};expect(c.recommendAcuteDAPT(x).regimen).toBe('clopidogrel+ASA');for(const key of Object.keys(completeCases.recommendAcuteDAPT))expect(c.recommendAcuteDAPT({...x,[key]:false}).regimen).toBe('—');expect(c.recommendAcuteDAPT({...x,ichRisk:'high'}).regimen).toBe('individualized-review');});
 it('malformed trial-location input stays unresolved without throwing',()=>{for(const location of [true,42,[],{}])for(const name of ['evaluateENRICHEligibility','evaluateSWITCHEligibility'])expect(c[name]({icHLocation:location}).status).toBe('incomplete');});
 it('strict trial and attribution screens reject numeric suffix coercion',()=>{expect(c.evaluateDAWN({age:'60years',nihss:10,coreMl:20,timeFromLKWh:8})).toBeNull();expect(c.evaluateDEFUSE3({age:60,nihss:10,coreMl:'20mL',hypoperfusedMl:50,timeFromLKWh:8})).toBeNull();expect(c.evaluatePASCAL({ropeScore:'7abc',largeShunt:true,atrialSeptalAneurysm:false})).toBeNull();expect(c.evaluateENRICHEligibility({icHLocation:'lobar',volumeMl:50,gcs:10,timeFromOnsetH:5,premorbidMRS:0,age:'60years',nihss:10}).status).toBe('incomplete');});
});
describe('original SeLECT Figure3 numerical source pairing',()=>{
 const y1=['0.7%','1%','2%','4%','6%','11%','18%','28%','44%','63%'];
 const y5=['1.3%','2%','4%','6%','11%','18%','29%','45%','65%','83%'];
 it('all ten published rows are reached with complete observations and match primary Figure3',()=>{const seen=new Set();for(const nihss of [0,4,11])for(let bits=0;bits<16;bits++){const r=c.calculateSeLECTScore({nihss,corticalInvolvement:!!(bits&1),earlySeizure:!!(bits&2),largeArteryAtherosclerosis:!!(bits&4),middleCerebralTerritory:!!(bits&8)});seen.add(r.score);expect(r.oneYearRisk).toBe(y1[r.score]);expect(r.fiveYearRisk).toBe(y5[r.score]);expect(r.oneYearConfidenceInterval).toBeTruthy();expect(r.riskTier).toBeNull();}expect(seen.size).toBe(10);});
 it('an LVO diagnosis is not an atherosclerotic etiology',()=>{expect(c.calculateSeLECTScore({nihss:2,lvoArtery:true})).toBeNull();expect(c.calculateSeLECTScore({...completeCases.calculateSeLECTScore,nihss:2,lvoArtery:true}).breakdown.largeArteryAtherosclerosisPoints).toBe(0);});
});
describe('retained recommendation detail no longer contradicts its lead',()=>{
 it('ICH goals of care preserves patient preferences and the second full hospital day',()=>{expect(cards.goc_ich.detail).toContain('without preexisting documented limits');expect(cards.goc_ich.detail).toContain('at least the second full hospital day');expect(cards.goc_ich.detail).not.toContain('minimum 24-48');});
 it('EVD requires the neurologic qualification, not merely a radiology keyword',()=>{expect(cards.ich_evd_ivh.detail).toContain('impaired consciousness');expect(cards.ich_evd_ivh.detail).toContain('alone does not establish');});
 it('ICH VTE lead preserves immobility, uncertainty and prophylaxis scope',()=>{expect(cards.ich_vte_ipc.recommendation).toContain('nonambulatory');expect(cards.ich_vte_heparin.recommendation).toContain('may be reasonable');expect(cards.ich_vte_heparin.recommendation).toContain('not therapeutic');});
 it('SAH onset-seizure duration does not discontinue preexisting epilepsy therapy',()=>{expect(cards.sah_seizure.recommendation).toContain('without prior epilepsy');expect(cards.sah_seizure.recommendation).toContain('new later seizures');expect(cards.sah_seizure.classOfRec).toBe('Statement');expect(cards.sah_seizure.medications).toEqual([]);});
 it('mobilization and nutrition details do not invent universal dose/timing recipes',()=>{expect(cards.early_mobilization.detail).toContain('does not establish a universal');expect(cards.nutrition_ng_peg_timing.detail).toContain('not an automatic 24–48-hour order');});
});

describe('independent contradiction review',()=>{
 it('does not assign mRS0 when an explicit help need conflicts with independent answers',()=>expect(c.interpretMRS9Q({...completeCases.interpretMRS9Q,q9NeedsHelp:'some'})).toBeNull());
 it('does not override an explicit negative giant-posterior flag with conflicting anatomy',()=>expect(c.calculateOgilvyCarter({age:60,huntHess:2,fisher:2,size:30,giantPosterior:false,posteriorCirculation:true})).toBeNull());
 it('requires reconciliation when Boston lesion total contradicts known-positive markers',()=>{const x={age:70,otherCause:false,deepHemorrhagicLesions:false,qualifyingPresentation:true,lobarICH:true,corticalSiderosis:true};expect(c.evaluateBostonCAA20({...x,lobarHemorrhagicLesionCount:0}).category).toBe('Incomplete');expect(c.evaluateBostonCAA20({...x,lobarHemorrhagicLesionCount:2}).category).toBe('Probable CAA');});
 it('does not attach a guideline grade to an invented ICH-score discussion threshold',()=>{expect(cards.goc_ich.recommendation).not.toContain('for ICH Score >= 3');expect(cards.goc_ich.recommendation).toContain('app reminder');expect(cards.goc_ich.recommendation).toContain('not a guideline-specified ICH Score threshold');});
 it('does not turn missing medication history or a separate bridging plan into a current no-anticoagulant readout',()=>{expect(source).toContain("anticoag: telestrokeNote.lastDOACType || 'Not assessed'");expect(source).not.toContain("anticoag: telestrokeNote.lastDOACType || (telestrokeNote.anticoagBridging || {}).doacType || 'None'");});
});

describe('actual Encounter strip NIHSS expression',()=>{
 const strip=source.slice(source.indexOf('const v7Patient = {'),source.indexOf('return (',source.indexOf('const v7Patient = {')));
 const expression=strip.match(/nihss: (.+),/)[1];
 it.each([{note:{nihss:''},score:4,complete:false,expected:'—'},{note:{nihss:'1.9'},score:0,complete:false,expected:'—'},{note:{nihss:'0'},score:0,complete:false,expected:0},{note:{nihss:''},score:4,complete:true,expected:4}])('keeps header documentation semantics for %j',x=>expect(vm.runInNewContext(expression,{documentedExamScore:reviewed.documentedExamScore,telestrokeNote:x.note,nihssScore:x.score,isNIHSSComplete:()=>x.complete})).toBe(x.expected));
});
