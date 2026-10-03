// Regression pins for the 2026-10-03 clinical audit corrections. Each case
// reproduces an audited unsafe output and asserts the corrected behavior.
import { describe, expect, it } from 'vitest';
import { newEncounter, protocolEncounter } from '../src/workspace-state.js';
import { evaluateIVT, evaluateEVT_M2, getSafePauseText, IVT_ABSOLUTE_CONTRAINDICATIONS, ICH_INITIAL_EVALUATION_ALGORITHM } from '../src/institutional-protocols.js';
import { evaluateVideoTreatment, ivtLabConcerns, evaluateWakeUpScreen, EXTEND_PERFUSION_SOURCE } from '../src/encounter-clinical-review.js';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';
import { recommendAcuteDAPT } from '../src/calculators-extended.js';
import { AIS_COMMAND_CENTER_CARDS } from '../src/management-guidance.js';

const NOW = new Date('2026-10-03T12:00:00');
const allNo = Object.fromEntries(SAFETY_ITEMS.map(item => [item.id, false]));
function encounter(extra = {}) {
  const state = newEncounter();
  state.note = { ...state.note, diagnosisCategory: 'ischemic', age: '70', weight: '80', sex: 'M', premorbidMRS: '0', lkwDate: '2026-10-03', lkwTime: '10:30', presentingBP: '160/90', glucose: '120', ctHemorrhageStatus: 'absent', disablingDeficit: true, vesselOcclusion: ['M1'], tnkContraindicationChecklist: allNo, ivtContraindicationsReviewed: true, ...extra };
  state.nihssSource = 'reported'; state.reportedNihss = '8'; state.aspects = '8';
  return state;
}
// Mirrors the pocket card: the attestation is ignored when Encounter requires review.
function pocketCard(state) {
  const shared = protocolEncounter(state, NOW.getTime());
  return evaluateIVT({ ...shared.ivt, bpSystolic: '160', bpDiastolic: '90', contraindicationsReviewed: !shared.safetyReviewRequired, safetyReviewReason: shared.safetyReviewRequired ? shared.safetyReviewReason : '' });
}

describe('C1: DOAC or unassessed anticoagulant exposure never yields an affirmative COR 1 IVT card', () => {
  it('returns the clean standard-window result only with explicitly documented no anticoagulant', () => {
    const clean = pocketCard(encounter({ lastDOACType: 'none' }));
    expect(clean).toMatchObject({ eligible: true, cor: '1', dose: 20 });
  });
  it.each([
    ['apixaban 6 h ago', { lastDOACType: 'apixaban', lastDOACDose: '2026-10-03T06:00' }],
    ['exposure not assessed', { lastDOACType: '' }],
    ['warfarin INR 2.5', { lastDOACType: 'warfarin', inr: '2.5' }],
    ['rivaroxaban, timing unknown', { lastDOACType: 'rivaroxaban' }]
  ])('%s → safety hold, no COR 1 and no dose', (_, extra) => {
    const state = encounter(extra);
    const shared = protocolEncounter(state, NOW.getTime());
    expect(shared.safetyReviewRequired).toBe(true);
    expect(shared.safetyReviewReason).toMatch(/anticoagulant|INR|recorded contraindication/i);
    const card = pocketCard(state);
    expect(card.eligible).toBe('pending');
    expect(card.cor).toBeUndefined();
    expect(card.dose).toBeUndefined();
    expect(card.reason).toMatch(/resolve the Encounter safety review/);
  });
  it('lists factor Xa inhibitor or dabigatran exposure <48 h or unknown as an absolute IVT contraindication', () => {
    const row = IVT_ABSOLUTE_CONTRAINDICATIONS.find(item => /Factor Xa inhibitor/.test(item.label));
    expect(row.label).toBe('Factor Xa inhibitor (apixaban, rivaroxaban, edoxaban) or dabigatran: last dose <48 h or unknown');
    expect(row.detail).toMatch(/drug-specific assays\/levels are normal/);
    expect(row.detail).toMatch(/Evaluate EVT independently/);
    expect(row.detail).toMatch(/PMID 31662037/);
  });
});

