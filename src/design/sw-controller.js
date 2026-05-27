/**
 * v7.0 — Page-side service-worker controller.
 * Drop-in: src/design/sw-controller.js
 *
 * Listens for {type:'sw-update-ready', version} broadcasts from the SW.
 * Exposes a single callback `onUpdateReady(cb)` so the app's Toast layer
 * can show a non-blocking "New version ready" toast. Tapping the toast
 * triggers postMessage({type:'CLAIM_AND_RELOAD'}) which causes the SW to
 * claim, then we soft-reload the page.
 *
 * Why opt-in: spec §2 amendment #2. Clinicians mid-consult must not be
 * auto-interrupted.
 */

let listeners = new Set();

export function onUpdateReady(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(payload) {
  for (const cb of listeners) {
    try { cb(payload); } catch (e) { /* swallow listener errors */ }
  }
}

let bound = false;
export function bindSWController() {
  if (bound || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  bound = true;
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'sw-update-ready') {
      notify({ version: data.version });
    }
    if (data.type === 'sw-claimed-reload') {
      // Soft reload — keeps URL hash so the user stays on the same view
      window.location.reload();
    }
  });
}

/* Called when the user taps "Reload" on the toast. */
export async function acceptUpdate() {
  if (!navigator.serviceWorker) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const target = reg?.waiting || reg?.active;
  if (!target) return;
  target.postMessage({ type: 'CLAIM_AND_RELOAD' });
}
