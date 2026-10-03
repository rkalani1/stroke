import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter, updateEncounter } from '../src/workspace-state.js';
import { calculateReviewedModifiedFisher as fisher, describeReviewedMTICI as mtici, calculateReviewedNASCET as nascet, supplementaryResult, supplementaryReviewed, updateSupplementaryField as edit, canApplySupplementaryScore } from '../src/supplementary-calculators.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { reviewedCalculatorText, matchesCalculatorSearch } from '../src/calculator-utilities.js';

const FISHER = { reviewed:true, aneurysmalSah:true, bloodThickness:'absent', ivh:false };
const NASCET = { reviewed:true, side:'left', minimumDiameterMm:'1.5', distalDiameterMm:'5', patentExtracranialICA:true, nearOcclusion:false };
const state = (diagnosis = 'ischemic') => {
  const value = newEncounter();
  return { ...value, context:'acute', note:{ ...value.note, diagnosisCategory:diagnosis } };
};
const review = (value,id,fields = {}) => {
  for (const [key,entry] of Object.entries(fields)) value = edit(value,id,key,entry);
  return edit(value,id,'reviewed',true);
};
const definition = id => calculatorDefinitions.find(item => item.id === id);

describe('restored source-bound grades and diameter arithmetic', () => {
  it.each([null,undefined,[],false,'',{}])('withholds all new outputs for incomplete or malformed input %j', input => {
    for (const fn of [fisher,mtici,nascet]) expect(fn(input)).toBeNull();
  });
  it.each([['absent',false,'0'],['thin',false,'1'],['absent',true,'2'],['thin',true,'2'],['thick',false,'3'],['thick',true,'4']])('matches modified Fisher Table 1 for %s / IVH %s', (bloodThickness,ivh,grade) => {
    expect(fisher({ ...FISHER,bloodThickness,ivh })).toMatchObject({grade});
  });
  it.each([{aneurysmalSah:false},{bloodThickness:''},{bloodThickness:'1mm'},{ivh:undefined},{ivh:'false'}])('does not assign a modified Fisher grade for %j', change => {
    expect(fisher({ ...FISHER,...change })).toBeNull();
  });
  it('grades live without an attestation', () => {
    expect(fisher({ ...FISHER,reviewed:false })).toEqual(fisher(FISHER));
    expect(nascet({ ...NASCET,reviewed:false })).toEqual(nascet(NASCET));
  });
  it.each(['0','1','2a','2b','2c','3'])('describes an explicitly reviewed mTICI %s', grade => {
    expect(mtici({reviewed:true,ischemic:true,grade})).toMatchObject({grade,description:expect.any(String)});
  });
  it('keeps the 2c definition distinct from partial and complete reperfusion', () => {
    expect(mtici({reviewed:true,ischemic:true,grade:'2a'}).description).toContain('less than half');
    expect(mtici({reviewed:true,ischemic:true,grade:'2b'}).description).toContain('at least half');
    expect(mtici({reviewed:true,ischemic:true,grade:'2c'}).description).toContain('delayed flow or small emboli');
  });
  it.each(['',undefined,null,0,'2','2b50','2B','3x','constructor'])('rejects a missing or non-mTICI grade %j', grade => {
    expect(mtici({reviewed:true,ischemic:true,grade})).toBeNull();
  });
  it('describes mTICI live but only in an ischemic context', () => {
    expect(mtici({ischemic:true,grade:'3'})).toMatchObject({grade:'3'});
    expect(mtici({reviewed:true,ischemic:false,grade:'3'})).toBeNull();
  });
  it.each([[5,5,0],[2.5,5,50],[1.5,5,70],[0.9,3,70],[1,3,66.7],[0.001,5,'>99.9']])('calculates NASCET from %s / %s mm as %s%%', (minimumDiameterMm,distalDiameterMm,score) => {
    expect(nascet({ ...NASCET,minimumDiameterMm,distalDiameterMm })).toEqual({score,max:100,unit:'%'});
  });
  it.each(['',' ',null,undefined,NaN,Infinity,'Infinity',true,'1.5mm','0x1',0,-1])('rejects invalid or zero residual/reference diameter %j', value => {
    expect(nascet({ ...NASCET,minimumDiameterMm:value })).toBeNull();
    expect(nascet({ ...NASCET,distalDiameterMm:value })).toBeNull();
  });
  it.each([{side:''},{side:'bilateral'},{patentExtracranialICA:false},{patentExtracranialICA:undefined},{nearOcclusion:true},{nearOcclusion:undefined},{nearOcclusion:'false'},{minimumDiameterMm:6}])('does not calculate outside reviewed NASCET measurement conditions %j', change => {
    expect(nascet({ ...NASCET,...change })).toBeNull();
  });
});

