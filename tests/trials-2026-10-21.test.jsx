// Trials review 2026-10-21. Expected values come from the ClinicalTrials.gov records
// re-read on 2026-10-21 (quoted beside each case), the exact-day LastUpdatePostDate
// queries run that day, and the screener's own tri-state definitions. They are not
// copied from implementation output.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { newEncounter } from '../src/workspace-state.js';
import { NIHSS_ITEMS } from '../src/clinical/nihss-items.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import {
  anchoredOnsetHours, buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility, enrollmentLabel,
  EXCLUSION_ITEMS, numericFact, onsetSummary, potentialMatches, registryCheckLabel, toConfirm, ONSET_PRESETS,
  STUDY_FACTS, VISIBLE_FACTS, withClassification
} from '../src/evidence/screener-eval.js';
import { applyEncounterPrefill, screenerPrefillFromEncounter } from '../src/evidence/screener-prefill.js';
import { TrialScreener, TrialSourceContext } from '../src/components/TrialScreener.jsx';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const S = patch => ({ ...createInitialScreenerState(), ...patch });
const fresh = () => createInitialScreenerState();
const evaluate = (acronym, patch, nowMs = null) => evaluateTrialEligibility(trial(acronym), buildScreenerParams(S(patch), nowMs));
const encounter = (note = {}, rest = {}) => { const s = newEncounter(); Object.assign(s.note, note); return Object.assign(s, rest); };
const screenable = t => !t.referenceOnly && ['enrolling', 'soon'].includes(t.status);
function inZone(zone, run) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try { run(); } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
}

// One stored criterion, evaluated alone, read back as the tri-state the UI shows.
const only = c => ({ acronym: 'X', status: 'enrolling', eligibility: { criteria: [c], exclusions: [] } });
const verdict = (c, patch) => {
  const r = evaluateTrialEligibility(only(c), buildScreenerParams(S(patch)));
  return r.status === 'excluded' ? 'not met' : r.status === 'soon' ? 'before window' : r.completeness === 'potential-match' ? 'met' : 'unknown';
};
// An 'or' criterion is found by a field one of its branches reads (or the first one when field is null).
const crit = (acronym, field, operator) => {
  const found = trial(acronym).eligibility.criteria.find(c => operator === 'or'
    ? c.operator === 'or' && (!field || c.branches.some(b => b.criteria.some(cc => cc.field === field)))
    : (field ? c.field === field : c.operator === 'or') && (!operator || c.operator === operator));
  if (!found) throw new Error(`No ${acronym} ${field} criterion`);
  return found;
};

describe('registry re-verification on 2026-10-21 (statuses and dates rechecked 2026-10-31)', () => {
  // Overall status of each full record read with get_trial_details on 2026-10-21; unchanged at the 2026-10-31 recheck.
  const status = { STEP: 'RECRUITING', SISTER: 'RECRUITING', PICASSO: 'RECRUITING', TESTED: 'RECRUITING', MINUTE: 'RECRUITING', 'FASTEST-2': 'RECRUITING', CLARITY: 'NOT_YET_RECRUITING', INTERCEPT: 'RECRUITING', ASPIRE: 'RECRUITING', SATURN: 'RECRUITING', 'CAPPRICORN-1': 'ACTIVE_NOT_RECRUITING', 'SCOUTS-3': 'RECRUITING', VERIFY: 'RECRUITING', 'MR-PICS': 'RECRUITING', 'TELE-REHAB-2': 'RECRUITING', CAPTIVA: 'ACTIVE_NOT_RECRUITING' };
  // Exact-day AREA[LastUpdatePostDate] queries rerun on 2026-10-31: a RANGE[2026-10-21,MAX] query over all 16 NCT IDs
  // returned only CLARITY, TELE-REHAB-2 and CAPTIVA (each last updated 2026-10-26); the other 13 dates matched exactly.
  const lastUpdate = { STEP: '2025-12-04', SISTER: '2026-10-19', PICASSO: '2026-10-02', TESTED: '2026-09-02', MINUTE: '2026-09-15', 'FASTEST-2': '2026-08-20', CLARITY: '2026-10-26', INTERCEPT: '2026-08-19', ASPIRE: '2026-05-08', SATURN: '2026-04-21', 'CAPPRICORN-1': '2026-10-20', 'SCOUTS-3': '2026-08-13', VERIFY: '2026-08-20', 'MR-PICS': '2026-04-13', 'TELE-REHAB-2': '2026-10-26', CAPTIVA: '2026-10-26' };

  it('records the re-read date, status and last update of all 16 profiles consistently', () => {
    expect(screenerTrials.map(t => t.acronym).sort()).toEqual(Object.keys(status).sort());
    for (const t of screenerTrials) {
      const m = t.externalMetadata;
      expect(m.verificationDate, t.acronym).toBe('2026-10-31');
      expect(m.registryStatus, t.acronym).toBe(status[t.acronym]);
      expect(m.registryLastUpdatePosted, t.acronym).toBe(lastUpdate[t.acronym]);
      expect(t.sourceGaps.filter(g => g.startsWith('Registry status rechecked 2026-10-31: ' + status[t.acronym] + '; last update posted ' + lastUpdate[t.acronym] + ' (recorded 2026-10-31).')), t.acronym).toHaveLength(1);
      expect(JSON.stringify(t), t.acronym).not.toMatch(/2026-10-17/);
    }
    expect(registryCheckLabel(screenerTrials.map(t => t.externalMetadata.verificationDate))).toBe('registry checked 2026-10-31');
  });

  it('keeps the recruiting statuses as registry statuses, never local availability', () => {
    // CLARITY is marked recruiting (2026-10-31, maintainer's report) while its registry record still reads NOT_YET_RECRUITING.
    for (const t of screenerTrials.filter(screenable)) expect(enrollmentLabel(t), t.acronym).toMatch(t.acronym === 'CLARITY' ? /^Recruiting \(registry not yet updated\)$/ : /\(registry\)$/);
    expect(trial('CLARITY').externalMetadata.registryStatus).toBe('NOT_YET_RECRUITING');
    expect(enrollmentLabel(trial('CAPPRICORN-1'))).toBe('Not enrolling (active, not recruiting)');
    const html = renderToStaticMarkup(<TrialSourceContext trial={trial('SISTER')} now={new Date(2026, 9, 31, 9).getTime()} />);
    expect(html).toMatch(/Recorded registry check: <time [^>]*>2026-10-31<\/time> \(today\)/);
    expect(html).toContain('Last update posted, as recorded at that check: 2026-10-19; the live record may be newer.');
    expect(html).toContain('Local activation: not confirmed here.');
  });

  it('distinguishes FASTEST Part 1 and its published result from the Part 2 record', () => {
    // NCT07227246 brief summary: "FASTEST Part 2 is an extension of the FASTEST Trial ...";
    // NCT03496883 status ACTIVE_NOT_RECRUITING; Lancet 2026 (PMID 41653933) abstract: futility,
    // "adjusted common odds ratio 1·09 [95% CI 0·79-1·51]", RR 3·41 (1·14-10·15).
    const gap = trial('FASTEST-2').sourceGaps.find(g => g.startsWith('FASTEST Part 1'));
    expect(gap).toContain('NCT03496883; ACTIVE_NOT_RECRUITING on 2026-10-21');
    expect(gap).toContain('extension of the FASTEST Trial');
    for (const fact of ['PMID 41653933', '1.09, 95% CI 0.79–1.51', 'RR 3.41, 95% CI 1.14–10.15', 'Emerging evidence, not a guideline recommendation']) expect(gap).toContain(fact);
    expect(trial('FASTEST-2').externalMetadata.nct).toBe('NCT07227246');
  });
});

