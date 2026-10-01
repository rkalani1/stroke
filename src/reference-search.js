// Shared deterministic search. Queries stay in memory and never form URLs.
export const CARE_SETTINGS = [['all', 'All settings'], ['on-call', 'On call'], ['hospital', 'Hospital'], ['clinic', 'Clinic']];
const normalize = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function searchReference(records, query = '', setting = 'all') {
  const terms = normalize(query).split(' ').filter(Boolean);
  return records.filter(record => (setting === 'all' || record.settings.includes(setting)) && terms.every(term => normalize([record.title, record.question || '', record.summary || '', record.population || '', record.comparison || '', record.result || '', ...record.keywords, ...record.sources.map(source => source.title)].join(' ')).includes(term)));
}
export function referenceText(record) {
  const body = record.summary ? [record.summary, ...record.consider.map(item => `• ${item}`), `Limits: ${record.caution}`] : [`Question: ${record.question}`, `Population: ${record.population}`, `Comparison: ${record.comparison}`, `Result: ${record.result}`, `Limits: ${record.limits}`];
  return [record.title, ...body, ...record.sources.map(source => `${source.title} (${source.year}; ${source.type}). ${source.url}\nSource checked ${source.checkedAt}: ${source.access}`)].join('\n\n');
}
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const id = value => text(value) && /^[a-z0-9-]+$/.test(value);
export function validReferenceData(envelope, version) {
  const data = envelope?.data;
  return envelope?._meta?.appVersion === version && envelope?._meta?.schemaVersion === '2.0.0' &&
    ['topics', 'studies'].every(key => Array.isArray(data?.[key]) && data[key].length > 0 && new Set(data[key].map(record => record?.id)).size === data[key].length && data[key].every(record => record && id(record.id) && text(record.title) && strings(record.keywords) && strings(record.settings) && record.settings.length && record.settings.every(setting => ['on-call','hospital','clinic'].includes(setting)) && Array.isArray(record.sources) && record.sources.length && record.sources.every(source => source && ['title','type','checkedAt','access'].every(field => text(source[field])) && Number.isInteger(source.year) && typeof source.url === 'string' && /^https:\/\/[^\s]+$/.test(source.url)) && (key === 'topics' ? ['summary','caution'].every(field => text(record[field])) && strings(record.consider) && record.consider.length && Array.isArray(record.related) && record.related.every(link => text(link.label) && /^#\/(?:encounter|tools|protocols)(?:\/[a-z0-9-]+){0,2}$/.test(link.href)) : ['question','population','comparison','result','limits'].every(field => text(record[field])) && Number.isInteger(record.year) && id(record.relatedTopic)))) && data.studies.every(study => data.topics.some(topic => topic.id === study.relatedTopic));
}
