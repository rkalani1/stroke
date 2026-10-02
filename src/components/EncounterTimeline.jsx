import React from 'react';
import { activeTimelineFields, timelineIntervals } from '../encounter-timeline.js';
import { TimestampField } from './Field.jsx';

export default function EncounterTimeline({ state, update, now }) {
  const timeline = state.timeline || {};
  const set = patch => update(prev => ({ ...prev, timeline: { ...prev.timeline, ...patch } }));
  const running = timeline.consultStart && !timeline.consultEnd;
  const intervals = timelineIntervals(state, now);
  return <details><summary>Consultation timer & event timeline</summary>
    <div className="documentation-prompt-actions">{!timeline.consultStart ? <button type="button" className="workspace-secondary-action" onClick={() => set({ consultStart: new Date().toISOString(), consultEnd: '' })}>Start consultation timer</button> : running ? <button type="button" className="workspace-secondary-action" onClick={() => set({ consultEnd: new Date().toISOString() })}>Stop consultation timer</button> : <span className="workspace-help">Consultation timing recorded</span>}</div>
    {intervals.length > 0 && <dl className="timeline-intervals">{intervals.map(({ label, text }) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>}
    <div className="field-grid">{activeTimelineFields(state).map(([key, label]) => <TimestampField key={key} label={`${label} (local)`} shortcut={label} value={timeline[key] || ''} onChange={value => set({ [key]: value })} />)}</div>
    <p className="workspace-help">IVT administration and EVT procedure times use the records in Documentation. Intervals appear only when their required events are recorded.</p>
  </details>;
}
