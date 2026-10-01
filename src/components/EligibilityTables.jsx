import React, { useState } from 'react';
import { eligibilityTables, CATEGORY_LABELS, PHASE_LABELS, ELIGIBILITY_COMPLIANCE_NOTE } from '../evidence/eligibilityTables.js';

const statusText = { enrolling: 'Recruiting at recorded check', soon: 'Not yet recruiting at recorded check', closed: 'Closed to enrollment in stored profile', unverified: 'Unverified' };
const HEADINGS = ['Study', 'Summary', 'Inclusion criteria', 'Exclusion criteria'];
const escHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escMd = value => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const sourceRecord = trial => `${statusText[trial.status] || 'Unverified'}. Recorded registry check: ${trial.sourceDate || 'not recorded in this table'}. Local activation is not confirmed.`;
const sourceGaps = trial => trial.sourceGaps?.length ? `Source gaps / confirmation required: ${trial.sourceGaps.join('; ')}` : '';

export function buildTableMarkdown(table) {
  return `## ${table.title}\n\n| Study | Summary | Inclusion criteria | Exclusion criteria |\n| --- | --- | --- | --- |\n` + table.trials.map(trial => `| ${escMd(trial.acronym)} ${escMd(trial.nct)} · ${escMd(sourceRecord(trial))}${trial.href ? ` · ${escMd(trial.href)}` : ''} | ${escMd([trial.summary, sourceGaps(trial)].filter(Boolean).join(' '))} | ${escMd(trial.eligibility.join('; '))} | ${escMd(trial.exclusions.join('; '))} |`).join('\n') + `\n\n${ELIGIBILITY_COMPLIANCE_NOTE}`;
}

export function buildTableHtml(table) {
  return `<section><h2>${escHtml(table.title)}</h2><table><thead><tr>${HEADINGS.map(heading => `<th scope="col">${heading}</th>`).join('')}</tr></thead><tbody>` + table.trials.map(trial => `<tr><td>${escHtml(trial.acronym)} ${escHtml(trial.nct)}<p>${escHtml(sourceRecord(trial))}</p>${trial.href ? `<a href="${escHtml(trial.href)}">Registry record</a>` : ''}</td><td>${escHtml(trial.summary)}${sourceGaps(trial) ? `<p>${escHtml(sourceGaps(trial))}</p>` : ''}</td><td><ul>${trial.eligibility.map(line => `<li>${escHtml(line)}</li>`).join('')}</ul></td><td><ul>${trial.exclusions.map(line => `<li>${escHtml(line)}</li>`).join('')}</ul></td></tr>`).join('') + `</tbody></table><p>${escHtml(ELIGIBILITY_COMPLIANCE_NOTE)}</p></section>`;
}

function StudyIdentity({ trial }) {
  return <><h3 className="font-bold">{trial.acronym}</h3>{trial.nct && <a href={trial.href} target="_blank" rel="noopener noreferrer" className="break-words text-xs text-link-600 underline">{trial.nct} ↗</a>}<p className="mt-2 text-xs leading-relaxed text-mute">{sourceRecord(trial)}</p></>;
}

function StudySummary({ trial }) {
  return <><p>{trial.summary}</p>{trial.sourceGaps?.length > 0 && <details className="mt-3"><summary className="min-h-[44px] cursor-pointer font-semibold">Source gaps / confirmation required</summary><CriteriaList lines={trial.sourceGaps} /></details>}</>;
}

function CriteriaList({ lines }) {
  return <ul className="list-disc space-y-2 pl-4">{lines.length ? lines.map((line, i) => <li key={i}>{line}</li>) : <li>Not specified in the stored source profile.</li>}</ul>;
}

function PhaseTable({ table, copyToClipboard }) {
  return <details open={table.phase === 'acute'} className="overflow-hidden rounded-lg border border-line bg-card shadow-card">
    <summary className="min-h-[52px] cursor-pointer px-4 py-3 font-bold">{PHASE_LABELS[table.phase]} · {table.trials.length} studies</summary>
    <div className="border-t border-line">
      <div className="space-y-4 p-4 lg:hidden" aria-label={`${table.title} study cards`}>
        {table.trials.map(trial => <article key={trial.acronym} className="rounded-lg border border-line bg-card p-4 text-sm"><StudyIdentity trial={trial} /><div className="mt-3"><h4 className="mb-2 font-semibold">Summary</h4><StudySummary trial={trial} /></div>{[['Inclusion criteria', trial.eligibility], ['Exclusion criteria', trial.exclusions]].map(([label, lines]) => <div key={label} className="mt-4"><h4 className="mb-2 font-semibold">{label}</h4><CriteriaList lines={lines} /></div>)}</article>)}
      </div>
      <table className="hidden w-full table-fixed border-collapse text-left text-sm lg:table" aria-label={table.title}>
        <colgroup><col className="w-[18%]" /><col className="w-[24%]" /><col className="w-[29%]" /><col className="w-[29%]" /></colgroup>
        <thead className="bg-cobalt-600 text-white"><tr>{HEADINGS.map(heading => <th key={heading} scope="col" className="break-words px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
        <tbody>{table.trials.map(trial => <tr key={trial.acronym} className="border-b border-line last:border-0"><td className="break-words px-4 py-4 align-top"><StudyIdentity trial={trial} /></td><td className="break-words px-4 py-4 align-top"><StudySummary trial={trial} /></td><td className="break-words px-4 py-4 align-top"><CriteriaList lines={trial.eligibility} /></td><td className="break-words px-4 py-4 align-top"><CriteriaList lines={trial.exclusions} /></td></tr>)}</tbody>
      </table>
      <div className="flex flex-wrap gap-3 border-t border-line bg-paper-2 p-3">{[['HTML', buildTableHtml], ['Markdown', buildTableMarkdown]].map(([format, build]) => <button key={format} type="button" className="min-h-[44px] rounded-md border border-line bg-card px-3 text-sm font-semibold" onClick={() => copyToClipboard?.(build(table), `${table.title} (${format})`)}>Copy as {format}</button>)}</div>
    </div>
  </details>;
}

export function EligibilityTables({ copyToClipboard, onStateChange }) {
  const [category, setCategory] = useState('ischemic');
  return <div className="space-y-4"><div className="flex flex-wrap gap-2" role="group" aria-label="Stroke category filter">{Object.entries(CATEGORY_LABELS).map(([id, label]) => <button key={id} type="button" aria-pressed={category === id} className="min-h-[44px] rounded-md border border-line bg-card px-4 font-semibold" onClick={() => { onStateChange?.(); setCategory(id); }}>{label}</button>)}</div><p className="text-sm text-mute">The same full stored criteria appear in the study database. The two table-only reference profiles are retained with their separate source limitations.</p>{eligibilityTables.filter(table => table.category === category).map(table => <PhaseTable key={table.id} table={table} copyToClipboard={copyToClipboard} />)}</div>;
}
export default EligibilityTables;
