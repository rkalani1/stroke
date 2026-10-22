// Round-3 verification fixes for the Encounter unit (2026-10-22). Each block names its finding id.
// Expected values come from the sources named beside them, not from the implementation:
//  - AHA/ASA 2023 TIA ED statement (PMID 36655570), archived transcription git 4f8e99d:data/guidelines/tia-ed-2023.json
//    -12 "Multimodal brain MRI is the preferred method ... ideally should be obtained within 24 hours of symptom onset."
//    -13 DWI positivity: ">6-fold increased risk of recurrent stroke at 1 year"; -15 options when MRI cannot be obtained acutely.
//  - AHA/ASA 2026 AIS guideline (PMID 41582814), archived transcription git 4f8e99d:data/guidelines/ais-2026.json
//    -114 ICA/M1 ≤6 h, NIHSS ≥6, mRS 0–1, ASPECTS 3–10 (COR 1, A); -118 ICA/M1 ≤6 h, NIHSS ≥6, ASPECTS ≥6, prestroke mRS 2
//    (COR 2a, B-NR); -119 the same with prestroke mRS 3–4 (COR 2b, B-NR). No row covers mRS 2–4 with NIHSS <6 or ASPECTS <6.
//  - EXTEND (doi:10.1056/NEJMoa1813046): mismatch ratio >1.2 and mismatch volume >10 mL (strict).
//  - RESCUE-Japan LIMIT registry NCT03702413: age ≥18 (no maximum); randomization within 6 h, or 6–24 h without a positive
//    MRI-FLAIR lesion; ASPECTS 3–5 or DWI-ASPECTS 3–5.
//  - STOP-BANG (Chung 2016, PMID 26378880): BMI item is "BMI > 35 kg/m²" (strict).
//  - mRS (van Swieten 1988): grade 6 is death, so it is not a pre-stroke (baseline) state.
import { afterEach, describe, expect, it } from 'vitest';
import { newEncounter, encounterTiaReadiness, buildSummary } from '../src/workspace-state.js';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { formatWakeUpScreenForExport } from '../src/clinical/wake-up-documentation.js';
import { evaluateLargeCoreEVT } from '../src/calculators-extended.js';
import { calculateReviewedSTOPBANG, describeReviewedMRS } from '../src/supplementary-calculators.js';

const priorZone = process.env.TZ;
const zone = name => { process.env.TZ = name; };
afterEach(() => { if (priorZone === undefined) delete process.env.TZ; else process.env.TZ = priorZone; });

const state = (patch = {}) => {
  const s = newEncounter();
  return { ...s, ...patch, note: { ...s.note, ...patch.note }, actions: { ...s.actions, ...patch.actions }, decisions: { ...s.decisions, ...patch.decisions }, details: { ...patch.details } };
};
const line = (text, label) => text.split('\n').find(row => row.startsWith(`${label}:`)) || '';
const video = patch => state({ consultationType: 'video', ...patch });

describe('TIA readiness: a DWI "No" is established only by a completed MRI (encounter-notes#0)', () => {
  const negatives = { tiaDwiPositive: 'no', tiaRecurrent: 'no', tiaPersistentDeficit: 'no', tiaSevereCarotid: 'no', tiaCardioembolic: 'no' };
  const workup = { tiaVascularImaging: 'Completed', tiaCardiacWorkup: 'Completed', tiaWorkupComplete: 'yes', tiaFollowupAccess: 'yes' };
  const tia = details => state({ note: { diagnosisCategory: 'tia' }, details: { ...negatives, ...workup, ...details } });

  it.each(['Not indicated', 'Declined', 'Deferred', 'Ordered', ''])('MRI %s: the DWI answer is not counted and the review stays incomplete', tiaMri => {
    const review = encounterTiaReadiness(tia({ tiaMri }));
    expect(review.status).toBe('incomplete');
    expect(review.reviewed).toBe(false);
    expect(review.reviewedCount).toBe(4);
    expect(review.missing).toEqual(['TIA presentation with DWI lesion (No recorded without a completed MRI)']);
  });
  it('MRI completed: the DWI "No" counts and all five features are reviewed', () => {
    const review = encounterTiaReadiness(tia({ tiaMri: 'Completed' }));
    expect(review).toMatchObject({ status: 'review', reviewed: true, reviewedCount: 5, missing: [], gaps: [] });
  });
  it('a DWI "Yes" is never discarded, with or without a completed MRI', () => {
    expect(encounterTiaReadiness(tia({ tiaMri: 'Not indicated', tiaDwiPositive: 'yes' })).status).toBe('urgent');
  });
});

