import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

describe('Milestone M3-1: Interactive Lightbox & Visual Asset Integration', () => {
  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const componentsPath = path.join(repoRoot, 'src/components.jsx');
  const educationPath = path.join(repoRoot, 'src/education.jsx');
  const serviceWorkerPath = path.join(repoRoot, 'service-worker.js');

  const componentsContent = fs.readFileSync(componentsPath, 'utf-8');
  const educationContent = fs.readFileSync(educationPath, 'utf-8');
  const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf-8');

  it('exports InteractiveImageLightbox with WCAG 2.1 AA dialog role and controls', () => {
    expect(componentsContent).toContain('export const InteractiveImageLightbox');
    expect(componentsContent).toContain('role="dialog"');
    expect(componentsContent).toContain('aria-modal="true"');
    expect(componentsContent).toContain('createPortal');
    expect(componentsContent).toContain('bg-white/90');
    expect(componentsContent).toContain('dark:bg-slate-900/90');
    expect(componentsContent).toContain('Zoom In (+)');
    expect(componentsContent).toContain('Zoom Out (-)');
    expect(componentsContent).toContain('Reset Zoom (0)');
    expect(componentsContent).toContain('Escape');
  });

  it('exports VisualAssetFigure with figure role group and fallback svg support', () => {
    expect(componentsContent).toContain('export const VisualAssetFigure');
    expect(componentsContent).toContain('role="group"');
    expect(componentsContent).toContain('aria-labelledby={captionId}');
    expect(componentsContent).toContain('figcaption');
    expect(componentsContent).toContain('fallbackSvgSrc');
    expect(componentsContent).toContain('onError');
  });

  // Reviewed external TOAST, AF, SeLECT, ICH/core, EVT, DAPT and ASPECTS figures were withdrawn.
  // Their names must remain in the service-worker denylist, but never in its precache.
  const WITHDRAWN_FIGURE_PATHS = [
    ...[
      'toast_classification_infographic', 'afib_timing_protocol', 'select_score_chart',
      'dapt_flowchart_timeline', 'ischemic_core_penumbra_render', 'aspects_10_regions_render',
      'evt_lvo_occlusion_sites', 'hematoma_expansion_render',
    ].flatMap(stem => ['png', 'svg'].map(ext => `assets/${stem}.${ext}`)),
    'assets/fmd_stroke_mechanisms.png',
  ];
  const coreAssetMatch = serviceWorkerContent.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
  const coreAssets = coreAssetMatch ? vm.runInNewContext(coreAssetMatch[1]) : null;

  it('does not render, ship or precache withdrawn clinical figures', () => {
    expect(coreAssets).not.toBeNull();
    expect(coreAssets.length).toBeGreaterThan(0);
    for (const asset of WITHDRAWN_FIGURE_PATHS) {
      expect(educationContent, asset).not.toContain(asset);
      expect(fs.existsSync(path.join(repoRoot, asset)), asset).toBe(false);
      expect(coreAssets, asset).not.toContain(`./${asset}`);
    }
  });

  it('returns 410 for stale bookmarked figure URLs before consulting browser caches', async () => {
    const handlers = {};
    const origin = 'https://example.test';
    vm.runInNewContext(serviceWorkerContent, {
      self: { location: new URL(`${origin}/stroke/service-worker.js`), addEventListener: (name, fn) => { handlers[name] = fn; } },
      URL, Response,
      // These throwing stubs prove a withdrawn request cannot fall through to a stale cache or network.
      caches: { match: () => { throw new Error('Withdrawn figure reached cache'); }, open: () => { throw new Error('Withdrawn figure opened cache'); } },
      fetch: () => { throw new Error('Withdrawn figure reached network'); },
    });
    expect(typeof handlers.fetch).toBe('function');
    for (const asset of WITHDRAWN_FIGURE_PATHS) {
      for (const scope of ['', '/stroke']) {
        let responsePromise;
        handlers.fetch({ request: { url: `${origin}${scope}/${asset}`, method: 'GET' }, respondWith: result => { responsePromise = result; } });
        const response = await responsePromise;
        expect(response, asset).toBeDefined();
        expect(response.status, asset).toBe(410);
        expect(response.headers.get('Cache-Control'), asset).toBe('no-store');
      }
    }
  });

  it('keeps the PNG as the rendered source with the SVG as its error fallback', () => {
    // If this inverts, the precache trim above would silently cost the reader
    // the figure when offline before first view.
    expect(componentsContent).toContain('const activeSrc = hasError && fallbackSvgSrc ? fallbackSvgSrc : src;');
    expect(componentsContent).toContain('onError={() => setHasError(true)}');
  });

  it('verifies interactive lightbox zoom bounds (1.0x to 4.0x), scale display, and position resets', () => {
    expect(componentsContent).toContain('Math.min(4.0, prev + 0.5)');
    expect(componentsContent).toContain('Math.max(1.0, prev - 0.5)');
    expect(componentsContent).toContain('scale.toFixed(1)}x');
    expect(componentsContent).toContain('aria-live="polite"');
    expect(componentsContent).toContain('setPosition({ x: 0, y: 0 })');
  });

  it('verifies keyboard focus trap, shortcut listeners (+, -, 0, Esc, Tab), and focus restoration', () => {
    expect(componentsContent).toContain("if (e.key === 'Tab'");
    expect(componentsContent).toContain('previousActiveElementRef.current');
    expect(componentsContent).toContain('closeButtonRef.current.focus()');
    expect(componentsContent).toContain("if (e.key === 'Escape')");
    expect(componentsContent).toContain("if (e.key === '+' || e.key === '=')");
    expect(componentsContent).toContain("if (e.key === '-' || e.key === '_')");
    expect(componentsContent).toContain("if (e.key === '0')");
  });

  it('verifies visual figure card component keyboard triggers (Enter/Space), ARIA group role, and fallback error handling', () => {
    expect(componentsContent).toContain("role=\"button\"");
    expect(componentsContent).toContain("tabIndex={0}");
    expect(componentsContent).toContain("if (e.key === 'Enter' || e.key === ' ')");
    expect(componentsContent).toContain('hasError && fallbackSvgSrc ? fallbackSvgSrc : src');
    expect(componentsContent).toContain('onError={() => setHasError(true)}');
  });
});
