/**
 * Bedside Simulator 3 — Pupillometry / NPi Simulator.
 * Drop-in: src/simulators/PupillometrySimulator.jsx
 *
 * A self-contained, dependency-free teaching simulator for quantitative
 * infrared pupillometry (Neurological Pupil Index, NPi) in severe stroke
 * and intracerebral hemorrhage. Doubles as the app's net-new NPi evidence
 * module.
 *
 * Two coupled widgets:
 *   1. Pupil Light-Reflex stage — two pupil elements (LEFT = ipsilateral /
 *      lesion, RIGHT = contralateral) rendered at width/height px = size×10.
 *      A "Simulate Light Reflex" button runs a constrict → hold → redilate
 *      animation, driven purely by React state + CSS transitions (gated by an
 *      isAnimating flag). `prefers-reduced-motion` short-circuits the
 *      animation and simply shows the end state.
 *   2. Clinical Interpreter — an interpretation cascade (ORDER MATTERS) that
 *      keys off NPi, constriction velocity (CV), % constriction, and the
 *      inter-eye NPi asymmetry, plus a midline-shift estimate and escalation
 *      reference cards.
 *
 * Clinical model (values are load-bearing — see app build spec):
 *   • Interpretation cascade (evaluated top → bottom; first match wins):
 *       1. NPi ≤ 1.0                              → HERNIATION CRISIS (100%, crit)
 *       2. NPi < 2.8 OR diff ≥ 0.7 OR cv < 0.5    → SEVERE SHIFT ALARM (75%, gold/orange)
 *       3. NPi < 3.0 OR cv < 0.8 OR %change < 10  → EARLY CLINICAL ALARM (45%, warn/amber)
 *       4. else                                   → NORMAL PROFILE (10%, ok/green)
 *     NOTE: the source UI text said "NPi=0.0" for herniation but its CODE
 *     triggered at ≤ 1.0. We follow the CODE (≤ 1.0) — the herniation card
 *     reads "NPi ≤ 1.0 (areflexic / near-areflexic)". Flagged in the report.
 *   • Midline-shift estimate: ichShift = diff×5.5 mm (septum pellucidum),
 *     strokeShift = diff×8.0 mm (pineal gland); "High probability of
 *     clinically significant shift" when diff ≥ 0.7.
 *   • Animation kinetics: left transition duration = 0.375/cv s; left latency =
 *     npi < 3.0 ? (5.0 − npi)×0.1 : 0.2 s; right initial size =
 *     max(1.5, size − diff×1.5) (anisocoria); right constricts 20% (0% when
 *     NPi === 0).
 *
 * Evidence (net-new content — present accurately, WITH the caveat):
 *   • Petrosino 2025 (JAMA Neurol), secondary analysis of ORANGE (n=318 with
 *     invasive ICP): NO significant association between NPi and ICP; a normal
 *     NPi does NOT safely exclude elevated ICP; pupillometry cannot replace
 *     invasive ICP monitoring. Presented prominently as a limitation/caveat
 *     that tempers the alarm thresholds.
 *
 * Styling: v7 tokens / Tailwind utilities only (teal accent, crit/warn/ok
 * semantics, slate neutrals). Pupil-stage geometry + transitions live in a
 * scoped <style> block; no dark-glass theme, no forbidden hue utilities.
 *
 * No print view, no localStorage, no institutional content.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* v7 palette (hex) for the pupil-stage drawing context where Tailwind
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

const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ── Pure helpers (exported for unit tests) ───────────────────────────── */

/* Contralateral (right) initial size — anisocoria from inter-eye asymmetry.
   Compression dilates the ipsilateral (left) pupil relative to the
   contralateral, so the contralateral baseline is smaller by diff×1.5 mm,
   floored at 1.5 mm. */
export function contralateralInitialSize(size, diff) {
  return Math.max(1.5, size - diff * 1.5);
}

