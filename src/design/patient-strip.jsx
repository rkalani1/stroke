/**
 * v7.0 — PatientStrip.
 * Drop-in: src/design/patient-strip.jsx
 *
 * Sticky top under chrome on mobile, becomes right Summary Rail at lg+.
 * Read-only chip row of: Age · Sex · LKW · Elapsed · NIHSS · ASPECTS · Anticoag.
 *
 * Subscribes read-only to the existing encounter-state store via props;
 * has NO localStorage of its own. The host (src/app.jsx Encounter region)
 * passes a `patient` object + `completion` chips.
 */

import React from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

const STATUS_BORDER = {
  eligible: 'border-ok-200 dark:border-ok-700',
  contra:   'border-crit-200 dark:border-crit-700',
  warn:     'border-warn-200 dark:border-warn-700',
  none:     'border-slate-200 dark:border-slate-700'
};

const Chip = ({ label, value, mono = true, status = 'none', className }) => (
  <div className={cx(
    'inline-flex flex-col px-3 py-1.5 rounded-md border bg-white dark:bg-slate-900 min-w-0',
    STATUS_BORDER[status], className
  )}>
    <span className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className={cx(
      'text-sm font-semibold text-slate-900 dark:text-slate-50 truncate',
      mono && 'font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero]'
    )}>{value}</span>
  </div>
);

const CompletionChip = ({ c, onJump }) => (
  <button type="button" onClick={() => onJump?.(c.targetId)}
    className={cx(
      'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-2xs font-semibold whitespace-nowrap',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
      c.severity === 'crit'
        ? 'bg-crit-50 text-crit-800 border border-crit-200 dark:bg-crit-950 dark:text-crit-200 dark:border-crit-700'
        : 'bg-warn-50 text-warn-800 border border-warn-200 dark:bg-warn-950 dark:text-warn-200 dark:border-warn-700'
    )}>
    <span aria-hidden="true">{c.severity === 'crit' ? '⚠' : 'ⓘ'}</span>
    {c.label}
    <span aria-hidden="true" className="opacity-60">›</span>
  </button>
);

/* ─── Mobile (sticky top, scrolls under chrome) ───────────────────── */

export const PatientStripMobile = ({ patient, completion, onJump, className }) => (
  <div className={cx(
    'sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur',
    'border-b border-slate-200 dark:border-slate-800',
    className
  )}>
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      <Chip label="Age" value={patient.age}/>
      <Chip label="Sex" value={patient.sex} mono={false}/>
      <Chip label="LKW" value={patient.lkw} status={patient.lkwUnknown ? 'warn' : 'none'}/>
      <Chip label="Elapsed" value={patient.elapsed} status={patient.elapsedStatus || 'none'}/>
      <Chip label="NIHSS" value={patient.nihss}/>
      <Chip label="ASPECTS" value={patient.aspects}/>
      <Chip label="Anticoag" value={patient.anticoag} mono={false}
            status={patient.anticoag && patient.anticoag !== 'None' ? 'warn' : 'none'}/>
    </div>
    {completion && completion.length > 0 && (
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {completion.map((c, i) => <CompletionChip key={i} c={c} onJump={onJump}/>)}
      </div>
    )}
  </div>
);

/* ─── Desktop right-rail (lg+) ────────────────────────────────────── */

export const PatientStripRail = ({ patient, completion, onJump, showSparkline = true, className }) => (
  <aside aria-label="Patient summary"
    className={cx(
      'w-80 shrink-0 border-l border-slate-200 dark:border-slate-800',
      'bg-white dark:bg-slate-900',
      className
    )}>
    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
      <p className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-3">
        Patient Summary
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Chip label="Age" value={patient.age}/>
        <Chip label="Sex" value={patient.sex} mono={false}/>
        <Chip label="NIHSS" value={patient.nihss}/>
        <Chip label="ASPECTS" value={patient.aspects}/>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2">
        <Chip label="LKW" value={patient.lkw} status={patient.lkwUnknown ? 'warn' : 'none'}/>
        <Chip label="Elapsed" value={patient.elapsed} status={patient.elapsedStatus || 'none'}/>
        <Chip label="Anticoag" value={patient.anticoag} mono={false}
              status={patient.anticoag && patient.anticoag !== 'None' ? 'warn' : 'none'}/>
      </div>
    </div>

    {showSparkline && (
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <p className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-2">
          Window Position
        </p>
        <WindowSparkline elapsedMin={patient.elapsedMin || 0}/>
      </div>
    )}

    {completion && completion.length > 0 && (
      <div className="p-5">
        <p className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-2">
          Required Before Decision
        </p>
        <div className="flex flex-col gap-2">
          {completion.map((c, i) => (
            <button key={i} type="button" onClick={() => onJump?.(c.targetId)}
              className={cx(
                'flex items-center gap-2 px-3 h-9 rounded-md text-xs font-semibold text-left',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                c.severity === 'crit'
                  ? 'bg-crit-50 text-crit-800 border border-crit-200 dark:bg-crit-950 dark:text-crit-200 dark:border-crit-700'
                  : 'bg-warn-50 text-warn-800 border border-warn-200 dark:bg-warn-950 dark:text-warn-200 dark:border-warn-700'
              )}>
              <span aria-hidden="true">{c.severity === 'crit' ? '⚠' : 'ⓘ'}</span>
              <span className="flex-1 min-w-0 truncate">{c.label}</span>
              <span aria-hidden="true" className="opacity-60">›</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </aside>
);

/* Sparkline — 0–24h with TNK (0–4.5h) + EVT (4.5–24h) zones + position marker.
   24h × 60 = 1440min; 4.5h × 60 = 270min. */
const WindowSparkline = ({ elapsedMin }) => {
  const pct = Math.min(100, Math.max(0, (elapsedMin / 1440) * 100));
  const tnkEdgePct = (270 / 1440) * 100;
  return (
    <div className="h-10 relative rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden" role="img" aria-label={`Elapsed ${Math.floor(elapsedMin / 60)} hours ${elapsedMin % 60} minutes since last known well`}>
      <div className="absolute inset-y-0 left-0 bg-cobalt-100 dark:bg-cobalt-900/40" style={{ width: `${tnkEdgePct}%` }}/>
      <div className="absolute inset-y-0 bg-cobalt-50 dark:bg-cobalt-950/60" style={{ left: `${tnkEdgePct}%`, right: 0 }}/>
      <div className="absolute inset-y-0 bg-slate-900 dark:bg-slate-50" style={{ left: `${pct}%`, width: 1 }} aria-hidden="true"/>
      <div className="absolute inset-x-0 bottom-0.5 flex justify-between px-1 font-mono tabular-nums text-2xs text-slate-500">
        <span>0h</span><span>4.5h</span><span>24h</span>
      </div>
    </div>
  );
};

PatientStripMobile.displayName = 'PatientStripMobile';
PatientStripRail.displayName = 'PatientStripRail';
