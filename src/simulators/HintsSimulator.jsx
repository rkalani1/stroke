/**
 * HINTS+ Reference: written finding examples and a qualified pattern checklist.
 * The legacy module filename/export remain stable for existing imports.
 * Synthetic head, eye and cover movements are deliberately unavailable;
 * this reference does not establish examination competence or exclude stroke.
 */

import React, { useState } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* Written examples only; no movement model or rendering is retained. */
const SCENARIOS = {
  /* 1 · Head-Impulse Test (HIT) */
  'hit-peripheral': {
    group: 'Head Impulse Test (HIT)',
    label: 'Unilateral VOR Deficit',
    tone: 'ok',
    text: 'Head Impulse Test (unilateral VOR deficit): an impulse toward the affected side produces a corrective saccade. That saccade should match the fast-phase direction of the direction-fixed horizontal nystagmus. This supports a peripheral pattern only when the other findings agree; an abnormal HIT alone does not exclude stroke, including AICA territory ischemia.'
  },
  'hit-central': {
    group: 'Head Impulse Test (HIT)',
    label: 'VOR Intact Bilaterally',
    tone: 'crit',
    text: 'Head Impulse Test (bilaterally normal): in continuous AVS with nystagmus, no corrective saccade on impulses to either side is a central warning pattern. A normal response in only one direction does not establish a bilaterally normal HIT. Interpret the complete HINTS+ examination in clinical context.'
  },

  /* 2 · Nystagmus (N) */
  'nys-uni': {
    group: 'Nystagmus (N)',
    label: 'Unidirectional Horizontal',
    tone: 'ok',
    text: 'Unidirectional Horizontal Nystagmus: the horizontal fast phase beats in one direction across gaze positions, sometimes with a slight torsional component. This can support a peripheral pattern when the other findings agree, but alone does not exclude a central cause.'
  },
  'nys-bi': {
    group: 'Nystagmus (N)',
    label: 'Gaze-Evoked / Direction-Changing',
    tone: 'crit',
    text: 'Direction-Changing (Gaze-Evoked) Nystagmus: sustained horizontal nystagmus that reverses with gaze direction is a central warning sign. Distinguish this from a few low-amplitude beats only at extreme lateral gaze, which may be physiologic. Interpret the full examination and clinical context.'
  },
  'nys-vert': {
    group: 'Nystagmus (N)',
    label: 'Vertical',
    tone: 'crit',
    text: 'Pure Vertical Nystagmus (Central): spontaneous down-beating nystagmus — eyes drift slowly up, then fast-snap down. In the AVS, spontaneous vertical nystagmus is a central sign (brainstem or cerebellar lesion — often stroke, but also demyelination, drug toxicity or other causes); positional vertical-torsional nystagmus from BPPV is a separate episodic syndrome where HINTS does not apply.'
  },

  /* 3 · Test of Skew (TS) */
  'skew-none': {
    group: 'Test of Skew (TS)',
    label: 'No Skew',
    tone: 'ok',
    text: 'No Skew Deviation: alternate cover testing shows no vertical re-fixation. Horizontal refixation alone is not skew deviation. This supports a peripheral pattern only when the other findings agree; absence of skew alone does not exclude stroke.'
  },
  'skew-present': {
    group: 'Test of Skew (TS)',
    label: 'Skew Present',
    tone: 'crit',
    text: 'Skew Deviation Present (Central): the covered eye vertical-drifts; on uncover it makes a vertical re-fixation movement to realign. Vertical ocular misalignment reflects a right–left imbalance of otolith (graviceptive) input to the oculomotor system; in AVS it is a specific but insensitive sign of a central, usually brainstem, lesion (occasionally reported with peripheral vestibular disease).'
  },

  /* 4 · Bedside Hearing Test (HINTS+) */
  'hear-normal': {
    group: 'Bedside Hearing Test (HINTS+)',
    label: 'No New Hearing Loss',
    tone: 'ok',
    text: 'Bedside Hearing Test: finger-rub is heard equally in both ears, with no new hearing loss. This isolated finding does not establish a peripheral diagnosis or exclude stroke.'
  },
  'hear-loss': {
    group: 'Bedside Hearing Test (HINTS+)',
    label: 'New Unilateral Hearing Loss',
    tone: 'crit',
    text: 'Bedside Hearing Test (New Unilateral Loss): finger-rub reveals new asymmetric hearing loss on one side. This raises concern for AICA / labyrinthine ischemia but can also occur with peripheral inner-ear disorders; interpret it in the full HINTS+ and clinical context.'
  }
};

