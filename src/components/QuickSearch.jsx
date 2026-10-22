import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReferenceData } from '../reference-resource.js';
import { buildSearchIndex, searchIndex, groupResults } from '../quick-search-index.js';
import { focusEncounterTarget } from '../encounter-overview.js';
import { revealProtocolTarget } from '../protocol-navigation.js';
import { screenerTrials } from '../evidence/screenerTrials.js';
import { enrollmentLabel } from '../evidence/screener-eval.js';

const SUGGESTIONS = [
  ['Dose by weight', 'qr-dose'], ['BP targets', 'qr-bp'], ['Reversal', 'qr-reversal'],
  ['Post-lytic sICH', 'qr-sich'], ['Angioedema', 'qr-angioedema'], ['NIHSS', '#/encounter/nihss'], ['ICH score', '#/encounter/ich-score']
];
// The Trials database profiles, built once so the memoized index keeps its identity across
// renders. Status leads the subtitle (the database's own label) so truncation never hides it;
// the full study name and bedside summary (population, condition, intervention) are searchable
// as body text so they rank below Evidence matches.
export const SEARCH_TRIALS = screenerTrials.map(trial => ({
  acronym: trial.acronym, nct: trial.externalMetadata?.nct, keywords: trial.externalMetadata?.registryAcronym,
  subtitle: [enrollmentLabel(trial), trial.exactFullStudyName].filter(Boolean).join(' · '), body: `${trial.exactFullStudyName} ${trial.conciseBedsideSummary}`
}));
const groupId = group => `qs-group-${group.toLowerCase().replace(/[^a-z]+/g, '-')}`;

