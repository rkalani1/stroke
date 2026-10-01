import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const version = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;
const currentCache = 'stroke-cache-v' + version.replaceAll('.', '-') + '-utility-review-20261001';
const workerSource = readFileSync(join(repoRoot, 'service-worker.js'), 'utf8');
const referenceFixture = JSON.parse(readFileSync(new URL('../data/clinical-reference.json', import.meta.url), 'utf8'));
referenceFixture._meta.appVersion = version;

function loadServiceWorker(existingCacheKeys = ['stroke-cache-v6-21-0', 'stroke-cache-v6-22-0', currentCache], options = {}) {
  const handlers = new Map();
  const deletedCaches = [];
  const deletedEntries = [];
  const openedCaches = [];
  const postedMessages = [];
  const matchAllOptions = [];
  const precacheRequests = [];
  const referenceBodies = new Map();
  const referenceUrl = new URL('data/clinical-reference.json', options.scope || 'https://example.test/').href;
  let claimCount = 0;
  let skipWaitingCount = 0;
  let active = false;
  let windows = [{ id: 'requester', url: 'https://example.test/', postMessage: message => postedMessages.push(message) }];

  const cacheStore = {
    addAll: async requests => {
      if (options.precacheFailure) throw Error('Precache failed');
      if (options.chunkFailure && requests.some(request => request.url.includes('/chunks/'))) throw Error('Chunk unavailable');
      if (options.delayPrecache) await options.delayPrecache;
      precacheRequests.push(...requests);
      if (requests.some(request => request.url === referenceUrl)) {
        referenceBodies.set(currentCache, options.referenceBody === undefined ? JSON.stringify(referenceFixture) : options.referenceBody);
      }
    },
    add: async () => {},
    put: async () => {},
  };

  const context = {
    Promise,
    URL,
    Request,
    Response,
    console: { info: () => {}, error: () => {} },
    fetch: async () => ({ ok: true, clone: () => ({ ok: true }) }),
    caches: {
      open: async name => {
        openedCaches.push(name);
        return { ...cacheStore,
          match: async key => {
            const body = referenceBodies.get(name);
            return key === referenceUrl && typeof body === 'string' ? new Response(body, { headers: { 'Content-Type': 'application/json' } }) : undefined;
          },
          keys: async () => (options.entries?.[name] || []).map(url => ({ url })),
          delete: async request => { deletedEntries.push({ cache: name, url: request.url }); return true; }
        };
      },
      keys: async () => existingCacheKeys,
      delete: async (key) => {
        deletedCaches.push(key);
        return true;
      },
      match: async () => null,
    },
    self: {
      location: { origin: 'https://example.test' },
      registration: { scope: options.scope || 'https://example.test/' },
      addEventListener: (type, handler) => {
        handlers.set(type, handler);
      },
      skipWaiting: () => {
        skipWaitingCount += 1;
      },
      clients: {
        get: async id => windows.find(client => client.id === id),
        claim: async () => {
          if (!active) {
            const error = new Error('Worker has not activated');
            error.name = 'InvalidStateError';
            throw error;
          }
          claimCount += 1;
        },
        matchAll: async (options = {}) => {
          matchAllOptions.push(options);
          return windows;
        },
      },
    },
  };

  vm.runInNewContext(workerSource, context, { filename: 'service-worker.js' });

  async function dispatch(type, data) {
    const handler = handlers.get(type);
    expect(handler, `${type} handler registered`).toBeTypeOf('function');
    let waitUntilPromise = Promise.resolve();
    if (type === 'activate') active = true;
    handler({
      data,
      source: windows[0],
      request: { method: 'GET', mode: 'navigate', headers: new Map([['accept', 'text/html']]), url: 'https://example.test/' },
      waitUntil: (promise) => {
        waitUntilPromise = Promise.resolve(promise);
      },
      respondWith: () => {},
    });
    await waitUntilPromise;
  }

  return {
    dispatch,
    deletedCaches,
    deletedEntries,
    openedCaches,
    postedMessages,
    matchAllOptions,
    precacheRequests,
    setWindows(next) { windows = next; },
    get claimCount() {
      return claimCount;
    },
    get skipWaitingCount() {
      return skipWaitingCount;
    },
  };
}

