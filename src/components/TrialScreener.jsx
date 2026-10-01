import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogChrome } from './use-dialog-chrome.js';
import { screenerTrials } from '../evidence/screenerTrials.js';
import { eligibilityTables } from '../evidence/eligibilityTables.js';
import { evaluateAll, buildScreenerParams, isTrialPotentiallyActive, createInitialScreenerState, ONSET_PRESETS, EXCLUSION_ITEMS } from '../evidence/screener-eval.js';

const CLASSIFICATIONS = [['ischemic', 'Ischemic stroke'], ['tia', 'TIA'], ['ich', 'Hemorrhage (ICH)']];
const statusText = { pending: 'Possible candidate', eligible: 'Possible candidate', soon: 'Not yet enrolling', excluded: 'Modeled criterion not met', closed: 'Not enrolling in recorded profile', placeholder: 'Unverified profile', enrolling: 'Recruiting at recorded check' };
const buttonClass = 'min-h-[44px] rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-cobalt-500';
const STATUS_FILTERS = [['all', 'All statuses'], ['enrolling', 'Recruiting at recorded check'], ['soon', 'Not yet recruiting at recorded check'], ['closed', 'Not enrolling in stored profile'], ['placeholder', 'Unverified']];

// Classification filters describe the stored profile, independently of recruitment
// status. Table membership supplies the category for closed profiles with no rules.
function matchesClassification(trial, classification) {
  if (classification === 'all') return true;
  const criterion = trial.eligibility?.criteria.find(item => item.field === 'classification');
  if (criterion) return Array.isArray(criterion.value) ? criterion.value.includes(classification) : criterion.value === classification;
  return eligibilityTables.some(table => table.category === classification && table.trials.some(item => item.acronym === trial.acronym));
}

export function TrialSourceContext({ trial }) {
  const m = trial.externalMetadata || {};
  return <div className="mt-2 text-xs leading-relaxed text-mute" data-trial-source-context={trial.acronym}><p>Registry status at recorded check: {m.registryStatus?.replace(/_/g, ' ').toLowerCase() || 'Not verified'}. Recorded registry check: {m.verificationDate ? <time dateTime={m.verificationDate}>{m.verificationDate}</time> : 'Not recorded'}.{m.registryLastUpdatePosted && <> Registry last update posted: {m.registryLastUpdatePosted}.</>}</p><p>Local activation: not confirmed here. Confirm the current registry record and study-team availability; the recorded check does not establish complete eligibility.</p></div>;
}

