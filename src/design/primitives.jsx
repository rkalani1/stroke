/**
 * v7.0 — Core UI primitives.
 * Drop-in: src/design/primitives.jsx
 *
 * Discipline (binding):
 *  • One accent (cobalt), one alarm (crit), one alert (warn). Headers carry no color.
 *  • 8px button radius, 12px card radius. 1px hairlines, never 2px.
 *  • Tap targets ≥44pt on mobile (lint enforced via scripts/lint-touch-targets.mjs).
 *  • Focus rings: 2px solid cobalt-500 + 2px offset, :focus-visible only.
 *  • Tabular-nums + slashed-zero on every clinical numeric.
 *
 * Each export is ref-forwarded where applicable; displayName is set so React
 * DevTools shows the component name instead of "ForwardRef".
 */

import React, { useId } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* ─── Button ──────────────────────────────────────────────────────────
   5 variants × 3 sizes (sm 32 / md 40 / lg 48) + icon-only 40×40.
   Icon-only requires aria-label (enforced via scripts/lint-tokens.mjs AST). */

const BTN_VARIANT = {
  primary:     'bg-cobalt-600 text-white border border-cobalt-600 hover:bg-cobalt-700 active:bg-cobalt-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200',
  secondary:   'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700 dark:hover:bg-slate-700',
  ghost:       'bg-transparent text-slate-700 border border-transparent hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 disabled:text-slate-300',
  destructive: 'bg-crit-700 text-white border border-crit-700 hover:bg-crit-800 active:bg-crit-900',
  icon:        'bg-transparent text-slate-700 border border-transparent hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
};
const BTN_SIZE = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base' };
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-md ' +
  'transition-[transform,background-color,border-color] duration-100 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-white dark:focus-visible:ring-cobalt-300 dark:focus-visible:ring-offset-slate-950 ' +
  'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

export const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, type = 'button', className, children, ...rest },
  ref
) {
  const iconOnly = variant === 'icon';
  return (
    <button ref={ref} type={type}
      className={cx(BTN_BASE, iconOnly ? 'h-10 w-10 p-0' : BTN_SIZE[size] || BTN_SIZE.md, BTN_VARIANT[variant] || BTN_VARIANT.primary, className)}
      {...rest}>
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
      {iconRight ? <span className="inline-flex shrink-0">{iconRight}</span> : null}
    </button>
  );
});

/* ─── Card ────────────────────────────────────────────────────────────
   default + 4 semantic skins. 3px left rule + semantic fill, never just fill. */

const CARD_VARIANT = {
  default: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
  crit:    'bg-crit-50 border-slate-200 border-l-[3px] border-l-crit-700 dark:bg-crit-950 dark:border-slate-800 dark:border-l-crit-500',
  warn:    'bg-warn-50 border-slate-200 border-l-[3px] border-l-warn-700 dark:bg-warn-950 dark:border-slate-800 dark:border-l-warn-500',
  ok:      'bg-ok-50   border-slate-200 border-l-[3px] border-l-ok-700   dark:bg-ok-950   dark:border-slate-800 dark:border-l-ok-500',
  info:    'bg-info-50 border-slate-200 border-l-[3px] border-l-info-700 dark:bg-info-950 dark:border-slate-800 dark:border-l-info-500'
};

