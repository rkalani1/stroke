import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const workerSource = readFileSync(join(repoRoot, 'service-worker.js'), 'utf8');

function loadServiceWorker(existingCacheKeys = ['stroke-cache-v6-21-0', 'stroke-cache-v6-22-0', 'stroke-cache-v6-24-0']) {
  const handlers = new Map();
  const deletedCaches = [];
  const postedMessages = [];
  const matchAllOptions = [];
  let claimCount = 0;
  let skipWaitingCount = 0;

  const cacheStore = {
    addAll: async () => {},
    add: async () => {},
    put: async () => {},
  };

  const context = {
    Promise,
    URL,
    console: { info: () => {}, error: () => {} },
    fetch: async () => ({ ok: true, clone: () => ({ ok: true }) }),
    caches: {
      open: async () => cacheStore,
      keys: async () => existingCacheKeys,
      delete: async (key) => {
        deletedCaches.push(key);
        return true;
      },
      match: async () => null,
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (type, handler) => {
        handlers.set(type, handler);
      },
      skipWaiting: () => {
        skipWaitingCount += 1;
      },
      clients: {
        claim: async () => {
          claimCount += 1;
        },
        matchAll: async (options = {}) => {
          matchAllOptions.push(options);
          return [
            {
              postMessage: (message) => {
                postedMessages.push(message);
              },
            },
          ];
        },
      },
    },
  };

  vm.runInNewContext(workerSource, context, { filename: 'service-worker.js' });

  async function dispatch(type, data) {
    const handler = handlers.get(type);
    expect(handler, `${type} handler registered`).toBeTypeOf('function');
    let waitUntilPromise = Promise.resolve();
    handler({
      data,
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
    postedMessages,
    matchAllOptions,
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
    expect(workerSource).toContain(`const CACHE_NAME  = 'stroke-cache-v${version.replaceAll('.', '-')}'`);
    expect(indexSource).toContain(`app.js?v=${version}`);
    expect(indexSource).toContain(`tailwind.css?v=${version}`);
    expect(indexSource).toContain(`const APP_VERSION = '${version}'`);

    const appSource = readFileSync(join(repoRoot, 'src', 'app.jsx'), 'utf8');
    expect(appSource).toContain(`const APP_VERSION = '${version}'`);
  });

  it('stages updates without claiming clients during activate', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.skipWaitingCount).toBe(1);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toContain('stroke-cache-v6-21-0');
    expect(worker.deletedCaches).toContain('stroke-cache-v6-22-0');
    expect(worker.deletedCaches).not.toContain('stroke-cache-v6-24-0');
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-update-ready', version: '6.24.0' });
  });

  it('stays silent on a first install so new visitors are not told about an update', async () => {
    // No prior stroke-cache-v* exists: this activate is a first install, not an
    // upgrade. Broadcasting here showed every first-time visitor the "a new
    // version of Stroke is ready" banner on the page they had just opened.
    const worker = loadServiceWorker([]);

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.postedMessages).toEqual([]);
    expect(worker.claimCount).toBe(0);
  });

  it('still announces an upgrade when only a foreign cache is present alongside an older release', async () => {
    const worker = loadServiceWorker(['some-unrelated-cache', 'stroke-cache-v6-22-0']);

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.postedMessages).toContainEqual({ type: 'sw-update-ready', version: '6.24.0' });
  });

  it('stays silent when only unrelated caches exist', async () => {
    const worker = loadServiceWorker(['workbox-precache', 'some-unrelated-cache']);

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.postedMessages).toEqual([]);
  });

  it('claims clients and requests reload for the current update message', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.24.0' });
  });

  it('claims clients and requests reload for legacy SKIP_WAITING messages', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'SKIP_WAITING' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.24.0' });
  });

  it('precaches the app shell and the config the app actually fetches', () => {
    for (const shell of ['./', './index.html', './app.js', './tailwind.css', './manifest.json', './offline.html']) {
      expect(workerSource).toContain(`'${shell}'`);
    }
    // config.example.json is the ONE runtime fetch in src/ (src/app.jsx), so it
    // stays precached.
    expect(workerSource).toContain("'./config.example.json'");
  });

  it('keeps the agent-API JSON and heavy infographics out of the install precache', () => {
    // data/*.json is the machine-readable agent / llms.txt API. Nothing under
    // src/ fetches it — the app compiles its guideline JSON into the bundle —
    // so precaching it made every first-time visitor download ~929 KB of a
    // second copy of data they already had. The large infographics (~3.6 MB)
    // are lazy-loaded and opened by a minority of visitors. Both are still
    // cached on first request by the cache-first same-origin fetch path, so
    // offline availability after a visit is unchanged.
    const match = workerSource.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);

    expect(coreAssets.filter((asset) => asset.startsWith('./data/'))).toEqual([]);

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

    // The SVG companions are small and stay precached.
    expect(coreAssets).toContain('./assets/toast_classification_infographic.svg');
  });

  it('keeps the install precache within its byte budget', () => {
    const match = workerSource.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);
    const total = coreAssets.reduce((sum, asset) => {
      const rel = asset === './' ? 'index.html' : asset.replace(/^\.\//, '');
      return sum + (existsSync(join(repoRoot, rel)) ? statSync(join(repoRoot, rel)).size : 0);
    }, 0);
    // 9.26 MB before the trim. The budget is what stops it drifting back.
    // Raised 6 -> 8 MB on 2026-08-29 with the guideline-library rebuild: 108
    // datasets went from placeholder scope lines to 3547 real recommendations,
    // and app.jsx guarantees the Guidelines tab works fully offline, so that
    // payload has to be precached. See the budget history in
    // scripts/check-asset-budget.mjs for why splitting does not avoid this.
    expect(total).toBeLessThan(8 * 1024 * 1024);
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
