import React, { useLayoutEffect, useRef } from 'react';
import { encounterTiming, encounterNihss, validTimestamp, parsePreIvtBp } from '../workspace-state.js';
import { numericInput, reviewedGcs } from '../encounter-clinical-review.js';
import { ivtHold } from '../ivt-hold.js';
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
// A duration, not a clock face: "0:00" reads as midnight.
export const formatElapsed = minutes => {
  const whole = Math.max(0, Math.floor(minutes));
  if (whole < 60) return `${whole} min`;
  const hours = Math.floor(whole / 60), rest = whole % 60;
  return rest ? `${hours} h ${rest} m` : `${hours} h`;
};

// Read-only projection of the current Encounter for the sticky case bar.
// It never decides eligibility: window references are elapsed-time arithmetic.
export function caseSummary(state, nowMs) {
  const n = state.note, timing = encounterTiming(n, nowMs), exam = encounterNihss(state);
  const acuteIschemic = state.context === 'acute' && n.diagnosisCategory === 'ischemic';
  const age = numericInput(n.age, { min: 0, max: 120 });
  const weight = numericInput(n.weight, { min: Number.MIN_VALUE, max: 350 });
  const [sbp, dbp] = String(n.presentingBP || '').split('/').map(value => numericInput(value, { min: 1, max: 400 }));
  const glucose = numericInput(n.glucose, { min: 1 });
  // Once IV thrombolysis is recorded, the next neuro/BP check replaces the lytic countdown, whatever the later
  // working diagnosis or context (a thrombolysed mimic, a post-lytic ICH).
  const administered = state.actions?.administered && state.drug && validTimestamp(state.actions.administrationTime, nowMs);
  const schedule = administered ? computeNeurocheckSchedule(state.actions.administrationTime) : null;
  const unconfirmed = state.actions?.agentConfirmed !== state.drug;
  // A recorded dose above the agent maximum (TNK 25 mg, alteplase 90 mg) is flagged here and in Encounter, as in the note.
  const doseMax = administered && { TNK: 25, Alteplase: 90 }[state.drug], overMax = doseMax && numericInput(state.actions.administeredDose, { min: Number.MIN_VALUE }) > doseMax ? doseMax : 0;
  const nextCheck = schedule?.checks.find(check => check.at.getTime() > nowMs);
  let window = null;
  if (timing.invalid) window = { text: 'Check time', tone: 'critical' };
  else if (schedule) window = nextCheck ? { text: `Next check ${clockTime(nextCheck.at)}`, short: `Next ${shortClock(nextCheck.at)}`, tone: 'open' } : { text: '24 h checks done', short: 'Checks done', tone: 'neutral' };
  else if (timing.clock) {
    const elapsed = timing.clock.elapsedMinutes * 60000;
    // Unknown LKW: the WAKE-UP MRI route requires treatment within 4.5 h of symptom recognition.
    if (n.lkwUnknown) { const toRecognition = 4.5 * 3600000 - elapsed; window = !acuteIschemic ? { text: 'since discovery', tone: 'neutral' } : toRecognition > 0 ? { text: `4.5 h from discovery in ${hoursMinutes(toRecognition)}`, short: `Disc ${hoursMinutes(toRecognition)}`, tone: toRecognition <= 30 * 60000 ? 'caution' : 'open' } : { text: '4.5 h from discovery passed', short: 'Disc passed', tone: 'neutral' }; }
    else if (acuteIschemic && !timing.clock.toLyticClosed) window = { text: `4.5 h in ${hoursMinutes(timing.clock.toLyticMs)}`, tone: timing.clock.toLyticMs <= 30 * 60000 ? 'caution' : 'open' };
    else if (acuteIschemic && !timing.clock.toLateEvtClosed) window = { text: `24 h in ${hoursMinutes(timing.clock.toLateEvtMs)}`, tone: 'neutral' };
    else if (elapsed >= 24 * 3600000) window = { text: '>24 h', tone: 'neutral' };
  }
  // Dose arithmetic is shown only for a selected agent with no recorded hold: never a default agent, and
  // never beside a held IVT card, a hemorrhage/uncertain CT review or an implausible adult weight or age.
  const hold = acuteIschemic && !administered && state.decisions?.ivt !== 'Not recommended' ? doseHold(state, nowMs, weight, age) : null;
  const dose = acuteIschemic && !hold && weight !== null && ['TNK', 'Alteplase'].includes(state.drug) && state.decisions?.ivt !== 'Not recommended' ? (state.drug === 'Alteplase' ? calculateAlteplaseDoseReviewed(n.weight) : calculateTNKDoseReviewed(n.weight, state.doseAuthority)) : null;
  const gcs = ['ich', 'sah', 'cvt'].includes(n.diagnosisCategory) ? reviewedGcs(state.gcs) : null;
  // BP flags: AIS before IVT not <185/110 (AHA/ASA 2026 COR 1); after IVT not <180/105 (COR 1, ais-2026-74), kept in
  // acute care when the working diagnosis changes after a recorded IVT; acute ICH SBP >=150, the 2022 range in which
  // lowering toward 140 applies (it takes precedence for a post-lytic ICH).
  const bpKnown = sbp !== null && dbp !== null;
  const ich = state.context === 'acute' && n.diagnosisCategory === 'ich';
  // After IVT the entered BP may still be the presenting value; a documented pre-IVT BP shows that.
  const preIvt = parsePreIvtBp(state.details?.preIvtBP);
  const bpFlag = !bpKnown ? null : ich && sbp >= 220 ? 'ICH: SBP ≥220 is outside the 2022 150–220 range; local protocol: reduce about 20% (never more than 25%) in the first hour, then gradually to 140–160'
    : ich && sbp >= 150 ? 'ICH: SBP 150–220 → target 140 (130–150), start ≤2 h, reach ≤1 h; avoid <130'
    : administered && state.context === 'acute' ? sbp >= 180 || dbp >= 105 ? `Not below the post-IVT limit of 180/105${preIvt ? `; documented pre-IVT BP ${preIvt.text}. Update the entered BP with the current reading` : ''}` : null
    : acuteIschemic && (sbp >= 185 || dbp >= 110) ? 'Not below 185/110 (pre-IVT)' : null;
  return {
    dx: SHORT_DX[n.diagnosisCategory] || '', dxKey: n.diagnosisCategory || '',
    demographics: [age !== null ? String(age) : '', n.sex === 'M' || n.sex === 'F' ? n.sex : ''].filter(Boolean).join(' '),
    timeLabel: n.lkwUnknown ? 'Discovery' : 'LKW',
    elapsed: timing.clock ? formatElapsed(timing.clock.elapsedMinutes) : timing.invalid ? '!' : n.lkwUnknown && !timing.timestamp ? 'unknown' : '',
    window,
    nihss: exam.complete ? String(exam.total) : exam.source === 'itemized' && exam.count ? String(exam.partial) : '',
    nihssPartial: !exam.complete && exam.source === 'itemized' && exam.count > 0,
    nihssDocumented: exam.count || 0,
    gcs: gcs === null ? '' : String(gcs),
    bp: sbp !== null && dbp !== null ? `${sbp}/${dbp}` : '',
    bpHigh: Boolean(bpFlag), bpTitle: bpFlag || undefined,
    administered: Boolean(administered), administeredAt: administered ? clockTime(state.actions.administrationTime) : '',
    glucose: glucose === null ? '' : String(glucose),
    glucoseFlag: glucose !== null && (glucose < 50 || glucose > 400),
    weight: weight === null ? '' : `${Math.round(weight * 10) / 10}`,
    // Why no dose is shown when nothing is held: name the missing input, not a generic one.
    doseNote: state.decisions?.ivt === 'Not recommended' ? 'IVT clinician decision is Not recommended; no dose shown' : `${!['TNK', 'Alteplase'].includes(state.drug) ? `Select the IV thrombolytic${weight === null ? ' and enter a valid weight (kg)' : ''}` : 'Enter a valid weight (kg)'} in Encounter for dose arithmetic; not an eligibility decision`,
    // An agent pre-filled from the dose calculation is not named until it is confirmed (as in the note).
    doseAboveMax: overMax,
    dose: administered ? { label: unconfirmed ? 'IVT given' : state.drug === 'Alteplase' ? 'tPA given' : 'TNK given', value: clockTime(state.actions.administrationTime), detail: state.actions.administeredDose ? `${state.actions.administeredDose} mg` : '', title: `Recorded administration time${unconfirmed ? '; confirm the agent given in Encounter' : ''}${overMax ? `; administered dose above the ${overMax} mg maximum` : ''}`, flag: unconfirmed || overMax ? 'caution' : undefined } : hold ? { label: 'IVT dose', value: hold.value, detail: hold.detail, title: hold.title, flag: hold.flag } : dose ? state.drug === 'Alteplase' ? { label: 'tPA', value: `${dose.totalDose} mg`, detail: `${dose.bolus} mg bolus` } : { label: 'TNK', value: `${dose.calculatedDose} mg`, detail: dose.volume } : null,
    anticoagulant: n.lastDOACType && n.lastDOACType !== 'none' ? ANTICOAGULANT_LABELS[n.lastDOACType] || 'Anticoagulant' : '',
    aceInhibitor: ACE_INHIBITOR.test(n.medications || ''),
    hasData: Boolean(n.diagnosisCategory || age !== null || timing.timestamp || n.lkwUnknown || exam.complete || exam.count || sbp !== null || glucose !== null || weight !== null)
  };
}

