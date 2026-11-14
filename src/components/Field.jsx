import React from 'react';
import { localTimestamp } from '../encounter-timeline.js';
import TimestampOccurrence from './TimestampOccurrence.jsx';
import TimestampNowButton from './TimestampNowButton.jsx';

// error (number fields the Encounter range-checks, encounter-inputs.js): undefined when nothing is entered, false
// for an entry the Encounter uses, else the message shown under the input. aria-invalid is set either way because
// Chromium reports a native min/max as invalid, and some are narrower than the Encounter's own range (glucose min 1).
export function Field({ label, value, onChange, options, type = 'text', error, ...props }) {
  const hint = React.useId();
  const displayed = type === 'datetime-local' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value || '') && Number.isFinite(Date.parse(value)) ? localTimestamp(Date.parse(value)) : value;
  const control = <label className="workspace-field"><span>{label}</span>{options ? <select aria-label={label} value={value ?? ''} onChange={e => onChange(e.target.value)} {...props}>{options.map(([v, text]) => <option key={String(v)} value={v}>{text}</option>)}</select> : <input aria-label={label} aria-invalid={error === undefined ? undefined : Boolean(error)} value={displayed ?? ''} type={type} onChange={e => onChange(e.target.value)} {...props} aria-describedby={[props['aria-describedby'], error && hint].filter(Boolean).join(' ') || undefined} />}{error && <small id={hint} className="field-error">{error}</small>}</label>;
  return type === 'datetime-local' ? <div>{control}<TimestampOccurrence label={label} value={displayed} instant={value} onChange={instant => onChange(instant || displayed)} /></div> : control;
}
export function TimestampField({ label, value, onChange, shortcut }) {
  return <div><Field label={label} value={value} type="datetime-local" step="1" onChange={onChange} /><TimestampNowButton label={shortcut} hasValue={Boolean(value)} onUseNow={instant => onChange(new Date(instant).toISOString())} /></div>;
}
