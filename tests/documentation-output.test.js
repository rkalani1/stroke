import { describe, expect, it } from 'vitest';
import { buildSummary, newEncounter, updateEncounter, outputWarnings } from '../src/workspace-state.js';
import { documentationLabel, DOCUMENT_FORMATS } from '../src/documentation-output.js';
const now = new Date('2026-10-01T12:00:00').getTime();
describe('restored optional documentation formats', () => {
  it.each(['phone', 'video'])('produces a compact team handoff from current canonical facts in %s', consultationType => {
    const state = newEncounter();
    Object.assign(state, { consultationType, documentFormat: 'handoff', nihssSource: 'reported', reportedNihss: '0', drug: 'TNK', rationale: 'Confirm receiving-team plan.' });
    Object.assign(state.note, { diagnosisCategory: 'ischemic', age: '65', sex: 'F', lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '11:00', ctResults: 'No hemorrhage described', ctaResults: 'No occlusion described', pmh: 'LONG HISTORY NOT FOR THE COMPACT HANDOFF' });
    Object.assign(state.actions, { administrationTime: '2026-10-01T11:30', administered: false, disposition: 'Transfer', handoff: 'Pending transport.' });
    state.details = { transferStatus: 'Requested', transferDestination: 'Receiving stroke service', transferAcceptance: 'no', dischargeReview: 'Planning', hospitalCourse: 'LONG HOSPITAL COURSE NOT FOR HANDOFF' };
    const note = buildSummary(state, now);
    expect(note).toMatch(/^Team handoff\n65 year old female · Ischemic stroke/);
    expect(note).toContain('Last known well: UNKNOWN');
    expect(note).toContain('discovery does not establish onset');
    expect(note).toContain('NIHSS: 0/42 (reported total)');
    expect(note).toContain('IVT administration: not documented with a valid drug and timestamp');
    expect(note).toContain('Receiving service acceptance documented: No');
    expect(note).toContain('Handoff: Pending transport.');
    expect(note).not.toContain('LONG HISTORY');
    expect(note).not.toContain('LONG HOSPITAL');
    expect(note).not.toContain('TNK at');
    expect(note.split(state.rationale)).toHaveLength(2);
    state.actions.administered = true;
    expect(buildSummary(state, now)).toContain('TNK at 2026-10-01 11:30');
    state.actions.administrationTime = '2026-10-01T13:00';
    expect(buildSummary(state, now)).toContain('entered time is invalid or future');
    expect(buildSummary(state, now)).not.toContain('TNK at');
    state.context = 'follow-up';
    const followup = buildSummary(state, now);
    expect(followup).toContain('· follow-up');
    expect(followup).not.toContain('IVT administration');
    expect(followup).not.toContain('Receiving stroke service');
  });
  it('keeps compact handoff and discharge output freshness tied to their source fields', () => {
    const state = newEncounter(); state.documentFormat = 'handoff'; state.draft = { text: 'Old handoff', stale: false };
    for (const patch of [{ documentFormat: 'discharge' }, { reportedNihss: '7' }, { details: { dischargeNihss: '0' } }, { actions: { ...state.actions, handoff: 'Changed plan' } }]) {
      expect(updateEncounter(state, patch).draft.stale).toBe(true);
    }
    state.details.dischargeScoreSource = 'contact@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
  });
  it.each(DOCUMENT_FORMATS.filter(([id]) => id !== 'handoff').map(([id]) => id))('uses explicit recorded facts and missing-status labels in %s', documentFormat => {
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
    expect(note).toContain('EVT consent time: 2026-10-01 11:00');
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
