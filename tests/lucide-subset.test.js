import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { icons, createIcons } from '../src/lucide-subset.js';

describe('lucide-subset', () => {
  let mockElements = [];

  beforeEach(() => {
    mockElements = [];

    const createMockElement = (tag, ns) => {
      const attributes = {};
      const children = [];
      let replacedWith = null;
      let textContent = '';

      const el = {
        tagName: tag.toUpperCase(),
        namespaceURI: ns,
        getAttribute: vi.fn(key => attributes[key] || null),
        setAttribute: vi.fn((key, value) => {
          attributes[key] = String(value);
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
        },
        get textContent() {
          return textContent;
        },
        set textContent(val) {
          textContent = val;
        }
      };
      return el;
    };

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

    // Add a helper to create mock lucide elements
    globalThis.createMockLucideElement = (iconName, extraAttrs = {}) => {
      const el = createMockElement('i', 'http://www.w3.org/1999/xhtml');
      el.setAttribute('data-lucide', iconName);
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

  describe('icons object', () => {
    it('exports a populated icons object', () => {
      expect(icons).toBeTypeOf('object');
      expect(Object.keys(icons).length).toBeGreaterThan(0);

      // Verify structure of one well known icon
      expect(icons.Activity).toBeDefined();
      expect(Array.isArray(icons.Activity)).toBe(true);
      expect(icons.Activity[0][0]).toBe('path');
      expect(icons.Activity[0][1].d).toBeDefined();
    });
  });

  describe('createIcons', () => {
    it('does nothing if no elements match [data-lucide]', () => {
      createIcons();
      expect(document.querySelectorAll).toHaveBeenCalledWith('[data-lucide]');
      expect(document.createElementNS).not.toHaveBeenCalled();
    });

    it('creates an SVG and replaces the node when a valid icon name is provided', () => {
      const el = globalThis.createMockLucideElement('activity');
      createIcons();

      expect(el.replaceWith).toHaveBeenCalledTimes(1);

      const newSvg = el._replacedWith;
      expect(newSvg).toBeDefined();
      expect(newSvg.tagName).toBe('SVG');
      expect(newSvg.namespaceURI).toBe('http://www.w3.org/2000/svg');

      // Verify base attributes
      expect(newSvg._attributes['width']).toBe('24');
      expect(newSvg._attributes['height']).toBe('24');
      expect(newSvg._attributes['viewBox']).toBe('0 0 24 24');
      expect(newSvg._attributes['fill']).toBe('none');
      expect(newSvg._attributes['stroke']).toBe('currentColor');

      // Verify accessibility attributes fallback
      expect(newSvg._attributes['aria-hidden']).toBe('true');
      expect(newSvg._attributes['focusable']).toBe('false');

      // Verify children (paths)
      expect(newSvg._children.length).toBe(icons.Activity.length);
      expect(newSvg._children[0].tagName).toBe('PATH');
      expect(newSvg._children[0]._attributes['d']).toBe(icons.Activity[0][1].d);
    });

    it('ignores elements if the icon name is not found in the map', () => {
      const el = globalThis.createMockLucideElement('non-existent-icon');
      createIcons();

      expect(document.createElementNS).not.toHaveBeenCalled();
      expect(el.replaceWith).not.toHaveBeenCalled();
    });

    it('preserves existing class attribute on the target node', () => {
      const el = globalThis.createMockLucideElement('heart', { class: 'icon-large text-red-500' });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['class']).toBe('icon-large text-red-500');
    });

    it('preserves existing aria-hidden attribute if provided', () => {
      const el = globalThis.createMockLucideElement('info', { 'aria-hidden': 'false' });
      createIcons();

      const newSvg = el._replacedWith;
      expect(newSvg._attributes['aria-hidden']).toBe('false');
    });

    it('handles multiple elements and pascal-cases the input correctly', () => {
      const el1 = globalThis.createMockLucideElement('alert-circle');
      const el2 = globalThis.createMockLucideElement('alert-triangle');

      createIcons();

      expect(el1._replacedWith._children.length).toBe(icons.AlertCircle.length);
      expect(el2._replacedWith._children.length).toBe(icons.AlertTriangle.length);
    });

    it('allows overriding the icon map via options', () => {
      const customMap = {
        CustomIcon: [["rect", { width: "10", height: "10" }]]
      };

      const el = globalThis.createMockLucideElement('custom-icon');

      createIcons({ icons: customMap });

      const newSvg = el._replacedWith;
      expect(newSvg).toBeDefined();
      expect(newSvg._children.length).toBe(1);
      expect(newSvg._children[0].tagName).toBe('RECT');
      expect(newSvg._children[0]._attributes['width']).toBe('10');
    });
  });
});
