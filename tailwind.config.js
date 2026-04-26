/**
 * v6.0-01 — Tailwind theme is wired to CSS variables defined in src/styles.css :root.
 *
 * Tokens introduced (additive — no existing utilities removed):
 *   colors:      ink, ink-2, mute, line, paper, paper-2, card,
 *                critical, critical-soft, confirm, confirm-soft,
 *                caution, caution-soft, reference, reference-soft
 *   fontFamily:  sans (Manrope), serif (Newsreader), mono (JetBrains Mono)
 *   fontSize:    display, display-lg, section, eyebrow, body, data, data-lg, caption
 *
 * Existing slate / blue / red / amber utilities continue to work; semantic tokens
 * are migrated into views progressively across v6.0-02 → v6.0-06.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/app.jsx',
    './src/components.jsx',
    './src/pocket-cards.jsx',
    './src/teaching.jsx'
  ],
  theme: {
    extend: {
      colors: {
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
        'reference-soft': 'var(--reference-soft)'
      },
      fontFamily: {
        sans:  ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        display:     ['clamp(2rem, 4.5vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display-lg':['3rem',                      { lineHeight: '3.25rem', letterSpacing: '-0.01em' }],
        section:     ['1.375rem',                  { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        eyebrow:     ['0.6875rem',                 { lineHeight: '1rem',    letterSpacing: '0.12em' }],
        body:        ['0.9375rem',                 { lineHeight: '1.375rem' }],
        data:        ['0.9375rem',                 { lineHeight: '1.25rem' }],
        'data-lg':   ['1.125rem',                  { lineHeight: '1.375rem' }],
        caption:     ['0.6875rem',                 { lineHeight: '1rem' }]
      }
    }
  },
  plugins: []
};
