// src/components/EligibilityTables.jsx
//
// Native eligibility-tables reference view — no iframe. v7 styling/tokens
// (single cobalt accent; warn/crit/ok/slate semantics). No institutional
// identifiers, no institutional brand colors — the copy-as-HTML output uses v7
// token hexes (teal #0C7C8C header, gold #B07D24 accent).
//
//   • Two top filters: Ischemic / Hemorrhage.
//   • Three collapsible phase sections per category (acute / inpatient /
//     outpatient).
//   • ≥ lg: the four-column reference table
//       Study | Hypothesis / Summary | Eligibility | Key Exclusions
//     < lg (phone / tablet): the same rows as stacked cards, because a
//     four-column table is unusable on a phone. Identical content either way.
//   • Per-table "Copy as HTML" and "Copy as Markdown" — unchanged output, so
//     the intranet paste target still receives the full table.
//
// `copyToClipboard` + `addToast` are passed in from app.jsx (shared helpers +
// toast system) so the copy actions reuse one code path.

import React, { useMemo, useState, useCallback } from 'react';
import {
  eligibilityTables,
  CATEGORY_LABELS,
  PHASE_LABELS,
  ELIGIBILITY_COMPLIANCE_NOTE
} from '../evidence/eligibilityTables.js';

const cx = (...p) => p.filter(Boolean).join(' ');

// v7 token hexes for the copy-as-HTML inline styling. Teal header / gold accent
// — the v7 palette, deliberately NOT the source embed's institutional brand colors.
const HTML_TEAL = '#0C7C8C';
const HTML_GOLD = '#B07D24';

const PHASE_ORDER = ['acute', 'inpatient', 'outpatient'];

const SHORT_PHASE_LABELS = {
  acute: 'Acute · onset ≤ 24 h',
  inpatient: 'Inpatient · day 0–30',
  outpatient: 'Outpatient · day 14–month 6'
};

/* ───────────────────────── icons ───────────────────────── */

const Glyph = ({ children, size = 16, className, strokeWidth = 2.1 }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const IconVessel = (p) => (
  <Glyph {...p} strokeWidth={1.9}>
    <path d="M4 7c4 0 4 5 8 5s4-5 8-5" />
    <path d="M4 16c4 0 4 3 8 3" />
    <path d="m15 15 5 5" />
    <path d="m20 15-5 5" />
  </Glyph>
);
const IconDroplet = (p) => (
  <Glyph {...p} strokeWidth={1.9}>
    <path d="M12 3.5c3.6 4.2 6 7.2 6 10a6 6 0 0 1-12 0c0-2.8 2.4-5.8 6-10Z" />
  </Glyph>
);
const IconCopy = (p) => (
  <Glyph {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Glyph>
);
const IconChevron = (p) => (
  <Glyph {...p} strokeWidth={2.4}>
    <path d="m9 6 6 6-6 6" />
  </Glyph>
);

const CATEGORY_ICONS = { ischemic: IconVessel, ich: IconDroplet };
const SHORT_CATEGORY_LABELS = { ischemic: 'Ischemic', ich: 'Hemorrhage' };

/* ───────────────────────── status badge ───────────────────────── */

function StatusBadge({ status }) {
  const map = {
    enrolling: {
      dot: 'bg-ok-500',
      cls: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-200 dark:border-ok-800',
      text: 'Enrolling'
    },
    soon: {
      dot: 'bg-warn-500',
      cls: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-200 dark:border-warn-800',
      text: 'Soon'
    },
    unverified: {
      dot: 'bg-crit-500',
      cls: 'bg-crit-50 text-crit-800 border-crit-200 dark:bg-crit-950 dark:text-crit-200 dark:border-crit-800',
      text: 'Unverified'
    }
  };
  const m = map[status] || map.unverified;
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2 py-1 text-2xs font-bold uppercase tracking-wide',
        m.cls
      )}
    >
      <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-pill', m.dot)} />
      {m.text}
    </span>
  );
}

/* ───────────────────────── copy-string builders ───────────────────────── */

const escHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Markdown table cells must not contain raw pipes / newlines.
const escMd = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