describe('profile corrections from the registry text read on 2026-10-21', () => {
  it('gives every screened profile registry items to confirm, so a potential match never reads "0 to confirm"', () => {
    for (const t of screenerTrials.filter(screenable)) expect(t.eligibility.manualPending?.length, t.acronym).toBeGreaterThan(0);
  });

  it('TELE-REHAB-2 lists its baseline tests and remaining exclusions to confirm (NCT06682429)', () => {
    // Inclusion 3-6 (record read 2026-10-31): "Action Research Arm Test score 14-44 (out of 57) at Baseline Visit 1"; "Box & Block Test score with affected arm is ≥1 block in 60 seconds";
    // exclusions 4, 5, 15-18: "Geriatric Depression Scale Score >10/15", "Montreal Cognitive Assessment score <22",
    // "lacks sufficient English or Spanish", "within 1.5-hr drive of the central study site", "Contraindication to MRI", "isolation precautions".
    const facts = { classification: 'ischemic', onsetVal: 120, onsetUnit: 'days', age: 60, preMrs: 1, ueWeakness: true, self_consent: true,
      exclusions: { exRecurrentStroke: false, exRecentStroke30d: false, exLifeExpectancy9m: false, exBotoxVns3m: false, exPregnancy: false } };
    const r = evaluate('TELE-REHAB-2', facts);
    expect(r.status).toBe('pending');
    expect(r.completeness).toBe('potential-match');
    const c = toConfirm(r).join(' ');
    for (const re of [/ARAT 14–44/, /Box & Block ≥ 1 block in 60 s/, /no surrogate consent/, /GDS > 10\/15/, /MoCA < 22/, /English or Spanish/, /1\.5-hour drive/, /MRI contraindication/, /isolation precautions/, /Negative pregnancy test required if of child-bearing potential/]) expect(c).toMatch(re);
    expect(trial('TELE-REHAB-2').exactExclusionCriteria.join(' ')).toMatch(/pregnant/);
  });

  it('SISTER prompts the CT-hypodensity imaging rule and the full pregnancy/breastfeeding exclusion (NCT05948566)', () => {
    // Inclusion 4c: hypodensity plus perfusion core "should be smaller than perfusion-based volume (area of Tmax>6s minus CBF<30%)".
    // Exclusion 5: "breastfeeding or plan to breastfeed within 3 months ... or have a positive urine or serum pregnancy test".
    const base = { classification: 'ischemic', onsetVal: 10, age: 60, nihss: 8, aspects: 8, preMrs: 0 };
    expect(toConfirm(evaluate('SISTER', base)).join(' ')).toMatch(/with CT hypodensity, hypodensity plus core smaller than the penumbra/);
    expect(trial('SISTER').exactInclusionCriteria.join(' ')).toMatch(/Tmax > 6 s minus CBF < 30%/);
    const absent = toConfirm(evaluate('SISTER', { ...base, exclusions: { exPregnancy: false } }));
    expect(absent).toContain('Confirm not breastfeeding or planning to within 3 months; negative pregnancy test if of childbearing potential');
    expect(evaluate('SISTER', { ...base, exclusions: { exPregnancy: true } }).exclusionReasons).toContain('Pregnancy or breastfeeding');
  });

  it('ASPIRE, SCOUTS-3, VERIFY and MR-PICS carry registry exclusions that were missing from the prompts', () => {
    // ASPIRE excl. "Active infective endocarditis"; SCOUTS-3 excl. 6, 8, 11, 12; VERIFY excl. 15 timing windows;
    // MR-PICS "Severe Neglect as measured by NIH Stroke Scale Question 11 score of 2" and no outside OT/PT/speech therapy.
    expect(toConfirm(evaluate('ASPIRE', { classification: 'ich' })).join(' ')).toMatch(/no active infective endocarditis/);
    const scouts = toConfirm(evaluate('SCOUTS-3', { classification: 'ich' })).join(' ');
    // r3-trials (2026-10-22): exclusion 6 is a history of pneumothorax; exclusion 11 includes pneumocephalus.
    for (const re of [/history of pneumothorax or bullous emphysema/, /general anesthesia or conscious sedation within 48 h before the planned sleep study/, /CSF leak or pneumocephalus within 3 months/, /aspiration risk/]) expect(scouts).toMatch(re);
    expect(toConfirm(evaluate('VERIFY', { classification: 'ischemic' })).join(' ')).toMatch(/behavioral testing at 48–120 h, TMS at 72–168 h and MRI at 48–168 h/);
    const mrPics = toConfirm(evaluate('MR-PICS', { classification: 'ischemic' })).join(' ');
    for (const re of [/NIHSS item 11 = 2/, /occupational, physical or speech therapy outside the protocol/, /GDS > 10/]) expect(mrPics).toMatch(re);
    // NCT06506279 brief summary: "We will be structuring this study as an open prospective feasibility study."
    expect(trial('MR-PICS').sourceHypothesisText).toMatch(/^Open prospective feasibility study/);
  });

  it('MINUTE states the screening-time interval, never an assumed randomization time (NCT07260916)', () => {
    // Inclusion 8: "Randomization within 16 hours from LKW and within 2 hours of arrival to the randomizing center."
    const met = evaluate('MINUTE', { classification: 'ich', onsetVal: 3 });
    expect(met.matchedCriteria).toContain('Within 16 h of LKW at screening (registry: randomization ≤ 16 h from LKW and ≤ 2 h of arrival)');
    expect(met.matchedCriteria.join(' ')).not.toMatch(/Randomization is/);
    expect(evaluate('MINUTE', { classification: 'ich', onsetVal: 17 }).exclusionReasons).toContain('More than 16 hours from LKW at screening (registry: randomization ≤ 16 hours from LKW)');
  });
});

