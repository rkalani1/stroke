import React, { useState } from 'react';
import {
  EXCLUDED_PENDING_SOURCES,
  PROTOCOL_SECTIONS,
  PROTOCOL_SOURCE_META,
  PROTOCOL_SOURCE_REGISTER,
  PROTOCOL_TABS,
  SOURCE_BACKED_CALCULATORS
} from './source-of-truth.js';

const fieldClass = 'mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink-1 dark:bg-card dark:text-slate-100';
const buttonClass = 'rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink-2 hover:border-cobalt-400 hover:text-cobalt-700 focus:outline-none focus:ring-2 focus:ring-cobalt-500 dark:bg-card dark:text-slate-200';

function ScoreResult({ complete, value, suffix = '' }) {
  return (
    <div aria-live="polite" className="rounded-md border border-cobalt-200 bg-cobalt-50 p-3 dark:border-cobalt-800 dark:bg-cobalt-950/30">
      <div className="text-2xs font-semibold uppercase tracking-wide text-cobalt-700 dark:text-cobalt-300">Result</div>
      <div className="mt-1 text-2xl font-bold text-ink-1 dark:text-white">
        {complete ? `${value}${suffix}` : 'Not calculated'}
      </div>
      {!complete && <div className="mt-1 text-xs text-mute">Complete every field to calculate.</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-ink-2 dark:text-slate-200">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select…</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function BinaryField({ label, value, onChange, yesPoints }) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={[[0, 'No (0)'], [yesPoints, `Yes (${yesPoints})`]]}
    />
  );
}

function GcsCalculator() {
  const [eye, setEye] = useState('');
  const [verbal, setVerbal] = useState('');
  const [motor, setMotor] = useState('');
  const complete = [eye, verbal, motor].every((value) => value !== '');
  const total = Number(eye) + Number(verbal) + Number(motor);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <SelectField label="Eye response" value={eye} onChange={setEye} options={[[4, 'Spontaneous (4)'], [3, 'To voice (3)'], [2, 'To pain (2)'], [1, 'None (1)']]} />
        <SelectField label="Verbal response" value={verbal} onChange={setVerbal} options={[[5, 'Oriented (5)'], [4, 'Confused (4)'], [3, 'Inappropriate words (3)'], [2, 'Incomprehensible sounds (2)'], [1, 'None (1)']]} />
        <SelectField label="Motor response" value={motor} onChange={setMotor} options={[[6, 'Obeys commands (6)'], [5, 'Localizes pain (5)'], [4, 'Withdraws (4)'], [3, 'Abnormal flexion (3)'], [2, 'Extension (2)'], [1, 'None (1)']]} />
      </div>
      <ScoreResult complete={complete} value={total} suffix=" / 15" />
    </div>
  );
}

function Abcd2Calculator() {
  const [values, setValues] = useState({ age: '', bp: '', clinical: '', duration: '', diabetes: '' });
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const complete = Object.values(values).every((value) => value !== '');
  const total = Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <BinaryField label="Age ≥60 years" value={values.age} onChange={set('age')} yesPoints={1} />
        <BinaryField label="Initial BP ≥140/90" value={values.bp} onChange={set('bp')} yesPoints={1} />
        <SelectField label="Clinical features" value={values.clinical} onChange={set('clinical')} options={[[2, 'Unilateral weakness (2)'], [1, 'Speech impairment without weakness (1)'], [0, 'Other (0)']]} />
        <SelectField label="Symptom duration" value={values.duration} onChange={set('duration')} options={[[2, '≥60 minutes (2)'], [1, '10–59 minutes (1)'], [0, '<10 minutes (0)']]} />
        <BinaryField label="Diabetes" value={values.diabetes} onChange={set('diabetes')} yesPoints={1} />
      </div>
      <ScoreResult complete={complete} value={total} suffix=" / 7" />
    </div>
  );
}

function IchScoreCalculator() {
  const [values, setValues] = useState({ gcs: '', age: '', volume: '', ivh: '', location: '' });
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const complete = Object.values(values).every((value) => value !== '');
  const total = Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="GCS" value={values.gcs} onChange={set('gcs')} options={[[2, '3–4 (2)'], [1, '5–12 (1)'], [0, '13–15 (0)']]} />
        <BinaryField label="Age ≥80 years" value={values.age} onChange={set('age')} yesPoints={1} />
        <BinaryField label="ICH volume ≥30 mL" value={values.volume} onChange={set('volume')} yesPoints={1} />
        <BinaryField label="Intraventricular hemorrhage" value={values.ivh} onChange={set('ivh')} yesPoints={1} />
        <BinaryField label="Infratentorial origin" value={values.location} onChange={set('location')} yesPoints={1} />
      </div>
      <ScoreResult complete={complete} value={total} suffix=" / 6" />
    </div>
  );
}

