import { formatRecordedInstant } from './clinical/timestamp.js';
import { computeLKWCountdown } from './calculators-extended.js';
const validTimestamp = (value, now) => computeLKWCountdown(value, now) ? new Date(value) : null;
const unambiguousTimestamp = validTimestamp;

export const TIMELINE_FIELDS = [
  ['consultStart', 'Consultation start'], ['consultEnd', 'Consultation end'],
  ['arrival', 'ED arrival'], ['strokeAlert', 'Stroke alert'], ['ctStart', 'CT start'],
  ['ctRead', 'CT interpretation'], ['ivtOrder', 'IVT order'],
  ['reversal', 'ICH reversal administration'], ['transferDecision', 'Transfer decision'], ['departure', 'Departure to receiving facility']
];
export function localTimestamp(now = Date.now()) {
  const date = new Date(now), pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
// A clock shortcut retains its exact instant independently of the displayed
// local fields, including a repeated DST hour or a later system-zone change.
export function encounterClockTimestamp(note, prefix) {
  const date = note[`${prefix}Date`], time = note[`${prefix}Time`];
  if (!date || !time) return '';
  const value = `${date}T${time}`, clock = note[`${prefix}Clock`];
  return clock?.value === value ? typeof clock.instant === 'string' ? clock.instant : '' : value;
}
export function timelineIntervals(state, now) {
  const t = state.timeline || {}, acute = state.context === 'acute';
  const ivt = acute && state.note.diagnosisCategory === 'ischemic' && state.actions.administered && state.drug ? state.actions.administrationTime : '';
  const puncture = acute && state.note.diagnosisCategory === 'ischemic' ? state.actions.punctureTime : '';
  const reperfusion = acute && state.note.diagnosisCategory === 'ischemic' ? state.actions.reperfusionTime : '';
  const pairs = [
    [t.consultEnd ? 'Consultation elapsed' : 'Consultation elapsed so far (end not recorded)', t.consultStart, t.consultEnd || now],
    ...(acute ? [['Door to CT', t.arrival, t.ctStart], ['CT to interpretation', t.ctStart, t.ctRead], ['Door to transfer decision', t.arrival, t.transferDecision], ['Door-in to door-out', t.arrival, t.departure]] : []),
    ...(ivt ? [['Door to IVT', t.arrival, ivt], ['CT to IVT', t.ctStart, ivt], ['Order to IVT', t.ivtOrder, ivt]] : []),
    ...(puncture ? [['Door to puncture', t.arrival, puncture], ['Puncture to reperfusion', puncture, reperfusion]] : []),
    ...(acute && state.note.diagnosisCategory === 'ich' ? [['Door to reversal', t.arrival, t.reversal]] : [])
  ];
  return pairs.filter(([, start, end]) => start && end).map(([label, start, end]) => {
    const from = unambiguousTimestamp(start, now), to = typeof end === 'number' ? new Date(end) : unambiguousTimestamp(end, now);
    const minutes = from && to && to >= from ? Math.floor((to - from) / 60000) : null;
    return { label, minutes, text: minutes === null ? 'Invalid, future, reversed or ambiguous local timestamps' : `${minutes} min` };
  });
}
export function evtReperfusionIssue(state, now) {
  if (state.context !== 'acute' || state.note.diagnosisCategory !== 'ischemic') return '';
  const puncture = validTimestamp(state.actions.punctureTime, now);
  const reperfusion = validTimestamp(state.actions.reperfusionTime, now);
  return puncture && reperfusion && reperfusion < puncture ? 'EVT reperfusion precedes puncture; review the recorded dates and times.' : '';
}
export function activeTimelineFields(state) {
  return TIMELINE_FIELDS.filter(([key]) => state.context === 'acute' || ['consultStart', 'consultEnd'].includes(key))
    .filter(([key]) => key !== 'reversal' || state.note.diagnosisCategory === 'ich')
    .filter(([key]) => key !== 'ivtOrder' || state.note.diagnosisCategory === 'ischemic');
}
export function formatTimeline(state, now) {
  const entered = activeTimelineFields(state).filter(([key]) => state.timeline?.[key]);
  const intervals = timelineIntervals(state, now);
  if (!entered.length && !intervals.length) return '';
  return ['Timeline:', ...entered.map(([key, label]) => `${label}: ${unambiguousTimestamp(state.timeline[key], now) ? formatRecordedInstant(state.timeline[key]) : state.timeline[key]}${unambiguousTimestamp(state.timeline[key], now) ? '' : ' (invalid or future, or ambiguous local time; review)'}`), ...intervals.map(interval => `${interval.label}: ${interval.text}`)].join('\n');
}