describe('service worker update lifecycle', () => {
  it('keeps the release, cache, and shell-asset versions synchronized', () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const indexSource = readFileSync(join(repoRoot, 'index.html'), 'utf8');
    const version = packageJson.version;

    expect(workerSource).toContain(`const APP_VERSION = '${version}'`);
    expect(workerSource).toContain(`const CACHE_NAME  = '${currentCache}'`);
    expect(indexSource).toContain(`app.js?v=${version}`);
    expect(indexSource).toContain(`tailwind.css?v=${version}`);
    expect(indexSource).toContain(`const APP_VERSION = '${version}'`);

    const appSource = readFileSync(join(repoRoot, 'src', 'app.jsx'), 'utf8');
    expect(appSource).toContain(`const APP_VERSION = '${version}'`);
  });

  it('leaves an installed upgrade waiting without takeover or cache deletion', async () => {
    const worker = loadServiceWorker();
    await worker.dispatch('install');
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.postedMessages).toEqual([]);
  });

  it.each(['/', '/stroke/'])('precaches a matching reference envelope with the scoped release at %s', async scopePath => {
    const scope = `https://example.test${scopePath}`;
    const worker = loadServiceWorker([], { scope });
    await worker.dispatch('install');
    const reference = worker.precacheRequests.find(request => request.url === new URL('data/clinical-reference.json', scope).href);
    expect(reference?.cache).toBe('reload');
    expect(worker.skipWaitingCount).toBe(0);
  });

  it.each([
    ['another app version', JSON.stringify({ ...referenceFixture, _meta: { ...referenceFixture._meta, appVersion: 'old-release' } })],
    ['another schema version', JSON.stringify({ ...referenceFixture, _meta: { ...referenceFixture._meta, schemaVersion: '1.0.0' } })],
    ['missing reference', null],
    ['malformed calculator fields', JSON.stringify({ ...referenceFixture, data: { ...referenceFixture.data, calculators: [{ ...referenceFixture.data.calculators[0], fields: null }] } })],
    ['malformed topic source', JSON.stringify({ ...referenceFixture, data: { ...referenceFixture.data, topics: [{ ...referenceFixture.data.topics[0], sources: [] }] } })],
    ['missing calculator presentation', JSON.stringify({ ...referenceFixture, data: { topics: [{}], studies: [{}] } })],
    ['malformed JSON', '{'],
    ['missing topics', JSON.stringify({ ...referenceFixture, data: { studies: [] } })],
    ['non-array studies', JSON.stringify({ ...referenceFixture, data: { topics: [{}], studies: {} } })],
    ['empty collection', JSON.stringify({ ...referenceFixture, data: { topics: [], studies: [{}] } })],
  ])('rejects %s without retiring the previous usable cache', async (_label, referenceBody) => {
    const old = 'stroke-cache-v6-29-2';
    const worker = loadServiceWorker([old, currentCache], { referenceBody, entries: {
      [old]: ['https://example.test/assets/afib_timing_protocol.png', 'https://example.test/app.js']
    }});
    await expect(worker.dispatch('install')).rejects.toThrow();
    expect(worker.deletedEntries).toEqual([]);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.claimCount).toBe(0);
  });

  it('retries a rejected reference installation with a fresh matching response', async () => {
    const old = 'stroke-cache-v6-29-2';
    const options = { referenceBody: '{', entries: { [old]: ['https://example.test/assets/afib_timing_protocol.png'] } };
    const worker = loadServiceWorker([old, currentCache], options);
    await expect(worker.dispatch('install')).rejects.toThrow();
    expect(worker.deletedEntries).toEqual([]);
    options.referenceBody = JSON.stringify(referenceFixture);
    await worker.dispatch('install');
    expect(worker.precacheRequests.filter(request => request.url.endsWith('/data/clinical-reference.json'))).toHaveLength(2);
    expect(worker.deletedEntries).toEqual([{ cache: old, url: 'https://example.test/assets/afib_timing_protocol.png' }]);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.skipWaitingCount).toBe(0);
  });

  it.each(['/', '/stroke/'])('withdraws scoped teaching assets/documents after successful precache at %s', async scopePath => {
    const suffixes = JSON.parse(workerSource.match(/const WITHDRAWN_ASSETS = (\[[\s\S]*?\]);/)[1].replaceAll("'", '"'));
    const base = `https://example.test${scopePath}`;
    const retired = [...suffixes, '/documents/references/AFib%20DOAC%20Start%20Timing.pdf', '/assets/brain_death_evaluation.png', '/src/education.jsx', '/content/bundle.json'].map(suffix => new URL(`.${suffix}`, base).href + '?old=1');
    const retained = [base + 'app.js', base + 'assets/fonts/inter-latin.woff2', base + 'assets/splash/startup.png',
      'https://elsewhere.test' + scopePath + 'assets/afib_timing_protocol.png',
      base + 'another-deployment/assets/afib_timing_protocol.png', base + 'assets/%malformed'];
    const old = 'stroke-cache-v6-29-2';
    const worker = loadServiceWorker([old, 'foreign-cache', currentCache], { scope: base, entries: {
      [old]: [...retired, ...retained], 'foreign-cache': retired, [currentCache]: retained
    }});
    await worker.dispatch('install');
    expect(worker.deletedEntries).toEqual(retired.map(url => ({ cache: old, url })));
    expect(worker.openedCaches).not.toContain('foreign-cache');
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.skipWaitingCount).toBe(0);
  });

  it('preserves cached entries when the replacement shell fails to precache', async () => {
    const worker = loadServiceWorker(['stroke-cache-v6-29-2'], { precacheFailure: true, entries: {
      'stroke-cache-v6-29-2': ['https://example.test/assets/afib_timing_protocol.png']
    }});
    await expect(worker.dispatch('install')).rejects.toThrow('Precache failed');
    expect(worker.deletedEntries).toEqual([]);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.skipWaitingCount).toBe(0);
  });

  it('rejects an incomplete deferred-module installation without retiring old caches or activating', async () => {
    const worker = loadServiceWorker(['stroke-cache-v6-30-5'], { chunkFailure: true });
    await expect(worker.dispatch('install')).rejects.toThrow('Chunk unavailable');
    expect(worker.deletedEntries).toEqual([]);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.postedMessages).toEqual([]);
  });

  it('keeps installation pending until the complete shell and module cache resolves', async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const worker = loadServiceWorker([], { delayPrecache: pending });
    let installed = false;
    const installing = worker.dispatch('install').then(() => { installed = true; });
    await Promise.resolve();
    expect(installed).toBe(false);
    expect(worker.skipWaitingCount).toBe(0);
    finish();
    await installing;
    expect(installed).toBe(true);
  });

  it('stays silent on first install and does not claim or reload a page', async () => {
    const worker = loadServiceWorker([]);
    await worker.dispatch('install');
    await worker.dispatch('activate');
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.claimCount).toBe(0);
    expect(worker.postedMessages).toEqual([]);
  });

  it('retires only old app caches on natural activation after prior tabs close', async () => {
    const worker = loadServiceWorker(['foreign-cache', 'stroke-cache-v6-29-2', currentCache]);
    await worker.dispatch('activate');
    expect(worker.deletedCaches).toEqual(['stroke-cache-v6-29-2']);
    expect(worker.claimCount).toBe(0);
    expect(worker.postedMessages).toEqual([]);
  });

  it.each(['CLAIM_AND_RELOAD', 'SKIP_WAITING'])('activates a waiting worker only after %s and acknowledges after activation', async type => {
    const worker = loadServiceWorker();
    await worker.dispatch('install');
    await worker.dispatch('message', { type });
    expect(worker.skipWaitingCount).toBe(1);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toEqual([]);
    expect(worker.postedMessages).toEqual([]);
    await worker.dispatch('activate');
    expect(worker.claimCount).toBe(1);
    expect(worker.deletedCaches).toContain('stroke-cache-v6-21-0');
    expect(worker.deletedCaches).not.toContain(currentCache);
    expect(worker.postedMessages).toEqual([{ type: 'sw-claimed-reload', version }]);
  });

  it('blocks activation with another legacy tab open and supports retry after it closes', async () => {
    const worker = loadServiceWorker();
    const requesterMessages = [];
    const otherMessages = [];
    const requester = { id: 'requester', url: 'https://example.test/', postMessage: m => requesterMessages.push(m) };
    worker.setWindows([requester, { id: 'other', url: 'https://example.test/#/encounter', postMessage: m => otherMessages.push(m) }]);
    await worker.dispatch('install');
    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toEqual([]);
    expect(requesterMessages[0]).toMatchObject({ type: 'sw-update-ready', blocked: true });
    expect(requesterMessages[0].version).toContain('close other Stroke tabs');
    expect(otherMessages).toEqual([]);
    worker.setWindows([requester]);
    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });
    await worker.dispatch('activate');
    expect(worker.skipWaitingCount).toBe(1);
    expect(requesterMessages.at(-1)).toEqual({ type: 'sw-claimed-reload', version });
    expect(otherMessages).toEqual([]);
  });

  it('acknowledges an active-worker retry only to the requesting window', async () => {
    const worker = loadServiceWorker();
    await worker.dispatch('activate');
    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });
    expect(worker.claimCount).toBe(1);
    expect(worker.postedMessages).toEqual([{ type: 'sw-claimed-reload', version }]);
    expect(worker.matchAllOptions).toContainEqual({ type: 'window', includeUncontrolled: true });
  });

  it('ignores missing or out-of-scope requesters', async () => {
    const worker = loadServiceWorker();
    worker.setWindows([]);
    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });
    worker.setWindows([{ id: 'other', url: 'https://elsewhere.test/', postMessage() { throw Error('unexpected'); } }]);
    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });
    expect(worker.skipWaitingCount).toBe(0);
    expect(worker.claimCount).toBe(0);
  });

  it('precaches the retained shell without retired config', () => {
    for (const shell of ['./', './index.html', './app.js', './tailwind.css', './manifest.json', './offline.html', './data/clinical-reference.json']) {
      expect(workerSource).toContain(`'${shell}'`);
    }
    expect(workerSource).not.toContain("'./config.example.json'");
  });

  it('keeps the agent-API JSON and heavy infographics out of the install precache', () => {
    // The reference UI consumes one versioned JSON payload. Other data exports
    // are agent-only and must not add a duplicate corpus to the install cache.
    const match = workerSource.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);

    expect(coreAssets.filter((asset) => asset.startsWith('./data/'))).toEqual(['./data/clinical-reference.json']);

    const heavyInfographics = [
      './assets/toast_classification_infographic.png',
      './assets/dapt_flowchart_timeline.png',
      './assets/afib_timing_protocol.png',
      './assets/select_score_chart.png',
      './assets/ischemic_core_penumbra_render.png',
      './assets/aspects_10_regions_render.png',
      './assets/evt_lvo_occlusion_sites.png',
      './assets/hematoma_expansion_render.png',
    ];
    for (const png of heavyInfographics) {
      expect(coreAssets).not.toContain(png);
    }

    // Retired teaching figures must not be reintroduced by the install
    // precache after their source and clinical review removals.
    for (const stem of ['toast_classification_infographic', 'afib_timing_protocol', 'select_score_chart',
      'dapt_flowchart_timeline', 'hematoma_expansion_render', 'ischemic_core_penumbra_render', 'evt_lvo_occlusion_sites', 'aspects_10_regions_render']) {
      expect(coreAssets).not.toContain(`./assets/${stem}.svg`);
    }
  });

  it('keeps the install precache within its byte budget', () => {
    const match = workerSource.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);
    const chunks = JSON.parse(workerSource.match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1]);
    const total = [...coreAssets, ...chunks].reduce((sum, asset) => {
      const rel = asset === './' ? 'index.html' : asset.replace(/^\.\//, '');
      return sum + (existsSync(join(repoRoot, rel)) ? statSync(join(repoRoot, rel)).size : 0);
    }, 0);
    // 9.26 MB before the trim. The budget is what stops it drifting back.
    // Raised 6 -> 8 MB on 2026-08-29 with the guideline-library rebuild: 108
    // datasets went from placeholder scope lines to 3547 real recommendations,
    // and app.jsx guarantees the Guidelines tab works fully offline, so that
    // payload has to be precached. See the budget history in
    // scripts/check-asset-budget.mjs for why splitting does not avoid this.
    expect(total).toBeLessThan(2 * 1024 * 1024);
  });

  it('includes iOS splash screens in precache list', () => {
    const splashAssets = [
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
    ];
    for (const splash of splashAssets) {
      expect(workerSource).toContain(`'${splash}'`);
    }
  });

  it('verifies all files declared in CORE_ASSETS exist on disk', () => {
    const match = workerSource.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);
    for (const asset of coreAssets) {
      const relPath = asset.startsWith('./') ? asset.slice(2) : asset;
      const fullPath = join(repoRoot, relPath);
      expect(existsSync(fullPath), `Asset ${asset} should exist on disk`).toBe(true);
    }
  });

  it('precaches every generated module and verifies that the shell loads ESM', () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'app-assets.json'), 'utf8'));
    const chunks = JSON.parse(workerSource.match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1]);
    expect(chunks).toEqual(manifest.files.filter(file => file.path !== manifest.entry).map(file => './' + file.path));
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) expect(existsSync(join(repoRoot, chunk.slice(2)))).toBe(true);
    const index = readFileSync(join(repoRoot, 'index.html'), 'utf8');
    expect(index).toMatch(/<script type="module" src="app\.js\?v=/);
    expect(index).toMatch(/<link rel="modulepreload" href="app\.js\?v=/);
  });
});

describe('PWA manifest configuration', () => {
  it('uses clean relative paths for start_url, scope, id, and shortcuts for GitHub Pages installation', () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8'));

    expect(manifest.id).toBe('stroke-cds-app');
    expect(manifest.start_url).toBe('./#/encounter');
    expect(manifest.scope).toBe('./');
    for (const shortcut of manifest.shortcuts) {
      expect(shortcut.url).toMatch(/^\.\//);
    }
  });

  it('does not contain missing screenshot references', () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8'));
    expect(manifest.screenshots).toBeUndefined();
    expect(existsSync(join(repoRoot, 'screenshot1.png'))).toBe(false);
  });
});
