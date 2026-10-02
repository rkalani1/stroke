import { describe, expect, it } from 'vitest';
import { parseTimestamp, timestampCandidates } from '../src/clinical/timestamp.js';
import { computeLKWCountdown, computeNeurocheckSchedule } from '../src/calculators-extended.js';

function inZone(zone, run) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try { run(); }
  finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
}
const instants = value => timestampCandidates(value).map(date => date.toISOString());

describe('explicit timestamp interpretation', () => {
  it('returns both US repeated-hour occurrences without selecting either', () => inZone('America/Los_Angeles', () => {
    expect(instants('2026-11-01T01:31:00')).toEqual(['2026-11-01T08:31:00.000Z', '2026-11-01T09:31:00.000Z']);
    expect(parseTimestamp('2026-11-01T01:31:00')).toBeNull();
    expect(instants('2026-11-01T01:31:12.345')).toEqual(['2026-11-01T08:31:12.345Z', '2026-11-01T09:31:12.345Z']);
    expect(parseTimestamp('2026-11-01T00:31').toISOString()).toBe('2026-11-01T07:31:00.000Z');
    expect(parseTimestamp('2026-11-01T02:31').toISOString()).toBe('2026-11-01T10:31:00.000Z');
  }));

  it('derives a half-hour repeat and gap from the actual zone', () => inZone('Australia/Lord_Howe', () => {
    expect(instants('2026-04-05T01:45')).toEqual(['2026-04-04T14:45:00.000Z', '2026-04-04T15:15:00.000Z']);
    expect(parseTimestamp('2026-04-05T01:45')).toBeNull();
    expect(timestampCandidates('2026-10-04T02:15')).toEqual([]);
    expect(parseTimestamp('2026-10-04T02:30').toISOString()).toBe('2026-10-03T15:30:00.000Z');
  }));

  it('accepts either explicit occurrence and preserves milliseconds', () => inZone('America/Los_Angeles', () => {
    for (const [value, expected] of [
      ['2026-11-01T01:31-07:00', '2026-11-01T08:31:00.000Z'],
      ['2026-11-01T01:31-08:00', '2026-11-01T09:31:00.000Z'],
      ['2026-11-01T09:31:00.1Z', '2026-11-01T09:31:00.100Z'],
      ['2026-11-01T09:31:00.12Z', '2026-11-01T09:31:00.120Z'],
      ['2026-11-01T01:31:12.345-08:00', '2026-11-01T09:31:12.345Z'],
      ['2026-10-01T12:30:00+05:45', '2026-10-01T06:45:00.000Z']
    ]) {
      expect(instants(value)).toEqual([expected]);
      expect(parseTimestamp(value).toISOString()).toBe(expected);
    }
  }));

  it('rejects skipped local times and invalid written dates before Date normalization', () => inZone('America/Los_Angeles', () => {
    for (const value of ['2026-03-08T02:30', '2026-02-30T12:00', '2026-02-30T12:00Z', '2025-02-29T12:00-08:00', '2026-13-01T12:00', '2026-00-01T12:00', '2026-01-00T12:00', '2026-01-32T12:00', '2026-10-01T24:00', '2026-10-01T12:60', '2026-10-01T12:30:60', '2026-10-01T12:30+24:00', '2026-10-01T12:30+00:60', '0000-01-01T00:00Z', '2026-10-01T12:00:00.1234Z', '2026-10-01', '12:30', '1', '', null, undefined, 0, new Date()]) {
      expect(timestampCandidates(value), String(value)).toEqual([]);
      expect(parseTimestamp(value), String(value)).toBeNull();
    }
    // Explicit offsets identify instants even if that civil time is skipped in the system zone.
    expect(parseTimestamp('2026-03-08T02:30-08:00').toISOString()).toBe('2026-03-08T10:30:00.000Z');
  }));

  it('preserves ordinary local values, leap days and years below 100', () => inZone('UTC', () => {
    for (const [value, expected] of [
      ['2026-10-01T12:34', '2026-10-01T12:34:00.000Z'],
      ['2026-10-01T12:34:56.7', '2026-10-01T12:34:56.700Z'],
      ['2024-02-29T00:00:00.001', '2024-02-29T00:00:00.001Z'],
      ['0001-01-01T00:00', '0001-01-01T00:00:00.000Z'],
      ['0099-12-31T23:59Z', '0099-12-31T23:59:00.000Z']
    ]) expect(instants(value)).toEqual([expected]);
  }));

  it('keeps candidate discovery independent of the current clock', () => inZone('America/Los_Angeles', () => {
    const now = Date.parse('2026-11-01T09:00Z');
    expect(instants('2026-11-01T01:30')).toEqual(['2026-11-01T08:30:00.000Z', '2026-11-01T09:30:00.000Z']);
    expect(computeLKWCountdown('2026-11-01T01:30', now)).toBeNull();
    expect(computeLKWCountdown('2026-11-01T01:30-07:00', now).elapsedMinutes).toBe(30);
    expect(computeLKWCountdown('2026-11-01T01:30-08:00', now)).toBeNull();
    for (const invalidNow of [NaN, Infinity, 1e20]) expect(computeLKWCountdown('2026-11-01T08:30Z', invalidNow)).toBeNull();
  }));

  it('rejects ambiguous/invalid schedule starts while preserving the schedule and future policy', () => inZone('America/Los_Angeles', () => {
    for (const value of ['2026-11-01T01:30', '2026-03-08T02:30', '2026-02-30T12:00Z', '', '1']) expect(computeNeurocheckSchedule(value)).toBeNull();
    const schedule = computeNeurocheckSchedule('2026-11-01T01:30-08:00');
    expect(schedule.start.toISOString()).toBe('2026-11-01T09:30:00.000Z');
    expect(schedule.checks).toHaveLength(36);
    expect(schedule.checks[0].at.toISOString()).toBe('2026-11-01T09:45:00.000Z');
    expect(schedule.end.toISOString()).toBe('2026-11-02T09:30:00.000Z');
    expect(computeNeurocheckSchedule('2099-01-01T00:00Z')).not.toBeNull();
  }));
});
