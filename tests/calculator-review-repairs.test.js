import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { calculateCrCl, calculateCrClReviewed, calculateTNKDose, calculateTNKDoseReviewed, calculateICHVolumeReviewed, calculateEnoxaparinDose } from '../src/calculators.js';
import { calculateNASCET, computeLKWCountdown, ichCareBundleCheck, adjunctiveAntithromboticAdvisory, icadMedicalRegimen, arcadiaAdvisory, bpTargetPostStroke, lipidsTargetPostStroke, recommendPostEVTBP, evaluateLargeCoreEVT } from '../src/calculators-extended.js';

const invalidNumbers = [undefined, null, '', ' ', NaN, Infinity, -Infinity, '80kg', true, {}, '0x50'];

describe('reviewed clinical numbers and legacy boundary', () => {
  it.each(invalidNumbers)('rejects invalid CrCl weight %s', value => {
    expect(calculateCrClReviewed(70, value, 'M', 1)).toBeNull();
  });
  it('requires adult age, valid renal inputs and valid optional height', () => {
    for (const age of [-1, 0, 17, 121, Infinity]) expect(calculateCrClReviewed(age, 80, 'M', 1)).toBeNull();
    for (const cr of [0, -1, Infinity, '1mg']) expect(calculateCrClReviewed(70, 80, 'M', cr)).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1, Infinity)).toBeNull();
    expect(calculateCrClReviewed(70, 80, 'M', 1).value).toBe(77.8);
    expect(calculateCrClReviewed(70, 80, 'M', 10).label).not.toMatch(/consider dialysis/);
  });
  it('keeps legacy rounding and legacy CrCl behavior separate from the new permitted exports', () => {
    expect(calculateTNKDose(69).calculatedDose).toBe('17.5');
    expect(calculateTNKDoseReviewed(69).calculatedDose).toBe('17.25');
    expect(calculateCrCl(70, Infinity, 'M', 1).value).toBe(Infinity);
    expect(calculateCrClReviewed(70, Infinity, 'M', 1)).toBeNull();
  });
  it('does not infer dialysis when an estimate below 15 rounds to 15', () => {
    const borderline = calculateCrClReviewed(70, 80, 'M', 5.19);
    expect(borderline.value).toBe(15);
    expect(borderline.rawValue).toBeLessThan(15);
    expect(borderline.renalCategory).toBe('severe');
    expect(borderline.label).toContain('before rounding');
    expect(borderline.label).not.toMatch(/dialysis/i);
    const exact15 = calculateCrClReviewed(68, 75, 'M', 5);
    expect(exact15.value).toBe(15);
    expect(exact15.label).toBe('Severe (<30)');
    const below30 = calculateCrClReviewed(68, 75, 'M', 75 / 29.95);
    expect(below30.value).toBe(30);
    expect(below30.rawValue).toBeCloseTo(29.95, 10);
    expect(below30.label).toBe('Severe (<30)');
    expect(calculateEnoxaparinDose(75, below30.rawValue).isRenalAdjusted).toBe(true);
    expect(calculateCrClReviewed(68, 75, 'M', 2.5).label).toBe('Moderate (30-49)');
    expect(calculateCrCl(70, 80, 'M', 5.19).label).toBe('Severe (consider dialysis)');
  });
  it('rejects nonfinite ABC/2 and states the correct unit multiplier', () => {
    for (const dimension of invalidNumbers) expect(calculateICHVolumeReviewed({ lengthCm: dimension, widthCm: 3, slicesCm: 5 })).toBeNull();
    expect(calculateICHVolumeReviewed({ lengthCm: 4, widthCm: 3, slicesCm: 5 }).volume).toBe(30);
    const result = calculateICHVolumeReviewed({ lengthCm: 50, widthCm: 3, slicesCm: 5 });
    expect(result.unitWarning).toContain('one dimension inflates ABC/2 tenfold');
    expect(result.unitWarning).toContain('all three inflates it 1000-fold');
  });
});

