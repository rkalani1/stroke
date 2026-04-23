// Interactive protocol cards — example institutional decision-support
// patterns based on published evidence. Not endorsed by any named institution;
// adapt to local policy before clinical use.

import React, { useState, useMemo } from 'react';
import {
  INSTITUTIONAL_BP_PROTOCOLS,
  SAFE_PAUSE_ATTESTATION,
  getSafePauseText,
  evaluateIVT,
  evaluateDOAC_IVT,
  evaluateEVT_Anterior,
  evaluateEVT_M2,
  evaluateEVT_Basilar,
  EXTENDED_WINDOW_IVT_DISCUSSION,
  COR_LOE_KEY,
  IVT_ABSOLUTE_CONTRAINDICATIONS,
  IVT_RELATIVE_CONTRAINDICATIONS,
  IVT_BENEFIT_GREATER_CONSIDER,
  GENERALIZABILITY_LIMITATIONS
} from './institutional-protocols.js';

const CorChip = ({ cor }) => {
  if (!cor) return null;
  const norm = String(cor).toLowerCase().replace(/[()]/g, '').replace(/:/g, '').trim();
  const color = norm.startsWith('1') ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
    : norm.startsWith('2a') ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
    : norm.startsWith('2b') ? 'bg-orange-100 text-orange-900 border-orange-300'
    : norm.includes('harm') ? 'bg-red-100 text-red-900 border-red-400'
    : norm.includes('no benefit') || norm.startsWith('3') ? 'bg-rose-50 text-rose-900 border-rose-300'
    : 'bg-slate-100 text-slate-700 border-slate-300';
  return <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} whitespace-nowrap`}>COR {cor}</span>;
};

const LoeChip = ({ loe }) => {
  if (!loe) return null;
  return <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">LOE {loe}</span>;
};

// ----------------------------------------------------------------------
// IVT Eligibility interactive card
// ----------------------------------------------------------------------
const IVTEligibilityCard = ({ defaults = {} }) => {
  const [state, setState] = useState({
    ichOnCT: defaults.ichOnCT === true,
    disablingDeficit: defaults.disablingDeficit !== false,
    hoursFromLKW: defaults.hoursFromLKW || '',
    glucose: defaults.glucose || '',
    weight: defaults.weight || '',
    age: defaults.age || '',
    mismatchPresent: false,
    ctpCoreMl: '', ctpRatio: '', ctpMismatchVolMl: '',
    smallVessel: false, posteriorCirc: false, contrastAllergy: false,
    crao: false
  });
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));
  const result = useMemo(() => evaluateIVT({
    ichOnCT: state.ichOnCT,
    disablingDeficit: state.disablingDeficit,
    hoursFromLKW: state.hoursFromLKW,
    glucose: state.glucose,
    weight: state.weight,
    age: state.age,
    imagingPathway: {
      mismatchPresent: state.mismatchPresent,
      ctpCoreMl: state.ctpCoreMl,
      ctpRatio: state.ctpRatio,
      ctpMismatchVolMl: state.ctpMismatchVolMl,
      smallVessel: state.smallVessel,
      posteriorCirc: state.posteriorCirc,
      contrastAllergy: state.contrastAllergy
    },
    crao: state.crao
  }), [state]);

  const colorByEligible = (e) => e === true ? 'border-emerald-400 bg-emerald-50' : e === 'consider' ? 'border-yellow-400 bg-yellow-50' : e === false ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-slate-50';

  return (
    <div className="p-3 rounded-lg border border-blue-300 bg-white">
      <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
        <span className="inline-block px-2 py-0.5 bg-blue-900 text-white text-xs rounded">EX</span>
        IVT Eligibility Decision Algorithm
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
        <label className="flex items-center gap-1"><input type="checkbox" checked={state.ichOnCT} onChange={(e) => set('ichOnCT', e.target.checked)} />ICH on CT</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={state.disablingDeficit} onChange={(e) => set('disablingDeficit', e.target.checked)} />Disabling deficit</label>
        <label><span className="block text-slate-600">LKW (h)</span><input type="number" step="0.1" value={state.hoursFromLKW} onChange={(e) => set('hoursFromLKW', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600">Glucose</span><input type="number" value={state.glucose} onChange={(e) => set('glucose', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600">Weight (kg)</span><input type="number" value={state.weight} onChange={(e) => set('weight', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label><span className="block text-slate-600">Age</span><input type="number" value={state.age} onChange={(e) => set('age', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
        <label className="flex items-center gap-1 col-span-2"><input type="checkbox" checked={state.crao} onChange={(e) => set('crao', e.target.checked)} />CRAO (central retinal artery occlusion)</label>
      </div>
      {state.hoursFromLKW && parseFloat(state.hoursFromLKW) > 4.5 && (
        <div className="mb-3 p-2 rounded border border-violet-200 bg-violet-50 text-xs">
          <p className="font-semibold text-violet-900 mb-1">Extended-window imaging selection (prefer MRI if small vessel, posterior, or contrast allergy):</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.mismatchPresent} onChange={(e) => set('mismatchPresent', e.target.checked)} />MRI DWI-FLAIR mismatch</label>
            <label><span className="block text-slate-600">CTP core (mL)</span><input type="number" value={state.ctpCoreMl} onChange={(e) => set('ctpCoreMl', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">CTP ratio</span><input type="number" step="0.1" value={state.ctpRatio} onChange={(e) => set('ctpRatio', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">Mismatch vol (mL)</span><input type="number" value={state.ctpMismatchVolMl} onChange={(e) => set('ctpMismatchVolMl', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.smallVessel} onChange={(e) => set('smallVessel', e.target.checked)} />Small vessel</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.posteriorCirc} onChange={(e) => set('posteriorCirc', e.target.checked)} />Posterior circulation</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={state.contrastAllergy} onChange={(e) => set('contrastAllergy', e.target.checked)} />Contrast allergy</label>
          </div>
        </div>
      )}
      <div className={`p-3 rounded border-2 ${colorByEligible(result.eligible)}`}>
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <strong className="text-sm">{result.recommendation || 'Awaiting input'}</strong>
          <CorChip cor={result.cor} /><LoeChip loe={result.loe} />
          {result.dose && <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">TNK {result.dose} mg</span>}
        </div>
        {result.reason && <p className="text-xs text-slate-700">{result.reason}</p>}
        {result.nextStep && <p className="text-xs text-blue-800 mt-1"><strong>Next:</strong> {result.nextStep}</p>}
        {result.alternativeAgent && <p className="text-xs text-slate-600 mt-1">{result.alternativeAgent}</p>}
        {result.imagingGuidance && <p className="text-xs text-violet-800 mt-1">{result.imagingGuidance}</p>}
        {Array.isArray(result.warnings) && result.warnings.length > 0 && (
          <ul className="list-disc list-inside text-xs text-amber-800 mt-1">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>
      {parseFloat(state.hoursFromLKW) > 4.5 && result.eligible === 'consider' && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-blue-900">Read-aloud patient discussion script (extended-window IVT)</summary>
          <div className="mt-1 p-2 rounded border border-blue-200 bg-blue-50 text-xs whitespace-pre-wrap">{EXTENDED_WINDOW_IVT_DISCUSSION}</div>
          <button type="button" onClick={() => { try { navigator.clipboard.writeText(EXTENDED_WINDOW_IVT_DISCUSSION); } catch (_) {} }} className="mt-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs rounded">Copy</button>
        </details>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// DOAC-Exposed IVT Pathway interactive card
// ----------------------------------------------------------------------
const DOACIVTCard = ({ defaults = {} }) => {
  const [state, setState] = useState({
    hoursSinceLastDose: defaults.hoursSinceLastDose || '',
    antiXaUndetectable: defaults.antiXaUndetectable === true,
    renalFunctionNormal: defaults.renalFunctionNormal !== false,
    disablingDeficit: defaults.disablingDeficit !== false,
    endovascularCandidate: defaults.endovascularCandidate === true,
    site: defaults.site || 'hub'
  });
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));
  const r = useMemo(() => evaluateDOAC_IVT(state), [state]);
  return (
    <div className="p-3 rounded-lg border border-orange-300 bg-white">
      <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
        <span className="inline-block px-2 py-0.5 bg-orange-700 text-white text-xs rounded">EX</span>
        DOAC-Exposed AIS Patient — IVT Pathway
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
        <label>
          <span className="block text-slate-600">Site</span>
          <select value={state.site} onChange={(e) => set('site', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="hub">Primary hub (anti-Xa-based pathway)</option>
            <option value="spoke">Spoke / tele-consult (time-based pathway)</option>
            <option value="telestroke">Telestroke spoke site</option>
          </select>
        </label>
        <label>
          <span className="block text-slate-600">Hours since last DOAC dose</span>
          <input type="number" value={state.hoursSinceLastDose} onChange={(e) => set('hoursSinceLastDose', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        {state.site === 'hub' ? (
          <label className="flex items-center gap-1 md:col-span-1">
            <input type="checkbox" checked={state.antiXaUndetectable} onChange={(e) => set('antiXaUndetectable', e.target.checked)} />
            <span>Anti-Xa <strong>UNDETECTABLE</strong></span>
          </label>
        ) : (
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={state.renalFunctionNormal} onChange={(e) => set('renalFunctionNormal', e.target.checked)} />Normal renal function
          </label>
        )}
        <label className="flex items-center gap-1"><input type="checkbox" checked={state.disablingDeficit} onChange={(e) => set('disablingDeficit', e.target.checked)} />Disabling stroke deficits</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={state.endovascularCandidate} onChange={(e) => set('endovascularCandidate', e.target.checked)} />EVT candidate (bypass IVT)</label>
      </div>
      <div className={`p-2 rounded border-2 ${r.eligible === true ? 'border-emerald-400 bg-emerald-50' : r.eligible === 'consider' ? 'border-yellow-400 bg-yellow-50' : r.eligible === 'preferred-other' ? 'border-blue-400 bg-blue-50' : r.eligible === false ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}>
        <div className="flex items-center flex-wrap gap-2">
          <strong className="text-sm">{r.pathway ? r.pathway.toUpperCase() : 'Pathway'}</strong>
          <CorChip cor={r.cor} /><LoeChip loe={r.loe} />
        </div>
        {r.reason && <p className="text-xs mt-1">{r.reason}</p>}
        {r.rationale && <p className="text-xs text-slate-700 mt-1 italic">{r.rationale}</p>}
        {Array.isArray(r.requirements) && r.requirements.length > 0 && (
          <ul className="list-disc list-inside text-xs mt-1">{r.requirements.map((x, i) => <li key={i}>{x}</li>)}</ul>
        )}
        {Array.isArray(r.missing) && r.missing.length > 0 && (
          <p className="text-xs text-rose-800 mt-1"><strong>Missing:</strong> {r.missing.join('; ')}</p>
        )}
        {r.requirement && <p className="text-xs text-blue-900 mt-1"><strong>Requirement:</strong> {r.requirement}</p>}
        {r.documentation && <p className="text-xs text-slate-600 mt-1"><strong>Documentation:</strong> {r.documentation}</p>}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// EVT Eligibility matrix (anterior / M2 / basilar)
