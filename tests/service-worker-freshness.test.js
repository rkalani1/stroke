import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const currentName = source.match(/const CACHE_NAME\s*=\s*'([^']+)'/)[1];
const version = source.match(/const APP_VERSION\s*=\s*'([^']+)'/)[1];
const referenceFixture = JSON.parse(readFileSync(new URL('../data/clinical-reference.json', import.meta.url), 'utf8'));
referenceFixture._meta.appVersion = version;

function harness(scope, { offline = true, body = 'fresh network', contentType = 'text/javascript', writeFailure = false, beforePut } = {}) {
  const handlers = new Map();
  const entries = new Map();
  const oldEntries = new Map();
  const opens = [];
  const network = [];
  const installs = [];
  let globalMatches = 0;
  const href = value => new URL(typeof value === 'string' ? value : value.url, scope).href;
  const cache = {
    match: async key => entries.get(href(key))?.clone(),
    put: async (key, value) => {
      if (beforePut) await beforePut(href(key));
      if (writeFailure) throw Error('QuotaExceededError');
      entries.set(href(key), value.clone());
    },
    addAll: async requests => {
      installs.push(...requests);
      for (const request of requests) {
        if (request.url === href('data/clinical-reference.json')) {
          entries.set(request.url, new Response(JSON.stringify(referenceFixture), { headers: { 'Content-Type': 'application/json' } }));
        }
      }
    },
    add: async () => {},
    keys: async () => [...entries.keys()].map(url => new Request(url)),
    delete: async key => entries.delete(href(key)),
  };
  vm.runInNewContext(source, {
    URL, Request, Response, Promise, console: { warn() {} },
    fetch: async (request, options) => {
      network.push({ url: request.url, options });
      if (offline) throw Error('offline');
      return new Response(body, { headers: { 'Content-Type': contentType } });
    },
    caches: {
      open: async name => { opens.push(name); return cache; },
      keys: async () => [currentName],
      match: async key => { globalMatches++; return oldEntries.get(href(key))?.clone(); },
    },
    self: { location: { origin: new URL(scope).origin }, registration: { scope },
      addEventListener: (name, handler) => handlers.set(name, handler) },
  });
  return {
    entries, oldEntries, opens, network, installs,
    get globalMatches() { return globalMatches; },
    setNetworkBody(next) { body = next; },
    seed(key, body, type = 'text/javascript') { entries.set(href(key), new Response(body, { headers: { 'Content-Type': type } })); },
    async install() { let done; handlers.get('install')({ waitUntil: p => { done = p; } }); await done; },
    async fetch(key, navigate = false) {
      const request = new Request(href(key));
      if (navigate) Object.defineProperty(request, 'mode', { value: 'navigate' });
      let response;
      handlers.get('fetch')({ request, respondWith: p => { response = p; } });
      return await response;
    },
  };
}

