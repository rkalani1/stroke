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

    it('clears legacy darkMode and sets migrated on public GitHub Pages without wiping v7 pref', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'rkalani1.github.io' }
      });
      globalThis.localStorage.setItem('darkMode', 'true');
      globalThis.localStorage.setItem('strokeApp:darkMode', 'true');
      globalThis.localStorage.setItem('stroke.v7.theme', 'dark');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('darkMode')).toBeNull();
      expect(globalThis.localStorage.getItem('strokeApp:darkMode')).toBeNull();
      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('dark');
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

    it('does not overwrite existing theme preference during migration', () => {
      globalThis.localStorage.setItem('darkMode', 'true');
      globalThis.localStorage.setItem('stroke.v7.theme', 'light');

      themeController.runV7Migration();

      expect(globalThis.localStorage.getItem('stroke.v7.theme')).toBe('light');
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
    });

    it('safely handles localStorage quota or access exceptions in safeSet', () => {
      globalThis.localStorage.setItem('darkMode', 'true');

      // Make localStorage.setItem throw for all calls during migration
      globalThis.localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => themeController.runV7Migration()).not.toThrow();
    });

    it('safely handles localStorage access exceptions in safeGet', () => {
      globalThis.localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('AccessDeniedError');
      });

      expect(() => themeController.runV7Migration()).not.toThrow();
    });

    it('safely handles localStorage access exceptions in safeJSONGet', () => {
      // Mock getItem to return an invalid JSON string to trigger JSON.parse error
      globalThis.localStorage.getItem.mockImplementationOnce((key) => {
        if (key === 'darkMode') return 'invalid-json';
        return null;
      });

      expect(() => themeController.runV7Migration()).not.toThrow();

      // Also test when getItem itself throws
      globalThis.localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('AccessDeniedError');
      });
      expect(() => themeController.runV7Migration()).not.toThrow();
    });

    it('safely handles localStorage removeItem exceptions on public pages', () => {
      vi.stubGlobal('window', {
        location: { hostname: 'rkalani1.github.io' }
      });

      globalThis.localStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('AccessDeniedError');
      });

      expect(() => themeController.runV7Migration()).not.toThrow();
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

  describe('bindThemeListener and bootstrapTheme', () => {
    it('bindThemeListener adds and returns removeEventListener for matchMedia', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      vi.stubGlobal('window', {
        location: { hostname: 'localhost' },
        matchMedia: vi.fn(() => ({
          matches: false,
          addEventListener,
          removeEventListener
        }))
      });

      const unbind = themeController.bindThemeListener();
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unbind();
      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('bindThemeListener does nothing if window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const unbind = themeController.bindThemeListener();
      expect(typeof unbind).toBe('function');
      unbind(); // Should not throw
    });

    it('bootstrapTheme calls runV7Migration, applyTheme, and bindThemeListener', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      vi.stubGlobal('window', {
        location: { hostname: 'localhost' },
        matchMedia: vi.fn(() => ({
          matches: false,
          addEventListener,
          removeEventListener
        }))
      });

      globalThis.localStorage.setItem('darkMode', 'true'); // setup migration trigger

      const unbind = themeController.bootstrapTheme();

      // Checking migration ran
      expect(globalThis.localStorage.getItem('stroke.v7.migrated')).toBe('1');
      // Checking applyTheme ran
      expect(documentMock.documentElement.setAttribute).toHaveBeenCalled();
      // Checking bindThemeListener ran
      expect(typeof unbind).toBe('function');
    });
  });
});
