/**
 * v7.0 — DrugChip.
 * Drop-in: src/design/drug-chip.jsx
 *
 * Used in Management ICH / Ischemic protocols. Click opens the package-insert
 * Sheet via onOpen — does NOT navigate away. External references move to a
 * per-card "References" footer (defect #17).
 */

import React from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

export const DrugChip = ({ name, dose, route, onOpen, className }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label={`${name}${dose ? ' ' + dose : ''} — open details`}
    className={cx(
      'inline-flex items-center gap-2 px-2.5 h-7 rounded-md',
      'bg-cobalt-50 text-cobalt-800 border border-cobalt-200',
      'dark:bg-cobalt-950 dark:text-cobalt-200 dark:border-cobalt-800',
      'hover:bg-cobalt-100 dark:hover:bg-cobalt-900',
      'text-xs font-semibold',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
      className
    )}>
    <span>{name}</span>
    {dose && <span className="font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero] text-cobalt-700 dark:text-cobalt-300 font-normal">{dose}</span>}
    {route && <span className="text-cobalt-600/70 dark:text-cobalt-300/70">· {route}</span>}
  </button>
);

DrugChip.displayName = 'DrugChip';
