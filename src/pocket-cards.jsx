// Interactive adult protocol cards limited to the accepted institutional source
// set. Public builds use de-identified source labels and omit operational tokens.

import React, { useEffect, useMemo, useState } from 'react';
import {
  INSTITUTIONAL_BP_PROTOCOLS,
  SAFE_PAUSE_ATTESTATION,
  getSafePauseIssues,
  getSafePauseText,
  evaluateIVT,
  evaluateEVT_Anterior,
  evaluateEVT_M2,
  evaluateEVT_Basilar,
  EXTENDED_WINDOW_IVT_DISCUSSION,
  IVT_ABSOLUTE_CONTRAINDICATIONS,
  IVT_RELATIVE_CONTRAINDICATIONS,
  IVT_BENEFIT_GREATER_CONSIDER,
  IVT_UNRESOLVED_SOURCE_CONFLICTS
} from './institutional-protocols.js';

// Display-only rounding for Encounter-derived values (e.g. 79.832257 kg from a
// pound entry or 2.5061980555 h elapsed). Evaluators keep the full precision.
export const displayHours = (value) => {
  const n = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN);
  return Number.isFinite(n) ? String(Number(n.toFixed(1))) : (value ?? '');
};
export const displayMeasuredValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /^-?\d+\.\d{3,}$/.test(text.trim()) ? String(Number(Number(text).toFixed(1))) : text;
};
const bpOrderInvalid = (sbp, dbp) => {
  const s = parseFloat(sbp), d = parseFloat(dbp);
  return Number.isFinite(s) && Number.isFinite(d) && s > 0 && d > 0 && s <= d;
};