describe('TIA readiness: MRI recorded as not indicated stays a gap (encounter-notes#1, encounter-ui#5)', () => {
  const tia = details => state({ note: { diagnosisCategory: 'tia' }, details: { tiaVascularImaging: 'Completed', tiaCardiacWorkup: 'Completed', tiaWorkupComplete: 'yes', tiaFollowupAccess: 'yes', ...details } });
  it('names the MRI preference and the alternatives instead of closing the gap', () => {
    expect(encounterTiaReadiness(tia({ tiaMri: 'Not indicated' })).gaps).toEqual([
      'MRI / DWI: recorded as not indicated; the AHA 2023 TIA statement prefers MRI, ideally within 24 h of symptom onset (if unavailable acutely: admission, transfer or a timely outpatient MRI). Document the reason.'
    ]);
    expect(encounterTiaReadiness(tia({ tiaMri: 'Completed' })).gaps).toEqual([]);
  });
});

describe('Note: an action time before symptom discovery is flagged (encounter-notes#2)', () => {
  const NOW = Date.parse('2026-10-22T12:00:00-04:00');
  it('unknown LKW: IVT and puncture before discovery', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', lkwUnknown: true, discoveryDate: '2026-10-22', discoveryTime: '10:00', weight: '80' }, drug: 'TNK', decisions: { ivt: 'Recommended', evt: 'Recommended' }, actions: { administered: true, administrationTime: '2026-10-22T09:00', punctureTime: '2026-10-22T08:30', reperfusionTime: '2026-10-22T11:00' } }), NOW);
    expect(line(text, 'IVT administration')).toContain('[IVT time precedes symptom discovery; review recorded dates/times]');
    expect(line(text, 'EVT puncture')).toBe('EVT puncture: 2026-10-22 08:30 [precedes symptom discovery; review recorded dates/times]');
    expect(line(text, 'EVT reperfusion')).toBe('EVT reperfusion: 2026-10-22 11:00');
  });
  it('known LKW: an IVT time between LKW and discovery is flagged against discovery; one before LKW names LKW only', () => {
    zone('America/New_York');
    const note = { diagnosisCategory: 'ischemic', lkwDate: '2026-10-22', lkwTime: '07:00', discoveryDate: '2026-10-22', discoveryTime: '10:00', weight: '80' };
    const ivt = administrationTime => line(buildSummary(video({ note, drug: 'TNK', decisions: { ivt: 'Recommended' }, actions: { administered: true, administrationTime } }), NOW), 'IVT administration');
    expect(ivt('2026-10-22T09:00')).toContain('[IVT time precedes symptom discovery; review recorded dates/times]');
    expect(ivt('2026-10-22T06:00')).toContain('[IVT time precedes LKW; review recorded dates/times]');
    expect(ivt('2026-10-22T06:00')).not.toContain('symptom discovery');
    expect(ivt('2026-10-22T10:30')).not.toContain('precedes');
  });
});

