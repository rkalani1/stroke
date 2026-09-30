/** Page-local consent and once-only reload for service-worker updates. */
const listeners = new Set();
let bound = false;
let updateAccepted = false;
let reloading = false;

export function onUpdateReady(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(payload) {
  for (const cb of listeners) {
    try { cb(payload); } catch (_) { /* One listener must not suppress another. */ }
  }
}

function reloadIfAccepted() {
  if (!updateAccepted || reloading) return;
  reloading = true;
  window.location.reload();
}

export function bindSWController() {
  if (bound || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  bound = true;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Another window or an older worker must not interrupt this page.
    if (updateAccepted) reloadIfAccepted();
    else if (navigator.serviceWorker.controller) notify({});
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'sw-update-ready') {
      if (data.blocked) updateAccepted = false;
      notify({ version: data.version, message: data.message, blocked: !!data.blocked });
    }
    if (data.type === 'sw-claimed-reload') reloadIfAccepted();
  });
}

/* Called only by the visible Reload action; a blocked request can be retried. */
export async function acceptUpdate(worker) {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  bindSWController();
  const reg = await navigator.serviceWorker.getRegistration();
  // Resolve the current waiting worker first; a saved reference may be stale.
  const target = reg?.waiting || worker || reg?.active;
  if (!target) return;
  updateAccepted = true;
  try {
    target.postMessage({ type: 'CLAIM_AND_RELOAD' });
  } catch (error) {
    updateAccepted = false;
    throw error;
  }
}