// Why the case bar withholds dose arithmetic. The IVT-held reason is the Protocols banner's text for the answers as
// read (a contradicted "No" read as "Yes"); the cause is shared with the Encounter next-entry cue (ivt-hold.js).
const HOLD_TEXT = {
  'ct-present': () => ({ detail: 'CT hemorrhage', title: 'CT hemorrhage recorded; no dose shown' }),
  'ct-uncertain': () => ({ detail: 'CT uncertain', title: 'CT hemorrhage review uncertain or conflicting; no dose shown' }),
  contradicted: () => ({ detail: 'contradicted answer' }),
  anticoagulant: () => ({ detail: 'anticoagulant not assessed' }),
  review: () => ({ detail: 'safety review' })
};
function doseHold(state, nowMs, weight, age) {
  const hold = ivtHold(state, nowMs);
  if (hold) return { value: 'Held', flag: 'caution', title: hold.reason && `${hold.contradicted ? 'Entered values contradict a "No" safety answer; no dose shown.' : 'IVT card held.'} ${hold.reason}`, ...HOLD_TEXT[hold.cause]() };
  // Same limit as the MCP dose contract: below 30 kg is implausible for adult dosing (often a decimal slip).
  if (weight !== null && weight < 30) return { value: 'Check weight', flag: 'caution', title: 'Weight below 30 kg is implausible for adult IVT dosing; confirm kilograms and decimal placement. No dose shown.' };
  if (age !== null && age < 18) return { value: 'Not shown', flag: 'caution', title: 'Age under 18: adult dose arithmetic does not apply; use the pediatric specialist pathway.' };
  return null;
}

