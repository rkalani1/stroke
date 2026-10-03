import React, { useEffect, useRef, useState } from 'react';
import { reviewedGcs } from '../encounter-clinical-review.js';
import { supplementaryResult, supplementaryReviewed, supplementarySourceKey, updateSupplementaryField, applySupplementaryScore, canApplySupplementaryScore, SUPPLEMENTARY_APPLY_IDS, MRS_DESCRIPTORS } from '../supplementary-calculators.js';
import { matchesCalculatorSearch, reviewedCalculatorText, calculatorProgress, calculatorResultParts } from '../calculator-utilities.js';

// Worksheets whose result can reach the Encounter. Only these keep an explicit
// attestation; every other worksheet scores live from explicit answers.
const NOTE_IDS = ['phq2', 'stop-bang'];
const APPLY_SCOPE = { abcd2:'Acute TIA Encounter only.', 'aspects-regions':'Acute ischemic Encounter only.', 'pc-aspects-regions':'Acute ischemic Encounter only.' };

function Field({ field, value, onChange }) {
  const options = field.type === 'truth' ? [['true','Yes'],['false','No']] : field.options;
  const answered = field.type === 'truth' ? typeof value === 'boolean' : value !== undefined && value !== null && String(value) !== '';
  return <label className="workspace-field calc-item" data-answered={answered || undefined}><span>{field.label}</span>{options ?
    <select aria-label={field.label} value={typeof value === 'boolean' ? String(value) : value ?? ''} onChange={event => onChange(field.type === 'truth' ? event.target.value === '' ? undefined : event.target.value === 'true' : event.target.value)}>
      <option value="">Select…</option>{options.map(([key,label]) => <option key={key} value={key}>{label}</option>)}
    </select> : <input aria-label={field.label} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step || 'any'} value={value ?? ''} onChange={event => onChange(event.target.value)} />}</label>;
}

function SharedInputs({ state, definition }) {
  const n = state.note || {}, values = { age:['Age',n.age,'y'], sex:['Sex',n.sex === 'M' ? 'Male' : n.sex === 'F' ? 'Female' : '', ''], bp:['Presenting BP',n.presentingBP,'mmHg'], mrs:['Baseline mRS',n.premorbidMRS,''], gcs:['GCS',reviewedGcs(state.gcs || {}),''], weight:['Weight',n.weight,'kg'], height:['Height',n.heightCm,'cm'], mtici:['Recorded mTICI',n.ticiScore,''], sahCause:['SAH cause',state.details?.sahCause,''] };
  if (!definition.shared?.length) return null;
  return <p className="workspace-help calc-shared"><span>From Encounter: {definition.shared.map(key => { const [label,value,unit] = values[key]; return `${label} ${value === null || value === undefined || String(value).trim() === '' ? 'not documented' : `${value}${unit ? ` ${unit}` : ''}`}`; }).join(' · ')}</span> <a href="#/encounter">Edit in Encounter</a></p>;
}

function Result({ definition, progress, parts }) {
  return <div className={`workspace-result calc-result${progress.complete ? '' : ' is-pending'}`} role="status">
    <span className="calc-result-name">{definition.name}<span className="sr-only">:</span></span>{' '}
    {parts ? <><strong className="calc-result-figure">{parts.figure}</strong>{parts.detail && <span className="calc-result-detail"><span className="sr-only"> — </span>{parts.detail}</span>}</>
      : <><strong className="calc-result-figure">Pending</strong><span className="calc-result-detail"><span className="sr-only"> — </span>{progress.status}</span></>}
  </div>;
}

function EncounterUse({ state, definition, complete, edit, update }) {
  const id = definition.id, attested = supplementaryReviewed(state,id), applied = state.supplementary?.applied?.[id];
  const attestation = <label className="workspace-check calc-attest"><input type="checkbox" disabled={!complete} checked={attested} onChange={event => edit('reviewed',event.target.checked)} /> Inputs and source limits reviewed</label>;
  if (NOTE_IDS.includes(id)) return <div className="calc-encounter">{attestation}<p className="workspace-help">Adds the score to follow-up notes; later edits clear it.</p></div>;
  return <div className="calc-encounter">{attestation}
    <div className="calc-actions"><button type="button" className="workspace-secondary-action" disabled={!canApplySupplementaryScore(state,id)} onClick={() => update(previous => applySupplementaryScore(previous,id))}>Use in Encounter</button>
      {applied && <span className="workspace-help calc-applied">In Encounter: {applied.value}</span>}</div>
    <p className="workspace-help">Replaces the Encounter score; later edits clear it. {APPLY_SCOPE[id]}</p>
  </div>;
}

