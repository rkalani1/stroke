// src/components/TrialScreener.jsx
//
// Bedside Trial Screener — native React, no iframe. v7 styling/tokens (single
// cobalt accent; warn/crit/ok semantics; slate neutrals; paper surfaces).
// No institutional identifiers, no PHI capture, no localStorage.
//
// v7.3 — rebuilt for the bedside/phone case. The screener is now TWO TAPS:
//
//   1 · Stroke classification  (Ischemic / TIA / Hemorrhage)
//   2 · Time since last known well  (six onset presets)
//   → live "Possible candidates" list, straight away.
//
// The old "Core Bedside Facts" form (age, NIHSS, ASPECTS, mRS, vessel,
// etiology, hematoma volume, rehab factors …) is gone: it asked for more than
// anyone will type at a bedside, and the dual-eval engine already treats every
// unentered field optimistically, so classification + onset alone produce the
// same candidate shortlist. Nothing is lost — each per-trial fact that would
// still need checking is surfaced on the card as "Confirm before referral",
// and the full inclusion/exclusion text stays one tap away in the details
// sheet and in the Study Database view.
//
// The exclusion checklist survives as an OPTIONAL collapsed refinement, so a
// user who wants to narrow the list further still can.
//
// Exports:
//   <TrialScreener/>  — steps + live results + briefing note + excluded drawer
//   <StudyDatabase/>  — searchable list of every study with full criteria
//
// `copyToClipboard` + `addToast` are passed in from app.jsx (the app's shared
// helpers + toast system) so the briefing-note copy reuses one code path.

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDialogChrome } from './use-dialog-chrome.js';
import {
  screenerTrials
} from '../evidence/screenerTrials.js';
import {
  evaluateAll,
  buildScreenerParams,
  isTrialPotentiallyActive,
  createInitialScreenerState,
  onsetToHours,
  ONSET_PRESETS,
  EXCLUSION_ITEMS
} from '../evidence/screener-eval.js';

const cx = (...p) => p.filter(Boolean).join(' ');

export const COMPLIANCE_BANNER =
  'Synthetic public demo — not for clinical decision-making. Do not enter real patient identifiers or PHI. Registry matches are first-pass screens only and must be confirmed against the full ClinicalTrials.gov record and approved local study materials before clinical action.';

const CLASSIFICATIONS = [
  { id: 'ischemic', label: 'Ischemic', sub: 'stroke', onsetVal: 2 },
  { id: 'tia', label: 'TIA', sub: 'transient', onsetVal: 12 },
  { id: 'ich', label: 'Hemorrhage', sub: 'ICH', onsetVal: 3 }
];

const CLASSIFICATION_LABELS = {
  ischemic: 'Ischemic stroke',
  tia: 'TIA',
  ich: 'Hemorrhage (ICH)'
};

/* ───────────────────────── icons (inline, no emoji) ───────────────────── */

const Glyph = ({ children, size = 20, className, strokeWidth = 1.9 }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const IconVessel = (p) => (
  <Glyph {...p}>
    <path d="M4 7c4 0 4 5 8 5s4-5 8-5" />
    <path d="M4 16c4 0 4 3 8 3" />
    <path d="m15 15 5 5" />
    <path d="m20 15-5 5" />
  </Glyph>
);
const IconClock = (p) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Glyph>
);
const IconDroplet = (p) => (
  <Glyph {...p}>
    <path d="M12 3.5c3.6 4.2 6 7.2 6 10a6 6 0 0 1-12 0c0-2.8 2.4-5.8 6-10Z" />
  </Glyph>
);
const IconBolt = (p) => (
  <Glyph {...p} strokeWidth={2.3}>
    <path d="m13 2-8 12h6l-2 8 8-12h-6l2-8Z" />
  </Glyph>
);
const IconCheck = (p) => (
  <Glyph {...p} strokeWidth={3}>
    <path d="m5 13 4 4L19 7" />
  </Glyph>
);
const IconChevron = (p) => (
  <Glyph {...p} strokeWidth={2.4}>
    <path d="m9 6 6 6-6 6" />
  </Glyph>
);
const IconCopy = (p) => (
  <Glyph {...p} strokeWidth={2.1}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Glyph>
);
const IconSearch = (p) => (
  <Glyph {...p} strokeWidth={2.2}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Glyph>
);

const CLASSIFICATION_ICONS = { ischemic: IconVessel, tia: IconClock, ich: IconDroplet };