function Item({ label, short, value, detail, flag, title, pill }) {
  // data-detail lets a narrow phone row set the detail under the value (shell.css).
  return <div className="case-bar__item" data-empty={value ? undefined : ''} data-flag={flag || undefined} data-detail={value && detail ? '' : undefined} title={title}>
    <span className="case-bar__label">{short ? <><span className="case-bar__label-long">{label}</span><span className="case-bar__label-short" aria-hidden="true">{short}</span></> : label}</span>
    <span className="case-bar__value">{value || '—'}{flag === 'caution' && <span className="case-bar__flag" aria-hidden="true">!</span>}{detail && <small>{detail}</small>}{title && flag && <span className="sr-only">, {title}</span>}{pill && <span className="case-bar__window" data-tone={pill.tone}>{pill.short ? <><span className="case-bar__label-long">{pill.text}</span><span className="case-bar__label-short" aria-hidden="true">{pill.short}</span></> : pill.text}</span>}</span>
  </div>;
}

// Mounting the bar in flow pushes everything below it down by its height. Keep the element
// being worked in (the focused one, or else the one at mid-screen) where it was. Browser scroll
// anchoring does this only sometimes (never at the top of the page), so the shift is measured
// before and after the DOM update and only the uncompensated remainder is scrolled.
class HoldPositionOnMount extends React.Component {
  getSnapshotBeforeUpdate(previous) {
    if (previous.shown || !this.props.shown || typeof document === 'undefined') return null;
    const focused = document.activeElement;
    const target = focused && focused !== document.body && focused !== document.documentElement ? focused : document.elementFromPoint?.(window.innerWidth / 2, window.innerHeight / 2);
    return target ? { target, top: target.getBoundingClientRect().top } : null;
  }
  componentDidUpdate(previous, state, snapshot) {
    if (!snapshot || !snapshot.target.isConnected) return;
    const shift = snapshot.target.getBoundingClientRect().top - snapshot.top;
    if (shift >= 1) window.scrollBy(0, shift);
  }
  render() { return this.props.children; }
}

// A link to the current route fires no hashchange; reveal its target directly.
const revealIfCurrent = (href, target) => event => { if (location.hash === href) { event.preventDefault(); revealProtocolTarget(target); } };

