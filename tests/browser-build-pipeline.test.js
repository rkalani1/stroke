import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.resolve(__dirname, '..');
describe('generated browser module pipeline', () => {
  it('writes the exact graph and worker list, removes only obsolete generated chunks, and gates writes on clinical review', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-module-build-'));
    try {
      fs.mkdirSync(path.join(fixture, 'scripts'));
      fs.mkdirSync(path.join(fixture, 'src'));
      fs.symlinkSync(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
      for (const file of ['build-browser.mjs', 'atomic-write.mjs', 'browser-evidence-projection.mjs']) fs.copyFileSync(path.join(root, 'scripts', file), path.join(fixture, 'scripts', file));
      fs.copyFileSync(path.join(root, 'src/jsx-factory.js'), path.join(fixture, 'src/jsx-factory.js'));
      fs.copyFileSync(path.join(root, 'src/reference-search.js'), path.join(fixture, 'src/reference-search.js'));
      const gate = path.join(fixture, 'scripts/check-clinical-claims.mjs');
      fs.writeFileSync(gate, 'export const runClinicalClaimCheck = () => ({ok:true});');
      fs.writeFileSync(path.join(fixture, 'package.json'), '{"version":"0.0.0"}');
      fs.writeFileSync(path.join(fixture, 'index.html'), '<!-- BEGIN GENERATED INITIAL MODULE PRELOADS -->\n<!-- END GENERATED INITIAL MODULE PRELOADS -->');
      fs.writeFileSync(path.join(fixture, 'service-worker.js'), '// BEGIN GENERATED APP CHUNKS\nconst APP_CHUNKS = [];\n// END GENERATED APP CHUNKS\n// BEGIN GENERATED REFERENCE VALIDATION\n// END GENERATED REFERENCE VALIDATION\n');
      fs.writeFileSync(path.join(fixture, 'src/app.jsx'), "import {shared} from './shared.js'; window.initial = shared; window.loadReference = () => import('./reference.js');");
      fs.writeFileSync(path.join(fixture, 'src/shared.js'), 'export const shared = {version: 1};');
      fs.writeFileSync(path.join(fixture, 'src/reference.js'), "import {shared} from './shared.js'; export const reference = {shared, title: 'first'};");
      const run = () => spawnSync(process.execPath, ['scripts/build-browser.mjs'], { cwd: fixture, encoding: 'utf8', env: { ...process.env, STROKE_BUILD_TARGET: 'public', STROKE_BUILD_OUTFILE: 'app.js' } });
      const built = run();
      expect(built.status, built.stderr).toBe(0);
      const readManifest = () => JSON.parse(fs.readFileSync(path.join(fixture, 'app-assets.json'), 'utf8'));
      const first = readManifest();
      expect(first.buildTarget).toBe('public');
      expect(first.initial).toContain('app.js');
      expect(first.files.length).toBeGreaterThan(first.initial.length);
      const preloads = () => [...fs.readFileSync(path.join(fixture, 'index.html'), 'utf8').matchAll(/rel="modulepreload" href="([^"]+)"/g)].map(match => match[1]);
      expect(preloads()).toEqual(first.initial.filter(file => file !== first.entry));
      expect(first.files.filter(file => !first.initial.includes(file.path)).every(file => !preloads().includes(file.path))).toBe(true);
      for (const file of first.files) {
        const bytes = fs.readFileSync(path.join(fixture, file.path));
        expect(bytes.length).toBe(file.bytes);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      }
      const chunkList = JSON.parse(fs.readFileSync(path.join(fixture, 'service-worker.js'), 'utf8').match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1]);
      expect(chunkList).toEqual(first.files.filter(file => file.path !== 'app.js').map(file => './' + file.path));
      fs.writeFileSync(path.join(fixture, 'chunks/keep-not-generated.txt'), 'keep');
      fs.writeFileSync(path.join(fixture, 'src/reference.js'), "import {shared} from './shared.js'; export const reference = {shared, title: 'second'};");
      fs.writeFileSync(path.join(fixture, 'src/shared.js'), 'export const shared = {version: 2};');
      expect(run().status).toBe(0);
      const next = readManifest();
      expect(preloads()).toEqual(next.initial.filter(file => file !== next.entry));
      expect(preloads()).not.toEqual(first.initial.filter(file => file !== first.entry));
      const retired = first.files.filter(file => file.path.startsWith('chunks/') && !next.files.some(current => current.path === file.path));
      expect(retired.length).toBeGreaterThan(0);
      expect(retired.every(file => !fs.existsSync(path.join(fixture, file.path)))).toBe(true);
      expect(fs.readFileSync(path.join(fixture, 'chunks/keep-not-generated.txt'), 'utf8')).toBe('keep');
      const before = fs.readFileSync(path.join(fixture, 'app.js'), 'utf8');
      const shellBefore = fs.readFileSync(path.join(fixture, 'index.html'), 'utf8');
      const workerBefore = fs.readFileSync(path.join(fixture, 'service-worker.js'), 'utf8');
      const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-isolated-build-'));
      try {
        for (const [target, output] of [['public', path.join(fixture, 'preview/app.js')], ['private', path.join(isolated, 'app.js')]]) {
          const isolatedBuild = spawnSync(process.execPath, ['scripts/build-browser.mjs'], { cwd: fixture, encoding: 'utf8', env: { ...process.env, STROKE_BUILD_TARGET: target, STROKE_BUILD_OUTFILE: output } });
          expect(isolatedBuild.status, isolatedBuild.stderr).toBe(0);
          expect(JSON.parse(fs.readFileSync(path.join(path.dirname(output), 'app-assets.json'), 'utf8')).buildTarget).toBe(target);
          expect(fs.readFileSync(path.join(fixture, 'index.html'), 'utf8')).toBe(shellBefore);
          expect(fs.readFileSync(path.join(fixture, 'service-worker.js'), 'utf8')).toBe(workerBefore);
          expect(readManifest()).toEqual(next);
        }
      } finally { fs.rmSync(isolated, { recursive: true, force: true }); }
      fs.writeFileSync(gate, "export const runClinicalClaimCheck = () => ({ok:false, findings:[{severity:'critical',code:'changed-source',message:'Review this source',affected:['source:test']}]});");
      fs.writeFileSync(path.join(fixture, 'src/app.jsx'), "window.initial = 'unreviewed';");
      const blocked = run();
      expect(blocked.status).not.toBe(0);
      expect(blocked.stderr).toContain('Clinical claim review must pass');
      expect(blocked.stderr).toContain('source:test');
      expect(fs.readFileSync(path.join(fixture, 'app.js'), 'utf8')).toBe(before);
      expect(readManifest()).toEqual(next);
      expect(fs.readFileSync(path.join(fixture, 'index.html'), 'utf8')).toBe(shellBefore);
    } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
  });
});
