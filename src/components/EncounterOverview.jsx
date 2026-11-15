import React, { useRef, useState } from 'react';
import { encounterHoldCue, encounterOverview, focusEncounterTarget } from '../encounter-overview.js';

export const ENCOUNTER_SECTIONS = [['context', 'Context'], ['exam', 'Examination'], ['safety', 'Decision review'], ['handoff', 'Documentation']];

export function EncounterNavigation() {
  // The phone "Jump to" select moves focus only on an explicit choice (WCAG 3.2.2). Arrow, Home, End and
  // Page keys and type-ahead letters change a closed select at once (Windows, Linux), within that key's
  // task: such a change only shows the section, and Enter goes there. A pick from the opened list (mouse,
  // touch or keyboard) comes in a later task and goes at once. At rest the select reads "Choose a
  // section", so picking the section shown again still goes there.
  const [choice, setChoice] = useState(''), browsing = useRef(false);
  const browse = ({ key }) => { if (/^(Arrow|Home|End|Page)|^[^ ]$/.test(key)) { browsing.current = true; setTimeout(() => { browsing.current = false; }); } };
  const go = id => { setChoice(''); focusEncounterTarget(`${id}-title`); };
  return <nav className="encounter-section-nav" aria-label="Encounter sections">
    <div className="encounter-section-buttons">{ENCOUNTER_SECTIONS.map(([id, label], index) => <button type="button" key={id} onClick={() => focusEncounterTarget(`${id}-title`)}><span aria-hidden="true">0{index + 1}</span>{label}</button>)}</div>
    <label className="encounter-section-select">Jump to<select aria-label="Jump to encounter section" value={choice} onKeyDown={event => { if (event.key === 'Enter' && choice) { event.preventDefault(); go(choice); } else browse(event); }} onKeyPress={browse} onChange={event => { if (browsing.current) setChoice(event.target.value); else go(event.target.value); }} onBlur={() => setChoice('')}><option value="" disabled>Choose a section</option>{ENCOUNTER_SECTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
  </nav>;
}

// The pinned case bar shows the entered values; this row only points to the
// next missing core entry.
export default function EncounterOverview({ state, now }) {
  const overview = encounterOverview(state, now), hold = encounterHoldCue(state, now), next = hold || overview.missing[0];
  const total = overview.missing.length;
  return <aside className="encounter-overview" aria-label="Encounter at a glance" data-complete={next ? undefined : ''}>
    <div className="encounter-next-entry">{hold && total === 0 ? <span>IVT held</span> : next ? <span><b>{total}</b> core {total === 1 ? 'entry' : 'entries'} missing</span> : <span>Core entries recorded</span>}{next && <button type="button" onClick={() => focusEncounterTarget(next.target)}>Next: {next.label}<span aria-hidden="true"> →</span></button>}</div>
  </aside>;
}