describe('TNK dose authority and boundaries', () => {
  it.each([[59.9, 15], [60, 17.5], [69.9, 17.5], [70, 20], [79.9, 20], [80, 22.5], [89.9, 22.5], [90, 25], [150, 25]])('uses FDA weight bands at %s kg', (weight, dose) => {
    const result = calculateTNKDoseReviewed(weight, 'fda-label');
    expect(Number(result.calculatedDose)).toBe(dose);
    expect(parseFloat(result.volume)).toBe(dose / 5);
    expect(result.authorityLabel).toContain('weight bands');
    expect(result.sourceUrl).toContain('dailymed');
  });
  it('uses exact guideline mg/kg without silently rounding the dose', () => {
    const result = calculateTNKDoseReviewed(70.4);
    expect(Number(result.calculatedDose)).toBe(17.6);
    expect(parseFloat(result.volume)).toBe(3.52);
    expect(result.authorityLabel).toContain('0.25 mg/kg');
    expect(result.roundingNote).toContain('No additional syringe rounding');
    expect(calculateTNKDoseReviewed(100).calculatedDose).toBe('25');
    expect(calculateTNKDoseReviewed(150).calculatedDose).toBe('25');
  });
  it.each([...invalidNumbers, 0, -1, 351])('rejects invalid TNK weight %s', weight => expect(calculateTNKDoseReviewed(weight)).toBeNull());
  it('rejects an unrecognized dosing authority', () => expect(calculateTNKDoseReviewed(70, 'unknown')).toBeNull());
});

describe('enoxaparin indication and renal handling', () => {
  it.each([...invalidNumbers, 0, -1])('withholds dosing with CrCl %s', renal => {
    const result = calculateEnoxaparinDose(101, renal);
    expect(result.dose).toBeNull();
    expect(result.dailyDose).toBeNull();
    expect(result.frequency).toBeNull();
    expect(result.isRenalAdjusted).toBeNull();
    expect(result.note).toContain('confirm renal function');
  });
  it('does not double prophylaxis at 101 kg', () => {
    for (const weight of [100, 101, 150]) {
      const result = calculateEnoxaparinDose(weight, 90);
      expect(result.prophylaxisNote).toContain('40 mg SC daily');
      expect(result.prophylaxisNote).toContain('no consensus');
    }
  });
  it('separates the renal branch at 30 mL/min and treatment from prophylaxis', () => {
    const low = calculateEnoxaparinDose(80, 29.9), normal = calculateEnoxaparinDose(80, 30);
    expect(low.prophylaxisNote).toContain('30 mg SC daily');
    expect(low.frequency).toBe('daily');
    expect(low.dailyDose).toBe(80);
    expect(normal.prophylaxisNote).toContain('40 mg SC daily');
    expect(normal.frequency).toBe('BID');
    expect(normal.dailyTreatmentNote).toContain('inpatient acute DVT');
  });
});

describe('measurement and time validation', () => {
  it.each([[-1, 4], [5, 4], [1, 0], [Infinity, 4], [1, Infinity], ['1mm', 4]])('rejects NASCET %s/%s', (s, d) => expect(calculateNASCET({ stenosisDiameterMm: s, distalICADiameterMm: d })).toBeNull());
  it('does not apply patent-stenosis CEA benefit to occlusion or near-occlusion', () => {
    const occlusion = calculateNASCET({ stenosisDiameterMm: 0, distalICADiameterMm: 4 });
    expect(occlusion.percent).toBe(100);
    expect(occlusion.tier).toBe('occlusion');
    expect(occlusion.revasc).toContain('do not apply');
    expect(calculateNASCET({ stenosisDiameterMm: 1, distalICADiameterMm: 2, nearOcclusion: true }).percent).toBeNull();
    expect(calculateNASCET({ stenosisDiameterMm: 1, distalICADiameterMm: 4 }).revasc).toContain('Confirm symptom status');
  });
  it('rejects future LKW and invalid current time', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(computeLKWCountdown('2026-09-30T12:00:01Z', now)).toBeNull();
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', Infinity)).toBeNull();
    expect(computeLKWCountdown('invalid', now)).toBeNull();
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', now).toLytic).toBe('4:30:00');
    expect(computeLKWCountdown('2026-09-30T07:30:00Z', now).toLyticClosed).toBe(true);
  });
  it.each([true, false, 1, [1], {}, new Date('2026-09-30'), '1', '2026-09-30', '09/30/2026 01:00', '2026-02-31T00:00Z', '2026-02-29T00:00Z', '2026-04-31T00:00Z', '2026-09-30T24:00Z', '2026-09-30T00:60Z', '2026-09-30T00:00:60Z', '2026-09-30T00:00+24:00', '2026-09-30T00:00+00:60'])('rejects malformed or impossible LKW %s', value => {
    expect(computeLKWCountdown(value, Date.parse('2026-10-01T00:00Z'))).toBeNull();
  });
  it('accepts valid ISO offsets, leap days, and datetime-local with optional precision', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    expect(computeLKWCountdown('2026-09-30T13:00:00+02:00', now).elapsedMinutes).toBe(60);
    expect(computeLKWCountdown('2024-02-29T12:00:00.125Z', Date.parse('2024-02-29T12:01:00.125Z')).elapsedMinutes).toBe(1);
    for (const local of ['2026-09-30T10:00', '2026-09-30T10:00:00', '2026-09-30T10:00:00.125']) {
      expect(computeLKWCountdown(local, new Date(local).getTime() + 60000).elapsedMinutes).toBe(1);
    }
    expect(computeLKWCountdown('2026-09-30T12:00:00Z', 1e308)).toBeNull();
  });
});