describe('H1: entered abnormal coagulation labs require review', () => {
  const base = { diagnosisCategory: 'ischemic', age: '70', premorbidMRS: '0', presentingBP: '160/90', glucose: '120', ctHemorrhageStatus: 'absent', disablingDeficit: true, vesselOcclusion: ['M1'], tnkContraindicationChecklist: allNo, ivtContraindicationsReviewed: true, lastDOACType: 'none', nihss: '8' };
  const screen = extra => evaluateVideoTreatment({ note: { ...base, ...extra }, clock: { total: 2, label: 'LKW' }, aspects: '8', now: NOW }).tnk;
  it('keeps normal labs on the standard-window screen', () => {
    expect(screen({ plateletCount: '220', inr: '1.0', ptt: '30', pt: '12' })).toMatchObject({ eligible: true });
  });
  it.each([
    [{ plateletCount: '60' }, /platelets 60 K\/µL \(<100\)/],
    [{ plateletCount: '60000' }, /platelets 60 K\/µL \(<100\)/],
    [{ inr: '2.2' }, /INR 2\.2 \(>1\.7\)/],
    [{ ptt: '60' }, /aPTT 60 s \(>40\)/],
    [{ pt: '16' }, /PT 16 s \(>15\)/]
  ])('%o → review naming the value', (extra, pattern) => {
    const result = screen(extra);
    expect(result).toMatchObject({ eligible: false, reviewRequired: true });
    expect(result.reason).toMatch(pattern);
  });
  it('lists every abnormal value and flows into the protocol safety hold', () => {
    expect(ivtLabConcerns({ plateletCount: '80', inr: '1.8' })).toEqual(['platelets 80 K/µL (<100)', 'INR 1.8 (>1.7)']);
    const shared = protocolEncounter(encounter({ lastDOACType: 'none', inr: '2.0' }), NOW.getTime());
    expect(shared.safetyReviewRequired).toBe(true);
    expect(shared.safetyReviewReason).toMatch(/INR 2 \(>1\.7\)/);
  });
});

describe('H3/M8: late-window IVT requires LVO and labels each threshold source', () => {
  const late = { age: 64, ichOnCT: false, disablingDeficit: true, glucose: 100, weight: 80, bpSystolic: 170, bpDiastolic: 90, contraindicationsReviewed: true, hoursFromLKW: 12, preMRS: 0, evtStatus: 'candidate-infeasible', consentObtained: true, imagingPathway: { ctpCoreMl: 20, ctpRatio: 1.8, ctpMismatchVolMl: 30 } };
  it('grades the LVO branch COR 2b / B-R and withholds it without LVO', () => {
    expect(evaluateIVT({ ...late, lvoOnCta: true })).toMatchObject({ eligible: 'consider', cor: '2b', loe: 'B-R', dose: 20 });
    expect(evaluateIVT(late).eligible).toBe('pending');
    expect(evaluateIVT({ ...late, lvoOnCta: false }).eligible).toBe(false);
  });
  it('derives LVO on CTA from Encounter vessel imaging', () => {
    expect(protocolEncounter(encounter({ vesselOcclusion: ['M1'] }), NOW.getTime()).ivt.lvoOnCta).toBe(true);
    expect(protocolEncounter(encounter({ vesselOcclusion: ['None'] }), NOW.getTime()).ivt.lvoOnCta).toBe(false);
    expect(protocolEncounter(encounter({ vesselOcclusion: [] }), NOW.getTime()).ivt).not.toHaveProperty('lvoOnCta');
  });
  it('labels the 4.5-9 h CTP branch as institutional thresholds and the Encounter screen as EXTEND', () => {
    const early = evaluateIVT({ ...late, hoursFromLKW: 6, consentObtained: false });
    expect(early.selectionSource).toMatch(/institutional CTP thresholds: core <50 mL/);
    expect(early.selectionSource).toMatch(/EXTEND used core <70 mL/);
    expect(evaluateWakeUpScreen({}, NOW).perfusionSource).toBe(EXTEND_PERFUSION_SOURCE);
    expect(EXTEND_PERFUSION_SOURCE).toMatch(/core <70 mL, mismatch ratio >1\.2, mismatch volume >10 mL/);
  });
  it('carries the LVO gate and COR 2b in the extended-window pathway card', () => {
    const card = AIS_COMMAND_CENTER_CARDS.find(item => item.id === 'ais-ivt-extended');
    const row = card.pathway.find(item => /^9-24h with qualifying CTP selection/.test(item.label));
    expect(row).toMatchObject({ cor: 'IIb', loe: 'B-R' });
    expect(row.label).toMatch(/LVO on CTA/);
  });
});

