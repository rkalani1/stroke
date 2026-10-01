/**
 * v7.0 — Tailwind config extended with v7 tokens.
 *
 * Strict additive: every existing utility (slate/blue/red/amber, plus the
 * v6 semantic tokens ink/mute/line/critical/confirm/caution/reference) keeps
 * working. New v7 tokens (slate-0..950 ramps, cobalt-*, link-*, crit/warn/ok/info
 * 5-step ramps, link-*) are added under theme.extend.
 *
 * Every colour reads an RGB-triplet CSS variable from src/design/tokens.css
 * (ramps: --slate-500; semantic layer: --c-ink, --c-surface, …), so opacity
 * modifiers (bg-card/95, border-line/60) generate CSS and dark-theme
 * switching is a single attribute flip on <html data-theme>.
 */
module.exports = {
  // The single dark hook: [data-theme="dark"] on <html>. Spelled as an
  // explicit variant so the output stays `:is([data-theme="dark"] *)`, which
  // is what the old ['class', '[data-theme="dark"]'] form emitted. The
  // 'selector' strategy would emit `:where(…)` instead and drop every one of
  // the ~3.3k dark: utilities by one class of specificity.
  darkMode: ['variant', '&:is([data-theme="dark"] *)'],

  // Every file that renders class names (D3-03). The explicit list this
  // replaces missed src/design/{hero-readout,time-window-ring,drug-chip,
  // device-frame}.jsx. Non-JSX sources are limited to the two folders that
  // hold components/hooks: a broad ./src/**/*.js would also scan the prose
  // in src/evidence, src/guidelines and the clinical-content modules and
  // generate utilities from ordinary words ("grow", "shrink", "block").
  content: [
    './index.html',
    './src/**/*.jsx',
    './src/components/*.js',
    './src/design/*.js'
  ],

  safelist: [
    /* The shared component language (src/styles.css, `ui-*`) ships whole,
       whether or not a view has adopted a given recipe yet. The old ^v6- /
       ^v7- patterns are gone: no class name is built dynamically, so the
       content scan finds every v7-* class still in use. */
    /* Codemod replaces accent classes; keep cobalt-* available regardless */
    { pattern: /^(bg|text|border|ring)-(cobalt|crit|warn|ok|info|link)-(50|100|200|300|400|500|600|700|800|900|950)$/ }
  ],

  theme: {
    extend: {
      colors: {
        /* ─── v7 ramps ─── */
        slate: {
          0:   'rgb(var(--slate-0)   / <alpha-value>)',
          50:  'rgb(var(--slate-50)  / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
          800: 'rgb(var(--slate-800) / <alpha-value>)',
          900: 'rgb(var(--slate-900) / <alpha-value>)',
          950: 'rgb(var(--slate-950) / <alpha-value>)'
        },
        cobalt: {
          50:  'rgb(var(--cobalt-50)  / <alpha-value>)',
          100: 'rgb(var(--cobalt-100) / <alpha-value>)',
          200: 'rgb(var(--cobalt-200) / <alpha-value>)',
          300: 'rgb(var(--cobalt-300) / <alpha-value>)',
          400: 'rgb(var(--cobalt-400) / <alpha-value>)',
          500: 'rgb(var(--cobalt-500) / <alpha-value>)',
          600: 'rgb(var(--cobalt-600) / <alpha-value>)',
          700: 'rgb(var(--cobalt-700) / <alpha-value>)',
          800: 'rgb(var(--cobalt-800) / <alpha-value>)',
          900: 'rgb(var(--cobalt-900) / <alpha-value>)',
          950: 'rgb(var(--cobalt-950) / <alpha-value>)',
        },
        link: {
          50:  'rgb(var(--link-50)  / <alpha-value>)',
          100: 'rgb(var(--link-100) / <alpha-value>)',
          200: 'rgb(var(--link-200) / <alpha-value>)',
          400: 'rgb(var(--link-400) / <alpha-value>)',
          600: 'rgb(var(--link-600) / <alpha-value>)',
          700: 'rgb(var(--link-700) / <alpha-value>)',
          900: 'rgb(var(--link-900) / <alpha-value>)'
        },
        crit: rampVar('crit', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        warn: rampVar('warn', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        ok:   rampVar('ok',   [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        info: rampVar('info', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),

        /* ─── v6 semantic aliases ───
           Each reads a --c-* RGB triplet (src/design/tokens.css) so opacity
           modifiers work: bg-card/95, border-line/60, bg-paper-2/60 used to
           generate nothing because these were bare var(--x) colours. */
        ink:              semanticVar('ink'),
        'ink-2':          semanticVar('ink-2'),
        mute:             semanticVar('mute'),
        line:             semanticVar('line'),
        /* form-field boundary, >= 3:1 on its surface (WCAG 1.4.11) */
        'line-control':   semanticVar('line-control'),
        faint:            semanticVar('faint'),
        /* strong = heavier hairline; overlay = raised surface (slate-800 in
           dark). */
        strong:           semanticVar('line-strong'),
        overlay:          semanticVar('overlay'),
        paper:            semanticVar('paper'),
        'paper-2':        semanticVar('muted'),
        card:             semanticVar('surface'),
        critical:         semanticVar('critical'),
        'critical-soft':  semanticVar('critical-soft'),
        confirm:          semanticVar('confirm'),
        'confirm-soft':   semanticVar('confirm-soft'),
        caution:          semanticVar('caution'),
        'caution-soft':   semanticVar('caution-soft'),
        reference:        semanticVar('reference'),
        'reference-soft': semanticVar('reference-soft'),
        accent:           semanticVar('accent'),
        'accent-2':       semanticVar('accent-2'),
        'accent-soft':    semanticVar('accent-soft'),
        'accent-ink':     semanticVar('accent-ink'),
        surface:          semanticVar('surface'),
        'surface-2':      semanticVar('sunken'),
        'surface-3':      semanticVar('canvas-2')
      },

      /* Display face = Bricolage Grotesque, for h1/h2 page titles and the
         wordmark. `serif` is kept as an alias of `display` (the class is used
         across the app); both fall back to sans — the face is a grotesque, so
         Georgia/Times were never a faithful fallback. */
      fontFamily: {
        sans:    ['"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif:   ['"Bricolage Grotesque"', '"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },

      fontSize: {
        /* v7 ramp — base 16px, modular 1.250 */
        '2xs':     ['0.6875rem', { lineHeight: '1.4' }],
        xs:        ['0.75rem',   { lineHeight: '1.5' }],
        sm:        ['0.8125rem', { lineHeight: '1.55' }],
        base:      ['0.9375rem', { lineHeight: '1.55' }],
        md:        ['1.0625rem', { lineHeight: '1.5' }],
        lg:        ['1.25rem',   { lineHeight: '1.4' }],
        xl:        ['1.5rem',    { lineHeight: '1.3' }],
        '2xl':     ['1.875rem',  { lineHeight: '1.25' }],
        '3xl':     ['2.5rem',    { lineHeight: '1.15' }],
        '4xl':     ['3rem',      { lineHeight: '1.1' }],
        'display': ['3.5rem',    { lineHeight: '1.1' }],

        /* v6 aliases kept */
        'display-lg':['3rem',     { lineHeight: '3.25rem', letterSpacing: '-0.01em' }],
        section:     ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        eyebrow:     ['0.6875rem',{ lineHeight: '1rem',    letterSpacing: '0.12em' }],
        body:        ['0.9375rem',{ lineHeight: '1.375rem' }],
        data:        ['0.9375rem',{ lineHeight: '1.25rem' }],
        'data-lg':   ['1.125rem', { lineHeight: '1.375rem' }],
        caption:     ['0.6875rem',{ lineHeight: '1rem' }]
      },

      /* No spacing override: Tailwind's default scale has the same values
         (p-4 = 1rem = 16px at the default root size) in rem, so every step
         — including the half steps (p-3.5, gap-1.5) — scales together when
         the user raises the browser font size. */

      borderRadius: {
        sm: '4px', md: '8px', lg: '12px', xl: '16px', pill: '999px'
      },

      boxShadow: {
        card: 'var(--card-shadow, 0 1px 0 rgba(15,23,42,.04), 0 6px 16px -10px rgba(15,23,42,.18))',
        pop:  'var(--shadow-pop,  0 24px 60px -20px rgba(15,23,42,.35), 0 4px 12px rgba(15,23,42,.06))'
      }
    }
  },

  plugins: []
};

/* Helper — builds an alpha-aware ramp object from a token prefix + steps array.
   Defined as a hoisted function so `module.exports` above can reference it. */
function rampVar(prefix, steps) {
  const out = {};
  for (const s of steps) out[s] = `rgb(var(--${prefix}-${s}) / <alpha-value>)`;
  return out;
}

/* Semantic colour from the --c-* triplet layer in src/design/tokens.css. */
function semanticVar(name) {
  return `rgb(var(--c-${name}) / <alpha-value>)`;
}
