import React from 'react';
import { activeTimelineFields, localTimestamp, timelineIntervals } from '../encounter-timeline.js';
import TimestampNowButton from './TimestampNowButton.jsx';

export default function EncounterTimeline({ state, update, now }) {
  const timeline = state.timeline || {};
  const set = patch => update(prev => ({ ...prev, timeline: { ...prev.timeline, ...patch } }));
  const running = timeline.consultStart && !timeline.consultEnd;
  const intervals = timelineIntervals(state, now);
  return <details><summary>Consultation timer & event timeline</summary>
    <div className="documentation-prompt-actions">{!timeline.consultStart ? <button type="button" className="workspace-secondary-action" onClick={() => set({ consultStart: new Date().toISOString(), consultEnd: '' })}>Start consultation timer</button> : running ? <button type="button" className="workspace-secondary-action" onClick={() => set({ consultEnd: new Date().toISOString() })}>Stop consultation timer</button> : <span className="workspace-help">Consultation timing recorded</span>}</div>
    {intervals.length > 0 && <dl className="timeline-intervals">{intervals.map(({ label, text }) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>}
    <div className="field-grid">{activeTimelineFields(state).map(([key, label]) => <div key={key}><label className="workspace-field"><span>{label} (local)</span><input type="datetime-local" step="1" aria-label={`${label} (local)`} value={timeline[key]?.endsWith('Z') ? localTimestamp(Date.parse(timeline[key])) : timeline[key] || ''} onChange={event => set({ [key]: event.target.value })} /></label><TimestampNowButton label={label} hasValue={Boolean(timeline[key])} onUseNow={instant => set({ [key]: new Date(instant).toISOString() })} /></div>)}</div>
    <p className="workspace-help">IVT administration and EVT procedure times use the records in Documentation. Intervals appear only when their required events are recorded.</p>
  </details>;
}
