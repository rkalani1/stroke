// Documentation reflects entered fields, never a suggested counseling script.
export function buildTnkConsentDocumentation(note = {}) {
  const lines = ['IV THROMBOLYSIS DISCUSSION RECORD:'];
  lines.push(`Discussion: ${note.tnkConsentDiscussed === true ? 'Recorded' : 'Not documented'}`);
  if (note.tnkConsentDiscussed === true) {
    if (note.tnkConsentWith) lines.push(`Participants: ${note.tnkConsentWith}`);
    if (note.tnkConsentTime) lines.push(`Time: ${note.tnkConsentTime}`);
    const statuses = {
      informed: 'Informed consent recorded',
      surrogate: 'Surrogate/family consent recorded',
      presumed: 'Presumed consent recorded',
      declined: 'Patient/family declined'
    };
    lines.push(`Consent status: ${statuses[note.tnkConsentType] || 'Not documented'}`);
  } else {
    lines.push('Consent status: Not documented');
  }
  lines.push(`Contraindication review: ${note.tnkContraindicationReviewed === true ? 'Recorded' : 'Not documented'}`);
  lines.push(`Pre-TNK safety pause: ${note.preTNKSafetyPause === true ? 'Recorded' : 'Not documented'}`);
  return lines.join('\n');
}
