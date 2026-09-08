import React from 'react';
import { recordedTreatmentDecision, treatmentDecisionFields, treatmentDecisionStatus } from '../encounter-decision-status.js';

export default function TreatmentDecisionControl({ treatment, note, onChange }) {
  const label = treatment.toUpperCase();
  const blocked = treatment === 'tnk' && note.tnkAutoBlocked;
  const decision = recordedTreatmentDecision(note, treatment);
  const value = blocked ? 'no' : decision === true ? 'yes' : decision === false ? 'no' : '';
  return (
    <label className="block min-w-0 text-sm font-medium text-ink">
      <span className="block mb-1">{label} decision</span>
      <select
        aria-label={label + ' treatment decision'}
        value={value}
        disabled={blocked}
        onChange={(event) => {
          const selected = event.target.value;
          onChange((previous) => ({
            ...previous,
            ...treatmentDecisionFields(treatment, selected === '' ? null : selected === 'yes')
          }));
        }}
        className="w-full min-h-[44px] rounded-lg border border-line bg-card px-2 py-2 text-sm text-ink disabled:opacity-70"
      >
        <option value="">Not yet documented</option>
        <option value="yes">{label} Recommended</option>
        <option value="no">Not recommended</option>
      </select>
      {blocked && <span className="block mt-1 text-xs text-crit-700 dark:text-crit-300">{treatmentDecisionStatus(note, treatment)}</span>}
    </label>
  );
}
