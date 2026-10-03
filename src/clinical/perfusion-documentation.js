import { numericInput } from '../encounter-clinical-review.js';

// Describe entered CTP measurements and arithmetic, never treatment eligibility.
export function formatPerfusionForExport(note = {}) {
  const values = note.ctpStructured || {};
  const has = value => value !== undefined && value !== null && String(value).trim() !== '';
  const core = numericInput(values.coreVolume, { min: 0 });
  const hypoperfusion = numericInput(values.penumbraVolume, { min: 0 });
  const parts = [];
  if (has(values.coreVolume)) parts.push(core === null ? 'Core: invalid measurement; review required' : `Core: ${core} mL`);
  if (has(values.penumbraVolume)) parts.push(hypoperfusion === null ? 'Total hypoperfused volume: invalid measurement; review required' : `Total hypoperfused volume (Tmax >6 s): ${hypoperfusion} mL`);
  if (core !== null && hypoperfusion !== null) {
    if (hypoperfusion < core) {
      parts.push('Perfusion volumes conflict: total hypoperfused volume is below core; reconcile measurements');
    } else {
      const mismatch = hypoperfusion - core;
      parts.push(`Calculated mismatch volume: ${Number.isFinite(mismatch * 10) ? Math.round(mismatch * 10) / 10 : mismatch} mL`);
      const ratio = core > 0 ? hypoperfusion / core : null;
      const ratioText = !Number.isFinite(ratio) ? 'not calculable; review values' : ratio < 1000 ? ratio.toFixed(2) : '>999';
      parts.push(core === 0
        ? 'Mismatch ratio: not calculable (core 0); review volumes and complete eligibility'
        : `Mismatch ratio: ${ratioText}; arithmetic does not establish eligibility`);
    }
  }
  if (typeof note.ctpResults === 'string' && note.ctpResults.trim()) parts.push(note.ctpResults);
  return parts.join('; ');
}
