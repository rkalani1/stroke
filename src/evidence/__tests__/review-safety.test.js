import { describe, it, expect } from 'vitest';
import { evaluateCriterion, evaluateActiveTrial, evaluateAllTrialsViaEngine, resolveField } from '../matcher-engine.js';
import { getActiveTrial, activeTrials } from '../activeTrials.js';
import { evaluateTrialEligibility, buildScreenerParams, createInitialScreenerState, evaluateAll, onsetToHours } from '../screener-eval.js';
import { completedTrials } from '../completedTrials.js';
import { tryInt } from '../matcher-helpers.js';
const card = id => completedTrials.find(t => t.id === id);

describe('reviewed eligibility safety boundaries', () => {
  it.each([' ', '\t', false, true, [], [1], {}, NaN, Infinity, 'Infinity', '1e309', '0x10'])('keeps malformed numeric input %j unknown', value => {
    expect(evaluateCriterion({field:'hoursFromLKW',operator:'<=',value:4.5},{hoursFromLKW:value})).toBe('unknown');
    expect(onsetToHours(value, 'hours')).toBeNull();
    expect(tryInt(value)).toBeNull();
  });
  it('does not derive a vessel domain from malformed NIHSS text or arrays', () => {
    for (const nihss of ['8abc', [8], true]) expect(resolveField('domainMatch', {telestrokeNote:{nihss,vesselOcclusion:['M3']}})).toBeNull();
    expect(tryInt('4.6')).toBe(4.6);
  });
  it('requires known onset units and a finite converted interval', () => {
    for (const unit of [undefined, null, '', 'garbage', 'toString', '__proto__', ['hours'], {}]) expect(onsetToHours(1, unit)).toBeNull();
    expect(onsetToHours(Number.MAX_VALUE, 'days')).toBeNull();
    expect(onsetToHours(-1, 'hours')).toBeNull();
    expect(onsetToHours(' 4.5 ', 'hours')).toBe(4.5);
    expect(onsetToHours('0.5', 'days')).toBe(12);
    expect(onsetToHours(1, 'months')).toBe(720);
    expect(evaluateCriterion({field:'hoursFromLKW',operator:'<=',value:4.5},{hoursFromLKW:' 4.6 '})).toBe('not_met');
  });
  it('does not infer culprit M2 dominance from unrelated or conflicting prose', () => {
    const note = { vesselOcclusion: ['M2'], nihss: '10', ctaResults: 'Dominant left M2 occluded; right non-dominant M2 patent' };
    expect(resolveField('domainMatch', {telestrokeNote:note})).toBeNull();
    expect(resolveField('domainMatch', {telestrokeNote:note,culpritM2Dominance:'dominant'})).toBe('none');
    expect(resolveField('domainMatch', {telestrokeNote:{...note,vesselOcclusion:['M3']}})).toBe('mevo');
    expect(resolveField('domainMatch', {telestrokeNote:{...note,nihss:'7'},culpritM2Dominance:'non-dominant'})).toBe('none');
  });
  it('TESTED uses presentation rather than current screening time', () => {
    const d={telestrokeNote:{age:'65',nihss:'10',premorbidMRS:'3',vesselOcclusion:['M1']},aspectsScore:6,hoursFromLKW:48,presentedWithin24h:true};
    expect(evaluateActiveTrial(getActiveTrial('tested'),d).status).toBe('needs_info');
    expect(evaluateActiveTrial(getActiveTrial('tested'),{...d,presentedWithin24h:false}).status).toBe('not_eligible');
    expect(evaluateActiveTrial(getActiveTrial('tested'),{...d,presentedWithin24h:undefined}).criteria.find(x=>x.field==='presentedWithin24h').status).toBe('unknown');
  });
  it('missing exclusions, fractional timing, and missing disabling status stay faithful', () => {
    expect(evaluateCriterion({field:'hoursFromLKW',operator:'<=',value:4.5},{hoursFromLKW:'4.6'})).toBe('not_met');
    expect(evaluateCriterion({field:'pregnancy',operator:'==',value:true},{pregnancy:'unselected'})).toBe('unknown');
    expect(resolveField('nihssDisabling',{telestrokeNote:{nihss:'4'}})).toBeNull();
    expect(resolveField('nihssDisabling',{telestrokeNote:{nihss:'4',disablingDeficit:false}})).toBe(false);
    const r=evaluateActiveTrial(getActiveTrial('step-evt'),{telestrokeNote:{age:'55',nihss:'4',premorbidMRS:'0',vesselOcclusion:['M1']},hoursFromLKW:2});
    expect(r.unknownExclusions.length).toBeGreaterThan(0);
    expect(r.status).toBe('needs_info');
  });
  it('never screens closed trials, even via the direct API', () => {
    for(const trial of activeTrials.filter(t=>!['recruiting','enrolling-by-invitation'].includes(t.status))) expect(evaluateActiveTrial(trial,{}).status).toBe('inactive');
    expect(Object.keys(evaluateAllTrialsViaEngine(activeTrials,{}))).not.toContain('MOST');
  });
  it('retains unknown exclusions and does not certify even a nominally complete profile', () => {
    const trial={status:'enrolling',sourceCompletenessStatus:'complete',eligibility:{criteria:[{field:'age',operator:'>=',value:18}],exclusions:[{field:'exPregnancy',operator:'==',value:true,error:'Pregnancy'}]}};
    expect(buildScreenerParams(createInitialScreenerState()).exPregnancy).toBeNull();
    expect(evaluateTrialEligibility(trial,{age:50}).status).toBe('pending');
    expect(evaluateTrialEligibility(trial,{age:50,exPregnancy:false}).status).toBe('pending');
    expect(evaluateTrialEligibility(trial,{age:50,exPregnancy:true}).status).toBe('excluded');
    expect(evaluateTrialEligibility({...trial,status:'unknown'},{age:50}).status).toBe('closed');
  });
  it('does not invent an onset time or exclude a overlapping selected time band', () => {
    expect(buildScreenerParams(createInitialScreenerState()).onsetHours).toBeNull();
    const trial={status:'enrolling',eligibility:{criteria:[{field:'onsetDays',operator:'between',value:[14,180],error:'Time'}],exclusions:[]}};
    expect(evaluateTrialEligibility(trial,{onsetDays:10,onsetRangeHours:[7*24,30*24]}).status).toBe('pending');
    const r=evaluateAll({...createInitialScreenerState(),classification:'ischemic'});
    expect(r.eligible).toEqual([]);
    expect(r.briefingNote).toContain('Not recorded');
    expect(r.briefingNote).not.toContain('2.0 h');
  });
});

