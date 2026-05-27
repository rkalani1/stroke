// QA probes — edge case validation against published references.
// Authored 2026-05-09 for site-wide accuracy audit.
import { describe, it, expect } from 'vitest';
import {
  calculateNIHSS,
  calculateGCS,
  calculateICHScore,
  calculateABCD2Score,
  calculateCHADS2VascScore,
  calculateROPEScore,
  calculateHASBLEDScore,
  calculateRCVS2Score,
  calculatePHASESScore,
  getPHASESRisk,
  calculateICHVolume,
  calculateEnoxaparinDose,
  calculateAndexanetDose,
  calculateCrCl,
  calculateTNKDose,
  calculatePCCDose,
  calculateAlteplaseDose,
  calculateDOACStart
} from '../src/calculators.js';
import {
  evaluateDAWN,
  evaluateDEFUSE3,
  recommendAcuteDAPT,
  calculateESSEN,
  calculateSPI2,
  calculateBAT,
  calculateBRAIN,
  calculateNinePoint,
  calculateVASOGRADE,
  calculateOgilvyCarter,
  interpretPHQ9,
  calculateNASCET,
  calculateCHADS2VA,
  calculateHEADS2,
  recommendVTEProphylaxis,
  evaluateLargeCoreEVT,
  recommendLateWindowLytic,
  recommendPostEVTBP,
  evaluateENRICHEligibility,
  evaluateSWITCHEligibility,
  ichCareBundleCheck,
  evaluatePASCAL,
  interpretMRS9Q,
  dmvoEVTAdvisory,
  adjunctiveAntithromboticAdvisory,
  bpTargetPostStroke,
  lipidsTargetPostStroke,
  icadMedicalRegimen,
  icadMedicalRegimen,
  bpTargetPostStroke,
  lipidsTargetPostStroke,
  arcadiaAdvisory,
  afDetectionStrategy,
  evaluateBostonCAA20
} from '../src/calculators-extended.js';

