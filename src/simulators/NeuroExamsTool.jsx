/**
 * Bedside Simulator 4 — Neuro-Exams Tool.
 * Drop-in: src/simulators/NeuroExamsTool.jsx
 *
 * Three clinical sections:
 *   1. Aphasia Classifier — 3-select (fluency / comprehension / repetition) → 8-way
 *      lookup that localises the aphasia type and lesion site.
 *   2. Delirium vs Aphasia matrix — static 5-row comparison table.
 *   3. Bedside Coma Exam — interactive checkboxes for LOC/motor and brainstem reflexes.
 *
 * Aphasia lookup key = `${fluency}-${comprehension}-${repetition}`.
 * Fallback for any missing key: "Atypical / subcortical-thalamic aphasia".
 *
 * Styling: v7 tokens / Tailwind utilities only (teal #0C7C8C/#0A6571 accent,
 * slate neutrals; crit/warn/ok semantics where used). No print view, no
 * localStorage, no institutional content.
 *
 * Sources: Mesulam MM, Principles of Behavioral and Cognitive Neurology; Plum
 * and Posner's Diagnosis of Stupor and Coma. Ported from local clinical-
 * references/neuro-exams/index.html (print view, localStorage, and Reference
 * PDFs tab omitted — those files are not in the public deploy path).
 */

import React, { useState } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* ── Aphasia lookup table (8-way + fallback) ─────────────────────────────
   key  = `${fluency}-${comprehension}-${repetition}`
   All values ported verbatim from the source aphasias{} object. */
export const APHASIA_MAP = {
  'nonfluent-impaired-impaired': {
    name: 'Global Aphasia',
    localization: 'Large left MCA territory (frontal-temporal-parietal)',
    desc: 'Severe impairment of all language modalities. Patient cannot express or understand spoken/written language. Commonly associated with right-sided hemiplegia.'
  },
  'nonfluent-preserved-impaired': {
    name: "Broca's Aphasia",
    localization: 'Left inferior frontal gyrus (Broca\'s area)',
    desc: 'Non-fluent, sparse, and effortful telegraphic speech. Comprehension is largely preserved. Right facial and arm weakness are common associated findings.'
  },
  'nonfluent-preserved-preserved': {
    name: 'Transcortical Motor Aphasia',
    localization: 'Left dorsolateral prefrontal or supplementary motor cortex',
    desc: 'Non-fluent speech with preserved comprehension and preserved repetition. Caused by lesions in watershed areas of the left hemisphere.'
  },
  'nonfluent-impaired-preserved': {
    name: 'Transcortical Mixed Aphasia',
    localization: 'Combined anterior/posterior watershed zones',
    desc: 'Non-fluent speech with impaired comprehension, but repetition is uniquely preserved (echolalia is common). Isolation of language zone.'
  },
  'fluent-impaired-impaired': {
    name: "Wernicke's Aphasia",
    localization: 'Left superior temporal gyrus (Wernicke\'s area)',
    desc: "Fluent but meaningless speech ('word salad') with frequent paraphasias and neologisms. Comprehension and repetition are both severely impaired. Patient is typically unaware of the deficit."
  },
  'fluent-preserved-impaired': {
    name: 'Conduction Aphasia',
    localization: 'Arcuate fasciculus or supramarginal gyrus',
    desc: 'Fluent speech with frequent literal paraphasias, but comprehension is preserved. Repetition is disproportionately impaired. Good awareness of errors.'
  },
  'fluent-impaired-preserved': {
    name: 'Transcortical Sensory Aphasia',
    localization: 'Left temporal-parietal-occipital watershed junction',
    desc: 'Fluent speech with impaired comprehension, but repetition is preserved. Often resembles Wernicke\'s, but the patient can repeat words accurately.'
  },
  'fluent-preserved-preserved': {
    name: 'Anomic Aphasia',
    localization: 'Left temporal-parietal cortex or angular gyrus',
    desc: 'Fluent speech with preserved comprehension and repetition, but severe word-finding pauses and circumlocutions. The mildest form of aphasia.'
  }
};

const APHASIA_FALLBACK = {
  name: 'Atypical / subcortical-thalamic aphasia',
  localization: 'Variable — subcortical or thalamic',
  desc: 'Atypical clinical profile. Consider subcortical or thalamic aphasia syndromes.'
};

/* Pure lookup exported for unit tests. */
export function classifyAphasia(fluency, comprehension, repetition) {
  const key = `${fluency}-${comprehension}-${repetition}`;
  return APHASIA_MAP[key] || APHASIA_FALLBACK;
}

