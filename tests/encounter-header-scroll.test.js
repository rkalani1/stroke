import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const body = source.match(/const syncMobileHeader = \(\) => \{([\s\S]*?)\n            \};\n            syncMobileHeader\(\);/)?.[1];
if (!body) throw new Error('Actual mobile header callback was not found');

function evaluate({ current = false, mobile = true, encounter = true, top, y = 0, main = true } = {}) {
  let result = current;
  const window = { matchMedia: () => ({ matches: mobile }), scrollY: y };
  const document = { getElementById: (id) => id === 'tabpanel-encounter'
    ? (encounter ? {} : null)
    : id === 'main' && main ? { getBoundingClientRect: () => ({ top }) } : null };
  new Function('window', 'document', 'setMobileHeaderCompact', body)(window, document, (updater) => { result = updater(result); });
  return result;
}

describe('Encounter mobile header avoids scroll anchoring feedback', () => {
  it('does not toggle for the observed expanded/anchored scroll positions', () => {
    let current = false;
    // Baseline raw scrollY oscillated 183↔67 while the content stayed at
    // approximately the same viewport position after native scroll anchoring.
    for (let i = 0; i < 30; i++) {
      current = evaluate({ current, y: i % 2 ? 67 : 183, top: i % 2 ? 17.78 : 18.20 });
      expect(current).toBe(false);
    }
  });

  it('keeps a compact header stable through anchored scroll changes below its content threshold', () => {
    let current = false;
    for (const input of [{ y: 220, top: -18 }, { y: 104, top: -17.6 }, { y: 220, top: -18 }]) {
      current = evaluate({ ...input, current });
      expect(current).toBe(true);
    }
  });

  it.each([
    [false, -0.1, true], [false, 0, false], [false, 11.9, false],
    [true, 0, true], [true, 11.9, true], [true, 12, false],
    [true, 201, false],
  ])('applies a small content-position hysteresis band (%s, %s)', (current, top, expected) => {
    expect(evaluate({ current, top, y: 150 })).toBe(expected);
  });

  it.each([false, true])('never compacts a desktop header, prior state %s', (current) => {
    expect(evaluate({ current, mobile: false, top: -1000, y: 1000 })).toBe(false);
  });

  it.each([-1, 0, 71, 72, 72.1, 183, 1000])('preserves the legacy non-Encounter threshold at scrollY %s', (y) => {
    for (const current of [false, true]) {
      for (const top of [-500, 0, 500]) {
        expect(evaluate({ encounter: false, current, top, y })).toBe(y > 72);
        expect(evaluate({ encounter: false, current, top, y, mobile: false })).toBe(false);
      }
    }
  });

  it.each([NaN, Infinity, undefined])('falls back safely when content geometry is unavailable: %s', (top) => {
    expect(evaluate({ top, y: 73 })).toBe(true);
    expect(evaluate({ top, y: 72 })).toBe(false);
  });

  it('preserves the original listener lifecycle outside the Encounter callback', () => {
    const start = source.indexOf('const syncMobileHeader =');
    const effect = source.slice(start, source.indexOf('\n          useEffect(', start));
    expect(effect).toContain("window.addEventListener('scroll', syncMobileHeader, { passive: true })");
    expect(effect).toContain("window.removeEventListener('scroll', syncMobileHeader)");
    expect(effect).toContain("window.removeEventListener('resize', syncMobileHeader)");
    expect(effect).toContain('}, []);');
  });
});
