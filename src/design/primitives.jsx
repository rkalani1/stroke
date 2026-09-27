/**
 * Core UI primitives — the one React layer of the design system.
 *
 * Every export is a thin wrapper that emits the shared component classes
 * defined in src/styles.css (@layer components, the `ui-*` block): ui-btn,
 * ui-card, ui-callout, ui-input, ui-tabs, ui-seg, ui-chip, ui-dialog,
 * ui-eyebrow, ui-page-header. A JSX variant map and a CSS class therefore
 * cannot drift apart: inline markup in app.jsx can opt into exactly the same
 * recipe with `className="ui-btn ui-btn--primary"`.
 *
 * Discipline (binding):
 *  • One accent (cobalt), one alarm (crit), one alert (warn). Headers carry no colour.
 *  • 8px control radius, 12px card radius, 16px dialog radius. 1px hairlines.
 *  • 44px targets for anything a finger presses (36px `sm` only at ≥md with a
 *    fine pointer — the CSS enforces it, not the caller).
 *  • Focus: visible on every interactive part, including drawn checkboxes/switches.
 *  • Semantic tokens only (bg-card, border-line, text-ink/ink-2/mute): dark mode
 *    comes from the token layer, never from per-component dark: pairs.
 *  • Tabular-nums + slashed-zero on every clinical numeric.
 *
 * Keyboard model: Tabs (role=tablist) and SegmentedControl (role=radiogroup)
 * use a roving tabindex — one tab stop per group, arrow keys move AND select
 * (selection follows focus), Home/End jump to the ends, disabled items are
 * skipped. The pure `rovingTarget` helper below is the single implementation.
 */

import React, { useId, useRef } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* ─── Roving focus (WAI-ARIA APG radio group / tabs) ─────────────────── */

const NEXT_KEYS = { both: ['ArrowRight', 'ArrowDown'], horizontal: ['ArrowRight'], vertical: ['ArrowDown'] };
const PREV_KEYS = { both: ['ArrowLeft', 'ArrowUp'], horizontal: ['ArrowLeft'], vertical: ['ArrowUp'] };

/**
 * Index the focus should move to for `key`, or null when the key is not part
 * of the model (the caller then leaves the event alone). Wraps at both ends
 * and skips disabled items.
 *
 * @param {string}    key        KeyboardEvent.key
 * @param {number}    index      index of the item that has focus
 * @param {boolean[]} disabled   disabled flag per item
 * @param {'both'|'horizontal'|'vertical'} [orientation='both']
 * @returns {number|null}
 */
export function rovingTarget(key, index, disabled, orientation = 'both') {
  const n = disabled.length;
  const enabled = [];
  for (let i = 0; i < n; i++) if (!disabled[i]) enabled.push(i);
  if (enabled.length === 0) return null;
  if (key === 'Home') return enabled[0];
  if (key === 'End') return enabled[enabled.length - 1];
  const dir = (NEXT_KEYS[orientation] || NEXT_KEYS.both).includes(key) ? 1
    : (PREV_KEYS[orientation] || PREV_KEYS.both).includes(key) ? -1
    : 0;
  if (dir === 0) return null;
  for (let step = 1; step <= n; step++) {
    const i = (((index + dir * step) % n) + n) % n;
    if (!disabled[i]) return i;
  }
  return null;
}

/* The one tab stop of a roving group: the selected item, else the first
   enabled one. */
export function rovingTabStop(items, value) {
  const selected = items.findIndex((it) => it.id === value && !it.disabled);
  if (selected >= 0) return selected;
  const first = items.findIndex((it) => !it.disabled);
  return first >= 0 ? first : 0;
}