describe('INTERACT3 measurements are not timed compliance', () => {
  it('does not prescribe from missing or invalid values', () => {
    for (const value of [...invalidNumbers, -1, 0]) {
      const result = ichCareBundleCheck({ sbpAt1h: value, glucose: value, temp: value, inr: value });
      expect(result.completed).toBe(0);
      expect(result.items.every(item => item.met === null)).toBe(true);
      expect(result.items.every(item => item.action === null)).toBe(true);
      expect(result.fullyCompliant).toBeNull();
    }
  });
  it('does not let reversal administration override measured INR or missing INR', () => {
    for (const inr of [4, undefined]) {
      const result = ichCareBundleCheck({ inr, isOnWarfarin: true, anticoagReversed: true });
      expect(result.items.at(-1).met).toBe(inr === 4 ? false : null);
    }
  });
  it('does not infer diabetes or warfarin status', () => {
    const result = ichCareBundleCheck({ glucose: 7, glucoseUnit: 'mmol/L', inr: 1.1 });
    expect(result.items[1].met).toBeNull();
    expect(result.items.at(-1).met).toBeNull();
  });
  it('distinguishes current targets from unmeasured timing and longitudinal control', () => {
    const result = ichCareBundleCheck({ sbpAt1h: 135, glucose: 7, glucoseUnit: 'mmol/L', isDiabetic: false, temp: 37, inr: 1.2, isOnWarfarin: true });
    expect(result.targetsMet).toBe(true);
    expect(result.completed).toBe(4);
    expect(result.fullyCompliant).toBeNull();
    expect(result.timingAssessed).toBe(false);
    expect(result.rationale).toContain('not establish INTERACT3 bundle compliance');
  });
  it('recognizes hypoglycemia in mg/dL and does not intensify hypotension', () => {
    const result = ichCareBundleCheck({ sbpAt1h: 90, glucose: 28, glucoseUnit: 'mg/dL', isDiabetic: false });
    expect(result.items[0].met).toBeNull();
    expect(result.items[0].action).toContain('do not intensify');
    expect(result.items[1].action).toContain('hypoglycemia');
  });
});

