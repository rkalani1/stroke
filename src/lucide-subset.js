const SVG_NS = 'http://www.w3.org/2000/svg';

export const icons = {
  Lock: [["rect",{"x":"3","y":"11","width":"18","height":"11","rx":"2"}],["path",{"d":"M7 11V7a5 5 0 0 1 10 0v4"}]],
  Calculator: [["rect",{"x":"4","y":"2","width":"16","height":"20","rx":"2"}],["path",{"d":"M8 6h8M8 10h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2"}]],
  Sparkles: [["path",{"d":"m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM21 2v4m-2-2h4"}]],
  AlertTriangle: [["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{"d":"M12 9v4"}],["path",{"d":"M12 17h.01"}]],
  ArrowRight: [["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]],
  ExternalLink: [["path",{"d":"M15 3h6v6"}],["path",{"d":"M10 14 21 3"}],["path",{"d":"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}]],
  Info: [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]],
  Link: [["path",{"d":"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"}],["path",{"d":"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"}]],
  ShieldAlert: [["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{"d":"M12 8v4"}],["path",{"d":"M12 16h.01"}]],
  X: [["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]],
};

const BASE_ATTRS = {
  xmlns: SVG_NS,
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

function toPascalCase(name) {
  return String(name || '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function createIcons({ icons: iconMap = icons } = {}) {
  document.querySelectorAll('[data-lucide]').forEach(node => {
    const icon = iconMap[toPascalCase(node.getAttribute('data-lucide'))];
    if (!icon) return;

    const svg = document.createElementNS(SVG_NS, 'svg');
    for (const [key, value] of Object.entries(BASE_ATTRS)) svg.setAttribute(key, value);

    const hasAccessibleLabel = Boolean(
      node.getAttribute('aria-label') ||
      node.getAttribute('aria-labelledby') ||
      node.getAttribute('title')
    );

    const explicitAriaHidden = node.getAttribute('aria-hidden');
    let ariaHiddenVal;
    if (explicitAriaHidden === '' || explicitAriaHidden === 'true') {
      ariaHiddenVal = 'true';
    } else if (explicitAriaHidden === 'false') {
      ariaHiddenVal = 'false';
    } else {
      ariaHiddenVal = hasAccessibleLabel ? 'false' : 'true';
    }
    svg.setAttribute('aria-hidden', ariaHiddenVal);
    svg.setAttribute('focusable', 'false');

    const className = node.getAttribute('class');
    if (className) svg.setAttribute('class', className);

    ['aria-label', 'role', 'aria-labelledby', 'title'].forEach(attr => {
      const val = node.getAttribute(attr);
      if (val) svg.setAttribute(attr, val);
    });

    for (const [tag, attrs] of icon) {
      const child = document.createElementNS(SVG_NS, tag);
      for (const [key, value] of Object.entries(attrs || {})) child.setAttribute(key, String(value));
      svg.appendChild(child);
    }

    node.replaceWith(svg);
  });
}
