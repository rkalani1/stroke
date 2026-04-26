// New React components for the P0/P1 expansion. Kept separate from the
// monolithic app.jsx for maintainability.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  evaluateDAWN,
  evaluateDEFUSE3,
  recommendAcuteDAPT,
  calculateESSEN,
  calculateSPI2,
  calculateBAT,
  calculateBRAIN,
  calculateNinePoint,
  calculateVASOGRADE,
  calculateOgilvyCarter,
  interpretPHQ9,
  calculateNASCET,
  calculateCHADS2VA,
  calculateHEADS2,
  recommendDriving,
  interpretBarnesJewishDysphagia,
  recommendVTEProphylaxis,
  computeNeurocheckSchedule,
  computeLKWCountdown
} from './calculators-extended.js';
import {
  listPatients,
  savePatient,
  getPatient as getPatientFromStore,
  deletePatient,
  makePatientStub,
  exportPatientsJSON,
  importPatientsJSON
} from './patient-store.js';

// =========================================================================
// PHI banner — dismissible, one-time, persistent
// =========================================================================
export const PHIBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('strokeApp:phiBannerDismissed') === '1'; } catch (_) { return false; }
  });
  if (dismissed) return null;
  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('strokeApp:phiBannerDismissed', '1'); } catch (_) {}
  };
  return (
    <div role="alert" aria-live="polite" className="bg-amber-50 border-y border-amber-300 px-3 py-2 text-xs sm:text-sm text-amber-900 flex items-start gap-2">
      <span className="font-bold text-amber-700 flex-shrink-0" aria-hidden>⚠</span>
      <div className="flex-1">
        <strong>Educational decision-support tool only — not medical advice.</strong> Content is illustrative, based on publicly available evidence, and is not endorsed by any named institution. This is not a substitute for clinical judgment, and is not HIPAA-compliant. Do not enter identifiable protected health information. Local data is stored in-browser and auto-expires. Clinical responsibility remains with the treating clinician; follow your own institutional policies.
      </div>
      <button type="button" onClick={handleDismiss} className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold flex-shrink-0" aria-label="Dismiss disclaimer">
        Dismiss
      </button>
    </div>
  );
};