describe('criterion boundaries follow the registry wording', () => {
  // [study, field, operator or null, facts, expected, registry wording]
  const cases = [
    ['STEP', 'age', '>=', { age: 18 }, 'met', '"Age 18 years or older"'], ['STEP', 'age', '>=', { age: 17.9 }, 'not met', ''],
    // "Presentation to enrolling hospital within 24 hours of last known well/stroke onset" (r3-trials, 2026-10-22).
    ['STEP', 'onsetHours', 'or', { onsetVal: 24 }, 'met', '"within 24 hours"'], ['STEP', 'onsetHours', 'or', { onsetVal: 24.01 }, 'unknown', 'presentation time unknown'],
    ['STEP', 'onsetHours', 'or', { onsetVal: 24.01, presentedWithin24h: false }, 'not met', ''], ['STEP', 'onsetHours', 'or', { onsetVal: 30, presentedWithin24h: true }, 'met', ''],
    // App acute screening limit (not registry text; r3-trials second verification): presentation ≤ 24 h meets STEP timing only within 30 h of LKW.
    ['STEP', 'onsetHours', '<=', { onsetVal: 30 }, 'met', 'app limit'], ['STEP', 'onsetHours', '<=', { onsetVal: 30.01 }, 'not met', ''],
    ['STEP', 'aspects', '>=', { aspects: 6 }, 'met', '"CT ASPECT score <6" excluded'], ['STEP', 'aspects', '>=', { aspects: 5 }, 'not met', ''],
    ['STEP', 'preMrs', '<=', { preMrs: 2 }, 'met', '"Pre-stroke modified Rankin Scale score 0-2"'], ['STEP', 'preMrs', '<=', { preMrs: 3 }, 'not met', ''],
    ['STEP', 'vessel', 'or', { vessel: 'ica_m1', nihss: 5 }, 'met', '"NIHSS 0-5" + intracranial ICA/M1'], ['STEP', 'vessel', 'or', { vessel: 'ica_m1', nihss: 0 }, 'met', ''],
    ['STEP', 'vessel', 'or', { vessel: 'ica_m1', nihss: 6 }, 'not met', ''], ['STEP', 'vessel', 'or', { vessel: 'm2_m3_nd', nihss: 8 }, 'met', '"NIHSS > =8" + non-dominant M2/M3'],
    ['STEP', 'vessel', 'or', { vessel: 'm2_m3_nd', nihss: 7 }, 'not met', ''], ['STEP', 'vessel', 'or', { vessel: 'ica_m1' }, 'unknown', ''],
    ['SISTER', 'onsetHours', 'between', { onsetVal: 4.5 }, 'met', '"within 4.5 to 24 hours"'], ['SISTER', 'onsetHours', 'between', { onsetVal: 24 }, 'met', ''],
    ['SISTER', 'onsetHours', 'between', { onsetVal: 4.4 }, 'before window', ''], ['SISTER', 'onsetHours', 'between', { onsetVal: 24.1 }, 'not met', ''],
    ['SISTER', 'nihss', '>=', { nihss: 4 }, 'met', '"NIH Stroke Scale score ≥4"'], ['SISTER', 'nihss', '>=', { nihss: 3 }, 'not met', ''],
    ['SISTER', 'preMrs', '<=', { preMrs: 2 }, 'met', '"Pre-stroke modified Rankin score >2" excluded'], ['SISTER', 'preMrs', '<=', { preMrs: 3 }, 'not met', ''],
    ['TESTED', 'preMrs', 'in', { preMrs: 3 }, 'met', '"mRS 3-4"'], ['TESTED', 'preMrs', 'in', { preMrs: 4 }, 'met', ''],
    ['TESTED', 'preMrs', 'in', { preMrs: 2 }, 'not met', ''], ['TESTED', 'preMrs', 'in', { preMrs: 5 }, 'not met', ''],
    ['TESTED', 'aspects', '>=', { aspects: 3 }, 'met', '"CT ... ASPECT score ≥3"'], ['TESTED', 'aspects', '>=', { aspects: 2 }, 'not met', ''],
    ['TESTED', 'nihss', '>=', { nihss: 6 }, 'met', '"NIH Stroke Scale score ≥6"'], ['TESTED', 'nihss', '>=', { nihss: 5 }, 'not met', ''],
    ['TESTED', 'vessel', 'in', { vessel: 'dominant_m2' }, 'met', '"M1 or dominant M2"'], ['TESTED', 'vessel', 'in', { vessel: 'm2_m3_nd' }, 'not met', ''],
    ['MINUTE', 'age', 'between', { age: 80 }, 'met', '"Age ≥ 18 and ≤ 80 years"'], ['MINUTE', 'age', 'between', { age: 81 }, 'not met', ''],
    ['MINUTE', 'ichVolume', '>=', { ichVolume: 20 }, 'met', '"BGH of volume ≥ 20 mL"'], ['MINUTE', 'ichVolume', '>=', { ichVolume: '19.9' }, 'not met', ''],
    ['MINUTE', 'gcs', '>=', { gcs: 7 }, 'met', '"GCS score <7" excluded'], ['MINUTE', 'gcs', '>=', { gcs: 6 }, 'not met', ''],
    ['MINUTE', 'onsetHours', '<=', { onsetVal: 16 }, 'met', '"within 16 hours from LKW"'], ['MINUTE', 'onsetHours', '<=', { onsetVal: 16.1 }, 'not met', ''],
    ['MINUTE', 'ichLocation', '==', { ichLocation: 'thalamic' }, 'not met', '"non-thalamic, BGH"'],
    ['FASTEST-2', 'age', 'between', { age: 18 }, 'met', '"18-80 years, inclusive"'], ['FASTEST-2', 'age', 'between', { age: 17 }, 'not met', ''],
    ['FASTEST-2', 'onsetHours', '<=', { onsetVal: 2 }, 'met', '"within 120 minutes"'], ['FASTEST-2', 'onsetHours', '<=', { onsetVal: 2.01 }, 'not met', ''],
    ['FASTEST-2', 'gcs', '>=', { gcs: 8 }, 'met', '"Score of 3 to 7 on the Glasgow Coma Scale" excluded'], ['FASTEST-2', 'gcs', '>=', { gcs: 7 }, 'not met', ''],
    ['FASTEST-2', 'ichVolume', '>=', { ichVolume: 2 }, 'met', '"ICH volume < 2 cc or ≥ 60 cc" excluded'], ['FASTEST-2', 'ichVolume', '>=', { ichVolume: 1.9 }, 'not met', ''],
    ['FASTEST-2', 'ichVolume', '<', { ichVolume: 59.9 }, 'met', ''], ['FASTEST-2', 'ichVolume', '<', { ichVolume: 60 }, 'not met', ''],
    ['CLARITY', 'age', '>=', { age: 40 }, 'met', '"≥40 years"'], ['CLARITY', 'age', '>=', { age: 39 }, 'not met', ''],
    ['CLARITY', 'onsetDays', '<=', { onsetVal: 180, onsetUnit: 'days' }, 'met', '"within 180 days"'], ['CLARITY', 'onsetDays', '<=', { onsetVal: 181, onsetUnit: 'days' }, 'not met', ''],
    ['INTERCEPT', null, 'or', { onsetVal: 41, onsetUnit: 'days' }, 'met', '"< 6 week" (any OAC status)'],
    ['INTERCEPT', null, 'or', { onsetVal: 42, onsetUnit: 'days', takingOac: false }, 'not met', '"6 to 52 weeks" only on OAC'],
    ['INTERCEPT', null, 'or', { onsetVal: 42, onsetUnit: 'days', takingOac: true }, 'met', ''], ['INTERCEPT', null, 'or', { onsetVal: 364, onsetUnit: 'days', takingOac: true }, 'met', ''],
    ['INTERCEPT', null, 'or', { onsetVal: 365, onsetUnit: 'days', takingOac: true }, 'not met', ''], ['INTERCEPT', null, 'or', { onsetVal: 100, onsetUnit: 'days' }, 'unknown', ''],
    ['ASPIRE', 'onsetDays', 'between', { onsetVal: 14, onsetUnit: 'days' }, 'met', '"within 14-180 days after ICH onset"'], ['ASPIRE', 'onsetDays', 'between', { onsetVal: 180, onsetUnit: 'days' }, 'met', ''],
    ['ASPIRE', 'onsetDays', 'between', { onsetVal: 13, onsetUnit: 'days' }, 'before window', ''], ['ASPIRE', 'onsetDays', 'between', { onsetVal: 181, onsetUnit: 'days' }, 'not met', ''],
    ['SATURN', 'age', '>=', { age: 50 }, 'met', '"Age ≥ 50 years"'], ['SATURN', 'age', '>=', { age: 49 }, 'not met', ''],
    ['SATURN', 'onsetDays', '<=', { onsetVal: 7, onsetUnit: 'days' }, 'met', '"within 7 days of the onset"'], ['SATURN', 'onsetDays', '<=', { onsetVal: 169 }, 'not met', ''],
    ['SATURN', 'preMrs', '<=', { preMrs: 3 }, 'met', '"Pre-morbid mRS >3" excluded'], ['SATURN', 'preMrs', '<=', { preMrs: 4 }, 'not met', ''],
    ['SCOUTS-3', 'onsetDays', '<=', { onsetVal: 30, onsetUnit: 'days' }, 'met', '"within past 30 days"'], ['SCOUTS-3', 'onsetDays', '<=', { onsetVal: 31, onsetUnit: 'days' }, 'not met', ''],
    ['SCOUTS-3', 'classification', 'in', { classification: 'tia' }, 'not met', '"acute ischemic infarction or intraparenchymal hemorrhage"'],
    ['VERIFY', 'onsetHours', 'between', { onsetVal: 24 }, 'met', '"within 24 to 96 hours"'], ['VERIFY', 'onsetHours', 'between', { onsetVal: 96 }, 'met', ''],
    ['VERIFY', 'onsetHours', 'between', { onsetVal: 23.9 }, 'before window', ''], ['VERIFY', 'onsetHours', 'between', { onsetVal: 96.1 }, 'not met', ''],
    ['MR-PICS', 'age', 'between', { age: 22 }, 'met', '"22-75 years of age"'], ['MR-PICS', 'age', 'between', { age: 75 }, 'met', ''],
    ['MR-PICS', 'age', 'between', { age: 21 }, 'not met', ''], ['MR-PICS', 'age', 'between', { age: 76 }, 'not met', ''],
    ['MR-PICS', 'currentMrs', 'in', { currentMrs: 3 }, 'met', '"between 3 and 4 on the modified Rankin Scale"'], ['MR-PICS', 'currentMrs', 'in', { currentMrs: 5 }, 'not met', ''],
    ['MR-PICS', 'onsetDays', '>=', { onsetVal: 184, onsetUnit: 'days' }, 'met', '"Minimum 6 months" (≥ 184 days covers any 6 calendar months)'],
    ['MR-PICS', 'onsetDays', '>=', { onsetVal: 183.9, onsetUnit: 'days' }, 'before window', ''],
    // TELE-REHAB-2 limits from the record read 2026-10-31 (last update posted 2026-10-26); earlier record: 120±30 days, age 18-80.
    ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 90, onsetUnit: 'days' }, 'met', '"onset 90-270 days prior to randomization"'], ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 270, onsetUnit: 'days' }, 'met', ''],
    ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 89, onsetUnit: 'days' }, 'before window', ''], ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 271, onsetUnit: 'days' }, 'not met', ''],
    ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 151, onsetUnit: 'days' }, 'met', 'inside the widened window'],
    ['TELE-REHAB-2', 'age', 'between', { age: 85 }, 'met', '"Age 18-85 years at the time of randomization"'], ['TELE-REHAB-2', 'age', 'between', { age: 86 }, 'not met', ''],
    ['TELE-REHAB-2', 'age', 'between', { age: 17 }, 'not met', ''], ['TELE-REHAB-2', 'age', 'between', {}, 'unknown', 'age not entered'],
    ['TELE-REHAB-2', 'onsetDays', 'between', {}, 'unknown', 'onset not entered'],
    ['TELE-REHAB-2', 'preMrs', '<=', { preMrs: 2 }, 'met', '"Modified Rankin Scale score was >2" excluded'], ['TELE-REHAB-2', 'preMrs', '<=', { preMrs: 3 }, 'not met', '']
  ];
  it.each(cases)('%s %s %s %j → %s %s', (acronym, field, operator, facts, expected) => {
    expect(verdict(crit(acronym, field, operator), { classification: 'ischemic', onsetUnit: 'hours', ...facts })).toBe(expected);
  });

  it('converts day and month presets to hours with 30-day months', () => {
    expect(buildScreenerParams(S({ onsetVal: 7, onsetUnit: 'days' })).onsetHours).toBe(168);
    expect(buildScreenerParams(S({ onsetVal: 6, onsetUnit: 'months' })).onsetDays).toBe(180);
    expect(buildScreenerParams(S({ onsetVal: 2, onsetUnit: 'weeks' })).onsetHours).toBeNull();
  });
});