const CorChip = ({ cor }) => {
  if (!cor) return null;
  const norm = String(cor).toLowerCase().replace(/[()]/g, '').replace(/:/g, '').trim();
  const color = norm.startsWith('1') ? 'bg-ok-100 text-ok-900 border-ok-300 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800'
    : norm.startsWith('2a') ? 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800'
    : norm.startsWith('2b') ? 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800'
    : norm.includes('harm') ? 'bg-crit-100 text-crit-900 border-crit-400 dark:bg-crit-950 dark:text-crit-300'
    : norm.includes('no benefit') || norm.startsWith('3') ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-paper-2 dark:text-ink-2 dark:border-strong';
  return <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} break-words max-w-full`}>COR {cor}</span>;
};

const LoeChip = ({ loe }) => {
  if (!loe) return null;
  return <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap dark:bg-paper-2 dark:text-ink-2 dark:border-strong">LOE {loe}</span>;
};

// Overlapping Encounter inputs are controlled. Independent protocol-card
// inputs belong to the source revision that was reviewed. Align the local
// store during rendering, before any evaluator can see an old attestation;
// keeping the component mounted preserves focus and ordinary navigation.
export function useProtocolCaseState(initial, encounter, canonical = {}, readOnlyKeys = []) {
  const controlled = encounter !== undefined && encounter !== null;
  const sourceKey = controlled ? encounter.sourceKey : undefined;
  const [stored, setStored] = useState(() => ({ controlled, sourceKey, values: initial }));
  const changed = stored.controlled !== controlled || stored.sourceKey !== sourceKey;
  const local = changed ? initial : stored.values;
  if (changed) setStored({ controlled, sourceKey, values: initial });
  const state = controlled ? { ...local, ...canonical } : local;
  const set = (key, value) => {
    if (controlled && Object.prototype.hasOwnProperty.call(canonical, key)) {
      if (!readOnlyKeys.includes(key)) encounter.onChange?.(key, value);
      return;
    }
    setStored(previous => ({ controlled, sourceKey, values: { ...(previous.controlled === controlled && previous.sourceKey === sourceKey ? previous.values : initial), [key]: value } }));
  };
  return [state, set];
}

// ----------------------------------------------------------------------
// IVT Eligibility interactive card
// ----------------------------------------------------------------------
const IVTEligibilityCard = ({ defaults = {}, encounter }) => {
  const [state, set] = useProtocolCaseState({
    ichOnCT: defaults.ichOnCT === true ? true : defaults.ichOnCT === false ? false : null,
    disablingDeficit: defaults.disablingDeficit === true ? true : defaults.disablingDeficit === false ? false : null,
    hoursFromLKW: defaults.hoursFromLKW || '',
    glucose: defaults.glucose || '',
    weight: defaults.weight || '',
    age: defaults.age || '',
    bpSystolic: '',
    bpDiastolic: '',
    contraindicationsReviewed: false,
    preMRS: '',
    evtStatus: '',
    consentObtained: false,
    wakeUpOrUnknownOnset: defaults.wakeUpOrUnknownOnset === true,
    glucoseCorrectedDeficitPersists: false,
    mriDwiFlairMismatch: false,
    ctpCoreMl: '', ctpRatio: '', ctpMismatchVolMl: '',
    smallVessel: false, posteriorCirc: false, contrastAllergy: false,
    crao: false,
    lvoOnCta: null
  }, encounter, encounter?.ivt, ['hoursFromLKW', 'lvoOnCta', 'mriDwiFlairMismatch', 'ctpCoreMl', 'ctpRatio', 'ctpMismatchVolMl']);
  const lvoFromEncounter = Boolean(encounter?.ivt) && Object.prototype.hasOwnProperty.call(encounter.ivt, 'lvoOnCta');
  const fromEncounter = key => Boolean(encounter?.ivt) && Object.prototype.hasOwnProperty.call(encounter.ivt, key);
  const result = useMemo(() => evaluateIVT({
    ichOnCT: state.ichOnCT,
    disablingDeficit: state.disablingDeficit,
    hoursFromLKW: state.hoursFromLKW,
    glucose: state.glucose,
    weight: state.weight,
    age: state.age,
    bpSystolic: state.bpSystolic,
    bpDiastolic: state.bpDiastolic,
    contraindicationsReviewed: state.contraindicationsReviewed && !encounter?.safetyReviewRequired,
    safetyReviewReason: encounter?.safetyReviewRequired ? (encounter.safetyReviewReason || 'Encounter records a safety concern requiring clinician review') : '',
    lvoOnCta: state.lvoOnCta,
    preMRS: state.preMRS,
    evtStatus: state.evtStatus,
    consentObtained: state.consentObtained,
    wakeUpOrUnknownOnset: state.wakeUpOrUnknownOnset,
    wakeUpRecognition: encounter?.ivt?.wakeUpRecognition === true,
    glucoseCorrectedDeficitPersists: state.glucoseCorrectedDeficitPersists,
    imagingPathway: {
      mriDwiFlairMismatch: state.mriDwiFlairMismatch,
      ctpCoreMl: state.ctpCoreMl,
      ctpRatio: state.ctpRatio,
      ctpMismatchVolMl: state.ctpMismatchVolMl,
      smallVessel: state.smallVessel,
      posteriorCirc: state.posteriorCirc,
      contrastAllergy: state.contrastAllergy
    },
    crao: state.crao
  }), [state, encounter?.safetyReviewRequired, encounter?.safetyReviewReason, encounter?.ivt?.wakeUpRecognition]);

  const colorByEligible = (e) => e === true ? 'border-ok-400 bg-ok-50 dark:bg-ok-950' : e === 'consider' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950' : e === 'pending' ? 'border-warn-400 bg-warn-50 dark:bg-warn-950' : e === false ? 'border-rose-400 bg-rose-50 dark:bg-rose-950' : 'border-slate-300 bg-slate-50 dark:border-strong dark:bg-paper-2';

  return (
    <div id="pc-ivt" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] p-3 rounded-lg border border-cobalt-300 bg-white dark:border-cobalt-700 dark:bg-card">
      <h4 className="font-bold text-cobalt-900 mb-2 flex items-center gap-2 dark:text-cobalt-300">
        <span className="inline-block px-2 py-0.5 bg-cobalt-900 text-white text-xs rounded">INST</span>
        IVT Eligibility Decision Algorithm
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs mb-3">
        <label><span className="block text-slate-600 dark:text-ink-2">CT hemorrhage assessment</span>
          <select value={state.ichOnCT === null ? '' : state.ichOnCT ? 'present' : 'absent'} disabled={encounter?.compatible === false} onChange={(e) => set('ichOnCT', e.target.value === '' ? null : e.target.value === 'present')} className="w-full px-2 py-1 border rounded text-sm">
            <option value="">Not confirmed</option>
            <option value="absent">No intracranial hemorrhage</option>
            <option value="present">Intracranial hemorrhage present</option>
          </select>
        </label>
        <label><span className="block text-slate-600 dark:text-ink-2">Deficit assessment</span>
          <select value={state.disablingDeficit === null ? '' : state.disablingDeficit ? 'disabling' : 'non-disabling'} disabled={encounter?.compatible === false} onChange={(e) => set('disablingDeficit', e.target.value === '' ? null : e.target.value === 'disabling')} className="w-full px-2 py-1 border rounded text-sm">
            <option value="">Not confirmed</option>
            <option value="disabling">Disabling deficit</option>
            <option value="non-disabling">Non-disabling deficit</option>
          </select>
        </label>
        <label><span className="block text-slate-600 dark:text-ink-2">LKW (h)</span><input type="number" step="0.1" value={encounter ? displayHours(state.hoursFromLKW) : state.hoursFromLKW} readOnly={!!encounter} onChange={(e) => set('hoursFromLKW', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={state.wakeUpOrUnknownOnset} disabled={encounter?.compatible === false} onChange={(e) => set('wakeUpOrUnknownOnset', e.target.checked)} />Wake-up or unknown LKW (leave LKW hours blank)</label>
        <label><span className="block text-slate-600 dark:text-ink-2">Glucose</span><input type="number" value={state.glucose} onChange={(e) => set('glucose', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600 dark:text-ink-2">Weight (kg)</span><input type="number" step="0.1" value={displayMeasuredValue(state.weight)} onChange={(e) => set('weight', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600 dark:text-ink-2">Age</span><input type="number" value={state.age} onChange={(e) => set('age', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600 dark:text-ink-2">Current SBP</span><input type="number" value={state.bpSystolic} onChange={(e) => set('bpSystolic', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600 dark:text-ink-2">Current DBP</span><input type="number" value={state.bpDiastolic} onChange={(e) => set('bpDiastolic', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600 dark:text-ink-2">Baseline mRS</span>
          <select value={state.preMRS} onChange={(e) => set('preMRS', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="">Not assessed</option>
            {['0', '1', '2', '3', '4', '5'].map((x) => <option key={x} value={x}>{x}</option>)}
            {encounter && String(state.preMRS) === '6' && <option value={state.preMRS}>{state.preMRS}</option>}
          </select>
        </label>
        <label><span className="block text-slate-600 dark:text-ink-2">EVT candidacy / feasibility</span>
          <select value={state.evtStatus} onChange={(e) => set('evtStatus', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="">Not assessed</option>
            <option value="not-candidate">Not an EVT candidate</option>
            <option value="candidate-feasible">EVT candidate; EVT within 24h feasible</option>
            <option value="candidate-infeasible">EVT candidate; EVT within 24h not feasible</option>
          </select>
        </label>
        <label className="flex items-center gap-1 sm:col-span-2"><input type="checkbox" checked={state.crao} onChange={(e) => set('crao', e.target.checked)} />CRAO (central retinal artery occlusion)</label>
        <label className="flex items-center gap-1 sm:col-span-2"><input type="checkbox" checked={state.contraindicationsReviewed} onChange={(e) => set('contraindicationsReviewed', e.target.checked)} />Absolute and relative contraindications reviewed</label>
        {bpOrderInvalid(state.bpSystolic, state.bpDiastolic) && (
          <p role="alert" className="sm:col-span-2 md:col-span-4 text-xs font-semibold text-crit-800 dark:text-crit-300">Check BP order: systolic must exceed diastolic before any IVT evaluation.</p>
        )}
        {(parseFloat(state.glucose) < 50 || parseFloat(state.glucose) > 400) && (
          <label className="flex items-center gap-1 sm:col-span-2"><input type="checkbox" checked={state.glucoseCorrectedDeficitPersists} onChange={(e) => set('glucoseCorrectedDeficitPersists', e.target.checked)} />Glucose corrected and disabling deficit persists on reassessment</label>
        )}
      </div>
      {(state.wakeUpOrUnknownOnset || (state.hoursFromLKW && parseFloat(state.hoursFromLKW) > 4.5)) && (
        <div className="mb-3 p-2 rounded border border-cobalt-200 bg-cobalt-50 text-xs dark:border-cobalt-700 dark:bg-cobalt-900">
          <p className="font-semibold text-cobalt-900 mb-1 dark:text-cobalt-300">Extended-window imaging selection (prefer MRI if small vessel, posterior, or contrast allergy):</p>
          {state.wakeUpOrUnknownOnset && !state.hoursFromLKW && <p className="mb-2 text-cobalt-900 dark:text-cobalt-300">Wake-up/unknown-onset treatment requires MRI DWI-FLAIR mismatch in this institutional branch; the CTP fields apply only when a known interval is entered.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.mriDwiFlairMismatch} disabled={fromEncounter('mriDwiFlairMismatch')} onChange={(e) => set('mriDwiFlairMismatch', e.target.checked)} />{state.wakeUpOrUnknownOnset || encounter?.ivt?.mriDwiFlairMismatch !== undefined ? <>MRI DWI-FLAIR mismatch, DWI lesion &lt;1/3 MCA, ≤4.5 h from recognition</> : 'MRI DWI-FLAIR mismatch (4.5-9h or wake-up)'}{fromEncounter('mriDwiFlairMismatch') ? ' (from Encounter)' : ''}</label>
            <label><span className="block text-slate-600 dark:text-ink-2">CTP core (mL){fromEncounter('ctpCoreMl') ? ' (from Encounter)' : ''}</span><input type="number" disabled={(state.wakeUpOrUnknownOnset && !state.hoursFromLKW) || fromEncounter('ctpCoreMl')} value={state.ctpCoreMl} onChange={(e) => set('ctpCoreMl', e.target.value)} className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100 disabled:text-slate-400" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">CTP ratio{fromEncounter('ctpRatio') ? ' (from Encounter)' : ''}</span><input type="number" step="0.1" disabled={(state.wakeUpOrUnknownOnset && !state.hoursFromLKW) || fromEncounter('ctpRatio')} value={state.ctpRatio} onChange={(e) => set('ctpRatio', e.target.value)} className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100 disabled:text-slate-400" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Mismatch vol (mL){fromEncounter('ctpMismatchVolMl') ? ' (from Encounter)' : ''}</span><input type="number" disabled={(state.wakeUpOrUnknownOnset && !state.hoursFromLKW) || fromEncounter('ctpMismatchVolMl')} value={state.ctpMismatchVolMl} onChange={(e) => set('ctpMismatchVolMl', e.target.value)} className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100 disabled:text-slate-400" /></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.smallVessel} onChange={(e) => set('smallVessel', e.target.checked)} />Small vessel</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.posteriorCirc} onChange={(e) => set('posteriorCirc', e.target.checked)} />Posterior circulation</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.contrastAllergy} onChange={(e) => set('contrastAllergy', e.target.checked)} />Contrast allergy</label>
            {parseFloat(state.hoursFromLKW) >= 9 && parseFloat(state.hoursFromLKW) <= 24 && (
              <>
                <label className="sm:col-span-2"><span className="block text-slate-600 dark:text-ink-2">LVO on CTA (ICA or MCA occlusion) — required 9-24h</span>
                  <select value={state.lvoOnCta === true ? 'yes' : state.lvoOnCta === false ? 'no' : ''} disabled={lvoFromEncounter} onChange={(e) => set('lvoOnCta', e.target.value === '' ? null : e.target.value === 'yes')} className="w-full px-2 py-1 border rounded text-sm">
                    <option value="">Not assessed</option>
                    <option value="yes">LVO present (ICA / M1 / M2)</option>
                    <option value="no">No LVO</option>
                  </select>
                </label>
                <label className="flex items-center gap-1 sm:col-span-2"><input type="checkbox" checked={state.consentObtained} onChange={(e) => set('consentObtained', e.target.checked)} />Consent obtained for the 9-24-hour window</label>
              </>
            )}
          </div>
        </div>
      )}
      {result.eligible !== null && <div className={`p-3 rounded border-2 ${colorByEligible(result.eligible)}`}>
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <strong className="text-sm">{result.recommendation || 'Awaiting input'}</strong>
          <CorChip cor={result.cor} /><LoeChip loe={result.loe} />
          {result.dose && <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-cobalt-100 text-cobalt-900 border border-cobalt-300 dark:bg-cobalt-900 dark:text-cobalt-300 dark:border-cobalt-700">TNK {result.dose} mg</span>}
        </div>
        {result.reason && <p className="text-xs text-slate-700 dark:text-ink-2">{result.reason}</p>}
        {result.selectionSource && <p className="text-xs text-slate-700 mt-1 dark:text-ink-2">{result.selectionSource}</p>}
        {result.nextStep && <p className="text-xs text-cobalt-800 mt-1 dark:text-cobalt-300"><strong>Next:</strong> {result.nextStep}</p>}
        {result.alternativeAgent && <p className="text-xs text-slate-600 mt-1 dark:text-ink-2">{result.alternativeAgent}</p>}
        {result.imagingGuidance && <p className="text-xs text-cobalt-800 mt-1 dark:text-cobalt-300">{result.imagingGuidance}</p>}
        {Array.isArray(result.warnings) && result.warnings.length > 0 && (
          <ul className="list-disc list-inside text-xs text-warn-800 mt-1 dark:text-warn-300">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>}
      {(state.wakeUpOrUnknownOnset || parseFloat(state.hoursFromLKW) > 4.5) && result.eligible === 'consider' && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-cobalt-900 dark:text-cobalt-300">Read-aloud patient discussion script (extended-window IVT)</summary>
          <div className="mt-1 p-2 rounded border border-cobalt-200 bg-cobalt-50 text-xs whitespace-pre-wrap dark:border-cobalt-700 dark:bg-cobalt-900">{EXTENDED_WINDOW_IVT_DISCUSSION}</div>
          <button type="button" onClick={() => { try { navigator.clipboard.writeText(EXTENDED_WINDOW_IVT_DISCUSSION); } catch (_) {} }} className="mt-1 px-2 py-1 bg-cobalt-100 hover:bg-cobalt-200 text-cobalt-900 text-xs rounded dark:bg-cobalt-900 dark:hover:bg-cobalt-800 dark:text-cobalt-300">Copy</button>
        </details>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// EVT Eligibility matrix (anterior / M2 / basilar)
// ----------------------------------------------------------------------
const EVTEligibilityCard = ({ defaults = {}, encounter }) => {
  // Open on the branch that matches the recorded occlusion; the clinician can still switch.
  const [branch, setBranch] = useState(() => encounter?.evtBranch || 'anterior');
  useEffect(() => { if (encounter?.evtBranch) setBranch(encounter.evtBranch); }, [encounter?.evtBranch]);
  const [ant, setAnt] = useProtocolCaseState({ aspectsScore: defaults.aspects || '', timeFromLKWh: defaults.hoursFromLKWh || '', nihss: defaults.nihss || '', preMRS: defaults.preMRS ?? '', age: defaults.age ?? '', massEffect: null, coreVolume: '' }, encounter, encounter?.anterior, ['nihss', 'timeFromLKWh']);
  const [m2, setM2] = useProtocolCaseState({ segment: '', dominant: true, hoursFromLKWh: '', nihss: '', preMRS: '', aspectsScore: '', ctpMismatch: false, age: defaults.age ?? '' }, encounter, encounter?.m2, ['nihss', 'hoursFromLKWh']);
  const [bas, setBas] = useProtocolCaseState({ nihss: '', hoursFromLKWh: '', preMRS: '', pcAspects: '', age: defaults.age ?? '' }, encounter, encounter?.basilar, ['nihss', 'hoursFromLKWh']);

  useEffect(() => {
    if (encounter) return;
    const age = defaults.age ?? '';
    if (ant.age !== age) setAnt('age', age);
    if (m2.age !== age) setM2('age', age);
    if (bas.age !== age) setBas('age', age);
  }, [defaults.age, encounter]);

  const rAnt = useMemo(() => evaluateEVT_Anterior(ant), [ant]);
  const rM2 = useMemo(() => evaluateEVT_M2(m2), [m2]);
  const rBas = useMemo(() => evaluateEVT_Basilar(bas), [bas]);

  const colorByEligible = (e) => e === true ? 'border-ok-400 bg-ok-50 dark:bg-ok-950' : e === 'consider' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950' : e === 'pending' ? 'border-warn-400 bg-warn-50 dark:bg-warn-950' : e === false ? 'border-rose-400 bg-rose-50 dark:bg-rose-950' : 'border-slate-200 dark:border-line';

  return (
    <div id="pc-evt" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] p-3 rounded-lg border border-cobalt-300 bg-white dark:border-cobalt-700 dark:bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-cobalt-900 flex items-center gap-2 dark:text-cobalt-300">
          <span className="inline-block px-2 py-0.5 bg-cobalt-700 text-white text-xs rounded">INST</span>
          EVT Eligibility
        </h4>
        <div className="flex gap-1 flex-wrap">
          {['anterior', 'm2-distal', 'basilar'].map((k) => (
            <button key={k} type="button" onClick={() => setBranch(k)} className={`px-2 py-1 text-xs rounded ${branch === k ? 'bg-cobalt-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:hover:bg-overlay'}`}>
              {k === 'anterior' ? 'Anterior LVO' : k === 'm2-distal' ? 'M2 / Distal' : 'Basilar'}
            </button>
          ))}
        </div>
      </div>

      {branch === 'anterior' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label><span className="block text-slate-600 dark:text-ink-2">ASPECTS</span><input type="number" value={ant.aspectsScore} disabled={encounter?.compatible === false} onChange={(e) => setAnt('aspectsScore', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">LKW (h)</span><input type="number" step="0.1" value={encounter ? displayHours(ant.timeFromLKWh) : ant.timeFromLKWh} readOnly={!!encounter} onChange={(e) => setAnt('timeFromLKWh', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">NIHSS</span><input type="number" value={ant.nihss} readOnly={!!encounter} onChange={(e) => setAnt('nihss', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Pre-stroke mRS</span>
              <select value={ant.preMRS} onChange={(e) => setAnt('preMRS', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">Not assessed</option>
                {['0', '1', '2', '3', '4', '5', '6'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600 dark:text-ink-2">Age</span><input type="number" value={ant.age} onChange={(e) => setAnt('age', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">CTP core (mL)</span><input type="number" value={ant.coreVolume} disabled={encounter?.compatible === false} onChange={(e) => setAnt('coreVolume', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Significant mass effect</span>
              <select value={ant.massEffect === null ? '' : ant.massEffect ? 'present' : 'absent'} disabled={encounter?.compatible === false} onChange={(e) => setAnt('massEffect', e.target.value === '' ? null : e.target.value === 'present')} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">Not assessed</option>
                <option value="absent">Absent</option>
                <option value="present">Present</option>
              </select>
            </label>
          </div>
          {rAnt.eligible !== null && <div className={`p-2 rounded border-2 ${colorByEligible(rAnt.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">{rAnt.eligible === true || rAnt.eligible === 'consider' ? 'EVT' : rAnt.eligible === false ? 'NO EVT' : (rAnt.recommendation || 'Hold')}</strong>
              <CorChip cor={rAnt.cor} /><LoeChip loe={rAnt.loe} />
              {rAnt.window && <span className="px-1.5 py-0.5 text-xs bg-cobalt-100 text-cobalt-900 rounded dark:bg-cobalt-900 dark:text-cobalt-300">{rAnt.window}</span>}
            </div>
            <p className="text-xs mt-1">{rAnt.reason}</p>
          </div>}
        </>
      )}

      {branch === 'm2-distal' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label className="md:col-span-2">
              <span className="block text-slate-600 dark:text-ink-2">Segment</span>
              <select value={m2.segment} onChange={(e) => setM2('segment', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">Not assessed</option>
                <option value="M2-proximal-dominant">M2 proximal dominant (≤1 cm from bifurcation, ≥50% MCA)</option>
                <option value="M2-codominant">M2 codominant</option>
                <option value="M2-nondominant">M2 nondominant</option>
                <option value="ACA">ACA</option>
                <option value="PCA">PCA</option>
              </select>
            </label>
            <label><span className="block text-slate-600 dark:text-ink-2">LKW (h)</span><input type="number" step="0.1" value={encounter ? displayHours(m2.hoursFromLKWh) : m2.hoursFromLKWh} readOnly={!!encounter} onChange={(e) => setM2('hoursFromLKWh', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">NIHSS</span><input type="number" value={m2.nihss} readOnly={!!encounter} onChange={(e) => setM2('nihss', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Pre-mRS</span>
              <select value={m2.preMRS} onChange={(e) => setM2('preMRS', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">Not assessed</option>
                {['0', '1', '2', '3', '4', '5', '6'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600 dark:text-ink-2">ASPECTS</span><input type="number" value={m2.aspectsScore} disabled={encounter?.compatible === false} onChange={(e) => setM2('aspectsScore', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Age</span><input type="number" value={m2.age} onChange={(e) => setM2('age', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label className="flex items-center gap-1 sm:col-span-2"><input type="checkbox" checked={m2.ctpMismatch} onChange={(e) => setM2('ctpMismatch', e.target.checked)} />CTP hypoperfusion–hypodensity mismatch present (required beyond 6h)</label>
          </div>
          {(rM2.eligible === true || rM2.eligible === 'consider' || rM2.eligible === false) && <div className={`p-2 rounded border-2 ${colorByEligible(rM2.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">{rM2.eligible === true || rM2.eligible === 'consider' ? 'EVT' : 'NO EVT'}</strong>
              <CorChip cor={rM2.cor} /><LoeChip loe={rM2.loe} />
            </div>
            <p className="text-xs mt-1">{rM2.reason}</p>
            {rM2.gradeNote && <p className="text-xs text-slate-700 mt-1 dark:text-ink-2"><strong>Grade:</strong> {rM2.gradeNote}</p>}
            {rM2.requirement && <p className="text-xs text-cobalt-900 mt-1 dark:text-cobalt-300"><strong>Requirement:</strong> {rM2.requirement}</p>}
          </div>}
        </>
      )}

      {branch === 'basilar' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label><span className="block text-slate-600 dark:text-ink-2">NIHSS</span><input type="number" value={bas.nihss} readOnly={!!encounter} onChange={(e) => setBas('nihss', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">LKW (h)</span><input type="number" step="0.1" value={encounter ? displayHours(bas.hoursFromLKWh) : bas.hoursFromLKWh} readOnly={!!encounter} onChange={(e) => setBas('hoursFromLKWh', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Pre-mRS</span>
              <select value={bas.preMRS} onChange={(e) => setBas('preMRS', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
                <option value="">Not assessed</option>
                {['0', '1', '2', '3', '4', '5', '6'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600 dark:text-ink-2">PC-ASPECTS</span><input type="number" value={bas.pcAspects} disabled={encounter?.compatible === false} onChange={(e) => setBas('pcAspects', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600 dark:text-ink-2">Age</span><input type="number" value={bas.age} onChange={(e) => setBas('age', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
          </div>
          {(rBas.eligible === true || rBas.eligible === 'consider') && <div className={`p-2 rounded border-2 ${colorByEligible(rBas.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">
                {rBas.eligible === true ? 'EVT (Basilar)'
                  : 'EVT EFFECTIVENESS NOT WELL ESTABLISHED'}
              </strong>
              <CorChip cor={rBas.cor} /><LoeChip loe={rBas.loe} />
            </div>
            <p className="text-xs mt-1">{rBas.reason}</p>
            {rBas.institutionalRequirement && <p className="text-xs mt-1 text-cobalt-800 dark:text-cobalt-300"><strong>Institutional requirement:</strong> {rBas.institutionalRequirement}</p>}
          </div>}
          {(rBas.eligible === false || rBas.eligible === 'pending') && rBas.reason && <div className={`p-2 rounded border-2 ${colorByEligible(rBas.eligible)}`}>
            <strong className="text-sm">{rBas.eligible === false ? 'Basilar EVT criteria not met' : 'Basilar EVT inputs incomplete'}</strong>
            <p className="text-xs mt-1">{rBas.reason}</p>
          </div>}
        </>
      )}
    </div>
  );
};

// Hide the grade column while no institutional BP row carries a grade.
const SHOW_BP_GRADES = Object.values(INSTITUTIONAL_BP_PROTOCOLS).some(p => p.cor || p.loe);

// ----------------------------------------------------------------------
// Blood Pressure Management card
// ----------------------------------------------------------------------
const BPProtocolCard = () => (
  <div className="min-w-0 p-3 rounded-lg border border-rose-300 bg-white dark:bg-card dark:border-rose-800">
    <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-2 dark:text-rose-300">
      <span className="inline-block px-2 py-0.5 bg-rose-700 text-white text-xs rounded">INST</span>
      Blood Pressure Management
    </h4>
    <div className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Scrollable table: blood pressure management targets">
      <table className={`w-full ${SHOW_BP_GRADES ? 'min-w-[560px]' : 'min-w-[440px]'} text-xs`}>
        <thead className="bg-rose-50 dark:bg-rose-950">
          <tr><th className="px-2 py-1 text-left whitespace-nowrap">Scenario</th><th className="px-2 py-1 text-left whitespace-nowrap">Target</th>{SHOW_BP_GRADES && <th className="px-2 py-1 text-left whitespace-nowrap">COR / LOE</th>}<th className="px-2 py-1 text-left whitespace-nowrap">Institutional protocol</th></tr>
        </thead>
        <tbody>
          {Object.entries(INSTITUTIONAL_BP_PROTOCOLS).map(([key, p]) => {
            const isHarm = /harm/i.test(p.status || '') || /harm/i.test(p.cor || '');
            return (
              <tr key={key} className={`border-b ${isHarm ? 'bg-rose-50 dark:bg-rose-950' : ''}`}>
                <td className="px-2 py-1 font-semibold">{p.scenario}</td>
                <td className="px-2 py-1 whitespace-nowrap">{p.target || p.status}</td>
                {SHOW_BP_GRADES && <td className="px-2 py-1 whitespace-nowrap"><CorChip cor={p.cor} /> <LoeChip loe={p.loe} /></td>}
                <td className="px-2 py-1 text-slate-700 dark:text-ink-2">{p.protocol || p.rationale}{p.alternatives ? <><br /><em>{p.alternatives}</em></> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Contraindications card (3 columns)
// ----------------------------------------------------------------------
const ContraindicationsCard = () => (
  <div id="pc-contraindications" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] p-3 rounded-lg border border-crit-300 bg-white dark:border-crit-800 dark:bg-card">
    <h4 className="font-bold text-crit-900 mb-2 flex items-center gap-2 dark:text-crit-300">
      <span className="inline-block px-2 py-0.5 bg-crit-700 text-white text-xs rounded">INST</span>
      IVT Contraindications
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <section>
        <h5 className="font-bold text-crit-900 border-b border-crit-200 pb-1 mb-1 dark:text-crit-300 dark:border-crit-800">Absolute</h5>
        <ul className="space-y-1">
          {IVT_ABSOLUTE_CONTRAINDICATIONS.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px] dark:text-ink-2">{c.detail}</div></li>
          ))}
        </ul>
      </section>
      <section>
        <h5 className="font-bold text-warn-900 border-b border-warn-200 pb-1 mb-1 dark:text-warn-300 dark:border-warn-800">Relative (individualize)</h5>
        <ul className="space-y-1">
          {IVT_RELATIVE_CONTRAINDICATIONS.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px] dark:text-ink-2">{c.detail}</div></li>
          ))}
        </ul>
      </section>
      <section>
        <h5 className="font-bold text-ok-900 border-b border-ok-200 pb-1 mb-1 dark:text-ok-300 dark:border-ok-800">Benefit &gt; Risk · Consider IVT</h5>
        <ul className="space-y-1">
          {IVT_BENEFIT_GREATER_CONSIDER.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px] dark:text-ink-2">{c.detail}</div></li>
          ))}
        </ul>
      </section>
    </div>
    <section className="mt-3 border-t border-warn-200 pt-2 text-xs dark:border-warn-800">
      <h5 className="font-bold text-warn-900 mb-1 dark:text-warn-300">Unresolved local source conflicts (pending protocol-owner adjudication)</h5>
      <ul className="space-y-1">
        {IVT_UNRESOLVED_SOURCE_CONFLICTS.map((c) => (
          <li key={c.key}><strong>{c.label}</strong><div className="text-slate-600 text-[11px] dark:text-ink-2">{c.detail}</div></li>
        ))}
      </ul>
    </section>
  </div>
);

// ----------------------------------------------------------------------
// Safe Pause card
// ----------------------------------------------------------------------
const SafePauseCard = ({ defaults = {}, encounter }) => {
  const [st, setSt] = useProtocolCaseState({ consentType: encounter ? '' : defaults.consentType || '', bp: encounter ? '' : defaults.bp || '', contraindications: 'not reviewed', providerAgreement: 'not confirmed', drug: '' }, encounter);
  const drug = st.drug || (/alteplase/i.test(encounter?.drug || '') ? 'alteplase' : 'tnk');
  const issues = getSafePauseIssues(st);
  const complete = !encounter && issues.length === 0;
  const text = encounter && issues.length === 0
    ? 'Completed attestation unavailable: dose confirmation, pause performance, required-role confirmation and documentation are not recorded in this workspace.'
    : getSafePauseText({ ...st, drug });
  return (
    <div id="pc-safety-pause" className="scroll-mt-[calc(var(--case-bar-h,0px)+6rem)] p-3 rounded-lg border border-ok-300 bg-white dark:border-ok-800 dark:bg-card">
      <h4 className="font-bold text-ok-900 mb-2 flex items-center gap-2 dark:text-ok-300">
        <span className="inline-block px-2 py-0.5 bg-ok-700 text-white text-xs rounded">INST</span>
        Safety Pause (pre-thrombolytic)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
        <label>
          <span className="block text-slate-600 dark:text-ink-2">Consent type</span>
          <select value={st.consentType} onChange={(e) => setSt('consentType', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="">Not confirmed</option>
            <option value="informed">informed</option>
            <option value="presumed (unable to provide, no surrogate)">presumed (unable to provide, no surrogate)</option>
            <option value="surrogate">surrogate</option>
            <option value="declined">declined</option>
          </select>
        </label>
        <label><span className="block text-slate-600 dark:text-ink-2">BP at attestation</span><input type="text" value={st.bp} onChange={(e) => setSt('bp', e.target.value)} placeholder="e.g. 178/96" className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label>
          <span className="block text-slate-600 dark:text-ink-2">Contraindications</span>
          <select value={st.contraindications} onChange={(e) => setSt('contraindications', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="not reviewed">Not reviewed</option>
            <option value="reviewed">Absolute and relative contraindications reviewed</option>
          </select>
        </label>
        <label>
          <span className="block text-slate-600 dark:text-ink-2">Thrombolytic agent</span>
          <select value={drug} onChange={(e) => setSt('drug', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="tnk">Tenecteplase</option>
            <option value="alteplase">Alteplase</option>
          </select>
        </label>
        <label>
          <span className="block text-slate-600 dark:text-ink-2">Provider agreement</span>
          <select value={st.providerAgreement} onChange={(e) => setSt('providerAgreement', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="not confirmed">Not confirmed</option>
            <option value="confirmed">All providers agree with the thrombolytic decision</option>
          </select>
        </label>
      </div>
      {encounter && issues.length === 0 && <p className="text-xs mb-2">Reference checklist only. These fields do not record a completed safety pause. Document actual actions in Encounter; completed attestation and copy are unavailable here.</p>}
      <textarea readOnly aria-label={encounter ? 'Safe Pause reference checklist (read-only)' : 'Safe Pause attestation text (read-only, copyable)'} value={text} rows={7} className="w-full px-2 py-1 border rounded text-[11px] font-mono bg-slate-50 dark:bg-paper-2" />
      <div className="flex gap-2 mt-1">
        <button type="button" disabled={!complete} onClick={() => { try { navigator.clipboard.writeText(text); } catch (_) {} }} className="px-2 py-1 bg-ok-600 hover:bg-ok-700 disabled:bg-slate-200 disabled:text-slate-700 dark:disabled:bg-paper-2 dark:disabled:text-ink-2 disabled:cursor-not-allowed text-white text-xs rounded">Copy completed safety pause</button>
        <span className="text-[10px] text-slate-500 self-center dark:text-mute">Attestation placeholder: <strong>{SAFE_PAUSE_ATTESTATION}</strong></span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main PocketCards container
// ----------------------------------------------------------------------
export const PocketCards = ({ defaults = {}, encounter }) => {
  return (
    <div className="flex flex-col gap-3 [&>*]:min-w-0 [&>*]:max-w-full" role="region" aria-label="Protocol cards">
      <div className="px-3 py-2 bg-gradient-to-r from-cobalt-900 to-cobalt-800 text-white rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Protocol Cards — Institutional Adult Pathways</h3>
        </div>
        <span className="text-[10px] bg-white/20 dark:bg-paper-2/20 rounded px-2 py-0.5">v2</span>
      </div>
      <IVTEligibilityCard defaults={defaults} encounter={encounter} />
      <ContraindicationsCard />
      <EVTEligibilityCard defaults={defaults} encounter={encounter} />
      <BPProtocolCard />
      <SafePauseCard defaults={defaults} encounter={encounter} />
    </div>
  );
};
