// Teaching module — landmark trials, stroke syndromes, neuroanatomy,
// and pimping-style teaching pearls for neurology trainees.

import React, { useState, useMemo } from 'react';
import {
  LANDMARK_TRIALS,
  STROKE_SYNDROMES,
  NEUROANATOMY,
  TEACHING_PEARLS,
  KEYBOARD_SHORTCUTS
} from './teaching.js';

const TRIAL_CATEGORIES = [
  { key: 'thrombolysis', label: 'Thrombolysis', color: 'blue' },
  { key: 'thrombectomy', label: 'Thrombectomy', color: 'indigo' },
  { key: 'ichReversal', label: 'ICH & Reversal', color: 'rose' },
  { key: 'secondaryPrevention', label: 'Secondary Prevention', color: 'emerald' },
  { key: 'antithrombotic', label: 'Antithrombotic', color: 'amber' },
  { key: 'sahCvt', label: 'SAH / CVT', color: 'violet' }
];

const SYNDROME_CATEGORIES = [
  { key: 'anteriorCirculation', label: 'Anterior Circulation' },
  { key: 'posteriorCirculation', label: 'Posterior Circulation' },
  { key: 'lacunarSyndromes', label: 'Lacunar Syndromes' },
  { key: 'special', label: 'Special Patterns' }
];

