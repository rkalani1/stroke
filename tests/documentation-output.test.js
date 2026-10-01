import { describe, expect, it } from 'vitest';
import { buildSummary, newEncounter, updateEncounter, outputWarnings } from '../src/workspace-state.js';
import { documentationLabel, DOCUMENT_FORMATS } from '../src/documentation-output.js';
const now = new Date('2026-10-01T12:00:00').getTime();
describe('restored optional documentation formats', () => {
  it.each(DOCUMENT_FORMATS.map(([id]) => id))('uses explicit recorded facts and missing-status labels in %s', documentFormat => {
    const state = newEncounter(); state.documentFormat = documentFormat;
    state.note.diagnosisCategory = 'ischemic';
    state.details = { transferStatus: 'Requested', transferDestination: 'Receiving stroke service', transferAcceptance: 'no', dischargeReview: 'Planning', dischargeDate: '2026-10-02' };
    const note = buildSummary(state, now);
    expect(note).toContain('Receiving service acceptance documented: No');
    expect(note).toContain('future actual-event date; review');
    expect(note).toContain('IVT administration: not documented');
    expect(note).toContain('EVT consent status: not documented');
    if (documentFormat !== 'consultation') expect(note.startsWith(documentationLabel(state))).toBe(true);
  });
  it('qualifies reversed actual dates but allows future planned medication dates', () => {
    const s = newEncounter(); s.note.diagnosisCategory = 'ischemic';
    s.details = { dischargeReview: 'Completed', admissionDate: '2026-09-30', dischargeDate: '2026-09-29', antithromboticPlanType: 'Dual antiplatelet', daptStopDate: '2026-10-10' };
    const output = buildSummary(s, now);
    expect(output).toContain('2026-09-29 (precedes admission; review)');
    expect(output).toContain('Planned DAPT stop date: 2026-10-10');
    expect(output).not.toContain('2026-10-10 (future');
  });
  it('preserves independent IVT/EVT decisions and explicit consent records', () => {
    const s = newEncounter(); s.note.diagnosisCategory = 'ischemic';
    Object.assign(s.actions, { consent: 'Declined', evtConsent: 'Informed consent', evtConsentTime: '2026-10-01T11:00' });
    const note = buildSummary(s, now);
    expect(note).toContain('IVT Consent status: Declined');
    expect(note).toContain('EVT consent status: Informed consent');
    expect(note).toContain('EVT consent time: 2026-10-01T11:00');
    expect(note).not.toContain('EVT puncture:');
  });
  it('invalidates drafts for restored details and format changes, and scans hidden details', () => {
    const s = newEncounter(); s.draft = { text: 'Old note', stale: false, revision: 0 };
    expect(updateEncounter(s, { documentFormat: 'transfer' }).draft.stale).toBe(true);
    expect(updateEncounter(s, { details: { transferStatus: 'Accepted' } }).draft.stale).toBe(true);
    s.details = { transferDestination: 'name@example.invalid' }; s.context = 'follow-up';
    expect(outputWarnings(s)).toContain('Possible email address');
  });
});