/* Midline-shift estimate keyed off inter-eye NPi asymmetry.
   β = 0.11 for septum-pellucidum shift in ICH → ~diff×5.5 mm.
   β = 0.16 for pineal-gland shift in ischemic stroke → ~diff×8.0 mm.
   diff ≥ 0.7 → "High probability of clinically significant shift". */
export function computeMidlineShift(diff) {
  const ichShift = round1(diff * 5.5);
  const strokeShift = round1(diff * 8.0);
  const highProbability = diff >= 0.7;
  return {
    ichShift,
    strokeShift,
    highProbability,
    probabilityLabel: highProbability ? 'High probability' : 'Low probability'
  };
}

/* Interpretation cascade — ORDER MATTERS, first match wins.
   Ported from the source CODE (not its UI text — see herniation note). */
export function interpretPupillometry({ npi, cv, change, diff }) {
  // 1 · Herniation crisis (critical). CODE triggers at ≤ 1.0, not = 0.0.
  if (npi <= 1.0) {
    return {
      status: 'HERNIATION CRISIS (CRITICAL)',
      tone: 'crit',
      riskPercent: 100,
      summary: `NPi is areflexic / near-areflexic (${npi.toFixed(1)}), indicating severe brainstem compression, midbrain dysfunction, or active transtentorial herniation. Immediate hyperosmolar decompression is required.`,
      steps: [
        'Administer hyperosmolar bolus immediately (mannitol 1 g/kg or 23.4% hypertonic saline 30 mL via central line).',
        'Elevate head of bed to 30° and align the neck midline to optimize venous drainage.',
        'Temporarily hyperventilate (target PaCO₂ 30–35 mmHg) as a bridge only.',
        'STAT Neurosurgery for emergent decompression (hemicraniectomy / hematoma evacuation) or EVD placement.',
        'Call for a STAT non-contrast head CT.'
      ]
    };
  }
  // 2 · Severe shift alarm (high danger).
  if (npi < 2.8 || diff >= 0.7 || cv < 0.5) {
    return {
      status: 'SEVERE SHIFT ALARM',
      tone: 'gold',
      riskPercent: 75,
      summary: 'Markedly abnormal pupillary profile (NPi < 2.8, NPi diff ≥ 0.7, or CV < 0.5 mm/s). Highly specific for impending clinical deterioration from midline shift or expanding mass effect.',
      steps: [
        'Notify the Stroke Fellow and Neurocritical Care Attending immediately.',
        'Obtain an urgent non-contrast head CT to check for hematoma expansion or malignant edema.',
        'Prepare and consent for potential emergency hemicraniectomy (ischemic) or surgical drainage (ICH).',
        'Assess sedation depth and review invasive ICP-monitor readings if active.'
      ]
    };
  }
  // 3 · Early clinical alarm (action required).
  if (npi < 3.0 || cv < 0.8 || change < 10) {
    return {
      status: 'EARLY CLINICAL ALARM',
      tone: 'warn',
      riskPercent: 45,
      summary: 'Borderline pupillary reactivity (NPi < 3.0, CV < 0.8 mm/s, or % constriction < 10%). Suggests possible early CN III compression. Per Giede-Jeppe 2021 these CV / %-change cut-points were proposed to flag ICP ≥ 20 mmHg — but see the Petrosino 2025 caveat below.',
      steps: [
        'Perform a thorough clinical neurological assessment.',
        'Review the NPi trend: a decreasing trend over the last 3 readings is an early alarm even if still > 3.0.',
        'Verify correct device placement and clean the ocular area to rule out capture errors.',
        'Consider a repeat non-contrast head CT if NPi has dropped from baseline.'
      ]
    };
  }
  // 4 · Normal profile.
  return {
    status: 'NORMAL PROFILE',
    tone: 'ok',
    riskPercent: 10,
    summary: 'Pupillary parameters are within normal limits. Normal NPi (> 3.0) and CV (> 0.8 mm/s) suggest absence of active brainstem compression — but normal pupillometry CANNOT safely exclude elevated ICP and cannot replace invasive monitoring (Petrosino 2025).',
    steps: [
      'Continue baseline serial assessments every 4 hours.',
      'Ensure nursing staff are calibrated on device use.',
      'Document values in the flowsheet and track the NPi trend over time.'
    ]
  };
}

