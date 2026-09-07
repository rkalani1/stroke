import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const inventory = load('./fixtures/major-aha-source-inventory-20260906.json');
const expected = { 'ais-2026': [202,45], 'ich-2022': [124,31], 'sah-2023': [84,15], 'primary-prevention-2024': [83,27], 'secondary-prevention-2021': [162,41], 'aha-af-guideline-2023': [195,60] };
const docs = Object.fromEntries(Object.keys(expected).map(id => [id, load(`../src/guidelines/${id}.json`)]));
describe('complete major AHA source inventories', () => {
  for (const [id,[count,tables]] of Object.entries(expected)) it(`${id}: every numbered source-table row is represented once`, () => {
    const d=docs[id];
    expect(d.recommendations).toHaveLength(count);
    expect(d.coverage.sourceSections).toHaveLength(tables);
    expect(d.coverage.sourceRecommendationCount).toBe(count-(id==='aha-af-guideline-2023'?1:0));
    expect(d.coverage.sourceConsensusCount).toBe(0);
    expect(new Set(d.recommendations.map(r=>r.id)).size).toBe(count);
    for (const [table,title,sourceRows] of inventory[id]) {
      const actual=d.recommendations.filter(r=>r.sourceSection===table);
      expect(actual.map(r=>[r.sourceRecommendationNumber,r.pdfPage]),`${id} ${title}`).toEqual(sourceRows.map(r=>[r[0],r[3]]));
      expect(d.coverage.sourceSections.find(s=>s.id===table).rowCount).toBe(sourceRows.length);
      for(let i=0;i<sourceRows.length;i++) {
        const [,cor,loe]=sourceRows[i],r=actual[i];
        if(cor.startsWith('Cost')) { expect(r.sourceStatementType).toBe('value-statement'); continue; }
        const cls=cor.startsWith('3')?'III':({'1':'I','2a':'IIa','2b':'IIb'}[cor]);
        // STR0530 explicitly changes dysphagia row 5 from IIa to IIb.
        expect(r.classOfRec).toBe(r.id==='ais-2026-164'?'IIb':cls);
        expect(r.levelOfEvidence).toBe(loe.replace(/SR|\*|†/g,''));
        expect(r.sourceStatementType).toBe('recommendation');
      }
    }
  });
  it('preserves all existing AIS numeric IDs and correction references when missing tables are inserted',()=>{
    const d=docs['ais-2026'];
    for(let i=1;i<=195;i++)expect(d.recommendations.filter(r=>r.id===`ais-2026-${i}`)).toHaveLength(1);
    expect(d.recommendations.find(r=>r.id==='ais-2026-164')).toMatchObject({section:'Dysphagia',sourceRecommendationNumber:5,classOfRec:'IIb'});
    expect(d.publicationUpdates[0].affectedRecommendationIds).toEqual(['ais-2026-98','ais-2026-101','ais-2026-162','ais-2026-164','ais-2026-165']);
  });
  it('restores the SAH seizure continuation with its duration and prior-epilepsy qualifiers',()=>{
    const rows=docs['sah-2023'].recommendations.filter(r=>r.section==='Management of Seizures Associated with aSAH');
    expect(rows).toHaveLength(6);
    expect(rows[3]).toMatchObject({classOfRec:'III',classNote:'Harm',levelOfEvidence:'B-NR',pdfPage:32});
    expect(rows[4].text).toMatch(/no more than 7 days.*perioperative/);
    expect(rows[5].text).toMatch(/without prior epilepsy.*beyond 7 days/);
    expect(rows[5]).toMatchObject({classNote:'No Benefit',levelOfEvidence:'B-NR'});
  });
  it('restores assessment screening across all adults and the distinct AF risk assessment',()=>{
    const rows=docs['primary-prevention-2024'].recommendations.filter(r=>r.sourceSection==='table-01');
    expect(rows).toHaveLength(4);
    expect(rows[1].text).toContain('CHA₂DS₂-VASc');
    expect(rows[2].text).toContain('18 years or older');
    expect(rows[3].text).toMatch(/18 years or older.*social determinants/);
  });
  it('restores AIS systems and supportive-care tables without turning class III statements into positive advice',()=>{
    const d=docs['ais-2026'];
    expect(d.recommendations.filter(r=>r.id.includes('-added-'))).toHaveLength(7);
    expect(d.recommendations.find(r=>r.sourceSection==='table-33').text).toMatch(/without intracranial occlusion.*within 48 hours/);
    expect(d.recommendations.filter(r=>['table-31','table-32','table-33'].includes(r.sourceSection)).every(r=>r.classOfRec==='III'&&r.classNote==='No Benefit')).toBe(true);
  });
  it('keeps economic value separate from graded clinical recommendations and consensus',()=>{
    const d=docs['aha-af-guideline-2023'],r=d.recommendations.find(r=>r.sourceStatementType==='value-statement');
    expect(d.coverage.sourceValueStatementCount).toBe(1);
    expect(r).toMatchObject({classOfRec:'Statement',classNote:'Cost/value statement: intermediate',levelOfEvidence:'B-R',sourceRecommendationNumber:6,pdfPage:84});
    expect(r.text).toMatch(/intermediate economic value.*antiarrhythmic/);
  });
});