describe('missing, malformed and implausible entries stay unknown', () => {
  const numeric = [['STEP', 'age', '>='], ['MINUTE', 'nihss', '>='], ['MINUTE', 'gcs', '>='], ['STEP', 'aspects', '>='], ['STEP', 'preMrs', '<='], ['MINUTE', 'ichVolume', '>='], ['MR-PICS', 'currentMrs', 'in']];
  const blanks = ['', ' ', null, undefined, 'unselected', NaN, Infinity, 'abc', '12 years', '20 mL', true, [18], {}, -1];
  it.each(numeric)('%s %s', (acronym, field, operator) => {
    for (const value of blanks) expect(verdict(crit(acronym, field, operator), { classification: 'ich', [field]: value }), `${field}=${String(value)}`).toBe('unknown');
  });
  it('treats out-of-range or fractional scores as unknown, never as met or not met', () => {
    for (const [field, values] of [['age', [121, 150, '-5']], ['nihss', [43, '3.5']], ['gcs', [2, 16, 14.5]], ['aspects', [11, 7.5]], ['preMrs', [7, 1.5]], ['ichVolume', [301, '1e3']]]) {
      for (const value of values) {
        expect(numericFact(field, value), `${field}=${value}`).toBeNull();
        const c = crit(field === 'age' || field === 'aspects' || field === 'preMrs' ? 'STEP' : 'MINUTE', field, field === 'preMrs' ? '<=' : field === 'age' ? '>=' : undefined);
        expect(verdict(c, { classification: 'ich', [field]: value }), `${field}=${value}`).toBe('unknown');
      }
    }
    expect(numericFact('age', '070')).toBe(70);
    expect(numericFact('ichVolume', '24.0')).toBe(24);
  });
  it('treats a negative, non-numeric or overflowing onset as unknown time, not as hour 0', () => {
    for (const onsetVal of ['', null, '-1', 'abc', '1e400', NaN, -0.5]) {
      expect(buildScreenerParams(S({ onsetVal, onsetUnit: 'hours' })).onsetHours, String(onsetVal)).toBeNull();
      expect(verdict(crit('FASTEST-2', 'onsetHours'), { onsetVal, onsetUnit: 'hours' }), String(onsetVal)).toBe('unknown');
    }
  });
});

describe('copied screening summary is truthful about what was used', () => {
  const inputsLine = patch => evaluateAll(S(patch)).briefingNote.split('\n').find(line => line.startsWith('Inputs: '));
  it('marks entries the criteria reject instead of printing them as facts', () => {
    expect(inputsLine({ classification: 'ich', age: '150', nihss: '3.5', ichVolume: '1e3' })).toBe('Inputs: Hemorrhage (ICH) · LKW unknown · age 150 (invalid entry; treated as unknown) · NIHSS 3.5 (invalid entry; treated as unknown) · volume 1e3 mL (invalid entry; treated as unknown)');
    expect(inputsLine({ classification: 'ischemic', age: '070', nihss: '4' })).toBe('Inputs: Ischemic stroke · LKW unknown · age 70 · NIHSS 4');
    expect(inputsLine({ classification: 'ischemic', onsetVal: '-1', onsetUnit: 'hours' })).toBe('Inputs: Ischemic stroke · LKW unknown');
  });

  it('gives each candidate a direct registry link and keeps the other groups compact', () => {
    const r = evaluateAll(S({ classification: 'ich', onsetVal: 1, onsetUnit: 'hours' }));
    const lines = r.briefingNote.split('\n');
    const candidates = [...r.pending].map(item => item.trial.externalMetadata.nct);
    expect(candidates.length).toBeGreaterThan(0);
    for (const nct of candidates) expect(lines).toContain(`  Registry record: https://clinicaltrials.gov/study/${nct}`);
    expect(lines.filter(line => line.startsWith('  Registry record: '))).toHaveLength(candidates.length);
  });

  it('never prints undefined, null, NaN or object artifacts across classifications, presets and facts', () => {
    const facts = [{}, { age: 70, nihss: 8, preMrs: 0, aspects: 8, vessel: 'ica_m1', afibHistory: true, takingOac: false }, { age: '150', nihss: '3.5', gcs: 14, ichVolume: '1e3', ichLocation: 'bg', statin: true, anticoagulant: 'doac' }, { exclusions: { exPregnancy: false, exSecondaryIch: true, exTandem: false } },
      { presentedWithin24h: false, unilateralSymptomatic: true, ueWeakness: false, self_consent: true, language: 'other', currentMrs: '9', availability_54w: false, rehab: 'yes', abcd2: '7', antithromboticSoc: false, nihss: 7, nihssUntestable: 1 }];
    for (const classification of ['ischemic', 'tia', 'ich']) for (const preset of [null, ...ONSET_PRESETS]) for (const extra of facts) {
      const timing = preset ? { onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours } : { onsetVal: 3, onsetUnit: 'hours' };
      const r = evaluateAll(S({ classification, ...timing, ...extra })), note = r.briefingNote;
      expect(note, `${classification} ${preset?.name}`).not.toMatch(/undefined|null|NaN|\[object|\{value\}/);
      const ahead = [...r.eligible, ...r.pending, ...r.soon].some(item => item.trial.acronym === 'CLARITY');
      expect(note.split('\n')[1]).toBe(ahead ? 'Statuses are overall registry statuses at that check, except where marked "registry not yet updated"; local site activation is not confirmed.' : 'Statuses are overall registry statuses at that check; local site activation is not confirmed.');
    }
  });
});

describe('Encounter LKW import across midnight, daylight saving and invalid times', () => {
  it('dates both ends of a live interval that crosses midnight', () => inZone('America/Los_Angeles', () => {
    const now = new Date(2026, 9, 21, 0, 45).getTime();
    const e = encounter({ diagnosisCategory: 'ich', lkwDate: '2026-10-20', lkwTime: '23:30' });
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, now), fresh());
    expect(state.onsetAnchorMs).toBe(new Date(2026, 9, 20, 23, 30).getTime());
    expect(onsetSummary(state, now)).toBe('LKW 1.3 h (Encounter LKW 2026-10-20 23:30, as of 2026-10-21 00:45)');
    // Same local day: clock times only.
    expect(onsetSummary(state, new Date(2026, 9, 20, 23, 50).getTime())).toBe('LKW 0.3 h (Encounter LKW 23:30, as of 23:50)');
    // FASTEST-2 (study drug ≤ 120 min) closes 2 h after the 23:30 LKW, after midnight.
    const r = evaluateAll(state, screenerTrials, new Date(2026, 9, 21, 1, 31).getTime());
    expect(r.excluded.find(i => i.trial.acronym === 'FASTEST-2').exclusionReasons).toContain('Beyond 120 minutes from onset/LKW');
  }));

  it('imports a repeated daylight-saving hour only with an explicit occurrence, and prints its offset', () => inZone('America/Los_Angeles', () => {
    const now = Date.parse('2026-11-01T11:00:00Z'); // 03:00 PST
    expect(screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ich', lkwDate: '2026-11-01', lkwTime: '01:30' }), now).patch.onsetVal).toBeUndefined();
    const chosen = encounter({ diagnosisCategory: 'ich', lkwDate: '2026-11-01', lkwTime: '01:30', lkwClock: { value: '2026-11-01T01:30', instant: '2026-11-01T01:30-07:00' } });
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(chosen, now), fresh());
    expect(state.onsetAnchorMs).toBe(Date.parse('2026-11-01T08:30:00Z'));
    expect(onsetSummary(state, now)).toBe('LKW 2.5 h (Encounter LKW 01:30 (UTC−07:00), as of 03:00)');
  }));

  it('never imports a skipped, future, impossible or discovery-only time as onset', () => inZone('America/Los_Angeles', () => {
    const now = new Date(2026, 9, 21, 0, 45).getTime();
    for (const note of [
      { lkwDate: '2026-03-08', lkwTime: '02:30' }, // skipped spring-forward hour
      { lkwDate: '2026-10-21', lkwTime: '23:30' }, // later today: future
      { lkwDate: '2026-02-30', lkwTime: '10:00' }, // impossible date
      { lkwDate: '2026-10-20', lkwTime: '25:00' },
      { lkwUnknown: true, discoveryDate: '2026-10-20', discoveryTime: '22:00' }
    ]) {
      const p = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic', ...note }), now);
      expect(p.patch.onsetVal, JSON.stringify(note)).toBeUndefined();
      expect(onsetSummary(applyEncounterPrefill(fresh(), p, fresh()), now)).toBe('LKW unknown');
    }
  }));

  it('ignores an anchor or clock outside the representable date range instead of failing', () => {
    const state = S({ classification: 'ich', onsetVal: 2, onsetUnit: 'hours', onsetAnchorMs: -1e20 });
    expect(anchoredOnsetHours(state, Date.now())).toBeNull();
    expect(onsetSummary(state, Date.now())).toBe('LKW 2.0 h');
    expect(anchoredOnsetHours({ onsetAnchorMs: 0 }, 9e15)).toBeNull();
    expect(() => evaluateAll(state, screenerTrials, Date.now())).not.toThrow();
  });

  it('imports a threshold-safe ABC/2 volume, so rounding never crosses a study limit', () => {
    // ABC/2 = 7.9 × 8.1 × (10 × 0.0625 cm) / 2 = 19.996875 mL: below MINUTE's "volume ≥ 20 mL".
    const e = encounter({ diagnosisCategory: 'ich' }, { volume: { a: '7.9', b: '8.1', thicknessMm: '0.625', numSlices: '10' } });
    const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, Date.now()), fresh());
    expect(state.ichVolume).toBeLessThan(20);
    expect(evaluateTrialEligibility(trial('MINUTE'), buildScreenerParams({ ...state, ichLocation: 'bg' })).exclusionReasons).toContain('Requires hematoma volume ≥20 mL by ABC/2');
  });
});

