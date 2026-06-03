/**
 * Bedside Simulator 2 — HINTS+ Eye-Movement Simulator.
 * Drop-in: src/simulators/HintsSimulator.jsx
 *
 * A self-contained, dependency-free teaching simulator for the 3-step
 * HINTS (plus bedside hearing → HINTS+) exam used to differentiate a
 * CENTRAL (posterior-circulation stroke) from a PERIPHERAL (vestibular
 * neuritis) cause of the Acute Vestibular Syndrome (AVS).
 *
 * Two linked widgets:
 *   1. Eye Simulator stage — an animated round head + 2 eyes whose pupils
 *      sit on a fixation target. Buttons trigger the 4 HINTS components.
 *      Each scenario's eye/head motion is a NAMED CSS @keyframes class
 *      toggled by React state (activeAnim) — no setInterval / inline-style
 *      mutation. Selecting a new scenario cancels/replaces the prior one.
 *   2. Diagnostic Assistant — 4 toggle pairs feeding {hit, nystagmus,
 *      skew, hearing} into the classifier.
 *
 * Classifier (ported EXACTLY from the source — counterintuitive, by design):
 *   • A NORMAL/intact head-impulse is the CENTRAL sign in AVS.
 *   • isCentral = HIT-normal || direction-changing-nystagmus || skew
 *                 || new unilateral hearing loss. Any central or equivocal
 *     finding prompts urgent central-cause / stroke evaluation.
 *
 * Styling: v7 tokens / Tailwind utilities only (teal accent, crit/warn/ok
 * semantics, slate neutrals). The eye-stage geometry + @keyframes live in a
 * scoped <style> block; no dark-glass theme, no forbidden hue utilities.
 *
 * No print view, no localStorage, no institutional content.
 */

import React, { useState } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* v7 palette (hex) for the eye-stage drawing context where Tailwind
   utilities don't reach. Mirrors src/design/tokens.css. */
const C = {
  teal:   '#0C7C8C',
  tealDk: '#0A6571',
  coral:  '#DC3F3A',
  gold:   '#B07D24',
  green:  '#2C7A52',
  ink:    '#14171D',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B'
};

/* ── Scenario catalogue ───────────────────────────────────────────────
   Each entry maps a button to an animation class + an explanation. The
   `anim` value becomes a CSS class on the eye stage (see scoped <style>).
   `cover` selects which cover-patch animation runs (test-of-skew only). */
