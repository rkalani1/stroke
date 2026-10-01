import { describe, expect, it } from 'vitest';
import { calculateCrClReviewed } from '../src/calculators.js';

describe('unrounded adjusted-weight clearance', () => {
  // At 60 inches, male IBW is 50 kg. At 100 kg, the existing 0.4
  // convention gives 70 kg; at age 68 the formula simplifies to 70/creatinine.
  it.each([
    ['2.334',29.991431019708656,30],
    ['0.7368',95.00542888165038,95]
  ])('preserves the arithmetic before display rounding for creatinine %s', (creatinine,raw,display) => {
    const result=calculateCrClReviewed('68','100','M',creatinine,'152.4');
    expect(result.rawAdjBwValue).toBeCloseTo(raw,10);
    expect(result.adjBwValue).toBe(display);
    expect(result.rawAdjBwValue < display).toBe(raw < display);
    expect(result.rawAdjBwValue > display).toBe(raw > display);
  });
  it.each([undefined,'200'])('retains null adjusted estimates when height is absent or BMI is not above 30: %s', height => {
    const result=calculateCrClReviewed('68','100','M','1',height);
    expect(result.adjBwValue).toBeNull();expect(result.rawAdjBwValue).toBeNull();
  });
});
