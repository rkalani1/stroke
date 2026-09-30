/**
 * Pupillometry evidence reference.
 * The interactive model and threshold-based action assistant are quarantined
 * following the 2026-09-30 clinical audit. Keep the exported names for callers,
 * but do not return an inferred diameter or clinical recommendations.
 */
import React from 'react';

const cx = (...p) => p.filter(Boolean).join(' ');

export function contralateralInitialSize() {
  return null;
}

export function interpretPupillometry() {
  return {
    status: 'INTERPRETATION UNAVAILABLE',
    tone: 'warn',
    summary: 'The pupil model and automatic interpretation are temporarily unavailable pending clinical review.',
    steps: []
  };
}

const EVIDENCE = [
  {
    study: 'Petrosino et al. — JAMA Neurol 2025;82(2):176-184 (PMID 39652324)',
    caveat: true,
    cohort: 'Secondary analysis of ORANGE, n = 318 with invasive ICP monitoring.',
    finding: 'No significant overall contemporaneous association between NPi and ICP. A normal NPi does NOT safely exclude elevated ICP. Pupillometry CANNOT replace invasive ICP monitoring.'
  },
  {
    study: 'ORANGE Study — Lancet Neurol 2023;22(10):925-933 (PMID 37652068)',
    cohort: '514 acute-brain-injury patients across 8 countries — 224 TBI, 139 aSAH, 151 ICH. No ischemic stroke.',
    finding: 'Abnormal NPi independently associated with poor 6-month outcome and in-hospital mortality (adjusted HR 5.58, 95% CI 3.92–7.95). NPi < 3.0 was an observational prognostic marker; the study does not establish a stand-alone treatment or withdrawal-of-support rule. Funding disclosure: ORANGE was funded by NeurOptics, the manufacturer of the pupillometer under study.'
  },
  {
    study: 'Du et al. — Ann Neurol 2025 (PMID 39825740)',
    cohort: 'Prospective single-center observational cohort of 71 patients with large MCA infarction.',
    finding: 'Ischemic-stroke evidence includes this prospective study; it is not entirely retrospective. Observational associations do not validate an automatic treatment threshold or an individualized prognosis.'
  },
  {
    study: 'Kim et al. — Front Neurol 2022;13:1046548 (PMID 36561299)',
    cohort: 'ICH vs ischemic-stroke midline-shift markers.',
    finding: 'Pilot study (53 patients, 74 CTs): no significant association between pupil reactivity and shift after adjustment for confounders; exploratory signal in ICH for septum-pellucidum shift vs NPi asymmetry (β = 0.11, p = 0.01). Ischemic: pineal-gland shift showed a trend toward association (p = 0.07), so treat it as hypothesis-generating rather than definitive. The abstract and main table differ slightly in the coefficient; no exact coefficient is reproduced here.'
  }
];

export function PupillometrySimulator() {
  return (
    <div className="npi-sim space-y-4">
      <section role="status" className="rounded-lg border border-line bg-slate-50 p-4 text-sm text-slate-700 dark:bg-paper-2 dark:text-ink-2">
        <h4 className="font-semibold">Pupillometry simulator temporarily unavailable</h4>
        <p className="mt-1">The pupil animation, automatic interpretation, and action thresholds are withheld pending clinical review. The evidence references below remain available.</p>
      </section>
      <p className="text-sm text-slate-600 dark:text-ink-2">
        A normal NPi does not exclude elevated intracranial pressure. Pupillometry cannot replace the neurological examination or indicated invasive monitoring.
      </p>
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-ink">Evidence base — pupillometry / NPi</h4>
        <div className="space-y-2">
          {EVIDENCE.map((ev) => (
            <div key={ev.study}
              className={cx('rounded-lg border p-3', ev.caveat ? 'border-crit-200 bg-crit-50 dark:border-crit-800 dark:bg-crit-950' : 'border-line bg-white dark:bg-card')}>
              <h5 className={cx('text-xs font-bold', ev.caveat ? 'text-crit-800 dark:text-crit-300' : 'text-slate-800 dark:text-ink')}>{ev.study}</h5>
              <p className="text-2xs uppercase tracking-wide font-semibold text-slate-600 mt-0.5 dark:text-mute">{ev.cohort}</p>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed dark:text-ink-2">{ev.finding}</p>
            </div>
          ))}
        </div>
        <p className="text-2xs text-slate-500 dark:text-mute">Evidence summaries are limited to the populations and outcomes described. <a className="underline" href="https://pubmed.ncbi.nlm.nih.gov/39825740/" target="_blank" rel="noopener noreferrer">Du 2025 primary abstract</a>.</p>
      </section>
    </div>
  );
}

export default PupillometrySimulator;
