/* Service-worker updates are opt-in.
   Installation stages the new shell and modules, checks each file against the
   release's generated SHA-256 table and only then fills the release cache,
   leaving the worker waiting. A user
   must choose Reload to update before it may activate. If another in-scope
   window is open, activation is deferred until that window closes; legacy
   clients otherwise reload on controllerchange and can lose an active form.
   Old app caches are retired only on activation. Fetch policy is independent.
*/

const APP_VERSION = '7.11.1';
const CACHE_PREFIX = 'stroke-cache-v';
const CACHE_NAME  = 'stroke-cache-v7-11-1-utility-review-20261001';

// Retired teaching figures and documents must not be served from a stale browser cache or
// a bookmarked URL after this worker takes control. Every retired file sits under one of
// these scope-relative prefixes (or under assets/, outside the retained fonts/ and splash/),
// so both the local root and the GitHub Pages /stroke/ deployment are covered.
const RETIRED_PREFIXES = ['documents/', 'content/', 'src/', 'output/'];
const isRetiredPath = url => {
  const base = new URL(self.registration.scope);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return false;
  let relative; try { relative = decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return false; }
  return (relative.startsWith('assets/') && !relative.startsWith('assets/fonts/') && !relative.startsWith('assets/splash/')) || RETIRED_PREFIXES.some(prefix => relative.startsWith(prefix));
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
  // Exactly the @font-face set in src/design/tokens.css (a test keeps them equal).
  './assets/fonts/bricolage-700.woff2',
  './assets/fonts/ibmplexmono-400.woff2',
  './assets/fonts/ibmplexmono-600.woff2',
  './assets/fonts/publicsans-italic-400.woff2',
  './assets/fonts/publicsans-normal-400.woff2',
  './assets/fonts/publicsans-normal-500.woff2',
  './assets/fonts/publicsans-normal-600.woff2',
  './assets/fonts/publicsans-normal-700.woff2'
  // Not the 12 iOS launch screens in assets/splash/ (368 KB): only an iOS home-screen
  // launch shows one, at most one per device. The same-origin cache-first fetch below
  // keeps each in this release's cache from its first request.
];

// The build writes content-addressed modules here. Installation must cache
// ALL of them before the worker is installed/offline-ready. Downloading does
// not execute deferred protocols, trials, calculators or reference modules.
// BEGIN GENERATED APP CHUNKS
const APP_CHUNKS = [
  "./chunks/chunk-3C5ZDFRN.js",
  "./chunks/chunk-3EH37YPU.js",
  "./chunks/chunk-CCC5QWPU.js",
  "./chunks/chunk-DXV6LRZM.js",
  "./chunks/chunk-DYS5BMRX.js",
  "./chunks/chunk-FPW5WEWF.js",
  "./chunks/chunk-FVADEUQC.js",
  "./chunks/chunk-HOFJI2PN.js",
  "./chunks/chunk-HT3KC2V6.js",
  "./chunks/chunk-IT4TLS54.js",
  "./chunks/chunk-JCWM7WLY.js",
  "./chunks/chunk-QPJ3MHXX.js",
  "./chunks/chunk-R2CHXKEA.js",
  "./chunks/chunk-RDN423YN.js",
  "./chunks/chunk-RKNMGIFI.js",
  "./chunks/chunk-SXBELJP7.js",
  "./chunks/chunk-VT64OQUZ.js",
  "./chunks/InstallAppButton-NWUBLKJU.js",
  "./chunks/ProtectedProtocols-VIKFN25Q.js",
  "./chunks/QuickReference-TLWEC62O.js",
  "./chunks/QuickSearch-QOLRKVZK.js",
  "./chunks/Reference-7ZG34KAP.js",
  "./chunks/Tools-2UCVN2GD.js",
  "./chunks/Trials-H2VQ3G5R.js"
];
// END GENERATED APP CHUNKS

