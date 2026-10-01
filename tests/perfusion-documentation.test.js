import { describe, expect, it } from 'vitest';
import { formatPerfusionForExport } from '../src/clinical/perfusion-documentation.js';

describe('perfusion measurement export', () => {
  it.each([
    ['0', '1', 1], ['0', '20', 20], [0, 20, 20], [0, 0, 0]
  ])('does not infer a favorable ratio from zero core %j and total volume %j', (coreVolume, penumbraVolume, mismatch) => {
    const text = formatPerfusionForExport({ ctpStructured: { coreVolume, penumbraVolume } });
    expect(text).toContain('Core: 0 mL');
    expect(text).toContain(`Calculated mismatch volume: ${mismatch} mL`);
    expect(text).toContain('Mismatch ratio: not calculable (core 0); review volumes and complete eligibility');
    expect(text).not.toMatch(/Favorable|Infinity|eligible|ratio: 0/i);
  });

  it.each(['-1', -1, 'Infinity', Infinity, '12abc', true])('marks invalid core %j without calculating a ratio', coreVolume => {
    const text = formatPerfusionForExport({ ctpStructured: { coreVolume, penumbraVolume: '20' } });
    expect(text).toContain('Core: invalid measurement; review required');
    expect(text).toContain('Total hypoperfused volume (Tmax >6 s): 20 mL');
    expect(text).not.toMatch(/Calculated mismatch|Mismatch ratio|Favorable/);
  });

  it('requires reconciliation when total hypoperfused volume is below core', () => {
    const text = formatPerfusionForExport({ ctpStructured: { coreVolume: '20', penumbraVolume: '10' } });
    expect(text).toContain('Perfusion volumes conflict: total hypoperfused volume is below core; reconcile measurements');
    expect(text).not.toMatch(/Calculated mismatch|Mismatch ratio|Favorable/);
  });

  it('describes ordinary arithmetic without determining eligibility', () => {
    const text = formatPerfusionForExport({ ctpStructured: { coreVolume: '10', penumbraVolume: '30' } });
    expect(text).toContain('Calculated mismatch volume: 20 mL');
    expect(text).toContain('Mismatch ratio: 3.00; arithmetic does not establish eligibility');
    expect(text).not.toMatch(/Favorable|screen met|criteria met|eligible/);
  });

  it('withholds an overflowed ratio even when both entered measurements are finite', () => {
    const text = formatPerfusionForExport({ ctpStructured: { coreVolume: '1e-308', penumbraVolume: '1e308' } });
    expect(text).toContain('Mismatch ratio: not calculable');
    expect(text).not.toMatch(/Infinity|NaN|Favorable|screen met|criteria met|eligible/);
  });

  it.each([{}, { coreVolume: null, penumbraVolume: null }, { coreVolume: '', penumbraVolume: '' }])('does not invent measurements for absent fields %j', ctpStructured => {
    expect(formatPerfusionForExport({ ctpStructured })).toBe('');
  });

  it('retains the exact clinician-entered impression alongside measurements and leaves inputs unchanged', () => {
    const ctpResults = 'CTP radiology impression: motion-limited study; clinician review pending.';
    const note = Object.freeze({ ctpStructured: Object.freeze({ coreVolume: 0, penumbraVolume: 20 }), ctpResults });
    const output = formatPerfusionForExport(note);
    expect(output).toContain(ctpResults);
    expect(output.split(ctpResults)).toHaveLength(2);
    expect(note.ctpStructured).toEqual({ coreVolume: 0, penumbraVolume: 20 });
    expect(formatPerfusionForExport({ ctpResults })).toBe(ctpResults);
  });
});
