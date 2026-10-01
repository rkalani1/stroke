export const DOCUMENT_FORMATS = [
  ['consultation', 'Consultation · Pulsara / Epic'], ['follow-up', 'Follow-up note'],
  ['progress', 'Progress note'], ['discharge', 'Discharge summary'],
  ['transfer', 'Transfer handoff'], ['procedure', 'Procedure record']
];
export function documentationLabel(state) {
  const selected = DOCUMENT_FORMATS.find(([id]) => id === state.documentFormat);
  return !selected || selected[0] === 'consultation' ? state.consultationType === 'phone' ? 'Pulsara summary' : 'Epic note' : selected[1];
}
export function formatDocumentation(state, consultation, groups, timeline) {
  const extras = groups.map(group => `${group.title}:\n${group.lines.join('\n')}`);
  if (timeline) extras.push(timeline);
  const format = DOCUMENT_FORMATS.some(([id]) => id === state.documentFormat) ? state.documentFormat : 'consultation';
  if (format === 'consultation') {
    if (!extras.length) return consultation;
    const text = [consultation, ...extras].join('\n\n');
    return state.consultationType === 'phone' ? text.replace(/\s*\n\s*/g, ' ') : text;
  }
  const focus = {
    'follow-up': ['follow-up-review', 'participation', 'etiology', 'prevention'],
    progress: ['phenotype', 'diagnosis-details', 'supportive-care', 'post-reperfusion'],
    discharge: ['discharge-continuity', 'prevention', 'participation'],
    transfer: ['transfer', 'post-reperfusion', 'diagnosis-details'],
    procedure: ['post-reperfusion']
  }[format];
  const ordered = [...groups.filter(group => focus.includes(group.id)), ...groups.filter(group => !focus.includes(group.id))];
  const focusTitle = { 'follow-up': 'Interval events, function and follow-up', progress: 'Interval course and current plan', discharge: 'Hospital course and discharge arrangements', transfer: 'Transfer arrangements and receiving-team handoff', procedure: 'Procedure observations and recorded outcome' }[format];
  return [documentationLabel(state), 'Clinical context:', consultation,
    ...(!groups.some(group => focus.includes(group.id)) ? [`${focusTitle}: not documented`] : []),
    ...ordered.map(group => `${group.title}:\n${group.lines.join('\n')}`), timeline].filter(Boolean).join('\n\n');
}