// ----------------------------------------------------------------------
const EVTEligibilityCard = ({ defaults = {} }) => {
  const [branch, setBranch] = useState('anterior');
  const [ant, setAnt] = useState({ aspectsScore: defaults.aspects || '', timeFromLKWh: defaults.hoursFromLKWh || '', nihss: defaults.nihss || '', preMRS: defaults.preMRS || '0', age: defaults.age || '', massEffect: false });
  const [m2, setM2] = useState({ segment: 'M2-proximal-dominant', dominant: true, hoursFromLKWh: '', nihss: '', preMRS: '0', aspectsScore: '' });
  const [bas, setBas] = useState({ nihss: '', hoursFromLKWh: '', preMRS: '0', pcAspects: '', disabling: true, irAgreement: false });

  const rAnt = useMemo(() => evaluateEVT_Anterior(ant), [ant]);
  const rM2 = useMemo(() => evaluateEVT_M2(m2), [m2]);
  const rBas = useMemo(() => evaluateEVT_Basilar(bas), [bas]);

  const colorByEligible = (e) => e === true ? 'border-emerald-400 bg-emerald-50' : e === 'consider' ? 'border-yellow-400 bg-yellow-50' : e === 'pending' ? 'border-amber-400 bg-amber-50' : e === false ? 'border-rose-400 bg-rose-50' : 'border-slate-200';

  return (
    <div className="p-3 rounded-lg border border-indigo-300 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 bg-indigo-700 text-white text-xs rounded">EX</span>
          EVT Eligibility Matrix
        </h4>
        <div className="flex gap-1 flex-wrap">
          {['anterior', 'm2-distal', 'basilar'].map((k) => (
            <button key={k} type="button" onClick={() => setBranch(k)} className={`px-2 py-1 text-xs rounded ${branch === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {k === 'anterior' ? 'Anterior LVO' : k === 'm2-distal' ? 'M2 / Distal' : 'Basilar'}
            </button>
          ))}
        </div>
      </div>

      {branch === 'anterior' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label><span className="block text-slate-600">ASPECTS</span><input type="number" value={ant.aspectsScore} onChange={(e) => setAnt({ ...ant, aspectsScore: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">LKW (h)</span><input type="number" step="0.1" value={ant.timeFromLKWh} onChange={(e) => setAnt({ ...ant, timeFromLKWh: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">NIHSS</span><input type="number" value={ant.nihss} onChange={(e) => setAnt({ ...ant, nihss: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">Pre-stroke mRS</span>
              <select value={ant.preMRS} onChange={(e) => setAnt({ ...ant, preMRS: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
                {['0', '1', '2', '3', '4'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600">Age</span><input type="number" value={ant.age} onChange={(e) => setAnt({ ...ant, age: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label className="flex items-center gap-1 col-span-2"><input type="checkbox" checked={ant.massEffect} onChange={(e) => setAnt({ ...ant, massEffect: e.target.checked })} />Significant mass effect</label>
          </div>
          <div className={`p-2 rounded border-2 ${colorByEligible(rAnt.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">{rAnt.eligible === true ? 'EVT RECOMMENDED' : rAnt.eligible === 'consider' ? 'CONSIDER EVT' : rAnt.eligible === false ? 'EVT NOT indicated at these parameters' : 'Awaiting input'}</strong>
              <CorChip cor={rAnt.cor} /><LoeChip loe={rAnt.loe} />
              {rAnt.window && <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-900 rounded">{rAnt.window}</span>}
            </div>
            <p className="text-xs mt-1">{rAnt.reason}</p>
          </div>
        </>
      )}

      {branch === 'm2-distal' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label className="md:col-span-2">
              <span className="block text-slate-600">Segment</span>
              <select value={m2.segment} onChange={(e) => setM2({ ...m2, segment: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
                <option value="M2-proximal-dominant">M2 proximal dominant (≤1 cm from bifurcation, ≥50% MCA)</option>
                <option value="M2-codominant">M2 codominant</option>
                <option value="M2-nondominant">M2 nondominant</option>
                <option value="M3">M3 distal MCA</option>
                <option value="ACA">ACA</option>
                <option value="PCA">PCA</option>
              </select>
            </label>
            <label><span className="block text-slate-600">LKW (h)</span><input type="number" step="0.1" value={m2.hoursFromLKWh} onChange={(e) => setM2({ ...m2, hoursFromLKWh: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">NIHSS</span><input type="number" value={m2.nihss} onChange={(e) => setM2({ ...m2, nihss: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">Pre-mRS</span>
              <select value={m2.preMRS} onChange={(e) => setM2({ ...m2, preMRS: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
                {['0', '1', '2', '3', '4'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600">ASPECTS</span><input type="number" value={m2.aspectsScore} onChange={(e) => setM2({ ...m2, aspectsScore: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
          </div>
          <div className={`p-2 rounded border-2 ${colorByEligible(rM2.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">{rM2.eligible === true ? 'EVT recommended' : rM2.eligible === 'consider' ? 'CONSIDER EVT' : rM2.eligible === false ? 'EVT NOT recommended' : '—'}</strong>
              <CorChip cor={rM2.cor} /><LoeChip loe={rM2.loe} />
            </div>
            <p className="text-xs mt-1">{rM2.reason}</p>
          </div>
        </>
      )}

      {branch === 'basilar' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
            <label><span className="block text-slate-600">NIHSS</span><input type="number" value={bas.nihss} onChange={(e) => setBas({ ...bas, nihss: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">LKW (h)</span><input type="number" step="0.1" value={bas.hoursFromLKWh} onChange={(e) => setBas({ ...bas, hoursFromLKWh: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label><span className="block text-slate-600">Pre-mRS</span>
              <select value={bas.preMRS} onChange={(e) => setBas({ ...bas, preMRS: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
                {['0', '1', '2', '3', '4'].map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label><span className="block text-slate-600">PC-ASPECTS</span><input type="number" value={bas.pcAspects} onChange={(e) => setBas({ ...bas, pcAspects: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={bas.disabling} onChange={(e) => setBas({ ...bas, disabling: e.target.checked })} />Disabling deficits</label>
            <label className="flex items-center gap-1 col-span-2"><input type="checkbox" checked={bas.dualSpecialtyAgreement} onChange={(e) => setBas({ ...bas, dualSpecialtyAgreement: e.target.checked })} />Dual-specialty agreement (neurointerventional + stroke attending; example pathway for NIHSS 6-9)</label>
          </div>
          <div className={`p-2 rounded border-2 ${colorByEligible(rBas.eligible)}`}>
            <div className="flex items-center flex-wrap gap-2">
              <strong className="text-sm">
                {rBas.eligible === true ? 'EVT RECOMMENDED (Basilar)'
                  : rBas.eligible === 'consider' ? 'CONSIDER EVT (Basilar — example pathway)'
                  : rBas.eligible === 'pending' ? 'Pending dual-specialty agreement (example pathway)'
                  : rBas.eligible === false ? 'Basilar EVT not indicated' : '—'}
              </strong>
              <CorChip cor={rBas.cor} /><LoeChip loe={rBas.loe} />
            </div>
            <p className="text-xs mt-1">{rBas.reason}</p>
            {rBas.institutionalRequirement && <p className="text-xs mt-1 text-indigo-800"><strong>Example institutional requirement:</strong> {rBas.institutionalRequirement}</p>}
          </div>
        </>
      )}
      <div className="text-[10px] text-slate-500 italic mt-2">
        Generalizability is limited for: {GENERALIZABILITY_LIMITATIONS.join('; ')}.
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Blood Pressure Management card
// ----------------------------------------------------------------------
const BPProtocolCard = () => (
  <div className="p-3 rounded-lg border border-rose-300 bg-white">
    <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
      <span className="inline-block px-2 py-0.5 bg-rose-700 text-white text-xs rounded">EX</span>
      Blood Pressure Management
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-rose-50">
          <tr><th className="px-2 py-1 text-left">Scenario</th><th className="px-2 py-1 text-left">Target</th><th className="px-2 py-1 text-left">COR / LOE</th><th className="px-2 py-1 text-left">Example protocol</th></tr>
        </thead>
        <tbody>
          {Object.entries(INSTITUTIONAL_BP_PROTOCOLS).map(([key, p]) => {
            const isHarm = /harm/i.test(p.status || '') || /harm/i.test(p.cor || '');
            return (
              <tr key={key} className={`border-b ${isHarm ? 'bg-rose-50' : ''}`}>
                <td className="px-2 py-1 font-semibold">{p.scenario}</td>
                <td className="px-2 py-1">{p.target || p.status}</td>
                <td className="px-2 py-1 whitespace-nowrap"><CorChip cor={p.cor} /> <LoeChip loe={p.loe} /></td>
                <td className="px-2 py-1 text-slate-700">{p.protocol || p.rationale}{p.alternatives ? <><br /><em>{p.alternatives}</em></> : null}</td>
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
  <div className="p-3 rounded-lg border border-red-300 bg-white">
    <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
      <span className="inline-block px-2 py-0.5 bg-red-700 text-white text-xs rounded">EX</span>
      IVT Contraindications
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <section>
        <h5 className="font-bold text-red-900 border-b border-red-200 pb-1 mb-1">Absolute</h5>
        <ul className="space-y-1">
          {IVT_ABSOLUTE_CONTRAINDICATIONS.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px]">{c.detail}</div></li>
          ))}
        </ul>
      </section>
      <section>
        <h5 className="font-bold text-amber-900 border-b border-amber-200 pb-1 mb-1">Relative (individualize)</h5>
        <ul className="space-y-1">
          {IVT_RELATIVE_CONTRAINDICATIONS.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px]">{c.detail}</div></li>
          ))}
        </ul>
      </section>
      <section>
        <h5 className="font-bold text-emerald-900 border-b border-emerald-200 pb-1 mb-1">Benefit &gt; Risk · Consider IVT</h5>
        <ul className="space-y-1">
          {IVT_BENEFIT_GREATER_CONSIDER.map((c, i) => (
            <li key={i}><strong>{c.label}</strong><div className="text-slate-600 text-[11px]">{c.detail}</div></li>
          ))}
        </ul>
      </section>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Safe Pause card
// ----------------------------------------------------------------------
const SafePauseCard = ({ defaults = {} }) => {
  const [st, setSt] = useState({ consentType: defaults.consentType || 'informed', bp: defaults.bp || '', contraindications: 'reviewed' });
  const text = getSafePauseText(st);
  return (
    <div className="p-3 rounded-lg border border-emerald-300 bg-white">
      <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
        <span className="inline-block px-2 py-0.5 bg-emerald-700 text-white text-xs rounded">EX</span>
        Pulsara Safety Pause (pre-thrombolytic)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-2">
        <label>
          <span className="block text-slate-600">Consent type</span>
          <select value={st.consentType} onChange={(e) => setSt({ ...st, consentType: e.target.value })} className="w-full px-2 py-1 border rounded text-sm">
            <option>informed</option>
            <option>presumed (unable to provide, no surrogate)</option>
            <option>surrogate</option>
            <option>declined</option>
          </select>
        </label>
        <label><span className="block text-slate-600">BP at attestation</span><input type="text" value={st.bp} onChange={(e) => setSt({ ...st, bp: e.target.value })} placeholder="e.g. 178/96" className="w-full px-2 py-1 border rounded text-sm" /></label>
      </div>
      <textarea readOnly value={text} rows={7} className="w-full px-2 py-1 border rounded text-[11px] font-mono bg-slate-50" />
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={() => { try { navigator.clipboard.writeText(text); } catch (_) {} }} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded">Copy for Pulsara</button>
        <span className="text-[10px] text-slate-500 self-center">Attestation tag: <strong>{SAFE_PAUSE_ATTESTATION}</strong></span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// COR/LOE reference card
// ----------------------------------------------------------------------
const CorLoeKeyCard = () => (
  <div className="p-3 rounded-lg border border-slate-300 bg-white">
    <h4 className="font-bold text-slate-900 mb-2">Class of Recommendation / Level of Evidence</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <section>
        <h5 className="font-semibold text-slate-800 mb-1">Class of Recommendation</h5>
        <table className="w-full">
          <tbody>
            <tr className="bg-emerald-50"><td className="px-2 py-1 font-bold">Class 1 (Strong)</td><td className="px-2 py-1">Benefit &gt;&gt;&gt; Risk</td><td className="px-2 py-1">Is recommended</td></tr>
            <tr className="bg-yellow-50"><td className="px-2 py-1 font-bold">Class 2a (Moderate)</td><td className="px-2 py-1">Benefit &gt;&gt; Risk</td><td className="px-2 py-1">Is reasonable</td></tr>
            <tr className="bg-orange-50"><td className="px-2 py-1 font-bold">Class 2b (Weak)</td><td className="px-2 py-1">Benefit ≥ Risk</td><td className="px-2 py-1">May be considered</td></tr>
            <tr className="bg-rose-50"><td className="px-2 py-1 font-bold">Class 3: No Benefit</td><td className="px-2 py-1">Benefit = Risk</td><td className="px-2 py-1">Not recommended</td></tr>
            <tr className="bg-red-100"><td className="px-2 py-1 font-bold">Class 3: Harm</td><td className="px-2 py-1">Risk &gt; Benefit</td><td className="px-2 py-1">Avoid (harmful)</td></tr>
          </tbody>
        </table>
      </section>
      <section>
        <h5 className="font-semibold text-slate-800 mb-1">Level of Evidence</h5>
        <table className="w-full">
          <tbody>
            {Object.entries(COR_LOE_KEY.loe).map(([k, v]) => (
              <tr key={k} className="border-b"><td className="px-2 py-1 font-bold">Level {k}</td><td className="px-2 py-1">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Main PocketCards container
// ----------------------------------------------------------------------
export const PocketCards = ({ defaults = {} }) => {
  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Protocol cards">
      <div className="px-3 py-2 bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Protocol Cards — Example Institutional Patterns</h3>
          <p className="text-xs opacity-90">Illustrative decision-support cards based on current published evidence. Not endorsed by any named institution.</p>
        </div>
        <span className="text-[10px] bg-white/20 rounded px-2 py-0.5">v2</span>
      </div>
      <IVTEligibilityCard defaults={defaults} />
      <ContraindicationsCard />
      <DOACIVTCard defaults={defaults} />
      <EVTEligibilityCard defaults={defaults} />
      <BPProtocolCard />
      <SafePauseCard defaults={defaults} />
      <CorLoeKeyCard />
    </div>
  );
};