describe('trial and guideline applicability', () => {
  it('preserves concomitant antithrombotic indications and uncertainty about tirofiban', () => {
    expect(adjunctiveAntithromboticAdvisory({ ivLyticGiven: true }).drugs).toEqual(['argatroban', 'eptifibatide']);
    expect(adjunctiveAntithromboticAdvisory({ ivLyticGiven: true, substantialConcomitantIndication: true }).recommend).toContain('Individualized');
    expect(adjunctiveAntithromboticAdvisory({ lyticIneligible: true }).recommend).toContain('uncertain');
    expect(adjunctiveAntithromboticAdvisory({}).recommend).toBe('Complete assessment');
  });
  it('does not establish a stenting exception from medical failure', () => {
    expect(icadMedicalRegimen({ stenosisPercent: 75, recurrentEvent: true }).avoidStenting).toContain('usefulness remains unknown');
    expect(icadMedicalRegimen({ stenosisPercent: '75%', symptomatic: true }).applicable).toBe(false);
  });
  it('limits the ARCADIA result to cryptogenic stroke without AF or another indication', () => {
    const marker = { ntProBNP: 500 };
    expect(arcadiaAdvisory(marker).recommendDOAC).toBeNull();
    expect(arcadiaAdvisory({ ...marker, hasAF: true }).applicable).toBe(false);
    expect(arcadiaAdvisory({ ...marker, otherAnticoagulationIndication: true }).recommendDOAC).toBeNull();
    expect(arcadiaAdvisory({ ...marker, cryptogenicStroke: true, hasAF: false, otherAnticoagulationIndication: false }).recommendDOAC).toBe(false);
    expect(arcadiaAdvisory({ laVolumeIndex: 40 }).cardiopathyPresent).toBeNull();
    expect(arcadiaAdvisory({ ptfv1: 100, ntProBNP: 100, laDiameterCmM2: 2 }).cardiopathyPresent).toBe(false);
  });
  it('does not invent a frailty target from age', () => {
    const result = bpTargetPostStroke({ age: 85, frail: true });
    expect(result.target).toContain('130/80');
    expect(result.cautions.join(' ')).not.toContain('<140/80');
    expect(result.cautions.join(' ')).toContain('no universal alternative');
    expect(bpTargetPostStroke({ currentSBP: '140mmHg', currentDBP: 80 }).actionable).toBeNull();
  });
  it('uses generic outpatient context for unknown BP subtype without coercion or a crash', () => {
    for (const strokeSubtype of [true, 1, {}, ['lacunar'], null]) {
      const result = bpTargetPostStroke({ strokeSubtype });
      expect(result.target).toContain('neurologically stable outpatient');
      expect(result.firstLine.join(' ')).toContain('no significant difference');
    }
    expect(bpTargetPostStroke({ strokeSubtype: 'Lacunar' }).target).toContain('SPS3');
  });
  it('models standard and optional ASCVD LDL goals without a mandatory ezetimibe-first sequence', () => {
    expect(lipidsTargetPostStroke({ currentLDL: 60 }).atTarget).toBeNull();
    expect(lipidsTargetPostStroke({ hasASCVD: true, currentLDL: 60 }).atTarget).toBe(true);
    expect(lipidsTargetPostStroke({ hasASCVD: true, lowerGoalSelected: true, currentLDL: 60 }).atTarget).toBe(false);
    expect(lipidsTargetPostStroke({ veryHighRiskASCVD: true, currentLDL: 60 }).targetValue).toBe(55);
    expect(lipidsTargetPostStroke({ hasASCVD: false, veryHighRiskASCVD: true }).targetValue).toBeNull();
    expect(lipidsTargetPostStroke({ hasASCVD: true, currentLDL: -1 }).atTarget).toBeNull();
    expect(lipidsTargetPostStroke({ hasASCVD: true }).tier[1].agent).toContain('ezetimibe-first is not mandatory');
  });
});

describe('EVT BP phase, reperfusion and no mandatory floor', () => {
  it('uses 180/105 after failed as well as successful EVT in the first 24h', () => {
    const result = recommendPostEVTBP({ evtPerformed: true, recanalized: false, hoursSinceEVT: 2 });
    expect(result.upperBound).toBe(180);
    expect(result.diastolicUpperBound).toBe(105);
    expect(result.lowerBound).toBeNull();
  });
  it('does not assign the early ceiling without timing or after 24h', () => {
    expect(recommendPostEVTBP({ evtPerformed: true }).upperBound).toBeNull();
    expect(recommendPostEVTBP({ evtPerformed: true, hoursSinceEVT: 25 }).upperBound).toBeNull();
    expect(recommendPostEVTBP({ evtPerformed: false, recanalized: true }).upperBound).toBeNull();
  });
  it('keeps the intensive-lowering harm recommendation within its actual population and 72h', () => {
    const input = { evtPerformed: true, recanalized: true, hoursSinceEVT: 48, circulation: 'anterior', otherBPIndication: false, currentSBP: 125, currentDBP: 70 };
    const result = recommendPostEVTBP(input);
    expect(result.intensiveLoweringHarmApplies).toBe(true);
    expect(result.lowerBound).toBeNull();
    expect(result.rationale).toContain('not a mandatory SBP floor');
    expect(recommendPostEVTBP({ ...input, circulation: 'posterior' }).intensiveLoweringHarmApplies).toBeNull();
    expect(recommendPostEVTBP({ ...input, hoursSinceEVT: 73 }).intensiveLoweringHarmApplies).toBeNull();
    expect(recommendPostEVTBP({ ...input, otherBPIndication: true }).intensiveLoweringHarmApplies).toBeNull();
  });
});

