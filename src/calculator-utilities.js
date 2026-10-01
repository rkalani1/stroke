import { supplementaryResult, supplementaryReviewed } from './supplementary-calculators.js';

export const ENCOUNTER_TOOLS = [
  { id:'nihss', name:'NIHSS', aliases:'National Institutes of Health stroke scale neurologic exam' },
  { id:'crcl', name:'Renal calculation', aliases:'creatinine clearance Cockcroft Gault CrCl' },
  { id:'tnk', name:'Lytic dose', aliases:'tenecteplase TNK alteplase tPA thrombolysis' },
  { id:'ich-volume', name:'ICH volume', aliases:'intracerebral hemorrhage ABC 2 ABC/2 hematoma volume' },
  { id:'ich-score', name:'ICH severity', aliases:'intracerebral hemorrhage score' },
  { id:'gcs', name:'GCS', aliases:'Glasgow coma scale' },
  { id:'dawn', name:'Historical source screens', aliases:'DAWN DEFUSE 3 thrombectomy' },
  { id:'dapt', name:'Acute DAPT source screen', aliases:'dual antiplatelet therapy CHANCE POINT' }
];
const aliases = {
  abcd2:'ABCD2 TIA', chadsvasc:'CHA2DS2VASc CHADS VASC atrial fibrillation',
  'has-bled':'HASBLED bleeding', rope:'risk of paradoxical embolism PFO', pascal:'PFO associated stroke causal likelihood',
  phases:'aneurysm', 'mrs-descriptors':'mRS modified Rankin scale disability', 'hunt-hess':'Hunt Hess subarachnoid hemorrhage SAH',
  wfns:'World Federation of Neurosurgical Societies subarachnoid hemorrhage SAH',
  'aspects-regions':'Alberta stroke program early CT score anterior', 'pc-aspects-regions':'posterior circulation ASPECTS',
  phq2:'PHQ2 patient health questionnaire depression', 'stop-bang':'STOPBANG sleep apnea'
};
const searchable = text => String(text || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
export function matchesCalculatorSearch(item, query) {
  const haystack = searchable([item.name, item.id, item.aliases, aliases[item.id], item.category].filter(Boolean).join(' '));
  return String(query || '').trim().split(/\s+/).every(word => haystack.includes(searchable(word)));
}

// Export only the reviewed instrument result and its source context, never an
// Encounter note or the unrelated data used by other worksheets.
export function reviewedCalculatorText(state, definition) {
  if (!supplementaryReviewed(state, definition.id)) return '';
  const value = supplementaryResult(state, definition.id);
  if (!value) return '';
  const result = definition.id === 'mrs-descriptors' ? `Baseline mRS descriptor ${value.score}: ${value.description}`
    : value.category ? `${definition.name} category: ${value.category} (source classification; RoPE ${value.ropeScore}/10).`
    : value.grade !== undefined ? `${definition.name}: ${value.grade}${value.description ? ` — ${value.description}` : ` (GCS ${value.gcs}).`}`
    : `${definition.name}: ${value.score}/${value.max}${definition.id === 'aspects-regions' ? ` (${state.supplementary[definition.id].hemisphere} hemisphere)` : ''}.`;
  return [result, `Limits: ${definition.limits}`, `Source: ${definition.sourceLabel} — ${definition.sourceUrl}`, definition.reviewScope, definition.verificationUrl ? `Verification: ${definition.verificationUrl}` : ''].filter(Boolean).join('\n');
}