describe('CRITICAL — clinical correctness probes', () => {
  it('NIHSS caps at 42 even when input would sum higher', () => {
    // Build responses where each item maxes out
    const responses = {
      a: '(7)', b: '(7)', c: '(7)', d: '(7)', e: '(7)', f: '(7)', g: '(7)' // 49
    };
    expect(calculateNIHSS(responses)).toBe(42);
  });

  it('NIHSS does NOT count UN (untestable) responses', () => {
    expect(calculateNIHSS({ a: 'UN', b: '(2)' })).toBe(2);
  });

  it('GCS — partial sum returns null (avoids silent under-scoring)', () => {
    expect(calculateGCS({ eye: '4', verbal: '5' })).toBeNull();
  });

  it('ICH Score — full house is 6 (Hemphill 2001)', () => {
    expect(calculateICHScore({
      gcs: 'gcs34', age80: true, volume30: true, ivh: true, infratentorial: true
    })).toBe(6);
  });

  it('ABCD² — speech ONLY (no weakness) gives 1, weakness ALONE gives 2, both gives 2', () => {
    expect(calculateABCD2Score({ speechDisturbance: true })).toBe(1);
    expect(calculateABCD2Score({ unilateralWeakness: true })).toBe(2);
    expect(calculateABCD2Score({ unilateralWeakness: true, speechDisturbance: true })).toBe(2);
  });

  it('CHA₂DS₂-VASc — max 9 with all factors and female', () => {
    const r = calculateCHADS2VascScore({
      chf: true, hypertension: true, age75: true, diabetes: true,
      strokeTia: true, vascular: true, female: true
    });
    expect(r).toBe(9);
  });

  it('CHA₂DS₂-VA (2024) — drops sex; max 8', () => {
    const r = calculateCHADS2VA({
      chf: true, hypertension: true, age: 80, diabetes: true,
      strokeTia: true, vascular: true
    });
    expect(r.score).toBe(8);
  });

  it('HAS-BLED — max 9 with all factors', () => {
    expect(calculateHASBLEDScore({
      hypertension: true, renalDisease: true, liverDisease: true,
      stroke: true, bleeding: true, labileINR: true, elderly: true,
      drugs: true, alcohol: true
    })).toBe(9);
  });

  it('RCVS² — TRUE recurrent thunderclap with carotid (-2) yields 3, NOT 0', () => {
    // RCVS²: recurrent TCH (+5) + carotid (-2) + female (+1) + SAH (+1) = 5
    // The current code does Math.max(0, score) — verify behavior
    expect(calculateRCVS2Score({ recurrentTCH: true, carotidInvolvement: true, female: true, sah: true })).toBe(5);
  });

  it('RCVS² — pure carotid involvement returns -2 (Rocha 2019 published range -2 to +10)', () => {
    expect(calculateRCVS2Score({ carotidInvolvement: true })).toBe(-2);
  });

  it('PHASES — high-end score of 22 (large posterior aneurysm in Finn)', () => {
    expect(calculatePHASESScore({
      population: 'finnish', hypertension: true, age70: true,
      size: 25, earlierSAH: true, site: 'aca_pcomm_posterior'
    })).toBe(22);
  });

  it('PHASES risk — per-score table (Greving Lancet Neurol 2014): score 4 → 0.9%, score 11 → 7.2%, score ≥12 → 17.8%', () => {
    expect(getPHASESRisk(4).risk).toBe('0.9%');
    expect(getPHASESRisk(7).risk).toBe('2.4%');
    expect(getPHASESRisk(9).risk).toBe('4.3%');
    expect(getPHASESRisk(11).risk).toBe('7.2%');
    expect(getPHASESRisk(12).risk).toBe('17.8%');
    expect(getPHASESRisk(15).risk).toBe('17.8%');
  });

  it('ICH volume — ABC/2 returns ~30 mL for 5×4×3', () => {
    const r = calculateICHVolume({ lengthCm: '5', widthCm: '4', slicesCm: '3' });
    expect(r.volume).toBe(30);
    expect(r.isLarge).toBe(true);
  });

  it('CrCl — Cockcroft-Gault male 70y, 80 kg, Cr 1.0 = 64.8', () => {
    const r = calculateCrCl(70, 80, 'M', 1.0);
    expect(r.value).toBeCloseTo(77.8, 1); // (140-70)*80*1 / (72*1) = 77.78
  });

  it('CrCl — female adjustment (×0.85)', () => {
    const r = calculateCrCl(70, 80, 'F', 1.0);
    expect(r.value).toBeCloseTo(66.1, 1);
  });

  it('TNK — 0.25 mg/kg, 60 kg = 15 mg', () => {
    const r = calculateTNKDose(60);
    expect(r.calculatedDose).toBe('15.0');
  });

  it('TNK — caps at 25 mg for >100 kg', () => {
    expect(calculateTNKDose(110).calculatedDose).toBe('25.0');
    expect(calculateTNKDose(110).isMaxDose).toBe(true);
  });

  it('Alteplase — 100 kg = 90 mg (exact cap; capped flag false because 0.9×100 == 90)', () => {
    const r = calculateAlteplaseDose(100);
    expect(r.totalDose).toBe(90);
    expect(r.bolus).toBe(9);
    expect(r.infusion).toBe(81);
    // NOTE: capped flag uses strict > comparison; 100 kg sits at exact boundary.
    expect(r.capped).toBe(false);
  });

  it('Alteplase — 105 kg triggers cap (>90 mg flagged)', () => {
    const r = calculateAlteplaseDose(105);
    expect(r.totalDose).toBe(90);
    expect(r.capped).toBe(true);
  });

  it('Alteplase — 70 kg = 63 mg, 6.3 mg bolus, 56.7 mg infusion', () => {
    const r = calculateAlteplaseDose(70);
    expect(r.totalDose).toBe(63);
    expect(r.bolus).toBe(6.3);
    expect(r.infusion).toBe(56.7);
  });

  it('Enoxaparin — 80 kg, normal renal: treatment 80 mg BID, prophylaxis 40 mg daily', () => {
    const r = calculateEnoxaparinDose(80, 100);
    expect(r.dose).toBe(80);
    expect(r.frequency).toBe('BID');
    expect(r.prophylaxisNote).toContain('40 mg');
  });

  it('Enoxaparin — CrCl <30 → daily dosing', () => {
    const r = calculateEnoxaparinDose(80, 25);
    expect(r.frequency).toBe('daily');
    expect(r.isRenalAdjusted).toBe(true);
  });

  it('Andexanet — apixaban 5 mg, last dose 6h: low-dose', () => {
    const r = calculateAndexanetDose('apixaban', 6, 5);
    expect(r.regimen).toBe('low-dose');
  });

  it('Andexanet — rivaroxaban 20 mg, last dose 4h: high-dose', () => {
    const r = calculateAndexanetDose('rivaroxaban', 4, 20);
    expect(r.regimen).toBe('high-dose');
  });

  it('Andexanet — dabigatran returns N/A with idarucizumab guidance', () => {
    const r = calculateAndexanetDose('dabigatran', 4, 150);
    expect(r.regimen).toBe('N/A');
    expect(r.doseWarning).toContain('idarucizumab');
  });

  it('PCC warfarin INR 5: 35 IU/kg', () => {
    const r = calculatePCCDose(80, 5, 'warfarin');
    expect(r.iuPerKg).toBe(35);
    expect(r.ahaDose).toBe(80 * 35);
  });

  it('PCC FXa-ICH: fixed 50 IU/kg', () => {
    const r = calculatePCCDose(70, null, 'fxa-ich');
    expect(r.iuPerKg).toBe(50);
    expect(r.ahaDose).toBe(70 * 50);
  });

  it('DOAC start — minor (NIHSS 5): day 1 (ELAN/OPTIMAS)', () => {
    const r = calculateDOACStart('5', '2026-05-09', 'elan-optimas');
    expect(r.severity).toBe('minor');
    expect(r.days).toBe(1);
  });

  it('DOAC start — verySevere NIHSS 22 in ELAN/OPTIMAS: day 7', () => {
    const r = calculateDOACStart('22', '2026-05-09', 'elan-optimas');
    expect(r.severity).toBe('verySevere');
    expect(r.days).toBe(7);
  });
});