/* Ordered groups for rendering the scenario buttons. */
const GROUPS = [
  { name: 'Head Impulse Test (HIT)', keys: ['hit-peripheral', 'hit-central'] },
  { name: 'Nystagmus (N)', keys: ['nys-uni', 'nys-bi', 'nys-vert'] },
  { name: 'Test of Skew (TS)', keys: ['skew-none', 'skew-present'] },
  { name: 'Bedside Hearing Test (HINTS+)', keys: ['hear-normal', 'hear-loss'] }
];

/* ── Classifier (pure — exported for unit tests) ──────────────────────
   The normal HIT key denotes a bilaterally normal response in appropriate
   AVS with nystagmus. A recorded warning component prompts evaluation;
   this checklist does not independently establish a diagnosis. */
export function classifyHints({ hit, nystagmus, skew, hearing } = {}) {
  const complete = ['normal', 'abnormal'].includes(hit)
    && ['uni', 'bi'].includes(nystagmus)
    && ['none', 'skew'].includes(skew)
    && ['normal', 'loss'].includes(hearing);
  const isCentralHIT = hit === 'normal';        // bilaterally intact VOR → central warning
  const isCentralNystagmus = nystagmus === 'bi'; // pathologic direction-changing / vertical / pure torsional
  const isCentralSkew = skew === 'skew';         // skew deviation present → central
  const isCentralHearing = hearing === 'loss';   // new unilateral hearing loss → AICA

  const isCentral = isCentralHIT || isCentralNystagmus || isCentralSkew || isCentralHearing;

  const reasons = [];
  if (isCentralHIT) reasons.push('Bilaterally normal HIT (no corrective saccade to either side)');
  if (isCentralNystagmus) reasons.push('Pathologic direction-changing, vertical or purely torsional nystagmus');
  if (isCentralSkew) reasons.push('Skew deviation present (vertical re-fixation)');
  if (isCentralHearing) reasons.push('New unilateral hearing loss (+, AICA)');

  return {
    isCentral,
    complete,
    isCentralHIT,
    isCentralNystagmus,
    isCentralSkew,
    isCentralHearing,
    reasons,
    profile: isCentral ? 'CENTRAL WARNING PATTERN - URGENT STROKE EVALUATION' : complete ? 'PERIPHERAL VESTIBULAR PROFILE' : 'EXAM INCOMPLETE — NO CLASSIFICATION',
    tone: isCentral ? 'crit' : complete ? 'ok' : 'warn'
  };
}

/* A new exam must not silently start with four reassuring findings. */
export const DEFAULT_FINDINGS = { hit: '', nystagmus: '', skew: '', hearing: '' };

/* INFARCT mnemonic rows. */
const INFARCT = [
  { letter: 'I N', label: 'Impulse Normal (both sides)', detail: 'No corrective saccade on head impulses to either side.' },
  { letter: 'F A', label: 'Fast-phase Alternating nystagmus', detail: 'Pathologic direction-changing horizontal, vertical or purely torsional nystagmus.' },
  { letter: 'R C T', label: 'Refixation on Cover Test', detail: 'Vertical re-fixation = skew deviation present.' },
  { letter: '+', label: 'Unilateral hearing loss (AICA)', detail: 'New unilateral hearing loss adds the "+" → HINTS+.' }
];

/* HINTS interpretation reference table. */
const HINTS_TABLE = [
  { phase: 'Head Impulse (HIT)', peripheral: 'Unilateral corrective saccade, concordant with horizontal nystagmus', central: 'Bilaterally normal — no corrective saccade to either side' },
  { phase: 'Nystagmus (N)', peripheral: 'Unidirectional horizontal (may have slight torsion)', central: 'Pathologic direction-changing horizontal, vertical or purely torsional' },
  { phase: 'Test of Skew (TS)', peripheral: 'No vertical refixation', central: 'Skew deviation — vertical re-fixation' },
  { phase: 'Hearing (+)', peripheral: 'Intact bilaterally', central: 'New unilateral loss raises AICA / labyrinthine ischemia concern' }
];