const LandmarkTrialsCard = () => {
  const [cat, setCat] = useState('thrombolysis');
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState('');

  const trials = useMemo(() => {
    const list = LANDMARK_TRIALS[cat] || [];
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((t) =>
      [t.name, t.question, t.outcomes, t.bottomLine, t.teachingPoint, t.citation]
        .filter(Boolean).some((x) => x.toLowerCase().includes(q))
    );
  }, [cat, filter]);

  return (
    <div className="p-3 rounded-lg border border-blue-300 bg-white">
      <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
        📚 Landmark Trials — Study Guide
      </h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {TRIAL_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={`px-2.5 py-1 text-xs rounded ${cat === c.key ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {c.label} ({(LANDMARK_TRIALS[c.key] || []).length})
          </button>
        ))}
      </div>
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter trials by name, finding, teaching point…"
        className="w-full px-2 py-1 border rounded text-sm mb-2"
        aria-label="Filter trials"
      />
      <ul className="space-y-2">
        {trials.map((t, i) => {
          const key = `${cat}-${i}`;
          const open = !!expanded[key];
          return (
            <li key={key} className="border border-slate-200 rounded bg-slate-50">
              <button
                type="button"
                onClick={() => setExpanded({ ...expanded, [key]: !open })}
                className="w-full text-left p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-expanded={open}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <strong className="text-blue-900">{t.name}</strong>
                    <span className="text-xs text-slate-500 ml-2">({t.year})</span>
                    <span className="text-[10px] text-slate-400 ml-2">{t.citation}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{open ? '▼' : '▶'}</span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5"><strong>Bottom line:</strong> {t.bottomLine}</p>
              </button>
              {open && (
                <div className="p-2 pt-0 text-xs text-slate-700 space-y-1 border-t border-slate-200">
                  <p><strong>Question:</strong> {t.question}</p>
                  <p><strong>Design:</strong> {t.design}</p>
                  <p><strong>Outcomes:</strong> {t.outcomes}</p>
                  {t.nnt && <p><strong>NNT:</strong> {t.nnt}</p>}
                  <p className="p-1.5 rounded bg-amber-50 border border-amber-200"><strong>📌 Teaching point:</strong> {t.teachingPoint}</p>
                </div>
              )}
            </li>
          );
        })}
        {trials.length === 0 && <li className="text-xs text-slate-500 italic">No trials match filter.</li>}
      </ul>
    </div>
  );
};

const StrokeSyndromesCard = () => {
  const [cat, setCat] = useState('anteriorCirculation');
  const [expanded, setExpanded] = useState({});
  const syndromes = STROKE_SYNDROMES[cat] || [];
  return (
    <div className="p-3 rounded-lg border border-indigo-300 bg-white">
      <h3 className="font-bold text-indigo-900 mb-2">🧠 Stroke Syndromes — Pattern Library</h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {SYNDROME_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={`px-2.5 py-1 text-xs rounded ${cat === c.key ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {c.label} ({(STROKE_SYNDROMES[c.key] || []).length})
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {syndromes.map((s, i) => {
          const open = !!expanded[i];
          return (
            <li key={i} className="border border-slate-200 rounded bg-slate-50">
              <button
                type="button"
                onClick={() => setExpanded({ ...expanded, [i]: !open })}
                className="w-full text-left p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-expanded={open}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-indigo-900">{s.name}</strong>
                  <span className="text-slate-400 text-xs">{open ? '▼' : '▶'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 italic">{s.territory}</p>
              </button>
              {open && (
                <div className="p-2 pt-0 text-xs text-slate-700 space-y-1.5 border-t border-slate-200">
                  <p><strong>Deficits:</strong> {s.deficits}</p>
                  <p className="p-1.5 rounded bg-blue-50 border border-blue-200"><strong>Pearls:</strong> {s.pearls}</p>
                  {s.pimpingQ && (
                    <details className="p-1.5 rounded bg-purple-50 border border-purple-200">
                      <summary className="cursor-pointer font-semibold text-purple-900">❓ Pimp Q: {s.pimpingQ}</summary>
                      <p className="mt-1 text-purple-900"><strong>Answer:</strong> {s.answer}</p>
                    </details>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const NeuroanatomyCard = () => {
  const [tab, setTab] = useState('cn');
  return (
    <div className="p-3 rounded-lg border border-emerald-300 bg-white">
      <h3 className="font-bold text-emerald-900 mb-2">🗺 Neuroanatomy Quick Reference</h3>
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setTab('cn')} className={`px-2.5 py-1 text-xs rounded ${tab === 'cn' ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>Cranial Nerves</button>
        <button type="button" onClick={() => setTab('vasc')} className={`px-2.5 py-1 text-xs rounded ${tab === 'vasc' ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>Vascular Territories</button>
      </div>
      {tab === 'cn' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-emerald-50"><tr>
              <th className="px-2 py-1 text-left">CN</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">How to test</th>
              <th className="px-2 py-1 text-left">Lesion effect</th>
            </tr></thead>
            <tbody>
              {NEUROANATOMY.cranialNerves.map((n) => (
                <tr key={n.cn} className="border-b">
                  <td className="px-2 py-1 font-bold">{n.cn}</td>
                  <td className="px-2 py-1 font-semibold">{n.name}</td>
                  <td className="px-2 py-1 text-slate-700">{n.testing}</td>
                  <td className="px-2 py-1 text-slate-700">{n.lesionEffect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'vasc' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-emerald-50"><tr>
              <th className="px-2 py-1 text-left">Artery</th>
              <th className="px-2 py-1 text-left">Supply</th>
            </tr></thead>
            <tbody>
              {NEUROANATOMY.vascularTerritories.map((v) => (
                <tr key={v.artery} className="border-b">
                  <td className="px-2 py-1 font-bold">{v.artery}</td>
                  <td className="px-2 py-1 text-slate-700">{v.supply}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TeachingPearlsCard = () => {
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('');
  const categories = useMemo(() => ['all', ...Array.from(new Set(TEACHING_PEARLS.map((p) => p.category)))], []);
  const pearls = useMemo(() => {
    let list = TEACHING_PEARLS;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter((p) => p.q.toLowerCase().includes(q) || p.a.toLowerCase().includes(q));
    }
    return list;
  }, [category, filter]);

  return (
    <div className="p-3 rounded-lg border border-purple-300 bg-white">
      <h3 className="font-bold text-purple-900 mb-2">💬 Teaching Pearls — Common Pimp Questions</h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-2 py-0.5 text-xs rounded ${category === c ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search pearls…"
        className="w-full px-2 py-1 border rounded text-sm mb-2"
      />
      <ul className="space-y-1.5">
        {pearls.map((p, i) => (
          <li key={i} className="border border-slate-200 rounded">
            <details>
              <summary className="cursor-pointer p-2 hover:bg-slate-50">
                <span className="text-xs font-semibold text-purple-700">[{p.category}]</span>{' '}
                <span className="text-sm font-semibold">{p.q}</span>
              </summary>
              <div className="p-2 pt-0 text-xs text-slate-700 border-t border-slate-200 bg-slate-50">{p.a}</div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
};

const KeyboardShortcutsCard = () => (
  <div className="p-3 rounded-lg border border-slate-300 bg-white">
    <h3 className="font-bold text-slate-900 mb-2">⌨️ Keyboard Shortcuts</h3>
    <table className="w-full text-xs">
      <tbody>
        {KEYBOARD_SHORTCUTS.map((s, i) => (
          <tr key={i} className="border-b">
            <td className="px-2 py-1 font-mono font-bold text-slate-900 whitespace-nowrap">{s.keys}</td>
            <td className="px-2 py-1 text-slate-700">{s.action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// =====================================================================
// Main Teaching container
// =====================================================================
export const TeachingModule = () => {
  const [section, setSection] = useState('trials');
  const sections = [
    { key: 'trials', label: 'Landmark Trials', icon: '📚' },
    { key: 'syndromes', label: 'Stroke Syndromes', icon: '🧠' },
    { key: 'neuroanat', label: 'Neuroanatomy', icon: '🗺' },
    { key: 'pearls', label: 'Teaching Pearls', icon: '💬' },
    { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' }
  ];
  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Teaching module">
      <div className="px-3 py-2 bg-gradient-to-r from-indigo-800 to-purple-800 text-white rounded-lg">
        <h3 className="font-bold text-sm">Teaching Module — Stroke &amp; Neurology Training</h3>
        <p className="text-xs opacity-90">Landmark trials, stroke syndromes, neuroanatomy, common pimping questions, and productivity tips. For residents, fellows, and attending review.</p>
      </div>
      <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded p-1">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`px-3 py-1.5 text-sm rounded ${section === s.key ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            <span className="mr-1" aria-hidden>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      {section === 'trials' && <LandmarkTrialsCard />}
      {section === 'syndromes' && <StrokeSyndromesCard />}
      {section === 'neuroanat' && <NeuroanatomyCard />}
      {section === 'pearls' && <TeachingPearlsCard />}
      {section === 'shortcuts' && <KeyboardShortcutsCard />}
    </div>
  );
};