// =========================================================================
// LKW countdown — live-ticking chips showing time to 4.5h and 24h windows
// =========================================================================
export const LKWCountdown = ({ lkwIso, className = '' }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!lkwIso) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lkwIso]);
  const cd = useMemo(() => computeLKWCountdown(lkwIso, now), [lkwIso, now]);
  if (!cd) return null;
  const lyticColor = cd.toLyticClosed
    ? 'bg-red-100 text-red-900 border-red-300'
    : (cd.toLyticMs < 30 * 60 * 1000)
      ? 'bg-amber-100 text-amber-900 border-amber-400'
      : 'bg-blue-100 text-blue-900 border-blue-300';
  const evtColor = cd.toLateEvtClosed
    ? 'bg-red-100 text-red-900 border-red-300'
    : (cd.toLateEvtMs < 2 * 3600 * 1000)
      ? 'bg-amber-100 text-amber-900 border-amber-400'
      : 'bg-violet-100 text-violet-900 border-violet-300';
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} role="status" aria-live="polite" aria-label="Last known well countdown">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">LKW</span>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${lyticColor}`} title="Time remaining in IV thrombolysis window">
        IV {cd.toLyticClosed ? 'CLOSED' : cd.toLytic}
      </span>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${evtColor}`} title="Time remaining in late-window EVT eligibility">
        EVT {cd.toLateEvtClosed ? 'CLOSED' : cd.toLateEvt}
      </span>
      <span className="text-[10px] text-slate-400">({cd.elapsedMinutes} min elapsed)</span>
    </div>
  );
};

// =========================================================================
// Auto-save indicator — subscribes to an auto-saver's lastSaveAt timestamp.
// =========================================================================
export const AutoSaveIndicator = ({ autoSaver }) => {
  const [ago, setAgo] = useState('');
  useEffect(() => {
    if (!autoSaver) return undefined;
    const tick = () => {
      const last = autoSaver.now();
      if (!last) { setAgo('not saved yet'); return; }
      const s = Math.floor((Date.now() - last.getTime()) / 1000);
      if (s < 5) setAgo('saved just now');
      else if (s < 60) setAgo(`saved ${s}s ago`);
      else if (s < 3600) setAgo(`saved ${Math.floor(s / 60)}m ago`);
      else setAgo(`saved ${Math.floor(s / 3600)}h ago`);
    };
    tick();
    const t = setInterval(tick, 5000);
    const unsub = autoSaver.subscribe(tick);
    return () => { clearInterval(t); unsub(); };
  }, [autoSaver]);
  if (!autoSaver) return null;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-caption text-mute" aria-live="polite" title="Encounter auto-saves locally to your browser">
      <span className="w-1.5 h-1.5 bg-confirm rounded-full" aria-hidden />
      {ago}
    </span>
  );
};

// =========================================================================
// SavedAgo — v6.0-07 lightweight "Saved 6 sec ago" stamp.
// Reads `lastUpdated` ISO timestamp from localStorage (set by app.jsx on
// every appData write) and ticks every 5 s. No toasts. Mono tabular.
// Mount in the encounter shell header, top-right.
// =========================================================================
export const SavedAgo = ({ storageKey = 'strokeApp:lastUpdated' }) => {
  const [ago, setAgo] = useState('');
  useEffect(() => {
    const tick = () => {
      let raw;
      try { raw = localStorage.getItem(storageKey); } catch { raw = null; }
      if (!raw) { setAgo('not saved yet'); return; }
      let t;
      try {
        const parsed = raw.startsWith('"') ? JSON.parse(raw) : raw;
        t = new Date(parsed).getTime();
      } catch { t = NaN; }
      if (!Number.isFinite(t)) { setAgo(''); return; }
      const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (s < 5) setAgo('saved just now');
      else if (s < 60) setAgo(`saved ${s}s ago`);
      else if (s < 3600) setAgo(`saved ${Math.floor(s / 60)}m ago`);
      else setAgo(`saved ${Math.floor(s / 3600)}h ago`);
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => clearInterval(i);
  }, [storageKey]);
  if (!ago) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono tabular-nums text-caption text-mute"
      aria-live="polite"
      title="Encounter auto-saves locally to your browser"
    >
      <span className="w-1.5 h-1.5 bg-confirm rounded-full" aria-hidden />
      {ago}
    </span>
  );
};

// =========================================================================
// Neurocheck timer — post-tPA q15/q30/q1h schedule
// =========================================================================
export const NeurocheckTimer = ({ tpaGivenIso }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!tpaGivenIso) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [tpaGivenIso]);
  const schedule = useMemo(() => computeNeurocheckSchedule(tpaGivenIso), [tpaGivenIso]);
  if (!schedule) return null;
  const nextCheck = schedule.checks.find((c) => c.at.getTime() > now);
  const completedChecks = schedule.checks.filter((c) => c.at.getTime() <= now).length;
  const totalChecks = schedule.checks.length;
  const remainingToNextMs = nextCheck ? nextCheck.at.getTime() - now : 0;
  const format = (ms) => {
    if (ms <= 0) return 'now';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };
  return (
    <div className="p-3 rounded border border-emerald-300 bg-emerald-50 text-sm" role="region" aria-label="Post-tPA neurocheck schedule">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-emerald-900">Post-tPA Neurochecks (q15×2h → q30×6h → q1h×16h)</h4>
        <span className="text-xs text-emerald-700 font-mono">{completedChecks} / {totalChecks} done</span>
      </div>
      {nextCheck ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-emerald-700 uppercase">Next Check</div>
            <div className="text-lg font-mono font-bold text-emerald-900">{format(remainingToNextMs)}</div>
            <div className="text-xs text-slate-600">{nextCheck.label}</div>
          </div>
          <div>
            <div className="text-xs text-emerald-700 uppercase">Schedule End</div>
            <div className="text-sm font-mono text-emerald-900">{schedule.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-xs text-slate-600">24h monitoring window</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-emerald-800 font-semibold">24-hour post-tPA monitoring complete.</div>
      )}
      {remainingToNextMs > 0 && remainingToNextMs < 60000 && (
        <div className="mt-2 p-2 bg-amber-100 border border-amber-400 rounded text-xs text-amber-900 font-semibold">
          ⏰ Neurocheck due within 1 minute — prepare NIHSS + BP + neuro exam.
        </div>
      )}
    </div>
  );
};

// =========================================================================
// DAWN/DEFUSE-3 named calculator component
// =========================================================================
export const LateWindowEVTCalculator = ({ defaults = {} }) => {
  const [inputs, setInputs] = useState({
    age: defaults.age || '',
    nihss: defaults.nihss || '',
    coreMl: defaults.coreMl || '',
    penumbraMl: defaults.penumbraMl || '',
    timeFromLKWh: defaults.timeFromLKWh || ''
  });
  const set = (k) => (e) => setInputs((s) => ({ ...s, [k]: e.target.value }));
  const dawn = evaluateDAWN(inputs);
  const defuse3 = evaluateDEFUSE3(inputs);
  return (
    <div className="p-3 rounded border border-slate-200 bg-white">
      <h4 className="font-semibold text-slate-900 mb-2">Late-Window EVT Eligibility (DAWN · DEFUSE-3)</h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {[
          { k: 'age', label: 'Age' },
          { k: 'nihss', label: 'NIHSS' },
          { k: 'coreMl', label: 'Core (mL)' },
          { k: 'penumbraMl', label: 'Penumbra (mL)' },
          { k: 'timeFromLKWh', label: 'LKW (h)' }
        ].map(({ k, label }) => (
          <label key={k} className="block">
            <span className="block text-slate-600 mb-0.5">{label}</span>
            <input type="number" value={inputs[k]} onChange={set(k)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm" />
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {dawn && (
          <div className={`p-2 rounded border ${dawn.eligible ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">DAWN (6-24h)</strong>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${dawn.eligible ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>{dawn.eligible ? `Eligible (Group ${dawn.tier})` : 'Not eligible'}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1">{dawn.reason}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{dawn.source}</p>
          </div>
        )}
        {defuse3 && (
          <div className={`p-2 rounded border ${defuse3.eligible ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <strong className="text-sm">DEFUSE-3 (6-16h)</strong>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${defuse3.eligible ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>{defuse3.eligible ? 'Eligible' : 'Not eligible'}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1">{defuse3.reason}</p>
            {Number.isFinite(defuse3.mismatchRatio) && (
              <p className="text-[10px] text-slate-500 mt-0.5">Mismatch: ratio {defuse3.mismatchRatio.toFixed(1)}, volume {defuse3.mismatchVolumeMl.toFixed(0)} mL. {defuse3.source}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// DAPT duration calculator (CHANCE/POINT/THALES)
// =========================================================================
export const DAPTDurationCalculator = ({ defaults = {} }) => {
  const [inputs, setInputs] = useState({
    strokeType: defaults.strokeType || 'ischemic',
    nihss: defaults.nihss || '',
    abcd2: defaults.abcd2 || '',
    atherosclerotic: defaults.atherosclerotic || false,
    cyp2c19LOF: defaults.cyp2c19LOF || false,
    ichRisk: defaults.ichRisk || 'normal'
  });
  const set = (k, v) => setInputs((s) => ({ ...s, [k]: v }));
  const result = recommendAcuteDAPT(inputs);
  return (
    <div className="p-3 rounded border border-slate-200 bg-white">
      <h4 className="font-semibold text-slate-900 mb-2">Acute DAPT Duration (CHANCE / POINT / THALES)</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <label>
          <span className="block text-slate-600 mb-0.5">Presentation</span>
          <select value={inputs.strokeType} onChange={(e) => set('strokeType', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="tia">TIA</option>
            <option value="ischemic">Ischemic stroke</option>
          </select>
        </label>
        <label>
          <span className="block text-slate-600 mb-0.5">NIHSS</span>
          <input type="number" value={inputs.nihss} onChange={(e) => set('nihss', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        <label>
          <span className="block text-slate-600 mb-0.5">ABCD²</span>
          <input type="number" value={inputs.abcd2} onChange={(e) => set('abcd2', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        <label className="flex items-end gap-1">
          <input type="checkbox" checked={inputs.atherosclerotic} onChange={(e) => set('atherosclerotic', e.target.checked)} />
          <span className="text-xs">Atherosclerotic etiology</span>
        </label>
        <label className="flex items-end gap-1">
          <input type="checkbox" checked={inputs.cyp2c19LOF} onChange={(e) => set('cyp2c19LOF', e.target.checked)} />
          <span className="text-xs">CYP2C19 LOF carrier (if known)</span>
        </label>
        <label>
          <span className="block text-slate-600 mb-0.5">ICH risk</span>
          <select value={inputs.ichRisk} onChange={(e) => set('ichRisk', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
            <option value="normal">Normal</option>
            <option value="high">High (HAS-BLED ≥3 or prior ICH)</option>
          </select>
        </label>
      </div>
      <div className="mt-3 p-2 border border-blue-300 bg-blue-50 rounded text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-900">{result.regimen}</span>
          {result.duration && <span className="px-1.5 py-0.5 bg-blue-200 text-blue-900 rounded text-xs font-semibold">{result.duration}</span>}
          {result.class && <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-xs">{result.class}</span>}
        </div>
        {result.dosing && <div className="text-xs text-slate-700 mt-1"><strong>Dosing:</strong> {result.dosing}</div>}
        <div className="text-xs text-slate-700 mt-1">{result.rationale}</div>
        {result.source && <div className="text-[10px] text-slate-500 mt-0.5">{result.source}</div>}
      </div>
    </div>
  );
};

// =========================================================================
// Patient census panel (multi-patient switching, add/delete, export/import)
// =========================================================================
export const PatientCensus = ({ activePatientId, onSelect, onNew, onChange }) => {
  const [patients, setPatients] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const refresh = async () => {
    const all = await listPatients({ status: 'active' });
    setPatients(all);
  };

  useEffect(() => { refresh(); }, []);

  const handleNew = () => {
    const initials = window.prompt('Patient initials (e.g., J.D.):') || '';
    if (!initials.trim()) return;
    const mrnLast4 = window.prompt('MRN last 4 digits (optional, de-identified):') || '';
    const patient = makePatientStub({ initials, mrnLast4 });
    savePatient(patient).then(() => { refresh(); if (onNew) onNew(patient); });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this patient from the census? The encounter data will be erased locally.')) return;
    await deletePatient(id);
    refresh();
    if (onChange) onChange();
  };

  const handleExport = async () => {
    const json = await exportPatientsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stroke-census-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const r = await importPatientsJSON(importText);
    if (r.error) alert(`Import failed: ${r.error}`);
    else alert(`Imported ${r.imported} patients.`);
    setShowImport(false);
    setImportText('');
    refresh();
  };

  return (
    <div className="p-3 rounded border border-slate-300 bg-white" role="region" aria-label="Patient census">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900 text-sm">Ward Census ({patients.length})</h3>
        <div className="flex gap-1">
          <button type="button" onClick={handleNew} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold" aria-label="Add new patient">+ New</button>
          <button type="button" onClick={handleExport} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs rounded" aria-label="Export patient list">Export</button>
          <button type="button" onClick={() => setShowImport((s) => !s)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs rounded" aria-label="Import patient list">Import</button>
        </div>
      </div>
      {showImport && (
        <div className="mb-2">
          <textarea rows={3} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste JSON export here..." className="w-full px-2 py-1 border rounded text-xs font-mono" />
          <button type="button" onClick={handleImport} className="mt-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded">Import</button>
        </div>
      )}
      {patients.length === 0 ? (
        <div className="text-xs text-slate-500 italic">No patients on the census yet. Click &ldquo;+ New&rdquo; to add one.</div>
      ) : (
        <ul className="space-y-1">
          {patients.map((p) => (
            <li key={p.id} className={`flex items-center justify-between gap-2 p-1.5 rounded border ${activePatientId === p.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
              <button type="button" onClick={() => onSelect && onSelect(p)} className="flex-1 text-left text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={`Select patient ${p.initials}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.initials || '—'}</span>
                  {p.mrnLast4 && <span className="text-slate-500">···{p.mrnLast4}</span>}
                  {p.label && <span className="italic text-slate-600">· {p.label}</span>}
                  <span className="text-[10px] text-slate-400">day {p.strokeDay || 0}</span>
                </div>
                <div className="text-[10px] text-slate-500">{p.encounter?.diagnosis || 'No diagnosis recorded'} · last saved {p.updatedAt ? new Date(p.updatedAt).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              </button>
              <button type="button" onClick={() => handleDelete(p.id)} className="px-1.5 py-0.5 text-red-600 hover:bg-red-50 rounded text-xs" aria-label={`Remove patient ${p.initials}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// =========================================================================
// Clinic workflow — etiology-driven secondary prevention + letter generator
// =========================================================================

const ETIOLOGY_CHECKLISTS = {
  'large-artery': {
    label: 'Large-artery atherosclerosis (TOAST 1)',
    items: [
      'High-intensity statin (atorvastatin 80 mg or rosuvastatin 20-40 mg); LDL target <70 mg/dL — add ezetimibe then PCSK9i if not at target',
      'DAPT (clopidogrel+ASA) x 21 d then single antiplatelet — CHANCE/POINT',
      'Carotid evaluation (duplex or CTA) for anterior-circulation stroke — CEA within 2 weeks for symptomatic ≥70% stenosis',
      'Intracranial atherosclerosis: aggressive medical management, SAMMPRIS protocol (SBP <140, LDL <70, high-dose DAPT 90d)',
      'Smoking cessation, diabetes control (HbA1c <7%), HTN target <130/80'
    ]
  },
  'cardioembolic': {
    label: 'Cardioembolism (TOAST 2)',
    items: [
      'DOAC preferred over warfarin (apixaban, rivaroxaban, edoxaban, dabigatran) — Class 1',
      'Timing of initiation (CATALYST): minor stroke (NIHSS <8) day 1-3, moderate (8-15) day 3-6, severe (≥16) day 6-12',
      'CHA₂DS₂-VA score (2024 ESC dropped sex) for risk stratification',
      'LAA occlusion (Watchman) for AF + contraindication to long-term AC',
      'Echocardiogram with bubble study to exclude PFO / intracardiac thrombus'
    ]
  },
  'lacunar': {
    label: 'Small-vessel disease (TOAST 3)',
    items: [
      'SBP <130/80 — SPRINT-MIND supports intensive BP control',
      'Moderate-intensity statin; LDL <100 (lower thresholds if concurrent coronary disease)',
      'ASA 81 mg daily (or clopidogrel) monotherapy long-term',
      'SPS3 trial: adding clopidogrel to ASA did NOT reduce recurrent lacunar stroke but increased bleeding',
      'Cognitive screen (MoCA) at 3-month visit — lacunar infarcts strongly associated with vascular cognitive impairment'
    ]
  },
  'cryptogenic': {
    label: 'Cryptogenic (TOAST 5)',
    items: [
      '30-day event monitor or implantable loop recorder (HEADS² score guides escalation)',
      'Transesophageal echo with bubble study for PFO / aortic atheroma / LAA thrombus',
      'Hypercoagulable panel: homocysteine, ANA, anticardiolipin IgG/IgM, β2-glycoprotein, lupus anticoagulant, protein C/S/AT-III, F-V Leiden (off AC)',
      'PFO evaluation: RoPE score ≥7 + high-risk features → device closure (CLOSE, REDUCE, RESPECT 10-yr)',
      'Vessel wall MRI / MRA for occult intracranial disease; consider ICAD or dissection',
      'ESUS trials (NAVIGATE-ESUS, RE-SPECT ESUS): empiric AC did NOT reduce recurrence — do NOT anticoagulate empirically',
      'Consider occult malignancy (Trousseau) in older patients with multi-territorial strokes'
    ]
  },
  'other': {
    label: 'Other determined (TOAST 4)',
    items: [
      'Cervical artery dissection: ASA (TREAT-CAD 2021) non-inferior to VKA for 3 months',
      'Vasculitis: CSF analysis, ESR/CRP, ANCA, vessel wall MRI, temporal artery biopsy if GCA suspected',
      'CADASIL/CARASIL: family history, MRI pattern (anterior temporal pole, external capsule), NOTCH3 gene testing',
      'Fabry disease: α-galactosidase A activity (young male with cortical/white matter strokes)',
      'MELAS: lactate/pyruvate ratio, muscle biopsy, mtDNA analysis',
      'RCVS: gradient-echo/vessel wall MRI, CTA with beaded vessels, triggers (cannabis, SSRIs, vasoactive agents)'
    ]
  }
};

export const ClinicWorkflow = ({ defaults = {} }) => {
  const [etiology, setEtiology] = useState(defaults.etiology || 'cryptogenic');
  const [pcpLetter, setPcpLetter] = useState('');
  const [patientData, setPatientData] = useState({
    name: defaults.name || '',
    dateOfVisit: defaults.dateOfVisit || new Date().toISOString().slice(0, 10),
    strokeDate: defaults.strokeDate || '',
    nihssAtDischarge: defaults.nihssAtDischarge || '',
    currentMRS: defaults.currentMRS || ''
  });

  const checklist = ETIOLOGY_CHECKLISTS[etiology];

  const generateLetter = () => {
    const items = checklist.items.map((x, i) => `  ${i + 1}. ${x}`).join('\n');
    const letter = `Dear Dr. [PCP],

I evaluated ${patientData.name || '[patient]'} today (${patientData.dateOfVisit}) in stroke clinic for follow-up after their ${patientData.strokeDate || '[date]'} stroke (NIHSS ${patientData.nihssAtDischarge || '?'} at discharge; current mRS ${patientData.currentMRS || '?'}).

ETIOLOGY: ${checklist.label}

SECONDARY PREVENTION PLAN:
${items}

Please continue outpatient management per the plan above. I have reviewed the medications and education with the patient and answered their questions.

Follow-up: 3-6 months in stroke clinic, sooner if new symptoms.

Sincerely,
[Vascular Neurology attending]
`;
    setPcpLetter(letter);
  };

  return (
    <div className="p-3 rounded border border-slate-200 bg-white">
      <h3 className="font-semibold text-slate-900 mb-2">Stroke Clinic — Etiology-Driven Secondary Prevention</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <label className="text-xs">
          <span className="block text-slate-600 mb-0.5">Patient (initials only)</span>
          <input type="text" value={patientData.name} onChange={(e) => setPatientData({ ...patientData, name: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-slate-600 mb-0.5">Date of visit</span>
          <input type="date" value={patientData.dateOfVisit} onChange={(e) => setPatientData({ ...patientData, dateOfVisit: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-slate-600 mb-0.5">Stroke date</span>
          <input type="date" value={patientData.strokeDate} onChange={(e) => setPatientData({ ...patientData, strokeDate: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-slate-600 mb-0.5">Current mRS</span>
          <input type="number" min="0" max="6" value={patientData.currentMRS} onChange={(e) => setPatientData({ ...patientData, currentMRS: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
        </label>
      </div>
      <label className="text-xs block mb-2">
        <span className="block text-slate-600 mb-0.5">TOAST etiology</span>
        <select value={etiology} onChange={(e) => setEtiology(e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
          {Object.entries(ETIOLOGY_CHECKLISTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <ul className="list-disc list-inside text-xs space-y-0.5 text-slate-700 mb-3">
        {checklist.items.map((i, idx) => <li key={idx}>{i}</li>)}
      </ul>
      <button type="button" onClick={generateLetter} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold">
        Generate PCP Letter
      </button>
      {pcpLetter && (
        <div className="mt-3">
          <textarea readOnly value={pcpLetter} rows={14} className="w-full px-2 py-1 border rounded text-xs font-mono" />
          <button type="button" onClick={() => { navigator.clipboard.writeText(pcpLetter); }} className="mt-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs rounded">Copy</button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Wards workflow — daily progress note, stroke-day checklists, GWTG metrics
// =========================================================================

const STROKE_DAY_CHECKLISTS = {
  1: [
    'Dysphagia screen (Barnes-Jewish or Yale) BEFORE any PO',
    'DVT prophylaxis — IPC day 0 (CLOTS-3), transition to chemical ppx day 2 for ICH if stable',
    'Imaging reconciliation: baseline CT/MRI, vessel imaging (CTA/MRA)',
    'Labs: lipid panel, HbA1c, troponin, BNP, ECG',
    'Echo (TTE) with bubble study if not already done',
    'Stroke etiology workup initiated (MRI/MRA, CTA H&N, echo, telemetry, lipids, A1c)',
    'Telemetry — continuous for ≥24h (AHA Class 1)',
    'Statin initiated (high-intensity if LDL not at goal)'
  ],
  2: [
    'DAPT decision (CHANCE/POINT/THALES): correct regimen & duration documented',
    'Antihypertensive titration — oral agents started if SBP >140 sustained x 24h',
    'Early mobilization per PT/OT (AVERT trial caveats — avoid very-early very-intense mobilization)',
    'Speech therapy evaluation for aphasia / dysarthria',
    'Case management / social work engaged for discharge planning',
    'Post-stroke depression screen (PHQ-9)'
  ],
  3: [
    'AF detection strategy if cryptogenic — 30-day monitor or ILR ordered',
    'Echocardiogram results reviewed — LA size, EF, valve, thrombus',
    'Rehab screen (PT/OT/SLP) — acute rehab vs. SNF vs. home with outpatient',
    'Cognitive screen (MoCA) for discharge planning',
    'Driving / work / return-to-activity counseling initiated'
  ],
  4: [
    'Discharge medication reconciliation',
    'Patient / family education (stroke warning signs, med compliance)',
    'Fall-risk screen and home-safety assessment',
    'Discharge summary drafted with follow-up instructions',
    'Vascular neurology follow-up scheduled (3-month, sometimes 1-month for DAPT duration titration)'
  ],
  5: [
    'Ready for discharge: home safely / appropriate facility confirmed',
    'GWTG-Stroke measures documented: DTN, DTP, DVT ppx, antithrombotic at discharge, statin, cessation counseling, AF AC, stroke education'
  ]
};

export const WardsWorkflow = ({ strokeDay = 1, onGenerateNote }) => {
  const [day, setDay] = useState(strokeDay);
  const [checks, setChecks] = useState({});
  const [freeText, setFreeText] = useState({ subjective: '', exam: '', assessment: '', plan: '' });
  const currentList = STROKE_DAY_CHECKLISTS[Math.min(5, Math.max(1, day))] || [];

  const toggleCheck = (key) => setChecks((s) => ({ ...s, [key]: !s[key] }));

  const handleGenerate = () => {
    const completed = currentList.filter((_, i) => checks[`d${day}-${i}`]);
    const pending = currentList.filter((_, i) => !checks[`d${day}-${i}`]);
    const note = `STROKE SERVICE PROGRESS NOTE — DAY ${day}

Subjective:
${freeText.subjective || '[patient / family report]'}

Exam:
${freeText.exam || '[neuro exam, vitals]'}

Assessment:
${freeText.assessment || '[diagnosis and trajectory]'}

Plan:
${freeText.plan || ''}

Completed today (Day ${day}):
${completed.length ? completed.map((x) => `  ✓ ${x}`).join('\n') : '  (none)'}

Still pending for Day ${day}:
${pending.length ? pending.map((x) => `  ☐ ${x}`).join('\n') : '  (all items complete)'}
`;
    if (onGenerateNote) onGenerateNote(note);
    return note;
  };

  return (
    <div className="p-3 rounded border border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900">Stroke Service — Day {day} Checklist &amp; Progress Note</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setDay((d) => Math.max(1, d - 1))} className="px-2 py-0.5 bg-slate-100 rounded text-sm">−</button>
          <span className="font-mono text-sm w-8 text-center">Day {day}</span>
          <button type="button" onClick={() => setDay((d) => Math.min(14, d + 1))} className="px-2 py-0.5 bg-slate-100 rounded text-sm">+</button>
        </div>
      </div>
      <ul className="text-xs space-y-1 mb-3">
        {currentList.map((item, i) => (
          <li key={i}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={!!checks[`d${day}-${i}`]} onChange={() => toggleCheck(`d${day}-${i}`)} className="mt-0.5" />
              <span className={checks[`d${day}-${i}`] ? 'line-through text-slate-500' : 'text-slate-800'}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
        {['subjective', 'exam', 'assessment', 'plan'].map((f) => (
          <label key={f} className="block">
            <span className="block text-slate-600 mb-0.5 capitalize">{f}</span>
            <textarea rows={3} value={freeText[f]} onChange={(e) => setFreeText({ ...freeText, [f]: e.target.value })} className="w-full px-2 py-1 border rounded" />
          </label>
        ))}
      </div>
      <button type="button" onClick={handleGenerate} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold">Generate Progress Note</button>
    </div>
  );
};

// =========================================================================
// PHQ-9 screen component
// =========================================================================
const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling/staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself / failure',
  'Trouble concentrating',
  'Moving/speaking slowly or being fidgety/restless',
  'Thoughts of self-harm or being better off dead'
];

export const PHQ9Screen = () => {
  const [answers, setAnswers] = useState(Array(9).fill(''));
  const score = answers.reduce((s, a) => s + (parseInt(a, 10) || 0), 0);
  const interp = interpretPHQ9(score);
  const suicidality = parseInt(answers[8], 10) >= 1;
  return (
    <div className="p-3 rounded border border-slate-200 bg-white">
      <h4 className="font-semibold text-slate-900 mb-2">PHQ-9 Depression Screen</h4>
      <p className="text-xs text-slate-600 mb-2">Over the past 2 weeks, how often have you been bothered by:</p>
      <table className="w-full text-xs">
        <thead className="bg-slate-100">
          <tr><th className="text-left px-2 py-1">Question</th>{['Not at all (0)', 'Several days (1)', 'More than half (2)', 'Nearly every day (3)'].map((l, i) => (
            <th key={i} className="px-1 py-1 text-center">{l}</th>
          ))}</tr>
        </thead>
        <tbody>
          {PHQ9_QUESTIONS.map((q, i) => (
            <tr key={i} className="border-b">
              <td className="px-2 py-1">{q}</td>
              {[0, 1, 2, 3].map((v) => (
                <td key={v} className="px-1 py-1 text-center">
                  <input type="radio" name={`phq${i}`} value={v} checked={parseInt(answers[i], 10) === v} onChange={() => setAnswers(answers.map((x, j) => j === i ? String(v) : x))} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {interp && (
        <div className={`mt-2 p-2 rounded border text-sm ${interp.severity === 'severe' || suicidality ? 'border-red-300 bg-red-50' : interp.severity === 'moderate' || interp.severity === 'moderately-severe' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            <strong>Total: {score}</strong>
            <span className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">{interp.severity}</span>
            {suicidality && <span className="px-1.5 py-0.5 bg-red-200 text-red-900 rounded text-xs font-bold">⚠ Suicidality endorsed — direct assessment required</span>}
          </div>
          <p className="text-xs mt-1">{interp.action}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{interp.source}</p>
        </div>
      )}
    </div>
  );
};
