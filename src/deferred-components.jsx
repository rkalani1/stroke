import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createDeferredResource } from './deferred-resource.js';
import { referenceResource, resolveCompletedTrials } from './reference-loader.js';

export function useDeferredResource(resource, enabled = false) {
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getSnapshot);
  useEffect(() => {
    if (enabled && resource.getSnapshot().status === 'idle') resource.load().catch(() => {});
  }, [resource, enabled]);
  return state;
}

export function deferredRecoveryHref(label, location = globalThis.location) {
  if (!location) return '#/research/references';
  const url = new URL(location.href);
  const routes = {
    'Background evidence': '#/research/references',
    'Reference search': '#/research/guidelines',
    'EVD reference': '#/research/education/evd-maintenance',
    'ICP reference': '#/research/education/herniation-icp'
  };
  if (routes[label]) url.hash = routes[label];
  return url.href;
}

export function DeferredLoadStatus({ resource, label = 'References', className = '' }) {
  const state = useDeferredResource(resource);
  if (state.status === 'ready') return null;
  return <div className={`rounded-md border border-line bg-card p-3 text-sm text-ink-2 ${className}`} role="status" aria-live="polite">
    {state.status === 'error' ? <>
      <p>{label} could not be loaded. Reconnect if needed, then open it in a new tab. Your encounter remains open here. This action does not copy your encounter inputs to the new tab.</p>
      {/* A failed native import is cached in the document's module map,
          including failed dependencies. A fresh browsing context retries the
          complete graph without reloading or serializing the current case. */}
      <a href={deferredRecoveryHref(label)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-[44px] items-center rounded border border-line px-3 py-2 font-semibold text-ink">Open in new tab</a>
    </> : <p>Loading {label.toLowerCase()}…</p>}
  </div>;
}

const educationResource = createDeferredResource(() => import('./education.jsx'));
const trialResource = createDeferredResource(() => import('./components/TrialScreener.jsx'));
const eligibilityResource = createDeferredResource(() => import('./components/EligibilityTables.jsx'));
const teachingResource = createDeferredResource(() => import('./teaching.jsx'));
function deferredExport(resource, name, label) {
  return function DeferredComponent(props) {
    const state = useDeferredResource(resource, true);
    if (state.status !== 'ready') return <DeferredLoadStatus resource={resource} label={label} />;
    const Component = state.value[name];
    return <Component {...props} />;
  };
}
export const Education = deferredExport(educationResource, 'default', 'Education');
export const EVDInfographic = deferredExport(educationResource, 'EVDInfographic', 'EVD reference');
export const ICPInfographic = deferredExport(educationResource, 'ICPInfographic', 'ICP reference');
export const TrialScreener = deferredExport(trialResource, 'TrialScreener', 'Trial screener');
export const StudyDatabase = deferredExport(trialResource, 'StudyDatabase', 'Study database');
export const EligibilityTables = deferredExport(eligibilityResource, 'EligibilityTables', 'Eligibility tables');
export const LandmarkTrialsCard = deferredExport(teachingResource, 'LandmarkTrialsCard', 'Landmark trials');

// The Encounter matcher only needs active-trial criteria. Completed-trial
// detail records are requested when their background-evidence drawer opens.
export function DeferredCompletedEvidence({ ids = [], children }) {
  const [open, setOpen] = useState(false);
  const state = useDeferredResource(referenceResource, open);
  if (!ids.length) return null;
  const related = state.status === 'ready' ? resolveCompletedTrials(ids) : [];
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="mt-2 border border-cobalt-200 bg-slate-50 rounded dark:border-cobalt-700 dark:bg-paper-2">
    <summary className="cursor-pointer px-2.5 py-1.5 text-xs font-semibold text-cobalt-900 hover:bg-slate-100 rounded flex items-center gap-2 dark:text-cobalt-300 dark:hover:bg-paper-2">
      Background evidence ({state.status === 'ready' ? related.length : ids.length})
      <span className="ml-auto text-[11px] font-normal text-slate-500 italic dark:text-mute">Evidence Library reference</span>
    </summary>
    {open && (state.status === 'ready' ? children(related) : <DeferredLoadStatus resource={referenceResource} label="Background evidence" />)}
  </details>;
}
