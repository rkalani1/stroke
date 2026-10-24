// Calculator review 2026-10-21. Every expected value below is derived by hand from the
// source definition named in the comment (abstract, PMC full text or registry record read on
// 2026-10-21; see docs/review-2026-10-21/calculators.md), not from the implementation.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { calculateICHScore, calculateGCS, calculateNIHSS, calculateCrClReviewed, calculateAlteplaseDoseReviewed, calculateTNKDoseReviewed, calculateICHVolumeReviewed } from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3, evaluateLargeCoreEVT, recommendAcuteDAPT, computeNeurocheckSchedule } from '../src/calculators-extended.js';
import * as worksheets from '../src/supplementary-calculators.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';
import { ENCOUNTER_TOOLS, matchesCalculatorSearch, reviewedCalculatorText, resultCautions } from '../src/calculator-utilities.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { newEncounter, encounterVolume, nihssAssessment } from '../src/workspace-state.js';
import { reviewedGcs } from '../src/encounter-clinical-review.js';
import { weightInKg, displayWeight } from '../src/encounter-inputs.js';

const NOW = Date.parse('2026-10-21T18:00:00Z');
const renderEncounter = patch => {
  const state = newEncounter();
  for (const [key, value] of Object.entries(patch)) state[key] = key === 'note' ? { ...state.note, ...value } : value;
  return renderToStaticMarkup(<Encounter state={state} update={() => {}} now={NOW} />);
};
const definition = id => calculatorDefinitions.find(item => item.id === id);

describe('ICH score (Hemphill 2001, doi:10.1161/01.str.32.4.891)', () => {
  // Abstract: GCS 3–4 = 2, 5–12 = 1, 13–15 = 0; age ≥80 = 1; infratentorial = 1; volume ≥30 cm³ = 1; IVH = 1.
  const none = { age80: false, volume30: false, ivh: false, infratentorial: false, criteriaReviewed: true };
  it.each([['gcs34', 2], ['gcs512', 1], ['gcs1315', 0]])('GCS tier %s alone scores %i', (gcs, score) => expect(calculateICHScore({ ...none, gcs })).toBe(score));
  it('adds one point per binary criterion up to 6', () => {
    expect(calculateICHScore({ ...none, gcs: 'gcs34', age80: true, volume30: true, ivh: true, infratentorial: true })).toBe(2 + 1 + 1 + 1 + 1);
    for (const key of ['age80', 'volume30', 'ivh', 'infratentorial']) expect(calculateICHScore({ ...none, gcs: 'gcs1315', [key]: true })).toBe(1);
  });
  it('never scores an omitted or non-boolean criterion as "no"', () => {
    for (const key of ['age80', 'volume30', 'ivh', 'infratentorial']) {
      for (const value of [undefined, null, 'false', 'true', 0, 1]) expect(calculateICHScore({ ...none, gcs: 'gcs512', [key]: value }), `${key}=${JSON.stringify(value)}`).toBeNull();
    }
    expect(calculateICHScore({ ...none, gcs: 'gcs512', criteriaReviewed: false })).toBeNull();
    expect(calculateICHScore({ ...none, gcs: '13-15' })).toBeNull();
  });
  // Encounter GCS → tier mapping at every tier edge. Volume 4 × 3 × (5 mm × 6 slices = 3 cm) / 2 = 18 mL (<30).
  const ichState = (gcs, extra = {}) => ({ note: { diagnosisCategory: 'ich', age: '70' }, gcs, volume: { a: '4', b: '3', thicknessMm: '5', numSlices: '6' }, ich: { ivh: false, infratentorial: false }, ...extra });
  it.each([
    [{ eye: '1', verbal: '1', motor: '1' }, 2], // GCS 3
    [{ eye: '1', verbal: '1', motor: '2' }, 2], // GCS 4
    [{ eye: '1', verbal: '1', motor: '3' }, 1], // GCS 5
    [{ eye: '3', verbal: '4', motor: '5' }, 1], // GCS 12
    [{ eye: '3', verbal: '4', motor: '6' }, 0], // GCS 13
    [{ eye: '4', verbal: '5', motor: '6' }, 0] // GCS 15
  ])('Encounter maps GCS %j to ICH score %i', (gcs, score) => expect(renderEncounter(ichState(gcs))).toContain(`ICH score ${score}/6`));
  it('Encounter adds age ≥80, volume ≥30 mL, IVH and infratentorial origin (maximum 6)', () => {
    // 5 × 4 × (5 mm × 6 = 3 cm) / 2 = 30 mL exactly: ≥30 scores.
    const html = renderEncounter({ ...ichState({ eye: '1', verbal: '1', motor: '1' }), note: { diagnosisCategory: 'ich', age: '80' }, volume: { a: '5', b: '4', thicknessMm: '5', numSlices: '6' }, ich: { ivh: true, infratentorial: true } });
    expect(html).toContain('ICH score 6/6');
    expect(renderEncounter({ ...ichState({ eye: '4', verbal: '5', motor: '6' }), note: { diagnosisCategory: 'ich', age: '79' } })).toContain('ICH score 0/6');
  });
  it('Encounter withholds the score while IVH is unanswered', () => {
    expect(renderEncounter(ichState({ eye: '4', verbal: '5', motor: '6' }, { ich: { ivh: '', infratentorial: false } }))).toContain('Complete age, GCS, volume and both imaging criteria to score.');
  });
});

