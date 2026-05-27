/**
 * v7.0 — LKW HeroReadout.
 * Drop-in: src/design/hero-readout.jsx
 *
 * Read-only display (NOT an input).
 * Three urgency states drive the supporting line only — the elapsed-timer
 * digits stay slate-900 (slate-50 in dark) so read-aloud contrast never
 * degrades.
 *
 * aria-live announces only when crossing thresholds (4.5h, 6h, 24h),
 * never per-tick. Threshold-crossing logic lives in the real encounter-
 * state store, not here — this is a pure display.
 */

import React, { useEffect, useRef } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* Format elapsed seconds → "HH:MM:SS". */
export const fmtElapsed = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* Humanize remaining minutes → "4h 8m" / "27 min" / "closed". */
export const fmtRemaining = (min) => {
  if (min <= 0) return 'closed';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/* Compute urgency from minutes-to-close of the most urgent active window. */
export const computeState = ({ tnkMinLeft, evtMinLeft }) => {
  const min = Math.min(
    tnkMinLeft > 0 ? tnkMinLeft : Infinity,
    evtMinLeft > 0 ? evtMinLeft : Infinity
  );
  if (min === Infinity) return 'closed';
  if (min < 10) return 'crit';
  if (min < 30) return 'warn';
  return 'calm';
};

const STATE_LINE_CLS = {
  calm:   'text-slate-600 dark:text-slate-300',
  warn:   'text-warn-800 dark:text-warn-300',
  crit:   'text-crit-800 dark:text-crit-300 font-semibold',
  closed: 'text-slate-500 dark:text-slate-400'
};

/* Internal helper — render the supporting line. */
const supportLine = (state, tnkMinLeft, evtMinLeft, unknownLkw) => {
  if (unknownLkw) return 'Wake-up / unknown LKW — extended-window imaging criteria apply';
  if (state === 'crit') {
    const tnkPart = tnkMinLeft > 0 && tnkMinLeft < 10
      ? `IV TNK window closes in ${tnkMinLeft} min`
      : 'IV TNK window closed';
    return `${tnkPart} · EVT window ${fmtRemaining(evtMinLeft)}`;
  }
  if (state === 'warn') {
    return `IV TNK window closes in ${tnkMinLeft} min · EVT window ${fmtRemaining(evtMinLeft)}`;
  }
  return `IV TNK window ${fmtRemaining(tnkMinLeft)} · EVT window ${fmtRemaining(evtMinLeft)}`;
};

/**
 * <HeroReadout>
 * @param {number}  elapsedSec   seconds since LKW
 * @param {number}  tnkMinLeft   minutes remaining in IV TNK window
 * @param {number}  evtMinLeft   minutes remaining in EVT window
 * @param {boolean} unknownLkw   true → wake-up / unknown LKW (extended criteria)
 * @param {'3xl'|'display'} size mobile = 3xl, desktop = display
 */
export const HeroReadout = ({
  elapsedSec = 0,
  tnkMinLeft = 0,
  evtMinLeft = 0,
  unknownLkw = false,
  size = '3xl',
  className
}) => {
  const state = unknownLkw ? 'closed' : computeState({ tnkMinLeft, evtMinLeft });
  const heroFont = size === 'display' ? 'text-display' : 'text-3xl';
  const headerLabel = unknownLkw ? 'LAST KNOWN WELL · UNKNOWN' : 'ELAPSED FROM LKW';

  /* Announce ONLY at threshold crossings (4.5h, 6h, 24h). Without this guard
     a polite live-region screen-reader would re-announce every tick, which
     spec §3.5 explicitly forbids. */
  const liveMsgRef = useRef('');
  const prevBucketRef = useRef(null);
  const minutes = Math.floor(elapsedSec / 60);
  const bucket = minutes < 270 ? '<4.5h' : minutes < 360 ? '<6h' : minutes < 1440 ? '<24h' : '≥24h';
  useEffect(() => {
    if (prevBucketRef.current !== null && prevBucketRef.current !== bucket) {
      liveMsgRef.current = `Threshold crossed: ${bucket} elapsed since last known well`;
    }
    prevBucketRef.current = bucket;
  }, [bucket]);

  return (
    <div className={cx('flex flex-col gap-1', className)}>
      {/* Hidden live region — only re-renders on bucket change */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMsgRef.current}
      </span>
      <p className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400">
        {headerLabel}
      </p>
      <div className={cx(
        'font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero]',
        'font-semibold leading-none text-slate-900 dark:text-slate-50',
        heroFont
      )}>
        {unknownLkw ? '—— : —— : ——' : `T+ ${fmtElapsed(elapsedSec)}`}
      </div>
      <p className={cx('text-sm', STATE_LINE_CLS[state])}>
        {supportLine(state, tnkMinLeft, evtMinLeft, unknownLkw)}
      </p>
    </div>
  );
};

HeroReadout.displayName = 'HeroReadout';
