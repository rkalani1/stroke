import { numericInput } from '../encounter-clinical-review.js';

// Describe entered CTP measurements and arithmetic, never treatment eligibility.
export function formatPerfusionForExport(note = {}) {
  const values = note.ctpStructured || {};
  const has = value => value !== undefined && value !== null && String(value).trim() !== '';
  const core = numericInput(values.coreVolume, { min: 0 });
  const hypoperfusion = numericInput(values.penumbraVolume, { min: 0 });
  const parts = [];
  if (has(values.coreVolume)) parts.push(core === null ? 'Core: invalid measurement; review required' : `Core: ${core} mL`);
  if (has(values.penumbraVolume)) parts.push(hypoperfusion === null ? 'Total hypoperfused volume: invalid measurement; review required' : `Total hypoperfused volume (as entered, including core): ${hypoperfusion} mL`);
  if (core !== null && hypoperfusion !== null) {
    if (hypoperfusion < core) {
      parts.push('Perfusion volumes conflict: total hypoperfused volume is below core; reconcile measurements');
    } else {
      const mismatch = hypoperfusion - core;
      // A value that rounds onto a trial threshold (mismatch 10 or 15 mL, ratio 1.2 or 1.8) without equaling it keeps
      // two more decimals, so a rounded edge never reads as meeting or missing a screen it does not.
      const shown = (value, places, edges) => { const text = value.toFixed(places); return edges.includes(+text) && Math.abs(+text - value) > 1e-9 ? value.toFixed(places + 2) : text; };
      parts.push(`Calculated mismatch volume: ${Number.isFinite(mismatch * 10) ? +shown(mismatch, 1, [10, 15]) : mismatch} mL`);
      const ratio = core > 0 ? hypoperfusion / core : null;
      const ratioText = !Number.isFinite(ratio) ? 'not calculable; review values' : ratio < 1000 ? shown(ratio, 2, [1.2, 1.8]) : '>999';
      parts.push(core === 0
        ? 'Mismatch ratio: not calculable (core 0); review volumes and complete eligibility'
        : `Mismatch ratio: ${ratioText}; arithmetic does not establish eligibility`);
    }
  }
  if (typeof note.ctpResults === 'string' && note.ctpResults.trim()) parts.push(note.ctpResults.trim());
  return parts.join('; ');
}
