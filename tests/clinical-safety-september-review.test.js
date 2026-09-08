import { describe, expect, it } from 'vitest';
import {
  evaluateDAWN, evaluateDEFUSE3, recommendAcuteDAPT, evaluateCRAOTreatment,
  evaluateBostonCAA20, bpTargetPostStroke, lipidsTargetPostStroke, arcadiaAdvisory,
  evaluateENRICHEligibility, icadMedicalRegimen, dmvoEVTAdvisory, evaluateSWITCHEligibility,
  evaluateLargeCoreEVT, recommendLateWindowLytic, recommendPostEVTBP, evaluatePASCAL
} from '../src/calculators-extended.js';
import { interpretPupillometry } from '../src/simulators/PupillometrySimulator.jsx';

describe('September 2026 source and incomplete-input regressions', () => {
  const perfusion = { age: 65, nihss: 12, coreMl: 50, hypoperfusedMl: 150, timeFromLKWh: 10 };
  it('requires the full modeled DAWN and DEFUSE-3 input set', () => {
    expect(evaluateDAWN({ age: 65, nihss: 12, coreMl: 20 })).toBeNull();
    expect(evaluateDEFUSE3({ coreMl: 20, hypoperfusedMl: 90 })).toBeNull();
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: -1 })).toBeNull();
    expect(evaluateDEFUSE3({ ...perfusion, hypoperfusedMl: 49 })).toBeNull();
    expect(evaluateDAWN({ age: 17, nihss: 12, coreMl: 20, timeFromLKWh: 10 }).eligible).toBe(false);
  });
  it('uses strict DEFUSE-3 core and age boundaries, with total hypoperfused volume', () => {
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: 69.9, age: 90 }).eligible).toBe(true);
    expect(evaluateDEFUSE3({ ...perfusion, coreMl: 70 }).meetsCore).toBe(false);
    expect(evaluateDEFUSE3({ ...perfusion, age: 91 }).eligible).toBe(false);
    expect(evaluateDEFUSE3(perfusion).mismatchVolumeMl).toBe(100);
    expect(evaluateDEFUSE3(perfusion).reason).toMatch(/not complete EVT eligibility/);
  });
  it('does not give low-risk TIA a minor-stroke DAPT branch or assume onset time', () => {
    expect(recommendAcuteDAPT({ strokeType: 'tia', nihss: 0, abcd2: 2, timeFromOnsetH: 12 }).regimen).toBe('single-antiplatelet');
    expect(recommendAcuteDAPT({ strokeType: 'ischemic', nihss: 2 }).regimen).toBe('—');
    expect(recommendAcuteDAPT({ strokeType: 'ischemic', nihss: 2, timeFromOnsetH: -1 }).regimen).toBe('—');
  });
  it('requires atherosclerotic features for the INSPIRES extension', () => {
    const patient = { strokeType: 'ischemic', nihss: 4, timeFromOnsetH: 48 };
    expect(recommendAcuteDAPT(patient).regimen).toBe('single-antiplatelet');
    expect(recommendAcuteDAPT({ ...patient, atherosclerotic: true }).rationale).toMatch(/INSPIRES/);
    expect(recommendAcuteDAPT({ strokeType: 'ischemic', nihss: 2, timeFromOnsetH: 80 }).regimen).toBe('individualized-review');
  });
  const crao = { age: 65, onsetHours: 4.5, visualAcuity: '20/200', fundusHemorrhage: false, ivtContraindicated: false };
  it('preserves historical CRAO screen boundaries without making lysis actionable', () => {
    const result = evaluateCRAOTreatment(crao);
    expect(result.meetsHistoricalScreen).toBe(true);
    expect(result.eligible).toBe(false);
    expect(result.actionable).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/0\.25 mg\/kg|0\.9 mg\/kg/);
    expect(evaluateCRAOTreatment({ ...crao, onsetHours: 4.5001 }).meetsHistoricalScreen).toBe(false);
    expect(evaluateCRAOTreatment({ ...crao, age: undefined }).meetsHistoricalScreen).toBe(false);
    expect(evaluateCRAOTreatment({ ...crao, visualAcuity: '' }).meetsHistoricalScreen).toBe(false);
    expect(evaluateCRAOTreatment({ ...crao, ivtContraindicated: undefined }).meetsHistoricalScreen).toBe(false);
  });
  const caa = { age: 70, lobarHemorrhagicLesionCount: 2, deepHemorrhagicLesions: false, otherCause: false, qualifyingPresentation: true };
  it('requires Boston presentation and exclusion checks before categorizing MRI lesions', () => {
    expect(evaluateBostonCAA20(caa).category).toBe('Probable CAA');
    expect(evaluateBostonCAA20({ ...caa, age: undefined }).category).toBe('Incomplete');
    expect(evaluateBostonCAA20({ ...caa, deepHemorrhagicLesions: undefined }).category).toBe('Incomplete');
    expect(evaluateBostonCAA20({ ...caa, deepHemorrhagicLesions: true }).category).toBe('Not applicable');
    expect(evaluateBostonCAA20({ ...caa, qualifyingPresentation: false }).category).toBe('Not applicable');
  });
  it('recognizes elevated diastolic BP and does not interpret a missing BP component', () => {
    expect(bpTargetPostStroke({ currentSBP: 120, currentDBP: 95 }).actionable).toMatch(/Above outpatient target/);
    expect(bpTargetPostStroke({ currentSBP: 120 }).actionable).toBeNull();
    expect(bpTargetPostStroke({ strokeSubtype: 'lacunar' }).target).toMatch(/SPS3 tested SBP <130, not <120/);
  });
  it('does not infer very-high-risk ASCVD from stroke subtype alone', () => {
    expect(lipidsTargetPostStroke({ strokeSubtype: 'icad', currentLDL: 60 }).target).toMatch(/^<70/);
    expect(lipidsTargetPostStroke({ veryHighRiskASCVD: true, currentLDL: 60 }).atTarget).toBe(false);
  });
  it('does not substitute LAVI for an ARCADIA entry biomarker', () => {
    const result = arcadiaAdvisory({ laVolumeIndex: 40 });
    expect(result.leftAtrialEnlargement).toBe(true);
    expect(result.cardiopathyPresent).toBe(false);
    expect(arcadiaAdvisory({ ntProBNP: 251 }).cardiopathyPresent).toBe(true);
  });
  it('does not diagnose herniation from a pupillometry measurement', () => {
    expect(interpretPupillometry({}).status).toMatch(/INCOMPLETE/);
    expect(interpretPupillometry({ npi: -1, cv: 1, change: 20, diff: 0 }).status).toMatch(/INVALID/);
    expect(interpretPupillometry({ npi: 0, cv: 1, change: 20, diff: 0 }).summary).toMatch(/does not diagnose herniation/);
  });
  const enrich = { icHLocation: 'lobar', volumeMl: 50, age: 65, gcs: 12, nihss: 12, timeFromOnsetH: 12, premorbidMRS: 0 };
  it('requires modeled ENRICH inputs and rejects late or dependent profiles', () => {
    expect(evaluateENRICHEligibility(enrich).eligible).toBe(true);
    for (const field of ['age', 'gcs', 'nihss', 'timeFromOnsetH', 'premorbidMRS']) {
      expect(evaluateENRICHEligibility({ ...enrich, [field]: undefined }).eligible).toBe(false);
    }
    expect(evaluateENRICHEligibility({ ...enrich, timeFromOnsetH: 24.1 }).eligible).toBe(false);
    expect(evaluateENRICHEligibility({ ...enrich, premorbidMRS: 2 }).eligible).toBe(false);
    expect(evaluateENRICHEligibility({ ...enrich, nihss: 5 }).eligible).toBe(false);
    expect(evaluateENRICHEligibility({ ...enrich, volumeMl: 80, timeFromOnsetH: 24 }).eligible).toBe(true);
  });
  it('limits 90-day ICAD DAPT to recent severe symptomatic disease after bleeding assessment', () => {
    const icad = { stenosisPercent: 70, symptomatic: true, daysSinceEvent: 30, lowHemorrhagicRisk: true };
    expect(icadMedicalRegimen(icad).dapt90Appropriate).toBe(true);
    expect(icadMedicalRegimen({ ...icad, stenosisPercent: 69 }).dapt90Appropriate).toBe(false);
    expect(icadMedicalRegimen({ ...icad, daysSinceEvent: 31 }).dapt90Appropriate).toBe(false);
    expect(icadMedicalRegimen({ ...icad, symptomatic: undefined }).dapt90Appropriate).toBe(false);
    expect(icadMedicalRegimen({ ...icad, lowHemorrhagicRisk: undefined }).dapt90Appropriate).toBe(false);
    expect(icadMedicalRegimen({ ...icad, stenosisPercent: 110 }).applicable).toBe(false);
    expect(icadMedicalRegimen(icad).submaximalAngioplasty).toMatch(/positive randomized trial/);
  });
  it('preserves SWITCH primary-outcome uncertainty and checks the full modeled input set', () => {
    const patient = { icHLocation: 'basal ganglia', volumeMl: 50, gcs: 10, nihss: 15, timeFromOnsetH: 24, age: 60, premorbidMRS: 0, clotStable: true };
    expect(evaluateSWITCHEligibility(patient).eligible).toBe(true);
    expect(evaluateSWITCHEligibility(patient).counseling).toMatch(/44%.*58%.*0\.77.*0\.59–1\.01.*0\.057/);
    expect(evaluateSWITCHEligibility({ ...patient, volumeMl: 101 }).eligible).toBe(false);
    expect(evaluateSWITCHEligibility({ ...patient, nihss: 9 }).eligible).toBe(false);
    expect(evaluateSWITCHEligibility({ ...patient, clotStable: undefined }).status).toBe('incomplete');
    expect(evaluateSWITCHEligibility({ ...patient, timeFromOnsetH: 66 }).eligible).toBe(false);
  });
  it('does not approve EVT for an absent or unclassified vessel or prescribe unconditional lysis', () => {
    expect(dmvoEVTAdvisory({}).proceed).toBe('incomplete');
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M1' }).proceed).toBe('review-standard-EVT-criteria');
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M2-nondominant' }).proceed).toBe('no-routine-EVT');
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M3' }).nextSteps).not.toMatch(/0\.25 mg|Reassess at 1h/);
  });
  it('does not invent a universal large-core upper limit or accept an unknown vessel', () => {
    const patient = { age: 65, nihss: 16, coreMl: 110, aspects: 4, timeFromLKWh: 8, premorbidMRS: 0, lvoLocation: 'M1' };
    expect(evaluateLargeCoreEVT(patient).beyondTrialRange).toBe(false);
    expect(evaluateLargeCoreEVT(patient).rationale).toMatch(/not outside all trial evidence/);
    expect(evaluateLargeCoreEVT({ ...patient, lvoLocation: undefined }).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT({ ...patient, timeFromLKWh: -1 }).eligible).toBe(false);
    expect(evaluateLargeCoreEVT({ ...patient, age: 81, aspects: 1, coreMl: undefined, timeFromLKWh: 5 }).matchingTrials).not.toContain('LASTE');
  });
  it('requires both TRACE-III mismatch components and all modeled clinical inputs', () => {
    const patient = { age: 65, nihss: 12, timeFromLKWh: 8, evtAvailable: false, lvo: true, coreMl: 30, mismatchRatio: 2, mismatchVolumeMl: 30 };
    expect(recommendLateWindowLytic(patient).eligible).toBe(true);
    expect(recommendLateWindowLytic({ ...patient, mismatchRatio: 1.5 }).eligible).toBe(false);
    expect(recommendLateWindowLytic({ ...patient, mismatchVolumeMl: 10 }).eligible).toBe(false);
    expect(recommendLateWindowLytic({ ...patient, coreMl: undefined }).status).toBe('incomplete');
    expect(recommendLateWindowLytic({ ...patient, evtAvailable: undefined }).eligible).toBe(false);
  });
  it('separates active intensive BP lowering from an absolute lower SBP limit', () => {
    const r = recommendPostEVTBP({ recanalized: true, currentSBP: 125 });
    expect(r.lowerBound).toBeNull();
    expect(r.rationale).toMatch(/not a mandatory SBP floor/);
    expect(recommendPostEVTBP({}).class).toBe('Incomplete inputs');
    expect(recommendPostEVTBP({ evtPerformed: false, ivLyticGiven: false }).target).toContain('220/120');
  });
  it('requires PASCAL morphology assessment for a category that depends on its absence', () => {
    expect(evaluatePASCAL({ ropeScore: 5 }).category).toBe('Incomplete');
    expect(evaluatePASCAL({ ropeScore: 11, largeShunt: true })).toBeNull();
  });
});
