/**
 * v6.0-02 — Shared UI primitives.
 *
 * Visual rules baked in (see CLAUDE-style v6.0 spec):
 *   • One visual layer at a time. No tinted-card-inside-tinted-card.
 *   • Color carries meaning. critical/confirm/caution/reference only.
 *   • 1 px hairline borders, never 2 px.
 *   • Radii: 4 px inputs, 6 px cards, 99 px pills only when truly needed.
 *   • Focus rings: 2 px solid ink, no glow.
 *   • Tap targets: ≥44 × 44 px on mobile.
 *
 * These primitives are additive — existing inline JSX in app.jsx is migrated
 * progressively across v6.0-03 → v6.0-08. Component classes mirroring these
 * primitives are also defined in src/styles.css @layer components, so the
 * monolith can adopt them via className without importing React components.
 */

import React, { useId } from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

// =========================================================================
// Button — variants: primary | secondary | critical | confirm | ghost
// Sizes: sm | md (default) | lg
// =========================================================================

const BUTTON_VARIANTS = {
  primary:   'bg-ink text-white border border-ink hover:bg-ink-2 active:bg-ink',
  secondary: 'bg-transparent text-ink border border-line hover:bg-paper-2',
  critical:  'bg-critical text-white border border-critical hover:opacity-90',
  confirm:   'bg-confirm text-white border border-confirm hover:opacity-90',
  ghost:     'bg-transparent text-ink-2 border border-transparent hover:bg-paper-2'
};

const BUTTON_SIZES = {
  sm: 'h-9  px-3 text-[13px] min-w-[44px]',
  md: 'h-11 px-4 text-[14px] min-w-[44px]',
  lg: 'h-12 px-5 text-[15px] min-w-[44px]'
};

export const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', children, ...rest },
  ref
) {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-[4px] font-sans font-medium',
    'transition-colors duration-100',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
    BUTTON_SIZES[size] || BUTTON_SIZES.md,
    className
  );
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {children}
    </button>
  );
});

// =========================================================================
// Card — single white surface on paper. 6 px radius, 1 px line border.
// Pass `eyebrow`, `title`, `description` for the standard card head, or
// just children for a bare card. No nested tinted backgrounds — fields
// inside should be separated by border-b border-line, not by sub-cards.
// =========================================================================

export const Card = ({ as: As = 'section', eyebrow, title, description, action, className, children, ...rest }) => (
  <As className={cx('bg-card border border-line rounded-md', className)} {...rest}>
    {(eyebrow || title || description || action) && (
      <header className="px-5 pt-5 pb-4 border-b border-line flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-mono uppercase text-eyebrow text-mute mb-1">{eyebrow}</p>
          )}
          {title && (
            <h2 className="font-serif text-section text-ink text-balance">{title}</h2>
          )}
          {description && (
            <p className="font-sans text-body text-ink-2 mt-1 text-pretty">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
    )}
    <div className={(eyebrow || title || description || action) ? 'p-5' : 'p-5'}>
      {children}
    </div>
  </As>
);

// =========================================================================
// Field — wraps a labeled input row. Hairline-bottom by default so that
// stacked fields read as a list, not a grid of tiny boxes.
// =========================================================================

export const Field = ({ label, hint, error, required, children, hairline = true, className, htmlFor }) => (
  <div className={cx('py-3', hairline && 'border-b border-line', className)}>
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="font-sans text-[13px] font-medium text-ink-2">
          {label}
          {required && <span aria-label="required" className="text-critical ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="font-mono text-caption text-mute">{hint}</p>
      )}
      {error && (
        <p role="alert" className="font-mono text-caption text-critical">{error}</p>
      )}
    </div>
  </div>
);

// =========================================================================
// Input / Select / Textarea — no bg tint, 1 px line border, 4 px radius.
// Mono variant (`mono`) for clinical numerics so columns line up.
// `numeric` boolean wires inputmode=decimal + iOS-friendly pattern.
// =========================================================================

