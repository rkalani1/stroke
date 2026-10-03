// Reveal existing protected content; do not duplicate or rewrite its instructions.
export const PROTOCOL_TARGETS = {
  reversal: { sub: 'ich', heading: 'Anticoagulation Reversal', label: 'Anticoagulant reversal' },
  'post-lytic': { sub: 'ischemic', id: 'isch-postlytic', label: 'Post-lytic hemorrhage' },
  angioedema: { sub: 'ischemic', id: 'isch-angioedema', label: 'Angioedema' },
  bp: { sub: 'ischemic', id: 'isch-bp', label: 'BP management' },
  'post-evt': { sub: 'ischemic', id: 'isch-postevt', label: 'Post-EVT care' },
  evt: { sub: 'ischemic', id: 'isch-evt', label: 'EVT eligibility' },
  posterior: { sub: 'ischemic', id: 'isch-posterior', label: 'Posterior circulation / basilar EVT' },
  'large-core': { sub: 'ischemic', id: 'isch-largecore', label: 'Large-core EVT' },
  mevo: { sub: 'ischemic', id: 'isch-mevo', label: 'MeVO / distal occlusion' },
  swallow: { sub: 'ischemic', id: 'isch-swallow', label: 'Swallow screen' },
  'ivt-card': { sub: 'ischemic', id: 'pc-ivt', label: 'IVT eligibility card' },
  contraindications: { sub: 'ischemic', id: 'pc-contraindications', label: 'IVT contraindications' },
  'safety-pause': { sub: 'ischemic', id: 'pc-safety-pause', label: 'Safety pause (pre-thrombolytic)' },
  ivh: { sub: 'ich', heading: 'IVH & Hydrocephalus Management', label: 'IVH and hydrocephalus' },
  // Bedside quick-reference cards render above both protocol tabs.
  'qr-dose': { sub: 'ischemic', id: 'qr-dose', label: 'Thrombolytic dose by weight', quick: true },
  'qr-bp': { sub: 'ischemic', id: 'qr-bp', label: 'BP targets by phase', quick: true },
  'qr-reversal': { sub: 'ischemic', id: 'qr-reversal', label: 'Anticoagulant reversal table', quick: true },
  'qr-sich': { sub: 'ischemic', id: 'qr-sich', label: 'Post-thrombolysis symptomatic ICH', quick: true },
  'qr-angioedema': { sub: 'ischemic', id: 'qr-angioedema', label: 'Orolingual angioedema', quick: true },
  'qr-edema': { sub: 'ischemic', id: 'qr-edema', label: 'Malignant edema and decompression', quick: true },
  'qr-supportive': { sub: 'ischemic', id: 'qr-supportive', label: 'AIS supportive care', quick: true },
  // ICH-tab quick cards: only rendered on the ICH tab.
  'qr-ich-surgery': { sub: 'ich', id: 'qr-ich-surgery', label: 'ICH surgical triggers', quick: true, only: 'ich' },
  'qr-sah': { sub: 'ich', id: 'qr-sah', label: 'Aneurysmal SAH: first hour', quick: true, only: 'ich' }
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
  if (target.quick) return revealProtocolElement(root.querySelector(`#${target.id}`));
  const panel = root.querySelector(`#mgmt-tabpanel-${target.sub}`);
  const element = target.id ? panel?.querySelector(`#${target.id}`) : [...(panel?.querySelectorAll('h3') || [])].find(node => node.textContent.trim() === target.heading);
  if (!element) return false;
  return revealProtocolElement(element, { boundary: panel?.parentElement || null });
}
