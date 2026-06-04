/**
 * Bedside Simulator 1 of 4 — EVD & ICP Simulator.
 * Drop-in: src/simulators/EvdIcpSimulator.jsx
 *
 * A self-contained, dependency-free teaching simulator for external
 * ventricular drains (EVD) and intracranial-pressure (ICP) monitoring.
 *
 * Clinical model (values are load-bearing — see app build spec):
 *   • Pressure conversion: 1 cmH2O = 0.74 mmHg.
 *   • measuredICP reflects stopcock position, kinks/clots, transducer
 *     leveling error, and air-bubble dampening.
 *   • CPP = MAP − measuredICP.
 *   • Tiered ICP-crisis escalation (Tier 0 → Tier 3) keys off the TRUE
 *     mean ICP (the physiology), not the possibly-erroneous measurement.
 *   • Live ICP waveform (P1/P2/P3 morphology) reflects intracranial
 *     compliance — P2 > P1 ("rounded") in the low-compliance state.
 *
 * Styling: v7 tokens / Tailwind utilities only (cobalt accent, crit/warn/ok
 * semantics, slate neutrals). Canvas + SVG geometry use the v7 hexes via a
 * scoped <style> block; no dark-glass theme, no forbidden hue utilities.
 *
 * No print view, no localStorage, no institutional content.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

/* ── Physiology constants ─────────────────────────────────────────── */
const CMH2O_TO_MMHG = 0.74;

/* v7 palette (hex) for canvas/SVG drawing contexts where Tailwind
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
  slate500: '#64748B',
  slate200: '#E2E8F0',
  paper:  '#FBFAF6'
};

/* ── Scenario definitions ─────────────────────────────────────────── */
/* Each scenario seeds the patient state, shows a status line, and exposes
   a checklist plus dynamic resolve buttons. */
const SCENARIOS = {
  normal: {
    id: 'normal',
    label: 'Stable Stroke',
    tone: 'ok',
    state: { trueMeanICP: 12, brainCompliance: 3, evdHeight: 10, transducerOffset: 0, stopcockPosition: 0, isKinked: false, hasAirBubble: false, isClotted: false },
    status: 'Baseline Stroke: ICP 12 mmHg, normal compliance (P1 > P2 > P3), EVD open and draining at 10 cmH₂O.',
    checklist: [
      'Transducer leveled at the tragus (0.0 cm offset)',
      'Stopcock OPEN to patient and drip chamber',
      'Drip chamber height set to ordered level (10 cmH₂O)',
      'Waveform crisp and triphasic (P1 > P2 > P3)',
      'Assess pupils and GCS motor score hourly'
    ]
  },
  kinked: {
    id: 'kinked',
    label: 'Kinked Line',
    tone: 'crit',
    state: { trueMeanICP: 16, brainCompliance: 0, evdHeight: 10, transducerOffset: 0, stopcockPosition: 0, isKinked: true, hasAirBubble: false, isClotted: false },
    status: 'EVD tubing is KINKED — trace has flatlined and reads a falsely low ~2 mmHg. Patient line CSF fluctuation has ceased.',
    checklist: [
      'Identify flatline trace as mechanical artifact',
      'Trace tubing from patient head to manifold for kinks',
      'Optimize patient neck alignment midline',
      'Confirm stopcock is open to patient'
    ]
  },
  air: {
    id: 'air',
    label: 'Air Bubble',
    tone: 'warn',
    state: { trueMeanICP: 15, brainCompliance: 0, evdHeight: 10, transducerOffset: 0, stopcockPosition: 0, isKinked: false, hasAirBubble: true, isClotted: false },
    status: 'AIR BUBBLE in transducer — waveform is blunted (no defined peaks) and reading is offset.',
    checklist: [
      'Identify blunted/dampened waveform morphology',
      'Prepare sterile distal flush equipment',
      'Flush line distally (away from patient) to clear air bubble',
      'Re-level and zero transducer after bubble is gone'
    ]
  },
  overdrain: {
    id: 'overdrain',
    label: 'Over-drainage',
    tone: 'crit',
    state: { trueMeanICP: 12, brainCompliance: 3, evdHeight: 2, transducerOffset: 10, stopcockPosition: 0, isKinked: false, hasAirBubble: false, isClotted: false },
    status: 'OVER-DRAINAGE ALERT: bed raised without re-leveling (transducer 10 cm below tragus) and drip height set to 2. Falsely high measured ICP is driving excess drainage. Severe posture headache.',
    checklist: [
      'STEP 1 — Clamp the EVD immediately to halt drainage',
      'STEP 2 — Re-level transducer to the tragus (0 cm offset)',
      'STEP 3 — Adjust drip height back to ordered level (10 cmH₂O)',
      'Unclamp EVD and monitor output closely'
    ]
  },
  stiff: {
    id: 'stiff',
    label: 'Malignant MCA Swelling',
    tone: 'crit',
    state: { trueMeanICP: 26, brainCompliance: 1, evdHeight: 10, transducerOffset: 0, stopcockPosition: 2, isKinked: false, hasAirBubble: false, isClotted: false },
    status: 'MALIGNANT MCA SWELLING: ICP 26 mmHg, severe pressure crisis (P2 >> P1). Spontaneous decrease in GCS motor score of 1 point and sluggish asymmetric right pupil. EVD is closed.',
    checklist: [
      'Notify Stroke & Neurocritical Care Fellow / Attending STAT',
      'Open stopcock to drip to drain CSF immediately',
      'Prepare HTS bolus (3% HTS or 23.4% HTS via central line)',
      'Initiate emergent hyperventilation as short-term bridge',
      'STAT Neurosurgery consult for decompressive hemicraniectomy'
    ]
  }
};