/* ── Delirium vs Aphasia rows ─────────────────────────────────────────── */
const DELIRIUM_ROWS = [
  {
    feature: 'Onset & Course',
    delirium: 'Acute/subacute. Fluctuating with lucid intervals.',
    aphasia: 'Sudden onset. Stable deficits. Preserved arousal.'
  },
  {
    feature: 'Attention',
    delirium: 'Severely impaired. Difficulty focusing or shifting.',
    aphasia: 'Preserved attention. Focuses on examiner.',
    deliriumAlert: true
  },
  {
    feature: 'Language',
    delirium: 'Rambling, incoherent, tangential. Content is illogical.',
    aphasia: 'Specific deficits (paraphasias, impaired repetition/naming).'
  },
  {
    feature: 'Level of Consciousness',
    delirium: 'Fluctuates from hyperalert to lethargic. Visual hallucinations common.',
    aphasia: 'Usually alert. Preserved awareness.'
  },
  {
    feature: 'Focal Signs',
    delirium: 'Absent (unless metabolic flap or pre-existing stroke).',
    aphasia: 'Commonly has hemiplegia or sensory loss (left MCA).'
  }
];

/* ── Bedside Coma Exam — LOC & Motor items ────────────────────────────── */
const COMA_LOC = [
  'Response to voice (call name, simple command)',
  'Response to touch (light touch, firm pressure)',
  'Response to central pain (sternal rub, supraorbital pressure)',
  'Motor: Localizing — crosses midline to stimulus',
  'Motor: Withdrawal — pulls away from stimulus',
  'Motor: Decorticate — elbow flexion, wrist flexion',
  'Motor: Decerebrate — extension with pronation'
];

/* ── Bedside Coma Exam — Brainstem reflexes & breathing items ─────────── */
const COMA_BRAINSTEM = [
  'Pupillary Light Reflex (CN II/III) — reactivity and size',
  'Anisocoria — asymmetry > 1 mm (uncal herniation sign)',
  'Corneal Reflex (CN V/VII) — blink to corneal touch',
  "Oculocephalic / Doll's Eyes (CN III, VI, VIII) — eyes counter-rotate with head turn",
  "Breathing — Cheyne-Stokes (bilateral forebrain): crescendo-decrescendo",
  'Breathing — Apneustic (pontine): prolonged inspiratory gasps',
  "Breathing — Ataxic / Biot's (medullary — terminal): irregular, no pattern"
];

