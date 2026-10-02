import React from 'react';
import { timestampCandidates } from '../clinical/timestamp.js';

const offsetLabel = date => {
  const offset = -date.getTimezoneOffset(), magnitude = Math.abs(offset);
  return `UTC${offset < 0 ? '−' : '+'}${String(Math.floor(magnitude / 60)).padStart(2, '0')}:${String(magnitude % 60).padStart(2, '0')}`;
};

// A local clock repeats during a backward clock change. Neither occurrence is
// inferred from the current time: the user must identify the recorded instant.
export default function TimestampOccurrence({ label, value, instant, onChange }) {
  const candidates = timestampCandidates(value);
  const explicit = /(?:Z|[+-]\d{2}:\d{2})$/.test(instant || '') && Number.isFinite(Date.parse(instant));
  // The input displays whole seconds. Match the instant at that precision,
  // never just its UTC offset, which may also occur in a different time zone.
  const selected = explicit ? candidates.find(date => Math.floor(date.getTime() / 1000) === Math.floor(Date.parse(instant) / 1000)) : null;
  const preserved = explicit && !selected;
  if (candidates.length < 2 && !preserved) return null;
  return <label className="workspace-field"><span>{label}: {preserved ? 'recorded instant retained' : 'repeated local time'}</span>
    <select aria-label={`${label} clock occurrence`} value={selected?.toISOString() || (preserved ? instant : '')} onChange={event => onChange(event.target.value)}>
      <option value="">Choose which occurrence was recorded</option>
      {preserved && <option value={instant}>Preserved recorded instant ({instant})</option>}
      {candidates.map((date, index) => <option key={date.toISOString()} value={date.toISOString()}>{candidates.length === 1 ? 'Current local time' : `${index === 0 ? 'First' : 'Second'} occurrence`} ({offsetLabel(date)})</option>)}
    </select>
  </label>;
}