describe('ABC/2 (Kothari 1996, doi:10.1161/01.str.27.8.1304)', () => {
  // Abstract: A greatest diameter, B diameter at 90°, C = number of slices × slice thickness; volume = A·B·C/2.
  it.each([
    [{ a: '4', b: '3', thicknessMm: '5', numSlices: '6' }, 18, false, true], // 4·3·3/2
    [{ a: '3', b: '2', thicknessMm: '10', numSlices: '5' }, 15, false, true], // 3·2·5/2 = 15: the ≥15 mL prompt applies
    [{ a: '5', b: '4', thicknessMm: '5', numSlices: '6' }, 30, true, true], // 5·4·3/2 = 30: the ≥30 mL point applies
    [{ a: '2', b: '1.5', thicknessMm: '5', numSlices: '4' }, 3, false, false] // 2·1.5·2/2 = 3
  ])('%j → %s mL', (volume, mL, large, fifteen) => {
    const result = encounterVolume(volume);
    expect(result.volume).toBe(mL);
    expect(result.isLarge).toBe(large);
    expect(result.meetsNonTraumaticIphDualConsultVolume).toBe(fifteen);
  });
  it('never displays a sub-30 mL hematoma as 30.0', () => {
    // 5.999 · 5 · (10 mm × 2 = 2 cm) / 2 = 29.995 mL: below the threshold, so the shown value stays 29.9.
    const result = encounterVolume({ a: '5.999', b: '5', thicknessMm: '10', numSlices: '2' });
    expect(result.isLarge).toBe(false);
    expect(result.volume).toBe(29.9);
  });
  it('rejects missing, zero, negative, fractional-slice or unit-suffixed inputs', () => {
    for (const volume of [{ a: '', b: '3', thicknessMm: '5', numSlices: '6' }, { a: '0', b: '3', thicknessMm: '5', numSlices: '6' }, { a: '-4', b: '3', thicknessMm: '5', numSlices: '6' }, { a: '4', b: '3', thicknessMm: '5', numSlices: '2.5' }, { a: '4cm', b: '3', thicknessMm: '5', numSlices: '6' }, { a: '4', b: '3', thicknessMm: '', numSlices: '6' }]) expect(encounterVolume(volume)).toBeNull();
    expect(calculateICHVolumeReviewed({ lengthCm: 16, widthCm: 4, slicesCm: 3 }).unitWarning).toMatch(/centimeters/);
  });
});

describe('Cockcroft–Gault (Cockcroft & Gault 1976, doi:10.1159/000180580)', () => {
  // CrCl = (140 − age) × weight(kg) / (72 × SCr mg/dL); ×0.85 in women ("15% less in females").
  it.each([
    [70, 80, 'M', 1, 70 * 80 / 72, 77.8],
    [70, 80, 'F', 1, 70 * 80 * 0.85 / 72, 66.1],
    [85, 60, 'F', 1.4, 55 * 60 * 0.85 / (72 * 1.4), 27.8], // 2805 / 100.8 = 27.827…
    [18, 70, 'M', 1, 122 * 70 / 72, 118.6] // 8540 / 72 = 118.61…
  ])('age %i, %i kg, %s, SCr %s', (age, weight, sex, cr, raw, shown) => {
    const result = calculateCrClReviewed(age, weight, sex, cr);
    expect(result.rawValue).toBeCloseTo(raw, 10);
    expect(result.value).toBe(shown);
    expect(result.unitWarning).toBeNull();
  });
  it('adjusted body weight uses Devine IBW and IBW + 0.4 × (TBW − IBW) when BMI >30', () => {
    // Man, 177.8 cm = 70 in: IBW 50 + 2.3 × 10 = 73 kg; AdjBW 73 + 0.4 × 47 = 91.8 kg; 70 × 91.8 / 72 = 89.25.
    const man = calculateCrClReviewed(70, 120, 'M', 1, 177.8);
    expect(man.rawAdjBwValue).toBeCloseTo(89.25, 6);
    expect(man.adjBwValue).toBe(89.3);
    expect(man.value).toBe(116.7); // 70 × 120 / 72 = 116.67
    // Height absent: no BMI, so no adjusted value is invented.
    expect(calculateCrClReviewed(70, 120, 'M', 1).adjBwValue).toBeNull();
  });
  it('flags a likely µmol/L creatinine above 20 mg/dL (1 mg/dL = 88.4 µmol/L)', () => {
    expect(calculateCrClReviewed(70, 80, 'M', 20).unitWarning).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 20.01).unitWarning).toMatch(/divide by 88\.4/);
  });
  it('returns no estimate for out-of-scope or malformed input', () => {
    for (const args of [[17, 70, 'M', 1], [121, 70, 'M', 1], [70, 0, 'M', 1], [70, 351, 'M', 1], [70, 80, 'M', 0.09], [70, 80, 'm', 1], [70, 80, '', 1], [70, '80kg', 'M', 1], ['', 80, 'M', 1], [70, 80, 'M', 1, '0'], [70, 80, 'M', 1, 'abc']]) expect(calculateCrClReviewed(...args), JSON.stringify(args)).toBeNull();
  });
});

describe('IV thrombolytic dose arithmetic (AHA/ASA 2026 ais-2026-98, archived transcription; US labels via secondary copies)', () => {
  // Alteplase 0.9 mg/kg, maximum 90 mg; 10% as a 1-minute bolus, remainder over 60 minutes.
  it.each([
    [70, 63, 6.3, 56.7, false],
    [77.7, 69.9, 7, 62.9, false], // 69.93 → 69.9; bolus 6.99 → 7.0; infusion = 69.9 − 7.0
    [45, 40.5, 4.1, 36.4, false], // bolus 4.05 rounds half-up to 4.1 mg; bolus + infusion still equals 40.5
    [100, 90, 9, 81, false],
    [100.5, 90, 9, 81, true],
    [150, 90, 9, 81, true]
  ])('alteplase %s kg → %s mg (%s bolus + %s infusion)', (weight, total, bolus, infusion, capped) => {
    expect(calculateAlteplaseDoseReviewed(weight)).toMatchObject({ totalDose: total, bolus, infusion, capped });
    expect(Math.round((bolus + infusion) * 10) / 10).toBe(total);
  });
  it.each([0, -1, 350.01, '7O', true, null, ''])('alteplase rejects %j', weight => expect(calculateAlteplaseDoseReviewed(weight)).toBeNull());
  // Tenecteplase 0.25 mg/kg, maximum 25 mg (guideline); US AIS label bands <60 15, 60–<70 17.5, 70–<80 20, 80–<90 22.5, ≥90 25 mg.
  it.each([[70, '17.5', '3.5 mL'], [59.99, '15', '3 mL'], [100, '25', '5 mL'], [120, '25', '5 mL'], [40, '10', '2 mL']])('TNK guideline %s kg → %s mg', (weight, dose, volume) => {
    expect(calculateTNKDoseReviewed(weight, 'guideline')).toMatchObject({ calculatedDose: dose, volume });
  });
  it.each([[59.99, '15'], [60, '17.5'], [69.99, '17.5'], [70, '20'], [79.99, '20'], [80, '22.5'], [89.99, '22.5'], [90, '25'], [140, '25']])('TNK label band at %s kg → %s mg', (weight, dose) => {
    expect(calculateTNKDoseReviewed(weight, 'fda-label').calculatedDose).toBe(dose);
  });
  it('reports the delivered label dose per kg and warns only above 0.30 mg/kg', () => {
    expect(calculateTNKDoseReviewed(45, 'fda-label')).toMatchObject({ deliveredMgPerKg: 0.333 }); // 15 / 45
    expect(calculateTNKDoseReviewed(45, 'fda-label').roundingNote).toMatch(/WARNING: above 0\.30 mg\/kg/);
    expect(calculateTNKDoseReviewed(50, 'fda-label').roundingNote).not.toMatch(/WARNING/); // 15 / 50 = 0.30 exactly
    expect(calculateTNKDoseReviewed(70, 'label')).toBeNull();
  });
  it('converts pounds with the exact 0.45359237 kg factor before dosing', () => {
    // 176 lb × 0.45359237 = 79.83225712 kg (stored to 1 mg: 79.832257); 0.25 × 79.832257 = 19.958 → 19.96 mg.
    expect(weightInKg('176', 'lb')).toBe('79.832257');
    expect(displayWeight('79.832257', 'lb')).toBe('176');
    expect(calculateTNKDoseReviewed(weightInKg('176', 'lb'), 'guideline').calculatedDose).toBe('19.96');
    expect(calculateTNKDoseReviewed(weightInKg('176', 'lb'), 'fda-label').calculatedDose).toBe('20');
    expect(weightInKg('', 'lb')).toBe('');
  });
  it('post-thrombolysis checks: q15 min × 8, q30 min × 12, then hourly × 16 to 24 h', () => {
    const schedule = computeNeurocheckSchedule('2026-10-21T10:00');
    const minutes = schedule.checks.map(check => (check.at - schedule.start) / 60000);
    expect(minutes.slice(0, 8)).toEqual([15, 30, 45, 60, 75, 90, 105, 120]);
    expect(minutes[8]).toBe(150);
    expect(minutes[19]).toBe(480);
    expect(minutes[20]).toBe(540);
    expect(minutes.at(-1)).toBe(1440);
    expect(computeNeurocheckSchedule('')).toBeNull();
  });
});