export const Card = ({ variant = 'default', eyebrow, title, action, density = 'compact', as: As = 'section', className, children }) => {
  const pad = density === 'comfortable' ? 'p-5' : 'p-4';
  const hasHeader = eyebrow || title || action;
  return (
    <As className={cx('border rounded-lg', CARD_VARIANT[variant] || CARD_VARIANT.default, className)}>
      {hasHeader && (
        <header className={cx('flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800', pad)}>
          <div className="min-w-0">
            {eyebrow && <p className="font-mono uppercase text-2xs tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-1">{eyebrow}</p>}
            {title && <h3 className="font-serif text-lg font-medium text-slate-900 dark:text-slate-50">{title}</h3>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={pad}>{children}</div>
    </As>
  );
};

/* ─── Tabs (primary) ──────────────────────────────────────────────────
   Horizontal segmented bar at md+, bottom-nav at <md. */

export const Tab = ({ items, value, onChange, ariaLabel = 'Primary', className }) => (
  <div role="tablist" aria-label={ariaLabel} className={cx('flex border-b border-slate-200 dark:border-slate-800', className)}>
    {items.map(it => {
      const active = it.id === value;
      return (
        <button key={it.id} role="tab" aria-selected={active} type="button"
          onClick={() => onChange?.(it.id)}
          className={cx(
            'h-11 px-4 text-sm font-semibold inline-flex items-center gap-2 -mb-px border-b-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-inset',
            active
              ? 'border-cobalt-600 text-cobalt-700 dark:text-cobalt-300 dark:border-cobalt-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
          )}>
          {it.icon}<span>{it.label}</span>
        </button>
      );
    })}
  </div>
);

/* ─── SubTabs (pill segmented control) ────────────────────────────── */
export const SubTabs = ({ items, value, onChange, ariaLabel = 'Sub-view', className }) => (
  <div role="tablist" aria-label={ariaLabel} className={cx('inline-flex p-1 rounded-md bg-slate-100 dark:bg-slate-800', className)}>
    {items.map(it => {
      const active = it.id === value;
      return (
        <button key={it.id} role="tab" aria-selected={active} type="button"
          onClick={() => onChange?.(it.id)}
          className={cx(
            'h-9 px-3 text-sm font-semibold rounded',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
            active ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50'
                   : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
          )}>{it.label}</button>
      );
    })}
  </div>
);

/* ─── SegmentedControl (binary clinical state) ──────────────────────── */
export const SegmentedControl = ({ items, value, onChange, ariaLabel = 'Choice', className }) => (
  <div role="radiogroup" aria-label={ariaLabel}
       className={cx('inline-flex w-full rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-900', className)}>
    {items.map(it => {
      const active = it.id === value;
      return (
        <button key={it.id} role="radio" aria-checked={active} type="button"
          onClick={() => onChange?.(it.id)}
          className={cx(
            'flex-1 h-10 px-3 text-sm font-semibold rounded',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
            active ? 'bg-cobalt-600 text-white'
                   : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          )}>{it.label}</button>
      );
    })}
  </div>
);

/* ─── Field / Input / Select / Textarea ───────────────────────────── */

export const Field = ({ label, hint, error, required, id, children, className }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}{required && <span className="text-crit-700 ml-1 dark:text-crit-300" aria-label="required">*</span>}
        </label>
      )}
      {/* Inject id into single child input so htmlFor + id line up automatically */}
      {React.isValidElement(children) && !children.props.id
        ? React.cloneElement(children, { id: inputId, 'aria-invalid': error ? 'true' : undefined })
        : children}
      {hint && !error && <p className="font-mono text-2xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p role="alert" className="font-mono text-2xs text-crit-800 dark:text-crit-300">{error}</p>}
    </div>
  );
};

const INPUT_BASE =
  'w-full h-11 px-3 text-base bg-white dark:bg-slate-900 ' +
  'text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 ' +
  'border border-slate-200 dark:border-slate-700 rounded-md ' +
  'focus:outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/40 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = React.forwardRef(function Input({ mono, numeric, error, className, type = 'text', ...rest }, ref) {
  const numericAttrs = numeric ? { inputMode: 'decimal', pattern: '[0-9.]*', autoComplete: 'off' } : {};
  return (
    <input ref={ref} type={type}
      className={cx(INPUT_BASE,
        mono && 'font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero]',
        error && 'border-crit-600 focus:border-crit-600 focus:ring-crit-500/40',
        className)}
      {...numericAttrs} {...rest}/>
  );
});

export const Select = React.forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(INPUT_BASE, 'appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef(function Textarea({ rows = 4, className, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx(INPUT_BASE, 'h-auto py-2 leading-snug', className)} {...rest}/>;
});

/* ─── NumberStepper (NIHSS, ASPECTS, mRS, INR, weight) ─────────────── */

