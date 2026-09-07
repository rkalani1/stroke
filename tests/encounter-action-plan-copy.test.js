import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { documentedNihssValue, treatmentCourseStatus } from '../src/encounter-decision-status.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const marker = source.indexOf('// Pathway-specific summary');
const start = source.indexOf("if (pathwayType === 'ischemic') {", marker);
const end = source.indexOf("} else if (pathwayType === 'ich')", start);
if (marker < 0 || start < 0 || end < 0) throw new Error('Action-plan copy block not found');
const body = source.slice(source.indexOf('{', start) + 1, end);
const render = new Function('telestrokeNote', 'treatmentCourseStatus', `let note = ''; ${body}; return note;`);
const copy = note => render(note, treatmentCourseStatus);

describe('Actual Encounter action-plan copied treatment summary', () => {
  it('preserves documented NIHSS zero and leaves an unexamined default blank', () => {
    const prefix = source.slice(source.lastIndexOf('const recs = getContextualRecommendations();', marker), marker);
    const assignment = prefix.match(/const nihss = ([^;]+);/);
    if (!assignment) throw new Error('Copied action-plan NIHSS binding not found');
    const value = new Function('getDocumentedNihss', 'telestrokeNote', 'nihssScore', `return ${assignment[1]};`);
    expect(value(() => documentedNihssValue({}, 0, false), {}, 0)).toBe('');
    expect(value(() => documentedNihssValue({ nihss: 0 }, 3, true), { nihss: 0 }, 3)).toBe('0');
  });
  it('does not turn missing decisions into treatment withheld', () => {
    const text = copy({ tnkRecommended: false, evtRecommended: false });
    expect(text).toContain('TNK: Decision not documented');
    expect(text).toContain('EVT: Decision not documented');
    expect(text).not.toContain('Not recommended');
    expect(text).not.toContain('administered');
  });
  it('distinguishes recommendations from administration and completion', () => {
    const text = copy({ tnkRecommended: true, evtRecommended: true });
    expect(text).toContain('TNK: Recommended; administration not documented');
    expect(text).toContain('EVT: Recommended; procedure completion not documented');
    expect(text).not.toContain('recommended and administered');
  });
  it('reports explicit negative decisions', () => {
    const text = copy({ tnkRecommended: false, tnkDecisionRecorded: true, evtRecommended: false, evtDecisionRecorded: true });
    expect(text).toContain('TNK: Not recommended');
    expect(text).toContain('EVT: Not recommended');
  });
  it('reports alternate administration time and procedure start without inventing completion', () => {
    const text = copy({ dtnTnkAdministered: '08:30', punctureTime: '09:10' });
    expect(text).toContain('TNK: Administration recorded at 08:30');
    expect(text).toContain('EVT: Puncture recorded at 09:10; procedure completion not documented');
    expect(text).not.toContain('Transfer to');
  });
});
