import { describe, it, expect } from 'vitest';
import { newEncounter } from '../src/workspace-state.js';
import { timelineIntervals, formatTimeline, localTimestamp } from '../src/encounter-timeline.js';
const now = new Date('2026-10-01T12:00:00').getTime();
describe('explicit event timeline', () => {
  it('does not infer events or start an unentered consultation', () => {
    const s = newEncounter(); expect(timelineIntervals(s, now)).toEqual([]); expect(formatTimeline(s, now)).toBe('');
    s.note.diagnosisCategory = 'ischemic'; s.timeline = { arrival: '2026-10-01T10:00' }; s.actions.administrationTime = '2026-10-01T10:30';
    expect(timelineIntervals(s, now)).toEqual([]);
    s.actions.administered = true; s.drug = 'TNK'; expect(timelineIntervals(s, now)).toContainEqual({ label: 'Door to IVT', minutes: 30, text: '30 min' });
  });
  it('uses exact dates through midnight without inferring the next day', () => {
    const s = newEncounter(); s.timeline = { arrival: '2026-09-30T23:50', ctStart: '2026-10-01T00:10' };
    expect(timelineIntervals(s, now)[0].minutes).toBe(20);
    s.timeline.ctStart = '2026-09-30T00:10'; expect(timelineIntervals(s, now)[0].minutes).toBeNull();
  });
  it('validates malformed/future dates and computes elapsed time from the wall clock', () => {
    const s = newEncounter(); s.timeline = { consultStart: '2026-10-01T11:00' };
    expect(timelineIntervals(s, now)[0].minutes).toBe(60);
    expect(timelineIntervals(s, now + 60000)[0].minutes).toBe(61);
    s.timeline.consultEnd = '2026-10-01T11:10'; expect(timelineIntervals(s, now)[0].minutes).toBe(10);
    s.timeline.consultEnd = '2026-10-01T13:10'; expect(timelineIntervals(s, now)[0].minutes).toBeNull();
    s.timeline.consultStart = '2026-02-30T11:00'; expect(formatTimeline(s, now)).toContain('invalid or future');
  });
  it('hides incompatible acute intervals in follow-up and preserves explicit zero', () => {
    const s = newEncounter(); s.context = 'follow-up'; s.timeline = { consultStart: localTimestamp(now), consultEnd: localTimestamp(now), arrival: '2026-10-01T10:00', ctStart: '2026-10-01T10:30' };
    expect(timelineIntervals(s, now)).toEqual([{ label: 'Consultation elapsed', minutes: 0, text: '0 min' }]);
    expect(formatTimeline(s, now)).not.toContain('ED arrival');
  });
  it('uses the absolute clock through a repeated local hour and withholds ambiguous manual times', () => {
    const prior = process.env.TZ; process.env.TZ = 'America/Los_Angeles';
    try {
      const s = newEncounter(), repeatedHour = Date.parse('2026-11-01T01:30:00-08:00');
      s.timeline = { consultStart: '2026-11-01T00:30' };
      expect(timelineIntervals(s, repeatedHour)[0].minutes).toBe(120);
      s.timeline.consultEnd = '2026-11-01T01:30';
      expect(timelineIntervals(s, repeatedHour)[0].minutes).toBeNull();
      s.timeline.consultEnd = '2026-11-01T01:30:00-08:00';
      expect(timelineIntervals(s, repeatedHour)[0].minutes).toBe(120);
    } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
  });
});
