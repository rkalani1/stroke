import { describe, expect, it } from 'vitest';
import { screenerTrials } from '../screenerTrials.js';
import { buildScreenerParams, createInitialScreenerState, evaluateTrialEligibility, EXCLUSION_ITEMS } from '../screener-eval.js';

const trial = acronym => screenerTrials.find(item => item.acronym === acronym);
const result = (acronym, exclusions = {}, values = {}) => evaluateTrialEligibility(trial(acronym), buildScreenerParams({ ...createInitialScreenerState(), classification: 'ischemic', ...values, exclusions }));

describe('source-specific registry criteria', () => {
  it('does not reuse generic anticoagulation or aphasia flags for MR-PICS', () => {
    const old = result('MR-PICS', { exAnticoagulation: true, exSevereAphasiaCognitive: true });
    expect(old.exclusionReasons).toEqual([]);
    expect(old.pendingCriteria.join(' ')).toMatch(/Confirm whether therapeutic anticoagulation/);
    expect(old.pendingCriteria.join(' ')).toMatch(/Assess communication of pain/);
    expect(result('MR-PICS', { exTherapeuticAnticoagulation: true }).exclusionReasons.join(' ')).toMatch(/therapeutic anticoagulation/i);
    expect(result('MR-PICS', { exMrPicsCommunication: true }).exclusionReasons.join(' ')).toMatch(/communication|understanding/i);
    expect(result('MR-PICS', { exTherapeuticAnticoagulation: false, exMrPicsCommunication: false }).exclusionReasons).toEqual([]);
  });

  it('uses INTERCEPT-specific intracranial bleeding and untreated vascular disease review', () => {
    const old = result('INTERCEPT', { exCarotidStenosis50: true, exPriorIchHistory: true });
    expect(old.exclusionReasons).toEqual([]);
    expect(old.pendingCriteria.join(' ')).toMatch(/Confirm no history of intracranial hemorrhage/);
    expect(old.pendingCriteria.join(' ')).toMatch(/Review untreated ≥50% stenosis or high-risk plaque/);
    expect(result('INTERCEPT', { exIntracranialHemorrhage: true }).exclusionReasons.join(' ')).toMatch(/intracranial hemorrhage/i);
    expect(result('INTERCEPT', { exUntreatedStenosisPlaque: true }).exclusionReasons.join(' ')).toMatch(/untreated/i);
    expect(EXCLUSION_ITEMS.find(item => item.id === 'exUntreatedStenosisPlaque').label).toMatch(/high-risk plaque/);
  });

  it('ASPIRE includes atrial flutter without treating absent AF as absent flutter', () => {
    const unknown = result('ASPIRE', {}, { classification: 'ich', afibHistory: false });
    expect(unknown.exclusionReasons).toEqual([]);
    expect(unknown.pendingFields).toContain('afOrFlutterHistory');
    const flutter = result('ASPIRE', {}, { classification: 'ich', afibHistory: false, afOrFlutterHistory: true });
    expect(flutter.exclusionReasons).toEqual([]);
    expect(flutter.pendingFields).not.toContain('afOrFlutterHistory');
    expect(result('ASPIRE', {}, { classification: 'ich', afOrFlutterHistory: false }).exclusionReasons.join(' ')).toMatch(/atrial fibrillation or flutter/i);
  });

  it('requires SATURN-specific coronary and terminal-comorbidity review', () => {
    const old = result('SATURN', { exRecentMi3m: true, exLifeExpectancy2y: true }, { classification: 'ich' });
    expect(old.exclusionReasons).toEqual([]);
    expect(old.pendingCriteria.join(' ')).toMatch(/CAD-related MI or unstable angina/);
    expect(old.pendingCriteria.join(' ')).toMatch(/comorbid terminal conditions/);
    expect(result('SATURN', { exRecentCoronarySyndrome: true }, { classification: 'ich' }).exclusionReasons.join(' ')).toMatch(/unstable angina/);
    expect(result('SATURN', { exTerminalComorbidity2y: true }, { classification: 'ich' }).exclusionReasons.join(' ')).toMatch(/terminal conditions/);
  });

  it('keeps prior spontaneous hemorrhagic stroke broader than ICH in MR-PICS', () => {
    expect(result('MR-PICS', { exSpontaneousHemorrhagicStroke: true }).exclusionReasons.join(' ')).toMatch(/spontaneous hemorrhagic stroke/);
  });
});
