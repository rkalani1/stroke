// Trials wording fixes from the 2026-11-14 copy audit (copy-03, copy-04, copy-05). Synthetic screens only.
// copy-04 also puts the age-range matched labels (18–80, 22–75, 18–85) in en dashes, like the window labels.
import { describe, expect, it } from 'vitest';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { buildScreenerParams, createInitialScreenerState, evaluateTrialEligibility } from '../src/evidence/screener-eval.js';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const evaluate = (acronym, state) => evaluateTrialEligibility(trial(acronym), buildScreenerParams({ ...createInitialScreenerState(), ...state }));
const criteria = t => (t.eligibility?.inclusion || []).flatMap(c => [c, ...(c.branches || []).flatMap(b => [b, ...(b.criteria || [])])]);

describe('TESTED presentation is timed from LKW (copy-03)', () => {
  // NCT05911568 inclusion 3, as read for docs/evidence-ledger-2026-10-21.md: "Presenting to study hospital
  // within 24 hours of last known well time" (recorded here as "Acute ischemic stroke presenting to the study
  // hospital within 24 hours of last known well").
  const base = { classification: 'ischemic', onsetVal: 20, onsetUnit: 'hours', age: 70, vessel: 'ica_m1', preMrs: 3, nihss: 9, aspects: 6 };
  it('names LKW and the study hospital when met, not met and unknown', () => {
    expect(evaluate('TESTED', { ...base, presentedWithin24h: true }).matchedCriteria).toContain('Presented to the study hospital within 24 h of LKW');
    expect(evaluate('TESTED', { ...base, presentedWithin24h: false }).exclusionReasons).toEqual(['Did not present to the study hospital within 24 h of LKW']);
    const unknown = evaluate('TESTED', base).pendingCriteria;
    expect(unknown).toContain('Confirm presentation to the study hospital ≤ 24 h from LKW');
    expect(unknown.join(' ')).not.toMatch(/stroke onset/);
  });
});

describe('matched labels (copy-04)', () => {
  it('reads as sentences in sentence case', () => {
    const labels = screenerTrials.flatMap(t => criteria(t).map(c => c.matchedLabel)).filter(Boolean);
    for (const bad of [/days window/, /Ischemic Stroke/, /Basal Ganglia/, /AFib/, /is in \d/, /\d-\d/]) expect(labels.filter(label => bad.test(label)), String(bad)).toEqual([]);
  });
  it('states the value SATURN screened and the window it met', () => {
    const r = evaluate('SATURN', { classification: 'ich', onsetVal: 3, onsetUnit: 'days', age: 64, preMrs: 2, ichLocation: 'lobar', statin: true });
    expect(r.matchedCriteria).toEqual(expect.arrayContaining(['Age is 64 (meets ≥ 50)', 'Pre-stroke mRS is 2 (meets ≤ 3)', 'Onset within the 7-day window', 'Lobar ICH location confirmed']));
    expect(evaluate('ASPIRE', { classification: 'ich', onsetVal: 30, onsetUnit: 'days' }).matchedCriteria).toContain('Onset within the 14–180-day window');
    expect(evaluate('SCOUTS-3', { classification: 'ischemic', onsetVal: 10, onsetUnit: 'days' }).matchedCriteria).toContain('Onset within the 30-day window');
    expect(evaluate('TELE-REHAB-2', { classification: 'ischemic', onsetVal: 120, onsetUnit: 'days' }).matchedCriteria).toContain('Onset within the 90–270-day window');
    expect(evaluate('VERIFY', { classification: 'ischemic', onsetVal: 30, onsetUnit: 'hours' }).matchedCriteria).toContain('LKW-to-consent within the 24–96 h window');
    expect(evaluate('MINUTE', { classification: 'ich', ichLocation: 'bg' }).matchedCriteria).toContain('Basal ganglia location confirmed');
    expect(evaluate('INTERCEPT', { classification: 'ischemic', afibHistory: true }).matchedCriteria).toContain('Atrial fibrillation history confirmed');
    expect(evaluate('STEP', { classification: 'ischemic' }).matchedCriteria).toContain('Ischemic stroke classification selected');
  });
});

describe('bedside summaries and window labels (copy-05)', () => {
  it('use ≥/≤, en-dash ranges and a space before h', () => {
    for (const t of screenerTrials) {
      for (const text of [t.conciseBedsideSummary, t.enrollmentWindowText]) {
        for (const bad of [/>=|<=/, /\d-\d/, /\d\s+–\s*\d|\d\s*–\s+\d/, /\dh\b/]) expect(text, `${t.acronym}: ${bad}`).not.toMatch(bad);
      }
    }
    expect(trial('MINUTE').conciseBedsideSummary).toBe('Ultra-early SCUBA endoscopic evacuation for basal-ganglia hemorrhage ≥20 mL by ABC/2, randomized within 16 h of LKW.');
    expect(trial('ASPIRE').enrollmentWindowText).toBe('14–180 days');
    expect(trial('VERIFY').enrollmentWindowText).toBe('24–96 hours');
    expect(trial('TELE-REHAB-2').enrollmentWindowText).toBe('90–270 days');
  });
  it('leaves the verbatim registry criteria as recorded', () => {
    expect(trial('ASPIRE').exactInclusionCriteria).toContain('can be randomized within 14-180 days of stroke onset');
    expect(trial('TESTED').exactInclusionCriteria).toContain('mRS 3-4 for at least 3 months prior to stroke onset');
    expect(trial('VERIFY').exactInclusionCriteria.join(' ')).toContain('within 24-96 hours of stroke onset or last known well');
  });
});