function useRovingGroup(items, onChange, orientation) {
  const refs = useRef([]);
  const onKeyDown = (e, index) => {
    const next = rovingTarget(e.key, index, items.map((it) => !!it.disabled), orientation);
    if (next === null) return;
    e.preventDefault();
    if (next === index) return;
    const el = refs.current[next];
    if (el && typeof el.focus === 'function') el.focus();
    onChange?.(items[next].id);
  };
  const setRef = (index) => (el) => { refs.current[index] = el; };
  return { onKeyDown, setRef };
}

/* ─── Button ──────────────────────────────────────────────────────────
   4 variants (primary / secondary / ghost / danger) + icon-only, 3 sizes
   (sm 36 at ≥md with a fine pointer, 44 otherwise / md 44 / lg 48).
   Icon-only requires aria-label (enforced via scripts/lint-tokens.mjs). */

const BTN_VARIANT = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
  destructive: 'ui-btn--danger',
  icon: 'ui-btn--ghost ui-btn--icon'
};
const BTN_SIZE = { sm: 'ui-btn--sm', md: '', lg: 'ui-btn--lg' };

export const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, type = 'button', className, children, ...rest },
  ref
) {
  return (
    <button ref={ref} type={type}
      className={cx('ui-btn', BTN_VARIANT[variant] || BTN_VARIANT.primary, variant !== 'icon' && BTN_SIZE[size], className)}
      {...rest}>
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
      {iconRight ? <span className="inline-flex shrink-0">{iconRight}</span> : null}
    </button>
  );
});

/* ─── Eyebrow / PageHeader ─────────────────────────────────────────── */

export const Eyebrow = ({ as: As = 'p', className, children }) => (
  <As className={cx('ui-eyebrow', className)}>{children}</As>
);

export const PageHeader = ({ eyebrow, title, description, action, titleAs: Title = 'h2', titleId, className }) => (
  <header className={cx('ui-page-header', className)}>
    <div className="ui-page-header__text">
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <Title id={titleId} className="ui-page-header__title">{title}</Title>
      {description && <p className="ui-page-header__desc">{description}</p>}
    </div>
    {action && <div className="ui-page-header__actions">{action}</div>}
  </header>
);

/* ─── Card / Callout ──────────────────────────────────────────────────
   Card: neutral surface; the category lives in an icon disc, never in a
   coloured border. The four status skins are the callout recipe (3px left
   rule + soft status fill) and are kept for callers that pass `variant`. */

/* Literal class names (not built from `status`), so Tailwind's content scan
   sees every one of them. */
const CARD_STATUS = { crit: 'ui-card--crit', warn: 'ui-card--warn', ok: 'ui-card--ok', info: 'ui-card--info' };
const CALLOUT_TONE = { crit: 'ui-callout--crit', warn: 'ui-callout--warn', ok: 'ui-callout--ok', info: 'ui-callout--info' };
const CHIP_TONE = { crit: 'ui-chip--crit', warn: 'ui-chip--warn', ok: 'ui-chip--ok', info: 'ui-chip--info' };

