/* Service-worker updates are opt-in.
   Installation precaches the new shell and leaves the worker waiting. A user
   must choose Reload to update before it may activate. If another in-scope
   window is open, activation is deferred until that window closes; legacy
   clients otherwise reload on controllerchange and can lose an active form.
   Old app caches are retired only on activation. Fetch policy is independent.
*/

const APP_VERSION = '7.6.2';
const CACHE_PREFIX = 'stroke-cache-v';
const CACHE_NAME  = 'stroke-cache-v7-6-2-utility-review-20261001';

// Retired teaching figures must not be served from a stale browser cache or
// a bookmarked URL after this worker takes control. Paths are scope-relative
// suffixes so both the local root and GitHub Pages /stroke/ deployment work.
const WITHDRAWN_ASSETS = [
  '/assets/afib_timing_protocol.png',
  '/assets/afib_timing_protocol.svg',
  '/assets/select_score_chart.png',
  '/assets/select_score_chart.svg',
  '/assets/toast_classification_infographic.png',
  '/assets/toast_classification_infographic.svg',
  '/assets/hematoma_expansion_render.png',
  '/assets/hematoma_expansion_render.svg',
  '/assets/ischemic_core_penumbra_render.png',
  '/assets/ischemic_core_penumbra_render.svg',
  '/assets/evt_lvo_occlusion_sites.png',
  '/assets/evt_lvo_occlusion_sites.svg',
  '/assets/fmd_stroke_mechanisms.png',
  '/assets/dapt_flowchart_timeline.png',
  '/assets/dapt_flowchart_timeline.svg',
  '/assets/aspects_10_regions_render.png',
  '/assets/aspects_10_regions_render.svg',
  '/documents/references/External Ventricular Drain.pdf',
  '/documents/references/Intracranial Hypertension & Herniation.pdf',
  '/documents/exam/coma exam.pdf',
  '/documents/antiplatelet/DAPT After Ischemic Stroke-TIA.jpeg'
];

const RETIRED_PREFIXES = ['documents/', 'content/', 'src/', 'output/'];
const isRetiredPath = url => {
  const base = new URL(self.registration.scope);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return false;
  let relative; try { relative = decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return false; }
  return (relative.startsWith('assets/') && !relative.startsWith('assets/fonts/') && !relative.startsWith('assets/splash/')) || RETIRED_PREFIXES.some(prefix => relative.startsWith(prefix)) || WITHDRAWN_ASSETS.some(path => relative === path.slice(1));
};

const CORE_ASSETS = [
  // Install-time complete retained shell/module graph. Agent-only data is
  // not requested by the core. Teaching assets are explicitly retired.
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app.js',
  './tailwind.css',
  './offline.html',
  './data/clinical-reference.json',
  './assets/fonts/bricolage-400.woff2',
  './assets/fonts/bricolage-500.woff2',
  './assets/fonts/bricolage-600.woff2',
  './assets/fonts/bricolage-700.woff2',
  './assets/fonts/bricolage-800.woff2',
  './assets/fonts/ibmplexmono-400.woff2',
  './assets/fonts/ibmplexmono-500.woff2',
  './assets/fonts/ibmplexmono-600.woff2',
  './assets/fonts/publicsans-italic-400.woff2',
  './assets/fonts/publicsans-italic-500.woff2',
  './assets/fonts/publicsans-italic-600.woff2',
  './assets/fonts/publicsans-normal-400.woff2',
  './assets/fonts/publicsans-normal-500.woff2',
  './assets/fonts/publicsans-normal-600.woff2',
  './assets/fonts/publicsans-normal-700.woff2',
  './assets/splash/splash-ipad-mini.png',
  './assets/splash/splash-ipad-pro-11.png',
  './assets/splash/splash-ipad-pro-129.png',
  './assets/splash/splash-iphone-13-mini-12-mini-x-xs.png',
  './assets/splash/splash-iphone-15-14-13-12.png',
  './assets/splash/splash-iphone-15-plus.png',
  './assets/splash/splash-iphone-16-pro-max.png',
  './assets/splash/splash-iphone-16-pro.png',
  './assets/splash/splash-iphone-16.png',
  './assets/splash/splash-iphone-8-7-6.png'
];

const CDN_ASSETS = [];

