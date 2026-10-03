import React from 'react';
import { encounterTiming, encounterNihss } from '../workspace-state.js';
import { numericInput, reviewedGcs } from '../encounter-clinical-review.js';
import { calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed } from '../calculators.js';
import { useCurrentTime } from '../use-current-time.js';

const SHORT_DX = { ischemic: 'Ischemic', ich: 'ICH', sah: 'SAH', tia: 'TIA', cvt: 'CVT', mimic: 'Mimic', other: 'Other' };
const pad = value => String(value).padStart(2, '0');
export const hoursMinutes = ms => { const minutes = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`; };

// Read-only projection of the current Encounter for the sticky case bar.
// It never decides eligibility: window references are elapsed-time arithmetic.
export function caseSummary(state, nowMs) {
  const n = state.note, timing = encounterTiming(n, nowMs), exam = encounterNihss(state);
  const acuteIschemic = state.context === 'acute' && n.diagnosisCategory === 'ischemic';
  const age = numericInput(n.age, { min: 0, max: 120 });
  const weight = numericInput(n.weight, { min: Number.MIN_VALUE, max: 350 });
  const [sbp, dbp] = String(n.presentingBP || '').split('/').map(value => numericInput(value, { min: 1, max: 400 }));
  const glucose = numericInput(n.glucose, { min: 1 });
  let window = null;
  if (timing.invalid) window = { text: 'Check time', tone: 'critical' };
  else if (timing.clock) {
    const elapsed = timing.clock.elapsedMinutes * 60000;
    if (n.lkwUnknown) window = { text: 'since discovery', tone: 'neutral' };
    else if (acuteIschemic && !timing.clock.toLyticClosed) window = { text: `4.5 h in ${hoursMinutes(timing.clock.toLyticMs)}`, tone: timing.clock.toLyticMs <= 30 * 60000 ? 'caution' : 'open' };
    else if (acuteIschemic && !timing.clock.toLateEvtClosed) window = { text: `24 h in ${hoursMinutes(timing.clock.toLateEvtMs)}`, tone: 'neutral' };
    else if (elapsed >= 24 * 3600000) window = { text: '>24 h', tone: 'neutral' };
  }
  const dose = acuteIschemic && weight !== null ? (state.drug === 'Alteplase' ? calculateAlteplaseDoseReviewed(n.weight) : calculateTNKDoseReviewed(n.weight, state.drug === 'TNK' ? state.doseAuthority : 'guideline')) : null;
  const gcs = ['ich', 'sah', 'cvt'].includes(n.diagnosisCategory) ? reviewedGcs(state.gcs) : null;
  return {
    dx: SHORT_DX[n.diagnosisCategory] || '', dxKey: n.diagnosisCategory || '',
    demographics: [age !== null ? String(age) : '', n.sex === 'M' || n.sex === 'F' ? n.sex : ''].filter(Boolean).join(' '),
    timeLabel: n.lkwUnknown ? 'Discovery' : 'LKW',
    elapsed: timing.clock ? hoursMinutes(timing.clock.elapsedMinutes * 60000) : timing.invalid ? '!' : n.lkwUnknown && !timing.timestamp ? 'unknown' : '',
    window,
    nihss: exam.complete ? String(exam.total) : exam.source === 'itemized' && exam.count ? `${exam.partial}…` : '',
    nihssPartial: !exam.complete && exam.source === 'itemized' && exam.count > 0,
    gcs: gcs === null ? '' : String(gcs),
    bp: sbp !== null && dbp !== null ? `${sbp}/${dbp}` : '',
    bpHigh: acuteIschemic && sbp !== null && dbp !== null && (sbp > 185 || dbp > 110),
    glucose: glucose === null ? '' : String(glucose),
    glucoseFlag: glucose !== null && (glucose < 50 || glucose > 400),
    weight: weight === null ? '' : `${Math.round(weight * 10) / 10}`,
    dose: dose ? state.drug === 'Alteplase' ? { label: 'tPA', value: `${dose.totalDose} mg`, detail: `${dose.bolus} bolus` } : { label: 'TNK', value: `${dose.calculatedDose} mg`, detail: dose.volume } : null,
    anticoagulant: n.lastDOACType && n.lastDOACType !== 'none' ? n.lastDOACType : '',
    hasData: Boolean(n.diagnosisCategory || age !== null || timing.timestamp || n.lkwUnknown || exam.complete || exam.count || sbp !== null || glucose !== null || weight !== null)
  };
}

function Item({ label, short, value, detail, flag, title }) {
  return <div className="case-bar__item" data-empty={value ? undefined : ''} data-flag={flag || undefined} title={title}>
    <span className="case-bar__label">{short ? <><span className="case-bar__label-long">{label}</span><span className="case-bar__label-short" aria-hidden="true">{short}</span></> : label}</span>
    <span className="case-bar__value">{value || '—'}{detail && <small>{detail}</small>}</span>
  </div>;
}

export default function CaseBar({ state, documentLabel, blocked, onCopy, copyStatus }) {
  const [now] = useCurrentTime(true);
  const c = caseSummary(state, now);
  if (!c.hasData) return null;
  const acuteIschemic = state.context === 'acute' && state.note.diagnosisCategory === 'ischemic';
  return <section className="case-bar" aria-label="Current encounter">
    <a className="case-bar__dx" data-dx={c.dxKey || undefined} href="#/encounter" aria-label="Open Encounter">{c.dx || 'No diagnosis'}{c.demographics && <span>· {c.demographics}</span>}</a>
    <div className="case-bar__time"><Item label={c.timeLabel} value={c.elapsed} detail={c.window?.text} flag={c.window && c.window.tone !== 'neutral' && c.window.tone !== 'open' ? c.window.tone : undefined} title="Elapsed time (h:mm)" /></div>
    <div className="case-bar__items">
      {c.gcs ? <Item label="GCS" value={c.gcs} /> : null}
      <Item label="NIHSS" value={c.nihss} flag={c.nihssPartial ? 'partial' : undefined} title={c.nihssPartial ? 'Partial itemized sum' : undefined} />
      <Item label="BP" value={c.bp} flag={c.bpHigh ? 'caution' : undefined} title={c.bpHigh ? 'Above 185/110' : undefined} />
      <Item label="Glucose" short="Glu" value={c.glucose} flag={c.glucoseFlag ? 'caution' : undefined} />
      <Item label="Weight" short="Wt" value={c.weight && `${c.weight} kg`} />
      {acuteIschemic && <Item label={c.dose?.label || 'Dose'} value={c.dose?.value} detail={c.dose?.detail} title="Dose arithmetic only; not an eligibility decision" />}
      {c.anticoagulant && <Item label="Anticoag" value={c.anticoagulant} flag="caution" />}
    </div>
    <div className="case-bar__actions">
      {acuteIschemic && <a className="case-bar__link" href="#/protocols/ischemic/bp">BP targets</a>}
      {(state.note.diagnosisCategory === 'ich' || c.anticoagulant) && <a className="case-bar__link" href="#/protocols/ich/reversal">Reversal</a>}
      <button type="button" className="case-bar__copy" onClick={onCopy} aria-label={blocked ? undefined : `Copy ${documentLabel} (case bar)`}>{blocked ? `Review ${blocked} flag${blocked === 1 ? '' : 's'}` : /copied\.$/.test(copyStatus || '') ? 'Copied ✓' : <><span className="case-bar__copy-long">Copy {documentLabel}</span><span className="case-bar__copy-short" aria-hidden="true">Copy note</span></>}</button>
    </div>
  </section>;
}
