import { describe, expect, it } from 'vitest';
import { newEncounter, buildSummary } from '../src/workspace-state.js';

const now = new Date('2026-10-01T12:00:00').getTime();
const make = (patch = {}) => { const s = newEncounter(); return { ...s, ...patch, note: { ...s.note, ...patch.note }, details: { ...s.details, ...patch.details }, supplementary: { ...s.supplementary, ...patch.supplementary } }; };

describe('round 9 note output', () => {
  it('carries SAH grades into the consultation and handoff notes', () => {
    const sah = make({ note: { diagnosisCategory: 'sah', age: '55' }, details: { sahCause: 'Aneurysmal' }, supplementary: { 'hunt-hess': { sahConfirmed: true, grade: '3' }, 'modified-fisher': { ivh: true, bloodThickness: 'thick' } } });
    const text = buildSummary(sah, now);
    expect(text).toMatch(/Hunt–Hess grade: 3 \(/);
    expect(text).toContain('Modified Fisher grade: 4 (Thick subarachnoid blood; IVH present)');
    expect(buildSummary({ ...sah, documentFormat: 'handoff' }, now)).toMatch(/Hunt–Hess grade: 3/);
    // No worksheet: the grade is stated as not documented, never invented or omitted.
    expect(buildSummary(make({ note: { diagnosisCategory: 'sah' } }), now)).not.toContain('Hunt–Hess grade');
    expect(buildSummary(make({ note: { diagnosisCategory: 'sah' } }), now)).toContain('Clinical grade (Hunt–Hess / WFNS): not documented');
    expect(text).not.toContain('Clinical grade (Hunt–Hess / WFNS)');
  });
  it('gives the handoff the labs and the antithrombotic plan', () => {
    const ich = make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich', lastDOACType: 'warfarin', inr: '3.1', glucose: '142', plateletCount: '210' } });
    expect(buildSummary(ich, now)).toContain('Labs: Glucose 142 mg/dL; Platelets 210 K/µL; INR 3.1');
    // Acute care: missing glucose is stated; labs that were not entered and are not required stay out.
    expect(buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich' } }), now)).toContain('Labs: Glucose not documented\n');
    expect(buildSummary(make({ documentFormat: 'handoff', note: { diagnosisCategory: 'ich' } }), now)).not.toContain('Platelets');
    const tia = make({ documentFormat: 'handoff', note: { diagnosisCategory: 'tia' }, details: { antithromboticPlanType: 'Dual antiplatelet', daptStopDate: '2026-10-22', lipidPlan: 'atorvastatin 80' } });
    const text = buildSummary(tia, now);
    expect(text).toContain('Antithrombotic plan: Dual antiplatelet');
    expect(text).toContain('Planned DAPT stop date: 2026-10-22');
    expect(text).not.toContain('atorvastatin');
  });
});
