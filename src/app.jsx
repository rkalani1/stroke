import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Encounter from './Encounter.jsx';
import { BUILD_PUBLIC_DEMO, BUILD_TARGET_MARKER } from './build-flags.js';
import { newEncounter, updateEncounter, setEncounterReviewedScore, encounterVolume, protocolVolumeEstimate, protocolEncounter, encounterNihss, encounterTiming, copySummary, buildSummary, outputWarnings } from './workspace-state.js';
import { documentationLabel } from './documentation-output.js';
import { focusEncounterTarget } from './encounter-overview.js';
import CaseBar from './components/CaseBar.jsx';
import { NAV_ICONS, SearchIcon } from './components/NavIcons.jsx';
import { revealProtocolTarget } from './protocol-navigation.js';
import { parseWorkspaceRoute } from './workspace-routing.js';
import { bootstrapTheme, getThemePref, setThemePref } from './design/theme.js';
import { bindSWController, onUpdateReady, acceptUpdate } from './design/sw-controller.js';
const InstallAppButton = lazy(() => import('./components/InstallAppButton.jsx').then(module => ({ default: module.InstallAppButton })));
import { elapsedEncounterTime } from './clinical/encounter-time.js';
import { useCurrentTime } from './use-current-time.js';
const ProtectedProtocols = lazy(() => import('./ProtectedProtocols.jsx'));
const Trials = lazy(() => import('./Trials.jsx'));
// Evidence props are stable, so memo keeps the hidden surface from re-running its search on every keystroke and clock tick.
const Reference = lazy(() => import('./Reference.jsx').then(module => ({ default: React.memo(module.default) })));
const Tools = lazy(() => import('./Tools.jsx'));
const QuickSearch = lazy(() => import('./components/QuickSearch.jsx'));
const QuickReference = lazy(() => import('./components/QuickReference.jsx'));
const APP_VERSION = '7.7.12';
const getPublicDemoMode = () => {
  if (BUILD_PUBLIC_DEMO) return true;
  return /(^|\.)github\.io$/i.test(window.location.hostname || '');
};
const PUBLIC_DEMO_MODE = getPublicDemoMode();
const MAP_URL = 'https://rkalani1.github.io/telestroke-expansion-map/';
class SurfaceBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <section role="alert"><h1>{this.props.label || 'Protocols'} unavailable</h1><p>The {(this.props.label || 'Protocols').toLowerCase()} download failed. Your Encounter entries remain in this session. Return to Encounter, or explicitly reload when connected to retry; reloading clears the session.</p><a href="#/encounter">Return to Encounter</a><button type="button" onClick={() => { if (window.confirm('Reload to retry the download? Current encounter entries will be cleared.')) location.reload(); }}>Reload to retry</button></section> : this.props.children;
  }
}

