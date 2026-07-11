import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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
      keys: async () => ['stroke-cache-v6-11-1', 'stroke-cache-v6-11-2'],
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
  it('stages updates without claiming clients during activate', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('install');
    await worker.dispatch('activate');

    expect(worker.skipWaitingCount).toBe(1);
    expect(worker.claimCount).toBe(0);
    expect(worker.deletedCaches).toContain('stroke-cache-v6-11-1');
    expect(worker.deletedCaches).not.toContain('stroke-cache-v6-11-2');
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-update-ready', version: '6.11.2' });
  });

  it('claims clients and requests reload for the current update message', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'CLAIM_AND_RELOAD' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.11.2' });
  });

  it('claims clients and requests reload for legacy SKIP_WAITING messages', async () => {
    const worker = loadServiceWorker();

    await worker.dispatch('message', { type: 'SKIP_WAITING' });

    expect(worker.claimCount).toBe(1);
    expect(worker.matchAllOptions).toContainEqual({ includeUncontrolled: true });
    expect(worker.postedMessages).toContainEqual({ type: 'sw-claimed-reload', version: '6.11.2' });
  });
});
