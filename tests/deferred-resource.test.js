import { describe, expect, it, vi } from 'vitest';
import { createDeferredResource } from '../src/deferred-resource.js';

describe('on-demand reference resource', () => {
  it('does not import anything until requested and publishes stable snapshots', async () => {
    const importer = vi.fn(async () => ({ records: [1] }));
    const resource = createDeferredResource(importer);
    expect(importer).not.toHaveBeenCalled();
    expect(resource.getSnapshot()).toBe(resource.getSnapshot());
    expect(resource.getSnapshot().status).toBe('idle');
    const notifications = [];
    resource.subscribe(() => notifications.push(resource.getSnapshot().status));
    const value = await resource.load();
    expect(value.records).toEqual([1]);
    expect(notifications).toEqual(['loading', 'ready']);
    expect(await resource.load()).toBe(value);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('deduplicates rapid clicks and a subscriber asking to load during notification', async () => {
    let complete;
    const importer = vi.fn(() => new Promise(resolve => { complete = resolve; }));
    const resource = createDeferredResource(importer);
    let fromSubscriber;
    resource.subscribe(() => { if (resource.getSnapshot().status === 'loading') fromSubscriber = resource.load(); });
    const first = resource.load();
    expect(resource.load()).toBe(first);
    expect(fromSubscriber).toBe(first);
    await Promise.resolve();
    expect(importer).toHaveBeenCalledTimes(1);
    complete({ ready: true });
    await expect(first).resolves.toEqual({ ready: true });
  });

  it('leaves a failure visible without an automatic retry loop and permits explicit retry', async () => {
    const importer = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ready: true });
    const resource = createDeferredResource(importer);
    const states = [];
    const unsubscribe = resource.subscribe(() => states.push(resource.getSnapshot().status));
    await expect(resource.load()).rejects.toThrow('offline');
    expect(resource.getSnapshot()).toMatchObject({ status: 'error', value: null });
    await Promise.resolve();
    expect(importer).toHaveBeenCalledTimes(1);
    expect(await resource.load()).toEqual({ ready: true });
    expect(states).toEqual(['loading', 'error', 'loading', 'ready']);
    unsubscribe();
    await resource.load();
    expect(states).toHaveLength(4);
  });

  it('normalizes synchronous loader errors to a rejected request', async () => {
    const resource = createDeferredResource(() => { throw Error('bad import'); });
    await expect(resource.load()).rejects.toThrow('bad import');
    expect(resource.getSnapshot().status).toBe('error');
  });
});
