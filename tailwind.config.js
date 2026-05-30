/**
 * v7.0 — Tailwind config extended with v7 tokens.
 *
 * Strict additive: every existing utility (slate/blue/red/amber, plus the
 * v6 semantic tokens ink/mute/line/critical/confirm/caution/reference) keeps
 * working. New v7 tokens (slate-0..950 ramps, cobalt-*, link-*, crit/warn/ok/info
 * 5-step ramps, link-*) are added under theme.extend.
 *
 * Tokens read from CSS variables in src/design/tokens.css so dark-theme
 * switching is a single attribute flip on <html data-theme>.
 */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],

  content: [
    './index.html',
    './src/app.jsx',
    './src/components.jsx',
    './src/primitives.jsx',
    './src/pocket-cards.jsx',
    './src/teaching.jsx',
    './src/design/primitives.jsx',
    './src/design/patient-strip.jsx'
  ],

  safelist: [
    { pattern: /^v6-/ },
    { pattern: /^v7-/ },
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
          900: 'rgb(var(--cobalt-900) / <alpha-value>)'
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

        /* ─── v6 aliases (kept resolving) ─── */
        ink:              'var(--ink)',
        'ink-2':          'var(--ink-2)',
        mute:             'var(--mute)',
        line:             'var(--line)',
        paper:            'var(--paper)',
        'paper-2':        'var(--paper-2)',
        card:             'var(--card)',
        critical:         'var(--critical)',
        'critical-soft':  'var(--critical-soft)',
        confirm:          'var(--confirm)',
        'confirm-soft':   'var(--confirm-soft)',
        caution:          'var(--caution)',
        'caution-soft':   'var(--caution-soft)',
        reference:        'var(--reference)',
        'reference-soft': 'var(--reference-soft)',
        accent:           'var(--accent)',
        'accent-2':       'var(--accent-2)',
        'accent-soft':    'var(--accent-soft)',
        'accent-ink':     'var(--accent-ink)',
        surface:          'var(--surface)',
        'surface-2':      'var(--surface-2)',
        'surface-3':      'var(--surface-3)'
      },

      fontFamily: {
        sans:  ['"Public Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Bricolage Grotesque"', 'Georgia', 'ui-serif', 'serif'],
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

      spacing: {
        /* v7 base-4 scale — no half-steps */
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
        6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px'
      },

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
