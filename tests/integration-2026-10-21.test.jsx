// Cross-area patches applied by the lead during the 2026-10-21 integration. Each block names the
// unit report that proposed it and the source behind the expected values.
import { describe, expect, it } from 'vitest';
import { evaluateVideoTreatment } from '../src/encounter-clinical-review.js';
import { encounterTiaReadiness, newEncounter } from '../src/workspace-state.js';
import { caseSummary } from '../src/components/CaseBar.jsx';
import { SAFETY_ITEMS } from '../src/clinical/safety-items.js';

// AHA/ASA 2026 AIS guideline, archived transcription (git 4f8e99d:data/guidelines/ais-2026.json):
//  ais-2026-114 ICA/M1 ≤6 h, NIHSS ≥6, mRS 0–1, ASPECTS 3–10: COR I, LOE A (no age criterion)
//  ais-2026-116 ICA/M1 6–24 h, age <80, NIHSS ≥6, mRS 0–1, ASPECTS 3–5, no significant mass effect: COR I, LOE A
//  ais-2026-117 ICA/M1 ≤6 h, age <80, NIHSS ≥6, mRS 0–1, ASPECTS 0–2, no significant mass effect: COR IIa, LOE B-R
//  ais-2026-118 ICA/M1 ≤6 h, NIHSS ≥6, ASPECTS ≥6, prestroke mRS 2: COR IIa, LOE B-NR
//  ais-2026-119 the same with prestroke mRS 3–4: COR IIb, LOE B-NR
describe('EVT screen messages follow the window-specific AHA/ASA 2026 tiers (ev-evt X1, X2)', () => {
  const base = { diagnosisCategory: 'ischemic', age: '70', nihss: '12', premorbidMRS: '0', ctHemorrhageStatus: 'absent', vesselOcclusion: ['M1'], presentingBP: '150/80', glucose: '110', lastDOACType: 'none' };
  const screen = (patch, hours, aspects) => evaluateVideoTreatment({ note: { ...base, ...patch }, clock: { total: hours, label: 'LKW' }, aspects, critical: [], now: new Date('2026-10-21T12:00:00') }).evt;

  it('grades prestroke mRS 2 and 3–4 only for ICA/M1 within 6 h', () => {
    expect(screen({ premorbidMRS: '2' }, 3, '8').reason).toContain('is reasonable (COR 2a, LOE B-NR)');
    expect(screen({ premorbidMRS: '3' }, 3, '8').reason).toContain('might be reasonable (COR 2b, LOE B-NR)');
    expect(screen({ premorbidMRS: '4', vesselOcclusion: ['ICA'] }, 5, '8').reason).toContain('might be reasonable (COR 2b, LOE B-NR)');
  });
  it('states that no recommendation covers baseline disability beyond 6 h, outside ICA/M1, or at mRS 5', () => {
    for (const [patch, hours] of [[{ premorbidMRS: '2' }, 8], [{ premorbidMRS: '3', vesselOcclusion: ['Basilar'] }, 3], [{ premorbidMRS: '5' }, 3]]) {
      const evt = screen(patch, hours, '8');
      expect(evt.reason).toContain('no AHA/ASA 2026 recommendation covers this baseline disability');
      expect(evt.eligible).toBe(false);
    }
  });
  it('gives the ≤6 h ASPECTS 3–5 tier without an age limit and keeps it a review, not a match', () => {
    const evt = screen({ age: '85' }, 3, '4');
    expect(evt.reason).toContain('(COR 1, LOE A), which has no age criterion');
    expect(evt.eligible).toBe(false);
    expect(evt.reviewRequired).toBe(true);
  });
  it('applies the age <80 limit to ≤6 h ASPECTS 0–2 and to 6–24 h ASPECTS 3–5', () => {
    expect(screen({ age: '70' }, 3, '1').reason).toContain('only with age <80');
    expect(screen({ age: '82' }, 3, '1').reason).toContain('outside the AHA/ASA 2026 COR 2a criteria (age <80)');
    expect(screen({ age: '70' }, 10, '4').reason).toContain('(AHA/ASA 2026 COR 1, LOE A)');
    expect(screen({ age: '81' }, 10, '4').reason).toContain('outside the AHA/ASA 2026 COR 1 criteria (age <80)');
  });
  it('says no recommendation covers ASPECTS 0–2 beyond 6 h, and still asks for a missing ASPECTS', () => {
    expect(screen({}, 10, '2').reason).toContain('no AHA/ASA 2026 recommendation covers this core size beyond 6 h');
    expect(screen({}, 3, '').reason).toBe('Document assessed ASPECTS.');
  });
  it('leaves the matched ASPECTS ≥6 branch unchanged', () => {
    const evt = screen({}, 10, '7');
    expect(evt.eligible).toBe(true);
    expect(evt.reason).toContain('ASPECTS ≥6 and premorbid mRS 0–1');
  });
});

