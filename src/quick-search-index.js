// Global quick search. Pure and deterministic: the index is built from the
// shipped navigation targets and the versioned reference download. Queries
// stay in memory; nothing here reads or writes Encounter values.
import { ENCOUNTER_TOOLS } from './calculator-utilities.js';
import { PROTOCOL_TARGETS } from './protocol-navigation.js';

const normalize = value => String(value || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/₂/g, '2').replace(/²/g, '2').replace(/[^a-z0-9]+/g, ' ').trim()
  .replace(/\bafib\b/g, 'atrial fibrillation').replace(/\btpa\b/g, 'alteplase');
const compact = value => normalize(value).replace(/ /g, '');

export const SEARCH_GROUPS = ['Go to', 'Protocols', 'Calculators', 'Evidence', 'Studies', 'Trials', 'External'];

const NAVIGATION = [
  { title: 'Encounter', href: '#/encounter', keywords: 'consult case workspace note' },
  { title: 'Context, baseline & timing', href: '#/encounter', focus: 'context-title', keywords: 'LKW last known well onset age weight diagnosis mRS' },
  { title: 'Examination & imaging', href: '#/encounter', focus: 'exam-title', keywords: 'NIHSS BP blood pressure glucose CT CTA perfusion ASPECTS vessel' },
  { title: 'Safety & decision review', href: '#/encounter', focus: 'safety-title', keywords: 'contraindications anticoagulant DOAC thrombolysis decision EVT IVT' },
  { title: 'Documentation & handoff', href: '#/encounter', focus: 'handoff-title', keywords: 'note Pulsara Epic summary copy handoff consent disposition' },
  { title: 'Protocols · Ischemic stroke / TIA', href: '#/protocols/ischemic', keywords: 'pathway algorithm AIS' },
  { title: 'Protocols · Intracerebral hemorrhage', href: '#/protocols/ich', keywords: 'ICH hemorrhage pathway algorithm' },
  { title: 'Trials · screener', href: '#/trials', keywords: 'study enrollment research' },
  { title: 'Trials · eligibility tables', href: '#/trials/tables', keywords: 'inclusion exclusion criteria' },
  { title: 'Trials · database', href: '#/trials/database', keywords: 'registry NCT' },
  { title: 'Evidence', href: '#/evidence', keywords: 'guidelines statements topics studies' },
  { title: 'Calculators', href: '#/tools', keywords: 'scores scales tools' }
];

const EXTERNAL = [
  { title: 'Telestroke Map', href: 'https://rkalani1.github.io/telestroke-expansion-map/', keywords: 'sites hospitals network map' },
  { title: 'UpToDate', href: 'https://www.uptodate.com/', keywords: 'reference' },
  { title: 'OpenEvidence', href: 'https://www.openevidence.com/', keywords: 'reference AI' }
];

const PROTOCOL_KEYWORDS = {
  'qr-dose': 'tenecteplase alteplase TNK tPA thrombolytic dose weight table bolus infusion mL',
  'qr-bp': 'blood pressure targets 185/110 180/105 labetalol nicardipine clevidipine post-EVT ICH SAH',
  'qr-reversal': 'anticoagulant reversal 4F-PCC PCC Kcentra idarucizumab Praxbind protamine vitamin K warfarin apixaban rivaroxaban edoxaban dabigatran heparin enoxaparin andexanet antiplatelet',
  'qr-sich': 'symptomatic hemorrhage after thrombolysis sICH cryoprecipitate tranexamic acid TXA fibrinogen',
  'qr-angioedema': 'orolingual angioedema icatibant epinephrine methylprednisolone diphenhydramine airway ACE inhibitor',
  'qr-edema': 'malignant MCA edema hemicraniectomy decompression cerebellar infarct suboccipital EVD osmotherapy',
  'qr-supportive': 'supportive care oxygen glucose temperature fever dysphagia swallow VTE seizure prophylaxis',
  reversal: 'anticoagulant reversal 4F-PCC PCC Kcentra idarucizumab Praxbind protamine vitamin K warfarin apixaban rivaroxaban dabigatran heparin',
  'post-lytic': 'symptomatic hemorrhage sICH cryoprecipitate tranexamic acid TXA bleeding after thrombolysis',
  angioedema: 'orolingual angioedema airway icatibant',
  bp: 'blood pressure targets labetalol nicardipine clevidipine 185/110 180/105',
  'post-evt': 'after thrombectomy blood pressure reperfusion TICI'
};