describe('Note: the EVT decision is reconciled against any recorded EVT action (encounter-notes#3)', () => {
  const NOW = Date.parse('2026-10-22T12:00:00-04:00');
  const flag = "[EVT clinician decision is 'Not recommended'; reconcile]";
  it('a reperfusion time without a puncture time carries the flag on the reperfusion line', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', ticiScore: '2b' }, decisions: { ivt: 'Not recommended', evt: 'Not recommended' }, actions: { reperfusionTime: '2026-10-22T11:00' } }), NOW);
    expect(line(text, 'EVT reperfusion')).toBe(`EVT reperfusion: 2026-10-22 11:00 ${flag}`);
    expect(line(text, 'EVT puncture')).not.toContain('clinician decision');
  });
  it('an mTICI grade alone carries the flag on the missing-puncture line', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', ticiScore: '2b' }, decisions: { evt: 'Not recommended' } }), NOW);
    expect(line(text, 'EVT puncture')).toBe(`EVT puncture: not documented [mTICI 2b recorded; reconcile] ${flag}`);
  });
  it('no flag when EVT was recommended, and the puncture line keeps the flag when a puncture is recorded', () => {
    zone('America/New_York');
    const recommended = buildSummary(video({ note: { diagnosisCategory: 'ischemic', ticiScore: '2b' }, decisions: { evt: 'Recommended' }, actions: { reperfusionTime: '2026-10-22T11:00' } }), NOW);
    expect(recommended).not.toContain('EVT clinician decision is');
    const punctured = buildSummary(video({ note: { diagnosisCategory: 'ischemic' }, decisions: { evt: 'Not recommended' }, actions: { punctureTime: '2026-10-22T10:00', reperfusionTime: '2026-10-22T11:00' } }), NOW);
    expect(line(punctured, 'EVT puncture')).toContain(flag);
    expect(line(punctured, 'EVT reperfusion')).not.toContain(flag);
  });
});

describe('Note: consent reconciliation (encounter-notes#4)', () => {
  const NOW = Date.parse('2026-10-22T12:00:00-04:00');
  it('a Declined consent beside a recorded administration or puncture is flagged', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', weight: '80' }, drug: 'TNK', decisions: { ivt: 'Recommended', evt: 'Recommended' }, actions: { administered: true, administrationTime: '2026-10-22T09:00', consent: 'Declined', punctureTime: '2026-10-22T10:00', evtConsent: 'Declined' } }), NOW);
    expect(line(text, 'IVT Consent status')).toBe('IVT Consent status: Declined [administration recorded; reconcile]');
    expect(line(text, 'EVT consent status')).toBe('EVT consent status: Declined [puncture recorded; reconcile]');
    const declinedOnly = buildSummary(video({ note: { diagnosisCategory: 'ischemic' }, actions: { consent: 'Declined', evtConsent: 'Declined' } }), NOW);
    expect(line(declinedOnly, 'IVT Consent status')).toBe('IVT Consent status: Declined');
    expect(line(declinedOnly, 'EVT consent status')).toBe('EVT consent status: Declined');
  });
  it('an IVT time not documented as given is called the entered IVT time', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic' }, actions: { administrationTime: '2026-10-22T09:00', consentTime: '2026-10-22T09:30' } }), NOW);
    expect(line(text, 'IVT Consent time')).toBe('IVT Consent time: 2026-10-22 09:30 [recorded after the entered IVT time; confirm the consent timeline] [consent status not documented]');
  });
});

describe('Note: a clock instant stamped before a device time-zone change (encounter-notes#5)', () => {
  it('prints the entered LKW and the instant as read on this device', () => {
    zone('America/Chicago');
    const NOW = Date.parse('2026-10-22T16:00:00Z');
    // "Set LKW to now" in New York at 10:00 EDT is 14:00Z, which is 09:00 CDT.
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-22', lkwTime: '10:00:00', lkwClock: { value: '2026-10-22T10:00:00', instant: '2026-10-22T14:00:00.000Z' } } }), NOW);
    expect(line(text, 'Last known well (date/time)')).toBe('Last known well (date/time): 2026-10-22 10:00:00 [recorded instant is 2026-10-22 09:00:00 on this device; review]');
  });
  it('an instant stamped in the same zone prints no flag', () => {
    zone('America/Chicago');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-10-22', lkwTime: '09:00:00', lkwClock: { value: '2026-10-22T09:00:00', instant: '2026-10-22T14:00:00.000Z' } } }), Date.parse('2026-10-22T16:00:00Z'));
    expect(line(text, 'Last known well (date/time)')).toBe('Last known well (date/time): 2026-10-22 09:00:00');
  });
});