/* ───────────────────────── status pill ─────────────────────────────────── */

const STATUS_MAP = {
  eligible: {
    text: 'Candidate',
    dot: 'bg-ok-500',
    cls: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-200 dark:border-ok-800',
    rail: 'bg-ok-500'
  },
  pending: {
    text: 'Possible',
    dot: 'bg-warn-500',
    cls: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-200 dark:border-warn-800',
    rail: 'bg-warn-500'
  },
  soon: {
    text: 'Enrolling soon',
    dot: 'bg-warn-500',
    cls: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-200 dark:border-warn-800',
    rail: 'bg-warn-300'
  },
  enrolling: {
    text: 'Enrolling',
    dot: 'bg-ok-500',
    cls: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-200 dark:border-ok-800',
    rail: 'bg-ok-500'
  },
  excluded: {
    text: 'Excluded',
    dot: 'bg-slate-300 dark:bg-slate-600',
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:border-line',
    rail: 'bg-slate-200 dark:bg-slate-700'
  },
  closed: {
    text: 'Closed',
    dot: 'bg-slate-300 dark:bg-slate-600',
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:border-line',
    rail: 'bg-slate-200 dark:bg-slate-700'
  },
  placeholder: {
    text: 'Unverified',
    dot: 'bg-crit-500',
    cls: 'bg-crit-50 text-crit-800 border-crit-200 dark:bg-crit-950 dark:text-crit-200 dark:border-crit-800',
    rail: 'bg-crit-500'
  }
};

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || STATUS_MAP.excluded;
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2 py-1 text-2xs font-bold uppercase tracking-wide',
        m.cls
      )}
    >
      <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-pill', m.dot)} />
      {m.text}
    </span>
  );
}

// Map a raw trial record (no screening context) onto a badge status.
const trialBadgeStatus = (trial) =>
  trial.status === 'enrolling'
    ? 'enrolling'
    : trial.status === 'soon'
    ? 'soon'
    : trial.status === 'placeholder'
    ? 'placeholder'
    : 'closed';

/* ───────────────────────── trial details sheet ─────────────────────────── */