// The build writes content-addressed modules here. Installation must cache
// ALL of them before the worker is installed/offline-ready. Downloading does
// not execute deferred protocols, trials, calculators or reference modules.
// BEGIN GENERATED APP CHUNKS
const APP_CHUNKS = [
  "./chunks/chunk-7QVMV5MZ.js",
  "./chunks/chunk-CCC5QWPU.js",
  "./chunks/chunk-DVCKIJPQ.js",
  "./chunks/chunk-LMVOO26A.js",
  "./chunks/chunk-MEDXAGMH.js",
  "./chunks/chunk-XGILGY2J.js",
  "./chunks/InstallAppButton-INPP7ERU.js",
  "./chunks/ProtectedProtocols-I4A3S537.js",
  "./chunks/Reference-KSCFXNXY.js",
  "./chunks/Tools-DF4ZVOMR.js",
  "./chunks/Trials-LLFZIS7F.js"
];
// END GENERATED APP CHUNKS

// BEGIN GENERATED REFERENCE VALIDATION
var ReferenceValidation=(()=>{var m=Object.defineProperty;var o=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var c=Object.prototype.hasOwnProperty;var f=(s,i)=>{for(var t in i)m(s,t,{get:i[t],enumerable:!0})},b=(s,i,t,y)=>{if(i&&typeof i=="object"||typeof i=="function")for(let u of $(i))!c.call(s,u)&&u!==t&&m(s,u,{get:()=>i[u],enumerable:!(y=o(i,u))||y.enumerable});return s};var v=s=>b(m({},"__esModule",{value:!0}),s);var x={};f(x,{validReferenceData:()=>g});var n=s=>typeof s=="string"&&s.trim().length>0,p=s=>Array.isArray(s)&&s.every(n),r=s=>n(s)&&/^[a-z0-9-]+$/.test(s),h=s=>typeof s=="string"&&/^https:\/\/[^\s]+$/.test(s);function w(s){return Array.isArray(s)&&s.length>0&&new Set(s.map(i=>i==null?void 0:i.id)).size===s.length&&s.every(i=>i&&r(i.id)&&["name","category","limits","sourceLabel","reviewScope"].every(t=>n(i[t]))&&h(i.sourceUrl)&&(!i.verificationUrl||h(i.verificationUrl))&&Array.isArray(i.fields)&&i.fields.every(t=>t&&n(t.key)&&n(t.label)&&["truth","select","number"].includes(t.type)&&(t.type!=="select"?t.options===void 0:Array.isArray(t.options)&&t.options.length>0&&t.options.every(y=>Array.isArray(y)&&y.length===2&&y.every(n))))&&(!i.shared||Array.isArray(i.shared)&&i.shared.every(t=>["age","sex","bp","mrs","gcs","weight","height","mtici","sahCause"].includes(t)))&&(!i.regions||Array.isArray(i.regions)&&i.regions.every(t=>t&&n(t.key)&&n(t.label)&&[1,2].includes(t.weight))))}function g(s,i){var y,u;let t=s==null?void 0:s.data;return((y=s==null?void 0:s._meta)==null?void 0:y.appVersion)===i&&((u=s==null?void 0:s._meta)==null?void 0:u.schemaVersion)==="2.0.0"&&w(t==null?void 0:t.calculators)&&["topics","studies"].every(l=>Array.isArray(t==null?void 0:t[l])&&t[l].length>0&&new Set(t[l].map(e=>e==null?void 0:e.id)).size===t[l].length&&t[l].every(e=>e&&r(e.id)&&n(e.title)&&p(e.keywords)&&p(e.settings)&&e.settings.length&&e.settings.every(a=>["on-call","hospital","clinic"].includes(a))&&Array.isArray(e.sources)&&e.sources.length&&e.sources.every(a=>a&&["title","type","checkedAt","access"].every(A=>n(a[A]))&&Number.isInteger(a.year)&&typeof a.url=="string"&&/^https:\/\/[^\s]+$/.test(a.url))&&(l==="topics"?n(e.category)&&["summary","caution"].every(a=>n(e[a]))&&p(e.consider)&&e.consider.length&&Array.isArray(e.related)&&e.related.every(a=>n(a.label)&&/^#\/(?:encounter|tools|protocols|evidence|trials)(?:\/[a-z0-9-]+){0,2}$/.test(a.href)):["question","population","comparison","result","limits"].every(a=>n(e[a]))&&Number.isInteger(e.year)&&(e.relatedTopic===""||r(e.relatedTopic)))))&&t.studies.every(l=>!t.topics.some(e=>e.id===l.id))&&t.studies.every(l=>l.relatedTopic===""||t.topics.some(e=>e.id===l.relatedTopic))}return v(x);})();
// END GENERATED REFERENCE VALIDATION
const validReferenceEnvelope = reference => ReferenceValidation.validReferenceData(reference, APP_VERSION);

async function purgeWithdrawnCacheEntries() {
  // A waiting worker does not control requests yet. Remove only retired files
  // from this app's caches so the previous worker cannot serve those entries.
  // Scope and origin checks preserve other deployments and foreign resources.
  const retiredPaths = new Set(WITHDRAWN_ASSETS.map(suffix =>
    decodeURIComponent(new URL(`.${suffix}`, self.registration.scope).pathname)
  ));
  const names = (await caches.keys()).filter(name => name.startsWith(CACHE_PREFIX));
  for (const name of names) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    await Promise.all(requests.map(request => {
      let url;
      let pathname;
      try {
        url = new URL(request.url);
        pathname = decodeURIComponent(url.pathname);
      } catch (_) { return; }
      if (url.origin === self.location.origin && (retiredPaths.has(pathname) || isRetiredPath(url))) return cache.delete(request);
    }));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A recently visited deployment can still be fresh in the HTTP cache.
    // Stage this deployment from the network, not those previous shell bytes.
    await cache.addAll([...CORE_ASSETS, ...APP_CHUNKS].map(asset =>
      new Request(new URL(asset, self.registration.scope), { cache: 'reload' })
    ));
    const referenceResponse = await cache.match(new URL('./data/clinical-reference.json', self.registration.scope).href);
    const reference = await referenceResponse?.json();
    if (!validReferenceEnvelope(reference)) {
      throw new Error('Reference cache version or content mismatch');
    }
    await Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
    // Only a fully staged upgrade withdraws old clinical downloads.
    await purgeWithdrawnCacheEntries();
  })());
  // Do not skip waiting here: activation replaces existing controllers even
  // without clients.claim(), and older clients reload on controllerchange.
});

// A waiting worker cannot claim clients until it has activated. These IDs
// remain in memory across that transition; an already active worker may also
// receive a retry and acknowledges only the window that requested it.
const reloadRequests = new Set();

async function claimAndRequestReload() {
  await self.clients.claim();
  const ids = [...reloadRequests];
  reloadRequests.clear();
  for (const id of ids) {
    const client = await self.clients.get(id);
    if (client) client.postMessage({ type: 'sw-claimed-reload', version: APP_VERSION });
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith(CACHE_PREFIX)).map(k => caches.delete(k)));
    // First install (or automatic activation after all old tabs close) is
    // silent. Only a pending explicit request can claim/reload a window.
    if (reloadRequests.size) await claimAndRequestReload();
  })());
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'CLAIM_AND_RELOAD' || event.data.type === 'SKIP_WAITING') {
    event.waitUntil((async () => {
      const requester = event.source;
      if (!requester || !requester.id) return;
      const windows = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
        .filter(client => client.url.startsWith(self.registration.scope));
      if (!windows.some(client => client.id === requester.id)) return;
      if (windows.some(client => client.id !== requester.id)) {
        requester.postMessage({
          type: 'sw-update-ready',
          // 6.29.2 reads only version, so retain usable migration guidance.
          version: `${APP_VERSION} (close other Stroke tabs, then choose Reload again)`,
          blocked: true,
          message: 'Close other Stroke tabs, then choose Reload to update again. This encounter has not been reloaded.'
        });
        return;
      }
      reloadRequests.add(requester.id);
      await self.skipWaiting();
      try {
        await claimAndRequestReload();
      } catch (error) {
        // skipWaiting resolves before activation. The activate handler above
        // finishes this request once claim() is legal; other failures surface.
        if (error.name !== 'InvalidStateError') throw error;
      }
    })());
  }
});

