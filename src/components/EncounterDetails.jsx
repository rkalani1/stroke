import React from 'react';
import { getEncounterDetailGroups } from '../encounter-details.js';

function DetailField({ field, value, onChange }) {
  const id = `encounter-detail-${field.key}`;
  if (field.type === 'worksheet') return <div className="workspace-field">
    <span id={`${id}-label`}>{field.label}</span>
    <output aria-labelledby={`${id}-label`}>{field.result ? `${field.result.score}/${field.result.max}` : 'Incomplete / review required'}</output>
    <a href={`#/tools/${field.calculator}`}>Open {field.name} worksheet</a>
  </div>;
  const props = { id, 'aria-label': field.label, value: value ?? '', onChange: event => onChange(event.target.value) };
  return <label className="workspace-field" htmlFor={id}>
    <span>{field.label}</span>
    {field.type === 'select' ? <select {...props}>
      <option value="">Not documented</option>
      {field.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select> : field.type === 'textarea' ? <textarea {...props} rows={2} /> :
      <input {...props} type={field.type} min={field.min} max={field.max} step={field.step} />}
  </label>;
}

// `notices` renders a group-specific prompt directly after that group's fields.
export default function EncounterDetails({ state, update, section, notices }) {
  const groups = getEncounterDetailGroups(state, section);
  const updateField = (key, value) => update(previous => ({ ...previous, details: { ...previous.details, [key]: value } }));
  return groups.map(group => <details className="workspace-details encounter-details" key={group.id} id={`encounter-details-${group.id}`}>
    <summary>{group.title}</summary>
    <div className="field-grid">{group.fields.map(field => <DetailField key={field.key} field={field}
      value={state.details?.[field.key]} onChange={value => updateField(field.key, value)} />)}</div>
    {notices?.[group.id] || null}
  </details>);
}