describe("locked legacy export preservation", () => {
  it("calculateDOACStart body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateDOACStart = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("3f9b338728c729088a79aa1e39bf5d43133ae7e00ac342b80443a82989d6136c");
  });
  it("calculateTNKDose body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateTNKDose = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("72504241fb68a2a0b7d1198590f8ec9f762fab828c475caf7c47a1d75454da95");
  });
  it("calculateCrCl body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateCrCl = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("a21758efbfc312795158c2f7caf51786cebd071e089fe6550ccee624586a670b");
  });
  it("calculateICHVolume body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateICHVolume = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("13337a2062cc0b6c715b197ba57c7d576fb682abaf2d8046fb6d6e3d96db79e7");
  });
  it("calculateAndexanetDose body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateAndexanetDose = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("f13be5a5916c7975e09c5fd54b146ba2e635874d2a7c1fc65d467b402177baf0");
  });
  it("calculatePCCDose body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculatePCCDose = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("778480e559710857758b891297b7918f27a65b78ddcb8f8c8b1c349bf06addb7");
  });
  it("calculateAlteplaseDose body remains byte-identical to the pre-implementation snapshot", () => {
    const source = readFileSync(new URL('../src/calculators.js', import.meta.url), 'utf8');
    const body = source.match(/export const calculateAlteplaseDose = [\s\S]*?^};/m)[0];
    expect(createHash('sha256').update(body).digest('hex')).toBe("166cd6df8237f65eb8fa551e597953bd088ea500412cdcb91b677232cd8b8f8a");
  });
});


describe('large-core trial version and subset boundaries', () => {
  const input = { age: 86, nihss: 6, aspects: 4, timeFromLKWh: 5, premorbidMRS: 0, lvoLocation: 'M1' };
  it('does not apply SELECT2 age85 cap to RESCUE-Japan LIMIT', () => {
    for (const age of [85, 86]) expect(evaluateLargeCoreEVT({ ...input, age }).matchingTrials).toContain('RESCUE-Japan LIMIT');
    expect(evaluateLargeCoreEVT(input).matchingTrials).not.toContain('SELECT-2');
  });
  it('preserves final-publication NIHSS6 and discloses the LASTE modeled subset', () => {
    for (const nihss of [6, 7]) {
      const result = evaluateLargeCoreEVT({ ...input, age: 65, aspects: 1, nihss });
      expect(result.matchingTrials).toContain('LASTE');
      expect(result.modeledSubsets.LASTE).toContain('Only the age <80');
      expect(result.nihssSourceNote).toContain('final LASTE/TESLA publications');
      expect(result.rationale).toContain('does not establish complete trial or EVT eligibility');
    }
  });
  it('rejects partial numeric strings and nonnumeric input in every domain', () => {
    const valid = { ...input, age: 65, coreMl: 80 };
    for (const key of ['age', 'nihss', 'aspects', 'coreMl', 'timeFromLKWh', 'premorbidMRS']) {
      for (const value of ['65abc', '5 days', [10], true, {}, Infinity, '1e999']) {
        expect(evaluateLargeCoreEVT({ ...valid, [key]: value }).status, `${key}: ${String(value)}`).toBe('incomplete');
      }
    }
    for (const lvoLocation of [1, true, ['M1'], {}, null]) expect(evaluateLargeCoreEVT({ ...valid, lvoLocation }).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT(null).status).toBe('incomplete');
    expect(evaluateLargeCoreEVT({ ...valid, aspects: undefined }).status).toBe('partial-screen-met');
    expect(evaluateLargeCoreEVT({ ...valid, coreMl: undefined }).status).toBe('partial-screen-met');
    expect(evaluateLargeCoreEVT({ ...valid, age: '65', nihss: '6', timeFromLKWh: '5' }).status).toBe('partial-screen-met');
  });
});
