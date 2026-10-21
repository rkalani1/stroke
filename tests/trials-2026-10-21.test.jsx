// Trials review 2026-10-21. Expected values come from the ClinicalTrials.gov records
// re-read on 2026-10-21 (quoted beside each case), the exact-day LastUpdatePostDate
// queries run that day, and the screener's own tri-state definitions. They are not
// copied from implementation output.
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newEncounter } from '../src/workspace-state.js';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import {
  anchoredOnsetHours, buildScreenerParams, createInitialScreenerState, evaluateAll, evaluateTrialEligibility, enrollmentLabel,
  EXCLUSION_ITEMS, numericFact, onsetSummary, potentialMatches, registryCheckLabel, toConfirm, ONSET_PRESETS
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
const crit = (acronym, field, operator) => {
  const found = trial(acronym).eligibility.criteria.find(c => (field ? c.field === field : c.operator === 'or') && (!operator || c.operator === operator));
  if (!found) throw new Error(`No ${acronym} ${field} criterion`);
  return found;
};

describe('registry re-verification on 2026-10-21', () => {
  // Overall status of each full record read with get_trial_details on 2026-10-21.
  const status = { STEP: 'RECRUITING', SISTER: 'RECRUITING', PICASSO: 'RECRUITING', TESTED: 'RECRUITING', MINUTE: 'RECRUITING', 'FASTEST-2': 'RECRUITING', CLARITY: 'NOT_YET_RECRUITING', INTERCEPT: 'RECRUITING', ASPIRE: 'RECRUITING', SATURN: 'RECRUITING', 'CAPPRICORN-1': 'ACTIVE_NOT_RECRUITING', 'SCOUTS-3': 'RECRUITING', VERIFY: 'RECRUITING', 'MR-PICS': 'RECRUITING', 'TELE-REHAB-2': 'RECRUITING', CAPTIVA: 'ACTIVE_NOT_RECRUITING' };
  // Exact-day AREA[LastUpdatePostDate] queries on 2026-10-21: three records changed after 2026-10-17.
  const lastUpdate = { STEP: '2025-12-04', SISTER: '2026-10-19', PICASSO: '2026-10-02', TESTED: '2026-09-02', MINUTE: '2026-09-15', 'FASTEST-2': '2026-08-20', CLARITY: '2026-10-15', INTERCEPT: '2026-08-19', ASPIRE: '2026-05-08', SATURN: '2026-04-21', 'CAPPRICORN-1': '2026-10-20', 'SCOUTS-3': '2026-08-13', VERIFY: '2026-08-20', 'MR-PICS': '2026-04-13', 'TELE-REHAB-2': '2026-10-09', CAPTIVA: '2026-10-20' };

  it('records the re-read date, status and last update of all 16 profiles consistently', () => {
    expect(screenerTrials.map(t => t.acronym).sort()).toEqual(Object.keys(status).sort());
    for (const t of screenerTrials) {
      const m = t.externalMetadata;
      expect(m.verificationDate, t.acronym).toBe('2026-10-21');
      expect(m.registryStatus, t.acronym).toBe(status[t.acronym]);
      expect(m.registryLastUpdatePosted, t.acronym).toBe(lastUpdate[t.acronym]);
      expect(t.sourceGaps.filter(g => g.startsWith('Registry status rechecked 2026-10-21: ' + status[t.acronym] + '; last update posted ' + lastUpdate[t.acronym] + ' (recorded 2026-10-21).')), t.acronym).toHaveLength(1);
      expect(JSON.stringify(t), t.acronym).not.toMatch(/2026-10-17/);
    }
    expect(registryCheckLabel(screenerTrials.map(t => t.externalMetadata.verificationDate))).toBe('registry checked 2026-10-21');
  });

  it('keeps the recruiting statuses as registry statuses, never local availability', () => {
    for (const t of screenerTrials.filter(screenable)) expect(enrollmentLabel(t), t.acronym).toMatch(/\(registry\)$/);
    expect(enrollmentLabel(trial('CAPPRICORN-1'))).toBe('Not enrolling (active, not recruiting)');
    const html = renderToStaticMarkup(<TrialSourceContext trial={trial('SISTER')} now={new Date(2026, 9, 21, 9).getTime()} />);
    expect(html).toMatch(/Recorded registry check: <time [^>]*>2026-10-21<\/time> \(today\)/);
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
    // Inclusion 3-6: "Action Research Arm Test score 18-44"; "Box & Block Test score with affected arm is ≥1 block in 60 seconds";
    // exclusions 4, 5, 15-18: "Geriatric Depression Scale Score >10/15", "Montreal Cognitive Assessment score <22",
    // "lacks sufficient English or Spanish", "within 1.5-hr drive of the central study site", "Contraindication to MRI", "isolation precautions".
    const facts = { classification: 'ischemic', onsetVal: 120, onsetUnit: 'days', age: 60, preMrs: 1, ueWeakness: true, self_consent: true,
      exclusions: { exRecurrentStroke: false, exRecentStroke30d: false, exLifeExpectancy9m: false, exBotoxVns3m: false, exPregnancy: false } };
    const r = evaluate('TELE-REHAB-2', facts);
    expect(r.status).toBe('pending');
    expect(r.completeness).toBe('potential-match');
    const c = toConfirm(r).join(' ');
    for (const re of [/ARAT 18–44/, /Box & Block ≥ 1 block in 60 s/, /no surrogate consent/, /GDS > 10\/15/, /MoCA < 22/, /English or Spanish/, /1\.5-hour drive/, /MRI contraindication/, /isolation precautions/, /Negative pregnancy test required if of child-bearing potential/]) expect(c).toMatch(re);
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
    for (const re of [/pneumothorax, bullous emphysema/, /general anesthesia or conscious sedation within 48 h before the sleep study/, /CSF leak within 3 months/, /aspiration risk/]) expect(scouts).toMatch(re);
    expect(toConfirm(evaluate('VERIFY', { classification: 'ischemic' })).join(' ')).toMatch(/behavioral testing at 48–120 h, TMS at 72–168 h and MRI at 48–168 h/);
    const mrPics = toConfirm(evaluate('MR-PICS', { classification: 'ischemic' })).join(' ');
    for (const re of [/NIHSS item 11 = 2/, /no outside occupational, physical or speech therapy/, /GDS > 10/]) expect(mrPics).toMatch(re);
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
    ['STEP', 'onsetHours', '<=', { onsetVal: 24 }, 'met', '"within 24 hours"'], ['STEP', 'onsetHours', '<=', { onsetVal: 24.01 }, 'not met', ''],
    ['STEP', 'aspects', '>=', { aspects: 6 }, 'met', '"CT ASPECT score <6" excluded'], ['STEP', 'aspects', '>=', { aspects: 5 }, 'not met', ''],
    ['STEP', 'preMrs', '<=', { preMrs: 2 }, 'met', '"Pre-stroke modified Rankin Scale score 0-2"'], ['STEP', 'preMrs', '<=', { preMrs: 3 }, 'not met', ''],
    ['STEP', null, 'or', { vessel: 'ica_m1', nihss: 5 }, 'met', '"NIHSS 0-5" + intracranial ICA/M1'], ['STEP', null, 'or', { vessel: 'ica_m1', nihss: 0 }, 'met', ''],
    ['STEP', null, 'or', { vessel: 'ica_m1', nihss: 6 }, 'not met', ''], ['STEP', null, 'or', { vessel: 'm2_m3_nd', nihss: 8 }, 'met', '"NIHSS > =8" + non-dominant M2/M3'],
    ['STEP', null, 'or', { vessel: 'm2_m3_nd', nihss: 7 }, 'not met', ''], ['STEP', null, 'or', { vessel: 'ica_m1' }, 'unknown', ''],
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
    ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 90, onsetUnit: 'days' }, 'met', '"120±30 days prior to randomization"'], ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 150, onsetUnit: 'days' }, 'met', ''],
    ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 89, onsetUnit: 'days' }, 'before window', ''], ['TELE-REHAB-2', 'onsetDays', 'between', { onsetVal: 151, onsetUnit: 'days' }, 'not met', ''],
    ['TELE-REHAB-2', 'age', 'between', { age: 80 }, 'met', '"Age 18-80 years"'], ['TELE-REHAB-2', 'age', 'between', { age: 81 }, 'not met', ''],
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
    const facts = [{}, { age: 70, nihss: 8, preMrs: 0, aspects: 8, vessel: 'ica_m1', afibHistory: true, takingOac: false }, { age: '150', nihss: '3.5', gcs: 14, ichVolume: '1e3', ichLocation: 'bg', statin: true, anticoagulant: 'doac' }, { exclusions: { exPregnancy: false, exSecondaryIch: true, exTandem: false } }];
    for (const classification of ['ischemic', 'tia', 'ich']) for (const preset of [null, ...ONSET_PRESETS]) for (const extra of facts) {
      const timing = preset ? { onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours } : { onsetVal: 3, onsetUnit: 'hours' };
      const note = evaluateAll(S({ classification, ...timing, ...extra })).briefingNote;
      expect(note, `${classification} ${preset?.name}`).not.toMatch(/undefined|null|NaN|\[object|\{value\}/);
      expect(note.split('\n')[1]).toBe('Statuses are overall registry statuses at that check; local site activation is not confirmed.');
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
    expect(html).toContain('confirm it before treating the study as a potential match');
  });
});
