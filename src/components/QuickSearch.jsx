import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReferenceData } from '../reference-resource.js';
import { buildSearchIndex, searchIndex, groupResults } from '../quick-search-index.js';
import { focusEncounterTarget } from '../encounter-overview.js';

const SUGGESTIONS = [
  ['Dose by weight', '#/protocols/ischemic/qr-dose'], ['BP targets', '#/protocols/ischemic/qr-bp'], ['Reversal', '#/protocols/ischemic/qr-reversal'],
  ['Post-lytic sICH', '#/protocols/ischemic/qr-sich'], ['Angioedema', '#/protocols/ischemic/qr-angioedema'], ['NIHSS', '#/encounter/nihss'], ['ICH score', '#/encounter/ich-score']
];

// One search across navigation, protocols, calculators, evidence and trials.
// Results are links; selecting one only changes the route.
export default function QuickSearch({ open, onClose, version, trials = [] }) {
  const dialog = useRef(null), input = useRef(null), list = useRef(null);
  const [query, setQuery] = useState(''), [active, setActive] = useState(0);
  const { data, failed } = useReferenceData(version);
  const index = useMemo(() => buildSearchIndex({ ...(data || {}), trials }), [data, trials]);
  const results = useMemo(() => searchIndex(index, query), [index, query]);
  const groups = groupResults(results);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      if (typeof node.showModal === 'function') node.showModal(); else node.setAttribute('open', '');
      setQuery(''); setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && node.open) { if (typeof node.close === 'function') node.close(); else node.removeAttribute('open'); }
  }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);
  const go = record => {
    onClose();
    if (!record) return;
    if (record.external) { window.open(record.href, '_blank', 'noopener,noreferrer'); return; }
    if (location.hash !== record.href) location.hash = record.href;
    if (record.focus) requestAnimationFrame(() => requestAnimationFrame(() => focusEncounterTarget(record.focus)));
  };
  const onKeyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(value => Math.min(value + 1, Math.max(results.length - 1, 0))); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
    if (event.key === 'Enter' && results[active]) { event.preventDefault(); go(results[active]); }
  };
  let position = -1;
  return <dialog ref={dialog} className="quick-search" aria-label="Search" onClose={onClose} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="quick-search__panel">
      <div className="quick-search__field">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input ref={input} type="text" inputMode="search" enterKeyHint="go" role="combobox" aria-expanded={results.length > 0} aria-controls="quick-search-results" aria-activedescendant={results[active] ? `qs-${results[active].id}` : undefined} aria-label="Search protocols, calculators, evidence and trials" placeholder="Search protocols, calculators, evidence, trials…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyDown} autoComplete="off" spellCheck="false" />
        <button type="button" className="quick-search__close" onClick={onClose} aria-label="Close search">Esc</button>
      </div>
      <div ref={list} id="quick-search-results" role="listbox" aria-label="Search results" className="quick-search__results">
        {!query.trim() && <div className="quick-search__empty"><p>Jump to</p><ul className="quick-search__chips">{SUGGESTIONS.map(([label, href]) => <li key={href}><a href={href} onClick={() => onClose()}>{label}</a></li>)}</ul>{!data && !failed && <p className="quick-search__hint">Loading evidence index…</p>}</div>}
        {query.trim() && !results.length && <p className="quick-search__hint" role="status">No matches. Try a drug, score, trial or topic.</p>}
        {groups.map(([group, items]) => <section key={group} aria-label={group}><h2>{group}</h2>{items.map(record => {
          position += 1;
          const index = position;
          return <a key={record.id} id={`qs-${record.id}`} role="option" aria-selected={index === active} data-active={index === active} href={record.href} target={record.external ? '_blank' : undefined} rel={record.external ? 'noopener noreferrer' : undefined} onMouseMove={() => setActive(index)} onClick={event => { event.preventDefault(); go(record); }}>
            <span className="quick-search__title">{record.title}</span>{record.subtitle && <span className="quick-search__meta">{record.subtitle}</span>}
          </a>;
        })}</section>)}
      </div>
      <p className="quick-search__footer"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p>
    </div>
  </dialog>;
}
