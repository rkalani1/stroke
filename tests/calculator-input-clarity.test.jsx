import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Encounter from '../src/Encounter.jsx';
import { newEncounter } from '../src/workspace-state.js';
import { calculateCrClReviewed } from '../src/calculators.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';

const renderRenal = (creatinine, age='70', weight='72') => {
  const state=newEncounter();Object.assign(state.note,{age,weight,sex:'M',creatinine});
  return renderToStaticMarkup(<Encounter state={state} update={()=>{}} now={Date.parse('2026-10-01T18:00:00Z')} />);
};
describe('source-specific calculator input and result clarity',()=>{
  it('retains HAS-BLED clinical definitions at the point of entry',()=>{
    const fields=calculatorDefinitions.find(item=>item.id==='has-bled').fields;
    expect(fields.find(field=>field.key==='renal').label).toMatch(/dialysis.*transplant.*≥200 µmol\/L/);
    expect(fields.find(field=>field.key==='liver').label).toMatch(/cirrhosis.*bilirubin >2× ULN.*AST\/ALT\/ALP >3× ULN/);
    expect(fields.find(field=>field.key==='bleeding').label).toContain('anemia');
  });
  it('does not advertise current treatment BP as an ABCD² shared source',()=>{
    const definition=calculatorDefinitions.find(item=>item.id==='abcd2');
    expect(definition.shared).toEqual(['age']);
    expect(definition.fields.filter(field=>field.type==='number').map(field=>field.key)).toEqual(['initialSystolic','initialDiastolic']);
    expect(definition.limits).toContain('first recorded BP after the TIA');
  });
  it.each([15,30,50,90,95])('qualifies a clearance just below %i despite display rounding',threshold=>{
    const creatinine=String(70/(threshold-0.001)), result=calculateCrClReviewed('70','72','M',creatinine);
    expect(result.rawValue).toBeLessThan(threshold);expect(result.value).toBe(threshold);
    const html=renderRenal(creatinine);
    expect(html).toContain(`below ${threshold} mL/min before rounding`);
    expect(html).toContain(`Unrounded calculation with actual weight: ${result.rawValue} mL/min`);
  });
  it('shows when an estimate just above an integer rounds down',()=>{
    const creatinine=String(70/95.001);
    expect(renderRenal(creatinine)).toContain('above 95 mL/min before rounding');
  });
  it('does not label exactly 30 as below 30 or display an estimate with missing creatinine',()=>{
    expect(renderRenal('2.5','68','75')).not.toContain('below 30 mL/min before rounding');
    expect(renderRenal('')).not.toContain('Unrounded calculation with actual weight');
  });
});
