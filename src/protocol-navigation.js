// Reveal existing protected content; do not duplicate or rewrite its instructions.
export const PROTOCOL_TARGETS = {
  reversal: { sub: 'ich', heading: 'Anticoagulation Reversal', label: 'Anticoagulant reversal' },
  'post-lytic': { sub: 'ischemic', id: 'isch-postlytic', label: 'Post-lytic hemorrhage' },
  angioedema: { sub: 'ischemic', id: 'isch-angioedema', label: 'Angioedema' },
  bp: { sub: 'ischemic', id: 'isch-bp' },
  'post-evt': { sub: 'ischemic', id: 'isch-postevt' }
};
// Open every collapsed <details> ancestor (and the target itself when it is a
// <details>), then scroll to and focus it. Sticky offsets are applied through the
// target's scroll-margin; this helper never computes pixel offsets.
export function revealProtocolElement(element, { boundary = null, behavior = 'auto' } = {}) {
  if (!element) return false;
  for (let node = element; node && node !== boundary; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  const focus = element.tagName === 'DETAILS' ? element.querySelector('summary') || element : element;
  if (!focus.hasAttribute('tabindex') && focus.tagName !== 'SUMMARY') focus.tabIndex = -1;
  focus.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior });
  return true;
}
export function revealProtocolTarget(key, root = document) {
  const target = PROTOCOL_TARGETS[key];
  if (!target) return false;
  const panel = root.querySelector(`#mgmt-tabpanel-${target.sub}`);
  const element = target.id ? panel?.querySelector(`#${target.id}`) : [...(panel?.querySelectorAll('h3') || [])].find(node => node.textContent.trim() === target.heading);
  if (!element) return false;
  return revealProtocolElement(element, { boundary: panel?.parentElement || null });
}