export const NumberStepper = ({ value, onChange, min = 0, max = 99, step = 1, suffix, ariaLabel, className }) => {
  const dec = () => onChange?.(Math.max(min, +value - step));
  const inc = () => onChange?.(Math.min(max, +value + step));
  return (
    <div className={cx('inline-flex items-center h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900', className)}>
      <button type="button" aria-label={`Decrement ${ariaLabel || ''}`} onClick={dec}
        className="w-11 h-11 inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-l-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
        <span aria-hidden="true">−</span>
      </button>
      <div className="flex-1 min-w-[3ch] text-center font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero] text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value}{suffix && <span className="text-slate-500 dark:text-slate-400 text-sm font-normal ml-1">{suffix}</span>}
      </div>
      <button type="button" aria-label={`Increment ${ariaLabel || ''}`} onClick={inc}
        className="w-11 h-11 inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-r-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
};

/* ─── Checkbox / Toggle / PhaseChip / Skeleton / Toast ─────────────── */

export const Checkbox = ({ checked, onChange, label, id, disabled, ariaLabel }) => {
  const generatedId = useId();
  const cbId = id || generatedId;
  return (
    <label htmlFor={cbId} className="inline-flex items-center gap-3 cursor-pointer select-none min-h-11 py-2.5">
      <span aria-hidden="true" className={cx(
        'inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
        checked ? 'bg-cobalt-600 border-cobalt-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600',
        disabled && 'opacity-50'
      )}>
        {checked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>}
      </span>
      <input id={cbId} type="checkbox" checked={!!checked} disabled={disabled}
             onChange={e => onChange?.(e.target.checked)} aria-label={ariaLabel} className="sr-only"/>
      {label && <span className="text-sm text-slate-800 dark:text-slate-100">{label}</span>}
    </label>
  );
};

export const Toggle = ({ on, onChange, label, id, ariaLabel }) => {
  const generatedId = useId();
  const tId = id || generatedId;
  return (
    <label htmlFor={tId} className="inline-flex items-center gap-3 cursor-pointer min-h-11 py-2.5">
      <span aria-hidden="true" className={cx('relative inline-flex w-9 h-5 rounded-full transition-colors', on ? 'bg-cobalt-600' : 'bg-slate-300 dark:bg-slate-700')}>
        <span className={cx('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform dark:bg-card', on && 'translate-x-4')}/>
      </span>
      <input id={tId} type="checkbox" checked={!!on}
             onChange={e => onChange?.(e.target.checked)} aria-label={ariaLabel} className="sr-only"/>
      {label && <span className="text-sm text-slate-800 dark:text-slate-100">{label}</span>}
    </label>
  );
};

const PHASE_CLS = {
  eligible: 'bg-ok-50 text-ok-800 dark:bg-ok-950 dark:text-ok-200',
  contra:   'bg-crit-50 text-crit-800 dark:bg-crit-950 dark:text-crit-200',
  unknown:  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  window:   'bg-warn-50 text-warn-800 dark:bg-warn-950 dark:text-warn-200'
};
const PHASE_GLYPH = { eligible: '✓', contra: '✕', unknown: 'ⓘ', window: '◷' };

export const PhaseChip = ({ status = 'unknown', children, className }) => (
  <span className={cx(
    'inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-2xs font-semibold uppercase tracking-[0.06em]',
    PHASE_CLS[status] || PHASE_CLS.unknown, className
  )}>
    <span aria-hidden="true">{PHASE_GLYPH[status]}</span>
    {children}
  </span>
);

export const Skeleton = ({ className }) => (
  <div aria-hidden="true"
       className={cx('rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse motion-reduce:animate-none', className)}
       style={{ animationDuration: '1.2s' }}/>
);

export const Toast = ({ kind = 'info', icon, title, children, action, className, onDismiss }) => {
  const iconCls = kind === 'crit' ? 'text-crit-700 dark:text-crit-300'
                : kind === 'warn' ? 'text-warn-700 dark:text-warn-300'
                : kind === 'ok'   ? 'text-ok-700 dark:text-ok-300'
                : 'text-cobalt-600 dark:text-cobalt-300';
  return (
    <div role={kind === 'crit' ? 'alert' : 'status'}
         className={cx('flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700', className)}>
      {icon && <span className={cx('mt-0.5 shrink-0', iconCls)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>}
        {children && <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{children}</div>}
      </div>
      {action}
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss}
                className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
};

Button.displayName       = 'Button';
Input.displayName        = 'Input';
Select.displayName       = 'Select';
Textarea.displayName     = 'Textarea';
