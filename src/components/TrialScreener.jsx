// src/components/TrialScreener.jsx
//
// Native bedside Trial Screener — replaces the standalone iframe in the Trials
// tab. v7 styling/tokens (single cobalt accent; warn/crit/ok semantics; slate
// neutrals). No institutional identifiers, no PHI capture, no localStorage.
//
//   Left  = progressive questionnaire (Stroke Classification → Time-since-LKW
//           pills → dynamic Core Bedside Facts → dynamic exclusions checklist).
//   Right = live results (🟡 Possible-Pending / ⏳ Enrolling-Soon / collapsed
//           Excluded & Incomplete) with per-card "Why matched", "Pending
//           inputs", referral pathway, a copy-paste briefing-note block, and a
//           per-trial details modal.
//   Plus a searchable "Study Database" sub-view over the same trials.
//
// State = one `screenerState` object; results = useMemo(evaluateAll(state)).
//
// `copyToClipboard` + `addToast` are passed in from app.jsx (the app's shared
// helpers + toast system) so the briefing-note copy reuses one code path.

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  screenerTrials
} from '../evidence/screenerTrials.js';
import {
  evaluateAll,
  evaluateTrialEligibility,
  buildScreenerParams,
  isTrialPotentiallyActive,
  createInitialScreenerState,
  onsetToHours,
  ONSET_PRESETS,
  EXCLUSION_ITEMS
} from '../evidence/screener-eval.js';

const cx = (...p) => p.filter(Boolean).join(' ');

const COMPLIANCE_BANNER =
  'Synthetic public demo — not for clinical decision-making. Do not enter real patient identifiers or PHI. Registry matches are first-pass screens only and must be confirmed against the full ClinicalTrials.gov record and approved local study materials before clinical action.';

/* ───────────────────────── small building blocks ───────────────────────── */

function SelectField({ label, value, onChange, options, id }) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 text-base bg-white text-slate-900 border border-slate-200 rounded-md appearance-none pr-9 focus:outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/40"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min, max, placeholder, id }) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value === 'unselected' ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? 'unselected' : parseInt(e.target.value, 10))}
        className="w-full h-11 px-3 text-base bg-white text-slate-900 placeholder:text-slate-500 border border-slate-200 rounded-md focus:outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/40"
      />
    </label>
  );
}

// Tri-state yes/no/unselected control. `value` is true | false | 'unselected'.
function YesNoField({ label, value, onChange, yesLabel = 'Yes', noLabel = 'No', id }) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value === true ? 'yes' : value === false ? 'no' : 'unselected'}
      onChange={(v) => onChange(v === 'unselected' ? 'unselected' : v === 'yes')}
      options={[
        { value: 'unselected', label: 'Select…' },
        { value: 'yes', label: yesLabel },
        { value: 'no', label: noLabel }
      ]}
    />
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: 'bg-warn-50 text-warn-800 border-warn-200', text: 'Possible · Pending' },
    soon: { cls: 'bg-warn-50 text-warn-800 border-warn-200', text: 'Enrolling Soon' },
    excluded: { cls: 'bg-slate-100 text-slate-600 border-slate-200', text: 'Excluded' },
    closed: { cls: 'bg-slate-100 text-slate-600 border-slate-200', text: 'Closed' },
    placeholder: { cls: 'bg-crit-50 text-crit-800 border-crit-200', text: 'Unverified' },
    enrolling: { cls: 'bg-ok-50 text-ok-800 border-ok-200', text: 'Enrolling' }
  };
  const m = map[status] || map.excluded;
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide', m.cls)}>
      {m.text}
    </span>
  );
}

/* ───────────────────────── trial details modal ─────────────────────────── */

