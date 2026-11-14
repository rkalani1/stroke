// Note-text fixes from the 2026-11-14 clinical-logic review (synthetic entries only).
import { describe, expect, it } from 'vitest';
import { buildSummary, newEncounter } from '../src/workspace-state.js';

const now = new Date('2026-11-14T10:00:00').getTime();

describe('one-paragraph Pulsara summary keeps the lines of a multi-line detail entry apart', () => {
  const state = () => {
    const s = newEncounter();
    s.consultationType = 'phone';
    Object.assign(s.note, { diagnosisCategory: 'ischemic', age: '67', sex: 'F', symptoms: 'Left weakness\nRight gaze deviation' });
    s.details = { courseObservations: 'Improving\nNIHSS 2 on recheck', additionalImaging: 'No hemorrhage\nSmall left insular infarct' };
    return s;
  };
  it('separates a line break inside a detail entry with "; ", as the consultation paragraph does', () => {
    const note = buildSummary(state(), now);
    expect(note).toContain('Left weakness; Right gaze deviation');
    expect(note).toContain('Improving; NIHSS 2 on recheck');
    expect(note).toContain('No hemorrhage; Small left insular infarct');
    expect(note).not.toMatch(/No hemorrhage Small left insular infarct|Improving NIHSS 2/);
    expect(note).not.toContain('\n');
  });
  it('keeps an entry that already ends a clause, and abbreviations, intact', () => {
    const s = state();
    s.details.additionalImaging = 'No hemorrhage.\nAspirin 81 mg p.o.\nRepeat CT in 24 h';
    const note = buildSummary(s, now);
    expect(note).toContain('No hemorrhage. Aspirin 81 mg p.o.; Repeat CT in 24 h');
  });
  it('leaves the video consultation format unchanged', () => {
    const s = state(); s.consultationType = 'video';
    expect(buildSummary(s, now)).toContain('No hemorrhage\nSmall left insular infarct');
  });
});

describe('date-order review flags name the field they are compared with', () => {
  it('flags a planned DAPT stop date earlier than the documented start', () => {
    const s = newEncounter(); s.note.diagnosisCategory = 'ischemic';
    s.details = { antithromboticPlanType: 'Dual antiplatelet', daptStartDate: '2026-11-10', daptStopDate: '2026-10-01' };
    expect(buildSummary(s, now)).toContain('Planned DAPT stop date: 2026-10-01 (precedes DAPT start; review)');
  });
  it('does not flag a stop date on or after the start, nor when no start is documented', () => {
    const s = newEncounter(); s.note.diagnosisCategory = 'ischemic';
    s.details = { antithromboticPlanType: 'Dual antiplatelet', daptStartDate: '2026-11-10', daptStopDate: '2026-12-01' };
    expect(buildSummary(s, now)).toContain('Planned DAPT stop date: 2026-12-01');
    expect(buildSummary(s, now)).not.toContain('precedes DAPT start');
    delete s.details.daptStartDate;
    expect(buildSummary(s, now)).not.toContain('precedes');
  });
  it('keeps the discharge-before-admission wording', () => {
    const s = newEncounter(); s.note.diagnosisCategory = 'ischemic';
    s.details = { dischargeReview: 'Completed', admissionDate: '2026-09-30', dischargeDate: '2026-09-29' };
    expect(buildSummary(s, now)).toContain('2026-09-29 (precedes admission; review)');
  });
});