for (const scope of ['https://example.test/', 'https://example.test/stroke/']) {
  describe(`deployment freshness in ${new URL(scope).pathname}`, () => {
    it('installs every shell Request with HTTP-cache reload and the registration scope', async () => {
      const h = harness(scope);
      await h.install();
      expect(h.installs.length).toBeGreaterThan(20);
      expect(h.installs.every(r => r instanceof Request && r.cache === 'reload' && r.url.startsWith(scope))).toBe(true);
      expect(h.installs.map(r => r.url)).toContain(new URL('index.html', scope).href);
    });

    it('uses the exact versioned app key before a stale canonical or other version', async () => {
      const h = harness(scope);
      h.seed('app.js', 'stale canonical');
      h.seed('app.js?v=old', 'stale query');
      h.seed('app.js?v=current', 'current executed script');
      expect(await (await h.fetch('app.js?v=current')).text()).toBe('current executed script');
      expect(h.globalMatches).toBe(0);
      expect(h.opens.every(name => name === currentName)).toBe(true);
    });

    it('uses only the intentional canonical shell alias when an exact query is absent', async () => {
      const h = harness(scope);
      h.seed('app.js?v=old', 'old variant');
      h.seed('app.js', 'current precache');
      expect(await (await h.fetch('app.js?v=new')).text()).toBe('current precache');
    });

    it('never substitutes an arbitrary query variant or a different cache', async () => {
      const h = harness(scope);
      h.seed('app.js?v=old', 'old variant');
      h.oldEntries.set(new URL('app.js?v=new', scope).href, new Response('foreign old bundle'));
      expect((await h.fetch('app.js?v=new')).status).toBe(503);
      expect(h.globalMatches).toBe(0);
    });

    it('uses the current exact navigation document before the shell fallback', async () => {
      const h = harness(scope);
      h.seed('./', '<html>current root</html>', 'text/html');
      h.seed('index.html', '<html>older index</html>', 'text/html');
      expect(await (await h.fetch('./', true)).text()).toContain('current root');
    });

    it('uses current-cache shell fallback without searching foreign caches', async () => {
      const h = harness(scope);
      h.seed('index.html', '<html>current index</html>', 'text/html');
      h.oldEntries.set(new URL('index.html', scope).href, new Response('old foreign shell'));
      expect(await (await h.fetch('route', true)).text()).toContain('current index');
      expect(h.globalMatches).toBe(0);
    });

    it.each(['./', 'index.html', './?publicDemo=1', 'index.html?v=new'])('keeps the installed shell at %s until the user accepts an update', async key => {
      const h = harness(scope, { offline: false, body: '<html>fresh shell</html>', contentType: 'text/html' });
      h.seed('./', '<html>installed shell</html>', 'text/html'); h.seed('index.html', '<html>installed shell</html>', 'text/html');
      expect(await (await h.fetch(key, true)).text()).toBe('<html>installed shell</html>');
      expect(h.network).toEqual([]);
    });

    it.each([['unrelated.html', 'text/html'], ['./', 'text/plain']])('does not poison shell aliases from %s / %s', async (key, contentType) => {
      const h = harness(scope, { offline: false, body: 'unrelated body', contentType });
      h.seed('index.html', '<html>good shell</html>', 'text/html');
      await h.fetch(key, true);
      expect(await h.entries.get(new URL('index.html', scope).href).text()).toBe('<html>good shell</html>');
    });

    it('waits for response persistence before completing respondWith', async () => {
      let finish;
      const pending = new Promise(resolve => { finish = resolve; });
      const h = harness(scope, { offline: false, beforePut: () => pending });
      let completed = false;
      const response = h.fetch('app.js?v=current').then(r => { completed = true; return r; });
      await new Promise(resolve => setImmediate(resolve));
      expect(completed).toBe(false);
      finish();
      expect(await (await response).text()).toBe('fresh network');
      expect(h.entries.has(new URL('app.js?v=current', scope).href)).toBe(true);
    });

    it('waits for all alias writes even when one fails, then preserves network success', async () => {
      let finish;
      const pending = new Promise(resolve => { finish = resolve; });
      const h = harness(scope, { offline: false, body: '<html>fresh shell</html>', contentType: 'text/html',
        beforePut: key => { if (key === scope) throw Error('quota'); return pending; } });
      let completed = false;
      const response = h.fetch('./', true).then(r => { completed = true; return r; });
      await new Promise(resolve => setImmediate(resolve));
      expect(completed).toBe(false);
      finish();
      expect(await (await response).text()).toBe('<html>fresh shell</html>');
      expect(h.entries.has(new URL('index.html', scope).href)).toBe(true);
    });

    it('retires historical PDFs even when a stale cache or successful network body exists', async () => {
      const h = harness(scope, { offline: false, writeFailure: true });
      h.seed('documents/current.pdf', '%PDF-stale', 'application/pdf');
      const response = await h.fetch('documents/current.pdf');
      expect(response.status).toBe(410);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).not.toContain('%PDF-stale');
      expect(h.network).toEqual([]);
    });

    it('pins an entry and its chunks to the installed release while a newer release is online', async () => {
      const h = harness(scope, { offline: false, body: 'new server entry imports new chunks' });
      h.seed('app.js', 'installed entry imports installed chunks');
      h.seed('chunks/reference-OLDHASH.js', 'installed reference records');
      expect(await (await h.fetch('app.js?v=current')).text()).toBe('installed entry imports installed chunks');
      expect(await (await h.fetch('chunks/reference-OLDHASH.js')).text()).toBe('installed reference records');
      expect(h.network).toEqual([]);
      expect(h.globalMatches).toBe(0);
    });

    it.each(['data/clinical-reference.json', 'data/clinical-reference.json?v=current'])('keeps %s paired with the installed app while a newer reference is online', async key => {
      const h = harness(scope, { offline: false, body: JSON.stringify({ ...referenceFixture, _meta: { ...referenceFixture._meta, appVersion: 'new-release' } }), contentType: 'application/json' });
      h.seed('data/clinical-reference.json', JSON.stringify(referenceFixture), 'application/json');
      expect(await (await h.fetch(key)).json()).toEqual(referenceFixture);
      expect(h.network).toEqual([]);
      expect(h.globalMatches).toBe(0);
    });

    it.each([
      ['malformed JSON', '{'],
      ['another release', JSON.stringify({ ...referenceFixture, _meta: { ...referenceFixture._meta, appVersion: 'new-release' } })],
      ['malformed data', JSON.stringify({ ...referenceFixture, data: null })],
    ])('does not cache %s after a reference cache miss and permits a corrected retry', async (_label, body) => {
      const h = harness(scope, { offline: false, body, contentType: 'application/json' });
      const key = 'data/clinical-reference.json';
      expect(await (await h.fetch(key)).text()).toBe(body);
      expect(h.entries.has(new URL(key, scope).href)).toBe(false);
      h.setNetworkBody(JSON.stringify(referenceFixture));
      expect(await (await h.fetch(key)).json()).toEqual(referenceFixture);
      expect(h.entries.has(new URL(key, scope).href)).toBe(true);
      expect(h.network).toHaveLength(2);
    });

    it('does not substitute the HTML shell or another release for a missing offline chunk', async () => {
      const h = harness(scope);
      h.seed('index.html', '<html>installed shell</html>', 'text/html');
      h.oldEntries.set(new URL('chunks/missing-HASH.js', scope).href, new Response('old records'));
      const response = await h.fetch('chunks/missing-HASH.js');
      expect(response.status).toBe(503);
      expect(response.headers.get('content-type')).toContain('text/plain');
      expect(h.globalMatches).toBe(0);
    });

    it('never exposes cached historical PDFs or the HTML shell for retired binary navigation', async () => {
      const h = harness(scope);
      h.seed('index.html', '<html>shell</html>', 'text/html');
      h.seed('documents/retained.pdf?v=current', '%PDF-current', 'application/pdf');
      for (const key of ['documents/retained.pdf?v=current', 'documents/retained.pdf?v=unknown']) {
        const response = await h.fetch(key, true);
        expect(response.status).toBe(410);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(await response.text()).not.toMatch(/%PDF|<html>/);
      }
    });

    it('does not read obsolete cache namespaces for ordinary assets', async () => {
      const h = harness(scope, { offline: false, body: 'fresh image', contentType: 'image/png' });
      h.oldEntries.set(new URL('icon-192.png', scope).href, new Response('old image'));
      expect(await (await h.fetch('icon-192.png')).text()).toBe('fresh image');
      expect(h.network[0].options.cache).toBe('no-cache');
      expect(h.globalMatches).toBe(0);
    });
  });
}
