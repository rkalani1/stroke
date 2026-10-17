// SPS-02: an install must not stage a module graph that names modules the worker does not
// cache (a half-swapped Pages deploy), because the shell is then served cache-first as a
// blank app until the next release. SPS-10: offline, an in-scope sub-path must not be
// answered with the shell at that deeper URL (its relative modules would not resolve).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const version = source.match(/const APP_VERSION\s*=\s*'([^']+)'/)[1];
const chunks = JSON.parse(source.match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1]);
const referenceFixture = JSON.parse(readFileSync(new URL('../data/clinical-reference.json', import.meta.url), 'utf8'));
referenceFixture._meta.appVersion = version;
const entryName = chunks.find(chunk => /QuickSearch-/.test(chunk)).replace('./chunks/', '');

// A server whose files the install fetches; `files` overrides the default coherent bodies.
function harness(scope, files = {}) {
  const handlers = new Map();
  const entries = new Map();
  const href = value => new URL(typeof value === 'string' ? value : value.url, scope).href;
  const body = url => {
    const relative = url.slice(scope.length);
    if (relative in files) return files[relative];
    if (relative === 'data/clinical-reference.json') return JSON.stringify(referenceFixture);
    if (relative === 'index.html' || relative === '') return `<link rel="modulepreload" href="chunks/${chunks[0].replace('./chunks/', '')}"><script type="module" src="app.js?v=${version}"></script>`;
    if (relative === 'app.js') return `import"./chunks/${chunks[0].replace('./chunks/', '')}";const s=()=>import("./chunks/${entryName}");`;
    return 'export{};';
  };
  const cache = {
    match: async key => entries.get(href(key))?.clone(),
    put: async (key, value) => { entries.set(href(key), value.clone()); },
    addAll: async requests => { for (const request of requests) entries.set(request.url, new Response(body(request.url))); },
    add: async () => {},
    keys: async () => [...entries.keys()].map(url => new Request(url)),
    delete: async key => entries.delete(href(key)),
  };
  let offline = false;
  vm.runInNewContext(source, {
    URL, Request, Response, Promise, console: { warn() {} },
    fetch: async request => { if (offline) throw Error('offline'); return new Response('online 404 page', { status: 404, headers: { 'Content-Type': 'text/html' } }); },
    caches: { open: async () => cache, keys: async () => [], match: async () => undefined, delete: async () => true },
    self: { location: { origin: new URL(scope).origin }, registration: { scope }, addEventListener: (name, handler) => handlers.set(name, handler) },
  });
  return {
    entries,
    goOffline() { offline = true; },
    async install() { let done; handlers.get('install')({ waitUntil: promise => { done = promise; } }); await done; },
    async navigate(path) {
      const request = new Request(new URL(path, scope).href, { headers: { accept: 'text/html' } });
      Object.defineProperty(request, 'mode', { value: 'navigate' });
      let response;
      handlers.get('fetch')({ request, respondWith: promise => { response = promise; } });
      return await response;
    },
  };
}

for (const scope of ['https://example.test/', 'https://example.test/stroke/']) {
  describe(`deploy coherence at ${new URL(scope).pathname}`, () => {
    it('installs a deployment whose shell and entry name only listed modules', async () => {
      await expect(harness(scope).install()).resolves.toBeUndefined();
    });

    it('refuses an install when the staged entry imports a module missing from the worker list', async () => {
      const stale = { 'app.js': 'import"./chunks/chunk-ZZZZZZZZ.js";const s=()=>import("./chunks/QuickSearch-OLDOLD00.js");' };
      await expect(harness(scope, stale).install()).rejects.toThrow(/app\.js references unlisted module chunk-ZZZZZZZZ\.js/);
    });

    it('refuses an install when the staged index.html preloads an unlisted module', async () => {
      const stale = { 'index.html': '<link rel="modulepreload" href="chunks/chunk-ZZZZZZZZ.js">' };
      await expect(harness(scope, stale).install()).rejects.toThrow(/index\.html references unlisted module chunk-ZZZZZZZZ\.js/);
    });

    it('refuses an install when a staged chunk imports an unlisted chunk', async () => {
      const stale = { [chunks[1].replace('./', '')]: 'import{a}from"./chunk-ZZZZZZZZ.js";' };
      await expect(harness(scope, stale).install()).rejects.toThrow(/references unlisted module chunk-ZZZZZZZZ\.js/);
    });

    it('offline, redirects a deeper in-scope navigation to the scope root and still serves the root', async () => {
      const h = harness(scope);
      await h.install();
      h.goOffline();
      const deep = await h.navigate('encounter/deep');
      expect(deep.status).toBe(302);
      expect(deep.headers.get('location')).toBe(scope);
      const root = await h.navigate('');
      expect(root.status).toBe(200);
      expect(await root.text()).toContain('app.js?v=');
      // A same-directory path keeps its relative module URLs valid, so it still gets the shell.
      expect(await (await h.navigate('encounter')).text()).toContain('app.js?v=');
    });

    it('online, leaves a deeper navigation to the network (the Pages 404 page)', async () => {
      const h = harness(scope);
      await h.install();
      expect((await h.navigate('encounter/deep')).status).toBe(404);
    });
  });
}