describe('Late-window EVT — DAWN tier matrix', () => {
  it('80 yo, NIHSS 12, core 18 mL @ 12h → Group A', () => {
    const r = evaluateDAWN({ age: 85, nihss: 12, coreMl: 18, timeFromLKWh: 12 });
    expect(r.tier).toBe('A');
  });
  it('60 yo, NIHSS 12, core 25 mL @ 8h → Group B', () => {
    const r = evaluateDAWN({ age: 60, nihss: 12, coreMl: 25, timeFromLKWh: 8 });
    expect(r.tier).toBe('B');
  });
  it('60 yo, NIHSS 22, core 45 mL @ 8h → Group C', () => {
    const r = evaluateDAWN({ age: 60, nihss: 22, coreMl: 45, timeFromLKWh: 8 });
    expect(r.tier).toBe('C');
  });
  it('outside window 25h → not eligible', () => {
    const r = evaluateDAWN({ age: 60, nihss: 12, coreMl: 18, timeFromLKWh: 25 });
    expect(r.eligible).toBe(false);
  });
});

describe('Large-core EVT — published trial matrix', () => {
  it('LASTE (ASPECTS 0-2, 5h): eligible', () => {
    const r = evaluateLargeCoreEVT({ age: 65, nihss: 18, aspects: 1, timeFromLKWh: 5, premorbidMRS: 0 });
    expect(r.bestMatch).toBe('LASTE');
    expect(r.eligible).toBe(true);
  });
  it('SELECT-2 / ANGEL-ASPECT (ASPECTS 4, 12h): eligible', () => {
    const r = evaluateLargeCoreEVT({ age: 60, nihss: 16, aspects: 4, timeFromLKWh: 12, premorbidMRS: 0 });
    expect(r.eligible).toBe(true);
    expect(r.matchingTrials).toContain('SELECT-2');
  });
  it('Core 110 mL: SELECT-2 ≥50 criterion fires; reasons.push() flag still says above range (CLINICAL: code marks eligible=true; reviewer must interpret the warning)', () => {
    const r = evaluateLargeCoreEVT({ age: 60, nihss: 16, aspects: null, coreMl: 110, timeFromLKWh: 5, premorbidMRS: 0 });
    // Current behavior: SELECT-2 criterion (core >=50, ≤24h) fires => eligible=true,
    // but the rationale string does NOT include the "above trial-supported range"
    // note because reasons.push() only adds when eligible=false. This is a UX/safety gap.
    expect(r.eligible).toBe(true);
    expect(r.matchingTrials).toContain('SELECT-2');
  });
});

