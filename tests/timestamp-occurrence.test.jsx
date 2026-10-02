import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import TimestampOccurrence from '../src/components/TimestampOccurrence.jsx';

const originalZone = process.env.TZ;
afterEach(() => { if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone; });
const render = (value, instant) => renderToStaticMarkup(<TimestampOccurrence label="LKW" value={value} instant={instant} onChange={() => {}} />);

describe('clock occurrence selection', () => {
  it('requires a choice and offers both occurrences without inferring from the current clock', () => {
    process.env.TZ = 'America/Los_Angeles';
    const markup = render('2026-11-01T01:30', '2026-11-01T01:30');
    expect(markup).toContain('<option value="" selected="">');
    expect(markup).toContain('First occurrence (UTC−07:00)');
    expect(markup).toContain('Second occurrence (UTC−08:00)');
  });
  it('matches a selected instant at the displayed whole-second precision', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(render('2026-11-01T01:30:00', '2026-11-01T09:30:00.123Z')).toContain('<option value="2026-11-01T09:30:00.000Z" selected="">Second occurrence');
  });
  it('does not substitute a same-offset instant after a system timezone change', () => {
    process.env.TZ = 'America/New_York';
    const markup = render('2026-11-01T01:30:00', '2026-11-01T09:30:00.123Z');
    expect(markup).toContain('<option value="2026-11-01T09:30:00.123Z" selected="">Preserved recorded instant');
    expect(markup).not.toContain('<option value="2026-11-01T06:30:00.000Z" selected');
  });
  it('does not add a choice for an ordinary local time or an invalid calendar entry', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(render('2026-10-01T10:00', '2026-10-01T10:00')).toBe('');
    expect(render('2026-02-30T10:00', '2026-02-30T10:00')).toBe('');
  });
});
