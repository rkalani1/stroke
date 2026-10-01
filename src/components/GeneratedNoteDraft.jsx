import React from 'react';

export default function GeneratedNoteDraft({ text, stale, onCopy }) {
  if (!text && !stale) return null;
  return (
    <section className="mt-3 rounded-md border border-line bg-paper-2 p-3 space-y-2" aria-label="Generated note draft">
      <h4 className="font-semibold text-ink">Generated note draft</h4>
      {stale ? <p role="status" className="text-sm text-ink-2">Encounter inputs changed. Generate the note again to review the current documentation.</p> : <>
        <p className="text-xs text-ink-2">Review this snapshot before use. Your entered recommendations remain separate below.</p>
        <textarea aria-label="Generated note draft text" readOnly value={text} rows={10} className="w-full rounded border border-line bg-card p-3 text-xs font-mono text-ink" />
        <button type="button" onClick={() => onCopy(text, 'generated-note-draft')} className="min-h-[44px] rounded-md bg-cobalt-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cobalt-700">Copy generated note</button>
      </>}
    </section>
  );
}
