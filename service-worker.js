/* v7.0 — service worker.
   Drop-in replacement: service-worker.js

   Per binding amendment #2:
   - On install: self.skipWaiting() so the new SW reaches the 'waiting' state
     immediately (no manual SKIP_WAITING postMessage like v5).
   - On activate: do NOT call self.clients.claim() immediately. Instead,
     broadcast {type:'sw-update-ready', version:'6.19.0'} to every open
     client. The app shows a non-blocking toast — clinicians mid-consult are
     never auto-interrupted.
   - When a client messages {type:'CLAIM_AND_RELOAD'} or legacy
     {type:'SKIP_WAITING'}, the SW calls clients.claim() and asks the client
     to soft-reload.

   Cache-name bumped to stroke-cache-v6-19-0. Old caches are cleared on activate.
*/

const APP_VERSION = '6.19.0';
const CACHE_NAME  = 'stroke-cache-v6-19-0';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app.js',
  './tailwind.css',
  './offline.html',
  './whats-new.json',
  './config.example.json',
  './data/index.json',
  './data/calculators-index.json',
  './data/generic-protocols.json',
  './data/management-cards.json',
  './data/atlas/active-trials.json',
  './data/atlas/citations.json',
  './data/atlas/claims.json',
  './data/atlas/completed-trials.json',
  './data/atlas/labels.json',
  './data/atlas/recommendations.json',
  './data/atlas/topics.json',
  './data/guidelines/index.json',
  './data/guidelines/ais-2026.json',
  './data/guidelines/cancer-stroke-2026.json',
  './data/guidelines/cardiac-brain-health-2024.json',
  './data/guidelines/cvt-2024.json',
  './data/guidelines/ich-2022.json',
  './data/guidelines/landmark-trials.json',
  './data/guidelines/maternal-stroke-2026.json',
  './data/guidelines/perioperative-stroke-2021.json',
  './data/guidelines/poststroke-cognitive-2023.json',
  './data/guidelines/poststroke-primary-care-2021.json',
  './data/guidelines/poststroke-spasticity-2026.json',
  './data/guidelines/premorbid-disability-2022.json',
  './data/guidelines/primary-prevention-2024.json',
  './data/guidelines/sah-2023.json',
  './data/guidelines/secondary-prevention-2021.json',
  './data/guidelines/svin-large-core-2025.json',
  './data/guidelines/systemic-complications-2024.json',
  './data/guidelines/tia-ed-2023.json',
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
  './assets/splash/splash-iphone-8-7-6.png',
  './assets/toast_classification_infographic.png',
  './assets/toast_classification_infographic.svg',
  './assets/dapt_flowchart_timeline.png',
  './assets/dapt_flowchart_timeline.svg',
  './assets/afib_timing_protocol.png',
  './assets/afib_timing_protocol.svg',
  './assets/select_score_chart.png',
  './assets/select_score_chart.svg',
  './assets/ischemic_core_penumbra_render.png',
  './assets/ischemic_core_penumbra_render.svg',
  './assets/aspects_10_regions_render.png',
  './assets/aspects_10_regions_render.svg',
  './assets/evt_lvo_occlusion_sites.png',
  './assets/evt_lvo_occlusion_sites.svg',
  './assets/hematoma_expansion_render.png',
  './assets/hematoma_expansion_render.svg'
];

const CDN_ASSETS = [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).then(() =>
        Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)))
      )
    )
  );
  // v7 amendment #2: skip waiting so we reach 'waiting' state quickly,
  // but do NOT claim clients until the user opts in.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));

    // Broadcast the update — do NOT call clients.claim() here. Include
    // uncontrolled windows because an already-open page may still be under the
    // previous worker until the user accepts the visible reload banner.
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of clientsList) {
      c.postMessage({ type: 'sw-update-ready', version: APP_VERSION });
    }
    // eslint-disable-next-line no-console
    console.info(`[SW] v${APP_VERSION} staged, awaiting client opt-in`);
  })());
});

async function claimAndRequestReload() {
  await self.clients.claim();
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of clientsList) {
    c.postMessage({ type: 'sw-claimed-reload', version: APP_VERSION });
  }
}

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'CLAIM_AND_RELOAD' || event.data.type === 'SKIP_WAITING') {
    event.waitUntil(claimAndRequestReload());
  }
});

const isHtmlRequest = (request) => {
  if (request.mode === 'navigate') return true;
  return (request.headers.get('accept') || '').includes('text/html');
};

const isShellAsset = (url) =>
  url.pathname.endsWith('/app.js') ||
  url.pathname.endsWith('/tailwind.css') ||
  url.pathname.endsWith('/manifest.json') ||
  url.pathname.endsWith('.pdf');

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    // Network-first for HTML + shell — always serve freshest deploy when online
    if (isHtmlRequest(event.request) || isShellAsset(url)) {
      event.respondWith(
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        }).catch(() =>
          event.request.mode === 'navigate'
            // Offline navigation/reload: serve the cached working app shell FIRST
            // (it's in CORE_ASSETS, so always precached and fully functional offline).
            // offline.html is only a last resort if the shell was never cached.
            ? caches.match('./index.html').then(r => r || caches.match('./offline.html'))
            : caches.match(event.request, { ignoreSearch: true }).then(c => c || caches.match('./index.html'))
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
