/* Service-worker updates are opt-in.
   Installation precaches the new shell and leaves the worker waiting. A user
   must choose Reload to update before it may activate. If another in-scope
   window is open, activation is deferred until that window closes; legacy
   clients otherwise reload on controllerchange and can lose an active form.
   Old app caches are retired only on activation. Fetch policy is independent.
*/

const APP_VERSION = '7.7.0';
const CACHE_PREFIX = 'stroke-cache-v';
const CACHE_NAME  = 'stroke-cache-v7-7-0-utility-review-20261001';

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
  "./chunks/chunk-33K2AV7Q.js",
  "./chunks/chunk-5RLOP6YY.js",
  "./chunks/chunk-6IU2NV7E.js",
  "./chunks/chunk-6JDYOQUJ.js",
  "./chunks/chunk-FYQYH365.js",
  "./chunks/chunk-G2K2XPUY.js",
  "./chunks/chunk-IAJNPHXC.js",
  "./chunks/chunk-J54UCCXE.js",
  "./chunks/chunk-MHDN3HTY.js",
  "./chunks/chunk-PYHD3KPA.js",
  "./chunks/chunk-T7WWQYBT.js",
  "./chunks/chunk-TVDPKXUF.js",
  "./chunks/InstallAppButton-MWJ4XHSI.js",
  "./chunks/ProtectedProtocols-7N7JQ2DF.js",
  "./chunks/QuickReference-4SOWVMSB.js",
  "./chunks/QuickSearch-DZG7N36Y.js",
  "./chunks/Reference-FEWWD5BI.js",
  "./chunks/Tools-I6MV6DLI.js",
  "./chunks/Trials-WQQNQNSD.js"
];
// END GENERATED APP CHUNKS

// BEGIN GENERATED REFERENCE VALIDATION
var ReferenceValidation=(()=>{var o=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var h=Object.prototype.hasOwnProperty;var b=(t,n)=>{for(var e in n)o(t,e,{get:n[e],enumerable:!0})},$=(t,n,e,i)=>{if(n&&typeof n=="object"||typeof n=="function")for(let s of g(n))!h.call(t,s)&&s!==e&&o(t,s,{get:()=>n[s],enumerable:!(i=c(n,s))||i.enumerable});return t};var A=t=>$(o({},"__esModule",{value:!0}),t);var x={};b(x,{validReferenceData:()=>y});var a=t=>typeof t=="string"&&t.trim().length>0,r=t=>Array.isArray(t)&&t.every(a),m=t=>a(t)&&/^[a-z0-9-]+$/.test(t),p=t=>typeof t=="string"&&/^https:\/\/[^\s]+$/.test(t),v=t=>t===void 0||Array.isArray(t)&&t.length>0&&t.every(n=>n&&["text","cor","loe","source","id"].every(e=>a(n[e])))&&new Set(t.map(n=>n.id)).size===t.length;function f(t){return Array.isArray(t)&&t.length>0&&new Set(t.map(n=>n?.id)).size===t.length&&t.every(n=>n&&m(n.id)&&["name","category","limits","sourceLabel","reviewScope"].every(e=>a(n[e]))&&p(n.sourceUrl)&&(!n.verificationUrl||p(n.verificationUrl))&&Array.isArray(n.fields)&&n.fields.every(e=>e&&a(e.key)&&a(e.label)&&["truth","select","number"].includes(e.type)&&(e.type!=="select"?e.options===void 0:Array.isArray(e.options)&&e.options.length>0&&e.options.every(i=>Array.isArray(i)&&i.length===2&&i.every(a))))&&(!n.shared||Array.isArray(n.shared)&&n.shared.every(e=>["age","sex","bp","mrs","gcs","weight","height","mtici","sahCause"].includes(e)))&&(!n.regions||Array.isArray(n.regions)&&n.regions.every(e=>e&&a(e.key)&&a(e.label)&&[1,2].includes(e.weight))))}function y(t,n){let e=t?.data;return t?._meta?.appVersion===n&&t?._meta?.schemaVersion==="2.0.0"&&f(e?.calculators)&&["topics","studies"].every(i=>Array.isArray(e?.[i])&&e[i].length>0&&new Set(e[i].map(s=>s?.id)).size===e[i].length&&e[i].every(s=>s&&m(s.id)&&a(s.title)&&r(s.keywords)&&r(s.settings)&&s.settings.length&&s.settings.every(l=>["on-call","hospital","clinic"].includes(l))&&Array.isArray(s.sources)&&s.sources.length&&s.sources.every(l=>l&&["title","type","checkedAt","access"].every(u=>a(l[u]))&&Number.isInteger(l.year)&&typeof l.url=="string"&&/^https:\/\/[^\s]+$/.test(l.url))&&(i==="topics"?a(s.category)&&["summary","caution"].every(l=>a(s[l]))&&r(s.consider)&&s.consider.length&&v(s.recommendations)&&Array.isArray(s.related)&&s.related.every(l=>a(l.label)&&/^#\/(?:encounter|tools|protocols|evidence|trials)(?:\/[a-z0-9-]+){0,2}$/.test(l.href)):["question","population","comparison","result","limits"].every(l=>a(s[l]))&&(s.headline===void 0||a(s.headline))&&Number.isInteger(s.year)&&(s.relatedTopic===""||m(s.relatedTopic)))))&&e.studies.every(i=>!e.topics.some(s=>s.id===i.id))&&e.studies.every(i=>i.relatedTopic===""||e.topics.some(s=>s.id===i.relatedTopic))}return A(x);})();
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