// One search across navigation, protocols, calculators, evidence and trials.
// Results are links; selecting one only changes the route.
export default function QuickSearch({ open, onClose, version, trials = SEARCH_TRIALS, protocolSub = 'ischemic', onFocusEncounter = focusEncounterTarget }) {
  const dialog = useRef(null), input = useRef(null), list = useRef(null);
  const [query, setQuery] = useState(''), [active, setActive] = useState(0), [expanded, setExpanded] = useState([]);
  // Each opening starts empty. The reset happens while rendering the opening, so the field is
  // already clear when showModal focuses it; reset in the effect, it could land after a first key
  // typed at once and keep the previous query in front of it.
  const [shownOpen, setShownOpen] = useState(open);
  if (open !== shownOpen) {
    setShownOpen(open);
    if (open) { setQuery(''); setActive(0); setExpanded([]); }
  }
  const { data, failed } = useReferenceData(version);
  const index = useMemo(() => buildSearchIndex({ ...(data || {}), trials }, { protocolSub }), [data, trials, protocolSub]);
  // groupResults caps what renders, so every match stays reachable through "Show N more".
  const results = useMemo(() => searchIndex(index, query, Infinity), [index, query]);
  const groups = useMemo(() => groupResults(results, { expanded }), [results, expanded]);
  // Keyboard order follows the rendered order, including each group's "more" row.
  const flat = useMemo(() => groups.flatMap(([group, items, hidden]) => hidden ? [...items, { id: `more-${group}`, more: group, title: `Show ${hidden} more`, subtitle: group }] : items), [groups]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      if (typeof node.showModal === 'function') node.showModal(); else node.setAttribute('open', '');
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && node.open) { if (typeof node.close === 'function') node.close(); else node.removeAttribute('open'); }
  }, [open]);
  useEffect(() => { setActive(0); setExpanded([]); }, [query]);
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);
  const go = record => {
    if (!record) return;
    if (record.more) { setExpanded(value => [...value, record.more]); input.current?.focus(); return; }
    onClose();
    if (record.external) { window.open(record.href, '_blank', 'noopener,noreferrer'); return; }
    // Re-selecting the current route fires no hashchange: reveal a protocol target directly,
    // and replay the route change for other targets (an Encounter tool scrolls and focuses).
    // Encounter targets go through the app's hand-off so focus runs after the panel is
    // visible; wait for the dialog to close first, since closing returns focus to its opener.
    if (record.focus) { requestAnimationFrame(() => requestAnimationFrame(() => onFocusEncounter(record.focus))); return; }
    if (location.hash === record.href) { const target = record.href.match(/^#\/protocols\/[a-z]+\/([a-z-]+)$/)?.[1]; requestAnimationFrame(() => target ? revealProtocolTarget(target) : window.dispatchEvent(new HashChangeEvent('hashchange'))); }
    else location.hash = record.href;
  };
  const onKeyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(value => Math.min(value + 1, Math.max(flat.length - 1, 0))); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
    if (event.key === 'Enter' && flat[active]) { event.preventDefault(); go(flat[active]); }
  };
  const option = (record, index) => <a key={record.id} id={`qs-${record.id}`} className="quick-search__option" role="option" aria-selected={index === active} data-active={index === active} data-more={record.more ? '' : undefined} href={record.href || '#'} target={record.external ? '_blank' : undefined} rel={record.external ? 'noopener noreferrer' : undefined} onMouseMove={() => setActive(index)} onClick={event => { event.preventDefault(); go(record); }}>
    <span className="quick-search__title">{record.title}</span>{record.subtitle && <span className="quick-search__meta">{record.subtitle}</span>}
  </a>;
  let position = -1;
  // The native close event arrives a task after close(). If search was reopened in between (Esc,
  // then Ctrl+K straight away), that late event belongs to the old dialog and must not shut the new one.
  return <dialog ref={dialog} className="quick-search" aria-label="Search" onClose={() => { if (!dialog.current?.open) onClose(); }} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="quick-search__panel">
      <div className="quick-search__field">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input ref={input} type="text" inputMode="search" enterKeyHint="go" role="combobox" aria-expanded={flat.length > 0} aria-controls={flat.length ? 'quick-search-results' : undefined} aria-activedescendant={flat[active] ? `qs-${flat[active].id}` : undefined} aria-label="Search protocols, calculators, evidence and trials" placeholder="Search protocols, calculators, evidence, trials…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyDown} autoComplete="off" spellCheck="false" />
        {/* The visible word starts the accessible name: "Esc" with a keyboard, "Close" on touch (shell.css). */}
        <button type="button" className="quick-search__close" onClick={onClose}><span className="quick-search__close-key">Esc<span className="sr-only">, close search</span></span><span className="quick-search__close-touch">Close<span className="sr-only"> search</span></span></button>
      </div>
      <div ref={list} className="quick-search__results">
        {!query.trim() && <div className="quick-search__empty"><p>Jump to</p><ul className="quick-search__chips">{SUGGESTIONS.map(([label, target]) => { const href = target.startsWith('#') ? target : `#/protocols/${protocolSub}/${target}`; return <li key={target}><a href={href} onClick={event => { event.preventDefault(); go({ href }); }}>{label}</a></li>; })}</ul>{!data && !failed && <p className="quick-search__hint">Loading evidence index…</p>}</div>}
        {query.trim() && !flat.length && <p className="quick-search__hint">No matches. Try a drug, score, trial or topic.</p>}
        {flat.length > 0 && <div id="quick-search-results" role="listbox" aria-label="Search results">{groups.map(([group, items, hidden]) => <div key={group} role="group" aria-labelledby={groupId(group)}>
          <div id={groupId(group)} className="quick-search__group" role="presentation">{group}</div>
          {items.map(record => { position += 1; return option(record, position); })}
          {hidden > 0 && (() => { position += 1; return option(flat[position], position); })()}
        </div>)}</div>}
      </div>
      {/* Always rendered, so the count is announced as it changes (a live region inserted with its text often is not). */}
      <p className="sr-only" role="status">{!query.trim() ? '' : results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'No matches'}</p>
      <p className="quick-search__footer"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p>
    </div>
  </dialog>;
}
