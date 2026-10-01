// The pre-paint theme scripts in index.html and offline.html run before
// app.js loads, so they inline the theme rule instead of importing it. This
// executes each inline script against every host / stored preference / OS
// setting combination and requires the attribute it sets to equal
// src/design/theme.js resolveTheme() — the first paint must never disagree
// with what the app applies once it boots (no light→dark flash).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { resolveTheme } from '../src/design/theme.js';

const ROOT = path.resolve(__dirname, '..');

function prePaintScript(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const scripts = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const script = scripts.find((s) => s.includes("'stroke.v7.theme'"));
  if (!script) throw new Error(`${file}: no pre-paint theme script found`);
  return script;
}

function run(script, { hostname, stored, prefersDark, legacyDark }) {
  const store = new Map();
  if (stored !== undefined) store.set('stroke.v7.theme', stored);
  if (legacyDark) store.set('strokeApp:darkMode', 'true');
  const attrs = {};
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; }
  };
  const window = {
    location: { hostname, search: '' },
    matchMedia: (q) => ({ matches: q === '(prefers-color-scheme: dark)' && prefersDark })
  };
  const context = {
    window,
    location: window.location,
    matchMedia: window.matchMedia,
    localStorage,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 },
    document: { documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, classList: { toggle() {}, add() {} } } },
    console: { log() {}, warn() {} },
    URLSearchParams
  };
  // Object.keys(localStorage) in index.html's clean-up path
  Object.defineProperty(localStorage, Symbol.iterator, { value: function* () { yield* store.keys(); } });
  vm.runInNewContext(script, context);
  return attrs['data-theme'];
}

const HOSTS = [
  { hostname: 'rkalani1.github.io', isPublic: true },
  { hostname: 'localhost', isPublic: false },
  { hostname: 'stroke.example.org', isPublic: false }
];

describe.each(['index.html', 'offline.html'])('%s pre-paint theme', (file) => {
  const script = prePaintScript(file);

  it('sets data-theme exactly as src/design/theme.js resolveTheme() would', () => {
    for (const { hostname, isPublic } of HOSTS) {
      for (const stored of [undefined, 'light', 'dark', 'auto', 'chartreuse']) {
        for (const prefersDark of [false, true]) {
          const got = run(script, { hostname, stored, prefersDark });
          expect(got, `${hostname} pref=${stored} osDark=${prefersDark}`)
            .toBe(resolveTheme(stored ?? null, prefersDark, isPublic));
        }
      }
    }
  });

  it('preserves current theme preferences across retired legacy-storage cleanup', () => {
    expect(run(script, { hostname: 'localhost', prefersDark: false, legacyDark: true })).toBe(file === 'index.html' ? 'light' : 'dark');
    // an explicit v7 choice wins over the legacy flag
    expect(run(script, { hostname: 'localhost', stored: 'light', prefersDark: false, legacyDark: true })).toBe('light');
    // public Pages ignores (and index.html removes) the legacy key
    expect(run(script, { hostname: 'rkalani1.github.io', prefersDark: false, legacyDark: true })).toBe('light');
  });
});

it('uses declared retained tokens for every workspace theme variable', () => {
  const tokens=fs.readFileSync(path.join(ROOT,'src/design/tokens.css'),'utf8');
  const shell=fs.readFileSync(path.join(ROOT,'src/design/shell.css'),'utf8');
  for(const [,name] of shell.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) expect(tokens.includes(name+':'),name).toBe(true);
});
