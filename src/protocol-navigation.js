// Reveal existing protected content; do not duplicate or rewrite its instructions.
export const PROTOCOL_TARGETS = {
  reversal: { sub: 'ich', heading: 'Anticoagulation Reversal', label: 'Anticoagulant reversal' },
  'post-lytic': { sub: 'ischemic', id: 'isch-postlytic', label: 'Post-lytic hemorrhage' },
  angioedema: { sub: 'ischemic', id: 'isch-angioedema', label: 'Angioedema' },
  bp: { sub: 'ischemic', id: 'isch-bp' },
  'post-evt': { sub: 'ischemic', id: 'isch-postevt' }
};
export function revealProtocolTarget(key, root = document) {
  const target = PROTOCOL_TARGETS[key];
  if (!target) return false;
  const panel = root.querySelector(`#mgmt-tabpanel-${target.sub}`);
  const element = target.id ? panel?.querySelector(`#${target.id}`) : [...(panel?.querySelectorAll('h3') || [])].find(node => node.textContent.trim() === target.heading);
  if (!element) return false;
  for (let node = element; node && node !== panel?.parentElement; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  const focus = element.tagName === 'DETAILS' ? element.querySelector('summary') : element;
  if (!focus.hasAttribute('tabindex') && focus.tagName !== 'SUMMARY') focus.tabIndex = -1;
  focus.focus({ preventScroll: true }); element.scrollIntoView({ block: 'start' });
  return true;
}
