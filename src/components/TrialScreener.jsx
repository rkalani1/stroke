import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogChrome } from './use-dialog-chrome.js';
import { screenerTrials } from '../evidence/screenerTrials.js';
import { eligibilityTables } from '../evidence/eligibilityTables.js';
import { evaluateAll, buildScreenerParams, isTrialPotentiallyActive, createInitialScreenerState, anchoredOnsetHours, onsetToHours, numericFact, ONSET_PRESETS, EXCLUSION_ITEMS, VISIBLE_FACTS, NOT_MET_TEXT, phaseLabel, enrollmentLabel, toConfirm, relevantNotMet, potentialMatches, insufficientInformation, registryCheckAgeText } from '../evidence/screener-eval.js';
import { screenerPrefillFromEncounter, applyEncounterPrefill, applyAnticoagulant } from '../evidence/screener-prefill.js';

const CLASSIFICATIONS = [['ischemic', 'Ischemic stroke'], ['tia', 'TIA'], ['ich', 'Hemorrhage (ICH)']];
const CLASS_SHORT = { ischemic: 'Ischemic', tia: 'TIA', ich: 'ICH' };
const buttonClass = 'min-h-[44px] rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-cobalt-500';
const chipClass = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold';
const STATUS_TONE = {
  'Recruiting (registry)': 'bg-ok-50 text-ok-800 dark:bg-ok-950 dark:text-ok-200',
  'Before study window': 'bg-warn-50 text-warn-800 dark:bg-warn-950 dark:text-warn-200',
  'Not yet recruiting (registry)': 'bg-info-50 text-info-800 dark:bg-info-950 dark:text-info-200'
};
const STATUS_FILTERS = [['all', 'All statuses'], ['enrolling', 'Recruiting'], ['soon', 'Not yet recruiting'], ['closed', 'Not enrolling']];
// Cards omit their own check date only when every profile shares the single date stated once for the page.
const CHECK_DATES = new Set(screenerTrials.map(trial => trial.externalMetadata?.verificationDate || null));
const SHARED_CHECK = CHECK_DATES.size === 1 ? [...CHECK_DATES][0] : null;
// Every key fact any classification shows; switching classification resets the ones the new screen hides.
const ALL_VISIBLE_FACTS = [...new Set(Object.values(VISIBLE_FACTS).flat())];
const screenable = trial => !trial.referenceOnly && ['enrolling', 'soon'].includes(trial.status);

// Classification filters describe the stored profile, independently of recruitment
// status. An explicit databaseClassifications list wins (closed profiles whose population
// is not defined by a top-level classification rule never appear in the criteria tables);
// otherwise the classification rule, then table membership, supplies the category.
export function trialClassifications(trial) {
  if (Array.isArray(trial.databaseClassifications) && trial.databaseClassifications.length) return trial.databaseClassifications;
  const criterion = trial.eligibility?.criteria.find(item => item.field === 'classification');
  if (criterion) return Array.isArray(criterion.value) ? criterion.value : [criterion.value];
  return eligibilityTables.filter(table => table.trials.some(item => item.acronym === trial.acronym)).map(table => table.category);
}
function matchesClassification(trial, classification) {
  return classification === 'all' || trialClassifications(trial).includes(classification);
}

export function TrialSourceContext({ trial, now = null }) {
  const m = trial.externalMetadata || {};
  const age = registryCheckAgeText(m.verificationDate, now);
  return <div className="mt-2 text-xs leading-relaxed text-mute" data-trial-source-context={trial.acronym}><p>Registry status at recorded check: {m.registryStatus?.replace(/_/g, ' ').toLowerCase() || 'Not verified'}. Recorded registry check: {m.verificationDate ? <><time dateTime={m.verificationDate}>{m.verificationDate}</time>{age && ` (${age})`}</> : 'Not recorded'}.{m.registryLastUpdatePosted && <> Last update posted, as recorded at that check: {m.registryLastUpdatePosted}; the live record may be newer.</>}{phaseLabel(m) && <> {phaseLabel(m)}.</>}</p><p>Local activation: not confirmed here. Confirm the current registry record and study-team availability; the recorded check does not establish complete eligibility.</p></div>;
}

