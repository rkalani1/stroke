import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import expandedVascular from '../src/reference/expanded-vascular.json' with { type: 'json' };
import acuteTopics from '../src/reference/acute-topics.json' with { type: 'json' };
import studies from '../src/reference/studies.json' with { type: 'json' };
import { newEncounter } from '../src/workspace-state.js';
import { screenerPrefillFromEncounter, applyEncounterPrefill } from '../src/evidence/screener-prefill.js';
import { createInitialScreenerState, evaluateAll, evaluateTrialEligibility, buildScreenerParams } from '../src/evidence/screener-eval.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { TrialScreener } from '../src/components/TrialScreener.jsx';
import { searchReference } from '../src/reference-search.js';
import { evaluateDAWN, evaluateDEFUSE3 } from '../src/calculators-extended.js';

const NOW = new Date('2026-10-03T12:00:00').getTime();
const topic = id => [...expandedVascular, ...acuteTopics].find(record => record.id === id);
const encounter = note => { const s = newEncounter(); Object.assign(s.note, note); return s; };

describe('evidence corrections', () => {
  it('grades ASPECTS 3–5 within 6 h on the large-core card', () => {
    const card = topic('large-core-evt');
    expect(card.recommendations[0]).toMatchObject({ id: 'ais-2026-114', cor: '1', loe: 'A' });
    expect(card.recommendations[0].text).toBe(topic('evt-selection').recommendations.find(rec => rec.id === 'ais-2026-114').text);
    expect(card.summary).toContain('within 6 h, ASPECTS 3–5 falls under the COR 1 ASPECTS 3–10 recommendation, which has no age criterion (ais-2026-114), and ASPECTS 0–2 is reasonable (2a) only with age <80, mRS 0–1 and no significant mass effect (ais-2026-117)');
  });
  it('quotes the SVIN 2b position for distal, codominant or nondominant M2', () => {
    const card = topic('medium-distal-evt');
    expect(card.recommendations.map(rec => rec.id)).toContain('svin-mevo-dvo-evt-2026-r2');
    expect(card.recommendations.find(rec => rec.id === 'svin-mevo-dvo-evt-2026-r2')).toMatchObject({ cor: '2b', loe: 'B-R' });
    expect(card.summary).toMatch(/SVIN 2026 says EVT may be considered \(2b\) for distal, codominant or nondominant M2/);
  });
  it('discloses the editorial alignment of the CVT key point', () => {
    const rec = topic('cvt').recommendations.find(item => item.id === 'cvt-2024-5');
    expect(rec.text).toMatch(/chronic major risk factors or recurrent venous thromboembolism\. \[Editorial note: the statement's abbreviated key point refers broadly to thrombophilia/);
  });
  it('gives HERMES its pooled ≤12 h window', () => {
    expect(studies.find(study => study.id === 'hermes').headline).toBe('EVT ≤12 h (5 RCTs, most ≤6 h): mRS shift cOR 2.49; NNT 2.6');
    expect(topic('evt-selection').summary).toContain('HERMES (5 RCTs, ≤12 h)');
  });
});

describe('trial screener', () => {
  it('does not import a DOAC last taken more than 7 days ago as use at onset', () => {
    const r = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich', lastDOACType: 'apixaban', lastDOACDose: '2026-09-23T08:00' }), NOW);
    expect(r.patch.exclusions).toEqual({ exDoacLmwhAtOnset: undefined, exOacWithin7d: false, exXaDtiWithin48h: false });
    expect(r.patch).toMatchObject({ takingOac: 'unselected', anticoagulant: 'unselected' });
    expect(r.summary).toContain('DOAC, last dose >7 d');
    const warfarin = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', lastDOACType: 'warfarin', lastDOACDose: '2026-09-23T08:00' }), NOW);
    expect(warfarin.summary).toContain('warfarin/VKA, last dose >7 d');
    expect(warfarin.patch.exclusions).toMatchObject({ exDoacLmwhAtOnset: undefined, exOacWithin7d: false });
    const recent = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich', lastDOACType: 'apixaban', lastDOACDose: '2026-09-30T08:00' }), NOW);
    expect(recent.patch).toMatchObject({ anticoagulant: 'doac', takingOac: true, exclusions: { exDoacLmwhAtOnset: true, exOacWithin7d: true, exXaDtiWithin48h: false } });
    expect(recent.summary).toContain('on DOAC');
  });
  it('maps ACA, PCA and vertebral occlusions and keeps the dominance note to M2', () => {
    for (const vessel of ['ACA', 'PCA', 'Vertebral']) {
      const r = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', vesselOcclusion: [vessel] }), NOW);
      expect(r.patch.vessel).toBe('other');
      expect(r.summary).toContain(vessel);
    }
    const distal = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', vesselOcclusion: ['M3 / distal'] }), NOW);
    expect(distal.patch.vessel).toBeUndefined();
    expect(distal.summary).toContain('M3 / distal (not imported)');
  });
  it('clears DOAC at onset when Encounter facts are reapplied after a >7 d dose is entered', () => {
    const e = encounter({ diagnosisCategory: 'ich', lastDOACType: 'apixaban' });
    const first = applyEncounterPrefill(createInitialScreenerState(), screenerPrefillFromEncounter(e, NOW), createInitialScreenerState());
    expect(first.exclusions.exDoacLmwhAtOnset).toBe(true);
    e.note.lastDOACDose = '2026-09-23T08:00';
    const again = applyEncounterPrefill(first, screenerPrefillFromEncounter(e, NOW), createInitialScreenerState());
    expect(again).toMatchObject({ anticoagulant: 'unselected', takingOac: 'unselected' });
    expect(again.exclusions.exDoacLmwhAtOnset).toBeUndefined();
    expect(evaluateAll(again).excluded.some(item => item.trial.acronym === 'MINUTE')).toBe(false);
  });
  it('keeps study-specific pregnancy checks after the shared answer', () => {
    const state = { ...createInitialScreenerState(), classification: 'ich', exclusions: { exPregnancy: false } };
    const p = buildScreenerParams(state);
    const pending = acronym => evaluateTrialEligibility(screenerTrials.find(trial => trial.acronym === acronym), p).pendingCriteria;
    expect(pending('FASTEST-2')).toContain('Confirm not ≤12 weeks post-partum');
    expect(pending('FASTEST-2')).not.toContain('Confirm not pregnant or ≤12 weeks post-partum');
    expect(pending('MINUTE')).toContain('Negative pregnancy test required if of childbearing potential');
    const unanswered = buildScreenerParams({ ...state, exclusions: {} });
    expect(evaluateTrialEligibility(screenerTrials.find(trial => trial.acronym === 'FASTEST-2'), unanswered).pendingCriteria).not.toContain('Confirm not ≤12 weeks post-partum');
  });
  it('gives every fact a modeled criterion uses a control', () => {
    const render = classification => renderToStaticMarkup(<TrialScreener initialState={{ ...createInitialScreenerState(), classification }} />);
    const ich = render('ich');
    for (const label of ['NIHSS', 'Statin at onset', 'Atrial fibrillation documented', 'Anticoagulant at onset']) expect(ich).toContain(`aria-label="${label}"`);
    expect(ich).not.toContain('aria-label="On oral anticoagulant at index stroke"');
    const ischemic = render('ischemic');
    for (const label of ['NIHSS', 'Atrial fibrillation documented', 'On oral anticoagulant at index stroke']) expect(ischemic).toContain(`aria-label="${label}"`);
    const tia = render('tia');
    expect(tia).not.toContain('aria-label="NIHSS"');
    expect(tia).toContain('aria-label="On oral anticoagulant at index stroke"');
  });
  it('screens SATURN and INTERCEPT on the new controls', () => {
    const saturn = statin => evaluateAll({ ...createInitialScreenerState(), classification: 'ich', statin }).excluded.some(item => item.trial.acronym === 'SATURN');
    expect(saturn(false)).toBe(true);
    expect(saturn(true)).toBe(false);
  });
});

describe('search and screen messages', () => {
  const records = [...expandedVascular, ...acuteTopics];
  it('matches a whole question by its content words and a recommendation id', () => {
    expect(searchReference(records, 'what is the bp target for ich').length).toBeGreaterThan(0);
    expect(searchReference(records, 'what is the bp target for ich').map(record => record.id)).toEqual(searchReference(records, 'bp target ich').map(record => record.id));
    expect(searchReference(records, 'ais-2026-114').map(record => record.id).slice(0, 2).sort()).toEqual(['evt-selection', 'large-core-evt']);
    expect(searchReference(records, 'ais-2026-72')[0].id).toBe('acute-bp');
    expect(searchReference(records, 'the of').length).toBeLessThan(records.length);
  });
  it('never shows a below-threshold value as the threshold itself', () => {
    const base = { timeFromLKWh: 10, nihss: 10, age: 70 };
    expect(evaluateDEFUSE3({ ...base, coreMl: 20, penumbraMl: 35.9 }).reason).toContain('Mismatch ratio 1.7 < 1.8');
    expect(evaluateDEFUSE3({ ...base, coreMl: 10, penumbraMl: 24.96 }).reason).toContain('Mismatch volume 14.9 mL < 15');
    expect(evaluateDEFUSE3({ ...base, coreMl: 10, penumbraMl: 50, timeFromLKWh: 16.005 }).reason).toContain('LKW 16:01');
    expect(evaluateDEFUSE3({ ...base, coreMl: 10, penumbraMl: 50, timeFromLKWh: 5.999 }).reason).toContain('LKW 5:59');
    expect(evaluateDAWN({ age: 70, nihss: 10, coreMl: 10, timeFromLKWh: 24.005 }).reason).toContain('LKW 24:01');
    expect(evaluateDEFUSE3({ ...base, coreMl: 10, penumbraMl: 50, timeFromLKWh: 16.1 }).reason).toContain('LKW 16:06');
  });
  it('meets the inclusive DEFUSE-3 thresholds despite binary float noise', () => {
    const base = { timeFromLKWh: 10, nihss: 10, age: 70 };
    for (const [coreMl, penumbraMl] of [[21, 37.8], [20.5, 36.9], [26, 46.8], [1.4, 16.4], [3.4, 18.4]]) expect(evaluateDEFUSE3({ ...base, coreMl, penumbraMl }).eligible).toBe(true);
    expect(evaluateDEFUSE3({ ...base, coreMl: 1.4, penumbraMl: 18.2 }).mismatchVolumeMl).toBe(16.8);
  });
});