function Abc2Calculator() {
  const [values, setValues] = useState({ a: '', b: '', slices: '', thickness: '' });
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const numbers = Object.values(values).map(Number);
  const complete = Object.values(values).every((value) => value !== '') && numbers.every((value) => Number.isFinite(value) && value > 0);
  const volume = complete ? (Number(values.a) * Number(values.b) * Number(values.slices) * Number(values.thickness)) / 2 : 0;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['a', 'Largest diameter (cm)'],
          ['b', 'Perpendicular diameter (cm)'],
          ['slices', 'Number of involved slices'],
          ['thickness', 'Slice thickness (cm)']
        ].map(([key, label]) => (
          <label key={key} className="block text-sm font-medium text-ink-2 dark:text-slate-200">
            {label}
            <input className={fieldClass} type="number" min="0" step="0.1" inputMode="decimal" value={values[key]} onChange={update(key)} />
          </label>
        ))}
      </div>
      <ScoreResult complete={complete} value={volume.toFixed(1)} suffix=" mL" />
    </div>
  );
}

function Cha2ds2VascCalculator() {
  const [values, setValues] = useState({ chf: '', htn: '', age: '', diabetes: '', stroke: '', vascular: '', sex: '' });
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const complete = Object.values(values).every((value) => value !== '');
  const total = Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <BinaryField label="Heart failure" value={values.chf} onChange={set('chf')} yesPoints={1} />
        <BinaryField label="Hypertension" value={values.htn} onChange={set('htn')} yesPoints={1} />
        <SelectField label="Age" value={values.age} onChange={set('age')} options={[[2, '≥75 years (2)'], [1, '65–74 years (1)'], [0, '<65 years (0)']]} />
        <BinaryField label="Diabetes" value={values.diabetes} onChange={set('diabetes')} yesPoints={1} />
        <BinaryField label="Prior stroke/TIA/embolism" value={values.stroke} onChange={set('stroke')} yesPoints={2} />
        <BinaryField label="Vascular disease" value={values.vascular} onChange={set('vascular')} yesPoints={1} />
        <SelectField label="Sex category" value={values.sex} onChange={set('sex')} options={[[1, 'Female (1)'], [0, 'Male (0)']]} />
      </div>
      <ScoreResult complete={complete} value={total} suffix=" / 9" />
    </div>
  );
}

const CALCULATOR_COMPONENTS = {
  gcs: GcsCalculator,
  abcd2: Abcd2Calculator,
  ich: IchScoreCalculator,
  abc2: Abc2Calculator,
  cha2ds2vasc: Cha2ds2VascCalculator
};