describe('GCS and NIHSS item structure', () => {
  // Teasdale & Jennett 1974 / GCS aid: eye 1–4, verbal 1–5, motor 1–6; total 3–15; an untestable component has no total.
  it('totals only three valid components', () => {
    expect(calculateGCS({ eye: 4, verbal: 5, motor: 6 })).toBe(15);
    expect(calculateGCS({ eye: '1', verbal: '1', motor: '1' })).toBe(3);
    for (const items of [{ eye: 5, verbal: 5, motor: 6 }, { eye: 4, verbal: 'UN', motor: 6 }, { eye: 4, verbal: 5 }, { eye: 0, verbal: 5, motor: 6 }, { eye: 2.5, verbal: 5, motor: 6 }]) {
      expect(calculateGCS(items)).toBeNull();
      expect(reviewedGcs(items)).toBeNull();
    }
  });
  // NINDS NIHSS: 15 items; maxima 1a 3, 1b 2, 1c 2, gaze 2, visual 3, face 3, each limb motor 4, ataxia 2,
  // sensory 2, language 3, dysarthria 2, extinction 2 (sum 42). UN only for limb motor, ataxia and dysarthria.
  const maxima = { consciousness: 3, loc_questions: 2, loc_commands: 2, best_gaze: 2, visual: 3, facial_palsy: 3, motor_arm_left: 4, motor_arm_right: 4, motor_leg_left: 4, motor_leg_right: 4, limb_ataxia: 2, sensory: 2, language: 3, dysarthria: 2, extinction: 2 };
  const untestable = ['motor_arm_left', 'motor_arm_right', 'motor_leg_left', 'motor_leg_right', 'limb_ataxia', 'dysarthria'];
  it('has the 15 NINDS items with contiguous 0..max scores and UN only where the instructions allow it', () => {
    expect(NIHSS_ITEMS.map(item => item.id)).toEqual(Object.keys(maxima));
    for (const item of NIHSS_ITEMS) {
      const scores = item.options.map(option => option.match(/\((\d+)\)$/)?.[1]).filter(Boolean).map(Number);
      expect(scores, item.id).toEqual(Array.from({ length: maxima[item.id] + 1 }, (_, index) => index));
      expect(item.options.some(option => option.endsWith('(UN)')), item.id).toBe(untestable.includes(item.id));
    }
    expect(Object.values(maxima).reduce((a, b) => a + b, 0)).toBe(42);
  });
  it('totals a complete exam, excludes and counts UN items, and withholds a partial exam', () => {
    const worst = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options.find(option => option.endsWith(`(${maxima[item.id]})`))]));
    expect(nihssAssessment(worst)).toMatchObject({ complete: true, total: 42, untestable: 0 });
    const withUn = { ...worst, motor_arm_left: 'Amputation/joint fusion (UN)', dysarthria: 'Intubated/other (UN)' };
    expect(nihssAssessment(withUn)).toMatchObject({ complete: true, total: 42 - 4 - 2, untestable: 2 });
    const { extinction, ...fourteen } = worst;
    expect(nihssAssessment(fourteen)).toMatchObject({ complete: false, total: null, count: 14 });
    expect(nihssAssessment({ ...worst, sensory: 'Severe (2)' })).toMatchObject({ complete: false, total: null });
    expect(calculateNIHSS(withUn)).toBe(36);
  });
});

describe('DAWN partial screen (registry NCT02142283)', () => {
  // Registry: age ≥18, NIHSS ≥10, 6–24 h from LKW; core 0–<21 cc with NIHSS ≥10 and age ≥80;
  // 0–<31 cc with NIHSS ≥10 and age <80; 31–<51 cc with NIHSS ≥20 and age <80.
  const dawn = (age, nihss, coreMl, timeFromLKWh) => evaluateDAWN({ age, nihss, coreMl, timeFromLKWh });
  it.each([
    [80, 10, 20.9, 12, 'A'], [80, 10, 21, 12, null], [79, 10, 30.9, 12, 'B'], [79, 10, 31, 12, null],
    [79, 20, 50.9, 12, 'C'], [79, 20, 51, 12, null], [79, 19, 31, 12, null], [80, 20, 25, 12, null], [80, 9, 5, 12, null], [17, 12, 5, 12, null],
    [60, 12, 10, 6, 'B'], [60, 12, 10, 24, 'B'], [60, 12, 10, 5.99, null], [60, 12, 10, 24.01, null]
  ])('age %s, NIHSS %s, core %s mL, %s h → tier %s', (age, nihss, core, hours, tier) => {
    const result = dawn(age, nihss, core, hours);
    expect(result.tier).toBe(tier);
    expect(result.eligible).toBe(tier !== null);
  });
  it('returns no screen for missing or impossible input', () => {
    for (const args of [[60, 12, '', 12], [60, 12, 10, null], [60, 12.5, 10, 12], [60, 43, 10, 12], [0, 12, 10, 12], [121, 12, 10, 12], [60, 12, -1, 12]]) expect(dawn(...args)).toBeNull();
  });
});