function TrialDetailsModal({ trial, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!trial) return null;
  const badgeStatus =
    trial.status === 'enrolling'
      ? 'enrolling'
      : trial.status === 'soon'
      ? 'soon'
      : trial.status === 'placeholder'
      ? 'placeholder'
      : 'closed';

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} role="presentation" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[61] mx-auto max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-slate-200"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-start justify-between gap-3 z-10">
          <div>
            <h2 id="trial-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
              {trial.acronym}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">{trial.exactFullStudyName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={badgeStatus} />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close trial details"
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clinical Hypothesis</p>
            <p className="text-sm text-slate-700 mt-1">{trial.sourceHypothesisText || 'Not specified in source'}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public Registry (NCT)</p>
            {trial.externalMetadata.nct ? (
              <a
                href={trial.externalMetadata.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-cobalt-700 underline mt-1 inline-block"
              >
                {trial.externalMetadata.nct} ↗
              </a>
            ) : (
              <p className="text-sm text-slate-500 mt-1">No registry record — not verifiable</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inclusion Criteria</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm text-slate-700">
                {trial.exactInclusionCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exclusion Criteria</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm text-slate-700">
                {trial.exactExclusionCriteria.length > 0 ? (
                  trial.exactExclusionCriteria.map((c, i) => <li key={i}>{c}</li>)
                ) : (
                  <li>None specified in source</li>
                )}
              </ul>
            </div>
          </div>

          {trial.sourceGaps && trial.sourceGaps.length > 0 && (
            <div className="rounded-md border-l-4 border-crit-600 bg-crit-50 px-3 py-2">
              <p className="text-xs font-semibold text-crit-800">Registry / Protocol Verification Notes</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-crit-800">
                {trial.sourceGaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 text-sm text-slate-700">
            <span className="font-semibold">Referral Pathway:</span> {trial.pathway}
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── result card ─────────────────────────────────── */

function ResultCard({ item, onOpenDetails }) {
  const { trial, status, matchedCriteria, pendingCriteria, pendingFields, exclusionReasons, sourceGaps } = item;
  const isHyperacute = trial.timeCategory === 'hyperacute';
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenDetails(trial)}
          className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded"
        >
          <span className="text-base font-bold text-slate-900 underline decoration-dotted group-hover:text-cobalt-700">
            {trial.acronym}
          </span>
          <span className="block text-xs text-slate-600 mt-0.5">
            {trial.exactFullStudyName}
            {trial.externalMetadata.nct ? ' · ' + trial.externalMetadata.nct : ''}
          </span>
        </button>
        <StatusBadge status={status} />
      </div>

      {trial.enrollmentWindowText && trial.enrollmentWindowText !== 'N/A' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-2xs font-mono text-slate-700">
            ⏱ Onset Window: {trial.enrollmentWindowText}
          </span>
          {isHyperacute && (
            <span className="inline-flex items-center rounded bg-warn-50 px-2 py-0.5 text-2xs font-semibold text-warn-800">
              ⚡ Time-Sensitive
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-sm text-slate-700">{trial.conciseBedsideSummary}</p>

      {exclusionReasons && exclusionReasons.length > 0 ? (
        <div className="mt-3 rounded-md border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-700">Exclusion Reasons</p>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-600">
            {exclusionReasons.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {pendingFields && pendingFields.length > 0 && (
            <div className="mt-3 rounded-md border-l-4 border-warn-600 bg-warn-50 px-3 py-2">
              <p className="text-xs font-semibold text-warn-800">Pending Bedside Inputs</p>
              <p className="text-xs text-warn-800 mt-0.5">{pendingFields.join(', ')}</p>
            </div>
          )}
          {matchedCriteria && matchedCriteria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-ok-800">Why It Matched</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-700">
                {matchedCriteria.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {pendingCriteria && pendingCriteria.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-700">Pending Bedside Confirmations</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-600">
                {pendingCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {sourceGaps && sourceGaps.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
            Registry / source verification notes
          </summary>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-2xs text-slate-500">
            {sourceGaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <p className="text-xs text-slate-700">
          <span className="font-semibold">Referral:</span> {trial.pathway}
        </p>
        <button
          type="button"
          onClick={() => onOpenDetails(trial)}
          className="shrink-0 text-xs font-semibold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded px-1"
        >
          Details ↗
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── study database sub-view ─────────────────────── */

function StudyDatabase({ onOpenDetails }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return screenerTrials;
    return screenerTrials.filter((t) =>
      [t.acronym, t.exactFullStudyName, t.conciseBedsideSummary, t.externalMetadata.nct]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1" htmlFor="trial-db-search">
        <span className="text-xs font-medium text-slate-600">Search the study database (acronym, name, NCT)</span>
        <input
          id="trial-db-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. SISTER, EVT, NCT05948566"
          className="w-full h-11 px-3 text-base bg-white text-slate-900 placeholder:text-slate-500 border border-slate-200 rounded-md focus:outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/40"
        />
      </label>
      <p className="text-xs text-slate-500">
        {filtered.length} of {screenerTrials.length} studies
      </p>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((trial) => {
          const badgeStatus =
            trial.status === 'enrolling'
              ? 'enrolling'
              : trial.status === 'soon'
              ? 'soon'
              : trial.status === 'placeholder'
              ? 'placeholder'
              : 'closed';
          return (
            <div key={trial.acronym} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenDetails(trial)}
                    className="text-base font-bold text-slate-900 underline decoration-dotted hover:text-cobalt-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded"
                  >
                    {trial.acronym}
                  </button>
                  <p className="text-xs text-slate-600 mt-0.5">{trial.exactFullStudyName}</p>
                </div>
                <StatusBadge status={badgeStatus} />
              </div>
              <p className="mt-2 text-sm text-slate-700">{trial.conciseBedsideSummary}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Inclusion</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-700">
                    {trial.exactInclusionCriteria.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">Exclusion</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-700">
                    {trial.exactExclusionCriteria.length > 0 ? (
                      trial.exactExclusionCriteria.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                      <li>None specified in source</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                {trial.externalMetadata.nct ? (
                  <a
                    href={trial.externalMetadata.registryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-cobalt-700 underline"
                  >
                    {trial.externalMetadata.nct} ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No registry record</span>
                )}
                <button
                  type="button"
                  onClick={() => onOpenDetails(trial)}
                  className="text-xs font-semibold text-cobalt-700 hover:text-cobalt-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded px-1"
                >
                  Details ↗
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── main component ──────────────────────────────── */

export function TrialScreener({ copyToClipboard, addToast, initialState }) {
  const [view, setView] = useState('screener'); // 'screener' | 'database'
  const [state, setState] = useState(() => initialState || createInitialScreenerState());
  const [modalTrial, setModalTrial] = useState(null);

  const set = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const setExclusion = useCallback((id, val) => {
    setState((s) => ({ ...s, exclusions: { ...s.exclusions, [id]: val } }));
  }, []);

  const results = useMemo(() => evaluateAll(state), [state]);

  // Onset breakdown for conditional field visibility.
  const onsetHours = onsetToHours(state.onsetVal, state.onsetUnit);
  const onsetDays = onsetHours / 24;
  const onsetMonths = onsetDays / 30;
  const cls = state.classification;
  const ready = results.ready;

  // Which trials are still potentially active — gates the exclusion rows.
  const activeAcronyms = useMemo(() => {
    if (!ready) return [];
    const p = buildScreenerParams(state);
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

  const isChronicIschemic = cls === 'ischemic' && onsetMonths >= 6;
  const mrsLabel = isChronicIschemic ? 'Current mRS (Post-Stroke)' : 'Pre-Stroke mRS';

  const candidateCount = results.pending.length + results.soon.length;
  const excludedCount = results.excluded.length + results.closed.length + results.incomplete.length;

  return (
    <div className="space-y-4">
      {/* Compliance banner */}
      <div className="rounded-md border-l-4 border-crit-600 bg-crit-50 px-4 py-3">
        <p className="text-xs text-crit-800">
          <span className="font-bold">Synthetic public demo — not for clinical decision-making.</span>{' '}
          {COMPLIANCE_BANNER.replace('Synthetic public demo — not for clinical decision-making. ', '')}
        </p>
      </div>

      {/* Sub-view toggle */}
      <div className="inline-flex p-1 rounded-md bg-slate-100" role="tablist" aria-label="Trial screener view">
        {[
          { id: 'screener', label: 'Bedside Screener' },
          { id: 'database', label: 'Study Database' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={cx(
              'h-9 px-3 text-sm font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
              view === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'database' ? (
        <StudyDatabase onOpenDetails={setModalTrial} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ───────── LEFT: progressive questionnaire ───────── */}
          <div className="space-y-5">
            {/* 1. Classification */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">1 · Stroke Classification</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'ischemic', label: 'Ischemic Stroke' },
                  { id: 'tia', label: 'TIA' },
                  { id: 'ich', label: 'ICH' }
                ].map((opt) => {
                  const active = cls === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        set({
                          classification: opt.id,
                          onsetVal: opt.id === 'ich' ? 3 : opt.id === 'tia' ? 12 : 2,
                          onsetUnit: 'hours'
                        })
                      }
                      className={cx(
                        'h-12 rounded-md border px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                        active
                          ? 'border-cobalt-600 bg-cobalt-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-cobalt-300 hover:bg-cobalt-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {ready && (
              <>
                {/* 2. Time since LKW */}
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">2 · Time Since LKW</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ONSET_PRESETS.map((preset) => {
                      const active = preset.unit === state.onsetUnit && preset.val === state.onsetVal;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          aria-pressed={active}
                          onClick={() => set({ onsetVal: preset.val, onsetUnit: preset.unit })}
                          className={cx(
                            'flex flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                            active
                              ? 'border-cobalt-600 bg-cobalt-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-cobalt-300 hover:bg-cobalt-50'
                          )}
                        >
                          <span className="text-sm font-bold">{preset.name}</span>
                          <span className={cx('text-2xs', active ? 'text-cobalt-50' : 'text-slate-500')}>{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-2xs font-mono text-slate-500">
                    Onset ≈ {onsetHours < 48 ? `${onsetHours.toFixed(1)}h` : onsetDays < 60 ? `${onsetDays.toFixed(1)}d` : `${onsetMonths.toFixed(1)}mo`} since LKW
                  </p>
                </section>

                {/* 3. Core bedside facts (dynamic) */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">3 · Core Bedside Facts</h3>

                  <NumberField id="ts-age" label="Patient Age (years)" value={state.age} min={18} max={120} placeholder="e.g. 65" onChange={(v) => set({ age: v })} />

                  {(cls === 'ischemic' || (cls === 'ich' && onsetHours <= 16)) && (
                    <NumberField id="ts-nihss" label="NIHSS Severity Score" value={state.nihss} min={0} max={42} placeholder="e.g. 8" onChange={(v) => set({ nihss: v })} />
                  )}

                  {(cls === 'ischemic' || cls === 'ich' || cls === 'tia') && (
                    <SelectField
                      id="ts-mrs"
                      label={mrsLabel}
                      value={state.preMrs}
                      onChange={(v) => set({ preMrs: v === 'unselected' ? 'unselected' : parseInt(v, 10) })}
                      options={[
                        { value: 'unselected', label: 'Select…' },
                        { value: '0', label: '0 — No symptoms' },
                        { value: '1', label: '1 — No significant disability' },
                        { value: '2', label: '2 — Slight disability (independent)' },
                        { value: '3', label: '3 — Moderate disability (needs help, walks)' },
                        { value: '4', label: '4 — Moderately severe (cannot walk)' }
                      ]}
                    />
                  )}

                  {cls === 'ischemic' && onsetHours <= 24 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <NumberField id="ts-aspects" label="CT ASPECTS Score" value={state.aspects} min={0} max={10} placeholder="e.g. 8" onChange={(v) => set({ aspects: v })} />
                      <SelectField
                        id="ts-vessel"
                        label="Vessel Occlusion (CTA)"
                        value={state.vessel}
                        onChange={(v) => set({ vessel: v })}
                        options={[
                          { value: 'unselected', label: 'Select…' },
                          { value: 'none', label: 'None / No LVO' },
                          { value: 'ica_m1', label: 'Intracranial ICA / MCA M1' },
                          { value: 'm2_m3_nd', label: 'Non-dominant/Co-dominant M2/M3' },
                          { value: 'dominant_m2', label: 'Dominant M2 branch' },
                          { value: 'dominant_m3', label: 'Dominant M3 branch' }
                        ]}
                      />
                    </div>
                  )}

                  {cls === 'ischemic' && onsetHours <= 24 && (
                    <YesNoField id="ts-ant" label="Anterior Circulation?" value={state.anteriorCirculation} onChange={(v) => set({ anteriorCirculation: v })} />
                  )}

                  {cls === 'ischemic' && onsetHours <= 120 && (
                    <YesNoField id="ts-p24" label="Presented within 24h of onset?" value={state.presentedWithin24h} onChange={(v) => set({ presentedWithin24h: v })} />
                  )}

                  {cls === 'ich' && (
                    <>
                      <SelectField
                        id="ts-loc"
                        label="Hemorrhage Location"
                        value={state.ichLocation}
                        onChange={(v) => set({ ichLocation: v })}
                        options={[
                          { value: 'unselected', label: 'Select…' },
                          { value: 'bg', label: 'Deep / Basal Ganglia' },
                          { value: 'lobar', label: 'Lobar' },
                          { value: 'thalamic', label: 'Thalamic' },
                          { value: 'infratentorial', label: 'Infratentorial' }
                        ]}
                      />
                      {onsetHours <= 16 && (
                        <SelectField
                          id="ts-vol"
                          label="Hematoma Volume"
                          value={state.volume}
                          onChange={(v) => set({ volume: v })}
                          options={[
                            { value: 'unselected', label: 'Select…' },
                            { value: 'bg_small', label: 'Small/Moderate (< 20 mL)' },
                            { value: 'bg_large', label: 'Large (≥ 20 mL)' }
                          ]}
                        />
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <YesNoField id="ts-statin" label="Statin at Onset" value={state.statin} yesLabel="On statin drug" noLabel="No statin" onChange={(v) => set({ statin: v })} />
                        <YesNoField id="ts-afib-ich" label="AFib History" value={state.afibHistory} yesLabel="Clinical AFib" noLabel="No AFib history" onChange={(v) => set({ afibHistory: v })} />
                      </div>
                    </>
                  )}

                  {(cls === 'ischemic' || cls === 'tia') && onsetDays <= 365 && (
                    <SelectField
                      id="ts-afib-oac"
                      label="AFib & Anticoagulation"
                      value={
                        state.afibHistory === true && state.takingOac === true
                          ? 'afib_oac'
                          : state.afibHistory === true && state.takingOac === false
                          ? 'afib_no_oac'
                          : state.afibHistory === false && state.takingOac === false
                          ? 'none'
                          : 'unselected'
                      }
                      onChange={(v) => {
                        if (v === 'unselected') set({ afibHistory: 'unselected', takingOac: 'unselected' });
                        else if (v === 'none') set({ afibHistory: false, takingOac: false });
                        else if (v === 'afib_no_oac') set({ afibHistory: true, takingOac: false });
                        else if (v === 'afib_oac') set({ afibHistory: true, takingOac: true });
                      }}
                      options={[
                        { value: 'unselected', label: 'Select…' },
                        { value: 'none', label: 'No AFib, not on OAC' },
                        { value: 'afib_no_oac', label: 'AFib, not on OAC' },
                        { value: 'afib_oac', label: 'AFib, on OAC' }
                      ]}
                    />
                  )}

                  {(cls === 'ischemic' || cls === 'tia') && onsetDays <= 180 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SelectField
                        id="ts-etio"
                        label="Subtype / Etiology"
                        value={state.etiology}
                        onChange={(v) => set({ etiology: v })}
                        options={[
                          { value: 'unselected', label: 'Select…' },
                          { value: 'laa', label: 'Large Artery Atherosclerosis' },
                          { value: 'lacunar', label: 'Lacunar / Small Vessel' },
                          { value: 'esus', label: 'ESUS / Cryptogenic' },
                          { value: 'other_noncardiac', label: 'Other noncardiac subtype' },
                          { value: 'cardioembolic', label: 'Cardioembolic' }
                        ]}
                      />
                      <YesNoField id="ts-sapt" label="Single Antiplatelet SOC?" value={state.singleAntiplateletSoc} onChange={(v) => set({ singleAntiplateletSoc: v })} />
                    </div>
                  )}

                  {/* Rehab & recovery factors */}
                  {(cls === 'ischemic' || cls === 'ich') && onsetHours >= 24 && (
                    <div className="space-y-3 border-t border-slate-200 pt-3">
                      <h4 className="text-xs font-semibold text-slate-700">Rehabilitation &amp; Recovery Factors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <YesNoField id="ts-rehab" label="Planned Inpatient Rehab?" value={state.rehab} onChange={(v) => set({ rehab: v })} />
                        <YesNoField id="ts-lang" label="Language Spoken" value={state.language} yesLabel="English or Spanish" noLabel="Other" onChange={(v) => set({ language: v })} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <YesNoField id="ts-ue" label="UE Deficit/Weakness?" value={state.ueWeakness} onChange={(v) => set({ ueWeakness: v })} />
                        <YesNoField id="ts-consent" label="Able to Self-Consent?" value={state.self_consent} onChange={(v) => set({ self_consent: v })} />
                      </div>
                      {cls === 'ischemic' && onsetMonths >= 6 && (
                        <YesNoField id="ts-54w" label="Available for 54-week visits?" value={state.availability_54w} onChange={(v) => set({ availability_54w: v })} />
                      )}
                      {cls === 'ischemic' && onsetHours >= 24 && onsetHours <= 96 && (
                        <YesNoField id="ts-uni" label="Unilateral Symptomatic AIS?" value={state.unilateralSymptomatic} onChange={(v) => set({ unilateralSymptomatic: v })} />
                      )}
                    </div>
                  )}
                </section>

                {/* 4. Exclusions checklist (dynamic) */}
                {visibleExclusions.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      4 · Scan for Key Clinical Exclusions (check any that apply)
                    </h3>
                    <div className="grid grid-cols-1 gap-1.5">
                      {visibleExclusions.map((item) => {
                        const checked = !!state.exclusions[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => setExclusion(item.id, !checked)}
                            className={cx(
                              'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                              checked
                                ? 'border-crit-300 bg-crit-50 text-crit-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <span>{item.label}</span>
                            <span
                              aria-hidden="true"
                              className={cx(
                                'shrink-0 inline-flex h-5 w-5 items-center justify-center rounded border text-xs font-bold',
                                checked ? 'border-crit-600 bg-crit-600 text-white' : 'border-slate-300 bg-white text-transparent'
                              )}
                            >
                              ✓
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* ───────── RIGHT: live results ───────── */}
          <div className="space-y-4">
            {!ready ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600">Select a stroke classification to begin screening.</p>
              </div>
            ) : (
              <>
                {/* Time-priority banner */}
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-700">
                    Prioritizing:{' '}
                    <span className="font-bold text-cobalt-700">
                      {results.timeCategory === 'hyperacute'
                        ? '⚡ Hyperacute Phase (0–24h)'
                        : results.timeCategory === 'acute_subacute'
                        ? '📅 Acute–Subacute Phase (24h–30d)'
                        : '🔄 Subacute–Chronic Phase (30d+)'}
                    </span>
                  </p>
                  <span className="hidden sm:inline text-2xs text-slate-500">Sorted by onset-window proximity</span>
                </div>

                {/* Possible / Pending candidates */}
                {results.pending.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold text-warn-800">🟡 Possible Candidates (Pending Inputs) — {results.pending.length}</h3>
                    {results.pending.map((item) => (
                      <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
                    ))}
                  </section>
                )}

                {/* Enrolling soon */}
                {results.soon.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-bold text-warn-800">⏳ Enrolling Soon / Future Match — {results.soon.length}</h3>
                    {results.soon.map((item) => (
                      <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
                    ))}
                  </section>
                )}

                {candidateCount === 0 && (
                  <div className="rounded-md border border-slate-200 bg-white p-6 text-center">
                    <p className="text-sm text-slate-600">No active study matches for the current parameters.</p>
                  </div>
                )}

                {/* Briefing note */}
                <section className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Copy-paste briefing note</h3>
                    <button
                      type="button"
                      onClick={copyBriefing}
                      className="inline-flex items-center gap-1.5 rounded-md border border-cobalt-300 bg-cobalt-50 px-3 py-1.5 text-xs font-semibold text-cobalt-700 hover:bg-cobalt-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
                    >
                      Copy briefing
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words rounded bg-slate-50 border border-slate-200 p-3 text-2xs font-mono text-slate-700 max-h-64 overflow-y-auto">
                    {results.briefingNote}
                  </pre>
                </section>

                {/* Excluded / closed / incomplete (collapsed) */}
                {excludedCount > 0 && (
                  <details className="rounded-md border border-slate-200 bg-white">
                    <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900">
                      🔴 Excluded / Closed / Unverified ({excludedCount})
                    </summary>
                    <div className="space-y-3 px-4 pb-4">
                      {results.excluded.map((item) => (
                        <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
                      ))}
                      {results.closed.map((item) => (
                        <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
                      ))}
                      {results.incomplete.map((item) => (
                        <ResultCard key={item.trial.acronym} item={item} onOpenDetails={setModalTrial} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {modalTrial && <TrialDetailsModal trial={modalTrial} onClose={() => setModalTrial(null)} />}
    </div>
  );
}

export default TrialScreener;