const SCENARIOS = {
  /* 1 · Head-Impulse Test (HIT) */
  'hit-peripheral': {
    group: 'Head Impulse Test (HIT)',
    label: 'VOR Deficit (Peripheral)',
    tone: 'ok',
    anim: 'hint-anim-hit-peripheral',
    text: 'Head Impulse Test (Peripheral / VOR deficit): the head rotates right, but the vestibulo-ocular reflex fails — the eyes ride along with the head, then a quick corrective catch-up saccade snaps them back onto the target. An ABNORMAL HIT (refixation saccade) is the PERIPHERAL/benign sign (vestibular neuritis).'
  },
  'hit-central': {
    group: 'Head Impulse Test (HIT)',
    label: 'VOR Intact (Central)',
    tone: 'crit',
    anim: 'hint-anim-hit-central',
    text: 'Head Impulse Test (Central / VOR intact): the head rotates right, the VOR is intact, so the eyes immediately counter-rotate and stay locked on the target with no catch-up saccade. A NORMAL HIT is the CENTRAL/stroke sign in AVS — counterintuitive but load-bearing.'
  },

  /* 2 · Nystagmus (N) */
  'nys-uni': {
    group: 'Nystagmus (N)',
    label: 'Unidirectional (Peripheral)',
    tone: 'ok',
    anim: 'hint-anim-nys-uni',
    text: 'Unidirectional Nystagmus (Peripheral): spontaneous fast phase that beats in ONE direction regardless of gaze — slow drift one way, fast snap the other. Direction does not change with gaze. Peripheral / benign.'
  },
  'nys-bi': {
    group: 'Nystagmus (N)',
    label: 'Gaze-Evoked / Direction-Changing (Central)',
    tone: 'crit',
    anim: 'hint-anim-nys-bi',
    text: 'Direction-Changing (Gaze-Evoked) Nystagmus (Central): the fast phase REVERSES with the direction of gaze — beats left on left gaze, right on right gaze. Highly specific marker of a central (posterior-fossa) lesion.'
  },
  'nys-vert': {
    group: 'Nystagmus (N)',
    label: 'Vertical (Central)',
    tone: 'crit',
    anim: 'hint-anim-nys-vert',
    text: 'Pure Vertical Nystagmus (Central): spontaneous down-beating nystagmus — eyes drift slowly up, then fast-snap down. Vertical nystagmus is exclusively central (brainstem / cerebellar stroke).'
  },

  /* 3 · Test of Skew (TS) */
  'skew-none': {
    group: 'Test of Skew (TS)',
    label: 'No Skew (Peripheral)',
    tone: 'ok',
    anim: 'hint-anim-skew-none',
    cover: 'alt',
    text: 'No Skew Deviation (Peripheral): on alternating cover/uncover the eyes stay conjugate and horizontally aligned — no vertical re-fixation movement. Peripheral / benign.'
  },
  'skew-present': {
    group: 'Test of Skew (TS)',
    label: 'Skew Present (Central)',
    tone: 'crit',
    anim: 'hint-anim-skew-present',
    cover: 'alt',
    text: 'Skew Deviation Present (Central): the covered eye vertical-drifts; on uncover it makes a vertical re-fixation movement to realign. Vertical ocular misalignment points to a brainstem / oculomotor-pathway stroke.'
  },

  /* 4 · Bedside Hearing Test (HINTS+) */
  'hear-normal': {
    group: 'Bedside Hearing Test (HINTS+)',
    label: 'Hearing Intact (Peripheral)',
    tone: 'ok',
    anim: '',
    text: 'Bedside Hearing Test (Intact / Peripheral): finger-rub or whisper is heard equally in both ears, no new hearing loss. Intact hearing fits a peripheral pattern.'
  },
  'hear-loss': {
    group: 'Bedside Hearing Test (HINTS+)',
    label: 'New Hearing Loss (Central / AICA)',
    tone: 'crit',
    anim: '',
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
   PORTED EXACTLY from the source. Do NOT "fix" the counterintuitive HIT
   rule: in the Acute Vestibular Syndrome a NORMAL head-impulse is the
   CENTRAL/stroke sign. */
export function classifyHints({ hit, nystagmus, skew, hearing }) {
  const isCentralHIT = hit === 'normal';        // intact VOR (no saccade) → central
  const isCentralNystagmus = nystagmus === 'bi'; // direction-changing / vertical → central
  const isCentralSkew = skew === 'skew';         // skew deviation present → central
  const isCentralHearing = hearing === 'loss';   // new unilateral hearing loss → AICA

  const isCentral = isCentralHIT || isCentralNystagmus || isCentralSkew || isCentralHearing;

  const reasons = [];
  if (isCentralHIT) reasons.push('Normal / intact VOR (no catch-up saccade)');
  if (isCentralNystagmus) reasons.push('Direction-changing or vertical nystagmus');
  if (isCentralSkew) reasons.push('Skew deviation present (vertical re-fixation)');
  if (isCentralHearing) reasons.push('New unilateral hearing loss (+, AICA)');

  return {
    isCentral,
    isCentralHIT,
    isCentralNystagmus,
    isCentralSkew,
    isCentralHearing,
    reasons,
    profile: isCentral ? 'CENTRAL WARNING PATTERN - URGENT STROKE EVALUATION' : 'PERIPHERAL VESTIBULAR PROFILE',
    tone: isCentral ? 'crit' : 'ok'
  };
}

/* Default findings — all peripheral. */
export const DEFAULT_FINDINGS = { hit: 'abnormal', nystagmus: 'uni', skew: 'none', hearing: 'normal' };

/* INFARCT mnemonic rows. */
const INFARCT = [
  { letter: 'I N', label: 'Impulse Normal', detail: 'Head-impulse VOR is intact (no catch-up saccade).' },
  { letter: 'F A', label: 'Fast-Alternating nystagmus', detail: 'Direction-changing (gaze-evoked) or vertical nystagmus.' },
  { letter: 'R C T', label: 'Refixation on Cover Test', detail: 'Vertical re-fixation = skew deviation present.' },
  { letter: '+', label: 'Unilateral hearing loss (AICA)', detail: 'New unilateral hearing loss adds the "+" → HINTS+.' }
];

/* HINTS interpretation reference table. */
const HINTS_TABLE = [
  { phase: 'Head Impulse (HIT)', peripheral: 'Abnormal — corrective catch-up saccade', central: 'Normal — eyes stay locked on target' },
  { phase: 'Nystagmus (N)', peripheral: 'Unidirectional — beats away from lesion', central: 'Direction-changing or vertical' },
  { phase: 'Test of Skew (TS)', peripheral: 'Stable — no vertical movement', central: 'Skew deviation — vertical re-fixation' },
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
  // Active eye-stage scenario key (null = idle).
  const [activeKey, setActiveKey] = useState(null);
  // Bump a nonce so re-clicking the same scenario restarts the CSS animation.
  const [animNonce, setAnimNonce] = useState(0);

  // Diagnostic-assistant findings.
  const [findings, setFindings] = useState(DEFAULT_FINDINGS);

  const scenario = activeKey ? SCENARIOS[activeKey] : null;
  const result = classifyHints(findings);

  const runScenario = (key) => {
    setActiveKey(key);
    setAnimNonce((n) => n + 1); // restart the keyframes even on repeat click
  };

  const setFinding = (field, value) =>
    setFindings((f) => ({ ...f, [field]: value }));

  const stageAnimClass = scenario && scenario.anim ? scenario.anim : '';
  const coverMode = scenario && scenario.cover ? scenario.cover : '';

  return (
    <div className="hints-sim space-y-4">
      <style>{`
        .hints-sim .hint-stage {
          width: 100%;
          height: 170px;
          background: ${C.ink};
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .hints-sim .hint-target {
          width: 9px; height: 9px;
          background: ${C.coral};
          border-radius: 50%;
          position: absolute;
          top: 20px; left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px ${C.coral};
          z-index: 10;
        }
        .hints-sim .hint-target-label {
          position: absolute;
          top: 33px; left: 50%;
          transform: translateX(-50%);
          color: ${C.slate400};
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hints-sim .hint-head {
          width: 120px; height: 120px;
          border-radius: 50%;
          background: #1f2630;
          position: relative;
          border: 3px solid ${C.slate500};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          transform: rotate(0deg);
        }
        .hints-sim .hint-nose {
          position: absolute;
          top: -11px;
          width: 13px; height: 22px;
          background: ${C.slate500};
          border-radius: 50% 50% 0 0;
        }
        .hints-sim .hint-eye {
          width: 30px; height: 18px;
          background: #ffffff;
          border-radius: 50% / 50%;
          position: relative;
          overflow: hidden;
          border: 1px solid #000;
        }
        .hints-sim .hint-pupil {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: ${C.ink};
          border: 2px solid ${C.teal};
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        .hints-sim .hint-cover {
          position: absolute;
          width: 40px; height: 30px;
          background: rgba(0,0,0,0.88);
          border: 1.5px solid ${C.slate500};
          border-radius: 4px;
          z-index: 20;
          opacity: 0;
          top: 50%;
        }
        .hints-sim .hint-cover.left  { transform: translate(-66px, -50%); }
        .hints-sim .hint-cover.right { transform: translate(26px, -50%); }

        /* ── 1 · Head-Impulse: PERIPHERAL (eyes drag, then catch-up saccade) ── */
        @keyframes hint-head-turn {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(20deg); }
          100% { transform: rotate(20deg); }
        }
        @keyframes hint-pupil-drag {
          /* eyes ride with the head, then a bouncy catch-up saccade (~450ms after turn) */
          0%   { transform: translate(-50%, -50%); }
          30%  { transform: translate(-50%, -50%); }
          62%  { transform: translate(-50%, -50%); }
          78%  { transform: translate(-86%, -50%); }
          100% { transform: translate(-86%, -50%); }
        }
        .hint-anim-hit-peripheral .hint-head {
          animation: hint-head-turn 1500ms cubic-bezier(0.25,1,0.5,1) forwards;
        }
        .hint-anim-hit-peripheral .hint-pupil {
          animation: hint-pupil-drag 1500ms cubic-bezier(0.18,0.89,0.32,1.28) forwards;
        }

        /* ── 1 · Head-Impulse: CENTRAL (VOR intact — eyes stay on target) ── */
        @keyframes hint-pupil-vor {
          0%   { transform: translate(-50%, -50%); }
          30%  { transform: translate(-86%, -50%); }
          100% { transform: translate(-86%, -50%); }
        }
        .hint-anim-hit-central .hint-head {
          animation: hint-head-turn 1500ms cubic-bezier(0.25,1,0.5,1) forwards;
        }
        .hint-anim-hit-central .hint-pupil {
          animation: hint-pupil-vor 1500ms cubic-bezier(0.25,1,0.5,1) forwards;
        }

        /* ── 2 · Nystagmus: UNIDIRECTIONAL (slow drift right, fast snap left) ── */
        @keyframes hint-nys-uni {
          0%   { transform: translate(-80%, -50%); }
          88%  { transform: translate(-20%, -50%); }   /* slow drift */
          100% { transform: translate(-80%, -50%); }   /* fast snap */
        }
        .hint-anim-nys-uni .hint-pupil {
          animation: hint-nys-uni 900ms linear infinite;
        }

        /* ── 2 · Nystagmus: DIRECTION-CHANGING (reverses with gaze) ── */
        @keyframes hint-nys-bi {
          /* first half: gaze left, beats left; second half: gaze right, beats right */
          0%   { transform: translate(-85%, -50%); }
          20%  { transform: translate(-60%, -50%); }
          22%  { transform: translate(-90%, -50%); }
          40%  { transform: translate(-60%, -50%); }
          42%  { transform: translate(-90%, -50%); }
          50%  { transform: translate(-20%, -50%); }   /* shift gaze right */
          70%  { transform: translate(-40%, -50%); }
          72%  { transform: translate(-10%, -50%); }
          90%  { transform: translate(-40%, -50%); }
          92%  { transform: translate(-10%, -50%); }
          100% { transform: translate(-85%, -50%); }   /* shift gaze left */
        }
        .hint-anim-nys-bi .hint-pupil {
          animation: hint-nys-bi 2600ms linear infinite;
        }

        /* ── 2 · Nystagmus: VERTICAL (slow up-drift, fast down-snap) ── */
        @keyframes hint-nys-vert {
          0%   { transform: translate(-50%, -25%); }
          82%  { transform: translate(-50%, -78%); }   /* slow drift up */
          100% { transform: translate(-50%, -25%); }   /* fast snap down */
        }
        .hint-anim-nys-vert .hint-pupil {
          animation: hint-nys-vert 900ms linear infinite;
        }

        /* ── 3 · Test-of-Skew: alternating cover (no skew) ── */
        @keyframes hint-cover-left {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes hint-cover-right {
          0%, 49%   { opacity: 0; }
          50%, 100% { opacity: 1; }
        }
        .hint-anim-skew-none .hint-cover.left,
        .hint-anim-skew-present .hint-cover.left {
          animation: hint-cover-left 3000ms steps(1) infinite;
        }
        .hint-anim-skew-none .hint-cover.right,
        .hint-anim-skew-present .hint-cover.right {
          animation: hint-cover-right 3000ms steps(1) infinite;
        }

        /* ── 3 · Test-of-Skew: skew present (covered eye drifts, re-fixates on uncover) ── */
        @keyframes hint-skew-left-pupil {
          /* left eye covered in 2nd half: drifts down under cover, snaps up on uncover (1st half) */
          0%   { transform: translate(-50%, -50%); }   /* uncovered, aligned */
          49%  { transform: translate(-50%, -50%); }
          50%  { transform: translate(-50%, -32%); }   /* covered → drifts down */
          99%  { transform: translate(-50%, -32%); }
          100% { transform: translate(-50%, -50%); }   /* uncover → re-fixation up */
        }
        @keyframes hint-skew-right-pupil {
          0%   { transform: translate(-50%, -32%); }   /* covered → drifts down */
          49%  { transform: translate(-50%, -32%); }
          50%  { transform: translate(-50%, -50%); }   /* uncover → re-fixation up */
          99%  { transform: translate(-50%, -50%); }
          100% { transform: translate(-50%, -32%); }
        }
        .hint-anim-skew-present .hint-eye:nth-child(2) .hint-pupil {
          animation: hint-skew-left-pupil 3000ms ease-out infinite;
        }
        .hint-anim-skew-present .hint-eye:nth-child(3) .hint-pupil {
          animation: hint-skew-right-pupil 3000ms ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hints-sim .hint-head,
          .hints-sim .hint-pupil,
          .hints-sim .hint-cover { animation: none !important; }
        }
      `}</style>

      <p className="text-sm text-slate-600 dark:text-ink-2">
        The 3-step HINTS exam (plus bedside hearing → HINTS+) differentiates a CENTRAL
        posterior-circulation stroke from a PERIPHERAL vestibular neuritis in patients with the
        Acute Vestibular Syndrome (continuous vertigo, nystagmus, head-motion intolerance). In this
        setting HINTS+ can outperform early MRI-DWI when performed by trained clinicians. Use it only
        when spontaneous/active nystagmus is present — never for episodic positional vertigo (e.g. BPPV).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Widget 1 · Eye Simulator stage ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Interactive Eye Simulator</h4>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">bedside teaching tool</span>
          </div>

          <div className="hint-stage" role="img"
            aria-label={scenario ? `Eye simulator: ${scenario.label}` : 'Eye simulator stage — pick a HINTS test below to animate the eyes.'}>
            <span className="hint-target" aria-hidden="true" />
            <span className="hint-target-label" aria-hidden="true">Target (nose)</span>
            {/* key forces a remount so the keyframes restart on every selection */}
            <div key={`${activeKey || 'idle'}-${animNonce}`} className={cx('hint-head-wrap', stageAnimClass)}>
              <div className="hint-head">
                <div className="hint-nose" aria-hidden="true" />
                <div className={cx('hint-cover left', coverMode)} aria-hidden="true" />
                <div className={cx('hint-cover right', coverMode)} aria-hidden="true" />
                <div className="hint-eye"><div className="hint-pupil" /></div>
                <div className="hint-eye"><div className="hint-pupil" /></div>
              </div>
            </div>
          </div>

          <div className={cx('rounded-md border px-3 py-2 text-xs leading-relaxed min-h-[64px]',
            scenario ? TONE[scenario.tone].chip : 'bg-slate-50 text-slate-600 border-line dark:bg-paper-2 dark:text-ink-2')}>
            {scenario ? scenario.text : 'Select a HINTS test scenario below to animate the eye movement and read its interpretation.'}
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
                    <button key={key} type="button" onClick={() => runScenario(key)}
                      className={cx('px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
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

        {/* ── Widget 2 · Diagnostic Assistant ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Bedside Diagnostic Assistant</h4>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">HINTS+ classifier</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-ink-2">
            Enter your four exam findings. Any central or equivocal finding should prompt urgent
            evaluation for a central cause; HINTS+ is not a stand-alone diagnosis.
          </p>

          <FindingToggle label="Head Impulse Test (HIT)" value={findings.hit} onChange={(v) => setFinding('hit', v)}
            options={[
              { value: 'abnormal', label: 'Abnormal VOR (saccade)', central: false },
              { value: 'normal', label: 'Normal VOR (intact)', central: true }
            ]} />
          <FindingToggle label="Nystagmus (N)" value={findings.nystagmus} onChange={(v) => setFinding('nystagmus', v)}
            options={[
              { value: 'uni', label: 'Unidirectional', central: false },
              { value: 'bi', label: 'Direction-changing / vertical', central: true }
            ]} />
          <FindingToggle label="Test of Skew (TS)" value={findings.skew} onChange={(v) => setFinding('skew', v)}
            options={[
              { value: 'none', label: 'Stable (no skew)', central: false },
              { value: 'skew', label: 'Skew present', central: true }
            ]} />
          <FindingToggle label="Bedside Hearing Test (+)" value={findings.hearing} onChange={(v) => setFinding('hearing', v)}
            options={[
              { value: 'normal', label: 'Hearing intact', central: false },
              { value: 'loss', label: 'New unilateral loss', central: true }
            ]} />

          {/* Live result panel */}
          <div className={cx('rounded-md border px-3 py-3', TONE[result.tone].chip)}>
            <div className="flex items-center gap-2">
              <span className={cx('inline-block w-2.5 h-2.5 rounded-full', TONE[result.tone].dot)} aria-hidden="true" />
              <h5 className="text-sm font-bold">{result.profile}</h5>
            </div>
            {result.isCentral ? (
              <p className="mt-1.5 text-xs leading-relaxed">
                <strong>Alert — central warning pattern.</strong> Central finding(s): <strong>{result.reasons.join('; ')}</strong>.
                Treat as urgent stroke evaluation in the right clinical setting; activate local stroke pathways and obtain appropriate neuroimaging.
              </p>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed">
                All four steps are benign (abnormal HIT, unidirectional nystagmus, no skew, normal
                hearing) — consistent with acute peripheral vestibulopathy (e.g. vestibular neuritis).
                Manage symptomatically and reassess.
              </p>
            )}
          </div>

          <button type="button" onClick={() => setFindings(DEFAULT_FINDINGS)}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-xs font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:bg-overlay dark:text-ink dark:hover:bg-overlay">
            Reset to peripheral defaults
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
                <th className="border border-line bg-ok-50 px-2.5 py-2 text-left font-semibold text-ok-800 dark:bg-ok-950 dark:text-ok-300">Peripheral (benign)</th>
                <th className="border border-line bg-crit-50 px-2.5 py-2 text-left font-semibold text-crit-800 dark:bg-crit-950 dark:text-crit-300">Central (stroke)</th>
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
              className={cx('px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
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