describe('selected clinical repair invariants', () => {
  it('keeps BEST-II counts separate from BP thresholds', () => {
    expect(card('best-ii').intervention).toContain('40 participants');
    const text=JSON.stringify([card('best-ii'),card('bp-target')]);
    expect(text).not.toMatch(/40 to (?:less than|<)|40 mm Hg lower floor|floor 40/);
    expect(card('best-ii').limitations).toContain('harm boundary');
  });
  it('withholds unsupported timing and disputed treatment-support comparisons', () => {
    expect(card('warfarin-resumption-ich-mechanical-valve').practiceImpact).toContain('does not establish a safe restart day');
    expect(card('tnk-vs-alteplase-rwe').verificationStatus).toBe('disputed');
    expect(card('tnk-vs-alteplase-rwe').primaryEndpoint.confidenceInterval).toContain('0.52');
    expect(card('ai-lvo-detection-accuracy-meta').primaryEndpoint.effectSize).not.toContain('DOR');
  });
  it('retains new evidence identity and limits rather than duplicate acronyms', () => {
    expect(card('hope-2025').citationIds).not.toEqual(card('hope-bp-2026').citationIds);
    expect(card('hope-bp-2026').primaryEndpoint.result).toContain('inconsistent');
    expect(card('erase-stroke-2026').population.keyExclusion).toContain('Reperfusion therapy');
    expect(card('lais-2026').verificationNotes).toContain('Full-card clinical verification is not claimed');
  });
});
