import React, { useEffect, useState } from 'react';

export default function ClinicalExplanation({ teaching, children }) {
  const [open, setOpen] = useState(teaching);
  useEffect(() => setOpen(teaching), [teaching]);
  return (
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="mt-2 rounded-md border border-line bg-card">
      <summary className="min-h-[44px] cursor-pointer px-3 py-3 text-xs font-semibold text-ink">Explanation and teaching context</summary>
      <div className="px-3 pb-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}
