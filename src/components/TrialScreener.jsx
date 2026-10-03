import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogChrome } from './use-dialog-chrome.js';
import { screenerTrials } from '../evidence/screenerTrials.js';
import { eligibilityTables } from '../evidence/eligibilityTables.js';
import { evaluateAll, buildScreenerParams, isTrialPotentiallyActive, createInitialScreenerState, ONSET_PRESETS, EXCLUSION_ITEMS, phaseLabel, enrollmentLabel, toConfirm, relevantNotMet } from '../evidence/screener-eval.js';
import { screenerPrefillFromEncounter, applyEncounterPrefill, applyAnticoagulant } from '../evidence/screener-prefill.js';

const CLASSIFICATIONS = [['ischemic', 'Ischemic stroke'], ['tia', 'TIA'], ['ich', 'Hemorrhage (ICH)']];
const CLASS_SHORT = { ischemic: 'Ischemic', tia: 'TIA', ich: 'ICH' };
const buttonClass = 'min-h-[44px] rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-cobalt-500';
const chipClass = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold';
const STATUS_TONE = {
  Recruiting: 'bg-ok-50 text-ok-800 dark:bg-ok-950 dark:text-ok-200',
  'Before study window': 'bg-warn-50 text-warn-800 dark:bg-warn-950 dark:text-warn-200',
  'Not yet recruiting': 'bg-info-50 text-info-800 dark:bg-info-950 dark:text-info-200'
};
const STATUS_FILTERS = [['all', 'All statuses'], ['enrolling', 'Recruiting'], ['soon', 'Not yet recruiting'], ['closed', 'Not enrolling']];
const LATEST_CHECK = screenerTrials.map(trial => trial.externalMetadata?.verificationDate).filter(Boolean).sort().pop() || null;
const screenable = trial => !trial.referenceOnly && ['enrolling', 'soon'].includes(trial.status);

// Classification filters describe the stored profile, independently of recruitment
// status. Table membership supplies the category for profiles with no rules.
function trialClassifications(trial) {
  const criterion = trial.eligibility?.criteria.find(item => item.field === 'classification');
  if (criterion) return Array.isArray(criterion.value) ? criterion.value : [criterion.value];
  return eligibilityTables.filter(table => table.trials.some(item => item.acronym === trial.acronym)).map(table => table.category);
}
function matchesClassification(trial, classification) {
  return classification === 'all' || trialClassifications(trial).includes(classification);
}

export function TrialSourceContext({ trial }) {
  const m = trial.externalMetadata || {};
  return <div className="mt-2 text-xs leading-relaxed text-mute" data-trial-source-context={trial.acronym}><p>Registry status at recorded check: {m.registryStatus?.replace(/_/g, ' ').toLowerCase() || 'Not verified'}. Recorded registry check: {m.verificationDate ? <time dateTime={m.verificationDate}>{m.verificationDate}</time> : 'Not recorded'}.{m.registryLastUpdatePosted && <> Registry last update posted: {m.registryLastUpdatePosted}.</>}{phaseLabel(m) && <> {phaseLabel(m)}.</>}</p><p>Local activation: not confirmed here. Confirm the current registry record and study-team availability; the recorded check does not establish complete eligibility.</p></div>;
}