const STATUS_TEXT = { enrolling: 'Enrolling', soon: 'Enrolling soon', unverified: 'Unverified' };
const statusText = (trial) => STATUS_TEXT[trial.status] || STATUS_TEXT.unverified;

function trialStudyText(trial) {
  const nct = trial.nct ? ` (${trial.nct})` : '';
  return `${trial.acronym}${nct}`;
}

function buildHtml(table) {
  const rows = table.trials
    .map((t, i) => {
      const zebra = i % 2 === 1 ? ' background-color: #F8FAFC;' : '';
      const studyLink = t.href
        ? `<a href="${escHtml(t.href)}" target="_blank" rel="noopener" style="color: ${HTML_TEAL}; text-decoration: underline; font-weight: 700;">${escHtml(
            t.acronym
          )} ↗</a>`
        : `<span style="font-weight: 700; color: ${HTML_TEAL};">${escHtml(t.acronym)}</span>`;
      const elig = t.eligibility
        .map((e) => `<li style="margin-bottom: 4px;">${escHtml(e)}</li>`)
        .join('');
      const excl = t.exclusions
        .map((e) => `<li style="margin-bottom: 4px;">${escHtml(e)}</li>`)
        .join('');
      return `      <tr style="border-bottom: 1px solid #E2E8F0;${zebra}">
        <td style="padding: 16px; vertical-align: top;">
          <div style="font-weight: 700; font-size: 16px;">${studyLink}</div>
          ${t.nct ? `<div style="font-size: 12px; color: #64748B; margin-top: 4px;">${escHtml(t.nct)}</div>` : ''}
          <div style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 4px;">${escHtml(statusText(t))}</div>
        </td>
        <td style="padding: 16px; vertical-align: top; color: #334155; line-height: 1.4;">${escHtml(t.summary)}</td>
        <td style="padding: 16px; vertical-align: top; color: #334155;">
          <ul style="padding-left: 20px; margin: 0; line-height: 1.4;">${elig}</ul>
        </td>
        <td style="padding: 16px; vertical-align: top; color: #334155;">
          <ul style="padding-left: 20px; margin: 0; line-height: 1.4;">${excl}</ul>
        </td>
      </tr>`;
    })
    .join('\n');

  const th = (label, width) =>
    `<th style="padding: 12px 16px; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; border-bottom: 3px solid ${HTML_GOLD}; width: ${width};">${label}</th>`;

  return `<div style="overflow-x: auto; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
  <h3 style="font-size: 16px; color: #0F172A; margin: 0 0 8px;">${escHtml(table.title)}</h3>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; font-size: 14px; text-align: left; background-color: #FFFFFF;">
    <thead>
      <tr style="background-color: ${HTML_TEAL}; color: #FFFFFF;">
        ${th('Study', '15%')}
        ${th('Hypothesis / Summary', '30%')}
        ${th('Eligibility', '30%')}
        ${th('Key Exclusions', '25%')}
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p style="font-size: 12px; color: #64748B; margin: 8px 0 0; line-height: 1.5;">${escHtml(ELIGIBILITY_COMPLIANCE_NOTE)}</p>
</div>`;
}

function buildMarkdown(table) {
  const lines = [];
  lines.push(`### ${table.title}`);
  lines.push('');
  lines.push('| Study | Hypothesis / Summary | Eligibility | Key Exclusions |');
  lines.push('| --- | --- | --- | --- |');
  for (const t of table.trials) {
    const study =
      escMd(trialStudyText(t)) +
      (t.href ? ` ([CT.gov](${t.href}))` : '') +
      ` — ${escMd(statusText(t))}`;
    const summary = escMd(t.summary);
    const elig = t.eligibility.map((e) => `• ${escMd(e)}`).join('<br>');
    const excl = t.exclusions.map((e) => `• ${escMd(e)}`).join('<br>');
    lines.push(`| ${study} | ${summary} | ${elig} | ${excl} |`);
  }
  lines.push('');
  lines.push(`> ${escMd(ELIGIBILITY_COMPLIANCE_NOTE)}`);
  lines.push('');
  return lines.join('\n');
}

/* ───────────────────────── shared bits ───────────────────────── */

