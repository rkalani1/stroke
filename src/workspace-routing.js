import { SUPPLEMENTARY_IDS } from './supplementary-calculators.js';
const RETAINED_TOOLS = new Set(['nihss', 'gcs', 'ich-score', 'ich-volume', 'crcl', 'aspects', 'pc-aspects', 'alteplase', 'tnk', 'mrs', 'dapt', 'dawn', 'defuse3']);
const SUPPLEMENTARY_TOOLS = new Set(SUPPLEMENTARY_IDS);
const ALIASES = { 'alteplase-dose': 'alteplase', 'tnk-dose': 'tnk', 'aspects-pc': 'pc-aspects', 'defuse-3': 'defuse3', hasbled: 'has-bled', 'chads2vasc': 'chadsvasc', 'cha2ds2-vasc': 'chadsvasc', 'stopbang': 'stop-bang' };
const toolRoute = (id, path) => RETAINED_TOOLS.has(id) ? { surface: 'encounter', tool: id } : SUPPLEMENTARY_TOOLS.has(id) ? { surface: 'tools', tool: id } : { surface: 'retired', path };
export function parseWorkspaceRoute(hash = '') {
  const [path] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { surface: 'encounter' };
  const [first, sub, tool] = parts;
  if (first === 'encounter') {
    if (!sub) return { surface: 'encounter' };
    const id = ALIASES[sub] || sub;
    return toolRoute(id, path);
  }
  if (first === 'trials' || first === 'research' && sub === 'trials') {
    const view = first === 'trials' ? sub : tool;
    const normalized = { active: 'screener', eligibility: 'tables', studies: 'database' }[view] || view || 'screener';
    return ['screener', 'tables', 'database'].includes(normalized) ? { surface: 'trials', sub: normalized } : { surface: 'retired', path };
  }
  if (first === 'tools') return sub ? toolRoute(ALIASES[sub] || sub, path) : { surface: 'tools' };
  if (['protocols', 'management'].includes(first) && (!sub || ['ich', 'ischemic', 'tia'].includes(sub))) return { surface: 'protocols', sub: sub === 'ich' ? 'ich' : 'ischemic' };
  if (first === 'calculators' || ['protocols', 'management', 'research'].includes(first) && sub === 'calculators') {
    const id = ALIASES[first === 'calculators' ? sub : tool] || (first === 'calculators' ? sub : tool);
    if (!id) return { surface: 'tools' };
    return toolRoute(id, path);
  }
  return { surface: 'retired', path };
}