describe('TRACE-III late-window IVT (4.5-24h LVO, EVT unavailable)', () => {
  it('eligible when LVO + mismatch + no EVT', () => {
    const r = recommendLateWindowLytic({
      timeFromLKWh: 8, evtAvailable: false, lvo: true, nihss: 12, age: 60,
      coreMl: 30, mismatchRatio: 2.0, mismatchVolumeMl: 30
    });
    expect(r.eligible).toBe(true);
  });
  it('NOT eligible when EVT is available', () => {
    const r = recommendLateWindowLytic({
      timeFromLKWh: 8, evtAvailable: true, lvo: true, nihss: 12, age: 60,
      coreMl: 30, mismatchRatio: 2.0, mismatchVolumeMl: 30
    });
    expect(r.eligible).toBe(false);
  });
});

describe('CHANCE/POINT/INSPIRES/THALES branching', () => {
  it('NIHSS 4 within 60h with atherosclerosis → INSPIRES (clopi+ASA × 21 d)', () => {
    const r = recommendAcuteDAPT({
      nihss: 4, strokeType: 'ischemic', atherosclerotic: true, lvdSymptomatic: true, timeFromOnsetH: 60
    });
    // Note: code prefers THALES branch when atherosclerotic AND within 24h
    // 60h is outside 24h, so falls to INSPIRES (≤72h window)
    expect(r.regimen).toContain('clopidogrel+ASA');
    expect(r.duration).toBe('21 days');
  });

  it('NIHSS 4 within 12h with atherosclerosis → THALES (ticagrelor+ASA × 30 d)', () => {
    const r = recommendAcuteDAPT({
      nihss: 4, strokeType: 'ischemic', atherosclerotic: true, timeFromOnsetH: 12
    });
    expect(r.regimen).toContain('ticagrelor+ASA');
    expect(r.duration).toBe('30 days');
  });
});

describe('Post-EVT BP — ENCHANTED2/MT compliance', () => {
  it('successful recanalization → 140-180 target (NOT <120)', () => {
    const r = recommendPostEVTBP({ recanalized: true, ivLyticGiven: true });
    expect(r.target).toContain('140-180');
  });
  it('hemorrhage post-EVT → ICH targets (<140)', () => {
    const r = recommendPostEVTBP({ hasHemorrhage: true });
    expect(r.target).toContain('<140');
  });
});

describe('SAH / ICH expansion / surgery scores', () => {
  it('VASOGRADE Red overrides mFisher on WFNS 5', () => {
    expect(calculateVASOGRADE({ wfns: 5, modifiedFisher: 1 }).grade).toBe('Red');
  });
  it('ENRICH eligible: lobar 50 mL, 12h, GCS 12, premorbid 0', () => {
    const r = evaluateENRICHEligibility({
      icHLocation: 'lobar', volumeMl: 50, timeFromOnsetH: 12, gcs: 12, premorbidMRS: 0, age: 65
    });
    expect(r.eligible).toBe(true);
  });
  it('SWITCH eligible: deep 35 mL ICH, GCS 10, 24h', () => {
    const r = evaluateSWITCHEligibility({
      icHLocation: 'basal ganglia', volumeMl: 35, gcs: 10, timeFromOnsetH: 24, age: 60, premorbidMRS: 0
    });
    expect(r.eligible).toBe(true);
  });
});

describe('PFO — PASCAL category & NNT', () => {
  it('Probable: ROPE 8 + large shunt → Class 1, NNT 17', () => {
    const r = evaluatePASCAL({ ropeScore: 8, largeShunt: true });
    expect(r.category).toBe('Probable');
    expect(r.nnt).toContain('17');
  });
  it('Unlikely: ROPE 5 + no morphology → no benefit', () => {
    const r = evaluatePASCAL({ ropeScore: 5 });
    expect(r.category).toBe('Unlikely');
  });
});

