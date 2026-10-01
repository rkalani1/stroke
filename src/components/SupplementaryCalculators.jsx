import React, { useEffect, useRef, useState } from 'react';
import { reviewedGcs } from '../encounter-clinical-review.js';
import { supplementaryResult, supplementaryReviewed, supplementarySourceKey, updateSupplementaryField, applySupplementaryScore, canApplySupplementaryScore, MRS_DESCRIPTORS } from '../supplementary-calculators.js';
import { matchesCalculatorSearch, reviewedCalculatorText } from '../calculator-utilities.js';

function Field({ field, value, onChange }) {
  const options = field.type === 'truth' ? [['true','Yes'],['false','No']] : field.options;
  return <label className="workspace-field"><span>{field.label}</span>{options ?
    <select aria-label={field.label} value={typeof value === 'boolean' ? String(value) : value ?? ''} onChange={event => onChange(field.type === 'truth' ? event.target.value === '' ? undefined : event.target.value === 'true' : event.target.value)}>
      <option value="">Not reviewed</option>{options.map(([key,label]) => <option key={key} value={key}>{label}</option>)}
    </select> : <input aria-label={field.label} type="number" min={field.min} max={field.max} step={field.step || 'any'} value={value ?? ''} onChange={event => onChange(event.target.value)} />}</label>;
}

function SharedInputs({ state, definition }) {
  const n = state.note || {}, values = { age:['Age',n.age,'years'], sex:['Sex',n.sex === 'M' ? 'Male' : n.sex === 'F' ? 'Female' : '', ''], bp:['Presenting BP',n.presentingBP,'mmHg'], mrs:['Baseline mRS',n.premorbidMRS,''], gcs:['Complete GCS',reviewedGcs(state.gcs),''], weight:['Weight',n.weight,'kg'], height:['Height',n.heightCm,'cm'], mtici:['Recorded mTICI',n.ticiScore,''], sahCause:['SAH cause',state.details?.sahCause,''] };
  return definition.shared?.length ? <div className="workspace-help"><p>{definition.shared.map(key => { const [label,value,unit] = values[key]; return `${label}: ${value === null || value === undefined || String(value).trim() === '' ? 'not documented' : `${value}${unit ? ` ${unit}` : ''}`}`; }).join(' · ')}</p><a href="#/encounter">Review shared inputs in Encounter</a></div> : null;
}

