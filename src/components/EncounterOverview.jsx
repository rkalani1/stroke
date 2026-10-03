import React from 'react';
import { encounterOverview, focusEncounterTarget } from '../encounter-overview.js';

export const ENCOUNTER_SECTIONS = [['context', 'Context'], ['exam', 'Examination'], ['safety', 'Decision review'], ['handoff', 'Documentation']];

export function EncounterNavigation() {
  return <nav className="encounter-section-nav" aria-label="Encounter sections">
    <div className="encounter-section-buttons">{ENCOUNTER_SECTIONS.map(([id, label], index) => <button type="button" key={id} onClick={() => focusEncounterTarget(`${id}-title`)}><span aria-hidden="true">0{index + 1}</span>{label}</button>)}</div>
    <label className="encounter-section-select">Jump to<select aria-label="Jump to encounter section" value="" onChange={event => focusEncounterTarget(`${event.target.value}-title`)}><option value="" disabled>Choose a section</option>{ENCOUNTER_SECTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
  </nav>;
}

// The pinned case bar shows the entered values; this row only points to the
// next missing core entry.
export default function EncounterOverview({ state, now }) {
  const overview = encounterOverview(state, now), next = overview.missing[0];
  const total = overview.missing.length;
  return <aside className="encounter-overview" aria-label="Encounter at a glance" data-complete={next ? undefined : ''}>
    <div className="encounter-next-entry">{next ? <><span><b>{total}</b> core {total === 1 ? 'entry' : 'entries'} missing</span><button type="button" onClick={() => focusEncounterTarget(next.target)}>Next: {next.label}<span aria-hidden="true"> →</span></button></> : <span>Core entries recorded</span>}</div>
  </aside>;
}
