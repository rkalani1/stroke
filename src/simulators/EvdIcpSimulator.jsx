/** Reference-only replacement for the unvalidated EVD/ICP simulation. */
import React from 'react';

// Preserve import compatibility without exposing fabricated measurements,
// compliance classes, drainage rates, or threshold-driven treatment tiers.
export function computeMeasuredICP() { return null; }
export function computeActiveTier() { return null; }
export function computeComplianceBadge() {
  return { level: 'UNAVAILABLE', label: 'No validated simulation result' };
}
export function computeDripInterval() {
  return { available: false, drips: null, intervalMs: null, drivingPressure: null };
}

export function EvdIcpSimulator() {
  return (
    <section className="rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-labelledby="evd-reference-title">
      <h3 id="evd-reference-title" className="font-semibold">EVD and ICP: reference only</h3>
      <p>The device simulation and automatic treatment tiers are unavailable. The former model did not establish reliable drainage, obstruction, air-bubble, or compliance behavior.</p>
      <p className="mt-2">An EVD requires trained staff, the specific device instructions, and an individualized order. Interpret a pressure measurement with the examination, imaging, drainage state, leveling, waveform, and clinical trajectory. Do not infer treatment from one pressure value.</p>
      <a className="underline" href="https://doi.org/10.1007/s12028-015-0224-8" target="_blank" rel="noopener noreferrer">Neurocritical Care Society EVD consensus statement</a>
    </section>
  );
}
export default EvdIcpSimulator;
