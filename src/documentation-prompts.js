// Optional editable field scaffolds. Their scope follows the archived IVT/EVT
// discussion and post-treatment documentation topics, without carrying forward
// clinical management instructions or assertions that care occurred.
export const DOCUMENTATION_PROMPTS = [
  {
    id: 'ivt-discussion',
    label: 'IVT discussion',
    target: 'discussionDetails',
    text: `IVT discussion documentation prompts:
Participants: [ ]
Individualized indication / contraindication review discussed: [ ]
Benefits, risks and alternatives discussed: [ ]
Questions, preferences and clinician response: [ ]
Unresolved items: [ ]`
  },
  {
    id: 'evt-discussion',
    label: 'EVT discussion',
    target: 'discussionDetails',
    text: `EVT discussion documentation prompts:
Participants: [ ]
Individualized indication / contraindication review discussed: [ ]
Benefits, risks and alternatives discussed: [ ]
Neurointerventional team discussion: [ ]
Questions, preferences and unresolved items: [ ]`
  },
  {
    id: 'monitoring-documentation',
    label: 'Monitoring documentation',
    target: 'monitoring',
    text: `Monitoring documentation prompts:
Observed course / changes: [ ]
Monitoring ordered or performed (specify which): [ ]
Responsible team and follow-up: [ ]
Unresolved items / escalation plan: [ ]`
  },
  {
    id: 'transfer-handoff',
    label: 'Transfer / handoff',
    target: 'handoff',
    text: `Transfer / handoff documentation prompts:
Sending and receiving teams: [ ]
Information communicated and recipient: [ ]
Transfer arrangements / current status: [ ]
Outstanding items and responsible clinician: [ ]`
  }
];

export function appendDocumentationPrompt(existing, text) {
  const current = typeof existing === 'string' ? existing : '';
  const prompt = typeof text === 'string' ? text : '';
  if (!prompt.trim() || current.includes(prompt)) return current;
  return current ? `${current}\n\n${prompt}` : prompt;
}