function TrialDetailsModal({ trial, onClose }) {
  const dialogRef = useRef(null), closeRef = useRef(null);
  useDialogChrome({ dialogRef, initialFocusRef: closeRef, onClose });
  return createPortal(<><div className="fixed inset-0 z-[60] bg-slate-950/50" onClick={onClose} aria-hidden="true" /><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="trial-modal-title" className="fixed inset-x-4 bottom-4 top-12 z-[61] overflow-y-auto rounded-lg border border-line bg-card p-5 shadow-pop sm:mx-auto sm:max-w-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="trial-modal-title" className="text-xl font-bold">{trial.acronym}</h2><p className="text-sm text-mute">{trial.exactFullStudyName}</p></div><button ref={closeRef} type="button" className={buttonClass} aria-label="Close trial details" onClick={onClose}>Close</button></div><p className="mt-3">{trial.sourceHypothesisText}</p><TrialSourceContext trial={trial} />{[['Inclusion criteria', trial.exactInclusionCriteria], ['Exclusion criteria', trial.exactExclusionCriteria], ['Source gaps / confirmation required', trial.sourceGaps]].map(([title, lines]) => <div className="mt-4" key={title}><h3 className="font-bold">{title}</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{lines?.length ? lines.map((line, index) => <li key={index}>{line}</li>) : <li>Not specified in the stored source profile.</li>}</ul></div>)}<p className="mt-4 text-sm">Referral pathway: {trial.pathway}</p><RegistryLink trial={trial} /></section></>, document.body);
}
function RegistryLink({ trial }) {
  return trial.externalMetadata?.registryUrl ? <a className="inline-flex min-h-[44px] items-center text-sm text-link-600 underline" href={trial.externalMetadata.registryUrl} target="_blank" rel="noopener noreferrer">{trial.externalMetadata.nct} · registry record ↗</a> : <p className="text-sm text-mute">No verified registry record.</p>;
}

export function ExclusionRefiner({ items, checked, onToggle, onClear, summaryRef }) {
  const documented = Object.values(checked || {}).some(value => typeof value === 'boolean');
  const positives = Object.values(checked || {}).filter(value => value === true).length;
  return <details className="rounded-lg border border-line bg-card p-4"><summary ref={summaryRef} className="min-h-[44px] cursor-pointer font-semibold">Optional exclusion review {positives > 0 && <span className="rounded bg-crit-600 px-2 text-white">{positives} present</span>}</summary><p className="my-2 text-sm text-mute">Unanswered is unknown. Record present or absent only after assessment.</p><div className="grid gap-2">{items.map(item => <label key={item.id} className="workspace-field"><span>{item.label}</span><select aria-label={item.label} value={typeof checked?.[item.id] === 'boolean' ? String(checked[item.id]) : ''} onChange={e => onToggle(item.id, e.target.value === '' ? undefined : e.target.value === 'true')}><option value="">Not assessed</option><option value="true">Present</option><option value="false">Absent</option></select></label>)}</div>{documented && <button type="button" className={buttonClass} onClick={onClear}>Reset exclusions to unknown</button>}</details>;
}

function TrialCard({ trial, result, onDetails }) {
  const label = result?.notYetEnrolling ? 'Not yet enrolling' : result?.beforeWindow ? 'Before study window' : statusText[result?.status || trial.status] || 'Registry status unverified';
  return <article className="min-w-0 rounded-lg border border-line bg-card p-4 shadow-card"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold">{trial.acronym}</h3><span className="rounded-md bg-paper-2 px-2 py-1 text-xs text-ink-2">{label}</span></div><p className="text-sm text-mute">{trial.exactFullStudyName}</p><p className="mt-2 text-sm">{trial.conciseBedsideSummary}</p><p className="mt-2 text-xs">Stored enrollment window: {trial.enrollmentWindowText}</p>{result?.notYetEnrolling && result.beforeWindow && <p className="mt-2 text-xs">Timing: before the modeled study window.</p>}<TrialSourceContext trial={trial} />{result && <details className="mt-3"><summary className="min-h-[44px] cursor-pointer font-semibold">Confirm before referral</summary><ul className="list-disc space-y-1 pl-5 text-sm">{[...result.pendingCriteria, ...result.exclusionReasons].map((reason, i) => <li key={i}>{reason}</li>)}</ul></details>}<div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className={buttonClass} onClick={onDetails}>Full criteria & details</button><RegistryLink trial={trial} /></div></article>;
}

function ResultGroup({ title, items, onDetails, children }) {
  return <section className="space-y-3" aria-label={title}><div className="flex items-center justify-between gap-3 border-b-2 border-cobalt-600 pb-2"><h2 className="text-lg font-bold">{title}</h2><span className="rounded-pill bg-cobalt-600 px-2 py-1 font-mono text-xs text-white">{items.length}</span></div>{children}{items.map(item => <TrialCard key={item.trial.acronym} trial={item.trial} result={item} onDetails={() => onDetails(item.trial)} />)}</section>;
}

export function TrialScreener({ copyToClipboard, initialState, onStateChange, active = true }) {
  const [state, setState] = useState(() => initialState || createInitialScreenerState());
  const [modal, setModal] = useState(null), refinerRef = useRef(null);
  useEffect(() => { if (!active) setModal(null); }, [active]);
  const change = patch => { onStateChange?.(); setState(prev => ({ ...prev, ...patch })); };
  const results = useMemo(() => evaluateAll(state), [state]);
  const exclusions = useMemo(() => { const p = buildScreenerParams({ ...state, exclusions: {} }); const activeTrials = screenerTrials.filter(trial => isTrialPotentiallyActive(trial, p)).map(trial => trial.acronym); return EXCLUSION_ITEMS.filter(item => item.classifications.includes(state.classification) && item.trials.some(id => activeTrials.includes(id))); }, [state]);
  const candidates = [...results.eligible, ...results.pending];
  const deferred = [['Before study window', results.soon.filter(item => !item.notYetEnrolling)], ['Not yet enrolling', results.soon.filter(item => item.notYetEnrolling)]];
  const other = [['Modeled criterion not met', results.excluded], ['Not enrolling in stored profile', results.closed], ['Unverified profiles', results.incomplete]];
  return <div className="trial-screening-workspace space-y-5 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
    <div className="trial-screening-filters min-w-0 space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <section><h2 className="mb-3 text-lg font-bold">1. Stroke classification</h2><div className="flex flex-wrap gap-2">{CLASSIFICATIONS.map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={state.classification === id} onClick={() => change({ classification: id, onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours', exclusions: {} })}>{label}</button>)}</div></section>
      {results.ready && <><section><h2 className="mb-3 text-lg font-bold">2. Time since last known well</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">{ONSET_PRESETS.map(preset => <button key={preset.name} type="button" aria-label={`${preset.name} ${preset.desc}`} className={buttonClass} aria-pressed={state.onsetVal === preset.val && state.onsetUnit === preset.unit} onClick={() => change({ onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours })}>{preset.name}<span className="block text-xs text-mute">{preset.desc}</span></button>)}</div><p className="my-2 text-sm text-mute">{state.onsetVal === null ? 'Onset not recorded; timing remains unknown.' : 'Selected range only; confirm the exact interval required by each study.'} Unentered age, examination, imaging and other criteria remain unknown.</p><button type="button" className={buttonClass} onClick={() => change({ onsetVal: null, onsetRangeHours: null })}>Clear onset to unknown</button></section><ExclusionRefiner summaryRef={refinerRef} items={exclusions} checked={state.exclusions} onToggle={(id, value) => change({ exclusions: { ...state.exclusions, [id]: value } })} onClear={() => { change({ exclusions: {} }); requestAnimationFrame(() => refinerRef.current?.focus()); }} /></>}
      <button type="button" className={buttonClass} onClick={() => change(createInitialScreenerState())}>Reset screen</button>
    </div>
    <div className="min-w-0 space-y-5">
      <p role="status" className="text-sm text-mute">{results.ready ? `${candidates.length} possible candidates. Partial profile screen only; complete registry/protocol, local activation and consent confirmation required.` : 'Choose a classification to see possible study profiles.'}</p>
      {results.ready && <><ResultGroup title="Possible candidates" items={candidates} onDetails={setModal}>{candidates.length === 0 && <p className="text-sm text-mute">No possible candidate under the recorded classification and modeled criteria.</p>}</ResultGroup>
        {deferred.filter(([, items]) => items.length > 0).map(([title, items]) => <ResultGroup key={title} title={title} items={items} onDetails={setModal} />)}
        <section aria-labelledby="trial-briefing-title" className="overflow-hidden rounded-lg border border-line bg-card shadow-card"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-2 p-3"><h2 id="trial-briefing-title" className="font-bold">Screening briefing</h2><button type="button" className={buttonClass} onClick={() => copyToClipboard?.(results.briefingNote, 'Trial screener briefing')}>Copy screening briefing</button></div><pre aria-label="Screening briefing preview" tabIndex={0} className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">{results.briefingNote}</pre></section>
        {other.filter(([, items]) => items.length > 0).map(([title, items]) => <details key={title} className="rounded-lg border border-line bg-paper-2 p-3"><summary className="min-h-[44px] cursor-pointer font-semibold">{title} ({items.length})</summary><div className="space-y-3">{items.map(item => <TrialCard key={item.trial.acronym} trial={item.trial} result={item} onDetails={() => setModal(item.trial)} />)}</div></details>)}
      </>}
    </div>
    {modal && active && <TrialDetailsModal trial={modal} onClose={() => setModal(null)} />}
  </div>;
}

export function StudyDatabase({ active = true }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [classification, setClassification] = useState('all'), [modal, setModal] = useState(null);
  const searchRef = useRef(null);
  useEffect(() => { if (!active) setModal(null); }, [active]);
  const categoryTrials = screenerTrials.filter(trial => matchesClassification(trial, classification));
  const trials = categoryTrials.filter(trial => (filter === 'all' || trial.status === filter) && [trial.acronym, trial.exactFullStudyName, trial.conciseBedsideSummary, trial.externalMetadata?.nct].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="space-y-4"><label className="workspace-field"><span>Search acronym, name or NCT</span><input ref={searchRef} type="search" aria-label="Search the study database by acronym, name or NCT number" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter studies by classification">{[['all', 'All classifications'], ...CLASSIFICATIONS].map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={classification === id} onClick={() => setClassification(id)}>{label}</button>)}</div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter studies by status">{STATUS_FILTERS.map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} <span className="font-mono">({categoryTrials.filter(trial => id === 'all' || trial.status === id).length})</span></button>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-sm text-mute">{trials.length} of {screenerTrials.length} studies</p>{(query || filter !== 'all' || classification !== 'all') && <button type="button" className={buttonClass} onClick={() => { setQuery(''); setFilter('all'); setClassification('all'); searchRef.current?.focus(); }}>Clear search and filters</button>}</div>
    <div className="grid gap-3 md:grid-cols-2">{trials.map(trial => <TrialCard key={trial.acronym} trial={trial} onDetails={() => setModal(trial)} />)}</div>{trials.length === 0 && <p>No studies match these filters.</p>}{modal && active && <TrialDetailsModal trial={modal} onClose={() => setModal(null)} />}</div>;
}
export default TrialScreener;