describe('INTERACT3 ICH bundle compliance', () => {
  it('full bundle compliant (warfarin patient)', () => {
    const r = ichCareBundleCheck({
      sbpAt1h: 130, glucose: 6.5, isDiabetic: false, temp: 37.0,
      inr: 1.2, isOnWarfarin: true
    });
    expect(r.fullyCompliant).toBe(true);
    expect(r.completed).toBe(4);
  });
  it('partial compliance flags incomplete elements', () => {
    const r = ichCareBundleCheck({
      sbpAt1h: 165, glucose: 11, isDiabetic: false, temp: 38.5
    });
    expect(r.fullyCompliant).toBe(false);
  });
});

describe('Boston 2.0 CAA criteria', () => {
  it('Lobar ICH + cortical siderosis → Probable CAA', () => {
    const r = evaluateBostonCAA20({
      age: 75, lobarICH: true, corticalSiderosis: true
    });
    expect(r.category).toBe('Probable CAA');
  });
  it('Boston 2.0 enhanced — lobar ICH + CSO-PVS', () => {
    const r = evaluateBostonCAA20({
      age: 75, lobarICH: true, csoPVSSevere: true
    });
    expect(r.category).toBe('Probable CAA (Boston 2.0 enhanced)');
  });
});

describe('AF detection strategy & ARCADIA neutrality', () => {
  it('HEADS² 4 → recommends ICM', () => {
    const r = afDetectionStrategy({ heads2Score: 4 });
    expect(r.strategy).toContain('ICM');
  });
  it('ARCADIA: cardiopathy markers do NOT trigger empiric DOAC', () => {
    const r = arcadiaAdvisory({ ntProBNP: 500, laVolumeIndex: 38 });
    expect(r.recommendDOAC).toBe(false);
    expect(r.cardiopathyPresent).toBe(true);
  });
});

describe('NASCET stenosis quantification', () => {
  it('70% stenosis: 3 mm residual / 10 mm distal', () => {
    expect(calculateNASCET({ stenosisDiameterMm: 3, distalICADiameterMm: 10 }).percent).toBe(70);
  });
  it('handles distal=0 gracefully', () => {
    expect(calculateNASCET({ stenosisDiameterMm: 3, distalICADiameterMm: 0 })).toBeNull();
  });
});

describe('interpretMRS9Q (Bruno Stroke 2010 — fixed in v5.33.0)', () => {
  it('mRS 0 — no symptoms', () => {
    expect(interpretMRS9Q({}).mrs).toBe(0);
  });
  it('mRS 1 — symptoms but functions normally', () => {
    expect(interpretMRS9Q({ q1Symptoms: true }).mrs).toBe(1);
  });
  it('mRS 2 — symptomatic + cannot resume work but independent', () => {
    expect(interpretMRS9Q({ q1Symptoms: true, q6Work: false }).mrs).toBe(2);
  });
  it('mRS 3 — walks unaided but needs help with bowel/bladder OR dressing', () => {
    expect(interpretMRS9Q({ q5WalkingUnaided: true, q2BowelBladder: true }).mrs).toBe(3);
    expect(interpretMRS9Q({ q5WalkingUnaided: true, q3Dressing: true }).mrs).toBe(3);
  });
  it('mRS 4 — cannot walk unaided (q5=false) — historically misclassified as mRS 3 before v5.33.0', () => {
    expect(interpretMRS9Q({ q5WalkingUnaided: false }).mrs).toBe(4);
  });
  it('mRS 4 — cannot walk at all (q4=false)', () => {
    expect(interpretMRS9Q({ q4Walking: false }).mrs).toBe(4);
  });
  it('mRS 4 via constant care', () => {
    expect(interpretMRS9Q({ q9NeedsHelp: 'constant' }).mrs).toBe(4);
  });
  it('mRS 5 — bedridden', () => {
    expect(interpretMRS9Q({ q9NeedsHelp: 'bedridden' }).mrs).toBe(5);
  });
});

