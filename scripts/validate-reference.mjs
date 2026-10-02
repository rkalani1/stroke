// Structural/source-access validation only; this does not certify clinical currency.
import { validCalculatorDefinitions } from '../src/reference-search.js';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';

const SETTINGS = new Set(['on-call', 'hospital', 'clinic']);
const SOURCE_TYPES = new Set(['Guideline', 'Scientific statement', 'Science advisory', 'Clinical policy', 'Randomized trial', 'Observational study', 'Meta-analysis', 'Drug label', 'Practice advisory', 'Consensus statement', 'Report', 'Educational resource', 'Policy statement', 'Position statement', 'Performance measures', 'Practice update']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const slug = value => text(value) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const strings = value => Array.isArray(value) && value.every(text);

export function publicSourceUrl(value) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(url.hostname) &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname);
  } catch { return false; }
}

function checkedDate(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= now;
}

export function validateClinicalReference(data, { now = new Date() } = {}) {
  const errors = [];
  if (!data || !['topics', 'studies'].every(key => Array.isArray(data[key]) && data[key].length)) {
    return ['Clinical reference requires nonempty topics and studies arrays'];
  }
  if (!validCalculatorDefinitions(data.calculators)) errors.push('Invalid calculator presentation definitions');
  const ids = new Set();
  const topicIds = new Set(data.topics.map(record => record?.id));
  const studyIds = new Set(data.studies.map(record => record?.id));
  const validYear = value => Number.isInteger(value) && value >= 1900 && value <= now.getUTCFullYear();
  for (const kind of ['topics', 'studies']) for (const record of data[kind]) {
    const name = `${kind}/${record?.id || '(missing id)'}`;
    const fail = message => errors.push(`${name}: ${message}`);
    if (!record || typeof record !== 'object' || Array.isArray(record)) { fail('record must be an object'); continue; }
    if (!slug(record.id)) fail('invalid slug id');
    if (ids.has(record.id)) fail('duplicate id');
    ids.add(record.id);
    if (kind === 'topics' && !text(record.category)) fail('clinical category required');
    if (!text(record.title) || !strings(record.keywords)) fail('title and keyword strings required');
    if (!Array.isArray(record.settings) || !record.settings.length || record.settings.some(setting => !SETTINGS.has(setting)) || new Set(record.settings).size !== record.settings.length) fail('invalid or duplicate care settings');
    if (!Array.isArray(record.sources) || !record.sources.length) fail('at least one source required');
    else for (const source of record.sources) {
      if (!source || !['title', 'access'].every(field => text(source[field])) || !SOURCE_TYPES.has(source.type) || !validYear(source.year)) fail('incomplete source identity, type, year or access scope');
      if (!publicSourceUrl(source?.url)) fail('source URL must be public HTTPS without credentials');
      if (!checkedDate(source?.checkedAt, now)) fail('source checkedAt must be a valid, nonfuture date');
    }
    if (kind === 'topics') {
      if (!['summary', 'caution'].every(field => text(record[field])) || !strings(record.consider) || record.consider.length < 2 || record.consider.length > 4) fail('summary, caution and 2–4 review questions required');
      if (!Array.isArray(record.related)) fail('related routes must be an array');
      else for (const link of record.related) {
        const href = link?.href;
        // Constrain complete paths before parsing; legacy parsers accept some extra segments.
        const shape = typeof href === 'string' && /^#\/(?:encounter(?:\/[a-z0-9-]+|\/section\/[a-z0-9-]+)?|tools(?:\/[a-z0-9-]+)?|protocols(?:\/(?:ischemic|ich)(?:\/[a-z0-9-]+)?)?|evidence(?:\/[a-z0-9-]+)?|trials(?:\/(?:screener|tables|database|completed(?:\/[a-z0-9-]+)?))?)$/.test(href);
        const route = shape ? parseWorkspaceRoute(href) : null;
        if (!text(link?.label) || !route || route.surface === 'retired' || (route.surface === 'evidence' && route.focusId && !topicIds.has(route.focusId) && !studyIds.has(route.focusId)) || (route.surface === 'trials' && route.focusId && !studyIds.has(route.focusId))) fail(`unknown or unsafe related route ${String(href)}`);
      }
    } else {
      if (!['question', 'population', 'comparison', 'result', 'limits'].every(field => text(record[field])) || !validYear(record.year)) fail('study year, population, comparison, result and limits required');
      if (typeof record.relatedTopic !== 'string' || (record.relatedTopic !== '' && !topicIds.has(record.relatedTopic))) fail('relatedTopic must identify a topic or be empty');
    }
  }
  return errors;
}