describe('canonical inputs, attestation withdrawal and focused result copies', () => {
  it('requires the existing aneurysmal SAH diagnosis and cause, not a worksheet duplicate', () => {
    let value = state('sah');
    value.details.sahCause = 'Aneurysmal';
    value = review(value,'modified-fisher',{bloodThickness:'thin',ivh:true});
    expect(supplementaryResult(value,'modified-fisher')).toMatchObject({grade:'2'});
    for (const cause of ['','Uncertain','Traumatic','Non-aneurysmal']) {
      const changed = updateEncounter(value,previous => ({ ...previous,details:{...previous.details,sahCause:cause} }));
      expect(supplementaryReviewed(changed,'modified-fisher')).toBe(false);
      expect(supplementaryResult(changed,'modified-fisher')).toBeNull();
      expect(supplementaryResult(review(changed,'modified-fisher'),'modified-fisher')).toBeNull();
    }
    // Explicit worksheet answers keep scoring live; the attestation is withdrawn.
    const changed = updateEncounter(value,previous => ({ ...previous,note:{...previous.note,ctResults:'New CT report'} }));
    expect(supplementaryResult(changed,'modified-fisher')).toMatchObject({grade:'2'});
    expect(supplementaryReviewed(changed,'modified-fisher')).toBe(false);
    expect(supplementaryResult(review(state('ich'),'modified-fisher',{...FISHER}),'modified-fisher')).toBeNull();
  });
  it('uses and invalidates the one recorded mTICI entry instead of storing a second grade', () => {
    let value = state(); value.note.ticiScore = '0';
    value = review(value,'mtici',{grade:'3'});
    expect(supplementaryResult(value,'mtici')).toMatchObject({grade:'0'});
    expect(definition('mtici').fields).toEqual([]);
    expect(reviewedCalculatorText(value,definition('mtici'))).toContain('mTICI reperfusion grade: 0');
    const cleared = updateEncounter(value,previous => ({ ...previous,note:{...previous.note,ticiScore:''} }));
    expect(supplementaryResult(cleared,'mtici')).toBeNull();
    expect(reviewedCalculatorText(cleared,definition('mtici'))).toBe('');
    const revised = updateEncounter(value,previous => ({ ...previous,note:{...previous.note,ticiScore:'2c'} }));
    expect(supplementaryResult(revised,'mtici')).toMatchObject({grade:'2c'});
    expect(reviewedCalculatorText(revised,definition('mtici'))).toContain('mTICI reperfusion grade: 2c — Almost complete reperfusion');
    expect(supplementaryResult(review({...value,context:'follow-up'},'mtici'),'mtici')).toBeNull();
    expect(supplementaryResult(review({...value,note:{...value.note,diagnosisCategory:'ich'}},'mtici'),'mtici')).toBeNull();
  });
  it('copies percentage, side and source only; changes invalidate the measurement review', () => {
    let value = state(); value.note.symptoms = 'UNRELATED NOTE MARKER';
    value = review(value,'nascet',NASCET);
    const text = reviewedCalculatorText(value,definition('nascet'));
    expect(text).toContain('NASCET carotid stenosis: 70% (left ICA).');
    expect(text).toContain('https://pubmed.ncbi.nlm.nih.gov/16418349/');
    expect(text).not.toContain('70/100'); expect(text).not.toContain('UNRELATED NOTE MARKER');
    expect(reviewedCalculatorText(edit(value,'nascet','side','right'),definition('nascet'))).toContain('NASCET carotid stenosis: 70% (right ICA).');
    expect(reviewedCalculatorText(edit(value,'nascet','side',''),definition('nascet'))).toBe('');
    const changed = updateEncounter(value,previous => ({ ...previous,note:{...previous.note,ctaDate:'2026-10-02'} }));
    expect(supplementaryResult(changed,'nascet')).toEqual({score:70,max:100,unit:'%'});
    expect(supplementaryReviewed(changed,'nascet')).toBe(false);
    for (const id of ['nascet','mtici','modified-fisher']) expect(canApplySupplementaryScore(value,id)).toBe(false);
  });
  it('exposes searchable routes and actual scoped source checks', () => {
    for (const [id,query] of [['modified-fisher','IVH'],['mtici','TICI'],['nascet','carotid']]) {
      expect(matchesCalculatorSearch(definition(id),query)).toBe(true);
      expect(definition(id)).toMatchObject({route:`#/tools/${id}`,reviewedAt:'2026-10-01',reviewScope:expect.any(String)});
      expect(supplementaryResult(newEncounter(),id)).toBeNull();
    }
  });
});

describe('Encounter calculator access without duplicate input state', () => {
  const render = value => renderToStaticMarkup(<Encounter state={value} update={() => {}} now={Date.parse('2026-10-01T18:00:00Z')} />);
  it.each(['','ischemic','tia','ich','sah','cvt','mimic','other'])('makes canonical GCS available for %s', diagnosis => {
    const html = render(state(diagnosis));
    expect(html.match(/id="calc-gcs"/g)).toHaveLength(1);
    for (const label of ['Eye','Verbal','Motor']) expect(html.match(new RegExp(`aria-label="GCS ${label}"`,'g'))).toHaveLength(1);
    expect(html).toContain('href="#/encounter/gcs"');
  });
  it('offers diagnosis/context links and preserves the single recorded mTICI control', () => {
    const acute = render(state()), sah = render(state('sah')), clinic = render({...state(),context:'follow-up'});
    expect(acute).toContain('href="#/encounter/mtici"');
    expect(acute.match(/aria-label="Recorded mTICI grade"/g)).toHaveLength(1);
    expect(acute).toContain('2c: Almost complete reperfusion; a few distal cortical branches have delayed flow or small emboli.');
    expect(sah).toContain('href="#/encounter/modified-fisher"');
    for (const id of ['rope','pascal','nascet','chadsvasc','has-bled','phq2','stop-bang']) expect(clinic).toContain(`href="#/encounter/${id}"`);
    expect(clinic).not.toContain('href="#/encounter/mtici"');
  });
});
