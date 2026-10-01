import { describe, expect, it } from 'vitest';
import { localDateTimeInputValues, formatEncounterClock, elapsedEncounterTime } from '../src/clinical/encounter-time.js';
import { encounterTiming, newEncounter, updateEncounter } from '../src/workspace-state.js';

describe('canonical Encounter timing after context edits and suspension', () => {
  const now = new Date('2026-10-01T12:00:00').getTime();
  const note = { lkwDate: '2026-10-01', lkwTime: '08:00', lkwUnknown: true, discoveryDate: '2026-10-01', discoveryTime: '10:00' };
  it('uses discovery with its own label and never treats it as known-onset hours', () => {
    const result = encounterTiming(note, now);
    expect(result.label).toBe('Discovery');
    expect(result.clock.elapsedMinutes).toBe(120);
    expect(result.hours).toBeNull();
  });
  it.each(['discoveryDate', 'discoveryTime'])('clearing %s removes the discovery clock rather than falling back to old LKW', key => {
    expect(encounterTiming({ ...note, [key]: '' }, now).clock).toBeNull();
    expect(encounterTiming({ ...note, [key]: '' }, now).timestamp).toBe('');
  });
  it('does not populate discovery merely by changing onset context', () => {
    const state = newEncounter();
    const unknown = updateEncounter(state, previous => ({ ...previous, note: { ...previous.note, lkwUnknown: true } }));
    expect(unknown.note.discoveryDate).toBe('');
    expect(unknown.note.discoveryTime).toBe('');
    expect(encounterTiming(unknown.note, now).clock).toBeNull();
  });
  it('recomputes elapsed time from timestamps after suspension', () => {
    const known = { ...note, lkwUnknown: false };
    expect(encounterTiming(known, now).hours).toBe(4);
    expect(encounterTiming(known, now + 3 * 60 * 60 * 1000).hours).toBe(7);
  });
  it.each(['13:00', '25:00', 'not a clock'])('rejects future or invalid LKW time %s', lkwTime => {
    const result = encounterTiming({ ...note, lkwUnknown: false, lkwTime }, now);
    expect(result.invalid).toBe(true);
    expect(result.clock).toBeNull();
  });
  it('uses the local calendar across midnight west of UTC', () => {
    withTimezone('America/Los_Angeles', () => {
      const result = encounterTiming({ lkwUnknown: true, discoveryDate: '2026-09-30', discoveryTime: '23:30' }, new Date('2026-10-01T08:30:00Z').getTime());
      expect(result.clock.elapsedMinutes).toBe(120);
    });
  });
  it('rejects an unrepresentable local daylight-saving gap', () => {
    withTimezone('America/Los_Angeles', () => {
      expect(encounterTiming({ lkwDate: '2026-03-08', lkwTime: '02:30' }, new Date('2026-03-08T12:00:00Z').getTime()).clock).toBeNull();
    });
  });
});
function withTimezone(timezone, run) {
  const previous = process.env.TZ;
  process.env.TZ = timezone;
  try { run(); } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

describe('elapsed time from the selected encounter reference', () => {
  const now = new Date('2026-10-01T12:00:00Z');

  it('reports two hours from Discovery with the same label and seconds', () => {
    expect(elapsedEncounterTime({ time: new Date('2026-10-01T10:00:00Z'), label: 'Discovery' }, now)).toEqual({
      hours: 2, minutes: 0, total: 2, seconds: 7200, label: 'Discovery', futureWarning: false
    });
  });

  it('keeps whole seconds and minute components consistent for a non-hour interval', () => {
    const result = elapsedEncounterTime({ time: new Date('2026-10-01T09:56:15Z'), label: 'LKW' }, now);
    expect(result).toMatchObject({ hours: 2, minutes: 3, seconds: 7425, label: 'LKW', futureWarning: false });
    expect(result.total).toBeCloseTo(7425 / 3600, 12);
  });

  it.each([null, undefined, {}, { time: null }, { time: new Date(NaN) }, { time: Infinity }])('withholds elapsed time for missing or invalid reference %j', reference => {
    expect(elapsedEncounterTime(reference, now)).toBeNull();
  });

  it.each([new Date(NaN), Infinity, null])('withholds elapsed time for invalid current time %j', invalidNow => {
    expect(elapsedEncounterTime({ time: new Date('2026-10-01T10:00:00Z'), label: 'Discovery' }, invalidNow)).toBeNull();
  });

  it('distinguishes a future reference from a documented zero interval', () => {
    const future = elapsedEncounterTime({ time: new Date('2026-10-01T13:00:00Z'), label: 'Discovery' }, now);
    expect(future).toEqual({ hours: 0, minutes: 0, total: 0, seconds: 0, label: 'Discovery', futureWarning: true });
    expect(elapsedEncounterTime({ time: new Date(now), label: 'Discovery' }, now)).toEqual({ ...future, futureWarning: false });
  });

});
describe('documented encounter time', () => {
  it.each([
    ['America/Los_Angeles', '2026-10-01T02:05:00Z', '2026-09-30', '19:05'],
    ['Asia/Kolkata', '2026-09-30T20:05:00Z', '2026-10-01', '01:35'],
    ['UTC', '2026-10-01T00:05:00Z', '2026-10-01', '00:05']
  ])('pairs the local date and clock for Use Now in %s', (timezone, instant, date, time) => {
    withTimezone(timezone, () => {
      expect(localDateTimeInputValues(new Date(instant))).toEqual({ date, time });
    });
  });

  it.each([
    ['', ''], [undefined, ''], ['00:00', '12:00 am'], ['09:05', '9:05 am'],
    ['12:00', '12:00 pm'], ['23:59:30', '11:59 pm'], ['24:01', '24:01'], ['not documented', 'not documented']
  ])('formats the entered clock %j without substituting the current time', (input, expected) => {
    expect(formatEncounterClock(input)).toBe(expected);
  });

});
