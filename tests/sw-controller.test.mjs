import test from 'node:test';
import assert from 'node:assert';

/**
 * Mocks for Service Worker API and Window Location
 */
const mockServiceWorker = {
  addEventListener: (type, handler) => {
    mockServiceWorker._handlers[type] = handler;
  },
  getRegistration: async () => mockServiceWorker._registration,
  _handlers: {},
  _registration: null
};

const mockLocation = {
  reload: () => {
    mockLocation._reloaded = true;
  },
  _reloaded: false
};

// Define globals BEFORE importing the module under test.
// We use dynamic import below to ensure these are set first.
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  configurable: true,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    location: mockLocation
  },
  configurable: true,
  writable: true
});

// Use dynamic import to ensure globals are defined before the module is evaluated.
const { onUpdateReady, bindSWController, acceptUpdate } = await import('../src/design/sw-controller.js');

test('onUpdateReady: registers a listener and handles execution errors', () => {
  let count = 0;
  const cb1 = () => { count++; };
  const cb2 = () => { throw new Error('Simulated listener error'); };
  const cb3 = () => { count++; };

  onUpdateReady(cb1);
  onUpdateReady(cb2);
  const unregister3 = onUpdateReady(cb3);

  // Trigger notify via internal message handling
  bindSWController();
  const handler = mockServiceWorker._handlers['message'];
  if (!handler) assert.fail('Message handler not registered');

  handler({ data: { type: 'sw-update-ready', version: '2.0.0' } });

  assert.strictEqual(count, 2, 'Both healthy listeners should have been called despite cb2 throwing');

  // Test unregister
  unregister3();
  count = 0;
  handler({ data: { type: 'sw-update-ready', version: '2.1.0' } });
  assert.strictEqual(count, 1, 'Only one listener should remain after unregistering');
});

test('bindSWController: attaches a message listener and handles reload signal', () => {
  mockLocation._reloaded = false;
  bindSWController();

  const handler = mockServiceWorker._handlers['message'];
  assert.strictEqual(typeof handler, 'function', 'Message handler should be registered');

  handler({ data: { type: 'sw-claimed-reload' } });
  assert.strictEqual(mockLocation._reloaded, true, 'Window should have been reloaded');
});

test('acceptUpdate: posts CLAIM_AND_RELOAD to waiting or active worker', async () => {
  let postedToWaiting = null;
  const mockWaiting = {
    postMessage: (msg) => { postedToWaiting = msg; }
  };

  let postedToActive = null;
  const mockActive = {
    postMessage: (msg) => { postedToActive = msg; }
  };

  // Scenario 1: Waiting worker exists
  mockServiceWorker._registration = { waiting: mockWaiting, active: mockActive };
  await acceptUpdate();
  assert.deepStrictEqual(postedToWaiting, { type: 'CLAIM_AND_RELOAD' }, 'Should post to waiting worker if available');
  assert.strictEqual(postedToActive, null, 'Should not post to active worker if waiting exists');

  // Scenario 2: Only active worker exists
  postedToWaiting = null;
  postedToActive = null;
  mockServiceWorker._registration = { waiting: null, active: mockActive };
  await acceptUpdate();
  assert.deepStrictEqual(postedToActive, { type: 'CLAIM_AND_RELOAD' }, 'Should fallback to active worker if waiting is missing');

  // Scenario 3: No workers exist
  mockServiceWorker._registration = { waiting: null, active: null };
  await acceptUpdate(); // Should not throw
});

test('acceptUpdate: handles environments without serviceWorker support', async () => {
  const originalNavigator = global.navigator;
  // Temporarily remove serviceWorker
  Object.defineProperty(global, 'navigator', {
    value: {},
    configurable: true,
    writable: true
  });

  try {
    await acceptUpdate();
    // Should not throw and should return early
  } finally {
    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  }
});