describe('partial Encounter data never yields a potential match', () => {
  it('holds for 400 seeded combinations of imported facts', () => {
    let seed = 20261021;
    const pick = list => list[(seed = (seed * 48271) % 2147483647) % list.length]; // Park–Miller, exact in doubles
    const now = new Date(2026, 9, 21, 12).getTime();
    for (let i = 0; i < 400; i++) {
      const e = encounter({
        diagnosisCategory: pick(['ischemic', 'ich', 'tia']), age: pick(['', '17', '45', '70', '81', '150']), premorbidMRS: pick(['', '0', '2', '3', '4']),
        lkwDate: '2026-10-21', lkwTime: pick(['', '11:00', '09:00', '02:00', '13:00']), vesselOcclusion: pick([[], ['M1'], ['ICA', 'M1'], ['M2'], ['Basilar'], ['None']]),
        m2Segment: pick(['', 'dominant-proximal', 'nondominant']), lastDOACType: pick(['', 'none', 'apixaban', 'warfarin', 'lmwh'])
      }, {
        nihssSource: 'reported', reportedNihss: pick(['', '0', '4', '8', '22']), aspects: pick(['', '5', '8']),
        gcs: pick([{}, { eye: '4', verbal: '5', motor: '6' }]), volume: pick([{ a: '', b: '', thicknessMm: '', numSlices: '' }, { a: '4', b: '3', thicknessMm: '5', numSlices: '8' }]),
        details: { afDetected: pick(['', 'yes', 'no']) }
      });
      const state = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(e, now), fresh());
      const r = evaluateAll(state, screenerTrials, now);
      expect(potentialMatches(r), JSON.stringify(e.note)).toEqual([]);
      expect(r.pending.every(item => item.unknownModeledCount > 0)).toBe(true);
    }
  });
});

describe('every modeled exclusion can be answered for each stroke type a study screens', () => {
  it('maps each exclusion field to a refiner item offered for that classification', () => {
    for (const t of screenerTrials.filter(screenable)) {
      const classes = t.eligibility.criteria.find(c => c.field === 'classification');
      for (const cls of Array.isArray(classes.value) ? classes.value : [classes.value]) {
        for (const e of t.eligibility.exclusions.filter(x => x.field.startsWith('ex'))) {
          expect(EXCLUSION_ITEMS.some(item => item.id === e.field && item.classifications.includes(cls) && item.trials.includes(t.acronym)), `${t.acronym} ${cls} ${e.field}`).toBe(true);
        }
      }
    }
  });
});

describe('on-call clarity of the key facts and timing controls', () => {
  const render = patch => renderToStaticMarkup(<TrialScreener initialState={S(patch)} />);
  it('flags an entry the criteria cannot read and links the explanation to the field', () => {
    const html = render({ classification: 'ich', age: '150', nihss: '3.5', ichVolume: '1e3', onsetVal: '-1', onsetUnit: 'hours' });
    expect(html).toContain('aria-invalid="true" aria-describedby="trial-age-invalid"');
    const hint = rule => `Treated as unknown: enter <span class="whitespace-nowrap">${rule}</span>.</small>`;
    expect(html).toContain('<small id="trial-age-invalid" class="block text-xs font-normal text-crit-700 dark:text-crit-300">' + hint('0–120'));
    expect(html).toContain(hint('a whole number 0–42'));
    expect(html).toContain(hint('0–300 mL'));
    expect(html).toContain('Not a valid interval; timing remains unknown.');
    expect(html).not.toContain('Exact interval entered.');
    expect(html).toContain('age 150 (invalid entry; treated as unknown)');
  });
  it('shows no warning for readable values', () => {
    const html = render({ classification: 'ich', age: '70', nihss: '4', ichVolume: '24.5', onsetVal: '3', onsetUnit: 'hours' });
    expect(html).not.toContain('aria-invalid');
    expect(html).not.toContain('Treated as unknown');
    expect(html).toContain('Exact interval entered.');
    expect(html).toContain('confirm and enter it before treating the study as a potential match');
  });
});

// TR-11 follow-up: every modeled fact now has a control. Registry eligibility text re-read on
// 2026-10-21 with get_trial_details:
//   TESTED NCT05911568 incl. 3 "Presenting to study hospital within 24 hours of last known well time".
//   VERIFY NCT05338697 incl. 2 "Unilateral symptomatic stroke due to ischemia", 3 "Motor deficits in the acutely
//     affected UE", 6 "Fluent in study approved languages (i.e., English or Spanish)", excl. 9 "Cognitive or
//     communication impairment precluding informed consent by the participant".
//   MR-PICS NCT06506279 "Disability measured between 3 and 4 on the modified Rankin Scale", "Levels of hemiparesis
//     that warrant surgical intervention (upper limb impairment)", "Available for the duration of the study, 54 weeks".
//   TELE-REHAB-2 NCT06682429 incl. 2 "due to ischemia or intracerebral hemorrhage (ICH)", 3 "upper extremity
//     deficits", 6 "signed by the subject (i.e., no surrogate consent)".
//   SCOUTS-3 NCT06722755 description "recruited upon IPR admission"; excl. 9 "Anticipated inpatient rehabilitation
//     length of stay < 5 nights"; incl. 2 "acute ischemic infarction or intraparenchymal hemorrhage".
//   CLARITY NCT07174414 incl. 2 "Ischemic stroke or high-risk TIA (ABCD2 score ≥6)", 4 "single or dual antithrombotic
//     therapy with aspirin, clopidogrel and/or ticagrelor".
const inputsOf = state => evaluateAll(state).briefingNote.split('\n').find(line => line.startsWith('Inputs: '));
const renderScreen = (patch, props = {}) => renderToStaticMarkup(<TrialScreener initialState={S(patch)} {...props} />);
const escapeRe = text => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const optionsOf = (html, label) => {
  const select = new RegExp(`<select aria-label="${escapeRe(label)}"[^>]*>(.*?)</select>`).exec(html);
  if (!select) throw new Error(`No select ${label}`);
  return [...select[1].matchAll(/<option value="([^"]*)"( selected="")?/g)].map(m => [m[1], Boolean(m[2])]);
};
const LABELS = {
  presentedWithin24h: 'Presented ≤ 24 h from LKW', afOrFlutterHistory: 'Non-valvular AF or atrial flutter', unilateralSymptomatic: 'Unilateral symptoms', ueWeakness: 'Upper-limb motor deficit',
  self_consent: 'Able to self-consent', language: 'Fluent language', currentMrs: 'Current mRS', availability_54w: 'Available for the 54-week study',
  rehab: 'Inpatient rehab, stay ≥ 5 nights expected', abcd2: 'ABCD2 score', antithromboticSoc: 'Guideline antithrombotic therapy (aspirin, clopidogrel and/or ticagrelor)'
};

