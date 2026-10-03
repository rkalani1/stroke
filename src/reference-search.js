// Shared deterministic search. Queries stay in memory and never form URLs.
// Self-contained (no imports): the service worker bundles validReferenceData from this file.
// Filler words dropped from multi-word searches so a whole question still matches.
export const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'and', 'or', 'with', 'when', 'what', 'how', 'is', 'after', 'do', 'i']);
export const CARE_SETTINGS = [['all', 'All settings'], ['on-call', 'On call'], ['hospital', 'Hospital'], ['clinic', 'Clinic']];
// Whole-word clinical aliases, applied to queries and records alike so either spelling matches.
const ALIASES = [
  [/\bafib\b/g, 'atrial fibrillation'],
  [/\b(?:rt ?pa|t ?pa)\b/g, 'alteplase'],
  [/\btnk(?:ase)?\b/g, 'tenecteplase'],
  [/\b(?:doac|noac)s?\b/g, 'direct oral anticoagulant'],
  [/\blvos?\b/g, 'large vessel occlusion'],
  [/\bmevos?\b/g, 'medium vessel occlusion'],
  [/\b(?:evt|mt)\b/g, 'thrombectomy'],
  [/\bivt\b/g, 'thrombolysis']
];
const normalize = value => ALIASES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
export function searchReference(records, query = '', setting = 'all') {
  // Join digit boundaries only for known identifiers, not clinical phrases such as "DAPT 21 days".
  const identifiers = records.filter(record => /\d/.test(record.id)).map(record => {
    const parts = normalize(record.id).match(/[a-z]+|\d+/g);
    return new RegExp(`\\b${parts.map(part => /^\d+$/.test(part) ? '\\d+' : part).join(' *')}\\b`, 'g');
  });
  const searchableText = value => identifiers.reduce((text, pattern) => text.replace(pattern, name => name.replace(/ /g, '')), normalize(value));
  const phrase = searchableText(query), words = phrase.split(' ').filter(Boolean);
  // A whole question ('what is the bp target for ich') matches like its content words.
  const content = words.filter(term => !STOPWORDS.has(term)), terms = words.length > 1 && content.length ? content : words;
  const rank = record => [record.id, record.title, ...record.keywords, ...(record.recommendations || []).map(rec => rec.id)].some(value => searchableText(value) === phrase) ? 2
    : terms.every(term => ` ${searchableText(record.title)} `.includes(` ${term} `)) ? 1 : 0;
  return records.filter(record => {
    if (setting !== 'all' && !record.settings.includes(setting)) return false;
    const searchable = searchableText([record.id, record.title, record.category || '', record.question || '', record.summary || '', ...(record.consider || []), ...(record.recommendations || []).flatMap(rec => [rec.text, rec.id]), record.headline || '', record.population || '', record.comparison || '', record.result || '', ...record.keywords, ...record.sources.map(source => source.title)].join(' '));
    return terms.every(term => searchable.includes(term));
  }).sort((a, b) => terms.length ? rank(b) - rank(a) : 0);
}
// ACC/AHA class (1, 2a, 2b, 3), GRADE strength or an ungraded statement.
export function recommendationLabels(rec) {
  if (/^[123]/.test(rec.cor)) return { cor: `COR ${rec.cor}`, loe: `LOE ${rec.loe}`, tone: rec.cor.startsWith('3') ? /no benefit/i.test(rec.cor) ? 'cor-neutral' : 'cor-3' : `cor-${rec.cor}` };
  if (['Strong', 'Conditional'].includes(rec.cor)) return { cor: rec.cor, loe: `${rec.loe} certainty`, tone: rec.cor === 'Strong' ? 'cor-1' : 'cor-2b' };
  return { cor: rec.cor === 'Statement' ? 'Ungraded statement' : rec.cor, loe: rec.loe === 'Ungraded' ? '' : rec.loe, tone: 'cor-neutral' };
}
export function referenceText(record) {
  const recommendation = rec => { const label = recommendationLabels(rec); return `• ${rec.text} (${[label.cor, label.loe].filter(Boolean).join(', ')}; ${rec.source})`; };
  const recs = (record.recommendations || []).map(recommendation);
  const body = record.summary ? [record.summary, ...(recs.length ? [`Guideline recommendations:\n${recs.join('\n')}`] : []), ...record.consider.map(item => `• ${item}`), `Limits: ${record.caution}`] : [...(record.headline ? [`Key result: ${record.headline}`] : []), `Question: ${record.question}`, `Population: ${record.population}`, `Comparison: ${record.comparison}`, `Result: ${record.result}`, `Limits: ${record.limits}`];
  return [record.title, ...body, ...record.sources.map(source => `${source.title} (${source.year}; ${source.type}). ${source.url}\nSource checked ${source.checkedAt}: ${source.access}`)].join('\n\n');
}
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const id = value => text(value) && /^[a-z0-9-]+$/.test(value);
const https = value => typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value);
// Optional verbatim guideline recommendations on topics.
export const validRecommendations = value => value === undefined || Array.isArray(value) && value.length > 0 && value.every(rec => rec && ['text', 'cor', 'loe', 'source', 'id'].every(field => text(rec[field]))) && new Set(value.map(rec => rec.id)).size === value.length;
export function validCalculatorDefinitions(definitions) {
  return Array.isArray(definitions) && definitions.length > 0 && new Set(definitions.map(record => record?.id)).size === definitions.length && definitions.every(record => record && id(record.id) && ['name', 'category', 'limits', 'sourceLabel', 'reviewScope'].every(key => text(record[key])) && https(record.sourceUrl) && (!record.verificationUrl || https(record.verificationUrl)) && Array.isArray(record.fields) && record.fields.every(field => field && text(field.key) && text(field.label) && ['truth', 'select', 'number'].includes(field.type) && (field.type !== 'select' ? field.options === undefined : Array.isArray(field.options) && field.options.length > 0 && field.options.every(option => Array.isArray(option) && option.length === 2 && option.every(text)))) && (!record.shared || Array.isArray(record.shared) && record.shared.every(key => ['age','sex','bp','mrs','gcs','weight','height','mtici','sahCause'].includes(key))) && (!record.regions || Array.isArray(record.regions) && record.regions.every(region => region && text(region.key) && text(region.label) && [1,2].includes(region.weight))));
}
export function validReferenceData(envelope, version) {
  const data = envelope?.data;
  return envelope?._meta?.appVersion === version && envelope?._meta?.schemaVersion === '2.0.0' && validCalculatorDefinitions(data?.calculators) &&
    ['topics', 'studies'].every(key => Array.isArray(data?.[key]) && data[key].length > 0 && new Set(data[key].map(record => record?.id)).size === data[key].length && data[key].every(record => record && id(record.id) && text(record.title) && strings(record.keywords) && strings(record.settings) && record.settings.length && record.settings.every(setting => ['on-call','hospital','clinic'].includes(setting)) && Array.isArray(record.sources) && record.sources.length && record.sources.every(source => source && ['title','type','checkedAt','access'].every(field => text(source[field])) && Number.isInteger(source.year) && typeof source.url === 'string' && /^https:\/\/[^\s]+$/.test(source.url)) && (key === 'topics' ? text(record.category) && ['summary','caution'].every(field => text(record[field])) && strings(record.consider) && record.consider.length && validRecommendations(record.recommendations) && Array.isArray(record.related) && record.related.every(link => text(link.label) && /^#\/(?:encounter|tools|protocols|evidence|trials)(?:\/[a-z0-9-]+){0,2}$/.test(link.href)) : ['question','population','comparison','result','limits'].every(field => text(record[field])) && (record.headline === undefined || text(record.headline)) && Number.isInteger(record.year) && (record.relatedTopic === '' || id(record.relatedTopic))))) && data.studies.every(study => !data.topics.some(topic => topic.id === study.id)) && data.studies.every(study => study.relatedTopic === '' || data.topics.some(topic => topic.id === study.relatedTopic));
}