describe('H6: M2 / MeVO grades follow AHA/ASA 2026', () => {
  it('grades codominant M2 COR 3: No Benefit / LOE A', () => {
    expect(evaluateEVT_M2({ age: 65, segment: 'M2-codominant' })).toMatchObject({ eligible: false, cor: '3 (No Benefit)', loe: 'A' });
  });
  it('keeps dominant M2 0-6 h at COR 2a and labels 6-24 h as an institutional tier', () => {
    const base = { age: 65, segment: 'M2-proximal-dominant', dominant: true, nihss: 10, preMRS: 0, aspectsScore: 8 };
    expect(evaluateEVT_M2({ ...base, hoursFromLKWh: 4 })).toMatchObject({ cor: '2a', loe: 'B-NR' });
    const late = evaluateEVT_M2({ ...base, hoursFromLKWh: 12, ctpMismatch: true });
    expect(late.cor).toBeUndefined();
    expect(late.gradeNote).toMatch(/No AHA\/ASA 2026 grade for 6-24 h/);
  });
  it('removes the "no recommendation" codominant row from the MeVO card', () => {
    const card = AIS_COMMAND_CENTER_CARDS.find(item => item.id === 'ais-mevo');
    expect(JSON.stringify(card)).not.toMatch(/No institutional recommendation is supplied/);
    expect(card.pathway.find(row => /codominant/.test(row.label))).toMatchObject({ cor: 'III: No Benefit', loe: 'A' });
  });
});

describe('M9: DAPT guideline tier before trial-population mismatch', () => {
  const base = { anticoagulationExcluded: true, noncardioembolicConfirmed: true, hemorrhageExcluded: true, reperfusionExcluded: true, antiplateletContraindicationsReviewed: true };
  it('age 35, NIHSS ≤3 at 12-24 h → clopidogrel-aspirin, COR 1 guideline tier', () => {
    const result = recommendAcuteDAPT({ ...base, age: 35, strokeType: 'ischemic', nihss: 2, timeFromOnsetH: 18 });
    expect(result).toMatchObject({ regimen: 'clopidogrel+ASA', duration: '21 days' });
    expect(result.class).toMatch(/^COR 1, LOE A \(AHA\/ASA 2026 AIS\) \(guideline tier/);
  });
  it('age >80, NIHSS 4-5 atherosclerotic <24 h → clopidogrel-aspirin, COR 2a guideline tier', () => {
    const result = recommendAcuteDAPT({ ...base, age: 85, strokeType: 'ischemic', nihss: 5, atherosclerotic: true, timeFromOnsetH: 10 });
    expect(result).toMatchObject({ regimen: 'clopidogrel+ASA', duration: '21 days' });
    expect(result.class).toMatch(/COR 2a, LOE B-R/);
  });
  it('includes the trial loading doses for CHANCE/POINT', () => {
    const result = recommendAcuteDAPT({ ...base, age: 65, strokeType: 'ischemic', nihss: 2, timeFromOnsetH: 6 });
    expect(result.dosing).toMatch(/300 mg in CHANCE; 600 mg in POINT/);
    expect(result.dosing).toMatch(/CHANCE 75-300 mg on day 1; POINT 50-325 mg on day 1/);
  });
});

describe('LOW: drug-aware safe pause, cerebellar ICH and safety-item corrections', () => {
  const ready = { consentType: 'informed', bp: '170/90', contraindications: 'reviewed', providerAgreement: 'confirmed' };
  it('names the selected thrombolytic in the dose line', () => {
    expect(getSafePauseText(ready)).toMatch(/tenecteplase 0\.25 mg\/kg IV bolus, max 25 mg/);
    const alteplase = getSafePauseText({ ...ready, drug: 'alteplase' });
    expect(alteplase).toMatch(/alteplase 0\.9 mg\/kg, max 90 mg/);
    expect(alteplase).not.toMatch(/tenecteplase/);
  });
  it('states the ICH 2022 cerebellar surgery indication', () => {
    const screen = ICH_INITIAL_EVALUATION_ALGORITHM.surgicalScreens.find(item => item.title === 'Cerebellar decompression');
    expect(screen.criteria.join(' ')).toMatch(/Cerebellar ICH >=15 mL/);
    expect(screen.action).toMatch(/COR 1, LOE B-NR/);
  });
  it('fixes the TNKase typo and relabels severe renal impairment as non-guideline', () => {
    expect(JSON.stringify(SAFETY_ITEMS)).not.toMatch(/within2/);
    const renal = SAFETY_ITEMS.find(item => item.id === 'severeRenalFailure');
    expect(renal.note).toMatch(/Not a guideline IVT contraindication; individualize/);
    expect(renal.label).not.toMatch(/Cr >3|CrCl <25/);
  });
});