function TrialDetailsModal({ trial, onClose }) {
  const dialogRef = useRef(null), closeRef = useRef(null);
  useDialogChrome({ dialogRef, initialFocusRef: closeRef, onClose });
  return createPortal(<><div className="fixed inset-0 z-[60] bg-slate-950/50" onClick={onClose} aria-hidden="true" /><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="trial-modal-title" className="fixed inset-x-4 bottom-4 top-12 z-[61] overflow-y-auto rounded-lg border border-line bg-card p-5 shadow-pop sm:mx-auto sm:max-w-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="trial-modal-title" className="text-xl font-bold">{trial.acronym}</h2><p className="text-sm text-mute">{trial.exactFullStudyName}</p></div><button ref={closeRef} type="button" className={buttonClass} aria-label="Close trial details" onClick={onClose}>Close</button></div><p className="mt-3">{trial.sourceHypothesisText}</p><TrialSourceContext trial={trial} />{[['Inclusion criteria', trial.exactInclusionCriteria], ['Exclusion criteria', trial.exactExclusionCriteria], ['Source gaps / confirmation required', trial.sourceGaps]].map(([title, lines]) => <div className="mt-4" key={title}><h3 className="font-bold">{title}</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{lines?.length ? lines.map((line, index) => <li key={index}>{line}</li>) : <li>Not specified in the stored source profile.</li>}</ul></div>)}<p className="mt-4 text-sm">Referral pathway: {trial.pathway}</p><RegistryLink trial={trial} /></section></>, document.body);
}
function RegistryLink({ trial, compact = false }) {
  const m = trial.externalMetadata || {};
  if (!m.registryUrl) return <span className="text-xs text-mute">No verified registry record</span>;
  return <a className="inline-flex min-h-[44px] items-center text-sm text-link-600 underline" href={m.registryUrl} target="_blank" rel="noopener noreferrer" aria-label={`${m.nct} registry record for ${trial.acronym} (opens in a new tab)`}>{m.nct}{compact ? '' : ' · registry record'} ↗</a>;
}

function Chips({ trial, result }) {
  const status = enrollmentLabel(trial, result);
  const phase = phaseLabel(trial.externalMetadata);
  return <>
    <span className={`${chipClass} ${STATUS_TONE[status] || 'bg-paper-2 text-ink-2'}`}>{status}</span>
    {phase && <span className={`${chipClass} border border-line text-ink-2`}>{phase}</span>}
    {trial.referenceOnly && <span className={`${chipClass} border border-line text-ink-2`}>Not screened</span>}
  </>;
}

export function ExclusionRefiner({ items, checked, onToggle, onClear, summaryRef }) {
  const documented = Object.values(checked || {}).some(value => typeof value === 'boolean');
  const positives = Object.values(checked || {}).filter(value => value === true).length;
  return <details className="rounded-lg border border-line bg-card p-4"><summary ref={summaryRef} className="min-h-[44px] cursor-pointer font-semibold">Optional exclusion review {positives > 0 && <span className="rounded bg-crit-600 px-2 text-white">{positives} present</span>}</summary><p className="my-2 text-sm text-mute">Unanswered is unknown. Record present or absent only after assessment.</p><div className="grid gap-2">{items.map(item => <label key={item.id} className="workspace-field"><span>{item.label}</span><select aria-label={item.label} value={typeof checked?.[item.id] === 'boolean' ? String(checked[item.id]) : ''} onChange={e => onToggle(item.id, e.target.value === '' ? undefined : e.target.value === 'true')}><option value="">Not assessed</option><option value="true">Present</option><option value="false">Absent</option></select></label>)}</div>{documented && <button type="button" className={buttonClass} onClick={onClear}>Reset exclusions to unknown</button>}</details>;
}

// One compact card per study: identity, status and phase, a one-line hook and
// an expandable list of what remains to confirm.
function TrialCard({ trial, result, onDetails }) {
  const m = trial.externalMetadata || {};
  const confirm = result ? toConfirm(result) : [];
  const met = result?.matchedCriteria || [];
  return <article className="min-w-0 rounded-lg border border-line bg-card p-3 shadow-card" data-trial={trial.acronym}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="mr-1 text-base font-bold">{trial.acronym}</h3><RegistryLink trial={trial} compact /><Chips trial={trial} result={result} /></div>
    <p className="mt-1 text-sm">{trial.conciseBedsideSummary}</p>
    <p className="mt-1 text-xs text-mute">Window: {trial.enrollmentWindowText}{m.verificationDate && m.verificationDate !== LATEST_CHECK ? ` · registry checked ${m.verificationDate}` : ''}</p>
    {result?.beforeWindow && result.notYetEnrolling && <p className="mt-1 text-xs">Timing: before the modeled study window.</p>}
    <div className="mt-1 flex flex-wrap items-start gap-x-3">
      {result && (confirm.length > 0 || met.length > 0) && <details className="min-w-0 flex-1 basis-40 open:basis-full"><summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-semibold">{confirm.length} to confirm{met.length ? ` · ${met.length} met` : ''}</summary>
        {met.length > 0 && <><h4 className="mt-1 text-xs font-semibold uppercase tracking-wide text-mute">Met</h4><ul className="list-disc space-y-1 pl-5 text-sm">{met.map((line, i) => <li key={i}>{line}</li>)}</ul></>}
        {confirm.length > 0 && <><h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-mute">To confirm</h4><ul className="list-disc space-y-1 pl-5 text-sm">{confirm.map((line, i) => <li key={i}>{line}</li>)}</ul></>}
        <p className="mt-2 text-xs text-mute">Pathway: {trial.pathway}</p>
      </details>}
      <button type="button" className={`${buttonClass} ml-auto`} aria-label={`Full criteria for ${trial.acronym}`} onClick={onDetails}>Full criteria</button>
    </div>
  </article>;
}

function ResultGroup({ title, label, items, onDetails, children }) {
  return <section className="space-y-2" aria-label={label}><div className="flex items-center justify-between gap-3 border-b-2 border-cobalt-600 pb-1"><h2 className="text-base font-bold">{title}</h2><span className="rounded-pill bg-cobalt-600 px-2 py-0.5 font-mono text-xs text-white">{items.length}</span></div>{children}{items.map(item => <TrialCard key={item.trial.acronym} trial={item.trial} result={item} onDetails={() => onDetails(item.trial)} />)}</section>;
}

function EncounterBanner({ prefill, onUse, applied }) {
  if (!prefill?.available) return null;
  return <section aria-label="Encounter facts" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-cobalt-300/60 bg-cobalt-50 p-3 dark:bg-cobalt-900">
    <p className="min-w-0 flex-1 basis-60 text-sm"><span className="font-semibold">From Encounter:</span> {prefill.summary.join(' · ') || 'no screening facts recorded'}{!prefill.supported && <> — <span className="font-semibold">{prefill.message}</span></>}</p>
    {prefill.patch && <button type="button" className={buttonClass} onClick={onUse}>{applied ? 'Applied ✓ · reapply' : 'Use these facts'}</button>}
    {applied && <p role="status" className="basis-full text-xs text-ink-2">Encounter facts applied ({applied}). Every field can still be changed; anything not recorded stays unknown.</p>}
  </section>;
}

function NumberFact({ label, value, onChange, min, max, step = 1, unit }) {
  return <label className="workspace-field !my-0"><span>{label}{unit && <span className="font-normal text-mute"> ({unit})</span>}</span><input type="number" inputMode="decimal" aria-label={unit ? `${label} (${unit})` : label} min={min} max={max} step={step} placeholder="Unknown" value={value === 'unselected' || value === null || value === undefined ? '' : value} onChange={e => onChange(e.target.value === '' ? 'unselected' : e.target.value)} /></label>;
}
function SelectFact({ label, value, onChange, options }) {
  const current = value === 'unselected' || value === null || value === undefined ? '' : String(value);
  return <label className="workspace-field !my-0"><span>{label}</span><select aria-label={label} value={current} onChange={e => onChange(e.target.value === '' ? 'unselected' : e.target.value)}><option value="">Unknown</option>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>;
}
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => [String(lo + i), String(lo + i)]);
const asNumber = v => v === 'unselected' ? v : Number(v);

function KeyFacts({ state, change, replace }) {
  const cls = state.classification;
  const set = key => v => change({ [key]: v });
  const setNumber = key => v => change({ [key]: asNumber(v) });
  return <section aria-labelledby="trial-key-facts"><h2 id="trial-key-facts" className="mb-1 text-lg font-bold">3. Key facts</h2><p className="mb-2 text-sm text-mute">Optional. Unknown stays unknown.</p><div className="grid grid-cols-2 gap-x-3 gap-y-2">
    <NumberFact label="Age" unit="y" min={0} max={120} value={state.age} onChange={set('age')} />
    {cls === 'ischemic' && <>
      <NumberFact label="NIHSS" min={0} max={42} value={state.nihss} onChange={set('nihss')} />
      <SelectFact label="Pre-stroke mRS" value={state.preMrs} onChange={setNumber('preMrs')} options={range(0, 5)} />
      <SelectFact label="ASPECTS" value={state.aspects} onChange={setNumber('aspects')} options={range(0, 10).reverse()} />
      <div className="col-span-2"><SelectFact label="Occlusion site" value={state.vessel} onChange={set('vessel')} options={[['ica_m1', 'ICA or M1'], ['dominant_m2', 'Dominant M2'], ['m2_m3_nd', 'Non-dominant/co-dominant M2 or M3'], ['other', 'Other (basilar, ACA, PCA…)'], ['none', 'No occlusion']]} /></div>
    </>}
    {cls === 'ich' && <>
      <SelectFact label="GCS" value={state.gcs} onChange={setNumber('gcs')} options={range(3, 15).reverse()} />
      <SelectFact label="Pre-stroke mRS" value={state.preMrs} onChange={setNumber('preMrs')} options={range(0, 5)} />
      <SelectFact label="ICH location" value={state.ichLocation} onChange={set('ichLocation')} options={[['bg', 'Basal ganglia'], ['lobar', 'Lobar'], ['thalamic', 'Thalamic'], ['infratentorial', 'Infratentorial'], ['other', 'Other']]} />
      <NumberFact label="Volume" unit="mL" min={0} max={300} step={0.1} value={state.ichVolume} onChange={set('ichVolume')} />
      <div className="col-span-2"><SelectFact label="Anticoagulant at onset" value={state.anticoagulant} onChange={v => replace(prev => applyAnticoagulant(prev, v))} options={[['none', 'None'], ['doac', 'DOAC (apixaban, rivaroxaban, dabigatran, edoxaban)'], ['lmwh', 'LMWH'], ['vka', 'Warfarin / VKA']]} /></div>
    </>}
  </div></section>;
}

function TimingSection({ state, change }) {
  const exact = state.onsetVal !== null && !Array.isArray(state.onsetRangeHours) && state.onsetUnit === 'hours';
  const pressed = preset => Array.isArray(state.onsetRangeHours) && state.onsetRangeHours[0] === preset.rangeHours[0] && state.onsetRangeHours[1] === preset.rangeHours[1];
  return <section><h2 className="mb-2 text-lg font-bold">2. Time since last known well</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">{ONSET_PRESETS.map(preset => <button key={preset.name} type="button" aria-label={`${preset.name} ${preset.desc}`} className={buttonClass} aria-pressed={pressed(preset)} onClick={() => change({ onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours })}>{preset.name}<span className="block text-xs text-mute">{preset.desc}</span></button>)}</div>
    <label htmlFor="trial-exact-onset" className="mt-3 block text-sm font-semibold text-ink-2">Exact hours from LKW</label><div className="workspace-field !my-1"><div className="flex flex-wrap items-center gap-2"><input id="trial-exact-onset" className="!w-auto min-w-0 flex-1 basis-24" type="number" inputMode="decimal" aria-label="Exact hours from LKW" min={0} step={0.1} placeholder="Optional" value={exact ? state.onsetVal : ''} onChange={e => change(e.target.value === '' ? { onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours' } : { onsetVal: e.target.value, onsetUnit: 'hours', onsetRangeHours: null })} /><button type="button" className={buttonClass} onClick={() => change({ onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours' })}>Clear onset to unknown</button></div></div>
    <p className="mt-2 text-sm text-mute">{state.onsetVal === null ? 'Onset not recorded; timing remains unknown.' : exact ? 'Exact interval entered.' : 'Selected range only; confirm the exact interval required by each study.'}</p></section>;
}

// Before a classification is chosen, list what the screener covers so the
// results column is useful immediately.
function StudyOverview({ onDetails }) {
  const listed = screenerTrials.filter(screenable);
  const reference = screenerTrials.filter(trial => trial.referenceOnly && trial.status === 'enrolling');
  const closed = screenerTrials.filter(trial => trial.status === 'closed');
  return <section aria-label="Studies in this screener" className="space-y-2"><div className="flex items-center justify-between gap-3 border-b-2 border-cobalt-600 pb-1"><h2 className="text-base font-bold">Studies in this screener</h2><span className="rounded-pill bg-cobalt-600 px-2 py-0.5 font-mono text-xs text-white">{listed.length}</span></div>
    <ul className="divide-y divide-line rounded-lg border border-line bg-card">{listed.map(trial => <li key={trial.acronym} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1"><button type="button" className="min-h-[44px] text-left font-bold text-link-600 underline" aria-label={`Full criteria for ${trial.acronym}`} onClick={() => onDetails(trial)}>{trial.acronym}</button><span className="text-xs text-mute">{trialClassifications(trial).map(c => CLASS_SHORT[c] || c).join(' · ')} · {trial.enrollmentWindowText}</span><span className="ml-auto flex flex-wrap gap-1"><Chips trial={trial} /></span><p className="basis-full pb-2 text-sm">{trial.conciseBedsideSummary}</p></li>)}</ul>
    <p className="text-xs text-mute">{reference.length > 0 && <>Criteria-table reference only (not screened): {reference.map(t => t.acronym).join(', ')}. </>}{closed.length > 0 && <>Not enrolling: {closed.map(t => t.acronym).join(', ')}. </>}Full criteria for every profile are in Database.</p>
  </section>;
}

export function TrialScreener({ copyToClipboard, initialState, onStateChange, active = true, encounter = null, now = null }) {
  const [state, setState] = useState(() => initialState || createInitialScreenerState());
  const [modal, setModal] = useState(null), [applied, setApplied] = useState(null), refinerRef = useRef(null);
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => { if (!active) setModal(null); }, [active]);
  useEffect(() => {
    if (!active || !encounter) return undefined;
    setTick(Date.now());
    const timer = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [active, encounter]);
  const nowMs = Math.max(typeof now === 'number' ? now : 0, tick);
  const prefill = useMemo(() => encounter ? screenerPrefillFromEncounter(encounter, nowMs) : null, [encounter, nowMs]);
  const replace = updater => { onStateChange?.(); setApplied(null); setState(updater); };
  const change = patch => replace(prev => ({ ...prev, ...patch }));
  const importEncounter = () => {
    const fresh = screenerPrefillFromEncounter(encounter, Date.now());
    onStateChange?.();
    setState(prev => applyEncounterPrefill(prev, fresh, createInitialScreenerState()));
    setApplied(fresh.summary.find(item => item.startsWith('LKW ')) ? `timing as of ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'no LKW time recorded');
  };
  const results = useMemo(() => evaluateAll(state), [state]);
  const exclusions = useMemo(() => { const p = buildScreenerParams({ ...state, exclusions: {} }); const activeTrials = screenerTrials.filter(trial => screenable(trial) && isTrialPotentiallyActive(trial, p)).map(trial => trial.acronym); return EXCLUSION_ITEMS.filter(item => item.classifications.includes(state.classification) && item.trials.some(id => activeTrials.includes(id))); }, [state]);
  const candidates = [...results.eligible, ...results.pending];
  const later = results.soon;
  const notMet = relevantNotMet(results.excluded);
  const picasso = screenerTrials.find(trial => trial.acronym === 'PICASSO' && trial.referenceOnly);
  return <div className="space-y-4">
    <EncounterBanner prefill={prefill} onUse={importEncounter} applied={applied} />
    <div className="trial-screening-workspace space-y-5 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
      <div className="trial-screening-filters min-w-0 space-y-5 lg:sticky lg:top-[calc(var(--case-bar-h,0px)+1rem)] lg:max-h-[calc(100dvh-var(--case-bar-h,0px)-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
        <section><h2 className="mb-2 text-lg font-bold">1. Stroke classification</h2><div className="flex flex-wrap gap-2">{CLASSIFICATIONS.map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={state.classification === id} onClick={() => change({ classification: id, onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours', exclusions: {}, anticoagulant: 'unselected' })}>{label}</button>)}</div>
          {results.ready && <a href="#trial-results" className="mt-1 text-sm font-semibold text-link-600 underline lg:!hidden">View {candidates.length} possible candidate{candidates.length === 1 ? '' : 's'} ↓</a>}</section>
        {results.ready && <><TimingSection state={state} change={change} /><KeyFacts state={state} change={change} replace={replace} /><ExclusionRefiner summaryRef={refinerRef} items={exclusions} checked={state.exclusions} onToggle={(id, value) => replace(prev => { const next = { ...prev.exclusions }; if (typeof value === 'boolean') next[id] = value; else delete next[id]; return { ...prev, exclusions: next }; })} onClear={() => { change({ exclusions: {} }); requestAnimationFrame(() => refinerRef.current?.focus()); }} /></>}
        <button type="button" className={buttonClass} onClick={() => { setApplied(null); change(createInitialScreenerState()); }}>Reset screen</button>
      </div>
      <div id="trial-results" className="min-w-0 scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-sm text-mute">{results.ready ? `${candidates.length} possible candidate${candidates.length === 1 ? '' : 's'} · ${later.length} later · ${notMet.length} not met` : 'Choose a classification to see possible study profiles.'}</p>{results.ready && <button type="button" className={buttonClass} onClick={() => copyToClipboard?.(results.briefingNote, 'Screening summary')}>Copy screening summary</button>}</div>
        {!results.ready && <StudyOverview onDetails={setModal} />}
        {results.ready && <>
          <ResultGroup title="Possible candidates" label="Possible candidates" items={candidates} onDetails={setModal}>{candidates.length === 0 && <p className="text-sm text-mute">No possible candidate under the entered facts.</p>}</ResultGroup>
          {later.length > 0 && <ResultGroup title="Later · before window or not yet recruiting" label="Later" items={later} onDetails={setModal} />}
          {notMet.length > 0 && <details className="rounded-lg border border-line bg-paper-2 p-3"><summary className="min-h-[44px] cursor-pointer font-semibold">Modeled criterion not met ({notMet.length})</summary><ul className="mt-1 space-y-1">{notMet.map(item => <li key={item.trial.acronym} className="flex flex-wrap items-center gap-x-2 text-sm"><button type="button" className="min-h-[44px] font-bold text-link-600 underline" aria-label={`Full criteria for ${item.trial.acronym}`} onClick={() => setModal(item.trial)}>{item.trial.acronym}</button><span className="min-w-0 flex-1">{item.exclusionReasons.join('; ')}</span></li>)}</ul></details>}
          {state.classification === 'ischemic' && picasso && <p className="text-xs text-mute">Not modeled here: {picasso.acronym} ({picasso.externalMetadata.nct}, acute carotid stenting with EVT for tandem/proximal ICA lesions) — criteria in Tables.</p>}
          <details className="rounded-lg border border-line bg-card"><summary className="min-h-[44px] cursor-pointer px-3 py-2 text-sm font-semibold">Preview screening summary</summary><pre aria-label="Screening summary preview" tabIndex={0} className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t border-line p-3 font-mono text-xs leading-relaxed">{results.briefingNote}</pre></details>
        </>}
      </div>
    </div>
    {modal && active && <TrialDetailsModal trial={modal} onClose={() => setModal(null)} />}
  </div>;
}

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function StudyDatabase({ active = true }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [classification, setClassification] = useState('all'), [modal, setModal] = useState(null);
  const searchRef = useRef(null);
  useEffect(() => { if (!active) setModal(null); }, [active]);
  const categoryTrials = screenerTrials.filter(trial => matchesClassification(trial, classification));
  const q = query.trim().toLowerCase(), qn = normalize(query);
  // Registry acronyms (e.g. TR-2, SCOUTS3, MRPICS) match with or without punctuation.
  const matches = trial => !q || [trial.acronym, trial.exactFullStudyName, trial.conciseBedsideSummary, trial.externalMetadata?.nct, trial.externalMetadata?.registryAcronym].join(' ').toLowerCase().includes(q) || (qn && [trial.acronym, trial.externalMetadata?.registryAcronym, trial.externalMetadata?.nct].some(id => normalize(id).includes(qn)));
  const trials = categoryTrials.filter(trial => (filter === 'all' || trial.status === filter) && matches(trial));
  return <div className="space-y-4"><label className="workspace-field"><span>Search acronym, name or NCT</span><input ref={searchRef} type="search" aria-label="Search the study database by acronym, name or NCT number" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter studies by classification">{[['all', 'All classifications'], ...CLASSIFICATIONS].map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={classification === id} onClick={() => setClassification(id)}>{label}</button>)}</div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter studies by status">{STATUS_FILTERS.map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} <span className="font-mono">({categoryTrials.filter(trial => id === 'all' || trial.status === id).length})</span></button>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-sm text-mute">{trials.length} of {screenerTrials.length} studies</p>{(query || filter !== 'all' || classification !== 'all') && <button type="button" className={buttonClass} onClick={() => { setQuery(''); setFilter('all'); setClassification('all'); searchRef.current?.focus(); }}>Clear search and filters</button>}</div>
    <div className="grid gap-3 md:grid-cols-2">{trials.map(trial => <TrialCard key={trial.acronym} trial={trial} onDetails={() => setModal(trial)} />)}</div>{trials.length === 0 && <p>No studies match these filters.</p>}{modal && active && <TrialDetailsModal trial={modal} onClose={() => setModal(null)} />}</div>;
}
export default TrialScreener;
