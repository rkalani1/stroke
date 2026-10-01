import { describe,it,expect } from 'vitest';
import { calculateTNKDoseReviewed as tnk, calculateAlteplaseDoseReviewed as alteplase } from '../src/calculators.js';
// Expected values independently tabulated from Activase §2.1 and TNKase AIS Table1.
// Guideline arithmetic is a separate authority: 0.25mg/kg, maximum25mg.
const fixtures=[[40,10,15,36,3.6,32.4],[80,20,22.5,72,7.2,64.8],[83,20.75,22.5,74.7,7.47,67.23],[100,25,25,90,9,81],[140,25,25,90,9,81],[83.5,20.875,22.5,75.15,7.515,67.635]];
describe('independently derived lytic dose expectations',()=>{
  it.each(fixtures)('%skg guideline arithmetic, labeled bands and consistent alteplase split',(kg,guideline,label,total,bolus,infusion)=>{
    expect(Number(tnk(kg).calculatedDose)).toBe(guideline);expect(Number(tnk(kg,'fda-label').calculatedDose)).toBe(label);
    const a=alteplase(kg);expect(a.totalDose).toBe(total);expect(a.bolus).toBe(bolus);expect(a.infusion).toBe(infusion);expect(a.bolus+a.infusion).toBeCloseTo(a.totalDose,10);expect(tnk(kg).volume).toBe(`${guideline/5} mL`);
  });
  it.each([[59.999,15],[60,17.5],[60.001,17.5],[69.999,17.5],[70,20],[70.001,20],[79.999,20],[80,22.5],[80.001,22.5],[89.999,22.5],[90,25],[90.001,25]])('preserves label boundary at %skg',(kg,dose)=>expect(Number(tnk(kg,'fda-label').calculatedDose)).toBe(dose));
  it.each([[99.999,24.99975,89.9991],[100,25,90],[100.001,25,90]])('checks cap boundary at %skg',(kg,dose,total)=>{expect(Number(tnk(kg).calculatedDose)).toBe(dose);expect(alteplase(kg).totalDose).toBe(total);});
  it.each(['',' ',0,-1,NaN,Infinity,-Infinity,'80kg','176lb',true,null,{},'8.0.0','1e999',351])('rejects invalid or inappropriate-unit %s',value=>{expect(tnk(value)).toBeNull();expect(alteplase(value)).toBeNull();});
  it('never converts authority, arithmetic or cap status into eligibility or administration',()=>{expect(tnk(80,'invalid')).toBeNull();expect(tnk(80).roundingNote).toContain('does not establish IVT eligibility');expect(alteplase(80)).not.toHaveProperty('eligible');expect(alteplase(80)).not.toHaveProperty('administered');});
});
