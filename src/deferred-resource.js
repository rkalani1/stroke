// One request per module, stable snapshots for React, and an explicit retry
// after a failed download. Merely importing this helper never starts a load.
export function createDeferredResource(importModule) {
  let snapshot = { status: 'idle', value: null, error: null };
  let pending = null;
  const listeners = new Set();
  const publish = next => {
    snapshot = next;
    for (const listener of [...listeners]) listener();
  };
  const load = () => {
    if (snapshot.status === 'ready') return Promise.resolve(snapshot.value);
    if (pending) return pending;
    // Assign the promise before publishing so a subscriber can safely ask for
    // the same load during its notification without issuing a second import.
    pending = Promise.resolve().then(importModule).then(value => {
      pending = null;
      publish({ status: 'ready', value, error: null });
      return value;
    }, error => {
      pending = null;
      publish({ status: 'error', value: null, error });
      throw error;
    });
    publish({ status: 'loading', value: null, error: null });
    return pending;
  };
  return {
    load,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}
