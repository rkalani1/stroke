import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
  };
})();

globalThis.localStorage = localStorageMock;

// Mock document
const documentMock = {
  documentElement: {
    setAttribute: vi.fn(),
    classList: {
      toggle: vi.fn()
    }
  }
};
globalThis.document = documentMock;

describe('theme controller', () => {
  let themeController;

  beforeEach(async () => {
    vi.resetModules();
    themeController = await import('../src/design/theme.js');
    globalThis.localStorage.clear();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost' },
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
    vi.stubGlobal('document', documentMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('runV7Migration', () => {
    it('short-circuits if already migrated', () => {
      globalThis.localStorage.setItem('stroke.v7.migrated', '1');
      globalThis.localStorage.setItem('stroke.v7.theme', 'light');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('light');
    });

    it('clears theme and sets migrated on public GitHub Pages', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'rkalani1.github.io' }
      });
      globalThis.localStorage.setItem('stroke.v7.theme', 'dark');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBeNull();
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
    });

    it('migrates v5 true darkMode bare key to dark theme', () => {
      globalThis.localStorage.setItem('darkMode', 'true');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('dark');
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
    });

    it('migrates v5 true darkMode namespaced key to dark theme', () => {
      globalThis.localStorage.setItem('strokeApp:darkMode', 'true');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('dark');
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
    });

    it('does not migrate if v5 darkMode is false', () => {
      globalThis.localStorage.setItem('darkMode', 'false');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBeNull();
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
    });
  });

  describe('getThemePref and setThemePref', () => {
    it('returns auto by default on non-public pages', () => {
      expect(themeController.getThemePref()).toBe('auto');
    });

    it('returns light by default on public pages', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'rkalani1.github.io' }
      });
      expect(themeController.getThemePref()).toBe('light');
    });

    it('saves theme preference and applies theme', () => {
      themeController.setThemePref('dark');
      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('dark');
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(documentMock.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true);
    });

    it('removes preference key when set to auto', () => {
      globalThis.localStorage.setItem('stroke.v7.theme', 'dark');
      themeController.setThemePref('auto');
      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBeNull();
    });
  });

  describe('effectiveTheme', () => {
    it('returns stored pref if explicitly light or dark', () => {
      globalThis.localStorage.setItem('stroke.v7.theme', 'dark');
      expect(themeController.effectiveTheme()).toBe('dark');

      globalThis.localStorage.setItem('stroke.v7.theme', 'light');
      expect(themeController.effectiveTheme()).toBe('light');
    });

    it('resolves auto mode using matchMedia prefers-color-scheme', () => {
      globalThis.localStorage.setItem('stroke.v7.theme', 'auto');
      vi.stubGlobal('window', {
        location: { hostname: 'localhost' },
        matchMedia: vi.fn(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      });

      expect(themeController.effectiveTheme()).toBe('dark');
    });
  });
});
