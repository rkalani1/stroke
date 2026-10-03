import { supplementaryResult } from './supplementary-calculators.js';
import { numericInput, reviewedGcs } from './encounter-clinical-review.js';

export const ENCOUNTER_TOOLS = [
  { id:'nihss', name:'NIHSS', aliases:'National Institutes of Health stroke scale neurologic exam' },
  { id:'crcl', name:'Renal calculation', aliases:'creatinine clearance Cockcroft Gault CrCl' },
  { id:'tnk', name:'Lytic dose', aliases:'tenecteplase TNK alteplase tPA thrombolysis' },
  { id:'ich-volume', name:'ICH volume', aliases:'intracerebral hemorrhage ABC 2 ABC/2 hematoma volume' },
  { id:'ich-score', name:'ICH severity', aliases:'intracerebral hemorrhage score' },
  { id:'gcs', name:'GCS', aliases:'Glasgow coma scale' },
  { id:'dawn', name:'Historical source screens', aliases:'DAWN DEFUSE 3 thrombectomy EVT large core SELECT2 ANGEL ASPECT RESCUE Japan LIMIT TENSION TESLA LASTE' },
  { id:'dapt', name:'Acute DAPT source screen', aliases:'dual antiplatelet therapy CHANCE POINT' }
];
const aliases = {
  abcd2:'ABCD2 TIA', chadsvasc:'CHA2DS2VASc CHADS VASC atrial fibrillation',
  'has-bled':'HASBLED bleeding', rope:'risk of paradoxical embolism PFO', pascal:'PFO associated stroke causal likelihood',
  phases:'aneurysm', 'mrs-descriptors':'mRS modified Rankin scale disability', 'hunt-hess':'Hunt Hess subarachnoid hemorrhage SAH',
  wfns:'World Federation of Neurosurgical Societies subarachnoid hemorrhage SAH',
  'modified-fisher':'modified Fisher CT blood subarachnoid hemorrhage SAH IVH', mtici:'TICI reperfusion thrombectomy angiography', nascet:'carotid stenosis ICA diameter',
  'aspects-regions':'Alberta stroke program early CT score anterior', 'pc-aspects-regions':'posterior circulation ASPECTS basilar vertebrobasilar',
  phq2:'PHQ2 patient health questionnaire depression', 'stop-bang':'STOPBANG sleep apnea'
};
const searchable = text => String(text || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
export function matchesCalculatorSearch(item, query) {
  const haystack = searchable([item.name, item.id, item.aliases, aliases[item.id], item.category].filter(Boolean).join(' '));
  return String(query || '').trim().split(/\s+/).every(word => haystack.includes(searchable(word)));
}

// Display and copy share one formatter so the copied figure always matches the
// figure on screen. No interpretation band is added beyond the definitions.
export function calculatorResultParts(state, definition, value = supplementaryResult(state, definition.id)) {
  if (!value) return null;
  const data = state.supplementary?.[definition.id] || {};
  if (definition.id === 'mrs-descriptors') return { figure:`mRS ${value.score}`, detail:value.description, text:`Baseline mRS descriptor ${value.score}: ${value.description}` };
  if (value.category) return { figure:value.category, detail:`Source classification · RoPE ${value.ropeScore}/10`, text:`${definition.name} category: ${value.category} (source classification; RoPE ${value.ropeScore}/10).` };
  if (value.grade !== undefined) return { figure:String(value.grade), detail:value.description || `GCS ${value.gcs}`,
    text:`${definition.name}: ${value.grade}${value.description ? ` — ${value.description}` : ` (GCS ${value.gcs}).`}` };
  const figure = value.unit ? `${value.score}${value.unit}` : `${value.score}/${value.max}`;
  const qualifier = definition.id === 'aspects-regions' ? `${data.hemisphere} hemisphere` : definition.id === 'nascet' ? `${data.side} ICA` : '';
  const detail = qualifier ? qualifier.replace(/^./, letter => letter.toUpperCase()) : value.bmi === undefined ? '' : `BMI ${value.bmi.toFixed(1)} kg/m²`;
  return { figure, detail, text:`${definition.name}: ${figure}${qualifier ? ` (${qualifier})` : ''}.` };
}

// Export only the complete instrument result and its source context, never an
// Encounter note or the unrelated data used by other worksheets. The name is
// retained for importers; copying needs a complete score, not an attestation.
export function reviewedCalculatorText(state, definition) {
  const parts = calculatorResultParts(state, definition);
  if (!parts) return '';
  return [parts.text, `Limits: ${definition.limits}`, `Source: ${definition.sourceLabel} — ${definition.sourceUrl}`, definition.reviewScope, definition.verificationUrl ? `Verification: ${definition.verificationUrl}` : ''].filter(Boolean).join('\n');
}

const SHARED_LABELS = { age:'age', sex:'sex', bp:'presenting BP', mrs:'baseline mRS', gcs:'complete GCS', weight:'weight', height:'height', mtici:'mTICI grade', sahCause:'SAH cause' };
const filled = value => value !== undefined && value !== null && String(value).trim() !== '';
function sharedDocumented(state, key) {
  const n = state.note || {};
  if (key === 'gcs') return reviewedGcs(state.gcs || {}) !== null;
  if (key === 'sex') return ['M','F'].includes(n.sex);
  return filled(({ age:n.age, bp:n.presentingBP, mrs:n.premorbidMRS, weight:n.weight, height:n.heightCm, mtici:n.ticiScore, sahCause:state.details?.sahCause })[key]);
}
function itemAnswered(field, value) {
  if (field.type === 'truth') return typeof value === 'boolean';
  if (field.options) return field.options.some(([key]) => String(key) === value);
  return filled(value);
}
// Applicability items whose answer, when contrary, leaves the source population.
const APPLICABILITY = { tiaConfirmed:true, afConfirmed:true, cryptogenicStrokeWithPfo:true, unrupturedSaccular:true, sahConfirmed:true, patentExtracranialICA:true, nearOcclusion:false };
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function blockedReason(state, definition, data) {
  const n = state.note || {};
  const contrary = (definition.fields || []).find(field => Object.hasOwn(APPLICABILITY, field.key) && data[field.key] !== APPLICABILITY[field.key]);
  if (contrary) return `Not scored: ${contrary.label} — ${data[contrary.key] ? 'Yes' : 'No'}.`;
  if (definition.shared?.includes('age') && numericInput(n.age, { min:18, max:120, integer:true }) === null) return 'Not scored: Encounter age must be a whole number from 18 to 120.';
  if (definition.id === 'mtici' && !(state.context === 'acute' && n.diagnosisCategory === 'ischemic')) return 'Acute ischemic Encounter only.';
  if (definition.id === 'modified-fisher' && !(n.diagnosisCategory === 'sah' && state.details?.sahCause === 'Aneurysmal')) return 'Aneurysmal SAH only: set diagnosis and SAH cause in Encounter.';
  if (definition.id === 'pascal' && numericInput(n.age, { min:18, max:120, integer:true }) > 60) return 'Not scored: source population is aged 18–60.';
  if (definition.id === 'wfns' && reviewedGcs(state.gcs || {}) === 15 && data.motorDeficit === true) return 'GCS 15 with motor deficit has no WFNS category in the original table; grade clinically.';
  if (definition.id === 'nascet' && Number(data.minimumDiameterMm) > Number(data.distalDiameterMm)) return 'Not scored: residual lumen exceeds the distal diameter.';
  return 'Not scored: check the entered values.';
}

// Progress for the live result. Pending states name what is outstanding; they
// never show a partial sum as if it were the final score.
export function calculatorProgress(state, definition) {
  const data = state.supplementary?.[definition.id] || {};
  const value = supplementaryResult(state, definition.id);
  const items = [...(definition.fields || []).map(field => itemAnswered(field, data[field.key])),
    ...(definition.regions || []).map(region => typeof data.regions?.[region.key] === 'boolean')];
  const unanswered = items.filter(answered => !answered).length;
  const missing = (definition.shared || []).filter(key => !sharedDocumented(state, key)).map(key => SHARED_LABELS[key] || key);
  const prerequisite = definition.id === 'pascal' && !supplementaryResult(state, 'rope') ? 'RoPE worksheet incomplete' : '';
  if (value) return { complete:true, value, unanswered:0, total:items.length, status:'' };
  const pending = [unanswered ? `${plural(unanswered, 'item')} unanswered` : '', missing.length ? `Encounter ${missing.join(', ')} missing` : '', prerequisite].filter(Boolean);
  return { complete:false, value:null, unanswered, total:items.length, missing, status:pending.length ? pending.join(' · ') : blockedReason(state, definition, data), blocked:!pending.length };
}