/* ── Tier escalation pathway (renders 4 cards) ────────────────────── */
const TIERS = [
  {
    id: 0,
    name: 'TIER 0 · Baseline Neuroprotection',
    trigger: 'Always — applies to every monitored patient',
    items: [
      'Head of bed 30–45°, neck midline (optimize venous outflow)',
      'Isotonic fluids only — 0.9% NS; avoid hypotonic solutions',
      'Normothermia — target core temp < 37.8 °C',
      'Light sedation/analgesia (propofol / fentanyl) to limit surges',
      'Avoid corticosteroids in stroke (no benefit; increased risk)'
    ]
  },
  {
    id: 1,
    name: 'TIER 1 · Osmotherapy & EVD Drainage',
    trigger: 'ICP ≥ 20–22 mmHg sustained > 5 min',
    items: [
      'Drain 5–10 mL CSF, or continuous drainage at 10–15 cmH₂O',
      '3% hypertonic saline bolus 250–500 mL (Na⁺ target 145–155)',
      'OR 20% mannitol 0.5–1.0 g/kg',
      'HTS generally preferred in stroke to avoid diuresis-induced hypotension'
    ]
  },
  {
    id: 2,
    name: 'TIER 2 · Refractory Measures',
    trigger: 'ICP refractory to Tier 1',
    items: [
      '23.4% HTS 30 mL over 10 min — CENTRAL LINE ONLY',
      'Short-term hyperventilation, PaCO₂ 30–35 mmHg (bridge only)',
      'Escalate sedation (deepen, consider neuromuscular blockade)',
      'Continuous EEG to detect non-convulsive seizures'
    ]
  },
  {
    id: 3,
    name: 'TIER 3 · Salvage Therapy',
    trigger: 'ICP refractory to Tier 2',
    items: [
      'STAT neurosurgery — decompressive hemicraniectomy (supratentorial) or suboccipital craniectomy (cerebellar)',
      'Barbiturate coma (pentobarbital) to EEG burst-suppression',
      'Mild therapeutic hypothermia 32–34 °C'
    ]
  }
];

/* ── Waveform amplitude profiles by compliance ────────────────────── */
/* Each peak: amplitude, mean (μ, in cardiac-cycle fraction 0..1), σ width. */
const WAVE_PROFILES = {
  // brainCompliance 3 → high/normal compliance: classic P1 > P2 > P3
  3: [{ a: 18, mu: 0.6, sig: 0.08 }, { a: 11, mu: 1.2, sig: 0.15 }, { a: 6, mu: 1.9, sig: 0.2 }],
  // brainCompliance 2 → compromised: P2 >= P1
  2: [{ a: 14, mu: 0.6, sig: 0.08 }, { a: 16, mu: 1.2, sig: 0.15 }, { a: 7, mu: 1.9, sig: 0.2 }],
  // brainCompliance 1 → severe crisis: P2 >> P1
  1: [{ a: 10, mu: 0.6, sig: 0.08 }, { a: 28, mu: 1.2, sig: 0.15 }, { a: 5, mu: 1.9, sig: 0.2 }]
};

const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* Exported pure helpers — used by the UI and by unit tests. */
export function computeMeasuredICP({ trueMeanICP, transducerOffset, stopcockPosition, isKinked, isClotted, hasAirBubble, brainCompliance }) {
  let icp;
  if (stopcockPosition === 1) {
    // Closed to patient — transducer no longer sees the ventricle.
    icp = 0;
  } else if (isKinked || isClotted || brainCompliance === 0) {
    // Damped column reads a flat, falsely-low value.
    icp = 2;
  } else {
    icp = trueMeanICP + transducerOffset * CMH2O_TO_MMHG;
    if (hasAirBubble) icp += 1.5;
  }
  return round1(icp);
}

export function computeActiveTier(trueMeanICP, brainCompliance) {
  if (trueMeanICP >= 24 || brainCompliance === 1) return 3;
  if (trueMeanICP >= 22) return 2;
  if (trueMeanICP >= 20 || brainCompliance === 2) return 1;
  return 0;
}

export function computeComplianceBadge(measuredICP, brainCompliance) {
  if (measuredICP >= 22 || brainCompliance === 1) return { level: 'CRITICAL', tone: 'crit' };
  if (measuredICP >= 16 || brainCompliance === 0) return { level: 'COMPROMISED', tone: 'warn' };
  return { level: 'NORMAL', tone: 'ok' };
}

export function computeDripInterval({ trueMeanICP, evdHeight, transducerOffset, stopcockPosition, isKinked, isClotted, brainCompliance }) {
  // Driving pressure (mmHg) pushing CSF over the drip-chamber lip.
  const drivingPressure = trueMeanICP - (evdHeight + transducerOffset) * CMH2O_TO_MMHG;
  const drips = stopcockPosition === 0 && !isKinked && !isClotted && brainCompliance !== 0 && drivingPressure > 0;
  if (!drips) return { drips: false, intervalMs: null, drivingPressure };
  const intervalMs = clamp(3000 - drivingPressure * 100, 400, 3000);
  return { drips: true, intervalMs, drivingPressure };
}