/* Tone → Tailwind class fragments. `gold` maps onto warn-tinted surfaces with
   the v7 gold accent applied inline where needed. */
const TONE = {
  ok:   { chip: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800',     dot: 'bg-ok-500',   bar: C.green },
  warn: { chip: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-300 dark:border-warn-800', dot: 'bg-warn-500', bar: C.gold },
  gold: { chip: 'bg-warn-50 text-warn-800 border-warn-300 dark:bg-warn-950 dark:text-warn-300 dark:border-warn-800', dot: 'bg-warn-600', bar: C.gold },
  crit: { chip: 'bg-crit-50 text-crit-800 border-crit-200 dark:bg-crit-950 dark:text-crit-300 dark:border-crit-800', dot: 'bg-crit-500', bar: C.coral }
};

/* ── Escalation reference cards (NPi action thresholds) ────────────────── */
const ESCALATION = [
  {
    badge: '≤ 1.0', tone: 'crit', title: 'NPi ≤ 1.0 — Herniation Crisis',
    detail: 'Areflexic / near-areflexic pupil. Hyperosmolar bolus (mannitol or 23.4% saline), transient hyperventilation, STAT emergent decompression / EVD.'
  },
  {
    badge: '< 2.8', tone: 'gold', title: 'NPi < 2.8 — Malignant MCA-Edema Alarm',
    detail: 'Highly specific for deterioration in large MCA stroke (Kim 2020: all NPi < 2.8 deteriorated). Triage immediately for hemicraniectomy consult.'
  },
  {
    badge: '< 3.0', tone: 'warn', title: 'NPi < 3.0 — Abnormal Threshold',
    detail: 'Triggers a stat neurological exam, assessment for clinical expansion, and a non-contrast head CT.'
  },
  {
    badge: '≥ 0.7', tone: 'warn', title: 'NPi-diff ≥ 0.7 — Unilateral Mass Effect',
    detail: 'Early CN III compression. Correlates with horizontal midline shift (septum pellucidum in ICH; pineal gland in ischemic stroke).'
  },
  {
    badge: 'CV / %', tone: 'warn', title: 'CV < 0.8 mm/s or % constriction < 10% — ICP ≥ 20 mmHg concern',
    detail: 'Giede-Jeppe 2021 proposed these cut-points (NPV > 97%) to flag intracranial hypertension — but the larger Petrosino 2025 analysis found no reliable NPi–ICP association (see caveat).'
  }
];

/* ── Evidence base (net-new NPi module) ───────────────────────────────── */
const EVIDENCE = [
  {
    study: 'Petrosino et al. — JAMA Neurol 2025',
    caveat: true,
    cohort: 'Secondary analysis of ORANGE, n = 318 with invasive ICP monitoring.',
    finding: 'NO significant association between NPi and ICP. A normal NPi does NOT safely exclude elevated ICP. Pupillometry CANNOT replace invasive ICP monitoring.'
  },
  {
    study: 'ORANGE Study — Lancet Neurol 2023',
    cohort: '514 acute-brain-injury patients (151 ICH) across 8 countries.',
    finding: 'Abnormal NPi independently associated with poor 6-month outcome and in-hospital mortality (HR 5.58, 95% CI 3.92–7.95). Established NPi < 3.0 as a robust prognostic marker.'
  },
  {
    study: 'Park et al. — PLoS One 2025',
    cohort: '59 malignant anterior-circulation strokes.',
    finding: 'Ipsilateral NPi dropped from 4.26 (at ~24 h) to 1.80 (at 0–3 h) before transtentorial herniation — up to a 24-hour warning window.'
  },
  {
    study: 'Kim et al. — Neurocrit Care 2020',
    cohort: '30 large-hemispheric strokes.',
    finding: 'Deteriorating patients had lower mean NPi (3.88 vs 4.45, p < 0.001). ALL patients with NPi < 2.8 deteriorated — a highly specific trigger for malignant-edema intervention.'
  },
  {
    study: 'Anatomic shift correlates',
    cohort: 'ICH vs ischemic-stroke midline-shift markers.',
    finding: 'ICH: midline shift of the septum pellucidum predicts NPi asymmetry (β = 0.11, p = 0.01). Ischemic: pineal-gland shift drives asymmetry (β = 0.16, p = 0.07).'
  }
];

/* ── Animation timing constants (ms) ──────────────────────────────────── */
const HOLD_MS = 1600;     // constrict → hold before redilation
const REDILATE_MS = 800;  // redilation transition duration
const UNLOCK_MS = 850;    // button unlock after redilation begins

/* ── Component ────────────────────────────────────────────────────────── */
export function PupillometrySimulator() {
  const [npi, setNpi] = useState(4.5);
  const [cv, setCv] = useState(1.5);
  const [size, setSize] = useState(4.0);
  const [change, setChange] = useState(20);
  const [diff, setDiff] = useState(0.0);

  const [isAnimating, setIsAnimating] = useState(false);

  const leftInitial = size;
  const rightInitial = contralateralInitialSize(size, diff);

  /* Live rendered pupil sizes (mm) + their CSS transition strings. Default to
     the static initial state; the animation drives them through phases. */
  const [leftRender, setLeftRender] = useState({ mm: leftInitial, transition: 'width 0.15s ease-out, height 0.15s ease-out', phase: 'Initial' });
  const [rightRender, setRightRender] = useState({ mm: rightInitial, transition: 'width 0.15s ease-out, height 0.15s ease-out', phase: 'Initial' });

  const timers = useRef([]);

  const result = interpretPupillometry({ npi, cv, change, diff });
  const shift = computeMidlineShift(diff);
  const tone = TONE[result.tone] || TONE.ok;

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  /* When sliders change while idle, keep the pupils at their static initial
     state (no animation in flight). */
  useEffect(() => {
    if (isAnimating) return;
    setLeftRender({ mm: leftInitial, transition: 'width 0.15s ease-out, height 0.15s ease-out', phase: 'Initial' });
    setRightRender({ mm: rightInitial, transition: 'width 0.15s ease-out, height 0.15s ease-out', phase: 'Initial' });
  }, [leftInitial, rightInitial, isAnimating]);

  useEffect(() => () => clearTimers(), []);

  const simulateReflex = useCallback(() => {
    if (isAnimating) return;

    // Constricted target sizes.
    const leftConstricted = Math.max(1.0, leftInitial * (1 - change / 100));
    const rightChange = npi === 0 ? 0 : 20; // contralateral keeps ~20% reflex unless dead
    const rightConstricted = Math.max(1.0, rightInitial * (1 - rightChange / 100));

    // prefers-reduced-motion → skip the animation; show the redilated end state.
    if (reducedMotion) {
      setLeftRender({ mm: leftInitial, transition: 'none', phase: 'Initial' });
      setRightRender({ mm: rightInitial, transition: 'none', phase: 'Initial' });
      return;
    }

    setIsAnimating(true);
    clearTimers();

    // Phase 1 · constriction. CV → transition duration; NPi → latency.
    const leftDuration = cv > 0 ? round1(0.375 / cv) : 0;
    const rightDuration = 0.25;
    const leftLatency = npi < 3.0 ? round1((5.0 - npi) * 0.1) : 0.2;
    const rightLatency = 0.2;
    const ease = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    const leftConstricts = leftDuration > 0 && change > 0;
    setLeftRender({
      mm: leftConstricts ? leftConstricted : leftInitial,
      transition: leftConstricts
        ? `width ${leftDuration}s ${ease} ${leftLatency}s, height ${leftDuration}s ${ease} ${leftLatency}s`
        : 'none',
      phase: leftConstricts ? 'Constricted' : 'Fixed'
    });

    const rightConstricts = rightChange > 0;
    setRightRender({
      mm: rightConstricts ? rightConstricted : rightInitial,
      transition: rightConstricts
        ? `width ${rightDuration}s ${ease} ${rightLatency}s, height ${rightDuration}s ${ease} ${rightLatency}s`
        : 'none',
      phase: rightConstricts ? 'Constricted' : 'Fixed'
    });

    // Phase 2 · redilation back to initial.
    timers.current.push(setTimeout(() => {
      setLeftRender({ mm: leftInitial, transition: `width ${REDILATE_MS / 1000}s ease-out, height ${REDILATE_MS / 1000}s ease-out`, phase: 'Initial' });
      setRightRender({ mm: rightInitial, transition: `width ${REDILATE_MS / 1000}s ease-out, height ${REDILATE_MS / 1000}s ease-out`, phase: 'Initial' });

      timers.current.push(setTimeout(() => {
        setIsAnimating(false);
      }, UNLOCK_MS));
    }, HOLD_MS));
  }, [isAnimating, leftInitial, rightInitial, change, npi, cv, diff, reducedMotion]);

  const leftPx = leftRender.mm * 10;
  const rightPx = rightRender.mm * 10;

  return (
    <div className="npi-sim space-y-4">
      <style>{`
        .npi-sim .npi-stage {
          width: 100%;
          background: ${C.ink};
          border-radius: 10px;
          padding: 18px 12px;
          display: flex;
          gap: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .npi-sim .npi-eye-box {
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .npi-sim .npi-eye-label {
          color: ${C.slate400};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-align: center;
        }
        .npi-sim .npi-iris {
          width: 96px; height: 96px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 38% 34%, #5a4a3a 0%, #3a2e22 58%, #241c14 100%);
          border: 2px solid ${C.slate500};
          box-shadow: inset 0 0 14px rgba(0,0,0,0.55);
          flex-shrink: 0;
        }
        .npi-sim .npi-pupil {
          border-radius: 50%;
          background: #050505;
          box-shadow: 0 0 6px rgba(0,0,0,0.8);
          /* width/height + transition are set inline from React state */
        }
        .npi-sim .npi-eye-metric {
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          text-align: center;
        }
        .npi-sim .npi-eye-phase {
          color: ${C.slate400};
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        @media (prefers-reduced-motion: reduce) {
          .npi-sim .npi-pupil { transition: none !important; }
        }
      `}</style>

      <p className="text-sm text-slate-600 dark:text-ink-2">
        Quantitative infrared pupillometry reports the <strong>Neurological Pupil Index (NPi, 0.0–5.0)</strong>, a
        standardized composite of pupillary-light-reflex kinetics benchmarked against &gt; 24,000 healthy pupils. It is a
        bedside surrogate for the integrity of the superficial parasympathetic fibers on the oculomotor nerve (CN III) and
        can fall up to <strong>24 hours</strong> before a pupil visibly dilates. Drive the sliders and run the light reflex
        to see how NPi, constriction velocity, and inter-eye asymmetry shift the clinical interpretation.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Widget 1 · Pupil light-reflex stage + controls ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Pupil Light-Reflex Simulator</h4>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">bedside teaching tool</span>
          </div>

          <div className="npi-stage" role="img"
            aria-label={`Pupil light-reflex simulator. Left (ipsilateral) pupil ${round1(leftRender.mm)} millimeters, right (contralateral) pupil ${round1(rightRender.mm)} millimeters.`}>
            <div className="npi-eye-box">
              <span className="npi-eye-label">Left eye · ipsilateral (lesion)</span>
              <div className="npi-iris">
                <div className="npi-pupil"
                  style={{ width: `${leftPx}px`, height: `${leftPx}px`, transition: leftRender.transition }} />
              </div>
              <span className="npi-eye-metric">{round1(leftRender.mm).toFixed(1)} mm</span>
              <span className="npi-eye-phase">{leftRender.phase}</span>
            </div>
            <div className="npi-eye-box">
              <span className="npi-eye-label">Right eye · contralateral</span>
              <div className="npi-iris">
                <div className="npi-pupil"
                  style={{ width: `${rightPx}px`, height: `${rightPx}px`, transition: rightRender.transition }} />
              </div>
              <span className="npi-eye-metric">{round1(rightRender.mm).toFixed(1)} mm</span>
              <span className="npi-eye-phase">{rightRender.phase}</span>
            </div>
          </div>

          <button type="button" onClick={simulateReflex} disabled={isAnimating}
            className="w-full px-3 h-9 min-h-[44px] sm:min-h-[40px] rounded-md text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
            {isAnimating ? 'Light reflex in progress…' : 'Simulate Light Reflex'}
          </button>

          <div className="space-y-3 pt-1">
            <Slider label="Neurological Pupil Index (NPi)" value={npi} min={0} max={5} step={0.1}
              display={npi.toFixed(1)} onChange={setNpi}
              scale={['0 (areflexic)', '3.0 (abnormal)', '5.0 (normal)']} />
            <Slider label="Constriction Velocity (CV)" value={cv} min={0} max={2.5} step={0.1}
              display={`${cv.toFixed(1)} mm/s`} onChange={setCv}
              scale={['0.0', '0.8 (ICP threshold)', '2.5']} />
            <Slider label="Pupil Size (initial)" value={size} min={1} max={8} step={0.5}
              display={`${size.toFixed(1)} mm`} onChange={setSize} />
            <Slider label="% Constriction" value={change} min={0} max={50} step={5}
              display={`${change}%`} onChange={setChange}
              scale={['0%', '10% (ICP threshold)', '50%']} />
            <Slider label="Inter-eye Asymmetry (NPi diff)" value={diff} min={0} max={2} step={0.1}
              display={diff.toFixed(1)} onChange={setDiff}
              scale={['0.0', '0.7 (mass effect)', '2.0']} />
          </div>
        </section>

        {/* ── Widget 2 · Clinical interpreter ── */}
        <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Clinical Interpretation</h4>
            <span className={cx('inline-flex items-center gap-1.5 text-2xs font-bold px-2 py-0.5 rounded-pill border', tone.chip)}>
              <span className={cx('inline-block w-2 h-2 rounded-full', tone.dot)} aria-hidden="true" />
              {result.status}
            </span>
          </div>

          {/* Risk meter */}
          <div>
            <div className="h-2.5 w-full rounded-pill bg-slate-100 overflow-hidden dark:bg-paper-2" role="img"
              aria-label={`Risk level ${result.riskPercent} percent — ${result.status}`}>
              <div className="h-full rounded-pill transition-all duration-300"
                style={{ width: `${result.riskPercent}%`, background: tone.bar }} />
            </div>
            <div className="flex justify-between text-2xs text-slate-500 mt-1 dark:text-mute">
              <span>Normal</span><span>Early</span><span>Severe</span><span>Herniation</span>
            </div>
          </div>

          <div className={cx('rounded-md border px-3 py-2 text-xs leading-relaxed', tone.chip)}>
            {result.summary}
          </div>

          <div>
            <p className="text-2xs uppercase tracking-wide font-semibold text-slate-500 mb-1 dark:text-mute">Actionable next steps</p>
            <ul className="space-y-1">
              {result.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-ink-2">
                  <span className={cx('mt-0.5 inline-block w-1.5 h-1.5 rounded-full shrink-0', tone.dot)} aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Midline-shift estimate */}
          <div className={cx('rounded-md border p-3', shift.highProbability ? TONE.gold.chip : 'bg-slate-50 border-line text-slate-700 dark:bg-paper-2 dark:text-ink-2')}>
            <p className="text-2xs uppercase tracking-wide font-semibold mb-1.5">
              Radiographic midline-shift estimate (from NPi diff {diff.toFixed(1)})
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-2xs text-slate-500 dark:text-mute">ICH · septum pellucidum</p>
                <p className="font-mono tabular-nums text-sm font-bold">{shift.ichShift.toFixed(1)} mm</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500 dark:text-mute">Ischemic · pineal gland</p>
                <p className="font-mono tabular-nums text-sm font-bold">{shift.strokeShift.toFixed(1)} mm</p>
              </div>
            </div>
            <p className="text-xs font-semibold mt-2">
              {shift.highProbability
                ? 'High probability of clinically significant shift (NPi diff ≥ 0.7).'
                : 'Low probability of clinically significant shift (NPi diff < 0.7).'}
            </p>
          </div>
        </section>
      </div>

      {/* ── Escalation reference cards ── */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Escalation reference — NPi action thresholds</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ESCALATION.map((e, i) => {
            const t = TONE[e.tone] || TONE.warn;
            return (
              <div key={i} className={cx('rounded-lg border p-3 flex items-start gap-3', t.chip)}>
                <span className="font-mono font-bold text-xs shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-white border border-line dark:bg-card">
                  {e.badge}
                </span>
                <div>
                  <p className="text-xs font-bold">{e.title}</p>
                  <p className="text-2xs leading-relaxed mt-0.5">{e.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Petrosino 2025 caveat (prominent) ── */}
      <section className="rounded-lg border-2 border-crit-300 bg-crit-50 p-3 dark:border-crit-800 dark:bg-crit-950">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-crit-500" aria-hidden="true" />
          <h4 className="text-sm font-bold text-crit-800 dark:text-crit-300">Key caveat — Petrosino 2025 (JAMA Neurol)</h4>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed mt-1.5 dark:text-ink">
          A secondary analysis of the ORANGE study (<strong>n = 318 with invasive ICP monitoring</strong>) found
          <strong> NO significant association between NPi and ICP</strong>. A <strong>normal NPi does NOT safely exclude
          elevated ICP</strong>, and <strong>pupillometry cannot replace invasive ICP monitoring</strong>. The CV / %-change
          ICP cut-points above (Giede-Jeppe 2021) should therefore be read as hypothesis-generating, not as a reliable
          rule-out for intracranial hypertension. NPi remains a strong <em>prognostic</em> and herniation-warning signal —
          but it is not a substitute for an ICP monitor.
        </p>
      </section>

      {/* ── Evidence base ── */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Evidence base — pupillometry / NPi</h4>
        <div className="space-y-2">
          {EVIDENCE.map((ev, i) => (
            <div key={i}
              className={cx('rounded-lg border p-3', ev.caveat ? 'border-crit-200 bg-crit-50 dark:border-crit-800 dark:bg-crit-950' : 'border-line bg-white dark:bg-card')}>
              <div className="flex items-center justify-between gap-2">
                <h5 className={cx('text-xs font-bold', ev.caveat ? 'text-crit-800 dark:text-crit-300' : 'text-slate-800 dark:text-ink')}>{ev.study}</h5>
                {ev.caveat && <span className="text-2xs font-bold uppercase tracking-wide text-crit-700 shrink-0 dark:text-crit-300">Limitation</span>}
              </div>
              <p className="text-2xs uppercase tracking-wide font-semibold text-slate-500 mt-0.5 dark:text-mute">{ev.cohort}</p>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed dark:text-ink-2">{ev.finding}</p>
            </div>
          ))}
        </div>
        <p className="text-2xs text-slate-500 dark:text-mute">
          Educational teaching tool — not a substitute for invasive monitoring or clinical judgment.
        </p>
      </section>
    </div>
  );
}

/* ── Slider sub-component (mirrors the EVD simulator) ──────────────────── */
function Slider({ label, value, min, max, step, display, onChange, scale }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1 dark:text-ink-2">
        <span>{label}</span>
        <span className="font-mono text-slate-600 dark:text-ink-2">{display}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-600 h-2 cursor-pointer"
        aria-label={label}
      />
      {scale && (
        <span className="flex justify-between text-2xs text-slate-500 mt-0.5 dark:text-mute">
          {scale.map((s, i) => <span key={i}>{s}</span>)}
        </span>
      )}
    </label>
  );
}

export default PupillometrySimulator;