// announceCopy: off on Encounter, whose own status region already announces the copy result.
export default function CaseBar({ state, documentLabel, blocked, onCopy, copyStatus, announceCopy = false }) {
  // Tick only while the bar shows a time; resume and edits still refresh it.
  const [now] = useCurrentTime(Boolean(state.note.lkwTime || state.note.discoveryTime || state.note.lastDOACDose || state.actions?.administrationTime));
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
  if (!c.hasData) return <HoldPositionOnMount shown={false} />;
  const acuteIschemic = state.context === 'acute' && state.note.diagnosisCategory === 'ischemic';
  const sub = ['ich', 'sah'].includes(state.note.diagnosisCategory) ? 'ich' : 'ischemic';
  const reversalHref = `#/protocols/${sub}/qr-reversal`, bpHref = `#/protocols/${sub}/qr-bp`;
  // In acute ischemic stroke the anticoagulant matters for IVT eligibility, not reversal.
  const badge = acuteIschemic ? { href: '#/protocols/ischemic/contraindications', target: 'contraindications', title: 'Anticoagulant exposure documented · open IVT contraindications', action: 'open IVT contraindications' } : { href: reversalHref, target: 'qr-reversal', title: 'Anticoagulant exposure documented · open the reversal table', action: 'open reversal table' };
  const bpLink = acuteIschemic || c.administered || state.context === 'acute' && ['ich', 'sah'].includes(state.note.diagnosisCategory);
  return <HoldPositionOnMount shown><section ref={bar} className="case-bar" aria-label="Current encounter">
    <a className="case-bar__dx" data-dx={c.dxKey || undefined} href="#/encounter" aria-label={`Open Encounter: ${[c.dx || 'No diagnosis', c.demographics].filter(Boolean).join(' · ')}`}>{c.dx || 'No diagnosis'}{c.demographics && <span className="case-bar__demo">· {c.demographics}</span>}</a>
    {c.anticoagulant && <a className="case-bar__badge" href={badge.href} onClick={revealIfCurrent(badge.href, badge.target)} title={badge.title}><span className="sr-only">Anticoagulant: </span>{c.anticoagulant}<span className="sr-only">, {badge.action}</span></a>}
    <div className="case-bar__time"><Item label={c.timeLabel} value={c.elapsed} pill={c.window} flag={c.window?.tone === 'critical' ? 'critical' : undefined} title="Elapsed time" /></div>
    <div className="case-bar__items">
      {c.gcs ? <Item label="GCS" value={c.gcs} /> : null}
      <Item label="NIHSS" value={c.nihss} detail={c.nihssPartial ? 'partial' : undefined} flag={c.nihssPartial ? 'partial' : undefined} title={c.nihssPartial ? `Partial itemized sum: ${c.nihssDocumented} of 15 items documented` : undefined} />
      <Item label="BP" value={c.bp} flag={c.bpHigh ? 'caution' : undefined} title={c.bpTitle} />
      <Item label="Glucose" short="Glu" value={c.glucose} flag={c.glucoseFlag ? 'caution' : undefined} title={c.glucoseFlag ? 'Glucose outside 50–400 mg/dL' : undefined} />
      <Item label="Weight" short="Wt" value={c.weight && `${c.weight} kg`} />
      {(acuteIschemic || c.administered) && <Item label={c.dose?.label || 'Dose'} value={c.dose?.value} detail={c.dose?.detail} flag={c.dose?.flag} title={c.dose?.title || (c.dose ? 'Dose arithmetic only; not an eligibility decision' : c.doseNote)} />}
    </div>
    <div className="case-bar__actions">
      <a className="case-bar__link" href={`#/protocols/${sub}/qr-dose`} onClick={revealIfCurrent(`#/protocols/${sub}/qr-dose`, 'qr-dose')}>Dose table</a>
      {bpLink && <a className="case-bar__link" href={bpHref} onClick={revealIfCurrent(bpHref, 'qr-bp')}>BP targets</a>}
      {c.administered && <a className="case-bar__link" href="#/protocols/ischemic/qr-sich" onClick={revealIfCurrent('#/protocols/ischemic/qr-sich', 'qr-sich')}>Post-lytic bleed</a>}
      {c.administered && c.aceInhibitor && <a className="case-bar__link" href="#/protocols/ischemic/qr-angioedema" onClick={revealIfCurrent('#/protocols/ischemic/qr-angioedema', 'qr-angioedema')}>Angioedema</a>}
      {(['ich', 'sah'].includes(state.note.diagnosisCategory) || (c.anticoagulant && !acuteIschemic)) && <a className="case-bar__link" href={reversalHref} onClick={revealIfCurrent(reversalHref, 'qr-reversal')}>Reversal</a>}
      {/* No-break space: on a two-line phone button the count stays with "flags". */}
      <button type="button" className="case-bar__copy" onClick={onCopy}>{blocked ? `Review ${blocked} flag${blocked === 1 ? '' : 's'}` : /copied\.$/.test(copyStatus || '') ? 'Copied ✓' : <><span className="case-bar__copy-long">Copy {documentLabel}</span><span className="case-bar__copy-short">Copy note<span className="sr-only"> ({documentLabel})</span></span><span className="sr-only"> (case bar)</span></>}</button>
      {announceCopy && <span className="sr-only" role="status">{copyStatus}</span>}
    </div>
  </section></HoldPositionOnMount>;
}