function App() {
  const [state, setState] = useState(newEncounter);
  const utilitiesRef = useRef(null);
  const [utilitiesVisited, setUtilitiesVisited] = useState(false);
  const stateRef = useRef(state); stateRef.current = state;
  const [route, setRoute] = useState(() => parseWorkspaceRoute(location.hash));
  // Per-surface scroll memory; `focus` hands an Encounter target to the next commit.
  const scrollMemory = useRef({ surface: route.surface, sub: route.sub || '', positions: {}, pending: null, focus: null });
  const [protocolVisited, setProtocolVisited] = useState(route.surface === 'protocols');
  const [evidenceVisited, setEvidenceVisited] = useState(route.surface === 'evidence');
  const [trialsVisited, setTrialsVisited] = useState(route.surface === 'trials');
  const [epoch, setEpoch] = useState(0);
  const hasTimestamp = Boolean(Object.values(state.timeline || {}).some(Boolean) || state.note.lkwDate && state.note.lkwTime || state.note.discoveryDate && state.note.discoveryTime || state.note.lastDOACDose || state.note.wakeUpStrokeWorkflow.sleepMidpoint || state.actions.consentTime || state.actions.evtConsentTime || state.actions.administrationTime || state.actions.punctureTime || state.actions.reperfusionTime);
  const [now, refreshNow] = useCurrentTime(hasTimestamp && ['encounter', 'protocols'].includes(route.surface));
  const [theme, setTheme] = useState(getThemePref);
  const [copyStatus, setCopyStatus] = useState('');
  const [updateReady, setUpdateReady] = useState(null);
  const [offlineStatus, setOfflineStatus] = useState('Checking offline availability…');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setInstalled] = useState(() => Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches));
  const [searchOpen, setSearchOpen] = useState(false), [searchVisited, setSearchVisited] = useState(false);
  const openSearch = () => { setSearchVisited(true); setSearchOpen(true); };
  useEffect(() => {
    const onKey = event => {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
      else if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); openSearch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // The More panel closes on Escape or a click outside it.
  useEffect(() => {
    const close = event => {
      const panel = utilitiesRef.current;
      if (!panel?.open) return;
      if (event.type === 'keydown' ? event.key === 'Escape' : !panel.contains(event.target)) { panel.open = false; if (event.type === 'keydown') panel.querySelector('summary')?.focus(); }
    };
    document.addEventListener('keydown', close); document.addEventListener('pointerdown', close);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); };
  }, []);
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const surface = getComputedStyle(document.documentElement).getPropertyValue('--c-surface').trim().split(/\s+/).map(Number);
    if (meta && surface.length === 3 && surface.every(Number.isFinite)) meta.setAttribute('content', `rgb(${surface.join(',')})`);
  }, [theme]);
  const update = updater => { refreshNow(); setState(prev => updateEncounter(prev, updater)); setCopyStatus(''); };
  useEffect(() => {
    if (!location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/encounter`);
    // The per-surface memory below is the only scroll restoration on hash routes.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Each surface keeps its own scroll position (per sub-tab) unless the route names a target.
    const changed = () => {
      const next = parseWorkspaceRoute(location.hash), memory = scrollMemory.current, sub = next.sub || '';
      if (next.surface !== memory.surface) {
        memory.positions[memory.surface] = { sub: memory.sub, y: window.scrollY };
        const saved = memory.positions[next.surface];
        memory.pending = next.target || next.tool || next.section || next.focusId || memory.focus ? null : { surface: next.surface, y: saved && saved.sub === sub ? saved.y : 0 };
      }
      memory.surface = next.surface; memory.sub = sub;
      setRoute(next); if (next.surface === 'protocols') setProtocolVisited(true); if (next.surface === 'trials') setTrialsVisited(true); if (next.surface === 'evidence') setEvidenceVisited(true);
    };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useLayoutEffect(() => {
    const memory = scrollMemory.current;
    if (memory.pending?.surface !== route.surface) return;
    const { y } = memory.pending;
    memory.pending = null;
    // Lazily mounted surfaces grow after the first paint; retry briefly until the
    // saved offset fits, and stop as soon as the user scrolls or types.
    let frames = 0, frame = 0;
    const attempt = () => { window.scrollTo(0, y); if (Math.abs(window.scrollY - y) > 2 && frames++ < 60) frame = requestAnimationFrame(attempt); };
    const stop = () => cancelAnimationFrame(frame);
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach(type => window.addEventListener(type, stop, { passive: true }));
    attempt();
    return () => { stop(); events.forEach(type => window.removeEventListener(type, stop)); };
  }, [route]);
  useEffect(() => {
    const memory = scrollMemory.current;
    if (route.surface !== 'encounter' || !memory.focus) return;
    const { id, then } = memory.focus;
    memory.focus = null;
    const frame = requestAnimationFrame(() => { focusEncounterTarget(id); then?.(); });
    return () => cancelAnimationFrame(frame);
  }, [route]);
  // The window title names the current surface, so screen readers and tab switchers confirm a route change.
  useEffect(() => {
    const label = { encounter: 'Encounter workspace', protocols: route.sub === 'ich' ? 'ICH protocols' : 'Ischemic protocols', trials: 'Trials', evidence: 'Evidence', tools: 'Calculators', retired: 'Retired link' }[route.surface];
    document.title = label ? `Stroke · ${label}` : 'Stroke';
  }, [route.surface, route.sub]);
  // Tool deep links reveal their target on navigation, and again when a diagnosis change first
  // renders a gated tool; other diagnosis edits never move scroll or focus.
  const toolReveal = useRef({ route: null, missing: false });
  useEffect(() => {
    if ((!route.tool && !route.section) || route.surface !== 'encounter') return;
    const routeChanged = toolReveal.current.route !== route;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(route.section ? `encounter-details-${route.section}` : `calc-${route.tool}`);
      const wasMissing = !routeChanged && toolReveal.current.missing;
      toolReveal.current = { route, missing: !target };
      // A diagnosis-gated tool is not rendered yet: show the inline 'needs a … encounter' action instead.
      if (!target) { if (routeChanged) { window.scrollTo(0, 0); (document.querySelector('#workspace-main .workspace-inline-action button') || document.getElementById('input-diagnosis'))?.focus({ preventScroll: true }); } return; }
      if (!routeChanged && !wasMissing) return;
      const container = target.closest('details'); if (container) container.open = true;
      target.querySelectorAll('details:not(.source-limits)').forEach(detail => { detail.open = true; });
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      const control = target.matches('input,select,button') ? target : target.querySelector('input,select,button,summary');
      (control || target).focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [route, state.note.diagnosisCategory]);
  useEffect(() => {
    if (route.surface !== 'protocols' || !route.target) return;
    const reveal = () => revealProtocolTarget(route.target);
    if (reveal()) return;
    const observer = new MutationObserver(() => { if (reveal()) observer.disconnect(); });
    observer.observe(document.getElementById('workspace-main'), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [route]);
  useEffect(() => {
    bindSWController();
    const unsubscribe = onUpdateReady(payload => setUpdateReady(payload));
    const beforeInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    const installed = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', beforeInstall); window.addEventListener('appinstalled', installed);
    // An installed app can stay open or be resumed for days; re-check for a new version when it
    // becomes visible again (at most every 30 min) and hourly while open. Activation stays behind Reload.
    let registration = null, lastCheck = Date.now();
    const recheck = () => {
      if (!registration || document.visibilityState !== 'visible' || Date.now() - lastCheck < 30 * 60000) return;
      lastCheck = Date.now(); registration.update().catch(() => {});
    };
    document.addEventListener('visibilitychange', recheck); window.addEventListener('pageshow', recheck);
    const recheckTimer = setInterval(recheck, 60 * 60000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(reg => {
        registration = reg;
        if (reg.waiting) setUpdateReady({});
        const watch = worker => worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') { setOfflineStatus('Available offline'); if (navigator.serviceWorker.controller) setUpdateReady({}); }
          if (worker.state === 'redundant') setOfflineStatus('Update download failed; current version kept');
        });
        watch(reg.installing); reg.addEventListener('updatefound', () => watch(reg.installing));
        if (reg.active) setOfflineStatus('Available offline · links need internet');
        reg.update().catch(() => {});
      }).catch(() => setOfflineStatus('Offline mode unavailable in this browser'));
    } else setOfflineStatus('Offline mode unavailable in this browser');
    return () => { unsubscribe(); window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed); document.removeEventListener('visibilitychange', recheck); window.removeEventListener('pageshow', recheck); clearInterval(recheckTimer); };
  }, []);
  const reset = () => {
    if (!window.confirm('Start a new encounter? All current entries, drafts and timers will be cleared.')) return;
    if (utilitiesRef.current) utilitiesRef.current.open = false;
    setState(newEncounter()); setEpoch(v => v + 1); setCopyStatus('');
    // Point the memory at a fresh Encounter first so the outgoing surface's offset is not re-saved.
    const here = location.hash === '#/encounter';
    Object.assign(scrollMemory.current, { positions: {}, focus: null, surface: 'encounter', sub: '', pending: here ? null : { surface: 'encounter', y: 0 } });
    if (here) window.scrollTo(0, 0); else location.hash = '#/encounter';
  };
  // Focus an Encounter target, switching surfaces first when needed; the focus runs
  // after the Encounter panel is visible and replaces any restored scroll offset.
  const goToEncounter = (id, then) => {
    if (parseWorkspaceRoute(location.hash).surface === 'encounter') { focusEncounterTarget(id); then?.(); return; }
    scrollMemory.current.focus = { id, then };
    location.hash = '#/encounter';
  };
  const copy = async text => {
    const result = await copySummary(stateRef, text, value => navigator.clipboard.writeText(value));
    if (result === 'copied') setCopyStatus('Summary copied.');
    if (result === 'denied') { setCopyStatus('Clipboard unavailable. Select the read-only summary and copy it manually.'); document.querySelector('[data-generated-note]')?.select(); }
  };
  // One tap: regenerate the current note from canonical fields, then copy it.
  const generateAndCopy = async () => {
    const current = stateRef.current;
    if (outputWarnings(current).length) { goToEncounter('handoff-title'); return; }
    const text = buildSummary(current, Date.now()), draft = { text, revision: current.revision, stale: false };
    stateRef.current = { ...current, draft };
    setState(prev => prev.revision === current.revision ? { ...prev, draft } : prev);
    const result = await copySummary(stateRef, text, value => navigator.clipboard.writeText(value));
    if (result === 'copied') setCopyStatus(`${documentationLabel(current)} copied.`);
    if (result === 'denied') { setCopyStatus('Clipboard unavailable. Select the read-only summary and copy it manually.'); goToEncounter('handoff-title', () => document.querySelector('[data-generated-note]')?.select()); }
  };
  const timing = encounterTiming(state.note, now);
  const volume = encounterVolume(state.volume);
  const sharedProtocol = { ...protocolEncounter(state, now), onChange: (key, value) => update(prev => {
    if (key === 'aspectsScore' || key === 'pcAspects') return setEncounterReviewedScore(prev, key === 'aspectsScore' ? 'aspects' : key, value);
    if (key === 'massEffect') return { ...prev, evtMassEffect: value };
    if (key === 'bpSystolic' || key === 'bpDiastolic') {
      const parts = prev.note.presentingBP.split('/');
      parts[key === 'bpSystolic' ? 0 : 1] = value;
      return { ...prev, note: { ...prev.note, presentingBP: `${parts[0] || ''}/${parts[1] || ''}` } };
    }
    const noteKey = { preMRS: 'premorbidMRS', wakeUpOrUnknownOnset: 'lkwUnknown', ichOnCT: 'ctHemorrhageStatus' }[key] || key;
    const noteValue = key === 'ichOnCT' ? value === null ? '' : value ? 'present' : 'absent' : value;
    return { ...prev, note: { ...prev.note, [noteKey]: noteValue } };
  }) };
  const targetUnavailable = route.tool && !['nihss', 'mrs', 'crcl', 'gcs'].includes(route.tool) && (['ich-volume', 'ich-score', 'gcs'].includes(route.tool) ? !(['ich-volume', 'ich-score'].includes(route.tool) ? state.note.diagnosisCategory === 'ich' : ['ich','sah','cvt'].includes(state.note.diagnosisCategory)) : !(state.context === 'acute' && (state.note.diagnosisCategory === 'ischemic' || route.tool === 'dapt' && state.note.diagnosisCategory === 'tia')));
  return <div className="app-shell workspace-shell" data-build={BUILD_TARGET_MARKER} data-demo={PUBLIC_DEMO_MODE ? 'synthetic' : 'private'} data-version={APP_VERSION}>
    <a className="workspace-skip" href="#workspace-main" onClick={event => { event.preventDefault(); const main = document.getElementById('workspace-main'); main?.focus(); main?.scrollIntoView({ block: 'start' }); }}>Skip to content</a>
    <header className="workspace-header"><a className="workspace-brand" href="#/encounter"><span className="workspace-mark" aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></span>Stroke</a>
      <button type="button" className="workspace-search" onClick={openSearch} aria-label="Search protocols, calculators, evidence and trials" aria-keyshortcuts="Control+K Meta+K /"><SearchIcon /><span className="workspace-search__text">Search</span><kbd>{/Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘K' : 'Ctrl K'}</kbd></button>
      <nav className="workspace-secondary" aria-label="Primary navigation">{[['encounter', '#/encounter', 'Encounter'], ['protocols', state.note.diagnosisCategory === 'ich' ? '#/protocols/ich' : '#/protocols/ischemic', 'Protocols'], ['trials', '#/trials', 'Trials'], ['evidence', '#/evidence', 'Evidence'], ['tools', '#/tools', 'Calculators']].map(([surface, href, label]) => { const Icon = NAV_ICONS[surface]; return <a key={surface} href={href} aria-current={route.surface === surface ? 'page' : undefined}><Icon /><span>{label}</span></a>; })}</nav>
      <details ref={utilitiesRef} className="workspace-utilities" onToggle={event => { if (event.currentTarget.open) setUtilitiesVisited(true); }}><summary aria-label="More utilities">More</summary><div className="utility-panel"><label>Theme<select aria-label="Theme" value={theme} onChange={e => { setThemePref(e.target.value); setTheme(e.target.value); }}>{[['auto', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label><button type="button" className="utility-action" onClick={() => { if (utilitiesRef.current) utilitiesRef.current.open = false; reset(); }}>Start new encounter</button>{utilitiesVisited && <Suspense fallback={<p role="status">Loading install options…</p>}><InstallAppButton className="w-full justify-center" installPrompt={installPrompt} isInstalled={isInstalled} onInstall={async () => { if (!installPrompt) return; try { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstalled(true); setInstallPrompt(null); } catch { setInstallPrompt(null); } }} /></Suspense>}<p className="utility-shortcuts"><kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd> search</p><p>Version {APP_VERSION}</p><p role="status">{offlineStatus}</p></div></details></header>
    <nav className="workspace-external" aria-label="External references"><a href={MAP_URL} target="_blank" rel="noopener noreferrer">Telestroke Map</a><a href="https://www.uptodate.com/" target="_blank" rel="noopener noreferrer">UpToDate</a><a href="https://www.openevidence.com/" target="_blank" rel="noopener noreferrer">OpenEvidence</a></nav>
    <CaseBar state={state} documentLabel={documentationLabel(state)} blocked={outputWarnings(state).length} onCopy={generateAndCopy} copyStatus={copyStatus} announceCopy={route.surface !== 'encounter'} />
    {searchVisited && <Suspense fallback={null}><QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} onFocusEncounter={goToEncounter} version={APP_VERSION} protocolSub={route.surface === 'protocols' && route.sub ? route.sub : state.note.diagnosisCategory === 'ich' ? 'ich' : 'ischemic'} /></Suspense>}
    {updateReady && <aside className="workspace-update" aria-label="App update"><p role="status">{updateReady.message || 'A new version is ready. Updating reloads this page and clears its session; finish or copy your note first.'}</p><button type="button" onClick={() => acceptUpdate().catch(() => setUpdateReady({ message: 'Update failed. Current encounter remains open; try again when connected.' }))}>Reload to update</button><button type="button" onClick={() => setUpdateReady(null)}>Later</button></aside>}
    <main id="workspace-main" tabIndex={-1}>
      <div hidden={route.surface !== 'encounter'}>{targetUnavailable && <div role="status" className="workspace-result workspace-inline-action" data-tone="caution"><span>{['ich-volume', 'ich-score'].includes(route.tool) ? 'This calculator needs an ICH encounter.' : route.tool === 'gcs' ? 'GCS opens with ICH, SAH or CVT.' : 'This tool needs an acute ischemic stroke encounter.'}</span><button type="button" className="workspace-secondary-action" onClick={() => update(prev => ({ ...prev, context: 'acute', note: { ...prev.note, diagnosisCategory: ['ich-volume', 'ich-score', 'gcs'].includes(route.tool) ? 'ich' : route.tool === 'dapt' && prev.note.diagnosisCategory === 'tia' ? 'tia' : 'ischemic' } }))}>{['ich-volume', 'ich-score', 'gcs'].includes(route.tool) ? 'Set ICH' : 'Set acute ischemic stroke'}</button></div>}<Encounter onReset={reset} state={state} update={update} now={now} copyStatus={copyStatus} onCopy={copy} onGenerateAndCopy={generateAndCopy} onGenerate={text => { setState(prev => ({ ...prev, draft: { text, revision: prev.revision, stale: false } })); setCopyStatus(''); }} /></div>
      {protocolVisited && <div hidden={route.surface !== 'protocols'}>{sharedProtocol.safetyReviewRequired && <p role="status" className="workspace-result workspace-inline-action" data-tone={sharedProtocol.safetyReviewSeverity || 'critical'}><span><strong>IVT card held.</strong> {sharedProtocol.safetyReviewReason || 'Unresolved safety or anticoagulant concern in Encounter.'}</span><a href="#/encounter" onClick={event => { event.preventDefault(); goToEncounter('safety-title'); }}>Review in Encounter</a></p>}<Suspense fallback={null}><QuickReference sub={route.sub || 'ischemic'} weightKg={Number(state.note.weight) > 0 && Number(state.note.weight) <= 350 ? Number(state.note.weight) : undefined} reversal={state.context === 'acute' && ['ich', 'sah'].includes(state.note.diagnosisCategory) ? { agent: state.note.lastDOACType, inr: state.note.inr, lastDoseHours: state.note.lastDOACDose && Number.isFinite(Date.parse(state.note.lastDOACDose)) && Date.parse(state.note.lastDOACDose) <= now ? (now - Date.parse(state.note.lastDOACDose)) / 3600000 : null } : undefined} /></Suspense><p className="workspace-linked">Linked to Encounter: NIHSS, elapsed time and shared measurements update these cards.</p><SurfaceBoundary key={epoch}><Suspense fallback={<p role="status">Loading protocols…</p>}><ProtectedProtocols encounter={sharedProtocol} key={epoch} active={route.surface === 'protocols'} telestrokeNote={state.note} setTelestrokeNote={change => update(prev => ({ ...prev, note: typeof change === 'function' ? change(prev.note) : change }))} nihssScore={encounterNihss(state).total ?? 0} consultationType={state.consultationType === 'phone' ? 'telephone' : 'video'} pocketCardsCaseEpoch={epoch} managementSubTab={route.sub || 'ischemic'} setManagementSubTab={sub => { location.hash = `#/protocols/${sub}`; }} navigateTo={tab => { if (tab === 'encounter') goToEncounter('input-diagnosis'); else location.hash = '#/tools'; }} timeFromLKW={timing.clock ? elapsedEncounterTime({ time: new Date(timing.timestamp), label: timing.label }, new Date(now)) : null} ichVolumeParams={state.volume} setIchVolumeParams={change => update(prev => ({ ...prev, volume: typeof change === 'function' ? change(prev.volume) : change }))} ichVolumeEstimate={protocolVolumeEstimate(volume)} /></Suspense></SurfaceBoundary></div>}
      {trialsVisited && <div hidden={route.surface !== 'trials'}><SurfaceBoundary label="Trials" key={epoch}><Suspense fallback={<p role="status">Loading trials…</p>}><Trials key={epoch} sub={route.sub || 'screener'} onNavigate={sub => { location.hash = sub === 'screener' ? '#/trials' : `#/trials/${sub}`; }} active={route.surface === 'trials'} encounter={state} now={now} /></Suspense></SurfaceBoundary></div>}
      {evidenceVisited && <div hidden={route.surface !== 'evidence'}><SurfaceBoundary label="Evidence"><Suspense fallback={<p role="status">Loading evidence…</p>}><Reference version={APP_VERSION} focusId={route.focusId} active={route.surface === 'evidence'} /></Suspense></SurfaceBoundary></div>}
      {route.surface === 'tools' && <SurfaceBoundary label="Calculators"><Suspense fallback={<p role="status">Loading calculators…</p>}><Tools state={state} update={update} tool={route.tool} version={APP_VERSION} /></Suspense></SurfaceBoundary>}
      {route.surface === 'retired' && <section className="retirement-message"><h1>Retired destination</h1><p>This route is no longer maintained in the lean Stroke workspace.</p><p><a href="#/encounter">Return to Encounter</a> · <a href="#/tools">Calculators</a></p></section>}
    </main>
  </div>;
}
bootstrapTheme();
createRoot(document.getElementById('root')).render(<App />);