// SHA-256 of every precached file of this release ('./' is index.html), written by
// scripts/build-browser.mjs after the final shell write. Same-name files (index.html, app.js,
// tailwind.css, data) carry no hash in their URL, so a partly propagated Pages deploy can
// pair this worker with a previous release's bytes; install refuses anything else.
// BEGIN GENERATED PRECACHE SHA256
const PRECACHE_SHA256 = {
  "./": "927f45500b874c27ff470f214a3802a57413294ac6b608ed93ab52693fe4eb95",
  "./index.html": "927f45500b874c27ff470f214a3802a57413294ac6b608ed93ab52693fe4eb95",
  "./manifest.json": "de988e2e32ae65173d8ec0bf647c17ec3d74a01decdb69c50330bdbc56aa2268",
  "./icon-192.png": "9cd667cf2a5e3c84b0e656417a59b4aac9f0453fea57c8a893e72de2b536553a",
  "./icon-512.png": "4fb24ddf6e0f1fc890c58da553079281d381d725100cfe997f5b5526f5b3c9b6",
  "./app.js": "cad35428df9156e0445b9c76e37f8212dca47c1b4221aab1b19326a0fc9548d6",
  "./tailwind.css": "1874bfc06950bde673590c3d41dbb8713dad25e5a8d1bf79131fcab945b0637f",
  "./offline.html": "0f3f147994c4a8dba8e325285648be9a80e6d0e48ea9d29b13de14c4e69bb3c9",
  "./data/clinical-reference.json": "65789b40ed4e6f9cfa9a7f3d4cba4a15839048c0758f39f3a0b434d61773609e",
  "./assets/fonts/bricolage-700.woff2": "5f91a977f90763e3899434454af4f6f3755cb364ae1fde4b708937da2979a621",
  "./assets/fonts/ibmplexmono-400.woff2": "f2a033ab563914090b225cfeb959c8e1efa3b8e7d8816af693dcd6cd6fcc33b0",
  "./assets/fonts/ibmplexmono-600.woff2": "f874cf3f1f67e1f9b6235e1d3636a7d39d4528a0fc0350b7b3f12ca0ff1e66b9",
  "./assets/fonts/publicsans-italic-400.woff2": "daa5111af50b037db06fac4878fbc16d15d23d8a83930b328b20ec5bcd73198d",
  "./assets/fonts/publicsans-normal-400.woff2": "e17336fb289eb18622419ecedae5637411d0513e1479b0f70cacad077942d421",
  "./assets/fonts/publicsans-normal-500.woff2": "b2dbada28b9985e4986a9eae9bff2336599aec55ff5ad493b3a788181ad60d9f",
  "./assets/fonts/publicsans-normal-600.woff2": "ad867030b3b0a4f307e3ae0d52b94d4d2063536b76aac879760e55a6f9e63505",
  "./assets/fonts/publicsans-normal-700.woff2": "af0324417d2f7b5016905515d73dd4a5511465ac18a4edd6875905c611d2b780",
  "./chunks/chunk-3C5ZDFRN.js": "6dfd04038db54f5381f723ce8b829c4237fd9379a29ee4794550b8ac0a0e81d1",
  "./chunks/chunk-3EH37YPU.js": "66957d47a47b4de12113930062c1549314c59557bb78106035e401aaf80568ee",
  "./chunks/chunk-CCC5QWPU.js": "6f78f53c8acbaf4dc62713d445c3b48ba61407d115596e6507a4252151ebde42",
  "./chunks/chunk-DXV6LRZM.js": "e53b76097ab7b6ad561bdc6a921075c340a55a623f41f405af1698cc971118aa",
  "./chunks/chunk-DYS5BMRX.js": "9e501761dd25559fed23e47637a552e3768350437cea3da5df16654c3e6d3d4a",
  "./chunks/chunk-FPW5WEWF.js": "3af550e50c98df4b65cbd19a275ead630964be6eb1d8f96ac4aa674254ae9186",
  "./chunks/chunk-FVADEUQC.js": "c393bea5801c370e5cbd8e00757cf0927fca5385b4aed2a926fb048af8578f09",
  "./chunks/chunk-HOFJI2PN.js": "9530002bc008361147c1335f1710d2ae9c74305ebb2508b243fd0e685f55b206",
  "./chunks/chunk-HT3KC2V6.js": "194a6e331e1b8b91eabc419df160bf0a14d985d83ccb311270a79f871ef453f5",
  "./chunks/chunk-IT4TLS54.js": "88630fc941c2d504169f28756882f83f42d47be20bcccc68c82d42499df82ca4",
  "./chunks/chunk-JCWM7WLY.js": "7c44f79bafb29bc3c0ee326943e3190c1fd626a9d2322f0adc11c0a22da8b816",
  "./chunks/chunk-QPJ3MHXX.js": "2be9a4161de905d1f345d92b6f290e30c55f980326a49b293bf8906590d2fc52",
  "./chunks/chunk-R2CHXKEA.js": "ecd07c9412649b7c2bd6cc587847c7f0b41752164475d824f4db56e07cac1095",
  "./chunks/chunk-RDN423YN.js": "cee77a086c373391a96289bab0117dd90cf549025511b0232569902ee3d2545e",
  "./chunks/chunk-RKNMGIFI.js": "f3a521614dd2de2232e60e22b48dfa0dc2027464fa2ac80d8a7717c352bf71b3",
  "./chunks/chunk-SXBELJP7.js": "e869bf8a197d76272a97117d85e8b1fd7b6332023db01450387588c05ba33618",
  "./chunks/chunk-VT64OQUZ.js": "c9ec3b2c88d3ff54bacf397d17bc7827fba217f1fa59a459d62a5492b1b3b21c",
  "./chunks/InstallAppButton-NWUBLKJU.js": "7c754029f8723c1e9c509d7137dc975db2c0a9f178696e1657c45ce5ce703090",
  "./chunks/ProtectedProtocols-VIKFN25Q.js": "42047375641e635b0a320410d83e2cf846743ba03b14a4152c101162f7fdf6c9",
  "./chunks/QuickReference-TLWEC62O.js": "34516ec162e1a7dff8bf71420233c7f0a0e5c74de3e2ad6f8221d9c730d22d86",
  "./chunks/QuickSearch-QOLRKVZK.js": "8f5d07c75cc05f1bc803036e32faa6dcb9d1d1e05b0f7eed25408e71025ebbd9",
  "./chunks/Reference-7ZG34KAP.js": "e485352ee30cba874b18927fb820c4b1d44fa1363127aad6be26e873276ab58a",
  "./chunks/Tools-2UCVN2GD.js": "2e2b8228bdf09b99dc91bbb2b73123d9111242b315c0403f9d7f21fd997b22f1",
  "./chunks/Trials-H2VQ3G5R.js": "d5336e5e1dca02884c2c4adb8f0a487e5d1998fe505717ed58a8010871e3d2bc"
};
// END GENERATED PRECACHE SHA256