function CalculatorsPanel() {
  const [activeCalculator, setActiveCalculator] = useState('gcs');
  const ActiveCalculator = CALCULATOR_COMPONENTS[activeCalculator];
  return (
    <section aria-labelledby="protocol-calculator-title" className="space-y-4">
      <div>
        <h2 id="protocol-calculator-title" className="text-xl font-bold text-ink-1 dark:text-white">Source-backed calculators</h2>
        <p className="mt-1 text-sm text-mute">Only calculators present in the current pocket-card source are included. Results remain blank until all fields are complete.</p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Calculator selection">
        {SOURCE_BACKED_CALCULATORS.map((calculator) => (
          <button
            key={calculator.id}
            type="button"
            className={`${buttonClass} ${activeCalculator === calculator.id ? 'border-cobalt-500 bg-cobalt-50 text-cobalt-800 dark:bg-cobalt-950/40 dark:text-cobalt-200' : ''}`}
            aria-pressed={activeCalculator === calculator.id}
            onClick={() => setActiveCalculator(calculator.id)}
          >
            {calculator.label}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm dark:bg-card md:p-5">
        <h3 className="mb-4 text-lg font-semibold text-ink-1 dark:text-white">{SOURCE_BACKED_CALCULATORS.find((calculator) => calculator.id === activeCalculator)?.label}</h3>
        <ActiveCalculator />
      </div>
      <p className="text-xs text-mute">Scores support structured communication; they do not replace clinical assessment or the active approved protocol.</p>
    </section>
  );
}

function ProtocolTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line last:border-b-0">
              <th scope="row" className="w-2/5 bg-paper-2 px-3 py-2 font-semibold text-ink-2 dark:bg-slate-900 dark:text-slate-200">{label}</th>
              <td className="px-3 py-2 text-ink-2 dark:text-slate-200">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProtocolPanel({ protocol }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-ink-1 dark:text-white">{protocol.title}</h2>
        <p className="mt-1 text-sm text-ink-2 dark:text-slate-200">{protocol.summary}</p>
        <p className="mt-1 text-xs text-mute">{protocol.revision}</p>
      </div>
      {protocol.warning && (
        <div role="note" className="rounded-md border border-warn-300 bg-warn-50 p-3 text-sm text-warn-900 dark:border-warn-800 dark:bg-warn-950/30 dark:text-warn-200">
          {protocol.warning}
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {protocol.sections.map((section, index) => (
          <details key={section.title} open={index < 2} className="group rounded-lg border border-line bg-white shadow-sm dark:bg-card lg:open:col-span-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cobalt-500">
              <span className="font-semibold text-ink-1 dark:text-white">{section.title}</span>
              <span className="flex items-center gap-2">
                {section.badge && <span className="rounded-full bg-cobalt-100 px-2 py-0.5 text-2xs font-semibold text-cobalt-800 dark:bg-cobalt-950 dark:text-cobalt-200">{section.badge}</span>}
                <span aria-hidden="true" className="text-mute transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <div className="space-y-3 border-t border-line px-4 py-4">
              <ProtocolTable rows={section.rows} />
              {section.items?.length > 0 && (
                <ul className="space-y-2 pl-5 text-sm leading-relaxed text-ink-2 dark:text-slate-200">
                  {section.items.map((item) => <li key={item} className="list-disc pl-1">{item}</li>)}
                </ul>
              )}
              {section.callout && <div className="rounded-md border-l-4 border-cobalt-500 bg-cobalt-50 p-3 text-sm text-cobalt-950 dark:bg-cobalt-950/30 dark:text-cobalt-100">{section.callout}</div>}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function StrokeCenterProtocols({ activeTab, onTabChange }) {
  const selected = PROTOCOL_TABS.some((tab) => tab.id === activeTab) ? activeTab : 'ischemic';
  const selectTab = (tabId, focus = false) => {
    onTabChange(tabId);
    window.location.hash = `#/protocols/${tabId}`;
    if (focus) window.requestAnimationFrame(() => document.getElementById(`mgmt-tab-${tabId}`)?.focus());
  };
  const handleKeyDown = (event) => {
    const current = PROTOCOL_TABS.findIndex((tab) => tab.id === selected);
    let next = null;
    if (event.key === 'ArrowRight') next = (current + 1) % PROTOCOL_TABS.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + PROTOCOL_TABS.length) % PROTOCOL_TABS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = PROTOCOL_TABS.length - 1;
    if (next !== null) {
      event.preventDefault();
      selectTab(PROTOCOL_TABS[next].id, true);
    }
  };

  return (
    <div id="tabpanel-protocols" role="tabpanel" aria-labelledby="tab-protocols" className="space-y-6">
      <header className="rounded-lg border border-cobalt-200 bg-gradient-to-br from-cobalt-50 to-white p-4 dark:border-cobalt-900 dark:from-cobalt-950/40 dark:to-card md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xs font-bold uppercase tracking-[0.12em] text-cobalt-700 dark:text-cobalt-300">De-identified current protocol translation</div>
            <h1 className="mt-1 text-2xl font-bold text-ink-1 dark:text-white">Stroke protocols and algorithms</h1>
          </div>
          <div className="rounded-md bg-white/80 px-3 py-2 text-right text-xs text-ink-2 shadow-sm dark:bg-card/80 dark:text-slate-200">
            <div>Source review: {PROTOCOL_SOURCE_META.reviewedOn}</div>
            <div>Newest revision: {PROTOCOL_SOURCE_META.newestAuthoritativeRevision}</div>
          </div>
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-2 dark:text-slate-200">{PROTOCOL_SOURCE_META.sourcePolicy} {PROTOCOL_SOURCE_META.audienceNote}</p>
      </header>

      <div className="sticky top-0 z-30 overflow-x-auto rounded-lg border border-line bg-white p-2 shadow-sm dark:bg-card" role="tablist" aria-label="Protocol sections" onKeyDown={handleKeyDown}>
        <div className="flex min-w-max gap-1">
          {PROTOCOL_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`mgmt-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected === tab.id}
              aria-controls={`mgmt-tabpanel-${tab.id}`}
              tabIndex={selected === tab.id ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cobalt-500 ${selected === tab.id ? 'bg-cobalt-600 text-white' : 'text-ink-2 hover:bg-paper-2 dark:text-slate-200 dark:hover:bg-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div id={`mgmt-tabpanel-${selected}`} role="tabpanel" aria-labelledby={`mgmt-tab-${selected}`}>
        {selected === 'calculators' ? <CalculatorsPanel /> : <ProtocolPanel protocol={PROTOCOL_SECTIONS[selected]} />}
      </div>

      <details className="rounded-lg border border-line bg-white dark:bg-card">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-ink-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cobalt-500 dark:text-white">Source register and scope decisions</summary>
        <div className="space-y-4 border-t border-line p-4">
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-paper-2 text-ink-2 dark:bg-slate-900 dark:text-slate-200"><tr><th className="px-3 py-2">Source</th><th className="px-3 py-2">Revision</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>
                {PROTOCOL_SOURCE_REGISTER.map((source) => (
                  <tr key={source.label} className="border-t border-line"><td className="px-3 py-2 text-ink-2 dark:text-slate-200">{source.label}</td><td className="px-3 py-2 text-ink-2 dark:text-slate-200">{source.revision}</td><td className="px-3 py-2 text-ink-2 dark:text-slate-200">{source.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold text-ink-1 dark:text-white">Excluded pending material</h3>
            <ul className="mt-2 space-y-1 pl-5 text-sm text-ink-2 dark:text-slate-200">
              {EXCLUDED_PENDING_SOURCES.map((item) => <li key={item} className="list-disc">{item}</li>)}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

export default StrokeCenterProtocols;
