import React from 'react';
import { localTimestamp } from '../encounter-timeline.js';
import TimestampOccurrence from './TimestampOccurrence.jsx';
import TimestampNowButton from './TimestampNowButton.jsx';

export function Field({ label, value, onChange, options, type = 'text', ...props }) {
  const displayed = type === 'datetime-local' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value || '') && Number.isFinite(Date.parse(value)) ? localTimestamp(Date.parse(value)) : value;
  const control = <label className="workspace-field"><span>{label}</span>{options ? <select aria-label={label} value={value ?? ''} onChange={e => onChange(e.target.value)} {...props}>{options.map(([v, text]) => <option key={String(v)} value={v}>{text}</option>)}</select> : <input aria-label={label} value={displayed ?? ''} type={type} onChange={e => onChange(e.target.value)} {...props} />}</label>;
  return type === 'datetime-local' ? <div>{control}<TimestampOccurrence label={label} value={displayed} instant={value} onChange={instant => onChange(instant || displayed)} /></div> : control;
}
export function TimestampField({ label, value, onChange, shortcut }) {
  return <div><Field label={label} value={value} type="datetime-local" step="1" onChange={onChange} /><TimestampNowButton label={shortcut} hasValue={Boolean(value)} onUseNow={instant => onChange(new Date(instant).toISOString())} /></div>;
}
