/* Service-worker updates are opt-in.
   Installation precaches the new shell and leaves the worker waiting. A user
   must choose Reload to update before it may activate. If another in-scope
   window is open, activation is deferred until that window closes; legacy
   clients otherwise reload on controllerchange and can lose an active form.
   Old app caches are retired only on activation. Fetch policy is independent.
*/

const APP_VERSION = '6.30.1';
const CACHE_PREFIX = 'stroke-cache-v';
const CACHE_NAME  = 'stroke-cache-v6-30-1-clinical-review-20260930';

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

const CORE_ASSETS = [
  // Install-time precache: the app shell and everything the app itself reads.
  //
  // Deliberately NOT here, because the fetch handler below already caches
  // same-origin assets cache-first on first request:
  //   - data/*.json — the machine-readable agent/llms.txt API. Nothing in
  //     src/ ever fetches it (the app compiles its guideline JSON into the
  //     bundle), so precaching it made every first-time visitor download
  //     ~929 KB of a second copy of the guideline data they already had.
  //   - the large infographic PNGs — ~3.6 MB, lazy-loaded at runtime and
  //     opened by a minority of visitors. They cache on first view instead.
  // Both stay fully available offline once actually visited.
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app.js',
  './tailwind.css',
  './offline.html',
  './config.example.json',
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
      if (url.origin === self.location.origin && retiredPaths.has(pathname)) return cache.delete(request);
    }));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    let pathname = url.pathname;
    try { pathname = decodeURIComponent(pathname); } catch { /* malformed paths are left to the server */ }
    if (WITHDRAWN_ASSETS.some(path => pathname.endsWith(path))) {
      event.respondWith(Promise.resolve(new Response(
        'This teaching resource has been withdrawn. Open the current Stroke education library for the revised material.',
        { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
      )));
      return;
    }
    // Network-first for HTML + shell — always serve freshest deploy when online
    if (isHtmlRequest(event.request, url) || isShellAsset(url)) {
      event.respondWith(
        fetch(event.request, { cache: 'no-cache' }).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        }).catch(() =>
          event.request.mode === 'navigate' && isHtmlRequest(event.request, url)
            // Offline navigation/reload: serve the cached working app shell FIRST
            // (it's in CORE_ASSETS, so always precached and fully functional offline).
            // offline.html is only a last resort if the shell was never cached.
            ? caches.match('./index.html').then(r => r || caches.match('./offline.html'))
            : caches.match(event.request, { ignoreSearch: true }).then(c => c || new Response(
              'This resource is not available offline. Reconnect and open the current library.',
              { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            ))
        )
      );
      return;
    }
    // Cache-first for icons and other static same-origin assets
    event.respondWith(
      caches.match(event.request).then((cached) => cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
      )
    );
    return;
  }

  // CDN assets — cache-first
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
      )
    );
  }
});
