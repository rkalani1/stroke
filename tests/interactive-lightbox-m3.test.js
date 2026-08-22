import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
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

  it('integrates VisualAssetFigure across all 8 card views in education.jsx', () => {
    const assets = [
      'assets/toast_classification_infographic.png',
      'assets/dapt_flowchart_timeline.png',
      'assets/afib_timing_protocol.png',
      'assets/select_score_chart.png',
      'assets/ischemic_core_penumbra_render.png',
      'assets/aspects_10_regions_render.png',
      'assets/evt_lvo_occlusion_sites.png',
      'assets/hematoma_expansion_render.png',
    ];

    assets.forEach(asset => {
      expect(educationContent).toContain(asset);
    });
  });

  // v6.23.0 changed this contract deliberately. The 8 infographic PNGs are
  // 2400x1800 and total ~3.6 MB — 39% of what a first-time visitor used to
  // download before the app was offline-ready — and they are lazy-loaded, so
  // most visitors never open one. They now cache on first view via the
  // cache-first same-origin path in the service worker's fetch handler.
  //
  // Offline-before-first-view degrades gracefully rather than breaking:
  // VisualAssetFigure renders the PNG as `src` with the SVG as its `onError`
  // fallback, and the SVGs stay precached. They are genuine vector drawings
  // (41-114 shape/text nodes each, no embedded raster) totalling ~83 KB, so
  // the reader still gets the full figure.
  const VISUAL_ASSET_STEMS = [
    'toast_classification_infographic',
    'dapt_flowchart_timeline',
    'afib_timing_protocol',
    'select_score_chart',
    'ischemic_core_penumbra_render',
    'aspects_10_regions_render',
    'evt_lvo_occlusion_sites',
    'hematoma_expansion_render',
  ];

  it('precaches the SVG fallback for every visual asset so figures survive offline', () => {
    for (const stem of VISUAL_ASSET_STEMS) {
      expect(serviceWorkerContent).toContain(`'./assets/${stem}.svg'`);
    }
  });

  it('keeps the heavy PNG originals out of the install precache', () => {
    const match = serviceWorkerContent.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line no-eval
    const coreAssets = eval(match[1]);
    for (const stem of VISUAL_ASSET_STEMS) {
      expect(coreAssets).not.toContain(`./assets/${stem}.png`);
    }
  });

  it('keeps the PNG as the rendered source with the SVG as its error fallback', () => {
    // If this inverts, the precache trim above would silently cost the reader
    // the figure when offline before first view.
    expect(componentsContent).toContain('const activeSrc = hasError && fallbackSvgSrc ? fallbackSvgSrc : src;');
    expect(componentsContent).toContain('onError={() => setHasError(true)}');
  });

  it('ships every visual asset in both formats on disk', () => {
    for (const stem of VISUAL_ASSET_STEMS) {
      for (const ext of ['png', 'svg']) {
        expect(fs.existsSync(path.join(repoRoot, 'assets', `${stem}.${ext}`)), `assets/${stem}.${ext}`).toBe(true);
      }
    }
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