export const Card = ({ variant = 'default', eyebrow, title, action, density = 'compact', as: As = 'section', className, children }) => {
  const hasHeader = eyebrow || title || action;
  return (
    <As className={cx('ui-card', hasHeader && 'ui-card--flush', CARD_STATUS[variant], className)}>
      {hasHeader ? (
        <>
          <header className="ui-card__header">
            <div className="min-w-0">
              {eyebrow && <p className="ui-eyebrow mb-1">{eyebrow}</p>}
              {title && <h3 className="ui-card__title">{title}</h3>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
          <div className={cx('ui-card__body', density === 'comfortable' && 'ui-card__body--comfortable')}>{children}</div>
        </>
      ) : children}
    </As>
  );
};

export const Callout = ({ tone = 'info', title, icon, as: As = 'div', role, className, children }) => (
  <As role={role} className={cx('ui-callout', CALLOUT_TONE[tone] || CALLOUT_TONE.info, className)}>
    {(title || icon) && (
      <p className="ui-callout__title">
        {icon ? <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span> : null}
        {title}
      </p>
    )}
    {children}
  </As>
);

/* ─── Tabs (navigation / sub-view switch) ─────────────────────────────
   The Trials view-switch recipe: neutral rail, the active item lifts onto
   the card surface. Automatic activation: arrows move focus and select.
   Items may carry `controls` (the id of the panel they show). */

export const Tabs = ({ items, value, onChange, ariaLabel = 'Sub-view', ariaLabelledBy, fill = false, className }) => {
  const { onKeyDown, setRef } = useRovingGroup(items, onChange, 'horizontal');
  const stop = rovingTabStop(items, value);
  return (
    <div role="tablist" aria-label={ariaLabelledBy ? undefined : ariaLabel} aria-labelledby={ariaLabelledBy}
      className={cx('ui-tabs', fill && 'ui-tabs--fill', className)}>
      {items.map((it, i) => {
        const active = it.id === value;
        return (
          <button key={it.id} ref={setRef(i)} role="tab" type="button"
            id={it.tabId} aria-selected={active} aria-controls={it.controls}
            tabIndex={i === stop ? 0 : -1} disabled={it.disabled}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange?.(it.id)}
            className="ui-tabs__item">
            {it.icon}<span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* v7 names, kept so existing imports keep resolving: one tab component. */
export const Tab = ({ ariaLabel = 'Primary', ...rest }) => <Tabs ariaLabel={ariaLabel} {...rest} />;
export const SubTabs = Tabs;

/* ─── SegmentedControl (data entry: LKW type, theme) ───────────────────
   WAI-ARIA radio group: one tab stop (the checked radio, else the first
   enabled one); ArrowRight/ArrowDown and ArrowLeft/ArrowUp move to the
   next/previous enabled radio and select it (wrapping), Home/End select the
   first/last; disabled radios are skipped. Label it with `ariaLabelledBy`
   (id of a visible label) when one exists, `ariaLabel` otherwise. */
export const SegmentedControl = ({ items, value, onChange, ariaLabel = 'Choice', ariaLabelledBy, fill = true, className }) => {
  const { onKeyDown, setRef } = useRovingGroup(items, onChange, 'both');
  const stop = rovingTabStop(items, value);
  return (
    <div role="radiogroup" aria-label={ariaLabelledBy ? undefined : ariaLabel} aria-labelledby={ariaLabelledBy}
      className={cx('ui-seg', fill && 'ui-seg--fill', className)}>
      {items.map((it, i) => {
        const active = it.id === value;
        return (
          <button key={it.id} ref={setRef(i)} role="radio" type="button"
            aria-checked={active} tabIndex={i === stop ? 0 : -1} disabled={it.disabled}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange?.(it.id)}
            className="ui-seg__item">{it.label}</button>
        );
      })}
    </div>
  );
};

/* ─── Chip (filter / status) ──────────────────────────────────────────
   A toggle chip is a button with aria-pressed; a static status chip is a
   span. */
export const Chip = ({ selected, onClick, tone, as, className, children, ...rest }) => {
  const toneCls = CHIP_TONE[tone];
  if (onClick || as === 'button') {
    return (
      <button type="button" aria-pressed={selected === undefined ? undefined : !!selected}
        onClick={onClick} className={cx('ui-chip', toneCls, className)} {...rest}>{children}</button>
    );
  }
  const As = as || 'span';
  return <As className={cx('ui-chip', toneCls, className)} {...rest}>{children}</As>;
};

/* ─── Field / Input / Select / Textarea ───────────────────────────── */

export const Field = ({ label, hint, error, required, id, children, className }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-2">
          {label}{required && <span className="text-crit-700 ml-1 dark:text-crit-300" aria-label="required">*</span>}
        </label>
      )}
      {/* Inject id into single child input so htmlFor + id line up automatically */}
      {React.isValidElement(children) && !children.props.id
        ? React.cloneElement(children, { id: inputId, 'aria-invalid': error ? 'true' : undefined })
        : children}
      {hint && !error && <p className="font-mono text-2xs text-mute">{hint}</p>}
      {error && <p role="alert" className="font-mono text-2xs text-crit-800 dark:text-crit-300">{error}</p>}
    </div>
  );
};

export const Input = React.forwardRef(function Input({ mono, numeric, error, className, type = 'text', ...rest }, ref) {
  const numericAttrs = numeric ? { inputMode: 'decimal', pattern: '[0-9.]*', autoComplete: 'off' } : {};
  return (
    <input ref={ref} type={type}
      className={cx('ui-input', mono && 'ui-input--mono', error && 'ui-input--invalid', className)}
      {...numericAttrs} {...rest}/>
  );
});

export const Select = React.forwardRef(function Select({ error, className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx('ui-input', error && 'ui-input--invalid', className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef(function Textarea({ rows = 4, error, className, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('ui-input', error && 'ui-input--invalid', className)} {...rest}/>;
});

/* ─── NumberStepper (NIHSS, ASPECTS, mRS, INR, weight) ─────────────── */

const STEP_BTN =
  'w-11 h-11 inline-flex items-center justify-center text-ink-2 hover:bg-paper-2 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500 dark:focus-visible:ring-cobalt-300';

export const NumberStepper = ({ value, onChange, min = 0, max = 99, step = 1, suffix, ariaLabel, className }) => {
  const dec = () => onChange?.(Math.max(min, +value - step));
  const inc = () => onChange?.(Math.min(max, +value + step));
  return (
    <div className={cx('inline-flex items-center h-11 rounded-md border border-line bg-card', className)}>
      <button type="button" aria-label={`Decrement ${ariaLabel || ''}`} onClick={dec} className={cx(STEP_BTN, 'rounded-l-md')}>
        <span aria-hidden="true">−</span>
      </button>
      <div className="flex-1 min-w-[3ch] text-center font-mono tabular-nums [font-variant-numeric:tabular-nums_slashed-zero] text-lg font-semibold text-ink">
        {value}{suffix && <span className="text-mute text-sm font-normal ml-1">{suffix}</span>}
      </div>
      <button type="button" aria-label={`Increment ${ariaLabel || ''}`} onClick={inc} className={cx(STEP_BTN, 'rounded-r-md')}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
};

/* ─── Checkbox / Toggle ───────────────────────────────────────────────
   The real <input> is visually hidden (`peer sr-only`) and comes FIRST, so
   the drawn box/track after it can show keyboard focus with
   peer-focus-visible (the input itself is 1px and clipped, so its own
   outline is invisible). Toggle is a switch, and says so (role="switch";
   the native checked state supplies aria-checked). */

const PEER_FOCUS =
  'peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt-500 peer-focus-visible:ring-offset-2 ' +
  'peer-focus-visible:ring-offset-card dark:peer-focus-visible:ring-cobalt-300';

export const Checkbox = ({ checked, onChange, label, id, disabled, ariaLabel }) => {
  const generatedId = useId();
  const cbId = id || generatedId;
  return (
    <label htmlFor={cbId} className={cx('inline-flex items-center gap-3 select-none min-h-11 py-2.5', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
      <input id={cbId} type="checkbox" checked={!!checked} disabled={disabled}
             onChange={e => onChange?.(e.target.checked)} aria-label={ariaLabel} className="peer sr-only"/>
      <span aria-hidden="true" className={cx(
        'inline-flex items-center justify-center w-5 h-5 rounded-sm border transition-colors',
        checked ? 'bg-cobalt-600 border-cobalt-600' : 'bg-card border-line-control',
        PEER_FOCUS,
        disabled && 'opacity-50'
      )}>
        {checked && <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>}
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
};

export const Toggle = ({ on, onChange, label, id, disabled, ariaLabel }) => {
  const generatedId = useId();
  const tId = id || generatedId;
  return (
    <label htmlFor={tId} className={cx('inline-flex items-center gap-3 min-h-11 py-2.5', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
      <input id={tId} type="checkbox" role="switch" checked={!!on} disabled={disabled}
             onChange={e => onChange?.(e.target.checked)} aria-label={ariaLabel} className="peer sr-only"/>
      <span aria-hidden="true" className={cx(
        'relative inline-flex w-9 h-5 shrink-0 rounded-full transition-colors',
        on ? 'bg-cobalt-600' : 'bg-slate-300 dark:bg-slate-700',
        PEER_FOCUS,
        disabled && 'opacity-50'
      )}>
        <span className={cx('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform dark:bg-card', on && 'translate-x-4')}/>
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
};

/* ─── PhaseChip / Skeleton / Toast / Dialog ────────────────────────── */

const PHASE_CLS = {
  eligible: 'ui-chip--ok',
  contra:   'ui-chip--crit',
  unknown:  '',
  window:   'ui-chip--warn'
};
const PHASE_GLYPH = { eligible: '✓', contra: '✕', unknown: 'ⓘ', window: '◷' };

export const PhaseChip = ({ status = 'unknown', children, className }) => (
  <span className={cx('ui-chip ui-chip--label', PHASE_CLS[status] ?? PHASE_CLS.unknown, className)}>
    <span aria-hidden="true">{PHASE_GLYPH[status] || PHASE_GLYPH.unknown}</span>
    {children}
  </span>
);

export const Skeleton = ({ className }) => (
  <div aria-hidden="true"
       className={cx('rounded-md bg-paper-2 animate-pulse motion-reduce:animate-none', className)}
       style={{ animationDuration: '1.2s' }}/>
);

export const Toast = ({ kind = 'info', icon, title, children, action, className, onDismiss }) => {
  const iconCls = kind === 'crit' ? 'text-crit-700 dark:text-crit-300'
                : kind === 'warn' ? 'text-warn-700 dark:text-warn-300'
                : kind === 'ok'   ? 'text-ok-700 dark:text-ok-300'
                : 'text-cobalt-600 dark:text-cobalt-300';
  return (
    <div role={kind === 'crit' ? 'alert' : 'status'}
         className={cx('flex items-start gap-3 px-4 py-3 rounded-lg shadow-pop border border-line bg-card max-w-sm', className)}>
      {icon && <span className={cx('mt-0.5 shrink-0', iconCls)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-ink">{title}</p>}
        {children && <div className="text-sm text-ink-2 mt-0.5">{children}</div>}
      </div>
      {action}
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="ui-btn ui-btn--ghost ui-btn--icon shrink-0">
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
};

/* Dialog: presentation only (backdrop + surface + header/footer slots).
   Focus trap, Escape and scroll lock belong to the caller — use
   useDialogChrome (src/components/use-dialog-chrome.js) on `dialogRef`. */
export const Dialog = React.forwardRef(function Dialog(
  { title, titleId, description, footer, onBackdropClick, sheet = false, className, children, ...rest },
  ref
) {
  const generatedId = useId();
  const headingId = titleId || `${generatedId}-title`;
  return (
    <div className={cx('ui-dialog__backdrop', sheet && 'ui-dialog__backdrop--sheet')} onClick={onBackdropClick}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? headingId : undefined}
        className={cx('ui-dialog', sheet && 'ui-sheet', className)}
        onClick={(e) => e.stopPropagation()} {...rest}>
        {title && (
          <div className="ui-dialog__header">
            <h2 id={headingId} className="ui-dialog__title">{title}</h2>
            {description && <p className="text-sm text-ink-2 mt-1">{description}</p>}
          </div>
        )}
        <div className="ui-dialog__body">{children}</div>
        {footer && <div className="ui-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
});

Button.displayName       = 'Button';
Input.displayName        = 'Input';
Select.displayName       = 'Select';
Textarea.displayName     = 'Textarea';
Dialog.displayName       = 'Dialog';
