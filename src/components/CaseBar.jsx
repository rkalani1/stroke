import React, { useLayoutEffect, useRef } from 'react';
import { encounterTiming, encounterNihss, validTimestamp, parsePreIvtBp } from '../workspace-state.js';
import { numericInput, reviewedGcs } from '../encounter-clinical-review.js';
import { calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed } from '../calculators.js';
import { computeNeurocheckSchedule } from '../calculators-extended.js';
import { useCurrentTime } from '../use-current-time.js';
import { revealProtocolTarget } from '../protocol-navigation.js';

const SHORT_DX = { ischemic: 'Ischemic', ich: 'ICH', sah: 'SAH', tia: 'TIA', cvt: 'CVT', mimic: 'Mimic', other: 'Other' };
export const ANTICOAGULANT_LABELS = { apixaban: 'Apixaban', rivaroxaban: 'Rivaroxaban', dabigatran: 'Dabigatran', edoxaban: 'Edoxaban', warfarin: 'Warfarin', heparin: 'Heparin', lmwh: 'LMWH', other: 'Anticoagulant' };
const pad = value => String(value).padStart(2, '0');
const clockTime = at => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
// Phone pill: checks are at most an hour apart, so h:mm without AM/PM is unambiguous there.
const shortClock = at => { const d = new Date(at); return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`; };
// Named ACE inhibitors only (a bare '-pril' suffix also matches 'April').
const ACE_INHIBITOR = /\b(?:benaze|capto|enala|fosino|lisino|moexi|perindo|quina|rami|trandola|zofeno|cilaza|imida)pril(?:at)?\b/i;
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
  // Once IV thrombolysis is recorded, the next neuro/BP check replaces the lytic countdown.
  const administered = acuteIschemic && state.actions?.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
  const schedule = administered ? computeNeurocheckSchedule(state.actions.administrationTime) : null;
  const nextCheck = schedule?.checks.find(check => check.at.getTime() > nowMs);
  let window = null;
  if (timing.invalid) window = { text: 'Check time', tone: 'critical' };
  else if (schedule) window = nextCheck ? { text: `Next check ${clockTime(nextCheck.at)}`, short: `Next ${shortClock(nextCheck.at)}`, tone: 'open' } : { text: '24 h checks done', short: 'Checks done', tone: 'neutral' };
  else if (timing.clock) {
    const elapsed = timing.clock.elapsedMinutes * 60000;
    if (n.lkwUnknown) window = { text: 'since discovery', tone: 'neutral' };
    else if (acuteIschemic && !timing.clock.toLyticClosed) window = { text: `4.5 h in ${hoursMinutes(timing.clock.toLyticMs)}`, tone: timing.clock.toLyticMs <= 30 * 60000 ? 'caution' : 'open' };
    else if (acuteIschemic && !timing.clock.toLateEvtClosed) window = { text: `24 h in ${hoursMinutes(timing.clock.toLateEvtMs)}`, tone: 'neutral' };
    else if (elapsed >= 24 * 3600000) window = { text: '>24 h', tone: 'neutral' };
  }
  const dose = acuteIschemic && weight !== null ? (state.drug === 'Alteplase' ? calculateAlteplaseDoseReviewed(n.weight) : calculateTNKDoseReviewed(n.weight, state.drug === 'TNK' ? state.doseAuthority : 'guideline')) : null;
  const gcs = ['ich', 'sah', 'cvt'].includes(n.diagnosisCategory) ? reviewedGcs(state.gcs) : null;
  // BP flags: AIS before IVT not <185/110 (AHA/ASA 2026 COR 1); after IVT above 180/105 (COR 1);
  // acute ICH SBP >=150, the 2022 range in which lowering toward 140 applies.
  const bpKnown = sbp !== null && dbp !== null;
  const ich = state.context === 'acute' && n.diagnosisCategory === 'ich';
  // After IVT the entered BP may still be the presenting value; a documented pre-IVT BP shows that.
  const preIvt = parsePreIvtBp(state.details?.preIvtBP);
  const bpFlag = !bpKnown ? null : acuteIschemic ? administered ? sbp > 180 || dbp > 105 ? `Above the post-IVT limit of 180/105${preIvt ? `; documented pre-IVT BP ${preIvt.text}. Update the entered BP with the current reading` : ''}` : null : sbp >= 185 || dbp >= 110 ? 'Not below 185/110 (pre-IVT)' : null
    : ich && sbp >= 220 ? 'ICH: SBP ≥220 is outside the 2022 150–220 range; local protocol: reduce about 20% (never more than 25%) in the first hour, then gradually to 140–160'
    : ich && sbp >= 150 ? 'ICH: SBP 150–220 → target 140 (130–150), start ≤2 h, reach ≤1 h; avoid <130' : null;
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
    bpHigh: Boolean(bpFlag), bpTitle: bpFlag || undefined,
    administered: Boolean(administered), administeredAt: administered ? clockTime(state.actions.administrationTime) : '',
    glucose: glucose === null ? '' : String(glucose),
    glucoseFlag: glucose !== null && (glucose < 50 || glucose > 400),
    weight: weight === null ? '' : `${Math.round(weight * 10) / 10}`,
    dose: administered ? { label: state.drug === 'Alteplase' ? 'tPA given' : 'TNK given', value: clockTime(state.actions.administrationTime), detail: state.actions.administeredDose ? `${state.actions.administeredDose} mg` : '' } : dose ? state.drug === 'Alteplase' ? { label: 'tPA', value: `${dose.totalDose} mg`, detail: `${dose.bolus} mg bolus` } : { label: 'TNK', value: `${dose.calculatedDose} mg`, detail: dose.volume } : null,
    anticoagulant: n.lastDOACType && n.lastDOACType !== 'none' ? ANTICOAGULANT_LABELS[n.lastDOACType] || 'Anticoagulant' : '',
    aceInhibitor: ACE_INHIBITOR.test(n.medications || ''),
    hasData: Boolean(n.diagnosisCategory || age !== null || timing.timestamp || n.lkwUnknown || exam.complete || exam.count || sbp !== null || glucose !== null || weight !== null)
  };
}

function Item({ label, short, value, detail, flag, title, pill }) {
  return <div className="case-bar__item" data-empty={value ? undefined : ''} data-flag={flag || undefined} title={title}>
    <span className="case-bar__label">{short ? <><span className="case-bar__label-long">{label}</span><span className="case-bar__label-short" aria-hidden="true">{short}</span></> : label}</span>
    <span className="case-bar__value">{value || '—'}{flag === 'caution' && <span className="case-bar__flag" aria-hidden="true">!</span>}{title && flag && <span className="sr-only">, {title}</span>}{detail && <small>{detail}</small>}{pill && <span className="case-bar__window" data-tone={pill.tone}>{pill.short ? <><span className="case-bar__label-long">{pill.text}</span><span className="case-bar__label-short" aria-hidden="true">{pill.short}</span></> : pill.text}</span>}</span>
  </div>;
}

// A link to the current route fires no hashchange; reveal its target directly.
const revealIfCurrent = (href, target) => event => { if (location.hash === href) { event.preventDefault(); revealProtocolTarget(target); } };

// announceCopy: off on Encounter, whose own status region already announces the copy result.
export default function CaseBar({ state, documentLabel, blocked, onCopy, copyStatus, announceCopy = false }) {
  const [now] = useCurrentTime(true);
  const bar = useRef(null);
  // A timestamp set to "now" can be newer than the last one-second tick.
  const c = caseSummary(state, Math.max(now, Date.now()));
  // Sticky offsets (section nav, scroll padding) follow the bar's real height as it wraps.
  useLayoutEffect(() => {
    const node = bar.current, root = document.documentElement;
    if (!node) return undefined;
    const sync = () => root.style.setProperty('--case-bar-h', `${Math.ceil(node.getBoundingClientRect().height)}px`);
    sync();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : null;
    observer?.observe(node);
    return () => { observer?.disconnect(); root.style.removeProperty('--case-bar-h'); };
  }, [c.hasData]);
  if (!c.hasData) return null;
  const acuteIschemic = state.context === 'acute' && state.note.diagnosisCategory === 'ischemic';
  const sub = ['ich', 'sah'].includes(state.note.diagnosisCategory) ? 'ich' : 'ischemic';
  const reversalHref = `#/protocols/${sub}/qr-reversal`, bpHref = `#/protocols/${sub}/qr-bp`;
  // In acute ischemic stroke the anticoagulant matters for IVT eligibility, not reversal.
  const badge = acuteIschemic ? { href: '#/protocols/ischemic/contraindications', target: 'contraindications', title: 'Anticoagulant exposure documented · open IVT contraindications', action: 'open IVT contraindications' } : { href: reversalHref, target: 'qr-reversal', title: 'Anticoagulant exposure documented · open the reversal table', action: 'open reversal table' };
  const bpLink = acuteIschemic || state.context === 'acute' && ['ich', 'sah'].includes(state.note.diagnosisCategory);
  return <section ref={bar} className="case-bar" aria-label="Current encounter">
    <a className="case-bar__dx" data-dx={c.dxKey || undefined} href="#/encounter" aria-label={`Open Encounter: ${[c.dx || 'No diagnosis', c.demographics].filter(Boolean).join(' · ')}`}>{c.dx || 'No diagnosis'}{c.demographics && <span className="case-bar__demo">· {c.demographics}</span>}</a>
    {c.anticoagulant && <a className="case-bar__badge" href={badge.href} onClick={revealIfCurrent(badge.href, badge.target)} title={badge.title}><span className="sr-only">Anticoagulant: </span>{c.anticoagulant}<span className="sr-only">, {badge.action}</span></a>}
    <div className="case-bar__time"><Item label={c.timeLabel} value={c.elapsed} pill={c.window} flag={c.window?.tone === 'critical' ? 'critical' : undefined} title="Elapsed time (h:mm)" /></div>
    <div className="case-bar__items">
      {c.gcs ? <Item label="GCS" value={c.gcs} /> : null}
      <Item label="NIHSS" value={c.nihss} flag={c.nihssPartial ? 'partial' : undefined} title={c.nihssPartial ? 'Partial itemized sum' : undefined} />
      <Item label="BP" value={c.bp} flag={c.bpHigh ? 'caution' : undefined} title={c.bpTitle} />
      <Item label="Glucose" short="Glu" value={c.glucose} flag={c.glucoseFlag ? 'caution' : undefined} title={c.glucoseFlag ? 'Glucose outside 50–400 mg/dL' : undefined} />
      <Item label="Weight" short="Wt" value={c.weight && `${c.weight} kg`} />
      {acuteIschemic && <Item label={c.dose?.label || 'Dose'} value={c.dose?.value} detail={c.dose?.detail} title={c.administered ? 'Recorded administration time' : 'Dose arithmetic only; not an eligibility decision'} />}
    </div>
    <div className="case-bar__actions">
      {bpLink && <a className="case-bar__link" href={bpHref} onClick={revealIfCurrent(bpHref, 'qr-bp')}>BP targets</a>}
      {c.administered && <a className="case-bar__link" href="#/protocols/ischemic/qr-sich" onClick={revealIfCurrent('#/protocols/ischemic/qr-sich', 'qr-sich')}>Post-lytic bleed</a>}
      {c.administered && c.aceInhibitor && <a className="case-bar__link" href="#/protocols/ischemic/qr-angioedema" onClick={revealIfCurrent('#/protocols/ischemic/qr-angioedema', 'qr-angioedema')}>Angioedema</a>}
      {(['ich', 'sah'].includes(state.note.diagnosisCategory) || (c.anticoagulant && !acuteIschemic)) && <a className="case-bar__link" href={reversalHref} onClick={revealIfCurrent(reversalHref, 'qr-reversal')}>Reversal</a>}
      <button type="button" className="case-bar__copy" onClick={onCopy}>{blocked ? `Review ${blocked} flag${blocked === 1 ? '' : 's'}` : /copied\.$/.test(copyStatus || '') ? 'Copied ✓' : <><span className="case-bar__copy-long">Copy {documentLabel}</span><span className="case-bar__copy-short">Copy note<span className="sr-only"> ({documentLabel})</span></span><span className="sr-only"> (case bar)</span></>}</button>
      {announceCopy && <span className="sr-only" role="status">{copyStatus}</span>}
    </div>
  </section>;
}
