// Offline validation of the maintained evidence closure; no historical corpus.
import { citations, claims, recommendations, guidelines, topics, schema } from '../src/evidence/index.js';
const errors=[],warnings=[];
const citationIds=new Set(citations.map(c=>c.id)),claimIds=new Set(claims.map(c=>c.id));
const ctx={knownCitationIds:citationIds,knownClaimIds:claimIds,claimById:new Map(claims.map(c=>[c.id,c]))};
for(const [name,records,validate] of [['citations',citations,schema.validateCitation],['claims',claims,schema.validateClaim],['recommendations',recommendations,schema.validateRecommendation],['guidelines',guidelines,schema.validateGuideline]]) {
 const seen=new Set();for(const record of records){if(seen.has(record.id))errors.push(`${name}: duplicate ${record.id}`);seen.add(record.id);const result=validate(record,ctx);errors.push(...result.errors);warnings.push(...result.warnings);}
 if(!records.length)errors.push(`${name}: maintained collection must not be empty`);
}
const topicIds=new Set(topics.map(t=>t.id));for(const record of [...claims,...recommendations])if(!topicIds.has(record.topic))errors.push(`${record.id}: unknown maintained topic ${record.topic}`);
const result={ok:!errors.length,scope:'Maintained Encounter/protocol dependency closure',counts:{citations:citations.length,claims:claims.length,recommendations:recommendations.length,guidelines:guidelines.length,topics:topics.length},errors,warnings};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else{console.log(`evidence-validate: ${result.ok?'PASS':'FAIL'} (${JSON.stringify(result.counts)})`);for(const error of errors)console.error(error);for(const warning of warnings)console.warn(warning);}
process.exitCode=result.ok?0:1;