const isHtmlRequest = (request, url) => {
  // Opening a PDF or image in a new tab is also a navigation. Only app/HTML
  // routes may fall back to the app shell when the network is unavailable.
  if (/\.[^/]+$/.test(url.pathname) && !/\.html?$/i.test(url.pathname)) return false;
  if (request.mode === 'navigate') return true;
  return (request.headers.get('accept') || '').includes('text/html');
};

const isShellAsset = (url) =>
  url.pathname.endsWith('/app.js') ||
  url.pathname.endsWith('/tailwind.css') ||
  url.pathname.endsWith('/manifest.json') ||
  /\.pdf$/i.test(url.pathname);

const isVersionedShell = url => {
  const root = new URL('./', self.registration.scope);
  if (url.origin !== root.origin) return false;
  if (url.pathname === root.pathname || url.pathname === new URL('index.html', root).pathname) return true;
  return ['app.js', 'tailwind.css', 'manifest.json', 'data/clinical-reference.json', ...APP_CHUNKS.map(asset => asset.replace(/^\.\//, ''))]
    .some(asset => url.pathname === new URL(asset, root).pathname);
};

const offlineUnavailable = () => new Response(
  'This resource is not available offline. Reconnect and open the current workspace.',
  { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
);

async function persistResponse(request, response) {
  if (!response.ok) return;
  try {
    const url = new URL(request.url);
    const root = new URL('./', self.registration.scope);
    const index = new URL('./index.html', self.registration.scope);
    // A missing reference cache may reach a partially deployed or newer server.
    // Leave invalid responses uncached so the UI can retry a corrected download.
    if (url.origin === root.origin && url.pathname === new URL('data/clinical-reference.json', root).pathname &&
        !validReferenceEnvelope(await response.clone().json())) return;
    const cache = await caches.open(CACHE_NAME);
    const keys = new Set([request.url]);
    // Root and index are two names for the same app document. Keep both fresh
    // after an online navigation; unrelated HTML must not replace the shell.
    if (url.origin === root.origin &&
        (url.pathname === root.pathname || url.pathname === index.pathname) &&
        (response.headers.get('content-type') || '').includes('text/html')) {
      keys.add(root.href);
      keys.add(index.href);
    }
    const writes = await Promise.allSettled([...keys].map(key => cache.put(key, response.clone())));
    if (writes.some(write => write.status === 'rejected')) throw new Error('Offline cache write failed');
  } catch (_) {
    // Quota/private-mode failures must not discard a good network response.
    console.warn?.('Stroke offline cache could not be updated.');
  }
}

async function matchCurrentCache(request, url, navigation = false) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const exact = await cache.match(request);
    if (exact) return exact;
    if (navigation) {
      for (const asset of ['./index.html', './', './offline.html']) {
        const cached = await cache.match(new URL(asset, self.registration.scope).href);
        if (cached) return cached;
      }
    } else if (url.search &&
        ['app.js', 'tailwind.css', 'manifest.json', 'data/clinical-reference.json'].some(asset =>
          url.href.split('?')[0] === new URL(asset, self.registration.scope).href)) {
      // Only these intentionally precached shell files have a canonical alias.
      // Do not select an arbitrary query variant or erase PDF query identity.
      const canonical = new URL(url);
      canonical.search = '';
      return await cache.match(canonical.href);
    }
  } catch (_) { /* No working current cache: return the bounded fallback. */ }
  return undefined;
}

async function networkFirst(request, url) {
  let response;
  try {
    response = await fetch(request, { cache: 'no-cache' });
  } catch (_) {
    return await matchCurrentCache(request, url,
      request.mode === 'navigate' && isHtmlRequest(request, url)) || offlineUnavailable();
  }
  // Await persistence within respondWith's lifetime, without allowing storage
  // failure to turn a successful network response into a stale fallback.
  await persistResponse(request, response);
  return response;
}

async function cacheFirst(request, url) {
  const cached = await matchCurrentCache(request, url,
    request.mode === 'navigate' && isHtmlRequest(request, url));
  if (cached) return cached;
  let response;
  try {
    response = await fetch(request, url.origin === self.location.origin
      ? { cache: 'no-cache' } : undefined);
  } catch (_) { return offlineUnavailable(); }
  await persistResponse(request, response);
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    let pathname = url.pathname;
    try { pathname = decodeURIComponent(pathname); } catch { /* malformed paths are left to the server */ }
    if (isRetiredPath(url)) {
      event.respondWith(Promise.resolve(new Response(
        'This teaching resource has been withdrawn. Open the current Encounter workspace.',
        { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
      )));
      return;
    }
    // Keep a controlled document, entry and chunks on one installed release.
    // A waiting update must never replace the running module graph before the
    // user chooses Reload. PDF freshness remains network-first.
    if (isVersionedShell(url)) {
      event.respondWith(cacheFirst(event.request, url));
      return;
    }
    if (isHtmlRequest(event.request, url) || isShellAsset(url)) {
      event.respondWith(networkFirst(event.request, url));
      return;
    }
    event.respondWith(cacheFirst(event.request, url));
    return;
  }

  // CDN assets — cache-first, scoped to this deployment's cache.
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(event.request, url));
  }
});
