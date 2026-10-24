import { useEffect, useState } from 'react';
import { validReferenceData } from './reference-search.js';

let cached;
const REFERENCE = './data/clinical-reference.json';
// A tab the worker does not control (first visit, hard reload) cannot reach it offline, but the
// worker's precache is readable from the page: use a copy that validates for this version.
async function precachedReference(version) {
  for (const key of await caches.keys()) {
    const envelope = await (await caches.open(key)).match(REFERENCE).then(response => response?.json()).catch(() => null);
    if (validReferenceData(envelope, version)) return envelope.data;
  }
}
function loadReference(version) {
  if (!cached || cached.version !== version) {
    const entry = { version };
    // Versioned URL: without a controlling service worker, a post-deploy reload must not reuse the
    // previous release's HTTP-cached JSON (the service worker maps the query to its precached copy).
    entry.promise = fetch(`${REFERENCE}?v=${encodeURIComponent(version)}`).then(async response => {
      if (!response.ok) throw Error('Reference download unavailable');
      const envelope = await response.json();
      if (!validReferenceData(envelope, version)) throw Error('Reference version or content mismatch');
      return envelope.data;
    }).catch(async error => {
      const data = await precachedReference(version).catch(() => null);
      if (data) return data;
      if (cached === entry) cached = null; throw error;
    });
    cached = entry;
  }
  return cached.promise;
}

// Evidence and calculator presentation share one versioned offline resource.
// Clinical inputs remain in the owning Encounter, outside this static cache.
export function useReferenceData(version) {
  const [data, setData] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true; setFailed(false); setData(null);
    loadReference(version).then(value => { if (current) setData(value); }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [version, attempt]);
  return { data, failed, retry: () => setAttempt(value => value + 1) };
}