function StudyLink({ trial, className }) {
  if (!trial.href) return <span className={className}>{trial.acronym}</span>;
  return (
    <a
      href={trial.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx('text-link-600 underline hover:text-link-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:text-cobalt-300', className)}
    >
      {trial.acronym} ↗
    </a>
  );
}

function CriteriaList({ items, tone }) {
  const dot = tone === 'excl' ? 'bg-crit-700 dark:bg-crit-300' : 'bg-cobalt-500 dark:bg-cobalt-300';
  return (
    <ul className="space-y-1.5">
      {items.map((e, i) => (
        <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-ink-2 lg:text-sm">
          <span aria-hidden="true" className={cx('mt-[7px] h-1 w-1 shrink-0 rounded-pill', dot)} />
          <span>{e}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────── phone cards ───────────────────────── */

function TrialCards({ table }) {
  return (
    <ul className="divide-y divide-paper-2 lg:hidden">
      {table.trials.map((t, i) => (
        <li key={`${table.id}-card-${t.acronym}-${i}`} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-md font-bold tracking-tight">
                <StudyLink trial={t} className="-my-2 inline-flex min-h-[44px] items-center" />
              </h3>
              {t.nct ? <p className="mt-1 font-mono text-2xs text-slate-500 dark:text-mute">{t.nct}</p> : null}
            </div>
            <StatusBadge status={t.status} />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-ink-2">{t.summary}</p>

          {t.unverified ? (
            <p className="mt-2 text-2xs font-medium text-crit-800 dark:text-crit-200">
              Unverified — no ClinicalTrials.gov record.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            <div className="border-l-2 border-ok-200 pl-3 dark:border-ok-800">
              <p className="font-mono text-2xs font-bold uppercase tracking-[0.09em] text-ok-700 dark:text-ok-300">Eligibility</p>
              <div className="mt-2">
                <CriteriaList items={t.eligibility} tone="elig" />
              </div>
            </div>
            <div className="border-l-2 border-crit-200 pl-3 dark:border-crit-800">
              <p className="font-mono text-2xs font-bold uppercase tracking-[0.09em] text-crit-700 dark:text-crit-300">Key exclusions</p>
              <div className="mt-2">
                <CriteriaList items={t.exclusions} tone="excl" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────── desktop table ───────────────────────── */

function TrialTable({ table }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{table.title}</caption>
        <thead>
          <tr className="bg-cobalt-700 text-white dark:bg-cobalt-600">
            <th scope="col" className="w-[18%] border-b-2 border-warn-500 px-4 py-3 text-2xs font-bold uppercase tracking-wide">
              Study
            </th>
            <th scope="col" className="w-[30%] border-b-2 border-warn-500 px-4 py-3 text-2xs font-bold uppercase tracking-wide">
              Hypothesis / Summary
            </th>
            <th scope="col" className="w-[28%] border-b-2 border-warn-500 px-4 py-3 text-2xs font-bold uppercase tracking-wide">
              Eligibility
            </th>
            <th scope="col" className="w-[24%] border-b-2 border-warn-500 px-4 py-3 text-2xs font-bold uppercase tracking-wide">
              Key Exclusions
            </th>
          </tr>
        </thead>
        <tbody>
          {table.trials.map((t, i) => (
            <tr
              key={`${table.id}-${t.acronym}-${i}`}
              className={cx('border-b border-line align-top', i % 2 === 1 && 'bg-paper-2')}
            >
              <td className="px-4 py-4 align-top">
                <h3 className="font-serif text-md font-bold tracking-tight">
                  <StudyLink trial={t} />
                </h3>
                {t.nct ? <div className="mt-1 font-mono text-2xs text-slate-500 dark:text-mute">{t.nct}</div> : null}
                <div className="mt-2">
                  <StatusBadge status={t.status} />
                </div>
                {t.unverified ? (
                  <p className="mt-2 text-2xs font-medium text-crit-800 dark:text-crit-200">
                    Unverified — no ClinicalTrials.gov record.
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-4 align-top leading-relaxed text-ink-2">{t.summary}</td>
              <td className="px-4 py-4 align-top">
                <CriteriaList items={t.eligibility} tone="elig" />
              </td>
              <td className="px-4 py-4 align-top">
                <CriteriaList items={t.exclusions} tone="excl" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── collapsible phase section ───────────────────── */

function PhaseSection({ table, open, onToggle, copyToClipboard, addToast }) {
  const panelId = `eligibility-panel-${table.id}`;
  const btnId = `eligibility-btn-${table.id}`;
  const trialCount = table.trials.length;

  const onCopyHtml = useCallback(() => {
    const text = buildHtml(table);
    if (copyToClipboard) copyToClipboard(text, `${table.title} (HTML)`);
    else if (addToast) addToast('Clipboard helper unavailable', 'error');
  }, [table, copyToClipboard, addToast]);

  const onCopyMd = useCallback(() => {
    const text = buildMarkdown(table);
    if (copyToClipboard) copyToClipboard(text, `${table.title} (Markdown)`);
    else if (addToast) addToast('Clipboard helper unavailable', 'error');
  }, [table, copyToClipboard, addToast]);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-card shadow-card">
      <h3 className="font-serif">
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-md font-bold tracking-tight text-ink">{PHASE_LABELS[table.phase]}</span>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">
              {trialCount} {trialCount === 1 ? 'study' : 'studies'}
            </span>
          </span>
          <IconChevron size={18} className={cx('shrink-0 text-mute transition-transform', open && 'rotate-90')} />
        </button>
      </h3>

      {open ? (
        <div id={panelId} role="region" aria-labelledby={btnId} className="border-t border-paper-2">
          <TrialCards table={table} />
          <TrialTable table={table} />

          <div className="flex flex-wrap gap-2 border-t border-line bg-paper-2 px-4 py-3">
            <button
              type="button"
              onClick={onCopyHtml}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-line bg-card px-3 text-xs font-bold text-ink-2 hover:bg-paper-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <IconCopy size={14} />
              Copy as HTML
            </button>
            <button
              type="button"
              onClick={onCopyMd}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-line bg-card px-3 text-xs font-bold text-ink-2 hover:bg-paper-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <IconCopy size={14} />
              Copy as Markdown
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export function EligibilityTables({ copyToClipboard, addToast }) {
  const [category, setCategory] = useState('ischemic');
  // Track open phases per category; acute open by default.
  const [openPhases, setOpenPhases] = useState({ acute: true, inpatient: false, outpatient: false });

  const tablesForCategory = useMemo(() => {
    const byPhase = new Map(
      eligibilityTables.filter((t) => t.category === category).map((t) => [t.phase, t])
    );
    return PHASE_ORDER.map((phase) => byPhase.get(phase)).filter(Boolean);
  }, [category]);

  const togglePhase = useCallback((phase) => {
    setOpenPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Category filter — full-width segmented control on phone. */}
      <div className="grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-max sm:grid-flow-col" role="tablist" aria-label="Stroke category filter">
        {['ischemic', 'ich'].map((c) => {
          const active = category === c;
          const Icon = CATEGORY_ICONS[c];
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={CATEGORY_LABELS[c]}
              onClick={() => setCategory(c)}
              className={cx(
                'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors sm:px-6',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
                active
                  ? 'border-cobalt-600 bg-cobalt-600 text-white shadow-card'
                  : 'border-line bg-card text-ink-2 hover:border-cobalt-300 hover:bg-cobalt-50 dark:hover:bg-cobalt-900'
              )}
            >
              <Icon size={17} />
              <span aria-hidden="true" className="sm:hidden">{SHORT_CATEGORY_LABELS[c]}</span>
              <span aria-hidden="true" className="hidden sm:inline">{CATEGORY_LABELS[c]}</span>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-2xs uppercase tracking-[0.06em] text-mute">
        {SHORT_PHASE_LABELS.acute} · {SHORT_PHASE_LABELS.inpatient} · {SHORT_PHASE_LABELS.outpatient}
      </p>

      {/* Phase sections */}
      <div className="space-y-3">
        {tablesForCategory.map((table) => (
          <PhaseSection
            key={table.id}
            table={table}
            open={!!openPhases[table.phase]}
            onToggle={() => togglePhase(table.phase)}
            copyToClipboard={copyToClipboard}
            addToast={addToast}
          />
        ))}
      </div>
    </div>
  );
}

export default EligibilityTables;
