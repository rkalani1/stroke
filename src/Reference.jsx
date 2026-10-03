import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CARE_SETTINGS, searchReference, referenceText, recommendationLabels } from './reference-search.js';
import { useReferenceData } from './reference-resource.js';

export default function Reference({ version, focusId, active = true }) {
  const { data, failed, retry } = useReferenceData(version);
  const [query, setQuery] = useState(''), [setting, setSetting] = useState('all'), [category, setCategory] = useState('all'), [opened, setOpened] = useState({});
  const [focusRequest, requestFocus] = useState(0);
  const [copy, setCopy] = useState(null), epoch = useRef(0), fallback = useRef(null), container = useRef(null), searchInput = useRef(null), resultTargets = useRef(new Set());
  const clearCopy = () => { epoch.current++; setCopy(null); };
  const changeFilters = () => { clearCopy(); resultTargets.current.clear(); };
  useEffect(() => () => { epoch.current++; }, []);
  useEffect(() => { clearCopy(); }, [active, focusId, focusRequest]);
  useLayoutEffect(() => {
    if (!active) { resultTargets.current.clear(); return; }
    if (!focusId || !data) return;
    const parentId = data.studies.find(study => study.id === focusId)?.relatedTopic;
    // In-panel result navigation and Back retain the current search; incoming deep links reveal their target.
    if (!resultTargets.current.has(focusId)) { resultTargets.current.clear(); setQuery(''); setSetting('all'); setCategory('all'); }
    setOpened(previous => ({ ...previous, [focusId]: true, ...(parentId ? { [parentId]: true } : {}) }));
    const frame = requestAnimationFrame(() => {
      const target = container.current?.querySelector(`[data-reference-id="${focusId}"]`);
      target?.scrollIntoView({ block: 'start' }); target?.querySelector('summary')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId, active, data, focusRequest]);
  useEffect(() => { if (copy?.failed) { fallback.current?.focus(); fallback.current?.select(); } }, [copy]);
  const copyRecord = async record => {
    const request = ++epoch.current, text = referenceText(record); setCopy(null);
    try { await navigator.clipboard.writeText(text); if (epoch.current === request) setCopy({ id: record.id, failed: false }); }
    catch { if (epoch.current === request) setCopy({ id: record.id, text, failed: true }); }
  };
  if (failed) return <section className="reference-surface" role="alert"><h2>Evidence unavailable</h2><p>The reference download is unavailable or out of date.</p><button className="workspace-secondary-action" onClick={retry}>Retry reference download</button></section>;
  if (!data) return <p role="status">Loading evidence…</p>;
  const categories = [...new Set(data.topics.map(record => record.category))];
  const matchingStudies = searchReference(data.studies, query, setting);
  const matchingTopics = new Set([...searchReference(data.topics, query, setting).map(record => record.id), ...matchingStudies.map(record => record.relatedTopic)]);
  const results = data.topics.filter(record => matchingTopics.has(record.id) && (category === 'all' || record.category === category));
  const groups = categories.map(name => [name, results.filter(record => record.category === name)]).filter(([, entries]) => entries.length);
  const ungrouped = category === 'all' ? matchingStudies.filter(record => !record.relatedTopic) : [];
  const studyResults = query.trim() ? matchingStudies.filter(record => category === 'all' || results.some(topic => topic.id === record.relatedTopic)) : [];
  if (ungrouped.length) groups.push(['Other study summaries', ungrouped]);
  const renderRecommendations = record => <section className="reference-recs" aria-label={`Guideline recommendations for ${record.title}`}><h3>Guideline recommendations</h3><ul>{record.recommendations.map(rec => {
    const label = recommendationLabels(rec);
    return <li key={rec.id}><span className="reference-chips"><span className={`reference-chip ${label.tone}`}>{label.cor}</span>{label.loe && <span className="reference-chip reference-chip-loe">{label.loe}</span>}</span><span className="reference-rec-text">{rec.text}</span><span className="reference-rec-source">{rec.source}</span></li>;
  })}</ul></section>;
  const renderSources = record => <details className="reference-sources"><summary>Sources ({record.sources.length})</summary><ul>{record.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> <span>· {source.year} · {source.type}</span></li>)}</ul>
    <details className="reference-provenance"><summary>Source provenance</summary><ul>{record.sources.map(source => <li key={source.url}><span>{source.title}</span> — checked {source.checkedAt}. {source.access}</li>)}</ul></details></details>;
  const renderCard = record => {
    const study = !record.summary;
    const relatedStudies = study ? [] : data.studies.filter(item => item.relatedTopic === record.id);
    return <details className="reference-card" data-reference-id={record.id} key={record.id} open={Boolean(opened[record.id])} onToggle={event => {
      if (event.target !== event.currentTarget) return;
      const open = event.currentTarget.open; if (!open) clearCopy();
      setOpened(previous => previous[record.id] === open ? previous : { ...previous, [record.id]: open });
    }}>
      <summary><span>{record.title}</span>{study && <span className="reference-year">{record.year}</span>}{study && record.headline && <span className="reference-headline">{record.headline}</span>}</summary>
      {opened[record.id] && <div className="reference-body">{study ? <><p>{record.question}</p><dl>{[['Population', record.population], ['Comparison', record.comparison], ['Result', record.result]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <><p className="reference-summary">{record.summary}</p>{record.recommendations?.length > 0 && renderRecommendations(record)}<ul>{record.consider.map(item => <li key={item}>{item}</li>)}</ul></>}
        <p className="reference-limits"><strong>Limits:</strong> {record.caution || record.limits}</p>
        {(record.related || []).length > 0 && <div className="reference-links">{record.related.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</div>}
        {relatedStudies.length > 0 && <section aria-label={`Study summaries for ${record.title}`}><h3>Study summaries</h3>{relatedStudies.map(renderCard)}</section>}
        {renderSources(record)}
        <button className="workspace-secondary-action" onClick={() => copyRecord(record)}>{`Copy ${record.title} evidence`}</button>
        {copy?.id === record.id && <div role="status">{copy.failed ? <><p>Clipboard unavailable. Select and copy the text below.</p><textarea ref={fallback} aria-label="Evidence copy fallback" readOnly rows={8} value={copy.text} /></> : 'Copied with sources and limits.'}</div>}
      </div>}
    </details>;
  };
  return <section ref={container} className="reference-surface" aria-label="Evidence">
    <h1>Evidence</h1>
    <div className="reference-filters"><label className="workspace-field"><span>Find a clinical question</span><input ref={searchInput} type="search" value={query} onChange={event => { changeFilters(); setQuery(event.target.value); }} placeholder="e.g. anticoagulation timing, ELAN, PFO" /></label><label className="workspace-field"><span>Care setting</span><select aria-label="Care setting" value={setting} onChange={event => { changeFilters(); setSetting(event.target.value); }}>{CARE_SETTINGS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="workspace-field"><span>Clinical section</span><select aria-label="Clinical section" value={category} onChange={event => { changeFilters(); setCategory(event.target.value); }}>{[['all', 'All sections'], ...categories.map(name => [name, name])].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>{(query || setting !== 'all' || category !== 'all') && <button className="workspace-secondary-action" onClick={() => { changeFilters(); setQuery(''); setSetting('all'); setCategory('all'); searchInput.current?.focus(); }}>Clear filters</button>}</div>
    <p role="status" className="workspace-help">{results.length} {results.length === 1 ? 'topic' : 'topics'} found.{ungrouped.length > 0 && ` ${ungrouped.length} additional study summaries.`}</p>
    {studyResults.length > 0 && <nav className="reference-study-results" aria-label="Matching study summaries"><h2>Matching study summaries <span>({studyResults.length})</span></h2><ul>{studyResults.map(record => <li key={record.id}><a href={`#/evidence/${record.id}`} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { resultTargets.current.add(record.id); if (focusId === record.id) requestFocus(value => value + 1); } }}>{record.title}<span className="reference-year">{record.year}</span>{record.headline && <span className="reference-headline">{record.headline}</span>}</a></li>)}</ul></nav>}
    {focusId && ![...data.topics, ...data.studies].some(record => record.id === focusId) && <p role="status">Reference not found. Browse below.</p>}
    {groups.map(([name, entries]) => <section key={name} className="reference-group" aria-label={name}><h2>{name}<span>{entries.length}</span></h2>{entries.map(renderCard)}</section>)}
    <p className="workspace-help">Summaries work offline; source links need internet.</p>
    <div className="reference-links"><a href="https://professional.heart.org/en/guidelines-statements" target="_blank" rel="noopener noreferrer">AHA guidelines and statements</a><a href="https://eso-stroke.org/guidelines/eso-guideline-directory/" target="_blank" rel="noopener noreferrer">ESO guideline directory</a></div>
  </section>;
}
