// Maintained registry/source schema, source linkage and genuine review-date currency.
import fs from 'node:fs';
import { citations } from '../src/evidence/citations.js';
import { CLINICAL_CLAIMS } from '../src/clinical/claim-registry.js';
import * as calculators from '../src/calculators.js';
import * as extended from '../src/calculators-extended.js';
import * as supplementary from '../src/supplementary-calculators.js';
import { sourceRecords } from '../src/supplementary-calculator-definitions.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { validateClinicalReference } from './validate-reference.mjs';
const modules = { calculators, 'calculators-extended': extended, 'supplementary-calculators': supplementary };
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[],warnings=[],registry=read('content/calculators/registry.json'),sources=[...read('src/clinical/workspace-sources.json'), ...sourceRecords];
const now=new Date(process.env.STROKE_CONTENT_NOW||Date.now()),maxMonths=Number(process.env.STROKE_CONTENT_MAX_AGE_MONTHS||18);
const seen=new Set(),citationIds=new Set(citations.map(c=>c.id));
const knownSourceIds = new Set([...sources.map(s=>s.id), ...Object.keys(CLINICAL_CLAIMS)]);
function review(id,date,scope){if(!scope)errors.push(`${id}: review scope required`);if(date===null){warnings.push(`${id}: no genuine clinical review date recorded`);return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||Number.isNaN(Date.parse(date)))errors.push(`${id}: invalid review date`);else{const d=new Date(date);const months=(now.getUTCFullYear()-d.getUTCFullYear())*12+now.getUTCMonth()-d.getUTCMonth();if(months>maxMonths)errors.push(`${id}: stale genuine review date ${date}`);if(d>now)errors.push(`${id}: future clinical review date`);}}
for(const r of registry){if(seen.has(r.id))errors.push(`duplicate tool ${r.id}`);seen.add(r.id);if(!r.name||!r.category||!r.fn||!/^#\/(encounter|tools)\/[a-z0-9-]+$/.test(r.route||'') || parseWorkspaceRoute(r.route).surface === 'retired')errors.push(`${r.id}: incomplete tool contract`);if(typeof modules[r.module]?.[r.fn]!=='function')errors.push(`${r.id}: unknown canonical helper ${r.fn}`);if(!r.scope||!r.limits||r.sourceEndpoint!=='data/sources.json'||!r.sourceIds?.length||r.sourceIds.some(id=>!knownSourceIds.has(id)))errors.push(`${r.id}: missing source/limits contract`);}
for(const s of sources){if(!s.id||!s.label||!/^https:\/\//.test(s.url||'')||!s.population||!s.limits)errors.push(`${s.id}: incomplete source/limits record`);if(s.citationId&&!citationIds.has(s.citationId))errors.push(`${s.id}: unknown citation ${s.citationId}`);review(s.id,s.reviewedAt,s.reviewScope);}
for(const claim of Object.values(CLINICAL_CLAIMS)){review(claim.id,claim.reviewedAt,claim.reviewScope);for(const file of new Set([claim.sourceFile,...(claim.sources||[]).map(s=>s.file)].filter(Boolean))){const source=read(file);if(source.sourceReview?.reviewedAt!==claim.reviewedAt)errors.push(`${claim.id}: review date disagrees with ${file}`);if(claim.sourceRecommendationId&&!source.recommendations.some(r=>r.id===claim.sourceRecommendationId)&&file===claim.sourceFile)errors.push(`${claim.id}: required recommendation removed`);}}
for(const file of fs.readdirSync('src/guidelines').filter(f=>f.endsWith('.json'))){const g=read('src/guidelines/'+file);review(g.id,g.sourceReview?.reviewedAt,g.sourceReview?.scope);if(!g.recommendations?.length||!g.maintainedProjection?.clinicalReviewUnchanged)errors.push(`${g.id}: missing maintained projection`);if(g.coverage)errors.push(`${g.id}: archived full-transcription coverage advertised for subset`);}
const trials=read('src/evidence/screenerTrials.json'), trialNames=new Set();
for(const trial of trials){
 if(!trial.acronym||trialNames.has(trial.acronym)) errors.push('Missing or duplicate trial acronym');
 trialNames.add(trial.acronym);
 if(trial.noContactInfo!==true||!['enrolling','soon','closed','placeholder'].includes(trial.status)||!trial.sourceGaps?.length||!trial.exactInclusionCriteria?.length||!trial.exactExclusionCriteria?.length) errors.push(`${trial.acronym}: incomplete bounded trial profile`);
 const metadata=trial.externalMetadata||{};
 if(trial.sourceCompletenessStatus==='not_registry_verified') warnings.push(`${trial.acronym}: unverified profile; screening remains withheld`);
 else {
  if(!/^NCT\d{8}$/.test(metadata.nct||'')||metadata.registryUrl!==`https://clinicaltrials.gov/study/${metadata.nct}`) errors.push(`${trial.acronym}: missing primary registry identity`);
  review(`trial ${trial.acronym}`,metadata.verificationDate||null,'Dated first-pass registry status and partial criteria only; current recruitment/local activation require confirmation');
 }
}
const reference={topics:[...read('src/reference/acute-topics.json'),...read('src/reference/clinic-topics.json')],studies:read('src/reference/studies.json')};
errors.push(...validateClinicalReference(reference,{now}));
const result={ok:!errors.length,scope:'Maintained Encounter tools, source dependencies, trial profiles and bounded clinical references',trialProfiles:trials.length,referenceTopics:reference.topics.length,completedStudies:reference.studies.length,tools:registry.length,sources:sources.length,errors,warnings};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else{console.log(`content-validate: ${result.ok?'PASS':'FAIL'} (${registry.length} retained tools, ${sources.length} source/limits records, ${trials.length} trial profiles, ${reference.topics.length} reference topics, ${reference.studies.length} completed studies)`);errors.forEach(x=>console.error(x));warnings.forEach(x=>console.warn(x));}process.exitCode=result.ok?0:1;
