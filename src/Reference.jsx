import React, { useEffect, useRef, useState } from 'react';
import { CARE_SETTINGS, searchReference, referenceText, validReferenceData } from './reference-search.js';

let cached;
function loadReference(version) {
  if (!cached || cached.version !== version) {
    const entry = { version };
    entry.promise = fetch('./data/clinical-reference.json').then(async response => {
      if (!response.ok) throw Error('Reference download unavailable');
      const envelope = await response.json();
      if (!validReferenceData(envelope, version)) throw Error('Reference version or content mismatch');
      return envelope.data;
    }).catch(error => { if (cached === entry) cached = null; throw error; });
    cached = entry;
  }
  return cached.promise;
}
export default function Reference({ version, mode = 'topics', focusId, active = true }) {
  const [data, setData] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState(''), [setting, setSetting] = useState('all'), [opened, setOpened] = useState({});
  const [copy, setCopy] = useState(null), epoch = useRef(0), fallback = useRef(null), container = useRef(null);
  const clearCopy = () => { epoch.current++; setCopy(null); };
  useEffect(() => {
    let current = true; setFailed(false); setData(null);
    loadReference(version).then(value => { if (current) setData(value); }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; epoch.current++; };
  }, [version, attempt]);
  useEffect(() => { clearCopy(); }, [active, mode, focusId]);
  useEffect(() => {
    if (!active || !focusId || !data) return;
    setQuery(''); setSetting('all'); setOpened(previous => ({ ...previous, [focusId]: true }));
    const frame = requestAnimationFrame(() => {
      const target = focusId.startsWith('topic-') ? container.current?.querySelector('[data-topic-heading]') : container.current?.querySelector(`[data-reference-id="${focusId}"]`);
      target?.scrollIntoView({ block: 'start' }); (target?.querySelector('summary') || target)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId, active, data]);
  useEffect(() => { if (copy?.failed) { fallback.current?.focus(); fallback.current?.select(); } }, [copy]);
  const copyRecord = async record => {
    const request = ++epoch.current, text = referenceText(record); setCopy(null);
    try { await navigator.clipboard.writeText(text); if (epoch.current === request) setCopy({ id: record.id, failed: false }); }
    catch { if (epoch.current === request) setCopy({ id: record.id, text, failed: true }); }
  };
  const studies = mode === 'studies', title = studies ? 'Completed evidence' : 'Evidence';
  if (failed) return <section className="reference-surface" role="alert"><h2>{title} unavailable</h2><p>The reference download is unavailable or out of date.</p><button className="workspace-secondary-action" onClick={() => setAttempt(value => value + 1)}>Retry reference download</button></section>;
  if (!data) return <p role="status">Loading {title.toLowerCase()}…</p>;
  const topicId = studies && focusId?.startsWith('topic-') ? focusId.slice(6) : null;
  const topic = data.topics.find(record => record.id === topicId);
  const records = topic ? data.studies.filter(record => record.relatedTopic === topicId) : data[mode];
  const results = searchReference(records, query, setting);
  return <section ref={container} className="reference-surface" aria-label={title}>
    {studies ? <h2>{title}</h2> : <h1>{title}</h1>}
    <p className="workspace-help">{studies ? 'Published outcomes, populations and applicability.' : 'Clinical questions for on-call, hospital and clinic decisions.'}</p>
    {topic && <p data-topic-heading tabIndex={-1}><strong>{topic.title}</strong> · <a href="#/trials/completed">Show all completed evidence</a></p>}
    <div className="reference-filters"><label className="workspace-field"><span>{studies ? 'Find completed evidence' : 'Find a clinical question'}</span><input type="search" value={query} onChange={event => { clearCopy(); setQuery(event.target.value); }} placeholder={studies ? 'Trial, treatment or clinical question' : 'e.g. anticoagulation timing, reversal, PFO'} /></label><label className="workspace-field"><span>Care setting</span><select aria-label="Care setting" value={setting} onChange={event => { clearCopy(); setSetting(event.target.value); }}>{CARE_SETTINGS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>{(query || setting !== 'all') && <button className="workspace-secondary-action" onClick={() => { clearCopy(); setQuery(''); setSetting('all'); }}>Clear filters</button>}</div>
    <p role="status" className="workspace-help">{results.length} {studies ? 'studies' : 'topics'} found.</p>
    {focusId && !topic && !records.some(record => record.id === focusId) && <p role="status">Reference not found. Browse below.</p>}
    {results.map(record => <details className="reference-card" data-reference-id={record.id} key={record.id} open={Boolean(opened[record.id])} onToggle={event => { const open = event.currentTarget.open; if (!open) clearCopy(); setOpened(previous => previous[record.id] === open ? previous : { ...previous, [record.id]: open }); }}>
      <summary><span>{record.title}</span>{studies && <span className="reference-year">{record.year}</span>}</summary>
      <div className="reference-body">{studies ? <><p>{record.question}</p><dl>{[['Population', record.population], ['Comparison', record.comparison], ['Result', record.result]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <><p>{record.summary}</p><ul>{record.consider.map(item => <li key={item}>{item}</li>)}</ul></>}
        <p className="reference-limits"><strong>Applicability / limits:</strong> {record.caution || record.limits}</p>
        <div className="reference-links">{(record.related || []).map(link => <a key={link.href} href={link.href}>{link.label}</a>)}{studies && record.relatedTopic && <a href={`#/evidence/${record.relatedTopic}`}>Related guidance</a>}{!studies && data.studies.some(study => study.relatedTopic === record.id) && <a href={`#/trials/completed/topic-${record.id}`}>Related completed evidence</a>}</div>
        <div className="reference-sources"><h3>Sources</h3>{record.sources.map(source => <div key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.type} · {source.year} · Source checked {source.checkedAt}</p><p>{source.access}</p></div>)}</div>
        <button className="workspace-secondary-action" onClick={() => copyRecord(record)}>{`Copy ${record.title} evidence`}</button>
        {copy?.id === record.id && <div role="status">{copy.failed ? <><p>Clipboard unavailable. Select and copy the text below.</p><textarea ref={fallback} aria-label="Evidence copy fallback" readOnly rows={8} value={copy.text} /></> : 'Copied with sources and limits.'}</div>}
      </div>
    </details>)}
    <p className="workspace-help">External sources require internet; installed summaries are available offline.</p>
    {!studies && <div className="reference-links"><a href="https://professional.heart.org/en/guidelines-and-statements" target="_blank" rel="noopener noreferrer">AHA guidelines and statements</a><a href="https://eso-stroke.org/guidelines/eso-guideline-directory/" target="_blank" rel="noopener noreferrer">ESO guideline directory</a></div>}
  </section>;
}
