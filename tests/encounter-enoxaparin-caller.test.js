import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { calculateCrClReviewed, calculateEnoxaparinDose } from '../src/calculators.js';
import { calculatorField } from '../src/encounter-clinical-review.js';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('const ec = telestrokeNote.enoxCalc || {};');
const caller = source.slice(start, source.indexOf('if (!result)', start));
const evaluate = new Function('telestrokeNote', 'autoSyncCalculators', 'calculateCrClReviewed', 'calculateEnoxaparinDose', 'calculatorField', caller + '\nreturn result;');
const call = (note, sync = true) => evaluate(note, sync, calculateCrClReviewed, calculateEnoxaparinDose, calculatorField);

describe('actual allowed enoxaparin caller', () => {
  it('uses unrounded clearance at the 30 mL/min decision boundary', () => {
    const note = { age: 68, weight: 75, sex: 'M', creatinine: 75 / 29.96 };
    expect(calculateCrClReviewed(note.age, note.weight, note.sex, note.creatinine).value).toBe(30);
    const result = call(note);
    expect(result).toEqual(calculateEnoxaparinDose(75, 29.96));
    expect(result).not.toEqual(calculateEnoxaparinDose(75, 30));
  });
  it('preserves an explicit clearance entry and a deliberate blank', () => {
    const note = { age: 68, weight: 75, sex: 'M', creatinine: 2.5 };
    expect(call({ ...note, enoxCalc: { crCl: '29' } })).toEqual(calculateEnoxaparinDose(75, 29));
    expect(call({ ...note, enoxCalc: { crCl: '' } }).dose).toBeNull();
  });
  it('does not derive a dose from patient fields when synchronization is off', () => {
    expect(call({ age: 68, weight: 75, sex: 'M', creatinine: 2.5 }, false)).toBeNull();
  });
  it('scopes timing to prophylaxis and links the drug-specific source', () => {
    const panel = source.slice(start, source.indexOf('{/* ASPECTS Interactive Scorer */}', start));
    expect(panel).toContain('Prophylaxis timing only:');
    expect(panel).toContain('do not authorize treatment-dose anticoagulation');
    expect(panel).toContain('href={result.sourceUrl}');
  });
});
