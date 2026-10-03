import { PROTOCOL_TARGETS } from './protocol-navigation.js';
import { ENCOUNTER_DETAIL_GROUPS } from './encounter-details.js';
import { SUPPLEMENTARY_IDS } from './supplementary-calculators.js';
const RETAINED_TOOLS = new Set(['nihss', 'gcs', 'ich-score', 'ich-volume', 'crcl', 'aspects', 'pc-aspects', 'alteplase', 'tnk', 'mrs', 'dapt', 'dawn', 'defuse3']);
const SUPPLEMENTARY_TOOLS = new Set(SUPPLEMENTARY_IDS);
const ALIASES = { tici: 'mtici', 'mod-fisher': 'modified-fisher', 'alteplase-dose': 'alteplase', 'tnk-dose': 'tnk', 'aspects-pc': 'pc-aspects', 'defuse-3': 'defuse3', hasbled: 'has-bled', 'chads2vasc': 'chadsvasc', 'cha2ds2-vasc': 'chadsvasc', 'stopbang': 'stop-bang' };
const toolRoute = (id, path) => RETAINED_TOOLS.has(id) ? { surface: 'encounter', tool: id } : SUPPLEMENTARY_TOOLS.has(id) ? { surface: 'tools', tool: id } : { surface: 'retired', path };
export function parseWorkspaceRoute(hash = '') {
  const [path] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { surface: 'encounter' };
  const [first, sub, tool] = parts;
  if (first === 'encounter') {
    if (!sub) return { surface: 'encounter' };
    if (sub === 'section' && parts.length === 3 && ENCOUNTER_DETAIL_GROUPS.some(group => group.id === tool)) return { surface: 'encounter', section: tool };
    const id = ALIASES[sub] || sub;
    return toolRoute(id, path);
  }
  if (first === 'trials' || first === 'research' && sub === 'trials') {
    const view = first === 'trials' ? sub : tool;
    const focusIndex = first === 'trials' ? 2 : 3;
    const normalized = { active: 'screener', eligibility: 'tables', studies: 'database' }[view] || view || 'screener';
    if (normalized === 'completed') {
      const legacyId = parts[focusIndex];
      const focusId = legacyId?.replace(/^topic-/, '');
      if (parts.length > focusIndex + 1 || legacyId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(focusId)) return { surface: 'retired', path };
      return { surface: 'evidence', ...(focusId ? { focusId } : {}) };
    }
    return parts.length <= focusIndex && ['screener', 'tables', 'database'].includes(normalized) ? { surface: 'trials', sub: normalized } : { surface: 'retired', path };
  }
  if (first === 'evidence' && parts.length <= 2 && (!sub || /^[a-z0-9-]+$/i.test(sub))) return { surface: 'evidence', ...(sub ? { focusId: sub.toLowerCase() } : {}) };
  if (['guidelines', 'references'].includes(first) && !sub || first === 'research' && ['guidelines', 'references'].includes(sub) && !tool) return { surface: 'evidence' };
  if (first === 'tools') return sub ? toolRoute(ALIASES[sub] || sub, path) : { surface: 'tools' };
  if (['protocols', 'management'].includes(first) && (!sub || ['ich', 'ischemic', 'tia'].includes(sub))) {
    const protocol = sub === 'ich' ? 'ich' : 'ischemic';
    if (tool && (parts.length !== 3 || PROTOCOL_TARGETS[tool]?.sub !== protocol)) return { surface: 'retired', path };
    return { surface: 'protocols', sub: protocol, ...(tool ? { target: tool } : {}) };
  }
  if (first === 'calculators' || ['protocols', 'management', 'research'].includes(first) && sub === 'calculators') {
    const id = ALIASES[first === 'calculators' ? sub : tool] || (first === 'calculators' ? sub : tool);
    if (!id) return { surface: 'tools' };
    return toolRoute(id, path);
  }
  return { surface: 'retired', path };
}