// AHA/ASA 2023 TIA ED scientific statement, archived transcription (git 4f8e99d:data/guidelines/tia-ed-2023.json):
//  tia-ed-2023-44 "Vessel imaging in the emergency department is warranted regardless of ABCD2 score or likelihood of admission."
//  tia-ed-2023-26 "Telemetry, troponin assays, and electrocardiography are warranted in all patients with TIA"
//  tia-ed-2023-15 a clinical TIA diagnosis remains reasonable when MRI cannot be obtained acutely
describe('TIA readiness does not close warranted workup as "Not indicated" (ev-recovery A)', () => {
  const tia = details => { const base = newEncounter(); return { ...base, context: 'acute', note: { ...base.note, diagnosisCategory: 'tia' }, details: { ...base.details, ...details } }; };
  const done = { tiaMri: 'Completed', tiaVascularImaging: 'Completed', tiaCardiacWorkup: 'Completed', tiaWorkupComplete: 'yes', tiaFollowupAccess: 'yes' };
  it('keeps vessel imaging and ECG open when recorded as not indicated, with the reason prompt', () => {
    const gaps = encounterTiaReadiness(tia({ ...done, tiaVascularImaging: 'Not indicated', tiaCardiacWorkup: 'Not indicated' })).gaps;
    expect(gaps).toEqual([
      'Head / neck vascular imaging: recorded as not indicated; the AHA 2023 TIA statement considers it warranted for every TIA. Document the reason.',
      'ECG / rhythm workup: recorded as not indicated; the AHA 2023 TIA statement considers it warranted for every TIA. Document the reason.'
    ]);
  });
  // 2026-10-22 (r3 encounter-notes#1): tia-ed-2023-12/-15 prefer MRI (ideally within 24 h) and list admission, transfer or a
  // timely outpatient MRI when it is unavailable acutely; none calls it not indicated, so the gap stays with a reason prompt.
  it('keeps MRI open when recorded as not indicated, and a completed workup leaves no gaps', () => {
    expect(encounterTiaReadiness(tia({ ...done, tiaMri: 'Not indicated' })).gaps).toEqual(['MRI / DWI: recorded as not indicated; the AHA 2023 TIA statement prefers MRI, ideally within 24 h of symptom onset (if unavailable acutely: admission, transfer or a timely outpatient MRI). Document the reason.']);
    expect(encounterTiaReadiness(tia(done)).gaps).toEqual([]);
  });
});

// ais-2026-74 (COR I, B-R): "After IVT treatment, BP is recommended to be maintained below 180/105 mmHg for at least
// the first 24 hours." ais-2026-72 (COR I): lowered "below 185 mmHg and DBP below 110 mmHg before initiating IVT".
// ais-2026-89 (COR I, C-LD): with severe hypo- or hyperglycemia, IVT is recommended "if disabling stroke symptoms
// persist despite correction to normoglycemia". (Archived AHA 2026 transcription, git 4f8e99d.) ev-acute A–C.
describe('IVT blood pressure and glucose boundaries match the guideline wording', () => {
  const now = new Date('2026-10-01T12:00:00').getTime();
  const given = bp => { const base = newEncounter(); return { ...base, drug: 'TNK', note: { ...base.note, diagnosisCategory: 'ischemic', age: '68', weight: '72', lkwDate: '2026-10-01', lkwTime: '10:20', presentingBP: bp }, actions: { ...base.actions, administered: true, administrationTime: '2026-10-01T11:50', administeredDose: '18', agentConfirmed: 'TNK' } }; };
  it('flags exactly 180/105 after IVT, since the target is below it', () => {
    expect(caseSummary(given('180/100'), now).bpTitle).toBe('Not below the post-IVT limit of 180/105');
    expect(caseSummary(given('170/105'), now).bpTitle).toBe('Not below the post-IVT limit of 180/105');
    expect(caseSummary(given('179/104'), now).bpTitle ?? null).toBe(null);
  });
  it('labels the pre-IVT BP item as the logic applies it, and states the glucose condition', () => {
    const find = id => SAFETY_ITEMS.find(item => item.id === id);
    expect(find('severeUncontrolledHTN').label).toBe('SBP ≥185 or DBP ≥110 mmHg');
    expect(find('highGlucose').note).toBe('correct to normoglycemia first; IVT is recommended if disabling deficits persist (AHA/ASA 2026 COR 1)');
  });
});