function Card({ state, update, definition, selected, visible, copyContext }) {
  const data = state.supplementary?.[definition.id] || {}, progress = calculatorProgress(state,definition), parts = calculatorResultParts(state,definition,progress.value);
  const epoch = useRef(0), fallback = useRef(null), [copyState, setCopyState] = useState(null);
  const context = JSON.stringify([supplementarySourceKey(state,definition.id), data, visible, copyContext]);
  const previousContext = useRef(context);
  // A generation, rather than result equality, prevents edit-and-revert from
  // reattaching an old clipboard acknowledgement to a newly completed result.
  if (previousContext.current !== context) { previousContext.current = context; epoch.current += 1; }
  const currentCopy = copyState?.epoch === epoch.current ? copyState : null;
  const copyText = reviewedCalculatorText(state,definition);
  useEffect(() => () => { epoch.current += 1; }, []);
  useEffect(() => { if (currentCopy?.failed) { fallback.current?.focus(); fallback.current?.select(); } }, [currentCopy]);
  const edit = (key, next) => { epoch.current += 1; update(previous => updateSupplementaryField(previous,definition.id,key,typeof next === 'function' ? next(previous.supplementary?.[definition.id]?.[key]) : next)); };
  const copy = async () => {
    if (!visible || !copyText) return;
    const request = ++epoch.current;
    setCopyState(null);
    try {
      await navigator.clipboard.writeText(copyText);
      if (request === epoch.current) setCopyState({ epoch:request, failed:false });
    } catch {
      if (request === epoch.current) setCopyState({ epoch:request, failed:true, text:copyText });
    }
  };
  const encounterUse = SUPPLEMENTARY_APPLY_IDS.includes(definition.id) || NOTE_IDS.includes(definition.id);
  const rope = definition.id === 'pascal' ? supplementaryResult(state,'rope') : null;
  return <details id={`calc-${definition.id}`} className="tool-target workflow-section calc-card" open={selected || undefined} hidden={!visible}>
    <summary tabIndex={0}><span className="calc-summary-name">{definition.name}</span>{parts && <span className="calc-summary-score" aria-hidden="true">{parts.figure}</span>}</summary>
    <SharedInputs state={state} definition={definition} />
    {definition.id === 'pascal' && <p className="workspace-help">RoPE: {rope ? `${rope.score}/10` : 'incomplete'} · <a href="#/tools/rope">RoPE worksheet</a></p>}
    {definition.id === 'mrs-descriptors' && <ol start={0} className="workspace-help calc-descriptors">{MRS_DESCRIPTORS.map((text,index) => <li key={index}>{text}</li>)}</ol>}
    {(definition.fields?.length > 0 || definition.regions?.length > 0) && <div className="field-grid calc-grid">{definition.fields.map(field => <Field key={field.key} field={field} value={data[field.key]} onChange={next => edit(field.key,next)} />)}
      {definition.regions?.map(region => <Field key={region.key} field={{type:'truth',label:`Early ischemic change: ${region.label}${region.weight === 2 ? ' (2 points)' : ''}`}} value={data.regions?.[region.key]} onChange={next => edit('regions',previous => ({ ...previous, [region.key]:next }))} />)}
    </div>}
    <Result definition={definition} progress={progress} parts={parts} />
    {progress.value?.bang && <p className="workspace-help">BANG: BMI &gt;35 {progress.value.bang.bmi ? 'Yes' : 'No'} · age &gt;50 {progress.value.bang.age ? 'Yes' : 'No'} · neck &gt;40 cm {progress.value.bang.neck ? 'Yes' : 'No'} · male {progress.value.bang.male ? 'Yes' : 'No'} (unrounded values).</p>}
    <div className="calc-actions"><button type="button" className="workspace-secondary-action" disabled={!copyText} onClick={copy}>Copy result</button></div>
    {currentCopy && <div role="status" className="workspace-result">{currentCopy.failed ? <><p>Clipboard unavailable. Select this result and copy it manually.</p><label className="workspace-field"><span>Result text</span><textarea ref={fallback} aria-label={`${definition.name} copy fallback`} readOnly rows={6} value={currentCopy.text} /></label></> : `${definition.name} copied.`}</div>}
    {encounterUse && <EncounterUse state={state} definition={definition} complete={progress.complete} edit={edit} update={update} />}
    <details className="source-limits"><summary>Source / limits</summary><p>{definition.limits}</p><p>{definition.reviewScope}{definition.reviewedAt ? ` Scoring/descriptor check: ${definition.reviewedAt}.` : ''}</p><a href={definition.sourceUrl} target="_blank" rel="noopener noreferrer">{definition.sourceLabel}</a>{definition.verificationUrl && <p><a href={definition.verificationUrl} target="_blank" rel="noopener noreferrer">Verification source</a></p>}</details>
  </details>;
}

export default function SupplementaryCalculators({ state, update, tool, query = '', definitions: calculatorDefinitions }) {
  const root = useRef(null);
  const visible = item => query.trim() ? matchesCalculatorSearch(item,query) : !tool || item.id === tool;
  useEffect(() => {
    if (!tool) return;
    const target = [...(root.current?.querySelectorAll('details[id]') || [])].find(node => node.id === `calc-${tool}`);
    if (target) { target.open = true; target.scrollIntoView?.({block:'start'}); (target.querySelector('select,input') || target.querySelector('summary'))?.focus({preventScroll:true}); }
  }, [tool]);
  return <div ref={root} className="encounter-workflow supplementary-calculators" aria-label="Worksheets">
    {tool && !query.trim() && !calculatorDefinitions.some(item => item.id === tool) && <p role="status">Calculator unavailable.</p>}
    {[...new Set(calculatorDefinitions.map(item => item.category))].map(category => <section key={category} aria-label={category} hidden={!calculatorDefinitions.some(item => item.category === category && visible(item))}><h3>{category}</h3>{calculatorDefinitions.filter(item => item.category === category).map(definition => <Card key={definition.id} state={state} update={update} definition={definition} selected={tool === definition.id} visible={visible(definition)} copyContext={`${tool || ''}\n${query}`} />)}</section>)}
  </div>;
}
