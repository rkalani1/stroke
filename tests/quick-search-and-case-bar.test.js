import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchIndex, groupResults } from '../src/quick-search-index.js';
import { caseSummary, hoursMinutes } from '../src/components/CaseBar.jsx';
import { newEncounter, updateEncounter } from '../src/workspace-state.js';
import { formatRecordedInstant } from '../src/clinical/timestamp.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';

const reference = {
  topics: [{ id: 'af-timing', title: 'AF anticoagulation timing after stroke', category: 'Secondary prevention', keywords: ['ELAN', 'DOAC'], summary: 'Early DOAC start.' }],
  studies: [{ id: 'elan', title: 'ELAN — early vs later DOAC', year: 2023, keywords: ['AF'], question: 'Timing', population: 'AF', result: 'Noninferior' }],
  calculators: [{ id: 'abcd2', name: 'ABCD²', category: 'TIA' }]
};

describe('global quick search', () => {
  const index = buildSearchIndex(reference);
  it('finds protocol, quick-reference and calculator targets without the reference download', () => {
    const offline = buildSearchIndex(null);
    expect(searchIndex(offline, 'reversal').map(r => r.href)).toContain('#/protocols/ich/reversal');
    expect(searchIndex(offline, 'reversal').map(r => r.href)).toContain('#/protocols/ischemic/qr-reversal');
    expect(searchIndex(offline, 'tPA')[0].href).toMatch(/qr-dose|encounter\/tnk/);
    expect(searchIndex(offline, 'labetalol').map(r => r.href)).toContain('#/protocols/ischemic/qr-bp');
  });
  it('ranks exact names first and requires every term', () => {
    expect(searchIndex(index, 'ELAN')[0].id).toBe('study:elan');
    expect(searchIndex(index, 'abcd2')[0].id).toBe('calc:abcd2');
    expect(searchIndex(index, 'elan zzzz')).toEqual([]);
    expect(searchIndex(index, '')).toEqual([]);
  });
  it('groups results in a stable order', () => {
    const groups = groupResults(searchIndex(index, 'doac')).map(([name]) => name);
    expect(groups.indexOf('Evidence')).toBeLessThan(groups.indexOf('Studies'));
  });
});

describe('case bar projection', () => {
  const now = new Date('2026-10-01T12:00:00').getTime();
  const base = updateEncounter(newEncounter(), prev => ({ ...prev, drug: 'TNK', note: { ...prev.note, diagnosisCategory: 'ischemic', age: '72', sex: 'F', weight: '80', presentingBP: '190/100', glucose: '132', lkwDate: '2026-10-01', lkwTime: '09:00' } }));
  it('shows elapsed h:mm, the 4.5 h countdown and dose arithmetic for acute ischemic stroke', () => {
    const c = caseSummary(base, now);
    expect(c.dx).toBe('Ischemic');
    expect(c.demographics).toBe('72 F');
    expect(c.elapsed).toBe('3:00');
    expect(c.window).toEqual({ text: '4.5 h in 1:30', tone: 'open' });
    expect(c.dose).toEqual({ label: 'TNK', value: '20 mg', detail: '4 mL' });
    expect(c.bpHigh).toBe(true);
  });
  it('flags the last 30 minutes before 4.5 h and hides itself without data', () => {
    expect(caseSummary(base, new Date('2026-10-01T13:10:00').getTime()).window.tone).toBe('caution');
    expect(caseSummary(newEncounter(), now).hasData).toBe(false);
    expect(hoursMinutes(125 * 60000)).toBe('2:05');
  });
  it('never shows a dose outside an acute ischemic encounter', () => {
    expect(caseSummary({ ...base, note: { ...base.note, diagnosisCategory: 'ich' } }, now).dose).toBeNull();
  });
});

describe('exported clinical times', () => {
  it('writes local wall time and adds an offset only for a repeated hour', () => {
    const prior = process.env.TZ; process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatRecordedInstant('2026-10-01T18:30:00.000Z')).toBe('2026-10-01 11:30:00');
      expect(formatRecordedInstant('2026-10-01T11:00')).toBe('2026-10-01 11:00');
      expect(formatRecordedInstant('2026-11-01T09:30:00.000Z')).toBe('2026-11-01 01:30:00 (UTC−08:00)');
      expect(formatRecordedInstant('2026-11-01T08:30:00.000Z')).toBe('2026-11-01 01:30:00 (UTC−07:00)');
      expect(formatRecordedInstant('not a time')).toBe('not a time');
    } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
  });
  it('accepts evidence deep links regardless of case', () => {
    expect(parseWorkspaceRoute('#/evidence/ELAN')).toEqual({ surface: 'evidence', focusId: 'elan' });
  });
});