// BEGIN GENERATED REFERENCE VALIDATION
var ReferenceValidation=(()=>{var l=Object.defineProperty;var u=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var b=Object.prototype.hasOwnProperty;var y=(t,s)=>{for(var e in s)l(t,e,{get:s[e],enumerable:!0})},$=(t,s,e,a)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of h(s))!b.call(t,n)&&n!==e&&l(t,n,{get:()=>s[n],enumerable:!(a=u(s,n))||a.enumerable});return t};var f=t=>$(l({},"__esModule",{value:!0}),t);var A={};y(A,{validReferenceData:()=>m});var i=t=>typeof t=="string"&&t.trim().length>0,r=t=>Array.isArray(t)&&t.every(i),c=t=>i(t)&&/^[a-z0-9-]+$/.test(t),p=t=>typeof t=="string"&&/^https:\/\/[^\s]+$/.test(t),v=t=>t===void 0||Array.isArray(t)&&t.length>0&&t.every(s=>s&&["text","cor","loe","source","id"].every(e=>i(s[e])))&&new Set(t.map(s=>s.id)).size===t.length;function d(t){return Array.isArray(t)&&t.length>0&&new Set(t.map(s=>s?.id)).size===t.length&&t.every(s=>s&&c(s.id)&&["name","category","limits","sourceLabel","reviewScope"].every(e=>i(s[e]))&&p(s.sourceUrl)&&(!s.verificationUrl||p(s.verificationUrl))&&Array.isArray(s.fields)&&s.fields.every(e=>e&&i(e.key)&&i(e.label)&&["truth","select","number"].includes(e.type)&&(e.type!=="select"?e.options===void 0:Array.isArray(e.options)&&e.options.length>0&&e.options.every(a=>Array.isArray(a)&&a.length===2&&a.every(i))))&&(!s.shared||Array.isArray(s.shared)&&s.shared.every(e=>["age","sex","bp","mrs","gcs","weight","height","mtici","sahCause"].includes(e)))&&(!s.regions||Array.isArray(s.regions)&&s.regions.every(e=>e&&i(e.key)&&i(e.label)&&[1,2].includes(e.weight))))}function m(t,s){let e=t?.data;return t?._meta?.appVersion===s&&t?._meta?.schemaVersion==="2.0.0"&&d(e?.calculators)&&["topics","studies"].every(a=>Array.isArray(e?.[a])&&e[a].length>0&&new Set(e[a].map(n=>n?.id)).size===e[a].length&&e[a].every(n=>n&&c(n.id)&&i(n.title)&&r(n.keywords)&&r(n.settings)&&n.settings.length&&n.settings.every(o=>["on-call","hospital","clinic"].includes(o))&&Array.isArray(n.sources)&&n.sources.length&&n.sources.every(o=>o&&["title","type","checkedAt","access"].every(g=>i(o[g]))&&Number.isInteger(o.year)&&typeof o.url=="string"&&/^https:\/\/[^\s]+$/.test(o.url))&&(a==="topics"?i(n.category)&&["summary","caution"].every(o=>i(n[o]))&&r(n.consider)&&n.consider.length&&v(n.recommendations)&&Array.isArray(n.related)&&n.related.every(o=>i(o.label)&&/^#\/(?:encounter|tools|protocols|evidence|trials)(?:\/[a-z0-9-]+){0,2}$/.test(o.href)):["question","population","comparison","result","limits"].every(o=>i(n[o]))&&(n.headline===void 0||i(n.headline))&&Number.isInteger(n.year)&&(n.relatedTopic===""||c(n.relatedTopic)))))&&e.studies.every(a=>!e.topics.some(n=>n.id===a.id))&&e.studies.every(a=>a.relatedTopic===""||e.topics.some(n=>n.id===a.relatedTopic))}return f(A);})();
// END GENERATED REFERENCE VALIDATION
const validReferenceEnvelope = reference => ReferenceValidation.validReferenceData(reference, APP_VERSION);

async function purgeWithdrawnCacheEntries() {
  // A waiting worker does not control requests yet. Remove only retired files
  // from this app's caches so the previous worker cannot serve those entries.
  // Scope and origin checks preserve other deployments and foreign resources.
  const names = (await caches.keys()).filter(name => name.startsWith(CACHE_PREFIX));
  for (const name of names) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    await Promise.all(requests.map(request => {
      let url;
      try { url = new URL(request.url); } catch (_) { return; }
      if (url.origin === self.location.origin && isRetiredPath(url)) return cache.delete(request);
    }));
  }
}

// Install stages into this cache first; only a verified release is copied into CACHE_NAME, so
// a failed install never overwrites entries a running worker with the same name still serves.
// Leftovers share CACHE_PREFIX, so the next activation removes them.
const STAGING_CACHE = `${CACHE_NAME}-staging`;
const PRECACHE = [...CORE_ASSETS, ...APP_CHUNKS];
const sha256Hex = async response =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');

async function stageAndVerify(staging) {
  // A recently visited deployment can still be fresh in the HTTP cache.
  // Stage this deployment from the network, not those previous shell bytes.
  await staging.addAll(PRECACHE.map(asset =>
    new Request(new URL(asset, self.registration.scope), { cache: 'reload' })
  ));
  const staged = async asset => {
    const response = await staging.match(new URL(asset, self.registration.scope).href);
    if (!response) throw new Error(`Staged ${asset} is missing`);
    return response;
  };
  // A partly swapped Pages deploy can pair this worker's chunk list with a stale entry or
  // shell, which would then be served cache-first as a blank app. Refuse to stage a module
  // graph that names a module this worker does not cache; the current version stays.
  const listed = new Set(APP_CHUNKS.map(asset => asset.slice(asset.lastIndexOf('/') + 1)));
  for (const asset of ['./index.html', './app.js', ...APP_CHUNKS]) {
    const text = await (await staged(asset)).text();
    for (const [, name] of text.matchAll(/[/"]([A-Za-z][A-Za-z0-9_]*-[A-Z0-9]{8}\.js)\b/g)) {
      if (!listed.has(name)) throw new Error(`Staged ${asset} references unlisted module ${name}`);
    }
  }
  const reference = await (await staged('./data/clinical-reference.json')).json().catch(() => undefined);
  if (!validReferenceEnvelope(reference)) {
    throw new Error('Reference cache version or content mismatch');
  }
  // The same file names can still hold another release's bytes (an entry or stylesheet
  // edited without renaming a chunk). Every staged file must be exactly this release's.
  for (const asset of PRECACHE) {
    const expected = PRECACHE_SHA256[asset];
    if (!expected) throw new Error(`No release checksum for ${asset}`);
    if (await sha256Hex(await staged(asset)) !== expected) throw new Error(`Staged ${asset} does not match release ${APP_VERSION}`);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await caches.delete(STAGING_CACHE);
    try {
      const staging = await caches.open(STAGING_CACHE);
      await stageAndVerify(staging);
      const cache = await caches.open(CACHE_NAME);
      for (const request of await staging.keys()) await cache.put(request, await staging.match(request));
    } finally {
      // On any failure the install rejects: the current version keeps running and the
      // next update check retries once the deploy has converged.
      await caches.delete(STAGING_CACHE);
    }
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
      // The shell loads its modules relative to the document URL, so served at a deeper
      // path it renders blank offline. Send in-scope sub-paths to the scope root instead.
      const scope = new URL(self.registration.scope);
      if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname) && url.pathname.slice(scope.pathname.length).includes('/')) return Response.redirect(scope.href, 302);
      for (const asset of ['./index.html', './', './offline.html']) {
        const cached = await cache.match(new URL(asset, self.registration.scope).href);
        if (cached) return cached;
      }
    } else if (url.search &&
        ['app.js', 'tailwind.css', 'manifest.json', 'data/clinical-reference.json'].some(asset =>
          url.href.split('?')[0] === new URL(asset, self.registration.scope).href)) {
      // Only these intentionally precached shell files have a canonical alias.
      // Do not select an arbitrary query variant or erase other files' query identity.
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
    response = await fetch(request, { cache: 'no-cache' });
  } catch (_) { return offlineUnavailable(); }
  await persistResponse(request, response);
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    if (isRetiredPath(url)) {
      event.respondWith(Promise.resolve(new Response(
        'This teaching resource has been withdrawn. Open the current Encounter workspace.',
        { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
      )));
      return;
    }
    // Keep a controlled document, entry and chunks on one installed release.
    // A waiting update must never replace the running module graph before the
    // user chooses Reload. Other HTML stays network-first.
    if (isVersionedShell(url)) {
      event.respondWith(cacheFirst(event.request, url));
      return;
    }
    if (isHtmlRequest(event.request, url)) {
      event.respondWith(networkFirst(event.request, url));
      return;
    }
    // Other same-origin files, such as the iOS launch screens (not precached): a successful
    // first response is stored in this release's cache for later offline use.
    event.respondWith(cacheFirst(event.request, url));
  }
  // Cross-origin requests are left to the browser: the app makes none of its own.
});
