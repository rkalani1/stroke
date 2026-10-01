import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { TEACHING_PEARLS } from '../src/teaching.js';
const data = JSON.parse(fs.readFileSync('src/guidelines/landmark-trials.json', 'utf8'));
const cards = Object.values(data).flat();
const trial = name => cards.find(card => card.name === name);

describe('source-qualified teaching repairs', () => {
  it('does not promote a pregnancy AHLE case report to a universal treatment or safety rule', () => {
    const pearl = TEACHING_PEARLS.find(p => p.q.includes('AHLE'));
    expect(pearl.a).toContain('single case');
    expect(pearl.a).toContain('cannot establish a universal immunotherapy regimen');
    expect(pearl.a).not.toContain('requires prompt recognition');
  });
  it('retains the 103-card teaching library and working source links', () => {
    expect(cards).toHaveLength(103);
    for (const card of cards) {
      for (const field of ['question', 'design', 'outcomes', 'bottomLine', 'teachingPoint']) {
        expect(card[field]?.trim(), `${card.name}: ${field}`).toBeTruthy();
      }
      for (const url of card.reviewedSources || []) expect(new URL(url).protocol).toBe('https:');
    }
  });
  it('keeps ELAN imaging schedules and its estimation design separate', () => {
    expect(trial('ELAN').design).toContain('day 6-7 for moderate');
    expect(trial('ELAN').design).toContain('day 12-14 for major');
    expect(trial('ELAN').outcomes).toContain('without formal superiority or noninferiority testing');
  });
  it('does not collapse DAWN into one core threshold', () => {
    const text = trial('DAWN').teachingPoint;
    expect(text).toContain('core <21 mL');
    expect(text).toContain('core <31 mL');
    expect(text).toContain('core 31 to <51 mL');
    expect(text).toContain('not the complete current EVT eligibility');
  });
  it('preserves apixaban two-of-three dose-reduction criteria', () => {
    const text = trial('RE-LY / ROCKET-AF / ARISTOTLE / ENGAGE AF').teachingPoint;
    expect(text).toContain('at least two of');
    for (const value of ['≥80', '≤60', '≥1.5']) expect(text).toContain(value);
  });
  it('does not turn HINTS or hearing loss into an untrained stroke rule-out', () => {
    const hint = TEACHING_PEARLS.find(p => p.a.includes('HINTS')).a;
    expect(hint).toContain('trained');
    expect(hint).toContain('MRI/MRA');
    expect(hint).toContain('does not exclude stroke');
  });
});
