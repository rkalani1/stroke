import { describe,it,expect } from 'vitest';
import { calculateTNKDoseReviewed as tnk, calculateAlteplaseDoseReviewed as alteplase } from '../src/calculators.js';
// Expected values independently tabulated from Activase §2.1 and TNKase AIS Table1.
// Guideline arithmetic is a separate authority: 0.25mg/kg, maximum25mg.
// Display rounding: TNK dose/volume to 0.01 mg/mL; alteplase total and bolus to
// 0.1 mg, infusion = rounded total - rounded bolus (bolus + infusion = total).
const fixtures=[[40,10,15,36,3.6,32.4,'2 mL'],[80,20,22.5,72,7.2,64.8,'4 mL'],[83,20.75,22.5,74.7,7.5,67.2,'4.15 mL'],[100,25,25,90,9,81,'5 mL'],[140,25,25,90,9,81,'5 mL'],[83.5,20.88,22.5,75.2,7.5,67.7,'4.18 mL'],[110,25,25,90,9,81,'5 mL']];
describe('independently derived lytic dose expectations',()=>{
  it.each(fixtures)('%skg guideline arithmetic, labeled bands and consistent alteplase split',(kg,guideline,label,total,bolus,infusion,volume)=>{
    expect(Number(tnk(kg).calculatedDose)).toBe(guideline);expect(Number(tnk(kg,'fda-label').calculatedDose)).toBe(label);
    const a=alteplase(kg);expect(a.totalDose).toBe(total);expect(a.bolus).toBe(bolus);expect(a.infusion).toBe(infusion);expect(a.bolus+a.infusion).toBeCloseTo(a.totalDose,10);expect(tnk(kg).volume).toBe(volume);
  });
  it('shows a pound-converted weight as sensible bedside values', () => {
    expect(tnk(79.832257)).toMatchObject({ calculatedDose: '19.96', volume: '3.99 mL', isMaxDose: false });
    expect(alteplase(79.832257)).toMatchObject({ totalDose: 71.8, bolus: 7.2, infusion: 64.6 });
  });
  it('reports delivered mg/kg and the >0.30 mg/kg warning for US label bands', () => {
    const low = tnk(40, 'fda-label');
    expect(low.deliveredMgPerKg).toBe(0.375);
    expect(low.roundingNote).toMatch(/Label band delivers 0\.375 mg\/kg/);
    expect(low.roundingNote).toMatch(/above 0\.30 mg\/kg/);
    expect(low.roundingNote).toMatch(/within 3 hours of symptom onset/);
    const typical = tnk(75, 'fda-label');
    expect(typical.deliveredMgPerKg).toBe(0.267);
    expect(typical.roundingNote).not.toMatch(/above 0\.30 mg\/kg/);
    expect(tnk(40).roundingNote).not.toMatch(/Label band/);
  });
  it.each([[59.999,15],[60,17.5],[60.001,17.5],[69.999,17.5],[70,20],[70.001,20],[79.999,20],[80,22.5],[80.001,22.5],[89.999,22.5],[90,25],[90.001,25]])('preserves label boundary at %skg',(kg,dose)=>expect(Number(tnk(kg,'fda-label').calculatedDose)).toBe(dose));
  // Rounded display reaches 25 mg / 90 mg just below 100 kg; cap flags use unrounded arithmetic.
  it.each([[99.999,25,90,false,false],[100,25,90,true,false],[100.001,25,90,true,true]])('checks cap boundary at %skg',(kg,dose,total,tnkMax,alteplaseCapped)=>{expect(Number(tnk(kg).calculatedDose)).toBe(dose);expect(tnk(kg).isMaxDose).toBe(tnkMax);expect(alteplase(kg).totalDose).toBe(total);expect(alteplase(kg).capped).toBe(alteplaseCapped);});
  it.each(['',' ',0,-1,NaN,Infinity,-Infinity,'80kg','176lb',true,null,{},'8.0.0','1e999',351])('rejects invalid or inappropriate-unit %s',value=>{expect(tnk(value)).toBeNull();expect(alteplase(value)).toBeNull();});
  it('never converts authority, arithmetic or cap status into eligibility or administration',()=>{expect(tnk(80,'invalid')).toBeNull();expect(tnk(80).roundingNote).toContain('does not establish IVT eligibility');expect(alteplase(80)).not.toHaveProperty('eligible');expect(alteplase(80)).not.toHaveProperty('administered');});
});
