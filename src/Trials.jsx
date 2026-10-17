import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TrialScreener, StudyDatabase } from './components/TrialScreener.jsx';
import { EligibilityTables } from './components/EligibilityTables.jsx';
import { screenerTrials } from './evidence/screenerTrials.js';
import { SCREEN_CAVEAT, registryCheckLabel, registryCheckAgeText } from './evidence/screener-eval.js';

const VIEWS = [['screener', 'Screener'], ['tables', 'Tables'], ['database', 'Database']];
const CHECK_DATES = screenerTrials.map(trial => trial.externalMetadata?.verificationDate).filter(Boolean).sort();
// One date when every profile was checked together, otherwise the oldest-to-newest range.
const CHECK_LABEL = registryCheckLabel(CHECK_DATES);
const OLDEST_CHECK = CHECK_DATES[0] || null;
const RECRUITING = screenerTrials.filter(trial => trial.status === 'enrolling').length;
// One page-level statement replaces the registry/activation boilerplate that
// used to repeat on every card. The age refers to the oldest check shown.
const pageCaveat = now => {
  const age = registryCheckAgeText(OLDEST_CHECK, now);
  return SCREEN_CAVEAT.replace('First-pass registry screen', `First-pass registry screen${CHECK_LABEL ? ` (${CHECK_LABEL}${age ? `, ${age}` : ''})` : ''}`);
};

export default function Trials({ sub = 'screener', onNavigate, active = true, encounter = null, now = null }) {
  const [localView, setLocalView] = useState('screener');
  const view = VIEWS.some(([id]) => id === (onNavigate ? sub : localView)) ? (onNavigate ? sub : localView) : 'screener';
  const [copyState, setCopyState] = useState(null);
  const copyEpoch = useRef(0), fallback = useRef(null);
  const clearCopy = useCallback(() => { copyEpoch.current += 1; setCopyState(null); }, []);
  const navigate = id => { clearCopy(); if (onNavigate) onNavigate(id); else setLocalView(id); };
  const moveTab = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = VIEWS.findIndex(([id]) => id === view);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? VIEWS.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + VIEWS.length) % VIEWS.length;
    const id = VIEWS[index][0]; navigate(id); document.getElementById(`trials-${id}-tab`)?.focus();
  };
  useEffect(clearCopy, [view, clearCopy]);
  useEffect(() => { if (!active) clearCopy(); }, [active, clearCopy]);
  useEffect(() => { if (copyState?.failed) { fallback.current?.focus(); fallback.current?.select(); } }, [copyState]);
  const copyToClipboard = useCallback(async (text, label) => {
    const epoch = ++copyEpoch.current;
    setCopyState(null);
    try {
      await navigator.clipboard.writeText(text);
      if (copyEpoch.current === epoch) setCopyState({ label, failed: false });
    } catch {
      if (copyEpoch.current === epoch) setCopyState({ label, text, failed: true });
    }
  }, []);
  return <section className="trials-surface space-y-5" aria-labelledby="trials-title">
    <header className="workspace-heading"><h1 id="trials-title">Trials</h1><span className="text-sm text-mute">{RECRUITING} recruiting at recorded registry check · {screenerTrials.length} study profiles</span></header>
    <p className="workspace-help">{pageCaveat(now)} Screening does not determine treatment eligibility.</p>
    <div role="tablist" aria-label="Trials sub-view" onKeyDown={moveTab} className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-paper-2 p-1">
      {VIEWS.map(([id, label]) => <button key={id} type="button" id={`trials-${id}-tab`} role="tab" tabIndex={view === id ? 0 : -1} aria-selected={view === id} aria-controls={`trials-${id}-panel`} className={`min-h-[44px] rounded-md px-2 sm:px-4 text-sm font-semibold ${view === id ? 'bg-card text-ink shadow-card' : 'text-mute hover:text-ink-2'}`} onClick={() => navigate(id)}>{label}</button>)}
    </div>
    <div id="trials-screener-panel" role="tabpanel" aria-labelledby="trials-screener-tab" hidden={view !== 'screener'}><TrialScreener copyToClipboard={copyToClipboard} onStateChange={clearCopy} active={active && view === 'screener'} encounter={encounter} now={now} /></div>
    <div id="trials-tables-panel" role="tabpanel" aria-labelledby="trials-tables-tab" hidden={view !== 'tables'}><EligibilityTables copyToClipboard={copyToClipboard} onStateChange={clearCopy} /></div>
    {/* The panel's h2 keeps the study cards (h3) one level below the page h1. */}
    <div id="trials-database-panel" role="tabpanel" aria-labelledby="trials-database-tab" hidden={view !== 'database'}><h2 className="sr-only">Study database</h2><StudyDatabase active={active && view === 'database'} now={now} /></div>
    {copyState && <div role="status" className="workspace-result">{copyState.failed ? <><p>Clipboard unavailable. Select this {copyState.label.toLowerCase()} and copy it manually.</p><textarea ref={fallback} aria-label="Trial copy fallback" readOnly rows={8} value={copyState.text} /></> : `${copyState.label} copied.`}</div>}
  </section>;
}