const inputBaseCls =
  'w-full bg-transparent border border-line rounded-[4px] px-3 ' +
  'h-11 text-[15px] text-ink placeholder:text-mute ' +
  'focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = React.forwardRef(function Input(
  { mono, numeric, className, type = 'text', ...rest },
  ref
) {
  const numericProps = numeric
    ? { inputMode: 'decimal', pattern: '[0-9.]*', autoComplete: 'off' }
    : {};
  return (
    <input
      ref={ref}
      type={type}
      className={cx(inputBaseCls, mono && 'font-mono tabular-nums', className)}
      {...numericProps}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select({ mono, className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cx(inputBaseCls, 'pr-8', mono && 'font-mono', className)}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef(function Textarea({ mono, className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cx(inputBaseCls, 'h-auto py-2 leading-snug', mono && 'font-mono', className)}
      {...rest}
    />
  );
});

// =========================================================================
// Tabs — quiet pill tabs. Active = solid ink, inactive = no chrome.
// Use horizontal scroll on mobile rather than wrapping.
// =========================================================================

export const Tabs = ({ items, value, onChange, ariaLabel = 'Tabs', className }) => (
  <div role="tablist" aria-label={ariaLabel} className={cx('flex gap-1 overflow-x-auto', className)}>
    {items.map((item) => {
      const active = item.id === value;
      return (
        <button
          key={item.id}
          role="tab"
          type="button"
          aria-selected={active}
          tabIndex={active ? 0 : -1}
          onClick={() => onChange?.(item.id)}
          className={cx(
            'h-10 px-4 rounded-full font-sans font-medium text-[13px] whitespace-nowrap',
            'transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink',
            active
              ? 'bg-ink text-white'
              : 'text-ink-2 hover:bg-paper-2'
          )}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

// =========================================================================
// Banner — quiet section header. Replaces every gradient banner with a
// hairline-divided header: serif title, mono eyebrow, body description,
// optional action button on the right.
// =========================================================================

export const Banner = ({ eyebrow, title, description, action, accent, className }) => {
  // accent: 'critical' | 'confirm' | 'caution' | 'reference' | undefined
  // Renders as a 3px left rule, never a fill, never a gradient.
  const accentCls = {
    critical:  'border-l-[3px] border-critical pl-4',
    confirm:   'border-l-[3px] border-confirm pl-4',
    caution:   'border-l-[3px] border-caution pl-4',
    reference: 'border-l-[3px] border-reference pl-4'
  }[accent] || '';

  return (
    <header
      className={cx(
        'flex items-start justify-between gap-4 py-4 border-b border-line',
        accentCls,
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono uppercase text-eyebrow text-mute mb-1">{eyebrow}</p>
        )}
        {title && (
          <h2 className="font-serif text-section text-ink text-balance">{title}</h2>
        )}
        {description && (
          <p className="font-sans text-body text-ink-2 mt-1 text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
};

// =========================================================================
// Callout — semantic note (critical / confirm / caution / reference).
// Uses *-soft background + colored left rule. Glyph required so color is
// never the only signal (a11y).
// =========================================================================

const CALLOUT_VARIANTS = {
  critical:  { bg: 'bg-critical-soft',  bar: 'border-critical',  fg: 'text-critical',  glyph: '✕' },
  confirm:   { bg: 'bg-confirm-soft',   bar: 'border-confirm',   fg: 'text-confirm',   glyph: '✓' },
  caution:   { bg: 'bg-caution-soft',   bar: 'border-caution',   fg: 'text-caution',   glyph: '⚠' },
  reference: { bg: 'bg-reference-soft', bar: 'border-reference', fg: 'text-reference', glyph: 'ⓘ' }
};

export const Callout = ({ variant = 'reference', title, children, glyph, className, role = 'note' }) => {
  const v = CALLOUT_VARIANTS[variant] || CALLOUT_VARIANTS.reference;
  return (
    <div
      role={role}
      className={cx(
        'rounded-md border border-line border-l-[3px] px-4 py-3',
        v.bg,
        v.bar,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cx('font-mono text-[14px] leading-5 shrink-0', v.fg)}>
          {glyph || v.glyph}
        </span>
        <div className="min-w-0 flex-1">
          {title && <p className={cx('font-sans font-medium text-[14px]', v.fg)}>{title}</p>}
          <div className={cx('font-sans text-body text-ink-2', title ? 'mt-1' : '')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Stamp — small semantic badge anchored to a field (used heavily in v6.2
// for surfaced contraindications). Includes a glyph so color isn't the
// only signal.
// =========================================================================

export const Stamp = ({ variant = 'reference', children, className }) => {
  const v = CALLOUT_VARIANTS[variant] || CALLOUT_VARIANTS.reference;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px]',
        'font-mono text-caption uppercase tracking-wide',
        v.bg,
        v.fg,
        'border-l-[3px]',
        v.bar,
        className
      )}
    >
      <span aria-hidden="true">{v.glyph}</span>
      {children}
    </span>
  );
};

// =========================================================================
// Eyebrow — small mono uppercase label used for "Step 02 · Decide" etc.
// =========================================================================

export const Eyebrow = ({ children, className }) => (
  <p className={cx('font-mono uppercase text-eyebrow text-mute', className)}>{children}</p>
);

// =========================================================================
// Data — mono tabular numeric span for clinical values inline in prose.
// Use whenever a digit is in body text (BP, INR, NIHSS, time stamps).
// =========================================================================

export const Data = ({ children, className }) => (
  <span className={cx('font-mono tabular-nums text-ink', className)}>{children}</span>
);
