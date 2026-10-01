/**
 * v7.0 — Theme controller + one-shot v7 migration.
 * Drop-in: src/design/theme.js
 *
 * Owns the `data-theme` attribute on <html> — the ONLY dark-mode hook the
 * CSS reads (tokens.css `[data-theme="dark"]`, Tailwind's dark: variant,
 * shell.css). Reads preference from localStorage['stroke.v7.theme'] (one of:
 * 'auto' | 'light' | 'dark'). Defaults to light on public Pages.
 *
 * resolveTheme() is the single statement of the rule. The pre-paint scripts
 * in index.html and offline.html inline the same rule (they run before this
 * bundle loads) so the first paint already matches on every host.
 *
 * Also performs a one-shot v7 migration keyed off the absence of
 * localStorage['stroke.v7.migrated']. The migration is intentionally tiny:
 * it copies the v5 'darkMode' boolean into the v7 'stroke.v7.theme' string
 * so users don't lose their preference. No clinical state is touched.
 */

const PREF_KEY = 'stroke.v7.theme';
const MIGRATED_KEY = 'stroke.v7.migrated';
let transientPref = null;

const isPublicPages = () => (
  typeof window !== 'undefined'
  && /(^|\.)github\.io$/i.test(window.location.hostname || '')
);

const safeGet = (k) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k, v) => {
  try { localStorage.setItem(k, v); return true; } catch { return false; }
};
const safeJSONGet = (k) => {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
};

/* One-shot v7 migration. Called once on first v7 load.
   Safe to re-call: short-circuits after the first run via stroke.v7.migrated. */
export function runV7Migration() {
  if (safeGet(MIGRATED_KEY)) return;
  if (isPublicPages()) {
    try { localStorage.removeItem('darkMode'); } catch { /* ignore */ }
    try { localStorage.removeItem('strokeApp:darkMode'); } catch { /* ignore */ }
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

/* Read preference.
   - Public Pages: honor an EXPLICIT stored choice ('light'|'dark'|'auto'),
     else default to 'light' (so existing public users — who have no stored
     pref because runV7Migration removes it — see no change). This lets a user
     reach Dark/System on public via an explicit selection, while keeping the
     unset default light.
   - Non-public: default to 'auto' so OS preference wins when unset. */
export function getThemePref() {
  if (transientPref !== null) return transientPref;
  const stored = safeGet(PREF_KEY);
  if (isPublicPages()) {
    return (stored === 'light' || stored === 'dark' || stored === 'auto')
      ? stored
      : 'light';
  }
  return stored || 'auto';
}

/* Persist preference — including 'auto', which is written explicitly rather
   than deleted.

   Deleting the key used to make 'System' unreachable on public Pages: the
   delete left the key unset, and getThemePref() reads unset-on-public as
   'light', so choosing System silently snapped back to Light and the OS
   dark-mode preference was never honored on the deployed site. Writing 'auto'
   keeps "never chosen" (unset → light on public) and "chose System" as
   distinct states, which is what the 3-way control needs. */
export function setThemePref(value) {
  const next = (value === 'light' || value === 'dark' || value === 'auto') ? value : 'auto';
  // A blocked/quota-limited store must not make the visible control inert.
  // Keep the explicit choice for this page when it cannot be persisted.
  transientPref = safeSet(PREF_KEY, next) ? null : next;
  applyTheme();
}

/* The theme rule, as a pure function (mirrored by the index.html and
   offline.html pre-paint scripts):
     'light' | 'dark'  → that theme
     'auto'            → the OS preference
     unset / unknown   → light on public Pages, the OS preference elsewhere */
export function resolveTheme(pref, prefersDark, isPublic) {
  const mode = (pref === 'light' || pref === 'dark' || pref === 'auto')
    ? pref
    : (isPublic ? 'light' : 'auto');
  if (mode === 'auto') return prefersDark ? 'dark' : 'light';
  return mode;
}

const prefersDarkScheme = () => (
  typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
);

/* Resolve current effective theme — 'light' | 'dark'. */
export function effectiveTheme() {
  return resolveTheme(getThemePref(), prefersDarkScheme(), isPublicPages());
}

/* Apply the effective theme to <html>: data-theme is the contract. The
   `dark` class is an inert compatibility hook kept for one release (no CSS
   selects on it — scripts/lint-tokens.mjs rejects html.dark / .dark). */
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