function TrialDetailsModal({ trial, onClose, now = null }) {
  const dialogRef = useRef(null), closeRef = useRef(null);
  useDialogChrome({ dialogRef, initialFocusRef: closeRef, onClose });
  return createPortal(<><div className="fixed inset-0 z-[60] bg-slate-950/50" onClick={onClose} aria-hidden="true" /><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="trial-modal-title" className="fixed inset-x-4 bottom-4 top-12 z-[61] overflow-y-auto rounded-lg border border-line bg-card p-5 shadow-pop sm:mx-auto sm:max-w-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="trial-modal-title" className="text-xl font-bold">{trial.acronym}</h2><p className="text-sm text-mute">{trial.exactFullStudyName}</p></div><button ref={closeRef} type="button" className={buttonClass} aria-label="Close trial details" onClick={onClose}>Close</button></div><p className="mt-3">{trial.sourceHypothesisText}</p><TrialSourceContext trial={trial} now={now} />{[['Inclusion criteria', trial.exactInclusionCriteria], ['Exclusion criteria', trial.exactExclusionCriteria], ['Source gaps / confirmation required', trial.sourceGaps]].map(([title, lines]) => <div className="mt-4" key={title}><h3 className="font-bold">{title}</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{lines?.length ? lines.map((line, index) => <li key={index}>{line}</li>) : <li>Not specified in the stored source profile.</li>}</ul></div>)}<p className="mt-4 text-sm">Referral pathway: {trial.pathway}</p><RegistryLink trial={trial} /></section></>, document.body);
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
function TrialCard({ trial, result, onDetails, headingLevel = 3 }) {
  const m = trial.externalMetadata || {};
  const confirm = result ? toConfirm(result) : [];
  const met = result?.matchedCriteria || [];
  const Heading = headingLevel === 4 ? 'h4' : 'h3';
  const unknown = result && result.status === 'pending' && result.completeness !== 'potential-match' && result.unknownModeledCount ? result.unknownModeledCount : 0;
  return <article className="flex min-w-0 flex-col rounded-lg border border-line bg-card p-3 shadow-card" data-trial={trial.acronym} data-completeness={result?.status === 'pending' ? result.completeness : undefined}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><Heading className="mr-1 text-base font-bold">{trial.acronym}</Heading><RegistryLink trial={trial} compact /><Chips trial={trial} result={result} /></div>
    <p className="mt-1 text-sm">{trial.conciseBedsideSummary}</p>
    <p className="mt-1 text-xs text-mute">Window: {trial.enrollmentWindowText}{m.verificationDate ? (m.verificationDate !== SHARED_CHECK ? ` · registry checked ${m.verificationDate}` : '') : ' · registry check not recorded'}{unknown ? ` · ${unknown} modeled fact${unknown === 1 ? '' : 's'} unknown` : ''}</p>
    {result?.beforeWindow && result.notYetEnrolling && <p className="mt-1 text-xs">Timing: before the modeled study window.</p>}
    <div className="mt-auto flex flex-wrap items-start gap-x-3 pt-1">
      {result && (confirm.length > 0 || met.length > 0) && <details className="min-w-0 flex-1 basis-40 open:basis-full"><summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-semibold">{confirm.length} to confirm{met.length ? ` · ${met.length} met` : ''}</summary>
        {met.length > 0 && <><h4 className="mt-1 text-xs font-semibold uppercase tracking-wide text-mute">Met</h4><ul className="list-disc space-y-1 pl-5 text-sm">{met.map((line, i) => <li key={i}>{line}</li>)}</ul></>}
        {confirm.length > 0 && <><h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-mute">To confirm</h4><ul className="list-disc space-y-1 pl-5 text-sm">{confirm.map((line, i) => <li key={i}>{line}</li>)}</ul></>}
        <p className="mt-2 text-xs text-mute">Pathway: {trial.pathway}</p>
      </details>}
      <button type="button" className={`${buttonClass} ml-auto`} aria-label={`Full criteria for ${trial.acronym}`} onClick={onDetails}>Full criteria</button>
    </div>
  </article>;
}

function ResultGroup({ title, label, items, count = items.length, onDetails, children }) {
  return <section className="space-y-2" aria-label={label}><div className="flex items-center justify-between gap-3 border-b-2 border-cobalt-600 pb-1"><h2 className="text-base font-bold">{title}</h2><span className="rounded-pill bg-cobalt-600 px-2 py-0.5 font-mono text-xs text-white">{count}</span></div>{children}{items.map(item => <TrialCard key={item.trial.acronym} trial={item.trial} result={item} onDetails={() => onDetails(item.trial)} />)}</section>;
}

// Candidates are never definitive: a potential match has every modeled criterion
// met; insufficient information means at least one modeled fact is unknown.
function CandidateSubgroup({ title, label, description, items, empty, onDetails }) {
  return <section className="space-y-2" aria-label={label}><div className="flex items-center justify-between gap-3 pt-1"><h3 className="text-sm font-bold uppercase tracking-wide text-ink-2">{title}</h3><span className="rounded-pill border border-cobalt-600 px-2 py-0.5 font-mono text-xs">{items.length}</span></div><p className="text-xs text-mute">{description}</p>{items.length === 0 && <p className="text-sm text-mute">{empty}</p>}{items.map(item => <TrialCard key={item.trial.acronym} trial={item.trial} result={item} headingLevel={4} onDetails={() => onDetails(item.trial)} />)}</section>;
}

function EncounterBanner({ prefill, onUse, applied }) {
  if (!prefill?.available) return null;
  return <section aria-label="Encounter facts" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-cobalt-300/60 bg-cobalt-50 p-3 dark:bg-cobalt-900">
    <p className="min-w-0 flex-1 basis-60 text-sm"><span className="font-semibold">From Encounter:</span> {prefill.summary.length ? prefill.summary.map((fact, i) => <React.Fragment key={i}>{i > 0 && ' · '}<span className="whitespace-nowrap">{fact}</span></React.Fragment>) : 'no screening facts recorded'}{!prefill.supported && <> — <span className="font-semibold">{prefill.message}</span></>}</p>
    {prefill.patch && <button type="button" className={buttonClass} onClick={onUse}>{applied ? 'Applied ✓ · reapply' : 'Use these facts'}</button>}
    {applied && <p role="status" className="basis-full text-xs text-ink-2">Encounter facts applied ({applied}). Every field can still be changed; anything not recorded stays unknown.</p>}
  </section>;
}

// An entry the criteria cannot read (out of range, fractional score) stays on screen, flagged as unknown.
function NumberFact({ label, field, rule, value, onChange, min, max, step = 1, unit }) {
  const shown = value === 'unselected' || value === null || value === undefined ? '' : value;
  const invalid = shown !== '' && numericFact(field, shown) === null, hint = `trial-${field}-invalid`;
  return <label className="workspace-field !my-0 justify-between"><span>{label}{unit && <span className="font-normal text-mute"> ({unit})</span>}</span><input type="number" inputMode="decimal" aria-label={unit ? `${label} (${unit})` : label} aria-invalid={invalid || undefined} aria-describedby={invalid ? hint : undefined} min={min} max={max} step={step} placeholder="Unknown" value={shown} onChange={e => onChange(e.target.value === '' ? 'unselected' : e.target.value)} />{invalid && <small id={hint} className="text-xs text-crit-700 dark:text-crit-300">Treated as unknown: enter <span className="whitespace-nowrap">{rule}</span>.</small>}</label>;
}
function SelectFact({ label, value, onChange, options }) {
  const current = value === 'unselected' || value === null || value === undefined ? '' : String(value);
  return <label className="workspace-field !my-0 justify-between"><span>{label}</span><select aria-label={label} value={current} onChange={e => onChange(e.target.value === '' ? 'unselected' : e.target.value)}><option value="">Unknown</option>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>;
}
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => [String(lo + i), String(lo + i)]);
const asNumber = v => v === 'unselected' ? v : Number(v);
const asBoolean = v => v === 'unselected' ? v : v === 'true';
const YES_NO = [['true', 'Yes'], ['false', 'No']];

function KeyFacts({ state, change, replace }) {
  const cls = state.classification;
  const set = key => v => change({ [key]: v });
  const setNumber = key => v => change({ [key]: asNumber(v) });
  const setBoolean = key => v => change({ [key]: asBoolean(v) });
  return <section aria-labelledby="trial-key-facts"><h2 id="trial-key-facts" className="mb-1 text-lg font-bold">3. Key facts</h2><p className="mb-2 text-sm text-mute">Optional. Unknown stays unknown.</p><div className="grid grid-cols-2 gap-x-3 gap-y-2">
    <NumberFact label="Age" unit="y" field="age" rule="0–120" min={0} max={120} value={state.age} onChange={set('age')} />
    {cls !== 'tia' && <NumberFact label="NIHSS" field="nihss" rule="a whole number 0–42" min={0} max={42} value={state.nihss} onChange={set('nihss')} />}
    {cls === 'ischemic' && <>
      <SelectFact label="Pre-stroke mRS" value={state.preMrs} onChange={setNumber('preMrs')} options={range(0, 5)} />
      <SelectFact label="ASPECTS" value={state.aspects} onChange={setNumber('aspects')} options={range(0, 10).reverse()} />
      <div className="col-span-2"><SelectFact label="Occlusion site" value={state.vessel} onChange={set('vessel')} options={[['ica_m1', 'Intracranial ICA or M1'], ['dominant_m2', 'Dominant M2'], ['m2_m3_nd', 'Non-dominant/co-dominant M2 or M3'], ['other', 'Other (basilar, ACA, PCA…)'], ['none', 'No occlusion']]} /></div>
    </>}
    {cls === 'ich' && <>
      <SelectFact label="GCS" value={state.gcs} onChange={setNumber('gcs')} options={range(3, 15).reverse()} />
      <SelectFact label="Pre-stroke mRS" value={state.preMrs} onChange={setNumber('preMrs')} options={range(0, 5)} />
      <SelectFact label="ICH location" value={state.ichLocation} onChange={set('ichLocation')} options={[['bg', 'Basal ganglia'], ['lobar', 'Lobar'], ['thalamic', 'Thalamic'], ['infratentorial', 'Infratentorial'], ['other', 'Other']]} />
      <NumberFact label="Volume" unit="mL" field="ichVolume" rule="0–300 mL" min={0} max={300} step={0.1} value={state.ichVolume} onChange={set('ichVolume')} />
      <div className="col-span-2"><SelectFact label="Anticoagulant at onset" value={state.anticoagulant} onChange={v => replace(prev => applyAnticoagulant(prev, v))} options={[['none', 'None (none at onset or in the past 7 days)'], ['doac', 'DOAC (apixaban, rivaroxaban, dabigatran, edoxaban)'], ['lmwh', 'LMWH'], ['vka', 'Warfarin / VKA']]} /></div>
      <SelectFact label="Statin at onset" value={state.statin} onChange={setBoolean('statin')} options={YES_NO} />
    </>}
    <SelectFact label="Atrial fibrillation documented" value={state.afibHistory} onChange={setBoolean('afibHistory')} options={YES_NO} />
    {cls !== 'ich' && <SelectFact label="On oral anticoagulant at index stroke" value={state.takingOac} onChange={v => replace(prev => ({ ...(prev.anticoagulant && prev.anticoagulant !== 'unselected' ? applyAnticoagulant(prev, 'unselected') : prev), takingOac: asBoolean(v) }))} options={YES_NO} />}
  </div></section>;
}

// Manual timing entries replace an Encounter LKW anchor (onsetAnchorMs: null).
function TimingSection({ state, change, nowMs }) {
  const live = anchoredOnsetHours(state, nowMs);
  const exact = state.onsetVal !== null && !Array.isArray(state.onsetRangeHours) && state.onsetUnit === 'hours';
  // A negative or unreadable interval is not used; say so instead of "entered".
  const invalid = live === null && exact && onsetToHours(state.onsetVal, 'hours') === null;
  const pressed = preset => Array.isArray(state.onsetRangeHours) && state.onsetRangeHours[0] === preset.rangeHours[0] && state.onsetRangeHours[1] === preset.rangeHours[1];
  const shown = live !== null ? Math.round(live * 100) / 100 : exact ? state.onsetVal : '';
  return <section><h2 className="mb-2 text-lg font-bold">2. Time since last known well</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">{ONSET_PRESETS.map(preset => <button key={preset.name} type="button" className={buttonClass} aria-pressed={pressed(preset)} onClick={() => change({ onsetVal: preset.val, onsetUnit: preset.unit, onsetRangeHours: preset.rangeHours, onsetAnchorMs: null })}>{preset.name}{' '}<span className="block text-xs text-mute">{preset.desc}</span></button>)}</div>
    <label htmlFor="trial-exact-onset" className="mt-3 block text-sm font-semibold text-ink-2">Exact hours from LKW</label><div className="workspace-field !my-1"><div className="flex flex-wrap items-center gap-2"><input id="trial-exact-onset" className="!w-auto min-w-0 flex-1 basis-24" type="number" inputMode="decimal" aria-label="Exact hours from LKW" aria-invalid={invalid || undefined} min={0} step={0.1} placeholder="Optional" value={shown} onChange={e => change(e.target.value === '' ? { onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours', onsetAnchorMs: null } : { onsetVal: e.target.value, onsetUnit: 'hours', onsetRangeHours: null, onsetAnchorMs: null })} /><button type="button" className={buttonClass} onClick={() => change({ onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours', onsetAnchorMs: null })}>Clear onset to unknown</button></div></div>
    <p className="mt-2 text-sm text-mute">{live !== null ? 'Live from the Encounter LKW time; updates as time passes. Editing replaces it.' : state.onsetVal === null ? 'Onset not recorded; timing remains unknown.' : invalid ? 'Not a valid interval; timing remains unknown.' : exact ? 'Exact interval entered.' : 'Selected range only; confirm the exact interval required by each study.'}</p></section>;
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
  const anchored = typeof state.onsetAnchorMs === 'number';
  useEffect(() => {
    if (!active || (!encounter && !anchored)) return undefined;
    setTick(Date.now());
    const timer = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [active, encounter, anchored]);
  const nowMs = Math.max(typeof now === 'number' ? now : 0, tick);
  const prefill = useMemo(() => encounter ? screenerPrefillFromEncounter(encounter, nowMs) : null, [encounter, nowMs]);
  const replace = updater => { onStateChange?.(); setApplied(null); setState(updater); };
  const change = patch => replace(prev => ({ ...prev, ...patch }));
  const importEncounter = () => {
    const at = Date.now();
    const fresh = screenerPrefillFromEncounter(encounter, at);
    onStateChange?.();
    setTick(at);
    setState(prev => applyEncounterPrefill(prev, fresh, createInitialScreenerState()));
    setApplied(typeof fresh.patch?.onsetAnchorMs === 'number' ? 'timing live from the Encounter LKW' : 'no LKW time recorded in Encounter');
  };
  // The clock only matters for an Encounter-anchored onset; otherwise results stay put.
  const evalNow = anchored ? nowMs : null;
  const results = useMemo(() => evaluateAll(state, screenerTrials, evalNow), [state, evalNow]);
  const exclusions = useMemo(() => { const p = buildScreenerParams({ ...state, exclusions: {} }, evalNow); const activeTrials = screenerTrials.filter(trial => screenable(trial) && isTrialPotentiallyActive(trial, p)).map(trial => trial.acronym); return EXCLUSION_ITEMS.filter(item => item.classifications.includes(state.classification) && item.trials.some(id => activeTrials.includes(id))); }, [state, evalNow]);
  const matches = potentialMatches(results), insufficient = insufficientInformation(results);
  const candidates = [...matches, ...insufficient];
  const later = results.soon;
  const notMet = relevantNotMet(results.excluded);
  const picasso = screenerTrials.find(trial => trial.acronym === 'PICASSO' && trial.referenceOnly);
  return <div className="space-y-4">
    <EncounterBanner prefill={prefill} onUse={importEncounter} applied={applied} />
    <div className="trial-screening-workspace space-y-5 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
      <div className="trial-screening-filters min-w-0 space-y-5 lg:sticky lg:top-[calc(var(--case-bar-h,0px)+1rem)] lg:max-h-[calc(100dvh-var(--case-bar-h,0px)-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
        <section><h2 className="mb-2 text-lg font-bold">1. Stroke classification</h2><div className="flex flex-wrap gap-2">{CLASSIFICATIONS.map(([id, label]) => <button key={id} type="button" className={buttonClass} aria-pressed={state.classification === id} onClick={() => { const initial = createInitialScreenerState(); const hidden = Object.fromEntries(ALL_VISIBLE_FACTS.filter(key => !VISIBLE_FACTS[id].includes(key)).map(key => [key, initial[key]])); change({ ...hidden, classification: id, onsetVal: null, onsetRangeHours: null, onsetUnit: 'hours', onsetAnchorMs: null, exclusions: {}, anticoagulant: 'unselected', takingOac: 'unselected', imported: null }); }}>{label}</button>)}</div>
          {results.ready && <a href="#trial-results" className="mt-1 text-sm font-semibold text-link-600 underline lg:!hidden">View {candidates.length} possible candidate{candidates.length === 1 ? '' : 's'} ↓</a>}</section>
        {results.ready && <><TimingSection state={state} change={change} nowMs={nowMs} /><KeyFacts state={state} change={change} replace={replace} /><ExclusionRefiner summaryRef={refinerRef} items={exclusions} checked={state.exclusions} onToggle={(id, value) => replace(prev => { const next = { ...prev.exclusions }; if (typeof value === 'boolean') next[id] = value; else delete next[id]; return { ...prev, exclusions: next }; })} onClear={() => { change({ exclusions: {} }); requestAnimationFrame(() => refinerRef.current?.focus()); }} /></>}
        <button type="button" className={buttonClass} onClick={() => { setApplied(null); change(createInitialScreenerState()); }}>Reset screen</button>
      </div>
      <div id="trial-results" className="min-w-0 scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-sm text-mute">{results.ready ? `${matches.length} potential match${matches.length === 1 ? '' : 'es'} · ${insufficient.length} insufficient information · ${later.length} later · ${notMet.length} not met` : 'Choose a classification to see possible study profiles.'}</p>{results.ready && <button type="button" className={buttonClass} onClick={() => copyToClipboard?.(results.briefingNote, 'Screening summary')}>Copy screening summary</button>}</div>
        {!results.ready && <StudyOverview onDetails={setModal} />}
        {results.ready && <>
          <ResultGroup title="Possible candidates (not definitive)" label="Possible candidates" items={[]} count={candidates.length} onDetails={setModal}>{candidates.length === 0 && <p className="text-sm text-mute">No possible candidate under the entered facts.</p>}
            <CandidateSubgroup title="Potential match" label="Potential match" description="Every modeled criterion is met. Not a definitive match: confirm the remaining registry items, protocol, local activation and consent." empty="No study has every modeled criterion met." items={matches} onDetails={setModal} />
            <CandidateSubgroup title="Insufficient information" label="Insufficient information" description="At least one modeled fact is unknown; confirm it before treating the study as a potential match." empty="None." items={insufficient} onDetails={setModal} />
          </ResultGroup>
          {later.length > 0 && <ResultGroup title="Later · before window or not yet recruiting" label="Later" items={later} onDetails={setModal} />}
          {notMet.length > 0 && <details className="rounded-lg border border-line bg-paper-2 p-3"><summary className="min-h-[44px] cursor-pointer font-semibold">{NOT_MET_TEXT} ({notMet.length})</summary><ul className="mt-1 space-y-1">{notMet.map(item => <li key={item.trial.acronym} className="flex flex-wrap items-center gap-x-2 text-sm"><button type="button" className="min-h-[44px] font-bold text-link-600 underline" aria-label={`Full criteria for ${item.trial.acronym}`} onClick={() => setModal(item.trial)}>{item.trial.acronym}</button><span className="min-w-0 flex-1">{item.exclusionReasons.join('; ')}</span></li>)}</ul></details>}
          {state.classification === 'ischemic' && picasso && <p className="text-xs text-mute">Not modeled here: {picasso.acronym} ({picasso.externalMetadata.nct}, acute carotid stenting with EVT for tandem/proximal ICA lesions) — criteria in Tables.</p>}
          <details className="rounded-lg border border-line bg-card"><summary className="min-h-[44px] cursor-pointer px-3 py-2 text-sm font-semibold">Preview screening summary</summary><pre aria-label="Screening summary preview" tabIndex={0} className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t border-line p-3 font-mono text-xs leading-relaxed">{results.briefingNote}</pre></details>
        </>}
      </div>
    </div>
    {modal && active && <TrialDetailsModal trial={modal} now={nowMs} onClose={() => setModal(null)} />}
  </div>;
}

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function StudyDatabase({ active = true, now = null }) {
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
    <div className="grid gap-3 md:grid-cols-2">{trials.map(trial => <TrialCard key={trial.acronym} trial={trial} onDetails={() => setModal(trial)} />)}</div>{trials.length === 0 && <p>No studies match these filters.</p>}{modal && active && <TrialDetailsModal trial={modal} now={now} onClose={() => setModal(null)} />}</div>;
}
export default TrialScreener;
