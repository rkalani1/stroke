// Currency applies to maintained clinical records, never retirement/build timestamps.
import fs from 'node:fs';
import { claims } from '../src/evidence/claims.js';
import { recommendations } from '../src/evidence/recommendations.js';
const args=process.argv.slice(2),value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
const now=new Date(value('--now',new Date().toISOString().slice(0,10))+'T00:00:00Z'),months=Number(value('--months',12));
if(!Number.isFinite(months)||months<=0||Number.isNaN(now.getTime()))throw new Error('Invalid currency date/threshold');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const records=[...claims,...recommendations,...read('src/clinical/claims.json'),...read('src/clinical/workspace-sources.json'),...fs.readdirSync('src/guidelines').filter(x=>x.endsWith('.json')).map(file=>{const g=read('src/guidelines/'+file);return {id:g.id,lastReviewed:g.sourceReview?.reviewedAt,reviewScope:g.sourceReview?.scope};})];
const missing=[],stale=[];
for(const r of records){const date=r.lastReviewed||r.reviewedAt;if(!date){missing.push({id:r.id,reason:r.reviewScope||'No genuine clinical review date recorded'});continue;}const d=new Date(date+'T00:00:00Z');const ageMonths=(now.getUTCFullYear()-d.getUTCFullYear())*12+now.getUTCMonth()-d.getUTCMonth();if(Number.isNaN(d.getTime())||ageMonths>months)stale.push({id:r.id,lastReviewed:date,ageMonths,sourceUrl:r.sourceUrl||r.url||null});}
const result={scope:'Maintained Encounter/protocol source closure only',asOf:now.toISOString().slice(0,10),thresholdMonths:months,records:records.length,stale,missingReviewDates:missing};
if(args.includes('--json'))console.log(JSON.stringify(result,null,2));else{console.log(`Maintained currency: ${stale.length} stale, ${missing.length} without a recorded clinical review date. No build date counts as review.`);stale.forEach(r=>console.log(`${r.id}: ${r.lastReviewed} (${r.ageMonths} months)`));missing.forEach(r=>console.log(`${r.id}: ${r.reason}`));}
if(args.includes('--strict')&&stale.length)process.exitCode=1;
