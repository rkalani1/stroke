// Guards the educational-use / no-PHI disclaimers in the SHIPPED bundle.
//
// A component that is defined but never rendered is tree-shaken out of app.js,
// so asserting on source files alone is not enough: this test reads the
// committed build output. It also pins the build-time public-demo gate — the
// committed app.js must be a public-demo build, never a private one.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PUBLIC_DEMO_BANNER_COPY,
  PUBLIC_DEMO_MODAL_COPY,
  PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX,
  SITE_FOOTER_DISCLAIMER_COPY
} from '../src/public-demo-guardrails.js';

const ROOT = path.resolve(__dirname, '..');
const bundle = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const appSource = fs.readFileSync(path.join(ROOT, 'src/app.jsx'), 'utf8');

describe('disclaimers ship in app.js', () => {
  it.each([
    ['public demo notice copy', PUBLIC_DEMO_BANNER_COPY],
    ['footer disclaimer copy', SITE_FOOTER_DISCLAIMER_COPY],
    ['public demo footer copy', PUBLIC_DEMO_MODAL_COPY],
    ['synthetic note prefix', PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX],
    ['footer heading', 'Educational use only']
  ])('bundle contains the %s', (_label, copy) => {
    expect(bundle).toContain(copy);
  });

  it('renders the notice and footer from the app shell (not just defines them)', () => {
    expect(appSource).toMatch(/\{PUBLIC_DEMO_MODE && <PHIBanner \/>\}/);
    expect(appSource).toMatch(/<SiteFooter appVersion=\{APP_VERSION\}/);
  });
});

describe('build-time public-demo gate', () => {
  it('the committed app.js is a public-demo build', () => {
    expect(bundle).toContain('stroke-public-demo-build');
    expect(bundle).not.toContain('stroke-private-build');
    expect(bundle).not.toContain('__STROKE_BUILD_PUBLIC_DEMO__');
  });

  it('getPublicDemoMode consults the build flag before any runtime heuristic', () => {
    const fn = appSource.slice(appSource.indexOf('const getPublicDemoMode = () => {'));
    const body = fn.slice(0, fn.indexOf('const PUBLIC_DEMO_MODE = getPublicDemoMode();'));
    expect(body.indexOf('if (BUILD_PUBLIC_DEMO) return true;')).toBeGreaterThan(-1);
    expect(body.indexOf('if (BUILD_PUBLIC_DEMO) return true;')).toBeLessThan(body.indexOf('github'));
  });

  it('refuses to write a private build over the committed app.js', () => {
    const res = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build-browser.mjs')], {
      cwd: ROOT,
      env: { ...process.env, STROKE_BUILD_TARGET: 'private', STROKE_BUILD_OUTFILE: 'app.js' },
      encoding: 'utf8'
    });
    expect(res.status).not.toBe(0);
    expect(`${res.stdout}${res.stderr}`).toMatch(/Refusing to write a private/);
  });
});