// Quick-reference cards render on both protocol tabs; `protocolSub` keeps an ICH
// encounter on its own tab when a card is opened from search.
export function buildSearchIndex(reference, { protocolSub = 'ischemic' } = {}) {
  const records = [];
  NAVIGATION.forEach(item => records.push({ ...item, group: 'Go to', id: `nav:${item.title}` }));
  Object.entries(PROTOCOL_TARGETS).forEach(([key, target]) => records.push({
    id: `protocol:${key}`, group: 'Protocols', title: target.label || target.heading || key,
    subtitle: target.quick ? 'Quick reference' : target.sub === 'ich' ? 'ICH protocol' : 'Ischemic protocol',
    href: `#/protocols/${target.quick ? protocolSub : target.sub}/${key}`, keywords: PROTOCOL_KEYWORDS[key] || ''
  }));
  ENCOUNTER_TOOLS.forEach(tool => records.push({ id: `tool:${tool.id}`, group: 'Calculators', title: tool.name, subtitle: 'Encounter', href: `#/encounter/${tool.id}`, keywords: tool.aliases }));
  (reference?.calculators || []).forEach(calc => records.push({ id: `calc:${calc.id}`, group: 'Calculators', title: calc.name, subtitle: calc.category, href: `#/tools/${calc.id}`, keywords: [calc.id, calc.category, ...(calc.aliases ? [calc.aliases] : [])].join(' ') }));
  (reference?.topics || []).forEach(topic => records.push({ id: `topic:${topic.id}`, group: 'Evidence', title: topic.title, subtitle: topic.category, href: `#/evidence/${topic.id}`, keywords: [topic.id, ...(topic.keywords || [])].join(' '), body: topic.summary }));
  (reference?.studies || []).forEach(study => records.push({ id: `study:${study.id}`, group: 'Studies', title: study.title, subtitle: String(study.year || ''), href: `#/evidence/${study.id}`, keywords: [study.id, ...(study.keywords || [])].join(' '), body: [study.question, study.population, study.result].join(' ') }));
  (reference?.trials || []).forEach(trial => records.push({ id: `trial:${trial.acronym}`, group: 'Trials', title: trial.acronym, subtitle: trial.subtitle || '', href: '#/trials/database', keywords: [trial.nct, trial.keywords].filter(Boolean).join(' ') }));
  EXTERNAL.forEach(item => records.push({ ...item, group: 'External', id: `ext:${item.title}`, external: true }));
  return records.map(record => ({ ...record, _title: normalize(record.title), _titleCompact: compact(record.title), _keys: normalize(record.keywords), _keysCompact: compact(record.keywords), _body: normalize(record.body) }));
}

// Every term must match the title, keywords or summary text. Ranking favours
// exact names, then title prefixes, title words, keywords and body text.
export function searchIndex(index, query, limit = 40) {
  const phrase = normalize(query);
  if (!phrase) return [];
  const terms = phrase.split(' ');
  const phraseCompact = phrase.replace(/ /g, '');
  const scored = [];
  for (const record of index) {
    let score = 0;
    for (const term of terms) {
      const termScore = ` ${record._title} `.includes(` ${term} `) ? 6
        : record._title.startsWith(term) || record._title.includes(` ${term}`) ? 5
          : record._title.includes(term) || record._titleCompact.includes(term) ? 3
            : ` ${record._keys} `.includes(` ${term} `) || record._keysCompact.includes(term) ? 3
              : record._keys.includes(term) ? 2
                : record._body.includes(term) ? 1 : 0;
      if (!termScore) { score = 0; break; }
      score += termScore;
    }
    if (!score) continue;
    if (record._title === phrase || record._titleCompact === phraseCompact) score += 20;
    else if (record._title.startsWith(phrase)) score += 8;
    if (record.group === 'Go to' || record.group === 'Protocols' || record.group === 'Calculators') score += 1;
    scored.push([score, record]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).slice(0, limit).map(([, record]) => record);
}

// Groups keep the predictable SEARCH_GROUPS order, except that the group holding
// the single best match leads so Enter opens it. Long result sets show the top few
// per group and report how many are hidden ([group, shown, hiddenCount]).
export function groupResults(results, { perGroup = 5, expanded = [] } = {}) {
  const lead = results[0]?.group;
  const capped = results.length > 12;
  return SEARCH_GROUPS.map(group => [group, results.filter(record => record.group === group)])
    .filter(([, items]) => items.length)
    .sort(([a], [b]) => (b === lead) - (a === lead))
    .map(([group, items]) => {
      const shown = capped && !expanded.includes(group) ? items.slice(0, perGroup) : items;
      return [group, shown, items.length - shown.length];
    });
}
