import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { icons, createIcons } from '../src/lucide-subset.js';

describe('lucide-subset empirical stress test suite', () => {
  let mockElements = [];

  const createMockElement = (tag, ns) => {
    const attributes = {};
    const children = [];
    let replacedWith = null;

    const el = {
      tagName: tag.toUpperCase(),
      namespaceURI: ns,
      hasAttribute: vi.fn(key => Object.prototype.hasOwnProperty.call(attributes, key)),
      getAttribute: vi.fn(key => (Object.prototype.hasOwnProperty.call(attributes, key) ? attributes[key] : null)),
      setAttribute: vi.fn((key, value) => {
        attributes[key] = String(value);
      }),
      removeAttribute: vi.fn(key => {
        delete attributes[key];
      }),
      appendChild: vi.fn(child => {
        children.push(child);
      }),
      replaceWith: vi.fn(newEl => {
        replacedWith = newEl;
      }),
      get _attributes() {
        return attributes;
      },
      get _children() {
        return children;
      },
      get _replacedWith() {
        return replacedWith;
      }
    };
    return el;
  };

  beforeEach(() => {
    mockElements = [];

    const documentMock = {
      querySelectorAll: vi.fn((selector) => {
        if (selector === '[data-lucide]') {
          return mockElements;
        }
        return [];
      }),
      createElementNS: vi.fn((ns, tag) => {
        return createMockElement(tag, ns);
      }),
    };

    vi.stubGlobal('document', documentMock);

    globalThis.createMockLucideElement = (iconName, extraAttrs = {}) => {
      const el = createMockElement('i', 'http://www.w3.org/1999/xhtml');
      if (iconName !== undefined && iconName !== null) {
        el.setAttribute('data-lucide', iconName);
      }
      for (const [k, v] of Object.entries(extraAttrs)) {
        el.setAttribute(k, v);
      }
      mockElements.push(el);
      return el;
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete globalThis.createMockLucideElement;
  });

  // --------------------------------------------------------------------------
  // EDGE CASE GROUP 1: WCAG & ARIA Conflict Bugs
  // --------------------------------------------------------------------------
  describe('WCAG & ARIA Conflict Edge Cases', () => {
    it('Sets aria-hidden="false" when aria-label is present without explicit aria-hidden', () => {
      const el = globalThis.createMockLucideElement('activity', {
        'aria-label': 'Heart activity indicator'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-label']).toBe('Heart activity indicator');
      expect(newSvg._attributes['aria-hidden']).toBe('false');
    });

    it('Sets aria-hidden="false" when title is present without explicit aria-hidden', () => {
      const el = globalThis.createMockLucideElement('info', {
        'title': 'Information about clinical trial'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['title']).toBe('Information about clinical trial');
      expect(newSvg._attributes['aria-hidden']).toBe('false');
    });

    it('Sets aria-hidden="false" when role="img" and aria-label are present', () => {
      const el = globalThis.createMockLucideElement('brain', {
        'role': 'img',
        'aria-label': 'Brain diagram'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['role']).toBe('img');
      expect(newSvg._attributes['aria-hidden']).toBe('false');
    });

    it('Handles explicit aria-hidden="false" correctly', () => {
      const el = globalThis.createMockLucideElement('activity', {
        'aria-label': 'Activity indicator',
        'aria-hidden': 'false'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-hidden']).toBe('false');
    });

    it('Handles aria-hidden="" (empty string) by coercing to "true"', () => {
      const el = globalThis.createMockLucideElement('activity', {
        'aria-hidden': ''
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-hidden']).toBe('true');
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASE GROUP 2: Attribute Loss (Non-standard, Custom & Standard HTML attributes)
  // --------------------------------------------------------------------------
  describe('Attribute Loss Edge Cases', () => {
    it('FAILS TO TRANSFER: DOM id attribute', () => {
      const el = globalThis.createMockLucideElement('search', {
        'id': 'global-search-icon'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['id']).toBeUndefined();
    });

    it('FAILS TO TRANSFER: inline style attribute', () => {
      const el = globalThis.createMockLucideElement('search', {
        'style': 'color: red; margin: 4px;'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['style']).toBeUndefined();
    });

    it('FAILS TO TRANSFER: tabindex attribute', () => {
      const el = globalThis.createMockLucideElement('search', {
        'tabindex': '0',
        'aria-label': 'Search button'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['tabindex']).toBeUndefined();
      expect(newSvg._attributes['focusable']).toBe('false'); // Conflicts with interactive tabindex="0"
    });

    it('FAILS TO TRANSFER: data-* custom attributes', () => {
      const el = globalThis.createMockLucideElement('check', {
        'data-testid': 'check-icon-unit',
        'data-state': 'checked'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['data-testid']).toBeUndefined();
      expect(newSvg._attributes['data-state']).toBeUndefined();
    });

    it('FAILS TO TRANSFER: extra aria-* attributes like aria-describedby, aria-expanded, aria-controls', () => {
      const el = globalThis.createMockLucideElement('chevron-down', {
        'aria-describedby': 'tooltip-1',
        'aria-expanded': 'true',
        'aria-controls': 'dropdown-menu'
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-describedby']).toBeUndefined();
      expect(newSvg._attributes['aria-expanded']).toBeUndefined();
      expect(newSvg._attributes['aria-controls']).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASE GROUP 3: Empty Strings & Falsy Values
  // --------------------------------------------------------------------------
  describe('Empty String and Falsy Value Edge Cases', () => {
    it('Ignores empty string values for aria-label, role, aria-labelledby, title, and class', () => {
      const el = globalThis.createMockLucideElement('heart', {
        'aria-label': '',
        'role': '',
        'aria-labelledby': '',
        'title': '',
        'class': ''
      });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-label']).toBeUndefined();
      expect(newSvg._attributes['role']).toBeUndefined();
      expect(newSvg._attributes['aria-labelledby']).toBeUndefined();
      expect(newSvg._attributes['title']).toBeUndefined();
      expect(newSvg._attributes['class']).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASE GROUP 4: Missing, Malformed, and Non-Standard Icon Names
  // --------------------------------------------------------------------------
  describe('Icon Name Normalization and Edge Cases', () => {
    it('Handles data-lucide with multiple consecutive hyphens or leading/trailing hyphens', () => {
      const el = globalThis.createMockLucideElement('--alert---circle--');
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg).toBeDefined();
      expect(newSvg._children.length).toBe(icons.AlertCircle.length);
    });

    it('Fails to match underscore-separated icon names (e.g., alert_circle)', () => {
      const el = globalThis.createMockLucideElement('alert_circle');
      createIcons();

      expect(el.replaceWith).not.toHaveBeenCalled();
    });

    it('Safely handles missing data-lucide attribute (null)', () => {
      const el = createMockElement('i', 'http://www.w3.org/1999/xhtml');
      // No data-lucide set
      mockElements.push(el);

      expect(() => createIcons()).not.toThrow();
      expect(el.replaceWith).not.toHaveBeenCalled();
    });

    it('Safely handles empty data-lucide attribute ("")', () => {
      const el = globalThis.createMockLucideElement('');

      expect(() => createIcons()).not.toThrow();
      expect(el.replaceWith).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASE GROUP 5: Icon SVG Structure & Vector Geometry Integrity
  // --------------------------------------------------------------------------
  describe('Icon Map Integrity & Vector Shapes', () => {
    it('Ensures all exported icons have valid tag names and attribute objects', () => {
      const iconEntries = Object.entries(icons);
      expect(iconEntries.length).toBeGreaterThan(50);

      for (const [name, shapes] of iconEntries) {
        expect(Array.isArray(shapes), `Icon ${name} should be an array`).toBe(true);
        expect(shapes.length, `Icon ${name} should have at least one shape`).toBeGreaterThan(0);

        for (const [tag, attrs] of shapes) {
          expect(typeof tag, `Tag in ${name} should be string`).toBe('string');
          expect(['path', 'circle', 'line', 'rect', 'polyline', 'polygon']).toContain(tag);
          expect(typeof attrs, `Attrs in ${name} should be object`).toBe('object');
        }
      }
    });
  });
});