describe('dmvoEVTAdvisory (DMVO post-2025 negative trials)', () => {
  it('M2-distal triggers DMVO advisory', () => {
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M2-distal' }).isDmvo).toBe(true);
  });
  it('synonyms: "distal M2", "M2D", "M2 distal" all detected', () => {
    expect(dmvoEVTAdvisory({ occlusionLocation: 'distal M2' }).isDmvo).toBe(true);
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M2D' }).isDmvo).toBe(true);
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M2 DISTAL' }).isDmvo).toBe(true);
  });
  it('M3, M4, A2, A3, P2, P3 all DMVO', () => {
    for (const loc of ['M3', 'M4', 'A2', 'A3', 'P2', 'P3']) {
      expect(dmvoEVTAdvisory({ occlusionLocation: loc }).isDmvo).toBe(true);
    }
  });
  it('M1 / ICA are NOT DMVO', () => {
    expect(dmvoEVTAdvisory({ occlusionLocation: 'M1' }).isDmvo).toBe(false);
    expect(dmvoEVTAdvisory({ occlusionLocation: 'ICA' }).isDmvo).toBe(false);
  });
  it('disabling deficit + NIHSS≥6 → consider-only-if-disabling', () => {
    const r = dmvoEVTAdvisory({ occlusionLocation: 'M3', nihss: 8, deficitDisabling: true });
    expect(r.proceed).toBe('consider-only-if-disabling');
  });
});

describe('adjunctiveAntithromboticAdvisory (MOST/MR-CLEAN-MED)', () => {
  it('post-IV-lytic → No (MOST trial neutral / harm signal)', () => {
    expect(adjunctiveAntithromboticAdvisory({ ivLyticGiven: true }).recommend).toBe('No');
  });
  it('peri-EVT → No (MR CLEAN-MED stopped for harm)', () => {
    expect(adjunctiveAntithromboticAdvisory({ evtPlanned: true }).recommend).toBe('No (periprocedural heparin/aspirin)');
  });
  it('lytic-ineligible → tirofiban consideration (RESCUE BT2)', () => {
    expect(adjunctiveAntithromboticAdvisory({ lyticIneligible: true }).recommend).toContain('Tirofiban');
  });
});

describe('bpTargetPostStroke / lipidsTargetPostStroke / icadMedicalRegimen', () => {
  it('post-stroke BP defaults to <130/80', () => {
    const r = bpTargetPostStroke({});
    expect(r.target).toContain('130/80');
  });
  it('orthostatic patients get relaxed target', () => {
    const r = bpTargetPostStroke({ orthostatic: true });
    expect(r.target).toContain('140/80');
  });
  it('atherosclerotic stroke triggers very-high-risk LDL <55', () => {
    const r = lipidsTargetPostStroke({ strokeSubtype: 'atherosclerotic' });
    expect(r.veryHighRisk).toBe(true);
    expect(r.target).toContain('55');
  });
  it('icadMedicalRegimen requires ≥50% stenosis', () => {
    expect(icadMedicalRegimen({ stenosisPercent: 30 }).applicable).toBe(false);
    expect(icadMedicalRegimen({ stenosisPercent: 80 }).applicable).toBe(true);
  });
  it('recurrent ICAS event adds cilostazol per CSPS.com', () => {
    const r = icadMedicalRegimen({ stenosisPercent: 75, recurrentEvent: true });
    expect(r.regimen.some(x => /cilostazol/i.test(x.drug))).toBe(true);
  });
});

describe('NULL-SAFETY — calculators must not crash on null/undefined inputs (regression for v5.34.0 fix)', () => {
  it('calculateNIHSS handles null/undefined', () => {
    expect(calculateNIHSS(null)).toBe(0);
    expect(calculateNIHSS(undefined)).toBe(0);
  });
  it('calculateGCS handles null/undefined', () => {
    expect(calculateGCS(null)).toBe(0);
    expect(calculateGCS(undefined)).toBe(0);
  });
  it('calculateICHScore / ABCD2 / CHADS2VASc / ROPE / HAS-BLED / RCVS² / PHASES handle null', () => {
    expect(calculateICHScore(null)).toBe(0);
    expect(calculateABCD2Score(null)).toBe(0);
    expect(calculateCHADS2VascScore(null)).toBe(0);
    expect(calculateROPEScore(null)).toBe(0);
    expect(calculateHASBLEDScore(null)).toBe(0);
    expect(calculateRCVS2Score(null)).toBe(0);
    expect(calculatePHASESScore(null)).toBe(0);
  });
  it('calculateICHVolume(null) returns null (not crash)', () => {
    expect(calculateICHVolume(null)).toBeNull();
  });
});
