import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const worker = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

function harness({ offline = false, cached = null, cachedHtml = null } = {}) {
  const handlers = new Map();
  const requests = [];
  const removed = [];
  vm.runInNewContext(worker, {
    URL, Response, Promise, console: { info() {} },
    fetch: async (request, options) => {
      requests.push({ url: request.url, options });
      if (offline) throw new Error('offline');
      return new Response('current resource');
    },
    caches: {
      match: async (request) => typeof request === 'string' && request.endsWith('.html') ? cachedHtml : cached,
      keys: async () => ['unrelated-cache', 'stroke-cache-v6-29-2'],
      delete: async (key) => { removed.push(key); return true; },
      open: async () => ({ put: async () => {} }),
    },
    self: {
      location: { origin: 'https://example.test' },
      addEventListener: (name, handler) => handlers.set(name, handler),
      clients: { matchAll: async () => [] },
    },
  });
  return {
    requests, removed,
    async fetch(path, { navigate = false } = {}) {
      let response;
      handlers.get('fetch')({
        request: { method: 'GET', url: `https://example.test${path}`,
          mode: navigate ? 'navigate' : 'cors', headers: new Map() },
        respondWith: (promise) => { response = promise; },
      });
      return response;
    },
    async activate() {
      let done;
      handlers.get('activate')({ waitUntil: (promise) => { done = promise; } });
      await done;
    },
  };
}

describe('retired education resource delivery', () => {
  it.each([
    '/assets/afib_timing_protocol.svg',
    '/stroke/assets/select_score_chart.png?old=1',
    '/stroke/documents/exam/coma%20exam.pdf?legacy=1',
    '/stroke/documents/references/Intracranial%20Hypertension%20%26%20Herniation.pdf',
    '/stroke/documents/antiplatelet/DAPT%20After%20Ischemic%20Stroke-TIA.jpeg',
  ])
    ('blocks stale cached content at %s without consulting the network', async (path) => {
      const h = harness({ cached: new Response('withdrawn diagram') });
      const response = await h.fetch(path, { navigate: true });
      expect(response.status).toBe(410);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).not.toContain('withdrawn diagram');
      expect(h.requests).toHaveLength(0);
    });

  it.each([false, true])('never returns the app HTML as an uncached offline PDF (navigation: %s)', async (navigate) => {
    const response = await harness({ offline: true, cachedHtml: new Response('<html>App shell</html>') })
      .fetch('/stroke/documents/valid.pdf', { navigate });
    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('text/plain');
  });

  it('returns a previously cached PDF for offline document navigation', async () => {
    const response = await harness({ offline: true,
      cached: new Response('%PDF-current', { headers: { 'Content-Type': 'application/pdf' } }),
      cachedHtml: new Response('<html>App shell</html>'),
    }).fetch('/stroke/documents/valid.pdf', { navigate: true });
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(await response.text()).toBe('%PDF-current');
  });

  it('preserves the offline shell for app navigation', async () => {
    const response = await harness({ offline: true, cachedHtml: new Response('<html>App shell</html>') })
      .fetch('/stroke/', { navigate: true });
    expect(await response.text()).toContain('App shell');
  });

  it('revalidates retained PDF downloads online', async () => {
    const h = harness();
    expect(await (await h.fetch('/stroke/documents/valid.pdf')).text()).toBe('current resource');
    expect(h.requests[0].options.cache).toBe('no-cache');
  });

  it('retires only this application’s older caches', async () => {
    const h = harness();
    await h.activate();
    expect(h.removed).toEqual(['stroke-cache-v6-29-2']);
  });
});
