import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Milestone M3-1: Interactive Lightbox & Visual Asset Integration', () => {
  const componentsPath = path.resolve('/Users/rizwankalani/stroke/src/components.jsx');
  const educationPath = path.resolve('/Users/rizwankalani/stroke/src/education.jsx');
  const serviceWorkerPath = path.resolve('/Users/rizwankalani/stroke/service-worker.js');

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

  it('integrates VisualAssetFigure across all 10 card views in education.jsx', () => {
    const assets = [
      'assets/toast_classification_infographic.png',
      'assets/dapt_flowchart_timeline.png',
      'assets/afib_timing_protocol.png',
      'assets/crao_emergency_workflow.png',
      'assets/select_score_chart.png',
      'assets/edema_swelling_risk.png',
      'assets/ischemic_core_penumbra_render.png',
      'assets/aspects_10_regions_render.png',
      'assets/evt_lvo_occlusion_sites.png',
      'assets/hematoma_expansion_render.png',
    ];

    assets.forEach(asset => {
      expect(educationContent).toContain(asset);
    });
  });

  it('precaches all 20 visual asset PNG and SVG files in service-worker.js', () => {
    const swAssets = [
      './assets/toast_classification_infographic.png',
      './assets/toast_classification_infographic.svg',
      './assets/dapt_flowchart_timeline.png',
      './assets/dapt_flowchart_timeline.svg',
      './assets/afib_timing_protocol.png',
      './assets/afib_timing_protocol.svg',
      './assets/crao_emergency_workflow.png',
      './assets/crao_emergency_workflow.svg',
      './assets/select_score_chart.png',
      './assets/select_score_chart.svg',
      './assets/edema_swelling_risk.png',
      './assets/edema_swelling_risk.svg',
      './assets/ischemic_core_penumbra_render.png',
      './assets/ischemic_core_penumbra_render.svg',
      './assets/aspects_10_regions_render.png',
      './assets/aspects_10_regions_render.svg',
      './assets/evt_lvo_occlusion_sites.png',
      './assets/evt_lvo_occlusion_sites.svg',
      './assets/hematoma_expansion_render.png',
      './assets/hematoma_expansion_render.svg'
    ];

    swAssets.forEach(asset => {
      expect(serviceWorkerContent).toContain(asset);
    });
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

