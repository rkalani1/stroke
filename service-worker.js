/* v7.0 — service worker.
   Drop-in replacement: service-worker.js

   Per binding amendment #2:
   - On install: self.skipWaiting() so the new SW reaches the 'waiting' state
     immediately (no manual SKIP_WAITING postMessage like v5).
   - On activate: do NOT call self.clients.claim() immediately. Instead,
     broadcast {type:'sw-update-ready', version:'6.1.0'} to every controlled
     client. The app shows a non-blocking toast — clinicians mid-consult are
     never auto-interrupted.
   - When a client messages {type:'CLAIM_AND_RELOAD'}, the SW calls
     clients.claim() and asks the client to soft-reload.

   Cache-name bumped to stroke-cache-v6-1-0. Old caches are cleared on activate.
*/

const APP_VERSION = '6.3.0';
const CACHE_NAME  = 'stroke-cache-v6-3-0';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app.js',
  './tailwind.css',
  './offline.html'
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

    // Broadcast the update — do NOT call clients.claim() here.
    const clientsList = await self.clients.matchAll({ includeUncontrolled: false });
    for (const c of clientsList) {
      c.postMessage({ type: 'sw-update-ready', version: APP_VERSION });
    }
    // eslint-disable-next-line no-console
    console.info(`[SW] v${APP_VERSION} staged, awaiting client opt-in`);
  })());
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'CLAIM_AND_RELOAD') {
    event.waitUntil((async () => {
      await self.clients.claim();
      const clientsList = await self.clients.matchAll();
      for (const c of clientsList) {
        c.postMessage({ type: 'sw-claimed-reload', version: APP_VERSION });
      }
    })());
  }
  // Back-compat with v5 page bootstrap that posts SKIP_WAITING.
  // (skipWaiting already happens on install; this is a no-op safety.)
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isHtmlRequest = (request) => {
  if (request.mode === 'navigate') return true;
  return (request.headers.get('accept') || '').includes('text/html');
};

const isShellAsset = (url) =>
  url.pathname.endsWith('/app.js') ||
  url.pathname.endsWith('/tailwind.css') ||
  url.pathname.endsWith('/manifest.json');

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
            ? caches.match('./offline.html').then(r => r || caches.match('./index.html'))
            : caches.match(event.request).then(c => c || caches.match('./index.html'))
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
