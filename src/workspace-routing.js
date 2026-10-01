const RETAINED_TOOLS = new Set(['nihss', 'gcs', 'ich-score', 'ich-volume', 'crcl', 'aspects', 'pc-aspects', 'alteplase', 'tnk', 'mrs', 'dapt', 'dawn', 'defuse3']);
const ALIASES = { 'alteplase-dose': 'alteplase', 'tnk-dose': 'tnk', 'aspects-pc': 'pc-aspects', 'defuse-3': 'defuse3' };
export function parseWorkspaceRoute(hash = '') {
  const [path] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return { surface: 'encounter' };
  const [first, sub, tool] = parts;
  if (first === 'encounter') {
    if (!sub) return { surface: 'encounter' };
    const id = ALIASES[sub] || sub;
    return RETAINED_TOOLS.has(id) ? { surface: 'encounter', tool: id } : { surface: 'retired', path };
  }
  if (first === 'tools') return { surface: 'tools' };
  if (['protocols', 'management'].includes(first) && (!sub || ['ich', 'ischemic', 'tia'].includes(sub))) return { surface: 'protocols', sub: sub === 'ich' ? 'ich' : 'ischemic' };
  if (first === 'calculators' || ['protocols', 'management', 'research'].includes(first) && sub === 'calculators') {
    const id = ALIASES[first === 'calculators' ? sub : tool] || (first === 'calculators' ? sub : tool);
    if (!id) return { surface: 'tools' };
    return RETAINED_TOOLS.has(id) ? { surface: 'encounter', tool: id } : { surface: 'retired', path };
  }
  return { surface: 'retired', path };
}
