import { describe, expect, it } from 'vitest';
import { screenerTrials } from '../screenerTrials.js';
import {
  createInitialScreenerState,
  enrollmentLabel,
  evaluateAll,
  refinerItems,
  studiesUsing
} from '../screener-eval.js';

const profile = acronym => screenerTrials.find(trial => trial.acronym === acronym);
const candidate = (results, acronym) => results.pending.find(item => item.trial.acronym === acronym);

function minuteState(patch = {}) {
  return {
    ...createInitialScreenerState(),
    classification: 'ich', onsetVal: 8, onsetUnit: 'hours',
    age: 60, ichLocation: 'bg', ichVolume: 25, preMrs: 0,
    // The current scores deliberately differ from the presentation scores.
    nihss: 2, gcs: 15, minutePresentationNihss: 6, minutePresentationGcs: 7,
    exclusions: {
      exSecondaryIch: false, exMidbrain: false,
      exDoacLmwhAtOnset: false, exPregnancy: false
    },
    ...patch
  };
}

function clarityState() {
  return {
    ...createInitialScreenerState(),
    classification: 'tia', onsetVal: 5, onsetUnit: 'days',
    age: 60, abcd2: 6, antithromboticSoc: true, afibHistory: false,
    exclusions: { exBrainBleed2y: false, exCongestiveHeartFailure: false }
  };
}

function stepState() {
  return {
    ...createInitialScreenerState(),
    classification: 'ischemic', onsetVal: 8, onsetUnit: 'hours',
    age: 60, aspects: 8, preMrs: 0, vessel: 'm2_m3_nd', nihss: 8,
    exclusions: {
      exMultipleTerritories: false, exTandem: false, exSeizureAtOnset: false,
      exSuspectedIcad: false, exPregnancy: false, exIncarcerated: false
    }
  };
}

// Check the user-facing pending result and its exported screening summary,
// rather than only asserting that wording was stored in the source profile.
function expectConfirmations(results, acronym, patterns) {
  const item = candidate(results, acronym);
  expect(item, `${acronym} should remain a first-pass candidate`).toBeDefined();
  expect(item.status).toBe('pending');
  expect(item.completeness).toBe('potential-match');
  for (const pattern of patterns) {
    const line = item.pendingCriteria.find(text => pattern.test(text));
    expect(line, `Missing ${acronym} confirmation: ${pattern}`).toBeDefined();
    expect(results.briefingNote).toContain(line);
  }
  return item;
}

describe('November 2026 study criteria in screening results', () => {
  it('keeps the unmodeled MINUTE exclusions and enrollment safeguards in the result and copied summary', () => {
    const results = evaluateAll(minuteState());
    const item = expectConfirmations(results, 'MINUTE', [
      /measured.*ABC\/2/i,
      /actual randomization.*16 hours.*LKW.*2 hours/i,
      /surgery.*<120 minutes.*randomization/i,
      /informed consent.*patient or LAR.*lifesaving.*<7 days/i,
      /hemorrhagic diathesis.*coagulation factor deficiency/i,
      /intraventricular.*>50%.*EITHER lateral ventricle/i,
      /mental capacity.*willing.*follow-up/i,
      /another interventional drug or device trial/i,
      /pre-existing DNR\/DNI.*severe dementia/i
    ]);
    expect(results.eligible).toEqual([]);
    expect(item.pendingCriteria.join(' ')).toMatch(/platelet-count magnitude and units.*approved protocol/i);
    expect(item.pendingCriteria.join(' ')).not.toMatch(/platelets?\s*≥\s*100[\s,]?000/i);
  });

  it('does not substitute current MINUTE scores for unknown presentation scores', () => {
    const results = evaluateAll(minuteState({
      nihss: 20, gcs: 15,
      minutePresentationNihss: 'unselected', minutePresentationGcs: 'unselected'
    }));
    const item = candidate(results, 'MINUTE');
    expect(item.completeness).toBe('insufficient-information');
    expect(item.pendingCriteria.join(' ')).toMatch(/NIHSS.*at presentation/i);
    expect(item.pendingCriteria.join(' ')).toMatch(/GCS.*at presentation/i);
  });

  it.each([
    [{ minutePresentationNihss: 5, nihss: 20 }, /NIHSS < 6 at presentation/],
    [{ minutePresentationGcs: 6, gcs: 15 }, /GCS < 7 at presentation/]
  ])('uses the presentation threshold to exclude MINUTE even when the current score passes (%o)', (patch, reason) => {
    const results = evaluateAll(minuteState(patch));
    expect(candidate(results, 'MINUTE')).toBeUndefined();
    const excluded = results.excluded.find(item => item.trial.acronym === 'MINUTE');
    expect(excluded?.exclusionReasons.join(' ')).toMatch(reason);
  });

  it('carries CLARITY participation requirements into screening while preserving the separate registry status', () => {
    const results = evaluateAll(clarityState());
    const item = expectConfirmations(results, 'CLARITY', [
      /actual randomization.*180 days/i,
      /medically stable.*willing and able.*follow-up/i,
      /study drug by mail.*promptly/i,
      /signed and dated informed consent/i,
      /surrogate.*health care practitioner/i,
      /compulsory detention.*psychiatric/i
    ]);
    expect(item.trial.status).toBe('enrolling');
    expect(item.trial.externalMetadata.registryStatus).toBe('NOT_YET_RECRUITING');
    expect(enrollmentLabel(item.trial, item)).toBe('Recruiting (registry not yet updated)');
    expect(results.briefingNote).toContain('Recruiting (registry not yet updated)');
  });

  it('shows STEP imaging and residual exclusions without inventing the unresolved numerical rules', () => {
    const results = evaluateAll(stepState());
    const item = expectConfirmations(results, 'STEP', [
      /complete intracranial ICA or M1 occlusion/i,
      /Tmax >4 seconds.*vessel-dominance.*approved domain protocol/i,
      /core <50%.*diffusion-MRI threshold.*approved domain protocol/i,
      />120 minutes.*repeat CT\/MR.*significant NIHSS improvement/i,
      /contrast anaphylaxis.*unfavorable vascular access.*life expectancy <6 months/i
    ]);
    // These values remain source gaps, not a locally inferred cutoff.
    const checks = item.pendingCriteria.join(' ');
    expect(checks).not.toMatch(/ADC\s*[<≤]\s*620/i);
    expect(checks).not.toMatch(/M2[^;]*serv(?:e|es|ing)\s*[<≤]\s*50%/i);
  });

  it.each(['ischemic', 'ich'])('keeps DISCOVERY reference-only for %s patients, including within its baseline window', classification => {
    const state = {
      ...createInitialScreenerState(), classification,
      onsetVal: 7, onsetUnit: 'days', age: 60
    };
    const results = evaluateAll(state);
    expect(profile('DISCOVERY').referenceOnly).toBe(true);
    for (const bucket of ['eligible', 'pending', 'soon', 'excluded', 'closed', 'incomplete']) {
      expect(results[bucket].some(item => item.trial.acronym === 'DISCOVERY')).toBe(false);
    }
    expect(results.briefingNote).not.toContain('DISCOVERY');
    expect(refinerItems(state).some(item => item.trials.includes('DISCOVERY'))).toBe(false);
    expect(studiesUsing('classification', classification)).not.toContain('DISCOVERY');
  });
});