describe('DEFUSE 3 partial screen (registry NCT02586415)', () => {
  // Registry: age 18–90, NIHSS ≥6, 6–16 h from LKW, core <70 mL, mismatch ratio ≥1.8, mismatch volume ≥15 mL;
  // NCCT ASPECTS <6 excluded when enrolled on CT perfusion.
  const base = { age: 70, nihss: 10, coreMl: 20, hypoperfusedMl: 60, timeFromLKWh: 10 };
  it.each([
    [{}, true], [{ coreMl: 69.9, hypoperfusedMl: 140 }, true], [{ coreMl: 70, hypoperfusedMl: 140 }, false],
    [{ coreMl: 21, hypoperfusedMl: 37.8 }, true], // ratio exactly 1.8, mismatch 16.8 mL
    [{ coreMl: 10, hypoperfusedMl: 24.9 }, false], [{ coreMl: 10, hypoperfusedMl: 25 }, true], // mismatch 14.9 / 15 mL
    [{ coreMl: 0, hypoperfusedMl: 15 }, true], [{ coreMl: 0, hypoperfusedMl: 14.9 }, false],
    [{ nihss: 5 }, false], [{ age: 90 }, true], [{ age: 91 }, false], [{ age: 18 }, true], [{ age: 17 }, false],
    [{ timeFromLKWh: 6 }, true], [{ timeFromLKWh: 16 }, true], [{ timeFromLKWh: 16.01 }, false], [{ timeFromLKWh: 5.99 }, false],
    [{ aspects: 6 }, true], [{ aspects: 5 }, false], [{ aspects: 5, perfusionModality: 'mri' }, true]
  ])('%j → %s', (patch, eligible) => expect(evaluateDEFUSE3({ ...base, ...patch }).eligible).toBe(eligible));
  it('asks for a blank ASPECTS but treats an entered invalid ASPECTS as unresolved on CT selection', () => {
    expect(evaluateDEFUSE3({ ...base, aspects: '' }).reason).toContain('Confirm NCCT ASPECTS ≥6');
    for (const aspects of [11, -1, 5.5, '5x', '6.5']) expect(evaluateDEFUSE3({ ...base, aspects }), String(aspects)).toBeNull();
    // MRI selection does not use the NCCT exclusion, so an unused malformed entry does not block it.
    expect(evaluateDEFUSE3({ ...base, aspects: '5x', perfusionModality: 'mri' }).eligible).toBe(true);
  });
  it('rejects a total hypoperfused volume below the core', () => expect(evaluateDEFUSE3({ ...base, coreMl: 30, hypoperfusedMl: 20 })).toBeNull());
});