/* Tone → Tailwind class fragments (v7 semantic tokens). */
const TONE = {
  ok:   { chip: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800',     dot: 'bg-ok-500',   text: 'text-ok-700 dark:text-ok-300' },
  warn: { chip: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-300 dark:border-warn-800', dot: 'bg-warn-500', text: 'text-warn-700 dark:text-warn-300' },
  crit: { chip: 'bg-crit-50 text-crit-800 border-crit-200 dark:bg-crit-950 dark:text-crit-300 dark:border-crit-800', dot: 'bg-crit-500', text: 'text-crit-700 dark:text-crit-300' }
};

/* ── Component ────────────────────────────────────────────────────────── */
export function HintsSimulator() {
  // Selected written example (null = no selection).
  const [activeKey, setActiveKey] = useState(null);

  // Diagnostic-assistant findings.
  const [findings, setFindings] = useState(DEFAULT_FINDINGS);

  const scenario = activeKey ? SCENARIOS[activeKey] : null;
  const result = classifyHints(findings);

  const setFinding = (field, value) =>
    setFindings((f) => ({ ...f, [field]: value }));

  return (
    <div className="hints-sim space-y-4">
      <p className="text-sm text-slate-600 dark:text-ink-2">
        The 3-step HINTS exam (plus bedside hearing → HINTS+) differentiates a CENTRAL
        posterior-circulation stroke from a PERIPHERAL vestibular neuritis in adult patients with the
        Acute Vestibular Syndrome (continuous vertigo, nystagmus, head-motion intolerance). In this
        setting HINTS+ can outperform early MRI-DWI when performed by trained clinicians. Use it only
        when spontaneous/active nystagmus is present — never for episodic positional vertigo (e.g. BPPV).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Written finding examples */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Finding examples</h4>
          <p className="text-xs text-slate-600 dark:text-ink-2">
            Eye-movement animations are unavailable. The former synthetic motions were not validated
            for examination training. Use the written explanations below as a reference.
          </p>

          <div aria-live="polite" aria-atomic="true" className={cx('rounded-md border px-3 py-2 text-xs leading-relaxed min-h-[64px]',
            scenario ? TONE[scenario.tone].chip : 'bg-slate-50 text-slate-600 border-line dark:bg-paper-2 dark:text-ink-2')}>
            {scenario ? scenario.text : 'Select a finding below to read its explanation.'}
          </div>

          {GROUPS.map((g, gi) => (
            <div key={g.name} className="space-y-1.5">
              <p className="text-2xs uppercase tracking-wide font-semibold text-slate-500 dark:text-mute">
                {gi + 1}. {g.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.keys.map((key) => {
                  const sc = SCENARIOS[key];
                  const active = activeKey === key;
                  return (
                    <button key={key} type="button" aria-pressed={active} onClick={() => setActiveKey(key)}
                      className={cx('px-3 py-2 h-auto min-h-[44px] max-w-full whitespace-normal rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                        active
                          ? (sc.tone === 'crit' ? 'bg-crit-600 text-white' : 'bg-teal-600 text-white')
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:hover:bg-overlay')}>
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Qualified pattern checklist */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Pattern checklist</h4>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">HINTS+ findings</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-ink-2">
            Enter your four exam findings. Any central or equivocal finding should prompt urgent
            evaluation for a central cause; HINTS+ is not a stand-alone diagnosis.
          </p>

          <FindingToggle label="Head Impulse Test (HIT)" value={findings.hit} onChange={(v) => setFinding('hit', v)}
            options={[
              { value: 'abnormal', label: 'Unilateral abnormal VOR (saccade)', central: false },
              { value: 'normal', label: 'Bilaterally normal VOR', central: true }
            ]} />
          <p className="text-xs text-slate-600 dark:text-ink-2">
            For a bilaterally abnormal, untestable or equivocal HIT, neither option applies:
            leave HIT unselected and seek clinical reassessment.
          </p>
          <FindingToggle label="Nystagmus (N)" value={findings.nystagmus} onChange={(v) => setFinding('nystagmus', v)}
            options={[
              { value: 'uni', label: 'Unidirectional Horizontal', central: false },
              { value: 'bi', label: 'Pathologic direction-changing / vertical / pure torsional', central: true }
            ]} />
          <FindingToggle label="Test of Skew (TS)" value={findings.skew} onChange={(v) => setFinding('skew', v)}
            options={[
              { value: 'none', label: 'No vertical refixation', central: false },
              { value: 'skew', label: 'Skew present', central: true }
            ]} />
          <FindingToggle label="Bedside Hearing Test (+)" value={findings.hearing} onChange={(v) => setFinding('hearing', v)}
            options={[
              { value: 'normal', label: 'Hearing intact', central: false },
              { value: 'loss', label: 'New unilateral loss', central: true }
            ]} />

          {/* Live result panel */}
          <div role="status" aria-live="polite" aria-atomic="true" className={cx('rounded-md border px-3 py-3', TONE[result.tone].chip)}>
            <div className="flex items-center gap-2">
              <span className={cx('inline-block w-2.5 h-2.5 rounded-full', TONE[result.tone].dot)} aria-hidden="true" />
              <h5 className="text-sm font-bold">{result.profile}</h5>
            </div>
            {result.isCentral ? (
              <p className="mt-1.5 text-xs leading-relaxed">
                <strong>Alert — central warning pattern.</strong> Central finding(s): <strong>{result.reasons.join('; ')}</strong>.
                Treat as urgent stroke evaluation in the right clinical setting; activate local stroke pathways and obtain appropriate neuroimaging.
              </p>
            ) : !result.complete ? (
              <p className="mt-1.5 text-xs leading-relaxed">
                Record all four findings before interpreting a peripheral pattern. An untestable or equivocal examination requires clinical reassessment and appropriate imaging; it is not a negative test.
              </p>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed">
                The recorded pattern supports peripheral vestibulopathy when obtained by a trained examiner in continuous AVS with nystagmus.
                Reassess discordant symptoms, severe gait impairment, or other neurologic findings; this teaching aid does not independently exclude stroke.
              </p>
            )}
          </div>

          <button type="button" onClick={() => setFindings(DEFAULT_FINDINGS)}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-xs font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-overlay dark:text-ink dark:hover:bg-overlay">
            Clear exam findings
          </button>
        </section>
      </div>

      {/* ── INFARCT mnemonic ── */}
      <section className="rounded-lg border border-crit-200 bg-crit-50 p-3 dark:border-crit-800 dark:bg-crit-950">
        <h4 className="text-sm font-bold text-crit-800 dark:text-crit-300">INFARCT — central warning signs that trigger urgent evaluation</h4>
        <p className="text-2xs uppercase tracking-wide font-semibold text-crit-700 mt-0.5 dark:text-crit-300">HINTS+ central-sign mnemonic</p>
        <ul className="mt-2 space-y-1.5">
          {INFARCT.map((row) => (
            <li key={row.label} className="flex items-start gap-2 text-xs text-slate-800 dark:text-ink">
              <span className="font-mono font-bold text-crit-700 shrink-0 w-12 dark:text-crit-300">{row.letter}</span>
              <span><strong>{row.label}</strong> — {row.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── HINTS interpretation reference table ── */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">HINTS interpretation reference</h4>
        <div className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Scrollable table: HINTS exam interpretation reference">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="border border-line bg-slate-50 px-2.5 py-2 text-left font-semibold text-slate-700 dark:bg-paper-2 dark:text-ink-2">Test phase</th>
                <th className="border border-line bg-ok-50 px-2.5 py-2 text-left font-semibold text-ok-800 dark:bg-ok-950 dark:text-ok-300">Peripheral-compatible pattern</th>
                <th className="border border-line bg-crit-50 px-2.5 py-2 text-left font-semibold text-crit-800 dark:bg-crit-950 dark:text-crit-300">Central warning signs</th>
              </tr>
            </thead>
            <tbody>
              {HINTS_TABLE.map((row) => (
                <tr key={row.phase}>
                  <td className="border border-line px-2.5 py-2 font-semibold text-slate-800 dark:text-ink">{row.phase}</td>
                  <td className="border border-line px-2.5 py-2 text-slate-700 dark:text-ink-2">{row.peripheral}</td>
                  <td className="border border-line px-2.5 py-2 text-slate-700 dark:text-ink-2">{row.central}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-2xs text-slate-500 dark:text-mute">
          Apply HINTS+ only in the Acute Vestibular Syndrome with active nystagmus. In this setting it
          can be more sensitive than early MRI-DWI for posterior-circulation stroke when performed by trained clinicians.
        </p>
        <p className="text-xs text-slate-600 dark:text-ink-2">
          Source: <a href="https://doi.org/10.1111/acem.14728" target="_blank" rel="noopener noreferrer"
            className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-600">GRACE-3 (2023), recommendations 2–3 and Tables 2 and 4</a>.
          This reference does not replace supervised examination training.
        </p>
      </section>
    </div>
  );
}

/* ── Finding toggle pair ──────────────────────────────────────────────── */
function FindingToggle({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700 mb-1 dark:text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cx('px-3 py-2 h-auto min-h-[44px] max-w-full whitespace-normal rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                active
                  ? (opt.central ? 'bg-crit-600 text-white' : 'bg-ok-600 text-white')
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:hover:bg-overlay')}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HintsSimulator;