describe('Note: the wake-up screen does not repeat LKW or discovery without their labels (encounter-notes#6)', () => {
  it('CTP pathway with a known LKW across the fall-back change: one LKW line, with its offset', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', lkwDate: '2026-11-01', lkwTime: '00:30', wakeUpStrokeWorkflow: { mriAvailable: false } } }), Date.parse('2026-11-01T09:00:00-05:00'));
    expect(text.match(/Last known well/g)).toHaveLength(1);
    expect(text).toContain('Last known well (date/time): 2026-11-01 00:30 (UTC−04:00)');
  });
  it('MRI pathway with unknown onset: one discovery entry, with its offset', () => {
    zone('America/New_York');
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', lkwUnknown: true, discoveryDate: '2026-11-01', discoveryTime: '00:40', wakeUpStrokeWorkflow: { mriAvailable: true } } }), Date.parse('2026-11-01T03:00:00-05:00'));
    expect(text.match(/00:40/g)).toHaveLength(1);
    expect(text).toContain('Discovery: 2026-11-01 00:40 (UTC−04:00)');
  });
  it('MRI pathway still states a missing discovery time, which the WAKE-UP recognition window needs', () => {
    expect(formatWakeUpScreenForExport({ wakeUpStrokeWorkflow: { mriAvailable: true }, lkwDate: '2026-10-01', lkwTime: '01:00' }, new Date('2026-10-01T12:00:00'))).toContain('Symptom discovery: not documented.');
  });
});

describe('Note: entered lists keep their separators (encounter-notes#7)', () => {
  const NOW = Date.parse('2026-10-22T12:00:00-04:00');
  it('Epic note keeps an entered "p.o.;" list', () => {
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', medications: 'aspirin 81 mg p.o.; apixaban 5 mg b.i.d.' } }), NOW);
    expect(line(text, 'Medications')).toBe('Medications: aspirin 81 mg p.o.; apixaban 5 mg b.i.d.');
  });
  it('Pulsara summary turns entered line breaks into separators, including after an abbreviation', () => {
    const text = buildSummary(state({ consultationType: 'phone', note: { diagnosisCategory: 'ischemic', medications: 'aspirin 81 mg p.o.\napixaban 5 mg b.i.d.\nmetformin 500 mg', ctResults: 'No acute findings.\nOld right infarct.' } }), NOW);
    expect(text).toContain('Medications: aspirin 81 mg p.o.; apixaban 5 mg b.i.d.; metformin 500 mg.');
    expect(text).toContain('No acute findings. Old right infarct. CT hemorrhage review');
  });
  it('after entered text that ends a sentence, the template separator is not doubled; entered text is kept as written', () => {
    const text = buildSummary(video({ note: { diagnosisCategory: 'ischemic', ctResults: 'No bleed.', ctaResults: 'Clot, give ASA 81 mg q.d.', vesselOcclusion: ['M1'], nihssDetails: 'Drift.' } }), NOW);
    expect(text).toContain('No bleed. CT hemorrhage review');
    expect(text).toContain('Clot, give ASA 81 mg q.d.; Vessel imaging: M1');
    expect(text).toContain('— Drift. Disabling deficit');
    expect(text).not.toMatch(/\w\w\.;/);
  });
});