describe('study-specific facts have screener controls (TR-11 follow-up)', () => {
  const expected = {
    // r3-trials (2026-10-22): STEP reads presentation ≤ 24 h; ASPIRE's AF-or-flutter fact has its own control.
    ischemic: [['presentedWithin24h', ['STEP', 'TESTED']], ['unilateralSymptomatic', ['VERIFY']], ['ueWeakness', ['VERIFY', 'MR-PICS', 'TELE-REHAB-2']], ['self_consent', ['VERIFY', 'TELE-REHAB-2']],
      ['language', ['VERIFY']], ['currentMrs', ['MR-PICS']], ['availability_54w', ['MR-PICS']], ['rehab', ['SCOUTS-3']], ['antithromboticSoc', ['CLARITY']]],
    tia: [['abcd2', ['CLARITY']], ['antithromboticSoc', ['CLARITY']]],
    ich: [['afOrFlutterHistory', ['ASPIRE']], ['ueWeakness', ['TELE-REHAB-2']], ['self_consent', ['TELE-REHAB-2']], ['rehab', ['SCOUTS-3']]]
  };

  it('offers each fact only for the classifications whose screened profiles test it', () => {
    expect(Object.fromEntries(Object.entries(STUDY_FACTS).map(([cls, facts]) => [cls, facts.map(([key, , , studies]) => [key, studies])]))).toEqual(expected);
    for (const facts of Object.values(STUDY_FACTS)) for (const [key, label] of facts) expect(label, key).toBe(LABELS[key]);
  });

  it('leaves no modeled criterion without a control for any classification a study screens', () => {
    const STATE_KEY = { exUeWeakness: 'ueWeakness' };
    // An or-branch whose own classification rule excludes this classification is not read (CLARITY's ABCD2 for ischemic stroke).
    const reads = (c, cls) => c.operator === 'or'
      ? c.branches.filter(b => !b.criteria.some(cc => cc.field === 'classification' && ![cc.value].flat().includes(cls))).flatMap(b => b.criteria.flatMap(cc => reads(cc, cls)))
      : [c.field];
    for (const t of screenerTrials.filter(screenable)) {
      for (const cls of [t.eligibility.criteria.find(c => c.field === 'classification').value].flat()) {
        const fields = [...t.eligibility.criteria.flatMap(c => reads(c, cls)), ...t.eligibility.exclusions.map(c => c.field).filter(f => !f.startsWith('ex'))];
        for (const field of fields.filter(f => !['classification', 'onsetHours', 'onsetDays', 'onsetMonths'].includes(f))) {
          expect(VISIBLE_FACTS[cls], `${t.acronym} ${cls} ${field}`).toContain(STATE_KEY[field] || field);
        }
      }
    }
  });

  it('shows them in a collapsed "Study-specific facts" section after the key facts, naming the studies that read each', () => {
    for (const [cls, facts] of Object.entries(expected)) {
      const html = renderScreen({ classification: cls });
      const at = html.indexOf('<details class="rounded-lg border border-line bg-card p-4"><summary class="min-h-[44px] cursor-pointer font-semibold"><span>Study-specific facts');
      expect(at, cls).toBeGreaterThan(html.indexOf('3. Key facts'));
      expect(at, cls).toBeLessThan(html.indexOf('Optional exclusion review'));
      expect(html, cls).toContain(`Study-specific facts <span class="font-normal text-mute">(0 of ${facts.length} answered)</span>`);
      for (const [key, studies] of facts) {
        expect(html, `${cls} ${key}`).toContain(`aria-label="${LABELS[key]}"`);
        // Each study name stays on one line (TELE-REHAB-2 never breaks at its hyphen).
        expect(html, `${cls} ${key}`).toContain(`<small id="trial-${key}-note" class="block text-xs font-normal text-mute">${studies.map(s => `<span class="whitespace-nowrap">${s}</span>`).join(' · ')}</small>`);
        expect(html, `${cls} ${key}`).toMatch(new RegExp(`aria-describedby="trial-${key}-note"`));
      }
      for (const key of Object.keys(LABELS).filter(k => !facts.some(([f]) => f === k))) expect(html, `${cls} hides ${key}`).not.toContain(`aria-label="${LABELS[key]}"`);
    }
  });

  it('offers unknown/yes/no for booleans and, for lists, exactly the values the criteria test, all read by the engine', () => {
    const html = renderScreen({ classification: 'ischemic' });
    // Tri-state booleans default to unknown.
    for (const key of ['presentedWithin24h', 'unilateralSymptomatic', 'ueWeakness', 'self_consent', 'availability_54w', 'antithromboticSoc']) {
      expect(optionsOf(html, LABELS[key]), key).toEqual([['', true], ['true', false], ['false', false]]);
    }
    // VERIFY "English or Spanish"; SCOUTS-3 inpatient rehabilitation with stay ≥ 5 nights.
    const language = crit('VERIFY', 'language'), rehab = crit('SCOUTS-3', 'rehab');
    expect(optionsOf(html, LABELS.language)).toEqual([['', true], ['english', false], ['spanish', false], ['other', false]]);
    expect(optionsOf(html, LABELS.rehab)).toEqual([['', true], ['yes', false], ['none', false]]);
    for (const value of language.value) expect(optionsOf(html, LABELS.language).map(([v]) => v)).toContain(value);
    expect(['english', 'spanish', 'other'].map(v => verdict(language, { classification: 'ischemic', language: v }))).toEqual(['met', 'met', 'not met']);
    expect(['yes', 'none'].map(v => verdict(rehab, { classification: 'ischemic', rehab: v }))).toEqual(['met', 'not met']);
    for (const [acronym, field, key] of [['TESTED', 'presentedWithin24h'], ['VERIFY', 'unilateralSymptomatic'], ['VERIFY', 'exUeWeakness', 'ueWeakness'], ['TELE-REHAB-2', 'self_consent'], ['MR-PICS', 'availability_54w'], ['CLARITY', 'antithromboticSoc']]) {
      expect([true, false].map(v => verdict(crit(acronym, field), { classification: 'ischemic', [key || field]: v })), `${acronym} ${field}`).toEqual(['met', 'not met']);
    }
  });

  it('flags current mRS and ABCD2 entries the criteria cannot read, and the summary marks them unknown', () => {
    const hint = rule => `Treated as unknown: enter <span class="whitespace-nowrap">${rule}</span>.</small>`;
    const ischemic = renderScreen({ classification: 'ischemic', currentMrs: '3.5', unilateralSymptomatic: true });
    expect(ischemic).toContain('aria-invalid="true" aria-describedby="trial-currentMrs-note trial-currentMrs-invalid"');
    expect(ischemic).toContain(hint('a whole number 0–6'));
    // An unreadable entry is not counted as answered.
    expect(ischemic).toContain('(1 of 9 answered)');
    const tia = renderScreen({ classification: 'tia', abcd2: '8' });
    expect(tia).toContain('aria-invalid="true" aria-describedby="trial-abcd2-note trial-abcd2-invalid"');
    expect(tia).toContain(hint('a whole number 0–7'));
    expect(renderScreen({ classification: 'tia', abcd2: '7' })).not.toContain('trial-abcd2-invalid');
    // ABCD2 is scored 0–7; mRS 0–6. Out-of-range or fractional entries stay unknown.
    for (const value of ['8', '6.5', '-1', 'high']) expect(numericFact('abcd2', value), value).toBeNull();
    for (const value of ['7', '3.5', '-1']) expect(numericFact('currentMrs', value), value).toBeNull();
    expect([numericFact('abcd2', '0'), numericFact('abcd2', '7'), numericFact('currentMrs', '6')]).toEqual([0, 7, 6]);
    expect(verdict(crit('CLARITY', null, 'or'), { classification: 'tia', abcd2: '8' })).toBe('unknown');
    expect(inputsOf(S({ classification: 'tia', abcd2: '8' }))).toBe('Inputs: TIA · LKW unknown · ABCD2 score: 8 (invalid entry; treated as unknown)');
    expect(inputsOf(S({ classification: 'ischemic', currentMrs: '3.5' }))).toBe('Inputs: Ischemic stroke · LKW unknown · current mRS: 3.5 (invalid entry; treated as unknown)');
  });

  it('prints study facts in the copied summary only when visible and answered, as the option chosen', () => {
    const all = { presentedWithin24h: true, unilateralSymptomatic: false, ueWeakness: true, self_consent: false, language: 'spanish', currentMrs: '4', availability_54w: true, rehab: 'none', abcd2: '6', antithromboticSoc: true };
    expect(inputsOf(S({ classification: 'ich', ...all }))).toBe('Inputs: Hemorrhage (ICH) · LKW unknown · upper-limb motor deficit: Yes · able to self-consent: No · inpatient rehab, stay ≥ 5 nights expected: No');
    expect(inputsOf(S({ classification: 'tia', ...all }))).toBe('Inputs: TIA · LKW unknown · ABCD2 score: 6 · guideline antithrombotic therapy (aspirin, clopidogrel and/or ticagrelor): Yes');
    expect(inputsOf(S({ classification: 'ischemic', ...all }))).toBe('Inputs: Ischemic stroke · LKW unknown · presented ≤ 24 h from LKW: Yes · unilateral symptoms: No · upper-limb motor deficit: Yes · able to self-consent: No · fluent language: Spanish · current mRS: 4 · available for the 54-week study: Yes · inpatient rehab, stay ≥ 5 nights expected: No · guideline antithrombotic therapy (aspirin, clopidogrel and/or ticagrelor): Yes');
    expect(inputsOf(S({ classification: 'ischemic', language: 'other', rehab: 'yes', currentMrs: '0' }))).toBe('Inputs: Ischemic stroke · LKW unknown · fluent language: Neither · current mRS: 0 · inpatient rehab, stay ≥ 5 nights expected: Yes');
    expect(inputsOf(S({ classification: 'ischemic' }))).toBe('Inputs: Ischemic stroke · LKW unknown');
    // Legacy boolean entries print as the engine reads them; a value no option offers is marked unknown.
    expect(inputsOf(S({ classification: 'ich', rehab: true }))).toBe('Inputs: Hemorrhage (ICH) · LKW unknown · inpatient rehab, stay ≥ 5 nights expected: Yes');
    expect(inputsOf(S({ classification: 'ich', self_consent: 'maybe' }))).toBe('Inputs: Hemorrhage (ICH) · LKW unknown · able to self-consent: maybe (invalid entry; treated as unknown)');
  });

  it('returns hidden study facts to unknown when the classification changes, like other hidden facts', () => {
    const ischemic = S({ classification: 'ischemic', presentedWithin24h: true, unilateralSymptomatic: true, ueWeakness: true, self_consent: true, language: 'english', currentMrs: '3', availability_54w: true, rehab: 'yes', antithromboticSoc: true, nihss: 7, nihssUntestable: 2 });
    const ich = withClassification(ischemic, 'ich');
    expect([ich.ueWeakness, ich.self_consent, ich.rehab, ich.nihss, ich.nihssUntestable]).toEqual([true, true, 'yes', 7, 2]);
    for (const key of ['presentedWithin24h', 'unilateralSymptomatic', 'language', 'currentMrs', 'availability_54w', 'antithromboticSoc']) expect(ich[key], key).toBe('unselected');
    const tia = withClassification(ischemic, 'tia');
    expect(tia.antithromboticSoc).toBe(true);
    for (const key of ['presentedWithin24h', 'unilateralSymptomatic', 'ueWeakness', 'self_consent', 'language', 'currentMrs', 'availability_54w', 'rehab', 'nihss']) expect(tia[key], key).toBe('unselected');
    expect(tia.nihssUntestable).toBe(0);
    const back = withClassification({ ...tia, abcd2: '6' }, 'ischemic');
    expect([back.abcd2, back.antithromboticSoc]).toEqual(['unselected', true]);
    expect([back.onsetVal, back.exclusions, back.imported]).toEqual([null, {}, null]);
    const initial = createInitialScreenerState();
    for (const key of Object.keys(LABELS)) expect(initial[key], key).toBe('unselected');
  });
});