function Card({ state, update, definition, selected, visible, copyContext }) {
  const data = state.supplementary?.[definition.id] || {}, value = supplementaryResult(state,definition.id);
  const epoch = useRef(0), fallback = useRef(null), [copyState, setCopyState] = useState(null);
  const context = JSON.stringify([supplementarySourceKey(state,definition.id), data, visible, copyContext]);
  const previousContext = useRef(context);
  // A generation, rather than result equality, prevents edit-and-revert from
  // reattaching an old clipboard acknowledgement to a newly reviewed result.
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
  const canApply = canApplySupplementaryScore(state,definition.id);
  return <details id={`calc-${definition.id}`} className="tool-target workflow-section" open={selected || undefined} hidden={!visible}>
    <summary tabIndex={0}>{definition.name}</summary>
    <SharedInputs state={state} definition={definition} />
    {definition.id === 'pascal' && <p className="workspace-help">Reviewed RoPE: {supplementaryResult(state,'rope')?.score ?? 'incomplete'}. <a href="#/tools/rope">Complete the RoPE worksheet</a> before reviewing PASCAL.</p>}
    {definition.id === 'mrs-descriptors' ? <><p className="workspace-result" role="status">{value ? `Baseline mRS ${value.score}: ${value.description}` : 'Baseline mRS not assessed.'}</p><ol start={0} className="workspace-help">{MRS_DESCRIPTORS.map((text,index) => <li key={index}>{text}</li>)}</ol><label className="workspace-check"><input type="checkbox" checked={supplementaryReviewed(state,definition.id)} onChange={event => edit('reviewed',event.target.checked)} /> Baseline mRS entry and descriptor reviewed</label></> : <>
      <div className="field-grid">{definition.fields.map(field => <Field key={field.key} field={field} value={data[field.key]} onChange={next => edit(field.key,next)} />)}
        {definition.regions?.map(region => <Field key={region.key} field={{type:'truth',label:`Early ischemic change: ${region.label}${region.weight === 2 ? ' (2 points)' : ''}`}} value={data.regions?.[region.key]} onChange={next => edit('regions',previous => ({ ...previous, [region.key]:next }))} />)}
      </div>
      <label className="workspace-check"><input type="checkbox" checked={supplementaryReviewed(state,definition.id)} onChange={event => edit('reviewed',event.target.checked)} /> All required inputs and source applicability reviewed</label>
      <p className="workspace-result" role="status">{value ? value.category ? `PASCAL category: ${value.category} (source classification).` : value.grade ? `${definition.name}: ${value.grade}${value.description ? ` — ${value.description}` : ` · GCS ${value.gcs}`}` : `${definition.name}: ${value.unit ? `${value.score}${value.unit}` : `${value.score}/${value.max}`}${value.bmi === undefined ? '' : ` · BMI ${value.bmi.toFixed(1)} kg/m²`}` : 'Required inputs or source review incomplete; no score.'}</p>
      {value?.bang && <p className="workspace-help">Original BANG criteria: BMI over 35 — {value.bang.bmi ? 'Yes' : 'No'}; age over 50 — {value.bang.age ? 'Yes' : 'No'}; neck over 40 cm — {value.bang.neck ? 'Yes' : 'No'}; male sex — {value.bang.male ? 'Yes' : 'No'}. Thresholds use unrounded measurements.</p>}
      {definition.id === 'wfns' && reviewedGcs(state.gcs) === 15 && data.motorDeficit === true && <p className="workspace-help">GCS 15 with a motor deficit needs clinician grading; the original table has no category for this combination.</p>}
      {['abcd2','aspects-regions','pc-aspects-regions'].includes(definition.id) && <><button type="button" className="workspace-secondary-action" disabled={!canApply} onClick={() => update(previous => applySupplementaryScore(previous,definition.id))}>Use reviewed score in Encounter</button><p className="workspace-help">Applying replaces the corresponding Encounter score. Later worksheet or shared-source edits invalidate an applied score. {definition.id === 'abcd2' ? 'Requires an acute TIA Encounter.' : 'Requires an acute ischemic Encounter.'}</p></>}
    </>}
    <button type="button" className="workspace-secondary-action" disabled={!copyText} onClick={copy}>{definition.id === 'mrs-descriptors' ? 'Copy reviewed descriptor' : 'Copy reviewed result'}</button>
    {currentCopy && <div role="status" className="workspace-result">{currentCopy.failed ? <><p>Clipboard unavailable. Select this result and copy it manually.</p><label className="workspace-field"><span>Reviewed result</span><textarea ref={fallback} aria-label={`${definition.name} copy fallback`} readOnly rows={6} value={currentCopy.text} /></label></> : `${definition.name} copied.`}</div>}
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
  return <div ref={root} className="encounter-workflow supplementary-calculators" aria-label="Reviewed calculators">
    {tool && !query.trim() && !calculatorDefinitions.some(item => item.id === tool) && <p role="status">Calculator unavailable.</p>}
    {[...new Set(calculatorDefinitions.map(item => item.category))].map(category => <section key={category} aria-label={category} hidden={!calculatorDefinitions.some(item => item.category === category && visible(item))}><h3>{category}</h3>{calculatorDefinitions.filter(item => item.category === category).map(definition => <Card key={definition.id} state={state} update={update} definition={definition} selected={tool === definition.id} visible={visible(definition)} copyContext={`${tool || ''}\n${query}`} />)}</section>)}
  </div>;
}
