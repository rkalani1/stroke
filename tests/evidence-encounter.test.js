import { describe, expect, it } from 'vitest';
import * as encounter from '../src/evidence-encounter.js';
import * as canonical from '../src/evidence/index.js';
import fs from 'node:fs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
describe('maintained evidence and explicit portal retirement',()=>{
 it('keeps one canonical small dependency closure and no trial matcher advertising',()=>{
  for(const name of ['recommendations','claims','citations','topics'])expect(encounter[name]).toBe(canonical[name]);
  expect(canonical.activeTrials).toBeUndefined();expect(canonical.completedTrials).toBeUndefined();expect(canonical.filterActiveTrials).toBeUndefined();
  for(const file of ['src/evidence/activeTrials.js','src/evidence/completedTrials.js','src/evidence/matcher-engine.js','content/bundle.json','content/search-index.json','scripts/generate-pdfs.mjs'])expect(fs.existsSync(file)).toBe(false);
 });
 it('resolves all required claims/citations and preserves independent grades/limits',()=>{
  for(const rec of canonical.recommendations){const resolved=encounter.resolveClaimsWithCitations(rec.supportingClaimIds);expect(resolved).toHaveLength(rec.supportingClaimIds.length);for(const claim of resolved)expect(claim.citationRecords).toHaveLength(claim.citationIds.length);}
  expect(encounter.resolveCitations(['missing'])).toEqual([]);
  const ncs=canonical.recommendations.find(r=>r.id==='rec-ich-anticoag-reversal-fxa');expect(ncs.gradingSystem).toBe('GRADE');expect(ncs.classOfRecommendation).toBeNull();expect(ncs.nativeStrength).toBeTruthy();
  expect(canonical.recommendations.find(r=>r.id==='rec-evt-large-core').caveats.join(' ')).toMatch(/age|mRS|ASPECTS 0-2/);
 });
 it('returns explicit null retirement at every old trial/guideline URL',()=>{
  const {endpoints,archiveRef}=read('docs/retired-endpoints.json');expect(endpoints.length).toBeGreaterThan(100);
  for(const endpoint of endpoints){const row=read(endpoint);expect(row._meta.status).toBe('retired');expect(row.data).toBeNull();expect(row.retirement.archiveRef).toBe(archiveRef);expect(row.retirement.replacement).toMatch(/\/data\/sources\.json$/);expect(row._meta.checksum).toMatch(/^sha256:[a-f0-9]{32}$/);}
 });
 it('advertises only maintained routes/tools and preserves review/correction limitations',()=>{
  const api=read('data/index.json');expect(api._meta.schemaVersion).toBe('2.0.0');expect(api.routes.map(r=>r.route)).toContain('#/encounter');expect(api.routes.map(r=>r.route)).toContain('#/trials');expect(api.endpoints.some(e=>e.endsWith('/data/trials.json'))).toBe(true);expect(api.routes.some(r=>/education|research/.test(r.route))).toBe(false);
  const tools=read('data/calculators-index.json').data;expect(tools).toHaveLength(26);expect(tools.filter(tool=>tool.module==='supplementary-calculators')).toHaveLength(16);expect(tools.find(t=>t.id==='tnk-dose').fn).toBe('calculateTNKDoseReviewed');expect(tools.find(t=>t.id==='alteplase-dose').fn).toBe('calculateAlteplaseDoseReviewed');expect(tools.find(t=>t.id==='ich-score').category).toBe('severity');
  const sources=read('data/sources.json').data;expect(sources.guidelines).toHaveLength(6);for(const g of sources.guidelines){expect(g.sourceReview.scope).toBeTruthy();expect(g.maintainedProjection.clinicalReviewUnchanged).toBe(true);expect(g.coverage).toBeUndefined();}
  const ais=sources.guidelines.find(g=>g.id==='ais-2026');expect(ais.sourceReview.reviewedAt).toBe('2026-09-30');expect(ais.publicationUpdates.some(u=>u.status==='partially-applied')).toBe(true);
  expect(sources.sources.find(s=>s.id==='crcl').reviewedAt).toBeNull();expect(sources.sources.find(s=>s.id==='dawn').limits).toMatch(/not|does not|Failure/);
 });
});
