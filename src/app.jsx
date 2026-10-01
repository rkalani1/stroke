import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Encounter from './Encounter.jsx';
import { BUILD_PUBLIC_DEMO, BUILD_TARGET_MARKER } from './build-flags.js';
import { newEncounter, updateEncounter, encounterVolume, protocolVolumeEstimate, protocolEncounter, nihssAssessment, encounterTiming, copySummary } from './workspace-state.js';
import { parseWorkspaceRoute } from './workspace-routing.js';
import { bootstrapTheme, getThemePref, setThemePref } from './design/theme.js';
import { bindSWController, onUpdateReady, acceptUpdate } from './design/sw-controller.js';
import { InstallAppButton } from './components/InstallAppButton.jsx';
import sources from './clinical/workspace-sources.json';
import claims from './clinical/claims.json';
const ProtectedProtocols = lazy(() => import('./ProtectedProtocols.jsx'));
const APP_VERSION = '7.0.0';
const getPublicDemoMode = () => {
  if (BUILD_PUBLIC_DEMO) return true;
  return /(^|\.)github\.io$/i.test(window.location.hostname || '');
};
const PUBLIC_DEMO_MODE = getPublicDemoMode();
const MAP_URL = 'https://rkalani1.github.io/telestroke-expansion-map/';
class ProtocolBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <section role="alert"><h1>Protocols unavailable</h1><p>The protocol download failed. Your Encounter entries remain in this session. Return to Encounter, or explicitly reload when connected to retry; reloading clears the session.</p><a href="#/encounter">Return to Encounter</a><button type="button" onClick={() => { if (window.confirm('Reload to retry the protocol download? Current synthetic encounter entries will be cleared.')) location.reload(); }}>Reload to retry</button></section> : this.props.children;
  }
}
function Tools() {
  return <section className="tools-surface"><h1>Tools & sources</h1><p>Retained calculations are embedded in Encounter. External destinations require internet and open only when selected; encounter values are never included in their links.</p><ul className="tool-links">{[['nihss', 'NIHSS'], ['crcl', 'Renal calculation'], ['tnk', 'Lytic dose'], ['ich-volume', 'ICH volume'], ['ich-score', 'ICH severity'], ['gcs', 'GCS'], ['dawn', 'Historical source screens'], ['dapt', 'Acute DAPT source screen']].map(([id, label]) => <li key={id}><a href={`#/encounter/${id}`}>{label}</a></li>)}</ul><h2>External references</h2><ul><li><a href={MAP_URL} target="_blank" rel="noopener noreferrer">Telestroke Map</a></li><li><a href="https://www.uptodate.com/" target="_blank" rel="noopener noreferrer">UpToDate</a></li><li><a href="https://www.openevidence.com/" target="_blank" rel="noopener noreferrer">OpenEvidence</a></li></ul><h2>Retained primary sources</h2><ul className="source-list">{[...claims.map(c => ({ id: c.id, label: c.sourceLabel, url: c.sourceUrl, limits: c.limits, reviewedAt: c.reviewedAt, reviewScope: c.reviewScope })), ...sources].map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a><p>{source.limits}</p><details><summary>Review status</summary><p>{source.reviewScope} {source.reviewedAt ? `Recorded review: ${source.reviewedAt}.` : 'Clinical review date not recorded.'}</p></details></li>)}</ul><p className="workspace-help">The general Education, Trials, Guidelines and References portal is retired. Historical content is preserved at the archival Git ref; it is not presented as current clinical guidance.</p></section>;
}
function App() {
  const [state, setState] = useState(newEncounter);
  const stateRef = useRef(state); stateRef.current = state;
  const [route, setRoute] = useState(() => parseWorkspaceRoute(location.hash));
  const [protocolVisited, setProtocolVisited] = useState(route.surface === 'protocols');
  const [epoch, setEpoch] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [theme, setTheme] = useState(getThemePref);
  const [copyStatus, setCopyStatus] = useState('');
  const [updateReady, setUpdateReady] = useState(null);
  const [offlineStatus, setOfflineStatus] = useState('Offline cache not yet verified');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setInstalled] = useState(() => Boolean(navigator.standalone || matchMedia('(display-mode: standalone)').matches));
  const update = updater => { setState(prev => updateEncounter(prev, updater)); setCopyStatus(''); };
  useEffect(() => {
    if (!location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/encounter`);
    const changed = () => { const next = parseWorkspaceRoute(location.hash); setRoute(next); if (next.surface === 'protocols') setProtocolVisited(true); };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (!route.tool || route.surface !== 'encounter') return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`calc-${route.tool}`);
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
    const resume = () => setNow(Date.now());
    const timer = setInterval(resume, 1000);
    document.addEventListener('visibilitychange', resume); window.addEventListener('pageshow', resume);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', resume); };
  }, []);
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
    if (!window.confirm('Start a new synthetic encounter? All current entries, drafts and timers will be cleared.')) return;
    setState(newEncounter()); setEpoch(v => v + 1); setCopyStatus(''); location.hash = '#/encounter';
  };
  const copy = async text => {
    const result = await copySummary(stateRef, text, value => navigator.clipboard.writeText(value));
    if (result === 'copied') setCopyStatus('Summary copied.');
    if (result === 'denied') { setCopyStatus('Clipboard unavailable. Select the read-only summary and copy it manually.'); document.querySelector('[aria-label="Generated synthetic summary"]')?.select(); }
  };
  const timing = encounterTiming(state.note, now);
  const volume = encounterVolume(state.volume);
  const sharedProtocol = { ...protocolEncounter(state, now), onChange: (key, value) => update(prev => {
    if (key === 'aspectsScore' || key === 'pcAspects' || key === 'massEffect') return { ...prev, [key === 'aspectsScore' ? 'aspects' : key === 'massEffect' ? 'evtMassEffect' : key]: value };
    if (key === 'bpSystolic' || key === 'bpDiastolic') {
      const parts = prev.note.presentingBP.split('/');
      parts[key === 'bpSystolic' ? 0 : 1] = value;
      return { ...prev, note: { ...prev.note, presentingBP: `${parts[0] || ''}/${parts[1] || ''}` } };
    }
    const noteKey = { preMRS: 'premorbidMRS', wakeUpOrUnknownOnset: 'lkwUnknown', ichOnCT: 'ctHemorrhageStatus' }[key] || key;
    const noteValue = key === 'ichOnCT' ? value === null ? '' : value ? 'present' : 'absent' : value;
    return { ...prev, note: { ...prev.note, [noteKey]: noteValue } };
  }) };
  const targetUnavailable = route.tool && !['nihss', 'mrs', 'crcl'].includes(route.tool) && (['ich-volume', 'ich-score', 'gcs'].includes(route.tool) ? !(['ich-volume', 'ich-score'].includes(route.tool) ? state.note.diagnosisCategory === 'ich' : ['ich','sah','cvt'].includes(state.note.diagnosisCategory)) : !(state.context === 'acute' && (state.note.diagnosisCategory === 'ischemic' || route.tool === 'dapt' && state.note.diagnosisCategory === 'tia')));
  return <div className="app-shell workspace-shell" data-build={BUILD_TARGET_MARKER} data-demo={PUBLIC_DEMO_MODE ? 'synthetic' : 'private'} data-version={APP_VERSION}>
    <a className="workspace-skip" href="#workspace-main">Skip to content</a>
    <header className="workspace-header"><a className="workspace-brand" href="#/encounter">Stroke</a><div className="workspace-secondary"><a href="#/protocols/ischemic">Protocols</a><a href="#/tools">Tools & sources</a><details className="workspace-utilities"><summary aria-label="Utilities">More</summary><div className="utility-panel"><label>Theme<select aria-label="Theme" value={theme} onChange={e => { setThemePref(e.target.value); setTheme(e.target.value); }}>{[['auto', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label><InstallAppButton installPrompt={installPrompt} isInstalled={isInstalled} onInstall={async () => { if (!installPrompt) return; try { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setInstalled(true); setInstallPrompt(null); } catch { setInstallPrompt(null); } }} /><p>Version {APP_VERSION}</p><p role="status">{offlineStatus}</p><button type="button" onClick={reset}>New encounter</button></div></details></div></header>
    {updateReady && <aside className="workspace-update" aria-label="App update"><p>{updateReady.message || 'A new version is ready. Updating reloads this page and clears its session; finish or copy your synthetic summary first.'}</p><button type="button" onClick={() => acceptUpdate().catch(() => setUpdateReady({ message: 'Update failed. Current encounter remains open; try again when connected.' }))}>Reload to update</button><button type="button" onClick={() => setUpdateReady(null)}>Later</button></aside>}
    <main id="workspace-main" tabIndex={-1}>
      <div hidden={route.surface !== 'encounter'}>{targetUnavailable && <p role="status" className="workspace-result">This tool is inactive in the current context. Select the applicable working diagnosis/context in Encounter; retained values have not been cleared.</p>}<Encounter state={state} update={update} now={now} copyStatus={copyStatus} onCopy={copy} onGenerate={text => { setState(prev => ({ ...prev, draft: { text, revision: prev.revision, stale: false } })); setCopyStatus(''); }} /></div>
      {protocolVisited && <div hidden={route.surface !== 'protocols'}><p className="workspace-help">Interactive protocol cards share Encounter measurements. Changing a source value clears their independent checks and attestations; navigation and elapsed-time updates preserve them. Completed NIHSS and elapsed hours are derived from Encounter. Ischemic-specific inputs are unavailable outside an acute ischemic context.</p>{sharedProtocol.safetyReviewRequired && <p role="status" className="workspace-result">Encounter records a contraindication, relative risk or contradictory finding requiring clinician review. A protocol-card acknowledgement does not resolve it; reconcile the visible Encounter concerns before an affirmative IVT result.</p>}<ProtocolBoundary key={epoch}><Suspense fallback={<p role="status">Loading retained protocols…</p>}><ProtectedProtocols encounter={sharedProtocol} key={epoch} active={route.surface === 'protocols'} telestrokeNote={state.note} setTelestrokeNote={change => update(prev => ({ ...prev, note: typeof change === 'function' ? change(prev.note) : change }))} nihssScore={nihssAssessment(state.nihss).total ?? 0} consultationType={state.consultationType === 'phone' ? 'telephone' : 'video'} pocketCardsCaseEpoch={epoch} managementSubTab={route.sub || 'ischemic'} setManagementSubTab={sub => { location.hash = `#/protocols/${sub}`; }} navigateTo={tab => { location.hash = tab === 'encounter' ? '#/encounter' : '#/tools'; }} timeFromLKW={timing.clock ? { total: timing.hours, label: timing.label } : null} ichVolumeParams={state.volume} setIchVolumeParams={change => update(prev => ({ ...prev, volume: typeof change === 'function' ? change(prev.volume) : change }))} ichVolumeEstimate={protocolVolumeEstimate(volume)} /></Suspense></ProtocolBoundary></div>}
      {route.surface === 'tools' && <Tools />}
      {route.surface === 'retired' && <section className="retirement-message"><h1>Retired destination</h1><p>This route is no longer maintained in the lean Stroke workspace.</p><p><a href="#/encounter">Return to Encounter</a> · <a href="#/tools">Tools & sources</a></p></section>}
    </main>
  </div>;
}
bootstrapTheme();
createRoot(document.getElementById('root')).render(<App />);
