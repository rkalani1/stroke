// Pins the build-time public-demo gate on the SHIPPED bundle: the committed
// app.js must be a public-demo build, never a private one, and the app shell
// carries the build marker the smoke run checks. The on-page demo notice and
// the disclaimer footer were removed by owner decision (v6.29.2); their copy
// must not creep back into the bundle.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX } from '../src/public-demo-guardrails.js';

const ROOT = path.resolve(__dirname, '..');
const browserAssets = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-assets.json'), 'utf8'));
const bundle = browserAssets.files.map(file => fs.readFileSync(path.join(ROOT, file.path), 'utf8')).join('\n');
const appSource = fs.readFileSync(path.join(ROOT, 'src/app.jsx'), 'utf8');

describe('on-page notice and footer (removed by owner decision)', () => {
  it.each([
    ['footer heading', 'Educational use only'],
    ['footer disclaimer', 'not endorsed by any named institution. Content summarizes'],
    ['footer public-site note', 'This public site is for synthetic education and reference only'],
    ['footer browser-only note', 'Runs entirely in your browser: no backend'],
    ['footer verification note', 'Verify every recommendation against the primary source and your approved local protocol'],
    ['notice label', 'Public demo notice']
  ])('bundle does not contain the %s', (_label, copy) => {
    expect(bundle).not.toContain(copy);
  });

  it('the app shell no longer renders the notice or footer components', () => {
    expect(appSource).not.toMatch(/<PHIBanner\b/);
    expect(appSource).not.toMatch(/<SiteFooter\b/);
  });

  it('keeps the owner-requested note labels while preserving the separate build gate', () => {
    expect(bundle).not.toContain(PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX);
    expect(bundle).toContain('Pulsara summary');
    expect(bundle).toContain('Epic note');
  });
});

describe('build-time public-demo gate', () => {
  it('the app shell carries the build marker', () => {
    expect(appSource).toMatch(/className="app-shell[^"]*" data-build=\{BUILD_TARGET_MARKER\}/);
  });

  it('the complete committed browser module graph is a public-demo build', () => {
    expect(browserAssets.buildTarget).toBe('public');
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

  it.each(['app.js', 'chunks/private.js', 'private-candidate.js'])('refuses to write a private build anywhere in the deployed tree: %s', outfile => {
    const res = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build-browser.mjs')], {
      cwd: ROOT,
      env: { ...process.env, STROKE_BUILD_TARGET: 'private', STROKE_BUILD_OUTFILE: outfile },
      encoding: 'utf8'
    });
    expect(res.status).not.toBe(0);
    expect(`${res.stdout}${res.stderr}`).toMatch(/Refusing to write a private/);
  });
});
