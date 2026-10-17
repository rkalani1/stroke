export const DOCUMENT_FORMATS = [
  ['consultation', 'Consultation · Pulsara / Epic'], ['follow-up', 'Follow-up note'],
  ['progress', 'Progress note'], ['discharge', 'Discharge summary'],
  ['transfer', 'Transfer handoff'], ['handoff', 'Team handoff'], ['procedure', 'Procedure record']
];
export function documentationLabel(state) {
  const selected = DOCUMENT_FORMATS.find(([id]) => id === state.documentFormat);
  return !selected || selected[0] === 'consultation' ? state.consultationType === 'phone' ? 'Pulsara summary' : 'Epic note' : selected[1];
}
// Clipboard outcome messages. Only a confirmed copy ends in "copied." (the case bar shows "Copied ✓" for that);
// a superseded or blocked copy says so, because the clipboard may hold an earlier note or nothing new.
export function copyStatusMessage(result, label) {
  return { copied: `${label} copied.`, denied: 'Clipboard unavailable. Select the read-only summary and copy it manually.',
    superseded: 'Inputs changed while copying; the clipboard may hold an earlier version. Copy again to include the latest entries.',
    blocked: 'Copy did not run: the note is out of date or has flagged entries. Regenerate and try again.' }[result] || '';
}
// Team handoff: safety-relevant lines from groups that otherwise stay out of the handoff.
const HANDOFF_LINES = {
  // The antithrombotic plan (regimen, held/deferred, DAPT stop date) travels with the patient.
  prevention: /^(Antithrombotic plan|Antithrombotic regimen|Documented DAPT start date|Planned DAPT stop date)/,
  // Weight provenance, allergies and contrast reactions bear on dosing, repeat imaging and orders.
  'context-details': /^(Weight estimated|Allergy review|Allergies and reported reactions|Prior iodinated contrast reaction|Contrast reaction)/,
  // Swallow, nutrition route and code status bear on the receiving team's first orders.
  'supportive-care': /^(Swallow screen|Current nutrition route|Goals-of-care discussion|Documented code status|Goals \/ code status)/,
  'special-context': /^/
};
export function formatDocumentation(state, consultation, groups, timeline) {
  const extras = groups.map(group => `${group.title}:\n${group.lines.join('\n')}`);
  if (timeline) extras.push(timeline);
  const format = DOCUMENT_FORMATS.some(([id]) => id === state.documentFormat) ? state.documentFormat : 'consultation';
  if (format === 'handoff') {
    // The diagnosis-specific group carries ICH reversal, neurosurgery and hydrocephalus entries
    // and the TIA review; only the reversal time is taken from the timeline.
    const handoffGroups = groups.filter(group => ['post-reperfusion', 'transfer', 'diagnosis-details'].includes(group.id))
      .concat(groups.filter(group => HANDOFF_LINES[group.id]).map(group => ({ ...group, lines: group.lines.filter(line => HANDOFF_LINES[group.id].test(line)) })).filter(group => group.lines.length));
    const reversal = (timeline || '').split('\n').find(line => line.startsWith('ICH reversal administration:'));
    const withReversal = group => group.id === 'diagnosis-details' && reversal ? [...group.lines, reversal] : group.lines;
    const standaloneReversal = handoffGroups.some(group => group.id === 'diagnosis-details') ? null : reversal;
    return [consultation, ...handoffGroups.map(group => `${group.title}:\n${withReversal(group).join('\n')}`), standaloneReversal].filter(Boolean).join('\n\n');
  }
  if (format === 'consultation') {
    if (!extras.length) return consultation;
    // The one-line Pulsara summary separates detail lines with semicolons so entries never run together.
    if (state.consultationType === 'phone') {
      const end = line => /[.;:!?]$/.test(line.trim()) ? line.trim() : `${line.trim()};`;
      const joined = (title, lines) => `${title}: ${lines.map(end).join(' ').replace(/;$/, '.')}`;
      const phoneExtras = groups.map(group => joined(group.title, group.lines));
      if (timeline) {
        const [title, ...lines] = timeline.split('\n').map(line => line.trim()).filter(Boolean);
        phoneExtras.push(lines.length ? joined(title.replace(/:$/, ''), lines) : title);
      }
      return [consultation, ...phoneExtras].join(' ').replace(/\s*\n\s*/g, ' ');
    }
    return [consultation, ...extras].join('\n\n');
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
