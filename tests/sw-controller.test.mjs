import test from 'node:test';
import assert from 'node:assert/strict';
let moduleId = 0;
async function fixture() {
  const handlers = {};
  let reloads = 0;
  const posted = [];
  const worker = { postMessage: message => posted.push(message) };
  const sw = { controller: {}, addEventListener: (type, handler) => { handlers[type] = handler; }, getRegistration: async () => sw.registration, registration: { waiting: worker } };
  Object.defineProperty(globalThis, 'navigator', { value: { serviceWorker: sw }, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: { location: { reload() { reloads++; } } }, configurable: true });
  const api = await import(`../src/design/sw-controller.js?test=${++moduleId}`);
  api.bindSWController();
  return { api, handlers, sw, posted, get reloads() { return reloads; } };
}

test('unsolicited reload messages and controller changes never reload an active encounter', async () => {
  const f = await fixture();
  const notices = [];
  f.api.onUpdateReady(message => notices.push(message));
  f.handlers.message({ data: { type: 'sw-claimed-reload' } });
  f.handlers.controllerchange();
  assert.equal(f.reloads, 0);
  assert.equal(notices.length, 1);
});

test('first install without a controller stays silent', async () => {
  const f = await fixture();
  f.sw.controller = null;
  const notices = [];
  f.api.onUpdateReady(message => notices.push(message));
  f.handlers.controllerchange();
  assert.equal(f.reloads, 0);
  assert.deepEqual(notices, []);
});

test('explicit acceptance posts the message and duplicate acknowledgments reload only once', async () => {
  const f = await fixture();
  await f.api.acceptUpdate();
  assert.deepEqual(f.posted, [{ type: 'CLAIM_AND_RELOAD' }]);
  f.handlers.controllerchange();
  f.handlers.message({ data: { type: 'sw-claimed-reload' } });
  f.handlers.controllerchange();
  assert.equal(f.reloads, 1);
});

test('a blocked multi-tab request resets consent, presents guidance, and can be retried', async () => {
  const f = await fixture();
  const notices = [];
  f.api.onUpdateReady(message => notices.push(message));
  await f.api.acceptUpdate();
  f.handlers.message({ data: { type: 'sw-update-ready', blocked: true, message: 'Close other Stroke tabs' } });
  f.handlers.controllerchange();
  f.handlers.message({ data: { type: 'sw-claimed-reload' } });
  assert.equal(f.reloads, 0);
  assert.equal(notices[0].message, 'Close other Stroke tabs');
  await f.api.acceptUpdate();
  f.handlers.message({ data: { type: 'sw-claimed-reload' } });
  assert.equal(f.reloads, 1);
});

test('uses the current waiting worker before a stale reference, then active fallback', async () => {
  const f = await fixture();
  const stale = { postMessage() { throw Error('stale worker used'); } };
  await f.api.acceptUpdate(stale);
  assert.equal(f.posted.length, 1);
  f.sw.registration = { active: { postMessage: message => f.posted.push(message) } };
  await f.api.acceptUpdate();
  assert.equal(f.posted.length, 2);
  f.sw.registration = {};
  await f.api.acceptUpdate();
  assert.equal(f.posted.length, 2);
});

test('posting failure does not leave reload consent armed', async () => {
  const f = await fixture();
  f.sw.registration = { waiting: { postMessage() { throw Error('worker unavailable'); } } };
  await assert.rejects(f.api.acceptUpdate(), /worker unavailable/);
  f.handlers.controllerchange();
  assert.equal(f.reloads, 0);
});

test('notification listeners can unsubscribe and cannot suppress later listeners', async () => {
  const f = await fixture();
  const notices = [];
  f.api.onUpdateReady(() => { throw Error('listener failure'); });
  const off = f.api.onUpdateReady(data => notices.push(data));
  f.handlers.message({ data: { type: 'sw-update-ready', version: 'next' } });
  assert.equal(notices.length, 1);
  off();
  f.handlers.message({ data: { type: 'sw-update-ready', version: 'next' } });
  f.handlers.message({});
  assert.equal(notices.length, 1);
});

test('environments without service workers are safe', async () => {
  const f = await fixture();
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  await f.api.acceptUpdate();
  assert.equal(f.reloads, 0);
});