describe('answering every modeled fact with registry-consistent values (TR-11 follow-up)', () => {
  const absent = (...ids) => Object.fromEntries(ids.map(id => [id, false]));
  // [study, facts at or inside the registry limits, contrary answers {fact: [value, error]}, registry item still to confirm]
  const studies = [
    ['VERIFY', { classification: 'ischemic', onsetVal: 24, onsetUnit: 'hours', age: 18, unilateralSymptomatic: true, ueWeakness: true, self_consent: true, language: 'spanish',
      exclusions: absent('exPriorUeCondition', 'exLegallyBlind', 'exDenseSensoryLoss', 'exVerifyStroke30d', 'exVerifySeizure', 'exPregnancy') },
    { unilateralSymptomatic: [false, 'Requires unilateral symptomatic AIS'], ueWeakness: [false, 'Requires upper extremity motor weakness'], self_consent: [false, 'Patient must be able to self-consent'], language: ['other', 'Must be English or Spanish speaking'] }, /SAFE score ≤8/],
    ['TELE-REHAB-2', { classification: 'ich', onsetVal: 150, onsetUnit: 'days', age: 80, preMrs: 2, ueWeakness: true, self_consent: true,
      exclusions: absent('exRecurrentStroke', 'exRecentStroke30d', 'exLifeExpectancy9m', 'exBotoxVns3m', 'exPregnancy') },
    { ueWeakness: [false, 'Requires moderate upper extremity weakness'], self_consent: [false, 'Patient must be able to self-consent'] }, /ARAT 14–44/],
    ['MR-PICS', { classification: 'ischemic', onsetVal: 184, onsetUnit: 'days', age: 75, currentMrs: '4', ueWeakness: true, availability_54w: true,
      exclusions: absent('exTherapeuticAnticoagulation', 'exHistoryDvtPe', 'exSeizures', 'exSpontaneousHemorrhagicStroke', 'exPregnancy', 'exMrPicsCommunication') },
    { currentMrs: ['2', 'Current (post-stroke) mRS must be 3 or 4'], ueWeakness: [false, 'Requires moderate unilateral upper extremity weakness'], availability_54w: [false, 'Requires availability for 54 weeks of visits'] }, /UEFM 25-45/],
    ['SCOUTS-3', { classification: 'ischemic', onsetVal: 30, onsetUnit: 'days', age: 18, rehab: 'yes',
      exclusions: absent('exIncarcerated', 'exPregnancy', 'exTrach', 'exCpapUse14d', 'exSecondaryIchOrSah') },
    { rehab: ['none', 'Must have inpatient rehabilitation placement and expected length of stay ≥ 5 nights'] }, /consent-giver/],
    ['TESTED', { classification: 'ischemic', onsetVal: 20, onsetUnit: 'hours', age: 18, vessel: 'dominant_m2', preMrs: 4, nihss: 6, aspects: 3, presentedWithin24h: true, exclusions: absent('exTerminalIllness') },
    { presentedWithin24h: [false, 'Did not present within 24h of onset'] }, /stable for at least 3 months/],
    ['CLARITY', { classification: 'tia', onsetVal: 180, onsetUnit: 'days', age: 40, abcd2: '6', antithromboticSoc: true, afibHistory: false, exclusions: absent('exBrainBleed2y', 'exCongestiveHeartFailure') },
    { abcd2: ['5', 'Requires ischemic stroke or high-risk TIA (ABCD2 score ≥ 6)'], antithromboticSoc: [false, 'Requires guideline-based single or dual antithrombotic therapy with aspirin, clopidogrel and/or ticagrelor'] }, /≥ 2 listed risk factors/]
  ];

  it.each(studies)('%s reaches a potential match, with its registry items still to confirm', (acronym, facts, contrary, item) => {
    const r = evaluate(acronym, facts);
    expect(r.completeness).toBe('potential-match');
    expect(r.unknownModeledCount).toBe(0);
    expect(r.exclusionReasons).toEqual([]);
    expect(toConfirm(r).join(' ')).toMatch(item);
    const all = evaluateAll(S(facts));
    if (trial(acronym).status === 'soon') {
      // CLARITY: NOT_YET_RECRUITING on the registry, so it is listed under Later, never as a match.
      expect(r.status).toBe('soon');
      expect(all.soon.find(i => i.trial.acronym === acronym).completeness).toBe('potential-match');
      expect(potentialMatches(all).map(i => i.trial.acronym)).not.toContain(acronym);
    } else {
      expect(r.status).toBe('pending');
      expect(potentialMatches(all).map(i => i.trial.acronym)).toContain(acronym);
      expect(renderScreen(facts)).toContain(`data-trial="${acronym}" data-completeness="potential-match"`);
    }
  });

  it.each(studies)('%s does not meet documented criteria after one contrary answer', (acronym, facts, contrary) => {
    for (const [key, [value, error]] of Object.entries(contrary)) {
      const r = evaluate(acronym, { ...facts, [key]: value });
      expect(r.status, `${acronym} ${key}`).toBe('excluded');
      expect(r.exclusionReasons, `${acronym} ${key}`).toContain(error);
    }
  });

  it.each(studies)('%s stays insufficient information while any modeled fact is unanswered', (acronym, facts) => {
    const keys = Object.keys(facts).filter(key => !['classification', 'onsetUnit', 'exclusions'].includes(key));
    const variants = [...keys.map(key => [key, { ...facts, [key]: key === 'onsetVal' ? null : 'unselected' }]),
      ...Object.keys(facts.exclusions).map(id => [id, { ...facts, exclusions: { ...facts.exclusions, [id]: undefined } }])];
    for (const [key, patch] of variants) {
      const r = evaluate(acronym, patch);
      expect(r.status, `${acronym} without ${key}`).not.toBe('excluded');
      expect(r.completeness, `${acronym} without ${key}`).toBe('insufficient-information');
      expect(r.unknownModeledCount, `${acronym} without ${key}`).toBe(1);
    }
  });
});

