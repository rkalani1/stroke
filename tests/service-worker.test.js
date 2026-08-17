import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const workerSource = readFileSync(join(repoRoot, 'service-worker.js'), 'utf8');

function loadServiceWorker() {
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
      keys: async () => ['stroke-cache-v6-15-0', 'stroke-cache-v6-16-0', 'stroke-cache-v6-17-0'],
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
  });

  it('stages updates without claiming clients during activate', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.skipWaitingCount).toBe(1);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toContain('stroke-cache-v6-15-0');
    expect(worker.deletedCaches).toContain('stroke-cache-v6-16-0');
    expect(worker.deletedCaches).not.toContain('stroke-cache-v6-17-0');
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-update-ready', version: '6.17.0' });
  });

  it('claims clients and requests reload for the current update message', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.17.0' });
  });

  it('claims clients and requests reload for legacy SKIP_WAITING messages', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'SKIP_WAITING' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.17.0' });
  });

  it('includes static JSON clinical endpoints, core assets, and iOS splash screens in precache list', () => {
    expect(workerSource).toContain("'./data/index.json'");
    expect(workerSource).toContain("'./whats-new.json'");
    expect(workerSource).toContain("'./config.example.json'");
    expect(workerSource).toContain("'./data/guidelines/index.json'");
    expect(workerSource).toContain("'./data/management-cards.json'");
    expect(workerSource).toContain("'./data/generic-protocols.json'");
    expect(workerSource).toContain("'./data/calculators-index.json'");
    expect(workerSource).toContain("'./data/atlas/active-trials.json'");
    expect(workerSource).toContain("'./data/atlas/completed-trials.json'");

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
