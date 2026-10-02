import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Encounter from './Encounter.jsx';
import { BUILD_PUBLIC_DEMO, BUILD_TARGET_MARKER } from './build-flags.js';
import { newEncounter, updateEncounter, setEncounterReviewedScore, encounterVolume, protocolVolumeEstimate, protocolEncounter, encounterNihss, encounterTiming, copySummary } from './workspace-state.js';
import { revealProtocolTarget } from './protocol-navigation.js';
import { parseWorkspaceRoute } from './workspace-routing.js';
import { bootstrapTheme, getThemePref, setThemePref } from './design/theme.js';
import { bindSWController, onUpdateReady, acceptUpdate } from './design/sw-controller.js';
const InstallAppButton = lazy(() => import('./components/InstallAppButton.jsx').then(module => ({ default: module.InstallAppButton })));
import { elapsedEncounterTime } from './clinical/encounter-time.js';
import { useCurrentTime } from './use-current-time.js';
const ProtectedProtocols = lazy(() => import('./ProtectedProtocols.jsx'));
const Trials = lazy(() => import('./Trials.jsx'));
const Reference = lazy(() => import('./Reference.jsx'));
const Tools = lazy(() => import('./Tools.jsx'));
const APP_VERSION = '7.6.5';
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
  const [protocolVisited, setProtocolVisited] = useState(route.surface === 'protocols');
  const [evidenceVisited, setEvidenceVisited] = useState(route.surface === 'evidence');
  const [trialsVisited, setTrialsVisited] = useState(route.surface === 'trials');
  const [epoch, setEpoch] = useState(0);
  const hasTimestamp = Boolean(Object.values(state.timeline || {}).some(Boolean) || state.note.lkwDate && state.note.lkwTime || state.note.discoveryDate && state.note.discoveryTime || state.note.lastDOACDose || state.note.wakeUpStrokeWorkflow.sleepMidpoint || state.actions.consentTime || state.actions.evtConsentTime || state.actions.administrationTime || state.actions.punctureTime || state.actions.reperfusionTime);
  const [now, refreshNow] = useCurrentTime(hasTimestamp && ['encounter', 'protocols'].includes(route.surface));
  const [theme, setTheme] = useState(getThemePref);
  const [copyStatus, setCopyStatus] = useState('');
  const [updateReady, setUpdateReady] = useState(null);
  const [offlineStatus, setOfflineStatus] = useState('Offline cache not yet verified');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setInstalled] = useState(() => Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches));
  const update = updater => { refreshNow(); setState(prev => updateEncounter(prev, updater)); setCopyStatus(''); };
  useEffect(() => {
    if (!location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/encounter`);
    const changed = () => { const next = parseWorkspaceRoute(location.hash); setRoute(next); if (next.surface === 'protocols') setProtocolVisited(true); if (next.surface === 'trials') setTrialsVisited(true); if (next.surface === 'evidence') setEvidenceVisited(true); };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if ((!route.tool && !route.section) || route.surface !== 'encounter') return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(route.section ? `encounter-details-${route.section}` : `calc-${route.tool}`);
      if (!target) return;
      const container = target.closest('details'); if (container) container.open = true;
      target.querySelectorAll('details').forEach(detail => { detail.open = true; });
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(reg => {
        if (reg.waiting) setUpdateReady({});
        const watch = worker => worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') { setOfflineStatus('Complete app cache installed; retained core available offline'); if (navigator.serviceWorker.controller) setUpdateReady({}); }
          if (worker.state === 'redundant') setOfflineStatus('Update download failed; existing installed version retained');
        });
        watch(reg.installing); reg.addEventListener('updatefound', () => watch(reg.installing));
        if (reg.active) setOfflineStatus('Installed cache present; external links require internet');
        reg.update().catch(() => {});
      }).catch(() => setOfflineStatus('Offline installation unavailable in this browser session'));
    }
    return () => { unsubscribe(); window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', installed); };
  }, []);
  const reset = () => {
    if (!window.confirm('Start a new encounter? All current entries, drafts and timers will be cleared.')) return;
    if (utilitiesRef.current) utilitiesRef.current.open = false;
    setState(newEncounter()); setEpoch(v => v + 1); setCopyStatus(''); location.hash = '#/encounter';
  };
  const copy = async text => {
    const result = await copySummary(stateRef, text, value => navigator.clipboard.writeText(value));
    if (result === 'copied') setCopyStatus('Summary copied.');
    if (result === 'denied') { setCopyStatus('Clipboard unavailable. Select the read-only summary and copy it manually.'); document.querySelector('[data-generated-note]')?.select(); }
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
    <header className="workspace-header"><a className="workspace-brand" href="#/encounter"><span className="workspace-mark" aria-hidden="true"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></span>Stroke</a><details ref={utilitiesRef} className="workspace-utilities" onToggle={event => { if (event.currentTarget.open) setUtilitiesVisited(true); }}><summary aria-label="Utilities">More</summary><div className="utility-panel"><label>Theme<select aria-label="Theme" value={theme} onChange={e => { setThemePref(e.target.value); setTheme(e.target.value); }}>{[['auto', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>{utilitiesVisited && <Suspense fallback={<p role="status">Loading install options…</p>}><InstallAppButton installPrompt={installPrompt} isInstalled={isInstalled} onInstall={async () => { if (!installPrompt) return; try { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstalled(true); setInstallPrompt(null); } catch { setInstallPrompt(null); } }} /></Suspense>}<p>Version {APP_VERSION}</p><p role="status">{offlineStatus}</p></div></details><nav className="workspace-secondary" aria-label="Primary navigation"><a href="#/encounter" aria-current={route.surface === 'encounter' ? 'page' : undefined}>Encounter</a><a href="#/protocols/ischemic" aria-current={route.surface === 'protocols' ? 'page' : undefined}>Protocols</a><a href="#/trials" aria-current={route.surface === 'trials' ? 'page' : undefined}>Trials</a><a href="#/evidence" aria-current={route.surface === 'evidence' ? 'page' : undefined}>Evidence</a><a href="#/tools" aria-current={route.surface === 'tools' ? 'page' : undefined}>Calculators</a></nav></header>
    <nav className="workspace-external" aria-label="External references"><a href={MAP_URL} target="_blank" rel="noopener noreferrer">Telestroke Map</a><a href="https://www.uptodate.com/" target="_blank" rel="noopener noreferrer">UpToDate</a><a href="https://www.openevidence.com/" target="_blank" rel="noopener noreferrer">OpenEvidence</a></nav>
    {updateReady && <aside className="workspace-update" aria-label="App update"><p>{updateReady.message || 'A new version is ready. Updating reloads this page and clears its session; finish or copy your note first.'}</p><button type="button" onClick={() => acceptUpdate().catch(() => setUpdateReady({ message: 'Update failed. Current encounter remains open; try again when connected.' }))}>Reload to update</button><button type="button" onClick={() => setUpdateReady(null)}>Later</button></aside>}
    <main id="workspace-main" tabIndex={-1}>
      <div hidden={route.surface !== 'encounter'}>{targetUnavailable && <p role="status" className="workspace-result">This tool is inactive in the current context. Select the applicable working diagnosis/context in Encounter; retained values have not been cleared.</p>}<Encounter onReset={reset} state={state} update={update} now={now} copyStatus={copyStatus} onCopy={copy} onGenerate={text => { setState(prev => ({ ...prev, draft: { text, revision: prev.revision, stale: false } })); setCopyStatus(''); }} /></div>
      {protocolVisited && <div hidden={route.surface !== 'protocols'}><p className="workspace-help">Interactive protocol cards share Encounter measurements. Changing a source value clears their independent checks and attestations; navigation and elapsed-time updates preserve them. The active NIHSS score and elapsed hours are derived from Encounter. Ischemic-specific inputs are unavailable outside an acute ischemic context.</p>{sharedProtocol.safetyReviewRequired && <p role="status" className="workspace-result">Encounter records a contraindication, relative risk or contradictory finding requiring clinician review. A protocol-card acknowledgement does not resolve it; reconcile the visible Encounter concerns before an affirmative IVT result.</p>}<SurfaceBoundary key={epoch}><Suspense fallback={<p role="status">Loading retained protocols…</p>}><ProtectedProtocols encounter={sharedProtocol} key={epoch} active={route.surface === 'protocols'} telestrokeNote={state.note} setTelestrokeNote={change => update(prev => ({ ...prev, note: typeof change === 'function' ? change(prev.note) : change }))} nihssScore={encounterNihss(state).total ?? 0} consultationType={state.consultationType === 'phone' ? 'telephone' : 'video'} pocketCardsCaseEpoch={epoch} managementSubTab={route.sub || 'ischemic'} setManagementSubTab={sub => { location.hash = `#/protocols/${sub}`; }} navigateTo={tab => { location.hash = tab === 'encounter' ? '#/encounter' : '#/tools'; }} timeFromLKW={timing.clock ? elapsedEncounterTime({ time: new Date(timing.timestamp), label: timing.label }, new Date(now)) : null} ichVolumeParams={state.volume} setIchVolumeParams={change => update(prev => ({ ...prev, volume: typeof change === 'function' ? change(prev.volume) : change }))} ichVolumeEstimate={protocolVolumeEstimate(volume)} /></Suspense></SurfaceBoundary></div>}
      {trialsVisited && <div hidden={route.surface !== 'trials'}><SurfaceBoundary label="Trials" key={epoch}><Suspense fallback={<p role="status">Loading trials…</p>}><Trials key={epoch} sub={route.sub || 'screener'} onNavigate={sub => { location.hash = sub === 'screener' ? '#/trials' : `#/trials/${sub}`; }} active={route.surface === 'trials'} /></Suspense></SurfaceBoundary></div>}
      {evidenceVisited && <div hidden={route.surface !== 'evidence'}><SurfaceBoundary label="Evidence"><Suspense fallback={<p role="status">Loading evidence…</p>}><Reference version={APP_VERSION} focusId={route.focusId} active={route.surface === 'evidence'} /></Suspense></SurfaceBoundary></div>}
      {route.surface === 'tools' && <SurfaceBoundary label="Calculators"><Suspense fallback={<p role="status">Loading calculators…</p>}><Tools state={state} update={update} tool={route.tool} version={APP_VERSION} /></Suspense></SurfaceBoundary>}
      {route.surface === 'retired' && <section className="retirement-message"><h1>Retired destination</h1><p>This route is no longer maintained in the lean Stroke workspace.</p><p><a href="#/encounter">Return to Encounter</a> · <a href="#/tools">Calculators</a></p></section>}
    </main>
  </div>;
}
bootstrapTheme();
createRoot(document.getElementById('root')).render(<App />);