/* ── Component ────────────────────────────────────────────────────────── */
export function NeuroExamsTool() {
  /* Aphasia classifier state */
  const [fluency, setFluency] = useState('nonfluent');
  const [comprehension, setComprehension] = useState('impaired');
  const [repetition, setRepetition] = useState('impaired');

  /* Active tab in the right panel */
  const [activeTab, setActiveTab] = useState('delirium');

  /* Coma exam checkboxes */
  const [locChecked, setLocChecked] = useState(() => COMA_LOC.map(() => false));
  const [bsChecked, setBsChecked] = useState(() => COMA_BRAINSTEM.map(() => false));

  const toggleLoc = (i) =>
    setLocChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const toggleBs = (i) =>
    setBsChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const aphasia = classifyAphasia(fluency, comprehension, repetition);

  const tabBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      aria-pressed={activeTab === id}
      className={cx(
        'px-3 h-8 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
        activeTab === id
          ? 'bg-teal-50 text-teal-800 border-teal-300'
          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="neuro-exams-tool space-y-4">
      <p className="text-sm text-slate-600">
        Three bedside tools for diagnosing language deficits and disorders of consciousness:
        an aphasia localization engine (fluency / comprehension / repetition → 8-way classifier),
        a delirium-versus-aphasia differential matrix, and a structured coma exam checklist
        (LOC/motor + brainstem reflexes).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Section 1 · Aphasia Classifier ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Aphasia Classifier</h4>
            <span className="font-mono text-2xs text-slate-500">linguistic engine</span>
          </div>

          {/* Result card */}
          <div className="rounded-md bg-teal-50 border border-teal-200 px-3 py-2.5 space-y-1">
            <p className="text-base font-bold text-teal-800">{aphasia.name}</p>
            <p className="text-xs font-semibold text-teal-700">{aphasia.localization}</p>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{aphasia.desc}</p>

          {/* Selects */}
          <div className="space-y-2">
            <SelectRow
              label="1. Spontaneous Speech"
              value={fluency}
              onChange={setFluency}
              options={[
                { value: 'nonfluent', label: 'Non-Fluent (effortful, telegraphic, sparse)' },
                { value: 'fluent',    label: 'Fluent (normal phrase length, effortless)' }
              ]}
            />
            <SelectRow
              label="2. Comprehension"
              value={comprehension}
              onChange={setComprehension}
              options={[
                { value: 'impaired',  label: 'Impaired (difficulty following commands)' },
                { value: 'preserved', label: 'Preserved (follows commands easily)' }
              ]}
            />
            <SelectRow
              label="3. Repetition"
              value={repetition}
              onChange={setRepetition}
              options={[
                { value: 'impaired',  label: 'Impaired (cannot repeat phrases)' },
                { value: 'preserved', label: 'Preserved (repeats accurately)' }
              ]}
            />
          </div>

          {/* Reference table */}
          <details className="pt-1">
            <summary className="cursor-pointer text-2xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700">
              Aphasia reference table (all 8 types)
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr>
                    <th className="border border-line bg-slate-50 px-2 py-1.5 text-left font-semibold text-slate-700">Type</th>
                    <th className="border border-line bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">Fluency</th>
                    <th className="border border-line bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">Comprehension</th>
                    <th className="border border-line bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">Repetition</th>
                    <th className="border border-line bg-slate-50 px-2 py-1.5 text-left font-semibold text-slate-700">Localization</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(APHASIA_MAP).map(([key, a]) => {
                    const [f, c, r] = key.split('-');
                    const isActive = key === `${fluency}-${comprehension}-${repetition}`;
                    return (
                      <tr key={key} className={isActive ? 'bg-teal-50' : ''}>
                        <td className={cx('border border-line px-2 py-1.5 font-semibold', isActive ? 'text-teal-800' : 'text-slate-800')}>{a.name}</td>
                        <td className="border border-line px-2 py-1.5 text-center text-slate-700 capitalize">{f}</td>
                        <td className="border border-line px-2 py-1.5 text-center text-slate-700 capitalize">{c}</td>
                        <td className="border border-line px-2 py-1.5 text-center text-slate-700 capitalize">{r}</td>
                        <td className="border border-line px-2 py-1.5 text-slate-700">{a.localization}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        {/* ── Right panel · Delirium matrix + Coma exam ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3">
          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-line">
            {tabBtn('delirium', 'Delirium vs. Aphasia')}
            {tabBtn('coma', 'Bedside Coma Exam')}
          </div>

          {/* Tab 1 · Delirium vs Aphasia */}
          {activeTab === 'delirium' && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">Differentiating Delirium from Aphasia</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-line bg-slate-50 px-2.5 py-2 text-left font-semibold text-slate-700 w-1/5">Feature</th>
                      <th className="border border-line bg-warn-50 px-2.5 py-2 text-left font-semibold text-warn-800 w-2/5">Delirium (Acute Confusion)</th>
                      <th className="border border-line bg-ok-50 px-2.5 py-2 text-left font-semibold text-ok-800 w-2/5">Aphasia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DELIRIUM_ROWS.map((row) => (
                      <tr key={row.feature}>
                        <td className="border border-line px-2.5 py-2 font-semibold text-slate-800">{row.feature}</td>
                        <td className={cx(
                          'border border-line px-2.5 py-2',
                          row.deliriumAlert ? 'font-bold text-crit-700' : 'text-slate-700'
                        )}>
                          {row.delirium}
                        </td>
                        <td className="border border-line px-2.5 py-2 text-slate-700">{row.aphasia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-2xs text-slate-500">
                Key distinguisher: attention is severely impaired in delirium (cannot focus, sustain, or
                shift); aphasia patients typically maintain attention and fix on the examiner.
              </p>
            </div>
          )}

          {/* Tab 2 · Bedside Coma Exam */}
          {activeTab === 'coma' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Bedside Coma Exam Protocol</h4>

              <ComaGroup
                title="1. Level of Consciousness & Motor Responses"
                titleColor="text-slate-800"
                items={COMA_LOC}
                checked={locChecked}
                onToggle={toggleLoc}
              />

              <ComaGroup
                title="2. Brainstem Reflexes & Breathing Patterns"
                titleColor="text-teal-800"
                items={COMA_BRAINSTEM}
                checked={bsChecked}
                onToggle={toggleBs}
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-2xs text-slate-500">
                  Check items off as you complete the exam. State resets on component unmount.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLocChecked(COMA_LOC.map(() => false));
                    setBsChecked(COMA_BRAINSTEM.map(() => false));
                  }}
                  className="px-2.5 h-7 rounded-md text-2xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  Reset checklist
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="text-2xs text-slate-500">
        Educational bedside reference — not a substitute for clinical judgment. Sources: Mesulam MM,
        Principles of Behavioral and Cognitive Neurology; Plum and Posner's Diagnosis of Stupor and Coma.
      </p>
    </div>
  );
}

/* ── SelectRow sub-component ─────────────────────────────────────────── */
function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1.15fr 1.85fr' }}>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-md px-2 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── ComaGroup sub-component ─────────────────────────────────────────── */
function ComaGroup({ title, titleColor, items, checked, onToggle }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 p-3 space-y-1.5">
      <h5 className={cx('text-xs font-bold mb-2', titleColor)}>{title}</h5>
      {items.map((item, i) => (
        <label
          key={i}
          className="flex items-start gap-2 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => onToggle(i)}
            className="mt-0.5 accent-teal-600 w-3.5 h-3.5 shrink-0 cursor-pointer"
            aria-label={item}
          />
          <span className={cx(
            'text-xs leading-relaxed transition-colors',
            checked[i] ? 'line-through text-slate-500' : 'text-slate-700 group-hover:text-slate-900'
          )}>
            {item}
          </span>
        </label>
      ))}
    </div>
  );
}

export default NeuroExamsTool;