describe('EVT screen for prestroke mRS 2–4 cites a tier only inside ais-2026-118/-119 (encounter-ui#0)', () => {
  const NOW = new Date('2026-10-22T12:00:00Z');
  const evt = (note, aspects, hours = 2) => evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', ctHemorrhageStatus: 'absent', age: '72', nihss: '14', vesselOcclusion: ['M1'], ...note }, clock: { total: hours, label: 'LKW' }, aspects, now: NOW }).evt;
  it.each([[{ premorbidMRS: '2' }, '4'], [{ premorbidMRS: '2', nihss: '3' }, '8'], [{ premorbidMRS: '3' }, '2'], [{ premorbidMRS: '4', nihss: '5', vesselOcclusion: ['ICA'] }, '9']])('%j with ASPECTS %s is outside the graded criteria, with no COR', (note, aspects) => {
    const result = evt(note, aspects);
    expect(result.reason).toContain('outside the AHA/ASA 2026 prestroke mRS 2–4 criteria (ICA/M1 within 6 h, NIHSS ≥6, ASPECTS ≥6)');
    expect(result.reason).not.toMatch(/COR|reasonable/);
    expect(result).toMatchObject({ eligible: false, reviewRequired: true });
  });
  it.each(['', ' ', 'x', '11', '5.5'])('a missing or invalid ASPECTS (%j) asks for it instead of citing a tier', aspects => {
    expect(evt({ premorbidMRS: '2' }, aspects)).toMatchObject({ eligible: false, reason: 'Document assessed ASPECTS.' });
  });
  it('cites COR 2a for mRS 2 and COR 2b for mRS 3–4 only with NIHSS ≥6 and ASPECTS ≥6', () => {
    expect(evt({ premorbidMRS: '2', nihss: '6' }, '6').reason).toContain('is reasonable (COR 2a, LOE B-NR)');
    expect(evt({ premorbidMRS: '4', vesselOcclusion: ['ICA'] }, '7').reason).toContain('might be reasonable (COR 2b, LOE B-NR)');
    expect(evt({ premorbidMRS: '3' }, '6').eligible).toBe(false);
  });
});

describe('EVT screen: vessel status before baseline disability (encounter-ui#1)', () => {
  const NOW = new Date('2026-10-22T12:00:00Z');
  const evt = (note, aspects = '8') => evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', ctHemorrhageStatus: 'absent', age: '72', nihss: '14', ...note }, clock: { total: 2, label: 'LKW' }, aspects, now: NOW }).evt.reason;
  it('an undocumented vessel asks for vessel imaging at every baseline mRS', () => {
    for (const premorbidMRS of ['0', '2', '4', '5']) expect(evt({ premorbidMRS, vesselOcclusion: [] })).toBe('Document vessel imaging, age, complete NIHSS, baseline function and time.');
  });
  it('a documented absence of occlusion is stated at every baseline mRS', () => {
    for (const premorbidMRS of ['0', '3']) expect(evt({ premorbidMRS, vesselOcclusion: ['None'] })).toContain('No occlusion explicitly documented');
  });
  it('mRS 5 is uncovered for any vessel or window, without naming the vessel or window', () => {
    const reason = evt({ premorbidMRS: '5', vesselOcclusion: ['M1'] });
    expect(reason).toContain('no AHA/ASA 2026 recommendation covers this baseline disability;');
    expect(reason).not.toContain('vessel or time window');
    expect(evt({ premorbidMRS: '3', vesselOcclusion: ['Basilar'] })).toContain('no AHA/ASA 2026 recommendation covers this baseline disability with this vessel or time window');
  });
});

describe('EVT screen: the ais-2026-114 message makes no unsourced hemorrhage claim (encounter-ui#4)', () => {
  it('states the COR 1 tier without "Expect more hemorrhage"', () => {
    const reason = evaluateVideoTreatment({ note: { diagnosisCategory: 'ischemic', ctHemorrhageStatus: 'absent', age: '85', nihss: '14', premorbidMRS: '0', vesselOcclusion: ['M1'] }, clock: { total: 3, label: 'LKW' }, aspects: '4', now: new Date('2026-10-22T12:00:00Z') }).evt.reason;
    expect(reason).toContain('(COR 1, LOE A), which has no age criterion');
    expect(reason).not.toMatch(/hemorrhage/i);
  });
});

