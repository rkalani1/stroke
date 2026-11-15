// The first-paint script clears retired Stroke storage once, not on every load: other apps on the shared
// rkalani1.github.io origin may use the same generic key names (synthetic keys only).
import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(body => body.includes("retired clinical storage"));

function store(entries) {
  const map = new Map(Object.entries(entries));
  const api = { getItem: key => (map.has(key) ? map.get(key) : null), setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key), keys: () => [...map.keys()] };
  return new Proxy(api, { ownKeys: () => [...map.keys()], getOwnPropertyDescriptor: (_, key) => (map.has(key) ? { enumerable: true, configurable: true, value: map.get(key) } : undefined) });
}
function run(local, session) {
  const root = { setAttribute() {}, getAttribute() { return 'light'; } };
  vm.runInNewContext(script, { localStorage: local, sessionStorage: session, location: { hostname: 'rkalani1.github.io' }, window: {}, matchMedia: () => ({ matches: false }), document: { documentElement: root } });
}

describe('retired storage cleanup in the first-paint script', () => {
  it('exists', () => expect(script).toBeTruthy());
  it('clears retired Stroke keys before the v7 migration and keeps unrelated keys', () => {
    const local = store({ census: 'x', apiKey: 'synthetic', 'strokeApp:old': '1', 'other-app:setting': 'keep' });
    const session = store({ telestrokeNote: 'x', 'other-app:tab': 'keep' });
    run(local, session);
    expect(local.keys().sort()).toEqual(['other-app:setting']);
    expect(session.keys()).toEqual(['other-app:tab']);
  });
  it('leaves generic key names alone once the v7 migration has run', () => {
    const local = store({ 'stroke.v7.migrated': '1', census: 'sibling', apiKey: 'sibling' });
    const session = store({ telestrokeNote: 'sibling' });
    run(local, session);
    expect(local.keys().sort()).toEqual(['apiKey', 'census', 'stroke.v7.migrated']);
    expect(session.keys()).toEqual(['telestrokeNote']);
  });
});