/* Tone → Tailwind class fragments (v7 semantic tokens). */
const TONE = {
  ok:   { chip: 'bg-ok-50 text-ok-800 border-ok-200 dark:bg-ok-950 dark:text-ok-300 dark:border-ok-800',     dot: 'bg-ok-500',   text: 'text-ok-700 dark:text-ok-300' },
  warn: { chip: 'bg-warn-50 text-warn-800 border-warn-200 dark:bg-warn-950 dark:text-warn-300 dark:border-warn-800', dot: 'bg-warn-500', text: 'text-warn-700 dark:text-warn-300' },
  crit: { chip: 'bg-crit-50 text-crit-800 border-crit-200 dark:bg-crit-950 dark:text-crit-300 dark:border-crit-800', dot: 'bg-crit-500', text: 'text-crit-700 dark:text-crit-300' },
  neutral: { chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' }
};

/* ── Component ────────────────────────────────────────────────────── */
export function EvdIcpSimulator() {
  const [trueMeanICP, setTrueMeanICP] = useState(12);
  const [brainCompliance, setBrainCompliance] = useState(3); // 3: Normal, 2: Compromised, 1: Severe, 0: Dampened
  const [map, setMap] = useState(90);
  const [evdHeight, setEvdHeight] = useState(10);            // cmH2O above tragus
  const [transducerOffset, setTransducerOffset] = useState(0); // cm; + = below tragus
  const [stopcockPosition, setStopcockPosition] = useState(0); // 0 open-all · 1 closed-to-patient · 2 closed-to-drip
  const [isKinked, setIsKinked] = useState(false);
  const [hasAirBubble, setHasAirBubble] = useState(false);
  const [isClotted, setIsClotted] = useState(false);
  const [currentCase, setCurrentCase] = useState('normal');

  const canvasRef = useRef(null);

  /* ── Derived values ── */
  const measuredICP = useMemo(
    () => computeMeasuredICP({ trueMeanICP, transducerOffset, stopcockPosition, isKinked, isClotted, hasAirBubble, brainCompliance }),
    [trueMeanICP, transducerOffset, stopcockPosition, isKinked, isClotted, hasAirBubble, brainCompliance]
  );
  const cpp = round1(map - measuredICP);
  const badge = computeComplianceBadge(measuredICP, brainCompliance);
  const isFlatline = isKinked || isClotted || stopcockPosition === 1 || brainCompliance === 0;
  const displayLevel = isFlatline
    ? 'DAMPENED / BLOCKED'
    : (badge.level === 'CRITICAL' || brainCompliance === 1)
      ? 'SEVERE PRESSURE CRISIS'
      : (badge.level === 'COMPROMISED' || brainCompliance === 2)
        ? 'COMPROMISED COMPLIANCE'
        : 'NORMAL COMPLIANCE';
  const displayTone = isFlatline
    ? 'neutral'
    : (badge.level === 'CRITICAL' || brainCompliance === 1)
      ? 'crit'
      : (badge.level === 'COMPROMISED' || brainCompliance === 2)
        ? 'warn'
        : 'ok';
  const activeTier = computeActiveTier(trueMeanICP, brainCompliance);
  const levelingError = round1(transducerOffset * CMH2O_TO_MMHG);
  const drip = useMemo(
    () => computeDripInterval({ trueMeanICP, evdHeight, transducerOffset, stopcockPosition, isKinked, isClotted, brainCompliance }),
    [trueMeanICP, evdHeight, transducerOffset, stopcockPosition, isKinked, isClotted, brainCompliance]
  );

  /* ── Scenario loader ── */
  const loadScenario = (key) => {
    const sc = SCENARIOS[key];
    if (!sc) return;
    setCurrentCase(key);
    setTrueMeanICP(sc.state.trueMeanICP);
    setBrainCompliance(sc.state.brainCompliance);
    setEvdHeight(sc.state.evdHeight);
    setTransducerOffset(sc.state.transducerOffset);
    setStopcockPosition(sc.state.stopcockPosition);
    setIsKinked(sc.state.isKinked);
    setHasAirBubble(sc.state.hasAirBubble);
    setIsClotted(sc.state.isClotted);
  };

  /* Scenario resolution state ── whether the active case has been solved. */
  const scenario = SCENARIOS[currentCase] || SCENARIOS.normal;
  const stiffResolved = trueMeanICP < 15 && brainCompliance === 3 && stopcockPosition === 0;
  const isResolved = (() => {
    switch (currentCase) {
      case 'kinked': return !isKinked;
      case 'air': return !hasAirBubble;
      case 'overdrain': return transducerOffset === 0 && evdHeight >= 10 && stopcockPosition === 0;
      case 'stiff': return stiffResolved;
      default: return true;
    }
  })();

  const selectMorphology = (v) => {
    setBrainCompliance(v);
    if (v === 3) {
      setTrueMeanICP(12);
    } else if (v === 2) {
      setTrueMeanICP(17);
    } else if (v === 1) {
      setTrueMeanICP(25);
    } else if (v === 0) {
      setTrueMeanICP(2);
    }
  };

  /* ── ICP waveform canvas (rAF) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let scroll = 0;

    const profile = WAVE_PROFILES[brainCompliance] || WAVE_PROFILES[3];
    const damped = isFlatline || hasAirBubble || brainCompliance === 0;

    // Line color: gray when damped/flat, else by severity.
    let lineColor;
    if (damped) lineColor = C.slate400;
    else if (measuredICP >= 22 || brainCompliance === 1) lineColor = C.coral;
    else if (measuredICP >= 16 || brainCompliance === 2) lineColor = C.gold;
    else lineColor = C.green;

    // One cardiac cycle waveform value at phase t ∈ [0, 2.4].
    const cycle = (t) => {
      let v = 0;
      for (const p of profile) {
        v += p.a * Math.exp(-((t - p.mu) ** 2) / (2 * p.sig * p.sig));
      }
      return v;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Baseline (higher trueMeanICP pushes the trace UP on screen).
      const baseline = h * 0.8 - trueMeanICP * 1.8;

      // Faint mmHg gridlines.
      ctx.strokeStyle = 'rgba(148,163,184,0.18)';
      ctx.lineWidth = 1;
      for (let gy = 0; gy < h; gy += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const cycleLen = 2.4;            // phase units per cardiac cycle
      const pxPerCycle = 130;          // horizontal pixels per beat
      const respSwingAmpScale = isFlatline ? 0 : 1;

      for (let x = 0; x <= w; x++) {
        const globalPhase = (x + scroll) / pxPerCycle * cycleLen;
        const t = globalPhase % cycleLen;
        let amp;
        if (isFlatline && brainCompliance !== 0) {
          // Flatline = low noise around baseline.
          amp = (Math.random() - 0.5) * 1.2;
        } else {
          if (brainCompliance === 0 || hasAirBubble) {
            // Dampened wave
            amp = 3 * Math.sin(t * 2);
          } else {
            amp = cycle(t);
          }
        }
        // Respiratory swing rides on top.
        const resp = respSwingAmpScale * 4 * Math.sin((x + scroll) / 4);
        const y = baseline - amp - resp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // P1/P2/P3 peak labels (only when a real waveform is shown).
      if (!damped) {
        const labelFor = (mu) => {
          // Find the on-screen x of the first peak at this phase.
          const phasePx = mu / cycleLen * pxPerCycle;
          const x = ((phasePx - scroll) % pxPerCycle + pxPerCycle * 3) % pxPerCycle + pxPerCycle; // a stable mid-screen beat
          return x;
        };
        const peaks = [
          { name: 'P1', mu: 0.6, color: C.slate500 },
          { name: 'P2', mu: 1.2, color: brainCompliance === 1 ? C.coral : brainCompliance === 2 ? C.gold : C.slate500 },
          { name: 'P3', mu: 1.9, color: C.slate500 }
        ];
        ctx.font = '700 11px ui-monospace, monospace';
        for (const pk of peaks) {
          const x = labelFor(pk.mu);
          const y = baseline - cycle(pk.mu) - 8;
          ctx.fillStyle = pk.color;
          ctx.fillText(pk.name, x - 7, y);
        }
      }

      scroll += 1.4;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [brainCompliance, trueMeanICP, measuredICP, isFlatline, hasAirBubble]);

  /* ── EVD SVG geometry ── */
  const tragusY = 150;                          // reference line (foramen of Monro)
  const transducerY = tragusY + transducerOffset * 3; // moves with leveling
  // EVD drip-chamber bracket: higher ordered height sits higher on screen.
  const dripTopY = 60 - (evdHeight - 10) * 4;
  const dripBottomY = dripTopY + 70;

  // Stopcock dial rotation by position (3 handles).
  const stopcockAngle = { 0: 0, 1: 120, 2: 240 }[stopcockPosition] || 0;
  const stopcockLabel = { 0: 'OPEN — patient + drip', 1: 'CLOSED to patient', 2: 'CLOSED to drip' }[stopcockPosition];

  return (
    <div className="evd-sim space-y-4">
      <style>{`
        .evd-sim .evd-canvas {
          width: 100%;
          height: 180px;
          display: block;
          background: ${C.ink};
          border-radius: 8px;
        }
        @keyframes evd-drop-fall {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(46px); opacity: 0.15; }
        }
        .evd-drop { transform-box: fill-box; }
        .evd-drop.dripping {
          animation: evd-drop-fall var(--evd-drip-ms, 1500ms) linear infinite;
        }
        .evd-stopcock-dial { transition: transform 220ms ease; }
        .evd-transducer-group { transition: transform 260ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .evd-drop.dripping { animation: none; opacity: 0.6; }
        }
      `}</style>

      {/* Header readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Readout label="Measured ICP" value={`${measuredICP}`} unit="mmHg" tone={displayTone} />
        <Readout label="True mean ICP" value={`${trueMeanICP}`} unit="mmHg" tone="neutral" hint="ground truth" />
        <Readout label="CPP" value={`${cpp}`} unit="mmHg" tone={cpp < 60 ? 'crit' : cpp < 70 ? 'warn' : 'ok'} />
        <Readout label="MAP" value={`${map}`} unit="mmHg" tone="neutral" />
      </div>

      {/* Compliance badge */}
      <div className={cx('flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold', TONE[displayTone].chip)}>
        <span className={cx('inline-block w-2.5 h-2.5 rounded-full', TONE[displayTone].dot)} aria-hidden="true" />
        Compliance status: {displayLevel}
        {levelingError !== 0 && (
          <span className="ml-auto font-mono text-xs font-normal">
            Leveling error {levelingError > 0 ? '+' : ''}{levelingError} mmHg
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Waveform panel */}
        <section className="bg-white border border-line rounded-lg p-3 dark:bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-ink">ICP Waveform</h3>
            <span className="font-mono text-2xs text-slate-500 dark:text-mute">P1 percussion · P2 tidal · P3 dicrotic</span>
          </div>
          <canvas ref={canvasRef} width={520} height={180} className="evd-canvas" role="img"
            aria-label={`ICP waveform; ${isFlatline ? 'damped flatline' : displayLevel.toLowerCase()}, mean ICP ${measuredICP} millimeters mercury`} />
          <p className="mt-2 text-xs text-slate-600 dark:text-ink-2">
            {isFlatline && brainCompliance !== 0
              ? 'Damped / flat trace — no pulsatile signal (check stopcock, kinks, clots).'
              : brainCompliance === 0
                ? 'Dampened waveform morphology: blunted wave without distinct P1/P2/P3 peaks (check for air bubble/transducer damping).'
                : brainCompliance === 1
                  ? 'Severe pressure crisis morphology: P2 dominates P1 dramatically with high pulse amplitude — impending herniation risk.'
                  : brainCompliance === 2
                    ? 'Compromised compliance morphology: P2 is equal to or taller than P1 — early warning sign of exhausted buffers.'
                    : 'Normal triphasic morphology: P1 > P2 > P3.'}
          </p>
        </section>

        {/* EVD apparatus SVG */}
        <section className="bg-white border border-line rounded-lg p-3 dark:bg-card">
          <h4 className="text-sm font-semibold text-slate-800 mb-2 dark:text-ink">EVD Apparatus &amp; Leveling</h4>
          <svg viewBox="0 0 320 240" className="w-full h-auto" role="img"
            aria-label={`External ventricular drain. Stopcock ${stopcockLabel}. Drip chamber at ${evdHeight} centimeters water. ${drip.drips ? 'Draining' : 'Not draining'}.`}>
            {/* Drip chamber column */}
            <rect x="36" y={dripTopY} width="28" height={dripBottomY - dripTopY} rx="6"
              fill="none" stroke={C.teal} strokeWidth="2" />
            {/* Animated CSF drop */}
            <circle
              className={cx('evd-drop', drip.drips && 'dripping')}
              cx="50" cy={dripTopY + 8} r="3.5" fill={C.teal}
              style={{ '--evd-drip-ms': drip.intervalMs ? `${Math.round(drip.intervalMs)}ms` : '1500ms' }}
            />
            {/* Drip-height scale label */}
            <text x="70" y={dripTopY + 12} fontSize="10" fill={C.slate500} fontFamily="ui-monospace, monospace">
              {evdHeight} cmH₂O
            </text>
            <line x1="36" y1={dripBottomY} x2="64" y2={dripBottomY} stroke={C.slate300} strokeWidth="1" />

            {/* Tubing from drip down to stopcock */}
            <path d={`M50 ${dripBottomY} L50 175 L150 175`} fill="none"
              stroke={isKinked ? C.coral : C.teal} strokeWidth="2"
              strokeDasharray={isKinked ? '4 4' : 'none'} />
            {isKinked && <text x="70" y="170" fontSize="9" fill={C.coral} fontWeight="700">KINK</text>}
            {hasAirBubble && <circle cx="100" cy="175" r="4" fill="none" stroke={C.slate400} strokeWidth="1.5" />}
            {isClotted && <text x="110" y="170" fontSize="9" fill={C.coral} fontWeight="700">CLOT</text>}

            {/* Stopcock dial (3 handles, rotates with position) */}
            <g transform="translate(150,175)">
              <circle r="13" fill="#fff" stroke={C.tealDk} strokeWidth="2" />
              <g className="evd-stopcock-dial" transform={`rotate(${stopcockAngle})`}>
                <rect x="-2.5" y="-16" width="5" height="12" rx="2" fill={C.tealDk} />
                <rect x="-16" y="-2.5" width="12" height="5" rx="2" fill={C.tealDk} />
                <rect x="4" y="-2.5" width="12" height="5" rx="2" fill={C.tealDk} />
              </g>
            </g>
            <text x="150" y="206" fontSize="8.5" fill={C.slate500} textAnchor="middle" fontFamily="ui-monospace, monospace">
              {stopcockLabel}
            </text>

            {/* Tragus reference line + dot */}
            <line x1="180" y1={tragusY} x2="312" y2={tragusY} stroke={C.coral} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="300" cy={tragusY} r="4" fill={C.coral} />
            <text x="312" y={tragusY - 13} fontSize="9" fill={C.coral} fontWeight="700" textAnchor="end">TRAGUS (foramen of Monro)</text>

            {/* Transducer / stopcock group — moves with leveling */}
            <g className="evd-transducer-group" transform={`translate(0,${transducerY - tragusY})`}>
              <line x1="150" y1="175" x2="220" y2={tragusY} stroke={C.teal} strokeWidth="2" />
              <rect x="216" y={tragusY - 9} width="34" height="18" rx="3" fill="#fff" stroke={C.tealDk} strokeWidth="2" />
              <text x="233" y={tragusY + 4} fontSize="8" fill={C.tealDk} textAnchor="middle" fontFamily="ui-monospace, monospace">XDCR</text>
            </g>
            {transducerOffset !== 0 && (
              <text x="312" y="226" fontSize="9" fill={C.coral} textAnchor="end" fontWeight="700">
                {levelingError > 0 ? '+' : ''}{levelingError} mmHg error
              </text>
            )}
          </svg>
          <p className="mt-1 text-xs text-slate-600 dark:text-ink-2">
            {transducerOffset === 0
              ? 'Transducer level with the tragus — no leveling error.'
              : `Transducer ${Math.abs(transducerOffset)} cm ${transducerOffset > 0 ? 'BELOW' : 'ABOVE'} the tragus → reads ${levelingError > 0 ? 'falsely high' : 'falsely low'} by ${Math.abs(levelingError)} mmHg.`}
          </p>
        </section>
      </div>

      {/* Controls */}
      <section className="bg-slate-50 border border-line rounded-lg p-3 space-y-3 dark:bg-paper-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Controls</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Waveform Selector button-group */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-700 mb-1.5 dark:text-ink-2">ICP Waveform Morphology</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => selectMorphology(3)}
                className={cx('px-2 py-1 text-2xs font-semibold rounded border text-center transition-all',
                  brainCompliance === 3 ? 'bg-cobalt-600 text-white border-cobalt-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-card dark:border-slate-800 dark:text-ink-2')}>
                Normal compliance
              </button>
              <button type="button" onClick={() => selectMorphology(2)}
                className={cx('px-2 py-1 text-2xs font-semibold rounded border text-center transition-all',
                  brainCompliance === 2 ? 'bg-cobalt-600 text-white border-cobalt-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-card dark:border-slate-800 dark:text-ink-2')}>
                Compromised compliance
              </button>
              <button type="button" onClick={() => selectMorphology(1)}
                className={cx('px-2 py-1 text-2xs font-semibold rounded border text-center transition-all',
                  brainCompliance === 1 ? 'bg-cobalt-600 text-white border-cobalt-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-card dark:border-slate-800 dark:text-ink-2')}>
                Severe pressure crisis
              </button>
              <button type="button" onClick={() => selectMorphology(0)}
                className={cx('px-2 py-1 text-2xs font-semibold rounded border text-center transition-all',
                  brainCompliance === 0 ? 'bg-cobalt-600 text-white border-cobalt-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-card dark:border-slate-800 dark:text-ink-2')}>
                Dampened / Blocked
              </button>
            </div>
          </div>

          <Slider label="MAP" value={map} min={50} max={130} step={5} display={`${map} mmHg`}
            onChange={(v) => setMap(v)} />
          <Slider label="True mean ICP" value={trueMeanICP} min={0} max={40} step={1} display={`${trueMeanICP} mmHg`}
            onChange={(v) => setTrueMeanICP(v)} />
          <Slider label="EVD drip height" value={evdHeight} min={-5} max={25} step={1} display={`${evdHeight} cmH₂O`}
            onChange={(v) => setEvdHeight(v)} />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => setStopcockPosition((p) => (p + 1) % 3)}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-cobalt-600 text-white hover:bg-cobalt-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
            Cycle stopcock → <span className="font-normal">{stopcockLabel}</span>
          </button>
          <button type="button" onClick={() => setTransducerOffset((o) => clamp(o + 5, -15, 15))}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:bg-overlay dark:text-ink dark:hover:bg-overlay">
            Lower bed (+5 cm)
          </button>
          <button type="button" onClick={() => setTransducerOffset((o) => clamp(o - 5, -15, 15))}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:bg-overlay dark:text-ink dark:hover:bg-overlay">
            Raise bed (−5 cm)
          </button>
          <button type="button" onClick={() => setTransducerOffset(0)}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-ok-600 text-white hover:bg-ok-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
            Re-level transducer
          </button>
        </div>
      </section>

      {/* Scenarios */}
      <section className="bg-white border border-line rounded-lg p-3 space-y-3 dark:bg-card">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Scenarios</h4>
          <span className={cx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-pill border',
            isResolved ? TONE.ok.chip : TONE[scenario.tone].chip)}>
            {isResolved ? 'RESOLVED' : 'ACTIVE'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.values(SCENARIOS).map((sc) => (
            <button key={sc.id} type="button" onClick={() => loadScenario(sc.id)}
              className={cx('px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500',
                currentCase === sc.id ? 'bg-cobalt-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-paper-2 dark:text-ink-2 dark:hover:bg-overlay')}>
              {sc.label}
            </button>
          ))}
        </div>

        {/* Status line */}
        <div className={cx('rounded-md border px-3 py-2 text-sm', TONE[scenario.tone].chip)}>
          {scenario.status}
        </div>

        {/* Checklist */}
        <ul className="space-y-1">
          {scenario.checklist.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-ink-2">
              <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-cobalt-500 shrink-0" aria-hidden="true" />
              <span>{c}</span>
            </li>
          ))}
        </ul>

        {/* Dynamic resolve buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {currentCase === 'kinked' && (
            <button type="button" onClick={() => { setIsKinked(false); setBrainCompliance(3); }} disabled={!isKinked}
              className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-ok-600 text-white hover:bg-ok-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
              Straighten tubing
            </button>
          )}
          {currentCase === 'air' && (
            <button type="button" onClick={() => { setHasAirBubble(false); setBrainCompliance(3); }} disabled={!hasAirBubble}
              className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-ok-600 text-white hover:bg-ok-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
              Flush the line
            </button>
          )}
          {currentCase === 'overdrain' && (
            <>
              <button type="button" onClick={() => setStopcockPosition(1)}
                className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-warn-600 text-white hover:bg-warn-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
                Step 1 · Clamp EVD
              </button>
              <button type="button" onClick={() => { setTransducerOffset(0); setEvdHeight(10); setStopcockPosition(0); }}
                className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-ok-600 text-white hover:bg-ok-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
                Step 2 · Re-level &amp; resume
              </button>
            </>
          )}
          {currentCase === 'stiff' && (
            <>
              <button type="button" onClick={() => { setStopcockPosition(0); setTrueMeanICP(20); }}
                className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-cobalt-600 text-white hover:bg-cobalt-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
                1. Open EVD (Drain CSF)
              </button>
              <button type="button" onClick={() => { setTrueMeanICP(12); setBrainCompliance(3); }}
                className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-cobalt-600 text-white hover:bg-cobalt-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500">
                2. Administer HTS Osmotherapy
              </button>
            </>
          )}
          <button type="button" onClick={() => loadScenario('normal')}
            className="px-3 h-9 min-h-[44px] sm:min-h-0 rounded-md text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 dark:bg-overlay dark:text-ink dark:hover:bg-overlay">
            Reset / Resolve
          </button>
        </div>
      </section>

      {/* Critical Neuroworsening & Herniation Protocol */}
      <section className="bg-white border border-line rounded-lg overflow-hidden dark:bg-card">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 border-b border-blue-800">
          <h4 className="text-sm font-bold text-white uppercase tracking-wide">Critical Neuroworsening &amp; Herniation Protocol</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-600 bg-blue-50/5 dark:bg-blue-950/10 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-bold font-header">
                Critical Neuroworsening Criteria
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-ink">A serious deterioration in clinical neurologic status such as:</p>
                <ul className="list-disc pl-4 text-2xs text-slate-600 dark:text-ink-2 space-y-1">
                  <li>Spontaneous GCS motor score decrease of <strong className="text-red-500 font-bold">&ge; 1 points</strong> (compared with previous examination)</li>
                  <li>New decrease in pupillary reactivity</li>
                  <li>New pupillary asymmetry or bilateral mydriasis</li>
                  <li>New focal motor deficit</li>
                  <li>Herniation syndrome or Cushing's Triad which requires an immediate physician response</li>
                </ul>
              </div>
            </div>
            <div className="border border-blue-600 bg-blue-50/5 dark:bg-blue-950/10 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-bold font-header">
                Response to Critical Neuroworsening
              </div>
              <div className="p-3 space-y-2">
                <ul className="list-disc pl-4 text-2xs text-slate-600 dark:text-ink-2 space-y-1">
                  <li>Emergent evaluation to identify possible cause* of neuroworsening</li>
                  <li><strong>If herniation is suspected, initiate empiric treatment:</strong>
                    <ul className="list-[square] pl-4 mt-1 text-red-400 font-medium">
                      <li><strong>hyperventilation**</strong></li>
                      <li><strong>bolus of hypertonic solution</strong></li>
                    </ul>
                  </li>
                  <li>Consider emergent imaging or other testing</li>
                  <li>Rapid escalation of treatment</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-3xs text-slate-500 dark:text-mute space-y-1">
            <p><strong>* Possible causes of neuroworsening include:</strong> expanding intracranial mass lesion, cerebral edema, elevated ICP, stroke, electrolyte or other metabolic disturbance, medical comorbidity, medication effect, impaired renal/hepatic function, systemic hypotension, seizure/post-ictal, hypoxemia/tissue hypoxia, CNS infection, sepsis/infection, substance withdrawal, dehydration, hyper/hypothermia.</p>
            <p className="text-red-400 font-semibold mt-1">** the hyperventilation PaCO₂ limit of 30 mmHg/4.0 kPa does not apply here</p>
          </div>
        </div>
      </section>

      {/* Stroke Osmotherapy Dosing Guide */}
      <section className="bg-white border border-line rounded-lg p-3 dark:bg-card">
        <h4 className="text-sm font-semibold text-slate-800 mb-2 dark:text-ink">Stroke Osmotherapy Dosing Guide</h4>
        <div className="overflow-x-auto rounded border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-2xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 dark:bg-card-border dark:border-slate-800 text-slate-700 dark:text-ink font-semibold">
                <th className="p-2">Agent</th>
                <th className="p-2">Standard Dose</th>
                <th className="p-2">Administration &amp; Access</th>
                <th className="p-2">Precautions &amp; Limits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-ink-2">
              <tr>
                <td className="p-2 font-bold text-slate-800 dark:text-ink">3% HTS</td>
                <td className="p-2">250–500 mL bolus over 15–30 min</td>
                <td className="p-2">Peripheral line acceptable for acute boluses. Central line preferred for continuous infusions (30–100 mL/h).</td>
                <td className="p-2">Target Na 145–155 mEq/L. Stop if Na &gt; 155 or Osm &gt; 360. Check Na/Osm q4-6h.</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-800 dark:text-ink">23.4% HTS</td>
                <td className="p-2">30 mL bolus over 10–20 min</td>
                <td className="p-2"><strong>CENTRAL LINE ONLY</strong>. Extreme peripheral sclerosing hazard.</td>
                <td className="p-2">Emergency herniation rescue. Measure Na/Osm 1h post-bolus. Hold if Na &gt; 155.</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-800 dark:text-ink">20% Mannitol</td>
                <td className="p-2">0.5–1.0 g/kg bolus over 20–30 min</td>
                <td className="p-2">Peripheral line acceptable. <strong>Must use inline filter</strong> (crystallization hazard).</td>
                <td className="p-2">Hold if serum Osm &gt; 320 mOsm/kg or Osm Gap &gt; 55. Avoid if hypovolemic.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded p-2.5">
          <p className="text-3xs text-amber-600 dark:text-amber-400 leading-normal">
            <strong>⚠️ Stroke MAP Precaution:</strong> Mannitol acts as an osmotic diuretic which can trigger systemic hypotension. In acute stroke, penumbral perfusion is pressure-dependent. Hypotension drops MAP, reducing Cerebral Perfusion Pressure (CPP = MAP - ICP) and expanding the infarct. Hypertonic saline (HTS) is generally preferred to expand volume and preserve blood pressure while lowering ICP.
          </p>
        </div>
      </section>

      {/* Day-to-Day EVD & ICP Management in Stroke */}
      <section className="bg-white border border-line rounded-lg p-3 dark:bg-card">
        <h4 className="text-sm font-semibold text-slate-800 mb-2 dark:text-ink">Day-to-Day EVD &amp; ICP Management in Stroke</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50/50 dark:bg-card-border/20 border border-slate-100 dark:border-slate-800 rounded p-3 space-y-1.5">
            <h5 className="text-xs font-bold text-slate-800 dark:text-ink">🧠 EVD Mechanics &amp; Use Cases</h5>
            <p className="text-2xs text-slate-600 dark:text-ink-2 leading-relaxed">
              An EVD drainage system utilizes gravity to drain CSF. The drip chamber height sets the pressure threshold (in cmH₂O). Flow only occurs when ventricular pressure exceeds this threshold. Lower settings drain more readily; higher settings drain less unless ICP exceeds the higher threshold.
            </p>
            <p className="text-2xs text-slate-600 dark:text-ink-2 leading-relaxed font-semibold mt-1">
              Primary Stroke Use Cases:
            </p>
            <ul className="list-disc pl-4 text-2xs text-slate-600 dark:text-ink-2 space-y-0.5">
              <li><strong>ICH with IVH</strong>: Intraventricular blood obstructing CSF pathways, causing obstructive hydrocephalus.</li>
              <li><strong>Cerebellar Stroke</strong>: Large edema compressing the 4th ventricle, causing acute hydrocephalus.</li>
            </ul>
          </div>
          <div className="bg-slate-50/50 dark:bg-card-border/20 border border-slate-100 dark:border-slate-800 rounded p-3 space-y-1.5">
            <h5 className="text-xs font-bold text-slate-800 dark:text-ink">📋 Daily Safety Rounds Checklist</h5>
            <p className="text-2xs text-slate-600 dark:text-ink-2 leading-relaxed">
              Ensure these steps are checked on every nursing shift and physician round:
            </p>
            <ul className="list-disc pl-4 text-2xs text-slate-600 dark:text-ink-2 space-y-1">
              <li><strong>Verify Leveling:</strong> Transducer must align to the tragus (external auditory meatus) q1-2h and after ANY bed movement.</li>
              <li><strong>Tubing Oscillation:</strong> Ensure CSF column is oscillating with patient breathing/heartbeat. If static, check for obstruction.</li>
              <li><strong>Transducer Zeroing:</strong> Zero the transducer to atmosphere at target height.</li>
              <li><strong>Drainage Safety:</strong> Clamp EVD during mobilization, coughing, or suctioning to prevent postural collapse.</li>
            </ul>
          </div>
          <div className="bg-slate-50/50 dark:bg-card-border/20 border border-slate-100 dark:border-slate-800 rounded p-3 space-y-1.5">
            <h5 className="text-xs font-bold text-slate-800 dark:text-ink">⏱️ EVD Weaning &amp; Clamping Trials</h5>
            <p className="text-2xs text-slate-600 dark:text-ink-2 leading-relaxed">
              Weaning checks if the patient can re-absorb CSF naturally without EVD drainage:
            </p>
            <ul className="list-disc pl-4 text-2xs text-slate-600 dark:text-ink-2 space-y-1">
              <li><strong>Step-up protocol:</strong> Gradually raise the EVD threshold (e.g. from 10 to 15, then 20 cmH₂O) q24h, making drainage less permissive.</li>
              <li><strong>Clamping trial:</strong> Clamp the EVD for 24 hours. Monitor q1h for symptoms (headache, somnolence, lethargy) or ICP spikes.</li>
              <li><strong>CT Confirmation:</strong> Obtain head CT at 24h to verify no ventriculomegaly or midline shift before EVD pull.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tier escalation pathway */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">ICP-Crisis Escalation Pathway</h4>
          <span className="text-xs font-semibold text-cobalt-700 dark:text-cobalt-300">
            Active: Tier {activeTier} (true ICP {trueMeanICP} mmHg)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TIERS.map((tier) => {
            const active = tier.id === activeTier;
            return (
              <div key={tier.id}
                className={cx('rounded-lg border p-3 transition-colors',
                  active ? 'border-cobalt-500 bg-cobalt-50 ring-2 ring-cobalt-500 dark:bg-cobalt-900' : 'border-line bg-white dark:bg-card')}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className={cx('text-sm font-bold', active ? 'text-cobalt-800 dark:text-cobalt-300' : 'text-slate-800 dark:text-ink')}>{tier.name}</h5>
                  {active && <span className="text-2xs font-bold uppercase tracking-wide text-cobalt-700 dark:text-cobalt-300">Active</span>}
                </div>
                <p className="text-2xs uppercase tracking-wide font-semibold text-slate-600 mb-1.5 dark:text-mute">{tier.trigger}</p>
                <ul className="space-y-1">
                  {tier.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-ink-2">
                      <span className={cx('mt-0.5 inline-block w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-cobalt-500' : 'bg-slate-300')} aria-hidden="true" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ── Small presentational sub-components ──────────────────────────── */
function Readout({ label, value, unit, tone, hint }) {
  const toneText = tone === 'crit' ? 'text-crit-700 dark:text-crit-300' : tone === 'warn' ? 'text-warn-700 dark:text-warn-300' : tone === 'ok' ? 'text-ok-700 dark:text-ok-300' : 'text-slate-900 dark:text-ink';
  return (
    <div className="bg-white border border-line rounded-md px-3 py-2 dark:bg-card">
      <p className="text-2xs uppercase tracking-wide font-semibold text-slate-500 dark:text-mute">{label}</p>
      <p className={cx('font-mono tabular-nums text-lg font-bold leading-tight', toneText)}>
        {value}<span className="text-xs font-normal text-slate-500 ml-1 dark:text-mute">{unit}</span>
      </p>
      {hint && <p className="text-2xs text-slate-500 dark:text-mute">{hint}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1 dark:text-ink-2">
        <span>{label}</span>
        <span className="font-mono text-slate-600 dark:text-ink-2">{display}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cobalt-600 h-2 cursor-pointer"
        aria-label={label}
      />
    </label>
  );
}

export default EvdIcpSimulator;
