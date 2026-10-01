import { computeLKWCountdown } from './calculators-extended.js';
const validTimestamp = (value, now) => computeLKWCountdown(value, now) ? new Date(value) : null;
function unambiguousTimestamp(value, now) {
  const date = validTimestamp(value, now);
  if (!date || /(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return date;
  // A repeated local hour has two possible instants. Never choose one silently.
  const local = localTimestamp(date.getTime());
  return [30, 60, 120].some(minutes => localTimestamp(date.getTime() + minutes * 60000) === local) ? null : date;
}

export const TIMELINE_FIELDS = [
  ['consultStart', 'Consultation start'], ['consultEnd', 'Consultation end'],
  ['arrival', 'ED arrival'], ['strokeAlert', 'Stroke alert'], ['ctStart', 'CT start'],
  ['ctRead', 'CT interpretation'], ['ivtOrder', 'IVT order'],
  ['reversal', 'ICH reversal administration'], ['transferDecision', 'Transfer decision']
];
export function localTimestamp(now = Date.now()) {
  const date = new Date(now), pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
export function timelineIntervals(state, now) {
  const t = state.timeline || {}, acute = state.context === 'acute';
  const ivt = acute && state.note.diagnosisCategory === 'ischemic' && state.actions.administered && state.drug ? state.actions.administrationTime : '';
  const puncture = acute && state.note.diagnosisCategory === 'ischemic' ? state.actions.punctureTime : '';
  const pairs = [
    ['Consultation elapsed', t.consultStart, t.consultEnd || now],
    ...(acute ? [['Door to CT', t.arrival, t.ctStart], ['CT to interpretation', t.ctStart, t.ctRead], ['Door to transfer decision', t.arrival, t.transferDecision]] : []),
    ...(ivt ? [['Door to IVT', t.arrival, ivt], ['CT to IVT', t.ctStart, ivt], ['Order to IVT', t.ivtOrder, ivt]] : []),
    ...(puncture ? [['Door to puncture', t.arrival, puncture]] : []),
    ...(acute && state.note.diagnosisCategory === 'ich' ? [['Door to reversal', t.arrival, t.reversal]] : [])
  ];
  return pairs.filter(([, start, end]) => start && end).map(([label, start, end]) => {
    const from = unambiguousTimestamp(start, now), to = typeof end === 'number' ? new Date(end) : unambiguousTimestamp(end, now);
    const minutes = from && to && to >= from ? Math.floor((to - from) / 60000) : null;
    return { label, minutes, text: minutes === null ? 'Invalid, future, reversed or ambiguous local timestamps' : `${minutes} min` };
  });
}
export function activeTimelineFields(state) {
  return TIMELINE_FIELDS.filter(([key]) => state.context === 'acute' || ['consultStart', 'consultEnd'].includes(key))
    .filter(([key]) => key !== 'reversal' || state.note.diagnosisCategory === 'ich')
    .filter(([key]) => key !== 'ivtOrder' || state.note.diagnosisCategory === 'ischemic');
}
export function formatTimeline(state, now) {
  const entered = activeTimelineFields(state).filter(([key]) => state.timeline?.[key]);
  if (!entered.length) return '';
  return ['Timeline:', ...entered.map(([key, label]) => `${label}: ${state.timeline[key]}${unambiguousTimestamp(state.timeline[key], now) ? '' : ' (invalid or future, or ambiguous local time; review)'}`), ...timelineIntervals(state, now).map(interval => `${interval.label}: ${interval.text}`)].join('\n');
}
