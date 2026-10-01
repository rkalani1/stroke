import React from 'react';

// Presentation only. Changing this view never changes an encounter observation,
// treatment decision, score, consent field or generated handoff.
export default function WorkspaceViewControl({ view, onChange }) {
  return (
    <div className="rounded-lg border border-line bg-card p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Clinical workspace</p>
        <p className="mt-1 text-xs text-ink-2">
          {view === 'teaching'
            ? 'Clinical inputs stay the same. Explanations and evidence are expanded for learning.'
            : 'Essential workflow first. Open explanations and evidence when you need them.'}
        </p>
      </div>
      <div role="group" aria-label="Workspace view" className="inline-flex shrink-0 rounded-lg border border-line bg-paper-2 p-1">
        {[['bedside', 'Bedside'], ['teaching', 'Teaching']].map(([value, label]) => (
          <button key={value} type="button" aria-pressed={view === value}
            onClick={() => onChange(value)}
            className={`min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 ${view === value ? 'bg-cobalt-600 text-white shadow-sm' : 'text-ink-2 hover:bg-card'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
