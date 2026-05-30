// src/components/EligibilityTables.jsx
//
// Native eligibility-tables reference view — replaces the standalone
// stroke-eligibility-tables-embed iframe in the Trials tab. v7 styling/tokens
// (single cobalt accent; warn/crit/ok/slate semantics). No institutional
// identifiers, no institutional brand colors — the copy-as-HTML output uses v7
// token hexes (teal #0C7C8C header, gold #B07D24 accent).
//
//   • Two top filters: Ischemic / ICH.
//   • Three collapsible phase sections per category (acute / inpatient /
//     outpatient), each rendering its table:
//        Study (acronym + NCT link + status badge) | Summary | Eligibility | Key Exclusions
//   • Per-table "Copy as HTML" (inline-styled, v7 hexes) and "Copy as Markdown".
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

/* ───────────────────────── status badge ───────────────────────── */

function StatusBadge({ status }) {
  const map = {
    enrolling: { cls: 'bg-ok-50 text-ok-800 border-ok-200', text: 'Enrolling' },
    soon: { cls: 'bg-warn-50 text-warn-800 border-warn-200', text: 'Soon' },
    unverified: { cls: 'bg-crit-50 text-crit-800 border-crit-200', text: 'Unverified' }
  };
  const m = map[status] || map.unverified;
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        m.cls
      )}
    >
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
  <p style="font-size: 12px; color: #B91C1C; margin: 0 0 8px;"><strong>Synthetic public demo — not for clinical decision-making.</strong> First-pass ClinicalTrials.gov check; not a complete eligibility protocol.</p>
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
</div>`;
}

function buildMarkdown(table) {
  const lines = [];
  lines.push(`### ${table.title}`);
  lines.push('');
  lines.push('> Synthetic public demo — not for clinical decision-making. First-pass ClinicalTrials.gov check; not a complete eligibility protocol.');
  lines.push('');
  lines.push('| Study | Hypothesis / Summary | Eligibility | Key Exclusions |');
  lines.push('| --- | --- | --- | --- |');
  for (const t of table.trials) {
    const study = escMd(trialStudyText(t)) + (t.href ? ` ([CT.gov](${t.href}))` : '');
    const summary = escMd(t.summary);
    const elig = t.eligibility.map((e) => `• ${escMd(e)}`).join('<br>');
    const excl = t.exclusions.map((e) => `• ${escMd(e)}`).join('<br>');
    lines.push(`| ${study} | ${summary} | ${elig} | ${excl} |`);
  }
  lines.push('');
  return lines.join('\n');
}

/* ───────────────────────── table render ───────────────────────── */

function EligibilityTable({ table, copyToClipboard, addToast }) {
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCopyHtml}
          className="h-8 px-3 text-xs font-semibold rounded-md border border-cobalt-200 bg-cobalt-50 text-cobalt-800 hover:bg-cobalt-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
        >
          Copy as HTML
        </button>
        <button
          type="button"
          onClick={onCopyMd}
          className="h-8 px-3 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
        >
          Copy as Markdown
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr className="bg-cobalt-700 text-white">
              <th scope="col" className="px-4 py-3 text-2xs font-bold uppercase tracking-wide border-b-2 border-warn-500 w-[18%]">
                Study
              </th>
              <th scope="col" className="px-4 py-3 text-2xs font-bold uppercase tracking-wide border-b-2 border-warn-500 w-[30%]">
                Hypothesis / Summary
              </th>
              <th scope="col" className="px-4 py-3 text-2xs font-bold uppercase tracking-wide border-b-2 border-warn-500 w-[28%]">
                Eligibility
              </th>
              <th scope="col" className="px-4 py-3 text-2xs font-bold uppercase tracking-wide border-b-2 border-warn-500 w-[24%]">
                Key Exclusions
              </th>
            </tr>
          </thead>
          <tbody>
            {table.trials.map((t, i) => (
              <tr
                key={`${table.id}-${t.acronym}-${i}`}
                className={cx('border-b border-slate-200 align-top', i % 2 === 1 && 'bg-slate-50')}
              >
                <td className="px-4 py-4 align-top">
                  <div className="font-bold text-cobalt-700">
                    {t.href ? (
                      <a
                        href={t.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link-600 underline hover:text-link-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded"
                      >
                        {t.acronym} ↗
                      </a>
                    ) : (
                      <span>{t.acronym}</span>
                    )}
                  </div>
                  {t.nct ? (
                    <div className="mt-1 font-mono text-2xs text-slate-500">{t.nct}</div>
                  ) : null}
                  <div className="mt-1.5">
                    <StatusBadge status={t.status} />
                  </div>
                  {t.unverified ? (
                    <p className="mt-1.5 text-2xs font-medium text-crit-800">
                      Unverified — no ClinicalTrials.gov record.
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-700 leading-relaxed">{t.summary}</td>
                <td className="px-4 py-4 align-top text-slate-700">
                  <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                    {t.eligibility.map((e, j) => (
                      <li key={j}>{e}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4 align-top text-slate-700">
                  <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                    {t.exclusions.map((e, j) => (
                      <li key={j}>{e}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── collapsible phase section ───────────────────────── */

function PhaseSection({ table, open, onToggle, copyToClipboard, addToast }) {
  const panelId = `eligibility-panel-${table.id}`;
  const btnId = `eligibility-btn-${table.id}`;
  const trialCount = table.trials.length;
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <h3>
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded-md"
        >
          <span className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{PHASE_LABELS[table.phase]}</span>
            <span className="text-2xs font-mono text-slate-500">
              {trialCount} {trialCount === 1 ? 'study' : 'studies'}
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-500 text-sm">
            {open ? '▾' : '▸'}
          </span>
        </button>
      </h3>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={btnId} className="px-4 pb-4">
          <EligibilityTable table={table} copyToClipboard={copyToClipboard} addToast={addToast} />
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
      {/* Compliance banner */}
      <div className="rounded-md border-l-4 border-crit-600 bg-crit-50 px-4 py-3">
        <p className="text-xs text-crit-800">
          <span className="font-bold">Synthetic public demo — not for clinical decision-making.</span>{' '}
          {ELIGIBILITY_COMPLIANCE_NOTE.replace(
            'Synthetic public demo — not for clinical decision-making. ',
            ''
          )}
        </p>
      </div>

      {/* Category filter */}
      <div
        className="inline-flex p-1 rounded-md bg-slate-100"
        role="tablist"
        aria-label="Stroke category filter"
      >
        {['ischemic', 'ich'].map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cx(
              'h-9 px-4 text-sm font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
              category === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

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
