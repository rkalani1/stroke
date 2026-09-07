import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const load = (id) => JSON.parse(readFileSync(new URL(`../src/guidelines/${id}.json`, import.meta.url), 'utf8'));
const counts = { 'eso-ivt-2021': [48,17,65], 'eso-tia-2021':[8,3,11], 'eso-bao-2024':[12,7,19], 'eso-ich-2025':[39,22,61], 'eso-secondary-prevention-2022':[8,5,13], 'eso-pfo-2024':[9,13,22] };
const docs = Object.fromEntries(Object.keys(counts).map(id => [id,load(id)]));
const rows = (id,pico,kind) => docs[id].recommendations.filter(r => r.sourceStatementId.startsWith(`PICO ${pico} `) && (!kind || r.sourceStatementType===kind));
describe('additional ESO full source reconciliation', () => {
 for (const [id,[formal,consensus,total]] of Object.entries(counts)) it(`${id}: independently counted source totals`, () => {
  const d=docs[id]; expect(d.coverage).toMatchObject({status:'complete',sourceRecommendationCount:formal,sourceConsensusCount:consensus});
  expect(d.recommendations).toHaveLength(total);expect(d.recommendations.filter(r=>r.sourceStatementType==='recommendation')).toHaveLength(formal);expect(d.recommendations.filter(r=>r.sourceStatementType==='consensus')).toHaveLength(consensus);
  expect(new Set(d.recommendations.map(r=>r.id)).size).toBe(total);
  for(const r of d.recommendations){expect(r.sourceReference).toContain('PICO');expect(r.text).not.toContain('\uFFFD');if(r.sourceStatementType==='consensus')expect(r.levelOfEvidence).toBe('Ungraded');}
 });
 it('IVT formal uncertainties remain separate from expert votes, including two NOAC questions',()=>{
  for(const p of ['9.3','9.4','13.3','14.1']){expect(rows('eso-ivt-2021',p,'recommendation')).toHaveLength(1);expect(rows('eso-ivt-2021',p,'recommendation')[0]).toMatchObject({classOfRec:'No recommendation',levelOfEvidence:'Very low certainty'});expect(rows('eso-ivt-2021',p,'consensus')).toHaveLength(1);}
  const noac=rows('eso-ivt-2021','12.3','recommendation');expect(noac).toHaveLength(3);expect(noac.filter(r=>r.classOfRec==='No recommendation')).toHaveLength(2);expect(noac.map(r=>r.text).join(' ')).toMatch(/<0.5 U\/mL.*<60 seconds/);
  expect(rows('eso-ivt-2021','14.3','recommendation')).toHaveLength(3);
  expect(rows('eso-ivt-2021','3.1','consensus')).toHaveLength(3);
 });
 it('TIA service and imaging uncertainty are formal, not inferred from consensus',()=>{
  for(const p of ['3.1','5.1']){expect(rows('eso-tia-2021',p,'recommendation')).toHaveLength(1);expect(rows('eso-tia-2021',p,'recommendation')[0].classOfRec).toBe('No recommendation');expect(rows('eso-tia-2021',p,'consensus')).toHaveLength(1);}
 });
 it('BAO separates imaging populations and does not invent a grade',()=>{
  const p5=rows('eso-bao-2024','5','recommendation');expect(p5).toHaveLength(2);expect(p5[0]).toMatchObject({classOfRec:'Statement',levelOfEvidence:'Ungraded'});expect(p5[0].text).toContain('7–10');expect(p5[1]).toMatchObject({classOfRec:'No recommendation'});expect(p5[1].text).toContain('0–6');
  for(const p of ['1','6','9'])expect(rows('eso-bao-2024',p,'recommendation')[0].classOfRec).toBe('No recommendation');
  expect(rows('eso-bao-2024','10','recommendation')[0].text).toMatch(/no concomitant IVT/);
 });
 it('preserves source caveats and separates current safety notices',()=>{
  expect(rows('eso-ich-2025','4.2.2')[0]).toMatchObject({classOfRec:'Statement',levelOfEvidence:'Very low certainty'});
  for(const r of rows('eso-ich-2025','3.3.2.2'))expect(r.currentEvidenceNote).toMatch(/FDA.*22 December 2025/);
  expect(rows('eso-ivt-2021','5.1')[0].currentEvidenceSources[0].pmid).toBe('37021186');
  expect(rows('eso-secondary-prevention-2022','12')[0].text).toContain('<53 mmol/mol (7%)');expect(rows('eso-secondary-prevention-2022','12')[0].text).not.toContain('154 mg');
  expect(rows('eso-pfo-2024','5','recommendation')[0].classNote).toMatch(/inconsistency/);expect(rows('eso-pfo-2024','6','consensus')[0].classNote).toMatch(/<55.*discrepancy/);
 });
});
