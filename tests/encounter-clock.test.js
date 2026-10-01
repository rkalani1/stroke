import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { activeNote, buildSummary, encounterTiming, newEncounter, outputWarnings, protocolEncounter, updateEncounter, validTimestamp } from '../src/workspace-state.js';
import { encounterClockTimestamp, localTimestamp, timelineIntervals } from '../src/encounter-timeline.js';
import { evaluateWakeUpScreen } from '../src/encounter-clinical-review.js';
import { computeNeurocheckSchedule } from '../src/calculators-extended.js';

const instant = '2026-11-01T09:30:00.000Z', now = Date.parse(instant);
const priorTZ = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
afterAll(() => { if (priorTZ === undefined) delete process.env.TZ; else process.env.TZ = priorTZ; });
const recorded = (prefix, state = newEncounter(), at = now) => {
  const value = localTimestamp(at), [date, time] = value.split('T');
  return updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, [`${prefix}Date`]: date, [`${prefix}Time`]: time, [`${prefix}Clock`]: { value, instant: new Date(at).toISOString() } } }));
};

describe('explicit clock instant provenance', () => {
  it.each(['lkw', 'discovery'])('keeps the second repeated hour for %s across timing, source screens and documentation', prefix => {
    const state = recorded(prefix);
    state.note.diagnosisCategory = 'ischemic';
    state.note.lkwUnknown = prefix === 'discovery';
    expect(state.note[`${prefix}Time`]).toBe('01:30:00');
    expect(encounterClockTimestamp(state.note, prefix)).toBe(instant);
    expect(encounterTiming(state.note, now)).toMatchObject({ timestamp: instant, clock: { elapsedMinutes: 0 }, hours: prefix === 'lkw' ? 0 : null });
    expect(protocolEncounter(state, now).ivt.hoursFromLKW).toBe(prefix === 'lkw' ? 0 : '');
    expect(buildSummary(state, now)).toContain(`01:30:00 (recorded instant ${instant})`);
    if (prefix === 'discovery') expect(evaluateWakeUpScreen(activeNote(state), new Date(now)).discoveryHours).toBe(0);
    expect(outputWarnings(state)).toEqual([]);
  });

  it('uses exact shortcut LKW time for the existing EXTEND screen', () => {
    const state = recorded('lkw');
    Object.assign(state.note, { age: '60', premorbidMRS: '0', ctHemorrhageStatus: 'absent', coreVolume: '20', penumbraVolume: '50' });
    state.nihssSource = 'reported'; state.reportedNihss = '8';
    expect(evaluateWakeUpScreen(activeNote(state), new Date(now + 4 * 3600000)).withinExtendTime).toBe(false);
    expect(evaluateWakeUpScreen(activeNote(state), new Date(now + 4.5 * 3600000)).withinExtendTime).toBe(true);
  });

  it.each(['lkw', 'discovery'])('irreversibly drops %s clock provenance after a manual edit, clear or edit/revert', prefix => {
    for (const [field, value] of [['Date', '2026-10-31'], ['Time', '01:31'], ['Date', ''], ['Time', '']]) {
      const state = recorded(prefix), key = `${prefix}${field}`, original = state.note[key];
      const edited = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, [key]: value } }));
      expect(edited.note[`${prefix}Clock`]).toBeNull();
      const reverted = updateEncounter(edited, previous => ({ ...previous, note: { ...previous.note, [key]: original } }));
      expect(reverted.note[`${prefix}Clock`]).toBeNull();
      expect(encounterClockTimestamp(reverted.note, prefix)).toBe('2026-11-01T01:30:00');
      if (!value) expect(encounterClockTimestamp(edited.note, prefix)).toBe('');
      expect(recorded(prefix, reverted).note[`${prefix}Clock`]?.instant).toBe(instant);
    }
  });

  it('retains the instant through unrelated edits and system timezone changes and honors unknown LKW', () => {
    const state = recorded('discovery', recorded('lkw', newEncounter(), now - 3600000));
    const changed = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, symptoms: 'weakness' } }));
    process.env.TZ = 'America/New_York';
    try { expect(encounterTiming(changed.note, now).clock.elapsedMinutes).toBe(60); }
    finally { process.env.TZ = 'America/Los_Angeles'; }
    changed.note.lkwUnknown = true;
    expect(encounterTiming(changed.note, now)).toMatchObject({ label: 'Discovery', clock: { elapsedMinutes: 0 }, hours: null });
    changed.note.discoveryTime = '';
    expect(encounterTiming(changed.note, now).clock).toBeNull();
    expect(newEncounter().note).toMatchObject({ lkwClock: null, discoveryClock: null });
  });

  it('uses ISO and offset action timestamps without inferring administration', () => {
    const state = newEncounter(); state.note.diagnosisCategory = 'ischemic'; state.drug = 'TNK';
    for (const value of [instant, '2026-11-01T01:30:00-08:00']) {
      state.actions.administrationTime = value;
      expect(validTimestamp(value, now).getTime()).toBe(now);
      expect(computeNeurocheckSchedule(value).checks[0].at.getTime()).toBe(now + 15 * 60000);
      expect(outputWarnings(state)).toEqual([]);
      expect(buildSummary(state, now)).toContain('IVT administration: not documented');
    }
    state.actions.administered = true;
    state.timeline.arrival = '2026-11-01T09:00:00.000Z';
    expect(timelineIntervals(state, now)).toContainEqual({ label: 'Door to IVT', minutes: 30, text: '30 min' });
    expect(buildSummary(state, now)).toContain('TNK at 2026-11-01T01:30:00-08:00');
  });

  it('withholds future or malformed recorded clocks and scans malformed timestamp text', () => {
    const state = recorded('lkw');
    state.note.lkwClock.instant = '2026-11-01T09:31:00.000Z';
    expect(encounterTiming(state.note, now).clock).toBeNull();
    expect(buildSummary(state, now)).toContain('invalid or future');
    state.note.lkwClock.instant = 'user@example.invalid';
    expect(encounterTiming(state.note, now).clock).toBeNull();
    expect(outputWarnings(state)).toContain('Possible email address');
    state.note.lkwClock = null;
    state.actions.administrationTime = 'user@example.invalid';
    expect(outputWarnings(state)).toContain('Possible email address');
  });
});
