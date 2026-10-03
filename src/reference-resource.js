import { useEffect, useState } from 'react';
import { validReferenceData } from './reference-search.js';

let cached;
function loadReference(version) {
  if (!cached || cached.version !== version) {
    const entry = { version };
    // Versioned URL: without a controlling service worker, a post-deploy reload must not reuse the
    // previous release's HTTP-cached JSON (the service worker maps the query to its precached copy).
    entry.promise = fetch(`./data/clinical-reference.json?v=${encodeURIComponent(version)}`).then(async response => {
      if (!response.ok) throw Error('Reference download unavailable');
      const envelope = await response.json();
      if (!validReferenceData(envelope, version)) throw Error('Reference version or content mismatch');
      return envelope.data;
    }).catch(error => { if (cached === entry) cached = null; throw error; });
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