describe('large-core partial screen (trial abstracts and registries)', () => {
  // RESCUE-Japan LIMIT ASPECTS 3–5 ≤6 h; TENSION ASPECTS 3–5 ≤12 h, NIHSS <26, pre-mRS ≤2 (abstract: up to 12 h);
  // SELECT2 ASPECTS 3–5 or core ≥50 mL ≤24 h, age 18–85, pre-mRS ≤1; ANGEL-ASPECT ASPECTS 3–5 ≤24 h, NIHSS 6–30,
  // age ≤80; TESLA NCCT ASPECTS 2–5 ≤24 h (abstract), a neutral trial that never marks the screen met.
  const run = patch => evaluateLargeCoreEVT({ age: 65, nihss: 15, aspects: 4, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1', ...patch });
  it.each([
    [{}, ['RESCUE-Japan LIMIT', 'TENSION', 'SELECT-2', 'ANGEL-ASPECT', 'TESLA']],
    [{ timeFromLKWh: 6.01 }, ['TENSION', 'SELECT-2', 'ANGEL-ASPECT', 'TESLA']],
    [{ timeFromLKWh: 12.01 }, ['SELECT-2', 'ANGEL-ASPECT', 'TESLA']],
    [{ nihss: 26 }, ['RESCUE-Japan LIMIT', 'SELECT-2', 'ANGEL-ASPECT', 'TESLA']],
    [{ nihss: 31 }, ['RESCUE-Japan LIMIT', 'SELECT-2', 'TESLA']],
    [{ premorbidMRS: 2 }, ['TENSION']],
    [{ age: 81 }, ['RESCUE-Japan LIMIT', 'TENSION', 'SELECT-2', 'TESLA']],
    [{ age: 86 }, ['RESCUE-Japan LIMIT', 'TENSION']],
    [{ aspects: 6, timeFromLKWh: 3 }, []]
  ])('%j → %j', (patch, trials) => expect(run(patch).matchingTrials).toEqual(trials));
  it('marks incomplete input and non-ICA/M1 anatomy without a screen result', () => {
    expect(run({ premorbidMRS: '' }).status).toBe('incomplete');
    expect(run({ aspects: 4.5 }).status).toBe('incomplete');
    expect(run({ aspects: '', coreMl: '' }).status).toBe('incomplete');
    expect(run({ lvoLocation: 'M2' }).status).toBe('outside-modeled-anatomy');
  });
});

describe('acute DAPT source screen (AHA/ASA 2026 ais-2026-147 to -150, archived transcription)', () => {
  // -147 (1, A) NIHSS ≤3 or ABCD² ≥4, ≤24 h: clopidogrel + aspirin 21 d. -148 (2b, B-R) NIHSS ≤5 or high-risk TIA
  // (ABCD² ≥6 or symptomatic stenosis ≥50%), <24 h: ticagrelor + aspirin 30 d. -149 (2a, B-R) atherosclerotic, 24–72 h
  // (or NIHSS 4–5 within 24 h): clopidogrel + aspirin 21 d. -150 (2b, B-R) CYP2C19 LOF ≤24 h: ticagrelor + aspirin 21 d.
  const base = { age: 65, anticoagulationExcluded: true, strokeType: 'ischemic', noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true, ichRisk: 'reviewed', atherosclerotic: false, lvdSymptomatic: false, cyp2c19LOF: false };
  it.each([
    [{ nihss: 3, timeFromOnsetH: 24 }, 'clopidogrel+ASA', '21 days'],
    [{ nihss: 3, timeFromOnsetH: 24.01 }, 'individualized-review', null],
    [{ nihss: 5, timeFromOnsetH: 23 }, 'ticagrelor+ASA', '30 days'],
    [{ nihss: 5, timeFromOnsetH: 23, atherosclerotic: true }, 'clopidogrel+ASA', '21 days'],
    [{ nihss: 2, timeFromOnsetH: 48, atherosclerotic: true }, 'clopidogrel+ASA', '21 days'],
    [{ nihss: 2, timeFromOnsetH: 72.01, atherosclerotic: true }, 'individualized-review', null],
    [{ nihss: 6, timeFromOnsetH: 2 }, 'individualized-review', null],
    [{ nihss: 2, timeFromOnsetH: 10, cyp2c19LOF: true }, 'ticagrelor+ASA (CHANCE-2)', '21 days'],
    [{ strokeType: 'tia', abcd2: 4, timeFromOnsetH: 10 }, 'clopidogrel+ASA', '21 days'],
    [{ strokeType: 'tia', abcd2: 3, timeFromOnsetH: 10 }, 'individualized-review', null],
    [{ strokeType: 'tia', abcd2: 3, timeFromOnsetH: 10, lvdSymptomatic: true }, 'ticagrelor+ASA', '30 days']
  ])('%j → %s', (patch, regimen, duration) => expect(recommendAcuteDAPT({ ...base, ...patch })).toMatchObject({ regimen, duration }));
  it('selects nothing while a gating answer is missing', () => {
    for (const key of ['noncardioembolicConfirmed', 'hemorrhageExcluded', 'reperfusionExcluded', 'antiplateletContraindicationsReviewed', 'anticoagulationExcluded']) {
      expect(recommendAcuteDAPT({ ...base, nihss: 2, timeFromOnsetH: 10, [key]: undefined }).regimen, key).toBe('—');
    }
    expect(recommendAcuteDAPT({ ...base, nihss: '', timeFromOnsetH: 10 }).regimen).toBe('—');
    expect(recommendAcuteDAPT({ ...base, age: '', nihss: 2, timeFromOnsetH: 10 }).regimen).toBe('—');
  });
});

describe('Calculators-tab worksheets', () => {
  const { calculateReviewedABCD2: abcd2, calculateReviewedCHADS2VASc: chads, calculateReviewedHASBLED: hasBled, calculateReviewedRoPE: rope, classifyReviewedPASCAL: pascal, calculateReviewedPHASES: phases, calculateReviewedWFNS: wfns, calculateReviewedModifiedFisher: fisher, describeReviewedMTICI: mtici, calculateReviewedNASCET: nascet, calculateReviewedRegionalASPECTS: aspects, calculateReviewedRegionalPCASPECTS: pcAspects, calculateReviewedPHQ2: phq2, calculateReviewedSTOPBANG: stopBang, describeReviewedHuntHess: huntHess } = worksheets;
  it('ABCD² (Johnston 2007 abstract: age ≥60 1, BP ≥140/90 1, weakness 2 / speech 1, ≥60 min 2 / 10–59 min 1, diabetes 1)', () => {
    const base = { tiaConfirmed: true, age: 59, bp: '139/89', clinicalFeatures: 'other', duration: 'under10', diabetes: false };
    expect(abcd2(base).score).toBe(0);
    expect(abcd2({ ...base, age: 60, bp: '140/85', clinicalFeatures: 'weakness', duration: '60plus', diabetes: true }).score).toBe(7);
    expect(abcd2({ ...base, clinicalFeatures: 'speech', duration: '10to59' }).score).toBe(2);
    expect(abcd2({ ...base, bp: '120/90' }).score).toBe(1);
    for (const bp of ['90/120', '140', '', '140/90/80']) expect(abcd2({ ...base, bp })).toBeNull();
  });
  it('CHA₂DS₂-VASc (2023 ACC/AHA/ACCP/HRS components: age ≥75 and stroke/TIA/TE doubled; age 65–74 and female 1)', () => {
    const base = { afConfirmed: true, age: 64, sex: 'M', chf: false, hypertension: false, diabetes: false, strokeTia: false, vascular: false };
    expect([64, 65, 74, 75].map(age => chads({ ...base, age }).score)).toEqual([0, 1, 1, 2]);
    expect(chads({ ...base, sex: 'F' }).score).toBe(1);
    expect(chads({ ...base, strokeTia: true }).score).toBe(2);
    expect(chads({ ...base, age: 75, sex: 'F', chf: true, hypertension: true, diabetes: true, strokeTia: true, vascular: true }).score).toBe(9);
    expect(chads({ ...base, afConfirmed: false })).toBeNull();
    expect(chads({ ...base, sex: 'X' })).toBeNull();
  });
  it('HAS-BLED (Pisters 2010 abstract: elderly >65; renal/liver and drugs/alcohol score separately; maximum 9)', () => {
    const base = { afConfirmed: true, age: 65, uncontrolledHypertension: false, renal: false, liver: false, stroke: false, bleeding: false, labileINR: false, drugs: false, alcohol: false };
    expect(hasBled(base).score).toBe(0);
    expect(hasBled({ ...base, age: 66 }).score).toBe(1);
    expect(hasBled({ ...base, renal: true, liver: true }).score).toBe(2);
    expect(hasBled({ ...base, drugs: true, alcohol: true }).score).toBe(2);
    expect(hasBled(Object.fromEntries(Object.entries(base).map(([key, value]) => [key, typeof value === 'boolean' ? true : 66]))).score).toBe(9);
  });
  it('RoPE (Kent 2013: younger age, cortical infarct and absence of hypertension, diabetes, smoking, prior stroke/TIA)', () => {
    // Age points 18–29 5, 30–39 4, 40–49 3, 50–59 2, 60–69 1, ≥70 0; one point per absent risk factor; cortical infarct 1.
    const none = { cryptogenicStrokeWithPfo: true, hypertension: false, diabetes: false, priorStrokeTia: false, smoker: false, corticalInfarct: true };
    expect(rope({ ...none, age: 18 }).score).toBe(5 + 4 + 1);
    expect(rope({ ...none, age: 70, hypertension: true, diabetes: true, priorStrokeTia: true, smoker: true, corticalInfarct: false }).score).toBe(0);
    expect(rope({ ...none, age: 45, hypertension: true, smoker: true }).score).toBe(3 + 2 + 1);
    expect(rope({ ...none, age: 45, cryptogenicStrokeWithPfo: false })).toBeNull();
  });
  it('PASCAL (Kent 2021: RoPE with high-risk PFO features, large shunt or atrial septal aneurysm; source age 18–60)', () => {
    const run = (ropeScore, largeShunt, atrialSeptalAneurysm, age = 45) => pascal({ cryptogenicStrokeWithPfo: true, age, ropeScore, largeShunt, atrialSeptalAneurysm })?.category;
    expect(run(6, false, false)).toBe('Unlikely');
    expect(run(6, true, false)).toBe('Possible');
    expect(run(7, false, false)).toBe('Possible');
    expect(run(7, false, true)).toBe('Probable');
    expect(run(7, false, true, 61)).toBeUndefined();
  });
  it('PHASES (Greving 2014 point chart; sizes <7.0, 7.0–9.9, 10.0–19.9, ≥20 mm)', () => {
    const base = { unrupturedSaccular: true, age: 69, population: 'northAmericaEurope', hypertension: false, sizeMm: 6.9, earlierSAH: false, site: 'ica' };
    expect(phases(base).score).toBe(0);
    expect(phases({ ...base, population: 'finnish', hypertension: true, age: 70, sizeMm: 20, earlierSAH: true, site: 'acaPcommPosterior' }).score).toBe(5 + 1 + 1 + 10 + 1 + 4);
    expect(phases({ ...base, population: 'japanese', site: 'mca', sizeMm: 7 }).score).toBe(3 + 2 + 3);
    expect([9.99, 10, 19.99].map(sizeMm => phases({ ...base, sizeMm }).score)).toEqual([3, 6, 6]);
  });
  it('Hunt–Hess and WFNS (GCS 15 I; 13–14 II without / III with motor deficit; 7–12 IV; 3–6 V)', () => {
    expect(huntHess({ sahConfirmed: true, grade: 5 }).description).toMatch(/Deep coma/);
    expect(huntHess({ sahConfirmed: true, grade: 6 })).toBeNull();
    const grade = (eye, verbal, motor, motorDeficit) => wfns({ sahConfirmed: true, gcs: { eye, verbal, motor }, motorDeficit })?.grade;
    expect(grade(4, 5, 6, false)).toBe(1); // 15
    expect(grade(4, 4, 6, false)).toBe(2); // 14
    expect(grade(3, 4, 6, true)).toBe(3); // 13 with deficit
    expect(grade(3, 4, 5, false)).toBe(4); // 12
    expect(grade(2, 2, 3, true)).toBe(4); // 7
    expect(grade(1, 2, 3, false)).toBe(5); // 6
    expect(grade(1, 1, 1, false)).toBe(5); // 3
    expect(grade(4, 5, 6, true)).toBeUndefined(); // GCS 15 with deficit is not in the table
  });
  it('modified Fisher (Frontera 2006: thin or thick cisternal blood, with or without IVH)', () => {
    const grade = (bloodThickness, ivh) => fisher({ aneurysmalSah: true, bloodThickness, ivh })?.grade;
    expect([grade('absent', false), grade('thin', false), grade('thin', true), grade('thick', false), grade('thick', true)]).toEqual(['0', '1', '2', '3', '4']);
    expect(fisher({ aneurysmalSah: false, bloodThickness: 'thin', ivh: false })).toBeNull();
  });
  it('mTICI (Zaidat 2013; Goyal 2014 2c) and NASCET (100 × (1 − minimum/distal))', () => {
    expect(Object.keys(worksheets.MTICI_DESCRIPTORS).sort()).toEqual(['0', '1', '2a', '2b', '2c', '3']);
    expect(mtici({ ischemic: true, grade: '2' })).toBeNull();
    const pct = (minimumDiameterMm, distalDiameterMm, patch = {}) => nascet({ side: 'right', patentExtracranialICA: true, nearOcclusion: false, minimumDiameterMm, distalDiameterMm, ...patch })?.score;
    expect([pct(1.5, 5), pct(2.5, 5), pct(4, 5), pct(5, 5)]).toEqual([70, 50, 20, 0]);
    expect(pct(6, 5)).toBeUndefined();
    expect(pct(1.5, 5, { nearOcclusion: true })).toBeUndefined();
    expect(pct(1.5, 5, { patentExtracranialICA: false })).toBeUndefined();
  });
  it('ASPECTS (10 MCA regions, 1 point each) and pc-ASPECTS (pons and midbrain 2 points; others 1)', () => {
    const anterior = positive => ({ hemisphere: 'left', regions: Object.fromEntries(worksheets.ASPECTS_REGIONS.map(region => [region.key, positive.includes(region.key)])) });
    expect(worksheets.ASPECTS_REGIONS.map(region => region.key)).toEqual(['C', 'L', 'IC', 'I', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
    expect(aspects(anterior(['C', 'I', 'M2'])).score).toBe(7);
    expect(aspects({ ...anterior([]), hemisphere: '' })).toBeNull();
    const posterior = positive => ({ regions: Object.fromEntries(worksheets.PC_ASPECTS_REGIONS.map(region => [region.key, positive.includes(region.key)])) });
    expect(pcAspects(posterior(['pons', 'midbrain'])).score).toBe(6);
    expect(pcAspects(posterior(['pons', 'midbrain', 'thalamusLeft', 'thalamusRight'])).score).toBe(4);
    expect(pcAspects(posterior(worksheets.PC_ASPECTS_REGIONS.map(region => region.key))).score).toBe(0);
  });
  it('PHQ-2 (Kroenke 2003: two items 0–3, total 0–6)', () => {
    expect(phq2({ phq2_q1: '3', phq2_q2: '0' })).toEqual({ score: 3, max: 6 });
    expect(phq2({ phq2_q1: '1', phq2_q2: '4' })).toBeNull();
    expect(definition('phq2').limits).toMatch(/score of 3 or more as the optimal screening cutpoint/);
  });
  it('STOP-BANG (BMI >35 kg/m², age >50, neck >40 cm, male) with unit-plausibility cautions', () => {
    const base = { sb_snoring: true, sb_tired: true, sb_observed: true, sb_pressure: true };
    // 125 kg / 1.8² = 38.6 kg/m² (>35), age 51 (>50), neck 41 cm (>40), male: all eight items.
    expect(stopBang({ ...base, age: 51, sex: 'M', weight: 125, heightCm: 180, neckCm: 41 })).toMatchObject({ score: 8, bang: { bmi: true, age: true, neck: true, male: true } });
    // 113.4 kg / 1.8² = 35.0 (not >35), age 50, neck 40 cm, female: no BANG points.
    expect(stopBang({ ...base, age: 50, sex: 'F', weight: 113.4, heightCm: 180, neckCm: 40 })).toMatchObject({ score: 4, bang: { bmi: false, age: false, neck: false, male: false } });
    // 16 in typed as 16 "cm" would silently score the neck item no: caution, not a block.
    const inches = stopBang({ ...base, age: 60, sex: 'M', weight: 80, heightCm: 175, neckCm: 16 });
    expect(inches.score).toBe(4 + 1 + 1);
    expect(inches.neckWarning).toMatch(/confirm centimeters, not inches/);
    expect(stopBang({ ...base, age: 60, sex: 'M', weight: 80, heightCm: 175, neckCm: 25 }).neckWarning).toBeUndefined();
    expect(resultCautions(inches)).toEqual([inches.neckWarning]);
  });
});

describe('worksheet copy text, search and deep links', () => {
  const states = {
    abcd2: { context: 'acute', note: { diagnosisCategory: 'tia', age: '64' }, supplementary: { abcd2: { tiaConfirmed: true, initialSystolic: '150', initialDiastolic: '80', clinicalFeatures: 'speech', duration: '10to59', diabetes: false } } },
    chadsvasc: { note: { age: '70', sex: 'F' }, supplementary: { chadsvasc: { afConfirmed: true, chf: false, hypertension: true, diabetes: false, strokeTia: true, vascular: false } } },
    'has-bled': { note: { age: '70' }, supplementary: { 'has-bled': { afConfirmed: true, uncontrolledHypertension: false, renal: false, liver: false, stroke: true, bleeding: false, labileINR: false, drugs: true, alcohol: false } } },
    rope: { note: { age: '35' }, supplementary: { rope: { cryptogenicStrokeWithPfo: true, hypertension: false, diabetes: false, priorStrokeTia: false, smoker: false, corticalInfarct: true } } },
    pascal: { note: { age: '35' }, supplementary: { rope: { cryptogenicStrokeWithPfo: true, hypertension: false, diabetes: false, priorStrokeTia: false, smoker: false, corticalInfarct: true }, pascal: { largeShunt: true, atrialSeptalAneurysm: false } } },
    phases: { note: { age: '55' }, supplementary: { phases: { unrupturedSaccular: true, population: 'japanese', hypertension: false, sizeMm: '8', earlierSAH: false, site: 'mca' } } },
    'mrs-descriptors': { note: { premorbidMRS: '3' } },
    'hunt-hess': { supplementary: { 'hunt-hess': { sahConfirmed: true, grade: '2' } } },
    wfns: { gcs: { eye: 4, verbal: 4, motor: 6 }, supplementary: { wfns: { sahConfirmed: true, motorDeficit: false } } },
    'modified-fisher': { note: { diagnosisCategory: 'sah' }, details: { sahCause: 'Aneurysmal' }, supplementary: { 'modified-fisher': { bloodThickness: 'thick', ivh: true } } },
    mtici: { context: 'acute', note: { diagnosisCategory: 'ischemic', ticiScore: '2b' } },
    nascet: { supplementary: { nascet: { side: 'left', minimumDiameterMm: '2', distalDiameterMm: '5', patentExtracranialICA: true, nearOcclusion: false } } },
    'aspects-regions': { supplementary: { 'aspects-regions': { hemisphere: 'right', regions: Object.fromEntries(worksheets.ASPECTS_REGIONS.map(region => [region.key, region.key === 'M5'])) } } },
    'pc-aspects-regions': { supplementary: { 'pc-aspects-regions': { regions: Object.fromEntries(worksheets.PC_ASPECTS_REGIONS.map(region => [region.key, region.key === 'pons'])) } } },
    phq2: { supplementary: { phq2: { phq2_q1: '1', phq2_q2: '2' } } },
    'stop-bang': { note: { age: '60', sex: 'M', weight: '80', heightCm: '175' }, supplementary: { 'stop-bang': { sb_snoring: true, sb_tired: false, sb_observed: false, sb_pressure: true, neckCm: '16' } } }
  };
  const expected = { abcd2: 'ABCD²: 4/7', chadsvasc: 'CHA₂DS₂-VASc: 5/9', 'has-bled': 'HAS-BLED: 3/9', rope: 'RoPE: 9/10', pascal: 'PASCAL category: Probable', phases: 'PHASES: 8/22', 'mrs-descriptors': 'Baseline mRS descriptor 3', 'hunt-hess': 'Hunt–Hess grade: 2', wfns: 'WFNS grade: 2 (GCS 14).', 'modified-fisher': 'Modified Fisher grade: 4', mtici: 'mTICI reperfusion grade: 2b', nascet: 'NASCET carotid stenosis: 60% (left ICA).', 'aspects-regions': 'ASPECTS regional worksheet: 9/10 (right hemisphere).', 'pc-aspects-regions': 'pc-ASPECTS regional worksheet: 8/10.', phq2: 'PHQ-2: 3/6.', 'stop-bang': 'STOP-BANG: 4/8.' };
  // ABCD² 64 y 1 + 150/80 1 + speech 1 + 10–59 min 1 = 4. CHA₂DS₂-VASc female 1 + 65–74 1 + HTN 1 + stroke 2 = 5.
  // HAS-BLED >65 1 + stroke 1 + drugs 1 = 3. RoPE age 30–39 4 + four absent factors 4 + cortical 1 = 9; PASCAL RoPE ≥7 + large shunt.
  // PHASES Japanese 3 + MCA 2 + 7.0–9.9 mm 3 = 8. WFNS GCS 14 without deficit = II. NASCET 100 × (1 − 2/5) = 60%.
  // STOP-BANG snoring + pressure + age >50 + male = 4 (BMI 26.1, neck 16 "cm").
  it.each(Object.keys(expected))('%s copies its result with limits and source, without undefined or NaN', id => {
    const state = { context: 'follow-up', note: {}, gcs: {}, details: {}, supplementary: {}, ...states[id] };
    const text = reviewedCalculatorText(state, definition(id));
    expect(text.split('\n')[0]).toContain(expected[id]);
    expect(text).toContain(`Limits: ${definition(id).limits}`);
    expect(text).toContain(`Source: ${definition(id).sourceLabel} — ${definition(id).sourceUrl}`);
    expect(text).not.toMatch(/undefined|NaN|\[object/);
  });
  it('copies an active unit caution with the STOP-BANG result', () => {
    const text = reviewedCalculatorText({ context: 'follow-up', gcs: {}, details: {}, ...states['stop-bang'] }, definition('stop-bang'));
    expect(text.split('\n')[1]).toMatch(/^Caution: Neck circumference under 25 cm/);
  });
  it('CHA₂DS₂-VASc limits attribute the 2023 US and 2024 ESC scores and keep registry parity', () => {
    expect(definition('chadsvasc').limits).toMatch(/2023 ACC\/AHA\/ACCP\/HRS AF guideline names CHA₂DS₂-VASc/);
    expect(definition('chadsvasc').limits).toMatch(/2024 ESC AF guideline uses CHA₂DS₂-VA, which omits the sex category and is not calculated here/);
    const registry = JSON.parse(fs.readFileSync(new URL('../content/calculators/registry.json', import.meta.url), 'utf8'));
    for (const id of ['chadsvasc', 'phq2']) expect(registry.find(row => row.id === id).limits).toBe(definition(id).limits);
  });
  it.each([['sleep apnea', 'stop-bang'], ['depression', 'phq2'], ['atrial fibrillation', 'chadsvasc'], ['atrial fibrillation', 'has-bled'], ['patent foramen ovale', 'rope'], ['patent foramen ovale', 'pascal'], ['aneurysm', 'phases'], ['carotid', 'nascet'], ['reperfusion', 'mtici'], ['Rankin', 'mrs-descriptors']])('global and Tools search find "%s" → %s', (query, id) => {
    expect(matchesCalculatorSearch(definition(id), query)).toBe(true);
    expect(searchIndex(buildSearchIndex({ calculators: calculatorDefinitions }), query).map(record => record.id)).toContain(`calc:${id}`);
  });
  it('every calculator route, alias and Evidence calculator link resolves to a live surface', () => {
    const registry = JSON.parse(fs.readFileSync(new URL('../content/calculators/registry.json', import.meta.url), 'utf8'));
    for (const item of [...registry, ...calculatorDefinitions]) expect(parseWorkspaceRoute(item.route).surface, item.route).not.toBe('retired');
    for (const item of calculatorDefinitions) expect(parseWorkspaceRoute(`#/encounter/${item.id}`)).toEqual({ surface: 'tools', tool: item.id });
    for (const item of ENCOUNTER_TOOLS) expect(parseWorkspaceRoute(`#/encounter/${item.id}`)).toEqual({ surface: 'encounter', tool: item.id });
    for (const [alias, target] of [['tici', 'mtici'], ['hasbled', 'has-bled'], ['cha2ds2-vasc', 'chadsvasc'], ['stopbang', 'stop-bang'], ['mod-fisher', 'modified-fisher']]) expect(parseWorkspaceRoute(`#/tools/${alias}`)).toEqual({ surface: 'tools', tool: target });
    for (const [alias, target] of [['tnk-dose', 'tnk'], ['alteplase-dose', 'alteplase'], ['defuse-3', 'defuse3'], ['aspects-pc', 'pc-aspects']]) expect(parseWorkspaceRoute(`#/encounter/${alias}`)).toEqual({ surface: 'encounter', tool: target });
    const links = new Set();
    for (const file of fs.readdirSync(new URL('../src/reference/', import.meta.url)).filter(name => name.endsWith('.json'))) {
      for (const match of fs.readFileSync(new URL(`../src/reference/${file}`, import.meta.url), 'utf8').matchAll(/#\/(?:tools|encounter)\/[a-z0-9-]+/g)) links.add(match[0]);
    }
    expect(links.size).toBeGreaterThan(10);
    for (const link of links) expect(parseWorkspaceRoute(link).surface, link).not.toBe('retired');
  });
});

describe('Calculators tab keyboard use (headless Chromium)', () => {
  let browser, page;
  beforeAll(async () => {
    const bundled = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
      import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
      import {CalculatorDirectory} from './src/Tools.jsx';import {calculatorDefinitions} from './src/supplementary-calculator-definitions.js';import {reconcileSupplementaryAppliedScores} from './src/supplementary-calculators.js';
      const root=createRoot(document.getElementById('root'));window.copied=[];
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{window.copied.push(text);return Promise.resolve();}}});
      const draw=()=>root.render(<CalculatorDirectory definitions={calculatorDefinitions} state={window.model} update={fn=>{window.model=reconcileSupplementaryAppliedScores(window.model,fn(window.model));flushSync(draw);}}/>);
      window.renderTools=state=>{window.model=state;flushSync(draw)};
    ` } });
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: bundled.outputFiles[0].text });
  }, 30000);
  afterAll(async () => { await browser?.close(); });
  const focused = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName.toLowerCase());
  it('finds, opens, completes and copies a worksheet from the keyboard alone', async () => {
    await page.evaluate(state => window.renderTools(state), { context: 'follow-up', note: { age: '60', sex: 'M', weight: '80', heightCm: '175' }, gcs: {}, details: {}, supplementary: {} });
    await page.getByLabel('Find a calculator').focus();
    await page.keyboard.type('sleep apnea');
    await page.keyboard.press('Tab'); // Clear search
    await page.keyboard.press('Tab'); // the only matching worksheet
    expect(await focused()).toBe('summary');
    await page.keyboard.press('Enter');
    expect(await page.locator('#calc-stop-bang').evaluate(node => node.open)).toBe(true);
    await page.keyboard.press('Tab'); // Edit in Encounter
    await page.keyboard.press('Tab');
    for (const [label, key] of [['Loud snoring', 'Y'], ['Frequent daytime tiredness / sleepiness', 'N'], ['Observed stopping breathing during sleep', 'N'], ['High blood pressure or treatment for hypertension', 'Y']]) {
      expect(await focused()).toBe(label);
      await page.keyboard.press(key); // type-ahead picks Yes / No
      await page.keyboard.press('Tab');
    }
    expect(await focused()).toBe('Measured neck circumference (cm)');
    await page.keyboard.type('41');
    // Snoring + pressure + age >50 + male + neck >40 cm = 5; BMI 80 / 1.75² = 26.1 is not >35.
    expect(await page.locator('#calc-stop-bang [role="status"]').first().textContent()).toContain('STOP-BANG: 5/8');
    await page.locator('#calc-stop-bang').getByRole('button', { name: 'Copy result' }).focus();
    await page.keyboard.press('Enter');
    const copied = await page.evaluate(() => window.copied.at(-1));
    expect(copied.split('\n')[0]).toBe('STOP-BANG: 5/8.');
    expect(copied.split('\n')[1]).toMatch(/^Limits: Original eight-item/);
  });
});
