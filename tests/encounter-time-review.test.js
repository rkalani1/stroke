import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildSummary, encounterTiming, newEncounter, protocolEncounter, updateEncounter, validTimestamp } from '../src/workspace-state.js';
import { encounterClockTimestamp, evtReperfusionIssue, formatTimeline, timelineIntervals } from '../src/encounter-timeline.js';
import { computeNeurocheckSchedule } from '../src/calculators-extended.js';

const originalZone = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
afterAll(() => { if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone; });
const now = Date.parse('2026-11-01T10:00:00Z');
const acute = format => {
  const state = newEncounter(); state.consultationType = format;
  state.note.diagnosisCategory = 'ischemic';
  return state;
};

describe('reconciled event timing in every documentation projection', () => {
  it.each(['phone', 'video'])('flags reversed EVT events in %s even without another timeline entry', format => {
    const state = acute(format);
    Object.assign(state.actions, { punctureTime: '2026-11-01T08:30:00Z', reperfusionTime: '2026-11-01T08:00:00Z' });
    expect(evtReperfusionIssue(state, now)).toContain('reperfusion precedes puncture');
    expect(buildSummary(state, now)).toContain('EVT reperfusion: 2026-11-01 01:00:00 (UTC−07:00) (EVT reperfusion precedes puncture');
    expect(formatTimeline(state, now)).toContain('Puncture to reperfusion: Invalid');
    state.actions.reperfusionTime = state.actions.punctureTime;
    expect(evtReperfusionIssue(state, now)).toBe('');
    expect(timelineIntervals(state, now)).toContainEqual({ label: 'Puncture to reperfusion', minutes: 0, text: '0 min' });
    state.actions.reperfusionTime = '2026-11-01T09:00:00Z';
    expect(timelineIntervals(state, now)).toContainEqual({ label: 'Puncture to reperfusion', minutes: 30, text: '30 min' });
    state.actions.punctureTime = '';
    expect(evtReperfusionIssue(state, now)).toBe(''); expect(timelineIntervals(state, now)).toEqual([]);
  });

  it.each(['phone', 'video'])('withholds ambiguous administration/consent/procedure timestamps in %s', format => {
    const state = acute(format); state.drug = 'TNK'; state.actions.administered = true;
    Object.assign(state.actions, { administrationTime: '2026-11-01T01:31', punctureTime: '2026-11-01T01:32', reperfusionTime: '2026-11-01T01:33', consent: 'Informed consent', consentTime: '2026-11-01T01:25', evtConsent: 'Surrogate consent', evtConsentTime: '2026-11-01T01:26' });
    expect(validTimestamp(state.actions.administrationTime, now)).toBeNull();
    expect(computeNeurocheckSchedule(state.actions.administrationTime)).toBeNull();
    const text = buildSummary(state, now);
    expect(text).not.toContain('TNK at');
    for (const label of ['EVT puncture', 'EVT reperfusion', 'IVT Consent time', 'EVT consent time']) expect(text).toContain(`${label}: ambiguous local time`);
    state.actions.administrationTime = '2026-11-01T01:31:00-08:00';
    expect(buildSummary(state, now)).toContain('TNK at 2026-11-01 01:31:00 (UTC−08:00)');
    expect(computeNeurocheckSchedule(state.actions.administrationTime).checks[0].at.toISOString()).toBe('2026-11-01T09:46:00.000Z');
  });

  it.each(['lkw', 'discovery'])('keeps ambiguous %s unresolved until explicitly choosing an occurrence', prefix => {
    let state = acute('phone'); state.note.lkwUnknown = prefix === 'discovery';
    Object.assign(state.note, { [`${prefix}Date`]: '2026-11-01', [`${prefix}Time`]: '01:31' });
    expect(encounterTiming(state.note, now).clock).toBeNull();
    expect(protocolEncounter(state, now).ivt.hoursFromLKW).toBe('');
    expect(buildSummary(state, now)).toContain('ambiguous local time');
    state.note[`${prefix}Clock`] = { value: '2026-11-01T01:31', instant: '2026-11-01T09:31:00.000Z' };
    expect(encounterTiming(state.note, now).clock.elapsedMinutes).toBe(29);
    state = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, [`${prefix}Time`]: '01:32' } }));
    expect(state.note[`${prefix}Clock`]).toBeNull();
    expect(encounterTiming(state.note, now).clock).toBeNull();
  });

  it.each(['ct', 'cta'])('preserves selected %s instant until its date/time changes or clears', prefix => {
    const state = acute('video');
    Object.assign(state.note, { [`${prefix}Date`]: '2026-11-01', [`${prefix}Time`]: '01:31', [`${prefix}Clock`]: { value: '2026-11-01T01:31', instant: '2026-11-01T09:31:00.000Z' } });
    expect(buildSummary(state, now)).toContain('2026-11-01 01:31 (UTC−08:00)');
    expect(encounterClockTimestamp(updateEncounter(state, { rationale: 'Reviewed' }).note, prefix)).toBe('2026-11-01T09:31:00.000Z');
    for (const time of ['01:32', '']) {
      const edited = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, [`${prefix}Time`]: time } }));
      expect(edited.note[`${prefix}Clock`]).toBeNull();
      expect(buildSummary(edited, now)).not.toContain('01:31 (UTC−08:00)');
    }
  });

  it('does not export or flag retained acute EVT values in an incompatible context', () => {
    const state = acute('phone'); Object.assign(state.actions, { punctureTime: '2026-11-01T08:30:00Z', reperfusionTime: '2026-11-01T08:00:00Z' });
    for (const patch of [{ context: 'follow-up' }, { context: 'acute', note: { ...state.note, diagnosisCategory: 'ich' } }]) {
      const changed = updateEncounter(state, patch);
      expect(evtReperfusionIssue(changed, now)).toBe('');
      expect(buildSummary(changed, now)).not.toContain('EVT reperfusion');
      expect(timelineIntervals(changed, now)).toEqual([]);
    }
  });
});
