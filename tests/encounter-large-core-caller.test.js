import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const { tnk: tnkRec, evt: evtRec } = evaluateVideoTreatment(');
const end = source.indexOf('// Only show if we have some data to work with', start);
if (start < 0 || end < start) throw new Error('Reviewed Encounter treatment integration not found');
const evaluatePanel = new Function('telestrokeNote', 'nihss', 'timeFromLKW', 'aspects', 'posterior', 'criticalContraindications', 'evaluateVideoTreatment', `${source.slice(start,end)}; return evtRec;`);
const badgeStart = source.indexOf('{evtRec.eligible ? (', end);
const badgeEnd = source.indexOf('\n                                      )}', badgeStart) + '\n                                      )}'.length;
if (badgeStart < 0 || badgeEnd < badgeStart) throw new Error('Encounter EVT status badge not found');
const badgeCode = transformSync(`const badge = <>${source.slice(badgeStart,badgeEnd)}</>;`, {loader:'jsx'}).code;
const badge = evtRec => renderToStaticMarkup(new Function('React','evtRec',`${badgeCode};return badge;`)(React,evtRec));
function recommendation({vessel='ICA',hours=3,age=65,premorbidMRS=1,aspects=4,diagnosisCategory='ischemic',ctHemorrhageStatus='absent'}={}) {
  const note={age,premorbidMRS,diagnosisCategory,ctHemorrhageStatus,vesselOcclusion:vessel ? [vessel] : []};
  const result=evaluatePanel(note,15,{total:hours,label:'LKW'},aspects,null,[],evaluateVideoTreatment);
  return {result,html:badge(result)};
}
describe('actual Encounter EVT caller and visible review state',()=>{
  it.each([['ICA',3],['M1',3],['ICA',12],['M1',12]])('keeps %s large-core at %s h under specialist review instead of claiming full eligibility',(vessel,hours)=>{
    const {result,html}=recommendation({vessel,hours});
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('mass-effect pathway');
    expect(html).toContain('REVIEW');
    expect(html).not.toContain('NOT INDICATED');
  });
  it('keeps undocumented vessel status pending',()=>{
    const {result,html}=recommendation({vessel:''});
    expect(result.eligible).toBe(false);expect(html).toContain('PENDING');
  });
  it.each([3,12])('keeps missing baseline function pending at %s h',hours=>{
    const {result,html}=recommendation({hours,premorbidMRS:''});
    expect(result.reason).toContain('incomplete');expect(html).toContain('PENDING');
  });
  it('does not make baseline disability an automatic EVT exclusion',()=>{
    const {result,html}=recommendation({premorbidMRS:4});
    expect(result.reason).toContain('not an automatic exclusion');expect(html).toContain('REVIEW');
  });
  it('passes a supported limited standard-core screen while rejecting contradictory hemorrhage',()=>{
    expect(recommendation({aspects:8}).html).toContain('CONSIDER');
    const {result,html}=recommendation({aspects:8,diagnosisCategory:'ich',ctHemorrhageStatus:'present'});
    expect(result.eligible).toBe(false);expect(html).toContain('REVIEW');
  });
});

describe('actual TNK badge preserves correction-and-reassessment states',()=>{
  const start=source.indexOf('{tnkRec.eligible ? (');
  const end=source.indexOf('\n                                      )}',start)+'\n                                      )}'.length;
  const code=transformSync(`const badge=<>${source.slice(start,end)}</>;`,{loader:'jsx'}).code;
  const render=tnkRec=>renderToStaticMarkup(new Function('React','tnkRec',`${code};return badge;`)(React,tnkRec));
  const base={diagnosisCategory:'ischemic',age:60,nihss:10,disablingDeficit:true,premorbidMRS:0,lastDOACType:'none',ctHemorrhageStatus:'absent',ivtContraindicationsReviewed:true,presentingBP:'140/80',glucose:100};
  it.each([{presentingBP:'185/110'},{glucose:401},{glucose:40}])('renders REVIEW for a correctable measured problem %o',patch=>{
    const {tnk}=evaluateVideoTreatment({note:{...base,...patch},clock:{total:2,label:'LKW'}});
    expect(tnk.reviewRequired).toBe(true);expect(render(tnk)).toContain('REVIEW');expect(render(tnk)).not.toContain('NOT INDICATED');
  });
});
