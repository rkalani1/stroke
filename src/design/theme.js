/**
 * v7.0 — Theme controller + one-shot v7 migration.
 * Drop-in: src/design/theme.js
 *
 * Owns the `data-theme` attribute on <html> and the `dark` class fallback.
 * Reads preference from localStorage['stroke.v7.theme'] (one of:
 * 'auto' | 'light' | 'dark'). Defaults to light on public Pages.
 *
 * Also performs a one-shot v7 migration keyed off the absence of
 * localStorage['stroke.v7.migrated']. The migration is intentionally tiny:
 * it copies the v5 'darkMode' boolean into the v7 'stroke.v7.theme' string
 * so users don't lose their preference. No clinical state is touched.
 */

const PREF_KEY = 'stroke.v7.theme';
const MIGRATED_KEY = 'stroke.v7.migrated';

const isPublicPages = () => (
  typeof window !== 'undefined'
  && /(^|\.)github\.io$/i.test(window.location.hostname || '')
);

const safeGet = (k) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k, v) => {
  try { localStorage.setItem(k, v); } catch { /* ignore quota */ }
};
const safeJSONGet = (k) => {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
};

/* One-shot v7 migration. Called once on first v7 load.
   Safe to re-call: short-circuits after the first run via stroke.v7.migrated. */
export function runV7Migration() {
  if (safeGet(MIGRATED_KEY)) return;
  if (isPublicPages()) {
    try { localStorage.removeItem(PREF_KEY); } catch { /* ignore */ }
    safeSet(MIGRATED_KEY, '1');
    return;
  }
  /* Carry forward the v5 darkMode preference. v5 stored under:
     - strokeApp:darkMode (namespaced wrapper from index.html bootstrap)
     - darkMode (legacy bare key) */
  const v5Dark = safeJSONGet('strokeApp:darkMode') ?? safeJSONGet('darkMode');
  if (v5Dark === true && !safeGet(PREF_KEY)) {
    safeSet(PREF_KEY, 'dark');
  }
  safeSet(MIGRATED_KEY, '1');
}

/* Read preference, defaulting to light on public Pages. */
export function getThemePref() {
  if (isPublicPages()) return 'light';
  return safeGet(PREF_KEY) || 'auto';
}

/* Persist preference. 'auto' deletes the key so OS pref wins. */
export function setThemePref(value) {
  if (value === 'auto') {
    try { localStorage.removeItem(PREF_KEY); } catch { /* ignore */ }
  } else {
    safeSet(PREF_KEY, value);
  }
  applyTheme();
}

/* Resolve current effective theme — 'light' | 'dark'. */
export function effectiveTheme() {
  const pref = getThemePref();
  if (pref === 'light' || pref === 'dark') return pref;
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}

/* Apply the effective theme to <html>. Sets BOTH data-theme="dark" and the
   `dark` class so tailwind's darkMode:['class','[data-theme="dark"]'] config
   resolves either way. */
export function applyTheme() {
  if (typeof document === 'undefined') return;
  const eff = effectiveTheme();
  document.documentElement.setAttribute('data-theme', eff);
  document.documentElement.classList.toggle('dark', eff === 'dark');
}

/* Bind a listener so OS pref changes update the page in 'auto' mode. */
export function bindThemeListener() {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => { if (getThemePref() === 'auto') applyTheme(); };
  mq.addEventListener?.('change', handler);
  return () => mq.removeEventListener?.('change', handler);
}

/* Top-level bootstrap — call from src/app.jsx at root mount. */
export function bootstrapTheme() {
  runV7Migration();
  applyTheme();
  return bindThemeListener();
}