describe('Exported EXTEND screen never displays a met strict threshold as the threshold itself (encounter-ui#3)', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const ctp = (coreVolume, penumbraVolume) => formatWakeUpScreenForExport({ diagnosisCategory: 'ischemic', age: '70', nihss: '10', premorbidMRS: '0', ctHemorrhageStatus: 'absent', lkwDate: '2026-10-22', lkwTime: '06:00', lkwClock: { value: '2026-10-22T06:00', instant: '2026-10-22T06:00:00.000Z' }, coreVolume, penumbraVolume, wakeUpStrokeWorkflow: { mriAvailable: false } }, now);
  it('ratio 83/69 = 1.203 (> 1.2) is shown above 1.2, and the screen is met', () => {
    const text = ctp('69', '83');
    expect(text).toContain('partial source screen met');
    expect(text).toContain('mismatch ratio: >1.2.');
  });
  it('mismatch 60.04 − 50 = 10.04 mL (> 10) is shown above 10 mL', () => {
    const text = ctp('50', '60.04');
    expect(text).toContain('partial source screen met');
    expect(text).toContain('calculated mismatch volume: >10 mL');
  });
  it('values away from the thresholds keep their rounded figures', () => {
    expect(ctp('20', '60')).toContain('calculated mismatch volume: 40 mL; mismatch ratio: 3.');
  });
});

describe('Large-core screen discloses the unmodeled RESCUE-Japan LIMIT 6–24 h subset (calculators#2)', () => {
  const run = patch => evaluateLargeCoreEVT({ age: 86, nihss: 10, aspects: 4, timeFromLKWh: 14, premorbidMRS: 1, lvoLocation: 'M1', ...patch });
  it('names the subset when no modeled branch is met at 6–24 h with ASPECTS 3–5', () => {
    const result = run();
    expect(result.matchingTrials).toEqual([]);
    expect(result.rationale).toContain('RESCUE-Japan LIMIT: Only the ≤6 h ASPECTS 3–5 subset is modeled; its 6–24 h DWI-ASPECTS 3–5 without FLAIR change subset is not evaluated.');
  });
  it('does not add it within 6 h, below the trial NIHSS, above its mRS or outside ASPECTS 3–5', () => {
    for (const patch of [{ timeFromLKWh: 5 }, { nihss: 5 }, { premorbidMRS: 2 }, { aspects: 2 }, { timeFromLKWh: 25 }]) expect(run(patch).rationale).not.toContain('subset is not evaluated');
    // Within 6 h LIMIT itself is a modeled match.
    expect(run({ timeFromLKWh: 5 }).matchingTrials).toContain('RESCUE-Japan LIMIT');
  });
});

describe('STOP-BANG BMI item is strictly above 35 kg/m² (calculators#3)', () => {
  const sb = patch => calculateReviewedSTOPBANG({ age: '55', sex: 'M', weight: '101.15', heightCm: '170', neckCm: '38', sb_snoring: true, sb_tired: false, sb_observed: false, sb_pressure: false, ...patch });
  it('101.15 kg at 170 cm is exactly 35.0 and scores 0 for BMI (snoring, age and male: 3/8)', () => {
    expect(sb()).toMatchObject({ bmi: 35, score: 3, bang: { bmi: false } });
    expect(sb({ weight: '185.15', heightCm: '230' })).toMatchObject({ bmi: 35, bang: { bmi: false } });
  });
  it('101.16 kg at 170 cm (35.003) scores the BMI item', () => {
    expect(sb({ weight: '101.16' })).toMatchObject({ score: 4, bang: { bmi: true } });
  });
});

describe('Baseline mRS descriptor excludes death (e2e:trials-calculators-search#8)', () => {
  it('describes 0–5 and rejects 6', () => {
    expect(describeReviewedMRS('5')).toMatchObject({ score: 5 });
    expect(describeReviewedMRS('6')).toBeNull();
  });
});