describe('imported NIHSS totals that leave out untestable items (TR-13)', () => {
  // NIHSS rules (src/clinical/nihss-items.js): UN items are documented but not summed; the Encounter counts them.
  const itemized = scores => Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options.find(o => o.endsWith(`(${scores[item.id] ?? 0})`))]));
  const withExam = (scores, diagnosisCategory = 'ischemic') => encounter({ diagnosisCategory }, { nihss: itemized(scores) });

  it('says how many items the total excludes in the import banner and the copied summary', () => {
    const e = withExam({ motor_arm_left: 4, motor_leg_left: 3, limb_ataxia: 'UN', dysarthria: 'UN' });
    const prefill = screenerPrefillFromEncounter(e, Date.now());
    expect(prefill.summary).toContain('NIHSS 7 (excludes 2 untestable items)');
    const state = applyEncounterPrefill(fresh(), prefill, fresh());
    expect([state.nihss, state.nihssUntestable]).toEqual([7, 2]);
    expect(inputsOf(state)).toBe('Inputs: Ischemic stroke · LKW unknown · NIHSS 7 (excludes 2 untestable items)');
    expect(renderToStaticMarkup(<TrialScreener encounter={e} now={Date.now()} />)).toContain('<span class="whitespace-nowrap">NIHSS 7 (excludes 2 untestable items)</span>');
    const one = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(withExam({ motor_arm_right: 'UN', visual: 2 }, 'ich'), Date.now()), fresh());
    expect(inputsOf(one)).toBe('Inputs: Hemorrhage (ICH) · LKW unknown · NIHSS 2 (excludes 1 untestable item)');
  });

  it('adds no note when every item was scored, for a reported total, or once the NIHSS is no longer the imported one', () => {
    const scored = screenerPrefillFromEncounter(withExam({ motor_arm_left: 2 }), Date.now());
    expect(scored.summary).toContain('NIHSS 2');
    expect(scored.patch.nihssUntestable).toBe(0);
    const reported = screenerPrefillFromEncounter(encounter({ diagnosisCategory: 'ischemic' }, { nihssSource: 'reported', reportedNihss: '7' }), Date.now());
    expect(reported.summary).toContain('NIHSS 7');
    expect(reported.patch.nihssUntestable).toBe(0);
    // Reapplying an Encounter whose exam is no longer complete clears the imported total and its note.
    const first = applyEncounterPrefill(fresh(), screenerPrefillFromEncounter(withExam({ limb_ataxia: 'UN' }), Date.now()), fresh());
    expect(first.nihssUntestable).toBe(1);
    const partial = encounter({ diagnosisCategory: 'ischemic' }, { nihss: { motor_arm_left: 'No movement (4)' } });
    const again = applyEncounterPrefill(first, screenerPrefillFromEncounter(partial, Date.now()), fresh());
    expect([again.nihss, again.nihssUntestable]).toEqual(['unselected', 0]);
    // TIA screens no NIHSS, so nothing is imported or noted.
    expect(screenerPrefillFromEncounter(withExam({ limb_ataxia: 'UN' }, 'tia'), Date.now()).summary.join(' ')).not.toMatch(/NIHSS|untestable/);
  });
});

describe('study-specific facts and the NIHSS note in a browser', () => {
  let browser, page, script, css;
  beforeAll(async () => {
    css = await readFile(new URL('../tailwind.css', import.meta.url), 'utf8');
    const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
      resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import Trials from './src/Trials.jsx';
        import { newEncounter } from './src/workspace-state.js';
        window.newEncounter = newEncounter;
        function Harness() {
          const [encounter, setEncounter] = useState(null);
          window.setEncounter = setEncounter;
          return <Trials sub="screener" onNavigate={() => {}} active encounter={encounter} now={Date.now()} />;
        }
        createRoot(document.getElementById('root')).render(<Harness />);
      ` } });
    script = result.outputFiles[0].text;
    browser = await chromium.launch();
  });
  afterAll(async () => { await browser?.close(); });
  const open = async (width = 390) => {
    page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(10000);
    await page.setContent('<div id="root"></div>');
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: script });
    await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
  };
  const preview = () => page.locator('[aria-label="Screening summary preview"]').textContent();
  const section = () => page.locator('details').filter({ has: page.locator('summary', { hasText: /^Study-specific facts/ }) });
  const heading = async () => (await section().locator('summary').innerText()).replace(/\s+/g, ' ');

  it('answers facts from the collapsed section, resets hidden ones on a classification change and fits 390 px', async () => {
    await open();
    try {
      await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      expect(await heading()).toBe('Study-specific facts (0 of 9 answered)');
      expect(await page.getByLabel('Unilateral symptoms', { exact: true }).isVisible()).toBe(false);
      await section().locator('summary').click();
      await page.getByLabel('Unilateral symptoms', { exact: true }).selectOption('true');
      await page.getByLabel('Upper-limb motor deficit', { exact: true }).selectOption('true');
      await page.getByLabel('Fluent language', { exact: true }).selectOption('spanish');
      await page.getByLabel('Current mRS', { exact: true }).fill('3');
      expect(await heading()).toBe('Study-specific facts (4 of 9 answered)');
      expect(await preview()).toContain('Inputs: Ischemic stroke · LKW unknown · unilateral symptoms: Yes · upper-limb motor deficit: Yes · fluent language: Spanish · current mRS: 3');
      for (const theme of ['light', 'dark']) {
        await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), theme).toBe(true);
        const small = await section().evaluate(el => [...el.querySelectorAll('select, input, summary')].filter(c => c.offsetParent !== null && c.getBoundingClientRect().height < 44).map(c => c.outerHTML.slice(0, 80)));
        expect(small, theme).toEqual([]);
      }
      await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
      expect(await heading()).toBe('Study-specific facts (1 of 4 answered)');
      expect(await page.getByLabel('Unilateral symptoms', { exact: true }).count()).toBe(0);
      expect(await preview()).not.toMatch(/unilateral symptoms|fluent language|current mRS/);
      await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
      expect(await heading()).toBe('Study-specific facts (1 of 9 answered)');
    } finally { await page.close(); }
  });

  it('shows the untestable-item note from the Encounter until the NIHSS is edited', async () => {
    await open();
    try {
      await page.evaluate(scores => {
        const s = window.newEncounter();
        s.note.diagnosisCategory = 'ischemic';
        s.nihss = scores;
        window.setEncounter(s);
      }, itemizedForBrowser);
      await page.getByText('NIHSS 7 (excludes 2 untestable items)', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Use these facts', exact: true }).click();
      expect(await preview()).toContain('NIHSS 7 (excludes 2 untestable items)');
      await page.getByLabel('NIHSS', { exact: true }).fill('8');
      expect(await preview()).toContain('NIHSS 8');
      expect(await preview()).not.toContain('untestable');
    } finally { await page.close(); }
  });
});
const itemizedForBrowser = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options.find(o => o.endsWith(`(${{ motor_arm_left: 4, motor_leg_left: 3, limb_ataxia: 'UN', dysarthria: 'UN' }[item.id] ?? 0})`))]));