function TrialDetailsModal({ trial, onClose }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  // Escape + Tab trap + body scroll lock + focus restore (see use-dialog-chrome.js).
  useDialogChrome({ dialogRef, initialFocusRef: closeRef, onClose });

  if (!trial) return null;

  // Portalled to <body>: .app-shell carries a backdrop-filter, which makes it
  // the containing block for position:fixed descendants — a sheet rendered in
  // place would anchor to the (very tall) shell instead of the viewport.
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-slate-950/50" onClick={onClose} role="presentation" aria-hidden="true" />
      {/* Bottom sheet on phone, centred dialog from sm up. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        className="fixed inset-x-0 bottom-0 top-12 z-[61] flex flex-col overflow-hidden rounded-t-xl border border-line bg-card shadow-pop sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:mx-auto sm:max-h-[85vh] sm:max-w-2xl sm:-translate-y-1/2 sm:rounded-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-card px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="trial-modal-title" className="font-serif text-lg font-bold tracking-tight text-ink">
              {trial.acronym}
            </h2>
            <p className="mt-0.5 text-xs text-mute">{trial.exactFullStudyName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={trialBadgeStatus(trial)} />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close trial details"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-mute hover:bg-paper-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <Glyph size={20} strokeWidth={2.2}>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </Glyph>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-10 sm:px-5">
          <div>
            <p className="font-mono text-2xs font-semibold uppercase tracking-[0.1em] text-mute">Clinical hypothesis</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{trial.sourceHypothesisText || 'Not specified in source'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trial.enrollmentWindowText && trial.enrollmentWindowText !== 'N/A' ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-paper-2 px-2 py-1 font-mono text-2xs text-slate-700 dark:text-ink-2">
                <IconClock size={12} strokeWidth={2.2} />
                {trial.enrollmentWindowText}
              </span>
            ) : null}
            {trial.externalMetadata.nct ? (
              <a
                href={trial.externalMetadata.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center font-mono text-xs font-semibold text-link-600 underline hover:text-link-700 dark:text-cobalt-300"
              >
                {trial.externalMetadata.nct} ↗
              </a>
            ) : (
              <span className="text-xs text-mute">No registry record — not verifiable</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-2xs font-semibold uppercase tracking-[0.1em] text-ok-700 dark:text-ok-300">Inclusion criteria</p>
              <ul className="mt-2 space-y-1.5 pl-4 text-sm leading-relaxed text-ink-2 [&>li]:list-disc">
                {trial.exactInclusionCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-2xs font-semibold uppercase tracking-[0.1em] text-crit-700 dark:text-crit-300">Exclusion criteria</p>
              <ul className="mt-2 space-y-1.5 pl-4 text-sm leading-relaxed text-ink-2 [&>li]:list-disc">
                {trial.exactExclusionCriteria.length > 0 ? (
                  trial.exactExclusionCriteria.map((c, i) => <li key={i}>{c}</li>)
                ) : (
                  <li>None specified in source</li>
                )}
              </ul>
            </div>
          </div>

          {trial.sourceGaps && trial.sourceGaps.length > 0 && (
            <div className="rounded-md border-l-4 border-crit-600 bg-crit-50 px-3 py-2 dark:border-crit-500 dark:bg-crit-950">
              <p className="text-xs font-semibold text-crit-800 dark:text-crit-200">Registry / protocol verification notes</p>
              <ul className="mt-1 space-y-1 pl-4 text-xs text-crit-800 dark:text-crit-200 [&>li]:list-disc">
                {trial.sourceGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-line pt-3 text-sm text-ink-2">
            <span className="font-semibold text-ink">Referral pathway:</span> {trial.pathway}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ───────────────────────── result card ─────────────────────────────────── */

function ResultCard({ item, onOpenDetails, compact = false }) {
  const { trial, status, matchedCriteria, pendingFields, exclusionReasons } = item;
  const rail = (STATUS_MAP[status] || STATUS_MAP.excluded).rail;
  const isHyperacute = trial.timeCategory === 'hyperacute';

  if (compact) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-base font-bold tracking-tight text-ink">{trial.acronym}</h3>
            <p className="mt-0.5 font-mono text-2xs text-slate-500 dark:text-mute">
              {trial.externalMetadata.nct || 'No registry record'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-mute">
          {exclusionReasons && exclusionReasons.length > 0 ? exclusionReasons[0] : trial.conciseBedsideSummary}
        </p>
        <button
          type="button"
          onClick={() => onOpenDetails(trial)}
          className="-ml-2 inline-flex min-h-[44px] items-center gap-1 rounded px-2 text-xs font-bold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300"
        >
          Full criteria
          <IconChevron size={13} />
        </button>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-card shadow-card">
      <div aria-hidden="true" className={cx('h-1', rail)} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold tracking-tight text-ink">{trial.acronym}</h3>
            <p className="mt-0.5 text-xs leading-snug text-mute">{trial.exactFullStudyName}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {trial.enrollmentWindowText && trial.enrollmentWindowText !== 'N/A' && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-paper-2 px-2 py-1 font-mono text-2xs text-slate-700 dark:text-ink-2">
              <IconClock size={12} strokeWidth={2.2} />
              {trial.enrollmentWindowText}
            </span>
          )}
          {isHyperacute && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-crit-50 px-2 py-1 text-2xs font-bold uppercase tracking-wide text-crit-800 dark:bg-crit-950 dark:text-crit-200">
              <IconBolt size={12} />
              Time-sensitive
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-2">{trial.conciseBedsideSummary}</p>

        {matchedCriteria && matchedCriteria.length > 0 && (
          <div className="mt-3 border-t border-paper-2 pt-3">
            <p className="font-mono text-2xs font-bold uppercase tracking-[0.09em] text-ok-700 dark:text-ok-300">Why it matched</p>
            <ul className="mt-2 space-y-1.5">
              {matchedCriteria.map((m, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink-2">
                  <IconCheck size={12} className="mt-0.5 shrink-0 text-ok-600 dark:text-ok-300" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {exclusionReasons && exclusionReasons.length > 0 && (
          <div className="mt-3 rounded-md border-l-4 border-slate-300 bg-slate-50 px-3 py-2 dark:border-line dark:bg-paper-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-ink">Why it was excluded</p>
            <ul className="mt-1 space-y-0.5 pl-4 text-xs text-slate-600 dark:text-ink-2 [&>li]:list-disc">
              {exclusionReasons.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Facts the engine could not settle from classification + onset alone.
            Rendered as a quiet checklist, not a warning: it is what to check at
            the bedside, not a form to fill in. Registry/protocol source notes
            live in the details sheet and the tab-level compliance banner —
            repeating them on every card was noise. */}
        {pendingFields && pendingFields.length > 0 && (
          <p className="mt-3 border-t border-paper-2 pt-3 text-2xs leading-relaxed text-mute">
            <span className="font-semibold uppercase tracking-[0.06em] text-ink-2">Still to confirm · </span>
            {pendingFields.join(' · ')}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-paper-2 bg-paper-2/60 px-4 py-2">
        <span className="min-w-0 truncate font-mono text-2xs text-slate-500 dark:text-mute">
          {trial.externalMetadata.nct || 'No registry record'}
        </span>
        <button
          type="button"
          onClick={() => onOpenDetails(trial)}
          className="-mr-2 inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded px-2 text-xs font-bold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300"
        >
          Full criteria
          <IconChevron size={13} />
        </button>
      </div>
    </article>
  );
}

/* ───────────────────────── step scaffolding ────────────────────────────── */

function StepHeading({ n, children }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2">
      <span className="font-mono text-2xs font-semibold tracking-[0.12em] text-cobalt-600 dark:text-cobalt-300">{n}</span>
      <span className="text-xs font-bold uppercase tracking-[0.04em] text-ink-2">{children}</span>
    </div>
  );
}

function ClassificationPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CLASSIFICATIONS.map((opt) => {
        const active = value === opt.id;
        const Icon = CLASSIFICATION_ICONS[opt.id];
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={cx(
              'flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 text-center transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
              active
                ? 'border-cobalt-600 bg-cobalt-600 text-white shadow-card'
                : 'border-line bg-card text-ink-2 hover:border-cobalt-300 hover:bg-cobalt-50 dark:hover:bg-cobalt-900'
            )}
          >
            <Icon size={22} />
            <span className="text-xs font-bold leading-tight">{opt.label}</span>
            <span className={cx('text-2xs leading-none', active ? 'text-cobalt-100' : 'text-mute')}>{opt.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function OnsetPicker({ onsetVal, onsetUnit, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ONSET_PRESETS.map((preset) => {
        const active = preset.unit === onsetUnit && preset.val === onsetVal;
        return (
          <button
            key={preset.name}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ onsetVal: preset.val, onsetUnit: preset.unit })}
            className={cx(
              'flex h-[60px] flex-col justify-center gap-0.5 rounded-lg border px-3 text-left transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
              active
                ? 'border-cobalt-600 bg-cobalt-600 shadow-card'
                : 'border-line bg-card hover:border-cobalt-300 hover:bg-cobalt-50 dark:hover:bg-cobalt-900'
            )}
          >
            <span className={cx('font-mono text-sm font-semibold', active ? 'text-white' : 'text-ink')}>{preset.name}</span>
            <span className={cx('text-2xs font-medium leading-none', active ? 'text-cobalt-100' : 'text-mute')}>{preset.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function ExclusionRefiner({ items, checked, onToggle, onClear }) {
  // Counted off the authoritative map rather than `items`, so the badge and the
  // Clear control still appear if a checked exclusion is ever filtered out of
  // the visible rows.
  const activeCount = Object.values(checked || {}).filter(Boolean).length;
  return (
    <details className="group overflow-hidden rounded-lg border border-line bg-card">
      <summary className="flex min-h-[52px] cursor-pointer select-none items-center justify-between gap-3 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500">
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-bold text-ink-2">Narrow by clinical exclusions</span>
          <span className="text-2xs text-mute">Optional · {items.length} relevant to the current list</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {activeCount > 0 && (
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-pill bg-crit-600 px-2 font-mono text-2xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          <IconChevron size={16} className="text-mute transition-transform group-open:rotate-90" />
        </span>
      </summary>
      <div className="space-y-1.5 border-t border-paper-2 px-4 py-3">
        {items.map((item) => {
          const on = !!checked[item.id];
          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(item.id, !on)}
              className={cx(
                'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                on
                  ? 'border-crit-300 bg-crit-50 text-crit-800 dark:border-crit-700 dark:bg-crit-950 dark:text-crit-200'
                  : 'border-line bg-card text-ink-2 hover:bg-paper-2'
              )}
            >
              <span className="leading-snug">{item.label}</span>
              <span
                aria-hidden="true"
                className={cx(
                  'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  on ? 'border-crit-600 bg-crit-600 text-white' : 'border-slate-300 bg-card text-transparent dark:border-strong'
                )}
              >
                <IconCheck size={11} />
              </span>
            </button>
          );
        })}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300"
          >
            Clear all exclusions
          </button>
        )}
      </div>
    </details>
  );
}

/* ───────────────────────── results ─────────────────────────────────────── */

function SectionRule({ title, count, tone = 'accent' }) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-3 border-b-2 pb-2',
        tone === 'accent' ? 'border-cobalt-600 dark:border-cobalt-400' : 'border-warn-500'
      )}
    >
      <h2 className="font-serif text-lg font-bold tracking-tight text-ink">{title}</h2>
      <span
        className={cx(
          'inline-flex h-6 min-w-[26px] items-center justify-center rounded-pill px-2 font-mono text-xs font-semibold text-white',
          tone === 'accent' ? 'bg-cobalt-600 dark:bg-cobalt-500' : 'bg-warn-600'
        )}
      >
        {count}
      </span>
    </div>
  );
}

function ResultsPanel({ results, ready, candidateCount, excludedCount, copyBriefing, setModalTrial }) {
  if (!ready) {
    return (
      <div className="rounded-lg border border-dashed border-strong bg-paper-2 px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink-2">Pick a classification to see matching studies.</p>
        <p className="mt-1 text-xs text-mute">Two taps, no data entry.</p>
      </div>
    );
  }

  const candidates = [...results.eligible, ...results.pending];

  return (
    <div className="space-y-4">
      <div>
        <SectionRule title="Possible candidates" count={candidateCount} />
        <p className="mt-2 text-xs leading-relaxed text-mute">
          {results.timeCategory === 'hyperacute'
            ? 'Prioritising hyperacute studies (0–24 h).'
            : results.timeCategory === 'acute_subacute'
            ? 'Prioritising acute–subacute studies (24 h–30 d).'
            : 'Prioritising subacute–chronic studies (30 d and later).'}{' '}
          First-pass screen only — confirm against the full registry record.
        </p>
      </div>

      {candidates.length > 0 && (
        <div className="space-y-3">
          {candidates.map((item) => (
            <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
          ))}
        </div>
      )}

      {results.soon.length > 0 && (
        <section className="space-y-3">
          <SectionRule title="Enrolling soon" count={results.soon.length} tone="warn" />
          {results.soon.map((item) => (
            <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
          ))}
        </section>
      )}

      {candidateCount === 0 && results.soon.length === 0 && (
        <div className="rounded-lg border border-line bg-card px-6 py-8 text-center">
          <p className="text-sm font-medium text-ink-2">No active study matches this classification and window.</p>
          <p className="mt-1 text-xs text-mute">Try a different onset window, or browse every study in the Database view.</p>
        </div>
      )}

      {/* Briefing note */}
      <section className="overflow-hidden rounded-lg border border-line bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-paper-2 bg-paper-2 px-3 py-2">
          <span className="font-mono text-2xs font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-ink-2">
            Briefing note
          </span>
          <button
            type="button"
            onClick={copyBriefing}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-xs font-bold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300"
          >
            <IconCopy size={13} />
            Copy
          </button>
        </div>
        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-2xs leading-relaxed text-slate-700 dark:text-ink-2">
          {results.briefingNote}
        </pre>
      </section>

      {/* Excluded / closed / unverified */}
      {excludedCount > 0 && (
        <details className="group overflow-hidden rounded-lg border border-line bg-card">
          <summary className="flex min-h-[52px] cursor-pointer select-none items-center justify-between gap-3 bg-paper-2 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500">
            <span className="flex items-center gap-2.5 text-sm font-bold text-ink-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-slate-300 dark:bg-slate-600" />
              Excluded, closed &amp; unverified · {excludedCount}
            </span>
            <IconChevron size={16} className="shrink-0 text-mute transition-transform group-open:rotate-90" />
          </summary>
          <ul className="divide-y divide-paper-2">
            {[...results.excluded, ...results.closed, ...results.incomplete].map((item) => (
              <li key={item.trial.acronym}>
                <ResultCard item={item} onOpenDetails={setModalTrial} compact />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* ───────────────────────── main screener ───────────────────────────────── */

export function TrialScreener({ copyToClipboard, addToast, initialState }) {
  const [state, setState] = useState(() => initialState || createInitialScreenerState());
  const [modalTrial, setModalTrial] = useState(null);

  const set = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const setExclusion = useCallback((id, val) => {
    setState((s) => ({ ...s, exclusions: { ...s.exclusions, [id]: val } }));
  }, []);
  const clearExclusions = useCallback(() => setState((s) => ({ ...s, exclusions: {} })), []);

  const results = useMemo(() => evaluateAll(state), [state]);
  const ready = results.ready;
  const cls = state.classification;

  const onsetHours = onsetToHours(state.onsetVal, state.onsetUnit);
  const onsetDays = onsetHours / 24;
  const onsetMonths = onsetDays / 30;

  // Which trials this classification + onset window could reach — gates which
  // optional exclusion rows are worth showing.
  //
  // Deliberately evaluated with `exclusions: {}`. Ticking an exclusion is
  // exactly what makes its trial inactive, so folding the user's own ticks in
  // here made every row erase itself the instant it was checked, leaving the
  // flag latched in state with no control left to untick it.
  const activeAcronyms = useMemo(() => {
    if (!ready) return [];
    const p = buildScreenerParams({ ...state, exclusions: {} });
    return screenerTrials.filter((t) => isTrialPotentiallyActive(t, p)).map((t) => t.acronym);
  }, [state, ready]);

  const visibleExclusions = useMemo(() => {
    if (!ready) return [];
    return EXCLUSION_ITEMS.filter(
      (item) => item.classifications.includes(cls) && item.trials.some((acr) => activeAcronyms.includes(acr))
    );
  }, [cls, activeAcronyms, ready]);

  const copyBriefing = useCallback(() => {
    if (copyToClipboard) copyToClipboard(results.briefingNote, 'Trial screener briefing');
    else if (addToast) addToast('Clipboard helper unavailable', 'error');
  }, [copyToClipboard, addToast, results.briefingNote]);

  const anyExclusionChecked = Object.values(state.exclusions || {}).some(Boolean);

  const candidateCount = results.eligible.length + results.pending.length;
  const excludedCount = results.excluded.length + results.closed.length + results.incomplete.length;

  const onsetLabel =
    onsetHours < 48 ? `${onsetHours.toFixed(1)} h` : onsetDays < 60 ? `${onsetDays.toFixed(1)} d` : `${onsetMonths.toFixed(1)} mo`;

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* ── Steps ── */}
      <div className="space-y-5 lg:sticky lg:top-24">
        <section>
          <StepHeading n="01">What are you screening?</StepHeading>
          <ClassificationPicker
            value={cls}
            onChange={(opt) =>
              set({ classification: opt.id, onsetVal: opt.onsetVal, onsetUnit: 'hours', exclusions: {} })
            }
          />
        </section>

        {ready && (
          <section>
            <StepHeading n="02">Time since last known well</StepHeading>
            <OnsetPicker onsetVal={state.onsetVal} onsetUnit={state.onsetUnit} onChange={set} />
            <p className="mt-2 font-mono text-2xs text-mute">
              {CLASSIFICATION_LABELS[cls]} · about {onsetLabel} since LKW
            </p>
          </section>
        )}

        {ready && (visibleExclusions.length > 0 || anyExclusionChecked) && (
          <ExclusionRefiner
            items={visibleExclusions}
            checked={state.exclusions}
            onToggle={setExclusion}
            onClear={clearExclusions}
          />
        )}
      </div>

      {/* ── Live results ── */}
      <ResultsPanel
        results={results}
        ready={ready}
        candidateCount={candidateCount}
        excludedCount={excludedCount}
        copyBriefing={copyBriefing}
        setModalTrial={setModalTrial}
      />

      {modalTrial && <TrialDetailsModal trial={modalTrial} onClose={() => setModalTrial(null)} />}
    </div>
  );
}

/* ───────────────────────── study database ──────────────────────────────── */

const DB_FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'enrolling', label: 'Enrolling', match: (t) => t.status === 'enrolling' },
  { id: 'soon', label: 'Soon', match: (t) => t.status === 'soon' },
  { id: 'unverified', label: 'Unverified', match: (t) => t.status === 'placeholder' }
];

export function StudyDatabase() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [openAcronym, setOpenAcronym] = useState(null);
  const [modalTrial, setModalTrial] = useState(null);

  const counts = useMemo(() => {
    const out = {};
    DB_FILTERS.forEach((f) => {
      out[f.id] = screenerTrials.filter(f.match).length;
    });
    return out;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byStatus = (DB_FILTERS.find((f) => f.id === filter) || DB_FILTERS[0]).match;
    return screenerTrials.filter((t) => {
      if (!byStatus(t)) return false;
      if (!q) return true;
      return [t.acronym, t.exactFullStudyName, t.conciseBedsideSummary, t.externalMetadata.nct]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, filter]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-mute">
          <IconSearch size={17} />
        </span>
        <input
          id="trial-db-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search acronym, name or NCT…"
          aria-label="Search the study database by acronym, name or NCT number"
          className="h-12 w-full rounded-lg border border-line bg-card pl-11 pr-4 text-base text-ink placeholder:text-slate-500 focus:border-cobalt-500 focus:outline-none focus:ring-2 focus:ring-cobalt-500/40 dark:placeholder:text-mute"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter studies by status">
        {DB_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={cx(
                'inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border px-4 text-sm font-semibold transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                active
                  ? 'border-cobalt-600 bg-cobalt-600 text-white'
                  : 'border-line bg-card text-ink-2 hover:bg-paper-2'
              )}
            >
              {f.label}
              <span className={cx('font-mono text-2xs', active ? 'text-cobalt-100' : 'text-mute')}>{counts[f.id]}</span>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-2xs text-mute">
        {filtered.length} of {screenerTrials.length} studies
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((trial) => {
          const open = openAcronym === trial.acronym;
          return (
            <article
              key={trial.acronym}
              className={cx(
                'flex flex-col rounded-lg border bg-card p-4 shadow-card',
                open ? 'border-cobalt-300 dark:border-cobalt-700' : 'border-line'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-bold tracking-tight text-ink">{trial.acronym}</h3>
                  <p className="mt-0.5 text-xs leading-snug text-mute">{trial.exactFullStudyName}</p>
                </div>
                <StatusBadge status={trialBadgeStatus(trial)} />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-2">{trial.conciseBedsideSummary}</p>

              {trial.enrollmentWindowText && trial.enrollmentWindowText !== 'N/A' && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-paper-2 px-2 py-1 font-mono text-2xs text-slate-700 dark:text-ink-2">
                    <IconClock size={12} strokeWidth={2.2} />
                    {trial.enrollmentWindowText}
                  </span>
                </div>
              )}

              {open && (
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-paper-2 pt-4">
                  <div className="border-l-2 border-ok-200 pl-3 dark:border-ok-800">
                    <p className="font-mono text-2xs font-bold uppercase tracking-[0.09em] text-ok-700 dark:text-ok-300">Inclusion</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-2">
                      {trial.exactInclusionCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-l-2 border-crit-200 pl-3 dark:border-crit-800">
                    <p className="font-mono text-2xs font-bold uppercase tracking-[0.09em] text-crit-700 dark:text-crit-300">Key exclusions</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-2">
                      {trial.exactExclusionCriteria.length > 0 ? (
                        trial.exactExclusionCriteria.map((c, i) => <li key={i}>{c}</li>)
                      ) : (
                        <li>None specified in source</li>
                      )}
                    </ul>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-2">
                    <span className="font-semibold text-ink">Referral pathway:</span> {trial.pathway}
                  </p>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-paper-2 pt-2">
                {trial.externalMetadata.nct ? (
                  <a
                    href={trial.externalMetadata.registryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center font-mono text-2xs font-semibold text-link-600 underline hover:text-link-700 dark:text-cobalt-300"
                  >
                    {trial.externalMetadata.nct} ↗
                  </a>
                ) : (
                  <span className="font-mono text-2xs text-mute">No registry record</span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOpenAcronym(open ? null : trial.acronym)}
                    aria-expanded={open}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded px-2 text-xs font-bold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300"
                  >
                    Criteria
                    <IconChevron size={13} className={cx('transition-transform', open ? '-rotate-90' : 'rotate-90')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTrial(trial)}
                    aria-label={`Open full details for ${trial.acronym}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded text-mute hover:text-ink-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
                  >
                    <Glyph size={16} strokeWidth={2.1}>
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                    </Glyph>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-line bg-card px-6 py-8 text-center">
          <p className="text-sm font-medium text-ink-2">No studies match that search.</p>
        </div>
      )}

      {modalTrial && <TrialDetailsModal trial={modalTrial} onClose={() => setModalTrial(null)} />}
    </div>
  );
}

export default TrialScreener;
